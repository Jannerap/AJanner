// News Ticker Module
class NewsTicker {
    constructor(options = {}) {
        const computedDefaultEndpoint = (typeof window !== 'undefined' && window.NEWS_API_ENDPOINT)
            ? window.NEWS_API_ENDPOINT
            : ((typeof location !== 'undefined' && location.hostname && location.hostname !== 'localhost' && location.hostname !== '127.0.0.1')
                ? 'https://ajanner.onrender.com/api/news'
                : '/api/news');

        this.options = {
            target: options.target || '#news-ticker',
            endpoint: options.endpoint || computedDefaultEndpoint,
            speed: options.speed || 60, // pixels per second
            gap: options.gap || 48, // gap between headlines
            pauseOnHover: options.pauseOnHover !== false,
            direction: options.direction || 'ltr',
            fontCss: options.fontCss || null,
            maxHeadlines: options.maxHeadlines || 50
        };

        this.container = null;
        this.ticker = null;
        this.headlines = [];
        this.isPaused = false;
        this.animationId = null;
        this.currentPosition = 0;
        this.lastUpdate = 0;
        this.offlineMode = false;
        this.currentService = 'news';

        this.init();
    }

    async init() {
        try {
            this.container = document.querySelector(this.options.target);
            if (!this.container) {
                console.error(`News ticker target not found: ${this.options.target}`);
                return;
            }

            // Load custom font if specified
            if (this.options.fontCss) {
                await this.loadFont(this.options.fontCss);
            }

            this.setupTicker();
            this.loadHeadlines();
            this.startAnimation();

            // Set up periodic refresh
            setInterval(() => this.loadHeadlines(), 300000); // 5 minutes

        } catch (error) {
            console.error('Failed to initialize news ticker:', error);
        }
    }

    async loadFont(fontCss) {
        return new Promise((resolve, reject) => {
            const link = document.createElement('link');
            link.rel = 'stylesheet';
            link.href = fontCss;
            link.onload = resolve;
            link.onerror = reject;
            document.head.appendChild(link);
        });
    }

    setupTicker() {
        // Create ticker structure
        this.container.innerHTML = `
            <div class="news-ticker-container">
                <div class="news-ticker-content">
                    <div class="news-ticker-track">
                        <div class="news-ticker-list"></div>
                    </div>
                </div>
                <div class="news-service-selector">
                    <button class="news-service-button" id="news-service-btn">Sports</button>
                </div>
                <div class="news-ticker-offline" style="display: none;">📡 Offline</div>
            </div>
        `;

        console.log('Ticker HTML created, checking elements...');
        console.log('Service options container:', this.container.querySelector('.news-service-options'));
        console.log('Service option buttons:', this.container.querySelectorAll('.news-service-option-btn'));
        console.log('Main service button:', this.container.querySelector('#news-service-btn'));

        this.ticker = this.container.querySelector('.news-ticker-track');
        this.tickerList = this.container.querySelector('.news-ticker-list');
        this.offlineBadge = this.container.querySelector('.news-ticker-offline');

        // Set up hover events
        if (this.options.pauseOnHover) {
            this.container.addEventListener('mouseenter', () => this.pause());
            this.container.addEventListener('mouseleave', () => this.resume());
        }

        // Set direction
        if (this.options.direction === 'rtl') {
            this.ticker.style.direction = 'rtl';
        }

        // Set up news service selector
        this.setupServiceSelector();
    }

    setupServiceSelector() {
        const serviceBtn = this.container.querySelector('#news-service-btn');
        
        console.log('Setting up service selector:', { serviceBtn });

        // Define the cycling order
        this.serviceCycle = [
            { service: 'sports', label: 'Sports', emoji: '⚽' },
            { service: 'local', label: 'Local', emoji: '🏠' },
            { service: 'news', label: 'News', emoji: '📰' },
            { service: 'weather', label: 'Weather', emoji: '🌤️' },
            { service: 'tweets', label: 'Tweets', emoji: '🐦' },
            { service: 'entertainment', label: 'Entertainment', emoji: '🎬' }
        ];
        
        this.currentServiceIndex = 0; // Start with Sports
        this.currentService = 'sports';
        this.isLoading = false; // Track loading state

        // Handle button click to cycle through services or show ticker if hidden
        serviceBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            
            // Prevent action if currently loading
            if (this.isLoading) {
                console.log('Service switch blocked - currently loading');
                // Add visual feedback that button is disabled
                serviceBtn.style.transform = 'scale(0.95)';
                setTimeout(() => {
                    serviceBtn.style.transform = '';
                }, 150);
                return;
            }
            
            // If ticker is hidden (showing 📤), show it back
            if (this.container.querySelector('.news-ticker-content').classList.contains('hidden')) {
                this.toggleTickerVisibility();
            } else {
                // Otherwise cycle through services
                this.cycleToNextService();
            }
        });

        // Double click hides/shows the ticker content (but keeps button visible)
        serviceBtn.addEventListener('dblclick', (e) => {
            e.stopPropagation();
            if (!this.isLoading) {
                this.toggleTickerVisibility();
            }
        });
    }

    cycleToNextService() {
        // Prevent multiple rapid clicks
        if (this.isLoading) {
            console.log('Service switch already in progress');
            return;
        }
        
        // Set loading state
        this.isLoading = true;
        const serviceBtn = this.container.querySelector('#news-service-btn');
        
        // Update button to show loading state
        serviceBtn.textContent = '⏳';
        serviceBtn.classList.add('loading');
        
        // Clear any existing headlines before switching
        this.headlines = [];
        if (this.tickerList) {
            this.tickerList.innerHTML = '';
        }
        
        // Move to next service in cycle
        this.currentServiceIndex = (this.currentServiceIndex + 1) % this.serviceCycle.length;
        const nextService = this.serviceCycle[this.currentServiceIndex];
        
        // Update current service
        this.currentService = nextService.service;
        
        console.log(`🔄 Switching to service: ${nextService.service}`);
        
        // Load headlines for the new service
        this.loadHeadlines().finally(() => {
            // Restore button state after loading completes (success or error)
            this.isLoading = false;
            serviceBtn.textContent = nextService.label;
            serviceBtn.classList.remove('loading');
        }).catch((error) => {
            // Additional error handling to ensure button state is restored
            console.error('Error loading headlines:', error);
            this.isLoading = false;
            serviceBtn.textContent = nextService.label;
            serviceBtn.classList.remove('loading');
        });
    }



    async loadHeadlines() {
        // Set loading state if this is a service switch
        if (this.isLoading) {
            const serviceBtn = this.container.querySelector('#news-service-btn');
            if (serviceBtn) {
                serviceBtn.classList.add('loading');
            }
        }
        
        try {
            // Clear existing headlines immediately when switching services
            this.headlines = [];
            
            // Build endpoint based on selected service
            let endpoint = this.options.endpoint;
            if (this.currentService && this.currentService !== 'news') {
                endpoint = `${this.options.endpoint}?service=${this.currentService}`;
            }

            console.log(`🔄 Loading headlines for service: ${this.currentService} from ${endpoint}`);

            const response = await fetch(endpoint);
            if (!response.ok) throw new Error(`HTTP ${response.status}`);
            
            const headlines = await response.json();
            console.log(`✅ Received ${headlines.length} headlines for ${this.currentService}`);
            
            // Sort headlines with Plymouth sources first, then by timestamp (most recent first)
            this.headlines = headlines
                .sort((a, b) => {
                    // Priority 1: Plymouth sources first (for sports service)
                    if (this.currentService === 'sports') {
                        const aIsPlymouth = (a.source || '').toLowerCase().includes('plymouth') || 
                                          (a.source || '').toLowerCase().includes('pafc');
                        const bIsPlymouth = (b.source || '').toLowerCase().includes('plymouth') || 
                                          (b.source || '').toLowerCase().includes('pafc');
                        
                        if (aIsPlymouth && !bIsPlymouth) return -1;
                        if (!aIsPlymouth && bIsPlymouth) return 1;
                    }
                    
                    // Priority 2: Most recent first
                    return (b.ts || 0) - (a.ts || 0);
                })
                .slice(0, this.options.maxHeadlines);
            
            this.offlineMode = false;
            this.offlineBadge.style.display = 'none';
            
            this.renderHeadlines();
            this.lastUpdate = Date.now();
            
            console.log(`📰 Rendered ${this.headlines.length} headlines for ${this.currentService}`);

        } catch (error) {
            console.warn('Failed to fetch headlines, using cached data:', error.message);
            this.offlineMode = true;
            this.offlineBadge.style.display = 'block';

            // Clear current headlines to avoid reusing previous service data
            this.headlines = [];

            // Prefer service-specific local .txt fallback first
            await this.loadFallbackFromTxt();

            // If fallback failed/empty, then try localStorage cache as a last resort
            if (!this.headlines || this.headlines.length === 0) {
                this.loadFromCache();
            }

            // Render whatever we could recover
            if (this.headlines && this.headlines.length > 0) {
                this.renderHeadlines();
            }
        }
    }

    loadFromCache() {
        try {
            const cacheKey = `news-ticker-cache-${this.currentService}`;
            const cached = localStorage.getItem(cacheKey);
            if (cached) {
                const data = JSON.parse(cached);
                if (Date.now() - data.timestamp < 3600000) { // 1 hour old
                    console.log(`📋 Loading ${data.headlines.length} cached headlines for ${this.currentService}`);
                    this.headlines = data.headlines;
                    this.renderHeadlines();
                } else {
                    console.log(`⏰ Cache expired for ${this.currentService}, clearing...`);
                    localStorage.removeItem(cacheKey);
                }
            } else {
                console.log(`📭 No cache found for ${this.currentService}`);
            }
        } catch (error) {
            console.warn('Failed to load cached headlines:', error);
        }
    }

    saveToCache() {
        try {
            const cacheKey = `news-ticker-cache-${this.currentService}`;
            localStorage.setItem(cacheKey, JSON.stringify({
                headlines: this.headlines,
                timestamp: Date.now()
            }));
        } catch (error) {
            console.warn('Failed to save headlines to cache:', error);
        }
    }

    async loadFallbackFromTxt() {
        const map = {
            sports: 'news-sports.txt',
            local: 'news-local.txt',
            news: 'news.txt',
            weather: 'news-weather.txt',
            tweets: 'news-tweets.txt',
            entertainment: 'news-entertainment.txt'
        };
        const file = map[this.currentService] || 'news.txt';
        const backupFile = `backup-${file}`;
        try {
            // Try backup first (project root then relative)
            let res = await fetch(`/${backupFile}`);
            if (!res.ok) {
                res = await fetch(backupFile);
            }
            // If backup not available, try primary (project root then relative)
            if (!res.ok) {
                res = await fetch(`/${file}`);
                if (!res.ok) {
                    res = await fetch(file);
                }
            }
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            const text = await res.text();
            const lines = text
                .split('\n')
                .map(l => l.trim())
                .filter(l => l && !l.startsWith('#'));

            // Special handling for JSON directives across all services
            // Support: `json-file <path.json>` or service-specific e.g. `tweets-file <path>`
            const serviceSpecificDirective = `${this.currentService}-file`;
            const directive = lines.find(l => l.toLowerCase().startsWith(serviceSpecificDirective))
                || lines.find(l => l.toLowerCase().startsWith('json-file'))
                || null;
            if (directive) {
                const parts = directive.split(/\s+/);
                const jsonPath = parts[1];
                if (jsonPath) {
                    try {
                        let jsonRes = await fetch(jsonPath.startsWith('/') ? jsonPath : `/${jsonPath}`);
                        if (!jsonRes.ok) {
                            jsonRes = await fetch(jsonPath);
                        }
                        if (!jsonRes.ok) throw new Error(`HTTP ${jsonRes.status}`);
                        const data = await jsonRes.json();
                        const items = Array.isArray(data) ? data : (Array.isArray(data.items) ? data.items : (Array.isArray(data.tweets) ? data.tweets : []));
                        const now = Date.now();

                        // Map different services' JSON structures to headlines
                        const mapItemToHeadline = (item) => {
                            switch (this.currentService) {
                                case 'tweets':
                                    return {
                                        source: 'TWITTER',
                                        title: `${item.hashtag || ''} @${item.username || 'user'}: ${item.comment || item.text || ''}`.trim(),
                                        url: item.username ? `https://twitter.com/${item.username}` : (item.url || '#'),
                                        ts: now
                                    };
                                case 'sports':
                                case 'local':
                                case 'news':
                                case 'weather':
                                case 'entertainment':
                                default:
                                    return {
                                        source: (item.source || this.currentService).toString().toUpperCase(),
                                        title: item.title || item.text || item.headline || '',
                                        url: item.url || '#',
                                        ts: item.ts || now
                                    };
                            }
                        };

                        this.headlines = items.slice(0, this.options.maxHeadlines).map(mapItemToHeadline);
                        console.info(`Loaded ${this.headlines.length} items from ${jsonPath} (offline fallback)`);
                    } catch (err) {
                        console.warn('Failed to load JSON from directive, falling back to plain lines:', err.message);
                    }
                }
            }

            // If no directive or it failed, but a line points directly to a .json, try that
            if (!this.headlines || this.headlines.length === 0) {
                const jsonLine = lines.find(l => /\.json(\s|$)/i.test(l));
                if (jsonLine) {
                    const jsonPath = jsonLine.split(/\s+/)[0];
                    try {
                        let jsonRes = await fetch(jsonPath.startsWith('/') ? jsonPath : `/${jsonPath}`);
                        if (!jsonRes.ok) {
                            jsonRes = await fetch(jsonPath);
                        }
                        if (!jsonRes.ok) throw new Error(`HTTP ${jsonRes.status}`);
                        const data = await jsonRes.json();
                        const items = Array.isArray(data) ? data : (Array.isArray(data.items) ? data.items : (Array.isArray(data.tweets) ? data.tweets : []));
                        const now = Date.now();
                        const mapItemToHeadline = (item) => ({
                            source: (item.source || this.currentService).toString().toUpperCase(),
                            title: item.title || `${item.hashtag || ''} @${item.username || 'user'}: ${item.comment || item.text || ''}`.trim(),
                            url: item.url || (item.username ? `https://twitter.com/${item.username}` : '#'),
                            ts: item.ts || now
                        });
                        this.headlines = items.slice(0, this.options.maxHeadlines).map(mapItemToHeadline);
                        console.info(`Loaded ${this.headlines.length} items from ${jsonPath} (offline fallback direct .json)`);
                    } catch (err) {
                        console.warn('Failed to load direct JSON line, will fall back to plain lines:', err.message);
                    }
                }
            }

            // If not tweets or directive failed, fall back to plain lines
            if (!this.headlines || this.headlines.length === 0) {
                const now = Date.now();
                this.headlines = lines.slice(0, this.options.maxHeadlines).map(line => ({
                    source: this.currentService.toUpperCase(),
                    title: line,
                    url: '#',
                    ts: now
                }));
            }

            console.info(`Loaded ${this.headlines.length} fallback headlines from ${res.url.includes('backup-') ? backupFile : file}`);
        } catch (e) {
            console.warn('Fallback .txt load failed:', e.message);
        }
    }

    renderHeadlines() {
        if (!this.tickerList || this.headlines.length === 0) {
            console.log('⚠️ No headlines to render or ticker list not found');
            return;
        }

        console.log(`🎨 Rendering ${this.headlines.length} headlines for ${this.currentService}`);

        // Clear existing content completely
        this.tickerList.innerHTML = '';

        // Create headline elements
        const headlineElements = this.headlines.map((headline, index) => {
            const element = document.createElement('div');
            element.className = 'news-ticker-item';
            element.innerHTML = `
                <span class="news-source">${this.sanitizeText(headline.source)}</span>
                <span class="news-separator">•</span>
                <a href="${headline.url}" target="_blank" class="news-title-link">
                    <span class="news-title">${this.sanitizeText(headline.title)}</span>
                </a>
                <span class="news-time">${this.formatTimeAgo(headline.ts)}</span>
            `;
            
            // Add data attributes for debugging
            element.setAttribute('data-index', index);
            element.setAttribute('data-service', this.currentService);
            element.setAttribute('data-timestamp', headline.ts);
            
            return element;
        });

        // Populate with new headlines
        headlineElements.forEach(element => {
            this.tickerList.appendChild(element.cloneNode(true));
        });

        // Duplicate for seamless loop
        headlineElements.forEach(element => {
            this.tickerList.appendChild(element.cloneNode(true));
        });

        // Save to service-specific cache
        this.saveToCache();

        // Reset position for new content
        this.currentPosition = 0;
        
        console.log(`✅ Successfully rendered ${headlineElements.length * 2} headline elements for ${this.currentService}`);
    }

    sanitizeText(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    formatTimeAgo(timestamp) {
        const now = Date.now();
        const diff = now - timestamp;
        const minutes = Math.floor(diff / 60000);
        const hours = Math.floor(diff / 3600000);
        const days = Math.floor(diff / 86400000);

        if (minutes < 1) return 'now';
        if (minutes < 60) return `${minutes}m ago`;
        if (hours < 24) return `${hours}h ago`;
        return `${days}d ago`;
    }

    startAnimation() {
        if (this.animationId) return;
        
        const animate = () => {
            if (this.isPaused) {
                this.animationId = requestAnimationFrame(animate);
                return;
            }

            this.currentPosition -= this.options.speed / 60; // 60fps

            // Check if we need to loop
            const tickerWidth = this.tickerList.scrollWidth / 2;
            if (Math.abs(this.currentPosition) >= tickerWidth) {
                this.currentPosition = 0;
            }

            this.ticker.style.transform = `translateX(${this.currentPosition}px)`;
            this.animationId = requestAnimationFrame(animate);
        };

        animate();
    }

    pause() {
        this.isPaused = true;
        this.container.classList.add('paused');
    }

    resume() {
        this.isPaused = false;
        this.container.classList.remove('paused');
    }

    toggleTickerVisibility() {
        const tickerContent = this.container.querySelector('.news-ticker-content');
        const tickerContainer = this.container.querySelector('.news-ticker-container');
        const serviceBtn = this.container.querySelector('#news-service-btn');
        const isHidden = tickerContent.classList.contains('hidden');
        
        if (isHidden) {
            // Show ticker content and background
            tickerContent.classList.remove('hidden');
            tickerContainer.style.background = '';
            tickerContainer.style.border = '';
            // Restore original button text and styling
            const currentService = this.serviceCycle[this.currentServiceIndex];
            serviceBtn.textContent = currentService.label;
            serviceBtn.style.border = '';
            console.log('News ticker content shown');
        } else {
            // Hide ticker content and background but keep button visible
            tickerContent.classList.add('hidden');
            tickerContainer.style.background = 'transparent';
            tickerContainer.style.border = 'none';
            // Show indicator that ticker is hidden and restore button border
            serviceBtn.textContent = '📤';
            serviceBtn.style.border = '2px solid #8FE04A';
            console.log('News ticker content hidden');
        }
    }

    destroy() {
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
        }
        if (this.container) {
            this.container.innerHTML = '';
        }
    }

    // Public methods for external control
    setSpeed(speed) {
        this.options.speed = speed;
    }

    setDirection(direction) {
        this.options.direction = direction;
        if (this.ticker) {
            this.ticker.style.direction = direction;
        }
    }

    refresh() {
        console.log(`🔄 Force refreshing headlines for ${this.currentService}`);
        // Clear existing headlines and force fresh load
        this.headlines = [];
        if (this.tickerList) {
            this.tickerList.innerHTML = '';
        }
        this.loadHeadlines();
    }
}

// Global initialization function
function initNewsTicker(options = {}) {
    return new NewsTicker(options);
}

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { NewsTicker, initNewsTicker };
} else {
    window.NewsTicker = NewsTicker;
    window.initNewsTicker = initNewsTicker;
}

// News Ticker Module
class NewsTicker {
    constructor(options = {}) {
        this.options = {
            target: options.target || '#news-ticker',
            endpoint: options.endpoint || '/api/news',
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
            { service: 'tweets', label: 'Tweets', emoji: '🐦' }
        ];
        
        this.currentServiceIndex = 0; // Start with Sports
        this.currentService = 'sports';

        // Handle button click to cycle through services or show ticker if hidden
        serviceBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            
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
            this.toggleTickerVisibility();
        });
    }

    cycleToNextService() {
        // Move to next service in cycle
        this.currentServiceIndex = (this.currentServiceIndex + 1) % this.serviceCycle.length;
        const nextService = this.serviceCycle[this.currentServiceIndex];
        
        // Update button text and current service
        const serviceBtn = this.container.querySelector('#news-service-btn');
        serviceBtn.textContent = nextService.label;
        this.currentService = nextService.service;
        
        console.log('Cycled to service:', nextService.service);
        
        // Load headlines for the new service
        this.loadHeadlines();
    }



    async loadHeadlines() {
        try {
            // Build endpoint based on selected service
            let endpoint = this.options.endpoint;
            if (this.currentService && this.currentService !== 'news') {
                endpoint = `${this.options.endpoint}?service=${this.currentService}`;
            }

            const response = await fetch(endpoint);
            if (!response.ok) throw new Error(`HTTP ${response.status}`);
            
            const headlines = await response.json();
            this.headlines = headlines.slice(0, this.options.maxHeadlines);
            this.offlineMode = false;
            this.offlineBadge.style.display = 'none';
            
            this.renderHeadlines();
            this.lastUpdate = Date.now();

        } catch (error) {
            console.warn('Failed to fetch headlines, using cached data:', error.message);
            this.offlineMode = true;
            this.offlineBadge.style.display = 'block';
            
            // Try to load from localStorage as fallback
            this.loadFromCache();
        }
    }

    loadFromCache() {
        try {
            const cached = localStorage.getItem('news-ticker-cache');
            if (cached) {
                const data = JSON.parse(cached);
                if (Date.now() - data.timestamp < 3600000) { // 1 hour old
                    this.headlines = data.headlines;
                    this.renderHeadlines();
                }
            }
        } catch (error) {
            console.warn('Failed to load cached headlines:', error);
        }
    }

    saveToCache() {
        try {
            localStorage.setItem('news-ticker-cache', JSON.stringify({
                headlines: this.headlines,
                timestamp: Date.now()
            }));
        } catch (error) {
            console.warn('Failed to save headlines to cache:', error);
        }
    }

    renderHeadlines() {
        if (!this.tickerList || this.headlines.length === 0) return;

        // Create headline elements
        const headlineElements = this.headlines.map(headline => {
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
            
            return element;
        });

        // Clear and populate
        this.tickerList.innerHTML = '';
        headlineElements.forEach(element => {
            this.tickerList.appendChild(element.cloneNode(true));
        });

        // Duplicate for seamless loop
        headlineElements.forEach(element => {
            this.tickerList.appendChild(element.cloneNode(true));
        });

        // Save to cache
        this.saveToCache();

        // Reset position for new content
        this.currentPosition = 0;
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

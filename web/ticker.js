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

            // Load and apply user preferences before first fetch
            this.loadPreferences();
            this.applyPreferences();
            this.syncSettingsControls && this.syncSettingsControls();
            
            console.log(`🎯 News ticker initialized with service: ${this.currentService} (index: ${this.currentServiceIndex})`);

            // Show initial loading state on first fetch
            const serviceBtn = this.container.querySelector('#news-service-btn');
            this.isLoading = true;
            if (serviceBtn) {
                serviceBtn.textContent = '↻';
                serviceBtn.classList.add('loading');
            }

            // Force start with sports on first load, regardless of cache
            if (!this.preferences.hasOwnProperty('service')) {
                this.currentServiceIndex = 0;
                this.currentService = 'sports';
                console.log('🔄 Forcing initial load to Sports section');
            }
            
            // Perform initial load with spinner, then restore button state
            await this.loadHeadlines().catch((err) => {
                console.error('Initial headlines load failed:', err);
            });
            this.isLoading = false;
            if (serviceBtn && this.serviceCycle && typeof this.currentServiceIndex === 'number') {
                const currentService = this.serviceCycle[this.currentServiceIndex];
                serviceBtn.textContent = currentService ? currentService.label : 'Sports';
                serviceBtn.classList.remove('loading');
            }

            this.startAnimation();

            // Set up periodic refresh (every 10 minutes)
            setInterval(() => this.loadHeadlines(), 600000); // 10 minutes

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
        // Set up settings panel (appended to body to avoid clipping/z-index issues)
        this.setupSettingsPanel();
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

        // Right-click opens settings panel
        serviceBtn.addEventListener('contextmenu', (e) => {
            e.preventDefault();
            e.stopPropagation();
            this.openSettingsPanel(e);
        });
    }

    setupSettingsPanel() {
        this.preferences = this.preferences || {
            visible: true,
            service: 'sports',
            headlineColor: '#ffffff',
            speed: this.options.speed
        };

        // Build panel in document.body to ensure top-level stacking context
        let panel = document.getElementById('news-settings-panel');
        if (!panel) {
            panel = document.createElement('div');
            panel.id = 'news-settings-panel';
            panel.className = 'news-settings-panel';
            panel.style.display = 'none';
            panel.innerHTML = `
                                    <div class="news-settings-header">
                        <span>News Settings</span>
                        <button id="news-settings-reset" title="Reset to Sports" style="background: #4CAF50; color: white; border: none; padding: 4px 8px; border-radius: 3px; cursor: pointer; font-size: 10px; margin-right: 5px;">⏼</button>
                        <button class="news-settings-close" id="news-settings-close" title="Close">✕</button>
                    </div>
                <div class="news-settings-body">
                    <label class="news-settings-row">
                        <span>Show Ticker</span>
                        <input type="checkbox" id="news-settings-visible" checked />
                    </label>
                    <label class="news-settings-row">
                        <span>Section</span>
                        <select id="news-settings-service">
                            <option value="sports">Sports</option>
                            <option value="local">Local</option>
                            <option value="news">News</option>
                            <option value="weather">Weather</option>
                            <option value="tweets">Tweets</option>
                            <option value="entertainment">Entertainment</option>
                        </select>
                    </label>
                    <label class="news-settings-row">
                        <span>Headline Color</span>
                        <input type="color" id="news-settings-color" value="#ffffff" />
                    </label>
                    <label class="news-settings-row">
                        <span>Speed</span>
                        <input type="range" id="news-settings-speed" min="20" max="200" step="2" />
                        <span id="news-settings-speed-value" class="news-settings-value"></span>
                    </label>
                </div>`;
            document.body.appendChild(panel);
        }

        const closeBtn = panel.querySelector('#news-settings-close');
        const visibleEl = panel.querySelector('#news-settings-visible');
        const serviceEl = panel.querySelector('#news-settings-service');
        const colorEl = panel.querySelector('#news-settings-color');
        const speedEl = panel.querySelector('#news-settings-speed');
        const speedVal = panel.querySelector('#news-settings-speed-value');
        const resetBtn = panel.querySelector('#news-settings-reset');

        // Initialize controls from preferences
        if (visibleEl) visibleEl.checked = !!this.preferences.visible;
        if (serviceEl) serviceEl.value = this.preferences.service || 'sports';
        if (colorEl) colorEl.value = this.preferences.headlineColor || '#ffffff';
        if (speedEl) {
            speedEl.value = String(this.preferences.speed || this.options.speed);
            if (speedVal) speedVal.textContent = `${speedEl.value}px/s`;
        }

        // Wire up events
        if (closeBtn) closeBtn.addEventListener('click', () => this.closeSettingsPanel());
        if (visibleEl) visibleEl.addEventListener('change', () => {
            this.setTickerVisible(visibleEl.checked);
            this.preferences.visible = visibleEl.checked;
            this.savePreferences();
        });
        if (serviceEl) serviceEl.addEventListener('change', async () => {
            const selected = serviceEl.value;
            await this.switchToService(selected);
            this.preferences.service = selected;
            this.savePreferences();
            
            // Ensure the current service index is properly set
            const idx = this.serviceCycle.findIndex(s => s.service === selected);
            if (idx >= 0) {
                this.currentServiceIndex = idx;
                console.log(`🔄 Service changed via settings to: ${selected} (index: ${idx})`);
            }
        });
        if (colorEl) colorEl.addEventListener('input', () => {
            this.setHeadlineColor(colorEl.value);
            this.preferences.headlineColor = colorEl.value;
            this.savePreferences();
        });
        if (speedEl) speedEl.addEventListener('input', () => {
            const v = parseInt(speedEl.value, 10) || this.options.speed;
            this.setSpeed(v);
            if (speedVal) speedVal.textContent = `${v}px/s`;
            this.preferences.speed = v;
            this.savePreferences();
        });
        
        if (resetBtn) resetBtn.addEventListener('click', () => {
            this.resetToSports();
            // Update the dropdown to show sports
            if (serviceEl) serviceEl.value = 'sports';
        });

        // Close panel when clicking outside
        document.addEventListener('click', (e) => {
            if (!panel || panel.style.display === 'none') return;
            const btn = this.container.querySelector('#news-service-btn');
            if (!panel.contains(e.target) && e.target !== btn) {
                this.closeSettingsPanel();
            }
        });
    }

    openSettingsPanel(e) {
        const panel = document.getElementById('news-settings-panel');
        if (!panel) return;
        
        // Always sync controls to current state before showing panel
        this.syncSettingsControls();
        
        panel.style.display = 'block';
        // Position near click but clamped inside container
        const vw = Math.max(document.documentElement.clientWidth || 0, window.innerWidth || 0);
        const vh = Math.max(document.documentElement.clientHeight || 0, window.innerHeight || 0);
        const x = Math.min(Math.max(10, e.clientX), vw - 270);
        const y = Math.min(Math.max(10, e.clientY), vh - 220);
        panel.style.left = `${x}px`;
        panel.style.top = `${y}px`;
        panel.style.right = 'auto';
        panel.style.bottom = 'auto';

        // Start/Reset auto-close timer (30s)
        this._startSettingsPanelTimer(30000);

        // Attach activity listeners to reset timer on interaction
        this._attachPanelActivityListeners(panel);
    }

    closeSettingsPanel() {
        const panel = document.getElementById('news-settings-panel');
        if (panel) panel.style.display = 'none';
        // Clear any running auto-close timer
        if (this._settingsPanelTimeout) {
            clearTimeout(this._settingsPanelTimeout);
            this._settingsPanelTimeout = null;
        }
    }

    _startSettingsPanelTimer(durationMs) {
        if (this._settingsPanelTimeout) clearTimeout(this._settingsPanelTimeout);
        this._settingsPanelTimeout = setTimeout(() => {
            this.closeSettingsPanel();
        }, durationMs);
    }

    _resetSettingsPanelTimer() {
        this._startSettingsPanelTimer(30000);
    }

    _attachPanelActivityListeners(panel) {
        if (this._panelActivityListenersAttached) return;
        const reset = () => this._resetSettingsPanelTimer();
        ['mousemove', 'keydown', 'click', 'input', 'wheel', 'touchstart'].forEach(evt => {
            panel.addEventListener(evt, reset, { passive: true });
        });
        this._panelActivityListenersAttached = true;
    }

    setTickerVisible(visible) {
        const content = this.container.querySelector('.news-ticker-content');
        const container = this.container.querySelector('.news-ticker-container');
        const btn = this.container.querySelector('#news-service-btn');
        if (!content || !container || !btn) return;
        if (visible) {
            content.classList.remove('hidden');
            container.style.background = '';
            container.style.border = '';
            const currentService = this.serviceCycle[this.currentServiceIndex];
            btn.textContent = currentService.label;
            btn.style.border = '';
        } else {
            content.classList.add('hidden');
            container.style.background = 'transparent';
            container.style.border = 'none';
            btn.textContent = '📤';
            btn.style.border = '2px solid #8FE04A';
        }
    }

    async switchToService(serviceKey) {
        const idx = this.serviceCycle.findIndex(s => s.service === serviceKey);
        if (idx === -1) return;
        this.currentServiceIndex = idx;
        this.currentService = serviceKey;
        const serviceBtn = this.container.querySelector('#news-service-btn');
        if (serviceBtn) serviceBtn.textContent = this.serviceCycle[idx].label;
        this.isLoading = true;
        if (serviceBtn) {
            serviceBtn.textContent = '↻';
            serviceBtn.classList.add('loading');
        }
        await this.loadHeadlines().catch(() => {});
        this.isLoading = false;
        if (serviceBtn) {
            serviceBtn.textContent = this.serviceCycle[idx].label;
            serviceBtn.classList.remove('loading');
        }
    }

    loadPreferences() {
        try {
            const raw = localStorage.getItem('news-ticker-preferences');
            if (raw) this.preferences = JSON.parse(raw);
        } catch (_) {}
        this.preferences = this.preferences || {};
    }

    savePreferences() {
        try {
            localStorage.setItem('news-ticker-preferences', JSON.stringify(this.preferences || {}));
        } catch (_) {}
    }

    // Function to reset to sports and clear cache
    resetToSports() {
        this.currentServiceIndex = 0;
        this.currentService = 'sports';
        this.preferences.service = 'sports';
        this.preferences.headlineColor = '#ffffff';
        this.preferences.speed = 60;
        this.savePreferences();
        
        // Update button text
        const btn = this.container.querySelector('#news-service-btn');
        if (btn) btn.textContent = 'Sports';
        
        // Reset headline color and speed
        this.setHeadlineColor('#ffffff');
        this.setSpeed(60);
        
        // Update settings panel controls if open
        const panel = document.getElementById('news-settings-panel');
        if (panel && panel.style.display !== 'none') {
            const colorEl = panel.querySelector('#news-settings-color');
            const speedEl = panel.querySelector('#news-settings-speed');
            const speedVal = panel.querySelector('#news-settings-speed-value');
            if (colorEl) colorEl.value = '#ffffff';
            if (speedEl) speedEl.value = '60';
            if (speedVal) speedVal.textContent = '60px/s';
        }
        
        // Clear headlines and reload
        this.headlines = [];
        if (this.tickerList) {
            this.tickerList.innerHTML = '';
        }
        
        // Load sports headlines
        this.loadHeadlines();
        
        console.log('🔄 Reset to Sports section with default color and speed');
    }

    applyPreferences() {
        if (!this.preferences) return;
        if (typeof this.preferences.visible === 'boolean') this.setTickerVisible(this.preferences.visible);
        if (typeof this.preferences.speed === 'number') this.setSpeed(this.preferences.speed);
        if (typeof this.preferences.headlineColor === 'string') this.setHeadlineColor(this.preferences.headlineColor);
        
        // Apply saved service preference if it exists and is valid
        if (this.preferences.service && typeof this.preferences.service === 'string') {
            const idx = this.serviceCycle ? this.serviceCycle.findIndex(s => s.service === this.preferences.service) : -1;
            if (idx >= 0) {
                this.currentServiceIndex = idx;
                this.currentService = this.preferences.service;
                const btn = this.container.querySelector('#news-service-btn');
                if (btn) btn.textContent = this.serviceCycle[idx].label;
                console.log(`🔄 Applied saved service preference: ${this.preferences.service} (index: ${idx})`);
            } else {
                // Invalid service preference, reset to sports
                this.currentServiceIndex = 0;
                this.currentService = 'sports';
                this.preferences.service = 'sports';
                this.savePreferences();
                const btn = this.container.querySelector('#news-service-btn');
                if (btn) btn.textContent = 'Sports';
                console.log(`🔄 Invalid service preference, reset to Sports`);
            }
        } else {
            // No service preference - start with sports
            this.currentServiceIndex = 0;
            this.currentService = 'sports';
            const btn = this.container.querySelector('#news-service-btn');
            if (btn) btn.textContent = 'Sports';
            console.log(`🔄 No service preference, starting with Sports`);
        }
    }

    setHeadlineColor(color) {
        const root = this.container;
        if (root) root.style.setProperty('--news-headline-color', color);
    }

    syncSettingsControls() {
        // Get elements from the settings panel (not from container)
        const panel = document.getElementById('news-settings-panel');
        if (!panel) return;
        
        const visibleEl = panel.querySelector('#news-settings-visible');
        const serviceEl = panel.querySelector('#news-settings-service');
        const colorEl = panel.querySelector('#news-settings-color');
        const speedEl = panel.querySelector('#news-settings-speed');
        const speedVal = panel.querySelector('#news-settings-speed-value');
        const prefs = this.preferences || {};
        
        if (visibleEl) visibleEl.checked = !!prefs.visible;
        
        // Always sync the dropdown to the current service for real-time updates
        if (serviceEl) {
            serviceEl.value = this.currentService || 'sports';
            console.log(`🔄 Synced settings dropdown to: ${this.currentService}`);
        }
        
        if (colorEl) colorEl.value = prefs.headlineColor || '#ffffff';
        if (speedEl) {
            const v = prefs.speed || this.options.speed;
            speedEl.value = String(v);
            if (speedVal) speedVal.textContent = `${v}px/s`;
        }
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
        serviceBtn.textContent = '↻';
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
        
        // Update preferences to keep settings panel in sync
        this.preferences.service = nextService.service;
        this.savePreferences();
        
        console.log(`🔄 Switching to service: ${nextService.service}`);
        console.log(`📋 Updated preferences.service to: ${this.preferences.service}`);
        
        // Load headlines for the new service
        this.loadHeadlines().finally(() => {
            // Restore button state after loading completes (success or error)
            this.isLoading = false;
            serviceBtn.textContent = nextService.label;
            serviceBtn.classList.remove('loading');
            
            // Sync settings panel to reflect the new service
            this.syncSettingsControls();
            
            console.log(`🔄 Settings panel synced after service change to: ${this.currentService}`);
        }).catch((error) => {
            // Additional error handling to ensure button state is restored
            console.error('Error loading headlines:', error);
            this.isLoading = false;
            serviceBtn.textContent = nextService.label;
            serviceBtn.classList.remove('loading');
            
            // Sync settings panel even on error
            this.syncSettingsControls();
            
            console.log(`🔄 Settings panel synced after service change to: ${this.currentService}`);
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
            // Filter and prioritize for 'local' to avoid Herald block of older items at the top
            const filtered = (this.currentService === 'local') ? (() => {
                const list = headlines.filter(h => {
                    const src = (h.source || '').toLowerCase();
                    const title = (h.title || '').toLowerCase();
                    // Drop manual placeholder and obvious sports
                    if (src === 'manual') return false;
                    const isHerald = src.includes('plymouthherald');
                    const isSports = title.includes('argyle') || title.includes('sport') || title.includes('football');
                    if (isHerald && isSports) return false;
                    return true;
                });

                const getPriority = (h) => {
                    const src = (h.source || '').toLowerCase();
                    const url = (h.url || '').toLowerCase();
                    const isHerald = src.includes('plymouthherald');
                    if (!isHerald) return 0; // non-Herald first
                    // Strict Herald local paths next
                    const heraldStrictLocal = url.includes('/news/plymouth-news/') || url.includes('/news/local-news/');
                    return heraldStrictLocal ? 1 : 2; // other Herald last
                };

                return list.sort((a, b) => {
                    // Sports page keeps its own priority elsewhere
                    if (this.currentService === 'sports') return 0;
                    const pa = getPriority(a);
                    const pb = getPriority(b);
                    if (pa !== pb) return pa - pb;
                    // Within same group, prefer most recent
                    return (b.ts || 0) - (a.ts || 0);
                });
            })() : headlines;

            this.headlines = filtered
                .sort((a, b) => {
                    // Priority 1: Plymouth Sports sources first (sports only)
                    if (this.currentService === 'sports') {
                        const aIsPlymouth = (a.source || '').toLowerCase().includes('plymouth') || 
                                          (a.source || '').toLowerCase().includes('pafc');
                        const bIsPlymouth = (b.source || '').toLowerCase().includes('plymouth') || 
                                          (b.source || '').toLowerCase().includes('pafc');
                        if (aIsPlymouth && !bIsPlymouth) return -1;
                        if (!aIsPlymouth && bIsPlymouth) return 1;
                    }
                    // Fallback: recency
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

                        // Prepend front-section JSON if available locally (news.json, weather.json, local.json, sports.json)
                        const frontJsonCandidates = {
                            news: ['news.json', 'News.json'],
                            local: ['local.json', 'Local.json'],
                            sports: ['sports.json', 'Sports.json'],
                            weather: ['weather.json', 'Weather.json']
                        };

                        const tryLoadFrontJson = async () => {
                            const candidates = frontJsonCandidates[this.currentService] || [];
                            for (const candidate of candidates) {
                                try {
                                    let resFront = await fetch(candidate.startsWith('/') ? candidate : `/${candidate}`);
                                    if (!resFront.ok) {
                                        resFront = await fetch(candidate);
                                    }
                                    if (!resFront.ok) continue;
                                    const jsonFront = await resFront.json();
                                    const arr = Array.isArray(jsonFront) ? jsonFront : (Array.isArray(jsonFront.items) ? jsonFront.items : (Array.isArray(jsonFront.tweets) ? jsonFront.tweets : []));
                                    const nowLocal = Date.now();
                                    return arr.map(it => ({
                                        source: (it.source || this.currentService).toString().toUpperCase(),
                                        title: it.title || it.text || it.headline || `${it.hashtag || ''} @${it.username || 'user'}: ${it.comment || it.text || ''}`.trim(),
                                        url: it.url || (it.username ? `https://twitter.com/${it.username}` : '#'),
                                        ts: it.ts || nowLocal
                                    }));
                                } catch (_) {}
                            }
                            return [];
                        };

                        const front = await tryLoadFrontJson();

                        const mapped = items.slice(0, this.options.maxHeadlines).map(mapItemToHeadline);
                        if (front.length > 0) {
                            const key = h => `${(h.title || '').trim()}|${(h.url || '').trim()}`;
                            const seen = new Set(front.map(key));
                            const rest = mapped.filter(h => !seen.has(key(h)));
                            this.headlines = [...front, ...rest];
                        } else {
                            this.headlines = mapped;
                        }
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

                        // Try to prepend front-section JSON locally
                        const frontJsonCandidates = {
                            news: ['news.json', 'News.json'],
                            local: ['local.json', 'Local.json'],
                            sports: ['sports.json', 'Sports.json'],
                            weather: ['weather.json', 'Weather.json']
                        };

                        const tryLoadFrontJson = async () => {
                            const candidates = frontJsonCandidates[this.currentService] || [];
                            for (const candidate of candidates) {
                                try {
                                    let resFront = await fetch(candidate.startsWith('/') ? candidate : `/${candidate}`);
                                    if (!resFront.ok) {
                                        resFront = await fetch(candidate);
                                    }
                                    if (!resFront.ok) continue;
                                    const jsonFront = await resFront.json();
                                    const arr = Array.isArray(jsonFront) ? jsonFront : (Array.isArray(jsonFront.items) ? jsonFront.items : (Array.isArray(jsonFront.tweets) ? jsonFront.tweets : []));
                                    const nowLocal = Date.now();
                                    return arr.map(it => ({
                                        source: (it.source || this.currentService).toString().toUpperCase(),
                                        title: it.title || it.text || it.headline || `${it.hashtag || ''} @${it.username || 'user'}: ${it.comment || it.text || ''}`.trim(),
                                        url: it.url || (it.username ? `https://twitter.com/${it.username}` : '#'),
                                        ts: it.ts || nowLocal
                                    }));
                                } catch (_) {}
                            }
                            return [];
                        };

                        const front = await tryLoadFrontJson();
                        const mapped = items.slice(0, this.options.maxHeadlines).map(mapItemToHeadline);
                        if (front.length > 0) {
                            const key = h => `${(h.title || '').trim()}|${(h.url || '').trim()}`;
                            const seen = new Set(front.map(key));
                            const rest = mapped.filter(h => !seen.has(key(h)));
                            this.headlines = [...front, ...rest];
                        } else {
                            this.headlines = mapped;
                        }
                        console.info(`Loaded ${this.headlines.length} items from ${jsonPath} (offline fallback direct .json)`);
                    } catch (err) {
                        console.warn('Failed to load direct JSON line, will fall back to plain lines:', err.message);
                    }
                }
            }

            // If not tweets or directive failed, fall back to plain lines
            if (!this.headlines || this.headlines.length === 0) {
                const now = Date.now();
                const basic = lines.slice(0, this.options.maxHeadlines).map(line => ({
                    source: this.currentService.toUpperCase(),
                    title: line,
                    url: '#',
                    ts: now
                }));

                // Attempt to prepend front JSON even for plain lines fallback
                try {
                    const frontJsonCandidates = {
                        news: ['news.json', 'News.json'],
                        local: ['local.json', 'Local.json'],
                        sports: ['sports.json', 'Sports.json'],
                        weather: ['weather.json', 'Weather.json']
                    };
                    const candidates = frontJsonCandidates[this.currentService] || [];
                    let front = [];
                    for (const candidate of candidates) {
                        try {
                            let resFront = await fetch(candidate.startsWith('/') ? candidate : `/${candidate}`);
                            if (!resFront.ok) {
                                resFront = await fetch(candidate);
                            }
                            if (!resFront.ok) continue;
                            const jsonFront = await resFront.json();
                            const arr = Array.isArray(jsonFront) ? jsonFront : (Array.isArray(jsonFront.items) ? jsonFront.items : (Array.isArray(jsonFront.tweets) ? jsonFront.tweets : []));
                            front = arr.map(it => ({
                                source: (it.source || this.currentService).toString().toUpperCase(),
                                title: it.title || it.text || it.headline || `${it.hashtag || ''} @${it.username || 'user'}: ${it.comment || it.text || ''}`.trim(),
                                url: it.url || (it.username ? `https://twitter.com/${it.username}` : '#'),
                                ts: it.ts || now
                            }));
                            break;
                        } catch (_) {}
                    }
                    if (front.length > 0) {
                        const key = h => `${(h.title || '').trim()}|${(h.url || '').trim()}`;
                        const seen = new Set(front.map(key));
                        const rest = basic.filter(h => !seen.has(key(h)));
                        this.headlines = [...front, ...rest];
                    } else {
                        this.headlines = basic;
                    }
                } catch (_) {
                    this.headlines = basic;
                }
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
        // Parse ISO 8601 timestamp string to milliseconds
        const timestampMs = new Date(timestamp).getTime();
        
        // Check if timestamp is valid
        if (isNaN(timestampMs)) {
            return 'unknown time';
        }
        
        const now = Date.now();
        const diff = now - timestampMs;
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

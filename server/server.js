const express = require('express');
const path = require('path');
const fs = require('fs').promises;
const { NewsSourceParser } = require('./fetchNews');

const app = express();
const PORT = process.env.PORT || 3005;

// Middleware
app.use(express.json());
app.use(express.static(path.join(__dirname, '..')));

// CORS middleware
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  
  if (req.method === 'OPTIONS') {
    res.sendStatus(200);
  } else {
    next();
  }
});

// News API endpoint
app.get('/api/news', async (req, res) => {
    try {
        const parser = new NewsSourceParser();
        let headlines = [];
        
        // Determine which news source to use based on service parameter
        const service = req.query.service || 'news';
        let sourceFile = 'news.txt';
        
        switch (service) {
            case 'local':
                sourceFile = 'news-local.txt';
                break;
            case 'sports':
                sourceFile = 'news-sports.txt';
                break;
            case 'weather':
                sourceFile = 'news-weather.txt';
                break;
            case 'tweets':
                sourceFile = 'news-tweets.txt';
                break;
            case 'entertainment':
                sourceFile = 'news-entertainment.txt';
                break;
            default:
                sourceFile = 'news.txt';
        }
        
        // Try to load headlines for the specific service
        try {
            headlines = await parser.loadHeadlinesFromSource(sourceFile);
        } catch (error) {
            console.warn(`Failed to load ${service} headlines; returning empty list to avoid cross-service cache bleed:`, error.message);
            // Do NOT fall back to global cache; that mixes unrelated stories
            headlines = [];
        }

        // Always prepend front-section JSON items if available for this service
        const serviceToFrontJson = {
            news: ['news.json', 'News.json'],
            local: ['local.json', 'Local.json'],
            sports: ['sports.json', 'Sports.json'],
            weather: ['weather.json', 'Weather.json']
        };

        async function loadFrontItems(candidates) {
            for (const candidate of candidates || []) {
                try {
                    const fullPath = path.resolve(process.cwd(), candidate);
                    const data = await fs.readFile(fullPath, 'utf8');
                    const json = JSON.parse(data);
                    const items = Array.isArray(json)
                        ? json
                        : (Array.isArray(json.items) ? json.items : (Array.isArray(json.tweets) ? json.tweets : []));
                    const now = Date.now();
                    return items.map(item => ({
                        title: item.title || `${item.hashtag || ''} @${item.username || 'user'}: ${item.comment || item.text || ''}`.trim(),
                        url: item.url || (item.username ? `https://twitter.com/${item.username}` : '#'),
                        source: (item.source || service).toString(),
                        ts: item.ts || now
                    }));
                } catch (e) {
                    // Try next candidate
                }
            }
            return [];
        }

        const frontItems = await loadFrontItems(serviceToFrontJson[service]);

        if (frontItems.length > 0) {
            // Deduplicate by title|url, keeping front items first
            const key = h => `${(h.title || '').trim()}|${(h.url || '').trim()}`;
            const seen = new Set(frontItems.map(key));
            const rest = headlines.filter(h => !seen.has(key(h)));
            headlines = [...frontItems, ...rest];
        }
        
        // Apply query filter if provided
        if (req.query.q) {
            const query = req.query.q.toLowerCase();
            headlines = headlines.filter(headline => 
                headline.title.toLowerCase().includes(query) ||
                headline.source.toLowerCase().includes(query)
            );
        }
        
        res.json(headlines);
    } catch (error) {
        console.error('Error serving news:', error);
        res.status(500).json({ error: 'Failed to load news' });
    }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Start server
app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 News ticker server running on port ${PORT}`);
    console.log(`📰 News API: http://localhost:${PORT}/api/news`);
    console.log(`🌐 Web interface: http://localhost:${PORT}/`);
    console.log(`🔍 Health check: http://localhost:${PORT}/api/health`);
});

module.exports = app;

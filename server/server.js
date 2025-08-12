const express = require('express');
const path = require('path');
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
            default:
                sourceFile = 'news.txt';
        }
        
        // Try to load headlines for the specific service
        try {
            headlines = await parser.loadHeadlinesFromSource(sourceFile);
        } catch (error) {
            console.warn(`Failed to load ${service} headlines, falling back to main news:`, error.message);
            headlines = await parser.loadHeadlines();
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

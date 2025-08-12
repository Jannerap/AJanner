# 📰 Argyle News Ticker Module

A production-ready news ticker module that integrates seamlessly with your Argyle project. The ticker automatically fetches news from RSS feeds, scrapes websites, and displays headlines in a smooth, animated ticker that hides when the media toolbar is activated.

## ✨ Features

- **RSS/Atom Support**: Automatically parses RSS and Atom feeds
- **Smart Scraping**: Extracts headlines from HTML pages using OpenGraph, JSON-LD, and title tags
- **Intelligent Caching**: Respects ETag and Last-Modified headers for efficient updates
- **Rate Limiting**: Prevents hammering news sources (default: 5 minutes between requests)
- **Offline Support**: Falls back to cached headlines when offline
- **Accessibility**: Supports reduced motion and high contrast preferences
- **Responsive Design**: Adapts to different screen sizes
- **Hover Pause**: Pauses animation on mouse hover
- **Seamless Integration**: Automatically hides when media toolbar is visible

## 🚀 Quick Start

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure News Sources

Edit `news.txt` to add your news sources:

```txt
# Primary feeds
feed https://feeds.bbci.co.uk/news/rss.xml
feed https://www.reuters.com/rssFeed/topNews

# Sites to auto-discover/scrape
site https://www.bloomberg.com
url  https://techcrunch.com

# Sub-list
list lists/tech.txt

# Manual pin
headline "Breaking: Release v1.0 is live" https://example.com/blog/v1
```

### 3. Fetch News

```bash
# Fetch once
npm run fetch-news

# Or fetch every 5 minutes
node server/fetchNews.js --every 300
```

### 4. Start Server

```bash
npm run dev
```

The ticker will automatically appear at the bottom of your Argyle page and hide when the media toolbar is activated.

## 📁 File Structure

```
├── news.txt                    # Main news source configuration
├── lists/                      # Sub-list configurations
│   └── tech.txt               # Tech-focused sources
├── server/                     # Server-side code
│   ├── fetchNews.js           # News fetching and caching logic
│   └── server.js              # Express server with API endpoints
├── web/                       # Client-side code
│   ├── ticker.js              # Ticker JavaScript module
│   ├── ticker.css             # Ticker styles
│   └── index.html             # Demo page
└── package.json               # Dependencies and scripts
```

## ⚙️ Configuration

### News Source Types

- **`feed <url>`**: RSS/Atom feed URL
- **`site <url>`** or **`url <url>`**: Website to scrape for headlines
- **`headline "Text" <url>`**: Manual headline injection
- **`list <path>`**: Include sources from another .txt file

### Ticker Options

```javascript
initNewsTicker({
    target: '#news-ticker',           // DOM element selector
    endpoint: '/api/news',            // API endpoint
    speed: 60,                        // Pixels per second
    gap: 48,                          // Gap between headlines
    pauseOnHover: true,               // Pause on hover
    direction: 'ltr',                 // 'ltr' or 'rtl'
    fontCss: '/fonts/custom.css',     // Custom font (optional)
    maxHeadlines: 50                  // Maximum headlines to display
});
```

## 🔧 API Endpoints

### GET /api/news
Returns cached headlines in JSON format.

**Query Parameters:**
- `q=<search>`: Filter headlines by keyword

**Response:**
```json
[
    {
        "title": "Headline text",
        "url": "https://example.com/article",
        "source": "example.com",
        "ts": 1640995200000,
        "id": "sha1_hash"
    }
]
```

### GET /api/health
Health check endpoint.

## 🎨 Customization

### Themes

The ticker supports multiple themes:

```css
.news-ticker-container.dark    /* Dark theme (default) */
.news-ticker-container.light   /* Light theme */
```

### Custom Fonts

Load custom fonts by specifying the `fontCss` option:

```javascript
initNewsTicker({
    fontCss: '/fonts/news-ticker.css'
});
```

### CSS Variables

Override default styles using CSS custom properties:

```css
:root {
    --ticker-height: 40px;
    --ticker-bg: #1a1a1a;
    --ticker-text: #ffffff;
    --ticker-accent: #8FE04A;
}
```

## 📱 Responsive Design

The ticker automatically adapts to different screen sizes:

- **Desktop**: Full height (40px) with all features
- **Tablet**: Reduced height (36px) with adjusted spacing
- **Mobile**: Compact height (32px) with optimized layout

## ♿ Accessibility

- **Reduced Motion**: Respects `prefers-reduced-motion` preference
- **High Contrast**: Supports `prefers-contrast: high` mode
- **Keyboard Navigation**: Full keyboard support
- **Screen Readers**: Proper ARIA labels and semantic structure

## 🔄 Caching Strategy

### Server-Side Caching
- **ETag Support**: Respects server ETag headers
- **Last-Modified**: Uses Last-Modified headers for conditional requests
- **Rate Limiting**: Per-domain rate limiting (default: 5 minutes)
- **Deduplication**: SHA1-based headline deduplication

### Client-Side Caching
- **localStorage**: Caches headlines for offline use
- **Cache Expiry**: 1-hour cache lifetime
- **Graceful Degradation**: Falls back to cached data when offline

## 🚨 Error Handling

The module gracefully handles various error scenarios:

- **Network Failures**: Falls back to cached headlines
- **Invalid Feeds**: Skips problematic sources and continues
- **Scraping Errors**: Logs errors and continues with other sources
- **API Failures**: Shows offline badge and uses cached data

## 🧪 Testing

### Manual Testing
1. Start the server: `npm run dev`
2. Open the demo page: `http://localhost:3000/web/`
3. Test ticker controls and responsiveness

### Automated Testing
```bash
# Test news fetching
npm run fetch-news

# Test server health
curl http://localhost:3000/api/health

# Test news API
curl http://localhost:3000/api/news
```

## 🔍 Troubleshooting

### Common Issues

**Ticker not appearing:**
- Check browser console for errors
- Verify `#news-ticker` element exists
- Ensure `web/ticker.js` and `web/ticker.css` are loaded

**No headlines showing:**
- Check server logs for fetch errors
- Verify news sources are accessible
- Run `npm run fetch-news` to test fetching

**Performance issues:**
- Reduce `maxHeadlines` setting
- Increase rate limiting intervals
- Check for excessive API calls

### Debug Mode

Enable debug logging by setting the log level in `media.js`:

```javascript
let currentLogLevel = LOG_LEVELS.DEBUG; // Change from WARN to DEBUG
```

## 📈 Performance

- **60fps Animation**: Smooth scrolling using requestAnimationFrame
- **Efficient DOM Updates**: Minimal DOM manipulation
- **Memory Management**: Automatic cleanup of event listeners
- **Lazy Loading**: Fonts and resources loaded on demand

## 🔒 Security

- **Input Sanitization**: All headlines are sanitized to prevent XSS
- **Rate Limiting**: Prevents abuse of external APIs
- **User-Agent**: Respectful user agent string
- **Timeout Protection**: 10-second timeout for external requests

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

MIT License - see LICENSE file for details.

## 🆘 Support

For issues and questions:
1. Check this README
2. Review browser console logs
3. Check server logs
4. Open an issue on GitHub

---

**Happy news tickering! 📰✨**

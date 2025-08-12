const fs = require('fs').promises;
const path = require('path');
const axios = require('axios');
const FeedParser = require('feedparser-promised');
const cheerio = require('cheerio');
const crypto = require('crypto');

// Configuration
const CACHE_DIR = path.join(__dirname, 'cache');
const META_FILE = path.join(CACHE_DIR, 'meta.json');
const NEWS_CACHE_FILE = path.join(CACHE_DIR, 'news-cache.json');
const MAX_HEADLINES = 200;
const DEFAULT_RATE_LIMIT = 300000; // 5 minutes
const USER_AGENT = 'Argyle-News-Ticker/1.0 (+https://github.com/argyle)';

// Headline structure
class Headline {
    constructor(title, url, source, ts = Date.now()) {
        this.title = title;
        this.url = url;
        this.source = source;
        this.ts = ts;
        this.id = this.generateId();
    }

    generateId() {
        return crypto.createHash('sha1').update(this.title + '|' + this.url).digest('hex');
    }
}

// Cache metadata structure
class CacheMeta {
    constructor() {
        this.sources = new Map(); // domain -> { etag, lastModified, lastFetch, rateLimit }
        this.lastUpdate = Date.now();
    }

    static fromJSON(json) {
        const meta = new CacheMeta();
        if (json.sources) {
            for (const [domain, data] of Object.entries(json.sources)) {
                meta.sources.set(domain, data);
            }
        }
        if (json.lastUpdate) meta.lastUpdate = json.lastUpdate;
        return meta;
    }

    toJSON() {
        return {
            sources: Object.fromEntries(this.sources),
            lastUpdate: this.lastUpdate
        };
    }
}

// News source parser
class NewsSourceParser {
    constructor() {
        this.meta = new CacheMeta();
    }

    async loadMeta() {
        try {
            const data = await fs.readFile(META_FILE, 'utf8');
            this.meta = CacheMeta.fromJSON(JSON.parse(data));
        } catch (error) {
            console.log('No existing meta file, starting fresh');
        }
    }

    async saveMeta() {
        try {
            await fs.mkdir(CACHE_DIR, { recursive: true });
            await fs.writeFile(META_FILE, JSON.stringify(this.meta.toJSON(), null, 2));
        } catch (error) {
            console.error('Failed to save meta:', error);
        }
    }

    async readSources(indexPath) {
        const sources = [];
        const content = await fs.readFile(indexPath, 'utf8');
        const lines = content.split('\n').map(line => line.trim()).filter(line => line && !line.startsWith('#'));

        for (const line of lines) {
            const parts = line.split(/\s+/);
            if (parts.length < 2) continue;

            const type = parts[0].toLowerCase();
            const url = parts[1];

            switch (type) {
                case 'feed':
                    sources.push({ type: 'feed', url });
                    break;
                case 'site':
                case 'url':
                    sources.push({ type: 'site', url });
                    break;
                case 'headline':
                    if (parts.length >= 3) {
                        const title = parts.slice(1, -1).join(' ').replace(/^"|"$/g, '');
                        const headlineUrl = parts[parts.length - 1];
                        sources.push({ type: 'headline', title, url: headlineUrl });
                    }
                    break;
                case 'plymouth-argyle':
                    sources.push({ type: 'plymouth-argyle', url });
                    break;
                case 'plymouth-herald':
                    sources.push({ type: 'plymouth-herald', url });
                    break;
                case 'plymouth-herald-sports':
                    sources.push({ type: 'plymouth-herald-sports', url });
                    break;
                case 'tweets-file':
                    sources.push({ type: 'tweets-file', url });
                    break;
                case 'list':
                    const listPath = path.resolve(path.dirname(indexPath), url);
                    try {
                        const listSources = await this.readSources(listPath);
                        sources.push(...listSources);
                    } catch (error) {
                        console.warn(`Failed to read list ${url}:`, error.message);
                    }
                    break;
            }
        }

        return sources;
    }

    getDomain(url) {
        try {
            return new URL(url).hostname;
        } catch {
            return 'unknown';
        }
    }

    shouldFetch(domain) {
        const sourceMeta = this.meta.sources.get(domain);
        if (!sourceMeta) return true;

        const now = Date.now();
        const rateLimit = sourceMeta.rateLimit || DEFAULT_RATE_LIMIT;
        return (now - sourceMeta.lastFetch) >= rateLimit;
    }

    async fetchRSSFeed(url) {
        try {
            const items = await FeedParser.parse(url);
            return items.map(item => new Headline(
                item.title || 'Untitled',
                item.link || url,
                this.getDomain(url),
                item.pubDate ? new Date(item.pubDate).getTime() : Date.now()
            ));
        } catch (error) {
            console.warn(`Failed to fetch RSS feed ${url}:`, error.message);
            return [];
        }
    }

    async fetchSiteContent(url) {
        try {
            const domain = this.getDomain(url);
            const sourceMeta = this.meta.sources.get(domain) || {};
            
            const response = await axios.get(url, {
                headers: {
                    'User-Agent': USER_AGENT,
                    'If-None-Match': sourceMeta.etag,
                    'If-Modified-Since': sourceMeta.lastModified
                },
                timeout: 10000
            });

            // Update metadata
            this.meta.sources.set(domain, {
                etag: response.headers.etag,
                lastModified: response.headers['last-modified'],
                lastFetch: Date.now(),
                rateLimit: DEFAULT_RATE_LIMIT
            });

            const $ = cheerio.load(response.data);
            const headlines = [];

            // Try OpenGraph first
            const ogTitle = $('meta[property="og:title"]').attr('content');
            const ogUrl = $('meta[property="og:url"]').attr('content');
            if (ogTitle && ogUrl) {
                headlines.push(new Headline(ogTitle, ogUrl, domain));
            }

            // Try JSON-LD
            $('script[type="application/ld+json"]').each((i, el) => {
                try {
                    const data = JSON.parse($(el).html());
                    if (data['@type'] === 'NewsArticle' && data.headline) {
                        headlines.push(new Headline(data.headline, data.url || url, domain));
                    }
                } catch (e) {
                    // Invalid JSON, skip
                }
            });

            // Fallback to title tag
            if (headlines.length === 0) {
                const title = $('title').text().trim();
                if (title) {
                    headlines.push(new Headline(title, url, domain));
                }
            }

            return headlines;

        } catch (error) {
            if (error.response && error.response.status === 304) {
                console.log(`Content not modified for ${url}`);
                return [];
            }
            console.warn(`Failed to fetch site ${url}:`, error.message);
            return [];
        }
    }

        async scrapePlymouthArgyleNews() {
        try {
            const response = await axios.get('https://www.pafc.co.uk/news', {
                timeout: 15000,
                headers: {
                    'User-Agent': USER_AGENT
                }
            });

            const $ = cheerio.load(response.data);
            const newsItems = [];
            
            // Look for news article links with better filtering
            $('a[href*="/news/"]').each((index, element) => {
                if (index < 20) { // Get more items to filter
                    const $el = $(element);
                    const href = $el.attr('href');
                    const title = $el.text().trim();
                    
                    // Filter out navigation, FAQ, and non-news items
                    if (href && title && 
                        !title.includes('View all news') && 
                        !title.includes('More news') &&
                        !title.includes('Help and FAQs') &&
                        !title.includes('Travel Club') &&
                        !title.includes('Hospitality') &&
                        !title.includes('Argyle TV') &&
                        !title.includes('Seasonal') &&
                        !title.includes('Miles Away') &&
                        !title.includes('Latest News') &&
                        !title.includes('homeparkstadium.com') &&
                        title.length > 10 && // Filter out very short titles
                        href.includes('/news/') && // Ensure it's a news article
                        !href.includes('/argyle-tv/') && // Exclude TV section
                        !href.includes('/travel/') && // Exclude travel section
                        !href.includes('/hospitality/') && // Exclude hospitality section
                        !href.includes('homeparkstadium.com') // Exclude external links
                    ) {
                        const fullUrl = href.startsWith('http') ? href : `https://www.pafc.co.uk${href}`;
                        newsItems.push({
                            title: title,
                            url: fullUrl,
                            source: 'www.pafc.co.uk',
                            ts: Date.now()
                        });
                    }
                }
            });

            // If we didn't find enough news items, try alternative selectors
            if (newsItems.length < 3) {
                $('h2, h3, h4, .news-title, .article-title, .headline, .title').each((index, element) => {
                    if (newsItems.length < 3) {
                        const $el = $(element);
                        const title = $el.text().trim();
                        const parent = $el.closest('a');
                        
                        if (title && parent.length > 0 && title.length > 10) {
                            const href = parent.attr('href');
                            if (href && href.includes('/news/') && 
                                !title.includes('Help and FAQs') &&
                                !title.includes('Travel Club') &&
                                !title.includes('Hospitality')) {
                                const fullUrl = href.startsWith('http') ? href : `https://www.pafc.co.uk${href}`;
                                newsItems.push({
                                    title: title,
                                    url: fullUrl,
                                    source: 'www.pafc.co.uk',
                                    ts: Date.now()
                                });
                            }
                        }
                    }
                });
            }

            // Filter out duplicates and return top 3
            const uniqueItems = [];
            const seenTitles = new Set();
            
            for (const item of newsItems) {
                if (!seenTitles.has(item.title.toLowerCase())) {
                    seenTitles.add(item.title.toLowerCase());
                    uniqueItems.push(item);
                }
            }

            return uniqueItems.slice(0, 3); // Ensure we only return 3 items
        } catch (error) {
            console.error('Failed to scrape Plymouth Argyle news:', error.message);
            return [];
        }
    }

    async scrapePlymouthHeraldNews() {
        try {
            const response = await axios.get('https://www.plymouthherald.co.uk/news/', {
                timeout: 15000,
                headers: {
                    'User-Agent': USER_AGENT
                }
            });

            const $ = cheerio.load(response.data);
            const newsItems = [];
            
            // Look for news article links with better filtering
            $('a[href*="/news/"]').each((index, element) => {
                if (index < 100) { // Get more items to filter
                    const $el = $(element);
                    const href = $el.attr('href');
                    const title = $el.text().trim();
                    
                    // Filter out navigation, ads, and non-news items
                    if (href && title && 
                        !title.includes('View all news') && 
                        !title.includes('More news') &&
                        !title.includes('Subscribe') &&
                        !title.includes('Sign up') &&
                        !title.includes('Advertise') &&
                        !title.includes('Contact us') &&
                        !title.includes('About us') &&
                        !title.includes('Privacy Policy') &&
                        !title.includes('Cookie Policy') &&
                        !title.includes('Terms & Conditions') &&
                        !title.includes('Latest News') &&
                        !title.includes('Plymouth News') &&
                        !title.includes('Celebs & TV') &&
                        !title.includes('Devon News') &&
                        !title.includes('Cornwall News') &&
                        !title.includes('UK & World News') &&
                        title.length > 10 && // Filter out very short titles
                        href.includes('/news/') && // Ensure it's a news article
                        !href.includes('/subscribe/') && // Exclude subscription pages
                        !href.includes('/advertise/') && // Exclude advertising pages
                        !href.includes('/contact/') && // Exclude contact pages
                        !href.includes('/plymouth-news/') && // Exclude category pages
                        !href.includes('/devon-news/') && // Exclude category pages
                        !href.includes('/cornwall-news/') && // Exclude category pages
                        !href.includes('/celebs-tv/') && // Exclude category pages
                        !href.includes('/uk-world-news/') // Exclude category pages
                    ) {
                        const fullUrl = href.startsWith('http') ? href : `https://www.plymouthherald.co.uk${href}`;
                        newsItems.push({
                            title: title,
                            url: fullUrl,
                            source: 'www.plymouthherald.co.uk',
                            ts: Date.now()
                        });
                    }
                }
            });

            // If we didn't find enough news items, try alternative selectors
            if (newsItems.length < 8) {
                $('h2, h3, h4, .news-title, .article-title, .headline, .title, .card__title').each((index, element) => {
                    if (newsItems.length < 8) {
                        const $el = $(element);
                        const title = $el.text().trim();
                        const parent = $el.closest('a');
                        
                        if (title && parent.length > 0 && title.length > 10) {
                            const href = parent.attr('href');
                            if (href && href.includes('/news/') && 
                                !title.includes('Subscribe') &&
                                !title.includes('Sign up') &&
                                !title.includes('Advertise')) {
                                const fullUrl = href.startsWith('http') ? href : `https://www.plymouthherald.co.uk${href}`;
                                newsItems.push({
                                    title: title,
                                    url: fullUrl,
                                    source: 'www.plymouthherald.co.uk',
                                    ts: Date.now()
                                });
                            }
                        }
                    }
                });
            }

            // Filter out duplicates and return top 3
            const uniqueItems = [];
            const seenTitles = new Set();
            const seenUrls = new Set();
            
            for (const item of newsItems) {
                const normalizedTitle = item.title.toLowerCase().replace(/\s+/g, ' ').trim();
                const normalizedUrl = item.url.split('?')[0]; // Remove query parameters
                
                if (!seenTitles.has(normalizedTitle) && !seenUrls.has(normalizedUrl)) {
                    seenTitles.add(normalizedTitle);
                    seenUrls.add(normalizedUrl);
                    uniqueItems.push(item);
                }
            }

            return uniqueItems.slice(0, 8); // Ensure we only return 8 items
        } catch (error) {
            console.error('Failed to scrape Plymouth Herald news:', error.message);
            return [];
        }
    }

    async scrapePlymouthHeraldSports() {
        try {
            const response = await axios.get('https://www.plymouthherald.co.uk/sport/football/', {
                timeout: 15000,
                headers: {
                    'User-Agent': USER_AGENT
                }
            });

            const $ = cheerio.load(response.data);
            const sportsItems = [];
            
            // Look for football article links with better filtering
            $('a[href*="/sport/"]').each((index, element) => {
                if (index < 50) { // Get more items to filter
                    const $el = $(element);
                    const href = $el.attr('href');
                    const title = $el.text().trim();
                    
                    // Filter out navigation, ads, and non-sports items
                    if (href && title && 
                        !title.includes('View all sport') && 
                        !title.includes('More sport') &&
                        !title.includes('Subscribe') &&
                        !title.includes('Sign up') &&
                        !title.includes('Advertise') &&
                        !title.includes('Contact us') &&
                        !title.includes('About us') &&
                        !title.includes('Privacy Policy') &&
                        !title.includes('Cookie Policy') &&
                        !title.includes('Terms & Conditions') &&
                        !title.includes('Latest Sport') &&
                        !title.includes('UK Sports News') &&
                        !title.includes('Sport Opinion') &&
                        !title.includes('Football') &&
                        !title.includes('Rugby') &&
                        !title.includes('Cricket') &&
                        !title.includes('Athletics') &&
                        title.length > 10 && // Filter out very short titles
                        href.includes('/sport/') && // Ensure it's a sport article
                        !href.includes('/subscribe/') && // Exclude subscription pages
                        !href.includes('/advertise/') && // Exclude advertising pages
                        !href.includes('/contact/') && // Exclude contact pages
                        !href.includes('/sport/football/') && // Exclude category pages
                        !href.includes('/sport/rugby/') && // Exclude category pages
                        !href.includes('/sport/cricket/') && // Exclude category pages
                        !href.includes('/sport/athletics/') // Exclude category pages
                    ) {
                        const fullUrl = href.startsWith('http') ? href : `https://www.plymouthherald.co.uk${href}`;
                        sportsItems.push({
                            title: title,
                            url: fullUrl,
                            source: 'www.plymouthherald.co.uk',
                            ts: Date.now()
                        });
                    }
                }
            });

            // If we didn't find enough sports items, try alternative selectors
            if (sportsItems.length < 3) {
                $('h2, h3, h4, .sport-title, .article-title, .headline, .title, .card__title').each((index, element) => {
                    if (sportsItems.length < 3) {
                        const $el = $(element);
                        const title = $el.text().trim();
                        const parent = $el.closest('a');
                        
                        if (title && parent.length > 0 && title.length > 10) {
                            const href = parent.attr('href');
                            if (href && href.includes('/sport/') && 
                                !title.includes('Subscribe') &&
                                !title.includes('Sign up') &&
                                !title.includes('Advertise')) {
                                const fullUrl = href.startsWith('http') ? href : `https://www.plymouthherald.co.uk${href}`;
                                sportsItems.push({
                                    title: title,
                                    url: fullUrl,
                                    source: 'www.plymouthherald.co.uk',
                                    ts: Date.now()
                        });
                            }
                        }
                    }
                });
            }

            // Filter out duplicates and return top 3
            const uniqueItems = [];
            const seenTitles = new Set();
            const seenUrls = new Set();
            
            for (const item of sportsItems) {
                const normalizedTitle = item.title.toLowerCase().replace(/\s+/g, ' ').trim();
                const normalizedUrl = item.url.split('?')[0]; // Remove query parameters
                
                if (!seenTitles.has(normalizedTitle) && !seenUrls.has(normalizedUrl)) {
                    seenTitles.add(normalizedTitle);
                    seenUrls.add(normalizedUrl);
                    uniqueItems.push(item);
                }
            }

            return uniqueItems.slice(0, 3); // Ensure we only return 3 items
        } catch (error) {
            console.error('Failed to scrape Plymouth Herald sports:', error.message);
            return [];
        }
    }

    async loadTweetsFromFile(filePath) {
        try {
            const fullPath = path.resolve(process.cwd(), filePath);
            const data = await fs.readFile(fullPath, 'utf8');
            const tweets = JSON.parse(data);
            
            // Ensure we have an array of tweets
            if (Array.isArray(tweets)) {
                return tweets;
            } else if (tweets.tweets && Array.isArray(tweets.tweets)) {
                return tweets.tweets;
            } else {
                console.error('Invalid tweets file format');
                return [];
            }
        } catch (error) {
            console.error('Failed to load tweets from file:', error.message);
            return [];
        }
    }

    async fetchHeadlines(sources, opts = {}) {
        const allHeadlines = [];
        const seenIds = new Set();

        for (const source of sources) {
            try {
                let headlines = [];

                switch (source.type) {
                    case 'feed':
                        headlines = await this.fetchRSSFeed(source.url);
                        break;
                    case 'site':
                        headlines = await this.fetchSiteContent(source.url);
                        break;
                    case 'headline':
                        headlines = [new Headline(source.title, source.url, 'manual')];
                        break;
                    case 'plymouth-argyle':
                        const rawHeadlines = await this.scrapePlymouthArgyleNews();
                        headlines = rawHeadlines.map(item => new Headline(
                            item.title,
                            item.url,
                            item.source,
                            item.ts
                        ));
                        break;
                    case 'plymouth-herald':
                        const rawHeraldHeadlines = await this.scrapePlymouthHeraldNews();
                        headlines = rawHeraldHeadlines.map(item => new Headline(
                            item.title,
                            item.url,
                            item.source,
                            item.ts
                        ));
                        break;
                    case 'plymouth-herald-sports':
                        const rawHeraldSportsHeadlines = await this.scrapePlymouthHeraldSports();
                        headlines = rawHeraldSportsHeadlines.map(item => new Headline(
                            item.title,
                            item.url,
                            item.source,
                            item.ts
                        ));
                        break;
                    case 'tweets-file':
                        const rawTweets = await this.loadTweetsFromFile(source.url);
                        headlines = rawTweets.map(item => new Headline(
                            `${item.hashtag} @${item.username}: ${item.comment}`,
                            `https://twitter.com/${item.username}`,
                            'Twitter',
                            Date.now()
                        ));
                        break;
                }

                // Deduplicate and add new headlines
                for (const headline of headlines) {
                    if (!seenIds.has(headline.id)) {
                        seenIds.add(headline.id);
                        allHeadlines.push(headline);
                    }
                }

            } catch (error) {
                console.error(`Error processing source ${source.url}:`, error.message);
            }
        }

        // Sort by timestamp (newest first) and limit
        return allHeadlines
            .sort((a, b) => b.ts - a.ts)
            .slice(0, opts.maxHeadlines || MAX_HEADLINES);
    }

    async saveHeadlines(headlines) {
        try {
            await fs.mkdir(CACHE_DIR, { recursive: true });
            await fs.writeFile(NEWS_CACHE_FILE, JSON.stringify(headlines, null, 2));
        } catch (error) {
            console.error('Failed to save headlines:', error);
        }
    }

    async loadHeadlines() {
        try {
            const data = await fs.readFile(NEWS_CACHE_FILE, 'utf8');
            return JSON.parse(data);
        } catch (error) {
            console.log('No existing headlines cache, starting fresh');
            return [];
        }
    }

    async loadHeadlinesFromSource(sourceFile) {
        try {
            // Read sources from the specified file
            const sources = await this.readSources(path.join(process.cwd(), sourceFile));
            
            // Fetch headlines for these sources
            const headlines = await this.fetchHeadlines(sources);
            
            return headlines;
        } catch (error) {
            console.error(`Failed to load headlines from ${sourceFile}:`, error);
            throw error;
        }
    }
}

// CLI interface
async function main() {
    const args = process.argv.slice(2);
    const parser = new NewsSourceParser();
    
    try {
        await parser.loadMeta();
        
        if (args.includes('--once')) {
            console.log('Fetching news once...');
            const sources = await parser.readSources(path.join(process.cwd(), 'news.txt'));
            const headlines = await parser.fetchHeadlines(sources);
            await parser.saveHeadlines(headlines);
            await parser.saveMeta();
            console.log(`✅ Fetched ${headlines.length} headlines`);
        } else if (args.includes('--every')) {
            const interval = parseInt(args[args.indexOf('--every') + 1]) * 1000;
            console.log(`Fetching news every ${interval/1000} seconds...`);
            
            setInterval(async () => {
                try {
                    const sources = await parser.readSources(path.join(process.cwd(), 'news.txt'));
                    const headlines = await parser.fetchHeadlines(sources);
                    await parser.saveHeadlines(headlines);
                    await parser.saveMeta();
                    console.log(`✅ Updated ${headlines.length} headlines at ${new Date().toISOString()}`);
                } catch (error) {
                    console.error('Error in scheduled fetch:', error);
                }
            }, interval);
        } else {
            console.log('Usage: node fetchNews.js --once | --every <seconds>');
        }
    } catch (error) {
        console.error('Fatal error:', error);
        process.exit(1);
    }
}

// Export for use as module
module.exports = { NewsSourceParser, Headline };

// Run if called directly
if (require.main === module) {
    main();
}

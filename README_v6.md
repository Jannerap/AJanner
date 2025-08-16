# Argyle News Ticker — V6

A production-ready, client/server news ticker with a right-click settings panel, service switching, persistent preferences, and refined UX.

### What’s New in V6
- Initial load spinner: the `news-service-button` shows `↻` on first fetch and during service switches
- Loading UX: rotating state has no green border; disabled state retains subtle styling
- Right‑click settings panel: configure visibility, section, headline color, and speed
- High z-index panel: always on top; closes on outside click and auto-closes after 30 seconds of inactivity
- Preferences persisted: user settings saved to `localStorage` and applied on startup

---

## Features
- Smooth, continuous ticker of headlines with service-specific feeds:
  - Sports, Local, News, Weather, Tweets, Entertainment
- Per-service caching (client-side cache in `localStorage`)
- Offline fallbacks via local `.txt` and `.json` files
- Accessibility-friendly, reduced motion support
- Theming hooks via CSS variables

---

## Quick Start
1. Install dependencies and run the server:
```bash
npm install
npm run dev
```
2. (Optional) Pre-fetch news for cache priming:
```bash
npm run fetch-news
```
3. Open your Argyle page (e.g., `index.html`). The ticker initializes automatically.

---

## Initialization
Include and initialize:
```html
<script src="web/ticker.js"></script>
<script>
  window.newsTicker = initNewsTicker({
    target: '#news-ticker',
    endpoint: window.NEWS_API_ENDPOINT || '/api/news'
  });
</script>
```

- If deployed on a non-localhost host, the default endpoint is `https://ajanner.onrender.com/api/news`.
- To override, set `window.NEWS_API_ENDPOINT` before initializing.

---

## Right‑click Settings Panel
- Open: Right‑click the `news-service-button` at the right end of the ticker
- Close: Click outside the panel or wait 30 seconds of inactivity
- The panel is appended to `document.body` and uses a very high z-index so it’s never hidden

### Controls
- Show Ticker: toggle visibility of the ticker content
- Section: choose among Sports, Local, News, Weather, Tweets, Entertainment
- Headline Color: color input that updates headlines live
- Speed: live slider showing current pixels/second value

### Persistence
- All settings persist in `localStorage` under `news-ticker-preferences`
- Settings are automatically applied on page load

---

## Styling & Theming
- Headline color is set by CSS variable:
```css
.news-title { color: var(--news-headline-color, #ffffff); }
```
- The settings panel uses a green border (`#8FE04A`) and fixed positioning with extremely high z-index

---

## UX Details
- `↻` spinner shows on first load and while switching services
- Rotating state removes green border; disabled state remains styled
- Right‑click opens settings panel at cursor position (clamped to viewport)
- Panel auto-closes after 30 seconds; any interaction resets the timer

---

## Fallback Data
When the API is unavailable, the module will:
1. Attempt service-specific `backup-*.txt` files (project root)
2. Attempt primary `*.txt` files (project root)
3. Inspect JSON directives within `.txt` (e.g., `json-file path.json`)
4. Use previously cached headlines from `localStorage` (if fresh)

---

## Troubleshooting
- Panel not appearing:
  - Ensure `web/ticker.css` is loaded; panel uses very high `z-index`
  - Right‑click is bound to the service button; verify it’s visible
- Ticker not loading headlines:
  - Check console for network errors
  - Verify `window.NEWS_API_ENDPOINT` or server availability
- Slow/jerky scroll:
  - Lower speed in settings or reduce animations using OS/browser reduced motion settings

---

## Changelog (from V5 → V6)
- Added right‑click settings panel with live updates and persistence
- Spinner applied on initial fetch; refined loading visuals
- High z-index panel appended to `document.body`
- Auto-close behavior with idle timeout (30s)
- Theming via `--news-headline-color`

---

## Legal & Content Disclaimers
- Third‑Party Content: This project aggregates or displays links, titles, and/or snippets sourced from third‑party websites and APIs (e.g., RSS/Atom feeds or HTML pages). All trademarks, service marks, and logos are the property of their respective owners. We are not affiliated with or endorsed by any content provider.
- Terms of Use: Your use of third‑party content is subject to each source’s terms, robots directives, and applicable laws. Ensure that you have permission and comply with all relevant terms before redistribution or storage of third‑party data.
- Fair Use / Jurisdiction: Display of headlines and links is intended to support fair use/readers’ navigation, but fair use varies by jurisdiction. You are solely responsible for legal compliance in your use case.
- No Warranty: This software and its output are provided “as is” without any warranties, express or implied, including but not limited to merchantability, fitness for a particular purpose, and non‑infringement. We do not guarantee accuracy, availability, completeness, or timeliness of the aggregated content.
- Limitation of Liability: In no event shall the authors or contributors be liable for any claims, damages, or other liability arising from, out of, or in connection with the software or the use or other dealings in the software.
- Takedown / Removal: If you are a rights holder and believe content is being used improperly, please open an issue in this repository with details so we can investigate and, if appropriate, remove or adjust the usage.
- Third‑Party Libraries: This project may utilize third‑party libraries (e.g., an RSS parser). Each such library is licensed by its respective authors under their own terms.

---

## Suggested Enhancements
- Optional controls: font size/density, show/hide source or timestamps
- Manual refresh action in the panel
- Import/export preferences

---

## Support
Please open an issue in this repository with reproduction steps, environment details, and logs if available.

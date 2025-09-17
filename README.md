# Ceradon Systems Marketing Site

A static, tactical marketing presence for Ceradon Systems and the Vantage product line. Built with Vite, vanilla JavaScript, and Tailwind via CDN to keep the footprint lean and deployment-ready for air-gapped environments.

## Features

- Dark, high-contrast UI aligned with Ceradon brand assets.
- Vector-only brand assets (SVG) so the repo stays text-diff friendly in restricted pipelines.
- Shared sticky header with responsive logo swap, accessible mobile nav, and footer links populated from JavaScript.
- Seven content pages covering product, technology, company, IP, careers, contact, and privacy.
- Offline-friendly contact workflow that copies the inquiry to the clipboard and launches a mailto link—no backend dependencies.
- Assets, gallery placeholders, and diagram scaffolding ready for future pose-visualization overlays.
- Robots and sitemap metadata for search hygiene, plus Open Graph/Twitter cards on every page.

## Getting Started

```bash
npm install
npm run dev
```

The dev server runs at `http://localhost:5173` by default. All HTML pages are entry points; navigate directly to `/vantage.html`, `/technology.html`, etc.

### Production Build

```bash
npm run build
```

The static output is emitted to `dist/`. Serve the directory via any static host. No server-side processing is required.

## Project Structure

```
assets/            Brand images, gallery placeholders, architecture diagram stub
src/main.js        Initializes shared UI (nav states, mobile menu, contact form)
src/ui.js          Navigation logic, focus trapping, footer hydration
styles/styles.css  CSS variables, component overrides, focus styles
*.html             Individual marketing pages with shared header/footer
robots.txt         Basic crawler directives
sitemap.xml        Search indexing map
vite.config.js     Vite multi-page configuration
```

## Accessibility & Performance

- WCAG-compliant contrast with visible focus states and keyboard-friendly navigation.
- Mobile menu includes overlay dismissal, ESC handling, and focus trapping.
- Lazy-loading applied to gallery imagery. No third-party trackers are included.
- Design keeps payload small for quick loads over limited links.

## Customization Notes

- Tailwind runs via CDN with a small configuration snippet in each page head for color tokens.
- Update `FOOTER_LINKS` in `src/ui.js` if you add or rename pages; header markup must remain in sync with the provided snippet.
- Replace placeholder imagery in `assets/` (`diagram.svg`, gallery files, founder portrait, map) with production visuals as they become available.
- Extend the contact workflow with secure form handling when a backend endpoint is approved; current behavior is clipboard + mailto by design.


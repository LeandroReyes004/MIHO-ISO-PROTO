# Mihon iOS PWA (Manga Reader)

A modern, high-performance Progressive Web App (PWA) manga reader tailored for iOS Safari and mobile devices, inspired by Mihon / Tachiyomi.

## 🚀 Cloudflare Pages Deployment Settings

When connecting this repository to **Cloudflare Pages**:

- **Framework preset**: `Vite`
- **Build command**: `npm run build`
- **Build output directory**: `dist`
- **Node.js version**: `18` or higher (e.g. `20`)

---

## 🛠 Features

- **PWA Experience**: Add to Home Screen on iOS with standalone fullscreen display, status bar styling, and touch gestures.
- **Tachiyomi Extension Architecture**: Modular TypeScript base extensions with CORS proxy routing for Cloudflare Workers.
- **Ported Extensions**:
  - `InManga`: Search, details, chapters, and CDN page image extraction.
- **Reader Engine**: Webtoon vertical scroll, double page, and single page reading modes.
- **Library & History**: Local persistence with offline caching.

---

## 💻 Local Development

```bash
# Install dependencies
npm install

# Start Vite development server
npm run dev

# Build for production
npm run build
```

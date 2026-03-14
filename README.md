# 🏉 Blessure Logboek

Injury tracker PWA for rugby players — built for **Rugby Academy Zuidwest (RAZW)**.

Log injuries by tapping body parts on an interactive body map, track recovery progress, and view statistics.

## Features

- **Interactive Body Map** — Front & back view with clickable zones
- **Injury Logging** — Type, severity (1-5), context (training/match), notes
- **Timeline** — Full injury history with filtering by status
- **Recovery Tracking** — Active → Recovering → Healed workflow
- **Statistics** — Charts for body regions, injury types, and trends
- **PWA** — Install on iOS/Android, works offline
- **Dutch UI** — Designed for Dutch rugby clubs

## Tech Stack

- React + TypeScript + Vite
- Tailwind CSS v4
- localStorage (no backend needed)
- Service Worker for offline support

## Development

```bash
npm install
npm run dev
```

## Deployment

Automatically deploys to Cloudflare Pages on push to `main`.

**Live:** [blessure-logboek.pages.dev](https://blessure-logboek.pages.dev)

---

Made with ⚡ for RAZW

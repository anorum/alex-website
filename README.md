# Alex Website

This repository contains the source code for [alexnorum.com](https://alexnorum.com), Alex's personal website.

Built with [Astro](https://astro.build) plus React islands for the interactive pieces.

## Deployment

The site deploys to GitHub Pages.
Pushing to `main` triggers `.github/workflows/deploy.yml`, which builds the static site and publishes it to Pages.
The custom domain `alexnorum.com` is configured via `public/CNAME` and Cloudflare DNS.

## Local Development

```bash
npm install
npm run dev      # dev server at localhost:4321
npm run build    # static build to dist/
npm run preview  # serve the built site locally
```

## Checks

```bash
npm run typecheck   # TypeScript
npm test            # unit tests for the battle engine, encounters, save, and data (vitest)
npm run build && npm run e2e   # headless browser checks against dist/ (needs `npx playwright install chromium` once)
```

The end-to-end suite in `tests/e2e.mjs` walks both themes: the editorial page (headings, links, metadata, map) and the RPG (every interior, dialogs, windows, random encounters, turn-based battles, touch controls).
It runs in CI before every deploy.

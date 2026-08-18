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

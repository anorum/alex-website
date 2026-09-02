// Renders public/og.png (1200x630) from the hero copy and theme tokens.
// Usage: npm run og
// Needs the Playwright chromium used by the e2e suite. Fonts are fetched
// from Google Fonts at render time and embedded, so the output does not
// depend on what is installed locally.

import { chromium } from 'playwright';
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const out = resolve(root, 'public/og.png');

const eyebrow = 'Portland, OR · Data platform, engineering, analytics';
const headline = ['Data platforms', 'teams want', 'to use.'];
const accentLine = 1;
const footer = 'Alex Norum · alexnorum.com';

const colors = {
  paper: '#f4f1ea',
  ink: '#14241c',
  accent: '#0d8a5f',
  accentDeep: '#0a6e4c',
  muted: '#56685f',
};

const UA = 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

async function fontFace(family, weight, cssFamily) {
  const css = await (await fetch(
    `https://fonts.googleapis.com/css2?family=${cssFamily}:wght@${weight}&display=swap`,
    { headers: { 'User-Agent': UA } },
  )).text();
  const latin = css.split('/* latin */').pop();
  const url = latin.match(/url\(([^)]+)\)/)[1];
  const bytes = Buffer.from(await (await fetch(url)).arrayBuffer());
  return `@font-face{font-family:'${family}';font-weight:${weight};src:url(data:font/woff2;base64,${bytes.toString('base64')}) format('woff2');}`;
}

const photo = readFileSync(resolve(root, 'src/assets/me.jpeg')).toString('base64');
const fonts = [
  await fontFace('Archivo', 900, 'Archivo'),
  await fontFace('JetBrains Mono', 500, 'JetBrains+Mono'),
].join('\n');

const html = `<!doctype html><html><head><meta charset="utf-8"><style>
${fonts}
html,body{margin:0}
body{width:1200px;height:630px;background:${colors.paper};color:${colors.ink};position:relative;overflow:hidden}
.eyebrow{position:absolute;left:80px;top:88px;font:500 20px/1 'JetBrains Mono',monospace;letter-spacing:.14em;text-transform:uppercase;color:${colors.accentDeep}}
h1{position:absolute;left:78px;top:148px;margin:0;font:900 106px/0.92 'Archivo',sans-serif;letter-spacing:-.03em;text-transform:uppercase}
h1 span{display:block}
h1 .accent{color:${colors.accent}}
.footer{position:absolute;left:80px;bottom:72px;font:500 20px/1 'JetBrains Mono',monospace;letter-spacing:.14em;text-transform:uppercase;color:${colors.muted}}
.photo{position:absolute;right:80px;bottom:72px;width:160px;height:160px;object-fit:cover;border:2px solid ${colors.ink};box-shadow:12px 12px 0 0 ${colors.accent}}
</style></head><body>
<div class="eyebrow">${eyebrow}</div>
<h1>${headline.map((l, i) => `<span${i === accentLine ? ' class="accent"' : ''}>${l}</span>`).join('')}</h1>
<div class="footer">${footer}</div>
<img class="photo" src="data:image/jpeg;base64,${photo}" alt="">
</body></html>`;

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1200, height: 630 }, deviceScaleFactor: 1 });
await page.setContent(html, { waitUntil: 'load' });
await page.evaluate(() => document.fonts.ready);
writeFileSync(out, await page.screenshot({ type: 'png', clip: { x: 0, y: 0, width: 1200, height: 630 } }));
await browser.close();
console.log('wrote', out);

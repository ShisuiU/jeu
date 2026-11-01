// Génère les icônes PNG de l'application à partir de public/icons/icon.svg (utilise Chromium via Playwright).
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';

const { chromium } = createRequire(import.meta.url)('playwright');

const svg = readFileSync('public/icons/icon.svg', 'utf8');
const browser = await chromium.launch();
const page = await browser.newPage();
const out = [
  ['icon-192.png', 192, 0], ['icon-512.png', 512, 0], ['apple-touch-icon.png', 180, 0], ['icon-512-maskable.png', 512, 0.12],
];
for (const [name, size, pad] of out) {
  await page.setViewportSize({ width: size, height: size });
  const inner = Math.round(size * (1 - pad * 2));
  await page.setContent(`<html><body style="margin:0;background:#07060b;display:grid;place-items:center;width:${size}px;height:${size}px">${svg.replace('<svg ', `<svg width="${inner}" height="${inner}" `)}</body></html>`);
  await page.screenshot({ path: `public/icons/${name}` });
  console.log('✓', name);
}
await browser.close();

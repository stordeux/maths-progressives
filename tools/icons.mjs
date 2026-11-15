// Génère les icônes PNG de la PWA à partir de assets/icons/icon.svg (Playwright).
import { chromium } from 'playwright';
import { readFileSync } from 'node:fs';
const svg = readFileSync(new URL('../assets/icons/icon.svg', import.meta.url), 'utf8');
const b = await chromium.launch();
for (const [n, pad] of [[192, 0], [512, 0], [512, 60]]) {
  const p = await b.newPage({ viewport: { width: n, height: n } });
  const inner = n - 2 * pad;
  await p.setContent(`<html><body style="margin:0;background:#2b4acb"><div style="padding:${pad}px">${svg.replace('<svg ', `<svg width="${inner}" height="${inner}" `)}</div></body></html>`);
  await p.screenshot({ path: new URL(`../assets/icons/icon-${n}${pad ? '-maskable' : ''}.png`, import.meta.url).pathname.replace(/^\/([A-Z]:)/, '$1') });
  await p.close();
}
await b.close();

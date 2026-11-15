// Pour chaque module : chargement sans erreur, bonne réponse acceptée, réponse fausse → indice → correction,
// aucun appel réseau externe, captures d'écran (dans tests/e2e/captures/, à regarder).
import { test, expect } from '@playwright/test';
import { READY as MODULES } from '../../modules/registry.js';

const fmt = x => (x === Infinity ? 'i' : x === -Infinity ? 'i-' : (Math.abs(x) + '').replace('.', ',') + (x < 0 ? '-' : ''));

async function typeNumber(page, x) {
  for (const ch of fmt(x)) await page.keyboard.press(ch === '-' ? 'Minus' : ch === ',' ? 'Comma' : ch);
}
/** remplit la réponse attendue (si good) ou une réponse fausse */
async function answer(page, good) {
  const q = await page.evaluate(() => { const q = window.__mp.question; return { type: q.type, E: q.expected, opts: q.opts, xs: q.xs }; });
  const E = q.E;
  if (['nums', 'frac', 'steps'].includes(q.type)) {
    const vals = good ? E : E.map((e, i) => (i === E.length - 1 ? e + 1 : e));
    await page.locator('#answer .box').first().click();
    for (let i = 0; i < vals.length; i++) { await typeNumber(page, vals[i]); if (i < vals.length - 1) await page.keyboard.press('ArrowRight'); }
  } else if (q.type === 'roots') {
    if (good && !E.length || !good && E.length) await page.locator('#answer .none').click();
    else { const vals = good ? E : [999]; await page.locator('#answer .box').first().click(); for (let i = 0; i < vals.length; i++) { await typeNumber(page, vals[i]); await page.keyboard.press('ArrowRight'); } }
  } else if (q.type === 'cmp') {
    await page.locator(`#answer [data-c="${good ? E : (E === '<' ? '>' : '<')}"]`).click();
  } else if (q.type === 'choice') {
    const v = good ? E : q.opts.find(o => String(o.v) !== String(E)).v;
    await page.locator(`#answer [data-c="${v}"]`).click();
  } else if (q.type === 'table') {
    const z = good ? E : E.map(s => (s === '+' ? '−' : '+'));
    for (let i = 0; i < z.length; i++) { const b = page.locator(`#answer [data-z="${i}"]`); await b.click(); if (z[i] === '−') await b.click(); }
  } else if (q.type === 'iv') {
    const S = good ? E : (E.length ? [] : [{ lo: 0, lc: true, hi: 1, hc: true }]);
    const isR = S.length === 1 && S[0].lo === null && S[0].hi === null; // Infinity devient null en JSON
    if (!S.length) await page.locator('#answer [data-a="E"]').click();
    else if (isR) await page.locator('#answer [data-a="R"]').click();
    else {
      for (let i = 0; i < S.length; i++) {
        if (i === 1) await page.locator('#answer [data-a="add"]').click();
        const lo = S[i].lo === null ? -Infinity : S[i].lo, hi = S[i].hi === null ? Infinity : S[i].hi;
        await page.locator(`#answer .box[data-f="${2 * i}"]`).click(); await typeNumber(page, lo);
        await page.locator(`#answer .box[data-f="${2 * i + 1}"]`).click(); await typeNumber(page, hi);
        if (!S[i].lc) await page.locator(`#answer [data-b="${i}-l"]`).click();
        if (!S[i].hc) await page.locator(`#answer [data-b="${i}-r"]`).click();
      }
    }
  }
  await page.locator('#okBtn').click();
}

for (const m of MODULES) {
  test(`${m.id} : parcours complet`, async ({ page }, info) => {
    const errors = [], external = [];
    page.on('console', msg => { if (msg.type() === 'error') errors.push(msg.text()); });
    page.on('pageerror', e => errors.push(e.message));
    page.on('request', r => { const u = new URL(r.url()); if (u.hostname !== 'localhost') external.push(r.url()); });
    await page.goto(`modules/${m.id}/`);
    await expect(page.locator('#coursModal')).toHaveClass(/open/);
    await page.screenshot({ path: `tests/e2e/captures/${m.id}-${info.project.name}-cours.png` });
    await page.locator('#coursModal [data-close]').click();
    if (m.id === 'calcul') {
      for (let k = 0; k < 3; k++) {
        const a = await page.evaluate(() => window.__mp.question.a);
        await typeNumber(page, a); await page.keyboard.press('Enter');
        await expect(page.locator('#disp')).toHaveClass(/ok/);
        await page.waitForTimeout(900);
      }
      await page.screenshot({ path: `tests/e2e/captures/${m.id}-${info.project.name}.png` });
      const a = await page.evaluate(() => window.__mp.question.a);
      await typeNumber(page, a + 1); await page.keyboard.press('Enter');
      await expect(page.locator('#fb')).toHaveClass(/bad/);
      await page.screenshot({ path: `tests/e2e/captures/${m.id}-${info.project.name}-erreur.png` });
      await page.locator('#mChrono').click(); await page.locator('#goBtn').click();
      await expect(page.locator('#play')).toBeVisible();
    } else {
      // plusieurs niveaux : bonne réponse, puis réponse fausse deux fois
      for (const lv of [0, 5, 11]) {
        await page.evaluate(l => { const S = window.__mp.state; S.level = l; S.seen = [...Array(12).keys()]; }, lv);
        await page.locator('#nextBtn').isVisible() ? await page.locator('#nextBtn').click() : null;
        await page.locator('#openMenu').click(); await page.locator(`#lvlist [data-l="${lv}"]`).click();
        await answer(page, true);
        await expect(page.locator('#fb')).toHaveClass(/good/);
        if (lv === 5) await page.screenshot({ path: `tests/e2e/captures/${m.id}-${info.project.name}-juste.png`, fullPage: true });
        await page.locator('#nextBtn').click();
        await answer(page, false);
        await expect(page.locator('#fb')).toHaveClass(/bad/);
        await expect(page.locator('#fb')).toContainText('💡');
        await page.evaluate(() => window.__mp.resetAnswer());
        await answer(page, false);
        await expect(page.locator('#fb')).toContainText('correction');
        if (lv === 11) await page.screenshot({ path: `tests/e2e/captures/${m.id}-${info.project.name}-correction.png`, fullPage: true });
        await page.locator('#nextBtn').click();
      }
    }
    expect(errors.filter(e => !/favicon/.test(e))).toEqual([]);
    expect(external).toEqual([]);
    // pas de débordement horizontal
    const over = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
    expect(over).toBeLessThanOrEqual(1);
  });
}

test('accueil, export / import, hors ligne', async ({ page, context }, info) => {
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  await page.goto('./');
  await expect(page.locator('.mcard').first()).toBeVisible();
  await page.screenshot({ path: `tests/e2e/captures/accueil-${info.project.name}.png`, fullPage: true });
  await page.locator('#expBtn').click();
  const code = await page.locator('#expCode').inputValue();
  expect(code.length).toBeGreaterThan(10);
  await page.locator('#impBtn').click();
  await page.locator('#impCode').fill(code);
  await page.locator('#impGo').click();
  await expect(page.locator('#impMsg')).toContainText('✅');
  // hors ligne : attendre que le service worker ait tout mis en cache
  await page.evaluate(async () => { await navigator.serviceWorker.ready; });
  await page.waitForFunction(async () => {
    const ks = await caches.keys(); if (!ks.length) return false;
    return (await (await caches.open(ks[0])).keys()).length > 20;
  });
  await context.setOffline(true);
  await page.goto('modules/fractions/');
  await expect(page.locator('#q')).not.toBeEmpty();
  await page.goto('./');
  await expect(page.locator('.mcard').first()).toBeVisible();
  await context.setOffline(false);
  expect(errors).toEqual([]);
});

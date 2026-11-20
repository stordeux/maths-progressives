// Pour chaque module : chargement sans erreur, bonne réponse acceptée, réponse fausse → indice → correction,
// aucun appel réseau externe, captures d'écran (dans tests/e2e/captures/, à regarder).
import { test, expect } from '@playwright/test';
import { READY as MODULES } from '../../modules/registry.js';
import { FICHES_PRETES } from '../../fiches/registry.js';

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

// La fenêtre d'accueil (première ouverture) est testée à part ; ailleurs on la considère déjà vue.
test.beforeEach(async ({ page }, info) => {
  if (!info.title.startsWith("fenêtre d'accueil")) await page.addInitScript(() => { try { localStorage.setItem('mp:bienvenue', '1'); } catch (e) { /* rien */ } });
});

test("fenêtre d'accueil : une seule fois, montre le bouton 🐞", async ({ page }, info) => {
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  await page.goto('./');
  const dlg = page.locator('#bienvenueModal');
  await expect(dlg).toBeVisible();
  await expect(dlg).toContainText('en cours de développement');
  await expect(dlg).toContainText('explication supplémentaire');
  await expect(dlg).toContainText('en bas à droite');
  await expect(page.locator('#sigBtn')).toHaveClass(/sig-fab-montre/);
  await page.screenshot({ path: `tests/e2e/captures/bienvenue-${info.project.name}.png` });
  await page.locator('#bienvenueOk').click();
  await expect(dlg).toHaveCount(0);
  await expect(page.locator('#sigBtn')).not.toHaveClass(/sig-fab-montre/);
  await page.goto('modules/fractions/');
  await expect(page.locator('#coursToggle')).toBeVisible();
  await expect(page.locator('#bienvenueModal')).toHaveCount(0);
  expect(errors).toEqual([]);
});

for (const m of MODULES.filter(m => m.id !== 'revision')) {
  test(`${m.id} : parcours complet`, async ({ page }, info) => {
    const errors = [], external = [];
    page.on('console', msg => { if (msg.type() === 'error') errors.push(msg.text()); });
    page.on('pageerror', e => errors.push(e.message));
    page.on('request', r => { const u = new URL(r.url()); if (u.hostname !== 'localhost') external.push(r.url()); });
    await page.goto(`modules/${m.id}/`);
    if (m.id === 'calcul') {
      // calcul mental : cours dans une fenêtre, ouverte seulement par le bouton
      await expect(page.locator('#coursModal')).not.toHaveClass(/open/);
      await page.locator('#coursBtn').click();
      await expect(page.locator('#coursModal')).toHaveClass(/open/);
      await page.screenshot({ path: `tests/e2e/captures/${m.id}-${info.project.name}-cours.png` });
      await page.locator('#coursModal [data-close]').click();
    } else {
      // le cours est replié à l'arrivée ; l'élève le déplie, l'exercice reste visible, puis il le replie
      await expect(page.locator('#coursInline')).toBeHidden();
      await expect(page.locator('#q')).toBeVisible();
      await page.locator('#coursToggle').click();
      await expect(page.locator('#coursInline')).toBeVisible();
      await expect(page.locator('#coursInline h2')).toBeVisible();
      await page.screenshot({ path: `tests/e2e/captures/${m.id}-${info.project.name}-cours.png` });
      await page.locator('#coursToggle').click();
      await expect(page.locator('#coursInline')).toBeHidden();
    }
    if (m.id === 'calcul') {
      for (let k = 0; k < 3; k++) {
        await expect(page.locator('#disp')).not.toHaveClass(/ok|ko/);
        const a = await page.evaluate(() => window.__mp.question.a);
        await typeNumber(page, a); await page.locator('#pad [data-k="ok"]').click();
        await expect(page.locator('#disp')).toHaveClass(/ok/);
      }
      await page.screenshot({ path: `tests/e2e/captures/${m.id}-${info.project.name}.png` });
      await expect(page.locator('#disp')).not.toHaveClass(/ok|ko/);
      const a = await page.evaluate(() => window.__mp.question.a);
      await typeNumber(page, a + 1); await page.locator('#pad [data-k="ok"]').click();
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

test('accueil : réinitialiser toute la progression (réglages gardés)', async ({ page }) => {
  await page.goto('./');
  await page.evaluate(() => {
    localStorage.setItem('mp:fractions', JSON.stringify({ level: 4, stars: 3, good: 9, total: 12, last: Date.now() }));
    localStorage.setItem('mp:reglages', JSON.stringify({ grand: true }));
  });
  await page.reload();
  await expect(page.locator('.mcard[href$="modules/fractions/"]')).toContainText('Niveau 5');
  await page.locator('#rstBtn').click();
  await expect(page.locator('#rstBox')).toBeVisible();
  await page.locator('#rstYes').click();
  await expect(page.locator('#rstMsg')).toContainText('remis à zéro');
  const reste = await page.evaluate(() => ({ f: localStorage.getItem('mp:fractions'), r: localStorage.getItem('mp:reglages'), b: localStorage.getItem('mp:bienvenue') }));
  expect(reste.f).toBeNull();
  expect(reste.r).not.toBeNull();
  expect(reste.b).not.toBeNull();
  await expect(page.locator('.mcard[href$="modules/fractions/"]')).not.toContainText('Niveau 5');
});

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

// Titre de l'élève (ticket n° 6) : un titre par appareil, calculé sur toute la progression.
const progression = (page, data) => page.addInitScript(d => {
  if (sessionStorage.getItem('mp-test-pose')) return; // une seule fois : les rechargements gardent ce que la page a écrit
  sessionStorage.setItem('mp-test-pose', '1');
  for (const [k, v] of Object.entries(d)) localStorage.setItem('mp:' + k, JSON.stringify(v));
}, data);

test("accueil : titre de l'élève, barre vers le titre suivant, Réinitialiser → Stagiaire, import", async ({ page }, info) => {
  // 60 + 60 + 43 + 22 + 60 + 9 = 254 étoiles : Expert (240), Maître à 420 → il en manque 166, barre à 7 %
  await progression(page, {
    fractions: { level: 11, stars: 5, good: 70, total: 80, last: 1 }, relatifs: { level: 11, stars: 5, total: 70, last: 1 },
    calcul: { level: 8, stars: 3, total: 50, last: 1 }, equations: { level: 4, stars: 2, total: 30, last: 1 },
    pythagore: { level: 11, stars: 5, total: 66, last: 1 }, angles: { level: 1, stars: 4, total: 9, last: 1 },
    revision: { sessions: 2, best: 80, last: 1 },
  });
  await page.goto('./');
  await expect(page.locator('#titreNom')).toHaveText('Expert');
  await expect(page.locator('#titre')).toContainText('🎖️ Ton titre : Expert');
  await expect(page.locator('#titreTotal')).toContainText('254 étoiles');
  await expect(page.locator('#titreSuite')).toContainText('Encore 166 étoiles pour devenir Maître');
  const barre = page.locator('#titre [role="progressbar"]');
  await expect(barre).toHaveAttribute('aria-valuenow', '7');
  const larg = await barre.evaluate(b => b.firstElementChild.getBoundingClientRect().width / b.getBoundingClientRect().width);
  expect(larg).toBeGreaterThan(0.06); expect(larg).toBeLessThan(0.09);
  await expect(page.locator('#titre .techelle li')).toHaveCount(10);
  await expect(page.locator('#titre .techelle li.ici')).toHaveText('Expert');
  await expect(page.locator('#titre .techelle li.fait')).toHaveCount(5);
  // bien visible : au-dessus des modules, dans le premier écran, sans débordement
  const boite = await page.locator('#titre').boundingBox(), carte = await page.locator('.mcard').first().boundingBox();
  expect(boite.y + boite.height).toBeLessThanOrEqual(carte.y);
  expect(boite.y + boite.height).toBeLessThan(page.viewportSize().height);
  expect(await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)).toBeLessThanOrEqual(1);
  await page.screenshot({ path: `tests/e2e/captures/accueil-titre-${info.project.name}.png`, fullPage: true });
  // l'export garde de quoi recalculer le titre
  await page.locator('#expBtn').click();
  const code = await page.locator('#expCode').inputValue();
  // Réinitialiser → Stagiaire
  await page.locator('#rstBtn').click();
  await page.locator('#rstYes').click();
  await expect(page.locator('#rstMsg')).toContainText('remis à zéro');
  await expect(page.locator('#titreNom')).toHaveText('Stagiaire');
  await expect(page.locator('#titreTotal')).toContainText('0 étoile en tout');
  await expect(page.locator('#titreSuite')).toContainText('Encore 10 étoiles pour devenir Novice');
  await expect(barre).toHaveAttribute('aria-valuenow', '0');
  await page.screenshot({ path: `tests/e2e/captures/accueil-titre-${info.project.name}-stagiaire.png` });
  await page.reload();
  await expect(page.locator('#titreNom')).toHaveText('Stagiaire');
  // Importer → le titre revient
  await page.locator('#impBtn').click();
  await page.locator('#impCode').fill(code);
  await page.locator('#impGo').click();
  await expect(page.locator('#impMsg')).toContainText('✅');
  await expect(page.locator('#titreNom')).toHaveText('Expert');
  await expect(page.locator('#titreTotal')).toContainText('254 étoiles');
});

test('accueil : dernier titre (International), message de fin', async ({ page }, info) => {
  const plein = { level: 11, stars: 5, total: 70, last: 1 };
  await progression(page, Object.fromEntries(MODULES.filter(m => m.id !== 'revision').slice(0, 18).map(m => [m.id, plein])));
  await page.goto('./');
  await expect(page.locator('#titreNom')).toHaveText('International');
  await expect(page.locator('#titreTotal')).toContainText('1080 étoiles');
  await expect(page.locator('#titreSuite')).toContainText('plus haut titre');
  await expect(page.locator('#titre [role="progressbar"]')).toHaveAttribute('aria-valuenow', '100');
  await expect(page.locator('#titre .techelle li.ici')).toHaveText('International');
  await page.screenshot({ path: `tests/e2e/captures/accueil-titre-${info.project.name}-international.png` });
});

test('fractions : bandeau « Tu deviens … » avec le bandeau de niveau, sans se cacher', async ({ page }, info) => {
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  // 9 étoiles en tout (niveau 2, 4 ★) : la prochaine réussite donne la 10e → Novice, et débloque le niveau 3
  await progression(page, { fractions: { level: 1, stars: 4, good: 9, total: 9, n: 9, last: 1 } });
  await page.goto('modules/fractions/');
  await page.locator('#openMenu').click();
  await expect(page.locator('#menuTitre')).toContainText('Ton titre : Stagiaire · 9 étoiles en tout · encore 1 pour devenir Novice');
  await page.locator('#menu [data-close]').click();
  await expect(page.locator('#banner')).not.toHaveClass(/show/);
  await answer(page, true);
  await expect(page.locator('#fb')).toHaveClass(/good/);
  await expect(page.locator('#banner')).toHaveClass(/show/);
  await expect(page.locator('#banner')).toContainText('🎖️ Tu deviens Novice !');
  await page.locator('#nextBtn').click();
  // les deux messages sont affichés ensemble, l'un sous l'autre
  await expect(page.locator('#banner .ligne')).toHaveCount(2);
  await expect(page.locator('#banner')).toContainText('🎖️ Tu deviens Novice !');
  await expect(page.locator('#banner')).toContainText('Niveau 3 débloqué');
  const [a, b] = await page.locator('#banner .ligne').evaluateAll(ls => ls.map(l => { const r = l.getBoundingClientRect(); return { y: r.y, h: r.height }; }));
  expect(b.y).toBeGreaterThanOrEqual(a.y + a.h);
  await page.screenshot({ path: `tests/e2e/captures/titre-bandeau-${info.project.name}.png` });
  // le bandeau finit par s'effacer et se vider ; une faute ne retire pas les étoiles gagnées : pas d'annonce, le titre reste
  await expect(page.locator('#banner')).not.toHaveClass(/show/, { timeout: 8000 });
  await expect(page.locator('#banner .ligne')).toHaveCount(0);
  await answer(page, false);
  await expect(page.locator('#fb')).toHaveClass(/bad/);
  await expect(page.locator('#banner .ligne')).toHaveCount(0);
  await page.locator('#openMenu').click();
  await expect(page.locator('#menuTitre')).toContainText('Ton titre : Novice · 10 étoiles en tout');
  await page.locator('#menu [data-close]').click();
  // l'accueil affiche le même total
  await page.goto('./');
  await expect(page.locator('#titreNom')).toHaveText('Novice');
  await expect(page.locator('#titreTotal')).toContainText('10 étoiles');
  expect(errors).toEqual([]);
});

test('calcul : bandeau « Tu deviens … » en calcul mental (progression des autres modules comptée)', async ({ page }, info) => {
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  // 25 (fractions) + 4 (calcul) = 29 étoiles : la prochaine réussite rapide donne la 30e → Apprenti, et le niveau 2 du calcul
  await progression(page, { fractions: { level: 5, stars: 0, total: 30, last: 1 }, calcul: { level: 0, stars: 4, good: 4, total: 4, last: 1 } });
  await page.goto('modules/calcul/');
  await expect(page.locator('#disp')).not.toHaveClass(/ok|ko/);
  const a = await page.evaluate(() => window.__mp.question.a);
  await typeNumber(page, a); await page.locator('#pad [data-k="ok"]').click();
  await expect(page.locator('#banner')).toContainText('🎖️ Tu deviens Apprenti !');
  await expect(page.locator('#banner')).toContainText('Niveau 2 débloqué');
  await expect(page.locator('#banner .ligne')).toHaveCount(2);
  // le bandeau (une fois en place) ne cache pas le calcul chronométré
  await page.waitForTimeout(500);
  const bas = await page.locator('#banner').evaluate(b => b.getBoundingClientRect().bottom), haut = await page.locator('#mq').evaluate(q => q.getBoundingClientRect().top);
  expect(bas).toBeLessThanOrEqual(haut);
  await page.screenshot({ path: `tests/e2e/captures/titre-bandeau-calcul-${info.project.name}.png` });
  await page.locator('#openMenu').click();
  await expect(page.locator('#menuTitre')).toContainText('Ton titre : Apprenti · 30 étoiles');
  expect(errors).toEqual([]);
});

test('fêtes : étoile qui pope, gerbe, faute qui secoue, titre avec couronne', async ({ page }, info) => {
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  await progression(page, { fractions: { level: 1, stars: 2, good: 7, total: 7, n: 7, last: 1 } });
  await page.goto('modules/fractions/');
  await answer(page, true);
  await expect(page.locator('#dots i.pop')).toHaveCount(1);
  await expect(page.locator('#acard')).toHaveClass(/eclat/);
  expect(await page.locator('.fete span').count()).toBeGreaterThan(0);
  await page.waitForTimeout(250);
  await page.screenshot({ path: `tests/e2e/captures/fete-etoile-${info.project.name}.png` });
  // les étoiles ne prennent pas les clics : « Suivant » reste utilisable tout de suite
  await page.locator('#nextBtn').click();
  await expect(page.locator('#okBtn')).toBeVisible();
  await answer(page, false);
  await expect(page.locator('#answer')).toHaveClass(/secoue/);
  await expect(page.locator('.fete')).toHaveCount(0, { timeout: 4000 });
  // titre : la médaille et la couronne d'étoiles
  await page.evaluate(() => localStorage.setItem('mp:fractions', JSON.stringify({ level: 1, stars: 4, good: 9, total: 9, n: 9, last: 1 })));
  await page.goto('modules/fractions/');
  await answer(page, true);
  await expect(page.locator('#banner .medaille')).toHaveCount(1);
  await expect(page.locator('#banner')).toContainText('Tu deviens Novice !');
  await page.waitForTimeout(900);
  await page.screenshot({ path: `tests/e2e/captures/fete-titre-${info.project.name}.png` });
  await page.locator('#nextBtn').click();
  await page.waitForTimeout(500);
  await page.screenshot({ path: `tests/e2e/captures/fete-niveau-${info.project.name}.png` });
  expect(errors).toEqual([]);
});

test('révision brevet : séance de 5 exercices et bilan', async ({ page }, info) => {
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  page.on('console', msg => { if (msg.type() === 'error') errors.push(msg.text()); });
  await page.goto('modules/revision/');
  await page.locator('#q [data-n="5"]').click();
  for (let i = 0; i < 5; i++) {
    await expect(page.locator('#okBtn')).toBeVisible();
    await answer(page, i % 2 === 0);
    await expect(page.locator('#fb')).toHaveClass(i % 2 === 0 ? /good/ : /bad/);
    if (i === 1) await page.screenshot({ path: `tests/e2e/captures/revision-${info.project.name}.png` });
    await page.locator('#nextBtn').click();
  }
  await expect(page.locator('#q')).toContainText('Bilan : 3 / 5');
  await page.screenshot({ path: `tests/e2e/captures/revision-${info.project.name}-bilan.png`, fullPage: true });
  expect(errors).toEqual([]);
});

test("trigo : douze exercices de suite au niveau 1, aucun énoncé répété parmi les 10 derniers (ticket n° 7)", async ({ page }) => {
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  await page.goto('modules/trigo/?niveau=1');
  const vus = [];
  for (let k = 0; k < 12; k++) {
    await expect(page.locator('#okBtn')).toBeVisible();
    const angle = await page.locator('#q b').first().innerText();
    // la garantie porte sur les 10 derniers énoncés (le 12e peut reprendre le 1er)
    expect(vus.slice(-10), `exercice ${k + 1} : ${angle} déjà vu`).not.toContain(angle);
    vus.push(angle);
    // deux réponses fausses : on reste au niveau 1 avec 0 étoile (les angles les plus simples, le plus petit réservoir)
    await answer(page, false);
    await page.evaluate(() => window.__mp.resetAnswer());
    await answer(page, false);
    await page.locator('#nextBtn').click();
  }
  expect(await page.evaluate(() => window.__mp.state.level)).toBe(0);
  // la mémoire des 10 derniers énoncés est enregistrée avec la progression : elle tient après un rechargement
  const mem = await page.evaluate(() => JSON.parse(localStorage.getItem('mp:trigo')).vus);
  expect(mem).toHaveLength(10);
  await page.reload();
  await expect(page.locator('#okBtn')).toBeVisible();
  expect(vus.slice(-10)).not.toContain(await page.locator('#q b').first().innerText());
  expect(errors).toEqual([]);
});

test('signaler une erreur : capture, texte, envoi', async ({ page }, info) => {
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  await page.goto('modules/fractions/');
  await page.locator('#sigBtn').click();
  await expect(page.locator('#sigModal')).toHaveClass(/open/);
  await expect(page.locator('#sigApercu')).toHaveAttribute('src', /blob:/);
  const taille = await page.evaluate(() => { const i = document.querySelector('#sigApercu'); return i.naturalWidth; });
  expect(taille).toBeGreaterThan(300);
  await page.locator('#sigTexte').fill('La correction dit 12 mais je trouve 14');
  // les chiffres tapés dans le texte ne doivent pas aller dans les cases de réponse
  expect(await page.locator('#answer .box').first().textContent()).toBe('');
  await page.screenshot({ path: `tests/e2e/captures/signaler-${info.project.name}.png` });
  // envoi direct : le relais reçoit le message, le contexte et la capture
  let recu = null;
  await page.route('https://relais.test/**', async route => {
    const req = route.request();
    const h = { 'Access-Control-Allow-Origin': '*' };
    if (req.method() === 'OPTIONS') return route.fulfill({ status: 204, headers: h });
    recu = req.postDataBuffer();
    if (req.url().endsWith('/panne')) return route.fulfill({ status: 502, headers: h, contentType: 'application/json', body: '{"ok":false,"erreur":"GitLab a refusé le ticket (500)"}' });
    return route.fulfill({ status: 201, headers: h, contentType: 'application/json', body: '{"ok":true,"numero":7}' });
  });
  await page.evaluate(() => { window.__sigRelais = 'https://relais.test/signaler'; });
  await page.locator('#sigDirect').click();
  await expect(page.locator('#sigEtat')).toContainText('Message envoyé');
  const corps = recu.toString('utf8');
  expect(corps).toContain('name="capture"');
  expect(corps).toContain('image/png');
  expect(corps).toContain('La correction dit 12 mais je trouve 14');
  await expect(page.locator('#sigModal')).not.toHaveClass(/open/, { timeout: 5000 });
  // relais en panne : pas de messagerie, le message est gardé pour réessayer
  await page.locator('#sigBtn').click();
  await expect(page.locator('#sigApercu')).toHaveAttribute('src', /blob:/);
  await page.locator('#sigTexte').fill('La correction dit 12 mais je trouve 14');
  await page.evaluate(() => { window.__sigRelais = 'https://relais.test/panne'; });
  await page.locator('#sigDirect').click();
  await expect(page.locator('#sigEtat')).toContainText("n'a pas marché");
  await expect(page.locator('#sigTexte')).toHaveValue('La correction dit 12 mais je trouve 14');
  await expect(page.locator('#sigDirect')).toBeEnabled();
  expect(errors).toEqual([]);
});

for (const f of FICHES_PRETES) {
  test(`fiche ${f.id} : plan, liens vers les niveaux, hors ligne`, async ({ page, context }, info) => {
    const errors = [];
    page.on('pageerror', e => errors.push(e.message));
    await page.goto('./');
    await page.locator(`a[href="fiches/?f=${f.id}"]`).click();
    await expect(page.locator('#fplan li').first()).toBeVisible();
    await expect(page.locator('#fiche svg').first()).toBeVisible();
    const largeur = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    expect(largeur).toBeLessThanOrEqual(0);
    await page.screenshot({ path: `tests/e2e/captures/fiche-${f.id}-${info.project.name}.png`, fullPage: true });
    // hors ligne, la fiche reste lisible
    await page.evaluate(async () => { await navigator.serviceWorker.ready; });
    await page.waitForFunction(async () => {
      const ks = await caches.keys(); if (!ks.length) return false;
      return (await (await caches.open(ks[0])).keys()).some(r => r.url.includes('/fiches/'));
    });
    await context.setOffline(true);
    await page.reload();
    await expect(page.locator('#fplan li').first()).toBeVisible();
    await context.setOffline(false);
    // un lien « S'entraîner » ouvre le bon niveau du module
    const lien = page.locator('#fliensGrid a').first();
    const href = await lien.getAttribute('href');
    const niveau = +href.split('niveau=')[1];
    await lien.click();
    await expect(page.locator('#q')).not.toBeEmpty();
    expect(await page.evaluate(() => window.__mp.state.level + 1)).toBe(niveau);
    expect(errors).toEqual([]);
  });
}

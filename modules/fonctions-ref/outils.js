// Fonctions de référence : outils communs.
//
// Une FORME d'exercice = { id, dmin, titre, draw(d) → paramètres, build(p) → exercice, ex: paramètres fixes }.
//  - generate(d) tire une forme parmi celles dont dmin ≤ d, ses paramètres avec draw(d), puis build(p) ;
//  - cours() montre, pour CHAQUE forme du niveau, un exemple corrigé obtenu avec build(ex) : le cours et les exercices
//    partagent donc exactement le même énoncé, le même indice et la même correction.
//  - build(p) peut renvoyer null (tirage refusé) : generate retire.
// build renvoie un exercice du moteur (type, html, visual, tpl, check, hint, solution…) plus :
//  rep = la réponse écrite (HTML), affichée dans l'exemple du cours.
// Dans build, tout hasard passe par melange() : en mode « cours » (FIXE) l'ordre des choix est celui de la liste.
import { ri, pick, shuffle, chance } from '../../engine/util/rand.js';
import { numsCheck, fracCheck, rootsCheck, choiceCheck, ivCheck, tableCheck } from '../../engine/answers/checks.js';
import { M, P, F, R, terms } from '../../engine/util/fmt.js';
import { fmtSet, REALS, I } from '../../engine/draw/realLine.js';
import { r6, gcd } from '../../engine/util/arith.js';

export { ri, pick, shuffle, chance, M, P, F, R, terms, fmtSet, REALS, I, r6, gcd };
export const INF = Infinity;

let FIXE = false;
export const melange = a => (FIXE ? [...a] : shuffle([...a]));

/* ---------- écritures ---------- */
export const sup = (b, e) => `${b}<sup>${e}</sup>`;
export const carre = a => `${P(a)}<sup>2</sup>`;
export const cube = a => `${P(a)}<sup>3</sup>`;
export const inv = a => F(1, M(a));
export const rac = a => R(M(a));
export const X2 = 'x<sup>2</sup>', X3 = 'x<sup>3</sup>';
export const big = s => `<div class="big">${s}</div>`;
export const aff = (a, b) => terms([[a, 'x'], [b, '']]);
/** ax + b écrit proprement ; « 8 − 2x » plutôt que « −2x + 8 » */
export const lin = (a, b) => (a < 0 && b > 0 ? `${M(b)} − ${Math.abs(a) === 1 ? '' : M(-a)}x` : aff(a, b));
/** ax seul */
export const ax = a => terms([[a, 'x']]);
/** « f(x) = … » */
export const fx = (nom, rhs) => `${nom}(x) = ${rhs}`;
/** relation d'ordre pour l'affichage */
export const REL = { '<': '&lt;', '≤': '≤', '>': '&gt;', '≥': '≥' };
/** signe de comparaison d'après la différence a − b */
export const signe = v => (v < -1e-12 ? '<' : v > 1e-12 ? '>' : '=');
export const sgnTxt = { '<': '&lt;', '>': '&gt;', '=': '=' };
const fill = (tpl, E) => tpl.replace(/\{(\d+)\}/g, (_, i) => `<b>${M(E[+i])}</b>`);

/* ---------- réponses ---------- */
/** cases numériques ; tpl : gabarit {0}, {1}… ; msg(v) : message « presque juste » */
export function rNums(E, o = {}) {
  const tpl = o.tpl || 'Réponse : {0}';
  const q = { type: 'nums', tpl, check: numsCheck(E, { msg: o.msg }), expected: E, rep: fill(tpl, E) };
  if (o.value !== undefined) q.value = o.value;
  return q;
}
/** fraction irréductible N/D */
export function rFrac(N, D, o = {}) {
  const g = gcd(N, D), n = N / g, d = D / g, s = n * d < 0 ? '−' : '';
  const q = { type: 'frac', check: fracCheck(n * Math.sign(d), Math.abs(d), { irr: true }), rep: d === 1 ? M(n) : `${s}${F(Math.abs(n), Math.abs(d))}` };
  if (o.value !== undefined) q.value = o.value;
  return q;
}
/** réunion d'intervalles S ; truth(x) : x est-il solution ? */
export const rIv = (S, truth) => ({ type: 'iv', check: ivCheck(S), expected: S, truth, rep: fmtSet(S) });
/** équation : racines E (triées) ; truth(x) */
export function rRoots(E, truth, o = {}) {
  const e = [...new Set(E)].sort((a, b) => a - b);
  const q = { type: 'roots', check: rootsCheck(e, { noneMsg: o.noneMsg }), expected: e, truth, rep: e.length ? e.map(M).join(' et ') : (o.none || 'aucune solution').toLowerCase() };
  if (o.none) q.noneLabel = o.none;
  return q;
}
/** comparaison < = > ; value = a − b (vérification indépendante) */
export function rCmp(s, o = {}) {
  const q = { type: 'cmp', check: choiceCheck(s, { msg: o.msg ? () => o.msg : undefined }), expected: s, rep: `<b>${sgnTxt[s]}</b>` };
  if (o.value !== undefined) q.value = o.value;
  return q;
}
/** QCM : items [{ l, ok?, why? }] (un seul ok) ; indep : texte du bon choix recalculé autrement */
export function rChoice(items, o = {}) {
  const all = o.ordre ? [...items] : melange(items);
  const i = all.findIndex(x => x.ok), E = String(i);
  const q = {
    type: 'choice', opts: all.map((x, k) => ({ v: String(k), l: x.l })),
    check: choiceCheck(E, { msg: c => { const b = all[+c]; return b && b.why ? `⚠️ ${b.why}` : ''; } }),
    expected: E, rep: all[i].l,
  };
  if (o.indep !== undefined) q.verify = e => all[+e].l === o.indep;
  return q;
}
/** tableau de signes à compléter : xs, z (signes des zones) */
export function rTable(xs, z, o = {}) {
  const lines = []; z.forEach((s, i) => { lines.push(s); if (i < xs.length) lines.push(o.barre && o.barre[i] ? '‖' : '0'); });
  return { type: 'table', xs, fmtX: M, rowLabel: o.label || 'signe', bars: o.barre, check: tableCheck(z), expected: z, rep: lines.join(' ') };
}

/* ---------- niveaux ---------- */
const sansBalises = s => String(s).replace(/<[^>]+>/g, '');
/** exemple corrigé d'une forme (cours) : mêmes énoncé, indice et solution que l'exercice, ordre des choix fixe */
function exemple(f, num) {
  FIXE = true;
  let q;
  try { q = f.build(f.ex); } finally { FIXE = false; }
  if (!q) throw new Error(`exemple impossible : ${f.id}`);
  let choix = '';
  if (q.type === 'choice' && !q.opts.some(o => /<table|<svg/.test(o.l))) {
    choix = `<div class="choixex">${q.opts.map((o, i) => `<b>${'ABCD'[i]}.</b> ${i === +q.expected ? '<b>' + o.l + ' ✓</b>' : o.l}`).join(' &nbsp;·&nbsp; ')}</div>`;
  }
  const rep = `<b>Réponse :</b> ${q.rep}`;
  return `<div class="ex" data-form="${f.id}"><span class="q">Exemple ${num} : ${f.titre}</span><br>${q.html}${q.visual || ''}${choix}<div class="repex">${rep}</div>${q.solution}${q.afterVisual || ''}</div>`;
}
export const exemples = forms => forms.map((f, i) => exemple(f, i + 1)).join('\n');
/** l'exemple d'une forme, pour les tests */
export function exempleDe(f) { FIXE = true; try { return f.build(f.ex); } finally { FIXE = false; } }

/**
 * Niveau : { titre, generate(d), cours(), forms, classe }.
 *  c = { n, intro, def, visuel, methode: [étapes], warn: [pièges], retenir, classe }
 */
export function niveau(titre, forms, c) {
  const generate = d => {
    const ok = forms.filter(f => f.dmin <= d);
    for (let k = 0; k < 80; k++) {
      const f = pick(ok);
      const q = f.build(f.draw(d));
      if (q) { q.form = f.id; return q; }
    }
    throw new Error(`niveau ${titre} : aucun tirage valide (d = ${d})`);
  };
  const cours = () => `<h2>${c.n}. ${titre}</h2>
<p class="intro">${c.intro}</p>
<div class="def">${c.def}</div>
${c.visuel || ''}
<div class="methode"><b>Méthode</b><ol>${c.methode.map(x => `<li>${x}</li>`).join('')}</ol></div>
${exemples(forms)}
<div class="warn">${c.warn.map(x => '⚠️ ' + x).join('<br>')}</div>
<div class="retenir">À retenir : ${c.retenir}</div>`;
  return { titre, generate, cours, forms, classe: c.classe || '2de' };
}
export const txt = sansBalises;

/** sens de variation d'une fonction numérique sur [p ; q], par échantillonnage (vérification indépendante) */
export function sensNum(f, p, q) {
  let up = true, dn = true;
  for (let x = p; x < q - 1e-9; x += 0.25) { const y0 = f(x), y1 = f(Math.min(q, x + 0.25)); if (!(y1 > y0 + 1e-12)) up = false; if (!(y1 < y0 - 1e-12)) dn = false; }
  return up ? 'croissante' : dn ? 'décroissante' : 'ni croissante ni décroissante';
}

/** entier avec espace insécable pour les milliers */
export const ent = n => String(Math.abs(Math.round(n))).replace(/\B(?=(\d{3})+(?!\d))/g, ' ');

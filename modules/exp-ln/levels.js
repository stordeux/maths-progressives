// Exponentielle et logarithme (1re – Terminale) : 12 niveaux, de la lecture de eˣ sur la courbe
// jusqu'aux dérivées de e^u et ln u.
// Vérifications indépendantes (tests) : on ne recopie jamais la formule de la réponse attendue.
//  - exposants et coefficients : `value` / `verify` recalculent l'expression de l'énoncé en flottants
//    (Math.exp, Math.log sur chaque facteur) et comparent ;
//  - équations : la solution est retrouvée par DICHOTOMIE sur l'équation d'origine (`value`), ou
//    reportée dans l'équation d'origine (`verify`), ou cherchée par force brute (`truth`, type roots) ;
//  - inéquations : `truth(x)` teste l'inéquation d'origine (Math.exp) point par point ;
//  - croissance : itération terme à terme (multiplications successives) ou équation différentielle
//    y′ = ky résolue par Runge-Kutta ; seuils : on cherche n en multipliant jusqu'à franchir le seuil ;
//  - dérivées : DÉRIVÉE NUMÉRIQUE (différences centrées + Richardson) de la fonction de l'énoncé ;
//    variations : échantillonnage de f.
import { ri, pick, nz, chance, shuffle } from '../../engine/util/rand.js';
import { numsCheck, choiceCheck, rootsCheck, ivCheck, tableCheck } from '../../engine/answers/checks.js';
import { M, P, F, R, big, terms, sgn, INF } from '../../engine/util/fmt.js';
import { r6 } from '../../engine/util/arith.js';
import { I, REALS, fmtSet, realLine } from '../../engine/draw/realLine.js';
import { signTableHTML } from '../../engine/draw/plot.js';
import { graph, barres, span, COL } from './draw.js';

/* ================= outils numériques ================= */
/** dérivée numérique : différences centrées, extrapolées (Richardson) */
const nd = (f, x, h = 1e-3) => { const D = k => (f(x + k) - f(x - k)) / (2 * k); return (4 * D(h / 2) - D(h)) / 3; };
/** égalité relative */
const near = (a, b, t = 1e-9) => a !== null && b !== null && isFinite(a) && isFinite(b) && Math.abs(a - b) <= t * Math.max(1, Math.abs(a), Math.abs(b));
/** dichotomie sur [lo ; hi] (g change de signe) */
function bisect(g, lo, hi) {
  let glo = g(lo);
  for (let i = 0; i < 200; i++) {
    const m = (lo + hi) / 2, gm = g(m);
    if (gm === 0) return m;
    if ((gm < 0) === (glo < 0)) { lo = m; glo = gm; } else hi = m;
  }
  return (lo + hi) / 2;
}
/** arrondi à k décimales (sans 1,005 → 1) */
const rnd = (x, k = 2) => { const p = 10 ** k; return Math.round(r6(x * p)) / p; };
/** écriture avec exactement k décimales */
const Mk = (x, k = 2) => (x < 0 ? '−' : '') + Math.abs(x).toFixed(k).replace('.', ',');
/** f croissante / décroissante au voisinage de x (à droite ou à gauche) */
const incr = (f, x, h = 1e-4) => f(x + h) > f(x) || f(x) > f(x - h);
const decr = (f, x, h = 1e-4) => f(x + h) < f(x) || f(x) < f(x - h);
/** la fonction g coïncide-t-elle avec la dérivée numérique de f aux points xs ? */
const sameDer = (f, g, xs) => xs.every(x => near(nd(f, x), g(x), 1e-6));
/** y′ = ky, y(0) = y0 : Runge-Kutta d'ordre 4 jusqu'à t */
function rk4(k, y0, t, n = 2000) {
  const h = t / n; let y = y0;
  for (let i = 0; i < n; i++) { const k1 = k * y, k2 = k * (y + h * k1 / 2), k3 = k * (y + h * k2 / 2), k4 = k * (y + h * k3); y += h * (k1 + 2 * k2 + 2 * k3 + k4) / 6; }
  return y;
}

/* ================= écriture ================= */
const PR = '′';
const EX = s => `e<sup>${s}</sup>`;
const lin = (a, b) => terms([[a, 'x'], [b, '']]);
const co = k => (k === 1 ? '' : k === -1 ? '−' : M(k));
const plus = n => (n === 0 ? '' : ' ' + sgn(n));
/** coefficient devant « ln » : 1 → '', −1 → '−', 3 → '3 ' (espace fine) */
const kl = k => (k === 1 ? '' : k === -1 ? '−' : M(k) + ' ');
/** coefficient multiplicatif écrit devant un facteur : 1 → '', sinon « 3 × » */
const fois = k => (k === 1 ? '' : k === -1 ? '−' : `${M(k)} × `);
const REL = { '<': '&lt;', '≤': '≤', '>': '&gt;', '≥': '≥' };
const CMP = { '<': (a, b) => a < b, '≤': (a, b) => a <= b, '>': (a, b) => a > b, '≥': (a, b) => a >= b };
const FLIP = { '<': '>', '≤': '≥', '>': '<', '≥': '≤' };
/** ensemble { x rel x0 } */
const setOf = (rel, x0) => (rel === '<' ? [I(-INF, 0, x0, 0)] : rel === '≤' ? [I(-INF, 0, x0, 1)] : rel === '>' ? [I(x0, 0, INF, 0)] : [I(x0, 1, INF, 0)]);
const relTxt = (rel, x0) => `x ${REL[rel]} ${M(x0)}`;
/** exposant en caractères Unicode (étiquettes SVG, où <sup> n'existe pas) : −2 → ⁻² */
const supU = n => M(n).replace(/[0-9−]/g, ch => '⁰¹²³⁴⁵⁶⁷⁸⁹⁻'['0123456789−'.indexOf(ch)]);

/* ================= vérifications « presque juste » ================= */
function chk(E, msg) {
  return numsCheck(E, { msg: v => (v.some(x => x === null) ? '' : msg ? msg(v) || '' : '') });
}
/** réponse arrondie : message si l'élève est tout près (mauvais arrondi) */
function chkA(E, exact, msg, k = 2) {
  return chk(E, v => {
    const m = msg ? msg(v) : '';
    if (m) return m;
    const i = E.length - 1;
    if (Math.abs(v[i] - exact) < 1.5 * 10 ** -k) return `Tu es tout près ! Vérifie l'arrondi ${k === 2 ? 'au centième' : k === 1 ? 'au dixième' : k === 3 ? 'au millième' : 'à l\'unité'} : on regarde le chiffre suivant (5 ou plus → on arrondit au-dessus).`;
    return '';
  });
}
/** intervalles : message ciblé quand l'élève a oublié de changer le sens */
function ivChk(E, flipMsg) {
  const base = ivCheck(E);
  const fn = v => {
    const r = base(v);
    if (r.ok || v.err || !flipMsg) return r;
    const u = v.set;
    if (u.length === 1 && E.length === 1) {
      const e = E[0], w = u[0], half = i => isFinite(i.lo) !== isFinite(i.hi), fin = i => (isFinite(i.lo) ? i.lo : i.hi);
      if (half(e) && half(w) && isFinite(e.lo) !== isFinite(w.lo) && fin(e) === fin(w)) return { ok: false, msg: flipMsg };
    }
    return r;
  };
  fn.expected = E; return fn;
}
/** solutions d'équation : message ciblé (o.extra(v) en premier) */
function rootsChk(E, o = {}) {
  const base = rootsCheck(E, o);
  const fn = v => {
    const r = base(v);
    if (r.ok) return r;
    const m = o.extra ? o.extra(v) : '';
    return m ? { ok: false, msg: m } : r;
  };
  fn.expected = base.expected; return fn;
}
const valsOf = v => (v.none ? [] : v.vals.filter(x => x !== null));

/* ================= dessins communs ================= */
const EXPF = { f: Math.exp, l: 'y = eˣ' };
const lnF = (xmax, l = 'y = ln x', c = COL.G) => ({ f: x => (x > 0 ? Math.log(x) : NaN), dom: [0.002, xmax], c, l });
/** e^x, ln x et la droite y = x (symétrie) */
function recip(pts = []) {
  return graph({ xr: [-3, 6], yr: [-3, 6], fs: [EXPF, lnF(6)], lines: [{ x: 0, y: 0, m: 1, c: '#868e96', dash: true, l: 'y = x' }], pts });
}

/* =====================================================================
   1. La courbe de exp : e⁰ = 1, eˣ > 0, lecture, croissance
   ===================================================================== */
function L1(d) {
  const kind = d < 1 ? 'e0' : d < 2 ? 'signe' : d < 3 ? 'lire' : d < 4 ? 'cmp' : pick(['cmp', 'lire', 'lireinv', 'signe', 'e0']);
  const W = { xr: [-3, 3], yr: [-1, 13] };
  if (kind === 'e0') {
    const k = d < 1 ? pick([1, 2, 3, 4, 5]) : nz(-9, 9), c = d < 1 ? ri(0, 9) : nz(-9, 9);
    const tex = `${co(k)}${EX(0)}${plus(c)}`, E = k + c, sc = { xr: [-3, 3], yr: [-1, 7], fs: [EXPF] };
    return {
      type: 'nums', html: `Calcule sans calculatrice :${big(tex)}`, tpl: '= {0}',
      check: chk([E], v => (near(v[0], c) ? 'Attention : e<sup>0</sup> = 1, et pas 0 ! (Regarde où la courbe coupe l\'axe des ordonnées.)' : near(v[0], k * Math.E + c, 1e-2) ? 'C\'est e<sup>1</sup> = e qui vaut environ 2,72. Ici l\'exposant est 0.' : '')),
      value: k * Math.exp(0) + c,
      visual: graph(sc), afterVisual: graph({ ...sc, pts: [{ x: 0, y: 1, l: 'e⁰ = 1' }] }), replaceVisual: true,
      hint: 'La courbe de y = e<sup>x</sup> coupe l\'axe des ordonnées à la hauteur 1 : <b>e<sup>0</sup> = 1</b>. Remplace e<sup>0</sup> par 1.',
      solution: `e<sup>0</sup> = 1, donc ${tex} = ${k === 1 ? '1' : k === -1 ? '−1' : `${M(k)} × 1`}${plus(c)} = <b>${M(E)}</b>.`,
    };
  }
  if (kind === 'signe') {
    const sub = d < 2 ? pick(['e', 'e', 'moins', 'diff']) : pick(['e', 'moins', 'diff', 'diff2']);
    const a = sub === 'e' || sub === 'moins' ? pick([-6, -5, -4, -3, -2, -1, 1, 2, -0.5]) : ri(-4, 2), k = pick([1, 2, 3, 5]);
    let tex, val, Ek, why;
    const ea = EX(M(a));
    if (sub === 'e') { tex = `${co(k)}${ea}`; val = k * Math.exp(a); Ek = 'pos'; why = `${ea} &gt; 0 (une exponentielle est toujours strictement positive)${k > 1 ? `, et ${k} &gt; 0` : ''}.`; }
    else if (sub === 'moins') { tex = `−${co(k)}${ea}`; val = -k * Math.exp(a); Ek = 'neg'; why = `${ea} &gt; 0, donc −${co(k)}${ea} &lt; 0.`; }
    else if (sub === 'diff') { tex = `${ea} − 1`; val = Math.exp(a) - 1; Ek = a > 0 ? 'pos' : a < 0 ? 'neg' : 'nul'; why = a === 0 ? 'e<sup>0</sup> = 1, donc e<sup>0</sup> − 1 = 0.' : `1 = e<sup>0</sup> et exp est croissante : ${M(a)} ${a > 0 ? '&gt;' : '&lt;'} 0 donne ${ea} ${a > 0 ? '&gt;' : '&lt;'} 1.`; }
    else { tex = `1 − ${ea}`; val = 1 - Math.exp(a); Ek = a < 0 ? 'pos' : a > 0 ? 'neg' : 'nul'; why = a === 0 ? 'e<sup>0</sup> = 1, donc 1 − e<sup>0</sup> = 0.' : `1 = e<sup>0</sup> et exp est croissante : ${M(a)} ${a > 0 ? '&gt;' : '&lt;'} 0 donne ${ea} ${a > 0 ? '&gt;' : '&lt;'} 1.`; }
    const sc = { xr: [-6, 3], yr: [-1, 8], fs: [EXPF] };
    return {
      type: 'choice', html: `Quel est le signe de ce nombre ?${big(tex)}`,
      opts: [{ v: 'pos', l: 'strictement positif' }, { v: 'nul', l: 'nul' }, { v: 'neg', l: 'strictement négatif' }],
      check: choiceCheck(Ek, { msg: c => (sub === 'e' && c !== 'pos' ? `Une exponentielle est <b>toujours strictement positive</b>, même avec un exposant négatif : ${ea} ≈ ${M(rnd(Math.exp(a), 3))}.` : sub.startsWith('diff') ? 'Compare d\'abord e<sup>…</sup> à 1 = e<sup>0</sup>.' : '') }),
      verify: Ev => Ev === (val > 1e-12 ? 'pos' : val < -1e-12 ? 'neg' : 'nul'),
      visual: graph(sc), afterVisual: graph({ ...sc, pts: [{ x: a, y: Math.exp(a), l: `(${M(a)} ; ${M(rnd(Math.exp(a), 2))})`, px: true, ly: -12 }] }), replaceVisual: true,
      hint: 'La courbe de y = e<sup>x</sup> est toujours <b>au-dessus</b> de l\'axe des abscisses : e<sup>x</sup> &gt; 0 pour tout x. Et e<sup>x</sup> &gt; 1 seulement quand x &gt; 0.',
      solution: `${why} Le nombre est <b>${Ek === 'pos' ? 'strictement positif' : Ek === 'neg' ? 'strictement négatif' : 'nul'}</b>.`,
    };
  }
  if (kind === 'lire') {
    const a = pick([1, 2, 2.2, 1.8, 1.2, -1, -0.5, 0.5, 2.5]), ea = Math.exp(a), E = Math.round(ea);
    const P0 = { x: a, y: ea, px: true };
    return {
      type: 'nums', keys: { neg: false },
      html: `Le point marqué est sur la courbe de y = e<sup>x</sup>, à l'abscisse ${M(a)}.<br>Lis sur le graphique la valeur de <b>${EX(M(a))}</b>, arrondie à l'unité.`,
      tpl: `${EX(M(a))} ≈ {0}`,
      check: chk([E], v => (Math.abs(v[0] - ea) < 1.2 ? 'Presque : regarde entre quelles graduations se trouve le point, puis prends la plus proche.' : '')),
      value: rnd(Math.E ** a, 0),
      visual: graph({ ...W, fs: [EXPF], pts: [P0] }), afterVisual: graph({ ...W, fs: [EXPF], pts: [{ ...P0, py: true, l: `≈ ${Mk(ea)}` }] }), replaceVisual: true,
      hint: `Pars du point marqué et va horizontalement jusqu'à l'axe des ordonnées : tu lis la hauteur ${EX(M(a))}.`,
      solution: `La hauteur du point est ${EX(M(a))} ≈ ${Mk(ea)}, donc à l'unité près : <b>${E}</b>.`,
    };
  }
  if (kind === 'lireinv') {
    const k = pick([2, 3, 4, 5, 6, 8, 10]), x = Math.log(k), E = rnd(x, 1);
    const fn = v => {
      if (v[0] === null) return { ok: false };
      if (Math.abs(v[0] - x) <= 0.15 + 1e-9) return { ok: true, msg: near(v[0], E) ? '' : `Accepté (lecture graphique). Plus précisément : x ≈ ${Mk(E, 1)}.` };
      return { ok: false, msg: near(v[0], k) ? `${k} est la hauteur : on cherche l'<b>abscisse</b> du point.` : '' };
    };
    fn.expected = [E];
    const P0 = { x, y: k, py: true };
    return {
      type: 'nums', html: `Lis sur la courbe l'abscisse x du point tel que <b>e<sup>x</sup> = ${k}</b> (au dixième près).`, tpl: 'x ≈ {0}',
      check: fn, value: rnd(bisect(t => Math.exp(t) - k, -5, 5), 1),
      visual: graph({ ...W, fs: [EXPF], pts: [P0] }), afterVisual: graph({ ...W, fs: [EXPF], pts: [{ ...P0, px: true, l: `x ≈ ${Mk(x)}` }] }), replaceVisual: true,
      hint: `Pars de la hauteur ${k} sur l'axe des ordonnées, va jusqu'à la courbe, puis descends sur l'axe des abscisses.`,
      solution: `Le point de hauteur ${k} a pour abscisse x ≈ ${Mk(x)} (c'est le nombre ln ${k}, vu au niveau 9). Au dixième : <b>${Mk(E, 1)}</b>.`,
    };
  }
  // comparer
  const sub = d >= 4 ? pick(['ab', 'un', 'zero', 'ab']) : pick(['ab', 'ab', 'un']);
  let a = ri(-6, 6) / 2, b; do { b = ri(-6, 6) / 2; } while (b === a);
  let Lh, Rh, diff, why;
  if (sub === 'ab') { Lh = EX(M(a)); Rh = EX(M(b)); diff = Math.exp(a) - Math.exp(b); why = `${M(a)} ${a < b ? '&lt;' : '&gt;'} ${M(b)} et la fonction exponentielle est <b>croissante</b>`; }
  else if (sub === 'un') { if (a === 0) a = pick([-1.5, 2]); Lh = EX(M(a)); Rh = '1'; diff = Math.exp(a) - 1; why = `1 = e<sup>0</sup>, ${M(a)} ${a < 0 ? '&lt;' : '&gt;'} 0 et exp est croissante`; }
  else { a = pick([-2, -3, -5, -10]); Lh = EX(M(a)); Rh = '0'; diff = Math.exp(a); why = 'une exponentielle est toujours strictement positive'; }
  const X = diff < 0 ? '<' : '>';
  const pts = sub === 'ab' ? [{ x: a, y: Math.exp(a), l: 'A', px: true }, { x: b, y: Math.exp(b), l: 'B', px: true }] : sub === 'un' ? [{ x: a, y: Math.exp(a), l: 'A', px: true }, { x: 0, y: 1, l: '(0 ; 1)', c: COL.G }] : [];
  return {
    type: 'cmp', html: `Compare, sans calculatrice :${big(`${Lh} &nbsp;<span style="color:var(--acc)">?</span>&nbsp; ${Rh}`)}`,
    check: choiceCheck(X, { msg: () => (sub === 'zero' ? 'Même avec un exposant très négatif, e<sup>…</sup> reste strictement positif.' : 'La fonction exponentielle est <b>croissante</b> : e<sup>a</sup> et e<sup>b</sup> sont rangés dans le même ordre que a et b.') }),
    value: diff,
    visual: '', afterVisual: graph({ xr: [-3, 3], yr: [-1, 21], fs: [EXPF], pts }),
    hint: 'La fonction exponentielle est <b>strictement croissante</b> : si a &lt; b, alors e<sup>a</sup> &lt; e<sup>b</sup>. Et e<sup>x</sup> &gt; 0 pour tout x.',
    solution: `${why[0].toUpperCase() + why.slice(1)}, donc ${Lh} <b>${REL[X]}</b> ${Rh}.`,
  };
}
function C1() {
  return `<h2>1. La fonction exponentielle</h2>
<div class="def">La fonction <b>exponentielle</b> x ↦ e<sup>x</sup> est définie sur ℝ, avec <b>e<sup>0</sup> = 1</b> et e<sup>1</sup> = e ≈ 2,718.<br>• e<sup>x</sup> &gt; 0 pour <b>tout</b> x : la courbe est toujours au-dessus de l'axe des abscisses ;<br>• elle est <b>strictement croissante</b> : a &lt; b ⟺ e<sup>a</sup> &lt; e<sup>b</sup>.</div>
<div class="ex">3e<sup>0</sup> − 5 = 3 × 1 − 5 = <b>−2</b>.<br>e<sup>−4</sup> &gt; 0 (même si l'exposant est négatif). &nbsp; e<sup>−1</sup> &lt; e<sup>0,5</sup> car −1 &lt; 0,5.</div>
<div class="warn">⚠️ e<sup>0</sup> = 1, pas 0.<br>⚠️ e<sup>−3</sup> n'est pas négatif : c'est un petit nombre positif (≈ 0,05).</div>
${graph({ xr: [-3, 3], yr: [-1, 8], fs: [EXPF], pts: [{ x: 0, y: 1, l: '(0 ; 1)', c: COL.G }, { x: 1, y: Math.E, l: '(1 ; e)', px: true, py: true }] })}`;
}

/* =====================================================================
   2. Règles de calcul : e^a × e^b, e^a / e^b, (e^a)^n
   ===================================================================== */
function L2(d) {
  const kind = d < 1 ? 'prod' : d < 2 ? pick(['prod', 'quot']) : d < 3 ? pick(['pow', 'inv', 'quot']) : d < 4 ? 'mix3' : pick(['mix3', 'powprod', 'inv', 'racine']);
  let tex, n, val, msg, sol;
  const e = k => EX(M(k));
  if (kind === 'prod') {
    const a = d < 1 ? ri(1, 9) : nz(-9, 9), b = d < 1 ? ri(1, 9) : nz(-9, 9);
    tex = `${e(a)} × ${e(b)}`; n = a + b; val = Math.exp(a) * Math.exp(b);
    msg = v => (near(v[0], a * b) && a * b !== n ? 'Pour un <b>produit</b>, on <b>ajoute</b> les exposants (on ne les multiplie pas).' : '');
    sol = `e<sup>a</sup> × e<sup>b</sup> = e<sup>a + b</sup> : ${M(a)} + ${P(b)} = ${M(n)}, donc ${tex} = <b>${e(n)}</b>.`;
  } else if (kind === 'quot') {
    const a = nz(-9, 9), b = nz(-9, 9);
    tex = F(e(a), e(b)); n = a - b; val = Math.exp(a) / Math.exp(b);
    msg = v => (near(v[0], a + b) && a + b !== n ? 'Pour un <b>quotient</b>, on <b>soustrait</b> les exposants : celui du haut moins celui du bas.' : near(v[0], b - a) && n !== 0 ? 'Presque : c\'est l\'exposant du <b>haut</b> moins celui du <b>bas</b>.' : near(v[0], a / b) ? 'On ne divise pas les exposants : on les soustrait.' : '');
    sol = `e<sup>a</sup> ÷ e<sup>b</sup> = e<sup>a − b</sup> : ${M(a)} − ${P(b)} = ${M(n)}, donc <b>${e(n)}</b>.`;
  } else if (kind === 'pow') {
    const a = nz(-6, 6), k = ri(2, 4);
    tex = `(${e(a)})<sup>${k}</sup>`; n = a * k; val = Math.exp(a) ** k;
    msg = v => (near(v[0], a + k) ? `(e<sup>a</sup>)<sup>n</sup> = e<sup>a × n</sup> : on <b>multiplie</b> l'exposant par ${k}.` : near(v[0], a ** k) && a ** k !== n ? 'On ne met pas l\'exposant à la puissance : on le multiplie par n.' : '');
    sol = `(e<sup>a</sup>)<sup>n</sup> = e<sup>na</sup> : ${k} × ${P(a)} = ${M(n)}, donc <b>${e(n)}</b>.`;
  } else if (kind === 'inv') {
    const a = nz(-8, 8), k = d >= 4 && chance(0.5) ? ri(2, 3) : 1;
    tex = F(1, k === 1 ? e(a) : `(${e(a)})<sup>${k}</sup>`); n = -a * k; val = 1 / Math.exp(a) ** k;
    msg = v => (near(v[0], a * k) && n !== 0 ? `${F(1, 'e<sup>a</sup>')} = e<sup>−a</sup> : l'exposant <b>change de signe</b>.` : '');
    sol = `${k === 1 ? '' : `(${e(a)})<sup>${k}</sup> = ${e(a * k)}, puis `}${F(1, 'e<sup>a</sup>')} = e<sup>−a</sup>, donc ${tex} = <b>${e(n)}</b>.`;
  } else if (kind === 'mix3') {
    const a = nz(-9, 9), b = nz(-9, 9), c = nz(-9, 9);
    tex = F(`${e(a)} × ${e(b)}`, e(c)); n = a + b - c; val = Math.exp(a) * Math.exp(b) / Math.exp(c);
    msg = v => (near(v[0], a + b + c) ? 'L\'exposant du dénominateur se <b>soustrait</b>.' : near(v[0], a * b - c) ? 'Pour le produit du haut, on <b>ajoute</b> les exposants.' : '');
    sol = `Numérateur : ${e(a)} × ${e(b)} = ${e(a + b)}.<br>Puis ${F(e(a + b), e(c))} = e<sup>${M(a + b)} − ${P(c)}</sup> = <b>${e(n)}</b>.`;
  } else if (kind === 'powprod') {
    const a = nz(-5, 5), k = ri(2, 4), b = nz(-9, 9);
    tex = `(${e(a)})<sup>${k}</sup> × ${e(b)}`; n = a * k + b; val = Math.exp(a) ** k * Math.exp(b);
    msg = v => (near(v[0], a + k + b) ? `(e<sup>a</sup>)<sup>${k}</sup> = e<sup>${k}a</sup> : multiplie l'exposant par ${k}.` : near(v[0], k * (a + b)) ? `La puissance ${k} ne porte que sur la parenthèse.` : '');
    sol = `(${e(a)})<sup>${k}</sup> = ${e(a * k)}, puis ${e(a * k)} × ${e(b)} = e<sup>${M(a * k)} + ${P(b)}</sup> = <b>${e(n)}</b>.`;
  } else {
    const a = nz(-9, 9);
    tex = R(e(a)); n = a / 2; val = Math.sqrt(Math.exp(a));
    msg = v => (near(v[0], Math.sqrt(Math.abs(a))) ? 'On ne prend pas la racine de l\'exposant : on le divise par 2.' : near(v[0], 2 * a) ? 'C\'est l\'inverse : la racine carrée <b>divise</b> l\'exposant par 2.' : '');
    sol = `(e<sup>${M(n)}</sup>)<sup>2</sup> = e<sup>2 × ${P(n)}</sup> = ${e(a)}, donc ${tex} = <b>${e(n)}</b> (on divise l'exposant par 2).`;
  }
  return {
    type: 'nums', html: `Écris sous la forme <b>e<sup>n</sup></b> :${big(tex)}`, tpl: `${EX('n')} &nbsp; avec &nbsp; n = {0}`,
    check: chk([n], msg), value: Math.log(val),
    hint: { prod: 'e<sup>a</sup> × e<sup>b</sup> = e<sup>a + b</sup>', quot: `${F('e<sup>a</sup>', 'e<sup>b</sup>')} = e<sup>a − b</sup>`, pow: '(e<sup>a</sup>)<sup>n</sup> = e<sup>na</sup>', inv: `${F(1, 'e<sup>a</sup>')} = e<sup>−a</sup>`, mix3: 'Produit : on ajoute les exposants. Quotient : on soustrait', powprod: '(e<sup>a</sup>)<sup>n</sup> = e<sup>na</sup>, puis e<sup>a</sup> × e<sup>b</sup> = e<sup>a + b</sup>', racine: `${R('X')} est le nombre positif dont le carré vaut X, et (e<sup>m</sup>)<sup>2</sup> = e<sup>2m</sup>` }[kind] + ' : les règles sont les mêmes que pour les puissances.',
    solution: sol,
  };
}
function C2() {
  return `<h2>2. Règles de calcul</h2>
<div class="def">Pour tous réels a et b, et tout entier n :<br><b>e<sup>a</sup> × e<sup>b</sup> = e<sup>a + b</sup></b> &nbsp;;&nbsp; <b>${F('e<sup>a</sup>', 'e<sup>b</sup>')} = e<sup>a − b</sup></b> &nbsp;;&nbsp; <b>${F(1, 'e<sup>a</sup>')} = e<sup>−a</sup></b> &nbsp;;&nbsp; <b>(e<sup>a</sup>)<sup>n</sup> = e<sup>na</sup></b>.<br>Ce sont les règles des puissances.</div>
<div class="ex">e<sup>3</sup> × e<sup>−5</sup> = e<sup>3 + (−5)</sup> = <b>e<sup>−2</sup></b> &nbsp;;&nbsp; ${F('e<sup>4</sup>', 'e<sup>−2</sup>')} = e<sup>4 − (−2)</sup> = <b>e<sup>6</sup></b> &nbsp;;&nbsp; (e<sup>−3</sup>)<sup>2</sup> = <b>e<sup>−6</sup></b>.</div>
<div class="warn">⚠️ e<sup>3</sup> × e<sup>5</sup> = e<sup>8</sup>, pas e<sup>15</sup> : on <b>ajoute</b> les exposants.<br>⚠️ Avec un quotient, attention aux exposants négatifs : 4 − (−2) = 6.</div>
${graph({ xr: [-2, 3], yr: [-1, 9], fs: [EXPF], pts: [{ x: 1, y: Math.E, l: 'e¹ = e', px: true, py: true }, { x: 2, y: Math.E ** 2, l: 'e² = e × e', px: true, py: true }] })}`;
}

/* =====================================================================
   3. Simplifier des expressions : e^(ax + b)
   ===================================================================== */
function L3(d) {
  const kind = d < 1 ? 'prod0' : d < 2 ? 'prod' : d < 3 ? 'quot' : d < 4 ? pick(['pow', 'xx']) : pick(['mix', 'inv', 'pow', 'quot', 'mix']);
  const XS = [-1.3, -0.4, 0.2, 0.9, 1.6];
  const ex = (a, b) => x => Math.exp(a * x + b);
  let tex, A, B, f, msg, sol;
  const E1 = (a, b) => EX(lin(a, b));
  if (kind === 'prod0' || kind === 'prod') {
    const a = kind === 'prod0' ? ri(1, 5) : nz(-5, 5), b = kind === 'prod0' ? 0 : ri(-6, 6), c = kind === 'prod0' ? ri(1, 5) : nz(-5, 5), dd = kind === 'prod0' ? ri(1, 6) : nz(-6, 6);
    tex = `${E1(a, b)} × ${E1(c, dd)}`; A = a + c; B = b + dd; f = x => ex(a, b)(x) * ex(c, dd)(x);
    msg = v => (near(v[0], a * c) ? 'Pour un produit, on <b>ajoute</b> les exposants.' : '');
    sol = `On ajoute les exposants : (${lin(a, b)}) + (${lin(c, dd)}) = ${lin(A, B)}.<br>Donc ${tex} = <b>${E1(A, B)}</b> : a = ${M(A)}, b = ${M(B)}.`;
  } else if (kind === 'quot') {
    const a = nz(-5, 5), b = ri(-6, 6), c = nz(-5, 5), dd = nz(-6, 6);
    tex = F(E1(a, b), E1(c, dd)); A = a - c; B = b - dd; f = x => ex(a, b)(x) / ex(c, dd)(x);
    msg = v => (near(v[0], A) && near(v[1], b + dd) ? `Attention : on soustrait <b>tout</b> l'exposant du bas, (${lin(c, dd)}) : le signe de ${M(dd)} change aussi.` : near(v[0], a + c) ? 'Pour un quotient, on <b>soustrait</b> les exposants.' : '');
    sol = `On soustrait : (${lin(a, b)}) − (${lin(c, dd)}) = ${lin(A, B)}.<br>Donc ${tex} = <b>${E1(A, B)}</b>.`;
  } else if (kind === 'pow') {
    const a = nz(-4, 4), b = nz(-5, 5), k = ri(2, 4);
    tex = `(${E1(a, b)})<sup>${k}</sup>`; A = a * k; B = b * k; f = x => ex(a, b)(x) ** k;
    msg = v => (near(v[0], A) && near(v[1], b) ? `La puissance ${k} multiplie <b>tout</b> l'exposant : ${k}(${lin(a, b)}), donc b aussi.` : near(v[0], a + k) ? 'On multiplie l\'exposant par la puissance.' : '');
    sol = `(e<sup>u</sup>)<sup>${k}</sup> = e<sup>${k}u</sup> : ${k}(${lin(a, b)}) = ${lin(A, B)}. Donc <b>${E1(A, B)}</b>.`;
  } else if (kind === 'xx') {
    const k = ri(2, 4), b = nz(-6, 6);
    tex = `${Array(k).fill(EX('x')).join(' × ')} × ${EX(M(b))}`; A = k; B = b; f = x => Math.exp(x) ** k * Math.exp(b);
    msg = v => (near(v[0], 1) && near(v[1], b) ? `e<sup>x</sup> × e<sup>x</sup> = e<sup>x + x</sup> = e<sup>2x</sup> : les x s'ajoutent.` : '');
    sol = `On ajoute les exposants : ${Array(k).fill('x').join(' + ')} ${sgn(b)} = ${lin(A, B)}. Donc <b>${E1(A, B)}</b>.<br>(Et non e<sup>x<sup>${k}</sup></sup> : on additionne les exposants, on ne les multiplie pas.)`;
  } else if (kind === 'inv') {
    const a = nz(-4, 4), b = nz(-5, 5), c = nz(-4, 4);
    tex = `${F(1, E1(a, b))} × ${EX(lin(c, 0))}`; A = c - a; B = -b; f = x => Math.exp(c * x) / ex(a, b)(x);
    msg = v => (near(v[1], b) ? `${F(1, 'e<sup>u</sup>')} = e<sup>−u</sup> : tout l'exposant change de signe.` : '');
    sol = `${F(1, E1(a, b))} = ${E1(-a, -b)}, puis ${E1(-a, -b)} × ${EX(lin(c, 0))} = <b>${E1(A, B)}</b>.`;
  } else {
    const a = nz(-3, 3), b = nz(-4, 4), k = ri(2, 3), c = nz(-4, 4), m = nz(-6, 6);
    tex = F(`(${E1(a, b)})<sup>${k}</sup> × ${EX(lin(c, 0))}`, EX(M(m))); A = a * k + c; B = b * k - m; f = x => ex(a, b)(x) ** k * Math.exp(c * x) / Math.exp(m);
    msg = v => (near(v[1], b * k + m) ? 'L\'exposant du dénominateur se <b>soustrait</b>.' : near(v[1], b - m) || near(v[0], a + c) ? `N'oublie pas la puissance ${k} sur toute la parenthèse.` : '');
    sol = `(${E1(a, b)})<sup>${k}</sup> = ${E1(a * k, b * k)} ; au numérateur : ${E1(a * k + c, b * k)} ; on divise par ${EX(M(m))} : <b>${E1(A, B)}</b>.`;
  }
  return {
    type: 'nums', html: `Écris sous la forme <b>${EX('ax + b')}</b> :${big(tex)}`, tpl: 'a = {0} &nbsp;&nbsp; b = {1}',
    check: chk([A, B], msg),
    verify: Ev => XS.every(x => near(Math.exp(Ev[0] * x + Ev[1]), f(x))),
    hint: 'Mêmes règles qu\'au niveau 2, avec des exposants qui contiennent x : produit → on <b>ajoute</b> les exposants, quotient → on <b>soustrait</b> (tout l\'exposant du bas), puissance → on <b>multiplie</b>.',
    solution: sol,
  };
}
function C3() {
  return `<h2>3. Simplifier des expressions</h2>
<div class="def">Les règles s'appliquent aussi quand l'exposant contient x :<br>e<sup>u</sup> × e<sup>v</sup> = e<sup>u + v</sup> &nbsp;;&nbsp; ${F('e<sup>u</sup>', 'e<sup>v</sup>')} = e<sup>u − v</sup> &nbsp;;&nbsp; (e<sup>u</sup>)<sup>n</sup> = e<sup>nu</sup>.<br>On regroupe tout en <b>une seule exponentielle</b> e<sup>ax + b</sup>.</div>
<div class="ex">e<sup>2x + 1</sup> × e<sup>x − 3</sup> = e<sup>3x − 2</sup>.<br>${F('e<sup>3x + 1</sup>', 'e<sup>x − 2</sup>')} = e<sup>(3x + 1) − (x − 2)</sup> = e<sup>2x + 3</sup>.<br>(e<sup>x + 1</sup>)<sup>2</sup> = e<sup>2x + 2</sup>.</div>
<div class="warn">⚠️ e<sup>x</sup> × e<sup>x</sup> = e<sup>2x</sup> (et pas e<sup>x²</sup>).<br>⚠️ Dans un quotient, on soustrait <b>tout</b> l'exposant du bas : −(x − 2) = −x + 2.</div>
${graph({ xr: [-3, 2], yr: [-1, 8], fs: [EXPF, { f: x => Math.exp(2 * x), c: COL.T, l: 'y = eˣ × eˣ = e²ˣ', dash: true }] })}`;
}

/* =====================================================================
   4. Équations e^u = e^v
   ===================================================================== */
function L4(d) {
  const kind = d < 1 ? 'simple' : d < 2 ? 'cst' : d < 3 ? 'un' : d < 4 ? 'deux' : pick(['deux', 'deux', 'prop', 'carre']);
  if (kind === 'carre') {
    let r1, r2; do { r1 = ri(-5, 4); r2 = ri(r1 + 1, 5); } while (r1 + r2 === 0 && r1 * r2 === 0);
    const a = r1 + r2, b = -r1 * r2, lhs = EX('x<sup>2</sup>'), rhs = EX(lin(a, b));
    const W = { xr: span([r1 - 1.5, r2 + 1.5], 0, 8), yr: span([r1 * r1, r2 * r2], 1, 8) };
    return {
      type: 'roots', html: `Résous dans ℝ :${big(`${lhs} = ${rhs}`)}`,
      check: rootsChk([r1, r2], { extra: v => (valsOf(v).length === 1 ? 'Une équation du second degré peut avoir deux solutions : cherche la deuxième.' : '') }),
      truth: x => { const p = Math.exp(x * x), q = Math.exp(a * x + b); return isFinite(p) && isFinite(q) && Math.abs(p - q) <= 1e-9 * Math.max(p, q); },
      visual: '', afterVisual: graph({ ...W, fs: [{ f: x => x * x, l: 'y = x²' }], lines: [{ x: 0, y: b, m: a, c: COL.T, l: `y = ${lin(a, b)}` }], pts: [{ x: r1, y: r1 * r1, px: true }, { x: r2, y: r2 * r2, px: true }] }),
      hint: 'e<sup>u</sup> = e<sup>v</sup> ⟺ <b>u = v</b> : égalise les exposants. Tu obtiens une équation du second degré : passe tout du même côté (discriminant ou factorisation).',
      solution: `${lhs} = ${rhs} ⟺ x<sup>2</sup> = ${lin(a, b)} ⟺ ${terms([[1, 'x<sup>2</sup>'], [-a, 'x'], [-b, '']])} = 0 ⟺ (${r1 === 0 ? 'x' : `x ${sgn(-r1)}`})(${r2 === 0 ? 'x' : `x ${sgn(-r2)}`}) = 0.<br>Solutions : <b>x = ${M(r1)}</b> et <b>x = ${M(r2)}</b>.`,
    };
  }
  let a, b, c, dd, x0, lhs, rhs, sol, msg = () => '', note = '';
  if (kind === 'simple') {
    x0 = ri(-6, 6); b = nz(-6, 6); a = 1; c = 0; dd = x0 + b;
    lhs = EX(lin(1, b)); rhs = EX(M(dd));
    sol = `e<sup>u</sup> = e<sup>v</sup> ⟺ u = v : ${lin(1, b)} = ${M(dd)}, donc <b>x = ${M(x0)}</b>.`;
    msg = v => (near(v[0], dd + b) ? `On <b>retranche</b> ${M(b)} des deux côtés : x = ${M(dd)} − ${P(b)}.` : '');
  } else if (kind === 'cst') {
    a = pick([2, 3, 4, 5, -1, -2, -3]); x0 = ri(-5, 5); b = ri(-8, 8); c = 0; dd = a * x0 + b;
    lhs = EX(lin(a, b)); rhs = EX(M(dd));
    sol = `${lin(a, b)} = ${M(dd)} ⟺ ${lin(a, 0)} = ${M(dd - b)} ⟺ <b>x = ${M(x0)}</b>.`;
    msg = v => (a !== 1 && near(v[0], dd - b) ? `Il reste à diviser par ${M(a)}.` : near(v[0], (dd + b) / a) ? `On retranche ${M(b)} (on ne l'ajoute pas).` : '');
  } else if (kind === 'un') {
    const sub = pick(['1', 'e', 'inv', 'inve']);
    const cc = sub === '1' ? 0 : sub === 'e' ? 1 : sub === 'inve' ? -1 : -ri(2, 5);
    a = pick([1, 2, -1, -2, 3]); x0 = ri(-4, 4); b = cc - a * x0; c = 0; dd = cc;
    lhs = EX(lin(a, b)); rhs = sub === '1' ? '1' : sub === 'e' ? 'e' : sub === 'inve' ? F(1, 'e') : F(1, EX(-cc));
    note = `On écrit ${rhs} = ${EX(M(cc))}. `;
    sol = `${rhs} = ${EX(M(cc))}${sub === 'inv' || sub === 'inve' ? ' (car 1/e<sup>a</sup> = e<sup>−a</sup>)' : ''}.<br>Donc ${lin(a, b)} = ${M(cc)}, et <b>x = ${M(x0)}</b>.`;
    msg = v => (sub === '1' && near(a * v[0] + b, 1) ? '1 = e<sup>0</sup> : l\'exposant doit valoir 0, pas 1.' : sub === 'e' && near(a * v[0] + b, 0) ? 'e = e<sup>1</sup> : l\'exposant doit valoir 1.' : (sub === 'inv' || sub === 'inve') && near(a * v[0] + b, -cc) ? `${rhs} = ${EX(M(cc))} : l'exposant est négatif.` : '');
  } else if (kind === 'deux') {
    do { a = nz(-5, 5); c = nz(-5, 5); } while (a === c);
    const k = a - c;
    x0 = d >= 4 && Math.abs(k) % 2 === 0 && chance(0.5) ? ri(-7, 7) / 2 : ri(-5, 5);
    b = ri(-8, 8); dd = b + k * x0;
    lhs = EX(lin(a, b)); rhs = EX(lin(c, dd));
    sol = `${lin(a, b)} = ${lin(c, dd)} ⟺ ${lin(k, 0)} = ${M(dd - b)} ⟺ <b>x = ${M(x0)}</b>.`;
    msg = v => (near(v[0], -x0) && x0 !== 0 ? 'Attention aux signes en passant les termes de l\'autre côté.' : '');
  } else {
    a = nz(-4, 4); const p = nz(-6, 6), sub = pick(['prod', 'quot']); x0 = ri(-5, 5); c = 0;
    b = sub === 'prod' ? p : -p; dd = a * x0 + b;
    lhs = sub === 'prod' ? `${EX(lin(a, 0))} × ${EX(M(p))}` : F(EX(lin(a, 0)), EX(M(p))); rhs = EX(M(dd));
    sol = `${lhs} = ${EX(lin(a, b))} (règle du niveau 2).<br>${lin(a, b)} = ${M(dd)} ⟺ <b>x = ${M(x0)}</b>.`;
    msg = v => (near(a * v[0] + (sub === 'prod' ? -p : p), dd) ? (sub === 'prod' ? 'Pour un produit, on ajoute les exposants.' : 'Pour un quotient, on soustrait les exposants.') : '');
  }
  const L = x => a * x + b, Rr = x => c * x + dd;
  const W = { xr: span([x0 - 3, x0 + 3], 0, 8), yr: span([L(x0) - 4, L(x0) + 4], 0, 8) };
  return {
    type: 'nums', html: `Résous dans ℝ :${big(`${lhs} = ${rhs}`)}`, tpl: 'x = {0}',
    check: chk([x0], msg),
    verify: Ev => near(Math.exp(L(Ev[0])) * Math.exp(-Rr(Ev[0])), 1, 1e-9) && !near(Math.exp(L(Ev[0] + 0.5)) * Math.exp(-Rr(Ev[0] + 0.5)), 1, 1e-9),
    visual: '', afterVisual: graph({ ...W, lines: [{ x: 0, y: b, m: a, c: COL.f, l: `exposant gauche : ${lin(a, b)}` }, { x: 0, y: dd, m: c, c: COL.T, l: `exposant droite : ${c ? lin(c, dd) : M(dd)}` }], pts: [{ x: x0, y: L(x0), px: true, l: `x = ${M(x0)}` }] }),
    hint: `${note}La fonction exponentielle est strictement croissante, donc <b>e<sup>u</sup> = e<sup>v</sup> ⟺ u = v</b> : écris l'égalité des exposants et résous.`,
    solution: sol,
  };
}
function C4() {
  return `<h2>4. Équations e<sup>u</sup> = e<sup>v</sup></h2>
<div class="def">La fonction exponentielle est strictement croissante : deux nombres différents ont des exponentielles différentes. Donc<br><b>e<sup>u</sup> = e<sup>v</sup> ⟺ u = v</b>.<br>On commence par écrire chaque membre sous la forme e<sup>…</sup> : 1 = e<sup>0</sup>, e = e<sup>1</sup>, ${F(1, 'e<sup>a</sup>')} = e<sup>−a</sup>.</div>
<div class="ex">e<sup>3x − 1</sup> = e<sup>x + 5</sup> ⟺ 3x − 1 = x + 5 ⟺ 2x = 6 ⟺ <b>x = 3</b>.<br>e<sup>2x + 4</sup> = 1 ⟺ e<sup>2x + 4</sup> = e<sup>0</sup> ⟺ 2x + 4 = 0 ⟺ <b>x = −2</b>.</div>
<div class="warn">⚠️ 1 = e<sup>0</sup> : l'exposant vaut 0 (pas 1).<br>⚠️ e = e<sup>1</sup>.</div>
${graph({ xr: [-3, 3], yr: [-1, 8], fs: [EXPF], lines: [{ x: 0, y: Math.E, m: 0, c: COL.T, l: 'y = e' }], pts: [{ x: 1, y: Math.E, l: 'un seul point : x = 1', px: true, anchor: 'end', ly: -14 }] })}`;
}

/* =====================================================================
   5. Inéquations e^u < e^v
   ===================================================================== */
function L5(d) {
  const kind = d < 1 ? 'k' : d < 2 ? 'pos' : d < 3 ? 'neg' : d < 4 ? 'deux' : pick(['deux', 'neg', 'piege', d >= 5 ? 'carre' : 'pos']);
  const rel = pick(['<', '≤', '>', '≥']);
  let html, S, truth, sol, flipMsg = '', visual = '';
  if (kind === 'piege') {
    const a = nz(-4, 4), b = ri(-5, 5), k = ri(0, 6), lhs = EX(lin(a, b)), rhsV = -k;
    S = rel === '>' || rel === '≥' ? REALS() : [];
    truth = x => CMP[rel](Math.exp(a * x + b), rhsV);
    html = `Résous dans ℝ :${big(`${lhs} ${REL[rel]} ${M(rhsV)}`)}`;
    sol = `Une exponentielle est toujours <b>strictement positive</b> : ${lhs} &gt; 0 ≥ ${M(rhsV)} pour tout x.<br>${S.length ? 'L\'inéquation est vraie pour tout x : <b>S = ℝ</b>.' : 'L\'inéquation n\'est jamais vraie : <b>S = ∅</b>.'}`;
  } else if (kind === 'carre') {
    let r1, r2; do { r1 = ri(-5, 4); r2 = ri(r1 + 1, 5); } while (r1 + r2 === 0 && r1 * r2 === 0);
    const a = r1 + r2, b = -r1 * r2, cl = rel === '≤' || rel === '≥';
    S = rel === '<' || rel === '≤' ? [I(r1, cl, r2, cl)] : [I(-INF, 0, r1, cl), I(r2, cl, INF, 0)];
    truth = x => CMP[rel](Math.exp(x * x), Math.exp(a * x + b));
    html = `Résous dans ℝ :${big(`${EX('x<sup>2</sup>')} ${REL[rel]} ${EX(lin(a, b))}`)}`;
    sol = `exp est croissante : on compare les exposants. x<sup>2</sup> ${REL[rel]} ${lin(a, b)} ⟺ ${terms([[1, 'x<sup>2</sup>'], [-a, 'x'], [-b, '']])} ${REL[rel]} 0.<br>Racines ${M(r1)} et ${M(r2)} ; le trinôme est négatif entre les racines.<br><b>S = ${fmtSet(S)}</b>.`;
  } else {
    let a, b, c = 0, dd, x0;
    if (kind === 'k') { a = 1; b = 0; x0 = ri(-3, 2); dd = x0; }
    else if (kind === 'pos') { a = ri(2, 5); b = ri(-8, 8); x0 = ri(-5, 5); dd = a * x0 + b; }
    else if (kind === 'neg') { a = -ri(1, 5); b = ri(-8, 8); x0 = ri(-5, 5); dd = a * x0 + b; }
    else { do { a = nz(-5, 5); c = nz(-5, 5); } while (a === c); x0 = Math.abs(a - c) % 2 === 0 && chance(0.4) ? ri(-7, 7) / 2 : ri(-5, 5); b = ri(-8, 8); dd = b + (a - c) * x0; }
    const k = a - c, relF = k > 0 ? rel : FLIP[rel];
    S = setOf(relF, x0);
    truth = x => CMP[rel](Math.exp(a * x + b), Math.exp(c * x + dd));
    const lhs = EX(lin(a, b)), rhs = EX(c ? lin(c, dd) : M(dd));
    html = `Résous dans ℝ et donne l'ensemble des solutions :${big(`${lhs} ${REL[rel]} ${rhs}`)}`;
    const step = k === 1 && b === 0 && c === 0 ? '' : ` ⟺ ${lin(k, 0)} ${REL[rel]} ${M(dd - b)}${k === 1 ? '' : ` ⟺ ${relTxt(relF, x0)}${k < 0 ? ` (on divise par ${M(k)} &lt; 0 : <b>le sens change</b>)` : ''}`}`;
    sol = `exp est strictement croissante : e<sup>u</sup> ${REL[rel]} e<sup>v</sup> ⟺ u ${REL[rel]} v.<br>${lin(a, b)} ${REL[rel]} ${c ? lin(c, dd) : M(dd)}${step}.<br><b>S = ${fmtSet(S)}</b>.`;
    if (k < 0) flipMsg = `Attention : à la fin, tu divises par ${M(k)}, un nombre <b>négatif</b> : le sens de l'inégalité change.`;
    else flipMsg = 'Attention au sens : l\'exponentielle est <b>croissante</b>, elle ne change pas le sens de l\'inégalité.';
    if (kind === 'k') {
      const W = { xr: [-4, 4], yr: [-1, 8] };
      visual = graph({ ...W, fs: [EXPF], lines: [{ x: 0, y: Math.exp(x0), m: 0, c: COL.T, l: `y = ${x0 === 0 ? '1' : x0 === 1 ? 'e' : 'e' + supU(x0)}` }] });
    }
  }
  return {
    type: 'iv', html, truth, check: ivChk(S, flipMsg), visual,
    afterVisual: realLine(S),
    hint: kind === 'piege' ? 'Une exponentielle est toujours <b>strictement positive</b>. Compare avec le nombre de droite.' : 'exp est <b>strictement croissante</b> : e<sup>u</sup> &lt; e<sup>v</sup> ⟺ u &lt; v (même sens). Résous ensuite l\'inéquation sur les exposants ; si tu divises par un négatif, le sens change.',
    solution: sol,
  };
}
function C5() {
  return `<h2>5. Inéquations e<sup>u</sup> &lt; e<sup>v</sup></h2>
<div class="def">exp est strictement croissante, elle <b>conserve l'ordre</b> :<br><b>e<sup>u</sup> &lt; e<sup>v</sup> ⟺ u &lt; v</b> (de même avec ≤, &gt;, ≥).<br>On résout ensuite une inéquation du 1<sup>er</sup> degré sur les exposants.</div>
<div class="ex">e<sup>−2x + 1</sup> ≤ e<sup>7</sup> ⟺ −2x + 1 ≤ 7 ⟺ −2x ≤ 6 ⟺ x ≥ −3 (on divise par −2 : le sens change).<br><b>S = [−3 ; +∞[</b>.</div>
<div class="warn">⚠️ Diviser par un nombre <b>négatif</b> change le sens de l'inégalité.<br>⚠️ e<sup>x</sup> &gt; −2 est vraie pour tout x (S = ℝ) ; e<sup>x</sup> &lt; 0 n'a aucune solution (S = ∅).</div>
${graph({ xr: [-4, 3], yr: [-1, 8], band: [-4, 1], fs: [EXPF], lines: [{ x: 0, y: Math.E, m: 0, c: COL.T, l: 'y = e' }], pts: [{ x: 1, y: Math.E, l: 'eˣ < e ⟺ x < 1', px: true, anchor: 'end', ly: -14 }] })}`;
}

/* =====================================================================
   6. Croissance et décroissance exponentielles
   ===================================================================== */
function L6(d) {
  const kind = d < 1 ? 'double' : d < 2 ? 'hausse' : d < 3 ? 'baisse' : d < 4 ? 'cont' : pick(['demi', 'coef', 'cont', 'hausse', 'baisse']);
  let html, E, value, sol, tpl, visual = '', after = '', msg = () => '', exact, k0 = 0, keys = { neg: false };
  const iter = (u0, q, n) => { const t = [u0]; for (let i = 0; i < n; i++) t.push(t[i] * q); return t; };
  if (kind === 'double') {
    const u0 = pick([50, 100, 150, 200, 250, 300, 500, 1000]), q = pick([2, 2, 3]), n = ri(3, 6), vals = iter(u0, q, n);
    E = u0 * q ** n; value = vals[n]; exact = E;
    html = `Une colonie compte <b>${u0}</b> bactéries. Son effectif est <b>multiplié par ${q}</b> chaque heure.<br>Combien de bactéries y a-t-il au bout de <b>${n} heures</b> ?`;
    tpl = '{0} bactéries';
    msg = v => (near(v[0], u0 * q * n) ? `Ce n'est pas ${u0} × ${q} × ${n} : on multiplie par ${q} <b>chaque</b> heure, donc par ${q}<sup>${n}</sup>.` : near(v[0], u0 * q ** (n - 1)) || near(v[0], u0 * q ** (n + 1)) ? 'Compte bien : après 1 heure on a multiplié une fois par ' + q + '.' : '');
    sol = `C'est une suite géométrique : u<sub>0</sub> = ${u0}, raison ${q}. u<sub>${n}</sub> = ${u0} × ${q}<sup>${n}</sup> = ${u0} × ${q ** n} = <b>${E}</b>.`;
    visual = barres(vals.slice(0, n).concat([0]), { xl: 'heures' });
    after = barres(vals, { hl: n, hlL: M(E), xl: 'heures' });
  } else if (kind === 'hausse' || kind === 'baisse') {
    const up = kind === 'hausse', t = up ? pick([2, 3, 4, 5, 6, 8, 10, 12, 15, 20]) : pick([5, 10, 12, 15, 20, 25]);
    const u0 = up ? pick([500, 800, 1000, 1200, 1500, 2000, 2500, 5000, 8000, 12000]) : 500 * ri(16, 60), n = up ? ri(3, 10) : ri(2, 8), q = up ? 1 + t / 100 : 1 - t / 100;
    exact = u0 * q ** n; E = rnd(exact, 0); const vals = iter(u0, q, n); value = rnd(vals[n], 0);
    html = up ? `Une ville compte <b>${u0} habitants</b>. Sa population augmente de <b>${t}&nbsp;%</b> par an.<br>Combien d'habitants aura-t-elle dans <b>${n} ans</b> ? (arrondi à l'unité)` : `Une voiture neuve coûte <b>${u0} €</b>. Sa valeur baisse de <b>${t}&nbsp;%</b> chaque année.<br>Que vaudra-t-elle dans <b>${n} ans</b> ? (arrondi à l'euro)`;
    tpl = up ? '{0} habitants' : '{0} €';
    msg = v => (near(v[0], rnd(u0 * (1 + (up ? 1 : -1) * n * t / 100), 0)) ? `Les ${t}&nbsp;% ne s'ajoutent pas : chaque année, on <b>multiplie</b> par ${M(q)} (évolution exponentielle, pas linéaire).` : near(v[0], rnd(u0 * (1 + (up ? -1 : 1) * t / 100) ** n, 0)) ? `${up ? 'Une hausse' : 'Une baisse'} de ${t}&nbsp;% correspond à un coefficient ${M(q)}.` : '');
    sol = `${up ? 'Augmenter' : 'Baisser'} de ${t}&nbsp;%, c'est multiplier par ${M(q)}. On a une suite géométrique de raison ${M(q)} :<br>u<sub>${n}</sub> = ${u0} × ${M(q)}<sup>${n}</sup> ≈ ${M(rnd(exact, 2))}, soit <b>${M(E)}</b>.`;
    visual = barres(vals.slice(0, n).concat([0]), { xl: 'années' });
    after = barres(vals, { hl: n, hlL: M(E), xl: 'années' });
  } else if (kind === 'cont') {
    const N0 = pick([100, 200, 500, 1000, 2000]), k = pick([0.1, 0.2, 0.3, 0.05, -0.1, -0.2, -0.05, -0.3]), t = ri(2, 10);
    exact = N0 * Math.exp(k * t); E = rnd(exact, 0); value = rnd(rk4(k, N0, t), 0);
    html = `Le nombre de ${k > 0 ? 'bactéries d\'une culture' : 'noyaux radioactifs d\'un échantillon (en milliards)'} est modélisé par<br><b>N(t) = ${N0}${EX(`${M(k)}t`)}</b>, où t est le temps en heures.<br>Calcule N(${t}), arrondi à l'unité.`;
    tpl = `N(${t}) ≈ {0}`;
    msg = v => (near(v[0], rnd(N0 * k * t, 0)) || near(v[0], rnd(N0 * Math.exp(k) * t, 0)) ? `Remplace t par ${t} <b>dans l'exposant</b> : e<sup>${M(k)} × ${t}</sup> = e<sup>${M(k * t)}</sup>.` : '');
    sol = `N(${t}) = ${N0} × e<sup>${M(k)} × ${t}</sup> = ${N0} × ${EX(M(r6(k * t)))} ≈ ${N0} × ${M(rnd(Math.exp(k * t), 4))} ≈ <b>${M(E)}</b>.<br>${k > 0 ? 'k &gt; 0 : croissance exponentielle.' : 'k &lt; 0 : décroissance exponentielle.'}`;
    const ymax = Math.max(N0, exact) * 1.25, f = x => N0 * Math.exp(k * x);
    const W = { xr: [-1, Math.max(t + 2, 8)], yr: [-ymax / 12, ymax] };
    visual = graph({ ...W, xn: 't', fs: [{ f, dom: [0, W.xr[1]], l: 'y = N(t)' }] });
    after = graph({ ...W, xn: 't', fs: [{ f, dom: [0, W.xr[1]], l: 'y = N(t)' }], pts: [{ x: t, y: exact, px: true, py: true, l: `N(${t}) ≈ ${M(E)}` }] });
  } else if (kind === 'demi') {
    const T = pick([2, 3, 4, 5, 6, 8]), m = ri(2, 5), c = ri(1, 15), Q0 = c * 2 ** m, t = m * T;
    E = c; exact = c; value = rnd(Q0 * Math.exp(-Math.LN2 * t / T), 3);
    html = `Un médicament a une <b>demi-vie de ${T} heures</b> : la quantité présente dans le sang est divisée par 2 toutes les ${T} heures.<br>On en injecte <b>${Q0} mg</b>. Quelle quantité reste-t-il au bout de <b>${t} heures</b> ?`;
    tpl = '{0} mg';
    msg = v => (near(v[0], Q0 / 2 ** t) || near(v[0], Q0 / (2 * t)) ? `${t} heures = ${m} demi-vies de ${T} h : on divise ${m} fois par 2.` : near(v[0], Q0 - Q0 / 2 * m) ? 'On ne retire pas la même quantité à chaque fois : on <b>divise par 2</b>.' : '');
    sol = `${t} h = ${m} × ${T} h : on divise ${m} fois par 2, c'est-à-dire par 2<sup>${m}</sup> = ${2 ** m}.<br>${Q0} ÷ ${2 ** m} = <b>${c} mg</b>.`;
    const vals = iter(Q0, 0.5, m);
    visual = barres(vals.slice(0, m).concat([0]), { xl: `demi-vies (× ${T} h)` });
    after = barres(vals, { hl: m, hlL: `${c} mg`, xl: `demi-vies (× ${T} h)` });
  } else {
    const up = chance(0.6), t = up ? pick([2, 3, 4, 5, 8, 10]) : pick([5, 10, 15, 20]), n = ri(2, 10), q = up ? 1 + t / 100 : 1 - t / 100;
    const vals = iter(1, q, n); exact = q ** n; E = rnd(exact, 3); value = rnd(vals[n], 3); k0 = 3;
    html = `Une grandeur ${up ? 'augmente' : 'diminue'} de <b>${t}&nbsp;%</b> par an pendant <b>${n} ans</b>.<br>Quel est le <b>coefficient multiplicateur global</b> sur les ${n} ans ? (arrondi au millième)`;
    tpl = 'coefficient ≈ {0}';
    msg = v => (near(v[0], rnd(1 + (up ? 1 : -1) * n * t / 100, 3)) ? `Les pourcentages ne s'additionnent pas : le coefficient global est ${M(q)}<sup>${n}</sup>.` : '');
    sol = `Chaque année, on multiplie par ${M(q)}. Sur ${n} ans : ${M(q)}<sup>${n}</sup> ≈ <b>${Mk(E, 3)}</b>, soit une ${E > 1 ? 'hausse' : 'baisse'} globale d'environ ${M(rnd(Math.abs(exact - 1) * 100, 1))}&nbsp;%.`;
    visual = barres(vals.slice(0, n).concat([0]), { xl: 'années' });
    after = barres(vals, { hl: n, hlL: M(E), xl: 'années' });
  }
  return {
    type: 'nums', html, tpl, keys,
    check: k0 ? chkA([E], exact, msg, 3) : kind === 'double' || kind === 'demi' ? chk([E], msg) : chkA([E], exact, msg, 0),
    value, visual, afterVisual: after, replaceVisual: true,
    hint: kind === 'cont' ? 'Remplace t par sa valeur dans l\'exposant, calcule e<sup>…</sup> à la calculatrice, puis multiplie.' : kind === 'demi' ? 'Combien de demi-vies dans cette durée ? À chaque demi-vie, on divise par 2.' : 'Une évolution de t % chaque année revient à multiplier par le même coefficient (1 + t/100 ou 1 − t/100) : u<sub>n</sub> = u<sub>0</sub> × q<sup>n</sup>.',
    solution: sol,
  };
}
function C6() {
  const vals = [1000]; for (let i = 0; i < 10; i++) vals.push(vals[i] * 1.1);
  return `<h2>6. Croissance et décroissance exponentielles</h2>
<div class="def">Une quantité qui est <b>multipliée par le même nombre q</b> à chaque étape suit une <b>suite géométrique</b> : u<sub>n</sub> = u<sub>0</sub> × q<sup>n</sup>.<br>• hausse de t % : q = 1 + t/100 ; baisse de t % : q = 1 − t/100 ;<br>• en temps continu : N(t) = N<sub>0</sub> e<sup>kt</sup> (croissance si k &gt; 0, décroissance si k &lt; 0) ;<br>• <b>demi-vie</b> : durée au bout de laquelle la quantité est divisée par 2.</div>
<div class="ex">1 000 € placés à 10&nbsp;% par an : après 10 ans, 1 000 × 1,1<sup>10</sup> ≈ <b>2 594 €</b> (et pas 2 000 €).</div>
<div class="warn">⚠️ Les pourcentages ne s'additionnent pas : +10&nbsp;% pendant 10 ans, ce n'est pas +100&nbsp;%.<br>⚠️ u<sub>n</sub> = u<sub>0</sub> × q<sup>n</sup> : après n étapes, on a multiplié n fois.</div>
${barres(vals, { hl: 10, hlL: '≈ 2 594', xl: 'années' })}`;
}

/* =====================================================================
   7. ln, fonction réciproque de exp
   ===================================================================== */
const LN_ITEMS = {
  ln1: () => ({ t: 'ln 1', v: 0, f: () => Math.log(1), s: 'ln 1 = 0 (car e<sup>0</sup> = 1)' }),
  lne: () => ({ t: 'ln e', v: 1, f: () => Math.log(Math.E), s: 'ln e = 1 (car e<sup>1</sup> = e)' }),
  lneb: () => { const b = nz(-9, 9); return { t: `ln(${EX(M(b))})`, v: b, f: () => Math.log(Math.exp(b)), s: `ln(${EX(M(b))}) = ${M(b)}` }; },
  elna: () => { const a = ri(2, 20); return { t: EX(`ln ${a}`), v: a, f: () => Math.exp(Math.log(a)), s: `${EX(`ln ${a}`)} = ${a}` }; },
  elnd: () => { const a = pick([0.5, 0.2, 1.5, 2.5, 0.1, 0.25]); return { t: EX(`ln ${M(a)}`), v: a, f: () => Math.exp(Math.log(a)), s: `${EX(`ln ${M(a)}`)} = ${M(a)}` }; },
  inve: () => { const b = ri(1, 9); return { t: `ln(${F(1, b === 1 ? 'e' : EX(b))})`, v: -b, f: () => Math.log(1 / Math.exp(b)), s: `${F(1, b === 1 ? 'e' : EX(b))} = ${EX(M(-b))}, donc ln(${F(1, b === 1 ? 'e' : EX(b))}) = ${M(-b)}` }; },
  sqrte: () => ({ t: `ln(${R('e')})`, v: 0.5, f: () => Math.log(Math.sqrt(Math.E)), s: `${R('e')} = ${EX('0,5')}, donc ln(${R('e')}) = 0,5` }),
  lnek: () => { const a = nz(-6, 6), b = nz(-6, 6); return { t: `ln(${EX(M(a))} × ${EX(M(b))})`, v: a + b, f: () => Math.log(Math.exp(a) * Math.exp(b)), s: `${EX(M(a))} × ${EX(M(b))} = ${EX(M(a + b))}, donc ln(…) = ${M(a + b)}` }; },
  emln: () => { const a = pick([2, 4, 5, 8, 10, 20]); return { t: EX(`−ln ${a}`), v: 1 / a, f: () => Math.exp(-Math.log(a)), s: `${EX(`−ln ${a}`)} = ${F(1, EX(`ln ${a}`))} = ${F(1, a)} = ${M(1 / a)}` }; },
  e2ln: () => { const a = ri(2, 9), k = pick([2, 2, 3]); return { t: EX(`${k} ln ${a}`), v: a ** k, f: () => Math.exp(k * Math.log(a)), s: `${EX(`${k} ln ${a}`)} = (${EX(`ln ${a}`)})<sup>${k}</sup> = ${a}<sup>${k}</sup> = ${a ** k}` }; },
};
function L7(d) {
  const pools = [['ln1', 'lne', 'lneb', 'elna', 'lneb', 'elna'], ['ln1', 'lne', 'lneb', 'elna'], ['inve', 'sqrte', 'lnek', 'elnd'], ['emln', 'e2ln', 'inve', 'lnek'], ['lneb', 'elna', 'inve', 'sqrte', 'lnek', 'emln', 'e2ln', 'elnd']];
  const combo = d >= 1 && d < 2 ? true : d >= 4 ? chance(0.7) : false;
  const pool = pools[d < 1 ? 0 : d < 2 ? 1 : d < 3 ? 2 : d < 4 ? 3 : 4];
  let tex, E, val, sol, it1;
  if (!combo) {
    const k = pick(pool); it1 = LN_ITEMS[k]();
    tex = it1.t; E = r6(it1.v); val = it1.f(); sol = `${it1.s}. Donc ${tex} = <b>${M(E)}</b>.`;
  } else {
    let a, b; do { a = pick(pool); b = pick(pool); } while (a === b && (a === 'ln1' || a === 'lne' || a === 'sqrte'));
    const A = LN_ITEMS[a](), B = LN_ITEMS[b](), k1 = pick([1, 2, 3, -1, -2]), k2 = pick([1, -1, 2, -3]);
    it1 = A;
    tex = `${fois(k1)}${A.t} ${k2 < 0 ? '−' : '+'} ${fois(Math.abs(k2))}${B.t}`;
    E = r6(k1 * A.v + k2 * B.v); val = k1 * A.f() + k2 * B.f();
    sol = `${A.s} ; ${B.s}.<br>Donc ${tex} = ${k1 === 1 ? '' : `${M(k1)} × `}${P(A.v)} ${k2 < 0 ? '−' : '+'} ${Math.abs(k2) === 1 ? '' : `${Math.abs(k2)} × `}${P(B.v)} = <b>${M(E)}</b>.`;
  }
  const pts = d < 1 ? (tex === 'ln 1' ? [{ x: 1, y: 0, l: '(1 ; 0)', c: COL.G, ly: 22 }] : tex === 'ln e' ? [{ x: Math.E, y: 1, l: '(e ; 1)', c: COL.G, ly: 22 }] : []) : [];
  return {
    type: 'nums', html: `Calcule sans calculatrice :${big(tex)}`, tpl: '= {0}',
    check: chk([E], v => (near(v[0], 1) && E === 0 ? 'ln 1 = 0 : c\'est e<sup>0</sup> qui vaut 1.' : near(v[0], 0) && E === 1 ? 'ln e = 1, car e = e<sup>1</sup>.' : near(v[0], -E) && E !== 0 ? 'Vérifie les signes.' : '')),
    value: r6(val),
    visual: '', afterVisual: recip([{ x: 1, y: 0, c: COL.G }, { x: 0, y: 1, c: COL.S }, ...pts]),
    hint: 'ln est la fonction <b>réciproque</b> de exp : <b>ln(e<sup>b</sup>) = b</b> et <b>e<sup>ln a</sup> = a</b> (a &gt; 0). En particulier ln 1 = 0 et ln e = 1.',
    solution: sol,
  };
}
function C7() {
  return `<h2>7. Le logarithme népérien</h2>
<div class="def">Pour tout a &gt; 0, l'équation e<sup>x</sup> = a a une unique solution, notée <b>ln a</b>.<br>La fonction <b>ln</b> est définie sur ]0 ; +∞[ ; c'est la <b>réciproque</b> de exp :<br><b>e<sup>ln a</sup> = a</b> (a &gt; 0) &nbsp;et&nbsp; <b>ln(e<sup>b</sup>) = b</b> (b réel).<br>Valeurs à connaître : <b>ln 1 = 0</b>, <b>ln e = 1</b>.</div>
<div class="ex">ln(e<sup>−4</sup>) = −4 &nbsp;;&nbsp; e<sup>ln 7</sup> = 7 &nbsp;;&nbsp; 2 ln e − e<sup>ln 3</sup> = 2 − 3 = <b>−1</b>.</div>
<div class="warn">⚠️ ln 1 = 0 et ln e = 1 (pas l'inverse).<br>⚠️ ln a n'existe que pour a &gt; 0 : ln 0 et ln(−2) n'existent pas.</div>
<p>Les courbes de exp et de ln sont <b>symétriques</b> par rapport à la droite y = x.</p>
${recip([{ x: 1, y: 0, l: '(1 ; 0)', c: COL.G, ly: 22 }, { x: Math.E, y: 1, l: '(e ; 1)', c: COL.G, ly: 22 }, { x: 0, y: 1, l: '(0 ; 1)', anchor: 'end' }, { x: 1, y: Math.E, l: '(1 ; e)', anchor: 'end' }])}`;
}

/* =====================================================================
   8. Propriétés de ln : ln(ab), ln(a/b), ln(aⁿ)
   ===================================================================== */
const fac23 = (p, q) => 2 ** p * 3 ** q;
const NUMS = [[1, 0], [0, 1], [2, 0], [1, 1], [3, 0], [0, 2], [2, 1], [1, 2], [4, 0], [3, 1], [0, 3], [2, 2]]; // 2, 3, 4, 6, 8, 9, 12, 18, 16, 24, 27, 36
function L8(d) {
  const kind = d < 1 ? 'prod' : d < 2 ? 'frac' : d < 3 ? 'expr' : d < 4 ? 'rac' : pick(['expr', 'rac', 'single', 'single', 'frac']);
  const L2T = ' ln 2', L3T = ' ln 3'; // espace fine : « 2 ln 2 » (terms colle le coefficient)
  if (kind === 'single') {
    let a, b, c, r, tex, f; const sub = pick(['abc', 'kln']);
    if (sub === 'abc') {
      do { a = ri(2, 12); b = ri(2, 12); c = ri(2, 12); r = r6(a * b / c); } while (String(r).split('.')[1]?.length > 2 || r === 1);
      tex = `ln ${a} + ln ${b} − ln ${c}`; f = Math.log(a) + Math.log(b) - Math.log(c);
    } else {
      const k = ri(2, 3); a = ri(2, 5); c = pick([2, 3, 4, 5, 8, 10]); r = r6(a ** k / c);
      if (String(r).split('.')[1]?.length > 3) c = a;
      r = r6(a ** k / c);
      tex = `${k} ln ${a} − ln ${c}`; f = k * Math.log(a) - Math.log(c); b = k;
    }
    return {
      type: 'nums', keys: { neg: false }, html: `Écris sous la forme <b>ln A</b> :${big(tex)}`, tpl: '= ln {0}',
      check: chk([r], v => (sub === 'abc' && near(v[0], a + b - c) ? 'ln a + ln b = ln(a × b) : on <b>multiplie</b> (on n\'ajoute pas les nombres).' : sub === 'kln' && near(v[0], b * a / c) ? `${b} ln ${a} = ln(${a}<sup>${b}</sup>) : c'est une puissance, pas un produit par ${b}.` : '')),
      verify: Ev => Ev[0] > 0 && near(Math.log(Ev[0]), f),
      hint: '<b>ln a + ln b = ln(ab)</b>, <b>ln a − ln b = ln(a/b)</b>, <b>n ln a = ln(a<sup>n</sup>)</b>.',
      solution: sub === 'abc' ? `${tex} = ln(${F(`${a} × ${b}`, c)}) = <b>ln ${M(r)}</b>.` : `${tex} = ln(${a}<sup>${b}</sup>) − ln ${c} = ln(${F(a ** b, c)}) = <b>ln ${M(r)}</b>.`,
      afterVisual: graph({ xr: [-1, Math.max(8, Math.ceil(r) + 1)], yr: [-3, Math.max(3, Math.ceil(Math.log(r) + 0.6))], fs: [lnF(Math.max(8, Math.ceil(r) + 1))], pts: [{ x: r, y: Math.log(r), l: `ln ${M(r)}`, px: true, c: COL.S }] }),
    };
  }
  let p, q, tex, f, sol, msg = () => '';
  const numTxt = (pp, qq) => { const n = fac23(Math.max(pp, 0), Math.max(qq, 0)), dn = fac23(Math.max(-pp, 0), Math.max(-qq, 0)); return dn === 1 ? `${n}` : F(n, dn); };
  const dec = (pp, qq) => { const parts = []; if (pp) parts.push(`2<sup>${pp}</sup>`.replace('<sup>1</sup>', '')); if (qq) parts.push(`3<sup>${qq}</sup>`.replace('<sup>1</sup>', '')); return parts.join(' × ') || '1'; };
  if (kind === 'prod') {
    [p, q] = pick(NUMS.slice(2)); const N = fac23(p, q);
    tex = `ln ${N}`; f = Math.log(N);
    sol = `${N} = ${dec(p, q)}, donc ln ${N} = ${p ? `${p === 1 ? '' : p + ' '}ln 2` : ''}${p && q ? ' + ' : ''}${q ? `${q === 1 ? '' : q + ' '}ln 3` : ''}.`;
    msg = v => (near(v[0], q) && near(v[1], p) ? 'Inversé : le premier nombre est le coefficient de ln 2.' : '');
  } else if (kind === 'frac') {
    do { p = ri(-4, 3); q = ri(-3, 2); } while ((p >= 0 && q >= 0) || fac23(Math.max(p, 0), Math.max(q, 0)) > 50 || fac23(Math.max(-p, 0), Math.max(-q, 0)) > 50);
    const t = numTxt(p, q); tex = `ln(${t})`; f = Math.log(2 ** p * 3 ** q);
    const n = fac23(Math.max(p, 0), Math.max(q, 0)), dn = fac23(Math.max(-p, 0), Math.max(-q, 0));
    sol = `ln(${t}) = ln ${n} − ln ${dn}${n === 1 ? ' = −ln ' + dn + ' (car ln 1 = 0)' : ''}.<br>${n !== 1 ? `ln ${n} = ${terms([[Math.max(p, 0), L2T], [Math.max(q, 0), L3T]])} ; ` : ''}ln ${dn} = ${terms([[Math.max(-p, 0), L2T], [Math.max(-q, 0), L3T]])}.<br>Donc ln(${t}) = <b>${terms([[p, L2T], [q, L3T]])}</b>.`;
    msg = v => (near(v[0], -p) && near(v[1], -q) ? 'ln(a/b) = ln a <b>−</b> ln b : c\'est le dénominateur qui est retranché.' : near(v[0], Math.abs(p)) && near(v[1], Math.abs(q)) ? 'Les facteurs du dénominateur donnent des coefficients <b>négatifs</b>.' : '');
  } else if (kind === 'expr') {
    const n = ri(2, 3), terms_ = [];
    const used = shuffle(NUMS.slice()).slice(0, n);
    p = 0; q = 0; f = 0;
    used.forEach(([pp, qq], i) => { const k = i === 0 ? pick([1, 2, 3]) : pick([1, -1, 2, -2]); p += k * pp; q += k * qq; f += k * Math.log(fac23(pp, qq)); terms_.push([k, fac23(pp, qq)]); });
    if (p === 0 && q === 0) { p += 1; terms_.push([1, 2]); f += Math.log(2); }
    tex = terms_.map(([k, N], i) => `${k < 0 ? (i ? ' − ' : '−') : i ? ' + ' : ''}${Math.abs(k) === 1 ? '' : Math.abs(k) + ' '}ln ${N}`).join('');
    const det = terms_.map(([k, N]) => { const [pp, qq] = NUMS.find(([a, b]) => fac23(a, b) === N) || [1, 0]; return `${Math.abs(k) === 1 ? (k < 0 ? '−' : '') : M(k)}(${terms([[pp, L2T], [qq, L3T]])})`; }).join(' + ').replace(/\+ −/g, '− ');
    sol = `On décompose chaque nombre en produit de 2 et de 3 :<br>${tex} = ${det} = <b>${terms([[p, L2T], [q, L3T]])}</b>.`;
  } else {
    const sub = chance(0.5) ? 'rac' : 'mix';
    if (sub === 'rac') {
      [p, q] = pick(NUMS.slice(1)); const N = fac23(p, q);
      tex = `ln ${R(N)}`; f = 0.5 * Math.log(N); sol = `${R(N)} = ${N}<sup>1/2</sup>, donc ln ${R(N)} = ${F(1, 2)} ln ${N} = ${F(1, 2)}(${terms([[p, L2T], [q, L3T]])})`; p /= 2; q /= 2;
      sol += ` = <b>${terms([[p, L2T], [q, L3T]])}</b>.`;
      msg = v => (near(v[0], 2 * p) && near(v[1], 2 * q) ? `ln ${R('a')} = ${F(1, 2)} ln a : divise les coefficients par 2.` : '');
    } else {
      const [a1, b1] = pick(NUMS.slice(0, 6)), r = pick([2, 3, 6]), N = fac23(a1, b1);
      tex = `ln(${N}${R(r)})`; f = Math.log(N * Math.sqrt(r));
      p = a1 + (r % 2 === 0 ? 0.5 : 0); q = b1 + (r % 3 === 0 ? 0.5 : 0);
      sol = `ln(${N}${R(r)}) = ln ${N} + ln ${R(r)} = (${terms([[a1, L2T], [b1, L3T]])}) + ${F(1, 2)} ln ${r} = <b>${terms([[p, L2T], [q, L3T]])}</b>.`;
      msg = v => (near(v[0], a1 + (r % 2 === 0 ? 1 : 0)) && near(v[1], b1 + (r % 3 === 0 ? 1 : 0)) ? `ln ${R(r)} = ${F(1, 2)} ln ${r}, pas ln ${r}.` : '');
    }
  }
  return {
    type: 'nums', html: `Exprime en fonction de <b>ln 2</b> et <b>ln 3</b> :${big(tex)}`, tpl: `= {0} ln 2 + {1} ln 3`,
    check: chk([p, q], msg),
    verify: Ev => near(Ev[0] * Math.LN2 + Ev[1] * Math.log(3), f),
    hint: 'Décompose chaque nombre en produit de 2 et de 3 (12 = 2<sup>2</sup> × 3), puis : <b>ln(ab) = ln a + ln b</b>, <b>ln(a/b) = ln a − ln b</b>, <b>ln(a<sup>n</sup>) = n ln a</b>, <b>ln √a = ½ ln a</b>.',
    solution: sol,
  };
}
function C8() {
  return `<h2>8. Propriétés de ln</h2>
<div class="def">Pour a &gt; 0, b &gt; 0 et n entier :<br><b>ln(ab) = ln a + ln b</b> &nbsp;;&nbsp; <b>ln(${F('a', 'b')}) = ln a − ln b</b> &nbsp;;&nbsp; <b>ln(${F(1, 'b')}) = −ln b</b> &nbsp;;&nbsp; <b>ln(a<sup>n</sup>) = n ln a</b> &nbsp;;&nbsp; <b>ln ${R('a')} = ${F(1, 2)} ln a</b>.<br>ln transforme les <b>produits en sommes</b>.</div>
<div class="ex">ln 12 = ln(2<sup>2</sup> × 3) = <b>2 ln 2 + ln 3</b>.<br>ln(${F(8, 9)}) = ln 8 − ln 9 = <b>3 ln 2 − 2 ln 3</b>.<br>ln 8 + ln 5 − ln 4 = ln(${F('8 × 5', 4)}) = <b>ln 10</b>.</div>
<div class="warn">⚠️ ln(a + b) ≠ ln a + ln b : la règle marche pour un <b>produit</b>.<br>⚠️ ln(a<sup>2</sup>) = 2 ln a, mais (ln a)<sup>2</sup> ≠ 2 ln a.</div>
${graph({ xr: [-1, 9], yr: [-3, 3], fs: [lnF(9)], pts: [{ x: 2, y: Math.LN2, l: 'ln 2', px: true, anchor: 'end', ly: -10 }, { x: 4, y: 2 * Math.LN2, l: 'ln 4 = 2 ln 2', px: true, ly: 26 }, { x: 8, y: 3 * Math.LN2, l: 'ln 8 = 3 ln 2', px: true, anchor: 'end', ly: -14 }] })}`;
}

/* =====================================================================
   9. Équations e^x = a : x = ln a
   ===================================================================== */
function L9(d) {
  const kind = d < 1 ? 'k' : d < 2 ? pick(['kd', 'ke']) : d < 3 ? 'eaxb' : d < 4 ? 'kec' : pick(['eaxb', 'kec', 'none', 'quad', 'quad']);
  if (kind === 'quad') {
    let A, B; do { A = ri(1, 5); B = pick([2, 3, 4, 5, 6, -1, -2, -3]); } while (A === B || A + B === 0);
    const S = A + B, Pp = A * B, g = x => Math.exp(2 * x) - S * Math.exp(x) + Pp;
    const E = [A, B].filter(t => t > 0).map(t => rnd(Math.log(t), 2)).sort((u, v) => u - v);
    const tex = `${EX('2x')} ${S < 0 ? '+' : '−'} ${Math.abs(S) === 1 ? '' : Math.abs(S)}${EX('x')} ${Pp < 0 ? '−' : '+'} ${Math.abs(Pp)} = 0`;
    const W = { xr: [-3, 3], yr: [-7, 8] };
    return {
      type: 'roots', html: `Résous dans ℝ (valeurs arrondies au centième) :${big(tex)}<span class="note">Pose X = e<sup>x</sup> : e<sup>2x</sup> = X<sup>2</sup>.</span>`,
      check: rootsChk(E, { extra: v => (valsOf(v).some(x => near(x, A) || near(x, B)) ? `${A} et ${B} sont les valeurs de X = e<sup>x</sup>. Il faut ensuite résoudre e<sup>x</sup> = X.` : B < 0 && valsOf(v).length === 2 ? `e<sup>x</sup> = ${M(B)} n'a pas de solution : une exponentielle est positive.` : '') }),
      verify: Ev => {
        let n = 0; for (let x = -10; x < 10; x += 0.01) if (g(x) * g(x + 0.01) < 0 || g(x) === 0) n++;
        return n === Ev.length && Ev.every(r => g(r - 0.006) * g(r + 0.006) < 0);
      },
      visual: '', afterVisual: graph({ ...W, fs: [{ f: g, l: 'y = membre de gauche' }], pts: E.map((r, i) => ({ x: r, y: 0, l: `x ≈ ${Mk(r)}`, anchor: i === 0 && E.length > 1 ? 'end' : 'start', ly: i === 0 ? -12 : 24 })) }),
      hint: 'Avec X = e<sup>x</sup>, l\'équation devient X<sup>2</sup> − … X + … = 0. Trouve X, puis résous e<sup>x</sup> = X (seulement si X &gt; 0).',
      solution: `Avec X = e<sup>x</sup> : X<sup>2</sup> ${S < 0 ? '+' : '−'} ${Math.abs(S)}X ${Pp < 0 ? '−' : '+'} ${Math.abs(Pp)} = 0, soit (X − ${A})(X ${sgn(-B)}) = 0 : X = ${A} ou X = ${M(B)}.<br>${[A, B].map(t => (t === 1 ? 'e<sup>x</sup> = 1 ⟺ x = ln 1 = 0' : t > 0 ? `e<sup>x</sup> = ${t} ⟺ x = ln ${t} ≈ ${Mk(Math.log(t))}` : `e<sup>x</sup> = ${M(t)} : impossible (e<sup>x</sup> &gt; 0)`)).join(' ; ')}.<br><b>${E.map(r => 'x ≈ ' + Mk(r)).join(' et ')}</b>.`,
    };
  }
  let lhsF, m, tex, exact, sol, msg = () => '', note = '';
  if (kind === 'k') {
    const k = ri(2, 30); lhsF = Math.exp; m = k; tex = `${EX('x')} = ${k}`; exact = Math.log(k);
    sol = `e<sup>x</sup> = ${k} ⟺ x = ln ${k} ≈ <b>${Mk(exact)}</b>.`;
  } else if (kind === 'kd') {
    const k = pick([0.5, 0.2, 0.1, 0.25, 0.8, 1.5, 2.5, 0.05]); lhsF = Math.exp; m = k; tex = `${EX('x')} = ${M(k)}`; exact = Math.log(k);
    sol = `e<sup>x</sup> = ${M(k)} ⟺ x = ln ${M(k)} ≈ <b>${Mk(exact)}</b>${k < 1 ? ' (négatif car ' + M(k) + ' &lt; 1)' : ''}.`;
  } else if (kind === 'ke') {
    const a = ri(2, 5), k = ri(2, 9); m = a * k; lhsF = x => a * Math.exp(x); tex = `${a}${EX('x')} = ${m}`; exact = Math.log(k);
    sol = `On divise par ${a} : e<sup>x</sup> = ${k}, donc x = ln ${k} ≈ <b>${Mk(exact)}</b>.`;
    msg = v => (near(v[0], rnd(Math.log(m), 2)) ? `Divise d'abord par ${a} pour isoler e<sup>x</sup>.` : '');
  } else if (kind === 'eaxb') {
    const a = pick([2, 3, 4, 5, -1, -2, -3]), b = nz(-5, 5), k = ri(2, 20);
    lhsF = x => Math.exp(a * x + b); m = k; tex = `${EX(lin(a, b))} = ${k}`; exact = (Math.log(k) - b) / a;
    sol = `${lin(a, b)} = ln ${k} ⟺ x = ${F(`ln ${k} ${sgn(-b)}`, M(a))} ≈ <b>${Mk(exact)}</b>.`;
    msg = v => (near(v[0], rnd(Math.log(k) - b, 2)) && a !== 1 ? `N'oublie pas de diviser par ${M(a)}.` : near(v[0], rnd(Math.log(k) / a - b, 2)) ? `Retranche ${M(b)} <b>avant</b> de diviser par ${M(a)}.` : near(v[0], rnd((Math.log(k) + b) / a, 2)) ? `On retranche ${M(b)} : attention au signe.` : '');
  } else {
    // k e^(ax) + c = m  ⟺  e^(ax) = (m − c)/k = t
    const k = pick([2, 3, 4, 5, -2, -3]), a = pick([1, 2, -1, 3]), c = nz(-9, 9), t = ri(2, 9);
    m = k * t + c;
    lhsF = x => k * Math.exp(a * x) + c; tex = `${co(k)}${EX(lin(a, 0))}${plus(c)} = ${M(m)}`; exact = Math.log(t) / a;
    note = `e<sup>${lin(a, 0)}</sup> = ${F(`${M(m)} ${sgn(-c)}`, M(k))} = ${t}`;
    sol = `On isole l'exponentielle : ${note}.<br>${lin(a, 0)} = ln ${t}, donc x = ${a === 1 ? `ln ${t}` : a === -1 ? `−ln ${t}` : F(`ln ${t}`, M(a))} ≈ <b>${Mk(exact)}</b>.`;
    msg = v => (near(v[0], rnd(Math.log(Math.abs(m)) / a, 2)) ? `Isole d'abord e<sup>${lin(a, 0)}</sup> : retranche ${M(c)}, puis divise par ${M(k)}.` : '');
  }
  if (kind === 'none') {
    const a = pick([1, 2, -1, 3]), c = ri(1, 9), k = pick([1, 2, 3]), mm = c - ri(0, 6);
    const f = x => k * Math.exp(a * x) + c, t2 = `${co(k)}${EX(lin(a, 0))} + ${c} = ${M(mm)}`;
    return {
      type: 'roots', html: `Résous dans ℝ :${big(t2)}`,
      check: rootsChk([], { noneMsg: `${co(k)}e<sup>${lin(a, 0)}</sup> est strictement positif, donc ${co(k)}e<sup>${lin(a, 0)}</sup> + ${c} &gt; ${c} ≥ ${M(mm)}.` }),
      truth: x => k * Math.exp(a * x) === mm - c, // e^(ax) ne s'annule pas (pas de soupassement sur [−60 ; 60])
      visual: graph({ xr: [-4, 4], yr: span([mm - 1, c + 4], 0, 8), fs: [{ f, l: 'y = membre de gauche' }], lines: [{ x: 0, y: mm, m: 0, c: COL.T, l: `y = ${M(mm)}` }] }),
      hint: 'Isole l\'exponentielle. Une exponentielle peut-elle être négative ou nulle ?',
      solution: `${co(k)}e<sup>${lin(a, 0)}</sup> = ${M(mm - c)}${k > 1 ? `, soit e<sup>${lin(a, 0)}</sup> = ${M(r6((mm - c) / k))}` : ''} : impossible, car une exponentielle est <b>strictement positive</b>.<br><b>Aucune solution</b> (sur le graphique, la courbe reste au-dessus de la droite).`,
    };
  }
  const E = rnd(exact, 2), g = x => lhsF(x) - m;
  const value = rnd(bisect(g, -60, 60), 2);
  const W = { xr: span([exact - 2.5, exact + 2.5], 0, 6), yr: span([0, m, Math.abs(m) * 1.5 + 1], 1, 7) };
  if (kind === 'kec') W.yr = span([m, lhsF(exact - 1.5), lhsF(exact + 1.5)].map(y => Math.max(-Math.abs(m) - 4, Math.min(Math.abs(m) + 4, y))), 1, 7);
  const sc = { ...W, fs: [{ f: lhsF, l: 'y = membre de gauche' }], lines: [{ x: 0, y: m, m: 0, c: COL.T, l: `y = ${M(m)}` }] };
  return {
    type: 'nums', html: `Résous dans ℝ et donne x arrondi au centième :${big(tex)}`, tpl: 'x ≈ {0}',
    check: chkA([E], exact, v => msg(v) || (near(v[0], rnd(Math.log10(Math.abs(m)), 2)) ? 'Utilise la touche <b>ln</b> de la calculatrice, et non log (logarithme décimal).' : '')),
    value,
    visual: graph(sc), afterVisual: graph({ ...sc, pts: [{ x: exact, y: m, px: true, l: `x ≈ ${Mk(E)}`, ly: -12 }] }), replaceVisual: true,
    hint: `Isole l'exponentielle, puis utilise <b>e<sup>X</sup> = a ⟺ X = ln a</b> (a &gt; 0). Calcule à la calculatrice et arrondis à la fin.`,
    solution: sol,
  };
}
function C9() {
  return `<h2>9. Résoudre e<sup>x</sup> = a</h2>
<div class="def">Pour a &gt; 0 : <b>e<sup>x</sup> = a ⟺ x = ln a</b>.<br>Pour a ≤ 0 : <b>aucune solution</b> (e<sup>x</sup> &gt; 0).<br>Méthode : on <b>isole</b> l'exponentielle, puis on applique ln.</div>
<div class="ex">3e<sup>2x</sup> − 1 = 14 ⟺ e<sup>2x</sup> = 5 ⟺ 2x = ln 5 ⟺ x = ${F('ln 5', 2)} ≈ <b>0,80</b>.<br>e<sup>x</sup> + 4 = 1 ⟺ e<sup>x</sup> = −3 : <b>aucune solution</b>.</div>
<div class="warn">⚠️ Sur la calculatrice : touche <b>ln</b>, pas log.<br>⚠️ On arrondit seulement à la fin du calcul.</div>
${graph({ xr: [-3, 3], yr: [-1, 8], fs: [EXPF], lines: [{ x: 0, y: 5, m: 0, c: COL.T, l: 'y = 5' }], pts: [{ x: Math.log(5), y: 5, l: 'x = ln 5 ≈ 1,61', px: true, anchor: 'end', ly: -12 }] })}`;
}

/* =====================================================================
   10. Équations avec ln, ensemble de définition
   ===================================================================== */
function L10(d) {
  const kind = d < 1 ? 'zero' : d < 2 ? 'lnk' : d < 3 ? 'c' : d < 4 ? 'deux' : pick(['deux', 'somme', 'somme', 'c', 'lnk']);
  if (kind === 'deux' || kind === 'somme') {
    let html, E, truth, sol, extra, fs, band, W, yOf;
    if (kind === 'deux') {
      let a, c; do { a = nz(-4, 4); c = nz(-4, 4); } while (a === c);
      const x0 = ri(-5, 5), val = chance(0.35) ? -ri(1, 4) : ri(1, 8), b = val - a * x0, dd = val - c * x0;
      E = val > 0 ? [x0] : [];
      truth = x => a * x + b > 0 && c * x + dd > 0 && Math.abs(Math.log(a * x + b) - Math.log(c * x + dd)) < 1e-12;
      html = `Résous dans ℝ :${big(`ln(${lin(a, b)}) = ln(${lin(c, dd)})`)}<span class="note">Pense à l'ensemble de définition.</span>`;
      sol = `Il faut ${lin(a, b)} &gt; 0 et ${lin(c, dd)} &gt; 0. Alors ln u = ln v ⟺ u = v : ${lin(a, b)} = ${lin(c, dd)} ⟺ x = ${M(x0)}.<br>Pour x = ${M(x0)} : ${M(a)} × ${P(x0)}${plus(b)} = ${M(val)} ${val > 0 ? '&gt; 0 ✔' : '≤ 0 ✘'}.<br>${val > 0 ? `<b>x = ${M(x0)}</b>.` : '<b>Aucune solution</b> : la valeur trouvée n\'est pas dans l\'ensemble de définition.'}`;
      extra = v => (E.length === 0 && valsOf(v).some(x => near(x, x0)) ? `Pour x = ${M(x0)}, ${lin(a, b)} = ${M(val)} ≤ 0 : ln(${M(val)}) n'existe pas. Cette valeur est à <b>rejeter</b>.` : '');
      const f1 = x => (a * x + b > 0 ? Math.log(a * x + b) : NaN), f2 = x => (c * x + dd > 0 ? Math.log(c * x + dd) : NaN);
      fs = [{ f: f1, l: `y = ln(${lin(a, b)})` }, { f: f2, c: COL.T, l: `y = ln(${lin(c, dd)})` }];
      const lo = Math.max(a > 0 ? -b / a : -INF, c > 0 ? -dd / c : -INF), hi = Math.min(a < 0 ? -b / a : INF, c < 0 ? -dd / c : INF);
      band = lo < hi ? [lo, hi] : null;
      W = { xr: span([x0 - 4, x0 + 4], 0, 10), yr: [-4, 4] }; yOf = f1;
    } else {
      let r1, r2; do { r1 = ri(1, 6); r2 = -ri(1, 8); } while (r1 + r2 === 0);
      const a = -(r1 + r2), B = -r1 * r2;
      E = [r1];
      truth = x => x > 0 && x + a > 0 && near(Math.log(x) + Math.log(x + a), Math.log(B), 1e-12);
      html = `Résous dans ℝ :${big(`ln x + ln(${lin(1, a)}) = ln ${B}`)}<span class="note">Pense à l'ensemble de définition.</span>`;
      sol = `Il faut x &gt; 0 et ${lin(1, a)} &gt; 0, soit x &gt; ${M(Math.max(0, -a))}.<br>ln x + ln(${lin(1, a)}) = ln(x(${lin(1, a)})), donc x(${lin(1, a)}) = ${B} ⟺ ${terms([[1, 'x<sup>2</sup>'], [a, 'x'], [-B, '']])} = 0 ⟺ (x ${sgn(-r1)})(x ${sgn(-r2)}) = 0.<br>x = ${M(r1)} convient ; x = ${M(r2)} &lt; 0 est <b>rejeté</b>. Solution : <b>x = ${M(r1)}</b>.`;
      extra = v => (valsOf(v).some(x => near(x, r2)) ? `x = ${M(r2)} est négatif : ln(${M(r2)}) n'existe pas. Il faut <b>rejeter</b> cette valeur.` : '');
      fs = [{ f: x => (x > 0 && x + a > 0 ? Math.log(x) + Math.log(x + a) : NaN), l: 'y = membre de gauche' }];
      band = [Math.max(0, -a), INF];
      W = { xr: span([-2, r1 + 3, Math.max(0, -a)], 0, 9), yr: span([Math.log(B) - 3, Math.log(B) + 2], 0, 7) }; yOf = () => Math.log(B);
      fs.push({ f: () => Math.log(B), c: COL.T, l: `y = ln ${B}` });
    }
    return {
      type: 'roots', html, truth,
      check: rootsChk(E, { extra }),
      visual: '', afterVisual: graph({ ...W, band: band ? [Math.max(W.xr[0], band[0]), Math.min(W.xr[1], band[1])] : undefined, fs, pts: E.map(x => ({ x, y: yOf(x), px: true, l: `x = ${M(x)}` })) }),
      hint: '1) Cherche l\'ensemble de définition (ce qui est dans ln doit être <b>strictement positif</b>). 2) ln u = ln v ⟺ u = v (et ln a + ln b = ln(ab)). 3) Garde seulement les solutions qui sont dans l\'ensemble de définition.',
      solution: sol,
    };
  }
  let a, b, rhsV, rhsT, x0, exact, sol, msg = () => '';
  if (kind === 'zero') {
    a = 1; b = nz(-6, 6); x0 = 1 - b; exact = x0; rhsV = 0; rhsT = '0';
    sol = `ln X = 0 ⟺ X = e<sup>0</sup> = 1. Donc ${lin(1, b)} = 1 et <b>x = ${M(x0)}</b> (on a bien ${lin(1, b)} = 1 &gt; 0).`;
    msg = v => (near(v[0], -b) ? 'ln X = 0 ⟺ X = 1 (et non X = 0), car ln 1 = 0.' : '');
  } else if (kind === 'lnk') {
    a = pick([1, 2, 3, 4, 5, -1, -2]); x0 = ri(-5, 6); const k = ri(1, 20); b = k - a * x0; exact = x0; rhsV = Math.log(k); rhsT = `ln ${k}`;
    sol = `ln u = ln v ⟺ u = v (u, v &gt; 0) : ${lin(a, b)} = ${k} ⟺ <b>x = ${M(x0)}</b>. Vérification : ${lin(a, b)} = ${k} &gt; 0 ✔.`;
    msg = v => (near(v[0], (Math.log(k) - b) / a) ? `ln u = ln ${k} donne u = ${k} : pas besoin de calculatrice.` : '');
  } else {
    a = pick([1, 2, 3, -1, -2]); b = ri(-5, 5); const c = pick([1, 2, -1, 0.5, 3, -2]); rhsV = c; rhsT = M(c);
    exact = (Math.exp(c) - b) / a; x0 = rnd(exact, 2);
    sol = `ln X = ${M(c)} ⟺ X = ${EX(M(c))}. Donc ${lin(a, b)} = ${EX(M(c))} et x = ${a === 1 ? `${EX(M(c))}${plus(-b)}` : F(`${EX(M(c))}${plus(-b)}`, M(a))} ≈ <b>${Mk(exact)}</b>.<br>Vérification : ${lin(a, b)} = ${EX(M(c))} &gt; 0 ✔.`;
    msg = v => (near(v[0], rnd((c - b) / a, 2)) ? `ln X = ${M(c)} ⟺ X = <b>e<sup>${M(c)}</sup></b> (et non X = ${M(c)}).` : near(v[0], rnd((Math.log(c > 0 ? c : 1) - b) / a, 2)) && c > 0 ? 'On applique exp (pas ln) aux deux membres.' : '');
  }
  const f = x => (a * x + b > 0 ? Math.log(a * x + b) : NaN), asym = -b / a;
  const eps = 1e-9 * (1 + Math.abs(asym)), lo = a > 0 ? asym + eps : -1e6, hi = a > 0 ? 1e6 : asym - eps;
  const value = kind === 'c' ? rnd(bisect(x => Math.log(a * x + b) - rhsV, lo, hi), 2) : r6(bisect(x => Math.log(a * x + b) - rhsV, lo, hi));
  const W = { xr: span([exact - 4, exact + 3, asym], 0, 9), yr: span([rhsV - 3, rhsV + 2], 0, 7) };
  const sc = { ...W, band: a > 0 ? [asym, W.xr[1]] : [W.xr[0], asym], vs: [{ x: asym }], fs: [{ f, l: `y = ln(${lin(a, b)})` }], lines: [{ x: 0, y: rhsV, m: 0, c: COL.T, l: `y = ${rhsT}` }] };
  return {
    type: 'nums', html: `Résous dans ℝ${kind === 'c' ? ' (arrondi au centième)' : ''} :${big(`ln(${lin(a, b)}) = ${rhsT}`)}`, tpl: kind === 'c' ? 'x ≈ {0}' : 'x = {0}',
    check: kind === 'c' ? chkA([x0], exact, msg) : chk([x0], msg), value,
    visual: graph(sc), afterVisual: graph({ ...sc, pts: [{ x: exact, y: rhsV, px: true, l: `x ${kind === 'c' ? '≈' : '='} ${M(x0)}`, ly: -12 }] }), replaceVisual: true,
    hint: `${lin(a, b)} doit être <b>strictement positif</b> (zone orange). Puis <b>ln X = c ⟺ X = e<sup>c</sup></b> (et ln u = ln v ⟺ u = v).`,
    solution: sol,
  };
}
function C10() {
  const f = x => (x > 1 ? Math.log(x - 1) : NaN);
  return `<h2>10. Équations avec ln</h2>
<div class="def">ln u n'existe que si <b>u &gt; 0</b> : on cherche d'abord l'<b>ensemble de définition</b>.<br>Ensuite : <b>ln X = c ⟺ X = e<sup>c</sup></b> &nbsp;;&nbsp; <b>ln u = ln v ⟺ u = v</b> (u &gt; 0, v &gt; 0).<br>On <b>vérifie</b> enfin que chaque solution trouvée est dans l'ensemble de définition.</div>
<div class="ex">ln(x − 1) = 2 : il faut x &gt; 1. x − 1 = e<sup>2</sup>, donc x = e<sup>2</sup> + 1 ≈ <b>8,39</b> &gt; 1 ✔.<br>ln x + ln(x + 1) = ln 6 : il faut x &gt; 0 ; x(x + 1) = 6 ⟺ x = 2 ou x = −3. On rejette −3 : <b>x = 2</b>.</div>
<div class="warn">⚠️ ln X = 0 ⟺ X = 1 (pas X = 0).<br>⚠️ Une valeur trouvée par le calcul peut être hors de l'ensemble de définition : il faut la <b>rejeter</b>.</div>
${graph({ xr: [-1, 10], yr: [-3, 3], band: [1, 10], vs: [{ x: 1 }], fs: [{ f, dom: [1.001, 10], l: 'y = ln(x − 1)' }], lines: [{ x: 0, y: 2, m: 0, c: COL.T, l: 'y = 2' }], pts: [{ x: Math.E ** 2 + 1, y: 2, l: 'x ≈ 8,39', px: true, anchor: 'end', ly: -12 }] })}`;
}

/* =====================================================================
   11. Seuils : qⁿ < s ⟺ n > ln s / ln q
   ===================================================================== */
function L11(d) {
  const kind = d < 1 ? 'puiss' : d < 2 ? 'hausse' : d < 3 ? 'baisse' : d < 4 ? 'capital' : pick(['medic', 'proba', 'capital', 'baisse']);
  let q, C = 1, S, rel, html, cond, Ltxt, ctx = '', unit = '';
  for (let tries = 0; ; tries++) {
    if (kind === 'puiss') { q = pick([2, 3, 5, 2]); S = pick([100, 500, 1000, 5000, 10000, 100000, 1000000]); rel = '>'; }
    else if (kind === 'hausse') { q = 1 + pick([1, 2, 3, 4, 5, 6, 8, 10, 12, 15]) / 100; S = pick([2, 3, 1.5, 10]); rel = '≥'; }
    else if (kind === 'baisse') { q = pick([0.9, 0.8, 0.75, 0.5, 0.95, 0.85, 0.6]); S = pick([0.1, 0.01, 0.5, 0.2, 0.05, 0.001]); rel = '<'; }
    else if (kind === 'capital') { q = 1 + pick([1, 2, 3, 4, 5, 6]) / 100; C = pick([500, 1000, 1500, 2000, 3000, 5000]); S = C * pick([1.5, 2, 3, 1.2, 1.8]); rel = '≥'; }
    else if (kind === 'medic') { q = 1 - pick([10, 15, 20, 25, 30]) / 100; C = pick([50, 80, 100, 120, 200, 500]); S = pick([1, 2, 5, 10]); rel = '<'; }
    else { q = pick([0.9, 0.8, 0.95, 0.7, 0.5, 0.85]); C = 1; S = pick([0.01, 0.05, 0.001, 0.1]); rel = '≤'; }
    const Lr = Math.log(S / C) / Math.log(q);
    if (S / C !== 1 && Math.abs(Lr - Math.round(Lr)) > 1e-4 && Lr > 0 && Lr < 400) break;
  }
  const L = Math.log(S / C) / Math.log(q), E = Math.floor(L) + 1, down = q < 1;
  const qT = M(q), CT = M(C);
  if (kind === 'puiss' || kind === 'hausse' || kind === 'baisse') {
    html = `Donne le plus petit entier naturel n tel que :${big(`${qT}<sup>n</sup> ${REL[rel]} ${M(S)}`)}`;
    cond = u => CMP[rel](u, S);
    Ltxt = `n ${down ? '&gt;' : rel === '>' ? '&gt;' : '≥'} ${F(`ln ${M(S)}`, `ln ${qT}`)} ≈ ${Mk(L)}`;
  } else if (kind === 'capital') {
    const t = rnd((q - 1) * 100, 0);
    html = `On place <b>${CT} €</b> à <b>${t}&nbsp;%</b> d'intérêts composés par an.<br>Au bout de combien d'années le capital atteindra-t-il <b>${M(S)} €</b> pour la première fois ?`;
    cond = u => u * C >= S; ctx = `${CT} × ${qT}<sup>n</sup> ≥ ${M(S)} ⟺ ${qT}<sup>n</sup> ≥ ${M(r6(S / C))}`; unit = 'années';
    Ltxt = `n ≥ ${F(`ln ${M(r6(S / C))}`, `ln ${qT}`)} ≈ ${Mk(L)}`;
  } else if (kind === 'medic') {
    const t = rnd((1 - q) * 100, 0);
    html = `On injecte <b>${CT} mg</b> d'un médicament. Chaque heure, la quantité dans le sang diminue de <b>${t}&nbsp;%</b>.<br>Au bout de combien d'heures restera-t-il <b>moins de ${M(S)} mg</b> ?`;
    cond = u => u * C < S; ctx = `${CT} × ${qT}<sup>n</sup> &lt; ${M(S)} ⟺ ${qT}<sup>n</sup> &lt; ${M(r6(S / C))}`; unit = 'heures';
    Ltxt = `n &gt; ${F(`ln ${M(r6(S / C))}`, `ln ${qT}`)} ≈ ${Mk(L)}`;
  } else {
    const p = r6(1 - S);
    html = `On lance n fois une épreuve qui échoue avec la probabilité ${qT}. La probabilité d'au moins un succès est 1 − ${qT}<sup>n</sup>.<br>Quel est le plus petit n pour lequel cette probabilité est <b>au moins ${M(p)}</b> ?`;
    cond = u => 1 - u >= p; ctx = `1 − ${qT}<sup>n</sup> ≥ ${M(p)} ⟺ ${qT}<sup>n</sup> ≤ ${M(S)}`; unit = 'lancers';
    Ltxt = `n ≥ ${F(`ln ${M(S)}`, `ln ${qT}`)} ≈ ${Mk(L)}`;
  }
  // vérification indépendante : on multiplie jusqu'à franchir le seuil
  let u = 1, n = 0; while (!cond(u) && n < 2000) { u *= q; n++; }
  const nb = Math.min(E + Math.max(2, Math.round(E / 8)), 400), vals = [];
  for (let i = 0, w = C; i <= nb; i++, w *= q) vals.push(kind === 'proba' ? 1 - w : w);
  const seuil = kind === 'proba' ? r6(1 - S) : S;
  return {
    type: 'nums', keys: { neg: false, comma: false }, html, tpl: unit ? `n = {0} ${unit}` : 'n = {0}',
    check: chk([E], v => (near(v[0], E - 1) ? (down ? `Presque : ln ${qT} &lt; 0, donc en divisant on <b>change le sens</b> : n &gt; ${Mk(L)}. On prend l'entier juste au-dessus.` : `n doit dépasser ${Mk(L)} : on prend l'entier <b>juste au-dessus</b>.`) : near(v[0], Math.round(L * 100) / 100) ? 'n est un entier.' : '')),
    value: n,
    visual: '', afterVisual: barres(vals, { seuil, seuilL: `seuil ${M(seuil)}`, hl: E, hlL: `n = ${E}`, up: kind === 'proba' || !down, xl: 'n' }),
    hint: `Applique ln aux deux membres (ln est croissante) : n × ln ${qT} ${REL[rel]} ln(…). Puis divise par ln ${qT}${down ? ` — attention, <b>ln ${qT} &lt; 0</b> : le sens change !` : ' (positif).'}`,
    solution: `${ctx ? ctx + '.<br>' : ''}On applique ln : n ln ${qT} ${REL[kind === 'proba' ? '≤' : kind === 'medic' ? '<' : kind === 'capital' ? '≥' : rel]} ln ${M(kind === 'proba' ? S : r6(S / C))}.<br>${down ? `ln ${qT} &lt; 0 : on divise et <b>le sens change</b> : ` : `ln ${qT} &gt; 0 : `}${Ltxt}.<br>Le plus petit entier qui convient : <b>n = ${E}</b>.`,
  };
}
function C11() {
  const vals = []; for (let i = 0, w = 1; i <= 13; i++, w *= 0.8) vals.push(w);
  return `<h2>11. Seuils : résoudre q<sup>n</sup> &lt; s</h2>
<div class="def">Pour trouver le plus petit entier n tel que q<sup>n</sup> &gt; s (ou &lt; s), on applique <b>ln</b>, qui est croissante :<br>q<sup>n</sup> &gt; s ⟺ n ln q &gt; ln s.<br>• si q &gt; 1, ln q &gt; 0 : n &gt; ${F('ln s', 'ln q')} ;<br>• si 0 &lt; q &lt; 1, <b>ln q &lt; 0</b> : en divisant, <b>le sens change</b>.</div>
<div class="ex">0,8<sup>n</sup> &lt; 0,1 ⟺ n ln 0,8 &lt; ln 0,1 ⟺ n &gt; ${F('ln 0,1', 'ln 0,8')} ≈ 10,32 (sens changé). Donc <b>n = 11</b>.</div>
<div class="warn">⚠️ ln q &lt; 0 quand q &lt; 1 : diviser par ln q change le sens.<br>⚠️ La réponse est un <b>entier</b> : on prend l'entier juste au-dessus de la valeur trouvée.</div>
${barres(vals, { seuil: 0.1, seuilL: 'seuil 0,1', hl: 11, hlL: 'n = 11', xl: 'n', up: false })}`;
}

/* =====================================================================
   12. Dérivées : (e^u)′ = u′e^u, (ln u)′ = u′/u, variations
   ===================================================================== */
function L12(d) {
  const kind = d < 1 ? 'eu' : d < 2 ? 'lnu' : d < 3 ? 'vare' : d < 4 ? 'varln' : pick(['eu', 'lnu', 'vare', 'varln', 'tab', 'tan']);
  let f, html, q, sol, after, hint;
  if (kind === 'eu' || kind === 'lnu' || kind === 'tan') {
    let tpl, E, g, xs, W, x0 = 0, msg = () => '';
    if (kind === 'eu') {
      const a = d < 1 ? 1 : pick([1, -1, 2, -2]), b = d < 1 ? nz(-4, 4) : ri(-4, 4), c = d < 1 ? 0 : ri(-2, 2);
      const u = x => a * x * x + b * x + c, ut = terms([[a, 'x<sup>2</sup>'], [b, 'x'], [c, '']]);
      f = x => Math.exp(u(x)); E = [2 * a, b]; g = Ev => x => (Ev[0] * x + Ev[1]) * Math.exp(u(x));
      html = `Soit f(x) = ${EX(ut)}.<br>Calcule f${PR}(x).`; tpl = `f${PR}(x) = ({0} x + {1}) ${EX(ut)}`;
      xs = [-0.9, -0.4, 0.1, 0.5, 0.8];
      msg = v => (near(v[0], 0) && near(v[1], 1) ? `(e<sup>u</sup>)${PR} n'est pas e<sup>u</sup> : il faut multiplier par u${PR}.` : near(v[0], a) && near(v[1], b) ? `u${PR}(x) : la dérivée de ${co(a)}x<sup>2</sup> est ${M(2 * a)}x.` : '');
      sol = `u(x) = ${ut}, u${PR}(x) = ${lin(2 * a, b)}.<br>(e<sup>u</sup>)${PR} = u${PR}e<sup>u</sup> : <b>f${PR}(x) = (${lin(2 * a, b)})${EX(ut)}</b>.`;
      x0 = 0; W = { xr: [-3, 3], yr: span([f(0) - 2, f(0) + 4], 1, 7) };
    } else if (kind === 'lnu') {
      const sub = pick(['lin', 'quad', 'kln']);
      if (sub === 'lin') {
        const a = pick([2, 3, 4, 5, -1, -2]), b = nz(-6, 6), L0 = lin(a, b);
        f = x => (a * x + b > 0 ? Math.log(a * x + b) : NaN); E = [a]; g = Ev => x => Ev[0] / (a * x + b);
        html = `Soit f(x) = ln(${L0}), là où ${L0} &gt; 0.<br>Calcule f${PR}(x).`; tpl = `f${PR}(x) = ${F('{0}', L0)}`;
        xs = [0.3, 0.9, 1.7, 2.6, 3.4].map(t => -b / a + Math.sign(a) * t);
        msg = v => (near(v[0], 1) ? `(ln u)${PR} = ${F(`u${PR}`, 'u')} : le numérateur est u${PR} = ${M(a)}.` : '');
        sol = `u = ${L0}, u${PR} = ${M(a)}. (ln u)${PR} = ${F(`u${PR}`, 'u')} : <b>f${PR}(x) = ${F(M(a), L0)}</b>.`;
        x0 = -b / a + Math.sign(a) * 1; W = { xr: span([x0 - 3, x0 + 3, -b / a], 0, 8), yr: [-4, 4] };
      } else if (sub === 'quad') {
        const c = ri(1, 9), k = pick([1, 2, 3]);
        f = x => k * Math.log(x * x + c); E = [2 * k]; g = Ev => x => Ev[0] * x / (x * x + c);
        html = `Soit f(x) = ${kl(k)}ln(x<sup>2</sup> + ${c}).<br>Calcule f${PR}(x).`; tpl = `f${PR}(x) = ${F('{0} x', `x<sup>2</sup> + ${c}`)}`;
        xs = [-2.1, -0.7, 0.4, 1.3, 2.5];
        msg = v => (near(v[0], k) ? `u = x<sup>2</sup> + ${c} a pour dérivée u${PR} = 2x.` : '');
        sol = `u = x<sup>2</sup> + ${c} &gt; 0, u${PR} = 2x. (ln u)${PR} = ${F(`u${PR}`, 'u')}, donc <b>f${PR}(x) = ${F(`${M(2 * k)}x`, `x<sup>2</sup> + ${c}`)}</b>.`;
        x0 = 1; W = { xr: [-4, 4], yr: span([f(0) - 1, f(4) + 1], 0, 7) };
      } else {
        const k = nz(-6, 6), m = ri(-3, 3);
        f = x => (x > 0 ? k * Math.log(x) + m * x : NaN); E = [k, m]; g = Ev => x => Ev[0] / x + Ev[1];
        html = `Soit f(x) = ${terms([[k, ' ln x'], [m, 'x']])} sur ]0 ; +∞[.<br>Calcule f${PR}(x).`; tpl = `f${PR}(x) = ${F('{0}', 'x')} + {1}`;
        xs = [0.4, 0.9, 1.6, 2.7, 3.8];
        msg = v => (near(v[0], 1) && k !== 1 ? `(k ln x)${PR} = ${F('k', 'x')} : garde le coefficient ${M(k)}.` : '');
        sol = `(ln x)${PR} = ${F(1, 'x')}, donc (${terms([[k, ' ln x']])})${PR} = ${F(M(k), 'x')}${m ? ` et (${terms([[m, 'x']])})${PR} = ${M(m)}` : ''}.<br><b>f${PR}(x) = ${F(M(k), 'x')}${m ? ' ' + sgn(m) : ''}</b>.`;
        x0 = 1; W = { xr: [-1, 6], yr: span([f(0.2), f(1), f(6)].map(y => Math.max(-8, Math.min(8, y))), 1, 7) };
      }
    } else {
      const k = nz(-4, 4), m = ri(-3, 3);
      f = x => (x > 0 ? k * Math.log(x) + m * x : NaN); E = [k + m, -k];
      html = `Soit f(x) = ${terms([[k, ' ln x'], [m, 'x']])} sur ]0 ; +∞[.<br>Donne l'équation réduite de la tangente à la courbe au point d'abscisse 1.`;
      tpl = 'T : y = {0} x + {1}'; xs = null; x0 = 1;
      msg = v => (near(v[1], m) && m !== -k ? 'f(1) n\'est pas la constante : développe y = f′(1)(x − 1) + f(1).' : near(v[0], m) && k ? `(ln x)${PR} = 1/x : en x = 1, cela vaut 1, donc f${PR}(1) = ${M(k)} + ${P(m)}.` : '');
      sol = `f(1) = ${M(k)} × ln 1${plus(m)} = ${M(m)} (car ln 1 = 0) ; f${PR}(x) = ${F(M(k), 'x')}${plus(m)}, donc f${PR}(1) = ${M(k + m)}.<br>y = ${M(k + m)}(x − 1) + ${P(m)} : <b>y = ${terms([[k + m, 'x'], [-k, '']])}</b>.`;
      W = { xr: [-1, 6], yr: span([f(0.3), f(1), f(5)].map(y => Math.max(-8, Math.min(8, y))), 1, 7) };
    }
    const fx0 = f(x0), m0 = nd(f, x0);
    const sc = { ...W, fs: [{ f, l: 'y = f(x)' }] };
    return {
      type: 'nums', html, tpl,
      check: chk(E, msg),
      verify: kind === 'tan' ? Ev => near(Ev[0] + Ev[1], f(1)) && near(Ev[0], nd(f, 1), 1e-6) : Ev => sameDer(f, g(Ev), xs),
      visual: graph(sc), afterVisual: graph({ ...sc, lines: [{ x: x0, y: fx0, m: m0, c: COL.T, l: 'tangente' }], pts: [{ x: x0, y: fx0, l: `pente ${M(rnd(m0, 2))}`, anchor: m0 > 0 ? 'end' : 'start', ly: -14 }] }), replaceVisual: true,
      hint: `<b>(e<sup>u</sup>)${PR} = u${PR}e<sup>u</sup></b> &nbsp;;&nbsp; <b>(ln u)${PR} = ${F(`u${PR}`, 'u')}</b> &nbsp;;&nbsp; (ln x)${PR} = ${F(1, 'x')}.${kind === 'tan' ? ' Tangente : y = f′(a)(x − a) + f(a), avec ln 1 = 0.' : ''}`,
      solution: sol,
    };
  }
  // variations
  let want, Inc, Dec, tr, pts = [], W, dom0 = false, x0, ttl;
  if (kind === 'vare' || kind === 'tab') {
    const s = kind === 'tab' ? pick([1, -1]) : d >= 4 ? pick([1, -1]) : 1, b = ri(-2, 2); // extremum en x0 ∈ [−3 ; 1] : |f(x0)| ≤ e, lisible
    // f(x) = (s x + b) e^x  →  f′(x) = (s x + b + s) e^x, racine x0 = −(b + s)/s
    f = x => (s * x + b) * Math.exp(x); x0 = -(b + s) / s;
    ttl = `(${lin(s, b)})${EX('x')}`;
    Inc = s > 0 ? [I(x0, 1, INF, 0)] : [I(-INF, 0, x0, 1)]; Dec = s > 0 ? [I(-INF, 0, x0, 1)] : [I(x0, 1, INF, 0)];
    sol = `f${PR}(x) = ${M(s)} × e<sup>x</sup> + (${lin(s, b)})e<sup>x</sup> = (${lin(s, b + s)})e<sup>x</sup>. Comme e<sup>x</sup> &gt; 0, f${PR}(x) a le signe de ${lin(s, b + s)}, qui s'annule en ${M(x0)}.`;
    pts = [{ x: x0, y: f(x0), l: s > 0 ? 'minimum' : 'maximum', ly: s > 0 ? 24 : -12 }];
    { const ys = []; for (let i = 0; i <= 60; i++) ys.push(f(x0 - 4 + 6 * i / 60)); W = { xr: span([x0 - 4, x0 + 2], 0, 8), yr: span(ys.map(y => Math.max(-6, Math.min(6, y))), 1, 7) }; }
    if (kind === 'tab') {
      const Sg = s > 0 ? ['−', '+'] : ['+', '−'];
      return {
        type: 'table', xs: [x0], fmtX: M, rowLabel: `f${PR}(x)`, check: tableCheck(Sg),
        html: `Soit f(x) = ${ttl} sur ℝ.<br>Calcule f${PR}(x), puis complète le <b>tableau de signes de f${PR}(x)</b>.<br><span class="note">Touche chaque case pour choisir + ou −.</span>`,
        verify: Ev => Ev.every((sg, i) => { const x = i === 0 ? x0 - 1.5 : x0 + 1.5; return sg === '+' ? incr(f, x) && !decr(f, x) : decr(f, x) && !incr(f, x); }),
        visual: '', afterVisual: graph({ ...W, fs: [{ f, l: 'y = f(x)' }], lines: [{ x: x0, y: f(x0), m: 0, c: COL.T }], pts }),
        hint: `(uv)${PR} = u${PR}v + uv${PR} avec v = e<sup>x</sup>, puis factorise par e<sup>x</sup>. Comme <b>e<sup>x</sup> &gt; 0</b>, le signe de f${PR}(x) est celui du facteur affine.`,
        solution: `${sol}<br>${signTableHTML([M(x0)], [[`f${PR}(x)`, [Sg[0], '0', Sg[1]]], ['f', s > 0 ? ['↘', '', '↗'] : ['↗', '', '↘']]])}`,
      };
    }
  } else {
    const a = ri(1, 6), s = d >= 4 ? pick([1, -1]) : 1;
    // f(x) = s(x − a ln x) sur ]0 ; +∞[ : f′(x) = s(x − a)/x
    f = x => (x > 0 ? s * (x - a * Math.log(x)) : NaN); x0 = a; dom0 = true;
    ttl = s > 0 ? `x − ${kl(a)}ln x` : `${kl(a)}ln x − x`;
    Inc = s > 0 ? [I(a, 1, INF, 0)] : [I(0, 0, a, 1)]; Dec = s > 0 ? [I(0, 0, a, 1)] : [I(a, 1, INF, 0)];
    sol = `f${PR}(x) = ${s > 0 ? `1 − ${F(a, 'x')} = ${F(`x − ${a}`, 'x')}` : `${F(a, 'x')} − 1 = ${F(`${a} − x`, 'x')}`}. Sur ]0 ; +∞[, x &gt; 0, donc f${PR}(x) a le signe de ${s > 0 ? `x − ${a}` : `${a} − x`}.`;
    pts = [{ x: a, y: f(a), l: s > 0 ? 'minimum' : 'maximum', ly: s > 0 ? 24 : -12 }];
    W = { xr: [-1, Math.max(8, 2 * a + 2)], yr: span([f(a), f(0.3), f(2 * a + 2)].map(y => Math.max(-10, Math.min(10, y))), 1, 7) };
  }
  want = pick(['croissante', 'décroissante']); const up = want === 'croissante', E = up ? Inc : Dec, other = up ? Dec : Inc;
  tr = x => (!dom0 || x > 0) && (up ? incr(f, x) : decr(f, x));
  const same = (A, B) => A.length === B.length && A.every((e, i) => e.lo === B[i].lo && e.hi === B[i].hi);
  const fn = v => {
    if (v.err) return { ok: false, msg: v.err };
    if (same(v.set, E)) {
      const iv = v.set[0], e = E[0];
      if (dom0 && e.lo === 0 && iv.lc) return { ok: false, msg: 'f n\'est pas définie en 0 (ln 0 n\'existe pas) : le crochet en 0 est <b>ouvert</b>.' };
      const exact = iv.lc === e.lc && iv.hc === e.hc;
      return { ok: true, msg: exact ? '' : `Juste. On écrit d'habitude un crochet <b>fermé</b> en ${M(x0)}, où f${PR} s'annule.` };
    }
    if (same(v.set, other)) return { ok: false, msg: `C'est l'intervalle où f est ${up ? 'décroissante' : 'croissante'} : relis la question.` };
    if (dom0 && v.set.length === 1 && v.set[0].lo === -INF) return { ok: false, msg: 'f n\'est définie que sur ]0 ; +∞[ (à cause de ln x).' };
    return { ok: false, msg: '' };
  };
  fn.expected = E;
  return {
    type: 'iv', check: fn, truth: tr,
    html: `Soit f(x) = ${ttl}${dom0 ? ' sur ]0 ; +∞[' : ' sur ℝ'}.<br>Sur quel intervalle f est-elle <b>${want}</b> ?<br><span class="note">Étudie le signe de f${PR}(x).</span>`,
    visual: '', afterVisual: graph({ ...W, fs: [{ f, dom: dom0 ? [0.01, W.xr[1]] : undefined, l: 'y = f(x)' }], lines: [{ x: x0, y: f(x0), m: 0, c: COL.T }], pts }),
    hint: `f est croissante là où f${PR}(x) ≥ 0. ${dom0 ? `(ln x)${PR} = ${F(1, 'x')} ; mets f${PR}(x) au même dénominateur x (positif).` : `(uv)${PR} = u${PR}v + uv${PR} avec v = e<sup>x</sup> ; e<sup>x</sup> &gt; 0 ne change pas le signe.`}`,
    solution: `${sol}<br>f${PR}(x) ${up ? '≥' : '≤'} 0 sur <b>${fmtSet(E)}</b> : f y est ${want}.`,
  };
}
function C12() {
  return `<h2>12. Dérivées et variations</h2>
<div class="def">Si u est dérivable (et u &gt; 0 pour ln) :<br><b>(e<sup>u</sup>)${PR} = u${PR} e<sup>u</sup></b> &nbsp;;&nbsp; <b>(ln x)${PR} = ${F(1, 'x')}</b> &nbsp;;&nbsp; <b>(ln u)${PR} = ${F(`u${PR}`, 'u')}</b>.<br>Comme e<sup>u</sup> &gt; 0, le signe de u${PR}e<sup>u</sup> est celui de u${PR}.</div>
<div class="ex">f(x) = e<sup>x<sup>2</sup> − 3x</sup> : f${PR}(x) = (2x − 3)e<sup>x<sup>2</sup> − 3x</sup>.<br>f(x) = ln(x<sup>2</sup> + 1) : f${PR}(x) = ${F('2x', 'x<sup>2</sup> + 1')}.<br>f(x) = x − 2 ln x sur ]0 ; +∞[ : f${PR}(x) = 1 − ${F(2, 'x')} = ${F('x − 2', 'x')} : f décroît sur ]0 ; 2], croît sur [2 ; +∞[.</div>
<div class="warn">⚠️ (e<sup>u</sup>)${PR} ≠ e<sup>u</sup> : il faut le facteur u${PR}.<br>⚠️ Avec ln, l'étude se fait sur l'ensemble de définition (x &gt; 0 pour ln x).</div>
${graph({ xr: [-1, 6], yr: [-3, 3], fs: [lnF(6)], lines: [{ x: 1, y: 0, m: 1, c: COL.T, l: 'T : y = x − 1' }], pts: [{ x: 1, y: 0, l: '(1 ; 0)', ly: 22 }] })}`;
}

/* ================= niveaux ================= */
const LEVELS_ = [
  { titre: 'La courbe de eˣ', generate: L1, cours: C1 },
  { titre: 'Règles de calcul', generate: L2, cours: C2 },
  { titre: 'Simplifier e^(ax + b)', generate: L3, cours: C3 },
  { titre: 'Équations eᵘ = eᵛ', generate: L4, cours: C4 },
  { titre: 'Inéquations eᵘ < eᵛ', generate: L5, cours: C5 },
  { titre: 'Croissance exponentielle', generate: L6, cours: C6 },
  { titre: 'Le logarithme ln', generate: L7, cours: C7, classe: 'Tle' },
  { titre: 'Propriétés de ln', generate: L8, cours: C8, classe: 'Tle' },
  { titre: 'Résoudre eˣ = a', generate: L9, cours: C9, classe: 'Tle' },
  { titre: 'Équations avec ln', generate: L10, cours: C10, classe: 'Tle' },
  { titre: 'Seuils : qⁿ < s', generate: L11, cours: C11, classe: 'Tle' },
  { titre: 'Dérivées et variations', generate: L12, cours: C12, classe: 'Tle' },
];
export const LEVELS = LEVELS_.map(L => ({ classe: '1re', ...L }));
export const OPTIONS = { need: 4, keys: { comma: true } };

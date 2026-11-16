// Intégrales (Terminale spécialité) : 12 niveaux, de l'aire comptée en carreaux jusqu'aux défis avec e^x et ln.
// Chaque fonction de l'énoncé est aussi une vraie fonction JavaScript. Vérifications indépendantes (tests) :
//  - intégrales : `value` = intégration numérique (Simpson composite, 4000 sous-intervalles) de la fonction affichée ;
//  - primitives : `verify` dérive numériquement (différences centrées) la réponse et retrouve f en plusieurs points,
//    puis contrôle la condition F(a) = b ;
//  - carreaux : aire recomptée à partir des sommets du polygone (formule du lacet) ;
//  - rectangles : sommes recalculées directement (minimum et maximum de f sur chaque bande, par échantillonnage).
import { ri, pick, shuffle, nz, chance } from '../../engine/util/rand.js';
import { numsCheck, fracCheck, choiceCheck } from '../../engine/answers/checks.js';
import { M, P, F, big } from '../../engine/util/fmt.js';
import { red } from '../../engine/util/arith.js';
import { repere, yWin, C_F, C_G, C_POS } from './draw.js';

/* ================= outils numériques (indépendants des calculs exacts) ================= */
/** méthode de Simpson composite (n pair) ; marche aussi si a > b */
export function simpson(f, a, b, n = 4000) {
  if (a === b) return 0;
  const h = (b - a) / n; let s = f(a) + f(b);
  for (let i = 1; i < n; i++) s += (i % 2 ? 4 : 2) * f(a + i * h);
  return s * h / 3;
}
/** ∫ |f| : on coupe aux changements de signe (repérés par balayage puis dichotomie) */
export function simpsonAbs(f, a, b) {
  const N = 2000, cuts = [a]; let x0 = a, y0 = f(a);
  for (let i = 1; i <= N; i++) {
    const x1 = a + (b - a) * i / N, y1 = f(x1);
    if (y1 === 0 && i < N) cuts.push(x1);
    else if (y0 * y1 < 0) { let lo = x0, hi = x1; for (let k = 0; k < 80; k++) { const m = (lo + hi) / 2; if (f(lo) * f(m) <= 0) hi = m; else lo = m; } cuts.push((lo + hi) / 2); }
    x0 = x1; y0 = y1;
  }
  cuts.push(b);
  let s = 0; for (let i = 0; i + 1 < cuts.length; i++) s += Math.abs(simpson(f, cuts[i], cuts[i + 1]));
  return s;
}
const dnum = (G, x, h = 1e-5) => (G(x + h) - G(x - h)) / (2 * h);
/** G est-elle une primitive de f ? (dérivée numérique en plusieurs points) */
export const isPrim = (G, f, xs) => xs.every(x => Math.abs(dnum(G, x) - f(x)) < 1e-5 * (1 + Math.abs(f(x))));
const PTS = [-2.3, -1.1, -0.4, 0.7, 1.6, 2.5];
const PTS_POS = [0.6, 1.1, 1.7, 2.4, 3.2];
const near = (a, b, e = 1e-9) => Math.abs(a - b) < e;
const r6 = x => Math.round(x * 1e6) / 1e6;
const z = x => (Math.abs(x) < 1e-12 ? 0 : x);

/* ================= rationnels et polynômes (calcul exact pour énoncés et corrections) ================= */
const Q = (n, d = 1) => red(n, d);
const qadd = (a, b) => Q(a[0] * b[1] + b[0] * a[1], a[1] * b[1]);
const qsub = (a, b) => qadd(a, [-b[0], b[1]]);
const qmul = (a, b) => Q(a[0] * b[0], a[1] * b[1]);
const qdiv = (a, b) => Q(a[0] * b[1], a[1] * b[0]);
const qv = a => a[0] / a[1];
/** rationnel en HTML : entier ou fraction empilée */
const qh = a => (a[1] === 1 ? M(a[0]) : (a[0] < 0 ? '−' : '') + F(Math.abs(a[0]), a[1]));
const qP = a => (a[0] < 0 ? `(${qh(a)})` : qh(a));
const pw = k => (k === 0 ? '' : k === 1 ? 'x' : `x<sup>${k}</sup>`);
/** polynôme à coefficients entiers ou rationnels c[k] (coefficient de x^k) ; order : liste des puissances */
function ph(c, order) {
  const cq = c.map(v => (Array.isArray(v) ? v : Q(v)));
  const ks = order || [...cq.keys()].reverse();
  let s = '';
  ks.forEach(k => {
    const q = cq[k]; if (!q || q[0] === 0) return;
    const neg = q[0] < 0, n = Math.abs(q[0]);
    const co = q[1] === 1 ? (n === 1 && k > 0 ? '' : M(n)) : F(n, q[1]);
    s += (s ? (neg ? ' − ' : ' + ') : (neg ? '−' : '')) + co + pw(k);
  });
  return s || '0';
}
const pf = c => x => c.reduce((s, v, k) => s + (Array.isArray(v) ? qv(v) : v) * x ** k, 0); // vraie fonction
const prim = c => [Q(0), ...c.map((v, k) => qdiv(Array.isArray(v) ? v : Q(v), Q(k + 1)))];
const pq = (c, x) => c.reduce((s, v, k) => qadd(s, qmul(Array.isArray(v) ? v : Q(v), Q(x ** k))), Q(0)); // valeur exacte en x entier
const intQ = (c, a, b) => { const G = prim(c); return qsub(pq(G, b), pq(G, a)); };
/** « sans diviser » : Σ c_k (b^{k+1} − a^{k+1}) (erreur classique) */
const intNoDiv = (c, a, b) => c.reduce((s, v, k) => s + v * (b ** (k + 1) - a ** (k + 1)), 0);

/* ================= écriture des intégrales ================= */
const LIM = (a, b) => `<span style="display:inline-flex;flex-direction:column;vertical-align:middle;font-size:.62em;line-height:1.05;margin:0 3px 0 1px;text-align:left"><span>${b}</span><span style="margin-top:.9em">${a}</span></span>`;
/** ∫ de a à b de body dx */
const INT = (a, b, body) => `<span style="white-space:nowrap"><span style="font-size:1.6em;vertical-align:middle;font-family:'Times New Roman',serif;font-style:italic">∫</span>${LIM(a, b)}</span>${body} d<i>x</i>`;
/** [ inner ] de a à b */
const BRK = (inner, a, b) => `<span style="white-space:nowrap"><span style="font-size:1.3em">[</span>${inner}<span style="font-size:1.3em">]</span>${LIM(a, b)}</span>`;
const EX = 'e<sup>x</sup>';

/** réponse rationnelle : case simple si entier, fraction sinon ; near = [[valeur, message]] « presque juste » */
function ratQ(q, tpl, nearList = []) {
  const val = qv(q);
  const msgOf = x => { for (const [w, m] of nearList) if (near(x, w) && !near(x, val)) return m; return ''; };
  if (q[1] === 1) {
    const base = numsCheck([q[0]]);
    const fn = v => { const r = base(v); return r.ok ? r : { ...r, msg: msgOf(v[0]) }; };
    fn.expected = base.expected;
    return { type: 'nums', tpl, check: fn, note: '' };
  }
  const base = fracCheck(q[0], q[1]);
  const fn = v => { const r = base(v); if (r.ok || r.msg) return r; return { ...r, msg: msgOf(v[0] / v[1]) }; };
  fn.expected = base.expected;
  return { type: 'frac', check: fn, note: '<br><span class="note">Le résultat est une fraction : écris-la en haut et en bas (le signe − au numérateur).</span>' };
}
const ORDER = 'Tu as calculé F(a) − F(b) : c\'est l\'inverse ! On fait toujours <b>F(borne du haut) − F(borne du bas)</b>.';
const NODIV = 'Tu as oublié de diviser : une primitive de x<sup>n</sup> est x<sup>n+1</sup> ÷ (n + 1), pas x<sup>n+1</sup>.';

/** graphe d'une fonction avec le domaine sous la courbe colorié (hachuré quand f est négative) */
function areaPlot(f, a, b, o = {}) {
  const x0 = Math.min(a, 0, o.x0 ?? 0) - 1, x1 = Math.max(b, 0) + 1;
  const xr = [Math.floor(x0), Math.ceil(x1)];
  while (xr[1] - xr[0] < 6) { xr[0]--; xr[1]++; }
  let reg = 0; for (let i = 0; i <= 60; i++) reg = Math.max(reg, Math.abs(f(a + (b - a) * i / 60)));
  const yr = o.yr || yWin([f], o.dom ? Math.max(o.dom[0], xr[0]) : xr[0], xr[1], { lim: Math.max(o.lim || 12, Math.ceil(reg)), extra: o.h ? [o.h.y] : [] });
  return repere({ xr, yr, fs: [{ f, dom: o.dom, l: o.l || Cn('f') }], fill: [{ f, a, b, signed: true }], xl: o.xl || [{ x: a, l: o.la || M(a) }, { x: b, l: o.lb || M(b) }], h: o.h, pts: o.pts });
}
function Cn(n) { return `𝒞<tspan font-size="12" dy="3">${n}</tspan>`; }
/** monôme c·x^k avec un coefficient décimal éventuel */
const mono = (c, k) => (c === 1 && k ? '' : c === -1 && k ? '−' : M(c)) + pw(k);

/* ================= 1. aire en carreaux ================= */
function L1(d) {
  const np = d < 1 ? 1 : d < 2 ? 2 : d < 4 ? 3 : 4;
  const a = d < 3 ? 0 : ri(-2, 1);
  const xs = [a];
  for (let k = 0; k < np; k++) xs.push(xs[k] + (np === 1 ? ri(2, 4) : ri(1, np > 2 ? 2 : 3)));
  const ys = xs.map(() => ri(d < 3 ? 1 : 0, 5));
  if (d < 1 && chance(0.4)) ys[1] = ys[0];
  if (ys.every(y => y === 0)) ys[1] = 3;
  const b = xs[np];
  const f = x => { for (let k = 0; k < np; k++) if (x <= xs[k + 1] + 1e-12) return ys[k] + (ys[k + 1] - ys[k]) * (x - xs[k]) / (xs[k + 1] - xs[k]); return ys[np]; };
  const parts = []; let A = 0;
  for (let k = 0; k < np; k++) { const w = xs[k + 1] - xs[k], v = (ys[k] + ys[k + 1]) * w / 2; A += v; parts.push({ w, y0: ys[k], y1: ys[k + 1], v }); }
  // vérification indépendante : formule du lacet sur les sommets du polygone
  const poly = [[a, 0], ...xs.map((x, k) => [x, ys[k]]), [b, 0]];
  let sh = 0; for (let i = 0; i < poly.length; i++) { const [x1, y1] = poly[i], [x2, y2] = poly[(i + 1) % poly.length]; sh += x1 * y2 - x2 * y1; }
  const desc = p => p.y0 === p.y1 ? `rectangle ${p.w} × ${p.y0} = ${M(p.v)}` : `${Math.min(p.y0, p.y1) ? `rectangle ${p.w} × ${Math.min(p.y0, p.y1)} = ${p.w * Math.min(p.y0, p.y1)} et ` : ''}triangle ${p.w} × ${Math.abs(p.y1 - p.y0)} ÷ 2 = ${M(p.w * Math.abs(p.y1 - p.y0) / 2)}`;
  const ymax = Math.max(...ys) + 1;
  const vis = repere({ eq: true, xr: [Math.min(a, 0) - 1, Math.max(b + 1, Math.min(a, 0) + 5)], yr: [-1, Math.max(ymax, 4)], fs: [{ f, dom: [a, b], l: Cn('f') }], fill: [{ f, a, b }], xl: [{ x: a, l: M(a) }, { x: b, l: M(b) }], aria: 'domaine sous une ligne brisée sur un quadrillage' });
  return {
    type: 'nums', keys: { neg: false },
    html: `La courbe de f est une ligne brisée. Le domaine colorié est sous la courbe, au-dessus de l'axe des abscisses, entre x = ${M(a)} et x = ${M(b)}.<br>Un carreau vaut <b>1 unité d'aire</b> (u.a.). Quelle est l'aire du domaine ?`,
    tpl: 'Aire = {0} u.a.', visual: vis,
    check: numsCheck([A], { msg: v => (v[0] > A - 3 && v[0] < A + 3 ? 'Tu es tout près : recompte les morceaux de carreaux (deux demi-carreaux font un carreau).' : '') }),
    value: Math.abs(sh) / 2,
    hint: 'Découpe le domaine en bandes verticales entre deux sommets : chaque bande est un rectangle, ou un rectangle surmonté d\'un triangle. Un triangle rectangle vaut la moitié du rectangle qui l\'entoure.',
    solution: parts.map((p, k) => `Entre x = ${M(xs[k])} et x = ${M(xs[k + 1])} : ${desc(p)}.`).join('<br>') + `<br>Total : <b>${M(A)} u.a.</b> On écrit ${INT(M(a), M(b), 'f(x)')} = ${M(A)}.`,
  };
}
function C1() {
  const f = x => (x <= 2 ? 1 + x : 3);
  const g = x => (x <= 1 ? x + 1 : x <= 2 ? 2 : 6 - 2 * x);
  return `<h2>1. L'aire sous une courbe</h2>
<p class="intro">L'intégrale commence par une question simple : quelle est l'aire « sous » une courbe ? Avec une ligne brisée, tu peux la calculer en découpant le domaine en rectangles et en triangles.</p>
<div class="def">Si f est <b>positive</b> sur [a ; b], l'<b>intégrale de a à b de f</b> est l'aire du domaine compris entre la courbe, l'axe des abscisses et les droites x = a et x = b. On la note ${INT('a', 'b', 'f(x)')}.<br>Elle se mesure en <b>unités d'aire</b> (u.a.) : l'aire du carreau unité.</div>
<div class="methode"><b>Méthode</b><ol>
<li>Repère les bornes a et b, et les sommets de la ligne brisée.</li>
<li>Trace des traits verticaux sous chaque sommet : tu obtiens des bandes.</li>
<li>Chaque bande est un rectangle, un triangle, ou un rectangle surmonté d'un triangle.</li>
<li>Rectangle : base × hauteur. Triangle rectangle : base × hauteur ÷ 2.</li>
<li>Additionne les aires de toutes les bandes.</li></ol></div>
<div class="cols">
${repere({ eq: true, xr: [-1, 5], yr: [-1, 4], fs: [{ f, dom: [0, 4] }], fill: [{ f, a: 0, b: 4 }], xl: [{ x: 0, l: '0' }, { x: 4, l: '4' }], aria: 'domaine sous une ligne brisée entre 0 et 4' })}
${repere({ eq: true, xr: [-2, 4], yr: [-1, 3], fs: [{ f: g, dom: [-1, 3] }], fill: [{ f: g, a: -1, b: 3 }], xl: [{ x: -1, l: '−1' }, { x: 3, l: '3' }], aria: 'domaine sous une ligne brisée entre −1 et 3' })}
</div>
<div class="ex"><span class="q">Exemple 1 : à gauche, entre 0 et 4.</span><br>f monte de 1 à 3 sur [0 ; 2], puis reste à 3 sur [2 ; 4].<br>Sur [0 ; 2] : rectangle 2 × 1 = 2 et triangle 2 × 2 ÷ 2 = 2.<br>Sur [2 ; 4] : rectangle 2 × 3 = 6.<br>Aire = 2 + 2 + 6 = <b>10 u.a.</b>, donc ${INT('0', '4', 'f(x)')} = 10.</div>
<div class="ex"><span class="q">Exemple 2 : à droite, entre −1 et 3 (la courbe touche l'axe).</span><br>Sur [−1 ; 1] : triangle 2 × 2 ÷ 2 = 2.<br>Sur [1 ; 2] : rectangle 1 × 2 = 2.<br>Sur [2 ; 3] : triangle 1 × 2 ÷ 2 = 1.<br>Aire = 2 + 2 + 1 = <b>5 u.a.</b> Une borne négative ne change rien : on compte des carreaux.</div>
<div class="warn">⚠️ Un triangle n'est pas un rectangle : base × hauteur <b>÷ 2</b>.<br>⚠️ Ne compte que la partie entre x = a et x = b.<br>⚠️ Deux demi-carreaux font un carreau : si tu trouves presque le bon nombre, recompte les morceaux.</div>
<div class="retenir">À retenir : si f ≥ 0, ${INT('a', 'b', 'f(x)')} est l'aire sous la courbe, en unités d'aire.</div>`;
}

/* ================= 2. méthode des rectangles ================= */
const RECT = [
  [{ f: x => x * x, h: 'x<sup>2</sup>', a: 0, b: 3, n: 3 }, { f: x => x * x, h: 'x<sup>2</sup>', a: 0, b: 4, n: 4 }, { f: x => x * x, h: 'x<sup>2</sup>', a: 1, b: 3, n: 2 }, { f: x => 2 * x, h: '2x', a: 0, b: 3, n: 3 }],
  [{ f: x => x * x + 1, h: 'x<sup>2</sup> + 1', a: 0, b: 3, n: 3 }, { f: x => x * x / 2, h: F(1, 2) + 'x<sup>2</sup>', a: 0, b: 4, n: 4 }, { f: x => 2 * x * x, h: '2x<sup>2</sup>', a: 0, b: 3, n: 3 }],
  [{ f: x => 9 - x * x, h: '9 − x<sup>2</sup>', a: 0, b: 3, n: 3 }, { f: x => 12 / x, h: F(12, 'x'), a: 1, b: 4, n: 3 }, { f: x => 16 - x * x, h: '16 − x<sup>2</sup>', a: 0, b: 4, n: 4 }],
  [{ f: x => x * x, h: 'x<sup>2</sup>', a: 0, b: 2, n: 4 }, { f: x => 4 - x * x, h: '4 − x<sup>2</sup>', a: 0, b: 2, n: 4 }, { f: x => x * x, h: 'x<sup>2</sup>', a: 1, b: 3, n: 4 }],
  [{ f: x => 6 / x, h: F(6, 'x'), a: 1, b: 3, n: 4 }, { f: x => 12 / x, h: F(12, 'x'), a: 2, b: 6, n: 4 }, { f: x => x * x / 2, h: F(1, 2) + 'x<sup>2</sup>', a: 0, b: 2, n: 4 }],
];
function L2(d) {
  const pool = d < 1 ? RECT[0] : d < 2 ? [...RECT[0], ...RECT[1]] : d < 3 ? RECT[2] : d < 4 ? RECT[3] : [...RECT[2], ...RECT[3], ...RECT[4]];
  const c = pick(pool), { f, a, b, n } = c, h = (b - a) / n, up = f(b) > f(a);
  const xs = [...Array(n + 1).keys()].map(i => a + i * h);
  const vals = xs.map(f);
  const lo = [], hi = [];
  for (let i = 0; i < n; i++) { lo.push(up ? vals[i] : vals[i + 1]); hi.push(up ? vals[i + 1] : vals[i]); }
  const s = r6(h * lo.reduce((p, q) => p + q, 0)), S = r6(h * hi.reduce((p, q) => p + q, 0));
  const base = numsCheck([s, S]);
  const check = v => {
    const r = base(v); if (r.ok) return r;
    if (near(v[0], S) && near(v[1], s)) return { ...r, msg: 'Tu as inversé : s (rectangles <b>sous</b> la courbe) est la plus petite des deux sommes.' };
    if (near(v[0], s) || near(v[1], S)) return { ...r, msg: 'Une des deux sommes est juste. Vérifie l\'autre, bande par bande.' };
    if (h !== 1 && (near(v[0], s / h) || near(v[1], S / h))) return { ...r, msg: `N'oublie pas de multiplier chaque hauteur par la largeur ${M(h)}.` };
    return r;
  };
  check.expected = base.expected;
  const rects = []; for (let i = 0; i < n; i++) { rects.push({ x: xs[i], w: h, h: lo[i], k: 'lo' }); rects.push({ x: xs[i], w: h, h: hi[i], k: 'up' }); }
  const xr = [Math.min(0, a) - 1, b + 1], yr = yWin([f], a, b, { lim: 20 });
  const vis = repere({ xr, yr, fs: [{ f, dom: [Math.max(xr[0], c.h.includes('x</span>') ? 0.4 : xr[0]), xr[1]], l: 'y = f(x)' }], rects, xl: [{ x: a, l: M(a) }, { x: b, l: M(b) }] });
  const hs = (arr, k) => arr.map((v, i) => `f(${M(xs[up === (k === 'lo') ? i : i + 1])})`).join(' + ');
  return {
    type: 'nums', keys: { neg: false }, visual: vis,
    html: `f(x) = ${c.h} est ${up ? 'croissante' : 'décroissante'} sur [${M(a)} ; ${M(b)}]. On découpe [${M(a)} ; ${M(b)}] en ${n} bandes de largeur ${M(h)}.<br>Calcule la somme s des rectangles <b>verts</b> (sous la courbe) et la somme S des rectangles <b>orange</b> (au-dessus). On aura s ≤ ${INT(M(a), M(b), 'f(x)')} ≤ S.`,
    tpl: 's = {0} &nbsp;&nbsp; S = {1}', check,
    verify: E => {
      // recalcul direct : minimum et maximum de f sur chaque bande, par échantillonnage
      let smin = 0, smax = 0;
      for (let i = 0; i < n; i++) { let mn = Infinity, mx = -Infinity; for (let j = 0; j <= 400; j++) { const y = f(a + i * h + h * j / 400); mn = Math.min(mn, y); mx = Math.max(mx, y); } smin += mn * h; smax += mx * h; }
      const I = simpson(f, a, b);
      return near(E[0], smin, 1e-6) && near(E[1], smax, 1e-6) && smin <= I + 1e-9 && I <= smax + 1e-9;
    },
    hint: `Chaque rectangle a pour largeur ${M(h)}. ${up ? 'f est croissante : le rectangle sous la courbe prend la hauteur à <b>gauche</b> de la bande, celui au-dessus la hauteur à <b>droite</b>.' : 'f est décroissante : le rectangle sous la courbe prend la hauteur à <b>droite</b> de la bande, celui au-dessus la hauteur à <b>gauche</b>.'}`,
    solution: `Valeurs : ${xs.map((x, i) => `f(${M(x)}) = ${M(r6(vals[i]))}`).join(' ; ')}.<br>s = ${M(h)} × (${hs(lo, 'lo')}) = ${M(h)} × ${M(r6(s / h))} = <b>${M(s)}</b><br>S = ${M(h)} × (${hs(hi, 'up')}) = ${M(h)} × ${M(r6(S / h))} = <b>${M(S)}</b><br>Donc ${M(s)} ≤ ${INT(M(a), M(b), 'f(x)')} ≤ ${M(S)}.`,
  };
}
function C2() {
  const f = x => x * x;
  const rects = []; for (let i = 0; i < 4; i++) { rects.push({ x: i / 2, w: .5, h: (i / 2) ** 2, k: 'lo' }); rects.push({ x: i / 2, w: .5, h: ((i + 1) / 2) ** 2, k: 'up' }); }
  const g = x => 12 / x;
  const rects2 = []; for (let i = 1; i < 4; i++) { rects2.push({ x: i, w: 1, h: g(i + 1), k: 'lo' }); rects2.push({ x: i, w: 1, h: g(i), k: 'up' }); }
  return `<h2>2. Encadrer une aire par des rectangles</h2>
<p class="intro">Quand on ne sait pas calculer une aire exactement, on la coince entre deux sommes de rectangles : une trop petite, une trop grande.</p>
<div class="def">On découpe [a ; b] en n bandes de même largeur <b>h = (b − a) ÷ n</b>. Sur chaque bande, un rectangle <b>sous</b> la courbe (en vert) et un rectangle <b>au-dessus</b> (en orange).<br>Leurs sommes s et S encadrent l'intégrale : <b>s ≤ ${INT('a', 'b', 'f(x)')} ≤ S</b>. Plus n est grand, plus l'encadrement est fin.</div>
<div class="methode"><b>Méthode</b><ol>
<li>Calcule la largeur h = (b − a) ÷ n.</li>
<li>Calcule f aux bornes de chaque bande : f(a), f(a + h), …, f(b).</li>
<li>f <b>croissante</b> : le rectangle sous la courbe prend la hauteur de <b>gauche</b>, celui au-dessus la hauteur de <b>droite</b>. f <b>décroissante</b> : c'est l'inverse.</li>
<li>s = h × (somme des petites hauteurs) ; S = h × (somme des grandes hauteurs).</li></ol></div>
<div class="cols">
${repere({ xr: [-1, 3], yr: [-1, 5], fs: [{ f, l: 'y = x²' }], rects, xl: [{ x: 0, l: '0' }, { x: 2, l: '2' }], aria: 'rectangles sous et sur la courbe de x²' })}
${repere({ xr: [-1, 5], yr: [-2, 14], fs: [{ f: g, dom: [0.8, 5] }], rects: rects2, xl: [{ x: 1, l: '1' }, { x: 4, l: '4' }], aria: 'rectangles sous et sur la courbe de 12/x' })}
</div>
<div class="ex"><span class="q">Exemple 1 : f(x) = x<sup>2</sup> sur [0 ; 2], 4 bandes (f croissante).</span><br>h = (2 − 0) ÷ 4 = 0,5.<br>s = 0,5 × (f(0) + f(0,5) + f(1) + f(1,5)) = 0,5 × 3,5 = <b>1,75</b><br>S = 0,5 × (f(0,5) + f(1) + f(1,5) + f(2)) = 0,5 × 7,5 = <b>3,75</b></div>
<div class="ex"><span class="q">Exemple 2 : f(x) = ${F(12, 'x')} sur [1 ; 4], 3 bandes (f décroissante).</span><br>h = 1. Valeurs : f(1) = 12 ; f(2) = 6 ; f(3) = 4 ; f(4) = 3.<br>Petits rectangles (hauteur de droite) : s = 1 × (6 + 4 + 3) = <b>13</b>.<br>Grands rectangles (hauteur de gauche) : S = 1 × (12 + 6 + 4) = <b>22</b>.<br>Donc 13 ≤ ${INT('1', '4', F(12, 'x'))} ≤ 22.</div>
<div class="warn">⚠️ s est toujours la <b>plus petite</b> des deux sommes : ne les inverse pas.<br>⚠️ Si f est <b>décroissante</b>, le petit rectangle prend la valeur de droite.<br>⚠️ N'oublie pas de multiplier par la largeur h (surtout quand h = 0,5).</div>
<div class="retenir">À retenir : s ≤ ${INT('a', 'b', 'f(x)')} ≤ S, avec des rectangles de largeur h = (b − a) ÷ n.</div>`;
}

/* ================= 3. vérifier une primitive ================= */
const BANK = [
  { f: `(x + 1)${EX}`, fn: x => (x + 1) * Math.exp(x), ok: [`x${EX}`, x => x * Math.exp(x)], bad: [[`(x + 2)${EX}`, x => (x + 2) * Math.exp(x)], [`(x + 1)${EX}`, x => (x + 1) * Math.exp(x)], [`${F(1, 2)}x<sup>2</sup>${EX}`, x => x * x / 2 * Math.exp(x)]], xr: [-3, 1.5] },
  { f: '2x e<sup>x<sup>2</sup></sup>', fn: x => 2 * x * Math.exp(x * x), ok: ['e<sup>x<sup>2</sup></sup>', x => Math.exp(x * x)], bad: [['x<sup>2</sup>e<sup>x<sup>2</sup></sup>', x => x * x * Math.exp(x * x)], ['2e<sup>x<sup>2</sup></sup>', x => 2 * Math.exp(x * x)], ['2x e<sup>x<sup>2</sup></sup>', x => 2 * x * Math.exp(x * x)]], xr: [-1.5, 1.5] },
  { f: 'e<sup>2x</sup>', fn: x => Math.exp(2 * x), ok: [`${F(1, 2)}e<sup>2x</sup>`, x => Math.exp(2 * x) / 2], bad: [['e<sup>2x</sup>', x => Math.exp(2 * x)], ['2e<sup>2x</sup>', x => 2 * Math.exp(2 * x)], ['e<sup>x<sup>2</sup></sup>', x => Math.exp(x * x)]], xr: [-3, 1] },
  { f: 'ln x + 1', fn: x => Math.log(x) + 1, ok: ['x ln x', x => x * Math.log(x)], bad: [[F(1, 'x'), x => 1 / x], ['x ln x − x', x => x * Math.log(x) - x], ['ln x + x', x => Math.log(x) + x]], xr: [0, 4], pos: true },
  { f: 'ln x', fn: x => Math.log(x), ok: ['x ln x − x', x => x * Math.log(x) - x], bad: [[F(1, 'x'), x => 1 / x], ['x ln x', x => x * Math.log(x)], ['x ln x + x', x => x * Math.log(x) + x]], xr: [0, 4], pos: true },
  { f: `${F(1, 'x')} + 2x`, fn: x => 1 / x + 2 * x, ok: ['ln x + x<sup>2</sup>', x => Math.log(x) + x * x], bad: [[`−${F(1, 'x<sup>2</sup>')} + 2`, x => -1 / (x * x) + 2], ['ln x + 2x<sup>2</sup>', x => Math.log(x) + 2 * x * x], [`${F(1, 'x<sup>2</sup>')} + x<sup>2</sup>`, x => 1 / (x * x) + x * x]], xr: [0, 4], pos: true },
  { f: '(1 − x)e<sup>−x</sup>', fn: x => (1 - x) * Math.exp(-x), ok: ['x e<sup>−x</sup>', x => x * Math.exp(-x)], bad: [['−x e<sup>−x</sup>', x => -x * Math.exp(-x)], ['(x − 1)e<sup>−x</sup>', x => (x - 1) * Math.exp(-x)], ['(1 − x)e<sup>−x</sup>', x => (1 - x) * Math.exp(-x)]], xr: [-1, 5] },
];
/** polynômes : f = 3a x² + 2b x + c, F = a x³ + b x² + c x + k, et trois erreurs typiques */
function polyPrimCase(d) {
  const A = d < 1 ? ri(0, 2) : nz(-3, 3), B = d < 1 ? ri(1, 4) : nz(-4, 4), Cc = ri(-5, 5), k = ri(-6, 6);
  const f = [Cc, 2 * B, 3 * A], G = [k, Cc, B, A];
  const wrong = [
    [[0, 2 * B, 6 * A], 'dérivée de f'],
    [[k, Cc, 2 * B, 3 * A], 'sans diviser'],
    [[k, Cc, -B, A], 'signe'],
    [[k, 2 * B, B, A], 'mauvais'],
  ].filter(([w]) => JSON.stringify(w.slice(1)) !== JSON.stringify(G.slice(1)));
  return { f, G, wrong };
}
function L3(d) {
  const PROP = c => ({ html: ph(c), fn: pf(c) });
  if (d < 1) {
    const { f, G, wrong } = polyPrimCase(d);
    const good = chance(0.5), cand = [...(good ? G : pick(wrong)[0]), 0, 0, 0].slice(0, 4);
    const E = good ? 'oui' : 'non';
    const ff = pf(f), Gf = pf(cand);
    return {
      type: 'choice', opts: [{ v: 'oui', l: 'Oui, F′(x) = f(x)' }, { v: 'non', l: 'Non, F′(x) ≠ f(x)' }],
      html: `f(x) = ${ph(f)} et F(x) = ${ph(cand)}.<br>F est-elle une primitive de f sur ℝ ?`,
      check: choiceCheck(E, { msg: () => 'Dérive F terme à terme et compare avec f.' }),
      verify: e => (e === 'oui') === isPrim(Gf, ff, PTS),
      afterVisual: repere({ xr: [-3, 3], yr: yWin([ff, Gf], -3, 3, { lim: 9 }), fs: [{ f: ff, l: 'y = f(x)' }, { f: Gf, c: C_G, l: 'y = F(x)', dash: true }] }),
      hint: 'F est une primitive de f quand <b>F′ = f</b>. Dérive F : (x<sup>3</sup>)′ = 3x<sup>2</sup>, (x<sup>2</sup>)′ = 2x, (x)′ = 1, et la constante disparaît.',
      solution: `F′(x) = ${ph([cand[1], 2 * cand[2], 3 * cand[3]])}${good ? ` = f(x) : <b>oui</b>, F est une primitive de f.` : ` ≠ f(x) = ${ph(f)} : <b>non</b>.`}`,
    };
  }
  let ff, html, opts, xr, pts;
  if (d >= 2 && chance(0.6)) {
    const it = pick(BANK);
    ff = it.fn; pts = it.pos ? PTS_POS : PTS.filter(x => x > it.xr[0] && x < it.xr[1] - 0.2);
    opts = shuffle([{ html: it.ok[0], fn: it.ok[1] }, ...shuffle(it.bad.map(([h, fn]) => ({ html: h, fn }))).slice(0, 2)]);
    html = `f(x) = ${it.f}${it.pos ? ' sur ]0 ; +∞[' : ''}. Laquelle de ces fonctions est une primitive de f ?`;
    xr = it.xr;
  } else {
    const { f, G, wrong } = polyPrimCase(d);
    ff = pf(f); pts = PTS;
    opts = shuffle([PROP(G), ...shuffle(wrong.map(([w]) => PROP(w))).slice(0, 2)]);
    html = `f(x) = ${ph(f)}. Laquelle de ces fonctions est une primitive de f sur ℝ ?`;
    xr = [-3, 3];
  }
  const ok = opts.findIndex(o => isPrim(o.fn, ff, pts));
  const E = String(ok);
  const vpos = xr[0] >= 0 ? [0.05, xr[1]] : undefined;
  return {
    type: 'choice', opts: opts.map((o, i) => ({ v: String(i), l: `F(x) = ${o.html}` })), html,
    check: choiceCheck(E, { msg: () => 'Dérive cette proposition : retrouves-tu exactement f(x) ?' }),
    verify: e => opts.filter(o => isPrim(o.fn, ff, pts)).length === 1 && isPrim(opts[+e].fn, ff, pts),
    afterVisual: repere({ xr: [Math.floor(xr[0]), Math.ceil(xr[1])], yr: yWin([ff, opts[ok].fn], Math.max(xr[0], 0.15 * (vpos ? 1 : -99)), xr[1], { lim: 8 }), fs: [{ f: ff, dom: vpos, l: 'y = f(x)' }, { f: opts[ok].fn, dom: vpos, c: C_G, l: 'y = F(x)', dash: true }] }),
    hint: 'Ne cherche pas la primitive : <b>dérive chaque proposition</b> et garde celle dont la dérivée est f. Rappels : (e<sup>u</sup>)′ = u′e<sup>u</sup>, (uv)′ = u′v + uv′, (ln x)′ = 1/x.',
    solution: `F(x) = ${opts[ok].html} : en dérivant, on retrouve f(x). <b>C'est la proposition ${ok + 1}</b>. Les autres ont une dérivée différente de f.`,
  };
}
function C3() {
  const f = x => 2 * x, G = x => x * x - 1;
  return `<h2>3. Qu'est-ce qu'une primitive ?</h2>
<p class="intro">Pour calculer des intégrales, on aura besoin de faire « la dérivation à l'envers » : c'est la primitive. Ici, tu apprends d'abord à <b>reconnaître</b> une primitive.</p>
<div class="def">F est une <b>primitive</b> de f sur un intervalle I quand F est dérivable sur I et <b>F′(x) = f(x)</b> pour tout x de I.<br>Pour vérifier, on <b>dérive</b> F et on compare avec f.</div>
<div class="methode"><b>Méthode</b><ol>
<li>Ne cherche pas la primitive toi-même : <b>dérive</b> la fonction F proposée.</li>
<li>Polynôme : (x<sup>3</sup>)′ = 3x<sup>2</sup>, (x<sup>2</sup>)′ = 2x, (x)′ = 1, la constante disparaît.</li>
<li>Autres formules : (uv)′ = u′v + uv′ ; (e<sup>u</sup>)′ = u′e<sup>u</sup> ; (ln x)′ = ${F(1, 'x')}.</li>
<li>Compare F′(x) avec f(x) : il faut l'égalité <b>exacte</b>, pour tout x.</li>
<li>Avec plusieurs propositions : dérive-les une par une, une seule convient.</li></ol></div>
<div class="ex"><span class="q">Exemple 1 : f(x) = 6x<sup>2</sup> + 2x − 1.</span><br>F(x) = 2x<sup>3</sup> + x<sup>2</sup> − x + 5 : F′(x) = 6x<sup>2</sup> + 2x − 1 = f(x). <b>Oui</b>, c'est une primitive.<br>G(x) = 6x<sup>3</sup> + 2x<sup>2</sup> − x : G′(x) = 18x<sup>2</sup> + 4x − 1 ≠ f(x). <b>Non</b> (on a oublié de diviser).</div>
<div class="ex"><span class="q">Exemple 2 : f(x) = ln x sur ]0 ; +∞[. Laquelle : x ln x ou x ln x − x ?</span><br>(x ln x)′ = 1 × ln x + x × ${F(1, 'x')} = ln x + 1 ≠ f(x).<br>(x ln x − x)′ = ln x + 1 − 1 = ln x = f(x). ✔ C'est <b>x ln x − x</b>.<br>De même, (x e<sup>x</sup>)′ = e<sup>x</sup> + x e<sup>x</sup> = (x + 1)e<sup>x</sup>.</div>
<div class="cols">
<div><p>F(x) = x<sup>2</sup> − 1 (en vert, pointillés) : en chaque point, sa pente vaut f(x) = 2x (en bleu). Là où f &lt; 0, F descend ; là où f &gt; 0, F monte.</p></div>
${repere({ xr: [-3, 3], yr: [-5, 6], fs: [{ f, l: 'y = f(x)' }, { f: G, c: C_G, l: 'y = F(x)', dash: true }], aria: 'une fonction et une de ses primitives' })}
</div>
<div class="warn">⚠️ Ne confonds pas : la <b>dérivée</b> de f n'est pas une primitive de f.<br>⚠️ Une fonction a une infinité de primitives : F(x) + 5, F(x) − 2… ont la même dérivée.<br>⚠️ Une proposition égale à f elle-même n'est en général pas la bonne : sa dérivée n'est pas f. Seule exception à connaître : e<sup>x</sup>, qui est sa propre dérivée.</div>
<div class="retenir">À retenir : F est une primitive de f quand F′ = f ; pour le vérifier, on dérive F.</div>`;
}

/* ================= 4. primitives usuelles ================= */
const BASES = {
  inv: { h: k => `${k < 0 ? '−' : ''}${F(Math.abs(k), 'x')}`, f: k => x => k / x },
  inv2: { h: k => `${k < 0 ? '−' : ''}${F(Math.abs(k), 'x<sup>2</sup>')}`, f: k => x => k / (x * x) },
  inv3: { h: k => `${k < 0 ? '−' : ''}${F(Math.abs(k), 'x<sup>3</sup>')}`, f: k => x => k / x ** 3 },
  ln: { h: k => `${k === 1 ? '' : k === -1 ? '−' : M(k) + ' '}ln x`, f: k => x => k * Math.log(x) },
  exp: { h: k => `${k === 1 ? '' : k === -1 ? '−' : M(k)}${EX}`, f: k => x => k * Math.exp(x) },
  sqrt: { h: k => `${k === 1 ? '' : k === -1 ? '−' : M(k)}√x`, f: k => x => k * Math.sqrt(x) },
  isqrt: { h: k => `${k < 0 ? '−' : ''}${F(Math.abs(k), '√x')}`, f: k => x => k / Math.sqrt(x) },
  xln: { h: k => `${k === 1 ? '' : k === -1 ? '−' : M(k)}x ln x`, f: k => x => k * x * Math.log(x) },
  xexp: { h: k => `${k === 1 ? '' : k === -1 ? '−' : M(k)}x${EX}`, f: k => x => k * x * Math.exp(x) },
};
// f = base(k) → primitive base(c·k)
const USUELLES = [['inv2', 'inv', -1], ['inv', 'ln', 1], ['exp', 'exp', 1], ['isqrt', 'sqrt', 2]];
function L4(d) {
  if (d < 2 || (d < 4 && chance(0.4))) {
    const n = ri(1, d < 1 ? 3 : 4);
    let k = (n + 1) * (d < 1 ? 1 : ri(1, 4)) * (d >= 3 && chance(0.5) ? -1 : 1);
    if (d >= 4 && chance(0.4)) k = 1 * (n === 2 ? 3 : 1); // x ou x³ → coefficient 0,5 ou 0,25
    const a = r6(k / (n + 1)), p = n + 1, fn = x => k * x ** n;
    const base = numsCheck([a, p]);
    const check = v => {
      const r = base(v); if (r.ok) return r;
      if (near(v[1], p) && near(v[0], k)) return { ...r, msg: NODIV.replace('pas x<sup>n+1</sup>', `donc ici on divise ${M(k)} par ${p}`) };
      if (near(v[1], n)) return { ...r, msg: 'L\'exposant doit <b>augmenter</b> de 1 : on cherche une fonction dont la dérivée est f.' };
      if (near(v[1], n - 1) && near(v[0], k * n)) return { ...r, msg: 'Tu as dérivé f ! On cherche au contraire F telle que F′ = f.' };
      if (near(v[1], p) && near(v[0], -a)) return { ...r, msg: 'Attention au signe du coefficient.' };
      return r;
    };
    check.expected = base.expected;
    const fh = ph(Object.assign(Array(n + 1).fill(0), { [n]: k }));
    return {
      type: 'nums', html: `Trouve une primitive de f(x) = ${fh} sur ℝ, sous la forme F(x) = a x<sup>p</sup>.`,
      tpl: 'a = {0} &nbsp;&nbsp; p = {1}', check, labels: ['coefficient a', 'exposant p'],
      verify: E => isPrim(x => E[0] * x ** E[1], fn, PTS),
      afterVisual: repere({ xr: [-3, 3], yr: yWin([fn, x => a * x ** p], -2.5, 2.5, { lim: 8 }), fs: [{ f: fn, l: 'y = f(x)' }, { f: x => a * x ** p, c: C_G, l: 'y = F(x)', dash: true }] }),
      hint: `Une primitive de x<sup>n</sup> est ${F('x<sup>n+1</sup>', 'n + 1')} : l'exposant augmente de 1 et on <b>divise</b> par le nouvel exposant. Le coefficient ${M(k)} reste devant.`,
      solution: `Ici n = ${n} : F(x) = ${M(k)} × ${F(`x<sup>${p}</sup>`, p)} = <b>${mono(a, p)}</b> (a = ${M(a)}, p = ${p}). Vérification : F′(x) = ${M(a)} × ${p}x${n > 1 ? `<sup>${n}</sup>` : ''} = f(x).`,
    };
  }
  const [bf, bF, c] = pick(USUELLES);
  const k = d < 3 ? 1 : pick([2, 3, -1, -2, 5]);
  const fn = BASES[bf].f(k), fh = BASES[bf].h(k);
  const good = { html: BASES[bF].h(c * k), fn: BASES[bF].f(c * k) };
  let cands = [];
  for (const nm of Object.keys(BASES)) for (const kk of new Set([k, -k, 2 * k, c * k])) cands.push({ nm, html: BASES[nm].h(kk), fn: BASES[nm].f(kk) });
  cands = cands.filter(o => o.html !== good.html && !isPrim(o.fn, fn, PTS_POS));
  // distracteurs proches d'abord : même famille que f ou que F (f elle-même, mauvais signe, dérivée…)
  const close = shuffle(cands.filter(o => o.nm === bf || o.nm === bF)).slice(0, 2);
  const opts = shuffle([good, ...[...close, ...shuffle(cands)].filter((o, i, A) => A.findIndex(p => p.html === o.html) === i).slice(0, 3)]);
  const ok = opts.indexOf(good);
  const TIP = { inv2: `une primitive de ${F(1, 'x<sup>2</sup>')} est −${F(1, 'x')}`, inv: `une primitive de ${F(1, 'x')} est ln x (sur ]0 ; +∞[)`, exp: `une primitive de ${EX} est ${EX}`, isqrt: `une primitive de ${F(1, '√x')} est 2√x` }[bf];
  return {
    type: 'choice', opts: opts.map((o, i) => ({ v: String(i), l: `F(x) = ${o.html}` })),
    html: `Sur ]0 ; +∞[, f(x) = ${fh}. Laquelle est une primitive de f ?`,
    check: choiceCheck(String(ok), { msg: c2 => (opts[+c2].html.includes(fh) ? 'C\'est f elle-même : sa dérivée n\'est pas f.' : 'Dérive ta proposition pour vérifier : on doit retrouver f(x).') }),
    verify: e => opts.filter(o => isPrim(o.fn, fn, PTS_POS)).length === 1 && isPrim(opts[+e].fn, fn, PTS_POS),
    afterVisual: repere({ xr: [-1, 5], yr: yWin([fn, good.fn], 0.3, 5, { lim: 7 }), fs: [{ f: fn, dom: [0.05, 5], l: 'y = f(x)' }, { f: good.fn, dom: [0.02, 5], c: C_G, l: 'y = F(x)', dash: true }] }),
    hint: `Retiens le tableau des primitives usuelles : ${TIP}. Un coefficient devant f reste devant F.`,
    solution: `${TIP[0].toUpperCase() + TIP.slice(1)}. Donc F(x) = <b>${good.html}</b> (proposition ${ok + 1}). Vérification : F′(x) = ${fh} = f(x).`,
  };
}
function C4() {
  return `<h2>4. Primitives usuelles</h2>
<p class="intro">Comme pour les dérivées, il y a un petit tableau à connaître par cœur. Avec lui, tu trouves directement une primitive des fonctions de référence.</p>
<div class="def"><table class="st" style="margin:auto"><tr><td><b>f(x)</b></td><td><b>une primitive F(x)</b></td><td><b>sur</b></td></tr>
<tr><td>k (constante)</td><td>kx</td><td>ℝ</td></tr>
<tr><td>x<sup>n</sup> (n ≥ 1)</td><td>${F('x<sup>n+1</sup>', 'n + 1')}</td><td>ℝ</td></tr>
<tr><td>${F(1, 'x<sup>2</sup>')}</td><td>−${F(1, 'x')}</td><td>]0 ; +∞[</td></tr>
<tr><td>${F(1, '√x')}</td><td>2√x</td><td>]0 ; +∞[</td></tr>
<tr><td>${F(1, 'x')}</td><td>ln x</td><td>]0 ; +∞[</td></tr>
<tr><td>${EX}</td><td>${EX}</td><td>ℝ</td></tr></table>Un coefficient devant f reste devant F : une primitive de k × f est k × F.</div>
<div class="methode"><b>Méthode</b><ol>
<li>Repère la forme de f : k x<sup>n</sup>, ${F('k', 'x')}, ${F('k', 'x<sup>2</sup>')}, ${F('k', '√x')} ou k e<sup>x</sup>.</li>
<li>Pour k x<sup>n</sup> : l'exposant <b>monte</b> de 1 (p = n + 1), et on <b>divise</b> k par ce nouvel exposant (a = k ÷ p).</li>
<li>Pour les autres : lis la ligne du tableau et garde le coefficient k devant.</li>
<li>Vérifie en dérivant : tu dois retrouver f(x).</li></ol></div>
<div class="ex"><span class="q">Exemple 1 : f(x) = 12x<sup>3</sup>, puis f(x) = x.</span><br>12x<sup>3</sup> : p = 4 et a = 12 ÷ 4 = 3, donc F(x) = <b>3x<sup>4</sup></b>. Vérification : (3x<sup>4</sup>)′ = 12x<sup>3</sup>. ✔<br>x : p = 2 et a = 1 ÷ 2 = 0,5, donc F(x) = <b>0,5x<sup>2</sup></b>.</div>
<div class="ex"><span class="q">Exemple 2 : sur ]0 ; +∞[, f(x) = −${F(3, 'x')}, puis f(x) = ${F(4, '√x')}.</span><br>−3 × ${F(1, 'x')} : F(x) = <b>−3 ln x</b>.<br>4 × ${F(1, '√x')} : F(x) = 4 × 2√x = <b>8√x</b>.<br>Et pour ${F(5, 'x<sup>2</sup>')} : F(x) = 5 × (−${F(1, 'x')}) = −${F(5, 'x')}.</div>
<div class="cols">
<div><p>La courbe de ln x (en vert) monte, avec une pente égale à ${F(1, 'x')} (en bleu) : forte près de 0, faible ensuite. C'est bien (ln x)′ = ${F(1, 'x')}.</p></div>
${repere({ xr: [-1, 5], yr: [-3, 4], fs: [{ f: x => 1 / x, dom: [0.2, 5], l: 'y = 1/x' }, { f: Math.log, dom: [0.05, 5], c: C_G, l: 'y = ln x', dash: true }], aria: 'courbes de 1/x et de ln x' })}
</div>
<div class="warn">⚠️ Une primitive de x<sup>n</sup> n'est pas x<sup>n+1</sup> : il faut <b>diviser par n + 1</b>.<br>⚠️ Ne dérive pas ! En primitivant, l'exposant <b>monte</b> (la dérivée nx<sup>n−1</sup> le fait descendre).<br>⚠️ Attention au signe du coefficient, et au signe « − » de −${F(1, 'x')}.</div>
<div class="retenir">À retenir : x<sup>n</sup> a pour primitive ${F('x<sup>n+1</sup>', 'n + 1')} ; ${F(1, 'x')} a pour primitive ln x ; e<sup>x</sup> a pour primitive e<sup>x</sup>.</div>`;
}

/* ================= 5. primitives de polynômes ================= */
function L5(d) {
  const D = d < 1 ? 1 : d < 3 ? 2 : 3;                    // degré de f
  const A = [0]; for (let j = 1; j <= D + 1; j++) A.push(d < 2 ? ri(0, 4) : ri(-4, 4)); // coefficients de F
  if (A[D + 1] === 0) A[D + 1] = d < 2 ? ri(1, 3) : nz(-3, 3);
  if (A.slice(1, D + 1).every(v => v === 0)) A[1] = d < 2 ? ri(1, 5) : nz(-5, 5);
  if (d >= 4 && chance(0.6)) A[2] = pick([-2.5, -1.5, -0.5, 0.5, 1.5, 2.5]); // f a un terme en x impair : F a un coefficient décimal
  const f = A.slice(1).map((v, k) => z((k + 1) * v));    // f_k = (k+1) A_{k+1}
  const fn = pf(f);
  const order = d >= 3 ? shuffle([...f.keys()]) : undefined;
  const E = []; for (let j = D + 1; j >= 1; j--) E.push(A[j]);
  const tpl = 'F(x) = ' + [...Array(D + 1).keys()].map(i => `{${i}} ${pw(D + 1 - i)}`).join(' + ') + ' + C';
  const fAligned = []; for (let j = D + 1; j >= 1; j--) fAligned.push(f[j - 1]); // f non divisé, rangé comme E
  const base = numsCheck(E);
  const check = v => {
    const r = base(v); if (r.ok) return r;
    if (v.every((x, i) => near(x, fAligned[i]))) return { ...r, msg: NODIV };
    const bad = r.bad.map(i => pw(D + 1 - i)).join(', ');
    return { ...r, msg: `Revois le coefficient de ${bad} : dérive ta réponse, tu dois retrouver f.` };
  };
  check.expected = base.expected;
  const G = pf(A);
  return {
    type: 'nums', html: `Trouve une primitive F de${big(`f(x) = ${ph(f, order)}`)}<span class="note">Écris 0 si un terme manque. La constante C peut être choisie nulle.</span>`,
    tpl, check,
    verify: Ev => isPrim(x => Ev.reduce((s, c, i) => s + c * x ** (D + 1 - i), 0), fn, PTS),
    afterVisual: repere({ xr: [-3, 3], yr: yWin([fn, G], -2.6, 2.6, { lim: 9 }), fs: [{ f: fn, l: 'y = f(x)' }, { f: G, c: C_G, l: 'y = F(x)', dash: true }] }),
    hint: 'Primitive <b>terme à terme</b> : a x<sup>n</sup> devient a × x<sup>n+1</sup> ÷ (n + 1). Un nombre seul k devient kx.',
    solution: f.map((c, k) => (c ? `${mono(c, k)} → ${mono(z(c / (k + 1)), k + 1)}` : '')).filter(Boolean).reverse().join(' ; ') + `<br>F(x) = <b>${A.map((c, k) => [c, k]).filter(([c]) => c).reverse().map(([c, k], i) => (i ? (c < 0 ? ' − ' : ' + ') + mono(Math.abs(c), k) : mono(c, k))).join('')} + C</b>. Vérification : F′(x) = f(x).`,
  };
}
function C5() {
  return `<h2>5. Primitives d'un polynôme</h2>
<p class="intro">Un polynôme est une somme de termes a x<sup>n</sup>. Bonne nouvelle : on primitive chaque terme séparément, avec la règle du niveau 4.</p>
<div class="def">Une primitive d'une somme est la somme des primitives, et un coefficient reste devant : on primitive <b>terme à terme</b>.<br>a x<sup>n</sup> → a × ${F('x<sup>n+1</sup>', 'n + 1')} ; un nombre seul k → kx.<br>Toutes les primitives de f s'écrivent <b>F(x) + C</b>, où C est une constante.</div>
<div class="methode"><b>Méthode</b><ol>
<li>Range les termes de f par puissances décroissantes (l'énoncé peut les mélanger).</li>
<li>Pour chaque terme : exposant + 1, puis divise le coefficient par ce nouvel exposant.</li>
<li>Dans les cases, écris le coefficient de chaque puissance de F ; écris <b>0</b> si un terme manque.</li>
<li>Un coefficient peut être décimal : 5x → 5 × ${F('x<sup>2</sup>', 2)} = 2,5x<sup>2</sup>.</li>
<li>Vérifie en dérivant F : tu dois retrouver f.</li></ol></div>
<div class="ex"><span class="q">Exemple 1 : f(x) = 6x<sup>2</sup> − 4x + 5.</span><br>6x<sup>2</sup> → 6 × ${F('x<sup>3</sup>', 3)} = 2x<sup>3</sup> ; −4x → −4 × ${F('x<sup>2</sup>', 2)} = −2x<sup>2</sup> ; 5 → 5x.<br>F(x) = <b>2x<sup>3</sup> − 2x<sup>2</sup> + 5x + C</b></div>
<div class="ex"><span class="q">Exemple 2 : f(x) = 5x + 4 − 12x<sup>3</sup> (termes dans le désordre).</span><br>On range : f(x) = −12x<sup>3</sup> + 5x + 4 (pas de terme en x<sup>2</sup>).<br>−12x<sup>3</sup> → −12 × ${F('x<sup>4</sup>', 4)} = −3x<sup>4</sup> ; 5x → 2,5x<sup>2</sup> ; 4 → 4x.<br>F(x) = <b>−3x<sup>4</sup> + 0x<sup>3</sup> + 2,5x<sup>2</sup> + 4x + C</b> : cases −3 ; 0 ; 2,5 ; 4.</div>
<div class="cols">
<div><p>Les primitives de f(x) = 2x sont F(x) = x<sup>2</sup> + C : des paraboles décalées verticalement. Elles ont toutes la même pente en un même x.</p></div>
${repere({ xr: [-3, 3], yr: [-4, 7], fs: [-3, -1, 1, 3].map(C => ({ f: x => x * x + C, c: '#adb5bd', w: 2 })).concat([{ f: x => x * x, c: C_G, l: 'y = x² + C' }]), aria: 'famille de primitives x² + C' })}
</div>
<div class="warn">⚠️ Tu as oublié de diviser si tu recopies les coefficients de f : une primitive de x<sup>n</sup> est x<sup>n+1</sup> ÷ (n + 1).<br>⚠️ Le nombre seul 5 devient 5x (et pas 0 : ça, c'est la dérivée !).<br>⚠️ N'oublie pas la <b>constante C</b> : « les primitives » sont toutes les F + C.</div>
<div class="retenir">À retenir : on primitive un polynôme terme à terme, et on ajoute une constante C.</div>`;
}

/* ================= 6. primitive vérifiant F(a) = b ================= */
function L6(d) {
  let fn, fh, G, Gh, x0, y0, E, tpl, sol, kind, nm;
  if (d < 2) {
    const A = [0, ri(-4, 4), ri(1, 3) * (d >= 1 && chance(0.5) ? -1 : 1)]; // F = A2 x² + A1 x
    if (d >= 1 && chance(0.5)) A.push(nz(-1, 1));
    const f = A.slice(1).map((v, k) => (k + 1) * v);
    fn = pf(f); fh = ph(f); G = pf(A); Gh = ph(A);
    x0 = d < 1 ? 0 : nz(-2, 2); y0 = ri(-6, 6);
    const Cc = y0 - G(x0); E = [Cc]; tpl = 'C = {0}'; kind = 'C';
    nm = { y0, g: G(x0) };
    sol = G(x0) === 0 ? `F(${M(x0)}) = 0 + C = ${M(y0)}, donc <b>C = ${M(Cc)}</b>.` : `F(${M(x0)}) = ${M(G(x0))} + C = ${M(y0)}, donc C = ${M(y0)} ${G(x0) < 0 ? '+ ' + M(-G(x0)) : '− ' + M(G(x0))} = <b>${M(Cc)}</b>.`;
    sol += ` F(x) = ${ph([Cc, ...A.slice(1)])}.`;
    return finish6({ fn, fh, G, x0, y0, E, tpl, sol, kind, nm, html: `f(x) = ${fh}. Ses primitives sont les fonctions F(x) = ${Gh} + C.<br>Trouve C pour que <b>F(${M(x0)}) = ${M(y0)}</b>.`, Fof: Ev => x => G(x) + Ev[0] });
  }
  if (d < 4) {
    const A = [0, ri(-5, 5), nz(-3, 3)];
    const f = [A[1], 2 * A[2]];
    fn = pf(f); fh = ph(f); G = pf(A);
    x0 = d < 3 ? ri(0, 2) : nz(-2, 2); y0 = ri(-6, 6);
    const Cc = y0 - G(x0); E = [A[2], A[1], Cc]; tpl = 'F(x) = {0} x<sup>2</sup> + {1} x + {2}'; kind = 'full';
    nm = { y0, g: G(x0) };
    sol = `Les primitives : F(x) = ${ph(A)} + C.<br>F(${M(x0)}) = ${M(G(x0))} + C = ${M(y0)} donc C = ${M(Cc)}.<br>F(x) = <b>${ph([Cc, A[1], A[2]])}</b>.`;
    return finish6({ fn, fh, G, x0, y0, E, tpl, sol, kind, nm, html: `Trouve la primitive F de f(x) = ${fh} sur ℝ telle que <b>F(${M(x0)}) = ${M(y0)}</b>.`, Fof: Ev => x => Ev[0] * x * x + Ev[1] * x + Ev[2] });
  }
  // d ≥ 4 : avec e^x (F(0) = y0) ou 1/x sur ]0 ; +∞[ (F(1) = y0)
  const k = nz(-3, 3), m = nz(-4, 4); y0 = ri(-5, 6);
  if (chance(0.5)) {
    fn = x => k * Math.exp(x) + m; fh = `${BASES.exp.h(k)} ${m < 0 ? '− ' + M(-m) : '+ ' + M(m)}`; x0 = 0;
    G = x => k * Math.exp(x) + m * x;
    const Cc = y0 - k; E = [k, m, Cc]; tpl = 'F(x) = {0} e<sup>x</sup> + {1} x + {2}'; kind = 'exp'; nm = { y0, g: k };
    sol = `Les primitives : F(x) = ${BASES.exp.h(k)} ${m < 0 ? '− ' + mono(-m, 1) : '+ ' + mono(m, 1)} + C.<br>F(0) = ${M(k)} × e<sup>0</sup> + 0 + C = ${M(k)} + C = ${M(y0)}, donc C = ${M(Cc)}.<br>F(x) = <b>${BASES.exp.h(k)} ${m < 0 ? '− ' + mono(-m, 1) : '+ ' + mono(m, 1)} ${Cc < 0 ? '− ' + M(-Cc) : '+ ' + M(Cc)}</b>.`;
    return finish6({ fn, fh, G, x0, y0, E, tpl, sol, kind, nm, html: `Trouve la primitive F de f(x) = ${fh} sur ℝ telle que <b>F(0) = ${M(y0)}</b>.<br><span class="note">Rappel : e<sup>0</sup> = 1.</span>`, Fof: Ev => x => Ev[0] * Math.exp(x) + Ev[1] * x + Ev[2] });
  }
  fn = x => k / x + m; fh = `${BASES.inv.h(k)} ${m < 0 ? '− ' + M(-m) : '+ ' + M(m)}`; x0 = 1;
  G = x => k * Math.log(x) + m * x;
  const Cc = y0 - m; E = [k, m, Cc]; tpl = 'F(x) = {0} ln x + {1} x + {2}'; kind = 'ln'; nm = { y0, g: m };
  sol = `Les primitives : F(x) = ${BASES.ln.h(k)} ${m < 0 ? '− ' + mono(-m, 1) : '+ ' + mono(m, 1)} + C.<br>F(1) = ${M(k)} × ln 1 + ${P(m)} × 1 + C = ${M(m)} + C = ${M(y0)}, donc C = ${M(Cc)}.<br>F(x) = <b>${BASES.ln.h(k)} ${m < 0 ? '− ' + mono(-m, 1) : '+ ' + mono(m, 1)} ${Cc < 0 ? '− ' + M(-Cc) : '+ ' + M(Cc)}</b>.`;
  return finish6({ fn, fh, G, x0, y0, E, tpl, sol, kind, nm, pos: true, html: `Trouve la primitive F de f(x) = ${fh} sur ]0 ; +∞[ telle que <b>F(1) = ${M(y0)}</b>.<br><span class="note">Rappel : ln 1 = 0.</span>`, Fof: Ev => x => Ev[0] * Math.log(x) + Ev[1] * x + Ev[2] });
}
function finish6({ fn, G, x0, y0, E, tpl, sol, kind, nm, html, Fof, pos }) {
  const base = numsCheck(E), last = E.length - 1;
  const check = v => {
    const r = base(v); if (r.ok) return r;
    const ok0 = v.slice(0, last).every((x, i) => near(x, E[i]));
    if (ok0 && near(v[last], nm.y0) && !near(nm.g, 0)) return { ...r, msg: `C n'est pas directement ${M(nm.y0)} : il faut résoudre F(${M(x0)}) = ${M(nm.y0)}, en calculant d'abord la valeur sans C en x = ${M(x0)}.` };
    if (ok0 && near(v[last], nm.y0 + nm.g)) return { ...r, msg: 'Erreur de signe en isolant C : si □ + C = b, alors C = b − □.' };
    if (!ok0) return { ...r, msg: 'Commence par trouver une primitive, terme à terme, puis cherche C.' };
    return r;
  };
  check.expected = base.expected;
  const Cc = E[last];
  const xr = pos ? [-1, 6] : [x0 - 4, x0 + 4];
  const dom = pos ? [0.03, 6] : undefined;
  const fam = [-4, -2, 2, 4].map(dc => ({ f: x => G(x) + Cc + dc, dom, c: '#adb5bd', w: 1.8 }));
  const yr = [Math.min(y0 - 6, -1), Math.max(y0 + 6, 1)];
  const exact = Fof(E);
  return {
    type: 'nums', html, tpl, check,
    verify: Ev => { const Fn = Fof(Ev); return isPrim(Fn, fn, pos ? PTS_POS : PTS) && near(Fn(x0), y0, 1e-9); },
    visual: repere({ xr, yr, fs: [...fam, { f: x => G(x) + Cc + 1, dom, c: '#adb5bd', w: 1.8 }], pts: [{ x: x0, y: y0, l: `(${M(x0)} ; ${M(y0)})` }] }),
    afterVisual: repere({ xr, yr, fs: [...fam, { f: exact, dom, c: C_G, l: 'y = F(x)' }], pts: [{ x: x0, y: y0, l: `(${M(x0)} ; ${M(y0)})` }] }),
    replaceVisual: true,
    hint: kind === 'C' ? `Remplace x par ${M(x0)} dans ${'F(x)'} : tu obtiens une équation dont l'inconnue est C.` : `1) Une primitive terme à terme, + C. 2) Écris F(${M(x0)}) = ${M(y0)} et résous pour trouver C.`,
    solution: sol + ` Sur le graphique, c'est la seule courbe de la famille qui passe par le point (${M(x0)} ; ${M(y0)}).`,
  };
}
function C6() {
  const L = x => 3 * Math.log(x) - 2 * x;
  return `<h2>6. La primitive qui passe par un point</h2>
<p class="intro">Parmi toutes les primitives d'une fonction, une seule passe par un point donné. Trouver cette primitive, c'est trouver la bonne constante C.</p>
<div class="def">Une fonction f a une infinité de primitives F(x) + C. Une condition <b>F(a) = b</b> (la courbe passe par le point (a ; b)) fixe la constante : il y en a <b>une seule</b>.</div>
<div class="methode"><b>Méthode</b><ol>
<li>Trouve une primitive terme à terme et ajoute + C.</li>
<li>Remplace x par a : calcule d'abord la partie sans C.</li>
<li>Écris l'équation F(a) = b, et isole C : si □ + C = b, alors C = b − □.</li>
<li>Écris F(x) avec la valeur de C trouvée.</li>
<li>Rappels utiles : e<sup>0</sup> = 1 et ln 1 = 0.</li></ol></div>
<div class="cols">
${repere({ xr: [-4, 3], yr: [-3, 9], fs: [0, 4, -2].map(C => ({ f: x => x * x + 3 * x + C, c: '#adb5bd', w: 1.8 })).concat([{ f: x => x * x + 3 * x + 2, c: C_G, l: 'y = x² + 3x + 2' }]), pts: [{ x: 1, y: 6, l: '(1 ; 6)' }], aria: 'famille de primitives et la courbe passant par (1 ; 6)' })}
${repere({ xr: [-1, 6], yr: [-3, 9], fs: [2, 4, 8, 10].map(C => ({ f: x => L(x) + C, dom: [0.03, 6], c: '#adb5bd', w: 1.8 })).concat([{ f: x => L(x) + 6, dom: [0.03, 6], c: C_G }]), pts: [{ x: 1, y: 4, l: '(1 ; 4)' }], aria: 'famille de primitives avec ln et la courbe passant par (1 ; 4)' })}
</div>
<div class="ex"><span class="q">Exemple 1 : f(x) = 2x + 3 et F(1) = 6.</span><br>F(x) = x<sup>2</sup> + 3x + C ; F(1) = 1 + 3 + C = 4 + C = 6, donc C = 6 − 4 = 2.<br>F(x) = <b>x<sup>2</sup> + 3x + 2</b>.</div>
<div class="ex"><span class="q">Exemple 2 : f(x) = 4x − 1 et F(−2) = 3 (borne négative).</span><br>F(x) = 2x<sup>2</sup> − x + C ; F(−2) = 2 × 4 + 2 + C = 10 + C = 3, donc C = 3 − 10 = −7.<br>F(x) = <b>2x<sup>2</sup> − x − 7</b>.</div>
<div class="ex"><span class="q">Exemple 3 : f(x) = ${F(3, 'x')} − 2 sur ]0 ; +∞[ et F(1) = 4.</span><br>F(x) = 3 ln x − 2x + C ; F(1) = 3 × 0 − 2 + C = 4, donc C = 6.<br>F(x) = <b>3 ln x − 2x + 6</b>. C'est la courbe verte du 2<sup>e</sup> dessin. Avec e<sup>x</sup> on utilise F(0), et 3e<sup>0</sup> = 3 (pas 0).</div>
<div class="warn">⚠️ C n'est pas directement égal à b : il faut résoudre F(a) = b.<br>⚠️ Erreur de signe en isolant C : si □ + C = b, alors C = b − □.<br>⚠️ e<sup>0</sup> = 1 (et non 0) ; ln 1 = 0.</div>
<div class="retenir">À retenir : la condition F(a) = b donne une équation d'inconnue C, et une seule primitive.</div>`;
}

/* ================= 7. calcul d'intégrales de polynômes ================= */
function L7(d) {
  let c, a, b;
  if (d < 1) { c = chance(0.5) ? [ri(1, 6)] : [0, 2 * ri(1, 3)]; a = 0; b = ri(1, 4); }
  else if (d < 2) { c = [ri(-3, 5), nz(-3, 3)]; a = ri(0, 2); b = a + ri(1, 3); }
  else if (d < 3) { c = [ri(-3, 3), ri(-3, 3), pick([1, 1, 3, -3, 2])]; a = ri(0, 1); b = a + ri(1, 3); }
  else if (d < 4) { c = [ri(-4, 4), ri(-3, 3), pick([1, 3, -3, 2, -1])]; a = ri(-3, 0); b = ri(a + 1, 3); }
  else { c = [ri(-3, 3), ri(-3, 3), ri(-3, 3), pick([1, 4, -4, 2])]; a = ri(-2, 0); b = ri(Math.max(a + 1, 1), 2); }
  const fn = pf(c), Iq = intQ(c, a, b), G = prim(c);
  const R = ratQ(Iq, 'I = {0}', [[-qv(Iq), ORDER], [intNoDiv(c, a, b), NODIV], [qv(pq(G, b)), 'Tu n\'as calculé que F(b) : il faut soustraire F(a).']]);
  const Fa = pq(G, a), Fb = pq(G, b);
  return {
    ...R,
    html: `Calcule ${big(`I = ${INT(M(a), M(b), /.[+−]/.test(ph(c)) ? `(${ph(c)})` : ph(c))}`)}${R.note}`,
    value: simpson(fn, a, b),
    visual: areaPlot(fn, a, b),
    hint: 'Trouve une primitive F de la fonction, puis calcule <b>F(b) − F(a)</b> (borne du haut moins borne du bas).',
    solution: `Une primitive : F(x) = ${ph(G)}.<br>I = ${BRK(ph(G), M(a), M(b))} = F(${M(b)}) − F(${M(a)}) = ${qh(Fb)} − ${qP(Fa)} = <b>${qh(Iq)}</b>.`,
  };
}
function C7() {
  const f = x => x * x;
  const g = x => 3 * x * x - 2 * x;
  return `<h2>7. Calculer une intégrale avec une primitive</h2>
<p class="intro">Compter des carreaux ne marche pas pour une parabole. Le théorème fondamental relie l'intégrale aux primitives : un calcul de deux valeurs suffit.</p>
<div class="def">Si F est une primitive de f sur [a ; b] :${big(`${INT('a', 'b', 'f(x)')} = ${BRK('F(x)', 'a', 'b')} = F(b) − F(a)`)}Le résultat ne dépend pas de la primitive choisie : on prend celle avec C = 0.</div>
<div class="methode"><b>Méthode</b><ol>
<li>Trouve une primitive F de f, terme à terme.</li>
<li>Écris le crochet ${BRK('F(x)', 'a', 'b')}.</li>
<li>Calcule F(b) (borne du haut), puis F(a) (borne du bas), avec des parenthèses si F(a) est négatif.</li>
<li>Calcule F(b) − F(a). Si le résultat est une fraction, écris-la simplifiée (le signe − au numérateur).</li></ol></div>
<div class="cols">
${repere({ xr: [-1, 4], yr: [-1, 10], fs: [{ f, l: 'y = x²' }], fill: [{ f, a: 1, b: 3, signed: true }], xl: [{ x: 1, l: '1' }, { x: 3, l: '3' }], aria: 'aire sous x² entre 1 et 3' })}
${repere({ xr: [-2, 3], yr: [-2, 9], fs: [{ f: g }], fill: [{ f: g, a: -1, b: 2, signed: true }], xl: [{ x: -1, l: '−1' }, { x: 2, l: '2' }], aria: 'domaine sous 3x² − 2x entre −1 et 2' })}
</div>
<div class="ex"><span class="q">Exemple 1 : un résultat fractionnaire.</span><br>${INT('1', '3', 'x<sup>2</sup>')} = ${BRK(F('x<sup>3</sup>', 3), 1, 3)} = ${F(27, 3)} − ${F(1, 3)} = <b>${F(26, 3)}</b> ≈ 8,67 u.a.<br>${INT('0', '2', '(4x + 1)')} = ${BRK('2x<sup>2</sup> + x', 0, 2)} = (8 + 2) − 0 = <b>10</b>.</div>
<div class="ex"><span class="q">Exemple 2 : une borne négative.</span><br>${INT('−1', '2', '(3x<sup>2</sup> − 2x)')} = ${BRK('x<sup>3</sup> − x<sup>2</sup>', '−1', '2')}<br>F(2) = 8 − 4 = 4 ; F(−1) = −1 − 1 = −2.<br>I = 4 − (−2) = <b>6</b>. (La petite partie hachurée sous l'axe compte en moins.)</div>
<div class="warn">⚠️ C'est <b>F(b) − F(a)</b> : borne du haut moins borne du bas, pas l'inverse.<br>⚠️ Une primitive de x<sup>2</sup> est ${F('x<sup>3</sup>', 3)}, pas x<sup>3</sup> : n'oublie pas de diviser.<br>⚠️ Ne t'arrête pas à F(b) : il faut soustraire F(a), même quand a ≠ 0.</div>
<div class="retenir">À retenir : ${INT('a', 'b', 'f(x)')} = F(b) − F(a), où F est une primitive de f.</div>`;
}

/* ================= 8. linéarité et relation de Chasles ================= */
/** polynôme f = 3w x² + 2u x + v : ses intégrales entre entiers sont entières */
const intPoly = d => [ri(-3, 4), 2 * ri(-2, 2), 3 * (d >= 2 ? ri(-1, 1) : ri(0, 1))];
function L8(d) {
  const mode = d < 1 ? pick(['sum', 'k']) : d < 2 ? 'lin' : d < 3 ? 'ch+' : d < 4 ? 'ch-' : pick(['rev', 'mix']);
  const f = intPoly(d), g = intPoly(d), fn = pf(f), gn = pf(g);
  const iv = (c, a, b) => qv(intQ(c, a, b));
  let html, val, sol, hint, msgs = [], vis;
  if (mode === 'sum' || mode === 'k' || mode === 'lin') {
    const a = ri(-1, 1), b = a + ri(2, 3), p = iv(f, a, b), q = iv(g, a, b);
    const al = mode === 'sum' ? 1 : mode === 'k' ? pick([2, 3, 4, -2, 5]) : nz(-3, 3), be = mode === 'sum' ? 1 : mode === 'k' ? 0 : nz(-3, 3);
    const comb = (al === 1 ? '' : al === -1 ? '−' : M(al)) + (be ? 'f(x)' + (be < 0 ? ' − ' : ' + ') + (Math.abs(be) === 1 ? '' : M(Math.abs(be))) + 'g(x)' : 'f(x)');
    html = `On sait que ${INT(M(a), M(b), 'f(x)')} = ${M(p)}${be ? ` et ${INT(M(a), M(b), 'g(x)')} = ${M(q)}` : ''}.<br>Calcule${big(INT(M(a), M(b), be || al !== 1 ? `(${comb})` : comb))}`;
    val = simpson(x => al * fn(x) + be * gn(x), a, b);
    const ex = al * p + be * q;
    sol = `Par linéarité : ${be ? `${M(al)} × ${P(p)} ${be < 0 ? '−' : '+'} ${M(Math.abs(be))} × ${P(q)}` : `${M(al)} × ${P(p)}`} = <b>${M(ex)}</b>.`;
    hint = 'Linéarité : l\'intégrale d\'une somme est la somme des intégrales, et un coefficient constant sort de l\'intégrale.';
    msgs = [[p + q, 'N\'oublie pas les coefficients devant f et g.'], [al * p - be * q, 'Attention au signe devant g.']];
    vis = repere({ xr: [Math.min(a, 0) - 1, b + 1], yr: yWin([fn, gn], a, b, { lim: 12 }), fs: [{ f: fn, l: 'y = f(x)' }, { f: gn, c: C_G, l: 'y = g(x)' }], fill: [{ f: fn, a, b, signed: true }], xl: [{ x: a, l: M(a) }, { x: b, l: M(b) }] });
    return fin8({ html, val, sol, hint, msgs, vis, ex });
  }
  const a = ri(-2, 0), bb = a + ri(1, 2), c = bb + ri(1, 2);
  const pab = iv(f, a, bb), pbc = iv(f, bb, c), pac = iv(f, a, c);
  vis = repere({ xr: [Math.min(a, 0) - 1, c + 1], yr: yWin([fn], a, c, { lim: 12 }), fs: [{ f: fn, l: 'y = f(x)' }], fill: [{ f: fn, a, b: bb, signed: true }, { f: fn, a: bb, b: c, signed: true, c: '#74c0fc' }], xl: [{ x: a, l: M(a) }, { x: bb, l: M(bb) }, { x: c, l: M(c) }] });
  hint = 'Relation de Chasles : ∫ de a à b + ∫ de b à c = ∫ de a à c. Et inverser les bornes change le signe.';
  if (mode === 'ch+') {
    html = `On sait que ${INT(M(a), M(bb), 'f(x)')} = ${M(pab)} et ${INT(M(bb), M(c), 'f(x)')} = ${M(pbc)}.<br>Calcule${big(INT(M(a), M(c), 'f(x)'))}`;
    val = simpson(fn, a, c); sol = `Chasles : ${INT(M(a), M(c), 'f(x)')} = ${M(pab)} + ${P(pbc)} = <b>${M(pac)}</b>.`;
    msgs = [[pab - pbc, 'Les deux morceaux s\'<b>ajoutent</b> : [a ; b] puis [b ; c] forment [a ; c].']];
    return fin8({ html, val, sol, hint, msgs, vis, ex: pac });
  }
  if (mode === 'ch-') {
    html = `On sait que ${INT(M(a), M(c), 'f(x)')} = ${M(pac)} et ${INT(M(a), M(bb), 'f(x)')} = ${M(pab)}.<br>Calcule${big(INT(M(bb), M(c), 'f(x)'))}`;
    val = simpson(fn, bb, c); sol = `Chasles : ${INT(M(a), M(bb), 'f(x)')} + ${INT(M(bb), M(c), 'f(x)')} = ${INT(M(a), M(c), 'f(x)')}, donc ${INT(M(bb), M(c), 'f(x)')} = ${M(pac)} − ${P(pab)} = <b>${M(pbc)}</b>.`;
    msgs = [[pac + pab, 'Ici on cherche un <b>morceau</b> : on soustrait, ∫ de b à c = ∫ de a à c − ∫ de a à b.'], [pab - pac, 'Attention à l\'ordre de la soustraction : ∫ de a à c − ∫ de a à b.']];
    return fin8({ html, val, sol, hint, msgs, vis, ex: pbc });
  }
  if (mode === 'rev') {
    html = `On sait que ${INT(M(a), M(bb), 'f(x)')} = ${M(pab)} et ${INT(M(c), M(bb), 'f(x)')} = ${M(-pbc)}.<br>Calcule${big(INT(M(a), M(c), 'f(x)'))}`;
    val = simpson(fn, a, c); sol = `${INT(M(bb), M(c), 'f(x)')} = −${INT(M(c), M(bb), 'f(x)')} = ${M(pbc)}. Chasles : ${INT(M(a), M(c), 'f(x)')} = ${M(pab)} + ${P(pbc)} = <b>${M(pac)}</b>.`;
    msgs = [[pab - pbc, 'Inverser les bornes change le signe : ∫ de b à c = −∫ de c à b.']];
    return fin8({ html, val, sol, hint, msgs, vis, ex: pac });
  }
  // mix : linéarité + Chasles
  const k = pick([2, 3, -2, 5]), q = iv(g, a, c);
  html = `On sait que ${INT(M(a), M(bb), 'f(x)')} = ${M(pab)}, ${INT(M(bb), M(c), 'f(x)')} = ${M(pbc)} et ${INT(M(a), M(c), 'g(x)')} = ${M(q)}.<br>Calcule${big(INT(M(a), M(c), `(${M(k)}f(x) + g(x))`))}`;
  val = simpson(x => k * fn(x) + gn(x), a, c);
  const ex = k * pac + q;
  sol = `Chasles : ${INT(M(a), M(c), 'f(x)')} = ${M(pab)} + ${P(pbc)} = ${M(pac)}. Linéarité : ${M(k)} × ${P(pac)} + ${P(q)} = <b>${M(ex)}</b>.`;
  msgs = [[pac + q, `Le coefficient ${M(k)} multiplie l'intégrale de f.`], [k * pab + q, 'L\'intégrale de f va de a à c : utilise d\'abord Chasles.']];
  return fin8({ html, val, sol, hint: hint + ' Puis la linéarité.', msgs, vis, ex });
}
function fin8({ html, val, sol, hint, msgs, vis, ex }) {
  const base = numsCheck([ex]);
  const check = v => { const r = base(v); if (r.ok) return r; for (const [w, m] of msgs) if (near(v[0], w) && !near(w, ex)) return { ...r, msg: m }; if (near(v[0], -ex)) return { ...r, msg: 'Le signe est faux.' }; return r; };
  check.expected = base.expected;
  return { type: 'nums', tpl: 'Résultat : {0}', html, check, value: val, visual: vis, hint, solution: sol };
}
function C8() {
  const f = x => 4 - x * x / 3;
  return `<h2>8. Linéarité et relation de Chasles</h2>
<p class="intro">Ces règles permettent de calculer une intégrale à partir d'autres intégrales déjà connues, sans jamais chercher de primitive.</p>
<div class="def"><b>Linéarité</b> : ${INT('a', 'b', '(αf(x) + βg(x))')} = α${INT('a', 'b', 'f(x)')} + β${INT('a', 'b', 'g(x)')}<br>
<b>Chasles</b> : ${INT('a', 'b', 'f(x)')} + ${INT('b', 'c', 'f(x)')} = ${INT('a', 'c', 'f(x)')}<br>
<b>Bornes inversées</b> : ${INT('b', 'a', 'f(x)')} = −${INT('a', 'b', 'f(x)')}</div>
<div class="methode"><b>Méthode</b><ol>
<li>Regarde les bornes : sont-elles les mêmes partout (linéarité) ou différentes (Chasles) ?</li>
<li>Bornes dans le mauvais ordre ? Change le signe pour les remettre dans l'ordre.</li>
<li>Chasles : deux morceaux qui se suivent s'<b>ajoutent</b> ; pour trouver un morceau, on <b>soustrait</b>.</li>
<li>Linéarité : sors les coefficients, puis remplace chaque intégrale par sa valeur.</li>
<li>Calcule, en mettant les nombres négatifs entre parenthèses.</li></ol></div>
<div class="cols">
<div><p>Sur le dessin, l'aire orange (de a à b) plus l'aire bleue (de b à c) donne l'aire totale de a à c : c'est la relation de Chasles.</p></div>
${repere({ xr: [-1, 4], yr: [-1, 5], fs: [{ f, l: 'y = f(x)' }], fill: [{ f, a: 0, b: 2, signed: true }, { f, a: 2, b: 3, signed: true, c: '#74c0fc' }], xl: [{ x: 0, l: 'a' }, { x: 2, l: 'b' }, { x: 3, l: 'c' }], aria: 'relation de Chasles : deux domaines accolés' })}
</div>
<div class="ex"><span class="q">Exemple 1 : linéarité.</span><br>Si ${INT(1, 4, 'f(x)')} = 5 et ${INT(1, 4, 'g(x)')} = −2, alors<br>${INT(1, 4, '(3f(x) − g(x))')} = 3 × 5 − (−2) = 15 + 2 = <b>17</b>.</div>
<div class="ex"><span class="q">Exemple 2 : Chasles, dans les deux sens.</span><br>Si ${INT(0, 2, 'f(x)')} = 7 et ${INT(2, 3, 'f(x)')} = 2, alors ${INT(0, 3, 'f(x)')} = 7 + 2 = <b>9</b>.<br>Si ${INT(0, 3, 'f(x)')} = 9 et ${INT(0, 2, 'f(x)')} = 7, alors ${INT(2, 3, 'f(x)')} = 9 − 7 = <b>2</b>.<br>Si ${INT(3, 2, 'f(x)')} = −2, alors ${INT(2, 3, 'f(x)')} = 2 (bornes échangées).</div>
<div class="warn">⚠️ Pour un morceau : on <b>soustrait</b>, ∫ de b à c = ∫ de a à c − ∫ de a à b (et dans cet ordre).<br>⚠️ Échanger les bornes change le signe.<br>⚠️ N'oublie pas les coefficients devant f et g, ni le signe devant g.</div>
<div class="retenir">À retenir : les intégrales s'ajoutent bout à bout (Chasles) et les coefficients sortent de l'intégrale (linéarité).</div>`;
}

/* ================= 9. signe de l'intégrale, aire d'une fonction négative ================= */
function L9(d) {
  if (d < 1) {
    // lecture graphique du signe : f garde un signe sur [a ; b]
    const r = ri(-2, 3), u = nz(-2, 2), f = [-2 * u * r, 2 * u], fn = pf(f);
    const right = chance(0.5), a = right ? r + ri(0, 1) : r - ri(2, 3), b = right ? a + ri(1, 3) : r - ri(0, 1);
    const sgn = Math.sign(fn((a + b) / 2));
    const E = sgn > 0 ? 'pos' : 'neg';
    return {
      type: 'choice', opts: [{ v: 'pos', l: 'positive' }, { v: 'neg', l: 'négative' }, { v: 'nul', l: 'nulle' }],
      html: `Voici la courbe de f(x) = ${ph(f)}. Sans calcul, quel est le signe de ${INT(M(a), M(b), 'f(x)')} ?`,
      check: choiceCheck(E, { msg: () => 'Regarde si la courbe est au-dessus ou au-dessous de l\'axe des abscisses entre les deux bornes.' }),
      verify: e => e === (simpson(fn, a, b) > 0 ? 'pos' : 'neg'),
      visual: areaPlot(fn, a, b),
      hint: 'Si f ≥ 0 sur [a ; b] (avec a &lt; b), l\'intégrale est positive ; si f ≤ 0, elle est négative.',
      solution: `Sur [${M(a)} ; ${M(b)}], la courbe est ${sgn > 0 ? 'au-dessus' : 'au-dessous'} de l'axe : f ${sgn > 0 ? '≥' : '≤'} 0, donc l'intégrale est <b>${sgn > 0 ? 'positive' : 'négative'}</b>.`,
    };
  }
  let f, a, b;
  if (d < 2) { const r = ri(-1, 3), u = ri(1, 2); if (chance(0.5)) { f = [-2 * u * r, 2 * u]; b = r - ri(0, 1); a = b - ri(1, 3); } else { f = [2 * u * r, -2 * u]; a = r + ri(0, 1); b = a + ri(1, 3); } }
  else if (d < 3) { const m = ri(2, 3); f = [-3 * m * m, 0, 3]; a = ri(-m, m - 1); b = ri(a + 1, m); }   // 3x² − 3m² ≤ 0 sur [−m ; m]
  else if (d < 4) { const r = ri(-1, 2), u = nz(-2, 2); f = [-2 * u * r, 2 * u]; a = r - ri(1, 3); b = r + ri(1, 3); }
  else { const m = ri(1, 2); f = [-3 * m * m, 0, 3]; a = chance(0.5) ? 0 : ri(-m - 1, -m + 1); b = m + ri(1, 2); if (a === -m) a = 0; } // change de signe en ±m
  const fn = pf(f), Iq = intQ(f, a, b), I = qv(Iq);
  const neg = !(d >= 3);

  // morceaux exacts (racines entières connues par construction)
  const roots = (f.length === 2 ? [-f[0] / f[1]] : [-Math.sqrt(-f[0] / 3), Math.sqrt(-f[0] / 3)]).filter(x => x > a && x < b);
  const cuts = [a, ...roots, b], parts = [];
  for (let i = 0; i + 1 < cuts.length; i++) parts.push(qv(intQ(f, cuts[i], cuts[i + 1])));
  const A = r6(parts.reduce((s, p) => s + Math.abs(p), 0));
  const base = numsCheck([r6(I), A]);
  const check = v => {
    const r = base(v); if (r.ok) return r;
    if (near(v[1], -A) || (v[1] < 0)) return { ...r, msg: 'Une aire est toujours <b>positive</b> : quand f est négative, l\'aire est l\'<b>opposé</b> de l\'intégrale.' };
    if (!neg && near(v[1], Math.abs(I))) return { ...r, msg: 'f change de signe : les morceaux se compensent dans l\'intégrale. Pour l\'aire, calcule chaque morceau et additionne leurs valeurs absolues.' };
    if (near(v[0], -I)) return { ...r, msg: ORDER };
    return r;
  };
  check.expected = base.expected;
  const cutTxt = roots.length ? `f s'annule en x = ${roots.map(M).join(' et x = ')}. ` : '';
  return {
    type: 'nums', keys: { comma: true },
    html: `Soit f(x) = ${ph(f)}.${neg ? ` f est négative sur [${M(a)} ; ${M(b)}].` : ''} Calcule l'intégrale I = ${INT(M(a), M(b), 'f(x)')}, puis l'aire 𝒜 (en u.a.) du domaine entre la courbe, l'axe des abscisses et les droites x = ${M(a)} et x = ${M(b)}.`,
    tpl: 'I = {0} &nbsp;&nbsp; 𝒜 = {1} u.a.', labels: ['intégrale I', 'aire'],
    check, value: simpsonAbs(fn, a, b), verify: E => near(E[0], simpson(fn, a, b), 1e-7) && (neg ? near(E[1], -simpson(fn, a, b), 1e-7) : true),
    visual: areaPlot(fn, a, b),
    hint: neg ? 'Calcule I avec une primitive. Comme f ≤ 0, le domaine est sous l\'axe : 𝒜 = −I.' : `${cutTxt}Coupe l'intervalle là où f change de signe : l'aire est la somme des valeurs absolues des intégrales de chaque morceau.`,
    solution: `F(x) = ${ph(prim(f))}. I = F(${M(b)}) − F(${M(a)}) = <b>${M(r6(I))}</b>.<br>` + (neg ? `f ≤ 0 : 𝒜 = −I = <b>${M(A)} u.a.</b>` : `${cutTxt}Morceaux : ${parts.map(p => M(r6(p))).join(' ; ')}. 𝒜 = ${parts.map(p => M(r6(Math.abs(p)))).join(' + ')} = <b>${M(A)} u.a.</b> (alors que I = ${M(r6(I))} : les parties sous l'axe comptent négativement dans I).`),
  };
}
function C9() {
  const f = x => x - 2;
  const g = x => 3 * x * x - 3;
  return `<h2>9. Signe d'une intégrale et aire</h2>
<p class="intro">Une intégrale peut être négative, une aire jamais. Ce niveau t'apprend à passer de l'une à l'autre, même quand la courbe traverse l'axe.</p>
<div class="def">Si a &lt; b : f ≥ 0 sur [a ; b] ⟹ ${INT('a', 'b', 'f(x)')} ≥ 0 ; f ≤ 0 sur [a ; b] ⟹ ${INT('a', 'b', 'f(x)')} ≤ 0.<br>Si f ≤ 0, l'aire du domaine (sous l'axe) vaut <b>𝒜 = −${INT('a', 'b', 'f(x)')}</b>.<br>Si f change de signe, on découpe aux points où f s'annule et on ajoute les aires des morceaux.</div>
<div class="methode"><b>Méthode</b><ol>
<li>Signe sans calcul : la courbe est-elle au-dessus (intégrale positive) ou au-dessous (négative) de l'axe entre a et b ?</li>
<li>Calcule I = F(b) − F(a) avec une primitive.</li>
<li>Si f ≤ 0 sur tout [a ; b] : 𝒜 = −I.</li>
<li>Si f change de signe : trouve où f s'annule, calcule l'intégrale de chaque morceau, puis 𝒜 = somme des <b>valeurs absolues</b>.</li></ol></div>
<div class="cols">
${repere({ xr: [-1, 5], yr: [-3, 3], eq: true, fs: [{ f }], fill: [{ f, a: 0, b: 4, signed: true }], xl: [{ x: 0, l: '0' }, { x: 4, l: '4' }], aria: 'domaine sous et sur l\'axe pour x − 2' })}
${repere({ xr: [-1, 3], yr: [-4, 10], fs: [{ f: g }], fill: [{ f: g, a: 0, b: 2, signed: true }], xl: [{ x: 0, l: '0' }, { x: 2, l: '2' }], aria: 'domaine sous et sur l\'axe pour 3x² − 3' })}
</div>
<div class="ex"><span class="q">Exemple 1 : f(x) = x − 2 (à gauche).</span><br>Sur [0 ; 2], f ≤ 0 : ${INT(0, 2, '(x − 2)')} = ${BRK(`${F('x<sup>2</sup>', 2)} − 2x`, 0, 2)} = (2 − 4) − 0 = <b>−2</b>, donc 𝒜 = −(−2) = <b>2 u.a.</b><br>Sur [0 ; 4] : l'intégrale vaut 0, car les deux triangles se compensent ; mais l'aire vaut 2 + 2 = 4 u.a.</div>
<div class="ex"><span class="q">Exemple 2 : f(x) = 3x<sup>2</sup> − 3 sur [0 ; 2] (à droite), qui s'annule en x = 1.</span><br>F(x) = x<sup>3</sup> − 3x. I = F(2) − F(0) = 2 − 0 = <b>2</b>.<br>Morceaux : ${INT(0, 1, 'f(x)')} = −2 − 0 = −2 et ${INT(1, 2, 'f(x)')} = 2 − (−2) = 4.<br>𝒜 = 2 + 4 = <b>6 u.a.</b> (et non 2).</div>
<div class="warn">⚠️ Une aire est toujours <b>positive</b> : quand f est négative, l'aire est l'<b>opposé</b> de l'intégrale.<br>⚠️ Quand f change de signe, les morceaux se compensent dans l'intégrale : pour l'aire, additionne leurs valeurs absolues.<br>⚠️ Toujours F(b) − F(a), dans cet ordre.</div>
<div class="retenir">À retenir : l'intégrale compte « en moins » ce qui est sous l'axe ; l'aire compte tout en positif.</div>`;
}

/* ================= 10. aire entre deux courbes ================= */
function L10(d) {
  const r = ri(-2, 1), s = r + ri(2, 4), k = d < 2 ? 1 : pick([1, 1, 2, 3]);
  const h = [-k * r * s, k * (r + s), -k];                 // h = k(x − r)(s − x) ≥ 0 sur [r ; s]
  let low, up;
  if (d < 4) { const m = ri(-2, 2), p = ri(-2, 3); up = [p, m, 0]; low = [p - h[0], m - h[1], -h[2]]; }
  else { const al = pick([1, 2, -1]), be = ri(-2, 2), ga = ri(-3, 3); low = [ga, be, al]; up = [ga + h[0], be + h[1], al + h[2]]; if (up[2] === 0 && low[2] === 0) return L10(d); }
  const swap = d >= 3 && chance(0.5);                       // le nom f n'est pas toujours celui du haut
  const [fc, gc] = swap ? [low, up] : [up, low];
  const fn = pf(fc), gn = pf(gc), un = pf(up), ln = pf(low);
  const Aq = intQ(h, r, s);
  const nmU = swap ? 'g' : 'f', nmL = swap ? 'f' : 'g';
  const R = ratQ(Aq, '𝒜 = {0} u.a.', [[-qv(Aq), `L'aire est positive : on intègre (courbe du <b>haut</b> − courbe du <b>bas</b>) ; ici c'est ${nmU} − ${nmL}.`], [qv(intQ(up, r, s)), 'Tu n\'as intégré qu\'une seule des deux fonctions : intègre la différence.']]);
  const bounds = d < 2 ? `entre x = ${M(r)} et x = ${M(s)}, où les courbes se coupent` : 'entre leurs deux points d\'intersection';
  const xr = [Math.min(r, 0) - 1, Math.max(s, 0) + 1];
  return {
    ...R,
    html: `f(x) = ${ph(fc)} et g(x) = ${ph(gc)}.<br>Calcule l'aire 𝒜 du domaine compris entre 𝒞<sub>f</sub> et 𝒞<sub>g</sub>, ${bounds}.${d >= 2 ? '<br><span class="note">Résous d\'abord f(x) = g(x).</span>' : ''}${R.note}`,
    value: simpson(x => un(x) - ln(x), r, s),
    verify: () => { for (let i = 0; i <= 200; i++) { const x = r + (s - r) * i / 200; if (un(x) < ln(x) - 1e-9) return false; } return near(fn(r), gn(r)) && near(fn(s), gn(s)); },
    visual: repere({ xr, yr: yWin([fn, gn], xr[0], xr[1], { lim: 10 }), fs: [{ f: fn, l: '𝒞f' }, { f: gn, c: C_G, l: '𝒞g' }], fill: [{ f: un, g: ln, a: r, b: s }], xl: d < 2 ? [{ x: r, l: M(r) }, { x: s, l: M(s) }] : [] }),
    hint: `${d >= 2 ? 'Les bornes sont les solutions de f(x) = g(x). ' : ''}Sur l'intervalle, regarde quelle courbe est au-dessus : 𝒜 = ∫ (haut − bas).`,
    solution: `${d >= 2 ? `f(x) = g(x) ⟺ ${ph(h.map(v => -v))} = 0 ⟺ x = ${M(r)} ou x = ${M(s)}.<br>` : ''}Sur [${M(r)} ; ${M(s)}], 𝒞<sub>${nmU}</sub> est au-dessus : ${nmU}(x) − ${nmL}(x) = ${ph(h)}.<br>𝒜 = ${INT(M(r), M(s), `(${ph(h)})`)} = ${BRK(ph(prim(h)), M(r), M(s))} = <b>${qh(Aq)} u.a.</b>`,
  };
}
function C10() {
  const f = x => x + 2, g = x => x * x;
  const p = x => x * x - 2 * x - 1, q = x => 2 * x - 1;
  return `<h2>10. Aire entre deux courbes</h2>
<p class="intro">L'aire coincée entre deux courbes se calcule avec une seule intégrale : celle de la différence « courbe du haut moins courbe du bas ».</p>
<div class="def">Si <b>f ≥ g</b> sur [a ; b], l'aire du domaine compris entre 𝒞<sub>f</sub> (en haut), 𝒞<sub>g</sub> (en bas) et les droites x = a, x = b vaut${big(`𝒜 = ${INT('a', 'b', '(f(x) − g(x))')}`)}Souvent, a et b sont les abscisses des points d'intersection : on résout f(x) = g(x).</div>
<div class="methode"><b>Méthode</b><ol>
<li>Si les bornes ne sont pas données, résous f(x) = g(x) : les deux solutions sont a et b.</li>
<li>Repère la courbe du <b>haut</b> (sur le dessin, ou en testant une valeur entre a et b). Attention : ce n'est pas toujours f !</li>
<li>Calcule la différence haut − bas, simplifiée.</li>
<li>Intègre cette différence de a à b : F(b) − F(a).</li></ol></div>
<div class="cols">
${repere({ xr: [-2, 3], yr: [-1, 5], fs: [{ f, l: 'y = x + 2' }, { f: g, c: C_G, l: 'y = x²' }], fill: [{ f, g, a: -1, b: 2 }], xl: [{ x: -1, l: '−1' }, { x: 2, l: '2' }], aria: 'domaine entre une droite et une parabole' })}
${repere({ xr: [-1, 5], yr: [-3, 9], fs: [{ f: p, l: '𝒞f' }, { f: q, c: C_G, l: '𝒞g' }], fill: [{ f: q, g: p, a: 0, b: 4 }], xl: [{ x: 0, l: '0' }, { x: 4, l: '4' }], aria: 'domaine entre deux courbes, g au-dessus de f' })}
</div>
<div class="ex"><span class="q">Exemple 1 : f(x) = x + 2 et g(x) = x<sup>2</sup> (à gauche).</span><br>x<sup>2</sup> = x + 2 ⟺ x<sup>2</sup> − x − 2 = 0 ⟺ x = −1 ou x = 2. Entre les deux, la droite est au-dessus.<br>𝒜 = ${INT('−1', '2', '(x + 2 − x<sup>2</sup>)')} = ${BRK(`${F('x<sup>2</sup>', 2)} + 2x − ${F('x<sup>3</sup>', 3)}`, '−1', '2')} = ${F(10, 3)} − (−${F(7, 6)}) = <b>${F(9, 2)} u.a.</b></div>
<div class="ex"><span class="q">Exemple 2 : f(x) = x<sup>2</sup> − 2x − 1 et g(x) = 2x − 1 (à droite).</span><br>f(x) = g(x) ⟺ x<sup>2</sup> − 4x = 0 ⟺ x = 0 ou x = 4.<br>Ici, c'est <b>g</b> qui est en haut : g(x) − f(x) = 4x − x<sup>2</sup>.<br>𝒜 = ${INT('0', '4', '(4x − x<sup>2</sup>)')} = ${BRK(`2x<sup>2</sup> − ${F('x<sup>3</sup>', 3)}`, '0', '4')} = 32 − ${F(64, 3)} = <b>${F(32, 3)} u.a.</b></div>
<div class="warn">⚠️ Toujours <b>haut − bas</b> : dans l'autre sens on trouve un nombre négatif.<br>⚠️ Intègre la <b>différence</b>, pas une seule des deux fonctions.<br>⚠️ Les axes ne comptent pas ici : peu importe que les courbes passent sous l'axe des abscisses.</div>
<div class="retenir">À retenir : aire entre deux courbes = ∫ (haut − bas), entre les points d'intersection.</div>`;
}

/* ================= 11. valeur moyenne ================= */
function L11(d) {
  let c, a, b;
  if (d < 1) { c = [ri(-2, 4), nz(-2, 3)]; a = 0; b = ri(1, 4); }
  else if (d < 3) { c = [ri(-3, 3), ri(-3, 3), pick([1, 3, -3, 2])]; a = ri(0, 1); b = a + ri(1, 3); }
  else if (d < 4) { c = [ri(-3, 3), ri(-3, 3), pick([1, 3, -3])]; a = ri(-3, -1); b = ri(a + 2, 3); }
  else { c = [ri(-2, 2), ri(-2, 2), ri(-2, 2), pick([1, 4, -4])]; a = ri(-2, 0); b = ri(Math.max(1, a + 2), 2); }
  const fn = pf(c), Iq = intQ(c, a, b), mu = qdiv(Iq, Q(b - a));
  const R = ratQ(mu, 'μ = {0}', [[qv(Iq), `Tu as l'intégrale : il faut encore la diviser par la longueur b − a = ${b - a}.`], [a + b ? qv(Iq) / (a + b) : NaN, 'On divise par la <b>longueur</b> de l\'intervalle, b − a.'], [-qv(mu), ORDER]]);
  const m = qv(mu);
  return {
    ...R,
    html: `Calcule la valeur moyenne μ de f(x) = ${ph(c)} sur [${M(a)} ; ${M(b)}].${R.note}`,
    value: simpson(fn, a, b) / (b - a),
    visual: areaPlot(fn, a, b),
    afterVisual: areaPlot(fn, a, b, { h: { y: m, l: 'y = μ' } }), replaceVisual: true,
    hint: `μ = ${F(1, 'b − a')} × ${INT('a', 'b', 'f(x)')} : calcule l'intégrale avec une primitive, puis divise par ${b - a}.`,
    solution: `${INT(M(a), M(b), 'f(x)')} = ${BRK(ph(prim(c)), M(a), M(b))} = ${qh(Iq)}.<br>μ = ${F(1, `${M(b)} − ${P(a)}`)} × ${qP(Iq)} = <b>${qh(mu)}</b> ${mu[1] !== 1 ? `≈ ${M(Math.round(m * 100) / 100)}` : ''}. Le rectangle de hauteur μ sur [${M(a)} ; ${M(b)}] a la même aire « algébrique » que le domaine sous la courbe.`,
  };
}
function C11() {
  const f = x => x * x;
  const g = x => 3 * x * x;
  return `<h2>11. Valeur moyenne d'une fonction</h2>
<p class="intro">Quelle est la hauteur « moyenne » d'une courbe sur un intervalle ? C'est la hauteur du rectangle qui a la même aire que le domaine sous la courbe.</p>
<div class="def">La <b>valeur moyenne</b> de f sur [a ; b] (a &lt; b) est${big(`μ = ${F(1, 'b − a')} ${INT('a', 'b', 'f(x)')}`)}Le rectangle de base [a ; b] et de hauteur μ a la même aire que le domaine sous la courbe.</div>
<div class="methode"><b>Méthode</b><ol>
<li>Calcule l'intégrale ${INT('a', 'b', 'f(x)')} = F(b) − F(a) avec une primitive.</li>
<li>Calcule la longueur de l'intervalle b − a (avec a négatif : b − (−3) = b + 3).</li>
<li>Divise : μ = intégrale ÷ (b − a). Simplifie la fraction si besoin.</li></ol></div>
<div class="cols">
${repere({ xr: [-1, 4], yr: [-1, 10], fs: [{ f, l: 'y = x²' }], fill: [{ f, a: 0, b: 3, signed: true }], h: { y: 3, l: 'y = μ = 3' }, xl: [{ x: 0, l: '0' }, { x: 3, l: '3' }], aria: 'valeur moyenne de x² sur [0 ; 3]' })}
${repere({ xr: [-2, 3], yr: [-1, 13], fs: [{ f: g }], fill: [{ f: g, a: -1, b: 2, signed: true }], h: { y: 3, l: 'y = μ = 3' }, xl: [{ x: -1, l: '−1' }, { x: 2, l: '2' }], aria: 'valeur moyenne de 3x² sur [−1 ; 2]' })}
</div>
<div class="ex"><span class="q">Exemple 1 : f(x) = x<sup>2</sup> sur [0 ; 3].</span><br>${INT(0, 3, 'x<sup>2</sup>')} = ${BRK(F('x<sup>3</sup>', 3), 0, 3)} = 9 − 0 = 9 ; b − a = 3.<br>μ = ${F(9, 3)} = <b>3</b>.</div>
<div class="ex"><span class="q">Exemple 2 : f(x) = 3x<sup>2</sup> sur [−1 ; 2] (borne négative).</span><br>${INT('−1', '2', '3x<sup>2</sup>')} = ${BRK('x<sup>3</sup>', '−1', '2')} = 8 − (−1) = 9.<br>b − a = 2 − (−1) = <b>3</b> (et non 1 !), donc μ = ${F(9, 3)} = <b>3</b>.<br>Remarque : la moyenne de f(−1) = 3 et f(2) = 12 vaudrait 7,5 : ce n'est pas μ.</div>
<div class="warn">⚠️ L'intégrale seule n'est pas μ : il faut encore <b>diviser par b − a</b>.<br>⚠️ On divise par la <b>longueur</b> b − a, pas par a + b.<br>⚠️ Ce n'est pas la moyenne de f(a) et f(b) (sauf pour une fonction affine).</div>
<div class="retenir">À retenir : μ = ${F(1, 'b − a')} × ${INT('a', 'b', 'f(x)')}, l'intégrale divisée par la longueur de l'intervalle.</div>`;
}

/* ================= 12. défis avec e^x et ln ================= */
function L12(d) {
  const kinds = d < 1 ? ['lnk', 'een'] : d < 2 ? ['lnk', 'een', 'e01', 'lnb'] : d < 4 ? ['e01', 'lnb', 'mix', 'eab', 'lnk2'] : ['mix', 'mixln', 'eab', 'moy', 'lnk2'];
  const kd = pick(kinds);
  let fn, a, b, la, lb, body, exact = null, sol, Fh, hint = '';
  const ar = x => Math.round(x * 100) / 100;
  const M2 = v => (v < 0 ? '−' : '') + Math.abs(v).toFixed(2).replace('.', ','); // toujours deux décimales
  if (kd === 'lnk') { const k = ri(2, 9); fn = Math.exp; a = 0; b = Math.log(k); la = '0'; lb = `ln ${k}`; body = EX; Fh = EX; exact = k - 1; sol = `e<sup>ln ${k}</sup> − e<sup>0</sup> = ${k} − 1 = <b>${k - 1}</b>`; }
  else if (kd === 'lnk2') { const k = ri(2, 6), m = ri(2, 5); fn = x => m * Math.exp(x); a = 0; b = Math.log(k); la = '0'; lb = `ln ${k}`; body = `${m}${EX}`; Fh = `${m}${EX}`; exact = m * (k - 1); sol = `${m}e<sup>ln ${k}</sup> − ${m}e<sup>0</sup> = ${m * k} − ${m} = <b>${exact}</b>`; }
  else if (kd === 'een') { const n = ri(1, 3), m = ri(1, 5); fn = x => m / x; a = 1; b = Math.exp(n); la = '1'; lb = n === 1 ? 'e' : `e<sup>${n}</sup>`; body = F(m, 'x'); Fh = `${m === 1 ? '' : m + ' '}ln x`; exact = m * n; sol = `${m === 1 ? '' : m + ' × '}ln(${lb}) − ${m === 1 ? '' : m + ' × '}ln 1 = ${m === 1 ? '' : m + ' × '}${n} − 0 = <b>${exact}</b>`; }
  else if (kd === 'e01') { const m = ri(1, 5); fn = x => m * Math.exp(x); a = 0; b = 1; la = '0'; lb = '1'; body = `${m === 1 ? '' : m}${EX}`; Fh = body; sol = `${m === 1 ? '' : m}(e<sup>1</sup> − e<sup>0</sup>) = ${m === 1 ? '' : m}(e − 1) ≈ <b>${M2(ar(m * (Math.E - 1)))}</b>`; }
  else if (kd === 'lnb') { const bb = ri(2, 9), m = ri(1, 4); fn = x => m / x; a = 1; b = bb; la = '1'; lb = M(bb); body = F(m, 'x'); Fh = `${m === 1 ? '' : m + ' '}ln x`; sol = `${m === 1 ? '' : m + ' '}ln ${bb} − ${m === 1 ? '' : m + ' '}ln 1 = ${m === 1 ? '' : m + ' '}ln ${bb} ≈ <b>${M2(ar(m * Math.log(bb)))}</b>`; }
  else if (kd === 'eab') { const aa = ri(-2, 0), bb = ri(aa + 1, 2); fn = Math.exp; a = aa; b = bb; la = M(aa); lb = M(bb); body = EX; Fh = EX; sol = `e<sup>${M(bb)}</sup> − e<sup>${M(aa)}</sup> ≈ <b>${M2(ar(Math.exp(bb) - Math.exp(aa)))}</b>`; }
  else if (kd === 'mix') { const bb = ri(1, 2), m = ri(1, 3); fn = x => Math.exp(x) + 2 * m * x; a = 0; b = bb; la = '0'; lb = M(bb); body = `(${EX} + ${2 * m}x)`; Fh = `${EX} + ${m === 1 ? '' : m}x<sup>2</sup>`; sol = `(e<sup>${bb}</sup> + ${m * bb * bb}) − (e<sup>0</sup> + 0) = e<sup>${bb}</sup> + ${m * bb * bb - 1} ≈ <b>${M2(ar(Math.exp(bb) + m * bb * bb - 1))}</b>`; }
  else if (kd === 'mixln') { const bb = ri(2, 4); fn = x => 2 * x + 1 / x; a = 1; b = bb; la = '1'; lb = M(bb); body = `(2x + ${F(1, 'x')})`; Fh = 'x<sup>2</sup> + ln x'; sol = `(${bb * bb} + ln ${bb}) − (1 + 0) = ${bb * bb - 1} + ln ${bb} ≈ <b>${M2(ar(bb * bb - 1 + Math.log(bb)))}</b>`; }
  else { // moy : valeur moyenne de 1/x sur [1 ; e] ou de e^x sur [0 ; 1]
    if (chance(0.5)) { fn = x => 1 / x; a = 1; b = Math.E; la = '1'; lb = 'e'; Fh = 'ln x'; body = F(1, 'x'); sol = `${INT('1', 'e', F(1, 'x'))} = ln e − ln 1 = 1, donc μ = ${F(1, 'e − 1')} ≈ <b>${M2(ar(1 / (Math.E - 1)))}</b>`; }
    else { fn = Math.exp; a = 0; b = 1; la = '0'; lb = '1'; Fh = EX; body = EX; sol = `${INT('0', '1', EX)} = e − 1, donc μ = ${F('e − 1', 1)} ≈ <b>${M2(ar(Math.E - 1))}</b>`; }
    const mu = simpson(fn, a, b, 40000) / (b - a), E = ar(1 / (b - a) * (lb === 'e' ? 1 : Math.E - 1));
    return fin12({ fn, a, b, la, lb, E, exact: null, html: `Calcule la valeur moyenne μ de f(x) = ${body} sur [${la} ; ${lb}].<br><b>Donne la valeur arrondie au centième.</b>`, tpl: 'μ ≈ {0}', sol: `Une primitive : ${Fh}. ${sol}.`, num: mu, hint: `μ = ${F(1, 'b − a')} × ${INT('a', 'b', 'f(x)')}, ici b − a = ${lb} − ${la}.` });
  }
  const E = exact !== null ? exact : ar(simpsonExact(kd, { fn, a, b }));
  return fin12({ fn, a, b, la, lb, E, exact, html: `Calcule ${big(INT(la, lb, body))}${exact !== null ? '<b>Donne la valeur exacte</b> (c\'est un entier).' : '<b>Donne la valeur arrondie au centième.</b>'}`, tpl: exact !== null ? 'Valeur exacte : {0}' : 'Valeur arrondie : {0}', sol: `Une primitive : F(x) = ${Fh}.<br>${BRK(Fh, la, lb)} = ${sol}.`, num: simpson(fn, a, b, 40000), hint: hint || `Primitive de ${body} : ${{ lnk: TE, lnk2: TE, e01: TE, eab: TE, een: TL, lnb: TL, mix: TE + ' et une primitive de x est x²/2', mixln: TL + ' et une primitive de x est x²/2' }[kd]}. Puis F(b) − F(a)${exact !== null ? ' ; rappel : e<sup>ln k</sup> = k et ln(e<sup>n</sup>) = n.' : ', et arrondis à la fin.'}` });
}
const TE = 'une primitive de e<sup>x</sup> est e<sup>x</sup>', TL = 'une primitive de 1/x est ln x';
const svgSup = t => t.replace(/<sup>(\d)<\/sup>/g, (m, k) => '⁰¹²³⁴⁵⁶⁷⁸⁹'[k]);
/** valeur exacte (formule) pour la réponse arrondie ; les tests la comparent à Simpson */
function simpsonExact(kd, { fn, a, b }) {
  // primitive connue : on évalue F(b) − F(a) par la formule exacte correspondant à fn
  const Fx = { e01: x => fn(1) / Math.E * Math.exp(x), eab: Math.exp, lnb: x => fn(1) * Math.log(x), mix: x => Math.exp(x) + (fn(1) - Math.E) / 2 * x * x, mixln: x => x * x + Math.log(x) }[kd];
  return Fx(b) - Fx(a);
}
function fin12({ fn, a, b, la, lb, E, exact, html, tpl, sol, num, hint }) {
  const base = numsCheck([E]);
  const check = v => {
    const r = base(v); if (r.ok) return r;
    const x = v[0];
    if (near(x, -E)) return { ...r, msg: ORDER };
    if (exact === null && near(x, Math.trunc(num * 100) / 100) ) return { ...r, msg: 'Presque ! C\'est un arrondi au centième : regarde le 3<sup>e</sup> chiffre après la virgule (5 ou plus : on arrondit au-dessus).' };
    if (exact === null && Math.abs(x - num) < 0.05) return { ...r, msg: 'Tu es tout près : donne l\'arrondi au <b>centième</b> (deux chiffres après la virgule), sans arrondir pendant le calcul.' };
    return r;
  };
  check.expected = base.expected;
  return {
    type: 'nums', keys: { comma: true }, html, tpl, check,
    ...(exact !== null ? { value: num } : {}),
    verify: Ev => (exact !== null ? near(Ev[0], num, 1e-9) : Math.abs(Ev[0] - num) <= 0.005 + 1e-9 && near(Ev[0] * 100, Math.round(Ev[0] * 100), 1e-6)),
    visual: areaPlot(fn, a, b, { dom: a >= 1 || fn(0.0001) > 1000 ? [0.1, 99] : undefined, la: svgSup(la), lb: svgSup(lb), lim: Math.max(4, Math.ceil(Math.max(...[a, (a + b) / 2, b].map(x => Math.abs(fn(x))))) + 1) }),
    hint, solution: sol,
  };
}
function C12() {
  const inv = x => 1 / x;
  return `<h2>12. Défis : e<sup>x</sup> et ln</h2>
<p class="intro">Tout ce que tu as appris s'applique aussi à e<sup>x</sup> et à ${F(1, 'x')}. Les bornes peuvent s'écrire avec ln ou e : les valeurs utiles simplifient tout.</p>
<div class="def">Primitives à connaître : e<sup>x</sup> → <b>e<sup>x</sup></b> (sur ℝ) ; ${F(1, 'x')} → <b>ln x</b> (sur ]0 ; +∞[).<br>Valeurs utiles : e<sup>0</sup> = 1, ln 1 = 0, ln e = 1, e<sup>ln k</sup> = k, ln(e<sup>n</sup>) = n.</div>
<div class="methode"><b>Méthode</b><ol>
<li>Trouve une primitive, terme à terme (e<sup>x</sup> → e<sup>x</sup>, ${F(1, 'x')} → ln x, x → ${F('x<sup>2</sup>', 2)}).</li>
<li>Calcule F(b) − F(a) en simplifiant avec les valeurs utiles.</li>
<li>Lis la consigne : <b>valeur exacte</b> (souvent un entier) ou <b>arrondi au centième</b>.</li>
<li>Pour un arrondi : calcule à la calculatrice sans arrondir en route, puis regarde le 3<sup>e</sup> chiffre après la virgule.</li>
<li>Valeur moyenne : divise par b − a, par exemple e − 1.</li></ol></div>
<div class="cols">
${repere({ xr: [-1, 3], yr: [-1, 8], fs: [{ f: Math.exp, l: 'y = eˣ' }], fill: [{ f: Math.exp, a: 0, b: Math.log(3), signed: true }], xl: [{ x: 0, l: '0' }, { x: Math.log(3), l: 'ln 3' }], aria: 'aire sous e puissance x entre 0 et ln 3' })}
${repere({ xr: [-1, 4], yr: [-1, 4], fs: [{ f: inv, dom: [0.2, 4], l: 'y = 1/x' }], fill: [{ f: inv, a: 1, b: Math.E, signed: true }], h: { y: 1 / (Math.E - 1), l: 'y = μ' }, xl: [{ x: 1, l: '1' }, { x: Math.E, l: 'e' }], aria: 'aire sous 1/x entre 1 et e, et sa valeur moyenne' })}
</div>
<div class="ex"><span class="q">Exemple 1 : valeurs exactes.</span><br>${INT('0', 'ln 3', EX)} = ${BRK(EX, '0', 'ln 3')} = e<sup>ln 3</sup> − e<sup>0</sup> = 3 − 1 = <b>2</b>.<br>${INT('1', 'e<sup>2</sup>', F(3, 'x'))} = ${BRK('3 ln x', '1', 'e<sup>2</sup>')} = 3 × 2 − 3 × 0 = <b>6</b>.</div>
<div class="ex"><span class="q">Exemple 2 : arrondis au centième.</span><br>${INT('1', '5', F(2, 'x'))} = ${BRK('2 ln x', '1', '5')} = 2 ln 5 − 0 = 3,218… ≈ <b>3,22</b>.<br>${INT('0', '1', '(e<sup>x</sup> + 2x)')} = ${BRK('e<sup>x</sup> + x<sup>2</sup>', '0', '1')} = (e + 1) − (1 + 0) = e ≈ <b>2,72</b>.<br>Valeur moyenne de ${F(1, 'x')} sur [1 ; e] : ${INT('1', 'e', F(1, 'x'))} = ln e − ln 1 = 1, donc μ = ${F(1, 'e − 1')} = 0,581… ≈ <b>0,58</b>.</div>
<div class="warn">⚠️ Lis bien la consigne : <b>valeur exacte</b> ou <b>arrondi au centième</b>.<br>⚠️ On arrondit seulement à la fin : 3,218 → 3,22 (le 3<sup>e</sup> chiffre est 8 ≥ 5, on arrondit au-dessus).<br>⚠️ F(b) − F(a), et pas F(a) − F(b) ; et e<sup>0</sup> = 1, pas 0.</div>
<div class="retenir">À retenir : e<sup>x</sup> se primitive en e<sup>x</sup>, ${F(1, 'x')} en ln x ; puis F(b) − F(a), en simplifiant e<sup>ln k</sup> = k et ln(e<sup>n</sup>) = n.</div>`;
}

/* ================= niveaux ================= */
export const LEVELS = [
  { titre: 'Aire en carreaux', generate: L1, cours: C1, classe: 'Tle' },
  { titre: 'Méthode des rectangles', generate: L2, cours: C2, classe: 'Tle' },
  { titre: 'Vérifier une primitive', generate: L3, cours: C3, classe: 'Tle' },
  { titre: 'Primitives usuelles', generate: L4, cours: C4, classe: 'Tle' },
  { titre: 'Primitives de polynômes', generate: L5, cours: C5, classe: 'Tle' },
  { titre: 'Primitive avec F(a) = b', generate: L6, cours: C6, classe: 'Tle' },
  { titre: 'Calculer une intégrale', generate: L7, cours: C7, classe: 'Tle' },
  { titre: 'Linéarité et Chasles', generate: L8, cours: C8, classe: 'Tle' },
  { titre: 'Signe et aire', generate: L9, cours: C9, classe: 'Tle' },
  { titre: 'Aire entre deux courbes', generate: L10, cours: C10, classe: 'Tle' },
  { titre: 'Valeur moyenne', generate: L11, cours: C11, classe: 'Tle' },
  { titre: 'Défis : eˣ et ln', generate: L12, cours: C12, classe: 'Tle' },
];
export const OPTIONS = { need: 4, keys: { neg: true, comma: true } };

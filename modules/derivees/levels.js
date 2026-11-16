// Dérivées (1re spécialité) : 12 niveaux, du taux de variation jusqu'à l'exponentielle.
// Chaque fonction de l'énoncé est aussi construite comme une vraie fonction JavaScript (champ f) :
// les vérifications indépendantes (verify / value / truth) comparent la réponse attendue à une
// DÉRIVÉE NUMÉRIQUE de cette fonction (différences centrées + extrapolation de Richardson),
// ou échantillonnent f (variations, extremums) ; elles n'utilisent jamais les formules de dérivation.
// Visuels : la courbe et la tangente au point étudié ; le triangle de pente après la réponse.
import { ri, pick, nz, shuffle, chance } from '../../engine/util/rand.js';
import { numsCheck, choiceCheck, tableCheck } from '../../engine/answers/checks.js';
import { M, P, F, R, big, terms, sgn, xm, INF } from '../../engine/util/fmt.js';
import { r6, red } from '../../engine/util/arith.js';
import { I, fmtSet } from '../../engine/draw/realLine.js';
import { signTableHTML } from '../../engine/draw/plot.js';
import { graph, span, COL, rectangle, enclos, boite } from './draw.js';

/* ================= outils numériques ================= */
/** dérivée numérique : différences centrées, extrapolées (Richardson), erreur ≈ 1e-10 */
export const nd = (f, x, h = 1e-3) => { const D = k => (f(x + k) - f(x - k)) / (2 * k); return (4 * D(h / 2) - D(h)) / 3; };
const near = (a, b, t = 1e-6) => a !== null && b !== null && Math.abs(a - b) <= t * Math.max(1, Math.abs(a), Math.abs(b));
/** la fonction g (dérivée proposée) coïncide-t-elle avec la dérivée numérique de f aux points xs ? */
const sameDer = (f, g, xs) => xs.length >= 3 && xs.every(x => near(nd(f, x), g(x)));
const PTS = [-2.6, -1.7, -0.9, -0.35, 0.45, 1.2, 2.3, 3.1];
const POS = [0.35, 0.8, 1.45, 2.2, 3.3, 4.6];

/* ================= écriture ================= */
const PR = '′';                                              // prime
const xp = n => (n === 0 ? '' : n === 1 ? 'x' : `x<sup>${n}</sup>`);
/** polynôme c[0] + c[1]x + c[2]x² + … écrit par puissances décroissantes */
const ptex = c => terms(c.map((k, i) => [k, xp(i)]).reverse());
/** même polynôme, termes dans un ordre mélangé */
const ptexMix = c => terms(shuffle(c.map((k, i) => [k, xp(i)]).filter(t => t[0] !== 0)));
const pv = c => x => { let s = 0; for (let i = c.length - 1; i >= 0; i--) s = s * x + c[i]; return s; };
const pd = c => c.slice(1).map((k, i) => r6(k * (i + 1)));
const lin = (a, b) => terms([[a, 'x'], [b, '']]);
const sq = s => `(${s})<sup>2</sup>`;
/** nombre rationnel n/d écrit exactement : entier, ou fraction irréductible (pas « −0,666667 ») */
const qx = (n, d) => { const [p, q] = red(n, d); return q === 1 ? M(p) : (p < 0 ? '−' : '') + F(Math.abs(p), q); };
const EX = s => `e<sup>${s}</sup>`;
/** « + 3 » / « − 3 » dans une somme, rien si 0 */
const plus = n => (n === 0 ? '' : ' ' + sgn(n));
/** coefficient devant une expression : 1 → '', −1 → '−' */
const co = k => (k === 1 ? '' : k === -1 ? '−' : M(k));
/** facteur devant une parenthèse dans un calcul : 1 → '', négatif entre parenthèses */
const cp = k => (k === 1 ? '' : k < 0 ? `(${M(k)})` : M(k));
const DTPL = ['', `f${PR}(x) = {0} x + {1}`, `f${PR}(x) = {0} x<sup>2</sup> + {1} x + {2}`];
/** pas du triangle de pente pour que dx et dy tombent sur le quadrillage */
const stepFor = m => [1, 2, 4, 5, 10].find(k => Math.abs(m * k - Math.round(m * k)) < 1e-9);

/** check « cases » avec un message ciblé quand la réponse est fausse */
function chk(E, msg) {
  return numsCheck(E, { msg: v => (v.some(x => x === null) ? '' : msg ? msg(v) || '' : '') });
}

/* ================= dessins ================= */
/** morceaux de courbe sans traverser les valeurs interdites */
function pieces(f, xr, poles = [], from = -INF, l = 'y = f(x)', c) {
  const [lo, hi] = xr, cuts = poles.filter(p => p > lo && p < hi).sort((a, b) => a - b), out = [];
  let a = Math.max(lo, from);
  for (const p of cuts) { if (p - 0.02 > a) out.push([a, p - 0.02]); a = p + 0.02; }
  if (hi > a) out.push([a, hi]);
  return out.map((dom, i) => ({ f, dom, c, l: i === out.length - 1 ? l : '' }));
}
/**
 * courbe de f, avec éventuellement la tangente en a (pente m), le point A et le triangle de pente.
 * o = { f, xr, yr, poles, from, a, m, tan, tri, lab, lines, pts, band, fl }
 */
function scene(o) {
  const fs = pieces(o.f, o.xr, o.poles, o.from, o.fl === undefined ? 'y = f(x)' : o.fl, o.fc);
  const lines = [...(o.lines || [])], pts = [...(o.pts || [])];
  let tri;
  if (o.a !== undefined) {
    const ya = o.f(o.a);
    if (o.tan) lines.push({ x: o.a, y: ya, m: o.m, l: 'tangente T', c: COL.T });
    if (o.lab !== false) pts.push({ x: o.a, y: ya, l: o.lab || 'A', c: COL.S });
    if (o.tri === true && stepFor(o.m)) { const k = stepFor(o.m); tri = { x: o.a, y: ya, dx: k, dy: r6(o.m * k) }; }
  }
  if (o.tri && typeof o.tri === 'object') tri = o.tri;
  // le triangle part du point vers la droite : l'étiquette du point passe à gauche
  if (tri) pts.forEach(p => { if (Math.abs(p.x - tri.x) < 1e-9 && !p.anchor) p.anchor = tri.dx > 0 ? 'end' : 'start'; });
  return graph({ xr: o.xr, yr: o.yr, fs, lines, pts, tri, band: o.band });
}
/** fenêtre autour du point a (en x) et des ordonnées données */
const around = (xs, ys, mx = 2, my = 2, minx = 8, miny = 7) => ({ xr: span(xs, mx, minx), yr: span(ys, my, miny) });

/**
 * Fenêtre autour du point d'étude x0 quand la pente m peut être forte : plus la tangente est raide,
 * plus la fenêtre est étroite en x, et les ordonnées de la courbe (et du triangle de pente) y tiennent.
 */
function fenetre(f, x0, m, xsPlus = []) {
  const hw = Math.abs(m) > 2 ? Math.max(1, 6 / Math.abs(m)) : 3;
  const ys = [f(x0) + m];
  for (let i = 0; i <= 40; i++) { const v = f(x0 - hw + 2 * hw * i / 40); if (isFinite(v) && Math.abs(v) < 1e4) ys.push(v); }
  return around([x0 - hw, x0 + Math.max(hw, 1), ...xsPlus], ys, 0, 1, 6, 7);
}

/* =====================================================================
   1. Taux de variation, pente d'une sécante
   ===================================================================== */
function rateOf(c, a, b) { // formule : (b^i − a^i)/(b − a) = Σ a^j b^(i−1−j)
  let s = 0;
  for (let i = 1; i < c.length; i++) { let t = 0; for (let j = 0; j < i; j++) t += a ** j * b ** (i - 1 - j); s += c[i] * t; }
  return r6(s);
}
function L1(d) {
  let c, a, b;
  if (d < 1) { c = [0, 0, 1]; a = ri(0, 3); b = a + ri(1, 2); }
  else if (d < 2) { c = [ri(-4, 4), nz(-4, 4), 1]; a = ri(-3, 2); b = a + ri(1, 3); }
  else if (d < 3 || chance(0.5)) { c = [ri(-4, 4), ri(-4, 4), pick([-1, 2, -2])]; a = ri(-3, 2); b = a + ri(1, 3); }
  else { c = [ri(-3, 3), ri(-2, 2), 0, pick([1, -1])]; a = ri(-2, 1); b = a + ri(1, 2); }
  const f = pv(c), fa = f(a), fb = f(b), t = rateOf(c, a, b), dy = r6(fb - fa), dx = b - a;
  const W = around([a, b], [fa, fb, f((a + b) / 2)], 1, 1, 8, 7);
  const base = { f, ...W, lines: [{ x: a, y: fa, m: t, c: COL.S, l: 'sécante (AB)' }], pts: [{ x: a, y: fa, l: 'A', c: COL.S }, { x: b, y: fb, l: 'B', c: COL.S }] };
  return {
    type: 'nums', f,
    html: `Soit f(x) = ${ptex(c)}.<br>Calcule le <b>taux de variation</b> de f entre ${M(a)} et ${M(b)}, c'est-à-dire la pente de la sécante (AB).`,
    visual: scene(base), afterVisual: scene({ ...base, tri: { x: a, y: fa, dx, dy } }), replaceVisual: true,
    tpl: 'taux = {0}',
    check: chk([t], v => {
      if (near(v[0], dy) && dx !== 1) return `Tu as calculé f(${M(b)}) − f(${M(a)}) = ${M(dy)}. Il reste à <b>diviser</b> par ${M(b)} − ${P(a)} = ${dx}.`;
      if (t !== 0 && near(v[0], -t)) return 'Attention au signe : on fait (f(b) − f(a)) ÷ (b − a), dans le même ordre en haut et en bas.';
      if (dy !== 0 && near(v[0], r6(dx / dy))) return "C'est l'inverse : la variation de f en haut, la variation de x en bas.";
      return '';
    }),
    value: (fb - fa) / (b - a),
    hint: `Taux = <b>(f(b) − f(a)) ÷ (b − a)</b>. Calcule d'abord f(${M(a)}) et f(${M(b)}).`,
    solution: `f(${M(a)}) = ${M(fa)} et f(${M(b)}) = ${M(fb)}.<br>Taux = (${M(fb)} − ${P(fa)}) ÷ (${M(b)} − ${P(a)}) = ${M(dy)} ÷ ${dx} = <b>${M(t)}</b>.<br>Sur le graphique : de A à B, on avance de ${dx} et on ${dy === 0 ? 'reste à la même hauteur : la sécante est horizontale' : `${dy > 0 ? 'monte' : 'descend'} de ${M(Math.abs(dy))}`}.`,
  };
}
function C1() {
  const f = x => x * x;
  return `<h2>1. Taux de variation</h2>
<p class="intro">Le taux de variation dit de combien f augmente <b>en moyenne</b> quand x augmente de 1, entre deux valeurs a et b. C'est la première marche vers la dérivée.</p>
<div class="def">Le <b>taux de variation</b> de f entre a et b (a ≠ b) est<br><b>(f(b) − f(a)) ÷ (b − a)</b>.<br>C'est la <b>pente</b> (le coefficient directeur) de la <b>sécante</b> (AB), où A(a ; f(a)) et B(b ; f(b)) sont sur la courbe.<br>Taux positif : la sécante monte ; négatif : elle descend ; nul : elle est horizontale.</div>
<div class="methode"><b>Méthode</b><ol>
<li>Calcule f(a) et f(b), en mettant les nombres négatifs entre parenthèses.</li>
<li>Calcule la variation de f : f(b) − f(a).</li>
<li>Calcule la variation de x : b − a.</li>
<li>Divise la première par la deuxième, puis contrôle le signe sur la figure.</li></ol></div>
<div class="ex"><span class="q">Exemple 1 : f(x) = x<sup>2</sup>, entre 1 et 3.</span><br>f(1) = 1 et f(3) = 9.<br>Taux = (9 − 1) ÷ (3 − 1) = 8 ÷ 2 = <b>4</b>. De A à B, on avance de 2 et on monte de 8.</div>
${graph({ xr: [-2, 5], yr: [-1, 10], fs: [{ f, l: 'y = x²' }], lines: [{ x: 1, y: 1, m: 4, c: COL.S, l: 'sécante (AB)' }], pts: [{ x: 1, y: 1, l: 'A' }, { x: 3, y: 9, l: 'B', anchor: 'end' }], tri: { x: 1, y: 1, dx: 2, dy: 8 } })}
<div class="ex"><span class="q">Exemple 2 : f(x) = −2x<sup>2</sup> + 3x + 1, entre −1 et 2.</span><br>f(−1) = −2 × (−1)<sup>2</sup> + 3 × (−1) + 1 = −2 − 3 + 1 = −4.<br>f(2) = −2 × 4 + 6 + 1 = −1.<br>Taux = (−1 − (−4)) ÷ (2 − (−1)) = 3 ÷ 3 = <b>1</b>.</div>
<div class="warn">⚠️ Même ordre en haut et en bas : (f(b) − f(a)) ÷ (b − a). Avec (f(a) − f(b)) ÷ (b − a), on se trompe de signe.<br>⚠️ Ne pas oublier de <b>diviser</b> par b − a ! Et pas l'inverse : la variation de f va en haut.<br>⚠️ (−1)<sup>2</sup> = 1, mais −2 × (−1)<sup>2</sup> = −2 : le carré passe avant la multiplication.</div>
<div class="retenir">À retenir : taux de variation = (f(b) − f(a)) ÷ (b − a) = pente de la sécante (AB).</div>`;
}

/* =====================================================================
   2. Nombre dérivé lu sur un graphique (pente de la tangente)
   ===================================================================== */
// Formes de base g(t) ; la courbe est f(x) = s·g(x − h) + k. ts : abscisses (relatives) où les pentes sont lisibles.
const FAM = [
  { id: 'Q4', g: t => t * t / 4, dg: t => t / 2, ts: [-4, -2, 2, 4], z: [0], lv: 0 },
  { id: 'Q2', g: t => t * t / 2, dg: t => t, ts: [-2, 2], z: [0], lv: 0 },
  { id: 'Q1', g: t => t * t, dg: t => 2 * t, ts: [-1, 1], z: [0], lv: 1 },
  { id: 'C3', g: t => (t ** 3 - 3 * t) / 2, dg: t => (3 * t * t - 3) / 2, ts: [0], z: [-1, 1], lv: 2 },
  { id: 'C12', g: t => 3 * t - t ** 3 / 4, dg: t => 3 - 3 * t * t / 4, ts: [0], z: [-2, 2], lv: 2 },
  { id: 'H2', g: t => 2 / t, dg: t => -2 / (t * t), ts: [-2, -1, 1, 2], z: [], lv: 3, pole: true },
  { id: 'H4', g: t => 4 / t, dg: t => -4 / (t * t), ts: [-4, -2, 2, 4], z: [], lv: 4, pole: true },
  { id: 'S', g: t => 2 * Math.sqrt(t), dg: t => 1 / Math.sqrt(t), ts: [1, 4], z: [], lv: 4, root: true },
];
/** une courbe tirée dans les familles, avec un point A(a ; f(a)) à coordonnées entières */
function readable(d, o = {}) {
  let av = FAM.filter(F => F.lv <= Math.min(d, 4) && (!o.only || o.only.includes(F.id)));
  const top = av.filter(F => F.lv === Math.max(...av.map(G => G.lv)));
  const Fm = top.length && chance(0.5) ? pick(top) : pick(av);
  const s = d < 1 ? 1 : pick([1, -1]);
  const t = pick(d >= 1 ? [...Fm.ts, ...Fm.z] : Fm.ts);
  const a = ri(-2, 2), fa = ri(-2, 2), h = a - t, k = fa - s * Fm.g(t);
  const f = Fm.root ? x => (x - h >= 0 ? s * Fm.g(x - h) + k : NaN) : x => s * Fm.g(x - h) + k;
  const m = r6(s * Fm.dg(t));
  const xs = [a - 3, a + 3]; if (Fm.root || Fm.pole) xs.push(h);
  const W = around(xs, [fa - 3, fa + 3], 0, 0, 8, 7);
  return { f, a, fa, m, poles: Fm.pole ? [h] : [], from: Fm.root ? h : -INF, ...W, fam: Fm.id };
}
function L2(d) {
  const C = readable(d), { f, a, fa, m } = C, k = stepFor(m) || 1;
  const sc = { f, xr: C.xr, yr: C.yr, poles: C.poles, from: C.from, a, m, tan: true };
  return {
    type: 'nums', f,
    html: `Voici la courbe de f et sa <b>tangente T</b> au point A d'abscisse ${M(a)}.<br>Lis le <b>nombre dérivé</b> f${PR}(${M(a)}).`,
    visual: scene(sc), afterVisual: scene({ ...sc, tri: true }), replaceVisual: true,
    tpl: `f${PR}(${M(a)}) = {0}`,
    check: chk([m], v => {
      if (near(v[0], fa) && fa !== m) return `${M(fa)}, c'est f(${M(a)}) : la <b>hauteur</b> du point A. Le nombre dérivé f${PR}(${M(a)}) est la <b>pente</b> de la tangente.`;
      if (m !== 0 && near(v[0], -m)) return `Attention au signe : la tangente ${m > 0 ? 'monte' : 'descend'} quand on va vers la droite.`;
      if (m !== 0 && near(v[0], r6(1 / m))) return 'Pente = déplacement vertical ÷ déplacement horizontal (pas l\'inverse).';
      return '';
    }),
    value: r6(nd(f, a)),
    hint: `f${PR}(${M(a)}) est la <b>pente de la tangente T</b>. Pars de A, avance de ${k} carreau${k > 1 ? 'x' : ''} vers la droite en suivant T, et compte de combien elle monte (+) ou descend (−). Puis divise par ${k}.`,
    solution: m === 0 ? `La tangente en A est <b>horizontale</b> : sa pente est nulle, donc f${PR}(${M(a)}) = <b>0</b>.`
      : `En partant de A(${M(a)} ; ${M(fa)}), quand on avance de ${k}, la tangente ${m > 0 ? 'monte' : 'descend'} de ${M(Math.abs(m * k))}.<br>f${PR}(${M(a)}) = ${M(r6(m * k))} ÷ ${k} = <b>${M(m)}</b>.`,
  };
}
function C2() {
  const f = x => x * x / 2;
  const g = x => x * x / 4;
  return `<h2>2. Nombre dérivé et tangente</h2>
<p class="intro">Le nombre dérivé mesure la pente de la courbe <b>en un point précis</b> : il dit à quelle vitesse f monte ou descend juste à cet endroit.</p>
<div class="def">Quand B se rapproche de A sur la courbe, la sécante (AB) tourne et se rapproche d'une droite limite : la <b>tangente</b> à la courbe en A.<br>Sa pente s'appelle le <b>nombre dérivé</b> de f en a, noté <b>f${PR}(a)</b>.</div>
<div class="methode"><b>Méthode</b> pour lire f${PR}(a) sur un graphique<ol>
<li>Repère le point A de la courbe et la tangente T qui passe par A.</li>
<li>Pars de A et avance vers la droite en suivant T, jusqu'à un point de T placé sur un nœud du quadrillage (1, 2 ou 4 carreaux).</li>
<li>Compte de combien T monte (+) ou descend (−).</li>
<li>f${PR}(a) = déplacement vertical ÷ déplacement horizontal.</li></ol></div>
<div class="cols">
<div><div class="ex"><span class="q">Exemple 1 : la tangente monte.</span><br>En A(2 ; 2), on avance de 1 : T monte de 2.<br><b>f${PR}(2) = 2 ÷ 1 = 2</b>.</div>
${graph({ xr: [-3, 5], yr: [-2, 7], fs: [{ f, l: 'y = f(x)' }], lines: [{ x: 2, y: 2, m: 2, l: 'tangente T', c: COL.T }], pts: [{ x: 2, y: 2, l: 'A', anchor: 'end' }], tri: { x: 2, y: 2, dx: 1, dy: 2 } })}</div>
<div><div class="ex"><span class="q">Exemple 2 : la tangente descend.</span><br>En A(−2 ; 1), on avance de 1 : T descend de 1.<br><b>f${PR}(−2) = −1 ÷ 1 = −1</b>.</div>
${graph({ xr: [-5, 3], yr: [-2, 6], fs: [{ f: g, l: 'y = g(x)' }], lines: [{ x: -2, y: 1, m: -1, l: 'tangente T', c: COL.T }], pts: [{ x: -2, y: 1, l: 'A', anchor: 'end' }], tri: { x: -2, y: 1, dx: 1, dy: -1 } })}</div>
</div>
<div class="ex"><span class="q">Cas particulier :</span> au sommet d'une parabole ou en haut d'une « bosse », la tangente est <b>horizontale</b> : f${PR}(a) = 0.</div>
<div class="warn">⚠️ f(a) est la <b>hauteur</b> du point A ; f${PR}(a) est la <b>pente</b> de la tangente. Ce n'est pas la même chose !<br>⚠️ Tangente qui descend → f${PR}(a) &lt; 0. Tangente horizontale → f${PR}(a) = 0.<br>⚠️ Pente = vertical ÷ horizontal, pas l'inverse.</div>
<div class="retenir">À retenir : f${PR}(a) est la pente de la tangente à la courbe au point d'abscisse a.</div>`;
}

/* =====================================================================
   3. Nombre dérivé par la limite du taux d'accroissement
   ===================================================================== */
function L3(d) {
  let c, a, cub = false;
  if (d < 1) { c = [0, 0, 1]; a = ri(1, 4); }
  else if (d < 2) { c = [0, chance(0.5) ? nz(-4, 4) : 0, 1]; a = nz(-4, 4); }
  else if (d < 4 || chance(0.5)) { c = [ri(-5, 5), ri(-4, 4), pick([2, 3, -1, -2])]; a = nz(-3, 3); }
  else { cub = true; c = [ri(-3, 3), ri(-3, 3), 0, 1]; a = nz(-2, 2); }
  const f = pv(c), fa = f(a), ah = a < 0 ? `${M(a)} + h` : `${a} + h`;
  const k1 = cub ? 3 * a * a + c[1] : 2 * c[2] * a + c[1], k2 = cub ? 3 * a : c[2];
  const E = [k1, k2, k1];
  const tail = cub ? ' + h<sup>3</sup>' : '';
  const tpl = `<div class="stepline">f(${ah}) − f(${M(a)}) = {0} h + {1} h<sup>2</sup>${tail}</div><div class="stepline">Quand h tend vers 0 : f${PR}(${M(a)}) = {2}</div>`;
  // développement détaillé pour la correction
  let dev;
  if (cub) dev = `(${ah})<sup>3</sup> = ${M(a ** 3)} ${sgn(3 * a * a)}h ${sgn(3 * a)}h<sup>2</sup> + h<sup>3</sup>`;
  else dev = `(${ah})<sup>2</sup> = ${M(a * a)} ${sgn(2 * a)}h + h<sup>2</sup>`;
  const W = around([a - 1, a + 2], [fa - 2, fa + 2, f(a + 1), fa + k1], 1, 1, 8, 7);
  const sc = { f, ...W, a, m: k1, lines: [{ x: a, y: fa, m: r6(f(a + 1) - fa), c: COL.S, dash: true, l: 'sécante (AM)' }], pts: [{ x: a + 1, y: f(a + 1), l: 'M', c: COL.S }] };
  return {
    type: 'steps', f,
    html: `Soit f(x) = ${ptex(c)}.<br>Calcule f${PR}(${M(a)}) avec le <b>taux d'accroissement</b> ${big(`<span class="frac"><span>f(${ah}) − f(${M(a)})</span><span>h</span></span>`)}<span class="note">Développe f(${ah}) − f(${M(a)}), divise par h, puis fais tendre h vers 0.</span>`,
    visual: scene(sc), afterVisual: scene({ ...sc, lines: [], pts: [], tan: true, tri: true }), replaceVisual: true,
    tpl,
    check: (() => {
      const fn = v => {
        if (v.some(x => x === null)) return { ok: false };
        if (near(v[0], E[0]) && near(v[1], E[1]) && near(v[2], E[2])) return { ok: true };
        if (!(near(v[0], E[0]) && near(v[1], E[1]))) return { ok: false, bad: [0, 1].filter(i => !near(v[i], E[i])), msg: "Erreur dans le développement de f(a + h) − f(a) (1<sup>re</sup> ligne)." };
        let msg = 'La 1<sup>re</sup> ligne est juste : divise par h, puis fais tendre h vers 0.';
        if (near(v[2], k1 + k2 + (cub ? 1 : 0))) msg = 'Tu as remplacé h par 1. Mais h <b>tend vers 0</b> : les termes en h disparaissent.';
        else if (near(v[2], fa)) msg = `${M(fa)}, c'est f(${M(a)}), pas f${PR}(${M(a)}).`;
        return { ok: false, bad: [2], msg };
      };
      fn.expected = E; return fn;
    })(),
    value: r6(nd(f, a)),
    verify: Ev => [1, 0.5, -0.25, 2, -1.5].every(h => near(f(a + h) - f(a), Ev[0] * h + Ev[1] * h * h + (cub ? h ** 3 : 0))) && near(Ev[2], nd(f, a)),
    hint: `Développe : ${dev}. Les termes sans h s'en vont dans la différence f(${ah}) − f(${M(a)}).`,
    solution: `${dev}.<br>f(${ah}) − f(${M(a)}) = <b>${terms([[k1, 'h'], [k2, 'h<sup>2</sup>'], [cub ? 1 : 0, 'h<sup>3</sup>']])}</b>.<br>On divise par h : ${terms([[k1, ''], [k2, 'h'], [cub ? 1 : 0, 'h<sup>2</sup>']])}.<br>Quand h tend vers 0, ${cub ? 'les termes en h et h<sup>2</sup> tendent' : 'le terme en h tend'} vers 0 : <b>f${PR}(${M(a)}) = ${M(k1)}</b>.`,
  };
}
function C3() {
  const f = x => x * x;
  return `<h2>3. Le nombre dérivé par le calcul</h2>
<p class="intro">Sans graphique, on calcule f${PR}(a) exactement : on prend un point M très proche de A et on regarde ce que devient la pente de la sécante (AM).</p>
<div class="def">f${PR}(a) est la <b>limite</b>, quand h tend vers 0, du taux d'accroissement<br><span class="frac"><span>f(a + h) − f(a)</span><span>h</span></span>.<br>C'est la pente de la sécante entre A et le point M d'abscisse a + h, quand M glisse jusqu'à A.</div>
<div class="methode"><b>Méthode</b><ol>
<li>Calcule f(a).</li>
<li>Écris f(a + h) en remplaçant x par (a + h), puis développe :<br>(a + h)<sup>2</sup> = a<sup>2</sup> + 2ah + h<sup>2</sup> ; (a + h)<sup>3</sup> = a<sup>3</sup> + 3a<sup>2</sup>h + 3ah<sup>2</sup> + h<sup>3</sup>.</li>
<li>Retranche f(a) : il ne reste que des termes en h, h<sup>2</sup>, h<sup>3</sup>.</li>
<li>Divise par h.</li>
<li>Fais tendre h vers 0 : les termes qui contiennent encore h disparaissent.</li></ol></div>
<div class="ex"><span class="q">Exemple 1 : f(x) = x<sup>2</sup> et a = 3.</span><br>f(3 + h) − f(3) = (9 + 6h + h<sup>2</sup>) − 9 = <b>6h + h<sup>2</sup></b>.<br>On divise par h : 6 + h. Quand h tend vers 0 : <b>f${PR}(3) = 6</b>.</div>
<div class="ex"><span class="q">Exemple 2 : f(x) = −2x<sup>2</sup> + x et a = −1.</span><br>f(−1) = −2 × 1 + (−1) = −3.<br>f(−1 + h) = −2(1 − 2h + h<sup>2</sup>) + (−1 + h) = −3 + 5h − 2h<sup>2</sup>.<br>f(−1 + h) − f(−1) = <b>5h − 2h<sup>2</sup></b>. On divise par h : 5 − 2h.<br>Quand h tend vers 0 : <b>f${PR}(−1) = 5</b>.</div>
<div class="warn">⚠️ On ne remplace pas h par 1 : h devient <b>aussi petit qu'on veut</b>, donc « 6 + h » tend vers 6.<br>⚠️ (3 + h)<sup>2</sup> = 9 + 6h + h<sup>2</sup>, et pas 9 + h<sup>2</sup> (identité remarquable).<br>⚠️ f${PR}(a) n'est pas f(a) : à la fin, il ne reste que le terme « sans h » du quotient.</div>
${graph({ xr: [-1, 5], yr: [-1, 17], fs: [{ f, l: 'y = x²' }], lines: [{ x: 3, y: 9, m: 7, c: COL.S, dash: true, l: 'sécante (AM)' }, { x: 3, y: 9, m: 6, c: COL.T, l: 'T' }], pts: [{ x: 3, y: 9, l: 'A', anchor: 'end' }, { x: 4, y: 16, l: 'M', anchor: 'end' }] })}
<p class="note">Sur la figure : avec h = 1, la sécante (AM) a pour pente 6 + 1 = 7 ; quand M glisse vers A, cette pente tend vers 6, la pente de la tangente T.</p>
<div class="retenir">À retenir : développe f(a + h) − f(a), divise par h, puis fais tendre h vers 0.</div>`;
}

/* =====================================================================
   4. Équation de la tangente
   ===================================================================== */
function L4(d) {
  const kind = d < 2 ? 'num' : d < 3 ? 'expr' : pick(['expr', 'graph', 'graph']);
  let f, a, fa, m, html, W, poles = [], from = -INF, showTan = false, bb = 0;
  if (kind === 'num') {
    a = d < 1 ? ri(1, 3) : nz(-3, 3); m = d < 1 ? nz(-3, 3) : ri(-3, 3); fa = ri(-4, 4);
    const al = pick([0.5, -0.5, 1, -1]);
    f = x => al * (x - a) ** 2 + m * (x - a) + fa;
    html = `On sait que <b>f(${M(a)}) = ${M(fa)}</b> et <b>f${PR}(${M(a)}) = ${M(m)}</b>.<br>Donne l'équation réduite de la tangente T à la courbe de f au point d'abscisse ${M(a)}.`;
    W = around([a - 3, a + 3], [fa - 3, fa + 3], 0, 0, 8, 7);
  } else if (kind === 'expr') {
    const b = ri(-4, 4), c = ri(-4, 4); a = nz(-3, 3); bb = b;
    f = pv([c, b, 1]); fa = f(a); m = 2 * a + b;
    html = `Soit f(x) = ${ptex([c, b, 1])}. On admet que <b>f${PR}(x) = ${lin(2, b)}</b>.<br>Donne l'équation réduite de la tangente T au point d'abscisse ${M(a)}.`;
    W = around([a - 3, a + 3], [fa - 3, fa + 3], 0, 0, 8, 7);
  } else {
    let C; do { C = readable(Math.min(d, 3), { only: ['Q4', 'Q2', 'Q1', 'H2'] }); } while (!Number.isInteger(C.m));
    ({ f, a, fa, m, poles, from } = C); W = { xr: C.xr, yr: C.yr }; showTan = true;
    html = `Voici la courbe de f et sa tangente T au point A.<br>Lis f(${M(a)}) et f${PR}(${M(a)}), puis donne l'équation réduite de T.`;
  }
  const b0 = r6(fa - m * a);
  const sc = { f, ...W, poles, from, a, m, tan: showTan };
  return {
    type: 'nums', f,
    html: html + `<br><span class="note">Forme y = mx + p (tape 0 si un nombre est nul).</span>`,
    visual: scene(sc), afterVisual: scene({ ...sc, tan: true, tri: true }), replaceVisual: true,
    tpl: 'T : y = {0} x + {1}',
    check: chk([m, b0], v => {
      if (near(v[0], m) && near(v[1], fa) && fa !== b0) return `La pente est juste ! Mais p n'est pas f(${M(a)}) : développe ${M(m)}(${xm(a)}) ${sgn(fa)}.`;
      if (near(v[0], m) && near(v[1], r6(fa + m * a))) return `La pente est juste. Attention au signe : y = f${PR}(a)(x − a) + f(a), donc on <b>retranche</b> ${M(m)} × ${P(a)}.`;
      if (near(v[0], fa) && near(v[1], m) && fa !== m) return `Tu as inversé : le coefficient de x est la pente f${PR}(${M(a)}).`;
      if (near(v[0], m)) return 'La pente est juste : vérifie la constante p.';
      return '';
    }),
    verify: Ev => near(Ev[0] * a + Ev[1], f(a)) && near(Ev[0], nd(f, a)),
    hint: `T : <b>y = f${PR}(a)(x − a) + f(a)</b>. ${kind === 'expr' ? `Calcule f(${M(a)}) et f${PR}(${M(a)}) = 2 × ${P(a)} ${sgn(bb)}, `: kind === 'graph' ? 'Lis la hauteur de A et la pente de T, ' : ''}remplace, puis développe.`,
    solution: `${kind === 'expr' ? `f(${M(a)}) = ${M(fa)} et f${PR}(${M(a)}) = ${M(m)}.<br>` : kind === 'graph' ? `On lit f(${M(a)}) = ${M(fa)} (hauteur de A) et f${PR}(${M(a)}) = ${M(m)} (pente de T).<br>` : ''}y = ${M(m)}(${xm(a)}) ${sgn(fa)} = ${terms([[m, 'x'], [r6(-m * a), '']])} ${sgn(fa)}, donc <b>y = ${terms([[m, 'x'], [b0, '']])}</b>.`,
  };
}
function C4() {
  const f = x => x * x / 2;
  return `<h2>4. Équation de la tangente</h2>
<p class="intro">La tangente est une droite : on peut donc écrire son équation y = mx + p. Elle sert à approcher la courbe près du point A.</p>
<div class="def">La tangente à la courbe de f au point d'abscisse a passe par A(a ; f(a)) et a pour pente f${PR}(a) :<br><b>y = f${PR}(a)(x − a) + f(a)</b></div>
<div class="methode"><b>Méthode</b><ol>
<li>Trouve f(a) : par le calcul, ou en lisant la <b>hauteur</b> de A.</li>
<li>Trouve f${PR}(a) : avec la formule de f${PR}, ou en lisant la <b>pente</b> de T.</li>
<li>Remplace dans y = f${PR}(a)(x − a) + f(a).</li>
<li>Développe et réduis : y = mx + p.</li>
<li>Vérifie : pour x = a, on doit retrouver y = f(a).</li></ol></div>
<div class="cols">
<div class="ex"><span class="q">Exemple 1 : f(2) = 2 et f${PR}(2) = 2.</span><br>y = 2(x − 2) + 2 = 2x − 4 + 2, donc <b>y = 2x − 2</b>.<br>Vérification : pour x = 2, y = 4 − 2 = 2 = f(2). ✔</div>
${graph({ xr: [-3, 5], yr: [-3, 7], fs: [{ f, l: 'y = f(x)' }], lines: [{ x: 2, y: 2, m: 2, l: 'tangente T', c: COL.T }], pts: [{ x: 2, y: 2, l: 'A(2 ; 2)', anchor: 'end' }, { x: 0, y: -2, l: '−2', c: COL.T }] })}
</div>
<div class="ex"><span class="q">Exemple 2 : f(x) = x<sup>2</sup> + 2x − 1, avec f${PR}(x) = 2x + 2, en a = −3.</span><br>f(−3) = 9 − 6 − 1 = 2 et f${PR}(−3) = 2 × (−3) + 2 = −4.<br>y = −4(x + 3) + 2 = −4x − 12 + 2, donc <b>y = −4x − 10</b>.<br>Vérification : pour x = −3, y = 12 − 10 = 2. ✔</div>
<div class="warn">⚠️ y = f${PR}(a)(x <b>−</b> a) + f(a) : avec a = −3, on écrit (x + 3).<br>⚠️ La constante p n'est pas f(a) : il faut développer.<br>⚠️ Le coefficient de x est la <b>pente</b> f${PR}(a), pas f(a) : ne les inverse pas.</div>
<div class="retenir">À retenir : T : y = f${PR}(a)(x − a) + f(a), puis on développe.</div>`;
}

/* =====================================================================
   5. Dérivées usuelles
   ===================================================================== */
function L5(d) {
  let kind;
  if (d < 1) kind = pick(['const', 'x', 'p2']);
  else if (d < 2) kind = 'pn';
  else if (d < 3) kind = pick(['inv', 'sqrt']);
  else kind = chance(0.5) ? 'val' : pick(['const', 'pn', 'inv', 'sqrt']);
  let f, tex, tpl, E, g, xs = PTS, msg, sol, poles = [], from = -INF, x0 = 1, n = 2, value, html;
  const head = t => `Soit f(x) = ${t}.<br>Donne la fonction dérivée f${PR}(x).`;
  if (kind === 'const') {
    const k = nz(-9, 9); f = () => k; tex = M(k); tpl = `f${PR}(x) = {0}`; E = [0]; g = Ev => () => Ev[0];
    msg = v => (near(v[0], k) ? 'La courbe d\'une constante est une droite <b>horizontale</b> : sa pente est 0.' : '');
    sol = `f est constante : sa courbe est horizontale, de pente nulle. <b>f${PR}(x) = 0</b>.`;
  } else if (kind === 'x') {
    f = x => x; tex = 'x'; tpl = `f${PR}(x) = {0}`; E = [1]; g = Ev => () => Ev[0];
    msg = v => (near(v[0], 0) ? 'La droite y = x monte de 1 quand on avance de 1 : sa pente est 1.' : '');
    sol = `La courbe de f est la droite y = x, de pente 1 : <b>f${PR}(x) = 1</b>.`;
  } else if (kind === 'p2') {
    f = x => x * x; tex = 'x<sup>2</sup>'; tpl = `f${PR}(x) = {0} x`; E = [2]; g = Ev => x => Ev[0] * x;
    msg = v => (near(v[0], 1) ? '(x<sup>2</sup>)' + PR + ' n\'est pas x : l\'exposant 2 descend devant.' : '');
    sol = `(x<sup>n</sup>)${PR} = n x<sup>n − 1</sup> avec n = 2 : <b>f${PR}(x) = 2x</b>.`;
  } else if (kind === 'pn') {
    n = ri(3, 6); f = x => x ** n; tex = xp(n);
    tpl = `f${PR}(x) = k x<sup>p</sup> &nbsp; avec &nbsp; k = {0} &nbsp; p = {1}`; E = [n, n - 1]; g = Ev => x => Ev[0] * x ** Ev[1];
    msg = v => (near(v[0], n) && near(v[1], n) ? 'Le coefficient est bon, mais l\'exposant <b>baisse de 1</b>.' : near(v[0], 1) && near(v[1], n - 1) ? `L'exposant descend <b>devant</b> : le coefficient est ${n}.` : '');
    sol = `(x<sup>n</sup>)${PR} = n x<sup>n − 1</sup> avec n = ${n} : <b>f${PR}(x) = ${n}x<sup>${n - 1}</sup></b> (k = ${n}, p = ${n - 1}).`;
  } else if (kind === 'inv') {
    f = x => 1 / x; tex = F(1, 'x'); tpl = `f${PR}(x) = ${F('{0}', 'x<sup>2</sup>')}`; E = [-1]; g = Ev => x => Ev[0] / (x * x); xs = [...POS, -0.7, -1.9]; poles = [0];
    msg = v => (near(v[0], 1) ? `⚠️ (1/x)${PR} = <b>−</b>1/x<sup>2</sup> : la fonction inverse est décroissante, sa dérivée est négative.` : '');
    sol = `<b>f${PR}(x) = −${F(1, 'x<sup>2</sup>')}</b> pour x ≠ 0 (toujours négatif : 1/x est décroissante sur chaque intervalle).`;
  } else if (kind === 'sqrt') {
    f = x => Math.sqrt(x); tex = R('x'); tpl = `f${PR}(x) = ${F('{0}', `{1} ${R('x')}`)}`; E = [1, 2]; g = Ev => x => Ev[0] / (Ev[1] * Math.sqrt(x)); xs = POS; from = 0;
    sol = `<b>f${PR}(x) = ${F(1, '2' + R('x'))}</b> pour x &gt; 0 (√x n'est pas dérivable en 0 : tangente verticale).`;
  }
  if (kind === 'val') {
    const sub = pick(['pn', 'pn', 'inv', 'sqrt']);
    let a, val, form;
    if (sub === 'pn') { n = ri(2, 4); a = nz(-3, 3); f = x => x ** n; tex = xp(n); val = n * a ** (n - 1); form = `${n === 2 ? '2x' : `${n}x<sup>${n - 1}</sup>`}`; }
    else if (sub === 'inv') { a = pick([-5, -2, -1, 1, 2, 5, 10]); f = x => 1 / x; tex = F(1, 'x'); val = r6(-1 / (a * a)); form = `−${F(1, 'x<sup>2</sup>')}`; poles = [0]; }
    else { a = pick([1, 4, 16, 25, 100]); f = x => Math.sqrt(x); tex = R('x'); val = r6(1 / (2 * Math.sqrt(a))); form = F(1, '2' + R('x')); from = 0; }
    x0 = a;
    html = `Soit f(x) = ${tex}.<br>Calcule le nombre dérivé f${PR}(${M(a)}).`;
    tpl = `f${PR}(${M(a)}) = {0}`; E = [val]; value = r6(nd(f, a));
    msg = v => (near(v[0], f(a)) && f(a) !== val ? `${M(r6(f(a)))}, c'est f(${M(a)}). Calcule d'abord f${PR}(x), puis remplace x par ${M(a)}.` : sub === 'inv' && near(v[0], -val) ? '⚠️ (1/x)' + PR + ' = −1/x<sup>2</sup> : n\'oublie pas le signe moins.' : '');
    sol = `f${PR}(x) = ${form}, donc f${PR}(${M(a)}) = <b>${M(val)}</b>.`;
    g = null;
  } else {
    html = head(tex);
    x0 = kind === 'inv' ? 1 : kind === 'sqrt' ? 1 : pick([-1, 1]);
  }
  const fx0 = f(x0), mx0 = r6(nd(f, x0));
  const big0 = Math.abs(x0) > 6;
  const W = big0 ? around([0, x0 + 5], [fx0 - 2, fx0 + 2], 1, 1, 8, 6) : around([x0 - 3, x0 + 3], [fx0 - 3, fx0 + 3], 0, 0, 8, 7);
  const sc = { f, ...W, poles, from, a: x0, m: mx0, lab: kind === 'val' ? 'A' : false };
  return {
    type: 'nums', f, html, tpl,
    visual: scene(sc), afterVisual: scene({ ...sc, tan: true, tri: !big0, lab: 'A' }), replaceVisual: true,
    check: kind === 'sqrt' ? (() => {
      const fn = v => {
        if (v.some(x => x === null)) return { ok: false };
        if (v[1] !== 0 && near(v[0] / v[1], 0.5)) return { ok: true, msg: near(v[0], 1) ? '' : `Juste, mais on écrit plus simplement ${F(1, '2' + R('x'))}.` };
        return { ok: false, msg: near(v[0] / v[1], 1) || near(v[0] / v[1], 2) ? `Presque : (√x)${PR} = ${F(1, '2' + R('x'))}, avec un 2 en bas.` : '' };
      };
      fn.expected = E; return fn;
    })() : chk(E, msg),
    value,
    verify: g ? Ev => sameDer(f, g(Ev), xs) : undefined,
    hint: `Dérivées à connaître : (k)${PR} = 0 ; (x)${PR} = 1 ; (x<sup>n</sup>)${PR} = n x<sup>n − 1</sup> ; (1/x)${PR} = −1/x<sup>2</sup> ; (√x)${PR} = 1/(2√x).`,
    solution: sol + (kind !== 'val' ? `<br>Sur le graphique : la pente de la tangente en x = ${M(x0)} vaut f${PR}(${M(x0)}) = ${M(mx0)}.` : ''),
  };
}
function C5() {
  return `<h2>5. Dérivées usuelles</h2>
<p class="intro">Plutôt que de recalculer une limite à chaque fois, on apprend une fois pour toutes les dérivées des fonctions de référence.</p>
<div class="def">La <b>fonction dérivée</b> f${PR} associe à chaque x le nombre dérivé f${PR}(x).<br>
<table class="data" style="margin:6px auto"><tr><th>f(x)</th><td>k (constante)</td><td>x</td><td>x<sup>2</sup></td><td>x<sup>n</sup></td><td>${F(1, 'x')}</td><td>${R('x')}</td></tr>
<tr><th>f${PR}(x)</th><td>0</td><td>1</td><td>2x</td><td>n x<sup>n − 1</sup></td><td>−${F(1, 'x<sup>2</sup>')}</td><td>${F(1, '2' + R('x'))}</td></tr></table></div>
<p class="note">La formule de (1/x)${PR} est valable pour x ≠ 0, celle de (√x)${PR} pour x &gt; 0 (√x n'est pas dérivable en 0).</p>
<div class="methode"><b>Méthode</b><ol>
<li>Reconnais la forme de f dans le tableau.</li>
<li>Applique la formule : pour x<sup>n</sup>, l'exposant n descend devant et l'exposant baisse de 1.</li>
<li>Si on demande un nombre dérivé f${PR}(a) : calcule d'abord f${PR}(x), puis remplace x par a.</li></ol></div>
<div class="ex"><span class="q">Exemple 1 : f(x) = x<sup>5</sup>.</span><br>n = 5 : <b>f${PR}(x) = 5x<sup>4</sup></b> (coefficient 5, exposant 4).</div>
<div class="ex"><span class="q">Exemple 2 : des nombres dérivés.</span><br>f(x) = x<sup>3</sup> : f${PR}(x) = 3x<sup>2</sup>, donc f${PR}(−2) = 3 × (−2)<sup>2</sup> = <b>12</b>.<br>f(x) = ${F(1, 'x')} : f${PR}(−2) = −${F(1, '(−2)<sup>2</sup>')} = −${F(1, 4)} = <b>−0,25</b> (toujours négatif).<br>f(x) = ${R('x')} : f${PR}(4) = ${F(1, '2 × 2')} = <b>0,25</b>, ce que montre la figure.</div>
${graph({ xr: [-1, 5], yr: [-1, 4], fs: [{ f: x => (x >= 0 ? Math.sqrt(x) : NaN), dom: [0, 5], l: 'y = √x' }], lines: [{ x: 4, y: 2, m: 0.25, l: 'tangente T', c: COL.T }], pts: [{ x: 4, y: 2, l: 'A', anchor: 'end', ly: -14 }, { x: 0, y: 1, c: COL.T }], tri: { x: 0, y: 1, dx: 4, dy: 1 } })}
<div class="warn">⚠️ (1/x)${PR} = <b>−</b>1/x<sup>2</sup> : n'oublie pas le signe moins (la fonction inverse est décroissante).<br>⚠️ (x<sup>3</sup>)${PR} = 3x<sup>2</sup> : l'exposant descend devant <b>et</b> baisse de 1.<br>⚠️ La dérivée d'une constante est 0 (droite horizontale), et (x)${PR} = 1, pas 0.</div>
<div class="retenir">À retenir : (x<sup>n</sup>)${PR} = n x<sup>n − 1</sup> ; (1/x)${PR} = −1/x<sup>2</sup> ; (√x)${PR} = 1/(2√x).</div>`;
}

/* =====================================================================
   6. Somme, produit par une constante : polynômes
   ===================================================================== */
function L6(d) {
  let c, tex, tpl, E, f, g, msg, sol, xs = PTS, poles = [], ctex = i => co(c[i]);
  if (d < 2) {
    c = [ri(-9, 9), nz(-6, 6), nz(-5, 5)]; if (d >= 1 && chance(0.4)) c[1] = 0;
    tex = d < 1 ? ptex(c) : ptexMix(c); tpl = DTPL[1]; E = pd(c).reverse(); f = pv(c); g = Ev => pv([Ev[1], Ev[0]]);
  } else if (d < 3) {
    c = [ri(-9, 9), ri(-6, 6), ri(-5, 5), nz(-4, 4)];
    tex = ptexMix(c); tpl = DTPL[2]; E = pd(c).reverse(); f = pv(c); g = Ev => pv([Ev[2], Ev[1], Ev[0]]);
  } else if (d < 4 || chance(0.5)) {
    // coefficients fractionnaires : (p/3)x³ + (q/2)x² + rx + s
    const p = pick([1, 2, 4, 5, -1, -2, -4]), q = pick([1, 3, 5, -1, -3]), r = ri(-6, 6), s = ri(-5, 5);
    c = [s, r, q / 2, p / 3];
    const fr = (num, den, v, first) => `${num < 0 ? (first ? '−' : ' − ') : first ? '' : ' + '}${F(Math.abs(num), den)}${v}`;
    tex = fr(p, 3, 'x<sup>3</sup>', true) + fr(q, 2, 'x<sup>2</sup>', false) + (r ? ' ' + (r < 0 ? '− ' : '+ ') + co(Math.abs(r)) + 'x' : '') + plus(s);
    ctex = i => (i === 3 ? (p < 0 ? '−' : '') + F(Math.abs(p), 3) : i === 2 ? (q < 0 ? '−' : '') + F(Math.abs(q), 2) : M(c[i]));
    tpl = DTPL[2]; E = [p, q, r]; f = pv(c); g = Ev => pv([Ev[2], Ev[1], Ev[0]]);
  } else {
    // ax² + bx + k/x
    const a = nz(-4, 4), b = ri(-6, 6), k = nz(-6, 6);
    c = [0, b, a]; poles = [0];
    f = x => a * x * x + b * x + k / x;
    tex = `${terms([[a, 'x<sup>2</sup>'], [b, 'x']])} ${k < 0 ? '−' : '+'} ${F(Math.abs(k), 'x')}`;
    tpl = `f${PR}(x) = {0} x + {1} + ${F('{2}', 'x<sup>2</sup>')}`; E = [2 * a, b, -k];
    g = Ev => x => Ev[0] * x + Ev[1] + Ev[2] / (x * x);
    msg = v => (near(v[2], k) ? `⚠️ (1/x)${PR} = −1/x<sup>2</sup>, donc (${M(k)}/x)${PR} = ${M(-k)}/x<sup>2</sup> : attention au signe.` : near(v[0], a) ? '(x<sup>2</sup>)' + PR + ' = 2x : multiplie par l\'exposant.' : '');
    sol = `(${M(a)}x<sup>2</sup>)${PR} = ${M(2 * a)}x ; (${M(b)}x)${PR} = ${M(b)} ; (${M(k)} × ${F(1, 'x')})${PR} = ${M(k)} × (−${F(1, 'x<sup>2</sup>')}).<br><b>f${PR}(x) = ${terms([[2 * a, 'x'], [b, '']])} ${-k < 0 ? '−' : '+'} ${F(Math.abs(k), 'x<sup>2</sup>')}</b>`;
  }
  if (!msg) {
    const deg = c.length - 1;
    msg = v => {
      const n = E.length;
      if (near(v[n - 1], c[0]) && c[0] !== E[n - 1] && c[0] !== 0) return `La dérivée d'une constante est 0 : le ${M(c[0])} disparaît.`;
      for (let i = 0; i < n - 1; i++) { const dg = deg - i; if (near(v[i], c[dg]) && c[dg] !== E[i]) return `(x<sup>${dg}</sup>)${PR} = ${dg}x<sup>${dg - 1}</sup> : multiplie le coefficient par l'exposant ${dg}.`; }
      return '';
    };
    const parts = [];
    for (let i = c.length - 1; i >= 1; i--) if (c[i]) parts.push(`(${ctex(i)}${xp(i)})${PR} = ${terms([[r6(i * c[i]), xp(i - 1)]])}`);
    sol = `On dérive terme à terme : ${parts.join(' ; ')}${c[0] ? ` ; (${M(c[0])})${PR} = 0` : ''}.<br><b>f${PR}(x) = ${ptex([...E].reverse())}</b>`;
  }
  const x0 = pick([-1, 1]), fx0 = f(x0), m0 = r6(nd(f, x0));
  const W = fenetre(f, x0, m0);
  const sc = { f, ...W, poles, a: x0, m: m0, lab: false };
  return {
    type: 'nums', f,
    html: `Soit f(x) = ${tex}.<br>Donne f${PR}(x)${tpl === DTPL[1] || tpl === DTPL[2] ? ' sous forme réduite' : ''}.`,
    visual: scene(sc), afterVisual: scene({ ...sc, tan: true, tri: true, lab: 'A' }), replaceVisual: true,
    tpl, check: chk(E, msg),
    verify: Ev => sameDer(f, g(Ev), xs),
    hint: `(u + v)${PR} = u${PR} + v${PR} et (k u)${PR} = k u${PR} : dérive <b>chaque terme</b> séparément. (x<sup>n</sup>)${PR} = n x<sup>n − 1</sup>, et une constante a pour dérivée 0.`,
    solution: sol + `<br>Sur le graphique : f${PR}(${M(x0)}) = ${M(m0)} est la pente de la tangente en x = ${M(x0)}.`,
  };
}
function C6() {
  const f = x => x ** 3 - 3 * x;
  return `<h2>6. Somme et multiple : les polynômes</h2>
<p class="intro">Avec deux règles simples, tu peux dériver n'importe quel polynôme à partir des dérivées usuelles.</p>
<div class="def"><b>(u + v)${PR} = u${PR} + v${PR}</b> &nbsp; et &nbsp; <b>(k u)${PR} = k u${PR}</b> (k constante).<br>On dérive donc un polynôme <b>terme à terme</b> : (a x<sup>n</sup>)${PR} = a × n x<sup>n − 1</sup>.</div>
<div class="methode"><b>Méthode</b><ol>
<li>Range les termes par puissances décroissantes (ils peuvent être donnés dans le désordre).</li>
<li>Dérive chaque terme : (ax<sup>3</sup>)${PR} = 3ax<sup>2</sup> ; (ax<sup>2</sup>)${PR} = 2ax ; (ax)${PR} = a ; constante → 0 ; (k/x)${PR} = −k/x<sup>2</sup>.</li>
<li>Simplifie les coefficients (fractions comprises) et écris f${PR}(x) réduite.</li></ol></div>
<div class="ex"><span class="q">Exemple 1 : f(x) = 2x<sup>3</sup> − 5x<sup>2</sup> + 4x − 7.</span><br>f${PR}(x) = 2 × 3x<sup>2</sup> − 5 × 2x + 4 − 0 = <b>6x<sup>2</sup> − 10x + 4</b>.</div>
<div class="ex"><span class="q">Exemple 2 : des fractions.</span> f(x) = ${F(1, 3)}x<sup>3</sup> + ${F(3, 2)}x<sup>2</sup> − x<br>f${PR}(x) = ${F(1, 3)} × 3x<sup>2</sup> + ${F(3, 2)} × 2x − 1 = <b>x<sup>2</sup> + 3x − 1</b>.</div>
<div class="ex"><span class="q">Exemple 3 : avec 1/x.</span> f(x) = 3x<sup>2</sup> − x − ${F(4, 'x')} (x ≠ 0)<br>(−${F(4, 'x')})${PR} = −4 × (−${F(1, 'x<sup>2</sup>')}) = +${F(4, 'x<sup>2</sup>')}, donc <b>f${PR}(x) = 6x − 1 + ${F(4, 'x<sup>2</sup>')}</b>.</div>
<div class="warn">⚠️ La constante disparaît : (−7)${PR} = 0.<br>⚠️ (5x)${PR} = 5, pas 5x ni 0.<br>⚠️ Multiplie le coefficient par l'exposant : (−5x<sup>2</sup>)${PR} = −10x, pas −5x.</div>
${graph({ xr: [-3, 3], yr: [-3, 4], fs: [{ f, l: 'y = x³ − 3x' }], lines: [{ x: -1, y: 2, m: 0, l: 'tangente T', c: COL.T }, { x: 1, y: -2, m: 0, c: COL.T }], pts: [{ x: -1, y: 2, l: 'f′(−1) = 0', anchor: 'end' }, { x: 1, y: -2, l: 'f′(1) = 0', ly: 22 }] })}
<p class="note">Sur la figure : f(x) = x<sup>3</sup> − 3x, f${PR}(x) = 3x<sup>2</sup> − 3. En x = −1 et x = 1, f${PR}(x) = 0 : les tangentes sont horizontales.</p>
<div class="retenir">À retenir : un polynôme se dérive terme à terme, et les constantes disparaissent.</div>`;
}

/* =====================================================================
   7. Produit uv
   ===================================================================== */
function L7(d) {
  const kind = d < 2 ? 'll' : d < 3 ? 'lq' : d < 4 ? pick(['ll', 'lq']) : pick(['ll', 'lq', 'sq']);
  let f, tex, tpl, E, g, uv, sol, xs = PTS, value, html, x0 = 1, poles = [], from = -INF;
  const a = d < 1 ? ri(1, 4) : nz(-4, 4), b = d < 1 ? ri(1, 5) : nz(-5, 5);
  if (kind === 'll') {
    const c = d < 1 ? ri(1, 4) : nz(-4, 4), e = d < 1 ? ri(1, 5) : nz(-5, 5);
    f = x => (a * x + b) * (c * x + e); tex = `(${lin(a, b)})(${lin(c, e)})`;
    E = [2 * a * c, a * e + b * c]; tpl = DTPL[1]; g = Ev => x => Ev[0] * x + Ev[1]; uv = [0, a * c];
    sol = `u = ${lin(a, b)}, u${PR} = ${M(a)} ; v = ${lin(c, e)}, v${PR} = ${M(c)}.<br>f${PR}(x) = u${PR}v + uv${PR} = ${cp(a)}(${lin(c, e)}) + ${cp(c)}(${lin(a, b)}) = ${terms([[a * c, 'x'], [a * e, '']])} ${sgn(a * c)}x ${sgn(b * c)} = <b>${terms([[E[0], 'x'], [E[1], '']])}</b>`;
  } else if (kind === 'lq') {
    const c = nz(-3, 3), e = ri(-5, 5);
    f = x => (a * x + b) * (c * x * x + e); tex = `(${lin(a, b)})(${terms([[c, 'x<sup>2</sup>'], [e, '']])})`;
    E = [3 * a * c, 2 * b * c, a * e]; tpl = DTPL[2]; g = Ev => x => Ev[0] * x * x + Ev[1] * x + Ev[2]; uv = [0, 2 * a * c, 0];
    sol = `u = ${lin(a, b)}, u${PR} = ${M(a)} ; v = ${terms([[c, 'x<sup>2</sup>'], [e, '']])}, v${PR} = ${M(2 * c)}x.<br>f${PR}(x) = ${cp(a)}(${terms([[c, 'x<sup>2</sup>'], [e, '']])}) + ${cp(2 * c)}x(${lin(a, b)}) = ${terms([[a * c, 'x<sup>2</sup>'], [a * e, '']])} ${sgn(2 * a * c)}x<sup>2</sup> ${sgn(2 * b * c)}x = <b>${terms([[E[0], 'x<sup>2</sup>'], [E[1], 'x'], [E[2], '']])}</b>`;
  } else {
    const t = pick([1, 4, 9]), bb = t === 9 ? 3 * nz(-3, 3) : b;
    f = x => (a * x + bb) * Math.sqrt(x); tex = `(${lin(a, bb)})${R('x')}`; from = 0;
    const st = Math.sqrt(t), val = r6(a * st + (a * t + bb) / (2 * st));
    E = [val]; tpl = `f${PR}(${t}) = {0}`; value = r6(nd(f, t)); x0 = t; uv = [r6(a / (2 * st))];
    html = `Soit f(x) = ${tex} pour x &gt; 0.<br>Calcule f${PR}(${t}).`;
    sol = `u = ${lin(a, bb)}, u${PR} = ${M(a)} ; v = √x, v${PR} = ${F(1, '2√x')}.<br>f${PR}(x) = ${M(a)}√x + (${lin(a, bb)}) × ${F(1, '2√x')}.<br>f${PR}(${t}) = ${M(a)} × ${st} + ${P(a * t + bb)} ÷ ${2 * st} = <b>${M(val)}</b>`;
  }
  html = html || `Soit f(x) = ${tex}.<br>Calcule f${PR}(x) avec la formule du produit, puis réduis.`;
  const fx0 = f(x0), m0 = r6(nd(f, x0));
  const W = fenetre(f, x0, m0, kind === 'sq' ? [0] : []);
  const sc = { f, ...W, poles, from, a: x0, m: m0, lab: kind === 'sq' ? 'A' : false };
  return {
    type: 'nums', f, html, tpl,
    visual: scene(sc), afterVisual: scene({ ...sc, tan: true, tri: true, lab: 'A' }), replaceVisual: true,
    check: chk(E, v => (uv.every((u, i) => near(v[i], u)) ? `⚠️ (uv)${PR} ≠ u${PR}v${PR} ! La bonne formule : <b>(uv)${PR} = u${PR}v + uv${PR}</b>.` : '')),
    value, verify: g ? Ev => sameDer(f, g(Ev), xs) : undefined,
    hint: `Pose u = le 1<sup>er</sup> facteur et v = ${kind === 'sq' ? '√x' : 'le 2<sup>e</sup> facteur'}. Calcule u${PR} et v${PR}, puis <b>(uv)${PR} = u${PR}v + uv${PR}</b>${kind === 'sq' ? '' : ' et développe'}.`,
    solution: sol,
  };
}
function C7() {
  const f = x => (x - 1) * (x + 2) * x / 2;
  return `<h2>7. Dérivée d'un produit</h2>
<p class="intro">Quand f est un produit de deux facteurs, on ne dérive pas chaque facteur séparément : une formule spéciale relie les deux.</p>
<div class="def">Si u et v sont dérivables : <b>(uv)${PR} = u${PR}v + uv${PR}</b></div>
<div class="methode"><b>Méthode</b><ol>
<li>Pose u = le 1<sup>er</sup> facteur et v = le 2<sup>e</sup> facteur.</li>
<li>Calcule u${PR} et v${PR}.</li>
<li>Écris u${PR}v + uv${PR}, avec des parenthèses autour de u et de v.</li>
<li>Développe et réduis ; si on demande f${PR}(a), remplace x par a.</li></ol></div>
<div class="ex"><span class="q">Exemple 1 : f(x) = (2x + 1)(x − 3).</span><br>u = 2x + 1, u${PR} = 2 ; v = x − 3, v${PR} = 1.<br>f${PR}(x) = 2(x − 3) + 1 × (2x + 1) = 2x − 6 + 2x + 1 = <b>4x − 5</b>.<br>Vérification : f(x) = 2x<sup>2</sup> − 5x − 3, et (2x<sup>2</sup> − 5x − 3)${PR} = 4x − 5. ✔</div>
<div class="ex"><span class="q">Exemple 2 : f(x) = (x − 2)(3x<sup>2</sup> + 1).</span><br>u = x − 2, u${PR} = 1 ; v = 3x<sup>2</sup> + 1, v${PR} = 6x.<br>f${PR}(x) = 1 × (3x<sup>2</sup> + 1) + 6x(x − 2) = 3x<sup>2</sup> + 1 + 6x<sup>2</sup> − 12x = <b>9x<sup>2</sup> − 12x + 1</b>.</div>
<div class="ex"><span class="q">Exemple 3 : f(x) = (2x + 1)${R('x')}, calcule f${PR}(4).</span><br>u${PR} = 2 ; v = ${R('x')}, v${PR} = ${F(1, '2' + R('x'))}.<br>f${PR}(x) = 2${R('x')} + (2x + 1) × ${F(1, '2' + R('x'))}, donc f${PR}(4) = 2 × 2 + ${F(9, 4)} = <b>6,25</b>.</div>
${graph({ xr: [-3, 3], yr: [-3, 5], fs: [{ f, l: 'y = f(x)' }], lines: [{ x: 1, y: 0, m: 1.5, l: 'tangente T', c: COL.T }], pts: [{ x: 1, y: 0, l: 'A' }], tri: { x: 1, y: 0, dx: 2, dy: 3 } })}
<p class="note">Sur la figure : f(x) = ${F(1, 2)}x(x − 1)(x + 2) ; la tangente en A(1 ; 0) a pour pente f${PR}(1) = 1,5 (on avance de 2, on monte de 3).</p>
<div class="warn">⚠️ <b>(uv)${PR} ≠ u${PR}v${PR}</b> ! Dans l'exemple 1, u${PR}v${PR} = 2 × 1 = 2, ce qui est faux.<br>⚠️ Avec un facteur négatif, garde les parenthèses : −3(x + 2) = −3x − 6.</div>
<div class="retenir">À retenir : (uv)${PR} = u${PR}v + uv${PR}.</div>`;
}

/* =====================================================================
   8. Quotient u/v
   ===================================================================== */
function L8(d) {
  const kind = d < 1 ? 'invq' : d < 3 ? 'hom' : pick(['hom', 'lq', 'invq']);
  let f, tex, tpl, E, g, sol, xs = PTS, poles = [], msg, pole;
  if (kind === 'invq') {
    const k = nz(-6, 6), c = ri(1, 4);
    f = x => k / (x * x + c); tex = F(M(k), `x<sup>2</sup> + ${c}`);
    tpl = `f${PR}(x) = ${F('{0} x', sq(`x<sup>2</sup> + ${c}`))}`; E = [-2 * k]; g = Ev => x => Ev[0] * x / (x * x + c) ** 2;
    msg = v => (near(v[0], 2 * k) ? `⚠️ (1/v)${PR} = <b>−</b>v${PR}/v<sup>2</sup> : il y a un signe moins.` : near(v[0], -k) || near(v[0], k) ? `Dérive v = x<sup>2</sup> + ${c} : v${PR} = 2x.` : '');
    sol = `f = ${M(k)} × ${F(1, 'v')} avec v = x<sup>2</sup> + ${c}, v${PR} = 2x.<br>(1/v)${PR} = −v${PR}/v<sup>2</sup>, donc f${PR}(x) = ${M(k)} × ${F('−2x', sq(`x<sup>2</sup> + ${c}`))} = <b>${F(`${terms([[-2 * k, 'x']])}`, sq(`x<sup>2</sup> + ${c}`))}</b>`;
  } else if (kind === 'hom') {
    let a, b, c, e;
    do { a = d < 2 ? ri(1, 4) : nz(-4, 4); b = d < 2 ? ri(0, 5) : ri(-5, 5); c = d < 2 ? 1 : nz(-3, 3); e = d < 2 ? ri(1, 5) : nz(-5, 5); } while (a * e - b * c === 0);
    f = x => (a * x + b) / (c * x + e); tex = F(lin(a, b), lin(c, e)); poles = [-e / c]; pole = qx(-e, c);
    tpl = `f${PR}(x) = ${F('{0}', sq(lin(c, e)))}`; E = [a * e - b * c]; g = Ev => x => Ev[0] / (c * x + e) ** 2;
    xs = PTS.filter(x => Math.abs(c * x + e) > 0.3);
    msg = v => (near(v[0], -E[0]) ? `Presque : c'est <b>u${PR}v − uv${PR}</b>, dans cet ordre (et pas uv${PR} − u${PR}v).` : '');
    sol = `u = ${lin(a, b)}, u${PR} = ${M(a)} ; v = ${lin(c, e)}, v${PR} = ${M(c)}.<br>Numérateur : u${PR}v − uv${PR} = ${cp(a)}(${lin(c, e)}) − ${cp(c)}(${lin(a, b)}) = ${terms([[a * c, 'x'], [a * e, '']])} ${sgn(-a * c)}x ${sgn(-b * c)} = ${M(E[0])}.<br><b>f${PR}(x) = ${F(M(E[0]), sq(lin(c, e)))}</b>`;
  } else {
    const a = nz(-3, 3), b = ri(-4, 4), c = ri(1, 4);
    f = x => (a * x + b) / (x * x + c); tex = F(lin(a, b), `x<sup>2</sup> + ${c}`);
    tpl = `f${PR}(x) = ${F('{0} x<sup>2</sup> + {1} x + {2}', sq(`x<sup>2</sup> + ${c}`))}`; E = [-a, -2 * b, a * c];
    g = Ev => x => (Ev[0] * x * x + Ev[1] * x + Ev[2]) / (x * x + c) ** 2;
    msg = v => (E.every((e, i) => near(v[i], -e)) ? `Presque : c'est <b>u${PR}v − uv${PR}</b>, dans cet ordre.` : '');
    sol = `u = ${lin(a, b)}, u${PR} = ${M(a)} ; v = x<sup>2</sup> + ${c}, v${PR} = 2x.<br>u${PR}v − uv${PR} = ${cp(a)}(x<sup>2</sup> + ${c}) − 2x(${lin(a, b)}) = ${terms([[a, 'x<sup>2</sup>'], [a * c, '']])} ${sgn(-2 * a)}x<sup>2</sup> ${sgn(-2 * b)}x = ${terms([[E[0], 'x<sup>2</sup>'], [E[1], 'x'], [E[2], '']])}.<br><b>f${PR}(x) = ${F(terms([[E[0], 'x<sup>2</sup>'], [E[1], 'x'], [E[2], '']]), sq(`x<sup>2</sup> + ${c}`))}</b>`;
  }
  let x0 = pick([0, 1, -1]); if (poles.some(p => Math.abs(p - x0) < 1)) x0 = poles[0] + 2;
  if (!Number.isInteger(x0)) x0 = Math.round(x0);
  if (poles.some(p => Math.abs(p - x0) < 0.6)) x0 += 1;
  const fx0 = f(x0), m0 = r6(nd(f, x0));
  // fonction bornée (pas de valeur interdite) : la fenêtre contient toute la courbe visible
  const ys = [fx0 - 3, fx0 + 3];
  if (!poles.length) for (let i = 0; i <= 60; i++) ys.push(f(x0 - 3 + i / 10));
  const W = around([x0 - 3, x0 + 3], ys, 0, 1, 8, 7);
  const sc = { f, ...W, poles, a: x0, m: m0, lab: false };
  return {
    type: 'nums', f, tpl,
    html: `Soit f(x) = ${tex}${poles.length ? ` pour x ≠ ${pole}` : ''}.<br>Calcule f${PR}(x) et complète${tpl.includes('{1}') ? ' le numérateur' : ''}.`,
    visual: scene(sc), afterVisual: scene({ ...sc, tan: true, tri: true, lab: 'A' }), replaceVisual: true,
    check: chk(E, msg),
    verify: Ev => sameDer(f, g(Ev), xs),
    hint: kind === 'invq' ? `Formule <b>(1/v)${PR} = −v${PR}/v<sup>2</sup></b> avec v = x<sup>2</sup> + …, et (k u)${PR} = k u${PR}.` : `Formule <b>(u/v)${PR} = (u${PR}v − uv${PR}) / v<sup>2</sup></b>. On ne développe pas le dénominateur.`,
    solution: sol,
  };
}
function C8() {
  const f = x => (x + 1) / (x - 1);
  return `<h2>8. Dérivée d'un quotient</h2>
<p class="intro">Pour une fraction dont le haut et le bas dépendent de x, on utilise la formule du quotient, cousine de celle du produit.</p>
<div class="def">Si v ne s'annule pas :<br><b>(${F(1, 'v')})${PR} = ${F(`−v${PR}`, 'v<sup>2</sup>')}</b> &nbsp;&nbsp; et &nbsp;&nbsp; <b>(${F('u', 'v')})${PR} = ${F(`u${PR}v − uv${PR}`, 'v<sup>2</sup>')}</b></div>
<div class="methode"><b>Méthode</b><ol>
<li>Repère u (en haut) et v (en bas). Si le haut est un simple nombre k, écris f = k × (1/v) et utilise la formule de (1/v)${PR}.</li>
<li>Calcule u${PR} et v${PR}.</li>
<li>Calcule le numérateur u${PR}v − uv${PR}, dans cet ordre, puis développe et réduis.</li>
<li>Écris le dénominateur v<sup>2</sup> sans le développer.</li></ol></div>
<div class="ex"><span class="q">Exemple 1 : f(x) = ${F('x + 1', 'x − 1')} (x ≠ 1).</span><br>u = x + 1, u${PR} = 1 ; v = x − 1, v${PR} = 1.<br>u${PR}v − uv${PR} = (x − 1) − (x + 1) = −2, donc <b>f${PR}(x) = ${F('−2', '(x − 1)<sup>2</sup>')}</b>.</div>
<div class="ex"><span class="q">Exemple 2 : f(x) = ${F(3, 'x<sup>2</sup> + 2')}.</span><br>f = 3 × ${F(1, 'v')} avec v = x<sup>2</sup> + 2, v${PR} = 2x.<br>f${PR}(x) = 3 × ${F('−2x', '(x<sup>2</sup> + 2)<sup>2</sup>')} = <b>${F('−6x', '(x<sup>2</sup> + 2)<sup>2</sup>')}</b>.</div>
<div class="ex"><span class="q">Exemple 3 : f(x) = ${F('2x − 1', 'x<sup>2</sup> + 1')}.</span><br>u${PR} = 2 ; v${PR} = 2x.<br>u${PR}v − uv${PR} = 2(x<sup>2</sup> + 1) − 2x(2x − 1) = 2x<sup>2</sup> + 2 − 4x<sup>2</sup> + 2x = −2x<sup>2</sup> + 2x + 2.<br><b>f${PR}(x) = ${F('−2x<sup>2</sup> + 2x + 2', '(x<sup>2</sup> + 1)<sup>2</sup>')}</b>.</div>
${graph({ xr: [-4, 5], yr: [-5, 6], fs: [{ f, dom: [-4, 0.98] }, { f, dom: [1.02, 5], l: 'y = f(x)' }], lines: [{ x: 3, y: 2, m: -0.5, l: 'tangente T', c: COL.T }], pts: [{ x: 3, y: 2, l: 'A', ly: -14 }], tri: { x: 3, y: 2, dx: 2, dy: -1 } })}
<p class="note">Sur la figure (exemple 1) : f${PR}(3) = ${F('−2', '2<sup>2</sup>')} = −0,5. La tangente en A(3 ; 2) descend de 1 quand on avance de 2.</p>
<div class="warn">⚠️ L'ordre compte : u${PR}v <b>−</b> uv${PR} (u${PR} en premier). L'inverse donne le signe contraire.<br>⚠️ (u/v)${PR} ≠ u${PR}/v${PR}. On garde v<sup>2</sup> au dénominateur sans le développer.<br>⚠️ (${F(1, 'v')})${PR} = <b>−</b>${F(`v${PR}`, 'v<sup>2</sup>')} : n'oublie pas le signe moins.</div>
<div class="retenir">À retenir : (${F('u', 'v')})${PR} = ${F(`u${PR}v − uv${PR}`, 'v<sup>2</sup>')}, avec u${PR} en premier.</div>`;
}

/* =====================================================================
   9. Fonctions x ↦ g(ax + b)
   ===================================================================== */
function L9(d) {
  const kind = d < 1 ? 'p2' : d < 2 ? 'pn' : d < 3 ? 'sq' : d < 4 ? 'inv' : pick(['p2', 'pn', 'sq', 'inv']);
  const a = d < 4 ? ri(2, 5) : pick([2, 3, 4, 5, -2, -3, -1]), b = nz(-5, 5), L = lin(a, b);
  let f, tex, tpl, E, g, forgot, sol, xs = PTS, poles = [], from = -INF, n = 2;
  if (kind === 'p2') {
    f = x => (a * x + b) ** 2; tex = sq(L); tpl = `f${PR}(x) = {0} (${L})`; E = [2 * a]; g = Ev => x => Ev[0] * (a * x + b); forgot = 2;
    sol = `g(X) = X<sup>2</sup>, g${PR}(X) = 2X. f${PR}(x) = <b>${M(a)}</b> × 2(${L}) = <b>${M(2 * a)}(${L})</b>.`;
  } else if (kind === 'pn') {
    n = ri(3, 5); f = x => (a * x + b) ** n; tex = `(${L})<sup>${n}</sup>`; tpl = `f${PR}(x) = {0} (${L})<sup>${n - 1}</sup>`; E = [n * a];
    g = Ev => x => Ev[0] * (a * x + b) ** (n - 1); forgot = n;
    sol = `g(X) = X<sup>${n}</sup>, g${PR}(X) = ${n}X<sup>${n - 1}</sup>. f${PR}(x) = <b>${M(a)}</b> × ${n}(${L})<sup>${n - 1}</sup> = <b>${M(n * a)}(${L})<sup>${n - 1}</sup></b>.`;
  } else if (kind === 'sq') {
    f = x => (a * x + b >= 0 ? Math.sqrt(a * x + b) : NaN); tex = R(L); tpl = `f${PR}(x) = ${F('{0}', '2' + R(L))}`; E = [a];
    g = Ev => x => Ev[0] / (2 * Math.sqrt(a * x + b)); forgot = 1; xs = [0.4, 1, 1.7, 2.9, 4.2].map(t => -b / a + Math.sign(a) * t);
    from = a > 0 ? -b / a : -INF;
    sol = `g(X) = √X, g${PR}(X) = 1/(2√X). f${PR}(x) = <b>${M(a)}</b> × ${F(1, '2' + R(L))} = <b>${F(M(a), '2' + R(L))}</b> (là où ${L} &gt; 0).`;
  } else {
    f = x => 1 / (a * x + b); tex = F(1, L); tpl = `f${PR}(x) = ${F('{0}', sq(L))}`; E = [-a]; poles = [-b / a];
    g = Ev => x => Ev[0] / (a * x + b) ** 2; forgot = -1; xs = PTS.filter(x => Math.abs(a * x + b) > 0.3);
    sol = `g(X) = 1/X, g${PR}(X) = −1/X<sup>2</sup>. f${PR}(x) = <b>${M(a)}</b> × ${F('−1', sq(L))} = <b>${F(M(-a), sq(L))}</b>.`;
  }
  // point d'étude : une abscisse entière où la courbe est définie et pas trop raide
  let x0 = [0, 1, -1, 2, -2, 3, -3, 4, -4].find(x => isFinite(f(x)) && (kind !== 'sq' || a * x + b >= 1) && (kind !== 'inv' || Math.abs(a * x + b) >= 1) && Math.abs(nd(f, x)) <= 12) ?? 0;
  const fx0 = f(x0), m0 = r6(nd(f, x0)), W = fenetre(f, x0, m0);
  if (kind === 'sq' && a < 0) from = -INF;
  const fd = kind === 'sq' && a < 0 ? x => f(x) : f;
  const sc = { f: fd, ...W, poles, from, a: x0, m: m0, lab: false };
  return {
    type: 'nums', f, tpl,
    html: `Soit f(x) = ${tex}${kind === 'inv' ? ` pour x ≠ ${qx(-b, a)}` : ''}.<br>Calcule f${PR}(x).`,
    visual: scene(sc), afterVisual: scene({ ...sc, tan: true, tri: Math.abs(m0) <= 6, lab: 'A' }), replaceVisual: true,
    check: chk(E, v => (near(v[0], forgot) && forgot !== E[0] ? `⚠️ Tu as oublié le facteur <b>a = ${M(a)}</b> : (g(ax + b))${PR} = <b>a</b> × g${PR}(ax + b).` : kind === 'inv' && near(v[0], a) ? '⚠️ (1/X)' + PR + ' = −1/X<sup>2</sup> : attention au signe.' : '')),
    verify: Ev => sameDer(f, g(Ev), xs),
    hint: `<b>(g(ax + b))${PR} = a × g${PR}(ax + b)</b> : dérive g comme d'habitude, en gardant ${L} à l'intérieur, puis multiplie par a = ${M(a)}.`,
    solution: sol,
  };
}
/** forme factorisée 3k(x − r1)(x − r2), sans parenthèses inutiles autour de x */
const facD = (k, r1, r2) => `${co(3 * k)}${[r1, r2].map(r => (r === 0 ? 'x' : `(${xm(r)})`)).join('')}`;
function C9() {
  const f = x => (2 * x - 1) ** 2 / 2;
  return `<h2>9. Dérivée de x ↦ g(ax + b)</h2>
<p class="intro">Quand une fonction de référence s'applique à « ax + b » au lieu de x, on la dérive comme d'habitude… sans oublier un facteur a.</p>
<div class="def">Si f(x) = g(ax + b), alors <b>f${PR}(x) = a × g${PR}(ax + b)</b>.</div>
<div class="methode"><b>Méthode</b><ol>
<li>Repère la fonction de référence g (X<sup>2</sup>, X<sup>n</sup>, √X ou ${F(1, 'X')}) et le nombre a devant x.</li>
<li>Dérive g : g${PR}(X).</li>
<li>Remplace X par ax + b, sans toucher à l'intérieur de la parenthèse.</li>
<li>Multiplie par a (attention s'il est négatif).</li></ol></div>
<div class="ex"><span class="q">Exemple 1 : f(x) = (3x − 1)<sup>4</sup>.</span><br>g(X) = X<sup>4</sup>, g${PR}(X) = 4X<sup>3</sup> et a = 3.<br>f${PR}(x) = 3 × 4(3x − 1)<sup>3</sup> = <b>12(3x − 1)<sup>3</sup></b>.</div>
<div class="ex"><span class="q">Exemple 2 : f(x) = ${R('2x + 5')}.</span><br>g(X) = √X, g${PR}(X) = ${F(1, '2√X')} et a = 2.<br>f${PR}(x) = 2 × ${F(1, '2' + R('2x + 5'))} = <b>${F(2, '2' + R('2x + 5'))}</b> = ${F(1, R('2x + 5'))}.</div>
<div class="ex"><span class="q">Exemple 3 : f(x) = ${F(1, '−2x + 3')}, avec a négatif.</span><br>g(X) = ${F(1, 'X')}, g${PR}(X) = −${F(1, 'X<sup>2</sup>')} et a = −2.<br>f${PR}(x) = −2 × (−${F(1, '(−2x + 3)<sup>2</sup>')}) = <b>${F(2, '(−2x + 3)<sup>2</sup>')}</b>.</div>
${graph({ xr: [-2, 3], yr: [-1, 5], fs: [{ f, l: 'y = f(x)' }], lines: [{ x: 1, y: 0.5, m: 2, l: 'tangente T', c: COL.T }], pts: [{ x: 1, y: 0.5, l: 'A', anchor: 'end' }], tri: { x: 1, y: 0.5, dx: 1, dy: 2 } })}
<p class="note">Sur la figure : f(x) = ${F(1, 2)}(2x − 1)<sup>2</sup>, f${PR}(x) = ${F(1, 2)} × 2 × 2(2x − 1) = 2(2x − 1), donc f${PR}(1) = 2 : la tangente monte de 2 quand on avance de 1.</p>
<div class="warn">⚠️ Ne pas oublier le <b>facteur a</b> : ((3x − 1)<sup>4</sup>)${PR} ≠ 4(3x − 1)<sup>3</sup>.<br>⚠️ (1/(ax + b))${PR} = −a/(ax + b)<sup>2</sup> : signe moins <b>et</b> facteur a.</div>
<div class="retenir">À retenir : (g(ax + b))${PR} = a × g${PR}(ax + b).</div>`;
}

/* =====================================================================
   10. Signe de f′ et sens de variation
   ===================================================================== */
/** cubique f(x) = k(x³ − 1,5 s x² + 3 p x) + γ, avec f′(x) = 3k(x − r1)(x − r2) ; r1 + r2 pair → coefficients entiers */
function cubic(d) {
  const r1 = ri(-4, 2), r2 = r1 + 2 * ri(1, 2), k = d >= 5 ? pick([1, -1, 2, -2]) : pick([1, -1]);
  const s = r1 + r2, p = r1 * r2, c0 = [0, 3 * k * p, -1.5 * k * s, k], F0 = pv(c0);
  const gam = -Math.round((F0(r1) + F0(r2)) / 2), c = [gam, ...c0.slice(1)];
  return { c, f: pv(c), r1, r2, k, dc: pd(c) };
}
const incr = (f, x, h = 1e-4) => f(x + h) > f(x) || f(x) > f(x - h);   // f croissante à droite ou à gauche de x
const decr = (f, x, h = 1e-4) => f(x + h) < f(x) || f(x) < f(x - h);
/** sens de variation de f sur [u ; v] par échantillonnage */
function sensOn(f, u, v) {
  let up = true, down = true;
  for (let i = 0; i < 400; i++) { const x = u + (v - u) * i / 400, y = u + (v - u) * (i + 1) / 400; if (f(y) <= f(x)) up = false; if (f(y) >= f(x)) down = false; }
  return up ? 'inc' : down ? 'dec' : 'nm';
}
/** check d'intervalles : bornes justes → juste (crochets ouverts acceptés aux bornes finies) */
function varCheck(E, other, what) {
  const same = (A, B) => A.length === B.length && A.every((e, i) => e.lo === B[i].lo && e.hi === B[i].hi);
  const fn = v => {
    if (v.err) return { ok: false, msg: v.err };
    if (same(v.set, E)) {
      const exact = E.every((e, i) => e.lc === v.set[i].lc && e.hc === v.set[i].hc);
      return { ok: true, msg: exact ? '' : 'Juste. On écrit d\'habitude des crochets <b>fermés</b> aux points où f′ s\'annule.' };
    }
    if (same(v.set, other)) return { ok: false, msg: `C'est l'ensemble où f est ${what === 'croissante' ? 'décroissante' : 'croissante'} : relis la question.` };
    return { ok: false, msg: E.length === 2 && v.set.length === 1 ? 'Il faut <b>deux</b> intervalles ici.' : '' };
  };
  fn.expected = E; return fn;
}
function L10(d) {
  const kind = d < 1 ? 'tab2' : d < 2 ? 'iv2' : d < 3 ? 'tab3' : d < 4 ? 'iv3' : pick(['tab3', 'iv3', 'graph', 'graph']);
  let f, c, html, q = {}, sol, W, pts = [], lines = [];
  if (kind === 'tab2' || kind === 'iv2') {
    const al = d < 1 ? ri(1, 3) : pick([1, 2, 3, -1, -2, -3]), x0 = ri(-4, 4), be = -2 * al * x0, ga = ri(-6, 6);
    c = [ga, be, al]; f = pv(c);
    const fx = f(x0), dp = `f${PR}(x) = ${lin(2 * al, be)}`, Sg = al > 0 ? ['−', '+'] : ['+', '−'];
    W = around([x0 - 3, x0 + 3], [fx - 1, fx + (al > 0 ? 6 : -6)], 0, 1, 8, 7);
    pts = [{ x: x0, y: fx, l: al > 0 ? 'minimum' : 'maximum', ly: al > 0 ? 24 : -12 }]; lines = [{ x: x0, y: fx, m: 0, c: COL.T }];
    const base = `${dp} s'annule en x = ${M(x0)} (${M(2 * al)}x = ${M(-be)}). Comme ${M(2 * al)} ${al > 0 ? '&gt;' : '&lt;'} 0, f${PR}(x) est <b>${Sg[0]}</b> avant ${M(x0)} et <b>${Sg[1]}</b> après.`;
    if (kind === 'tab2') {
      q = { type: 'table', xs: [x0], fmtX: M, rowLabel: `f${PR}(x)`, check: tableCheck(Sg) };
      html = `Soit f(x) = ${ptex(c)}.<br>Calcule f${PR}(x), puis complète le <b>tableau de signes de f${PR}(x)</b>.<br><span class="note">Touche chaque case pour choisir + ou −.</span>`;
      q.verify = Ev => Ev.every((s, i) => { const x = i === 0 ? x0 - 1.5 : x0 + 1.5; return s === '+' ? incr(f, x) && !decr(f, x) : decr(f, x) && !incr(f, x); });
      sol = `${base}<br>Donc f est ${al > 0 ? 'décroissante puis croissante' : 'croissante puis décroissante'}.`;
    } else {
      const want = pick(['croissante', 'décroissante']), up = want === 'croissante';
      const Inc = al > 0 ? [I(x0, 1, INF, 0)] : [I(-INF, 0, x0, 1)], Dec = al > 0 ? [I(-INF, 0, x0, 1)] : [I(x0, 1, INF, 0)];
      const E = up ? Inc : Dec;
      q = { type: 'iv', check: varCheck(E, up ? Dec : Inc, want), truth: x => (up ? incr(f, x) : decr(f, x)) };
      html = `Soit f(x) = ${ptex(c)}.<br>Sur quel intervalle f est-elle <b>${want}</b> ?<br><span class="note">Étudie le signe de f${PR}(x).</span>`;
      sol = `${base}<br>f est ${want} là où f${PR}(x) ${up ? '≥' : '≤'} 0 : <b>${fmtSet(E)}</b>.`;
    }
  } else {
    const C = cubic(d); ({ f, c } = C); const { r1, r2, k } = C;
    const dp = `f${PR}(x) = ${ptex(C.dc)}`, f1 = f(r1), f2 = f(r2);
    const Sg = k > 0 ? ['+', '−', '+'] : ['−', '+', '−'];
    const fac = `f${PR}(x) = ${facD(k, r1, r2)}`;
    W = around([r1 - 2, r2 + 2], [f1, f2], 0, Math.max(2, Math.round(Math.abs(f1 - f2) * 0.2)), 8, 7);
    pts = [{ x: r1, y: f1, l: k > 0 ? 'max' : 'min', ly: k > 0 ? -12 : 24 }, { x: r2, y: f2, l: k > 0 ? 'min' : 'max', ly: k > 0 ? 24 : -12 }];
    lines = [{ x: r1, y: f1, m: 0, c: COL.T }, { x: r2, y: f2, m: 0, c: COL.T }];
    const base = `${dp} = ${facD(k, r1, r2)}. Racines ${M(r1)} et ${M(r2)} ; f${PR}(x) a le signe de ${M(3 * k)} à l'extérieur des racines : <b>${Sg.join(' | 0 | ')}</b>.`;
    if (kind === 'tab3') {
      q = { type: 'table', xs: [r1, r2], fmtX: M, rowLabel: `f${PR}(x)`, check: tableCheck(Sg) };
      html = `Soit f(x) = ${ptex(c)}.<br>On admet que ${fac}.<br>Complète le <b>tableau de signes de f${PR}(x)</b>.<br><span class="note">Touche chaque case pour choisir + ou −.</span>`;
      q.verify = Ev => Ev.every((s, i) => { const x = i === 0 ? r1 - 1 : i === 1 ? (r1 + r2) / 2 : r2 + 1; return s === '+' ? incr(f, x) && !decr(f, x) : decr(f, x) && !incr(f, x); });
      sol = `${base}<br>f est ${k > 0 ? 'croissante, décroissante puis croissante' : 'décroissante, croissante puis décroissante'}.`;
    } else if (kind === 'iv3') {
      const want = pick(['croissante', 'décroissante']), up = want === 'croissante';
      const out = [I(-INF, 0, r1, 1), I(r2, 1, INF, 0)], mid = [I(r1, 1, r2, 1)];
      const Inc = k > 0 ? out : mid, Dec = k > 0 ? mid : out, E = up ? Inc : Dec;
      q = { type: 'iv', check: varCheck(E, up ? Dec : Inc, want), truth: x => (up ? incr(f, x) : decr(f, x)) };
      html = `Soit f(x) = ${ptex(c)}.<br>Sur quel(s) intervalle(s) f est-elle <b>${want}</b> ?<br><span class="note">Calcule f${PR}(x) et factorise-la (ses racines sont entières).</span>`;
      sol = `${base}<br>f est ${want} là où f${PR}(x) ${up ? '≥' : '≤'} 0 : <b>${fmtSet(E)}</b>.`;
    } else {
      // on montre la courbe de f′ et on demande le sens de variation de f sur [u ; v]
      const fp = x => 3 * k * (x - r1) * (x - r2), mid = (r1 + r2) / 2;
      const opts = [[r1 - 2, r1], [r1, mid], [mid, r2], [r2, r2 + 2], [r1 - 1, r1 + 1]];
      const [u, v] = pick(opts);
      const Ek = u < r1 && v > r1 ? 'nm' : (fp((u + v) / 2) > 0 ? 'inc' : 'dec');
      const Wd = around([r1 - 2, r2 + 2], [fp(mid), -0.7 * fp(mid)], 0, 1, 8, 7);
      q = {
        type: 'choice', opts: [{ v: 'inc', l: 'croissante sur cet intervalle' }, { v: 'dec', l: 'décroissante sur cet intervalle' }, { v: 'nm', l: 'ni croissante ni décroissante (elle change de sens)' }],
        check: choiceCheck(Ek, { msg: () => `⚠️ On lit le <b>signe</b> de f${PR} (la courbe dessinée est-elle au-dessus ou en dessous de l'axe des x ?), et pas si cette courbe monte ou descend.` }),
        verify: Ev => sensOn(f, u, v) === Ev,
        visual: graph({ xr: Wd.xr, yr: Wd.yr, fs: [{ f: fp, l: `y = f${PR}(x)`, c: COL.G }], band: [u, v] }),
      };
      html = `On a tracé la courbe de la <b>dérivée f${PR}</b> (et non celle de f).<br>Sur l'intervalle [${M(u)} ; ${M(v)}] (en orange), la fonction <b>f</b> est :`;
      sol = `Sur [${M(u)} ; ${M(v)}], la courbe de f${PR} est ${Ek === 'inc' ? 'au-dessus' : Ek === 'dec' ? 'en dessous' : 'd\'un côté puis de l\'autre'} de l'axe des x : f${PR}(x) ${Ek === 'inc' ? '≥ 0' : Ek === 'dec' ? '≤ 0' : 'change de signe'}, donc f est <b>${Ek === 'inc' ? 'croissante' : Ek === 'dec' ? 'décroissante' : 'ni croissante ni décroissante'}</b> sur cet intervalle.`;
      q.after = graph({ xr: W.xr, yr: W.yr, fs: [{ f, l: 'y = f(x)' }], band: [u, v], pts });
    }
  }
  const after = q.after || graph({ xr: W.xr, yr: W.yr, fs: [{ f, l: 'y = f(x)' }], lines, pts });
  delete q.after;
  return {
    type: q.type, f, html, ...q,
    visual: q.visual || '', afterVisual: after, replaceVisual: true,
    hint: `f est <b>croissante</b> là où f${PR}(x) ≥ 0 et <b>décroissante</b> là où f${PR}(x) ≤ 0. ${kind === 'graph' ? 'Regarde si la courbe de f′ est au-dessus ou en dessous de l\'axe.' : 'Calcule f′(x), cherche où elle s\'annule, puis teste une valeur dans chaque zone.'}`,
    solution: sol,
  };
}
function C10() {
  const f = x => x ** 3 / 3 - x * x - 3 * x + 3;
  const fp = x => x * x - 2 * x - 3;
  return `<h2>10. Signe de f${PR} et variations</h2>
<p class="intro">La dérivée sert surtout à savoir où une fonction monte et où elle descend, sans tracer sa courbe.</p>
<div class="def">Sur un intervalle :<br>• si <b>f${PR}(x) ≥ 0</b>, f est <b>croissante</b> ↗ ;<br>• si <b>f${PR}(x) ≤ 0</b>, f est <b>décroissante</b> ↘.</div>
<div class="methode"><b>Méthode</b><ol>
<li>Calcule f${PR}(x).</li>
<li>Cherche où f${PR}(x) = 0 : équation du 1<sup>er</sup> degré, ou forme factorisée k(x − r<sub>1</sub>)(x − r<sub>2</sub>).</li>
<li>Trouve le signe dans chaque zone : pour ax + b, signe de −a avant la racine et de a après ; pour k(x − r<sub>1</sub>)(x − r<sub>2</sub>), signe de k à l'extérieur des racines, contraire entre elles.</li>
<li>Conclus : + → f ↗ ; − → f ↘. Dans les intervalles, crochets <b>fermés</b> aux points où f${PR} s'annule.</li></ol></div>
<div class="ex"><span class="q">Exemple 1 : f(x) = x<sup>2</sup> − 4x + 1.</span><br>f${PR}(x) = 2x − 4, nul pour x = 2. Comme 2 &gt; 0, f${PR}(x) est − avant 2 et + après.<br>f est décroissante sur <b>]−∞ ; 2]</b> et croissante sur <b>[2 ; +∞[</b>.</div>
<div class="ex"><span class="q">Exemple 2 : f(x) = ${F(1, 3)}x<sup>3</sup> − x<sup>2</sup> − 3x + 3.</span><br>f${PR}(x) = x<sup>2</sup> − 2x − 3 = (x + 1)(x − 3), signe de 1 (+) à l'extérieur des racines.
${signTableHTML(['−1', '3'], [[`f${PR}(x)`, ['+', '0', '−', '0', '+']], ['f', ['↗', '', '↘', '', '↗']]])}
f est croissante sur ]−∞ ; −1] et sur [3 ; +∞[, décroissante sur [−1 ; 3].</div>
<div class="cols">
<div><b>Courbe de f</b>${graph({ xr: [-3, 5], yr: [-7, 6], fs: [{ f, l: 'y = f(x)' }], lines: [{ x: -1, y: f(-1), m: 0, c: COL.T }, { x: 3, y: f(3), m: 0, c: COL.T }], pts: [{ x: -1, y: f(-1), l: 'max', ly: -12 }, { x: 3, y: f(3), l: 'min', ly: 24 }] })}</div>
<div><b>Courbe de f${PR}</b>${graph({ xr: [-3, 5], yr: [-5, 6], fs: [{ f: fp, l: `y = f${PR}(x)`, c: COL.G }], band: [-1, 3] })}</div>
</div>
<p class="note">Sur [−1 ; 3] (en orange), la courbe de f${PR} est <b>sous l'axe</b> : f${PR} ≤ 0, donc f décroît, même si la courbe de f${PR} remonte à partir de x = 1.</p>
<div class="warn">⚠️ Ne pas confondre le <b>signe de f${PR}</b> (qui donne les variations) avec le <b>signe de f</b> (la courbe au-dessus ou en dessous de l'axe).<br>⚠️ Sur un graphique de f${PR}, on regarde si la courbe est au-dessus ou en dessous de l'axe, pas si elle monte.<br>⚠️ Ne réponds pas « croissante » quand on demande « décroissante » : relis bien la question.</div>
<div class="retenir">À retenir : f${PR} positive → f croissante ; f${PR} négative → f décroissante.</div>`;
}

/* =====================================================================
   11. Extremums et optimisation
   ===================================================================== */
/** maximum / minimum d'une fonction échantillonnée sur [u ; v] : [x, f(x)] */
function sampleExt(f, u, v, max, N = 20000) {
  let bx = u, by = f(u);
  for (let i = 1; i <= N; i++) { const x = u + (v - u) * i / N, y = f(x); if (max ? y > by : y < by) { bx = x; by = y; } }
  return [bx, by];
}
function L11(d) {
  const kind = d < 2 ? 'q' : d < 3 ? 'c' : d < 4 ? pick(['rect', 'enclos']) : pick(['rect', 'enclos', 'boite', 'cout', 'c']);
  let f, html, tpl, E, dom, max, sol, visual = '', fl = 'y = f(x)', W;
  if (kind === 'q') {
    const al = d < 1 ? pick([1, 2, 3]) : pick([1, 2, -1, -2, 3, -3]), h = nz(-4, 4), k = ri(-6, 6), c = [al * h * h + k, -2 * al * h, al]; // h ≠ 0 : sinon l'extremum f(0) se lit dans l'énoncé
    f = pv(c); max = al < 0; E = [h, k]; dom = [h - 10, h + 10];
    html = `Soit f(x) = ${ptex(c)}.<br>${d < 1 ? 'f admet un <b>minimum</b>' : 'f admet un <b>extremum</b> (maximum ou minimum)'}. Où est-il atteint, et que vaut-il ?`;
    tpl = `x = {0} &nbsp;&nbsp; f(x) = {1}`;
    sol = `f${PR}(x) = ${lin(2 * al, -2 * al * h)} s'annule en x = ${M(h)} et change de signe (${al > 0 ? '− puis +' : '+ puis −'}).<br>C'est un <b>${max ? 'maximum' : 'minimum'}</b> : f(${M(h)}) = <b>${M(k)}</b>.`;
  } else if (kind === 'c') {
    const C = cubic(d); f = C.f; const { r1, r2, k } = C;
    max = chance(0.5); const x0 = (k > 0) === max ? r1 : r2; E = [x0, f(x0)]; dom = null;
    if (x0 === 0) return L11(d); // extremum en 0 : f(0) serait la constante écrite dans l'énoncé
    html = `Soit f(x) = ${ptex(C.c)}.<br>On admet que f${PR}(x) = ${facD(k, r1, r2)}.<br>Où f atteint-elle son <b>${max ? 'maximum' : 'minimum'} local</b>, et que vaut-il ?`;
    tpl = `x = {0} &nbsp;&nbsp; f(x) = {1}`;
    sol = `f${PR} s'annule en ${M(r1)} et ${M(r2)} ; signes : ${(k > 0 ? ['+', '−', '+'] : ['−', '+', '−']).join(' | 0 | ')}.<br>f${PR} passe de ${max ? '+ à −' : '− à +'} en x = ${M(x0)} : ${max ? 'maximum' : 'minimum'} local f(${M(x0)}) = <b>${M(E[1])}</b>.`;
    W = { xr: span([r1 - 2, r2 + 2], 0, 8), yr: span([f(r1), f(r2)], Math.max(2, Math.round(Math.abs(f(r1) - f(r2)) * 0.2)), 7) };
  } else if (kind === 'rect') {
    const m = ri(3, 15), Pm = 4 * m; f = x => x * (Pm / 2 - x); max = true; E = [m, m * m]; dom = [0, Pm / 2];
    html = `Un rectangle a un périmètre de <b>${Pm} cm</b>. On note x la longueur d'un côté (en cm).<br>Son aire est A(x) = x(${Pm / 2} − x). Pour quelle valeur de x l'aire est-elle <b>maximale</b> ?`;
    tpl = 'x = {0} cm &nbsp;&nbsp; aire max = {1} cm<sup>2</sup>'; fl = 'y = A(x)';
    visual = rectangle({ bas: `${Pm / 2} − x`, dedans: 'aire A(x)' });
    sol = `A(x) = ${Pm / 2}x − x<sup>2</sup>, A${PR}(x) = ${Pm / 2} − 2x, qui s'annule en x = ${m} (+ puis −) : maximum.<br>x = <b>${m} cm</b> (c'est un carré !) et A(${m}) = ${m} × ${m} = <b>${m * m} cm<sup>2</sup></b>.`;
  } else if (kind === 'enclos') {
    const m = ri(3, 25), Lg = 4 * m; f = x => x * (Lg - 2 * x); max = true; E = [m, 2 * m * m]; dom = [0, Lg / 2];
    html = `Avec <b>${Lg} m</b> de grillage, on clôture un enclos rectangulaire contre un mur (3 côtés). On note x la largeur (en m).<br>Son aire est A(x) = x(${Lg} − 2x). Quelle largeur donne l'aire <b>maximale</b> ?`;
    tpl = 'x = {0} m &nbsp;&nbsp; aire max = {1} m<sup>2</sup>'; fl = 'y = A(x)';
    visual = enclos(Lg);
    sol = `A(x) = ${Lg}x − 2x<sup>2</sup>, A${PR}(x) = ${Lg} − 4x, nulle en x = ${m} (+ puis −) : maximum.<br>x = <b>${m} m</b> et A(${m}) = ${m} × ${Lg - 2 * m} = <b>${2 * m * m} m<sup>2</sup></b>.`;
  } else if (kind === 'boite') {
    const m = ri(1, 5), cc = 6 * m; f = x => x * (cc - 2 * x) ** 2; max = true; E = [m, 16 * m ** 3]; dom = [0, cc / 2];
    html = `Dans une plaque carrée de <b>${cc} cm</b> de côté, on découpe un carré de côté x à chaque coin, puis on plie pour faire une boîte ouverte.<br>Son volume est V(x) = x(${cc} − 2x)<sup>2</sup>. Quelle valeur de x donne le volume <b>maximal</b> ?`;
    tpl = 'x = {0} cm &nbsp;&nbsp; volume max = {1} cm<sup>3</sup>'; fl = 'y = V(x)';
    visual = boite(cc);
    sol = `V${PR}(x) = (${cc} − 2x)<sup>2</sup> + x × 2(${cc} − 2x)(−2) = (${cc} − 2x)(${cc} − 6x).<br>Sur ]0 ; ${cc / 2}[, V${PR} s'annule en x = ${m} et passe de + à − : maximum.<br>x = <b>${m} cm</b> et V(${m}) = ${m} × ${cc - 2 * m}<sup>2</sup> = <b>${16 * m ** 3} cm<sup>3</sup></b>.`;
  } else {
    const a = ri(1, 4), b = ri(0, 20), n = ri(2, 12), K = a * n * n; f = x => a * x + b + K / x; max = false; E = [n, 2 * a * n + b]; dom = [0.2, 5 * n];
    html = `Le coût moyen de fabrication de x centaines d'objets (x &gt; 0) est C(x) = ${co(a)}x + ${b ? b + ' + ' : ''}${F(K, 'x')} euros par objet.<br>Pour quelle production le coût moyen est-il <b>minimal</b> ?`;
    tpl = 'x = {0} centaines &nbsp;&nbsp; coût min = {1} €'; fl = 'y = C(x)';
    sol = `C${PR}(x) = ${M(a)} − ${F(K, 'x<sup>2</sup>')} = ${F(`${M(a)}(x<sup>2</sup> − ${n * n})`, 'x<sup>2</sup>')}, qui s'annule en x = ${n} (− puis +) : minimum.<br>x = <b>${n}</b> centaines et C(${n}) = ${a * n} + ${b} + ${K / n} = <b>${E[1]} €</b>.`;
  }
  const x0 = E[0], y0 = E[1];
  if (kind === 'q') W = { xr: span([x0 - 4, x0 + 4], 0, 8), yr: span([y0, y0 + (max ? -8 : 8)], 1, 7) };
  else if (kind !== 'c') W = { xr: span([dom[0], dom[1]], 0, 8), yr: span(kind === 'cout' ? [y0, y0 * 1.8] : [y0], Math.max(1, Math.round(Math.abs(y0) * 0.15)), 7) };
  const after = scene({ f, ...W, from: dom && kind !== 'q' ? dom[0] : -INF, fl, lines: [{ x: x0, y: y0, m: 0, c: COL.T }], pts: [{ x: x0, y: y0, l: max ? 'maximum' : 'minimum', ly: max ? -12 : 24, px: kind !== 'q' && kind !== 'c' }] });
  return {
    type: 'nums', f, html, tpl, visual, afterVisual: after, replaceVisual: true,
    check: chk(E, v => {
      if (near(v[0], x0) && !near(v[1], y0)) return `La valeur de x est juste ! Calcule maintenant ${kind === 'q' || kind === 'c' ? 'f' : fl[4]}(${M(x0)}).`;
      if (near(v[0], y0) && near(v[1], x0)) return 'Tu as inversé les deux réponses.';
      return '';
    }),
    verify: Ev => {
      if (!near(nd(f, Ev[0]), 0, 1e-6) || !near(f(Ev[0]), Ev[1], 1e-9)) return false;
      if (kind === 'c') return [0.01, 0.1, 0.5].every(h => (max ? f(Ev[0] + h) < Ev[1] && f(Ev[0] - h) < Ev[1] : f(Ev[0] + h) > Ev[1] && f(Ev[0] - h) > Ev[1]));
      const [bx, by] = sampleExt(f, dom[0], dom[1], max);
      return Math.abs(bx - Ev[0]) < 2e-3 * (dom[1] - dom[0]) && near(by, Ev[1], 1e-5);
    },
    hint: `Calcule la dérivée, cherche où elle <b>s'annule en changeant de signe</b> : c'est là que se trouve ${max ? 'le maximum' : 'le minimum'}${kind === 'q' && d >= 1 ? ' (ou le maximum)' : ''}. Puis calcule la valeur de la fonction en ce point.`,
    solution: sol,
  };
}
function C11() {
  const f = x => x * (10 - x);
  return `<h2>11. Extremums et optimisation</h2>
<p class="intro">Trouver la plus grande aire, le plus petit coût, le plus grand volume… : la dérivée permet de trouver la meilleure valeur.</p>
<div class="def">Si f${PR} <b>s'annule en changeant de signe</b> en x<sub>0</sub>, f admet un extremum local en x<sub>0</sub> :<br>• f${PR} passe de + à − : <b>maximum</b> (la courbe monte puis descend) ;<br>• f${PR} passe de − à + : <b>minimum</b>.<br>En ce point, la tangente est <b>horizontale</b>.</div>
<div class="methode"><b>Méthode</b><ol>
<li>Écris la grandeur à optimiser en fonction de x (souvent elle est donnée), et note les valeurs permises pour x.</li>
<li>Calcule la dérivée.</li>
<li>Résous « dérivée = 0 » et vérifie que la dérivée change de signe.</li>
<li>Conclus : + puis − → maximum ; − puis + → minimum.</li>
<li>Réponds aux deux questions : la valeur de x, puis la valeur de la fonction en x (avec l'unité).</li></ol></div>
<div class="ex"><span class="q">Exemple 1 : f(x) = −2x<sup>2</sup> + 8x − 3.</span><br>f${PR}(x) = −4x + 8, nulle en x = 2 ; + avant 2, − après : <b>maximum</b>.<br>f(2) = −8 + 16 − 3 = <b>5</b>. Le maximum vaut 5, atteint en x = 2.</div>
<div class="cols">
<div class="ex"><span class="q">Exemple 2 : un rectangle de périmètre 20 cm.</span><br>Côté x : aire A(x) = x(10 − x) = 10x − x<sup>2</sup>.<br>A${PR}(x) = 10 − 2x, nulle en x = 5, + avant, − après.<br><b>x = 5 cm</b> (un carré) et <b>A(5) = 25 cm<sup>2</sup></b>.</div>
${graph({ xr: [-1, 11], yr: [-2, 30], fs: [{ f, dom: [0, 10], l: 'y = A(x)' }], lines: [{ x: 5, y: 25, m: 0, c: COL.T }], pts: [{ x: 5, y: 25, l: 'maximum', ly: -12, px: true }] })}
</div>
<div class="cols">
<div class="ex"><span class="q">Exemple 3 : un enclos contre un mur, avec 40 m de grillage.</span><br>A(x) = x(40 − 2x) = 40x − 2x<sup>2</sup>, A${PR}(x) = 40 − 4x, nulle en x = 10 (+ puis −).<br><b>x = 10 m</b> et A(10) = 10 × 20 = <b>200 m<sup>2</sup></b>.</div>
${enclos(40)}
</div>
<div class="warn">⚠️ f${PR}(x<sub>0</sub>) = 0 ne suffit pas : il faut que f${PR} change de signe (x<sup>3</sup> a une dérivée nulle en 0 sans extremum).<br>⚠️ La réponse demande deux choses : <b>où</b> (la valeur de x) et <b>combien</b> (la valeur de f). Ne les inverse pas.</div>
<div class="retenir">À retenir : un extremum se trouve là où f${PR} s'annule en changeant de signe.</div>`;
}

/* =====================================================================
   12. Défi : la fonction exponentielle
   ===================================================================== */
function L12(d) {
  const kind = d < 1 ? 'ke' : d < 2 ? 'eax' : d < 3 ? 'keab' : d < 4 ? 'xe' : pick(['keab', 'xe', 'gen', 'tan']);
  let f, tex, tpl, E, g, msg, sol, html, verify;
  const X12 = [-1.2, -0.5, 0.3, 0.9, 1.4];
  if (kind === 'ke') {
    const k = nz(-5, 5), c = ri(-5, 5); f = x => k * Math.exp(x) + c; tex = `${co(k)}${EX('x')}${plus(c)}`;
    tpl = `f${PR}(x) = {0} ${EX('x')}`; E = [k]; g = Ev => x => Ev[0] * Math.exp(x);
    msg = v => (near(v[0], 1) && k !== 1 ? `(k e<sup>x</sup>)${PR} = k e<sup>x</sup> : garde le coefficient ${M(k)}.` : '');
    sol = `(e<sup>x</sup>)${PR} = e<sup>x</sup> et la constante disparaît : <b>f${PR}(x) = ${co(k)}${EX('x')}</b>.`;
  } else if (kind === 'eax') {
    const a = pick([2, 3, -1, -2, 4, -3]); f = x => Math.exp(a * x); tex = EX(lin(a, 0));
    tpl = `f${PR}(x) = {0} ${EX(lin(a, 0))}`; E = [a]; g = Ev => x => Ev[0] * Math.exp(a * x);
    msg = v => (near(v[0], 1) ? `⚠️ Oubli du facteur a : (e<sup>ax</sup>)${PR} = <b>a</b> e<sup>ax</sup>, ici a = ${M(a)}.` : '');
    sol = `(e<sup>ax + b</sup>)${PR} = a e<sup>ax + b</sup> avec a = ${M(a)} : <b>f${PR}(x) = ${co(a)}${EX(lin(a, 0))}</b>.`;
  } else if (kind === 'keab') {
    const k = pick([1, 2, 3, -1, -2, 5]), a = pick([2, 3, -1, -2, 4]), b = nz(-3, 3); f = x => k * Math.exp(a * x + b); tex = `${co(k)}${EX(lin(a, b))}`;
    tpl = `f${PR}(x) = {0} ${EX(lin(a, b))}`; E = [k * a]; g = Ev => x => Ev[0] * Math.exp(a * x + b);
    msg = v => (near(v[0], k) && k * a !== k ? `⚠️ Oubli du facteur a = ${M(a)} : (e<sup>ax + b</sup>)${PR} = a e<sup>ax + b</sup>.` : near(v[0], a) && k !== 1 ? `Garde aussi le coefficient ${M(k)} devant.` : '');
    sol = `f${PR}(x) = ${M(k)} × ${M(a)} ${EX(lin(a, b))} = <b>${co(k * a)}${EX(lin(a, b))}</b>.`;
  } else if (kind === 'xe' || kind === 'gen') {
    const a = kind === 'xe' ? 1 : nz(-3, 3), b = nz(-4, 4), c = kind === 'xe' ? 1 : pick([2, -1, -2, 3]);
    f = x => (a * x + b) * Math.exp(c * x); tex = `(${lin(a, b)})${EX(lin(c, 0))}`;
    tpl = `f${PR}(x) = ({0} x + {1}) ${EX(lin(c, 0))}`; E = [a * c, a + b * c]; g = Ev => x => (Ev[0] * x + Ev[1]) * Math.exp(c * x);
    msg = v => (near(v[0], 0) && near(v[1], a * c) ? `⚠️ (uv)${PR} ≠ u${PR}v${PR} : utilise (uv)${PR} = u${PR}v + uv${PR}.` : near(v[0], a) && near(v[1], a + b) && c !== 1 ? `⚠️ (e<sup>${lin(c, 0)}</sup>)${PR} = ${co(c)}e<sup>${lin(c, 0)}</sup> : n'oublie pas le facteur ${M(c)}.` : near(v[0], 0) && near(v[1], a) ? 'Il manque le terme u × v′.' : '');
    sol = `u = ${lin(a, b)}, u${PR} = ${M(a)} ; v = ${EX(lin(c, 0))}, v${PR} = ${co(c)}${EX(lin(c, 0))}.<br>f${PR}(x) = ${co(a)}${EX(lin(c, 0))} + (${lin(a, b)}) × ${c < 0 ? `(${co(c)}${EX(lin(c, 0))})` : `${co(c)}${EX(lin(c, 0))}`} = <b>(${terms([[a * c, 'x'], [a + b * c, '']])})${EX(lin(c, 0))}</b>.`;
  } else {
    const k = pick([1, 2, 3, -1, -2]), a = pick([1, 2, -1, -2, 3]); f = x => k * Math.exp(a * x); tex = `${co(k)}${EX(lin(a, 0))}`;
    tpl = 'T : y = {0} x + {1}'; E = [k * a, k];
    html = `Soit f(x) = ${tex}.<br>Donne l'équation réduite de la tangente à la courbe de f au point d'abscisse 0.`;
    verify = Ev => near(Ev[0] * 0 + Ev[1], f(0)) && near(Ev[0], nd(f, 0));
    msg = v => (near(v[0], k) && k * a !== k ? `⚠️ f${PR}(x) = ${M(k * a)}e<sup>${lin(a, 0)}</sup> : n'oublie pas le facteur a = ${M(a)}.` : near(v[1], 0) ? 'e<sup>0</sup> = 1, donc f(0) n\'est pas 0.' : '');
    sol = `f(0) = ${M(k)} × e<sup>0</sup> = ${M(k)} et f${PR}(x) = ${M(k * a)}e<sup>${lin(a, 0)}</sup>, donc f${PR}(0) = ${M(k * a)}.<br>y = ${M(k * a)}(x − 0) + ${P(k)} : <b>y = ${terms([[k * a, 'x'], [k, '']])}</b>.`;
  }
  html = html || `Soit f(x) = ${tex}.<br>Calcule f${PR}(x).`;
  verify = verify || (Ev => sameDer(f, g(Ev), X12));
  const m0 = r6(nd(f, 0)), f0 = f(0), W = { xr: [-3, 3], yr: span([f0 - 3, f0 + 3, f0 + m0], 1, 7) };
  const sc = { f, ...W, a: 0, m: m0, lab: false };
  return {
    type: 'nums', f, html, tpl, check: chk(E, msg), verify,
    visual: scene(sc), afterVisual: scene({ ...sc, tan: true, tri: Number.isInteger(m0) && Math.abs(m0) <= 8, lab: 'A' }), replaceVisual: true,
    hint: `<b>(e<sup>x</sup>)${PR} = e<sup>x</sup></b> et <b>(e<sup>ax + b</sup>)${PR} = a e<sup>ax + b</sup></b>.${kind === 'xe' || kind === 'gen' ? ` Pour un produit : (uv)${PR} = u${PR}v + uv${PR}, puis factorise par l'exponentielle.` : ''}`,
    solution: sol + `<br>Sur le graphique : la pente de la tangente en x = 0 vaut f${PR}(0) = ${M(m0)}.`,
  };
}
function C12() {
  return `<h2>12. Défi : la fonction exponentielle</h2>
<p class="intro">L'exponentielle a une propriété unique : elle est sa propre dérivée. C'est pour cela qu'elle décrit les croissances « qui s'accélèrent ».</p>
<div class="def">La fonction <b>exponentielle</b> x ↦ e<sup>x</sup> est la seule fonction égale à sa dérivée avec e<sup>0</sup> = 1 :<br><b>(e<sup>x</sup>)${PR} = e<sup>x</sup></b> &nbsp;&nbsp; et &nbsp;&nbsp; <b>(e<sup>ax + b</sup>)${PR} = a e<sup>ax + b</sup></b>.<br>e<sup>x</sup> &gt; 0 pour tout x, donc e<sup>x</sup> est croissante.</div>
<div class="methode"><b>Méthode</b><ol>
<li>Une constante ajoutée disparaît ; un coefficient k devant reste : (k e<sup>x</sup> + c)${PR} = k e<sup>x</sup>.</li>
<li>Pour k e<sup>ax + b</sup> : multiplie k par a, et garde e<sup>ax + b</sup> tel quel.</li>
<li>Pour un produit (ax + b)e<sup>cx</sup> : (uv)${PR} = u${PR}v + uv${PR}, puis factorise par e<sup>cx</sup>.</li>
<li>Pour la tangente en 0 : f(0) et f${PR}(0) avec e<sup>0</sup> = 1, puis y = f${PR}(0)x + f(0).</li></ol></div>
<div class="ex"><span class="q">Exemple 1 : f(x) = 3e<sup>−2x + 1</sup>.</span><br>f${PR}(x) = 3 × (−2)e<sup>−2x + 1</sup> = <b>−6e<sup>−2x + 1</sup></b>.</div>
<div class="ex"><span class="q">Exemple 2 : f(x) = (x + 2)e<sup>x</sup>.</span><br>f${PR}(x) = 1 × e<sup>x</sup> + (x + 2)e<sup>x</sup> = <b>(x + 3)e<sup>x</sup></b>.</div>
<div class="ex"><span class="q">Exemple 3 : f(x) = (2x − 1)e<sup>−x</sup>.</span><br>u = 2x − 1, u${PR} = 2 ; v = e<sup>−x</sup>, v${PR} = −e<sup>−x</sup>.<br>f${PR}(x) = 2e<sup>−x</sup> + (2x − 1)(−e<sup>−x</sup>) = (2 − 2x + 1)e<sup>−x</sup> = <b>(−2x + 3)e<sup>−x</sup></b>.</div>
<div class="cols">
<div class="ex"><span class="q">Exemple 4 : tangente en 0 à y = 2e<sup>3x</sup>.</span><br>f(0) = 2 × e<sup>0</sup> = 2 ; f${PR}(x) = 6e<sup>3x</sup>, donc f${PR}(0) = 6.<br><b>y = 6x + 2</b>.<br>Sur la figure, le cas le plus simple : y = e<sup>x</sup>, tangente y = x + 1.</div>
${graph({ xr: [-3, 3], yr: [-2, 7], fs: [{ f: Math.exp, l: 'y = eˣ' }], lines: [{ x: 0, y: 1, m: 1, l: 'T : y = x + 1', c: COL.T }], pts: [{ x: 0, y: 1, l: 'A(0 ; 1)', anchor: 'end' }], tri: { x: 0, y: 1, dx: 1, dy: 1 } })}
</div>
<div class="warn">⚠️ (e<sup>ax + b</sup>)${PR} ≠ e<sup>ax + b</sup> : il faut le <b>facteur a</b> (règle g(ax + b) du niveau 9).<br>⚠️ e<sup>0</sup> = 1, pas 0 : la tangente en 0 à y = e<sup>x</sup> est y = x + 1.<br>⚠️ (uv)${PR} ≠ u${PR}v${PR} : pour (x + 2)e<sup>x</sup>, il faut les deux termes.</div>
<div class="retenir">À retenir : (e<sup>x</sup>)${PR} = e<sup>x</sup> et (e<sup>ax + b</sup>)${PR} = a e<sup>ax + b</sup>.</div>`;
}

/* ================= niveaux ================= */
const LEVELS_ = [
  { titre: 'Taux de variation', generate: L1, cours: C1 },
  { titre: 'Nombre dérivé sur un graphique', generate: L2, cours: C2 },
  { titre: 'Nombre dérivé par la limite', generate: L3, cours: C3 },
  { titre: 'Équation de la tangente', generate: L4, cours: C4 },
  { titre: 'Dérivées usuelles', generate: L5, cours: C5 },
  { titre: 'Somme et multiple : polynômes', generate: L6, cours: C6 },
  { titre: 'Dérivée d\'un produit', generate: L7, cours: C7 },
  { titre: 'Dérivée d\'un quotient', generate: L8, cours: C8 },
  { titre: 'Fonctions g(ax + b)', generate: L9, cours: C9 },
  { titre: 'Signe de f′ et variations', generate: L10, cours: C10 },
  { titre: 'Extremums et optimisation', generate: L11, cours: C11 },
  { titre: 'Défi : exponentielle', generate: L12, cours: C12, classe: '1re · défi' },
];
export const LEVELS = LEVELS_.map(L => ({ classe: '1re', ...L }));
export const OPTIONS = { need: 4, keys: { comma: true } };

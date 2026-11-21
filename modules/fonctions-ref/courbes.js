// Fonctions de référence : courbes « à points entiers » (lecture graphique exacte) et résolution par les nœuds.
// Une courbe est donnée par ses ordonnées ENTIÈRES aux abscisses entières a, a + 1, …, a + W : on la lit sans ambiguïté
// aux nœuds. Entre deux nœuds elle est tracée par une interpolation de Hermite qui conserve la monotonie (PCHIP) :
// pas de bosse parasite, les extremums sont donc exactement aux nœuds où les variations changent.
import { ri, pick, chance } from '../../engine/util/rand.js';
import { I } from '../../engine/draw/realLine.js';

/** fonction numérique de la courbe de nœuds (a + i, ys[i]) */
export function pchip(a, ys) {
  const n = ys.length - 1, d = ys.slice(1).map((y, i) => y - ys[i]), m = Array(n + 1).fill(0);
  for (let i = 1; i < n; i++) m[i] = d[i - 1] * d[i] <= 0 ? 0 : (2 * d[i - 1] * d[i]) / (d[i - 1] + d[i]);
  const bout = (d0, d1) => {
    let s = (3 * d0 - d1) / 2;
    if (Math.sign(s) !== Math.sign(d0)) s = 0;
    else if (Math.sign(d0) !== Math.sign(d1) && Math.abs(s) > 3 * Math.abs(d0)) s = 3 * d0;
    return s;
  };
  if (n === 1) { m[0] = m[1] = d[0]; } else { m[0] = bout(d[0], d[1]); m[n] = bout(d[n - 1], d[n - 2]); }
  return x => {
    const u = x - a;
    if (u < -1e-12 || u > n + 1e-12) return NaN;
    const k = Math.min(n - 1, Math.max(0, Math.floor(u + 1e-12))), t = u - k;
    if (Math.abs(t) < 1e-12) return ys[k];
    if (Math.abs(t - 1) < 1e-12) return ys[k + 1];
    const t2 = t * t, t3 = t2 * t;
    return (2 * t3 - 3 * t2 + 1) * ys[k] + (t3 - 2 * t2 + t) * m[k] + (-2 * t3 + 3 * t2) * ys[k + 1] + (t3 - t2) * m[k + 1];
  };
}

/** indices des nœuds où le sens de variation change, extrémités comprises */
export function tournants(ys) {
  const idx = [0];
  for (let i = 1; i < ys.length - 1; i++) if ((ys[i] - ys[i - 1]) * (ys[i + 1] - ys[i]) < 0) idx.push(i);
  idx.push(ys.length - 1);
  return idx;
}

/**
 * Courbe aléatoire : nT changements de sens (1 à 3), largeur W entre 7 et 10, ordonnées entières dans [−5 ; 5],
 * pas de palier (deux nœuds voisins n'ont jamais la même ordonnée).
 */
export function genCourbe(nT, o = {}) {
  for (let essai = 0; essai < 400; essai++) {
    const W = o.W || ri(o.wmin || 7, o.wmax || 10), a = o.a !== undefined ? o.a : -ri(2, 6);
    if (a + W > 7) continue;
    // longueurs des nT + 1 montées / descentes (au moins 2 chacune)
    const L = Array(nT + 1).fill(2);
    for (let r = W - 2 * (nT + 1); r > 0; r--) L[ri(0, nT)]++;
    let sens = chance(0.5) ? 1 : -1, y = ri(-3, 3);
    const ys = [y];
    for (const l of L) {
      const amp = ri(l, l + 2), pas = Array(l).fill(1);
      for (let e = amp - l; e > 0; e--) pas[ri(0, l - 1)]++;
      for (const p of pas) { y += sens * p; ys.push(y); }
      sens = -sens;
    }
    const mn = Math.min(...ys), mx = Math.max(...ys);
    if (mn < -5 || mx > 5 || mx - mn < 4) continue;
    return { a, W, b: a + W, ys, f: pchip(a, ys), xs: ys.map((_, i) => a + i) };
  }
  throw new Error('genCourbe : aucun tirage');
}

/** droite y = m x + p tracée par nœuds entiers sur [a ; b] (m entier, p entier) */
export function genDroite(a, b, m, p) {
  const ys = []; for (let x = a; x <= b; x++) ys.push(m * x + p);
  return { a, W: b - a, b, ys, f: x => (x < a - 1e-12 || x > b + 1e-12 ? NaN : m * x + p), xs: ys.map((_, i) => a + i), droite: { m, p } };
}

/**
 * Ensemble des x de [a ; b] où h(x) rel 0, h étant connue aux abscisses entières (valeurs entières h[i] en a + i).
 * Renvoie null si h change de signe entre deux entiers (solution non entière) ou s'annule deux fois de suite.
 * rel : '<', '≤', '>', '≥'. Renvoie { S: intervalles, racines: abscisses où h s'annule }.
 */
export function ensemble(h, a, rel) {
  const n = h.length - 1;
  for (let i = 0; i < n; i++) if (h[i] * h[i + 1] < 0 || (h[i] === 0 && h[i + 1] === 0)) return null;
  const ok = v => (rel === '<' ? v < 0 : rel === '≤' ? v <= 0 : rel === '>' ? v > 0 : v >= 0);
  const els = [];
  for (let i = 0; i <= n; i++) {
    els.push({ pt: true, x: a + i, ok: ok(h[i]) });
    if (i < n) els.push({ pt: false, l: a + i, r: a + i + 1, ok: ok(h[i] + h[i + 1]) });
  }
  const S = [];
  for (let i = 0; i < els.length; i++) {
    if (!els[i].ok) continue;
    let j = i; while (j + 1 < els.length && els[j + 1].ok) j++;
    const p = els[i], q = els[j];
    S.push(I(p.pt ? p.x : p.l, p.pt, q.pt ? q.x : q.r, q.pt));
    i = j;
  }
  return { S, racines: h.map((v, i) => (v === 0 ? a + i : null)).filter(v => v !== null) };
}
/** vrai si un intervalle est réduit à un point (non saisissable) */
export const degenere = S => S.some(i => i.lo >= i.hi);

/** relecture indépendante : ensemble des x (échantillonnés au pas de 1/4) où f(x) rel g(x) */
export function echantillon(F, G, a, b, rel) {
  const out = [];
  for (let x = a; x <= b + 1e-9; x += 0.25) {
    const e = F(x) - G(x);
    if (rel === '<' ? e < -1e-9 : rel === '≤' ? e < 1e-9 : rel === '>' ? e > 1e-9 : e > -1e-9) out.push(x);
  }
  return out;
}

/** ordonnées k possibles pour une équation f(x) = k sans solution non entière */
export function niveauxPropres(ys) {
  const ok = [];
  const lo = Math.min(...ys), hi = Math.max(...ys);
  for (let k = lo - 1; k <= hi + 1; k++) {
    let bon = true;
    for (let i = 0; i + 1 < ys.length; i++) if (Math.min(ys[i], ys[i + 1]) < k && k < Math.max(ys[i], ys[i + 1])) { bon = false; break; }
    if (bon) ok.push(k);
  }
  return ok;
}
export { pick };

/** courbe d'ordonnées entières ys aux abscisses a, a + 1, … */
export function fromYs(a, ys) {
  return { a, W: ys.length - 1, b: a + ys.length - 1, ys, f: pchip(a, ys), xs: ys.map((_, i) => a + i) };
}

/**
 * Ensemble solution d'une relation sur ℝ à partir de ses points critiques (triés) et d'un prédicat truth(x) :
 * on teste chaque point critique et un point de chaque segment entre deux points critiques.
 */
export function ensembleDe(crit, truth) {
  const els = [];
  const n = crit.length;
  for (let i = 0; i <= n; i++) {
    const lo = i === 0 ? -INF : crit[i - 1], hi = i === n ? INF : crit[i];
    const t = lo === -INF ? hi - 1 : hi === INF ? lo + 1 : (lo + hi) / 2;
    els.push({ pt: false, l: lo, r: hi, ok: !!truth(t) });
    if (i < n) els.push({ pt: true, x: crit[i], ok: !!truth(crit[i]) });
  }
  const S = [];
  for (let i = 0; i < els.length; i++) {
    if (!els[i].ok) continue;
    let j = i; while (j + 1 < els.length && els[j + 1].ok) j++;
    const p = els[i], q = els[j];
    S.push(I(p.pt ? p.x : p.l, p.pt, q.pt ? q.x : q.r, q.pt));
    i = j;
  }
  return S;
}
const INF = Infinity;

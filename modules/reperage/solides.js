// Fabrique de solides (polyèdres en données, solides ronds) partagée par les niveaux 6, 7, 10, 11 et 12.
import { pave3, prisme3, pyramide3, regulier, solide, cylindre, cone, boule } from './draw.js';

export const NOMS = { cube: 'cube', pave: 'pavé droit', prisme: 'prisme droit', pyramide: 'pyramide', cylindre: 'cylindre', cone: 'cône', boule: 'boule' };
export const NB_COTES = { 3: 'triangle', 4: 'quadrilatère', 5: 'pentagone', 6: 'hexagone' };
export const BASES = { 3: 'un triangle', 4: 'un carré', 5: 'un pentagone', 6: 'un hexagone' };

/** base d'un prisme couché à n côtés (points [x, y]) */
export function baseN(n, s = 2) {
  if (n === 3) return [[0, 0], [s * 1.2, 0], [s * 0.4, s]];
  if (n === 4) return [[0, 0], [s, 0], [s, s], [0, s]];
  return regulier(n, s * 0.8);
}
/** polyèdre {V, F, N} d'un solide à faces planes */
export function polyedre(kind, o = {}) {
  if (kind === 'cube') return pave3(o.a, o.a, o.a);
  if (kind === 'pave') return pave3(o.L, o.h, o.l);
  if (kind === 'prisme') return prisme3(baseN(o.n, o.s || 2), o.l || 3);
  if (kind === 'pyramide') {
    const n = o.n, a = o.s || 2.4;
    const base = n === 4 ? [[0, 0], [a, 0], [a, a], [0, a]] : n === 3 ? [[0, 0], [a, 0], [a * 0.45, a * 0.9]] : regulier(n, a * 0.8).map(p => [p[0], p[1] * 0.9]);
    return pyramide3(base, o.h || a * 1.3);
  }
  throw new Error('solide inconnu ' + kind);
}
/** dessin d'un solide : o.names (lettres), o.dims (cotes cube / pavé), + paramètres de polyedre ou des solides ronds */
export function dessin(kind, o = {}) {
  if (kind === 'cylindre') return cylindre({ r: o.r || 2, h: o.h || 4, lr: o.lr, lh: o.lh, axe: o.axe, sec: o.sec });
  if (kind === 'cone') return cone({ r: o.r || 2, h: o.h || 4, lr: o.lr, lh: o.lh, sec: o.sec });
  if (kind === 'boule') return boule({ R: o.R || 2, lR: o.lR, sec: o.sec });
  const S = polyedre(kind, o), el = [];
  if (o.dims && (kind === 'cube' || kind === 'pave')) {
    const [a, b, c] = kind === 'cube' ? [o.a, o.a, o.a] : [o.L, o.h, o.l];
    el.push({ a: 0, b: 1, s: `${String(a).replace('.', ',')} cm` }, { a: 0, b: 4, s: `${String(b).replace('.', ',')} cm` }, { a: 1, b: 2, s: `${String(c).replace('.', ',')} cm` });
  }
  return solide({ S, names: !!o.names, el, dots: o.dots, segs: o.segs, sec: o.sec, maxW: o.maxW || 280, maxH: o.maxH || 210, aria: o.aria || 'solide en perspective cavalière' });
}

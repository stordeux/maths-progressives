// Figures du module Angles : construites à partir de COORDONNÉES (repère mathématique, y vers le haut),
// puis converties en SVG (y vers le bas). Le cadre (viewBox) s'ajuste tout seul à la figure,
// ce qui permet de tourner les figures dans n'importe quelle orientation.
// Les mesures d'angles se recalculent avec Math.atan2 (angleAt) : c'est la vérification indépendante des tests.

const R2D = 180 / Math.PI;

/* ---------- géométrie ---------- */
/** point à la distance r de O, dans la direction deg (degrés, sens direct) */
export const pol = (O, r, deg) => [O[0] + r * Math.cos(deg / R2D), O[1] + r * Math.sin(deg / R2D)];
/** direction de P vers Q, en degrés */
export const dirDeg = (P, Q) => Math.atan2(Q[1] - P[1], Q[0] - P[0]) * R2D;
export const mod360 = a => ((a % 360) + 360) % 360;
/** mesure (0 à 180°) de l'angle géométrique ABC, de sommet B, recalculée avec atan2 */
export function angleAt(A, B, C) {
  const u = [A[0] - B[0], A[1] - B[1]], v = [C[0] - B[0], C[1] - B[1]];
  return Math.abs(Math.atan2(u[0] * v[1] - u[1] * v[0], u[0] * v[0] + u[1] * v[1])) * R2D;
}
/** intersection de la droite passant par P de direction u° et de celle passant par Q de direction v° ; t, s : paramètres */
export function inter(P, u, Q, v) {
  const a = [Math.cos(u / R2D), Math.sin(u / R2D)], b = [Math.cos(v / R2D), Math.sin(v / R2D)];
  const den = a[0] * b[1] - a[1] * b[0];
  const t = ((Q[0] - P[0]) * b[1] - (Q[1] - P[1]) * b[0]) / den;
  const s = ((Q[0] - P[0]) * a[1] - (Q[1] - P[1]) * a[0]) / den;
  return { P: [P[0] + t * a[0], P[1] + t * a[1]], t, s };
}
/** rotation de P d'un angle deg autour de O */
export const rot = (P, deg, O = [0, 0]) => {
  const c = Math.cos(deg / R2D), s = Math.sin(deg / R2D), x = P[0] - O[0], y = P[1] - O[1];
  return [O[0] + c * x - s * y, O[1] + s * x + c * y];
};
/** tourne tous les points d'un dictionnaire {nom: [x, y]} */
export const rotAll = (P, deg) => Object.fromEntries(Object.entries(P).map(([k, p]) => [k, rot(p, deg)]));
const dist = (P, Q) => Math.hypot(Q[0] - P[0], Q[1] - P[1]);

/* ---------- SVG ---------- */
const f1 = x => { const v = Math.round(x * 10) / 10; return String(v === 0 ? 0 : v); };
const X = P => f1(P[0]), Y = P => f1(-P[1]);
export const COL = { ink: '#1f1f1f', given: '#c2410c', givenFill: '#fed7aa', ask: '#1d4ed8', askFill: '#bfdbfe', line: '#57534e', other: '#15803d', otherFill: '#bbf7d0' };

function text(P, s, o = {}) {
  const fs = o.fs || 17;
  return `<text x="${X(P)}" y="${Y(P)}" font-size="${fs}" text-anchor="middle" dominant-baseline="central" fill="${o.c || COL.ink}" font-weight="${o.w || 700}"${o.it ? ' font-style="italic"' : ''}${o.tr ? ` transform="rotate(${f1(o.tr)} ${X(P)} ${Y(P)})"` : ''}>${s}</text>`;
}

/** rapporteur de centre O, de rayon R, dont le bord droit (graduation 0 « rouge ») est dans la direction rot°.
 *  Graduation extérieure (rouge) : 0 à droite → 180 à gauche ; graduation intérieure (bleue) : 0 à gauche → 180 à droite. */
function protractor({ O, rot: r0 = 0, R = 170 }, grow) {
  const p = (r, k) => pol(O, r, r0 + k);
  let s = '';
  const a = p(R, 0), b = p(R, 180), a2 = p(R - 58, 0), b2 = p(R - 58, 180);
  s += `<path d="M${X(a)},${Y(a)} A${R},${R} 0 0 0 ${X(b)},${Y(b)} Z" fill="#fef3c7" fill-opacity=".55" stroke="#92400e" stroke-width="1.6"/>`;
  s += `<path d="M${X(a2)},${Y(a2)} A${R - 58},${R - 58} 0 0 0 ${X(b2)},${Y(b2)}" fill="none" stroke="#d6b77a" stroke-width="1"/>`;
  for (let k = 0; k <= 180; k++) {
    const len = k % 10 === 0 ? 14 : k % 5 === 0 ? 9 : 5, P1 = p(R, k), P2 = p(R - len, k);
    s += `<line x1="${X(P1)}" y1="${Y(P1)}" x2="${X(P2)}" y2="${Y(P2)}" stroke="#78350f" stroke-width="${k % 10 === 0 ? 1.4 : k % 5 === 0 ? 1 : .7}"/>`;
  }
  for (let k = 0; k <= 180; k += 10) {
    const tr = 90 - (r0 + k), kk = k; // graduations dessinées par-dessus les côtés (rapporteur transparent)
    s += text(p(R - 24, kk), k, { fs: 11.5, c: '#b91c1c', tr });
    s += text(p(R - 42, kk), 180 - k, { fs: 11.5, c: '#1d4ed8', tr });
  }
  // base et centre
  s += `<line x1="${X(a)}" y1="${Y(a)}" x2="${X(b)}" y2="${Y(b)}" stroke="#92400e" stroke-width="1.6"/>`;
  const c1 = pol(O, 8, r0), c2 = pol(O, 8, r0 + 180), c3 = pol(O, 8, r0 + 90);
  s += `<line x1="${X(c1)}" y1="${Y(c1)}" x2="${X(c2)}" y2="${Y(c2)}" stroke="#92400e" stroke-width="1.2"/><line x1="${X(O)}" y1="${Y(O)}" x2="${X(c3)}" y2="${Y(c3)}" stroke="#92400e" stroke-width="1.2"/>`;
  [0, 30, 60, 90, 120, 150, 180].forEach(k => grow(p(R, k)));
  grow(pol(O, 6, r0 - 90));
  return s;
}

/**
 * Figure générique.
 * s.P      : points nommés {A: [x, y]} (étiquette affichée sauf si s.hide contient le nom)
 * s.segs   : segments [['A','B'], …] (noms ou coordonnées) ; {a, b, w, c} accepté aussi
 * s.lines  : droites déjà prolongées [{a, b, label, c}]
 * s.arcs   : [{v, a, b} ou {v, d1, span}, r, n (nombre d'arcs), kind: 'given'|'ask'|'other', label]
 * s.rights : codages d'angle droit [{v, a, b}]
 * s.ticks  : codages de longueurs égales [{a, b, n}]
 * s.lab    : direction imposée (degrés) pour l'étiquette d'un point
 * s.prot   : rapporteur {O, rot, R}
 * s.width  : largeur maximale affichée (px)
 */
export function figure(s) {
  const P = s.P || {};
  const at = p => (typeof p === 'string' ? P[p] : p);
  const box = [];
  const grow = (p, m = 0) => { box.push([p[0] - m, p[1] - m], [p[0] + m, p[1] + m]); };
  const back = [], mid = [], front = [];
  const nb = {}; // voisins de chaque point nommé (pour placer les étiquettes)
  const link = (a, b) => { if (typeof a === 'string' && typeof b !== 'undefined') (nb[a] = nb[a] || []).push(at(b)); };

  const protSvg = s.prot ? protractor(s.prot, grow) : '';

  for (const l of s.lines || []) {
    const a = at(l.a), b = at(l.b);
    mid.push(`<line x1="${X(a)}" y1="${Y(a)}" x2="${X(b)}" y2="${Y(b)}" stroke="${l.c || COL.line}" stroke-width="${l.w || 2.2}" stroke-linecap="round"/>`);
    grow(a); grow(b);
    if (l.label) {
      const u = [b[0] - a[0], b[1] - a[1]], n = Math.hypot(...u), side = l.side || 1;
      const L = [b[0] - u[0] / n * 22 - side * u[1] / n * 16, b[1] - u[1] / n * 22 + side * u[0] / n * 16];
      front.push(text(L, l.label, { fs: 15, c: l.c || COL.line, w: 600 })); grow(L, 18);
    }
  }
  for (const sg of s.segs || []) {
    const [pa, pb] = Array.isArray(sg) ? sg : [sg.a, sg.b];
    const a = at(pa), b = at(pb);
    mid.push(`<line x1="${X(a)}" y1="${Y(a)}" x2="${X(b)}" y2="${Y(b)}" stroke="${sg.c || COL.ink}" stroke-width="${sg.w || 2.6}" stroke-linecap="round"/>`);
    grow(a); grow(b); link(pa, pb); link(pb, pa);
  }
  for (const t of s.ticks || []) {
    const a = at(t.a), b = at(t.b), M = [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2], n = Math.hypot(b[0] - a[0], b[1] - a[1]);
    const u = [(b[0] - a[0]) / n, (b[1] - a[1]) / n], w = [-u[1], u[0]], k = t.n || 1;
    for (let i = 0; i < k; i++) {
      const o = (i - (k - 1) / 2) * 6, C = [M[0] + o * u[0], M[1] + o * u[1]];
      const p1 = [C[0] - 8 * w[0] - 3 * u[0], C[1] - 8 * w[1] - 3 * u[1]], p2 = [C[0] + 8 * w[0] + 3 * u[0], C[1] + 8 * w[1] + 3 * u[1]];
      front.push(`<line x1="${X(p1)}" y1="${Y(p1)}" x2="${X(p2)}" y2="${Y(p2)}" stroke="${COL.ink}" stroke-width="2"/>`);
    }
  }
  for (const r of s.rights || []) {
    const V = at(r.v), A = at(r.a), B = at(r.b), q = r.size || 15;
    const ua = [(A[0] - V[0]) / dist(V, A), (A[1] - V[1]) / dist(V, A)], ub = [(B[0] - V[0]) / dist(V, B), (B[1] - V[1]) / dist(V, B)];
    const p1 = [V[0] + q * ua[0], V[1] + q * ua[1]], p2 = [p1[0] + q * ub[0], p1[1] + q * ub[1]], p3 = [V[0] + q * ub[0], V[1] + q * ub[1]];
    back.push(`<path d="M${X(V)},${Y(V)} L${X(p1)},${Y(p1)} L${X(p2)},${Y(p2)} L${X(p3)},${Y(p3)} Z" fill="${r.fill || '#e7e5e4'}" stroke="none"/>`);
    front.push(`<path d="M${X(p1)},${Y(p1)} L${X(p2)},${Y(p2)} L${X(p3)},${Y(p3)}" fill="none" stroke="${COL.ink}" stroke-width="1.8"/>`);
  }
  for (const ar of s.arcs || []) {
    const V = at(ar.v);
    let d1, span;
    if (ar.d1 !== undefined) { d1 = ar.d1; span = ar.span; }
    else {
      d1 = dirDeg(V, at(ar.a)); span = mod360(dirDeg(V, at(ar.b)) - d1);
      if (span > 180) { d1 = d1 + span; span = 360 - span; }
    }
    const kind = ar.kind || 'given', c = kind === 'ask' ? COL.ask : kind === 'other' ? COL.other : COL.given;
    const fill = kind === 'ask' ? COL.askFill : kind === 'other' ? COL.otherFill : COL.givenFill;
    const r = ar.r || 30, n = ar.n || 1, big = span > 180 ? 1 : 0;
    const S = pol(V, r, d1), E = pol(V, r, d1 + span);
    if (ar.fill !== false) back.push(`<path d="M${X(V)},${Y(V)} L${X(S)},${Y(S)} A${r},${r} 0 ${big} 0 ${X(E)},${Y(E)} Z" fill="${fill}" fill-opacity=".85" stroke="none"/>`);
    for (let i = 0; i < n; i++) {
      const ri = r + i * 5, S2 = pol(V, ri, d1), E2 = pol(V, ri, d1 + span);
      front.push(`<path d="M${X(S2)},${Y(S2)} A${ri},${ri} 0 ${big} 0 ${X(E2)},${Y(E2)}" fill="none" stroke="${c}" stroke-width="2.2"/>`);
    }
    for (let k = 0; k <= 8; k++) grow(pol(V, r + (n - 1) * 5, d1 + span * k / 8));
    if (ar.label !== undefined && ar.label !== '') {
      const lab = String(ar.label), wdt = lab.length * 9.5;
      // assez loin du sommet pour que l'étiquette tienne entre les deux côtés de l'angle
      const base = r + (n - 1) * 5, need = (wdt / 2 + 7) / Math.sin(Math.min(span, 179) / 2 / R2D);
      const off = (ar.lr || 0) + Math.max(base + 14, Math.min(need, base + 62));
      const L = pol(V, off, d1 + span / 2);
      front.push(`<rect x="${f1(L[0] - wdt / 2 - 3)}" y="${f1(-L[1] - 11)}" width="${f1(wdt + 6)}" height="22" rx="5" fill="#fff" fill-opacity=".85"/>`);
      front.push(text(L, lab, { c, fs: 17 }));
      grow(L, 14 + wdt / 2);
    }
  }
  for (const [name, p] of Object.entries(P)) {
    if ((s.hide || []).includes(name)) continue;
    front.push(`<circle cx="${X(p)}" cy="${Y(p)}" r="2.8" fill="${COL.ink}"/>`);
    let dir;
    if (s.lab && s.lab[name] !== undefined) dir = s.lab[name];
    else {
      let sx = 0, sy = 0;
      for (const q of nb[name] || []) { const n = dist(p, q) || 1; sx += (q[0] - p[0]) / n; sy += (q[1] - p[1]) / n; }
      dir = Math.hypot(sx, sy) < .25 ? (nb[name] && nb[name].length ? dirDeg(p, nb[name][0]) + 90 : 90) : Math.atan2(-sy, -sx) * R2D;
    }
    const L = pol(p, 17, dir);
    front.push(text(L, name, { fs: 19, it: true }));
    grow(L, 13);
    grow(p);
  }
  for (const t of s.texts || []) { front.push(text(t.p, t.s, { c: t.c, fs: t.fs || 16 })); grow(t.p, 16 + String(t.s).length * 4); }

  const xs = box.map(p => p[0]), ys = box.map(p => p[1]);
  const m = 6, x0 = Math.min(...xs) - m, x1 = Math.max(...xs) + m, y0 = Math.min(...ys) - m, y1 = Math.max(...ys) + m;
  const W = x1 - x0, H = y1 - y0;
  const scale = s.scale || 1.45, width = Math.round(Math.min(s.width || 560, W * scale));
  return `<svg viewBox="${f1(x0)} ${f1(-y1)} ${f1(W)} ${f1(H)}" class="vis" style="width:${width}px" role="img" aria-label="${s.aria || 'figure'}" font-family="system-ui, sans-serif">${back.join('')}${mid.join('')}${protSvg}${front.join('')}</svg>`;
}

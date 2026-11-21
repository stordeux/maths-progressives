// Figures du module Produit scalaire (chaînes SVG, sans DOM) : points, segments mesurés, vecteurs, angles droits,
// arcs d'angle, cercles et droites, avec en option un quadrillage ou un repère orthonormé gradué.
// Les figures sont FIDÈLES aux nombres : l'échelle est la même sur les deux axes et les longueurs dessinées
// sont proportionnelles aux longueurs annoncées.
import { M } from '../../engine/util/fmt.js';
import { vlabel, lwidth, C } from '../vecteurs/draw.js';

export { C };
/** couleurs des figures (comme le module Vecteurs) */
export const COL = { ...C, h: '#6b7280' };

let uid = 0;
const r1 = v => (Math.round(v * 10) / 10).toString();
const HALO = 'paint-order="stroke" stroke="#fff" stroke-width="4" stroke-linejoin="round"';
const RAD = Math.PI / 180;

/** texte avec halo blanc */
const txt = (x, y, s, c, an = 'middle', fs = 17, w = 700) => `<text x="${r1(x)}" y="${r1(y)}" font-size="${fs}" font-weight="${w}" text-anchor="${an}" fill="${c}" ${HALO}>${s}</text>`;

/** flèche en pixels */
function arrow(x1, y1, x2, y2, c, w = 3.2, dash = false) {
  const len = Math.hypot(x2 - x1, y2 - y1);
  if (len < 1) return '';
  const ux = (x2 - x1) / len, uy = (y2 - y1) / len, h = Math.min(14, len * 0.5), hw = h * 0.48;
  const bx = x2 - ux * h, by = y2 - uy * h;
  return `<line x1="${r1(x1)}" y1="${r1(y1)}" x2="${r1(bx + ux)}" y2="${r1(by + uy)}" stroke="${c}" stroke-width="${w}" stroke-linecap="round" ${dash ? 'stroke-dasharray="8 6"' : ''}/>`
    + `<path d="M${r1(x2)},${r1(y2)}L${r1(bx - uy * hw)},${r1(by + ux * hw)}L${r1(bx + uy * hw)},${r1(by - ux * hw)}z" fill="${c}"/>`;
}

/**
 * Figure. Coordonnées en unités mathématiques (y vers le haut). Options :
 *  pts   [{ x, y, l?, c?, pos?, noDot? }]  pos ∈ n s e w ne nw se sw (sinon : à l'opposé du centre de la figure)
 *  segs  [{ a:[x,y], b:[x,y], c?, dash?, w?, lab?, side? }]  lab : mesure écrite le long du segment (side = ±1)
 *  vecs  [{ x, y, dx, dy, c?, l?, side?, dash? }]  flèches ; l : '{u}' (flèche sur la lettre)
 *  right [{ at:[x,y], u:[ux,uy], v:[vx,vy] }]  marque d'angle droit
 *  arcs  [{ at:[x,y], a1, a2, r?, lab?, c? }]  arc d'angle de a1 à a2 (degrés, sens direct)
 *  circles [{ x, y, r, c?, dash? }] ; lines [{ a, b, c, col?, dash?, l? }] droites ax + by + c = 0
 *  poly  [[x, y]…] triangle ou polygone coloré
 *  grid  : quadrillage ; axes : repère gradué (contient l'origine) ; unit : pixels par unité imposés
 *  center: point [x, y] à fuir pour placer les noms ; W, H : taille maximale en pixels
 */
export function fig(o) {
  const W0 = o.W || 420, H0 = o.H || 300, rep = !!(o.grid || o.axes);
  const xs = [], ys = [], add = (x, y) => { xs.push(x); ys.push(y); };
  (o.pts || []).forEach(p => add(p.x, p.y));
  (o.vecs || []).forEach(v => { add(v.x, v.y); add(v.x + v.dx, v.y + v.dy); });
  (o.segs || []).forEach(s => { add(...s.a); add(...s.b); });
  (o.circles || []).forEach(c => { add(c.x - c.r, c.y - c.r); add(c.x + c.r, c.y + c.r); });
  (o.ext || []).forEach(p => add(p[0], p[1]));
  if (o.axes) add(0, 0);
  let x0 = Math.min(...xs), x1 = Math.max(...xs), y0 = Math.min(...ys), y1 = Math.max(...ys);
  if (rep) { const m = o.margin ?? 1; x0 = Math.floor(x0 - m); x1 = Math.ceil(x1 + m); y0 = Math.floor(y0 - m); y1 = Math.ceil(y1 + m); }
  if (x1 - x0 < 1e-9) { x0 -= 1; x1 += 1; }
  if (y1 - y0 < 1e-9) { y0 -= 1; y1 += 1; }
  const pad = rep ? 26 : 38, padx = rep ? 30 : 44;
  let s = Math.min((W0 - 2 * padx) / (x1 - x0), (H0 - 2 * pad - (o.padb || 0) - (o.padt || 0)) / (y1 - y0));
  s = o.unit || Math.min(s, rep ? 56 : 64);
  const top = pad + (o.padt || 0), W = Math.round((x1 - x0) * s + 2 * padx), H = Math.round((y1 - y0) * s + top + pad + (o.padb || 0));
  const X = x => padx + (x - x0) * s, Y = y => top + (y1 - y) * s;
  const id = `ps${++uid}`;
  let g = `<svg viewBox="0 0 ${W} ${H}" class="vis" style="max-width:${W}px;width:100%" role="img" aria-label="${o.aria || 'figure'}" font-family="system-ui,sans-serif">`
    + `<defs><marker id="${id}a" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto"><path d="M0,0L10,5L0,10z" fill="#333"/></marker></defs>`;
  const labs = [];
  // quadrillage et repère
  if (rep) {
    const st = s >= 24 ? 1 : s >= 12 ? 2 : 5;
    for (let x = x0; x <= x1; x++) g += `<line x1="${r1(X(x))}" y1="${r1(Y(y0))}" x2="${r1(X(x))}" y2="${r1(Y(y1))}" stroke="${x % st ? '#ebe8e1' : '#dcd8ce'}"/>`;
    for (let y = y0; y <= y1; y++) g += `<line x1="${r1(X(x0))}" y1="${r1(Y(y))}" x2="${r1(X(x1))}" y2="${r1(Y(y))}" stroke="${y % st ? '#ebe8e1' : '#dcd8ce'}"/>`;
    if (o.axes) {
      g += `<line x1="${r1(X(x0))}" y1="${r1(Y(0))}" x2="${r1(X(x1) + 14)}" y2="${r1(Y(0))}" stroke="#333" stroke-width="1.6" marker-end="url(#${id}a)"/>`
        + `<line x1="${r1(X(0))}" y1="${r1(Y(y0))}" x2="${r1(X(0))}" y2="${r1(Y(y1) - 14)}" stroke="#333" stroke-width="1.6" marker-end="url(#${id}a)"/>`;
      const gr = (x, y, t, an) => `<text x="${r1(x)}" y="${r1(y)}" font-size="14" text-anchor="${an}" fill="#555" ${HALO}>${t}</text>`;
      for (let x = Math.ceil(x0 / st) * st; x <= x1; x += st) if (x && x > x0) labs.push(gr(X(x), Y(0) + 18, M(x), 'middle'));
      for (let y = Math.ceil(y0 / st) * st; y <= y1; y += st) if (y && y > y0 && y < y1) labs.push(gr(X(0) - 6, Y(y) + 5, M(y), 'end'));
      labs.push(gr(X(0) - 6, Y(0) + 18, '0', 'end'));
    }
  }
  if (o.poly) {
    const c = o.polyc || COL.p;
    g += `<path d="${o.poly.map((p, i) => (i ? 'L' : 'M') + r1(X(p[0])) + ',' + r1(Y(p[1]))).join('')}z" fill="${c}" fill-opacity=".08" stroke="none"/>`;
  }
  // centre de la figure (pour pousser les noms vers l'extérieur)
  const pts = o.pts || [];
  const cen = o.center || (pts.length ? [pts.reduce((a, p) => a + p.x, 0) / pts.length, pts.reduce((a, p) => a + p.y, 0) / pts.length] : [(x0 + x1) / 2, (y0 + y1) / 2]);
  (o.circles || []).forEach(c => {
    g += `<circle cx="${r1(X(c.x))}" cy="${r1(Y(c.y))}" r="${r1(c.r * s)}" fill="${c.fill || 'none'}" fill-opacity=".07" stroke="${c.c || COL.d}" stroke-width="2.6" ${c.dash ? 'stroke-dasharray="8 6"' : ''}/>`;
  });
  (o.lines || []).forEach(D => {
    const e = [];
    if (D.b !== 0) for (const x of [x0, x1]) { const y = -(D.a * x + D.c) / D.b; if (y >= y0 - 1e-9 && y <= y1 + 1e-9) e.push([x, y]); }
    if (D.a !== 0) for (const y of [y0, y1]) { const x = -(D.b * y + D.c) / D.a; if (x >= x0 - 1e-9 && x <= x1 + 1e-9) e.push([x, y]); }
    if (e.length < 2) return;
    let best = [e[0], e[1]], bd = -1;
    for (let i = 0; i < e.length; i++) for (let j = i + 1; j < e.length; j++) { const d = Math.hypot(e[i][0] - e[j][0], e[i][1] - e[j][1]); if (d > bd) { bd = d; best = [e[i], e[j]]; } }
    g += `<line x1="${r1(X(best[0][0]))}" y1="${r1(Y(best[0][1]))}" x2="${r1(X(best[1][0]))}" y2="${r1(Y(best[1][1]))}" stroke="${D.col || COL.d}" stroke-width="2.8" ${D.dash ? 'stroke-dasharray="9 6"' : ''}/>`;
    if (D.l) {
      const [p, q] = best[0][0] <= best[1][0] ? best : [best[1], best[0]];
      const t = D.at ?? 0.85, lx = X(p[0] + (q[0] - p[0]) * t), ly = Y(p[1] + (q[1] - p[1]) * t);
      labs.push(txt(Math.max(padx, Math.min(W - 12, lx)), Math.max(18, ly - 10), D.l, D.col || COL.d, 'middle', 17));
    }
  });
  (o.segs || []).forEach(S => {
    const c = S.c || '#495057';
    if (!S.inv) g += `<line x1="${r1(X(S.a[0]))}" y1="${r1(Y(S.a[1]))}" x2="${r1(X(S.b[0]))}" y2="${r1(Y(S.b[1]))}" stroke="${c}" stroke-width="${S.w || 2.6}" stroke-linecap="round" ${S.dash ? 'stroke-dasharray="7 5"' : ''}/>`;
    if (S.lab) {
      const mx = (S.a[0] + S.b[0]) / 2, my = (S.a[1] + S.b[1]) / 2;
      const dx = X(S.b[0]) - X(S.a[0]), dy = Y(S.b[1]) - Y(S.a[1]), n = Math.hypot(dx, dy) || 1;
      let nx = dy / n, ny = -dx / n; // normale en pixels
      let sd = S.side;
      if (!sd) sd = (X(mx) + nx - X(cen[0])) * nx + (Y(my) + ny - Y(cen[1])) * ny >= 0 ? 1 : -1;
      nx *= sd; ny *= sd;
      const w = lwidth(S.lab, 16), off = (S.dist ?? 11) + Math.abs(nx) * (w / 2 + 2) + Math.abs(ny) * 7;
      const lx = Math.max(w / 2 + 3, Math.min(W - w / 2 - 3, X(mx) + nx * off));
      labs.push(S.lab.includes('{') ? vlabel(lx, Y(my) + ny * off + 6, S.lab, S.lc || c, 'middle', 16, [3, W - 3]) : txt(lx, Y(my) + ny * off + 6, S.lab, S.lc || c, 'middle', 16));
    }
  });
  (o.right || []).forEach(R => {
    const k = 11, [ux, uy] = R.u, [vx, vy] = R.v, nu = Math.hypot(ux, uy), nv = Math.hypot(vx, vy);
    const px = X(R.at[0]), py = Y(R.at[1]);
    const a = [px + k * ux / nu, py - k * uy / nu], b = [a[0] + k * vx / nv, a[1] - k * vy / nv], c = [px + k * vx / nv, py - k * vy / nv];
    g += `<path d="M${r1(a[0])},${r1(a[1])}L${r1(b[0])},${r1(b[1])}L${r1(c[0])},${r1(c[1])}" fill="none" stroke="#495057" stroke-width="1.8"/>`;
  });
  (o.arcs || []).forEach(A => {
    const r = A.r || 26, c = A.c || '#c2410c', px = X(A.at[0]), py = Y(A.at[1]);
    const p = a => [px + r * Math.cos(a * RAD), py - r * Math.sin(a * RAD)];
    const [sx, sy] = p(A.a1), [ex, ey] = p(A.a2);
    g += `<path d="M${r1(sx)},${r1(sy)}A${r},${r} 0 ${A.a2 - A.a1 > 180 ? 1 : 0} 0 ${r1(ex)},${r1(ey)}" fill="none" stroke="${c}" stroke-width="2.4"/>`;
    if (A.lab) {
      const m = (A.a1 + A.a2) / 2, rr = r + 8 + (lwidth(A.lab, 16) / 2) * Math.abs(Math.cos(m * RAD)) + 4;
      labs.push(txt(px + rr * Math.cos(m * RAD), py - rr * Math.sin(m * RAD) + 6, A.lab, c, 'middle', 16));
    }
  });
  (o.vecs || []).forEach(V => {
    const c = V.c || COL.u, x1p = X(V.x), y1p = Y(V.y), x2p = X(V.x + V.dx), y2p = Y(V.y + V.dy);
    g += arrow(x1p, y1p, x2p, y2p, c, V.w || 3.2, V.dash);
    if (V.l) {
      const n = Math.hypot(x2p - x1p, y2p - y1p) || 1, sd = V.side || 1, t = V.at ?? 0.5;
      const lx = x1p + (x2p - x1p) * t + (y2p - y1p) / n * sd * 17, ly = y1p + (y2p - y1p) * t - (x2p - x1p) / n * sd * 19 + 6;
      labs.push(vlabel(lx, Math.max(22, ly), V.l, c, 'middle', 18, [4, W - 4]));
    }
  });
  // points : le nom est poussé à l'opposé du centre de la figure
  const OFF = { ne: [9, -9, 'start'], nw: [-9, -9, 'end'], se: [9, 19, 'start'], sw: [-9, 19, 'end'], n: [0, -12, 'middle'], s: [0, 24, 'middle'], e: [12, 6, 'start'], w: [-12, 6, 'end'] };
  pts.forEach(p => {
    const c = p.c || COL.p;
    if (!p.noDot) g += `<circle cx="${r1(X(p.x))}" cy="${r1(Y(p.y))}" r="5" fill="${c}" stroke="#fff" stroke-width="1.5"/>`;
    if (p.l) {
      let pos = p.pos;
      if (!pos) {
        const ex = p.x - cen[0], ey = p.y - cen[1], h = Math.abs(ex) > 3 * Math.abs(ey) ? '' : (ey >= 0 ? 'n' : 's'), v = Math.abs(ey) > 3 * Math.abs(ex) ? '' : (ex >= 0 ? 'e' : 'w');
        pos = (h + v) || 'ne';
        if (pos.length === 1) pos = pos === 'n' || pos === 's' ? pos : pos;
      }
      const [dx, dy, an] = OFF[pos];
      labs.push(vlabel(X(p.x) + dx, Math.max(20, Math.min(H - 6, Y(p.y) + dy)), p.l, c, an, 18, [3, W - 3]));
    }
  });
  return g + labs.join('') + '</svg>';
}

/** figure d'un triangle de côtés connus a = BC, b = CA, c = AB (A et B posés, C déduit), fidèle aux longueurs */
export function triangleCoords(c, b, a) {
  // A = (0, 0), B = (c, 0), C = (b cos A, b sin A)
  const cosA = (b * b + c * c - a * a) / (2 * b * c), sinA = Math.sqrt(Math.max(0, 1 - cosA * cosA));
  return { A: [0, 0], B: [c, 0], C: [b * cosA, b * sinA], cosA };
}

export { lwidth, vlabel };

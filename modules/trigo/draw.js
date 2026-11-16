// Dessins du module Trigonométrie (chaînes SVG, sans DOM) :
// cercle trigonométrique (points, angle orienté, projections, droites x = a / y = a, arcs mis en évidence)
// et courbes de cos / sin graduées en multiples de π.
import { M } from '../../engine/util/fmt.js';

let uid = 0;
const r1 = v => (isFinite(v) ? (Math.round(v * 10) / 10).toString() : '0');
const HALO = 'paint-order="stroke" stroke="#fff" stroke-width="4" stroke-linejoin="round"';
export const COL = { P: '#c2255c', A: '#e8590c', cos: '#1971c2', sin: '#2b8a3e', soft: '#adb5bd', ink: '#2b2b2b', arc: '#86198f' };

/** π/q écrit en texte : piT(-2, 3) = « −2π/3 », piT(1, 1) = « π », piT(0, 5) = « 0 » */
export function piT(p, q) {
  if (p === 0) return '0';
  const s = p < 0 ? '−' : '', a = Math.abs(p);
  return `${s}${a === 1 ? '' : a}π${q === 1 ? '' : '/' + q}`;
}

/**
 * Cercle trigonométrique.
 * o.pts = [{ t, l?, c?, proj?, lc?, ls? }]  points M(t) ; proj : pointillés vers les axes ; lc / ls : valeurs de cos / sin écrites sur les axes
 * o.arc = { t, c? }        angle orienté de 0 à t (spirale si plus d'un tour)
 * o.marks                  petits repères gris aux multiples de π/6 et π/4
 * o.tl = [{ t, l }]        textes écrits à l'extérieur du cercle (valeurs d'angles)
 * o.vline = { x, l }       droite x = a ; o.hline = { y, l } droite y = a
 * o.arcs = [{ a, b, c? }]  arcs du cercle mis en évidence (de a à b, sens direct)
 * o.ends = [{ t, open }]   extrémités d'arcs (point plein ou creux)
 * o.noGrad                 sans les graduations 1 et −1
 */
export function cercle(o = {}) {
  const W = 440, H = 380, cx = 220, cy = 190, R = 130, id = `tc${++uid}`;
  const X = x => cx + R * x, Y = y => cy - R * y;
  let s = `<svg viewBox="0 0 ${W} ${H}" class="vis" style="width:100%;max-width:${W}px;max-height:340px" role="img" aria-label="${o.aria || 'cercle trigonométrique'}" font-family="system-ui,sans-serif">`
    + `<defs><marker id="${id}a" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto"><path d="M0,0L10,5L0,10z" fill="#333"/></marker>`
    + `<marker id="${id}b" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto"><path d="M0,0L10,5L0,10z" fill="${(o.arc && o.arc.c) || COL.A}"/></marker></defs>`;
  // axes
  s += `<line x1="${cx - R - 26}" y1="${cy}" x2="${cx + R + 30}" y2="${cy}" stroke="#333" stroke-width="1.6" marker-end="url(#${id}a)"/>`
    + `<line x1="${cx}" y1="${cy + R + 26}" x2="${cx}" y2="${cy - R - 30}" stroke="#333" stroke-width="1.6" marker-end="url(#${id}a)"/>`;
  s += `<circle cx="${cx}" cy="${cy}" r="${R}" fill="none" stroke="${COL.ink}" stroke-width="2.4"/>`;
  // droites x = a, y = a
  if (o.vline) {
    const x = X(Math.max(-1.55, Math.min(1.55, o.vline.x)));
    s += `<line x1="${r1(x)}" y1="${cy - R - 20}" x2="${r1(x)}" y2="${cy + R + 20}" stroke="${COL.cos}" stroke-width="2.2" stroke-dasharray="8 5"/>`;
    // étiquette dans le coin en haut à droite (hors du cercle, loin des noms de points)
    if (o.vline.l) s += `<line x1="${W - 150}" y1="16" x2="${W - 130}" y2="16" stroke="${COL.cos}" stroke-width="2.2" stroke-dasharray="6 4"/><text x="${W - 124}" y="22" font-size="16" font-weight="700" fill="${COL.cos}">${o.vline.l}</text>`;
  }
  if (o.hline) {
    const y = Y(Math.max(-1.35, Math.min(1.35, o.hline.y)));
    s += `<line x1="${cx - R - 20}" y1="${r1(y)}" x2="${cx + R + 20}" y2="${r1(y)}" stroke="${COL.sin}" stroke-width="2.2" stroke-dasharray="8 5"/>`;
    if (o.hline.l) s += `<line x1="${W - 150}" y1="16" x2="${W - 130}" y2="16" stroke="${COL.sin}" stroke-width="2.2" stroke-dasharray="6 4"/><text x="${W - 124}" y="22" font-size="16" font-weight="700" fill="${COL.sin}">${o.hline.l}</text>`;
  }
  // arcs mis en évidence
  (o.arcs || []).forEach(A => {
    const n = Math.max(2, Math.ceil(Math.abs(A.b - A.a) * 30));
    let d = '';
    for (let i = 0; i <= n; i++) { const t = A.a + (A.b - A.a) * i / n; d += (i ? 'L' : 'M') + r1(X(Math.cos(t))) + ',' + r1(Y(Math.sin(t))); }
    s += `<path d="${d}" fill="none" stroke="${A.c || COL.arc}" stroke-width="9" stroke-linecap="round" opacity=".55"/>`;
  });
  // repères
  if (o.marks) {
    for (let k = 0; k < 12; k++) { const t = k * Math.PI / 6; s += `<circle cx="${r1(X(Math.cos(t)))}" cy="${r1(Y(Math.sin(t)))}" r="3" fill="${COL.soft}"/>`; }
    for (let k = 1; k < 8; k += 2) { const t = k * Math.PI / 4; s += `<circle cx="${r1(X(Math.cos(t)))}" cy="${r1(Y(Math.sin(t)))}" r="3" fill="${COL.soft}"/>`; }
  }
  // graduations 1 et −1 (sauf si o.noGrad : figure du cours déjà chargée d'étiquettes)
  if (!o.noGrad) s += `<text x="${cx + R + 5}" y="${cy + 19}" font-size="15" fill="#555" ${HALO}>1</text>`
    + `<text x="${cx - R - 5}" y="${cy + 19}" font-size="15" fill="#555" text-anchor="end" ${HALO}>−1</text>`
    + `<text x="${cx - 7}" y="${cy - R - 6}" font-size="15" fill="#555" text-anchor="end" ${HALO}>1</text>`
    + `<text x="${cx - 7}" y="${cy + R + 19}" font-size="15" fill="#555" text-anchor="end" ${HALO}>−1</text>`;
  s += `<text x="${cx - 7}" y="${cy + 19}" font-size="15" fill="#555" text-anchor="end" ${HALO}>O</text>`;
  // angle orienté (arc fléché, en spirale s'il y a plusieurs tours)
  if (o.arc && Math.abs(o.arc.t) > 1e-9 && Math.abs(o.arc.t) <= 6.5 * Math.PI) {
    const t = o.arc.t, n = Math.ceil(Math.abs(t) * 20), turns = Math.abs(t) / (2 * Math.PI);
    let d = '';
    for (let i = 0; i <= n; i++) {
      const u = t * i / n, r = 30 + (turns > 1 ? 9 * Math.abs(u) / (2 * Math.PI) : 0);
      d += (i ? 'L' : 'M') + r1(cx + r * Math.cos(u)) + ',' + r1(cy - r * Math.sin(u));
    }
    s += `<path d="${d}" fill="none" stroke="${o.arc.c || COL.A}" stroke-width="2.6" marker-end="url(#${id}b)"/>`;
  }
  // points, projections
  (o.pts || []).forEach(p => {
    const c = p.c || COL.P, x = Math.cos(p.t), y = Math.sin(p.t), px = X(x), py = Y(y);
    if (p.ray !== false && (p.proj || o.arc)) s += `<line x1="${cx}" y1="${cy}" x2="${r1(px)}" y2="${r1(py)}" stroke="${c}" stroke-width="2"/>`;
    if (p.proj) {
      s += `<line x1="${r1(px)}" y1="${r1(py)}" x2="${r1(px)}" y2="${cy}" stroke="${COL.cos}" stroke-width="2" stroke-dasharray="5 4"/>`
        + `<line x1="${r1(px)}" y1="${r1(py)}" x2="${cx}" y2="${r1(py)}" stroke="${COL.sin}" stroke-width="2" stroke-dasharray="5 4"/>`
        + `<line x1="${cx}" y1="${cy}" x2="${r1(px)}" y2="${cy}" stroke="${COL.cos}" stroke-width="5" opacity=".75"/>`
        + `<line x1="${cx}" y1="${cy}" x2="${cx}" y2="${r1(py)}" stroke="${COL.sin}" stroke-width="5" opacity=".75"/>`;
      if (p.lc) s += `<text x="${r1(px)}" y="${y > 0.05 ? cy + 22 : cy - 9}" font-size="16" font-weight="700" fill="${COL.cos}" text-anchor="middle" ${HALO}>${p.lc}</text>`;
      if (p.ls) s += `<text x="${x > 0.05 ? cx - 8 : cx + 8}" y="${r1(py + 5)}" font-size="16" font-weight="700" fill="${COL.sin}" text-anchor="${x > 0.05 ? 'end' : 'start'}" ${HALO}>${p.ls}</text>`;
    }
  });
  (o.ends || []).forEach(e => { s += `<circle cx="${r1(X(Math.cos(e.t)))}" cy="${r1(Y(Math.sin(e.t)))}" r="6.5" fill="${e.open ? '#fff' : COL.arc}" stroke="${COL.arc}" stroke-width="2.6"/>`; });
  // textes extérieurs (valeurs d'angles), puis points par-dessus
  const lab = (t, l, c, size, bold, rr = R + 20) => {
    const x = Math.cos(t), y = Math.sin(t), anchor = x > 0.3 ? 'start' : x < -0.3 ? 'end' : 'middle';
    return `<text x="${r1(cx + rr * x)}" y="${r1(cy - rr * y + 6 + (Math.abs(x) <= 0.3 ? (y > 0 ? -4 : 8) : 0))}" font-size="${size}" ${bold ? 'font-weight="700"' : ''} fill="${c}" text-anchor="${anchor}" ${HALO}>${l}</text>`;
  };
  (o.tl || []).forEach(T => { s += lab(T.t, T.l, T.c || '#495057', 15, false, R + 16); });
  (o.pts || []).forEach(p => {
    const c = p.c || COL.P;
    s += `<circle cx="${r1(X(Math.cos(p.t)))}" cy="${r1(Y(Math.sin(p.t)))}" r="6" fill="${c}" stroke="#fff" stroke-width="1.5"/>`;
    if (p.l) s += lab(p.t, p.l, c, 18, true);
  });
  return s + '</svg>';
}

/**
 * Courbes de cos / sin (ou d'une autre fonction) en abscisse graduée en multiples de π/2.
 * o.fs = [{ f, c?, l? }], o.xr = [a, b] en radians (multiples de π/2), o.yr = [ymin, ymax],
 * o.h = { y, l } droite horizontale, o.pts = [{ x, y, l?, c? }], o.xl = [{ x, l }] graduations en π écrites
 */
export function courbe(o) {
  const [xa, xb] = o.xr, [ya, yb] = o.yr || [-1.5, 1.5], pad = (xb - xa) * 0.04;
  const W = 480, H = 256, L = 34, Rm = 12, T = 14, B = 34, pw = W - L - Rm, ph = H - T - B;
  const X = x => L + (x - xa + pad) / (xb - xa + 2 * pad) * pw, Y = y => T + (yb - y) / (yb - ya) * ph, id = `tk${++uid}`;
  let s = `<svg viewBox="0 0 ${W} ${H}" class="vis plot" role="img" aria-label="${o.aria || 'courbe'}" font-family="system-ui,sans-serif"><defs><clipPath id="${id}"><rect x="${L}" y="${T}" width="${pw}" height="${ph}"/></clipPath></defs>`;
  const h = Math.PI / 2;
  for (let k = Math.ceil(xa / h - 1e-9); k * h <= xb + 1e-9; k++) s += `<line x1="${r1(X(k * h))}" y1="${T}" x2="${r1(X(k * h))}" y2="${T + ph}" stroke="${k % 2 ? '#f1efe9' : '#e2dfd7'}"/>`;
  const gy = yb - ya > 8 ? 2 : yb - ya > 4 ? 1 : 0.5, ly = gy < 1 ? 1 : 2 * gy;
  for (let y = Math.ceil(ya / gy) * gy; y <= yb + 1e-9; y += gy) s += `<line x1="${L}" y1="${r1(Y(y))}" x2="${L + pw}" y2="${r1(Y(y))}" stroke="${Math.abs(y / ly - Math.round(y / ly)) < 1e-9 ? '#e2dfd7' : '#f1efe9'}"/>`;
  s += `<line x1="${L}" y1="${r1(Y(0))}" x2="${L + pw}" y2="${r1(Y(0))}" stroke="#333" stroke-width="1.6"/><line x1="${r1(X(0))}" y1="${T}" x2="${r1(X(0))}" y2="${T + ph}" stroke="#333" stroke-width="1.6"/>`;
  for (let y = Math.ceil(ya / ly) * ly; y <= yb + 1e-9; y += ly) if (y) {
    s += `<text x="${L - 5}" y="${r1(Y(y) + 5)}" font-size="14" text-anchor="end" fill="#555">${M(y)}</text>`;
  }
  const xl = o.xl || [];
  if (!o.xl) for (let k = Math.ceil(xa / Math.PI - 1e-9); k * Math.PI <= xb + 1e-9; k++) if (k) xl.push({ x: k * Math.PI, l: piT(k, 1) });
  // graduations en π sous le cadre (la courbe ne les recouvre pas), petits traits sur l'axe
  xl.forEach(g => { s += `<line x1="${r1(X(g.x))}" y1="${r1(Y(0) - 4)}" x2="${r1(X(g.x))}" y2="${r1(Y(0) + 4)}" stroke="#333" stroke-width="1.6"/><text x="${r1(X(g.x))}" y="${T + ph + 21}" font-size="15" text-anchor="middle" fill="#333">${g.l}</text>`; });
  if (o.h) s += `<line x1="${L}" y1="${r1(Y(o.h.y))}" x2="${L + pw}" y2="${r1(Y(o.h.y))}" stroke="${COL.A}" stroke-width="2" stroke-dasharray="7 5"/><text x="${L + pw - 2}" y="${r1(Y(o.h.y) - 6)}" font-size="15" text-anchor="end" fill="${COL.A}" font-weight="700" ${HALO}>${o.h.l}</text>`;
  o.fs.forEach(F => {
    let d = ''; for (let i = 0; i <= 300; i++) { const x = xa - pad + (xb - xa + 2 * pad) * i / 300; d += (i ? 'L' : 'M') + r1(X(x)) + ',' + r1(Y(F.f(x))); }
    s += `<path d="${d}" fill="none" stroke="${F.c || COL.arc}" stroke-width="3" clip-path="url(#${id})"/>`;
  });
  const leg = o.fs.filter(F => F.l);
  if (leg.length) s += `<rect x="${L + 4}" y="${T + 3}" width="${16 + 9.5 * Math.max(...leg.map(F => F.l.length))}" height="${6 + 20 * leg.length}" rx="6" fill="#fff" opacity=".9" stroke="#d9d6cd"/>`;
  leg.forEach((F, i) => { s += `<text x="${L + 11}" y="${T + 20 + 20 * i}" font-size="16" font-weight="700" fill="${F.c || COL.arc}">${F.l}</text>`; });
  (o.pts || []).forEach(p => {
    s += `<circle cx="${r1(X(p.x))}" cy="${r1(Y(p.y))}" r="5.5" fill="${p.c || COL.P}" stroke="#fff" stroke-width="1.5"/>`;
    if (p.l) s += `<text x="${r1(X(p.x) + 8)}" y="${r1(Y(p.y) - 9)}" font-size="16" font-weight="700" fill="${p.c || COL.P}" ${HALO}>${p.l}</text>`;
  });
  return s + '</svg>';
}

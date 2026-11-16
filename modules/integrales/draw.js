// Dessins du module Intégrales (chaînes SVG, sans DOM) : repère quadrillé avec courbes,
// domaines d'aire coloriés (positif) ou hachurés (négatif), rectangles de la méthode des rectangles.
import { M } from '../../engine/util/fmt.js';

let uid = 0;
const r1 = v => (isFinite(v) ? (Math.round(v * 10) / 10).toString() : '0');
const STEP = s => (s <= 14 ? 1 : s <= 28 ? 2 : s <= 70 ? 5 : s <= 140 ? 10 : 20);
const HALO = 'paint-order="stroke" stroke="#fff" stroke-width="4" stroke-linejoin="round"';

export const C_POS = '#f08c00', C_NEG = '#e03131', C_F = 'var(--curve)', C_G = '#2b8a3e', C_ACC = '#7c2d12';

/** fenêtre [ymin, ymax] contenant 0 et les courbes sur [x0, x1] (valeurs bornées à ±lim) */
export function yWin(fns, x0, x1, { lim = 12, m = 1, min = 6, extra = [] } = {}) {
  const v = [0, ...extra];
  fns.forEach(f => { for (let i = 0; i <= 120; i++) { const y = f(x0 + (x1 - x0) * i / 120); if (isFinite(y)) v.push(Math.max(-lim, Math.min(lim, y))); } });
  let lo = Math.floor(Math.min(...v)) - m, hi = Math.ceil(Math.max(...v)) + m;
  while (hi - lo < min) { lo--; if (hi - lo < min) hi++; }
  return [lo, hi];
}

/**
 * Repère quadrillé.
 * o.xr, o.yr : fenêtre ; o.eq : même échelle sur les deux axes (un carreau = une unité d'aire)
 * o.fill = [{ f, g?, a, b, signed? , c? }] domaine entre f et g (g = 0 par défaut) sur [a, b] ;
 *          signed : partie au-dessus de l'axe en orange, partie au-dessous hachurée en rouge
 * o.rects = [{ x, w, h, k: 'lo' | 'up' }] rectangles (verts pleins / orange en pointillés)
 * o.fs = [{ f, dom?, c?, l?, w?, dash? }] courbes ; o.h = { y, l } droite horizontale en pointillés
 * o.xl = [{ x, l }] étiquettes de bornes sous l'axe ; o.pts = [{ x, y, l?, c? }]
 */
export function repere(o) {
  const [xmin, xmax] = o.xr, [ymin, ymax] = o.yr;
  const dx = xmax - xmin, dy = ymax - ymin;
  const W = 460, L = 34, R = 26, T = 24, B = 30, pw = W - L - R;
  const sx = pw / dx;
  const ph = o.eq ? Math.min(420, dy * sx) : Math.max(230, Math.min(330, dy * sx));
  const sy = o.eq ? Math.min(sx, ph / dy) : ph / dy;
  const H = Math.round(ph + T + B);
  const X = x => L + (x - xmin) * sx, Y = y => T + (ymax - y) * sy;
  const stx = STEP(dx), sty = STEP(dy), id = `ig${++uid}`;
  const gx = stx <= 2 && sx >= 9 ? 1 : stx, gy = sty <= 2 && sy >= 9 ? 1 : sty;
  let s = `<svg viewBox="0 0 ${W} ${H}" class="vis plot" style="max-height:420px" role="img" aria-label="${o.aria || 'courbe et domaine d\'aire dans un repère'}" font-family="system-ui,sans-serif"><defs>`
    + `<clipPath id="${id}"><rect x="${L}" y="${T}" width="${r1(pw)}" height="${r1(ph)}"/></clipPath>`
    + `<pattern id="${id}h" patternUnits="userSpaceOnUse" width="8" height="8" patternTransform="rotate(45)"><rect width="8" height="8" fill="#ffe3e3"/><line x1="0" y1="0" x2="0" y2="8" stroke="${C_NEG}" stroke-width="2.4"/></pattern>`
    + `<marker id="${id}a" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto"><path d="M0,0L10,5L0,10z" fill="#333"/></marker></defs>`;
  for (let x = Math.ceil(xmin / gx) * gx; x <= xmax + 1e-9; x += gx) s += `<line x1="${r1(X(x))}" y1="${T}" x2="${r1(X(x))}" y2="${r1(T + ph)}" stroke="${o.eq ? '#dcd8ce' : x % stx ? '#eceae4' : '#d9d6cd'}"/>`;
  for (let y = Math.ceil(ymin / gy) * gy; y <= ymax + 1e-9; y += gy) s += `<line x1="${L}" y1="${r1(Y(y))}" x2="${r1(L + pw)}" y2="${r1(Y(y))}" stroke="${o.eq ? '#dcd8ce' : y % sty ? '#eceae4' : '#d9d6cd'}"/>`;
  s += `<g clip-path="url(#${id})">`;
  // domaines
  const band = (top, bot, a, b, fill, op) => {
    const N = 120; let d = '';
    for (let i = 0; i <= N; i++) { const x = a + (b - a) * i / N; d += (i ? 'L' : 'M') + r1(X(x)) + ',' + r1(Y(top(x))); }
    for (let i = N; i >= 0; i--) { const x = a + (b - a) * i / N; d += 'L' + r1(X(x)) + ',' + r1(Y(bot(x))); }
    return `<path d="${d}Z" fill="${fill}" ${op ? `opacity="${op}"` : ''} stroke="none"/>`;
  };
  (o.fill || []).forEach(F => {
    const g = F.g || (() => 0), lo = Math.max(F.a, xmin), hi = Math.min(F.b, xmax);
    const cl = v => Math.max(ymin - 1, Math.min(ymax + 1, v));
    if (F.signed) {
      s += band(x => cl(Math.max(F.f(x), 0)), () => 0, lo, hi, F.c || C_POS, .45);
      s += band(() => 0, x => cl(Math.min(F.f(x), 0)), lo, hi, `url(#${id}h)`, .85);
    } else s += band(x => cl(F.f(x)), x => cl(g(x)), lo, hi, F.c || C_POS, .45);
  });
  (o.rects || []).forEach(r => {
    const y0 = Y(Math.max(0, r.h)), hh = Math.abs(Y(r.h) - Y(0));
    s += r.k === 'lo'
      ? `<rect x="${r1(X(r.x))}" y="${r1(y0)}" width="${r1(r.w * sx)}" height="${r1(hh)}" fill="#8ce99a" fill-opacity=".55" stroke="${C_G}" stroke-width="1.6"/>`
      : `<rect x="${r1(X(r.x))}" y="${r1(y0)}" width="${r1(r.w * sx)}" height="${r1(hh)}" fill="none" stroke="#e8590c" stroke-width="2.2" stroke-dasharray="6 4"/>`;
  });
  s += '</g>';
  // bornes : droites verticales en pointillés
  (o.xl || []).forEach(t => { s += `<line x1="${r1(X(t.x))}" y1="${T}" x2="${r1(X(t.x))}" y2="${r1(T + ph)}" stroke="${C_ACC}" stroke-width="1.3" stroke-dasharray="4 4" opacity=".7"/>`; });
  // axes
  const ox = X(Math.max(xmin, Math.min(xmax, 0))), oy = Y(Math.max(ymin, Math.min(ymax, 0)));
  s += `<line x1="${L}" y1="${r1(oy)}" x2="${r1(L + pw + 14)}" y2="${r1(oy)}" stroke="#333" stroke-width="1.6" marker-end="url(#${id}a)"/>`
    + `<line x1="${r1(ox)}" y1="${r1(T + ph)}" x2="${r1(ox)}" y2="${r1(T - 14)}" stroke="#333" stroke-width="1.6" marker-end="url(#${id}a)"/>`
    + `<text x="${r1(L + pw + 8)}" y="${r1(oy - 8)}" font-size="17" font-style="italic" ${HALO}>x</text>`
    + `<text x="${r1(ox + 8)}" y="${r1(T - 4)}" font-size="17" font-style="italic" ${HALO}>y</text>`;
  if (o.h) s += `<line x1="${L}" y1="${r1(Y(o.h.y))}" x2="${r1(L + pw)}" y2="${r1(Y(o.h.y))}" stroke="#e8590c" stroke-width="2.4" stroke-dasharray="8 6"/>`;
  // courbes
  (o.fs || []).forEach(F => {
    const [a, b] = F.dom ? [Math.max(F.dom[0], xmin), Math.min(F.dom[1], xmax)] : [xmin, xmax], c = F.c || C_F;
    let d = '', pen = false;
    for (let i = 0; i <= 260; i++) {
      const x = a + (b - a) * i / 260, y = F.f(x);
      if (!isFinite(y)) { pen = false; continue; }
      d += (pen ? 'L' : 'M') + r1(X(x)) + ',' + r1(Math.max(-3000, Math.min(3000, Y(y)))); pen = true;
    }
    s += `<path d="${d}" fill="none" stroke="${c}" stroke-width="${F.w || 3}" ${F.dash ? 'stroke-dasharray="7 5"' : ''} stroke-linejoin="round" clip-path="url(#${id})"/>`;
  });
  // graduations
  const xl = o.xl || [], close = (u, v) => Math.abs(X(u) - X(v)) < 22;
  for (let x = Math.ceil(xmin / stx) * stx; x <= xmax + 1e-9; x += stx) if (x && !xl.some(t => close(t.x, x))) s += `<text x="${r1(X(x))}" y="${r1(Math.min(T + ph + 18, oy + 17))}" font-size="13" text-anchor="middle" fill="#555" ${HALO}>${M(x)}</text>`;
  for (let y = Math.ceil(ymin / sty) * sty; y <= ymax + 1e-9; y += sty) if (y) s += `<text x="${r1(Math.max(L - 2, ox - 5))}" y="${r1(Y(y) + 4)}" font-size="13" text-anchor="end" fill="#555" ${HALO}>${M(y)}</text>`;
  if (!xl.some(t => close(t.x, 0))) s += `<text x="${r1(ox - 5)}" y="${r1(oy + 16)}" font-size="13" text-anchor="end" fill="#555" ${HALO}>0</text>`;
  xl.forEach(t => { s += `<text x="${r1(X(t.x))}" y="${r1(Math.min(T + ph + 22, oy + 19))}" font-size="15" font-weight="700" text-anchor="middle" fill="${C_ACC}" ${HALO}>${t.l}</text>`; });
  if (o.h && o.h.l) s += `<text x="${r1(L + pw - 4)}" y="${r1(Y(o.h.y) - 7)}" font-size="15" font-weight="700" text-anchor="end" fill="#e8590c" ${HALO}>${o.h.l}</text>`;
  (o.pts || []).forEach(p => { s += `<circle cx="${r1(X(p.x))}" cy="${r1(Y(p.y))}" r="5.5" fill="${p.c || '#e8590c'}"/>` + (p.l ? `<text x="${r1(X(p.x) + 9)}" y="${r1(Y(p.y) - 9)}" font-size="15" font-weight="700" fill="${p.c || '#e8590c'}" ${HALO}>${p.l}</text>` : ''); });
  // légendes des courbes : dans le coin du cadre où elles touchent le moins les courbes, les droites, les points
  // et les graduations (en haut à gauche à égalité)
  const leg = (o.fs || []).filter(F => F.l);
  if (leg.length) {
    const lw = 10 + 9.2 * Math.max(...leg.map(F => F.l.length)), lh = 8 + 20 * leg.length;
    const busy = [];
    (o.fs || []).forEach(F => { const [a, b] = F.dom ? [Math.max(F.dom[0], xmin), Math.min(F.dom[1], xmax)] : [xmin, xmax]; for (let i = 0; i <= 200; i++) { const x = a + (b - a) * i / 200, y = F.f(x); if (isFinite(y)) busy.push([X(x), Y(y)]); } });
    if (o.h) for (let i = 0; i <= 40; i++) busy.push([L + pw * i / 40, Y(o.h.y)]);
    (o.pts || []).forEach(p => { for (let k = 0; k < 8; k++) busy.push([X(p.x), Y(p.y)]); });
    for (let i = 0; i <= 40; i++) busy.push([L + pw * i / 40, oy], [L + pw * i / 40, oy + 12], [ox, T + ph * i / 40], [ox - 12, T + ph * i / 40]); // axes et graduations
    const corners = [[L + 2, T + 2], [L + pw - lw - 2, T + 2], [L + 2, T + ph - lh - 2], [L + pw - lw - 2, T + ph - lh - 2]];
    const score = ([cx, cy]) => busy.filter(([px, py]) => px > cx - 6 && px < cx + lw + 6 && py > cy - 6 && py < cy + lh + 6).length;
    const [cx, cy] = corners.reduce((b, c) => (score(c) < score(b) ? c : b));
    leg.forEach((F, k) => { s += `<text x="${r1(cx + 4)}" y="${r1(cy + 20 + 20 * k)}" font-size="16" font-weight="700" fill="${F.c || C_F}" ${HALO}>${F.l}</text>`; });
  }
  return s + '</svg>';
}

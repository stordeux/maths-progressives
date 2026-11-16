// Dessins du module Dérivées (chaînes SVG, sans DOM) : repère quadrillé avec courbe, tangente, sécante,
// triangle de pente ; petits schémas pour les problèmes d'optimisation.
import { M } from '../../engine/util/fmt.js';

let uid = 0;
const r1 = v => (isFinite(v) ? (Math.round(v * 10) / 10).toString() : '0');
/** pas des graduations selon l'étendue */
const STEP = s => (s <= 14 ? 1 : s <= 28 ? 2 : s <= 70 ? 5 : s <= 140 ? 10 : s <= 350 ? 25 : s <= 700 ? 50 : s <= 1400 ? 100 : 250);
const HALO = 'paint-order="stroke" stroke="#fff" stroke-width="4" stroke-linejoin="round"';
export const COL = { f: 'var(--curve)', T: '#c2255c', S: '#e8590c', P: '#2b8a3e', G: '#5f3dc4' };

/** fenêtre [lo, hi] contenant 0 et les valeurs données, avec une marge et une étendue minimale */
export function span(v, m = 1, min = 8) {
  const w = v.filter(isFinite);
  let lo = Math.floor(Math.min(0, ...w)) - m, hi = Math.ceil(Math.max(0, ...w)) + m;
  while (hi - lo < min) { lo--; if (hi - lo < min) hi++; }
  return [lo, hi];
}

/**
 * Repère quadrillé.
 * o.xr, o.yr : fenêtre [min, max] (contiennent 0)
 * o.fs = [{ f, dom?, c?, l? }] courbes (dom : morceau de l'ensemble de définition)
 * o.lines = [{ x, y, m, c?, l?, dash? }] droites passant par (x ; y) de pente m (tangentes, sécantes)
 * o.tri = { x, y, dx, dy, c? } triangle de pente « on avance de dx, on monte de dy »
 * o.pts = [{ x, y, l?, c?, px?, py?, anchor?, ly? }] points (px / py : pointillés vers les axes)
 * o.band = [u, v] bande verticale colorée (intervalle étudié)
 */
export function graph(o) {
  const [xmin, xmax] = o.xr, [ymin, ymax] = o.yr;
  const dx = xmax - xmin, dy = ymax - ymin;
  const W = 460, L = 44, R = 26, T = 24, B = 30, pw = W - L - R;
  const sx = pw / dx, ph = Math.max(250, Math.min(360, dy * sx)), sy = ph / dy, H = Math.round(ph + T + B);
  const X = x => L + (x - xmin) * sx, Y = y => T + (ymax - y) * sy;
  const stx = STEP(dx), sty = STEP(dy), id = `dv${++uid}`;
  const gx = stx <= 2 && sx >= 9 ? 1 : stx, gy = sty <= 2 && sy >= 9 ? 1 : sty;
  let s = `<svg viewBox="0 0 ${W} ${H}" class="vis plot" style="max-height:420px" role="img" aria-label="${o.aria || 'courbe dans un repère'}" font-family="system-ui,sans-serif"><defs><clipPath id="${id}"><rect x="${L}" y="${T}" width="${r1(pw)}" height="${r1(ph)}"/></clipPath>`
    + `<marker id="${id}a" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto"><path d="M0,0L10,5L0,10z" fill="#333"/></marker></defs>`;
  for (let x = Math.ceil(xmin / gx) * gx; x <= xmax + 1e-9; x += gx) s += `<line x1="${r1(X(x))}" y1="${T}" x2="${r1(X(x))}" y2="${r1(T + ph)}" stroke="${x % stx ? '#eceae4' : '#d9d6cd'}"/>`;
  for (let y = Math.ceil(ymin / gy) * gy; y <= ymax + 1e-9; y += gy) s += `<line x1="${L}" y1="${r1(Y(y))}" x2="${r1(L + pw)}" y2="${r1(Y(y))}" stroke="${y % sty ? '#eceae4' : '#d9d6cd'}"/>`;
  const ox = X(Math.max(xmin, Math.min(xmax, 0))), oy = Y(Math.max(ymin, Math.min(ymax, 0)));
  s += `<line x1="${L}" y1="${r1(oy)}" x2="${r1(L + pw + 14)}" y2="${r1(oy)}" stroke="#333" stroke-width="1.6" marker-end="url(#${id}a)"/>`
    + `<line x1="${r1(ox)}" y1="${r1(T + ph)}" x2="${r1(ox)}" y2="${r1(T - 14)}" stroke="#333" stroke-width="1.6" marker-end="url(#${id}a)"/>`
    + `<text x="${r1(L + pw + 6)}" y="${r1(oy - 8)}" font-size="18" font-style="italic" ${HALO}>x</text>`
    + `<text x="${r1(ox + 8)}" y="${r1(T - 4)}" font-size="18" font-style="italic" ${HALO}>y</text>`;
  // bande verticale (intervalle étudié)
  if (o.band) {
    const [u, v] = o.band.map(X);
    s += `<rect x="${r1(u)}" y="${T}" width="${r1(v - u)}" height="${r1(ph)}" fill="#ffe8cc" opacity=".7"/>`;
    [u, v].forEach(z => { s += `<line x1="${r1(z)}" y1="${T}" x2="${r1(z)}" y2="${r1(T + ph)}" stroke="#e8590c" stroke-width="2" stroke-dasharray="6 4"/>`; });
  }
  // droites (sous les courbes)
  (o.lines || []).forEach(D => {
    const c = D.c || COL.T, ya = D.y + D.m * (xmin - D.x), yb = D.y + D.m * (xmax - D.x);
    s += `<line x1="${r1(X(xmin))}" y1="${r1(Math.max(-3000, Math.min(3000, Y(ya))))}" x2="${r1(X(xmax))}" y2="${r1(Math.max(-3000, Math.min(3000, Y(yb))))}" stroke="${c}" stroke-width="2.6" ${D.dash ? 'stroke-dasharray="9 6"' : ''} clip-path="url(#${id})"/>`;
  });
  // courbes
  (o.fs || []).forEach(F => {
    const [a, b] = F.dom || [xmin, xmax], c = F.c || COL.f;
    let d = '', pen = false;
    for (let i = 0; i <= 300; i++) {
      const x = a + (b - a) * i / 300, y = F.f(x);
      if (!isFinite(y)) { pen = false; continue; }
      d += (pen ? 'L' : 'M') + r1(X(x)) + ',' + r1(Math.max(-3000, Math.min(3000, Y(y)))); pen = true;
    }
    s += `<path d="${d}" fill="none" stroke="${c}" stroke-width="3" stroke-linejoin="round" clip-path="url(#${id})"/>`;
  });
  // graduations
  const ly = Math.min(T + ph + 22, Math.max(T + 16, oy + 20));
  for (let x = Math.ceil(xmin / stx) * stx; x <= xmax + 1e-9; x += stx) if (x) s += `<text x="${r1(X(x))}" y="${r1(ly)}" font-size="16" text-anchor="middle" fill="#333" ${HALO}>${M(x)}</text>`;
  const lx = Math.max(L - 4, ox - 7);
  for (let y = Math.ceil(ymin / sty) * sty; y <= ymax + 1e-9; y += sty) if (y) s += `<text x="${r1(lx)}" y="${r1(Y(y) + 5.5)}" font-size="16" text-anchor="end" fill="#333" ${HALO}>${M(y)}</text>`;
  if (xmin <= 0 && xmax >= 0 && ymin <= 0 && ymax >= 0) s += `<text x="${r1(ox - 6)}" y="${r1(oy + 19)}" font-size="16" text-anchor="end" fill="#333" ${HALO}>0</text>`;
  // étiquettes des courbes et des droites
  // (dans une légende, placée dans le coin le moins encombré, dessinée à la fin)
  const leg = [...(o.fs || []).filter(F => F.l).map(F => ({ l: F.l, c: F.c || COL.f })), ...(o.lines || []).filter(D => D.l).map(D => ({ l: D.l, c: D.c || COL.T, dash: D.dash }))];
  let legend = '';
  if (leg.length) {
    const lw = 40 + 9.5 * Math.max(...leg.map(e => e.l.replace(/<[^>]+>/g, '').length)), lh = 8 + 23 * leg.length;
    const busy = [];
    (o.fs || []).forEach(F => { const [a, b] = F.dom || [xmin, xmax]; for (let i = 0; i <= 120; i++) { const x = a + (b - a) * i / 120, y = F.f(x); if (isFinite(y)) busy.push([X(x), Y(y)]); } });
    (o.lines || []).forEach(D => { for (let i = 0; i <= 60; i++) { const x = xmin + dx * i / 60; busy.push([X(x), Y(D.y + D.m * (x - D.x))]); } });
    (o.pts || []).forEach(p => { for (let k = 0; k < 6; k++) busy.push([X(p.x), Y(p.y)]); });
    for (let i = 0; i <= 40; i++) { busy.push([L + pw * i / 40, oy + 10], [L + pw * i / 40, oy - 6]); busy.push([ox - 14, T + ph * i / 40], [ox + 2, T + ph * i / 40]); } // axes et graduations
    if (o.tri) { const t = o.tri; for (let i = 0; i <= 10; i++) busy.push([X(t.x + t.dx * i / 10), Y(t.y)], [X(t.x + t.dx), Y(t.y + t.dy * i / 10)]); }
    const corners = [[L + pw - lw - 4, T + 4], [L + 4, T + 4], [L + pw - lw - 4, T + ph - lh - 4], [L + 4, T + ph - lh - 4]];
    const score = ([cx, cy]) => busy.filter(([px, py]) => px > cx - 8 && px < cx + lw + 8 && py > cy - 8 && py < cy + lh + 8).length;
    const [cx, cy] = corners.reduce((best, c) => (score(c) < score(best) ? c : best));
    legend = `<rect x="${r1(cx)}" y="${r1(cy)}" width="${r1(lw)}" height="${lh}" rx="8" fill="#fff" opacity=".9" stroke="#d9d6cd"/>`;
    leg.forEach((e, i) => {
      const yy = cy + 4 + 23 * i + 12;
      legend += `<line x1="${r1(cx + 8)}" y1="${r1(yy)}" x2="${r1(cx + 28)}" y2="${r1(yy)}" stroke="${e.c}" stroke-width="3" ${e.dash ? 'stroke-dasharray="5 3"' : ''}/>`
        + `<text x="${r1(cx + 34)}" y="${r1(yy + 6)}" font-size="17" font-weight="700" fill="${e.c}">${e.l}</text>`;
    });
  }
  // triangle de pente
  if (o.tri) {
    const t = o.tri, c = t.c || COL.P, x1 = X(t.x), y1 = Y(t.y), x2 = X(t.x + t.dx), y2 = Y(t.y + t.dy);
    s += `<path d="M${r1(x1)},${r1(y1)}L${r1(x2)},${r1(y1)}L${r1(x2)},${r1(y2)}" fill="none" stroke="${c}" stroke-width="3" clip-path="url(#${id})"/>`
      + `<text x="${r1((x1 + x2) / 2)}" y="${r1(y1 + (t.dy > 0 ? 21 : -9))}" font-size="17" font-weight="700" text-anchor="middle" fill="${c}" ${HALO}>${t.dx > 0 ? '+' : ''}${M(t.dx)}</text>`;
    if (t.dy !== 0) s += `<text x="${r1(t.dx > 0 ? x2 + 6 : x2 - 6)}" y="${r1((y1 + y2) / 2 + 6)}" font-size="17" font-weight="700" fill="${c}" text-anchor="${t.dx > 0 ? 'start' : 'end'}" ${HALO}>${t.dy > 0 ? '+' : ''}${M(t.dy)}</text>`;
  }
  // points
  (o.pts || []).forEach(p => {
    const c = p.c || COL.S, px = X(p.x), py = Y(p.y);
    if (p.px) s += `<line x1="${r1(px)}" y1="${r1(py)}" x2="${r1(px)}" y2="${r1(oy)}" stroke="${c}" stroke-width="2" stroke-dasharray="5 4"/>`;
    if (p.py) s += `<line x1="${r1(px)}" y1="${r1(py)}" x2="${r1(ox)}" y2="${r1(py)}" stroke="${c}" stroke-width="2" stroke-dasharray="5 4"/>`;
    s += `<circle cx="${r1(px)}" cy="${r1(py)}" r="5.5" fill="${c}" stroke="#fff" stroke-width="1.5"/>`;
    if (p.l) {
      const anchor = p.anchor || (px > L + pw - 110 ? 'end' : 'start');
      const tx = px + (anchor === 'end' ? -10 : 10), ty = Math.max(T + 14, Math.min(T + ph - 6, py + (p.ly !== undefined ? p.ly : -10)));
      s += `<text x="${r1(tx)}" y="${r1(ty)}" font-size="17" font-weight="700" fill="${c}" text-anchor="${anchor}" ${HALO}>${p.l}</text>`;
    }
  });
  return s + legend + '</svg>';
}

/* ---------- schémas des problèmes d'optimisation ---------- */
const svgBox = (W, H, inner, aria) => `<svg viewBox="0 0 ${W} ${H}" class="vis" style="max-width:${W}px" role="img" aria-label="${aria}" font-family="system-ui,sans-serif">${inner}</svg>`;
const T_ = (x, y, t, o = '') => `<text x="${x}" y="${y}" font-size="18" font-weight="700" text-anchor="middle" ${o}>${t}</text>`;

/** rectangle de côtés x et (P/2 − x) */
export function rectangle(lab) {
  return svgBox(360, 190, `<rect x="70" y="30" width="220" height="120" fill="#e6f4ea" stroke="#0f5132" stroke-width="3"/>`
    + T_(180, 175, lab.bas, 'fill="#0f5132"') + T_(40, 96, 'x', 'fill="#c2255c" font-style="italic"') + T_(180, 96, lab.dedans, 'fill="#333" font-weight="400"'), 'rectangle');
}
/** enclos rectangulaire contre un mur : deux côtés x et un côté L − 2x */
export function enclos(L) {
  return svgBox(380, 200, `<rect x="40" y="18" width="300" height="14" fill="#adb5bd"/>` + T_(190, 15, 'mur', 'font-size="14" fill="#495057" font-weight="400"')
    + `<path d="M80,32 L80,150 L300,150 L300,32" fill="#e6f4ea" stroke="#0f5132" stroke-width="3" stroke-dasharray="10 5"/>`
    + T_(60, 96, 'x', 'fill="#c2255c" font-style="italic"') + T_(322, 96, 'x', 'fill="#c2255c" font-style="italic"') + T_(190, 178, `${M(L)} − 2x`, 'fill="#0f5132"'), 'enclos contre un mur');
}
/** plaque carrée de côté c, on découpe un carré de côté x à chaque coin */
export function boite(c) {
  const s = 170, x0 = 30, y0 = 20, k = 34;
  let in_ = `<rect x="${x0}" y="${y0}" width="${s}" height="${s}" fill="#e6f4ea" stroke="#0f5132" stroke-width="3"/>`;
  [[x0, y0], [x0 + s - k, y0], [x0, y0 + s - k], [x0 + s - k, y0 + s - k]].forEach(([a, b]) => { in_ += `<rect x="${a}" y="${b}" width="${k}" height="${k}" fill="#fff" stroke="#c2255c" stroke-width="2" stroke-dasharray="5 4"/>`; });
  in_ += T_(x0 + k / 2, y0 + k / 2 + 6, 'x', 'fill="#c2255c" font-style="italic"') + T_(x0 + s / 2, y0 + s + 24, `${M(c)} cm`, 'fill="#0f5132"');
  // boîte ouverte en perspective cavalière
  const bx = 250, by = 80, w = 90, h = 50, p = 30;
  in_ += `<path d="M${bx},${by} l${p},${-p / 2} l${w},0 l0,${h} l${-p},${p / 2} z" fill="#d3f9d8" stroke="#0f5132" stroke-width="2"/>`
    + `<rect x="${bx}" y="${by}" width="${w}" height="${h}" fill="#b2f2bb" stroke="#0f5132" stroke-width="2"/>`
    + `<path d="M${bx + w},${by} l${p},${-p / 2}" stroke="#0f5132" stroke-width="2"/>`
    + T_(bx - 12, by + h / 2 + 6, 'x', 'fill="#c2255c" font-style="italic"')
    + T_(bx + w / 2 + 12, by + h + 50, 'boîte ouverte', 'font-size="15" fill="#495057" font-weight="400"');
  return svgBox(400, 220, in_, 'boîte obtenue en pliant une plaque');
}

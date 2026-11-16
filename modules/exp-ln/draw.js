// Dessins du module Exponentielle et logarithme (chaînes SVG, sans DOM).
// graph() reprend le repère quadrillé du module Dérivées (courbes, tangentes, points, légende placée
// dans le coin le moins encombré), avec des graduations « 1, 2, 5 × 10ⁿ » pour les grandes valeurs,
// des courbes en pointillés et des droites verticales (asymptotes). barres() dessine les termes
// d'une suite (croissance ou décroissance exponentielle) avec un seuil éventuel.
import { M } from '../../engine/util/fmt.js';

let uid = 0;
const r1 = v => (isFinite(v) ? (Math.round(v * 10) / 10).toString() : '0');
/** pas « rond » (1, 2 ou 5 × 10ⁿ) pour une étendue s, environ n graduations */
export function niceStep(s, n = 8) {
  const raw = s / n, p = 10 ** Math.floor(Math.log10(raw)), m = raw / p;
  return (m <= 1 ? 1 : m <= 2 ? 2 : m <= 5 ? 5 : 10) * p;
}
const STEP = s => (s <= 14 ? 1 : niceStep(s, 8));
const HALO = 'paint-order="stroke" stroke="#fff" stroke-width="4" stroke-linejoin="round"';
export const COL = { f: 'var(--curve)', T: '#c2255c', S: '#e8590c', P: '#2b8a3e', G: '#5f3dc4', A: '#9a3412' };
/** nombre arrondi pour l'affichage des graduations (évite 0,30000000000000004) */
const lab = v => M(Math.round(v * 1e6) / 1e6);

/** fenêtre [lo, hi] contenant 0 et les valeurs données, avec une marge et une étendue minimale */
export function span(v, m = 1, min = 8) {
  const w = v.filter(isFinite);
  let lo = Math.floor(Math.min(0, ...w)) - m, hi = Math.ceil(Math.max(0, ...w)) + m;
  while (hi - lo < min) { lo--; if (hi - lo < min) hi++; }
  return [lo, hi];
}

/**
 * Repère quadrillé.
 * o.xr, o.yr : fenêtre [min, max]
 * o.fs = [{ f, dom?, c?, l?, dash? }] courbes (dom : morceau de l'ensemble de définition)
 * o.lines = [{ x, y, m, c?, l?, dash? }] droites passant par (x ; y) de pente m
 * o.vs = [{ x, c?, l? }] droites verticales en pointillés (asymptotes, abscisses étudiées)
 * o.pts = [{ x, y, l?, c?, px?, py?, anchor?, ly? }] points (px / py : pointillés vers les axes)
 * o.band = [u, v] bande verticale colorée (ensemble de définition, solutions)
 */
export function graph(o) {
  const [xmin, xmax] = o.xr, [ymin, ymax] = o.yr;
  const dx = xmax - xmin, dy = ymax - ymin;
  const W = 460, L = 50, R = 26, T = 24, B = 30, pw = W - L - R;
  const sx = pw / dx, ph = Math.max(250, Math.min(360, dy * sx)), sy = ph / dy, H = Math.round(ph + T + B);
  const X = x => L + (x - xmin) * sx, Y = y => T + (ymax - y) * sy;
  const Yc = y => Math.max(-3000, Math.min(3000, Y(y)));
  const stx = STEP(dx), sty = STEP(dy), id = `el${++uid}`;
  const gx = stx <= 2 && sx >= 9 ? 1 : stx, gy = sty <= 2 && sy >= 9 ? 1 : sty;
  const mod = (v, s) => Math.abs(v / s - Math.round(v / s)) > 1e-9;
  let s = `<svg viewBox="0 0 ${W} ${H}" class="vis plot" style="max-height:420px" role="img" aria-label="${o.aria || 'courbe dans un repère'}" font-family="system-ui,sans-serif"><defs><clipPath id="${id}"><rect x="${L}" y="${T}" width="${r1(pw)}" height="${r1(ph)}"/></clipPath>`
    + `<marker id="${id}a" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto"><path d="M0,0L10,5L0,10z" fill="#333"/></marker></defs>`;
  for (let x = Math.ceil(xmin / gx - 1e-9) * gx; x <= xmax + 1e-9; x += gx) s += `<line x1="${r1(X(x))}" y1="${T}" x2="${r1(X(x))}" y2="${r1(T + ph)}" stroke="${mod(x, stx) ? '#eceae4' : '#d9d6cd'}"/>`;
  for (let y = Math.ceil(ymin / gy - 1e-9) * gy; y <= ymax + 1e-9; y += gy) s += `<line x1="${L}" y1="${r1(Y(y))}" x2="${r1(L + pw)}" y2="${r1(Y(y))}" stroke="${mod(y, sty) ? '#eceae4' : '#d9d6cd'}"/>`;
  const ox = X(Math.max(xmin, Math.min(xmax, 0))), oy = Y(Math.max(ymin, Math.min(ymax, 0)));
  s += `<line x1="${L}" y1="${r1(oy)}" x2="${r1(L + pw + 14)}" y2="${r1(oy)}" stroke="#333" stroke-width="1.6" marker-end="url(#${id}a)"/>`
    + `<line x1="${r1(ox)}" y1="${r1(T + ph)}" x2="${r1(ox)}" y2="${r1(T - 14)}" stroke="#333" stroke-width="1.6" marker-end="url(#${id}a)"/>`
    + `<text x="${r1(L + pw + 6)}" y="${r1(oy - 8)}" font-size="18" font-style="italic" ${HALO}>${o.xn || 'x'}</text>`
    + `<text x="${r1(ox + 8)}" y="${r1(T - 4)}" font-size="18" font-style="italic" ${HALO}>y</text>`;
  if (o.band) {
    const [u, v] = o.band.map(z => X(Math.max(xmin, Math.min(xmax, z))));
    s += `<rect x="${r1(u)}" y="${T}" width="${r1(v - u)}" height="${r1(ph)}" fill="#ffe8cc" opacity=".6"/>`;
  }
  (o.vs || []).forEach(V => {
    if (V.x < xmin || V.x > xmax) return;
    s += `<line x1="${r1(X(V.x))}" y1="${T}" x2="${r1(X(V.x))}" y2="${r1(T + ph)}" stroke="${V.c || '#868e96'}" stroke-width="2" stroke-dasharray="7 5"/>`;
  });
  // droites (sous les courbes)
  (o.lines || []).forEach(D => {
    const c = D.c || COL.T, ya = D.y + D.m * (xmin - D.x), yb = D.y + D.m * (xmax - D.x);
    s += `<line x1="${r1(X(xmin))}" y1="${r1(Yc(ya))}" x2="${r1(X(xmax))}" y2="${r1(Yc(yb))}" stroke="${c}" stroke-width="2.6" ${D.dash ? 'stroke-dasharray="9 6"' : ''} clip-path="url(#${id})"/>`;
  });
  // courbes
  (o.fs || []).forEach(F => {
    const [a, b] = F.dom || [xmin, xmax], c = F.c || COL.f;
    let d = '', pen = false;
    for (let i = 0; i <= 300; i++) {
      const x = a + (b - a) * i / 300, y = F.f(x);
      if (!isFinite(y)) { pen = false; continue; }
      d += (pen ? 'L' : 'M') + r1(X(x)) + ',' + r1(Yc(y)); pen = true;
    }
    s += `<path d="${d}" fill="none" stroke="${c}" stroke-width="3" stroke-linejoin="round" ${F.dash ? 'stroke-dasharray="8 6"' : ''} clip-path="url(#${id})"/>`;
  });
  // graduations
  const ly = Math.min(T + ph + 22, Math.max(T + 16, oy + 20));
  for (let x = Math.ceil(xmin / stx - 1e-9) * stx; x <= xmax + 1e-9; x += stx) if (Math.abs(x) > 1e-9) s += `<text x="${r1(X(x))}" y="${r1(ly)}" font-size="16" text-anchor="middle" fill="#333" ${HALO}>${lab(x)}</text>`;
  const lx = Math.max(L - 4, ox - 7);
  for (let y = Math.ceil(ymin / sty - 1e-9) * sty; y <= ymax + 1e-9; y += sty) if (Math.abs(y) > 1e-9) s += `<text x="${r1(lx)}" y="${r1(Y(y) + 5.5)}" font-size="16" text-anchor="end" fill="#333" ${HALO}>${lab(y)}</text>`;
  if (xmin <= 0 && xmax >= 0 && ymin <= 0 && ymax >= 0) s += `<text x="${r1(ox - 6)}" y="${r1(oy + 19)}" font-size="16" text-anchor="end" fill="#333" ${HALO}>0</text>`;
  // légende dans le coin le moins encombré
  const leg = [...(o.fs || []).filter(F => F.l).map(F => ({ l: F.l, c: F.c || COL.f, dash: F.dash })), ...(o.lines || []).filter(D => D.l).map(D => ({ l: D.l, c: D.c || COL.T, dash: D.dash }))];
  let legend = '';
  if (leg.length) {
    const lw = 40 + 9.5 * Math.max(...leg.map(e => e.l.replace(/<[^>]+>/g, '').length)), lh = 8 + 23 * leg.length;
    const busy = [];
    (o.fs || []).forEach(F => { const [a, b] = F.dom || [xmin, xmax]; for (let i = 0; i <= 120; i++) { const x = a + (b - a) * i / 120, y = F.f(x); if (isFinite(y)) busy.push([X(x), Y(y)]); } });
    (o.lines || []).forEach(D => { for (let i = 0; i <= 60; i++) { const x = xmin + dx * i / 60; busy.push([X(x), Y(D.y + D.m * (x - D.x))]); } });
    (o.pts || []).forEach(p => { for (let k = 0; k < 6; k++) busy.push([X(p.x), Y(p.y)]); });
    for (let i = 0; i <= 40; i++) { busy.push([L + pw * i / 40, oy + 10], [L + pw * i / 40, oy - 6]); busy.push([ox - 14, T + ph * i / 40], [ox + 2, T + ph * i / 40]); }
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
  // points
  (o.pts || []).forEach(p => {
    const c = p.c || COL.S, px = X(p.x), py = Y(p.y);
    if (p.px) s += `<line x1="${r1(px)}" y1="${r1(py)}" x2="${r1(px)}" y2="${r1(oy)}" stroke="${c}" stroke-width="2" stroke-dasharray="5 4"/>`;
    if (p.py) s += `<line x1="${r1(px)}" y1="${r1(py)}" x2="${r1(ox)}" y2="${r1(py)}" stroke="${c}" stroke-width="2" stroke-dasharray="5 4"/>`;
    s += `<circle cx="${r1(px)}" cy="${r1(py)}" r="5.5" fill="${c}" stroke="#fff" stroke-width="1.5"/>`;
    if (p.l) {
      const anchor = p.anchor || (px > L + pw - 130 ? 'end' : 'start');
      const tx = px + (anchor === 'end' ? -10 : 10), ty = Math.max(T + 14, Math.min(T + ph - 6, py + (p.ly !== undefined ? p.ly : -10)));
      s += `<text x="${r1(tx)}" y="${r1(ty)}" font-size="17" font-weight="700" fill="${c}" text-anchor="${anchor}" ${HALO}>${p.l}</text>`;
    }
  });
  return s + legend + '</svg>';
}

/**
 * Termes u₀, u₁, … d'une suite en barres.
 * o.seuil : droite horizontale en pointillés ; o.hl : indice de la barre mise en valeur ;
 * o.x0 : indice du premier terme (0 par défaut) ; o.nom : nom des termes (« u »)
 */
export function barres(vals, o = {}) {
  const n = vals.length, x0 = o.x0 || 0;
  const top = Math.max(...vals, o.seuil || 0) * 1.12 || 1;
  const st = niceStep(top, 6), ymax = Math.ceil(top / st) * st;
  const labs = []; for (let y = 0; y <= ymax + 1e-9; y += st) labs.push(lab(y));
  const W = 460, L = 16 + 9.5 * Math.max(...labs.map(t => t.length)), R = 18, T = 26, B = 40, ph = 250, pw = W - L - R, H = T + ph + B;
  const bw = pw / n, X = i => L + bw * i, Y = y => T + (ymax - y) * ph / ymax;
  let s = `<svg viewBox="0 0 ${W} ${H}" class="vis plot" style="max-height:380px" role="img" aria-label="${o.aria || 'termes d\'une suite'}" font-family="system-ui,sans-serif">`;
  labs.forEach((t, k) => {
    const y = Y(k * st);
    s += `<line x1="${r1(L)}" y1="${r1(y)}" x2="${r1(L + pw)}" y2="${r1(y)}" stroke="${k ? '#e3e0d8' : '#333'}" stroke-width="${k ? 1 : 1.6}"/>`
      + `<text x="${r1(L - 6)}" y="${r1(y + 5.5)}" font-size="15" text-anchor="end" fill="#333">${t}</text>`;
  });
  const every = Math.max(1, Math.ceil(n / 12));
  vals.forEach((v, i) => {
    const hi = i === o.hl, c = hi ? COL.S : (o.seuil !== undefined && (o.up ? v > o.seuil : v < o.seuil)) ? COL.P : 'var(--curve)';
    const gap = Math.min(6, bw * 0.2);
    s += `<rect x="${r1(X(i) + gap / 2)}" y="${r1(Y(Math.max(0, v)))}" width="${r1(bw - gap)}" height="${r1(Math.max(0, Y(0) - Y(Math.max(0, v))))}" fill="${c}" opacity="${hi ? 1 : 0.8}" rx="${bw > 12 ? 3 : 0}"/>`;
    const near = o.hl !== undefined && !hi && Math.abs(i - o.hl) * bw < 28; // laisse la place au numéro mis en valeur
    if ((i % every === 0 && !near) || hi) s += `<text x="${r1(X(i) + bw / 2)}" y="${r1(T + ph + 20)}" font-size="15" text-anchor="middle" fill="${hi ? COL.S : '#333'}" font-weight="${hi ? 700 : 400}">${i + x0}</text>`;
  });
  s += `<text x="${r1(L + pw)}" y="${r1(T + ph + 37)}" font-size="15" text-anchor="end" fill="#555" font-style="italic">${o.xl || 'n'}</text>`;
  if (o.seuil !== undefined) {
    const y = Y(o.seuil);
    s += `<line x1="${r1(L)}" y1="${r1(y)}" x2="${r1(L + pw)}" y2="${r1(y)}" stroke="${COL.T}" stroke-width="2.6" stroke-dasharray="9 6"/>`
      // suite croissante : étiquette à gauche (barres basses) ; décroissante : à droite, au-dessus de la droite
      + `<text x="${r1(o.up === false ? L + pw - 4 : L + 8)}" y="${r1(y - 8)}" font-size="16" font-weight="700" fill="${COL.T}" text-anchor="${o.up === false ? 'end' : 'start'}" ${HALO}>${o.seuilL || 'seuil ' + lab(o.seuil)}</text>`;
  }
  if (o.hl !== undefined && o.hlL) {
    let yc = Y(Math.max(0, vals[o.hl])) - 8;
    if (o.seuil !== undefined && o.up === false) yc = Math.min(yc, Y(o.seuil) - 30); // ne pas recouvrir l'étiquette du seuil
    const xc = X(o.hl) + bw / 2, anchor = xc > L + pw - 100 ? 'end' : xc < L + 100 ? 'start' : 'middle';
    s += `<text x="${r1(xc)}" y="${r1(Math.max(T + 12, yc))}" font-size="16" font-weight="700" text-anchor="${anchor}" fill="${COL.S}" ${HALO}>${o.hlL}</text>`;
  }
  return s + '</svg>';
}

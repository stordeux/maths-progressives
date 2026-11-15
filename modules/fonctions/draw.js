// Dessins du module Fonctions (chaînes SVG, sans DOM) : repère quadrillé et « machine » f.
import { M } from '../../engine/util/fmt.js';

let uid = 0;
const r1 = v => (isFinite(v) ? (Math.round(v * 10) / 10).toString() : '0');
/** pas des graduations selon l'étendue */
const STEP = s => (s <= 14 ? 1 : s <= 28 ? 2 : s <= 70 ? 5 : s <= 140 ? 10 : s <= 350 ? 25 : 50);
const HALO = 'paint-order="stroke" stroke="#fff" stroke-width="4" stroke-linejoin="round"';
const esc = s => String(s).replace(/</g, '&lt;');

/**
 * Repère quadrillé.
 * o.xr, o.yr : fenêtre [min, max] (doivent contenir 0)
 * o.fs = [{ f, dom?, c?, l?, ends? }] courbes (dom : ensemble de définition, ends : points aux bornes)
 * o.h = { y, l } droite horizontale en pointillés
 * o.pts = [{ x, y, l?, c?, px?, py?, lx?, ly?, anchor? }] points (px / py : pointillés vers les axes)
 * o.tri = { x, y, dx, dy, c? } triangle « on avance de dx, on monte de dy »
 * o.xl = [{ x, l, c }] étiquettes en couleur sous l'axe des abscisses
 */
export function graph(o) {
  const [xmin, xmax] = o.xr, [ymin, ymax] = o.yr;
  const dx = xmax - xmin, dy = ymax - ymin;
  const W = 460, L = 40, R = 26, T = 24, B = 30, pw = W - L - R;
  const sx = pw / dx, ph = Math.max(250, Math.min(380, dy * sx)), sy = ph / dy, H = Math.round(ph + T + B);
  const X = x => L + (x - xmin) * sx, Y = y => T + (ymax - y) * sy;
  const stx = STEP(dx), sty = STEP(dy), id = `fc${++uid}`;
  const gx = stx <= 2 && sx >= 9 ? 1 : stx, gy = sty <= 2 && sy >= 9 ? 1 : sty;
  let s = `<svg viewBox="0 0 ${W} ${H}" class="vis plot" style="max-height:440px" role="img" aria-label="${esc(o.aria || 'graphique dans un repère')}" font-family="system-ui,sans-serif"><defs><clipPath id="${id}"><rect x="${L}" y="${T}" width="${r1(pw)}" height="${r1(ph)}"/></clipPath>`
    + `<marker id="${id}a" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto"><path d="M0,0L10,5L0,10z" fill="#333"/></marker></defs>`;
  // quadrillage
  for (let x = Math.ceil(xmin / gx) * gx; x <= xmax + 1e-9; x += gx) s += `<line x1="${r1(X(x))}" y1="${T}" x2="${r1(X(x))}" y2="${r1(T + ph)}" stroke="${x % stx ? '#eceae4' : '#d9d6cd'}"/>`;
  for (let y = Math.ceil(ymin / gy) * gy; y <= ymax + 1e-9; y += gy) s += `<line x1="${L}" y1="${r1(Y(y))}" x2="${r1(L + pw)}" y2="${r1(Y(y))}" stroke="${y % sty ? '#eceae4' : '#d9d6cd'}"/>`;
  // axes
  const ox = X(0), oy = Y(0);
  s += `<line x1="${L}" y1="${r1(oy)}" x2="${r1(L + pw + 14)}" y2="${r1(oy)}" stroke="#333" stroke-width="1.6" marker-end="url(#${id}a)"/>`
    + `<line x1="${r1(ox)}" y1="${r1(T + ph)}" x2="${r1(ox)}" y2="${r1(T - 14)}" stroke="#333" stroke-width="1.6" marker-end="url(#${id}a)"/>`
    + `<text x="${r1(L + pw + 6)}" y="${r1(oy - 8)}" font-size="18" font-style="italic" ${HALO}>x</text>`
    + `<text x="${r1(ox + 8)}" y="${r1(T - 4)}" font-size="18" font-style="italic" ${HALO}>y</text>`;
  // droite horizontale (sous les courbes)
  if (o.h) s += `<line x1="${L}" y1="${r1(Y(o.h.y))}" x2="${r1(L + pw)}" y2="${r1(Y(o.h.y))}" stroke="#e8590c" stroke-width="2.2" stroke-dasharray="8 6"/>`;
  // courbes
  (o.fs || []).forEach((F, k) => {
    const [a, b] = F.dom || [xmin, xmax], c = F.c || 'var(--curve)';
    let d = '';
    for (let i = 0; i <= 240; i++) { const x = a + (b - a) * i / 240; d += (i ? 'L' : 'M') + r1(X(x)) + ',' + r1(Math.max(-3000, Math.min(3000, Y(F.f(x))))); }
    s += `<path d="${d}" fill="none" stroke="${c}" stroke-width="3" stroke-linejoin="round" clip-path="url(#${id})"/>`;
    if (F.ends) [a, b].forEach(x => { s += `<circle cx="${r1(X(x))}" cy="${r1(Y(F.f(x)))}" r="4" fill="${c}"/>`; });
    if (F.l) {
      // étiquette près de la fin de la partie visible de la courbe
      let xl = b - (b - a) * (0.06 + 0.12 * k);
      for (let i = 0; i < 40 && (F.f(xl) > ymax - 0.3 || F.f(xl) < ymin + 0.3); i++) xl -= (b - a) / 40;
      const pos = u => [Math.min(X(u), L + pw - 2), Math.max(T + 14, Math.min(T + ph - 6, Y(F.f(u)) - 10))];
      const clash = ([tx, ty]) => (o.pts || []).some(p => Math.abs(Y(p.y) - 9 - ty) < 26 && X(p.x) > tx - 130 && X(p.x) < tx + 30);
      for (let i = 0; i < 12 && clash(pos(xl)); i++) xl -= (b - a) / 16;
      const [tlx, ty] = pos(xl);
      if (!clash([tlx, ty])) s += `<text x="${r1(tlx)}" y="${r1(ty)}" font-size="17" text-anchor="end" fill="${c}" font-weight="700" ${HALO}>${F.l}</text>`;
    }
  });
  // graduations (par-dessus les courbes, avec un halo blanc)
  const xl = o.xl || [], near = (u, v) => Math.abs(u - v) < 1e-9;
  const ly = Math.min(T + ph + 22, Math.max(T + 16, oy + 20));
  for (let x = Math.ceil(xmin / stx) * stx; x <= xmax + 1e-9; x += stx) if (x && !xl.some(e => Math.abs(e.x - x) < 0.6)) s += `<text x="${r1(X(x))}" y="${r1(ly)}" font-size="16" text-anchor="middle" fill="#333" ${HALO}>${M(x)}</text>`;
  const lx = Math.max(L - 4, ox - 7);
  for (let y = Math.ceil(ymin / sty) * sty; y <= ymax + 1e-9; y += sty) if (y) s += `<text x="${r1(lx)}" y="${r1(Y(y) + 5.5)}" font-size="16" text-anchor="end" fill="#333" ${HALO}>${M(y)}</text>`;
  if (!xl.some(e => near(e.x, 0))) s += `<text x="${r1(ox - 6)}" y="${r1(oy + 19)}" font-size="16" text-anchor="end" fill="#333" ${HALO}>0</text>`;
  if (o.h && o.h.l) s += `<text x="${r1(L + 4)}" y="${r1(Y(o.h.y) - 7)}" font-size="17" fill="#e8590c" font-weight="700" ${HALO}>${o.h.l}</text>`;
  // triangle de pente
  if (o.tri) {
    const t = o.tri, c = t.c || '#c2255c', x1 = X(t.x), y1 = Y(t.y), x2 = X(t.x + t.dx), y2 = Y(t.y + t.dy);
    s += `<path d="M${r1(x1)},${r1(y1)}L${r1(x2)},${r1(y1)}L${r1(x2)},${r1(y2)}" fill="none" stroke="${c}" stroke-width="2.6" clip-path="url(#${id})"/>`
      + `<text x="${r1((x1 + x2) / 2)}" y="${r1(y1 + (t.dy > 0 ? (Math.abs(t.y) < 1e-9 ? 40 : 20) : -9))}" font-size="17" font-weight="700" text-anchor="middle" fill="${c}" ${HALO}>+${M(t.dx)}</text>`
      + `<text x="${r1(x2 + 6)}" y="${r1((y1 + y2) / 2 + 6)}" font-size="17" font-weight="700" fill="${c}" ${HALO}>${t.dy > 0 ? '+' : ''}${M(t.dy)}</text>`;
  }
  // points
  (o.pts || []).forEach(p => {
    const c = p.c || '#e8590c', px = X(p.x), py = Y(p.y);
    if (p.px) s += `<line x1="${r1(px)}" y1="${r1(py)}" x2="${r1(px)}" y2="${r1(oy)}" stroke="${c}" stroke-width="2" stroke-dasharray="5 4"/>`;
    if (p.py) s += `<line x1="${r1(px)}" y1="${r1(py)}" x2="${r1(ox)}" y2="${r1(py)}" stroke="${c}" stroke-width="2" stroke-dasharray="5 4"/>`;
    s += `<circle cx="${r1(px)}" cy="${r1(py)}" r="5.5" fill="${c}" stroke="#fff" stroke-width="1.5"/>`;
    if (p.l) {
      let anchor = p.anchor || (px > L + pw - 90 ? 'end' : 'start');
      const tx = px + (p.lx !== undefined ? p.lx : anchor === 'end' ? -9 : 9), ty = Math.max(T + 12, Math.min(T + ph - 4, py + (p.ly !== undefined ? p.ly : -9)));
      s += `<text x="${r1(tx)}" y="${r1(ty)}" font-size="17" font-weight="700" fill="${c}" text-anchor="${anchor}" ${HALO}>${p.l}</text>`;
    }
  });
  xl.forEach(e => { s += `<text x="${r1(X(e.x))}" y="${r1(oy + (e.below === false ? -9 : 20))}" font-size="17" font-weight="800" text-anchor="middle" fill="${e.c || '#e03131'}" ${HALO}>${e.l}</text>`; });
  return s + '</svg>';
}

/** la « machine » f : antécédent → f → image */
export function machine(a, b, n = 'f', labels = true, top = `${n}(${a}) = ${b}`) {
  const W = 460, H = 130;
  return `<svg viewBox="0 0 ${W} ${H}" class="vis" role="img" aria-label="${n} transforme ${a} en ${b}" font-family="system-ui,sans-serif" style="max-width:460px">`
    + `<defs><marker id="mq${++uid}" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="8" markerHeight="8" orient="auto"><path d="M0,0L10,5L0,10z" fill="#495057"/></marker></defs>`
    + `<rect x="10" y="38" width="110" height="50" rx="12" fill="#e7f5ff" stroke="#1c7ed6" stroke-width="2"/><text x="65" y="71" font-size="22" font-weight="700" text-anchor="middle" fill="#1864ab">${a}</text>`
    + `<line x1="124" y1="63" x2="176" y2="63" stroke="#495057" stroke-width="3" marker-end="url(#mq${uid})"/>`
    + `<rect x="180" y="28" width="100" height="70" rx="14" fill="#343a40"/><text x="230" y="73" font-size="30" font-style="italic" font-weight="700" text-anchor="middle" fill="#fff">${n}</text>`
    + `<line x1="284" y1="63" x2="336" y2="63" stroke="#495057" stroke-width="3" marker-end="url(#mq${uid})"/>`
    + `<rect x="340" y="38" width="110" height="50" rx="12" fill="#fff4e6" stroke="#e8590c" stroke-width="2"/><text x="395" y="71" font-size="22" font-weight="700" text-anchor="middle" fill="#d9480f">${b}</text>`
    + (labels ? `<text x="65" y="112" font-size="15" text-anchor="middle" fill="#1864ab" font-weight="700">antécédent</text><text x="395" y="112" font-size="15" text-anchor="middle" fill="#d9480f" font-weight="700">image</text><text x="230" y="18" font-size="14" text-anchor="middle" fill="#495057">${top}</text>` : '')
    + '</svg>';
}

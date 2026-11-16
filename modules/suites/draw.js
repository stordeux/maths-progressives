// Dessins du module Suites (chaînes SVG, sans DOM) :
// nuage de points (n ; uₙ) avec quadrillage, seuil horizontal, points mis en évidence ;
// escalier de récurrence (« toile ») pour uₙ₊₁ = f(uₙ) avec la droite y = x.
import { M } from '../../engine/util/fmt.js';

let uid = 0;
const r1 = v => (isFinite(v) ? (Math.round(v * 10) / 10).toString() : '0');
/** pas des graduations selon l'étendue */
const STEP = s => { if (s <= 14) return 1; const t = s / 10, p = 10 ** Math.floor(Math.log10(t)); return [1, 2, 2.5, 5, 10].map(k => k * p).find(k => k >= t - 1e-9); };
const HALO = 'paint-order="stroke" stroke="#fff" stroke-width="4" stroke-linejoin="round"';
export const COL = { pt: '#155e75', hl: '#e8590c', S: '#c2255c', f: 'var(--curve)', id: '#868e96' };
/** u indicé en SVG */
export const uS = (k, nom = 'u') => `${nom}<tspan baseline-shift="sub" font-size="72%">${k}</tspan>`;

/** fenêtre [lo, hi] contenant 0 et les valeurs, arrondie au pas des graduations */
function yWindow(vals) {
  let lo = Math.min(0, ...vals), hi = Math.max(0, ...vals);
  const st = STEP((hi - lo) * 1.15 + 1);
  lo = lo < 0 ? Math.floor(lo / st - 0.3) * st : 0;
  hi = Math.ceil(hi / st + 0.6) * st;
  while (st === 1 && hi - lo < 6) hi++;
  return [lo, hi];
}

/**
 * Nuage de points (n ; uₙ).
 * o.pts = [[n, u], …] ; o.hl = indices n mis en évidence ; o.ask = n du point marqué « ? » (sans valeur) ;
 * o.seuil = { y, l } droite horizontale ; o.vals = true : la valeur est écrite à côté de chaque point ;
 * o.yr = [lo, hi] fenêtre imposée ; o.nom = 'u' ; o.grid1 = true : quadrillage à chaque unité.
 * L'élément svg porte data-x0, data-sx, data-y0, data-sy (repère) et chaque point data-n : les tests
 * relisent la valeur d'un point à partir de sa position dessinée.
 */
export function nuage(o) {
  const pts = o.pts, nom = o.nom || 'u';
  const ns = pts.map(p => p[0]), us = pts.map(p => p[1]);
  const nmin = Math.min(...ns) > 4 ? Math.min(...ns) - 1 : 0, nmax = Math.max(...ns) + 1; // axe vertical en n = nmin
  const [ymin, ymax] = o.yr || yWindow([...us, ...(o.seuil ? [o.seuil.y] : [])]);
  const lw = Math.max(...[ymin, ymax].map(y => M(y).length));
  const W = 460, L = Math.max(44, 16 + 9 * lw), R = 22, T = 26, B = 34, pw = W - L - R;
  const dy = ymax - ymin, sty = o.grid1 && dy <= 18 ? 1 : STEP(dy), ph = Math.max(230, Math.min(320, 26 * dy / sty)), H = Math.round(ph + T + B);
  const sx = pw / (nmax - nmin), sy = ph / dy;
  const X = n => L + (n - nmin) * sx, Y = y => T + (ymax - y) * sy;
  const stx = nmax - nmin <= 12 ? 1 : nmax - nmin <= 24 ? 2 : 5;
  const gy = o.grid1 && sty > 1 && dy <= 30 ? 1 : sty;
  const id = `su${++uid}`;
  let s = `<svg viewBox="0 0 ${W} ${H}" class="vis plot" style="max-height:400px" role="img" aria-label="${o.aria || 'nuage de points de la suite'}" font-family="system-ui,sans-serif" data-x0="${L - nmin * sx}" data-sx="${sx}" data-y0="${T + ymax * sy}" data-sy="${sy}">`
    + `<defs><marker id="${id}a" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto"><path d="M0,0L10,5L0,10z" fill="#333"/></marker></defs>`;
  for (let n = nmin; n <= nmax; n++) s += `<line x1="${r1(X(n))}" y1="${T}" x2="${r1(X(n))}" y2="${r1(T + ph)}" stroke="${n % stx ? '#eceae4' : '#d9d6cd'}"/>`;
  for (let y = Math.ceil(ymin / gy) * gy; y <= ymax + 1e-9; y += gy) s += `<line x1="${L}" y1="${r1(Y(y))}" x2="${r1(L + pw)}" y2="${r1(Y(y))}" stroke="${y % sty ? '#eceae4' : '#d9d6cd'}"/>`;
  const oy = Y(Math.max(ymin, Math.min(ymax, 0))), ox = X(nmin);
  s += `<line x1="${L}" y1="${r1(oy)}" x2="${r1(L + pw + 14)}" y2="${r1(oy)}" stroke="#333" stroke-width="1.6" marker-end="url(#${id}a)"/>`
    + `<line x1="${r1(ox)}" y1="${r1(T + ph)}" x2="${r1(ox)}" y2="${r1(T - 14)}" stroke="#333" stroke-width="1.6" marker-end="url(#${id}a)"/>`
    + `<text x="${r1(L + pw + 4)}" y="${r1(oy - 8)}" font-size="17" font-style="italic" text-anchor="end" ${HALO}>n</text>`
    + `<text x="${r1(ox + 8)}" y="${r1(T - 4)}" font-size="17" font-style="italic" ${HALO}>${uS('n', nom)}</text>`;
  // graduations
  const ly = T + ph + 21; // rangs sous le cadre : jamais sur les points
  for (let n = Math.ceil(nmin / stx) * stx; n < nmax; n += stx) s += `<text x="${r1(X(n))}" y="${r1(ly)}" font-size="15" text-anchor="middle" fill="#333" ${HALO}>${M(n)}</text>`;
  for (let y = Math.ceil(ymin / sty) * sty; y <= ymax + 1e-9; y += sty) if (y) s += `<text x="${r1(ox - 7)}" y="${r1(Y(y) + 5)}" font-size="15" text-anchor="end" fill="#333" ${HALO}>${M(y)}</text>`;
  // seuil
  if (o.seuil) {
    const ys = Y(o.seuil.y);
    s += `<line x1="${L}" y1="${r1(ys)}" x2="${r1(L + pw)}" y2="${r1(ys)}" stroke="${COL.S}" stroke-width="2.4" stroke-dasharray="8 5"/>`
      + `<text x="${L + 8}" y="${r1(pts[0][1] < o.seuil.y ? ys - 7 : ys + 18)}" font-size="15" font-weight="700" text-anchor="start" fill="${COL.S}" ${HALO}>${o.seuil.l}</text>`;
  }
  // points
  const hl = new Set(o.hl || []);
  pts.forEach(([n, u]) => {
    const c = hl.has(n) ? COL.hl : COL.pt, px = X(n), py = Y(u);
    if (hl.has(n)) s += `<line x1="${r1(px)}" y1="${r1(py)}" x2="${r1(px)}" y2="${r1(oy)}" stroke="${c}" stroke-width="2" stroke-dasharray="5 4"/>`;
    s += `<circle data-n="${n}" cx="${r1(px)}" cy="${r1(py)}" r="${hl.has(n) ? 7 : 5.5}" fill="${c}" stroke="#fff" stroke-width="1.5"/>`;
    if (o.vals || hl.has(n)) {
      const above = u >= 0 || py > T + ph - 20;
      const edge = n === nmin;
      s += `<text x="${r1(px + (edge ? 7 : 0))}" y="${r1(Math.max(T + 12, Math.min(T + ph - 4, py + (edge ? (above ? -10 : 20) : above ? -12 : 22))))}" font-size="14" font-weight="700" text-anchor="${edge ? 'start' : 'middle'}" fill="${c}" ${HALO}>${M(Math.round(u * 100) / 100)}</text>`;
    }
  });
  [].concat(o.ask === undefined ? [] : o.ask).forEach(k => {
    const px = X(k);
    s += `<text x="${r1(px)}" y="${r1(T + 14)}" font-size="16" font-weight="700" text-anchor="middle" fill="${COL.hl}" ${HALO}>${uS(k, nom)} ?</text>`
      + `<line x1="${r1(px)}" y1="${T + 20}" x2="${r1(px)}" y2="${r1(T + ph)}" stroke="${COL.hl}" stroke-width="1.6" stroke-dasharray="3 5" opacity=".7"/>`;
  });
  return s + '</svg>';
}

/** relit la valeur du point d'indice n dans un nuage (inverse du repère) : sert aux vérifications */
export function lireNuage(svg, n) {
  const g = k => +svg.match(new RegExp(`data-${k}="([^"]+)"`))[1];
  const m = svg.match(new RegExp(`data-n="${n}" cx="[^"]+" cy="([^"]+)"`));
  return m ? (g('y0') - +m[1]) / g('sy') : NaN;
}

/** astuce de Gauss : 1 + 2 + … + n (bleu) et n + … + 1 (orange) forment un rectangle n × (n + 1) */
export function gauss(n) {
  const c = 26, L = 30, T = 14, W = L + n * c + 120, H = T + (n + 1) * c + 34;
  let s = `<svg viewBox="0 0 ${W} ${H}" class="vis" style="width:100%;max-width:${W}px" role="img" aria-label="astuce de Gauss" font-family="system-ui,sans-serif">`;
  for (let k = 1; k <= n; k++) {
    const x = L + (k - 1) * c;
    for (let j = 0; j <= n; j++) {
      const y = T + (n - j) * c, blue = j < k;
      s += `<rect x="${x + 1}" y="${y + 1}" width="${c - 2}" height="${c - 2}" rx="3" fill="${blue ? '#a5d8ff' : '#ffd8a8'}" stroke="${blue ? '#1c7ed6' : '#e8590c'}"/>`;
    }
    s += `<text x="${x + c / 2}" y="${T + (n + 1) * c + 20}" font-size="15" text-anchor="middle" fill="#1c7ed6" font-weight="700">${k}</text>`;
  }
  s += `<text x="${L + n * c + 10}" y="${T + (n + 1) * c / 2 - 6}" font-size="15" fill="#333">${n + 1} cases</text>`
    + `<text x="${L + n * c + 10}" y="${T + (n + 1) * c / 2 + 14}" font-size="15" fill="#333">par colonne</text>`;
  return s + '</svg>';
}

/**
 * Escalier de récurrence pour uₙ₊₁ = f(uₙ) : courbe y = f(x), droite y = x, et le chemin
 * u₀ → (u₀ ; u₁) → (u₁ ; u₁) → (u₁ ; u₂) … ; les termes sont repérés sur l'axe des abscisses.
 * o = { f, u0, k (nombre de pas), fl (étiquette de la courbe), s (indice du premier terme, 0 par défaut) }
 */
export function escalier(o) {
  const us = [o.u0];
  for (let i = 0; i < o.k; i++) us.push(o.f(us[i]));
  let lo = Math.min(0, ...us), hi = Math.max(0, ...us);
  const m = Math.max(1, Math.ceil((hi - lo) * 0.12));
  lo = Math.floor(lo) - m; hi = Math.ceil(hi) + m;
  const W = 420, L = 40, R = 22, T = 22, B = 30, pw = W - L - R, ph = pw, H = ph + T + B;
  const sc = pw / (hi - lo), X = x => L + (x - lo) * sc, Y = y => T + (hi - y) * sc;
  const st = STEP(hi - lo), id = `se${++uid}`;
  let s = `<svg viewBox="0 0 ${W} ${H}" class="vis" style="width:100%;max-width:${W}px;max-height:400px" role="img" aria-label="escalier de la suite récurrente" font-family="system-ui,sans-serif">`
    + `<defs><clipPath id="${id}"><rect x="${L}" y="${T}" width="${pw}" height="${ph}"/></clipPath>`
    + `<marker id="${id}a" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto"><path d="M0,0L10,5L0,10z" fill="${COL.hl}"/></marker></defs>`;
  for (let v = Math.ceil(lo / st) * st; v <= hi; v += st) {
    s += `<line x1="${r1(X(v))}" y1="${T}" x2="${r1(X(v))}" y2="${T + ph}" stroke="#eceae4"/><line x1="${L}" y1="${r1(Y(v))}" x2="${L + pw}" y2="${r1(Y(v))}" stroke="#eceae4"/>`;
  }
  const ox = X(0), oy = Y(0);
  s += `<line x1="${L}" y1="${r1(oy)}" x2="${L + pw}" y2="${r1(oy)}" stroke="#333" stroke-width="1.6"/><line x1="${r1(ox)}" y1="${T}" x2="${r1(ox)}" y2="${T + ph}" stroke="#333" stroke-width="1.6"/>`;
  for (let v = Math.ceil(lo / st) * st; v <= hi; v += st) if (v && (hi - lo) / st <= 16) s += `<text x="${r1(ox - 5)}" y="${r1(Y(v) + 5)}" font-size="13" text-anchor="end" fill="#666" ${HALO}>${M(v)}</text>`;
  // y = x et y = f(x)
  s += `<line x1="${r1(X(lo))}" y1="${r1(Y(lo))}" x2="${r1(X(hi))}" y2="${r1(Y(hi))}" stroke="${COL.id}" stroke-width="2.2" stroke-dasharray="7 5"/>`;
  let d = ''; for (let i = 0; i <= 60; i++) { const x = lo + (hi - lo) * i / 60; d += (i ? 'L' : 'M') + r1(X(x)) + ',' + r1(Math.max(-4000, Math.min(4000, Y(o.f(x))))); }
  s += `<path d="${d}" fill="none" stroke="${COL.f}" stroke-width="3" clip-path="url(#${id})"/>`;
  // le chemin en escalier
  let p = `M${r1(X(us[0]))},${r1(oy)}`;
  for (let i = 0; i < o.k; i++) p += `L${r1(X(us[i]))},${r1(Y(us[i + 1]))}L${r1(X(us[i + 1]))},${r1(Y(us[i + 1]))}`;
  s += `<path d="${p}" fill="none" stroke="${COL.hl}" stroke-width="2.6" stroke-linejoin="round" clip-path="url(#${id})"/>`;
  // termes sur l'axe des abscisses (pointillés depuis la droite y = x)
  const placed = [];
  us.forEach((u, i) => {
    const px = X(u);
    if (i) s += `<line x1="${r1(px)}" y1="${r1(Y(u))}" x2="${r1(px)}" y2="${r1(oy)}" stroke="${COL.hl}" stroke-width="1.4" stroke-dasharray="3 4"/>`;
    s += `<circle cx="${r1(px)}" cy="${r1(oy)}" r="4.5" fill="${COL.hl}"/>`;
    if (placed.some(q => Math.abs(q - px) < 30)) return;
    placed.push(px);
    const below = oy + 20 < T + ph;
    s += `<text x="${r1(px)}" y="${r1(below ? oy + 19 : oy - 8)}" font-size="15" font-weight="700" text-anchor="middle" fill="${COL.hl}" ${HALO}>${uS(i + (o.s || 0))}</text>`;
  });
  // étiquettes des deux droites, dans les coins
  s += `<text x="${r1(L + 0.7 * pw + 30)}" y="${r1(T + 0.3 * ph + 22)}" font-size="15" font-weight="700" text-anchor="start" fill="${COL.id}" ${HALO}>y = x</text>`
    + `<text x="${L + 6}" y="${T + 18}" font-size="15" font-weight="700" fill="${COL.f}" ${HALO}>${o.fl || 'y = f(x)'}</text>`;
  return s + '</svg>';
}

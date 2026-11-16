// Dessins du module Vecteurs et droites (chaînes SVG, sans DOM) : repère orthonormé quadrillé
// (même échelle sur les deux axes) avec points, vecteurs (flèches), « escaliers » des coordonnées,
// droites d'équation ax + by + c = 0, segments et polygones.
import { M } from '../../engine/util/fmt.js';

let uid = 0;
const r1 = v => (isFinite(v) ? (Math.round(v * 10) / 10).toString() : '0');
const HALO = 'paint-order="stroke" stroke="#fff" stroke-width="4" stroke-linejoin="round"';
/** couleurs : u, v, w (vecteurs), s (résultat), p (points), d (droites) */
export const C = { u: '#1e40af', v: '#c2255c', w: '#2b8a3e', s: '#e8590c', p: '#5f3dc4', d: '#0b7285', g: '#2b8a3e' };

function span(v, m, min) {
  const w = v.filter(isFinite);
  let lo = Math.floor(Math.min(0, ...w)) - m, hi = Math.ceil(Math.max(0, ...w)) + m;
  while (hi - lo < min) { lo--; if (hi - lo < min) hi++; }
  return [lo, hi];
}
/** fenêtre entière contenant l'origine et les abscisses xs / ordonnées ys, avec une marge */
export const fen = (xs, ys, m = 1, min = 8) => ({ xr: span(xs, m, min), yr: span(ys, m, min) });

/** largeur approximative d'un caractère (police système, 17 px) */
const cw = ch => (ch === ' ' ? 4.8 : /[ijlI′'.,;()]/.test(ch) ? 5.5 : /[A-Z]/.test(ch) ? 11.5 : /[+−=]/.test(ch) ? 10.5 : 9.6);

/** étiquette ; les parties entre accolades portent une flèche : '{u} + {v}', '{AB}' */
/** largeur (en px) d'une étiquette */
export const lwidth = (lab, fs = 18) => [...lab.replace(/[{}]/g, '')].reduce((s, ch) => s + cw(ch), 0) * fs / 17;

/** box = [xmin, xmax] : l'étiquette est gardée entre ces abscisses */
export function vlabel(x, y, lab, c, anchor = 'middle', fs = 18, box) {
  const k = fs / 17, marks = [];
  let plain = '', pos = 0;
  for (let i = 0; i < lab.length;) {
    if (lab[i] === '{') {
      const j = lab.indexOf('}', i), t = lab.slice(i + 1, j);
      const w = [...t].reduce((s, ch) => s + cw(ch), 0) * k;
      marks.push([pos, pos + w]); plain += t; pos += w; i = j + 1;
    } else { plain += lab[i]; pos += cw(lab[i]) * k; i++; }
  }
  let x0 = anchor === 'middle' ? x - pos / 2 : anchor === 'end' ? x - pos : x;
  if (box) x0 = Math.max(box[0], Math.min(box[1] - pos, x0));
  let s = `<text x="${r1(x0)}" y="${r1(y)}" font-size="${fs}" font-weight="700" fill="${c}" textLength="${r1(pos)}" lengthAdjust="spacing" ${HALO}>${plain}</text>`;
  marks.forEach(([a, b]) => {
    const ya = y - fs * 0.92, xa = x0 + a + 1, xb = x0 + b - 1;
    const d = `M${r1(xa)},${r1(ya)}H${r1(xb)}M${r1(xb - 4.5)},${r1(ya - 3.2)}L${r1(xb)},${r1(ya)}L${r1(xb - 4.5)},${r1(ya + 3.2)}`;
    s += `<path d="${d}" fill="none" stroke="#fff" stroke-width="4.5" stroke-linecap="round"/><path d="${d}" fill="none" stroke="${c}" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/>`;
  });
  return s;
}

/** flèche en pixels de (x1, y1) à (x2, y2) */
function arrow(x1, y1, x2, y2, c, w = 3.4, dash = false) {
  const len = Math.hypot(x2 - x1, y2 - y1);
  if (len < 1) return '';
  const ux = (x2 - x1) / len, uy = (y2 - y1) / len, h = Math.min(15, len * 0.5), hw = h * 0.48;
  const bx = x2 - ux * h, by = y2 - uy * h;
  return `<line x1="${r1(x1)}" y1="${r1(y1)}" x2="${r1(bx + ux * 1)}" y2="${r1(by + uy * 1)}" stroke="${c}" stroke-width="${w}" stroke-linecap="round" ${dash ? 'stroke-dasharray="8 6"' : ''}/>`
    + `<path d="M${r1(x2)},${r1(y2)}L${r1(bx - uy * hw)},${r1(by + ux * hw)}L${r1(bx + uy * hw)},${r1(by - ux * hw)}z" fill="${c}"/>`;
}

/** extrémités de la droite ax + by + c = 0 dans la fenêtre */
function clip(a, b, c, xr, yr) {
  const [xmin, xmax] = xr, [ymin, ymax] = yr, P = [];
  if (b !== 0) for (const x of [xmin, xmax]) { const y = -(a * x + c) / b; if (y >= ymin - 1e-9 && y <= ymax + 1e-9) P.push([x, y]); }
  if (a !== 0) for (const y of [ymin, ymax]) { const x = -(b * y + c) / a; if (x >= xmin - 1e-9 && x <= xmax + 1e-9) P.push([x, y]); }
  if (P.length < 2) return null;
  let best = [P[0], P[1]], bd = -1;
  for (let i = 0; i < P.length; i++) for (let j = i + 1; j < P.length; j++) { const dd = Math.hypot(P[i][0] - P[j][0], P[i][1] - P[j][1]); if (dd > bd) { bd = dd; best = [P[i], P[j]]; } }
  return best;
}

const OFF = { ne: [9, -10, 'start'], nw: [-9, -10, 'end'], se: [9, 22, 'start'], sw: [-9, 22, 'end'], n: [0, -12, 'middle'], s: [0, 25, 'middle'], e: [11, 6, 'start'], w: [-11, 6, 'end'] };

/**
 * Repère orthonormé quadrillé.
 * o.xr, o.yr : fenêtre entière (contient 0) ; la fenêtre est élargie en x pour remplir la largeur.
 * o.vecs = [{ x, y, dx, dy, c?, l?, side?, dash? }] vecteurs (l : '{u}', '{u} + {v}'…)
 * o.steps = [{ x, y, dx, dy, c? }] déplacement horizontal puis vertical, avec leurs valeurs
 * o.lines = [{ a, b, c, col?, l?, dash? }] droites ax + by + c = 0
 * o.segs = [{ x1, y1, x2, y2, c?, dash? }] ; o.poly = { pts: [[x, y]…], c? }
 * o.pts = [{ x, y, l?, c?, pos? }] points ; pos ∈ ne nw se sw n s e w (sinon : à l'écart de o.center)
 */
export function grille(o) {
  let [xmin, xmax] = o.xr;
  const [ymin, ymax] = o.yr, PW = 420, PH = 400;
  const s = Math.min(PW / (xmax - xmin), PH / (ymax - ymin));
  const extra = Math.floor(PW / s - (xmax - xmin) + 1e-9);
  if (extra >= 1 && o.widen !== false) { xmin -= Math.floor(extra / 2); xmax += extra - Math.floor(extra / 2); }
  const dx = xmax - xmin, dy = ymax - ymin, L = 30, R = 26, T = 24, B = 30;
  const pw = dx * s, ph = dy * s, W = Math.round(L + pw + R), H = Math.round(T + ph + B);
  const X = x => L + (x - xmin) * s, Y = y => T + (ymax - y) * s;
  const id = `vg${++uid}`, st = s >= 24 ? 1 : 2;
  let g = `<svg viewBox="0 0 ${W} ${H}" class="vis plot" role="img" aria-label="${o.aria || 'figure dans un repère'}" font-family="system-ui,sans-serif">`
    + `<defs><clipPath id="${id}"><rect x="${L}" y="${T}" width="${r1(pw)}" height="${r1(ph)}"/></clipPath>`
    + `<marker id="${id}a" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto"><path d="M0,0L10,5L0,10z" fill="#333"/></marker></defs>`;
  for (let x = xmin; x <= xmax; x++) g += `<line x1="${r1(X(x))}" y1="${T}" x2="${r1(X(x))}" y2="${r1(T + ph)}" stroke="${x % st ? '#ebe8e1' : '#dcd8ce'}"/>`;
  for (let y = ymin; y <= ymax; y++) g += `<line x1="${L}" y1="${r1(Y(y))}" x2="${r1(L + pw)}" y2="${r1(Y(y))}" stroke="${y % st ? '#ebe8e1' : '#dcd8ce'}"/>`;
  const ox = X(0), oy = Y(0);
  g += `<line x1="${L}" y1="${r1(oy)}" x2="${r1(L + pw + 14)}" y2="${r1(oy)}" stroke="#333" stroke-width="1.6" marker-end="url(#${id}a)"/>`
    + `<line x1="${r1(ox)}" y1="${r1(T + ph)}" x2="${r1(ox)}" y2="${r1(T - 14)}" stroke="#333" stroke-width="1.6" marker-end="url(#${id}a)"/>`;
  for (let x = Math.ceil(xmin / st) * st; x <= xmax; x += st) if (x && x > xmin) g += `<text x="${r1(X(x))}" y="${r1(oy + 18)}" font-size="14" text-anchor="middle" fill="#555" ${HALO}>${M(x)}</text>`;
  for (let y = Math.ceil(ymin / st) * st; y <= ymax; y += st) if (y && y > ymin && y < ymax) g += `<text x="${r1(ox - 6)}" y="${r1(Y(y) + 5)}" font-size="14" text-anchor="end" fill="#555" ${HALO}>${M(y)}</text>`;
  g += `<text x="${r1(ox - 6)}" y="${r1(oy + 18)}" font-size="14" text-anchor="end" fill="#555" ${HALO}>0</text>`;
  // polygone
  if (o.poly) {
    const c = o.poly.c || C.p;
    g += `<path d="${o.poly.pts.map((p, i) => (i ? 'L' : 'M') + r1(X(p[0])) + ',' + r1(Y(p[1]))).join('')}z" fill="${c}" fill-opacity=".09" stroke="${c}" stroke-width="2.2" stroke-dasharray="7 5"/>`;
  }
  // droites
  const labs = [], placed = [], legend = [], busy = [];
  (o.lines || []).forEach(D => {
    const e = clip(D.a, D.b, D.c, [xmin, xmax], [ymin, ymax]);
    if (!e) return;
    const c = D.col || C.d;
    g += `<line x1="${r1(X(e[0][0]))}" y1="${r1(Y(e[0][1]))}" x2="${r1(X(e[1][0]))}" y2="${r1(Y(e[1][1]))}" stroke="${c}" stroke-width="2.8" ${D.dash ? 'stroke-dasharray="9 6"' : ''} clip-path="url(#${id})"/>`;
    for (let i = 0; i <= 40; i++) busy.push([X(e[0][0] + (e[1][0] - e[0][0]) * i / 40), Y(e[0][1] + (e[1][1] - e[0][1]) * i / 40)]);
    if (D.l && lwidth(D.l, 17) > 44) legend.push({ l: D.l, c, dash: D.dash }); // longue étiquette : dans un cartouche
    else if (D.l) {
      const [p, q] = e[0][0] < e[1][0] || (e[0][0] === e[1][0] && e[0][1] < e[1][1]) ? e : [e[1], e[0]];
      const lx = X(q[0]) - X(p[0]), ly = Y(q[1]) - Y(p[1]), n = Math.hypot(lx, ly) || 1;
      const sd = D.side || 1, nx = ly / n * sd, ny = -lx / n * sd;
      const anchor = nx > 0.35 ? 'start' : nx < -0.35 ? 'end' : 'middle';
      const at = t => {
        const px = X(p[0] + (q[0] - p[0]) * t), py = Y(p[1] + (q[1] - p[1]) * t);
        return [Math.max(L + 4, Math.min(L + pw - 4, px + nx * 16)), Math.max(T + 18, Math.min(T + ph - 4, py + ny * 16 + 6))];
      };
      let pos;
      if (D.at !== undefined) pos = at(D.at);
      else { // position le long de la droite la plus éloignée des points, des autres étiquettes et de l'origine
        const busy = [...(o.pts || []).map(b => [X(b.x), Y(b.y)]), ...(o.avoid || []).map(b => [X(b[0]), Y(b[1])]), ...placed, [ox, oy]];
        const score = ([x, y]) => Math.min(1e9, ...busy.map(([bx, by]) => Math.hypot(bx - x, by - y)));
        pos = [0.12, 0.25, 0.4, 0.6, 0.75, 0.88].map(at).reduce((b, c2) => (score(c2) > score(b) + 1 ? c2 : b));
      }
      placed.push(pos);
      labs.push(vlabel(pos[0], pos[1], D.l, c, anchor, 17, [L + 2, L + pw - 2]));
    }
  });
  (o.segs || []).forEach(S => { g += `<line x1="${r1(X(S.x1))}" y1="${r1(Y(S.y1))}" x2="${r1(X(S.x2))}" y2="${r1(Y(S.y2))}" stroke="${S.c || '#495057'}" stroke-width="${S.w || 2.4}" ${S.dash ? 'stroke-dasharray="7 5"' : ''}/>`; });
  // escaliers (déplacement horizontal puis vertical)
  (o.steps || []).forEach(S => {
    const c = S.c || C.g, x1 = X(S.x), y1 = Y(S.y), x2 = X(S.x + S.dx), y2 = Y(S.y + S.dy);
    g += `<path d="M${r1(x1)},${r1(y1)}H${r1(x2)}V${r1(y2)}" fill="none" stroke="${c}" stroke-width="2.6" stroke-dasharray="6 4"/>`;
    const sg = v => (v > 0 ? '+' : '') + M(v);
    if (S.dx) labs.push(`<text x="${r1((x1 + x2) / 2)}" y="${r1(y1 + (S.dy > 0 ? 21 : -9))}" font-size="17" font-weight="700" text-anchor="middle" fill="${c}" ${HALO}>${sg(S.dx)}</text>`);
    if (S.dy) labs.push(`<text x="${r1(x2 + (S.dx >= 0 ? 7 : -7))}" y="${r1((y1 + y2) / 2 + 6)}" font-size="17" font-weight="700" text-anchor="${S.dx >= 0 ? 'start' : 'end'}" fill="${c}" ${HALO}>${sg(S.dy)}</text>`);
  });
  // vecteurs
  (o.vecs || []).forEach(V => {
    const c = V.c || C.u, x1 = X(V.x), y1 = Y(V.y), x2 = X(V.x + V.dx), y2 = Y(V.y + V.dy);
    g += arrow(x1, y1, x2, y2, c, V.w || 3.4, V.dash);
    if (V.l) {
      const n = Math.hypot(x2 - x1, y2 - y1) || 1, sd = V.side || 1;
      const nx = (y2 - y1) / n * sd, ny = -(x2 - x1) / n * sd;
      const lp = t => [x1 + (x2 - x1) * t + nx * 17, y1 + (y2 - y1) * t + ny * 19];
      // loin de l'origine (graduations) et des points
      const far = q => Math.hypot(q[0] - ox, q[1] - oy) > 24 && (o.pts || []).every(b => Math.hypot(q[0] - X(b.x), q[1] - Y(b.y)) > 20);
      const t = V.at !== undefined ? V.at : [0.5, 0.36, 0.64, 0.28, 0.72].find(z => far(lp(z))) || 0.5;
      const [tx, ty] = lp(t);
      labs.push(vlabel(tx, Math.max(T + 20, Math.min(T + ph + 4, ty + 6)), V.l, c, 'middle', 18, [4, W - 4]));
    }
  });
  // points
  (o.pts || []).forEach(p => {
    const c = p.c || C.p, px = X(p.x), py = Y(p.y);
    g += `<circle cx="${r1(px)}" cy="${r1(py)}" r="5.5" fill="${c}" stroke="#fff" stroke-width="1.5"/>`;
    if (p.l) {
      let pos = p.pos;
      if (!pos) {
        if (o.center) {
          const ex = p.x - o.center[0], ey = p.y - o.center[1];
          pos = (ey >= 0 ? 'n' : 's') + (ex >= 0 ? 'e' : 'w');
        } else pos = 'ne';
      }
      if (px > L + pw - 50 && pos.endsWith('e')) pos = pos.length > 1 ? pos[0] + 'w' : 'w';
      if (px < L + 50 && pos.endsWith('w')) pos = pos.length > 1 ? pos[0] + 'e' : 'e';
      if (py < T + 24 && pos[0] === 'n') pos = 's' + pos.slice(1);
      const [ddx, ddy, an] = OFF[pos];
      labs.push(vlabel(px + ddx, Math.max(T + 16, Math.min(T + ph + 6, py + ddy)), p.l, c, an, 18, [4, W - 4]));
    }
  });
  // cartouche des longues étiquettes de droites, dans le coin le moins encombré
  let leg = '';
  if (legend.length) {
    (o.pts || []).forEach(p => { for (let k = 0; k < 8; k++) busy.push([X(p.x), Y(p.y)]); });
    (o.vecs || []).forEach(V => { for (let i = 0; i <= 20; i++) busy.push([X(V.x + V.dx * i / 20), Y(V.y + V.dy * i / 20)]); });
    const lw = 18 + Math.max(...legend.map(e => lwidth(e.l, 17))), lh = 10 + 24 * legend.length;
    const corners = [[L + 4, T + 4], [L + pw - lw - 4, T + 4], [L + 4, T + ph - lh - 4], [L + pw - lw - 4, T + ph - lh - 4]];
    const score = ([cx, cy]) => busy.filter(([px, py]) => px > cx - 6 && px < cx + lw + 6 && py > cy - 6 && py < cy + lh + 6).length;
    const [cx, cy] = corners.reduce((b, c2) => (score(c2) < score(b) ? c2 : b));
    leg = `<rect x="${r1(cx)}" y="${r1(cy)}" width="${r1(lw)}" height="${lh}" rx="8" fill="#fff" fill-opacity=".93" stroke="#d9d6cd"/>`;
    legend.forEach((e, i) => { leg += vlabel(cx + 9, cy + 25 + 24 * i, e.l, e.c, 'start', 17); });
  }
  return g + labs.join('') + leg + '</svg>';
}

// Courbes : repère générique (plot) et parabole du second degré (parabola).
import { M } from '../util/fmt.js';

let uid = 0;
const nid = p => `${p}${++uid}`;
const f2 = v => (isFinite(v) ? v.toFixed(1) : '0');

/**
 * Repère générique.
 * o.fs = [{f, c, l}], o.xr = [xmin, xmax], o.yr = [ymin, ymax] (facultatif),
 * o.h = {y, l} droite horizontale, o.xset = intervalles colorés sur l'axe des x,
 * o.seg = [a, b, k] portion de la courbe k mise en évidence, o.pts = [{x, y, l, c}]
 */
export function plot(o) {
  const [xmin, xmax] = o.xr; let ymin, ymax;
  if (o.yr) [ymin, ymax] = o.yr;
  else {
    const v = []; o.fs.forEach(F => { for (let i = 0; i <= 60; i++) v.push(F.f(xmin + (xmax - xmin) * i / 60)); });
    const hy = o.h ? o.h.y : 0;
    ymin = Math.min(0, ...v, hy) - 1; ymax = Math.min(Math.max(0, ...v, hy) + 1, Math.max(hy, 0) + 14);
  }
  const W = 460, H = 300, pad = 26, sx = (W - 2 * pad) / (xmax - xmin), sy = (H - 2 * pad) / (ymax - ymin);
  const X = x => pad + (x - xmin) * sx, Y = y => H - pad - (y - ymin) * sy;
  const stx = xmax - xmin <= 16 ? 1 : xmax - xmin <= 34 ? 2 : 5, sty = ymax - ymin <= 16 ? 1 : ymax - ymin <= 34 ? 2 : 5;
  const cl = nid('cl');
  let s = `<svg viewBox="0 0 ${W} ${H}" class="vis plot" role="img" aria-label="graphique" font-family="system-ui,sans-serif"><defs><clipPath id="${cl}"><rect x="${pad}" y="${pad - 6}" width="${W - 2 * pad}" height="${H - 2 * pad + 6}"/></clipPath></defs>`;
  for (let x = Math.ceil(xmin); x <= xmax; x++) s += `<line x1="${f2(X(x))}" y1="${pad}" x2="${f2(X(x))}" y2="${H - pad}" stroke="#eeebe4"/>`;
  for (let y = Math.ceil(ymin / sty) * sty; y <= ymax; y += sty) s += `<line x1="${pad}" y1="${f2(Y(y))}" x2="${W - pad}" y2="${f2(Y(y))}" stroke="#eeebe4"/>`;
  const y0 = Math.max(ymin, Math.min(ymax, 0)), x0 = Math.max(xmin, Math.min(xmax, 0));
  s += `<line x1="${pad}" y1="${f2(Y(y0))}" x2="${W - pad + 6}" y2="${f2(Y(y0))}" stroke="#333" stroke-width="1.5"/><line x1="${f2(X(x0))}" y1="${H - pad}" x2="${f2(X(x0))}" y2="${pad - 8}" stroke="#333" stroke-width="1.5"/>`;
  for (let x = Math.ceil(xmin / stx) * stx; x <= xmax; x += stx) if (x) s += `<text x="${f2(X(x))}" y="${f2(Y(y0) + 15)}" font-size="11" text-anchor="middle" fill="#666">${M(x)}</text>`;
  for (let y = Math.ceil(ymin / sty) * sty; y <= ymax; y += sty) if (y) s += `<text x="${f2(X(x0) - 4)}" y="${f2(Y(y) + 4)}" font-size="11" text-anchor="end" fill="#666">${M(y)}</text>`;
  if (o.xset) o.xset.forEach(i => { s += `<line x1="${f2(X(Math.max(i.lo, xmin)))}" y1="${f2(Y(y0))}" x2="${f2(X(Math.min(i.hi, xmax)))}" y2="${f2(Y(y0))}" stroke="var(--sol)" stroke-width="7" opacity=".7"/>`; });
  if (o.h) s += `<line x1="${pad}" y1="${f2(Y(o.h.y))}" x2="${W - pad}" y2="${f2(Y(o.h.y))}" stroke="#e8590c" stroke-width="2" stroke-dasharray="7 5"/><text x="${W - pad - 2}" y="${f2(Y(o.h.y) - 6)}" font-size="13" text-anchor="end" fill="#e8590c" font-weight="700">${o.h.l}</text>`;
  o.fs.forEach((F, k) => {
    let d = ''; for (let i = 0; i <= 300; i++) { const x = xmin + (xmax - xmin) * i / 300; d += (i ? 'L' : 'M') + f2(X(x)) + ',' + f2(Math.max(-2000, Math.min(2000, Y(F.f(x))))); }
    s += `<path d="${d}" fill="none" stroke="${F.c || '#5f3dc4'}" stroke-width="3" clip-path="url(#${cl})"/>`;
    if (F.l) { const xl = xmax - (xmax - xmin) * .06 * (k + 1) - 0.3, yl = F.f(xl); s += `<text x="${f2(X(xl))}" y="${f2(Math.max(pad + 10, Math.min(H - pad, Y(yl) - 8)))}" font-size="13" text-anchor="end" fill="${F.c || '#5f3dc4'}" font-weight="700">${F.l}</text>`; }
  });
  if (o.seg) { const [a, b, k] = o.seg, f = o.fs[k || 0].f; let d = ''; for (let i = 0; i <= 80; i++) { const x = a + (b - a) * i / 80; d += (i ? 'L' : 'M') + f2(X(x)) + ',' + f2(Y(f(x))); } s += `<path d="${d}" fill="none" stroke="#e8590c" stroke-width="6" opacity=".8" clip-path="url(#${cl})"/>`; }
  (o.pts || []).forEach(p => { s += `<circle cx="${f2(X(p.x))}" cy="${f2(Y(p.y))}" r="5.5" fill="${p.c || '#e8590c'}"/>` + (p.l ? `<text x="${f2(X(p.x) + 8)}" y="${f2(Y(p.y) - 8)}" font-size="14" font-weight="700" fill="${p.c || '#e8590c'}">${p.l}</text>` : ''); });
  return s + '</svg>';
}

/** parabole y = ax² + bx + c avec options x0/show (image), roots, vertex, signs */
export function parabola(a, b, c, o = {}) {
  const f = x => a * x * x + b * x + c, xs = -b / (2 * a), ys = f(xs), D = b * b - 4 * a * c;
  const xsPts = [xs, 0]; if (D >= 0) xsPts.push((-b - Math.sqrt(D)) / (2 * a), (-b + Math.sqrt(D)) / (2 * a)); if (o.x0 !== undefined) xsPts.push(o.x0);
  let xmin = Math.floor(Math.min(...xsPts)) - 3, xmax = Math.ceil(Math.max(...xsPts)) + 3;
  while (xmax - xmin < 10) { xmin--; xmax++; }
  let ymin, ymax;
  if (a > 0) { ymin = Math.floor(Math.min(ys, 0)) - 2; ymax = Math.max(ymin + 12, Math.ceil(Math.max(ys, 0)) + 6); }
  else { ymax = Math.ceil(Math.max(ys, 0)) + 2; ymin = Math.min(ymax - 12, Math.floor(Math.min(ys, 0)) - 6); }
  if (o.x0 !== undefined) { const y0 = f(o.x0); ymin = Math.min(ymin, Math.floor(y0) - 2); ymax = Math.max(ymax, Math.ceil(y0) + 2); }
  if (0 < ymin) ymin = -1; if (0 > ymax) ymax = 1;
  const W = 460, H = 340, pad = 28, sx = (W - 2 * pad) / (xmax - xmin), sy = (H - 2 * pad) / (ymax - ymin);
  const X = x => pad + (x - xmin) * sx, Y = y => H - pad - (y - ymin) * sy;
  const step = s => s <= 16 ? 1 : s <= 32 ? 2 : s <= 80 ? 5 : 10;
  const stx = step(xmax - xmin), sty = step(ymax - ymin), cp = nid('cp');
  let s = `<svg viewBox="0 0 ${W} ${H}" class="vis plot" role="img" aria-label="parabole" font-family="system-ui,sans-serif"><defs><clipPath id="${cp}"><rect x="${pad}" y="${pad}" width="${W - 2 * pad}" height="${H - 2 * pad}"/></clipPath></defs>`;
  for (let x = Math.ceil(xmin); x <= xmax; x++) s += `<line x1="${f2(X(x))}" y1="${pad}" x2="${f2(X(x))}" y2="${H - pad}" stroke="${x % stx ? '#f1efe9' : '#e2dfd7'}"/>`;
  for (let y = Math.ceil(ymin); y <= ymax; y++) if (sty <= 2 || y % sty === 0) s += `<line x1="${pad}" y1="${f2(Y(y))}" x2="${W - pad}" y2="${f2(Y(y))}" stroke="${y % sty ? '#f1efe9' : '#e2dfd7'}"/>`;
  s += `<line x1="${pad}" y1="${f2(Y(0))}" x2="${W - pad + 8}" y2="${f2(Y(0))}" stroke="#333" stroke-width="1.6"/><line x1="${f2(X(0))}" y1="${H - pad}" x2="${f2(X(0))}" y2="${pad - 8}" stroke="#333" stroke-width="1.6"/>`;
  s += `<text x="${W - pad + 4}" y="${f2(Y(0) - 6)}" font-size="14" font-style="italic">x</text><text x="${f2(X(0) + 6)}" y="${pad - 4}" font-size="14" font-style="italic">y</text>`;
  for (let x = Math.ceil(xmin / stx) * stx; x <= xmax; x += stx) if (x !== 0) s += `<text x="${f2(X(x))}" y="${f2(Math.min(H - pad + 16, Math.max(pad + 12, Y(0) + 16)))}" font-size="12" text-anchor="middle" fill="#555">${M(x)}</text>`;
  for (let y = Math.ceil(ymin / sty) * sty; y <= ymax; y += sty) if (y !== 0) s += `<text x="${f2(Math.max(pad + 2, Math.min(W - pad - 24, X(0) - 5)))}" y="${f2(Y(y) + 4)}" font-size="12" text-anchor="end" fill="#555">${M(y)}</text>`;
  s += `<text x="${f2(X(0) - 5)}" y="${f2(Y(0) + 15)}" font-size="12" text-anchor="end" fill="#555">0</text>`;
  let d = ''; for (let i = 0; i <= 300; i++) { const x = xmin + (xmax - xmin) * i / 300; d += (i ? 'L' : 'M') + f2(X(x)) + ',' + f2(Math.max(-2000, Math.min(2000, Y(f(x))))); }
  s += `<path d="${d}" fill="none" stroke="var(--curve)" stroke-width="3" clip-path="url(#${cp})"/>`;
  if (o.x0 !== undefined) {
    const y0 = f(o.x0);
    s += `<line x1="${f2(X(o.x0))}" y1="${f2(Y(0))}" x2="${f2(X(o.x0))}" y2="${f2(Y(y0))}" stroke="#e8590c" stroke-width="2" stroke-dasharray="6 5"/><circle cx="${f2(X(o.x0))}" cy="${f2(Y(0))}" r="4" fill="#e8590c"/>`;
    if (o.show) s += `<circle cx="${f2(X(o.x0))}" cy="${f2(Y(y0))}" r="6" fill="#e8590c"/><text x="${f2(X(o.x0) + 8)}" y="${f2(Y(y0) - 8)}" font-size="14" font-weight="700" fill="#e8590c">(${M(o.x0)} ; ${M(y0)})</text>`;
  }
  if (o.roots && D >= 0) [...new Set([(-b - Math.sqrt(D)) / (2 * a), (-b + Math.sqrt(D)) / (2 * a)])].forEach(r => {
    s += `<circle cx="${f2(X(r))}" cy="${f2(Y(0))}" r="6.5" fill="#e03131"/><text x="${f2(X(r))}" y="${f2(Y(0) + (a > 0 ? -12 : 24))}" font-size="14" font-weight="700" fill="#e03131" text-anchor="middle">${Number.isInteger(r) ? M(r) : M(+r.toFixed(2))}</text>`;
  });
  if (o.vertex) s += `<circle cx="${f2(X(xs))}" cy="${f2(Y(ys))}" r="6" fill="#5f3dc4"/><text x="${f2(X(xs) + 9)}" y="${f2(Y(ys) + (a > 0 ? 20 : -10))}" font-size="14" font-weight="700" fill="#5f3dc4">S(${M(+xs.toFixed(2))} ; ${M(+ys.toFixed(2))})</text>`;
  if (o.signs && D > 0) {
    const r = [(-b - Math.sqrt(D)) / (2 * a), (-b + Math.sqrt(D)) / (2 * a)].sort((p, q) => p - q), g = '#2f9e44', m = '#e03131';
    s += `<g clip-path="url(#${cp})"><line x1="${f2(X(xmin))}" y1="${f2(Y(0))}" x2="${f2(X(r[0]))}" y2="${f2(Y(0))}" stroke="${a > 0 ? g : m}" stroke-width="7" opacity=".6"/><line x1="${f2(X(r[0]))}" y1="${f2(Y(0))}" x2="${f2(X(r[1]))}" y2="${f2(Y(0))}" stroke="${a > 0 ? m : g}" stroke-width="7" opacity=".6"/><line x1="${f2(X(r[1]))}" y1="${f2(Y(0))}" x2="${f2(X(xmax))}" y2="${f2(Y(0))}" stroke="${a > 0 ? g : m}" stroke-width="7" opacity=".6"/></g>`;
  }
  s += `<text x="${W - pad - 4}" y="${pad + 16}" font-size="15" text-anchor="end" fill="var(--curve)" font-weight="700">y = f(x)</text>`;
  return s + '</svg>';
}

/** tableau de signes statique (cours) : rows = [[label, ['−','0','+',…]]], xs = valeurs */
export function signTableHTML(xs, rows) {
  let h = `<table class="st"><tr><td>x</td><td class="e">−∞</td>`;
  xs.forEach(x => { h += `<td class="e"></td><td>${x}</td>`; });
  h += `<td class="e"></td><td class="e">+∞</td></tr>`;
  rows.forEach(([lab, cells]) => {
    h += `<tr><td>${lab}</td><td class="e"></td>`;
    cells.forEach((c, i) => { h += i % 2 === 0 ? `<td class="e">${c}</td>` : `<td>${c}</td>`; });
    h += `<td class="e"></td></tr>`;
  });
  return h + '</table>';
}

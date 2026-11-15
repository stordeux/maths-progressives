// Droite graduée « fractions » et figures partagées (disque, barre).
import { shuffle } from '../util/rand.js';
import { M } from '../util/fmt.js';

/** disque partagé en b parts, a coloriées */
export function disc(a, b) {
  const r = 72, c = 80, on = new Set(shuffle([...Array(b).keys()]).slice(0, a));
  let s = `<svg viewBox="0 0 160 160" class="vis sq" role="img" aria-label="disque partagé en ${b} parts dont ${a} coloriées">`;
  for (let i = 0; i < b; i++) {
    const t1 = i / b * 2 * Math.PI - Math.PI / 2, t2 = (i + 1) / b * 2 * Math.PI - Math.PI / 2;
    s += `<path d="M${c},${c} L${(c + r * Math.cos(t1)).toFixed(2)},${(c + r * Math.sin(t1)).toFixed(2)} A${r},${r} 0 0 1 ${(c + r * Math.cos(t2)).toFixed(2)},${(c + r * Math.sin(t2)).toFixed(2)} Z" fill="${on.has(i) ? '#74c0fc' : '#fff'}" stroke="#333" stroke-width="2"/>`;
  }
  return s + '</svg>';
}

/** barre partagée en b parts, a coloriées */
export function bar(a, b) {
  const W = 320, H = 56, w = W / b, on = new Set(shuffle([...Array(b).keys()]).slice(0, a));
  let s = `<svg viewBox="-2 -2 ${W + 4} ${H + 4}" class="vis" style="width:340px" role="img" aria-label="barre partagée en ${b} parts dont ${a} coloriées">`;
  for (let i = 0; i < b; i++) s += `<rect x="${(i * w).toFixed(2)}" y="0" width="${w.toFixed(2)}" height="${H}" fill="${on.has(i) ? '#ffa94d' : '#fff'}" stroke="#333" stroke-width="2"/>`;
  return s + '</svg>';
}

/** droite graduée de 0 à `units`, unité partagée en b, point A à la graduation a */
export function fracLine(a, b, units = 2) {
  const x0 = 24, u = 300 / units, y = 50;
  let s = `<svg viewBox="0 0 370 95" class="vis" style="width:400px" role="img" aria-label="droite graduée"><line x1="${x0 - 12}" y1="${y}" x2="${x0 + units * u + 22}" y2="${y}" stroke="#333" stroke-width="2"/><path d="M${x0 + units * u + 22},${y} l-9,-5 v10 z" fill="#333"/>`;
  for (let i = 0; i <= units * b; i++) {
    const x = x0 + i * u / b, big = i % b === 0;
    s += `<line x1="${x.toFixed(2)}" y1="${y - (big ? 13 : 7)}" x2="${x.toFixed(2)}" y2="${y + (big ? 13 : 7)}" stroke="#333" stroke-width="${big ? 2.5 : 1.5}"/>`;
    if (big) s += `<text x="${x.toFixed(2)}" y="${y + 35}" text-anchor="middle" font-size="18">${i / b}</text>`;
  }
  if (a === null || a === undefined) return s + '</svg>';
  const xa = x0 + a * u / b;
  return s + `<circle cx="${xa.toFixed(2)}" cy="${y}" r="6" fill="#e03131"/><text x="${xa.toFixed(2)}" y="${y - 20}" text-anchor="middle" font-size="18" font-weight="700" fill="#e03131">A</text></svg>`;
}

/** droite graduée entière (relatifs) : marks = [{x, l, c}], range [min,max], arrows = [{from,to,l,c}] */
export function intLine({ min = -10, max = 10, marks = [], arrows = [], step = 1 } = {}) {
  const W = 480, pad = 22, H = 70 + 26 * arrows.length, y = H - 34, sx = (W - 2 * pad) / (max - min), X = x => pad + (x - min) * sx;
  let s = `<svg viewBox="0 0 ${W} ${H}" class="vis" role="img" aria-label="droite graduée" font-family="system-ui,sans-serif"><line x1="${pad - 10}" y1="${y}" x2="${W - pad + 8}" y2="${y}" stroke="#333" stroke-width="1.8"/><path d="M${W - pad + 14},${y} l-10,-5 v10z" fill="#333"/>`;
  const lab = (max - min) <= 20 ? 1 : (max - min) <= 40 ? 5 : 10;
  for (let x = min; x <= max; x += step) {
    s += `<line x1="${X(x).toFixed(1)}" y1="${y - (x === 0 ? 9 : 5)}" x2="${X(x).toFixed(1)}" y2="${y + (x === 0 ? 9 : 5)}" stroke="#333" stroke-width="${x === 0 ? 2.2 : 1}"/>`;
    if (x % lab === 0) s += `<text x="${X(x).toFixed(1)}" y="${y + 24}" font-size="13" text-anchor="middle" fill="#555">${M(x)}</text>`;
  }
  arrows.forEach((a, k) => {
    const yy = y - 18 - 26 * k, c = a.c || '#e8590c';
    s += `<line x1="${X(a.from).toFixed(1)}" y1="${yy}" x2="${X(a.to).toFixed(1)}" y2="${yy}" stroke="${c}" stroke-width="3"/><path d="M${X(a.to).toFixed(1)},${yy} l${a.to > a.from ? -9 : 9},-5 v10z" fill="${c}"/>`;
    if (a.l) s += `<text x="${((X(a.from) + X(a.to)) / 2).toFixed(1)}" y="${yy - 6}" font-size="13" text-anchor="middle" font-weight="700" fill="${c}">${a.l}</text>`;
  });
  marks.forEach(m => {
    s += `<circle cx="${X(m.x).toFixed(1)}" cy="${y}" r="6" fill="${m.c || '#e03131'}"/>`;
    if (m.l) s += `<text x="${X(m.x).toFixed(1)}" y="${y - 12}" font-size="15" font-weight="700" text-anchor="middle" fill="${m.c || '#e03131'}">${m.l}</text>`;
  });
  return s + '</svg>';
}

// Droite réelle avec intervalles (crochets), points et arcs de distance.
import { M, INF } from '../util/fmt.js';

/** intervalle {lo, lc, hi, hc} : lc/hc = borne comprise ; jamais comprise du côté de l'infini */
export const I = (lo, lc, hi, hc) => ({ lo, lc: lo === -INF ? false : !!lc, hi, hc: hi === INF ? false : !!hc });
export const REALS = () => [I(-INF, 0, INF, 0)];

/** écriture française d'une réunion d'intervalles */
export function fmtSet(S) {
  if (!S.length) return '∅';
  if (S.length === 1 && S[0].lo === -INF && S[0].hi === INF) return 'ℝ';
  return S.map(i => `${i.lc ? '[' : ']'}${M(i.lo)} ; ${M(i.hi)}${i.hc ? ']' : '['}`).join(' ∪ ');
}
/** x appartient-il à la réunion S ? */
export const inSet = (S, x) => S.some(i => (x > i.lo || (i.lc && x === i.lo)) && (x < i.hi || (i.hc && x === i.hi)));

export function realLine(S, marks = [], o = {}) {
  let pts = [...marks.map(m => m.x)];
  (S || []).forEach(i => { if (isFinite(i.lo)) pts.push(i.lo); if (isFinite(i.hi)) pts.push(i.hi); });
  if (!pts.length) pts = [0];
  let xmin = Math.floor(Math.min(...pts, 0)) - 2, xmax = Math.ceil(Math.max(...pts, 0)) + 2;
  while (xmax - xmin < 10) { xmin--; xmax++; }
  const W = 460, H = o.h || 86, pad = 18, y = H - 36, sx = (W - 2 * pad) / (xmax - xmin);
  const X = x => +(pad + (Math.max(xmin - .5, Math.min(xmax + .5, x)) - xmin) * sx).toFixed(1);
  const st = xmax - xmin <= 22 ? 1 : xmax - xmin <= 44 ? 2 : 5, lab = xmax - xmin <= 16 ? 1 : 2 * st;
  let s = `<svg viewBox="0 0 ${W} ${H}" class="vis" role="img" aria-label="droite réelle" font-family="system-ui,sans-serif"><line x1="${pad - 8}" y1="${y}" x2="${W - pad + 4}" y2="${y}" stroke="#333" stroke-width="1.8"/><path d="M${W - pad + 12},${y} l-10,-5 v10z" fill="#333"/>`;
  for (let x = Math.ceil(xmin / st) * st; x <= xmax; x += st) {
    s += `<line x1="${X(x)}" y1="${y - 5}" x2="${X(x)}" y2="${y + 5}" stroke="#333"/>`;
    if (x % lab === 0) s += `<text x="${X(x)}" y="${y + 22}" font-size="13" text-anchor="middle" fill="#555">${M(x)}</text>`;
  }
  if (S) {
    if (!S.length) s += `<text x="${W / 2}" y="${y - 14}" font-size="18" text-anchor="middle" fill="var(--sol)" font-weight="700">∅ : aucun x ne convient</text>`;
    S.forEach(i => {
      const a = X(i.lo), b = X(i.hi), c = 'var(--sol)';
      s += `<line x1="${a}" y1="${y}" x2="${b}" y2="${y}" stroke="${c}" stroke-width="7" opacity=".85"/>`;
      if (isFinite(i.lo)) { const k = i.lc ? 1 : -1; s += `<path d="M${a + 7 * k},${y - 14} L${a},${y - 14} L${a},${y + 14} L${a + 7 * k},${y + 14}" fill="none" stroke="${c}" stroke-width="3.5"/>`; }
      if (isFinite(i.hi)) { const k = i.hc ? -1 : 1; s += `<path d="M${b + 7 * k},${y - 14} L${b},${y - 14} L${b},${y + 14} L${b + 7 * k},${y + 14}" fill="none" stroke="${c}" stroke-width="3.5"/>`; }
    });
  }
  marks.forEach(m => { s += `<circle cx="${X(m.x)}" cy="${y}" r="5" fill="${m.c || '#e8590c'}"/>` + (m.l ? `<text x="${X(m.x)}" y="${y - 20}" font-size="14" font-weight="700" text-anchor="middle" fill="${m.c || '#e8590c'}">${m.l}</text>` : ''); });
  if (o.arc) {
    const [a, b, l] = o.arc, mx = (X(a) + X(b)) / 2;
    s += `<path d="M${X(a)},${y - 8} Q${mx},${y - 50} ${X(b)},${y - 8}" fill="none" stroke="#e8590c" stroke-width="2" stroke-dasharray="5 4"/><text x="${mx}" y="${y - 36}" font-size="14" text-anchor="middle" fill="#e8590c" font-weight="700">${l}</text>`;
  }
  return s + '</svg>';
}

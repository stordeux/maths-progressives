// Dessins du module Ratios et fractions (chaînes SVG, sans DOM, sans hasard : les parts coloriées sont les premières).
import { M } from '../../engine/util/fmt.js';

const INK = '#343a40';
export const COL = ['#74c0fc', '#ffa94d', '#8ce99a', '#fcc2d7'];
const PALE = ['#d0ebff', '#ffe8cc'];
const svg = (w, h, label, inner, maxw = w) => `<svg viewBox="0 0 ${w} ${h}" class="vis" style="max-width:${maxw}px" role="img" aria-label="${label}" font-family="system-ui,sans-serif">${inner}</svg>`;
const tx = (x, y, s, o = {}) => `<text x="${x}" y="${y}" font-size="${o.fs || 16}" text-anchor="${o.a || 'middle'}" fill="${o.c || INK}"${o.b ? ' font-weight="700"' : ''}>${s}</text>`;
const ln = (x1, y1, x2, y2, o = {}) => `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${o.c || INK}" stroke-width="${o.w || 2}"${o.dash ? ` stroke-dasharray="${o.dash}"` : ''}/>`;
const rect = (x, y, w, h, fill, o = {}) => `<rect x="${(+x).toFixed(2)}" y="${y}" width="${(+w).toFixed(2)}" height="${h}" fill="${fill}" stroke="${o.s || '#333'}" stroke-width="${o.w || 2}"${o.r ? ` rx="${o.r}"` : ''}/>`;
/** fraction empilée centrée en x, trait de fraction à l'ordonnée y */
export const sf = (x, y, n, d, fs = 17) => {
  const hw = 5 + 5.5 * Math.max(String(n).length, String(d).length);
  return tx(x, y - 5, n, { b: 1, fs }) + ln(x - hw, y, x + hw, y, { w: 2 }) + tx(x, y + fs + 1, d, { b: 1, fs });
};
/** nombre ou fraction [n, d] (d = 1 : entier) empilé(e) en (x, y), suivi d'une unité ; renvoie le SVG */
function val(x, y, v, unit = '', o = {}) {
  const [n, d] = Array.isArray(v) ? v : [v, 1];
  const fs = o.fs || 16;
  if (d === 1) return tx(x, y + 6, n + (unit ? ' ' + unit : ''), { b: 1, fs, a: o.a || 'middle', c: o.c });
  const hw = 5 + 5.5 * Math.max(String(n).length, String(d).length);
  return sf(x, y, n, d, fs) + (unit ? tx(x + hw + 6, y + 6, unit, { b: 1, fs, a: 'start', c: o.c }) : '');
}
const fl = v => (Array.isArray(v) ? v[0] / v[1] : v);

/** a unités de longueur partagées en b parts égales ; la première part est coloriée (valeur cherchée) */
export function partageBar(a, b, { c1 = '', c2 = '' } = {}) {
  const W = 300, x0 = 14, w1 = W / a, w2 = W / b;
  let s = tx(x0 + W / 2, 18, c1 || `${a} à partager`, { b: 1 });
  for (let i = 0; i < a; i++) s += rect(x0 + i * w1, 28, w1, 34, PALE[i % 2]);
  s += ln(x0, 66, x0 - 6, 92, { c: '#868e96', dash: '4 4', w: 1.5 }) + ln(x0 + W, 66, x0 + W + 6, 92, { c: '#868e96', dash: '4 4', w: 1.5 });
  for (let j = 0; j < b; j++) s += rect(x0 + j * w2, 96, w2, 34, j === 0 ? COL[0] : '#fff');
  s += tx(x0 + w2 / 2, 119, '?', { b: 1, fs: 18 }) + tx(x0 + W / 2, 152, c2 || `partagé en ${b} parts égales`, { b: 1 });
  return svg(x0 * 2 + W + 12, 162, `${a} à partager en ${b} parts égales`, s, 360);
}

/** carré : a/b de c/d. Colonnes : c sur d (orange) ; lignes : a sur b (bleu) ; partie commune violette */
export function aireFrac(a, b, c, d, cap = '') {
  const S = 200, x0 = 64, y0 = 62, H = y0 + S + (cap ? 40 : 14);
  let s = '';
  for (let i = 0; i < b; i++) for (let j = 0; j < d; j++) {
    const inA = i < a, inC = j < c, fill = inA && inC ? '#b197fc' : inA ? '#d0ebff' : inC ? '#ffe8cc' : '#fff';
    s += rect(x0 + j * S / d, y0 + i * S / b, S / d, S / b, fill, { s: '#495057', w: 1.2 });
  }
  s += rect(x0, y0, S, S, 'none', { s: '#212529', w: 3 });
  s += ln(x0 - 10, y0, x0 - 10, y0 + a * S / b, { c: '#1971c2', w: 4 }) + sf(x0 - 34, y0 + a * S / b / 2, a, b);
  s += ln(x0, y0 - 10, x0 + c * S / d, y0 - 10, { c: '#e8590c', w: 4 }) + sf(x0 + c * S / d / 2, y0 - 36, c, d);
  if (cap) s += tx(x0 + S / 2, H - 12, cap, { b: 1, fs: 16 });
  return svg(x0 + S + 14, H, `carré unité : ${a} sur ${b} de ${c} sur ${d}`, s, 290);
}

/** barre « 1 » partagée en n parts égales ; hide : la valeur d'une part est remplacée par « ? » */
export function inverseBar(n, hide = false) {
  const W = 320, x0 = 20, w = W / n;
  let s = tx(x0 + W / 2, 16, '1 entier', { b: 1 });
  for (let i = 0; i < n; i++) s += rect(x0 + i * w, 26, w, 42, i % 2 ? PALE[1] : PALE[0]) + (hide ? tx(x0 + i * w + w / 2, 53, '?', { b: 1, fs: 17 }) : (w >= 34 ? sf(x0 + i * w + w / 2, 45, 1, n, 14) : ''));
  s += tx(x0 + W / 2, 100, hide ? `${n} parts égales : ${n} × ? = 1` : `${n} parts égales de ${'1/' + n} : ${n} × ${'1/' + n} = 1`, { b: 1, fs: 15 });
  return svg(x0 * 2 + W, 112, `une unité partagée en ${n} parts égales`, s, 380);
}

/** une fraction et son inverse ; hide : l'inverse est remplacé par « ? » */
export function flip(a, b, hide = false) {
  let s = sf(70, 56, a, b, 22) + tx(120, 62, '×', { fs: 22 });
  s += hide ? tx(170, 63, '?', { fs: 26, b: 1 }) : sf(170, 56, b, a, 22);
  s += tx(222, 62, '= 1', { fs: 22, b: 1 });
  s += `<path d="M70 92 C70 118 170 118 170 92" fill="none" stroke="#e8590c" stroke-width="3"/><path d="M165 98 L170 90 L176 99 Z" fill="#e8590c"/>`;
  s += tx(120, 138, 'on échange le haut et le bas', { fs: 14, c: '#e8590c', b: 1 });
  return svg(270, 150, `${a} sur ${b} et son inverse, de produit 1`, s, 320);
}

/**
 * Barre de longueur x (nombre ou [n, d]) découpée en groupes de longueur s ; le dernier groupe, incomplet, est grisé.
 * o.unit : unité écrite à côté des longueurs ; o.cap : légende.
 */
export function groupes(x, s, o = {}) {
  const X = fl(x), S = fl(s), W = 340, x0 = 30, u = W / X, n = Math.ceil(X / S - 1e-9);
  let g = val(x0 + W / 2, 28, x, o.unit || '', { fs: 15 }) + ln(x0, 50, x0 + W, 50, { w: 2 }) + ln(x0, 44, x0, 56, { w: 2 }) + ln(x0 + W, 44, x0 + W, 56, { w: 2 });
  for (let k = 0; k < n; k++) {
    const a = k * S, b = Math.min((k + 1) * S, X), full = b - a > S - 1e-9, w = (b - a) * u;
    g += rect(x0 + a * u, 60, w, 40, full ? COL[k % 2] : '#dee2e6', { w: 1.8 });
    if (n <= 20 && w >= 16) g += tx(x0 + a * u + w / 2, 86, full ? k + 1 : '', { b: 1, fs: 14 });
  }
  g += ln(x0, 112, x0 + S * u, 112, { w: 3, c: '#e8590c' }) + val(x0 + S * u / 2, 138, s, o.unit || '', { fs: 14, c: '#e8590c' });
  if (o.cap) g += tx(x0 + W / 2, 190, o.cap, { b: 1, fs: 15 });
  return svg(x0 * 2 + W + 40, o.cap ? 200 : 172, 'longueur découpée en morceaux égaux', g, 460);
}

/** unité partagée en b parts égales dont a coloriées ; lab1 sous la partie coloriée, lab2 au-dessus de la barre entière */
export function barreFrac(a, b, { lab1 = '', lab2 = '' } = {}) {
  const W = 320, x0 = 20, w = W / b;
  let s = ln(x0, 36, x0 + W, 36) + ln(x0, 30, x0, 42) + ln(x0 + W, 30, x0 + W, 42) + tx(x0 + W / 2, 24, lab2, { b: 1 });
  for (let j = 0; j < b; j++) s += rect(x0 + j * w, 46, w, 40, j < a ? COL[0] : '#fff');
  s += ln(x0, 98, x0 + a * w, 98, { c: '#e8590c', w: 3 }) + tx(x0 + a * w / 2, 122, lab1, { b: 1, c: '#e8590c' });
  return svg(x0 * 2 + W, 134, `barre partagée en ${b} parts dont ${a} coloriées`, s, 380);
}

/**
 * Barre partagée selon un ratio. o.parts = [3, 5], o.names = ['Léa', 'Tom'], o.vals = ['?', '40 €'] (sous les noms),
 * o.total = texte au-dessus de la barre entière, o.block = texte sous la barre (« 1 part = ? »),
 * o.unit = mot écrit dans chaque partie (défaut « parts » ; '' : seulement le nombre),
 * o.labels = textes dans les parties : la barre est alors proportionnelle aux nombres de o.parts, sans parts unitaires.
 */
export function ratioBar(o) {
  const parts = o.parts, S = parts.reduce((p, q) => p + q, 0), W = 330, x0 = 16, w = W / S;
  const top = o.total ? 34 : 6, y = top + 8, h = 46;
  let s = '';
  if (o.total) s += ln(x0, top, x0 + W, top) + ln(x0, top - 6, x0, top + 6) + ln(x0 + W, top - 6, x0 + W, top + 6) + tx(x0 + W / 2, top - 10, o.total, { b: 1 });
  let acc = 0;
  parts.forEach((p, i) => {
    if (!o.labels && S <= 24) for (let j = 0; j < p; j++) s += rect(x0 + (acc + j) * w, y, w, h, COL[i], { w: 1.2, s: '#555' });
    else s += rect(x0 + acc * w, y, p * w, h, COL[i], { w: 1.2, s: '#555' });
    s += rect(x0 + acc * w, y, p * w, h, 'none', { w: 3 });
    const cx = x0 + (acc + p / 2) * w;
    const unit = o.unit === undefined ? (p > 1 ? ' parts' : ' part') : (o.unit ? ' ' + o.unit : '');
    s += tx(cx, y + h / 2 + 5, o.labels ? o.labels[i] : p + unit, { b: 1, fs: p * w >= 70 ? 15 : 12 });
    if (o.names) s += tx(cx, y + h + 22, o.names[i], { b: 1, fs: 15 });
    if (o.vals) s += tx(cx, y + h + 44, o.vals[i], { b: 1, fs: 15, c: '#c2410c' });
    acc += p;
  });
  let H = y + h + (o.vals ? 56 : o.names ? 34 : 12);
  if (o.block) { s += tx(x0 + W / 2, H + 10, o.block, { b: 1, fs: 15, c: '#1864ab' }); H += 22; }
  return svg(x0 * 2 + W, H, 'barre partagée selon un ratio', s, 400);
}

/**
 * Expression avec des fractions, dont une ou plusieurs parties sont encadrées (ordre des calculs).
 * tokens : { f: [n, d] } | { n: entier } | { t: '+' }, boxes : [[premier, dernier, légende]].
 */
export function ordre(tokens, boxes = []) {
  const wd = t => (t.f ? 38 : t.n !== undefined ? 24 : t.t === '(' || t.t === ')' ? 14 : 30);
  let x = 14; const pos = tokens.map(t => { const w = wd(t), c = x + w / 2; x += w; return { c, x0: c - w / 2, x1: c + w / 2 }; });
  const Wt = x + 14, y = 52;
  let s = '';
  boxes.forEach(([i, j, lab], k) => {
    const x0 = pos[i].x0 - 4, x1 = pos[j].x1 + 4;
    s += rect(x0, 8, x1 - x0, 84, k ? '#e6fcf5' : '#fff3bf', { s: k ? '#0ca678' : '#f08c00', w: 2.5, r: 10 });
    s += tx((x0 + x1) / 2, 112, lab, { b: 1, fs: 14, c: k ? '#087f5b' : '#e67700' });
  });
  tokens.forEach((t, i) => {
    const c = pos[i].c;
    if (t.f) s += sf(c, y, t.f[0], t.f[1], 18);
    else if (t.n !== undefined) s += tx(c, y + 7, t.n, { b: 1, fs: 20 });
    else s += tx(c, y + 8, t.t, { fs: t.t === '(' || t.t === ')' ? 30 : 22, b: 1 });
  });
  return svg(Wt, boxes.length ? 124 : 100, 'expression : ordre des calculs', s, Math.max(Wt, 200));
}

/** nombre → texte pour une étiquette de SVG (virgule décimale) */
export const num = M;

// Dessins du module Arithmétique (chaînes SVG, sans DOM : importé aussi par Node pour les tests).
import { M } from '../../engine/util/fmt.js';

const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const INK = '#343a40', TEAL = '#0f766e', TEAL_L = '#c3f0e8', ORA = '#e8590c', ORA_L = '#ffe8cc', GRY = '#adb5bd', RED = '#e03131';
const SUPD = { 0: '⁰', 1: '¹', 2: '²', 3: '³', 4: '⁴', 5: '⁵', 6: '⁶', 7: '⁷', 8: '⁸', 9: '⁹' };
/** exposant en caractères Unicode pour le texte des SVG */
const U = e => String(e).split('').map(c => SUPD[c] ?? c).join('');
/** nombre groupé par 3 (espace insécable) pour les étiquettes */
const gr = n => (n >= 10000 ? String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ' ') : String(n));
const open = (W, H, label, maxw = 520) => `<svg viewBox="0 0 ${W} ${H}" class="vis" style="width:${Math.min(W, maxw)}px" role="img" aria-label="${esc(label)}" font-family="system-ui,sans-serif">`;
const T = (x, y, s, o = {}) => `<text x="${x}" y="${y}" font-size="${o.fs || 15}" text-anchor="${o.a || 'middle'}" fill="${o.c || INK}"${o.b ? ' font-weight="700"' : ''}>${esc(s)}</text>`;

/** table de multiples : k × b pour k = 1…kmax ; la valeur `mark` (si elle y est) est colorée */
export function tableMult(b, kmax = 10, mark = null) {
  const cw = 46, W = kmax * cw + 74, H = 96;
  let s = open(W, H, `Les ${kmax} premiers multiples de ${b}`);
  s += T(36, 33, '×', { b: 1 }) + T(36, 69, 'multiple', { fs: 11 });
  for (let k = 1; k <= kmax; k++) {
    const x = 70 + (k - 1) * cw, hit = mark !== null && k * b === mark;
    s += `<rect x="${x}" y="8" width="${cw - 4}" height="34" fill="${GRY}" fill-opacity=".25" stroke="${INK}"/><rect x="${x}" y="52" width="${cw - 4}" height="34" fill="${hit ? ORA_L : TEAL_L}" stroke="${INK}"/>`;
    s += T(x + (cw - 4) / 2, 31, k) + T(x + (cw - 4) / 2, 75, gr(k * b), { b: 1, fs: gr(k * b).length > 4 ? 12 : 15 });
  }
  return s + '</svg>';
}

/** droite avec deux multiples consécutifs de b qui encadrent N (N marqué en orange) */
export function entre(b, prev, next, N) {
  const W = 480, x0 = 50, x1 = W - 50, y = 62;
  const lo = Math.min(prev, N), hi = Math.max(next, N), span = hi - lo || 1;
  const X = v => x0 + (v - lo) / span * (x1 - x0);
  let s = open(W, 112, `Les multiples de ${b} autour de ${N}`);
  s += `<line x1="${x0 - 20}" y1="${y}" x2="${x1 + 20}" y2="${y}" stroke="${INK}" stroke-width="3"/>`;
  [prev, next].forEach(v => { s += `<line x1="${X(v)}" y1="${y - 12}" x2="${X(v)}" y2="${y + 12}" stroke="${TEAL}" stroke-width="4"/>` + T(X(v), y + 32, gr(v), { b: 1, c: TEAL }); });
  if (N !== prev && N !== next) s += `<circle cx="${X(N)}" cy="${y}" r="8" fill="${ORA}"/>` + T(X(N), y - 16, gr(N), { b: 1, c: ORA });
  s += `<path d="M${X(prev)},${y - 30} Q${(X(prev) + X(next)) / 2},${y - 62} ${X(next)},${y - 30}" fill="none" stroke="${GRY}" stroke-width="2"/>` + T((X(prev) + X(next)) / 2, 22, `+ ${gr(b)}`, { fs: 13 });
  return s + '</svg>';
}

/** diviseurs par paires : un rectangle d × (X ÷ d) par paire (X ≤ 60) */
export function rectangles(X, divs) {
  const pairs = divs.filter(d => d * d <= X).map(d => [d, X / d]);
  const cell = Math.min(15, Math.floor(180 / Math.max(...pairs.map(p => p[1]))));
  const blocks = pairs.map(([p, q]) => ({ p, q, w: q * cell, h: p * cell }));
  const colW = Math.max(...blocks.map(b => b.w)) + 28;
  const per = Math.max(1, Math.floor(480 / colW));
  const rows = Math.ceil(blocks.length / per), rowH = Math.max(...blocks.map(b => b.h)) + 36;
  const W = Math.min(per, blocks.length) * colW + 10, H = rows * rowH + 6;
  let s = open(W, H, `Les rectangles de ${X} carreaux : ${pairs.map(p => `${p[0]} × ${p[1]}`).join(', ')}`);
  blocks.forEach((b, i) => {
    const x = 8 + (i % per) * colW, y = 8 + Math.floor(i / per) * rowH;
    for (let r = 0; r < b.p; r++) for (let c = 0; c < b.q; c++) s += `<rect x="${x + c * cell}" y="${y + r * cell}" width="${cell}" height="${cell}" fill="${TEAL_L}" stroke="${TEAL}" stroke-width="1"/>`;
    s += T(x + b.w / 2, y + b.h + 18, `${b.p} × ${b.q}`, { b: 1, fs: 14 });
  });
  return s + '</svg>';
}

/** les dix chiffres et ceux qui rendent un nombre divisible par 2, 5, 10 */
export function finaux() {
  const W = 460, H = 150, cw = 38, x0 = 100;
  let s = open(W, H, 'Chiffres des unités possibles pour un multiple de 2, de 5, de 10');
  s += T(x0 - 8, 22, 'unités', { a: 'end', fs: 13 });
  for (let k = 0; k < 10; k++) s += `<rect x="${x0 + k * cw}" y="6" width="${cw - 4}" height="24" fill="${GRY}" fill-opacity=".25" stroke="${INK}"/>` + T(x0 + k * cw + (cw - 4) / 2, 24, k, { b: 1 });
  [['par 2', k => k % 2 === 0], ['par 5', k => k % 5 === 0], ['par 10', k => k === 0]].forEach(([lab, f], r) => {
    const y = 42 + r * 34;
    s += T(x0 - 8, y + 19, lab, { a: 'end', fs: 14, b: 1 });
    for (let k = 0; k < 10; k++) s += `<rect x="${x0 + k * cw}" y="${y}" width="${cw - 4}" height="26" fill="${f(k) ? TEAL_L : '#fff'}" stroke="${f(k) ? TEAL : GRY}"/>` + (f(k) ? T(x0 + k * cw + (cw - 4) / 2, y + 19, '✔', { c: TEAL, b: 1 }) : '');
  });
  return s + '</svg>';
}

/** chiffres d'un nombre séparés par « + », puis la somme */
export function chiffresSomme(n, caption = '') {
  const ds = String(n).split('').map(Number), sum = ds.reduce((a, b) => a + b, 0);
  const step = 44, W = Math.max(300, ds.length * step + 80), x0 = (W - ds.length * step) / 2;
  let s = open(W, 118, caption || `La somme des chiffres de ${n} est ${sum}`);
  ds.forEach((c, i) => {
    const x = x0 + i * step;
    s += `<rect x="${x}" y="8" width="${step - 8}" height="40" rx="6" fill="${TEAL_L}" stroke="${TEAL}" stroke-width="2"/>` + T(x + (step - 8) / 2, 36, c, { fs: 22, b: 1 });
    if (i < ds.length - 1) s += T(x + step - 4, 36, '+', { b: 1, fs: 18 });
  });
  s += `<path d="M${x0},56 L${x0 + ds.length * step - 8},56" stroke="${GRY}" stroke-width="2"/>`;
  s += T(W / 2, 92, `${ds.join(' + ')} = ${sum}`, { fs: 20, b: 1, c: ORA });
  s += T(W / 2, 112, `${sum % 9 === 0 ? 'multiple de 9 (donc de 3)' : sum % 3 === 0 ? 'multiple de 3, pas de 9' : 'ni multiple de 3 ni de 9'}`, { fs: 13 });
  return s + '</svg>';
}

/** a objets rangés en groupes de b : q groupes pleins et un reste (division euclidienne) */
export function groupes(a, b) {
  const q = Math.floor(a / b), r = a % b;
  const show = Math.min(q, 8), more = q > 8;
  const W = 480, gw = Math.min(54, Math.floor((W - 60) / (show + (r ? 1 : 0) + (more ? 1 : 0)))), H = 100;
  let s = open(W, H, `${a} = ${b} × ${q} + ${r} : ${q} groupes de ${b} et un reste de ${r}`);
  const total = show + (more ? 1 : 0) + (r ? 1 : 0), x0 = (W - total * gw) / 2;
  let x = x0;
  for (let i = 0; i < show; i++, x += gw) s += `<rect x="${x + 2}" y="14" width="${gw - 4}" height="40" rx="6" fill="${TEAL_L}" stroke="${TEAL}" stroke-width="2"/>` + T(x + gw / 2, 40, b, { b: 1, fs: gw < 36 ? 12 : 15 });
  if (more) { s += T(x + gw / 2, 42, '…', { fs: 22, b: 1 }); x += gw; }
  if (r) s += `<rect x="${x + 2}" y="14" width="${Math.max(10, (gw - 4) * r / b)}" height="40" rx="6" fill="${ORA_L}" stroke="${ORA}" stroke-width="2" stroke-dasharray="4 3"/>` + T(x + 2 + Math.max(10, (gw - 4) * r / b) / 2, 40, r, { b: 1, c: ORA, fs: 13 });
  s += T(W / 2, 84, `${q} groupe${q > 1 ? 's' : ''} de ${b}, reste ${r} : ${gr(a)} = ${gr(b)} × ${q} + ${r}`, { fs: 15, b: 1 });
  return s + '</svg>';
}

/** crible d'Ératosthène de 1 à 50 (fixe) : premiers en couleur */
export function crible(primes) {
  const cw = 44, W = 10 * cw + 12, H = 5 * 40 + 46;
  const P = new Set(primes);
  let s = open(W, H, 'Tableau des nombres de 1 à 50 : les nombres premiers sont colorés');
  for (let n = 1; n <= 50; n++) {
    const x = 6 + ((n - 1) % 10) * cw, y = 6 + Math.floor((n - 1) / 10) * 40, p = P.has(n);
    s += `<rect x="${x}" y="${y}" width="${cw - 4}" height="36" rx="6" fill="${p ? TEAL : n === 1 ? '#fff' : '#f1f3f5'}" stroke="${p ? TEAL : GRY}" ${n === 1 ? 'stroke-dasharray="4 3"' : ''}/>` + T(x + (cw - 4) / 2, y + 24, n, { b: p, c: p ? '#fff' : n === 1 ? RED : '#868e96', fs: 16 });
  }
  s += T(W / 2, H - 12, `${primes.length} nombres premiers jusqu'à 50 ; 1 n'est pas premier`, { fs: 14, b: 1 });
  return s + '</svg>';
}

/** arbre de décomposition : on retire à chaque ligne le plus petit facteur premier */
export function arbre(n, facteurs) {
  const list = [];
  facteurs.forEach(([p, e]) => { for (let i = 0; i < e; i++) list.push(p); });
  const k = list.length, rowH = 46, W = 260, H = k * rowH + 12;
  let s = open(W, H, `Arbre de décomposition de ${n} : ${list.join(' × ')}`, 300);
  let rest = n;
  list.forEach((p, i) => {
    const y = 26 + i * rowH, xr = 170, xl = 70;
    if (i < k - 1) {
      s += `<line x1="${xr - 34}" y1="${y}" x2="${xl + 17}" y2="${y}" stroke="${GRY}" stroke-width="2"/><line x1="${xr}" y1="${y + 15}" x2="${xr}" y2="${y + rowH - 15}" stroke="${GRY}" stroke-width="2"/>`;
      s += `<rect x="${xr - 32}" y="${y - 15}" width="64" height="30" rx="15" fill="#fff" stroke="${INK}" stroke-width="2"/>` + T(xr, y + 6, gr(rest), { b: 1 });
      s += `<circle cx="${xl}" cy="${y}" r="16" fill="${TEAL}"/>` + T(xl, y + 6, p, { b: 1, c: "#fff" });
    } else s += `<circle cx="${xr}" cy="${y}" r="16" fill="${TEAL}"/>` + T(xr, y + 6, p, { b: 1, c: "#fff" });
    rest /= p;
  });
  return s + "</svg>";
}

/** deux ensembles de diviseurs : la partie commune au milieu */
export function venn(a, b, da, db) {
  const com = da.filter(x => db.includes(x)), A = da.filter(x => !com.includes(x)), B = db.filter(x => !com.includes(x));
  const W = 480, H = 190;
  let s = open(W, H, `Diviseurs de ${a} et de ${b} ; diviseurs communs : ${com.join(', ')}`);
  s += `<ellipse cx="170" cy="92" rx="140" ry="76" fill="${TEAL_L}" fill-opacity=".55" stroke="${TEAL}" stroke-width="2"/><ellipse cx="310" cy="92" rx="140" ry="76" fill="${ORA_L}" fill-opacity=".6" stroke="${ORA}" stroke-width="2"/>`;
  s += T(110, 20, `Diviseurs de ${a}`, { c: TEAL, b: 1, fs: 14 }) + T(370, 20, `Diviseurs de ${b}`, { c: ORA, b: 1, fs: 14 });
  const put = (list, cx, cy, wrapN) => { const rows = Math.ceil(list.length / wrapN); list.forEach((v, i) => { s += T(cx + ((i % wrapN) - (Math.min(wrapN, list.length) - 1) / 2) * 30, cy + (Math.floor(i / wrapN) - (rows - 1) / 2) * 24, v, { b: 1 }); }); };
  put(A, 100, 98, 3); put(B, 380, 98, 3); put(com, 240, 98, 2);
  s += T(240, 176, 'diviseurs communs', { fs: 12 });
  return s + '</svg>';
}

/** paquets identiques : g boîtes, chacune avec n1 ronds et n2 carrés */
export function paquets(g, n1, n2, lab1 = '', lab2 = '') {
  const per = Math.min(g, 4), rows = Math.ceil(g / per), bw = 108, bh = 24 + Math.ceil((n1 + n2) / 5) * 20 + 10;
  const W = per * (bw + 12) + 12, H = rows * (bh + 12) + 28;
  let s = open(W, H, `${g} paquets identiques de ${n1} + ${n2} objets`);
  for (let i = 0; i < g; i++) {
    const x = 12 + (i % per) * (bw + 12), y = 8 + Math.floor(i / per) * (bh + 12);
    s += `<rect x="${x}" y="${y}" width="${bw}" height="${bh}" rx="8" fill="#fff" stroke="${INK}" stroke-width="2"/>`;
    for (let j = 0; j < n1 + n2; j++) {
      const cx = x + 14 + (j % 5) * 20, cy = y + 16 + Math.floor(j / 5) * 20;
      s += j < n1 ? `<circle cx="${cx}" cy="${cy}" r="7" fill="${TEAL}"/>` : `<rect x="${cx - 7}" y="${cy - 7}" width="14" height="14" fill="${ORA}"/>`;
    }
  }
  s += T(W / 2, H - 8, `${g} paquets : ${n1} ${lab1 || '●'} et ${n2} ${lab2 || '■'} dans chacun`, { fs: 13, b: 1 });
  return s + '</svg>';
}

/** rectangle L × l pavé par des carreaux de côté c (L et l multiples de c) */
export function carreaux(L, l, c) {
  const nx = L / c, ny = l / c, W = 400, scale = Math.min((W - 90) / L, 170 / l), w = L * scale, h = l * scale;
  const x0 = (W - w) / 2, y0 = 26, H = y0 + h + 40;
  let s = open(W, H, `Un rectangle de ${L} sur ${l} pavé par ${nx * ny} carreaux de côté ${c}`);
  s += `<rect x="${x0}" y="${y0}" width="${w}" height="${h}" fill="${TEAL_L}" stroke="${INK}" stroke-width="2"/>`;
  for (let i = 1; i < nx; i++) s += `<line x1="${x0 + i * c * scale}" y1="${y0}" x2="${x0 + i * c * scale}" y2="${y0 + h}" stroke="${TEAL}" stroke-width="1.5"/>`;
  for (let j = 1; j < ny; j++) s += `<line x1="${x0}" y1="${y0 + j * c * scale}" x2="${x0 + w}" y2="${y0 + j * c * scale}" stroke="${TEAL}" stroke-width="1.5"/>`;
  s += T(x0 + w / 2, y0 - 8, `${L}`, { b: 1 }) + T(x0 - 8, y0 + h / 2 + 5, `${l}`, { b: 1, a: 'end' });
  s += T(W / 2, H - 12, `${nx} × ${ny} = ${nx * ny} carreaux de côté ${c}`, { b: 1, fs: 14 });
  return s + '</svg>';
}

/** deux frises de multiples de a et de b jusqu'à leur PPCM */
export function frise(a, b, m) {
  const W = 500, x0 = 24, x1 = W - 24, X = v => x0 + v / m * (x1 - x0), H = 142;
  let s = open(W, H, `Multiples de ${a} et de ${b} : ils se retrouvent en ${m}`);
  const row = (step, y, col, lab) => {
    s += T(x0, y - 16, `multiples de ${step}`, { a: 'start', c: col, b: 1, fs: 13 }) + `<line x1="${x0}" y1="${y}" x2="${x1}" y2="${y}" stroke="${col}" stroke-width="2"/>`;
    for (let v = 0; v <= m; v += step) s += `<circle cx="${X(v)}" cy="${y}" r="${v === m ? 7 : 5}" fill="${v === m ? RED : col}"/>` + (m / step <= 14 || v === m ? T(X(v), y + 20, v, { fs: 11, c: col }) : '');
  };
  row(a, 40, TEAL); row(b, 98, ORA);
  s += `<line x1="${X(m)}" y1="28" x2="${X(m)}" y2="110" stroke="${RED}" stroke-width="2" stroke-dasharray="5 4"/>` + T(X(m) - 8, 134, `se retrouvent en ${m}`, { a: 'end', c: RED, b: 1, fs: 13 });
  return s + '</svg>';
}

/** n points rangés par paires (nombre pair, impair : 2n et 2n + 1) */
export function pairesImpaires(ns) {
  const W = 480, H = 128, colW = Math.min(110, (W - 20) / ns.length);
  let s = open(W, H, 'Des points rangés par paires : un nombre pair n\'a pas de point seul, un nombre impair en a un');
  ns.forEach((n, i) => {
    const x = 10 + i * colW + colW / 2;
    for (let j = 0; j < n; j++) {
      const pair = Math.floor(j / 2), left = j % 2, cx = x - 12 + left * 24, cy = 20 + pair * 20;
      const alone = n % 2 === 1 && j === n - 1;
      s += `<circle cx="${cx}" cy="${cy}" r="8" fill="${alone ? ORA : TEAL}"/>`;
    }
    s += T(x, H - 8, `${n} = ${n % 2 ? `2 × ${(n - 1) / 2} + 1` : `2 × ${n / 2}`}`, { fs: 12, b: 1 });
  });
  return s + '</svg>';
}

/** flèche de simplification a/b → a'/b' (÷ g) */
export function simplif(a, b, a2, b2, g) {
  const W = 420, H = 110;
  const fr = (x, n, d, col) => `${T(x, 46, gr(n), { b: 1, fs: 20, c: col })}<line x1="${x - 26}" y1="54" x2="${x + 26}" y2="54" stroke="${INK}" stroke-width="2"/>${T(x, 78, gr(d), { b: 1, fs: 20, c: col })}`;
  let s = open(W, H, `${a}/${b} devient ${a2}/${b2} en divisant en haut et en bas par ${g}`);
  s += fr(70, a, b, INK) + fr(350, a2, b2, TEAL);
  s += `<path d="M120,30 Q210,0 300,30" fill="none" stroke="${ORA}" stroke-width="2.5"/><path d="M120,92 Q210,122 300,92" fill="none" stroke="${ORA}" stroke-width="2.5"/>`;
  s += T(210, 22, `÷ ${g}`, { c: ORA, b: 1, fs: 16 }) + T(210, 112, `÷ ${g}`, { c: ORA, b: 1, fs: 16 });
  return s + '</svg>';
}
export { U, gr };

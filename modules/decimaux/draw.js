// Dessins du module « Nombres décimaux » (chaînes SVG, sans DOM : importé aussi par Node).
import { r6 } from '../../engine/util/arith.js';
import { fx, f, nd } from './num.js';

const INK = '#343a40', ACC = '#0f766e', ACC2 = '#e6f7f4', RED = '#e03131', BLUE = '#1971c2', ORG = '#e8590c';
const svg = (w, h, label, body, extra = '') => `<svg viewBox="0 0 ${w} ${h}" class="vis" ${extra} role="img" aria-label="${label}" font-family="system-ui,sans-serif">${body}</svg>`;
const tx = (x, y, s, o = {}) => `<text x="${x}" y="${y}" font-size="${o.fs || 16}" text-anchor="${o.a || 'middle'}" fill="${o.c || INK}"${o.b ? ' font-weight="700"' : ''}${o.m ? ' font-family="ui-monospace,Consolas,monospace"' : ''}>${s}</text>`;

const NAMES_INT = ['unités', 'dizaines', 'centaines', 'milliers', 'diz. mille', 'cent. mille'];
const NAMES_DEC = ['dixièmes', 'centièmes', 'millièmes'];

/** « 38,745 » → { ip: '38', dp: '745' } (espaces ignorés) */
const split = s => { const [ip, dp = ''] = String(s).replace(/[\s  ]/g, '').split(','); return { ip, dp }; };

/**
 * Tableau de numération. rows = [{ s: '38,745', c: couleur }] ; hi = puissance de 10 de la colonne à surligner
 * (−1 dixièmes, 0 unités…) ; links : relie les chiffres significatifs de la 1re ligne à ceux de la 2e (décalage) ;
 * cap : légende sous le tableau.
 */
export function numTable(rows, { hi = null, links = false, cap = '', ptsDec = 3 } = {}) {
  const P = rows.map(r => split(r.s));
  const nI = Math.max(3, ...P.map(p => p.ip.length)), nD = Math.max(ptsDec, ...P.map(p => p.dp.length));
  const n = nI + nD, W = 480, cw = Math.min(70, Math.floor((W - 12) / n)), x0 = (W - n * cw) / 2;
  const hh = 34, rh = 42, H = hh + rows.length * rh + (cap ? 34 : 12) + 4;
  const colOfPow = p => (p >= 0 ? nI - 1 - p : nI - 1 - p); // p < 0 : colonne nI + (−p − 1)
  const fs = cw >= 62 ? 12 : cw >= 54 ? 11 : 9.5;
  let s = '';
  for (let c = 0; c < n; c++) {
    const pw = c < nI ? nI - 1 - c : -(c - nI + 1), on = hi === pw;
    s += `<rect x="${x0 + c * cw}" y="2" width="${cw}" height="${hh}" fill="${on ? '#ffe066' : ACC2}" stroke="#868e96"/>`;
    s += tx(x0 + c * cw + cw / 2, 2 + hh / 2 + 4, pw >= 0 ? NAMES_INT[pw] : NAMES_DEC[-pw - 1], { fs, b: on });
  }
  const pos = []; // positions (x, y) des chiffres significatifs, par ligne
  rows.forEach((r, i) => {
    const y = 2 + hh + i * rh, p = P[i], col = r.c || INK;
    pos[i] = [];
    for (let c = 0; c < n; c++) {
      const pw = c < nI ? nI - 1 - c : -(c - nI + 1), on = hi === pw;
      s += `<rect x="${x0 + c * cw}" y="${y}" width="${cw}" height="${rh}" fill="${on ? '#fff3bf' : '#fff'}" stroke="#868e96"/>`;
      const ch = pw >= 0 ? p.ip[p.ip.length - 1 - pw] : p.dp[-pw - 1];
      if (ch !== undefined) s += tx(x0 + c * cw + cw / 2, y + rh / 2 + 8, ch, { fs: 24, b: 1, c: col });
    }
    s += `<circle cx="${x0 + nI * cw}" cy="${y + rh - 9}" r="4.5" fill="${RED}"/><path d="M${x0 + nI * cw},${y + rh - 6} l-3,9 h4z" fill="${RED}"/>`;
    // chiffres significatifs (du premier non nul au dernier chiffre écrit)
    const all = [];
    for (let c = 0; c < n; c++) {
      const pw = c < nI ? nI - 1 - c : -(c - nI + 1), ch = pw >= 0 ? p.ip[p.ip.length - 1 - pw] : p.dp[-pw - 1];
      if (ch !== undefined) all.push({ c, ch });
    }
    const first = all.findIndex(a => a.ch !== '0');
    pos[i] = (first < 0 ? [] : all.slice(first)).map(a => ({ x: x0 + a.c * cw + cw / 2, y }));
  });
  if (links && rows.length === 2) {
    const m = Math.min(pos[0].length, pos[1].length);
    for (let j = 0; j < m; j++) s += `<line x1="${pos[0][j].x}" y1="${pos[0][j].y + rh - 2}" x2="${pos[1][j].x}" y2="${pos[1][j].y + 2}" stroke="${ORG}" stroke-width="2" stroke-dasharray="4 3"/>`;
  }
  if (cap) s += tx(W / 2, H - 10, cap, { fs: 15, b: 1, c: ORG });
  return svg(W, H, 'tableau de numération : ' + rows.map(r => r.s).join(' puis '), s);
}

/**
 * Droite graduée en décimaux : de min à max, une graduation tous les `step`.
 * lab : 'ends' (extrémités), 'half' (extrémités et milieu), 'none', ou un entier n (une graduation sur n).
 * marks = [{ x, l, c }] ; segs = [{ a, b, c }] (segments colorés sur la droite). Les cercles gardent leur position
 * exacte dans le SVG : readLine() la relit pour vérifier les exercices.
 */
export function decLine({ min, max, step, marks = [], segs = [], lab = 'ends' } = {}) {
  const W = 480, pad = 30, y = 62, H = 100, N = Math.round((max - min) / step), sx = (W - 2 * pad) / N;
  const X = x => pad + (x - min) / step * sx;
  let s = `<line x1="${pad - 14}" y1="${y}" x2="${W - pad + 12}" y2="${y}" stroke="#333" stroke-width="2"/><path d="M${W - pad + 20},${y} l-10,-5 v10z" fill="#333"/>`;
  segs.forEach(g => { s += `<rect x="${X(g.a).toFixed(1)}" y="${y - 4}" width="${(X(g.b) - X(g.a)).toFixed(1)}" height="8" rx="3" fill="${g.c || '#74c0fc'}" opacity=".75"/>`; });
  for (let i = 0; i <= N; i++) {
    const big = i === 0 || i === N || i % 5 === 0 ? 11 : 7;
    s += `<line x1="${(pad + i * sx).toFixed(1)}" y1="${y - big}" x2="${(pad + i * sx).toFixed(1)}" y2="${y + big}" stroke="#333" stroke-width="${i === 0 || i === N ? 2.4 : 1.4}"/>`;
    const lb = lab === 'all' || (lab === 'ends' && (i === 0 || i === N)) || (lab === 'half' && (i === 0 || i === N || i * 2 === N)) || (typeof lab === 'number' && i % lab === 0);
    if (lb) s += tx((pad + i * sx).toFixed(1), y + 32, f(r6(min + i * step)), { fs: 15, c: '#495057' });
  }
  marks.forEach(m => {
    s += `<circle cx="${X(m.x).toFixed(2)}" cy="${y}" r="6.5" fill="${m.c || RED}"/>`;
    if (m.l) s += tx(X(m.x).toFixed(1), y - 16, m.l, { fs: 17, b: 1, c: m.c || RED });
  });
  return svg(W, H, 'droite graduée', s, `data-geom="${min},${step},${N}"`);
}
/** relit les abscisses des points d'une droite decLine (positions dans le SVG, arrondies à la graduation) */
export function readLine(sv) {
  const [min, step, N] = /data-geom="([^"]+)"/.exec(sv)[1].split(',').map(Number), pad = 30, sx = (480 - 2 * pad) / N;
  return [...sv.matchAll(/<circle cx="([\d.]+)"/g)].map(m => r6(min + Math.round((+m[1] - pad) / sx) * step));
}

/** barre de 10 bandes (dixièmes), n coloriées */
export function barre10(n) {
  let s = '';
  for (let i = 0; i < 10; i++) s += `<rect x="${12 + i * 40}" y="8" width="40" height="44" fill="${i < n ? '#63e6be' : '#fff'}" stroke="#333" stroke-width="2"/>`;
  s += tx(212, 80, `${n} bande${n > 1 ? 's' : ''} sur 10 : ${n}/10`, { fs: 15, b: 1, c: ACC });
  return svg(424, 92, `une barre partagée en 10 parts dont ${n} coloriées`, s, 'style="width:380px"');
}
/** grille de 100 carreaux, n coloriés (colonne par colonne de bas en haut comme on remplit une grille) */
export function grille100(n) {
  const c = 22, x0 = 8, y0 = 8;
  let s = '';
  for (let i = 0; i < 100; i++) {
    const col = Math.floor(i / 10), row = i % 10;
    s += `<rect x="${x0 + col * c}" y="${y0 + (9 - row) * c}" width="${c}" height="${c}" fill="${i < n ? '#63e6be' : '#fff'}" stroke="#868e96"/>`;
  }
  s += `<rect x="${x0}" y="${y0}" width="${10 * c}" height="${10 * c}" fill="none" stroke="#212529" stroke-width="3"/>`;
  s += tx(x0 + 5 * c, y0 + 10 * c + 22, `${n} carreaux sur 100 : ${n}/100`, { fs: 15, b: 1, c: ACC });
  return svg(236, 262, `une grille de 100 carreaux dont ${n} coloriés`, s, 'style="width:230px"');
}

/**
 * Opération posée (addition ou soustraction) avec virgules alignées. a, b : textes (« 3,5 ») ;
 * res : résultat (texte) ou null (cases vides) ; les zéros ajoutés pour aligner sont en gris ;
 * addition : retenues en bleu. op : '+' ou '−'.
 */
export function posed(op, a, b, res = null) {
  const A = split(a), B = split(b), R = res === null ? null : split(res);
  const nI = Math.max(A.ip.length, B.ip.length, R ? R.ip.length : 0), nD = Math.max(A.dp.length, B.dp.length, R ? R.dp.length : 0);
  const cw = 34, cm = 16, x0 = 48, rh = 40, W = x0 + nI * cw + cm + nD * cw + 14, H = 20 + 4 * rh + 18;
  const xp = p => (p >= 0 ? x0 + (nI - 1 - p) * cw + cw / 2 : x0 + nI * cw + cm + (-p - 1) * cw + cw / 2);
  const dig = (o, p) => (p >= 0 ? o.ip[o.ip.length - 1 - p] : o.dp[-p - 1]);
  const row = (o, y, col) => {
    let t = '';
    for (let p = nI - 1; p >= -nD; p--) {
      const ch = dig(o, p);
      if (ch !== undefined) t += tx(xp(p), y, ch, { fs: 26, b: 1, c: col, m: 1 });
      else if (p < 0) t += tx(xp(p), y, '0', { fs: 26, c: '#adb5bd', m: 1 });
    }
    return t + tx(x0 + nI * cw + cm / 2, y, ',', { fs: 28, b: 1, c: RED });
  };
  let s = '';
  const y1 = 20 + rh - 8, y2 = y1 + rh, yl = y2 + 10, y3 = yl + rh - 6;
  if (op === '+') { // retenues
    let carry = 0;
    for (let p = -nD; p < nI; p++) {
      const sum = (+(dig(A, p) ?? 0)) + (+(dig(B, p) ?? 0)) + carry;
      carry = sum >= 10 ? 1 : 0;
      if (carry && p + 1 < nI) s += tx(xp(p + 1) + 11, y1 - 22, '1', { fs: 15, b: 1, c: BLUE });
    }
  }
  s += row(A, y1, INK) + row(B, y2, INK) + tx(x0 - 16, y2, op, { fs: 28, b: 1, c: ACC });
  s += `<line x1="${x0 - 28}" y1="${yl}" x2="${W - 6}" y2="${yl}" stroke="#333" stroke-width="2.5"/>`;
  if (R) s += row(R, y3, ACC);
  else for (let p = nI - 1; p >= -nD; p--) s += `<rect x="${xp(p) - 14}" y="${y3 - 26}" width="28" height="32" rx="5" fill="none" stroke="#adb5bd" stroke-dasharray="4 3"/>`;
  return svg(W, H, `${a} ${op} ${b} posée en alignant les virgules`, s, `style="max-width:${Math.max(W, 240)}px"`);
}

/**
 * Division posée (potence) de D (texte « 7,5 ») par l'entier b, en ajoutant `extra` zéros après la virgule.
 * Chaque ligne montre le reste (en vert), suivi du chiffre abaissé (en bleu).
 */
export function divPosed(D, b, extra = 0) {
  const { ip, dp } = split(D);
  const chars = ip + dp + '0'.repeat(extra);
  const nInt = ip.length, cw = 28, x0 = 10, rh = 34;
  const xc = j => x0 + (j < nInt ? j : j + 1) * cw + cw / 2; // une colonne de plus pour la virgule
  const xq = x0 + (chars.length + 1) * cw + 30;
  let r = 0, q = '', rem = [];
  for (let j = 0; j < chars.length; j++) {
    const p = r * 10 + +chars[j];
    q += Math.floor(p / b); r = p % b; rem.push(r);
  }
  const qi = q.slice(0, nInt).replace(/^0+(?=\d)/, ''), qd = q.slice(nInt);
  const quo = qi + (qd ? ',' + qd : '');
  const W = xq + 130, H = 60 + rem.length * rh + 14;
  let s = '';
  for (let j = 0; j < chars.length; j++) s += tx(xc(j), 36, chars[j], { fs: 26, b: 1, m: 1, c: j >= ip.length + dp.length ? '#adb5bd' : INK });
  s += tx(x0 + nInt * cw + cw / 2, 36, ',', { fs: 28, b: 1, c: RED });
  s += `<line x1="${xq - 22}" y1="12" x2="${xq - 22}" y2="46" stroke="#333" stroke-width="3"/><line x1="${xq - 22}" y1="46" x2="${W - 8}" y2="46" stroke="#333" stroke-width="3"/>`;
  s += tx(xq - 8, 36, b, { fs: 26, b: 1, m: 1, a: 'start' }) + tx(xq - 8, 76, quo, { fs: 26, b: 1, m: 1, a: 'start', c: ACC });
  rem.forEach((v, j) => {
    const y = 36 + (j + 1) * rh + 4;
    const str = String(v), end = xc(j);
    for (let t = 0; t < str.length; t++) s += tx(end - (str.length - 1 - t) * 17, y, str[t], { fs: 24, b: 1, m: 1, c: ACC });
    if (j + 1 < chars.length) s += tx(xc(j + 1), y, chars[j + 1], { fs: 24, b: 1, m: 1, c: j + 1 >= ip.length + dp.length ? '#74c0fc' : BLUE });
  });
  return svg(W, H, `division posée de ${D} par ${b}, quotient ${quo}`, s, `style="max-width:${Math.max(W, 300)}px"`);
}

/** schéma de la multiplication de deux décimaux : produit des entiers, puis virgule placée au bon rang */
export function multSchema(a, b, p) {
  const ka = nd(a), kb = nd(b), A = Math.round(a * 10 ** ka), B = Math.round(b * 10 ** kb), k = ka + kb;
  const pl = (n, kk) => `${kk} chiffre${kk > 1 ? 's' : ''} après la virgule`;
  let s = '';
  s += tx(110, 30, f(a), { fs: 24, b: 1, a: 'end', c: BLUE }) + tx(124, 30, pl(a, ka), { fs: 14, a: 'start', c: BLUE });
  s += tx(110, 64, '× ' + f(b), { fs: 24, b: 1, a: 'end', c: ORG }) + tx(124, 64, pl(b, kb), { fs: 14, a: 'start', c: ORG });
  s += `<line x1="20" y1="76" x2="470" y2="76" stroke="#333" stroke-width="2"/>`;
  s += tx(240, 108, `${A} × ${B} = ${fx(A * B, 0)}`, { fs: 20, b: 1 });
  s += tx(240, 138, `${ka} + ${kb} = ${k} chiffre${k > 1 ? 's' : ''} après la virgule`, { fs: 16, c: ACC, b: 1 });
  s += tx(240, 170, `${f(a)} × ${f(b)} = ${fx(p, nd(p) < k ? k : nd(p))}`, { fs: 22, b: 1, c: ACC });
  return svg(480, 186, `${f(a)} fois ${f(b)}`, s, 'style="max-width:460px"');
}

/** ordre de grandeur : chaque nombre est arrondi, puis on calcule avec les arrondis ; items = [[texte, arrondi]], op, res */
export function approxBoxes(items, op, res, rres = null) {
  const bw = 96, gap = 58, n = items.length, W = 24 + n * bw + (n - 1) * gap + (res !== null ? gap + bw : 0) + 12;
  let s = '';
  items.forEach((it, i) => {
    const x = 12 + i * (bw + gap);
    s += `<rect x="${x}" y="8" width="${bw}" height="40" rx="9" fill="#fff" stroke="#868e96" stroke-width="2"/>` + tx(x + bw / 2, 35, it[0], { fs: 20, b: 1 });
    s += `<path d="M${x + bw / 2},52 v24" stroke="${ORG}" stroke-width="2.5"/><path d="M${x + bw / 2},84 l-6,-10 h12z" fill="${ORG}"/>`;
    s += `<rect x="${x}" y="88" width="${bw}" height="40" rx="9" fill="${ACC2}" stroke="${ACC}" stroke-width="2"/>` + tx(x + bw / 2, 115, it[1], { fs: 20, b: 1, c: ACC });
    if (i < n - 1) s += tx(x + bw + gap / 2, 35, op, { fs: 24, b: 1 }) + tx(x + bw + gap / 2, 115, op, { fs: 24, b: 1, c: ACC });
  });
  if (res !== null) {
    const x = 12 + n * (bw + gap) - gap + gap;
    s += tx(x - gap / 2, 115, '=', { fs: 24, b: 1, c: ACC }) + `<rect x="${x}" y="88" width="${bw}" height="40" rx="9" fill="#fff3bf" stroke="${ACC}" stroke-width="2"/>` + tx(x + bw / 2, 115, res, { fs: 20, b: 1, c: ACC });
    if (rres) s += tx(x + bw / 2, 38, rres, { fs: 13, c: '#868e96' });
  }
  s += tx(12 + bw / 2 + 12, 74, 'on arrondit', { fs: 12, c: ORG, a: 'start' });
  return svg(W, 142, 'ordre de grandeur : on arrondit chaque nombre puis on calcule', s, `style="max-width:${Math.max(W, 300)}px"`);
}

/** barre partagée : total (texte) et segments [{ l, v, c }] (v : valeur, pour les largeurs) ; l = '?' pour l'inconnue */
export function barres(total, segs) {
  const W = 470, x0 = 10, w = W - 20, sum = segs.reduce((t, g) => t + g.v, 0);
  let x = x0, s = '';
  const cols = ['#a5d8ff', '#ffec99', '#b2f2bb', '#ffc9c9'];
  segs.forEach((g, i) => {
    const ww = Math.max(46, g.v / sum * w);
    g.w = ww;
  });
  const tot = segs.reduce((t, g) => t + g.w, 0), sc = w / tot;
  segs.forEach((g, i) => {
    const ww = g.w * sc;
    s += `<rect x="${x.toFixed(1)}" y="44" width="${ww.toFixed(1)}" height="46" fill="${g.l === '?' ? '#fff' : cols[i % cols.length]}" stroke="#333" stroke-width="2" ${g.l === '?' ? 'stroke-dasharray="6 4"' : ''}/>`;
    s += tx((x + ww / 2).toFixed(1), 73, g.l, { fs: 17, b: 1, c: g.l === '?' ? RED : INK });
    x += ww;
  });
  s += `<path d="M${x0},34 h${w}" stroke="#495057" stroke-width="2"/><path d="M${x0},28 v12 M${x0 + w},28 v12" stroke="#495057" stroke-width="2"/>`;
  s += tx(W / 2, 22, total, { fs: 16, b: 1, c: '#495057' });
  return svg(W, 102, 'schéma en barre : ' + total, s, 'style="max-width:460px"');
}

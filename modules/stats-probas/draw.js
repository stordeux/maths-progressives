// Dessins du module « Statistiques et probabilités » : chaînes SVG (pas de DOM, importable par Node).
// Diagrammes en barres et circulaires, listes de valeurs, urnes, dés, roues, jeu de 32 cartes,
// arbres de probabilités, barre des probabilités, tableau des sommes de deux dés.
import { M } from '../../engine/util/fmt.js';

const FONT = 'font-family="system-ui,-apple-system,Segoe UI,Roboto,sans-serif"';
const f1 = x => (Math.round(x * 1000) / 1000).toString();
const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

/** couleurs des boules et des secteurs (lettre affichée dans la boule pour ne pas dépendre de la couleur) */
export const COUL = {
  R: { f: '#e03131', t: '#fff', nom: 'rouge', noms: 'rouges' },
  B: { f: '#1971c2', t: '#fff', nom: 'bleue', noms: 'bleues' },
  V: { f: '#2f9e44', t: '#fff', nom: 'verte', noms: 'vertes' },
  J: { f: '#fcc419', t: '#222', nom: 'jaune', noms: 'jaunes' },
  N: { f: '#343a40', t: '#fff', nom: 'noire', noms: 'noires' },
};
const SECT = ['#63e6be', '#74c0fc', '#ffd43b', '#ffa8a8', '#b197fc', '#ffc078', '#c0eb75'];

/**
 * Diagramme en barres.
 * cats : étiquettes ; vals : effectifs ; grid : pas des lignes ; lab : pas des nombres de l'axe ;
 * meanLine : trait pointillé à cette hauteur (moyenne) ; hl : indices des barres mises en valeur.
 * Chaque barre porte data-k (indice) ; le SVG porte data-u (pixels par unité) : parseBars relit les effectifs.
 */
export function barChart({ cats, vals, grid = 1, lab = 1, yTitle = 'effectif', xTitle = '', meanLine = null, hl = [], width = 460 } = {}) {
  const n = cats.length, W = width, L = 46, R = 12, T = 30, B = xTitle ? 58 : 38, H = 290;
  const top = Math.max(lab, Math.ceil((Math.max(...vals, meanLine || 0) + grid * 0.5) / lab) * lab);
  const ph = H - T - B, pw = W - L - R, u = ph / top, slot = pw / n, bw = Math.min(54, slot * 0.62);
  const y = v => T + ph - v * u;
  let s = `<svg viewBox="0 0 ${W} ${H}" class="vis" style="width:${W}px" data-u="${f1(u)}" role="img" aria-label="diagramme en barres" ${FONT}>`;
  for (let g = 0; g <= top + 1e-9; g += grid) {
    const major = Math.abs(g / lab - Math.round(g / lab)) < 1e-9;
    s += `<line x1="${L}" y1="${f1(y(g))}" x2="${W - R}" y2="${f1(y(g))}" stroke="${major ? '#adb5bd' : '#dee2e6'}" stroke-width="1"/>`;
    if (major) s += `<text x="${L - 7}" y="${f1(y(g) + 5)}" font-size="14" text-anchor="end" fill="#333">${M(g)}</text>`;
  }
  s += `<text x="6" y="16" font-size="14" fill="#555">${esc(yTitle)}</text>`;
  cats.forEach((c, i) => {
    const x = L + slot * i + (slot - bw) / 2, on = hl.includes(i);
    s += `<rect data-k="${i}" x="${f1(x)}" y="${f1(y(vals[i]))}" width="${f1(bw)}" height="${f1(vals[i] * u)}" fill="${on ? '#f08c00' : '#20c997'}" stroke="#087f5b" stroke-width="1.5"/>`;
    s += `<text x="${f1(L + slot * i + slot / 2)}" y="${T + ph + 20}" font-size="${String(c).length > 6 ? 12 : 15}" text-anchor="middle" fill="#222">${esc(c)}</text>`;
  });
  s += `<line x1="${L}" y1="${T + ph}" x2="${W - R}" y2="${T + ph}" stroke="#333" stroke-width="2"/><line x1="${L}" y1="${T - 6}" x2="${L}" y2="${T + ph}" stroke="#333" stroke-width="2"/>`;
  if (xTitle) s += `<text x="${f1(L + pw / 2)}" y="${H - 10}" font-size="14" text-anchor="middle" fill="#555">${esc(xTitle)}</text>`;
  if (meanLine !== null) {
    s += `<line x1="${L}" y1="${f1(y(meanLine))}" x2="${W - R}" y2="${f1(y(meanLine))}" stroke="#d6336c" stroke-width="2.5" stroke-dasharray="8 5"/>`;
    s += `<text x="${W - R - 4}" y="${f1(y(meanLine) - 7)}" font-size="14" font-weight="700" text-anchor="end" fill="#d6336c">moyenne ${M(meanLine)}</text>`;
  }
  return s + '</svg>';
}

/** relit les effectifs dessinés dans un diagramme en barres (vérification indépendante des tests) */
export function parseBars(svg) {
  const u = +(/data-u="([\d.]+)"/.exec(svg) || [])[1];
  const out = [];
  for (const m of svg.matchAll(/<rect data-k="(\d+)"[^>]*height="([\d.]+)"/g)) out[+m[1]] = Math.round(+m[2] / u * 100) / 100;
  return out;
}

/**
 * Diagramme circulaire. parts : [{l, v, txt?}] ; txt = texte sous l'étiquette (par ex. « 90° » ou « ? »).
 * Chaque secteur porte data-deg (angle en degrés).
 */
export function pieChart(parts, { width = 440 } = {}) {
  const W = width, H = 300, cx = W / 2, cy = 150, r = 105, tot = parts.reduce((a, p) => a + p.v, 0);
  let s = `<svg viewBox="0 0 ${W} ${H}" class="vis" style="width:${W}px" role="img" aria-label="diagramme circulaire" ${FONT}>`;
  let a0 = -90, lab = '';
  parts.forEach((p, i) => {
    const deg = p.v / tot * 360, a1 = a0 + deg, t0 = a0 * Math.PI / 180, t1 = a1 * Math.PI / 180;
    const big = deg > 180 ? 1 : 0;
    s += deg >= 359.999
      ? `<circle data-deg="${f1(deg)}" cx="${cx}" cy="${cy}" r="${r}" fill="${SECT[i % SECT.length]}" stroke="#333" stroke-width="2"/>`
      : `<path data-deg="${f1(deg)}" d="M${cx},${cy} L${f1(cx + r * Math.cos(t0))},${f1(cy + r * Math.sin(t0))} A${r},${r} 0 ${big} 1 ${f1(cx + r * Math.cos(t1))},${f1(cy + r * Math.sin(t1))} Z" fill="${SECT[i % SECT.length]}" stroke="#333" stroke-width="2"/>`;
    const tm = (a0 + deg / 2) * Math.PI / 180, c = Math.cos(tm), sn = Math.sin(tm);
    const lx = cx + (r + 12) * c, ly = cy + (r + 12) * sn;
    const anchor = c > 0.25 ? 'start' : c < -0.25 ? 'end' : 'middle';
    const dy = sn < -0.25 ? -16 : sn > 0.25 ? 14 : 0;
    lab += `<text x="${f1(lx)}" y="${f1(ly + dy)}" font-size="15" font-weight="700" text-anchor="${anchor}" fill="#222">${esc(p.l)}</text>`;
    if (p.txt) lab += `<text x="${f1(lx)}" y="${f1(ly + dy + 17)}" font-size="15" text-anchor="${anchor}" fill="${p.txt === '?' ? '#d6336c' : '#333'}" font-weight="${p.txt === '?' ? 700 : 400}">${esc(p.txt)}</text>`;
    a0 = a1;
  });
  return s + lab + '</svg>';
}

/** liste de valeurs dans des cases (hl : indices mis en valeur, en orange) */
export function tiles(list, { hl = [], label = '', cols = 10 } = {}) {
  const n = list.length, c = Math.min(cols, n), rows = Math.ceil(n / c), w = 46, g = 6;
  const W = c * (w + g) + g, H = rows * (w + g) + g + (label ? 24 : 0), oy = label ? 24 : 0;
  let s = `<svg viewBox="0 0 ${W} ${H}" class="vis" style="width:${W}px" role="img" aria-label="liste de valeurs" ${FONT}>`;
  if (label) s += `<text x="${g}" y="16" font-size="14" fill="#555">${esc(label)}</text>`;
  list.forEach((v, i) => {
    const x = g + (i % c) * (w + g), y = oy + g + Math.floor(i / c) * (w + g), on = hl.includes(i), t = typeof v === 'number' ? M(v) : String(v);
    s += `<rect x="${x}" y="${y}" width="${w}" height="${w}" rx="8" fill="${on ? '#ffd8a8' : '#e6fcf5'}" stroke="${on ? '#e8590c' : '#087f5b'}" stroke-width="${on ? 3 : 1.5}"/>`;
    s += `<text x="${x + w / 2}" y="${y + w / 2 + 6}" font-size="${t.length > 3 ? 15 : 18}" font-weight="700" text-anchor="middle" fill="#222">${t}</text>`;
  });
  return s + '</svg>';
}

/** urne : balls = [{c: 'R'|'B'|…, t?: texte}] ; hl : indices entourés */
export function urn(balls, { hl = [], hide = false } = {}) {
  const n = balls.length, per = n <= 8 ? 4 : n <= 15 ? 5 : 6, rows = Math.ceil(n / per), rr = 17, g = 6;
  const iw = per * (2 * rr + g) + g, W = iw + 40, H = rows * (2 * rr + g) + 46;
  let s = `<svg viewBox="0 0 ${W} ${H}" class="vis" style="width:${Math.max(200, W)}px" role="img" aria-label="urne contenant ${n} boules" ${FONT}>`;
  s += `<path d="M10,8 L10,${H - 22} Q10,${H - 4} 30,${H - 4} L${W - 30},${H - 4} Q${W - 10},${H - 4} ${W - 10},${H - 22} L${W - 10},8" fill="#f1f3f5" stroke="#495057" stroke-width="3"/>`;
  balls.forEach((b, i) => {
    const row = Math.floor(i / per), inRow = Math.min(per, n - row * per), off = (per - inRow) * (rr + g / 2);
    const x = 20 + g + off + (i % per) * (2 * rr + g) + rr, y = H - 12 - rr - row * (2 * rr + g) - 4;
    const c = hide ? { f: '#adb5bd', t: '#fff' } : COUL[b.c];
    s += `<circle cx="${f1(x)}" cy="${f1(y)}" r="${rr}" fill="${c.f}" stroke="${hl.includes(i) ? '#e8590c' : '#212529'}" stroke-width="${hl.includes(i) ? 4 : 1.5}"/>`;
    s += `<text x="${f1(x)}" y="${f1(y + 6)}" font-size="16" font-weight="700" text-anchor="middle" fill="${c.t}">${esc(hide ? '?' : b.t !== undefined ? b.t : b.c)}</text>`;
  });
  return s + '</svg>';
}

const PIPS = { 1: [[1, 1]], 2: [[0, 0], [2, 2]], 3: [[0, 0], [1, 1], [2, 2]], 4: [[0, 0], [2, 0], [0, 2], [2, 2]], 5: [[0, 0], [2, 0], [1, 1], [0, 2], [2, 2]], 6: [[0, 0], [2, 0], [0, 1], [2, 1], [0, 2], [2, 2]] };
function dieAt(x, y, k, sz, on) {
  let s = `<rect x="${x}" y="${y}" width="${sz}" height="${sz}" rx="${sz / 6}" fill="${on ? '#ffd8a8' : '#fff'}" stroke="${on ? '#e8590c' : '#212529'}" stroke-width="${on ? 3.5 : 2}"/>`;
  for (const [i, j] of PIPS[k]) s += `<circle cx="${f1(x + sz * (0.25 + 0.25 * i))}" cy="${f1(y + sz * (0.25 + 0.25 * j))}" r="${f1(sz / 11)}" fill="#212529"/>`;
  return s;
}
/** faces d'un dé à 6 faces (1 à 6), hl : faces mises en valeur */
export function dieFaces({ hl = [], faces = [1, 2, 3, 4, 5, 6] } = {}) {
  const sz = 50, g = 12, W = faces.length * (sz + g) + g, H = sz + 2 * g;
  let s = `<svg viewBox="0 0 ${W} ${H}" class="vis" style="width:${W}px" role="img" aria-label="faces d'un dé" ${FONT}>`;
  faces.forEach((k, i) => { s += dieAt(g + i * (sz + g), g, k, sz, hl.includes(k)); });
  return s + '</svg>';
}

/** roue de loterie à n secteurs égaux numérotés de 1 à n, avec une flèche */
export function spinner(n, { hl = [] } = {}) {
  const W = 250, cx = 125, cy = 130, r = 100;
  let s = `<svg viewBox="0 0 ${W} 250" class="vis" style="width:${W}px" role="img" aria-label="roue partagée en ${n} secteurs égaux" ${FONT}>`;
  for (let i = 0; i < n; i++) {
    const t0 = (i / n * 360 - 90) * Math.PI / 180, t1 = ((i + 1) / n * 360 - 90) * Math.PI / 180, tm = (t0 + t1) / 2;
    const on = hl.includes(i + 1);
    s += `<path d="M${cx},${cy} L${f1(cx + r * Math.cos(t0))},${f1(cy + r * Math.sin(t0))} A${r},${r} 0 0 1 ${f1(cx + r * Math.cos(t1))},${f1(cy + r * Math.sin(t1))} Z" fill="${on ? '#ffa94d' : SECT[i % 2 ? 0 : 1]}" stroke="#333" stroke-width="1.5"/>`;
    s += `<text x="${f1(cx + r * 0.72 * Math.cos(tm))}" y="${f1(cy + r * 0.72 * Math.sin(tm) + 6)}" font-size="16" font-weight="700" text-anchor="middle" fill="#222">${i + 1}</text>`;
  }
  return s + `<circle cx="${cx}" cy="${cy}" r="7" fill="#333"/><path d="M${cx},${cy - r - 4} l-9,-20 h18 z" fill="#d6336c" stroke="#333"/></svg>`;
}

/** faces numérotées d'un dé à n faces (ou boules numérotées) sous forme de cases */
export const numberFaces = (n, { hl = [] } = {}) => tiles([...Array(n)].map((_, i) => i + 1), { hl: hl.map(k => k - 1), cols: n > 12 ? 10 : n });

export const RANGS = ['7', '8', '9', '10', 'V', 'D', 'R', 'A'];
export const COULEURS = [{ s: '♠', n: 'pique', rouge: false }, { s: '♥', n: 'cœur', rouge: true }, { s: '♦', n: 'carreau', rouge: true }, { s: '♣', n: 'trèfle', rouge: false }];
/** jeu de 32 cartes en grille (une ligne par couleur), hl(carte) → mise en valeur */
export function cards32(hl = () => false) {
  const w = 42, h = 52, g = 6, W = 8 * (w + g) + g, H = 4 * (h + g) + g;
  let s = `<svg viewBox="0 0 ${W} ${H}" class="vis" style="width:${W}px" role="img" aria-label="jeu de 32 cartes" ${FONT}>`;
  COULEURS.forEach((c, j) => RANGS.forEach((r, i) => {
    const x = g + i * (w + g), y = g + j * (h + g), on = hl({ r, s: c.n, rouge: c.rouge }), col = c.rouge ? '#c92a2a' : '#212529';
    s += `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="6" fill="${on ? '#ffd8a8' : '#fff'}" stroke="${on ? '#e8590c' : '#868e96'}" stroke-width="${on ? 3 : 1.5}"/>`;
    s += `<text x="${x + w / 2}" y="${y + 21}" font-size="16" font-weight="700" text-anchor="middle" fill="${col}">${r}</text><text x="${x + w / 2}" y="${y + 43}" font-size="18" text-anchor="middle" fill="${col}">${c.s}</text>`;
  }));
  return s + '</svg>';
}

/** fraction empilée dans un SVG, sur fond blanc ; p = [n, d], un nombre, ou '?' */
function fracSvg(x, y, p, col = '#1864ab') {
  if (!Array.isArray(p)) {
    const t = typeof p === 'number' ? M(p) : String(p);
    return `<rect x="${f1(x - 14)}" y="${f1(y - 14)}" width="28" height="26" rx="5" fill="#fff"/><text x="${f1(x)}" y="${f1(y + 6)}" font-size="17" font-weight="700" text-anchor="middle" fill="${p === '?' ? '#d6336c' : col}">${t}</text>`;
  }
  const [n, d] = p, wd = Math.max(String(n).length, String(d).length) * 10 + 10;
  return `<rect x="${f1(x - wd / 2 - 2)}" y="${f1(y - 21)}" width="${f1(wd + 4)}" height="42" rx="5" fill="#fff"/>`
    + `<text x="${f1(x)}" y="${f1(y - 4)}" font-size="16" font-weight="700" text-anchor="middle" fill="${col}">${n}</text>`
    + `<line x1="${f1(x - wd / 2)}" y1="${f1(y)}" x2="${f1(x + wd / 2)}" y2="${f1(y)}" stroke="${col}" stroke-width="2"/>`
    + `<text x="${f1(x)}" y="${f1(y + 16)}" font-size="16" font-weight="700" text-anchor="middle" fill="${col}">${d}</text>`;
}

/**
 * Arbre de probabilités à deux épreuves.
 * a : [{l, p}] (1re épreuve) ; b : [[{l, p}], …] (2e épreuve, une liste par branche de la 1re) ;
 * p = [n, d], un nombre ou '?' ; hl : chemins mis en valeur ['RB', …] ; issues : afficher les issues en bout de branche.
 */
export function tree(a, b, { hl = [], issues = true } = {}) {
  const leaves = b.reduce((s, x) => s + x.length, 0), rowH = 66, H = leaves * rowH + 16, W = 460;
  const x0 = 18, x1 = 190, x2 = 360;
  let s = `<svg viewBox="0 0 ${W} ${H}" class="vis" style="width:${W}px" role="img" aria-label="arbre de probabilités" ${FONT}>`;
  let k = 0, lines = '', labels = '';
  const y0 = H / 2;
  a.forEach((A, i) => {
    const ys = b[i].map((_, j) => 8 + rowH * (k + j) + rowH / 2), y1 = (ys[0] + ys[ys.length - 1]) / 2;
    const onA = hl.some(h => h[0] === A.l);
    lines += `<line x1="${x0 + 6}" y1="${f1(y0)}" x2="${x1 - 16}" y2="${f1(y1)}" stroke="${onA ? '#e8590c' : '#495057'}" stroke-width="${onA ? 4 : 2}"/>`;
    labels += fracSvg((x0 + x1) / 2 - 4, (y0 + y1) / 2 + (y1 < y0 ? -16 : y1 > y0 ? 16 : 0), A.p);
    labels += `<circle cx="${x1}" cy="${f1(y1)}" r="15" fill="${COUL[A.l] ? COUL[A.l].f : '#fff'}" stroke="#212529"/><text x="${x1}" y="${f1(y1 + 6)}" font-size="16" font-weight="700" text-anchor="middle" fill="${COUL[A.l] ? COUL[A.l].t : '#222'}">${esc(A.l)}</text>`;
    b[i].forEach((Bj, j) => {
      const on = hl.includes(A.l + Bj.l);
      lines += `<line x1="${x1 + 16}" y1="${f1(y1)}" x2="${x2 - 16}" y2="${f1(ys[j])}" stroke="${on ? '#e8590c' : '#495057'}" stroke-width="${on ? 4 : 2}"/>`;
      labels += fracSvg(x1 + 0.6 * (x2 - x1), y1 + 0.6 * (ys[j] - y1) + (ys[j] < y1 ? -14 : ys[j] > y1 ? 14 : 0), Bj.p);
      labels += `<circle cx="${x2}" cy="${f1(ys[j])}" r="15" fill="${COUL[Bj.l] ? COUL[Bj.l].f : '#fff'}" stroke="#212529"/><text x="${x2}" y="${f1(ys[j] + 6)}" font-size="16" font-weight="700" text-anchor="middle" fill="${COUL[Bj.l] ? COUL[Bj.l].t : '#222'}">${esc(Bj.l)}</text>`;
      if (issues) labels += `<text x="${x2 + 24}" y="${f1(ys[j] + 6)}" font-size="15" fill="${on ? '#e8590c' : '#555'}" font-weight="${on ? 700 : 400}">(${esc(A.l)} ; ${esc(Bj.l)})</text>`;
    });
    k += b[i].length;
  });
  s += lines + `<circle cx="${x0}" cy="${f1(y0)}" r="6" fill="#212529"/>` + labels;
  return s + '</svg>';
}

/** barre des probabilités de 0 à 1 partagée en parts : [{l, v (nombre), txt}] */
export function probaBar(parts) {
  const W = 460, x0 = 20, w = W - 40, y = 30, h = 46, H = 128;
  let s = `<svg viewBox="0 0 ${W} ${H}" class="vis" style="width:${W}px" role="img" aria-label="barre des probabilités" ${FONT}>`;
  let x = x0;
  parts.forEach((p, i) => {
    const pw = p.v * w;
    s += `<rect x="${f1(x)}" y="${y}" width="${f1(pw)}" height="${h}" fill="${p.txt === '?' ? '#f1f3f5' : SECT[i % SECT.length]}" stroke="#333" stroke-width="1.5"/>`;
    s += `<text x="${f1(x + pw / 2)}" y="${y + 29}" font-size="15" font-weight="700" text-anchor="middle" fill="#222">${esc(p.l)}</text>`;
    s += `<text x="${f1(x + pw / 2)}" y="${y + h + 24}" font-size="16" font-weight="700" text-anchor="middle" fill="${p.txt === '?' ? '#d6336c' : '#333'}">${esc(p.txt)}</text>`;
    x += pw;
  });
  s += `<text x="${x0}" y="20" font-size="14" text-anchor="middle" fill="#555">0</text><text x="${x0 + w}" y="20" font-size="14" text-anchor="middle" fill="#555">1</text>`;
  return s + '</svg>';
}

/** deux dés (faces a et b) */
export function twoDice(a, b) {
  const sz = 56, W = 160, H = 80;
  return `<svg viewBox="0 0 ${W} ${H}" class="vis" style="width:${W}px" role="img" aria-label="deux dés" ${FONT}>${dieAt(12, 12, a, sz, false)}${dieAt(92, 12, b, sz, false)}</svg>`;
}

/** tableau 6 × 6 des sommes de deux dés, sommes égales à s mises en valeur */
export function sumTable(target) {
  const c = 40, W = 7 * c + 4, H = 7 * c + 4;
  let s = `<svg viewBox="0 0 ${W} ${H}" class="vis" style="width:${W}px" role="img" aria-label="tableau des 36 issues de deux dés" ${FONT}>`;
  for (let i = 0; i <= 6; i++) for (let j = 0; j <= 6; j++) {
    const x = 2 + j * c, y = 2 + i * c, head = i === 0 || j === 0, v = i + j, on = !head && v === target;
    s += `<rect x="${x}" y="${y}" width="${c}" height="${c}" fill="${head ? '#e6fcf5' : on ? '#ffd8a8' : '#fff'}" stroke="#868e96"/>`;
    const t = i === 0 && j === 0 ? '+' : i === 0 ? j : j === 0 ? i : v;
    s += `<text x="${x + c / 2}" y="${y + c / 2 + 6}" font-size="16" font-weight="${head || on ? 700 : 400}" text-anchor="middle" fill="${on ? '#d9480f' : '#222'}">${t}</text>`;
  }
  return s + '</svg>';
}

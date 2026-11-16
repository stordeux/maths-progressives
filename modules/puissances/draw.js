// Dessins du module Puissances (chaînes SVG, sans DOM : importé aussi par Node pour les tests).
import { M } from '../../engine/util/fmt.js';

const SUP = { '−': '⁻', '-': '⁻', 0: '⁰', 1: '¹', 2: '²', 3: '³', 4: '⁴', 5: '⁵', 6: '⁶', 7: '⁷', 8: '⁸', 9: '⁹' };
/** exposant en caractères Unicode (pour le texte des SVG) : U(-3) = "⁻³" */
export const U = n => M(n).split('').map(c => SUP[c] ?? c).join('');
const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

/**
 * Bulles de facteurs : rows = [{ groups: [{ n, t, c }], cross }] ; une ligne par rangée.
 * cross = nombre de bulles barrées en début de rangée (simplification d'un quotient).
 * bar : trait de fraction entre la 1re et la 2e rangée. caption : texte sous le dessin.
 */
export function bulles(rows, { bar = false, caption = '' } = {}) {
  const r = 17, step = 40, gg = 16;
  const widths = rows.map(row => row.groups.reduce((s, g) => s + g.n * step, 0) + gg * (row.groups.length - 1));
  const W = Math.max(260, ...widths) + 20, rowH = 50;
  const H = rows.length * rowH + (caption ? 34 : 6) + (bar ? 10 : 0);
  let s = `<svg viewBox="0 0 ${W} ${H}" class="vis" style="width:${Math.min(W, 520)}px" role="img" aria-label="${esc(caption || 'facteurs')}">`;
  rows.forEach((row, ri) => {
    let x = (W - widths[ri]) / 2 + step / 2;
    const y = 26 + ri * rowH + (bar && ri > 0 ? 10 : 0);
    let k = 0;
    row.groups.forEach((g, gi) => {
      if (gi) x += gg;
      const x0 = x - step / 2 + 2;
      for (let i = 0; i < g.n; i++, k++) {
        s += `<circle cx="${x}" cy="${y}" r="${r}" fill="${g.c || '#d0bfff'}" stroke="#5f3dc4" stroke-width="2"/><text x="${x}" y="${y + 6}" text-anchor="middle" font-size="16" font-weight="700" fill="#212529">${esc(g.t)}</text>`;
        if (k < (row.cross || 0)) s += `<line x1="${x - 15}" y1="${y + 15}" x2="${x + 15}" y2="${y - 15}" stroke="#e03131" stroke-width="3"/>`;
        x += step;
      }
      if (row.groups.length > 1) s += `<rect x="${x0}" y="${y - r - 4}" width="${x - step / 2 - 2 - x0}" height="${2 * r + 8}" rx="12" fill="none" stroke="#868e96" stroke-width="1.5" stroke-dasharray="4 3"/>`;
    });
  });
  if (bar) s += `<line x1="10" y1="${rowH + 4}" x2="${W - 10}" y2="${rowH + 4}" stroke="#212529" stroke-width="2.5"/>`;
  if (caption) s += `<text x="${W / 2}" y="${H - 10}" text-anchor="middle" font-size="16" fill="#495057">${esc(caption)}</text>`;
  return s + '</svg>';
}

/**
 * Chaîne de multiplications répétées : items = [{ top, val }], ops = libellés des flèches (« × 2 »).
 * Retour à la ligne toutes les « per » cases (5 par défaut).
 */
export function chaine(items, ops, caption = '', per = 5) {
  const bw = 78, bh = 56, gap = 46, n = items.length, nr = Math.ceil(n / per);
  const W = Math.min(n, per) * bw + (Math.min(n, per) - 1) * gap + 20, H = nr * (bh + 40) + (caption ? 26 : 0);
  let s = `<svg viewBox="0 0 ${W} ${H}" class="vis" style="width:${Math.min(W, 520)}px" role="img" aria-label="${esc(caption || 'multiplications répétées')}">`;
  const pos = i => ({ x: 10 + (i % per) * (bw + gap), y: 22 + Math.floor(i / per) * (bh + 40) });
  items.forEach((it, i) => {
    const { x, y } = pos(i);
    s += `<rect x="${x}" y="${y}" width="${bw}" height="${bh}" rx="10" fill="${it.c || '#f3f0ff'}" stroke="#6741d9" stroke-width="2"/>`;
    s += `<text x="${x + bw / 2}" y="${y + 22}" text-anchor="middle" font-size="16" fill="#5f3dc4">${esc(it.top)}</text>`;
    s += `<text x="${x + bw / 2}" y="${y + 46}" text-anchor="middle" font-size="${String(it.val).length > 7 ? 13 : 17}" font-weight="700" fill="#212529">${esc(it.val)}</text>`;
    if (i < n - 1) {
      const q = pos(i + 1);
      if (q.y === y) {
        s += `<line x1="${x + bw + 3}" y1="${y + bh / 2}" x2="${q.x - 6}" y2="${y + bh / 2}" stroke="#495057" stroke-width="2"/><path d="M${q.x - 3},${y + bh / 2} l-8,-5 v10 z" fill="#495057"/>`;
        s += `<text x="${x + bw + gap / 2}" y="${y + bh / 2 - 8}" text-anchor="middle" font-size="13" font-weight="700" fill="#c2255c">${esc(ops[i])}</text>`;
      } else {
        s += `<path d="M${x + bw / 2},${y + bh + 2} C${x + bw / 2},${y + bh + 30} ${q.x + bw / 2},${q.y - 34} ${q.x + bw / 2},${q.y - 6}" fill="none" stroke="#495057" stroke-width="2"/><path d="M${q.x + bw / 2},${q.y - 2} l-5,-8 h10 z" fill="#495057"/>`;
        s += `<text x="${x + bw / 2 - 8}" y="${y + bh + 18}" text-anchor="end" font-size="13" font-weight="700" fill="#c2255c">${esc(ops[i])}</text>`;
      }
    }
  });
  if (caption) s += `<text x="${W / 2}" y="${H - 8}" text-anchor="middle" font-size="15" fill="#495057">${esc(caption)}</text>`;
  return s + '</svg>';
}

/**
 * Tableau de numération dont les colonnes sont des puissances de 10 (10^hi … 10^lo).
 * rows = [{ s: '345.6', l: 'libellé', c: couleur }] (s : écriture décimale avec un point).
 * note : texte sous le tableau.
 */
export function numeration(rows, { hi, lo, note = '' }) {
  const cw = 46, lw = 96, rh = 38, top = 34, nc = hi - lo + 1;
  const W = lw + nc * cw + 4, H = top + rows.length * rh + (note ? 34 : 8);
  const X = k => lw + (hi - k) * cw; // bord gauche de la colonne 10^k
  let s = `<svg viewBox="0 0 ${W} ${H}" class="vis" style="width:${Math.min(W, 560)}px" role="img" aria-label="tableau de numération">`;
  for (let k = hi; k >= lo; k--) {
    s += `<rect x="${X(k)}" y="2" width="${cw}" height="${top - 4}" fill="${k >= 0 ? '#e5dbff' : '#fff3bf'}" stroke="#adb5bd"/><text x="${X(k) + cw / 2}" y="${top - 10}" text-anchor="middle" font-size="15" fill="#343a40">10${U(k)}</text>`;
  }
  rows.forEach((r, i) => {
    const y = top + i * rh;
    s += `<text x="${lw - 8}" y="${y + rh / 2 + 6}" text-anchor="end" font-size="15" fill="#495057">${esc(r.l || '')}</text>`;
    for (let k = hi; k >= lo; k--) s += `<rect x="${X(k)}" y="${y}" width="${cw}" height="${rh}" fill="#fff" stroke="#dee2e6"/>`;
    const [ip, fp = ''] = r.s.split('.');
    [...ip].forEach((ch, j) => { const k = ip.length - 1 - j; if (k <= hi) s += `<text x="${X(k) + cw / 2}" y="${y + rh / 2 + 7}" text-anchor="middle" font-size="20" font-weight="700" fill="${r.c || '#212529'}">${ch}</text>`; });
    [...fp].forEach((ch, j) => { const k = -1 - j; if (k >= lo) s += `<text x="${X(k) + cw / 2}" y="${y + rh / 2 + 7}" text-anchor="middle" font-size="20" font-weight="700" fill="${r.c || '#212529'}">${ch}</text>`; });
  });
  if (lo < 0 && hi >= 0) s += `<line x1="${X(-1)}" y1="2" x2="${X(-1)}" y2="${top + rows.length * rh}" stroke="#e03131" stroke-width="3"/>`;
  if (note) s += `<text x="${W / 2}" y="${H - 10}" text-anchor="middle" font-size="15" fill="#495057">${esc(note)}</text>`;
  return s + '</svg>';
}

/**
 * Glissement de la virgule vers l'écriture scientifique.
 * raw : écriture décimale avec un point ('45000' ou '0.0045'). La virgule part de sa place
 * et va juste après le premier chiffre non nul.
 */
export function virgule(raw) {
  const [ip, fp = ''] = raw.split('.');
  const digits = ip + fp, old = ip.length, f = digits.search(/[1-9]/), nw = f + 1, n = old - nw;
  const last = digits.search(/0*$/) - 1; // dernier chiffre non nul
  const cw = 30, W = Math.max(digits.length * cw + 60, 240), x0 = (W - digits.length * cw) / 2, y = 78;
  const cx = p => x0 + p * cw; // abscisse de la frontière après p chiffres
  let s = `<svg viewBox="0 0 ${W} 112" class="vis" style="width:${Math.min(W * 1.25, 480)}px" role="img" aria-label="la virgule se déplace de ${Math.abs(n)} rangs">`;
  [...digits].forEach((ch, i) => { s += `<text x="${cx(i) + cw / 2}" y="${y}" text-anchor="middle" font-size="24" font-weight="700" fill="${i >= f && i <= last ? '#212529' : '#868e96'}">${ch}</text>`; });
  s += `<text x="${cx(old)}" y="${y + 6}" text-anchor="middle" font-size="26" font-weight="700" fill="#adb5bd">,</text>`;
  s += `<text x="${cx(nw)}" y="${y + 6}" text-anchor="middle" font-size="26" font-weight="700" fill="#e03131">,</text>`;
  if (n !== 0) {
    const a = cx(old), b = cx(nw), h = Math.min(44, 16 + Math.abs(n) * 5);
    s += `<path d="M${a},${y - 24} C${a},${y - 24 - h} ${b},${y - 24 - h} ${b},${y - 28}" fill="none" stroke="#e03131" stroke-width="2.5"/><path d="M${b},${y - 24} l-5,-9 h10 z" fill="#e03131"/>`;
    s += `<text x="${(a + b) / 2}" y="${y - 30 - h * .75}" text-anchor="middle" font-size="15" font-weight="700" fill="#c92a2a">${Math.abs(n)} rang${Math.abs(n) > 1 ? 's' : ''} vers la ${n > 0 ? 'gauche' : 'droite'}</text>`;
  }
  s += `<text x="${W / 2}" y="106" text-anchor="middle" font-size="15" fill="#495057">${n > 0 ? 'nombre ≥ 10 : exposant positif' : n < 0 ? 'nombre < 1 : exposant négatif' : 'déjà entre 1 et 10 : exposant 0'}</text>`;
  return s + '</svg>';
}

/**
 * Le piège −a^n face à (−a)^n : on souligne ce que touche l'exposant.
 */
export function piege(a, n) {
  const pa = Math.pow(a, n), W = 520, fs = 34, cw = 20.5;
  let s = `<svg viewBox="0 0 ${W} 150" class="vis" style="width:520px" role="img" aria-label="−${a}${U(n)} et (−${a})${U(n)}">`;
  const expr = (x, parts) => { // parts = [{t, sup}] ; renvoie {svg, xs: positions}
    let out = '', cx = x; const xs = [];
    parts.forEach(p => { xs.push(cx); out += `<text x="${cx}" y="56" font-size="${p.sup ? 20 : fs}" ${p.sup ? 'dy="-16"' : ''} font-family="monospace" font-weight="700" fill="#212529">${esc(p.t)}</text>`; cx += p.sup ? cw * .62 * p.t.length : cw * p.t.length; });
    xs.push(cx); return { out, xs };
  };
  const as = String(a), ns = String(n);
  const L = expr(40, [{ t: '−' }, { t: as }, { t: ns, sup: true }]);
  const R = expr(300, [{ t: '(' }, { t: '−' }, { t: as }, { t: ')' }, { t: ns, sup: true }]);
  s += L.out + R.out;
  s += `<line x1="${L.xs[1]}" y1="68" x2="${L.xs[3]}" y2="68" stroke="#e03131" stroke-width="3"/>`;
  s += `<line x1="${R.xs[0]}" y1="68" x2="${R.xs[5]}" y2="68" stroke="#2b8a3e" stroke-width="3"/>`;
  s += `<text x="40" y="94" font-size="15" fill="#c92a2a">l'exposant porte sur ${as} seul</text>`;
  s += `<text x="300" y="94" font-size="15" fill="#2b8a3e">l'exposant porte sur (−${as})</text>`;
  s += `<text x="40" y="128" font-size="17" font-weight="700" fill="#212529">= −(${as}${U(n)}) = ${M(-pa)}</text>`;
  s += `<text x="300" y="128" font-size="17" font-weight="700" fill="#212529">= ${M(Math.pow(-a, n))}</text>`;
  s += `<line x1="260" y1="16" x2="260" y2="136" stroke="#dee2e6" stroke-width="2"/>`;
  return s + '</svg>';
}

/**
 * Échelle des préfixes : items = [{ t: 'kilo', v: '10³' }] régulièrement espacés sur une flèche,
 * avec le facteur « step » écrit entre deux graduations.
 */
export function echelle(items, step = '× 10³', caption = '') {
  const n = items.length, gap = 64, W = (n - 1) * gap + 60, y = 58, H = caption ? 118 : 94;
  let s = `<svg viewBox="0 0 ${W} ${H}" class="vis" style="width:${W}px" role="img" aria-label="${esc(caption || 'échelle des préfixes')}">`;
  s += `<line x1="8" y1="${y}" x2="${W - 12}" y2="${y}" stroke="#495057" stroke-width="2.5"/><path d="M${W - 4},${y} l-11,-6 v12 z" fill="#495057"/>`;
  items.forEach((it, i) => {
    const x = 26 + i * gap;
    s += `<line x1="${x}" y1="${y - 8}" x2="${x}" y2="${y + 8}" stroke="#495057" stroke-width="2.5"/>`;
    s += `<text x="${x}" y="${y - 13}" text-anchor="middle" font-size="15" fill="#5f3dc4">${esc(it.t)}</text>`;
    s += `<text x="${x}" y="${y + 28}" text-anchor="middle" font-size="16" font-weight="700" fill="#212529">${esc(it.v)}</text>`;
    if (i < n - 1) s += `<text x="${x + gap / 2}" y="${y - 36}" text-anchor="middle" font-size="12" font-weight="700" fill="#c2255c">${esc(step)}</text>`;
  });
  if (caption) s += `<text x="${W / 2}" y="${H - 8}" text-anchor="middle" font-size="15" fill="#495057">${esc(caption)}</text>`;
  return s + '</svg>';
}

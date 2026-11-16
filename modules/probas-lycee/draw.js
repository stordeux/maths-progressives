// Dessins du module « Probabilités conditionnelles » (chaînes SVG ou HTML, sans DOM : importable par Node).
// Tableau croisé d'effectifs, arbre pondéré (2 ou 3 étages), diagramme en bâtons d'une loi de probabilité.
import { M } from '../../engine/util/fmt.js';

const FONT = 'font-family="system-ui,-apple-system,Segoe UI,Roboto,sans-serif"';
const f1 = x => (Math.round(x * 10) / 10).toString();
const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const HL = '#e8590c', INK = '#495057', BLUE = '#1864ab', ROSE = '#d6336c';

/** événement dans un SVG : 'A' ou '!A' (contraire, surligné) */
const svgEv = e => (e[0] === '!' ? `<tspan text-decoration="overline" style="text-decoration:overline">${esc(e.slice(1))}</tspan>` : esc(e));
/** largeur approximative d'un texte (pour les fonds blancs) */
const tw = (s, fs) => String(s).length * fs * 0.6;

/**
 * Tableau croisé d'effectifs (HTML, classe table.data).
 * rows, cols : étiquettes HTML ; cells : effectifs [ligne][colonne] ; tot : afficher les totaux ;
 * hl : cases mises en valeur [[i, j], …] (i = 2 : ligne Total, j = nombre de colonnes : colonne Total).
 */
export function crossTable({ rows, cols, cells, tot = true, hl = [] }) {
  const nc = cols.length, on = (i, j) => hl.some(h => h[0] === i && h[1] === j);
  const td = (v, i, j, b) => `<td${on(i, j) ? ' style="background:#ffd8a8;font-weight:700;color:#c2410c"' : b ? ' style="font-weight:700"' : ''}>${v}</td>`;
  const R = cells.map(r => r.reduce((s, x) => s + x, 0)), C = cols.map((_, j) => cells[0][j] + cells[1][j]), N = R[0] + R[1];
  let s = `<div class="tablewrap"><table class="data"><tr><th></th>${cols.map(c => `<th>${c}</th>`).join('')}${tot ? '<th>Total</th>' : ''}</tr>`;
  rows.forEach((r, i) => { s += `<tr><th>${r}</th>${cells[i].map((v, j) => td(v, i, j)).join('')}${tot ? td(R[i], i, nc, true) : ''}</tr>`; });
  if (tot) s += `<tr><th>Total</th>${C.map((v, j) => td(v, 2, j, true)).join('')}${td(N, 2, nc, true)}</tr>`;
  return s + '</table></div>';
}

/**
 * Arbre pondéré.
 * kids = [{ e: 'A', p: '0,4', kids: [{ e: 'B', p: '0,3' }, …] }, …] ; e : événement ('!A' = contraire) ;
 * p : texte de la branche ('?' écrit en rose). Chemins repérés par les indices des branches : '01' = 1re puis 2e branche.
 * o.hl : chemins mis en valeur ; o.leaf : 'cap' (A ∩ B), 'seq' (S S̄ S) ou false ; o.vals : { chemin: texte } ajouté en bout.
 */
export function ptree(kids, { hl = [], leaf = 'cap', vals = {} } = {}) {
  const leaves = [];
  const walk = (nodes, path, evs) => nodes.forEach((n, i) => {
    n._p = path + i; n._e = [...evs, n.e];
    if (n.kids) walk(n.kids, n._p, n._e); else leaves.push(n);
  });
  walk(kids, '', []);
  const depth = Math.max(...leaves.map(n => n._p.length));
  const rowH = depth >= 3 ? 54 : 72, top = 10, dx = depth >= 3 ? 136 : 180;
  const X = k => 20 + k * dx;
  leaves.forEach((n, i) => { n._y = top + rowH * i + rowH / 2; });
  const yOf = n => (n.kids ? (yOf(n.kids[0]) + yOf(n.kids[n.kids.length - 1])) / 2 : n._y);
  const leafW = leaf ? Math.max(120, ...leaves.map(n => tw(leafText(n, leaf), 16) + tw(vals[n._p] || '', 16) + 16)) : 10;
  const W = Math.round(X(depth) + 26 + leafW), H = Math.round(top * 2 + rowH * leaves.length);
  const y0 = H / 2;
  let lines = '', labs = '';
  const draw = (nodes, k, yp) => nodes.forEach(n => {
    const y = yOf(n), x1 = X(k) + (k ? 16 : 6), x2 = X(k + 1) - 16, on = hl.some(h => h.startsWith(n._p));
    lines += `<line x1="${f1(x1)}" y1="${f1(yp)}" x2="${f1(x2)}" y2="${f1(y)}" stroke="${on ? HL : INK}" stroke-width="${on ? 4 : 2}" stroke-linecap="round"/>`;
    // probabilité au milieu de la branche, sur fond blanc
    const mx = x1 + 0.58 * (x2 - x1), my = yp + 0.58 * (y - yp), t = String(n.p), w = tw(t, 16) + 10, q = t === '?';
    labs += `<rect x="${f1(mx - w / 2)}" y="${f1(my - 13)}" width="${f1(w)}" height="25" rx="6" fill="#fff" stroke="${q ? ROSE : '#ced4da'}" stroke-width="${q ? 2 : 1}"/>`
      + `<text x="${f1(mx)}" y="${f1(my + 6)}" font-size="16" font-weight="700" text-anchor="middle" fill="${q ? ROSE : BLUE}">${esc(t)}</text>`;
    // nom de l'événement au bout de la branche
    labs += `<text x="${f1(X(k + 1))}" y="${f1(y + 7)}" font-size="20" font-weight="700" text-anchor="middle" fill="${on ? HL : '#212529'}">${svgEv(n.e)}</text>`;
    if (n.kids) draw(n.kids, k + 1, y);
    else if (leaf) {
      const v = vals[n._p] ? ` ${esc(vals[n._p])}` : '';
      labs += `<text x="${f1(X(depth) + 26)}" y="${f1(y + 6)}" font-size="16" fill="${on ? HL : '#555'}" font-weight="${on ? 700 : 400}">${leafSvg(n, leaf)}${v}</text>`;
    }
  });
  draw(kids, 0, y0);
  // arbre à 3 étages : hauteur bornée aussi par celle de l'écran (tablette en largeur : 800 px de haut), pour que
  // la zone de réponse reste visible sous la figure sans faire défiler
  return `<svg viewBox="0 0 ${W} ${H}" class="vis" style="width:${W}px${depth >= 3 ? ";max-height:min(400px,44vh)" : ""}" role="img" aria-label="arbre pondéré" ${FONT}>${lines}<circle cx="20" cy="${f1(y0)}" r="5" fill="#212529"/>${labs}</svg>`;
}
const leafText = (n, mode) => (mode === 'seq' ? n._e.join(' ') : n._e.join(' ∩ ')).replace(/!/g, '');
const leafSvg = (n, mode) => n._e.map(svgEv).join(mode === 'seq' ? ' ' : ' ∩ ');

/**
 * Diagramme en bâtons d'une loi de probabilité.
 * xs : valeurs ; ps : probabilités ; hl : indices mis en valeur ; show : écrire les probabilités au-dessus ;
 * unk : indice d'une probabilité inconnue (bâton en pointillés, « ? ») ; xTitle : nom de la variable.
 */
export function lawChart({ xs, ps, hl = [], show = false, unk = -1, xTitle = 'k', yTitle = 'probabilité' }) {
  const n = xs.length, W = 460, L = 50, R = 16, T = 30, B = 46, H = 270;
  const mx = Math.max(...ps.map((p, i) => (i === unk ? 0.1 : p)));
  const step = mx > 0.35 ? 0.1 : 0.05, topV = Math.max(step * 2, Math.ceil(mx / step - 1e-9) * step + (show ? step : 0));
  const ph = H - T - B, pw = W - L - R, slot = pw / n, Y = v => T + ph - v / topV * ph;
  let s = `<svg viewBox="0 0 ${W} ${H}" class="vis" style="width:${W}px" role="img" aria-label="diagramme en bâtons de la loi" ${FONT}>`;
  for (let g = 0; g <= topV + 1e-9; g += step) {
    s += `<line x1="${L}" y1="${f1(Y(g))}" x2="${W - R}" y2="${f1(Y(g))}" stroke="${g < 1e-9 ? '#495057' : '#dee2e6'}" stroke-width="1"/>`;
    s += `<text x="${L - 7}" y="${f1(Y(g) + 5)}" font-size="14" text-anchor="end" fill="#333">${M(Math.round(g * 100) / 100)}</text>`;
  }
  s += `<text x="6" y="17" font-size="14" fill="#555">${esc(yTitle)}</text>`;
  const every = n > 14 ? 2 : 1, bw = Math.max(5, Math.min(14, slot * 0.4));
  xs.forEach((x, i) => {
    const cx = L + slot * (i + 0.5), on = hl.includes(i);
    if (i === unk) {
      s += `<rect x="${f1(cx - bw / 2)}" y="${f1(Y(0.1))}" width="${f1(bw)}" height="${f1(Y(0) - Y(0.1))}" fill="#fff" stroke="${ROSE}" stroke-width="2" stroke-dasharray="5 4"/>`
        + `<text x="${f1(cx)}" y="${f1(Y(0.1) - 8)}" font-size="18" font-weight="700" text-anchor="middle" fill="${ROSE}">?</text>`;
    } else {
      s += `<rect x="${f1(cx - bw / 2)}" y="${f1(Y(ps[i]))}" width="${f1(bw)}" height="${f1(Math.max(0, Y(0) - Y(ps[i])))}" fill="${on ? '#f08c00' : '#2f9e44'}" stroke="${on ? '#c2410c' : '#166534'}" stroke-width="1"/>`;
      if (show && (n <= 9 || on)) s += `<text x="${f1(cx)}" y="${f1(Y(ps[i]) - 7)}" font-size="${n > 7 ? 12 : 14}" font-weight="${on ? 700 : 400}" text-anchor="middle" fill="${on ? '#c2410c' : '#333'}">${ps[i] < 0.0005 ? '≈ 0' : M(Math.round(ps[i] * 1000) / 1000)}</text>`;
    }
    if (i % every === 0 || on) s += `<text x="${f1(cx)}" y="${f1(Y(0) + 20)}" font-size="15" font-weight="${on ? 700 : 400}" text-anchor="middle" fill="${on ? '#c2410c' : '#222'}">${M(x)}</text>`;
  });
  s += `<text x="${f1(L + pw / 2)}" y="${H - 6}" font-size="14" text-anchor="middle" fill="#555">${esc(xTitle)}</text>`;
  return s + '</svg>';
}

/* ================= dessins des encarts de cours ================= */
let uid = 0;
const FILLS = ['#e7f5ff', '#f3f0ff', '#ebfbee'];

/**
 * Carré de population (« mosaïque ») : une bande horizontale par ligne du tableau, de hauteur
 * proportionnelle à son effectif, découpée en cases de largeur proportionnelle à leurs effectifs.
 * rows, cols : événements ('S', '!S'…) ; cells : effectifs [ligne][colonne] ;
 * hl : cases mises en valeur [[i, j], …] ; hlRow : ligne entière mise en valeur ; frame : ligne entourée (« sachant »).
 */
export function mosaic({ rows, cols, cells, hl = [], hlRow = -1, frame = -1, cap = true }) {
  const R = cells.map(r => r.reduce((s, x) => s + x, 0)), N = R[0] + R[1];
  const L = 44, T = 8, w = 320, h = 210, W = L + w + 12, H = T + h + (cap ? 30 : 10);
  let s = `<svg viewBox="0 0 ${W} ${H}" class="vis" style="width:${W}px" role="img" aria-label="carré de population : chaque case a une aire proportionnelle à son effectif" ${FONT}>`;
  let y = T, fr = '';
  cells.forEach((row, i) => {
    const rh = R[i] / N * h;
    let x = L;
    row.forEach((n, j) => {
      const cw = n / R[i] * w, on = hlRow === i || hl.some(c => c[0] === i && c[1] === j);
      s += `<rect x="${f1(x)}" y="${f1(y)}" width="${f1(cw)}" height="${f1(rh)}" fill="${on ? '#ffd8a8' : FILLS[j % 3]}" stroke="#fff" stroke-width="3"/>`;
      const txt = cw >= 70 ? `${svgEv(cols[j])} : ${n}` : String(n);
      s += `<text x="${f1(x + cw / 2)}" y="${f1(y + rh / 2 + 6)}" font-size="16" font-weight="${on ? 700 : 400}" text-anchor="middle" fill="${on ? '#c2410c' : '#333'}">${txt}</text>`;
      x += cw;
    });
    s += `<text x="${L - 8}" y="${f1(y + rh / 2 + 7)}" font-size="20" font-weight="700" text-anchor="end" fill="${hlRow === i || frame === i ? HL : '#212529'}">${svgEv(rows[i])}</text>`;
    if (frame === i) fr = `<rect x="${L - 1}" y="${f1(y + 1)}" width="${w + 2}" height="${f1(rh - 2)}" fill="none" stroke="${HL}" stroke-width="3" stroke-dasharray="8 5" rx="4"/>`;
    y += rh;
  });
  s += fr;
  if (cap) s += `<text x="${L + w / 2}" y="${H - 8}" font-size="13" text-anchor="middle" fill="#555">${N} individus : aire d'une case ∝ son effectif</text>`;
  return s + '</svg>';
}

/**
 * Diagramme de Venn de deux événements avec les effectifs de chaque zone.
 * la, lb : noms ; a, b : effectifs de « A seul » et « B seul » ; ab : A ∩ B ; out : ni l'un ni l'autre ;
 * shade : 'inter' (A ∩ B), 'union' (A ∪ B), 'A' ou 'B' ; cap : légende sous le dessin.
 */
export function venn({ la, lb, a, b, ab, out, shade = 'inter', cap = '' }) {
  const id = `pv${++uid}`, W = 360, H = cap ? 236 : 210, r = 78, ca = [132, 108], cb = [228, 108];
  const C = (c, fill, stroke, extra = '') => `<circle cx="${c[0]}" cy="${c[1]}" r="${r}" fill="${fill}" stroke="${stroke}" stroke-width="2.5" ${extra}/>`;
  let s = `<svg viewBox="0 0 ${W} ${H}" class="vis" style="width:${W}px" role="img" aria-label="diagramme de Venn" ${FONT}>`
    + `<defs><clipPath id="${id}"><circle cx="${ca[0]}" cy="${ca[1]}" r="${r}"/></clipPath></defs>`
    + `<rect x="2" y="2" width="${W - 4}" height="206" rx="10" fill="#f8f9fa" stroke="#adb5bd" stroke-width="1.5"/>`;
  if (shade === 'union' || shade === 'A') s += C(ca, '#ffd8a8', 'none');
  if (shade === 'union' || shade === 'B') s += C(cb, '#ffd8a8', 'none');
  if (shade === 'inter') s += C(cb, '#ffd8a8', 'none', `clip-path="url(#${id})"`);
  s += C(ca, 'none', BLUE) + C(cb, 'none', '#2f9e44');
  const num = (x, y, n, on) => `<text x="${x}" y="${y}" font-size="20" font-weight="700" text-anchor="middle" fill="${on ? '#c2410c' : '#333'}">${n}</text>`;
  const onA = shade === 'union' || shade === 'A', onB = shade === 'union' || shade === 'B';
  s += num(92, 115, a, onA) + num(180, 115, ab, true) + num(268, 115, b, onB) + num(336, 196, out, false);
  s += `<text x="34" y="34" font-size="22" font-weight="700" fill="${BLUE}">${svgEv(la)}</text><text x="326" y="34" font-size="22" font-weight="700" text-anchor="end" fill="#2f9e44">${svgEv(lb)}</text>`;
  if (cap) s += `<text x="${W / 2}" y="${H - 6}" font-size="17" font-weight="700" text-anchor="middle" fill="#c2410c">${cap}</text>`;
  return s + '</svg>';
}

/**
 * Triangle de Pascal jusqu'à la ligne n ; hl = [n, k] : coefficient mis en valeur
 * (ses deux « parents » de la ligne au-dessus sont entourés : leur somme donne le coefficient).
 */
export function pascal(n, hl = null) {
  const dx = 46, dy = 38, W = Math.max(300, (n + 1) * dx + 90), H = (n + 1) * dy + 12, cx = W / 2 + 24;
  const Cn = (m, k) => { let r = 1; for (let i = 1; i <= k; i++) r = r * (m - k + i) / i; return Math.round(r); };
  let s = `<svg viewBox="0 0 ${W} ${H}" class="vis" style="width:${W}px" role="img" aria-label="triangle de Pascal" ${FONT}>`;
  for (let m = 0; m <= n; m++) {
    const y = 8 + dy * m + dy / 2;
    s += `<text x="6" y="${f1(y + 5)}" font-size="14" fill="#868e96">n = ${m}</text>`;
    for (let k = 0; k <= m; k++) {
      const x = cx + (k - m / 2) * dx, on = hl && hl[0] === m && hl[1] === k, par = hl && hl[0] - 1 === m && (k === hl[1] || k === hl[1] - 1);
      if (on || par) s += `<circle cx="${f1(x)}" cy="${f1(y)}" r="17" fill="${on ? '#ffd8a8' : '#fff'}" stroke="${on ? HL : BLUE}" stroke-width="2" ${par ? 'stroke-dasharray="4 3"' : ''}/>`;
      s += `<text x="${f1(x)}" y="${f1(y + 6)}" font-size="17" font-weight="${on ? 700 : 400}" text-anchor="middle" fill="${on ? '#c2410c' : par ? BLUE : '#333'}">${Cn(m, k)}</text>`;
    }
  }
  return s + '</svg>';
}

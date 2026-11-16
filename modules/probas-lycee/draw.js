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
  return `<svg viewBox="0 0 ${W} ${H}" class="vis" style="width:${W}px${depth >= 3 ? ";max-height:400px" : ""}" role="img" aria-label="arbre pondéré" ${FONT}>${lines}<circle cx="20" cy="${f1(y0)}" r="5" fill="#212529"/>${labs}</svg>`;
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

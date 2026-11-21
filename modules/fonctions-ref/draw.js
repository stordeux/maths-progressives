// Dessins du module « Fonctions de référence » (chaînes SVG / HTML, sans DOM) :
// courbes des quatre fonctions, vignettes, courbes à points entiers, tableaux de variations et de signes.
import { graph } from '../fonctions/draw.js';
import { M, F, R } from '../../engine/util/fmt.js';

export { graph };
const INF = Infinity;
const r2 = v => Math.round(v * 100) / 100;

/** les quatre fonctions de référence */
export const REF = {
  carre: { nom: 'carré', f: x => x * x, expr: 'x<sup>2</sup>', ok: x => true },
  inverse: { nom: 'inverse', f: x => 1 / x, expr: F(1, 'x'), ok: x => x !== 0 },
  racine: { nom: 'racine carrée', f: x => Math.sqrt(x), expr: R('x'), ok: x => x >= 0 },
  cube: { nom: 'cube', f: x => x * x * x, expr: 'x<sup>3</sup>', ok: x => true },
};
export const CLES = ['carre', 'inverse', 'racine', 'cube'];

/** courbe d'une fonction de référence dans un repère adapté ; o : options supplémentaires de graph() */
export function graphRef(cle, o = {}) {
  const W = {
    carre: { xr: [-4, 4], yr: [-1, 10], fs: [{ f: REF.carre.f, dom: [-3.1, 3.1] }] },
    cube: { xr: [-3, 3], yr: [-10, 10], fs: [{ f: REF.cube.f, dom: [-2.2, 2.2] }] },
    racine: { xr: [-1, 9], yr: [-1, 4], fs: [{ f: REF.racine.f, dom: [0, 9] }] },
    inverse: { xr: [-5, 5], yr: [-5, 5], fs: [{ f: REF.inverse.f, dom: [-5, -0.2] }, { f: REF.inverse.f, dom: [0.2, 5] }] },
  }[cle];
  const fs = W.fs.map((c, i) => ({ ...c, l: i === 0 && o.label !== null ? (o.label || 'f') : '' }));
  return graph({ xr: W.xr, yr: W.yr, fs, aria: o.aria || `courbe de la fonction ${REF[cle].nom}`, ...Object.fromEntries(Object.entries(o).filter(([k]) => !['label', 'aria'].includes(k))) });
}

/** vignette (≈ 110 px) de la courbe d'une fonction de référence, pour un choix */
export function miniRef(cle) {
  const S = 110, C = S / 2, u = S / 7;   // repère de −3,5 à 3,5
  const X = x => C + x * u, Y = y => C - y * u;
  let d = '', pen = false;
  const lo = cle === 'racine' ? 0 : -3.5;
  for (let i = 0; i <= 280; i++) {
    const x = lo + (3.5 - lo) * i / 280, y = REF[cle].f(x);
    if (!isFinite(y) || Math.abs(y) > 3.5 || Math.abs(x) < 0.05 && cle === 'inverse') { pen = false; continue; }
    d += `${pen ? 'L' : 'M'}${r2(X(x))},${r2(Y(y))}`; pen = true;
  }
  return `<svg viewBox="0 0 ${S} ${S}" class="mini" role="img" aria-label="courbe proposée" font-family="system-ui,sans-serif"><rect x="1" y="1" width="${S - 2}" height="${S - 2}" fill="none" stroke="#d9d6cd"/>`
    + `<line x1="2" y1="${C}" x2="${S - 2}" y2="${C}" stroke="#333" stroke-width="1.3"/><line x1="${C}" y1="${S - 2}" x2="${C}" y2="2" stroke="#333" stroke-width="1.3"/>`
    + `<path d="${d}" fill="none" stroke="var(--curve)" stroke-width="3" stroke-linejoin="round"/></svg>`;
}

/** repère avec une courbe à points entiers C (et éventuellement une 2e courbe G, une droite horizontale y = k) */
export function graphCourbe(C, o = {}) {
  const ys = [...C.ys, ...(o.G ? o.G.ys : []), ...(o.k !== undefined ? [o.k] : [])];
  const xr = [Math.min(C.a - 1, -1), Math.max(C.b + 1, 1)], yr = [Math.min(Math.min(...ys) - 1, -1), Math.max(Math.max(...ys) + 1, 1)];
  const fs = [{ f: C.f, dom: [C.a, C.b], l: o.nom || 'f', ends: true, c: o.cF }];
  if (o.G) fs.push({ f: o.G.f, dom: [o.G.a, o.G.b], l: o.nomG || 'g', ends: true, c: '#c2255c' });
  return graph({
    xr, yr, fs, h: o.k !== undefined ? { y: o.k, l: o.kLabel || `y = ${M(o.k)}` } : undefined, pts: o.pts, xl: o.xl,
    aria: o.aria || (o.G ? 'courbes de f et de g' : 'courbe de f'),
  });
}

/* ---------------- tableau de variations ---------------- */
const FLECHE = up => (up
  ? '<svg viewBox="0 0 60 60" class="av" aria-hidden="true"><path d="M8,52 L46,14" fill="none" stroke="currentColor" stroke-width="4" stroke-linecap="round"/><polygon points="54,6 49,21 39,11" fill="currentColor"/></svg>'
  : '<svg viewBox="0 0 60 60" class="av" aria-hidden="true"><path d="M8,8 L46,46" fill="none" stroke="currentColor" stroke-width="4" stroke-linecap="round"/><polygon points="54,54 39,49 49,39" fill="currentColor"/></svg>');

/**
 * Tableau de variations (HTML). xs : abscisses, ys : valeurs aux abscisses (nombres).
 * o.x(i), o.y(i) : texte d'une case (par défaut M(valeur)) ; o.label : nom de la ligne ; o.barre : indices i où une
 * double barre sépare la colonne i − 1 de la colonne i (valeur interdite).
 */
export function tabVarXY(xs, ys, o = {}) {
  const tx = o.x || (i => M(xs[i])), ty = o.y || (i => M(ys[i]));
  let h1 = `<th>x</th>`, h2 = `<th>${o.label || 'f(x)'}</th>`;
  for (let i = 0; i < xs.length; i++) {
    if (i) {
      const up = ys[i] > ys[i - 1];
      h1 += `<td></td>`; h2 += `<td class="a ${up ? 'up' : 'dn'}">${FLECHE(up)}</td>`;
    }
    const prev = i > 0 ? ys[i - 1] : null, next = i < xs.length - 1 ? ys[i + 1] : null;
    const haut = (prev === null || ys[i] > prev) && (next === null || ys[i] > next);
    h1 += `<td class="vx">${tx(i)}</td>`; h2 += `<td class="vy ${haut ? 't' : 'b'}">${ty(i)}</td>`;
  }
  return `<div class="tablewrap"><table class="tv"><tr>${h1}</tr><tr class="rf">${h2}</tr></table></div>`;
}

/** tableau de variations d'une fonction de référence (avec ±∞), pour le cours */
export function tabVarRef(cle) {
  const bar = (g, d) => `<td class="vy pole"><span class="pl">${g}</span><span class="dbl"></span><span class="pr">${d}</span></td>`;
  const A = up => `<td class="a">${FLECHE(up)}</td>`;
  const top = t => `<td class="vy t">${t}</td>`, bot = t => `<td class="vy b">${t}</td>`;
  const X = t => `<td class="vx">${t}</td>`, E = '<td></td>';
  const rows = {
    carre: [`<th>x</th>${X('−∞')}${E}${X('0')}${E}${X('+∞')}`, `<th>f(x)</th>${top('+∞')}${A(false)}${bot('0')}${A(true)}${top('+∞')}`],
    inverse: [`<th>x</th>${X('−∞')}${E}${X('0')}${E}${X('+∞')}`, `<th>f(x)</th>${bot('0')}${A(false)}${bar('−∞', '+∞')}${A(false)}${bot('0')}`],
    racine: [`<th>x</th>${X('0')}${E}${X('+∞')}`, `<th>f(x)</th>${bot('0')}${A(true)}${top('+∞')}`],
    cube: [`<th>x</th>${X('−∞')}${E}${X('+∞')}`, `<th>f(x)</th>${bot('−∞')}${A(true)}${top('+∞')}`],
  }[cle];
  return `<div class="tablewrap"><table class="tv"><tr>${rows[0]}</tr><tr class="rf">${rows[1]}</tr></table></div>`;
}

/* ---------------- tableau de signes (lecture seule) ---------------- */
/**
 * xs : valeurs critiques triées ; lignes : [{ l: étiquette, z: signes des n + 1 zones, barre: [booléens] }] ;
 * barre[i] vrai → « ‖ » à la place de 0 (valeur interdite).
 */
export function tabSignes(xs, lignes, o = {}) {
  const fx = o.fx || M;
  let h = `<tr><td>x</td><td class="e">−∞</td>`;
  xs.forEach(x => { h += `<td class="e"></td><td>${fx(x)}</td>`; });
  h += `<td class="e"></td><td class="e">+∞</td></tr>`;
  for (const L of lignes) {
    h += `<tr><td>${L.l}</td><td class="e"></td>`;
    L.z.forEach((s, i) => {
      h += `<td class="e">${s}</td>`;
      if (i < xs.length) h += `<td>${L.barre && L.barre[i] ? '‖' : L.zero && L.zero[i] === false ? '' : '0'}</td>`;
    });
    h += `<td class="e"></td></tr>`;
  }
  return `<div class="tablewrap"><table class="st stat">${h}</table></div>`;
}

/** droite réelle découpée en zones de signe (+ en vert, − en rouge) ; pole[i] : l'abscisse xs[i] est interdite */
export function ligneSignes(xs, z, pole = []) {
  const W = 460, H = 96, y = 56, n = xs.length, X = i => 30 + (i + 1) * (400 / (n + 1)), bords = [14, ...xs.map((_, i) => X(i)), W - 14];
  let s = `<svg viewBox="0 0 ${W} ${H}" class="vis" role="img" aria-label="signe sur la droite réelle : ${z.map(t => (t === '+' ? 'positif' : 'négatif')).join(', ')}" font-family="system-ui,sans-serif">`;
  z.forEach((t, i) => {
    const a = bords[i], b = bords[i + 1], c = t === '+' ? '#2b8a3e' : '#c92a2a';
    s += `<line x1="${a + (i ? 4 : 0)}" y1="${y}" x2="${b - (i < n ? 4 : 0)}" y2="${y}" stroke="${c}" stroke-width="7" stroke-linecap="round" opacity=".85"/>`
      + `<text x="${(a + b) / 2}" y="${y - 14}" font-size="26" font-weight="800" text-anchor="middle" fill="${c}">${t}</text>`;
  });
  xs.forEach((x, i) => {
    s += `<line x1="${X(i)}" y1="${y - 12}" x2="${X(i)}" y2="${y + 12}" stroke="#333" stroke-width="2.5"/>`
      + `<text x="${X(i)}" y="${y + 32}" font-size="17" font-weight="700" text-anchor="middle" fill="#333">${M(x)}</text>`
      + `<text x="${X(i)}" y="${y - 20 + (pole[i] ? 0 : 0)}" font-size="15" text-anchor="middle" fill="#555">${pole[i] ? '‖' : '0'}</text>`;
  });
  return s + '</svg>';
}

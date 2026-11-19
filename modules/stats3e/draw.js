// Dessins du module « Statistiques de 3e » : boîtes à moustaches (une ou deux séries sur le même axe) et tableaux.
// Les diagrammes en barres et les listes de cases viennent du module Statistiques et probabilités.
import { M } from '../../engine/util/fmt.js';
export { barChart, parseBars, tiles } from '../stats-probas/draw.js';

const FONT = 'font-family="system-ui,-apple-system,Segoe UI,Roboto,sans-serif"';
const f1 = x => (Math.round(x * 1000) / 1000).toString();
const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const MARGE = 14;

/**
 * Boîte(s) à moustaches sur un axe gradué.
 * items : [{ name, min, q1, med, q3, max }] ; lo, hi : bornes de l'axe ; g : pas des petits traits ; lab : pas des nombres.
 * show : écrit les cinq valeurs près de la boîte (sinon on les lit sur l'axe) ; axe : titre de l'axe.
 * Chaque repère porte data-i (numéro de la série) et data-r (min, q1, med, q3, max) ; le SVG porte data-x0, data-u, data-lo :
 * readBox() relit les valeurs d'après la géométrie du dessin (vérification indépendante des tests).
 */
export function boxPlot(items, { lo, hi, g = 1, lab = 1, width = 560, show = false, axe = '' } = {}) {
  const named = items.length > 1 || items.some(it => it.name);
  const L = named ? 74 : MARGE + 8, R = 22, W = width, rowH = show ? 112 : 84, top = show ? 6 : 10;
  const u = (W - L - R) / (hi - lo), x = v => L + (v - lo) * u;
  const axisY = top + items.length * rowH + 4, H = axisY + 40 + (axe ? 20 : 0);
  let s = `<svg viewBox="0 0 ${W} ${H}" class="vis" style="width:${W}px" data-x0="${f1(L)}" data-u="${f1(u)}" data-lo="${lo}" role="img" aria-label="boîte à moustaches" ${FONT}>`;
  // quadrillage et axe
  for (let v = lo; v <= hi + 1e-9; v += g) {
    const major = Math.abs(v / lab - Math.round(v / lab)) < 1e-9;
    s += `<line x1="${f1(x(v))}" y1="${top}" x2="${f1(x(v))}" y2="${axisY}" stroke="${major ? '#ced4da' : '#edf0f2'}" stroke-width="1"/>`;
    s += `<line x1="${f1(x(v))}" y1="${axisY}" x2="${f1(x(v))}" y2="${axisY + (major ? 9 : 5)}" stroke="#333" stroke-width="1.5"/>`;
    if (major) s += `<text x="${f1(x(v))}" y="${axisY + 24}" font-size="13" text-anchor="middle" fill="#333">${M(v)}</text>`;
  }
  s += `<line x1="${L - 6}" y1="${axisY}" x2="${W - R + 6}" y2="${axisY}" stroke="#333" stroke-width="2"/>`;
  if (axe) s += `<text x="${f1((L + W - R) / 2)}" y="${H - 6}" font-size="14" text-anchor="middle" fill="#555">${esc(axe)}</text>`;
  items.forEach((it, i) => {
    const cy = top + i * rowH + (show ? 56 : 42), bh = 34, hh = 11;
    if (it.name) s += `<text x="${MARGE - 6}" y="${cy + 5}" font-size="15" font-weight="700" fill="#222">${esc(it.name)}</text>`;
    s += `<line x1="${f1(x(it.min))}" y1="${cy}" x2="${f1(x(it.q1))}" y2="${cy}" stroke="#087f5b" stroke-width="2.5"/>`;
    s += `<line x1="${f1(x(it.q3))}" y1="${cy}" x2="${f1(x(it.max))}" y2="${cy}" stroke="#087f5b" stroke-width="2.5"/>`;
    s += `<line data-i="${i}" data-r="min" x1="${f1(x(it.min))}" y1="${cy - hh}" x2="${f1(x(it.min))}" y2="${cy + hh}" stroke="#087f5b" stroke-width="3"/>`;
    s += `<line data-i="${i}" data-r="max" x1="${f1(x(it.max))}" y1="${cy - hh}" x2="${f1(x(it.max))}" y2="${cy + hh}" stroke="#087f5b" stroke-width="3"/>`;
    s += `<rect data-i="${i}" data-r="box" x="${f1(x(it.q1))}" y="${cy - bh / 2}" width="${f1(x(it.q3) - x(it.q1))}" height="${bh}" fill="#c3fae8" stroke="#087f5b" stroke-width="2.5"/>`;
    s += `<line data-i="${i}" data-r="med" x1="${f1(x(it.med))}" y1="${cy - bh / 2}" x2="${f1(x(it.med))}" y2="${cy + bh / 2}" stroke="#e8590c" stroke-width="4.5"/>`;
    if (show) {
      // étiquettes : on évite qu'elles se chevauchent en les répartissant sur quatre niveaux (deux au-dessus, deux au-dessous)
      const labs = [['min', it.min], ['q1', it.q1], ['med', it.med], ['q3', it.q3], ['max', it.max]];
      const lv = [{ y: cy - 24, l: -1e9 }, { y: cy + 33, l: -1e9 }, { y: cy - 40, l: -1e9 }, { y: cy + 49, l: -1e9 }];
      labs.forEach(([r, v]) => {
        const px = x(v), t = M(v);
        const w = 9 * t.length + 8;
        let pos = lv.find(p => px - p.l >= w);
        if (!pos) pos = lv.reduce((a, b) => (b.l < a.l ? b : a));
        pos.l = px;
        const up = pos.y < cy;
        s += `<line x1="${f1(px)}" y1="${up ? cy - bh / 2 : cy + bh / 2}" x2="${f1(px)}" y2="${up ? pos.y + 3 : pos.y - 13}" stroke="#adb5bd" stroke-width="1" stroke-dasharray="2 2"/>`;
        s += `<text x="${f1(px)}" y="${pos.y + (up ? 0 : 0)}" font-size="14" font-weight="700" text-anchor="middle" fill="${r === 'med' ? '#e8590c' : '#087f5b'}">${t}</text>`;
      });
    }
  });
  return s + '</svg>';
}

/** relit les cinq nombres de chaque boîte d'après la géométrie du dessin */
export function readBox(svg) {
  const x0 = +(/data-x0="([\d.\-]+)"/.exec(svg) || [])[1], u = +(/data-u="([\d.\-]+)"/.exec(svg) || [])[1], lo = +(/data-lo="([\d.\-]+)"/.exec(svg) || [])[1];
  const val = px => Math.round((lo + (px - x0) / u) * 100) / 100;
  const out = [];
  for (const m of svg.matchAll(/<line data-i="(\d+)" data-r="(min|max|med)" x1="([\d.\-]+)"/g)) { (out[+m[1]] ||= {})[m[2]] = val(+m[3]); }
  for (const m of svg.matchAll(/<rect data-i="(\d+)" data-r="box" x="([\d.\-]+)" y="[\d.\-]+" width="([\d.\-]+)"/g)) {
    const o = (out[+m[1]] ||= {}); o.q1 = val(+m[2]); o.q3 = val(+m[2] + +m[3]);
  }
  return out;
}

/** axe adapté à des valeurs : bornes arrondies au pas des nombres affichés */
export function axeAuto(vals, { lab, g = 1 } = {}) {
  const mn = Math.min(...vals), mx = Math.max(...vals), span = mx - mn;
  const L = lab || (span <= 12 ? 1 : span <= 24 ? 2 : span <= 60 ? 5 : 10);
  let lo = Math.floor(mn / L) * L; if (lo === mn) lo -= L; if (mn >= 0 && lo < 0) lo = 0;
  let hi = Math.ceil(mx / L) * L; if (hi === mx) hi += L;
  return { lo, hi, g, lab: L };
}

/** tableau HTML : lignes [{ h, cells }] ; une cellule `null` s'affiche « ? » ; total : colonne Total (nombre ou chaîne) */
export function tableHtml(head, rows, { total = null } = {}) {
  const cell = c => (c === null ? '<b style="color:#d6336c">?</b>' : typeof c === 'number' ? M(c) : c);
  const [h0, vals] = head;
  let t = `<div class="tablewrap"><table class="data"><tr><th>${h0}</th>${vals.map(v => `<td>${cell(v)}</td>`).join('')}${total !== null ? '<td><b>Total</b></td>' : ''}</tr>`;
  rows.forEach(r => { t += `<tr><th>${r.h}</th>${r.cells.map(c => `<td>${cell(c)}</td>`).join('')}${total !== null ? `<td><b>${r.total !== undefined ? cell(r.total) : ''}</b></td>` : ''}</tr>`; });
  return t + '</table></div>';
}

/** deux repères d'une même série sur une droite, avec l'écart cherché (« ? ») entre eux */
export function ecartSvg(la, a, lb, b, { ask = '?' } = {}) {
  const W = 460, H = 130, xa = 90, xb = 370;
  let s = `<svg viewBox="0 0 ${W} ${H}" class="vis" style="width:${W}px" role="img" aria-label="deux repères et l'écart entre eux" ${FONT}>`;
  s += `<line x1="30" y1="95" x2="430" y2="95" stroke="#333" stroke-width="2.5"/><path d="M430,95 l-9,-5 v10 z" fill="#333"/>`;
  [[xa, la, a], [xb, lb, b]].forEach(([x, l, v]) => {
    s += `<line x1="${x}" y1="85" x2="${x}" y2="105" stroke="#087f5b" stroke-width="3.5"/>`;
    s += `<text x="${x}" y="124" font-size="16" font-weight="700" text-anchor="middle" fill="#222">${esc(l)} = ${M(v)}</text>`;
  });
  s += `<path d="M${xa},70 V58 H${xb} V70" fill="none" stroke="#e8590c" stroke-width="3"/>`;
  s += `<text x="${(xa + xb) / 2}" y="46" font-size="18" font-weight="700" text-anchor="middle" fill="#d6336c">${esc(ask)}</text>`;
  return s + '</svg>';
}

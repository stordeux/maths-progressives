// Formatage « à la française » : virgule décimale, vrai signe moins, intervalles ]a ; b[.
import { r6 } from './arith.js';

export const INF = Infinity;
/** nombre avec vrai signe moins et virgule : M(-2.5) = "−2,5" ; ±∞ */
export const M = n => n === INF ? '+∞' : n === -INF ? '−∞' : (r6(n) < 0 ? '−' : '') + String(Math.abs(r6(n))).replace('.', ',');
/** entre parenthèses si négatif */
export const P = n => (r6(n) < 0 ? '(' + M(n) + ')' : M(n));
/** fraction empilée */
export const F = (n, d) => `<span class="frac"><span>${n}</span><span>${d}</span></span>`;
/** racine carrée */
export const R = x => `<span class="sqrt"><b>√</b><span>${x}</span></span>`;
/** ligne de calcul en grand */
export const big = s => `<div class="big">${s}</div>`;
export const X2 = 'x<sup>2</sup>';
export const sq = s => `${s}<sup>2</sup>`;
/** somme de termes [[coef, 'x²'|'x'|''], …] avec signes propres */
export function terms(list) {
  let s = '';
  list.filter(t => t[0] !== 0).forEach((t, i) => {
    const [k, v] = t, ab = Math.abs(k), c = (ab === 1 && v) ? '' : M(ab);
    s += (k < 0 ? (i ? ' − ' : '−') : (i ? ' + ' : '')) + c + v;
  });
  return s || '0';
}
/** « + 3 » ou « − 3 » pour écrire la suite d'une somme */
export const sgn = n => (n < 0 ? '− ' + M(-n) : '+ ' + M(n));
/** x − a avec signes propres */
export const xm = a => a === 0 ? 'x' : a > 0 ? `x − ${M(a)}` : `x + ${M(-a)}`;
/** texte brut (pour la synthèse vocale et les tests) */
export const strip = html => String(html).replace(/<sup>2<\/sup>/g, ' au carré').replace(/<[^>]+>/g, ' ').replace(/&nbsp;/g, ' ').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&').replace(/\s+/g, ' ').trim();
/** pluriel simple */
export const pl = (n, mot) => `${n} ${mot}${Math.abs(n) > 1 ? 's' : ''}`;

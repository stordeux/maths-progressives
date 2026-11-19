// Outils communs du module Repérage et solides : questions, exemples du cours (repris de Géométrie plane), notations.
import { M, P } from '../../engine/util/fmt.js';
import { ri, pick, shuffle, chance } from '../../engine/util/rand.js';
export { numQ, choiceQ, ex, rep, warn, retenir, meth, def, cours, cols, fr } from '../geometrie/util.js';
export { ri, pick, shuffle, chance, M, P };

/** lettres des points d'un repère (sans O, réservé à l'origine) */
export const LETTRES = 'ABCDEFGHKLNPQRSTUV'.split('');
export const lettres = (n, d) => (d >= 2 ? shuffle([...LETTRES]).slice(0, n) : LETTRES.slice(0, n));
/** couple de coordonnées écrit à la française : (3 ; −2) */
export const cp = p => `(${M(p[0])} ; ${M(p[1])})`;
/** point nommé : A(3 ; −2) */
export const pt = (n, p) => `${n}${cp(p)}`;
/** « 1 carreau », « 3 carreaux » */
export const carr = n => `${Math.abs(n)} carreau${Math.abs(n) > 1 ? 'x' : ''}`;
export const near = (a, b) => Math.abs(a - b) < 1e-6;
/** les deux nombres sont-ils les coordonnées lues dans la figure ? (a, b : tableaux) */
export const memes = (a, b) => a.length === b.length && a.every((v, i) => near(v, b[i]));
/** tirage sans doublon dans une liste de points : distance de Tchebychev ≥ gap entre deux points */
export function ecartes(list, gap) { return list.every((p, i) => list.every((q, j) => i === j || Math.max(Math.abs(p[0] - q[0]), Math.abs(p[1] - q[1])) >= gap)); }

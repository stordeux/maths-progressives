// Nombres à la française du module : virgule décimale, vrai signe moins, et espace fine insécable pour les milliers
// (2 400 €). On l'utilise à la place de M de engine/util/fmt.js dans tout le module.
import { M as MF } from '../../engine/util/fmt.js';

export const ESPACE_FINE = '\u202f';
/** « 2400 » → « 2 400 » (espace fine insécable) ; seule la partie entière de 4 chiffres ou plus est groupée */
export const M = n => {
  const s = MF(n);
  if (!/\d{4}/.test(s)) return s;
  return s.replace(/\d{4,}/, ent => ent.replace(/\B(?=(\d{3})+(?!\d))/g, ESPACE_FINE));
};
export const P = n => (typeof n === 'number' && n < 0 ? `(${M(n)})` : M(n));

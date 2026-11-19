// Outils numériques du module « Nombres décimaux » (sans DOM : importé aussi par Node).
// Les décimaux sont tirés comme des entiers divisés par 10^k, puis arrondis par r6 : jamais d'erreur de flottant dans l'affichage.
import { ri, pick, chance, shuffle, prenom } from '../../engine/util/rand.js';
import { r6, approx, decimals } from '../../engine/util/arith.js';
import { numsCheck } from '../../engine/answers/checks.js';

export const NB = ' '; // espace insécable (milliers, avant l'unité)
const group = s => s.replace(/\B(?=(\d{3})+(?!\d))/g, NB);
/** x avec exactement k décimales, virgule, espace des milliers, vrai signe moins : fx(3.5, 2) = « 3,50 » */
export const fx = (x, k) => {
  const n = Math.round(r6(Math.abs(x)) * 10 ** k), neg = x < 0 && n !== 0;
  const s = String(n).padStart(k + 1, '0'), ip = s.slice(0, s.length - k), dp = s.slice(s.length - k);
  return (neg ? '−' : '') + (ip.length >= 4 ? group(ip) : ip) + (k ? ',' + dp : '');
};
/** x avec le nombre de décimales qu'il faut (comme M, mais avec l'espace des milliers) */
export const f = x => fx(x, decimals(x));
/** texte brut sans espace : « 3,5 » (pour les chiffres et les tests) */
export const raw = x => String(r6(x)).replace('.', ',');
/** nombre de décimales */
export const nd = decimals;
/** chiffres significatifs d'un nombre, sans zéros inutiles ni virgule : 0,0450 → « 45 » */
export const digs = x => String(r6(Math.abs(x))).replace('.', '').replace(/^0+/, '').replace(/0+$/, '');

/** décimal à exactement k décimales (dernier chiffre non nul), partie entière entre lo et hi */
export const rd = (k, lo, hi) => {
  if (k === 0) return ri(lo, hi);
  const frac = (k > 1 ? ri(0, 10 ** (k - 1) - 1) * 10 : 0) + ri(1, 9);
  return r6(ri(lo, hi) + frac / 10 ** k);
};
/** décimal de k décimales au plus (zéro final possible), à éviter pour les exercices « nombre de décimales » */
export const rdAny = (k, lo, hi) => r6(ri(lo, hi) + ri(0, 10 ** k - 1) / 10 ** k);

/** chiffre de x à la puissance de 10 p (p = −1 : dixièmes, 0 : unités, 1 : dizaines…) */
export const digitAt = (x, p) => {
  const n = Math.round(r6(Math.abs(x)) * 1e6); // entier : x × 10^6
  return Math.floor(n / 10 ** (p + 6)) % 10;
};
/** arrondi (demi vers le haut) à la puissance p : p = 0 unité, −1 dixième, −2 centième… ; calcul sur entiers */
export const arrondi = (x, p) => {
  const q = 10 ** (-p), n = Math.round(r6(x) * 1e6), u = 1e6 / q;
  return r6(Math.floor((n + u / 2) / u) / q);
};
/** troncature (valeur approchée par défaut) à la puissance p */
export const tronque = (x, p) => { const q = 10 ** (-p), n = Math.round(r6(x) * 1e6), u = 1e6 / q; return r6(Math.floor(n / u) / q); };
/** valeur approchée par excès à la puissance p (x lui-même s'il est déjà exact) */
export const exces = (x, p) => { const t = tronque(x, p); return approx(t, x) ? t : r6(t + 10 ** p); };

/** « presque juste » : les chiffres sont bons mais la virgule est mal placée */
export const commaMsg = (v, e, ctx = '') => {
  if (v === null || v === undefined || e === 0 || approx(v, e) || digs(v) !== digs(e) || v === 0) return '';
  const r = Math.round(Math.log10(Math.abs(v / e)));
  return `Presque ! Les chiffres sont bons, mais <b>la virgule est mal placée</b> (décalée de ${Math.abs(r)} rang${Math.abs(r) > 1 ? 's' : ''} ${r > 0 ? 'vers la droite' : 'vers la gauche'}).${ctx ? ' ' + ctx : ''}`;
};
/**
 * check numérique avec messages « presque juste » : more(v) d'abord, puis virgule mal placée sur chaque case.
 * ctx : phrase ajoutée au message de virgule.
 */
export const mk = (E, more, ctx = '') => numsCheck(E, {
  msg: v => {
    const m = more ? more(v) : '';
    if (m) return m;
    for (let i = 0; i < E.length; i++) { const c = commaMsg(v[i], E[i], ctx); if (c) return c; }
    return '';
  },
});
/** exercice numérique : cases = E, value = dernière case recalculée autrement */
export const numQ = (E, value, o = {}) => ({
  type: 'nums', tpl: o.tpl || 'Réponse : {0}', check: mk(E, o.more, o.ctx), expected: E, value,
  keys: E.some(e => nd(e) > 0) || o.comma ? { comma: true } : undefined,
});
export const big = s => `<div class="big">${s}</div>`;
export const slot = '<span class="slot">?</span>';
export { ri, pick, chance, shuffle, prenom, r6, approx };

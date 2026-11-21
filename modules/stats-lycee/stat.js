// Statistiques au lycée : calculs de base et contextes de données.
// Les calculs de rang (médiane, quartiles) viennent du module Statistiques de 3e ; ici s'ajoutent
// moyenne pondérée, variance, écart type, classes, fréquences et régression, avec un second calcul indépendant
// (par les valeurs développées) pour les tests.
import { ri, pick, shuffle, chance } from '../../engine/util/rand.js';
export { sum, range, asc, expand, cumul, rangQ, q1, q3, med, mean, resume, partition, quantCount, medCount } from '../stats3e/stat.js';
import { sum, range, expand, partition } from '../stats3e/stat.js';

export const rnd = (x, k = 0) => { const p = 10 ** k; return Math.round(x * p + (x >= 0 ? 1e-9 : -1e-9)) / p; };
export const entier = x => Math.abs(x - Math.round(x)) < 1e-9;
/** nombre de décimales d'un résultat exact (≤ 6), -1 s'il n'est pas décimal court */
export const dec = x => { for (let k = 0; k <= 6; k++) if (Math.abs(x * 10 ** k - Math.round(x * 10 ** k)) < 1e-7) return k; return -1; };

/** moyenne pondérée */
export const moy = (vals, effs) => sum(vals.map((x, i) => x * effs[i])) / sum(effs);
/** variance : moyenne des carrés des écarts à la moyenne (série ou tableau d'effectifs) */
export const variance = (vals, effs = vals.map(() => 1)) => { const m = moy(vals, effs); return sum(vals.map((x, i) => effs[i] * (x - m) ** 2)) / sum(effs); };
export const sigma = (vals, effs) => Math.sqrt(variance(vals, effs));
/** (indépendant) variance par la formule « moyenne des carrés moins carré de la moyenne » sur la série développée */
export function varianceAutre(vals, effs = vals.map(() => 1)) {
  const L = expand(vals, effs), n = L.length;
  return L.reduce((s, x) => s + x * x, 0) / n - (L.reduce((s, x) => s + x, 0) / n) ** 2;
}
/** variance entière (somme des carrés des écarts ÷ N) exacte ? renvoie [Σ n(x−m)², N] avec m décimal exact */
export const racineExacte = v => { const r = Math.sqrt(v); return entier(r) ? Math.round(r) : null; };

/** tire dans f() jusqu'à ce que ok(x) soit vrai (essais bornés), sinon null */
export function cherche(f, ok = () => true, essais = 4000) {
  for (let i = 0; i < essais; i++) { const x = f(); if (x !== null && x !== undefined && ok(x)) return x; }
  return null;
}

/* ---------- contextes de séries ---------- */
// lo/hi : valeurs plausibles ; pas : écart entre deux valeurs d'un tableau ; u : unité écrite après le nombre
export const CTX = [
  { id: 'notes', lo: 5, hi: 19, pas: 1, sps: [1, 2], u: '', h: 'Note (sur 20)', nom: 'note', noms: 'notes', ent: 'élèves',
    liste: n => `Voici les notes (sur 20) de ${n} élèves à un devoir de mathématiques.`, tab: 'Le tableau donne les notes (sur 20) des élèves d’une classe à un devoir de mathématiques.' },
  { id: 'trajet', lo: 5, hi: 45, pas: 5, u: ' min', h: 'Durée du trajet (min)', nom: 'durée', noms: 'durées', ent: 'élèves',
    liste: n => `Voici la durée (en minutes) du trajet entre la maison et le lycée de ${n} élèves.`, tab: 'Le tableau donne la durée (en minutes) du trajet entre la maison et le lycée des élèves d’une classe.' },
  { id: 'taille', lo: 154, hi: 188, pas: 1, sps: [1, 2, 3], u: ' cm', h: 'Taille (cm)', nom: 'taille', noms: 'tailles', ent: 'élèves',
    liste: n => `Voici la taille (en cm) de ${n} élèves d’une classe de seconde.`, tab: 'Le tableau donne la taille (en cm) des élèves d’une classe de seconde.' },
  { id: 'temp', lo: 14, hi: 32, pas: 1, sps: [1, 2], u: ' °C', h: 'Température maximale (°C)', nom: 'température', noms: 'températures', ent: 'jours',
    liste: n => `Voici la température maximale (en °C) relevée pendant ${n} jours d’un mois d’été.`, tab: 'Le tableau donne la température maximale (en °C) relevée chaque jour d’un mois d’été.' },
  { id: 'livres', lo: 0, hi: 9, pas: 1, u: ' livres', h: 'Livres lus', nom: 'nombre de livres', noms: 'nombres de livres', ent: 'élèves',
    liste: n => `Voici le nombre de livres lus pendant les vacances d’été par ${n} élèves.`, tab: 'Le tableau donne le nombre de livres lus pendant les vacances d’été par les élèves d’une classe.' },
  { id: 'buts', lo: 0, hi: 7, pas: 1, u: ' buts', h: 'Buts marqués', nom: 'nombre de buts', noms: 'nombres de buts', ent: 'matchs',
    liste: n => `Voici le nombre de buts marqués par une équipe de handball lors de ${n} matchs.`, tab: 'Le tableau donne le nombre de buts marqués par une équipe de handball lors de ses matchs de la saison.' },
  { id: 'pointure', lo: 36, hi: 46, pas: 1, u: '', h: 'Pointure', nom: 'pointure', noms: 'pointures', ent: 'élèves',
    liste: n => `Voici la pointure de ${n} élèves d’une classe de seconde.`, tab: 'Le tableau donne la pointure des élèves d’une classe de seconde.' },
];
/** unité suivie d'un mot : « 12 min », « 7 » */
export const fu = (C, M_, v) => `${M_(v)}${C.u}`;

/** série de n valeurs entières du contexte C, en « cloche » */
export function serie(C, n, { lo = C.lo, hi = C.hi } = {}) {
  const p = C.pas;
  return Array.from({ length: n }, () => p * Math.round((ri(Math.ceil(lo / p), Math.floor(hi / p)) + ri(Math.ceil(lo / p), Math.floor(hi / p))) / 2));
}
/** k valeurs consécutives (au pas du contexte), à partir d'un départ au hasard dans [lo ; hi − (k−1)·pas] */
export function valeursTab(C, k) {
  const p = C.pas, a = ri(Math.ceil(C.lo / p), Math.floor((C.hi - (k - 1) * p) / p));
  return range(a, a + k - 1).map(i => i * p);
}
/** effectifs : k nombres ≥ 1 de somme N, « en cloche » (les valeurs centrales ont les plus grands effectifs) */
export function effCloche(k, N) {
  for (let t = 0; t < 200; t++) {
    const e = partition(N - k, k, 0).map(x => x + 1);
    const m = Math.floor((k - 1) / 2), mx = Math.max(...e);
    if (e[m] === mx || e[k - 1 - m] === mx) return e;
  }
  return partition(N, k, 1);
}

/* ---------- classes ---------- */
/** « [10 ; 20[ » */
export const classe = (a, b, M_) => `[${M_(a)} ; ${M_(b)}[`;

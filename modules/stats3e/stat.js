// Statistiques de 3e : calculs de base (rangs, quartiles à la manière du collège, médiane, tableaux d'effectifs)
// et générateurs de séries. Deux calculs indépendants pour chaque indicateur :
//  - par les rangs (formule du cours) : q1(), q3(), med() ;
//  - par comptage direct des valeurs (définition) : quantCount(), medCount(), utilisés par les tests (`verify`).
import { ri, pick, shuffle, chance } from '../../engine/util/rand.js';

export const sum = a => a.reduce((s, x) => s + x, 0);
export const range = (a, b) => [...Array(b - a + 1)].map((_, i) => a + i);
export const asc = a => [...a].sort((x, y) => x - y);
export const expand = (vals, effs) => vals.flatMap((v, i) => Array(effs[i]).fill(v));
export const cumul = effs => { let c = 0; return effs.map(e => (c += e)); };

/** rang (à partir de 1) du quartile k (1 ou 3) pour n valeurs : plus petit entier ≥ n × k / 4 */
export const rangQ = (n, k) => Math.ceil(n * k / 4);
export const q1 = s => s[rangQ(s.length, 1) - 1];
export const q3 = s => s[rangQ(s.length, 3) - 1];
export const med = s => { const n = s.length; return n % 2 ? s[(n - 1) / 2] : (s[n / 2 - 1] + s[n / 2]) / 2; };
export const mean = a => sum(a) / a.length;

/** résumé d'une série (liste brute) */
export function resume(list) {
  const s = asc(list);
  return { n: s.length, s, min: s[0], q1: q1(s), med: med(s), q3: q3(s), max: s[s.length - 1], mean: mean(s),
    etendue: s[s.length - 1] - s[0], iqr: q3(s) - q1(s) };
}

/** valeur de la série (liste brute) de rang r (à partir de 1), lue dans un tableau valeurs / effectifs avec les effectifs cumulés */
export function valeurDeRang(vals, effs, r) {
  const c = cumul(effs);
  for (let i = 0; i < vals.length; i++) if (c[i] >= r) return vals[i];
  return vals[vals.length - 1];
}

/** (indépendant) plus petite valeur v telle qu'au moins p % des valeurs soient ≤ v, par comptage direct */
export function quantCount(list, p) {
  const cand = [...new Set(list)].sort((a, b) => a - b);
  for (const v of cand) { let c = 0; for (const x of list) if (x <= v) c++; if (c * 100 >= p * list.length) return v; }
  return cand[cand.length - 1];
}
/** (indépendant) médiane par comptage : si exactement la moitié des valeurs sont ≤ v, on fait la moyenne avec la valeur suivante */
export function medCount(list) {
  const cand = [...new Set(list)].sort((a, b) => a - b);
  for (let i = 0; i < cand.length; i++) {
    let c = 0; for (const x of list) if (x <= cand[i]) c++;
    if (c * 2 > list.length) return cand[i];
    if (c * 2 === list.length) return (cand[i] + cand[i + 1]) / 2;
  }
  return cand[cand.length - 1];
}
/** (indépendant) les cinq nombres par comptage */
export function cinqCount(list) {
  return [Math.min(...list), quantCount(list, 25), medCount(list), quantCount(list, 75), Math.max(...list)];
}

/** découpe total en k entiers ≥ min, au hasard */
export function partition(total, k, min = 1) {
  const p = Array(k).fill(min);
  for (let r = total - k * min; r > 0; r--) p[ri(0, k - 1)]++;
  return p;
}

/* ---------- contextes de séries en liste ---------- */
export const SERIES = [
  { id: 'notes', lo: 5, hi: 19, u: '', axe: 'note (sur 20)', un: 'note', pl: 'notes',
    intro: (n, p) => `Voici les notes (sur 20) de ${p} à ses ${n} derniers contrôles de maths.` },
  { id: 'trajet', lo: 5, hi: 45, u: ' min', axe: 'durée (min)', un: 'durée', pl: 'durées de trajet',
    intro: (n, p) => `Voici la durée (en minutes) du trajet de ${p} jusqu'au collège pendant ${n} jours.` },
  { id: 'taille', lo: 152, hi: 182, u: ' cm', axe: 'taille (cm)', un: 'taille', pl: 'tailles',
    intro: n => `Voici la taille (en cm) de ${n} élèves d'une classe de 3<sup>e</sup>.` },
  { id: 'points', lo: 6, hi: 32, u: ' points', axe: 'points marqués', un: 'nombre de points', pl: 'nombres de points',
    intro: (n, p) => `Voici les points marqués par ${p} lors de ses ${n} derniers matchs de basket.` },
  { id: 'prix', lo: 12, hi: 48, u: ' €', axe: 'prix (€)', un: 'prix', pl: 'prix',
    intro: n => `Voici le prix (en €) d'un même jeu vidéo relevé dans ${n} magasins.` },
  { id: 'temp', lo: 16, hi: 34, u: ' °C', axe: 'température (°C)', un: 'température', pl: 'températures',
    intro: n => `Voici la température maximale (en °C) relevée pendant ${n} jours d'un mois de juillet.` },
];

/** série de n valeurs entières du contexte C (répartition en « cloche » : somme de deux tirages).
 *  strict : exige min < Q1 < médiane < Q3 < max (boîte bien lisible), avec un nombre d'essais borné. */
export function serie(C, n, { strict = false, lo = C.lo, hi = C.hi } = {}) {
  let v;
  for (let t = 0; t < 300; t++) {
    v = Array.from({ length: n }, () => Math.round((ri(lo, hi) + ri(lo, hi)) / 2));
    if (!strict) return v;
    const r = resume(v);
    if (r.min < r.q1 && r.q1 < r.med && r.med < r.q3 && r.q3 < r.max) return v;
  }
  // repli sûr : valeurs toutes différentes, étalées
  const step = Math.max(1, Math.floor((hi - lo) / (n - 1)));
  return shuffle(Array.from({ length: n }, (_, i) => lo + i * step));
}

/* ---------- contextes de tableaux d'effectifs ---------- */
export const TABLES = [
  { id: 'notes', ent: 'élèves', np: 'la note', h1: 'Note (sur 20)', u: '', vals: k => { const a = ri(6, 10); return range(a, a + k - 1); }, titre: 'Notes obtenues à un contrôle de maths' },
  { id: 'trajet', ent: 'élèves', np: 'la durée du trajet', h1: 'Durée du trajet (min)', u: ' min', vals: k => range(1, k).map(i => 5 * i), titre: 'Durée du trajet entre la maison et le collège' },
  { id: 'pointure', ent: 'élèves', np: 'la pointure', h1: 'Pointure', u: '', vals: k => { const a = ri(35, 38); return range(a, a + k - 1); }, titre: 'Pointures des élèves de 3<sup>e</sup>' },
  { id: 'enfants', ent: 'familles', np: 'le nombre d\'enfants', h1: 'Nombre d\'enfants', u: '', vals: k => range(0, k - 1), titre: 'Nombre d\'enfants des familles d\'un immeuble' },
  { id: 'livres', ent: 'élèves', np: 'le nombre de livres lus', h1: 'Livres lus cet été', u: '', vals: k => range(0, k - 1), titre: 'Nombre de livres lus pendant l\'été' },
  { id: 'buts', ent: 'matchs', np: 'le nombre de buts marqués', h1: 'Buts marqués', u: '', vals: k => range(0, k - 1), titre: 'Buts marqués par une équipe de handball en match' },
];

/** tableau d'effectifs du contexte C : k valeurs, effectif total N (partition au hasard, chaque effectif ≥ 1) */
export function tableau(C, k, N, minE = 1) {
  const vals = C.vals(k), effs = partition(N, k, minE);
  return { C, vals, effs, N, k };
}

/* ---------- contextes des boîtes à moustaches : un axe par niveau de difficulté ---------- */
/** préréglages d'axe : g = pas des petits traits, lab = pas des nombres, [lo ; hi] bornes */
export const AXES = [
  { g: 1, lab: 1, lo: 0, hi: 20 },
  { g: 1, lab: 2, lo: 0, hi: 30 },
  { g: 2, lab: 2, lo: 0, hi: 40 },
  { g: 2, lab: 10, lo: 0, hi: 50 },
  { g: 5, lab: 10, lo: 0, hi: 100 },
];
/** contextes : who = individus, ont = « ont … », f = féminin (pour « inférieure ») ; ax = indices de AXES compatibles */
export const BOXC = [
  { id: 'notes', who: 'élèves', ont: 'ont une note', f: true, u: '', axe: 'note (sur 20)', titre: "Notes (sur 20) des élèves d'une classe de 3<sup>e</sup>", ax: [0] },
  { id: 'points', who: 'matchs', ont: 'ont un nombre de points', f: false, u: ' points', axe: 'points marqués', titre: "Points marqués par une équipe de basket", ax: [1, 2] },
  { id: 'trajet', who: 'élèves', ont: 'ont un temps de trajet', f: false, u: ' min', axe: 'durée du trajet (min)', titre: 'Durée du trajet entre la maison et le collège', ax: [1, 2, 3] },
  { id: 'prix', who: 'magasins', ont: 'proposent un prix', f: false, u: ' €', axe: 'prix (€)', titre: "Prix d'un même casque audio dans plusieurs magasins", ax: [3, 4] },
  { id: 'velo', who: 'sorties', ont: 'ont une distance', f: true, u: ' km', axe: 'distance (km)', titre: 'Distances parcourues à vélo lors de plusieurs sorties', ax: [4] },
];
/** cinq nombres au hasard sur l'axe A (multiples du pas g, strictement croissants, jamais sur les bords) */
export function cinq(A) {
  const S = Math.round((A.hi - A.lo) / A.g), pos = new Set();
  while (pos.size < 5) pos.add(ri(1, S - 1));
  const p = [...pos].sort((a, b) => a - b);
  return { min: A.lo + p[0] * A.g, q1: A.lo + p[1] * A.g, med: A.lo + p[2] * A.g, q3: A.lo + p[3] * A.g, max: A.lo + p[4] * A.g };
}

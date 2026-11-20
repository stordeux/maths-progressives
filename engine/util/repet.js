// Anti-répétition (ticket n° 7, 2026-11-20 : « il faut éviter que les exercices se répètent »).
// On garde l'empreinte des derniers énoncés vus et on retire un exercice tant qu'il ressemble à l'un d'eux.
// Sans DOM : utilisé par le moteur, le Calcul mental, la Révision brevet et les tests Node.
import { PRENOMS } from './rand.js';

/** nombre d'énoncés gardés en mémoire */
export const MEMOIRE = 10;
/** nombre maximal de tirages pour un exercice (jamais de boucle sans fin) */
export const ESSAIS = 25;

// identifiants internes des figures SVG (compteur qui change à chaque dessin : dégradés, zones de découpe, titres)
const RE_ID = /(\bid="|url\(#|href="#|aria-(?:labelledby|describedby)=")[^")]*/g;
const RE_PRENOM = new RegExp(`(?<![\\p{L}])(?:${PRENOMS.join('|')})(?![\\p{L}])`, 'gu');

/**
 * Texte comparable d'un exercice : l'énoncé et la figure, sans les prénoms (« Léa achète 3 kg » et
 * « Tom achète 3 kg » sont le même exercice) ni les espaces. Les choix proposés sont triés (leur ordre est mélangé).
 * Accepte un exercice du moteur ({html, visual, tpl, opts, lines}) ou du calcul mental ({q}).
 */
export function texteCle(q) {
  const opts = (q.opts || []).map(o => String(o.l)).sort().join('¦');
  const brut = [q.html ?? q.q ?? '', q.visual || '', q.tpl || '', opts, (q.lines || []).join('¦')].join('§');
  return brut.replace(RE_ID, '$1').replace(RE_PRENOM, '∗').replace(/&nbsp;|\s+/g, ' ').trim();
}

/** empreinte courte (deux hachages de 32 bits) : c'est elle qu'on enregistre, pas l'énoncé */
export function empreinte(q) {
  const s = texteCle(q);
  let a = 0x811c9dc5, b = 5381;
  for (let i = 0; i < s.length; i++) {
    const c = s.charCodeAt(i);
    a = Math.imul(a ^ c, 0x01000193);
    b = (Math.imul(b, 33) + c) | 0;
  }
  return (a >>> 0).toString(36) + '.' + (b >>> 0).toString(36);
}

/**
 * Tire un exercice qui n'est pas dans la mémoire des derniers énoncés.
 *   tirer()  : fabrique un exercice (appelé ESSAIS fois au plus) ;
 *   memoire  : tableau d'empreintes, du plus ancien au plus récent ; il est mis à jour (longueur ≤ taille) ;
 *   exo(x)   : l'exercice à comparer quand tirer() renvoie un objet qui l'enveloppe (Révision brevet).
 * Si tous les essais retombent sur des énoncés déjà vus (réservoir plus petit que la mémoire), on garde celui
 * qui a été vu il y a le plus longtemps : l'écart entre deux apparitions d'un même énoncé reste le plus grand possible.
 */
export function sansRepetition(tirer, memoire, { taille = MEMOIRE, essais = ESSAIS, exo = x => x } = {}) {
  let choix = null, rangChoix = Infinity, cleChoix = '';
  for (let k = 0; k < essais; k++) {
    const q = tirer(), cle = empreinte(exo(q)), rang = memoire.lastIndexOf(cle);
    if (rang < rangChoix) { choix = q; rangChoix = rang; cleChoix = cle; }
    if (rang < 0) break;
  }
  if (rangChoix >= 0) memoire.splice(rangChoix, 1);
  memoire.push(cleChoix);
  if (memoire.length > taille) memoire.splice(0, memoire.length - taille);
  return choix;
}

/** mémoire lue dans un état enregistré : toujours un tableau de chaînes (état ancien, importé ou abîmé) */
export const memoireDe = v => (Array.isArray(v) ? v.filter(x => typeof x === 'string').slice(-MEMOIRE) : []);

// Aléatoire avec graine (mulberry32). Sans graine, on part d'une graine tirée au hasard.
// Les tests fixent la graine avec setSeed() pour être reproductibles.
let state = (Math.random() * 2 ** 32) >>> 0;

export function setSeed(seed) { state = seed >>> 0; }

export function random() {
  state = (state + 0x6D2B79F5) >>> 0;
  let t = state;
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}

/** entier aléatoire entre a et b inclus */
export const ri = (a, b) => a + Math.floor(random() * (b - a + 1));
/** élément au hasard d'une liste */
export const pick = a => a[Math.floor(random() * a.length)];
/** entier non nul entre a et b */
export const nz = (a, b) => { let v; do { v = ri(a, b); } while (v === 0); return v; };
/** mélange en place (Fisher-Yates) */
export const shuffle = a => { for (let i = a.length - 1; i > 0; i--) { const j = ri(0, i); [a[i], a[j]] = [a[j], a[i]]; } return a; };
/** vrai avec la probabilité p */
export const chance = p => random() < p;
/** prénom au hasard pour les énoncés */
export const prenom = () => pick(['Léa', 'Nour', 'Tom', 'Inès', 'Hugo', 'Yanis', 'Chloé', 'Malo', 'Sarah', 'Adam', 'Mila', 'Lucas', 'Jade', 'Rayan']);
/** variante dépendant de d : tire dans [max(0,d-1) ; d], plafonné à max */
export const variant = (d, max) => Math.min(max, ri(Math.max(0, d - 1), d));

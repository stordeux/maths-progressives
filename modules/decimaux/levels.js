// Nombres décimaux (6e) : 12 niveaux, de la valeur des chiffres aux problèmes en plusieurs étapes.
// Les niveaux sont écrits dans niveaux-a.js (1 à 4), niveaux-b.js (5 à 8) et niveaux-c.js (9 à 12).
// Chaque réponse est recalculée autrement (champ `value` ou `verify`) : les tests comparent les deux.
import { A } from './niveaux-a.js';
import { B } from './niveaux-b.js';
import { C } from './niveaux-c.js';

export const LEVELS = [...A, ...B, ...C];
export const OPTIONS = { need: 4, keys: { neg: false, comma: true } };

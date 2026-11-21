// Fonctions de référence (2de) : 12 niveaux sur le programme de seconde (BO n° 14 du 2 avril 2026) :
// ensemble de définition, fonctions carré, inverse, racine carrée et cube (courbes, variations, signe, parité),
// tableaux de variations et de signes, résolution graphique de f(x) = k, f(x) < k, f(x) < g(x).
// Chaque niveau est assemblé à partir de « formes » d'exercices (voir outils.js) : le cours montre un exemple corrigé de
// chaque forme que le niveau peut tirer.
import { LV1, LV2, LV3 } from './a.js';
import { LV4, LV5, LV6 } from './b.js';
import { LV7, LV8, LV9 } from './c.js';
import { LV10, LV11, LV12 } from './d.js';

export const LEVELS = [LV1, LV2, LV3, LV4, LV5, LV6, LV7, LV8, LV9, LV10, LV11, LV12];
export const OPTIONS = { need: 4, keys: { neg: true, comma: true } };

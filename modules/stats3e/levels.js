// Statistiques de 3e (4e – 3e) : 12 niveaux, du tableau d'effectifs à la comparaison de deux séries par boîtes à moustaches.
// Règle des quartiles du collège : Q1 est la plus petite valeur telle qu'au moins 25 % des valeurs lui soient inférieures
// ou égales (rang n/4 arrondi au supérieur), Q3 idem avec 75 %. Chaque exercice a son visuel SVG (diagramme en barres,
// cases, boîte à moustaches relue par les tests). Vérifications indépendantes : comptage direct des valeurs (stat.js),
// lecture des dessins (parseBars, readBox). Un fichier par groupe de trois niveaux : n1.js … n4.js.
import { L1, C1, L2, C2, L3, C3 } from './n1.js';
import { L4, C4, L5, C5, L6, C6 } from './n2.js';
import { L7, C7, L8, C8, L9, C9 } from './n3.js';
import { L10, C10, L11, C11, L12, C12 } from './n4.js';

export const LEVELS = [
  { titre: 'Lire un tableau d\'effectifs : effectif total et fréquences', generate: L1, cours: C1, classe: '4e' },
  { titre: 'Effectifs cumulés croissants', generate: L2, cours: C2, classe: '4e' },
  { titre: 'Fréquences cumulées en pourcentage', generate: L3, cours: C3, classe: '3e' },
  { titre: 'Médiane d\'une série en liste', generate: L4, cours: C4, classe: '4e' },
  { titre: 'Médiane à partir d\'un tableau d\'effectifs', generate: L5, cours: C5, classe: '3e' },
  { titre: 'Premier et troisième quartiles d\'une série en liste', generate: L6, cours: C6, classe: '3e' },
  { titre: 'Quartiles à partir d\'un tableau ou d\'un diagramme', generate: L7, cours: C7, classe: '3e' },
  { titre: 'Écart interquartile et étendue', generate: L8, cours: C8, classe: '3e' },
  { titre: 'Lire une boîte à moustaches', generate: L9, cours: C9, classe: '3e' },
  { titre: 'Construire une boîte à moustaches', generate: L10, cours: C10, classe: '3e' },
  { titre: 'Comparer deux séries', generate: L11, cours: C11, classe: '3e' },
  { titre: 'Valeurs extrêmes et problèmes de synthèse', generate: L12, cours: C12, classe: '3e' },
];
export const OPTIONS = { need: 4, keys: { neg: false, comma: false } };

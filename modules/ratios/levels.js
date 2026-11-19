// Ratios et fractions (4e – 3e) : 12 niveaux, de la fraction-quotient aux partages proportionnels.
// Une difficulté nouvelle par niveau ; dans un niveau, les exercices se corsent avec d (série de réussites en cours).
// Vérifications indépendantes : `value` / `verify` sont recalculés en flottants à partir des données de l'énoncé.
// Cours : chaque exemple est fabriqué par la MÊME fonction que l'exercice (mêmes formes, même présentation de la réponse).
import { L1, C1, L2, C2, L3, C3, L4, C4, L5, C5, L6, C6 } from './niveaux1.js';
import { L7, C7, L8, C8, L9, C9, L10, C10, L11, C11, L12, C12 } from './niveaux2.js';

export const LEVELS = [
  { titre: 'La fraction, un quotient', generate: L1, cours: C1, classe: '6e' },
  { titre: "Fraction d'une fraction", generate: L2, cours: C2, classe: '4e' },
  { titre: "Inverse d'un nombre", generate: L3, cours: C3, classe: '4e' },
  { titre: 'Diviser par une fraction', generate: L4, cours: C4, classe: '4e' },
  { titre: 'Calculs enchaînés avec des fractions', generate: L5, cours: C5, classe: '4e' },
  { titre: 'Problèmes avec des fractions', generate: L6, cours: C6, classe: '4e' },
  { titre: 'Lire et écrire un ratio', generate: L7, cours: C7, classe: '4e' },
  { titre: 'Ratio et quantités', generate: L8, cours: C8, classe: '4e' },
  { titre: 'Partager en deux parts', generate: L9, cours: C9, classe: '3e' },
  { titre: 'Partager en trois parts', generate: L10, cours: C10, classe: '3e' },
  { titre: 'Âges, mises, durées', generate: L11, cours: C11, classe: '3e' },
  { titre: 'Défis : ratio, fraction, pourcentage', generate: L12, cours: C12, classe: '3e' },
];
export const OPTIONS = { need: 4, keys: { neg: false } };

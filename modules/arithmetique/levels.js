// Arithmétique (5e – 3e) : 12 niveaux, des multiples aux petites preuves sur les nombres pairs et impairs.
// Une difficulté nouvelle par niveau ; dans un niveau, les paramètres s'élargissent avec d (série de réussites).
// Vérifications indépendantes : `value` / `verify` recalculés par force brute (diviseurs, crible, boucles).
import { L1, C1, L2, C2, L3, C3, L4, C4, L5, C5, L6, C6 } from './niveaux1.js';
import { L7, C7, L8, C8, L9, C9, L10, C10, L11, C11, L12, C12 } from './niveaux2.js';

export const LEVELS = [
  { titre: 'Multiples d\'un nombre', generate: L1, cours: C1, classe: '5e' },
  { titre: 'Diviseurs d\'un nombre', generate: L2, cours: C2, classe: '5e' },
  { titre: 'Divisibilité par 2, 5 et 10', generate: L3, cours: C3, classe: '6e – 5e' },
  { titre: 'Divisibilité par 3 et par 9', generate: L4, cours: C4, classe: '5e' },
  { titre: 'Division euclidienne', generate: L5, cours: C5, classe: '5e' },
  { titre: 'Nombres premiers', generate: L6, cours: C6, classe: '3e' },
  { titre: 'Décomposition en facteurs premiers', generate: L7, cours: C7, classe: '3e' },
  { titre: 'Diviseurs communs et PGCD', generate: L8, cours: C8, classe: '3e' },
  { titre: 'Fractions irréductibles', generate: L9, cours: C9, classe: '3e' },
  { titre: 'Partager en paquets identiques', generate: L10, cours: C10, classe: '3e' },
  { titre: 'Multiples communs et PPCM', generate: L11, cours: C11, classe: '3e' },
  { titre: 'Défis : pair, impair, preuves', generate: L12, cours: C12, classe: '4e – 3e' },
];
export const OPTIONS = { need: 4, keys: { neg: false } };

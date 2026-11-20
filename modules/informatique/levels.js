// Pensée informatique (6e – 3e) : 12 niveaux de lecture de programmes par blocs (type « Scratch », dessinés en SVG).
// Une difficulté nouvelle par niveau ; dans un niveau, les programmes se corsent avec d (série de réussites).
// Fichiers : lang.js (arbre du programme, interpréteur pas à pas, tableau de suivi), blocs.js (dessin SVG), verif.js
// (vérification indépendante : le programme est traduit en JavaScript), outils.js, niveaux1/2/3.js (les niveaux et leur cours).
import { L1, C1, L2, C2, L3, C3, L4, C4 } from './niveaux1.js';
import { L5, C5, L6, C6, L7, C7, L8, C8 } from './niveaux2.js';
import { L9, C9, L10, C10, L11, C11, L12, C12 } from './niveaux3.js';

export const LEVELS = [
  { titre: 'Une séquence d\'instructions', generate: L1, cours: C1, classe: '6e' },
  { titre: 'L\'ordre des instructions', generate: L2, cours: C2, classe: '6e' },
  { titre: 'Un programme de calcul en blocs', generate: L3, cours: C3, classe: '6e – 5e' },
  { titre: 'La boucle « répéter n fois »', generate: L4, cours: C4, classe: '6e – 5e' },
  { titre: 'Les variables', generate: L5, cours: C5, classe: '5e' },
  { titre: 'Une variable dans une boucle', generate: L6, cours: C6, classe: '5e – 4e' },
  { titre: 'La condition « si … alors »', generate: L7, cours: C7, classe: '5e – 4e' },
  { titre: '« si … alors … sinon »', generate: L8, cours: C8, classe: '5e – 4e' },
  { titre: 'Conditions composées : et, ou', generate: L9, cours: C9, classe: '4e' },
  { titre: 'La boucle « répéter jusqu\'à »', generate: L10, cours: C10, classe: '4e – 3e' },
  { titre: 'Trouver l\'erreur, modifier un programme', generate: L11, cours: C11, classe: '4e – 3e' },
  { titre: 'Défis : algorithmes', generate: L12, cours: C12, classe: '3e' },
];
export const OPTIONS = { need: 4, keys: { neg: false } };

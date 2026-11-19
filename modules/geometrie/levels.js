// Géométrie plane (6e – 4e) : 12 niveaux. Chaque exercice a sa figure SVG générée à partir de coordonnées (draw.js) ;
// les réponses sont recalculées autrement (géométrie analytique, force brute) dans `value` ou `verify`, ce qui sert de
// vérification indépendante aux tests. Un niveau par fichier : l01.js … l12.js (générateur Ln, cours Cn).
import { L1, C1 } from './l01.js';
import { L2, C2 } from './l02.js';
import { L3, C3 } from './l03.js';
import { L4, C4 } from './l04.js';
import { L5, C5 } from './l05.js';
import { L6, C6 } from './l06.js';
import { L7, C7 } from './l07.js';
import { L8, C8 } from './l08.js';
import { L9, C9 } from './l09.js';
import { L10, C10 } from './l10.js';
import { L11, C11 } from './l11.js';
import { L12, C12 } from './l12.js';

export const LEVELS = [
  { titre: 'Droite, demi-droite, segment ; parallèles et perpendiculaires', generate: L1, cours: C1, classe: '6e' },
  { titre: 'Symétrie axiale sur quadrillage', generate: L2, cours: C2, classe: '6e' },
  { titre: 'Symétrie axiale : longueurs, angles, aires', generate: L3, cours: C3, classe: '6e' },
  { titre: 'Médiatrice d\'un segment', generate: L4, cours: C4, classe: '6e' },
  { titre: 'Symétrie centrale : image d\'un point', generate: L5, cours: C5, classe: '5e' },
  { titre: 'Propriétés de la symétrie centrale', generate: L6, cours: C6, classe: '5e' },
  { titre: 'Inégalité triangulaire', generate: L7, cours: C7, classe: '5e' },
  { titre: 'Droites remarquables du triangle', generate: L8, cours: C8, classe: '5e' },
  { titre: 'Parallélogramme', generate: L9, cours: C9, classe: '5e' },
  { titre: 'Rectangle, losange, carré', generate: L10, cours: C10, classe: '5e' },
  { titre: 'Aire du parallélogramme et figures composées', generate: L11, cours: C11, classe: '5e' },
  { titre: 'Droite des milieux', generate: L12, cours: C12, classe: '4e' },
];
export const OPTIONS = { need: 4, keys: { neg: false, comma: false } };

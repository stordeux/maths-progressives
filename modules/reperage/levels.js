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
  { titre: 'Lire les coordonnées d\'un point', generate: L1, cours: C1, classe: '6e' },
  { titre: 'Coordonnées relatives, points sur les axes', generate: L2, cours: C2, classe: '5e' },
  { titre: 'Placer un point', generate: L3, cours: C3, classe: '5e' },
  { titre: 'Coordonnées non entières', generate: L4, cours: C4, classe: '5e' },
  { titre: 'Milieu et distances dans un repère', generate: L5, cours: C5, classe: '4e' },
  { titre: 'Reconnaître les solides', generate: L6, cours: C6, classe: '6e' },
  { titre: 'Perspective cavalière', generate: L7, cours: C7, classe: '5e' },
  { titre: 'Patrons du cube et du pavé', generate: L8, cours: C8, classe: '5e' },
  { titre: 'Patrons du prisme, du cylindre et de la pyramide', generate: L9, cours: C9, classe: '4e' },
  { titre: 'Se repérer dans un pavé droit', generate: L10, cours: C10, classe: '3e' },
  { titre: 'Sections planes', generate: L11, cours: C11, classe: '3e' },
  { titre: 'Sphère, boule et repérage sur la Terre', generate: L12, cours: C12, classe: '3e' },
];
export const OPTIONS = { need: 4, keys: { neg: false, comma: false } };

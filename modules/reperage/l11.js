// Niveau 11 : sections planes du pavé, du cylindre et du cône : nature et dimensions. 3e.
import { solide, pave3, dist3 } from './draw.js';
import { dessin } from './solides.js';
import { numQ, choiceQ, ex, rep, warn, retenir, meth, def, cours, pick, ri } from './util.js';

const note = ' (figure non à l\'échelle)';
const TRI = [[5, 3, 4], [5, 4, 3], [10, 6, 8], [10, 8, 6], [13, 5, 12], [13, 12, 5]];
/** section d'un pavé L × h × l par un plan parallèle à une face : polygone 3D */
function plan(L, h, l, face) {
  if (face === 'dessus') return [[0, h / 2, 0], [L, h / 2, 0], [L, h / 2, l], [0, h / 2, l]];
  if (face === 'devant') return [[0, 0, l / 2], [L, 0, l / 2], [L, h, l / 2], [0, h, l / 2]];
  return [[L / 2, 0, 0], [L / 2, 0, l], [L / 2, h, l], [L / 2, h, 0]];
}
const FACE = { dessus: 'du dessus', devant: 'de devant', cote: 'de droite' };
const sides = pts => pts.map((p, i) => Math.round(dist3(p, pts[(i + 1) % pts.length]) * 1e6) / 1e6);
const sec = pts => [{ pts, fill: '#f97316', c: '#c2410c' }];

export function L11(d) {
  const f = pick(d < 1 ? ['nature'] : d < 2 ? ['nature', 'pave'] : d < 3 ? ['nature', 'pave', 'cylPerp', 'cylAxe'] : ['nature', 'pave', 'cylPerp', 'cylAxe', 'cylPar']);
  if (f === 'nature') {
    const k = pick(['cube', 'pave', 'cylPerp', 'cylPar', 'conePerp', 'coneApex']);
    const L = ri(3, 6), h = ri(2, 5), l = ri(3, 6), a = k === 'cube' ? L : L;
    let visual, solid, plane, good, hint, sol;
    if (k === 'cube' || k === 'pave') {
      const face = pick(['dessus', 'devant', 'cote']), dd = k === 'cube' ? [a, a, a] : [L, h, l];
      visual = solide({ S: pave3(dd[0], dd[1], dd[2]), sec: sec(plan(dd[0], dd[1], dd[2], face)), maxW: 270, maxH: 200 });
      solid = k === 'cube' ? 'un cube' : 'un pavé droit'; plane = `parallèle à la face ${FACE[face]}`; good = k === 'cube' ? 'carre' : 'rect';
      hint = `Une section parallèle à une face a la même forme et les mêmes dimensions que cette face. Quelle est la forme de la face ${FACE[face]} d'${k === 'cube' ? 'un cube' : 'un pavé droit'} ?`;
      sol = k === 'cube' ? `La section est identique à la face ${FACE[face]} : un carré.` : `La section est identique à la face ${FACE[face]} : un rectangle.`;
    } else if (k === 'cylPerp') {
      visual = dessin('cylindre', { r: 2, h: 4, sec: { t: 'perp', y: 2 } }); solid = 'un cylindre'; plane = 'perpendiculaire à son axe'; good = 'disque';
      hint = `Le plan est perpendiculaire à l'axe du cylindre : il coupe parallèlement aux bases. Quelle est la forme des bases ?`; sol = `Une section perpendiculaire à l'axe a la forme des bases : un disque.`;
    } else if (k === 'cylPar') {
      visual = dessin('cylindre', { r: 2, h: 4, sec: { t: 'axe' } }); solid = 'un cylindre'; plane = 'parallèle à son axe'; good = 'rect';
      hint = `Le plan est parallèle à l'axe du cylindre : il découpe la surface latérale le long de deux génératrices (droites verticales). Quelle forme obtient-on ?`; sol = `Un plan parallèle à l'axe coupe le cylindre selon un rectangle.`;
    } else if (k === 'conePerp') {
      visual = dessin('cone', { r: 2, h: 4, sec: { t: 'perp', y: 1.6 } }); solid = 'un cône'; plane = 'perpendiculaire à son axe'; good = 'disque';
      hint = `Le plan est parallèle à la base du cône. Quelle est la forme de la base ? La section lui ressemble (en plus petit).`; sol = `Une section parallèle à la base d'un cône est un disque (plus petit que la base).`;
    } else {
      visual = dessin('cone', { r: 2, h: 4, sec: { t: 'apex' } }); solid = 'un cône'; plane = 'qui contient son sommet et son axe'; good = 'tri';
      hint = `Le plan passe par le sommet et par le centre de la base. Il coupe la base selon un diamètre : quels sont les trois sommets de la figure obtenue ?`; sol = `La section est limitée par deux génératrices et un diamètre de la base : un triangle isocèle.`;
    }
    return choiceQ({
      keep: true, opts: [{ v: 'disque', l: 'un <b>disque</b>' }, { v: 'rect', l: 'un <b>rectangle</b>' }, { v: 'carre', l: 'un <b>carré</b>' }, { v: 'tri', l: 'un <b>triangle</b>' }], good, visual, html: `On coupe ${solid} par un plan ${plane}. Quelle est la nature de la section (en orange) ?${note}`,
      hint, solution: sol, msg: v => (good === 'rect' && v === 'carre' ? `Ce n'est un carré que si les deux côtés sont égaux : ici ils sont en général différents.` : good === 'carre' && v === 'rect' ? `Un carré est un rectangle particulier, mais ici les côtés sont égaux : réponds « carré ».` : ''), verify: E => E === good,
    });
  }
  if (f === 'pave') {
    let L = ri(3, 8), h = ri(2, 6), l = ri(3, 7);
    const face = pick(['dessus', 'devant', 'cote']), pts = plan(L, h, l, face), s = sides(pts), E = [Math.max(s[0], s[1]), Math.min(s[0], s[1])];
    const dd = { dessus: [L, l], devant: [L, h], cote: [l, h] }[face];
    return numQ({
      E, tpl: `rectangle de {0} cm sur {1} cm`, neg: false, visual: solide({ S: pave3(L, h, l), sec: sec(pts), maxW: 280, maxH: 210 }),
      html: `On coupe un pavé droit de dimensions ${L} cm, ${h} cm (hauteur) et ${l} cm (profondeur) par un plan parallèle à sa face ${FACE[face]}. La section est un rectangle : donne ses dimensions (la plus grande en premier).${note}`,
      hint: `Une section parallèle à une face a les mêmes dimensions que cette face. Quelles sont les deux dimensions de la face ${FACE[face]} parmi ${L} cm, ${h} cm et ${l} cm ? (la hauteur est la dimension verticale, la profondeur celle qui s'enfonce)`,
      solution: `La section est identique à la face ${FACE[face]}, qui mesure ${dd[0]} cm sur ${dd[1]} cm. Donc ${E[0]} cm sur ${E[1]} cm.`,
      msg: v => (v[0] === E[1] && v[1] === E[0] && E[0] !== E[1] ? `Les deux nombres sont bons ; écris d'abord le plus grand.` : ''),
      verify: E2 => { const t = sides(pts); return Math.max(t[0], t[1]) === E2[0] && Math.min(t[0], t[1]) === E2[1]; },
    });
  }
  const r = ri(2, 7), h = ri(3, 9);
  if (f === 'cylPerp') {
    return numQ({
      E: [r], tpl: `disque de rayon {0} cm`, neg: false, visual: dessin('cylindre', { r, h, sec: { t: 'perp', y: h / 2 } }), html: `On coupe un cylindre de rayon ${r} cm et de hauteur ${h} cm par un plan perpendiculaire à son axe. La section est un disque : quel est son rayon ?${note}`,
      hint: `Le plan coupe parallèlement aux bases : la section est identique à une base. Quel est le rayon d'une base du cylindre (${r} cm ou ${h} cm : l'un est le rayon, l'autre la hauteur) ?`,
      solution: `La section est un disque identique aux bases : rayon ${r} cm.`, msg: v => (v[0] === h ? `${h} cm est la hauteur du cylindre ; le rayon est ${r} cm.` : ''), verify: E => E[0] === r,
    });
  }
  if (f === 'cylAxe') {
    const E = [Math.max(2 * r, h), Math.min(2 * r, h)];
    return numQ({
      E, tpl: `rectangle de {0} cm sur {1} cm`, neg: false, visual: dessin('cylindre', { r, h, sec: { t: 'axe' } }), html: `On coupe un cylindre de rayon ${r} cm et de hauteur ${h} cm par un plan qui contient son axe. La section est un rectangle : donne ses dimensions (la plus grande en premier).${note}`,
      hint: `Un côté du rectangle est une hauteur du cylindre (${h} cm). L'autre côté est un diamètre de la base : à partir du rayon ${r} cm, quelle est sa longueur ?`,
      solution: `Côtés du rectangle : la hauteur ${h} cm et le diamètre 2 × ${r} = ${2 * r} cm. Donc ${E[0]} cm sur ${E[1]} cm.`,
      msg: v => (v[0] === Math.max(r, h) && v[1] === Math.min(r, h) ? `Tu as pris le rayon : la largeur du rectangle est le diamètre (2 × rayon).` : ''),
      verify: E2 => Math.abs(Math.max(h, 2 * r) - E2[0]) < 1e-9 && Math.abs(Math.min(h, 2 * r) - E2[1]) < 1e-9,
    });
  }
  const [R, a, c] = pick(TRI), hh = ri(4, 9);
  return numQ({
    E: [2 * c], tpl: `largeur = {0} cm`, neg: false, visual: dessin('cylindre', { r: R, h: hh, sec: { t: 'par', a } }),
    html: `On coupe un cylindre de rayon ${R} cm et de hauteur ${hh} cm par un plan parallèle à son axe, situé à ${a} cm de l'axe. La section est un rectangle de hauteur ${hh} cm : quelle est sa largeur ?${note}`,
    hint: `Dans un disque de base de rayon ${R} cm, la section est une corde située à ${a} cm du centre. Moitié de la corde, distance ${a} cm au centre et rayon ${R} cm forment un triangle rectangle : utilise le théorème de Pythagore, puis double.`,
    solution: `Demi-largeur : √(${R}² − ${a}²) = √${R * R - a * a} = ${c} cm. Largeur : 2 × ${c} = ${2 * c} cm.`,
    msg: v => (v[0] === c ? `${c} cm est la demi-largeur : la largeur du rectangle est le double.` : v[0] === R - a ? `On ne soustrait pas simplement les longueurs : utilise Pythagore avec ${R}² − ${a}².` : ''),
    verify: E => Math.abs(E[0] / 2 - Math.sqrt(R * R - a * a)) < 1e-9,
  });
}

export function C11() {
  const S = pave3(5, 3, 4);
  return cours('11. Sections planes', `Couper un solide par un plan, c'est regarder la <b>forme de la tranche</b> obtenue : c'est la <b>section</b>.`,
    def(`Section d'un <b>pavé</b> par un plan parallèle à une face : un rectangle identique à cette face (un carré pour un cube). Section d'un <b>cylindre</b> : perpendiculaire à l'axe, un disque identique aux bases ; parallèle à l'axe, un rectangle (si le plan contient l'axe, ses côtés sont la hauteur et le diamètre). Section d'un <b>cône</b> : parallèle à la base, un disque plus petit ; par le sommet et l'axe, un triangle.`),
    solide({ S, sec: sec(plan(5, 3, 4, 'dessus')), maxW: 280, maxH: 210 }),
    meth(`Repère la position du plan par rapport à une face ou à l'axe.`, `Applique la règle : parallèle à une face (même forme que la face) ; perpendiculaire à l'axe (disque) ; parallèle à l'axe (rectangle).`),
    ex(`Exemple 1 : on coupe un cylindre par un plan parallèle à son axe ; nature de la section`, `Le plan découpe la surface latérale selon des droites : on obtient un rectangle.<br>${rep('un rectangle')}`),
    ex(`Exemple 2 : on coupe un cône par un plan qui contient son sommet et son axe ; nature de la section`, `La section est limitée par deux génératrices et un diamètre de la base : un triangle.<br>${rep('un triangle')}`),
    ex(`Exemple 2 quater : on coupe un pavé droit par un plan parallèle à la face de devant ; nature de la section`, `La section est identique à la face de devant, qui est un rectangle.<br>${rep('un rectangle')}`),
    ex(`Exemple 2 bis : on coupe un cube par un plan parallèle à la face du dessus ; nature de la section`, `La section est identique à une face du cube : un carré.<br>${rep('un carré')}`),
    ex(`Exemple 2 ter : on coupe un cône par un plan perpendiculaire à son axe ; nature de la section`, `Le plan est parallèle à la base : la section est un disque, plus petit que la base.<br>${rep('un disque')}`),
    dessin('cylindre', { r: 3, h: 6, sec: { t: 'perp', y: 3 } }),
    ex(`Exemple 3 : on coupe un cylindre de rayon 3 cm et de hauteur 6 cm par un plan perpendiculaire à son axe ; rayon du disque`, `La section est identique à une base : un disque de rayon 3 cm.<br>${rep('disque de rayon 3 cm')}`),
    ex(`Exemple 4 : pavé de dimensions 5 cm, 3 cm (hauteur) et 4 cm (profondeur), coupé parallèlement à la face du dessus ; dimensions de la section`, `Le dessus mesure 5 cm sur 4 cm : la section est identique.<br>${rep('rectangle de 5 cm sur 4 cm')}`),
    dessin('cylindre', { r: 3, h: 6, sec: { t: 'axe' } }),
    ex(`Exemple 5 : cylindre de rayon 3 cm et de hauteur 6 cm coupé par un plan qui contient son axe ; dimensions du rectangle`, `Côtés : la hauteur 6 cm et le diamètre 2 × 3 = 6 cm (ici égaux : c'est même un carré).<br>${rep('rectangle de 6 cm sur 6 cm')}`),
    dessin('cylindre', { r: 5, h: 6, sec: { t: 'par', a: 3 } }),
    ex(`Exemple 6 : cylindre de rayon 5 cm coupé par un plan parallèle à l'axe, à 3 cm de l'axe ; largeur de la section`, `Demi-largeur : √(5² − 3²) = √16 = 4 cm. Largeur : 2 × 4 = 8 cm.<br>${rep('largeur = 8 cm')}`),
    warn(`Un plan parallèle à l'axe qui ne contient pas l'axe donne un rectangle <b>plus étroit</b> que le diamètre.`, `Ne confonds pas hauteur et profondeur d'un pavé quand tu cherches les dimensions de la section.`),
    retenir(`section parallèle à une face : même forme que la face ; cylindre : disque ⟂ à l'axe, rectangle ∥ à l'axe ; cône : disque ∥ à la base.`));
}

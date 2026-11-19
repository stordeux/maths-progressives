// Niveau 9 : patrons du prisme, du cylindre (longueur du rectangle = périmètre du disque), de la pyramide et du cône. 4e.
import { plat, COL } from './draw.js';
import { numQ, choiceQ, ex, rep, warn, retenir, meth, def, cours, pick, ri, M } from './util.js';

const PI = 3.14, R2 = x => Math.round(x * 100) / 100;
const POLY = { 3: 'triangle', 4: 'carré', 5: 'pentagone', 6: 'hexagone' };
const NOM = { 3: 'un triangle', 4: 'un carré', 5: 'un pentagone', 6: 'un hexagone' };
const F1 = '#bfdbfe', F2 = '#fed7aa', F3 = '#bbf7d0';

/** polygone régulier de côté s dont un côté va de A vers A + s·u (dans le sens trigonométrique) */
function polyCote(n, s, A, ang) {
  const P = [[A[0], A[1]]]; let p = [A[0], A[1]], a = ang;
  for (let i = 1; i < n; i++) { p = [p[0] + s * Math.cos(a), p[1] + s * Math.sin(a)]; P.push(p); a += 2 * Math.PI / n; }
  return P;
}
const rect = (x, y, w, h, fill) => ({ p: [[x, y], [x + w, y], [x + w, y + h], [x, y + h]], fill });

/** patron du cylindre : disques de rayon r, rectangle L × h ; lr : texte sur le disque, lL : texte sur le rectangle */
export function netCyl(r, h, L, lr, lL, lh, dia) {
  const cx = L * 0.3, seg = dia ? [{ a: [cx - r, h + r], b: [cx + r, h + r], c: COL.a, w: 2.5 }, { a: [L - cx - r, -r], b: [L - cx + r, -r], c: COL.a, w: 2.5 }] : [{ a: [cx, h + r], b: [cx + r, h + r], c: COL.a, w: 2.5 }, { a: [L - cx, -r], b: [L - cx + r, -r], c: COL.a, w: 2.5 }];
  const texts = [];
  if (lr) texts.push({ p: [cx + (dia ? 0 : r / 2), h + r], s: lr, c: COL.a, fs: 15, dy: -13 });
  if (lL) texts.push({ p: [L / 2, h / 2], s: lL, c: COL.ink, fs: 16, dy: lh ? -9 : 0 });
  if (lh) texts.push({ p: [L / 2, h / 2], s: 'hauteur ' + lh, c: COL.ink, fs: 14, dy: lL ? 11 : 0 });
  return plat({ polys: [rect(0, 0, L, h, F1)], circles: [{ c: [cx, h + r], r, fill: F2 }, { c: [L - cx, -r], r, fill: F2 }], segs: seg, texts, maxW: 360, maxH: 260, aria: "patron d'un cylindre : un rectangle et deux disques" });
}
/** patron d'un prisme droit à base régulière à n côtés (côté s, hauteur h) */
export function netPrisme(n, s, h, i = 1, j = 2) {
  const polys = Array.from({ length: n }, (_, k) => rect(k * s, 0, s, h, F1));
  polys.push({ p: polyCote(n, s, [i * s, h], 0), fill: F2 }, { p: polyCote(n, s, [(j + 1) * s, 0], Math.PI), fill: F2 });
  return { svg: plat({ polys, maxW: 380, maxH: 250, aria: `patron d'un prisme droit dont la base a ${n} côtés` }), polys };
}
/** patron d'une pyramide régulière à base à n côtés (côté s, hauteur de face t) */
export function netPyr(n, s, t) {
  const B = polyCote(n, s, [0, 0], 0), polys = [{ p: B, fill: F2 }];
  const cen = [B.reduce((q, p) => q + p[0], 0) / n, B.reduce((q, p) => q + p[1], 0) / n];
  for (let k = 0; k < n; k++) {
    const a = B[k], b = B[(k + 1) % n], m = [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
    let nx = m[0] - cen[0], ny = m[1] - cen[1]; const l = Math.hypot(nx, ny); nx /= l; ny /= l;
    polys.push({ p: [a, b, [m[0] + t * nx, m[1] + t * ny]], fill: F1 });
  }
  return { svg: plat({ polys, maxW: 330, maxH: 280, aria: `patron d'une pyramide dont la base a ${n} côtés` }), polys };
}
/** patron d'un cône : secteur de rayon g et disque de rayon r */
export function netCone(r, g) {
  const th = 2 * Math.PI * r / g, pts = [[0, 0]];
  for (let i = 0; i <= 40; i++) { const a = Math.PI / 2 - th / 2 + th * i / 40; pts.push([g * Math.cos(a), g * Math.sin(a)]); }
  return plat({ polys: [{ p: pts, fill: F1 }], circles: [{ c: [0, g + r], r, fill: F2 }], maxW: 300, maxH: 280, aria: 'patron d\'un cône : un secteur de disque et un disque' });
}

export function L9(d) {
  const f = pick(d < 1 ? ['cylL'] : d < 2 ? ['cylL', 'nomP'] : d < 3 ? ['cylL', 'nomP', 'prisme', 'pyr'] : ['cylL', 'nomP', 'prisme', 'pyr', 'cylLd', 'cylR']);
  if (f === 'cylL' || f === 'cylLd' || f === 'cylR') {
    const r = ri(2, 8), h = ri(3, 8), L = R2(2 * PI * r), dm = 2 * r;
    if (f === 'cylL') {
      return numQ({
        E: [L], tpl: `{0} cm`, neg: false, keys: { comma: true }, visual: netCyl(r, h, L, `r = ${r} cm`, 'longueur ?', `${h} cm`),
        html: `Le patron d'un cylindre de rayon ${r} cm et de hauteur ${h} cm est formé de deux disques et d'un rectangle. Quelle est la longueur du rectangle ? (utilise π ≈ 3,14 ; figure non à l'échelle)`,
        hint: `Quand on enroule le rectangle, sa longueur fait exactement le tour d'un disque de rayon ${r} cm : c'est le périmètre du disque. Quelle formule donne le périmètre d'un cercle de rayon ${r} ?`,
        solution: `La longueur du rectangle est le périmètre du disque de base : 2 × π × ${r} ≈ 2 × 3,14 × ${r} = ${M(L)} cm.`,
        msg: v => (Math.abs(v[0] - PI * r) < 0.011 ? `Tu as calculé π × ${r} : le périmètre d'un cercle est 2 × π × rayon (ou π × diamètre).` : Math.abs(v[0] - PI * r * r) < 0.011 ? `C'est l'aire du disque (π × r × r) : on cherche son périmètre, la longueur du tour.` : ''),
        verify: E => Math.abs(E[0] - 2 * Math.PI * r) < 0.01 * E[0] && Math.abs(E[0] - 2 * PI * r) < 1e-9,
      });
    }
    if (f === 'cylLd') {
      return numQ({
        E: [R2(PI * dm)], tpl: `{0} cm`, neg: false, keys: { comma: true }, visual: netCyl(r, h, L, `d = ${dm} cm`, 'longueur ?', `${h} cm`, true),
        html: `Le patron d'un cylindre de diamètre ${dm} cm et de hauteur ${h} cm est formé de deux disques et d'un rectangle. Quelle est la longueur du rectangle ? (utilise π ≈ 3,14 ; figure non à l'échelle)`,
        hint: `La longueur du rectangle est le périmètre d'un disque de diamètre ${dm} cm. Le périmètre d'un cercle se calcule directement avec son diamètre : π × diamètre.`,
        solution: `Longueur du rectangle = périmètre du disque = π × diamètre ≈ 3,14 × ${dm} = ${M(R2(PI * dm))} cm.`,
        msg: v => (Math.abs(v[0] - 2 * PI * dm) < 0.011 ? `Tu as multiplié par 2 en trop : avec le diamètre, le périmètre est π × ${dm} (sans le 2).` : ''),
        verify: E => Math.abs(E[0] - Math.PI * dm) < 0.01 * E[0] && Math.abs(E[0] - PI * dm) < 1e-9,
      });
    }
    return numQ({
      E: [r], tpl: `r = {0} cm`, neg: false, visual: netCyl(r, h, L, 'r = ?', `${M(L)} cm`, `${h} cm`),
      html: `Dans le patron d'un cylindre, le rectangle mesure ${M(L)} cm de long et ${h} cm de large. Quel est le rayon d'un disque ? (π ≈ 3,14 ; figure non à l'échelle)`,
      hint: `La longueur ${M(L)} cm est le périmètre du disque : 2 × π × r = ${M(L)}. Pour trouver r, divise ${M(L)} par 2 × 3,14.`,
      solution: `${M(L)} = 2 × π × r ≈ 6,28 × r, donc r = ${M(L)} ÷ 6,28 = ${r} cm.`,
      msg: v => (Math.abs(v[0] - L / PI) < 0.011 ? `Tu as divisé par π seulement : ${M(L)} ÷ 3,14 donne le diamètre. Le rayon est la moitié.` : ''),
      verify: E => Math.abs(2 * Math.PI * E[0] - L) < 0.01 * L && Math.abs(2 * PI * E[0] - L) < 1e-9,
    });
  }
  if (f === 'nomP') {
    const k = pick(['cylindre', 'cone', 'prisme', 'pyramide']), n = k === 'prisme' ? pick([3, 5, 6]) : pick([3, 4, 5]), r = ri(2, 4);
    let svg;
    if (k === 'cylindre') svg = netCyl(r, ri(3, 6), R2(2 * PI * r), '', '', '').replace(/<text[^>]*><\/text>/g, '');
    else if (k === 'cone') svg = netCone(r, r * ri(2, 3));
    else if (k === 'prisme') svg = netPrisme(n, 2, ri(3, 5), ri(0, n - 1), ri(0, n - 1)).svg;
    else svg = netPyr(n, 2, 3).svg;
    const hints = {
      cylindre: `Compte les disques du patron, puis regarde la forme de la partie qui n'est pas un disque : un rectangle, un secteur ou des triangles ?`,
      cone: `Compte les disques, puis regarde la forme de la partie qui n'est pas un disque : elle est arrondie d'un côté (comme une part de camembert).`,
      prisme: `Repère les ${n} rectangles alignés en bande et les deux polygones identiques placés de chaque côté de la bande : combien de côtés ont-ils ?`,
      pyramide: `Repère le polygone central (${n} côtés) et les triangles accolés à chacun de ses côtés : ils se rejoignent en un sommet une fois le patron plié.`,
    };
    const sol = { cylindre: `Deux disques et un rectangle : c'est le patron d'un <b>cylindre</b>.`, cone: `Un disque et un secteur de disque : c'est le patron d'un <b>cône</b>.`, prisme: `Une bande de ${n} rectangles et deux polygones à ${n} côtés identiques : c'est le patron d'un <b>prisme droit</b>.`, pyramide: `Un polygone à ${n} côtés entouré de ${n} triangles : c'est le patron d'une <b>pyramide</b>.` };
    return choiceQ({
      keep: true, opts: [{ v: 'prisme', l: 'un <b>prisme droit</b>' }, { v: 'pyramide', l: 'une <b>pyramide</b>' }, { v: 'cylindre', l: 'un <b>cylindre</b>' }, { v: 'cone', l: 'un <b>cône</b>' }], good: k, visual: svg, html: `Ce patron permet de construire un solide. Lequel ?`,
      hint: hints[k], solution: sol[k],
      msg: v => ({ 'pyramide/prisme': `Une pyramide a des faces triangulaires ; ici ce sont des rectangles.`, 'prisme/pyramide': `Un prisme a deux bases identiques et des rectangles ; ici il y a des triangles qui se rejoignent.`, 'cone/cylindre': `Un cylindre a deux disques ; ici il n'y en a qu'un.`, 'cylindre/cone': `Un cône n'a qu'un disque ; ici il y en a deux.`, 'cylindre/prisme': `Les bases d'un prisme sont des polygones, pas des disques.`, 'prisme/cylindre': `Les bases d'un cylindre sont des disques, pas des polygones.` }[`${k}/${v}`] || ''), verify: E => E === k,
    });
  }
  const n = pick([3, 5, 6]), kind = f;
  if (kind === 'prisme') {
    const s = 2, h = ri(3, 5), i = ri(0, n - 1), j = ri(0, n - 1), N = netPrisme(n, s, h, i, j), tot = pick([false, true]);
    return numQ({
      E: [tot ? n + 2 : n], tpl: tot ? `{0} faces` : `{0} rectangles`, neg: false, visual: N.svg, html: `Voici le patron d'un prisme droit dont les bases ont ${n} côtés. ${tot ? 'Combien de faces ce prisme a-t-il en tout ?' : 'Combien de rectangles le patron compte-t-il ?'}`,
      hint: `Dans le patron, la bande de rectangles entoure le prisme : il y a un rectangle par côté d'une base à ${n} côtés. ${tot ? 'Pense à ajouter les deux bases.' : 'Compte-les dans la bande.'}`,
      solution: `Il y a un rectangle par côté de la base : ${n} rectangles. ${tot ? `En ajoutant les 2 bases : ${n} + 2 = ${n + 2} faces.` : ''}`,
      msg: v => (!tot && v[0] === n + 2 ? `Tu as compté les deux bases : on demande seulement les rectangles.` : tot && v[0] === n ? `Tu n'as compté que les rectangles : ajoute les deux bases.` : ''),
      verify: E => E[0] === N.polys.length - (tot ? 0 : 2),
    });
  }
  const tot = pick([false, true]), m = tot ? pick([3, 4, 5, 6]) : pick([4, 5, 6]), N = netPyr(m, 2, 3);
  return numQ({
    E: [tot ? m + 1 : m], tpl: tot ? `{0} faces` : `{0} triangles`, neg: false, visual: N.svg, html: `Voici le patron d'une pyramide dont la base a ${m} côtés. ${tot ? 'Combien de faces cette pyramide a-t-elle en tout ?' : 'Combien de triangles le patron compte-t-il ?'}`,
    hint: `Chaque côté de la base à ${m} côtés porte un triangle. ${tot ? 'N\'oublie pas la base.' : 'Compte les triangles autour du polygone central.'}`,
    solution: `Il y a un triangle par côté de la base : ${m} triangles. ${tot ? `Avec la base : ${m} + 1 = ${m + 1} faces.` : ''}`,
    msg: v => (!tot && v[0] === m + 1 ? `Tu as compté la base : ce n'est pas un triangle (sauf si elle est triangulaire, mais on demande les faces latérales triangulaires).` : tot && v[0] === m ? `Tu n'as compté que les triangles : ajoute la base.` : ''),
    verify: E => E[0] === N.polys.length - (tot ? 0 : 1),
  });
}

export function C9() {
  void POLY; void NOM; void COL;
  const L5 = R2(2 * PI * 5), L3 = R2(PI * 6);
  return cours('9. Patrons du prisme, du cylindre, de la pyramide et du cône', `Un patron est un solide « aplati ». Pour les solides à surface courbe, la surface latérale se déplie en un <b>rectangle</b> (cylindre) ou en un <b>secteur de disque</b> (cône).`,
    def(`<b>Prisme droit</b> : une bande de rectangles (un par côté de la base) et deux bases identiques. <b>Pyramide</b> : une base et autant de triangles que la base a de côtés. <b>Cylindre</b> : deux disques et un rectangle dont la <b>longueur est égale au périmètre d'un disque</b> : 2 × π × r (ou π × diamètre) ; sa largeur est la hauteur du cylindre. <b>Cône</b> : un disque et un secteur de disque.`),
    netCyl(5, 4, L5, 'r = 5 cm', 'longueur ?', '4 cm'),
    netCyl(3, 4, L3, 'd = 6 cm', 'longueur ?', '4 cm', true),
    ex(`Exemple 1 : cylindre de rayon 5 cm et de hauteur 4 cm ; longueur du rectangle (π ≈ 3,14)`, `La longueur est le périmètre du disque : 2 × π × 5 ≈ 2 × 3,14 × 5 = 31,4 cm.<br>${rep('31,4 cm')}`),
    ex(`Exemple 2 : cylindre de diamètre 6 cm ; longueur du rectangle (π ≈ 3,14)`, `Avec le diamètre : π × 6 ≈ 3,14 × 6 = ${M(L3)} cm.<br>${rep(M(L3) + ' cm')}`),
    ex(`Exemple 3 : le rectangle d'un patron de cylindre mesure 31,4 cm de long ; rayon d'un disque (π ≈ 3,14)`, `31,4 = 2 × π × r ≈ 6,28 × r, donc r = 31,4 ÷ 6,28 = 5 cm.<br>${rep('r = 5 cm')}`),
    netPrisme(5, 2, 4, 1, 3).svg,
    ex(`Exemple 4 : prisme droit dont les bases ont 5 côtés ; combien de rectangles le patron compte-t-il ?`, `Un rectangle par côté de la base : 5 rectangles. En ajoutant les 2 bases pentagonales, le prisme a 7 faces.<br>${rep('5 rectangles')}`),
    netPyr(4, 2, 3).svg,
    ex(`Exemple 5 : pyramide dont la base a 4 côtés ; combien de triangles le patron compte-t-il ?`, `Un triangle par côté de la base : 4 triangles. Avec la base carrée, la pyramide a 5 faces.<br>${rep('4 triangles')}`),
    netCone(2, 5),
    ex(`Exemple 5 bis : voici le patron d'un prisme droit dont les bases ont 6 côtés ; combien de faces ce prisme a-t-il en tout ?`, `6 rectangles + 2 bases hexagonales = 8 faces.<br>${rep('8 faces')}`),
    ex(`Exemple 5 ter : voici le patron d'une pyramide dont la base a 5 côtés ; combien de faces cette pyramide a-t-elle en tout ?`, `5 triangles + 1 base pentagonale = 6 faces.<br>${rep('6 faces')}`),
    ex(`Exemple 5 quater : à quel solide correspond ce patron (un polygone entouré de triangles) ?`, `Un polygone central entouré de triangles qui se rejoignent en un sommet : une pyramide.<br>${rep('une pyramide')}`),
    ex(`Exemple 5 quinquies : à quel solide correspond ce patron (deux disques et un rectangle) ?`, `Le rectangle s'enroule autour des deux disques : un cylindre.<br>${rep('un cylindre')}`),
    ex(`Exemple 6 : à quel solide correspond ce patron (un disque et un secteur de disque) ?`, `Un disque seul et un secteur : le secteur s'enroule en une surface qui se termine en pointe : c'est le patron d'un cône.<br>${rep('un cône')}`),
    ex(`Exemple 7 : à quel solide correspond un patron fait d'une bande de rectangles et de deux polygones identiques ?`, `Les rectangles font le tour des deux bases polygonales identiques : c'est un prisme droit.<br>${rep('un prisme droit')}`),
    warn(`La longueur du rectangle est le <b>périmètre</b> du disque (2 × π × r), pas son aire.`, `Avec le <b>diamètre</b> on calcule π × d ; avec le <b>rayon</b>, 2 × π × r. Ne multiplie pas deux fois par 2.`),
    retenir(`rectangle du cylindre : longueur = 2 × π × r, largeur = hauteur ; prisme à n côtés : n rectangles ; pyramide à n côtés : n triangles.`));
}

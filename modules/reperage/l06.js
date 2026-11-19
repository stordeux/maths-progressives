// Niveau 6 : reconnaître les solides (cube, pavé, prisme, cylindre, pyramide, cône, boule) ; faces, arêtes, sommets. 6e.
import { analyse } from './draw.js';
import { NOMS, dessin, polyedre } from './solides.js';
import { numQ, choiceQ, ex, rep, warn, retenir, meth, def, cours, pick, ri, shuffle } from './util.js';

const POLY = { 3: 'triangle', 4: 'carré', 5: 'pentagone', 6: 'hexagone' };
const NB = { 3: 'trois', 4: 'quatre', 5: 'cinq', 6: 'six' };
/** nombres de faces, d'arêtes et de sommets (formules) */
const compte = (kind, n) => (kind === 'cube' || kind === 'pave' ? { F: 6, A: 12, S: 8 } : kind === 'prisme' ? { F: n + 2, A: 3 * n, S: 2 * n } : { F: n + 1, A: 2 * n, S: n + 1 });
/** nombres relevés sur le dessin même : faces, arêtes, sommets du polyèdre construit */
const releve = S => ({ F: S.F.length, A: analyse(S.V, S.F).edges.length, S: S.V.length });

function tirer(kind, n) {
  const o = {};
  if (kind === 'cube') o.a = ri(2, 6);
  else if (kind === 'pave') { do { o.L = ri(3, 8); o.h = ri(2, 5); o.l = ri(2, 6); } while (o.L === o.h || o.h === o.l || o.L === o.l); }
  else if (kind === 'prisme') { o.n = n; o.l = ri(2, 4); }
  else if (kind === 'pyramide') o.n = n;
  else if (kind === 'cylindre') { o.r = ri(2, 3); o.h = ri(3, 6); } else if (kind === 'cone') { o.r = ri(2, 3); o.h = ri(3, 6); } else o.R = ri(2, 4);
  return { kind, n, o, svg: dessin(kind, { ...o, dims: kind === 'cube' || kind === 'pave' }) };
}
const nomOpt = k => ({ v: k, l: `un <b>${NOMS[k]}</b>` });
const note = k => (k === 'cube' || k === 'pave' ? ' (figure en perspective, non à l\'échelle)' : '');

export function L6(d) {
  const f = pick(d < 1 ? ['nom'] : d < 2 ? ['nom', 'cnt'] : d < 3 ? ['nom', 'cnt', 'base'] : ['nom', 'cnt', 'base', 'lat']);
  if (f === 'nom') {
    const pool = d < 1 ? ['cube', 'cylindre', 'boule', 'cone'] : d < 2 ? ['cube', 'pave', 'cylindre', 'boule', 'cone', 'pyramide'] : ['cube', 'pave', 'prisme', 'cylindre', 'boule', 'cone', 'pyramide'];
    const k = pick(pool), n = k === 'prisme' ? pick([3, 5, 6]) : k === 'pyramide' ? pick([3, 4, 5]) : 0, s = tirer(k, n), o = s.o;
    const hints = {
      cube: `Les trois dimensions écrites sur les arêtes sont ${o.a} cm, ${o.a} cm et ${o.a} cm. Toutes les faces sont des quadrilatères : que peux-tu dire de leurs côtés ?`,
      pave: `Toutes les faces sont des rectangles, et les trois dimensions écrites (${o.L} cm, ${o.h} cm, ${o.l} cm) ne sont pas égales. De quel solide s'agit-il ?`,
      prisme: `Repère les deux faces identiques et parallèles (des polygones à ${n} côtés) : les faces qui les relient sont-elles des rectangles ?`,
      pyramide: `Regarde la base (un polygone à ${n} côtés) et les faces latérales : de quelle forme sont-elles, et où se rejoignent-elles toutes ?`,
      cylindre: `Regarde les deux bases : de quelle forme sont-elles ? La surface qui les relie est-elle plane ou courbe ?`,
      cone: `Combien y a-t-il de bases, et de quelle forme ? Que trouve-t-on en haut du solide : une face ou un point ?`,
      boule: `Ce solide a-t-il des faces planes, des arêtes, des sommets ? Pense à un ballon.`,
    };
    const sols = {
      cube: `Six faces carrées, trois dimensions égales (${o.a} cm) : c'est un <b>cube</b>.`, pave: `Six faces rectangulaires et trois dimensions différentes : c'est un <b>pavé droit</b>.`,
      prisme: `Deux bases identiques (des ${POLY[n]}s, polygones à ${n} côtés) reliées par des faces rectangulaires : c'est un <b>prisme droit</b>.`,
      pyramide: `Une base polygonale (${n} côtés) et des faces latérales triangulaires qui se rejoignent en un sommet : c'est une <b>pyramide</b>.`,
      cylindre: `Deux bases circulaires identiques et une surface latérale courbe : c'est un <b>cylindre</b>.`, cone: `Une base circulaire et un sommet : c'est un <b>cône</b>.`, boule: `Aucune face plane, ni arête ni sommet : c'est une <b>boule</b>.`,
    };
    const M = { 'pave/cube': `Les trois dimensions sont égales (${o.a} cm) : c'est un cas particulier de pavé, qu'on appelle un cube.`, 'cube/pave': `Les trois dimensions ne sont pas toutes égales : ce n'est pas un cube.`, 'prisme/cylindre': `Les bases d'un cylindre sont des disques ; ici ce sont des polygones.`, 'cylindre/prisme': `Un prisme n'a que des faces planes ; ici la surface latérale est courbe.`, 'pyramide/cone': `Un cône a une base circulaire ; ici la base est un polygone.`, 'cone/pyramide': `La base d'une pyramide est un polygone ; ici la base est un disque.`, 'pave/prisme': `Les bases de ce solide sont des rectangles : c'est un pavé droit (un cas particulier de prisme).`, 'prisme/pave': `Un pavé a toutes ses faces rectangulaires ; ici les bases ne sont pas des rectangles.`, 'cylindre/cone': `Un cône n'a qu'une base ; ici il y en a deux, identiques.`, 'cone/cylindre': `Un cylindre a deux bases ; ici il n'y en a qu'une, et un sommet.` };
    return choiceQ({
      keep: true, opts: pool.map(nomOpt), good: k, html: `Comment s'appelle ce solide ?${note(k)}`, visual: s.svg, hint: hints[k], solution: sols[k],
      msg: v => M[`${k}/${v}`] || '', verify: E => E === k,
    });
  }
  const kinds = d < 3 ? ['cube', 'pave'] : d < 4 ? ['cube', 'pave', 'prisme3', 'pyramide4'] : ['cube', 'pave', 'prisme3', 'pyramide4', 'prisme5', 'prisme6', 'pyramide5', 'pyramide3'];
  if (f === 'cnt') {
    const w = pick(d < 2 ? ['F'] : ['F', 'A', 'S']), kk = pick(kinds), kind = kk.replace(/\d/, ''), n = +kk.slice(-1) || 0, s = tirer(kind, n);
    const S = polyedre(kind, s.o), E = compte(kind, n)[w], mot = { F: 'faces', A: 'arêtes', S: 'sommets' }[w];
    const nom = kind === 'prisme' ? `ce prisme droit dont la base a ${n} côtés` : kind === 'pyramide' ? `cette pyramide dont la base a ${n} côtés` : `ce ${NOMS[kind]}`;
    const hint = {
      F: kind === 'prisme' ? `Ce prisme a deux bases (des polygones à ${n} côtés) et des faces latérales rectangulaires : autant que de côtés d'une base. Additionne.` : kind === 'pyramide' ? `Compte la base (un polygone à ${n} côtés), puis les faces triangulaires : une par côté de la base.` : `Les faces d'un pavé sont opposées deux à deux : compte celles qu'on voit (dessus, devant, droite), puis celles qu'on ne voit pas (dessous, derrière, gauche).`,
      A: kind === 'prisme' ? `Compte les arêtes de chaque base (${n} côtés chacune), puis les arêtes latérales qui joignent les deux bases : une par sommet d'une base.` : kind === 'pyramide' ? `Compte les arêtes de la base (${n} côtés), puis celles qui partent du sommet S : une vers chaque sommet de la base.` : `Compte les 4 arêtes du dessus, les 4 du dessous, puis les arêtes verticales qui les relient. N'oublie pas celles en pointillés.`,
      S: kind === 'prisme' ? `Chaque base a ${n} sommets. Combien y a-t-il de bases ?` : kind === 'pyramide' ? `Compte les sommets de la base (${n} côtés), puis ajoute le sommet S.` : `Compte les sommets du dessus, puis ceux du dessous (n'oublie pas ceux qui sont cachés derrière).`,
    }[w];
    const sol = {
      F: kind === 'prisme' ? `2 bases + ${n} faces latérales = ${E} faces.` : kind === 'pyramide' ? `1 base + ${n} faces triangulaires = ${E} faces.` : `3 paires de faces opposées : ${E} faces.`,
      A: kind === 'prisme' ? `${n} arêtes pour chaque base (${2 * n}) + ${n} arêtes latérales = ${E} arêtes.` : kind === 'pyramide' ? `${n} arêtes dans la base + ${n} arêtes qui partent du sommet = ${E} arêtes.` : `4 + 4 + 4 = ${E} arêtes.`,
      S: kind === 'prisme' ? `2 bases × ${n} sommets = ${E} sommets.` : kind === 'pyramide' ? `${n} sommets dans la base + le sommet S = ${E} sommets.` : `4 + 4 = ${E} sommets.`,
    }[w];
    return numQ({
      E: [E], tpl: `{0} ${mot}`, visual: s.svg, html: `Combien ${w === 'F' ? 'de faces' : w === 'A' ? "d'arêtes" : 'de sommets'} a ${nom} ?${note(kind)} Compte aussi ce qu'on ne voit pas.`,
      hint, solution: sol, neg: false, msg: v => (w === 'A' && v[0] === (kind === 'prisme' ? 2 * n : kind === 'pyramide' ? n : 8) ? `Tu as peut-être oublié les arêtes cachées ou les arêtes latérales : relis l'indice.` : ''),
      verify: E => E[0] === releve(S)[w],
    });
  }
  const n = pick(d < 4 ? [3, 4, 5] : [3, 4, 5, 6]), kind = f === 'base' ? pick(n === 4 ? ['pyramide'] : ['prisme', 'pyramide']) : pick(n === 4 ? ['pyramide'] : ['prisme', 'pyramide']);
  const s = tirer(kind, n), S = polyedre(kind, s.o);
  if (f === 'base') {
    const opts = [3, 4, 5, 6].map(m => ({ v: String(m), l: `un <b>${POLY[m]}</b>` }));
    return choiceQ({
      keep: true, opts, good: String(n), visual: s.svg, html: kind === 'prisme' ? `Quelle est la forme des deux bases de ce prisme droit ?` : `Quelle est la forme de la base de cette pyramide ?`,
      hint: kind === 'prisme' ? `Les bases du prisme sont les deux faces identiques et parallèles (devant et derrière). Compte les côtés de la face de devant, en incluant ceux qu'on voit en traits pleins.` : `La base de la pyramide est la face opposée au sommet S, en bas. Compte ses côtés : certains sont en pointillés.`,
      solution: kind === 'prisme' ? `La base de devant a ${n} côtés : les bases sont des ${POLY[n]}s.` : `La base a ${n} côtés (${POLY[n] === 'carré' ? 'quatre côtés égaux' : 'polygone'}) : c'est ${n === 4 ? 'un carré' : 'un ' + POLY[n]}.`,
      msg: v => (+v === n + 1 || +v === n - 1 ? `Compte bien tous les côtés, y compris ceux en pointillés.` : ''), verify: E => +E === (kind === 'prisme' ? S.F[0].length : S.F[0].length),
    });
  }
  return numQ({
    E: [n], tpl: `{0} faces latérales`, visual: s.svg, neg: false, html: kind === 'prisme' ? `Combien de faces latérales (autres que les bases) a ce prisme droit ?` : `Combien de faces latérales (autres que la base) a cette pyramide ?`,
    hint: kind === 'prisme' ? `Les faces latérales du prisme sont les rectangles qui relient les deux bases : il y en a une par côté d'une base. Compte les côtés de la base de devant.` : `Les faces latérales de la pyramide sont les triangles qui se rejoignent en S : il y en a une par côté de la base. Compte les côtés de la base.`,
    solution: kind === 'prisme' ? `La base a ${n} côtés : il y a ${n} faces latérales rectangulaires.` : `La base a ${n} côtés : il y a ${n} faces latérales triangulaires.`,
    msg: v => (v[0] === n + 2 && kind === 'prisme' ? `Tu as compté les deux bases : on ne demande que les faces latérales.` : v[0] === n + 1 && kind === 'pyramide' ? `Tu as compté la base : on ne demande que les faces latérales.` : ''),
    verify: E => E[0] === S.F.length - (kind === 'prisme' ? 2 : 1),
  });
}

export function C6() {
  const g = (k, o) => dessin(k, o);
  const galerie = `<div class="cols">${[g('cube', { a: 3, dims: true }), g('pave', { L: 5, h: 3, l: 4, dims: true }), g('prisme', { n: 3 }), g('pyramide', { n: 4 }), g('cylindre', { r: 2, h: 4 }), g('cone', { r: 2, h: 4 }), g('boule', { R: 2 })].join('')}</div>`;
  void shuffle;
  return cours('6. Reconnaître les solides', `Un <b>solide</b> est un objet de l'espace. Certains n'ont que des faces <b>planes</b> (ce sont des polyèdres), d'autres ont une surface <b>courbe</b>.`,
    def(`<b>Cube</b> : 6 faces carrées. <b>Pavé droit</b> : 6 faces rectangulaires. <b>Prisme droit</b> : 2 bases identiques (polygones) et des faces latérales rectangulaires. <b>Pyramide</b> : 1 base polygonale et des faces latérales triangulaires. <b>Cylindre</b> : 2 bases circulaires. <b>Cône</b> : 1 base circulaire et un sommet. <b>Boule</b> : aucune face plane.<br>Une <b>face</b> est une surface plane, une <b>arête</b> est le segment où deux faces se rencontrent, un <b>sommet</b> est un coin où plusieurs arêtes se rejoignent.`),
    galerie,
    ex(`Exemple 1 : comment s'appelle ce solide ? (bases circulaires identiques, surface latérale courbe)`, `Deux bases en forme de disque, reliées par une surface courbe : un cylindre.<br>${rep('un cylindre')}`),
    ex(`Exemple 2 : comment s'appelle ce solide ? (trois dimensions 5 cm, 3 cm, 4 cm)`, `Toutes les faces sont des rectangles et les dimensions sont différentes : un pavé droit. Si les trois dimensions étaient égales, ce serait un cube.<br>${rep('un pavé droit')}`),
    ex(`Exemple 3 : combien de faces a un pavé droit ?`, `Les faces sont opposées deux à deux : 3 paires, soit 3 × 2.<br>${rep('6 faces')}`),
    ex(`Exemple 4 : combien d'arêtes a un pavé droit ?`, `4 arêtes pour le dessus, 4 pour le dessous, 4 verticales : 4 + 4 + 4.<br>${rep('12 arêtes')}`),
    ex(`Exemple 5 : combien de sommets a un pavé droit ?`, `4 sommets en haut + 4 sommets en bas.<br>${rep('8 sommets')}`),
    ex(`Exemple 6 : combien de faces a ce prisme droit dont la base a 3 côtés ?`, `2 bases (des triangles) + 3 faces latérales rectangulaires = 5 faces. Pour les arêtes : 3 + 3 + 3 = 9 ; pour les sommets : 2 × 3 = 6.<br>${rep('5 faces')}`),
    ex(`Exemple 7 : quelle est la forme de la base de cette pyramide ? (base à 4 côtés égaux)`, `La base est la face opposée au sommet : 4 côtés égaux et des angles droits, c'est un carré.<br>${rep('un carré')}`),
    ex(`Exemple 8 : combien de faces latérales a une pyramide dont la base a 5 côtés ?`, `Une face triangulaire par côté de la base : 5 faces latérales (et 6 faces en tout avec la base). Pour un prisme dont la base a 5 côtés, il y aurait aussi 5 faces latérales (rectangles).<br>${rep('5 faces latérales')}`),
    ex(`Exemple 9 : combien de sommets a cette pyramide dont la base a 4 côtés ?`, `4 sommets dans la base, plus le sommet S : 5. Arêtes : 4 dans la base et 4 vers le sommet, soit 8 ; faces : 1 + 4 = 5.<br>${rep('5 sommets')}`),
    ex(`Exemple 10 : quelle est la forme des deux bases de ce prisme droit ? (bases à 5 côtés)`, `Les bases sont les deux faces identiques et parallèles : ici 5 côtés, c'est un pentagone.<br>${rep('un pentagone')}`),
    warn(`Un solide à surface courbe (cylindre, cône, boule) n'a pas de « faces » comme un pavé : on parle de bases et de surface latérale.`, `N'oublie jamais les faces, arêtes et sommets <b>cachés</b> (arêtes en pointillés) quand tu comptes.`),
    retenir(`cube et pavé : 6 faces, 12 arêtes, 8 sommets ; prisme à n côtés : n + 2 faces, 3n arêtes, 2n sommets ; pyramide à n côtés : n + 1 faces, 2n arêtes, n + 1 sommets.`));
}

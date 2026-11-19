// Niveau 7 : perspective cavalière : arêtes cachées, faces et arêtes parallèles, longueurs réelles. 6e / 5e.
import { solide, analyse, aretesCachees, pave3, COL } from './draw.js';
import { polyedre } from './solides.js';
import { numQ, choiceQ, ex, rep, warn, retenir, meth, def, cours, pick, ri, shuffle, M } from './util.js';

const note = ' (perspective cavalière, figure non à l\'échelle)';
const PAVE = (L, h, l) => pave3(L, h, l);
const FACES = [[0, 1, 2, 3], [4, 5, 6, 7], [0, 1, 5, 4], [1, 2, 6, 5], [2, 3, 7, 6], [3, 0, 4, 7]];
const OPP = { 0: 1, 1: 0, 2: 4, 4: 2, 3: 5, 5: 3 };
const LET = 'ABCDEFGHIJKL';
const fname = (S, f) => f.map(i => S.N[i]).join('');
const dessinS = (S, o = {}) => solide({ S, names: true, maxW: 290, maxH: 210, aria: 'solide en perspective cavalière avec ses sommets nommés', ...o });
/** direction d'une arête du pavé : 'x' (de face, horizontale), 'y' (verticale), 'z' (profondeur) */
const dir = (S, a, b) => { const u = [0, 1, 2].map(i => S.V[b][i] - S.V[a][i]); return u[0] ? 'x' : u[1] ? 'y' : 'z'; };
const EDGES = [[0, 1], [3, 2], [4, 5], [7, 6], [0, 4], [1, 5], [2, 6], [3, 7], [0, 3], [1, 2], [4, 7], [5, 6]];
const en = (S, e) => S.N[e[0]] + S.N[e[1]];
const DIRTXT = { x: `une arête de face, horizontale sur le dessin`, y: `une arête verticale`, z: `une arête de profondeur (oblique sur le dessin)` };

function cachees(S) {
  const { edges } = analyse(S.V, S.F), hid = edges.filter(e => e.hidden);
  const hv = S.V.map((v, i) => i).filter(i => edges.filter(e => e.a === i || e.b === i).every(e => e.hidden));
  return { hid, hv, n: hid.length };
}

export function L7(d) {
  const f = pick(d < 1 ? ['cache', 'sommet'] : d < 2 ? ['cache', 'sommet', 'paral'] : d < 3 ? ['cache', 'sommet', 'paral', 'arpar'] : d < 4 ? ['cache', 'sommet', 'paral', 'arpar', 'egal'] : ['cache', 'paral', 'arpar', 'egal', 'reduc', 'reduc']);
  const L = ri(4, 8), h = ri(2, 5), l = ri(3, 7);
  if (f === 'cache' || f === 'sommet') {
    let S = PAVE(L, h, l), kind = 'pavé';
    if (d >= 2 && pick([true, false])) { kind = pick(['prisme', 'pyramide']); S = polyedre(kind, { n: kind === 'prisme' ? 3 : 4, l: ri(2, 4) }); }
    const c = cachees(S);
    if (f === 'sommet' && c.hv.length !== 1) { S = PAVE(L, h, l); kind = 'pavé'; }
    const cc = cachees(S), visual = dessinS(S), solid = kind === 'pavé' ? 'ce pavé droit' : kind === 'prisme' ? 'ce prisme droit' : 'cette pyramide';
    const names = S.N.slice(0, S.V.length).join(', ');
    if (f === 'cache') {
      const vis = d >= 1 && pick([true, false]), tot = analyse(S.V, S.F).edges.length, E = vis ? tot - cc.n : cc.n;
      return numQ({
        E: [E], tpl: vis ? `{0} arêtes visibles` : `{0} arêtes cachées`, neg: false, visual, html: vis ? `Combien d'arêtes ${kind === 'pavé' ? 'de ce pavé' : 'de ce solide'} sont visibles (en trait plein) ?${note}` : `Combien d'arêtes ${kind === 'pavé' ? 'de ce pavé' : 'de ce solide'} sont cachées (en pointillés) ?${note}`,
        hint: vis ? `Compte d'abord toutes les arêtes du solide (visibles et cachées), puis retire celles qui sont en pointillés${cc.hv.length ? ` : elles arrivent toutes au sommet ${cc.hv.map(i => S.N[i]).join(' et ')}` : ''}.` : (cc.hv.length ? `Une arête est cachée quand elle est derrière une face du solide. Le sommet ${cc.hv.map(i => S.N[i]).join(' et ')} est caché : combien d'arêtes arrivent à ce sommet ? Vérifie avec les traits en pointillés de la figure.` : `Une arête est cachée quand elle est derrière une face du solide : sur la figure, elle est dessinée en pointillés. Compte-les, en regardant bien chaque arête.`),
        solution: `Les arêtes cachées (en pointillés) sont ${cc.hid.map(e => `[${S.N[e.a]}${S.N[e.b]}]`).join(', ')} : ${cc.n} arêtes. Le solide a ${tot} arêtes en tout${vis ? `, donc ${tot} − ${cc.n} = ${tot - cc.n} sont visibles` : ''}.`,
        msg: v => (vis && v[0] === cc.n ? `${cc.n} est le nombre d'arêtes cachées : on demande les arêtes visibles.` : !vis && v[0] === tot - cc.n ? `${tot - cc.n} est le nombre d'arêtes visibles : on demande les arêtes cachées.` : ''),
        verify: E2 => E2[0] === (vis ? analyse(S.V, S.F).edges.length - aretesCachees(S.V, S.F).size : aretesCachees(S.V, S.F).size),
      });
    }
    const hv = S.N[cc.hv[0]];
    return choiceQ({
      keep: true, opts: S.N.slice(0, S.V.length).map(v => ({ v, l: `<b>${v}</b>` })), good: hv, visual, html: `Quel sommet de ${solid} est caché (aucune de ses arêtes n'est en trait plein) ?${note}`,
      hint: `Un sommet caché est un sommet où toutes les arêtes sont en pointillés. Parmi ${names}, regarde ceux dont toutes les arêtes sont en pointillés.`,
      solution: `Au sommet ${hv}, toutes les arêtes sont en pointillés : le sommet ${hv} est caché derrière le solide.`,
      msg: v => (v !== hv ? `Au sommet ${v}, au moins une arête est en trait plein : il est visible.` : ''),
      verify: E => { const hid = aretesCachees(S.V, S.F), i = S.N.indexOf(E); return [...hid].filter(k => k.split('-').map(Number).includes(i)).length === analyse(S.V, S.F).edges.filter(e => e.a === i || e.b === i).length; },
    });
  }
  const S = PAVE(L, h, l), visual = dessinS(S);
  if (f === 'paral') {
    const i = pick([0, 1, 2, 3, 4, 5]), X = fname(S, FACES[i]), good = OPP[i], others = shuffle([0, 1, 2, 3, 4, 5].filter(k => k !== i && k !== good)).slice(0, 3);
    return choiceQ({
      keep: false, opts: [good, ...others].map(k => ({ v: String(k), l: `<b>${fname(S, FACES[k])}</b>` })), good: String(good), visual, html: `Quelle face du pavé est parallèle à la face ${X} ?${note}`,
      hint: `Deux faces parallèles d'un pavé sont opposées : elles n'ont aucun sommet en commun. La face ${X} a pour sommets ${FACES[i].map(k => S.N[k]).join(', ')} : cherche, parmi les propositions, celle qui n'en contient aucun.`,
      solution: `La face opposée à ${X} n'a aucun sommet commun avec elle : c'est la face ${fname(S, FACES[good])}.`,
      msg: v => { const c = FACES[+v].filter(k => FACES[i].includes(k)); return c.length ? `La face ${fname(S, FACES[+v])} a des sommets en commun avec ${X} (${c.map(k => S.N[k]).join(', ')}) : elle lui est perpendiculaire, pas parallèle.` : ''; },
      verify: E => FACES[+E].every(k => !FACES[i].includes(k)) && OPP[i] === +E,
    });
  }
  if (f === 'arpar') {
    const e = pick(EDGES), de = dir(S, e[0], e[1]), same = EDGES.filter(g => g !== e && dir(S, g[0], g[1]) === de), diff = EDGES.filter(g => dir(S, g[0], g[1]) !== de);
    const good = pick(same), others = shuffle([...diff]).slice(0, 3), E = en(S, e);
    return choiceQ({
      keep: false, opts: [good, ...others].map(g => ({ v: en(S, g), l: `<b>[${en(S, g)}]</b>` })), good: en(S, good), visual, html: `Quelle arête du pavé est parallèle à l'arête [${E}] ?${note}`,
      hint: `[${E}] est ${DIRTXT[de]}. Les arêtes parallèles à [${E}] ont la même direction : cherche, parmi les propositions, celle qui est ${DIRTXT[de]}.`,
      solution: `[${E}] est ${DIRTXT[de]}. L'arête [${en(S, good)}] a la même direction : elle lui est parallèle.`,
      msg: v => { const g = EDGES.find(k => en(S, k) === v); return g && dir(S, g[0], g[1]) !== de ? `[${v}] est ${DIRTXT[dir(S, g[0], g[1])]} : elle n'a pas la même direction que [${E}].` : ''; },
      verify: E2 => { const g = EDGES.find(k => en(S, k) === E2), u = [0, 1, 2].map(i => S.V[g[1]][i] - S.V[g[0]][i]), v = [0, 1, 2].map(i => S.V[e[1]][i] - S.V[e[0]][i]); return Math.hypot(u[1] * v[2] - u[2] * v[1], u[2] * v[0] - u[0] * v[2], u[0] * v[1] - u[1] * v[0]) < 1e-9 && en(S, g) !== E; },
    });
  }
  if (f === 'egal') {
    const e = pick(EDGES.filter(g => !['AB', 'AD', 'AE'].includes(en(S, g)))), E = en(S, e), len = Math.hypot(...[0, 1, 2].map(i => S.V[e[1]][i] - S.V[e[0]][i])), D = { x: L, y: h, z: l }, de = dir(S, e[0], e[1]);
    const ref = { x: 'AB', y: 'AE', z: 'AD' }[de];
    return numQ({
      E: [D[de]], tpl: `${E} = {0} cm`, neg: false, visual, html: `Dans ce pavé, AB = ${L} cm, AD = ${l} cm et AE = ${h} cm. Quelle est la longueur de l'arête [${E}] ?${note}`,
      hint: `[${E}] est parallèle à l'une des arêtes [AB], [AD] ou [AE] : laquelle ? Dans un pavé, deux arêtes parallèles ont la même longueur.`,
      solution: `[${E}] est parallèle à [${ref}] : elles ont la même longueur. Donc ${E} = ${ref} = ${D[de]} cm.`,
      msg: v => { const o = { [L]: 'AB', [l]: 'AD', [h]: 'AE' }[v[0]]; return o && o !== ref ? `${v[0]} cm est la longueur de [${o}], qui n'est pas parallèle à [${E}].` : ''; },
      verify: E2 => Math.abs(E2[0] - len) < 1e-9,
    });
  }
  // reduc : coefficient 1/2 sur les profondeurs
  const e = pick(EDGES), E = en(S, e), de = dir(S, e[0], e[1]), prof = de === 'z', toReal = pick([true, false]);
  const real = prof ? ri(3, 9) : ri(3, 9), drawn = prof ? real / 2 : real, seg = [{ a: S.V[e[0]], b: S.V[e[1]], c: COL.a, w: 4 }];
  const visual2 = dessinS(S, { segs: seg });
  const ask = toReal ? real : drawn, given = toReal ? drawn : real;
  return numQ({
    E: [ask], tpl: toReal ? `${E} = {0} cm` : `{0} cm`, neg: false, keys: { comma: true }, visual: visual2,
    html: toReal ? `Dans cette perspective cavalière (angle 45°, coefficient 1/2 pour les profondeurs), l'arête [${E}] mesure ${M(given)} cm <b>sur le dessin</b>. Quelle est sa longueur réelle ?${note}` : `Dans cette perspective cavalière (angle 45°, coefficient 1/2 pour les profondeurs), l'arête [${E}] mesure ${M(given)} cm en réalité. Quelle est sa longueur <b>sur le dessin</b> ?${note}`,
    hint: prof ? `[${E}] est une arête de profondeur (oblique sur le dessin) : elle n'est pas dessinée en vraie grandeur. Avec le coefficient 1/2, par combien faut-il ${toReal ? 'multiplier ou diviser la longueur dessinée' : 'multiplier ou diviser la longueur réelle'} ?` : `[${E}] est ${de === 'x' ? 'une arête de face, horizontale' : 'une arête verticale'} : est-elle concernée par le coefficient 1/2 des profondeurs ?`,
    solution: prof ? `[${E}] est une arête de profondeur : sur le dessin, elle mesure la moitié de sa longueur réelle. ${toReal ? `Réelle : ${M(given)} × 2 = ${M(real)} cm.` : `Dessin : ${M(given)} ÷ 2 = ${M(drawn)} cm.`}` : `[${E}] est ${de === 'x' ? 'de face' : 'verticale'} : elle est dessinée en vraie grandeur. Longueur : ${M(real)} cm.`,
    msg: v => (prof && v[0] === (toReal ? given / 2 : given * 2) ? `Tu as fait l'opération dans le mauvais sens : sur le dessin, une profondeur est <b>plus courte</b> que la réalité.` : !prof && (v[0] === given * 2 || v[0] === given / 2) ? `Une arête ${de === 'x' ? 'de face' : 'verticale'} n'est pas modifiée par le coefficient : elle est en vraie grandeur.` : ''),
    verify: E2 => (de === 'z' ? (toReal ? Math.abs(E2[0] - 2 * given) : Math.abs(E2[0] - given / 2)) : Math.abs(E2[0] - given)) < 1e-9,
  });
}

export function C7() {
  const S = PAVE(6, 3, 4), Sp = polyedre('pyramide', { n: 4 });
  const fig = dessinS(S);
  const seg = z => dessinS(S, { segs: [{ a: S.V[z[0]], b: S.V[z[1]], c: COL.a, w: 4 }] });
  void M; void LET;
  return cours('7. Perspective cavalière', `Pour dessiner un solide sur une feuille, on utilise la <b>perspective cavalière</b> : la face de devant est dessinée en vraie grandeur, les arêtes qui vont « vers le fond » sont dessinées obliques et raccourcies.`,
    def(`En perspective cavalière : les arêtes <b>de face</b> (horizontales et verticales) sont en vraie grandeur ; les arêtes de <b>profondeur</b> sont tracées en oblique (souvent à 45°) avec un <b>coefficient de réduction</b> (ici 1/2) ; les <b>arêtes cachées</b> sont en <b>pointillés</b> ; deux arêtes parallèles dans l'espace restent parallèles sur le dessin.`),
    fig,
    meth(`Les arêtes en trait plein sont visibles, celles en pointillés sont cachées derrière une face.`, `Dans un pavé, les faces opposées sont parallèles et ont les mêmes dimensions ; les arêtes parallèles ont la même longueur.`, `Sur le dessin, une arête de profondeur mesure la <b>moitié</b> de sa longueur réelle (coefficient 1/2).`),
    ex(`Exemple 1 : combien d'arêtes sont cachées (en pointillés) ? (pavé ABCDEFGH)`, `Seul le sommet D est caché : il est derrière le solide. Les arêtes cachées sont celles qui y arrivent : [DA], [DC] et [DH].<br>${rep('3 arêtes cachées')}`),
    ex(`Exemple 2 : quel sommet est caché ? (pavé ABCDEFGH)`, `Au sommet D, les trois arêtes sont en pointillés : on ne le voit pas, il est derrière le pavé.<br>${rep('D')}`),
    dessinS(Sp),
    ex(`Exemple 3 : combien d'arêtes de ce solide sont cachées (en pointillés) ? (pyramide ABCDS à base carrée)`, `On compte les traits en pointillés de la figure : ${cachees(Sp).hid.map(e => '[' + Sp.N[e.a] + Sp.N[e.b] + ']').join(', ')}. Tous arrivent au sommet caché.<br>${rep(cachees(Sp).n + ' arêtes cachées')}`),
    ex(`Exemple 3 bis : combien d'arêtes de ce solide sont visibles (en trait plein) ? (pyramide ABCDS)`, `La pyramide a 8 arêtes en tout (4 dans la base, 4 vers le sommet S) ; ${cachees(Sp).n} sont cachées : 8 − ${cachees(Sp).n} = ${8 - cachees(Sp).n}.<br>${rep((8 - cachees(Sp).n) + ' arêtes visibles')}`),
    ex(`Exemple 3 ter : quel sommet de cette pyramide est caché (aucune de ses arêtes n'est en trait plein) ? (pyramide ABCDS)`, `Au sommet D, toutes les arêtes sont en pointillés : D est caché derrière la pyramide.<br>${rep('D')}`),
    ex(`Exemple 3 quater : combien d'arêtes de ce pavé sont visibles (en trait plein) ? (pavé ABCDEFGH)`, `Le pavé a 12 arêtes, dont 3 cachées : 12 − 3.<br>${rep('9 arêtes visibles')}`),
    ex(`Exemple 4 : quelle face du pavé est parallèle à la face ABFE ?`, `Les faces parallèles sont opposées : sans sommet commun. ABFE contient A, B, E, F : la face qui n'en contient aucun est CDHG.<br>${rep('CDHG')}`),
    seg(EDGES[0]),
    ex(`Exemple 5 : quelle arête du pavé est parallèle à l'arête [AB] ?`, `[AB] est une arête de face, horizontale sur le dessin. Les arêtes de même direction sont [DC], [EF] et [HG] : par exemple [DC].<br>${rep('[DC]')}`),
    ex(`Exemple 6 : dans ce pavé, AB = 6 cm, AD = 4 cm et AE = 3 cm ; longueur de l'arête [CG]`, `[CG] est parallèle à [AE] : elles ont la même longueur (les arêtes parallèles d'un pavé sont égales).<br>${rep('CG = 3 cm')}`),
    seg(EDGES[8]),
    ex(`Exemple 7 : l'arête [AD] mesure 2,5 cm sur le dessin (coefficient 1/2) ; longueur réelle`, `[AD] est une arête de profondeur : sur le dessin elle est deux fois plus courte. Longueur réelle : 2,5 × 2 = 5 cm.<br>${rep('AD = 5 cm')}`),
    ex(`Exemple 8 : l'arête [AD] mesure 8 cm en réalité (coefficient 1/2) ; longueur sur le dessin`, `Une arête de profondeur est dessinée deux fois plus courte : 8 ÷ 2 = 4 cm.<br>${rep('4 cm')}`),
    ex(`Exemple 9 : l'arête [AB] mesure 6 cm sur le dessin ; longueur réelle`, `[AB] est une arête de face, horizontale : elle est dessinée en vraie grandeur, le coefficient ne la change pas.<br>${rep('AB = 6 cm')}`),
    warn(`Une arête cachée n'est pas « absente » : on la trace en pointillés.`, `Seules les arêtes de <b>profondeur</b> sont raccourcies ; les arêtes de face (horizontales, verticales) ne le sont pas.`, `Sur le dessin, deux arêtes parallèles restent parallèles, mais des angles droits ne paraissent plus droits.`),
    retenir(`en perspective cavalière : pointillés pour le caché, vraie grandeur pour la face, profondeur réduite de moitié (coefficient 1/2).`));
}

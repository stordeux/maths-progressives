// Niveau 10 : se repérer dans un pavé droit (repère (O ; I, J, K) : abscisse, ordonnée, altitude). 3e.
import { solide, pave3, COL } from './draw.js';
import { numQ, ex, rep, warn, retenir, meth, def, cours, pick, ri, M } from './util.js';

const NOMS = ['O', 'I', 'C', 'J', 'K', 'F', 'G', 'H'];
const note = ' (perspective cavalière, figure non à l\'échelle)';
/** pavé OI = a (abscisse), OJ = b (ordonnée, profondeur), OK = c (altitude) ; sommets nommés O, I, C, J, K, F, G, H */
const S10 = (a, b, c) => ({ ...pave3(a, c, b), N: NOMS });
/** coordonnées (abscisse ; ordonnée ; altitude) d'un sommet relevées dans les données du solide */
const coord = (S, i) => [S.V[i][0], S.V[i][2], S.V[i][1]];
const tr = (S, c) => [c[0], c[2], c[1]]; // (x ; y ; z) du repère -> point 3D du dessin
const fig = (S, o = {}) => solide({ S, names: true, maxW: 290, maxH: 220, aria: 'pavé droit avec le repère (O ; I, J, K)', ...o });
const cp3 = p => `(${p.map(v => M(v)).join(' ; ')})`;

export function L10(d) {
  const f = pick(d < 1 ? ['sommet'] : d < 2 ? ['sommet', 'point'] : d < 3 ? ['sommet', 'point', 'dim'] : ['sommet', 'point', 'dim', 'milieu']);
  const a = ri(3, 6), b = ri(2, 5), c = ri(2, 4), S = S10(a, b, c);
  const dims = `OI = ${a}, OJ = ${b} et OK = ${c}`;
  if (f === 'sommet') {
    const i = pick([2, 5, 6, 7]), n = NOMS[i], E = coord(S, i);
    return numQ({
      E, tpl: `${n}( {0} ; {1} ; {2} )`, neg: false, visual: fig(S), html: `Dans le repère (O ; I, J, K), le pavé a pour dimensions ${dims}. Donne les coordonnées (abscisse ; ordonnée ; altitude) du point ${n}.${note}`,
      hint: `Pour aller de O à ${n}, on se déplace le long de [OI] (abscisse), parallèlement à [OJ] (ordonnée), puis parallèlement à [OK] (altitude). Pour chaque direction, ${n} est-il resté au niveau de O ou au bout de l'arête ?`,
      solution: `${n} est ${E[0] ? `au bout de [OI] : abscisse ${a}` : 'sur le plan de O pour l\'abscisse : abscisse 0'} ; ${E[1] ? `au bout de [OJ] : ordonnée ${b}` : 'ordonnée 0'} ; ${E[2] ? `en haut : altitude ${c}` : 'altitude 0'}. Donc ${n}${cp3(E)}.`,
      msg: v => (v[0] === E[1] && v[1] === E[0] ? `Tu as inversé l'abscisse (direction OI) et l'ordonnée (direction OJ).` : v[1] === E[2] && v[2] === E[1] ? `Tu as inversé l'ordonnée (OJ) et l'altitude (OK) : l'altitude est la hauteur.` : ''),
      verify: E2 => [0, 1, 2].every(k => E2[k] === coord(S, NOMS.indexOf(n))[k]),
    });
  }
  if (f === 'point') {
    const P = [ri(1, a - 1), ri(1, b - 1), ri(1, c - 1)];
    if (P.every(v => v === 1) && a === 3 && b === 2 && c === 2) P[0] = 2;
    const ord = [0, 1, 2].sort(() => ri(0, 1) - 0.5), W = ['avance de ' + P[0] + ' le long de [OI]', 'avance de ' + P[1] + ' parallèlement à [OJ]', 'monte de ' + P[2] + ' parallèlement à [OK]'];
    const p3 = tr(S, P), segs = [{ a: [0, 0, 0], b: [p3[0], 0, 0], dash: true }, { a: [p3[0], 0, 0], b: [p3[0], 0, p3[2]], dash: true }, { a: [p3[0], 0, p3[2]], b: p3, dash: true }];
    return numQ({
      E: P, tpl: `P( {0} ; {1} ; {2} )`, neg: false, visual: fig(S, { dots: [{ p: p3, n: 'P' }], segs }), html: `Dans le repère (O ; I, J, K) du pavé (${dims}), on part de O, on ${ord.map(k => W[k]).join(', puis on ')}. On arrive au point P. Donne ses coordonnées (abscisse ; ordonnée ; altitude).${note}`,
      hint: `L'abscisse est le déplacement le long de [OI], l'ordonnée le déplacement parallèle à [OJ], l'altitude le déplacement vers le haut (parallèle à [OK]). Relie chaque déplacement du texte à une de ces trois coordonnées, sans tenir compte de l'ordre dans lequel il est écrit.`,
      solution: `Déplacement le long de [OI] : ${P[0]} (abscisse) ; parallèlement à [OJ] : ${P[1]} (ordonnée) ; vers le haut : ${P[2]} (altitude). Donc P${cp3(P)}.`,
      msg: v => (v[0] === P[2] && v[2] === P[0] ? `L'altitude se lit en dernier : c'est le déplacement vers le haut, pas le premier cité.` : ''),
      verify: E2 => { const q = tr(S, E2); return q[0] === p3[0] && q[1] === p3[1] && q[2] === p3[2]; },
    });
  }
  if (f === 'dim') {
    const k = pick([0, 1, 2]), nom = ['OI', 'OJ', 'OK'][k], G = [a, b, c];
    return numQ({
      E: [G[k]], tpl: `${nom} = {0}`, neg: false, visual: fig(S), html: `Dans le repère (O ; I, J, K), le sommet G opposé à O dans le pavé a pour coordonnées ${cp3(G)}. Que vaut ${nom} ?${note}`,
      hint: `G est le sommet opposé à O : il est au bout des trois arêtes issues de O. La coordonnée de G dans la direction de ${nom} (${['abscisse', 'ordonnée', 'altitude'][k]}) est donc la longueur de [${nom}]. Laquelle des trois coordonnées ${cp3(G)} correspond à ${nom} ?`,
      solution: `Les coordonnées de G sont les trois dimensions : abscisse = OI = ${a}, ordonnée = OJ = ${b}, altitude = OK = ${c}. Donc ${nom} = ${G[k]}.`,
      msg: v => (G.includes(v[0]) && v[0] !== G[k] ? `${v[0]} est une autre dimension : ${nom} correspond à ${['l\'abscisse (1er nombre)', 'l\'ordonnée (2e nombre)', 'l\'altitude (3e nombre)'][k]}.` : ''),
      verify: E2 => E2[0] === S.V[6][[0, 2, 1][k]],
    });
  }
  // milieu d'une arête
  const aa = 2 * ri(2, 3) + (d >= 4 && chance() ? 1 : 0), bb = 2 * ri(1, 2), cc = 2 * ri(1, 2), S2 = S10(aa, bb, cc);
  const arete = pick([[0, 1], [1, 2], [2, 3], [0, 3], [4, 5], [5, 6], [6, 7], [4, 7], [0, 4], [1, 5], [2, 6], [3, 7]]), [p, q] = arete;
  const A = coord(S2, p), B = coord(S2, q), E = A.map((v, k) => (v + B[k]) / 2);
  return numQ({
    E, tpl: `milieu ( {0} ; {1} ; {2} )`, neg: false, keys: { comma: true }, visual: fig(S2), html: `Le pavé a pour dimensions OI = ${aa}, OJ = ${bb} et OK = ${cc}. Donne les coordonnées du milieu de l'arête [${NOMS[p]}${NOMS[q]}].${note}`,
    hint: `Les extrémités de l'arête sont ${NOMS[p]}${cp3(A)} et ${NOMS[q]}${cp3(B)}. Pour chaque coordonnée, le milieu est à mi-chemin : additionne les deux nombres et divise par 2.`,
    solution: `${NOMS[p]}${cp3(A)} et ${NOMS[q]}${cp3(B)} : on fait la moyenne de chaque coordonnée, soit ${cp3(E)}.`,
    msg: v => (v.every((x, k) => x === A[k] + B[k]) ? `Tu as additionné sans diviser par 2.` : ''),
    verify: E2 => E2.every((x, k) => Math.abs(x - (S2.V[p][[0, 2, 1][k]] + S2.V[q][[0, 2, 1][k]]) / 2) < 1e-9),
  });
}
function chance() { return ri(0, 1) === 1; }

export function C10() {
  const S = S10(5, 4, 3), p3 = tr(S, [2, 3, 1]);
  const segs = [{ a: [0, 0, 0], b: [p3[0], 0, 0], dash: true }, { a: [p3[0], 0, 0], b: [p3[0], 0, p3[2]], dash: true }, { a: [p3[0], 0, p3[2]], b: p3, dash: true }];
  return cours('10. Se repérer dans un pavé droit', `Dans l'espace, il faut <b>trois</b> nombres pour repérer un point : on ajoute à l'abscisse et à l'ordonnée une <b>altitude</b>.`,
    def(`Dans le repère <b>(O ; I, J, K)</b> d'un pavé droit, O est l'origine, [OI] l'axe des <b>abscisses</b>, [OJ] l'axe des <b>ordonnées</b>, [OK] l'axe des <b>altitudes</b> (vertical). Un point s'écrit <b>(abscisse ; ordonnée ; altitude)</b>. Les sommets du pavé ont pour coordonnées 0 ou la dimension correspondante.`),
    fig(S, { dots: [{ p: p3, n: 'P' }], segs }),
    meth(`Abscisse : déplacement le long de [OI]. Ordonnée : déplacement parallèle à [OJ]. Altitude : déplacement vers le haut.`, `Pour un sommet, chaque coordonnée vaut 0 (même niveau que O) ou la dimension (au bout de l'arête).`),
    ex(`Exemple 1 : pavé de dimensions OI = 5, OJ = 4 et OK = 3 ; coordonnées du point G`, `G est au bout des trois arêtes issues de O : abscisse 5, ordonnée 4, altitude 3.<br>${rep('G( 5 ; 4 ; 3 )')}`),
    ex(`Exemple 2 : on part de O, on monte de 1, on avance de 2 le long de [OI], puis de 3 parallèlement à [OJ] ; coordonnées de P`, `On range les déplacements : abscisse 2 (OI), ordonnée 3 (OJ), altitude 1 (vers le haut).<br>${rep('P( 2 ; 3 ; 1 )')}`),
    ex(`Exemple 3 : le sommet G opposé à O a pour coordonnées (5 ; 4 ; 3) ; que vaut OJ ?`, `L'ordonnée de G est la longueur de [OJ] : c'est le deuxième nombre.<br>${rep('OJ = 4')}`),
    ex(`Exemple 4 : milieu de l'arête [OK] joignant O(0 ; 0 ; 0) et K(0 ; 0 ; 4)`, `Moyenne de chaque coordonnée : (0 + 0) ÷ 2, (0 + 0) ÷ 2, (0 + 4) ÷ 2.<br>${rep('milieu ( 0 ; 0 ; 2 )')}`),
    warn(`L'altitude se lit <b>en dernier</b> et correspond à la hauteur, pas à la profondeur.`, `Sur le dessin en perspective, [OJ] est raccourci : il faut lire les dimensions dans le texte, pas les mesurer.`),
    retenir(`dans l'espace, un point a trois coordonnées (abscisse ; ordonnée ; altitude).`));
}

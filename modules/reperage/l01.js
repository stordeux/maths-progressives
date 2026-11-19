// Niveau 1 : lire les coordonnées d'un point dans un repère (quadrant positif). 6e.
import { repere, lirePoints, COL } from './draw.js';
import { numQ, ex, rep, warn, retenir, meth, def, cours, lettres, pt, ri, pick, shuffle, memes, ecartes } from './util.js';

const fig = (pts, N, guides) => repere({ x0: 0, x1: N, y0: 0, y1: N, pts: pts.map(p => ({ n: p.n, p: p.p, c: COL.b })), guides: guides || [], aria: 'repère du plan et points', maxW: 360, maxH: 360 });
const gd = p => [{ p, c: COL.a }];

export function L1(d) {
  const N = d < 1 ? 6 : d < 3 ? 8 : 10, nb = d < 1 ? 1 : d < 3 ? 2 : 3;
  const f = pick(d < 1 ? ['lire'] : d < 2 ? ['lire', 'abs'] : ['lire', 'abs', 'ord']);
  const nm = lettres(nb, d);
  for (;;) {
    const P = Array.from({ length: nb }, () => [ri(1, N - 1), ri(1, N - 1)]);
    if (P[0][0] === P[0][1] || !ecartes(P, 2) || P.some((p, i) => P.some((q, j) => i !== j && (p[0] === q[0] || p[1] === q[1])))) continue;
    const pts = P.map((p, i) => ({ n: nm[i], p })), t = d < 2 ? 0 : ri(0, nb - 1), n = nm[t], [x, y] = P[t];
    const visual = fig(pts, N), after = fig(pts, N, gd(P[t]));
    const base = { visual, after, neg: false };
    const swapMsg = v => (v[0] === y && v[1] === x ? `Tu as inversé les deux nombres : on donne d'abord l'abscisse (lue sur l'axe horizontal), puis l'ordonnée (lue sur l'axe vertical).` : '');
    if (f === 'lire') {
      return numQ({
        ...base, E: [x, y], tpl: `${n}( {0} ; {1} )`, html: `Lis les coordonnées du point ${n} dans le repère.`,
        hint: `Pour le point ${n} : descends tout droit jusqu'à l'axe horizontal pour lire l'abscisse, puis va tout droit vers l'axe vertical pour lire l'ordonnée. Tu peux aussi compter les carreaux depuis l'origine O.`,
        solution: `Pour aller de O au point ${n} : ${x} carreaux vers la droite (abscisse ${x}), puis ${y} vers le haut (ordonnée ${y}). Donc ${pt(n, [x, y])}.`,
        msg: swapMsg, verify: E => memes(E, lirePoints(visual)[n]),
      });
    }
    if (f === 'abs') {
      return numQ({
        ...base, E: [x], tpl: `abscisse de ${n} : {0}`, html: `Quelle est l'abscisse du point ${n} ?`,
        hint: `L'abscisse se lit sur l'axe horizontal : descends du point ${n} tout droit jusqu'à cet axe et lis la graduation.`,
        solution: `En descendant du point ${n} jusqu'à l'axe horizontal, on lit ${x}. L'abscisse de ${n} est ${x}.`,
        msg: v => (v[0] === y ? `${y} est l'ordonnée de ${n} (axe vertical). L'abscisse se lit sur l'axe horizontal.` : ''), verify: E => E[0] === lirePoints(visual)[n][0],
      });
    }
    return numQ({
      ...base, E: [y], tpl: `ordonnée de ${n} : {0}`, html: `Quelle est l'ordonnée du point ${n} ?`,
      hint: `L'ordonnée se lit sur l'axe vertical : va du point ${n} tout droit vers la gauche jusqu'à cet axe et lis la graduation.`,
      solution: `En allant du point ${n} tout droit vers l'axe vertical, on lit ${y}. L'ordonnée de ${n} est ${y}.`,
      msg: v => (v[0] === x ? `${x} est l'abscisse de ${n} (axe horizontal). L'ordonnée se lit sur l'axe vertical.` : ''), verify: E => E[0] === lirePoints(visual)[n][1],
    });
  }
}

export function C1() {
  const a = [{ n: 'A', p: [3, 2] }, { n: 'B', p: [5, 4] }];
  void shuffle;
  return cours('1. Lire les coordonnées d\'un point', `Pour repérer un point dans un plan, on utilise deux axes gradués qui se coupent en un point appelé l'<b>origine</b> O.`,
    def(`Un point se repère par ses <b>coordonnées</b> écrites entre parenthèses : <b>(abscisse ; ordonnée)</b>.<br>L'<b>abscisse</b> se lit sur l'axe <b>horizontal</b> (on part de O vers la droite), l'<b>ordonnée</b> sur l'axe <b>vertical</b> (on monte). On dit toujours l'abscisse <b>d'abord</b>.`),
    fig(a, 6, gd([3, 2])),
    meth(`Pars de l'origine O.`, `Compte les graduations vers la <b>droite</b> jusqu'à être sous (ou sur la même verticale que) le point : c'est l'abscisse.`, `Monte jusqu'au point : le nombre de graduations est l'ordonnée.`),
    ex(`Exemple 1 : lis les coordonnées du point A`, `De O à A : 3 carreaux vers la droite, puis 2 vers le haut.<br>${rep('A( 3 ; 2 )')}`),
    ex(`Exemple 2 : quelle est l'abscisse du point B ?`, `En descendant de B tout droit jusqu'à l'axe horizontal, on lit 5.<br>${rep('5')}`),
    ex(`Exemple 3 : quelle est l'ordonnée du point B ?`, `En allant de B tout droit vers l'axe vertical, on lit 4.<br>${rep('4')}`),
    warn(`Ne pas inverser : <b>A(3 ; 2)</b> n'est pas le point <b>(2 ; 3)</b>. Horizontal d'abord, vertical ensuite.`, `Compte les <b>graduations</b> (les intervalles), pas les petits traits.`),
    retenir(`(abscisse ; ordonnée) : d'abord sur l'axe horizontal, ensuite sur l'axe vertical.`));
}

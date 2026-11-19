// Niveau 2 : coordonnées avec des nombres relatifs (quatre quadrants), points sur les axes. 5e.
import { repere, lirePoints, COL } from './draw.js';
import { numQ, choiceQ, ex, rep, warn, retenir, def, cours, lettres, pt, ri, pick, memes, ecartes, M } from './util.js';

const fig = (pts, N, guides, extra = {}) => repere({ x0: -N, x1: N, y0: -N, y1: N, pts: pts.map(p => ({ n: p.n, p: p.p, c: p.c || COL.b })), guides: guides || [], aria: 'repère du plan et points', maxW: 380, maxH: 380, ...extra });
const gd = p => [{ p, c: COL.a }];
const SIG = { pp: 'abscisse positive et ordonnée positive', pn: 'abscisse positive et ordonnée négative', np: 'abscisse négative et ordonnée positive', nn: 'abscisse négative et ordonnée négative' };
const sg = v => (v > 0 ? 'p' : 'n');

export function L2(d) {
  const N = d < 2 ? 5 : 6, nb = d < 2 ? 1 : 2;
  const f = pick(d < 1 ? ['lire', 'signes'] : d < 3 ? ['lire', 'signes', 'axe'] : ['lire', 'signes', 'axe', 'sym']);
  const nm = lettres(nb + 1, d);
  for (;;) {
    const R = () => [ri(-N + 1, N - 1), ri(-N + 1, N - 1)], P = Array.from({ length: nb }, R);
    let P0 = P[0];
    if (f === 'axe') P0 = pick([[0, ri(1, N - 1) * pick([-1, 1])], [ri(1, N - 1) * pick([-1, 1]), 0]]);
    else if (P0[0] === 0 || P0[1] === 0 || Math.abs(P0[0]) === Math.abs(P0[1])) continue;
    P[0] = P0;
    if (!ecartes(P, 2) || P.slice(1).some(p => p[0] === 0 || p[1] === 0 || p[0] === P0[0] || p[1] === P0[1])) continue;
    const pts = P.map((p, i) => ({ n: nm[i], p })), n = nm[0], [x, y] = P0;
    const visual = fig(pts, N), after = fig(pts, N, gd(P0));
    const base = { visual, after, neg: true };
    if (f === 'lire') {
      return numQ({
        ...base, E: [x, y], tpl: `${n}( {0} ; {1} )`, html: `Lis les coordonnées du point ${n} dans le repère.`,
        hint: `Pour ${n} : est-il à droite ou à gauche de l'axe vertical (signe de l'abscisse) ? au-dessus ou en dessous de l'axe horizontal (signe de l'ordonnée) ? Compte ensuite les carreaux depuis O dans chaque direction.`,
        solution: `Depuis O, le point ${n} est à ${Math.abs(x)} carreau${Math.abs(x) > 1 ? 'x' : ''} ${x > 0 ? 'vers la droite (abscisse positive)' : 'vers la gauche (abscisse négative)'} et à ${Math.abs(y)} ${y > 0 ? 'vers le haut (ordonnée positive)' : 'vers le bas (ordonnée négative)'}. Donc ${pt(n, [x, y])}.`,
        msg: v => (v[0] === y && v[1] === x ? `Tu as inversé les deux nombres : d'abord l'abscisse (axe horizontal), puis l'ordonnée.` : v[0] === Math.abs(x) && v[1] === Math.abs(y) ? `Les nombres sont bons ; regarde les signes : ${n} est à ${x < 0 ? 'gauche' : 'droite'} de l'axe vertical et ${y < 0 ? 'en dessous' : 'au-dessus'} de l'axe horizontal.` : ''),
        verify: E => memes(E, lirePoints(visual)[n]),
      });
    }
    if (f === 'signes') {
      const v0 = sg(x) + sg(y);
      return choiceQ({
        keep: true, opts: Object.entries(SIG).map(([v, l]) => ({ v, l })), good: v0, visual, after, html: `Le point ${n} est tracé dans le repère. Quels sont les signes de son abscisse et de son ordonnée ?`,
        hint: `Regarde où se trouve ${n} : à droite ou à gauche de l'axe vertical (cela donne le signe de l'abscisse), au-dessus ou en dessous de l'axe horizontal (signe de l'ordonnée).`,
        solution: `${n} est ${x > 0 ? 'à droite' : 'à gauche'} de l'axe vertical : abscisse ${x > 0 ? 'positive' : 'négative'} ; il est ${y > 0 ? 'au-dessus' : 'en dessous'} de l'axe horizontal : ordonnée ${y > 0 ? 'positive' : 'négative'}.`,
        msg: v => (v[0] !== v0[0] && v[1] !== v0[1] ? `Les deux signes sont faux : regarde le côté de l'axe vertical pour l'abscisse, puis celui de l'axe horizontal pour l'ordonnée.` : v[0] !== v0[0] ? `L'abscisse (axe horizontal) n'a pas ce signe : ${n} est à ${x > 0 ? 'droite' : 'gauche'} de l'axe vertical.` : `L'ordonnée (axe vertical) n'a pas ce signe : ${n} est ${y > 0 ? 'au-dessus' : 'en dessous'} de l'axe horizontal.`),
        verify: E => { const [a, b] = lirePoints(visual)[n]; return E === (a > 0 ? 'p' : 'n') + (b > 0 ? 'p' : 'n'); },
      });
    }
    if (f === 'axe') {
      const onX = y === 0;
      return numQ({
        ...base, E: [x, y], tpl: `${n}( {0} ; {1} )`, html: `Le point ${n} est situé sur un des axes. Donne ses coordonnées.`,
        hint: onX ? `${n} est sur l'axe horizontal : tous les points de cet axe ont la même ordonnée, une valeur particulière à retrouver. Lis ensuite l'abscisse de ${n} sur l'axe, sans oublier son signe.` : `${n} est sur l'axe vertical : tous les points de cet axe ont la même abscisse, une valeur particulière à retrouver. Lis ensuite l'ordonnée de ${n} sur l'axe, sans oublier son signe.`,
        solution: onX ? `${n} est sur l'axe horizontal : son ordonnée est 0. Son abscisse se lit sur l'axe : ${M(x)}. Donc ${pt(n, [x, 0])}.` : `${n} est sur l'axe vertical : son abscisse est 0. Son ordonnée se lit sur l'axe : ${M(y)}. Donc ${pt(n, [0, y])}.`,
        msg: v => (onX ? (v[0] === 0 && v[1] === x ? `Tu as inversé : sur l'axe horizontal, c'est l'ordonnée qui vaut 0.` : '') : (v[0] === y && v[1] === 0 ? `Tu as inversé : sur l'axe vertical, c'est l'abscisse qui vaut 0.` : '')),
        verify: E => memes(E, lirePoints(visual)[n]),
      });
    }
    // symétrie par rapport à un axe
    const ax = pick(['abscisses', 'ordonnées']), B = ax === 'abscisses' ? [x, -y] : [-x, y], b = nm[nb];
    const pre = [{ n, p: P0 }], post = [...pre, { n: b, p: B, c: COL.g }];
    const axeSeg = ax === 'abscisses' ? [{ a: [-N, 0], b: [N, 0], c: COL.a, w: 4 }] : [{ a: [0, -N], b: [0, N], c: COL.a, w: 4 }];
    const vis2 = fig(pre, N, null, { segs: axeSeg }), aft2 = fig(post, N, null, { segs: [...axeSeg, { a: P0, b: B, c: COL.g, dash: true, w: 2 }] });
    return numQ({
      E: B, tpl: `${b}( {0} ; {1} )`, neg: true, visual: vis2, after: aft2, html: `Le point ${b} est le symétrique du point ${pt(n, P0)} par rapport à l'axe des ${ax} (en orange). Donne les coordonnées de ${b}.`,
      hint: `Le symétrique de ${n} par rapport à l'axe des ${ax} est de l'autre côté de cet axe, à la même distance : un seul des deux nombres ${M(x)} et ${M(y)} change de signe. Lequel ?`,
      solution: `On traverse l'axe des ${ax} : ${ax === 'abscisses' ? `l'abscisse ${M(x)} ne change pas, l'ordonnée ${M(y)} devient ${M(-y)}` : `l'ordonnée ${M(y)} ne change pas, l'abscisse ${M(x)} devient ${M(-x)}`}. Donc ${pt(b, B)}.`,
      msg: v => (v[0] === -x && v[1] === -y ? `Tu as changé les deux signes : c'est la symétrie par rapport à l'origine. Ici on ne traverse qu'un seul axe.` : v[0] === (ax === 'abscisses' ? -x : x) && v[1] === (ax === 'abscisses' ? y : -y) ? `Tu as changé le mauvais nombre : par rapport à l'axe des ${ax}, c'est ${ax === 'abscisses' ? "l'ordonnée" : "l'abscisse"} qui change de signe.` : ''),
      verify: E => { const A = lirePoints(aft2); return memes(E, A[b]) && memes([A[n][0] + A[b][0], A[n][1] + A[b][1]], ax === 'abscisses' ? [2 * x, 0] : [0, 2 * y]); },
    });
  }
}

export function C2() {
  const A = [{ n: 'A', p: [-3, 2] }, { n: 'B', p: [4, -2] }];
  const sy = fig([{ n: 'A', p: [-3, 2] }, { n: 'B′', p: [3, 2], c: COL.g }], 5, null, { segs: [{ a: [0, -5], b: [0, 5], c: COL.a, w: 4 }, { a: [-3, 2], b: [3, 2], c: COL.g, dash: true, w: 2 }] });
  return cours('2. Coordonnées avec des nombres relatifs', `Les axes se prolongent de l'autre côté de l'origine : les nombres peuvent être <b>négatifs</b>. Le plan est partagé en quatre « quarts » (quadrants).`,
    def(`À <b>gauche</b> de l'axe vertical, l'abscisse est <b>négative</b> ; <b>en dessous</b> de l'axe horizontal, l'ordonnée est <b>négative</b>.<br>Un point de l'axe horizontal a pour ordonnée <b>0</b> ; un point de l'axe vertical a pour abscisse <b>0</b>.`),
    fig(A, 5, gd([-3, 2])),
    ex(`Exemple 1 : lis les coordonnées du point A`, `De O à A : 3 carreaux vers la gauche (abscisse −3), puis 2 vers le haut (ordonnée 2).<br>${rep('A( −3 ; 2 )')}`),
    ex(`Exemple 2 : quels sont les signes de l'abscisse et de l'ordonnée du point B ?`, `B est à droite de l'axe vertical et en dessous de l'axe horizontal.<br>${rep('abscisse positive et ordonnée négative')}`),
    fig([{ n: 'C', p: [-4, 0] }, { n: 'D', p: [0, 3] }], 5, null),
    ex(`Exemple 3 : le point C est situé sur un des axes (à 4 carreaux à gauche de O)`, `C est sur l'axe horizontal : son ordonnée est 0. Son abscisse est −4.<br>${rep('C( −4 ; 0 )')}`),
    sy,
    ex(`Exemple 4 : B′ est le symétrique de A(−3 ; 2) par rapport à l'axe des ordonnées`, `On traverse l'axe vertical : l'ordonnée 2 ne change pas, l'abscisse −3 devient 3.<br>${rep('B′( 3 ; 2 )')}`),
    warn(`Un point sur un axe a une coordonnée <b>nulle</b> : (−4 ; 0) est sur l'axe horizontal, (0 ; 3) sur l'axe vertical.`, `Compte toujours dans le bon sens : vers la gauche ou vers le bas, le nombre est <b>négatif</b>.`),
    retenir(`gauche ou bas : négatif ; droite ou haut : positif ; sur un axe, une coordonnée vaut 0.`));
}

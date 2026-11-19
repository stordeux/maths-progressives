// Niveau 4 : lire des coordonnées non entières (graduations en demis, en dixièmes). 5e.
import { repere, lirePoints, COL } from './draw.js';
import { numQ, ex, rep, warn, retenir, meth, def, cours, lettres, pt, ri, pick, memes, M } from './util.js';

const fig = (pts, o, guides) => repere({ ...o, pts: pts.map(p => ({ n: p.n, p: p.p, c: COL.b })), guides: guides || [], aria: 'repère gradué et points', maxW: 380, maxH: 380 });
const dix = v => Math.round(v * 10) / 10;

export function L4(d) {
  const f = pick(d < 1 ? ['demi'] : d < 2 ? ['demi', 'dixieme'] : d < 3 ? ['demi', 'dixieme', 'dixieme'] : ['demi', 'dixieme', 'abs', 'ord']);
  const [n, n2] = lettres(2, d);
  for (;;) {
    if (f === 'demi' || ((f === 'abs' || f === 'ord') && d >= 3 && pick([true, false]))) {
      // graduations en demis
      const neg = d >= 3, N = neg ? 3 : 4, R = () => ri(neg ? -2 * N + 1 : 1, 2 * N - 1) / 2;
      const P = [R(), R()], Q = [R(), R()];
      if (Number.isInteger(P[0]) && Number.isInteger(P[1])) continue;
      if (P[0] === 0 || P[1] === 0 || Math.max(Math.abs(P[0] - Q[0]), Math.abs(P[1] - Q[1])) < 1.5 || Q[0] === 0 || Q[1] === 0) continue;
      if (Math.abs(P[0]) === Math.abs(P[1])) continue;
      const o = { x0: neg ? -N : 0, x1: N, y0: neg ? -N : 0, y1: N, step: 0.5 }, pts = [{ n, p: P }, ...(d >= 2 ? [{ n: n2, p: Q }] : [])];
      const visual = fig(pts, o), after = fig(pts, o, [{ p: P, c: COL.a }]), [x, y] = P;
      const tx = x < 0 ? 'vers la gauche' : 'vers la droite', ty = y < 0 ? 'vers le bas' : 'vers le haut';
      const hintBase = `Entre deux graduations entières il y a une graduation à mi-chemin, qui vaut 0,5. Pour ${n}, regarde sur chaque axe si le point est sur une graduation entière ou à mi-chemin.`;
      const common = { visual, after, keys: { comma: true }, neg };
      if (f === 'abs' || f === 'ord') {
        const isX = f === 'abs', v = isX ? x : y;
        return numQ({
          ...common, E: [v], tpl: `${isX ? 'abscisse' : 'ordonnée'} de ${n} : {0}`, html: `Quelle est ${isX ? "l'abscisse" : "l'ordonnée"} du point ${n} ?`,
          hint: `${isX ? "L'abscisse se lit sur l'axe horizontal" : "L'ordonnée se lit sur l'axe vertical"} : ${isX ? `descends de ${n} tout droit jusqu'à l'axe` : `va de ${n} tout droit jusqu'à l'axe`}. Est-ce sur une graduation entière ou à mi-chemin entre deux ?`,
          solution: `${isX ? `En descendant de ${n} sur l'axe horizontal` : `En allant de ${n} sur l'axe vertical`}, on tombe à mi-chemin ou sur une graduation : ${M(v)}.`,
          msg: w => (w[0] === (isX ? y : x) ? `Tu as donné l'autre coordonnée de ${n}.` : ''), verify: E => E[0] === lirePoints(visual)[n][isX ? 0 : 1],
        });
      }
      return numQ({
        ...common, E: [x, y], tpl: `${n}( {0} ; {1} )`, html: `Lis les coordonnées du point ${n} dans le repère. Les graduations sont en demis.`,
        hint: hintBase,
        solution: `De O à ${n} : ${M(Math.abs(x))} unité${Math.abs(x) > 1 ? 's' : ''} ${tx} (abscisse ${M(x)}), puis ${M(Math.abs(y))} ${ty} (ordonnée ${M(y)}). Donc ${pt(n, P)}.`,
        msg: v => (v[0] === y && v[1] === x ? `Tu as inversé les deux nombres : d'abord l'abscisse (axe horizontal).` : Math.abs(Math.abs(v[0] - x) - 0.5) < 1e-9 || Math.abs(Math.abs(v[1] - y) - 0.5) < 1e-9 ? `Tu es à une demi-graduation près : une graduation intermédiaire vaut 0,5.` : ''),
        verify: E => memes(E, lirePoints(visual)[n]),
      });
    }
    // graduations en dixièmes : fenêtre [0 ; 2] × [0 ; 2] (puis [0 ; 3] × [0 ; 2])
    const X1 = d >= 3 ? 3 : 2, Y1 = 2, R = () => [ri(1, X1 * 10 - 1) / 10, ri(1, Y1 * 10 - 1) / 10];
    const P = R(), Q = R();
    if ((Number.isInteger(P[0]) && Number.isInteger(P[1])) || Math.max(Math.abs(P[0] - Q[0]), Math.abs(P[1] - Q[1])) < 0.5) continue;
    if (Number.isInteger(P[0]) || Number.isInteger(P[1]) || Math.abs(P[0] - P[1]) < 0.05) continue;
    const o = { x0: 0, x1: X1, y0: 0, y1: Y1, step: 0.1, labelStep: 1 }, pts = [{ n, p: P }, ...(d >= 2 ? [{ n: n2, p: Q }] : [])];
    const visual = fig(pts, o), after = fig(pts, o, [{ p: P, c: COL.a }]), [x, y] = P, ux = Math.floor(x), uy = Math.floor(y);
    const common = { visual, after, keys: { comma: true }, neg: false };
    if (f === 'abs' || f === 'ord') {
      const isX = f === 'abs', v = isX ? x : y, u = Math.floor(v);
      return numQ({
        ...common, E: [v], tpl: `${isX ? 'abscisse' : 'ordonnée'} de ${n} : {0}`, html: `Quelle est ${isX ? "l'abscisse" : "l'ordonnée"} du point ${n} ? Une petite graduation vaut 0,1.`,
        hint: `Entre ${u} et ${u + 1} sur ${isX ? "l'axe horizontal" : "l'axe vertical"}, il y a 10 petits carreaux de 0,1. Combien en comptes-tu entre ${u} et la position de ${n} ?`,
        solution: `${n} est après la graduation ${u} de ${Math.round((v - u) * 10)} petit${Math.round((v - u) * 10) > 1 ? 's' : ''} carreau${Math.round((v - u) * 10) > 1 ? 'x' : ''} de 0,1 : ${u} + ${M(dix(v - u))} = ${M(v)}.`,
        msg: w => (w[0] === (isX ? y : x) ? `Tu as donné l'autre coordonnée de ${n}.` : ''), verify: E => Math.abs(E[0] - lirePoints(visual)[n][isX ? 0 : 1]) < 1e-6,
      });
    }
    return numQ({
      ...common, E: [x, y], tpl: `${n}( {0} ; {1} )`, html: `Lis les coordonnées du point ${n} dans le repère. Une petite graduation vaut 0,1.`,
      hint: `Entre deux graduations entières il y a 10 petits carreaux de 0,1. Pour ${n}, compte combien de petits carreaux le séparent de la graduation entière à sa gauche (${ux}), puis de celle en dessous de lui (${uy}).`,
      solution: `Abscisse : ${ux} puis ${Math.round((x - ux) * 10)} petit${Math.round((x - ux) * 10) > 1 ? 's' : ''} carreau${Math.round((x - ux) * 10) > 1 ? 'x' : ''} de 0,1, soit ${M(x)}. Ordonnée : ${uy} puis ${Math.round((y - uy) * 10)} petit${Math.round((y - uy) * 10) > 1 ? 's' : ''} carreau${Math.round((y - uy) * 10) > 1 ? 'x' : ''}, soit ${M(y)}. Donc ${pt(n, P)}.`,
      msg: v => (v[0] === y && v[1] === x ? `Tu as inversé les deux nombres : d'abord l'abscisse (axe horizontal).` : (Math.abs(v[0] - x) < 0.05 + 1e-9 && Math.abs(v[1] - y) < 0.05 + 1e-9) ? '' : (Math.round(v[0] * 100) === Math.round(x * 10) || Math.round(v[1] * 100) === Math.round(y * 10) ? `Attention à la virgule : un petit carreau vaut 0,1 (un dixième), pas 0,01.` : '')),
      verify: E => memes(E, lirePoints(visual)[n]),
    });
  }
}

export function C4() {
  const o1 = { x0: 0, x1: 4, y0: 0, y1: 4, step: 0.5 }, o2 = { x0: 0, x1: 2, y0: 0, y1: 2, step: 0.1, labelStep: 1 };
  const a = fig([{ n: 'A', p: [2.5, 1.5] }], o1, [{ p: [2.5, 1.5], c: COL.a }]);
  const b = fig([{ n: 'B', p: [1.3, 0.7] }], o2, [{ p: [1.3, 0.7], c: COL.a }]);
  const c = fig([{ n: 'C', p: [0.6, 1.4] }], o2, [{ p: [0.6, 1.4], c: COL.a }]);
  return cours('4. Lire des coordonnées non entières', `Les points ne tombent pas toujours sur une graduation entière. Il faut alors lire les graduations <b>intermédiaires</b> : des demis (0,5) ou des dixièmes (0,1).`,
    def(`Entre deux graduations entières, on peut avoir <b>une</b> graduation à mi-chemin (elle vaut 0,5) ou <b>neuf</b> petits traits (chaque petit carreau vaut 0,1). Les coordonnées s'écrivent alors avec une <b>virgule</b> : (1,3 ; 0,7).`),
    meth(`Repère la graduation <b>entière</b> juste avant le point, sur chaque axe.`, `Compte les petits carreaux entre cette graduation et le point (un carreau = 0,1 ; une demi-graduation = 0,5).`, `Écris le nombre avec une virgule.`),
    a,
    ex(`Exemple 1 : lis les coordonnées du point A (graduations en demis)`, `Abscisse : 2 puis une demi-graduation, soit 2,5. Ordonnée : 1 puis une demi-graduation, soit 1,5.<br>${rep('A( 2,5 ; 1,5 )')}`),
    b,
    ex(`Exemple 2 : lis les coordonnées du point B (une petite graduation vaut 0,1)`, `Abscisse : 1 puis 3 petits carreaux de 0,1, soit 1,3. Ordonnée : 0 puis 7 petits carreaux, soit 0,7.<br>${rep('B( 1,3 ; 0,7 )')}`),
    c,
    ex(`Exemple 3 : quelle est l'ordonnée du point C ? (une petite graduation vaut 0,1)`, `Entre 1 et 2 sur l'axe vertical, on compte 4 petits carreaux de 0,1 : 1 + 0,4 = 1,4.<br>${rep('1,4')}`),
    ex(`Exemple 4 : quelle est l'abscisse du point C ? (une petite graduation vaut 0,1)`, `Entre 0 et 1 sur l'axe horizontal, on compte 6 petits carreaux de 0,1 : 0,6.<br>${rep('0,6')}`),
    ex(`Exemple 5 : quelle est l'abscisse du point A ? (graduations en demis)`, `En descendant de A jusqu'à l'axe horizontal, on tombe à mi-chemin entre 2 et 3 : 2,5.<br>${rep('2,5')}`),
    ex(`Exemple 6 : quelle est l'ordonnée du point A ? (graduations en demis)`, `En allant de A jusqu'à l'axe vertical, on tombe à mi-chemin entre 1 et 2 : 1,5.<br>${rep('1,5')}`),
    fig([{ n: 'D', p: [-1.5, 2] }], { x0: -3, x1: 3, y0: -3, y1: 3, step: 0.5 }, [{ p: [-1.5, 2], c: COL.a }]),
    ex(`Exemple 7 : lis les coordonnées du point D (graduations en demis, nombres négatifs)`, `D est à gauche de l'axe vertical : abscisse négative, à mi-chemin entre −2 et −1, soit −1,5. Ordonnée : 2.<br>${rep('D( −1,5 ; 2 )')}`),
    warn(`Un petit carreau de 0,1 n'est pas 0,01 : <b>1,3</b> ne s'écrit pas 1,03.`, `On compte à partir de la graduation entière à <b>gauche</b> (ou en dessous) du point, jamais à partir de celle d'après.`),
    retenir(`des demis valent 0,5 ; entre deux graduations entières, 10 petits carreaux valent chacun 0,1.`));
}

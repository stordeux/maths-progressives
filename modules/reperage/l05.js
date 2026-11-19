// Niveau 5 : milieu d'un segment, distance horizontale ou verticale dans un repère (sans Pythagore). 4e.
import { repere, lirePoints, COL } from './draw.js';
import { numQ, ex, rep, warn, retenir, meth, def, cours, lettres, pt, cp, ri, pick, memes, M, P } from './util.js';

const fig = (pts, N, o = {}) => repere({ x0: o.pos ? 0 : -N, x1: N, y0: o.pos ? 0 : -N, y1: N, pts, segs: o.segs || [], guides: [], aria: 'repère du plan, points et segment', maxW: 380, maxH: 380 });
const A_ = (n, p, c = COL.b) => ({ n, p, c });
const half = v => Math.abs(v - Math.round(v)) > 1e-9;

export function L5(d) {
  const f = pick(d < 1 ? ['milieu'] : d < 2 ? ['milieu', 'dist'] : d < 3 ? ['milieu', 'dist', 'rect'] : ['milieu', 'dist', 'rect', 'dec']);
  const pos = d < 1 || (d < 2 && f === 'dist' && pick([true, false])), N = pos ? 8 : 6, nm = lettres(4, d);
  const lo = pos ? 1 : -N + 1, R = () => ri(lo, N - 1);
  for (;;) {
    if (f === 'milieu' || f === 'dec') {
      const [a, b] = nm, A = [R(), R()], B = [R(), R()];
      if (Math.max(Math.abs(A[0] - B[0]), Math.abs(A[1] - B[1])) < 3 || A[0] === B[0] || A[1] === B[1] || (!A[0] && !A[1]) || (!B[0] && !B[1])) continue;
      const odd = (A[0] + B[0]) % 2 !== 0 || (A[1] + B[1]) % 2 !== 0;
      if (f === 'milieu' && odd) continue;
      if (f === 'dec' && !odd) continue;
      const Mi = [(A[0] + B[0]) / 2, (A[1] + B[1]) / 2], seg = [{ a: A, b: B, c: COL.b, w: 2.4 }];
      const visual = fig([A_(a, A), A_(b, B)], N, { pos, segs: seg }), after = fig([A_(a, A), A_(b, B), A_('M', Mi, COL.a)], N, { pos, segs: seg });
      return numQ({
        E: Mi, tpl: 'M( {0} ; {1} )', neg: !pos, keys: { comma: f === 'dec' }, visual, after,
        html: `Dans le repère, ${pt(a, A)} et ${pt(b, B)}. Donne les coordonnées du milieu M du segment [${a}${b}].`,
        hint: `Le milieu M est à mi-chemin entre ${a} et ${b}. Pour son abscisse, cherche le nombre situé au milieu de ${M(A[0])} et ${M(B[0])} (additionne-les puis divise par 2) ; fais de même avec ${M(A[1])} et ${M(B[1])} pour l'ordonnée.`,
        solution: `Abscisse de M : (${M(A[0])} + ${P(B[0])}) ÷ 2 = ${M(Mi[0])}. Ordonnée de M : (${M(A[1])} + ${P(B[1])}) ÷ 2 = ${M(Mi[1])}. Donc ${pt('M', Mi)}.`,
        msg: v => (v[0] === A[0] + B[0] && v[1] === A[1] + B[1] ? `Tu as additionné sans diviser par 2 : le milieu est à mi-chemin, il faut diviser la somme par 2.` : v[0] === Mi[1] && v[1] === Mi[0] ? `Tu as inversé l'abscisse et l'ordonnée de M.` : ''),
        verify: E => { const P = lirePoints(after); return memes(E, P.M) && memes([(P[a][0] + P[b][0]) / 2, (P[a][1] + P[b][1]) / 2], E); },
      });
    }
    if (f === 'dist') {
      const [a, b] = nm, hor = pick([true, false]), c0 = R(), u = R(), w = R();
      if (Math.abs(u - w) < 2 || !u || !w || !c0) continue;
      const A = hor ? [u, c0] : [c0, u], B = hor ? [w, c0] : [c0, w], dist = Math.abs(u - w);
      const seg = [{ a: A, b: B, c: COL.a, w: 3 }];
      const visual = fig([A_(a, A), A_(b, B)], N, { pos, segs: seg });
      const s = Math.abs(u) + Math.abs(w);
      return numQ({
        E: [dist], tpl: `${a}${b} = {0}`, neg: false, visual, after: visual, html: `Dans le repère, ${pt(a, A)} et ${pt(b, B)}. Quelle est la distance ${a}${b} (en carreaux) ?`,
        hint: `${a} et ${b} ont ${hor ? `la même ordonnée (${M(c0)}) : le segment [${a}${b}] est horizontal` : `la même abscisse (${M(c0)}) : le segment [${a}${b}] est vertical`}. Compte les carreaux de ${a} à ${b}, ou calcule la différence entre ${M(u)} et ${M(w)} (le plus grand moins le plus petit).`,
        solution: `Sur une ligne ${hor ? 'horizontale' : 'verticale'}, la distance est la différence des ${hor ? 'abscisses' : 'ordonnées'} : ${M(Math.max(u, w))} − ${Math.min(u, w) < 0 ? '(' + M(Math.min(u, w)) + ')' : M(Math.min(u, w))} = ${dist}. Donc ${a}${b} = ${dist}.`,
        msg: v => (v[0] === s && s !== dist ? `Tu as additionné les ${hor ? 'abscisses' : 'ordonnées'} sans tenir compte des signes : on compte les carreaux entre les deux points (le plus grand moins le plus petit).` : v[0] === Math.abs(u + w) && s !== dist && u + w !== 0 ? `Tu as additionné au lieu de soustraire : une distance est la différence des ${hor ? 'abscisses' : 'ordonnées'}.` : ''),
        verify: E => { const P = lirePoints(visual); return hor ? P[a][1] === P[b][1] && Math.abs(P[a][0] - P[b][0]) === E[0] : P[a][0] === P[b][0] && Math.abs(P[a][1] - P[b][1]) === E[0]; },
      });
    }
    // rectangle de côtés parallèles aux axes : trouver B ou D
    const [a, b, c, dn] = nm, x1 = R(), x2 = R(), y1 = R(), y2 = R();
    if (x2 - x1 < 2 || y2 - y1 < 2 || [[x1, y1], [x2, y1], [x1, y2], [x2, y2]].some(p => !p[0] && !p[1])) continue;
    const A = [x1, y1], B = [x2, y1], C = [x2, y2], D = [x1, y2], askB = pick([true, false]), T = askB ? B : D, tn = askB ? b : dn;
    const rectSeg = [[A, B], [B, C], [C, D], [D, A]].map(([p, q]) => ({ a: p, b: q, c: COL.g, w: 2.2, dash: true }));
    const visual = fig([A_(a, A), A_(c, C)], N, { pos, segs: [{ a: A, b: C, c: COL.hid || '#888', dash: true, w: 1.6 }] }), after = fig([A_(a, A), A_(b, B, COL.g), A_(c, C), A_(dn, D, COL.g)], N, { pos, segs: rectSeg });
    return numQ({
      E: T, tpl: `${tn}( {0} ; {1} )`, neg: !pos, visual, after, html: `${a}${b}${c}${dn} est un rectangle dont les côtés sont parallèles aux axes. On donne ${pt(a, A)} et ${pt(c, C)}. Donne les coordonnées de ${tn}.`,
      hint: `Les côtés sont parallèles aux axes : ${tn} est sur la même ${askB ? 'ligne horizontale' : 'colonne verticale'} que ${a} et sur la même ${askB ? 'colonne verticale' : 'ligne horizontale'} que ${c}. Quel nombre ${tn} prend-il à ${a}, et lequel à ${c} ?`,
      solution: `${tn} a ${askB ? `la même ordonnée que ${a} (${M(y1)}) et la même abscisse que ${c} (${M(x2)})` : `la même abscisse que ${a} (${M(x1)}) et la même ordonnée que ${c} (${M(y2)})`}. Donc ${pt(tn, T)}.`,
      msg: v => (v[0] === (askB ? y1 : y2) && v[1] === (askB ? x2 : x1) ? `Tu as inversé l'abscisse et l'ordonnée.` : memes(v, askB ? D : B) ? `C'est l'autre sommet : ${askB ? dn : b} est de l'autre côté. Relis le nom demandé.` : ''),
      verify: E => { const P = lirePoints(after); return memes(E, P[tn]) && P[b][1] === P[a][1] && P[b][0] === P[c][0] && P[dn][0] === P[a][0] && P[dn][1] === P[c][1]; },
    });
  }
}

export function C5() {
  const sg = [{ a: [1, 2], b: [5, 6], c: COL.b }];
  const f1 = fig([A_('A', [1, 2]), A_('B', [5, 6]), A_('M', [3, 4], COL.a)], 8, { pos: true, segs: sg });
  const f2 = fig([A_('A', [-4, 1]), A_('B', [2, -3]), A_('M', [-1, -1], COL.a)], 6, { segs: [{ a: [-4, 1], b: [2, -3], c: COL.b }] });
  const f3 = fig([A_('A', [-3, 2]), A_('B', [4, 2])], 6, { segs: [{ a: [-3, 2], b: [4, 2], c: COL.a, w: 3 }] });
  const f4 = fig([A_('A', [-2, -1]), A_('B', [3, -1], COL.g), A_('C', [3, 3]), A_('D', [-2, 3], COL.g)], 6, { segs: [[[-2, -1], [3, -1]], [[3, -1], [3, 3]], [[3, 3], [-2, 3]], [[-2, 3], [-2, -1]]].map(([p, q]) => ({ a: p, b: q, c: COL.g, dash: true })) });
  const f5 = fig([A_('A', [1, 2]), A_('B', [4, 5]), A_('M', [2.5, 3.5], COL.a)], 6, { pos: true, segs: [{ a: [1, 2], b: [4, 5], c: COL.b }] });
  void half; void cp;
  return cours('5. Milieu et distances dans un repère', `Dans un repère, on peut trouver un <b>milieu</b> ou une <b>distance</b> par un simple calcul sur les coordonnées, sans mesurer.`,
    def(`Le <b>milieu</b> de [AB] a pour coordonnées <b>la moyenne</b> des abscisses et <b>la moyenne</b> des ordonnées : M( (x<sub>A</sub> + x<sub>B</sub>) ÷ 2 ; (y<sub>A</sub> + y<sub>B</sub>) ÷ 2 ).<br>Si deux points ont la <b>même ordonnée</b> (segment horizontal), la distance est la différence des abscisses ; s'ils ont la <b>même abscisse</b> (segment vertical), c'est la différence des ordonnées (le plus grand moins le plus petit).`),
    f1,
    ex(`Exemple 1 : milieu de [AB] avec A(1 ; 2) et B(5 ; 6)`, `Abscisse de M : (1 + 5) ÷ 2 = 3. Ordonnée de M : (2 + 6) ÷ 2 = 4.<br>${rep('M( 3 ; 4 )')}`),
    f2,
    ex(`Exemple 2 : milieu de [AB] avec A(−4 ; 1) et B(2 ; −3) (nombres relatifs)`, `Abscisse : (−4 + 2) ÷ 2 = −1. Ordonnée : (1 + (−3)) ÷ 2 = −1.<br>${rep('M( −1 ; −1 )')}`),
    f5,
    ex(`Exemple 3 : milieu de [AB] avec A(1 ; 2) et B(4 ; 5) (résultat décimal)`, `Abscisse : (1 + 4) ÷ 2 = 2,5. Ordonnée : (2 + 5) ÷ 2 = 3,5. Le milieu n'est pas forcément sur une graduation entière.<br>${rep('M( 2,5 ; 3,5 )')}`),
    f3,
    ex(`Exemple 4 : distance AB avec A(−3 ; 2) et B(4 ; 2) (en carreaux)`, `A et B ont la même ordonnée : [AB] est horizontal. On compte de −3 à 4 : 4 − (−3) = 7 carreaux. Attention : on <b>soustrait</b>, on n'additionne pas −3 et 4.<br>${rep('AB = 7')}`),
    ex(`Exemple 4 bis : distance CD avec C(2 ; −3) et D(2 ; 4) (en carreaux)`, `C et D ont la même abscisse : [CD] est vertical. On compte de −3 à 4 : 4 − (−3) = 7 carreaux.<br>${rep('CD = 7')}`),
    f4,
    ex(`Exemple 5 : ABCD est un rectangle dont les côtés sont parallèles aux axes, avec A(−2 ; −1) et C(3 ; 3) ; coordonnées de B`, `B est sur la même ligne horizontale que A (ordonnée −1) et dans la même colonne que C (abscisse 3).<br>${rep('B( 3 ; −1 )')}`),
    ex(`Exemple 6 : ABCD est un rectangle dont les côtés sont parallèles aux axes, avec A(−2 ; −1) et C(3 ; 3) ; coordonnées de D`, `D est dans la même colonne que A (abscisse −2) et sur la même ligne horizontale que C (ordonnée 3).<br>${rep('D( −2 ; 3 )')}`),
    warn(`Pour un milieu, ne pas oublier de <b>diviser par 2</b> la somme.`, `Une distance est <b>positive</b> : on soustrait le plus petit nombre du plus grand (avec des relatifs, 4 − (−3) = 7).`),
    retenir(`milieu : moyenne des abscisses et moyenne des ordonnées ; distance sur une ligne horizontale ou verticale : différence des coordonnées qui changent.`));
}

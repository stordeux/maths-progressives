// Niveau 5 : symétrie centrale (demi-tour) : image d'un point dans un repère. 5e.
import { figure, COL } from './draw.js';
import { names, numQ, ex, rep, warn, retenir, meth, def, cours, cols, pick, ri } from './util.js';
import { M } from '../../engine/util/fmt.js';

const G = 6;
const inG = p => Math.abs(p[0]) <= G && Math.abs(p[1]) <= G;
function scene(cn, ctr, pts, colors, o = {}) {
  const P = ctr ? { ...pts, [cn]: ctr } : { ...pts };
  return figure({
    P, grid: { x0: -G, y0: -G, x1: G, y1: G, axes: true }, k: 28, maxW: 400, maxH: 400, ext: 0, colors: { [cn]: COL.a, ...colors },
    segs: o.segs || [], aria: 'quadrillage, point et centre de symétrie', lab: o.lab || {},
  });
}
const mv = (dx, dy) => `${Math.abs(dx) === 0 ? '' : `${Math.abs(dx)} carreau${Math.abs(dx) > 1 ? 'x' : ''} ${dx > 0 ? 'vers la droite' : 'vers la gauche'}`}${dx !== 0 && dy !== 0 ? ' et ' : ''}${dy === 0 ? '' : `${Math.abs(dy)} carreau${Math.abs(dy) > 1 ? 'x' : ''} ${dy > 0 ? 'vers le haut' : 'vers le bas'}`}`;

export function L5(d) {
  const [a, cn] = names(d, 'AO'), a2 = a + '′';
  const forms = d < 1 ? ['orig'] : d < 2 ? ['orig', 'orig'] : d < 3 ? ['orig', 'ctr'] : d < 4 ? ['orig', 'ctr', 'anti'] : ['ctr', 'anti', 'centre'];
  const f = pick(forms), cnn = f === 'orig' ? 'O' : cn === 'O' ? 'I' : cn, cname = f === 'orig' ? 'O' : cnn;
  for (;;) {
    const C = f === 'orig' ? [0, 0] : [ri(-3, 3), ri(-3, 3)];
    const A = [ri(-5, 5), ri(-5, 5)], A2 = [2 * C[0] - A[0], 2 * C[1] - A[1]];
    if (!inG(A2) || (A[0] === C[0] && A[1] === C[1])) continue;
    if (f === 'orig' && d < 1 && (A[0] === 0 || A[1] === 0)) continue;
    const dx = C[0] - A[0], dy = C[1] - A[1];
    const checkMid = E => Math.abs((A[0] + E[0]) / 2 - C[0]) < 1e-9 && Math.abs((A[1] + E[1]) / 2 - C[1]) < 1e-9;
    if (f === 'orig' || f === 'ctr') {
      return numQ({
        E: A2, tpl: `${a2}( {0} ; {1} )`, neg: true,
        html: `${f === 'orig' ? `Le point ${a}(${M(A[0])} ; ${M(A[1])}) est tracé dans le repère. Donne les coordonnées de son symétrique ${a2} par rapport à l'origine ${cname}.` : `Le point ${a}(${M(A[0])} ; ${M(A[1])}) et le point ${cname}(${M(C[0])} ; ${M(C[1])}) sont tracés dans le repère. Donne les coordonnées du symétrique ${a2} de ${a} par rapport au point ${cname}.`}`,
        visual: scene(cname, C, { [a]: A }, { [a]: COL.b }),
        after: scene(cname, C, { [a]: A, [a2]: A2 }, { [a]: COL.b, [a2]: COL.g }, { segs: [{ a: A, b: A2, c: COL.g, dash: true, w: 2 }] }), 
        hint: `Pour aller de ${a} à ${cname}, il faut te déplacer de ${mv(dx, dy)}. ${cname} doit être le milieu de [${a}${a2}] : que fais-tu à partir de ${cname} ?`,
        solution: `${cname} est le milieu de [${a}${a2}]. De ${a} à ${cname}, on se déplace de ${mv(dx, dy)}. On refait le même déplacement à partir de ${cname} : ${a2}(${M(A2[0])} ; ${M(A2[1])}).${f === 'orig' ? ` (Avec l'origine pour centre, on change simplement les deux signes.)` : ''}`,
        msg: v => (v[0] === -A[0] && v[1] === -A[1] && f === 'ctr' ? `Tu as pris le symétrique par rapport à l'origine : le centre est ici ${cname}(${M(C[0])} ; ${M(C[1])}).` : v[0] === A[1] && v[1] === A[0] ? `Ce n'est pas une symétrie par rapport à une droite : on cherche le point tel que ${cname} soit le milieu de [${a}${a2}].` : v[0] === -A[0] && v[1] === A[1] || v[0] === A[0] && v[1] === -A[1] ? `Pour une symétrie centrale, les <b>deux</b> coordonnées changent.` : ''),
        verify: checkMid,
      });
    }
    if (f === 'anti') {
      return numQ({
        E: A, tpl: `${a}( {0} ; {1} )`, neg: true, html: `${a2}(${M(A2[0])} ; ${M(A2[1])}) est le symétrique du point ${a} par rapport à ${cname}(${M(C[0])} ; ${M(C[1])}). Donne les coordonnées de ${a}.`,
        visual: scene(cname, C, { [a2]: A2 }, { [a2]: COL.g }), after: scene(cname, C, { [a]: A, [a2]: A2 }, { [a]: COL.b, [a2]: COL.g }, { segs: [{ a: A, b: A2, c: COL.g, dash: true, w: 2 }] }),
        hint: `${cname} est le milieu de [${a}${a2}]. Pour aller de ${a2} à ${cname}, déplace-toi de ${mv(-dx, -dy)} : fais le même déplacement à partir de ${cname}.`,
        solution: `${cname} est le milieu de [${a}${a2}], donc ${a} est le symétrique de ${a2} par rapport à ${cname}. De ${a2} à ${cname} : ${mv(-dx, -dy)}. On refait ce déplacement à partir de ${cname} : ${a}(${M(A[0])} ; ${M(A[1])}).`,
        msg: v => (v[0] === A2[0] && v[1] === A2[1] ? `C'est le point ${a2} lui-même ; on cherche son symétrique ${a}.` : ''),
        verify: E => Math.abs((E[0] + A2[0]) / 2 - C[0]) < 1e-9 && Math.abs((E[1] + A2[1]) / 2 - C[1]) < 1e-9,
      });
    }
    // centre : milieu de [AA′]
    if ((A[0] + A2[0]) % 2 !== 0 || (A[1] + A2[1]) % 2 !== 0) continue;
    return numQ({
      E: C, tpl: `${cname}( {0} ; {1} )`, neg: true, html: `Le point ${a2}(${M(A2[0])} ; ${M(A2[1])}) est le symétrique de ${a}(${M(A[0])} ; ${M(A[1])}) par rapport à un point ${cname}. Quelles sont les coordonnées de ${cname} ?`,
      visual: scene('?', null, { [a]: A, [a2]: A2 }, { [a]: COL.b, [a2]: COL.g }, { segs: [{ a: A, b: A2, c: COL.g, dash: true, w: 2 }] }),
      hint: `Le centre ${cname} est le milieu de [${a}${a2}] : il est à mi-chemin entre ${a}(${M(A[0])} ; ${M(A[1])}) et ${a2}(${M(A2[0])} ; ${M(A2[1])}). Pour chaque coordonnée, que fais-tu avec les deux nombres ?`,
      solution: (`${cname} est le milieu de [${a}${a2}] : abscisse (${M(A[0])} + ${M(A2[0])}) ÷ 2 = ${M(C[0])}, ordonnée (${M(A[1])} + ${M(A2[1])}) ÷ 2 = ${M(C[1])}. Donc ${cname}(${M(C[0])} ; ${M(C[1])}).`).replace(/\+ −/g, '− '),
      msg: v => (v[0] === A[0] + A2[0] && v[1] === A[1] + A2[1] ? `Tu as additionné sans diviser par 2 : le milieu est à mi-chemin.` : ''),
      verify: E => Math.abs(2 * E[0] - A[0] - A2[0]) < 1e-9 && Math.abs(2 * E[1] - A[1] - A2[1]) < 1e-9,
    });
  }
}

export function C5() {
  const f1 = scene('O', [0, 0], { A: [3, 2], 'A′': [-3, -2] }, { A: COL.b, 'A′': COL.g }, { segs: [{ a: [3, 2], b: [-3, -2], c: COL.g, dash: true, w: 2 }] });
  const f2 = scene('I', [1, 1], { B: [-2, 3], 'B′': [4, -1] }, { B: COL.b, 'B′': COL.g }, { segs: [{ a: [-2, 3], b: [4, -1], c: COL.g, dash: true, w: 2 }] });
  const f3 = scene('I', [-1, 2], { 'C′': [3, -2], C: [-5, 6] }, { C: COL.b, 'C′': COL.g }, { segs: [{ a: [-5, 6], b: [3, -2], c: COL.g, dash: true, w: 2 }] });
  const f4 = scene('?', null, { D: [-3, -4], 'D′': [1, 2] }, { D: COL.b, 'D′': COL.g }, { segs: [{ a: [-3, -4], b: [1, 2], c: COL.g, dash: true, w: 2 }] });
  return cours('5. Symétrie centrale (demi-tour)', `La symétrie centrale, c'est un <b>demi-tour</b> autour d'un point : la figure se retrouve « la tête en bas ».`,
    def(`Le <b>symétrique</b> du point A par rapport au point O est le point A′ tel que <b>O est le milieu de [AA′]</b>. Le point O s'appelle le <b>centre de symétrie</b>. Le symétrique de O est O lui-même.<br>Dans un repère, si O est l'origine et A(x ; y), alors A′(−x ; −y).`),
    meth(`Repère le déplacement qui mène de A au centre O (nombre de carreaux à droite ou à gauche, en haut ou en bas).`, `Refais <b>exactement le même déplacement</b> à partir de O : tu arrives en A′.`, `Lis les coordonnées de A′ : abscisse, puis ordonnée. Contrôle : O est au milieu de [AA′].`),
    f1,
    ex(`Exemple 1 : le centre est l'origine, A(3 ; 2)`, `De A à O : 3 carreaux vers la gauche et 2 vers le bas. On refait ce déplacement à partir de O : A′(−3 ; −2). Avec l'origine pour centre, on change les deux signes.<br>${rep('A′( −3 ; −2 )')}`),
    f2,
    ex(`Exemple 2 : le centre est un autre point, B(−2 ; 3) et I(1 ; 1)`, `De B à I : 3 carreaux vers la droite et 2 vers le bas. À partir de I, on refait ce déplacement : (1 + 3 ; 1 − 2) = (4 ; −1).<br>${rep('B′( 4 ; −1 )')}`),
    f3,
    ex(`Exemple 3 : on connaît l'image, on cherche le point de départ (C′(3 ; −2), centre I(−1 ; 2))`, `Le centre I est aussi le milieu de [C′C]. De C′ à I : 4 carreaux vers la gauche et 4 vers le haut. À partir de I, on refait : (−1 − 4 ; 2 + 4) = (−5 ; 6).<br>${rep('C( −5 ; 6 )')}`),
    f4,
    ex(`Exemple 4 : trouver le centre (D(−3 ; −4) et D′(1 ; 2))`, `Le centre est le milieu de [DD′] : abscisse (−3 + 1) ÷ 2 = −1, ordonnée (−4 + 2) ÷ 2 = −1.<br>${rep('I( −1 ; −1 )')}`),
    warn(`Ne confonds pas avec la symétrie axiale : ici <b>les deux</b> coordonnées changent (pour le centre O), et on passe par le centre, pas par une droite.`, `Le déplacement de A à O et celui de O à A′ sont <b>identiques</b> (même sens).`, `Si le centre n'est pas l'origine, on n'inverse pas simplement les signes.`),
    retenir(`O est le milieu de [AA′] ; autour de l'origine, (x ; y) devient (−x ; −y).`));
}
void cols;

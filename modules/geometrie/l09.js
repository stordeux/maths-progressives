// Niveau 9 : parallélogramme (côtés opposés, diagonales, angles ; calculs). 5e.
import { figure, rot, COL, dist, angleAt } from './draw.js';
import { names, orient, numQ, ex, rep, warn, retenir, meth, def, cours, cols, pick, ri, fr, H, chance } from './util.js';
import { S, triSSS, lenOut } from './l03.js';
import { M } from '../../engine/util/fmt.js';

/** parallélogramme ABCD à partir de AB = a, AD = b et de l'angle en A */
function paraSides(a, b, al) { const A = [0, 0], B = [a, 0], D = [b * Math.cos(al * Math.PI / 180), b * Math.sin(al * Math.PI / 180)]; return { A, B, C: [B[0] + D[0], B[1] + D[1]], D }; }
/** parallélogramme ABCD à partir de AO = u, BO = v, AB = c (O centre) */
function paraDiag(u, v, c) {
  const x = (c * c - u * u - v * v) / (2 * u), y = Math.sqrt(Math.max(0, v * v - x * x));
  return { A: [-u, 0], B: [x, y], C: [u, 0], D: [-x, -y], O: [0, 0] };
}
function paraFig(nm, pts, t, o = {}) {
  const [a, b, c, d] = nm, sc = o.scale || S, q = {};
  for (const [k, n] of [['A', a], ['B', b], ['C', c], ['D', d]]) q[n] = rot([pts[k][0] * sc, pts[k][1] * sc], t);
  const P = { ...q }, f = {
    P, polys: [{ p: nm, c: COL.ink }], pars: [{ a: q[a], b: q[b], n: 1 }, { a: q[d], b: q[c], n: 1 }, { a: q[b], b: q[c], n: 2 }, { a: q[a], b: q[d], n: 2 }], segs: [], len: [], arcs: [], ext: 0, maxW: 440, maxH: 250,
    colors: {}, aria: 'parallélogramme ' + nm.join(''), lab: {},
  };
  const G = [(q[a][0] + q[c][0]) / 2, (q[a][1] + q[c][1]) / 2];
  if (o.diag) { P.O = rot([0, 0], t); f.segs.push({ a: q[a], b: q[c], c: COL.b, w: 2.2 }, { a: q[b], b: q[d], c: COL.g, w: 2.2 }); f.colors.O = COL.a; f.pars = f.pars.filter(() => true); }
  for (const [x, y, s, col, pos] of o.lens || []) f.len.push({ ...lenOut(P[x] || q[x], P[y] || q[y], G, s, col || COL.ink), pos });
  for (const r of o.arcs || []) f.arcs.push(r);
  return { svg: figure(f), q, P };
}
const cn = (a, b, c, d) => [a, b, c, d];
const ang3 = (P, x, y, z) => angleAt(P[x], P[y], P[z]);

export function L9(d) {
  const nm = names(d, 'ABCD'), [a, b, c, e] = nm, t = orient(d);
  const forms = d < 1 ? ['oppose'] : d < 2 ? ['oppose', 'diag', 'angle'] : d < 3 ? ['oppose', 'diag', 'angle', 'conseq', 'peri'] : d < 4 ? ['oppose', 'diag', 'angle', 'conseq', 'peri', 'perimin', 'tri'] : ['diag', 'conseq', 'peri', 'perimin', 'tri', 'coord', 'coord'];
  const f = pick(forms), comma = d >= 2;
  const dec = () => (comma ? ri(8, 30) / 2 : ri(3, 14));
  if (f === 'oppose') {
    const A = dec(), B = dec(), al = ri(5, 14) * 10, pts = paraSides(A, B, al), swap = chance(0.5), [x, y, s1, s2] = swap ? [b, c, B, A] : [a, b, A, B];
    const g = swap ? [`${b}${c}`, `${a}${e}`] : [`${a}${b}`, `${c}${e}`], val = swap ? B : A;
    const sc = paraFig(nm, pts, t, { lens: [[x, y, `${g[0]} = ${fr(val)} cm`, COL.b]], scale: 0.4 });
    const q = sc.q;
    return numQ({
      E: [val], tpl: `${g[1]} = {0} cm`, comma, html: `${a}${b}${c}${e} est un parallélogramme et ${g[0]} = ${fr(val)} cm. Quelle est la longueur ${g[1]} ?`, visual: sc.svg,
      hint: `Dans un parallélogramme, que peut-on dire de deux côtés <b>opposés</b> ? Repère le côté opposé à [${g[0]}] : c'est [${g[1]}].`,
      solution: `${a}${b}${c}${e} est un parallélogramme : ses côtés opposés ont la même longueur. [${g[1]}] est opposé à [${g[0]}] donc ${g[1]} = ${g[0]} = <b>${fr(val)} cm</b>.`,
      msg: v => (v[0] === 2 * val ? `Les côtés opposés sont égaux (pas le double).` : ''),
      value: swap ? dist(q[a], q[e]) / 0.4 : dist(q[c], q[e]) / 0.4,
    });
  }
  if (f === 'diag') {
    const u = comma ? ri(4, 14) / 2 : ri(2, 8), v = comma ? ri(4, 14) / 2 : ri(2, 8), c0 = Math.max(Math.abs(u - v) + 1.5, 3) + ri(0, 3) / 2, pts = paraDiag(u, v, Math.min(c0, u + v - 1.5));
    const which = pick(['AC', 'BD']), back = chance(0.5), dv = which === 'AC' ? u : v;
    const nmv = which === 'AC' ? [a, c] : [b, e], sc = paraFig(nm, { ...pts }, t, { diag: true, lens: [[nmv[0], nmv[1], back ? `${nmv.join('')} = ${fr(2 * dv)} cm` : `O${nmv[0]} = ${fr(dv)} cm`, COL.b, 0.25]], scale: 0.4 });
    const E = back ? dv : 2 * dv;
    return numQ({
      E: [E], tpl: back ? `O${nmv[0]} = {0} cm` : `${nmv.join('')} = {0} cm`, comma: true,
      html: back ? `${a}${b}${c}${e} est un parallélogramme de centre O (point d'intersection de ses diagonales). On a ${nmv.join('')} = ${fr(2 * dv)} cm. Quelle est la longueur O${nmv[0]} ?` : `${a}${b}${c}${e} est un parallélogramme de centre O (point d'intersection de ses diagonales). On a O${nmv[0]} = ${fr(dv)} cm. Quelle est la longueur ${nmv.join('')} ?`,
      visual: sc.svg, hint: back ? `Dans un parallélogramme, O est le milieu de chaque diagonale : O est le milieu de [${nmv.join('')}]. Que vaut alors O${nmv[0]} par rapport à ${nmv.join('')} ?` : `O est le milieu des diagonales du parallélogramme : O est le milieu de [${nmv.join('')}]. Comment passer de O${nmv[0]} à la diagonale entière ?`,
      solution: back ? `Les diagonales d'un parallélogramme se coupent en leur milieu : O est le milieu de [${nmv.join('')}], donc O${nmv[0]} = ${nmv.join('')} ÷ 2 = ${fr(2 * dv)} ÷ 2 = <b>${fr(dv)} cm</b>.` : `Les diagonales d'un parallélogramme se coupent en leur milieu : O est le milieu de [${nmv.join('')}], donc ${nmv.join('')} = 2 × O${nmv[0]} = 2 × ${fr(dv)} = <b>${fr(2 * dv)} cm</b>.`,
      msg: v2 => (back ? (v2[0] === 2 * dv ? `C'est la diagonale entière ; O${nmv[0]} n'en est que la moitié.` : '') : (v2[0] === dv ? `C'est seulement une moitié de la diagonale : la diagonale entière est le double.` : '')),
      value: back ? dist(sc.P.O, sc.q[nmv[0]]) / 0.4 : dist(sc.q[nmv[0]], sc.q[nmv[1]]) / 0.4,
    });
  }
  if (f === 'angle' || f === 'conseq') {
    const al = d < 2 ? 10 * ri(4, 14) : ri(35, 145), pts = paraSides(ri(6, 9), ri(4, 6), al);
    const given = pick([[a, 0], [b, 1], [c, 2], [e, 3]]), alpha = (given[1] % 2 === 0) ? al : 180 - al;
    const tgtI = f === 'angle' ? (given[1] + 2) % 4 : (given[1] + 1 + 2 * ri(0, 1)) % 4, tg = nm[tgtI], truth = (tgtI % 2 === given[1] % 2) ? alpha : 180 - alpha;
    const Pn = {}; ['A', 'B', 'C', 'D'].forEach((k, i) => { Pn[nm[i]] = rot([pts[k][0] * 0.4, pts[k][1] * 0.4], t); });
    const angName = i => `${nm[(i + 3) % 4]}${nm[i]}${nm[(i + 1) % 4]}`;
    const sc = paraFig(nm, pts, t, { scale: 0.4, arcs: [{ v: nm[given[1]], a: nm[(given[1] + 3) % 4], b: nm[(given[1] + 1) % 4], label: `${alpha}°`, r: 22 }, { v: tg, a: nm[(tgtI + 3) % 4], b: nm[(tgtI + 1) % 4], label: '?', r: 22, c: COL.g, fill: COL.gFill }] });
    const opp = f === 'angle';
    return numQ({
      E: [truth], tpl: `${H(angName(tgtI))} = {0} °`, keys: { neg: false }, html: `${a}${b}${c}${e} est un parallélogramme et ${H(angName(given[1]))} = ${alpha}°. Quelle est la mesure de l'angle ${H(angName(tgtI))} ?`, visual: sc.svg,
      hint: opp ? `${H(angName(tgtI))} est l'angle <b>opposé</b> à ${H(angName(given[1]))} (sommets ${tg} et ${given[0]} en face l'un de l'autre) : que peut-on dire des angles opposés d'un parallélogramme ?` : `${H(angName(tgtI))} et ${H(angName(given[1]))} sont deux angles <b>consécutifs</b> (ils partagent un côté, sommets ${given[0]} et ${tg} voisins) : que peut-on dire de leur somme ?`,
      solution: opp ? `Les angles opposés d'un parallélogramme ont la même mesure : ${H(angName(tgtI))} = ${H(angName(given[1]))} = <b>${alpha}°</b>.` : `Deux angles consécutifs d'un parallélogramme sont supplémentaires (leur somme fait 180°) : ${H(angName(tgtI))} = 180° − ${alpha}° = <b>${truth}°</b>.`,
      msg: v => (opp && v[0] === 180 - alpha ? `Ce sont des angles opposés (face à face), pas consécutifs : ils sont égaux.` : !opp && v[0] === alpha ? `Ce sont des angles consécutifs : leur somme est 180°, ils ne sont pas égaux (sauf rectangle).` : ''),
      verify: E => Math.abs(angleAt(Pn[nm[(tgtI + 3) % 4]], Pn[tg], Pn[nm[(tgtI + 1) % 4]]) - E[0]) < 1e-6,
    });
  }
  if (f === 'peri' || f === 'perimin') {
    const A = ri(4, 14), B = ri(3, 12), pts = paraSides(A, B, ri(6, 13) * 10), min = f === 'perimin';
    const P = 2 * (A + B), sc = paraFig(nm, pts, t, { scale: 0.35, lens: min ? [[a, b, `${a}${b} = ${A} cm`, COL.b], [c, e, '', COL.b]].slice(0, 1) : [[a, b, `${a}${b} = ${A} cm`, COL.b], [b, c, `${b}${c} = ${B} cm`, COL.g]] });
    if (!min) {
      return numQ({
        E: [P], tpl: `Périmètre : {0} cm`, html: `${a}${b}${c}${e} est un parallélogramme avec ${a}${b} = ${A} cm et ${b}${c} = ${B} cm. Quel est son périmètre ?`, visual: sc.svg,
        hint: `Dans un parallélogramme, les côtés opposés sont égaux : ${c}${e} est égal à lequel des côtés connus ? Et ${e}${a} ? Additionne ensuite les quatre côtés.`,
        solution: `${c}${e} = ${a}${b} = ${A} cm et ${e}${a} = ${b}${c} = ${B} cm. Périmètre = ${A} + ${B} + ${A} + ${B} = 2 × (${A} + ${B}) = <b>${P} cm</b>.`,
        msg: v => (v[0] === A + B ? `Il faut les <b>quatre</b> côtés : les deux autres sont égaux aux deux premiers.` : ''), value: 2 * (dist(sc.q[a], sc.q[b]) + dist(sc.q[b], sc.q[c])) / 0.35,
      });
    }
    return numQ({
      E: [B], tpl: `${b}${c} = {0} cm`, html: `${a}${b}${c}${e} est un parallélogramme de périmètre ${P} cm, avec ${a}${b} = ${A} cm. Quelle est la longueur ${b}${c} ?`, visual: sc.svg,
      hint: `Le périmètre est la somme des quatre côtés : deux côtés mesurent ${A} cm (${a}${b} et son opposé). Que reste-t-il pour les deux autres côtés, égaux entre eux ?`,
      solution: `${c}${e} = ${a}${b} = ${A} cm. Les deux côtés ${b}${c} et ${e}${a} sont égaux : ${b}${c} = (${P} − ${A} − ${A}) ÷ 2 = ${P - 2 * A} ÷ 2 = <b>${B} cm</b>.`,
      msg: v => (v[0] === P - 2 * A ? `${P - 2 * A} cm est la longueur des <b>deux</b> côtés ${b}${c} et ${e}${a} : divise par 2.` : v[0] === P - A ? `Il y a deux côtés de ${A} cm à enlever, pas un seul.` : ''),
      value: (P - 2 * dist(sc.q[a], sc.q[b]) / 0.35) / 2,
    });
  }
  if (f === 'tri') {
    const u = ri(3, 8), v = ri(3, 8), c0 = ri(Math.abs(u - v) + 2, u + v - 2 > Math.abs(u - v) + 2 ? u + v - 2 : Math.abs(u - v) + 2), pts = paraDiag(u, v, c0);
    const sc = paraFig(nm, pts, t, { diag: true, scale: 0.4, lens: [[a, c, `${a}${c} = ${2 * u} cm`, COL.b, 0.25], [b, e, `${b}${e} = ${2 * v} cm`, COL.g, 0.25], [a, b, `${a}${b} = ${c0} cm`, COL.ink]] });
    const E = u + v + c0;
    return numQ({
      E: [E], tpl: `Périmètre de O${a}${b} : {0} cm`, html: `${a}${b}${c}${e} est un parallélogramme de centre O. On a ${a}${c} = ${2 * u} cm, ${b}${e} = ${2 * v} cm et ${a}${b} = ${c0} cm. Quel est le périmètre du triangle O${a}${b} ?`, visual: sc.svg,
      hint: `O est le milieu des deux diagonales : cherche O${a} (moitié de ${a}${c}) et O${b} (moitié de ${b}${e}), puis ajoute ${a}${b}.`,
      solution: `O${a} = ${a}${c} ÷ 2 = ${u} cm et O${b} = ${b}${e} ÷ 2 = ${v} cm (O est le milieu de chaque diagonale). Périmètre = ${u} + ${v} + ${c0} = <b>${E} cm</b>.`,
      msg: v2 => (v2[0] === 2 * u + 2 * v + c0 ? `Tu as utilisé les diagonales entières ; O est leur milieu : prends leurs moitiés.` : ''),
      value: (dist(sc.P.O, sc.q[a]) + dist(sc.P.O, sc.q[b]) + dist(sc.q[a], sc.q[b])) / 0.4,
    });
  }
  // coord
  for (;;) {
    const Bp = [ri(-4, 4), ri(-4, 4)], Ap = [ri(-5, 5), ri(-5, 5)], Cp = [ri(-5, 5), ri(-5, 5)], Dp = [Ap[0] + Cp[0] - Bp[0], Ap[1] + Cp[1] - Bp[1]];
    const cr = (Ap[0] - Bp[0]) * (Cp[1] - Bp[1]) - (Ap[1] - Bp[1]) * (Cp[0] - Bp[0]);
    if (!cr || Math.abs(Dp[0]) > 6 || Math.abs(Dp[1]) > 6) continue;
    const pts = { [a]: Ap, [b]: Bp, [c]: Cp };
    const mk = withD => figure({
      P: withD ? { ...pts, [e]: Dp } : pts, grid: { x0: -6, y0: -6, x1: 6, y1: 6, axes: true }, k: 28, maxW: 400, maxH: 400, ext: 0, colors: { [e]: COL.g },
      ...(withD ? { polys: [{ p: nm, c: COL.ink }] } : { segs: [{ a: Ap, b: Bp, c: COL.ink }, { a: Bp, b: Cp, c: COL.ink }] }), aria: 'quadrillage, points A, B, C',
    });
    return numQ({
      E: Dp, tpl: `${e}( {0} ; {1} )`, neg: true, html: `Dans le repère, ${a}(${M(Ap[0])} ; ${M(Ap[1])}), ${b}(${M(Bp[0])} ; ${M(Bp[1])}) et ${c}(${M(Cp[0])} ; ${M(Cp[1])}). Donne les coordonnées du point ${e} tel que ${a}${b}${c}${e} soit un parallélogramme.`,
      visual: mk(false), after: mk(true),
      hint: `Dans le parallélogramme ${a}${b}${c}${e}, les côtés opposés [${b}${a}] et [${c}${e}] sont parallèles et de même longueur : pour passer de ${b} à ${a}, on se déplace de ${M(Ap[0] - Bp[0])} horizontalement et de ${M(Ap[1] - Bp[1])} verticalement. Que fais-tu à partir de ${c} ?`,
      solution: (`De ${b} à ${a} : déplacement (${M(Ap[0] - Bp[0])} ; ${M(Ap[1] - Bp[1])}). Les côtés opposés sont parallèles et égaux : on refait ce déplacement à partir de ${c} : ${e}(${M(Cp[0])} + ${M(Ap[0] - Bp[0])} ; ${M(Cp[1])} + ${M(Ap[1] - Bp[1])}) = ${e}(${M(Dp[0])} ; ${M(Dp[1])}). (Contrôle : les diagonales [${a}${c}] et [${b}${e}] ont le même milieu.)`).replace(/\+ −/g, '− '),
      msg: v => (v[0] === Ap[0] + Cp[0] && v[1] === Ap[1] + Cp[1] ? `Tu as additionné les coordonnées de ${a} et ${c} : il faut aussi retrancher celles de ${b}.` : ''),
      verify: E => Math.abs((Ap[0] + Cp[0]) / 2 - (Bp[0] + E[0]) / 2) < 1e-9 && Math.abs((Ap[1] + Cp[1]) / 2 - (Bp[1] + E[1]) / 2) < 1e-9,
    });
  }
}

export function C9() {
  const nm = ['A', 'B', 'C', 'D'], p1 = paraSides(7, 4.5, 70), pd = paraDiag(3, 2, 4), pp = paraSides(8, 5, 60);
  const f1 = paraFig(nm, p1, 0, { scale: 0.4, lens: [['A', 'B', 'AB = 7 cm', COL.b]] }).svg;
  const f2 = paraFig(nm, pd, 0, { diag: true, scale: 0.5, lens: [['A', 'C', 'AC = 8 cm', COL.b, 0.25]] }).svg;
  const f2b = paraFig(nm, pd, 0, { diag: true, scale: 0.5, lens: [['B', 'D', 'OB = 5 cm', COL.g, 0.25]] }).svg;
  const f3 = paraFig(nm, p1, 0, { scale: 0.4, arcs: [{ v: 'A', a: 'D', b: 'B', label: '70°', r: 22 }, { v: 'C', a: 'B', b: 'D', label: '?', r: 22, c: COL.g, fill: COL.gFill }] }).svg;
  const f3b = paraFig(nm, p1, 0, { scale: 0.4, arcs: [{ v: 'A', a: 'D', b: 'B', label: '70°', r: 22 }, { v: 'B', a: 'A', b: 'C', label: '?', r: 22, c: COL.g, fill: COL.gFill }] }).svg;
  const f4 = paraFig(nm, pp, 0, { scale: 0.35, lens: [['A', 'B', 'AB = 8 cm', COL.b], ['B', 'C', 'BC = 5 cm', COL.g]] }).svg;
  const f6 = paraFig(nm, pd, 0, { diag: true, scale: 0.5, lens: [['A', 'C', 'AC = 6 cm', COL.b, 0.25], ['B', 'D', 'BD = 4 cm', COL.g, 0.25], ['A', 'B', 'AB = 4 cm', COL.ink]] }).svg;
  const gr = figure({ P: { A: [1, 3], B: [-2, 1], C: [3, -1] }, grid: { x0: -6, y0: -6, x1: 6, y1: 6, axes: true }, k: 22, maxW: 330, ext: 0, segs: [{ a: [1, 3], b: [-2, 1] }, { a: [-2, 1], b: [3, -1] }], aria: 'quadrillage, A, B et C' });
  return cours('9. Parallélogramme : propriétés et calculs', `Un parallélogramme est un quadrilatère dont les côtés opposés sont parallèles. Cette seule définition donne beaucoup de propriétés, très utiles pour calculer.`,
    def(`Un <b>parallélogramme</b> est un quadrilatère dont les côtés opposés sont <b>parallèles</b>. Dans un parallélogramme ABCD :<br>• les <b>côtés opposés</b> ont la même longueur (AB = CD et BC = AD) ;<br>• les <b>diagonales</b> se coupent en leur <b>milieu</b> O ;<br>• les <b>angles opposés</b> sont égaux, deux angles <b>consécutifs</b> sont supplémentaires (somme 180°).`),
    meth(`Repère ce qui est cherché : un côté, une diagonale, un angle, un périmètre ou un point.`, `Choisis la propriété : côtés opposés égaux, milieu des diagonales, angles opposés égaux, angles consécutifs de somme 180°.`, `Calcule et rédige : « ABCD est un parallélogramme, donc … ».`),
    f1,
    ex(`Exemple 1 : côtés opposés (AB = 7 cm, quelle est la longueur CD ?)`, `ABCD est un parallélogramme : ses côtés opposés ont la même longueur, donc CD = AB.<br>${rep('CD = 7 cm')}`),
    f2,
    ex(`Exemple 2 : diagonales (AC = 8 cm, quelle est la longueur OA ?)`, `Les diagonales d'un parallélogramme se coupent en leur milieu : OA = AC ÷ 2 = 8 ÷ 2.<br>${rep('OA = 4 cm')}`),
    f2b,
    ex(`Exemple 3 : diagonale entière (OB = 5 cm, quelle est la longueur BD ?)`, `O est le milieu de [BD] : BD = 2 × OB = 2 × 5.<br>${rep('BD = 10 cm')}`),
    f3,
    ex(`Exemple 4 : angles opposés (angle A = 70°, quelle est la mesure de l'angle C ?)`, `Les angles opposés d'un parallélogramme sont égaux : l'angle C a la même mesure que l'angle A.<br>${rep('C = 70 °')}`),
    f3b,
    ex(`Exemple 5 : angles consécutifs (angle A = 70°, quelle est la mesure de l'angle B ?)`, `Deux angles consécutifs sont supplémentaires : B = 180° − 70°.<br>${rep('B = 110 °')}`),
    f4,
    ex(`Exemple 6 : périmètre (AB = 8 cm et BC = 5 cm)`, `CD = AB = 8 cm et AD = BC = 5 cm. Périmètre = 8 + 5 + 8 + 5 = 2 × (8 + 5).<br>${rep('périmètre : 26 cm')}`),
    ex(`Exemple 7 : un côté à partir du périmètre (périmètre 26 cm, AB = 8 cm, quelle est la longueur BC ?)`, `Les côtés AB et CD font 8 + 8 = 16 cm ; il reste 26 − 16 = 10 cm pour BC et AD, égaux : BC = 10 ÷ 2.<br>${rep('BC = 5 cm')}`),
    f6,
    ex(`Exemple 8 : périmètre d'un triangle formé avec les diagonales (AC = 6 cm, BD = 4 cm, AB = 4 cm)`, `OA = 6 ÷ 2 = 3 cm et OB = 4 ÷ 2 = 2 cm. Périmètre de OAB = 3 + 2 + 4.<br>${rep('périmètre de OAB : 9 cm')}`),
    gr,
    ex(`Exemple 9 : coordonnées du quatrième sommet (A(1 ; 3), B(−2 ; 1), C(3 ; −1))`, `Pour passer de B à A, on se déplace de +3 horizontalement et de +2 verticalement. Les côtés opposés [BA] et [CD] sont parallèles et égaux : on refait ce déplacement à partir de C : D(3 + 3 ; −1 + 2) = D(6 ; 1). Contrôle : le milieu de [AC] est (2 ; 1) et celui de [BD] est (2 ; 1).<br>${rep('D( 6 ; 1 )')}`),
    warn(`Les diagonales d'un parallélogramme ne sont pas égales en général : elles se coupent en leur <b>milieu</b>.`, `Angles <b>opposés</b> : égaux. Angles <b>consécutifs</b> : somme 180°, pas égaux (sauf si ce sont des angles droits).`, `Pour un périmètre, il faut <b>les quatre côtés</b> (ou 2 × (a + b)).`),
    retenir(`dans un parallélogramme : côtés opposés égaux, diagonales qui se coupent en leur milieu, angles opposés égaux, angles consécutifs supplémentaires.`));
}
void cn; void ang3; void triSSS; void cols;

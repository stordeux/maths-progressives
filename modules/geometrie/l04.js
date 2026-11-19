// Niveau 4 : médiatrice d'un segment (définition, points équidistants). 6e.
import { figure, rot, COL, dist } from './draw.js';
import { names, orient, numQ, choiceQ, ex, rep, warn, retenir, meth, def, cours, cols, pick, ri, fr, shuffle } from './util.js';
import { S, triSSS, lenOut } from './l03.js';
import { M } from '../../engine/util/fmt.js';

/** segment [AB] de c cm, médiatrice (d), point M de (d) à x cm de A et B ; coordonnées du dessin */
function medScene(nm, c, x, t, o = {}) {
  const [a, b, m, i] = nm, hh = Math.sqrt(x * x - c * c / 4) * S;
  const A = rot([-c * S / 2, 0], t), B = rot([c * S / 2, 0], t), I = rot([0, 0], t), Mp = rot([0, hh], t);
  const P = { [a]: A, [b]: B, [i]: I };
  if (!o.noM) P[m] = Mp;
  const f = {
    P, segs: [{ a: A, b: B, c: COL.ink, w: 2.8 }], ticks: [{ a: A, b: I, n: 1 }, { a: I, b: B, n: 1 }], rights: [{ v: i, a: b, b: m, size: 12 }], len: [], ext: 0, maxW: 440, maxH: 250,
    colors: { [m]: COL.a }, aria: 'segment, sa médiatrice et un point de cette droite', lab: { [i]: ((t - 135) % 360 + 360) % 360 },
  };
  const far = rot([0, -hh * 0.5 - 0.7], t), top = rot([0, hh + 0.7], t);
  f.lines = [{ a: top, b: far, c: COL.a, w: 2.6, arrows: false, label: '(d)' }];
  P._f = far; P._t = top; f.hide = ['_f', '_t'];
  if (!o.noM) f.segs.push({ a: A, b: Mp, c: COL.b, w: 2.4 }, { a: B, b: Mp, c: COL.b, w: 2.4 });
  const cen = rot([0, hh / 3], t);
  for (const [p, q, s, col] of o.lens || []) f.len.push({ ...lenOut(P[p], P[q], cen, s, col || COL.b), pos: p === a && q === b ? 0.8 : undefined });
  return { svg: figure(f), A, B, I, Mp };
}
/** triangle MAB à l'échelle (M défini par MA, MB, AB), sans médiatrice */
function triScene(nm, ma, mb, ab, t, o = {}) {
  const [a, b, m] = nm, T = triSSS(ab, mb, ma); // B=(0,0) C=(ab,0) A=M : on renomme
  const Bp = rot([0, 0], t), Cp = rot([ab * S, 0], t), Mp = rot([T.A[0] * S, T.A[1] * S], t);
  const f = {
    P: { [a]: Cp, [b]: Bp, [m]: Mp }, segs: [{ a: Bp, b: Cp, c: COL.ink }, { a: Cp, b: Mp, c: COL.b }, { a: Bp, b: Mp, c: COL.b }], len: [], ext: 0, maxW: 420, maxH: 240, colors: { [m]: COL.a }, aria: 'points A, B et M',
  };
  const cen = [(Bp[0] + Cp[0] + Mp[0]) / 3, (Bp[1] + Cp[1] + Mp[1]) / 3];
  f.len.push(lenOut(Cp, Mp, cen, `${m}${a} = ${fr(ma)} cm`, COL.b), lenOut(Bp, Mp, cen, `${m}${b} = ${fr(mb)} cm`, COL.b));
  void o;
  return { svg: figure(f), A: Cp, B: Bp, Mp };
}
const pickC = d => 2 * ri(2, d < 2 ? 5 : 7);
const pickX = (c, d) => (d >= 2 && ri(0, 2) === 0 ? ri(c + 1, 2 * c + 6) / 2 : ri(Math.ceil(c / 2) + 1, Math.ceil(c / 2) + 5));

/** quadrillage : A, B et quatre candidats ; un seul est sur la médiatrice */
function gridScene(d) {
  for (;;) {
    let A, B, good;
    if (d < 4) {
      const w = ri(1, 3), a = ri(-5, 5 - 2 * w), b = ri(-5, 5), vert = ri(0, 1);
      A = vert ? [b, a] : [a, b]; B = vert ? [b, a + 2 * w] : [a + 2 * w, b];
      const mid = [(A[0] + B[0]) / 2, (A[1] + B[1]) / 2];
      const along = vert ? [1, 0] : [0, 1], k = pick([-3, -2, -1, 1, 2, 3]);
      good = [mid[0] + k * along[0], mid[1] + k * along[1]];
    } else {
      const dx = 2 * ri(-2, 2), dy = 2 * ri(-2, 2); if (!dx && !dy) continue;
      A = [ri(-4, 4), ri(-4, 4)]; B = [A[0] + dx, A[1] + dy];
      const mid = [(A[0] + B[0]) / 2, (A[1] + B[1]) / 2], k = pick([-2, -1, 1, 2]);
      good = [mid[0] + k * (-dy / 2), mid[1] + k * (dx / 2)];
    }
    const inG = p => Math.abs(p[0]) <= 6 && Math.abs(p[1]) <= 6;
    const dd = (p, q) => (p[0] - q[0]) ** 2 + (p[1] - q[1]) ** 2;
    if (![A, B, good].every(inG)) continue;
    const eq = p => dd(p, A) === dd(p, B);
    const cand = [good];
    let tries = 0;
    while (cand.length < 4 && tries++ < 200) {
      const p = [ri(-5, 5), ri(-5, 5)];
      if (!eq(p) && !cand.some(q => q[0] === p[0] && q[1] === p[1]) && !(p[0] === A[0] && p[1] === A[1]) && !(p[0] === B[0] && p[1] === B[1])) cand.push(p);
    }
    if (cand.length < 4 || cand.slice(1).some(eq)) continue;
    return { A, B, cand, good, dd };
  }
}

export function L4(d) {
  const nm = names(d, 'ABMI'), [a, b, m, i] = nm, t = orient(d);
  const forms = d < 1 ? ['egal'] : d < 2 ? ['egal', 'oui', 'moitie'] : d < 3 ? ['egal', 'oui', 'moitie', 'total'] : ['egal', 'oui', 'moitie', 'total', 'peri', 'grille'];
  const f = pick(forms);
  if (f === 'egal') {
    const c = pickC(d), x = pickX(c, d), sc = medScene(nm, c, x, t, { lens: [[a, m, `${m}${a} = ${fr(x)} cm`, COL.b], [b, m, `${m}${b} = ?`, COL.b]] });
    return numQ({
      E: [x], tpl: `${m}${b} = {0} cm`, comma: true, html: `Le point ${m} est un point de la médiatrice (d) du segment [${a}${b}]. On sait que ${m}${a} = ${fr(x)} cm. Quelle est la longueur ${m}${b} ?`,
      visual: sc.svg, hint: `${m} est sur la médiatrice de [${a}${b}] : que peut-on dire des distances de ${m} aux deux extrémités ${a} et ${b} ?`,
      solution: `Tout point de la médiatrice d'un segment est à égale distance des extrémités de ce segment. ${m} est sur la médiatrice de [${a}${b}], donc ${m}${b} = ${m}${a} = <b>${fr(x)} cm</b>.`,
      msg: v => (v[0] === c ? `${c} cm est la longueur de [${a}${b}], pas celle de [${m}${b}].` : ''), value: dist(sc.B, sc.Mp) / S,
    });
  }
  if (f === 'oui') {
    const ab = pickC(d), yes = ri(0, 1) === 1;
    const ma = pickX(ab, d), mb = yes ? ma : (() => { let v; do { v = ma + pick([-2, -1, 1, 2]) * (d >= 2 ? 0.5 : 1); } while (v <= 0 || v <= Math.abs(ma - ab) * 0 || v + ma <= ab + 0.5 || Math.abs(v - ma) >= ab - 0.5 || v === ma); return v; })();
    const sc = triScene([a, b, m], ma, mb, ab, t);
    return choiceQ({
      opts: [{ v: 'oui', l: '<b>Oui</b>' }, { v: 'non', l: '<b>Non</b>' }], good: yes ? 'oui' : 'non',
      html: `On a ${m}${a} = ${fr(ma)} cm et ${m}${b} = ${fr(mb)} cm. Le point ${m} est-il sur la médiatrice du segment [${a}${b}] ?`, visual: sc.svg,
      hint: `Un point est sur la médiatrice de [${a}${b}] exactement quand il est à égale distance de ${a} et de ${b} : compare ${m}${a} et ${m}${b}.`,
      solution: yes ? `${m}${a} = ${m}${b} = ${fr(ma)} cm : ${m} est à égale distance de ${a} et de ${b}, il est donc <b>sur la médiatrice</b> de [${a}${b}].` : `${m}${a} = ${fr(ma)} cm et ${m}${b} = ${fr(mb)} cm : ces distances sont différentes, donc ${m} n'est <b>pas</b> sur la médiatrice de [${a}${b}].`,
      msg: v => (!yes && v === 'oui' ? `Les deux longueurs sont proches mais pas égales : ${fr(ma)} ≠ ${fr(mb)}.` : ''),
      verify: E => E === (Math.abs(dist(sc.Mp, sc.A) - dist(sc.Mp, sc.B)) < 1e-9 ? 'oui' : 'non'),
    });
  }
  if (f === 'moitie' || f === 'total') {
    const c = pickC(d), x = pickX(c, d), half = c / 2;
    if (f === 'moitie') {
      const sc = medScene(nm, c, x, t, { lens: [[a, b, `${a}${b} = ${c} cm`, COL.ink]], noM: false });
      return numQ({
        E: [half], tpl: `${i}${a} = {0} cm`, comma: true, html: `La droite (d) est la médiatrice de [${a}${b}] et coupe [${a}${b}] en ${i}. On a ${a}${b} = ${c} cm. Quelle est la longueur ${i}${a} ?`, visual: sc.svg,
        hint: `La médiatrice passe par le <b>milieu</b> de [${a}${b}] : ${i} partage [${a}${b}] en deux parties égales. Que vaut chacune quand ${a}${b} = ${c} cm ?`,
        solution: `La médiatrice coupe [${a}${b}] en son milieu : ${i} est le milieu de [${a}${b}]. ${i}${a} = ${a}${b} ÷ 2 = ${c} ÷ 2 = <b>${half} cm</b>.`,
        msg: v => (v[0] === c ? `${c} cm est toute la longueur [${a}${b}] : ${i}${a} n'en est que la moitié.` : v[0] === 2 * c ? `Tu as doublé : ${i} est le milieu, donc ${i}${a} est plus petit que ${a}${b}.` : ''), value: dist(sc.A, sc.I) / S,
      });
    }
    const sc = medScene(nm, c, x, t, { lens: [[a, i, `${i}${a} = ${half} cm`, COL.ink]] });
    return numQ({
      E: [c], tpl: `${a}${b} = {0} cm`, html: `La droite (d) est la médiatrice de [${a}${b}] et coupe [${a}${b}] en ${i}. On a ${i}${a} = ${half} cm. Quelle est la longueur ${a}${b} ?`, visual: sc.svg,
      hint: `${i} est le milieu de [${a}${b}] car (d) est la médiatrice : ${a}${b} est composé de deux parties égales, ${i}${a} et ${i}${b}.`,
      solution: `La médiatrice passe par le milieu de [${a}${b}] : ${i}${b} = ${i}${a} = ${half} cm, donc ${a}${b} = ${half} + ${half} = <b>${c} cm</b>.`,
      msg: v => (v[0] === half ? `${half} cm est la longueur de la moitié seulement : ${a}${b} comprend ${i}${a} et ${i}${b}.` : ''), value: dist(sc.A, sc.B) / S,
    });
  }
  if (f === 'peri') {
    const c = pickC(d), x = pickX(c, d), E = 2 * x + c;
    const sc = medScene(nm, c, x, t, { lens: [[a, m, `${m}${a} = ${fr(x)} cm`, COL.b], [a, b, `${a}${b} = ${c} cm`, COL.ink]] });
    return numQ({
      E: [E], tpl: `Périmètre de ${m}${a}${b} : {0} cm`, comma: true, html: `Le point ${m} est sur la médiatrice du segment [${a}${b}]. On a ${m}${a} = ${fr(x)} cm et ${a}${b} = ${c} cm. Quel est le périmètre du triangle ${m}${a}${b} ?`, visual: sc.svg,
      hint: `Il te manque un côté de ${m}${a}${b} : ${m}${b}. Comme ${m} est sur la médiatrice de [${a}${b}], compare ${m}${b} à ${m}${a}, puis additionne les trois côtés.`,
      solution: `${m} est sur la médiatrice de [${a}${b}], donc ${m}${b} = ${m}${a} = ${fr(x)} cm. Périmètre = ${m}${a} + ${m}${b} + ${a}${b} = ${fr(x)} + ${fr(x)} + ${c} = <b>${fr(E)} cm</b>.`,
      msg: v => (v[0] === x + c ? `Il y a trois côtés : ${m}${a}, ${m}${b} et ${a}${b}. Que vaut ${m}${b} ?` : ''),
      value: (dist(sc.A, sc.B) + dist(sc.A, sc.Mp) + dist(sc.B, sc.Mp)) / S,
    });
  }
  // grille
  const g = gridScene(d), L = ['C', 'D', 'E', 'F'], order = shuffle([...g.cand]);
  const letters = Object.fromEntries(order.map((p, k) => [L[k], p]));
  const goodL = Object.keys(letters).find(k => letters[k] === g.good);
  const P = { A: g.A, B: g.B, ...letters };
  const mk = (extra, after) => figure({
    P, grid: { x0: -6, y0: -6, x1: 6, y1: 6, axes: true }, k: 28, maxW: 400, maxH: 400, ext: 0, colors: { A: COL.b, B: COL.b, ...Object.fromEntries(L.map(l => [l, COL.a])) },
    segs: [{ a: g.A, b: g.B, c: COL.b, w: 2.4 }, ...(after ? [{ a: g.A, b: g.good, c: COL.g, dash: true, w: 1.8 }, { a: g.B, b: g.good, c: COL.g, dash: true, w: 1.8 }] : [])], ...extra, aria: 'quadrillage, points A, B, C, D, E et F',
  });
  const mid = [(g.A[0] + g.B[0]) / 2, (g.A[1] + g.B[1]) / 2], horiz = g.A[1] === g.B[1], vert = g.A[0] === g.B[0];
  const eqs = p => g.dd(p, g.A) === g.dd(p, g.B);
  return choiceQ({
    opts: L.map(l => ({ v: l, l: `<b>${l}</b>(${M(letters[l][0])} ; ${M(letters[l][1])})` })), good: goodL, keep: true,
    html: `Sur le quadrillage, quel point est sur la médiatrice du segment [AB] ?`, visual: mk({}, false), after: mk({}, true),
    hint: `Un point de la médiatrice de [AB] est équidistant de A et de B. Repère le milieu de [AB] (A${M(g.A[0]) ? '' : ''}(${M(g.A[0])} ; ${M(g.A[1])}) et B(${M(g.B[0])} ; ${M(g.B[1])})), puis la droite perpendiculaire à (AB) qui passe par ce milieu.`,
    solution: `Le milieu de [AB] est I(${M(mid[0])} ; ${M(mid[1])}). La médiatrice est la perpendiculaire à (AB) passant par I${horiz ? `, c'est la droite verticale d'abscisse ${M(mid[0])}` : vert ? `, c'est la droite horizontale d'ordonnée ${M(mid[1])}` : ` (de (AB) à elle, on échange les directions : à partir de I, on avance de ${M(-(g.B[1] - g.A[1]) / 2)} horizontalement et de ${M((g.B[0] - g.A[0]) / 2)} verticalement)`}. Seul <b>${goodL}</b>(${M(g.good[0])} ; ${M(g.good[1])}) est dessus : ${goodL}A = ${goodL}B.`,
    verify: E => letters[E] && eqs(letters[E]) && Object.entries(letters).every(([k, p]) => k === E || !eqs(p)),
  });
}

export function C4() {
  const nm = ['A', 'B', 'M', 'I'], s1 = medScene(nm, 8, 5, 0, { lens: [['A', 'M', 'MA = 5 cm', COL.b], ['B', 'M', 'MB = ?', COL.b]] }).svg;
  const s2 = medScene(nm, 8, 5, 0, { lens: [['A', 'B', 'AB = 8 cm', COL.ink]] }).svg;
  const s3 = medScene(nm, 8, 5, 0, { lens: [['A', 'I', 'IA = 4 cm', COL.ink]] }).svg;
  const s4 = medScene(nm, 6, 5, 0, { lens: [['A', 'M', 'MA = 5 cm', COL.b], ['A', 'B', 'AB = 6 cm', COL.ink]] }).svg;
  const t1 = triScene(['A', 'B', 'M'], 6, 6, 8, 0).svg, t2 = triScene(['A', 'B', 'M'], 6, 7, 8, 0).svg;
  const gs = (() => {
    const A = [-3, 1], B = [1, 1], pts = { A, B, C: [-1, 4], D: [0, -2], E: [2, 3], F: [-4, -3] };
    return figure({ P: pts, grid: { x0: -6, y0: -6, x1: 6, y1: 6, axes: true }, k: 22, maxW: 330, ext: 0, colors: { A: COL.b, B: COL.b, C: COL.a, D: COL.a, E: COL.a, F: COL.a }, segs: [{ a: A, b: B, c: COL.b, w: 2.4 }], aria: 'quadrillage avec A, B et quatre points' });
  })();
  const gs2 = (() => {
    const A = [-2, -2], B = [2, 0], pts = { A, B, C: [-1, 1], D: [0, 2], E: [3, -1], F: [-4, 0] };
    return figure({ P: pts, grid: { x0: -6, y0: -6, x1: 6, y1: 6, axes: true }, k: 22, maxW: 330, ext: 0, colors: { A: COL.b, B: COL.b, C: COL.a, D: COL.a, E: COL.a, F: COL.a }, segs: [{ a: A, b: B, c: COL.b, w: 2.4 }], aria: 'quadrillage avec A, B oblique et quatre points' });
  })();
  return cours('4. Médiatrice d\'un segment', `La médiatrice est la droite qui « coupe un segment en son milieu, bien droit ». Elle a une propriété très pratique : tous ses points sont à la même distance des deux extrémités.`,
    def(`La <b>médiatrice</b> d'un segment [AB] est la droite <b>perpendiculaire</b> à (AB) qui passe par le <b>milieu</b> de [AB].<br><b>Propriété :</b> un point est sur la médiatrice de [AB] <b>si et seulement si</b> il est à égale distance de A et de B : MA = MB.`),
    s1,
    meth(`Pour une longueur : si M est sur la médiatrice de [AB], alors MA = MB.`, `Pour savoir si M est sur la médiatrice : compare MA et MB (égales → oui ; différentes → non).`, `La médiatrice passe par le milieu I de [AB] : IA = IB = AB ÷ 2.`),
    ex(`Exemple 1 : M est sur la médiatrice, MA = 5 cm, quelle est la longueur MB ?`, `M est sur la médiatrice de [AB] : il est à égale distance de A et de B, donc MB = MA.<br>${rep('MB = 5 cm')}`),
    cols(t1, t2),
    ex(`Exemple 2 : M est-il sur la médiatrice de [AB] ? (MA = 6 cm et MB = 6 cm ; puis MA = 6 cm et MB = 7 cm)`, `Dans la première figure, MA = MB = 6 cm : M est sur la médiatrice. Dans la deuxième, 6 ≠ 7 : M n'est pas sur la médiatrice.<br>${rep('oui (première figure), non (deuxième figure)')}`),
    s2,
    ex(`Exemple 3 : le milieu, AB = 8 cm, quelle est la longueur IA ?`, `La médiatrice coupe [AB] en son milieu I : IA = AB ÷ 2 = 8 ÷ 2.<br>${rep('IA = 4 cm')}`),
    s3,
    ex(`Exemple 4 : la longueur totale, IA = 4 cm, quelle est la longueur AB ?`, `I est le milieu de [AB] : IB = IA = 4 cm, donc AB = 4 + 4.<br>${rep('AB = 8 cm')}`),
    s4,
    ex(`Exemple 5 : périmètre de MAB, MA = 5 cm et AB = 6 cm`, `M est sur la médiatrice de [AB], donc MB = MA = 5 cm. Périmètre = 5 + 5 + 6.<br>${rep('périmètre de MAB : 16 cm')}`),
    gs,
    ex(`Exemple 6 : quel point du quadrillage est sur la médiatrice de [AB] ? (A et B sur une même ligne)`, `A(−3 ; 1) et B(1 ; 1) : le milieu est I(−1 ; 1). La médiatrice est la perpendiculaire à (AB) en I, c'est la droite verticale d'abscisse −1. Seul C(−1 ; 4) est dessus (D, E et F ne sont pas à égale distance de A et de B).<br>${rep('C')}`),
    gs2,
    ex(`Exemple 7 : même question avec un segment penché`, `A(−2 ; −2) et B(2 ; 0) : le milieu est I(0 ; −1). Pour aller de A à B, on avance de 4 et on monte de 2 ; la perpendiculaire passant par I s'obtient en échangeant : on recule de 1 et on monte de 2, ce qui donne C(−1 ; 1). Vérification : CA = CB (CA² = 1 + 9 = 10 et CB² = 9 + 1 = 10).<br>${rep('C')}`),
    warn(`Ne confonds pas médiatrice (perpendiculaire en <b>milieu</b>) avec une simple perpendiculaire à (AB) : elle doit passer par le milieu.`, `MA = MB ne dit pas que M est le milieu : M peut être loin du segment, sur la médiatrice.`, `Pour trouver IA, divise AB par 2 ; pour trouver AB, double IA.`),
    retenir(`médiatrice de [AB] = perpendiculaire en son milieu ; M est dessus ⇔ MA = MB.`));
}
void fr;

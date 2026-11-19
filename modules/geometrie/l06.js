// Niveau 6 : propriétés de la symétrie centrale (longueurs, angles, droite et son image parallèles). 5e.
import { figure, rot, COL, dist, angleAt } from './draw.js';
import { names, orient, numQ, choiceQ, ex, rep, warn, retenir, meth, def, cours, cols, pick, ri, fr, H, chance } from './util.js';
import { S, triSSS, triSAS, triBH, lenOut } from './l03.js';

/** triangle et son image par la symétrie de centre O (origine du dessin) */
function ctrScene(nm, tri, t, opt = {}) {
  const [a, b, c] = nm, a2 = a + '′', b2 = b + '′', c2 = c + '′', on = opt.on || 'O';
  const pts = { [a]: tri.A, [b]: tri.B, [c]: tri.C };
  const xs = Object.values(pts).map(p => p[0] * S), ys = Object.values(pts).map(p => p[1] * S);
  const sx = 1.4 - Math.min(...xs), sy = -(Math.min(...ys) + Math.max(...ys)) / 2;
  const Q = {}, R = {};
  for (const [k, p] of Object.entries(pts)) { const x = p[0] * S + sx, y = p[1] * S + sy; Q[k] = rot([x, y], t); R[k + '′'] = rot([-x, -y], t); }
  const O = [0, 0], P = { ...Q, ...R, [on]: O };
  const cen = ps => [ps.reduce((s, p) => s + p[0], 0) / ps.length, ps.reduce((s, p) => s + p[1], 0) / ps.length];
  const g1 = cen([Q[a], Q[b], Q[c]]), g2 = cen([R[a2], R[b2], R[c2]]);
  const f = {
    P, polys: [{ p: [a, b, c], c: COL.b }, { p: [a2, b2, c2], c: COL.g }],
    segs: (opt.through || [a, b, c]).map(k => ({ a: Q[k], b: R[k + '′'], c: '#a8a29e', dash: true, w: 1.4 })), len: [], arcs: [], ext: 0, maxW: 500, maxH: 270,
    colors: { [on]: COL.a, ...Object.fromEntries([a, b, c].map(k => [k, COL.b])), ...Object.fromEntries([a2, b2, c2].map(k => [k, COL.g])) }, aria: 'triangle et son symétrique par rapport au point ' + on,
  };
  for (const [x, y, s] of opt.lens || []) f.len.push(lenOut(Q[x], Q[y], g1, s, COL.b));
  for (const [x, y, s] of opt.lens2 || []) f.len.push(lenOut(R[x + '′'], R[y + '′'], g2, s, COL.g));
  for (const r of opt.arcs || []) f.arcs.push(r);
  if (opt.height) { // pied H de la hauteur issue de a sur [bc]
    const Hh = rot([tri.A[0] * S + sx, tri.B[1] * S + sy], t);
    f.P.H = Hh; f.segs.push({ a: Q[a], b: Hh, c: COL.a, dash: true, w: 2 }); f.rights = [{ v: 'H', a, b: c, size: 12 }]; f.colors.H = COL.b;
    f.len.push({ a: Q[a], b: Hh, s: opt.height, side: 1, c: COL.a, off: 14 });
  }
  return { svg: figure(f), Q, R };
}
const sides = (d) => {
  for (;;) {
    const f = () => (d >= 2 ? ri(6, 18) / 2 : ri(3, 9)), a = f(), b = f(), c = f(), s = [a, b, c].sort((x, y) => x - y);
    if (s[2] < s[0] + s[1] - 1.4 && !(a === b && b === c)) return [a, b, c];
  }
};
const PAR = [{ v: 'par', l: '<b>parallèles</b>' }, { v: 'perp', l: '<b>perpendiculaires</b>' }, { v: 'sec', l: '<b>sécantes, ni parallèles ni perpendiculaires</b>' }];

export function L6(d) {
  const nm = names(d, 'ABC'), [a, b, c] = nm, a2 = a + '′', b2 = b + '′', c2 = c + '′', t = orient(d);
  const forms = d < 1 ? ['long', 'ang'] : d < 2 ? ['long', 'ang', 'par'] : d < 3 ? ['long', 'ang', 'par', 'milieu'] : d < 4 ? ['long', 'ang', 'par', 'milieu', 'peri', 'aire'] : ['par', 'milieu', 'peri', 'aire', 'deux', 'ang'];
  const f = pick(forms), comma = d >= 2;
  const intro = `Le triangle ${a2}${b2}${c2} est le symétrique du triangle ${a}${b}${c} par rapport au point O.`;
  if (f === 'long') {
    const [la, lb, lc] = sides(d), tri = triSSS(la, lb, lc), all = [[a, b, lc], [b, c, la], [c, a, lb]], p = pick(all), back = d >= 1 && chance(0.4);
    const [x, y, val] = p, sc = ctrScene(nm, tri, t, back ? { lens2: [[x, y, `${fr(val)} cm`]], lens: [[x, y, '?']] } : { lens: [[x, y, `${fr(val)} cm`]], lens2: [[x, y, '?']] });
    const [g, g2] = back ? [`${x}′${y}′`, `${x}${y}`] : [`${x}${y}`, `${x}′${y}′`];
    return numQ({
      E: [val], tpl: `${g2} = {0} cm`, comma, html: `${intro} On sait que ${g} = ${fr(val)} cm. Quelle est la longueur ${g2} ?`, visual: sc.svg,
      hint: `[${g2}] est le symétrique de [${g}] par rapport à O : une symétrie centrale (demi-tour) change-t-elle la longueur d'un segment ?`,
      solution: `La symétrie centrale conserve les longueurs. [${g2}] est le symétrique de [${g}], donc ${g2} = ${g} = <b>${fr(val)} cm</b>.`,
      msg: v => (v[0] === 2 * val ? `Le segment n'est pas deux fois plus long : une symétrie centrale conserve les longueurs.` : ''),
      value: back ? dist(sc.Q[x], sc.Q[y]) / S : dist(sc.R[x + '′'], sc.R[y + '′']) / S,
    });
  }
  if (f === 'ang') {
    const m = d < 2 ? 10 * ri(3, 15) : ri(25, 155), tri = triSAS(ri(4, 8), ri(4, 8), m);
    const sc = ctrScene(nm, tri, t, { arcs: [{ v: b, a, b: c, label: `${m}°`, r: 24 }, { v: b2, a: a2, b: c2, label: '?', r: 24, c: COL.g, fill: COL.gFill }] });
    return numQ({
      E: [m], tpl: `${H(a2 + b2 + c2)} = {0} °`, html: `${intro} On sait que ${H(a + b + c)} = ${m}°. Quelle est la mesure de ${H(a2 + b2 + c2)} ?`, visual: sc.svg,
      hint: `${H(a2 + b2 + c2)} est le symétrique de ${H(a + b + c)} : que devient la mesure d'un angle quand on fait un demi-tour autour de O ?`,
      solution: `La symétrie centrale conserve les angles : ${H(a2 + b2 + c2)} = ${H(a + b + c)} = <b>${m}°</b>.`,
      msg: v => (v[0] === 180 - m ? `Les angles ne deviennent pas supplémentaires : un demi-tour conserve leur mesure.` : ''),
      value: angleAt(sc.R[a2], sc.R[b2], sc.R[c2]),
    });
  }
  if (f === 'par') {
    const [la, lb, lc] = sides(Math.min(d, 1)), tri = triSSS(la, lb, lc), pr = pick([[a, b], [b, c], [c, a]]), [x, y] = pr;
    const sc = ctrScene(nm, tri, t, {});
    const dir = (P, Q) => [Q[0] - P[0], Q[1] - P[1]];
    const u = dir(sc.Q[x], sc.Q[y]), v = dir(sc.R[x + '′'], sc.R[y + '′']);
    const real = Math.abs(u[0] * v[1] - u[1] * v[0]) < 1e-9 ? 'par' : Math.abs(u[0] * v[0] + u[1] * v[1]) < 1e-9 ? 'perp' : 'sec';
    return choiceQ({
      opts: PAR, good: 'par', html: `${intro} Que peut-on dire des droites (${x}${y}) et (${x}′${y}′) ?`, visual: sc.svg,
      hint: `(${x}′${y}′) est la droite symétrique de (${x}${y}) par rapport à O. Fais mentalement un demi-tour de (${x}${y}) autour de O : la droite obtenue est-elle penchée de la même façon ?`,
      solution: `Le symétrique d'une droite par rapport à un point est une droite <b>parallèle</b> à la droite de départ. Donc (${x}${y}) // (${x}′${y}′).`,
      msg: v => (v === 'sec' ? `Elles ne se coupent pas : un demi-tour ne fait pas « pivoter » la droite d'un angle autre que 180°.` : v === 'perp' ? `Un demi-tour tourne de 180° : la droite reste penchée de la même façon, pas à angle droit.` : ''),
      verify: E => E === real,
    });
  }
  if (f === 'milieu') {
    const p = ri(2, d < 2 ? 6 : 9), half = d >= 2 && ri(0, 1) ? p + 0.5 : p, dir = ri(0, 359), back = chance(0.5);
    const A = rot([half * S, 0], dir), A2 = rot([-half * S, 0], dir), O = [0, 0];
    const mk = labs => figure({ P: { [a]: A, O, [a2]: A2 }, segs: [{ a: A, b: A2, c: COL.ink, w: 2.6 }], len: labs, ext: 0, maxW: 460, maxH: 200, colors: { O: COL.a, [a]: COL.b, [a2]: COL.g }, aria: 'points alignés' });
    const cen = [0, 0.3];
    const sc = mk(back ? [lenOut(A, A2, [A[0] + 0.4, A[1] + 0.4], `${a}${a2} = ${fr(2 * half)} cm`, COL.ink), lenOut(A, O, [(A[0] + A2[0]) / 2 + 0.2, 0.2], 'O' + a + ' = ?', COL.b)] : [lenOut(A, O, cen, `O${a} = ${fr(half)} cm`, COL.b), lenOut(O, A2, cen, `O${a2} = ?`, COL.g)]);
    void sc;
    const E = back ? half : 2 * half;
    const vis = back ? mk([{ a: A, b: A2, s: `${a}${a2} = ${fr(2 * half)} cm`, side: 1, c: COL.ink, off: 14 }]) : mk([{ a: A, b: O, s: `O${a} = ${fr(half)} cm`, side: 1, c: COL.b, off: 14 }]);
    return numQ({
      E: [E], tpl: back ? `O${a} = {0} cm` : `${a}${a2} = {0} cm`, comma: true,
      html: back ? `Le point ${a2} est le symétrique de ${a} par rapport à O. On sait que ${a}${a2} = ${fr(2 * half)} cm. Quelle est la longueur O${a} ?` : `Le point ${a2} est le symétrique de ${a} par rapport à O. On sait que O${a} = ${fr(half)} cm. Quelle est la longueur ${a}${a2} ?`,
      visual: vis, hint: back ? `O est le milieu de [${a}${a2}] : ${a}${a2} est formé de deux segments de même longueur, O${a} et O${a2}. Que vaut chacun ?` : `O est le milieu de [${a}${a2}] : O${a2} = O${a}. Comment obtiens-tu alors la longueur du segment entier [${a}${a2}] ?`,
      solution: back ? `O est le milieu de [${a}${a2}] : O${a} = ${a}${a2} ÷ 2 = ${fr(2 * half)} ÷ 2 = <b>${fr(half)} cm</b>.` : `O est le milieu de [${a}${a2}] : O${a2} = O${a} = ${fr(half)} cm, donc ${a}${a2} = ${fr(half)} + ${fr(half)} = <b>${fr(2 * half)} cm</b>.`,
      msg: v => (back ? (v[0] === 2 * half ? `C'est toute la longueur [${a}${a2}] ; O${a} n'en est que la moitié.` : '') : (v[0] === half ? `C'est seulement O${a} ; [${a}${a2}] contient aussi O${a2}.` : '')),
      value: back ? dist(A, O) / S : dist(A, A2) / S,
    });
  }
  if (f === 'peri' || f === 'aire' || f === 'deux') {
    const [la, lb, lc] = sides(d), tri = triSSS(la, lb, lc);
    if (f === 'aire') {
      let bb, h; do { bb = ri(4, 12); h = ri(3, 9); } while ((bb * h) % 2);
      const tr = triBH(bb, h, ri(1, bb - 1)), sc = ctrScene(nm, tr, t, { height: `${h} cm`, lens: [[b, c, `${bb} cm`]] }), aire = bb * h / 2;
      const ar = (P, Q, R) => Math.abs((Q[0] - P[0]) * (R[1] - P[1]) - (R[0] - P[0]) * (Q[1] - P[1])) / 2;
      return numQ({
        E: [aire], tpl: `Aire de ${a2}${b2}${c2} : {0} cm²`, comma: true, html: `${intro} Dans ${a}${b}${c}, la base ${b}${c} mesure ${bb} cm et la hauteur ${a}H mesure ${h} cm. Quelle est l'aire de ${a2}${b2}${c2} ?`, visual: sc.svg,
        hint: `Calcule l'aire de ${a}${b}${c} avec ${bb} et ${h} (base × hauteur ÷ 2) ; que devient une aire par une symétrie centrale ?`,
        solution: `Aire de ${a}${b}${c} = ${bb} × ${h} ÷ 2 = ${fr(aire)} cm². La symétrie centrale conserve les aires : l'aire de ${a2}${b2}${c2} est aussi <b>${fr(aire)} cm²</b>.`,
        msg: v => (v[0] === bb * h ? `N'oublie pas de diviser par 2 : l'aire d'un triangle est base × hauteur ÷ 2.` : ''), value: ar(sc.R[a2], sc.R[b2], sc.R[c2]) / (S * S),
      });
    }
    if (f === 'peri') {
      const sc = ctrScene(nm, tri, t, { lens: [[b, c, `${b}${c} = ${fr(la)} cm`], [c, a, `${c}${a} = ${fr(lb)} cm`], [a, b, `${a}${b} = ${fr(lc)} cm`]] }), E = la + lb + lc;
      return numQ({
        E: [E], tpl: `Périmètre de ${a2}${b2}${c2} : {0} cm`, comma: true, html: `${intro} Les côtés de ${a}${b}${c} mesurent ${b}${c} = ${fr(la)} cm, ${c}${a} = ${fr(lb)} cm et ${a}${b} = ${fr(lc)} cm. Quel est le périmètre de ${a2}${b2}${c2} ?`, visual: sc.svg,
        hint: `Chaque côté de ${a2}${b2}${c2} a la même longueur que son symétrique dans ${a}${b}${c} : additionne alors les trois côtés de ${a2}${b2}${c2}.`,
        solution: `Les longueurs sont conservées : ${b2}${c2} = ${fr(la)} cm, ${c2}${a2} = ${fr(lb)} cm, ${a2}${b2} = ${fr(lc)} cm. Périmètre = ${fr(la)} + ${fr(lb)} + ${fr(lc)} = <b>${fr(E)} cm</b>.`,
        msg: v => (v[0] === la + lb || v[0] === lb + lc || v[0] === la + lc ? `Il y a trois côtés : as-tu additionné les trois ?` : ''),
        value: (dist(sc.R[a2], sc.R[b2]) + dist(sc.R[b2], sc.R[c2]) + dist(sc.R[c2], sc.R[a2])) / S,
      });
    }
    const all = [[a, b, lc], [b, c, la], [c, a, lb]], unk = pick(all), known = all.filter(s => s !== unk), P = la + lb + lc;
    const sc = ctrScene(nm, tri, t, { lens: known.map(s => [s[0], s[1], `${s[0]}${s[1]} = ${fr(s[2])} cm`]), lens2: [[unk[0], unk[1], '?']] }), [u1, u2] = unk;
    return numQ({
      E: [unk[2]], tpl: `${u1}′${u2}′ = {0} cm`, comma: true, html: `${intro} Le périmètre de ${a}${b}${c} est ${fr(P)} cm, avec ${known[0][0]}${known[0][1]} = ${fr(known[0][2])} cm et ${known[1][0]}${known[1][1]} = ${fr(known[1][2])} cm. Quelle est la longueur ${u1}′${u2}′ ?`, visual: sc.svg,
      hint: `Cherche d'abord le côté ${u1}${u2} de ${a}${b}${c} (périmètre moins les deux côtés connus) ; ${u1}′${u2}′ est son symétrique.`,
      solution: `${u1}${u2} = ${fr(P)} − ${fr(known[0][2])} − ${fr(known[1][2])} = ${fr(unk[2])} cm, et la symétrie centrale conserve les longueurs : ${u1}′${u2}′ = <b>${fr(unk[2])} cm</b>.`,
      msg: v => (v[0] === P - known[0][2] ? `Il faut enlever les deux côtés connus du périmètre, pas un seul.` : ''), value: dist(sc.R[u1 + '′'], sc.R[u2 + '′']) / S,
    });
  }
  return null;
}

export function C6() {
  const nm = ['A', 'B', 'C'], tri = triSSS(6, 5, 4), tr2 = triSAS(6, 7, 50);
  const f1 = ctrScene(nm, tri, 0, { lens: [['A', 'B', '4 cm']], lens2: [['A', 'B', '?']] }).svg;
  const f1b = ctrScene(nm, tri, 0, { lens2: [['B', 'C', '6,5 cm']], lens: [['B', 'C', '?']] }).svg;
  const f2 = ctrScene(nm, tr2, 0, { arcs: [{ v: 'B', a: 'A', b: 'C', label: '50°', r: 24 }, { v: 'B′', a: 'A′', b: 'C′', label: '?', r: 24, c: COL.g, fill: COL.gFill }] }).svg;
  const f3 = ctrScene(nm, tri, 0, {}).svg;
  const mkLine = s => figure({ P: { A: [1.5, 0.8], O: [0, 0], 'A′': [-1.5, -0.8] }, segs: [{ a: [1.5, 0.8], b: [-1.5, -0.8], c: COL.ink, w: 2.6 }], len: s, ext: 0, maxW: 400, colors: { O: COL.a, A: COL.b, 'A′': COL.g }, aria: 'A, O, A′ alignés' });
  const f4 = mkLine([{ a: [1.5, 0.8], b: [0, 0], s: 'OA = 3 cm', side: 1, c: COL.b, off: 14 }]);
  const f5 = mkLine([{ a: [1.5, 0.8], b: [-1.5, -0.8], s: 'AA′ = 8 cm', side: 1, c: COL.ink, off: 14 }]);
  const fa = ctrScene(nm, triBH(8, 5, 3), 0, { height: '5 cm', lens: [['B', 'C', '8 cm']] }).svg;
  const fp = ctrScene(nm, triSSS(7, 6, 5), 0, { lens: [['B', 'C', 'BC = 7 cm'], ['C', 'A', 'CA = 6 cm'], ['A', 'B', 'AB = 5 cm']] }).svg;
  const fd = ctrScene(nm, triSSS(7, 6, 5), 0, { lens: [['B', 'C', 'BC = 7 cm'], ['A', 'B', 'AB = 5 cm']], lens2: [['C', 'A', '?']] }).svg;
  return cours('6. Propriétés de la symétrie centrale', `Un demi-tour ne déforme rien : tout ce qui se mesure (longueurs, angles, aires) est conservé. Et il y a une propriété en plus : une droite et son image sont parallèles.`,
    def(`La symétrie centrale <b>conserve</b> les longueurs, les mesures d'angles, les aires et les périmètres.<br>Elle transforme une droite en une droite <b>parallèle</b> : (AB) // (A′B′).<br>Le centre O est le milieu de [AA′] : OA = OA′ et AA′ = 2 × OA.`),
    meth(`Repère le segment, l'angle ou la figure image et son correspondant (A′B′ correspond à AB).`, `Écris qu'ils ont la même longueur, mesure, aire ou périmètre ; pour les droites, écris qu'elles sont parallèles.`, `Pour une distance au centre, utilise que O est le milieu de [AA′] : AA′ = 2 × OA.`),
    f1,
    ex(`Exemple 1 : longueur d'un segment image (A′B′ connaissant AB = 4 cm)`, `A′B′ est le symétrique de [AB] par rapport à O : la symétrie centrale conserve les longueurs.<br>${rep('A′B′ = 4 cm')}`),
    f1b,
    ex(`Exemple 2 : on cherche la longueur de l'original (B′C′ = 6,5 cm)`, `[BC] et [B′C′] sont symétriques : BC = B′C′.<br>${rep('BC = 6,5 cm')}`),
    f2,
    ex(`Exemple 3 : mesure d'un angle (${H('ABC')} = 50°)`, `La symétrie centrale conserve les angles : ${H('A′B′C′')} = ${H('ABC')}.<br>${rep('A′B′C′ = 50 °')}`),
    f3,
    ex(`Exemple 4 : que peut-on dire de (AB) et (A′B′) ?`, `Le symétrique d'une droite par rapport à un point est une droite parallèle : sur la figure, (AB) et (A′B′) sont deux côtés « tête-bêche ».<br>${rep('parallèles')}`),
    f4,
    ex(`Exemple 5 : OA = 3 cm, quelle est la longueur AA′ ?`, `O est le milieu de [AA′] : OA′ = OA = 3 cm, donc AA′ = 3 + 3.<br>${rep('AA′ = 6 cm')}`),
    f5,
    ex(`Exemple 6 : AA′ = 8 cm, quelle est la longueur OA ?`, `O est le milieu de [AA′] : OA = AA′ ÷ 2 = 8 ÷ 2.<br>${rep('OA = 4 cm')}`),
    fa,
    ex(`Exemple 7 : aire de l'image (BC = 8 cm, hauteur AH = 5 cm)`, `Aire de ABC = 8 × 5 ÷ 2 = 20 cm². La symétrie centrale conserve les aires.<br>${rep('aire de A′B′C′ : 20 cm²')}`),
    fp,
    ex(`Exemple 8 : périmètre de l'image (côtés 7 cm, 6 cm et 5 cm)`, `Les côtés de A′B′C′ ont les mêmes longueurs : 7 + 6 + 5 = 18.<br>${rep('périmètre de A′B′C′ : 18 cm')}`),
    fd,
    ex(`Exemple 9 : un côté de l'image à partir du périmètre (périmètre de ABC : 18 cm, BC = 7 cm, AB = 5 cm)`, `CA = 18 − 7 − 5 = 6 cm, donc C′A′ = CA.<br>${rep('C′A′ = 6 cm')}`),
    warn(`Ne confonds pas OA et AA′ : AA′ est le <b>double</b> de OA.`, `Une droite et son image sont parallèles (et non perpendiculaires ou sécantes).`, `Un angle garde sa mesure, il ne devient pas son supplémentaire.`),
    retenir(`la symétrie centrale conserve longueurs, angles, aires ; (AB) // (A′B′) ; O est le milieu de [AA′].`));
}
void cols; void triSAS;

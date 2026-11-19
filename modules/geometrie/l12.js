// Niveau 12 : droite des milieux (trois théorèmes) : longueurs et parallélisme. 4e.
import { figure, rot, COL, dist, angleAt } from './draw.js';
import { names, orient, numQ, choiceQ, ex, rep, warn, retenir, meth, def, cours, cols, pick, ri, fr, H } from './util.js';
import { S, triSSS, lenOut } from './l03.js';

const mid = (p, q) => [(p[0] + q[0]) / 2, (p[1] + q[1]) / 2];
const crs = (u, v) => u[0] * v[1] - u[1] * v[0];
const sub = (p, q) => [p[0] - q[0], p[1] - q[1]];

/** triangle ABC (côtés en cm : BC = a, CA = b, AB = c), I milieu de [AB], J point de [AC] à la fraction fj (0,5 : milieu) */
function triScene(nm, sides, t, o = {}) {
  const [a, b, c] = nm, [la, lb, lc] = sides, T = triSSS(la, lb, lc), fj = o.fj === undefined ? 0.5 : o.fj;
  const A = rot([T.A[0] * S, T.A[1] * S], t), B = rot([0, 0], t), C = rot([la * S, 0], t), I = mid(A, B), J = [A[0] + fj * (C[0] - A[0]), A[1] + fj * (C[1] - A[1])], Km = mid(B, C);
  const P = { [a]: A, [b]: B, [c]: C, I, J };
  if (o.k) P.K = Km;
  const g = [(A[0] + B[0] + C[0]) / 3, (A[1] + B[1] + C[1]) / 3];
  const f = {
    P, polys: [{ p: nm, c: COL.ink }], segs: [{ a: I, b: J, c: COL.a, w: 3 }], ticks: [], len: [], arcs: [], ext: 0, maxW: 440, maxH: 270, colors: { I: COL.a, J: COL.a, K: COL.a }, aria: 'triangle et droite des milieux',
  };
  if (o.k) f.segs.push({ a: I, b: Km, c: COL.a, w: 2.4 }, { a: J, b: Km, c: COL.a, w: 2.4 });
  if (!o.noTick) f.ticks.push({ a: A, b: I, n: 1 }, { a: I, b: B, n: 1 }, ...(fj === 0.5 ? [{ a: A, b: J, n: 2 }, { a: J, b: C, n: 2 }] : []), ...(o.k ? [{ a: B, b: Km, n: 3 }, { a: Km, b: C, n: 3 }] : []));
  for (const [p, q, s, col] of o.lens || []) f.len.push(lenOut(P[p] || p, P[q] || q, g, s, col || COL.ink));
  for (const r of o.arcs || []) f.arcs.push(r);
  return { svg: figure(f), A, B, C, I, J, Km, P };
}
const sd = d => (d >= 2 ? ri(8, 24) / 2 : ri(4, 12));
/** côtés (BC, CA, AB) avec certains imposés (fixed = [v | null, v | null, v | null]) et un triangle valide */
const triWith = (fixed, d) => { const mx = Math.max(...fixed.map(v => v || 0)), lo = Math.max(3, Math.ceil(mx / 2)), hi = Math.max(10, Math.ceil(mx / 2) + 6); for (let k = 0; k < 2000; k++) { const r = fixed.map(v => (v === null ? (d >= 2 ? ri(lo * 2, hi * 2) / 2 : ri(lo, hi)) : v)); const m = [...r].sort((p, q) => p - q); if (m[2] < m[0] + m[1] - 1.4) return r; } throw new Error('triangle impossible'); };
const side3 = d => { for (;;) { const x = sd(d) , y = sd(d), z = sd(d), m = [x, y, z].sort((p, q) => p - q); if (m[2] < m[0] + m[1] - 1.4) return [x, y, z]; } };

export function L12(d) {
  const nm = names(d, 'ABC'), [a, b, c] = nm, t = orient(d), comma = d >= 2;
  const forms = d < 1 ? ['long'] : d < 2 ? ['long', 'long2', 'para'] : d < 3 ? ['long', 'long2', 'para', 'recip'] : d < 4 ? ['long', 'long2', 'para', 'recip', 'angle', 'peri'] : ['long2', 'para', 'recip', 'angle', 'peri', 'quad', 'quad'];
  const f = pick(forms), sides = side3(d), bc = sides[0];
  const base = ri(2, 6) * 2 + (comma && ri(0, 1) ? 1 : 0);
  void base;
  if (f === 'long' || f === 'long2') {
    const x = f === 'long' ? 2 * ri(2, 9) + (comma ? ri(0, 1) : 0) : (comma ? ri(4, 18) / 2 : ri(2, 9)), bcv = f === 'long' ? x : 2 * x, ijv = bcv / 2;
    const sc = triScene(nm, triWith([bcv, null, null], d), t, { lens: f === 'long' ? [[b, c, `${b}${c} = ${fr(bcv)} cm`, COL.b], ['I', 'J', 'IJ = ?', COL.a]] : [[b, c, `${b}${c} = ?`, COL.b], ['I', 'J', `IJ = ${fr(ijv)} cm`, COL.a]] });
    const E = f === 'long' ? ijv : bcv;
    return numQ({
      E: [E], tpl: f === 'long' ? `IJ = {0} cm` : `${b}${c} = {0} cm`, comma: true,
      html: `Dans le triangle ${a}${b}${c}, I est le milieu de [${a}${b}] et J est le milieu de [${a}${c}]. ${f === 'long' ? `On a ${b}${c} = ${fr(bcv)} cm. Quelle est la longueur IJ ?` : `On a IJ = ${fr(ijv)} cm. Quelle est la longueur ${b}${c} ?`}`, visual: sc.svg,
      hint: `I et J sont les milieux de deux côtés de ${a}${b}${c} : [IJ] est un segment qui joint ces deux milieux. Quel lien y a-t-il entre sa longueur et celle du troisième côté [${b}${c}] ?`,
      solution: f === 'long' ? `I et J sont les milieux de [${a}${b}] et [${a}${c}] : d'après le théorème de la droite des milieux, IJ = ${b}${c} ÷ 2 = ${fr(bcv)} ÷ 2 = <b>${fr(ijv)} cm</b>.` : `I et J sont les milieux de [${a}${b}] et [${a}${c}] : IJ = ${b}${c} ÷ 2, donc ${b}${c} = 2 × IJ = 2 × ${fr(ijv)} = <b>${fr(bcv)} cm</b>.`,
      msg: v => (f === 'long' ? (v[0] === bcv ? `${fr(bcv)} cm est la longueur de [${b}${c}] ; IJ en est la moitié.` : '') : (v[0] === ijv ? `Dans l'autre sens : [${b}${c}] est le <b>double</b> de [IJ].` : '')),
      value: f === 'long' ? dist(sc.I, sc.J) / S : dist(sc.B, sc.C) / S,
    });
  }
  if (f === 'para') {
    const yes = d < 2 ? true : ri(0, 1) === 1, aj = sd(d), jc = yes ? aj : aj + ri(1, 3) * (comma ? 0.5 : 1), total = aj + jc, fj = aj / total;
    const ai = ri(3, 8), lo2 = Math.abs(total - 2 * ai) + 1.5, hi2 = total + 2 * ai - 1.5, bcm = ri(Math.ceil(lo2 * 2), Math.floor(hi2 * 2)) / 2, sc = triScene(nm, [bcm, total, 2 * ai], t, { fj, lens: [[a, 'I', `${a}I = ${ai} cm`, COL.b], ['I', b, `I${b} = ${ai} cm`, COL.b], [a, 'J', `${a}J = ${fr(aj)} cm`, COL.g], ['J', c, `J${c} = ${fr(jc)} cm`, COL.g]], noTick: true });
    return choiceQ({
      opts: [{ v: 'oui', l: `<b>Oui</b>, (IJ) // (${b}${c})` }, { v: 'non', l: `<b>Non</b>, elles ne sont pas parallèles` }], good: yes ? 'oui' : 'non', keep: true,
      html: `Dans le triangle ${a}${b}${c}, on a ${a}I = I${b} = ${ai} cm, ${a}J = ${fr(aj)} cm et J${c} = ${fr(jc)} cm. Les droites (IJ) et (${b}${c}) sont-elles parallèles ?`, visual: sc.svg,
      hint: `Regarde d'abord si I est le milieu de [${a}${b}] (compare ${a}I et I${b}), puis si J est le milieu de [${a}${c}] (compare ${a}J et J${c}) : la droite des milieux n'est parallèle à [${b}${c}] que si les deux sont des milieux.`,
      solution: yes ? `${a}I = I${b} : I est le milieu de [${a}${b}]. ${a}J = J${c} = ${fr(aj)} cm : J est le milieu de [${a}${c}]. Par le théorème de la droite des milieux, (IJ) est parallèle à (${b}${c}) : <b>oui</b>.` : `I est le milieu de [${a}${b}] mais ${a}J = ${fr(aj)} cm et J${c} = ${fr(jc)} cm : J n'est <b>pas</b> le milieu de [${a}${c}]. Si (IJ) était parallèle à (${b}${c}), J serait le milieu de [${a}${c}] (théorème réciproque) : ce n'est pas le cas, donc <b>non</b>.`,
      msg: v => (!yes && v === 'oui' ? `Pour que (IJ) soit parallèle à (${b}${c}), il faut que J soit aussi le milieu : compare ${a}J = ${fr(aj)} et J${c} = ${fr(jc)}.` : ''),
      verify: E => E === (Math.abs(crs(sub(sc.J, sc.I), sub(sc.C, sc.B))) < 1e-9 ? 'oui' : 'non'),
    });
  }
  if (f === 'recip') {
    const ac = d >= 2 ? ri(8, 24) / 2 : ri(4, 12) * 2, back = ri(0, 1) === 1, sc = triScene(nm, triWith([null, ac, null], d), t, { noTick: false, lens: [[c, a, back ? `${a}${c} = ?` : `${a}${c} = ${fr(ac)} cm`, COL.b], [a, 'J', back ? `${a}J = ${fr(ac / 2)} cm` : `${a}J = ?`, COL.g]], arcs: [] });
    const E = back ? ac : ac / 2;
    return numQ({
      E: [E], tpl: back ? `${a}${c} = {0} cm` : `${a}J = {0} cm`, comma: true,
      html: `Dans le triangle ${a}${b}${c}, I est le milieu de [${a}${b}] et J est un point de [${a}${c}] tel que (IJ) est parallèle à (${b}${c}). ${back ? `On a ${a}J = ${fr(ac / 2)} cm. Quelle est la longueur ${a}${c} ?` : `On a ${a}${c} = ${fr(ac)} cm. Quelle est la longueur ${a}J ?`}`, visual: sc.svg,
      hint: `I est le milieu de [${a}${b}] et la parallèle à (${b}${c}) passant par I coupe [${a}${c}] : en quel point particulier de [${a}${c}] tombe-t-elle ? Que vaut alors ${a}J par rapport à ${a}${c} ?`,
      solution: back ? `I est le milieu de [${a}${b}] et (IJ) // (${b}${c}) : d'après le théorème de la droite des milieux, J est le milieu de [${a}${c}]. Donc ${a}${c} = 2 × ${a}J = 2 × ${fr(ac / 2)} = <b>${fr(ac)} cm</b>.` : `I est le milieu de [${a}${b}] et (IJ) // (${b}${c}) : J est le milieu de [${a}${c}] (réciproque). Donc ${a}J = ${a}${c} ÷ 2 = ${fr(ac)} ÷ 2 = <b>${fr(ac / 2)} cm</b>.`,
      msg: v => (back ? (v[0] === ac / 2 ? `${a}J n'est que la moitié de ${a}${c} : ${a}${c} est le double.` : '') : (v[0] === ac ? `C'est ${a}${c} en entier ; J en est le milieu.` : '')),
      value: back ? 2 * dist(sc.A, sc.J) / S : 2 * dist(sc.A, sc.J) / S * 0 + dist(sc.A, sc.C) / S / 2,
    });
  }
  if (f === 'angle') {
    const m = d >= 3 ? ri(35, 85) : 10 * ri(4, 8);
    // triangle construit pour que l'angle en B vaille m : côtés AB = c0, BC = a0
    const c0 = ri(5, 9), a0 = ri(6, 11), A = [c0 * Math.cos(m * Math.PI / 180), c0 * Math.sin(m * Math.PI / 180)], Bp = [0, 0], Cp = [a0, 0];
    const q = x => rot([x[0] * S, x[1] * S], t), Aq = q(A), Bq = q(Bp), Cq = q(Cp), I = mid(Aq, Bq), J = mid(Aq, Cq);
    const f2 = figure({
      P: { [a]: Aq, [b]: Bq, [c]: Cq, I, J }, polys: [{ p: nm, c: COL.ink }], segs: [{ a: I, b: J, c: COL.a, w: 3 }], ticks: [{ a: Aq, b: I }, { a: I, b: Bq }, { a: Aq, b: J, n: 2 }, { a: J, b: Cq, n: 2 }], arcs: [{ v: 'I', a: 'J', b: a, label: `${m}°`, r: 22 }, { v: b, a: c, b: a, label: '?', r: 22, c: COL.g, fill: COL.gFill }],
      ext: 0, maxW: 440, maxH: 270, colors: { I: COL.a, J: COL.a }, aria: 'triangle, droite des milieux, angles correspondants',
    });
    return numQ({
      E: [m], tpl: `${H(a + b + c)} = {0} °`, keys: { neg: false }, html: `Dans le triangle ${a}${b}${c}, I est le milieu de [${a}${b}] et J le milieu de [${a}${c}]. On sait que ${H(a + 'I' + 'J')} = ${m}°. Quelle est la mesure de ${H(a + b + c)} ?`, visual: f2,
      hint: `I et J sont des milieux : que peut-on dire de (IJ) et (${b}${c}) ? Les angles ${H(a + 'IJ')} et ${H(a + b + c)} sont alors placés de la même façon par rapport à la sécante (${a}${b}) : comment s'appellent-ils ?`,
      solution: `I et J sont les milieux de [${a}${b}] et [${a}${c}] : (IJ) // (${b}${c}). Les angles ${H(a + 'IJ')} et ${H(a + b + c)} sont <b>correspondants</b> (droites parallèles coupées par (${a}${b})) : ils sont égaux, ${H(a + b + c)} = <b>${m}°</b>.`,
      msg: v => (v[0] === 180 - m ? `Ce sont des angles correspondants (même côté de la sécante) : ils sont égaux, pas supplémentaires.` : ''),
      value: angleAt(Aq, Bq, Cq),
    });
  }
  if (f === 'peri') {
    const [x, y, z] = side3(d), P = x + y + z;
    if (P % 2 !== 0 && !comma) return L12(d);
    const sc = triScene(nm, [x, y, z], t, { k: true, noTick: false, lens: [[b, c, `${b}${c} = ${fr(x)} cm`], [c, a, `${c}${a} = ${fr(y)} cm`], [a, b, `${a}${b} = ${fr(z)} cm`]] });
    return numQ({
      E: [P / 2], tpl: `Périmètre de IJK : {0} cm`, comma: true,
      html: `Dans le triangle ${a}${b}${c}, I, J et K sont les milieux de [${a}${b}], [${a}${c}] et [${b}${c}]. On a ${b}${c} = ${fr(x)} cm, ${a}${c} = ${fr(y)} cm et ${a}${b} = ${fr(z)} cm. Quel est le périmètre du triangle IJK ?`, visual: sc.svg,
      hint: `Chaque côté de IJK joint deux milieux : il est égal à la moitié d'un côté de ${a}${b}${c} (IJ ↔ ${b}${c}, JK ↔ ${a}${b}, IK ↔ ${a}${c}). Additionne les trois moitiés, ou pense à la moitié du périmètre.`,
      solution: `IJ = ${b}${c} ÷ 2 = ${fr(x / 2)}, JK = ${a}${b} ÷ 2 = ${fr(z / 2)}, IK = ${a}${c} ÷ 2 = ${fr(y / 2)}. Périmètre de IJK = ${fr(x / 2)} + ${fr(z / 2)} + ${fr(y / 2)} = <b>${fr(P / 2)} cm</b> (la moitié de ${fr(P)}).`,
      msg: v => (v[0] === P ? `${fr(P)} cm est le périmètre de ${a}${b}${c} ; celui de IJK en est la moitié.` : ''),
      value: (dist(sc.I, sc.J) + dist(sc.J, sc.Km) + dist(sc.I, sc.Km)) / S,
    });
  }
  // quad : quadrilatère quelconque ABCD et milieux de ses côtés
  const nm4 = names(d, 'ABCD'), [qa, qb, qc, qd] = nm4, ac = ri(4, 12), bd = ri(4, 12);
  const phi = ri(40, 80), A = [-ac / 2, 0], C = [ac / 2, 0], O2 = [ri(-10, 10) / 10, ri(-8, 8) / 10], B = [O2[0] - bd / 3 * Math.cos(phi * Math.PI / 180) * 0 + 0.5, O2[1] + bd / 2 * 0.9], Dd = [O2[0] - 0.5, O2[1] - bd / 2 * 0.9];
  // B et D choisis pour que BD = bd exactement
  const ang = (ri(55, 125)) * Math.PI / 180, ctr = O2, Bq = [ctr[0] + bd / 2 * Math.cos(ang), ctr[1] + bd / 2 * Math.sin(ang)], Dq = [ctr[0] - bd / 2 * Math.cos(ang), ctr[1] - bd / 2 * Math.sin(ang)];
  void B; void Dd; void phi;
  const Q = [A, Bq, C, Dq].map(p => rot([p[0] * S, p[1] * S], t)), [pa, pb, pc, pd] = Q, I = mid(pa, pb), J = mid(pb, pc), K = mid(pc, pd), L = mid(pd, pa);
  const fig = figure({
    P: { [qa]: pa, [qb]: pb, [qc]: pc, [qd]: pd, I, J, K, L }, polys: [{ p: nm4, c: COL.ink }, { p: ['I', 'J', 'K', 'L'], c: COL.a, w: 2.4 }], segs: [{ a: pa, b: pc, c: COL.b, w: 2, dash: true }, { a: pb, b: pd, c: COL.g, w: 2, dash: true }],
    len: [{ a: pa, b: pc, s: `${qa}${qc} = ${ac} cm`, side: 1, c: COL.b, off: 14, pos: 0.2 }, { a: pb, b: pd, s: `${qb}${qd} = ${bd} cm`, side: 1, c: COL.g, off: 14, pos: 0.2 }], ext: 0, maxW: 440, maxH: 280, colors: { I: COL.a, J: COL.a, K: COL.a, L: COL.a }, aria: 'quadrilatère et quadrilatère des milieux',
  });
  const E = ac + bd;
  return numQ({
    E: [E], tpl: `Périmètre de IJKL : {0} cm`, html: `${qa}${qb}${qc}${qd} est un quadrilatère ; I, J, K et L sont les milieux de [${qa}${qb}], [${qb}${qc}], [${qc}${qd}] et [${qd}${qa}]. On a ${qa}${qc} = ${ac} cm et ${qb}${qd} = ${bd} cm. Quel est le périmètre de IJKL ?`, visual: fig,
    hint: `Dans les triangles ${qa}${qb}${qc} et ${qa}${qc}${qd}, [IJ] et [LK] joignent des milieux de côtés et sont liés à la diagonale [${qa}${qc}] ; de même [IL] et [JK] avec la diagonale [${qb}${qd}]. Chaque côté de IJKL vaut combien par rapport à la diagonale correspondante ?`,
    solution: `Dans ${qa}${qb}${qc} : IJ = ${qa}${qc} ÷ 2 = ${fr(ac / 2)}. Dans ${qa}${qc}${qd} : LK = ${qa}${qc} ÷ 2 = ${fr(ac / 2)}. De même IL = JK = ${qb}${qd} ÷ 2 = ${fr(bd / 2)}. Périmètre = 2 × ${fr(ac / 2)} + 2 × ${fr(bd / 2)} = ${fr(ac)} + ${fr(bd)} = <b>${fr(E)} cm</b>.`,
    msg: v => (v[0] === (ac + bd) / 2 ? `Il y a <b>quatre</b> côtés : IJ et LK valent chacun ${ac / 2}, IL et JK valent chacun ${bd / 2}.` : ''),
    value: (dist(I, J) + dist(J, K) + dist(K, L) + dist(L, I)) / S,
  });
}

export function C12() {
  const nm = ['A', 'B', 'C'], sd0 = [8, 7, 6];
  const f1 = triScene(nm, sd0, 0, { lens: [['B', 'C', 'BC = 8 cm', COL.b], ['I', 'J', 'IJ = ?', COL.a]] }).svg;
  const f2 = triScene(nm, [10, 7, 6], 0, { lens: [['B', 'C', 'BC = ?', COL.b], ['I', 'J', 'IJ = 5 cm', COL.a]] }).svg;
  const f3 = triScene(nm, sd0, 0, { fj: 0.5, noTick: true, lens: [['A', 'I', 'AI = 3 cm', COL.b], ['I', 'B', 'IB = 3 cm', COL.b], ['A', 'J', 'AJ = 4 cm', COL.g], ['J', 'C', 'JC = 4 cm', COL.g]] }).svg;
  const f4 = triScene(nm, sd0, 0, { fj: 0.4, noTick: true, lens: [['A', 'I', 'AI = 3 cm', COL.b], ['I', 'B', 'IB = 3 cm', COL.b], ['A', 'J', 'AJ = 3 cm', COL.g], ['J', 'C', 'JC = 4,5 cm', COL.g]] }).svg;
  const f5 = triScene(nm, [8, 10, 6], 0, { lens: [['C', 'A', 'AC = 10 cm', COL.b], ['A', 'J', 'AJ = ?', COL.g]] }).svg;
  const T = triSSS(8, 7, 6);
  void T;
  const f6 = (() => { const A = [4.2, 4], B = [0, 0], C = [8, 0], I = mid(A, B), J = mid(A, C); return figure({ P: { A, B, C, I, J }, polys: [{ p: ['A', 'B', 'C'], c: COL.ink }], segs: [{ a: I, b: J, c: COL.a, w: 3 }], ticks: [{ a: A, b: I }, { a: I, b: B }, { a: A, b: J, n: 2 }, { a: J, b: C, n: 2 }], arcs: [{ v: 'I', a: 'J', b: 'A', label: '65°', r: 22 }, { v: 'B', a: 'C', b: 'A', label: '?', r: 22, c: COL.g, fill: COL.gFill }], ext: 0, maxW: 400, colors: { I: COL.a, J: COL.a }, aria: 'angles correspondants' }); })();
  const f7 = triScene(nm, [8, 7, 6], 0, { k: true, lens: [['B', 'C', 'BC = 8 cm'], ['C', 'A', 'AC = 7 cm'], ['A', 'B', 'AB = 6 cm']] }).svg;
  const f8 = (() => { const A = [0, 0], Bq = [3, 4], C = [8, 0], Dq = [3, -3]; const I = mid(A, Bq), J = mid(Bq, C), K = mid(C, Dq), L = mid(Dq, A); return figure({ P: { A, B: Bq, C, D: Dq, I, J, K, L }, polys: [{ p: ['A', 'B', 'C', 'D'], c: COL.ink }, { p: ['I', 'J', 'K', 'L'], c: COL.a }], segs: [{ a: A, b: C, c: COL.b, dash: true }, { a: Bq, b: Dq, c: COL.g, dash: true }], ext: 0, maxW: 400, colors: { I: COL.a, J: COL.a, K: COL.a, L: COL.a }, aria: 'quadrilatère et ses milieux' }); })();
  return cours('12. Droite des milieux', `Un segment qui joint les milieux de deux côtés d'un triangle est un « mini-côté » : il est parallèle au troisième côté et deux fois plus court.`,
    def(`Dans un triangle ABC, soit I le milieu de [AB] et J le milieu de [AC].<br>• <b>Théorème 1</b> : (IJ) est <b>parallèle</b> à (BC).<br>• <b>Théorème 2</b> : IJ = BC ÷ 2 (le segment [IJ] est la moitié de [BC]).<br>• <b>Théorème 3 (réciproque)</b> : si I est le milieu de [AB] et si la parallèle à (BC) passant par I coupe [AC] en J, alors J est le <b>milieu</b> de [AC].`),
    meth(`Repère le triangle et les <b>deux milieux</b> (codages égaux) ; le segment qui les joint est la « droite des milieux ».`, `Pour une longueur : IJ = (le côté qu'il ne touche pas) ÷ 2 ; pour un parallélisme : (IJ) // (troisième côté).`, `Pour la réciproque : un milieu + une parallèle au côté opposé → l'autre point est un milieu.`),
    f1,
    ex(`Exemple 1 : I et J sont les milieux de [AB] et [AC], BC = 8 cm. Quelle est la longueur IJ ?`, `Droite des milieux : IJ = BC ÷ 2 = 8 ÷ 2.<br>${rep('IJ = 4 cm')}`),
    f2,
    ex(`Exemple 2 : IJ = 5 cm, quelle est la longueur BC ?`, `IJ = BC ÷ 2, donc BC = 2 × IJ = 2 × 5.<br>${rep('BC = 10 cm')}`),
    f3,
    ex(`Exemple 3 : AI = IB = 3 cm et AJ = JC = 4 cm. Les droites (IJ) et (BC) sont-elles parallèles ?`, `I est le milieu de [AB] et J le milieu de [AC] : (IJ) est la droite des milieux, elle est parallèle à (BC).<br>${rep('oui')}`),
    f4,
    ex(`Exemple 4 : AI = IB = 3 cm mais AJ = 3 cm et JC = 4,5 cm`, `I est le milieu de [AB], mais J n'est pas le milieu de [AC] (3 ≠ 4,5). Si (IJ) était parallèle à (BC), J serait le milieu de [AC] (réciproque) : ce n'est pas le cas, donc (IJ) n'est <b>pas</b> parallèle à (BC).<br>${rep('non')}`),
    f5,
    ex(`Exemple 5 : réciproque, (IJ) // (BC) et I milieu de [AB], AC = 10 cm. Quelle est la longueur AJ ? (et inversement : AJ = 5 cm, quelle est la longueur AC ?)`, `La parallèle à (BC) passant par le milieu I de [AB] coupe [AC] en son milieu J. AJ = AC ÷ 2 = 10 ÷ 2 = 5 cm. Dans l'autre sens, AC = 2 × AJ = 2 × 5 = 10 cm.<br>${rep('AJ = 5 cm ; AC = 10 cm')}`),
    f6,
    ex(`Exemple 6 : angles (I et J milieux, angle AIJ = 65°), quelle est la mesure de l'angle ABC ?`, `(IJ) // (BC) : les angles AIJ et ABC sont des angles correspondants, donc égaux.<br>${rep('ABC = 65 °')}`),
    f7,
    ex(`Exemple 7 : périmètre du triangle des milieux (BC = 8 cm, AC = 7 cm, AB = 6 cm)`, `Chaque côté de IJK est la moitié d'un côté de ABC : 4 + 3,5 + 3 = 10,5. C'est la moitié du périmètre 21 cm.<br>${rep('périmètre de IJK : 10,5 cm')}`),
    f8,
    ex(`Exemple 8 : les milieux d'un quadrilatère ABCD (AC = 10 cm, BD = 8 cm). Quel est le périmètre de IJKL ?`, `Dans ABC : IJ = AC ÷ 2 = 5, et dans ACD : LK = AC ÷ 2 = 5. De même IL = JK = BD ÷ 2 = 4. Périmètre = 5 + 5 + 4 + 4.<br>${rep('périmètre de IJKL : 18 cm')}`),
    warn(`Il faut <b>deux milieux</b> pour utiliser le théorème : un seul ne suffit pas pour avoir (IJ) // (BC).`, `IJ est la <b>moitié</b> de BC, pas le double ni égal : BC = 2 × IJ.`, `Les angles correspondants ne sont égaux que parce que les droites sont parallèles.`),
    retenir(`dans un triangle, la droite qui joint les milieux de deux côtés est parallèle au troisième côté et mesure la moitié de sa longueur.`));
}
void cols;

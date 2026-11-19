// Niveau 3 : la symétrie axiale conserve longueurs, angles, aires, périmètres (calculs). 6e.
import { figure, rot, COL, dist, angleAt } from './draw.js';
import { names, orient, numQ, ex, rep, warn, retenir, meth, def, cours, cols, pick, ri, fr, H, chance } from './util.js';

export const S = 0.5; // unités du dessin par cm
export const triSSS = (a, b, c) => { const x = (a * a + c * c - b * b) / (2 * a); return { B: [0, 0], C: [a, 0], A: [x, Math.sqrt(c * c - x * x)] }; };
export const triSAS = (c, a, m) => ({ B: [0, 0], C: [a, 0], A: [c * Math.cos(m * Math.PI / 180), c * Math.sin(m * Math.PI / 180)] });
export const triBH = (b, h, p) => ({ B: [0, 0], C: [b, 0], A: [p, h] });
const shoelace = (A, B, C) => Math.abs((B[0] - A[0]) * (C[1] - A[1]) - (C[0] - A[0]) * (B[1] - A[1])) / 2;
/** longueur affichée le long de [PQ], du côté opposé au point G (centre de la figure) */
export function lenOut(P, Q, G, s, c) {
  const u = [Q[0] - P[0], Q[1] - P[1]], n = Math.hypot(...u), m = [(P[0] + Q[0]) / 2 - G[0], (P[1] + Q[1]) / 2 - G[1]];
  const side = (-u[1] * m[0] + u[0] * m[1]) >= 0 ? 1 : -1;
  return { a: P, b: Q, s, side, c, off: 14 };
}
/** triangle (points en cm dans tri) et son image par la symétrie d'axe vertical ; renvoie figure et coordonnées (dessin) */
function symScene(nm, tri, t, opt = {}) {
  const [a, b, c] = nm, [a2, b2, c2] = nm.map(x => x + '′');
  const xmin = Math.min(...[tri.A, tri.B, tri.C].map(p => p[0] * S));
  const sh = 1.5 - xmin, p0 = { [a]: tri.A, [b]: tri.B, [c]: tri.C };
  const Q = {}, R = {};
  for (const [k, p] of Object.entries(p0)) { const x = p[0] * S + sh, y = p[1] * S; Q[k] = rot([x, y], t); R[k + '′'] = rot([-x, y], t); }
  const axis = [rot([0, -2.4], t), rot([0, 2.6 + Math.max(...Object.values(p0).map(p => p[1] * S))], t)];
  const P = { ...Q, ...R };
  const G1 = [0, 0, 0].map((_, i) => 0);
  void G1;
  const cen = ps => [ps.reduce((s, p) => s + p[0], 0) / ps.length, ps.reduce((s, p) => s + p[1], 0) / ps.length];
  const g1 = cen([Q[a], Q[b], Q[c]]), g2 = cen([R[a2], R[b2], R[c2]]);
  const f = {
    P, polys: [{ p: [a, b, c], c: COL.b }, { p: [a2, b2, c2], c: COL.g }],
    lines: [{ a: axis[0], b: axis[1], c: COL.a, w: 2.6, arrows: false, label: '(d)' }], len: [], rights: [], segs: [], arcs: [], ext: 0,
    colors: { ...Object.fromEntries([a, b, c].map(k => [k, COL.b])), ...Object.fromEntries([a2, b2, c2].map(k => [k, COL.g])) }, maxW: 500, maxH: 260, aria: 'triangle et son symétrique par rapport à la droite (d)',
  };
  for (const [x, y, s] of opt.lens || []) f.len.push(lenOut(Q[x], Q[y], g1, s, COL.b));
  for (const [x, y, s] of opt.lens2 || []) f.len.push(lenOut(R[x + '′'], R[y + '′'], g2, s, COL.g));
  for (const k of opt.dash || []) f.segs.push({ a: Q[k[0]], b: Q[k[1]], c: COL.a, dash: true, w: 2 });
  for (const k of opt.dash2 || []) f.segs.push({ a: R[k[0] + '′'], b: R[k[1] + '′'], c: COL.a, dash: true, w: 2 });
  for (const r of opt.rights || []) f.rights.push(r);
  for (const r of opt.arcs || []) f.arcs.push(r);
  return { svg: figure(f), Q, R, P };
}
const lensOf = (A, B, C) => ({ a: dist(B, C) / S, b: dist(C, A) / S, c: dist(A, B) / S });
const pickSides = (d, lo = 3, hi = 9) => {
  for (;;) {
    const half = d >= 2, f = () => (half ? ri(lo * 2, hi * 2) / 2 : ri(lo, hi));
    const a = f(), b = f(), c = f(), s = [a, b, c].sort((x, y) => x - y);
    if (s[2] < s[0] + s[1] - 1.4 && !(a === b && b === c)) return [a, b, c];
  }
};
const unit = (pt) => pt;
void unit;

export function L3(d) {
  const nm = names(d, 'ABC'), [a, b, c] = nm, [a2, b2, c2] = nm.map(x => x + '′'), t = orient(d);
  const forms = d < 1 ? ['long'] : d < 2 ? ['long', 'ang'] : d < 3 ? ['long', 'ang', 'aire'] : d < 4 ? ['long', 'ang', 'aire', 'peri'] : ['long', 'ang', 'aire', 'peri', 'deux'];
  const f = pick(forms), comma = d >= 2;
  if (f === 'long') {
    const [la, lb, lc] = pickSides(d), tri = triSSS(la, lb, lc);
    const pair = pick([[a, b, lc], [b, c, la], [c, a, lb]]), back = d >= 1 && chance(0.4);
    const [x, y, val] = pair, [x2, y2] = [x + '′', y + '′'];
    const sc = symScene(nm, tri, t, back ? { lens2: [[x, y, `${fr(val)} cm`]], lens: [[x, y, '?']] } : { lens: [[x, y, `${fr(val)} cm`]], lens2: [[x, y, '?']] });
    const [g, g2] = back ? [`${x2}${y2}`, `${x}${y}`] : [`${x}${y}`, `${x2}${y2}`];
    return numQ({
      E: [val], tpl: `${g2} = {0} cm`, comma, html: `Le triangle ${a2}${b2}${c2} est le symétrique du triangle ${a}${b}${c} par rapport à la droite (d). On sait que ${g} = ${fr(val)} cm. Quelle est la longueur ${g2} ?`,
      visual: sc.svg, hint: `[${g2}] est le symétrique du segment [${g}] : une symétrie axiale change-t-elle la longueur d'un segment ?`,
      solution: `La symétrie axiale conserve les longueurs. Le segment [${g2}] est le symétrique de [${g}], donc ${g2} = ${g} = <b>${fr(val)} cm</b>.`,
      msg: v => (v[0] === 2 * val ? `Le symétrique n'est pas deux fois plus long : la symétrie ne change pas les longueurs.` : ''),
      value: dist(back ? sc.Q[x] : sc.R[x + '′'], back ? sc.Q[y] : sc.R[y + '′']) / S * (back ? 1 : 1),
    });
  }
  if (f === 'ang') {
    const m = d < 2 ? 10 * ri(3, 15) : ri(25, 155), tri = triSAS(ri(4, 8), ri(4, 8), m), at = pick([a, b, c]);
    void at;
    const arcs = [{ v: b, a, b: c, label: `${m}°`, r: 24 }], sc0 = symScene(nm, tri, t, { arcs });
    const sc = symScene(nm, tri, t, { arcs: [{ v: b, a, b: c, label: `${m}°`, r: 24 }, { v: b2, a: a2, b: c2, label: '?', r: 24, c: COL.g, fill: COL.gFill }] });
    void sc0;
    return numQ({
      E: [m], tpl: `${H(a2 + b2 + c2)} = {0} °`, html: `Le triangle ${a2}${b2}${c2} est le symétrique de ${a}${b}${c} par rapport à la droite (d). On sait que ${H(a + b + c)} = ${m}°. Quelle est la mesure de l'angle ${H(a2 + b2 + c2)} ?`,
      visual: sc.svg, hint: `L'angle ${H(a2 + b2 + c2)} est le symétrique de ${H(a + b + c)} : que devient la mesure d'un angle quand on fait une symétrie axiale ?`,
      solution: `La symétrie axiale conserve les angles : ${H(a2 + b2 + c2)} = ${H(a + b + c)} = <b>${m}°</b>.`,
      msg: v => (v[0] === 180 - m ? `Les angles ne deviennent pas « supplémentaires » : ils sont conservés (même mesure).` : v[0] === 360 - m ? `Un angle de ${m}° a pour symétrique un angle de même mesure.` : ''),
      value: angleAt(sc.R[a + '′'], sc.R[b + '′'], sc.R[c + '′']) * 1,
    });
  }
  if (f === 'aire') {
    let bb, h; do { bb = ri(4, 12); h = ri(3, 9); } while ((bb * h) % 2);
    const tri = triBH(bb, h, ri(1, bb - 1)), foot = [tri.A[0], 0];
    void foot;
    const sc = symScene(nm, tri, t, { lens: [[b, c, `${bb} cm`]], dash: [], arcs: [] });
    // hauteur : pied H ajouté
    const sc2 = (() => {
      const base = symScene(nm, tri, t, { lens: [[b, c, `${bb} cm`]] }); void base;
      return null;
    })();
    void sc; void sc2;
    // figure avec hauteur [AH] (pied H sur [BC]) ; H est ajouté comme point de la figure
    const out = heightScene(nm, tri, t, bb, h);
    const aire = bb * h / 2;
    return numQ({
      E: [aire], tpl: `Aire de ${a2}${b2}${c2} : {0} cm²`, comma: true,
      html: `Le triangle ${a2}${b2}${c2} est le symétrique du triangle ${a}${b}${c} par rapport à la droite (d). Dans ${a}${b}${c}, la base ${b}${c} mesure ${bb} cm et la hauteur ${a}H mesure ${h} cm. Quelle est l'aire du triangle ${a2}${b2}${c2} ?`,
      visual: out.svg, hint: `La symétrie axiale conserve les aires : calcule d'abord l'aire de ${a}${b}${c} (base × hauteur ÷ 2) avec ${bb} et ${h}, puis dis ce que devient l'aire.`,
      solution: `Aire de ${a}${b}${c} = base × hauteur ÷ 2 = ${bb} × ${h} ÷ 2 = ${fr(aire)} cm². La symétrie axiale conserve les aires : l'aire de ${a2}${b2}${c2} est aussi <b>${fr(aire)} cm²</b>.`,
      msg: v => (v[0] === bb * h ? `N'oublie pas de diviser par 2 : l'aire d'un triangle est base × hauteur ÷ 2.` : v[0] === bb + h ? `On multiplie la base et la hauteur (puis ÷ 2) : l'aire n'est pas une somme.` : ''),
      value: shoelace(out.R[a + '′'], out.R[b + '′'], out.R[c + '′']) / (S * S),
    });
  }
  if (f === 'peri') {
    const [la, lb, lc] = pickSides(d, 3, 9), tri = triSSS(la, lb, lc);
    const sc = symScene(nm, tri, t, { lens: [[b, c, `${b}${c} = ${fr(la)} cm`], [c, a, `${c}${a} = ${fr(lb)} cm`], [a, b, `${a}${b} = ${fr(lc)} cm`]] });
    const E = la + lb + lc;
    return numQ({
      E: [E], tpl: `Périmètre de ${a2}${b2}${c2} : {0} cm`, comma: true, html: `Le triangle ${a2}${b2}${c2} est le symétrique du triangle ${a}${b}${c} par rapport à la droite (d). Les côtés de ${a}${b}${c} mesurent ${b}${c} = ${fr(la)} cm, ${c}${a} = ${fr(lb)} cm et ${a}${b} = ${fr(lc)} cm. Quel est le périmètre de ${a2}${b2}${c2} ?`,
      visual: sc.svg, hint: `Chaque côté de ${a2}${b2}${c2} a la même longueur que son symétrique dans ${a}${b}${c} : que vaut alors la somme des trois côtés de ${a2}${b2}${c2} ?`,
      solution: `${b2}${c2} = ${b}${c}, ${c2}${a2} = ${c}${a} et ${a2}${b2} = ${a}${b} (conservation des longueurs). Périmètre = ${fr(la)} + ${fr(lb)} + ${fr(lc)} = <b>${fr(E)} cm</b>.`,
      msg: v => (v[0] === la + lb || v[0] === lb + lc || v[0] === la + lc ? `Il y a trois côtés dans un triangle : as-tu additionné les trois ?` : ''),
      value: (dist(sc.R[a + '′'], sc.R[b + '′']) + dist(sc.R[b + '′'], sc.R[c + '′']) + dist(sc.R[c + '′'], sc.R[a + '′'])) / S,
    });
  }
  // deux étapes : périmètre de ABC connu, deux côtés connus, on cherche un côté de l'image
  const [la, lb, lc] = pickSides(d, 3, 9), tri = triSSS(la, lb, lc), P = la + lb + lc;
  const pair = pick([[a, b, lc, c, a, lb], [b, c, la, a, b, lc], [c, a, lb, b, c, la]]);
  const [x1, y1, v1, x2, y2, v2] = pair;
  const target = ['A', 'B', 'C'].includes(x1) ? null : null; void target;
  // inconnu : le 3e côté (celui qui reste), demandé dans l'image
  const all = [[a, b, lc], [b, c, la], [c, a, lb]], unk = pick(all), known = all.filter(s => s !== unk);
  void x1; void y1; void v1; void x2; void y2; void v2;
  const sc = symScene(nm, tri, t, { lens: known.map(s => [s[0], s[1], `${s[0]}${s[1]} = ${fr(s[2])} cm`]), lens2: [[unk[0], unk[1], '?']] });
  const [u1, u2] = unk;
  return numQ({
    E: [unk[2]], tpl: `${u1}′${u2}′ = {0} cm`, comma: true, html: `Le triangle ${a2}${b2}${c2} est le symétrique du triangle ${a}${b}${c} par rapport à la droite (d). Le périmètre de ${a}${b}${c} est ${fr(P)} cm, avec ${known[0][0]}${known[0][1]} = ${fr(known[0][2])} cm et ${known[1][0]}${known[1][1]} = ${fr(known[1][2])} cm. Quelle est la longueur ${u1}′${u2}′ ?`,
    visual: sc.svg, hint: `Il te manque le côté ${u1}${u2} de ${a}${b}${c} : tu le trouves avec le périmètre ${fr(P)} cm moins les deux côtés connus. Que vaut alors ${u1}′${u2}′ ?`,
    solution: `${u1}${u2} = ${fr(P)} − ${fr(known[0][2])} − ${fr(known[1][2])} = ${fr(unk[2])} cm. La symétrie conserve les longueurs : ${u1}′${u2}′ = ${u1}${u2} = <b>${fr(unk[2])} cm</b>.`,
    msg: v => (v[0] === P - known[0][2] ? `Tu as retiré un seul côté : il faut enlever les deux côtés connus du périmètre.` : v[0] === P ? `Le périmètre est la somme des trois côtés, pas la longueur d'un côté.` : ''),
    value: dist(sc.R[u1 + '′'], sc.R[u2 + '′']) / S,
  });
}
/** scène avec la hauteur [AH] tracée dans ABC (pied H sur [BC]) */
function heightScene(nm, tri, t, bb, h) {
  const [a, b, c] = nm;
  const base = symScene(nm, tri, t, { lens: [[b, c, `${bb} cm`]] });
  const xmin = Math.min(...[tri.A, tri.B, tri.C].map(p => p[0] * S)), sh = 1.5 - xmin;
  const Hp = rot([tri.A[0] * S + sh, 0], t), A = base.Q[a];
  const sc = symScene(nm, tri, t, { lens: [[b, c, `${bb} cm`]] });
  // reconstruit la figure en ajoutant H et [AH] : on regénère avec figure() directement
  const Q = base.Q, R = base.R;
  const Hn = 'H';
  const f = {
    P: { ...Q, ...R, [Hn]: Hp }, polys: [{ p: [a, b, c], c: COL.b }, { p: [a + '′', b + '′', c + '′'], c: COL.g }],
    lines: [{ a: rot([0, -2.4], t), b: rot([0, 2.6 + h * S], t), c: COL.a, w: 2.6, arrows: false, label: '(d)' }],
    segs: [{ a: A, b: Hp, c: COL.a, dash: true, w: 2 }], rights: [{ v: Hn, a, b: c, size: 12 }], ext: 0, maxW: 500, maxH: 260,
    colors: { ...Object.fromEntries([a, b, c].map(k => [k, COL.b])), ...Object.fromEntries([a, b, c].map(k => [k + '′', COL.g])) },
    len: [lenOut(Q[b], Q[c], [(Q[a][0] + Q[b][0] + Q[c][0]) / 3, (Q[a][1] + Q[b][1] + Q[c][1]) / 3], `${bb} cm`, COL.b), { a: A, b: Hp, s: `${h} cm`, side: 1, c: COL.a, off: 14 }],
    aria: 'triangle, sa hauteur et son symétrique',
  };
  void sc;
  return { svg: figure(f), Q, R };
}

export function C3() {
  const tri = triSSS(6, 5, 4), nm = ['A', 'B', 'C'];
  const fl = symScene(nm, tri, 0, { lens: [['A', 'B', '4 cm']], lens2: [['A', 'B', '?']] }).svg;
  const tri2 = triSAS(6, 7, 50);
  const fa = symScene(nm, tri2, 0, { arcs: [{ v: 'B', a: 'A', b: 'C', label: '50°', r: 24 }, { v: 'B′', a: 'A′', b: 'C′', label: '?', r: 24, c: COL.g, fill: COL.gFill }] }).svg;
  const fh = heightScene(nm, triBH(8, 5, 3), 0, 8, 5);
  const fp = symScene(nm, triSSS(7, 6, 5), 0, { lens: [['B', 'C', 'BC = 7 cm'], ['C', 'A', 'CA = 6 cm'], ['A', 'B', 'AB = 5 cm']] }).svg;
  const f2 = symScene(nm, triSSS(7, 6, 5), 0, { lens: [['B', 'C', 'BC = 7 cm'], ['A', 'B', 'AB = 5 cm']], lens2: [['C', 'A', '?']] }).svg;
  return cours('3. Ce que la symétrie axiale conserve', `Quand on fait « glisser » une figure de l'autre côté d'un axe en la retournant, elle ne se déforme pas. C'est ce qui permet de répondre à des questions sans rien mesurer.`,
    def(`La symétrie axiale <b>conserve</b> :<br>• les <b>longueurs</b> : le symétrique d'un segment a la même longueur ;<br>• les <b>mesures d'angles</b> ;<br>• les <b>aires</b> et les <b>périmètres</b> : une figure et sa symétrique ont même aire et même périmètre.<br>On dit que la figure et son symétrique sont <b>superposables</b> (par retournement).`),
    meth(`Repère quel élément de la figure de départ correspond à celui qu'on te demande (le segment [A′B′] correspond à [AB]).`, `Écris que les deux ont la même longueur, la même mesure, la même aire ou le même périmètre.`, `Si besoin, calcule d'abord dans la figure de départ (aire, périmètre, côté manquant).`),
    fl,
    ex(`Exemple 1 : longueur d'un segment image`, `Dans la figure, A′B′C′ est le symétrique de ABC et AB = 4 cm. La symétrie conserve les longueurs : A′B′ = AB.<br>${rep('A′B′ = 4 cm')}`),
    ex(`Exemple 2 : on connaît la longueur de l'image et on cherche l'original`, `Si on sait que B′C′ = 6,5 cm, alors BC a la même longueur, car la symétrie conserve les longueurs (dans les deux sens).<br>${rep('BC = 6,5 cm')}`),
    fa,
    ex(`Exemple 3 : mesure d'un angle`, `On sait que l'angle ${H('ABC')} = 50°. La symétrie conserve les angles : ${H('A′B′C′')} = ${H('ABC')}.<br>${rep('A′B′C′ = 50 °')}`),
    fh.svg,
    ex(`Exemple 4 : aire d'un triangle image`, `Dans ABC, BC = 8 cm et la hauteur AH = 5 cm : aire = 8 × 5 ÷ 2 = 20 cm². La symétrie conserve les aires : l'aire de A′B′C′ est la même.<br>${rep('aire de A′B′C′ : 20 cm²')}`),
    fp,
    ex(`Exemple 5 : périmètre de l'image`, `Les côtés de ABC mesurent 7 cm, 6 cm et 5 cm. Ceux de A′B′C′ sont de mêmes longueurs : 7 + 6 + 5 = 18.<br>${rep('périmètre de A′B′C′ : 18 cm')}`),
    f2,
    ex(`Exemple 6 : un côté de l'image à partir du périmètre de l'original`, `Le périmètre de ABC est 18 cm, avec BC = 7 cm et AB = 5 cm. Alors CA = 18 − 7 − 5 = 6 cm. Comme la symétrie conserve les longueurs, C′A′ = CA.<br>${rep('C′A′ = 6 cm')}`),
    warn(`Ne confonds pas « conserver » et « avoir la même position » : la figure est retournée, mais elle ne change ni de taille ni de forme.`, `Pense à la ÷ 2 de l'aire du triangle, et à additionner <b>les trois</b> côtés d'un périmètre.`, `Un angle ne devient pas son supplémentaire (180° − m) : il garde sa mesure.`),
    retenir(`la symétrie axiale conserve longueurs, angles, aires et périmètres.`));
}

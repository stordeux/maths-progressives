// Niveau 8 : droites remarquables du triangle (hauteur, médiane, médiatrice, cercle circonscrit). 5e.
import { figure, rot, COL, dist, pol } from './draw.js';
import { names, orient, numQ, choiceQ, ex, rep, warn, retenir, meth, def, cours, cols, pick, ri, fr, shuffle } from './util.js';
import { S } from './l03.js';

const sub = (P, Q) => [P[0] - Q[0], P[1] - Q[1]], dotp = (u, v) => u[0] * v[0] + u[1] * v[1], crs = (u, v) => u[0] * v[1] - u[1] * v[0];
const angAt = (P, V, Q) => Math.abs(Math.atan2(crs(sub(P, V), sub(Q, V)), dotp(sub(P, V), sub(Q, V)))) * 180 / Math.PI;
const proj = (V, U, W) => { const u = sub(W, U), k = dotp(sub(V, U), u) / dotp(u, u); return [U[0] + k * u[0], U[1] + k * u[1]]; };
const midp = (P, Q) => [(P[0] + Q[0]) / 2, (P[1] + Q[1]) / 2];

/** triangle de coordonnées : aigu (angles entre 45° et 80°, pas isocèle) ou obtus en C */
function rawTri(obtuse) {
  for (;;) {
    const A = obtuse ? [ri(62, 80) / 10, ri(22, 32) / 10] : [ri(6, 40) / 10, ri(26, 40) / 10], B = [0, 0], C = [5, 0];
    const a1 = angAt(B, A, C), a2 = angAt(A, B, C), a3 = angAt(A, C, B);
    if (Math.abs(dist(A, B) - dist(A, C)) < 0.5 || Math.abs(dist(B, A) - dist(B, C)) < 0.5 || Math.abs(dist(C, A) - dist(C, B)) < 0.5) continue;
    if (obtuse ? a3 > 100 && a3 < 130 && a2 > 18 : Math.max(a1, a2, a3) < 82 && Math.min(a1, a2, a3) > 38) return { A, B, C };
  }
}
/** figure d'une droite remarquable : kind = 'haut' | 'med' | 'mdt' ; V sommet, [UW] côté opposé */
function lineScene(nm, tri, t, kind, vi) {
  const names3 = nm, pts = [tri.A, tri.B, tri.C].map(p => rot([p[0], p[1]], t));
  const idx = [vi, (vi + 1) % 3, (vi + 2) % 3], [V, U, W] = idx.map(i => pts[i]), [nv, nu, nw] = idx.map(i => names3[i]);
  const M = midp(U, W), F = proj(V, U, W), P = { [names3[0]]: pts[0], [names3[1]]: pts[1], [names3[2]]: pts[2] };
  const f = { P, polys: [{ p: names3, c: COL.ink }], lines: [], ticks: [], rights: [], segs: [], ext: 0.2, maxW: 440, maxH: 280, colors: {}, aria: 'triangle et une droite' };
  let L;
  if (kind === 'haut') {
    P.H = F; f.colors.H = COL.a; L = [V, F];
    const inside = dotp(sub(F, U), sub(W, U)) > 0 && dotp(sub(F, W), sub(U, W)) > 0;
    if (!inside) { const nearer = dist(F, U) < dist(F, W) ? U : W; f.segs.push({ a: nearer, b: F, c: COL.ink, dash: true, w: 2 }); f.rights.push({ v: 'H', a: V, b: nearer, size: 12 }); }
    else f.rights.push({ v: 'H', a: V, b: U, size: 12 });
  } else if (kind === 'med') {
    P.M = M; f.colors.M = COL.a; L = [V, M]; f.ticks.push({ a: U, b: M, n: 1 }, { a: M, b: W, n: 1 });
  } else {
    P.M = M; f.colors.M = COL.a; const nrm = [-(W[1] - U[1]), W[0] - U[0]], n = Math.hypot(...nrm), tip = [M[0] + nrm[0] / n, M[1] + nrm[1] / n]; L = [M, tip];
    f.ticks.push({ a: U, b: M, n: 1 }, { a: M, b: W, n: 1 }); P._t = tip; f.hide = ['_t']; f.rights.push({ v: 'M', a: W, b: '_t', size: 12 });
  }
  f.lines.push({ a: L[0], b: L[1], c: COL.a, w: 3, label: '(d)', arrows: false });
  return { svg: figure(f), L, V, U, W, nv, nu, nw, M, F, pts };
}
const classify = (L, V, U, W) => {
  const dir = sub(L[1], L[0]), thr = Math.abs(crs(dir, sub(V, L[0]))) < 1e-6, perp = Math.abs(dotp(dir, sub(W, U))) < 1e-6, thm = Math.abs(crs(dir, sub(midp(U, W), L[0]))) < 1e-6;
  return thr && perp ? 'haut' : thr && thm ? 'med' : !thr && perp && thm ? 'mdt' : '?';
};
const NOMS = { haut: 'une hauteur', med: 'une médiane', mdt: 'une médiatrice' };
const OPT = [{ v: 'haut', l: '<b>une hauteur</b>' }, { v: 'med', l: '<b>une médiane</b>' }, { v: 'mdt', l: '<b>une médiatrice</b>' }];

/** triangle inscrit dans un cercle de rayon r cm ; renvoie points et centre */
function circScene(nm, r, t, o = {}) {
  const [a, b, c] = nm, k = o.fix ? 20 : ri(0, 359), g = o.fix ? [100, 120] : [ri(80, 130), ri(100, 140)], ang = [k, k + g[0], k + g[0] + g[1]];
  const A = pol([0, 0], r * S, ang[0] + t), B = pol([0, 0], r * S, ang[1] + t), C = pol([0, 0], r * S, ang[2] + t), O = [0, 0];
  const P = { [a]: A, [b]: B, [c]: C, O };
  const f = { P, polys: [{ p: nm, c: COL.ink }], circles: [{ c: O, r: r * S, col: COL.g }], segs: [], len: [], ticks: [], rights: [], lines: [], ext: 0, maxW: 400, maxH: 300, colors: { O: COL.a }, aria: 'triangle et son cercle circonscrit' };
  if (o.med) for (const [p, q] of [[A, B], [B, C], [C, A]]) { const m = midp(p, q); f.lines.push({ a: O, b: m, c: COL.a, w: 2, arrows: false }); f.ticks.push({ a: p, b: m, n: 1 }, { a: m, b: q, n: 1 }); }
  for (const [x, s, col] of o.rad || []) f.segs.push({ a: O, b: P[x], c: col, w: 2.4 }), f.len.push({ a: O, b: P[x], s, side: 1, c: col, off: 14 });
  return { svg: figure(f), A, B, C, O, P };
}

export function L8(d) {
  const nm = names(d, 'ABC'), [a, b, c] = nm, t = orient(d);
  const forms = d < 1 ? ['nom'] : d < 2 ? ['nom', 'conc'] : d < 3 ? ['nom', 'conc', 'cercle', 'angle', 'moitie'] : ['nom', 'nom', 'conc', 'cercle', 'angle', 'moitie'];
  const f = pick(forms);
  if (f === 'nom') {
    const kind = pick(['haut', 'med', 'mdt']), obt = d >= 3 && kind === 'haut' ? ri(0, 1) === 1 : d >= 3 && ri(0, 3) === 0, vi = d < 1 ? 0 : ri(0, 2);
    const tri = rawTri(obt), sc = lineScene(nm, tri, t, kind, obt && kind === 'haut' ? 0 : vi);
    const side = `[${sc.nu}${sc.nw}]`;
    return choiceQ({
      opts: OPT, good: kind, html: `Dans le triangle ${a}${b}${c}, comment s'appelle la droite (d) tracée en orange ?`, visual: sc.svg,
      hint: kind === 'haut' ? `Regarde si (d) passe par un sommet et le petit carré (angle droit) qu'elle forme avec ${side}.` : kind === 'med' ? `Regarde si (d) passe par un sommet, et les petits traits qui partagent ${side} en deux parties égales.` : `Regarde si (d) passe par un sommet du triangle, puis les codages sur ${side} : petit carré et petits traits.`,
      solution: kind === 'haut' ? `(d) passe par le sommet ${sc.nv} et coupe la droite (${sc.nu}${sc.nw}) à angle droit (petit carré) : c'est la <b>hauteur</b> issue de ${sc.nv}.${obt ? ` Le triangle ayant un angle obtus, cette hauteur est à l'extérieur du triangle : le côté est prolongé.` : ''}`
        : kind === 'med' ? `(d) passe par le sommet ${sc.nv} et par le <b>milieu</b> de ${side} (petits traits égaux) : c'est la <b>médiane</b> issue de ${sc.nv}.` : `(d) ne passe pas par un sommet ; elle est perpendiculaire à ${side} (petit carré) et passe par son milieu (petits traits) : c'est la <b>médiatrice</b> de ${side}.`,
      msg: v => (kind === 'mdt' && v === 'haut' ? `La hauteur part d'un <b>sommet</b> ; ici (d) ne passe par aucun sommet.` : kind === 'med' && v === 'mdt' ? `La médiatrice est perpendiculaire au côté ; ici (d) passe par un sommet et par le milieu, sans angle droit.` : kind === 'haut' && v === 'med' ? `Une médiane passe par le <b>milieu</b> du côté ; ici le codage est un angle droit.` : ''),
      verify: E => E === classify(sc.L, sc.V, sc.U, sc.W),
    });
  }
  if (f === 'conc') {
    const r = ri(3, 7), sc = circScene(nm, r, t, { med: true });
    return choiceQ({
      opts: [{ v: 'mdt', l: '<b>des médiatrices</b>' }, { v: 'haut', l: '<b>des hauteurs</b>' }, { v: 'med', l: '<b>des médianes</b>' }], good: 'mdt',
      html: `Le cercle circonscrit à un triangle passe par ses trois sommets. Son centre O est le point de concours...`, visual: sc.svg,
      hint: `Le centre O est à la même distance (le rayon) des trois sommets ${a}, ${b} et ${c}. Quelle droite est formée des points équidistants des extrémités d'un côté ?`,
      solution: `O est équidistant de ${a}, ${b} et ${c} : il est sur la médiatrice de chaque côté. Le centre du cercle circonscrit est le point de concours des <b>médiatrices</b> du triangle.`,
      msg: v => (v === 'haut' ? `Les hauteurs se coupent aussi en un point, mais ce n'est pas le centre du cercle circonscrit en général.` : v === 'med' ? `Les médianes se coupent au centre de gravité, pas au centre du cercle circonscrit.` : ''),
      verify: E => E === 'mdt' && Math.abs(dist(sc.O, sc.A) - dist(sc.O, sc.B)) < 1e-9,
    });
  }
  if (f === 'cercle') {
    const r = d >= 3 ? ri(7, 24) / 2 : ri(3, 9), sc = circScene(nm, r, t, { rad: [[a, `O${a} = ${fr(r)} cm`, COL.a], [b, `O${b} = ?`, COL.g]] }), pr = pick([b, c]);
    void pr;
    return numQ({
      E: [r], tpl: `O${b} = {0} cm`, comma: true, html: `O est le centre du cercle circonscrit au triangle ${a}${b}${c}. On sait que O${a} = ${fr(r)} cm. Quelle est la longueur O${b} ?`, visual: sc.svg,
      hint: `O${a} et O${b} sont des rayons du même cercle (le cercle passe par ${a} et ${b}) : que peut-on dire de leurs longueurs ?`,
      solution: `Le cercle circonscrit passe par ${a}, ${b} et ${c}, et son centre est O : O${a}, O${b} et O${c} sont des rayons, donc O${b} = O${a} = <b>${fr(r)} cm</b>.`,
      msg: v => (v[0] === 2 * r ? `${fr(2 * r)} cm serait le diamètre ; O${b} est un rayon.` : ''), value: dist(sc.O, sc.B) / S,
    });
  }
  if (f === 'angle') {
    const obt = d >= 3 && ri(0, 1) === 1, tri = rawTri(obt), sc = lineScene(nm, tri, t, 'haut', obt ? 0 : ri(0, 2)), [pu, pw] = [sc.nu, sc.nw];
    const pts = { [sc.nv]: sc.V, [pu]: sc.U, [pw]: sc.W, H: sc.F };
    const mk = figure({
      P: pts, polys: [{ p: nm, c: COL.ink }], segs: [{ a: sc.V, b: sc.F, c: COL.a, w: 2.6 }, ...(obt ? [{ a: dist(sc.F, sc.U) < dist(sc.F, sc.W) ? sc.U : sc.W, b: sc.F, c: COL.ink, dash: true, w: 2 }] : [])], ext: 0, maxW: 440, maxH: 280, colors: { H: COL.a }, aria: 'triangle et sa hauteur',
    });
    return numQ({
      E: [90], tpl: `${'∠'}${sc.nv}H${pu} = {0} °`, keys: { neg: false }, html: `Dans le triangle ${a}${b}${c}, la droite (${sc.nv}H) est la hauteur issue de ${sc.nv} : H est sur la droite (${pu}${pw}). Quelle est la mesure de l'angle ${sc.nv}H${pu} ?`, visual: mk,
      hint: `(${sc.nv}H) est la hauteur issue de ${sc.nv} : par définition, comment (${sc.nv}H) coupe-t-elle la droite (${pu}${pw}) qui porte le côté opposé ?`,
      solution: `Une hauteur est perpendiculaire à la droite qui porte le côté opposé : (${sc.nv}H) ⊥ (${pu}${pw}), donc l'angle ${sc.nv}H${pu} est un angle droit : <b>90°</b>.`,
      value: angAt(sc.V, sc.F, sc.U), msg: v => (v[0] === 180 ? `180° serait un angle plat ; ici la hauteur coupe le côté à angle droit.` : ''),
    });
  }
  // moitié : médiane
  const bc = 2 * ri(2, d < 3 ? 6 : 10), back = d >= 3 && ri(0, 1) === 1, tri = rawTri(false), sc = lineScene(nm, tri, t, 'med', 0);
  const [nv, nu, nw] = [sc.nv, sc.nu, sc.nw];
  const mk = figure({
    P: { [nv]: sc.V, [nu]: sc.U, [nw]: sc.W, M: sc.M }, polys: [{ p: nm, c: COL.ink }], segs: [{ a: sc.V, b: sc.M, c: COL.a, w: 2.6 }], ticks: [{ a: sc.U, b: sc.M }, { a: sc.M, b: sc.W }],
    len: [{ a: sc.U, b: sc.W, s: back ? `${nu}${nw} = ?` : `${nu}${nw} = ${bc} cm`, side: -1, c: COL.b, off: 14 }, ...(back ? [{ a: sc.U, b: sc.M, s: `${nu}M = ${bc / 2} cm`, side: -1, c: COL.a, off: 14 }] : [])], ext: 0, maxW: 440, maxH: 280, colors: { M: COL.a }, aria: 'triangle et sa médiane',
  });
  const E = back ? bc : bc / 2;
  return numQ({
    E: [E], tpl: back ? `${nu}${nw} = {0} cm` : `${nu}M = {0} cm`, html: back ? `Dans le triangle ${a}${b}${c}, la droite (${nv}M) est la médiane issue de ${nv} : M est sur [${nu}${nw}]. On sait que ${nu}M = ${bc / 2} cm. Quelle est la longueur ${nu}${nw} ?` : `Dans le triangle ${a}${b}${c}, la droite (${nv}M) est la médiane issue de ${nv} : M est sur [${nu}${nw}]. On sait que ${nu}${nw} = ${bc} cm. Quelle est la longueur ${nu}M ?`,
    visual: mk, hint: back ? `(${nv}M) est une médiane : M est le milieu de [${nu}${nw}]. ${nu}M est donc la moitié de ${nu}${nw} : comment retrouver le côté entier ?` : `(${nv}M) est la médiane issue de ${nv} : M est le <b>milieu</b> de [${nu}${nw}]. Que vaut alors ${nu}M par rapport à ${nu}${nw} ?`,
    solution: back ? `M est le milieu de [${nu}${nw}] (médiane) : ${nu}${nw} = 2 × ${nu}M = 2 × ${bc / 2} = <b>${bc} cm</b>.` : `M est le milieu de [${nu}${nw}] car (${nv}M) est une médiane : ${nu}M = ${nu}${nw} ÷ 2 = ${bc} ÷ 2 = <b>${bc / 2} cm</b>.`,
    msg: v => (back ? (v[0] === bc / 2 ? `${bc / 2} cm n'est que la moitié du côté : ${nu}${nw} est le double.` : '') : (v[0] === bc ? `C'est la longueur du côté entier ; M le partage en deux.` : '')),
    value: back ? dist(sc.U, sc.W) / dist(sc.U, sc.M) * (bc / 2) : dist(sc.U, sc.M) / dist(sc.U, sc.W) * bc,
  });
}

export function C8() {
  const nm = ['A', 'B', 'C'], T = { A: [2.2, 3], B: [0, 0], C: [5, 0] }, Ob = { A: [7.2, 2.6], B: [0, 0], C: [5, 0] };
  const sH = lineScene(nm, T, 0, 'haut', 0).svg, sM = lineScene(nm, T, 0, 'med', 0).svg, sD = lineScene(nm, T, 0, 'mdt', 0).svg, sO = lineScene(nm, Ob, 0, 'haut', 0).svg;
  const cc = circScene(nm, 4, 0, { med: true, fix: true }), cr = circScene(nm, 4, 0, { fix: true, rad: [['A', 'OA = 4 cm', COL.a], ['B', 'OB = ?', COL.g]] });
  const hAngle = figure({ P: { A: T.A, B: T.B, C: T.C, H: [T.A[0], 0] }, polys: [{ p: nm, c: COL.ink }], segs: [{ a: T.A, b: [T.A[0], 0], c: COL.a }], rights: [{ v: 'H', a: 'A', b: 'C', size: 12 }], ext: 0, maxW: 360, colors: { H: COL.a }, aria: 'hauteur' });
  const mm = figure({ P: { A: T.A, B: T.B, C: T.C, M: [2.5, 0] }, polys: [{ p: nm, c: COL.ink }], segs: [{ a: T.A, b: [2.5, 0], c: COL.a }], ticks: [{ a: T.B, b: [2.5, 0] }, { a: [2.5, 0], b: T.C }], len: [{ a: T.B, b: T.C, s: 'BC = 10 cm', side: -1, c: COL.b, off: 14 }], ext: 0, maxW: 360, colors: { M: COL.a }, aria: 'médiane' });
  return cours('8. Droites remarquables du triangle', `Dans un triangle, trois sortes de droites sont particulières. Il faut savoir les reconnaître sur une figure grâce à leurs <b>codages</b> et à leur place.`,
    def(`• La <b>hauteur</b> issue d'un sommet est la droite qui passe par ce sommet et est <b>perpendiculaire</b> au côté opposé (angle droit codé).<br>• La <b>médiane</b> issue d'un sommet est la droite qui passe par ce sommet et par le <b>milieu</b> du côté opposé.<br>• La <b>médiatrice</b> d'un côté est la droite <b>perpendiculaire</b> à ce côté en son <b>milieu</b> ; elle ne passe pas forcément par le sommet opposé.<br>Les trois médiatrices se coupent en un point, le <b>centre du cercle circonscrit</b> (cercle qui passe par les trois sommets).`),
    meth(`Passe-t-elle par un <b>sommet</b> ? Si oui : hauteur ou médiane ; sinon, c'est une médiatrice.`, `Regarde le codage sur le côté coupé : petit carré (angle droit), petits traits égaux (milieu).`, `Carré seul → hauteur ; traits égaux seuls → médiane ; carré et traits → médiatrice (ou hauteur-médiane si isocèle).`),
    cols(sH, sM),
    ex(`Exemple 1 : comment s'appelle la droite (d) qui passe par A et forme un angle droit avec [BC] ?`, `(d) passe par le sommet A et coupe (BC) à angle droit (petit carré) : c'est la <b>hauteur</b> issue de A.<br>${rep('une hauteur')}`),
    ex(`Exemple 2 : la droite (d) passe par A et par le milieu de [BC] (petits traits égaux)`, `Elle passe par le sommet et par le milieu du côté opposé : c'est la <b>médiane</b> issue de A.<br>${rep('une médiane')}`),
    sD,
    ex(`Exemple 3 : la droite (d) ne passe pas par un sommet, avec un carré et des traits égaux sur [BC]`, `Perpendiculaire à [BC] en son milieu, mais sans passer par A : c'est la <b>médiatrice</b> de [BC].<br>${rep('une médiatrice')}`),
    sO,
    ex(`Exemple 4 : hauteur à l'extérieur du triangle (angle obtus en C)`, `Quand le triangle a un angle obtus, le pied de la hauteur est sur le <b>prolongement</b> du côté, à l'extérieur du triangle : on prolonge le côté (pointillés) pour tracer l'angle droit. C'est quand même la <b>hauteur</b> issue de A.<br>${rep('une hauteur')}`),
    cc.svg,
    ex(`Exemple 5 : le centre du cercle circonscrit est le point de concours des...`, `Le centre O est à égale distance de A, B et C, donc sur la médiatrice de chaque côté : c'est le point de concours des <b>médiatrices</b>.<br>${rep('des médiatrices')}`),
    cr.svg,
    ex(`Exemple 6 : O est le centre du cercle circonscrit, OA = 4 cm, quelle est la longueur OB ?`, `OA et OB sont deux rayons du même cercle : OB = OA.<br>${rep('OB = 4 cm')}`),
    hAngle,
    ex(`Exemple 7 : (AH) est la hauteur issue de A, quelle est la mesure de l'angle AHB ?`, `Une hauteur est perpendiculaire au côté opposé : l'angle AHB est droit (même si le pied H est à l'extérieur du triangle, quand un angle est obtus).<br>${rep('∠AHB = 90 °')}`),
    mm,
    ex(`Exemple 8 : (AM) est la médiane issue de A, BC = 10 cm, quelle est la longueur BM ? (et inversement : BM = 5 cm, quelle est la longueur BC ?)`, `M est le milieu de [BC] : BM = BC ÷ 2 = 5 cm. Dans l'autre sens, BC = 2 × BM = 2 × 5 = 10 cm.<br>${rep('BM = 5 cm ; BC = 10 cm')}`),
    warn(`Médiane ≠ médiatrice : la médiane passe par un sommet et un milieu, la médiatrice est perpendiculaire en un milieu.`, `Un triangle a trois hauteurs, trois médianes et trois médiatrices : précise toujours « issue de ... » ou « de [BC] ».`, `La hauteur peut être à l'extérieur du triangle (angle obtus).`),
    retenir(`hauteur : sommet + angle droit ; médiane : sommet + milieu ; médiatrice : angle droit + milieu ; le cercle circonscrit est centré au point de concours des médiatrices.`));
}
void shuffle; void NOMS;

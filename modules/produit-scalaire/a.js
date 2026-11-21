// Niveaux 1 à 3 : produit scalaire par la projection orthogonale ; formule avec le cosinus ; expression analytique.
import {
  ri, pick, nz, shuffle, chance, M, P, niveau, rNums, rChoice, V, dot, norm, vc, pt, cp, nw, big, kRac, fois, NOMS3, NOMS_V,
  TRIPLES, sc, vec, n2, sqrtInt, plus, calcAn,
} from './outils.js';
import { fig, COL } from './draw.js';

const vn = (A, B) => V(A + B);
const pm = x => (x < 0 ? '−' : '');
const mesure = (nom, v) => `${nom} = ${v}`;

/* =====================================================================================================
   Niveau 1 : projection orthogonale
   ===================================================================================================== */
/**
 * Figure : A, B sur une droite horizontale, C au-dessus, H projeté de C sur (AB).
 * a = AB, h = AH signé (négatif : H du côté de A opposé à B), hc = HC, o = ±1 (miroir)
 * lab : mesures écrites ; ahTxt : texte de AH (« ? » pour une inconnue)
 */
function figProj({ nm, a, h, hc, ac, o = 1, lab = ['ab', 'ah'], ahTxt }) {
  const [A, B, C] = nm, xB = o * a, xH = o * h;
  const lo = Math.min(0, xB, xH) - 0.7, hi = Math.max(0, xB, xH) + 0.7;
  const seg = (x1, x2, text, dist) => ({ a: [Math.min(x1, x2), 0], b: [Math.max(x1, x2), 0], inv: true, lab: text, side: -1, dist });
  const segs = [{ a: [lo, 0], b: [hi, 0], c: COL.h, w: 1.8, dash: true }, { a: [xH, 0], b: [xH, hc], c: COL.h, dash: true, w: 2.2 }];
  if (lab.includes('ah')) segs.push(seg(0, xH, `${A}H = ${ahTxt || M(Math.abs(h))}`, 33));
  if (lab.includes('ab')) segs.push(seg(0, xB, `${A}${B} = ${M(a)}`, 57));
  if (lab.includes('ac')) segs.push({ a: [0, 0], b: [xH, hc], inv: true, lab: `${A}${C} = ${M(ac)}`, c: COL.v });
  if (lab.includes('hc')) segs.push({ a: [xH, 0], b: [xH, hc], inv: true, lab: `H${C} = ${M(hc)}`, c: COL.h });
  return fig({
    aria: `figure : ${A}, ${B}, ${C} et le projeté H de ${C} sur la droite (${A}${B})`, padb: 62, H: 330,
    pts: [{ x: 0, y: 0, l: A, pos: 's' }, { x: xB, y: 0, l: B, pos: 's' }, { x: xH, y: hc, l: C, pos: 'n' }, { x: xH, y: 0, l: 'H', pos: 's', c: COL.h }],
    vecs: [{ x: 0, y: 0, dx: xB, dy: 0, c: COL.u }, { x: 0, y: 0, dx: xH, dy: hc, c: COL.v }],
    segs, right: [{ at: [xH, 0], u: [0, 1], v: [-Math.sign(xH), 0] }], center: [(xB + xH) / 2, hc / 2],
  });
}

/** tirage commun : triplet pythagoricien (AH, HC, AC) et longueur AB */
function tirageProj(d, signe) {
  const t = pick(TRIPLES.slice(0, d >= 3 ? 8 : 5));
  const k = d >= 3 && t[0] % 3 === 0 && chance(0.4) ? 0.5 : 1;
  const [x, y] = chance(0.5) ? [t[0], t[1]] : [t[1], t[0]];
  const ah = x * k, hc = y * k, ac = t[2] * k;
  const a = pick(d >= 2 ? [3, 4, 5, 6, 7, 8, 9, 10] : [2, 3, 4, 5, 6, 7]);
  return { nm: pick(NOMS3), a, ah, hc, ac, o: pick([1, -1]), s: signe, show: d >= 1 && chance(0.5) };
}

const prMeme = {
  id: 'pr-meme', dmin: 0, titre: 'projeté du même sens que AB',
  draw: d => tirageProj(d, 1),
  ex: { nm: ['A', 'B', 'C'], a: 7, ah: 3, hc: 4, ac: 5, o: 1, s: 1, show: false },
  build({ nm, a, ah, hc, ac, o, show }) {
    const [A, B, C] = nm, AB = vn(A, B), AC = vn(A, C), AH = vn(A, 'H'), p = a * ah;
    const lab = show ? ['ab', 'ah', 'ac', 'hc'] : ['ab', 'ah'];
    return {
      html: `Dans la figure, H est le projeté orthogonal de ${C} sur la droite (${A}${B}).<br>On donne ${A}${B} = ${M(a)} et ${A}H = ${M(ah)}${show ? `, ${A}${C} = ${M(ac)} et H${C} = ${M(hc)}` : ''}.<br>Calcule ${dot(AB, AC)}.`,
      visual: figProj({ nm, a, h: ah, hc, ac, o, lab }),
      ...rNums([p], { tpl: `${dot(AB, AC)} = {0}`, value: a * ah }),
      hint: `Remplace ${C} par son projeté H : ${dot(AB, AC)} = ${dot(AB, AH)}. Ici ${A}${B} = ${M(a)} et ${A}H = ${M(ah)} : regarde si les vecteurs ${AB} et ${AH} vont dans le même sens ou dans des sens contraires, puis multiplie les deux longueurs avec le bon signe.`,
      solution: `H est le projeté orthogonal de ${C} sur (${A}${B}), donc ${dot(AB, AC)} = ${dot(AB, AH)}. H est sur la demi-droite [${A}${B}) : les vecteurs ${AB} et ${AH} ont le même sens, donc ${dot(AB, AH)} = ${A}${B} × ${A}H = ${M(a)} × ${M(ah)} = ${M(p)}.`,
    };
  },
};

const prContraire = {
  id: 'pr-contraire', dmin: 1, titre: 'projeté de sens contraire',
  draw: d => tirageProj(d, -1),
  ex: { nm: ['A', 'B', 'C'], a: 6, ah: 4, hc: 3, ac: 5, o: 1, s: -1, show: false },
  build({ nm, a, ah, hc, ac, o, show }) {
    const [A, B, C] = nm, AB = vn(A, B), AC = vn(A, C), AH = vn(A, 'H'), p = -a * ah;
    const lab = show ? ['ab', 'ah', 'ac', 'hc'] : ['ab', 'ah'];
    return {
      html: `Dans la figure, H est le projeté orthogonal de ${C} sur la droite (${A}${B}).<br>On donne ${A}${B} = ${M(a)} et ${A}H = ${M(ah)}${show ? `, ${A}${C} = ${M(ac)} et H${C} = ${M(hc)}` : ''}.<br>Calcule ${dot(AB, AC)}.`,
      visual: figProj({ nm, a, h: -ah, hc, ac, o, lab }),
      ...rNums([p], { tpl: `${dot(AB, AC)} = {0}`, value: -a * ah, msg: v => (v[0] === a * ah ? '⚠️ La valeur est bonne, mais le signe non : H est de l’autre côté de ' + A + ' que ' + B + ', donc les vecteurs sont de sens contraires.' : '') }),
      hint: `Remplace ${C} par son projeté H : ${dot(AB, AC)} = ${dot(AB, AH)}. Sur la figure, regarde de quel côté de ${A} se trouve H : ${AB} a pour longueur ${M(a)} et ${AH} a pour longueur ${M(ah)} ; le sens de chacun décide du signe.`,
      solution: `H est le projeté orthogonal de ${C} sur (${A}${B}), donc ${dot(AB, AC)} = ${dot(AB, AH)}. H est de l’autre côté de ${A} que ${B} : les vecteurs ${AB} et ${AH} ont des sens contraires, donc ${dot(AB, AH)} = −${A}${B} × ${A}H = −${M(a)} × ${M(ah)} = −${M(a * ah)}.`,
    };
  },
};

const prQcm = {
  id: 'pr-qcm', dmin: 1, titre: 'choisir parmi des valeurs possibles',
  draw(d) { const t = tirageProj(d, pick([1, -1])); t.show = true; return t; },
  ex: { nm: ['A', 'B', 'C'], a: 7, ah: 5, hc: 12, ac: 13, o: 1, s: -1, show: true },
  build({ nm, a, ah, hc, ac, o, s }) {
    const [A, B, C] = nm, AB = vn(A, B), AC = vn(A, C), p = s * a * ah;
    const items = [
      { l: M(p), ok: true },
      { l: M(-p), why: `Le signe est faux : regarde de quel côté de ${A} se trouve H par rapport à ${B}.` },
      { l: M(s * a * ac), why: `Tu as utilisé ${A}${C} : ce n’est pas la longueur du projeté. Il faut ${A}H, la longueur de ${A} à H.` },
      { l: M(s * a * hc), why: `H${C} est la distance de ${C} à la droite (${A}${B}), pas la longueur du projeté : il faut ${A}H.` },
    ];
    return {
      html: `Dans la figure, H est le projeté orthogonal de ${C} sur la droite (${A}${B}). On donne ${A}${B} = ${M(a)}, ${A}${C} = ${M(ac)}, ${A}H = ${M(ah)} et H${C} = ${M(hc)}.<br>Quelle est la valeur de ${dot(AB, AC)} ?`,
      visual: figProj({ nm, a, h: s * ah, hc, ac, o, lab: ['ab', 'ah', 'ac', 'hc'] }),
      ...rChoice(items, { indep: M(p) }),
      hint: `Seule la longueur ${A}H compte (pas ${A}${C} ni H${C}) : ${dot(AB, AC)} = ${dot(AB, vn(A, 'H'))}. Ici ${A}H = ${M(ah)} et ${A}${B} = ${M(a)} ; regarde si H est du même côté de ${A} que ${B}.`,
      solution: `${dot(AB, AC)} = ${dot(AB, vn(A, 'H'))}. ${s > 0 ? `H est du même côté de ${A} que ${B} : le produit est positif, ${A}${B} × ${A}H = ${M(a)} × ${M(ah)} = ${M(a * ah)}` : `H est de l’autre côté de ${A} que ${B} : le produit est négatif, −${A}${B} × ${A}H = −${M(a)} × ${M(ah)} = −${M(a * ah)}`}. Les longueurs ${A}${C} et H${C} ne servent pas.`,
    };
  },
};

/** quadrillage : A, B alignés horizontalement (ou verticalement), C quelconque */
function figQuad(nm, A, B, C, o) {
  const [nA, nB, nC] = nm, T = ([x, y]) => (o.vert ? [y, x] : [x, y]);
  const a = T(A), b = T(B), c = T(C), h = T([C[0], A[1]]);
  return fig({
    grid: true, aria: `quadrillage avec les points ${nA}, ${nB} et ${nC}`, H: 300,
    pts: [{ x: a[0], y: a[1], l: nA }, { x: b[0], y: b[1], l: nB }, { x: c[0], y: c[1], l: nC }, ...(o.h ? [{ x: h[0], y: h[1], l: 'H', c: COL.h }] : [])],
    vecs: [{ x: a[0], y: a[1], dx: b[0] - a[0], dy: b[1] - a[1], c: COL.u }, { x: a[0], y: a[1], dx: c[0] - a[0], dy: c[1] - a[1], c: COL.v }],
    segs: o.h ? [{ a: c, b: h, c: COL.h, dash: true, w: 2.2 }] : [],
    right: o.h ? [{ at: h, u: o.vert ? [1, 0] : [0, -Math.sign(c[1] - h[1])], v: o.vert ? [0, Math.sign(a[1] - h[1]) || 1] : [Math.sign(a[0] - h[0]) || 1, 0] }] : [],
    center: [(a[0] + b[0] + c[0]) / 3, (a[1] + b[1] + c[1]) / 3],
  });
}
const prQuad = {
  id: 'pr-quad', dmin: 2, titre: 'lire sur un quadrillage',
  draw() {
    let ab, cx;
    do { ab = nz(-6, 6); cx = nz(-4, 6); } while (Math.abs(ab) < 3 || cx === ab);
    return { nm: pick(NOMS3), xa: ri(0, 2), ya: ri(0, 2), ab, cx, cy: nz(-3, 4), vert: chance(0.4) };
  },
  ex: { nm: ['A', 'B', 'C'], xa: 1, ya: 1, ab: 5, cx: -2, cy: 3, vert: false },
  build({ nm, xa, ya, ab, cx, cy, vert }) {
    const [A, B, C] = nm, AB = vn(A, B), AC = vn(A, C), AH = vn(A, 'H');
    const PA = [xa, ya], PB = [xa + ab, ya], PC = [xa + cx, ya + (cy === 0 ? 1 : cy)];
    const ahv = PC[0] - PA[0], same = ahv * ab > 0, p = ab * ahv;
    const lg = Math.abs(ab), lh = Math.abs(ahv);
    return {
      html: `Sur ce quadrillage (le côté d’un carreau vaut 1), calcule ${dot(AB, AC)}.`,
      visual: figQuad(nm, PA, PB, PC, { vert }),
      afterVisual: figQuad(nm, PA, PB, PC, { vert, h: true }),
      ...rNums([p], { tpl: `${dot(AB, AC)} = {0}`, value: p }),
      hint: `Les vecteurs ${AB} et ${AC} partent du même point ${A}. Sur ce quadrillage, compte les carreaux de ${A} à ${B}, puis de ${A} au pied de la perpendiculaire menée de ${C} à la droite (${A}${B}) ; regarde si les deux déplacements vont dans le même sens.`,
      solution: `Le projeté orthogonal de ${C} sur (${A}${B}) est le point H au pied de la perpendiculaire (figure ci-dessous). On compte ${A}${B} = ${M(lg)} carreaux et ${A}H = ${M(lh)} carreaux. ${same ? `${AB} et ${AH} ont le même sens : ${dot(AB, AC)} = ${A}${B} × ${A}H = ${M(lg)} × ${M(lh)} = ${M(p)}.` : `${AB} et ${AH} ont des sens contraires : ${dot(AB, AC)} = −${A}${B} × ${A}H = −${M(lg)} × ${M(lh)} = −${M(lg * lh)}.`}`,
    };
  },
};

function figDeux({ a, xc, yc, xd, yd }) {
  const lo = Math.min(0, a, xc, xd) - 0.7, hi = Math.max(0, a, xc, xd) + 0.7, m = Math.abs(xd - xc);
  const l = Math.min(xc, xd), r = Math.max(xc, xd);
  return fig({
    aria: 'figure : segment AB et les projetés C′ et D′ de C et D sur la droite (AB)', padb: 62, H: 330,
    pts: [{ x: 0, y: 0, l: 'A', pos: 's' }, { x: a, y: 0, l: 'B', pos: 's' }, { x: xc, y: yc, l: 'C', pos: 'n' }, { x: xd, y: yd, l: 'D', pos: 'n' }, { x: xc, y: 0, l: 'C′', pos: 's', c: COL.h }, { x: xd, y: 0, l: 'D′', pos: 's', c: COL.h }],
    segs: [{ a: [lo, 0], b: [hi, 0], c: COL.h, w: 1.8, dash: true }, { a: [xc, 0], b: [xc, yc], c: COL.h, dash: true, w: 2.2 }, { a: [xd, 0], b: [xd, yd], c: COL.h, dash: true, w: 2.2 },
      { a: [0, 0], b: [a, 0], inv: true, lab: `AB = ${M(a)}`, side: -1, dist: 56 }, { a: [l, 0], b: [r, 0], inv: true, lab: `C′D′ = ${M(m)}`, side: -1, dist: 32 }],
    vecs: [{ x: 0, y: 0, dx: a, dy: 0, c: COL.u }, { x: xc, y: yc, dx: xd - xc, dy: yd - yc, c: COL.v }],
    right: [{ at: [xc, 0], u: [0, 1], v: [Math.sign(xd - xc), 0] }, { at: [xd, 0], u: [0, 1], v: [-Math.sign(xd - xc), 0] }], center: [a / 2, 1.5],
  });
}
const prDeux = {
  id: 'pr-deux', dmin: 3, titre: 'projeter deux points (AB · CD)',
  draw() {
    const a = ri(3, 8); let xc, xd;
    do { xc = ri(-1, a + 1); xd = ri(-1, a + 1); } while (xc === xd);
    return { a, xc, xd, yc: ri(1, 3), yd: ri(1, 3) };
  },
  ex: { a: 6, xc: 1, xd: 5, yc: 2, yd: 1 },
  build({ a, xc, xd, yc, yd }) {
    const m = Math.abs(xd - xc), same = xd > xc, p = (same ? 1 : -1) * a * m, AB = vn('A', 'B'), CD = vn('C', 'D');
    return {
      html: `C′ et D′ sont les projetés orthogonaux de C et D sur la droite (AB). On donne AB = ${M(a)} et C′D′ = ${M(m)}.<br>Calcule ${dot(AB, CD)}.`,
      visual: figDeux({ a, xc, yc, xd, yd }),
      ...rNums([p], { tpl: `${dot(AB, CD)} = {0}`, value: p }),
      hint: `Projeter ${CD} sur la droite (AB) donne le vecteur ${vn('C′', 'D′')} : ${dot(AB, CD)} = ${dot(AB, vn('C′', 'D′'))}. Compare le sens de ${vn('C′', 'D′')} (longueur ${M(m)}) à celui de ${AB} (longueur ${M(a)}) sur la figure.`,
      solution: `Les projetés de C et D sur (AB) sont C′ et D′, donc ${dot(AB, CD)} = ${dot(AB, vn('C′', 'D′'))}. ${same ? `Les vecteurs ${AB} et ${vn('C′', 'D′')} vont dans le même sens : ${dot(AB, CD)} = AB × C′D′ = ${M(a)} × ${M(m)} = ${M(p)}.` : `Les vecteurs ${AB} et ${vn('C′', 'D′')} vont dans des sens contraires : ${dot(AB, CD)} = −AB × C′D′ = −${M(a)} × ${M(m)} = ${M(p)}.`}`,
    };
  },
};

const prInverse = {
  id: 'pr-inverse', dmin: 4, titre: 'retrouver la longueur du projeté',
  draw(d) { const t = tirageProj(d, pick([1, -1])); return t; },
  ex: { nm: ['A', 'B', 'C'], a: 6, ah: 4, hc: 3, ac: 5, o: 1, s: -1, show: false },
  build({ nm, a, ah, hc, o, s }) {
    const [A, B, C] = nm, AB = vn(A, B), AC = vn(A, C), p = s * a * ah;
    return {
      html: `Dans la figure, H est le projeté orthogonal de ${C} sur la droite (${A}${B}), avec ${A}${B} = ${M(a)} et ${dot(AB, AC)} = ${M(p)}.<br>Calcule la longueur ${A}H.`,
      visual: figProj({ nm, a, h: s * ah, hc, o, lab: ['ab', 'ah'], ahTxt: '?' }),
      ...rNums([ah], { tpl: `${A}H = {0}`, value: ah, msg: v => (v[0] === -ah ? '⚠️ Une longueur est toujours positive : le signe de ' + dot(AB, AC) + ' dit seulement dans quel sens va H.' : '') }),
      hint: `On a ${dot(AB, AC)} = ${dot(AB, vn(A, 'H'))} = ${s > 0 ? '' : '−'}${A}${B} × ${A}H, avec ${A}${B} = ${M(a)} et ${dot(AB, AC)} = ${M(p)} : divise pour trouver ${A}H.`,
      solution: `${dot(AB, AC)} = ${dot(AB, vn(A, 'H'))}. ${s > 0 ? `Le produit est positif : ${AB} et ${vn(A, 'H')} ont le même sens, donc ${dot(AB, AC)} = ${A}${B} × ${A}H, soit ${M(p)} = ${M(a)} × ${A}H.` : `Le produit est négatif : ${AB} et ${vn(A, 'H')} ont des sens contraires, donc ${dot(AB, AC)} = −${A}${B} × ${A}H, soit ${M(p)} = −${M(a)} × ${A}H.`} Alors ${A}H = ${M(Math.abs(p))} ÷ ${M(a)} = ${M(ah)}.`,
    };
  },
};

const F1 = [prMeme, prContraire, prQcm, prQuad, prDeux, prInverse];
const figCours1 = (h, nm = ['A', 'B', 'C']) => figProj({ nm, a: 6, h, hc: 3, lab: ['ab', 'ah'] });
export const LV1 = niveau('Projection orthogonale', F1, {
  n: 1,
  intro: 'Le produit scalaire de deux vecteurs est un nombre. Premier outil : projeter un vecteur sur l’autre, puis multiplier deux longueurs.',
  def: `Soit ${vn('A', 'B')} et ${vn('A', 'C')} deux vecteurs, et H le <b>projeté orthogonal</b> de C sur la droite (AB).<br><b>${dot(vn('A', 'B'), vn('A', 'C'))} = ${dot(vn('A', 'B'), vn('A', 'H'))}</b><br>• si ${vn('A', 'B')} et ${vn('A', 'H')} ont le <b>même sens</b> : le produit vaut <b>AB × AH</b> ;<br>• si leurs sens sont <b>contraires</b> : le produit vaut <b>−AB × AH</b>.`,
  visuel: `<div class="cols">${figCours1(3.5)}${figCours1(-2)}</div><p class="note">À gauche, H est du même côté de A que B : produit positif. À droite, H est de l’autre côté : produit négatif.</p>`,
  methode: ['Trace (ou repère) le <b>projeté orthogonal</b> H de C sur la droite (AB) : CH est perpendiculaire à (AB).', `Remplace ${vn('A', 'C')} par ${vn('A', 'H')} : seul compte le déplacement le long de (AB).`, 'Regarde le <b>sens</b> : AB et AH vers le même côté → signe +, vers des côtés opposés → signe −.', 'Multiplie les longueurs AB et AH (jamais AC ni HC).'],
  warn: ['C’est la longueur <b>AH</b> qui compte, pas AC ni HC.', 'Le signe vient du sens des vecteurs : si H est de l’autre côté de A, le produit est négatif.', 'Si H = A (angle droit), le produit est nul.'],
  retenir: `${dot(vn('A', 'B'), vn('A', 'C'))} = ± AB × AH, avec + si ${vn('A', 'B')} et ${vn('A', 'H')} ont le même sens, − sinon.`,
});

/* =====================================================================================================
   Niveau 2 : formule avec le cosinus
   ===================================================================================================== */
const COS = { 0: [1, 'cos 0° = 1'], 60: [0.5, 'cos 60° = 0,5'], 90: [0, 'cos 90° = 0'], 120: [-0.5, 'cos 120° = −0,5'], 180: [-1, 'cos 180° = −1'] };
const COSTXT = { 0: '1', 60: '0,5', 90: '0', 120: '−0,5', 180: '−1', 45: '√2 ÷ 2', 135: '−√2 ÷ 2', 30: '√3 ÷ 2', 150: '−√3 ÷ 2' };

/** deux vecteurs issus de O, d'angle th (degrés) ; la, lb : longueurs réelles (dessinées), ta, tb : textes */
function figAngle({ la, lb, th, ta, tb, nu = 'u', nv = 'v', mir = 1 }) {
  const s = mir, ang = th * s;
  const vx = lb * Math.cos(ang * Math.PI / 180), vy = lb * Math.sin(ang * Math.PI / 180);
  const arcs = th > 0 && th < 180 ? [{ at: [0, 0], a1: s > 0 ? 0 : -th, a2: s > 0 ? th : 0, r: 28, lab: `${th}°` }] : [];
  const segs = th === 90 ? [] : [];
  return fig({
    aria: `deux vecteurs ${nu} et ${nv} issus du même point, formant un angle de ${th} degrés`, H: 290, padt: 10, padb: 14,
    pts: [{ x: 0, y: 0, l: 'O', pos: 'sw' }],
    vecs: [{ x: 0, y: 0, dx: la, dy: 0, c: COL.u }, { x: 0, y: 0, dx: vx, dy: vy, c: COL.v }],
    segs: [
      { a: [0, 0], b: [la, 0], inv: true, lab: `‖{${nu}}‖ = ${ta}`, side: s > 0 ? -1 : 1, dist: 18, lc: COL.u },
      { a: [0, 0], b: [vx, vy], inv: true, lab: `‖{${nv}}‖ = ${tb}`, side: th > 90 || th === 0 ? (s > 0 ? 1 : -1) : 1 * s > 0 ? 1 : -1, dist: 14, lc: COL.v },
    ].concat(segs),
    arcs, right: th === 90 ? [{ at: [0, 0], u: [1, 0], v: [0, s] }] : [], center: [0, 0],
  });
}

const cosSimple = {
  id: 'cs-simple', dmin: 0, titre: 'angle remarquable, normes entières',
  draw(d) { return { a: ri(2, 9), b: ri(2, 9), th: pick(d < 1 ? [0, 60, 90, 120, 180].filter(t => t !== 90) : [0, 60, 90, 120, 180]), nv: pick(NOMS_V), mir: pick([1, -1]) }; },
  ex: { a: 4, b: 5, th: 60, nv: ['u', 'v'], mir: 1 },
  build({ a, b, th, nv, mir }) {
    const [u, v] = nv, p = a * b * COS[th][0];
    const U = V(u), W = V(v);
    const calc = th === 90 ? `${dot(U, W)} = ${norm(u)} × ${norm(v)} × cos 90° = ${M(a)} × ${M(b)} × 0 = 0` : `${dot(U, W)} = ${norm(u)} × ${norm(v)} × cos ${th}° = ${M(a)} × ${M(b)} × ${P(COS[th][0])} = ${M(a * b)} × ${P(COS[th][0])} = ${M(p)}`;
    return {
      html: `Les vecteurs ${U} et ${W} vérifient ${norm(u)} = ${M(a)} et ${norm(v)} = ${M(b)}, et l’angle entre ${U} et ${W} mesure ${th}°.<br>Calcule ${dot(U, W)}.`,
      visual: figAngle({ la: a, lb: b, th, ta: M(a), tb: M(b), nu: u, nv: v, mir }),
      ...rNums([p], { tpl: `${dot(U, W)} = {0}`, value: a * b * Math.cos(th * Math.PI / 180) }),
      hint: `Applique ${dot(U, W)} = ${norm(u)} × ${norm(v)} × cos θ avec ${norm(u)} = ${M(a)}, ${norm(v)} = ${M(b)} et θ = ${th}° : cherche la valeur de cos ${th}°.`,
      solution: `On utilise la formule avec le cosinus, et ${COS[th][1]}. ${calc}.`,
    };
  },
};

/** triangle ABC (côtés AB = c, AC = b, angle en A) : lengths c et b données en texte tc, tb ; vrai c, b pour le dessin */
function figTriangle(nm, c, b, th, tc, tb) {
  const [A, B, C] = nm, r = th * Math.PI / 180, P2 = [b * Math.cos(r), b * Math.sin(r)];
  return fig({
    aria: `triangle ${A}${B}${C} avec un angle de ${th} degrés en ${A}`, H: 290, padb: 26, padt: 6,
    pts: [{ x: 0, y: 0, l: A, pos: 'sw' }, { x: c, y: 0, l: B, pos: 'se' }, { x: P2[0], y: P2[1], l: C, pos: 'n' }],
    poly: [[0, 0], [c, 0], P2], vecs: [{ x: 0, y: 0, dx: c, dy: 0, c: COL.u }, { x: 0, y: 0, dx: P2[0], dy: P2[1], c: COL.v }],
    segs: [{ a: [c, 0], b: P2, c: '#495057' },
      { a: [0, 0], b: [c, 0], inv: true, lab: `${A}${B} = ${tc}`, side: -1, dist: 14, lc: COL.u },
      { a: [0, 0], b: P2, inv: true, lab: `${A}${C} = ${tb}`, side: 1, dist: 14, lc: COL.v }],
    arcs: th === 90 ? [] : [{ at: [0, 0], a1: 0, a2: th, r: 24, lab: `${th}°` }], right: th === 90 ? [{ at: [0, 0], u: [1, 0], v: [0, 1] }] : [], center: [(c + P2[0]) / 3, P2[1] / 3],
  });
}

const cosTri = {
  id: 'cs-triangle', dmin: 1, titre: 'dans un triangle',
  draw() { return { nm: pick(NOMS3), c: ri(3, 9), b: ri(3, 9), th: pick([60, 90, 120]) }; },
  ex: { nm: ['A', 'B', 'C'], c: 6, b: 4, th: 120 },
  build({ nm, c, b, th }) {
    const [A, B, C] = nm, AB = vn(A, B), AC = vn(A, C), co = COS[th][0], p = c * b * co;
    return {
      html: `Dans le triangle ${A}${B}${C}, on a ${A}${B} = ${M(c)}, ${A}${C} = ${M(b)} et l’angle ${B}${A}${C} mesure ${th}°.<br>Calcule ${dot(AB, AC)}.`,
      visual: figTriangle(nm, c, b, th, M(c), M(b)),
      ...rNums([p], { tpl: `${dot(AB, AC)} = {0}`, value: c * b * Math.cos(th * Math.PI / 180) }),
      hint: `Les deux vecteurs ${AB} et ${AC} partent de ${A} : ${dot(AB, AC)} = ${A}${B} × ${A}${C} × cos(${B}${A}${C}), avec ${A}${B} = ${M(c)}, ${A}${C} = ${M(b)} et un angle de ${th}°.`,
      solution: `Les deux vecteurs partent de ${A}, donc ${dot(AB, AC)} = ${A}${B} × ${A}${C} × cos ${th}° (${COS[th][1]}). ${th === 90 ? `On obtient ${M(c)} × ${M(b)} × 0 = 0.` : `On obtient ${M(c)} × ${M(b)} × ${P(co)} = ${M(c * b)} × ${P(co)} = ${M(p)}.`}`,
    };
  },
};

const cosSigne = {
  id: 'cs-signe', dmin: 1, titre: 'signe du produit scalaire',
  draw() { return { nv: pick(NOMS_V), th: pick([20, 30, 45, 55, 70, 85, 95, 110, 125, 140, 160, 175, 90, 90]), a: ri(2, 9), b: ri(2, 9) }; },
  ex: { nv: ['u', 'v'], th: 125, a: 3, b: 4 },
  build({ nv, th, a, b }) {
    const [u, v] = nv, U = V(u), W = V(v), s = th < 90 ? 0 : th === 90 ? 2 : 1;
    const items = [
      { l: 'positif', ok: s === 0, why: `cos ${th}° n’est pas positif : un angle ${th > 90 ? 'obtus' : th === 90 ? 'droit' : 'aigu'} ne donne pas ce signe.` },
      { l: 'négatif', ok: s === 1, why: th === 90 ? 'Pour un angle droit, cos 90° = 0 : le produit est nul.' : `cos ${th}° est ${th < 90 ? 'positif (angle aigu)' : 'négatif (angle obtus)'} : le signe n’est pas celui-là.` },
      { l: 'nul', ok: s === 2, why: `Le produit n’est nul que pour un angle droit (cos 90° = 0). Ici l’angle mesure ${th}°.` },
    ];
    return {
      html: `Les vecteurs ${U} et ${W} ont pour normes ${norm(u)} = ${M(a)} et ${norm(v)} = ${M(b)}, et l’angle entre ${U} et ${W} mesure ${th}°.<br>Sans calculer, le produit scalaire ${dot(U, W)} est-il positif, négatif ou nul ?`,
      ...rChoice(items, { ordre: true, indep: ['positif', 'négatif', 'nul'][s] }),
      hint: `Comme ${dot(U, W)} = ${norm(u)} × ${norm(v)} × cos ${th}° et que les normes ${M(a)} et ${M(b)} sont positives, le signe est celui de cos ${th}° : regarde si ${th}° est inférieur ou supérieur à 90°.`,
      solution: `${dot(U, W)} = ${norm(u)} × ${norm(v)} × cos ${th}° ; les normes sont positives, donc le signe est celui de cos ${th}°. ${th < 90 ? `L’angle ${th}° est aigu (moins de 90°) : cos ${th}° > 0, le produit est positif.` : th === 90 ? 'L’angle est droit : cos 90° = 0, le produit est nul.' : `L’angle ${th}° est obtus (entre 90° et 180°) : cos ${th}° < 0, le produit est négatif.`}`,
    };
  },
};

const cosRac = (id, dmin, titre, base, angles) => ({
  id, dmin, titre,
  draw() { return { nm: pick(NOMS3), k: ri(2, 7), b: ri(2, 8), th: pick(angles) }; },
  ex: { nm: ['A', 'B', 'C'], k: 4, b: 5, th: angles[0] },
  build({ nm, k, b, th }) {
    const [A, B, C] = nm, AB = vn(A, B), AC = vn(A, C), neg = th > 90, r = base;
    const p = (neg ? -1 : 1) * (r === 2 ? k * b : (3 * k * b) / 2);
    if (r === 3 && (3 * k * b) % 2 !== 0 && false) return null;
    const lenAB = k * Math.sqrt(r), co = r === 2 ? '√2 ÷ 2' : '√3 ÷ 2';
    const sgn = neg ? '−' : '';
    const fin = r === 2 ? `Comme √2 × √2 = 2, on trouve ${sgn}${M(k)} × ${M(b)} × 2 ÷ 2 = ${M(p)}.` : `Comme √3 × √3 = 3, on trouve ${sgn}${M(k)} × ${M(b)} × 3 ÷ 2 = ${M(p)}.`;
    return {
      html: `Dans le triangle ${A}${B}${C}, on a ${A}${B} = ${kRac(k, r)}, ${A}${C} = ${M(b)} et l’angle ${B}${A}${C} mesure ${th}°.<br>Calcule ${dot(AB, AC)}.`,
      visual: figTriangle(nm, lenAB, b, th, `${k}√${r}`, M(b)),
      ...rNums([p], { tpl: `${dot(AB, AC)} = {0}`, value: lenAB * b * Math.cos(th * Math.PI / 180) }),
      hint: `${dot(AB, AC)} = ${A}${B} × ${A}${C} × cos ${th}°, avec ${A}${B} = ${k}√${r}, ${A}${C} = ${M(b)} et cos ${th}° = ${COSTXT[th]}. Pense que √${r} × √${r} se simplifie.`,
      solution: `${dot(AB, AC)} = ${A}${B} × ${A}${C} × cos ${th}° = ${kRac(k, r)} × ${M(b)} × ${neg ? '(−' + co + ')' : '(' + co + ')'}. ${fin}`,
    };
  },
});
const cos45 = cosRac('cs-45', 2, 'angle de 45° ou 135° (√2)', 2, [45, 135]);
const cos30 = cosRac('cs-30', 3, 'angle de 30° ou 150° (√3)', 3, [30, 150]);

const cosAngle = {
  id: 'cs-angle', dmin: 4, titre: 'retrouver l’angle',
  draw() { const th = pick([60, 120, 90, 60, 120]); let a, b; do { a = ri(2, 9); b = ri(2, 9); } while ((a * b) % 2); return { nv: pick(NOMS_V), a, b, th }; },
  ex: { nv: ['u', 'v'], a: 4, b: 6, th: 60 },
  build({ nv, a, b, th }) {
    const [u, v] = nv, U = V(u), W = V(v), p = a * b * COS[th][0], pr = a * b;
    return {
      html: `Les vecteurs ${U} et ${W} vérifient ${norm(u)} = ${M(a)}, ${norm(v)} = ${M(b)} et ${dot(U, W)} = ${M(p)}.<br>Quelle est la mesure (en degrés) de l’angle entre ${U} et ${W}, compris entre 0° et 180° ?`,
      ...rNums([th], { tpl: 'angle = {0}°', value: th }),
      hint: `Isole le cosinus : cos θ = ${dot(U, W)} ÷ (${norm(u)} × ${norm(v)}), avec ${dot(U, W)} = ${M(p)}, ${norm(u)} = ${M(a)} et ${norm(v)} = ${M(b)}. Cherche ensuite l’angle remarquable qui a ce cosinus.`,
      solution: `Le produit des normes est ${norm(u)} × ${norm(v)} = ${M(a)} × ${M(b)} = ${M(pr)}. Donc cos θ = ${M(p)} ÷ ${M(pr)} = ${M(COS[th][0])}. L’angle de ${th}° est le seul entre 0° et 180° dont le cosinus vaut ${M(COS[th][0])} : θ = ${th}°.`,
    };
  },
};

const cosAngle2 = {
  id: 'cs-angle-rac', dmin: 5, titre: 'retrouver l’angle (√2 ou √3)',
  draw() { const r = pick([2, 3]), neg = chance(0.5); return { nv: pick(NOMS_V), k: ri(2, 6), b: ri(2, 6) * (r === 3 ? 2 : 1), r, neg }; },
  ex: { nv: ['u', 'v'], k: 3, b: 4, r: 2, neg: false },
  build({ nv, k, b, r, neg }) {
    const [u, v] = nv, U = V(u), W = V(v), th = r === 2 ? (neg ? 135 : 45) : (neg ? 150 : 30);
    const prod = r === 2 ? k * b : (3 * k * b) / 2, p = neg ? -prod : prod;
    const den = `${M(k * b)}√${r}`;
    return {
      html: `Les vecteurs ${U} et ${W} vérifient ${norm(u)} = ${kRac(k, r)}, ${norm(v)} = ${M(b)} et ${dot(U, W)} = ${M(p)}.<br>Quelle est la mesure (en degrés) de l’angle entre ${U} et ${W} ?`,
      ...rNums([th], { tpl: 'angle = {0}°', value: th }),
      hint: `cos θ = ${dot(U, W)} ÷ (${norm(u)} × ${norm(v)}) avec ${dot(U, W)} = ${M(p)}, ${norm(u)} = ${k}√${r} et ${norm(v)} = ${M(b)}. Simplifie le quotient pour reconnaître une valeur de cosinus du tableau du cours.`,
      solution: `${norm(u)} × ${norm(v)} = ${kRac(k, r)} × ${M(b)} = ${den}. Donc cos θ = ${M(p)} ÷ ${den}. ${r === 2 ? `En simplifiant par ${M(k * b)}, cos θ = ${neg ? '−' : ''}1 ÷ √2 = ${neg ? '−' : ''}√2 ÷ 2.` : `Comme ${M(p)} = ${neg ? '−' : ''}${M(k * b)} × √3 × √3 ÷ 2, cos θ = ${neg ? '−' : ''}√3 ÷ 2.`} C’est le cosinus de ${th}°, donc θ = ${th}°.`,
    };
  },
};

const F2 = [cosSimple, cosSigne, cosTri, cos45, cos30, cosAngle, cosAngle2];
export const LV2 = niveau('Formule avec le cosinus', F2, {
  n: 2,
  intro: 'Quand on connaît les longueurs et l’angle entre deux vecteurs, on calcule le produit scalaire avec un cosinus.',
  def: `Pour deux vecteurs ${V('u')} et ${V('v')} non nuls formant un angle θ :<br><b>${dot(V('u'), V('v'))} = ${norm('u')} × ${norm('v')} × cos θ</b>.<br>Valeurs à connaître : cos 0° = 1 ; cos 30° = √3 ÷ 2 ; cos 45° = √2 ÷ 2 ; cos 60° = 0,5 ; cos 90° = 0 ; cos 120° = −0,5 ; cos 135° = −√2 ÷ 2 ; cos 150° = −√3 ÷ 2 ; cos 180° = −1.`,
  visuel: `<div class="cols">${figAngle({ la: 4, lb: 3, th: 60, ta: '4', tb: '3', nu: 'u', nv: 'v' })}${figAngle({ la: 4, lb: 3, th: 120, ta: '4', tb: '3', nu: 'u', nv: 'v', mir: -1 })}</div><p class="note">Angle aigu : produit positif. Angle obtus : produit négatif. Angle droit : produit nul.</p>`,
  methode: ['Repère les deux vecteurs <b>partant du même point</b> et l’angle θ qu’ils forment.', 'Écris ‖u‖ × ‖v‖ × cos θ et remplace chaque nombre.', 'Utilise la valeur exacte de cos θ (tableau ci-dessus). Avec √2 ou √3, simplifie √2 × √2 = 2 et √3 × √3 = 3.', 'Pour retrouver θ : cos θ = u·v ÷ (‖u‖ × ‖v‖).'],
  warn: ['Les normes sont toujours positives : le signe du produit est celui de cos θ.', 'Les vecteurs doivent partir du même point pour mesurer l’angle (sinon, on déplace l’un d’eux).', 'cos 120° = −0,5 et non 0,5 : un angle obtus donne un produit négatif.'],
  retenir: `${dot(V('u'), V('v'))} = ‖u‖ × ‖v‖ × cos θ ; aigu → positif, droit → nul, obtus → négatif.`,
});

/* =====================================================================================================
   Niveau 3 : expression analytique
   ===================================================================================================== */
const coCalc = {
  id: 'co-calc', dmin: 0, titre: 'coordonnées positives',
  draw() { return { u: [ri(1, 9), ri(1, 9)], v: [ri(1, 9), ri(1, 9)], nv: pick(NOMS_V) }; },
  ex: { u: [3, 2], v: [4, 5], nv: ['u', 'v'] },
  build({ u, v, nv }) {
    const [a, b] = nv, U = V(a), W = V(b), p = sc(u, v);
    return {
      html: `Dans un repère orthonormé, ${vc(a, u)} et ${vc(b, v)}.<br>Calcule ${dot(U, W)}.`,
      ...rNums([p], { tpl: `${dot(U, W)} = {0}`, value: u[0] * v[0] + u[1] * v[1] }),
      hint: `Multiplie les abscisses ${u[0]} et ${v[0]}, multiplie les ordonnées ${u[1]} et ${v[1]}, puis additionne les deux produits.`,
      solution: `En repère orthonormé, ${dot(U, W)} = x × x′ + y × y′ = ${calcAn(u, v)}.`,
    };
  },
};
const coNeg = {
  id: 'co-neg', dmin: 1, titre: 'avec des coordonnées négatives',
  draw(d) { return { u: [nz(-8, 8), nz(-8, 8)], v: [nz(-8, 8), nz(-8, 8)], nv: pick(NOMS_V) }; },
  ex: { u: [3, -1], v: [-2, 4], nv: ['u', 'v'] },
  build({ u, v, nv }) {
    const [a, b] = nv, U = V(a), W = V(b), p = sc(u, v);
    if (p === 0) return null;
    return {
      html: `Dans un repère orthonormé, ${vc(a, u)} et ${vc(b, v)}.<br>Calcule ${dot(U, W)}.`,
      ...rNums([p], { tpl: `${dot(U, W)} = {0}`, value: u[0] * v[0] + u[1] * v[1] }),
      hint: `Calcule ${fois(u[0], v[0])}, puis ${fois(u[1], v[1])} en appliquant la règle des signes, avant d’additionner les deux résultats.`,
      solution: `${dot(U, W)} = x × x′ + y × y′ = ${calcAn(u, v)}.`,
    };
  },
};
const coPts = {
  id: 'co-pts', dmin: 2, titre: 'avec trois points',
  draw() { let A, B, C; do { A = [ri(-4, 4), ri(-4, 4)]; B = [ri(-4, 4), ri(-4, 4)]; C = [ri(-4, 4), ri(-4, 4)]; } while (!sc(vec(A, B), vec(A, B)) || !sc(vec(A, C), vec(A, C)) || sc(vec(A, B), vec(A, C)) === 0); return { nm: pick(NOMS3), A, B, C }; },
  ex: { nm: ['A', 'B', 'C'], A: [1, 2], B: [4, 3], C: [2, 6] },
  build({ nm, A, B, C }) {
    const [nA, nB, nC] = nm, AB = vec(A, B), AC = vec(A, C), p = sc(AB, AC);
    const cpx = (x, y) => `(${x} ; ${y})`;
    const dif = (P2, P1) => cpx(`${M(P2[0])} − ${P(P1[0])}`, `${M(P2[1])} − ${P(P1[1])}`);
    return {
      html: `Dans un repère orthonormé, on donne ${pt(nA, A)}, ${pt(nB, B)} et ${pt(nC, C)}.<br>Calcule ${dot(vn(nA, nB), vn(nA, nC))}.`,
      visual: fig({ axes: true, aria: `repère avec les points ${nA}, ${nB} et ${nC}`, pts: [{ x: A[0], y: A[1], l: nA }, { x: B[0], y: B[1], l: nB }, { x: C[0], y: C[1], l: nC }], vecs: [{ x: A[0], y: A[1], dx: AB[0], dy: AB[1], c: COL.u }, { x: A[0], y: A[1], dx: AC[0], dy: AC[1], c: COL.v }], H: 300 }),
      ...rNums([p], { tpl: `${dot(vn(nA, nB), vn(nA, nC))} = {0}`, value: (B[0] - A[0]) * (C[0] - A[0]) + (B[1] - A[1]) * (C[1] - A[1]) }),
      hint: `Calcule d’abord les coordonnées des deux vecteurs en soustrayant celles de ${nA} (${M(A[0])} et ${M(A[1])}) à celles de ${nB}, puis de ${nC}. Ensuite multiplie les abscisses, multiplie les ordonnées et additionne.`,
      solution: `${nw(vn(nA, nB) + dif(B, A))} = ${nw(vn(nA, nB) + cp(AB[0], AB[1]))} et ${nw(vn(nA, nC) + dif(C, A))} = ${nw(vn(nA, nC) + cp(AC[0], AC[1]))}. Alors ${dot(vn(nA, nB), vn(nA, nC))} = ${calcAn(AB, AC)}.`,
    };
  },
};
const coLire = {
  id: 'co-lire', dmin: 3, titre: 'lire les coordonnées sur la figure',
  draw(d) { let u, v; do { u = [nz(-5, 5), nz(-4, 4)]; v = [nz(-5, 5), nz(-4, 4)]; } while (sc(u, v) === 0 || (u[0] === v[0] && u[1] === v[1])); const st = d >= 4 ? [ri(-2, 2), ri(-2, 2)] : [0, 0]; return { u, v, st, st2: d >= 4 ? [ri(-2, 2), ri(-2, 2)] : [0, 0] }; },
  ex: { u: [3, 2], v: [-1, 4], st: [0, 0], st2: [0, 0] },
  build({ u, v, st, st2 }) {
    const p = sc(u, v);
    return {
      html: `Sur le quadrillage d’un repère orthonormé, lis les coordonnées des vecteurs ${V('u')} et ${V('v')}, puis calcule ${dot(V('u'), V('v'))}.`,
      visual: fig({ axes: true, aria: 'deux vecteurs u et v dessinés dans un repère', H: 300, vecs: [{ x: st[0], y: st[1], dx: u[0], dy: u[1], c: COL.u, l: '{u}' }, { x: st2[0], y: st2[1], dx: v[0], dy: v[1], c: COL.v, l: '{v}', side: -1 }] }),
      ...rNums([p], { tpl: `${dot(V('u'), V('v'))} = {0}`, value: u[0] * v[0] + u[1] * v[1] }),
      hint: `Pour chaque flèche, compte les carreaux de son départ à sa pointe : d’abord horizontalement (→ positif), puis verticalement (↑ positif). Écris ainsi ${V('u')} et ${V('v')}, puis calcule x × x′ + y × y′.`,
      solution: `On lit ${vc('u', u)} et ${vc('v', v)} (déplacement horizontal, puis vertical). Alors ${dot(V('u'), V('v'))} = ${calcAn(u, v)}.`,
    };
  },
};
const coNorme = {
  id: 'co-norme', dmin: 3, titre: 'norme d’un vecteur',
  draw() { const t = pick(TRIPLES.slice(0, 6)), [a, b] = chance(0.5) ? [t[0], t[1]] : [t[1], t[0]]; return { u: [a * pick([1, -1]), b * pick([1, -1])], nv: pick(['u', 'v', 'w']) }; },
  ex: { u: [-3, 4], nv: 'u' },
  build({ u, nv }) {
    const U = V(nv), s = n2(u), r = sqrtInt(s);
    return {
      html: `Dans un repère orthonormé, ${vc(nv, u)}.<br>Calcule la norme de ${U}.`,
      ...rNums([r], { tpl: `${norm(nv)} = {0}`, value: Math.hypot(u[0], u[1]) }),
      hint: `${dot(U, U)} = ${norm(nv)}². Calcule ${dot(U, U)} avec x² + y², c’est-à-dire ${carreN(u[0])} + ${carreN(u[1])}, puis prends la racine carrée.`,
      solution: `${norm(nv)}<sup>2</sup> = ${dot(U, U)} = ${carreN(u[0])} + ${carreN(u[1])} = ${M(u[0] * u[0])} + ${M(u[1] * u[1])} = ${M(s)}. Donc ${norm(nv)} = √${M(s)} = ${M(r)}.`,
    };
  },
};
const carreN = a => `${P(a)}<sup>2</sup>`;

const F3 = [coCalc, coNeg, coPts, coLire, coNorme];
export const LV3 = niveau('Produit scalaire en coordonnées', F3, {
  n: 3,
  intro: 'Dans un repère orthonormé, plus besoin d’angle ni de projection : une simple opération sur les coordonnées suffit.',
  def: `Dans un repère <b>orthonormé</b>, si ${V('u')}(x ; y) et ${V('v')}(x′ ; y′) :<br><b>${dot(V('u'), V('v'))} = x × x′ + y × y′</b>.<br>En particulier ${dot(V('u'), V('u'))} = x<sup>2</sup> + y<sup>2</sup> = ‖u‖<sup>2</sup>, d’où <b>‖u‖ = √(x<sup>2</sup> + y<sup>2</sup>)</b>.`,
  visuel: `<div class="cols">${fig({ axes: true, aria: 'vecteurs u(3 ; 2) et v(−1 ; 4) dans un repère', H: 280, vecs: [{ x: 0, y: 0, dx: 3, dy: 2, c: COL.u, l: '{u}' }, { x: 0, y: 0, dx: -1, dy: 4, c: COL.v, l: '{v}', side: -1 }] })}<div class="note">Ici ${vc('u', [3, 2])} et ${vc('v', [-1, 4])} : ${dot(V('u'), V('v'))} = 3 × (−1) + 2 × 4 = −3 + 8 = 5.</div></div>`,
  methode: ['Écris les coordonnées de chaque vecteur (si besoin : <b>arrivée moins départ</b>).', 'Multiplie les deux abscisses, multiplie les deux ordonnées.', 'Additionne les deux produits : c’est un <b>nombre</b>, pas un vecteur.', 'Pour une norme : x² + y², puis la racine carrée.'],
  warn: ['Le résultat est un nombre, pas un couple de coordonnées.', 'Attention aux signes : 3 × (−2) = −6, et (−1) × (−4) = 4.', 'Le repère doit être <b>orthonormé</b> : la formule ne marche pas sinon.'],
  retenir: `${dot(V('u'), V('v'))} = xx′ + yy′ et ‖u‖ = √(x<sup>2</sup> + y<sup>2</sup>).`,
});

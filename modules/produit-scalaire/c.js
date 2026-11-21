// Niveaux 7 à 9 : formule d'Al-Kashi (côté, angle) ; vecteur normal et équation cartésienne d'une droite.
import {
  ri, pick, nz, chance, prenom, M, P, F, R, terms, niveau, rNums, rFrac, rChoice, rEquation, V, vc, pt, dot, nw, cp, cpx, fois, kRac, cart,
  NOMS3, TRIPLES, sc, vec, gcd, sq, comb, somme, shuffle, cv, xm, calcAn, pa,
} from './outils.js';
import { fig, COL, triangleCoords } from './draw.js';

const vn = (A, B) => V(A + B);
const isq = n => { const r = Math.round(Math.sqrt(n)); return n > 0 && r * r === n ? r : null; };
const liste = (bornesB, bornesC, f, egal = false) => { const o = []; for (let b = bornesB[0]; b <= bornesB[1]; b++) for (let c = bornesC[0]; c <= bornesC[1]; c++) { if (!egal && b === c) continue; const a = isq(f(b, c)); if (a) o.push([b, c, a]); } return o; };
const L60 = liste([2, 14], [2, 14], (b, c) => b * b + c * c - b * c);
const L120 = liste([2, 14], [2, 14], (b, c) => b * b + c * c + b * c);
// c = k√2 (ou k√3) : [k, b, a]
const L45 = liste([1, 7], [2, 14], (k, b) => (b - k) * (b - k) + k * k).filter(([k, b]) => b !== k);
const L135 = liste([1, 7], [2, 14], (k, b) => (b + k) * (b + k) + k * k);
const L30 = liste([1, 5], [2, 14], (k, b) => b * b + 3 * k * k - 3 * b * k).filter(([k, b, a]) => a > 0);
const L150 = liste([1, 5], [2, 14], (k, b) => b * b + 3 * k * k + 3 * b * k);
const L90 = TRIPLES.flatMap(([x, y, z]) => [[x, y, z], [y, x, z]]);

/** noms tournés : le sommet de l'angle est le premier */
const tourne = (nm, ap) => [nm[ap], nm[(ap + 1) % 3], nm[(ap + 2) % 3]];

/**
 * Triangle dessiné d'après les longueurs RÉELLES c = YZ, b = YX, a = ZX (sommet Y en bas à gauche).
 * tc, tb, ta : textes des mesures (ou null) ; th : texte de l'angle en Y (ou null)
 */
function figCotes({ t, c, b, a, tc, tb, ta, th }) {
  const T = triangleCoords(c, b, a), [Y, Z, X] = t, angle = Math.acos(T.cosA) * 180 / Math.PI;
  const segs = [{ a: T.B, b: T.C, c: '#495057', ...(ta ? { lab: `${Z}${X} = ${ta}`, lc: COL.h, dist: 8 } : {}) }];
  if (tc) segs.push({ a: T.A, b: T.B, inv: true, lab: `${Y}${Z} = ${tc}`, side: -1, dist: 14, lc: COL.u });
  if (tb) segs.push({ a: T.A, b: T.C, inv: true, lab: `${Y}${X} = ${tb}`, side: 1, dist: 8, lc: COL.v });
  const rect = Math.abs(angle - 90) < 0.01;
  return fig({
    aria: `triangle ${Y}${Z}${X}`, H: 290, padb: 26, padt: 6,
    pts: [{ x: T.A[0], y: T.A[1], l: Y, pos: 'sw' }, { x: T.B[0], y: T.B[1], l: Z, pos: 'se' }, { x: T.C[0], y: T.C[1], l: X, pos: T.C[0] < 0 ? 'nw' : 'n' }],
    poly: [T.A, T.B, T.C], segs, vecs: [],
    arcs: th && !rect ? [{ at: T.A, a1: 0, a2: angle, r: 24, lab: th }] : [], right: th && rect ? [{ at: T.A, u: [1, 0], v: [0, 1] }] : [],
    center: [(T.A[0] + T.B[0] + T.C[0]) / 3, (T.A[1] + T.B[1] + T.C[1]) / 3],
  });
}

/* =====================================================================================================
   Niveau 7 : Al-Kashi, calculer un côté
   ===================================================================================================== */
const COSV = { 90: '0', 60: '0,5', 120: '−0,5', 45: '√2 ÷ 2', 135: '−√2 ÷ 2', 30: '√3 ÷ 2', 150: '−√3 ÷ 2' };

const akFormule = {
  id: 'ak-formule', dmin: 0, titre: 'reconnaître la bonne formule',
  draw() { return { nm: pick(NOMS3), ap: pick([0, 1, 2]), th: pick([30, 45, 60, 90, 120, 135, 150]) }; },
  ex: { nm: ['A', 'B', 'C'], ap: 0, th: 60 },
  build({ nm, ap, th }) {
    const [Y, Z, X] = tourne(nm, ap), ang = `${Z}${Y}${X}`;
    const items = [
      { l: `${Z}${X}<sup>2</sup> = ${Y}${Z}<sup>2</sup> + ${Y}${X}<sup>2</sup> − 2 × ${Y}${Z} × ${Y}${X} × cos(${ang})`, ok: true },
      { l: `${Z}${X}<sup>2</sup> = ${Y}${Z}<sup>2</sup> + ${Y}${X}<sup>2</sup> + 2 × ${Y}${Z} × ${Y}${X} × cos(${ang})`, why: 'Le double produit est précédé du signe − dans la formule d’Al-Kashi (c’est le signe de −2 u·v pour ‖u − v‖²).' },
      { l: `${Z}${X}<sup>2</sup> = ${Y}${Z}<sup>2</sup> + ${Y}${X}<sup>2</sup> − ${Y}${Z} × ${Y}${X} × cos(${ang})`, why: 'Il manque le facteur 2 devant le produit : c’est 2 × ' + Y + Z + ' × ' + Y + X + ' × cos.' },
      { l: `${Z}${X} = ${Y}${Z} + ${Y}${X} − 2 × ${Y}${Z} × ${Y}${X} × cos(${ang})`, why: 'Les longueurs sont élevées au carré : c’est une égalité de carrés, pas de longueurs.' },
    ];
    return {
      html: `Dans un triangle ${Y}${Z}${X}, on connaît ${Y}${Z}, ${Y}${X} et l’angle ${ang} qui mesure ${th}°.<br>Quelle égalité permet de calculer la longueur ${Z}${X} ?`,
      ...rChoice(items, { indep: items[0].l }),
      hint: `${Z}${X} est le côté opposé à l’angle ${ang}, de sommet ${Y}. Pars de ${vn(Z, X)} = ${vn(Y, X)} − ${vn(Y, Z)} et développe ${Z}${X}² = ‖${vn(Y, X)} − ${vn(Y, Z)}‖² ; compare ensuite chaque terme aux quatre propositions (carrés ? signe ? facteur 2 ?).`,
      solution: `${vn(Z, X)} = ${vn(Y, X)} − ${vn(Y, Z)}, donc ${Z}${X}<sup>2</sup> = ${Y}${X}<sup>2</sup> + ${Y}${Z}<sup>2</sup> − 2 ${dot(vn(Y, Z), vn(Y, X))}, avec ${dot(vn(Y, Z), vn(Y, X))} = ${Y}${Z} × ${Y}${X} × cos(${ang}). On obtient ${Z}${X}<sup>2</sup> = ${Y}${Z}<sup>2</sup> + ${Y}${X}<sup>2</sup> − 2 × ${Y}${Z} × ${Y}${X} × cos(${ang}).`,
    };
  },
};

/** côté opposé à l'angle th : dessin, énoncé, solution */
function akCote({ nm, ap, b, c, a, th, cosTxt, carres, fin, ta }) {
  const t = tourne(nm, ap), [Y, Z, X] = t;
  return {
    html: `Dans le triangle ${Y}${Z}${X}, on a ${Y}${Z} = ${ta.c}, ${Y}${X} = ${ta.b} et l’angle ${Z}${Y}${X} mesure ${th}°.<br>Calcule ${Z}${X}.`,
    visual: figCotes({ t, c, b, a, tc: ta.cs, tb: ta.bs, ta: '?', th: `${th}°` }),
    ...rNums([a], { tpl: `${Z}${X} = {0}`, value: a }),
    hint: `Applique la formule d’Al-Kashi en ${Y} : ${Z}${X}² = ${Y}${Z}² + ${Y}${X}² − 2 × ${Y}${Z} × ${Y}${X} × cos(${th}°), avec ${Y}${Z} = ${ta.cs}, ${Y}${X} = ${ta.bs} et cos ${th}° = ${cosTxt}. Tu trouves ${Z}${X}², puis la racine carrée.`,
    solution: `Formule d’Al-Kashi : ${Z}${X}<sup>2</sup> = ${Y}${Z}<sup>2</sup> + ${Y}${X}<sup>2</sup> − 2 × ${Y}${Z} × ${Y}${X} × cos ${th}°, avec cos ${th}° = ${cosTxt}. ${carres} Donc ${Z}${X} = √${M(a * a)} = ${M(a)}.${fin || ''}`,
  };
}
const dessins = (b, c) => ({ cs: M(c), bs: M(b), c: M(c), b: M(b) });

const akA60 = {
  id: 'ak-60', dmin: 0, titre: 'angle de 60°',
  draw() { const [b, c, a] = pick(L60); return { nm: pick(NOMS3), ap: ri(0, 2), b, c, a }; },
  ex: { nm: ['A', 'B', 'C'], ap: 0, b: 8, c: 5, a: 7 },
  build({ nm, ap, b, c, a }) {
    const [Y, Z, X] = tourne(nm, ap);
    return akCote({ nm, ap, b, c, a, th: 60, cosTxt: '0,5', ta: dessins(b, c), carres: `${Z}${X}<sup>2</sup> = ${M(c)}<sup>2</sup> + ${M(b)}<sup>2</sup> − 2 × ${M(c)} × ${M(b)} × 0,5 = ${M(c * c)} + ${M(b * b)} − ${M(c * b)} = ${M(a * a)}.` });
  },
};
const akDroit = {
  id: 'ak-droit', dmin: 1, titre: 'angle droit (retour à Pythagore)',
  draw() { const [b, c, a] = pick(L90); return { nm: pick(NOMS3), ap: ri(0, 2), b, c, a }; },
  ex: { nm: ['A', 'B', 'C'], ap: 0, b: 4, c: 3, a: 5 },
  build({ nm, ap, b, c, a }) {
    return akCote({ nm, ap, b, c, a, th: 90, cosTxt: '0', ta: dessins(b, c), carres: `Comme le terme avec le cosinus s’annule, ${tourne(nm, ap)[1]}${tourne(nm, ap)[2]}<sup>2</sup> = ${M(c)}<sup>2</sup> + ${M(b)}<sup>2</sup> = ${M(c * c)} + ${M(b * b)} = ${M(a * a)} : c’est le théorème de Pythagore.` });
  },
};
const akA120 = {
  id: 'ak-120', dmin: 2, titre: 'angle de 120°',
  draw() { const [b, c, a] = pick(L120); return { nm: pick(NOMS3), ap: ri(0, 2), b, c, a }; },
  ex: { nm: ['A', 'B', 'C'], ap: 0, b: 5, c: 3, a: 7 },
  build({ nm, ap, b, c, a }) {
    const [Y, Z, X] = tourne(nm, ap);
    return akCote({ nm, ap, b, c, a, th: 120, cosTxt: '−0,5', ta: dessins(b, c), carres: `${Z}${X}<sup>2</sup> = ${M(c)}<sup>2</sup> + ${M(b)}<sup>2</sup> − 2 × ${M(c)} × ${M(b)} × (−0,5) = ${M(c * c)} + ${M(b * b)} + ${M(c * b)} = ${M(a * a)}.` });
  },
};
/** √2 et √3 : côté YZ = k√r */
const akRac = (id, dmin, titre, r, th, L, pm) => ({
  id, dmin, titre,
  draw() { const [k, b, a] = pick(L); return { nm: pick(NOMS3), ap: ri(0, 2), k, b, a, bascule: chance(0.5) }; },
  ex: (() => { const [k, b, a] = L[0]; return { nm: ['A', 'B', 'C'], ap: 0, k, b, a, bascule: false }; })(),
  build({ nm, ap, k, b, a, bascule }) {
    const [Y, Z, X] = tourne(nm, ap), kr = kRac(k, r), lc = k * Math.sqrt(r), cosTxt = COSV[th];
    // le côté en k√r est YZ (ou YX si bascule)
    const prodTxt = r === 2 ? `2 × ${kr} × ${M(b)} × (√2 ÷ 2) = ${M(k)} × ${M(b)} × 2 = ${M(2 * k * b)}` : `2 × ${kr} × ${M(b)} × (√3 ÷ 2) = ${M(k)} × ${M(b)} × 3 = ${M(3 * k * b)}`;
    const c2 = r * k * k, pr = r === 2 ? 2 * k * b : 3 * k * b;
    const signe = pm < 0 ? '+' : '−';
    const sq1 = `(${kr})<sup>2</sup> = ${M(k)}<sup>2</sup> × ${r} = ${M(k * k)} × ${r} = ${M(c2)}`;
    const carres = `${sq1}. Puis ${prodTxt}${pm < 0 ? ', et comme cos 135° est négatif, ce terme s’ajoute' : ''}. Ainsi ${Z}${X}<sup>2</sup> = ${M(c2)} + ${M(b * b)} ${signe} ${M(pr)} = ${M(a * a)}.`;
    const sw = bascule;
    const ta = sw ? { c: M(b), b: kr, cs: M(b), bs: `${k}√${r}` } : { c: kr, b: M(b), cs: `${k}√${r}`, bs: M(b) };
    const cc = sw ? b : lc, bb = sw ? lc : b;
    return akCote({ nm, ap, b: bb, c: cc, a, th, cosTxt, ta, carres });
  },
});
const akA45 = akRac('ak-45', 3, 'angle de 45° (avec √2)', 2, 45, L45, 1);
const akA135 = akRac('ak-135', 4, 'angle de 135° (avec √2)', 2, 135, L135, -1);

const de = p => (/^[AEIOUÉÈÂÊ]/.test(p) ? `d’${p}` : `de ${p}`);
const CONTEXTES = [
  (p, q, x, y, th) => `${p} et ${q} partent du même refuge. ${p} marche ${x} km et ${q} ${y} km, sur deux sentiers qui forment un angle de ${th}°. On note O le refuge, P la position de ${p} et Q celle de ${q}.`,
  (p, q, x, y, th) => `Depuis le même port O, deux bateaux, celui ${de(p)} (en P) et celui ${de(q)} (en Q), naviguent en ligne droite sur deux routes qui font un angle de ${th}° : ${p} parcourt ${x} km, ${q} parcourt ${y} km.`,
  (p, q, x, y, th) => `${p} et ${q} quittent le même carrefour O à vélo. Leurs routes forment un angle de ${th}° ; ${p} roule ${x} km (jusqu’en P) et ${q} roule ${y} km (jusqu’en Q).`,
];
const akContexte = {
  id: 'ak-contexte', dmin: 4, titre: 'un problème de distance',
  draw() { const th = pick([60, 120]), [b, c, a] = pick(th === 60 ? L60 : L120); let p = prenom(), q = prenom(); while (q === p) q = prenom(); return { p, q, b, c, a, th, cx: ri(0, 2) }; },
  ex: { p: 'Léa', q: 'Tom', b: 8, c: 5, a: 7, th: 60, cx: 0 },
  build({ p, q, b, c, a, th, cx }) {
    const t = ['O', 'P', 'Q'];
    const cosV = th === 60 ? '0,5' : '−0,5', tot = th === 60 ? `${M(c * c)} + ${M(b * b)} − ${M(c * b)}` : `${M(c * c)} + ${M(b * b)} + ${M(c * b)}`;
    return {
      html: `${CONTEXTES[cx](p, q, M(c), M(b), th)}<br>À quelle distance l’un de l’autre sont-ils alors, à vol d’oiseau (en km) ?`,
      visual: figCotes({ t, c, b, a, tc: `${M(c)} km`, tb: `${M(b)} km`, ta: '?', th: `${th}°` }),
      ...rNums([a], { tpl: 'distance = {0} km', value: a }),
      hint: `Le départ O, ${p} et ${q} forment un triangle : applique la formule d’Al-Kashi en O avec les longueurs ${M(c)} et ${M(b)} et l’angle de ${th}° (cos ${th}° = ${cosV}) pour trouver le carré de la distance, puis prends la racine carrée.`,
      solution: `Dans le triangle OPQ, la distance d = PQ cherchée est le côté opposé à l’angle de ${th}° : d<sup>2</sup> = ${M(c)}<sup>2</sup> + ${M(b)}<sup>2</sup> − 2 × ${M(c)} × ${M(b)} × cos ${th}°, avec cos ${th}° = ${cosV}. Donc d<sup>2</sup> = ${tot} = ${M(a * a)} et d = √${M(a * a)} = ${M(a)} km.`,
    };
  },
};

const F7 = [akFormule, akA60, akDroit, akA120, akA45, akA135, akContexte];
export const LV7 = niveau('Al-Kashi : calculer un côté', F7, {
  n: 7,
  intro: 'La formule d’Al-Kashi généralise Pythagore : elle donne un côté quand on connaît les deux autres et l’angle entre eux.',
  def: `Dans un triangle ABC, avec a = BC, b = CA, c = AB :<br><b>BC<sup>2</sup> = AB<sup>2</sup> + AC<sup>2</sup> − 2 × AB × AC × cos(BAC)</b>, soit a<sup>2</sup> = b<sup>2</sup> + c<sup>2</sup> − 2bc cos A.<br>Elle vient de ‖${V('AC')} − ${V('AB')}‖<sup>2</sup> = AB<sup>2</sup> + AC<sup>2</sup> − 2 ${dot(V('AB'), V('AC'))}. Si l’angle est droit, cos 90° = 0 : on retrouve Pythagore.`,
  visuel: `<div class="cols">${figCotes({ t: ['A', 'B', 'C'], c: 5, b: 8, a: 7, tc: '5', tb: '8', ta: '?', th: '60°' })}<div class="note">Ici BC<sup>2</sup> = 5<sup>2</sup> + 8<sup>2</sup> − 2 × 5 × 8 × 0,5 = 25 + 64 − 40 = 49, donc BC = 7.</div></div>`,
  methode: ['Repère l’angle connu et les deux côtés qui l’entourent ; le côté cherché est <b>en face</b> de l’angle.', 'Écris : côté cherché² = côté₁² + côté₂² − 2 × côté₁ × côté₂ × cos(angle).', 'Remplace par les nombres avec la valeur exacte du cosinus.', 'Calcule le carré, puis prends la racine carrée (positive).'],
  warn: ['Le côté cherché est opposé à l’angle donné ; les deux autres côtés entourent l’angle.', 'Avec un angle obtus (120°, 135°…), cos est négatif : le terme −2bc cos A devient une <b>addition</b>.', 'On calcule le <b>carré</b> du côté : ne pas oublier la racine carrée à la fin.'],
  retenir: 'a<sup>2</sup> = b<sup>2</sup> + c<sup>2</sup> − 2bc cos A (angle A entre b et c, côté a en face de A).',
});

/* =====================================================================================================
   Niveau 8 : Al-Kashi, calculer un angle
   ===================================================================================================== */
const sc3 = (c, b, a) => c * c + b * b - a * a;
const KA_COS_OK = (b, c, a) => { const n = sc3(c, b, a), d = 2 * b * c, g = gcd(n, d), r = [n / g, d / g]; return n !== 0 && !(Math.abs(r[0]) === 1 && r[1] === 2); };
const kaCos = {
  id: 'ka-cos', dmin: 0, titre: 'calculer le cosinus d’un angle',
  draw() { for (;;) { const c = ri(3, 9), b = ri(3, 9), a = ri(Math.abs(b - c) + 1, b + c - 1); if (a >= 2 && KA_COS_OK(b, c, a)) return { nm: pick(NOMS3), ap: ri(0, 2), c, b, a }; } },
  ex: { nm: ['A', 'B', 'C'], ap: 0, c: 5, b: 6, a: 7 },
  build({ nm, ap, c, b, a }) {
    const [Y, Z, X] = tourne(nm, ap), N = sc3(c, b, a), D = 2 * b * c, ang = `${Z}${Y}${X}`;
    return {
      html: `Dans le triangle ${Y}${Z}${X}, on a ${Y}${Z} = ${M(c)}, ${Y}${X} = ${M(b)} et ${Z}${X} = ${M(a)}.<br>Calcule cos(${ang}) sous la forme d’une fraction irréductible.`,
      visual: figCotes({ t: [Y, Z, X], c, b, a, tc: M(c), tb: M(b), ta: M(a), th: null }),
      ...rFrac(N, D, { value: N / D }),
      hint: `Isole le cosinus dans ${Z}${X}² = ${Y}${Z}² + ${Y}${X}² − 2 × ${Y}${Z} × ${Y}${X} × cos(${ang}) : cos(${ang}) = (${Y}${Z}² + ${Y}${X}² − ${Z}${X}²) ÷ (2 × ${Y}${Z} × ${Y}${X}), avec ${M(c)}, ${M(b)} et ${M(a)}. Simplifie la fraction.`,
      solution: `D’après Al-Kashi, cos(${ang}) = (${Y}${Z}<sup>2</sup> + ${Y}${X}<sup>2</sup> − ${Z}${X}<sup>2</sup>) ÷ (2 × ${Y}${Z} × ${Y}${X}). Le numérateur vaut ${M(c)}<sup>2</sup> + ${M(b)}<sup>2</sup> − ${M(a)}<sup>2</sup> = ${M(c * c)} + ${M(b * b)} − ${M(a * a)} = ${M(N)}. Le dénominateur vaut 2 × ${M(c)} × ${M(b)} = ${M(D)}. Donc cos(${ang}) = ${F(M(N), M(D))}${gcd(N, D) > 1 ? ` = ${rFrac(N, D).rep}` : ''}.`,
    };
  },
};

function kaAngle(id, dmin, titre, L, th, o = {}) {
  return {
    id, dmin, titre,
    draw() { const e = pick(L); return { nm: pick(NOMS3), ap: ri(0, 2), e, bascule: chance(0.5) }; },
    ex: { nm: ['A', 'B', 'C'], ap: 0, e: L[0], bascule: false },
    build({ nm, ap, e, bascule }) {
      const [Y, Z, X] = tourne(nm, ap), ang = `${Z}${Y}${X}`, r = o.r || 0;
      // deux côtés qui entourent l'angle : texte, valeur réelle, carré (texte et valeur)
      let a, s1, s2;
      const ent = x => ({ t: M(x), v: x, sq: `${M(x)}<sup>2</sup>`, sv: x * x });
      if (r) { const [k, b, aa] = e; a = aa; s1 = { t: `${k}√${r}`, v: k * Math.sqrt(r), sq: `(${kRac(k, r)})<sup>2</sup>`, sv: r * k * k, k }; s2 = ent(b); } else { const [b, c, aa] = e; a = aa; s1 = ent(c); s2 = ent(b); }
      if (bascule) [s1, s2] = [s2, s1];
      const N = s1.sv + s2.sv - a * a, calcN = `${s1.sq} + ${s2.sq} − ${M(a)}<sup>2</sup> = ${M(s1.sv)} + ${M(s2.sv)} − ${M(a * a)} = ${M(N)}`;
      let calcD, cosTxt;
      if (r) {
        const k = (bascule ? s2 : s1).k, b = (bascule ? s1 : s2).v, kb = k * b, sg = N < 0 ? '−' : '';
        const f = bascule ? `2 × ${M(b)} × ${kRac(k, r)}` : `2 × ${kRac(k, r)} × ${M(b)}`;
        calcD = `${f} = ${M(2 * kb)}√${r}`;
        cosTxt = r === 2 ? `${M(N)} ÷ ${M(2 * kb)}√2 = ${sg}1 ÷ √2 = ${sg}√2 ÷ 2` : `${M(N)} ÷ ${M(2 * kb)}√3 = ${sg}3 ÷ (2√3) = ${sg}√3 ÷ 2`;
      } else {
        const D = 2 * s1.v * s2.v;
        calcD = `2 × ${M(s1.v)} × ${M(s2.v)} = ${M(D)}`;
        cosTxt = N === 0 ? '0' : `${M(N)} ÷ ${M(D)} = ${M(N / D)}`;
      }
      return {
        html: `Dans le triangle ${Y}${Z}${X}, on a ${Y}${Z} = ${s1.t}, ${Y}${X} = ${s2.t} et ${Z}${X} = ${M(a)}.<br>Calcule la mesure de l’angle ${ang}, en degrés.`,
        visual: figCotes({ t: [Y, Z, X], c: s1.v, b: s2.v, a, tc: s1.t, tb: s2.t, ta: M(a), th: '?' }),
        ...rNums([th], { tpl: `angle ${ang} = {0}°`, value: th }),
        hint: `Isole le cosinus dans ${Z}${X}² = ${Y}${Z}² + ${Y}${X}² − 2 × ${Y}${Z} × ${Y}${X} × cos(${ang}), avec ${Y}${Z} = ${s1.t}, ${Y}${X} = ${s2.t} et ${Z}${X} = ${M(a)}. Cherche ensuite, dans le tableau du cours, l’angle qui a ce cosinus.`,
        solution: `D’après Al-Kashi, cos(${ang}) = (${Y}${Z}<sup>2</sup> + ${Y}${X}<sup>2</sup> − ${Z}${X}<sup>2</sup>) ÷ (2 × ${Y}${Z} × ${Y}${X}). Numérateur : ${calcN}. Dénominateur : ${calcD}. Donc cos(${ang}) = ${cosTxt}. C’est le cosinus de ${th}° (cos ${th}° = ${COSV[th]}), donc l’angle ${ang} mesure ${th}°.`,
      };
    },
  };
}
const rTxt = r => `√${r}`;

const kaDroit = kaAngle('ka-droit', 1, 'angle droit', L90, 90);
const kaA60 = kaAngle('ka-60', 1, 'angle de 60°', L60.map(([b, c, a]) => [b, c, a]), 60);
const kaA120 = kaAngle('ka-120', 2, 'angle de 120°', L120, 120);
// 60° : l'angle est entre c et b, côté opposé a
const kaA45 = {
  id: 'ka-45', dmin: 3, titre: 'angle de 45° ou 135°',
  draw() { const neg = chance(0.5); return { nm: pick(NOMS3), ap: ri(0, 2), e: pick(neg ? L135 : L45), neg, bascule: chance(0.5) }; },
  ex: { nm: ['A', 'B', 'C'], ap: 0, e: L45[0], neg: false, bascule: false },
  build(p) { return kaAngle('x', 0, 'x', [p.e], p.neg ? 135 : 45, { r: 2 }).build(p); },
};
const kaA30 = {
  id: 'ka-30', dmin: 4, titre: 'angle de 30° ou 150°',
  draw() { const neg = chance(0.5); return { nm: pick(NOMS3), ap: ri(0, 2), e: pick(neg ? L150 : L30), neg, bascule: chance(0.5) }; },
  ex: { nm: ['A', 'B', 'C'], ap: 0, e: L30[0], neg: false, bascule: false },
  build(p) { return kaAngle('x', 0, 'x', [p.e], p.neg ? 150 : 30, { r: 3 }).build(p); },
};
const kaGrand = {
  id: 'ka-plus-grand', dmin: 5, titre: 'le plus grand angle d’un triangle',
  draw() { const [b, c, a] = pick(L120.filter(([b, c]) => b < c)); return { b, c, a, ordre: shuffle([0, 1, 2]) }; },
  ex: { b: 3, c: 5, a: 7, ordre: [0, 1, 2] },
  build({ b, c, a, ordre }) {
    const s = [b, c, a], L = ordre.map(i => s[i]);
    const N = b * b + c * c - a * a, D = 2 * b * c;
    return {
      html: `Un triangle a pour côtés ${L.map(M).join(', ')} (en cm).<br>Quelle est la mesure, en degrés, de son plus grand angle ?`,
      visual: figCotes({ t: ['X', 'Y', 'Z'], c, b, a: a, tc: M(c), tb: M(b), ta: M(a), th: null }).replace('triangle XYZ', 'triangle de côtés ' + L.join(', ')),
      ...rNums([120], { tpl: 'plus grand angle = {0}°', value: 120 }),
      hint: `Le plus grand angle est opposé au plus grand côté, ${M(a)}. Applique Al-Kashi avec les deux autres côtés, ${M(b)} et ${M(c)}, pour calculer son cosinus.`,
      solution: `Le plus grand angle est opposé au plus grand côté, ${M(a)}. Al-Kashi : cos = (${M(b)}<sup>2</sup> + ${M(c)}<sup>2</sup> − ${M(a)}<sup>2</sup>) ÷ (2 × ${M(b)} × ${M(c)}). Le numérateur vaut ${M(b * b)} + ${M(c * c)} − ${M(a * a)} = ${M(N)}, le dénominateur 2 × ${M(b)} × ${M(c)} = ${M(D)}. Donc cos = ${M(N)} ÷ ${M(D)} = ${M(N / D)}, et l’angle mesure 120°.`,
    };
  },
};

const F8 = [kaCos, kaDroit, kaA60, kaA120, kaA45, kaA30, kaGrand];
export const LV8 = niveau('Al-Kashi : calculer un angle', F8, {
  n: 8,
  intro: 'On connaît les trois côtés d’un triangle : la formule d’Al-Kashi, « retournée », donne le cosinus d’un angle.',
  def: `Dans un triangle ABC, avec a = BC, b = CA et c = AB :<br><b>cos A = (b<sup>2</sup> + c<sup>2</sup> − a<sup>2</sup>) ÷ (2bc)</b>.<br>Si ce cosinus est une valeur remarquable (0 ; ±0,5 ; ±√2 ÷ 2 ; ±√3 ÷ 2), on en déduit l’angle : cos 60° = 0,5 ; cos 120° = −0,5 ; cos 90° = 0 ; cos 45° = √2 ÷ 2 ; cos 135° = −√2 ÷ 2 ; cos 30° = √3 ÷ 2 ; cos 150° = −√3 ÷ 2.`,
  visuel: `<div class="cols">${figCotes({ t: ['A', 'B', 'C'], c: 3, b: 5, a: 7, tc: '3', tb: '5', ta: '7', th: '?' })}<div class="note">cos A = (5<sup>2</sup> + 3<sup>2</sup> − 7<sup>2</sup>) ÷ (2 × 5 × 3) = (25 + 9 − 49) ÷ 30 = −15 ÷ 30 = −0,5, donc A = 120°.</div></div>`,
  methode: ['Repère l’angle cherché : le côté <b>en face</b> est a, les deux autres côtés b et c l’entourent.', 'Calcule le numérateur b² + c² − a², puis le dénominateur 2bc.', 'Divise (ou simplifie la fraction) : tu obtiens cos de l’angle.', 'Lis l’angle dans le tableau des valeurs remarquables (entre 0° et 180°).'],
  warn: ['Le côté a (celui qui est soustrait) est le côté <b>opposé</b> à l’angle cherché.', 'Un cosinus négatif donne un angle obtus (plus de 90°).', 'Avec un côté en k√2 ou k√3, élève-le au carré : (k√2)² = 2k².'],
  retenir: 'cos A = (b² + c² − a²) ÷ (2bc), puis on lit l’angle (le cosinus est négatif si l’angle est obtus).',
});

/* =====================================================================================================
   Niveau 9 : vecteur normal et équation cartésienne
   ===================================================================================================== */
const D_ = (a, b, c) => ({ a, b, c });
/** fenêtre contenant des points et une droite */
const extPour = pts => { const xs = pts.map(p => p[0]), ys = pts.map(p => p[1]); return [[Math.min(-1, ...xs) - 1, Math.min(-1, ...ys) - 1], [Math.max(1, ...xs) + 1, Math.max(1, ...ys) + 1]]; };
/** réponse : vecteur normal (toute famille proportionnelle est acceptée) */
function rNormal(A, B) {
  const prop = (a, b) => Math.abs(a * B - b * A) < 1e-9 && (a !== 0 || b !== 0);
  const check = v => {
    const [a, b] = v;
    if (prop(a, b)) return { ok: true };
    const dir = Math.abs(a * A + b * B) < 1e-9 && (a !== 0 || b !== 0); // ⟂ au bon vecteur : c'est un directeur
    return { ok: false, msg: dir ? '⚠️ Ce vecteur est un vecteur directeur de la droite (il lui est parallèle), pas un vecteur normal.' : '' };
  };
  check.expected = [A, B];
  return { type: 'nums', tpl: `${V('n')}({0} ; {1})`, check, expected: [A, B], rep: `${V('n')}(<b>${M(A)}</b> ; <b>${M(B)}</b>)`, verify: e => prop(e[0], e[1]) };
}
const vnLire = {
  id: 'vn-lire', dmin: 0, titre: 'lire un vecteur normal',
  draw() { return { a: nz(-6, 6), b: nz(-6, 6), c: nz(-9, 9) }; },
  ex: { a: 3, b: -2, c: 5 },
  build({ a, b, c }) {
    const ex = extPour([[0, 0]]);
    return {
      html: `Dans un repère orthonormé, la droite d a pour équation ${cart(a, b, c)}.<br>Donne les coordonnées d’un vecteur normal à d.`,
      visual: fig({ axes: true, H: 280, aria: `droite d d’équation ${cart(a, b, c).replace(/<[^>]+>/g, '')}`, ext: [[-5, -5], [5, 5]], lines: [{ a, b, c, col: COL.d, l: 'd', at: 0.8 }] }),
      ...rNormal(a, b),
      hint: `Dans une équation ax + by + c = 0, le vecteur de coordonnées (a ; b) est normal à la droite. Repère ici le nombre devant x (${M(a)}) et celui devant y (${M(b)}).`,
      solution: `L’équation est de la forme ax + by + c = 0 avec a = ${M(a)}, b = ${M(b)} et c = ${M(c)}. Un vecteur normal est ${vc('n', [a, b])}. Tout multiple non nul de ce vecteur convient aussi.`,
    };
  },
};

const vnC = {
  id: 'vn-c', dmin: 1, titre: 'trouver c avec un point',
  draw() { return { nm: pick(['A', 'B', 'M', 'K']), A: [nz(-5, 5), ri(-5, 5)], n: [nz(-5, 5), nz(-5, 5)] }; },
  ex: { nm: 'A', A: [2, -1], n: [3, 4] },
  build({ nm, A, n }) {
    const c = -(n[0] * A[0] + n[1] * A[1]);
    if (c === 0) return null;
    return {
      html: `Dans un repère orthonormé, la droite d passe par ${pt0(nm, A)} et ${vc('n', n)} est un vecteur normal à d.<br>Une équation de d est ${terms([[n[0], 'x'], [n[1], 'y']])} + c = 0. Calcule c.`,
      visual: fig({ axes: true, H: 280, aria: `point ${nm} et vecteur normal n`, pts: [{ x: A[0], y: A[1], l: nm }], vecs: [{ x: A[0], y: A[1], dx: n[0], dy: n[1], c: COL.u, l: '{n}', side: -1 }] }),
      ...rNums([c], { tpl: 'c = {0}', value: c, msg: v => (v[0] === -c ? '⚠️ Vérifie le signe : le point doit vérifier l’équation, donc c est l’opposé de ' + (n[0] * A[0] + n[1] * A[1]) + '.' : '') }),
      hint: `Le point ${nm}(${M(A[0])} ; ${M(A[1])}) est sur d : ses coordonnées vérifient l’équation. Remplace x par ${M(A[0])} et y par ${M(A[1])}, puis isole c.`,
      solution: `${nm} est sur d, donc ${terms([[n[0], 'x'], [n[1], 'y']])} + c = 0 pour x = ${M(A[0])} et y = ${M(A[1])} : ${fois(n[0], A[0])} + ${fois(n[1], A[1])} + c = 0. Soit ${M(n[0] * A[0] + n[1] * A[1])} + c = 0, donc c = ${M(c)}.`,
    };
  },
};
const pt0 = (n, A) => nw(`${n}${cp(A[0], A[1])}`);

const vnDirection = {
  id: 'vn-direction', dmin: 1, titre: 'passer d’un vecteur directeur à un vecteur normal',
  draw() { let p, q; do { p = nz(-6, 6); q = nz(-6, 6); } while (Math.abs(p) === Math.abs(q)); return { d: [p, q] }; },
  ex: { d: [3, 4] },
  build({ d }) {
    const [p, q] = d, o = x => nw(`(${M(x[0])}${' '};${' '}${M(x[1])})`);
    const items = [
      { l: o([-q, p]), ok: true },
      { l: o([p, q]), why: 'Ce vecteur est le vecteur directeur lui-même : il est parallèle à la droite, pas perpendiculaire.' },
      { l: o([q, p]), why: 'Échanger les deux coordonnées ne suffit pas : il faut aussi changer un signe. Vérifie que le produit scalaire avec le vecteur directeur est nul.' },
      { l: o([-p, q]), why: 'Changer un seul signe ne suffit pas : calcule le produit scalaire de ce vecteur avec le vecteur directeur, il doit être nul.' },
    ];
    return {
      html: `Dans un repère orthonormé, une droite d a pour vecteur directeur ${vc('u', d)}.<br>Lequel de ces vecteurs est normal à d ?`,
      visual: fig({ axes: true, H: 280, aria: 'droite d et son vecteur directeur', ext: [[-5, -5], [5, 5]], lines: [{ a: -q, b: p, c: 0, col: COL.d, l: 'd', at: 0.8 }], vecs: [{ x: 0, y: 0, dx: p, dy: q, c: COL.u, l: '{u}', side: -1 }] }),
      ...rChoice(items, { indep: items[0].l }),
      hint: `Un vecteur normal est orthogonal au vecteur directeur ${vc('u', d)} : teste chaque choix en calculant son produit scalaire avec ${V('u')} ; celui qui donne 0 est le bon.`,
      solution: `Un vecteur normal ${V('n')} vérifie ${dot(V('n'), V('u'))} = 0. Pour ${V('u')}(${M(p)} ; ${M(q)}), le vecteur ${vc('n', [-q, p])} convient : ${dot(V('n'), V('u'))} = ${comb([-q, p], [p, q])}. Les autres choix donnent un produit scalaire non nul.`,
    };
  },
};

const vnEq = {
  id: 'vn-eq', dmin: 2, titre: 'équation avec un point et un vecteur normal',
  draw() { return { nm: pick(['A', 'B', 'K', 'R']), A: [ri(-5, 5), ri(-5, 5)], n: [nz(-4, 4), nz(-4, 4)] }; },
  ex: { nm: 'A', A: [2, -1], n: [3, 4] },
  build({ nm, A, n }) {
    const c = -(n[0] * A[0] + n[1] * A[1]);
    if (c === 0) return null;
    const ex = xm(A[0], 'x'), ey = xm(A[1], 'y'), s = n[0] * A[0] + n[1] * A[1];
    return {
      html: `Dans un repère orthonormé, la droite d passe par ${pt0(nm, A)} et admet ${vc('n', n)} pour vecteur normal.<br>Donne une équation cartésienne de d.`,
      visual: fig({ axes: true, H: 280, aria: `point ${nm} et vecteur normal n`, pts: [{ x: A[0], y: A[1], l: nm }], vecs: [{ x: A[0], y: A[1], dx: n[0], dy: n[1], c: COL.u, l: '{n}', side: -1 }] }),
      ...rEquation(n[0], n[1], c),
      hint: `Un point M(x ; y) est sur d quand ${vn(nm, 'M')} est orthogonal à ${V('n')}, c’est-à-dire ${dot(vn(nm, 'M'), V('n'))} = 0. Écris les coordonnées de ${vn(nm, 'M')} (x − ${P(A[0])} et y − ${P(A[1])}), puis développe avec ${V('n')}(${M(n[0])} ; ${M(n[1])}).`,
      solution: `M(x ; y) est sur d si ${dot(vn(nm, 'M'), V('n'))} = 0. Ici ${nw(vn(nm, 'M') + cpx(ex, ey))}, donc ${cv(n, [pa(ex), pa(ey)])} = 0. En développant, on obtient ${terms([[n[0], 'x'], [n[1], 'y'], [c, '']])} = 0 : la constante est c = −(a × x<sub>${nm}</sub> + b × y<sub>${nm}</sub>), avec ${calcAn(n, A)}, donc c = ${M(c)}.`,
    };
  },
};

const vnPerp = {
  id: 'vn-perp', dmin: 3, titre: 'perpendiculaire à (BC) passant par A',
  draw() { for (;;) { const A = [ri(-4, 4), ri(-4, 4)], B = [ri(-4, 4), ri(-4, 4)], C = [ri(-4, 4), ri(-4, 4)]; if (!(B[0] === C[0] && B[1] === C[1]) && !(A[0] === B[0] && A[1] === B[1]) && !(A[0] === C[0] && A[1] === C[1]) && n2c(vec(B, C)) <= 40 && BCc(A, B, C)) return { nm: pick(NOMS3), A, B, C }; } },
  ex: { nm: ['A', 'B', 'C'], A: [1, 2], B: [-2, 1], C: [1, 3] },
  build({ nm, A, B, C }) {
    const [nA, nB, nC] = nm, BC = vec(B, C), c = -(BC[0] * A[0] + BC[1] * A[1]);
    if (c === 0) return null;
    return {
      html: `Dans un repère orthonormé, on donne ${pt0(nA, A)}, ${pt0(nB, B)} et ${pt0(nC, C)}.<br>Donne une équation cartésienne de la droite d passant par ${nA} et perpendiculaire à (${nB}${nC}).`,
      visual: fig({ axes: true, H: 300, aria: `points ${nm.join(', ')}`, pts: [{ x: A[0], y: A[1], l: nA }, { x: B[0], y: B[1], l: nB }, { x: C[0], y: C[1], l: nC }], segs: [{ a: B, b: C, c: COL.v, w: 3 }] }),
      ...rEquation(BC[0], BC[1], c),
      hint: `La droite d est perpendiculaire à (${nB}${nC}) : le vecteur ${vn(nB, nC)} est donc normal à d. Calcule ses coordonnées (${M(C[0])} − ${P(B[0])} et ${M(C[1])} − ${P(B[1])}), puis utilise le point ${nA}(${M(A[0])} ; ${M(A[1])}) pour trouver la constante.`,
      solution: `${nw(vn(nB, nC) + cpx(`${M(C[0])} − ${P(B[0])}`, `${M(C[1])} − ${P(B[1])}`))} = ${nw(vn(nB, nC) + cp(BC[0], BC[1]))} est normal à d. Une équation de d est donc ${terms([[BC[0], 'x'], [BC[1], 'y']])} + c = 0. Comme ${nA} est sur d : ${fois(BC[0], A[0])} + ${fois(BC[1], A[1])} + c = 0, soit ${M(BC[0] * A[0] + BC[1] * A[1])} + c = 0 et c = ${M(c)}. Équation : ${cart(BC[0], BC[1], c)}.`,
    };
  },
};
const BCc = (A, B, C) => -(vec(B, C)[0] * A[0] + vec(B, C)[1] * A[1]) !== 0;
const n2c = u => u[0] * u[0] + u[1] * u[1];

const vnMediatrice = {
  id: 'vn-mediatrice', dmin: 4, titre: 'médiatrice d’un segment',
  draw() { for (;;) { const A = [ri(-5, 5), ri(-5, 5)], B = [ri(-5, 5), ri(-5, 5)]; if ((A[0] + B[0]) % 2 === 0 && (A[1] + B[1]) % 2 === 0 && !(A[0] === B[0] && A[1] === B[1]) && n2c(vec(A, B)) <= 50) return { nm: pick(['A', 'B', 'M', 'K']), nm2: pick(['B', 'C', 'N', 'L']), A, B }; } },
  ex: { nm: 'A', nm2: 'B', A: [-1, 4], B: [3, 0] },
  build({ nm, nm2, A, B }) {
    if (nm === nm2) return null;
    const AB = vec(A, B), I = [(A[0] + B[0]) / 2, (A[1] + B[1]) / 2], c = -(AB[0] * I[0] + AB[1] * I[1]);
    if (c === 0) return null;
    return {
      html: `Dans un repère orthonormé, on donne ${pt0(nm, A)} et ${pt0(nm2, B)}.<br>Donne une équation cartésienne de la médiatrice du segment [${nm}${nm2}].`,
      visual: fig({ axes: true, H: 300, aria: `segment [${nm}${nm2}]`, pts: [{ x: A[0], y: A[1], l: nm }, { x: B[0], y: B[1], l: nm2 }], segs: [{ a: A, b: B, c: '#495057' }] }),
      ...rEquation(AB[0], AB[1], c),
      hint: `La médiatrice est perpendiculaire à [${nm}${nm2}] en son milieu I. Ici ${vn(nm, nm2)} est un vecteur normal à la médiatrice ; calcule ses coordonnées, puis les coordonnées du milieu I (moyenne des abscisses, moyenne des ordonnées) qui est sur la droite.`,
      solution: `La médiatrice passe par le milieu I de [${nm}${nm2}] et est perpendiculaire à (${nm}${nm2}). Abscisse de I : ${M(A[0])} + ${P(B[0])} = ${M(A[0] + B[0])}, puis ${M(A[0] + B[0])} ÷ 2 = ${M(I[0])}. Ordonnée de I : ${M(A[1])} + ${P(B[1])} = ${M(A[1] + B[1])}, puis ${M(A[1] + B[1])} ÷ 2 = ${M(I[1])}. Donc I${cp(I[0], I[1])}. Le vecteur ${nw(vn(nm, nm2) + cp(AB[0], AB[1]))} est normal à la médiatrice : ${terms([[AB[0], 'x'], [AB[1], 'y']])} + c = 0. I est sur la droite : ${calcAn(AB, I).replace(/ = .*$/, '')} + c = 0, soit ${M(AB[0] * I[0] + AB[1] * I[1])} + c = 0 et c = ${M(c)}. Équation : ${cart(AB[0], AB[1], c)}.`,
    };
  },
};

const vnParallele = {
  id: 'vn-parallele', dmin: 5, titre: 'parallèle à une droite donnée',
  draw() { return { nm: pick(['A', 'B', 'M', 'K']), A: [ri(-5, 5), ri(-5, 5)], a: nz(-4, 4), b: nz(-4, 4), c: nz(-8, 8) }; },
  ex: { nm: 'A', A: [2, 1], a: 2, b: -3, c: 5 },
  build({ nm, A, a, b, c }) {
    const c2 = -(a * A[0] + b * A[1]);
    if (c2 === c || c2 === 0) return null;
    return {
      html: `Dans un repère orthonormé, la droite d a pour équation ${cart(a, b, c)}. Donne une équation de la droite d′ parallèle à d passant par ${pt0(nm, A)}.`,
      visual: fig({ axes: true, H: 280, aria: `droite d et point ${nm}`, ext: [[-5, -5], [5, 5], A], lines: [{ a, b, c, col: COL.d, l: 'd', at: 0.8 }], pts: [{ x: A[0], y: A[1], l: nm }] }),
      ...rEquation(a, b, c2),
      hint: `Deux droites parallèles ont le même vecteur normal ${vc('n', [a, b])} (lu dans l’équation de d). Garde ${M(a)} et ${M(b)} comme coefficients de x et de y, puis choisis la constante pour que le point ${nm}(${M(A[0])} ; ${M(A[1])}) soit sur d′.`,
      solution: `d et d′ sont parallèles : elles ont le même vecteur normal ${vc('n', [a, b])}, donc d′ a une équation ${terms([[a, 'x'], [b, 'y']])} + c′ = 0. Comme ${nm} est sur d′ : ${fois(a, A[0])} + ${fois(b, A[1])} + c′ = 0, soit ${M(a * A[0] + b * A[1])} + c′ = 0 et c′ = ${M(c2)}. Équation de d′ : ${cart(a, b, c2)}.`,
    };
  },
};

const F9 = [vnLire, vnC, vnDirection, vnEq, vnPerp, vnMediatrice, vnParallele];
export const LV9 = niveau('Vecteur normal et équation de droite', F9, {
  n: 9,
  intro: 'Un vecteur normal à une droite dit tout d’elle, ou presque : avec un point, il donne son équation.',
  def: `Un <b>vecteur normal</b> à une droite d est un vecteur non nul orthogonal à d.<br>Si ${V('n')}(a ; b) est normal à d et si A est un point de d : M(x ; y) ∈ d ⇔ ${dot(V('AM'), V('n'))} = 0, ce qui donne une équation <b>ax + by + c = 0</b> (équation cartésienne).<br>Réciproquement, dans ax + by + c = 0, le vecteur ${V('n')}(a ; b) est normal à la droite et ${V('u')}(−b ; a) est directeur.`,
  visuel: fig({ axes: true, H: 290, aria: 'droite d, point A et vecteur normal n(2 ; 1)', ext: [[-4, -3], [5, 4]], lines: [{ a: 2, b: 1, c: -4, col: COL.d, l: 'd', at: 0.15 }], pts: [{ x: 1, y: 2, l: 'A' }], vecs: [{ x: 1, y: 2, dx: 2, dy: 1, c: COL.u, l: '{n}', side: 1 }], right: [{ at: [1, 2], u: [2, 1], v: [-1, 2] }] }),
  methode: ['Identifie un <b>vecteur normal</b> n(a ; b) (lu dans l’équation, ou calculé : BC si d ⟂ (BC), AB pour la médiatrice de [AB]).', 'Écris ax + by + c = 0 avec les coefficients a et b de n.', 'Remplace x et y par les coordonnées d’un point de la droite (A, ou le milieu I) : tu obtiens c.', 'Vérifie : le point connu doit vérifier l’équation.'],
  warn: ['Les coefficients a et b sont ceux d’un vecteur <b>normal</b>, pas directeur : le directeur est (−b ; a).', 'Une médiatrice passe par le <b>milieu</b> du segment (pas par une extrémité).', 'Deux droites parallèles ont le même vecteur normal (à un multiple près).'],
  retenir: 'Un vecteur normal n(a ; b) et un point A donnent la droite ax + by + c = 0, avec c = −(a·xA + b·yA).',
});

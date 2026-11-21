// Niveaux 10 à 12 : projeté orthogonal d'un point sur une droite ; équation de cercle ; défis (cercle de diamètre [AB]…).
import {
  ri, pick, nz, chance, M, P, F, terms, niveau, rNums, rChoice, rOuiNon, rEquation, V, vc, dot, nw, cp, cpx, fois, kRac, cart, cercle, cercleDev,
  NOMS3, TRIPLES, sc, vec, gcd, somme, cv, xm, calcAn, plus, pa,
} from './outils.js';
import { fig, COL } from './draw.js';
import { rootsCheck } from '../../engine/answers/checks.js';

const vn = (A, B) => V(A + B);
const pt0 = (n, A) => nw(`${n}${cp(A[0], A[1])}`);
const sup2 = a => `${a}<sup>2</sup>`;
const carreP = a => `${P(a)}<sup>2</sup>`;
/** a x + b y + c calculé en (x ; y) : « 2 × 3 + 1 × (−1) − 5 = 6 − 1 − 5 = 0 » */
const valEq = (a, b, c, x, y) => {
  const v = a * x + b * y + c;
  return `${fois(a, x)} + ${fois(b, y)} ${c < 0 ? '− ' + M(-c) : '+ ' + M(c)} = ${somme([a * x, b * y, c])} = ${M(v)}`;
};
/** valeur d'un tableau de nombres à ± 1e-9 */
const nul = v => Math.abs(v) < 1e-9;
const coin = (pts, extra = []) => { const xs = [...pts.map(p => p[0]), ...extra.map(p => p[0])], ys = [...pts.map(p => p[1]), ...extra.map(p => p[1])]; return [[Math.min(...xs, -1) - 1, Math.min(...ys, -1) - 1], [Math.max(...xs, 1) + 1, Math.max(...ys, 1) + 1]]; };

/* =====================================================================================================
   Niveau 10 : projeté orthogonal d'un point sur une droite
   ===================================================================================================== */
const NORMALES = [[1, 1], [1, 2], [2, 1], [1, -1], [2, -1], [1, -2], [3, 1], [1, 3], [3, -1], [1, -3], [2, 3], [3, 2], [3, -2], [2, -3]];
/** résolution rédigée : H = M + t n, avec n(a ; b) normal à la droite ax + by + c = 0 */
function solutionPj(nM, M0, a, b, c, t, H, d = 'd') {
  const v = a * M0[0] + b * M0[1] + c, w = a * a + b * b;
  const ct = (k0, k) => (k0 === 0 ? terms([[k, 't']]) : `${M(k0)} ${k < 0 ? '−' : '+'} ${Math.abs(k) === 1 ? '' : M(Math.abs(k))}t`);
  const X = ct(M0[0], a), Y = ct(M0[1], b);
  const lead = (k, e) => (k === 1 ? pa(e) : `${P(k)} × ${pa(e)}`);
  const eq = `${lead(a, X)} + ${lead(b, Y)} ${c < 0 ? '−' : '+'} ${M(Math.abs(c))} = 0`;
  return `Le vecteur ${vc('n', [a, b])} est normal à ${d}. Le projeté H vérifie : ${vn(nM, 'H')} est colinéaire à ${V('n')}, donc H = ${nM} + t ${V('n')}, soit H${cpx(X, Y)}. H est sur ${d} : ${eq}. En développant, on regroupe les termes constants et les termes en t : (a × x<sub>${nM}</sub> + b × y<sub>${nM}</sub> + c) + (a<sup>2</sup> + b<sup>2</sup>) × t = 0. Calculs : ${valEq(a, b, c, M0[0], M0[1])} et a<sup>2</sup> + b<sup>2</sup> = ${M(a * a)} + ${M(b * b)} = ${M(w)}. D’où ${M(v)} + ${M(w)}t = 0 et t = ${M(-v)} ÷ ${M(w)} = ${M(t)}. Alors H${cpx(`${M(M0[0])} + ${P(t)} × ${P(a)}`, `${M(M0[1])} + ${P(t)} × ${P(b)}`)} = H${cp(H[0], H[1])}.`;
}

const pjAxes = {
  id: 'pj-axes', dmin: 0, titre: 'droite horizontale ou verticale',
  draw() { return { nm: pick(['M', 'N', 'P', 'K']), Pt: [ri(-6, 6), ri(-6, 6)], k: ri(-5, 5), horiz: chance(0.5) }; },
  ex: { nm: 'M', Pt: [3, 5], k: 2, horiz: true },
  build({ nm, Pt, k, horiz }) {
    const H = horiz ? [Pt[0], k] : [k, Pt[1]];
    if (H[0] === Pt[0] && H[1] === Pt[1]) return null;
    const eq = horiz ? `y = ${M(k)}` : `x = ${M(k)}`, ln = horiz ? { a: 0, b: 1, c: -k } : { a: 1, b: 0, c: -k };
    const base = { axes: true, H: 280, ext: [[-7, -7], [7, 7], Pt, H] };
    return {
      html: `Dans un repère orthonormé, on donne ${pt0(nm, Pt)} et la droite d d’équation ${eq}.<br>Donne les coordonnées du projeté orthogonal H de ${nm} sur d.`,
      visual: fig({ ...base, aria: `point ${nm} et droite d : ${eq}`, pts: [{ x: Pt[0], y: Pt[1], l: nm }], lines: [{ ...ln, col: COL.d, l: 'd', at: 0.9 }] }),
      afterVisual: fig({ ...base, aria: `point ${nm}, droite d et projeté H`, pts: [{ x: Pt[0], y: Pt[1], l: nm }, { x: H[0], y: H[1], l: 'H', c: COL.h }], lines: [{ ...ln, col: COL.d, l: 'd', at: 0.9 }], segs: [{ a: Pt, b: H, c: COL.h, dash: true, w: 2.4 }] }),
      ...rNums(H, { tpl: 'H({0} ; {1})', value: H[1] }),
      hint: `La droite d d’équation ${eq} est ${horiz ? 'horizontale' : 'verticale'} : la perpendiculaire à d passant par ${nm}(${M(Pt[0])} ; ${M(Pt[1])}) est donc ${horiz ? 'verticale' : 'horizontale'}. Regarde quelle coordonnée de ${nm} est conservée et laquelle est remplacée par ${M(k)}.`,
      solution: `La droite d (${eq}) est ${horiz ? 'horizontale' : 'verticale'}. La perpendiculaire à d passant par ${nm} est ${horiz ? 'verticale, d’équation x = ' + M(Pt[0]) : 'horizontale, d’équation y = ' + M(Pt[1])}. Elle coupe d en H${cp(H[0], H[1])} : ${horiz ? `H a la même abscisse que ${nm} et son ordonnée vaut ${M(k)}` : `H a la même ordonnée que ${nm} et son abscisse vaut ${M(k)}`}.`,
    };
  },
};

const pjVerif = {
  id: 'pj-verif', dmin: 1, titre: 'H est-il le projeté de M ?',
  draw() {
    for (let i = 0; i < 300; i++) {
      const [a, b] = pick(NORMALES), Hh = [ri(-4, 4), ri(-4, 4)], c = -(a * Hh[0] + b * Hh[1]);
      const t = nz(-3, 3), cas = pick(['ok', 'non1', 'non2']);
      const Mp = [Hh[0] + t * a, Hh[1] + t * b];
      let H2 = Hh;
      if (cas === 'non1') { const s = nz(-2, 2); H2 = [Hh[0] - s * b, Hh[1] + s * a]; }
      if (cas === 'non2') { const s = pick([-1, 1]) * ri(1, 2); H2 = [Hh[0] + s * a, Hh[1] + s * b]; if (H2[0] === Mp[0] && H2[1] === Mp[1]) continue; }
      if ([...Mp, ...H2].some(v => Math.abs(v) > 8) || c === 0) continue;
      return { nm: pick(['M', 'N', 'K']), a, b, c, Mp, H: H2 };
    }
    return { nm: 'M', a: 2, b: 1, c: -5, Mp: [3, 4], H: [2, 1] };
  },
  ex: { nm: 'M', a: 2, b: 1, c: -5, Mp: [5, 2], H: [3, 1] },
  build({ nm, a, b, c, Mp, H }) {
    const onD = nul(a * H[0] + b * H[1] + c), MH = vec(Mp, H), u = [-b, a], perp = nul(sc(MH, u)), ok = onD && perp;
    return {
      html: `Dans un repère orthonormé, la droite d a pour équation ${cart(a, b, c)}. On donne ${pt0(nm, Mp)} et ${pt0('H', H)}.<br>Le point H est-il le projeté orthogonal de ${nm} sur d ?`,
      visual: fig({ axes: true, H: 300, aria: `droite d, points ${nm} et H`, ext: coin([Mp, H]), lines: [{ a, b, c, col: COL.d, l: 'd', at: 0.9 }], pts: [{ x: Mp[0], y: Mp[1], l: nm }, { x: H[0], y: H[1], l: 'H', c: COL.h }] }),
      ...rOuiNon(ok, 'Vérifie les deux conditions : H est sur d et le vecteur MH est perpendiculaire à d. Ici elles sont bien toutes les deux vraies.', 'Vérifie les deux conditions : H est sur d et le vecteur MH est perpendiculaire à d. L’une des deux est fausse.'),
      hint: `Il faut deux choses : (1) H est sur d, donc ses coordonnées vérifient ${cart(a, b, c)} ; (2) ${vn(nm, 'H')} est perpendiculaire à d, donc orthogonal à un vecteur directeur ${vc('u', u)}. Teste d’abord (1) avec H(${M(H[0])} ; ${M(H[1])}).`,
      solution: `(1) H est-il sur d ? ${valEq(a, b, c, H[0], H[1])}. ${onD ? `Oui, H est sur d. (2) ${nw(vn(nm, 'H') + cp(MH[0], MH[1]))} doit être orthogonal à ${vc('u', u)}, vecteur directeur de d : ${dot(vn(nm, 'H'), V('u'))} = ${calcAn(MH, u)}. ${perp ? `Le produit est nul : H est bien le projeté orthogonal de ${nm} sur d.` : `Le produit n’est pas nul : ${vn(nm, 'H')} n’est pas perpendiculaire à d, donc H n’est pas le projeté.`}` : `Le résultat n’est pas nul : H n’est pas sur d, donc ce n’est pas le projeté.`}`,
    };
  },
};

const pjDroite = {
  id: 'pj-droite', dmin: 2, titre: 'projeté sur ax + by + c = 0',
  draw() {
    for (let i = 0; i < 300; i++) {
      const [a, b] = pick(NORMALES), H = [ri(-4, 4), ri(-4, 4)], t = nz(-3, 3), c = -(a * H[0] + b * H[1]);
      const Mp = [H[0] + t * a, H[1] + t * b];
      if (Mp.some(v => Math.abs(v) > 8) || c === 0) continue;
      return { nm: pick(['M', 'N', 'K']), a, b, c, t, H, Mp };
    }
    return { nm: 'M', a: 2, b: 1, c: -5, t: 1, H: [2, 1], Mp: [4, 2] };
  },
  ex: { nm: 'M', a: 2, b: 1, c: -5, t: 1, H: [2, 1], Mp: [4, 2] },
  build({ nm, a, b, c, t, H, Mp }) {
    const v = a * Mp[0] + b * Mp[1] + c, w = a * a + b * b;
    return {
      html: `Dans un repère orthonormé, la droite d a pour équation ${cart(a, b, c)} et ${pt0(nm, Mp)}.<br>Détermine les coordonnées du projeté orthogonal H de ${nm} sur d.`,
      visual: fig({ axes: true, H: 300, aria: `droite d et point ${nm}`, ext: coin([Mp, H]), lines: [{ a, b, c, col: COL.d, l: 'd', at: 0.9 }], pts: [{ x: Mp[0], y: Mp[1], l: nm }] }),
      afterVisual: fig({ axes: true, H: 300, aria: `droite d, point ${nm} et projeté H`, ext: coin([Mp, H]), lines: [{ a, b, c, col: COL.d, l: 'd', at: 0.9 }], pts: [{ x: Mp[0], y: Mp[1], l: nm }, { x: H[0], y: H[1], l: 'H', c: COL.h }], segs: [{ a: Mp, b: H, c: COL.h, dash: true, w: 2.4 }] }),
      ...rNums(H, { tpl: 'H({0} ; {1})', value: H[1], msg: x => (x[0] === Mp[0] - t * a * 2 ? '' : '') }),
      verify: e => nul(a * e[0] + b * e[1] + c) && nul((e[0] - Mp[0]) * b - (e[1] - Mp[1]) * a),
      hint: `Lis un vecteur normal dans l’équation de d : ${vc('n', [a, b])}. Le projeté H est sur la perpendiculaire à d passant par ${nm}, donc H = ${nm} + t ${V('n')} pour un réel t. Exprime les coordonnées de H en fonction de t, puis écris que H est sur d.`,
      solution: solutionPj(nm, Mp, a, b, c, -v / w, H),
    };
  },
};

const pjDir = {
  id: 'pj-dir', dmin: 3, titre: 'droite donnée par un point et un vecteur directeur',
  draw() {
    for (let i = 0; i < 300; i++) {
      const u = pick(NORMALES), A = [ri(-4, 4), ri(-4, 4)], k = nz(-3, 3), t = nz(-2, 2);
      const H = [A[0] + k * u[0], A[1] + k * u[1]], Mp = [H[0] - t * u[1], H[1] + t * u[0]];
      if ([...H, ...Mp].some(v => Math.abs(v) > 8)) continue;
      return { nm: pick(['M', 'N', 'K']), nA: pick(['A', 'B', 'C']), A, u, k, H, Mp };
    }
    return { nm: 'M', nA: 'A', A: [1, 0], u: [2, 1], k: 1, H: [3, 1], Mp: [2, 3] };
  },
  ex: { nm: 'M', nA: 'A', A: [1, 0], u: [2, 1], k: 2, H: [5, 2], Mp: [3, 6] },
  build({ nm, nA, A, u, k, H, Mp }) {
    const AM = vec(A, Mp), s = sc(AM, u), w = sc(u, u);
    return {
      html: `Dans un repère orthonormé, la droite d passe par ${pt0(nA, A)} et a pour vecteur directeur ${vc('u', u)}. On donne ${pt0(nm, Mp)}.<br>Détermine les coordonnées du projeté orthogonal H de ${nm} sur d.`,
      visual: fig({ axes: true, H: 300, aria: `droite d, point ${nA} et point ${nm}`, ext: coin([Mp, H, A]), lines: [{ a: -u[1], b: u[0], c: u[1] * A[0] - u[0] * A[1], col: COL.d, l: 'd', at: 0.9 }], pts: [{ x: A[0], y: A[1], l: nA }, { x: Mp[0], y: Mp[1], l: nm }] }),
      afterVisual: fig({ axes: true, H: 300, aria: `droite d, points ${nA}, ${nm} et projeté H`, ext: coin([Mp, H, A]), lines: [{ a: -u[1], b: u[0], c: u[1] * A[0] - u[0] * A[1], col: COL.d, l: 'd', at: 0.9 }], pts: [{ x: A[0], y: A[1], l: nA }, { x: Mp[0], y: Mp[1], l: nm }, { x: H[0], y: H[1], l: 'H', c: COL.h }], segs: [{ a: Mp, b: H, c: COL.h, dash: true, w: 2.4 }] }),
      ...rNums(H, { tpl: 'H({0} ; {1})', value: H[1] }),
      verify: e => nul(sc(vec(Mp, e), u)) && nul((e[0] - A[0]) * u[1] - (e[1] - A[1]) * u[0]),
      hint: `H est sur d, donc ${vn(nA, 'H')} = k ${V('u')} pour un réel k. Comme ${vn(nm, 'H')} est orthogonal à ${V('u')}, on a ${dot(vn(nA, 'H'), V('u'))} = ${dot(vn(nA, nm), V('u'))} : calcule ${dot(vn(nA, nm), V('u'))} et ${dot(V('u'), V('u'))} avec ${V('u')}(${M(u[0])} ; ${M(u[1])}), puis déduis k.`,
      solution: `H est sur d : ${vn(nA, 'H')} = k ${V('u')}. De plus ${vn(nm, 'H')} ⟂ ${V('u')}, donc ${dot(vn(nA, 'H'), V('u'))} = ${dot(vn(nA, nm), V('u'))} (projection). Or ${dot(vn(nA, 'H'), V('u'))} = k ${dot(V('u'), V('u'))}. ${nw(vn(nA, nm) + cp(AM[0], AM[1]))} : ${dot(vn(nA, nm), V('u'))} = ${calcAn(AM, u)}, et ${dot(V('u'), V('u'))} = ${calcAn(u, u)}. Donc k = ${M(s)} ÷ ${M(w)} = ${M(k)}. Alors H = ${nA} + k ${V('u')} : H${cpx(`${M(A[0])} + ${P(k)} × ${P(u[0])}`, `${M(A[1])} + ${P(k)} × ${P(u[1])}`)} = H${cp(H[0], H[1])}.`,
    };
  },
};

const pjPied = {
  id: 'pj-pied', dmin: 4, titre: 'pied d’une hauteur d’un triangle',
  draw() {
    for (let i = 0; i < 300; i++) {
      const u = pick(NORMALES), B = [ri(-4, 4), ri(-4, 4)], k = nz(-2, 3), t = nz(-2, 2);
      const C = [B[0] + u[0], B[1] + u[1]], H = [B[0] + k * u[0], B[1] + k * u[1]], Ap = [H[0] - t * u[1], H[1] + t * u[0]];
      if ([...C, ...H, ...Ap].some(v => Math.abs(v) > 8) || (Ap[0] === B[0] && Ap[1] === B[1]) || (Ap[0] === C[0] && Ap[1] === C[1])) continue;
      return { nm: pick(NOMS3), B, C, k, H, Ap };
    }
    return { nm: ['A', 'B', 'C'], B: [0, 0], C: [2, 1], k: 1, H: [2, 1], Ap: [0, 3] };
  },
  ex: { nm: ['A', 'B', 'C'], B: [-1, 0], C: [1, 1], k: 2, H: [3, 2], Ap: [2, 4] },
  build({ nm, B, C, k, H, Ap }) {
    const [nA, nB, nC] = nm, BC = vec(B, C), BA = vec(B, Ap), s = sc(BA, BC), w = sc(BC, BC);
    return {
      html: `Dans un repère orthonormé, on donne ${pt0(nA, Ap)}, ${pt0(nB, B)} et ${pt0(nC, C)}.<br>Détermine les coordonnées du pied H de la hauteur issue de ${nA} dans le triangle ${nm.join('')}.`,
      visual: fig({ axes: true, H: 300, aria: `triangle ${nm.join('')}`, ext: coin([Ap, B, C, H]), pts: [{ x: Ap[0], y: Ap[1], l: nA }, { x: B[0], y: B[1], l: nB }, { x: C[0], y: C[1], l: nC }], poly: [Ap, B, C], segs: [{ a: B, b: C, c: '#495057' }, { a: Ap, b: B, c: '#495057' }, { a: Ap, b: C, c: '#495057' }] }),
      ...rNums(H, { tpl: 'H({0} ; {1})', value: H[1] }),
      verify: e => nul(sc(vec(Ap, e), BC)) && nul((e[0] - B[0]) * BC[1] - (e[1] - B[1]) * BC[0]),
      hint: `Le pied H de la hauteur issue de ${nA} est le projeté orthogonal de ${nA} sur la droite (${nB}${nC}). Il vérifie ${vn(nB, 'H')} = k ${vn(nB, nC)} et ${dot(vn(nB, 'H'), vn(nB, nC))} = ${dot(vn(nB, nA), vn(nB, nC))} : calcule ${dot(vn(nB, nA), vn(nB, nC))} et ${dot(vn(nB, nC), vn(nB, nC))} puis déduis k.`,
      solution: `H est le projeté de ${nA} sur (${nB}${nC}) : ${vn(nB, 'H')} = k ${vn(nB, nC)}, et ${dot(vn(nB, 'H'), vn(nB, nC))} = ${dot(vn(nB, nA), vn(nB, nC))} (projection). Or ${dot(vn(nB, 'H'), vn(nB, nC))} = k ${dot(vn(nB, nC), vn(nB, nC))}. On a ${nw(vn(nB, nC) + cp(BC[0], BC[1]))} et ${nw(vn(nB, nA) + cp(BA[0], BA[1]))} : ${dot(vn(nB, nA), vn(nB, nC))} = ${calcAn(BA, BC)} et ${dot(vn(nB, nC), vn(nB, nC))} = ${calcAn(BC, BC)}. Donc k = ${M(s)} ÷ ${M(w)} = ${M(k)}, puis H${cpx(`${M(B[0])} + ${P(k)} × ${P(BC[0])}`, `${M(B[1])} + ${P(k)} × ${P(BC[1])}`)} = H${cp(H[0], H[1])}.`,
    };
  },
};

const pjReduite = {
  id: 'pj-reduite', dmin: 5, titre: 'droite donnée par y = mx + p',
  draw() {
    for (let i = 0; i < 300; i++) {
      const m = pick([1, 2, 3, -1, -2, -3]), H = [ri(-3, 3), ri(-4, 4)], p = H[1] - m * H[0], t = nz(-2, 2);
      const Mp = [H[0] + t * m, H[1] - t];
      if (Mp.some(v => Math.abs(v) > 8) || p === 0 || Math.abs(p) > 7) continue;
      return { nm: pick(['M', 'N', 'K']), m, p, H, Mp, t };
    }
    return { nm: 'M', m: 2, p: -1, H: [1, 1], Mp: [3, 0], t: 1 };
  },
  ex: { nm: 'M', m: 2, p: -1, H: [1, 1], Mp: [3, 0], t: 1 },
  build({ nm, m, p, H, Mp }) {
    const eq = `y = ${terms([[m, 'x'], [p, '']])}`, a = m, b = -1, c = p, v = a * Mp[0] + b * Mp[1] + c, w = a * a + b * b;
    return {
      html: `Dans un repère orthonormé, la droite d a pour équation ${eq} et ${pt0(nm, Mp)}.<br>Détermine les coordonnées du projeté orthogonal H de ${nm} sur d.`,
      visual: fig({ axes: true, H: 300, aria: `droite d : ${eq} et point ${nm}`, ext: coin([Mp, H]), lines: [{ a, b, c, col: COL.d, l: 'd', at: 0.9 }], pts: [{ x: Mp[0], y: Mp[1], l: nm }] }),
      ...rNums(H, { tpl: 'H({0} ; {1})', value: H[1] }),
      verify: e => nul(a * e[0] + b * e[1] + c) && nul((e[0] - Mp[0]) * b - (e[1] - Mp[1]) * a),
      hint: `Commence par écrire l’équation de d sous la forme ax + by + c = 0 (passe y de l’autre côté), pour lire un vecteur normal. Le projeté H vérifie alors H = ${nm} + t ${V('n')} avec H sur d.`,
      solution: `${eq} équivaut à ${cart(a, b, c)} : un vecteur normal est ${vc('n', [a, b])}. ${solutionPj(nm, Mp, a, b, c, -v / w, H)}`,
    };
  },
};

const F10 = [pjAxes, pjVerif, pjDroite, pjDir, pjPied, pjReduite];
export const LV10 = niveau('Projeté orthogonal d’un point sur une droite', F10, {
  n: 10,
  intro: 'Le projeté orthogonal H d’un point M sur une droite d est le point de d le plus proche de M : (MH) est perpendiculaire à d.',
  def: `Le <b>projeté orthogonal</b> de M sur la droite d est l’unique point H de d tel que ${V('MH')} soit <b>orthogonal</b> à d.<br>Méthode en repère orthonormé : avec un vecteur normal ${V('n')}(a ; b) de d, on cherche H sous la forme <b>H = M + t ${V('n')}</b> ; on écrit que H est sur d pour trouver t.<br>Si d est donnée par un point A et un vecteur directeur ${V('u')} : ${V('AH')} = k ${V('u')} avec <b>k = ${dot(V('AM'), V('u'))} ÷ ${dot(V('u'), V('u'))}</b>.`,
  visuel: fig({ axes: true, H: 290, aria: 'droite d, point M et projeté orthogonal H', ext: [[-3, -2], [6, 6]], lines: [{ a: 2, b: 1, c: -5, col: COL.d, l: 'd', at: 0.9 }], pts: [{ x: 4, y: 4, l: 'M' }, { x: 2, y: 1, l: 'H', c: COL.h }], segs: [{ a: [4, 4], b: [2, 1], c: COL.h, dash: true, w: 2.4 }], right: [{ at: [2, 1], u: [1, -2], v: [2, 3] }] }),
  methode: ['Lis un vecteur normal ${V(\'n\')} de d (coefficients a et b de ax + by + c = 0) — ou un vecteur directeur si d est donnée ainsi.'.replace('${V(\'n\')}', V('n')), 'Écris H = M + t n (ou H = A + k u) : les coordonnées de H dépendent d’un seul réel.', 'Écris que H est sur d (ou que MH est orthogonal à d) et résous l’équation d’inconnue t (ou k).', 'Calcule les coordonnées de H, puis vérifie : H est sur d et MH est perpendiculaire à d.'],
  warn: ['Le vecteur normal a pour coordonnées (a ; b), le vecteur directeur (−b ; a) : ne pas les confondre.', 'Sur une droite horizontale y = k (ou verticale x = k), pas de calcul : on garde une coordonnée de M et l’autre devient k.', 'Vérifie ton résultat : remplace dans l’équation de d.'],
  retenir: 'H = M + t n avec n normal à d, où t est choisi pour que H soit sur d.',
});

/* =====================================================================================================
   Niveau 11 : équation de cercle
   ===================================================================================================== */
const crc = (a, b, r) => cercle(a, b, r * r);
const OMEGA = 'Ω';
/** cercles dont plusieurs points sont à coordonnées entières relatives au centre */
const CERC = TRIPLES.slice(0, 7).map(([p, q, r]) => ({ p, q, r }));

const ceLire = {
  id: 'ce-lire', dmin: 0, titre: 'lire le centre et le rayon',
  draw() { return { a: ri(-6, 6), b: ri(-6, 6), r: ri(1, 9) }; },
  ex: { a: 2, b: -3, r: 5 },
  build({ a, b, r }) {
    return {
      html: `Dans un repère orthonormé, le cercle 𝒞 a pour équation ${crc(a, b, r)}.<br>Donne les coordonnées de son centre Ω et son rayon r.`,
      visual: fig({ axes: true, H: 300, aria: `cercle de centre Ω(${a} ; ${b})`, circles: [{ x: a, y: b, r, c: COL.d }], pts: [{ x: a, y: b, l: OMEGA, c: COL.p }], ext: [[a - r - 1, b - r - 1], [a + r + 1, b + r + 1]], W: 420, H: 300 }),
      ...rNums([a, b, r], { tpl: `Ω({0} ; {1}) et r = {2}`, value: r, msg: v => (v[0] === -a && v[1] === -b && (a || b) ? '⚠️ Attention aux signes : (x − 2)² a pour centre d’abscisse +2, et (y + 3)² pour ordonnée −3.' : v[2] === r * r ? '⚠️ Le nombre à droite du signe égal est r², le carré du rayon : le rayon est sa racine carrée.' : '') }),
      hint: `L’équation est de la forme (x − a)² + (y − b)² = r². Pour le centre, lis les nombres dans les parenthèses (en changeant leur signe) ; ${M(r * r)} est le carré du rayon : cherche le nombre positif dont le carré vaut ${M(r * r)}.`,
      solution: `On compare avec (x − a)² + (y − b)² = r². ${xm(a, 'x') === 'x' ? 'Comme x² s’écrit (x − 0)², a = 0. ' : `(${xm(a, 'x')})² donne a = ${M(a)}. `}${xm(b, 'y') === 'y' ? 'Comme y² s’écrit (y − 0)², b = 0. ' : `(${xm(b, 'y')})² donne b = ${M(b)}. `}Donc le centre est Ω${cp(a, b)}. Enfin r² = ${M(r * r)}, donc r = √${M(r * r)} = ${M(r)}.`,
    };
  },
};

const ceEcrire = {
  id: 'ce-ecrire', dmin: 1, titre: 'écrire l’équation (centre et rayon)',
  draw() { return { a: ri(-6, 6), b: ri(-6, 6), r: ri(2, 9) }; },
  ex: { a: 2, b: -3, r: 5 },
  build({ a, b, r }) {
    const t = `${(x => (a === 0 ? 'x<sup>2</sup>' : `(x ${a > 0 ? '−' : '+'} ${M(Math.abs(a))})<sup>2</sup>`))()} + ${b === 0 ? 'y<sup>2</sup>' : `(y ${b > 0 ? '−' : '+'} ${M(Math.abs(b))})<sup>2</sup>`} = {0}`;
    return {
      html: `Dans un repère orthonormé, le cercle 𝒞 a pour centre ${pt0(OMEGA, [a, b])} et pour rayon ${M(r)}.<br>Complète son équation :`,
      visual: fig({ axes: true, H: 300, aria: `cercle de centre Ω(${a} ; ${b}) et de rayon ${r}`, circles: [{ x: a, y: b, r, c: COL.d }], pts: [{ x: a, y: b, l: OMEGA, c: COL.p }], segs: [{ a: [a, b], b: [a + r, b], c: COL.v, w: 2.6, lab: `r = ${M(r)}`, side: 1 }], ext: [[a - r - 1, b - r - 1], [a + r + 1, b + r + 1]] }),
      ...rNums([r * r], { tpl: t, value: r * r, msg: v => (v[0] === r ? '⚠️ À droite du signe égal, il faut le <b>carré</b> du rayon, r², et non r.' : '') }),
      hint: `L’équation d’un cercle de centre Ω(a ; b) et de rayon r est (x − a)² + (y − b)² = r². Ici le centre est donné ; calcule r² avec r = ${M(r)}.`,
      solution: `Pour un cercle de centre Ω(a ; b) et de rayon r : (x − a)² + (y − b)² = r². Avec a = ${M(a)}, b = ${M(b)} et r = ${M(r)}, on a r² = ${M(r)} × ${M(r)} = ${M(r * r)}. Équation : ${crc(a, b, r)}.`,
    };
  },
};

const cePoint = {
  id: 'ce-point', dmin: 1, titre: 'un point est-il sur le cercle ?',
  draw() {
    const T = pick(CERC), ok = chance(0.5), a = ri(-4, 4), b = ri(-4, 4), sx = pick([1, -1]), sy = pick([1, -1]), sw = chance(0.5);
    let dx = sx * (sw ? T.q : T.p), dy = sy * (sw ? T.p : T.q);
    if (!ok) { if (chance(0.5)) dx += pick([-1, 1]); else dy += pick([-1, 1]); }
    return { nm: pick(['A', 'B', 'M', 'N']), a, b, r: T.r, dx, dy };
  },
  ex: { nm: 'A', a: 2, b: -3, r: 5, dx: 3, dy: 4 },
  build({ nm, a, b, r, dx, dy }) {
    const X = a + dx, Y = b + dy, ok = dx * dx + dy * dy === r * r;
    if ([a, b, X, Y].some(v => Math.abs(v) > 11)) return null;
    const l1 = `${P(X)} − ${P(a)}`, l2 = `${P(Y)} − ${P(b)}`;
    return {
      html: `Dans un repère orthonormé, le cercle 𝒞 a pour équation ${crc(a, b, r)}. Le point ${pt0(nm, [X, Y])} appartient-il à 𝒞 ?`,
      visual: fig({ axes: true, H: 300, aria: `cercle de centre (${a} ; ${b}) et point ${nm}`, circles: [{ x: a, y: b, r, c: COL.d }], pts: [{ x: X, y: Y, l: nm }, { x: a, y: b, l: OMEGA, c: COL.p }], ext: [[a - r - 1, b - r - 1], [a + r + 1, b + r + 1]] }),
      ...rOuiNon(ok, `Remplace x et y par les coordonnées de ${nm} : tu dois retrouver ${M(r * r)}, et c’est bien le cas.`, `Remplace x et y par les coordonnées de ${nm} : tu ne trouves pas ${M(r * r)}.`),
      hint: `Un point est sur le cercle si ses coordonnées vérifient l’équation. Remplace x par ${M(X)} et y par ${M(Y)} dans (x − ${P(a)})² + (y − ${P(b)})², et compare avec ${M(r * r)}.`,
      solution: `On remplace : (${M(X)} − ${P(a)})<sup>2</sup> + (${M(Y)} − ${P(b)})<sup>2</sup> = ${carreP(dx)} + ${carreP(dy)} = ${M(dx * dx)} + ${M(dy * dy)} = ${M(dx * dx + dy * dy)}. ${ok ? `On trouve ${M(r * r)} : ${nm} appartient au cercle.` : `On trouve ${M(dx * dx + dy * dy)}, différent de ${M(r * r)} : ${nm} n’appartient pas au cercle.`}`,
    };
  },
};

const ceRayon = {
  id: 'ce-rayon', dmin: 2, titre: 'cercle de centre Ω passant par un point',
  draw() { let p, q; do { p = ri(-6, 6); q = ri(-6, 6); } while (!p && !q); return { nmA: pick(['A', 'B', 'M']), a: ri(-5, 5), b: ri(-5, 5), p, q }; },
  ex: { nmA: 'A', a: 2, b: -3, p: 3, q: 4 },
  build({ nmA, a, b, p, q }) {
    const A = [a + p, b + q], r2 = p * p + q * q;
    const t = `${a === 0 ? 'x<sup>2</sup>' : `(x ${a > 0 ? '−' : '+'} ${M(Math.abs(a))})<sup>2</sup>`} + ${b === 0 ? 'y<sup>2</sup>' : `(y ${b > 0 ? '−' : '+'} ${M(Math.abs(b))})<sup>2</sup>`} = {0}`;
    return {
      html: `Dans un repère orthonormé, le cercle 𝒞 a pour centre ${pt0(OMEGA, [a, b])} et passe par ${pt0(nmA, A)}.<br>Complète son équation :`,
      visual: fig({ axes: true, H: 300, aria: `cercle de centre Ω passant par ${nmA}`, circles: [{ x: a, y: b, r: Math.sqrt(r2), c: COL.d }], pts: [{ x: a, y: b, l: OMEGA, c: COL.p }, { x: A[0], y: A[1], l: nmA }], segs: [{ a: [a, b], b: A, c: COL.v, w: 2.4, dash: true }], ext: [[a - Math.sqrt(r2) - 1, b - Math.sqrt(r2) - 1], [a + Math.sqrt(r2) + 1, b + Math.sqrt(r2) + 1]] }),
      ...rNums([r2], { tpl: t, value: r2 }),
      hint: `Le rayon est la distance de Ω(${M(a)} ; ${M(b)}) à ${nmA}(${M(A[0])} ; ${M(A[1])}) : calcule ${OMEGA}${nmA}² avec les coordonnées de ${V(OMEGA + nmA)}, sans prendre la racine carrée (l’équation contient r²).`,
      solution: `${nw(V(OMEGA + nmA) + cpx(`${M(A[0])} − ${P(a)}`, `${M(A[1])} − ${P(b)}`))} = ${nw(V(OMEGA + nmA) + cp(p, q))}. Le rayon est ${OMEGA}${nmA}, donc r² = ${OMEGA}${nmA}² = ${carreP(p)} + ${carreP(q)} = ${M(p * p)} + ${M(q * q)} = ${M(r2)}. Équation : ${cercle(a, b, r2)}.`,
    };
  },
};

const ceDev = {
  id: 'ce-dev', dmin: 3, titre: 'développer l’équation',
  draw() { return { a: ri(-5, 5), b: ri(-5, 5), r: ri(2, 8) }; },
  ex: { a: 2, b: -3, r: 5 },
  build({ a, b, r }) {
    const p = -2 * a, q = -2 * b, s = a * a + b * b - r * r;
    const sx = terms([[1, 'x<sup>2</sup>'], [p, 'x'], [a * a, '']]), sy = terms([[1, 'y<sup>2</sup>'], [q, 'y'], [b * b, '']]);
    return {
      html: `Dans un repère orthonormé, le cercle 𝒞 a pour équation ${crc(a, b, r)}.<br>Développe pour l’écrire sous la forme x<sup>2</sup> + y<sup>2</sup> + px + qy + s = 0 :`,
      ...rNums([p, q, s], { tpl: 'x<sup>2</sup> + y<sup>2</sup> + {0} x + {1} y + {2} = 0', value: s }), rep: `<b>${cercleDev(p, q, s)}</b>`,
      hint: `Développe chaque carré avec (u − v)² = u² − 2uv + v² : ${a === 0 ? 'x² reste x²' : `(${xm(a, 'x')})² donne un terme en x, un terme constant`}, de même pour y. Puis passe ${M(r * r)} à gauche du signe égal.`,
      solution: `${a === 0 ? 'x² reste x²' : `${pa(xm(a, 'x'))}<sup>2</sup> = ${sx}`} et ${b === 0 ? 'y² reste y²' : `${pa(xm(b, 'y'))}<sup>2</sup> = ${sy}`}. L’équation devient ${terms([[1, 'x<sup>2</sup>'], [p, 'x']])} + ${terms([[1, 'y<sup>2</sup>'], [q, 'y']])} + ${M(a * a + b * b)} = ${M(r * r)}. On passe ${M(r * r)} à gauche : ${M(a * a + b * b)} − ${M(r * r)} = ${M(s)}. Donc ${cercleDev(p, q, s)}.`.replace(/ \+ \+ /g, ' + '),
    };
  },
};

const ceReco = {
  id: 'ce-reco', dmin: 4, titre: 'reconnaître un cercle sous forme développée',
  draw() { return { a: nz(-5, 5), b: nz(-5, 5), r: ri(2, 8) }; },
  ex: { a: 2, b: -3, r: 5 },
  build({ a, b, r }) {
    const p = -2 * a, q = -2 * b, s = a * a + b * b - r * r;
    const dem = (v, n) => (v === 0 ? `${n}<sup>2</sup> = ${n}<sup>2</sup>` : `${n}<sup>2</sup> ${v > 0 ? '+' : '−'} ${Math.abs(v) === 1 ? '' : M(Math.abs(v))}${n} = (${xm(-v / 2, n)})<sup>2</sup> − ${M(v * v / 4)}`);
    return {
      html: `Dans un repère orthonormé, le cercle 𝒞 a pour équation ${cercleDev(p, q, s)}.<br>Détermine les coordonnées de son centre Ω et son rayon r.`,
      ...rNums([a, b, r], { tpl: 'Ω({0} ; {1}) et r = {2}', value: r }),
      hint: `Reconnais le début d’un carré : ${p === 0 ? 'x² n’a pas de terme en x' : `x² ${p < 0 ? '−' : '+'} ${M(Math.abs(p))}x est le début de (x ${p < 0 ? '−' : '+'} ${M(Math.abs(p) / 2)})²`}, de même pour y. Écris l’équation sous la forme (x − a)² + (y − b)² = r².`,
      solution: `On complète les carrés : ${dem(p, 'x')} et ${dem(q, 'y')}. L’équation devient ${pa(xm(a, 'x'))}<sup>2</sup> − ${M(a * a)} + ${pa(xm(b, 'y'))}<sup>2</sup> − ${M(b * b)} ${s < 0 ? '−' : '+'} ${M(Math.abs(s))} = 0, donc ${pa(xm(a, 'x'))}<sup>2</sup> + ${pa(xm(b, 'y'))}<sup>2</sup> = ${M(a * a)} + ${M(b * b)} ${s < 0 ? '+' : '−'} ${M(Math.abs(s))} = ${M(r * r)}. Le centre est Ω${cp(a, b)} et le rayon r = √${M(r * r)} = ${M(r)}.`.replace(/\(x\)<sup>2<\/sup>/g, 'x<sup>2</sup>').replace(/\(y\)<sup>2<\/sup>/g, 'y<sup>2</sup>'),
    };
  },
};

const ceAxe = {
  id: 'ce-axe', dmin: 5, titre: 'intersection avec l’axe des abscisses',
  draw() { const T = pick(CERC), sw = chance(0.5), b = (sw ? T.p : T.q) * pick([1, -1]), sdx = sw ? T.q : T.p; return { a: ri(-5, 5), b, s: sdx, r: T.r }; },
  ex: { a: 2, b: 3, s: 4, r: 5 },
  build({ a, b, s, r }) {
    const E = [a - s, a + s].sort((x, y) => x - y);
    return {
      html: `Dans un repère orthonormé, le cercle 𝒞 a pour équation ${crc(a, b, r)}.<br>Détermine les abscisses des points d’intersection de 𝒞 avec l’axe des abscisses.`,
      visual: fig({ axes: true, H: 300, aria: `cercle de centre (${a} ; ${b}) et axe des abscisses`, circles: [{ x: a, y: b, r, c: COL.d }], pts: [{ x: a, y: b, l: OMEGA, c: COL.p }], ext: [[a - r - 1, b - r - 1], [a + r + 1, b + r + 1]] }),
      type: 'roots', check: rootsCheck(E), expected: E, truth: x => (x - a) * (x - a) + b * b === r * r, rep: E.map(M).join(' et '),
      hint: `Un point de l’axe des abscisses a pour ordonnée 0 : remplace y par 0 dans l’équation, puis résous l’équation en x. Tu obtiendras (x − ${P(a)})² = un nombre positif.`,
      solution: `Sur l’axe des abscisses, y = 0. L’équation devient ${pa(xm(a, 'x'))}<sup>2</sup> + ${carreP(b)} = ${M(r * r)}, soit ${pa(xm(a, 'x'))}<sup>2</sup> = ${M(r * r)} − ${M(b * b)} = ${M(s * s)}. Donc ${xm(a, 'x')} = ${M(s)} ou ${xm(a, 'x')} = ${M(-s)}, soit x = ${M(a + s)} ou x = ${M(a - s)}. Les abscisses sont ${M(E[0])} et ${M(E[1])}.`.replace(/\(x\)<sup>2<\/sup>/g, 'x<sup>2</sup>'),
    };
  },
};

const F11 = [ceLire, ceEcrire, cePoint, ceRayon, ceDev, ceReco, ceAxe];
export const LV11 = niveau('Équation de cercle', F11, {
  n: 11,
  intro: 'Un cercle est l’ensemble des points à la même distance r d’un point Ω : en repère orthonormé, cela donne une équation.',
  def: `Dans un repère orthonormé, le cercle de centre Ω(a ; b) et de rayon r a pour équation <b>(x − a)<sup>2</sup> + (y − b)<sup>2</sup> = r<sup>2</sup></b>, car ΩM = r ⇔ ΩM<sup>2</sup> = r<sup>2</sup>.<br>Développée : <b>x<sup>2</sup> + y<sup>2</sup> − 2ax − 2by + c = 0</b> avec c = a<sup>2</sup> + b<sup>2</sup> − r<sup>2</sup>. Pour la reconnaître, on <b>complète les carrés</b>.`,
  visuel: fig({ axes: true, H: 300, aria: 'cercle de centre Ω(2 ; −1) et de rayon 3', circles: [{ x: 2, y: -1, r: 3, c: COL.d }], pts: [{ x: 2, y: -1, l: OMEGA, c: COL.p }], segs: [{ a: [2, -1], b: [5, -1], c: COL.v, w: 2.6, lab: 'r = 3', side: 1 }], ext: [[-2, -5], [6, 4]] }),
  methode: ['Lis ou calcule le centre Ω(a ; b) et le rayon r (ΩA si le cercle passe par A).', 'Écris (x − a)² + (y − b)² = r² (attention aux signes : (x + 3)² a pour centre −3).', 'Pour tester un point : remplace x et y par ses coordonnées et compare avec r².', 'Pour reconnaître un cercle développé : complète les carrés, x² + px = (x + p/2)² − (p/2)².'],
  warn: ['À droite du signe égal, c’est r² (pas r).', '(x + 3)² correspond à un centre d’abscisse −3.', 'Dans la forme développée, x² et y² ont le même coefficient 1 : le centre est (−p/2 ; −q/2).'],
  retenir: '(x − a)² + (y − b)² = r² : centre Ω(a ; b), rayon r.',
});

/* =====================================================================================================
   Niveau 12 : défis
   ===================================================================================================== */
/** demi-diamètres entiers (p, q) avec p² + q² = r² */
const DEMI = [...TRIPLES.slice(0, 6).flatMap(([p, q, r]) => [[p, q, r], [q, p, r]]), ...[2, 3, 4, 5, 6, 7].flatMap(r => [[r, 0, r], [0, r, r]])];
const signes = () => [pick([1, -1]), pick([1, -1])];

const dfDiametre = {
  id: 'df-diametre', dmin: 0, titre: 'cercle de diamètre [AB] : centre et rayon',
  draw() { const [p, q, r] = pick(DEMI), [s1, s2] = signes(), I = [ri(-4, 4), ri(-4, 4)]; return { nm: pick([['A', 'B'], ['M', 'N'], ['E', 'F']]), I, w: [s1 * p, s2 * q], r }; },
  ex: { nm: ['A', 'B'], I: [1, 2], w: [3, 4], r: 5 },
  build({ nm, I, w, r }) {
    const A = [I[0] - w[0], I[1] - w[1]], B = [I[0] + w[0], I[1] + w[1]], AB = vec(A, B), [nA, nB] = nm;
    return {
      html: `Dans un repère orthonormé, on donne ${pt0(nA, A)} et ${pt0(nB, B)}.<br>Détermine le centre Ω et le rayon r du cercle de diamètre [${nA}${nB}].`,
      visual: fig({ axes: true, H: 300, aria: `segment [${nA}${nB}]`, ext: coin([A, B], [[I[0] - r, I[1] - r], [I[0] + r, I[1] + r]]), pts: [{ x: A[0], y: A[1], l: nA }, { x: B[0], y: B[1], l: nB }], segs: [{ a: A, b: B, c: COL.v, w: 2.8 }] }),
      ...rNums([I[0], I[1], r], { tpl: 'Ω({0} ; {1}) et r = {2}', value: r }),
      hint: `Le centre du cercle de diamètre [${nA}${nB}] est le milieu du segment : moyenne des abscisses ${M(A[0])} et ${M(B[0])}, moyenne des ordonnées ${M(A[1])} et ${M(B[1])}. Le rayon est la moitié de la longueur ${nA}${nB}.`,
      solution: `Le centre est le milieu de [${nA}${nB}]. Abscisse de Ω : ${M(A[0])} + ${P(B[0])} = ${M(A[0] + B[0])}, puis ${M(A[0] + B[0])} ÷ 2 = ${M(I[0])}. Ordonnée de Ω : ${M(A[1])} + ${P(B[1])} = ${M(A[1] + B[1])}, puis ${M(A[1] + B[1])} ÷ 2 = ${M(I[1])}. Donc Ω${cp(I[0], I[1])}. Le vecteur ${nw(vn(nA, nB) + cp(AB[0], AB[1]))} donne ${nA}${nB}<sup>2</sup> = ${carreP(AB[0])} + ${carreP(AB[1])} = ${M(AB[0] ** 2)} + ${M(AB[1] ** 2)} = ${M(r * r * 4)}, donc ${nA}${nB} = ${M(2 * r)} et r = ${M(2 * r)} ÷ 2 = ${M(r)}.`,
    };
  },
};

const dfOui = {
  id: 'df-oui', dmin: 1, titre: 'un point est-il sur le cercle de diamètre [AB] ?',
  draw() {
    const T = pick(CERC), ok = chance(0.5), I = [ri(-3, 3), ri(-3, 3)];
    const offs = [[T.p, T.q], [T.q, T.p]].flatMap(([p, q]) => [[p, q], [-p, q], [p, -q], [-p, -q]]);
    const w = pick([[T.p, T.q], [-T.p, T.q], [T.q, T.p], [T.q, -T.p]]);
    let off = pick(offs.filter(o => !(o[0] === w[0] && o[1] === w[1]) && !(o[0] === -w[0] && o[1] === -w[1])));
    if (!ok) { off = chance(0.5) ? [off[0] + pick([-1, 1]), off[1]] : [off[0], off[1] + pick([-1, 1])]; }
    return { nm: pick([['A', 'B', 'M'], ['E', 'F', 'G'], ['K', 'L', 'N']]), I, w, off };
  },
  ex: { nm: ['A', 'B', 'M'], I: [1, 1], w: [3, 4], off: [4, -3] },
  build({ nm, I, w, off }) {
    const A = [I[0] - w[0], I[1] - w[1]], B = [I[0] + w[0], I[1] + w[1]], Mp = [I[0] + off[0], I[1] + off[1]];
    if ([...A, ...B, ...Mp].some(v => Math.abs(v) > 9)) return null;
    const [nA, nB, nM] = nm, MA = vec(Mp, A), MB = vec(Mp, B), p = sc(MA, MB), ok = p === 0;
    return {
      html: `Dans un repère orthonormé, on donne ${pt0(nA, A)}, ${pt0(nB, B)} et ${pt0(nM, Mp)}.<br>Le point ${nM} appartient-il au cercle de diamètre [${nA}${nB}] ?`,
      visual: fig({ axes: true, H: 300, aria: `points ${nA}, ${nB} et ${nM}`, ext: coin([A, B, Mp]), pts: [{ x: A[0], y: A[1], l: nA }, { x: B[0], y: B[1], l: nB }, { x: Mp[0], y: Mp[1], l: nM }], segs: [{ a: A, b: B, c: COL.v, w: 2.8 }] }),
      ...rOuiNon(ok, `Calcule ${dot(vn(nM, nA), vn(nM, nB))} : il est nul, donc l’angle ${nA}${nM}${nB} est droit et ${nM} est sur le cercle.`, `Calcule ${dot(vn(nM, nA), vn(nM, nB))} : il n’est pas nul, donc l’angle ${nA}${nM}${nB} n’est pas droit.`),
      hint: `${nM} est sur le cercle de diamètre [${nA}${nB}] si et seulement si l’angle ${nA}${nM}${nB} est droit, c’est-à-dire ${dot(vn(nM, nA), vn(nM, nB))} = 0. Calcule les coordonnées de ces deux vecteurs (arrivée moins départ), puis leur produit scalaire.`,
      solution: `${nM} est sur le cercle de diamètre [${nA}${nB}] ⇔ ${dot(vn(nM, nA), vn(nM, nB))} = 0. On a ${nw(vn(nM, nA) + cp(MA[0], MA[1]))} et ${nw(vn(nM, nB) + cp(MB[0], MB[1]))}, donc ${dot(vn(nM, nA), vn(nM, nB))} = ${calcAn(MA, MB)}. ${ok ? `Le produit scalaire est nul : ${nM} appartient au cercle.` : `Le produit scalaire n’est pas nul : ${nM} n’appartient pas au cercle.`}`,
    };
  },
};

const dfEquation = {
  id: 'df-equation', dmin: 2, titre: 'équation du cercle de diamètre [AB]',
  draw() { let A, B; do { A = [ri(-5, 5), ri(-5, 5)]; B = [ri(-5, 5), ri(-5, 5)]; } while ((A[0] === B[0] && A[1] === B[1]) || A[0] + B[0] === 0 && A[1] + B[1] === 0 && A[0] * B[0] + A[1] * B[1] === 0); return { nm: pick([['A', 'B'], ['K', 'L'], ['E', 'F']]), A, B }; },
  ex: { nm: ['A', 'B'], A: [1, 2], B: [5, -2] },
  build({ nm, A, B }) {
    const [nA, nB] = nm, p = -(A[0] + B[0]), q = -(A[1] + B[1]), s = A[0] * B[0] + A[1] * B[1];
    return {
      html: `Dans un repère orthonormé, on donne ${pt0(nA, A)} et ${pt0(nB, B)}.<br>Le cercle de diamètre [${nA}${nB}] a une équation de la forme x<sup>2</sup> + y<sup>2</sup> + px + qy + s = 0. Détermine p, q et s.`,
      visual: fig({ axes: true, H: 300, aria: `segment [${nA}${nB}]`, ext: coin([A, B]), pts: [{ x: A[0], y: A[1], l: nA }, { x: B[0], y: B[1], l: nB }], segs: [{ a: A, b: B, c: COL.v, w: 2.8 }] }),
      ...rNums([p, q, s], { tpl: 'p = {0}  q = {1}  s = {2}', value: s }),
      hint: `M(x ; y) est sur le cercle de diamètre [${nA}${nB}] si et seulement si ${dot(vn('M', nA), vn('M', nB))} = 0. Écris les coordonnées de ces deux vecteurs en fonction de x et y avec ${nA}(${M(A[0])} ; ${M(A[1])}) et ${nB}(${M(B[0])} ; ${M(B[1])}), puis développe.`,
      solution: `M(x ; y) est sur le cercle ⇔ ${dot(vn('M', nA), vn('M', nB))} = 0. Avec ${nw(vn('M', nA) + cpx(`${M(A[0])} − x`, `${M(A[1])} − y`))} et ${nw(vn('M', nB) + cpx(`${M(B[0])} − x`, `${M(B[1])} − y`))}, on obtient (${M(A[0])} − x)(${M(B[0])} − x) + (${M(A[1])} − y)(${M(B[1])} − y) = 0. Chaque produit se développe : (${M(A[0])} − x)(${M(B[0])} − x) = x<sup>2</sup> − (x<sub>${nA}</sub> + x<sub>${nB}</sub>)x + x<sub>${nA}</sub> × x<sub>${nB}</sub>, et de même pour y. Calculs : ${M(A[0])} + ${P(B[0])} = ${M(A[0] + B[0])}, donc p = ${M(p)} ; ${M(A[1])} + ${P(B[1])} = ${M(A[1] + B[1])}, donc q = ${M(q)} ; s = x<sub>${nA}</sub> × x<sub>${nB}</sub> + y<sub>${nA}</sub> × y<sub>${nB}</sub> = ${calcAn(A, B)}.`,
    };
  },
};

const dfPoint = {
  id: 'df-point', dmin: 3, titre: 'placer un point pour un angle droit',
  draw() { const T = pick(CERC), sw = chance(0.5), dx = (sw ? T.p : T.q) * pick([1, -1]), s = sw ? T.q : T.p; return { nm: pick([['A', 'B', 'M'], ['E', 'F', 'G']]), h: ri(-3, 3), b: ri(-3, 3), r: T.r, dx, s }; },
  ex: { nm: ['A', 'B', 'M'], h: 1, b: 0, r: 5, dx: 3, s: 4 },
  build({ nm, h, b, r, dx, s }) {
    const A = [h - r, b], B = [h + r, b], x = h + dx, y = b + s, [nA, nB, nM] = nm;
    if ([...A, ...B, x, y].some(v => Math.abs(v) > 11)) return null;
    const ax = A[0] - x, bx = B[0] - x, prod = ax * bx, bmy = b === 0 ? '−y' : `${M(b)} − y`;
    return {
      html: `Dans un repère orthonormé, on donne ${pt0(nA, A)}, ${pt0(nB, B)} et ${nw(`${nM}${cpx(M(x), 'y')}`)} avec y &gt; ${M(b)}.<br>Pour quelle valeur de y le triangle ${nA}${nM}${nB} est-il rectangle en ${nM} ?`,
      visual: fig({ axes: true, H: 300, aria: `points ${nA} et ${nB} et droite x = ${x}`, ext: coin([A, B, [x, b + r]]), pts: [{ x: A[0], y: A[1], l: nA }, { x: B[0], y: B[1], l: nB }], lines: [{ a: 1, b: 0, c: -x, dash: true, col: COL.v, l: `${nM} est sur x = ${M(x)}`, at: 0.12 }] }),
      ...rNums([y], { tpl: 'y = {0}', value: y }),
      hint: `Le triangle est rectangle en ${nM} si ${dot(vn(nM, nA), vn(nM, nB))} = 0. Écris ${vn(nM, nA)}(${M(A[0])} − ${P(x)} ; ${bmy}) et ${vn(nM, nB)}(${M(B[0])} − ${P(x)} ; ${bmy}), calcule le produit scalaire, puis résous l’équation d’inconnue y en gardant y &gt; ${M(b)}.`,
      solution: `${nw(vn(nM, nA) + cpx(`${M(A[0])} − ${P(x)}`, bmy))} = ${nw(vn(nM, nA) + cpx(M(ax), bmy))} et ${nw(vn(nM, nB) + cpx(M(bx), bmy))}. Le produit des deuxièmes coordonnées vaut ${pa(xm(b, 'y'))}<sup>2</sup>. Donc ${dot(vn(nM, nA), vn(nM, nB))} = ${fois(ax, bx)} + ${pa(xm(b, 'y'))}<sup>2</sup> = ${M(prod)} + ${pa(xm(b, 'y'))}<sup>2</sup>. Angle droit en ${nM} : ${pa(xm(b, 'y'))}<sup>2</sup> = ${M(-prod)}, donc ${xm(b, 'y')} = ${M(s)} ou ${xm(b, 'y')} = ${M(-s)}, ${b === 0 ? '' : `, soit y = ${M(b + s)} ou y = ${M(b - s)}`}. Comme y &gt; ${M(b)}, y = ${M(y)}.`,
    };
  },
};

const dfTangente = {
  id: 'df-tangente', dmin: 4, titre: 'tangente à un cercle',
  draw() { const T = pick(CERC), sw = chance(0.5), [sx, sy] = signes(), p = sx * (sw ? T.p : T.q), q = sy * (sw ? T.q : T.p); return { nm: pick(['A', 'B', 'M', 'T']), a: ri(-4, 4), b: ri(-4, 4), p, q, r: T.r }; },
  ex: { nm: 'A', a: 1, b: 2, p: 3, q: 4, r: 5 },
  build({ nm, a, b, p, q, r }) {
    const A = [a + p, b + q], c = -(p * A[0] + q * A[1]);
    if (A.some(v => Math.abs(v) > 11) || c === 0) return null;
    return {
      html: `Dans un repère orthonormé, le cercle 𝒞 a pour équation ${crc(a, b, r)}. Le point ${pt0(nm, A)} appartient à 𝒞.<br>Donne une équation cartésienne de la tangente à 𝒞 en ${nm}.`,
      visual: fig({ axes: true, H: 300, aria: `cercle de centre (${a} ; ${b}) et point ${nm}`, circles: [{ x: a, y: b, r, c: COL.d }], pts: [{ x: a, y: b, l: OMEGA, c: COL.p }, { x: A[0], y: A[1], l: nm }], segs: [{ a: [a, b], b: A, c: COL.v, w: 2.4, dash: true }], ext: [[a - r - 1, b - r - 1], [a + r + 1, b + r + 1]] }),
      ...rEquation(p, q, c),
      hint: `La tangente en ${nm} est perpendiculaire au rayon [${OMEGA}${nm}] : le vecteur ${V(OMEGA + nm)} est normal à la tangente. Lis le centre ${OMEGA}(${M(a)} ; ${M(b)}) dans l’équation, calcule les coordonnées de ${V(OMEGA + nm)}, puis utilise le point ${nm}(${M(A[0])} ; ${M(A[1])}).`,
      solution: `Le centre est Ω${cp(a, b)}. La tangente en ${nm} est perpendiculaire au rayon : ${nw(V(OMEGA + nm) + cpx(`${M(A[0])} − ${P(a)}`, `${M(A[1])} − ${P(b)}`))} = ${nw(V(OMEGA + nm) + cp(p, q))} est normal à la tangente. Équation : ${terms([[p, 'x'], [q, 'y']])} + c = 0. ${nm} est sur la tangente : ${fois(p, A[0])} + ${fois(q, A[1])} + c = 0, soit ${M(p * A[0] + q * A[1])} + c = 0 et c = ${M(c)}. Équation : ${cart(p, q, c)}.`,
    };
  },
};

const dfAngle = {
  id: 'df-angle', dmin: 5, titre: 'angle de 45° ou 135° en coordonnées',
  draw() {
    const d1 = pick([[1, 0], [-1, 0], [0, 1], [0, -1]]), d2 = pick([[1, 1], [1, -1], [-1, 1], [-1, -1]]), k1 = ri(1, 3), k2 = ri(1, 3), A = [ri(-3, 3), ri(-3, 3)];
    return { nm: pick(NOMS3), A, d1, d2, k1, k2, ech: chance(0.5) };
  },
  ex: { nm: ['A', 'B', 'C'], A: [0, 1], d1: [1, 0], d2: [1, 1], k1: 3, k2: 2, ech: false },
  build({ nm, A, d1, d2, k1, k2, ech }) {
    const u = [k1 * d1[0], k1 * d1[1]], v = [k2 * d2[0], k2 * d2[1]], [nA, nB, nC] = nm;
    const [uu, vv] = ech ? [v, u] : [u, v];
    const B = [A[0] + uu[0], A[1] + uu[1]], C = [A[0] + vv[0], A[1] + vv[1]];
    if ([...B, ...C].some(w => Math.abs(w) > 8)) return null;
    const p = sc(u, v), th = p > 0 ? 45 : 135, kk = k1 * k2;
    const sgn = p < 0 ? '−' : '';
    return {
      html: `Dans un repère orthonormé, on donne ${pt0(nA, A)}, ${pt0(nB, B)} et ${pt0(nC, C)}.<br>Quelle est la mesure, en degrés, de l’angle ${nB}${nA}${nC} ?`,
      visual: fig({ axes: true, H: 300, aria: `points ${nm.join(', ')}`, ext: coin([A, B, C]), pts: [{ x: A[0], y: A[1], l: nA }, { x: B[0], y: B[1], l: nB }, { x: C[0], y: C[1], l: nC }], poly: [A, B, C] }),
      ...rNums([th], { tpl: `angle ${nB}${nA}${nC} = {0}°`, value: th }),
      hint: `Calcule ${vn(nA, nB)} et ${vn(nA, nC)} à partir de ${nA}(${M(A[0])} ; ${M(A[1])}) (arrivée moins départ), puis leur produit scalaire et leurs normes : cos(${nB}${nA}${nC}) = ${dot(vn(nA, nB), vn(nA, nC))} ÷ (${nA}${nB} × ${nA}${nC}). L’un des deux vecteurs a une norme avec √2.`,
      solution: `${nw(vn(nA, nB) + cp(uu[0], uu[1]))} et ${nw(vn(nA, nC) + cp(vv[0], vv[1]))}. ${dot(vn(nA, nB), vn(nA, nC))} = ${calcAn(uu, vv)}. ${nA}${nB} = √(${carreP(uu[0])} + ${carreP(uu[1])}) = √${M(uu[0] ** 2 + uu[1] ** 2)} = ${ech ? kRac(k2, 2) : M(k1)} et ${nA}${nC} = √(${carreP(vv[0])} + ${carreP(vv[1])}) = √${M(vv[0] ** 2 + vv[1] ** 2)} = ${ech ? M(k1) : kRac(k2, 2)}. Donc cos(${nB}${nA}${nC}) = ${M(p)} ÷ (${nA}${nB} × ${nA}${nC}) = ${M(p)} ÷ ${kRac(kk, 2)} = ${sgn}1 ÷ √2 = ${sgn}√2 ÷ 2. C’est le cosinus de ${th}° : l’angle ${nB}${nA}${nC} mesure ${th}°.`,
    };
  },
};

const F12 = [dfDiametre, dfOui, dfEquation, dfPoint, dfTangente, dfAngle];
export const LV12 = niveau('Défis : cercles et angles droits', F12, {
  n: 12,
  intro: 'On réunit tout le chapitre : produit scalaire nul, cercle de diamètre [AB], tangente et angles remarquables.',
  def: `<b>Cercle de diamètre [AB]</b> : un point M est sur ce cercle ⇔ ${dot(V('MA'), V('MB'))} = 0 (angle droit en M, ou M = A, ou M = B). Son centre est le milieu de [AB], son rayon AB ÷ 2.<br>Équation : <b>(x − x<sub>A</sub>)(x − x<sub>B</sub>) + (y − y<sub>A</sub>)(y − y<sub>B</sub>) = 0</b>.<br><b>Tangente</b> en A au cercle de centre Ω : droite passant par A, de vecteur normal ${V('ΩA')}.`,
  visuel: fig({ axes: true, H: 300, aria: 'cercle de diamètre [AB] et point M à angle droit', circles: [{ x: 1, y: 1, r: 5, c: COL.d }], pts: [{ x: -2, y: -3, l: 'A', pos: 'sw' }, { x: 4, y: 5, l: 'B', pos: 'ne' }, { x: 5, y: -2, l: 'M' }, { x: 1, y: 1, l: OMEGA, c: COL.p }], segs: [{ a: [-2, -3], b: [4, 5], c: COL.v, w: 2.6 }, { a: [-2, -3], b: [5, -2], c: '#495057' }, { a: [4, 5], b: [5, -2], c: '#495057' }], ext: [[-5, -5], [7, 7]] }),
  methode: ['Un angle droit ou un cercle de diamètre [AB] ? Calcule le produit scalaire MA·MB et vérifie s’il est nul.', 'Pour l’équation du cercle de diamètre [AB] : développe (x − xA)(x − xB) + (y − yA)(y − yB) = 0, ou prends le milieu comme centre et AB ÷ 2 comme rayon.', 'Pour une tangente : le rayon [ΩA] donne le vecteur normal ; il reste à trouver c avec A.', 'Pour un angle : produit scalaire, normes, puis cosinus remarquable.'],
  warn: ['Le cercle de diamètre [AB] a pour centre le <b>milieu</b> de [AB] (pas A).', 'La tangente est perpendiculaire au rayon : le vecteur normal est ΩA, pas un vecteur directeur.', 'Quand tu résous (y − b)² = k, il y a deux solutions : relis l’énoncé pour choisir.'],
  retenir: 'M est sur le cercle de diamètre [AB] ⇔ MA·MB = 0 ; la tangente en A est perpendiculaire au rayon [ΩA].',
});

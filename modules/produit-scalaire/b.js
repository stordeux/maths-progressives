// Niveaux 4 à 6 : orthogonalité ; bilinéarité et symétrie ; normes de u + v et u − v, polarisation.
import {
  ri, pick, nz, chance, M, P, terms, niveau, rNums, rOuiNon, V, dot, norm, vc, pt, nw, cp, cpx, fois, NOMS3, NOMS_V,
  sc, vec, n2, plus, calcAn, somme, gcd, sq, comb, cv, xm, pa, isole,
} from './outils.js';
import { fig, COL, triangleCoords } from './draw.js';

const vn = (A, B) => V(A + B);
const carreN = a => `${P(a)}<sup>2</sup>`;
/** divisor au hasard (positif) de n > 0 */
const divisor = n => { const D = []; for (let k = 1; k <= n; k++) if (n % k === 0) D.push(k); return pick(D); };

/* =====================================================================================================
   Niveau 4 : orthogonalité
   ===================================================================================================== */
const orTest = {
  id: 'or-test', dmin: 0, titre: 'deux vecteurs sont-ils orthogonaux ?',
  draw(d) {
    const orth = chance(0.5);
    for (let k = 0; k < 200; k++) {
      const u = [nz(-5, 5), nz(-5, 5)];
      let v;
      if (orth) { const g = gcd(u[0], u[1]), m = nz(-3, 3); v = [-u[1] / g * m, u[0] / g * m]; } else { v = [nz(-6, 6), nz(-6, 6)]; const p = sc(u, v); if (p === 0 || (d >= 2 && Math.abs(p) > 3 && chance(0.6))) continue; }
      if (Math.abs(v[0]) > 9 || Math.abs(v[1]) > 9) continue;
      return { u, v, nv: pick(NOMS_V) };
    }
    return { u: [3, 2], v: [-2, 3], nv: ['u', 'v'] };
  },
  ex: { u: [3, 2], v: [-4, 6], nv: ['u', 'v'] },
  build({ u, v, nv }) {
    const [a, b] = nv, U = V(a), W = V(b), p = sc(u, v), ok = p === 0;
    return {
      html: `Dans un repère orthonormé, ${vc(a, u)} et ${vc(b, v)}.<br>Les vecteurs ${U} et ${W} sont-ils orthogonaux ?`,
      ...rOuiNon(ok, 'Calcule le produit scalaire : il n’est pas nul, donc les vecteurs ne sont pas orthogonaux.', 'Calcule le produit scalaire : il est nul, donc les vecteurs sont orthogonaux.'),
      hint: `Deux vecteurs sont orthogonaux quand leur produit scalaire est nul. Calcule ${fois(u[0], v[0])} + ${fois(u[1], v[1])}.`,
      solution: `${dot(U, W)} = ${calcAn(u, v)}. ${ok ? `Le produit scalaire est nul : ${U} et ${W} sont orthogonaux.` : `Le produit scalaire n’est pas nul : ${U} et ${W} ne sont pas orthogonaux.`}`,
    };
  },
};

/** inconnue x à une place (i) d'un des deux vecteurs ; renvoie les données de l'énoncé */
function tirageParam(d, avecP) {
  for (let k = 0; k < 200; k++) {
    const m = nz(-5, 5);
    if (Math.abs(m) < 2) continue;
    const p = avecP ? nz(-5, 5) : 0;
    let x0 = nz(-6, 6);
    if (avecP && x0 + p === 0) continue;
    const kap = -m * (x0 + p);
    const e = divisor(Math.abs(kap)) * pick([1, -1]), other = kap / e;
    if (Math.abs(e) > 9 || Math.abs(other) > 9 || other === 0) continue;
    return { m, p, x0, e, other, i: pick([0, 1]), nv: pick(NOMS_V), swap: chance(0.5) };
  }
  return { m: 4, p: avecP ? 2 : 0, x0: avecP ? 1 : 3, e: 3, other: avecP ? -4 : -4, i: 0, nv: ['u', 'v'], swap: false };
}
function buildParam({ m, p, x0, e, other, i, nv, swap }, avecP) {
  const [a, b] = nv, U = V(a), W = V(b);
  const xe = avecP ? (p > 0 ? `x + ${p}` : `x − ${-p}`) : 'x';
  // u contient l'inconnue ; v = (m, other) si i = 0, (other, m) sinon
  const uc = i === 0 ? [xe, M(e)] : [M(e), xe];
  const v = i === 0 ? [m, other] : [other, m];
  const kap = e * other;
  const U1 = `${nw(`${U}${cpx(uc[0], uc[1])}`)}`, W1 = vc(b, v);
  const statement = swap ? `${W1} et ${U1}` : `${U1} et ${W1}`;
  const ux = i === 0 ? `${avecP ? `(${xe})` : 'x'} × ${P(m)} + ${fois(e, other)}` : `${fois(e, other)} + ${avecP ? `(${xe})` : 'x'} × ${P(m)}`;
  const cst = avecP ? m * p + kap : kap;
  const lin = terms([[m, 'x'], [cst, '']]);
  const x = x0;
  return {
    html: `Dans un repère orthonormé, ${statement}.<br>Pour quelle valeur de x les vecteurs ${U} et ${W} sont-ils orthogonaux ?`,
    ...rNums([x], { tpl: 'x = {0}', value: x0, msg: v1 => (v1[0] === -x0 ? '⚠️ Vérifie le signe en isolant x : passe le terme constant de l’autre côté en changeant son signe.' : '') }),
    hint: `Deux vecteurs sont orthogonaux quand leur produit scalaire est nul. Dans ${dot(U, W)}, ${avecP ? `(${xe})` : 'x'} est multiplié par ${P(m)} et l’autre produit vaut ${fois(e, other)} : développe, puis résous l’équation ${dot(U, W)} = 0 d’inconnue x.`,
    solution: `Les vecteurs sont orthogonaux si ${dot(U, W)} = 0. ${dot(U, W)} = ${ux} = ${lin}. On résout ${lin} = 0 : ${isole(m, -cst)}.`,
  };
}
const orParam = {
  id: 'or-param', dmin: 1, titre: 'trouver x pour l’orthogonalité',
  draw: d => tirageParam(d, false),
  ex: { m: 4, p: 0, x0: 3, e: 3, other: -4, i: 0, nv: ['u', 'v'], swap: false },
  build: p => buildParam(p, false),
};
const orParam2 = {
  id: 'or-param2', dmin: 2, titre: 'avec une coordonnée du type x + p',
  draw: d => tirageParam(d, true),
  ex: { m: 3, p: 2, x0: 2, e: 6, other: -2, i: 0, nv: ['u', 'v'], swap: false },
  build: p => buildParam(p, true),
};

const orTriangle = {
  id: 'or-triangle', dmin: 3, titre: 'triangle rectangle ?',
  draw(d) {
    const orth = chance(0.5);
    for (let k = 0; k < 300; k++) {
      const A = [ri(-4, 4), ri(-4, 4)], ab = [nz(-4, 4), nz(-4, 4)];
      let ac;
      if (orth) { const g = gcd(ab[0], ab[1]), m = nz(-2, 2); ac = [-ab[1] / g * m, ab[0] / g * m]; } else { ac = [nz(-5, 5), nz(-5, 5)]; const p = sc(ab, ac); if (p === 0 || (d >= 4 && Math.abs(p) > 3 && chance(0.7))) continue; }
      const B = [A[0] + ab[0], A[1] + ab[1]], C = [A[0] + ac[0], A[1] + ac[1]];
      if ([...B, ...C].some(v => Math.abs(v) > 7) || ab[0] * ac[1] === ab[1] * ac[0]) continue;
      return { nm: pick(NOMS3), A, B, C, ap: ri(0, 2) };
    }
    return { nm: ['A', 'B', 'C'], A: [1, 1], B: [4, 2], C: [0, 4], ap: 0 };
  },
  ex: { nm: ['A', 'B', 'C'], A: [-1, 1], B: [2, 2], C: [0, -2], ap: 0 },
  build({ nm, A, B, C, ap }) {
    // les trois points dans l'ordre nm ; le sommet testé est nm[ap] ; on permute pour que ce soit le premier point
    const pts = [A, B, C], P0 = pts[ap], P1 = pts[(ap + 1) % 3], P2 = pts[(ap + 2) % 3];
    const n0 = nm[ap], n1 = nm[(ap + 1) % 3], n2n = nm[(ap + 2) % 3];
    const v1 = vec(P0, P1), v2 = vec(P0, P2), p = sc(v1, v2), ok = p === 0;
    return {
      html: `Dans un repère orthonormé, on donne ${pt(nm[0], A)}, ${pt(nm[1], B)} et ${pt(nm[2], C)}.<br>Le triangle ${nm.join('')} est-il rectangle en ${n0} ?`,
      visual: fig({ axes: true, H: 300, aria: `repère avec les points ${nm.join(', ')}`, pts: pts.map((q, i) => ({ x: q[0], y: q[1], l: nm[i] })), poly: pts }),
      ...rOuiNon(ok, `Calcule ${dot(vn(n0, n1), vn(n0, n2n))} : il n’est pas nul, donc l’angle en ${n0} n’est pas droit.`, `Calcule ${dot(vn(n0, n1), vn(n0, n2n))} : il est nul, donc l’angle en ${n0} est droit.`),
      hint: `Le triangle est rectangle en ${n0} si les vecteurs ${vn(n0, n1)} et ${vn(n0, n2n)} sont orthogonaux. Calcule leurs coordonnées (arrivée moins départ, à partir de ${n0}) puis leur produit scalaire.`,
      solution: `${nw(vn(n0, n1) + cpx(`${M(P1[0])} − ${P(P0[0])}`, `${M(P1[1])} − ${P(P0[1])}`))} = ${nw(vn(n0, n1) + cp(v1[0], v1[1]))} et ${nw(vn(n0, n2n) + cpx(`${M(P2[0])} − ${P(P0[0])}`, `${M(P2[1])} − ${P(P0[1])}`))} = ${nw(vn(n0, n2n) + cp(v2[0], v2[1]))}. ${dot(vn(n0, n1), vn(n0, n2n))} = ${calcAn(v1, v2)}. ${ok ? `Le produit scalaire est nul : le triangle ${nm.join('')} est rectangle en ${n0}.` : `Le produit scalaire n’est pas nul : le triangle ${nm.join('')} n’est pas rectangle en ${n0}.`}`,
    };
  },
};

const orPoint = {
  id: 'or-point', dmin: 4, titre: 'placer un point pour un angle droit',
  draw() {
    for (let k = 0; k < 300; k++) {
      const A = [ri(-4, 4), ri(-4, 4)], ab = [nz(-4, 4), nz(-4, 4)], g = gcd(ab[0], ab[1]), t = nz(-3, 3);
      const nx = -ab[1] / g, ny = ab[0] / g, C = [A[0] + t * nx, A[1] + t * ny], B = [A[0] + ab[0], A[1] + ab[1]];
      if (nx === 0 || ny === 0 || [...B, ...C].some(v => Math.abs(v) > 8)) continue;
      return { nm: pick(NOMS3), A, B, C };
    }
    return { nm: ['A', 'B', 'C'], A: [1, 2], B: [5, 1], C: [-3, 3] };
  },
  ex: { nm: ['A', 'B', 'C'], A: [1, 2], B: [5, 1], C: [-3, 3] },
  build({ nm, A, B, C }) {
    const [nA, nB, nC] = nm, AB = vec(A, B), yC = C[1], x = C[0];
    const xA = xm(A[0], 'x');
    const dy = yC - A[1], cst = -AB[0] * A[0] + AB[1] * dy, m = AB[0];
    return {
      html: `Dans un repère orthonormé, on donne ${pt(nA, A)}, ${pt(nB, B)} et ${nw(`${nC}${cpx('x', M(yC))}`)}.<br>Pour quelle valeur de x le triangle ${nm.join('')} est-il rectangle en ${nA} ?`,
      visual: fig({ axes: true, H: 300, aria: `repère avec ${nA}, ${nB} et la droite y = ${yC} où se trouve ${nC}`, pts: [{ x: A[0], y: A[1], l: nA }, { x: B[0], y: B[1], l: nB }], lines: [{ a: 0, b: 1, c: -yC, dash: true, col: COL.v, l: `${nC} est sur y = ${M(yC)}`, at: 0.2 }] }),
      ...rNums([x], { tpl: 'x = {0}', value: x, msg: v => (v[0] === -x ? '⚠️ Contrôle le signe du terme constant quand tu résous l’équation.' : '') }),
      hint: `Écris ${vn(nA, nB)}(${M(AB[0])} ; ${M(AB[1])}) et ${vn(nA, nC)}(${xA} ; ${M(yC)} − ${P(A[1])}), puis résous ${dot(vn(nA, nB), vn(nA, nC))} = 0, équation d’inconnue x.`,
      solution: `${nw(vn(nA, nB) + cp(AB[0], AB[1]))} et ${nw(vn(nA, nC) + cpx(xA, `${M(yC)} − ${P(A[1])}`))} = ${nw(vn(nA, nC) + cpx(xA, M(dy)))}. Angle droit en ${nA} si ${dot(vn(nA, nB), vn(nA, nC))} = 0 : ${M(AB[0])} × ${pa(xA)} + ${fois(AB[1], dy)} = ${terms([[m, 'x'], [cst, '']])} = 0. Donc ${isole(m, -cst)}.`,
    };
  },
};

const F4 = [orTest, orParam, orParam2, orTriangle, orPoint];
const figOrth = () => fig({ axes: true, H: 280, aria: 'vecteurs u(3 ; 2) et v(−2 ; 3) perpendiculaires', vecs: [{ x: 0, y: 0, dx: 3, dy: 2, c: COL.u, l: '{u}' }, { x: 0, y: 0, dx: -2, dy: 3, c: COL.v, l: '{v}', side: -1 }], right: [{ at: [0, 0], u: [3, 2], v: [-2, 3] }] });
export const LV4 = niveau('Orthogonalité', F4, {
  n: 4,
  intro: 'Deux vecteurs perpendiculaires ont un produit scalaire nul. C’est l’outil pour démontrer qu’un angle est droit.',
  def: `Deux vecteurs ${V('u')} et ${V('v')} sont <b>orthogonaux</b> si leurs directions sont perpendiculaires. Pour des vecteurs non nuls :<br><b>${dot(V('u'), V('v'))} = 0 ⇔ ${V('u')} et ${V('v')} sont orthogonaux</b> (cos 90° = 0).<br>Un triangle ABC est rectangle en A si et seulement si ${dot(V('AB'), V('AC'))} = 0.`,
  visuel: `<div class="cols">${figOrth()}<div class="note">${vc('u', [3, 2])} et ${vc('v', [-2, 3])} : ${dot(V('u'), V('v'))} = 3 × (−2) + 2 × 3 = −6 + 6 = 0. Les deux flèches forment un angle droit.</div></div>`,
  methode: ['Écris les coordonnées des deux vecteurs (arrivée moins départ si on part de points).', 'Calcule le produit scalaire x × x′ + y × y′.', 'Nul → orthogonaux (angle droit). Non nul → pas orthogonaux.', 'Pour trouver une valeur inconnue : écris le produit scalaire en fonction de x, pose-le égal à 0 et résous.'],
  warn: ['Il faut un produit scalaire <b>nul</b>, pas seulement « petit ».', 'Pour l’angle en A, utilise les vecteurs qui <b>partent de A</b> (AB et AC), pas BC.', 'Dans (x + 2) × 4, n’oublie pas de distribuer : 4x + 8.'],
  retenir: `${dot(V('u'), V('v'))} = 0 ⇔ ${V('u')} ⊥ ${V('v')} (vecteurs non nuls).`,
});

/* =====================================================================================================
   Niveau 5 : bilinéarité et symétrie
   ===================================================================================================== */
const lamTxt = (k, U) => `${Math.abs(k) === 1 ? (k < 0 ? '−' : '') : M(k)}${U}`;
const bilLin = {
  id: 'bi-lin', dmin: 0, titre: 'sortir un coefficient',
  draw(d) { return { nv: pick(NOMS_V), k: nz(-6, 6), l: pick(d < 2 ? [2, 3, 4, 5] : [2, 3, 4, -2, -3, -4]), m: pick(d < 3 ? [1, 1, 1, 2, 3] : [-2, 2, 3, -3, 5]), cote: pick([0, 1]) }; },
  ex: { nv: ['u', 'v'], k: 4, l: 3, m: 1, cote: 0 },
  build({ nv, k, l, m, cote }) {
    const [a, b] = nv, U = V(a), W = V(b);
    const left = lamTxt(l, U), right = m === 1 ? W : lamTxt(m, W);
    let e, fac;
    if (m === 1) { e = cote === 0 ? dot(`(${left})`, W) : dot(U, `(${lamTxt(l, W)})`); fac = l; } else { e = dot(`(${left})`, `(${right})`); fac = l * m; }
    const p = fac * k;
    const sol = m === 1
      ? `${e} = ${M(l)} × (${dot(U, W)}) = ${M(l)} × ${P(k)} = ${M(p)}`
      : `${e} = ${M(l)} × ${P(m)} × (${dot(U, W)}) = ${M(fac)} × ${P(k)} = ${M(p)}`;
    return {
      html: `Les vecteurs ${U} et ${W} vérifient ${dot(U, W)} = ${M(k)}.<br>Calcule ${e}.`,
      ...rNums([p], { tpl: `${e} = {0}`, value: fac * k }),
      hint: `Le produit scalaire est bilinéaire : un coefficient se sort du produit. ${e} s’écrit avec ${dot(U, W)} = ${M(k)} ; multiplie ce nombre par le bon coefficient${m === 1 ? '' : ' (celui de chaque vecteur)'}.`,
      solution: `Par bilinéarité, ${sol}.`,
    };
  },
};
const NB = ' · ';
const sc0 = W => W;

const bilSomme = {
  id: 'bi-somme', dmin: 1, titre: 'distribuer sur une somme',
  draw(d) {
    const co = d < 3 ? [[1, 1], [1, -1], [2, 1], [1, 2], [2, -1]] : [[2, 3], [3, -2], [-2, 5], [4, -3], [-3, -2], [2, -5]];
    return { nv: pick([['u', 'v', 'w'], ['a', 'b', 'c']]), p: nz(-7, 7), q: nz(-7, 7), c: pick(co), cote: pick([0, 1]) };
  },
  ex: { nv: ['u', 'v', 'w'], p: 5, q: 4, c: [2, -3], cote: 0 },
  build({ nv, p, q, c, cote }) {
    const [a, b, w] = nv, A = V(a), B = V(b), Wv = V(w), s = cv(c, [A, B]), tot = c[0] * p + c[1] * q;
    const e = cote === 0 ? dot(`(${s})`, Wv) : dot(Wv, `(${s})`);
    const items = cote === 0 ? [`(${dot(A, Wv)})`, `(${dot(B, Wv)})`] : [`(${dot(Wv, A)})`, `(${dot(Wv, B)})`];
    return {
      html: `Les vecteurs ${A}, ${B} et ${Wv} vérifient ${dot(A, Wv)} = ${M(p)} et ${dot(B, Wv)} = ${M(q)}.<br>Calcule ${e}.`,
      ...rNums([tot], { tpl: `${e} = {0}`, value: c[0] * p + c[1] * q }),
      hint: `Développe ${e} avec la bilinéarité : chaque vecteur de la somme multiplie ${Wv} séparément. Utilise ensuite ${dot(A, Wv)} = ${M(p)} et ${dot(B, Wv)} = ${M(q)}${cote === 1 ? ' (la symétrie permet de les lire dans l’autre ordre)' : ''}.`,
      solution: `Par bilinéarité${cote === 1 ? ' et symétrie' : ''}, ${e} = ${cv(c, items)}. Avec ${dot(A, Wv)} = ${M(p)} et ${dot(B, Wv)} = ${M(q)} : ${comb(c, [p, q])}.`,
    };
  },
};

const bilCarre = {
  id: 'bi-carre', dmin: 1, titre: 'u · u = ‖u‖²',
  draw(d) { return { nv: pick(['u', 'v', 'w']), n: ri(2, 9), var: pick([0, 0, 1, 2]), l: pick([2, 3, 4, -2, -3]) }; },
  ex: { nv: 'u', n: 6, var: 0, l: 2 },
  build({ nv, n, var: vr, l }) {
    const U = V(nv);
    if (vr === 0) {
      return {
        html: `Le vecteur ${U} a pour norme ${norm(nv)} = ${M(n)}.<br>Calcule ${dot(U, U)}.`,
        ...rNums([n * n], { tpl: `${dot(U, U)} = {0}`, value: n * n }),
        hint: `Un vecteur multiplié par lui-même donne le carré de sa norme : ${dot(U, U)} = ${norm(nv)}², avec ${norm(nv)} = ${M(n)}.`,
        solution: `${dot(U, U)} = ${norm(nv)}<sup>2</sup> = ${M(n)}<sup>2</sup> = ${M(n)} × ${M(n)} = ${M(n * n)}.`,
      };
    }
    if (vr === 1) {
      return {
        html: `Le vecteur ${U} vérifie ${dot(U, U)} = ${M(n * n)}.<br>Quelle est sa norme ${norm(nv)} ?`,
        ...rNums([n], { tpl: `${norm(nv)} = {0}`, value: n }),
        hint: `${dot(U, U)} = ${norm(nv)}² : cherche le nombre positif dont le carré vaut ${M(n * n)}.`,
        solution: `${dot(U, U)} = ${norm(nv)}<sup>2</sup>, donc ${norm(nv)}<sup>2</sup> = ${M(n * n)}. Une norme est positive : ${norm(nv)} = √${M(n * n)} = ${M(n)}.`,
      };
    }
    const e = dot(`(${lamTxt(l, U)})`, U);
    return {
      html: `Le vecteur ${U} a pour norme ${norm(nv)} = ${M(n)}.<br>Calcule ${e}.`,
      ...rNums([l * n * n], { tpl: `${e} = {0}`, value: l * n * n }),
      hint: `Sors le coefficient ${M(l)} du produit, puis utilise ${dot(U, U)} = ${norm(nv)}² avec ${norm(nv)} = ${M(n)}.`,
      solution: `${e} = ${M(l)} × (${dot(U, U)}) = ${M(l)} × ${norm(nv)}<sup>2</sup> = ${M(l)} × ${M(n * n)} = ${M(l * n * n)}.`,
    };
  },
};

/** données cohérentes : normes a, b et produit scalaire k, avec |k| ≤ ab */
const tirageNK = d => { const a = ri(2, 5), b = ri(2, 5); let k = nz(-a * b, a * b); if (Math.abs(k) > 6) k = k > 0 ? 6 : -6; return { a, b, k }; };

const bilDist = {
  id: 'bi-dist', dmin: 2, titre: 'distribuer u · (αu + βv)',
  draw() { return { ...tirageNK(), nv: pick(NOMS_V), c: pick([[1, 1], [2, 1], [1, -1], [2, -1], [3, 2], [2, 3], [-1, 3], [3, -1]]), cote: pick([0, 1]) }; },
  ex: { a: 3, b: 2, k: -1, nv: ['u', 'v'], c: [2, -3], cote: 0 },
  build({ a, b, k, nv, c, cote }) {
    const [nu, nvv] = nv, U = V(nu), W = V(nvv), s = cv(c, [U, W]), tot = c[0] * a * a + c[1] * k;
    const e = cote === 0 ? dot(U, `(${s})`) : dot(`(${s})`, U);
    const T = cote === 0 ? [dot(U, U), dot(U, W)] : [dot(U, U), dot(W, U)];
    return {
      html: `Les vecteurs ${U} et ${W} vérifient ${norm(nu)} = ${M(a)}, ${norm(nvv)} = ${M(b)} et ${dot(U, W)} = ${M(k)}.<br>Calcule ${e}.`,
      ...rNums([tot], { tpl: `${e} = {0}`, value: c[0] * a * a + c[1] * k }),
      hint: `Développe ${e} : ${cote === 0 ? `${U} multiplie chaque terme de la parenthèse` : `chaque terme de la parenthèse multiplie ${U}`} ; tu obtiens un multiple de ${dot(U, U)} et un multiple de ${dot(U, W)}. Rappel : ${dot(U, U)} = ${norm(nu)}² = ${M(a)}² et ${dot(U, W)} = ${M(k)}.`,
      solution: `Par bilinéarité${cote === 1 ? ' et symétrie' : ''}, ${e} = ${cv(c, [`(${T[0]})`, `(${T[1]})`])}. Or ${dot(U, U)} = ${norm(nu)}<sup>2</sup> = ${M(a * a)} et ${dot(U, W)} = ${M(k)}. Donc ${comb(c, [a * a, k])}.`,
    };
  },
};

const bilDev = {
  id: 'bi-dev', dmin: 3, titre: 'développer (αu + βv) · (γu + δv)',
  draw(d) {
    const cf = () => [nz(-3, 3), nz(-3, 3)];
    let c1, c2;
    do { c1 = cf(); c2 = cf(); } while (c1[0] * c2[0] === 0);
    return { ...tirageNK(), nv: pick(NOMS_V), c1, c2 };
  },
  ex: { a: 3, b: 2, k: 4, nv: ['u', 'v'], c1: [2, 1], c2: [1, -3] },
  build({ a, b, k, nv, c1, c2 }) {
    const [nu, nvv] = nv, U = V(nu), W = V(nvv), [al, be] = c1, [ga, de] = c2;
    const A1 = al * ga, A2 = al * de + be * ga, A3 = be * de, tot = A1 * a * a + A2 * k + A3 * b * b;
    const e = dot(`(${cv(c1, [U, W])})`, `(${cv(c2, [U, W])})`);
    return {
      html: `Les vecteurs ${U} et ${W} vérifient ${norm(nu)} = ${M(a)}, ${norm(nvv)} = ${M(b)} et ${dot(U, W)} = ${M(k)}.<br>Calcule ${e}.`,
      ...rNums([tot], { tpl: `${e} = {0}`, value: A1 * a * a + A2 * k + A3 * b * b }),
      hint: `Développe comme une double distributivité, en gardant l’ordre des vecteurs, puis regroupe ${dot(W, U)} et ${dot(U, W)} (symétrie). Il te faut ${dot(U, U)} = ${M(a)}², ${dot(W, W)} = ${M(b)}² et ${dot(U, W)} = ${M(k)}.`,
      solution: `${e} = ${cv([A1, A2, A3], [`(${dot(U, U)})`, `(${dot(U, W)})`, `(${dot(W, W)})`])} (la symétrie ${dot(W, U)} = ${dot(U, W)} regroupe les deux termes croisés). Or ${dot(U, U)} = ${M(a * a)}, ${dot(W, W)} = ${M(b * b)} et ${dot(U, W)} = ${M(k)}. Donc ${comb([A1, A2, A3], [a * a, k, b * b])}.`,
    };
  },
};

const bilChasles = {
  id: 'bi-chasles', dmin: 4, titre: 'Chasles et bilinéarité dans un triangle',
  draw() { let c, b, k; do { c = ri(2, 6); b = ri(2, 6); k = nz(-c * b, c * b); } while (Math.abs(k) > 12 || c === b); return { nm: pick(NOMS3), c, b, k, v: ri(0, 2) }; },
  ex: { nm: ['A', 'B', 'C'], c: 3, b: 4, k: 5, v: 0 },
  build({ nm, c, b, k, v }) {
    const [A, B, C] = nm, AB = vn(A, B), AC = vn(A, C);
    const q = [
      { e: dot(AB, vn(B, C)), r: k - c * c, ch: `${vn(B, C)} = ${vn(B, A)} + ${AC}`, sol: `${vn(B, C)} = ${AC} − ${AB}, donc ${dot(AB, vn(B, C))} = ${dot(AB, AC)} − ${dot(AB, AB)} = ${M(k)} − ${A}${B}<sup>2</sup> = ${M(k)} − ${M(c * c)} = ${M(k - c * c)}`, h: `Écris ${vn(B, C)} = ${AC} − ${AB} (relation de Chasles), puis distribue ${AB}.` },
      { e: dot(AC, vn(C, B)), r: k - b * b, sol: `${vn(C, B)} = ${AB} − ${AC}, donc ${dot(AC, vn(C, B))} = ${dot(AC, AB)} − ${dot(AC, AC)} = ${M(k)} − ${A}${C}<sup>2</sup> = ${M(k)} − ${M(b * b)} = ${M(k - b * b)}`, h: `Écris ${vn(C, B)} = ${AB} − ${AC} (relation de Chasles), puis distribue ${AC} et utilise la symétrie.` },
      { e: dot(vn(B, A), vn(B, C)), r: c * c - k, sol: `${vn(B, C)} = ${vn(B, A)} + ${AC}, donc ${dot(vn(B, A), vn(B, C))} = ${dot(vn(B, A), vn(B, A))} + ${dot(vn(B, A), AC)} = ${A}${B}<sup>2</sup> − ${dot(AB, AC)} = ${M(c * c)} − ${P(k)} = ${M(c * c - k)}`, h: `Écris ${vn(B, C)} = ${vn(B, A)} + ${AC}, distribue ${vn(B, A)}, et remarque que ${vn(B, A)} est l’opposé de ${AB}.` },
    ][v];
    return {
      html: `Dans le triangle ${A}${B}${C}, on a ${A}${B} = ${M(c)}, ${A}${C} = ${M(b)} et ${dot(AB, AC)} = ${M(k)}.<br>Calcule ${q.e}.`,
      ...rNums([q.r], { tpl: `${q.e} = {0}`, value: q.r }),
      hint: `${q.h} Tu connais ${A}${B} = ${M(c)}, ${A}${C} = ${M(b)} et ${dot(AB, AC)} = ${M(k)}.`,
      solution: `${q.sol}.`,
    };
  },
};

const F5 = [bilLin, bilSomme, bilCarre, bilDist, bilDev, bilChasles];
export const LV5 = niveau('Bilinéarité et symétrie', F5, {
  n: 5,
  intro: 'Le produit scalaire se calcule comme un produit : on développe, on factorise, on sort les coefficients.',
  def: `Pour tous vecteurs et tous réels k :<br>• <b>symétrie</b> : ${dot(V('u'), V('v'))} = ${dot(V('v'), V('u'))} ;<br>• <b>bilinéarité</b> : ${dot(`(${V('u')} + ${V('v')})`, V('w'))} = ${dot(V('u'), V('w'))} + ${dot(V('v'), V('w'))} et ${dot(`(k${V('u')})`, V('v'))} = k × (${dot(V('u'), V('v'))}) ;<br>• <b>carré</b> : ${dot(V('u'), V('u'))} = ‖u‖<sup>2</sup> (jamais négatif).`,
  visuel: fig({ aria: 'vecteurs u, v et leur somme u + v', H: 250, pts: [{ x: 0, y: 0, l: 'O', pos: 'sw' }], vecs: [{ x: 0, y: 0, dx: 4, dy: 0, c: COL.u, l: '{u}', side: -1 }, { x: 4, y: 0, dx: 1, dy: 2, c: COL.v, l: '{v}', side: -1 }, { x: 0, y: 0, dx: 5, dy: 2, c: COL.s, l: '{u} + {v}', side: 1 }] }),
  methode: ['Repère la forme : un coefficient devant un vecteur, une somme, un carré ou un produit de deux parenthèses.', 'Développe terme à terme, en gardant l’ordre des vecteurs.', 'Regroupe grâce à la symétrie : v·u = u·v.', 'Remplace u·u par ‖u‖² et les autres produits par leurs valeurs données.'],
  warn: ['Un seul coefficient se sort, pas son carré : (3u)·v = 3 × (u·v), et non 9 × (u·v).', 'u·u est le carré de la norme : toujours positif (jamais ‖u‖ tout court).', 'En développant (u + v)·(u − 3v), les deux produits croisés se regroupent : −3 u·v + v·u = −2 u·v.'],
  retenir: `On développe un produit scalaire comme un produit de nombres, avec ${dot(V('u'), V('u'))} = ‖u‖<sup>2</sup> et ${dot(V('u'), V('v'))} = ${dot(V('v'), V('u'))}.`,
});

/* =====================================================================================================
   Niveau 6 : ‖u + v‖², ‖u − v‖², polarisation
   ===================================================================================================== */
const tirageNKs = () => { const a = ri(2, 7), b = ri(2, 7); const k = ri(-Math.min(a * b - 1, 8), Math.min(a * b - 1, 8)); return { a, b, k }; };
const nmSomme = {
  id: 'nm-somme', dmin: 0, titre: '‖u + v‖²',
  draw() { let t; do { t = tirageNKs(); } while (t.k === 0); return { ...t, nv: pick(NOMS_V) }; },
  ex: { a: 3, b: 4, k: 2, nv: ['u', 'v'] },
  build({ a, b, k, nv }) {
    const [nu, nvv] = nv, U = V(nu), W = V(nvv), tot = a * a + 2 * k + b * b;
    return {
      html: `Les vecteurs ${U} et ${W} vérifient ${norm(nu)} = ${M(a)}, ${norm(nvv)} = ${M(b)} et ${dot(U, W)} = ${M(k)}.<br>Calcule ‖${U} + ${W}‖<sup>2</sup>.`,
      ...rNums([tot], { tpl: `‖${U} + ${W}‖<sup>2</sup> = {0}`, value: a * a + 2 * k + b * b, msg: v => (v[0] === a * a + k + b * b ? '⚠️ Le double produit est 2 × (' + 'u · v' + ') : il manque le facteur 2.' : v[0] === a * a + b * b ? '⚠️ Il manque le terme 2 × (u · v) : ‖u + v‖² n’est pas ‖u‖² + ‖v‖².' : '') }),
      hint: `Utilise ‖${U} + ${W}‖² = ‖${U}‖² + 2 ${dot(U, W)} + ‖${W}‖² avec ${norm(nu)} = ${M(a)}, ${norm(nvv)} = ${M(b)} et ${dot(U, W)} = ${M(k)}.`,
      solution: `‖${U} + ${W}‖<sup>2</sup> = ${norm(nu)}<sup>2</sup> + 2 × ${dot(U, W)} + ${norm(nvv)}<sup>2</sup> = ${M(a * a)} + 2 × ${P(k)} + ${M(b * b)} = ${somme([a * a, 2 * k, b * b])} = ${M(tot)}.`,
    };
  },
};
const nmDiff = {
  id: 'nm-diff', dmin: 1, titre: '‖u − v‖²',
  draw() { let t; do { t = tirageNKs(); } while (t.k === 0); return { ...t, nv: pick(NOMS_V) }; },
  ex: { a: 5, b: 3, k: 4, nv: ['u', 'v'] },
  build({ a, b, k, nv }) {
    const [nu, nvv] = nv, U = V(nu), W = V(nvv), tot = a * a - 2 * k + b * b;
    return {
      html: `Les vecteurs ${U} et ${W} vérifient ${norm(nu)} = ${M(a)}, ${norm(nvv)} = ${M(b)} et ${dot(U, W)} = ${M(k)}.<br>Calcule ‖${U} − ${W}‖<sup>2</sup>.`,
      ...rNums([tot], { tpl: `‖${U} − ${W}‖<sup>2</sup> = {0}`, value: a * a - 2 * k + b * b, msg: v => (v[0] === a * a + 2 * k + b * b ? '⚠️ Pour ‖u − v‖², le double produit est précédé du signe −.' : '') }),
      hint: `Utilise ‖${U} − ${W}‖² = ‖${U}‖² − 2 ${dot(U, W)} + ‖${W}‖² avec ${norm(nu)} = ${M(a)}, ${norm(nvv)} = ${M(b)} et ${dot(U, W)} = ${M(k)} : attention au signe du double produit.`,
      solution: `‖${U} − ${W}‖<sup>2</sup> = ${norm(nu)}<sup>2</sup> − 2 × ${dot(U, W)} + ${norm(nvv)}<sup>2</sup> = ${M(a * a)} − 2 × ${P(k)} + ${M(b * b)} = ${somme([a * a, -2 * k, b * b])} = ${M(tot)}.`,
    };
  },
};

/** a, b, s entiers avec s entre |a − b| et a + b (strict) */
const tirageABS = () => { for (;;) { const a = ri(2, 8), b = ri(2, 8), s = ri(Math.abs(a - b) + 1, a + b - 1); if (s >= 1) return { a, b, s }; } };
const nmPol1 = {
  id: 'nm-pol1', dmin: 2, titre: 'polarisation avec ‖u + v‖',
  draw() { return { ...tirageABS(), nv: pick(NOMS_V) }; },
  ex: { a: 3, b: 5, s: 7, nv: ['u', 'v'] },
  build({ a, b, s, nv }) {
    const [nu, nvv] = nv, U = V(nu), W = V(nvv), num = s * s - a * a - b * b, k = num / 2;
    return {
      html: `Les vecteurs ${U} et ${W} vérifient ‖${U} + ${W}‖ = ${M(s)}, ${norm(nu)} = ${M(a)} et ${norm(nvv)} = ${M(b)}.<br>Calcule ${dot(U, W)}.`,
      ...rNums([k], { tpl: `${dot(U, W)} = {0}`, value: (s * s - a * a - b * b) / 2 }),
      hint: `Isole le double produit dans ‖${U} + ${W}‖² = ‖${U}‖² + 2 ${dot(U, W)} + ‖${W}‖² : c’est la formule de polarisation. Les trois normes valent ${M(s)}, ${M(a)} et ${M(b)}.`,
      solution: `${dot(U, W)} = (‖${U} + ${W}‖² − ‖${U}‖² − ‖${W}‖²) ÷ 2. Calculons le numérateur : ${M(s)}<sup>2</sup> − ${M(a)}<sup>2</sup> − ${M(b)}<sup>2</sup> = ${M(s * s)} − ${M(a * a)} − ${M(b * b)} = ${M(num)}. Donc ${dot(U, W)} = ${M(num)} ÷ 2 = ${M(k)}.`,
    };
  },
};
const nmPol2 = {
  id: 'nm-pol2', dmin: 3, titre: 'polarisation avec ‖u − v‖',
  draw() { return { ...tirageABS(), nv: pick(NOMS_V) }; },
  ex: { a: 5, b: 4, s: 3, nv: ['u', 'v'] },
  build({ a, b, s, nv }) {
    const [nu, nvv] = nv, U = V(nu), W = V(nvv), num = a * a + b * b - s * s, k = num / 2;
    return {
      html: `Les vecteurs ${U} et ${W} vérifient ‖${U} − ${W}‖ = ${M(s)}, ${norm(nu)} = ${M(a)} et ${norm(nvv)} = ${M(b)}.<br>Calcule ${dot(U, W)}.`,
      ...rNums([k], { tpl: `${dot(U, W)} = {0}`, value: (a * a + b * b - s * s) / 2 }),
      hint: `Isole le double produit dans ‖${U} − ${W}‖² = ‖${U}‖² − 2 ${dot(U, W)} + ‖${W}‖² : le signe de ${dot(U, W)} change par rapport à la somme. Les trois normes valent ${M(s)}, ${M(a)} et ${M(b)}.`,
      solution: `${dot(U, W)} = (‖${U}‖² + ‖${W}‖² − ‖${U} − ${W}‖²) ÷ 2. Calculons le numérateur : ${M(a)}<sup>2</sup> + ${M(b)}<sup>2</sup> − ${M(s)}<sup>2</sup> = ${M(a * a)} + ${M(b * b)} − ${M(s * s)} = ${M(num)}. Donc ${dot(U, W)} = ${M(num)} ÷ 2 = ${M(k)}.`,
    };
  },
};

function figCotes({ nm, c, b, a }) {
  const T = triangleCoords(c, b, a), [A, B, C] = nm;
  return fig({
    aria: `triangle ${A}${B}${C} de côtés ${c}, ${b} et ${a}`, H: 290, padb: 12, padt: 6,
    pts: [{ x: T.A[0], y: T.A[1], l: A, pos: 'sw' }, { x: T.B[0], y: T.B[1], l: B, pos: 'se' }, { x: T.C[0], y: T.C[1], l: C, pos: 'n' }],
    poly: [T.A, T.B, T.C],
    segs: [{ a: T.A, b: T.B, lab: `${A}${B} = ${M(c)}`, c: '#495057', side: -1, dist: 12, lc: COL.u }, { a: T.A, b: T.C, lab: `${A}${C} = ${M(b)}`, c: '#495057', side: 1, dist: 8, lc: COL.v }, { a: T.B, b: T.C, lab: `${B}${C} = ${M(a)}`, c: '#495057', dist: 8, lc: COL.h }],
    center: [(T.A[0] + T.B[0] + T.C[0]) / 3, (T.A[1] + T.B[1] + T.C[1]) / 3],
  });
}
const nmTriangle = {
  id: 'nm-triangle', dmin: 4, titre: 'AB · AC avec les trois côtés',
  draw() { let c, b, a; do { c = ri(3, 9); b = ri(3, 9); a = ri(Math.abs(b - c) + 1, b + c - 1); } while (!(a >= 2)); return { nm: pick(NOMS3), c, b, a }; },
  ex: { nm: ['A', 'B', 'C'], c: 5, b: 6, a: 7 },
  build({ nm, c, b, a }) {
    const [A, B, C] = nm, AB = vn(A, B), AC = vn(A, C), num = c * c + b * b - a * a, k = num / 2;
    return {
      html: `Dans le triangle ${A}${B}${C}, on a ${A}${B} = ${M(c)}, ${A}${C} = ${M(b)} et ${B}${C} = ${M(a)}.<br>Calcule ${dot(AB, AC)}.`,
      visual: figCotes({ nm, c, b, a }),
      ...rNums([k], { tpl: `${dot(AB, AC)} = {0}`, value: (c * c + b * b - a * a) / 2 }),
      hint: `Écris ${vn(B, C)} = ${AC} − ${AB}, puis ${B}${C}² = ‖${AC} − ${AB}‖² : le développement fait apparaître ${dot(AB, AC)}. Les côtés valent ${A}${B} = ${M(c)}, ${A}${C} = ${M(b)} et ${B}${C} = ${M(a)}.`,
      solution: `${vn(B, C)} = ${AC} − ${AB}, donc ${B}${C}<sup>2</sup> = ${A}${B}<sup>2</sup> + ${A}${C}<sup>2</sup> − 2 ${dot(AB, AC)}, d’où ${dot(AB, AC)} = (${A}${B}<sup>2</sup> + ${A}${C}<sup>2</sup> − ${B}${C}<sup>2</sup>) ÷ 2. Le numérateur vaut ${M(c)}<sup>2</sup> + ${M(b)}<sup>2</sup> − ${M(a)}<sup>2</sup> = ${M(c * c)} + ${M(b * b)} − ${M(a * a)} = ${M(num)}. Donc ${dot(AB, AC)} = ${M(num)} ÷ 2 = ${M(k)}.`,
    };
  },
};

const nmLong = {
  id: 'nm-long', dmin: 5, titre: 'longueur de u + v ou u − v',
  draw() { const t = tirageABS(); return { ...t, nv: pick(NOMS_V), plusSigne: chance(0.5), entier: (t.s * t.s - t.a * t.a - t.b * t.b) % 2 === 0 }; },
  ex: { a: 3, b: 5, s: 7, nv: ['u', 'v'], plusSigne: true, entier: true },
  build({ a, b, s, nv, plusSigne, entier }) {
    if (!entier) return null;
    const [nu, nvv] = nv, U = V(nu), W = V(nvv), k0 = (s * s - a * a - b * b) / 2, k = plusSigne ? k0 : -k0, sg = plusSigne ? '+' : '−';
    if (k === 0) return null;
    const tot = s * s;
    return {
      html: `Les vecteurs ${U} et ${W} vérifient ${norm(nu)} = ${M(a)}, ${norm(nvv)} = ${M(b)} et ${dot(U, W)} = ${M(k)}.<br>Calcule la norme ‖${U} ${sg} ${W}‖.`,
      ...rNums([s], { tpl: `‖${U} ${sg} ${W}‖ = {0}`, value: s }),
      hint: `Calcule d’abord ‖${U} ${sg} ${W}‖² = ‖${U}‖² ${sg} 2 ${dot(U, W)} + ‖${W}‖² avec ${M(a)}, ${M(b)} et ${M(k)}, puis prends la racine carrée (le résultat est positif).`,
      solution: `‖${U} ${sg} ${W}‖<sup>2</sup> = ${norm(nu)}<sup>2</sup> ${sg} 2 × ${dot(U, W)} + ${norm(nvv)}<sup>2</sup> = ${M(a * a)} ${sg} 2 × ${P(k)} + ${M(b * b)} = ${somme([a * a, plusSigne ? 2 * k : -2 * k, b * b])} = ${M(tot)}. Donc ‖${U} ${sg} ${W}‖ = √${M(tot)} = ${M(s)}.`,
    };
  },
};

const F6 = [nmSomme, nmDiff, nmPol1, nmPol2, nmTriangle, nmLong];
export const LV6 = niveau('Normes d’une somme, polarisation', F6, {
  n: 6,
  intro: 'En développant ‖u + v‖², le produit scalaire apparaît : on peut le calculer à partir de longueurs, ou l’inverse.',
  def: `Identités à connaître (elles se démontrent en développant ${dot(`(${V('u')} + ${V('v')})`, `(${V('u')} + ${V('v')})`)}) :<br><b>‖u + v‖<sup>2</sup> = ‖u‖<sup>2</sup> + 2 ${dot(V('u'), V('v'))} + ‖v‖<sup>2</sup></b><br><b>‖u − v‖<sup>2</sup> = ‖u‖<sup>2</sup> − 2 ${dot(V('u'), V('v'))} + ‖v‖<sup>2</sup></b><br>Polarisation : <b>${dot(V('u'), V('v'))} = ½ (‖u + v‖<sup>2</sup> − ‖u‖<sup>2</sup> − ‖v‖<sup>2</sup>) = ½ (‖u‖<sup>2</sup> + ‖v‖<sup>2</sup> − ‖u − v‖<sup>2</sup>)</b>.`,
  visuel: fig({ aria: 'parallélogramme construit sur u et v avec ses deux diagonales u + v et u − v', H: 260, pts: [{ x: 0, y: 0, l: 'O', pos: 'sw' }], poly: [[0, 0], [4, 0], [5, 2], [1, 2]], vecs: [{ x: 0, y: 0, dx: 4, dy: 0, c: COL.u, l: '{u}', side: -1 }, { x: 0, y: 0, dx: 1, dy: 2, c: COL.v, l: '{v}', side: 1 }, { x: 0, y: 0, dx: 5, dy: 2, c: COL.s, l: '{u} + {v}', side: -1, at: 0.62 }, { x: 1, y: 2, dx: 3, dy: -2, c: COL.w, l: '{u} − {v}', side: 1, at: 0.3 }] }),
  methode: ['Repère ce que l’énoncé donne : des normes, un produit scalaire, ou la norme de u + v (ou de u − v).', 'Écris l’identité qui relie ces trois nombres, avec le bon signe devant 2 u·v.', 'Remplace par les nombres, puis calcule (n’oublie pas de mettre au carré).', 'Pour une norme : calcule d’abord le carré, puis la racine carrée.'],
  warn: ['‖u + v‖² n’est pas ‖u‖² + ‖v‖² : il y a le double produit 2 u·v.', 'Pour ‖u − v‖², le double produit est précédé du signe −.', 'Ne pas oublier de diviser par 2 dans la polarisation.'],
  retenir: `‖u ± v‖<sup>2</sup> = ‖u‖<sup>2</sup> ± 2 ${dot(V('u'), V('v'))} + ‖v‖<sup>2</sup>, d’où ${dot(V('u'), V('v'))} = ½ (‖u + v‖<sup>2</sup> − ‖u‖<sup>2</sup> − ‖v‖<sup>2</sup>).`,
});

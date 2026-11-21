// Niveaux 1 à 3 : ensemble de définition ; fonction carré (images, antécédents) ; fonction carré (variations, inéquations).
import {
  ri, pick, chance, M, P, F, R, I, REALS, INF, fmtSet, r6, niveau, rNums, rIv, rRoots, rCmp, rChoice,
  carre, rac, X2, big, fx, lin, ax, REL, signe, sgnTxt, sensNum,
} from './outils.js';
import { graph } from './draw.js';

const nz = (a, b) => { let v; do { v = ri(a, b); } while (v === 0); return v; };
const OUI = [{ l: 'Oui', ok: true }, { l: 'Non' }];

/* =====================================================================================================
   Niveau 1 : ensemble de définition
   ===================================================================================================== */
/** racine d'une expression ax + b à coefficients entiers : a x + b = 0 */
const den = (a, r) => lin(a, -a * r);
const ensDef = S => (S.length === 2 ? `ℝ ∖ {${M(S[0].hi)}}` : fmtSet(S));
const resout0 = (a, r) => (a === 1 ? `x = ${M(r)}` : `${ax(a)} = ${M(a * r)}, puis x = ${M(a * r)} ÷ ${P(a)} = ${M(r)}`);

const interdite = {
  id: 'e-interdite', dmin: 0, titre: 'valeur interdite d’un quotient',
  draw(d) {
    const a = d >= 2 && chance(0.6) ? pick([2, 3, -1, -2, -3]) : 1;
    return { a, r: ri(-9, 9), num: d >= 1 && chance(0.3) ? 'x' : String(ri(1, 9)) };
  },
  ex: { a: 1, r: 5, num: '3' },
  build({ a, r, num }) {
    const D = den(a, r);
    return {
      html: `Soit f la fonction définie par${big(fx('f', F(num, D)))}Pour quelle valeur de x le nombre f(x) n’existe-t-il pas ?`,
      ...rNums([r], { tpl: 'x = {0}', value: r }),
      verify: E => a * E[0] - a * r === 0,
      hint: `On ne peut pas diviser par 0 : cherche la valeur de x pour laquelle le dénominateur ${D} est égal à 0.`,
      solution: `f(x) n’existe pas quand le dénominateur est nul. On résout ${D} = 0 : ${resout0(a, r)}. La valeur interdite est ${M(r)}.`,
    };
  },
};

const choixQuot = {
  id: 'e-choix-quot', dmin: 0, titre: 'repérer le nombre sans image (quotient)',
  draw() { const r = ri(-6, 6), c = ri(2, 9), autres = new Set(); while (autres.size < 3) { const v = ri(-9, 9); if (v !== r) autres.add(v); } return { r, c, autres: [...autres] }; },
  ex: { r: 2, c: 5, autres: [-1, 4, 7] },
  build({ r, c, autres }) {
    const D = den(1, r);
    return {
      html: `Soit f la fonction définie par${big(fx('f', F(c, D)))}Lequel de ces nombres n’a <b>pas d’image</b> par f ?`,
      ...rChoice([{ l: M(r), ok: true }, ...autres.map(v => ({ l: M(v), why: `Pour x = ${M(v)}, le dénominateur vaut ${M(v)} ${r < 0 ? '+' : '−'} ${P(Math.abs(r))} = ${M(v - r)}, qui n’est pas nul : f(${M(v)}) existe.` }))], { indep: M(r) }),
      hint: `Une division par 0 est impossible : parmi les quatre nombres, cherche celui qui rend le dénominateur ${D} égal à 0.`,
      solution: `Pour x = ${M(r)}, le dénominateur ${D} vaut ${M(r - r)} : on ne peut pas diviser par 0, donc ${M(r)} n’a pas d’image. Pour les trois autres nombres, le dénominateur n’est pas nul.`,
    };
  },
};

const choixRac = {
  id: 'e-choix-rac', dmin: 0, titre: 'repérer le nombre sans image (racine)',
  draw() { const r = ri(-6, 6), mal = r - ri(1, 6), autres = new Set(); while (autres.size < 3) { const v = r + ri(0, 7); autres.add(v); } return { r, mal, autres: [...autres] }; },
  ex: { r: 3, mal: 1, autres: [3, 5, 9] },
  build({ r, mal, autres }) {
    const D = den(1, r);
    return {
      html: `Soit f la fonction définie par${big(fx('f', R(D)))}Lequel de ces nombres n’a <b>pas d’image</b> par f ?`,
      ...rChoice([{ l: M(mal), ok: true }, ...autres.map(v => ({ l: M(v), why: `Pour x = ${M(v)}, ${D.replace('x', M(v))} = ${M(v - r)} est positif ou nul : la racine existe.` }))], { indep: M(mal) }),
      hint: `Une racine carrée n’existe que si ce qu’il y a dessous est positif ou nul : calcule ${D} pour chacun des quatre nombres et repère le résultat négatif.`,
      solution: `Pour x = ${M(mal)}, ${D} = ${M(mal)} ${r < 0 ? '+' : '−'} ${Math.abs(r)} = ${M(mal - r)} est négatif : on ne peut pas prendre sa racine carrée, donc ${M(mal)} n’a pas d’image. Les autres nombres donnent un résultat positif ou nul.`,
    };
  },
};

const quotient = {
  id: 'e-quotient', dmin: 1, titre: 'ensemble de définition d’un quotient',
  draw(d) { return { a: d >= 3 ? pick([1, 1, 2, -1, -2, 3]) : 1, r: nz(-9, 9), num: chance(0.3) ? 'x' : String(ri(1, 9)) }; },
  ex: { a: 1, r: -4, num: '2' },
  build({ a, r, num }) {
    const D = den(a, r), S = [I(-INF, 0, r, 0), I(r, 0, INF, 0)];
    const N = num === 'x' ? x => x : () => +num;
    return {
      html: `Soit f la fonction définie par${big(fx('f', F(num, D)))}Donne l’ensemble de définition de f.`,
      ...rIv(S, x => Number.isFinite(N(x) / (a * x - a * r))),
      hint: `Le quotient n’existe pas quand le dénominateur ${D} est nul : cherche cette valeur interdite, puis écris tous les réels sauf elle avec deux intervalles.`,
      solution: `On résout ${D} = 0 : ${resout0(a, r)}. Le seul nombre interdit est ${M(r)}. L’ensemble de définition est ℝ ∖ {${M(r)}} = ${fmtSet(S)}.`,
    };
  },
};

const racine = {
  id: 'e-racine', dmin: 1, titre: 'ensemble de définition d’une racine carrée',
  draw() { return { r: nz(-9, 9) }; },
  ex: { r: 3 },
  build({ r }) {
    const D = den(1, r), S = [I(r, 1, INF, 0)];
    return {
      html: `Soit f la fonction définie par${big(fx('f', R(D)))}Donne l’ensemble de définition de f.`,
      ...rIv(S, x => !Number.isNaN(Math.sqrt(x - r))),
      hint: `Une racine carrée n’existe que si ce qu’il y a dessous est positif ou nul : résous l’inéquation ${D} ≥ 0.`,
      solution: `f(x) existe si ${D} ≥ 0, c’est-à-dire x ≥ ${M(r)}. L’ensemble de définition est ${fmtSet(S)} (la borne ${M(r)} est comprise : √0 existe).`,
    };
  },
};

const racineNeg = {
  id: 'e-racine-neg', dmin: 2, titre: 'racine de « a − x »',
  draw() { return { r: nz(-8, 9) }; },
  ex: { r: 5 },
  build({ r }) {
    const D = lin(-1, r), S = [I(-INF, 0, r, 1)];
    return {
      html: `Soit f la fonction définie par${big(fx('f', R(D)))}Donne l’ensemble de définition de f.`,
      ...rIv(S, x => !Number.isNaN(Math.sqrt(r - x))),
      hint: `La racine existe si ${D} ≥ 0. Résous cette inéquation en isolant x : quand tu changes le signe de x, le sens de l’inégalité change aussi.`,
      solution: `f(x) existe si ${D} ≥ 0, donc ${M(r)} ≥ x, soit x ≤ ${M(r)}. L’ensemble de définition est ${fmtSet(S)}.`,
    };
  },
};

const racineCoef = {
  id: 'e-racine-coef', dmin: 3, titre: 'racine de « ax + b »',
  draw() { return { a: pick([2, 3, 4, -2, -3]), r: ri(-6, 6) }; },
  ex: { a: 2, r: 3 },
  build({ a, r }) {
    const D = lin(a, -a * r), S = a > 0 ? [I(r, 1, INF, 0)] : [I(-INF, 0, r, 1)];
    return {
      html: `Soit f la fonction définie par${big(fx('f', R(D)))}Donne l’ensemble de définition de f.`,
      ...rIv(S, x => !Number.isNaN(Math.sqrt(a * x - a * r))),
      hint: `Résous ${D} ≥ 0 : isole x, puis divise par ${M(a)}${a < 0 ? ' en pensant que diviser par un nombre négatif renverse l’inégalité' : ''}.`,
      solution: `f(x) existe si ${D} ≥ 0. On trouve ${ax(a)} ≥ ${M(a * r)}, donc x ${a > 0 ? '≥' : '≤'} ${M(r)}${a < 0 ? ' (on divise par un nombre négatif : le sens change)' : ''}. L’ensemble de définition est ${fmtSet(S)}.`,
    };
  },
};

const quotientCoef = {
  id: 'e-quotient-coef', dmin: 3, titre: 'quotient avec « ax + b »',
  draw() { return { a: pick([2, 3, 4, -2, -3]), r: ri(-6, 6), num: ri(1, 9) }; },
  ex: { a: 3, r: 2, num: 4 },
  build({ a, r, num }) {
    const D = lin(a, -a * r), S = [I(-INF, 0, r, 0), I(r, 0, INF, 0)];
    return {
      html: `Soit f la fonction définie par${big(fx('f', F(num, D)))}Donne l’ensemble de définition de f.`,
      ...rIv(S, x => Number.isFinite(num / (a * x - a * r))),
      hint: `Cherche la valeur de x qui annule le dénominateur ${D} : résous ${D} = 0, puis retire-la de ℝ.`,
      solution: `On résout ${D} = 0 : ${resout0(a, r)}. L’ensemble de définition est ℝ ∖ {${M(r)}} = ${fmtSet(S)}.`,
    };
  },
};

const inverseRacine = {
  id: 'e-inverse-racine', dmin: 4, titre: 'racine au dénominateur',
  draw() { return { r: nz(-8, 8) }; },
  ex: { r: 2 },
  build({ r }) {
    const D = den(1, r), S = [I(r, 0, INF, 0)];
    return {
      html: `Soit f la fonction définie par${big(fx('f', F(1, R(D))))}Donne l’ensemble de définition de f.`,
      ...rIv(S, x => Number.isFinite(1 / Math.sqrt(x - r))),
      hint: `Il y a deux conditions : la racine doit exister (${D} ≥ 0) et le dénominateur ne doit pas être nul (${D} ≠ 0). Regroupe-les.`,
      solution: `Il faut ${D} ≥ 0 pour que la racine existe, et ${D} ≠ 0 car elle est au dénominateur. Donc ${D} &gt; 0, soit x &gt; ${M(r)} : l’ensemble de définition est ${fmtSet(S)} (borne ${M(r)} exclue).`,
    };
  },
};

const carrePlus = {
  id: 'e-carre-plus', dmin: 4, titre: 'un carré plus un nombre positif',
  draw() { return { k: ri(1, 9), v: ri(0, 2) }; },
  ex: { k: 4, v: 0 },
  build({ k, v }) {
    const D = `${X2} + ${k}`, e = [F(1, D), R(D), F(1, R(D))][v];
    return {
      html: `Soit f la fonction définie par${big(fx('f', e))}Donne l’ensemble de définition de f.`,
      ...rIv(REALS(), x => Number.isFinite([1 / (x * x + k), Math.sqrt(x * x + k), 1 / Math.sqrt(x * x + k)][v])),
      hint: `Un carré n’est jamais négatif : que peut-on dire de ${D} ? Peut-il être nul ou négatif, ce qui poserait problème ?`,
      solution: `${X2} est toujours positif ou nul, donc ${D} ≥ ${k} &gt; 0 pour tout réel x. ${v === 0 ? 'Le dénominateur n’est jamais nul' : v === 1 ? 'Le contenu de la racine n’est jamais négatif' : 'La racine existe et le dénominateur n’est jamais nul'} : f est définie sur ℝ.`,
    };
  },
};

const FORMS1 = [interdite, choixQuot, choixRac, quotient, racine, racineNeg, racineCoef, quotientCoef, inverseRacine, carrePlus];

const visu1 = graph({ xr: [-3, 7], yr: [-1, 4], fs: [{ f: x => Math.sqrt(x - 1), dom: [1, 7], ends: true, l: 'f' }], aria: 'courbe de la fonction racine carrée décalée : elle commence en x = 1' });

export const LV1 = niveau('Ensemble de définition', FORMS1, {
  n: 1, classe: '2de',
  intro: 'Une fonction ne se calcule pas toujours pour tous les nombres. L’ensemble des réels x pour lesquels f(x) existe s’appelle l’<b>ensemble de définition</b> de f. Ici, on apprend à le trouver pour les racines carrées et les quotients.',
  def: '<b>Deux interdits.</b> On ne divise jamais par 0 ; on ne prend jamais la racine carrée d’un nombre négatif. L’ensemble de définition est l’ensemble des x qui évitent ces deux interdits. Exemple : f(x) = √(x − 1) n’existe que pour x ≥ 1, et sa courbe commence en x = 1.',
  visuel: visu1,
  methode: [
    '<b>Quotient</b> : résous « dénominateur = 0 ». Ces valeurs sont interdites ; l’ensemble de définition est ℝ privé de ces valeurs.',
    '<b>Racine carrée</b> : résous « ce qu’il y a sous la racine ≥ 0 » (en changeant le sens de l’inégalité si tu divises par un nombre négatif).',
    'Écris le résultat avec des intervalles : « tous les réels sauf 3 » s’écrit ]−∞ ; 3[ ∪ ]3 ; +∞[.',
  ],
  warn: [
    'Pour une racine, la borne est comprise : √0 = 0 existe. Mais si la racine est au dénominateur, la borne est exclue (on ne divise pas par 0).',
    'Pour une valeur interdite, les crochets sont toujours tournés vers elle : ]−∞ ; 3[ ∪ ]3 ; +∞[. Jamais [−∞ ; 3] : l’infini n’est pas un nombre, son crochet est ouvert.',
  ],
  retenir: 'dénominateur ≠ 0 et (sous la racine) ≥ 0. L’ensemble de définition se lit sur ces deux conditions.',
});

/* =====================================================================================================
   Niveau 2 : fonction carré, images et antécédents
   ===================================================================================================== */
const F2 = fx('f', X2);
const stemCarre = `On considère la fonction f définie par${big(F2)}`;

const cImage = {
  id: 'c-image', dmin: 0, titre: 'image d’un nombre par la fonction carré',
  draw(d) {
    if (d >= 3 && chance(0.5)) { const v = ri(1, 49) / 10; return { x: chance(0.5) ? -v : v }; }
    return { x: nz(d < 1 ? -9 : -12, d < 1 ? 9 : 12) };
  },
  ex: { x: -7 },
  build({ x }) {
    const y = r6(x * x), dec = !Number.isInteger(x);
    return {
      html: `${stemCarre}Calcule l’image de <b>${M(x)}</b> par f.`,
      ...rNums([y], {
        tpl: `f(${M(x)}) = {0}`, value: Math.pow(x, 2),
        msg: v => (v[0] === -y ? `Un carré n’est jamais négatif : ${carre(x)} = ${M(x)} × ${M(x)}, et deux nombres de même signe ont un produit positif.` : v[0] === r6(2 * x) ? `Tu as calculé 2 × ${M(x)} : le carré de ${M(x)}, c’est ${M(x)} × ${M(x)}.` : ''),
      }),
      hint: x < 0
        ? `Remplace x par ${M(x)} dans ${X2} : ${carre(x)} = ${M(x)} × ${M(x)}. Quel est le signe d’un produit de deux nombres négatifs ?`
        : `Remplace x par ${M(x)} dans ${X2} et calcule ${M(x)} × ${M(x)}${dec ? ' ; le résultat a deux chiffres après la virgule' : ''}.`,
      solution: `f(${M(x)}) = ${carre(x)} = ${M(x)} × ${M(x)} = ${M(y)}${x < 0 ? ' (le produit de deux nombres négatifs est positif)' : ''}.`,
    };
  },
};

const cAntecedent = {
  id: 'c-antecedent', dmin: 0, titre: 'antécédents d’un carré parfait',
  draw(d) { const n = d >= 3 && chance(0.3) ? pick([0.5, 1.5, 2.5, 3.5]) : ri(1, 12); return { n }; },
  ex: { n: 7 },
  build({ n }) {
    const k = r6(n * n);
    return {
      html: `${stemCarre}Quels sont les antécédents de <b>${M(k)}</b> par f ?`,
      ...rRoots([-n, n], x => x * x === k, { none: 'Aucun antécédent' }),
      hint: `Un antécédent de ${M(k)} est un nombre x tel que ${X2} = ${M(k)}. Cherche un nombre qui, multiplié par lui-même, donne ${M(k)}, puis pense à son opposé.`,
      solution: `On cherche x tel que ${X2} = ${M(k)}. Comme ${carre(n)} = ${M(k)} et ${carre(-n)} = ${M(k)}, les antécédents de ${M(k)} sont ${M(-n)} et ${M(n)}.`,
    };
  },
};

const cNombre = {
  id: 'c-nombre', dmin: 1, titre: 'combien d’antécédents ?',
  draw() { const t = pick(['neg', 'neg', 'zero', 'pos', 'pos']); return { k: t === 'neg' ? -ri(1, 30) : t === 'zero' ? 0 : ri(1, 60) }; },
  ex: { k: -9 },
  build({ k }) {
    const n = k < 0 ? 0 : k === 0 ? 1 : 2;
    return {
      html: `${stemCarre}Combien le nombre <b>${M(k)}</b> a-t-il d’antécédents par f ?`,
      ...rNums([n], { tpl: 'Nombre d’antécédents : {0}', value: n }),
      hint: `Imagine la parabole de la fonction carré et la droite horizontale y = ${M(k)} : combien de fois se coupent-elles ?`,
      solution: k < 0
        ? `Un carré est toujours positif ou nul, donc ${X2} = ${M(k)} n’a aucune solution : ${M(k)} n’a aucun antécédent (0 antécédent).`
        : k === 0 ? `${X2} = 0 n’a que la solution x = 0 : le nombre 0 a un seul antécédent (1 antécédent), c’est 0.`
          : `${M(k)} est positif : l’équation ${X2} = ${M(k)} a deux solutions, ${rac(k)} et −${rac(k)} (deux nombres opposés). Il a 2 antécédents.`,
    };
  },
};

const cEquation = {
  id: 'c-equation', dmin: 2, titre: 'résoudre x² = k',
  draw(d) {
    const t = pick(['pos', 'pos', 'pos', 'neg', 'zero']);
    return { k: t === 'pos' ? (d >= 3 && chance(0.3) ? pick([0.25, 2.25, 6.25, 12.25]) : ri(1, 12) ** 2) : t === 'neg' ? -ri(1, 30) : 0 };
  },
  ex: { k: -16 },
  build({ k }) {
    const rs = k > 0 ? [-Math.sqrt(k), Math.sqrt(k)].map(r6) : k === 0 ? [0] : [];
    return {
      html: `Résous l’équation${big(`${X2} = ${M(k)}`)}`,
      ...rRoots(rs, x => x * x === k, { none: 'Aucune solution', noneMsg: `Vérifie : un carré peut-il être égal à ${M(k)} ?` }),
      hint: `Pense à la fonction carré : cherche les nombres dont le carré vaut ${M(k)}. Il peut y en avoir deux, un seul ou aucun selon le signe de ${M(k)}.`,
      solution: k > 0 ? `${M(k)} est positif : ${X2} = ${M(k)} a deux solutions, ${M(rs[1])} et ${M(rs[0])}, car ${carre(rs[1])} = ${carre(rs[0])} = ${M(k)}.`
        : k === 0 ? `${X2} = 0 n’a qu’une solution : x = 0.` : `Un carré est toujours positif ou nul : ${X2} = ${M(k)} n’a aucune solution.`,
    };
  },
};

const cPoint = {
  id: 'c-point', dmin: 2, titre: 'un point est-il sur la courbe ?',
  draw() {
    const a = nz(-9, 9), vrai = chance(0.5), faux = [-a * a, 2 * a, a * a + nz(-3, 3), a * a - 1].filter(v => v !== a * a);
    return { a, b: vrai ? a * a : pick(faux) };
  },
  ex: { a: -3, b: -9 },
  build({ a, b }) {
    const y = a * a, vrai = b === y;
    const dire = vrai ? `f(${M(a)}) = ${M(y)} : le point est bien sur la courbe.` : `f(${M(a)}) = ${M(y)} et non ${M(b)} : le point n’est pas sur la courbe.`;
    return {
      html: `${stemCarre}Le point A(${M(a)} ; ${M(b)}) appartient-il à la courbe représentative de f ?`,
      ...rChoice([{ l: 'Oui', ok: vrai, why: dire }, { l: 'Non', ok: !vrai, why: dire }], { ordre: true, indep: Math.abs(a ** 2 - b) < 1e-9 ? 'Oui' : 'Non' }),
      hint: `Calcule l’image de ${M(a)} par f, puis compare-la à l’ordonnée ${M(b)} du point A : A est sur la courbe si les deux sont égales.`,
      solution: `L’image de ${M(a)} est f(${M(a)}) = ${carre(a)} = ${M(y)}. ${vrai ? `L’ordonnée de A est ${M(b)} : c’est la même, donc A appartient à la courbe.` : `L’ordonnée de A est ${M(b)}, différente de ${M(y)} : A n’appartient pas à la courbe.`}`,
    };
  },
};

const FORMS2 = [cImage, cAntecedent, cNombre, cEquation, cPoint];
const parab = (pts = [], h) => graph({ xr: [-4, 4], yr: [-1, 10], fs: [{ f: x => x * x, dom: [-3.2, 3.2], l: 'f' }], pts, h, aria: 'parabole, courbe de la fonction carré' });
const visu2 = parab([{ x: -3, y: 9, l: 'A(−3 ; 9)', px: true, py: true, anchor: 'end' }, { x: 2, y: 4, l: 'B(2 ; 4)', px: true, py: true, anchor: 'start' }]);

export const LV2 = niveau('Fonction carré : images et antécédents', FORMS2, {
  n: 2, classe: '2de',
  intro: 'La <b>fonction carré</b> associe à chaque réel x son carré : f(x) = x². Sa courbe est une <b>parabole</b>, symétrique par rapport à l’axe des ordonnées. Elle est définie pour tous les réels.',
  def: '<b>Image et antécédents.</b> L’image de 3 est f(3) = 3² = 9. Les antécédents de 9 sont les nombres x tels que x² = 9 : il y en a deux, 3 et −3. Sur la courbe, on coupe la parabole par la droite horizontale d’ordonnée 9.',
  visuel: visu2,
  methode: [
    '<b>Image de a</b> : calcule a × a. Un carré n’est jamais négatif : (−3)² = (−3) × (−3) = 9.',
    '<b>Antécédents de k</b> : cherche x tel que x² = k. Si k &gt; 0 il y en a deux, opposés ; si k = 0 un seul (0) ; si k &lt; 0 aucun.',
    '<b>Point sur la courbe</b> : le point (a ; b) y est si b = a².',
  ],
  warn: [
    '(−3)² = 9, mais −3² (sans parenthèses) = −9 : sur la calculatrice comme à la main, mets les parenthèses.',
    'x² n’est pas 2x : 4² = 16, alors que 2 × 4 = 8.',
    'Un nombre positif a deux antécédents par la fonction carré : n’oublie pas l’opposé.',
  ],
  retenir: 'f(a) = a × a ≥ 0 ; k &gt; 0 a deux antécédents (√k et −√k), 0 en a un, un nombre négatif n’en a aucun.',
});

/* =====================================================================================================
   Niveau 3 : fonction carré, variations, comparaisons, inéquations
   ===================================================================================================== */
/** parabole avec la droite y = k et les extrémités de l'intervalle solution (n = racine de k) */
const parabSol = (n, k) => graph({
  xr: [-(Math.ceil(n) + 1), Math.ceil(n) + 1], yr: [-1, k + Math.max(1, Math.round(k / 8))],
  fs: [{ f: x => x * x, l: 'f' }], h: { y: k, l: `y = ${M(k)}` },
  pts: [{ x: -n, y: k, px: true, l: M(-n), anchor: 'end', ly: -10 }, { x: n, y: k, px: true, l: M(n), anchor: 'start', ly: -10 }], aria: `parabole et droite y = ${M(k)}`,
});

const vIntervalle = {
  id: 'v-intervalle', dmin: 0, titre: 'sens de variation sur un intervalle',
  draw(d) {
    let p, q;
    if (d >= 2 && chance(0.35)) { p = -ri(1, 8); q = ri(1, 8); } else if (chance(0.5)) { p = ri(0, 8); q = p + ri(1, 5); } else { q = -ri(0, 8); p = q - ri(1, 5); }
    return { p, q };
  },
  ex: { p: -6, q: -2 },
  build({ p, q }) {
    const bonne = p >= 0 ? 'croissante' : q <= 0 ? 'décroissante' : 'ni croissante ni décroissante';
    const why = {
      croissante: p >= 0 ? '' : q <= 0 ? `Sur [${M(p)} ; ${M(q)}], les nombres sont négatifs : plus x grandit, plus x² diminue.` : `L’intervalle contient 0 : la fonction carré descend avant 0 puis monte.`,
      'décroissante': p >= 0 ? `Sur [${M(p)} ; ${M(q)}], les nombres sont positifs : plus x grandit, plus x² grandit aussi.` : q <= 0 ? '' : `L’intervalle contient 0 : la fonction carré descend avant 0 puis monte.`,
      'ni croissante ni décroissante': `Les deux bornes ${M(p)} et ${M(q)} sont du même côté de 0 : la fonction carré y est monotone.`,
    };
    return {
      html: `Sur l’intervalle [${M(p)} ; ${M(q)}], la fonction carré est :`,
      ...rChoice(['croissante', 'décroissante', 'ni croissante ni décroissante'].map(l => ({ l, ok: l === bonne, why: why[l] })), { ordre: true, indep: sensNum(x => x * x, p, q) }),
      hint: `La fonction carré descend jusqu’à 0 puis remonte. Où se trouve l’intervalle [${M(p)} ; ${M(q)}] par rapport à 0 : à gauche, à droite, ou de part et d’autre ?`,
      solution: p >= 0 ? `Sur [${M(p)} ; ${M(q)}], tous les nombres sont positifs ou nuls : la fonction carré est croissante sur [0 ; +∞[, donc sur cet intervalle.`
        : q <= 0 ? `Sur [${M(p)} ; ${M(q)}], tous les nombres sont négatifs ou nuls : la fonction carré est décroissante sur ]−∞ ; 0], donc sur cet intervalle.`
          : `L’intervalle [${M(p)} ; ${M(q)}] contient 0 : la fonction carré décroît sur [${M(p)} ; 0] puis croît sur [0 ; ${M(q)}]. Elle n’est ni croissante ni décroissante.`,
    };
  },
};

const vCmpPos = {
  id: 'v-cmp-pos', dmin: 0, titre: 'comparer deux carrés de nombres positifs',
  draw(d) { if (d >= 3 && chance(0.4)) { const a = ri(1, 40) / 10; return { a, b: a + ri(1, 30) / 10 }; } const a = ri(1, 11); return { a, b: a + ri(1, 12 - a) }; },
  ex: { a: 3, b: 5 },
  build({ a, b }) {
    return {
      html: `On sait que ${M(a)} &lt; ${M(b)}. Compare ${carre(a)} et ${carre(b)}.`,
      ...rCmp('<', { value: a * a - b * b }),
      hint: `Regarde le signe de ${M(a)} et de ${M(b)} : sur l’intervalle qui les contient, la fonction carré est-elle croissante ou décroissante ?`,
      solution: `${M(a)} et ${M(b)} sont positifs. Sur [0 ; +∞[, la fonction carré est croissante : elle conserve l’ordre. Comme ${M(a)} &lt; ${M(b)}, on a ${carre(a)} &lt; ${carre(b)} (${M(r6(a * a))} &lt; ${M(r6(b * b))}).`,
    };
  },
};

const vCmpNeg = {
  id: 'v-cmp-neg', dmin: 1, titre: 'comparer deux carrés de nombres négatifs',
  draw(d) { if (d >= 3 && chance(0.4)) { const b = -ri(1, 40) / 10; return { a: b - ri(1, 30) / 10, b }; } const b = -ri(1, 11); return { a: b - ri(1, 12), b }; },
  ex: { a: -7, b: -3 },
  build({ a, b }) {
    return {
      html: `On sait que ${M(a)} &lt; ${M(b)}. Compare ${carre(a)} et ${carre(b)}.`,
      ...rCmp('>', { value: a * a - b * b, msg: `Les deux nombres sont négatifs : la fonction carré est décroissante sur ]−∞ ; 0], elle renverse l’ordre.` }),
      hint: `Regarde le signe de ${M(a)} et de ${M(b)} : sur l’intervalle qui les contient, la fonction carré est-elle croissante ou décroissante ?`,
      solution: `${M(a)} et ${M(b)} sont négatifs. Sur ]−∞ ; 0], la fonction carré est décroissante : elle renverse l’ordre. Comme ${M(a)} &lt; ${M(b)}, on a ${carre(a)} &gt; ${carre(b)} (${M(r6(a * a))} &gt; ${M(r6(b * b))}).`,
    };
  },
};

const vCmpMixte = {
  id: 'v-cmp-mixte', dmin: 3, titre: 'comparer deux carrés de signes différents',
  draw(d) { const a = -ri(1, 9); let b = ri(1, 9); if (d >= 4 && chance(0.3)) b = -a; return { a, b }; },
  ex: { a: -6, b: 4 },
  build({ a, b }) {
    const A = a * a, B = b * b, s = signe(A - B);
    return {
      html: `Compare ${carre(a)} et ${carre(b)}.`,
      ...rCmp(s, { value: A - B, msg: `Les deux nombres n’ont pas le même signe : ne conclus pas avec le sens de variation, calcule les deux carrés.` }),
      hint: `${M(a)} et ${M(b)} n’ont pas le même signe : on ne peut pas utiliser directement le sens de variation. Calcule chaque carré, ou compare les distances de ${M(a)} et de ${M(b)} à 0.`,
      solution: `${carre(a)} = ${M(A)} et ${carre(b)} = ${M(B)}. Donc ${carre(a)} ${sgnTxt[s]} ${carre(b)}${s === '=' ? ' (deux nombres opposés ont le même carré)' : ''}.`,
    };
  },
};

const vEnc = {
  id: 'v-enc', dmin: 2, titre: 'encadrer x² (x positif)',
  draw() { const a = ri(0, 8); return { a, b: a + ri(1, 6) }; },
  ex: { a: 2, b: 5 },
  build({ a, b }) {
    const mn = a * a, mx = b * b;
    return {
      html: `Sachant que ${M(a)} ≤ x ≤ ${M(b)}, encadre x<sup>2</sup>.`,
      ...rNums([mn, mx], { tpl: '{0} ≤ x<sup>2</sup> ≤ {1}', value: mx, msg: v => (v[0] > v[1] ? 'Le plus petit nombre va à gauche.' : '') }),
      verify: E => { let lo = Infinity, hi = -Infinity; for (let x = a; x <= b + 1e-9; x += 0.05) { lo = Math.min(lo, x * x); hi = Math.max(hi, x * x); } return Math.abs(lo - E[0]) < 0.2 && Math.abs(hi - E[1]) < 0.2 && E[0] <= E[1]; },
      hint: `Les nombres de l’intervalle [${M(a)} ; ${M(b)}] sont positifs ou nuls : la fonction carré y est croissante. Applique-la aux deux bornes.`,
      solution: `x est entre ${M(a)} et ${M(b)}, deux nombres positifs ou nuls. La fonction carré est croissante sur [0 ; +∞[, donc ${carre(a)} ≤ x<sup>2</sup> ≤ ${carre(b)}, soit ${M(mn)} ≤ x<sup>2</sup> ≤ ${M(mx)}.`,
    };
  },
};

const vEncNeg = {
  id: 'v-enc-neg', dmin: 3, titre: 'encadrer x² (x négatif)',
  draw() { const b = -ri(0, 8); return { a: b - ri(1, 6), b }; },
  ex: { a: -5, b: -2 },
  build({ a, b }) {
    const mn = b * b, mx = a * a;
    return {
      html: `Sachant que ${M(a)} ≤ x ≤ ${M(b)}, encadre x<sup>2</sup>.`,
      ...rNums([mn, mx], { tpl: '{0} ≤ x<sup>2</sup> ≤ {1}', value: mx, msg: v => (v[0] === a * a && v[1] === b * b ? `La fonction carré est décroissante sur ]−∞ ; 0] : l’ordre est renversé, le plus petit carré est celui de ${M(b)}.` : '') }),
      verify: E => { let lo = Infinity, hi = -Infinity; for (let x = a; x <= b + 1e-9; x += 0.05) { lo = Math.min(lo, x * x); hi = Math.max(hi, x * x); } return Math.abs(lo - E[0]) < 0.2 && Math.abs(hi - E[1]) < 0.2; },
      hint: `Les nombres de l’intervalle [${M(a)} ; ${M(b)}] sont négatifs ou nuls : la fonction carré y est décroissante. Que devient l’ordre des bornes ?`,
      solution: `x est entre ${M(a)} et ${M(b)}, deux nombres négatifs ou nuls. La fonction carré est décroissante sur ]−∞ ; 0] : elle renverse l’ordre. Donc ${carre(b)} ≤ x<sup>2</sup> ≤ ${carre(a)}, soit ${M(mn)} ≤ x<sup>2</sup> ≤ ${M(mx)}.`,
    };
  },
};

const vEncZero = {
  id: 'v-enc-zero', dmin: 4, titre: 'encadrer x² (intervalle contenant 0)',
  draw() { const a = -ri(1, 8); let b = ri(1, 8); if (b === -a) b++; return { a, b }; },
  ex: { a: -3, b: 2 },
  build({ a, b }) {
    const mx = Math.max(a * a, b * b);
    return {
      html: `Sachant que ${M(a)} ≤ x ≤ ${M(b)}, encadre x<sup>2</sup>.`,
      ...rNums([0, mx], { tpl: '{0} ≤ x<sup>2</sup> ≤ {1}', value: mx, msg: v => (v[0] === Math.min(a * a, b * b) ? `L’intervalle contient 0, et 0<sup>2</sup> = 0 est le plus petit carré possible.` : '') }),
      verify: E => { let lo = Infinity, hi = -Infinity; for (let x = a; x <= b + 1e-9; x += 0.05) { lo = Math.min(lo, x * x); hi = Math.max(hi, x * x); } return Math.abs(lo - E[0]) < 0.2 && Math.abs(hi - E[1]) < 0.2; },
      hint: `L’intervalle [${M(a)} ; ${M(b)}] contient 0, où la fonction carré passe de la décroissance à la croissance : le plus petit carré est atteint en 0. Quel est le plus grand, celui de ${M(a)} ou celui de ${M(b)} ?`,
      solution: `La fonction carré décroît jusqu’à 0 puis croît : son minimum sur l’intervalle est ${carre(0)} = 0. Les bornes donnent ${carre(a)} = ${M(a * a)} et ${carre(b)} = ${M(b * b)} : le maximum est ${M(mx)}. Donc 0 ≤ x<sup>2</sup> ≤ ${M(mx)}.`,
    };
  },
};

const vIneq = {
  id: 'v-ineq', dmin: 1, titre: 'résoudre x² < k',
  draw(d) { return { n: d >= 3 && chance(0.25) ? pick([0.5, 1.5, 2.5]) : ri(1, 12), rel: pick(['<', '≤']) }; },
  ex: { n: 3, rel: '<' },
  build({ n, rel }) {
    const k = r6(n * n), large = rel === '≤', S = [I(-n, large, n, large)];
    return {
      html: `Résous l’inéquation${big(`${X2} ${REL[rel]} ${M(k)}`)}`,
      ...rIv(S, x => (large ? x * x <= k : x * x < k)),
      hint: `Imagine la parabole de la fonction carré et la droite horizontale y = ${M(k)} : les solutions de ${X2} = ${M(k)} sont les bornes de l’intervalle cherché. Où la parabole est-elle sous la droite ?`,
      solution: `${X2} = ${M(k)} a pour solutions ${M(-n)} et ${M(n)}. La parabole est ${large ? 'sous la droite ou sur elle' : 'strictement sous la droite'} y = ${M(k)} entre ces deux nombres : S = ${fmtSet(S)}.`,
      afterVisual: parabSol(n, k),
    };
  },
};

const vIneqSup = {
  id: 'v-ineq-sup', dmin: 3, titre: 'résoudre x² > k',
  draw(d) { return { n: d >= 4 && chance(0.25) ? pick([0.5, 1.5, 2.5]) : ri(1, 12), rel: pick(['>', '≥']) }; },
  ex: { n: 4, rel: '>' },
  build({ n, rel }) {
    const k = r6(n * n), large = rel === '≥', S = [I(-INF, 0, -n, large), I(n, large, INF, 0)];
    return {
      html: `Résous l’inéquation${big(`${X2} ${REL[rel]} ${M(k)}`)}`,
      ...rIv(S, x => (large ? x * x >= k : x * x > k)),
      hint: `Imagine la parabole de la fonction carré et la droite horizontale y = ${M(k)} : les solutions de ${X2} = ${M(k)} partagent l’axe en trois morceaux. Où la parabole est-elle au-dessus de la droite ?`,
      solution: `${X2} = ${M(k)} a pour solutions ${M(-n)} et ${M(n)}. La parabole est ${large ? 'au-dessus de la droite ou sur elle' : 'strictement au-dessus de la droite'} y = ${M(k)} à l’extérieur de ces deux nombres : S = ${fmtSet(S)}.`,
      afterVisual: parabSol(n, k),
    };
  },
};

const vIneqSpec = {
  id: 'v-ineq-spec', dmin: 4, titre: 'inéquation de carré sans solution ou toujours vraie',
  draw() { return { t: pick(['a', 'b', 'c', 'd']), k: ri(1, 12) }; },
  ex: { t: 'a', k: 4 },
  build({ t, k }) {
    const T = {
      a: { s: `${X2} &lt; ${M(-k)}`, S: [], truth: x => x * x < -k, rhs: M(-k), sol: `un carré est toujours positif ou nul, donc il ne peut pas être inférieur à ${M(-k)} : aucun réel ne convient, S = ∅.` },
      b: { s: `${X2} &gt; ${M(-k)}`, S: REALS(), truth: x => x * x > -k, rhs: M(-k), sol: `un carré est toujours positif ou nul, donc toujours supérieur à ${M(-k)} : tous les réels conviennent, S = ℝ.` },
      c: { s: `${X2} &gt; 0`, S: [I(-INF, 0, 0, 0), I(0, 0, INF, 0)], truth: x => x * x > 0, rhs: '0', sol: `un carré est strictement positif sauf pour x = 0, où il vaut 0 : S = ]−∞ ; 0[ ∪ ]0 ; +∞[.` },
      d: { s: `${X2} ≥ 0`, S: REALS(), truth: x => x * x >= 0, rhs: '0', sol: `un carré est toujours positif ou nul : tous les réels conviennent, S = ℝ.` },
    }[t];
    return {
      html: `Résous l’inéquation${big(T.s)}`,
      ...rIv(T.S, T.truth),
      hint: `Un carré n’est jamais négatif : sur la parabole, repère si elle passe sous ou au-dessus de la droite y = ${T.rhs}, et pour quels x.`,
      solution: `Sur la parabole de la fonction carré, ${T.sol}`,
    };
  },
};

const FORMS3 = [vIntervalle, vCmpPos, vCmpNeg, vIneq, vEnc, vCmpMixte, vIneqSup, vEncNeg, vEncZero, vIneqSpec];

export const LV3 = niveau('Fonction carré : variations et inéquations', FORMS3, {
  n: 3, classe: '2de',
  intro: 'Sur la parabole, on voit que la fonction carré <b>décroît</b> pour les nombres négatifs, passe par son minimum 0, puis <b>croît</b> pour les nombres positifs. C’est ce qui permet de comparer des carrés sans les calculer et de résoudre des inéquations.',
  def: '<b>Variations.</b> La fonction carré est décroissante sur ]−∞ ; 0] et croissante sur [0 ; +∞[. Son minimum est 0, atteint en 0. Elle conserve l’ordre des nombres positifs et le renverse pour les nombres négatifs.',
  visuel: parabSol(3, 9),
  methode: [
    '<b>Comparer</b> a² et b² : regarde le signe de a et de b. Tous deux positifs : même ordre. Tous deux négatifs : ordre renversé. Signes différents : calcule les carrés.',
    '<b>Encadrer x²</b> : applique la fonction carré aux bornes, dans le bon ordre. Si l’intervalle contient 0, le minimum est 0.',
    '<b>Résoudre x² &lt; k</b> (k &gt; 0) : trouve les solutions de x² = k, puis lis sur la parabole où elle est sous la droite y = k.',
  ],
  warn: [
    'x² &lt; 9 ne signifie pas x &lt; 3 : x = −5 donne 25. La solution est ]−3 ; 3[.',
    'Pour x² &gt; 9, il y a deux morceaux : ]−∞ ; −3[ ∪ ]3 ; +∞[.',
    'On ne peut pas utiliser « croissante » sur un intervalle qui contient 0.',
  ],
  retenir: 'carré : ↘ sur ]−∞ ; 0], ↗ sur [0 ; +∞[ ; x² &lt; k (k &gt; 0) a pour solutions ]−√k ; √k[.',
});

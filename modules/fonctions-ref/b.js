// Niveaux 4 à 6 : fonction inverse ; racine carrée et cube ; reconnaître une courbe de référence.
import {
  ri, pick, chance, M, P, F, R, I, REALS, INF, fmtSet, r6, niveau, rNums, rFrac, rIv, rRoots, rCmp, rChoice,
  carre, cube, inv, rac, X2, X3, big, fx, signe, sgnTxt, sensNum, melange,
} from './outils.js';
import { REF, CLES, graph, graphRef, miniRef, tabVarRef } from './draw.js';

const nz = (a, b) => { let v; do { v = ri(a, b); } while (v === 0); return v; };
const NOMF = ['f', 'g', 'h'];
/** valeurs dont l'inverse est un décimal court */
const DEC0 = [2, 4, 5, 8, 10, 20, 25], DEC1 = [...DEC0, 0.5, 0.25, 0.2, 0.1, 0.4, 0.8, 1.25, 2.5, 40, 50];
const decVal = d => pick(d < 1 ? DEC0 : DEC1) * (chance(0.5) ? 1 : -1);
const STEM_INV = nom => `On considère la fonction inverse ${nom} définie par${big(fx(nom, F(1, 'x')))}`;
const verifEnc = (f, a, b) => E => { let lo = Infinity, hi = -Infinity; for (let x = a; x <= b + 1e-9; x += 0.01) { const y = f(x); lo = Math.min(lo, y); hi = Math.max(hi, y); } return Math.abs(lo - E[0]) < 0.05 && Math.abs(hi - E[1]) < 0.05; };

/* =====================================================================================================
   Niveau 4 : fonction inverse
   ===================================================================================================== */
const iImage = {
  id: 'i-image', dmin: 0, titre: 'image par la fonction inverse (résultat décimal)',
  draw(d) { return { x: decVal(d) }; },
  ex: { x: -4 },
  build({ x }) {
    const y = r6(1 / x);
    return {
      html: `${STEM_INV('f')}Calcule l’image de <b>${M(x)}</b> par f.`,
      ...rNums([y], { tpl: `f(${M(x)}) = {0}`, value: 1 / x, msg: v => (v[0] === -y ? `Vérifie le signe : l’inverse d’un nombre ${x < 0 ? 'négatif est négatif' : 'positif est positif'}.` : v[0] === x ? `Tu as recopié ${M(x)} : l’image est ${F(1, M(x))}.` : '') }),
      hint: `Remplace x par ${M(x)} : f(${M(x)}) = 1 ÷ ${P(x)}. Calcule ce quotient en écriture décimale.`,
      solution: `f(${M(x)}) = ${F(1, M(x))} = 1 ÷ ${P(x)} = ${M(y)}${x < 0 ? ' (un quotient d’un nombre positif par un nombre négatif est négatif)' : ''}.`,
    };
  },
};

const iImageFrac = {
  id: 'i-image-frac', dmin: 2, titre: 'image par la fonction inverse (fraction)',
  draw() { return { x: pick([3, 6, 7, 9, 11, 12, 15]) * (chance(0.5) ? 1 : -1) }; },
  ex: { x: -3 },
  build({ x }) {
    return {
      html: `${STEM_INV('f')}Calcule l’image de <b>${M(x)}</b> par f. Donne le résultat sous forme de fraction.`,
      ...rFrac(1, x, { value: 1 / x }),
      hint: `Remplace x par ${M(x)} : f(${M(x)}) = 1 ÷ ${P(x)}. Ce n’est pas un nombre décimal : écris le résultat avec une fraction${x < 0 ? ' et pense au signe' : ''}.`,
      solution: `f(${M(x)}) = ${F(1, M(x))} = ${x < 0 ? '−' : ''}${F(1, Math.abs(x))}. La fraction ne se simplifie pas.`,
    };
  },
};

const iAntecedent = {
  id: 'i-antecedent', dmin: 1, titre: 'antécédent par la fonction inverse',
  draw(d) { return { k: decVal(d) }; },
  ex: { k: 5 },
  build({ k }) {
    const x = r6(1 / k);
    return {
      html: `${STEM_INV('f')}Quel est l’antécédent de <b>${M(k)}</b> par f ?`,
      ...rNums([x], { tpl: 'x = {0}', value: x }),
      verify: E => Math.abs(1 / E[0] - k) < 1e-9,
      hint: `On cherche x tel que ${F(1, 'x')} = ${M(k)}. Si 1 divisé par x donne ${M(k)}, que vaut x ? Pense à l’inverse du nombre ${M(k)}.`,
      solution: `On résout ${F(1, 'x')} = ${M(k)}. L’inverse de ${M(k)} est ${F(1, M(k))} = ${M(x)}, donc x = ${M(x)}. Vérification : 1 ÷ ${P(x)} = ${M(k)}.`,
    };
  },
};

const iZeroImg = {
  id: 'i-zero-image', dmin: 1, titre: 'l’image de 0',
  draw() { return { nom: pick(NOMF), c: pick([1, 1, 2, 3, 4, 5, -1, -2]) }; },
  ex: { nom: 'f', c: 1 },
  build({ nom, c }) {
    const e = c === 1 ? F(1, 'x') : F(M(c), 'x');
    return {
      html: `Soit ${nom} la fonction définie par${big(fx(nom, e))}Que dire de ${nom}(0) ?`,
      ...rChoice([
        { l: `${nom}(0) n’existe pas`, ok: true },
        { l: `${nom}(0) = 0`, why: `${M(c)} ÷ 0 n’est pas égal à 0 : on ne peut pas diviser par 0.` },
        { l: `${nom}(0) = ${M(c)}`, why: `Remplacer x par 0 donne ${M(c)} ÷ 0, pas ${M(c)} : la division par 0 est impossible.` },
      ], { indep: `${nom}(0) n’existe pas` }),
      hint: `Remplace x par 0 dans ${nom}(x) : tu obtiens ${M(c)} divisé par 0. Cette division est-elle possible ?`,
      solution: `${nom}(0) = ${F(M(c), 0)} : on ne peut pas diviser par 0. Le nombre 0 n’a pas d’image : la fonction inverse n’est pas définie en 0.`,
    };
  },
};

const iZeroAnt = {
  id: 'i-zero-ant', dmin: 3, titre: 'un antécédent de 0 ?',
  draw() { return { nom: pick(NOMF), c: pick([1, 2, 3, 4, 5, -1, -2, -3]) }; },
  ex: { nom: 'f', c: 2 },
  build({ nom, c }) {
    const e = c === 1 ? F(1, 'x') : F(M(c), 'x');
    return {
      html: `Soit ${nom} la fonction définie par${big(fx(nom, e))}Le nombre 0 a-t-il un antécédent par ${nom} ?`,
      ...rChoice([{ l: 'Non', ok: true }, { l: 'Oui', why: `Un quotient n’est nul que si son numérateur est nul. Ici le numérateur est ${M(c)}, qui n’est pas nul.` }], { ordre: true, indep: 'Non' }),
      hint: `Pour qu’un antécédent de 0 existe, il faudrait ${e} = 0 pour un certain x. Un quotient peut-il être nul quand son numérateur vaut ${M(c)} ?`,
      solution: `Le numérateur ${M(c)} n’est pas nul, donc ${F(M(c), 'x')} n’est jamais égal à 0, quel que soit x. Le nombre 0 n’a aucun antécédent : la courbe ne coupe pas l’axe des abscisses.`,
    };
  },
};

const iSens = {
  id: 'i-sens', dmin: 0, titre: 'sens de variation de la fonction inverse',
  draw() { return { v: ri(0, 1) }; },
  ex: { v: 0 },
  build({ v }) {
    const S = v ? [I(-INF, 0, 0, 0)] : [I(0, 0, INF, 0)], connu = v ? ']0 ; +∞[' : ']−∞ ; 0[';
    return {
      html: `La fonction inverse est décroissante sur ${connu} et sur un autre intervalle. Lequel ?`,
      ...rIv(S, v ? x => x < 0 : x => x > 0),
      hint: `La fonction inverse n’est pas définie en 0 : son ensemble de définition est coupé en deux intervalles, de chaque côté de 0. Tu connais déjà ${connu} : quel est l’autre côté de 0 ?`,
      solution: `La fonction inverse est définie sur ℝ ∖ {0} = ]−∞ ; 0[ ∪ ]0 ; +∞[. Elle est décroissante sur chacun de ces deux intervalles (mais pas sur leur réunion). L’autre intervalle est ${fmtSet(S)}.`,
    };
  },
};

const iIntervalle = {
  id: 'i-intervalle', dmin: 1, titre: 'la fonction inverse sur un intervalle',
  draw(d) {
    if (d >= 3 && chance(0.35)) { const p = -ri(1, 6); return { p, q: ri(0, 6) }; }
    if (chance(0.5)) { const p = ri(1, 8); return { p, q: p + ri(1, 6) }; }
    const q = -ri(1, 8); return { p: q - ri(1, 6), q };
  },
  ex: { p: 2, q: 6 },
  build({ p, q }) {
    const L = ['décroissante', 'croissante', 'pas définie sur tout l’intervalle'];
    const bonne = p < 0 && q >= 0 ? L[2] : L[0];
    const why = { [L[0]]: 'L’intervalle contient 0 : la fonction inverse n’y est pas définie.', [L[1]]: `Sur un intervalle où la fonction inverse est définie, elle est décroissante : plus x grandit, plus ${F(1, 'x')} diminue.`, [L[2]]: `L’intervalle [${M(p)} ; ${M(q)}] ne contient pas 0 : la fonction inverse y est définie.` };
    return {
      html: `Sur l’intervalle [${M(p)} ; ${M(q)}], la fonction inverse est :`,
      ...rChoice(L.map(l => ({ l, ok: l === bonne, why: why[l] })), { ordre: true, indep: (p <= 0 && q >= 0 ? L[2] : sensNum(x => 1 / x, p, q)) }),
      hint: `Cherche d’abord si l’intervalle [${M(p)} ; ${M(q)}] contient 0, qui est interdit. Sinon, rappelle-toi dans quel sens varie la fonction inverse de chaque côté de 0.`,
      solution: p < 0 && q >= 0 ? `L’intervalle [${M(p)} ; ${M(q)}] contient 0 et la fonction inverse n’est pas définie en 0 : elle n’est pas définie sur tout l’intervalle.`
        : `L’intervalle [${M(p)} ; ${M(q)}] est ${p > 0 ? 'inclus dans ]0 ; +∞[' : 'inclus dans ]−∞ ; 0['}, où la fonction inverse est décroissante : elle l’est sur cet intervalle.`,
    };
  },
};

const iCmpPos = {
  id: 'i-cmp-pos', dmin: 0, titre: 'comparer deux inverses de nombres positifs',
  draw() { const a = ri(2, 12); return { a, b: a + ri(1, 10) }; },
  ex: { a: 2, b: 5 },
  build({ a, b }) {
    return {
      html: `On sait que ${M(a)} &lt; ${M(b)}. Compare ${inv(a)} et ${inv(b)}.`,
      ...rCmp('>', { value: 1 / a - 1 / b, msg: `La fonction inverse est décroissante sur ]0 ; +∞[ : elle renverse l’ordre.` }),
      hint: `${M(a)} et ${M(b)} sont tous deux positifs : sur ]0 ; +∞[, la fonction inverse est-elle croissante ou décroissante ?`,
      solution: `${M(a)} et ${M(b)} sont positifs. Sur ]0 ; +∞[, la fonction inverse est décroissante : elle renverse l’ordre. Comme ${M(a)} &lt; ${M(b)}, on a ${inv(a)} &gt; ${inv(b)}.`,
    };
  },
};

const iCmpNeg = {
  id: 'i-cmp-neg', dmin: 2, titre: 'comparer deux inverses de nombres négatifs',
  draw() { const b = -ri(2, 10); return { a: b - ri(1, 8), b }; },
  ex: { a: -4, b: -2 },
  build({ a, b }) {
    return {
      html: `On sait que ${M(a)} &lt; ${M(b)}. Compare ${inv(a)} et ${inv(b)}.`,
      ...rCmp('>', { value: 1 / a - 1 / b, msg: `La fonction inverse est décroissante sur ]−∞ ; 0[ : elle renverse l’ordre.` }),
      hint: `${M(a)} et ${M(b)} sont tous deux négatifs : sur ]−∞ ; 0[, la fonction inverse est-elle croissante ou décroissante ? Tu peux aussi essayer avec les décimaux 1 ÷ ${P(a)} et 1 ÷ ${P(b)}.`,
      solution: `${M(a)} et ${M(b)} sont négatifs. Sur ]−∞ ; 0[, la fonction inverse est décroissante : elle renverse l’ordre. Comme ${M(a)} &lt; ${M(b)}, on a ${inv(a)} &gt; ${inv(b)}.`,
    };
  },
};

const iCmpMixte = {
  id: 'i-cmp-mixte', dmin: 3, titre: 'comparer deux inverses de signes différents',
  draw() { return { a: -ri(2, 9), b: ri(2, 9) }; },
  ex: { a: -2, b: 3 },
  build({ a, b }) {
    return {
      html: `On sait que ${M(a)} &lt; ${M(b)}. Compare ${inv(a)} et ${inv(b)}.`,
      ...rCmp('<', { value: 1 / a - 1 / b, msg: `Le sens de variation ne s’applique pas de part et d’autre de 0 : ici, un nombre négatif est plus petit qu’un nombre positif.` }),
      hint: `${M(a)} et ${M(b)} sont de signes différents : la fonction inverse n’est pas décroissante sur la réunion ]−∞ ; 0[ ∪ ]0 ; +∞[. Quel est le signe de ${inv(a)} ? Et celui de ${inv(b)} ?`,
      solution: `${inv(a)} est négatif (on divise 1 par un nombre négatif) et ${inv(b)} est positif. Un nombre négatif est plus petit qu’un nombre positif : ${inv(a)} &lt; ${inv(b)}. Attention : la règle « elle renverse l’ordre » ne vaut que d’un même côté de 0.`,
    };
  },
};

const iEncPos = {
  id: 'i-enc-pos', dmin: 1, titre: 'encadrer 1/x (x positif)',
  draw() { const L = [1, 2, 4, 5, 8, 10, 20, 25], i = ri(0, L.length - 2), j = ri(i + 1, L.length - 1); return { a: L[i], b: L[j] }; },
  ex: { a: 2, b: 5 },
  build({ a, b }) {
    const lo = r6(1 / b), hi = r6(1 / a);
    return {
      html: `Sachant que ${M(a)} ≤ x ≤ ${M(b)}, encadre ${F(1, 'x')}.`,
      ...rNums([lo, hi], { tpl: `{0} ≤ ${F(1, 'x')} ≤ {1}`, value: hi, msg: v => (v[0] === hi && v[1] === lo ? `La fonction inverse renverse l’ordre : le plus petit nombre est ${F(1, M(b))}, à gauche.` : '') }),
      verify: verifEnc(x => 1 / x, a, b),
      hint: `Les nombres de l’intervalle [${M(a)} ; ${M(b)}] sont positifs : la fonction inverse y est décroissante. Applique-la aux deux bornes en renversant l’ordre.`,
      solution: `x est entre ${M(a)} et ${M(b)}, deux nombres positifs. La fonction inverse est décroissante sur ]0 ; +∞[ : elle renverse l’ordre. Donc ${F(1, M(b))} ≤ ${F(1, 'x')} ≤ ${F(1, M(a))}, soit ${M(lo)} ≤ ${F(1, 'x')} ≤ ${M(hi)}.`,
    };
  },
};

const iEncNeg = {
  id: 'i-enc-neg', dmin: 3, titre: 'encadrer 1/x (x négatif)',
  draw() { const L = [1, 2, 4, 5, 8, 10, 20, 25], i = ri(0, L.length - 2), j = ri(i + 1, L.length - 1); return { a: -L[j], b: -L[i] }; },
  ex: { a: -5, b: -2 },
  build({ a, b }) {
    const lo = r6(1 / b), hi = r6(1 / a);
    return {
      html: `Sachant que ${M(a)} ≤ x ≤ ${M(b)}, encadre ${F(1, 'x')}.`,
      ...rNums([lo, hi], { tpl: `{0} ≤ ${F(1, 'x')} ≤ {1}`, value: hi, msg: v => (v[0] === hi && v[1] === lo ? `La fonction inverse renverse l’ordre sur ]−∞ ; 0[ : le plus petit nombre est ${F(1, M(b))}.` : '') }),
      verify: verifEnc(x => 1 / x, a, b),
      hint: `Les nombres de l’intervalle [${M(a)} ; ${M(b)}] sont négatifs : la fonction inverse y est décroissante. Applique-la aux deux bornes en renversant l’ordre, sans perdre le signe.`,
      solution: `x est entre ${M(a)} et ${M(b)}, deux nombres négatifs. La fonction inverse est décroissante sur ]−∞ ; 0[ : elle renverse l’ordre. Donc ${F(1, M(b))} ≤ ${F(1, 'x')} ≤ ${F(1, M(a))}, soit ${M(lo)} ≤ ${F(1, 'x')} ≤ ${M(hi)}.`,
    };
  },
};

const FORMS4 = [iImage, iSens, iCmpPos, iAntecedent, iZeroImg, iIntervalle, iEncPos, iImageFrac, iCmpNeg, iZeroAnt, iCmpMixte, iEncNeg];

export const LV4 = niveau('Fonction inverse', FORMS4, {
  n: 4, classe: '2de',
  intro: 'La <b>fonction inverse</b> est définie par f(x) = 1/x. Elle n’existe pas en 0 : son ensemble de définition est ℝ privé de 0. Sa courbe, l’<b>hyperbole</b>, a deux branches.',
  def: '<b>Variations.</b> La fonction inverse est décroissante sur ]−∞ ; 0[ et décroissante sur ]0 ; +∞[. Elle est négative pour x &lt; 0, positive pour x &gt; 0, et jamais égale à 0. Attention : elle n’est <b>pas</b> décroissante sur la réunion des deux intervalles.',
  visuel: `${graphRef('inverse')}${tabVarRef('inverse')}`,
  methode: [
    '<b>Image de a</b> (a ≠ 0) : calcule 1 ÷ a. L’inverse garde le signe de a.',
    '<b>Antécédent de k</b> (k ≠ 0) : c’est 1 ÷ k, car 1/x = k équivaut à x = 1/k. Le nombre 0 n’a pas d’antécédent.',
    '<b>Comparer</b> 1/a et 1/b : si a et b ont le même signe, l’ordre est renversé ; sinon, regarde les signes (négatif &lt; positif).',
  ],
  warn: [
    '−2 &lt; 3, mais 1/(−2) &lt; 1/3 aussi : on ne renverse l’ordre que d’un même côté de 0.',
    '1/x n’est pas égal à x/1 ni à −x : 1/4 = 0,25 et non 4.',
    'La courbe ne coupe ni l’axe des ordonnées (pas d’image en 0) ni l’axe des abscisses (1/x n’est jamais nul).',
  ],
  retenir: 'inverse : définie sur ℝ ∖ {0}, décroissante sur ]−∞ ; 0[ et sur ]0 ; +∞[, du signe de x, jamais nulle.',
});

/* =====================================================================================================
   Niveau 5 : racine carrée et cube
   ===================================================================================================== */
const STEM_R = `On considère la fonction racine carrée f définie par${big(fx('f', R('x')))}`;
const STEM_C = `On considère la fonction cube g définie par${big(fx('g', X3))}`;

const rImgRac = {
  id: 'r-image', dmin: 0, titre: 'image par la fonction racine carrée',
  draw(d) { const n = d >= 3 && chance(0.4) ? ri(1, 19) / 10 : ri(1, 12); return { n }; },
  ex: { n: 7 },
  build({ n }) {
    const k = r6(n * n);
    return {
      html: `${STEM_R}Calcule l’image de <b>${M(k)}</b> par f.`,
      ...rNums([n], { tpl: `f(${M(k)}) = {0}`, value: Math.sqrt(k), msg: v => (v[0] === r6(k / 2) ? `Tu as divisé par 2 : la racine carrée de ${M(k)} est le nombre positif qui, multiplié par lui-même, donne ${M(k)}.` : '') }),
      hint: `${M(k)} est un carré parfait : cherche le nombre positif qui, multiplié par lui-même, donne ${M(k)}.`,
      solution: `f(${M(k)}) = ${rac(k)} = ${M(n)}, car ${carre(n)} = ${M(n)} × ${M(n)} = ${M(k)}.`,
    };
  },
};

const rAnt = {
  id: 'r-ant', dmin: 1, titre: 'antécédents par la fonction racine carrée',
  draw() { return { k: chance(0.4) ? -ri(1, 9) : ri(0, 7) }; },
  ex: { k: 6 },
  build({ k }) {
    const E = k < 0 ? [] : [k * k];
    return {
      html: `${STEM_R}Quels sont les antécédents de <b>${M(k)}</b> par f ?`,
      ...rRoots(E, x => x >= 0 && Math.abs(Math.sqrt(x) - k) < 1e-9, { none: 'Aucun antécédent' }),
      hint: `Un antécédent de ${M(k)} est un nombre x tel que ${R('x')} = ${M(k)}. ${k < 0 ? `Une racine carrée peut-elle être égale à ${M(k)} ?` : `Élève les deux membres au carré, ou cherche un nombre dont la racine carrée est ${M(k)}.`}`,
      solution: k < 0 ? `Une racine carrée est toujours positive ou nulle : ${R('x')} = ${M(k)} est impossible. ${M(k)} n’a aucun antécédent.`
        : `${R('x')} = ${M(k)} équivaut à x = ${carre(k)} = ${M(k * k)}, car ${rac(k * k)} = ${M(k)}. Le seul antécédent de ${M(k)} est ${M(k * k)}.`,
    };
  },
};

const rImgCube = {
  id: 'r-image-cube', dmin: 0, titre: 'image par la fonction cube',
  draw(d) { return { x: d >= 3 && chance(0.4) ? pick([0.1, 0.2, 0.3, 0.5, 1.5, 2.5, 3.5]) * (chance(0.5) ? 1 : -1) : nz(-6, 6) }; },
  ex: { x: -3 },
  build({ x }) {
    const y = r6(x * x * x);
    return {
      html: `${STEM_C}Calcule l’image de <b>${M(x)}</b> par g.`,
      ...rNums([y], {
        tpl: `g(${M(x)}) = {0}`, value: Math.pow(x, 3),
        msg: v => (v[0] === -y ? `Un cube garde le signe de x : le produit de trois nombres négatifs est négatif.` : v[0] === r6(3 * x) ? `Tu as calculé 3 × ${M(x)} : le cube de ${M(x)}, c’est ${P(x)} × ${P(x)} × ${P(x)}.` : v[0] === r6(x * x) ? `Tu as calculé le carré : il faut un facteur de plus, ${M(x)} × ${M(x)} × ${M(x)}.` : ''),
      }),
      hint: x < 0 ? `Remplace x par ${M(x)} : ${cube(x)} = ${P(x)} × ${P(x)} × ${P(x)}. Combien de facteurs négatifs y a-t-il, et quel est le signe du produit ?`
        : `Remplace x par ${M(x)} : calcule ${M(x)} × ${M(x)} × ${M(x)}${Number.isInteger(x) ? '' : ' ; le résultat a trois chiffres après la virgule (ou moins si tu le simplifies)'}.`,
      solution: `g(${M(x)}) = ${cube(x)} = ${P(x)} × ${P(x)} × ${P(x)} : ${P(x)} × ${P(x)} = ${M(r6(x * x))}, puis ${M(r6(x * x))} × ${P(x)} = ${M(y)}${x < 0 ? ' (un cube a le signe de x)' : ''}.`,
    };
  },
};

const rAntCube = {
  id: 'r-ant-cube', dmin: 1, titre: 'antécédent par la fonction cube',
  draw() { return { n: nz(-6, 6) }; },
  ex: { n: -2 },
  build({ n }) {
    const k = n * n * n;
    return {
      html: `${STEM_C}Quel est l’antécédent de <b>${M(k)}</b> par g ?`,
      ...rNums([n], { tpl: 'x = {0}', value: n }),
      verify: E => Math.abs(E[0] ** 3 - k) < 1e-9,
      hint: `Cherche le nombre x tel que ${X3} = ${M(k)} : essaie de petites valeurs entières, positives ou négatives, jusqu’à obtenir ${M(k)}.`,
      solution: `On cherche x tel que ${X3} = ${M(k)}. Comme ${cube(n)} = ${M(k)}, l’antécédent de ${M(k)} est ${M(n)}. Contrairement au carré, la fonction cube donne un seul antécédent à chaque nombre.`,
    };
  },
};

const rSensRac = {
  id: 'r-sens-rac', dmin: 0, titre: 'sens de variation de la racine carrée',
  draw() { return {}; },
  ex: {},
  build() {
    const S = [I(0, 1, INF, 0)];
    return {
      html: `Donne le plus grand intervalle sur lequel la fonction racine carrée est définie et croissante.`,
      ...rIv(S, x => x >= 0),
      hint: `Une racine carrée n’existe que pour les nombres positifs ou nuls. Calcule ${rac(1)}, ${rac(4)} et ${rac(9)} pour voir dans quel sens la fonction varie.`,
      solution: `La fonction racine carrée est définie sur [0 ; +∞[ et croissante sur tout cet intervalle : ${rac(1)} = 1, ${rac(4)} = 2, ${rac(9)} = 3. L’intervalle cherché est ${fmtSet(S)}.`,
    };
  },
};

const rSensCube = {
  id: 'r-sens-cube', dmin: 1, titre: 'sens de variation du cube',
  draw() { return {}; },
  ex: {},
  build() {
    return {
      html: `Donne le plus grand intervalle sur lequel la fonction cube est croissante.`,
      ...rIv(REALS(), () => true),
      hint: `Calcule des cubes de nombres négatifs et positifs : ${cube(-2)}, ${cube(-1)}, ${cube(1)}, ${cube(2)}. La fonction monte-t-elle d’un bout à l’autre ?`,
      solution: `${cube(-2)} = −8, ${cube(-1)} = −1, ${cube(1)} = 1, ${cube(2)} = 8 : les cubes augmentent avec x, y compris pour les nombres négatifs. La fonction cube est croissante sur ℝ tout entier.`,
    };
  },
};

const rCmpRac = {
  id: 'r-cmp-rac', dmin: 0, titre: 'comparer deux racines carrées',
  draw() { const a = ri(2, 60); return { a, b: a + ri(1, 25) }; },
  ex: { a: 7, b: 11 },
  build({ a, b }) {
    return {
      html: `Compare ${rac(a)} et ${rac(b)}.`,
      ...rCmp('<', { value: Math.sqrt(a) - Math.sqrt(b) }),
      hint: `Compare d’abord les nombres sous les racines, ${M(a)} et ${M(b)}, puis rappelle-toi le sens de variation de la fonction racine carrée.`,
      solution: `${M(a)} &lt; ${M(b)} et la fonction racine carrée est croissante sur [0 ; +∞[ : elle conserve l’ordre. Donc ${rac(a)} &lt; ${rac(b)}.`,
    };
  },
};

const rCmpCube = {
  id: 'r-cmp-cube', dmin: 2, titre: 'comparer deux cubes',
  draw() { const a = ri(-9, 9); let b = ri(-9, 9); if (b === a) b = a + 1; return { a, b }; },
  ex: { a: -5, b: -2 },
  build({ a, b }) {
    const s = signe(a - b);
    return {
      html: `Compare ${cube(a)} et ${cube(b)}.`,
      ...rCmp(s, { value: a ** 3 - b ** 3, msg: `La fonction cube est croissante sur ℝ tout entier : elle conserve l’ordre, même pour les nombres négatifs (contrairement au carré).` }),
      hint: `Compare d’abord ${M(a)} et ${M(b)}, puis utilise le sens de variation de la fonction cube : pense à sa courbe qui monte de gauche à droite.`,
      solution: `${M(a)} ${sgnTxt[s]} ${M(b)} et la fonction cube est croissante sur ℝ : elle conserve l’ordre. Donc ${cube(a)} ${sgnTxt[s]} ${cube(b)} (${M(a ** 3)} ${sgnTxt[s]} ${M(b ** 3)}).`,
    };
  },
};

const rEncRac = {
  id: 'r-enc-rac', dmin: 2, titre: 'encadrer √x',
  draw() { const n = ri(0, 9); return { n, m: n + ri(1, 12 - n) }; },
  ex: { n: 2, m: 5 },
  build({ n, m }) {
    const a = n * n, b = m * m;
    return {
      html: `Sachant que ${M(a)} ≤ x ≤ ${M(b)}, encadre ${R('x')}.`,
      ...rNums([n, m], { tpl: `{0} ≤ ${R('x')} ≤ {1}`, value: m }),
      verify: verifEnc(Math.sqrt, a, b),
      hint: `La fonction racine carrée est croissante sur [0 ; +∞[ : elle conserve l’ordre. Applique-la à ${M(a)} et à ${M(b)}, qui sont des carrés parfaits.`,
      solution: `La fonction racine carrée est croissante sur [0 ; +∞[ : de ${M(a)} ≤ x ≤ ${M(b)}, on tire ${rac(a)} ≤ ${R('x')} ≤ ${rac(b)}, soit ${M(n)} ≤ ${R('x')} ≤ ${M(m)}.`,
    };
  },
};

const rEncCube = {
  id: 'r-enc-cube', dmin: 3, titre: 'encadrer x³',
  draw() { const a = ri(-5, 4); return { a, b: a + ri(1, Math.min(5, 5 - a)) }; },
  ex: { a: -2, b: 3 },
  build({ a, b }) {
    return {
      html: `Sachant que ${M(a)} ≤ x ≤ ${M(b)}, encadre ${X3}.`,
      ...rNums([a ** 3, b ** 3], { tpl: `{0} ≤ ${X3} ≤ {1}`, value: b ** 3 }),
      verify: verifEnc(x => x * x * x, a, b),
      hint: `La fonction cube est croissante sur ℝ tout entier : elle conserve l’ordre, même avec des nombres négatifs. Calcule ${cube(a)} et ${cube(b)}.`,
      solution: `La fonction cube est croissante sur ℝ : de ${M(a)} ≤ x ≤ ${M(b)}, on tire ${cube(a)} ≤ ${X3} ≤ ${cube(b)}, soit ${M(a ** 3)} ≤ ${X3} ≤ ${M(b ** 3)}.`,
    };
  },
};

const FORMS5 = [rImgRac, rImgCube, rSensRac, rCmpRac, rAnt, rAntCube, rSensCube, rEncRac, rCmpCube, rEncCube];

export const LV5 = niveau('Racine carrée et cube', FORMS5, {
  n: 5, classe: '2de',
  intro: 'Deux nouvelles fonctions de référence : la <b>racine carrée</b> f(x) = √x, définie seulement pour x ≥ 0, et le <b>cube</b> g(x) = x³, définie pour tous les réels. Toutes les deux sont croissantes.',
  def: '<b>Racine carrée</b> : définie sur [0 ; +∞[, croissante, toujours positive ou nulle. <b>Cube</b> : définie sur ℝ, croissante sur tout ℝ, du signe de x. Chaque nombre a exactement un antécédent par le cube ; un nombre négatif n’en a aucun par la racine carrée.',
  visuel: `${graphRef('racine')}${tabVarRef('racine')}${graphRef('cube', { label: 'g' })}${tabVarRef('cube')}`,
  methode: [
    '<b>√a</b> : cherche le nombre positif dont le carré est a. <b>a³</b> : a × a × a, du signe de a.',
    '<b>Antécédent de k</b> : par la racine, c’est k² (si k ≥ 0) ; par le cube, c’est le nombre x tel que x³ = k.',
    '<b>Comparer ou encadrer</b> : ces deux fonctions sont croissantes, elles conservent l’ordre (sur [0 ; +∞[ pour la racine, sur ℝ pour le cube).',
  ],
  warn: [
    '√(a + b) n’est pas √a + √b : √(9 + 16) = 5, alors que √9 + √16 = 7.',
    '(−2)³ = −8 : un cube garde le signe. Ne confonds pas avec (−2)² = 4.',
    'Le cube conserve l’ordre même pour les nombres négatifs : −5 &lt; −2 donne (−5)³ &lt; (−2)³ (alors qu’un carré renverse l’ordre).',
  ],
  retenir: 'racine carrée : définie sur [0 ; +∞[, croissante ; cube : définie sur ℝ, croissant ; toutes deux conservent l’ordre.',
});

/* =====================================================================================================
   Niveau 6 : reconnaître une courbe de référence
   ===================================================================================================== */
const ALLURE = {
  carre: 'une parabole, en forme de U',
  inverse: 'une hyperbole, en deux branches séparées',
  racine: 'une demi-parabole couchée qui part de l’origine',
  cube: 'une courbe qui monte sans cesse en traversant l’origine',
};
const NOMS = { carre: 'carré', inverse: 'inverse', racine: 'racine carrée', cube: 'cube' };
const OBS = {
  carre: 'La courbe reste au-dessus de l’axe des abscisses, touche l’origine et a deux côtés qui se ressemblent.',
  inverse: 'La courbe est en deux morceaux séparés, l’un en haut à droite, l’autre en bas à gauche ; elle ne touche pas l’origine.',
  racine: 'La courbe n’existe que pour x ≥ 0 : elle part de l’origine et monte de plus en plus lentement.',
  cube: 'La courbe monte de gauche à droite en passant par l’origine, avec des valeurs négatives puis positives.',
};
/** zooms différents d'une même courbe : seules les fenêtres changent */
const ZOOM = {
  carre: [{ xr: [-4, 4], yr: [-1, 10] }, { xr: [-3, 3], yr: [-1, 9] }, { xr: [-5, 5], yr: [-2, 12] }],
  inverse: [{ xr: [-5, 5], yr: [-5, 5] }, { xr: [-4, 4], yr: [-4, 4] }, { xr: [-6, 6], yr: [-6, 6] }],
  racine: [{ xr: [-1, 9], yr: [-1, 4] }, { xr: [-1, 10], yr: [-1, 5] }, { xr: [-2, 8], yr: [-1, 4] }],
  cube: [{ xr: [-3, 3], yr: [-10, 10] }, { xr: [-2, 2], yr: [-9, 9] }, { xr: [-4, 4], yr: [-12, 12] }],
};
const graphZ = (cle, z, nom = 'f') => {
  const W = ZOOM[cle][z], xm = W.xr[1], ym = W.yr[1], fn = REF[cle].f;
  const fs = cle === 'inverse' ? [{ f: fn, dom: [W.xr[0], -0.2], l: nom }, { f: fn, dom: [0.2, xm] }]
    : [{ f: fn, dom: [cle === 'racine' ? 0 : W.xr[0], xm], l: nom }];
  return graph({ xr: W.xr, yr: W.yr, fs, aria: `courbe d’une fonction de référence ${nom}` });
};

const cNom = {
  id: 'c-nom', dmin: 0, titre: 'reconnaître une courbe',
  draw() { return { cle: pick(CLES), z: ri(0, 2), nom: pick(NOMF) }; },
  ex: { cle: 'inverse', z: 0, nom: 'f' },
  build({ cle, z, nom }) {
    return {
      html: `Voici la courbe représentative d’une fonction ${nom}. Quelle fonction de référence est-ce ?`,
      visual: graphZ(cle, z, nom),
      ...rChoice(CLES.map(k => ({ l: `la fonction ${NOMS[k]}`, ok: k === cle, why: `La courbe de la fonction ${NOMS[k]} est ${ALLURE[k]} : ce n’est pas l’allure de cette courbe.` })), { ordre: true, indep: `la fonction ${NOMS[cle]}` }),
      hint: `${OBS[cle]} Compare avec les quatre courbes de référence.`,
      solution: `${OBS[cle]} C’est ${ALLURE[cle]} : la courbe de la fonction ${NOMS[cle]}, f(x) = ${REF[cle].expr}.`,
    };
  },
};

const cCourbe = {
  id: 'c-courbe', dmin: 0, titre: 'choisir la courbe d’une fonction',
  draw() { return { cle: pick(CLES), nom: pick(NOMF) }; },
  ex: { cle: 'racine', nom: 'f' },
  build({ cle, nom }) {
    const T = {
      carre: `Calcule ${nom}(2) et ${nom}(−2) : sont-elles égales ou opposées ? Que vaut ${nom}(0) ? Tu sauras si la courbe est symétrique et si elle passe par l’origine.`,
      inverse: `Calcule ${nom}(2) et ${nom}(0,5), puis cherche si 0 a une image : la courbe peut-elle passer par l’origine ?`,
      racine: `Calcule ${nom}(4) et cherche si −4 a une image : la courbe existe-t-elle à gauche de l’axe des ordonnées ?`,
      cube: `Calcule ${nom}(2) et ${nom}(−2) : sont-elles égales ou opposées ? Que vaut ${nom}(0) ? Tu sauras si la courbe est symétrique et si elle passe par l’origine.`,
    }[cle];
    const S = {
      carre: `Les images de 2 et de −2 sont égales (4) et ${nom}(0) = 0 : la courbe est symétrique par rapport à l’axe des ordonnées, au-dessus de l’axe des abscisses.`,
      inverse: `${nom}(2) = 0,5 et ${nom}(0,5) = 2 ; 0 n’a pas d’image : la courbe est en deux branches et ne passe pas par l’origine.`,
      racine: `${nom}(4) = 2 ; les nombres négatifs n’ont pas d’image : la courbe n’existe que pour x ≥ 0.`,
      cube: `${nom}(2) = 8 et ${nom}(−2) = −8 (opposées), ${nom}(0) = 0 : la courbe monte en passant par l’origine.`,
    }[cle];
    return {
      html: `Quelle est la courbe représentative de la fonction ${nom} définie par ${nom}(x) = ${REF[cle].expr} ?`,
      ...rChoice(CLES.map(k => ({ l: miniRef(k), ok: k === cle, why: `Cette courbe est celle de la fonction ${NOMS[k]}, pas de la fonction ${NOMS[cle]}.` })), { ordre: false, indep: miniRef(cle) }),
      hint: T,
      solution: `${S} C’est donc ${ALLURE[cle]} : la courbe de la fonction ${NOMS[cle]}.`,
    };
  },
};

/** points qui n'appartiennent qu'à une seule des quatre courbes */
const POINTS = [];
for (const a of [-4, -3, -2, 2, 3, 4, 0.5, -0.5, 0.25, 5, -5, 9, 16]) for (const cle of CLES) {
  const b = REF[cle].f(a);
  if (!REF[cle].ok(a) || !Number.isFinite(b) || Math.abs(b) > 30 || String(r6(b)).length > 6) continue;
  if (CLES.filter(k => REF[k].ok(a) && Math.abs(REF[k].f(a) - b) < 1e-9).length === 1 && Math.abs(a) !== 1) POINTS.push({ a, b: r6(b), cle });
}
const cPoint = {
  id: 'c-point', dmin: 2, titre: 'quelle fonction passe par ce point ?',
  draw() { return pick(POINTS); },
  ex: { a: -2, b: -8, cle: 'cube' },
  build({ a, b, cle }) {
    const val = k => (REF[k].ok(a) ? M(r6(REF[k].f(a))) : 'n’existe pas');
    return {
      html: `La courbe d’une des quatre fonctions de référence passe par le point A(${M(a)} ; ${M(b)}). Laquelle ?`,
      ...rChoice(CLES.map(k => ({ l: `la fonction ${NOMS[k]}`, ok: k === cle, why: `Pour la fonction ${NOMS[k]}, l’image de ${M(a)} ${REF[k].ok(a) ? `est ${val(k)}` : 'n’existe pas'}, et non ${M(b)}.` })), { ordre: true, indep: `la fonction ${NOMS[cle]}` }),
      hint: `Remplace x par ${M(a)} dans chacune des quatre fonctions (carré, inverse, racine carrée, cube) : laquelle donne ${M(b)} ?`,
      solution: `Pour x = ${M(a)} : carré → ${val('carre')} ; inverse → ${val('inverse')} ; racine carrée → ${val('racine')} ; cube → ${val('cube')}. Seule la fonction ${NOMS[cle]} donne ${M(b)}.`,
    };
  },
};

const cSym = {
  id: 'c-sym', dmin: 2, titre: 'symétrie d’une courbe',
  draw() { return { cle: pick(CLES), z: ri(0, 2) }; },
  ex: { cle: 'cube', z: 0 },
  build({ cle, z }) {
    const L = ['par rapport à l’axe des ordonnées', 'par rapport à l’origine', 'ni par rapport à l’axe des ordonnées, ni par rapport à l’origine'];
    const bonne = { carre: L[0], cube: L[1], inverse: L[1], racine: L[2] }[cle];
    // vérification indépendante : f(−x) = f(x) (paire), f(−x) = −f(x) (impaire)
    const f = REF[cle].f, xs = [0.5, 1, 2, 3, 4], def = xs.every(x => REF[cle].ok(-x));
    const indep = !def ? L[2] : xs.every(x => Math.abs(f(-x) - f(x)) < 1e-9) ? L[0] : xs.every(x => Math.abs(f(-x) + f(x)) < 1e-9) ? L[1] : L[2];
    return {
      html: `Voici la courbe d’une fonction de référence f. Elle est symétrique :`,
      visual: graphZ(cle, z),
      ...rChoice(L.map(l => ({ l, ok: l === bonne, why: l === L[2] ? 'Cette courbe a bien un centre ou un axe de symétrie : regarde-la de plus près.' : 'Plie ou retourne mentalement la figure : les deux parties ne se superposent pas comme ça.' })), { ordre: true, indep }),
      hint: `Imagine que tu plies la feuille le long de l’axe des ordonnées : les deux côtés de la courbe se superposent-ils ? Sinon, fais un demi-tour autour de l’origine. Et si la courbe n’existe que d’un côté ?`,
      solution: { carre: 'La parabole se superpose à elle-même quand on la plie le long de l’axe des ordonnées : f(−x) = f(x). La fonction carré est paire.', cube: 'La courbe se superpose à elle-même après un demi-tour autour de l’origine : f(−x) = −f(x). La fonction cube est impaire.', inverse: 'Les deux branches se correspondent par un demi-tour autour de l’origine : f(−x) = −f(x). La fonction inverse est impaire.', racine: 'La courbe n’existe que pour x ≥ 0 : elle n’a ni axe de symétrie vertical ni centre à l’origine.' }[cle],
    };
  },
};

const cDom = {
  id: 'c-dom', dmin: 3, titre: 'lire l’ensemble de définition',
  draw() { return { cle: pick(CLES), z: ri(0, 2) }; },
  ex: { cle: 'inverse', z: 0 },
  build({ cle, z }) {
    const S = { carre: REALS(), cube: REALS(), racine: [I(0, 1, INF, 0)], inverse: [I(-INF, 0, 0, 0), I(0, 0, INF, 0)] }[cle];
    return {
      html: `Voici la courbe d’une fonction de référence f. Donne l’ensemble de définition de f.`,
      visual: graphZ(cle, z),
      ...rIv(S, x => REF[cle].ok(x)),
      hint: `Regarde où la courbe existe : y a-t-il un trou sur l’axe des ordonnées ? La courbe continue-t-elle à gauche de x = 0 ? Rappelle-toi la fonction de référence reconnue.`,
      solution: { carre: 'La parabole se prolonge des deux côtés sans interruption : f est définie sur ℝ.', cube: 'La courbe se prolonge des deux côtés sans interruption : f est définie sur ℝ.', racine: 'La courbe commence en x = 0 et n’existe pas pour x &lt; 0 : f est définie sur [0 ; +∞[.', inverse: 'La courbe est coupée en x = 0 (pas de point sur l’axe des ordonnées) : f est définie sur ]−∞ ; 0[ ∪ ]0 ; +∞[.' }[cle] + ` Ensemble de définition : ${fmtSet(S)}.`,
    };
  },
};

const cSigne = {
  id: 'c-signe', dmin: 4, titre: 'signe d’une fonction de référence',
  draw() { return { cle: pick(CLES), rel: pick(['≥', '&lt;', '&gt;']), z: ri(0, 2) }; },
  ex: { cle: 'cube', rel: '≥', z: 0 },
  build({ cle, rel, z }) {
    const T = {
      carre: { '≥': REALS(), '&lt;': [], '&gt;': [I(-INF, 0, 0, 0), I(0, 0, INF, 0)] },
      cube: { '≥': [I(0, 1, INF, 0)], '&lt;': [I(-INF, 0, 0, 0)], '&gt;': [I(0, 0, INF, 0)] },
      racine: { '≥': [I(0, 1, INF, 0)], '&lt;': [], '&gt;': [I(0, 0, INF, 0)] },
      inverse: { '≥': [I(0, 0, INF, 0)], '&lt;': [I(-INF, 0, 0, 0)], '&gt;': [I(0, 0, INF, 0)] },
    }[cle][rel];
    const cmp = rel === '≥' ? v => v >= 0 : rel === '&lt;' ? v => v < 0 : v => v > 0;
    return {
      html: `Voici la courbe d’une fonction de référence f. Pour quels réels x a-t-on f(x) ${rel} 0 ?`,
      visual: graphZ(cle, z),
      ...rIv(T, x => REF[cle].ok(x) && cmp(REF[cle].f(x))),
      hint: `Repère où la courbe est au-dessus de l’axe des abscisses et où elle est en dessous. Fais attention à x = 0 : la courbe y passe-t-elle ? existe-t-elle ?`,
      solution: `Le signe de f(x) se lit sur la courbe : f(x) ${rel} 0 correspond aux points ${rel === '&lt;' ? 'sous' : 'au-dessus de (ou sur, pour ≥)'} l’axe des abscisses. On trouve S = ${fmtSet(T)}.`,
    };
  },
};

const BANQUE = [
  { cle: 'carre', t: 'elle passe par l’origine', v: true, s: 'f(0) = 0² = 0 : le point (0 ; 0) est sur la parabole.' },
  { cle: 'carre', t: 'elle a des points d’ordonnée négative', v: false, s: 'Un carré est toujours positif ou nul : la parabole est au-dessus de l’axe des abscisses.' },
  { cle: 'carre', t: 'elle passe par le point (−3 ; 9)', v: true, s: 'f(−3) = (−3)² = 9.' },
  { cle: 'carre', t: 'elle passe par le point (2 ; −4)', v: false, s: 'f(2) = 2² = 4 et non −4.' },
  { cle: 'carre', t: 'elle est symétrique par rapport à l’axe des ordonnées', v: true, s: 'f(−x) = f(x) pour tout x : les deux côtés de la parabole se superposent.' },
  { cle: 'carre', t: 'elle monte de gauche à droite sur tout ℝ', v: false, s: 'La fonction carré décroît sur ]−∞ ; 0] puis croît sur [0 ; +∞[.' },
  { cle: 'inverse', t: 'elle passe par l’origine', v: false, s: 'La fonction inverse n’est pas définie en 0 et 1/x n’est jamais nul.' },
  { cle: 'inverse', t: 'elle passe par le point (2 ; 0,5)', v: true, s: 'f(2) = 1/2 = 0,5.' },
  { cle: 'inverse', t: 'elle passe par le point (−4 ; 0,25)', v: false, s: 'f(−4) = 1/(−4) = −0,25 et non 0,25.' },
  { cle: 'inverse', t: 'elle coupe l’axe des ordonnées', v: false, s: 'Il n’y a pas d’image en 0 : la courbe ne rencontre pas l’axe des ordonnées.' },
  { cle: 'inverse', t: 'elle a des points au-dessus et des points en dessous de l’axe des abscisses', v: true, s: 'f(x) est positif pour x &gt; 0 et négatif pour x &lt; 0.' },
  { cle: 'inverse', t: 'elle est symétrique par rapport à l’origine', v: true, s: 'f(−x) = −f(x) : un demi-tour autour de l’origine échange les deux branches.' },
  { cle: 'racine', t: 'elle passe par le point (9 ; 3)', v: true, s: 'f(9) = √9 = 3.' },
  { cle: 'racine', t: 'elle passe par le point (4 ; −2)', v: false, s: 'f(4) = √4 = 2 : une racine carrée n’est jamais négative.' },
  { cle: 'racine', t: 'elle existe pour x = −4', v: false, s: 'On ne peut pas prendre la racine carrée d’un nombre négatif.' },
  { cle: 'racine', t: 'elle passe par l’origine', v: true, s: 'f(0) = √0 = 0.' },
  { cle: 'racine', t: 'elle est symétrique par rapport à l’axe des ordonnées', v: false, s: 'Elle n’existe que pour x ≥ 0 : il n’y a rien à gauche de l’axe des ordonnées.' },
  { cle: 'racine', t: 'elle descend quand x augmente', v: false, s: 'La fonction racine carrée est croissante sur [0 ; +∞[.' },
  { cle: 'cube', t: 'elle passe par le point (−2 ; −8)', v: true, s: 'f(−2) = (−2)³ = −8.' },
  { cle: 'cube', t: 'elle passe par le point (−2 ; 8)', v: false, s: 'f(−2) = (−2)³ = −8 : un cube garde le signe de x.' },
  { cle: 'cube', t: 'elle a des points d’ordonnée négative', v: true, s: 'f(x) est négatif pour x &lt; 0 : par exemple f(−1) = −1.' },
  { cle: 'cube', t: 'elle est symétrique par rapport à l’axe des ordonnées', v: false, s: 'f(−x) = −f(x) et non f(x) : la symétrie est par rapport à l’origine.' },
  { cle: 'cube', t: 'elle est symétrique par rapport à l’origine', v: true, s: 'f(−x) = −f(x) pour tout x.' },
  { cle: 'cube', t: 'elle passe par l’origine', v: true, s: 'f(0) = 0³ = 0.' },
];
const cProp = {
  id: 'c-prop', dmin: 0, titre: 'vrai ou faux sur une courbe',
  draw() { return { i: ri(0, BANQUE.length - 1) }; },
  ex: { i: 4 },
  build({ i }) {
    const B = BANQUE[i];
    return {
      html: `À propos de la courbe de la fonction ${NOMS[B.cle]} (f(x) = ${REF[B.cle].expr}) : « ${B.t} ». Est-ce vrai ?`,
      ...rChoice([{ l: 'Oui', ok: B.v, why: `${B.s}` }, { l: 'Non', ok: !B.v, why: `${B.s}` }], { ordre: true, indep: B.v ? 'Oui' : 'Non' }),
      hint: `Pour la fonction ${NOMS[B.cle]}, f(x) = ${REF[B.cle].expr} : vérifie l’affirmation avec un calcul d’image, ou en imaginant l’allure de la courbe (${ALLURE[B.cle]}).`,
      solution: `${B.s} L’affirmation est ${B.v ? 'vraie' : 'fausse'}.`,
    };
  },
};

const FORMS6 = [cNom, cCourbe, cProp, cPoint, cSym, cDom, cSigne];

const vignettes = `<div class="cols vign">${CLES.map(k => `<div class="vg">${miniRef(k)}<div class="cap">${NOMS[k]}</div></div>`).join('')}</div>`;
export const LV6 = niveau('Reconnaître les courbes', FORMS6, {
  n: 6, classe: '2de',
  intro: 'Les quatre fonctions de référence se reconnaissent à l’<b>allure de leur courbe</b>. Quand tu sais les repérer, tu en déduis tout de suite l’ensemble de définition, le signe et la symétrie.',
  def: '<b>Carré</b> : parabole, au-dessus de l’axe, symétrique par rapport à l’axe des ordonnées. <b>Inverse</b> : deux branches, pas de point en x = 0, symétrique par rapport à l’origine. <b>Racine carrée</b> : part de l’origine, n’existe que pour x ≥ 0. <b>Cube</b> : monte sans cesse, traverse l’origine, symétrique par rapport à l’origine.',
  visuel: vignettes,
  methode: [
    'Regarde si la courbe existe à gauche de x = 0, si elle est coupée en deux, si elle passe par l’origine.',
    'Regarde le signe : au-dessus seulement (carré, racine), de part et d’autre de l’axe (inverse, cube).',
    'Pour un point (a ; b), calcule f(a) pour chaque candidate : une seule donne b.',
  ],
  warn: [
    'La courbe de la fonction inverse ne passe jamais par l’origine ; celle de la fonction racine carrée y passe.',
    'La parabole (carré) et la courbe du cube se ressemblent près de l’origine : le cube prend des valeurs négatives, pas le carré.',
    'Une courbe symétrique par rapport à l’origine (cube, inverse) n’est pas symétrique par rapport à l’axe des ordonnées.',
  ],
  retenir: 'carré (parabole, paire), inverse (deux branches, impaire), racine (x ≥ 0 seulement), cube (impaire, monte toujours).',
});

// Niveaux 1 à 6 de « Ratios et fractions » : fraction-quotient, fraction d'une fraction, inverse,
// division par une fraction, calculs enchaînés, problèmes. Chaque forme d'exercice est une fonction
// q…(paramètres) : l'exercice l'appelle avec des nombres tirés, le cours avec des nombres fixes.
import { choiceCheck } from '../../engine/answers/checks.js';
import { ri, pick, shuffle, chance, prenom, red, M, F, big, slot, de, sfx, gi, coprime, tirer, fr, res, ent, nums, ex, warn, retenir, methode, def, cols, simpl, mulT, divT, addT } from './outils.js';
import { partageBar, aireFrac, inverseBar, flip, groupes, barreFrac, ordre } from './draw.js';

const f = v => sfx(v[0], v[1]);
const fv = v => v[0] / v[1];
const RES = '<br>Donne un entier ou une fraction irréductible.';

/* ====================== 1. la fraction comme quotient ====================== */
const OBJ = [['pizzas', 'de pizza'], ['tartes', 'de tarte'], ['tablettes de chocolat', 'de tablette'], ['baguettes', 'de baguette']];
const LONG = [['Une planche', 'coupée'], ['Un ruban', 'coupé'], ['Une corde', 'coupée']];

export const q1quot = (a, b) => ({
  ...res(a, b, a / b),
  html: `Écris le quotient ${a} ÷ ${b} sous la forme d'une fraction.`,
  visual: partageBar(a, b),
  hint: `Une fraction se lit « haut divisé par bas ». Dans ${a} ÷ ${b}, le nombre ${b} dit en combien de parts égales on partage : où doit-il aller, en haut ou en bas ?`,
  solution: `${a} ÷ ${b} = ${F(a, b)} : le dividende ${a} va en haut, le diviseur ${b} en bas.`,
});
export const q1mult = (a, b) => ({
  ...res(a, b, a / b),
  html: `Quel est le nombre qui, multiplié par ${b}, donne ${a} ?`,
  visual: partageBar(a, b),
  hint: `Cherche le nombre x tel que x × ${b} = ${a}. Pour trouver x, divise ${a} par ${b}, puis écris ce quotient sous forme de fraction.`,
  solution: `x × ${b} = ${a} donc x = ${a} ÷ ${b} = ${F(a, b)}. Vérification : ${F(a, b)} × ${b} = ${a}.`,
});
export const q1partage = (a, b, i) => {
  if (i < OBJ.length) {
    const [o, dd] = OBJ[i];
    return {
      ...res(a, b, a / b),
      html: `${a} ${o} sont partagées équitablement entre ${b} personnes. Quelle fraction ${dd} chaque personne reçoit-elle ?`,
      visual: partageBar(a, b, { c1: `${a} ${o}`, c2: `entre ${b} personnes` }),
      hint: `Partager ${a} ${o} entre ${b} personnes, c'est calculer ${a} ÷ ${b}. Écris ce quotient comme une fraction.`,
      solution: `Chaque personne reçoit ${a} ÷ ${b} = ${F(a, b)} ${dd}.`,
    };
  }
  const [n, p] = LONG[i - OBJ.length];
  return {
    ...res(a, b, a / b),
    html: `${n} de ${a} m est ${p} en ${b} morceaux de même longueur. Quelle fraction de mètre mesure chaque morceau ?`,
    visual: partageBar(a, b, { c1: `${a} m`, c2: `en ${b} morceaux égaux` }),
    hint: `Couper ${a} m en ${b} morceaux égaux, c'est calculer ${a} ÷ ${b}. Écris ce quotient comme une fraction.`,
    solution: `Chaque morceau mesure ${a} ÷ ${b} = ${F(a, b)} m.`,
  };
};
export const q1prod = (a, b) => ({
  ...nums([a], 'Réponse : {0}', { value: (a / b) * b }),
  html: `Calcule :${big(`${F(a, b)} × ${b}`)}`,
  visual: a <= b ? barreFrac(a, b, { lab2: '1 entier' }) : undefined,
  hint: `${F(a, b)} est, par définition, le nombre qui multiplié par ${b} donne un certain entier : lequel ? Regarde le numérateur.`,
  solution: `${F(a, b)} est le nombre qui, multiplié par ${b}, donne ${a}. Donc ${F(a, b)} × ${b} = ${a}.`,
});
const tenth = b => { for (const m of [1, 2, 3]) if (10 ** m % b === 0) return m; return 0; };
export const q1dec = (a, b) => {
  const m = tenth(b), k = 10 ** m / b;
  return {
    ...nums([a / b], 'Réponse : {0}', { value: a / b, keys: { comma: true } }),
    html: `Écris ${F(a, b)} sous forme décimale.`,
    hint: `${F(a, b)} = ${a} ÷ ${b}. Pose la division de ${a} par ${b}, ou cherche une fraction égale de dénominateur ${10 ** m} (${b} × ? = ${10 ** m}).`,
    solution: `${F(a, b)} = ${a} ÷ ${b} = <b>${M(a / b)}</b> (car ${F(a, b)} = ${F(a * k, 10 ** m)}).`,
  };
};

function L1(d) {
  const formes = ['quot', 'mult'];
  if (d >= 1) formes.push('partage');
  if (d >= 2) formes.push('prod');
  if (d >= 3) formes.push('dec');
  const k = pick(formes), bmax = Math.min(12, 6 + 2 * d), amax = d < 2 ? bmax : bmax + 5;
  if (k === 'dec') {
    const b = pick([2, 4, 5, 8, 10, 20, 25]);
    return q1dec(tirer(1, 3 * b, x => x % b !== 0), b);
  }
  const [a, b] = coprime(k === 'partage' ? 2 : 1, amax, 2, bmax, (x, y) => (d < 2 ? x < y : x !== y));
  if (k === 'quot') return q1quot(a, b);
  if (k === 'mult') return q1mult(a, b);
  if (k === 'partage') return q1partage(a, b, ri(0, OBJ.length + LONG.length - 1));
  return q1prod(a, b);
}
function C1() {
  return `<h2>1. La fraction, un quotient</h2>
<p class="intro">Partager 3 pizzas entre 4 personnes : chaque personne reçoit ${F(3, 4)} de pizza. Une fraction, c'est une <b>division</b> écrite autrement.</p>
${def(`${F('a', 'b')} est le nombre qui, <b>multiplié par b</b>, donne <b>a</b>. Autrement dit ${F('a', 'b')} = a ÷ b.<br>Le dividende a va en haut, le diviseur b va en bas (b ≠ 0).`)}
${cols(methode(['Repère le nombre à partager (a) et le nombre de parts (b).', 'Écris a ÷ b, puis a en haut et b en bas.', 'Vérifie : la fraction multipliée par b doit redonner a.', 'Pour l\'écriture décimale, pose la division a ÷ b.']), partageBar(3, 4))}
${ex(q1quot(3, 4))}
${ex(q1quot(7, 3))}
${ex(q1mult(5, 8))}
${ex(q1partage(3, 4, 0))}
${ex(q1partage(9, 5, 4))}
${ex(q1prod(3, 7))}
${ex(q1dec(3, 8))}
${warn(`⚠️ Le diviseur va en <b>bas</b> : 3 ÷ 4 = ${F(3, 4)} et non ${F(4, 3)}.<br>⚠️ ${F(7, 3)} est plus grand que 1 : 7 pizzas entre 3 personnes, c'est plus d'une pizza chacune.`)}
${retenir(`${F('a', 'b')} = a ÷ b, et ${F('a', 'b')} × b = a.`)}`;
}

/* ====================== 2. fraction d'une fraction ====================== */
const PART = { 2: 'la moitié', 3: 'le tiers', 4: 'le quart', 5: 'le cinquième' };
export const q2fois = (a, b, c, d) => {
  const p = fr.mul([a, b], [c, d]), N = a * c, D = b * d;
  return {
    ...res(N, D, (a / b) * (c / d)),
    html: `Calcule les ${F(a, b)} de ${F(c, d)}.<br>Donne une fraction irréductible.`,
    visual: aireFrac(a, b, c, d),
    hint: `Prendre ${F(a, b)} de ${F(c, d)}, c'est multiplier : ${F(a, b)} × ${F(c, d)}. Multiplie les numérateurs (${a} et ${c}) entre eux, les dénominateurs (${b} et ${d}) entre eux, puis simplifie.`,
    solution: `Les ${F(a, b)} de ${F(c, d)} : ${mulT([a, b], [c, d]).t}.`,
  };
};
export const q2gateau = (a, b, c, d, nm) => ({
  ...res(a * c, b * d, (a / b) * (c / d)),
  html: `Il reste ${F(c, d)} d'un gâteau. ${nm} en mange les ${F(a, b)}. Quelle fraction du gâteau <b>entier</b> a été mangée par ${nm} ?<br>Donne une fraction irréductible.`,
  visual: aireFrac(a, b, c, d),
  hint: `${nm} mange ${F(a, b)} de ce qui reste, c'est-à-dire ${F(a, b)} de ${F(c, d)} : multiplie ${F(a, b)} × ${F(c, d)} et simplifie.`,
  solution: `${F(a, b)} de ${F(c, d)} : ${mulT([a, b], [c, d]).t}. ${nm} a mangé ${sfx(...fr.mul([a, b], [c, d]))} du gâteau entier.`,
});
export const q2classe = (a, b, c, d) => ({
  ...res(a * c, b * d, (a / b) * (c / d)),
  html: `Dans une classe, les ${F(a, b)} des élèves sont des filles. Parmi les filles, les ${F(c, d)} font du judo. Quelle fraction des élèves de la classe sont des filles qui font du judo ?<br>Donne une fraction irréductible.`,
  visual: aireFrac(c, d, a, b),
  hint: `Les filles qui font du judo sont les ${F(c, d)} des ${F(a, b)} de la classe : multiplie ${F(c, d)} × ${F(a, b)}, puis simplifie.`,
  solution: `${F(c, d)} des ${F(a, b)} : ${mulT([c, d], [a, b]).t}.`,
});
export const q2partie = (k, c, d) => {
  const N = c, D = k * d;
  return {
    ...res(N, D, (1 / k) * (c / d)),
    html: `Calcule ${PART[k]} de ${F(c, d)}.<br>Donne une fraction irréductible.`,
    visual: aireFrac(1, k, c, d),
    hint: `${PART[k][0].toUpperCase() + PART[k].slice(1)} d'un nombre, c'est ${F(1, k)} de ce nombre : calcule ${F(1, k)} × ${F(c, d)}, puis simplifie.`,
    solution: `${PART[k][0].toUpperCase() + PART[k].slice(1)} de ${F(c, d)}, c'est ${F(1, k)} de ${F(c, d)} : ${mulT([1, k], [c, d]).t}.`,
  };
};
function L2(d) {
  const formes = ['fois'];
  if (d >= 1) formes.push('gateau');
  if (d >= 2) formes.push('classe');
  if (d >= 3) formes.push('partie');
  const k = pick(formes), m = d < 2 ? 5 : d < 4 ? 7 : 8;
  if (k === 'partie') { const kk = pick([2, 3, 4, 5]), [c, dd] = coprime(1, 2 * m, 2, m); return q2partie(kk, c, dd); }
  const [a, b] = coprime(1, m - 1, 2, m, (x, y) => x < y);
  const impro = d >= 4 && k === 'fois' && chance(0.5);
  const [c, dd] = impro ? coprime(3, 2 * m, 2, m, (x, y) => x > y && fr.mul([a, b], [x, y])[1] > 1) : coprime(1, m - 1, 2, m, (x, y) => x < y);
  if (k === 'gateau') return q2gateau(a, b, c, dd, prenom());
  if (k === 'classe') return q2classe(a, b, c, dd);
  return q2fois(a, b, c, dd);
}
function C2() {
  return `<h2>2. Fraction d'une fraction</h2>
<p class="intro">Prendre « les ${F(2, 3)} des ${F(3, 4)} » d'un gâteau, c'est prendre une partie d'une partie. On multiplie les fractions.</p>
${def(`Prendre ${F('a', 'b')} <b>de</b> ${F('c', 'd')}, c'est calculer ${F('a', 'b')} × ${F('c', 'd')} = ${F('a × c', 'b × d')}.<br>On simplifie ensuite si on peut.`)}
${cols(methode(['Repère les deux fractions : « de » veut dire « × ».', 'Multiplie les numérateurs entre eux, les dénominateurs entre eux.', 'Simplifie le résultat (irréductible).', 'Vérifie avec le dessin : cases communes sur cases totales.']), aireFrac(2, 3, 3, 4, '6 cases sur 12'))}
${ex(q2fois(2, 3, 3, 4))}
${ex(q2fois(2, 3, 9, 4))}
${ex(q2gateau(2, 5, 3, 4, 'Léa'))}
${ex(q2classe(3, 5, 2, 3))}
${ex(q2partie(3, 3, 4))}
${warn(`⚠️ On ne cherche pas de dénominateur commun pour multiplier : ${F(2, 3)} × ${F(3, 4)} = ${F(6, 12)}, et non ${F(5, 7)}.<br>⚠️ « Les ${F(2, 3)} de ${F(3, 4)} » n'est pas plus grand que ${F(3, 4)} : une partie d'une partie est plus petite.`)}
${retenir(`« de » veut dire « × » : ${F('a', 'b')} de ${F('c', 'd')} = ${F('a × c', 'b × d')}.`)}`;
}

/* ====================== 3. inverse ====================== */
export const q3ent = n => ({
  ...res(1, n, 1 / n),
  html: `Quel est l'inverse de ${n} ?`,
  visual: inverseBar(n, true),
  hint: `L'inverse de ${n} est le nombre qui, multiplié par ${n}, donne 1. Combien de parts égales faut-il pour partager 1 en ${n} ? Écris une part sous forme de fraction.`,
  solution: `${n} × ${F(1, n)} = ${F(n, n)} = 1, donc l'inverse de ${n} est ${F(1, n)}.`,
});
export const q3unit = n => ({
  ...ent(n, n),
  html: `Quel est l'inverse de ${F(1, n)} ?`,
  visual: flip(1, n, true),
  hint: `Cherche le nombre qui, multiplié par ${F(1, n)}, donne 1 : combien de fois ${F(1, n)} faut-il pour faire 1 entier ?`,
  solution: `${F(1, n)} × ${n} = ${F(n, n)} = 1, donc l'inverse de ${F(1, n)} est ${n}.`,
});
export const q3frac = (a, b) => ({
  ...res(b, a, b / a),
  html: `Quel est l'inverse de ${F(a, b)} ?`,
  visual: flip(a, b, true),
  hint: `L'inverse de ${F(a, b)} est le nombre qui, multiplié par ${F(a, b)}, donne 1. Échange le numérateur ${a} et le dénominateur ${b}, puis vérifie le produit.`,
  solution: `${F(a, b)} × ${F(b, a)} = ${F(`${a} × ${b}`, `${b} × ${a}`)} = 1. L'inverse de ${F(a, b)} est ${F(b, a)}.`,
});
export const q3trou = (a, b) => ({
  ...res(b, a, b / a),
  html: `Complète :${big(`${F(a, b)} × ${slot} = 1`)}`,
  visual: flip(a, b, true),
  hint: `Le nombre cherché est l'inverse de ${F(a, b)}. Échange le haut (${a}) et le bas (${b}) de la fraction, puis contrôle : le produit doit valoir 1.`,
  solution: `${F(a, b)} × ${F(b, a)} = ${F(`${a} × ${b}`, `${b} × ${a}`)} = 1, donc le nombre cherché est ${F(b, a)}.`,
});
const DEC = [[0.5, 2], [0.25, 4], [0.2, 5], [0.1, 10], [0.125, 8], [2.5, 0.4], [1.25, 0.8], [0.4, 2.5], [0.8, 1.25]];
export const q3dec = i => {
  const [x, y] = DEC[i], k = x === 0.125 ? 1000 : 100;
  return {
    ...nums([y], 'Réponse : {0}', { value: 1 / x, keys: { comma: true } }),
    html: `Quel est l'inverse de ${M(x)} ? (Écris le résultat en nombre décimal.)`,
    hint: `Écris ${M(x)} sous forme de fraction (par exemple ${F(Math.round(x * k), k)}), simplifie-la, puis prends son inverse. Contrôle : ${M(x)} × ton résultat doit valoir 1.`,
    solution: `${M(x)} = ${F(Math.round(x * k), k)}${simpl(Math.round(x * k), k)}. L'inverse de cette fraction est ${sfx(...red(Math.round(x * k), k).reverse())}${sfx(...red(Math.round(x * k), k).reverse()) === M(y) ? '' : ` = ${M(y)}`}, soit <b>${M(y)}</b>. Vérification : ${M(x)} × ${M(y)} = 1.`,
  };
};
export const q3choix = (a, b) => {
  const good = `${b}/${a}`, wrong = [`${a}/${b}`, a < b ? `${b - a}/${b}` : `${a - b}/${a}`, `1/${a * b}`];
  const labels = shuffle([good, ...wrong]);
  const lab = s => { const [n, dd] = s.split('/'); return F(n, dd); };
  return {
    type: 'choice', check: choiceCheck(good),
    opts: labels.map(s => ({ v: s, l: lab(s) })),
    html: `Quel nombre est l'inverse de ${F(a, b)} ?`,
    visual: a < b ? barreFrac(a, b, { lab2: '1 entier' }) : undefined,
    hint: `L'inverse de ${F(a, b)} est le nombre qui, multiplié par ${F(a, b)}, donne 1. Essaie de multiplier ${F(a, b)} par chaque proposition : lequel donne 1 ?`,
    solution: `${F(a, b)} × ${F(b, a)} = ${F(`${a} × ${b}`, `${b} × ${a}`)} = 1. L'inverse de ${F(a, b)} est ${F(b, a)}.`,
    expected: good,
  };
};
function L3(d) {
  const formes = ['choix', 'ent'];
  if (d >= 1) formes.push('frac', 'trou', 'unit');
  if (d >= 3) formes.push('dec', 'dec');
  if (d >= 2) formes.push('frac', 'trou');
  const k = pick(formes), impro = d >= 2 && chance(0.5);
  const [a, b] = impro ? coprime(3, 9, 2, 7, (x, y) => x > y) : coprime(2, 7, 3, 9, (x, y) => x < y);
  const q = (() => {
    switch (k) {
      case 'choix': return q3choix(a, b);
      case 'ent': return q3ent(ri(2, d < 2 ? 8 : 12));
      case 'unit': return q3unit(ri(2, 12));
      case 'frac': return q3frac(a, b);
      case 'trou': return q3trou(a, b);
      default: return q3dec(ri(0, DEC.length - 1));
    }
  })();
  return q;
}
function C3() {
  return `<h2>3. L'inverse d'un nombre</h2>
<p class="intro">L'inverse d'un nombre est celui qui, multiplié par lui, donne 1 : c'est le nombre qui « annule » la multiplication.</p>
${def(`L'<b>inverse</b> de ${F('a', 'b')} (a et b non nuls) est ${F('b', 'a')} : ${F('a', 'b')} × ${F('b', 'a')} = 1.<br>L'inverse de l'entier n est ${F(1, 'n')} ; l'inverse de ${F(1, 'n')} est n.`)}
${cols(methode(['Écris le nombre sous forme de fraction (un entier n s\'écrit ' + F('n', 1) + ', un décimal comme 0,25 s\'écrit ' + F(25, 100) + ').', 'Échange le numérateur et le dénominateur.', 'Vérifie : le produit doit valoir 1.']), inverseBar(4))}
${ex(q3choix(3, 5))}
${ex(q3ent(5))}
${ex(q3unit(8))}
${ex(q3frac(3, 4))}
${ex(q3frac(7, 2))}
${ex(q3trou(2, 7))}
${ex(q3dec(1))}
${warn(`⚠️ L'inverse n'est pas l'opposé : l'inverse de ${F(3, 4)} est ${F(4, 3)}, son opposé est −${F(3, 4)}.<br>⚠️ L'inverse de 0 n'existe pas : on ne peut pas diviser par 0.<br>⚠️ L'inverse de ${F(3, 5)} n'est pas ${F(2, 5)} : on échange le haut et le bas, on ne soustrait pas.`)}
${retenir(`l'inverse de ${F('a', 'b')} est ${F('b', 'a')}, et leur produit vaut 1.`)}`;
}

/* ====================== 4. diviser par une fraction ====================== */
const nbGroupes = (x, s) => fv(x) / fv(s);
const visuDiv = (x, s, unit) => (nbGroupes(x, s) <= 24 && fv(x) <= 6 ? groupes(x, s, { unit }) : undefined);
export const q4ent = (n, c, d) => {
  const r = divT([n, 1], [c, d]);
  return {
    ...res(n * d, c, n / (c / d)),
    html: `Calcule :${big(`${n} ÷ ${F(c, d)}`)}${RES}`,
    visual: visuDiv([n, 1], [c, d]),
    hint: `Diviser par ${F(c, d)}, c'est multiplier par son inverse. Écris l'inverse de ${F(c, d)} (échange ${c} et ${d}), multiplie-le par ${n}, puis simplifie.`,
    solution: `${r.t}.`,
  };
};
export const q4frac = (a, b, c, d) => {
  const r = divT([a, b], [c, d]);
  return {
    ...res(a * d, b * c, (a / b) / (c / d)),
    html: `Calcule :${big(`${F(a, b)} ÷ ${F(c, d)}`)}${RES}`,
    visual: visuDiv([a, b], [c, d]),
    hint: `Remplace la division par une multiplication : ${F(a, b)} ÷ ${F(c, d)} = ${F(a, b)} × (l'inverse de ${F(c, d)}). Multiplie, puis simplifie.`,
    solution: `${r.t}.`,
  };
};
export const q4div = (a, b, n) => ({
  ...res(a, b * n, a / b / n),
  html: `Calcule :${big(`${F(a, b)} ÷ ${n}`)}${RES}`,
  visual: visuDiv([a, b], [a, b * n]),
  hint: `Diviser ${F(a, b)} par ${n}, c'est multiplier par l'inverse de ${n}, c'est-à-dire par ${F(1, n)} : calcule ${F(a, b)} × ${F(1, n)}, puis simplifie.`,
  solution: `${F(a, b)} ÷ ${n} = ${F(a, b)} × ${F(1, n)} = ${F(`${a} × 1`, `${b} × ${n}`)} = ${F(a, b * n)}${simpl(a, b * n)}.`,
});
export const q4trou = (a, b, c, d) => ({
  ...res(d, c, d / c),
  html: `Complète :${big(`${F(a, b)} ÷ ${F(c, d)} = ${F(a, b)} × ${slot}`)}`,
  hint: `Diviser par ${F(c, d)}, c'est multiplier par l'inverse de ${F(c, d)}. Échange le numérateur ${c} et le dénominateur ${d}.`,
  solution: `Diviser par ${F(c, d)}, c'est multiplier par son inverse ${F(d, c)} : ${F(a, b)} ÷ ${F(c, d)} = ${F(a, b)} × ${F(d, c)}.`,
});
function L4(d) {
  const formes = ['trou', 'ent'];
  if (d >= 2) formes.push('frac', 'frac');
  if (d >= 3) formes.push('div');
  const k = pick(formes), m = d < 3 ? 6 : 8;
  if (k === 'trou') { const [a, b] = coprime(1, 8, 2, 9, (x, y) => x < y), [c, dd] = coprime(2, 7, 3, 9, (x, y) => x < y); return q4trou(a, b, c, dd); }
  if (k === 'ent') {
    const n = ri(2, 4);
    if (d < 1) return q4ent(n, 1, ri(2, 6));
    const [c, dd] = coprime(1, 5, 2, 7, (x, y) => x < y && x !== n);
    return q4ent(n, c, dd);
  }
  if (k === 'div') { const [a, b] = coprime(2, 9, 2, 8, (x, y) => x < y + 3), n = pick([2, 3, 4, 5]); return q4div(a, b, n); }
  const [a, b] = coprime(1, m, 2, m, (x, y) => x < 2 * y);
  const [c, dd] = coprime(1, m, 2, m, (x, y) => x < y && !(x === a && y === b) && x * b !== a * y && nbGroupes([a, b], [x, y]) <= 24);
  return q4frac(a, b, c, dd);
}
function C4() {
  return `<h2>4. Diviser par une fraction</h2>
<p class="intro">Combien de verres de ${F(1, 4)} L peut-on remplir avec 3 L ? Il y en a 4 par litre : ${3} × 4 = 12. Diviser par ${F(1, 4)}, c'est multiplier par 4.</p>
${def(`<b>Diviser par une fraction, c'est multiplier par son inverse</b> :<br>${F('a', 'b')} ÷ ${F('c', 'd')} = ${F('a', 'b')} × ${F('d', 'c')}<br>Diviser par un entier n, c'est multiplier par ${F(1, 'n')}.`)}
${cols(methode(['Écris l\'inverse de la fraction par laquelle on divise (échange haut et bas).', 'Remplace « ÷ » par « × » et écris l\'inverse.', 'Multiplie les numérateurs, puis les dénominateurs.', 'Simplifie (entier ou fraction irréductible).']), groupes([3, 1], [1, 4], { unit: 'L', cap: '3 ÷ 1/4 = 12 morceaux' }))}
${ex(q4trou(2, 3, 3, 5))}
${ex(q4ent(3, 1, 4))}
${ex(q4ent(4, 3, 5))}
${ex(q4frac(3, 4, 5, 8))}
${ex(q4frac(5, 6, 5, 3))}
${ex(q4div(3, 4, 2))}
${warn(`⚠️ On inverse la fraction par <b>laquelle</b> on divise (la deuxième), pas la première : ${F(2, 3)} ÷ ${F(4, 5)} = ${F(2, 3)} × ${F(5, 4)}.<br>⚠️ Diviser par ${F(1, 4)} <b>augmente</b> : 3 ÷ ${F(1, 4)} = 12, pas ${F(3, 4)}.<br>⚠️ Une fois la division changée en multiplication, on ne cherche pas de dénominateur commun.`)}
${retenir(`diviser par ${F('c', 'd')}, c'est multiplier par ${F('d', 'c')}.`)}`;
}

/* ====================== 5. calculs enchaînés ====================== */
const tk = (...l) => l.map(x => (Array.isArray(x) ? { f: x } : typeof x === 'number' ? { n: x } : { t: x }));
// A × B ÷ C
export const q5md = (A, B, C) => {
  const s1 = mulT(A, B), s2 = divT(s1.r, C), val = (fv(A) * fv(B)) / fv(C);
  return {
    ...res(s2.r[0], s2.r[1], val),
    html: `Calcule :${big(`${f(A)} × ${f(B)} ÷ ${f(C)}`)}${RES}`,
    visual: ordre(tk(A, '×', B, '÷', C), [[0, 2, 'd\'abord (de gauche à droite)']]),
    hint: `Sans parenthèses, on calcule de gauche à droite : commence par ${f(A)} × ${f(B)}, puis divise le résultat par ${f(C)} (multiplie par son inverse).`,
    solution: `${s1.t}. Puis ${s2.t}.`,
  };
};
// A + B × C
export const q5am = (A, B, C) => {
  const s1 = mulT(B, C), s2 = addT(A, s1.r), val = fv(A) + fv(B) * fv(C);
  return {
    ...res(s2.r[0], s2.r[1], val),
    html: `Calcule (attention aux priorités) :${big(`${f(A)} + ${f(B)} × ${f(C)}`)}${RES}`,
    visual: ordre(tk(A, '+', B, '×', C), [[2, 4, 'd\'abord (× avant +)']]),
    hint: `La multiplication est prioritaire : calcule d'abord ${f(B)} × ${f(C)}, puis ajoute ${f(A)} (mets les fractions au même dénominateur).`,
    solution: `${s1.t}. Puis ${s2.t}.`,
  };
};
// (A + B) ÷ C ou (A − B) × C
export const q5par = (A, B, C, op, op2) => {
  const s1 = addT(A, B, op), s2 = op2 === '÷' ? divT(s1.r, C) : mulT(s1.r, C);
  const val = op2 === '÷' ? ((op === '+' ? fv(A) + fv(B) : fv(A) - fv(B)) / fv(C)) : ((op === '+' ? fv(A) + fv(B) : fv(A) - fv(B)) * fv(C));
  return {
    ...res(s2.r[0], s2.r[1], val),
    html: `Calcule :${big(`(${f(A)} ${op} ${f(B)}) ${op2} ${f(C)}`)}${RES}`,
    visual: ordre(tk('(', A, op, B, ')', op2, C), [[0, 4, 'd\'abord (parenthèses)']]),
    hint: `Les parenthèses d'abord : calcule ${f(A)} ${op} ${f(B)} (même dénominateur), puis ${op2 === '÷' ? 'divise par' : 'multiplie par'} ${f(C)}.`,
    solution: `${s1.t}. Puis ${s2.t}.`,
  };
};
// A − B ÷ C
export const q5sd = (A, B, C) => {
  const s1 = divT(B, C), s2 = addT(A, s1.r, '−'), val = fv(A) - fv(B) / fv(C);
  return {
    ...res(s2.r[0], s2.r[1], val),
    html: `Calcule (attention aux priorités) :${big(`${f(A)} − ${f(B)} ÷ ${f(C)}`)}${RES}`,
    visual: ordre(tk(A, '−', B, '÷', C), [[2, 4, 'd\'abord (÷ avant −)']]),
    hint: `La division est prioritaire : calcule d'abord ${f(B)} ÷ ${f(C)}, puis retire le résultat de ${f(A)}.`,
    solution: `${s1.t}. Puis ${s2.t}.`,
  };
};
// A ÷ B + C × D
export const q5deux = (A, B, C, D) => {
  const s1 = divT(A, B), s2 = mulT(C, D), s3 = addT(s1.r, s2.r), val = fv(A) / fv(B) + fv(C) * fv(D);
  return {
    ...res(s3.r[0], s3.r[1], val),
    html: `Calcule :${big(`${f(A)} ÷ ${f(B)} + ${f(C)} × ${f(D)}`)}${RES}`,
    visual: ordre(tk(A, '÷', B, '+', C, '×', D), [[0, 2, '1er calcul'], [4, 6, '2e calcul']]),
    hint: `Calcule séparément ${f(A)} ÷ ${f(B)} et ${f(C)} × ${f(D)} (× et ÷ avant +), puis additionne les deux résultats.`,
    solution: `${s1.t}. Puis ${s2.t}. Enfin ${s3.t}.`,
  };
};
/** fraction propre réduite à dénominateur ≤ m */
const pf = m => coprime(1, m - 1, 2, m, (x, y) => x < y);
const petit = r => r[0] <= 99 && r[1] <= 99;
function essayer(fab, essais = 400) {
  for (let i = 0; i < essais; i++) { const q = fab(); if (q) return q; }
  throw new Error('pas de calcul acceptable');
}
function L5(d) {
  const formes = ['md'];
  if (d >= 1) formes.push('am');
  if (d >= 2) formes.push('par');
  if (d >= 3) formes.push('sd');
  if (d >= 4) formes.push('deux');
  const k = pick(formes), m = d < 2 ? 5 : 6;
  return essayer(() => {
    const A = pf(m), B = pf(m), C = pf(m), D = pf(m);
    if (k === 'md') { const r = fr.div(fr.mul(A, B), C); return petit(r) && !(A[0] === C[0] && A[1] === C[1]) && !(B[0] === C[0] && B[1] === C[1]) ? q5md(A, B, C) : null; }
    if (k === 'am') { const r = fr.add(A, fr.mul(B, C)); return petit(r) ? q5am(A, B, C) : null; }
    if (k === 'par') {
      const op = chance(0.5) ? '+' : '−', op2 = chance(0.5) ? '÷' : '×';
      if (op === '−' && fv(A) <= fv(B)) return null;
      const r = op2 === '÷' ? fr.div(op === '+' ? fr.add(A, B) : fr.sub(A, B), C) : fr.mul(op === '+' ? fr.add(A, B) : fr.sub(A, B), C);
      return petit(r) && r[1] > 1 ? q5par(A, B, C, op, op2) : null;
    }
    if (k === 'sd') { const s = fr.div(B, C), r = fr.sub(A, s); return r[0] > 0 && petit(r) && r[1] > 1 && s[1] <= 12 ? q5sd(A, B, C) : null; }
    const r = fr.add(fr.div(A, B), fr.mul(C, D));
    return petit(r) && fr.div(A, B)[1] <= 12 ? q5deux(A, B, C, D) : null;
  });
}
function C5() {
  return `<h2>5. Calculs enchaînés avec des fractions</h2>
<p class="intro">Avec des fractions, les règles de priorité sont les mêmes qu'avec les entiers : on traite d'abord les parenthèses, puis les × et ÷, enfin les + et −.</p>
${def(`Ordre des calculs : <b>1.</b> parenthèses ; <b>2.</b> × et ÷ (de gauche à droite) ; <b>3.</b> + et − (de gauche à droite).<br>× : on multiplie haut et bas. ÷ : on multiplie par l'inverse. + et − : même dénominateur d'abord.`)}
${cols(methode(['Entoure ce qu\'on calcule en premier.', 'Fais chaque opération sur une ligne, en simplifiant au fur et à mesure.', 'Recopie le reste du calcul avec le résultat obtenu.', 'Termine par une fraction irréductible.']), ordre(tk([1, 2], '+', [1, 3], '×', [3, 4]), [[2, 4, 'd\'abord (× avant +)']]))}
${ex(q5md([2, 3], [3, 4], [5, 6]))}
${ex(q5am([1, 2], [1, 3], [3, 4]))}
${ex(q5par([1, 2], [1, 3], [5, 4], '+', '÷'))}
${ex(q5par([3, 4], [1, 4], [2, 3], '−', '×'))}
${ex(q5sd([5, 6], [1, 3], [2, 3]))}
${ex(q5deux([1, 2], [3, 4], [2, 3], [3, 5]))}
${warn(`⚠️ ${F(1, 2)} + ${F(1, 3)} × ${F(3, 4)} : on ne calcule pas ${F(1, 2)} + ${F(1, 3)} en premier, la multiplication est prioritaire.<br>⚠️ Pour une division enchaînée, on divise de gauche à droite : ${F(2, 3)} ÷ ${F(1, 2)} ÷ ${F(1, 3)} n'est pas ${F(2, 3)} ÷ (${F(1, 2)} ÷ ${F(1, 3)}).`)}
${retenir('parenthèses, puis × et ÷, puis + et − ; on simplifie à chaque étape.')}`;
}

/* ====================== 6. problèmes avec des divisions de fractions ====================== */
const CTX6 = [
  { piece: [[1, 4], [1, 5], [1, 10], [1, 3]], texte: (T, p) => `Une carafe contient ${f(T)} L d'eau. On remplit des verres de ${f(p)} L. Combien de verres peut-on remplir ?`, unit: 'L', obj: 'verres' },
  { piece: [[1, 4], [3, 4], [1, 2], [2, 3], [3, 5], [3, 10]], texte: (T, p) => `Un ruban de ${f(T)} m est découpé en morceaux de ${f(p)} m. Combien de morceaux obtient-on ?`, unit: 'm', obj: 'morceaux' },
  { piece: [[1, 4], [3, 10], [2, 5], [1, 5], [3, 4]], texte: (T, p) => `Pour un gâteau, il faut ${f(p)} kg de farine. Avec ${f(T)} kg de farine, combien de gâteaux peut-on faire ?`, unit: 'kg', obj: 'gâteaux' },
];
export const q6compte = (T, p, i) => {
  const c = CTX6[i], n = fv(T) / fv(p), r = divT(T, p);
  return {
    ...ent(Math.round(n), n),
    html: c.texte(T, p),
    visual: visuDiv(T, p, c.unit),
    hint: `Il faut savoir combien de fois ${f(p)} ${c.unit} tient dans ${f(T)} ${c.unit} : c'est la division ${f(T)} ÷ ${f(p)}. Multiplie ${f(T)} par l'inverse de ${f(p)}.`,
    solution: `${r.t}. On obtient <b>${Math.round(n)}</b> ${c.obj}.`,
  };
};
export const q6partage = (T, n) => {
  const r = divT(T, [n, 1]);
  return {
    ...res(T[0], T[1] * n, fv(T) / n),
    html: `${f(T)} L de jus de fruit sont versés dans ${n} bouteilles identiques, à parts égales. Quelle fraction de litre contient chaque bouteille ?${RES}`,
    visual: visuDiv(T, [T[0], T[1] * n], 'L'),
    hint: `Partager ${f(T)} L en ${n} parts égales, c'est diviser ${f(T)} par ${n} : multiplie ${f(T)} par l'inverse de ${n}, puis simplifie.`,
    solution: `${r.t} L dans chaque bouteille.`,
  };
};
const CTX6B = [
  (a, b, k) => ({ html: `Les ${F(a, b)} d'un trajet représentent ${k} km. Quelle est la longueur du trajet entier ?`, u: 'km', tout: 'trajet : ? km', lab1: `${k} km` }),
  (a, b, k) => ({ html: `Les ${F(a, b)} d'une somme d'argent représentent ${k} €. Quelle est la somme totale ?`, u: '€', tout: 'somme : ? €', lab1: `${k} €` }),
  (a, b, k) => ({ html: `Dans un collège, les ${F(a, b)} des élèves sont demi-pensionnaires, soit ${k} élèves. Combien d'élèves compte le collège ?`, u: 'élèves', tout: 'collège : ? élèves', lab1: `${k} élèves` }),
];
export const q6tout = (a, b, m, i) => {
  const k = a * m, c = CTX6B[i](a, b, k), r = divT([k, 1], [a, b]);
  return {
    ...ent(b * m, k / (a / b), c.u === 'élèves' ? '' : ''),
    html: c.html,
    visual: barreFrac(a, b, { lab1: c.lab1, lab2: c.tout }),
    hint: `Les ${F(a, b)} du tout valent ${k}. Le tout vaut donc ${k} ÷ ${F(a, b)} : multiplie ${k} par l'inverse de ${F(a, b)}, ou cherche d'abord ce que vaut ${F(1, b)}.`,
    solution: `${r.t}. Le tout vaut <b>${b * m}</b>.`,
  };
};
function L6(d) {
  const formes = ['compte', 'compte'];
  if (d >= 2) formes.push('partage');
  if (d >= 3) formes.push('tout', 'tout');
  const k = pick(formes);
  if (k === 'compte') {
    const i = ri(0, CTX6.length - 1), p = pick(CTX6[i].piece);
    // d = 0 : le total est un nombre entier (n multiple du dénominateur de la part)
    const n = d < 1 ? p[1] * ri(1, Math.max(1, Math.floor(18 / p[1]))) : ri(3, d < 2 ? 12 : 18);
    return q6compte(fr.mul([n, 1], p), p, i);
  }
  if (k === 'partage') {
    const n = ri(2, 6), T = coprime(2, 9, 2, 6);
    return q6partage(T, n);
  }
  const [a, b] = coprime(2, 7, 3, 9, (x, y) => x < y);
  return q6tout(a, b, ri(2, 9), ri(0, CTX6B.length - 1));
}
function C6() {
  return `<h2>6. Problèmes avec des divisions de fractions</h2>
<p class="intro">« Combien de fois ?», « quelle quantité en tout ? » : la division par une fraction répond à ces questions.</p>
${def(`• <b>Combien de morceaux de ${F('c', 'd')}</b> dans ${F('a', 'b')} ? On calcule ${F('a', 'b')} ÷ ${F('c', 'd')}.<br>• <b>Les ${F('a', 'b')} du tout valent k</b> : le tout vaut k ÷ ${F('a', 'b')}.<br>• <b>Partager en n parts égales</b> : on divise par n.`)}
${cols(methode(['Dis avec tes mots ce que tu cherches : un nombre de morceaux, un tout, une part.', 'Écris la division correspondante.', 'Remplace par une multiplication par l\'inverse, puis simplifie.', 'Vérifie : nombre de morceaux × taille d\'un morceau = total.']), groupes([3, 2], [1, 4], { unit: 'L', cap: '3/2 ÷ 1/4 = 6 verres' }))}
${ex(q6compte([3, 1], [1, 4], 0))}
${ex(q6compte([9, 2], [3, 4], 1))}
${ex(q6compte([3, 2], [3, 10], 2))}
${ex(q6partage([3, 4], 2))}
${ex(q6tout(3, 5, 12, 0))}
${ex(q6tout(2, 3, 8, 1))}
${ex(q6tout(3, 8, 5, 2))}
${warn(`⚠️ Les ${F(3, 5)} du tout valent 36 : le tout vaut <b>plus</b> que 36 (60), pas ${F(3, 5)} de 36.<br>⚠️ Pour « combien de morceaux ? » on divise le total par la taille d'un morceau, pas l'inverse.`)}
${retenir('« combien de ... dans ... » ou « le tout » : je divise, donc je multiplie par l\'inverse.')}`;
}

export { L1, C1, L2, C2, L3, C3, L4, C4, L5, C5, L6, C6 };

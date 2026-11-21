// Niveaux 7 et 8 : calcul littéral ; équations, inéquations, formules.
import { ri, pick, shuffle, M, F, big, ent, dec, gcd, niveau } from './outils.js';
import { terms, strip } from '../../engine/util/fmt.js';
import { r6 } from '../../engine/util/arith.js';

const nzr = (a, b) => { let v; do { v = ri(a, b); } while (v === 0); return v; };
const Pn = n => (n < 0 ? `(−${-n})` : String(n));
const nice2 = v => Math.abs(v) < 1000 && Math.abs(v * 100 - Math.round(v * 100)) < 1e-6;
const lin = (a, b) => terms([[a, 'x'], [b, '']]);
const poly = (c2, c1, c0) => terms([[c2, 'x²'], [c1, 'x'], [c0, '']]);
const key = (c2, c1, c0) => `${r6(c2)}|${r6(c1)}|${r6(c0)}`;
/** coefficients retrouvés par échantillonnage de la fonction f (vérification indépendante) */
const coefs = f => { const f0 = f(0), f1 = f(1), f2 = f(2); const c2 = (f2 - 2 * f1 + f0) / 2, c1 = f1 - f0 - c2; return key(c2, c1, f0); };
const xp = a => (a > 0 ? `x + ${a}` : `x − ${-a}`);
const xq = (k, a) => (a > 0 ? `${k === 1 ? '' : k}x + ${a}` : `${k === 1 ? '' : k}x − ${-a}`);
const cand = (list, good) => list.filter(c => key(...c) !== key(...good)).map(c => ({ l: poly(...c), n: key(...c) }));
const why = {
  oubli: 'Tu as oublié de multiplier le deuxième terme de la parenthèse.',
  double: 'Tu as oublié le double produit : (a + b)² ≠ a² + b².',
  signe: 'Erreur de signe : revois le produit des deux nombres.',
  inter: 'Dans une identité remarquable, les signes ne se placent pas n’importe comment : revois la formule.',
};

/* =================== NIVEAU 7 =================== */
const devS = {
  id: 'l-dev-s', dmin: 0, titre: 'développer k(x + a)',
  draw(d) { return { k: d < 2 ? ri(2, 9) : pick([nzr(-9, -2), ri(2, 9)]), a: nzr(-9, 9) }; },
  ex: { k: 3, a: -4 },
  build({ k, a }) {
    const g = [0, k, k * a];
    const bads = [[0, k, a], [0, k, -k * a], [0, k, k + a], [0, 1, k * a], [0, k * a, k], [0, k, k * a + 1]].filter(c => key(...c) !== key(...g));
    return {
      html: `Développe : ${big(`${k < 0 ? '−' + Math.abs(k) : k}(${xp(a)})`)}`,
      good: { l: lin(k, k * a), n: key(...g) },
      bads: bads.map(c => ({ l: lin(c[1], c[2]), n: key(...c), why: c[2] === a ? why.oubli : c[2] === -k * a ? why.signe : c[2] === k + a ? 'Tu as additionné ' + k + ' et ' + a + ' : il faut les multiplier.' : 'Chaque terme de la parenthèse est multiplié par ' + k + '.' })),
      hint: `Multiplie ${k < 0 ? '−' + Math.abs(k) : k} par <b>chaque</b> terme de la parenthèse : par x, puis par ${a < 0 ? '(−' + (-a) + ')' : a}. Attention au signe du 2<sup>e</sup> produit.`,
      solution: `${k < 0 ? M(k) : k}(${xp(a)}) = ${M(k)} × x + ${Pn(k)} × ${Pn(a)} = ${lin(k, k * a)}.`,
      indep: () => coefs(x => k * (x + a)),
    };
  },
};
const devD = {
  id: 'l-dev-d', dmin: 1, titre: 'développer (x + a)(x + b)',
  draw() { for (;;) { const a = nzr(-9, 9), b = nzr(-9, 9); if (a + b !== 0 && a !== b && a + b !== a * b) return { a, b }; } },
  ex: { a: 3, b: -5 },
  build({ a, b }) {
    const g = [1, a + b, a * b];
    return {
      html: `Développe : ${big(`(${xp(a)})(${xp(b)})`)}`,
      good: { l: poly(...g), n: key(...g) },
      bads: [[1, a + b, 0], [1, a * b, a + b], [1, a + b, -a * b], [1, 0, a * b], [1, a + b, a + b]].filter(c => key(...c) !== key(...g)).map(c => ({ l: poly(...c), n: key(...c), why: c[2] === 0 ? 'Tu as oublié le produit ' + (a < 0 ? '(−' + (-a) + ')' : a) + ' × ' + (b < 0 ? '(−' + (-b) + ')' : b) + ' des deux nombres.' : c[1] === 0 ? 'Il manque les termes en x : x × ' + b + ' et ' + a + ' × x.' : c[2] === -a * b ? why.signe : 'Le coefficient de x est la <b>somme</b> a + b, le dernier terme le <b>produit</b> a × b.' })),
      hint: `Les deux nombres sont ${M(a)} et ${M(b)} : le coefficient de x est leur somme, le terme constant est leur produit (attention aux signes).`,
      solution: `(${xp(a)})(${xp(b)}) = x² + ${Pn(a)}x + ${Pn(b)}x + ${Pn(a)} × ${Pn(b)} = ${poly(...g)}.`,
      indep: () => coefs(x => (x + a) * (x + b)),
    };
  },
};
const carre = sign => ({
  id: sign > 0 ? 'l-carre-p' : 'l-carre-m', dmin: 2, titre: sign > 0 ? 'développer (x + a)²' : 'développer (x − a)²',
  draw() { return { a: ri(2, 9) * sign }; },
  ex: { a: sign > 0 ? 3 : -5 },
  build({ a }) {
    const g = [1, 2 * a, a * a];
    return {
      html: `Développe : ${big(`(${xp(a)})<sup>2</sup>`)}`,
      good: { l: poly(...g), n: key(...g) },
      bads: [[1, 0, a * a], [1, a, a * a], [1, 2 * a, -a * a], [1, -2 * a, a * a], [1, 2 * a, 2 * a]].filter(c => key(...c) !== key(...g)).map(c => ({ l: poly(...c), n: key(...c), why: c[1] === 0 ? why.double : c[1] === a ? 'Le double produit est 2 × x × ' + a + ' = ' + (2 * a) + 'x (pas ' + a + 'x).' : c[1] === -2 * a ? 'Le signe du double produit est celui de ' + (a < 0 ? '−' : '+') + ' dans la parenthèse.' : c[2] === -a * a ? 'Le carré ' + a + '<sup>2</sup> est toujours positif.' : 'Le dernier terme est ' + a + '<sup>2</sup> = ' + a * a + '.' })),
      hint: `(a ${a < 0 ? '−' : '+'} b)² = a² ${a < 0 ? '−' : '+'} 2ab + b² avec a = x et b = ${Math.abs(a)} : calcule 2 × x × ${Math.abs(a)} puis ${Math.abs(a)}².`,
      solution: `(${xp(a)})² = x² ${a < 0 ? '−' : '+'} 2 × x × ${Math.abs(a)} + ${Math.abs(a)}² = ${poly(...g)}.`,
      indep: () => coefs(x => (x + a) * (x + a)),
    };
  },
});
const diff = {
  id: 'l-diff', dmin: 3, titre: 'développer (x − a)(x + a)',
  draw() { return { a: ri(2, 12), sw: pick([true, false]) }; },
  ex: { a: 7, sw: false },
  build({ a, sw }) {
    const g = [1, 0, -a * a];
    return {
      html: `Développe : ${big(sw ? `(x + ${a})(x − ${a})` : `(x − ${a})(x + ${a})`)}`,
      good: { l: poly(...g), n: key(...g) },
      bads: [[1, 0, a * a], [1, -2 * a, a * a], [1, 2 * a, a * a], [1, 2 * a, -a * a], [1, a, -a * a]].filter(c => key(...c) !== key(...g)).map(c => ({ l: poly(...c), n: key(...c), why: c[2] === a * a && c[1] === 0 ? 'Les termes en x se compensent bien, mais le dernier terme est ' + (a) + ' × (−' + a + ') = −' + a * a + '.' : 'Ici les deux termes en x s’annulent (+' + a + 'x et −' + a + 'x) : c’est l’identité (a − b)(a + b) = a² − b².' })),
      hint: `Les deux parenthèses ne diffèrent que par le signe de ${a} : les termes en x s’annulent. Il reste x² et le produit ${a} × (−${a}).`,
      solution: `(x − ${a})(x + ${a}) = x² − ${a}² = x² − ${a * a} (identité a² − b²).`,
      indep: () => coefs(x => (x - a) * (x + a)),
    };
  },
};
const FC = (k, p, q) => `${k === 1 ? '' : k}(${xq(p, q)})`.replace('(x + ', '(x + ');
const factComm = {
  id: 'l-fact-c', dmin: 1, titre: 'factoriser avec un facteur numérique commun',
  draw() { for (;;) { const g = pick([2, 3, 4, 5, 6]), p = ri(1, 5), q = nzr(-9, 9); if (gcd(p, Math.abs(q)) === 1) return { g, p, q }; } },
  ex: { g: 3, p: 2, q: 3 },
  build({ g, p, q }) {
    const A = g * p, B = g * q;
    const fc = (k, pp, qq) => `${k}(${xq(pp, qq)})`;
    const prodKey = (k, pp, qq) => `${k}|${pp}|${qq}`;
    const cands = [[g, p, B, 'Tu as oublié de diviser le 2<sup>e</sup> terme par ' + g + '.'], [g, A, q, 'Tu as oublié de diviser le 1<sup>er</sup> terme par ' + g + '.'], [g, p, -q, why.signe], [p === 1 || g % 2 ? null : g / 2, 2 * p, 2 * q, 'Factorisation juste mais incomplète : ' + (2 * p) + ' et ' + (2 * q) + ' ont encore un facteur commun, ' + 2 + '.'], [p + g, 1, q, 'Le facteur commun est un diviseur de ' + A + ' <b>et</b> de ' + Math.abs(B) + '.']].filter(c => c[0] !== null && prodKey(c[0], c[1], c[2]) !== prodKey(g, p, q));
    return {
      html: `Factorise avec le plus grand facteur commun : ${big(lin(A, B))}`,
      good: { l: fc(g, p, q), n: prodKey(g, p, q) },
      bads: cands.map(c => ({ l: fc(c[0], c[1], c[2]), n: prodKey(c[0], c[1], c[2]), why: c[3] })),
      hint: `Cherche le plus grand nombre qui divise à la fois ${A} et ${Math.abs(B)} : c’est le facteur à mettre devant la parenthèse ; divise ensuite chaque terme par lui.`,
      solution: `${A} = ${g} × ${p} et ${B} = ${g} × ${q < 0 ? '(−' + (-q) + ')' : q} : ${lin(A, B)} = ${fc(g, p, q)}.`,
      indep: () => (g * (p * 5 + q) === A * 5 + B && g * (p * 2 + q) === A * 2 + B ? prodKey(g, p, q) : 'ko'),
    };
  },
};
const factX = {
  id: 'l-fact-x', dmin: 2, titre: 'factoriser avec le facteur x',
  draw() { return { a: nzr(-9, 9), t: pick(['sq', 'sq', 'k']) }; },
  ex: { a: 5, t: 'sq' },
  build({ a }) {
    const s = a > 0 ? '+' : '−', A = Math.abs(a);
    const good = `x(x ${s} ${A})`;
    const f = x => x * x + a * x;
    const opts = [
      [`x(x ${s === '+' ? '−' : '+'} ${A})`, x => x * (x + (a > 0 ? -A : A)), 'Le signe dans la parenthèse est celui de ' + (a > 0 ? '+' : '−') + A + 'x.'],
      [`x(${a > 0 ? '' : '−'}${A})`, x => x * a, 'En mettant x en facteur, il reste x dans la parenthèse : x² = x × x.'],
      [`x<sup>2</sup>(1 ${s} ${A})`, x => x * x * (1 + a), 'Seul le facteur x est commun aux deux termes (pas x²).'],
      [`${A}x(x ${s} 1)`, x => a * x * (x + (a > 0 ? 1 : -1)) * (a > 0 ? 1 : -1), 'Le nombre ' + A + ' n’est pas un facteur de x².'],
      [`x(x ${s} ${A}x)`, x => x * (x + a * x), 'Dans la parenthèse il reste ' + a + ', pas ' + a + 'x : on a divisé ' + a + 'x par x.'],
    ];
    const same = fn => [1, 2, 3, 4].every(x => Math.abs(fn(x) - f(x)) < 1e-9);
    return {
      html: `Factorise : ${big(`x<sup>2</sup> ${s} ${A}x`)}`,
      good: { l: good, n: 'ok' },
      bads: opts.filter(o => !same(o[1])).map(o => ({ l: o[0], n: o[0], why: o[2] })),
      hint: `x<sup>2</sup> = x × x et ${A}x = ${A} × x : quel facteur apparaît dans les deux termes ? Mets-le devant et note ce qu’il reste dans la parenthèse.`,
      solution: `x<sup>2</sup> ${s} ${A}x = x × x ${s} ${A} × x = x(x ${s} ${A}).`,
      indep: () => [1, 2, 3, 4].every(x => Math.abs(x * (x + a) - f(x)) < 1e-9) ? 'ok' : 'ko',
    };
  },
};
const factDiff = {
  id: 'l-fact-diff', dmin: 4, titre: 'factoriser x² − a²',
  draw() { return { a: ri(2, 12) }; },
  ex: { a: 7 },
  build({ a }) {
    const good = `(x − ${a})(x + ${a})`;
    return {
      html: `Factorise : ${big(`x<sup>2</sup> − ${a * a}`)}`,
      good: { l: good, n: 'ok' },
      bads: [
        { l: `(x − ${a})<sup>2</sup>`, n: 'a', why: 'Ce carré donne x² − ' + 2 * a + 'x + ' + a * a + ' : il y a un terme en x en trop.' },
        { l: `(x + ${a})<sup>2</sup>`, n: 'b', why: 'Ce carré donne x² + ' + 2 * a + 'x + ' + a * a + '.' },
        { l: `(x − ${a * a})(x + 1)`, n: 'c', why: 'Développe pour vérifier : le terme en x ne disparaît pas.' },
        { l: `(x − ${a * a})(x + ${a * a})`, n: 'd', why: a * a + ' est le carré de ' + a + ' : c’est ' + a + ' qui apparaît dans les parenthèses.' },
        { l: `(x − ${a})(x − ${a})`, n: 'e', why: 'C’est le carré (x − ' + a + ')<sup>2</sup>, qui contient un terme en x.' },
      ],
      hint: `${a * a} est le carré de ${a} : x² − ${a * a} = x² − ${a}². Utilise a² − b² = (a − b)(a + b).`,
      solution: `x² − ${a * a} = x² − ${a}² = (x − ${a})(x + ${a}).`,
      indep: () => [3, 5, 9].every(x => (x - a) * (x + a) === x * x - a * a) ? 'ok' : 'ko',
    };
  },
};
const factCarre = {
  id: 'l-fact-carre', dmin: 5, titre: 'reconnaître un carré : x² ± 2ax + a²',
  draw() { return { a: ri(2, 9) * pick([1, -1]) }; },
  ex: { a: 3 },
  build({ a }) {
    const A = Math.abs(a), s = a > 0 ? '+' : '−';
    return {
      html: `Factorise : ${big(poly(1, 2 * a, a * a))}`,
      good: { l: `(x ${s} ${A})<sup>2</sup>`, n: 'ok' },
      bads: [
        { l: `(x ${a > 0 ? '−' : '+'} ${A})<sup>2</sup>`, n: 'a', why: 'Le signe dans la parenthèse est celui du terme en x (' + (a > 0 ? '+' : '−') + 2 * A + 'x).' },
        { l: `(x ${s} ${2 * A})<sup>2</sup>`, n: 'b', why: 'Le double produit est 2 × x × ' + A + ' : le nombre dans la parenthèse est ' + A + ', pas ' + 2 * A + '.' },
        { l: `(x − ${A})(x + ${A})`, n: 'c', why: 'Ce produit donne x² − ' + A * A + ' (pas de terme en x).' },
        { l: `(x ${s} ${A * A})<sup>2</sup>`, n: 'd', why: A * A + ' est a², pas a : la parenthèse contient ' + A + '.' },
        { l: `(x ${s} ${A})(x ${s} ${2 * A})`, n: 'e', why: 'Développe : le terme constant serait ' + 2 * A * A + ', pas ' + A * A + '.' },
      ],
      hint: `Le dernier terme ${a * a} est le carré de ${A} ; vérifie que le terme en x vaut bien 2 × ${A} (avec son signe) : alors (x ± ${A})².`,
      solution: `x² ${s} ${2 * A}x + ${A * A} = x² ${s} 2 × x × ${A} + ${A}² = (x ${s} ${A})².`,
      indep: () => [1, 2, 3, 4].every(x => (x + a) * (x + a) === x * x + 2 * a * x + a * a) ? 'ok' : 'ko',
    };
  },
};
const evalue = {
  id: 'l-eval', dmin: 2, titre: 'calculer la valeur d’une expression pour une valeur de x',
  draw(d) { return { a: pick([1, 2, 3, -1, -2]), b: nzr(-5, 5), c: pick([0, 0, nzr(-6, 6)]), x: d < 3 ? ri(2, 5) : -ri(1, 5) }; },
  ex: { a: 2, b: -3, c: 0, x: -2 },
  build({ a, b, c, x }) {
    const g = a * x * x + b * x + c, w = v => String(r6(v)).replace('-', '−');
    const bads = [
      [-a * x * x + b * x + c, 'Le carré de ' + (x < 0 ? '(−' + (-x) + ')' : x) + ' est ' + x * x + ' (positif) : ' + (x < 0 ? '(−' + (-x) + ')²' : x + '²') + ' = ' + x * x + '.'],
      [a * x * x - b * x + c, 'Attention au signe du terme en x : ' + (b < 0 ? '(−' + (-b) + ')' : b) + ' × ' + (x < 0 ? '(−' + (-x) + ')' : x) + ' = ' + b * x + '.'],
      [a * 2 * x + b * x + c, 'x² n’est pas 2x : x² = x × x = ' + x * x + '.'],
      [(a * x) * (a * x) + b * x + c, 'Le carré ne porte que sur x : ' + (a === 1 ? 'x²' : a + ' × x²') + ' = ' + a + ' × ' + x * x + '.'],
      [a * x * x + b + c, 'Le terme ' + b + 'x devient ' + b + ' × ' + (x < 0 ? '(−' + (-x) + ')' : x) + '.'],
    ];
    return {
      html: `Pour x = ${x < 0 ? '−' + (-x) : x}, quelle est la valeur de ${big(poly(a, b, c))}`,
      good: { l: w(g), n: g },
      bads: bads.map(([v, y]) => ({ l: w(v), n: v, why: y })),
      hint: `Remplace x par ${Pn(x)} partout. Calcule d’abord la puissance ${Pn(x)}² = ${x * x}, puis les produits, puis additionne.`,
      solution: `x² = ${x * x}, donc ${terms([[a, 'x²']])} = ${M(a * x * x)} ; ${terms([[b, 'x']])} = ${M(b * x)}${c ? `; terme constant ${M(c)}` : ''}. Somme : ${w(g)}.`,
      indep: () => { const f = t => a * t * t + b * t + c; return f(x); },
    };
  },
};
const ecranDev = () => `<svg viewBox="0 0 300 150" class="vis" role="img" aria-label="aire d’un grand rectangle découpé en quatre"><rect x="20" y="20" width="170" height="100" fill="none" stroke="#555" stroke-width="2"/><rect x="20" y="20" width="110" height="60" fill="var(--acc)" opacity=".4"/><line x1="130" y1="20" x2="130" y2="120" stroke="#555" stroke-width="2"/><line x1="20" y1="80" x2="190" y2="80" stroke="#555" stroke-width="2"/>
<text x="75" y="55" text-anchor="middle" font-size="16">x²</text><text x="160" y="55" text-anchor="middle" font-size="16">bx</text><text x="75" y="105" text-anchor="middle" font-size="16">ax</text><text x="160" y="105" text-anchor="middle" font-size="16">ab</text>
<text x="75" y="14" text-anchor="middle" font-size="14">x</text><text x="160" y="14" text-anchor="middle" font-size="14">b</text><text x="10" y="55" text-anchor="middle" font-size="14">x</text><text x="10" y="105" text-anchor="middle" font-size="14">a</text><text x="235" y="75" font-size="14">(x + a)(x + b)</text></svg>`;
const LV7 = niveau('Calcul littéral : développer et factoriser', [devS, devD, carre(1), carre(-1), diff, factComm, factX, factDiff, factCarre, evalue], {
  n: 7, classe: '2de – 1re',
  intro: 'Développer, factoriser, reconnaître une identité remarquable : le calcul littéral doit se faire sans stylo en QCM. On repère le bon résultat en vérifiant le terme en x et le terme constant.',
  def: '<b>Distributivité</b> : k(a + b) = ka + kb. <b>Double distributivité</b> : (x + a)(x + b) = x² + (a + b)x + ab.<br><b>Identités remarquables</b> : (a + b)² = a² + 2ab + b² ; (a − b)² = a² − 2ab + b² ; (a − b)(a + b) = a² − b².',
  visuel: ecranDev(),
  methode: ['Développer : chaque terme de la 1<sup>re</sup> parenthèse multiplie chaque terme de la 2<sup>e</sup>.', 'Dans (x + a)(x + b) : coefficient de x = <b>somme</b>, terme constant = <b>produit</b>.', 'Factoriser : chercher le facteur commun, ou reconnaître x² − a², ou x² ± 2ax + a².', 'On peut <b>vérifier</b> en testant une valeur : x = 1 donne le même nombre des deux côtés.'],
  warn: ['(x + 3)² n’est pas x² + 9 : il manque le double produit 6x.', '(x − 4)(x + 4) = x² − 16 : pas de terme en x.', 'Dans (−2)² le résultat est positif ; pour −2x² avec x = 3, on calcule d’abord 3² = 9 : −2 × 9.'],
  retenir: '(a + b)² = a² + 2ab + b², (a − b)² = a² − 2ab + b², (a − b)(a + b) = a² − b².',
});

/* =================== NIVEAU 8 =================== */
const xs = x => `x = ${M(x)}`;
const eq1 = {
  id: 'q-eq1', dmin: 0, titre: 'résoudre ax + b = c',
  draw(d) { const a = d < 2 ? ri(2, 9) : nzr(-9, 9), x = d < 1 ? ri(1, 9) : nzr(-9, 9); if (a === 1) return this.draw(d); const b = nzr(-12, 12); return { a, b, x }; },
  ex: { a: 3, b: -5, x: 4 },
  build({ a, b, x }) {
    const c = a * x + b;
    const bads = [[(c + b) / a, 'Pour supprimer ' + (b < 0 ? '− ' + (-b) : '+ ' + b) + ', on ' + (b < 0 ? 'ajoute ' + (-b) : 'retranche ' + b) + ' aux deux membres : le signe est à l’envers.'], [(c - b) * a, 'Pour isoler x, il faut <b>diviser</b> par ' + a + ', pas multiplier.'], [c / a - b, 'Tu as divisé seulement ' + c + ' par ' + a + ' : on divise tout le membre (c − b) par ' + a + '.'], [-x, 'Vérifie le signe : remplace x dans l’équation.'], [x + 1, 'Vérifie ta réponse en remplaçant x dans ax + b.'], [(c - b) / a + 1, 'Vérifie ta division.']];
    return {
      html: `Résous : ${big(`${lin(a, b)} = ${M(c)}`)}`,
      good: { l: xs(x), n: x },
      bads: bads.filter(([v]) => nice2(v)).map(([v, y]) => ({ l: xs(r6(v)), n: r6(v), why: y })),
      hint: `D’abord enlève ${b < 0 ? 'le −' + (-b) : 'le +' + b} dans le membre de gauche (opération inverse des deux côtés), puis divise par ${M(a)}.`,
      solution: `${lin(a, b)} = ${M(c)} ⇒ ${M(a)}x = ${M(c)} ${b < 0 ? '+ ' + (-b) : '− ' + b} = ${M(c - b)} ⇒ x = ${M(c - b)} ÷ ${a < 0 ? '(' + M(a) + ')' : a} = ${M(x)}.`,
      indep: () => { for (let t = -30; t <= 30; t++) if (a * t + b === c) return t; return NaN; },
    };
  },
};
const eq2 = {
  id: 'q-eq2', dmin: 1, titre: 'résoudre ax + b = cx + d',
  draw() { for (;;) { const a = nzr(-8, 9), c = nzr(-8, 9), x = nzr(-9, 9), b = nzr(-9, 9); if (a !== c && Math.abs(a) !== 1 || a !== c) { const dd = a * x + b - c * x; if (Math.abs(dd) <= 40 && a !== c) return { a, b, c, d: dd, x }; } } },
  ex: { a: 5, b: 2, c: 2, d: -7, x: -3 },
  build({ a, b, c, d, x }) {
    return {
      html: `Résous : ${big(`${lin(a, b)} = ${lin(c, d)}`)}`,
      good: { l: xs(x), n: x },
      bads: [[(d + b) / (a - c), 'Pour passer ' + b + ' de l’autre côté, on le soustrait ; ' + d + ' passe avec le signe contraire : (d − b).'], [(d - b) / (a + c), 'Pour regrouper les x, on <b>soustrait</b> ' + lin(c, 0) + ' des deux côtés : a − c.'], [(b - d) / (a - c), 'Signe : x = (d − b) ÷ (a − c).'], [(d - b) / (c - a), 'Tu as retranché dans le mauvais sens au dénominateur : x = (d − b) ÷ (a − c).'], [-x, 'Remplace x dans les deux membres pour vérifier.'], [x + 1, 'Vérifie en remplaçant x dans les deux membres.'], [x - 1, 'Vérifie en remplaçant x dans les deux membres.']].filter(([v]) => nice2(v)).map(([v, y]) => ({ l: xs(r6(v)), n: r6(v), why: y })),
      hint: `Regroupe les termes en x d’un côté (retranche ${lin(c, 0)} des deux membres) et les nombres de l’autre (${M(b)} et ${M(d)}) ; puis divise par le coefficient de x obtenu (${M(a)} − ${c < 0 ? '(' + M(c) + ')' : M(c)}).`,
      solution: `${lin(a, b)} = ${lin(c, d)} ⇒ ${M(a - c)}x = ${M(d - b)} ⇒ x = ${M(d - b)} ÷ ${a - c < 0 ? '(' + M(a - c) + ')' : a - c} = ${M(x)}.`,
      indep: () => { for (let t = -40; t <= 40; t++) if (a * t + b === c * t + d) return t; return NaN; },
    };
  },
};
const REL = { lt: '&lt;', le: '≤', gt: '&gt;', ge: '≥' }, FL = { lt: 'gt', le: 'ge', gt: 'lt', ge: 'le' };
const ineq = neg => ({
  id: neg ? 'q-ineq-neg' : 'q-ineq-pos', dmin: neg ? 3 : 2, titre: neg ? 'inéquation avec un coefficient de x négatif' : 'inéquation du 1er degré',
  draw() { return { a: neg ? -ri(2, 9) : ri(2, 9), b: nzr(-9, 9), x: nzr(-8, 8), r: pick(['lt', 'le', 'gt', 'ge']) }; },
  ex: neg ? { a: -2, b: 3, x: -3, r: 'gt' } : { a: 3, b: -2, x: 4, r: 'le' },
  build({ a, b, x, r }) {
    const c = a * x + b, g = neg ? FL[r] : r, f = FL[g];
    const lab = (rel, v) => `x ${REL[rel]} ${M(v)}`;
    const bads = neg ? [[r, x, 'Quand on divise par un nombre <b>négatif</b>, le sens de l’inégalité change.'], [f, -x, 'Vérifie le signe de la solution.'], [r, -x, 'Divisé par ' + a + ' (négatif) : le sens change, et le signe de la borne aussi.'], [g, r6((c + b) / a), 'Pour supprimer ' + (b < 0 ? '− ' + (-b) : '+ ' + b) + ', on ' + (b < 0 ? 'ajoute ' + (-b) : 'retranche ' + b) + ' : signe à l’envers.']] : [[f, x, 'Le sens de l’inégalité ne change que si on multiplie ou divise par un nombre négatif : ici ' + a + ' est positif.'], [g, r6((c + b) / a), 'Pour supprimer ' + (b < 0 ? '− ' + (-b) : '+ ' + b) + ', on ' + (b < 0 ? 'ajoute ' + (-b) : 'retranche ' + b) + ' : signe à l’envers.'], [f, r6((c + b) / a), 'Sens et signe à vérifier.'], [g, -x, 'Vérifie le signe de la borne.'], [g, r6(c - b) * a, 'On divise par ' + a + ', on ne multiplie pas.']];
    bads.push([g, x + 1, 'Vérifie la borne en testant une valeur dans ton intervalle.'], [f, x - 1, 'Vérifie la borne et le sens en testant une valeur.']);
    return {
      html: `Quelle est la solution de l’inéquation : ${big(`${lin(a, b)} ${REL[r]} ${M(c)}`)}`,
      good: { l: lab(g, x), n: `${g}|${x}` },
      bads: bads.filter(([, v]) => nice2(v)).map(([rel, v, y]) => ({ l: lab(rel, r6(v)), n: `${rel}|${r6(v)}`, why: y })),
      hint: neg ? `Résous comme une équation, mais attention : tu vas diviser par ${M(a)}, un nombre <b>négatif</b>. Que se passe-t-il alors avec le sens ${REL[r]} ?` : `Résous comme une équation : enlève ${b < 0 ? 'le −' + (-b) : 'le +' + b}, puis divise par ${a} (positif : le sens ${REL[r]} ne change pas).`,
      solution: `${lin(a, b)} ${REL[r]} ${M(c)} ⇒ ${M(a)}x ${REL[r]} ${M(c - b)} ⇒ x ${REL[g]} ${M(c - b)} ÷ ${a < 0 ? '(' + M(a) + ')' : a} = ${M(x)}${neg ? ' (on divise par un négatif : le sens change)' : ''}.`,
      indep: () => {
        const sat = t => ({ lt: a * t + b < c, le: a * t + b <= c, gt: a * t + b > c, ge: a * t + b >= c })[r];
        const holds = t => ({ lt: t < x, le: t <= x, gt: t > x, ge: t >= x })[g];
        let ok = true; for (let t = -40; t <= 40; t += 0.5) if (sat(t) !== holds(t)) ok = false;
        return ok ? `${g}|${x}` : 'ko';
      },
    };
  },
});
const POOL = [
  { f: 'v = d ÷ t', unk: 't', good: 't = d ÷ v', bads: [['t = v ÷ d', 'Tu as inversé le quotient.'], ['t = d × v', 'Tu as multiplié au lieu de diviser.'], ['t = v − d', 'Ce n’est pas une soustraction : v = d ÷ t.']], make: () => { const d = ri(2, 9) * 10, t = ri(2, 5); return { d, t, v: d / t }; }, fn: v => v.d / v.v },
  { f: 'v = d ÷ t', unk: 'd', good: 'd = v × t', bads: [['d = v ÷ t', 'Tu as divisé au lieu de multiplier : d = v × t.'], ['d = t ÷ v', 'Tu as inversé le quotient.'], ['d = v + t', 'On multiplie les deux membres par t, on n’additionne pas.']], make: () => { const v = ri(2, 9) * 10, t = ri(2, 5); return { v, t, d: v * t }; }, fn: v => v.v * v.t },
  { f: 'U = R × I', unk: 'I', good: 'I = U ÷ R', bads: [['I = U × R', 'Pour isoler I, on divise par R (opération inverse).'], ['I = R ÷ U', 'Tu as inversé le quotient.'], ['I = U − R', 'R est un facteur : on le fait passer en diviseur.']], make: () => { const R = ri(2, 9), I = ri(2, 9); return { R, I, U: R * I }; }, fn: v => v.U / v.R },
  { f: 'U = R × I', unk: 'R', good: 'R = U ÷ I', bads: [['R = U × I', 'Pour isoler R, on divise par I.'], ['R = I ÷ U', 'Tu as inversé le quotient.'], ['R = U − I', 'I est un facteur : on le fait passer en diviseur.']], make: () => { const R = ri(2, 9), I = ri(2, 9); return { R, I, U: R * I }; }, fn: v => v.U / v.I },
  { f: 'P = U × I', unk: 'U', good: 'U = P ÷ I', bads: [['U = P × I', 'Pour isoler U, on divise par I.'], ['U = I ÷ P', 'Tu as inversé le quotient.'], ['U = P − I', 'I est un facteur : on divise.']], make: () => { const U = ri(2, 9), I = ri(2, 9); return { U, I, P: U * I }; }, fn: v => v.P / v.I },
  { f: 'F = m × a', unk: 'a', good: 'a = F ÷ m', bads: [['a = F × m', 'Pour isoler a, on divise par m.'], ['a = m ÷ F', 'Tu as inversé le quotient.'], ['a = F − m', 'm est un facteur : on divise.']], make: () => { const m = ri(2, 9), a = ri(2, 9); return { m, a, F: m * a }; }, fn: v => v.F / v.m },
  { f: 'F = m × a', unk: 'm', good: 'm = F ÷ a', bads: [['m = F × a', 'Pour isoler m, on divise par a.'], ['m = a ÷ F', 'Tu as inversé le quotient.'], ['m = F − a', 'a est un facteur : on divise.']], make: () => { const m = ri(2, 9), a = ri(2, 9); return { m, a, F: m * a }; }, fn: v => v.F / v.a },
  { f: 'A = ' + F('b × h', 2), unk: 'h', good: 'h = ' + F('2A', 'b'), bads: [['h = ' + F('A', 'b'), 'Tu as oublié le facteur 2 : on multiplie d’abord les deux membres par 2.'], ['h = ' + F('A', '2b'), 'Le 2 est au dénominateur dans la formule : il passe au numérateur.'], ['h = 2Ab', 'b est un facteur : il passe en <b>diviseur</b>.']], make: () => { const b = ri(2, 9), h = ri(2, 9) * 2; return { b, h, A: b * h / 2 }; }, fn: v => 2 * v.A / v.b },
  { f: 'A = ' + F('b × h', 2), unk: 'b', good: 'b = ' + F('2A', 'h'), bads: [['b = ' + F('A', 'h'), 'Tu as oublié le facteur 2 : on multiplie d’abord les deux membres par 2.'], ['b = ' + F('A', '2h'), 'Le 2 est au dénominateur dans la formule : il passe au numérateur.'], ['b = 2Ah', 'h est un facteur : il passe en <b>diviseur</b>.']], make: () => { const h = ri(2, 9), b = ri(2, 9) * 2; return { b, h, A: b * h / 2 }; }, fn: v => 2 * v.A / v.h },
  { f: 'P = 2(L + l)', unk: 'L', good: 'L = ' + F('P', 2) + ' − l', bads: [['L = ' + F('P − l', 2), 'Le 2 divise <b>tout</b> le périmètre, mais l n’est pas divisé : L = P ÷ 2 − l.'], ['L = ' + F('P', 2) + ' + l', 'Pour isoler L, on <b>retranche</b> l.'], ['L = P − 2l', 'On divise d’abord P par 2 : P ÷ 2 − l (et pas P − 2l).']], make: () => { const L = ri(5, 15), l = ri(2, 9); return { L, l, P: 2 * (L + l) }; }, fn: v => v.P / 2 - v.l },
  { f: 'V = ' + F('B × h', 3), unk: 'h', good: 'h = ' + F('3V', 'B'), bads: [['h = ' + F('V', '3B'), 'Le 3 passe au numérateur (on multiplie par 3).'], ['h = ' + F('V × B', 3), 'B est un facteur : il passe en <b>diviseur</b>.'], ['h = ' + F('V', 'B'), 'Tu as oublié de multiplier par 3.']], make: () => { const B = ri(2, 9), h = ri(1, 6) * 3; return { B, h, V: B * h / 3 }; }, fn: v => 3 * v.V / v.B },
  { f: 'E = ' + F(1, 2) + ' m v²', unk: 'm', good: 'm = ' + F('2E', 'v²'), bads: [['m = ' + F('E', '2v²'), 'Le facteur 1/2 devient 2 en haut (on multiplie par 2).'], ['m = ' + F('2E', 'v'), 'C’est v² (et non v) qui divise.'], ['m = 2Ev²', 'v² est un facteur de m : il passe en diviseur.']], make: () => { const m = ri(2, 9) * 2, v = ri(2, 6); return { m, v, E: m * v * v / 2 }; }, fn: v => 2 * v.E / (v.v * v.v) },
  { f: 'y = ax + b', unk: 'x', good: 'x = ' + F('y − b', 'a'), bads: [['x = y − ' + F('b', 'a'), 'On divise <b>tout</b> le membre (y − b), pas seulement b.'], ['x = ' + F('y + b', 'a'), 'Pour enlever + b, on <b>soustrait</b> b.'], ['x = a(y − b)', 'a est un facteur : on divise par a.']], make: () => { const a = ri(2, 9), b = ri(1, 9), x = ri(2, 9); return { a, b, x, y: a * x + b }; }, fn: v => (v.y - v.b) / v.a },
  { f: 'C = 2πr', unk: 'r', good: 'r = ' + F('C', '2π'), bads: [['r = ' + F('C', 'π'), 'Tu as oublié le 2 : C = 2 × π × r.'], ['r = ' + F('2π', 'C'), 'Tu as inversé le quotient.'], ['r = 2πC', 'Pour isoler r, on divise par 2π.']], make: () => { const r = ri(2, 9); return { r, C: 2 * Math.PI * r }; }, fn: v => v.C / (2 * Math.PI) },
  { f: 'T = HT × (1 + t)', unk: 'HT', good: 'HT = ' + F('T', '1 + t'), bads: [['HT = T − (1 + t)', 'On divise par (1 + t), on ne le soustrait pas.'], ['HT = T × (1 + t)', 'Pour revenir au prix hors taxes, on divise.'], ['HT = ' + F('T', 't'), 'Il faut diviser par (1 + t), pas par t.']], make: () => { const HT = ri(2, 9) * 10, t = pick([0.1, 0.2, 0.25, 0.5]); return { HT, t, T: HT * (1 + t) }; }, fn: v => v.T / (1 + v.t) },
  { f: 'S = ' + F('(a + b) × h', 2), unk: 'h', good: 'h = ' + F('2S', 'a + b'), bads: [['h = ' + F('S', 'a + b'), 'Tu as oublié le facteur 2.'], ['h = ' + F('2S', 'a') + ' + b', 'Le facteur (a + b) divise toute la quantité 2S.'], ['h = 2S − (a + b)', '(a + b) est un facteur : on divise.']], make: () => { const a = ri(2, 9), b = ri(2, 9), h = ri(1, 6) * 2; return { a, b, h, S: (a + b) * h / 2 }; }, fn: v => 2 * v.S / (v.a + v.b) },
];
const isoler = {
  id: 'q-iso', dmin: 2, titre: 'isoler une lettre dans une formule',
  draw() { return { i: ri(0, POOL.length - 1) }; },
  ex: { i: 7 },
  build({ i }) {
    const e = POOL[i];
    return {
      html: `Dans la formule ${big(e.f)}exprime <b>${e.unk}</b> en fonction des autres lettres.`,
      good: { l: e.good, n: 'ok' },
      bads: e.bads.map(([l, y]) => ({ l, n: l, why: y })),
      hint: `Dans ${strip(e.f)}, quelle opération est appliquée à ${e.unk} ? Fais l’opération <b>inverse</b> des deux côtés, dans l’ordre inverse des opérations.`,
      solution: `On isole ${e.unk} par des opérations inverses sur les deux membres de ${e.f} : on obtient <b>${e.good}</b>.`,
      indep: () => { const v = e.make(); return Math.abs(e.fn(v) - v[e.unk]) < 1e-9 ? 'ok' : 'ko'; },
    };
  },
};
const APPS = [
  { f: 'v = d ÷ t', tg: 'v', g: () => { const t = ri(2, 5), v = ri(3, 12) * 10; return { given: `d = ${v * t} km et t = ${t} h`, unit: 'km/h', ans: v, bads: [v * t * t, v * t + t, r6(t / (v * t))], hint: `v = d ÷ t = ${v * t} ÷ ${t}` }; } },
  { f: 'U = R × I', tg: 'U', g: () => { const R = ri(2, 9), I = ri(2, 6); return { given: `R = ${R} Ω et I = ${I} A`, unit: 'V', ans: R * I, bads: [R + I, r6(R / I), R * I * I], hint: `U = ${R} × ${I}` }; } },
  { f: 'U = R × I', unk: 'I', tg: 'I', g: () => { const R = ri(2, 9), I = ri(2, 6); return { given: `U = ${R * I} V et R = ${R} Ω`, unit: 'A, valeur de I', ans: I, bads: [R * I * R, R * I - R, r6(R / (R * I))], hint: `I = U ÷ R = ${R * I} ÷ ${R}` }; } },
  { f: 'A = ' + F('b × h', 2), tg: 'A', g: () => { const b = ri(3, 12), h = ri(1, 6) * 2; return { given: `b = ${b} cm et h = ${h} cm`, unit: 'cm², valeur de A', ans: b * h / 2, bads: [b * h, b + h, b * h / 2 + b], hint: `A = ${b} × ${h} ÷ 2` }; } },
  { f: 'P = U × I', tg: 'P', g: () => { const U = pick([6, 12, 24, 230]), I = ri(2, 5); return { given: `U = ${U} V et I = ${I} A`, unit: 'W, valeur de P', ans: U * I, bads: [U + I, r6(U / I), U * I * I], hint: `P = ${U} × ${I}` }; } },
  { f: 'E = ' + F(1, 2) + ' m v²', tg: 'E', g: () => { const m = ri(1, 5) * 2, v = ri(2, 6); return { given: `m = ${m} kg et v = ${v} m/s`, unit: 'J, valeur de E', ans: m * v * v / 2, bads: [m * v / 2, m * v * v, (m * v / 2) * (m * v / 2)], hint: `E = ½ × ${m} × ${v}²` }; } },
  { f: 'T = HT × (1 + t)', tg: 'T', g: () => { const HT = ri(2, 9) * 10, t = pick([0.1, 0.2, 0.25, 0.5]); return { given: `HT = ${HT} € et t = ${dec(t)}`, unit: '€, valeur de T', ans: HT * (1 + t), bads: [HT * t, HT + t, HT * t * 10 + HT], hint: `T = HT × (1 + t) = ${HT} × ${dec(1 + t)}` }; } },
  { f: 'F = m × a', tg: 'F', g: () => { const m = ri(2, 9), a = ri(2, 6); return { given: `m = ${m} kg et a = ${a} m/s²`, unit: 'N, valeur de F', ans: m * a, bads: [m + a, r6(m / a), m * a * a], hint: `F = ${m} × ${a}` }; } },
];
const appNum = {
  id: 'q-app', dmin: 4, titre: 'application numérique d’une formule',
  draw() { const e = ri(0, APPS.length - 1); return { e, p: ri(1, 1e6) }; },
  ex: { e: 6, p: 11 },
  build({ e, p }) {
    // les nombres sont tirés avec une graine locale dérivée de p, pour que build soit déterministe (cours)
    const saved = [];
    const A = APPS[e], g = A.g();
    const lab = x => `${dec(Math.round(x * 100) / 100)} ${g.unit.split(',')[0]}`;
    return {
      html: `Avec la formule ${big(A.f)}calcule <b>${A.tg}</b> pour ${g.given}.`,
      good: { l: lab(g.ans), n: r6(g.ans) },
      bads: g.bads.map((v, i) => ({ l: lab(v), n: r6(v), why: i === 0 ? 'Vérifie l’opération : relis la formule.' : 'Remplace les lettres par les valeurs données et respecte les priorités opératoires.' })),
      hint: `Remplace les lettres par leurs valeurs dans la formule : ${g.hint}. Attention à l’ordre des opérations.`,
      solution: `${g.hint} = ${dec(r6(g.ans))} ${g.unit.split(',')[0]}.`,
      indep: () => r6(g.ans),
    };
  },
};
const LV8 = niveau('Équations, inéquations et formules', [eq1, eq2, ineq(false), ineq(true), isoler, appNum], {
  n: 8, classe: '2de – 1re',
  intro: 'Résoudre une équation ou une inéquation du 1er degré et isoler une lettre dans une formule reviennent au même : on défait les opérations dans l’ordre inverse.',
  def: 'On garde une équation vraie en faisant la <b>même opération des deux côtés</b>. Pour une <b>inéquation</b>, c’est pareil, sauf qu’on <b>change le sens</b> quand on multiplie ou divise par un nombre <b>négatif</b>.',
  visuel: '',
  methode: ['Enlève d’abord les termes ajoutés (opération inverse), puis divise par le coefficient de x.', 'Avec x des deux côtés : regroupe les x d’un côté, les nombres de l’autre.', 'Inéquation : même méthode ; divisé par un négatif → sens inversé.', 'Formule : repère l’opération appliquée à la lettre, fais l’inverse des deux côtés.', 'Application numérique : remplace les lettres par les valeurs, avec l’unité.'],
  warn: ['−2x &gt; 6 donne x &lt; −3 (le sens change).', 'Dans x = (y − b) ÷ a, on divise <b>tout</b> y − b par a.', 'Vérifie une équation en remplaçant x : le résultat doit être le bon.'],
  retenir: 'on fait la même opération des deux côtés ; diviser par un négatif inverse l’inégalité.',
});

export { LV7, LV8 };

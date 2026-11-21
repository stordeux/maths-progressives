// Niveaux 1 et 2 : fractions ; puissances et écriture scientifique.
import { ri, pick, shuffle, M, F, big, sup, ent, dec, fr, Fr, Fx, gcd, niveau } from './outils.js';
import { lcm } from '../../engine/util/arith.js';

const val = (n, d) => n / d;

/* =================== NIVEAU 1 : fractions =================== */
const add = {
  id: 'f-add', dmin: 0, titre: 'additionner deux fractions',
  draw(d) {
    for (;;) {
      let b, c2, a, c;
      if (d < 2) { b = pick([2, 3, 4, 5, 6]); c2 = b * pick([2, 3]); }
      else { b = pick([2, 3, 4, 5, 6, 8]); c2 = pick([2, 3, 4, 5, 6, 8, 9]); if (c2 === b || lcm(b, c2) > 30) continue; }
      if (lcm(b, c2) > 24) continue;
      a = ri(1, b - 1); c = ri(1, c2 - 1);
      const L = lcm(b, c2), num = a * (L / b) + c * (L / c2);
      if (fr(num, L).d === 1) continue;
      return { a, b, c, d: c2 };
    }
  },
  ex: { a: 1, b: 4, c: 5, d: 8 },
  build({ a, b, c, d }) {
    const L = lcm(b, d), na = a * (L / b), nc = c * (L / d), num = na + nc;
    const bads = [
      { l: Fr(a + c, b + d), n: val(a + c, b + d), why: 'Tu as additionné les numérateurs <b>et</b> les dénominateurs. Pour additionner, on met d’abord les fractions au même dénominateur.' },
      { l: Fr(a + c, b * d), n: val(a + c, b * d), why: 'Tu as multiplié les dénominateurs, mais les numérateurs n’ont pas été changés : ils doivent suivre le même calcul.' },
      { l: Fr(a * c, b * d), n: val(a * c, b * d), why: 'Tu as multiplié au lieu d’additionner.' },
      { l: Fr(a + c, Math.min(b, d)), n: val(a + c, Math.min(b, d)), why: 'Tu as gardé le plus petit dénominateur sans transformer l’autre fraction.' },
      { l: Fr(a + c, Math.max(b, d)), n: val(a + c, Math.max(b, d)), why: 'Tu as gardé le plus grand dénominateur sans transformer l’autre fraction.' },
    ];
    return {
      html: `Calcule : ${big(`${Fx(a, b)} + ${Fx(c, d)}`)}`,
      good: { l: Fr(num, L), n: val(num, L) }, bads,
      hint: `Le plus petit multiple commun de ${b} et ${d} est ${L} : écris ${Fx(a, b)} et ${Fx(c, d)} avec le dénominateur ${L}, puis additionne seulement les numérateurs.`,
      solution: `${Fx(a, b)} = ${Fx(na, L)} et ${Fx(c, d)} = ${Fx(nc, L)}. Donc ${Fx(na, L)} + ${Fx(nc, L)} = ${Fx(num, L)}${fr(num, L).d !== L ? ' = ' + Fr(num, L) : ''}.`,
      indep: () => a / b + c / d,
    };
  },
};
const mul = {
  id: 'f-mul', dmin: 0, titre: 'multiplier deux fractions',
  draw() {
    for (;;) {
      const b = ri(2, 9), d = ri(2, 9), a = ri(1, 9), c = ri(1, 9);
      if (a === b || c === d || fr(a * c, b * d).d === 1) continue;
      return { a, b, c, d };
    }
  },
  ex: { a: 3, b: 4, c: 2, d: 9 },
  build({ a, b, c, d }) {
    const bads = [
      { l: Fr(a * d, b * c), n: val(a * d, b * c), why: 'Tu as divisé : pour multiplier, on ne retourne pas la deuxième fraction.' },
      { l: Fr(a + c, b + d), n: val(a + c, b + d), why: 'Tu as additionné en haut et en bas. Pour multiplier : numérateur × numérateur, dénominateur × dénominateur.' },
      { l: Fr(a * c, b + d), n: val(a * c, b + d), why: 'Tu as multiplié les numérateurs, mais les dénominateurs se multiplient aussi.' },
      { l: Fr(a * d + b * c, b * d), n: val(a * d + b * c, b * d), why: 'C’est la formule de l’addition (produits en croix) ; ici on multiplie.' },
      { l: Fr(a * c, b), n: val(a * c, b), why: 'Tu as oublié de multiplier le dénominateur de la deuxième fraction.' },
    ];
    const num = a * c, den = b * d, g = gcd(num, den);
    return {
      html: `Calcule : ${big(`${Fx(a, b)} × ${Fx(c, d)}`)}`,
      good: { l: Fr(num, den), n: val(num, den) }, bads,
      hint: `Multiplie ${a} par ${c} au numérateur et ${b} par ${d} au dénominateur, puis simplifie${g > 1 ? ` (ici ${num} et ${den} ont un facteur commun)` : ''}.`,
      solution: `${Fx(a, b)} × ${Fx(c, d)} = ${Fx(num, den)}${g > 1 ? ' = ' + Fr(num, den) : ''}.`,
      indep: () => (a / b) * (c / d),
    };
  },
};
const cmp = {
  id: 'f-cmp', dmin: 1, titre: 'trouver la plus grande de quatre fractions',
  draw() {
    for (;;) {
      const L = [];
      while (L.length < 4) {
        const b = ri(2, 12), a = ri(1, Math.floor(b * 1.5));
        if (a !== b && gcd(a, b) === 1 && !L.some(x => x[1] === b || x[0] === a)) L.push([a, b]);
      }
      const v = L.map(x => x[0] / x[1]).sort((p, q) => p - q);
      if (v.every((x, i) => i === 0 || x - v[i - 1] > 0.045)) return { L };
    }
  },
  ex: { L: [[2, 3], [3, 8], [5, 6], [4, 9]] },
  build({ L }) {
    const v = L.map(x => x[0] / x[1]), k = v.indexOf(Math.max(...v));
    const maxNum = Math.max(...L.map(x => x[0])), maxDen = Math.max(...L.map(x => x[1]));
    const lab = x => Fr(x[0], x[1]);
    const bads = L.map((x, i) => i === k ? null : {
      l: lab(x), n: v[i],
      why: x[0] === maxNum ? 'Tu as choisi le plus grand numérateur, mais les parts n’ont pas la même taille.' : x[1] === maxDen ? 'Tu as choisi le plus grand dénominateur : plus on découpe en parts, plus chaque part est petite.' : 'Compare-les en les écrivant avec le même dénominateur ou en décimaux.',
    }).filter(Boolean);
    const [p, q] = L[0], [r, s] = L[1], D = lcm(q, s);
    return {
      html: `Quelle est la plus grande de ces quatre fractions ?${big(L.map(lab).join(' ; '))}`,
      good: { l: lab(L[k]), n: v[k] }, bads,
      hint: `Compare d’abord ${lab(L[0])} et ${lab(L[1])} en les mettant au dénominateur ${D}, garde la plus grande, puis compare-la aux deux autres (repère : 1/2 et 1).`,
      solution: `En décimaux : ${L.map(x => `${lab(x)} ≈ ${M(Math.round(x[0] / x[1] * 100) / 100)}`).join(' ; ')}. La plus grande est ${lab(L[k])}.`,
      indep: () => Math.max(...L.map(x => x[0] / x[1])),
    };
  },
};
const div = {
  id: 'f-div', dmin: 2, titre: 'diviser par une fraction',
  draw() {
    for (;;) {
      const a = ri(1, 8), b = ri(2, 9), c = ri(1, 8), d = ri(2, 9);
      if (a === b || c === d || fr(a * d, b * c).d === 1 || a * d === b * c) continue;
      return { a, b, c, d };
    }
  },
  ex: { a: 2, b: 5, c: 3, d: 4 },
  build({ a, b, c, d }) {
    const bads = [
      { l: Fr(a * c, b * d), n: val(a * c, b * d), why: 'Tu as multiplié sans retourner la deuxième fraction.' },
      { l: Fr(b * c, a * d), n: val(b * c, a * d), why: 'Tu as retourné la première fraction au lieu de la deuxième.' },
      { l: Fr(a * d, b + c), n: val(a * d, b + c), why: 'Au dénominateur, il faut multiplier ' + b + ' par ' + c + ', pas les additionner.' },
      { l: Fr(a * d + b * c, b * c), n: val(a * d + b * c, b * c), why: 'Diviser par une fraction, c’est multiplier par son inverse : pas d’addition ici.' },
    ];
    const num = a * d, den = b * c, g = gcd(num, den);
    return {
      html: `Calcule : ${big(`${Fx(a, b)} ÷ ${Fx(c, d)}`)}`,
      good: { l: Fr(num, den), n: val(num, den) }, bads,
      hint: `Diviser par ${Fx(c, d)}, c’est multiplier par son inverse ${Fx(d, c)}.`,
      solution: `${Fx(a, b)} ÷ ${Fx(c, d)} = ${Fx(a, b)} × ${Fx(d, c)} = ${Fx(num, den)}${g > 1 ? ' = ' + Fr(num, den) : ''}.`,
      indep: () => (a / b) / (c / d),
    };
  },
};
const of = {
  id: 'f-of', dmin: 3, titre: 'prendre une fraction d’une quantité',
  draw() {
    const q = pick([3, 4, 5, 6, 8, 10]), p = ri(1, q - 1), N = q * ri(2, 12);
    return { p, q, N, u: pick([['€', 'une somme de'], ['km', 'un trajet de'], ['élèves', 'une classe de'], ['g', 'une masse de']]) };
  },
  ex: { p: 3, q: 4, N: 36, u: ['élèves', 'une classe de'] },
  build({ p, q, N, u }) {
    const t = N / q, g = t * p;
    const un = n => `${dec(n)} ${u[0]}`;
    return {
      html: `Combien valent les ${Fx(p, q)} d’${u[1]} ${ent(N)} ${u[0]} ?`,
      good: { l: un(g), n: g },
      bads: [
        { l: un(t), n: t, why: `Tu as trouvé 1 part (${ent(N)} ÷ ${q}), mais il faut en prendre ${p}.` },
        { l: un(N * p), n: N * p, why: 'Tu as multiplié par le numérateur sans diviser par le dénominateur.' },
        { l: un(N / p * q), n: N / p * q, why: 'Tu as inversé la fraction : « les ' + p + '/' + q + ' de » se calcule avec ' + N + ' ÷ ' + q + ' × ' + p + '.' },
        { l: un(N - g), n: N - g, why: 'Tu as calculé ce qui reste, pas la fraction demandée.' },
      ],
      hint: `Partage ${ent(N)} en ${q} parts égales (calcule une part), puis prends-en ${p}.`,
      solution: `${ent(N)} ÷ ${q} = ${ent(t)} (une part) ; ${ent(t)} × ${p} = ${ent(g)}. Réponse : ${un(g)}.`,
      indep: () => N * (p / q),
    };
  },
};
const subInt = {
  id: 'f-sub', dmin: 4, titre: 'soustraire une fraction à un entier',
  draw() { const b = pick([2, 3, 4, 5, 6, 8]); return { n: ri(1, 3), a: ri(1, b - 1), b }; },
  ex: { n: 2, a: 3, b: 4 },
  build({ n, a, b }) {
    const num = n * b - a;
    return {
      html: `Calcule : ${big(`${n} − ${Fx(a, b)}`)}`,
      good: { l: Fr(num, b), n: val(num, b) },
      bads: [
        { l: Fr(n - a, b), n: val(n - a, b), why: `Tu as retranché ${a} de ${n} (le numérateur seul) : ${n} n’est pas écrit en ${b}<sup>e</sup>.` },
        { l: Fr(n * b + a, b), n: val(n * b + a, b), why: 'Tu as additionné au lieu de soustraire.' },
        { l: Fr(n * a, b), n: val(n * a, b), why: 'Tu as multiplié au lieu de soustraire.' },
        { l: Fr(num, n * b), n: val(num, n * b), why: `Le dénominateur reste ${b} (on ne le multiplie pas par ${n}).` },
      ],
      hint: `Écris ${n} avec le dénominateur ${b} (${n} = ${Fx(n * b, b)}), puis soustrais ${a} au numérateur.`,
      solution: `${n} = ${Fx(n * b, b)}, donc ${Fx(n * b, b)} − ${Fx(a, b)} = ${Fx(num, b)}${fr(num, b).d !== b ? ' = ' + Fr(num, b) : ''}.`,
      indep: () => n - a / b,
    };
  },
};

const barre = () => {
  const w = 360, cell = w / 12;
  let s = `<svg viewBox="0 0 ${w + 20} 70" class="vis" role="img" aria-label="trois quarts et six huitièmes">`;
  s += `<rect x="10" y="8" width="${w}" height="22" fill="none" stroke="#555" stroke-width="2"/>`;
  s += `<rect x="10" y="8" width="${w * 3 / 4}" height="22" fill="var(--acc)" opacity=".55"/>`;
  for (let i = 1; i < 4; i++) s += `<line x1="${10 + w * i / 4}" y1="8" x2="${10 + w * i / 4}" y2="30" stroke="#555" stroke-width="2"/>`;
  s += `<rect x="10" y="40" width="${w}" height="22" fill="none" stroke="#555" stroke-width="2"/><rect x="10" y="40" width="${w * 6 / 8}" height="22" fill="var(--acc)" opacity=".55"/>`;
  for (let i = 1; i < 8; i++) s += `<line x1="${10 + w * i / 8}" y1="40" x2="${10 + w * i / 8}" y2="62" stroke="#555" stroke-width="1.5"/>`;
  return s + `</svg>`;
};
const LV1 = niveau('Fractions : opérations et comparaisons', [add, mul, cmp, div, of, subInt], {
  n: 1, classe: '2de – 1re',
  intro: 'Sans calculatrice, les fractions doivent devenir un réflexe : additionner, multiplier, comparer, prendre une fraction d’une quantité.',
  def: 'Une fraction ' + F('a', 'b') + ' représente a parts égales sur b. Deux fractions sont égales si on passe de l’une à l’autre en multipliant (ou en divisant) le haut et le bas par le même nombre : ' + F(3, 4) + ' = ' + F(6, 8) + '.',
  visuel: barre(),
  methode: [
    '<b>Additionner / soustraire</b> : même dénominateur d’abord, puis on opère sur les numérateurs seuls.',
    '<b>Multiplier</b> : numérateur × numérateur, dénominateur × dénominateur, puis on simplifie.',
    '<b>Diviser</b> par une fraction : on multiplie par son inverse.',
    '<b>Comparer</b> : même dénominateur, ou repères (1/2, 1) ou écriture décimale.',
    '<b>Fraction d’une quantité</b> : on divise par le dénominateur, puis on multiplie par le numérateur.',
  ],
  warn: ['On n’additionne <b>jamais</b> les dénominateurs : ' + F(1, 2) + ' + ' + F(1, 3) + ' n’est pas ' + F(2, 5) + '.', 'Une fraction au dénominateur plus grand n’est pas plus grande : ' + F(1, 8) + ' &lt; ' + F(1, 3) + '.', 'Pour un QCM, simplifie ta réponse : les choix sont donnés sous forme irréductible.'],
  retenir: 'même dénominateur pour additionner, « haut × haut, bas × bas » pour multiplier, « inverse » pour diviser.',
});

/* =================== NIVEAU 2 : puissances et écriture scientifique =================== */
const P = (b, e) => sup(b, e);
const num = (b, e) => Math.pow(b, e);
const prodPow = {
  id: 'p-prod', dmin: 0, titre: 'produit de puissances de même base',
  draw() { const a = pick([2, 3, 5, 10, 10, 7]); return { a, m: ri(2, 9), n: ri(2, 9) }; },
  ex: { a: 2, m: 3, n: 4 },
  build({ a, m, n }) {
    return {
      html: `Écris sous la forme d’une seule puissance : ${big(`${P(a, m)} × ${P(a, n)}`)}`,
      good: { l: P(a, m + n), n: num(a, m + n) },
      bads: [
        { l: P(a, m * n), n: num(a, m * n), why: 'Tu as multiplié les exposants. Pour un produit de même base, on les additionne.' },
        { l: P(a * a, m + n), n: num(a * a, m + n), why: 'Tu as multiplié les bases : la base ne change pas.' },
        { l: P(a, Math.abs(m - n) || 1), n: num(a, Math.abs(m - n) || 1), why: 'Tu as soustrait les exposants (c’est pour un quotient).' },
        { l: P(a, m + n + 1), n: num(a, m + n + 1), why: 'Compte bien : l’exposant est la somme exacte, ' + m + ' + ' + n + '.' },
      ],
      hint: `La base ${a} reste la même ; que fait-on des exposants ${m} et ${n} ? Teste avec ${P(a, 1)} × ${P(a, 1)} = ${a} × ${a} = ${P(a, 2)} : 1 et 1 donnent 2.`,
      solution: `${P(a, m)} × ${P(a, n)} : on garde la base ${a} et on additionne les exposants : ${m} + ${n} = ${m + n}. Donc ${P(a, m + n)}.`,
      indep: () => Math.pow(a, m) * Math.pow(a, n),
    };
  },
};
const quotPow = {
  id: 'p-quot', dmin: 0, titre: 'quotient de puissances de même base',
  draw() { const a = pick([2, 3, 5, 10, 10, 7]); const n = ri(2, 6); return { a, m: n + ri(2, 6), n }; },
  ex: { a: 10, m: 7, n: 3 },
  build({ a, m, n }) {
    return {
      html: `Écris sous la forme d’une seule puissance : ${big(F(P(a, m), P(a, n)))}`,
      good: { l: P(a, m - n), n: num(a, m - n) },
      bads: [
        { l: P(a, m + n), n: num(a, m + n), why: 'Tu as additionné les exposants (c’est pour un produit).' },
        { l: P(a, n - m), n: num(a, n - m), why: 'Tu as soustrait dans le mauvais sens : exposant du haut − exposant du bas.' },
        { l: P(a, m * n), n: num(a, m * n), why: 'Tu as multiplié les exposants.' },
        { l: '1', n: 1, why: 'Les bases sont égales, mais cela ne fait pas 1 : seuls les exposants se combinent.' },
        { l: P(a, Math.round(m / n) === m / n ? m / n : m - n - 1), n: num(a, Math.round(m / n) === m / n ? m / n : m - n - 1), why: 'Tu as divisé les exposants. On les soustrait.' },
      ],
      hint: `Même base ${a} en haut et en bas : que devient la différence entre l’exposant ${m} et l’exposant ${n} ? Test : ${P(a, 2)} ÷ ${P(a, 1)} = ${a * a} ÷ ${a} = ${a}.`,
      solution: `On garde la base ${a} et on soustrait les exposants : ${m} − ${n} = ${m - n}. Donc ${P(a, m - n)}.`,
      indep: () => Math.pow(a, m) / Math.pow(a, n),
    };
  },
};
const powPow = {
  id: 'p-pp', dmin: 1, titre: 'puissance d’une puissance',
  draw() { for (;;) { const m = ri(2, 5), n = ri(2, 5); if (m !== n) return { a: pick([2, 3, 10]), m, n }; } },
  ex: { a: 10, m: 3, n: 4 },
  build({ a, m, n }) {
    return {
      html: `Écris sous la forme d’une seule puissance : ${big(`(${P(a, m)})<sup>${n}</sup>`)}`,
      good: { l: P(a, m * n), n: num(a, m * n) },
      bads: [
        { l: P(a, m + n), n: num(a, m + n), why: 'Tu as additionné les exposants (c’est pour un produit de puissances).' },
        { l: P(a, Math.pow(m, n)), n: num(a, Math.pow(m, n)), why: `Tu as calculé ${m}<sup>${n}</sup> au lieu de ${m} × ${n}.` },
        { l: P(a, Math.pow(n, m)), n: num(a, Math.pow(n, m)), why: 'Tu as élevé l’exposant à une puissance.' },
        { l: P(a, m - n), n: num(a, m - n), why: 'Tu as soustrait les exposants.' },
      ],
      hint: `(${P(a, m)})<sup>${n}</sup> veut dire ${P(a, m)} multiplié ${n} fois par lui-même : combien de facteurs ${a} au total ? Test : (${P(a, 2)})<sup>2</sup> = ${a * a} × ${a * a} = ${P(a, 4)}.`,
      solution: `(${P(a, m)})<sup>${n}</sup> = ${P(a, m)} × … × ${P(a, m)} (${n} fois) : il y a ${m} × ${n} = ${m * n} facteurs ${a}. Donc ${P(a, m * n)}.`,
      indep: () => Math.pow(Math.pow(a, m), n),
    };
  },
};
const neg10 = {
  id: 'p-neg10', dmin: 1, titre: 'puissance négative de 10',
  draw() { return { n: ri(1, 5) }; },
  ex: { n: 3 },
  build({ n }) {
    const dd = k => dec(Math.pow(10, k));
    const w = k => (k >= 0 ? ent(Math.pow(10, k)) : '0,' + '0'.repeat(-k - 1) + '1');
    return {
      html: `Écris sous forme décimale : ${big(P(10, -n))}`,
      good: { l: w(-n), n: Math.pow(10, -n) },
      bads: [
        { l: w(n), n: Math.pow(10, n), why: 'L’exposant est négatif : le nombre est plus petit que 1, pas plus grand.' },
        { l: '−' + w(n), n: -Math.pow(10, n), why: 'Un exposant négatif ne rend pas le nombre négatif : c’est un inverse.' },
        { l: w(-n - 1), n: Math.pow(10, -n - 1), why: `Un zéro de trop : 10<sup>−${n}</sup> a son chiffre 1 à la ${n}<sup>e</sup> décimale.` },
        { l: w(-n + 1), n: Math.pow(10, -n + 1), why: `Un zéro de moins : le 1 doit être à la ${n}<sup>e</sup> décimale.` },
      ],
      hint: `${P(10, -n)} = 1 ÷ ${P(10, n)} : le chiffre 1 se place à la ${n}<sup>e</sup> décimale après la virgule (10<sup>−1</sup> = 0,1 ; 10<sup>−2</sup> = 0,01).`,
      solution: `${P(10, -n)} = 1 ÷ ${ent(Math.pow(10, n))} = ${w(-n)} (le 1 est en ${n}<sup>e</sup> position après la virgule).`,
      indep: () => 1 / Math.pow(10, n),
    };
  },
};
const carreNeg = {
  id: 'p-carre', dmin: 2, titre: 'carré et signe moins : −a² ou (−a)²',
  draw() { return { a: ri(2, 9), par: pick([true, false]) }; },
  ex: { a: 3, par: false },
  build({ a, par }) {
    const g = par ? a * a : -a * a;
    const lab = v => String(v).replace('-', '−');
    return {
      html: `Calcule : ${big(par ? `(−${a})<sup>2</sup>` : `−${a}<sup>2</sup>`)}`,
      good: { l: lab(g), n: g },
      bads: [
        { l: lab(-g), n: -g, why: par ? 'Le carré d’un nombre négatif est positif : (−a) × (−a) = a².' : 'Le carré s’applique à ' + a + ' seulement, pas au signe : −a² = −(a × a).' },
        { l: lab(2 * a), n: 2 * a, why: `Tu as calculé 2 × ${a} au lieu de ${a} × ${a}.` },
        { l: lab(-2 * a), n: -2 * a, why: `Le carré, c’est ${a} × ${a} (pas 2 × ${a}).` },
        { l: lab(par ? -a : -a), n: -a, why: 'Tu as juste recopié ' + a + ' avec un signe : élever au carré, c’est multiplier ' + (par ? '(−' + a + ')' : a) + ' par lui-même.' },
      ],
      hint: par ? `Les parenthèses contiennent le signe : (−${a}) × (−${a}). Que donne le produit de deux négatifs ?` : `Sans parenthèses, le carré ne concerne que ${a} : calcule ${a}<sup>2</sup>, puis mets le signe − devant.`,
      solution: par ? `(−${a})<sup>2</sup> = (−${a}) × (−${a}) = ${a * a} (moins par moins donne plus).` : `−${a}<sup>2</sup> = −(${a} × ${a}) = −${a * a}.`,
      indep: () => (par ? 1 : -1) * a * a,
    };
  },
};
const parenNeg = {
  id: 'p-paren', dmin: 2, titre: 'puissance d’un nombre négatif',
  draw() { return { a: ri(2, 5), n: ri(2, 5) }; },
  ex: { a: 2, n: 3 },
  build({ a, n }) {
    const g = Math.pow(-a, n), lab = v => String(v).replace('-', '−');
    return {
      html: `Calcule : ${big(`(−${a})<sup>${n}</sup>`)}`,
      good: { l: lab(g), n: g },
      bads: [
        { l: lab(-g), n: -g, why: n % 2 ? 'Exposant impair : le résultat reste négatif.' : 'Exposant pair : le résultat est positif.' },
        { l: lab(-a * n), n: -a * n, why: `Tu as multiplié ${a} par ${n} : l’exposant compte le nombre de facteurs.` },
        { l: lab(a * n), n: a * n, why: `Tu as multiplié ${a} par ${n} : l’exposant compte le nombre de facteurs.` },
        { l: lab(Math.abs(g) + a), n: Math.abs(g) + a, why: 'Vérifie ton calcul : ' + n + ' facteurs égaux à (−' + a + ').' },
        { l: lab(g * a), n: g * a, why: 'Un facteur de trop.' },
      ],
      hint: `Il y a ${n} facteurs (−${a}). Le signe dépend de la parité de ${n} : combien de signes − multiplie-t-on ?`,
      solution: `(−${a})<sup>${n}</sup> = ${Array(n).fill(`(−${a})`).join(' × ')}. Valeur absolue : ${Math.abs(g)} ; ${n} signes − (${n % 2 ? 'impair : le résultat est négatif' : 'pair : le résultat est positif'}). Donc ${lab(g)}.`,
      indep: () => { let p = 1; for (let i = 0; i < n; i++) p *= -a; return p; },
    };
  },
};
const sciTxt = (mant, e) => `${M(mant)} × 10<sup>${String(e).replace('-', '−')}</sup>`;
const sciGrand = {
  id: 'p-sci-grand', dmin: 2, titre: 'écrire un grand nombre en notation scientifique',
  draw() { const mant = pick([ri(1, 9), ri(11, 99) / 10]); return { mant, e: ri(4, 9) }; },
  ex: { mant: 4.5, e: 7 },
  build({ mant, e }) {
    const x = Math.round(mant * Math.pow(10, e)), t = ent(x);
    const m10 = mant * 10;
    return {
      html: `Quelle est l’écriture scientifique de ${big(t)}`,
      good: { l: sciTxt(mant, e), n: 'ok' },
      bads: [
        { l: sciTxt(mant, e - 1), n: 'e-', why: 'Compte bien les rangs : ' + t + ' a ' + (e + 1) + ' chiffres, donc l’exposant est ' + e + '.' },
        { l: sciTxt(mant, e + 1), n: 'e+', why: 'L’exposant est trop grand d’un rang : compte les décalages de la virgule.' },
        { l: sciTxt(m10, e - 1), n: 'ns1', why: 'Ce nombre est bien égal, mais ce n’est pas une écriture scientifique : le facteur doit être entre 1 et 10.' },
        { l: sciTxt(mant / 10, e + 1), n: 'ns2', why: 'Ce nombre est bien égal, mais ce n’est pas une écriture scientifique : le facteur doit être entre 1 et 10.' },
        { l: sciTxt(mant, -e), n: 'neg', why: 'Un grand nombre a un exposant positif.' },
      ],
      hint: `Place la virgule après le premier chiffre non nul (${String(x)[0]}) et compte de combien de rangs elle a reculé : ${t} a ${String(x).length} chiffres.`,
      solution: `${t} = ${M(mant)} × 10<sup>${e}</sup> : on a décalé la virgule de ${e} rangs vers la gauche, et ${M(mant)} est entre 1 et 10.`,
      indep: () => Math.round(mant * Math.pow(10, e)) / Math.pow(10, Math.floor(Math.log10(Math.round(mant * Math.pow(10, e))))) === mant ? 'ok' : 'ko',
    };
  },
};
const sciPetit = {
  id: 'p-sci-petit', dmin: 3, titre: 'écrire un petit nombre en notation scientifique',
  draw() { const mant = pick([ri(1, 9), ri(11, 99) / 10]); return { mant, e: ri(3, 7) }; },
  ex: { mant: 3.2, e: 4 },
  build({ mant, e }) {
    const digits = String(mant).replace('.', '');
    const t = '0,' + '0'.repeat(e - 1) + digits;
    return {
      html: `Quelle est l’écriture scientifique de ${big(t)}`,
      good: { l: sciTxt(mant, -e), n: 'ok' },
      bads: [
        { l: sciTxt(mant, -(e - 1)), n: 'e-', why: 'Un rang de moins que nécessaire : compte les décalages de la virgule jusqu’au premier chiffre non nul.' },
        { l: sciTxt(mant, -(e + 1)), n: 'e+', why: 'Un rang de trop : compte les décalages de la virgule jusqu’au premier chiffre non nul.' },
        { l: sciTxt(mant, e), n: 'pos', why: 'Un nombre plus petit que 1 a un exposant négatif.' },
        { l: sciTxt(mant * 10, -(e + 1)), n: 'ns', why: 'Ce nombre est bien égal, mais ce n’est pas une écriture scientifique : le facteur doit être entre 1 et 10.' },
      ],
      hint: `Compte de combien de rangs il faut décaler la virgule vers la droite pour que le premier chiffre non nul (${digits[0]}) soit avant elle : l’exposant est l’opposé de ce nombre de rangs.`,
      solution: `Pour obtenir ${M(mant)}, on décale la virgule de ${e} rangs vers la droite : ${t} = ${M(mant)} × 10<sup>−${e}</sup>.`,
      indep: () => Math.abs(mant * Math.pow(10, -e) - Number(t.replace(',', '.'))) < 1e-12 ? 'ok' : 'ko',
    };
  },
};
const sciCalc = {
  id: 'p-sci-calc', dmin: 4, titre: 'multiplier deux nombres en notation scientifique',
  draw() { for (;;) { const a = ri(2, 9), b = ri(2, 9), p = ri(2, 8), q = ri(2, 8); if (a * b !== a + b && p !== q) return { a, b, p, q }; } },
  ex: { a: 4, b: 5, p: 3, q: 2 },
  build({ a, b, p, q }) {
    const ab = a * b, car = ab >= 10, mant = car ? ab / 10 : ab, e = p + q + (car ? 1 : 0);
    const bads = [
      { l: sciTxt(a + b, p + q), n: 'sum', why: 'Tu as additionné les facteurs : on les multiplie.' },
      { l: sciTxt(ab, p * q), n: 'pq', why: 'Les exposants s’additionnent (produit de puissances de 10), ils ne se multiplient pas.' },
      car ? { l: sciTxt(ab, p + q), n: 'ns', why: `${ab} × 10<sup>${p + q}</sup> est bien égal, mais ${ab} n’est pas entre 1 et 10 : ce n’est pas une écriture scientifique.` } : { l: sciTxt(ab, p + q + 1), n: 'e+', why: `Il n’y a pas de retenue : ${ab} est déjà entre 1 et 10.` },
      car ? { l: sciTxt(mant, p + q), n: 'noadj', why: 'Tu as divisé ' + ab + ' par 10 sans compenser : il faut ajouter 1 à l’exposant.' } : { l: sciTxt(ab, p + q - 1), n: 'e-', why: 'Les exposants s’additionnent : ' + p + ' + ' + q + '.' },
    ];
    return {
      html: `Donne l’écriture scientifique de : ${big(`(${a} × 10<sup>${p}</sup>) × (${b} × 10<sup>${q}</sup>)`)}`,
      good: { l: sciTxt(mant, e), n: 'ok' }, bads,
      hint: `Multiplie d’abord ${a} par ${b}, puis les puissances de 10 (exposants ${p} et ${q}). ${ab >= 10 ? `Le produit ${a} × ${b} dépasse 10 : il faudra renormaliser.` : `Vérifie ensuite que le facteur est entre 1 et 10.`}`,
      solution: `${a} × ${b} = ${ab} et 10<sup>${p}</sup> × 10<sup>${q}</sup> = 10<sup>${p + q}</sup>. ${car ? `Donc ${ab} × 10<sup>${p + q}</sup> = ${M(mant)} × 10<sup>${p + q + 1}</sup> (on écrit ${ab} = ${M(mant)} × 10).` : `Le résultat est ${sciTxt(ab, p + q)}.`}`,
      indep: () => Math.abs((a * Math.pow(10, p)) * (b * Math.pow(10, q)) / (mant * Math.pow(10, e)) - 1) < 1e-9 ? 'ok' : 'ko',
    };
  },
};
const sciQuot = {
  id: 'p-sci-quot', dmin: 5, titre: 'diviser deux nombres en notation scientifique',
  draw() { for (;;) { const b = ri(2, 4), k = ri(2, 4), p = ri(3, 9), q = ri(2, 8); if (p !== q) return { a: b * k, b, k, p, q }; } },
  ex: { a: 8, b: 2, k: 4, p: 6, q: 2 },
  build({ a, b, k, p, q }) {
    return {
      html: `Donne l’écriture scientifique de : ${big(F(`${a} × 10<sup>${p}</sup>`, `${b} × 10<sup>${q}</sup>`))}`,
      good: { l: sciTxt(k, p - q), n: 'ok' },
      bads: [
        { l: sciTxt(k, p + q), n: 'a', why: 'Les exposants se soustraient dans un quotient.' },
        { l: sciTxt(k, q - p), n: 'b', why: 'Tu as soustrait dans le mauvais sens : exposant du haut − exposant du bas.' },
        { l: sciTxt(a - b, p - q), n: 'c', why: 'Les facteurs se divisent : ' + a + ' ÷ ' + b + '.' },
        { l: sciTxt(k, p - q + 1), n: 'd', why: 'Il n’y a pas de retenue : ' + k + ' est déjà entre 1 et 10.' },
      ],
      hint: `Divise ${a} par ${b} (facteurs), puis soustrais les exposants ${p} et ${q}.`,
      solution: `${a} ÷ ${b} = ${k} et 10<sup>${p}</sup> ÷ 10<sup>${q}</sup> = ${sup(10, p - q)}. Résultat : ${sciTxt(k, p - q)}.`,
      indep: () => Math.abs((a * Math.pow(10, p)) / (b * Math.pow(10, q)) - k * Math.pow(10, p - q)) < 1e-6 * Math.pow(10, Math.max(p - q, 0)) ? 'ok' : 'ko',
    };
  },
};
const sumPow = {
  id: 'p-sci-somme', dmin: 5, titre: 'additionner deux nombres de même puissance de 10',
  draw() { for (;;) { const a = ri(1, 7), b = ri(1, 8); if (a + b <= 9 && a * b !== a + b) return { a, b, p: ri(3, 8) }; } },
  ex: { a: 3, b: 4, p: 5 },
  build({ a, b, p }) {
    return {
      html: `Donne l’écriture scientifique de : ${big(`${a} × 10<sup>${p}</sup> + ${b} × 10<sup>${p}</sup>`)}`,
      good: { l: sciTxt(a + b, p), n: 'ok' },
      bads: [
        { l: sciTxt(a + b, 2 * p), n: 'a', why: 'Dans une somme, on ne touche pas à l’exposant (on n’additionne les exposants que dans un produit).' },
        { l: sciTxt(a * b, p), n: 'b', why: 'Tu as multiplié les facteurs : ici on additionne.' },
        { l: sciTxt(a * b, 2 * p), n: 'c', why: 'C’est le résultat du produit, pas de la somme.' },
        { l: sciTxt(a + b, p + 1), n: 'd', why: 'Pas de décalage ici : ' + (a + b) + ' est déjà entre 1 et 10.' },
      ],
      hint: `Les deux nombres ont la même puissance 10<sup>${p}</sup> : mets-la en facteur, comme dans ${a === 1 ? '' : a}x + ${b === 1 ? '' : b}x.`,
      solution: `${a} × 10<sup>${p}</sup> + ${b} × 10<sup>${p}</sup> = (${a} + ${b}) × 10<sup>${p}</sup> = ${sciTxt(a + b, p)}.`,
      indep: () => (a * Math.pow(10, p) + b * Math.pow(10, p)) / Math.pow(10, p) === a + b ? 'ok' : 'ko',
    };
  },
};
const negBase = {
  id: 'p-neg-base', dmin: 3, titre: 'puissance négative d’un entier',
  draw() { return { a: pick([2, 3, 4, 5]), n: pick([2, 3]) }; },
  ex: { a: 2, n: 3 },
  build({ a, n }) {
    const A = Math.pow(a, n);
    return {
      html: `Écris sous forme de fraction : ${big(P(a, -n))}`,
      good: { l: F(1, A), n: 1 / A },
      bads: [
        { l: '−' + A, n: -A, why: 'Un exposant négatif ne donne pas un nombre négatif : c’est l’inverse.' },
        { l: '−' + F(1, A), n: -1 / A, why: 'Un exposant négatif ne change pas le signe.' },
        { l: F(1, a * n), n: 1 / (a * n), why: `${a}<sup>${n}</sup> = ${a} × … × ${a} (${n} facteurs), pas ${a} × ${n}.` },
        { l: String(A), n: A, why: 'Un exposant négatif donne un inverse : on met la puissance au dénominateur.' },
      ],
      hint: `${P(a, -n)} est l’inverse de ${P(a, n)}. Calcule d’abord ${P(a, n)} (${n} facteurs ${a}).`,
      solution: `${P(a, -n)} = 1 ÷ ${P(a, n)} = ${F(1, A)}.`,
      indep: () => 1 / Math.pow(a, n),
    };
  },
};
const echelle = () => {
  const xs = [-3, -2, -1, 0, 1, 2, 3];
  let s = `<svg viewBox="0 0 420 70" class="vis" role="img" aria-label="puissances de 10"><line x1="10" y1="34" x2="410" y2="34" stroke="#555" stroke-width="2"/>`;
  xs.forEach((x, i) => { const X = 30 + i * 60; s += `<line x1="${X}" y1="28" x2="${X}" y2="40" stroke="#555" stroke-width="2"/><text x="${X}" y="22" font-size="13" text-anchor="middle" fill="#333">10<tspan dy="-5" font-size="10">${String(x).replace('-', '−')}</tspan></text><text x="${X}" y="58" font-size="12" text-anchor="middle" fill="var(--acc)">${x < 0 ? M(Math.pow(10, x)) : ent(Math.pow(10, x))}</text>`; });
  return s + '</svg>';
};
const LV2 = niveau('Puissances et écriture scientifique', [prodPow, quotPow, powPow, neg10, carreNeg, parenNeg, sciGrand, negBase, sciPetit, sciCalc, sciQuot, sumPow], {
  n: 2, classe: '2de – 1re',
  intro: 'Les règles sur les puissances et l’écriture scientifique servent partout (physique, chimie, ordres de grandeur). On les applique de tête.',
  def: 'a<sup>n</sup> = a × … × a (n facteurs) ; a<sup>−n</sup> = 1 ÷ a<sup>n</sup>. <br>a<sup>m</sup> × a<sup>n</sup> = a<sup>m+n</sup> ; a<sup>m</sup> ÷ a<sup>n</sup> = a<sup>m−n</sup> ; (a<sup>m</sup>)<sup>n</sup> = a<sup>m×n</sup>.<br>Écriture scientifique : <b>a × 10<sup>n</sup></b> avec 1 ≤ a &lt; 10 et n entier.',
  visuel: echelle(),
  methode: ['Même base : on additionne les exposants (produit), on les soustrait (quotient), on les multiplie (puissance de puissance).', 'Exposant négatif : on prend l’inverse.', 'Écriture scientifique : on place la virgule après le 1<sup>er</sup> chiffre non nul ; l’exposant compte les rangs de décalage (négatif si le nombre est plus petit que 1).', 'Après un calcul, vérifie que le facteur reste entre 1 et 10 (sinon renormalise).'],
  warn: ['−3<sup>2</sup> = −9 mais (−3)<sup>2</sup> = 9.', '10<sup>3</sup> + 10<sup>3</sup> = 2 × 10<sup>3</sup> (et pas 10<sup>6</sup>) : on n’additionne les exposants que dans un <b>produit</b>.', '20 × 10<sup>5</sup> est égal à 2 × 10<sup>6</sup>, mais seule la 2<sup>e</sup> écriture est scientifique.'],
  retenir: 'produit → on additionne les exposants ; quotient → on les soustrait ; puissance de puissance → on les multiplie ; exposant négatif → inverse.',
});

export { LV1, LV2 };

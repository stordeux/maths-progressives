// Niveaux 3 et 4 : écritures d'un nombre et ordres de grandeur ; proportions et pourcentages.
import { ri, pick, shuffle, M, F, big, sup, ent, dec, fr, Fr, gcd, niveau } from './outils.js';
import { r6 } from '../../engine/util/arith.js';

const pcl = x => `${dec(Math.round(x * 10) / 10)}&nbsp;%`;
const D = (n, d) => n / d;

/* =================== NIVEAU 3 =================== */
const decFrac = {
  id: 'e-dec-frac', dmin: 0, titre: 'passer d’un décimal à une fraction',
  draw() {
    for (;;) {
      const den = pick([2, 4, 5, 8, 10, 20, 25, 50]), n = ri(1, den * 2);
      if (gcd(n, den) === 1 && n !== den && fr(n, den).d > 1) return { n, d: den };
    }
  },
  ex: { n: 7, d: 20 },
  build({ n, d }) {
    const v = D(n, d), k = (String(r6(v)).split('.')[1] || '').length, s = Math.round(v * Math.pow(10, k)), x = dec(v);
    return {
      html: `Quelle fraction est égale à <b>${x}</b> ?`,
      good: { l: Fr(n, d), n: v },
      bads: [
        { l: Fr(s, Math.pow(10, k - 1)), n: s / Math.pow(10, k - 1), why: `Tu as divisé par ${Math.pow(10, k - 1)} : ${x} a ${k} décimale${k > 1 ? 's' : ''}, donc le dénominateur est ${Math.pow(10, k)}.` },
        { l: Fr(s, Math.pow(10, k + 1)), n: s / Math.pow(10, k + 1), why: `Tu as divisé par ${Math.pow(10, k + 1)} : un zéro de trop, ${x} a ${k} décimale${k > 1 ? 's' : ''}.` },
        { l: Fr(1, s), n: 1 / s, why: `Tu as écrit « 1 sur ${s} » : ${x} se lit « ${s} sur ${Math.pow(10, k)} ».` },
        { l: Fr(Math.pow(10, k), s), n: Math.pow(10, k) / s, why: 'Tu as inversé la fraction.' },
      ],
      hint: `${x} a ${k} chiffre${k > 1 ? 's' : ''} après la virgule : écris ${x} = ${F(s, Math.pow(10, k))}, puis simplifie jusqu’à ce que plus rien ne se simplifie.`,
      solution: `${x} = ${F(s, Math.pow(10, k))} = ${Fr(n, d)} (fraction simplifiée).`,
      indep: () => n / d,
    };
  },
};
const fracDec = {
  id: 'e-frac-dec', dmin: 0, titre: 'passer d’une fraction à un décimal',
  draw() {
    for (;;) {
      const d = pick([2, 4, 5, 8, 20, 25]), n = ri(1, d * 3);
      if (gcd(n, d) === 1 && n % d) return { n, d };
    }
  },
  ex: { n: 3, d: 8 },
  build({ n, d }) {
    const v = D(n, d);
    return {
      html: `Écris sous forme décimale : ${big(F(n, d))}`,
      good: { l: dec(v), n: v },
      bads: [
        { l: dec(v * 10), n: v * 10, why: 'Décalage de la virgule : vérifie en multipliant ton résultat par ' + d + ' (tu dois retrouver ' + n + ').' },
        { l: dec(v / 10), n: v / 10, why: 'Décalage de la virgule : vérifie en multipliant ton résultat par ' + d + ' (tu dois retrouver ' + n + ').' },
        { l: dec(Number(`${Math.floor(n / 10) ? '' : '0.'}${n}${d}`.replace(/^0\.$/, '0'))), n: Number(`0.${n}${d}`), why: 'Tu as écrit le numérateur puis le dénominateur après la virgule. La fraction, c’est une division : ' + n + ' ÷ ' + d + '.' },
        { l: dec(d / n), n: d / n, why: 'Tu as divisé le dénominateur par le numérateur.' },
        { l: dec(v + 1), n: v + 1, why: 'Vérifie ta division : ' + n + ' ÷ ' + d + '.' },
      ],
      hint: `Une fraction est une division : ${n} ÷ ${d}. Astuce : ${d <= 5 ? `${F(1, d)} = ${dec(1 / d)}` : d === 8 ? `${F(1, 8)} = 0,125` : `multiplie haut et bas pour obtenir un dénominateur 100 (${d} × ${100 / d})`}.`,
      solution: `Une fraction est une division : ${n} ÷ ${d} = ${dec(v)}. (Contrôle : ${dec(v)} × ${d} = ${n}.)`,
      indep: () => n / d,
    };
  },
};
const pctDec = {
  id: 'e-pct-dec', dmin: 1, titre: 'passer d’un pourcentage à un décimal',
  draw() { return { p: pick([ri(2, 99), pick([5, 12, 35, 45, 60, 7, 8]), ri(101, 190), 12.5]) }; },
  ex: { p: 7 },
  build({ p }) {
    const v = p / 100;
    return {
      html: `Quelle écriture décimale correspond à <b>${pcl(p)}</b> ?`,
      good: { l: dec(v), n: v },
      bads: [
        { l: dec(v * 10), n: v * 10, why: 'Un pourcentage se divise par 100 : on décale la virgule de deux rangs (pas un seul).' },
        { l: dec(v / 10), n: v / 10, why: 'Un pourcentage se divise par 100 : on décale la virgule de deux rangs (pas trois).' },
        { l: dec(p), n: p, why: 'Tu as juste enlevé le signe % : il faut diviser par 100.' },
        { l: dec(p * 100), n: p * 100, why: 'Tu as multiplié par 100 au lieu de diviser.' },
      ],
      hint: `« ${pcl(p)} » veut dire « ${dec(p)} pour cent » : ${dec(p)} ÷ 100.`,
      solution: `${pcl(p)} = ${dec(p)} ÷ 100 = ${dec(v)}.`,
      indep: () => p * 0.01,
    };
  },
};
const fracPct = {
  id: 'e-frac-pct', dmin: 1, titre: 'passer d’une fraction à un pourcentage',
  draw() { for (;;) { const d = pick([2, 4, 5, 8, 10, 20, 25, 50]), n = ri(1, d - 1); if (gcd(n, d) === 1) return { n, d }; } },
  ex: { n: 3, d: 4 },
  build({ n, d }) {
    const p = 100 * n / d;
    return {
      html: `Écris ${F(n, d)} sous la forme d’un pourcentage.`,
      good: { l: pcl(p), n: p },
      bads: [
        { l: pcl(p / 10), n: p / 10, why: 'Le facteur est 100 : ' + F(n, d) + ' = ' + dec(n / d) + ' = ' + dec(p) + ' %.' },
        { l: pcl(p / 100), n: p / 100, why: 'C’est la valeur décimale (' + dec(p / 100) + ') qu’il faut ensuite multiplier par 100 pour avoir un pourcentage.' },
        { l: pcl(n), n: n, why: 'Tu as pris le numérateur : une fraction ' + F(n, d) + ' ne vaut pas ' + n + ' %.' },
        { l: pcl(Number(`${n}${d}`)), n: Number(`${n}${d}`), why: 'Tu as juxtaposé le numérateur et le dénominateur. Il faut diviser ' + n + ' par ' + d + ' puis multiplier par 100.' },
        { l: pcl(100 / (n / d) / 100 * 10), n: 1000 * d / n / 100, why: 'Tu as divisé dans le mauvais sens.' },
      ],
      hint: `Calcule ${n} ÷ ${d}, puis multiplie par 100. Ou cherche un dénominateur 100 : ${d} × ${100 / d}.`,
      solution: `${F(n, d)} = ${F(n * 100 / d, 100)} = ${pcl(p)}.`,
      indep: () => (n / d) * 100,
    };
  },
};
// ordre de grandeur d'un produit : A et B arrondis à un chiffre significatif
const sig1 = (a, e) => { const v = Math.round(a / 10) * 10; return [v, e + 1]; }; // a est à 2 chiffres (a1 ∈ 18..92)
const nombreEn = (a1, e) => r6(a1 * Math.pow(10, e)); // valeur
const lab = x => dec(x);
const ordreCalc = {
  id: 'e-ordre-calc', dmin: 2, titre: 'ordre de grandeur d’un produit',
  draw() {
    const mk = (kmin, kmax) => { const n1 = ri(2, 9), z = pick([-2, -1, 1, 2]); return { a: 10 * n1 + z, e: ri(kmin, kmax) }; };
    return { A: mk(0, 3), B: mk(-2, 1) };
  },
  ex: { A: { a: 49, e: 2 }, B: { a: 21, e: -1 } }, // 4 900 et 2,1 → 5 000 × 2 = 10 000
  build({ A, B }) {
    const va = nombreEn(A.a, A.e - 1 + 0), vb = nombreEn(B.a, B.e - 1 + 0);
    const ra = Math.round(A.a / 10), rb = Math.round(B.a / 10);
    const ea = A.e, eb = B.e;
    const g = ra * rb * Math.pow(10, ea + eb);
    return {
      html: `Quel est l’ordre de grandeur du produit ${big(`${lab(va)} × ${lab(vb)}`)}`,
      good: { l: lab(r6(g)), n: g },
      bads: [
        { l: lab(r6(g * 10)), n: g * 10, why: 'Il y a un zéro de trop : compte les chiffres des nombres arrondis.' },
        { l: lab(r6(g / 10)), n: g / 10, why: 'Il manque un zéro : compte les chiffres des nombres arrondis.' },
        { l: lab(r6(g * 100)), n: g * 100, why: 'Deux zéros de trop : arrondis chaque nombre à un seul chiffre significatif, puis multiplie.' },
        { l: lab(r6(g / 100)), n: g / 100, why: 'Deux zéros de moins : arrondis chaque nombre à un seul chiffre significatif, puis multiplie.' },
      ],
      hint: `Arrondis chaque facteur à un seul chiffre significatif (${lab(va)} proche de ${lab(r6(ra * Math.pow(10, ea)))} ; ${lab(vb)} proche de ${lab(r6(rb * Math.pow(10, eb)))}), puis calcule le produit.`,
      solution: `${lab(va)} ≈ ${lab(r6(ra * Math.pow(10, ea)))} et ${lab(vb)} ≈ ${lab(r6(rb * Math.pow(10, eb)))}. Le produit est environ ${lab(r6(ra * Math.pow(10, ea)))} × ${lab(r6(rb * Math.pow(10, eb)))} = ${lab(r6(g))}.`,
      indep: () => Math.round(va / Math.pow(10, Math.floor(Math.log10(va)))) * Math.pow(10, Math.floor(Math.log10(va))) * (Math.round(vb / Math.pow(10, Math.floor(Math.log10(vb)))) * Math.pow(10, Math.floor(Math.log10(vb)))),
    };
  },
};
const pw10 = e => sup(10, e);
const ordrePuiss = {
  id: 'e-ordre-puiss', dmin: 3, titre: 'ordre de grandeur : la puissance de 10 la plus proche',
  draw() {
    const m = pick([1.2, 1.5, 1.8, 2.1, 2.4, 5.5, 6.2, 7.4, 8.1, 9.3, 9.6]), e = pick([-5, -4, -3, -2, 3, 4, 5, 6, 7]);
    return { m, e };
  },
  ex: { m: 6.2, e: -3 },
  build({ m, e }) {
    const g = e + (m > 3.2 ? 1 : 0);
    const x = e >= 0 ? ent(Math.round(m * Math.pow(10, e))) : '0,' + '0'.repeat(-e - 1) + String(m).replace('.', '');
    const cand = [g + 1, g - 1, -g, g + 2, g - 2].filter(z => z !== g);
    return {
      html: `Quel est l’ordre de grandeur de <b>${x}</b> ? (puissance de 10 la plus proche)`,
      good: { l: pw10(g), n: Math.pow(10, g) },
      bads: cand.map(z => ({ l: pw10(z), n: Math.pow(10, z), why: z === -g ? 'Vérifie le signe de l’exposant : le nombre est ' + (e < 0 ? 'plus petit que 1' : 'grand') + '.' : z === e + (m > 3.2 ? 0 : 1) ? (m > 3.2 ? 'Tu as gardé l’exposant sans arrondir : ' + M(m) + ' est plus proche de 10 que de 1, donc on passe à la puissance suivante.' : 'Tu as arrondi vers le haut : ' + M(m) + ' est plus proche de 1 que de 10.') : 'Compte les rangs de la virgule : ' + x + ' = ' + M(m) + ' × ' + pw10(e) + '.' })),
      hint: `Écris ${x} = ${M(m)} × ${pw10(e)}. Le facteur ${M(m)} est-il plus proche de 1 ou de 10 (la frontière est vers 3) ?`,
      solution: `${x} = ${M(m)} × ${pw10(e)}. Comme ${M(m)} est plus proche de ${m > 3.2 ? '10' : '1'}, l’ordre de grandeur est ${pw10(g)}.`,
      indep: () => Math.pow(10, Math.round(Math.log10(m * Math.pow(10, e)))),
    };
  },
};
const FRS = [[1, 2], [3, 5], [5, 8], [3, 4], [7, 10], [4, 5], [7, 8], [9, 10], [11, 20], [13, 20], [17, 20], [19, 20], [2, 3], [5, 6], [3, 8], [2, 5], [1, 4], [7, 20], [9, 20]];
const compareFormes = {
  id: 'e-compare', dmin: 4, titre: 'comparer des écritures différentes d’un nombre',
  draw() {
    for (;;) {
      const L = [];
      for (let i = 0; i < 4; i++) {
        const t = pick(['f', 'd', 'p', 'd', 'p']);
        let v, l, kind = t;
        if (t === 'f') { const [n, d] = pick(FRS); v = n / d; l = F(n, d); }
        else if (t === 'd') { v = ri(20, 95) / 100; l = dec(v); }
        else { v = ri(20, 95) / 100; l = pcl(v * 100); }
        L.push({ v, l, kind });
      }
      const vs = L.map(x => x.v).sort((a, b) => a - b);
      if (vs.every((x, i) => i === 0 || x - vs[i - 1] > 0.02) && new Set(L.map(x => x.kind)).size >= 2) return { L };
    }
  },
  ex: { L: [{ v: 0.6, l: '0,6', kind: 'd' }, { v: 5 / 8, l: F(5, 8), kind: 'f' }, { v: 0.61, l: pcl(61), kind: 'p' }, { v: 0.58, l: pcl(58), kind: 'p' }] },
  build({ L }) {
    const vs = L.map(x => x.v), k = vs.indexOf(Math.max(...vs));
    const mx = L.findIndex(x => x.v === Math.max(...vs.filter((_, i) => i !== k)));
    return {
      html: `Quel est le plus grand de ces quatre nombres ?${big(L.map(x => x.l).join(' ; '))}`,
      good: { l: L[k].l, n: vs[k] },
      bads: L.map((x, i) => i === k ? null : { l: x.l, n: x.v, why: x.kind === 'p' && L[k].kind !== 'p' ? 'Tu as comparé 61 (le nombre devant %) avec les autres : écris tout en décimal avant de comparer.' : x.kind === 'f' ? 'Écris la fraction en décimal (' + x.l.replace(/<[^>]+>/g, '/').replace(/\/+/g, '/').replace(/^\/|\/$/g, '') + ') avant de comparer.' : 'Écris tous les nombres sous la même forme (décimal) avant de comparer.' }).filter(Boolean),
      hint: `Passe tout en écriture décimale (${L.map(x => x.l).join(' ; ')}) : un pourcentage se divise par 100, une fraction se divise (numérateur ÷ dénominateur). Compare ensuite les chiffres après la virgule.`,
      solution: `En décimaux : ${L.map(x => `${x.l} = ${dec(Math.round(x.v * 1000) / 1000)}`).join(' ; ')}. Le plus grand est ${L[k].l}.`,
      indep: () => Math.max(...L.map(x => x.v)),
    };
  },
};
const droite = () => {
  let s = `<svg viewBox="0 0 440 90" class="vis" role="img" aria-label="trois écritures du même nombre"><rect x="10" y="10" width="420" height="70" rx="10" fill="none" stroke="#999"/>`;
  [['0,75', 80], ['3/4', 220], ['75 %', 360]].forEach(([t, x], i) => { s += `<text x="${x}" y="52" font-size="26" text-anchor="middle" fill="var(--acc)" font-weight="700">${t}</text>`; if (i < 2) s += `<text x="${x + 70}" y="50" font-size="26" text-anchor="middle" fill="#555">=</text>`; });
  return s + '</svg>';
};
const LV3 = niveau('Écritures d’un nombre et ordres de grandeur', [decFrac, fracDec, pctDec, fracPct, ordreCalc, ordrePuiss, compareFormes], {
  n: 3, classe: '2de – 1re',
  intro: 'Un même nombre s’écrit de plusieurs façons : décimal, fraction, pourcentage. En QCM, il faut passer de l’une à l’autre sans hésiter, et savoir estimer un résultat.',
  def: 'Un pourcentage est une fraction de dénominateur 100 : <b>x % = x ÷ 100</b>. Une fraction est une division : ' + F('a', 'b') + ' = a ÷ b. L’<b>ordre de grandeur</b> d’un résultat s’obtient en arrondissant chaque nombre à un seul chiffre significatif.',
  visuel: droite(),
  methode: ['Décimal → fraction : le dénominateur est 10, 100, 1 000 selon le nombre de décimales, puis on simplifie.', 'Fraction → décimal : on divise (ou on cherche un dénominateur 100).', 'Pourcentage ↔ décimal : on décale la virgule de <b>deux</b> rangs.', 'Pour comparer : on écrit tout sous la <b>même forme</b> (décimale).', 'Ordre de grandeur : on arrondit chaque facteur à 1 chiffre significatif, puis on calcule.'],
  warn: ['35 % = 0,35 (et pas 3,5 ni 0,035).', 'En passant d’une fraction à un pourcentage, on divise <b>puis</b> on multiplie par 100.', 'Un ordre de grandeur est une estimation : on cherche le bon nombre de zéros, pas les chiffres exacts.'],
  retenir: 'x % = x ÷ 100 ; une fraction est une division ; on compare des nombres écrits de la même façon.',
});

/* =================== NIVEAU 4 : proportions et pourcentages =================== */
const UN = [['€', 'une somme de', 600], ['élèves', 'un lycée de', 1200], ['kg', 'une cargaison de', 600], ['litres', 'une cuve de', 800], ['km', 'un trajet de', 600], ['personnes', 'un public de', 800]];
const pctDe = {
  id: 'pr-pct-de', dmin: 0, titre: 'calculer un pourcentage d’une quantité',
  draw(d) {
    const p = pick(d < 1 ? [10, 20, 50, 25] : d < 3 ? [10, 20, 25, 50, 5, 75, 40, 30] : [15, 35, 12, 60, 45, 5, 80, 8]);
    const u = pick(UN), step = 100 / gcd(p, 100), x = step * ri(Math.ceil(20 / step), Math.floor(Math.min(u[2], 100 * step) / step));
    return { p, x, u };
  },
  ex: { p: 15, x: 80, u: ['€', 'une somme de', 600] },
  build({ p, x, u }) {
    const g = p * x / 100, un = n => `${dec(n)} ${u[0]}`;
    return {
      html: `Combien font <b>${p}&nbsp;%</b> d’${u[1]} ${ent(x)} ${u[0]} ?`,
      good: { l: un(g), n: g },
      bads: [
        { l: un(x / p), n: x / p, why: 'Tu as divisé par le pourcentage : il faut multiplier par ' + p + ' puis diviser par 100.' },
        { l: un(p * x), n: p * x, why: 'Tu as oublié de diviser par 100.' },
        { l: un(g * 10), n: g * 10, why: 'Un décalage de virgule de trop : p % = p ÷ 100.' },
        { l: un(g / 10), n: g / 10, why: 'Un décalage de virgule en trop : ' + p + ' % de ' + ent(x) + ' n’est pas si petit.' },
        { l: un(x - p), n: x - p, why: 'Tu as soustrait ' + p + ' de ' + ent(x) + ' : un pourcentage n’est pas une quantité à retrancher.' },
      ],
      hint: p % 10 === 0 ? `${p} % de ${ent(x)} : commence par 10 % de ${ent(x)} (divise par 10), puis ${p / 10} fois ce résultat.` : p === 15 || p === 35 || p === 45 ? `Décompose : ${p} % = ${p - 5} % + 5 %. Calcule 10 % de ${ent(x)} (divise par 10), puis 5 % (la moitié).` : `${p} % = ${p} ÷ 100 : calcule ${ent(x)} × ${p} ÷ 100, en simplifiant d’abord.`,
      solution: `${p} % de ${ent(x)} = ${ent(x)} × ${F(p, 100)} = ${dec(g)}. Réponse : ${un(g)}.`,
      indep: () => x * (p / 100),
    };
  },
};
const CTX = [['un club de sport', 'adhérents', 'pratiquent le tennis'], ['une classe', 'élèves', 'viennent en vélo'], ['un lycée', 'élèves', 'déjeunent à la cantine'], ['une entreprise', 'salariés', 'travaillent à temps partiel'], ['une chorale', 'choristes', 'sont des hommes'], ['un village', 'habitants', 'ont plus de 60 ans'], ['un cinéma', 'spectateurs', 'ont acheté du pop-corn'], ['un magasin', 'clients', 'paient par carte']];
const calcProp = {
  id: 'pr-prop', dmin: 0, titre: 'calculer une proportion en pourcentage',
  draw() {
    for (;;) {
      const N = pick([20, 25, 40, 50, 80, 100, 200, 250, 400, 500]), p = pick([5, 10, 12.5, 15, 20, 25, 30, 40, 45, 60, 75, 80]);
      const k = N * p / 100;
      if (Number.isInteger(k) && k >= 2 && k < N) return { N, k, c: pick(CTX) };
    }
  },
  ex: { N: 200, k: 50, c: ['un lycée', 'élèves', 'déjeunent à la cantine'] },
  build({ N, k, c }) {
    const p = 100 * k / N;
    return {
      html: `Dans ${c[0]} de ${ent(N)} ${c[1]}, ${ent(k)} ${c[2]}. Quelle est la proportion correspondante ?`,
      good: { l: pcl(p), n: p },
      bads: [
        { l: pcl(100 - p), n: 100 - p, why: 'Tu as calculé la proportion des autres (le complément à 100 %).' },
        { l: pcl(100 * N / k), n: 100 * N / k, why: 'Tu as divisé dans le mauvais sens : la proportion est « partie ÷ total ».' },
        { l: pcl(100 * k / (N - k)), n: 100 * k / (N - k), why: 'Tu as divisé par le reste (' + ent(N - k) + ') au lieu du total (' + ent(N) + ').' },
        { l: pcl(k), n: k, why: 'Tu as pris l’effectif comme un pourcentage : il faut le rapporter au total.' },
        { l: pcl(p * 10), n: p * 10, why: 'Décalage de virgule : ' + ent(k) + ' ÷ ' + ent(N) + ' = ' + dec(k / N) + ' = ' + pcl(p) + '.' },
      ],
      hint: `La proportion est « la partie ÷ le total » = ${ent(k)} ÷ ${ent(N)}. Simplifie la fraction ou cherche le coefficient pour obtenir un dénominateur 100 (${ent(N)} × ${dec(100 / N)}).`,
      solution: `${ent(k)} ÷ ${ent(N)} = ${dec(k / N)} = ${pcl(p)}.`,
      indep: () => (k / N) * 100,
    };
  },
};
const propProp = {
  id: 'pr-pp', dmin: 2, titre: 'proportion d’une proportion',
  draw() { for (;;) { const p = pick([10, 20, 25, 30, 40, 50, 60, 80]), q = pick([10, 20, 25, 30, 40, 50, 60, 75]); if ((p * q) % 10 === 0 && p * q % 100 !== 0 || (p * q) % 100 === 0) if (p + q !== p * q / 100 && p !== q && p * q <= 4500) return { p, q, c: pick([['des élèves d’un lycée sont des filles', 'des filles font du théâtre', 'des élèves'], ['des habitants d’une ville ont un jardin', 'des habitants qui ont un jardin ont un potager', 'des habitants'], ['des clients d’un magasin viennent en voiture', 'des clients venus en voiture se garent au sous-sol', 'des clients'], ['des salariés sont des cadres', 'des cadres télétravaillent', 'des salariés']]) }; } },
  ex: { p: 40, q: 25, c: ['des élèves d’un lycée sont des filles', 'des filles font du théâtre', 'des élèves'] },
  build({ p, q, c }) {
    const g = p * q / 100;
    return {
      html: `${p}&nbsp;% ${c[0]} ; ${q}&nbsp;% ${c[1]}. Quelle proportion ${c[2]} cela représente-t-il ?`,
      good: { l: pcl(g), n: g },
      bads: [
        { l: pcl(p + q), n: p + q, why: 'Tu as additionné les deux pourcentages : ils s’enchaînent, on les multiplie.' },
        { l: pcl(Math.abs(p - q)), n: Math.abs(p - q), why: 'Tu as soustrait les deux pourcentages : ils s’enchaînent, on les multiplie.' },
        { l: pcl(g * 10), n: g * 10, why: 'Décalage de virgule : ' + F(p, 100) + ' × ' + F(q, 100) + ' = ' + F(p * q, 10000) + '.' },
        { l: pcl(Math.min(p, q)), n: Math.min(p, q), why: 'La proportion de la proportion est plus petite que chacune des deux.' },
        { l: pcl(p * q / 10), n: p * q / 10, why: 'Un décalage de virgule de trop (divise par 100 une seule fois).' },
      ],
      hint: `« ${q} % de ${p} % » : on multiplie les deux proportions ${dec(p / 100)} et ${dec(q / 100)} (ou on calcule ${q} % de ${p}).`,
      solution: `${q} % de ${p} % : ${F(q, 100)} × ${F(p, 100)} = ${dec(g / 100)} = ${pcl(g)}.`,
      indep: () => (p / 100) * (q / 100) * 100,
    };
  },
};
const total = {
  id: 'pr-total', dmin: 3, titre: 'retrouver le total connaissant un pourcentage',
  draw() { const p = pick([10, 20, 25, 50, 40, 5, 75, 30, 60]), u = pick(UN), step = 100 / gcd(p, 100), x = step * ri(2, Math.floor(Math.min(u[2], 400) / step)); return { p, x, u }; },
  ex: { p: 25, x: 120, u: ['élèves', 'un lycée de', 1200] },
  build({ p, x, u }) {
    const v = p * x / 100, un = n => `${dec(n)} ${u[0]}`;
    return {
      html: `Un groupe de ${ent(v)} ${u[0]} représente <b>${p}&nbsp;%</b> d’un ensemble. Combien l’ensemble compte-t-il ?`.replace(u[0] + ' représente', u[0] + ' représente'),
      good: { l: un(x), n: x },
      bads: [
        { l: un(v * p / 100), n: v * p / 100, why: 'Tu as calculé ' + p + ' % de ' + ent(v) + ' : mais ' + ent(v) + ' est déjà la partie, pas le total.' },
        { l: un(v + p), n: v + p, why: 'On ne peut pas ajouter un pourcentage à une quantité.' },
        { l: un(v * p), n: v * p, why: 'Tu as multiplié la partie par le pourcentage.' },
        { l: un(v * 100 / (100 - p)), n: v * 100 / (100 - p), why: 'Tu as utilisé 100 − ' + p + ' : ' + ent(v) + ' correspond à ' + p + ' %, pas à ' + (100 - p) + ' %.' },
      ],
      hint: `${p} % du total valent ${ent(v)}. Combien valent 1 % ? (${ent(v)} ÷ ${p}). Puis 100 %.`,
      solution: `${p} % ↔ ${ent(v)}, donc 1 % ↔ ${ent(v)} ÷ ${p} = ${dec(v / p)} et 100 % ↔ ${dec(v / p)} × 100 = ${dec(x)}.`,
      indep: () => v / (p / 100),
    };
  },
};
const points = {
  id: 'pr-points', dmin: 4, titre: 'différence de deux proportions : des points de pourcentage',
  draw() { for (;;) { const a = pick([5, 10, 15, 20, 25, 30, 35, 40, 45]), b = a + pick([5, 10, 15, 20]); if (b <= 80) return { a, b, c: pick([['la part des élèves qui viennent à vélo', 'élèves'], ['la part des foyers équipés de la fibre', 'foyers'], ['la part des électeurs qui ont voté', 'électeurs'], ['la part des ventes en ligne', 'ventes']]) }; } },
  ex: { a: 20, b: 35, c: ['la part des élèves qui viennent à vélo', 'élèves'] },
  build({ a, b, c }) {
    const g = b - a, pt = n => `${dec(n)} point${n > 1 ? 's' : ''}`;
    return {
      html: `Dans un lycée, ${c[0]} passe de ${a}&nbsp;% à ${b}&nbsp;%. De combien de <b>points de pourcentage</b> cette part a-t-elle augmenté ?`,
      good: { l: pt(g), n: g },
      bads: [
        { l: pt(100 * g / a), n: 100 * g / a, why: 'Tu as calculé le taux d’évolution relatif ' + F(g, a) + ' (en %) : on te demande la simple différence des deux pourcentages.' },
        { l: pt(a + b), n: a + b, why: 'Tu as additionné les deux pourcentages.' },
        { l: pt(100 * b / a), n: 100 * b / a, why: 'Tu as calculé le coefficient (' + F(b, a) + ') : on te demande la différence des deux parts.' },
        { l: pt(g + 5), n: g + 5, why: 'Vérifie ta soustraction ' + b + ' − ' + a + '.' },
      ],
      hint: `Les deux parts s’expriment déjà en pourcentages : il suffit de faire la différence ${b} − ${a}.`,
      solution: `${b} % − ${a} % = ${g} points de pourcentage.`,
      indep: () => b - a,
    };
  },
};
const barrePct = () => {
  let s = `<svg viewBox="0 0 440 78" class="vis" role="img" aria-label="25 pour cent d’une barre">`;
  s += `<rect x="20" y="14" width="400" height="26" fill="none" stroke="#555" stroke-width="2"/><rect x="20" y="14" width="100" height="26" fill="var(--acc)" opacity=".6"/>`;
  s += `<text x="70" y="58" text-anchor="middle" font-size="14" fill="#333">25 %</text><text x="20" y="10" font-size="12" fill="#555">0</text><text x="420" y="10" font-size="12" text-anchor="end" fill="#555">100 %</text><text x="320" y="58" text-anchor="middle" font-size="14" fill="#333">le total</text></svg>`;
  return s;
};
const LV4 = niveau('Proportions et pourcentages', [pctDe, calcProp, propProp, total, points], {
  n: 4, classe: '2de – 1re',
  intro: 'Les pourcentages interviennent dans presque tous les QCM d’automatismes : il faut savoir en appliquer un, calculer une proportion, et enchaîner deux proportions.',
  def: 'Un pourcentage est une proportion rapportée à 100 : <b>p % d’une quantité = quantité × p ÷ 100</b>. La proportion d’une partie dans un total est <b>partie ÷ total</b>.',
  visuel: barrePct(),
  methode: ['<b>Appliquer</b> : 10 % = ÷ 10, 50 % = ÷ 2, 25 % = ÷ 4 ; on décompose les autres (15 % = 10 % + 5 %).', '<b>Calculer une proportion</b> : partie ÷ total, puis × 100.', '<b>Proportion de proportion</b> : on <b>multiplie</b> les proportions (50 % de 40 % = 0,5 × 0,4 = 20 %).', '<b>Retrouver le total</b> : combien vaut 1 % ? puis 100 %.', 'Une différence de deux pourcentages se dit en <b>points</b> de pourcentage.'],
  warn: ['25 % de 80 se calcule 80 × 0,25 (pas 80 ÷ 25).', 'Deux pourcentages qui s’enchaînent ne s’additionnent pas : 50 % de 40 % ≠ 90 %.', 'Si 25 % d’un total valent 30, le total n’est pas 7,5 : c’est 30 × 4 = 120.'],
  retenir: 'p % de x = x × p ÷ 100 ; proportion = partie ÷ total ; proportion de proportion = produit.',
});

export { LV3, LV4 };

// Niveau 11 : probabilités (tableau croisé, arbre, probabilités conditionnelles).
import { ri, pick, shuffle, M, F, big, dec, niveau } from './outils.js';
import { r6 } from '../../engine/util/arith.js';
import { crossTable, ptree } from '../probas-lycee/draw.js';

const bar = s => `<span style="text-decoration:overline">${s}</span>`;
const Pr = s => `P(${s})`;
const Pc = (a, b) => `P<sub>${a}</sub>(${b})`;
const opt = (l, n, why) => ({ l, n, why });
const nice = v => Math.abs(v * 1000 - Math.round(v * 1000)) < 1e-9;

const CTX = [
  { who: 'élèves d’un lycée', A: ['une fille', 'une fille', 'filles', 'garçons'], B: ['demi-pensionnaire', 'demi-pensionnaire', 'demi-pensionnaires', 'externes'] },
  { who: 'clients d’un magasin', A: ['une femme', 'une femme', 'femmes', 'hommes'], B: ['titulaire de la carte de fidélité', 'titulaire de la carte', 'titulaires de la carte', 'sans carte'] },
  { who: 'salariés d’une entreprise', A: ['un cadre', 'un cadre', 'cadres', 'non-cadres'], B: ['en télétravail', 'en télétravail', 'télétravailleurs', 'présentiels'] },
  { who: 'adhérents d’un club de sport', A: ['un adulte', 'un adulte', 'adultes', 'mineurs'], B: ['inscrit en compétition', 'inscrit en compétition', 'compétiteurs', 'loisirs'] },
  { who: 'spectateurs d’un festival', A: ['un jeune', 'un jeune', 'jeunes', 'plus âgés'], B: ['venu en camping', 'venu en camping', 'campeurs', 'non-campeurs'] },
  { who: 'habitants d’une ville', A: ['un propriétaire', 'un propriétaire', 'propriétaires', 'locataires'], B: ['cycliste', 'cycliste', 'cyclistes', 'non-cyclistes'] },
  { who: 'patients d’un cabinet médical', A: ['une femme', 'une femme', 'femmes', 'hommes'], B: ['fumeur', 'fumeur', 'fumeurs', 'non-fumeurs'] },
  { who: 'abonnés d’une médiathèque', A: ['un adulte', 'un adulte', 'adultes', 'enfants'], B: ['lecteur de BD', 'lecteur de BD', 'lecteurs de BD', 'autres lecteurs'] },
];
const defs = c => `On choisit au hasard l’un des ${c.who}. On note A l’événement « c’est ${c.A[0]} » et B l’événement « c’est ${c.B[0] === 'demi-pensionnaire' ? 'un demi-pensionnaire' : c.B[0].startsWith('titulaire') ? 'un titulaire de la carte' : c.B[0].startsWith('en ') ? 'une personne ' + c.B[0] : c.B[0].startsWith('inscrit') ? 'un inscrit en compétition' : c.B[0].startsWith('venu') ? 'un spectateur venu en camping' : 'un ' + c.B[0]} ».`;

/** tableau croisé : cellules [[AB, A∩B̄], [Ā∩B, Ā∩B̄]] avec des probabilités « décimales propres » */
function tirerTableau() {
  for (;;) {
    const N = pick([100, 100, 200, 50, 40]), nAB = ri(2, Math.floor(N / 2)), nAb = ri(2, Math.floor(N / 2)), naB = ri(2, Math.floor(N / 2));
    const nab = N - nAB - nAb - naB;
    if (nab < 2) continue;
    const nA = nAB + nAb, nB = nAB + naB;
    if (nice(nAB / N) && nice(nAB / nA) && nice(nAB / nB) && nAB / nA !== nAB / nB && nA !== nB && nA !== N / 2 && nB !== N / 2) return { N, cells: [[nAB, nAb], [naB, nab]], c: pick(CTX) };
  }
}
const tab = (c, cells) => crossTable({ rows: [c.A[2][0].toUpperCase() + c.A[2].slice(1), c.A[3][0].toUpperCase() + c.A[3].slice(1)], cols: [c.B[2][0].toUpperCase() + c.B[2].slice(1), c.B[3][0].toUpperCase() + c.B[3].slice(1)], cells, tot: true });
const legend = c => `${defs(c)} (A : ${c.A[2]} ; B : ${c.B[2]}.)`;
/** vérification indépendante : on reconstruit la liste des individus et on recompte */
const recount = cells => { const L = []; cells.forEach((r, i) => r.forEach((n, j) => { for (let k = 0; k < n; k++) L.push([i === 0, j === 0]); })); return L; };
const pcl = v => dec(r6(v));
const base = (id, dmin, titre, lab, calc, why, hintF, solF) => ({
  id, dmin, titre,
  draw: tirerTableau,
  ex: { N: 100, cells: [[24, 16], [21, 39]], c: CTX[0] },
  build({ N, cells, c }) {
    const [[a, b], [cc, d]] = cells, nA = a + b, nB = a + cc, L = recount(cells), g = calc({ N, a, b, cc, d, nA, nB });
    const bads = why({ N, a, b, cc, d, nA, nB }).map(([v, w]) => opt(pcl(v), r6(v), w));
    return {
      html: `${legend(c)} Le tableau donne les effectifs.${tab(c, cells)}Quelle est la valeur de <b>${lab}</b> ?`,
      good: { l: pcl(g), n: r6(g) }, bads,
      hint: hintF({ N, a, b, cc, d, nA, nB }),
      solution: solF({ N, a, b, cc, d, nA, nB }),
      indep: () => {
        const A = L.filter(x => x[0]), B = L.filter(x => x[1]), AB = L.filter(x => x[0] && x[1]);
        return r6(id === 'pb-inter' ? AB.length / L.length : id === 'pb-cond' ? AB.length / A.length : AB.length / B.length);
      },
    };
  },
});
const inter = base('pb-inter', 0, 'P(A ∩ B) avec un tableau croisé', 'P(A ∩ B)',
  ({ N, a }) => a / N,
  ({ N, a, b, cc, nA, nB }) => [[a / nA, 'C’est P<sub>A</sub>(B) : on a divisé par l’effectif de A (' + nA + ') et non par l’effectif total (' + N + ').'], [a / nB, 'C’est P<sub>B</sub>(A) : on a divisé par l’effectif de B (' + nB + ') et non par l’effectif total (' + N + ').'], [nA / N, 'C’est P(A) : tu as pris toute la ligne de A, mais A <b>et</b> B correspond à une seule case.'], [nB / N, 'C’est P(B) : tu as pris toute la colonne de B.'], [(nA / N) * (nB / N), 'Tu as multiplié P(A) par P(B) : cela n’est valable que pour des événements indépendants.']],
  ({ N, a }) => `P(A ∩ B) : la case « A et B » du tableau (à l’intersection de la ligne A et de la colonne B), divisée par l’effectif <b>total</b> ${N}.`,
  ({ N, a }) => `Effectif de A ∩ B : ${a} ; effectif total : ${N}. P(A ∩ B) = ${a} ÷ ${N} = ${pcl(a / N)}.`);
const cond = base('pb-cond', 1, 'P<sub>A</sub>(B) avec un tableau croisé', 'P<sub>A</sub>(B)',
  ({ a, nA }) => a / nA,
  ({ N, a, b, cc, d, nA, nB }) => [[a / N, 'C’est P(A ∩ B) : on a divisé par le total (' + N + '). Pour P<sub>A</sub>(B) on ne garde que les individus de A.'], [a / nB, 'C’est P<sub>B</sub>(A) : tu as divisé par l’effectif de B (' + nB + ') ; ici on « sait » que A est réalisé, on divise par l’effectif de A (' + nA + ').'], [cc / (cc + d), 'C’est P<sub>Ā</sub>(B) : tu as pris la ligne de Ā.'], [nA / N, 'C’est P(A), pas une probabilité de B sachant A.'], [b / nA, 'C’est P<sub>A</sub>(B̄) : la case « A et non B ».']],
  ({ a, nA }) => `P<sub>A</sub>(B) = « parmi les individus de A, la proportion de B » : on se place dans la ligne de A (effectif ${nA}) et on regarde la case « A et B » (${a}).`,
  ({ a, nA }) => `Effectif de A : ${nA}, dont ${a} dans B. P<sub>A</sub>(B) = ${a} ÷ ${nA} = ${pcl(a / nA)}.`);
const condInv = base('pb-cond-inv', 2, 'P<sub>B</sub>(A) avec un tableau croisé', 'P<sub>B</sub>(A)',
  ({ a, nB }) => a / nB,
  ({ N, a, b, cc, d, nA, nB }) => [[a / N, 'C’est P(A ∩ B) : on a divisé par le total (' + N + ').'], [a / nA, 'C’est P<sub>A</sub>(B) : tu as divisé par l’effectif de A (' + nA + ') ; on veut P<sub>B</sub>(A), donc on se place dans la colonne de B (effectif ' + nB + ').'], [b / (b + d), 'C’est P<sub>B̄</sub>(A) : tu as pris la colonne de B̄.'], [nB / N, 'C’est P(B), pas une probabilité de A sachant B.'], [cc / nB, 'C’est P<sub>B</sub>(Ā) : la case « Ā et B ».']],
  ({ a, nB }) => `P<sub>B</sub>(A) = « parmi les individus de B, la proportion de A » : on se place dans la colonne de B (effectif ${nB}) et on regarde la case « A et B » (${a}).`,
  ({ a, nB }) => `Effectif de B : ${nB}, dont ${a} dans A. P<sub>B</sub>(A) = ${a} ÷ ${nB} = ${pcl(a / nB)}.`);
// condInv.ex : valeurs différentes pour P_A(B) et P_B(A) : le tableau d'exemple (24 ; 16 ; 21 ; 39) convient (nA = 40, nB = 45)

const VOC = [
  ['inter', (c, A, B) => `la proportion des ${c.who} qui sont à la fois ${A} et ${B}`, 'A ∩ B', (a, b) => `P(A ∩ B)`],
  ['condAB', (c, A, B) => `la proportion de ${B} parmi les ${A}`, 'B sachant A', () => `P<sub>A</sub>(B)`],
  ['condBA', (c, A, B) => `la proportion de ${A} parmi les ${B}`, 'A sachant B', () => `P<sub>B</sub>(A)`],
];
const vocab = {
  id: 'pb-vocab', dmin: 2, titre: 'traduire une phrase par P(A ∩ B), P<sub>A</sub>(B) ou P<sub>B</sub>(A)',
  draw() { return { c: pick(CTX), k: ri(0, 2) }; },
  ex: { c: CTX[2], k: 1 },
  build({ c, k }) {
    const A = c.A[2], B = c.B[2], t = VOC[k];
    const L = ['P(A ∩ B)', 'P<sub>A</sub>(B)', 'P<sub>B</sub>(A)', 'P(A)'];
    const good = L[k];
    const whys = [
      'Pas de « sachant » ici : on compte les individus qui sont A <b>et</b> B, parmi tous les ' + c.who + '.',
      'Ici, on <b>se restreint</b> aux ' + A + ' (les « parmi les ' + A + ' »), puis on regarde ' + B + ' : P<sub>A</sub>(B).',
      'Ici, on <b>se restreint</b> aux ' + B + ' (les « parmi les ' + B + ' »), puis on regarde ' + A + ' : P<sub>B</sub>(A).',
      'P(A) est la proportion de ' + A + ' parmi tous les ' + c.who + ', sans condition sur B.',
    ];
    return {
      html: `${defs(c)} Quelle écriture traduit « ${t[1](c, A, B)} » ?`,
      good: { l: good, n: good },
      bads: L.map((l, i) => i === k ? null : opt(l, l, i === 3 ? whys[3] : k === 0 ? 'Cette écriture est une probabilité <b>conditionnelle</b> (« parmi… »), alors que la phrase compte les individus à la fois ' + A + ' et ' + B + '.' : whys[i] === whys[k] ? '' : (i === 0 ? 'Cette écriture compte les individus qui sont A et B sur <b>tous</b> les ' + c.who + ' : la phrase dit « parmi… ».' : 'Les rôles de A et B sont inversés : « parmi les X » désigne l’événement sur lequel on se restreint (le « sachant »).'))).filter(Boolean),
      hint: k === 0 ? `Dans la phrase, y a-t-il « parmi… » (on restreint à un groupe) ? Ici on compte les ${c.A[2]} qui sont <b>aussi</b> ${c.B[2]}, dans l’ensemble de tous les ${c.who}.` : `Repère « parmi les ${k === 1 ? A : B} » : c’est le groupe de référence, celui qu’on écrit en <b>indice</b> de P ; l’événement observé va entre parenthèses.`,
      solution: `${k === 0 ? 'Il n’y a pas de condition : « ' + A + ' et ' + B + ' » parmi tous les ' + c.who + '.' : 'Le groupe de référence (« parmi les ' + (k === 1 ? A : B) + ' ») est ' + (k === 1 ? 'A' : 'B') + ', l’événement observé est ' + (k === 1 ? 'B' : 'A') + '.'} On écrit ${good}.`,
      indep: () => (k === 0 ? 'P(A ∩ B)' : k === 1 ? 'P<sub>A</sub>(B)' : 'P<sub>B</sub>(A)'),
    };
  },
};

/* ---- arbres ---- */
const dd = v => dec(r6(v));
function tirerArbre(strict) {
  for (;;) {
    const p = ri(2, 8) / 10, q = ri(1, 9) / 10, r = ri(1, 9) / 10;
    if (q === r) continue;
    const pab = p * q, pb = p * q + (1 - p) * r;
    if (!nice(pab) || !nice(pb)) continue;
    if (strict && !nice(pab / pb)) continue;
    if (strict && (pab / pb === q || pab / pb === pab)) continue;
    return { p, q, r };
  }
}
const arbre = ({ p, q, r }) => ptree([{ e: 'A', p: dd(p), kids: [{ e: 'B', p: dd(q) }, { e: '!B', p: dd(1 - q) }] }, { e: '!A', p: dd(1 - p), kids: [{ e: 'B', p: dd(r) }, { e: '!B', p: dd(1 - r) }] }], { leaf: 'cap' });
/** modèle « urne » : 100 tickets pour A, puis 100 pour B dans chaque cas ; on dénombre les 10⁴ issues */
const urne = ({ p, q, r }) => { let AB = 0, B = 0, A = 0; for (let i = 0; i < 100; i++) for (let j = 0; j < 100; j++) { const a = i < Math.round(p * 100), b = j < Math.round((a ? q : r) * 100); if (a) A++; if (b) B++; if (a && b) AB++; } return { A: A / 1e4, B: B / 1e4, AB: AB / 1e4 }; };
const arbreInter = {
  id: 'pb-arbre-inter', dmin: 3, titre: 'P(A ∩ B) avec un arbre pondéré',
  draw: () => tirerArbre(false),
  ex: { p: 0.4, q: 0.5, r: 0.3 },
  build({ p, q, r }) {
    const g = p * q;
    return {
      html: `Un arbre pondéré modélise une expérience aléatoire.${arbre({ p, q, r })}Quelle est la valeur de <b>P(A ∩ B)</b> ?`,
      good: { l: dd(g), n: r6(g) },
      bads: [opt(dd(p + q), r6(p + q), 'Tu as additionné : sur un arbre, on <b>multiplie</b> les probabilités le long d’un chemin.'), opt(dd(q), r6(q), 'C’est P<sub>A</sub>(B) (la 2<sup>e</sup> branche seule) : il faut la multiplier par P(A).'), opt(dd((1 - p) * r), r6((1 - p) * r), 'C’est P(Ā ∩ B) : tu as pris le chemin qui passe par Ā.'), opt(dd(p * r), r6(p * r), 'Tu as multiplié P(A) par une branche issue de Ā : la 2<sup>e</sup> branche du chemin A → B vaut ' + dd(q) + '.'), opt(dd(p * q * 10), r6(p * q * 10), 'Décalage de virgule dans le produit.')],
      hint: `Le chemin qui mène à « A puis B » passe par la branche A (${dd(p)}) puis par la branche B <b>issue de A</b> (${dd(q)}) : on multiplie les deux.`,
      solution: `P(A ∩ B) = P(A) × P<sub>A</sub>(B) = ${dd(p)} × ${dd(q)} = ${dd(g)}.`,
      indep: () => r6(urne({ p, q, r }).AB),
    };
  },
};
const arbreTotal = {
  id: 'pb-arbre-tot', dmin: 4, titre: 'P(B) avec un arbre pondéré (probabilités totales)',
  draw: () => tirerArbre(false),
  ex: { p: 0.4, q: 0.5, r: 0.3 },
  build({ p, q, r }) {
    const g = p * q + (1 - p) * r;
    return {
      html: `Un arbre pondéré modélise une expérience aléatoire.${arbre({ p, q, r })}Quelle est la valeur de <b>P(B)</b> ?`,
      good: { l: dd(g), n: r6(g) },
      bads: [opt(dd(p * q), r6(p * q), 'C’est P(A ∩ B) : B se réalise aussi par le chemin qui passe par Ā.'), opt(dd(q + r), r6(q + r), 'Tu as additionné les deux branches B sans les multiplier par P(A) et P(Ā).'), opt(dd((q + r) / 2), r6((q + r) / 2), 'Ce n’est pas une moyenne simple : les deux chemins n’ont pas le même poids (P(A) et P(Ā)).'), opt(dd(p * q + r), r6(p * q + r), 'La 2<sup>e</sup> branche doit aussi être multipliée par P(Ā) = ' + dd(1 - p) + '.'), opt(dd(q * (1 - p) + p * r), r6(q * (1 - p) + p * r), 'Tu as croisé les branches : chaque chemin multiplie P(A) par P<sub>A</sub>(B), et P(Ā) par P<sub>Ā</sub>(B).')],
      hint: `B s’obtient par <b>deux chemins</b> : A → B (${dd(p)} × ${dd(q)}) et Ā → B (${dd(1 - p)} × ${dd(r)}). Calcule chaque produit, puis additionne.`,
      solution: `P(B) = P(A ∩ B) + P(Ā ∩ B) = ${dd(p)} × ${dd(q)} + ${dd(1 - p)} × ${dd(r)} = ${dd(p * q)} + ${dd((1 - p) * r)} = ${dd(g)}.`,
      indep: () => r6(urne({ p, q, r }).B),
    };
  },
};
const arbreInv = {
  id: 'pb-arbre-inv', dmin: 5, titre: 'P<sub>B</sub>(A) avec un arbre pondéré',
  draw: () => tirerArbre(true),
  ex: { p: 0.4, q: 0.5, r: 0.3 },
  build({ p, q, r }) {
    const pb = p * q + (1 - p) * r, g = p * q / pb;
    return {
      html: `Un arbre pondéré modélise une expérience aléatoire.${arbre({ p, q, r })}Quelle est la valeur de <b>P<sub>B</sub>(A)</b> ?`,
      good: { l: dd(g), n: r6(g) },
      bads: [opt(dd(p * q), r6(p * q), 'C’est P(A ∩ B) : pour P<sub>B</sub>(A), il faut diviser par P(B).'), opt(dd(q), r6(q), 'C’est P<sub>A</sub>(B) (lue sur l’arbre), pas P<sub>B</sub>(A) : les rôles de A et B sont inversés.'), opt(dd(1 - g), r6(1 - g), 'C’est P<sub>B</sub>(Ā) : le complémentaire.'), opt(dd(p * q / ((1 - p) * r)), r6(p * q / ((1 - p) * r)), 'Tu as divisé P(A ∩ B) par P(Ā ∩ B) : il faut diviser par P(B) = P(A ∩ B) + P(Ā ∩ B).'), opt(dd(p), r6(p), 'C’est P(A), sans condition.')],
      hint: `P<sub>B</sub>(A) = P(A ∩ B) ÷ P(B). Calcule d’abord P(A ∩ B) = ${dd(p)} × ${dd(q)}, puis P(B) en additionnant les deux chemins qui mènent à B.`,
      solution: `P(A ∩ B) = ${dd(p)} × ${dd(q)} = ${dd(p * q)}. P(B) = ${dd(p * q)} + ${dd(1 - p)} × ${dd(r)} = ${dd(pb)}. P<sub>B</sub>(A) = ${dd(p * q)} ÷ ${dd(pb)} = ${dd(g)}.`,
      indep: () => { const u = urne({ p, q, r }); return r6(u.AB / u.B); },
    };
  },
};
const LV11 = niveau('Probabilités : tableau, arbre, probabilités conditionnelles', [inter, cond, condInv, vocab, arbreInter, arbreTotal, arbreInv], {
  n: 11, classe: '1re',
  intro: 'En probabilités conditionnelles, l’erreur n’est presque jamais dans le calcul, mais dans le choix de la bonne case ou de la bonne division : on ne confond plus P(A ∩ B), P<sub>A</sub>(B) et P<sub>B</sub>(A).',
  def: '<b>P(A ∩ B)</b> : proportion de « A et B » dans <i>tout</i> l’ensemble. <b>P<sub>A</sub>(B)</b> = P(A ∩ B) ÷ P(A) : proportion de B <i>parmi les A</i>. <b>P<sub>B</sub>(A)</b> = P(A ∩ B) ÷ P(B) : proportion de A <i>parmi les B</i>.<br>Sur un arbre : on <b>multiplie</b> le long d’un chemin, on <b>additionne</b> les chemins qui mènent à un même événement.',
  visuel: arbre({ p: 0.4, q: 0.5, r: 0.3 }),
  methode: ['Tableau : P(A ∩ B) = case ÷ total ; P<sub>A</sub>(B) = case ÷ total de la <b>ligne</b> A ; P<sub>B</sub>(A) = case ÷ total de la <b>colonne</b> B.', 'Dans l’écriture P<sub>A</sub>(B), l’<b>indice</b> est la condition : le groupe sur lequel on se restreint (« sachant A », « parmi les A »).', 'Arbre : P(A ∩ B) = P(A) × P<sub>A</sub>(B).', 'Probabilités totales : P(B) = P(A ∩ B) + P(Ā ∩ B).', 'Inversion : P<sub>B</sub>(A) = P(A ∩ B) ÷ P(B).'],
  warn: ['P<sub>A</sub>(B) et P<sub>B</sub>(A) sont en général différentes.', 'Sur un arbre, la probabilité d’une 2<sup>e</sup> branche est déjà conditionnelle : on la multiplie par celle de la 1<sup>re</sup>.', 'P(A) × P(B) n’est égal à P(A ∩ B) que si A et B sont indépendants.'],
  retenir: 'le « sachant » est l’indice : P<sub>A</sub>(B) = P(A ∩ B) ÷ P(A).',
});

export { LV11 };

// Niveaux 10 à 12 : fréquence et probabilité ; tableau croisé et fréquences conditionnelles ; nuage de points et ajustement affine.
import { ri, pick, shuffle, chance, M, P, big, lst, pc, fv, plus, somme, rNums, rChoice, niveau, melange } from './outils.js';
import { sum, range, rnd, entier, dec, cherche, mean } from './stat.js';
import { tab, nuage, readNuage, courbeFreq, readFreqFin, barresCond } from './draw.js';
import { random } from '../../engine/util/rand.js';
import { terms } from '../../engine/util/fmt.js';

/* ===================================================================== 10. fréquence et probabilité */
const SC_FREQ = [
  { t: (n, k) => `On lance ${M(n)} fois un dé équilibré à six faces : la face « 6 » sort ${M(k)} fois.`, ev: 'la face « 6 »', p: 1 / 6, pt: '1/6', sim: 'le lancer d’un dé équilibré à six faces (événement : obtenir « 6 »)' },
  { t: (n, k) => `On lance ${M(n)} fois une pièce équilibrée : « pile » sort ${M(k)} fois.`, ev: '« pile »', p: 0.5, pt: '0,5', sim: 'le lancer d’une pièce équilibrée (événement : obtenir « pile »)' },
  { t: (n, k) => `Une roue est partagée en 4 secteurs égaux dont un est rouge. On la fait tourner ${M(n)} fois : elle s’arrête ${M(k)} fois sur le rouge.`, ev: 'le rouge', p: 0.25, pt: '0,25', sim: 'une roue de 4 secteurs égaux dont un est rouge (événement : s’arrêter sur le rouge)' },
  { t: (n, k) => `Dans une urne, on tire une boule avec remise, ${M(n)} fois. La boule est rouge ${M(k)} fois.`, ev: 'une boule rouge', p: null, pt: '', sim: 'le tirage d’une boule dans une urne (événement : obtenir une boule rouge)' },
];
const freqObs = {
  id: 'freq-obs', dmin: 0, titre: 'fréquence observée',
  draw: d => cherche(() => { const n = pick(d < 2 ? [50, 100, 200] : [100, 200, 250, 400, 500, 1000]), s = ri(0, 3), p = SC_FREQ[s].p || 0.3, k = Math.round(n * p) + ri(-Math.round(n * 0.08), Math.round(n * 0.08)); return { s, n, k }; }, t => t.k > 0 && dec(t.k / t.n) >= 0 && dec(t.k / t.n) <= 3),
  build: p => {
    const S = SC_FREQ[p.s], { n, k } = p, f = k / n;
    return { ...rNums([f], { tpl: 'Fréquence : {0}', value: f, near: [[[k, `${M(k)} est l’effectif : la fréquence observée est cet effectif divisé par le nombre d’essais ${M(n)}.`], [rnd(f * 100, 3), 'C’est la fréquence en pourcentage : on demande ici un nombre décimal entre 0 et 1.']]] }),
      html: `${S.t(n, k)} Quelle est la fréquence observée de ${S.ev} ? (écris-la sous forme décimale)`,
      hint: `La fréquence observée est le nombre de fois où ${S.ev} apparaît (${M(k)}) divisé par le nombre d’essais (${M(n)}).`,
      solution: `Fréquence observée : ${M(k)} ÷ ${M(n)} = <b>${M(f)}</b>.` };
  },
  ex: { s: 1, n: 200, k: 94 },
};

const PROBAS = [
  { t: (n, p) => `D’après la fabrication, la probabilité qu’un composant soit défectueux est ${M(p)}. On contrôle ${M(n)} composants.`, q: 'Combien de composants défectueux peut-on s’attendre à trouver, environ ?', n: [100, 200, 500, 1000], p: [0.01, 0.02, 0.05, 0.1] },
  { t: (n, p) => `La probabilité qu’un lancer franc réussisse est ${M(p)}. Une joueuse tente ${M(n)} lancers francs.`, q: 'Combien de lancers francs réussis peut-on s’attendre à observer, environ ?', n: [20, 50, 100, 200], p: [0.4, 0.5, 0.6, 0.8] },
  { t: (n, p) => `La probabilité qu’un voyageur arrive en retard à un rendez-vous est ${M(p)}. On observe ${M(n)} voyageurs.`, q: 'Combien de voyageurs en retard peut-on s’attendre à observer, environ ?', n: [50, 100, 200, 500], p: [0.1, 0.2, 0.25, 0.3] },
];
const espNb = {
  id: 'esp-nb', dmin: 0, titre: 'nombre de réalisations attendu',
  draw: d => cherche(() => { const i = ri(0, PROBAS.length - 1), S = PROBAS[i]; return { i, n: pick(S.n), p: pick(S.p) }; }, t => entier(t.n * t.p) && t.n * t.p >= 2),
  build: p => {
    const S = PROBAS[p.i], { n, p: pr } = p, r = rnd(n * pr, 4);
    return { ...rNums([r], { tpl: 'Environ : {0}', value: r, near: [[[pr, 'C’est la probabilité : multiplie-la par le nombre d’essais pour estimer le nombre de réalisations.'], [rnd(n * pr * 100, 3), 'Tu as multiplié par 100 : la probabilité est déjà un nombre décimal entre 0 et 1.']]] }),
      html: `${S.t(n, pr)} ${S.q}`,
      hint: `Sur un grand nombre d’essais, la fréquence observée est proche de la probabilité ${M(pr)} : multiplie ${M(pr)} par le nombre d’essais ${M(n)}.`,
      solution: `La fréquence observée est proche de la probabilité ${M(pr)}.<br>Nombre attendu : ${M(n)} × ${M(pr)} = <b>${M(r)}</b>. (C’est une valeur approchée : le résultat réel fluctue autour de ce nombre.)` };
  },
  ex: { i: 0, n: 500, p: 0.05 },
};

const simulLire = {
  id: 'simul-lire', dmin: 1, titre: 'fréquences d’une simulation',
  draw: d => cherche(() => { const s = ri(0, 2), p = [1 / 6, 0.5, 0.25][s]; const ks = [10, 100, 1000].map(n => Math.round(n * p) + (n === 10 ? ri(-2, 2) : n === 100 ? ri(-6, 6) : ri(-25, 25))); return { s, ks }; }, t => t.ks[0] > 0 && t.ks[1] > 0 && t.ks[2] > 0),
  build: p => {
    const { s, ks } = p, S = SC_FREQ[s], ns = [10, 100, 1000], fr = ks.map((k, i) => k / ns[i]);
    const ev = S.ev, pth = S.p;
    return { ...rNums([fr[1], fr[2]], { tpl: 'Pour 100 essais : {0} Pour 1000 essais : {1}', value: fr[2], near: [[[ks[1], `${M(ks[1])} est l’effectif : divise-le par le nombre d’essais 100.`]], [[ks[2], `${M(ks[2])} est l’effectif : divise-le par le nombre d’essais 1000.`]]] }),
      html: `On simule ${S.sim} avec un tableur.${tab([['Nombre d’essais', 10, 100, 1000], ['Effectif de l’événement', ...ks]])}Calcule la fréquence observée de l’événement pour 100 essais, puis pour 1 000 essais.`,
      hint: `Pour chaque ligne, divise l’effectif de l’événement (${M(ks[1])} pour 100 essais, ${M(ks[2])} pour 1000 essais) par le nombre d’essais correspondant.`,
      solution: `Pour 100 essais : ${M(ks[1])} ÷ 100 = <b>${M(fr[1])}</b>.<br>Pour 1000 essais : ${M(ks[2])} ÷ 1000 = <b>${M(fr[2])}</b>.<br>(Pour 10 essais, ${M(ks[0])} ÷ 10 = ${M(fr[0])} : plus il y a d’essais, plus la fréquence se stabilise.)` };
  },
  ex: { s: 1, ks: [7, 54, 493] },
};

const probaFreq = {
  id: 'proba-freq', dmin: 1, titre: 'fréquence observée et probabilité',
  draw: d => { const n = pick([10, 12, 20]), k = Math.round(n / 2) + pick([-1, 1]) * pick([Math.round(n * 0.2), Math.round(n * 0.3)]); return { n, k }; },
  build: p => {
    const { n, k } = p, f = k / n;
    if (k <= 0 || k >= n) return null;
    const items = [
      { l: 'Non : sur un petit nombre de lancers, la fréquence observée peut s’écarter de 0,5 sans que la pièce soit truquée.', ok: true },
      { l: `Oui : la fréquence ${M(rnd(f, 2))} est différente de 0,5, donc la pièce est truquée.`, why: 'Une fréquence observée n’est presque jamais exactement égale à la probabilité, surtout avec peu d’essais.' },
      { l: 'Oui : la probabilité de « pile » est maintenant égale à la fréquence observée.', why: 'La probabilité d’un événement est une propriété de la pièce, elle ne change pas avec les résultats observés.' },
      { l: `Non : au lancer suivant, « face » sortira forcément pour compenser les ${M(k)} « pile ».`, why: 'Les lancers sont indépendants : la pièce n’a pas de mémoire et ne « compense » pas.' },
    ];
    return { ...rChoice(items, { indep: items[0].l }),
      html: `On pense qu’une pièce est équilibrée (probabilité de « pile » égale à 0,5). On la lance ${M(n)} fois : « pile » sort ${M(k)} fois, soit une fréquence de ${M(rnd(f, 2))}. Quelle phrase est exacte ?`,
      hint: `Avec seulement ${M(n)} lancers, regarde si ${M(k)} « pile » sur ${M(n)} est surprenant, et rappelle-toi à quoi la fréquence observée ressemble quand le nombre de lancers augmente.`,
      solution: `La fréquence observée ${M(rnd(f, 2))} fluctue autour de la probabilité 0,5 : avec ${M(n)} lancers seulement, un écart de ce genre est normal.<br>On ne peut donc pas conclure que la pièce est truquée. La probabilité ne change pas, et chaque lancer est indépendant des précédents.` };
  },
  ex: { n: 10, k: 7 },
};

const procheP = {
  id: 'proche-p', dmin: 2, titre: 'quelle fréquence est la plus proche de la probabilité ?',
  draw: d => cherche(() => {
    const s = ri(0, 2), p = [0.5, 0.25, 0.2][s], ns = [10, 100, 1000, 10000], devs = [ri(8, 25) / 100, ri(3, 8) / 100, ri(1, 3) / 100, ri(0, 1) / 100];
    const fr = ns.map((n, i) => rnd(p + pick([-1, 1]) * devs[i], 3));
    return { s, p, ns, fr };
  }, t => { const e = t.fr.map(f => Math.abs(f - t.p)); const m = Math.min(...e); return e.filter(x => Math.abs(x - m) < 1e-9).length === 1 && t.fr.every(f => f > 0 && f < 1) && new Set(t.fr).size === 4; }),
  build: p => {
    const { s, p: pr, ns, fr } = p, e = fr.map(f => Math.abs(f - pr)), im = e.indexOf(Math.min(...e));
    const nom = ['lance d’un dé équilibré (événement « face paire », probabilité 0,5)', 'tirage dans une urne (événement « boule rouge », probabilité 0,25)', 'tirage dans une urne (événement « boule verte », probabilité 0,2)'][s];
    const ent = n => String(n).replace(/\B(?=(\d{3})+(?!\d))/g, '\u00a0');
    const items = ns.map((n, i) => ({ l: `Pour ${ent(n)} essais`, ok: i === im, why: `Pour ${ent(n)} essais, la fréquence ${M(fr[i])} s’écarte de ${M(pr)} de ${M(rnd(e[i], 3))} : regarde les écarts des quatre fréquences.` }));
    return { ...rChoice(items, { ordre: true, indep: `Pour ${ent(ns[im])} essais` }),
      html: `On simule un ${nom} avec des nombres d’essais de plus en plus grands.${tab([['Nombre d’essais', ...ns.map(ent)], ['Fréquence observée', ...fr]])}Pour quel nombre d’essais la fréquence observée est-elle la plus proche de la probabilité ${M(pr)} ?`,
      hint: `Calcule, pour chaque colonne du tableau, l’écart entre la fréquence observée (${fr.map(M).join(' ; ')}) et la probabilité ${M(pr)}, puis cherche le plus petit écart.`,
      solution: `Écarts avec ${M(pr)} : ${ns.map((n, i) => `${M(rnd(e[i], 3))} (pour ${ent(n)})`).join(' ; ')}.<br>Le plus petit écart est ${M(rnd(e[im], 3))} : <b>${items[im].l.toLowerCase()}</b>. En général, plus le nombre d’essais est grand, plus la fréquence observée est proche de la probabilité.` };
  },
  ex: { s: 1, p: 0.25, ns: [10, 100, 1000, 10000], fr: [0.4, 0.31, 0.262, 0.25] },
};

const estimP = {
  id: 'estim-p', dmin: 2, titre: 'estimer une proportion par simulation',
  draw: d => cherche(() => { const n = pick([200, 500, 1000]), N = pick([20, 25, 40, 50]), k = Math.round(n * ri(10, 45) / 100); return { n, N, k }; }, t => dec(t.k / t.n) >= 0 && dec(t.k / t.n) <= 3 && entier(t.k / t.n * t.N) && t.k > 0),
  build: p => {
    const { n, N, k } = p, f = k / n, r = rnd(f * N, 4);
    return { ...rNums([f, r], { tpl: 'Fréquence : {0} Nombre de boules rouges : {1}', value: r, near: [[[k, `${M(k)} est l’effectif : divise-le par ${M(n)}.`]], [[f, 'C’est la fréquence : multiplie-la par le nombre de boules de l’urne.']]] }),
      html: `Une urne contient ${M(N)} boules, rouges ou bleues, en proportion inconnue. On tire une boule au hasard, on note sa couleur, puis on la remet : on répète ${M(n)} fois. On obtient ${M(k)} boules rouges. Donne la fréquence des boules rouges, puis estime le nombre de boules rouges dans l’urne.`,
      hint: `La fréquence observée est ${M(k)} divisée par ${M(n)}. Si l’urne contient ${M(N)} boules, on estime que la même proportion de ces ${M(N)} boules sont rouges.`,
      solution: `Fréquence des boules rouges : ${M(k)} ÷ ${M(n)} = <b>${M(f)}</b>.<br>On estime la proportion de boules rouges dans l’urne par cette fréquence : ${M(f)} × ${M(N)} = <b>${M(r)}</b> boules rouges (valeur estimée).` };
  },
  ex: { n: 500, N: 40, k: 150 },
};

/** simulation (déterministe avec rand.js) d'une expérience de probabilité p : fréquence après chaque pas */
function simule(p, nmax, pas) {
  const pts = []; let k = 0;
  for (let i = 1; i <= nmax; i++) { if (random() < p) k++; if (i % pas === 0) pts.push({ n: i, f: k / i }); }
  return pts;
}
const graphFreq = {
  id: 'graph-freq', dmin: 3, titre: 'vers quelle valeur la fréquence se stabilise-t-elle ?',
  draw: d => cherche(() => { const p = pick([0.2, 0.3, 0.4, 0.5, 0.6, 0.7]), nmax = pick([200, 500]), pts = simule(p, nmax, nmax / 40); return { p, nmax, pts }; }, t => Math.abs(t.pts[t.pts.length - 1].f - t.p) <= 0.025),
  build: p => {
    const { p: pr, nmax, pts } = p, vis = courbeFreq(pts, { nmax, yr: [0, 1], gy: 0.1, ly: 0.2 });
    const cand = [...new Set([pr, rnd(pr + 0.1, 2), rnd(pr - 0.1, 2), rnd(pr + 0.2, 2), rnd(pr - 0.2, 2)])].filter(x => x > 0.05 && x < 0.95);
    const vois = cand.filter(x => x !== pr).sort((a, b) => Math.abs(a - pr) - Math.abs(b - pr)).slice(0, 3).sort((a, b) => a - b);
    const all = [...vois, pr].sort((a, b) => a - b);
    const items = all.map(x => ({ l: M(x), ok: x === pr, why: `La courbe se termine près de ${M(rnd(pts[pts.length - 1].f, 2))} : c’est de cette valeur que la fréquence se rapproche.` }));
    return { ...rChoice(items, { ordre: true, indep: M(all.reduce((b, x) => (Math.abs(x - readFreqFin(vis)) < Math.abs(b - readFreqFin(vis)) ? x : b), all[0])) }), visual: vis,
      html: `On simule une expérience aléatoire ${M(nmax)} fois et on trace la fréquence observée d’un événement en fonction du nombre d’essais. Vers quelle valeur la fréquence semble-t-elle se stabiliser ? Cette valeur donne une estimation de la probabilité de l’événement.`,
      hint: `Regarde la fin de la courbe, pour les plus grands nombres d’essais (vers ${M(nmax)}) : lis sa hauteur sur l’axe vertical, graduée de 0,1 en 0,1.`,
      solution: `Quand le nombre d’essais augmente, la courbe fluctue de moins en moins et se rapproche d’une valeur : ici, vers ${M(rnd(pts[pts.length - 1].f, 2))}.<br>La probabilité est estimée à <b>${M(pr)}</b>.` };
  },
  ex: { p: 0.4, nmax: 200, pts: Array.from({ length: 40 }, (_, i) => ({ n: (i + 1) * 5, f: Math.max(0.05, 0.4 + 0.3 * Math.sin(i * 1.7) / (i + 1.5)) })) },
};

const echant = {
  id: 'echant', dmin: 4, titre: 'fluctuation d’échantillonnage',
  draw: d => cherche(() => { const p = pick([0.3, 0.4, 0.5, 0.6]), small = Array.from({ length: 5 }, () => rnd(p + ri(-22, 22) / 100, 2)), big = Array.from({ length: 5 }, () => rnd(p + ri(-2, 2) / 100, 2)); return { p, small, big, inv: chance(0.5) }; }, t => Math.max(...t.small) - Math.min(...t.small) >= 0.25 && new Set(t.big).size >= 3 && Math.max(...t.small) < 1 && Math.min(...t.small) > 0),
  build: p => {
    const { small, big, inv, p: pr } = p, L1 = inv ? big : small, L2 = inv ? small : big, bon = inv ? 'A' : 'B';
    const bilan = `Compare l’étalement des deux listes : A va de ${M(Math.min(...L1))} à ${M(Math.max(...L1))}, B va de ${M(Math.min(...L2))} à ${M(Math.max(...L2))}.`;
    const items = [{ l: 'La liste A.', ok: bon === 'A', why: bilan }, { l: 'La liste B.', ok: bon === 'B', why: bilan }, { l: 'On ne peut pas le savoir.', why: 'On peut le savoir : plus les échantillons sont grands, moins les fréquences fluctuent.' }];
    return { ...rChoice(items, { ordre: true, indep: `La liste ${bon}.` }),
      html: `On répète 5 fois la même simulation d’un événement de probabilité ${M(pr)}. Pour l’une des deux listes ci-dessous, chaque simulation comporte 20 essais ; pour l’autre, 2 000 essais. Voici les 5 fréquences obtenues pour chaque liste.<br>Liste A : ${lst(L1)}<br>Liste B : ${lst(L2)}<br>Laquelle de ces deux listes correspond aux simulations de 2 000 essais ?`,
      hint: `Compare l’étalement des fréquences de chaque liste, entre ${M(Math.min(...L1, ...L2))} et ${M(Math.max(...L1, ...L2))} : avec plus d’essais, les fréquences observées sont plus proches de ${M(pr)}.`,
      solution: `La liste A est étalée de ${M(Math.min(...L1))} à ${M(Math.max(...L1))} ; la liste B de ${M(Math.min(...L2))} à ${M(Math.max(...L2))}.<br>Avec un grand nombre d’essais, les fréquences fluctuent peu autour de la probabilité ${M(pr)} : les simulations de 2 000 essais correspondent à la liste la moins étalée, <b>la liste ${bon}</b>.` };
  },
  ex: { p: 0.5, small: [0.35, 0.6, 0.45, 0.7, 0.55], big: [0.49, 0.51, 0.5, 0.52, 0.48], inv: false },
};

export const LV10 = niveau('Fréquence et probabilité', [freqObs, espNb, simulLire, probaFreq, procheP, estimP, graphFreq, echant], {
  n: 10,
  intro: 'Quand on répète une expérience aléatoire, la fréquence observée d’un événement varie d’une série d’essais à l’autre. Mais quand le nombre d’essais devient grand, elle se rapproche de la probabilité de l’événement.',
  def: `La <b>fréquence observée</b> d’un événement est <span class="nw">(nombre de fois où il se produit) ÷ (nombre d’essais)</span>. C’est la <b>loi des grands nombres</b> (version simple) : quand le nombre d’essais augmente, la fréquence observée se stabilise autour de la <b>probabilité</b> de l’événement. Les petites séries d’essais <b>fluctuent</b> davantage.`,
  visuel: courbeFreq(Array.from({ length: 40 }, (_, i) => ({ n: (i + 1) * 5, f: 0.5 + 0.28 * Math.cos(i * 1.3) / (1 + i * 0.6) })), { nmax: 200, yr: [0, 1], gy: 0.1, ly: 0.2 }),
  methode: ['Fréquence observée : nombre de réalisations ÷ nombre d’essais.', 'Nombre attendu de réalisations : probabilité × nombre d’essais (valeur approchée).', 'Estimer une probabilité : observer la fréquence pour un très grand nombre d’essais.'],
  warn: ['Une fréquence observée n’est pas la probabilité : elle s’en approche seulement quand le nombre d’essais est grand.', 'Après plusieurs « pile », la pièce ne « rattrape » pas : les lancers sont indépendants.', 'Avec peu d’essais, un écart entre fréquence et probabilité est normal et ne prouve rien.'],
  retenir: 'fréquence observée = réalisations ÷ essais ; plus il y a d’essais, plus elle est proche de la probabilité.',
});

/* ===================================================================== 11. tableau croisé et fréquences conditionnelles */
const CROISE = [
  { ent: 'élèves d’un lycée', lignes: ['2de', '1re'], colonnes: ['demi-pensionnaires', 'externes'], gl: (l) => `en ${l}`, intro: 'Le tableau donne la répartition des élèves d’un lycée selon leur niveau et leur régime.' },
  { ent: 'personnes interrogées', lignes: ['moins de 30 ans', '30 ans ou plus'], colonnes: ['pratiquent un sport', 'ne pratiquent pas de sport'], gl: (l) => `parmi les personnes de ${l}`, intro: 'Le tableau donne les réponses à un sondage sur la pratique sportive, selon l’âge.' },
  { ent: 'pièces fabriquées', lignes: ['machine A', 'machine B'], colonnes: ['conformes', 'défectueuses'], gl: (l) => `fabriquées par la ${l}`, intro: 'Le tableau donne le contrôle de la qualité des pièces fabriquées par deux machines.' },
  { ent: 'abonnés d’un club', lignes: ['adultes', 'enfants'], colonnes: ['inscrits à l’escalade', 'inscrits à la natation'], gl: (l) => `parmi les ${l}`, intro: 'Le tableau donne l’activité choisie par les abonnés d’un club, selon leur âge.' },
];
/** tableau croisé 2 × 2 de total N : [[a, b], [c, d]] */
function tirageCroise(Ns = [100, 200, 250, 400, 500]) {
  return cherche(() => { const N = pick(Ns), c0 = ri(Math.round(N * 0.3), Math.round(N * 0.7)), a = ri(Math.round(c0 * 0.2), Math.round(c0 * 0.8)), c = ri(Math.round((N - c0) * 0.2), Math.round((N - c0) * 0.8)); return { i: ri(0, CROISE.length - 1), a, b: c0 - a, c, d: N - c0 - c }; }, t => Math.min(t.a, t.b, t.c, t.d) >= 5);
}
const tabCroise = (S, t, o = {}) => {
  const rt = [t.a + t.b, t.c + t.d], ct = [t.a + t.c, t.b + t.d], N = rt[0] + rt[1], cell = (k, v) => (o.cache === k ? '?' : v);
  return tab([['', ...S.colonnes, 'Total'], [S.lignes[0], cell('a', t.a), cell('b', t.b), cell('r1', rt[0])], [S.lignes[1], cell('c', t.c), cell('d', t.d), cell('r2', rt[1])], ['Total', cell('c1', ct[0]), cell('c2', ct[1]), cell('N', N)]]);
};
const croiseCompl = {
  id: 'croise-compl', dmin: 0, titre: 'compléter un tableau croisé',
  draw: d => { const t = tirageCroise(); return t && { ...t, cache: pick(['a', 'b', 'c', 'd', 'r1', 'r2', 'c1', 'c2']) }; },
  build: p => {
    const S = CROISE[p.i], { cache } = p, rt = [p.a + p.b, p.c + p.d], ct = [p.a + p.c, p.b + p.d], N = sum(rt);
    const rep = { a: p.a, b: p.b, c: p.c, d: p.d, r1: rt[0], r2: rt[1], c1: ct[0], c2: ct[1] }[cache];
    const sol = { a: `${M(rt[0])} − ${M(p.b)} = ${M(p.a)}`, b: `${M(rt[0])} − ${M(p.a)} = ${M(p.b)}`, c: `${M(rt[1])} − ${M(p.d)} = ${M(p.c)}`, d: `${M(rt[1])} − ${M(p.c)} = ${M(p.d)}`, r1: `${M(p.a)} + ${M(p.b)} = ${M(rt[0])}`, r2: `${M(p.c)} + ${M(p.d)} = ${M(rt[1])}`, c1: `${M(p.a)} + ${M(p.c)} = ${M(ct[0])}`, c2: `${M(p.b)} + ${M(p.d)} = ${M(ct[1])}` }[cache];
    const hint = { a: `Le total de la ligne « ${S.lignes[0]} » est ${M(rt[0])} et la case ${S.colonnes[1]} vaut ${M(p.b)} : retire-la du total de la ligne.`, b: `Le total de la ligne « ${S.lignes[0]} » est ${M(rt[0])} et la case ${S.colonnes[0]} vaut ${M(p.a)} : retire-la du total de la ligne.`, c: `Le total de la ligne « ${S.lignes[1]} » est ${M(rt[1])} et la case ${S.colonnes[1]} vaut ${M(p.d)} : retire-la du total de la ligne.`, d: `Le total de la ligne « ${S.lignes[1]} » est ${M(rt[1])} et la case ${S.colonnes[0]} vaut ${M(p.c)} : retire-la du total de la ligne.`, r1: `Additionne les deux cases de la ligne « ${S.lignes[0]} » : ${M(p.a)} et ${M(p.b)}.`, r2: `Additionne les deux cases de la ligne « ${S.lignes[1]} » : ${M(p.c)} et ${M(p.d)}.`, c1: `Additionne les deux cases de la colonne « ${S.colonnes[0]} » : ${M(p.a)} et ${M(p.c)}.`, c2: `Additionne les deux cases de la colonne « ${S.colonnes[1]} » : ${M(p.b)} et ${M(p.d)}.` }[cache];
    return { ...rNums([rep], { tpl: 'Valeur de la case « ? » : {0}', value: rep }),
      html: `${S.intro}${tabCroise(S, p, { cache })}Quel nombre faut-il écrire à la place du « ? »`,
      hint, solution: `Dans un tableau croisé, chaque total est la somme de sa ligne ou de sa colonne.<br>${sol} : la case vaut <b>${M(rep)}</b>.` };
  },
  ex: { i: 0, a: 80, b: 40, c: 70, d: 110, cache: 'a' },
};

const freqMarg = {
  id: 'freq-marg', dmin: 0, titre: 'fréquence marginale',
  draw: d => { const t = tirageCroise([100, 200, 250, 400, 500]); return t && { ...t, k: ri(0, 3) }; },
  build: p => {
    const S = CROISE[p.i], { k } = p, rt = [p.a + p.b, p.c + p.d], ct = [p.a + p.c, p.b + p.d], N = sum(rt);
    const [eff, nom] = [[rt[0], `les ${S.lignes[0]}`], [rt[1], `les ${S.lignes[1]}`], [ct[0], `les ${S.colonnes[0]}`], [ct[1], `les ${S.colonnes[1]}`]][k], f = eff / N * 100;
    if (dec(f) < 0 || dec(f) > 1) return null;
    const qui = k < 2 ? `${S.ent} sont « ${S.lignes[k]} »` : `${S.ent} sont « ${S.colonnes[k - 2]} »`;
    return { ...rNums([f], { tpl: 'Pourcentage : {0} %', value: f, near: [[[eff, `${M(eff)} est un effectif : le pourcentage est cet effectif divisé par l’effectif total ${M(N)}.`]]] }),
      html: `${S.intro}${tabCroise(S, p)}Quel pourcentage de l’ensemble des ${S.ent} sont « ${k < 2 ? S.lignes[k] : S.colonnes[k - 2]} » ?`,
      hint: `Repère dans la case « Total » le nombre de ${S.ent} « ${k < 2 ? S.lignes[k] : S.colonnes[k - 2]} » (ligne ou colonne), puis divise-le par l’effectif total ${M(N)}.`,
      solution: `Effectif des « ${k < 2 ? S.lignes[k] : S.colonnes[k - 2]} » : ${M(eff)}. Effectif total : ${M(N)}.<br>Fréquence : ${M(eff)} ÷ ${M(N)} = ${M(f / 100)}, soit <b>${M(f)} %</b>.` };
  },
  ex: { i: 0, a: 80, b: 40, c: 70, d: 110, k: 2 },
};

const freqCond = {
  id: 'freq-cond', dmin: 1, titre: 'fréquence conditionnelle',
  draw: d => cherche(() => { const t = tirageCroise(); return t && { ...t, l: ri(0, 1), cc: ri(0, 1) }; }, t => { const tot = (t.l ? t.c + t.d : t.a + t.b), v = [[t.a, t.b], [t.c, t.d]][t.l][t.cc]; return dec(v / tot * 100) >= 0 && dec(v / tot * 100) <= 1; }),
  build: p => {
    const S = CROISE[p.i], { l, cc } = p, v = [[p.a, p.b], [p.c, p.d]][l][cc], tot = l ? p.c + p.d : p.a + p.b, N = p.a + p.b + p.c + p.d, f = v / tot * 100;
    return { ...rNums([f], { tpl: 'Pourcentage : {0} %', value: f, near: [[[v / N * 100, `Tu as divisé par l’effectif total ${M(N)} : ici on se limite aux « ${S.lignes[l]} », donc on divise par leur effectif.`], [v, 'Tu as donné un effectif : on demande un pourcentage.']]] }),
      html: `${S.intro}${tabCroise(S, p)}Parmi les ${S.ent} « ${S.lignes[l]} », quel pourcentage sont « ${S.colonnes[cc]} » ?`,
      hint: `On ne regarde que les « ${S.lignes[l]} » : leur effectif est la case « Total » de leur ligne. Divise le nombre de ${S.colonnes[cc]} dans cette ligne (${M(v)}) par cet effectif.`,
      solution: `Effectif des « ${S.lignes[l]} » : ${M(tot)} (total de la ligne). Parmi eux, ${M(v)} sont « ${S.colonnes[cc]} ».<br>Fréquence conditionnelle : ${M(v)} ÷ ${M(tot)} = ${M(f / 100)}, soit <b>${M(f)} %</b>.` };
  },
  ex: { i: 0, a: 80, b: 40, c: 70, d: 110, l: 0, cc: 0 },
};

const condSens = {
  id: 'cond-sens', dmin: 2, titre: 'bon calcul d’une fréquence conditionnelle',
  draw: d => { const t = tirageCroise(); return t && { ...t, l: ri(0, 1), cc: ri(0, 1), sens: pick(['ligne', 'colonne']) }; },
  build: p => {
    const S = CROISE[p.i], { l, cc, sens } = p, v = [[p.a, p.b], [p.c, p.d]][l][cc], rt = [p.a + p.b, p.c + p.d], ct = [p.a + p.c, p.b + p.d], N = sum(rt);
    const base = sens === 'ligne' ? rt[l] : ct[cc], autre = sens === 'ligne' ? ct[cc] : rt[l];
    const q = sens === 'ligne' ? `Parmi les ${S.ent} « ${S.lignes[l]} », quelle est la proportion de ceux qui sont « ${S.colonnes[cc]} » ?` : `Parmi les ${S.ent} « ${S.colonnes[cc]} », quelle est la proportion de ceux qui sont « ${S.lignes[l]} » ?`;
    const bon = `${M(v)} ÷ ${M(base)}`;
    const items = [
      { l: bon, ok: true },
      { l: `${M(v)} ÷ ${M(autre)}`, why: 'Tu as divisé par l’effectif de l’autre groupe : la condition « parmi… » indique le groupe par lequel il faut diviser.' },
      { l: `${M(v)} ÷ ${M(N)}`, why: `Diviser par l’effectif total ${M(N)} donne la proportion dans l’ensemble, pas dans le groupe annoncé par « parmi… ».` },
      { l: `${M(base)} ÷ ${M(v)}`, why: 'Le quotient est à l’envers : une proportion est la partie divisée par le tout, donc inférieure ou égale à 1.' },
    ];
    if (new Set(items.map(x => x.l)).size < 4) return null;
    return { ...rChoice(items, { indep: bon }),
      html: `${S.intro}${tabCroise(S, p)}${q} Quel calcul faut-il faire ?`,
      hint: `Le groupe de départ est annoncé après « parmi » : trouve son effectif dans la case « Total » (${M(base)} ou ${M(autre)}). La proportion est le nombre de personnes qui ont l’autre caractère (${M(v)}), divisé par l’effectif de ce groupe.`,
      solution: `Après « parmi », on lit le groupe de départ : ${sens === 'ligne' ? `les « ${S.lignes[l]} »` : `les « ${S.colonnes[cc]} »`}, d’effectif ${M(base)}.<br>Dans ce groupe, ${M(v)} personnes ont l’autre caractère. La proportion est <b>${bon}</b>.` };
  },
  ex: { i: 0, a: 80, b: 40, c: 70, d: 110, l: 0, cc: 0, sens: 'colonne' },
};

const condCompar = {
  id: 'cond-compar', dmin: 3, titre: 'comparer deux fréquences conditionnelles',
  draw: d => cherche(() => { const t = tirageCroise([200, 250, 400, 500]); return t && { ...t, cc: ri(0, 1) }; }, t => { const f0 = [t.a, t.b][t.cc] / (t.a + t.b), f1 = [t.c, t.d][t.cc] / (t.c + t.d), n0 = [t.a, t.b][t.cc], n1 = [t.c, t.d][t.cc]; return Math.abs(f0 - f1) >= 0.05 && (f0 > f1) !== (n0 > n1); }),
  build: p => {
    const S = CROISE[p.i], { cc } = p, v0 = [p.a, p.b][cc], v1 = [p.c, p.d][cc], t0 = p.a + p.b, t1 = p.c + p.d, f0 = v0 / t0 * 100, f1 = v1 / t1 * 100, bon = f0 > f1 ? 0 : 1;
    const gr = k => `Parmi les « ${S.lignes[k]} »`;
    const items = [{ l: `${gr(0)}.`, ok: bon === 0 }, { l: `${gr(1)}.`, ok: bon === 1 }, { l: 'La proportion est la même dans les deux groupes.' }].map(x => ({ ...x, why: x.ok ? '' : `Compare les proportions ${M(rnd(f0, 1))} % et ${M(rnd(f1, 1))} % : le groupe où il y a le plus de « ${S.colonnes[cc]} » en nombre n’est pas forcément celui où leur proportion est la plus grande.` }));
    return { ...rChoice(items, { ordre: true, indep: `${gr(bon)}.` }),
      html: `${S.intro}${tabCroise(S, p)}Dans quel groupe la proportion de « ${S.colonnes[cc]} » est-elle la plus grande ?`,
      hint: `Compare des proportions, pas des effectifs : pour chaque ligne, divise le nombre de « ${S.colonnes[cc]} » (${M(v0)} et ${M(v1)}) par le total de la ligne (${M(t0)} et ${M(t1)}).`,
      solution: `« ${S.lignes[0]} » : ${M(v0)} ÷ ${M(t0)} ≈ ${M(rnd(v0 / t0, 3))}, soit ${M(rnd(f0, 1))} %.<br>« ${S.lignes[1]} » : ${M(v1)} ÷ ${M(t1)} ≈ ${M(rnd(v1 / t1, 3))}, soit ${M(rnd(f1, 1))} %.<br>La plus grande proportion est <b>${gr(bon).toLowerCase()}</b>.` };
  },
  ex: { i: 0, a: 90, b: 60, c: 120, d: 130, cc: 0 },
};

const reconstr = {
  id: 'reconstr', dmin: 4, titre: 'retrouver une case à partir de fréquences',
  draw: d => cherche(() => { const N = pick([200, 250, 400, 500]), dp = ri(Math.round(N * 0.3), Math.round(N * 0.6)), n1 = ri(Math.round(N * 0.3), Math.round(N * 0.6)), pc1 = ri(2, 18) * 5, i = ri(0, CROISE.length - 1); return { i, N, dp, n1, pc1 }; },
    t => entier(t.n1 * t.pc1 / 100) && t.N - t.dp - t.n1 * t.pc1 / 100 > 0 && t.N - t.dp - t.n1 * t.pc1 / 100 < t.N - t.n1 && t.N - t.dp > t.n1 * t.pc1 / 100),
  build: p => {
    const S = CROISE[p.i], { N, dp, n1, pc1 } = p, ext = N - dp, cell = n1 * pc1 / 100, r = ext - cell;
    return { ...rNums([r], { tpl: 'Effectif : {0}', value: r, near: [[[cell, `${M(cell)} est le nombre de « ${S.lignes[1]} » qui sont « ${S.colonnes[1]} » : il reste à trouver ceux des « ${S.lignes[0]} ».`], [ext, `${M(ext)} est le total des « ${S.colonnes[1]} » : il faut en retirer ceux des « ${S.lignes[1]} ».`]]] }),
      html: `Un ensemble de ${M(N)} ${S.ent} se partage entre « ${S.lignes[0]} » et « ${S.lignes[1]} », et entre « ${S.colonnes[0]} » et « ${S.colonnes[1]} ». Il y a ${M(dp)} « ${S.colonnes[0]} » au total, et ${M(n1)} « ${S.lignes[1]} », dont ${pc(pc1)} sont « ${S.colonnes[1]} ». Combien de « ${S.lignes[0]} » sont « ${S.colonnes[1]} » ?`,
      hint: `Calcule d’abord le total des « ${S.colonnes[1]} » (${M(N)} moins les ${M(dp)} « ${S.colonnes[0]} »), puis le nombre de « ${S.lignes[1]} » qui sont « ${S.colonnes[1]} » (${M(pc1)} % de ${M(n1)}) : le reste concerne les « ${S.lignes[0]} ».`,
      solution: `Total des « ${S.colonnes[1]} » : ${M(N)} − ${M(dp)} = ${M(ext)}.<br>« ${S.lignes[1]} » qui sont « ${S.colonnes[1]} » : ${M(n1)} × ${M(pc1)} ÷ 100 = ${M(cell)}.<br>« ${S.lignes[0]} » qui sont « ${S.colonnes[1]} » : ${M(ext)} − ${M(cell)} = <b>${M(r)}</b>.` };
  },
  ex: { i: 0, N: 250, dp: 140, n1: 100, pc1: 45 },
};

export const LV11 = niveau('Tableau croisé et fréquences conditionnelles', [croiseCompl, freqMarg, freqCond, condSens, condCompar, reconstr], {
  n: 11,
  intro: 'Un tableau croisé étudie deux caractères en même temps (par exemple le niveau et le régime des élèves d’un lycée). Selon la question, on divise par le total général ou par le total d’un groupe : c’est la différence entre fréquence marginale et fréquence conditionnelle.',
  def: `Dans un tableau croisé, la <b>fréquence marginale</b> d’un caractère est <span class="nw">effectif du caractère ÷ effectif total</span>. La <b>fréquence conditionnelle</b> de B <b>parmi</b> A est <span class="nw">effectif (A et B) ÷ effectif de A</span> : on se limite au groupe A.`,
  visuel: tab([['', 'demi-pensionnaires', 'externes', 'Total'], ['2de', 80, 40, 120], ['1re', 70, 110, 180], ['Total', 150, 150, 300]]) + barresCond([{ nom: '2de (120)', a: 80, b: 40 }, { nom: '1re (180)', a: 70, b: 110 }], ['demi-pensionnaires', 'externes']),
  methode: ['Repère les totaux de lignes et de colonnes (case « Total »).', 'Fréquence marginale : divise par le total général.', 'Fréquence conditionnelle « parmi A » : divise par le total du groupe A, qui est annoncé après « parmi ».'],
  warn: ['« Parmi les 2de, quelle proportion de demi-pensionnaires ? » et « parmi les demi-pensionnaires, quelle proportion de 2de ? » n’ont pas la même réponse : on ne divise pas par le même total.', 'Le groupe qui a le plus d’individus n’est pas forcément celui où la proportion est la plus grande.', 'Une proportion est toujours inférieure ou égale à 1 (100 %).'],
  retenir: 'fréquence conditionnelle de B parmi A = effectif (A et B) ÷ effectif de A ; fréquence marginale = effectif ÷ total général.',
});

/* ===================================================================== 12. nuage de points et ajustement affine */
const NU = [
  { id: 'rev', intro: 'On a relevé, pour des élèves, le nombre d’heures de révision par semaine, noté x, et la note obtenue à un contrôle sur 20, notée y.', xt: 'révision (h par semaine)', yt: 'note (sur 20)', xr: [0, 12], yr: [0, 20], gx: 1, gy: 1, lx: 1, ly: 2, x0: 1, x1: 10, a: 1.1, b: 7, A: 2, ux: ' h', uy: '', ent: 'élèves',
    phr: x => `Un élève révise ${M(x)} h par semaine.`, qq: 'Quelle note peut-on prévoir ?', ymax: 20 },
  { id: 'age', intro: 'On a relevé l’âge, noté x (en années), et le prix, noté y (en milliers d’euros), de voitures d’occasion du même modèle.', xt: 'âge (années)', yt: 'prix (milliers d’euros)', xr: [0, 12], yr: [0, 18], gx: 1, gy: 1, lx: 1, ly: 2, x0: 1, x1: 10, a: -1.2, b: 16, A: 1.5, ux: ' ans', uy: ' milliers d’euros', ent: 'voitures',
    phr: x => `Une voiture a ${M(x)} ans.`, qq: 'Quel prix peut-on prévoir (en milliers d’euros) ?', ymax: 18 },
  { id: 'temp', intro: 'On a relevé la température extérieure moyenne, notée x (en °C), et la consommation de chauffage, notée y (en kWh par jour), d’une maison.', xt: 'température (°C)', yt: 'consommation (kWh par jour)', xr: [0, 16], yr: [0, 70], gx: 1, gy: 5, lx: 2, ly: 10, x0: 1, x1: 14, a: -3, b: 60, A: 4, ux: ' °C', uy: ' kWh', ent: 'jours',
    phr: x => `La température extérieure moyenne d’une journée est de ${M(x)} °C.`, qq: 'Quelle consommation peut-on prévoir (en kWh) ?', ymax: 70 },
  { id: 'abo', intro: 'On a relevé le nombre d’années écoulées depuis 2018, noté x, et le nombre d’abonnés, noté y (en dizaines), d’une médiathèque.', xt: 'années depuis 2018', yt: 'abonnés (dizaines)', xr: [0, 12], yr: [0, 60], gx: 1, gy: 5, lx: 1, ly: 10, x0: 1, x1: 10, a: 4, b: 8, A: 3, ux: ' ans', uy: ' dizaines', ent: 'années',
    phr: x => `On est ${M(x)} ans après 2018.`, qq: 'Combien d’abonnés (en dizaines) peut-on prévoir ?', ymax: 60 },
];
/** n points (x entiers distincts triés, y = a x + b + bruit entier) */
function pointsNuage(ct, n) {
  n = Math.min(n, ct.x1 - ct.x0 + 1);
  const xs = new Set(); while (xs.size < n) xs.add(ri(ct.x0, ct.x1));
  return [...xs].sort((a, b) => a - b).map(x => ({ x, y: Math.max(1, Math.min(ct.ymax - 1, Math.round(ct.a * x + ct.b + ri(-Math.round(ct.A * 2), Math.round(ct.A * 2)) / 2))) }));
}
const droiteTxt = (a, b) => `y = ${terms([[a, 'x'], [b, '']])}`;
const svgNuage = (ct, pts, o = {}) => nuage(pts, { xr: ct.xr, yr: ct.yr, gx: ct.gx, gy: ct.gy, lx: ct.lx, ly: ct.ly, xt: ct.xt, yt: ct.yt, ...o });
/** coefficient de corrélation (pour classer un nuage) */
const corr = pts => { const mx = mean(pts.map(p => p.x)), my = mean(pts.map(p => p.y)); const sxy = sum(pts.map(p => (p.x - mx) * (p.y - my))), sxx = sum(pts.map(p => (p.x - mx) ** 2)), syy = sum(pts.map(p => (p.y - my) ** 2)); return sxy / Math.sqrt(sxx * syy); };

const sensLiaison = {
  id: 'sens-liaison', dmin: 0, titre: 'sens de la liaison entre deux caractères',
  draw: d => cherche(() => {
    const ct = pick(NU), mode = pick(['pos', 'neg', 'none']), n = Math.min(ri(8, 9), ct.x1 - ct.x0 + 1);
    let pts;
    if (mode === 'none') { const xs = new Set(); while (xs.size < n) xs.add(ri(ct.x0, ct.x1)); pts = [...xs].sort((a, b) => a - b).map(x => ({ x, y: ri(Math.round(ct.yr[1] * 0.15), Math.round(ct.yr[1] * 0.85)) })); }
    else pts = pointsNuage(ct, n);
    const r = corr(pts);
    return { id: ct.id, pts, mode: Math.abs(r) < 0.3 ? 'none' : r > 0 ? 'pos' : 'neg', r };
  }, t => { const r = Math.abs(t.r); return r < 0.3 || r > 0.8; }),
  build: p => {
    const ct = NU.find(c => c.id === p.id), vis = svgNuage(ct, p.pts), r = corr(readNuage(vis).pts);
    const m = Math.abs(r) < 0.3 ? 'none' : r > 0 ? 'pos' : 'neg';
    const T = { pos: 'Quand x augmente, y a tendance à augmenter.', neg: 'Quand x augmente, y a tendance à diminuer.', none: 'Il n’y a pas de lien visible entre x et y.' };
    const items = ['pos', 'neg', 'none'].map(k => ({ l: T[k], ok: k === m, why: k === 'none' ? 'Les points ne sont pas dispersés au hasard : ils suivent une direction. Regarde le sens de cette direction.' : m === 'none' ? 'Les points sont dispersés sans direction particulière : il n’y a pas de lien visible.' : 'Regarde la direction du nuage : va-t-il vers le haut ou vers le bas quand on va vers la droite ?' }));
    return { ...rChoice(items, { ordre: true, indep: T[m] }), visual: vis,
      html: `${ct.intro} Que peut-on dire du lien entre x et y ?`,
      hint: `Regarde la direction que suit le nuage de ${p.pts.length} points : quand on va vers la droite (x augmente), les points montent-ils, descendent-ils, ou sont-ils dispersés sans direction ?`,
      solution: `Le nuage ${m === 'pos' ? 'monte de la gauche vers la droite' : m === 'neg' ? 'descend de la gauche vers la droite' : 'ne suit aucune direction particulière'}.<br><b>${T[m]}</b>` };
  },
  ex: { id: 'rev', pts: [1, 2, 3, 4, 5, 6, 7, 9].map((x, i) => ({ x, y: [9, 11, 10, 13, 14, 15, 17, 18][i] })), mode: 'pos' },
};

const lireNuage = {
  id: 'lire-nuage', dmin: 0, titre: 'lire les coordonnées d’un point',
  draw: d => { const ct = pick(NU), pts = pointsNuage(ct, ri(7, 9)); return { id: ct.id, pts, j: ri(0, pts.length - 1) }; },
  build: p => {
    const ct = NU.find(c => c.id === p.id), j = p.j, P_ = p.pts[j], pts = p.pts.map((q, i) => (i === j ? { ...q, l: 'P' } : q)), vis = svgNuage(ct, pts, { mark: [j] });
    return { ...rNums([P_.x, P_.y], { tpl: 'x : {0} y : {1}', value: P_.y, verify: E => { const L = readNuage(vis).pts[j]; return Math.abs(L.x - E[0]) < 0.02 && Math.abs(L.y - E[1]) < 0.02; } }), visual: vis,
      html: `${ct.intro} Quelles sont les coordonnées du point P, mis en évidence sur le nuage ?`,
      hint: `Lis l’abscisse x de P sur l’axe horizontal (${ct.xt}) en descendant verticalement, puis son ordonnée y sur l’axe vertical (${ct.yt}) en allant horizontalement. Les graduations de l’axe vertical vont de ${M(ct.ly)} en ${M(ct.ly)}.`,
      solution: `En descendant de P vers l’axe horizontal, on lit x = <b>${M(P_.x)}</b>${ct.ux}. En allant vers l’axe vertical, on lit y = <b>${M(P_.y)}</b>${ct.uy}.` };
  },
  ex: { id: 'rev', pts: [{ x: 1, y: 9 }, { x: 2, y: 11 }, { x: 3, y: 12 }, { x: 4, y: 12 }, { x: 5, y: 14 }, { x: 7, y: 17 }, { x: 8, y: 17 }], j: 4 },
};

const tabPoints = (ct, pts) => tab([['x', ...pts.map(p => p.x)], ['y', ...pts.map(p => p.y)]]);
const pointMoyen = {
  id: 'point-moyen', dmin: 1, titre: 'point moyen',
  draw: d => { const ct = pick(NU); return { id: ct.id, pts: pointsNuage(ct, pick([5, 5, 10])) }; },
  build: p => {
    const ct = NU.find(c => c.id === p.id), { pts } = p, n = pts.length, sx = sum(pts.map(q => q.x)), sy = sum(pts.map(q => q.y)), mx = sx / n, my = sy / n, vis = svgNuage(ct, pts);
    return { ...rNums([mx, my], { tpl: 'x̄ : {0} ȳ : {1}', value: my, verify: E => { const L = readNuage(vis).pts; return Math.abs(mean(L.map(q => q.x)) - E[0]) < 0.02 && Math.abs(mean(L.map(q => q.y)) - E[1]) < 0.02; }, near: [[[sx, `${M(sx)} est la somme des x : divise-la par le nombre de points ${M(n)}.`]], [[sy, `${M(sy)} est la somme des y : divise-la par le nombre de points ${M(n)}.`]]] }), visual: vis,
      html: `${ct.intro}${tabPoints(ct, pts)}Calcule les coordonnées du point moyen G (x̄ ; ȳ) du nuage.`,
      hint: `Le point moyen a pour abscisse la moyenne des x (additionne les ${M(n)} valeurs de x, divise par ${M(n)}) et pour ordonnée la moyenne des y, calculée de la même façon.`,
      solution: `Moyenne des x : ${plus(pts.map(q => q.x))} = ${M(sx)}, puis ${M(sx)} ÷ ${M(n)} = <b>${M(mx)}</b>.<br>Moyenne des y : ${plus(pts.map(q => q.y))} = ${M(sy)}, puis ${M(sy)} ÷ ${M(n)} = <b>${M(my)}</b>.<br>Le point moyen est G(${M(mx)} ; ${M(my)}).` };
  },
  ex: { id: 'rev', pts: [{ x: 1, y: 9 }, { x: 3, y: 12 }, { x: 5, y: 13 }, { x: 7, y: 17 }, { x: 9, y: 19 }] },
};

const placeG = {
  id: 'place-g', dmin: 2, titre: 'repérer le point moyen sur le nuage',
  draw: d => cherche(() => {
    const ct = pick(NU), pts = pointsNuage(ct, pick([5, 10])), n = pts.length, G = { x: mean(pts.map(q => q.x)), y: mean(pts.map(q => q.y)) };
    const dx = (ct.xr[1] - ct.xr[0]) * 0.12, dy = (ct.yr[1] - ct.yr[0]) * 0.14, offs = shuffle([[dx, dy], [-dx, dy], [dx, -dy], [-dx, -dy], [2 * dx, 0], [-2 * dx, 0], [0, 2 * dy], [0, -2 * dy]]).slice(0, 3);
    const cands = [G, ...offs.map(([a, b]) => ({ x: rnd(G.x + a, 2), y: rnd(G.y + b, 2) }))];
    const ok = cands.every(c => c.x > ct.xr[0] + 0.3 && c.x < ct.xr[1] - 0.3 && c.y > ct.yr[0] + 1 && c.y < ct.yr[1] - 1);
    return ok ? { id: ct.id, pts, cands, ordre: shuffle([0, 1, 2, 3]) } : null;
  }),
  build: p => {
    const ct = NU.find(c => c.id === p.id), { pts, cands, ordre } = p, lettres = ['A', 'B', 'C', 'D'];
    const marked = ordre.map((k, i) => ({ ...cands[k], l: lettres[i] })), bonne = lettres[ordre.indexOf(0)];
    const vis = svgNuage(ct, pts, { cand: marked });
    const R = readNuage(vis), gx = mean(R.pts.map(q => q.x)), gy = mean(R.pts.map(q => q.y)), lue = R.croix.reduce((b, c) => (Math.hypot(c.x - gx, c.y - gy) < Math.hypot(b.x - gx, b.y - gy) ? c : b), R.croix[0]).l;
    const G = cands[0], n = pts.length;
    const items = lettres.map(l => ({ l: `La croix ${l}`, ok: l === bonne, why: `La croix ${l} n’est pas à la moyenne des x et à la moyenne des y : calcule x̄ et ȳ, puis place le point de coordonnées (x̄ ; ȳ).` }));
    return { ...rChoice(items, { ordre: true, indep: `La croix ${lue}` }), visual: vis,
      html: `${ct.intro}${tabPoints(ct, pts)}Quatre croix A, B, C et D sont tracées sur le nuage. Laquelle représente le point moyen G du nuage ?`,
      hint: `Calcule la moyenne des ${M(n)} valeurs de x et celle des ${M(n)} valeurs de y (additionne, puis divise par ${M(n)}), puis repère la croix à ces coordonnées.`,
      solution: `Moyenne des x : ${plus(pts.map(q => q.x))} = ${M(sum(pts.map(q => q.x)))}, puis ÷ ${M(n)} = ${M(G.x)}.<br>Moyenne des y : ${plus(pts.map(q => q.y))} = ${M(sum(pts.map(q => q.y)))}, puis ÷ ${M(n)} = ${M(G.y)}.<br>Le point moyen est G(${M(G.x)} ; ${M(G.y)}) : c’est <b>la croix ${bonne}</b>.` };
  },
  ex: { id: 'rev', pts: [{ x: 1, y: 9 }, { x: 3, y: 12 }, { x: 5, y: 13 }, { x: 7, y: 17 }, { x: 9, y: 19 }], cands: [{ x: 5, y: 14 }, { x: 6.2, y: 16.8 }, { x: 3.8, y: 11.2 }, { x: 6.2, y: 11.2 }], ordre: [2, 0, 1, 3] },
};

const interp = {
  id: 'interp', dmin: 2, titre: 'interpolation avec une droite d’ajustement',
  draw: d => cherche(() => { const ct = pick(NU), pts = pointsNuage(ct, ri(8, 9)), x = ri(ct.x0 + 1, ct.x1 - 1); return { id: ct.id, pts, x }; }, t => { const ct = NU.find(c => c.id === t.id), y = ct.a * t.x + ct.b; return dec(y) >= 0 && dec(y) <= 2 && !t.pts.some(q => q.x === t.x); }),
  build: p => {
    const ct = NU.find(c => c.id === p.id), { pts, x } = p, y = rnd(ct.a * x + ct.b, 4), ax = rnd(ct.a * x, 4);
    const vis = svgNuage(ct, pts, { droite: { a: ct.a, b: ct.b, x0: ct.xr[0], x1: ct.xr[1] } });
    return { ...rNums([y], { tpl: `y ≈ {0}${ct.uy}`, value: y, near: [[[ax, `${M(ax)} est le terme en x : il reste à ajouter ou retrancher la constante de l’équation.`], [x, 'C’est la valeur de x : remplace x dans l’équation de la droite pour calculer y.']]] }), visual: vis,
      html: `${ct.intro} Une droite d’ajustement du nuage a pour équation ${droiteTxt(ct.a, ct.b)}. ${ct.phr(x)} ${ct.qq}`,
      hint: `Remplace x par ${M(x)} dans l’équation ${droiteTxt(ct.a, ct.b)} de la droite : ${M(x)} est compris entre les valeurs de x observées (il y a des points de part et d’autre).`,
      solution: `${M(x)} est dans l’intervalle des valeurs observées : on interpole avec la droite.<br>${M(ct.a)} × ${M(x)} = ${M(ax)}, puis ${P(ax)} ${ct.b < 0 ? '−' : '+'} ${M(Math.abs(ct.b))} = <b>${M(y)}</b>${ct.uy}.` };
  },
  ex: { id: 'rev', pts: [{ x: 1, y: 9 }, { x: 2, y: 11 }, { x: 3, y: 12 }, { x: 5, y: 14 }, { x: 6, y: 15 }, { x: 7, y: 17 }, { x: 8, y: 17 }, { x: 9, y: 19 }], x: 4 },
};

const extrap = {
  id: 'extrap', dmin: 3, titre: 'extrapolation avec une droite d’ajustement',
  draw: d => cherche(() => { const ct = pick(NU), pts = pointsNuage(ct, ri(8, 9)), x = ct.x1 + ri(1, 2); return { id: ct.id, pts, x }; }, t => { const ct = NU.find(c => c.id === t.id), y = ct.a * t.x + ct.b; return dec(y) >= 0 && dec(y) <= 2 && y > 0 && y <= ct.ymax && t.x < ct.xr[1] + 4; }),
  build: p => {
    const ct = NU.find(c => c.id === p.id), { pts, x } = p, y = rnd(ct.a * x + ct.b, 4), ax = rnd(ct.a * x, 4), xmax = Math.max(...pts.map(q => q.x));
    const vis = svgNuage(ct, pts, { droite: { a: ct.a, b: ct.b, x0: ct.xr[0], x1: ct.xr[1] }, });
    return { ...rNums([y], { tpl: `y ≈ {0}${ct.uy}`, value: y, near: [[[ax, `${M(ax)} est le terme en x : il reste à ajouter ou retrancher la constante de l’équation.`]]] }), visual: vis,
      html: `${ct.intro} Une droite d’ajustement du nuage a pour équation ${droiteTxt(ct.a, ct.b)}. ${ct.phr(x)} ${ct.qq}`,
      hint: `Remplace x par ${M(x)} dans l’équation ${droiteTxt(ct.a, ct.b)} : ${M(x)} est au-delà de la plus grande valeur observée (${M(xmax)}), c’est donc une extrapolation.`,
      solution: `${M(x)} dépasse les valeurs observées (le dernier point a pour abscisse ${M(xmax)}) : on extrapole avec la droite.<br>${M(ct.a)} × ${M(x)} = ${M(ax)}, puis ${P(ax)} ${ct.b < 0 ? '−' : '+'} ${M(Math.abs(ct.b))} = <b>${M(y)}</b>${ct.uy}.<br>Cette valeur est une prévision à prendre avec prudence.` };
  },
  ex: { id: 'rev', pts: [{ x: 1, y: 9 }, { x: 2, y: 11 }, { x: 3, y: 12 }, { x: 5, y: 14 }, { x: 6, y: 15 }, { x: 7, y: 17 }, { x: 8, y: 17 }, { x: 9, y: 19 }], x: 10 },
};

const droiteG = {
  id: 'droite-g', dmin: 3, titre: 'droite d’ajustement passant par le point moyen',
  draw: d => cherche(() => { const ct = pick(NU), pts = pointsNuage(ct, pick([5, 10])), a = rnd(ct.a + pick([-1, 1]) * pick([0.1, 0.2, 0.5].map(v => v * Math.max(1, Math.abs(ct.a) / 2))), 2); return { id: ct.id, pts, a }; }, t => { const n = t.pts.length, mx = sum(t.pts.map(q => q.x)) / n, my = sum(t.pts.map(q => q.y)) / n, b = my - t.a * mx; return dec(b) >= 0 && dec(b) <= 2 && b > 0 && dec(t.a) <= 1; }),
  build: p => {
    const ct = NU.find(c => c.id === p.id), { pts, a } = p, n = pts.length, mx = sum(pts.map(q => q.x)) / n, my = sum(pts.map(q => q.y)) / n, ax = rnd(a * mx, 4), b = rnd(my - ax, 4);
    return { ...rNums([b], { tpl: 'b : {0}', value: b, near: [[[ax, `${M(ax)} est a × x̄ : il reste à le retirer de ȳ.`], [rnd(my, 4), 'C’est ȳ : la droite passe par G, donc ȳ = a × x̄ + b.']]] }),
      html: `${ct.intro}${tabPoints(ct, pts)}On cherche une droite d’ajustement d’équation y = ${terms([[a, "x"]])} + b qui passe par le point moyen G du nuage. Calcule b.`,
      hint: `Calcule les coordonnées de G (moyenne des ${M(n)} valeurs de x, moyenne des ${M(n)} valeurs de y), puis écris que le point G est sur la droite : ȳ = ${M(a)} × x̄ + b.`,
      solution: `Point moyen : x̄ = ${M(sum(pts.map(q => q.x)))} ÷ ${M(n)} = ${M(mx)} et ȳ = ${M(sum(pts.map(q => q.y)))} ÷ ${M(n)} = ${M(my)}.<br>G est sur la droite, donc ȳ = a × x̄ + b. On calcule a × x̄ : ${M(a)} × ${M(mx)} = ${M(ax)}.<br>Donc b = ȳ − a × x̄ = ${M(my)} − ${P(ax)} = <b>${M(b)}</b>.` };
  },
  ex: { id: 'rev', pts: [{ x: 1, y: 9 }, { x: 3, y: 12 }, { x: 5, y: 13 }, { x: 7, y: 17 }, { x: 9, y: 19 }], a: 1.2 },
};

const fiable = {
  id: 'fiable', dmin: 4, titre: 'interpolation ou extrapolation : que penser de l’estimation ?',
  draw: d => { const ct = pick(NU), pts = pointsNuage(ct, ri(8, 9)), dehors = chance(0.5), xmax = Math.max(...pts.map(q => q.x)), xmin = Math.min(...pts.map(q => q.x)); return { id: ct.id, pts, x: dehors ? xmax + ri(3, 6) : ri(xmin + 1, xmax - 1), dehors }; },
  build: p => {
    const ct = NU.find(c => c.id === p.id), { pts, x } = p, xs = pts.map(q => q.x), xmin = Math.min(...xs), xmax = Math.max(...xs), dedans = x > xmin && x < xmax;
    const T = { oui: 'Estimation raisonnable : x est dans l’intervalle des valeurs observées (interpolation).', non: 'Estimation à prendre avec prudence : x est en dehors des valeurs observées (extrapolation).', ex: 'Estimation exacte : la droite passe par tous les points du nuage.', aucune: 'Aucune estimation n’est possible avec une droite d’ajustement.' };
    const bon = dedans ? 'oui' : 'non';
    const items = ['oui', 'non', 'ex', 'aucune'].map(k => ({ l: T[k], ok: k === bon, why: k === 'ex' ? 'Les points du nuage ne sont pas alignés : la droite ne passe pas par tous les points, elle ne donne qu’une valeur approchée.' : k === 'aucune' ? 'On peut estimer avec la droite, mais la fiabilité dépend de la position de x par rapport aux valeurs observées.' : `Regarde où se situe ${M(x)} par rapport aux valeurs de x du nuage (de ${M(xmin)} à ${M(xmax)}).` }));
    return { ...rChoice(items, { ordre: true, indep: T[bon] }), visual: svgNuage(ct, pts, { droite: { a: ct.a, b: ct.b, x0: ct.xr[0], x1: ct.xr[1] } }),
      html: `${ct.intro} Les points du nuage ont des abscisses comprises entre ${M(xmin)} et ${M(xmax)}. On utilise la droite d’ajustement ${droiteTxt(ct.a, ct.b)} pour estimer y quand x = ${M(x)}. Que peut-on dire de cette estimation ?`,
      hint: `Compare ${M(x)} aux abscisses observées, qui vont de ${M(xmin)} à ${M(xmax)} : est-il à l’intérieur de cet intervalle, ou au-delà ?`,
      solution: `${M(x)} ${dedans ? 'est compris entre' : 'n’est pas compris entre'} ${M(xmin)} et ${M(xmax)}.<br>${dedans ? 'C’est une interpolation : on reste dans le domaine où l’on a des observations.' : 'C’est une extrapolation : on sort du domaine observé et rien ne garantit que la tendance continue.'}<br>Réponse : <b>${T[bon]}</b>` };
  },
  ex: { id: 'rev', pts: [{ x: 1, y: 9 }, { x: 2, y: 11 }, { x: 3, y: 12 }, { x: 5, y: 14 }, { x: 6, y: 15 }, { x: 7, y: 17 }, { x: 8, y: 17 }, { x: 9, y: 19 }], x: 15, dehors: true },
};

const inverseDroite = {
  id: 'inverse-droite', dmin: 4, titre: 'lire x pour un y donné avec la droite',
  draw: d => cherche(() => { const ct = pick(NU), pts = pointsNuage(ct, 8), x = ri(ct.x0 + 1, ct.x1 - 1); return { id: ct.id, pts, x }; }, t => { const ct = NU.find(c => c.id === t.id), y = ct.a * t.x + ct.b; return dec(y) >= 0 && dec(y) <= 1; }),
  build: p => {
    const ct = NU.find(c => c.id === p.id), { pts, x } = p, y = rnd(ct.a * x + ct.b, 4), dy = rnd(y - ct.b, 4);
    const but = { rev: `Quel temps de révision hebdomadaire faut-il prévoir pour obtenir la note ${M(y)} ?`, age: `Pour quel âge la droite donne-t-elle un prix de ${M(y)} milliers d’euros ?`, temp: `Pour quelle température extérieure la droite prévoit-elle une consommation de ${M(y)} kWh par jour ?`, abo: `Au bout de combien d’années la droite prévoit-elle ${M(y)} dizaines d’abonnés ?` }[ct.id];
    return { ...rNums([x], { tpl: `x : {0}${ct.ux}`, value: x, near: [[[dy, `${M(dy)} est y − b : il reste à diviser par le coefficient ${M(ct.a)} de x.`]]] }),
      visual: svgNuage(ct, pts, { droite: { a: ct.a, b: ct.b, x0: ct.xr[0], x1: ct.xr[1] } }),
      html: `${ct.intro} Une droite d’ajustement a pour équation ${droiteTxt(ct.a, ct.b)}. ${but}`,
      hint: `Écris l’équation ${M(ct.a)} × x ${ct.b < 0 ? '−' : '+'} ${M(Math.abs(ct.b))} = ${M(y)} : isole d’abord le terme en x en retirant ${ct.b < 0 ? 'l’opposé de ' : ''}${M(Math.abs(ct.b))}, puis divise par ${M(ct.a)}.`,
      solution: `On résout l’équation ${M(ct.a)} × x ${ct.b < 0 ? '−' : '+'} ${M(Math.abs(ct.b))} = ${M(y)}.<br>On isole le terme en x : ${M(ct.a)} × x = ${M(y)} ${ct.b < 0 ? '+' : '−'} ${M(Math.abs(ct.b))} = ${M(dy)}.<br>Puis x = ${M(dy)} ÷ ${P(ct.a)} = <b>${M(x)}</b>${ct.ux}.` };
  },
  ex: { id: 'rev', pts: [{ x: 1, y: 9 }, { x: 2, y: 11 }, { x: 3, y: 12 }, { x: 5, y: 14 }, { x: 6, y: 15 }, { x: 7, y: 17 }, { x: 8, y: 17 }, { x: 9, y: 19 }], x: 5 },
};

export const LV12 = niveau('Nuage de points et ajustement affine', [sensLiaison, lireNuage, pointMoyen, placeG, interp, extrap, droiteG, fiable, inverseDroite], {
  n: 12,
  intro: 'Deux caractères mesurés sur les mêmes individus se représentent par un nuage de points. Quand les points suivent à peu près une droite, on peut utiliser cette droite pour estimer une valeur : c’est l’ajustement affine.',
  def: `Un <b>nuage de points</b> représente les couples (x ; y) mesurés. Son <b>point moyen</b> est <span class="nw">G(x̄ ; ȳ)</span>, où x̄ et ȳ sont les moyennes des x et des y. Une <b>droite d’ajustement</b> y = ax + b résume le nuage : on s’en sert pour estimer y pour une valeur de x, en <b>interpolant</b> (x entre les valeurs observées) ou en <b>extrapolant</b> (x en dehors).`,
  visuel: nuage([1, 2, 3, 5, 6, 7, 8, 9].map((x, i) => ({ x, y: [9, 11, 12, 14, 15, 17, 17, 19][i] })), { xr: [0, 10], yr: [0, 20], gx: 1, gy: 1, lx: 1, ly: 2, xt: 'révision (h par semaine)', yt: 'note (sur 20)', G: { x: 5.125, y: 14.25, l: 'G' }, droite: { a: 1.2, b: 8, x0: 0, x1: 10 } }),
  methode: ['Sens de la liaison : le nuage monte (x et y varient dans le même sens) ou descend, ou n’a pas de direction.', 'Point moyen : moyenne des x, moyenne des y.', 'Estimer y pour un x donné : remplace x dans l’équation de la droite. Retrouver x pour un y donné : résous l’équation.'],
  warn: ['Une extrapolation (x hors de l’intervalle observé) est une prévision fragile : la tendance peut changer.', 'Une droite d’ajustement ne passe pas par tous les points : le résultat est une valeur approchée.', 'Un lien entre deux caractères ne prouve pas que l’un cause l’autre.'],
  retenir: 'point moyen G(x̄ ; ȳ) ; droite d’ajustement y = ax + b pour estimer y ; interpolation fiable, extrapolation prudente.',
});

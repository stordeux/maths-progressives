// Niveaux 1 à 3 : moyenne pondérée et fréquences ; linéarité de la moyenne et valeur ajoutée ; médiane, quartiles, écart interquartile.
import { ri, pick, shuffle, M, P, big, lst, pc, fv, plus, somme, rNums, rChoice, niveau, tabEff } from './outils.js';
import { CTX, sum, range, moy, rnd, entier, dec, cherche, serie, valeursTab, effCloche, expand, asc, cumul, rangQ, q1, q3, med, mean, partition, quantCount, medCount } from './stat.js';
import { tab, pointsSurDroite } from './draw.js';
import { barChart, boxPlot } from '../stats3e/draw.js';

const sub = k => (k === 1 ? 'Q₁' : 'Q₃');
const nth = r => (r === 1 ? '1<sup>re</sup>' : `${r}<sup>e</sup>`);
/** gabarit « Libellé : {0} unité » */
const tplU = (lab, C, i = 0) => `${lab} : {${i}}${C.u}`;
/** la phrase qui ouvre un exercice sur un tableau */
const ouvre = (C, extra = '') => `${C.tab}${extra}`;

/* ===================================================================== 1. moyenne pondérée et fréquences */
/** tableau valeurs / effectifs au hasard : k valeurs, effectif total N */
function tirage(C, k, N) { return { C, vals: valeursTab(C, k), effs: effCloche(k, N) }; }
const NS1 = [8, 10, 12, 15, 16, 20, 24, 25, 30];

const effManq = {
  id: 'eff-manq', dmin: 0, titre: 'effectif manquant',
  draw: d => { const k = d < 2 ? 4 : 5, N = pick(d < 2 ? [20, 24, 25, 30] : NS1.concat([32, 36, 40])); return { ...tirage(pick(CTX), k, N), j: ri(0, k - 1) }; },
  build: p => {
    const { C, vals, effs, j } = p, N = sum(effs), connus = effs.filter((_, i) => i !== j), s = sum(connus), cells = effs.map((e, i) => (i === j ? '?' : e));
    return { ...rNums([effs[j]], { tpl: 'Effectif manquant : {0}', value: effs[j], near: [[[s, `${M(s)} est la somme des effectifs connus : il reste à la retirer de ${M(N)}.`]]] }),
      html: `${ouvre(C)} Il y a ${M(N)} ${C.ent} en tout.${tabEff(C, vals, cells)}Quel est l’effectif de la valeur ${fv(vals[j], C.u)} ?`,
      hint: `Additionne les effectifs connus (${connus.map(M).join(' + ')}), puis retire ce total de l’effectif total ${M(N)}.`,
      solution: `Effectifs connus : ${plus(connus)} = ${M(s)}.<br>Effectif manquant : ${M(N)} − ${M(s)} = <b>${M(effs[j])}</b>.` };
  },
  ex: { C: CTX[0], vals: [8, 9, 10, 11], effs: [4, 7, 9, 5], j: 2 },
};

const frequence = {
  id: 'freq', dmin: 0, titre: 'fréquence d’une valeur en %',
  draw: d => { const k = d < 2 ? 4 : 5, N = pick(d < 2 ? [20, 25, 40, 50] : [10, 20, 25, 40, 50]); const t = tirage(pick(CTX), k, N); return { ...t, j: ri(0, k - 1) }; },
  build: p => {
    const { C, vals, effs, j } = p, N = sum(effs), f = effs[j] / N * 100;
    if (dec(f) < 0 || dec(f) > 2) return null;
    return { ...rNums([f], { tpl: 'Fréquence : {0} %', value: f, near: [[[effs[j] / N, `${M(effs[j] / N)} est la fréquence écrite en nombre décimal : demande-t-on un pourcentage ?`], [effs[j], 'Tu as donné l’effectif : la fréquence se calcule en divisant par l’effectif total.']]] }),
      html: `${ouvre(C)}${tabEff(C, vals, effs)}Quelle est la fréquence de la valeur ${fv(vals[j], C.u)}, en pourcentage ?`,
      hint: `La fréquence de ${fv(vals[j], C.u)} est son effectif (${M(effs[j])}) divisé par l’effectif total (la somme de la ligne des effectifs), puis exprimé en pourcentage.`,
      solution: `Effectif total : ${plus(effs)} = ${M(N)}.<br>Fréquence de ${fv(vals[j], C.u)} : ${M(effs[j])} ÷ ${M(N)} = ${M(f / 100)}, soit <b>${M(f)} %</b>.` };
  },
  ex: { C: CTX[0], vals: [8, 9, 10, 11], effs: [4, 7, 5, 4], j: 1 },
};

const moyPond = {
  id: 'moy-pond', dmin: 0, titre: 'moyenne à partir des effectifs',
  draw: d => cherche(() => { const k = d < 2 ? 4 : 5, N = pick(d < 2 ? [10, 12, 15, 20] : [20, 25, 40]), C = pick(CTX); return tirage(C, k, N); },
    t => { const m = moy(t.vals, t.effs); return d < 2 ? entier(m) : dec(m) >= 0 && dec(m) <= 2 && !entier(m); }),
  build: p => {
    const { C, vals, effs } = p, N = sum(effs), S = sum(vals.map((x, i) => x * effs[i])), m = S / N;
    return { ...rNums([m], { tpl: tplU('Moyenne', C), value: m, near: [[[mean(vals), 'Tu as fait la moyenne des valeurs sans tenir compte des effectifs.'], [S, `${M(S)} est la somme de toutes les valeurs : il reste à la diviser par l’effectif total ${M(N)}.`]]] }),
      html: `${ouvre(C)}${tabEff(C, vals, effs)}Calcule la moyenne de cette série.`,
      hint: `Multiplie chaque valeur par son effectif (${vals.slice(0, 2).map((x, i) => `${M(x)} × ${M(effs[i])}`).join(', ')}…), additionne tout, puis divise par l’effectif total ${M(N)}.`,
      solution: `Somme des valeurs : ${somme(vals, effs, (x, e) => `${M(e)} × ${M(x)}`)} = ${M(S)}.<br>Effectif total : ${plus(effs)} = ${M(N)}.<br>Moyenne : ${M(S)} ÷ ${M(N)} = <b>${M(m)}</b>${C.u}.` };
  },
  ex: { C: CTX[0], vals: [8, 9, 10, 11], effs: [3, 4, 2, 1] },
};

const moyQcm = {
  id: 'moy-qcm', dmin: 1, titre: 'choisir le bon calcul de la moyenne',
  draw: d => { const C = pick(CTX), t = tirage(C, 3, pick([10, 12, 15, 20])); return t; },
  build: p => {
    const { C, vals, effs } = p, N = sum(effs), pr = vals.map((x, i) => `${M(effs[i])} × ${M(x)}`).join(' + ');
    return { ...rChoice([
      { l: `(${pr}) ÷ ${M(N)}`, ok: true },
      { l: `(${vals.map(M).join(' + ')}) ÷ 3`, why: 'Tu as additionné les valeurs sans tenir compte de leurs effectifs : chaque valeur compte autant de fois que son effectif.' },
      { l: `(${effs.map(M).join(' + ')}) ÷ 3`, why: 'Ici tu as fait la moyenne des effectifs, pas celle des valeurs.' },
      { l: `${pr}`, why: 'Il manque la division par l’effectif total : on obtient la somme de toutes les valeurs, pas leur moyenne.' },
    ], { indep: `(${pr}) ÷ ${M(N)}` }),
      html: `${ouvre(C)}${tabEff(C, vals, effs)}Quelle expression donne la moyenne de cette série ?`,
      hint: `La valeur ${M(vals[0])} apparaît ${M(effs[0])} fois, ${M(vals[1])} apparaît ${M(effs[1])} fois… : multiplie chaque valeur par son effectif, additionne, puis divise par ${M(N)}.`,
      solution: `L’effectif total est ${plus(effs)} = ${M(N)}.<br>Chaque valeur est comptée autant de fois que son effectif : la moyenne est (${pr}) ÷ ${M(N)}.` };
  },
  ex: { C: CTX[0], vals: [8, 10, 12], effs: [3, 4, 5] },
};

const moyFreq = {
  id: 'moy-freq', dmin: 2, titre: 'moyenne à partir des fréquences',
  draw: d => { const C = pick(CTX), k = d < 4 ? 4 : 5; return { C, vals: valeursTab(C, k), fr: partition(20, k, 1).map(x => x * 5) }; },
  build: p => {
    const { C, vals, fr } = p, S = sum(vals.map((x, i) => x * fr[i])), m = S / 100;
    if (dec(m) > 2) return null;
    return { ...rNums([m], { tpl: tplU('Moyenne', C), value: m, near: [[[S, `${M(S)} est la somme des produits : les fréquences sont des pourcentages, il reste à diviser par 100.`], [mean(vals), 'Les valeurs n’ont pas toutes le même poids : tiens compte des fréquences.']]] }),
      html: `${ouvre(C)}${tab([[C.h, ...vals], ['Fréquence (%)', ...fr]])}Calcule la moyenne de cette série.`,
      hint: `La valeur ${fv(vals[0], C.u)} représente ${M(fr[0])} % des données : multiplie chaque valeur par sa fréquence (${M(fr[0])}, ${M(fr[1])}…), additionne, puis divise par 100.`,
      solution: `Somme pondérée : ${somme(vals, fr, (x, f) => `${M(f)} × ${M(x)}`)} = ${M(S)}.<br>Les fréquences sont en pourcentage : ${M(S)} ÷ 100 = <b>${M(m)}</b>${C.u}.` };
  },
  ex: { C: CTX[0], vals: [8, 9, 10, 11], fr: [10, 30, 40, 20] },
};

const PARTS = [
  { qui: 'élèves d’un lycée', cond: 'sont demi-pensionnaires', ns: [300, 400, 500, 600, 800, 1200] },
  { qui: 'abonnés d’un club de sport', cond: 'ont moins de 25 ans', ns: [200, 300, 400, 500, 800] },
  { qui: 'spectateurs d’un match', cond: 'sont venus en famille', ns: [500, 600, 800, 1000, 1500] },
  { qui: 'adhérents d’une médiathèque', cond: 'ont emprunté un livre ce mois-ci', ns: [200, 250, 400, 500, 1000] },
];
const part = {
  id: 'part', dmin: 3, titre: 'effectif à partir d’une proportion',
  draw: d => { const S = pick(PARTS); return { S, N: pick(S.ns), p: d < 4 ? 5 * ri(2, 18) : ri(7, 93) }; },
  build: p => {
    const { S, N, p: pct } = p, e = N * pct / 100;
    if (!entier(e)) return null;
    return { ...rNums([e], { tpl: 'Effectif : {0}', value: e, near: [[[N * pct / 100 / 100, 'Un pourcentage de N, c’est N × p ÷ 100 : vérifie l’ordre de grandeur de ta réponse.'], [pct, `${M(pct)} est le pourcentage : on demande le nombre de personnes.`]]] }),
      html: `Parmi les ${M(N)} ${S.qui}, ${pc(pct)} ${S.cond}. Combien de personnes cela représente-t-il ?`,
      hint: `${M(pct)} % de ${M(N)} : une proportion de ${M(pct)} sur 100 s’applique à l’effectif total ${M(N)} (multiplie, puis divise par 100).`,
      solution: `${pc(pct)} de ${M(N)} : ${M(N)} × ${M(pct)} ÷ 100 = <b>${M(e)}</b>.` };
  },
  ex: { S: PARTS[0], N: 600, p: 35 },
};

export const LV1 = niveau('Moyenne, effectifs, fréquences', [effManq, frequence, moyPond, moyQcm, moyFreq, part], {
  n: 1,
  intro: 'Rappel des séries du collège : un tableau d’effectifs résume une série ; la moyenne et la fréquence en découlent. On les retrouve avec des tableaux plus grands.',
  def: `L’<b>effectif</b> d’une valeur est le nombre de fois qu’elle apparaît ; l’<b>effectif total</b> N est la somme des effectifs. La <b>fréquence</b> d’une valeur est ${'<span class="nw">effectif ÷ N</span>'} (en nombre décimal ou en %). La <b>moyenne</b> d’une série est ${'<span class="nw">(n₁ × x₁ + n₂ × x₂ + …) ÷ N</span>'} : chaque valeur xᵢ est multipliée par son effectif nᵢ.`,
  visuel: tabEff(CTX[0], [8, 9, 10], [3, 5, 2], { extra: [['Fréquence', '30 %', '50 %', '20 %']] }) + barChart({ cats: [8, 9, 10], vals: [3, 5, 2], meanLine: 8.9, xTitle: 'note (sur 20)' }),
  methode: ['Calcule l’effectif total N en additionnant la ligne des effectifs.', 'Fréquence d’une valeur : effectif ÷ N, que l’on écrit en %.', 'Moyenne : multiplie chaque valeur par son effectif, additionne, puis divise par N (ou par 100 si l’on a des fréquences en %).'],
  warn: ['Faire la moyenne des valeurs sans leurs effectifs : (8 + 9 + 10) ÷ 3 n’est pas la moyenne du tableau ci-dessus.', 'Oublier de diviser par l’effectif total.', 'Confondre effectif et fréquence : une fréquence est toujours comprise entre 0 et 1 (ou entre 0 % et 100 %).'],
  retenir: 'fréquence = effectif ÷ effectif total ; moyenne = somme des (valeur × effectif) ÷ effectif total.',
});

/* ===================================================================== 2. linéarité de la moyenne, valeur ajoutée ou retirée */
const SC_ADD = [
  { t: (m, k) => `La moyenne des notes d’une classe à un devoir est ${M(m)}. Le professeur ajoute ${M(k)} point${k > 1 ? 's' : ''} à toutes les copies.`, q: 'Quelle est la nouvelle moyenne de la classe ?', u: '', s: 1, lo: 7, hi: 14, ks: [1, 2, 3] },
  { t: (m, k) => `Un thermomètre mal réglé indique chaque jour ${M(k)} °C de moins que la température réelle. La moyenne des températures relevées pendant un mois est ${M(m)} °C.`, q: 'Quelle est la température moyenne réelle ?', u: ' °C', s: 1, lo: 14, hi: 26, ks: [1, 2, 3] },
  { t: (m, k) => `Les tailles de 25 élèves ont été mesurées avec leurs chaussures, qui ajoutent ${M(k)} cm à chacun. La taille moyenne mesurée est ${M(m)} cm.`, q: 'Quelle est la taille moyenne sans les chaussures ?', u: ' cm', s: -1, lo: 164, hi: 176, ks: [2, 3, 4] },
  { t: (m, k) => `Une boulangerie vend 12 sortes de pains. Le prix moyen d’un pain est ${M(m)} €. Le boulanger baisse chaque prix de ${M(k)} centimes, soit de ${M(k / 100)} €.`, q: 'Quel est le nouveau prix moyen (en €) ?', u: ' €', s: -1, lo: 2, hi: 4, ks: [10, 20, 30] },
];
const linAdd = {
  id: 'lin-add', dmin: 0, titre: 'ajouter la même valeur à toutes les données',
  draw: d => { const i = ri(0, SC_ADD.length - 1), S = SC_ADD[i], k = pick(S.ks); return { i, m: d < 1 ? ri(S.lo, S.hi) : ri(S.lo * 2, S.hi * 2) / 2, k }; },
  build: p => {
    const S = SC_ADD[p.i], { m, k } = p, dk = p.i === 3 ? k / 100 : k, r = m + S.s * dk;
    if (r <= 0) return null;
    const verbe = S.s > 0 ? 'augmente' : 'diminue', verbes = S.s > 0 ? 'augmentent' : 'diminuent';
    return { ...rNums([r], { tpl: `Moyenne : {0}${S.u}`, value: r, near: [[[m, `${M(m)} est la moyenne de départ : elle change quand on modifie toutes les valeurs.`]]] }),
      html: `${S.t(m, k)} ${S.q}`,
      hint: `Toutes les valeurs ${verbes} de ${M(dk)} : la moyenne ${verbe} aussi de ${M(dk)}. Pars de ${M(m)}.`,
      solution: `Quand on ${S.s > 0 ? 'ajoute' : 'retire'} le même nombre ${M(dk)} à toutes les valeurs, la moyenne ${verbe} de ${M(dk)}.<br>${M(m)} ${S.s > 0 ? '+' : '−'} ${M(dk)} = <b>${M(r)}</b>${S.u}.` };
  },
  ex: { i: 0, m: 10.5, k: 2 },
};

const SC_MUL = [
  { t: m => `La durée moyenne d’un trajet en train est de ${M(m)} h. Chaque durée est maintenant exprimée en minutes.`, q: 'Quelle est la durée moyenne en minutes ?', a: 60, lo: 1.25, hi: 5, st: 0.25, u: ' min', c: 'chaque durée en heures est multipliée par 60' },
  { t: m => `La taille moyenne des élèves d’une classe est de ${M(m)} m. Chaque taille est exprimée en centimètres.`, q: 'Quelle est la taille moyenne en centimètres ?', a: 100, lo: 1.6, hi: 1.8, st: 0.01, u: ' cm', c: 'chaque taille en mètres est multipliée par 100' },
  { t: m => `Le prix moyen hors taxes d’un article est de ${M(m)} €. On ajoute la TVA de 20 % à chaque prix, ce qui multiplie chaque prix par 1,2.`, q: 'Quel est le prix moyen toutes taxes comprises ?', a: 1.2, lo: 10, hi: 60, st: 5, u: ' €', c: 'chaque prix est multiplié par 1,2' },
  { t: m => `La distance moyenne parcourue par les clients d’un loueur de vélos est de ${M(m)} km. Chaque distance est exprimée en mètres.`, q: 'Quelle est la distance moyenne en mètres ?', a: 1000, lo: 2, hi: 9, st: 0.5, u: ' m', c: 'chaque distance en km est multipliée par 1 000' },
  { t: m => `La note moyenne d’une classe est ${M(m)} sur 20. Le professeur la convertit sur 100 en multipliant chaque note par 5.`, q: 'Quelle est la moyenne sur 100 ?', a: 5, lo: 8, hi: 16, st: 0.5, u: '', c: 'chaque note est multipliée par 5' },
];
const linMul = {
  id: 'lin-mul', dmin: 1, titre: 'multiplier toutes les données par le même nombre',
  draw: d => { const i = ri(0, SC_MUL.length - 1), S = SC_MUL[i]; return { i, m: rnd(S.lo + S.st * ri(0, Math.round((S.hi - S.lo) / S.st)), 3) }; },
  build: p => {
    const S = SC_MUL[p.i], m = p.m, r = rnd(m * S.a, 4);
    if (dec(r) < 0 || dec(r) > 2) return null;
    return { ...rNums([r], { tpl: `Moyenne : {0}${S.u}`, value: r, near: [[[m, `${M(m)} est la moyenne de départ : elle est multipliée comme chaque valeur.`]]] }),
      html: `${S.t(m)} ${S.q}`,
      hint: `Si on multiplie toutes les valeurs par ${M(S.a)}, la moyenne est multipliée par ${M(S.a)} : multiplie la moyenne ${M(m)} par ${M(S.a)}.`,
      solution: `${S.c[0].toUpperCase()}${S.c.slice(1)}, donc la moyenne aussi.<br>${M(m)} × ${M(S.a)} = <b>${M(r)}</b>${S.u}.` };
  },
  ex: { i: 0, m: 1.5 },
};

const SC_AFF = [
  { t: m => `La température moyenne relevée dans une ville est de ${M(m)} °C. Le thermomètre d’un touriste américain donne F = 1,8 × C + 32 (F en degrés Fahrenheit, C en degrés Celsius).`, q: 'Quelle est la température moyenne en °F ?', a: 1.8, b: 32, lo: 10, hi: 30, st: 2.5, u: ' °F' },
  { t: m => `Dans une ville, une course de taxi coûte 3 € de prise en charge plus 1,5 € par kilomètre. La distance moyenne des courses d’un chauffeur est de ${M(m)} km.`, q: 'Quel est le prix moyen d’une course ?', a: 1.5, b: 3, lo: 4, hi: 14, st: 1, u: ' €' },
  { t: m => `Un professeur transforme chaque note x en une note x′ = 0,8 × x + 4. La moyenne des notes x est ${M(m)}.`, q: 'Quelle est la moyenne des notes x′ ?', a: 0.8, b: 4, lo: 8, hi: 16, st: 0.5, u: '' },
];
const linAff = {
  id: 'lin-aff', dmin: 2, titre: 'appliquer une formule x → a x + b',
  draw: d => { const i = ri(0, SC_AFF.length - 1), S = SC_AFF[i]; return { i, m: rnd(S.lo + S.st * ri(0, Math.round((S.hi - S.lo) / S.st)), 3) }; },
  build: p => {
    const S = SC_AFF[p.i], m = p.m, am = S.a * m, r = am + S.b;
    if (dec(r) < 0 || dec(r) > 2) return null;
    return { ...rNums([r], { tpl: `Moyenne : {0}${S.u}`, value: r, near: [[[am, `${M(am)} est la moyenne multipliée par ${M(S.a)} : il faut encore ajouter ${M(S.b)}.`], [m, 'La moyenne change aussi : applique-lui la même formule qu’à chaque donnée.']]] }),
      html: `${S.t(m)} ${S.q}`,
      hint: `La moyenne se transforme comme chaque donnée : remplace x par la moyenne ${M(m)} dans la formule (multiplie par ${M(S.a)}, puis ajoute ${M(S.b)}).`,
      solution: `Pour une formule du type a × x + b, la moyenne se calcule avec la même formule.<br>${M(S.a)} × ${M(m)} = ${M(am)}, puis ${M(am)} + ${M(S.b)} = <b>${M(r)}</b>${S.u}.` };
  },
  ex: { i: 0, m: 15 },
};

const SC_VAL = [
  { nom: 'notes', lo: 4, hi: 20, t: (n, m) => `La moyenne de ${n} élèves à un devoir est ${M(m)}.`, aj: v => `Un élève absent rattrape le devoir et obtient ${M(v)}.`, re: v => `Un élève dont la note est ${M(v)} change de classe : sa copie est retirée.`, q: 'la nouvelle moyenne', u: '' },
  { nom: 'tailles', lo: 150, hi: 195, t: (n, m) => `La taille moyenne des ${n} joueurs d’une équipe de handball est ${M(m)} cm.`, aj: v => `Un joueur mesurant ${M(v)} cm rejoint l’équipe.`, re: v => `Un joueur mesurant ${M(v)} cm quitte l’équipe.`, q: 'la nouvelle taille moyenne', u: ' cm' },
  { nom: 'points', lo: 4, hi: 40, t: (n, m) => `Une basketteuse a marqué en moyenne ${M(m)} points lors de ses ${n} derniers matchs.`, aj: v => `Au match suivant, elle marque ${M(v)} points.`, re: v => `On retire de la liste son match le plus raté (${M(v)} points).`, q: 'sa nouvelle moyenne', u: ' points' },
];
const ajoutVal = {
  id: 'ajout-val', dmin: 1, titre: 'ajouter une valeur à la série',
  draw: d => cherche(() => {
    const i = ri(0, SC_VAL.length - 1), S = SC_VAL[i], n = ri(4, d < 3 ? 12 : 30), m = ri(Math.ceil(S.lo + (S.hi - S.lo) * 0.3), Math.floor(S.hi - (S.hi - S.lo) * 0.3));
    const m2 = m + ri(-3, 3) / (d < 3 ? 1 : 2), v = (n + 1) * m2 - n * m;
    return { i, n, m, v, m2 };
  }, p => p.m2 !== p.m && p.v >= SC_VAL[p.i].lo && p.v <= SC_VAL[p.i].hi && entier(p.v)),
  build: p => {
    const S = SC_VAL[p.i], { n, m, v, m2 } = p, s = n * m, s2 = s + v;
    return { ...rNums([m2], { tpl: `Moyenne : {0}${S.u}`, value: m2, near: [[[(m + v) / 2, `Pas de raccourci : la nouvelle moyenne n’est pas la moyenne de ${M(m)} et ${M(v)}, car l’ancienne moyenne représente ${M(n)} valeurs.`], [s2, `${M(s2)} est la nouvelle somme : il reste à diviser par ${M(n + 1)}.`]]] }),
      html: `${S.t(n, m)} ${S.aj(v)} Quelle est ${S.q} ?`,
      hint: `Retrouve d’abord la somme de départ (${M(n)} × ${M(m)}), ajoute la valeur ${M(v)}, puis divise par le nouveau nombre de valeurs, ${M(n + 1)}.`,
      solution: `Somme de départ : ${M(n)} × ${M(m)} = ${M(s)}.<br>Avec la nouvelle valeur : ${M(s)} + ${M(v)} = ${M(s2)}, pour ${M(n + 1)} valeurs.<br>Nouvelle moyenne : ${M(s2)} ÷ ${M(n + 1)} = <b>${M(m2)}</b>${S.u}.` };
  },
  ex: { i: 0, n: 9, m: 12, v: 17, m2: 12.5 },
};
const retireVal = {
  id: 'retire-val', dmin: 2, titre: 'retirer une valeur de la série',
  draw: d => cherche(() => {
    const i = ri(0, SC_VAL.length - 1), S = SC_VAL[i], n = ri(5, d < 3 ? 12 : 30), m = ri(Math.ceil(S.lo + (S.hi - S.lo) * 0.3), Math.floor(S.hi - (S.hi - S.lo) * 0.3));
    const m2 = m + ri(-3, 3) / (d < 3 ? 1 : 2), v = n * m - (n - 1) * m2;
    return { i, n, m, v, m2 };
  }, p => p.m2 !== p.m && p.v >= SC_VAL[p.i].lo && p.v <= SC_VAL[p.i].hi && entier(p.v)),
  build: p => {
    const S = SC_VAL[p.i], { n, m, v, m2 } = p, s = n * m, s2 = s - v;
    return { ...rNums([m2], { tpl: `Moyenne : {0}${S.u}`, value: m2, near: [[[(m * 2 - v), `Pas de raccourci : retirer une valeur ne revient pas à faire ${M(m)} × 2 − ${M(v)}. Passe par la somme des valeurs.`], [s2, `${M(s2)} est la nouvelle somme : il reste à diviser par ${M(n - 1)}.`]]] }),
      html: `${S.t(n, m)} ${S.re(v)} Quelle est ${S.q} ?`,
      hint: `Retrouve la somme de départ (${M(n)} × ${M(m)}), retire ${M(v)}, puis divise par le nouveau nombre de valeurs, ${M(n - 1)}.`,
      solution: `Somme de départ : ${M(n)} × ${M(m)} = ${M(s)}.<br>Sans la valeur retirée : ${M(s)} − ${M(v)} = ${M(s2)}, pour ${M(n - 1)} valeurs.<br>Nouvelle moyenne : ${M(s2)} ÷ ${M(n - 1)} = <b>${M(m2)}</b>${S.u}.` };
  },
  ex: { i: 1, n: 12, m: 180, v: 191, m2: 179 },
};

const SC_EXT = [
  { t: (L, v) => `Voici les durées (en minutes) de 5 trajets en bus : ${lst(L)}. Un jour de grève, un trajet dure ${M(v)} minutes : on ajoute cette valeur à la série.`, u: ' min', lo: 12, hi: 30, ext: [50, 60, 70, 80, 90] },
  { t: (L, v) => `Voici les salaires mensuels (en milliers d’euros) de 5 employés d’une petite entreprise : ${lst(L)}. Un directeur à ${M(v)} milliers d’euros rejoint l’entreprise : on ajoute cette valeur à la série.`, u: ' k€', lo: 2, hi: 5, ext: [14, 20, 26] },
  { t: (L, v) => `Voici les points marqués par une joueuse lors de ses 5 derniers matchs : ${lst(L)}. Lors du match suivant, elle marque ${M(v)} points : on ajoute cette valeur à la série.`, u: ' points', lo: 8, hi: 20, ext: [38, 44, 50] },
];
const ajoutExt = {
  id: 'ajout-ext', dmin: 1, titre: 'valeur extrême : effet sur la moyenne et la médiane',
  draw: d => cherche(() => {
    const i = ri(0, SC_EXT.length - 1), S = SC_EXT[i], L = asc(Array.from({ length: 5 }, () => ri(S.lo, S.hi))), v = pick(S.ext);
    return { i, L: shuffle([...L]), v };
  }, p => { const m1 = sum(p.L) / 5, m2 = (sum(p.L) + p.v) / 6, B = asc([...p.L, p.v]), me2 = (B[2] + B[3]) / 2; return entier(m2 * 2) && new Set(p.L).size >= 4 && m2 - m1 > 2 && m2 - m1 > 2.5 * Math.abs(me2 - asc(p.L)[2]); }),
  build: p => {
    const S = SC_EXT[p.i], { L, v } = p, s = sum(L), s2 = s + v, A = asc(L), B = asc([...L, v]);
    const m1 = s / 5, me1 = A[2], m2 = s2 / 6, me2 = (B[2] + B[3]) / 2;
    return { ...rNums([m2, me2], { tpl: `Moyenne : {0}${S.u} Médiane : {1}${S.u}`, value: me2, verify: E => Math.abs(E[0] - mean([...L, v])) < 1e-9 && Math.abs(E[1] - medCount([...L, v])) < 1e-9, near: [[], [[me1, 'Avec 6 valeurs, la médiane est la moyenne des 3<sup>e</sup> et 4<sup>e</sup> valeurs rangées : elle a changé.']]] }),
      html: `${S.t(L, v)} Calcule la nouvelle moyenne et la nouvelle médiane.`,
      hint: `Pour la moyenne : additionne les 5 valeurs (${plus(L.slice(0, 3))} …) et ${M(v)}, puis divise par 6. Pour la médiane : range les 6 valeurs et fais la moyenne des deux du milieu.`,
      solution: `Somme des 6 valeurs : ${plus(L)} + ${M(v)} = ${M(s2)}, donc moyenne : ${M(s2)} ÷ 6 = <b>${M(m2)}</b>${S.u}.<br>Rangées : ${lst(B)}. La médiane est la moyenne de la 3<sup>e</sup> (${M(B[2])}) et de la 4<sup>e</sup> (${M(B[3])}) : (${M(B[2])} + ${M(B[3])}) ÷ 2 = <b>${M(me2)}</b>${S.u}.<br>La moyenne passe de ${M(m1)} à ${M(m2)}, la médiane de ${M(me1)} à ${M(me2)} : la valeur extrême agit surtout sur la moyenne, la médiane y est bien moins sensible.` };
  },
  ex: { i: 0, L: [18, 15, 20, 16, 21], v: 72 },
};

/** B obtenue en modifiant A ; cible : 'moy' (seule la moyenne change), 'les deux', 'med' (seule la médiane change) */
const qcmEffet = {
  id: 'qcm-effet', dmin: 3, titre: 'que change le remplacement d’une valeur ?',
  draw: d => {
    const cible = pick(['moy', 'les deux', 'moy', 'les deux', 'med']), C = pick(CTX.filter(c => c.pas === 1 && c.hi - c.lo >= 8));
    const n = pick([7, 9]);
    return cherche(() => {
      const A = asc(serie(C, n)), B = [...A], i = ri(0, n - 1), j = ri(0, n - 1), k = ri(1, 6);
      B[i] = A[i] + (cible === 'med' ? k : ri(-6, 6) || 1);
      if (cible === 'med') B[j] = A[j] - k;
      if (B.some(x => x < C.lo || x > C.hi)) return null;
      const a = { m: mean(A), d: medCount(A) }, b = { m: mean(B), d: medCount(B) };
      const rep = (Math.abs(a.m - b.m) > 1e-9 ? 1 : 0) + (a.d !== b.d ? 2 : 0);
      const lab = rep === 1 ? 'moy' : rep === 3 ? 'les deux' : rep === 2 ? 'med' : null;
      return lab === cible && i !== j ? { C, A: shuffle([...A]), B: shuffle([...B]), cible } : null;
    });
  },
  build: p => {
    const { C, A, B } = p, a = { m: mean(A), d: medCount(A) }, b = { m: mean(B), d: medCount(B) };
    const rep = (Math.abs(a.m - b.m) > 1e-9 ? 1 : 0) + (a.d !== b.d ? 2 : 0);
    const T = { 1: 'seule la moyenne change', 3: 'la moyenne et la médiane changent', 2: 'seule la médiane change', 0: 'ni la moyenne ni la médiane ne changent' };
    const bilan = `Recalcule : moyenne ${M(rnd(a.m, 2))} → ${M(rnd(b.m, 2))}, médiane ${M(a.d)} → ${M(b.d)}.`;
    const items = [1, 3, 2, 0].map(r => ({ l: T[r][0].toUpperCase() + T[r].slice(1) + '.', ok: r === rep, why: r === rep ? '' : bilan }));
    return { ...rChoice(items, { ordre: false, indep: T[rep][0].toUpperCase() + T[rep].slice(1) + '.' }),
      html: `${C.liste(A.length)}<br><b>Série A :</b> ${lst(A)}<br><b>Série B :</b> ${lst(B)}<br>La série B se déduit de la série A en changeant des valeurs. Que peut-on dire ?`,
      hint: `Compare la somme des valeurs de A et de B, puis range chaque série : la médiane est la ${nth((A.length + 1) / 2)} valeur (${A.length} valeurs).`,
      solution: `Série A : somme ${M(sum(A))}, médiane ${M(a.d)}. Série B : somme ${M(sum(B))}, médiane ${M(b.d)}.<br>Donc ${T[rep]}.` };
  },
  ex: { C: CTX[0], A: [9, 12, 7, 15, 11, 13, 10], B: [9, 12, 7, 25, 11, 13, 10], cible: 'moy' },
};

export const LV2 = niveau('Linéarité et valeur ajoutée', [linAdd, linMul, ajoutVal, ajoutExt, linAff, retireVal, qcmEffet], {
  n: 2,
  intro: 'Que devient la moyenne quand on transforme toutes les données, ou quand on ajoute ou retire une valeur ? On peut souvent répondre sans refaire tout le calcul.',
  def: `<b>Linéarité de la moyenne</b> : si on remplace chaque valeur x par <span class="nw">a × x + b</span>, la moyenne m devient <span class="nw">a × m + b</span>. Pour <b>ajouter ou retirer une valeur</b>, on passe par la <b>somme</b> : somme = effectif × moyenne.`,
  visuel: pointsSurDroite([{ nom: 'notes avant', vals: [8, 9, 9, 11, 12] }, { nom: 'notes après (+ 2 points)', vals: [10, 11, 11, 13, 14] }], { lo: 6, hi: 16 }),
  methode: ['Une transformation x → a × x + b de toutes les valeurs : applique la même formule à la moyenne.', 'Une valeur ajoutée ou retirée : calcule la somme (n × m), ajoute ou retire la valeur, puis divise par le nouvel effectif.', 'Une valeur extrême fait varier la moyenne, très peu la médiane.'],
  warn: ['La nouvelle moyenne n’est pas la moyenne de l’ancienne moyenne et de la valeur ajoutée : l’ancienne moyenne représente n valeurs.', 'Si l’on multiplie les données par a, la moyenne est multipliée par a, et pas seulement augmentée.', 'Une valeur très grande ne change presque pas la médiane, mais beaucoup la moyenne.'],
  retenir: 'la moyenne de a × x + b est a × m + b ; pour une valeur ajoutée ou retirée, on utilise la somme n × m.',
});

/* ===================================================================== 3. médiane, quartiles, écart interquartile */
const tirageListe = (d, impair = true) => { const C = pick(CTX), n = impair ? pick(d < 1 ? [7, 9] : [9, 11, 13]) : pick(d < 3 ? [8, 10, 12] : [10, 12, 14]); return { C, L: serie(C, n) }; };
const medListe = {
  id: 'med-liste', dmin: 0, titre: 'médiane d’une liste',
  draw: d => tirageListe(d, d < 2 || ri(0, 1) === 0),
  build: p => {
    const { C, L } = p, n = L.length, s = asc(L), me = med(s), k = Math.ceil(n / 2);
    if (new Set(L).size < 4) return null;
    const impair = n % 2 === 1;
    return { ...rNums([me], { tpl: tplU('Médiane', C), value: medCount(L), near: [[[mean(L), 'Tu as calculé la moyenne : la médiane se lit sur la série rangée.']]] }),
      html: `${C.liste(n)}${big(lst(L))}Quelle est la médiane de cette série ?`,
      hint: `Range d’abord les ${n} valeurs dans l’ordre croissant. ${impair ? `Il y en a ${n} (impair) : la médiane est la valeur de rang ${k}.` : `Il y en a ${n} (pair) : la médiane est la moyenne des valeurs de rang ${n / 2} et ${n / 2 + 1}.`}`,
      solution: `Rangée : ${lst(s)}.<br>${impair ? `${n} valeurs : la médiane est la ${nth(k)}, soit <b>${M(me)}</b>${C.u}.` : `${n} valeurs : la ${nth(n / 2)} est ${M(s[n / 2 - 1])} et la ${nth(n / 2 + 1)} est ${M(s[n / 2])}. Médiane : (${M(s[n / 2 - 1])} + ${M(s[n / 2])}) ÷ 2 = <b>${M(me)}</b>${C.u}.`}` };
  },
  ex: { C: CTX[0], L: [14, 8, 12, 17, 9, 11, 13] },
};

const quartListe = {
  id: 'quart-liste', dmin: 1, titre: 'quartiles d’une liste',
  draw: d => { const C = pick(CTX), n = d < 3 ? pick([8, 12, 16]) : pick([9, 11, 13, 14, 15]); return { C, L: serie(C, n) }; },
  build: p => {
    const { C, L } = p, n = L.length, s = asc(L), r1 = rangQ(n, 1), r3 = rangQ(n, 3), a = s[r1 - 1], b = s[r3 - 1];
    if (new Set(L).size < 5) return null;
    return { ...rNums([a, b], { tpl: `${sub(1)} : {0}${C.u} ${sub(3)} : {1}${C.u}`, value: b, verify: E => E[0] === quantCount(L, 25) && E[1] === quantCount(L, 75), near: [[[med(s), 'Cette valeur est la médiane : le premier quartile est plus bas.']], [[med(s), 'Cette valeur est la médiane : le troisième quartile est plus haut.']]] }),
      html: `${C.liste(n)}${big(lst(L))}Donne le premier quartile ${sub(1)} et le troisième quartile ${sub(3)} de cette série.`,
      hint: `Range les ${n} valeurs. ${sub(1)} est la valeur de rang ${n} ÷ 4 (arrondi au rang entier supérieur) et ${sub(3)} celle de rang 3 × ${n} ÷ 4.`,
      solution: `Rangée : ${lst(s)}.<br>${n} ÷ 4 = ${M(n / 4)}, donc ${sub(1)} est la ${nth(r1)} valeur : <b>${M(a)}</b>${C.u}.<br>3 × ${n} ÷ 4 = ${M(3 * n / 4)}, donc ${sub(3)} est la ${nth(r3)} valeur : <b>${M(b)}</b>${C.u}.` };
  },
  ex: { C: CTX[0], L: [14, 8, 12, 17, 9, 11, 13, 10] },
};

const eiqListe = {
  id: 'eiq-liste', dmin: 2, titre: 'écart interquartile d’une liste',
  draw: d => { const C = pick(CTX), n = d < 4 ? pick([8, 12, 16]) : pick([9, 11, 13, 15]); return { C, L: serie(C, n) }; },
  build: p => {
    const { C, L } = p, n = L.length, s = asc(L), r1 = rangQ(n, 1), r3 = rangQ(n, 3), a = s[r1 - 1], b = s[r3 - 1], e = b - a;
    if (new Set(L).size < 5 || e === 0) return null;
    return { ...rNums([e], { tpl: tplU('Écart interquartile', C), value: e, near: [[[b - s[0], 'Tu as calculé une étendue ou un autre écart : l’écart interquartile est Q₃ − Q₁.'], [b, `${M(b)} est ${sub(3)} : il reste à retirer ${sub(1)}.`]]] }),
      html: `${C.liste(n)}${big(lst(L))}Quel est l’écart interquartile de cette série ?`,
      hint: `Range les ${n} valeurs, repère ${sub(1)} (rang ${n} ÷ 4, arrondi au rang entier supérieur) et ${sub(3)} (rang 3 × ${n} ÷ 4), puis fais la différence.`,
      solution: `Rangée : ${lst(s)}.<br>${sub(1)} est la ${nth(r1)} valeur : ${M(a)}. ${sub(3)} est la ${nth(r3)} valeur : ${M(b)}.<br>Écart interquartile : ${M(b)} − ${M(a)} = <b>${M(e)}</b>${C.u}.` };
  },
  ex: { C: CTX[0], L: [14, 8, 12, 17, 9, 11, 13, 10, 15, 6, 16, 12] },
};

const quartEff = {
  id: 'quart-eff', dmin: 2, titre: 'quartiles et médiane avec des effectifs',
  draw: d => { const C = pick(CTX), k = d < 4 ? 4 : 5, N = d < 4 ? pick([20, 24, 28, 32, 40]) : pick([21, 25, 27, 30, 35]); return { C, vals: valeursTab(C, k), effs: effCloche(k, N) }; },
  build: p => {
    const { C, vals, effs } = p, N = sum(effs), cu = cumul(effs), L = expand(vals, effs), s = asc(L);
    const r1 = rangQ(N, 1), r3 = rangQ(N, 3), a = s[r1 - 1], b = s[r3 - 1], me = med(s);
    const lig = (r) => { const i = cu.findIndex(c => c >= r); return `${nth(r)} valeur : ${M(vals[i])}`; };
    const rmed = N % 2 ? `${nth((N + 1) / 2)} valeur : ${M(me)}` : `moyenne de la ${nth(N / 2)} et de la ${nth(N / 2 + 1)} valeur : ${M(me)}`;
    if (new Set([a, me, b]).size < 2) return null;
    return { ...rNums([a, me, b], { tpl: `${sub(1)} : {0}${C.u} Médiane : {1}${C.u} ${sub(3)} : {2}${C.u}`, value: b, verify: E => E[0] === quantCount(L, 25) && E[1] === medCount(L) && E[2] === quantCount(L, 75), near: [[], [], []] }),
      html: `${ouvre(C)}${tabEff(C, vals, effs)}Donne ${sub(1)}, la médiane et ${sub(3)} de cette série.`,
      hint: `L’effectif total est ${M(N)}. Cumule les effectifs (${effs[0]}, puis ${effs[0]} + ${effs[1]}…) pour savoir à quelle valeur correspond chaque rang : ${M(r1)} pour ${sub(1)}, ${M(r3)} pour ${sub(3)}.`,
      solution: `Effectifs cumulés : ${cu.map(M).join(' ; ')} (total ${M(N)}).<br>${sub(1)} : ${M(N)} ÷ 4 = ${M(N / 4)}, rang ${r1}, ${lig(r1)}.<br>Médiane : ${N % 2 ? `rang ${(N + 1) / 2}` : ''} ${rmed}.<br>${sub(3)} : 3 × ${M(N)} ÷ 4 = ${M(3 * N / 4)}, rang ${r3}, ${lig(r3)}.<br>Réponse : ${sub(1)} = <b>${M(a)}</b>, médiane = <b>${M(me)}</b>, ${sub(3)} = <b>${M(b)}</b>.` };
  },
  ex: { C: CTX[0], vals: [8, 9, 10, 11], effs: [3, 8, 6, 3] },
};

const eiqEff = {
  id: 'eiq-eff', dmin: 3, titre: 'écart interquartile avec des effectifs',
  draw: d => { const C = pick(CTX), k = 5, N = pick([24, 25, 28, 30, 32, 36, 40]); return { C, vals: valeursTab(C, k), effs: effCloche(k, N) }; },
  build: p => {
    const { C, vals, effs } = p, N = sum(effs), cu = cumul(effs), L = expand(vals, effs), s = asc(L);
    const r1 = rangQ(N, 1), r3 = rangQ(N, 3), a = s[r1 - 1], b = s[r3 - 1], e = b - a;
    if (e === 0) return null;
    return { ...rNums([e], { tpl: tplU('Écart interquartile', C), value: e, near: [[[vals[vals.length - 1] - vals[0], 'Tu as calculé l’étendue (plus grande valeur − plus petite) : l’écart interquartile est Q₃ − Q₁.']]] }),
      html: `${ouvre(C)}${tabEff(C, vals, effs)}Quel est l’écart interquartile de cette série ?`,
      hint: `L’effectif total est ${M(N)} : ${sub(1)} a pour rang ${M(N)} ÷ 4 et ${sub(3)} pour rang 3 × ${M(N)} ÷ 4 (arrondis au rang entier supérieur). Cumule les effectifs pour trouver les valeurs.`,
      solution: `Effectifs cumulés : ${cu.map(M).join(' ; ')} (total ${M(N)}).<br>${sub(1)} : ${M(N)} ÷ 4 = ${M(N / 4)}, rang ${r1} : ${M(a)}. ${sub(3)} : 3 × ${M(N)} ÷ 4 = ${M(3 * N / 4)}, rang ${r3} : ${M(b)}.<br>Écart interquartile : ${M(b)} − ${M(a)} = <b>${M(e)}</b>${C.u}.` };
  },
  ex: { C: CTX[0], vals: [7, 8, 9, 10, 11], effs: [2, 5, 9, 7, 3] },
};

const MOINS = {
  notes: x => `ont une note inférieure ou égale à ${M(x)}`,
  trajet: x => `ont un trajet de ${M(x)} min ou moins`,
  taille: x => `mesurent ${M(x)} cm ou moins`,
};
const interpQ = {
  id: 'interp-q', dmin: 2, titre: 'sens d’un quartile',
  draw: d => ({ C: pick(CTX.filter(c => MOINS[c.id])), N: pick([20, 24, 28, 32, 36, 40]), q: pick([1, 3]) }),
  build: p => {
    const { C, N, q } = p, mid = Math.round((C.lo + C.hi) / 2 / C.pas) * C.pas, x = q === 1 ? mid - 2 * C.pas : mid + 2 * C.pas;
    const quart = N / 4, trois = 3 * N / 4, moins = MOINS[C.id](x);
    const au = k => `Au moins ${M(k)} ${C.ent} ${moins}.`, ex_ = k => `Exactement ${M(k)} ${C.ent} ${moins}.`;
    const nom = q === 1 ? sub(1) : sub(3), bonK = q === 1 ? quart : trois, autreK = q === 1 ? trois : quart;
    const items = [
      { l: au(bonK), ok: true },
      { l: ex_(bonK), why: 'Un quartile est une valeur de la série : plusieurs données peuvent être égales, on dit donc « au moins », pas « exactement ».' },
      { l: au(autreK), why: `${M(autreK)} correspond ${q === 1 ? 'aux trois quarts' : 'au quart'} de ${M(N)} : ce serait le ${q === 1 ? 'troisième' : 'premier'} quartile.` },
      { l: au(N / 2), why: `La moitié des ${C.ent}, c’est la médiane, pas le ${q === 1 ? 'premier' : 'troisième'} quartile.` },
    ];
    return { ...rChoice(items, { indep: au(bonK) }),
      html: `On a relevé les ${C.noms} de ${M(N)} ${C.ent}. Le ${q === 1 ? 'premier' : 'troisième'} quartile ${nom} de cette série vaut ${fv(x, C.u)}. Quelle phrase est exacte ?`,
      hint: `${nom} correspond à ${q === 1 ? '25 %' : '75 %'} des ${M(N)} ${C.ent}, c’est-à-dire ${M(bonK)} ${C.ent} : regarde la valeur ${fv(x, C.u)} et la différence entre « au moins » et « exactement ».`,
      solution: `Par définition, ${nom} est la plus petite valeur telle qu’au moins ${q === 1 ? '25 %' : '75 %'} des valeurs lui soient inférieures ou égales.<br>${q === 1 ? '25 %' : '75 %'} de ${M(N)} : ${M(N)} × ${q === 1 ? '0,25' : '0,75'} = ${M(bonK)}.<br>Donc : ${au(bonK)}` };
  },
  ex: { C: CTX[0], N: 28, q: 1 },
  ex2: [{ C: CTX[0], N: 28, q: 3 }],
};

export const LV3 = niveau('Médiane, quartiles, écart interquartile', [medListe, quartListe, eiqListe, quartEff, interpQ, eiqEff], {
  n: 3,
  intro: 'Au collège, tu as déjà vu la médiane et les quartiles. On les retrouve ici, puis on les calcule aussi à partir d’un tableau d’effectifs.',
  def: `Dans une série de N valeurs rangées dans l’ordre croissant : la <b>médiane</b> partage la série en deux groupes de même effectif ; le <b>premier quartile</b> ${sub(1)} est la plus petite valeur telle qu’au moins 25 % des valeurs lui soient inférieures ou égales (rang <span class="nw">N ÷ 4</span>, arrondi au rang entier supérieur) ; le <b>troisième quartile</b> ${sub(3)} est défini de même avec 75 % (rang <span class="nw">3 × N ÷ 4</span>). L’<b>écart interquartile</b> est ${sub(3)} − ${sub(1)}.`,
  visuel: boxPlot([{ min: 6, q1: 9, med: 12, q3: 14, max: 18 }], { lo: 4, hi: 20, g: 1, lab: 2, show: true, axe: 'note (sur 20)' }),
  methode: ['Range les valeurs dans l’ordre croissant (avec un tableau d’effectifs, cumule les effectifs).', 'Calcule le rang : N ÷ 4 pour ' + sub(1) + ', 3 × N ÷ 4 pour ' + sub(3) + ', arrondi au rang entier supérieur.', 'Lis la valeur de ce rang. L’écart interquartile est la différence ' + sub(3) + ' − ' + sub(1) + '.'],
  warn: ['Il faut ranger les valeurs avant de repérer le rang.', 'Un quartile est une valeur de la série, jamais un rang : le rang sert à la trouver.', 'La médiane n’est pas la moyenne ; l’écart interquartile n’est pas l’étendue (max − min).'],
  retenir: 'médiane : milieu de la série rangée ; ' + sub(1) + ' et ' + sub(3) + ' : rangs N ÷ 4 et 3 × N ÷ 4 arrondis au rang entier supérieur ; écart interquartile = ' + sub(3) + ' − ' + sub(1) + '.',
});

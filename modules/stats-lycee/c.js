// Niveaux 7 à 9 : histogramme ; fréquences cumulées et polygone ; comparer deux séries.
import { ri, pick, shuffle, chance, M, big, lst, pc, fv, plus, somme, rNums, rChoice, niveau, tabEff } from './outils.js';
import { CTX, sum, range, moy, rnd, entier, dec, cherche, effCloche, partition, cumul, mean, med, asc } from './stat.js';
import { tab, histogramme, readHisto, polygone, readPoly, pointsSurDroite } from './draw.js';
import { boxPlot } from '../stats3e/draw.js';
import { CTXC, classesDe, cl } from './b.js';

const tplU = (lab, C, i = 0) => `${lab} : {${i}}${C.u}`;

/* ===================================================================== 7. histogramme */
/** histogramme d'effectifs d'un contexte de classes : bornes, hauteurs (effectifs entiers, effectif total N) */
function tirageHisto(d, { kmin = 4, kmax = 6, Ns = [20, 25, 30, 40, 50], unique = false } = {}) {
  return cherche(() => {
    const C = pick(CTXC), w = pick(C.ws), k = ri(kmin, kmax), a0 = C.a0() + (C.id === 'trajet' ? 0 : w * ri(0, 1)), N = pick(Ns);
    return { C, bornes: classesDe(C, k, w, a0), h: effCloche(k, N) };
  }, t => !unique || t.h.filter(x => x === Math.max(...t.h)).length === 1);
}
const svgHisto = (C, bornes, h, o = {}) => histogramme(bornes, h, { gy: 1, ly: Math.max(...h) > 12 ? 2 : 1, ytitle: 'effectif', xtitle: C.h, ...o });

const lireEff = {
  id: 'lire-eff', dmin: 0, titre: 'lire l’effectif d’une classe',
  draw: d => { const t = tirageHisto(d, { kmax: d < 3 ? 5 : 6 }); return t && { ...t, j: ri(0, t.h.length - 1) }; },
  build: p => {
    const { C, bornes, h, j } = p, vis = svgHisto(C, bornes, h);
    return { ...rNums([h[j]], { tpl: 'Effectif : {0}', verify: E => Math.abs(readHisto(vis)[j].h - E[0]) < 0.02, value: h[j] }), visual: vis,
      html: `${C.hist()} Quel est l’effectif de la classe ${cl(bornes[j], bornes[j + 1])} ?`,
      hint: `Repère le rectangle situé au-dessus de la classe ${cl(bornes[j], bornes[j + 1])} (entre ${M(bornes[j])} et ${M(bornes[j + 1])} sur l’axe horizontal), puis lis sa hauteur sur l’axe vertical des effectifs.`,
      solution: `Le rectangle de la classe ${cl(bornes[j], bornes[j + 1])} monte jusqu’à la graduation <b>${M(h[j])}</b> : cette classe contient ${M(h[j])} ${C.ent}.` };
  },
  ex: { C: CTXC[0], bornes: [0, 10, 20, 30, 40], h: [3, 8, 6, 3], j: 1 },
};

const lireTotal = {
  id: 'lire-total', dmin: 0, titre: 'effectif total',
  draw: d => tirageHisto(d, { kmax: d < 3 ? 5 : 6 }),
  build: p => {
    const { C, bornes, h } = p, vis = svgHisto(C, bornes, h), N = sum(h);
    return { ...rNums([N], { tpl: 'Effectif total : {0}', verify: E => Math.abs(sum(readHisto(vis).map(x => x.h)) - E[0]) < 0.02, value: N }), visual: vis,
      html: `${C.hist()} Quel est l’effectif total de cette série ?`,
      hint: `Lis la hauteur de chaque rectangle (il y en a ${h.length}) sur l’axe des effectifs, puis additionne-les : l’effectif total est la somme des effectifs de toutes les classes.`,
      solution: `Effectifs des classes : ${lst(h)}.<br>Effectif total : ${plus(h)} = <b>${M(N)}</b>.` };
  },
  ex: { C: CTXC[0], bornes: [0, 10, 20, 30, 40], h: [3, 8, 6, 3] },
};

const modale = {
  id: 'modale', dmin: 0, titre: 'classe modale',
  draw: d => tirageHisto(d, { kmin: 5, kmax: 6, unique: true }),
  build: p => {
    const { C, bornes, h } = p, vis = svgHisto(C, bornes, h), im = h.indexOf(Math.max(...h)), k = h.length;
    const autres = range(0, k - 1).filter(i => i !== im), idx = [im, ...autres.slice(0, 3)].sort((a, b) => a - b);
    const items = idx.map(i => ({ l: cl(bornes[i], bornes[i + 1]), ok: i === im, why: `La classe ${cl(bornes[i], bornes[i + 1])} a un effectif de ${M(h[i])}, mais la classe modale est celle qui a le plus grand effectif, donc le rectangle le plus haut.` }));
    return { ...rChoice(items, { ordre: true, indep: cl(bornes[im], bornes[im + 1]) }), visual: vis,
      html: `${C.hist()} Quelle est la classe modale de cette série ?`,
      hint: `La classe modale est celle dont le rectangle est le plus haut : compare les hauteurs des rectangles des classes ${cl(bornes[idx[0]], bornes[idx[0] + 1])}, ${cl(bornes[idx[1]], bornes[idx[1] + 1])}…`,
      solution: `Les effectifs sont : ${lst(h)}. Le plus grand, ${M(h[im])}, est celui de la classe <b>${cl(bornes[im], bornes[im + 1])}</b> : c’est la classe modale.` };
  },
  ex: { C: CTXC[0], bornes: [0, 10, 20, 30, 40, 50], h: [2, 6, 9, 5, 3] },
};

const lireFreq = {
  id: 'lire-freq', dmin: 1, titre: 'fréquence d’une classe en %',
  draw: d => { const t = tirageHisto(d, { Ns: [20, 25, 40, 50], kmax: 5 }); return t && { ...t, j: ri(0, t.h.length - 1) }; },
  build: p => {
    const { C, bornes, h, j } = p, vis = svgHisto(C, bornes, h), N = sum(h), f = h[j] / N * 100;
    if (dec(f) < 0 || dec(f) > 2) return null;
    return { ...rNums([f], { tpl: 'Fréquence : {0} %', verify: E => Math.abs(readHisto(vis)[j].h / sum(readHisto(vis).map(x => x.h)) * 100 - E[0]) < 0.02, value: f, near: [[[h[j], 'Tu as lu l’effectif : la fréquence est cet effectif divisé par l’effectif total, en pourcentage.']]] }), visual: vis,
      html: `${C.hist()} Quelle est la fréquence, en pourcentage, de la classe ${cl(bornes[j], bornes[j + 1])} ?`,
      hint: `Lis l’effectif de la classe ${cl(bornes[j], bornes[j + 1])}, puis additionne les hauteurs des ${h.length} rectangles pour avoir l’effectif total, et divise.`,
      solution: `Effectif de la classe ${cl(bornes[j], bornes[j + 1])} : ${M(h[j])}.<br>Effectif total : ${plus(h)} = ${M(N)}.<br>Fréquence : ${M(h[j])} ÷ ${M(N)} = ${M(f / 100)}, soit <b>${M(f)} %</b>.` };
  },
  ex: { C: CTXC[0], bornes: [0, 10, 20, 30, 40], h: [3, 8, 6, 3], j: 1 },
};

const effSup = {
  id: 'eff-sup', dmin: 1, titre: 'effectif de plusieurs classes',
  draw: d => { const t = tirageHisto(d, { kmax: 6 }); return t && { ...t, j: ri(1, t.h.length - 1), moins: chance(0.5) }; },
  build: p => {
    const { C, bornes, h, j, moins } = p, vis = svgHisto(C, bornes, h), lim = bornes[j], part = moins ? h.slice(0, j) : h.slice(j), r = sum(part);
    return { ...rNums([r], { tpl: 'Effectif : {0}', verify: E => { const L = readHisto(vis).map(x => x.h); return Math.abs(E[0] - sum(moins ? L.slice(0, j) : L.slice(j))) < 0.02; }, value: r, near: [[[sum(moins ? h.slice(j) : h.slice(0, j)), `Tu as additionné les classes situées de l’autre côté de ${M(lim)}.`]]] }), visual: vis,
      html: `${C.hist()} Combien de ${C.ent} ont une valeur ${moins ? 'strictement inférieure à' : 'supérieure ou égale à'} ${fv(lim, C.u)} ?`,
      hint: `${M(lim)} est une borne entre deux classes. Repère les classes ${moins ? 'situées à gauche' : 'situées à droite'} de ${M(lim)} et additionne les hauteurs de leurs rectangles.`,
      solution: `Classes ${moins ? 'avant' : 'à partir de'} ${M(lim)} : ${part.map((x, i) => cl(...(moins ? [bornes[i], bornes[i + 1]] : [bornes[j + i], bornes[j + i + 1]]))).join(' ; ')}.<br>Effectifs : ${lst(part)}, d’où ${plus(part)} = <b>${M(r)}</b>.` };
  },
  ex: { C: CTXC[0], bornes: [0, 10, 20, 30, 40], h: [3, 8, 6, 3], j: 2, moins: false },
};

const histoPct = {
  id: 'histo-pct', dmin: 2, titre: 'histogramme des fréquences : retrouver un effectif',
  draw: d => cherche(() => {
    const C = pick(CTXC), w = pick(C.ws), k = ri(4, 5), a0 = C.a0() + (C.id === 'trajet' ? 0 : w * ri(0, 1)), pct = partition(20, k, 1).map(x => x * 5), N = pick([200, 240, 250, 400, 500, 600, 800]);
    return { C, bornes: classesDe(C, k, w, a0), pct, N, j: ri(0, k - 1) };
  }, t => entier(t.N * t.pct[t.j] / 100)),
  build: p => {
    const { C, bornes, pct, N, j } = p, vis = histogramme(bornes, pct, { gy: 5, ly: 10, ytitle: 'fréquence (%)', xtitle: C.h }), r = N * pct[j] / 100;
    return { ...rNums([r], { tpl: 'Effectif : {0}', verify: E => Math.abs(readHisto(vis)[j].h * N / 100 - E[0]) < 0.02, value: r, near: [[[pct[j], `${M(pct[j])} est la fréquence en % : on demande un nombre de ${C.ent}.`]]] }), visual: vis,
      html: `On a interrogé ${M(N)} ${C.ent}. L’histogramme donne la fréquence (en %) de chaque classe de la variable « ${C.h.toLowerCase()} ». Combien de ${C.ent} sont dans la classe ${cl(bornes[j], bornes[j + 1])} ?`,
      hint: `Lis la fréquence en pourcentage du rectangle de la classe ${cl(bornes[j], bornes[j + 1])}, puis calcule ce pourcentage de ${M(N)} (multiplie par ${M(N)} et divise par 100).`,
      solution: `Le rectangle de la classe ${cl(bornes[j], bornes[j + 1])} monte jusqu’à ${M(pct[j])} %.<br>${M(pct[j])} % de ${M(N)} : ${M(N)} × ${M(pct[j])} ÷ 100 = <b>${M(r)}</b>.` };
  },
  ex: { C: CTXC[0], bornes: [0, 10, 20, 30, 40], pct: [15, 40, 30, 15], N: 200, j: 1 },
};

const moyHisto = {
  id: 'moy-histo', dmin: 3, titre: 'moyenne estimée à partir d’un histogramme',
  draw: d => cherche(() => tirageHisto(d, { kmin: 4, kmax: 5, Ns: [20, 25, 40, 50] }), t => { const c = t.bornes.slice(0, -1).map((b, i) => (b + t.bornes[i + 1]) / 2), m = moy(c, t.h); return dec(m) >= 0 && dec(m) <= 2; }),
  build: p => {
    const { C, bornes, h } = p, vis = svgHisto(C, bornes, h), N = sum(h), c = bornes.slice(0, -1).map((b, i) => (b + bornes[i + 1]) / 2), S = sum(c.map((x, i) => x * h[i])), m = S / N;
    return { ...rNums([m], { tpl: tplU('Moyenne estimée', C), verify: E => { const L = readHisto(vis); return Math.abs(moy(L.map(x => (x.a + x.b) / 2), L.map(x => x.h)) - E[0]) < 0.02; }, value: m, near: [[[mean(c), 'Tu as oublié les effectifs : chaque centre est à multiplier par la hauteur de son rectangle.'], [S, `${M(S)} est la somme des (effectif × centre) : divise par l’effectif total ${M(N)}.`]]] }), visual: vis,
      html: `${C.hist()} Estime la moyenne de cette série à l’aide des centres des classes.`,
      hint: `Lis les effectifs des ${h.length} classes sur les rectangles, calcule le centre de chaque classe (milieu de ses bornes), multiplie chaque centre par l’effectif lu, additionne, puis divise par l’effectif total.`,
      solution: `Effectifs lus : ${lst(h)}. Centres : ${lst(c)}.<br>Somme : ${somme(c, h)} = ${M(S)}.<br>Effectif total : ${plus(h)} = ${M(N)}.<br>Moyenne estimée : ${M(S)} ÷ ${M(N)} = <b>${M(m)}</b>${C.u}.` };
  },
  ex: { C: CTXC[0], bornes: [0, 10, 20, 30, 40], h: [2, 6, 8, 4] },
};

const pctMoins = {
  id: 'pct-moins', dmin: 4, titre: 'proportion de valeurs en dessous d’une borne',
  draw: d => { const t = tirageHisto(d, { Ns: [20, 25, 40, 50], kmax: 6 }); return t && { ...t, j: ri(1, t.h.length - 1) }; },
  build: p => {
    const { C, bornes, h, j } = p, vis = svgHisto(C, bornes, h), N = sum(h), s = sum(h.slice(0, j)), f = s / N * 100;
    if (dec(f) < 0 || dec(f) > 2) return null;
    return { ...rNums([f], { tpl: 'Proportion : {0} %', verify: E => { const L = readHisto(vis).map(x => x.h); return Math.abs(sum(L.slice(0, j)) / sum(L) * 100 - E[0]) < 0.02; }, value: f, near: [[[s, 'Tu as donné un effectif : la proportion est cet effectif divisé par l’effectif total, en %.'], [100 - f, 'Tu as calculé la proportion des valeurs situées de l’autre côté de la borne.']]] }), visual: vis,
      html: `${C.hist()} Quel pourcentage des ${C.ent} ont une valeur strictement inférieure à ${fv(bornes[j], C.u)} ?`,
      hint: `Additionne les hauteurs des rectangles situés à gauche de ${M(bornes[j])} (${h.slice(0, j).map(M).join(' + ')}), puis divise par l’effectif total, somme de tous les rectangles.`,
      solution: `Effectifs à gauche de ${M(bornes[j])} : ${plus(h.slice(0, j))} = ${M(s)}.<br>Effectif total : ${plus(h)} = ${M(N)}.<br>Proportion : ${M(s)} ÷ ${M(N)} = ${M(f / 100)}, soit <b>${M(f)} %</b>.` };
  },
  ex: { C: CTXC[0], bornes: [0, 10, 20, 30, 40], h: [3, 8, 6, 3], j: 2 },
};

export const LV7 = niveau('Histogramme', [lireEff, lireTotal, modale, lireFreq, effSup, histoPct, moyHisto, pctMoins], {
  n: 7,
  intro: 'Un histogramme représente une série regroupée en classes de même amplitude : chaque classe est un rectangle dont la hauteur donne l’effectif (ou la fréquence). Il se lit comme un tableau.',
  def: `Dans un <b>histogramme</b> de classes de même amplitude, l’aire et la hauteur d’un rectangle sont proportionnelles à l’effectif (ou à la fréquence) de sa classe. La <b>classe modale</b> est la classe de plus grand effectif : c’est le rectangle le plus haut.`,
  visuel: histogramme([0, 10, 20, 30, 40], [3, 8, 6, 3], { gy: 1, ly: 1, ytitle: 'effectif', xtitle: 'durée du trajet (min)', hl: [1] }),
  methode: ['Lis l’échelle de l’axe vertical : chaque graduation vaut combien ?', 'Effectif d’une classe : hauteur du rectangle. Effectif total : somme des hauteurs.', 'Fréquence d’une classe : effectif ÷ effectif total, en %. Moyenne estimée : centres des classes pondérés par les effectifs.'],
  warn: ['Une borne comme 20 appartient à la classe [20 ; 30[, pas à [10 ; 20[.', 'Lire la fréquence (ou l’effectif) sur la mauvaise graduation : regarde si le quadrillage est de 1 en 1 ou de 2 en 2.', 'Quand l’axe donne des fréquences en %, il faut connaître l’effectif total pour retrouver un nombre d’individus.'],
  retenir: 'hauteur du rectangle = effectif (ou fréquence) ; effectif total = somme des hauteurs ; classe modale = rectangle le plus haut.',
});

/* ===================================================================== 8. fréquences cumulées et polygone */
/** classes (k de même amplitude), effectifs de total N dont les fréquences cumulées en % sont entières, fréquences cumulées F (k + 1 valeurs) */
function tiragePoly(d, { kmin = 4, kmax = 5 } = {}) {
  return cherche(() => {
    const C = pick(CTXC), w = pick(C.ws), k = ri(kmin, kmax), a0 = C.a0() + (C.id === 'trajet' ? 0 : w * ri(0, 1)), N = pick([20, 25, 50]), effs = effCloche(k, N);
    const cu = cumul(effs), F = [0, ...cu.map(c => c / N * 100)];
    return { C, bornes: classesDe(C, k, w, a0), effs, N, F };
  }, t => t.F.every(x => entier(x)));
}
const svgPoly = (C, bornes, F, o = {}) => polygone(bornes, F, { xtitle: C.h, gx: bornes[1] - bornes[0], ...o });
const tableCumul = (C, bornes, effs) => tab([[C.h, ...effs.map((_, i) => cl(bornes[i], bornes[i + 1]))], ['Effectif', ...effs]]);

const cumulCalc = {
  id: 'cumul-calc', dmin: 0, titre: 'fréquence cumulée à partir d’un tableau',
  draw: d => { const t = tiragePoly(d); return t && { ...t, j: ri(1, t.effs.length - 1) }; },
  build: p => {
    const { C, bornes, effs, N, F, j } = p, f = F[j + 0], s = sum(effs.slice(0, j));
    return { ...rNums([f], { tpl: 'Fréquence cumulée : {0} %', value: f, near: [[[s, 'Tu as donné un effectif cumulé : la fréquence cumulée est cet effectif divisé par l’effectif total, en %.']]] }),
      html: `${C.intro}${tableCumul(C, bornes, effs)}Quelle est la fréquence cumulée croissante de ${fv(bornes[j], C.u)}, c’est-à-dire le pourcentage de valeurs strictement inférieures à ${fv(bornes[j], C.u)} ?`,
      hint: `Additionne les effectifs des classes situées avant ${M(bornes[j])} (${effs.slice(0, j).map(M).join(' + ')}), puis divise par l’effectif total, somme de toute la ligne des effectifs.`,
      solution: `Effectif des classes avant ${M(bornes[j])} : ${plus(effs.slice(0, j))} = ${M(s)}.<br>Effectif total : ${plus(effs)} = ${M(N)}.<br>Fréquence cumulée : ${M(s)} ÷ ${M(N)} = ${M(f / 100)}, soit <b>${M(f)} %</b>.` };
  },
  ex: { C: CTXC[0], bornes: [0, 10, 20, 30, 40], effs: [3, 5, 8, 4], N: 20, F: [0, 15, 40, 80, 100], j: 2 },
};

const lirePoly = {
  id: 'lire-poly', dmin: 0, titre: 'lire une fréquence cumulée sur le polygone',
  draw: d => { const t = tiragePoly(d); return t && { ...t, j: ri(1, t.effs.length - 1) }; },
  build: p => {
    const { C, bornes, F, j } = p, vis = svgPoly(C, bornes, F), f = F[j];
    return { ...rNums([f], { tpl: 'Pourcentage : {0} %', verify: E => Math.abs(readPoly(vis)[j].y - E[0]) < 0.02, value: f }), visual: vis,
      html: `Voici le polygone des fréquences cumulées croissantes d’une série : « ${C.h.toLowerCase()} ». Quel pourcentage des ${C.ent} ont une valeur inférieure à ${fv(bornes[j], C.u)} ?`,
      hint: `Repère ${M(bornes[j])} sur l’axe horizontal, monte jusqu’au point du polygone situé au-dessus, puis lis son ordonnée : c’est le pourcentage de valeurs inférieures à ${M(bornes[j])}.`,
      solution: `Le point du polygone d’abscisse ${M(bornes[j])} a pour ordonnée ${M(f)}.<br>Donc <b>${M(f)} %</b> des ${C.ent} ont une valeur inférieure à ${M(bornes[j])}.` };
  },
  ex: { C: CTXC[0], bornes: [0, 10, 20, 30, 40], F: [0, 15, 40, 80, 100], j: 2 },
};

const polyEntre = {
  id: 'poly-entre', dmin: 1, titre: 'pourcentage entre deux bornes',
  draw: d => { const t = tiragePoly(d, { kmin: 5, kmax: 5 }); return t && { ...t, j1: ri(1, 2), j2: ri(3, 4) }; },
  build: p => {
    const { C, bornes, F, j1, j2 } = p, vis = svgPoly(C, bornes, F), r = F[j2] - F[j1];
    return { ...rNums([r], { tpl: 'Pourcentage : {0} %', verify: E => { const L = readPoly(vis); return Math.abs(L[j2].y - L[j1].y - E[0]) < 0.02; }, value: r, near: [[[F[j2], `${M(F[j2])} % est le pourcentage de valeurs inférieures à ${M(bornes[j2])} : il faut en retirer celles qui sont inférieures à ${M(bornes[j1])}.`]]] }), visual: vis,
      html: `Voici le polygone des fréquences cumulées croissantes d’une série : « ${C.h.toLowerCase()} ». Quel pourcentage des ${C.ent} ont une valeur comprise entre ${fv(bornes[j1], C.u)} et ${fv(bornes[j2], C.u)} (au sens large) ?`,
      hint: `Lis le pourcentage de valeurs inférieures à ${M(bornes[j2])}, puis celui des valeurs inférieures à ${M(bornes[j1])} : la différence donne les valeurs situées entre les deux.`,
      solution: `Inférieures à ${M(bornes[j2])} : ${M(F[j2])} %. Inférieures à ${M(bornes[j1])} : ${M(F[j1])} %.<br>Entre les deux : ${M(F[j2])} − ${M(F[j1])} = <b>${M(r)} %</b>.` };
  },
  ex: { C: CTXC[0], bornes: [0, 10, 20, 30, 40, 50], F: [0, 10, 30, 60, 85, 100], j1: 1, j2: 3 },
};

const polyEff = {
  id: 'poly-eff', dmin: 2, titre: 'effectif entre deux bornes',
  draw: d => { const t = tiragePoly(d, { kmin: 5, kmax: 5 }); return t && { ...t, j1: ri(1, 2), j2: ri(3, 5) }; },
  build: p => {
    const { C, bornes, F, N, j1, j2 } = p, vis = svgPoly(C, bornes, F), pct = F[j2] - F[j1], r = N * pct / 100;
    if (!entier(r)) return null;
    return { ...rNums([r], { tpl: 'Effectif : {0}', verify: E => { const L = readPoly(vis); return Math.abs((L[j2].y - L[j1].y) * N / 100 - E[0]) < 0.02; }, value: r, near: [[[pct, `${M(pct)} est un pourcentage : on demande un nombre de ${C.ent}.`]]] }), visual: vis,
      html: `On a interrogé ${M(N)} ${C.ent}. Voici le polygone des fréquences cumulées croissantes de la variable « ${C.h.toLowerCase()} ». Combien de ${C.ent} ont une valeur comprise entre ${fv(bornes[j1], C.u)} et ${fv(bornes[j2], C.u)} ?`,
      hint: `Lis les ordonnées des points d’abscisses ${M(bornes[j1])} et ${M(bornes[j2])}, fais la différence pour avoir un pourcentage, puis calcule ce pourcentage de ${M(N)}.`,
      solution: `Ordonnées lues : ${M(F[j1])} % et ${M(F[j2])} %. Entre les deux : ${M(F[j2])} − ${M(F[j1])} = ${M(pct)} %.<br>${M(pct)} % de ${M(N)} : ${M(N)} × ${M(pct)} ÷ 100 = <b>${M(r)}</b>.` };
  },
  ex: { C: CTXC[0], bornes: [0, 10, 20, 30, 40, 50], F: [0, 10, 30, 60, 85, 100], N: 20, j1: 1, j2: 3 },
};

/** x tel que le polygone vaille t, par interpolation linéaire entre les deux points qui encadrent t */
function inverse(bornes, F, t) {
  for (let i = 0; i < F.length - 1; i++) if (F[i] < t && t <= F[i + 1]) return { i, x: bornes[i] + (bornes[i + 1] - bornes[i]) * (t - F[i]) / (F[i + 1] - F[i]) };
  return null;
}
function tirageInv(d, cibles) {
  return cherche(() => { const t = tiragePoly(d, { kmin: 4, kmax: 5 }); return t && { ...t, cible: pick(cibles) }; },
    t => { const r = inverse(t.bornes, t.F, t.cible); return r && dec(r.x) >= 0 && dec(r.x) <= 1 && !t.F.includes(t.cible); }, 8000);
}
const detailInv = (C, bornes, F, t) => {
  const { i, x } = inverse(bornes, F, t), a = bornes[i], b = bornes[i + 1], fa = F[i], fb = F[i + 1], w = b - a, q = (t - fa) / (fb - fa) * w;
  return { i, x, texte: `Le niveau ${M(t)} % est atteint entre les points (${M(a)} ; ${M(fa)}) et (${M(b)} ; ${M(fb)}), reliés par un segment.<br>On avance de ${M(t)} − ${M(fa)} = ${M(t - fa)} sur une hausse totale de ${M(fb)} − ${M(fa)} = ${M(fb - fa)} : le point se trouve à la fraction (${M(t)} − ${M(fa)}) ÷ (${M(fb)} − ${M(fa)}) de la largeur ${M(w)} de la classe.<br>Abscisse : ${M(a)} + (${M(t)} − ${M(fa)}) ÷ (${M(fb)} − ${M(fa)}) × ${M(w)} = ${M(a)} + ${M(q)} = <b>${M(x)}</b>${C.u}.` };
};
const medianePoly = {
  id: 'mediane-poly', dmin: 2, titre: 'médiane lue sur le polygone',
  draw: d => tirageInv(d, [50]),
  build: p => {
    const { C, bornes, F, cible } = p, vis = svgPoly(C, bornes, F, { h: [{ y: cible, l: `${cible} %` }] }), D = detailInv(C, bornes, F, cible);
    return { ...rNums([D.x], { tpl: `Médiane ≈ {0}${C.u}`, verify: E => { const L = readPoly(vis); return Math.abs(inverse(L.map(q => q.x), L.map(q => q.y), 50).x - E[0]) < 0.02; }, value: D.x, near: [[[bornes[D.i], 'C’est la borne de gauche de la classe : la médiane se situe à l’intérieur de la classe, entre ses deux bornes.'], [bornes[D.i + 1], 'C’est la borne de droite de la classe : la médiane est un peu avant.']]] }), visual: vis,
      html: `Voici le polygone des fréquences cumulées croissantes d’une série : « ${C.h.toLowerCase()} ». En reliant les points par des segments, donne une valeur approchée de la médiane : l’abscisse du point d’ordonnée 50 %.`,
      hint: `La médiane correspond à 50 % de fréquence cumulée : repère entre quels deux points du polygone la droite à 50 % passe, puis utilise la proportionnalité sur le segment qui les relie.`,
      solution: D.texte };
  },
  ex: { C: CTXC[0], bornes: [0, 10, 20, 30, 40], F: [0, 15, 40, 80, 100], cible: 50 },
};

const quartilePoly = {
  id: 'quartile-poly', dmin: 3, titre: 'quartile lu sur le polygone',
  draw: d => tirageInv(d, [25, 75]),
  build: p => {
    const { C, bornes, F, cible } = p, vis = svgPoly(C, bornes, F, { h: [{ y: cible, l: `${cible} %` }] }), D = detailInv(C, bornes, F, cible), nom = cible === 25 ? 'Q₁' : 'Q₃';
    return { ...rNums([D.x], { tpl: `${nom} ≈ {0}${C.u}`, verify: E => { const L = readPoly(vis); return Math.abs(inverse(L.map(q => q.x), L.map(q => q.y), cible).x - E[0]) < 0.02; }, value: D.x, near: [[[bornes[D.i], 'C’est la borne de gauche de la classe : le quartile se situe à l’intérieur de la classe.']]] }), visual: vis,
      html: `Voici le polygone des fréquences cumulées croissantes d’une série : « ${C.h.toLowerCase()} ». En reliant les points par des segments, donne une valeur approchée du ${cible === 25 ? 'premier' : 'troisième'} quartile ${nom} : l’abscisse du point d’ordonnée ${cible} %.`,
      hint: `${nom} correspond à ${cible} % de fréquence cumulée : repère entre quels points du polygone passe le niveau ${cible} %, puis utilise la proportionnalité sur le segment correspondant.`,
      solution: D.texte };
  },
  ex: { C: CTXC[0], bornes: [0, 10, 20, 30, 40], F: [0, 15, 40, 80, 100], cible: 25 },
};

const supPoly = {
  id: 'sup-poly', dmin: 3, titre: 'pourcentage de valeurs supérieures à une borne',
  draw: d => { const t = tiragePoly(d, { kmin: 4, kmax: 5 }); return t && { ...t, j: ri(1, t.effs.length - 1), strict: chance(0.5) }; },
  build: p => {
    const { C, bornes, F, j } = p, vis = svgPoly(C, bornes, F), f = F[j], r = 100 - f;
    return { ...rNums([r], { tpl: 'Pourcentage : {0} %', verify: E => Math.abs(100 - readPoly(vis)[j].y - E[0]) < 0.02, value: r, near: [[[f, `${M(f)} % est le pourcentage de valeurs inférieures à ${M(bornes[j])} : on demande celles qui sont supérieures.`]]] }), visual: vis,
      html: `Voici le polygone des fréquences cumulées croissantes d’une série : « ${C.h.toLowerCase()} ». Quel pourcentage des ${C.ent} ont une valeur supérieure ou égale à ${fv(bornes[j], C.u)} ?`,
      hint: `Le polygone donne le pourcentage de valeurs inférieures à ${M(bornes[j])} : lis son ordonnée en ${M(bornes[j])}. Les autres valeurs (100 % au total) sont celles qui sont supérieures ou égales à ${M(bornes[j])}.`,
      solution: `Le point d’abscisse ${M(bornes[j])} a pour ordonnée ${M(f)} : ${M(f)} % des valeurs sont inférieures à ${M(bornes[j])}.<br>Les autres sont supérieures ou égales : 100 − ${M(f)} = <b>${M(r)} %</b>.` };
  },
  ex: { C: CTXC[0], bornes: [0, 10, 20, 30, 40], F: [0, 15, 40, 80, 100], j: 2, strict: false },
};

export const LV8 = niveau('Fréquences cumulées et polygone', [cumulCalc, lirePoly, polyEntre, polyEff, medianePoly, quartilePoly, supPoly], {
  n: 8,
  intro: 'La fréquence cumulée croissante d’une borne dit quelle part des données lui est inférieure. En traçant ces fréquences, on obtient un polygone qui permet de lire des pourcentages, la médiane et les quartiles.',
  def: `La <b>fréquence cumulée croissante</b> d’une borne b est la proportion des valeurs inférieures à b. Le <b>polygone des fréquences cumulées croissantes</b> joint par des segments les points (borne ; fréquence cumulée en %). La <b>médiane</b> (50 %) et les <b>quartiles</b> (25 % et 75 %) se lisent en cherchant l’abscisse d’une ordonnée donnée.`,
  visuel: polygone([0, 10, 20, 30, 40], [0, 15, 40, 80, 100], { xtitle: 'durée du trajet (min)', gx: 10, h: [{ y: 50, l: '50 %' }] }),
  methode: ['Fréquence cumulée d’une borne : additionne les effectifs des classes qui la précèdent, divise par l’effectif total, écris en %.', 'Lire un pourcentage : monte de la borne jusqu’au polygone, puis lis l’ordonnée. Entre deux bornes : fais la différence des ordonnées.', 'Lire la médiane ou un quartile : repère le segment du polygone qui atteint 50 % (ou 25 %, 75 %) et utilise la proportionnalité sur ce segment.'],
  warn: ['Le polygone est croissant et va de 0 % à 100 % : une valeur supérieure à 100 % est impossible.', 'Le polygone donne les valeurs inférieures à une borne : pour « supérieures », il faut retrancher à 100 %.', 'La médiane lue sur le polygone est une valeur approchée, qui suppose les valeurs réparties régulièrement dans chaque classe.'],
  retenir: 'fréquence cumulée = part des valeurs inférieures à la borne ; médiane et quartiles : abscisses des points d’ordonnée 50 %, 25 % et 75 %.',
});

/* ===================================================================== 9. comparer deux séries */
const CINQ = [
  { id: 'notes', t: 'Voici les notes (sur 20) de deux classes, A et B, à un même devoir.', lo: 3, hi: 19, u: '', axe: 'note (sur 20)' },
  { id: 'trajet', t: 'Voici les durées (en minutes) des trajets de deux lignes de bus, A et B.', lo: 10, hi: 58, u: ' min', axe: 'durée (min)' },
  { id: 'temp', t: 'Voici les températures maximales (en °C) relevées dans deux villes, A et B, pendant un mois.', lo: 12, hi: 36, u: ' °C', axe: 'température (°C)' },
];
const cinq = (S, ecart) => {
  const pos = new Set(); const n = S.hi - S.lo;
  while (pos.size < 5) pos.add(S.lo + ri(0, n));
  const p = [...pos].sort((a, b) => a - b);
  return { min: p[0], q1: p[1], med: p[2], q3: p[3], max: p[4] };
};
const tabCinq = (A, B) => tab([['', 'minimum', 'Q₁', 'médiane', 'Q₃', 'maximum'], ['Série A', A.min, A.q1, A.med, A.q3, A.max], ['Série B', B.min, B.q1, B.med, B.q3, B.max]]);
const compMedEiq = {
  id: 'comp-med-eiq', dmin: 0, titre: 'comparer médianes et écarts interquartiles',
  draw: d => cherche(() => { const i = ri(0, CINQ.length - 1), A = cinq(CINQ[i]), B = cinq(CINQ[i]); return { i, A, B }; }, t => t.A.q3 - t.A.q1 !== t.B.q3 - t.B.q1 && t.A.med !== t.B.med),
  build: p => {
    const S = CINQ[p.i], { A, B } = p, ea = A.q3 - A.q1, eb = B.q3 - B.q1;
    const plusReg = ea < eb ? 'A' : 'B', plusHaute = A.med > B.med ? 'A' : 'B';
    return { ...rNums([ea, eb], { tpl: `Écart interquartile de A : {0}${S.u} de B : {1}${S.u}`, value: eb, near: [[[A.q3 - A.min, 'Tu as calculé Q₃ − minimum : l’écart interquartile est Q₃ − Q₁.'], [A.max - A.min, 'C’est l’étendue : l’écart interquartile est Q₃ − Q₁.']], [[B.q3 - B.min, 'Tu as calculé Q₃ − minimum : l’écart interquartile est Q₃ − Q₁.'], [B.max - B.min, 'C’est l’étendue : l’écart interquartile est Q₃ − Q₁.']]] }),
      visual: boxPlot([{ name: 'A', ...A }, { name: 'B', ...B }], { lo: Math.floor((Math.min(A.min, B.min) - 2) / 2) * 2, hi: Math.ceil((Math.max(A.max, B.max) + 2) / 2) * 2, g: 1, lab: 2, axe: S.axe }),
      html: `${S.t}${tabCinq(A, B)}Calcule l’écart interquartile de chaque série.`,
      hint: `Pour chaque série, retire le premier quartile Q₁ au troisième quartile Q₃ : série A, ${M(A.q3)} − ${M(A.q1)} ; série B, ${M(B.q3)} − ${M(B.q1)}. Calcule ces deux différences.`,
      solution: `Série A : ${M(A.q3)} − ${M(A.q1)} = <b>${M(ea)}</b>${S.u}. Série B : ${M(B.q3)} − ${M(B.q1)} = <b>${M(eb)}</b>${S.u}.<br>Interprétation : la médiane de ${plusHaute} est la plus haute (${M(Math.max(A.med, B.med))} contre ${M(Math.min(A.med, B.med))}) ; la série ${plusReg} est la plus regroupée autour de sa médiane (écart interquartile plus petit).` };
  },
  ex: { i: 0, A: { min: 4, q1: 8, med: 11, q3: 14, max: 18 }, B: { min: 6, q1: 10, med: 12, q3: 13, max: 16 } },
};

const SC_CONCL = [
  { t: (a, b) => `Deux classes de seconde, A et B, ont passé le même devoir (sur 20). Classe A : moyenne ${M(a.m)}, écart type ${M(a.s)}. Classe B : moyenne ${M(b.m)}, écart type ${M(b.s)}.`, X: 'classe', gm: 'la plus grande moyenne', gs: 'les notes les plus dispersées', lo: 9, hi: 14 },
  { t: (a, b) => `Deux villes, A et B, ont relevé leur température maximale quotidienne en juillet (en °C). Ville A : moyenne ${M(a.m)}, écart type ${M(a.s)}. Ville B : moyenne ${M(b.m)}, écart type ${M(b.s)}.`, X: 'ville', gm: 'la température moyenne la plus élevée', gs: 'les températures les plus variables', lo: 22, hi: 30 },
  { t: (a, b) => `Deux entreprises, A et B, comparent les salaires mensuels de leurs employés (en milliers d’euros). Entreprise A : moyenne ${M(a.m)}, écart type ${M(a.s)}. Entreprise B : moyenne ${M(b.m)}, écart type ${M(b.s)}.`, X: 'entreprise', gm: 'le salaire moyen le plus élevé', gs: 'les salaires les plus inégaux', lo: 1.8, hi: 3.2, dc: 1 },
];
const compConcl = {
  id: 'comp-concl', dmin: 1, titre: 'conclure à partir de moyennes et d’écarts types',
  draw: d => cherche(() => {
    const i = ri(0, SC_CONCL.length - 1), S = SC_CONCL[i], q = S.dc ? 10 : 1;
    const a = { m: ri(S.lo * q, S.hi * q) / q, s: ri(10, 55) / 10 * (S.dc ? 0.2 : 1) }, b = { m: ri(S.lo * q, S.hi * q) / q, s: ri(10, 55) / 10 * (S.dc ? 0.2 : 1) };
    return { i, a: { m: a.m, s: rnd(a.s, 2) }, b: { m: b.m, s: rnd(b.s, 2) } };
  }, t => Math.abs(t.a.m - t.b.m) >= (SC_CONCL[t.i].dc ? 0.3 : 1) && Math.abs(t.a.s - t.b.s) >= (SC_CONCL[t.i].dc ? 0.3 : 0.8)),
  build: p => {
    const S = SC_CONCL[p.i], { a, b } = p, M1 = a.m > b.m ? 'A' : 'B', S1 = a.s > b.s ? 'A' : 'B';
    const phrase = (x, y) => (x === y ? `La ${S.X} ${x} a ${S.gm} et ${S.gs}.` : `La ${S.X} ${x} a ${S.gm}, la ${S.X} ${y} a ${S.gs}.`).replace(/La entreprise/, 'L’entreprise');
    const fix = s => s.replace(/La entreprise/g, 'L’entreprise').replace(/la entreprise/g, 'l’entreprise');
    const bon = fix(phrase(M1, S1));
    const items = [['A', 'A'], ['A', 'B'], ['B', 'A'], ['B', 'B']].map(([x, y]) => ({ l: fix(phrase(x, y)), ok: x === M1 && y === S1, why: `Compare : les moyennes sont ${M(a.m)} (A) et ${M(b.m)} (B), les écarts types ${M(a.s)} (A) et ${M(b.s)} (B). La plus grande moyenne et le plus grand écart type ne sont pas forcément dans la même série.` }));
    return { ...rChoice(items, { ordre: true, indep: bon }),
      html: `${S.t(a, b)} Quelle conclusion est correcte ?`,
      hint: `Compare d’abord les moyennes ${M(a.m)} et ${M(b.m)} : la plus grande indique ${S.gm}. Puis compare les écarts types ${M(a.s)} et ${M(b.s)} : le plus grand indique ${S.gs}.`,
      solution: `Moyennes : ${M(a.m)} (A) et ${M(b.m)} (B) : ${S.gm} est pour ${M1}.<br>Écarts types : ${M(a.s)} (A) et ${M(b.s)} (B) : ${S.gs} sont pour ${S1}.<br>Conclusion : <b>${bon}</b>` };
  },
  ex: { i: 0, a: { m: 11.4, s: 3.9 }, b: { m: 12.8, s: 2.6 } },
};

const OUTILS = [
  { l: 'La moyenne et l’écart type.', k: 'ms' }, { l: 'La médiane et l’écart interquartile.', k: 'mq' },
  { l: 'La moyenne et l’écart interquartile.', k: 'mq2' }, { l: 'La médiane et l’écart type.', k: 'qs' },
];
const outilExtreme = {
  id: 'outil-extreme', dmin: 1, titre: 'valeur extrême : quels indicateurs choisir ?',
  draw: d => { const base = ri(18, 28), L = Array.from({ length: 6 }, () => base + ri(-4, 4)); return { L: shuffle([...L, base * ri(4, 6)]) }; },
  build: p => {
    const { L } = p, ext = Math.max(...L);
    const items = [{ l: OUTILS[1].l, ok: true }, { l: OUTILS[0].l, why: `La valeur ${M(ext)} tire la moyenne et l’écart type vers le haut : ils décrivent mal les autres valeurs.` }, { l: OUTILS[2].l, why: `La moyenne est très sensible à la valeur extrême ${M(ext)} : mieux vaut la médiane.` }, { l: OUTILS[3].l, why: `L’écart type est très sensible à la valeur extrême ${M(ext)} : mieux vaut l’écart interquartile.` }];
    return { ...rChoice(items, { indep: OUTILS[1].l }),
      html: `Voici les temps de livraison (en minutes) de 7 commandes : ${lst(L)}. Une commande a été très en retard (${M(ext)} minutes). Pour résumer cette série sans que cette valeur extrême n’influence trop le résultat, quels indicateurs choisir ?`,
      hint: `Une valeur extrême comme ${M(ext)} change beaucoup la moyenne et l’écart type, alors que la médiane et les quartiles dépendent surtout des valeurs du milieu. Compare ${M(ext)} aux autres valeurs de la liste.`,
      solution: `Les valeurs sont autour de ${M(asc(L)[3])} minutes, sauf ${M(ext)}. La moyenne et l’écart type utilisent toutes les valeurs : ils sont tirés par ${M(ext)}.<br>La médiane et l’écart interquartile résistent aux valeurs extrêmes : <b>${OUTILS[1].l.replace('.', '')}</b>.` };
  },
  ex: { L: [22, 25, 19, 24, 135, 21, 26] },
};
const outilToutes = {
  id: 'outil-toutes', dmin: 2, titre: 'toutes les valeurs comptent : quels indicateurs ?',
  draw: d => { const base = ri(10, 14), L = Array.from({ length: 8 }, () => base + ri(-4, 4)); return { L }; },
  build: p => {
    const { L } = p;
    const items = [{ l: OUTILS[0].l, ok: true }, { l: OUTILS[1].l, why: 'La médiane et l’écart interquartile ne tiennent compte que de quelques valeurs de la série rangée, pas de toutes.' }, { l: OUTILS[2].l, why: 'La moyenne tient compte de toutes les valeurs, mais l’écart interquartile non : on mélange deux familles d’indicateurs.' }, { l: OUTILS[3].l, why: 'L’écart type tient compte de toutes les valeurs, mais pas la médiane : on mélange deux familles d’indicateurs.' }];
    return { ...rChoice(items, { indep: OUTILS[0].l }),
      html: `Voici les notes (sur 20) de 8 élèves : ${lst(L)}. Aucune valeur n’est extrême et on veut un résumé qui utilise toutes les notes. Quels indicateurs choisir ?`,
      hint: `Les notes ${M(Math.min(...L))} à ${M(Math.max(...L))} sont proches les unes des autres : aucune valeur extrême. Quels indicateurs calculent avec toutes les valeurs de la série ?`,
      solution: `Il n’y a pas de valeur extrême (les notes vont de ${M(Math.min(...L))} à ${M(Math.max(...L))}) et on veut utiliser toutes les notes : <b>${OUTILS[0].l.replace('.', '')}</b> utilisent toutes les valeurs.` };
  },
  ex: { L: [11, 13, 9, 12, 14, 10, 12, 15] },
};

const moyReunie = {
  id: 'moy-reunie', dmin: 2, titre: 'moyenne de deux groupes réunis',
  draw: d => cherche(() => { const n1 = ri(8, 30), n2 = pick([20, 25, 40, 50]) - n1; return n2 >= 5 && n2 !== n1 ? { n1, n2, m1: ri(60, 150) / 10, m2: ri(60, 150) / 10, i: ri(0, 2) } : null; }, t => { const m = (t.n1 * t.m1 + t.n2 * t.m2) / (t.n1 + t.n2); return dec(m) >= 0 && dec(m) <= 2 && t.m1 !== t.m2; }),
  build: p => {
    const { n1, n2, m1, m2, i } = p, N = n1 + n2, s1 = rnd(n1 * m1, 4), s2 = rnd(n2 * m2, 4), m = (s1 + s2) / N;
    const [g1, g2, ent] = [['la classe A', 'la classe B', 'élèves'], ['le groupe A', 'le groupe B', 'élèves'], ['le lot A', 'le lot B', 'pièces']][i];
    return { ...rNums([m], { tpl: 'Moyenne : {0}', value: m, near: [[[(m1 + m2) / 2, `Les deux groupes n’ont pas le même effectif (${M(n1)} et ${M(n2)}) : on ne peut pas faire la moyenne des deux moyennes.`]]] }),
      html: `${g1[0].toUpperCase()}${g1.slice(1)} compte ${M(n1)} ${ent} et leur moyenne est ${M(m1)}. ${g2[0].toUpperCase()}${g2.slice(1)} compte ${M(n2)} ${ent} et leur moyenne est ${M(m2)}. Quelle est la moyenne des ${M(N)} ${ent} réunis ?`,
      hint: `Les deux groupes n’ont pas le même effectif (${M(n1)} et ${M(n2)}) : retrouve la somme des valeurs de chaque groupe (effectif × moyenne), additionne-les, puis divise par l’effectif total.`,
      solution: `Somme du premier groupe : ${M(n1)} × ${M(m1)} = ${M(s1)}. Somme du second : ${M(n2)} × ${M(m2)} = ${M(s2)}.<br>Effectif total : ${M(n1)} + ${M(n2)} = ${M(N)}.<br>Moyenne : (${M(s1)} + ${M(s2)}) ÷ ${M(N)} = ${M(s1 + s2)} ÷ ${M(N)} = <b>${M(m)}</b>.` };
  },
  ex: { n1: 24, n2: 16, m1: 10.5, m2: 12, i: 0 },
};

const intervalleSigma = {
  id: 'intervalle-sigma', dmin: 3, titre: 'intervalle [m − σ ; m + σ]',
  draw: d => { const i = ri(0, 2); return { i, m: [ri(100, 160) / 10, ri(60, 120) / 10, ri(240, 320) / 10][i], s: ri(15, 45) / 10 }; },
  build: p => {
    const { i, m, s } = p, a = rnd(m - s, 3), b = rnd(m + s, 3);
    const [t, u] = [['Les durées de trajet des élèves d’un lycée ont pour moyenne', ' min'], ['Les notes d’un devoir ont pour moyenne', ''], ['Les températures d’un mois d’été ont pour moyenne', ' °C']][i];
    return { ...rNums([a, b], { tpl: `Borne basse : {0}${u} Borne haute : {1}${u}`, value: b, near: [[[m, 'C’est la moyenne : la borne basse est m − σ, donc plus petite.']], [[m, 'C’est la moyenne : la borne haute est m + σ, donc plus grande.']]] }),
      html: `${t} ${fv(m, u)} et pour écart type ${fv(s, u)}. Donne les bornes de l’intervalle [m − σ ; m + σ], qui regroupe les valeurs « proches de la moyenne ».`,
      hint: `Retire l’écart type ${M(s)} à la moyenne ${M(m)} pour la borne basse, et ajoute-le pour la borne haute.`,
      solution: `Borne basse : ${M(m)} − ${M(s)} = <b>${M(a)}</b>${u}.<br>Borne haute : ${M(m)} + ${M(s)} = <b>${M(b)}</b>${u}.<br>L’intervalle est [${M(a)} ; ${M(b)}] : les valeurs qui s’en écartent peu sont proches de la moyenne.` };
  },
  ex: { i: 0, m: 12.5, s: 3 },
};

export const LV9 = niveau('Comparer deux séries', [compMedEiq, compConcl, outilExtreme, outilToutes, moyReunie, intervalleSigma], {
  n: 9,
  intro: 'Comparer deux séries, c’est comparer leur position (moyenne ou médiane) et leur dispersion (écart type ou écart interquartile), puis conclure avec des phrases claires dans le contexte.',
  def: `<b>Position</b> : moyenne ou médiane. <b>Dispersion</b> : écart type ou écart interquartile. On associe la <b>moyenne</b> à l’<b>écart type</b> (toutes les valeurs comptent) et la <b>médiane</b> à l’<b>écart interquartile</b> (résistants aux valeurs extrêmes).`,
  visuel: boxPlot([{ name: 'A', min: 4, q1: 8, med: 11, q3: 14, max: 18 }, { name: 'B', min: 6, q1: 10, med: 12, q3: 13, max: 16 }], { lo: 2, hi: 20, g: 1, lab: 2, axe: 'note (sur 20)' }),
  methode: ['Compare les indicateurs de position : quelle série a les valeurs les plus élevées ?', 'Compare les indicateurs de dispersion : quelle série est la plus régulière (écart type ou écart interquartile plus petit) ?', 'Rédige la conclusion dans le contexte (« la classe A a de meilleures notes, mais plus inégales »).'],
  warn: ['Une moyenne plus grande ne veut pas dire une série plus régulière : la régularité se lit sur l’écart type.', 'La moyenne de deux groupes réunis n’est la moyenne des deux moyennes que si les effectifs sont égaux.', 'Avec une valeur extrême, privilégie la médiane et l’écart interquartile.'],
  retenir: 'position : moyenne ou médiane ; dispersion : écart type ou écart interquartile ; on conclut dans le contexte en comparant les deux.',
});

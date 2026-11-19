// Niveaux 1 à 3 : tableaux d'effectifs, effectifs cumulés, fréquences cumulées.
import { ri, pick, chance } from '../../engine/util/rand.js';
import { approx } from '../../engine/util/arith.js';
import { M, F } from '../../engine/util/fmt.js';
import { barChart, parseBars, tiles, tableHtml } from './draw.js';
import { sum, range, cumul, expand, tableau, TABLES } from './stat.js';
import { numCheck, multiCheck, dont, fv, COMMA, NOCOMMA, ex, warn, retenir, methode, big } from './util.js';

/** diagramme en barres des effectifs d'un tableau (pas des graduations adapté) */
export function bars(T, vals, { hl = [], titre = 'effectif', width = 460 } = {}) {
  const mx = Math.max(...vals), gr = mx > 60 ? 10 : mx > 30 ? 5 : mx > 12 ? 2 : 1;
  return barChart({ cats: T.vals.map(String), vals, grid: gr, lab: gr === 1 ? 1 : 2 * gr, yTitle: titre, xTitle: T.C.h1, hl, width });
}
const pickCtx = () => pick(TABLES);
const pct = (e, N) => e * 100 / N;

/* ===================================================================== 1. effectifs et fréquences */
export function L1(d) {
  const form = d < 1 ? 'tot' : d < 2 ? pick(['tot', 'freq']) : d < 3 ? pick(['freq', 'atleast']) : pick(['freq', 'atleast', 'manque']);
  const C = pickCtx(), k = ri(4, d < 3 ? 5 : 6);
  const N = form === 'tot' ? ri(k + 6, d < 1 ? 24 : 40) : form === 'manque' ? ri(k + 12, 40) : pick(d < 3 ? [20, 25, 50] : [20, 25, 40, 50]);
  const T = tableau(C, k, N, form === 'tot' ? 1 : 2), { vals, effs } = T;
  const i = form === 'atleast' ? ri(1, k - 2) : ri(0, k - 1), v = vals[i];
  const head = [C.h1, vals], showTotal = form === 'freq' && d < 2 || form === 'manque';
  const tab = (cells, tot) => tableHtml(head, [{ h: 'Effectif', cells, total: tot }], { total: tot === undefined ? null : tot });
  const visual = bars(T, effs);
  const titre = `<b>${C.titre}</b>`;
    if (form === 'tot') {
    return { type: 'nums', tpl: 'Effectif total : {0}', check: numCheck(N, [[k, 'Tu as compté les colonnes : il faut <b>additionner les effectifs</b>.'], [Math.max(...effs), "C'est le plus grand effectif : il faut additionner <b>tous</b> les effectifs."]]),
      html: `${titre}${tab(effs)}Quel est l'<b>effectif total</b> de cette série&nbsp;?`, visual,
      verify: E => sum(parseBars(visual).map(Math.round)) === E[0],
      hint: `Additionne les ${k} effectifs de la ligne : ${effs.join(' + ')}.`,
      solution: `${effs.join(' + ')} = <b>${N}</b> ${C.ent}.` };
  }
  if (form === 'freq') {
    const P = pct(effs[i], N);
    return { type: 'nums', tpl: 'Fréquence : {0} %', keys: COMMA, check: numCheck(P, [[effs[i], `${effs[i]} est l'<b>effectif</b> : il faut le diviser par l'effectif total (${N}), puis écrire en pourcentage.`], [effs[i] / N, `${M(effs[i] / N)} est la fréquence en écriture décimale : multiplie par 100 pour l'avoir en %.`]]),
      html: `${titre}${tab(effs, showTotal ? N : undefined)}Quelle est la <b>fréquence</b>, en pourcentage, des ${dont(T, 'eq', v)}&nbsp;?`, visual,
      verify: E => { const b = parseBars(visual).map(Math.round); return approx(b[i] * 100 / sum(b), E[0]); },
      hint: `Fréquence = effectif de la valeur ÷ effectif total. ${showTotal ? `Ici : ${effs[i]} ÷ ${N}` : `L'effectif total est ${effs.join(' + ')}, et l'effectif de ${fv(v, C.u)} est ${effs[i]}`}, puis × 100 pour avoir des %.`,
      solution: `${showTotal ? '' : `Effectif total : ${effs.join(' + ')} = ${N}.<br>`}Fréquence : ${F(effs[i], N)} = ${M(effs[i] / N)} = <b>${M(P)} %</b>.` };
  }
  if (form === 'atleast') {
    const e = sum(effs.slice(i)), P = pct(e, N);
    return { type: 'nums', tpl: 'Pourcentage : {0} %', keys: COMMA, check: numCheck(P, [[e, `${e} est le nombre de ${C.ent} concernés : divise-le par l'effectif total (${N}), puis écris en %.`], [pct(effs[i], N), `Tu n'as pris que la colonne ${fv(v, C.u)} : « d'au moins » veut dire cette valeur <b>et</b> les plus grandes.`]]),
      html: `${titre}${tab(effs)}Quel <b>pourcentage</b> représentent les ${dont(T, 'min', v)}&nbsp;?`, visual: bars(T, effs, { hl: range(i, k - 1) }),
      verify: E => { const b = parseBars(visual).map(Math.round); return approx(b.slice(i).reduce((s, x) => s + x, 0) * 100 / sum(b), E[0]); },
      hint: `« D'au moins ${fv(v, C.u)} » : ${fv(v, C.u)} <b>ou plus</b>. Additionne les effectifs ${effs.slice(i).join(' + ')}, divise par l'effectif total (${effs.join(' + ')}), puis × 100.`,
      solution: `Effectif concerné : ${effs.slice(i).join(' + ')} = ${e}. Effectif total : ${effs.join(' + ')} = ${N}.<br>${F(e, N)} = ${M(e / N)} = <b>${M(P)} %</b>.` };
  }
  // manque : un effectif inconnu, l'effectif total est donné
  const cells = effs.map((e, j) => (j === i ? null : e)), others = sum(effs) - effs[i];
  return { type: 'nums', tpl: 'Effectif manquant : {0}', check: numCheck(effs[i], [[N, "C'est l'effectif <b>total</b> : l'effectif manquant est ce qui reste quand on enlève les autres."], [others, `${others} est la somme des effectifs connus : il faut la <b>soustraire</b> de l'effectif total.`]]),
    html: `${titre}${tab(cells, N)}L'effectif total est <b>${N}</b>. Quel est l'effectif manquant (case «&nbsp;?&nbsp;»)&nbsp;?`, visual: tiles(cells.map(x => (x === null ? '?' : String(x))), { hl: [i], label: 'effectifs (la case ? est à trouver)' }),
    value: N - others,
    hint: `Additionne les effectifs connus (${effs.filter((_, j) => j !== i).join(' + ')}), puis soustrais ce total partiel de ${N}.`,
    solution: `Effectifs connus : ${effs.filter((_, j) => j !== i).join(' + ')} = ${others}. Effectif manquant : ${N} − ${others} = <b>${effs[i]}</b>.` };
}
export function C1() {
  const T = { vals: [10, 12, 14, 16], C: { h1: 'Note (sur 20)' } }, e = [3, 7, 6, 4];
  return `<h2>1. Lire un tableau d'effectifs, fréquences</h2>
<p class="intro">En 3<sup>e</sup>, les séries sont souvent données par un tableau d'effectifs. On y lit l'effectif total et les fréquences.</p>
<div class="def">L'<b>effectif</b> d'une valeur est le nombre de fois où elle apparaît. L'<b>effectif total</b> est la somme de tous les effectifs.<br>La <b>fréquence</b> d'une valeur = ${F('effectif de la valeur', 'effectif total')} ; en pourcentage, on multiplie par 100.</div>
<div class="cols">${tableHtml(['Note (sur 20)', [10, 12, 14, 16]], [{ h: 'Effectif', cells: e }])}${bars(T, e, { width: 320 })}</div>
${methode('Effectif total : additionne <b>tous</b> les effectifs de la ligne.', 'Fréquence d\'une valeur : effectif de la valeur ÷ effectif total (puis × 100 pour les %).', '« D\'au moins v » : v <b>ou plus</b> (on additionne plusieurs effectifs) ; « d\'au plus v » : v ou moins.', 'Effectif manquant : effectif total − somme des effectifs connus.')}
${ex('Exemple 1 : quel est l\'effectif total ?', 'On additionne : 3 + 7 + 6 + 4 = <b>20</b> élèves.')}
${ex('Exemple 2 : quelle est la fréquence, en pourcentage, des élèves dont la note est de 12 ?', `Effectif de 12 : 7. Effectif total : 20. Fréquence : ${F(7, 20)} = 0,35 = <b>35 %</b>.`)}
${ex('Exemple 3 : quel pourcentage représentent les élèves dont la note est d\'au moins 14 ?', `« D'au moins 14 », c'est 14 ou 16 : 6 + 4 = 10 élèves. ${F(10, 20)} = 0,5 = <b>50 %</b>.`)}
${ex('Exemple 4 : l\'effectif total est 20 ; quel est l\'effectif manquant ?', `${tableHtml(['Note (sur 20)', [10, 12, 14, 16]], [{ h: 'Effectif', cells: [3, 7, null, 4] }], { total: 20 })}Effectifs connus : 3 + 7 + 4 = 14. Manquant : 20 − 14 = <b>6</b>.`)}
${warn('On divise par l\'effectif <b>total</b> (20), pas par le nombre de colonnes (4).', 'L\'effectif (7) n\'est pas la fréquence : il faut diviser, puis multiplier par 100 pour un pourcentage.', '« D\'au moins 14 » contient 14 : on prend la colonne 14 <b>et</b> les suivantes.')}
${retenir('fréquence = effectif ÷ effectif total (× 100 pour un pourcentage).')}`;
}

/* ===================================================================== 2. effectifs cumulés croissants */
export function L2(d) {
  const form = d < 1 ? 'cell' : d < 2 ? pick(['cell', 'deux']) : d < 3 ? pick(['deux', 'auplus']) : d < 4 ? pick(['auplus', 'diff']) : pick(['auplus', 'diff', 'plus']);
  const C = pickCtx(), k = ri(5, 6), N = ri(22, d < 3 ? 36 : 56), T = tableau(C, k, N), { vals, effs } = T, c = cumul(effs);
  const head = [C.h1, vals], titre = `<b>${C.titre}</b>`;
  const rows = (cc) => [{ h: 'Effectif', cells: effs }, { h: 'Effectif cumulé croissant', cells: cc }];
  const tbl = cc => tableHtml(head, cc ? rows(cc) : [{ h: 'Effectif', cells: effs }]);
  const cumBars = (hl = []) => bars(T, c, { hl, titre: 'effectif cumulé' });
  if (form === 'cell') {
    const j = ri(2, k - 2), cc = c.map((x, t) => (t === j ? null : t < j ? x : null)).map((x, t) => (t > j ? '…' : x));
    return { type: 'nums', tpl: 'Case ? : {0}', check: numCheck(c[j], [[effs[j], `${effs[j]} est l'effectif de ${fv(vals[j], C.u)} : il faut y <b>ajouter</b> l'effectif cumulé de la colonne d'avant (${c[j - 1]}).`], [c[j - 1], `${c[j - 1]} est le cumul de la colonne d'avant : ajoute l'effectif de ${fv(vals[j], C.u)}.`]]),
      html: `${titre}Complète la ligne des <b>effectifs cumulés croissants</b>.${tbl(cc)}Quelle valeur faut-il écrire dans la case «&nbsp;?&nbsp;» (colonne de la valeur ${fv(vals[j], C.u)})&nbsp;?`,
      visual: bars(T, effs, { hl: [j] }), afterVisual: cumBars(range(0, j)), value: c[j],
      hint: `Effectif cumulé de ${fv(vals[j], C.u)} = effectif cumulé de la colonne précédente (${c[j - 1]}) + effectif de ${fv(vals[j], C.u)} (${effs[j]}).`,
      solution: `${c[j - 1]} + ${effs[j]} = <b>${c[j]}</b> : il y a ${c[j]} ${dont(T, 'max', vals[j])}.` };
  }
  if (form === 'deux') {
    const j = ri(2, k - 3), cc = c.map((x, t) => (t === j || t === j + 1 ? null : t < j ? x : '…'));
    return { type: 'nums', tpl: 'Première case ? : {0} &nbsp; Deuxième case ? : {1}', labels: ['première case', 'deuxième case'], check: multiCheck([c[j], c[j + 1]], [[], [[c[j + 1] - c[j] + c[j - 1], 'Pars bien de la <b>première</b> case ? que tu viens de trouver : cumul = cumul d\'avant + effectif.']]]),
      html: `${titre}Complète la ligne des <b>effectifs cumulés croissants</b>.${tbl(cc)}Quelles valeurs faut-il écrire dans les deux cases «&nbsp;?&nbsp;» (de gauche à droite)&nbsp;?`,
      visual: bars(T, effs, { hl: [j, j + 1] }), afterVisual: cumBars(range(0, j + 1)),
      verify: E => E[0] === sum(effs.slice(0, j + 1)) && E[1] === sum(effs.slice(0, j + 2)),
      hint: `Première case : ${c[j - 1]} (cumul d'avant) + ${effs[j]} (effectif de ${fv(vals[j], C.u)}). Deuxième case : ajoute ensuite ${effs[j + 1]} (effectif de ${fv(vals[j + 1], C.u)}).`,
      solution: `${c[j - 1]} + ${effs[j]} = <b>${c[j]}</b> ; puis ${c[j]} + ${effs[j + 1]} = <b>${c[j + 1]}</b>.` };
  }
  if (form === 'auplus') {
    const j = ri(1, k - 2);
    return { type: 'nums', tpl: 'Réponse : {0} ' + C.ent, check: numCheck(c[j], [[effs[j], `${effs[j]} est l'effectif d'une seule colonne : « d'au plus » veut dire cette valeur <b>et</b> les plus petites.`]]),
      html: `${titre}${tbl()}Combien y a-t-il de ${dont(T, 'max', vals[j])}&nbsp;? (c'est l'effectif cumulé croissant de ${fv(vals[j], C.u)})`, visual: bars(T, effs, { hl: range(0, j) }), afterVisual: cumBars(range(0, j)),
      verify: E => { const b = parseBars(bars(T, effs)).map(Math.round); return b.slice(0, j + 1).reduce((s, x) => s + x, 0) === E[0]; },
      hint: `« D'au plus ${fv(vals[j], C.u)} » : ${fv(vals[j], C.u)} <b>ou moins</b>. Additionne les effectifs ${effs.slice(0, j + 1).join(' + ')}.`,
      solution: `${effs.slice(0, j + 1).join(' + ')} = <b>${c[j]}</b>.` };
  }
  if (form === 'diff') {
    const j = ri(1, k - 1);
    return { type: 'nums', tpl: 'Effectif : {0}', check: numCheck(effs[j], [[c[j], `${c[j]} est l'effectif cumulé : il comprend aussi les valeurs d'avant. Enlève l'effectif cumulé de la colonne précédente (${c[j - 1]}).`]]),
      html: `${titre}${tableHtml(head, [{ h: 'Effectif cumulé croissant', cells: c }])}Quel est l'<b>effectif</b> (non cumulé) de la valeur ${fv(vals[j], C.u)}&nbsp;?`,
      visual: cumBars([j]), value: c[j] - c[j - 1],
      hint: `L'effectif cumulé de ${fv(vals[j], C.u)} (${c[j]}) contient celui de la colonne d'avant (${c[j - 1]}) : soustrais-les.`,
      solution: `${c[j]} − ${c[j - 1]} = <b>${effs[j]}</b> ${C.ent}.` };
  }
  const j = ri(1, k - 2);
  return { type: 'nums', tpl: 'Réponse : {0} ' + C.ent, check: numCheck(N - c[j], [[c[j], `${c[j]} est le nombre de ${C.ent} avec « au plus » ${fv(vals[j], C.u)} : il faut ceux qui dépassent, donc les <b>autres</b>.`], [N - c[j - 1], `Une valeur trop tôt : « strictement supérieur à ${fv(vals[j], C.u)} » ne contient pas ${fv(vals[j], C.u)} lui-même.`]]),
    html: `${titre}${tableHtml(head, [{ h: 'Effectif cumulé croissant', cells: c }])}Combien y a-t-il de ${dont(T, 'gt', vals[j])}&nbsp;?`,
    visual: cumBars(range(0, j)), value: c[k - 1] - c[j],
    hint: `L'effectif total est la dernière case (${c[k - 1]}). Ceux qui ont au plus ${fv(vals[j], C.u)} sont ${c[j]} : soustrais.`,
    solution: `Total : ${c[k - 1]}. D'au plus ${fv(vals[j], C.u)} : ${c[j]}. Donc ${c[k - 1]} − ${c[j]} = <b>${N - c[j]}</b>.` };
}
export function C2() {
  const vals = [1, 2, 3, 4, 5], e = [4, 6, 3, 5, 2], c = cumul(e), T = { vals, C: { h1: 'Nombre de livres lus' } };
  const h = ['Livres lus', vals];
  return `<h2>2. Effectifs cumulés croissants</h2>
<p class="intro">Pour compter « au plus » ou « au moins » sans tout réadditionner, on cumule les effectifs de gauche à droite.</p>
<div class="def">L'<b>effectif cumulé croissant</b> d'une valeur est le nombre d'individus dont la valeur est <b>inférieure ou égale</b> à celle-ci. On l'obtient en ajoutant à chaque fois l'effectif de la colonne. La dernière case est l'effectif total.</div>
<div class="cols">${tableHtml(h, [{ h: 'Effectif', cells: e }, { h: 'Effectif cumulé croissant', cells: c }])}${bars(T, c, { titre: 'effectif cumulé', width: 320 })}</div>
${methode('Première case : on recopie l\'effectif.', 'Case suivante = case d\'avant + effectif de la colonne.', 'Vérifie : la dernière case est égale à l\'effectif total.', '« D\'au plus v » : on lit (ou on calcule) l\'effectif cumulé de v ; « strictement supérieur à v » : effectif total − effectif cumulé de v ; effectif d\'une valeur : cumulé − cumulé précédent.')}
${ex('Exemple 1 : complète la case ? (colonne 3) de la ligne des effectifs cumulés.', `${tableHtml(h, [{ h: 'Effectif', cells: e }, { h: 'Effectif cumulé croissant', cells: [4, 10, null, '…', '…'] }])}Cumul d'avant (10) + effectif de 3 (3) : <b>13</b>.`)}
${ex('Exemple 2 : complète les deux cases ? (colonnes 3 et 4).', `${tableHtml(h, [{ h: 'Effectif', cells: e }, { h: 'Effectif cumulé croissant', cells: [4, 10, null, null, '…'] }])}Première case : 10 + 3 = <b>13</b>. Deuxième case : 13 + 5 = <b>18</b>.`)}
${ex('Exemple 3 : combien y a-t-il d\'élèves dont le nombre de livres lus est d\'au plus 3 ?', 'On additionne les effectifs jusqu\'à 3 inclus : 4 + 6 + 3 = <b>13</b> élèves.')}
${ex('Exemple 4 : quel est l\'effectif de la valeur 4 d\'après les effectifs cumulés ?', `${tableHtml(h, [{ h: 'Effectif cumulé croissant', cells: c }])}Effectif cumulé de 4 (18) − effectif cumulé de 3 (13) = <b>5</b>.`)}
${ex('Exemple 5 : combien y a-t-il d\'élèves dont le nombre de livres lus est strictement supérieur à 3 ?', 'Total : 20 (dernière case). D\'au plus 3 : 13. Donc 20 − 13 = <b>7</b> élèves.')}
${warn('L\'effectif cumulé n\'est pas l\'effectif : il compte aussi toutes les valeurs d\'avant.', '« D\'au plus 3 » contient 3 ; « strictement supérieur à 3 » ne le contient pas.', 'La dernière case doit être égale à l\'effectif total.')}
${retenir('effectif cumulé croissant = nombre d\'individus dont la valeur est inférieure ou égale ; la dernière case est l\'effectif total.')}`;
}

/* ===================================================================== 3. fréquences cumulées en pourcentage */
export function L3(d) {
  const form = d < 1 ? 'A' : d < 2 ? pick(['A', 'B']) : d < 3 ? pick(['B', 'C']) : d < 4 ? pick(['C', 'D']) : pick(['C', 'D', 'E']);
  const C = pickCtx(), k = ri(4, 6), N = pick(d < 3 ? [20, 25, 50] : [20, 25, 40, 50]), T = tableau(C, k, N, 2), { vals, effs } = T, c = cumul(effs);
  const head = [C.h1, vals], titre = `<b>${C.titre}</b>`;
  const j = ri(1, k - 2), cumBars = (hl = []) => bars(T, c, { hl, titre: 'effectif cumulé' });
  if (form === 'A') {
    const P = pct(c[j], N);
    return { type: 'nums', tpl: 'Fréquence cumulée : {0} %', keys: COMMA, check: numCheck(P, [[c[j], `${c[j]} est l'effectif cumulé : divise-le par l'effectif total (${N}), puis écris en %.`], [pct(effs[j], N), `Tu as calculé la fréquence de la colonne ${fv(vals[j], C.u)} seule : une fréquence <b>cumulée</b> compte aussi les valeurs d'avant.`]]),
      html: `${titre}${tableHtml(head, [{ h: 'Effectif', cells: effs }], { total: N })}Quelle est la <b>fréquence cumulée croissante</b>, en pourcentage, de la valeur ${fv(vals[j], C.u)}&nbsp;? (part des ${dont(T, 'max', vals[j])})`,
      visual: bars(T, effs, { hl: range(0, j) }), afterVisual: cumBars(range(0, j)),
      verify: E => { const b = parseBars(bars(T, effs)).map(Math.round); return approx(b.slice(0, j + 1).reduce((s, x) => s + x, 0) * 100 / sum(b), E[0]); },
      hint: `Effectif cumulé de ${fv(vals[j], C.u)} : ${effs.slice(0, j + 1).join(' + ')}. Divise-le par l'effectif total (${N}) puis × 100.`,
      solution: `Effectif cumulé : ${effs.slice(0, j + 1).join(' + ')} = ${c[j]}. ${F(c[j], N)} = ${M(c[j] / N)} = <b>${M(P)} %</b>.` };
  }
  if (form === 'B') {
    const P = pct(c[j], N);
    return { type: 'nums', tpl: 'Pourcentage : {0} %', keys: COMMA, check: numCheck(P, [[c[j], `${c[j]} est l'effectif cumulé : divise-le par l'effectif total (${N}), puis écris en %.`], [pct(c[j] - c[j - 1], N), `Tu as pris l'effectif de la colonne seule : lis directement l'effectif cumulé (${c[j]}).`]]),
      html: `${titre}${tableHtml(head, [{ h: 'Effectif cumulé croissant', cells: c }])}Quel <b>pourcentage</b> représentent les ${dont(T, 'max', vals[j])}&nbsp;?`, visual: cumBars(range(0, j)),
      value: c[j] * 100 / c[k - 1],
      hint: `L'effectif cumulé de ${fv(vals[j], C.u)} se lit dans le tableau : ${c[j]}. L'effectif total est la dernière case (${c[k - 1]}). Divise, puis × 100.`,
      solution: `${F(c[j], N)} = ${M(c[j] / N)} = <b>${M(P)} %</b>.` };
  }
  if (form === 'C') {
    const P = pct(N - c[j], N);
    return { type: 'nums', tpl: 'Pourcentage : {0} %', keys: COMMA, check: numCheck(P, [[pct(c[j], N), `${M(pct(c[j], N))} % est la part de ceux qui ont <b>au plus</b> ${fv(vals[j], C.u)} : il faut les autres (le contraire).`], [N - c[j], `${N - c[j]} est un nombre de ${C.ent} : divise-le par ${N} et écris en %.`]]),
      html: `${titre}${tableHtml(head, [{ h: 'Effectif', cells: effs }], { total: N })}Quel <b>pourcentage</b> représentent les ${dont(T, 'gt', vals[j])}&nbsp;?`, visual: bars(T, effs, { hl: range(j + 1, k - 1) }),
      verify: E => { const b = parseBars(bars(T, effs)).map(Math.round); return approx(b.slice(j + 1).reduce((s, x) => s + x, 0) * 100 / sum(b), E[0]); },
      hint: `Les ${C.ent} qui ont au plus ${fv(vals[j], C.u)} sont ${c[j]} sur ${N}. Les autres : ${N} − ${c[j]}. Divise ensuite par ${N} et × 100 (ou retire le pourcentage des premiers à 100 %).`,
      solution: `Au plus ${fv(vals[j], C.u)} : ${effs.slice(0, j + 1).join(' + ')} = ${c[j]}. Les autres : ${N} − ${c[j]} = ${N - c[j]}. ${F(N - c[j], N)} = <b>${M(P)} %</b>.` };
  }
  if (form === 'D') {
    const fc = c.map(x => pct(x, N));
    return { type: 'nums', tpl: 'Réponse : {0} ' + C.ent, check: numCheck(c[j], [[fc[j], `${M(fc[j])} est déjà un pourcentage : calcule ${M(fc[j])} % de ${N}.`], [effs[j], `Tu as trouvé l'effectif de la colonne seule : la fréquence cumulée compte aussi les valeurs d'avant.`]]),
      html: `${titre}${tableHtml(head, [{ h: 'Fréquence cumulée croissante (%)', cells: fc }])}L'effectif total est <b>${N}</b>. Combien y a-t-il de ${dont(T, 'max', vals[j])}&nbsp;?`, visual: bars(T, fc, { titre: 'fréquence cumulée (%)', hl: range(0, j) }),
      value: fc[j] * N / 100,
      hint: `La fréquence cumulée de ${fv(vals[j], C.u)} est ${M(fc[j])} % : c'est ${M(fc[j])} % des ${N} ${C.ent}. Calcule ${M(fc[j])} ÷ 100 × ${N}.`,
      solution: `${M(fc[j])} % de ${N} = ${M(fc[j])} ÷ 100 × ${N} = <b>${c[j]}</b> ${C.ent}.` };
  }
  // E : pourcentage entre deux valeurs (incluses)
  const a = ri(1, k - 3), b = ri(a + 1, k - 2), e = c[b] - c[a - 1], P = pct(e, N);
  return { type: 'nums', tpl: 'Pourcentage : {0} %', keys: COMMA, check: numCheck(P, [[pct(c[b] - c[a], N), `Tu as oublié la colonne ${fv(vals[a], C.u)} : « compris entre ${M(vals[a])} et ${M(vals[b])} » contient les deux bornes.`], [pct(c[b], N), `Tu as compté aussi les valeurs plus petites que ${fv(vals[a], C.u)} : retire l'effectif cumulé de la colonne d'avant (${c[a - 1]}).`]]),
    html: `${titre}${tableHtml(head, [{ h: 'Effectif cumulé croissant', cells: c }])}Quel <b>pourcentage</b> représentent les ${dont(T, 'between', [vals[a], vals[b]])}&nbsp;?`,
    visual: cumBars([a, b]), value: (c[b] - c[a - 1]) * 100 / c[k - 1],
    hint: `Entre ${fv(vals[a], C.u)} et ${fv(vals[b], C.u)} inclus : effectif cumulé de ${fv(vals[b], C.u)} (${c[b]}) moins effectif cumulé de la colonne <b>avant</b> ${fv(vals[a], C.u)} (${c[a - 1]}). Divise par ${N}, puis × 100.`,
    solution: `${c[b]} − ${c[a - 1]} = ${e} ${C.ent}. ${F(e, N)} = ${M(e / N)} = <b>${M(P)} %</b>.` };
}
export function C3() {
  const vals = [10, 12, 14, 16], e = [3, 7, 6, 4], c = cumul(e), fc = c.map(x => x * 5), h = ['Note (sur 20)', vals], T = { vals, C: { h1: 'Note (sur 20)' } };
  return `<h2>3. Fréquences cumulées en pourcentage</h2>
<p class="intro">Les effectifs cumulés deviennent des pourcentages en les divisant par l'effectif total : on obtient par exemple « 65 % des élèves ont 12 ou moins ».</p>
<div class="def">La <b>fréquence cumulée croissante</b> d'une valeur est la fréquence des individus dont la valeur est inférieure ou égale : ${F('effectif cumulé', 'effectif total')} (× 100 pour un pourcentage). La dernière vaut 100 %.</div>
<div class="cols">${tableHtml(h, [{ h: 'Effectif', cells: e }, { h: 'Effectif cumulé', cells: c }, { h: 'Fréquence cumulée (%)', cells: fc }])}${bars(T, fc, { titre: 'fréq. cumulée (%)', width: 320 })}</div>
${methode('Calcule les effectifs cumulés (ou lis-les).', 'Divise par l\'effectif total, puis × 100.', '« Strictement plus de v » : 100 % − fréquence cumulée de v.', '« Compris entre a et b » (bornes incluses) : cumulé de b − cumulé de la colonne <b>avant</b> a.', 'Dans l\'autre sens : effectif = fréquence cumulée ÷ 100 × effectif total.')}
${ex('Exemple 1 : quelle est la fréquence cumulée croissante, en pourcentage, de la valeur 12 ? (effectifs 3 ; 7 ; 6 ; 4, total 20)', `Effectif cumulé de 12 : 3 + 7 = 10. ${F(10, 20)} = 0,5 = <b>50 %</b>.`)}
${ex('Exemple 2 : on lit l\'effectif cumulé de 12 (10) dans la ligne des effectifs cumulés ; quel pourcentage représentent les élèves dont la note est d\'au plus 12 ?', `${F(10, 20)} = <b>50 %</b>, avec 20 la dernière case (effectif total).`)}
${ex('Exemple 3 : quel pourcentage représentent les élèves dont la note est strictement supérieure à 12 ?', `Au plus 12 : 10 élèves sur 20. Les autres : 20 − 10 = 10, soit ${F(10, 20)} = <b>50 %</b> (ou 100 % − 50 %).`)}
${ex('Exemple 4 : la fréquence cumulée de 14 est 80 % et l\'effectif total est 20 ; combien d\'élèves ont une note d\'au plus 14 ?', '80 % de 20 = 80 ÷ 100 × 20 = <b>16</b> élèves.')}
${ex('Exemple 5 : quel pourcentage représentent les élèves dont la note est comprise entre 12 et 14 (bornes incluses) ?', `Cumulé de 14 : 16 ; cumulé de la colonne avant 12 (la colonne 10) : 3. Donc 16 − 3 = 13 élèves : ${F(13, 20)} = <b>65 %</b>.`)}
${warn('Une fréquence <b>cumulée</b> additionne aussi les colonnes d\'avant.', 'Dernière fréquence cumulée : toujours 100 %. Sinon, il y a une erreur.', 'Pour « entre a et b », ne retire pas le cumul de a : retire celui de la colonne <b>d\'avant</b>.')}
${retenir('fréquence cumulée = effectif cumulé ÷ effectif total (× 100 pour des %).')}`;
}

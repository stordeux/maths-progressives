// Niveaux 4 à 6 : médiane (liste, tableau d'effectifs) et quartiles d'une série en liste.
import { ri, pick, shuffle, prenom } from '../../engine/util/rand.js';
import { approx } from '../../engine/util/arith.js';
import { M, F } from '../../engine/util/fmt.js';
import { tiles, tableHtml, parseBars } from './draw.js';
import { bars } from './n1.js';
import { sum, range, asc, cumul, expand, tableau, TABLES, SERIES, serie, resume, valeurDeRang, medCount, quantCount, rangQ, mean } from './stat.js';
import { numCheck, multiCheck, big, list, COMMA, ex, warn, retenir, methode, fv } from './util.js';

const sub = (k, v) => `Q<sub>${k}</sub>`;
const nth = r => `${r}<sup>e</sup>`;

/* ===================================================================== 4. médiane d'une série en liste */
export function L4(d) {
  const form = d < 1 ? 'oddS' : d < 2 ? 'oddU' : d < 3 ? pick(['evenS', 'evenU']) : d < 4 ? pick(['oddU', 'evenU']) : pick(['oddU', 'evenU', 'evenU']);
  const odd = form.startsWith('odd'), sorted = form.endsWith('S');
  const n = odd ? (d < 1 ? pick([5, 7]) : d < 4 ? pick([7, 9]) : pick([9, 11])) : (d < 3 ? pick([6, 8]) : d < 4 ? pick([8, 10]) : pick([10, 12]));
  const C = pick(SERIES);
  let vals = serie(C, n), r = resume(vals);
  vals = sorted ? r.s : shuffle(vals);
  if (!sorted) { let t = 0; while (vals.every((x, i) => x === r.s[i]) && t++ < 20) vals = shuffle(vals); }
  const k = odd ? (n + 1) / 2 : n / 2, X = r.med, s = r.s;
  const near = [[mean(s), 'Ça, c\'est (à peu près) la moyenne : la médiane se trouve avec les <b>rangs</b>, après avoir rangé les valeurs.']];
  if (!sorted) near.push([vals[Math.floor((n - 1) / 2)], '⚠️ Tu as pris la valeur du milieu de la liste <b>sans la ranger</b> dans l\'ordre croissant.']);
  if (!odd) { near.push([s[k - 1], `Avec un nombre <b>pair</b> de valeurs, il y a deux valeurs au milieu (${M(s[k - 1])} et ${M(s[k])}) : la médiane est à mi-chemin.`]); near.push([s[k], `Avec un nombre <b>pair</b> de valeurs, il y a deux valeurs au milieu (${M(s[k - 1])} et ${M(s[k])}) : la médiane est à mi-chemin.`]); }
  return { type: 'nums', tpl: `Médiane : {0}${C.u}`, keys: COMMA, check: numCheck(X, near),
    html: `${C.intro(n, prenom())} ${sorted ? '(Les valeurs sont rangées dans l\'ordre croissant.)' : ''}${big(list(vals))}Quelle est la <b>médiane</b> de cette série&nbsp;?`,
    visual: tiles(vals, { label: C.axe }), afterVisual: tiles(s, { hl: odd ? [k - 1] : [k - 1, k], label: 'série rangée : le milieu' }),
    verify: E => approx(medCount(vals), E[0]),
    hint: `${sorted ? '' : 'Range d\'abord les valeurs dans l\'ordre croissant. '}Il y a ${n} valeurs : ${odd ? `nombre impair, la médiane est la valeur de rang ${k} (${k - 1} valeurs avant, ${k - 1} après)` : `nombre pair, la médiane est la moyenne des valeurs de rang ${k} et ${k + 1}`}.`,
    solution: `Rangée : ${list(s)}.<br>${odd ? `${n} valeurs : la médiane est la ${nth(k)} valeur, soit <b>${M(X)}</b>${C.u}.` : `${n} valeurs : la ${nth(k)} est ${M(s[k - 1])}, la ${nth(k + 1)} est ${M(s[k])}. Médiane : (${M(s[k - 1])} + ${M(s[k])}) ÷ 2 = <b>${M(X)}</b>${C.u}.`}` };
}
export function C4() {
  return `<h2>4. Médiane d'une série en liste</h2>
<p class="intro">La médiane coupe la série en deux groupes de même effectif : au moins la moitié des valeurs sont inférieures ou égales à elle, au moins la moitié sont supérieures ou égales.</p>
<div class="def">On range les valeurs dans l'ordre croissant. S'il y en a un nombre <b>impair</b> n, la <b>médiane</b> est la valeur du milieu, de rang ${F('n + 1', 2)}. S'il y en a un nombre <b>pair</b>, c'est la moyenne des deux valeurs du milieu, de rangs ${F('n', 2)} et ${F('n', 2)} + 1.</div>
${tiles([6, 9, 11, 14, 18, 21, 25], { hl: [3], label: '7 valeurs : 3 avant, 3 après' })}
${methode('Range les valeurs dans l\'ordre croissant (garde les valeurs répétées).', 'Compte le nombre n de valeurs : pair ou impair ?', 'Impair : prends la valeur de rang (n + 1) ÷ 2. Pair : fais la moyenne des valeurs de rang n ÷ 2 et n ÷ 2 + 1.')}
${ex('Exemple 1 : durées (en min), rangées dans l\'ordre : 6 ; 9 ; 11 ; 14 ; 18 ; 21 ; 25.', 'Il y a 7 valeurs (impair) : la médiane est la 4<sup>e</sup>, <b>14 min</b>.')}
${ex('Exemple 2 : notes dans le désordre : 13 ; 8 ; 17 ; 11 ; 9.', 'On range : 8 ; 9 ; <b>11</b> ; 13 ; 17. Il y a 5 valeurs : la médiane est la 3<sup>e</sup>, <b>11</b>.')}
${tiles([7, 9, 10, 12, 13, 15], { hl: [2, 3], label: '6 valeurs : les deux du milieu' })}
${ex('Exemple 3 : prix (en €), rangés dans l\'ordre : 7 ; 9 ; 10 ; 12 ; 13 ; 15.', 'Il y a 6 valeurs (pair) : la 3<sup>e</sup> est 10, la 4<sup>e</sup> est 12. Médiane : (10 + 12) ÷ 2 = <b>11 €</b>.')}
${ex('Exemple 4 : notes dans le désordre : 14 ; 8 ; 12 ; 17 ; 9 ; 11.', 'On range : 8 ; 9 ; 11 ; 12 ; 14 ; 17. Il y a 6 valeurs : la 3<sup>e</sup> est 11, la 4<sup>e</sup> est 12. Médiane : (11 + 12) ÷ 2 = <b>11,5</b> (elle n\'est pas dans la série).')}
${warn('Prendre la valeur du milieu <b>sans ranger</b> : dans 13 ; 8 ; 17 ; 11 ; 9, la valeur du milieu est 17, c\'est faux.', 'Avec un nombre pair de valeurs, ne garde pas une seule des deux valeurs du milieu.', 'La médiane n\'est pas la moyenne.')}
${retenir('on range d\'abord ; n impair → valeur de rang (n + 1) ÷ 2 ; n pair → moyenne des valeurs de rang n ÷ 2 et n ÷ 2 + 1.')}`;
}

/* ===================================================================== 5. médiane à partir d'un tableau d'effectifs */
/** tableau dont l'effectif total a la parité demandée */
function tableauParite(C, k, lo, hi, pair) {
  let N = ri(lo, hi); if ((N % 2 === 0) !== pair) N++;
  return tableau(C, k, N);
}
export function L5(d) {
  const form = d < 1 ? 'rang' : d < 2 ? 'valA' : d < 3 ? 'valB' : d < 4 ? 'pair' : pick(['valB', 'pair', 'pair']);
  const C = pick(TABLES), k = ri(4, d < 3 ? 5 : 6), pair = form === 'pair';
  const T = tableauParite(C, k, 15, d < 3 ? 31 : 45, pair), { vals, effs, N } = T, c = cumul(effs), head = [C.h1, vals], titre = `<b>${C.titre}</b>`;
  const visual = bars(T, effs);
  if (form === 'rang') {
    const r = (N + 1) / 2;
    return { type: 'nums', tpl: 'Rang de la médiane : {0}', check: numCheck(r, [[N, `${N} est l'effectif total : la médiane est au <b>milieu</b>, de rang (${N} + 1) ÷ 2.`]]),
      html: `${titre}${tableHtml(head, [{ h: 'Effectif', cells: effs }])}Quel est le <b>rang de la médiane</b> de cette série&nbsp;?`, visual,
      verify: E => { const b = parseBars(visual).map(Math.round); return (sum(b) + 1) / 2 === E[0]; },
      hint: `Additionne les effectifs (${effs.join(' + ')}) pour avoir l'effectif total N. N est impair : la médiane est la valeur de rang (N + 1) ÷ 2.`,
      solution: `N = ${effs.join(' + ')} = ${N}. Rang de la médiane : (${N} + 1) ÷ 2 = <b>${r}</b>.` };
  }
  const med = pair ? (valeurDeRang(vals, effs, N / 2) + valeurDeRang(vals, effs, N / 2 + 1)) / 2 : valeurDeRang(vals, effs, (N + 1) / 2);
  const rows = form === 'valA' ? [{ h: 'Effectif', cells: effs }, { h: 'Effectif cumulé croissant', cells: c }] : [{ h: 'Effectif', cells: effs }];
  const jm = vals.indexOf(med), hl = Number.isInteger(med) && jm >= 0 ? [jm] : [vals.indexOf(Math.floor(med)), vals.indexOf(Math.ceil(med))].filter(x => x >= 0);
  const wrongCol = vals[Math.floor((k - 1) / 2)], hasOther = pair ? [valeurDeRang(vals, effs, N / 2), valeurDeRang(vals, effs, N / 2 + 1)] : [];
  const near = [[wrongCol, 'Ce n\'est pas la colonne du milieu du tableau : cherche le rang de la médiane avec les effectifs cumulés.'], [mean(expand(vals, effs)), 'Ça, c\'est la moyenne : la médiane se trouve avec les <b>rangs</b> et les effectifs cumulés.']];
  if (pair) near.push([hasOther[0], 'Avec un effectif <b>pair</b>, la médiane est la moyenne des valeurs de deux rangs (le rang N ÷ 2 et le suivant).'], [hasOther[1], 'Avec un effectif <b>pair</b>, la médiane est la moyenne des valeurs de deux rangs (le rang N ÷ 2 et le suivant).']);
  const hint = form === 'valA' ? `N = ${N} est impair : la médiane est la valeur de rang ${(N + 1) / 2}. Dans la ligne des effectifs cumulés (${c.join(' ; ')}), cherche la première case qui atteint ${(N + 1) / 2}.`
    : form === 'valB' ? `Effectif total : ${effs.join(' + ')} = ${N}, impair : la médiane est la valeur de rang ${(N + 1) / 2}. Calcule les effectifs cumulés et cherche la première case qui atteint ce rang.`
      : `Effectif total : ${effs.join(' + ')} = ${N}, pair : la médiane est la moyenne des valeurs de rang ${N / 2} et ${N / 2 + 1}. Calcule les effectifs cumulés pour les trouver.`;
  const solution = pair
    ? `N = ${N}. Effectifs cumulés : ${c.join(' ; ')}.<br>La ${nth(N / 2)} valeur est ${M(valeurDeRang(vals, effs, N / 2))}, la ${nth(N / 2 + 1)} est ${M(valeurDeRang(vals, effs, N / 2 + 1))}. Médiane : (${M(valeurDeRang(vals, effs, N / 2))} + ${M(valeurDeRang(vals, effs, N / 2 + 1))}) ÷ 2 = <b>${M(med)}</b>${C.u}.`
    : `N = ${N}. Rang de la médiane : (${N} + 1) ÷ 2 = ${(N + 1) / 2}. Effectifs cumulés : ${c.join(' ; ')}.<br>Le rang ${(N + 1) / 2} est atteint pour la valeur <b>${M(med)}</b>${C.u}.`;
  return { type: 'nums', tpl: `Médiane : {0}${C.u}`, keys: COMMA, check: numCheck(med, near),
    html: `${titre}${tableHtml(head, rows)}Quelle est la <b>médiane</b> de cette série&nbsp;?`, visual, afterVisual: bars(T, effs, { hl }),
    verify: E => approx(medCount(expand(vals, effs)), E[0]), hint, solution };
}
export function C5() {
  const v = [0, 1, 2, 3, 4], h = ['Livres lus', v], T = { vals: v, C: { h1: 'Livres lus' } }, e1 = [3, 5, 6, 4, 3], e3 = [2, 6, 5, 4, 2], e4 = [3, 7, 4, 4, 2];
  return `<h2>5. Médiane à partir d'un tableau d'effectifs</h2>
<p class="intro">Quand la série est donnée par un tableau, on ne la réécrit pas en liste : le tableau est déjà rangé. On trouve les rangs de la médiane grâce aux effectifs cumulés.</p>
<div class="def">Avec un effectif total N : N <b>impair</b> → la médiane est la valeur de rang ${F('N + 1', 2)} ; N <b>pair</b> → c'est la moyenne des valeurs de rang ${F('N', 2)} et ${F('N', 2)} + 1. Pour trouver la valeur d'un rang, on cherche la <b>première case des effectifs cumulés</b> qui atteint ce rang.</div>
<div class="cols">${tableHtml(h, [{ h: 'Effectif', cells: e1 }, { h: 'Effectif cumulé croissant', cells: cumul(e1) }])}${bars(T, e1, { hl: [2], width: 320 })}</div>
${methode('Calcule l\'effectif total N (somme des effectifs).', 'Donne le rang de la médiane (N impair) ou les deux rangs (N pair).', 'Calcule les effectifs cumulés croissants.', 'Repère la première case qui atteint le rang : la valeur de cette colonne est la valeur de ce rang.')}
${ex('Exemple 1 : quel est le rang de la médiane (tableau ci-dessus) ?', 'N = 3 + 5 + 6 + 4 + 3 = 21, impair. Rang : (21 + 1) ÷ 2 = <b>11</b>.')}
${ex('Exemple 2 : médiane avec la ligne des effectifs cumulés donnée.', `${tableHtml(h, [{ h: 'Effectif', cells: e1 }, { h: 'Effectif cumulé croissant', cells: cumul(e1) }])}N = 21, rang 11. Cumulés : 3 ; 8 ; <b>14</b> ; 18 ; 21. La première case qui atteint 11 est 14 : la médiane est <b>2 livres</b>.`)}
${ex('Exemple 3 : médiane sans la ligne des cumulés.', `${tableHtml(['Pointure', [37, 38, 39, 40, 41]], [{ h: 'Effectif', cells: e3 }])}N = 2 + 6 + 5 + 4 + 2 = 19, impair : rang 10. Cumulés : 2 ; 8 ; <b>13</b> ; 17 ; 19. Le rang 10 est atteint à 13 : la médiane est la pointure <b>39</b>.`)}
${ex('Exemple 4 : médiane avec un effectif total pair.', `${tableHtml(h, [{ h: 'Effectif', cells: e4 }])}N = 3 + 7 + 4 + 4 + 2 = 20, pair : rangs 10 et 11. Cumulés : 3 ; <b>10</b> ; <b>14</b> ; 18 ; 20. Le rang 10 est atteint à 1, le rang 11 à 2. Médiane : (1 + 2) ÷ 2 = <b>1,5</b>.`)}
${warn('La médiane n\'est pas la valeur de la colonne du milieu : il faut passer par les effectifs cumulés.', 'N impair : rang (N + 1) ÷ 2 ; ne confonds pas avec N ÷ 2.', 'La médiane n\'est pas la moyenne des valeurs du tableau.')}
${retenir('on cherche le rang de la médiane, puis la première case des effectifs cumulés qui l\'atteint.')}`;
}

/* ===================================================================== 6. quartiles d'une série en liste */
export function L6(d) {
  const form = d < 1 ? 'q1a' : d < 2 ? pick(['q1a', 'q3a']) : d < 3 ? pick(['q3a', 'qn']) : d < 4 ? pick(['qn', 'both']) : pick(['qn', 'both', 'both']);
  const C = pick(SERIES);
  const n = form === 'q1a' ? pick([8, 12]) : form === 'q3a' ? pick(d < 2 ? [8, 12] : [8, 12, 16]) : form === 'qn' ? pick([5, 6, 7, 9, 10, 11, 13, 14, 15]) : ri(8, d < 4 ? 13 : 15);
  const unsorted = form === 'both';
  let vals = serie(C, n); const r = resume(vals), s = r.s;
  if (unsorted) { vals = shuffle(vals); let t = 0; while (vals.every((x, i) => x === s[i]) && t++ < 20) vals = shuffle(vals); } else vals = s;
  const askQ1 = form === 'q1a' || (form === 'qn' && ri(0, 1) === 0), askBoth = form === 'both';
  const k1 = rangQ(n, 1), k3 = rangQ(n, 3), quartHint = (k, p, q) => `${n} ÷ 4${p === 3 ? ' × 3' : ''} = ${M(n * p / 4)}${Number.isInteger(n * p / 4) ? ` : ${q} est la valeur de rang ${k}` : `, on prend le rang <b>supérieur</b> : ${q} est la valeur de rang ${k}`}`;
  const html = `${C.intro(n, prenom())} ${unsorted ? '' : '(Les valeurs sont rangées dans l\'ordre croissant.)'}${big(list(vals))}`;
  const common = { type: 'nums', keys: COMMA, visual: tiles(vals, { label: C.axe }) };
  const rangUnsorted = unsorted ? 'Range d\'abord les valeurs dans l\'ordre croissant. ' : '';
  if (askBoth) {
    return { ...common, tpl: `${sub(1)} : {0}${C.u} &nbsp; ${sub(3)} : {1}${C.u}`, labels: ['premier quartile', 'troisième quartile'],
      check: multiCheck([r.q1, r.q3], [[[r.med, 'C\'est la <b>médiane</b>. Le premier quartile Q<sub>1</sub> est plus bas : la valeur de rang n ÷ 4 (arrondi au rang supérieur).'], [s[Math.floor(n / 4) - 1] ?? r.min, 'Presque : quand n ÷ 4 n\'est pas entier, on prend le rang <b>supérieur</b> (on arrondit vers le haut).']], [[r.med, 'C\'est la <b>médiane</b>. Le troisième quartile Q<sub>3</sub> est plus haut : la valeur de rang 3n ÷ 4 (arrondi au rang supérieur).'], [s[Math.floor(3 * n / 4) - 1], 'Presque : quand 3n ÷ 4 n\'est pas entier, on prend le rang <b>supérieur</b> (on arrondit vers le haut).']]]),
      html: `${html}Donne le <b>premier quartile</b> ${sub(1)} et le <b>troisième quartile</b> ${sub(3)} de cette série.`,
      afterVisual: tiles(s, { hl: [k1 - 1, k3 - 1], label: 'série rangée : Q1 et Q3' }),
      verify: E => E[0] === quantCount(vals, 25) && E[1] === quantCount(vals, 75),
      hint: `${rangUnsorted}n = ${n}. Pour ${sub(1)} : ${quartHint(k1, 1, sub(1))}. Pour ${sub(3)} : ${quartHint(k3, 3, sub(3))}.`,
      solution: `Rangée : ${list(s)}.<br>${sub(1)} : rang ${k1}, soit <b>${M(r.q1)}</b>. ${sub(3)} : rang ${k3}, soit <b>${M(r.q3)}</b>.` };
  }
  const X = askQ1 ? r.q1 : r.q3, k = askQ1 ? k1 : k3, name = sub(askQ1 ? 1 : 3), p = askQ1 ? 1 : 3;
  const wrongK = Math.floor(n * p / 4) >= 1 && Math.floor(n * p / 4) !== k ? s[Math.floor(n * p / 4) - 1] : null;
  const near = [[r.med, `C'est la <b>médiane</b>. ${askQ1 ? 'Le premier' : 'Le troisième'} quartile est ${askQ1 ? 'plus bas' : 'plus haut'} dans la série rangée.`]];
  if (wrongK !== null) near.push([wrongK, 'Presque : quand le calcul ne tombe pas juste, on prend le rang <b>supérieur</b> (on arrondit vers le haut).']);
  near.push([askQ1 ? r.q3 : r.q1, `Tu as donné ${askQ1 ? 'Q<sub>3</sub>' : 'Q<sub>1</sub>'} : relis la question.`]);
  return { ...common, tpl: `${name} : {0}${C.u}`, check: numCheck(X, near),
    html: `${html}Donne le <b>${askQ1 ? 'premier' : 'troisième'} quartile</b> ${name} de cette série.`,
    afterVisual: tiles(s, { hl: [k - 1], label: `série rangée : ${askQ1 ? 'Q1' : 'Q3'}` }),
    verify: E => E[0] === quantCount(vals, askQ1 ? 25 : 75),
    hint: `${rangUnsorted}n = ${n}. ${quartHint(k, p, name)}.`,
    solution: `Rangée : ${list(s)}.<br>${n} ÷ 4${p === 3 ? ' × 3' : ''} = ${M(n * p / 4)}${Number.isInteger(n * p / 4) ? '' : ', arrondi au rang supérieur'} : ${name} est la ${nth(k)} valeur, soit <b>${M(X)}</b>${C.u}.` };
}
export function C6() {
  return `<h2>6. Premier et troisième quartiles</h2>
<p class="intro">La médiane coupe la série en deux moitiés. Les quartiles la coupent en quatre : ils disent où se situent le quart le plus bas et le quart le plus haut.</p>
<div class="def">Le <b>premier quartile</b> Q<sub>1</sub> est la plus petite valeur de la série telle qu'<b>au moins 25 %</b> des valeurs lui soient inférieures ou égales. Le <b>troisième quartile</b> Q<sub>3</sub> est la plus petite valeur telle qu'<b>au moins 75 %</b> des valeurs lui soient inférieures ou égales.<br>Dans la série rangée de n valeurs : Q<sub>1</sub> est de rang ${F('n', 4)} et Q<sub>3</sub> de rang ${F('3n', 4)}, <b>arrondis au rang supérieur</b> si le résultat n'est pas entier.</div>
${tiles([6, 8, 9, 11, 12, 14, 15, 18], { hl: [1, 5], label: 'n = 8 : Q1 est la 2e valeur, Q3 la 6e' })}
${methode('Range les valeurs dans l\'ordre croissant.', 'Calcule n ÷ 4 (pour Q<sub>1</sub>) ou 3n ÷ 4 (pour Q<sub>3</sub>).', 'Si le résultat est entier, c\'est le rang. Sinon, arrondis <b>au rang supérieur</b>.', 'Lis la valeur à ce rang dans la série rangée.')}
${ex('Exemple 1 : notes rangées : 6 ; 8 ; 9 ; 11 ; 12 ; 14 ; 15 ; 18. Donne Q<sub>1</sub>.', 'n = 8 ; 8 ÷ 4 = 2 : Q<sub>1</sub> est la 2<sup>e</sup> valeur, <b>8</b>.')}
${ex('Exemple 2 : points rangés : 8 ; 10 ; 12 ; 13 ; 15 ; 16 ; 18 ; 19 ; 21 ; 22 ; 25 ; 28. Donne Q<sub>3</sub>.', 'n = 12 ; 12 ÷ 4 × 3 = 9 : Q<sub>3</sub> est la 9<sup>e</sup> valeur, <b>21</b>.')}
${ex('Exemple 3 : n = 9 valeurs rangées : 12 ; 14 ; 15 ; 17 ; 18 ; 20 ; 23 ; 25 ; 29. Donne Q<sub>1</sub>.', 'n = 9 ; 9 ÷ 4 = 2,25 : on arrondit au rang supérieur, 3. Q<sub>1</sub> est la 3<sup>e</sup> valeur, <b>15</b>. (Pour Q<sub>3</sub> : 9 ÷ 4 × 3 = 6,75, rang 7, soit 23.)')}
${ex('Exemple 4 : valeurs dans le désordre : 17 ; 9 ; 12 ; 20 ; 14 ; 8 ; 15 ; 11 ; 18 ; 13. Donne Q<sub>1</sub> et Q<sub>3</sub>.', 'On range : 8 ; 9 ; 11 ; 12 ; 13 ; 14 ; 15 ; 17 ; 18 ; 20. n = 10 : 10 ÷ 4 = 2,5, rang 3, Q<sub>1</sub> = <b>11</b> ; 10 ÷ 4 × 3 = 7,5, rang 8, Q<sub>3</sub> = <b>17</b>.')}
${warn('Toujours <b>ranger</b> avant de chercher les quartiles.', 'Si n ÷ 4 n\'est pas entier, on prend le rang <b>supérieur</b> : 2,25 donne le rang 3, pas 2.', 'Les quartiles ne sont pas la médiane : Q<sub>1</sub> ≤ médiane ≤ Q<sub>3</sub>.')}
${retenir('Q<sub>1</sub> est la valeur de rang n ÷ 4 et Q<sub>3</sub> celle de rang 3n ÷ 4, arrondis au rang supérieur, dans la série rangée.')}`;
}

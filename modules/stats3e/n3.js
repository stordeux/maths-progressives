// Niveaux 7 à 9 : quartiles d'un tableau ou d'un diagramme, étendue et écart interquartile, lecture d'une boîte à moustaches.
import { ri, pick, shuffle, prenom } from '../../engine/util/rand.js';
import { approx } from '../../engine/util/arith.js';
import { M, F } from '../../engine/util/fmt.js';
import { tiles, tableHtml, parseBars, boxPlot, readBox, ecartSvg } from './draw.js';
import { choiceCheck } from '../../engine/answers/checks.js';
import { bars } from './n1.js';
import { sum, range, cumul, expand, tableau, TABLES, SERIES, serie, resume, valeurDeRang, quantCount, medCount, rangQ, AXES, BOXC, cinq } from './stat.js';
import { numCheck, multiCheck, big, list, COMMA, ex, warn, retenir, methode, fv } from './util.js';

const sub = k => `Q<sub>${k}</sub>`;
const nth = r => `${r}<sup>e</sup>`;
const rk = (N, p) => `${N} ÷ 4${p === 3 ? ' × 3' : ''} = ${M(N * p / 4)}${Number.isInteger(N * p / 4) ? ` : rang ${rangQ(N, p)}` : `, arrondi au rang supérieur : rang ${rangQ(N, p)}`}`;

/* ===================================================================== 7. quartiles d'un tableau ou d'un diagramme */
export function L7(d) {
  const form = d < 1 ? 'q1c' : d < 2 ? 'q3c' : d < 3 ? 'qn' : d < 4 ? 'bar' : pick(['bar', 'barB']);
  const C = pick(TABLES), k = ri(5, 6), isBar = form.startsWith('bar');
  let T, N;
  do {
    N = form === 'q1c' || form === 'q3c' ? 4 * ri(5, 8) : form === 'qn' ? ri(17, 35) : ri(14, 24);
    if (form === 'qn' && N % 4 === 0) N++;
    T = tableau(C, k, N, isBar ? 2 : 1);
  } while (isBar && Math.max(...T.effs) > 12);
  const { vals, effs } = T, c = cumul(effs), head = [C.h1, vals], titre = `<b>${C.titre}</b>`;
  const both = form === 'barB', askQ1 = form === 'q1c' || (!both && ri(0, 1) === 0), p = askQ1 ? 1 : 3, name = sub(askQ1 ? 1 : 3);
  const r1 = rangQ(N, 1), r3 = rangQ(N, 3), x1 = valeurDeRang(vals, effs, r1), x3 = valeurDeRang(vals, effs, r3);
  const visual = bars(T, effs), raw = expand(vals, effs);
  const rows = form === 'q1c' || form === 'q3c' ? [{ h: 'Effectif', cells: effs }, { h: 'Effectif cumulé croissant', cells: c }] : [{ h: 'Effectif', cells: effs }];
  const medV = medCount(raw);
  const base = isBar ? `${titre}Voici le diagramme en barres de la série (lis les effectifs sur les barres).` : `${titre}${tableHtml(head, rows)}`;
  if (both) {
    return { type: 'nums', tpl: `${sub(1)} : {0} &nbsp; ${sub(3)} : {1}`, labels: ['premier quartile', 'troisième quartile'], check: multiCheck([x1, x3], [[[medV, "C'est la <b>médiane</b> : le premier quartile est plus bas."], [vals[Math.floor((k - 1) / 2)], "Ce n'est pas la colonne du milieu : cherche le rang avec les effectifs cumulés."]], [[medV, "C'est la <b>médiane</b> : le troisième quartile est plus haut."]]]),
      html: `${base}<br>Donne le premier quartile ${sub(1)} et le troisième quartile ${sub(3)} de cette série.`, visual, afterVisual: bars(T, effs, { hl: [vals.indexOf(x1), vals.indexOf(x3)] }),
      verify: E => { const b = parseBars(visual).map(Math.round), r = expand(vals, b); return E[0] === quantCount(r, 25) && E[1] === quantCount(r, 75); },
      hint: `Lis les effectifs (${effs.join(' ; ')}) et additionne-les : N. Pour ${sub(1)} : N ÷ 4, arrondi au rang supérieur ; pour ${sub(3)} : N ÷ 4 × 3, arrondi au rang supérieur. Puis cherche ces rangs avec les effectifs cumulés.`,
      solution: `N = ${effs.join(' + ')} = ${N}. Effectifs cumulés : ${c.join(' ; ')}.<br>${sub(1)} : ${rk(N, 1)} ; le rang ${r1} est atteint pour <b>${M(x1)}</b>.<br>${sub(3)} : ${rk(N, 3)} ; le rang ${r3} est atteint pour <b>${M(x3)}</b>.` };
  }
  const X = askQ1 ? x1 : x3, r = askQ1 ? r1 : r3;
  const near = [[medV, `C'est la <b>médiane</b> : ${askQ1 ? 'le premier' : 'le troisième'} quartile est ${askQ1 ? 'plus bas' : 'plus haut'}.`], [vals[Math.floor((k - 1) / 2)], "Ce n'est pas la colonne du milieu : cherche le rang avec les effectifs cumulés."], [askQ1 ? x3 : x1, `Tu as donné ${askQ1 ? sub(3) : sub(1)} : relis la question.`]];
  const hint = form === 'q1c' || form === 'q3c' ? `N = ${N} ; ${rk(N, p)}. Dans la ligne des effectifs cumulés (${c.join(' ; ')}), cherche la première case qui atteint ${r}.`
    : form === 'qn' ? `Effectif total : ${effs.join(' + ')} = ${N}. ${rk(N, p)}. Calcule les effectifs cumulés et cherche la première case qui atteint ${r}.`
      : `Lis les effectifs sur les barres (${effs.join(' ; ')}) et additionne-les : N. Pour ${name}, calcule N ÷ 4${p === 3 ? ' × 3' : ''} (arrondi au rang supérieur), puis cherche ce rang avec les effectifs cumulés.`;
  return { type: 'nums', tpl: `${name} : {0}${C.u}`, keys: COMMA, check: numCheck(X, near),
    html: `${base}<br>Donne le <b>${askQ1 ? 'premier' : 'troisième'} quartile</b> ${name} de cette série.`, visual, afterVisual: bars(T, effs, { hl: [vals.indexOf(X)] }),
    verify: E => { const b = parseBars(visual).map(Math.round); return E[0] === quantCount(expand(vals, b), askQ1 ? 25 : 75); },
    hint, solution: `N = ${effs.join(' + ')} = ${N}. ${rk(N, p)}. Effectifs cumulés : ${c.join(' ; ')}.<br>Le rang ${r} est atteint pour la valeur <b>${M(X)}</b>${C.u}.` };
}
export function C7() {
  const v1 = [8, 9, 10, 11, 12], e1 = [2, 5, 7, 6, 4], v3 = [37, 38, 39, 40, 41], e3 = [3, 4, 6, 5, 3];
  const T4 = { vals: [0, 1, 2, 3, 4, 5], C: { h1: 'Livres lus cet été' } }, b4 = [3, 5, 4, 3, 2, 1], b5 = [1, 4, 6, 5, 3, 1];
  return `<h2>7. Quartiles d'un tableau ou d'un diagramme</h2>
<p class="intro">Pour un tableau d'effectifs, on ne réécrit pas la liste : on trouve les rangs des quartiles, puis on cherche la valeur avec les effectifs cumulés.</p>
<div class="def">Avec un effectif total N : ${sub(1)} est la valeur de rang ${F('N', 4)} et ${sub(3)} la valeur de rang ${F('3N', 4)}, <b>arrondis au rang supérieur</b> si besoin. Le rang est atteint dans la <b>première case</b> des effectifs cumulés croissants qui lui est supérieure ou égale.</div>
<div class="cols">${tableHtml(['Note (sur 20)', v1], [{ h: 'Effectif', cells: e1 }, { h: 'Effectif cumulé croissant', cells: cumul(e1) }])}${bars({ vals: v1, C: { h1: 'Note (sur 20)' } }, e1, { hl: [1, 3], width: 320 })}</div>
${methode('Calcule N (somme des effectifs ; sur un diagramme, lis chaque barre).', 'Rang de ' + sub(1) + ' : N ÷ 4 ; rang de ' + sub(3) + ' : N ÷ 4 × 3 (arrondi au rang supérieur).', 'Calcule les effectifs cumulés croissants.', 'La valeur du rang est celle de la première case cumulée qui atteint ce rang.')}
${ex('Exemple 1 : donne le premier quartile (effectifs cumulés donnés).', `${tableHtml(['Note (sur 20)', v1], [{ h: 'Effectif', cells: e1 }, { h: 'Effectif cumulé croissant', cells: cumul(e1) }])}N = 24 ; 24 ÷ 4 = 6 : rang 6. Cumulés : 2 ; <b>7</b> ; 14 ; 20 ; 24. La première case qui atteint 6 est 7 : ${sub(1)} = <b>9</b>.`)}
${ex('Exemple 2 : donne le troisième quartile (mêmes données).', `24 ÷ 4 × 3 = 18 : rang 18. Cumulés : 2 ; 7 ; 14 ; <b>20</b> ; 24. La première case qui atteint 18 est 20 : ${sub(3)} = <b>11</b>.`)}
${ex('Exemple 3 : donne le premier quartile quand N ÷ 4 n\'est pas entier (pas de ligne des cumulés).', `${tableHtml(['Pointure', v3], [{ h: 'Effectif', cells: e3 }])}N = 3 + 4 + 6 + 5 + 3 = 21 ; 21 ÷ 4 = 5,25, arrondi au rang supérieur : rang 6. Cumulés : 3 ; <b>7</b> ; 13 ; 18 ; 21. ${sub(1)} = <b>38</b>. (Pour ${sub(3)} : 21 ÷ 4 × 3 = 15,75, rang 16, cumulé 18, donc 40.)`)}
${bars(T4, b4, { hl: [1], width: 360 })}
${ex('Exemple 4 : donne le premier quartile d\'après le diagramme en barres (livres lus, voir ci-dessus).', 'On lit les effectifs : 3 ; 5 ; 4 ; 3 ; 2 ; 1. N = 18 ; 18 ÷ 4 = 4,5, rang 5. Cumulés : 3 ; <b>8</b> ; 12 ; 15 ; 17 ; 18. Le rang 5 est atteint à 8 : ' + sub(1) + ' = <b>1</b>.')}
${bars(T4, b5, { hl: [1, 3], width: 360 })}
${ex('Exemple 5 : donne ' + sub(1) + ' et ' + sub(3) + ' d\'après ce second diagramme.', 'Effectifs : 1 ; 4 ; 6 ; 5 ; 3 ; 1. N = 20 ; rangs 5 et 15. Cumulés : 1 ; <b>5</b> ; 11 ; <b>16</b> ; 19 ; 20. ' + sub(1) + ' = <b>1</b> (le rang 5 est atteint à 5), ' + sub(3) + ' = <b>3</b> (le rang 15 est atteint à 16).')}
${warn('La colonne du milieu du tableau n\'est pas forcément la médiane, et encore moins un quartile.', 'Si N ÷ 4 n\'est pas entier, on arrondit au rang <b>supérieur</b>.', 'Sur un diagramme, ne lis pas les valeurs en bas comme des effectifs : l\'effectif est la hauteur de la barre.')}
${retenir('on calcule les rangs N ÷ 4 et 3N ÷ 4, puis on lit la valeur dans les effectifs cumulés.')}`;
}

/* ===================================================================== 8. écart interquartile et étendue */
export function L8(d) {
  const form = d < 1 ? pick(['giv', 'ext']) : d < 2 ? pick(['ext', 'both']) : d < 3 ? pick(['both', 'iqr']) : d < 4 ? pick(['iqr', 'tab']) : pick(['iqr', 'tab', 'both']);
  const S = pick(SERIES);
  if (form === 'giv' || form === 'ext') {
    const a = ri(S.lo, Math.round((S.lo + S.hi) / 2) - 2), b = a + ri(3, Math.max(4, Math.round((S.hi - S.lo) / 3)));
    if (form === 'giv') {
      return { type: 'nums', tpl: `Écart interquartile : {0}${S.u}`, check: numCheck(b - a, [[b, `${M(b)} est ${sub(3)} : l'écart interquartile est la <b>différence</b> ${sub(3)} − ${sub(1)}.`], [a + b, `Il faut <b>soustraire</b> : ${sub(3)} − ${sub(1)}, pas les additionner.`]]),
        html: `Pour une série de ${S.pl}, on a calculé ${sub(1)} = ${fv(a, S.u)} et ${sub(3)} = ${fv(b, S.u)}.<br>Quel est l'<b>écart interquartile</b> de cette série&nbsp;?`,
        visual: ecartSvg('Q1', a, 'Q3', b, { ask: 'écart ?' }),
        value: b - a, hint: `Écart interquartile = ${sub(3)} − ${sub(1)} : soustrais ${M(a)} de ${M(b)}.`, solution: `${sub(3)} − ${sub(1)} = ${M(b)} − ${M(a)} = <b>${M(b - a)}</b>${S.u}.` };
    }
    const lo = a, hi = a + ri(8, Math.max(10, S.hi - S.lo));
    return { type: 'nums', tpl: `Étendue : {0}${S.u}`, check: numCheck(hi - lo, [[hi, `${M(hi)} est la plus grande valeur : l'étendue est la <b>différence</b> entre la plus grande et la plus petite.`], [lo + hi, 'Il faut <b>soustraire</b> : plus grande valeur − plus petite valeur.']]),
      html: `Dans une série de ${S.pl}, la plus petite valeur est ${fv(lo, S.u)} et la plus grande est ${fv(hi, S.u)}.<br>Quelle est l'<b>étendue</b> de cette série&nbsp;?`,
      visual: ecartSvg('min', lo, 'max', hi, { ask: 'étendue ?' }), value: hi - lo,
      hint: `Étendue = plus grande valeur − plus petite valeur : soustrais ${M(lo)} de ${M(hi)}.`, solution: `${M(hi)} − ${M(lo)} = <b>${M(hi - lo)}</b>${S.u}.` };
  }
  const near2 = (r) => [[[r.max, `${M(r.max)} est la plus grande valeur : l'étendue est la différence entre la plus grande et la plus petite.`], [r.max + r.min, 'Il faut <b>soustraire</b> : plus grande valeur − plus petite valeur.']], [[r.q3, `${M(r.q3)} est ${sub(3)} : l'écart interquartile est ${sub(3)} − ${sub(1)}.`], [r.q3 + r.q1, `Il faut <b>soustraire</b> : ${sub(3)} − ${sub(1)}.`], [r.max - r.min, `${M(r.max - r.min)} est l'<b>étendue</b>. Pour l'écart interquartile, utilise les quartiles ${sub(1)} et ${sub(3)}.`]]];
  if (form === 'tab') {
    const C = pick(TABLES), k = ri(5, 6), N = ri(20, 40), T = tableau(C, k, N), { vals, effs } = T, raw = expand(vals, effs), r = resume(raw), c = cumul(effs);
    const visual = bars(T, effs);
    return { type: 'nums', tpl: `Étendue : {0}${C.u} &nbsp; Écart interquartile : {1}${C.u}`, labels: ['étendue', 'écart interquartile'], check: multiCheck([r.etendue, r.iqr], near2(r)),
      html: `<b>${C.titre}</b>${tableHtml([C.h1, vals], [{ h: 'Effectif', cells: effs }])}Donne l'<b>étendue</b> et l'<b>écart interquartile</b> de cette série.`, visual, afterVisual: bars(T, effs, { hl: [0, k - 1, vals.indexOf(r.q1), vals.indexOf(r.q3)] }),
      verify: E => { const b = parseBars(visual).map(Math.round), s = expand(vals, b); return E[0] === vals[k - 1] - vals[0] && E[1] === quantCount(s, 75) - quantCount(s, 25); },
      hint: `Étendue : plus grande valeur (${M(vals[k - 1])}) − plus petite valeur (${M(vals[0])}). Pour les quartiles : N = ${effs.join(' + ')} ; rangs N ÷ 4 et N ÷ 4 × 3 (arrondis au rang supérieur), lus dans les effectifs cumulés ; écart interquartile = ${sub(3)} − ${sub(1)}.`,
      solution: `Étendue : ${M(vals[k - 1])} − ${M(vals[0])} = <b>${M(r.etendue)}</b>.<br>N = ${N}, cumulés : ${c.join(' ; ')}. ${sub(1)} : rang ${rangQ(N, 1)}, soit ${M(r.q1)} ; ${sub(3)} : rang ${rangQ(N, 3)}, soit ${M(r.q3)}. Écart interquartile : ${M(r.q3)} − ${M(r.q1)} = <b>${M(r.iqr)}</b>.` };
  }
  const n = form === 'both' ? (d < 2 ? pick([8, 12]) : ri(8, 13)) : ri(9, d < 4 ? 13 : 15), sortedList = form === 'both' && d < 2;
  let vals = serie(S, n); const r = resume(vals), s = r.s;
  vals = sortedList ? s : shuffle(vals);
  const intro = `${S.intro(n, prenom())} ${sortedList ? '(Les valeurs sont rangées dans l\'ordre croissant.)' : ''}${big(list(vals))}`;
  if (form === 'both') {
    return { type: 'nums', tpl: `Étendue : {0}${S.u} &nbsp; Écart interquartile : {1}${S.u}`, labels: ['étendue', 'écart interquartile'], check: multiCheck([r.etendue, r.iqr], near2(r)),
      html: `${intro}Donne l'<b>étendue</b> et l'<b>écart interquartile</b> de cette série.`, visual: tiles(vals, { label: S.axe }), afterVisual: tiles(s, { hl: [0, rangQ(n, 1) - 1, rangQ(n, 3) - 1, n - 1], label: 'rangée : min, Q1, Q3, max' }),
      verify: E => E[0] === Math.max(...vals) - Math.min(...vals) && E[1] === quantCount(vals, 75) - quantCount(vals, 25),
      hint: `${sortedList ? '' : 'Range d\'abord les valeurs. '}Étendue : plus grande valeur (${M(r.max)}) − plus petite valeur (${M(r.min)}). Quartiles : n = ${n}, rangs n ÷ 4 = ${M(n / 4)} et n ÷ 4 × 3 = ${M(3 * n / 4)} (au rang supérieur) ; écart interquartile = ${sub(3)} − ${sub(1)}.`,
      solution: `Étendue : ${M(r.max)} − ${M(r.min)} = <b>${M(r.etendue)}</b>.<br>${sub(1)} : rang ${rangQ(n, 1)}, soit ${M(r.q1)} ; ${sub(3)} : rang ${rangQ(n, 3)}, soit ${M(r.q3)}. Écart interquartile : ${M(r.q3)} − ${M(r.q1)} = <b>${M(r.iqr)}</b>.` };
  }
  return { type: 'nums', tpl: `Écart interquartile : {0}${S.u}`, check: numCheck(r.iqr, [[r.q3, `${M(r.q3)} est ${sub(3)} : l'écart interquartile est ${sub(3)} − ${sub(1)}.`], [r.etendue, `${M(r.etendue)} est l'<b>étendue</b>. Pour l'écart interquartile, utilise les quartiles ${sub(1)} et ${sub(3)}.`], [r.q3 + r.q1, `Il faut <b>soustraire</b> : ${sub(3)} − ${sub(1)}.`]]),
    html: `${intro}Quel est l'<b>écart interquartile</b> de cette série&nbsp;?`, visual: tiles(vals, { label: S.axe }), afterVisual: tiles(s, { hl: [rangQ(n, 1) - 1, rangQ(n, 3) - 1], label: 'rangée : Q1 et Q3' }),
    verify: E => E[0] === quantCount(vals, 75) - quantCount(vals, 25),
    hint: `Range d'abord les valeurs. n = ${n} : ${sub(1)} est de rang ${M(n / 4)} arrondi au rang supérieur, ${sub(3)} de rang ${M(3 * n / 4)} arrondi au rang supérieur. Puis ${sub(3)} − ${sub(1)}.`,
    solution: `Rangée : ${list(s)}.<br>${sub(1)} : rang ${rangQ(n, 1)}, soit ${M(r.q1)} ; ${sub(3)} : rang ${rangQ(n, 3)}, soit ${M(r.q3)}. Écart interquartile : ${M(r.q3)} − ${M(r.q1)} = <b>${M(r.iqr)}</b>${S.u}.` };
}
export function C8() {
  const r = { min: 7, q1: 11, med: 14, q3: 17, max: 22 };
  return `<h2>8. Écart interquartile et étendue</h2>
<p class="intro">Pour mesurer si une série est resserrée ou étalée, on peut utiliser l'étendue (toute la série) ou l'écart interquartile (le milieu de la série, sans les valeurs extrêmes).</p>
<div class="def">L'<b>étendue</b> est la différence entre la plus grande et la plus petite valeur : max − min.<br>L'<b>écart interquartile</b> est la différence entre les quartiles : ${sub(3)} − ${sub(1)}. Il contient au moins la moitié des valeurs « du milieu ».</div>
${boxPlot([r], { lo: 4, hi: 24, g: 1, lab: 2, show: true })}
${methode('Étendue : repère la plus petite et la plus grande valeur, puis soustrais.', 'Écart interquartile : trouve ' + sub(1) + ' et ' + sub(3) + ' (rangs n ÷ 4 et 3n ÷ 4, arrondis au rang supérieur), puis soustrais.', 'Dans un tableau, utilise les effectifs cumulés pour trouver les quartiles ; les extrêmes sont la première et la dernière colonne.')}
${ex('Exemple 1 : on donne ' + sub(1) + ' = 11 et ' + sub(3) + ' = 17 ; quel est l\'écart interquartile ?', `${sub(3)} − ${sub(1)} = 17 − 11 = <b>6</b>.`)}
${ex('Exemple 2 : la plus petite valeur est 7 et la plus grande 22 ; quelle est l\'étendue ?', 'Étendue : 22 − 7 = <b>15</b>.')}
${ex('Exemple 3 : valeurs rangées : 7 ; 9 ; 10 ; 11 ; 12 ; 13 ; 15 ; 17 ; 18 ; 19 ; 20 ; 22. Donne l\'étendue et l\'écart interquartile.', `Étendue : 22 − 7 = <b>15</b>. n = 12 : ${sub(1)} est de rang 3 (10), ${sub(3)} de rang 9 (18). Écart interquartile : 18 − 10 = <b>8</b>.`)}
${ex('Exemple 4 : valeurs dans le désordre : 18 ; 9 ; 14 ; 12 ; 20 ; 8 ; 15 ; 11 ; 17 ; 13. Donne l\'écart interquartile.', `On range : 8 ; 9 ; 11 ; 12 ; 13 ; 14 ; 15 ; 17 ; 18 ; 20. n = 10 : ${sub(1)} de rang 3 (11), ${sub(3)} de rang 8 (17). Écart interquartile : 17 − 11 = <b>6</b>.`)}
${ex('Exemple 5 : étendue et écart interquartile à partir d\'un tableau.', `${tableHtml(['Note (sur 20)', [8, 9, 10, 11, 12]], [{ h: 'Effectif', cells: [2, 5, 7, 6, 4] }, { h: 'Effectif cumulé croissant', cells: [2, 7, 14, 20, 24] }])}Étendue : 12 − 8 = <b>4</b>. N = 24 : ${sub(1)} de rang 6 (valeur 9), ${sub(3)} de rang 18 (valeur 11). Écart interquartile : 11 − 9 = <b>2</b>.`)}
${warn('L\'écart interquartile n\'est pas ' + sub(3) + ' : il faut soustraire ' + sub(1) + '.', 'Étendue et écart interquartile se calculent par une <b>différence</b>, jamais par une somme.', 'Une valeur extrême change beaucoup l\'étendue, très peu l\'écart interquartile.')}
${retenir('étendue = max − min ; écart interquartile = ' + sub(3) + ' − ' + sub(1) + '.')}`;
}

/* ===================================================================== 9. lire une boîte à moustaches */
const REP = [['min', 'la <b>valeur minimale</b> (extrémité gauche)'], ['q1', `le <b>premier quartile</b> ${sub(1)}`], ['med', 'la <b>médiane</b>'], ['q3', `le <b>troisième quartile</b> ${sub(3)}`], ['max', 'la <b>valeur maximale</b> (extrémité droite)']];
const REPD = { min: 'du minimum', q1: 'du premier quartile', med: 'de la médiane', q3: 'du troisième quartile', max: 'du maximum' };
const REPN = { min: 'le minimum', q1: 'le premier quartile', med: 'la médiane', q3: 'le troisième quartile', max: 'le maximum' };
/** contexte, axe et cinq nombres pour un niveau de difficulté d */
export function boite(d) {
  const ai = Math.min(4, ri(Math.max(0, d - 1), d)), A = AXES[ai], C = pick(BOXC.filter(c => c.ax.includes(ai))), five = cinq(A);
  return { A, C, five, ai };
}
export const comp = (C, sens) => (sens === 'max' ? (C.f ? 'inférieure ou égale' : 'inférieur ou égal') : (C.f ? 'supérieure ou égale' : 'supérieur ou égal'));
export function L9(d) {
  const form = d < 1 ? 'one' : d < 2 ? pick(['one', 'etend']) : d < 3 ? pick(['etend', 'iqr']) : d < 4 ? pick(['iqr', 'moitie']) : pick(['moitie', 'vf', 'iqr']);
  const { A, C, five: f } = boite(d);
  const opt = { lo: A.lo, hi: A.hi, g: A.g, lab: A.lab, axe: C.axe };
  const visual = boxPlot([f], opt), after = boxPlot([f], { ...opt, show: true });
  const read = () => readBox(visual)[0];
  const titre = `<b>${C.titre}</b>`, grad = A.g > 1 ? ` Un petit trait de l'axe vaut ${A.g}.` : '';
  const base = { type: 'nums', keys: COMMA, visual, afterVisual: after, replaceVisual: true };
  const others = key => REP.filter(([k]) => k !== key).map(([k]) => [f[k], `Tu as lu ${REPN[k]} : relis le nom du repère demandé (trait épais = médiane, bords de la boîte = quartiles, extrémités = min et max).`]);
  if (form === 'one') {
    const [key, nom] = pick(REP);
    return { ...base, tpl: `Réponse : {0}${C.u}`, check: numCheck(f[key], [...others(key), [f[key] - A.g, 'Presque : regarde bien la graduation, un petit trait ne vaut pas 1.'], [f[key] + A.g, 'Presque : regarde bien la graduation.']]),
      html: `${titre}<br>Voici la boîte à moustaches de cette série. Lis ${nom} sur l'axe.`, verify: E => approx(read()[key], E[0]),
      hint: `${key === 'med' ? 'La médiane est le trait épais orange à l\'intérieur de la boîte' : key === 'q1' ? 'Q1 est le bord gauche de la boîte' : key === 'q3' ? 'Q3 est le bord droit de la boîte' : key === 'min' ? 'Le minimum est le bout de la moustache gauche' : 'Le maximum est le bout de la moustache droite'} : descends verticalement jusqu'à l'axe et lis le nombre.${grad}`,
      solution: `On lit ${REPN[key]} : <b>${M(f[key])}</b>${C.u}.` };
  }
  if (form === 'etend') {
    return { ...base, tpl: `Étendue : {0}${C.u}`, check: numCheck(f.max - f.min, [[f.max, `${M(f.max)} est le maximum : l'étendue est max − min.`], [f.q3 - f.q1, `${M(f.q3 - f.q1)} est l'<b>écart interquartile</b> (largeur de la boîte). L'étendue va d'une extrémité à l'autre.`]]),
      html: `${titre}<br>Voici la boîte à moustaches de cette série. Quelle est son <b>étendue</b>&nbsp;?`, verify: E => { const b = read(); return approx(b.max - b.min, E[0]); },
      hint: `L'étendue se mesure de bout en bout : lis le nombre où s'arrête la moustache de gauche et celui où s'arrête la moustache de droite, puis soustrais.${grad}`,
      solution: `Maximum : ${M(f.max)} ; minimum : ${M(f.min)}. Étendue : ${M(f.max)} − ${M(f.min)} = <b>${M(f.max - f.min)}</b>${C.u}.` };
  }
  if (form === 'iqr') {
    return { ...base, tpl: `Écart interquartile : {0}${C.u}`, check: numCheck(f.q3 - f.q1, [[f.max - f.min, `${M(f.max - f.min)} est l'<b>étendue</b> (de bout en bout). L'écart interquartile est la largeur de la <b>boîte</b>.`], [f.q3, `${M(f.q3)} est ${sub(3)} : il faut soustraire ${sub(1)}.`]]),
      html: `${titre}<br>Voici la boîte à moustaches de cette série. Quel est son <b>écart interquartile</b>&nbsp;?`, verify: E => { const b = read(); return approx(b.q3 - b.q1, E[0]); },
      hint: `L'écart interquartile est la largeur de la boîte : lis le nombre du bord gauche (${sub(1)}) et celui du bord droit (${sub(3)}), puis soustrais.${grad}`,
      solution: `${sub(3)} = ${M(f.q3)} et ${sub(1)} = ${M(f.q1)}. Écart interquartile : ${M(f.q3)} − ${M(f.q1)} = <b>${M(f.q3 - f.q1)}</b>${C.u}.` };
  }
  const sens = pick(['max', 'min']), p = pick([25, 50, 75]);
  const key = sens === 'max' ? { 25: 'q1', 50: 'med', 75: 'q3' }[p] : { 25: 'q3', 50: 'med', 75: 'q1' }[p];
  const keyTxt = REPN[key];
  if (form === 'moitie') {
    const th = { max: { 25: 'q1', 50: 'med', 75: 'q3' }, min: { 25: 'q3', 50: 'med', 75: 'q1' } };
    return { ...base, tpl: `Réponse : {0}${C.u}`, check: numCheck(f[key], others(key)),
      html: `${titre}<br>Voici la boîte à moustaches de cette série.<br>Au moins <b>${p} %</b> des ${C.who} ${C.ont} <b>${comp(C, sens)}</b> à … Complète avec ${sens === 'max' ? 'la plus petite' : 'la plus grande'} valeur possible pour que ce soit certain.`,
      verify: E => { const b = read(); return approx(b[th[sens][p]], E[0]); },
      hint: `Entre deux repères voisins de la boîte (min, ${sub(1)}, médiane, ${sub(3)}, max), il y a 25 % des valeurs. Compte combien de quarts (25 %) il faut ${sens === 'max' ? 'à gauche' : 'à droite'} du nombre cherché pour avoir ${p} %.${grad}`,
      solution: `${sens === 'max' ? 'À gauche' : 'À droite'} ${REPD[key]} il y a au moins ${p} % des valeurs : on lit <b>${M(f[key])}</b>${C.u}.` };
  }
  // vf : peut-on affirmer ?
  const good = f[key], order = ['min', 'q1', 'med', 'q3', 'max'];
  const ok = pick([true, false]);
  let v = good;
  if (!ok) { const cands = sens === 'max' ? order.filter(k => f[k] < good) : order.filter(k => f[k] > good); v = f[pick(cands)]; }
  const th = { max: { 25: 'q1', 50: 'med', 75: 'q3' }, min: { 25: 'q3', 50: 'med', 75: 'q1' } };
  return { type: 'choice', visual, afterVisual: after, replaceVisual: true, opts: [{ v: 'oui', l: 'Oui, c\'est certain' }, { v: 'non', l: 'Non, on ne peut pas l\'affirmer' }],
    check: choiceCheckVF(ok ? 'oui' : 'non'),
    html: `${titre}<br>Voici la boîte à moustaches de cette série.<br>D'après cette boîte, peut-on affirmer qu'au moins <b>${p} %</b> des ${C.who} ${C.ont} <b>${comp(C, sens)}</b> à <b>${fv(v, C.u)}</b>&nbsp;?`,
    verify: E => { const b = read(), t = b[th[sens][p]], sure = sens === 'max' ? v >= t - 1e-9 : v <= t + 1e-9; return (E === 'oui') === sure; },
    hint: `À gauche de ${sub(1)} il y a 25 % des valeurs, à gauche de la médiane 50 %, à gauche de ${sub(3)} 75 % (et à droite, c'est l'inverse). Cherche où se trouve ${M(v)} sur l'axe et compare avec les ${p} % de l'énoncé.${grad}`,
    solution: ok ? `${sens === 'max' ? 'À gauche' : 'À droite'} ${REPD[key]} (${M(good)}) il y a au moins ${p} % des valeurs : oui, c'est <b>certain</b>.`
      : `Pour avoir au moins ${p} % des valeurs ${sens === 'max' ? 'inférieures ou égales' : 'supérieures ou égales'} à un nombre, il faut aller jusqu'à ${REPN[key]} (${M(good)}). Avec ${M(v)}, on ne peut pas l'affirmer : <b>non</b>.` };
}
const choiceCheckVF = E => choiceCheck(E, { msg: () => 'Regarde où se trouve ce nombre par rapport aux repères de la boîte : entre deux repères voisins, il y a 25 % des valeurs.' });
export function C9() {
  const f = { min: 4, q1: 9, med: 12, q3: 15, max: 19 }, o = { lo: 0, hi: 20, g: 1, lab: 1, axe: 'note (sur 20)' };
  return `<h2>9. Lire une boîte à moustaches</h2>
<p class="intro">Une boîte à moustaches résume une série avec cinq nombres. Entre deux repères voisins, il y a environ un quart des valeurs.</p>
<div class="def">Dans une <b>boîte à moustaches</b> : les extrémités des moustaches sont le <b>minimum</b> et le <b>maximum</b> ; la boîte va du premier quartile ${sub(1)} au troisième quartile ${sub(3)} ; le trait épais est la <b>médiane</b>. Au moins 25 % des valeurs sont à gauche de ${sub(1)}, au moins 50 % à gauche de la médiane, au moins 75 % à gauche de ${sub(3)}.</div>
${boxPlot([f], { ...o, show: true })}
${methode('Lis chaque repère sur l\'axe en regardant la graduation (un petit trait ne vaut pas toujours 1).', 'Étendue = max − min (de bout en bout) ; écart interquartile = ' + sub(3) + ' − ' + sub(1) + ' (largeur de la boîte).', '« Au moins p % ont une valeur inférieure ou égale à x » : x est le repère qui a p % des valeurs à sa gauche (25 % : ' + sub(1) + ', 50 % : médiane, 75 % : ' + sub(3) + ').', 'Avec « supérieure ou égale », on regarde à droite.')}
${ex('Exemple 1 : lis la médiane sur la boîte ci-dessus.', 'Le trait épais est au-dessus du nombre <b>12</b> de l\'axe.')}
${ex('Exemple 2 : quelle est l\'étendue ?', 'Maximum : 19 ; minimum : 4. Étendue : 19 − 4 = <b>15</b>.')}
${ex('Exemple 3 : quel est l\'écart interquartile ?', `${sub(3)} = 15 et ${sub(1)} = 9. Écart interquartile : 15 − 9 = <b>6</b>.`)}
${ex('Exemple 4 : au moins 75 % des élèves ont une note inférieure ou égale à … (complète avec la plus petite valeur possible).', `Trois quarts des notes sont à gauche de ${sub(3)} : <b>15</b>. (Et au moins 50 % ont une note supérieure ou égale à la médiane, <b>12</b>.)`)}
${ex('Exemple 5 : peut-on affirmer qu\'au moins 75 % des élèves ont une note supérieure ou égale à 9 ? Et au moins 50 % une note supérieure ou égale à 15 ?', `À droite de ${sub(1)} (9) il y a au moins 75 % des valeurs : <b>oui</b>, c'est certain. Mais à droite de 15 il n'y en a que 25 % : pour 50 %, il faut aller jusqu'à la médiane : <b>non</b>, on ne peut pas l'affirmer.`)}
${warn('La médiane n\'est pas au milieu de la boîte : elle peut être plus près d\'un bord.', 'La largeur de la boîte ne dit pas la longueur des moustaches : l\'étendue va de bout en bout.', 'La boîte ne contient pas « tout » : elle contient au moins la moitié des valeurs, les quartiles ne sont pas les extrémités.')}
${retenir('minimum, ' + sub(1) + ', médiane, ' + sub(3) + ', maximum : entre deux repères voisins, il y a environ un quart des valeurs.')}`;
}

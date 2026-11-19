// Niveaux 10 à 12 : construire une boîte à moustaches, comparer deux séries, valeurs extrêmes et synthèse.
import { ri, pick, shuffle, prenom, chance } from '../../engine/util/rand.js';
import { approx, decimals } from '../../engine/util/arith.js';
import { F } from '../../engine/util/fmt.js';
import { tiles, tableHtml, parseBars, boxPlot, readBox, axeAuto } from './draw.js';
import { bars } from './n1.js';
import { boite } from './n3.js';
import { choiceCheck } from '../../engine/answers/checks.js';
import { sum, cumul, expand, tableau, TABLES, SERIES, AXES, BOXC, cinq, serie, resume, valeurDeRang, quantCount, medCount, cinqCount, rangQ, mean, asc, range } from './stat.js';
import { numCheck, multiCheck, big, COMMA, ex, warn, retenir, methode, fv, K } from './util.js';
const M = K;
const list = a => a.map(M).join(' ; ');

const sub = k => `Q<sub>${k}</sub>`;
const nth = r => `${r}<sup>e</sup>`;
const LET = ['A', 'B', 'C'];
/** axe « agréable » pour des valeurs : graduations toutes les lab, au plus une douzaine de nombres */
function axeNice(vals) {
  const mn = Math.min(...vals), mx = Math.max(...vals), span = mx - mn;
  const lab = [1, 2, 5, 10, 20, 50, 100, 200, 500, 1000].find(l => span / l <= 12) || 1000;
  let lo = Math.floor(mn / lab) * lab; if (lo === mn) lo -= lab; if (mn >= 0 && lo < 0) lo = 0;
  let hi = Math.ceil(mx / lab) * lab; if (hi === mx) hi += lab;
  return { lo, hi, g: lab <= 5 ? 1 : lab, lab: lab <= 5 ? lab : lab };
}
const five = r => ({ min: r.min, q1: r.q1, med: r.med, q3: r.q3, max: r.max });

/* ===================================================================== 10. construire une boîte à moustaches */
/** trois boîtes dont une seule est juste : on modifie un repère (q1, med ou q3) pour fabriquer chaque fausse boîte */
function distracteurs(f, s, step) {
  const out = [], seen = new Set([JSON.stringify(f)]);
  let t = 0;
  while (out.length < 2 && t++ < 200) {
    const key = pick(['q1', 'med', 'q3', 'q1', 'q3']), g = { ...f };
    const cand = s.filter(x => Math.abs(x - f[key]) >= step);
    if (!cand.length) continue;
    g[key] = pick(cand);
    const ok = g.min <= g.q1 && g.q1 <= g.med && g.med <= g.q3 && g.q3 <= g.max && g.q1 < g.q3;
    const sig = JSON.stringify(g);
    if (ok && !seen.has(sig)) { seen.add(sig); out.push(g); }
  }
  if (out.length < 2) { // repli : décale le maximum ou le minimum
    const g1 = { ...f, max: f.max + step }, g2 = { ...f, min: Math.max(0, f.min - step) };
    return [g1, g2].filter(g => JSON.stringify(g) !== JSON.stringify(f));
  }
  return out;
}
export function L10(d) {
  const form = d < 1 ? 'cinqS' : d < 2 ? 'cinqU' : d < 3 ? 'choixL' : d < 4 ? pick(['cinqT', 'choixL']) : pick(['cinqT', 'choixT', 'cinqU']);
  const isT = form.endsWith('T');
  let raw, visual, intro, sorted = false, C, cumTxt = '';
  const S = pick(SERIES);
  if (isT) {
    C = pick(TABLES); const k = ri(5, 6), N = ri(20, 36), T = tableau(C, k, N);
    raw = expand(T.vals, T.effs); visual = bars(T, T.effs); cumTxt = cumul(T.effs).join(' ; ');
    intro = `<b>${C.titre}</b>${tableHtml([C.h1, T.vals], [{ h: 'Effectif', cells: T.effs }])}`; C = { ...C, axe: C.h1, u: C.u };
  } else {
    const n = form === 'cinqS' ? pick([8, 12]) : ri(9, d < 4 ? 13 : 15);
    sorted = form === 'cinqS';
    const v = serie(S, n, { strict: true }); raw = sorted ? asc(v) : shuffle(v);
    if (!sorted) { let t = 0; while (raw.every((x, i) => x === asc(raw)[i]) && t++ < 20) raw = shuffle(raw); }
    visual = tiles(raw, { label: S.axe });
    intro = `${S.intro(raw.length, prenom())} ${sorted ? '(Les valeurs sont rangées dans l\'ordre croissant.)' : ''}${big(list(raw))}`;
    C = { axe: S.axe, u: S.u };
  }
  const r = resume(raw), s = r.s, n = s.length, f = five(r), axe = axeAuto(s, { g: 1 }), opt = { ...axe, axe: C.axe };
  const k1 = rangQ(n, 1), k3 = rangQ(n, 3);
  const afterTiles = isT ? '' : tiles(s, { hl: [0, k1 - 1, n % 2 ? (n - 1) / 2 : n / 2 - 1, k3 - 1, n - 1], label: 'rangée : min, Q1, médiane, Q3, max' });
  if (form.startsWith('cinq')) {
    const E = [r.min, r.q1, r.med, r.q3, r.max];
    const q1w = s[Math.max(0, Math.floor(n / 4) - 1)], q3w = s[Math.max(0, Math.floor(3 * n / 4) - 1)];
    return { type: 'nums', keys: COMMA, tpl: `min : {0} &nbsp; ${sub(1)} : {1} &nbsp; médiane : {2} &nbsp; ${sub(3)} : {3} &nbsp; max : {4}`, labels: ['minimum', 'premier quartile', 'médiane', 'troisième quartile', 'maximum'],
      check: multiCheck(E, [[], [[q1w, 'Presque : quand le calcul ne tombe pas juste, on prend le rang <b>supérieur</b> pour un quartile.']], [[mean(s), 'Ça, c\'est la moyenne : la médiane est la valeur du milieu de la série rangée.']], [[q3w, 'Presque : quand le calcul ne tombe pas juste, on prend le rang <b>supérieur</b> pour un quartile.']], []]),
      html: `${intro}Donne les <b>cinq nombres</b> qui permettent de tracer la boîte à moustaches de cette série (dans l'ordre).`, visual,
      afterVisual: afterTiles + boxPlot([f], { ...opt, show: true }),
      verify: E2 => { const c = cinqCount(raw); return c.every((x, i) => approx(x, E2[i])); },
      hint: `${sorted ? '' : isT ? 'Les valeurs sont déjà rangées par le tableau. ' : 'Range d\'abord les valeurs. '}n = ${n} : minimum et maximum sont aux deux bouts ; médiane : ${n % 2 ? `rang ${(n + 1) / 2}` : `moyenne des rangs ${n / 2} et ${n / 2 + 1}`} ; ${sub(1)} : rang ${M(n / 4)} arrondi au supérieur ; ${sub(3)} : rang ${M(3 * n / 4)} arrondi au supérieur.${isT ? ' Utilise les effectifs cumulés.' : ''}`,
      solution: `${isT ? `Effectifs cumulés : ${cumTxt}.<br>` : `Rangée : ${list(s)}.<br>`}min = <b>${M(r.min)}</b> ; ${sub(1)} : rang ${k1}, <b>${M(r.q1)}</b> ; médiane = <b>${M(r.med)}</b> ; ${sub(3)} : rang ${k3}, <b>${M(r.q3)}</b> ; max = <b>${M(r.max)}</b>.` };
  }
  // choix de la boîte
  const wrong = distracteurs(f, s, Math.max(2, Math.round((r.max - r.min) / 6))), all = shuffle([{ f, ok: true }, ...wrong.map(g => ({ f: g, ok: false }))]);
  const axe2 = axeAuto(all.flatMap(o => Object.values(o.f)), { g: 1 }), opt2 = { ...axe2, axe: C.axe };
  const opts = all.map((o, i) => ({ v: LET[i], l: `<b>${LET[i]}</b> ${boxPlot([o.f], { ...opt2, width: 380 })}`, ok: o.ok }));
  const good = opts.find(o => o.ok).v;
  return { type: 'choice', opts: opts.map(({ v, l }) => ({ v, l })), check: choiceCheck(good, { msg: () => 'Calcule d\'abord la médiane et les quartiles de la série rangée, puis compare-les avec les repères de chaque boîte.' }),
    html: `${intro}Parmi ces trois boîtes à moustaches, laquelle représente cette série&nbsp;?`, visual, afterVisual: afterTiles,
    verify: E => { const c = cinqCount(raw), hit = opts.filter(o => { const b = readBox(o.l)[0]; return [b.min, b.q1, b.med, b.q3, b.max].every((x, i) => approx(x, c[i])); }); return hit.length === 1 && hit[0].v === E; },
    hint: `${sorted ? '' : isT ? 'Le tableau est déjà rangé. ' : 'Range d\'abord les valeurs. '}n = ${n} : médiane ${n % 2 ? `de rang ${(n + 1) / 2}` : `à mi-chemin des rangs ${n / 2} et ${n / 2 + 1}`}, ${sub(1)} de rang ${rangQ(n, 1)}, ${sub(3)} de rang ${rangQ(n, 3)}. Les valeurs extrêmes sont ${M(r.min)} et ${M(r.max)}. Vérifie ces cinq nombres sur chaque boîte.`,
    solution: `${isT ? `Effectifs cumulés : ${cumTxt}.<br>` : `Rangée : ${list(s)}.<br>`}min ${M(r.min)} ; ${sub(1)} ${M(r.q1)} ; médiane ${M(r.med)} ; ${sub(3)} ${M(r.q3)} ; max ${M(r.max)} : c'est la boîte <b>${good}</b>.` };
}
export function C10() {
  const s = [6, 8, 9, 11, 12, 14, 15, 18], f = { min: 6, q1: 8, med: 11.5, q3: 14, max: 18 }, o = { lo: 4, hi: 20, g: 1, lab: 2, axe: 'note (sur 20)' };
  const f2 = { ...f, q1: 12 }, f3 = { ...f, med: 9 };
  return `<h2>10. Construire une boîte à moustaches</h2>
<p class="intro">Pour tracer une boîte à moustaches, il faut cinq nombres : le minimum, ${sub(1)}, la médiane, ${sub(3)} et le maximum. On les calcule sur la série <b>rangée</b>.</p>
<div class="def">On trace un axe gradué, puis : une moustache du <b>minimum</b> à ${sub(1)}, une <b>boîte</b> de ${sub(1)} à ${sub(3)} avec un trait épais à la <b>médiane</b>, une moustache de ${sub(3)} au <b>maximum</b>.</div>
${tiles(s, { hl: [0, 1, 3, 5, 7], label: 'min, Q1, médiane (entre 11 et 12), Q3, max' })}
${boxPlot([f], { ...o, show: true })}
${methode('Range les valeurs (un tableau d\'effectifs est déjà rangé : utilise les effectifs cumulés).', 'Repère le minimum et le maximum.', 'Calcule la médiane, puis ' + sub(1) + ' (rang n ÷ 4) et ' + sub(3) + ' (rang 3n ÷ 4), arrondis au rang supérieur.', 'Pour reconnaître la bonne boîte parmi plusieurs : compare chacun des cinq repères avec tes cinq nombres.')}
${ex('Exemple 1 : valeurs rangées 6 ; 8 ; 9 ; 11 ; 12 ; 14 ; 15 ; 18. Donne les cinq nombres.', `n = 8 : min = <b>6</b> ; ${sub(1)} : 8 ÷ 4 = 2, rang 2, <b>8</b> ; médiane : (11 + 12) ÷ 2 = <b>11,5</b> ; ${sub(3)} : 8 ÷ 4 × 3 = 6, rang 6, <b>14</b> ; max = <b>18</b>.`)}
${ex('Exemple 2 : valeurs dans le désordre : 17 ; 9 ; 12 ; 20 ; 14 ; 8 ; 15 ; 11 ; 18 ; 13. Donne les cinq nombres.', `On range : 8 ; 9 ; 11 ; 12 ; 13 ; 14 ; 15 ; 17 ; 18 ; 20. n = 10 : min = <b>8</b> ; ${sub(1)} : rang 3, <b>11</b> ; médiane : (13 + 14) ÷ 2 = <b>13,5</b> ; ${sub(3)} : rang 8, <b>17</b> ; max = <b>20</b>.`)}
${ex('Exemple 3 : parmi trois boîtes, laquelle représente la série 6 ; 8 ; 9 ; 11 ; 12 ; 14 ; 15 ; 18 ?', `Les cinq nombres sont 6 ; 8 ; 11,5 ; 14 ; 18. La boîte <b>A</b> les respecte tous. Dans la boîte B, ${sub(1)} est trop à droite (12) ; dans la boîte C, la médiane est trop à gauche (9).${boxPlot([f], { ...o, width: 380 })}${boxPlot([f2], { ...o, width: 380 })}${boxPlot([f3], { ...o, width: 380 })}`)}
${ex('Exemple 4 : cinq nombres à partir d\'un tableau d\'effectifs.', `${tableHtml(['Note (sur 20)', [8, 9, 10, 11, 12]], [{ h: 'Effectif', cells: [2, 5, 7, 6, 4] }, { h: 'Effectif cumulé croissant', cells: [2, 7, 14, 20, 24] }])}N = 24 : min = <b>8</b>, max = <b>12</b>. ${sub(1)} : rang 6, <b>9</b> ; ${sub(3)} : rang 18, <b>11</b> ; médiane : rangs 12 et 13, tous deux à 10, soit <b>10</b>.`)}
${ex('Exemple 5 : choisir la bonne boîte à partir d\'un tableau d\'effectifs (même tableau).', `Les cinq nombres sont 8 ; 9 ; 10 ; 11 ; 12 : on cherche la boîte dont la moustache de gauche s'arrête à 8, la boîte commence à 9, le trait épais est à 10, la boîte finit à 11 et la moustache de droite s'arrête à 12.`)}
${warn('Calcule médiane et quartiles sur la série <b>rangée</b>.', 'Arrondis au rang <b>supérieur</b> quand n ÷ 4 n\'est pas entier.', 'La moustache va jusqu\'au minimum et au maximum (pas plus loin) ; la boîte ne commence pas au minimum.')}
${retenir('boîte à moustaches = minimum, ' + sub(1) + ', médiane, ' + sub(3) + ', maximum, tracés sur un axe gradué.')}`;
}

/* ===================================================================== 11. comparer deux séries */
export function L11(d) {
  const form = d < 1 ? 'med' : d < 2 ? pick(['med', 'disp']) : d < 3 ? pick(['disp', 'diffmed']) : d < 4 ? pick(['diffmed', 'moy']) : pick(['moy', 'reg', 'diffmed', 'disp']);
  if (form === 'moy' || form === 'reg') {
    const S = pick(SERIES);
    let n = form === 'moy' ? pick([4, 5, 8]) : 8, a, b, ra, rb, t = 0;
    do {
      a = serie(S, n); b = serie(S, n); ra = resume(a); rb = resume(b); t++;
    } while (t < 400 && (form === 'moy' ? decimals(ra.mean) > 2 || decimals(rb.mean) > 2 || approx(ra.mean, rb.mean) : Math.abs(ra.iqr - rb.iqr) < 3 || ra.q1 === ra.q3 || rb.q1 === rb.q3));
    if (t >= 400) { n = 8; a = [10, 12, 13, 15, 16, 18, 19, 21]; b = [4, 9, 12, 15, 16, 20, 24, 30]; ra = resume(a); rb = resume(b); }
    const lists = `Série A : ${list(a)}<br>Série B : ${list(b)}`;
    const head = `Deux séries de ${S.pl}${S.u ? ` (en ${S.u.trim()})` : ''} :${big(lists)}`;
    const visual = tiles(a, { label: 'série A' }) + tiles(b, { label: 'série B' });
    if (form === 'moy') {
      return { type: 'nums', keys: COMMA, tpl: `Moyenne de A : {0}${S.u} &nbsp; Moyenne de B : {1}${S.u}`, labels: ['moyenne de A', 'moyenne de B'], check: multiCheck([ra.mean, rb.mean], [[[sum(a), `${M(sum(a))} est la somme : divise-la par le nombre de valeurs (${n}).`], [ra.med, 'Ça, c\'est la médiane : la moyenne est la somme divisée par le nombre de valeurs.']], [[sum(b), `${M(sum(b))} est la somme : divise-la par le nombre de valeurs (${n}).`], [rb.med, 'Ça, c\'est la médiane : la moyenne est la somme divisée par le nombre de valeurs.']]]),
        html: `${head}Calcule la <b>moyenne</b> de chaque série.`, visual,
        verify: E => approx(a.reduce((s, x) => s + x, 0) / a.length, E[0]) && approx(b.reduce((s, x) => s + x, 0) / b.length, E[1]),
        hint: `Série A : additionne ses ${n} valeurs (${a.join(' + ')}) puis divise par ${n}. Série B : ${b.join(' + ')}, puis divise par ${n}.`,
        solution: `A : ${a.join(' + ')} = ${sum(a)} ; ${sum(a)} ÷ ${n} = <b>${M(ra.mean)}</b>.<br>B : ${b.join(' + ')} = ${sum(b)} ; ${sum(b)} ÷ ${n} = <b>${M(rb.mean)}</b>.` };
    }
    const win = ra.iqr < rb.iqr ? 'A' : 'B';
    return { type: 'choice', opts: [{ v: 'A', l: 'La série A' }, { v: 'B', l: 'La série B' }], check: choiceCheck(win, { msg: () => 'Calcule l\'écart interquartile (Q<sub>3</sub> − Q<sub>1</sub>) de chaque série : la plus régulière est celle où il est le plus <b>petit</b>.' }),
      html: `${head}Quelle série est la plus <b>régulière</b>, c'est-à-dire la moins dispersée (écart interquartile le plus petit)&nbsp;?`, visual,
      afterVisual: boxPlot([{ name: 'Série A', ...five(ra) }, { name: 'Série B', ...five(rb) }], { ...axeAuto([ra.min, rb.min, ra.max, rb.max], { g: 1 }), axe: S.axe, show: true }),
      verify: E => { const ia = quantCount(a, 75) - quantCount(a, 25), ib = quantCount(b, 75) - quantCount(b, 25); return (ia < ib ? 'A' : 'B') === E; },
      hint: `Pour chaque série : range les valeurs, n = ${n} donc ${sub(1)} est de rang ${rangQ(n, 1)} et ${sub(3)} de rang ${rangQ(n, 3)}. Calcule ${sub(3)} − ${sub(1)} pour A et pour B, puis compare.`,
      solution: `A : ${list(ra.s)} ; ${sub(1)} = ${M(ra.q1)}, ${sub(3)} = ${M(ra.q3)}, écart ${M(ra.iqr)}.<br>B : ${list(rb.s)} ; ${sub(1)} = ${M(rb.q1)}, ${sub(3)} = ${M(rb.q3)}, écart ${M(rb.iqr)}.<br>Le plus petit écart est celui de la série <b>${win}</b> : elle est plus régulière.` };
  }
  // deux boîtes sur le même axe
  const { A, C } = boite(Math.max(d, 1)), opt = { lo: A.lo, hi: A.hi, g: A.g, lab: A.lab, axe: C.axe }, step = Math.max(2 * A.g, 2);
  let fa, fb, t = 0;
  do { fa = cinq(A); fb = cinq(A); t++; } while (t < 500 && (form === 'med' ? Math.abs(fa.med - fb.med) < step : form === 'disp' ? Math.abs((fa.q3 - fa.q1) - (fb.q3 - fb.q1)) < step : fa.med - fb.med < A.g));
  const items = [{ name: 'Série A', ...fa }, { name: 'Série B', ...fb }];
  const visual = boxPlot(items, opt), after = boxPlot(items, { ...opt, show: true });
  const titre = `<b>${C.titre}</b> : deux séries A et B.`;
  const rd = () => readBox(visual);
  if (form === 'med' || form === 'disp') {
    const med = form === 'med', win = med ? (fa.med > fb.med ? 'A' : 'B') : ((fa.q3 - fa.q1) > (fb.q3 - fb.q1) ? 'A' : 'B');
    return { type: 'choice', opts: [{ v: 'A', l: 'La série A' }, { v: 'B', l: 'La série B' }], check: choiceCheck(win, { msg: () => (med ? 'La médiane est le trait épais : la plus grande est celle qui est le plus à droite sur l\'axe.' : 'L\'écart interquartile est la largeur de la <b>boîte</b> (pas des moustaches) : la plus dispersée a la boîte la plus large.') }),
      html: `${titre}<br>${med ? 'Quelle série a la <b>médiane la plus grande</b>&nbsp;?' : 'Quelle série est la plus <b>dispersée</b> au sens de l\'écart interquartile (boîte la plus large)&nbsp;?'}`, visual, afterVisual: after, replaceVisual: true,
      verify: E => { const b = rd(); return (med ? (b[0].med > b[1].med ? 'A' : 'B') : ((b[0].q3 - b[0].q1) > (b[1].q3 - b[1].q1) ? 'A' : 'B')) === E; },
      hint: med ? 'Compare la position du trait épais (la médiane) dans chacune des deux boîtes : sur un même axe, le plus à droite est le plus grand.' : 'L\'écart interquartile est la largeur de la boîte, de Q1 à Q3. Compare la largeur de la boîte de A avec celle de la boîte de B sur le même axe.',
      solution: med ? `Médiane de A : ${M(fa.med)}, médiane de B : ${M(fb.med)}. La plus grande est celle de la série <b>${win}</b>.` : `Série A : ${M(fa.q3)} − ${M(fa.q1)} = ${M(fa.q3 - fa.q1)} ; série B : ${M(fb.q3)} − ${M(fb.q1)} = ${M(fb.q3 - fb.q1)}. La plus large boîte est celle de la série <b>${win}</b>.` };
  }
  return { type: 'nums', keys: COMMA, tpl: `Différence : {0}${C.u}`, check: numCheck(fa.med - fb.med, [[fa.med, `${M(fa.med)} est la médiane de A : il faut aussi lire celle de B et soustraire.`], [fa.med + fb.med, 'Il faut <b>soustraire</b> les deux médianes, pas les additionner.'], [(fa.q3 - fa.q1) - (fb.q3 - fb.q1), 'Ce sont les écarts interquartiles qui sont comparés ici : il faut comparer les <b>médianes</b> (traits épais).']]),
    html: `${titre}<br>De combien la médiane de la série A dépasse-t-elle celle de la série B&nbsp;?`, visual, afterVisual: after, replaceVisual: true,
    verify: E => { const b = rd(); return approx(b[0].med - b[1].med, E[0]); },
    hint: `Lis la médiane de la série A (trait épais de la boîte A) et celle de la série B (trait épais de la boîte B) sur l'axe, puis soustrais la plus petite de la plus grande.${A.g > 1 ? ` Un petit trait de l'axe vaut ${A.g}.` : ''}`,
    solution: `Médiane de A : ${M(fa.med)} ; médiane de B : ${M(fb.med)}. Différence : ${M(fa.med)} − ${M(fb.med)} = <b>${M(fa.med - fb.med)}</b>${C.u}.` };
}
export function C11() {
  const fa = { min: 6, q1: 10, med: 13, q3: 16, max: 19 }, fb = { min: 3, q1: 8, med: 12, q3: 18, max: 20 }, o = { lo: 2, hi: 22, g: 1, lab: 2, axe: 'note (sur 20)' };
  const a = [10, 12, 13, 15, 16, 18, 19, 21], b = [4, 9, 12, 15, 16, 20, 24, 30];
  return `<h2>11. Comparer deux séries</h2>
<p class="intro">Pour comparer deux séries, on compare un indicateur de <b>position</b> (moyenne ou médiane) et un indicateur de <b>dispersion</b> (étendue ou écart interquartile).</p>
<div class="def">La <b>médiane</b> et la <b>moyenne</b> disent où se situe la série ; l'<b>étendue</b> et l'<b>écart interquartile</b> disent si elle est resserrée ou étalée. Avec deux boîtes sur le <b>même axe</b>, on compare la place des traits épais (médianes) et la largeur des boîtes (écarts interquartiles).</div>
${boxPlot([{ name: 'Série A', ...fa }, { name: 'Série B', ...fb }], { ...o, show: true })}
${methode('Mets les deux séries sur le même axe (ou lis les deux boîtes sur le même axe).', 'Position : compare les médianes (traits épais) ou calcule les moyennes.', 'Dispersion : compare les largeurs des boîtes (écarts interquartiles) ou les étendues.', 'Conclus avec une phrase : « La série … a la médiane la plus grande », « la série … est la plus régulière ».')}
${ex('Exemple 1 : quelle série a la médiane la plus grande (boîtes ci-dessus) ?', 'Médiane de A : 13 ; médiane de B : 12. La plus grande est celle de la série <b>A</b>.')}
${ex('Exemple 2 : quelle série est la plus dispersée au sens de l\'écart interquartile ?', 'Écart de A : 16 − 10 = 6 ; écart de B : 18 − 8 = 10. La boîte la plus large est celle de la série <b>B</b>.')}
${ex('Exemple 3 : de combien la médiane de A dépasse-t-elle celle de B ?', '13 − 12 = <b>1</b>.')}
${ex('Exemple 4 : calcule la moyenne de chaque série. A : 10 ; 12 ; 13 ; 15 ; 16 ; 18 ; 19 ; 21. B : 4 ; 9 ; 12 ; 15 ; 16 ; 20 ; 24 ; 30.', `A : 124 ÷ 8 = <b>15,5</b>. B : 130 ÷ 8 = <b>16,25</b>.`)}
${tiles(a, { label: 'série A' })}${tiles(b, { label: 'série B' })}
${ex('Exemple 5 : quelle série est la plus régulière (écart interquartile le plus petit), avec les listes de l\'exemple 4 ?', `n = 8 : ${sub(1)} est de rang 2 et ${sub(3)} de rang 6. A : ${sub(1)} = 12, ${sub(3)} = 18, écart 6. B : ${sub(1)} = 9, ${sub(3)} = 20, écart 11. La plus petite dispersion est celle de la série <b>A</b> : elle est plus régulière.`)}
${warn('Il faut des boîtes sur le <b>même axe</b> pour comparer les positions.', 'Une boîte plus étroite ne veut pas dire des valeurs plus petites : elle veut dire des valeurs plus resserrées.', 'Les moustaches (étendue) et la boîte (écart interquartile) ne disent pas la même chose.')}
${retenir('position : médiane ou moyenne ; dispersion : étendue ou écart interquartile.')}`;
}

/* ===================================================================== 12. valeurs extrêmes et synthèse */
const EXT = [
  { id: 'sal', n: [5, 7], lo: 1400, hi: 2100, st: 50, u: ' €', axe: 'salaire mensuel (€)', ex: () => ri(55, 90) * 100, mode: 'haut',
    intro: n => `Voici les salaires mensuels (en €) de ${n} employés d'une petite entreprise.`, extra: x => `Le directeur, qui gagne ${M(x)} €, est ajouté à la liste.`, typ: 'le salaire d\'un employé', incl: 'La liste comprend le salaire du directeur.' },
  { id: 'note', n: [5, 7], lo: 11, hi: 16, st: 1, u: '', axe: 'note (sur 20)', ex: () => 0, mode: 'bas',
    intro: (n, p) => `Voici les notes (sur 20) de ${p} à ses ${n} premiers contrôles de maths.`, extra: x => `Au contrôle suivant, l'élève est absent : on ajoute la note ${M(x)}.`, typ: 'le niveau habituel de l\'élève', incl: '' },
  { id: 'trajet', n: [5, 7], lo: 12, hi: 25, st: 1, u: ' min', axe: 'durée (min)', ex: () => ri(7, 11) * 10, mode: 'haut',
    intro: (n, p) => `Voici la durée (en minutes) du trajet de ${p} jusqu'au collège pendant ${n} jours.`, extra: x => `Un jour de grève de bus, le trajet dure ${M(x)} min : on l'ajoute à la liste.`, typ: 'la durée habituelle du trajet', incl: 'La liste comprend un jour de grève de bus.' },
];
/** série de base de n valeurs du contexte E (multiples du pas), puis valeur extrême x telle que la nouvelle moyenne ait au plus 1 décimale */
function baseEt(E, n, needMeanOk = true) {
  for (let t = 0; t < 400; t++) {
    const v = Array.from({ length: n }, () => E.lo + E.st * ri(0, Math.round((E.hi - E.lo) / E.st)));
    const r = resume(v); if (r.min === r.max) continue;
    for (let k = 0; k < 60; k++) {
      const x = E.ex(), m = (sum(v) + x) / (n + 1);
      if (!needMeanOk || (decimals(m) <= 1 && decimals(r.mean) <= 1)) return { v, x };
    }
  }
  return { v: Array.from({ length: n }, (_, i) => E.lo + E.st * i), x: E.ex() };
}
export function L12(d) {
  const form = d < 1 ? 'newMean' : d < 2 ? pick(['newMean', 'newMed']) : d < 3 ? pick(['newMed', 'choose']) : d < 4 ? pick(['choose', 'typique']) : pick(['typique', 'synth', 'newMed']);
  const E = form === 'typique' ? pick(EXT.filter(e => e.mode === 'haut')) : pick(EXT);
  if (form === 'synth') {
    const C = pick(TABLES); let T, raw, r, t = 0;
    do { T = tableau(C, ri(5, 6), ri(16, 40)); raw = expand(T.vals, T.effs); r = resume(raw); t++; } while (t < 300 && decimals(r.mean) > 2);
    const visual = bars(T, T.effs), { vals, effs } = T, N = T.N, c = cumul(effs);
    return { type: 'nums', keys: COMMA, tpl: `Moyenne : {0}${C.u} &nbsp; Médiane : {1}${C.u} &nbsp; Étendue : {2}${C.u}`, labels: ['moyenne', 'médiane', 'étendue'],
      check: multiCheck([r.mean, r.med, r.etendue], [[[(vals[0] + vals[vals.length - 1]) / 2, 'Il faut tenir compte des <b>effectifs</b> : chaque valeur compte autant de fois que son effectif.'], [r.med, 'Ça, c\'est la médiane : la moyenne s\'obtient avec somme des (valeur × effectif) ÷ N.']], [[r.mean, 'Ça, c\'est la moyenne : la médiane se trouve avec les rangs et les effectifs cumulés.']], [[vals[vals.length - 1], 'Étendue = plus grande valeur − plus petite valeur.']]]),
      html: `<b>${C.titre}</b>${tableHtml([C.h1, vals], [{ h: 'Effectif', cells: effs }])}Donne la <b>moyenne</b>, la <b>médiane</b> et l'<b>étendue</b> de cette série.`, visual,
      verify: E2 => { const b = parseBars(visual).map(Math.round), s = expand(vals, b); return approx(s.reduce((a, x) => a + x, 0) / s.length, E2[0]) && approx(medCount(s), E2[1]) && E2[2] === Math.max(...s) - Math.min(...s); },
      hint: `Moyenne : somme des (valeur × effectif) ÷ N, avec N = ${effs.join(' + ')}. Médiane : N ${N % 2 ? 'impair, rang ' + (N + 1) / 2 : 'pair, rangs ' + N / 2 + ' et ' + (N / 2 + 1)}, avec les effectifs cumulés. Étendue : ${M(vals[vals.length - 1])} − ${M(vals[0])}.`,
      solution: `N = ${N}. Somme : ${vals.map((x, i) => `${M(x)} × ${effs[i]}`).join(' + ')} = ${M(sum(raw))} ; moyenne : ${M(sum(raw))} ÷ ${N} = <b>${M(r.mean)}</b>.<br>Cumulés : ${c.join(' ; ')} : médiane = <b>${M(r.med)}</b>. Étendue : ${M(vals[vals.length - 1])} − ${M(vals[0])} = <b>${M(r.etendue)}</b>.` };
  }
  const n = pick(E.n), p = prenom();
  const { v, x } = baseEt(E, n, form !== 'typique');
  const r0 = resume(v), all = [...v, x], r1 = resume(all), lowMode = E.mode === 'bas';
  const intro = `${E.intro(n, p)}${big(list(v))}${E.extra(x)}`;
  const visual = tiles(v.map(M), { label: E.axe }) + tiles(['…', M(x)], { hl: [1], label: 'valeur ajoutée' });
  const axe = axeNice(all), boxes = boxPlot([{ name: 'Avant', ...five(r0) }, { name: 'Après', ...five(r1) }], { ...axe, axe: E.axe, show: false });
  if (form === 'newMean') {
    const X = r1.mean;
    return { type: 'nums', keys: COMMA, tpl: `Nouvelle moyenne : {0}${E.u}`, check: numCheck(X, [[r0.mean, 'C\'est l\'ancienne moyenne : il faut recalculer avec la valeur ajoutée (une valeur de plus).'], [(sum(v) + x) / n, `Il y a maintenant <b>${n + 1}</b> valeurs : divise par ${n + 1}.`], [sum(v) + x, `${M(sum(v) + x)} est la somme : divise-la par le nombre de valeurs (${n + 1}).`]]),
      html: `${intro}<br>Quelle est la <b>nouvelle moyenne</b> (avec la valeur ajoutée)&nbsp;?`, visual,
      verify: E2 => approx([...v, x].reduce((a, b) => a + b, 0) / (v.length + 1), E2[0]),
      hint: `Additionne les ${n} valeurs de la liste et la valeur ajoutée ${M(x)} : tu as maintenant ${n + 1} valeurs. Divise la nouvelle somme par ${n + 1}.`,
      solution: `Somme : ${v.join(' + ')} + ${M(x)} = ${M(sum(all))}. ${M(sum(all))} ÷ ${n + 1} = <b>${M(X)}</b>${E.u}.<br>(Avant, la moyenne valait ${M(r0.mean)}${E.u} : la valeur extrême l'a ${lowMode ? 'fait baisser' : 'fait monter'} de ${M(Math.abs(X - r0.mean))}.)` };
  }
  if (form === 'newMed') {
    const X = r1.med, k = (n + 1) / 2, s1 = r1.s;
    return { type: 'nums', keys: COMMA, tpl: `Nouvelle médiane : {0}${E.u}`, check: numCheck(X, [[r0.med, 'C\'est l\'ancienne médiane : avec une valeur de plus, il faut ranger de nouveau et prendre le milieu de la nouvelle liste.'], [r1.mean, 'Ça, c\'est la nouvelle moyenne : demande-toi plutôt la valeur du milieu de la liste rangée.'], [s1[k - 1], `Il y a maintenant <b>${n + 1}</b> valeurs (nombre pair) : la médiane est à mi-chemin entre deux valeurs du milieu.`], [s1[k], `Il y a maintenant <b>${n + 1}</b> valeurs (nombre pair) : la médiane est à mi-chemin entre deux valeurs du milieu.`]]),
      html: `${intro}<br>Quelle est la <b>nouvelle médiane</b> (avec la valeur ajoutée)&nbsp;?`, visual,
      verify: E2 => approx(medCount(all), E2[0]),
      hint: `Range les ${n + 1} valeurs (liste et valeur ajoutée ${M(x)}). Avec ${n + 1} valeurs (nombre pair), la médiane est la moyenne des valeurs de rang ${k} et ${k + 1}.`,
      solution: `Rangée : ${list(s1)}.<br>La ${nth(k)} valeur est ${M(s1[k - 1])}, la ${nth(k + 1)} est ${M(s1[k])} : médiane = (${M(s1[k - 1])} + ${M(s1[k])}) ÷ 2 = <b>${M(X)}</b>${E.u}.<br>(Avant, la médiane valait ${M(r0.med)}${E.u} : elle a très peu bougé.)` };
  }
  if (form === 'choose') {
    const dm = Math.abs(r1.mean - r0.mean), dd = Math.abs(r1.med - r0.med), win = dm > dd ? 'moy' : dm < dd ? 'med' : 'egal';
    return { type: 'choice', opts: [{ v: 'moy', l: 'La moyenne' }, { v: 'med', l: 'La médiane' }, { v: 'egal', l: 'Elles changent autant' }], check: choiceCheck(win, { msg: () => 'Calcule la moyenne et la médiane avant, puis après l\'ajout, et compare les deux variations.' }),
      html: `${intro}<br>Avant l'ajout, la moyenne valait ${M(r0.mean)}${E.u} et la médiane ${M(r0.med)}${E.u}. Après l'ajout de la valeur ${M(x)}, <b>laquelle des deux change le plus</b>&nbsp;?`, visual, afterVisual: boxes, replaceVisual: false,
      verify: E2 => { const m0 = v.reduce((a, b) => a + b, 0) / v.length, m1 = all.reduce((a, b) => a + b, 0) / all.length, c = Math.abs(m1 - m0) - Math.abs(medCount(all) - medCount(v)); return (c > 1e-9 ? 'moy' : c < -1e-9 ? 'med' : 'egal') === E2; },
      hint: `Calcule la nouvelle moyenne (somme de ${n + 1} valeurs, ${v.join(' + ')} + ${M(x)}, divisée par ${n + 1}) et la nouvelle médiane (valeur du milieu des ${n + 1} valeurs rangées), puis regarde de combien chacune a changé par rapport à ${M(r0.mean)} et ${M(r0.med)}.`,
      solution: `Nouvelle moyenne : ${M(r1.mean)} (variation ${M(dm)}). Nouvelle médiane : ${M(r1.med)} (variation ${M(dd)}). ${win === 'moy' ? 'La <b>moyenne</b> change le plus' : win === 'med' ? 'La <b>médiane</b> change le plus' : 'Elles changent <b>autant</b>'} : la médiane résiste mieux aux valeurs extrêmes.` };
  }
  // typique : quelle valeur résume le mieux ? (série avec une valeur extrême déjà dans la liste)
  const nn = ri(7, 9), base = Array.from({ length: nn - 1 }, () => E.lo + E.st * ri(0, Math.round((E.hi - E.lo) / E.st))), xx = E.ex(), lst = shuffle([...base, xx]), q = resume(lst);
  const near = val => lst.filter(a => Math.abs(a - val) <= 0.25 * val).length * 2 >= lst.length;
  const win = near(q.med) && !near(q.mean) ? 'med' : near(q.mean) && !near(q.med) ? 'moy' : null;
  if (win === null) return L12(d);
  return { type: 'choice', opts: [{ v: 'moy', l: 'La moyenne' }, { v: 'med', l: 'La médiane' }], check: choiceCheck(win, { msg: () => `Calcule les deux : lequel est proche de la plupart des valeurs de la liste (et pas seulement de la valeur extrême ${M(xx)}) ?` }),
    html: `${E.intro(nn, p)} ${E.incl}${big(list(lst))}On veut un seul nombre pour décrire <b>${E.typ}</b>. Que vaut-il mieux choisir&nbsp;?`, visual: tiles(lst.map(M), { hl: [lst.indexOf(xx)], label: E.axe }),
    afterVisual: boxPlot([{ name: 'Série', ...five(q) }], { ...axeNice(lst), axe: E.axe, show: true }),
    verify: E2 => { const t = [...lst].sort((a, b) => a - b), m = t.reduce((a, b) => a + b, 0) / t.length, md = medCount(lst), c = a => lst.filter(y => Math.abs(y - a) <= 0.25 * a).length * 2 >= lst.length; return (c(md) && !c(m) ? 'med' : c(m) && !c(md) ? 'moy' : null) === E2; },
    hint: `Calcule la moyenne (somme des ${nn} valeurs ÷ ${nn}) et la médiane (valeur du milieu de la liste rangée). Regarde ensuite lequel des deux est proche de la plupart des valeurs, et pas seulement de ${M(xx)}.`,
    solution: `Moyenne : environ ${M(Math.round(q.mean * 100) / 100)}${E.u} ; médiane : ${M(q.med)}${E.u}. ${win === 'med' ? `La médiane est proche de presque toutes les valeurs ; la moyenne est tirée vers ${M(xx)}.` : `La moyenne est proche de presque toutes les valeurs.`} On choisit <b>${win === 'med' ? 'la médiane' : 'la moyenne'}</b>.` };
}
export function C12() {
  const v = [1500, 1600, 1650, 1700, 1750], all = [...v, 5900];
  const r0 = resume(v), r1 = resume(all);
  const lst = [1500, 1850, 6000, 1550, 1600, 1700, 1650], q = resume(lst);
  return `<h2>12. Valeurs extrêmes et synthèse</h2>
<p class="intro">Une seule valeur très éloignée peut changer beaucoup la moyenne, mais presque pas la médiane. Il faut donc choisir le bon indicateur.</p>
<div class="def">La <b>moyenne</b> utilise toutes les valeurs : elle est sensible aux valeurs <b>extrêmes</b>. La <b>médiane</b> ne dépend que du rang des valeurs : elle est <b>résistante</b>. L'écart interquartile l'est aussi, l'étendue non.</div>
${boxPlot([{ name: 'Avant', ...five(r0) }, { name: 'Après', ...five(r1) }], { lo: 1000, hi: 6500, g: 500, lab: 500, axe: 'salaire mensuel (€)', show: false })}
${methode('Recalcule la moyenne avec la valeur ajoutée : nouvelle somme ÷ nouveau nombre de valeurs.', 'Recalcule la médiane : range toutes les valeurs, prends le milieu (ou la moyenne des deux du milieu).', 'Compare les variations : une valeur extrême fait bouger la moyenne, pas la médiane.', 'Pour décrire une situation « habituelle » avec une valeur extrême : choisis la médiane.')}
${ex('Exemple 1 : salaires 1 500 ; 1 600 ; 1 650 ; 1 700 ; 1 750 (moyenne 1 640 €). On ajoute le directeur : 5 900 €. Nouvelle moyenne ?', `Somme : 8 200 + 5 900 = 14 100. 14 100 ÷ 6 = <b>2 350 €</b>. La moyenne a énormément monté.`)}
${ex('Exemple 2 : mêmes salaires. Nouvelle médiane avec les 6 valeurs ?', `Rangée : 1 500 ; 1 600 ; <b>1 650</b> ; <b>1 700</b> ; 1 750 ; 5 900. 6 valeurs : (1 650 + 1 700) ÷ 2 = <b>1 675</b>. Avant : 1 650 : elle a à peine bougé.`)}
${ex('Exemple 3 : moyenne et médiane, laquelle change le plus ?', 'Moyenne : de 1 640 à 2 350, soit +710. Médiane : de 1 650 à 1 675, soit +25. La <b>moyenne</b> change le plus.')}
${tiles(lst.map(x => x / 100), { hl: [2], label: 'salaires (en centaines d\'euros)' })}
${ex('Exemple 4 : 1 500 ; 1 850 ; 6 000 ; 1 550 ; 1 600 ; 1 700 ; 1 650 (en €). Moyenne ou médiane pour décrire le salaire d\'un employé ?', `Moyenne : 15 850 ÷ 7 ≈ 2 264 € : presque aucun employé ne gagne cela. Médiane (rangées : 1 500 ; 1 550 ; 1 600 ; <b>1 650</b> ; 1 700 ; 1 850 ; 6 000) : <b>1 650 €</b>, proche de presque tous les salaires. On choisit <b>la médiane</b>.`)}
${ex('Exemple 5 : synthèse à partir d\'un tableau (moyenne, médiane, étendue).', `${tableHtml(['Note (sur 20)', [8, 9, 10, 11, 12]], [{ h: 'Effectif', cells: [2, 5, 7, 6, 4] }, { h: 'Effectif cumulé croissant', cells: [2, 7, 14, 20, 24] }])}Moyenne : (8×2 + 9×5 + 10×7 + 11×6 + 12×4) ÷ 24 = 245 ÷ 24 ≈ <b>10,21</b>. Médiane : rangs 12 et 13, tous deux à 10, soit <b>10</b>. Étendue : 12 − 8 = <b>4</b>.`)}
${warn('Une valeur extrême suffit à déplacer la moyenne ; vérifie toujours si elle « représente » vraiment la série.', 'Avec une valeur de plus, le nombre de valeurs change : divise par le <b>nouveau</b> nombre.', 'Ne mélange pas : moyenne (somme ÷ nombre), médiane (milieu), étendue (max − min).')}
${retenir('la médiane et l\'écart interquartile résistent aux valeurs extrêmes ; la moyenne et l\'étendue y sont sensibles.')}`;
}

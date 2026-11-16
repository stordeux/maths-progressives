// Statistiques et probabilités : 12 niveaux (5e – 3e), un cours par niveau, une difficulté qui
// augmente avec d (série de réussites en cours).
// Vérifications indépendantes : les effectifs sont relus dans le dessin (parseBars), la moyenne est recalculée
// depuis la liste brute des individus, la médiane par tri d'une copie, les probabilités par dénombrement
// exhaustif des issues équiprobables (liste des boules, des cartes, des faces, des couples de tirages).
import { ri, pick, shuffle, chance, prenom } from '../../engine/util/rand.js';
import { gcd, red, approx, decimals } from '../../engine/util/arith.js';
import { F, M } from '../../engine/util/fmt.js';
import { numsCheck, fracCheck, choiceCheck } from '../../engine/answers/checks.js';
import { barChart, parseBars, pieChart, tiles, urn, dieFaces, spinner, numberFaces, cards32, tree, probaBar, twoDice, sumTable, COUL, RANGS, COULEURS } from './draw.js';

const big = s => `<div class="big">${s}</div>`;
const sum = a => a.reduce((s, x) => s + x, 0);
const range = (a, b) => [...Array(b - a + 1)].map((_, i) => a + i);
const list = a => a.map(M).join(' ; ');
const FR = (n, d) => { const [a, b] = red(n, d); return b === 1 ? String(a) : F(a, b); };
const FRs = (n, d) => (gcd(n, d) > 1 ? `${F(n, d)} = ${FR(n, d)}` : F(n, d));
const COMMA = { comma: true };

/** tableau valeurs / effectifs (classe CSS table.data) */
const dataTable = (h1, vals, h2, effs, total) => `<div class="tablewrap"><table class="data"><tr><th>${h1}</th>${vals.map(v => `<td>${typeof v === 'number' ? M(v) : v}</td>`).join('')}${total !== undefined ? '<td><b>Total</b></td>' : ''}</tr><tr><th>${h2}</th>${effs.map(v => `<td>${typeof v === 'number' ? M(v) : v}</td>`).join('')}${total !== undefined ? `<td><b>${total}</b></td>` : ''}</tr></table></div>`;

/** découpe total en k entiers ≥ min, au hasard */
function partition(total, k, min = 1) {
  const p = Array(k).fill(min);
  for (let r = total - k * min; r > 0; r--) p[ri(0, k - 1)]++;
  return p;
}
/** découpe S en n valeurs comprises entre lo et hi (S doit être entre n·lo et n·hi) */
function spread(S, n, lo, hi) {
  const v = Array(n).fill(lo);
  for (let r = S - n * lo; r > 0; r--) { let i; do { i = ri(0, n - 1); } while (v[i] >= hi); v[i]++; }
  return v;
}
/** liste brute des individus à partir d'un tableau valeurs / effectifs */
const expand = (vals, effs) => vals.flatMap((v, i) => Array(effs[i]).fill(v));
/** moyenne recalculée individu par individu */
function rawMean(raw) { let s = 0, n = 0; for (const x of raw) { s += x; n++; } return s / n; }
/** médiane par tri d'une copie */
function sortMedian(raw) { const t = [...raw].sort((a, b) => a - b), n = t.length; return n % 2 ? t[(n - 1) / 2] : (t[n / 2 - 1] + t[n / 2]) / 2; }

/** check «&nbsp;nombre&nbsp;» avec messages «&nbsp;presque juste&nbsp;» : near = [[valeur, message], …] */
function numCheck(X, near = []) {
  return numsCheck([X], { msg: v => { const hit = near.find(([y]) => y !== X && approx(v[0], y)); return hit ? hit[1] : ''; } });
}
/** check «&nbsp;probabilité&nbsp;» (fraction irréductible ou non) avec messages «&nbsp;presque juste&nbsp;» */
function probCheck(fav, tot, near = []) {
  const base = fracCheck(fav, tot);
  const fn = v => {
    const r = base(v);
    if (r.ok || r.msg) return r;
    const [n, d] = v, x = n / d;
    if (x > 1) return { ok: false, msg: '⚠️ Une probabilité est toujours comprise entre 0 et 1 : le numérateur ne peut pas dépasser le dénominateur.' };
    const hit = near.find(([y]) => !approx(y, fav / tot) && approx(x, y));
    if (hit) return { ok: false, msg: hit[1] };
    if (fav < tot && approx(x, fav / (tot - fav))) return { ok: false, msg: "Tu as divisé par le nombre d'issues <b>défavorables</b> : il faut diviser par le nombre <b>total</b> d'issues." };
    if (fav < tot && approx(x, (tot - fav) / tot)) return { ok: false, msg: "C'est la probabilité de l'événement <b>contraire</b> : relis bien l'événement demandé." };
    return r;
  };
  fn.expected = base.expected;
  return fn;
}

/* ===================================================================== 1. diagramme en barres */
const SPORTS = [['Foot', 'le foot'], ['Basket', 'le basket'], ['Hand', 'le hand'], ['Danse', 'la danse'], ['Judo', 'le judo'], ['Tennis', 'le tennis'], ['Natation', 'la natation']];
function fratrie(k) { return k === 0 ? "n'ont ni frère ni sœur" : k === 1 ? 'ont 1 frère ou sœur' : `ont ${k} frères et sœurs`; }
function barData(d, numeric) {
  const max = d < 1 ? 8 : d < 2 ? 12 : 18, grid = d < 2 ? 1 : 2, lab = d < 1 ? 1 : d < 2 ? 2 : 4;
  if (numeric) {
    const n = ri(5, 6), cats = range(0, n - 1), vals = cats.map(() => ri(1, max));
    return { cats, vals, grid, lab, titre: "Nombre de frères et sœurs des élèves d'une classe", xTitle: 'nombre de frères et sœurs', numeric };
  }
  const sp = shuffle([...SPORTS]).slice(0, ri(4, 5)), vals = sp.map(() => ri(1, max));
  return { cats: sp.map(s => s[0]), names: sp.map(s => s[1]), vals, grid, lab, titre: 'Sport préféré des élèves de 5<sup>e</sup>', xTitle: '', numeric };
}
const drawBars = (D, o = {}) => barChart({ cats: D.cats.map(String), vals: D.vals, grid: D.grid, lab: D.lab, xTitle: D.xTitle, ...o });
function L1(d) {
  const D = barData(d, chance(.5)), n = D.cats.length, g = D.grid;
  const v = d < 2 ? 0 : d < 3 ? ri(0, 2) : ri(1, 3);
  let html, X, ask, hint, sol, hl;
  const who = i => (D.numeric ? `d'élèves ${fratrie(D.cats[i])}` : `d'élèves préfèrent ${D.names[i]}`);
  const lire = `Pars du haut de la barre et suis horizontalement jusqu'à l'axe vertical.${g > 1 || D.lab > 1 ? ` Attention : une petite graduation vaut ${g}.` : ''}`;
  if (v === 0) {
    const i = ri(0, n - 1); X = D.vals[i]; ask = e => e[i]; hl = [i];
    html = `Combien ${who(i)}&nbsp;?`;
    hint = `Repère la barre «&nbsp;${D.cats[i]}&nbsp;». ${lire}`;
    sol = `La barre «&nbsp;${D.cats[i]}&nbsp;» monte jusqu'à ${X} : il y a <b>${X}</b> élèves.`;
  } else if ((v === 1 || (v === 3 && !D.numeric)) && new Set(D.vals).size < 2) {
    return L1(d); // toutes les barres ont la même hauteur : pas de différence à demander (relecture Codex : boucle sans fin)
  } else if (v === 1 || (v === 3 && !D.numeric)) {
    let i, j; do { i = ri(0, n - 1); j = ri(0, n - 1); } while (i === j || D.vals[i] === D.vals[j]);
    if (D.vals[i] < D.vals[j]) [i, j] = [j, i];
    X = D.vals[i] - D.vals[j]; ask = e => e[i] - e[j]; hl = [i, j];
    html = D.numeric ? `Combien y a-t-il d'élèves de plus dans la barre «&nbsp;${D.cats[i]}&nbsp;» que dans la barre «&nbsp;${D.cats[j]}&nbsp;»&nbsp;?` : `Combien d'élèves de plus préfèrent ${D.names[i]} plutôt que ${D.names[j]}&nbsp;?`;
    hint = `Lis les deux effectifs (barres «&nbsp;${D.cats[i]}&nbsp;» et «&nbsp;${D.cats[j]}&nbsp;»), puis fais la <b>différence</b>. ${lire}`;
    sol = `«&nbsp;${D.cats[i]}&nbsp;» : ${D.vals[i]} ; «&nbsp;${D.cats[j]}&nbsp;» : ${D.vals[j]}. ${D.vals[i]} − ${D.vals[j]} = <b>${X}</b>.`;
  } else if (v === 2) {
    let i, j; do { i = ri(0, n - 1); j = ri(0, n - 1); } while (i === j);
    if (i > j) [i, j] = [j, i];
    X = D.vals[i] + D.vals[j]; ask = e => e[i] + e[j]; hl = [i, j];
    html = D.numeric ? `Combien d'élèves ont ${D.cats[i]} <b>ou</b> ${D.cats[j]} frères et sœurs&nbsp;?` : `Combien d'élèves préfèrent ${D.names[i]} <b>ou</b> ${D.names[j]}&nbsp;?`;
    hint = `Lis l'effectif de chacune des deux barres, puis <b>additionne</b>. ${lire}`;
    sol = `${D.vals[i]} + ${D.vals[j]} = <b>${X}</b> élèves.`;
  } else {
    const k = ri(1, n - 2), atLeast = chance(.5);
    const idx = D.cats.map((c, i) => i).filter(i => (atLeast ? D.cats[i] >= k : D.cats[i] <= k));
    X = sum(idx.map(i => D.vals[i])); ask = e => sum(D.cats.map((c, i) => ((atLeast ? c >= k : c <= k) ? e[i] : 0))); hl = idx;
    html = `Combien d'élèves ont <b>${atLeast ? 'au moins' : 'au plus'} ${k}</b> frère${k > 1 ? 's' : ''} et sœur${k > 1 ? 's' : ''}&nbsp;?`;
    hint = `«&nbsp;${atLeast ? 'Au moins' : 'Au plus'} ${k}&nbsp;» veut dire ${k} <b>ou ${atLeast ? 'plus' : 'moins'}</b> : additionne les effectifs des barres ${idx.map(i => D.cats[i]).join(', ')}. ${lire}`;
    sol = `Barres ${idx.map(i => D.cats[i]).join(', ')} : ${idx.map(i => D.vals[i]).join(' + ')} = <b>${X}</b> élèves.`;
  }
  const visual = drawBars(D);
  return { type: 'nums', tpl: 'Réponse : {0} élèves', check: numCheck(X, [[X - 1, 'Presque : regarde bien où arrive le haut de la barre.'], [X + 1, 'Presque : regarde bien où arrive le haut de la barre.']]),
    html: `<b>${D.titre}</b><br>${html}`, visual, afterVisual: drawBars(D, { hl }), replaceVisual: true,
    verify: E => approx(ask(parseBars(visual)), E[0]), hint, solution: sol };
}
/** fenêtre Cours : affiche une figure plus petite (largeur en pixels) */
const petit = (svg, w) => svg.replace(/style="width:[\d.]+px"/, `style="width:${w}px;max-width:min(${w}px, 100%)"`);
function C1() {
  return `<h2>1. Lire un diagramme en barres</h2>
<p class="intro">Un diagramme en barres permet de voir d'un coup d'œil les résultats d'une enquête. Encore faut-il le lire avec précision.</p>
<div class="def">Dans un <b>diagramme en barres</b>, chaque barre correspond à une valeur (ou une catégorie). Sa <b>hauteur</b> donne l'<b>effectif</b> : le nombre d'individus qui ont cette valeur.</div>
${barChart({ cats: ['Foot', 'Basket', 'Danse', 'Judo'], vals: [7, 4, 6, 3], grid: 1, lab: 1, hl: [0, 1], width: 400 })}
<div class="methode"><b>Méthode</b><ol><li>Lis le titre et ce qui est écrit sous les barres.</li><li>Regarde ce que vaut <b>une graduation</b> de l'axe vertical (1, 2, 5…).</li><li>Pars du haut de la barre et suis l'horizontale jusqu'à l'axe : c'est l'effectif.</li><li>Fais le calcul demandé : « de plus que » → différence ; « A <b>ou</b> B » → somme ; « au moins », « au plus » → somme de plusieurs barres.</li></ol></div>
<div class="ex"><span class="q">Exemple 1 : combien d'élèves préfèrent le foot ? Combien de plus que le basket ?</span><br>La barre « Foot » monte jusqu'à 7 : <b>7 élèves</b>. Le basket en a 4 : 7 − 4 = <b>3 élèves de plus</b>.</div>
${barChart({ cats: ['0', '1', '2', '3'], vals: [3, 6, 5, 2], grid: 1, lab: 1, xTitle: 'nombre de frères et sœurs', hl: [2, 3], width: 400 })}
<div class="ex"><span class="q">Exemple 2 : combien d'élèves ont <b>au moins</b> 2 frères et sœurs ?</span><br>« Au moins 2 », c'est 2 <b>ou plus</b> : barres 2 et 3. 5 + 2 = <b>7 élèves</b>.<br>« Au plus 1 », ce serait les barres 0 et 1 : 3 + 6 = 9 élèves.</div>
<div class="warn">⚠️ Regarde ce que vaut <b>une graduation</b> : parfois elle vaut 2, et le haut d'une barre peut tomber entre deux lignes.<br>⚠️ « Au moins 2 » contient 2 ; « au plus 2 » aussi.<br>⚠️ Ne confonds pas la valeur (en bas) et l'effectif (la hauteur).</div>
<div class="retenir">À retenir : la hauteur d'une barre est l'effectif de la valeur écrite dessous.</div>`;
}

/* ===================================================================== 2. effectif total, fréquence */
function L2(d) {
  const v = d < 1 ? 0 : d < 2 ? 1 : 2;
  if (v === 0) {
    const D = barData(Math.min(d, 1), chance(.5)), N = sum(D.vals), visual = drawBars(D);
    return { type: 'nums', tpl: 'Effectif total : {0}', check: numCheck(N, [[D.cats.length, "Tu as compté les barres : il faut <b>additionner leurs hauteurs</b> (les effectifs)."], [Math.max(...D.vals), "C'est l'effectif de la plus haute barre : il faut additionner <b>tous</b> les effectifs."]]),
      html: `<b>${D.titre}</b><br>Combien d'élèves ont répondu en tout ? (c'est l'<b>effectif total</b>)`, visual,
      verify: E => approx(sum(parseBars(visual)), E[0]),
      hint: `Lis l'effectif de <b>chaque</b> barre, puis additionne-les tous.`,
      solution: `${D.vals.join(' + ')} = <b>${N}</b> élèves.` };
  }
  // fréquence : fraction (v = 1) ou pourcentage (v = 2)
  const ctx = pick([
    { h1: 'Note (sur 5)', vals: range(0, 5), q: x => `de la note ${x}` },
    { h1: 'Couleur des yeux', vals: ['bleus', 'verts', 'marron', 'noirs'], q: x => `des yeux ${x}` },
    { h1: 'Nombre de livres lus', vals: range(0, 4), q: x => `de la valeur «&nbsp;${x} livre${x > 1 ? 's' : ''}&nbsp;»` },
  ]);
  const k = ctx.vals.length, i = ri(0, k - 1);
  let N, effs;
  if (v === 1) { N = ri(k + 3, d < 3 ? 24 : 36); effs = partition(N, k); }
  else {
    N = pick(d < 3 ? [20, 25, 50] : [20, 25, 40, 50, 75, 200]);
    const u = N / gcd(N, 100), n = u * ri(1, Math.max(1, Math.floor(Math.min(N / 2, N - (k - 1)) / u)));
    effs = partition(N - n, k - 1); effs.splice(i, 0, n);
  }
  const n = effs[i], raw = expand(ctx.vals.map((_, j) => j), effs);
  const count = raw.filter(x => x === i).length; // dénombrement des individus
  const html = `${dataTable(ctx.h1, ctx.vals, 'Effectif', effs)}Quelle est la <b>fréquence</b> ${ctx.q(ctx.vals[i])}${v === 1 ? ' (sous forme de fraction)' : ' <b>en pourcentage</b>'}&nbsp;?`;
  const mxE = Math.max(...effs), gr = mxE > 60 ? 10 : mxE > 30 ? 5 : mxE > 12 ? 2 : 1;
  const visual = barChart({ cats: ctx.vals.map(String), vals: effs, grid: gr, lab: 2 * gr });
  if (v === 1) {
    return { type: 'frac', check: probCheck(n, N, [[n / k, `Il faut diviser par l'<b>effectif total</b> (${N}), pas par le nombre de valeurs.`]]), value: count / raw.length,
      html, visual, hint: `Fréquence = ${F('effectif de la valeur', 'effectif total')}. Calcule d'abord l'effectif total en additionnant la ligne des effectifs.`,
      solution: `Effectif total : ${effs.join(' + ')} = ${N}. Fréquence : ${FRs(n, N)}.` };
  }
  const P = n * 100 / N;
  return { type: 'nums', tpl: 'Fréquence : {0} %', check: numCheck(P, [[n, `${n} est l'<b>effectif</b>. La fréquence est ${n} ÷ ${N}, à écrire en pourcentage.`], [n / N, `${M(n / N)} est la fréquence en écriture décimale : multiplie par 100 pour l'avoir en %.`]]),
    keys: COMMA, value: count / raw.length * 100, html, visual,
    hint: `Effectif total N = somme des effectifs. Puis fréquence = ${n} ÷ N, et on multiplie par 100 pour l'avoir en %.`,
    solution: `N = ${effs.join(' + ')} = ${N}. ${F(n, N)} = ${M(n / N)} = <b>${M(P)} %</b>.` };
}
function C2() {
  return `<h2>2. Effectif total et fréquence</h2>
<p class="intro">Pour comparer des groupes de tailles différentes, on ne compare pas les effectifs mais les <b>fréquences</b> : la part de chaque valeur dans le total.</p>
<div class="def">L'<b>effectif total</b> est la somme de tous les effectifs.<br>La <b>fréquence</b> d'une valeur = ${F('effectif de la valeur', 'effectif total')}. On peut l'écrire en fraction, en décimal ou en pourcentage.</div>
<div class="cols">${dataTable('Couleur des yeux', ['bleus', 'verts', 'marron'], 'Effectif', [5, 3, 12])}${barChart({ cats: ['bleus', 'verts', 'marron'], vals: [5, 3, 12], grid: 1, lab: 2, hl: [0], width: 300 })}</div>
<div class="methode"><b>Méthode</b><ol><li>Effectif total : additionne <b>tous</b> les effectifs (toutes les barres, toute la ligne du tableau).</li><li>Fréquence : effectif de la valeur ÷ effectif total (en fraction, simplifie si tu peux).</li><li>En pourcentage : calcule la fréquence en décimal, puis multiplie par 100.</li></ol></div>
<div class="ex"><span class="q">Exemple 1 : effectif total et fréquence des yeux bleus.</span><br>Effectif total : 5 + 3 + 12 = 20.<br>Fréquence des yeux bleus : ${F(5, 20)} = ${F(1, 4)} = 0,25 = <b>25 %</b>.</div>
<div class="ex"><span class="q">Exemple 2 : 7 élèves sur 25 ont eu la note 3. Fréquence en pourcentage ?</span><br>${F(7, 25)} = 7 ÷ 25 = 0,28, soit <b>28 %</b>.</div>
<div class="warn">⚠️ On divise par l'<b>effectif total</b> (20), pas par le nombre de valeurs (3) ni par un autre effectif.<br>⚠️ Une fréquence est toujours entre 0 et 1 (entre 0 % et 100 %). La somme de toutes les fréquences vaut 1 (100 %).<br>⚠️ L'effectif (5) n'est pas la fréquence : il faut diviser.</div>
<div class="retenir">À retenir : fréquence = effectif ÷ effectif total.</div>`;
}

/* ===================================================================== 3. moyenne d'une liste */
const LISTES = [
  { t: n => `Voici les notes (sur 20) de ${prenom()} à ses ${n} derniers contrôles.`, lo: 6, hi: 20, u: '', lab: 'notes' },
  { t: n => `Voici le nombre de points marqués par une équipe de basket lors de ${n} matchs.`, lo: 12, hi: 40, u: ' points', lab: 'points' },
  { t: n => `Voici le temps (en minutes) mis par ${prenom()} pour aller au collège, sur ${n} jours.`, lo: 8, hi: 30, u: ' min', lab: 'minutes' },
];
function L3(d) {
  const n = d < 1 ? pick([3, 4]) : d < 2 ? pick([4, 5]) : d < 3 ? pick([5, 6]) : pick([6, 8, 10]);
  const maxDec = d < 1 ? 0 : d < 3 ? 1 : 2, C = pick(LISTES);
  let S; do { S = ri(n * C.lo + n, n * C.hi - n); } while (decimals(S / n) > maxDec);
  const m = S / n, vals = shuffle(spread(S, n, C.lo, C.hi));
  return { type: 'nums', tpl: `Moyenne : {0}${C.u}`, keys: COMMA, check: numCheck(m, [[S, `${S} est la <b>somme</b> : il reste à diviser par le nombre de valeurs (${n}).`], [S / (n - 1), `Vérifie le nombre de valeurs : il y en a <b>${n}</b>.`], [S / (n + 1), `Vérifie le nombre de valeurs : il y en a <b>${n}</b>.`]]),
    value: rawMean(vals), html: `${C.t(n)}<br>Calcule la <b>moyenne</b>.`, visual: tiles(vals, { label: C.lab }),
    afterVisual: barChart({ cats: vals.map((_, i) => `n°${i + 1}`), vals, grid: C.hi > 20 ? 5 : 2, lab: C.hi > 20 ? 10 : 4, yTitle: C.lab, meanLine: m }), replaceVisual: true,
    hint: `Additionne les ${n} valeurs, puis divise la somme par ${n}.`,
    solution: `Somme : ${vals.join(' + ')} = ${S}.<br>Moyenne : ${S} ÷ ${n} = <b>${M(m)}</b>${C.u}.` };
}
function C3() {
  return `<h2>3. Moyenne d'une série</h2>
<p class="intro">La moyenne résume une série par un seul nombre : la valeur qu'aurait chaque donnée si on les rendait toutes égales.</p>
<div class="def">Moyenne = ${F('somme de toutes les valeurs', 'nombre de valeurs')}</div>
${barChart({ cats: ['n°1', 'n°2', 'n°3', 'n°4'], vals: [12, 9, 15, 14], grid: 2, lab: 4, yTitle: 'notes', meanLine: 12.5, width: 360 })}
<p>La moyenne, c'est la hauteur commune qu'auraient les barres si on « égalisait » : ce qui dépasse comble les creux.</p>
<div class="methode"><b>Méthode</b><ol><li>Additionne toutes les valeurs.</li><li>Compte combien il y a de valeurs.</li><li>Divise la somme par ce nombre.</li><li>Contrôle : la moyenne est entre la plus petite et la plus grande valeur.</li></ol></div>
<div class="ex"><span class="q">Exemple 1 : notes 12 ; 9 ; 15 ; 14.</span><br>Somme : 12 + 9 + 15 + 14 = 50. Il y a 4 notes : 50 ÷ 4 = <b>12,5</b>.</div>
<div class="ex"><span class="q">Exemple 2 : temps de trajet 8 ; 11 ; 9 ; 14 ; 12 (en minutes).</span><br>Somme : 54. Il y a 5 valeurs : 54 ÷ 5 = <b>10,8 min</b>.<br>Contrôle : 10,8 est bien entre 8 et 14.</div>
<div class="warn">⚠️ N'oublie pas de <b>diviser</b> : la somme (50) n'est pas la moyenne.<br>⚠️ Compte bien le nombre de valeurs : une de trop ou de moins fausse tout.<br>⚠️ La moyenne est toujours entre la plus petite et la plus grande valeur : sinon, il y a une erreur.</div>
<div class="retenir">À retenir : moyenne = somme des valeurs ÷ nombre de valeurs.</div>`;
}

/* ===================================================================== 4. moyenne pondérée */
const PONDS = [
  { h1: 'Note', h2: 'Nombre d\'élèves', vals: k => { const a = ri(6, 10); return range(0, k - 1).map(i => a + 2 * i); }, t: 'Notes obtenues par une classe à un contrôle.', u: '' },
  { h1: 'Nombre d\'enfants', h2: 'Nombre de familles', vals: k => range(0, k - 1), t: "Nombre d'enfants des familles d'un immeuble.", u: ' enfant(s)' },
  { h1: 'Pointure', h2: 'Effectif', vals: k => { const a = ri(35, 38); return range(a, a + k - 1); }, t: 'Pointures des élèves d\'un club de foot.', u: '' },
];
function L4(d) {
  const k = d < 1 ? 3 : d < 2 ? 3 : d < 3 ? 4 : 5, maxDec = d < 2 ? 1 : 2, maxE = d < 1 ? 5 : d < 2 ? 6 : 9;
  let C, vals, effs, N, S, m, mv;
  do {
    C = pick(PONDS); vals = C.vals(k); effs = vals.map(() => ri(1, maxE));
    N = sum(effs); S = sum(vals.map((x, i) => x * effs[i])); m = S / N; mv = sum(vals) / k;
  } while (decimals(m) > maxDec || approx(m, mv) || N < 2 * k);
  const raw = shuffle(expand(vals, effs));
  return { type: 'nums', tpl: 'Moyenne : {0}', keys: COMMA,
    check: numCheck(m, [[mv, `⚠️ Tu as fait la moyenne des valeurs <b>sans tenir compte des effectifs</b>. Chaque valeur compte autant de fois que son effectif.`], [S, `${S} est la somme totale : divise-la par l'effectif total (${N}).`], [S / k, `Il faut diviser par l'<b>effectif total</b> (${N}), pas par le nombre de valeurs différentes (${k}).`]]),
    value: rawMean(raw),
    html: `${C.t}${dataTable(C.h1, vals, C.h2, effs)}Calcule la <b>moyenne</b> de cette série.`,
    visual: barChart({ cats: vals.map(String), vals: effs, grid: 1, lab: maxE > 6 ? 2 : 1, xTitle: C.h1.toLowerCase() }),
    afterVisual: barChart({ cats: vals.map(String), vals: effs, grid: 1, lab: maxE > 6 ? 2 : 1, xTitle: C.h1.toLowerCase() }) + `<p class="note" style="text-align:center">Moyenne = ${M(m)} (elle penche du côté des grands effectifs).</p>`, replaceVisual: true,
    hint: `Multiplie chaque valeur par son effectif, additionne ces produits, puis divise par l'<b>effectif total</b>.`,
    solution: `Somme : ${vals.map((x, i) => `${M(x)} × ${effs[i]}`).join(' + ')} = ${S}.<br>Effectif total : ${effs.join(' + ')} = ${N}.<br>Moyenne : ${S} ÷ ${N} = <b>${M(m)}</b>.` };
}
function C4() {
  return `<h2>4. Moyenne pondérée (tableau d'effectifs)</h2>
<p class="intro">Quand une valeur apparaît plusieurs fois, on ne la réécrit pas : on utilise un tableau d'effectifs, et chaque valeur « pèse » selon son effectif.</p>
<div class="def">Quand les données sont dans un tableau d'effectifs :<br>Moyenne = ${F('somme des (valeur × effectif)', 'effectif total')}</div>
<div class="cols">${dataTable('Note', [10, 12, 16], 'Effectif', [2, 5, 3])}${barChart({ cats: ['10', '12', '16'], vals: [2, 5, 3], grid: 1, lab: 1, xTitle: 'note', width: 300 })}</div>
<div class="methode"><b>Méthode</b><ol><li>Multiplie chaque valeur par son effectif.</li><li>Additionne ces produits.</li><li>Calcule l'effectif total (somme des effectifs).</li><li>Divise la somme des produits par l'effectif total.</li></ol></div>
<div class="ex"><span class="q">Exemple 1 : le tableau des notes ci-dessus.</span><br>Somme : 10 × 2 + 12 × 5 + 16 × 3 = 20 + 60 + 48 = 128. Effectif total : 2 + 5 + 3 = 10.<br>Moyenne : 128 ÷ 10 = <b>12,8</b>.</div>
<div class="ex"><span class="q">Exemple 2 : pointures 36 (3 élèves), 37 (5 élèves), 38 (2 élèves).</span><br>36 × 3 + 37 × 5 + 38 × 2 = 108 + 185 + 76 = 369 ; effectif total 10.<br>Moyenne : 369 ÷ 10 = <b>36,9</b>.</div>
<div class="warn">⚠️ Moyenne non pondérée : (10 + 12 + 16) ÷ 3 ≈ 12,7 est <b>faux</b>, car 5 élèves ont 12 et seulement 2 ont 10. Chaque valeur compte autant de fois que son effectif.<br>⚠️ On divise par l'effectif total (10), pas par le nombre de colonnes (3).</div>
<div class="retenir">À retenir : moyenne pondérée = somme des (valeur × effectif) ÷ effectif total.</div>`;
}

/* ===================================================================== 5. médiane, nombre impair */
function medianCase(d, even) {
  const n = even ? (d < 1 ? pick([4, 6]) : d < 2 ? 6 : d < 3 ? 8 : 10) : (d < 1 ? 5 : d < 2 ? pick([5, 7]) : d < 3 ? pick([7, 9]) : pick([9, 11]));
  const k = even ? n / 2 - 1 : (n - 1) / 2, lo = d < 3 ? 2 : 1, hi = d < 3 ? 20 : 40;
  let a, b;
  if (even) { a = ri(lo + 3, hi - 4); b = a + ri(d < 1 ? 0 : 1, d < 3 ? 3 : 5); } else { a = b = ri(lo + 3, hi - 3); }
  const below = Array(k).fill(0).map(() => ri(lo, a)), above = Array(k).fill(0).map(() => ri(b, hi));
  if (d >= 3) { below[0] = a; } // valeurs répétées
  const sorted = [...below.sort((x, y) => x - y), ...(even ? [a, b] : [a]), ...above.sort((x, y) => x - y)];
  let vals = d < 1 ? sorted : shuffle([...sorted]);
  if (d >= 1) { let t = 0; while (sortMedian(vals) === (even ? (vals[n / 2 - 1] + vals[n / 2]) / 2 : vals[k]) && t++ < 20) vals = shuffle(vals); }
  return { n, k, a, b, vals, sorted, med: (a + b) / 2 };
}
function L5(d) {
  const { n, k, a, vals, sorted } = medianCase(d, false);
  const mid = vals[k], mean = rawMean(vals), ord = vals.some((x, i) => x !== sorted[i]);
  return { type: 'nums', tpl: 'Médiane : {0}', check: numCheck(a, [[mid, `⚠️ Tu as pris la valeur du milieu de la liste <b>sans la ranger dans l'ordre</b> !`], [mean, `Ça, c'est la moyenne (ou presque) : la médiane s'obtient en <b>rangeant</b> les valeurs.`]]),
    value: sortMedian(vals), html: `Voici une série de ${n} valeurs${ord ? ' (dans le désordre)' : ' (rangée dans l\'ordre croissant)'} :${big(list(vals))}Quelle est la <b>médiane</b> de cette série&nbsp;?`,
    visual: tiles(vals, { label: 'série' }),
    afterVisual: tiles(sorted, { hl: [k], label: 'série rangée dans l\'ordre croissant' }),
    hint: `${ord ? 'Range d\'abord les valeurs dans l\'ordre croissant. ' : ''}Il y a ${n} valeurs : la médiane est la valeur du milieu, la <b>${k + 1}<sup>e</sup></b> (${k} valeurs avant, ${k} après).`,
    solution: `Rangée : ${list(sorted)}.<br>${n} valeurs : la médiane est la ${k + 1}<sup>e</sup> valeur, soit <b>${M(a)}</b>.` };
}
function C5() {
  return `<h2>5. Médiane (nombre impair de valeurs)</h2>
<p class="intro">La médiane coupe la série en deux moitiés : autant de valeurs en dessous qu'au-dessus. Contrairement à la moyenne, une valeur extrême ne la fait pas bouger.</p>
<div class="def">La <b>médiane</b> partage la série <b>rangée dans l'ordre croissant</b> en deux groupes de même effectif : au moins la moitié des valeurs sont inférieures ou égales à la médiane, au moins la moitié sont supérieures ou égales.</div>
<div class="methode"><b>Méthode</b><ol><li>Range les valeurs dans l'ordre croissant (garde les valeurs répétées).</li><li>Compte le nombre n de valeurs.</li><li>n impair : la médiane est la valeur de rang ${F('n + 1', 2)}.</li><li>Vérifie : autant de valeurs avant qu'après.</li></ol></div>
<div class="ex"><span class="q">Exemple 1 : 14 ; 8 ; 11 ; 17 ; 9.</span><br>On range : 8 ; 9 ; <b>11</b> ; 14 ; 17. Il y a 5 valeurs : la médiane est la 3<sup>e</sup>, <b>11</b>.</div>
${tiles([8, 9, 11, 14, 17], { hl: [2], label: 'rangée : 2 valeurs avant, 2 après' })}
<div class="ex"><span class="q">Exemple 2 (valeurs répétées) : 12 ; 5 ; 9 ; 12 ; 7 ; 15 ; 9.</span><br>Rangée : 5 ; 7 ; 9 ; <b>9</b> ; 12 ; 12 ; 15. 7 valeurs : la médiane est la ${F('7 + 1', 2)} = 4<sup>e</sup>, soit <b>9</b>.</div>
${tiles([5, 7, 9, 9, 12, 12, 15], { hl: [3], label: 'rangée : 3 valeurs avant, 3 après' })}
<div class="warn">⚠️ Erreur classique : prendre la valeur du milieu <b>sans trier</b>. Dans 14 ; 8 ; 17 ; 11 ; 9, la valeur du milieu est 17 : faux !<br>⚠️ Les valeurs répétées comptent chacune : on ne les supprime pas.<br>⚠️ La médiane n'est pas la moyenne (dans l'exemple 1, la moyenne vaut 11,8).</div>
<div class="retenir">À retenir : on range d'abord ; avec n impair, la médiane est la valeur de rang (n + 1) ÷ 2.</div>`;
}

/* ===================================================================== 6. médiane, nombre pair */
function L6(d) {
  if (d >= 3 && chance(.5)) { // à partir d'un tableau d'effectifs
    const k = ri(4, 5), v0 = ri(8, 12), vals = range(0, k - 1).map(i => v0 + i);
    let effs, N; do { effs = vals.map(() => ri(1, 7)); N = sum(effs); } while (N % 2);
    // médiane par les effectifs cumulés : valeurs de rangs N/2 et N/2 + 1
    const at = r => { let c = 0; for (let i = 0; i < k; i++) { c += effs[i]; if (c >= r) return vals[i]; } return vals[k - 1]; };
    const x1 = at(N / 2), x2 = at(N / 2 + 1), med = (x1 + x2) / 2, raw = shuffle(expand(vals, effs));
    let cum = 0; const cums = effs.map(e => (cum += e));
    return { type: 'nums', tpl: 'Médiane : {0}', keys: COMMA, check: numCheck(med, [[vals[Math.floor(k / 2)], 'Ce n\'est pas la colonne du milieu du tableau : il faut chercher les individus du milieu (effectifs cumulés).'], [rawMean(raw), "Ça, c'est la moyenne : la médiane se trouve avec les rangs."]]),
      value: sortMedian(raw), html: `Âge des membres d'un club (${N} membres) :${dataTable('Âge (ans)', vals, 'Effectif', effs)}Quelle est la <b>médiane</b> de cette série&nbsp;?`,
      visual: barChart({ cats: vals.map(String), vals: effs, grid: 1, lab: 1, xTitle: 'âge (ans)' }),
      afterVisual: `<p class="note" style="text-align:center">Effectifs cumulés : ${cums.join(' ; ')}</p>`,
      hint: `Il y a ${N} valeurs (déjà rangées par le tableau). La médiane est entre la ${N / 2}<sup>e</sup> et la ${N / 2 + 1}<sup>e</sup> valeur : calcule les <b>effectifs cumulés</b> pour les trouver.`,
      solution: `Effectifs cumulés : ${cums.join(' ; ')}. La ${N / 2}<sup>e</sup> valeur est ${x1}, la ${N / 2 + 1}<sup>e</sup> est ${x2}.<br>Médiane : (${x1} + ${x2}) ÷ 2 = <b>${M(med)}</b>.` };
  }
  const { n, k, a, b, vals, sorted, med } = medianCase(d, true);
  const ord = vals.some((x, i) => x !== sorted[i]), mid = (vals[k] + vals[k + 1]) / 2;
  const near = [[a, `Il y a un nombre <b>pair</b> de valeurs : la médiane est à mi-chemin entre les <b>deux</b> valeurs du milieu (${a} et ${b}).`], [b, `Il y a un nombre <b>pair</b> de valeurs : la médiane est à mi-chemin entre les <b>deux</b> valeurs du milieu (${a} et ${b}).`], [mid, `⚠️ As-tu bien <b>rangé</b> les valeurs avant de chercher le milieu&nbsp;?`]];
  return { type: 'nums', tpl: 'Médiane : {0}', keys: COMMA, check: numCheck(med, near), value: sortMedian(vals),
    html: `Voici une série de ${n} valeurs${ord ? ' (dans le désordre)' : ' (rangée dans l\'ordre croissant)'} :${big(list(vals))}Quelle est la <b>médiane</b> de cette série&nbsp;?`,
    visual: tiles(vals, { label: 'série' }), afterVisual: tiles(sorted, { hl: [k, k + 1], label: 'série rangée dans l\'ordre croissant' }),
    hint: `${ord ? 'Range d\'abord les valeurs. ' : ''}Il y a ${n} valeurs (nombre pair) : la médiane est la moyenne de la ${k + 1}<sup>e</sup> et de la ${k + 2}<sup>e</sup> valeur.`,
    solution: `Rangée : ${list(sorted)}.<br>Les deux valeurs du milieu sont ${M(a)} et ${M(b)} : médiane = (${M(a)} + ${M(b)}) ÷ 2 = <b>${M(med)}</b>.` };
}
function C6() {
  return `<h2>6. Médiane (nombre pair de valeurs)</h2>
<p class="intro">Avec un nombre pair de valeurs, il n'y a pas une valeur pile au milieu : on prend le milieu des deux valeurs centrales.</p>
<div class="def">Avec un nombre <b>pair</b> de valeurs, il y a <b>deux</b> valeurs au milieu. La médiane est la moyenne de ces deux valeurs (elle est à mi-chemin).</div>
<div class="methode"><b>Méthode</b><ol><li>Range les valeurs dans l'ordre croissant.</li><li>n pair : repère les valeurs de rang ${F('n', 2)} et ${F('n', 2)} + 1.</li><li>Médiane = leur moyenne : (première + seconde) ÷ 2.</li><li>Avec un tableau d'effectifs : calcule les <b>effectifs cumulés</b> pour trouver ces deux rangs.</li></ol></div>
<div class="ex"><span class="q">Exemple 1 : 13 ; 7 ; 10 ; 15 ; 9 ; 12.</span><br>Rangée : 7 ; 9 ; <b>10 ; 12</b> ; 13 ; 15. 6 valeurs : 3<sup>e</sup> et 4<sup>e</sup>. Médiane : (10 + 12) ÷ 2 = <b>11</b>.</div>
${tiles([7, 9, 10, 12, 13, 15], { hl: [2, 3], label: 'rangée : les deux valeurs du milieu' })}
<div class="ex"><span class="q">Exemple 2 : un tableau d'effectifs (16 personnes).</span>${dataTable('Âge (ans)', [10, 11, 12, 13], 'Effectif', [3, 5, 4, 4])}Effectifs cumulés : 3 ; 8 ; 12 ; 16. On cherche la 8<sup>e</sup> et la 9<sup>e</sup> valeur.<br>La 8<sup>e</sup> est 11 (les rangs 4 à 8 valent 11), la 9<sup>e</sup> est 12. Médiane : (11 + 12) ÷ 2 = <b>11,5</b>.</div>
<div class="warn">⚠️ Toujours <b>ranger</b> les valeurs d'abord. Et ne pas prendre une seule des deux valeurs du milieu.<br>⚠️ Dans un tableau, la colonne du milieu n'est pas forcément la médiane : utilise les effectifs cumulés.<br>⚠️ La médiane peut être un nombre qui n'est pas dans la série (11 ou 11,5 ici).</div>
<div class="retenir">À retenir : n pair → médiane = moyenne des valeurs de rangs n ÷ 2 et n ÷ 2 + 1.</div>`;
}

/* ===================================================================== 7. étendue */
const JOURS = ['lun.', 'mar.', 'mer.', 'jeu.', 'ven.', 'sam.', 'dim.'];
function L7(d) {
  const v = d < 1 ? 0 : d < 2 ? 1 : d < 3 ? 2 : ri(0, 2);
  if (v === 2) { // diagramme en barres, valeurs extrêmes d'effectif 0
    const nC = ri(7, 9), cats = range(0, nC - 1).map(i => (d >= 3 ? 10 + i : i)), vals = cats.map(() => ri(1, 9));
    const z0 = ri(0, 2), z1 = ri(0, 2); for (let i = 0; i < z0; i++) vals[i] = 0; for (let i = 0; i < z1; i++) vals[nC - 1 - i] = 0;
    const present = cats.filter((c, i) => vals[i] > 0), mn = present[0], mx = present[present.length - 1], E = mx - mn;
    const nzv = vals.filter(x => x > 0), visual = barChart({ cats: cats.map(String), vals, grid: 1, lab: 2, xTitle: d >= 3 ? 'âge (ans)' : 'nombre de jeux vidéo' });
    return { type: 'nums', tpl: 'Étendue : {0}', check: numCheck(E, [[Math.max(...vals) - Math.min(...nzv), "Tu as utilisé les <b>effectifs</b> (hauteurs des barres) : l'étendue se calcule sur les <b>valeurs</b> (en bas)."], [cats[nC - 1] - cats[0], "⚠️ Une valeur d'effectif 0 n'est pas dans la série : prends la plus petite et la plus grande valeur qui ont une barre."], [Math.max(...vals) - Math.min(...vals), "Tu as utilisé les <b>effectifs</b> : l'étendue se calcule sur les <b>valeurs</b>."]]),
      html: `${d >= 3 ? 'Âge des participants à un stage de théâtre.' : 'Nombre de jeux vidéo possédés par des élèves.'}<br>Quelle est l'<b>étendue</b> de cette série&nbsp;?`, visual,
      verify: E2 => { const e = parseBars(visual), p = cats.filter((c, i) => e[i] > 0); return approx(p[p.length - 1] - p[0], E2[0]); },
      hint: `Cherche la plus petite et la plus grande <b>valeur</b> (en bas) qui ont une barre, puis fais la différence.`,
      solution: `Plus petite valeur (avec un effectif non nul) : ${mn} ; plus grande : ${mx}. Étendue : ${mx} − ${mn} = <b>${E}</b>.` };
  }
  let vals, mn, mx, html, u = '';
  if (v === 0) {
    const n = ri(5, d < 3 ? 7 : 10); mn = ri(2, 30); mx = mn + ri(5, d < 3 ? 25 : 60);
    vals = shuffle([mn, mx, ...Array(n - 2).fill(0).map(() => ri(mn, mx))]);
    html = `Voici les distances (en km) parcourues par ${prenom()} à vélo pendant ${n} sorties :${big(list(vals))}Quelle est l'<b>étendue</b> de cette série&nbsp;?`; u = ' km';
  } else {
    mn = ri(-9, -1); mx = ri(1, d < 3 ? 12 : 18);
    vals = shuffle([mn, mx, ...Array(5).fill(0).map(() => ri(mn, mx))]);
    html = `Températures minimales (en °C) relevées une semaine d'hiver :<div class="tablewrap"><table class="data"><tr><th>Jour</th>${JOURS.map(j => `<td>${j}</td>`).join('')}</tr><tr><th>°C</th>${vals.map(x => `<td>${M(x)}</td>`).join('')}</tr></table></div>Quelle est l'<b>étendue</b> de ces températures&nbsp;?`; u = ' °C';
  }
  const E = mx - mn, t = [...vals].sort((x, y) => x - y);
  const near = [[mx, `${M(mx)} est la plus grande valeur : il faut lui <b>soustraire</b> la plus petite.`], [mx + mn, `⚠️ Attention au nombre négatif : ${M(mx)} − (${M(mn)}) = ${M(mx)} + ${M(-mn)}.`], [vals[vals.length - 1] - vals[0], 'Tu as pris la dernière et la première valeur de la liste : il faut la plus grande et la plus petite.']];
  return { type: 'nums', tpl: `Étendue : {0}${u}`, check: numCheck(E, near), value: t[t.length - 1] - t[0], html,
    visual: tiles(vals, { label: v === 1 ? 'températures (°C)' : 'distances (km)' }),
    afterVisual: tiles(t, { hl: [0, t.length - 1], label: 'rangées : la plus petite et la plus grande' }),
    hint: `Étendue = plus grande valeur − plus petite valeur.${v === 1 ? ' Attention aux températures négatives.' : ''}`,
    solution: `Plus grande valeur : ${M(mx)} ; plus petite : ${M(mn)}. Étendue : ${M(mx)} − ${mn < 0 ? `(${M(mn)})` : M(mn)} = <b>${E}</b>${u}.` };
}
function C7() {
  return `<h2>7. Étendue</h2>
<p class="intro">Deux séries peuvent avoir la même moyenne et être très différentes : l'étendue mesure si les valeurs sont serrées ou étalées.</p>
<div class="def">L'<b>étendue</b> d'une série est la différence entre la plus grande et la plus petite valeur. Elle mesure la <b>dispersion</b> : plus elle est grande, plus les valeurs sont étalées.</div>
<div class="methode"><b>Méthode</b><ol><li>Repère la plus grande valeur et la plus petite valeur (pas la première et la dernière de la liste).</li><li>Étendue = plus grande − plus petite.</li><li>Avec des nombres négatifs : soustraire un négatif, c'est ajouter son opposé.</li><li>Sur un diagramme en barres : lis les valeurs <b>en bas</b>, seulement celles qui ont une barre.</li></ol></div>
<div class="ex"><span class="q">Exemple 1 : distances 12 ; 35 ; 28 ; 17 ; 40 (en km).</span><br>Plus grande : 40 ; plus petite : 12. Étendue : 40 − 12 = <b>28 km</b>.</div>
<div class="ex"><span class="q">Exemple 2 : températures 3 ; −4 ; 7 ; 0 ; −2 (en °C).</span><br>Plus grande : 7 ; plus petite : −4. Étendue : 7 − (−4) = 7 + 4 = <b>11 °C</b>.</div>
${tiles([-4, -2, 0, 3, 7], { hl: [0, 4], label: 'rangées : la plus petite et la plus grande' })}
<div class="ex"><span class="q">Exemple 3 : nombre de jeux vidéo (diagramme ci-dessous).</span><br>Les valeurs 0 et 6 ont un effectif nul : elles ne sont pas dans la série. Plus petite valeur : 1 ; plus grande : 5. Étendue : 5 − 1 = <b>4</b>.</div>
${barChart({ cats: ['0', '1', '2', '3', '4', '5', '6'], vals: [0, 2, 5, 3, 4, 1, 0], grid: 1, lab: 1, xTitle: 'nombre de jeux vidéo', hl: [1, 5], width: 400 })}
<div class="warn">⚠️ Soustraire un nombre négatif revient à ajouter son opposé : 7 − (−4) = 11, pas 3.<br>⚠️ Une valeur d'effectif 0 ne fait pas partie de la série.<br>⚠️ On calcule sur les <b>valeurs</b>, pas sur les effectifs (hauteurs des barres).</div>
<div class="retenir">À retenir : étendue = plus grande valeur − plus petite valeur.</div>`;
}

/* ===================================================================== 8. diagrammes circulaires et tableaux */
const MODES = ['Bus', 'Vélo', 'Voiture', 'À pied', 'Tram'];
const EN = { Bus: 'en bus', Vélo: 'à vélo', Voiture: 'en voiture', 'À pied': 'à pied', Tram: 'en tram' };
function L8(d) {
  const v = d < 1 ? 0 : d < 2 ? 1 : d < 3 ? 2 : 3, k = ri(3, 4), cats = shuffle([...MODES]).slice(0, k), i = ri(0, k - 1);
  if (v === 0) { // pourcentage lu à partir des angles (multiples de 18°)
    const units = partition(20, k, 2), angles = units.map(x => x * 18), P = units[i] * 5;
    const parts = cats.map((c, j) => ({ l: c, v: angles[j], txt: `${angles[j]}°` }));
    return { type: 'nums', tpl: 'Réponse : {0} %', check: numCheck(P, [[angles[i], `${angles[i]} est l'angle en degrés. Le disque entier (360°) représente 100 %.`]]),
      value: angles[i] / 360 * 100,
      html: `Ce diagramme circulaire montre comment les élèves d'une classe viennent au collège.<br>Quel <b>pourcentage</b> des élèves vient <b>${EN[cats[i]]}</b>&nbsp;?`, visual: pieChart(parts),
      hint: `Le disque entier (360°) représente 100 % des élèves. Quelle part de 360° fait ${angles[i]}° ? (Astuce : 36° = 10 %, 18° = 5 %.)`,
      solution: `${F(angles[i], 360)} = ${FR(angles[i], 360)}, et ${FR(angles[i], 360)} de 100 % = <b>${P} %</b>.` };
  }
  const N = pick(d < 3 ? [12, 18, 20, 24, 30, 36] : [24, 30, 36, 40, 45, 60, 72]), deg = 360 / N, minE = Math.ceil(30 / deg);
  const effs = partition(N, k, minE), angles = effs.map(e => e * deg);
  if (v === 1) { // effectif à partir d'un angle
    const parts = cats.map((c, j) => ({ l: c, v: angles[j], txt: `${angles[j]}°` }));
    return { type: 'nums', tpl: 'Réponse : {0} élèves', check: numCheck(effs[i], [[angles[i], `${angles[i]} est l'angle : il faut trouver le nombre d'élèves.`]]),
      value: N * angles[i] / 360,
      html: `Les <b>${N} élèves</b> d'une classe ont dit comment ils viennent au collège.<br>Combien d'élèves viennent <b>${EN[cats[i]]}</b>&nbsp;?`, visual: pieChart(parts),
      hint: `360° représentent les ${N} élèves, donc 1 élève correspond à 360 ÷ ${N} = ${deg}°. Combien d'élèves font ${angles[i]}°&nbsp;?`,
      solution: `1 élève ↔ ${deg}°. ${angles[i]} ÷ ${deg} = <b>${effs[i]}</b> élèves.` };
  }
  const parts = cats.map((c, j) => ({ l: c, v: angles[j], txt: j === i ? '?' : `${angles[j]}°` }));
  if (v === 2) { // angle à partir du tableau
    return { type: 'nums', tpl: 'Angle : {0}°', check: numCheck(angles[i], [[effs[i], `${effs[i]} est l'effectif : il faut l'angle en degrés (le disque fait 360°).`], [effs[i] * 100 / N, "C'est le pourcentage : il faut l'angle (le disque fait 360°)."]]),
      value: effs[i] / N * 360,
      html: `${dataTable('Moyen de transport', cats, 'Effectif', effs, N)}On représente ce tableau par un diagramme circulaire. Quel est l'<b>angle</b> du secteur «&nbsp;${cats[i]}&nbsp;»&nbsp;?`, visual: pieChart(parts),
      hint: `Les angles sont <b>proportionnels</b> aux effectifs : ${N} élèves ↔ 360°. Calcule l'angle pour 1 élève, puis pour ${effs[i]}.`,
      solution: `1 élève ↔ 360 ÷ ${N} = ${deg}°. ${effs[i]} × ${deg} = <b>${angles[i]}°</b>.` };
  }
  // v = 3 : effectif manquant dans le tableau, puis angle
  const shown = effs.map((e, j) => (j === i ? '?' : e)), E = [effs[i], angles[i]];
  return { type: 'nums', tpl: 'Effectif : {0} &nbsp; Angle : {1}°', labels: ['effectif manquant', 'angle'], check: numsCheck(E, { msg: a => (a[0] === effs[i] ? "L'effectif est juste ! Pour l'angle : le disque (360°) représente l'effectif total." : `L'effectif manquant = total − les autres effectifs.`) }),
    value: (N - sum(effs.filter((_, j) => j !== i))) / N * 360,
    html: `${dataTable('Moyen de transport', cats, 'Effectif', shown, N)}Complète l'effectif manquant, puis donne l'<b>angle</b> du secteur «&nbsp;${cats[i]}&nbsp;» dans le diagramme circulaire.`, visual: pieChart(parts),
    hint: `Effectif manquant : ${N} moins la somme des autres effectifs. Puis ${N} élèves ↔ 360°.`,
    solution: `Effectif : ${N} − (${effs.filter((_, j) => j !== i).join(' + ')}) = ${effs[i]}.<br>1 élève ↔ ${deg}°, donc angle = ${effs[i]} × ${deg} = <b>${angles[i]}°</b>.` };
}
function C8() {
  return `<h2>8. Diagrammes circulaires et tableaux</h2>
<p class="intro">Un diagramme circulaire montre la part de chaque catégorie dans le tout. Tout repose sur la proportionnalité entre effectifs et angles.</p>
<div class="def">Dans un <b>diagramme circulaire</b>, les <b>angles</b> des secteurs sont proportionnels aux effectifs. Le disque entier (360°) représente l'effectif total (100 %).</div>
<div class="cols">${dataTable('Transport', ['Bus', 'Vélo', 'À pied'], 'Effectif', [15, 6, 9], 30)}${pieChart([{ l: 'Bus', v: 180, txt: '180°' }, { l: 'Vélo', v: 72, txt: '72°' }, { l: 'À pied', v: 108, txt: '108°' }], { width: 320 })}</div>
<div class="methode"><b>Méthode</b><ol><li>Calcule l'angle pour 1 individu : 360° ÷ effectif total.</li><li>Angle d'un secteur = effectif × angle pour 1 individu.</li><li>Effectif à partir d'un angle : angle ÷ angle pour 1 individu.</li><li>Pourcentage à partir d'un angle : ${F('angle', '360')} × 100. Repères : 90° = 25 %, 180° = 50 %, 36° = 10 %.</li></ol></div>
<div class="ex"><span class="q">Exemple 1 : angles du tableau ci-dessus (30 élèves).</span><br>1 élève ↔ 360 ÷ 30 = 12°. Bus : 15 × 12 = <b>180°</b> ; vélo : 6 × 12 = 72° ; à pied : 9 × 12 = 108°.<br>Contrôle : 180 + 72 + 108 = 360.</div>
<div class="ex"><span class="q">Exemple 2 : quel pourcentage représente le secteur de 72° ?</span><br>${F(72, 360)} = ${F(1, 5)} = <b>20 %</b>.</div>
<div class="ex"><span class="q">Exemple 3 : 24 élèves en tout ; le secteur « Tram » mesure 105°. Combien d'élèves ?</span><br>1 élève ↔ 360 ÷ 24 = 15°. 105 ÷ 15 = <b>7 élèves</b>.</div>
<div class="warn">⚠️ Ne confonds pas l'angle (en °), l'effectif (nombre d'individus) et le pourcentage.<br>⚠️ La somme des angles fait toujours 360° ; s'il manque un effectif, c'est le total moins les autres.</div>
<div class="retenir">À retenir : 360° ↔ effectif total : angles et effectifs sont proportionnels.</div>`;
}

/* ===================================================================== 9. vocabulaire des probabilités */
const EVTS = [
  { l: 'obtenir un nombre pair', f: x => x % 2 === 0, c: n => Math.floor(n / 2) },
  { l: 'obtenir un nombre impair', f: x => x % 2 === 1, c: n => Math.ceil(n / 2) },
  { l: 'obtenir un multiple de 3', f: x => x % 3 === 0, c: n => Math.floor(n / 3) },
  { l: 'obtenir un nombre premier', f: x => [2, 3, 5, 7, 11, 13, 17, 19].includes(x), c: n => [2, 3, 5, 7, 11, 13, 17, 19].filter(p => p <= n).length },
];
const seuil = (n) => {
  const k = ri(2, n - 1), t = ri(0, 3);
  return [
    { l: `obtenir un nombre supérieur ou égal à ${k}`, f: x => x >= k, c: () => n - k + 1, alt: x => x > k },
    { l: `obtenir un nombre strictement supérieur à ${k}`, f: x => x > k, c: () => n - k, alt: x => x >= k },
    { l: `obtenir un nombre inférieur ou égal à ${k}`, f: x => x <= k, c: () => k, alt: x => x < k },
    { l: `obtenir un nombre strictement inférieur à ${k}`, f: x => x < k, c: () => k - 1, alt: x => x <= k },
  ][t];
};
function experience(d) {
  const t = d < 1 ? ri(0, 2) : ri(0, 3);
  if (t === 0) return { n: 6, txt: 'On lance un dé équilibré à 6 faces et on note le nombre obtenu.', vis: o => dieFaces(o), mot: 'face' };
  if (t === 1) { const n = pick([8, 10, 12]); return { n, txt: `On fait tourner une roue partagée en ${n} secteurs égaux numérotés de 1 à ${n}, et on note le numéro indiqué par la flèche.`, vis: o => spinner(n, o), mot: 'secteur' }; }
  const n = ri(5, d < 3 ? 10 : 15);
  return { n, txt: `Une urne contient ${n} boules indiscernables au toucher, numérotées de 1 à ${n}. On tire une boule au hasard et on note son numéro.`, vis: o => urn(range(1, n).map(x => ({ c: 'J', t: x })), { hl: (o.hl || []).map(x => x - 1) }), mot: 'boule' };
}
const issuesOf = n => range(1, n);
function L9(d) {
  const X = experience(d), n = X.n, I = issuesOf(n), v = d < 1 ? 0 : d < 2 ? 1 : d < 3 ? 2 : 3;
  if (v === 0) {
    if (chance(.3)) { // piège : l'issue est la couleur, pas la boule
      const cs = shuffle(['R', 'B', 'V', 'J']).slice(0, ri(2, 3)), effs = cs.map(() => ri(2, 4)), balls = cs.flatMap((c, j) => Array(effs[j]).fill({ c }));
      const issues = [...new Set(balls.map(b => b.c))];
      return { type: 'nums', tpl: 'Nombre d\'issues : {0}', check: numCheck(cs.length, [[balls.length, `On note la <b>couleur</b> : les issues sont les couleurs possibles, pas les boules.`]]), value: issues.length,
        html: `Une urne contient ${cs.map((c, j) => `${effs[j]} boules ${COUL[c].noms}`).join(', ').replace(/, ([^,]*)$/, ' et $1')}. On tire une boule et on note sa <b>couleur</b>.<br>Combien y a-t-il d'<b>issues</b> possibles&nbsp;?`,
        visual: urn(balls), hint: `Une issue est un résultat possible de l'expérience. Ici, le résultat est une <b>couleur</b>.`,
        solution: `Les issues sont : ${cs.map(c => COUL[c].nom).join(', ')}. Il y en a <b>${cs.length}</b>.` };
    }
    return { type: 'nums', tpl: 'Nombre d\'issues : {0}', check: numCheck(n), value: I.length,
      html: `${X.txt}<br>Combien y a-t-il d'<b>issues</b> possibles&nbsp;?`, visual: X.vis({}),
      hint: `Une <b>issue</b> est un résultat possible. Fais la liste de tous les résultats possibles.`,
      solution: `Les issues sont 1, 2, …, ${n} : il y en a <b>${n}</b>.` };
  }
  if (v === 1) {
    const E = chance(.5) ? pick(EVTS) : seuil(n), fav = I.filter(E.f), X2 = E.c(n);
    return { type: 'nums', tpl: 'Nombre d\'issues : {0}', check: numCheck(X2, E.alt ? [[I.filter(E.alt).length, '⚠️ Attention aux mots «&nbsp;strictement&nbsp;» et «&nbsp;ou égal&nbsp;» : le nombre limite est-il compris ?']] : []), value: fav.length,
      html: `${X.txt}<br>On considère l'événement A : «&nbsp;${E.l}&nbsp;».<br>Combien d'issues <b>réalisent</b> l'événement A&nbsp;?`, visual: X.vis({}), afterVisual: X.vis({ hl: fav }), replaceVisual: true,
      hint: `Écris toutes les issues (1 à ${n}), puis entoure celles pour lesquelles «&nbsp;${E.l}&nbsp;» est vrai.`,
      solution: `Issues qui réalisent A : ${fav.join(' ; ')}. Il y en a <b>${fav.length}</b>.` };
  }
  if (v === 2) {
    const t = ri(0, 2), k = n + ri(1, 5);
    const E = t === 0 ? pick([{ l: `obtenir ${k}`, f: x => x === k }, { l: 'obtenir 0', f: x => x === 0 }, { l: `obtenir un nombre supérieur à ${n}`, f: x => x > n }])
      : t === 1 ? pick([{ l: `obtenir un nombre inférieur ou égal à ${n}`, f: x => x <= n }, { l: `obtenir un nombre entier entre 1 et ${n}`, f: x => x >= 1 && x <= n }, { l: 'obtenir un nombre positif', f: x => x > 0 }])
        : { ...(chance(.5) ? pick(EVTS) : seuil(n)) };
    const c = I.filter(E.f).length, ans = c === 0 ? 'imp' : c === n ? 'cert' : 'poss';
    const opts = [{ v: 'imp', l: 'impossible' }, { v: 'cert', l: 'certain' }, { v: 'poss', l: 'ni certain ni impossible' }];
    return { type: 'choice', opts, check: choiceCheck(ans, { msg: c => (c === 'cert' && ans === 'poss' ? 'Certaines issues ne réalisent pas cet événement : il n\'est pas certain.' : '') }),
      verify: e => e === (I.filter(E.f).length === 0 ? 'imp' : I.every(E.f) ? 'cert' : 'poss'),
      html: `${X.txt}<br>L'événement «&nbsp;${E.l}&nbsp;» est…`, visual: X.vis({}),
      hint: `Un événement est <b>impossible</b> si aucune issue ne le réalise, <b>certain</b> si toutes les issues le réalisent.`,
      solution: `${c === 0 ? 'Aucune issue ne le réalise : il est <b>impossible</b>.' : c === n ? 'Toutes les issues le réalisent : il est <b>certain</b>.' : `${c} issue${c > 1 ? 's' : ''} sur ${n} le réalise${c > 1 ? 'nt' : ''} : il n'est <b>ni certain ni impossible</b>.`}` };
  }
  // v = 3 : quelle liste d'issues réalise l'événement ?
  let E; do { E = seuil(n); } while (I.filter(E.f).length < 2 || I.filter(E.f).length > n - 2);
  const good = I.filter(E.f), cand = [good, I.filter(E.alt), I.filter(x => !E.f(x)), I.filter(x => x % 2 === 0)];
  const seen = new Set(), opts = [];
  cand.forEach((s, j) => { const l = s.join(' ; '); if (s.length && !seen.has(l)) { seen.add(l); opts.push({ v: 'o' + j, l: `{ ${l} }`, s }); } });
  const sh = shuffle(opts);
  return { type: 'choice', opts: sh.map(o => ({ v: o.v, l: o.l })), check: choiceCheck('o0', { msg: c => (c === 'o1' ? '⚠️ Relis bien : «&nbsp;strictement&nbsp;» ou «&nbsp;ou égal&nbsp;» ? Le nombre limite est-il compris ?' : c === 'o2' ? "C'est l'événement contraire !" : '') }),
    verify: e => { const o = sh.find(x => x.v === e); return o && o.s.join() === I.filter(E.f).join(); },
    html: `${X.txt}<br>Quelles sont les issues qui réalisent l'événement «&nbsp;${E.l}&nbsp;»&nbsp;?`, visual: X.vis({}), afterVisual: X.vis({ hl: good }), replaceVisual: true,
    hint: `Teste chaque issue de 1 à ${n} : réalise-t-elle «&nbsp;${E.l}&nbsp;» ? Fais attention au nombre limite.`,
    solution: `Issues qui réalisent l'événement : <b>{ ${good.join(' ; ')} }</b>.` };
}
function C9() {
  return `<h2>9. Vocabulaire des probabilités</h2>
<p class="intro">Avant de calculer des chances, il faut parler le même langage : expérience, issue, événement.</p>
<div class="def">Une <b>expérience aléatoire</b> a plusieurs résultats possibles, qu'on ne peut pas prévoir à l'avance. Chaque résultat possible est une <b>issue</b>.<br>Un <b>événement</b> est une condition qui peut être réalisée ou non ; il est réalisé par certaines issues. Il est <b>impossible</b> si aucune issue ne le réalise, <b>certain</b> si toutes le réalisent.</div>
<div class="cols">${dieFaces({ hl: [2, 4, 6] })}${petit(spinner(10, { hl: [8, 9, 10] }), 230)}</div>
<div class="methode"><b>Méthode</b><ol><li>Écris la liste de toutes les issues (ce que l'on <b>note</b> : un nombre, une couleur…).</li><li>Pour un événement, teste chaque issue une par une.</li><li>Fais attention aux mots « strictement » et « ou égal ».</li><li>Aucune issue : impossible ; toutes : certain.</li></ol></div>
<div class="ex"><span class="q">Exemple 1 : on lance un dé à 6 faces.</span><br>Issues : 1, 2, 3, 4, 5, 6. « Obtenir un nombre pair » est réalisé par 3 issues : 2, 4 et 6.<br>« Obtenir 7 » est <b>impossible</b> ; « obtenir un nombre entre 1 et 6 » est <b>certain</b>.</div>
<div class="ex"><span class="q">Exemple 2 : roue de 10 secteurs numérotés de 1 à 10.</span><br>« Strictement supérieur à 7 » : 8, 9, 10, soit <b>3 issues</b>.<br>« Supérieur ou égal à 7 » : 7, 8, 9, 10, soit <b>4 issues</b>.</div>
<div class="ex"><span class="q">Exemple 3 : une urne contient 3 boules rouges et 2 bleues ; on note la couleur.</span><br>Il y a <b>2 issues</b> : rouge et bleu (pas 5 : on note la couleur, pas la boule).</div>
<div class="warn">⚠️ « Supérieur ou égal à 4 » : 4, 5, 6. « Strictement supérieur à 4 » : 5, 6 seulement.<br>⚠️ Si on note la <b>couleur</b> d'une boule, les issues sont les couleurs, pas les boules.<br>⚠️ « Ni certain ni impossible » : certaines issues le réalisent, d'autres non.</div>
<div class="retenir">À retenir : issue = un résultat possible ; événement = un ensemble d'issues.</div>`;
}

/* ===================================================================== 10. probabilité : dé, urne, cartes */
function deck() { return COULEURS.flatMap(c => RANGS.map(r => ({ r, s: c.n, rouge: c.rouge }))); }
const FIG = ['V', 'D', 'R'];
const CARD_EVTS = [
  { l: 'un cœur', f: c => c.s === 'cœur', n: 8 },
  { l: 'un roi', f: c => c.r === 'R', n: 4 },
  { l: 'un as', f: c => c.r === 'A', n: 4 },
  { l: 'une carte rouge', f: c => c.rouge, n: 16 },
  { l: 'une figure (valet, dame ou roi)', f: c => FIG.includes(c.r), n: 12 },
  { l: 'la dame de pique', f: c => c.r === 'D' && c.s === 'pique', n: 1 },
  { l: 'un as rouge', f: c => c.r === 'A' && c.rouge, n: 2 },
  { l: 'une figure de trèfle', f: c => FIG.includes(c.r) && c.s === 'trèfle', n: 3 },
  { l: 'une carte noire qui n\'est pas une figure', f: c => !c.rouge && !FIG.includes(c.r), n: 10 },
];
function colorUrn(d, k) {
  const cs = shuffle(['R', 'B', 'V', 'J']).slice(0, k), effs = cs.map(() => ri(1, d < 3 ? 5 : 7));
  const balls = cs.flatMap((c, j) => Array(effs[j]).fill(0).map(() => ({ c })));
  return { cs, effs, balls, N: sum(effs), desc: cs.map((c, j) => `${effs[j]} boule${effs[j] > 1 ? 's' : ''} ${effs[j] > 1 ? COUL[c].noms : COUL[c].nom}`).join(', ').replace(/, ([^,]*)$/, ' et $1') };
}
function L10(d) {
  const v = d < 1 ? 0 : d < 2 ? 1 : d < 3 ? 2 : ri(2, 4);
  const hintP = `Probabilité = ${F("nombre d'issues favorables", "nombre total d'issues")} (les issues doivent être équiprobables).`;
  if (v === 0) {
    const E = chance(.3) ? (() => { const k = ri(1, 6); return { l: `obtenir ${k}`, f: x => x === k, c: () => 1 }; })() : chance(.5) ? pick(EVTS) : seuil(6);
    const fav = range(1, 6).filter(E.f), c = E.c(6);
    return { type: 'frac', check: probCheck(c, 6), value: fav.length / 6,
      html: `On lance un dé équilibré à 6 faces. Quelle est la probabilité de l'événement «&nbsp;${E.l}&nbsp;»&nbsp;?`, visual: dieFaces(), afterVisual: dieFaces({ hl: fav }), replaceVisual: true,
      hint: hintP + ' Il y a 6 issues : compte celles qui réalisent l\'événement.',
      solution: `Issues favorables : ${fav.join(' ; ')} (${fav.length} sur 6). Probabilité : ${FRs(c, 6)}.` };
  }
  if (v === 1) {
    const U = colorUrn(d, ri(2, 3)), j = ri(0, U.cs.length - 1), c = U.cs[j];
    return { type: 'frac', check: probCheck(U.effs[j], U.N), value: U.balls.filter(b => b.c === c).length / U.balls.length,
      html: `Une urne contient ${U.desc}, indiscernables au toucher. On tire une boule au hasard.<br>Quelle est la probabilité de tirer une boule <b>${COUL[c].nom}</b>&nbsp;?`, visual: urn(U.balls),
      hint: hintP + ` Chaque <b>boule</b> a la même chance d'être tirée : compte toutes les boules, puis les boules ${COUL[c].noms}.`,
      solution: `Il y a ${U.N} boules dont ${U.effs[j]} ${COUL[c].noms}. Probabilité : ${FRs(U.effs[j], U.N)}.` };
  }
  if (v === 2) {
    const E = pick(CARD_EVTS), D = deck(), fav = D.filter(E.f);
    return { type: 'frac', check: probCheck(E.n, 32), value: fav.length / D.length,
      html: `On tire une carte au hasard dans un jeu de 32 cartes (4 couleurs : ♠ pique, ♥ cœur, ♦ carreau, ♣ trèfle ; 8 cartes par couleur : 7, 8, 9, 10, valet, dame, roi, as).<br>Quelle est la probabilité de tirer <b>${E.l}</b>&nbsp;?`,
      visual: cards32(), afterVisual: cards32(E.f), replaceVisual: true,
      hint: hintP + ' Il y a 32 cartes : compte celles qui conviennent (aide-toi du dessin).',
      solution: `${E.n} carte${E.n > 1 ? 's' : ''} sur 32 conviennent. Probabilité : ${FRs(E.n, 32)}.` };
  }
  if (v === 3) { // dé à n faces, événement composé
    const n = pick([8, 10, 12, 20]), k = ri(2, n - 3), t = ri(0, 2);
    const E = [
      { l: `obtenir un nombre pair strictement supérieur à ${k}`, f: x => x % 2 === 0 && x > k, c: Math.floor(n / 2) - Math.floor(k / 2) },
      { l: `obtenir un multiple de 3 inférieur ou égal à ${k}`, f: x => x % 3 === 0 && x <= k, c: Math.floor(k / 3) },
      { l: `obtenir un nombre impair ou un nombre strictement supérieur à ${k}`, f: x => x % 2 === 1 || x > k, c: Math.ceil(k / 2) + (n - k) },
    ][t];
    const fav = range(1, n).filter(E.f);
    if (!E.c) return L10(d);
    return { type: 'frac', check: probCheck(E.c, n), value: fav.length / n,
      html: `On lance un dé équilibré à ${n} faces numérotées de 1 à ${n}.<br>Quelle est la probabilité de l'événement «&nbsp;${E.l}&nbsp;»&nbsp;?`, visual: numberFaces(n), afterVisual: numberFaces(n, { hl: fav }), replaceVisual: true,
      hint: hintP + ` Il y a ${n} issues. Teste-les une par une.`,
      solution: `Issues favorables : ${fav.join(' ; ')} (${fav.length} sur ${n}). Probabilité : ${FRs(E.c, n)}.` };
  }
  // v = 4 : boules colorées et numérotées
  const r = ri(3, 6), b = ri(3, 6), N = r + b, balls = [...range(1, r).map(x => ({ c: 'R', t: x })), ...range(r + 1, N).map(x => ({ c: 'B', t: x }))];
  const par = chance(.5), cnt = par ? Math.floor(r / 2) : Math.ceil(r / 2), fav = balls.filter(x => x.c === 'R' && (x.t % 2 === 0) === par);
  return { type: 'frac', check: probCheck(cnt, N, [[cnt / r, `On tire parmi <b>toutes</b> les boules (${N}), pas seulement parmi les rouges.`]]), value: fav.length / balls.length,
    html: `Une urne contient ${N} boules : ${r} rouges numérotées de 1 à ${r} et ${b} bleues numérotées de ${r + 1} à ${N}. On tire une boule au hasard.<br>Quelle est la probabilité de tirer une boule <b>rouge</b> portant un numéro <b>${par ? 'pair' : 'impair'}</b>&nbsp;?`,
    visual: urn(balls), afterVisual: urn(balls, { hl: balls.map((x, i) => (fav.includes(x) ? i : -1)).filter(i => i >= 0) }), replaceVisual: true,
    hint: hintP + ` Il y a ${N} boules en tout. Compte celles qui sont rouges <b>et</b> ${par ? 'paires' : 'impaires'}.`,
    solution: `Boules rouges ${par ? 'paires' : 'impaires'} : ${fav.map(x => x.t).join(' ; ')} (${cnt} sur ${N}). Probabilité : ${FRs(cnt, N)}.` };
}
function C10() {
  return `<h2>10. Calculer une probabilité</h2>
<p class="intro">La probabilité mesure la chance qu'un événement se réalise, par un nombre entre 0 (impossible) et 1 (certain).</p>
<div class="def">Quand toutes les issues ont la même chance de se produire (<b>équiprobabilité</b>) :<br>P(A) = ${F("nombre d'issues qui réalisent A", "nombre total d'issues")}</div>
<div class="cols">${urn([{ c: 'R' }, { c: 'R' }, { c: 'R' }, { c: 'B' }, { c: 'B' }, { c: 'V' }])}<div class="ex"><span class="q">Exemple 1 : urne de 3 rouges, 2 bleues, 1 verte.</span><br>6 boules en tout. P(rouge) = ${F(3, 6)} = ${F(1, 2)} ; P(verte) = ${F(1, 6)}.</div></div>
<div class="methode"><b>Méthode</b><ol><li>Compte le nombre total d'issues équiprobables (faces, boules, cartes…).</li><li>Compte les issues qui réalisent l'événement (aide-toi du dessin).</li><li>Écris la fraction favorables ÷ total, et simplifie-la si possible.</li><li>Contrôle : le résultat est entre 0 et 1.</li></ol></div>
<div class="ex"><span class="q">Exemple 2 : dé à 6 faces, « obtenir au moins 5 ».</span><br>Issues favorables : 5 et 6. P = ${F(2, 6)} = <b>${F(1, 3)}</b>.</div>
${cards32(c => c.r === 'R')}
<div class="ex"><span class="q">Exemple 3 : jeu de 32 cartes.</span><br>P(roi) = ${F(4, 32)} = <b>${F(1, 8)}</b> (les 4 rois sont mis en valeur) ; P(cœur) = ${F(8, 32)} = ${F(1, 4)}.</div>
<div class="ex"><span class="q">Exemple 4 : dé à 12 faces, « obtenir un nombre pair strictement supérieur à 7 ».</span><br>Issues favorables : 8, 10, 12. P = ${F(3, 12)} = <b>${F(1, 4)}</b>.</div>
<div class="warn">⚠️ Une probabilité est toujours <b>entre 0 et 1</b>. Si tu trouves ${F(7, 4)}, il y a une erreur !<br>⚠️ On divise par le nombre <b>total</b> d'issues, pas par le nombre d'issues défavorables.<br>⚠️ Dans une urne, chaque <b>boule</b> a la même chance : compte toutes les boules, pas seulement les couleurs.</div>
<div class="retenir">À retenir : P(A) = issues favorables ÷ issues possibles (si elles sont équiprobables).</div>`;
}

/* ===================================================================== 11. événement contraire */
const CTX11 = [
  ['que le bus soit en retard', 'que le bus ne soit pas en retard'],
  ['qu\'il pleuve demain', 'qu\'il ne pleuve pas demain'],
  ['de gagner à ce jeu', 'de ne pas gagner à ce jeu'],
  ['qu\'une ampoule soit défectueuse', 'qu\'une ampoule ne soit pas défectueuse'],
];
function L11(d) {
  const v = d < 1 ? 0 : d < 2 ? 1 : d < 3 ? 2 : 3;
  if (v === 0) {
    const den = pick([5, 6, 7, 8, 9, 10, 12]); let num; do { num = ri(1, den - 1); } while (gcd(num, den) > 1);
    const model = range(1, den).map(i => i <= num), C = pick(CTX11); // den issues équiprobables, num réalisent A
    return { type: 'frac', check: probCheck(den - num, den, [[num / den, "C'est la probabilité de l'événement lui-même : on demande celle du <b>contraire</b>."]]), value: model.filter(x => !x).length / model.length,
      html: `La probabilité ${C[0]} est ${F(num, den)}.<br>Quelle est la probabilité ${C[1]}&nbsp;?`,
      visual: probaBar([{ l: 'A', v: num / den, txt: `${num}/${den}` }, { l: 'non A', v: 1 - num / den, txt: '?' }]),
      hint: `«&nbsp;${C[1].replace(/^qu'|^que |^de /, '')}&nbsp;» est l'événement <b>contraire</b>. P(contraire) = 1 − P(A).`,
      solution: `1 − ${F(num, den)} = ${F(den, den)} − ${F(num, den)} = <b>${F(den - num, den)}</b>.` };
  }
  if (v === 1) {
    const U = colorUrn(d, ri(2, 3)), j = ri(0, U.cs.length - 1), c = U.cs[j];
    return { type: 'frac', check: probCheck(U.N - U.effs[j], U.N, [[U.effs[j] / U.N, `C'est la probabilité de tirer une boule ${COUL[c].nom} : on demande l'événement contraire.`]]),
      value: U.balls.filter(x => x.c !== c).length / U.balls.length,
      html: `Une urne contient ${U.desc}. On tire une boule au hasard.<br>Quelle est la probabilité de <b>ne pas</b> tirer une boule ${COUL[c].nom}&nbsp;?`, visual: urn(U.balls),
      hint: `Calcule P(${COUL[c].nom}), puis utilise P(non A) = 1 − P(A). Ou compte directement les boules qui ne sont pas ${COUL[c].noms}.`,
      solution: `P(${COUL[c].nom}) = ${F(U.effs[j], U.N)}, donc P(pas ${COUL[c].nom}) = 1 − ${F(U.effs[j], U.N)} = ${FRs(U.N - U.effs[j], U.N)}.` };
  }
  if (v === 2) {
    const k = ri(1, 19) * 5 + (d >= 3 && chance(.5) ? ri(1, 4) : 0), p = k / 100, C = pick(CTX11);
    const model = range(1, 100).map(i => i <= k);
    return { type: 'nums', tpl: 'Réponse : {0}', keys: COMMA, check: numCheck((100 - k) / 100, [[p, "C'est la probabilité de l'événement lui-même : on demande le <b>contraire</b>."], [100 - k, 'Une probabilité est entre 0 et 1 : écris-la en nombre décimal (pas en %).']]),
      value: model.filter(x => !x).length / 100,
      html: `La probabilité ${C[0]} est ${M(p)}.<br>Quelle est la probabilité ${C[1]} ? (écriture décimale)`,
      visual: probaBar([{ l: 'A', v: p, txt: M(p) }, { l: 'non A', v: 1 - p, txt: '?' }]),
      hint: `P(non A) = 1 − P(A) = 1 − ${M(p)}.`,
      solution: `1 − ${M(p)} = <b>${M((100 - k) / 100)}</b>.` };
  }
  // v = 3 : trois couleurs, la troisième probabilité se déduit des deux autres
  let b1, b2, a1, a2, L; do { b1 = pick([2, 3, 4, 5, 6]); b2 = pick([3, 4, 5, 6, 8]); a1 = ri(1, b1 - 1); a2 = ri(1, b2 - 1); L = b1 * b2 / gcd(b1, b2); } while (L > 30 || a1 / b1 + a2 / b2 >= 1 - 1e-9 || gcd(a1, b1) > 1 || gcd(a2, b2) > 1 || b1 === b2);
  const nR = L * a1 / b1, nV = L * a2 / b2, model = [...Array(nR).fill('R'), ...Array(nV).fill('V'), ...Array(L - nR - nV).fill('B')];
  const num = b1 * b2 - a1 * b2 - a2 * b1, den = b1 * b2;
  return { type: 'frac', check: probCheck(num, den, [[1 - a1 / b1, 'Il y a <b>trois</b> couleurs : enlève les deux probabilités connues.'], [1 - a2 / b2, 'Il y a <b>trois</b> couleurs : enlève les deux probabilités connues.']]),
    value: model.filter(c => c === 'B').length / model.length,
    html: `Une urne contient des boules rouges, vertes et bleues. On tire une boule au hasard.<br>P(rouge) = ${F(a1, b1)} et P(verte) = ${F(a2, b2)}. Quelle est la probabilité de tirer une boule <b>bleue</b>&nbsp;?`,
    visual: probaBar([{ l: 'rouge', v: a1 / b1, txt: `${a1}/${b1}` }, { l: 'verte', v: a2 / b2, txt: `${a2}/${b2}` }, { l: 'bleue', v: 1 - a1 / b1 - a2 / b2, txt: '?' }]),
    hint: `La somme des probabilités de toutes les issues vaut 1. Mets ${F(a1, b1)} et ${F(a2, b2)} au même dénominateur.`,
    solution: `1 − ${F(a1, b1)} − ${F(a2, b2)} = ${F(L, L)} − ${F(nR, L)} − ${F(nV, L)} = ${FRs(L - nR - nV, L)}.` };
}
function C11() {
  return `<h2>11. Événement contraire</h2>
<p class="intro">Il est parfois plus simple de calculer la probabilité que quelque chose <b>ne</b> se produise <b>pas</b>, puis d'en déduire celle qu'on cherche.</p>
<div class="def">L'événement <b>contraire</b> de A, noté « non A » (ou Ā), est réalisé quand A ne l'est pas.<br><b>P(non A) = 1 − P(A)</b>. La somme des probabilités de toutes les issues vaut 1.</div>
${probaBar([{ l: 'A', v: 0.3, txt: '0,3' }, { l: 'non A', v: 0.7, txt: '0,7' }])}
<div class="methode"><b>Méthode</b><ol><li>Repère l'événement contraire (« ne pas… », « pas de… »).</li><li>Calcule 1 − P(A) : avec une fraction, écris 1 = ${F('n', 'n')} ; avec un décimal, calcule directement.</li><li>S'il y a plusieurs issues, enlève à 1 toutes les probabilités connues.</li></ol></div>
<div class="ex"><span class="q">Exemple 1 : P(pluie) = 0,3.</span><br>P(pas de pluie) = 1 − 0,3 = <b>0,7</b>.</div>
<div class="ex"><span class="q">Exemple 2 : urne de 7 boules dont 2 rouges.</span><br>P(rouge) = ${F(2, 7)}, donc P(pas rouge) = 1 − ${F(2, 7)} = ${F(7, 7)} − ${F(2, 7)} = <b>${F(5, 7)}</b>.</div>
<div class="ex"><span class="q">Exemple 3 : trois couleurs. P(rouge) = ${F(1, 4)}, P(verte) = ${F(1, 3)}. P(bleue) ?</span><br>Même dénominateur 12 : 1 − ${F(3, 12)} − ${F(4, 12)} = ${F(12, 12)} − ${F(7, 12)} = <b>${F(5, 12)}</b>.</div>
<div class="warn">⚠️ Une probabilité ne dépasse jamais 1 : si P(A) + P(non A) ne fait pas 1, il y a une erreur.<br>⚠️ Lis bien la question : on demande souvent le <b>contraire</b>, pas l'événement donné.<br>⚠️ Une probabilité s'écrit en fraction ou en décimal (0,7), pas « 70 » !</div>
<div class="retenir">À retenir : P(non A) = 1 − P(A).</div>`;
}

/* ===================================================================== 12. deux épreuves (arbres) et défis */
function twoDraws(r, b, remise) {
  const balls = [...Array(r).fill('R'), ...Array(b).fill('B')], out = [];
  balls.forEach((x, i) => balls.forEach((y, j) => { if (remise || i !== j) out.push(x + y); }));
  return out; // tous les couples ordonnés équiprobables
}
function urnTree(r, b, remise) {
  const n = r + b, m = remise ? n : n - 1;
  return (hl = [], all = true) => tree(
    [{ l: 'R', p: [r, n] }, { l: 'B', p: [b, n] }],
    [[{ l: 'R', p: all ? [remise ? r : r - 1, m] : '?' }, { l: 'B', p: all ? [b, m] : '?' }], [{ l: 'R', p: all ? [r, m] : '?' }, { l: 'B', p: all ? [remise ? b : b - 1, m] : '?' }]],
    { hl });
}
function L12(d) {
  const v = d < 1 ? 0 : d < 2 ? 1 : d < 3 ? 2 : ri(3, 6);
  if (v <= 3) {
    const remise = v < 2, r = ri(remise ? 1 : 2, 4), b = ri(remise ? 1 : 2, 4), n = r + b, m = remise ? n : n - 1;
    const T = urnTree(r, b, remise), om = twoDraws(r, b, remise), tot = n * m;
    const q = v === 0 ? pick(['RR', 'BB']) : v === 1 ? 'mix' : v === 2 ? pick(['RR', 'BB']) : pick(['mix', 'atl']);
    const pRR = r * (remise ? r : r - 1), pBB = b * (remise ? b : b - 1), pRB = r * b;
    const fav = q === 'RR' ? pRR : q === 'BB' ? pBB : q === 'mix' ? 2 * pRB : tot - pBB;
    const cnt = om.filter(x => (q === 'mix' ? x[0] !== x[1] : q === 'atl' ? x.includes('R') : x === q)).length;
    const hl = q === 'mix' ? ['RB', 'BR'] : q === 'atl' ? ['RR', 'RB', 'BR'] : [q];
    const lab = { RR: 'deux boules rouges', BB: 'deux boules bleues', mix: 'une boule de chaque couleur', atl: 'au moins une boule rouge' }[q];
    const near = [];
    if (q === 'mix') near.push([pRB / tot, `Il y a <b>deux chemins</b> : (R ; B) et (B ; R). L'ordre compte : additionne les deux.`]);
    if (!remise && (q === 'RR' || q === 'BB')) near.push([(q === 'RR' ? r * r : b * b) / (n * n), `Tirage <b>sans remise</b> : au 2<sup>e</sup> tirage, il ne reste que ${n - 1} boules (et une ${q === 'RR' ? 'rouge' : 'bleue'} de moins).`]);
    if (q === 'RR' || q === 'BB') near.push([2 * (q === 'RR' ? r : b) / n, 'Sur un chemin, on <b>multiplie</b> les probabilités (on n\'additionne pas).']);
    if (q === 'atl') near.push([pRR / tot, '«&nbsp;Au moins une rouge&nbsp;» : (R ; R), (R ; B) et (B ; R). Pense à l\'événement contraire : (B ; B).']);
    const nm = prenom();
    return { type: 'frac', check: probCheck(fav, tot, near), value: cnt / om.length,
      html: `Une urne contient ${r} boule${r > 1 ? 's' : ''} rouge${r > 1 ? 's' : ''} (R) et ${b} boule${b > 1 ? 's' : ''} bleue${b > 1 ? 's' : ''} (B). ${nm} tire une boule, note sa couleur, ${remise ? '<b>la remet</b> dans l\'urne' : '<b>ne la remet pas</b>'}, puis tire une deuxième boule.<br>Quelle est la probabilité d'obtenir <b>${lab}</b>&nbsp;?`,
      visual: urn([...Array(r).fill({ c: 'R' }), ...Array(b).fill({ c: 'B' })]) + T([], v < 2), afterVisual: T(hl, true), replaceVisual: true,
      hint: `${v >= 2 ? `Complète l'arbre : sans remise, au 2<sup>e</sup> tirage il reste ${n - 1} boules. ` : ''}La probabilité d'un chemin est le <b>produit</b> des probabilités sur ses branches.${q === 'mix' || q === 'atl' ? ' Si plusieurs chemins conviennent, on <b>additionne</b> leurs probabilités.' : ''}`,
      solution: (q === 'RR' || q === 'BB' ? `P(${q[0]} ; ${q[1]}) = ${F(q === 'RR' ? r : b, n)} × ${F(q === 'RR' ? (remise ? r : r - 1) : (remise ? b : b - 1), m)} = ${FRs(fav, tot)}.`
        : q === 'mix' ? `P(R ; B) + P(B ; R) = ${F(r, n)} × ${F(b, m)} + ${F(b, n)} × ${F(r, m)} = ${F(pRB, tot)} + ${F(pRB, tot)} = ${FRs(fav, tot)}.`
          : `Événement contraire : (B ; B), de probabilité ${F(b, n)} × ${F(remise ? b : b - 1, m)} = ${F(pBB, tot)}. Donc P = 1 − ${F(pBB, tot)} = ${FRs(fav, tot)}.`) };
  }
  if (v === 4) { // somme de deux dés
    const s = ri(3, 11), c = 6 - Math.abs(s - 7);
    const om = []; for (let i = 1; i <= 6; i++) for (let j = 1; j <= 6; j++) om.push(i + j);
    return { type: 'frac', check: probCheck(c, 36, [[1 / 11, '⚠️ Les 11 sommes possibles (2 à 12) ne sont pas équiprobables ! Il faut compter les 36 couples (dé 1 ; dé 2).']]), value: om.filter(x => x === s).length / om.length,
      html: `Défi : on lance deux dés équilibrés à 6 faces et on additionne les deux nombres obtenus.<br>Quelle est la probabilité d'obtenir une somme égale à <b>${s}</b>&nbsp;?`, visual: twoDice(ri(1, 6), ri(1, 6)), afterVisual: sumTable(s), replaceVisual: true,
      hint: `Il y a 6 × 6 = 36 couples (dé 1 ; dé 2) équiprobables. Fais un tableau à double entrée des sommes et compte les cases qui valent ${s}.`,
      solution: `${c} couples sur 36 donnent ${s} : ${range(1, 6).filter(i => s - i >= 1 && s - i <= 6).map(i => `(${i} ; ${s - i})`).join(', ')}. Probabilité : ${FRs(c, 36)}.` };
  }
  if (v === 5) { // note manquante pour atteindre une moyenne
    const n = ri(3, 5), target = ri(10, 15), notes = spread(target * n - ri(target - 6, Math.min(20, target + 5)), n, 5, 20);
    const X = target * (n + 1) - sum(notes);
    if (X < 0 || X > 20) return L12(d);
    let found = null; for (let x = 0; x <= 20; x++) if (approx(rawMean([...notes, x]), target)) found = x; // recherche exhaustive
    return { type: 'nums', tpl: 'Note : {0}', check: numCheck(X, [[target, 'Avoir la note égale à la moyenne visée ne suffit pas si les autres notes sont trop basses : calcule le total nécessaire.'], [target * n - sum(notes), `Avec la nouvelle note, il y aura <b>${n + 1}</b> notes.`]]), value: found,
      html: `Défi : ${prenom()} a obtenu ${notes.join(' ; ')} à ses ${n} premiers contrôles (notes sur 20). Quelle note lui faut-il au prochain contrôle pour avoir exactement <b>${target}</b> de moyenne&nbsp;?`,
      visual: tiles([...notes, '?'], { hl: [n], label: 'notes (la dernière est à trouver)' }),
      hint: `Pour avoir ${target} de moyenne sur ${n + 1} notes, il faut un total de ${target} × ${n + 1}. Retire la somme des notes déjà obtenues.`,
      solution: `Total nécessaire : ${target} × ${n + 1} = ${target * (n + 1)}. Somme actuelle : ${notes.join(' + ')} = ${sum(notes)}. Note : ${target * (n + 1)} − ${sum(notes)} = <b>${X}</b>.` };
  }
  // v = 6 : pièce lancée deux fois
  const om = ['PP', 'PF', 'FP', 'FF'], q = pick(['two', 'one', 'atl']), cnt = om.filter(x => (q === 'two' ? x === 'PP' : q === 'one' ? x[0] !== x[1] : x.includes('P'))).length;
  const fav = q === 'two' ? 1 : q === 'one' ? 2 : 3;
  return { type: 'frac', check: probCheck(fav, 4, [[1 / 3, '⚠️ Les 3 résultats «&nbsp;2 piles&nbsp;», «&nbsp;2 faces&nbsp;», «&nbsp;1 de chaque&nbsp;» ne sont pas équiprobables : l\'arbre a 4 chemins.']]), value: cnt / om.length,
    html: `Défi : on lance deux fois une pièce équilibrée (P = pile, F = face).<br>Quelle est la probabilité d'obtenir <b>${q === 'two' ? 'deux fois pile' : q === 'one' ? 'exactement une fois pile' : 'au moins une fois pile'}</b>&nbsp;?`,
    visual: tree([{ l: 'P', p: [1, 2] }, { l: 'F', p: [1, 2] }], [[{ l: 'P', p: [1, 2] }, { l: 'F', p: [1, 2] }], [{ l: 'P', p: [1, 2] }, { l: 'F', p: [1, 2] }]]),
    afterVisual: tree([{ l: 'P', p: [1, 2] }, { l: 'F', p: [1, 2] }], [[{ l: 'P', p: [1, 2] }, { l: 'F', p: [1, 2] }], [{ l: 'P', p: [1, 2] }, { l: 'F', p: [1, 2] }]], { hl: om.filter(x => (q === 'two' ? x === 'PP' : q === 'one' ? x[0] !== x[1] : x.includes('P'))) }), replaceVisual: true,
    hint: 'L\'arbre a 4 chemins équiprobables, chacun de probabilité ½ × ½ = ¼. Compte les chemins qui conviennent.',
    solution: `Chemins qui conviennent : ${om.filter(x => (q === 'two' ? x === 'PP' : q === 'one' ? x[0] !== x[1] : x.includes('P'))).map(x => `(${x[0]} ; ${x[1]})`).join(', ')}. Probabilité : ${FRs(fav, 4)}.` };
}
function C12() {
  const T = urnTree(3, 2, false);
  return `<h2>12. Deux épreuves : arbres, et défis</h2>
<p class="intro">Quand on répète une expérience (deux tirages, deux lancers), un arbre permet de ne rater aucun cas et de calculer chaque probabilité.</p>
<div class="def">Pour une expérience à <b>deux épreuves</b>, on dessine un <b>arbre</b>. La probabilité d'un chemin est le <b>produit</b> des probabilités sur ses branches. Si plusieurs chemins réalisent l'événement, on <b>additionne</b> leurs probabilités.</div>
<p>Urne : 3 rouges et 2 bleues. On tire deux boules <b>sans remise</b> :</p>
${T(['RB', 'BR'])}
<div class="methode"><b>Méthode</b><ol><li>Dessine l'arbre : 1<sup>re</sup> épreuve, puis 2<sup>e</sup> épreuve au bout de chaque branche.</li><li>Sans remise : au 2<sup>e</sup> tirage, une boule de moins (et une de moins de la couleur tirée).</li><li>Probabilité d'un chemin : <b>multiplie</b> les probabilités de ses branches.</li><li>Plusieurs chemins conviennent : <b>additionne</b>. « Au moins un… » : pense à l'événement contraire.</li></ol></div>
<div class="ex"><span class="q">Exemple 1 : sans remise.</span><br>P(R ; R) = ${F(3, 5)} × ${F(2, 4)} = ${F(6, 20)} = ${F(3, 10)}.<br>P(une de chaque couleur) = P(R ; B) + P(B ; R) = ${F(3, 5)} × ${F(2, 4)} + ${F(2, 5)} × ${F(3, 4)} = ${F(6, 20)} + ${F(6, 20)} = <b>${F(3, 5)}</b>.</div>
<div class="ex"><span class="q">Exemple 2 : avec remise.</span><br>La 2<sup>e</sup> épreuve est identique à la 1<sup>re</sup> : P(R ; R) = ${F(3, 5)} × ${F(3, 5)} = <b>${F(9, 25)}</b>.</div>
<div class="cols">${petit(sumTable(7), 260)}<div class="ex"><span class="q">Exemple 3 : deux dés, somme égale à 7.</span><br>36 couples équiprobables ; 6 donnent 7 (les cases en couleur).<br>P = ${F(6, 36)} = <b>${F(1, 6)}</b>.</div></div>
<div class="ex"><span class="q">Exemple 4 (défi) : notes 12 ; 9 ; 14. Quelle 4<sup>e</sup> note pour avoir 12 de moyenne ?</span><br>Total nécessaire : 12 × 4 = 48. Déjà : 12 + 9 + 14 = 35. Note : 48 − 35 = <b>13</b>.</div>
<div class="warn">⚠️ L'ordre compte : (R ; B) et (B ; R) sont deux chemins différents. Ne pas en oublier un !<br>⚠️ Sans remise, au 2<sup>e</sup> tirage il y a une boule de moins. Et sur un chemin on multiplie, on n'additionne pas.<br>⚠️ Deux dés : les sommes 2 à 12 ne sont pas équiprobables ; on compte les 36 couples. Deux pièces : 4 chemins (PP, PF, FP, FF), pas 3.</div>
<div class="retenir">À retenir : sur un chemin on multiplie, entre plusieurs chemins on additionne.</div>`;
}

export const LEVELS = [
  { titre: 'Lire un diagramme en barres', generate: L1, cours: C1, classe: '5e' },
  { titre: 'Effectif total et fréquence', generate: L2, cours: C2, classe: '5e' },
  { titre: "Moyenne d'une liste", generate: L3, cours: C3, classe: '5e' },
  { titre: 'Moyenne pondérée', generate: L4, cours: C4, classe: '4e' },
  { titre: 'Médiane (nombre impair de valeurs)', generate: L5, cours: C5, classe: '4e' },
  { titre: 'Médiane (nombre pair de valeurs)', generate: L6, cours: C6, classe: '4e / 3e' },
  { titre: 'Étendue', generate: L7, cours: C7, classe: '3e' },
  { titre: 'Diagrammes circulaires et tableaux', generate: L8, cours: C8, classe: '5e / 4e' },
  { titre: 'Vocabulaire des probabilités', generate: L9, cours: C9, classe: '5e' },
  { titre: 'Calculer une probabilité', generate: L10, cours: C10, classe: '5e / 4e' },
  { titre: 'Événement contraire', generate: L11, cours: C11, classe: '4e' },
  { titre: 'Deux épreuves (arbres) et défis', generate: L12, cours: C12, classe: '3e' },
];
export const OPTIONS = { need: 4, keys: { neg: false } };

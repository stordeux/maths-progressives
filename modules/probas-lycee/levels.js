// Probabilités conditionnelles (1re – Tle) : 12 niveaux, du tableau croisé d'effectifs à la loi binomiale.
// Vérifications indépendantes (champs value / verify) : jamais la formule qui donne la réponse attendue.
//  - tableaux : on reconstruit la liste des individus et on RECOMPTE ceux qui réalisent l'événement ;
//  - arbres : on ÉNUMÈRE les 1 000 issues équiprobables d'un modèle « urne » (10 tickets pour la 1re épreuve,
//    100 pour la 2e) et on compte ; indépendance : on compare P_B(A) à P(A) sur ces issues ;
//  - lois : urne de 100 tickets (moyenne des tickets pour l'espérance) ;
//  - schéma de Bernoulli et loi binomiale : énumération des 10ⁿ tirages (n ≤ 3), des 2ⁿ chemins de l'arbre,
//    ou loi obtenue par convolution épreuve après épreuve (jamais la formule C(n, k) pᵏ (1 − p)ⁿ⁻ᵏ).
import { ri, pick, chance } from '../../engine/util/rand.js';
import { numsCheck, choiceCheck } from '../../engine/answers/checks.js';
import { M } from '../../engine/util/fmt.js';
import { r6 } from '../../engine/util/arith.js';
import { crossTable, ptree, lawChart, mosaic, venn, pascal } from './draw.js';

/* ================= écriture ================= */
const bar = s => `<span style="text-decoration:overline">${s}</span>`;
/** événement : 'A' ou '!A' (contraire) */
const ev = e => (e[0] === '!' ? bar(e.slice(1)) : e);
const neg = e => (e[0] === '!' ? e.slice(1) : '!' + e);
const Pr = s => `P(${s})`;
const Pc = (a, b) => `P<sub>${ev(a)}</sub>(${ev(b)})`;
const I = (a, b) => `${ev(a)} ∩ ${ev(b)}`;
const U = (a, b) => `${ev(a)} ∪ ${ev(b)}`;
const big = s => `<div class="big">${s}</div>`;
/** case de réponse : l'étiquette est groupée (le gabarit est un conteneur flex) */
const lab = s => `<span>${s} =</span> `;
const line = s => `<div class="stepline">${s}</div>`;
/** arrondi au millième écrit avec ses trois décimales : 0,990 */
const M3 = x => x.toFixed(3).replace('.', ',');
const near = (a, b, t = 1e-9) => a !== null && b !== null && Math.abs(a - b) <= t;
const sum = a => a.reduce((s, x) => s + x, 0);
/** coefficient binomial écrit en colonne */
const binom = (n, k) => `<span style="display:inline-flex;align-items:center;vertical-align:middle;white-space:nowrap"><span style="font-size:1.8em;font-weight:300;line-height:1">(</span><span style="display:inline-flex;flex-direction:column;align-items:center;line-height:1.15;font-size:.9em"><span>${n}</span><span>${k}</span></span><span style="font-size:1.8em;font-weight:300;line-height:1">)</span></span>`;
const pw = (x, n) => (n === 1 ? x : `${x}<sup>${n}</sup>`);
const COMMA = { comma: true, neg: false };

/** check « cases » avec un message ciblé quand la réponse est fausse */
const chk = (E, msg) => numsCheck(E, { msg: v => (v.some(x => x === null) ? '' : msg ? msg(v) || '' : '') });
/** cases avec tolérance (arrondi au millième) : ex = valeurs exactes, tol = tolérance par case */
function tolCheck(E, ex, tol, msg) {
  const fn = v => {
    const bad = E.map((e, i) => (v[i] !== null && v[i] !== undefined && Math.abs(v[i] - ex[i]) <= tol[i] + 1e-9 ? -1 : i)).filter(i => i >= 0);
    if (!bad.length) return { ok: true };
    return { ok: false, bad, msg: msg && v.every(x => x !== null) ? msg(v, bad) || '' : '' };
  };
  fn.expected = E;
  return fn;
}
/** étapes : la première étape fausse est signalée ; extra(v) précise l'erreur de la dernière étape */
function stepChk(E, labels, extra) {
  const fn = v => {
    const i = E.findIndex((e, k) => !near(v[k], e));
    if (i < 0) return { ok: true };
    const x = i === E.length - 1 && extra && v[i] !== null ? extra(v[i]) : '';
    return { ok: false, bad: [i], msg: x || `Erreur à l'étape ${i + 1} : ${labels[i]}.${i ? " Les étapes d'avant sont justes." : ''}` };
  };
  fn.expected = E;
  return fn;
}

/* ================= tableaux croisés ================= */
// Contextes : une ligne R / R̄ et des colonnes C / C̄ (2 colonnes) ou trois événements (3 colonnes).
const TCTX = [
  { intro: N => `On a interrogé ${N} élèves d'un lycée. On choisit l'un d'eux au hasard.`, R: 'S', dR: "l'élève pratique un sport en club",
    c2: { e: 'F', d: "l'élève est une fille" }, c3: [{ e: 'I', d: 'interne' }, { e: 'E', d: 'externe' }, { e: 'D', d: 'demi-pensionnaire' }], c3d: "l'élève est" },
  { intro: N => `Une usine a fabriqué ${N} pièces. On prélève une pièce au hasard.`, R: 'D', dR: 'la pièce est défectueuse',
    c2: { e: 'A', d: "la pièce vient de l'atelier A (sinon, de l'atelier B)" }, c3: [{ e: 'A', d: 'machine A' }, { e: 'B', d: 'machine B' }, { e: 'C', d: 'machine C' }], c3d: 'la pièce vient de la' },
  { intro: N => `On a interrogé ${N} personnes. On choisit l'une d'elles au hasard.`, R: 'V', dR: 'la personne est vaccinée contre la grippe',
    c2: { e: 'G', d: 'la personne a eu la grippe cet hiver' }, c3: [{ e: 'J', d: 'moins de 30 ans' }, { e: 'A', d: 'de 30 à 60 ans' }, { e: 'S', d: 'plus de 60 ans' }], c3d: 'la personne a' },
  { intro: N => `Un magasin a reçu ${N} clients samedi. On choisit un client au hasard.`, R: 'C', dR: 'le client a une carte de fidélité',
    c2: { e: 'P', d: 'le client achète un produit en promotion' }, c3: [{ e: 'M', d: 'le matin' }, { e: 'A', d: "l'après-midi" }, { e: 'S', d: 'le soir' }], c3d: 'le client est venu' },
];
const NICE = [10, 20, 25, 40, 50, 100, 125, 200, 250, 500];
const niceIn = (N, lo, hi) => pick(NICE.filter(x => x >= lo * N && x <= hi * N));
/**
 * Tableau 2 × nc d'effectifs ; N divise 1 000 (toute fréquence k / N a au plus 3 décimales).
 * o.row / o.col : indice de la ligne / colonne dont l'effectif doit aussi diviser 1 000 (pour diviser par lui).
 */
function mkTable(d, nc, o = {}) {
  for (;;) {
    const N = pick(d < 2 ? [50, 100, 200] : [100, 200, 250, 500]);
    const R = [0, 0];
    if (o.row !== undefined) R[o.row] = niceIn(N, 0.2, 0.8); else R[0] = ri(Math.ceil(0.25 * N), Math.floor(0.75 * N));
    if (o.row === 1) R[0] = N - R[1]; else R[1] = N - R[0];
    const C = Array(nc).fill(0), m = Math.ceil(0.15 * N);
    if (o.col !== undefined) C[o.col] = niceIn(N, 0.2, nc === 2 ? 0.8 : 0.6);
    const free = C.map((c, j) => j).filter(j => j !== o.col);
    let rest = N - sum(C);
    free.forEach((j, k) => { C[j] = k === free.length - 1 ? rest : ri(m, rest - m * (free.length - 1 - k)); rest -= C[j]; });
    if (C.some(c => c < m)) continue;
    const cells = [[], []];
    let r0 = R[0], r1 = R[1], ok = true;
    for (let j = 0; j < nc - 1; j++) {
      const lo = Math.max(2, C[j] - r1 + 2), hi = Math.min(C[j] - 2, r0 - 2);
      if (lo > hi) { ok = false; break; }
      const x = ri(lo, hi);
      cells[0][j] = x; cells[1][j] = C[j] - x; r0 -= x; r1 -= C[j] - x;
    }
    if (!ok || r0 < 2 || r1 < 2) continue;
    cells[0][nc - 1] = r0; cells[1][nc - 1] = r1;
    return { N, R, C, cells, nc };
  }
}
/** liste des individus (vérification : on recompte) */
const people = T => T.cells.flatMap((row, i) => row.flatMap((n, j) => Array(n).fill({ r: i, c: j })));
const cnt = (pp, f) => pp.filter(f).length;
/** événements lignes et colonnes : { t: étiquette, f: prédicat, n: effectif, i | j } */
function events(ctx, T) {
  const rows = [{ t: ctx.R, f: p => p.r === 0, n: T.R[0], i: 0 }, { t: '!' + ctx.R, f: p => p.r === 1, n: T.R[1], i: 1 }];
  const cols = T.nc === 2 ? [{ t: ctx.c2.e, f: p => p.c === 0, n: T.C[0], j: 0 }, { t: '!' + ctx.c2.e, f: p => p.c === 1, n: T.C[1], j: 1 }]
    : ctx.c3.map((c, j) => ({ t: c.e, f: p => p.c === j, n: T.C[j], j }));
  return { rows, cols };
}
const legendT = (ctx, T) => `${ctx.intro(T.N)}<br>${ctx.R} : «&nbsp;${ctx.dR}&nbsp;» ; `
  + (T.nc === 2 ? `${ctx.c2.e} : «&nbsp;${ctx.c2.d}&nbsp;».` : ctx.c3.map(c => `${c.e} : «&nbsp;${ctx.c3d} ${c.d}&nbsp;»`).join(' ; ') + '.');
const tableOf = (ctx, T, o = {}) => { const E = events(ctx, T); return crossTable({ rows: E.rows.map(e => ev(e.t)), cols: E.cols.map(e => ev(e.t)), cells: T.cells, ...o }); };
const fr = (k, N) => M(r6(k / N));

/* ===================================================================== 1. probabilité d'un événement */
function L1(d) {
  const ctx = pick(TCTX), nc = d >= 3 ? 3 : 2, T = mkTable(d, nc), E = events(ctx, T), pp = people(T);
  const tot = d < 2 || (d >= 3 && chance(0.5));
  const X = d < 1 ? pick([E.rows[0], E.cols[0]]) : d < 2 ? pick([E.rows[1], E.cols[1]]) : pick([...E.rows, ...E.cols]);
  const isRow = X.i !== undefined, ans = r6(X.n / T.N);
  const hl = isRow ? [[X.i, nc]] : [[2, X.j]];
  const parts = isRow ? T.cells[X.i] : [T.cells[0][X.j], T.cells[1][X.j]];
  return {
    type: 'nums', keys: COMMA,
    html: `${legendT(ctx, T)}<br>Calcule <b>${Pr(ev(X.t))}</b>.`,
    visual: tableOf(ctx, T, { tot }), afterVisual: tableOf(ctx, T, { tot: true, hl: [...hl, [2, nc]] }), replaceVisual: true,
    tpl: lab(Pr(ev(X.t))) + '{0}',
    check: chk([ans], v => {
      if (v[0] > 1) return `Une probabilité est comprise entre 0 et 1 : il faut diviser l'effectif de ${ev(X.t)} par l'effectif total ${T.N}.`;
      if (parts.some(c => near(v[0], r6(c / T.N)))) return `Ce n'est qu'une case du tableau : ${ev(X.t)} regroupe toute ${isRow ? 'la ligne' : 'la colonne'}.`;
      return '';
    }),
    value: cnt(pp, X.f) / pp.length,
    hint: `Les ${T.N} issues sont équiprobables : ${Pr(ev(X.t))} = (effectif de ${ev(X.t)}) ÷ (effectif total).${tot ? '' : ' Ajoute d\'abord les cases de ' + (isRow ? 'la ligne' : 'la colonne') + '.'}`,
    solution: `Effectif de ${ev(X.t)} : ${parts.join(' + ')} = ${X.n}.<br>${Pr(ev(X.t))} = ${X.n} ÷ ${T.N} = <b>${M(ans)}</b>.`,
  };
}
/* exemple commun aux encarts 1 à 3 : 200 élèves, S « sport en club », F « fille » */
const TEX = { N: 200, R: [80, 120], C: [90, 110], cells: [[30, 50], [60, 60]], nc: 2 };
const MOS = o => mosaic({ rows: ['S', '!S'], cols: ['F', '!F'], cells: TEX.cells, ...o });
function C1() {
  return `<h2>1. Tableau croisé d'effectifs</h2>
<p class="intro">Un tableau croisé range une population selon deux critères. Il permet de calculer des probabilités en <b>comptant</b>.</p>
<div class="def">On choisit <b>au hasard</b> un individu parmi N : toutes les issues sont <b>équiprobables</b>.<br>Pour un événement A : <b>P(A) = (effectif de A) ÷ N</b>.<br>Le <b>contraire</b> de A se note ${bar('A')} (« non A ») : P(${bar('A')}) = 1 − P(A).</div>
<div class="methode"><b>Méthode</b><ol>
<li>Repère la <b>ligne</b> ou la <b>colonne</b> de l'événement (S, ${bar('S')}, F, ${bar('F')}… ; avec trois colonnes, même chose).</li>
<li>Si les totaux manquent, <b>additionne</b> toutes les cases de cette ligne (ou colonne).</li>
<li>Divise par l'effectif <b>total</b> N (la case en bas à droite).</li>
<li>Vérifie : le résultat est entre 0 et 1.</li></ol></div>
<div class="cols">${tableOf(TCTX[0], TEX, { hl: [[0, 2], [2, 2]] })}${MOS({ hlRow: 0 })}</div>
<div class="ex"><span class="q">Exemple 1 : 200 élèves ; S : « pratique un sport en club » ; F : « est une fille ». Calcule P(S).</span><br>Total de la ligne S : 80.<br>P(S) = 80 ÷ 200 = <b>0,4</b>. Sur le carré, la bande S occupe 40 % de l'aire.</div>
<div class="ex"><span class="q">Exemple 2 : sans la ligne Total, calcule P(${bar('F')}).</span><br>Colonne ${bar('F')} : 50 + 60 = 110.<br>P(${bar('F')}) = 110 ÷ 200 = <b>0,55</b>.<br>Contrôle : P(F) = 90 ÷ 200 = 0,45 et 1 − 0,45 = 0,55. ✔</div>
<div class="warn">⚠️ Une seule case ne suffit pas : l'événement regroupe <b>toute la ligne</b> (ou toute la colonne).<br>⚠️ On divise par l'effectif <b>total</b>, pas par un autre total.<br>⚠️ Un résultat plus grand que 1 signale une division oubliée ou à l'envers.</div>
<div class="retenir">À retenir : P(A) = effectif de A ÷ effectif total, toujours entre 0 et 1.</div>`;
}

/* ===================================================================== 2. intersection et réunion */
function L2(d) {
  const ctx = pick(TCTX), nc = d >= 4 && chance(0.5) ? 3 : 2, T = mkTable(d, nc), E = events(ctx, T), pp = people(T);
  const v = d < 2 ? 0 : d < 4 ? 1 : 2;
  const A = d < 1 || nc === 3 ? E.rows[v === 2 ? ri(0, 1) : 0] : pick(E.rows);
  const B = d < 1 ? E.cols[0] : pick(E.cols);
  const inter = T.cells[A.i][B.j], union = A.n + B.n - inter;
  const isU = v === 1 ? true : v === 2 ? chance(0.6) : false;
  const ans = r6((isU ? union : inter) / T.N), sym = isU ? U(A.t, B.t) : I(A.t, B.t);
  const hl = isU ? [...T.cells[A.i].map((_, j) => [A.i, j]), [1 - A.i, B.j]] : [[A.i, B.j]];
  return {
    type: 'nums', keys: COMMA,
    html: `${legendT(ctx, T)}<br>Calcule <b>${Pr(sym)}</b>${isU ? ` (${ev(A.t)} <b>ou</b> ${ev(B.t)})` : ` (${ev(A.t)} <b>et</b> ${ev(B.t)})`}.`,
    visual: tableOf(ctx, T), afterVisual: tableOf(ctx, T, { hl }), replaceVisual: true,
    tpl: lab(Pr(sym)) + '{0}',
    check: chk([ans], x => {
      if (isU && near(x[0], r6((A.n + B.n) / T.N))) return `Les individus de ${I(A.t, B.t)} ont été comptés <b>deux fois</b> : il faut retirer ${Pr(I(A.t, B.t))}.`;
      if (isU && near(x[0], r6(inter / T.N))) return `Ça, c'est ${Pr(I(A.t, B.t))} (« et »). « Ou » : l'un, l'autre, ou les deux.`;
      if (!isU && near(x[0], r6(union / T.N))) return `Ça, c'est ${Pr(U(A.t, B.t))} (« ou »). Ici on veut « et » : une seule case.`;
      if (!isU && (near(x[0], r6(inter / A.n)) || near(x[0], r6(inter / B.n)))) return `Divise par l'effectif <b>total</b> ${T.N}, pas par celui d'une ligne ou d'une colonne.`;
      return '';
    }),
    value: cnt(pp, p => (isU ? A.f(p) || B.f(p) : A.f(p) && B.f(p))) / pp.length,
    hint: isU ? `${Pr(U(A.t, B.t))} = ${Pr(ev(A.t))} + ${Pr(ev(B.t))} − ${Pr(I(A.t, B.t))} : on ne compte pas deux fois la case commune.`
      : `${I(A.t, B.t)} : les individus qui sont à la fois dans ${ev(A.t)} et dans ${ev(B.t)}. C'est la case au croisement de la ligne et de la colonne.`,
    solution: isU ? `${Pr(U(A.t, B.t))} = ${Pr(ev(A.t))} + ${Pr(ev(B.t))} − ${Pr(I(A.t, B.t))} = ${fr(A.n, T.N)} + ${fr(B.n, T.N)} − ${fr(inter, T.N)} = <b>${M(ans)}</b>.<br>(Effectif : ${A.n} + ${B.n} − ${inter} = ${union}, et ${union} ÷ ${T.N} = ${M(ans)}.)`
      : `Case au croisement de ${ev(A.t)} et ${ev(B.t)} : ${inter} individus.<br>${Pr(I(A.t, B.t))} = ${inter} ÷ ${T.N} = <b>${M(ans)}</b>.`,
  };
}
function C2() {
  return `<h2>2. Intersection et réunion</h2>
<p class="intro">« Et », « ou » : deux petits mots qui changent tout. Le tableau et le diagramme de Venn montrent quels individus compter.</p>
<div class="def"><b>A ∩ B</b> (« A <b>et</b> B ») : les individus qui sont dans A et dans B à la fois. Dans le tableau, c'est <b>une case</b>.<br><b>A ∪ B</b> (« A <b>ou</b> B ») : ceux qui sont dans au moins l'un des deux.<br><b>P(A ∪ B) = P(A) + P(B) − P(A ∩ B)</b>.</div>
<div class="methode"><b>Méthode</b><ol>
<li>« Et » (∩) : lis la case au croisement de la ligne et de la colonne, puis divise par N.</li>
<li>« Ou » (∪) : calcule P(A) et P(B) (totaux de ligne et de colonne).</li>
<li>Additionne-les, puis <b>retire</b> P(A ∩ B), comptée deux fois.</li>
<li>Contrôle avec les effectifs : (effectif de A + effectif de B − case commune) ÷ N.</li></ol></div>
<div class="cols">${venn({ la: 'S', lb: 'F', a: 50, b: 60, ab: 30, out: 60, shade: 'inter', cap: 'S ∩ F : 30 élèves' })}${venn({ la: 'S', lb: 'F', a: 50, b: 60, ab: 30, out: 60, shade: 'union', cap: 'S ∪ F : 50 + 30 + 60 = 140' })}</div>
${tableOf(TCTX[0], TEX, { hl: [[0, 0]] })}
<div class="ex"><span class="q">Exemple 1 : calcule P(S ∩ F).</span><br>Case S, F : 30 élèves.<br>P(S ∩ F) = 30 ÷ 200 = <b>0,15</b>.</div>
<div class="ex"><span class="q">Exemple 2 : calcule P(S ∪ F), puis P(${bar('S')} ∪ F).</span><br>P(S ∪ F) = 0,4 + 0,45 − 0,15 = <b>0,7</b> (effectif : 80 + 90 − 30 = 140).<br>P(${bar('S')} ∪ F) = 120 ÷ 200 + 90 ÷ 200 − 60 ÷ 200 = 0,6 + 0,45 − 0,3 = <b>0,75</b>.</div>
<div class="warn">⚠️ Dans P(A) + P(B), la case A ∩ B est comptée <b>deux fois</b> : on la retire une fois.<br>⚠️ « Ou » n'est pas exclusif : A ∪ B contient aussi ceux qui sont dans A <b>et</b> dans B.<br>⚠️ Pour A ∩ B, on divise par l'effectif <b>total</b>, pas par celui d'une ligne ou d'une colonne.</div>
<div class="retenir">À retenir : « et » = une case ; « ou » = P(A) + P(B) − P(A ∩ B).</div>`;
}

/* ===================================================================== 3. probabilité conditionnelle dans un tableau */
function L3(d) {
  const ctx = pick(TCTX), nc = d >= 3 && chance(0.6) ? 3 : 2;
  const onRow = d < 1 ? true : d < 2 ? false : chance(0.5);
  const idx = d < 2 ? 0 : nc === 3 && !onRow ? ri(0, 2) : ri(0, 1);
  const T = mkTable(d, nc, onRow ? { row: idx } : { col: idx }), E = events(ctx, T), pp = people(T);
  const A = onRow ? E.rows[idx] : E.cols[idx];
  const B = onRow ? (d < 2 ? E.cols[0] : pick(E.cols)) : (d < 2 ? E.rows[0] : pick(E.rows));
  const ia = onRow ? A.i : B.i, jb = onRow ? B.j : A.j, inter = T.cells[ia][jb], ans = r6(inter / A.n);
  const tot = d < 4 || chance(0.5);
  const hl = onRow ? [[ia, jb], [ia, nc]] : [[ia, jb], [2, jb]];
  return {
    type: 'nums', keys: COMMA,
    html: `${legendT(ctx, T)}<br>Calcule <b>${Pc(A.t, B.t)}</b>, la probabilité de ${ev(B.t)} <b>sachant</b> ${ev(A.t)}.`,
    visual: tableOf(ctx, T, { tot }), afterVisual: tableOf(ctx, T, { tot: true, hl }), replaceVisual: true,
    tpl: lab(Pc(A.t, B.t)) + '{0}',
    check: chk([ans], x => {
      if (near(x[0], r6(inter / T.N))) return `Ça, c'est ${Pr(I(A.t, B.t))}. « Sachant ${ev(A.t)} » : on ne regarde que les ${A.n} individus de ${ev(A.t)}.`;
      if (near(x[0], r6(inter / B.n))) return `Tu as divisé par l'effectif de ${ev(B.t)} : c'est ${Pc(B.t, A.t)}. Ici, on se place <b>parmi les ${ev(A.t)}</b>.`;
      if (x[0] > 1) return 'Une probabilité est comprise entre 0 et 1.';
      return '';
    }),
    value: cnt(pp, p => A.f(p) && B.f(p)) / cnt(pp, A.f),
    hint: `« Sachant ${ev(A.t)} » : la population devient l'ensemble des individus de ${ev(A.t)} (${onRow ? 'sa ligne' : 'sa colonne'}). Parmi eux, combien réalisent ${ev(B.t)}&nbsp;?`,
    solution: `Parmi les ${A.n} individus de ${ev(A.t)}, ${inter} réalisent ${ev(B.t)}.<br>${Pc(A.t, B.t)} = ${inter} ÷ ${A.n} = <b>${M(ans)}</b>.<br>Autre écriture : ${Pc(A.t, B.t)} = ${Pr(I(A.t, B.t))} ÷ ${Pr(ev(A.t))}.`,
  };
}
function C3() {
  return `<h2>3. Probabilité conditionnelle</h2>
<p class="intro">Parfois, on sait déjà quelque chose sur l'individu choisi. La population se <b>réduit</b> : on ne regarde plus que ceux qui vérifient cette information.</p>
<div class="def">Si P(A) ≠ 0, la probabilité de B <b>sachant</b> A est<br><b>${Pc('A', 'B')} = P(A ∩ B) ÷ P(A)</b>.<br>Dans un tableau : ${Pc('A', 'B')} = (effectif de A ∩ B) ÷ (effectif de A).</div>
<div class="methode"><b>Méthode</b><ol>
<li>Lis l'événement en <b>indice</b> : c'est la nouvelle population (« sachant A »).</li>
<li>Trouve son effectif : le total de sa ligne ou de sa colonne (additionne si le total manque).</li>
<li>Dans cette ligne (ou colonne), lis la case de l'autre événement.</li>
<li>Divise la case par l'effectif de l'indice.</li></ol></div>
<div class="cols">${tableOf(TCTX[0], TEX, { hl: [[0, 0], [0, 2]] })}${MOS({ frame: 0, hl: [[0, 0]] })}</div>
<div class="ex"><span class="q">Exemple 1 : calcule ${Pc('S', 'F')}.</span><br>« Sachant S » : on ne garde que les 80 élèves de la ligne S (cadre en pointillés).<br>Parmi eux, 30 sont des filles : ${Pc('S', 'F')} = 30 ÷ 80 = <b>0,375</b>.</div>
<div class="ex"><span class="q">Exemple 2 : calcule ${Pc('!S', 'F')}, puis compare ${Pc('S', 'F')} et ${Pc('F', 'S')}.</span><br>Ligne ${bar('S')} : 120 élèves, dont 60 filles : ${Pc('!S', 'F')} = 60 ÷ 120 = <b>0,5</b>.<br>Colonne F : 90 filles, dont 30 sportives : ${Pc('F', 'S')} = 30 ÷ 90 ≈ 0,333. Ce n'est pas ${Pc('S', 'F')} = 0,375&nbsp;!</div>
<div class="warn">⚠️ ${Pc('A', 'B')} ≠ P(A ∩ B) : on ne divise <b>pas</b> par l'effectif total.<br>⚠️ ${Pc('A', 'B')} ≠ ${Pc('B', 'A')} en général : la lettre en indice dit <b>par quel effectif on divise</b>.</div>
<div class="retenir">À retenir : « sachant A » : on divise par l'effectif de A, pas par N.</div>`;
}

/* ================= arbres pondérés ================= */
// a = P(A) en dixièmes, b = P_A(B) et c = P_Ā(B) en centièmes : tout produit a au plus 3 décimales.
const TRC = [
  { A: 'M', B: 'T', intro: 'On choisit au hasard une personne qui passe un test de dépistage.', dA: 'la personne est malade', dB: 'le test est positif' },
  { A: 'R', B: 'S', intro: 'On choisit au hasard un élève qui a passé un contrôle.', dA: "l'élève a révisé", dB: "l'élève a réussi le contrôle" },
  { A: 'P', B: 'R', intro: "On choisit au hasard un jour d'école.", dA: 'il pleut', dB: 'le bus est en retard' },
  { A: 'A', B: 'D', intro: 'Une usine fabrique des pièces sur deux machines A et B. On prélève une pièce au hasard.', dA: 'la pièce vient de la machine A (sinon, de la machine B)', dB: 'la pièce est défectueuse' },
  { A: 'F', B: 'C', intro: "On choisit au hasard un client d'un magasin.", dA: 'le client a une carte de fidélité', dB: 'le client achète un produit en promotion' },
];
function genTree(d) {
  const g = () => (d < 1 ? 10 * ri(1, 9) : d < 3 ? 5 * ri(1, 19) : ri(5, 95));
  let b, c;
  do { b = g(); c = g(); } while (b === c);
  return { a: ri(2, 8), b, c };
}
/** probabilités (en nombres) des six branches ; clés 'A', '!A', 'A.B', 'A.!B', '!A.B', '!A.!B' */
const tv = T => ({ A: T.a / 10, '!A': r6(1 - T.a / 10), 'A.B': T.b / 100, 'A.!B': r6(1 - T.b / 100), '!A.B': T.c / 100, '!A.!B': r6(1 - T.c / 100) });
/** probabilité d'un chemin en millièmes (entier) */
const path1000 = (T, kA, kB) => (kA === 'A' ? T.a : 10 - T.a) * (kB === 'B' ? (kA === 'A' ? T.b : T.c) : 100 - (kA === 'A' ? T.b : T.c));
const sib = k => (k.includes('.') ? k.split('.')[0] + '.' + neg(k.split('.')[1]) : neg(k));
/** nom affiché d'une clé générique ('!A' → '!M' dans le contexte dépistage) */
const nm = (ctx, k) => (k[0] === '!' ? '!' : '') + ctx[k.replace('!', '')];
/** étiquette « P(Ā) » ou « P_A(B̄) » d'une branche */
const brLab = (ctx, k) => (k.includes('.') ? Pc(nm(ctx, k.split('.')[0]), nm(ctx, k.split('.')[1])) : Pr(ev(nm(ctx, k))));
const pathOf = (kA, kB) => (kA[0] === '!' ? '1' : '0') + (kB === undefined ? '' : kB[0] === '!' ? '1' : '0');
function mkTree(ctx, T, { hide = [], hl = [], vals = {} } = {}) {
  const v = tv(T), p = k => (hide.includes(k) ? '?' : M(v[k]));
  return ptree(['A', '!A'].map(kA => ({ e: nm(ctx, kA), p: p(kA), kids: ['B', '!B'].map(kB => ({ e: nm(ctx, kB), p: p(kA + '.' + kB) })) })), { hl, vals });
}
/** les 1 000 issues équiprobables : ticket i (sur 10) pour la 1re épreuve, ticket j (sur 100) pour la 2e */
function issues(T) {
  const out = [];
  for (let i = 0; i < 10; i++) for (let j = 0; j < 100; j++) { const A = i < T.a; out.push({ A, B: j < (A ? T.b : T.c) }); }
  return out;
}
/** l'issue o réalise-t-elle l'événement générique k ('A', '!B'…) ? */
const holds = (o, k) => o[k.replace('!', '')] === (k[0] !== '!');
const freq = (om, f) => om.filter(f).length / om.length;
const legendA = ctx => `${ctx.intro}<br>${ctx.A} : «&nbsp;${ctx.dA}&nbsp;» ; ${ctx.B} : «&nbsp;${ctx.dB}&nbsp;».`;
const P3 = x => M(r6(x / 1000));

/* ===================================================================== 4. compléter un arbre */
function L4(d) {
  const ctx = pick(TRC), T = genTree(d), v = tv(T), om = issues(T);
  const second = ['A.B', 'A.!B', '!A.B', '!A.!B'];
  let ask;
  if (d < 1) ask = [pick(['A', '!A'])];
  else if (d < 2) ask = [pick(second)];
  else if (d < 4) ask = [pick(['A', '!A']), pick(second)];
  else ask = [pick(['A', '!A']), pick(['A.B', 'A.!B']), pick(['!A.B', '!A.!B'])];
  const E = ask.map(k => v[k]);
  const name = k => brLab(ctx, k);
  const valOf = k => { const [x, y] = k.split('.'); return y ? freq(om, o => holds(o, x) && holds(o, y)) / freq(om, o => holds(o, x)) : freq(om, o => holds(o, x)); };
  return {
    type: 'nums', keys: COMMA,
    html: `${legendA(ctx)}<br>Complète l'arbre pondéré : calcule ${ask.map(k => `<b>${name(k)}</b>`).join(ask.length > 2 ? ', ' : ' et ').replace(/, (?=[^,]*$)/, ' et ')}.`,
    visual: mkTree(ctx, T, { hide: ask }), afterVisual: mkTree(ctx, T), replaceVisual: true,
    tpl: ask.map((k, i) => lab(name(k)) + `{${i}}`).join('<span class="sep"></span>'),
    check: chk(E, x => {
      const i = ask.findIndex((k, j) => !near(x[j], E[j]));
      if (i >= 0 && near(x[i], v[sib(ask[i])])) return `Tu as recopié la branche voisine. Les branches qui partent d'un <b>même nœud</b> ont une somme égale à <b>1</b>.`;
      if (i >= 0 && x[i] > 1) return 'Une probabilité est comprise entre 0 et 1.';
      return '';
    }),
    value: valOf(ask[ask.length - 1]),
    hint: 'La somme des probabilités des branches issues d\'un <b>même nœud</b> est égale à 1. Repère la branche voisine de chaque «&nbsp;?&nbsp;».',
    solution: ask.map(k => `${name(k)} = 1 − ${name(sib(k))} = 1 − ${M(v[sib(k)])} = <b>${M(v[k])}</b>`).join('<br>'),
  };
}
function C4() {
  const T = { a: 3, b: 80, c: 10 };
  return `<h2>4. Arbre pondéré</h2>
<p class="intro">Un arbre pondéré résume une situation en deux étapes : d'abord A ou ${bar('A')}, ensuite B ou ${bar('B')}. Bien le remplir, c'est la moitié du travail.</p>
<div class="def">Sur les branches du 1<sup>er</sup> niveau : P(A) et P(${bar('A')}).<br>Sur celles du 2<sup>e</sup> niveau : des probabilités <b>conditionnelles</b> ${Pc('A', 'B')}, ${Pc('A', '!B')}, ${Pc('!A', 'B')}, ${Pc('!A', '!B')}.<br><b>Règle des nœuds</b> : la somme des probabilités des branches issues d'un <b>même nœud</b> vaut <b>1</b>.</div>
<div class="methode"><b>Méthode</b><ol>
<li>Repère le nœud d'où part la branche « ? ».</li>
<li>Trouve sa <b>branche voisine</b> (même nœud, événement contraire).</li>
<li>Calcule : ? = 1 − (branche voisine).</li>
<li>Recommence pour chaque « ? » : chaque nœud se traite à part.</li></ol></div>
${mkTree({ A: 'A', B: 'B' }, T, { hide: ['!A', 'A.!B'] })}
<div class="ex"><span class="q">Exemple 1 : complète les deux « ? » de l'arbre.</span><br>Nœud de départ : P(${bar('A')}) = 1 − P(A) = 1 − 0,3 = <b>0,7</b>.<br>Nœud A : ${Pc('A', '!B')} = 1 − ${Pc('A', 'B')} = 1 − 0,8 = <b>0,2</b>.</div>
<div class="ex"><span class="q">Exemple 2 : on donne P(${bar('A')}) = 0,65, ${Pc('A', '!B')} = 0,12 et ${Pc('!A', 'B')} = 0,35. Complète l'arbre.</span><br>P(A) = 1 − 0,65 = <b>0,35</b> ; ${Pc('A', 'B')} = 1 − 0,12 = <b>0,88</b> ; ${Pc('!A', '!B')} = 1 − 0,35 = <b>0,65</b>.</div>
<div class="warn">⚠️ Ne recopie pas la branche voisine : on fait <b>1 − voisine</b>.<br>⚠️ ${Pc('A', 'B')} et ${Pc('!A', 'B')} ne partent <b>pas</b> du même nœud : leur somme ne vaut pas 1 en général.</div>
<div class="retenir">À retenir : à chaque nœud, les branches qui partent ont une somme égale à 1.</div>`;
}

/* ===================================================================== 5. probabilité d'un chemin */
function L5(d) {
  const ctx = pick(TRC), T = genTree(d), v = tv(T), om = issues(T);
  const kA = d < 1 ? 'A' : pick(['A', '!A']), kB = d < 1 ? 'B' : pick(['B', '!B']), k2 = kA + '.' + kB;
  const hide = d < 2 ? [] : d < 4 ? [pick([kA, k2])] : [kA, k2];
  const ans = P3(path1000(T, kA, kB)), a = v[kA], b = v[k2], sym = I(nm(ctx, kA), nm(ctx, kB)), path = pathOf(kA, kB);
  return {
    type: 'nums', keys: COMMA,
    html: `${legendA(ctx)}<br>Calcule <b>${Pr(sym)}</b>.`,
    visual: mkTree(ctx, T, { hide }), afterVisual: mkTree(ctx, T, { hl: [path], vals: { [path]: '= ' + ans } }), replaceVisual: true,
    tpl: lab(Pr(sym)) + '{0}',
    check: chk([r6(path1000(T, kA, kB) / 1000)], x => {
      if (near(x[0], r6(a + b))) return 'Le long d\'un chemin, on <b>multiplie</b> les probabilités (on n\'additionne pas).';
      if (near(x[0], b)) return `${M(b)}, c'est ${brLab(ctx, k2)} : la probabilité de ${ev(nm(ctx, kB))} <b>sachant</b> ${ev(nm(ctx, kA))}. Multiplie par ${Pr(ev(nm(ctx, kA)))}.`;
      if (hide.length && near(x[0], r6((hide.includes(kA) ? v[sib(kA)] : a) * (hide.includes(k2) ? v[sib(k2)] : b)))) return 'Tu as pris la branche voisine du « ? ». Complète d\'abord la branche manquante (somme = 1 à chaque nœud).';
      return '';
    }),
    value: freq(om, o => holds(o, kA) && holds(o, kB)),
    hint: `Suis le chemin ${ev(nm(ctx, kA))} → ${ev(nm(ctx, kB))} et <b>multiplie</b> les probabilités rencontrées : ${Pr(sym)} = ${Pr(ev(nm(ctx, kA)))} × ${brLab(ctx, k2)}.${hide.length ? ' Complète d\'abord les « ? ».' : ''}`,
    solution: `${hide.map(k => `${brLab(ctx, k)} = 1 − ${M(v[sib(k)])} = ${M(v[k])}.<br>`).join('')}${Pr(sym)} = ${Pr(ev(nm(ctx, kA)))} × ${brLab(ctx, k2)} = ${M(a)} × ${M(b)} = <b>${ans}</b>.`,
  };
}
function C5() {
  const T = { a: 3, b: 80, c: 10 };
  return `<h2>5. Probabilité d'un chemin</h2>
<p class="intro">Chaque chemin de l'arbre (de la racine à une feuille) correspond à une intersection, comme A ∩ B ou ${bar('A')} ∩ ${bar('B')}.</p>
<div class="def">La probabilité d'un chemin est le <b>produit</b> des probabilités de ses branches :<br><b>P(A ∩ B) = P(A) × ${Pc('A', 'B')}</b>.<br>C'est la définition ${Pc('A', 'B')} = P(A ∩ B) ÷ P(A), «&nbsp;retournée&nbsp;».</div>
<div class="methode"><b>Méthode</b><ol>
<li>Repère le chemin : 1<sup>re</sup> lettre de l'intersection, puis la 2<sup>e</sup>.</li>
<li>S'il y a des « ? » sur ce chemin, complète-les d'abord (1 − branche voisine).</li>
<li><b>Multiplie</b> les deux probabilités rencontrées.</li></ol></div>
${mkTree({ A: 'A', B: 'B' }, T, { hl: ['00', '11'], vals: { '00': '= 0,24', 11: '= 0,63' } })}
<div class="ex"><span class="q">Exemple 1 : calcule P(A ∩ B).</span><br>Chemin A puis B : P(A ∩ B) = P(A) × ${Pc('A', 'B')} = 0,3 × 0,8 = <b>0,24</b>.</div>
<div class="ex"><span class="q">Exemple 2 : on ne connaît que P(A) = 0,3 et ${Pc('!A', 'B')} = 0,1. Calcule P(${bar('A')} ∩ ${bar('B')}).</span><br>D'abord les branches manquantes : P(${bar('A')}) = 1 − 0,3 = 0,7 et ${Pc('!A', '!B')} = 1 − 0,1 = 0,9.<br>P(${bar('A')} ∩ ${bar('B')}) = 0,7 × 0,9 = <b>0,63</b>.</div>
<div class="warn">⚠️ Sur un chemin, on <b>multiplie</b> : on n'additionne pas.<br>⚠️ ${Pc('A', 'B')} (une branche) n'est pas P(A ∩ B) (le chemin entier) : multiplie par P(A).<br>⚠️ Pour un « ? », prends 1 − voisine, pas la branche voisine elle-même.</div>
<div class="retenir">À retenir : probabilité d'un chemin = produit des probabilités de ses branches.</div>`;
}

/* ===================================================================== 6. probabilités totales */
function L6(d) {
  const ctx = pick(TRC), T = genTree(d), v = tv(T), om = issues(T);
  const tB = d < 4 ? 'B' : pick(['B', '!B']);
  const pool = ['A', '!A', 'A.' + tB, '!A.' + tB];
  const hide = d < 1 ? [] : d < 2 ? ['!A'] : d < 4 ? (chance(0.6) ? [pick(pool)] : []) : [pick(['A', '!A']), pick(['A.' + tB, '!A.' + tB])];
  const x1 = path1000(T, 'A', tB), x2 = path1000(T, '!A', tB), tot = x1 + x2, ans = r6(tot / 1000);
  const B = nm(ctx, tB), A = nm(ctx, 'A');
  const steps = d < 2;
  const sB = ev(B), lab1 = Pr(I(A, B)), lab2 = Pr(I(neg(A), B));
  const extra = y => {
    if (near(y, r6(v['A.' + tB] + v['!A.' + tB]))) return `On n'additionne pas ${Pc(A, B)} et ${Pc(neg(A), B)} : on additionne les probabilités des <b>chemins</b> (produits).`;
    if (near(y, r6(x1 / 1000)) || near(y, r6(x2 / 1000))) return `Il y a <b>deux chemins</b> qui mènent à ${sB} : ajoute leurs probabilités.`;
    return '';
  };
  return {
    type: steps ? 'steps' : 'nums', keys: COMMA,
    html: `${legendA(ctx)}<br>Calcule <b>${Pr(sB)}</b>.`,
    visual: mkTree(ctx, T, { hide }),
    afterVisual: mkTree(ctx, T, { hl: [pathOf('A', tB), pathOf('!A', tB)], vals: { [pathOf('A', tB)]: '= ' + P3(x1), [pathOf('!A', tB)]: '= ' + P3(x2) } }), replaceVisual: true,
    tpl: steps ? line(lab(lab1) + '{0}') + line(lab(lab2) + '{1}') + line(lab(Pr(sB)) + '{2}') : lab(Pr(sB)) + '{0}',
    check: steps ? stepChk([r6(x1 / 1000), r6(x2 / 1000), ans], [`${lab1} = ${Pr(ev(A))} × ${Pc(A, B)}`, `${lab2} = ${Pr(ev(neg(A)))} × ${Pc(neg(A), B)}`, `${Pr(sB)} est la somme des deux`], extra)
      : chk([ans], x => extra(x[0])),
    value: freq(om, o => holds(o, tB)),
    hint: `Deux chemins mènent à ${sB} : ${ev(A)} puis ${sB}, et ${ev(neg(A))} puis ${sB}. Calcule chaque chemin (produit), puis <b>additionne</b>.${hide.length ? ' Complète d\'abord les « ? ».' : ''}`,
    solution: `${hide.map(k => `${brLab(ctx, k)} = 1 − ${M(v[sib(k)])} = ${M(v[k])}.<br>`).join('')}Formule des probabilités totales :<br>${Pr(sB)} = ${lab1} + ${lab2}<br>= ${M(v.A)} × ${M(v['A.' + tB])} + ${M(v['!A'])} × ${M(v['!A.' + tB])}<br>= ${P3(x1)} + ${P3(x2)} = <b>${M(ans)}</b>.`,
  };
}
function C6() {
  const T = { a: 3, b: 80, c: 10 };
  return `<h2>6. Formule des probabilités totales</h2>
<p class="intro">B peut arriver de deux façons : avec A, ou avec ${bar('A')}. Pour avoir P(B), on rassemble les deux.</p>
<div class="def">A et ${bar('A')} partagent toutes les issues en deux (on dit qu'ils forment une <b>partition</b>). Donc :<br><b>P(B) = P(A ∩ B) + P(${bar('A')} ∩ B)</b><br><b>= P(A) × ${Pc('A', 'B')} + P(${bar('A')}) × ${Pc('!A', 'B')}</b>.<br>Sur l'arbre : on additionne les probabilités de <b>tous les chemins</b> qui mènent à B.</div>
<div class="methode"><b>Méthode</b><ol>
<li>Complète les « ? » éventuels (règle des nœuds).</li>
<li>Repère les <b>deux chemins</b> qui finissent par B (ou par ${bar('B')} si on demande P(${bar('B')})).</li>
<li>Calcule chaque chemin : un <b>produit</b>.</li>
<li><b>Additionne</b> les deux résultats.</li></ol></div>
${mkTree({ A: 'A', B: 'B' }, T, { hl: ['00', '10'], vals: { '00': '= 0,24', 10: '= 0,07' } })}
<div class="ex"><span class="q">Exemple 1 : calcule P(B).</span><br>P(A ∩ B) = 0,3 × 0,8 = 0,24 ; P(${bar('A')} ∩ B) = 0,7 × 0,1 = 0,07.<br>P(B) = 0,24 + 0,07 = <b>0,31</b>.</div>
<div class="ex"><span class="q">Exemple 2 : calcule P(${bar('B')}).</span><br>Chemins A → ${bar('B')} et ${bar('A')} → ${bar('B')} : P(${bar('B')}) = 0,3 × 0,2 + 0,7 × 0,9 = 0,06 + 0,63 = <b>0,69</b>.<br>Contrôle : 1 − P(B) = 1 − 0,31 = 0,69. ✔</div>
<div class="warn">⚠️ P(B) n'est pas ${Pc('A', 'B')} + ${Pc('!A', 'B')} : chaque chemin est d'abord un <b>produit</b>.<br>⚠️ Un seul chemin ne suffit pas : <b>deux chemins</b> mènent à B.</div>
<div class="retenir">À retenir : P(B) = somme des probabilités de tous les chemins qui mènent à B.</div>`;
}

/* ===================================================================== 7. inverser le conditionnement */
// Données choisies pour que P_B(A) = P(A ∩ B) ÷ P(B) tombe juste (au plus 3 décimales) : liste construite une fois.
const BAYES = {};
function bayesList(tB) {
  if (BAYES[tB]) return BAYES[tB];
  const out = [];
  for (let a = 2; a <= 8; a++) for (let b = 5; b <= 95; b++) for (let c = 5; c <= 95; c++) {
    if (b === c) continue;
    const T = { a, b, c }, num = path1000(T, 'A', tB), den = num + path1000(T, '!A', tB), r = num / den;
    if ((num * 1000) % den === 0 && r >= 0.05 && r <= 0.95) out.push(T);
  }
  return (BAYES[tB] = out);
}
function L7(d) {
  const ctx = pick(TRC), tB = d < 4 ? 'B' : '!B', kA = d < 2 ? 'A' : pick(['A', '!A']);
  const all = bayesList(tB), easy = all.filter(T => T.b % 5 === 0 && T.c % 5 === 0);
  const T = { ...pick(d < 2 && easy.length ? easy : all) }, v = tv(T), om = issues(T);
  const hide = d >= 1 && chance(0.5) ? [pick(['!A', 'A.' + neg(tB), '!A.' + neg(tB)])] : [];
  const inter = path1000(T, kA, tB), pB = inter + path1000(T, neg(kA), tB), ans = r6(inter / pB);
  const A = nm(ctx, kA), B = nm(ctx, tB);
  const labs = [Pr(I(A, B)), Pr(ev(B)), Pc(B, A)];
  return {
    type: 'steps', keys: COMMA,
    html: `${legendA(ctx)}<br>On sait que ${ev(B)} est réalisé. Calcule <b>${Pc(B, A)}</b>, la probabilité de ${ev(A)} sachant ${ev(B)}.`,
    visual: mkTree(ctx, T, { hide }),
    afterVisual: mkTree(ctx, T, { hl: [pathOf(kA, tB), pathOf(neg(kA), tB)], vals: { [pathOf(kA, tB)]: '= ' + P3(inter), [pathOf(neg(kA), tB)]: '= ' + P3(pB - inter) } }), replaceVisual: true,
    tpl: line(lab(labs[0]) + '{0}') + line(lab(labs[1]) + '{1}') + line(lab(labs[2]) + '{2}'),
    check: stepChk([r6(inter / 1000), r6(pB / 1000), ans], [`${labs[0]} est le produit sur le chemin ${ev(A)} → ${ev(B)}`, `${labs[1]} s'obtient par les probabilités totales (deux chemins)`, `${labs[2]} = ${labs[0]} ÷ ${labs[1]}`], y => {
      if (near(y, v[(kA[0] === '!' ? '!A' : 'A') + '.' + tB])) return `${M(y)}, c'est ${Pc(A, B)} (lu sur l'arbre). On veut l'inverse : ${Pc(B, A)} = ${labs[0]} ÷ ${labs[1]}.`;
      if (near(y, r6(pB / inter))) return 'Division à l\'envers : on divise P(A ∩ B) par P(B).';
      return '';
    }),
    value: freq(om, o => holds(o, kA) && holds(o, tB)) / freq(om, o => holds(o, tB)),
    hint: `${Pc(B, A)} = ${labs[0]} ÷ ${labs[1]}. Le numérateur est un chemin ; le dénominateur s'obtient en additionnant les deux chemins qui mènent à ${ev(B)}.`,
    solution: `${hide.map(k => `${brLab(ctx, k)} = 1 − ${M(v[sib(k)])} = ${M(v[k])}.<br>`).join('')}${labs[0]} = ${M(v[kA])} × ${M(v[kA + '.' + tB])} = ${P3(inter)}.<br>${labs[1]} = ${P3(inter)} + ${M(v[neg(kA)])} × ${M(v[neg(kA) + '.' + tB])} = ${P3(inter)} + ${P3(pB - inter)} = ${P3(pB)}.<br>${labs[2]} = ${P3(inter)} ÷ ${P3(pB)} = <b>${M(ans)}</b>.`,
  };
}
function C7() {
  const T = { a: 2, b: 90, c: 5 };
  return `<h2>7. Inverser le conditionnement</h2>
<p class="intro">L'arbre donne ${Pc('A', 'B')} : « d'abord A, ensuite B ». Mais on demande souvent l'inverse : sachant que B s'est produit, quelle est la probabilité de A ?</p>
<div class="def">On revient à la définition : <b>${Pc('B', 'A')} = P(A ∩ B) ÷ P(B)</b>.<br>• P(A ∩ B) : un <b>chemin</b> (produit) ;<br>• P(B) : <b>probabilités totales</b> (somme de deux chemins).</div>
<div class="methode"><b>Méthode</b> (trois cases à remplir)<ol>
<li>P(A ∩ B) : produit sur le chemin A → B.</li>
<li>P(B) : ce chemin + l'autre chemin qui mène à B.</li>
<li>${Pc('B', 'A')} = (étape 1) ÷ (étape 2). Le chemin est au <b>numérateur</b>.</li></ol>
Même méthode si on demande ${Pc('B', '!A')} ou ${Pc('!B', 'A')} : remplace les lettres.</div>
${mkTree({ A: 'M', B: 'T' }, T, { hl: ['00', '10'], vals: { '00': '= 0,18', 10: '= 0,04' } })}
<div class="ex"><span class="q">Exemple 1 : dépistage, P(M) = 0,2, ${Pc('M', 'T')} = 0,9, ${Pc('!M', 'T')} = 0,05. Calcule ${Pc('T', 'M')}.</span><br>P(M ∩ T) = 0,2 × 0,9 = 0,18 ; P(T) = 0,18 + 0,8 × 0,05 = 0,22.<br>${Pc('T', 'M')} = 0,18 ÷ 0,22 ≈ <b>0,818</b> : un test positif ne veut pas dire « malade à coup sûr ».</div>
<div class="ex"><span class="q">Exemple 2 : le test est négatif. Calcule ${Pc('!T', 'M')}.</span><br>P(M ∩ ${bar('T')}) = 0,2 × 0,1 = 0,02 ; P(${bar('T')}) = 0,02 + 0,8 × 0,95 = 0,78.<br>${Pc('!T', 'M')} = 0,02 ÷ 0,78 ≈ <b>0,026</b> : un test négatif rassure beaucoup.</div>
<div class="warn">⚠️ ${Pc('T', 'M')} n'est pas ${Pc('M', 'T')} (lu sur l'arbre) : ce ne sont pas les mêmes personnes au dénominateur.<br>⚠️ Ne divise pas à l'envers : P(A ∩ B) ÷ P(B), et le résultat reste entre 0 et 1.</div>
<div class="retenir">À retenir : ${Pc('B', 'A')} = P(A ∩ B) ÷ P(B), avec P(B) par les probabilités totales.</div>`;
}

/* ===================================================================== 8. indépendance */
const YN = [{ v: 'oui', l: 'Oui, A et B sont indépendants' }, { v: 'non', l: 'Non, A et B ne sont pas indépendants' }];
const ynOpts = (a, b) => YN.map(o => ({ v: o.v, l: o.l.replace('A et B', `${ev(a)} et ${ev(b)}`) }));
function L8(d) {
  const v = d < 2 ? 0 : d < 4 ? 1 : 2, indep = chance(0.5);
  if (v === 0) { // A et B indépendants : P(A ∩ B) = P(A) × P(B)
    const ctx = pick(TRC), b = d < 1 ? 10 * ri(1, 9) : ri(5, 95), T = { a: ri(2, 8), b, c: b }, om = issues(T), A = ctx.A, B = ctx.B;
    const ans = P3(T.a * b);
    return {
      type: 'nums', keys: COMMA,
      html: `${legendA(ctx)}<br>On admet que ${A} et ${B} sont <b>indépendants</b>, avec P(${A}) = ${M(T.a / 10)} et P(${B}) = ${M(b / 100)}.<br>Calcule <b>${Pr(I(A, B))}</b>.`,
      visual: mkTree(ctx, T, { hide: ['A.!B', '!A.!B'] }), afterVisual: mkTree(ctx, T, { hl: ['00'], vals: { '00': '= ' + ans } }), replaceVisual: true,
      tpl: lab(Pr(I(A, B))) + '{0}',
      check: chk([r6(T.a * b / 1000)], x => {
        if (near(x[0], r6(T.a / 10 + b / 100))) return 'Indépendants : on <b>multiplie</b> P(A) et P(B).';
        if (near(x[0], r6(T.a / 10 + b / 100 - T.a * b / 1000))) return `Ça, c'est ${Pr(U(A, B))}. On demande ${Pr(I(A, B))}.`;
        return '';
      }),
      value: freq(om, o => o.A && o.B),
      hint: `Indépendants signifie ${Pc(A, B)} = P(${B}) : savoir que ${A} est réalisé ne change rien pour ${B}. Alors P(${A} ∩ ${B}) = P(${A}) × P(${B}).`,
      solution: `${A} et ${B} indépendants : ${Pr(I(A, B))} = P(${A}) × P(${B}) = ${M(T.a / 10)} × ${M(b / 100)} = <b>${ans}</b>.<br>Sur l'arbre : ${Pc(A, B)} = ${Pc('!' + A, B)} = P(${B}) = ${M(b / 100)}.`,
    };
  }
  if (v === 1) { // tableau d'effectifs, indépendants ou non
    const ctx = pick(TCTX);
    let T;
    for (;;) {
      T = mkTable(d, 2);
      const t = T.R[0] * T.C[0] / T.N;
      if (indep) {
        if (!Number.isInteger(t)) continue;
        const c00 = t, c01 = T.R[0] - t, c10 = T.C[0] - t, c11 = T.N - T.R[0] - T.C[0] + t;
        if (Math.min(c00, c01, c10, c11) < 2) continue;
        T.cells = [[c00, c01], [c10, c11]];
      } else if (T.cells[0][0] * T.N === T.R[0] * T.C[0]) continue;
      break;
    }
    const E = events(ctx, T), A = E.rows[0], B = E.cols[0], pp = people(T), inter = T.cells[0][0];
    const pa = r6(A.n / T.N), pb = r6(B.n / T.N), pi = r6(inter / T.N), prod = r6(pa * pb);
    const Ek = indep ? 'oui' : 'non';
    return {
      type: 'choice', opts: ynOpts(A.t, B.t),
      html: `${legendT(ctx, T)}<br>Les événements <b>${A.t} et ${B.t} sont-ils indépendants</b>&nbsp;?`,
      visual: tableOf(ctx, T), afterVisual: tableOf(ctx, T, { hl: [[0, 0], [0, 2], [2, 0], [2, 2]] }), replaceVisual: true,
      check: choiceCheck(Ek, { msg: () => `Calcule P(${A.t}) × P(${B.t}) et compare-le à P(${A.t} ∩ ${B.t}).` }),
      expected: Ek,
      verify: e => { const sa = cnt(pp, p => A.f(p) && B.f(p)) / cnt(pp, B.f), s = cnt(pp, A.f) / pp.length; return (e === 'oui') === (Math.abs(sa - s) < 1e-12); },
      hint: `${A.t} et ${B.t} sont indépendants quand <b>P(${A.t} ∩ ${B.t}) = P(${A.t}) × P(${B.t})</b>. Calcule les deux nombres.`,
      solution: `P(${A.t}) = ${A.n} ÷ ${T.N} = ${M(pa)} ; P(${B.t}) = ${B.n} ÷ ${T.N} = ${M(pb)}.<br>P(${A.t}) × P(${B.t}) = ${M(prod)} et P(${A.t} ∩ ${B.t}) = ${inter} ÷ ${T.N} = ${M(pi)}.<br>${indep ? `Égalité : <b>oui</b>, ${A.t} et ${B.t} sont indépendants.` : `${M(prod)} ≠ ${M(pi)} : <b>non</b>, ils ne sont pas indépendants.`}`,
    };
  }
  // v = 2 : sur un arbre (P_A(B) et P_Ā(B))
  const ctx = pick(TRC), a = ri(2, 8), b = 5 * ri(1, 19);
  let c = b;
  if (!indep) do { c = 5 * ri(1, 19); } while (c === b);
  const T = { a, b, c }, om = issues(T), A = ctx.A, B = ctx.B, Ek = indep ? 'oui' : 'non', pB = P3(path1000(T, 'A', 'B') + path1000(T, '!A', 'B'));
  return {
    type: 'choice', opts: ynOpts(A, B),
    html: `${legendA(ctx)}<br>D'après l'arbre, les événements <b>${A} et ${B} sont-ils indépendants</b>&nbsp;?`,
    visual: mkTree(ctx, T), afterVisual: mkTree(ctx, T, { hl: ['00', '10'] }), replaceVisual: true,
    check: choiceCheck(Ek, { msg: () => `Calcule P(${B}) par les probabilités totales et compare-la à ${Pc(A, B)}.` }),
    expected: Ek,
    verify: e => { const pa = freq(om, o => o.A), pb = freq(om, o => o.B), pab = freq(om, o => o.A && o.B); return (e === 'oui') === (Math.abs(pab - pa * pb) < 1e-12); },
    hint: `${A} et ${B} sont indépendants quand ${Pc(A, B)} = P(${B}). Calcule P(${B}) avec les deux chemins qui mènent à ${B}.`,
    solution: `P(${B}) = ${M(a / 10)} × ${M(b / 100)} + ${M(r6(1 - a / 10))} × ${M(c / 100)} = ${pB}.<br>${Pc(A, B)} = ${M(b / 100)}. ${indep ? `Égalité : savoir que ${A} est réalisé ne change pas la probabilité de ${B}. <b>Oui</b>, indépendants.` : `${M(b / 100)} ≠ ${pB} : <b>non</b>, ${A} et ${B} ne sont pas indépendants.`}`,
  };
}
function C8() {
  return `<h2>8. Indépendance</h2>
<p class="intro">Deux événements sont indépendants quand l'un n'apporte <b>aucune information</b> sur l'autre : le savoir ne change rien.</p>
<div class="def">A et B (avec P(A) ≠ 0) sont <b>indépendants</b> quand ${Pc('A', 'B')} = P(B).<br>Cela revient à : <b>P(A ∩ B) = P(A) × P(B)</b>.</div>
<div class="methode"><b>Méthode</b><ol>
<li>On sait qu'ils sont indépendants : P(A ∩ B) = P(A) × P(B) (on <b>multiplie</b>).</li>
<li>Tableau : calcule P(A), P(B), P(A ∩ B), puis compare P(A) × P(B) et P(A ∩ B).</li>
<li>Arbre : calcule P(B) par les probabilités totales et compare-la à ${Pc('A', 'B')}.</li>
<li>Égalité : indépendants. Sinon : pas indépendants.</li></ol></div>
${mosaic({ rows: ['S', '!S'], cols: ['F', '!F'], cells: [[20, 60], [30, 90]], hl: [[0, 0], [1, 0]] })}
<p>Dans ce carré, F occupe <b>25 %</b> de chaque bande : savoir S ou ${bar('S')} ne change pas la part de F. Même idée sur l'arbre : ${Pc('A', 'B')} = ${Pc('!A', 'B')} = 0,3, donc P(B) = 0,3.</p>
${mkTree({ A: 'A', B: 'B' }, { a: 4, b: 30, c: 30 })}
<div class="ex"><span class="q">Exemple 1 : A et B sont indépendants, P(A) = 0,4 et P(B) = 0,3. Calcule P(A ∩ B).</span><br>P(A ∩ B) = P(A) × P(B) = 0,4 × 0,3 = <b>0,12</b>.</div>
<div class="ex"><span class="q">Exemple 2 : 200 élèves, 80 dans S, 50 dans F, 20 dans S ∩ F. Indépendants&nbsp;?</span><br>P(S) × P(F) = 0,4 × 0,25 = 0,1 et P(S ∩ F) = 20 ÷ 200 = 0,1 : égalité, <b>oui</b>.</div>
<div class="ex"><span class="q">Exemple 3 : P(A) = 0,4, ${Pc('A', 'B')} = 0,3, ${Pc('!A', 'B')} = 0,5. Indépendants&nbsp;?</span><br>P(B) = 0,4 × 0,3 + 0,6 × 0,5 = 0,42 ≠ 0,3 = ${Pc('A', 'B')} : <b>non</b>.</div>
<div class="warn">⚠️ Indépendants : on <b>multiplie</b> P(A) et P(B). La somme P(A) + P(B) n'est pas P(A ∩ B).<br>⚠️ Indépendants ne veut pas dire incompatibles (A ∩ B vide) ! Deux événements incompatibles de probabilités non nulles ne sont jamais indépendants.</div>
<div class="retenir">À retenir : A et B indépendants ⟺ P(A ∩ B) = P(A) × P(B).</div>`;
}

/* ===================================================================== 9. variable aléatoire : loi, espérance */
const VCTX = [
  { intro: "On choisit au hasard une famille d'un village. X est le nombre d'enfants de la famille.", xs: [0, 1, 2, 3, 4], t: "nombre d'enfants" },
  { intro: 'On choisit au hasard un match d\'une équipe de football. X est le nombre de buts marqués.', xs: [0, 1, 2, 3], t: 'nombre de buts' },
  { intro: 'On choisit au hasard un avis laissé par un client. X est le nombre d\'étoiles (de 1 à 5).', xs: [1, 2, 3, 4, 5], t: "nombre d'étoiles" },
];
/** partage de 100 tickets en k paquets (multiples de « pas »), chacun au moins égal à min */
function split100(k, step, min) {
  const p = Array(k).fill(min);
  for (let r = (100 - k * min) / step; r > 0; r--) p[ri(0, k - 1)] += step;
  return p;
}
const lawTable = (xs, cells, xl = 'x<sub>i</sub>', pl = 'P(X = x<sub>i</sub>)') => `<div class="tablewrap"><table class="data"><tr><th>${xl}</th>${xs.map(x => `<td>${M(x)}</td>`).join('')}</tr><tr><th>${pl}</th>${cells.map(c => `<td>${c}</td>`).join('')}</tr></table></div>`;
function L9(d) {
  const v = d < 1 ? 0 : d < 3 ? 1 : d < 4 ? 2 : pick([2, 3]);
  if (v === 3) { // jeu : gain algébrique
    const mise = pick([2, 3, 4, 5]), lots = pick([[0, 5, 10], [0, 4, 20], [0, 2, 10], [0, 5, 50], [0, 3, 8, 20]]);
    const k = lots.length, counts = split100(k, 1, 4).sort((x, y) => y - x);
    const urn = lots.flatMap((g, i) => Array(counts[i]).fill(g - mise)), xs = lots.map(g => g - mise), ps = counts.map(c => c / 100);
    const ans = r6(sum(xs.map((x, i) => x * counts[i])) / 100);
    return {
      type: 'nums', keys: { comma: true, neg: true },
      html: `Une loterie : on paie <b>${mise} €</b> pour jouer, puis on gagne ${lots.slice(1).map(M).join(' €, ')} € ou rien, avec les probabilités du tableau.<br>G est le <b>gain algébrique</b> (lot moins mise). Calcule l'<b>espérance</b> E(G).`,
      visual: lawTable(lots, ps.map(M), 'lot (€)', 'probabilité') + lawChart({ xs, ps, xTitle: 'gain G (en €)' }),
      tpl: lab('E(G)') + '{0} €',
      check: chk([ans], x => {
        if (near(x[0], r6(ans + mise))) return `C'est l'espérance du <b>lot</b> : il faut retirer la mise de ${mise} € (G = lot − ${mise}).`;
        if (near(x[0], r6(sum(xs) / k))) return 'L\'espérance n\'est pas la moyenne simple des valeurs : chaque valeur est <b>pondérée</b> par sa probabilité.';
        return '';
      }),
      value: sum(urn) / urn.length,
      hint: `G prend les valeurs ${xs.map(M).join(' ; ')} (lot − ${mise}). E(G) = somme des produits « valeur × probabilité ».`,
      solution: `E(G) = ${xs.map((x, i) => `${x < 0 ? '(' + M(x) + ')' : M(x)} × ${M(ps[i])}`).join(' + ')} = <b>${M(ans)} €</b>.<br>${ans < 0 ? 'Espérance négative : en moyenne, le joueur perd de l\'argent.' : ans > 0 ? 'Espérance positive : le jeu est favorable au joueur.' : 'Espérance nulle : le jeu est équitable.'}`,
    };
  }
  const ctx = pick(VCTX), xs = ctx.xs, k = xs.length, counts = split100(k, d < 2 ? 5 : 1, 5);
  const urn = xs.flatMap((x, i) => Array(counts[i]).fill(x)), ps = counts.map(c => c / 100);
  if (v === 0) { // probabilité manquante
    const u = ri(0, k - 1), ans = r6(1 - sum(ps.filter((_, i) => i !== u)));
    return {
      type: 'nums', keys: COMMA,
      html: `${ctx.intro}<br>Voici la loi de X, où il manque une probabilité. Calcule <b>P(X = ${xs[u]})</b>.`,
      visual: lawTable(xs, ps.map((p, i) => (i === u ? '<b style="color:#d6336c">?</b>' : M(p)))) + lawChart({ xs, ps, unk: u, xTitle: ctx.t }),
      afterVisual: lawTable(xs, ps.map(M)) + lawChart({ xs, ps, hl: [u], show: true, xTitle: ctx.t }), replaceVisual: true,
      tpl: lab(`P(X = ${xs[u]})`) + '{0}',
      check: chk([ans], x => (x[0] > 1 ? 'Une probabilité est comprise entre 0 et 1.' : '')),
      value: urn.filter(x => x === xs[u]).length / urn.length,
      hint: 'La somme de toutes les probabilités de la loi vaut <b>1</b>.',
      solution: `P(X = ${xs[u]}) = 1 − (${ps.filter((_, i) => i !== u).map(M).join(' + ')}) = 1 − ${M(r6(1 - ans))} = <b>${M(ans)}</b>.`,
    };
  }
  if (v === 1) { // P(X ≥ a), P(X ≤ a), P(X > a)…
    const op = pick(['≥', '≤', '>', '<']), a = op === '≥' || op === '>' ? xs[ri(op === '>' ? 0 : 1, k - 2)] : xs[ri(1, op === '<' ? k - 1 : k - 2)];
    const ok = x => (op === '≥' ? x >= a : op === '≤' ? x <= a : op === '>' ? x > a : x < a);
    const idx = xs.map((x, i) => i).filter(i => ok(xs[i])), ans = r6(sum(idx.map(i => counts[i])) / 100);
    const strictMiss = op === '>' || op === '<' ? r6(ans + ps[xs.indexOf(a)]) : r6(ans - ps[xs.indexOf(a)]);
    return {
      type: 'nums', keys: COMMA,
      html: `${ctx.intro}<br>Voici la loi de X. Calcule <b>P(X ${op} ${a})</b>.`,
      visual: lawTable(xs, ps.map(M)) + lawChart({ xs, ps, xTitle: ctx.t }), afterVisual: lawTable(xs, ps.map(M)) + lawChart({ xs, ps, hl: idx, show: true, xTitle: ctx.t }), replaceVisual: true,
      tpl: lab(`P(X ${op} ${a})`) + '{0}',
      check: chk([ans], x => (near(x[0], strictMiss) ? `Attention : « ${op} » ${op === '≥' || op === '≤' ? '<b>inclut</b>' : '<b>exclut</b>'} la valeur ${a}.` : '')),
      value: urn.filter(ok).length / urn.length,
      hint: `Repère les valeurs de X qui vérifient «&nbsp;X ${op} ${a}&nbsp;» et additionne leurs probabilités.`,
      solution: `X ${op} ${a} pour X ∈ {${idx.map(i => xs[i]).join(' ; ')}}.<br>P(X ${op} ${a}) = ${idx.map(i => M(ps[i])).join(' + ')} = <b>${M(ans)}</b>.`,
    };
  }
  const ans = r6(sum(xs.map((x, i) => x * counts[i])) / 100);
  return {
    type: 'nums', keys: COMMA,
    html: `${ctx.intro}<br>Voici la loi de X. Calcule l'<b>espérance</b> E(X).`,
    visual: lawTable(xs, ps.map(M)) + lawChart({ xs, ps, xTitle: ctx.t }),
    tpl: lab('E(X)') + '{0}',
    check: chk([ans], x => {
      if (near(x[0], r6(sum(xs) / k))) return 'Ce n\'est pas la moyenne simple des valeurs : chaque valeur est <b>pondérée</b> par sa probabilité.';
      if (near(x[0], 1)) return 'Tu as additionné les probabilités (cela fait toujours 1). Multiplie chaque valeur par sa probabilité.';
      return '';
    }),
    value: sum(urn) / urn.length,
    hint: 'E(X) = x<sub>1</sub> × P(X = x<sub>1</sub>) + x<sub>2</sub> × P(X = x<sub>2</sub>) + … : chaque valeur multipliée par sa probabilité, puis on additionne.',
    solution: `E(X) = ${xs.map((x, i) => `${M(x)} × ${M(ps[i])}`).join(' + ')} = <b>${M(ans)}</b>.<br>En moyenne, sur un grand nombre de tirages, X vaut environ ${M(ans)}.`,
  };
}
function C9() {
  const xs = [0, 1, 2, 3], ps = [0.1, 0.3, 0.4, 0.2];
  return `<h2>9. Variable aléatoire : loi et espérance</h2>
<p class="intro">Une variable aléatoire transforme le hasard en <b>nombres</b> : nombre d'enfants, de buts, gain d'un jeu… Sa loi dit avec quelle probabilité elle prend chaque valeur.</p>
<div class="def">Une <b>variable aléatoire</b> X associe un nombre à chaque issue. Sa <b>loi</b> donne P(X = x<sub>i</sub>) pour chaque valeur x<sub>i</sub> ; la somme de ces probabilités vaut <b>1</b>.<br><b>Espérance</b> : E(X) = x<sub>1</sub> × P(X = x<sub>1</sub>) + … + x<sub>n</sub> × P(X = x<sub>n</sub>) : la valeur moyenne de X sur un grand nombre d'expériences.</div>
<div class="methode"><b>Méthode</b><ol>
<li>Probabilité manquante : 1 − (somme des autres).</li>
<li>P(X ≥ a), P(X &lt; a)… : liste les valeurs qui conviennent, puis additionne leurs probabilités.</li>
<li>Espérance : multiplie chaque valeur par sa probabilité, puis additionne.</li>
<li>Jeu payant : gain G = lot − mise (valeurs parfois négatives), puis E(G).</li></ol></div>
<div class="cols">${lawTable(xs, ps.map(M))}${lawChart({ xs, ps, hl: [2, 3], show: true, xTitle: 'valeur de X' })}</div>
<div class="ex"><span class="q">Exemple 1 : avec la loi ci-dessus, calcule P(X ≥ 2), P(X &gt; 2) et E(X).</span><br>P(X ≥ 2) = 0,4 + 0,2 = <b>0,6</b> (bâtons orange) ; P(X &gt; 2) = P(X = 3) = <b>0,2</b>.<br>E(X) = 0 × 0,1 + 1 × 0,3 + 2 × 0,4 + 3 × 0,2 = <b>1,7</b>.</div>
<div class="ex"><span class="q">Exemple 2 : on paie 2 € ; on gagne 0 €, 5 € ou 10 € avec les probabilités 0,75 ; 0,2 ; 0,05. Calcule E(G).</span><br>G = lot − 2 prend les valeurs −2, 3 et 8.<br>E(G) = (−2) × 0,75 + 3 × 0,2 + 8 × 0,05 = −1,5 + 0,6 + 0,4 = <b>−0,5 €</b>.<br>Espérance négative : en moyenne, le joueur perd 0,50 € par partie.</div>
<div class="warn">⚠️ E(X) n'est pas la moyenne simple des valeurs : chaque valeur est <b>pondérée</b> par sa probabilité.<br>⚠️ X &gt; 2 <b>exclut</b> 2 ; X ≥ 2 l'<b>inclut</b>.<br>⚠️ Dans un jeu, n'oublie pas de retirer la mise : G = lot − mise.</div>
<div class="retenir">À retenir : somme des probabilités = 1 ; E(X) = somme des « valeur × probabilité ».</div>`;
}

/* ================= épreuves de Bernoulli ================= */
const BCTX = [
  { intro: (n, p) => `Un archer tire ${n} flèches. À chaque tir, il atteint la cible avec la probabilité ${p}, indépendamment des autres tirs.`, S: 'la flèche atteint la cible', X: 'le nombre de flèches dans la cible', ps: [6, 7, 8, 9] },
  { intro: (n, p) => `Une basketteuse tire ${n} lancers francs. Chacun est réussi avec la probabilité ${p}, indépendamment des autres.`, S: 'le lancer est réussi', X: 'le nombre de lancers réussis', ps: [5, 6, 7, 8] },
  { intro: (n, p) => `On sème ${n} graines. Chacune germe avec la probabilité ${p}, indépendamment des autres.`, S: 'la graine germe', X: 'le nombre de graines qui germent', ps: [7, 8, 9] },
  { intro: (n, p) => `Un élève répond au hasard aux ${n} questions d'un QCM : 5 réponses sont proposées par question, une seule est juste (probabilité ${p}).`, S: 'la réponse est juste', X: 'le nombre de bonnes réponses', ps: [2] },
  { intro: (n, p) => `On prélève ${n} ampoules dans un très grand stock (tirages assimilés à des tirages avec remise). Chaque ampoule est défectueuse avec la probabilité ${p}.`, S: "l'ampoule est défectueuse", X: 'le nombre d\'ampoules défectueuses', ps: [1, 2, 3] },
];
/** arbre de n épreuves identiques S / S̄ */
function bTree(n, p10, o = {}) {
  const p = M(p10 / 10), q = M((10 - p10) / 10);
  const mk = k => (k === 0 ? undefined : [{ e: 'S', p, kids: mk(k - 1) }, { e: '!S', p: q, kids: mk(k - 1) }]);
  return ptree(mk(n), { leaf: 'seq', ...o });
}
/** chemins (chaînes de 0 = succès, 1 = échec) à k succès */
const pathsK = (n, ok) => [...Array(2 ** n).keys()].map(m => m.toString(2).padStart(n, '0')).filter(s => ok(s.split('').filter(c => c === '0').length));
/** énumération des 10ⁿ tirages de tickets (ticket < p10 : succès) : fréquence des issues dont le nombre de succès vérifie ok */
function enumB(n, p10, ok) {
  let c = 0;
  for (let m = 0; m < 10 ** n; m++) { let s = 0, x = m; for (let i = 0; i < n; i++) { if (x % 10 < p10) s++; x = Math.floor(x / 10); } if (ok(s)) c++; }
  return c / 10 ** n;
}
const seqTxt = s => s.split('').map(c => (c === '0' ? 'S' : bar('S'))).join(' ');

/* ===================================================================== 10. schéma de Bernoulli (arbre) */
function L10(d) {
  const v = d < 1 ? 0 : d < 2 ? 1 : d < 3 ? 2 : d < 4 ? 3 : pick([3, 4]);
  const ctx = pick(BCTX), p10 = pick(ctx.ps), n = v < 2 ? 2 : 3, p = M(p10 / 10), q = M((10 - p10) / 10);
  let ok, desc, paths;
  if (v === 0) { const s = pick(['SS', 'S!S', '!SS']); paths = [s.replace(/!S/g, '1').replace(/S/g, '0')]; }
  if (v === 2) { paths = [pick(['001', '010', '100', '011', '101', '110'])]; }
  if (v === 0 || v === 2) { const t = paths[0]; ok = null; desc = `obtenir dans l'ordre ${seqTxt(t)}`; }
  let k = 0;
  if (v === 1) { k = 1; desc = 'obtenir <b>exactement un</b> succès'; }
  if (v === 3) { k = ri(1, 2); desc = `obtenir <b>exactement ${k}</b> succès`; }
  if (v === 1 || v === 3) { ok = s => s === k; paths = pathsK(n, ok); }
  if (v === 4) { ok = s => s >= 1; paths = pathsK(n, ok); desc = 'obtenir <b>au moins un</b> succès'; }
  const succ = s => s.split('').filter(c => c === '0').length;
  const pathP = s => (p10 ** succ(s)) * ((10 - p10) ** (n - succ(s)));
  const num = sum(paths.map(pathP)), ans = r6(num / 10 ** n);
  const one = paths.length === 1 ? paths[0] : null;
  const value = one ? (() => { let c = 0; for (let m = 0; m < 10 ** n; m++) { let x = m, good = true; for (let i = n - 1; i >= 0; i--) { const sc = x % 10 < p10; if (sc !== (one[i] === '0')) good = false; x = Math.floor(x / 10); } if (good) c++; } return c / 10 ** n; })() : enumB(n, p10, ok);
  const term = s => s.split('').map(c => (c === '0' ? p : q)).join(' × ');
  const vals = Object.fromEntries(paths.map(s => [s, '= ' + M(r6(pathP(s) / 10 ** n))]));
  return {
    type: 'nums', keys: COMMA,
    html: `${ctx.intro(n, p)}<br>Succès S : «&nbsp;${ctx.S}&nbsp;». Quelle est la probabilité d'${desc}&nbsp;?`,
    visual: bTree(n, p10), afterVisual: bTree(n, p10, { hl: paths, vals: n === 3 && paths.length > 3 ? {} : vals }), replaceVisual: true,
    tpl: lab('Probabilité') + '{0}',
    check: chk([ans], x => {
      if (paths.length > 1 && near(x[0], r6(pathP(paths[0]) / 10 ** n))) return `Plusieurs chemins conviennent (${paths.length}) : additionne leurs probabilités.`;
      if (v === 4 && near(x[0], r6((10 - p10) ** n / 10 ** n))) return `Ça, c'est la probabilité de n'avoir <b>aucun</b> succès : l'événement contraire.`;
      if (one && near(x[0], r6(succ(one) * p10 / 10 + (n - succ(one)) * (10 - p10) / 10))) return 'Le long d\'un chemin, on <b>multiplie</b> les probabilités.';
      return '';
    }),
    value,
    hint: v === 4 ? `Contraire de «&nbsp;au moins un succès&nbsp;» : «&nbsp;aucun succès&nbsp;» (le chemin ${seqTxt('1'.repeat(n))}). P = 1 − P(aucun succès).`
      : paths.length > 1 ? `Repère sur l'arbre <b>tous</b> les chemins qui conviennent (${paths.length}). Chacun a pour probabilité un produit ; additionne-les.`
        : 'Les épreuves sont indépendantes : la probabilité du chemin est le <b>produit</b> des probabilités de ses branches.',
    solution: v === 4 ? `P(aucun succès) = ${pw(q, n)} = ${M(r6((10 - p10) ** n / 10 ** n))}.<br>P(au moins un succès) = 1 − ${M(r6((10 - p10) ** n / 10 ** n))} = <b>${M(ans)}</b>.`
      : `${paths.map(s => `${seqTxt(s)} : ${term(s)} = ${M(r6(pathP(s) / 10 ** n))}`).join('<br>')}${paths.length > 1 ? `<br>Total : <b>${M(ans)}</b>.` : `<br>Probabilité : <b>${M(ans)}</b>.`}`,
  };
}
function C10() {
  return `<h2>10. Épreuve et schéma de Bernoulli</h2>
<p class="intro">Tirer à l'arc, lancer une pièce, semer une graine : une même expérience à deux issues, répétée plusieurs fois. L'arbre permet de tout calculer.</p>
<div class="def">Une <b>épreuve de Bernoulli</b> n'a que deux issues : <b>succès</b> S (probabilité p) et <b>échec</b> ${bar('S')} (probabilité 1 − p).<br>Un <b>schéma de Bernoulli</b> : on répète n fois la même épreuve, de façon <b>indépendante</b>. Sur l'arbre, toutes les branches S portent p et toutes les branches ${bar('S')} portent 1 − p.</div>
<div class="methode"><b>Méthode</b><ol>
<li>Un résultat dans un ordre donné (S ${bar('S')} S) : <b>un</b> chemin, on multiplie ses branches.</li>
<li>« Exactement k succès » : repère <b>tous</b> les chemins avec k succès (dans tous les ordres) et additionne.</li>
<li>« Au moins un succès » : passe par le contraire, « aucun succès » : P = 1 − (1 − p)<sup>n</sup>.</li></ol></div>
${bTree(3, 7, { hl: ['001', '010', '100'], vals: { '001': '= 0,147', '010': '= 0,147', 100: '= 0,147' } })}
<div class="ex"><span class="q">Exemple 1 : n = 2, p = 0,7. Probabilité d'exactement un succès&nbsp;?</span><br>Deux chemins : S ${bar('S')} (0,7 × 0,3 = 0,21) et ${bar('S')} S (0,3 × 0,7 = 0,21).<br>P = 0,21 + 0,21 = <b>0,42</b>.</div>
<div class="ex"><span class="q">Exemple 2 : n = 3, p = 0,7. Exactement 2 succès&nbsp;? Au moins un succès&nbsp;?</span><br>3 chemins (en orange), chacun de probabilité 0,7 × 0,7 × 0,3 = 0,147 : P = 3 × 0,147 = <b>0,441</b>.<br>Au moins un succès : 1 − P(${bar('S')} ${bar('S')} ${bar('S')}) = 1 − 0,3<sup>3</sup> = 1 − 0,027 = <b>0,973</b>.</div>
<div class="warn">⚠️ « Exactement 2 succès » : il y a plusieurs chemins, selon <b>l'ordre</b> des succès. N'en oublie pas.<br>⚠️ Le long d'un chemin, on <b>multiplie</b> ; entre chemins différents, on <b>additionne</b>.<br>⚠️ « Au moins un » : 1 − P(aucun), et non P(aucun).</div>
<div class="retenir">À retenir : un chemin = un produit ; plusieurs chemins = une somme.</div>`;
}

/* ================= loi binomiale ================= */
const C = (n, k) => { let r = 1; for (let i = 1; i <= k; i++) r = r * (n - k + i) / i; return Math.round(r); };
/** numérateur entier de P(X = k) sur 10ⁿ (p = p10 / 10) */
const bnum = (n, p10, k) => C(n, k) * p10 ** k * (10 - p10) ** (n - k);
/** loi B(n, p) par convolution, épreuve après épreuve (vérification indépendante de la formule) */
function convLaw(n, p) {
  let dist = [1];
  for (let t = 0; t < n; t++) { const nx = Array(dist.length + 1).fill(0); dist.forEach((x, k) => { nx[k] += x * (1 - p); nx[k + 1] += x * p; }); dist = nx; }
  return dist;
}
/** arrondi au millième d'un numérateur entier sur 10ⁿ ; null si cas d'égalité (5 juste après le millième) */
function round3(num, n) {
  const big = num * 1000, D = 10 ** n, rem = big % D;
  if (n > 3 && 2 * rem === D) return null;
  return { val: Math.round(big / D) / 1000, exact: rem === 0 };
}
const consigne = ex => (ex ? 'Donne la valeur exacte.' : 'Donne l\'<b>arrondi au millième</b> (à 0,001 près).');

/* ===================================================================== 11. loi binomiale P(X = k) */
function L11(d) {
  for (;;) {
    const ctx = pick(BCTX), p10 = pick(ctx.ps);
    const n = d < 1 ? 3 : d < 2 ? 4 : d < 4 ? ri(4, 5) : ri(5, 7);
    const k = ri(d < 1 ? 1 : 0, d < 1 ? 2 : n);
    if (k === 0 && d < 3) continue;
    const num = bnum(n, p10, k), R = round3(num, n);
    if (!R || R.val < 0.005) continue;
    const p = p10 / 10, ex = num / 10 ** n, cf = C(n, k), q = M(r6(1 - p));
    const law = convLaw(n, p);
    const tol = R.exact ? 0 : 0.0005, eq = R.exact ? '=' : '≈';
    const paths = pathsK(n, s => s === k).length;
    return {
      type: 'steps', keys: COMMA,
      html: `${ctx.intro(n, M(p))}<br>X est ${ctx.X} : X suit la <b>loi binomiale</b> B(${n} ; ${M(p)}).<br>Calcule le nombre de chemins à ${k} succès, puis <b>P(X = ${k})</b>. ${consigne(R.exact)}`,
      visual: lawChart({ xs: law.map((_, i) => i), ps: law, xTitle: 'X' }),
      afterVisual: lawChart({ xs: law.map((_, i) => i), ps: law, hl: [k], show: true, xTitle: 'X' }), replaceVisual: true,
      tpl: line(lab(binom(n, k)) + '{0}') + line(`<span>P(X = ${k}) ${eq}</span> {1}`),
      check: tolCheck([cf, R.val], [cf, ex], [0, tol], (v, bad) => {
        if (bad.includes(0)) return `${binom(n, k)} compte les chemins de l'arbre qui ont exactement ${k} succès sur ${n} épreuves (triangle de Pascal, ou calculatrice).`;
        const y = v[1];
        if (near(y, r6(p ** k * (1 - p) ** (n - k)), 0.0005)) return `C'est la probabilité d'<b>un seul</b> chemin : multiplie par ${binom(n, k)} = ${cf}.`;
        if (k !== n - k && near(y, r6(cf * p ** (n - k) * (1 - p) ** k), 0.0005)) return `Les exposants sont inversés : p<sup>${k}</sup> pour les ${k} succès, (1 − p)<sup>${n - k}</sup> pour les ${n - k} échecs.`;
        if (!R.exact && near(y, Math.floor(ex * 1000) / 1000)) return 'Presque : vérifie l\'<b>arrondi</b> au millième (regarde le 4<sup>e</sup> chiffre après la virgule).';
        return '';
      }),
      value: Math.round(law[k] * 1000) / 1000,
      verify: E => E[0] === paths && Math.abs(E[1] - law[k]) <= tol + 1e-9,
      hint: `P(X = k) = ${binom('n', 'k')} × p<sup>k</sup> × (1 − p)<sup>n − k</sup>. Ici n = ${n}, k = ${k}, p = ${M(p)}.`,
      solution: `${binom(n, k)} = ${cf} (nombre de chemins à ${k} succès).<br>P(X = ${k}) = ${cf} × ${pw(M(p), k)} × ${pw(q, n - k)} = ${R.exact ? '' : M(r6(ex)) + (n > 6 ? '…' : '') + ' ≈ '}<b>${R.exact ? M(R.val) : M3(R.val)}</b>.`,
    };
  }
}
function C11() {
  const law = convLaw(4, 0.6);
  return `<h2>11. Loi binomiale : P(X = k)</h2>
<p class="intro">Quand n devient grand, l'arbre a trop de branches. La loi binomiale donne directement la probabilité d'obtenir k succès.</p>
<div class="def">Dans un schéma de Bernoulli de n épreuves (succès de probabilité p), le nombre X de succès suit la <b>loi binomiale B(n ; p)</b> :<br><b>P(X = k) = ${binom('n', 'k')} p<sup>k</sup> (1 − p)<sup>n − k</sup></b>.<br>Le coefficient binomial ${binom('n', 'k')} (« k parmi n ») est le <b>nombre de chemins</b> de l'arbre qui ont exactement k succès.</div>
<div class="methode"><b>Méthode</b><ol>
<li>Repère n (nombre d'épreuves), p (succès) et k (succès voulus).</li>
<li>Calcule ${binom('n', 'k')} : triangle de Pascal ou calculatrice.</li>
<li>Multiplie par p<sup>k</sup> (les k succès) et par (1 − p)<sup>n − k</sup> (les n − k échecs).</li>
<li>Arrondis au millième si demandé : regarde le 4<sup>e</sup> chiffre après la virgule.</li></ol></div>
<div class="cols">${pascal(5, [4, 3])}${lawChart({ xs: [0, 1, 2, 3, 4], ps: law, hl: [3], show: true, xTitle: 'X' })}</div>
<p>Dans le triangle, chaque nombre est la somme des deux nombres au-dessus : <span style="white-space:nowrap">${binom(4, 3)} = 3 + 1 = 4</span> (cercles).</p>
<div class="ex"><span class="q">Exemple 1 : X suit B(4 ; 0,6). Calcule P(X = 3).</span><br>${binom(4, 3)} = 4 chemins.<br>P(X = 3) = 4 × 0,6<sup>3</sup> × 0,4<sup>1</sup> = 4 × 0,216 × 0,4 = 0,3456 ≈ <b>0,346</b>.</div>
<div class="ex"><span class="q">Exemple 2 : X suit B(5 ; 0,3). Calcule P(X = 2) au millième.</span><br>${binom(5, 2)} = 10 ; 2 succès et 3 échecs.<br>P(X = 2) = 10 × 0,3<sup>2</sup> × 0,7<sup>3</sup> = 10 × 0,09 × 0,343 = 0,3087 ≈ <b>0,309</b>.</div>
<div class="warn">⚠️ N'oublie pas le coefficient ${binom('n', 'k')} : p<sup>k</sup>(1 − p)<sup>n − k</sup> n'est la probabilité que d'<b>un</b> chemin.<br>⚠️ Exposants : p<sup>k</sup> pour les <b>succès</b>, (1 − p)<sup>n − k</sup> pour les <b>échecs</b>, pas l'inverse.<br>⚠️ Arrondi au millième : 0,3087 → 0,309 (4<sup>e</sup> chiffre 7 ≥ 5 : on arrondit au-dessus), ne tronque pas.</div>
<div class="retenir">À retenir : P(X = k) = (nombre de chemins) × p<sup>k</sup> × (1 − p)<sup>n − k</sup>.</div>`;
}

/* ===================================================================== 12. loi binomiale : cumuls, au moins un, espérance */
function L12(d) {
  const v = d < 1 ? 0 : d < 2 ? 1 : d < 3 ? 2 : d < 4 ? pick([2, 3]) : pick([1, 3, 4]);
  for (;;) {
    const ctx = pick(BCTX), p10 = pick(ctx.ps), p = p10 / 10;
    if (v === 0) { // espérance n·p
      const n = ri(4, 20), law = convLaw(n, p), ans = r6(n * p10 / 10);
      return {
        type: 'nums', keys: COMMA,
        html: `${ctx.intro(n, M(p))}<br>X est ${ctx.X} : X suit la loi B(${n} ; ${M(p)}). Calcule l'<b>espérance</b> E(X).`,
        visual: lawChart({ xs: law.map((_, i) => i), ps: law, xTitle: 'X' }), tpl: lab('E(X)') + '{0}',
        check: chk([ans], x => (near(x[0], p) ? `${M(p)}, c'est p. Pour ${n} épreuves, E(X) = n × p.` : near(x[0], r6(n * (1 - p))) ? 'Ça, c\'est le nombre moyen d\'<b>échecs</b> : n × (1 − p).' : '')),
        value: r6(sum(law.map((x, k) => k * x))),
        hint: 'Pour la loi binomiale B(n ; p), <b>E(X) = n × p</b> : en moyenne, la proportion p des épreuves est un succès.',
        solution: `E(X) = n × p = ${n} × ${M(p)} = <b>${M(ans)}</b>.<br>Sur un grand nombre de séries de ${n} épreuves, on obtient en moyenne ${M(ans)} succès.`,
      };
    }
    const n = v === 1 ? ri(3, 8) : ri(3, d >= 4 ? 7 : 6);
    let ks, label, alt = [];
    if (v === 1) { ks = [...Array(n).keys()].map(i => i + 1); label = 'X ≥ 1'; }
    else if (v === 2) { ks = [0, 1]; label = 'X ≤ 1'; }
    else if (v === 3) { const k = ri(2, n - 1); ks = [...Array(k + 1).keys()]; label = `X ≤ ${k}`; }
    else { ks = [...Array(n - 1).keys()].map(i => i + 2); label = 'X ≥ 2'; }
    const num = sum(ks.map(k => bnum(n, p10, k))), R = round3(num, n);
    if (!R || R.val < 0.005 || R.val > 0.995) continue;
    const ex = num / 10 ** n, law = convLaw(n, p), tol = R.exact ? 0 : 0.0005, eq = R.exact ? '=' : '≈', q = M(r6(1 - p));
    const P0 = (10 - p10) ** n / 10 ** n, P1 = bnum(n, p10, 1) / 10 ** n;
    const sol = v === 1 ? `Contraire de X ≥ 1 : X = 0 (aucun succès), P(X = 0) = ${pw(q, n)}.<br>P(X ≥ 1) = 1 − ${pw(q, n)} = 1 − ${M(r6(P0))}${n > 6 ? '…' : ''}`
      : v === 4 ? `Contraire de X ≥ 2 : X ≤ 1.<br>P(X = 0) = ${pw(q, n)} ; P(X = 1) = ${n} × ${M(p)} × ${pw(q, n - 1)}.<br>P(X ≥ 2) = 1 − P(X = 0) − P(X = 1)`
        : `P(${label}) = ${ks.map(k => `P(X = ${k})`).join(' + ')}<br>= ${ks.map(k => `${binom(n, k)} × ${pw(M(p), k)} × ${pw(q, n - k)}`).join(' + ')}`;
    return {
      type: 'nums', keys: COMMA,
      html: `${ctx.intro(n, M(p))}<br>X est ${ctx.X} : X suit la loi B(${n} ; ${M(p)}). Calcule <b>P(${label})</b>. ${consigne(R.exact)}`,
      visual: lawChart({ xs: law.map((_, i) => i), ps: law, xTitle: 'X' }),
      afterVisual: lawChart({ xs: law.map((_, i) => i), ps: law, hl: ks, show: true, xTitle: 'X' }), replaceVisual: true,
      tpl: `<span>P(${label}) ${eq}</span> {0}`,
      check: tolCheck([R.val], [ex], [tol], v2 => {
        const y = v2[0], t = 0.0005;
        if (v === 1 && near(y, P0, t)) return 'Ça, c\'est P(X = 0). « Au moins un succès » est son <b>contraire</b> : 1 − P(X = 0).';
        if (v === 1 && near(y, 1 - p ** n, t)) return `1 − p<sup>n</sup> est la probabilité de ne pas réussir <b>toutes</b> les ${n} épreuves. Le contraire de « au moins un succès » est « aucun succès » : (1 − p)<sup>n</sup>.`;
        if (v === 2 && near(y, P1, t)) return 'X ≤ 1 contient aussi X = 0 : ajoute P(X = 0).';
        if (v === 4 && near(y, 1 - P0, t)) return 'Ça, c\'est P(X ≥ 1). Il faut aussi retirer P(X = 1).';
        if (v === 3 && near(y, ex - bnum(n, p10, ks[ks.length - 1]) / 10 ** n, t)) return `« ${label} » <b>inclut</b> X = ${ks[ks.length - 1]}.`;
        if (!R.exact && near(y, Math.floor(ex * 1000) / 1000)) return 'Presque : vérifie l\'<b>arrondi</b> au millième (regarde le 4<sup>e</sup> chiffre après la virgule).';
        return '';
      }),
      value: Math.round(sum(ks.map(k => law[k])) * 1000) / 1000,
      hint: v === 1 ? 'Passe par l\'événement contraire : «&nbsp;au moins un succès&nbsp;» est le contraire de «&nbsp;aucun succès&nbsp;» (X = 0).'
        : v === 4 ? 'Contraire de X ≥ 2 : X ≤ 1, c\'est-à-dire X = 0 ou X = 1. Calcule 1 − P(X = 0) − P(X = 1).'
          : `Additionne P(X = k) pour k = ${ks.join(', ')}, avec P(X = k) = ${binom('n', 'k')} p<sup>k</sup> (1 − p)<sup>n − k</sup>.`,
      solution: `${sol} = ${R.exact ? '' : M(r6(ex)) + (n > 6 ? '…' : '') + ' ≈ '}<b>${R.exact ? M(R.val) : M3(R.val)}</b>.`,
    };
  }
}
function C12() {
  const law = convLaw(5, 0.3);
  return `<h2>12. Loi binomiale : cumuls et espérance</h2>
<p class="intro">« Au plus 1 », « au moins 2 », « en moyenne combien ? » : on additionne des bâtons du diagramme, ou on passe par le contraire.</p>
<div class="def">Si X suit B(n ; p) :<br>• <b>P(X ≤ k)</b> = P(X = 0) + P(X = 1) + … + P(X = k) ;<br>• <b>P(X ≥ 1) = 1 − P(X = 0) = 1 − (1 − p)<sup>n</sup></b> (contraire de « aucun succès ») ;<br>• <b>P(X ≥ 2) = 1 − P(X = 0) − P(X = 1)</b> ;<br>• <b>E(X) = n × p</b> : le nombre moyen de succès.</div>
<div class="methode"><b>Méthode</b><ol>
<li>Espérance : E(X) = n × p, directement.</li>
<li>Peu de valeurs à additionner (X ≤ 1, X ≤ 2…) : additionne les P(X = k).</li>
<li>Beaucoup de valeurs (X ≥ 1, X ≥ 2) : passe par le <b>contraire</b>, 1 − P(X ≤ …).</li>
<li>Arrondis le résultat final au millième (garde les valeurs exactes pendant le calcul).</li></ol></div>
${lawChart({ xs: [0, 1, 2, 3, 4, 5], ps: law, hl: [0, 1], show: true, xTitle: 'X' })}
<div class="ex"><span class="q">Exemple 1 : X suit B(5 ; 0,3). Calcule E(X), P(X ≤ 1) et P(X ≥ 2).</span><br>E(X) = 5 × 0,3 = <b>1,5</b>.<br>P(X ≤ 1) = 0,7<sup>5</sup> + 5 × 0,3 × 0,7<sup>4</sup> = 0,16807 + 0,36015 = 0,52822 ≈ <b>0,528</b> (bâtons orange).<br>P(X ≥ 2) = 1 − 0,52822 = 0,47178 ≈ <b>0,472</b>.</div>
<div class="ex"><span class="q">Exemple 2 : toujours B(5 ; 0,3). Calcule P(X ≥ 1).</span><br>Contraire : X = 0 (aucun succès), P(X = 0) = 0,7<sup>5</sup> = 0,16807.<br>P(X ≥ 1) = 1 − 0,16807 = 0,83193 ≈ <b>0,832</b>.</div>
<div class="warn">⚠️ « X ≤ 1 » contient X = 0 ; « X &lt; 2 » est le même événement que « X ≤ 1 ».<br>⚠️ Contraire de « au moins un succès » : « aucun succès », de probabilité (1 − p)<sup>n</sup>, et non 1 − p<sup>n</sup>.<br>⚠️ E(X) = n × p, et non p seul ni n × (1 − p) (nombre moyen d'échecs).</div>
<div class="retenir">À retenir : P(X ≥ 1) = 1 − (1 − p)<sup>n</sup> et E(X) = n × p.</div>`;
}

export const LEVELS = [
  { titre: 'Tableau croisé : probabilité d\'un événement', generate: L1, cours: C1, classe: '1re' },
  { titre: 'Intersection et réunion', generate: L2, cours: C2, classe: '1re' },
  { titre: 'Probabilité conditionnelle (tableau)', generate: L3, cours: C3, classe: '1re' },
  { titre: 'Arbre pondéré : compléter les branches', generate: L4, cours: C4, classe: '1re' },
  { titre: 'Probabilité d\'un chemin', generate: L5, cours: C5, classe: '1re' },
  { titre: 'Probabilités totales', generate: L6, cours: C6, classe: '1re' },
  { titre: 'Inverser le conditionnement', generate: L7, cours: C7, classe: '1re' },
  { titre: 'Indépendance', generate: L8, cours: C8, classe: '1re' },
  { titre: 'Variable aléatoire : loi, espérance', generate: L9, cours: C9, classe: '1re' },
  { titre: 'Schéma de Bernoulli', generate: L10, cours: C10, classe: 'Tle' },
  { titre: 'Loi binomiale : P(X = k)', generate: L11, cours: C11, classe: 'Tle' },
  { titre: 'Loi binomiale : cumuls, espérance', generate: L12, cours: C12, classe: 'Tle' },
];
export const OPTIONS = { need: 4, keys: { comma: true, neg: false } };

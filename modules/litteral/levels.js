// Calcul littéral (4e – 3e) : 12 niveaux, du programme de calcul aux factorisations.
// Chaque expression de l'énoncé est un petit arbre (AST) qui sert à la fois à l'afficher et à l'évaluer :
// la vérification indépendante verify(expected) compare, pour x = −3 … 3, l'expression de départ évaluée
// numériquement et la forme attendue (deux polynômes de degré ≤ 2 égaux en 7 points sont égaux).
// Les coefficients attendus, eux, sont calculés « à la main » (formules de développement).
import { ri, pick, nz, shuffle, chance } from '../../engine/util/rand.js';
import { numsCheck, choiceCheck } from '../../engine/answers/checks.js';
import { M, P, X2, terms, big } from '../../engine/util/fmt.js';
import { gcd, approx } from '../../engine/util/arith.js';
import { programme, tuiles, grille, carreDiff, mono, monos } from './draw.js';

/* ================= expressions : construction, affichage, évaluation ================= */
const N = v => ({ t: 'n', v });                 // nombre
const Mo = (c, p) => ({ t: 'm', c, p });         // monôme c·x^p (p = 0, 1, 2)
const X = Mo(1, 1);
const zero = e => (e.t === 'n' && e.v === 0) || (e.t === 'm' && e.c === 0);
const S = (...it) => ({ t: 's', it: it.filter(e => !zero(e)) }); // somme
const Pa = e => ({ t: 'p', e });                 // parenthèses
const Pr = (...f) => ({ t: 'pr', f });           // produit écrit sans × : 3(x + 2), (x + 1)(x − 4)
const Sq = e => ({ t: 'sq', e });                // carré
const T = (...f) => ({ t: 't', f });             // produit écrit avec × : 3 × x × x
const Ng = e => ({ t: 'ng', e });                // −( … )
const L = (a, b) => Pa(S(Mo(a, 1), N(b)));      // (ax + b)
const Lr = (a, b) => Pa(S(N(b), Mo(a, 1)));     // (b + ax) : dans le désordre

function ev(e, x) {
  switch (e.t) {
    case 'n': return e.v;
    case 'm': return e.c * x ** e.p;
    case 's': return e.it.reduce((s, u) => s + ev(u, x), 0);
    case 'p': return ev(e.e, x);
    case 'pr': case 't': return e.f.reduce((s, u) => s * ev(u, x), 1);
    case 'sq': return ev(e.e, x) ** 2;
    case 'ng': return -ev(e.e, x);
  }
  throw new Error('nœud inconnu');
}
const isNeg = e => e.t === 'n' ? e.v < 0 : e.t === 'm' ? e.c < 0 : (e.t === 'pr' || e.t === 't') ? isNeg(e.f[0]) : e.t === 'ng';
const abs = e => e.t === 'n' ? N(-e.v) : e.t === 'm' ? Mo(-e.c, e.p) : (e.t === 'pr' || e.t === 't') ? { ...e, f: [abs(e.f[0]), ...e.f.slice(1)] } : e.t === 'ng' ? e.e : e;
const VAR = ['', 'x', X2];
function h(e) {
  switch (e.t) {
    case 'n': return M(e.v);
    case 'm': { if (e.c === 0) return '0'; const a = Math.abs(e.c); return (e.c < 0 ? '−' : '') + (a === 1 && e.p ? '' : M(a)) + VAR[e.p]; }
    case 's': return e.it.length ? e.it.map((u, i) => { const n = isNeg(u), v = n ? abs(u) : u; return (i ? (n ? ' − ' : ' + ') : (n ? '−' : '')) + h(v); }).join('') : '0';
    case 'p': return '(' + h(e.e) + ')';
    case 'pr': return e.f.map((u, i) => (i === 0 && u.t === 'm' && u.p === 0 && Math.abs(u.c) === 1 && e.f.length > 1) ? (u.c < 0 ? '−' : '') : h(u)).join('');
    case 'sq': return h(e.e) + '<sup>2</sup>';
    case 't': return e.f.map((u, i) => (i > 0 && isNeg(u) ? '(' + h(u) + ')' : h(u))).join(' × ');
    case 'ng': return '−' + h(e.e);
  }
  throw new Error('nœud inconnu');
}

/* ================= polynômes [a, b, c] = ax² + bx + c ================= */
const mulL = (a, b, c, d) => [a * c, a * d + b * c, b * d];     // (ax + b)(cx + d)
const add = (p, q) => p.map((v, i) => v + q[i]);
const sub = (p, q) => p.map((v, i) => v - q[i]);
const kp = (k, p) => p.map(v => k * v);
const poly3 = p => terms([[p[0], X2], [p[1], 'x'], [p[2], '']]);
const ptxt = p => monos([[p[0], 2], [p[1], 1], [p[2], 0]]);
const eq = (u, v) => u.length === v.length && u.every((x, i) => approx(x, v[i]));

/* ================= réponses ================= */
const TPL3 = `{0} <span>${X2}</span> + {1} x + {2}`, TPL2 = '{0} x + {1}';
const NOTE3 = `<span class="note">Tape 1 pour « x », 0 s'il n'y a pas de terme, et − pour un coefficient négatif.</span>`;
const NOTE2 = `<span class="note">Tape − pour un nombre négatif (par ex. −4 pour « − 4 »).</span>`;
const XS = [-3, -2, -1, 0, 1, 2, 3];
const F3 = v => x => v[0] * x * x + v[1] * x + v[2];
const F2 = v => x => v[0] * x + v[1];
const same = (f, g) => XS.every(x => Math.abs(f(x) - g(x)) < 1e-9);
/** E à partir d'un polynôme : 3 coefficients, ou 2 si le degré est 1 */
const toE = (p, deg) => (deg === 3 ? [...p] : [p[1], p[2]]);
const fromE = (v, deg) => (deg === 3 ? v : [0, v[0], v[1]]);
/** check sur la forme développée : la forme est imposée (ax² + bx + c), on compare coefficient par coefficient */
function devQ(ast, p, deg, o) {
  const E = toE(p, deg);
  return {
    type: 'nums', html: o.html, tpl: deg === 3 ? TPL3 : TPL2,
    check: numsCheck(E, { msg: v => (o.msg ? o.msg(fromE(v, deg)) : '') || '' }),
    verify: Ev => same(x => ev(ast, x), (deg === 3 ? F3 : F2)(Ev)),
    hint: o.hint, solution: o.solution, visual: o.visual || '', afterVisual: o.afterVisual || '', replaceVisual: !!o.afterVisual,
  };
}
/** check pour une factorisation : juste si le produit écrit est égal à l'expression (toute écriture équivalente) */
function formCheck(E, form, o = {}) {
  const fn = v => {
    if (same(form(v), form(E)) && (!o.accept || o.accept(v))) return { ok: true };
    const bad = E.map((e, i) => (approx(v[i], e) ? -1 : i)).filter(i => i >= 0);
    return { ok: false, bad, msg: (o.msg ? o.msg(v, same(form(v), form(E))) : '') || '' };
  };
  fn.expected = E;
  return fn;
}
/** visuel avant / après d'un produit (distributivité) : cases « ? » puis cases remplies */
function grilles(left, top, prods, aire) {
  const before = grille({ left: left.map(t => mono(...t)), top: top.map(t => mono(...t)), cells: left.map(() => top.map(() => '?')), aire });
  const after = grille({ left: left.map(t => mono(...t)), top: top.map(t => mono(...t)), cells: prods, aire });
  return { visual: before, afterVisual: after };
}
const prodCells = (left, top) => left.map(([c, p]) => top.map(([d, q]) => mono(c * d, p + q)));
const linTerms = (a, b, rev = false) => (rev ? [[b, 0], [a, 1]] : [[a, 1], [b, 0]]).filter(t => t[0] !== 0);

/* ======================================================================
   1. Écrire une expression (programme de calcul)
   ====================================================================== */
const MULT = { 2: 'le double', 3: 'le triple', 4: 'le quadruple' };
const stM = k => ({ t: `Multiplier par ${P(k)}`, f: y => k * y, l: '× ' + P(k) });
const stA = b => ({ t: `Ajouter ${b}`, f: y => y + b, l: '+ ' + b });
const stS = b => ({ t: `Soustraire ${b}`, f: y => y - b, l: '− ' + b });
const progHTML = st => `Voici un programme de calcul :<ol class="prog"><li>Choisir un nombre x.</li>${st.map(s => `<li>${s.t}.</li>`).join('')}</ol>`;

function L1(d) {
  if (d >= 3 && chance(0.4)) return L1choix();
  const v = d < 1 ? 0 : d < 2 ? ri(0, 1) : d < 4 ? ri(0, 2) : ri(0, 3);
  const a = ri(2, 9), b = ri(1, 12);
  let st, E, chain;
  if (v === 0) { st = [stM(a), stA(b)]; E = [a, b]; chain = [`${a}x`, `${a}x + ${b}`]; }
  else if (v === 1) { st = [stM(a), stS(b)]; E = [a, -b]; chain = [`${a}x`, `${a}x − ${b}`]; }
  else if (v === 2 && chance(0.5)) {
    const k = ri(2, 4), c = ri(10, 30);
    st = [{ t: `Calculer ${MULT[k]} de ce nombre`, f: y => k * y, l: '× ' + k }, { t: `Soustraire le résultat à ${c}`, f: y => c - y, l: `${c} − …` }];
    E = [-k, c]; chain = [`${k}x`, `${c} − ${k}x`];
  } else if (v === 2) { st = [stM(-a), stA(b)]; E = [-a, b]; chain = [`−${a}x`, `−${a}x + ${b}`]; }
  else { let c = ri(1, 9); if (c === b) c++; st = [stM(a), stA(b), stS(c)]; E = [a, b - c]; chain = [`${a}x`, `${a}x + ${b}`, `${a}x + ${b} − ${c} = ${terms([[a, 'x'], [b - c, '']])}`]; }
  const prog = x => st.reduce((y, s) => s.f(y), x);
  return {
    type: 'nums', tpl: TPL2,
    html: `${progHTML(st)}Écris le résultat en fonction de x, sous la forme a x + b.${NOTE2}`,
    visual: programme(st.map(s => s.l)),
    check: numsCheck(E, {
      msg: v => v[0] === E[1] && v[1] === E[0] ? "Tu as inversé : le nombre qui <b>multiplie</b> x s'écrit devant x."
        : v[0] === E[0] && v[1] === -E[1] ? 'Le nombre devant x est juste. Vérifie le signe du nombre seul : « soustraire 4 » s\'écrit « − 4 ».'
          : v[0] === -E[0] && v[1] === E[1] ? 'Le nombre seul est juste. Vérifie le signe devant x.' : '',
    }),
    verify: Ev => same(prog, F2(Ev)),
    hint: `Suis le programme étape par étape en partant de <b>x</b> : écris ce que devient x après chaque étape. « Multiplier x par 3 » s'écrit 3x.`,
    solution: `x → ${chain.join(' → ')}. Le résultat est <b>${terms([[E[0], 'x'], [E[1], '']])}</b>.`,
  };
}
function L1choix() {
  const a = ri(2, 9); let k; do { k = ri(2, 9); } while (k === a);
  let st, opts, msgB;
  if (chance(0.5)) {
    st = [stA(a), stM(k)];
    opts = [{ v: 'A', l: `${k}(x + ${a})`, f: x => k * (x + a) }, { v: 'B', l: `${k}x + ${a}`, f: x => k * x + a },
      { v: 'C', l: `x + ${a} × ${k}`, f: x => x + a * k }, { v: 'D', l: `${a}(x + ${k})`, f: x => a * (x + k) }];
    msgB = `On multiplie <b>tout</b> le résultat x + ${a} par ${k} : il faut des parenthèses.`;
  } else {
    st = [stS(a), { t: 'Élever le résultat au carré', f: y => y * y, l: 'au carré' }];
    opts = [{ v: 'A', l: `(x − ${a})<sup>2</sup>`, f: x => (x - a) ** 2 }, { v: 'B', l: `x − ${a}<sup>2</sup>`, f: x => x - a * a },
      { v: 'C', l: `x<sup>2</sup> − ${a}`, f: x => x * x - a }, { v: 'D', l: `2(x − ${a})`, f: x => 2 * (x - a) }];
    msgB = `C'est tout le résultat x − ${a} qui est élevé au carré : il faut des parenthèses.`;
  }
  const prog = x => st.reduce((y, s) => s.f(y), x);
  return {
    type: 'choice', opts: shuffle(opts),
    html: `${progHTML(st)}Quelle expression donne le résultat ?`,
    visual: programme(st.map(s => s.l)),
    check: choiceCheck('A', { msg: c => (c === 'B' ? msgB : '') }),
    verify: Ev => { const ok = opts.filter(o => same(o.f, prog)); return ok.length === 1 && ok[0].v === Ev; },
    hint: `Teste avec un nombre, par exemple x = 1 : fais le programme, puis calcule chaque expression. Attention aux parenthèses : l'étape 2 s'applique à <b>tout</b> le résultat de l'étape 1.`,
    solution: `x → ${st[0].l.replace('+ ', 'x + ').replace('− ', 'x − ')} → ${opts.find(o => o.v === 'A').l}. Réponse : <b>${opts.find(o => o.v === 'A').l}</b>.`,
  };
}
function C1() {
  return `<h2>1. Écrire une expression</h2>
<p class="intro">Une lettre permet d'écrire un calcul <b>une seule fois pour tous les nombres</b>. C'est le point de départ de tout le calcul littéral.</p>
<div class="cols">
<div class="def">Une <b>expression littérale</b> est un calcul où un nombre est remplacé par une lettre, souvent <b>x</b>.<br>Un programme de calcul se traduit par une expression en x.</div>
<div>${programme(['× 4', '− 7'])}</div>
</div>
<div class="methode"><b>Méthode</b><ol>
<li>Pars de <b>x</b> et écris ce qu'il devient après chaque étape.</li>
<li>« Multiplier x par 4 » s'écrit 4x (le nombre devant la lettre).</li>
<li>Si une étape porte sur <b>tout</b> le résultat précédent, mets ce résultat entre parenthèses.</li>
<li>Écris la réponse sous la forme ax + b : a multiplie x, b est le nombre seul (avec son signe).</li></ol></div>
<div class="ex"><span class="q">Exemple 1 : choisir x ; multiplier par 4 ; soustraire 7.</span><br>x → 4x → <b>4x − 7</b>. Ici a = 4 et b = −7.</div>
<div class="ex"><span class="q">Exemple 2 : deux programmes plus délicats.</span><br>• Choisir x ; ajouter 2 ; multiplier <b>le résultat</b> par 4 : x → x + 2 → <b>4(x + 2)</b>. Les parenthèses montrent que <b>tout</b> x + 2 est multiplié.<br>• Calculer le triple de x ; soustraire le résultat à 20 : x → 3x → <b>20 − 3x</b>, qu'on écrit aussi −3x + 20 (a = −3, b = 20).<br>• Choisir x ; soustraire 5 ; élever <b>le résultat</b> au carré : x → x − 5 → <b>(x − 5)<sup>2</sup></b>. Ce n'est ni x − 5<sup>2</sup> (seul 5 serait au carré), ni x<sup>2</sup> − 5 (on aurait mis x au carré avant de soustraire).</div>
<div class="warn">⚠️ 4(x + 2) et 4x + 2, ce n'est pas pareil ! Teste avec x = 1 : 4 × 3 = 12, mais 4 + 2 = 6.<br>⚠️ « Soustraire 7 » donne « − 7 » : dans la case du nombre seul, tape <b>−7</b>.<br>⚠️ N'inverse pas : le nombre qui <b>multiplie</b> x s'écrit devant x.</div>
<div class="retenir">À retenir : on suit le programme pas à pas en partant de x, sans oublier les parenthèses.</div>`;
}

/* ======================================================================
   2. Calculer la valeur d'une expression
   ====================================================================== */
function L2(d) {
  const x0 = d >= 1 && chance(0.75) ? -ri(1, 5) : ri(1, 6);
  const v = d < 1 ? 0 : d < 2 ? ri(0, 1) : d < 3 ? pick([0, 1, 2, 2]) : pick([1, 2, 2, 3]);
  const Px = P(x0);
  let ast, Y, sol, wrong = [];
  if (v === 0) {
    const a = d < 1 ? ri(2, 9) : nz(-9, 9), b = ri(-12, 12);
    ast = S(Mo(a, 1), N(b)); Y = a * x0 + b;
    sol = `${M(a)} × ${Px}${b ? ' ' + (b < 0 ? '− ' + (-b) : '+ ' + b) : ''} = ${M(a * x0)}${b ? ' ' + (b < 0 ? '− ' + (-b) : '+ ' + b) : ''}`;
    if (a > 0 && x0 > 0) wrong.push([Number(`${a}${x0}`) + b, `${a}x veut dire ${a} × x : on <b>multiplie</b>, on ne colle pas les chiffres.`]);
    if (x0 < 0) wrong.push([-a * x0 + b, `Attention à la règle des signes : ${M(a)} × ${Px} = ${M(a * x0)}.`]);
  } else if (v === 1) {
    const a = ri(2, 9), b = ri(1, 15);
    ast = S(N(b), Mo(-a, 1)); Y = b - a * x0;
    sol = `${b} − ${a} × ${Px} = ${b} − ${P(a * x0)}`;
    if (x0 < 0) wrong.push([b + a * x0, `Soustraire un nombre négatif revient à ajouter son opposé : ${b} − ${P(a * x0)} = ${b} + ${-a * x0}.`]);
  } else if (v === 2) {
    const a = pick(d < 3 ? [1, 2, 3] : [1, -1, 2, 3, -2]), b = ri(-6, 6), c = ri(-9, 9);
    ast = S(Mo(a, 2), Mo(b, 1), N(c)); Y = a * x0 * x0 + b * x0 + c;
    sol = `${a === 1 ? '' : a === -1 ? '−' : M(a) + ' × '}${Px}<sup>2</sup>${b ? ' + ' + P(b) + ' × ' + Px : ''}${c ? ' + ' + P(c) : ''} = ${M(a * x0 * x0)}${b ? ' + ' + P(b * x0) : ''}${c ? ' + ' + P(c) : ''}`;
    if (x0 < 0) wrong.push([-a * x0 * x0 + b * x0 + c, `Un carré n'est jamais négatif : ${Px}<sup>2</sup> = ${Px} × ${Px} = ${x0 * x0}.`]);
    if (Math.abs(a) >= 2) wrong.push([a * a * x0 * x0 + b * x0 + c, `${M(a)}x<sup>2</sup> veut dire ${M(a)} × x<sup>2</sup> : seul x est élevé au carré.`]);
  } else {
    const p = nz(-6, 6), q = nz(-6, 6);
    if (chance(0.5)) { ast = Pr(L(1, p), L(1, q)); Y = (x0 + p) * (x0 + q); sol = `(${M(x0)} ${p < 0 ? '− ' + (-p) : '+ ' + p})(${M(x0)} ${q < 0 ? '− ' + (-q) : '+ ' + q}) = ${P(x0 + p)} × ${P(x0 + q)}`; }
    else { const k = pick([2, 3, -1, -2]); ast = Pr(Mo(k, 0), Sq(L(1, p))); Y = k * (x0 + p) ** 2; sol = `${k === -1 ? '−' : M(k) + ' × '}(${M(x0)} ${p < 0 ? '− ' + (-p) : '+ ' + p})<sup>2</sup> = ${k === -1 ? '−' : M(k) + ' × '}${P(x0 + p)}<sup>2</sup> = ${k === -1 ? '−' : M(k) + ' × '}${(x0 + p) ** 2}`; wrong.push([(k * (x0 + p)) ** 2, `On calcule d'abord le carré, puis on multiplie par ${M(k)} (le carré est prioritaire).`]); }
  }
  const val = ev(ast, x0);
  return {
    type: 'nums', tpl: `Pour x = ${M(x0)} : {0}`,
    html: `Calcule la valeur de l'expression pour <b>x = ${M(x0)}</b> :${big('A = ' + h(ast))}`,
    check: numsCheck([Y], { msg: u => (wrong.find(w => approx(w[0], u[0]) && !approx(w[0], Y)) || [0, ''])[1] }),
    value: val,
    hint: `Remplace <b>chaque</b> x par ${x0 < 0 ? `<b>(${M(x0)})</b>, entre parenthèses` : `<b>${x0}</b>`}, et remets les signes × cachés. Puis : les puissances d'abord, ensuite les multiplications, enfin les additions et soustractions.`,
    solution: `A = ${sol} = <b>${M(Y)}</b>`,
  };
}
function C2() {
  return `<h2>2. Calculer la valeur d'une expression</h2>
<p class="intro">Une expression donne un résultat différent pour chaque valeur de x. Pour le trouver, on remplace x par cette valeur.</p>
<div class="cols">
<div class="def">Pour calculer une expression pour une valeur de x, on <b>remplace chaque x par cette valeur</b>, puis on applique les <b>priorités</b> : parenthèses, puis puissances, puis × et ÷, enfin + et −.</div>
<div>${programme(['× 3', '− 5'], '−2', '−11')}</div>
</div>
<div class="methode"><b>Méthode</b><ol>
<li>Recopie l'expression en remplaçant <b>chaque</b> x par la valeur, <b>entre parenthèses</b> si elle est négative.</li>
<li>Remets les signes × cachés : 3x devient 3 × x.</li>
<li>Calcule d'abord l'intérieur des parenthèses, puis les carrés, puis les produits, enfin les sommes.</li></ol></div>
<div class="ex"><span class="q">Exemple 1 : A = 3x − 5 pour x = −2.</span><br>A = 3 × (−2) − 5 = −6 − 5 = <b>−11</b></div>
<div class="ex"><span class="q">Exemple 2 : B = 2x<sup>2</sup> − x + 1 et C = 2(x − 1)<sup>2</sup> pour x = −3.</span><br>• B = 2 × (−3)<sup>2</sup> − (−3) + 1 = 2 × 9 + 3 + 1 = <b>22</b>.<br>• C = 2 × (−3 − 1)<sup>2</sup> = 2 × (−4)<sup>2</sup> = 2 × 16 = <b>32</b> : le carré d'abord, la multiplication ensuite.</div>
<div class="warn">⚠️ Mets les nombres négatifs <b>entre parenthèses</b> : (−3)<sup>2</sup> = (−3) × (−3) = 9, positif.<br>⚠️ 2x<sup>2</sup> = 2 × x<sup>2</sup> : seul x est au carré. Pour x = 3 : 2 × 9 = 18, et pas 6<sup>2</sup> = 36.<br>⚠️ Pour x = 4, 3x vaut 3 × 4 = 12, pas « 34 » !</div>
<div class="retenir">À retenir : on remplace x par sa valeur entre parenthèses, puis on respecte les priorités.</div>`;
}

/* ======================================================================
   3. Conventions d'écriture
   ====================================================================== */
function L3(d) {
  const kk = () => (d < 1 ? ri(2, 9) : (chance(0.5) ? -1 : 1) * ri(2, 9));
  const kinds = d < 1 ? ['kx', 'xk', 'xx', 'xxx'] : d < 2 ? ['kx', 'xx', 'kxx', 'xkx', 'kxm', 'xxx'] : d < 3 ? ['kxx', 'xkx', 'kxm', 'kxmx', 'xxx'] : ['kxm', 'kxmx', 'sum1', 'sum2', 'kxmx'];
  const kind = pick(kinds);
  let ast, p, tip;
  const k = kk(), m = kk();
  switch (kind) {
    case 'kx': ast = T(N(k), X); p = [0, k, 0]; tip = `${M(k)} × x = ${mono(k, 1)}`; break;
    case 'xk': ast = T(X, N(k)); p = [0, k, 0]; tip = `x × ${P(k)} = ${M(k)} × x = ${mono(k, 1)} : le nombre s'écrit devant`; break;
    case 'xx': ast = T(X, X); p = [1, 0, 0]; tip = 'x × x = x² (« x au carré »)'; break;
    case 'xxx': { const n = d < 1 ? 3 : ri(2, 5); ast = S(...Array(n).fill(X)); p = [0, n, 0]; tip = `on ajoute ${n} fois x : c'est ${n} × x = ${n}x`; break; }
    case 'kxx': ast = T(N(k), X, X); p = [k, 0, 0]; tip = `${M(k)} × x × x = ${M(k)} × x² = ${mono(k, 2)}`; break;
    case 'xkx': ast = T(X, N(k), X); p = [k, 0, 0]; tip = `on regroupe : ${M(k)} × x × x = ${mono(k, 2)}`; break;
    case 'kxm': ast = T(N(k), X, N(m)); p = [0, k * m, 0]; tip = `on multiplie les nombres : ${M(k)} × ${P(m)} = ${M(k * m)}, donc ${mono(k * m, 1)}`; break;
    case 'kxmx': ast = T(Mo(k, 1), Mo(m, 1)); p = [k * m, 0, 0]; tip = `${M(k)} × ${P(m)} = ${M(k * m)} et x × x = x², donc ${mono(k * m, 2)}`; break;
    case 'sum1': ast = S(T(N(k), X), T(N(Math.abs(m)), X, X)); p = [Math.abs(m), k, 0]; tip = `${mono(k, 1)} et ${mono(Math.abs(m), 2)} ne se regroupent pas`; break;
    default: { const c = nz(-9, 9); ast = S(T(X, X), T(X, N(k)), N(c)); p = [1, k, c]; tip = `x × x = x² et x × ${P(k)} = ${mono(k, 1)}`; }
  }
  const small = p.every(c => Math.abs(c) <= 12);
  return Object.assign(devQ(ast, p, 3, {
    html: `Écris le plus simplement possible :${big(h(ast))}${NOTE3}`,
    msg: v => v[0] === p[1] && v[1] === p[0] && p[0] !== p[1] ? 'Attention : x × x = x² (x au carré), alors que x + x = 2x.'
      : kind === 'kxm' && v[1] === k + m ? `Dans ${h(ast)}, on <b>multiplie</b> les nombres (on n'additionne pas).`
        : kind === 'xxx' && v[0] === p[1] ? `x + x + x, c'est une <b>addition</b> : on compte les x, ça fait ${p[1]}x (pas une puissance).` : '',
    hint: `Le signe × devant une lettre se supprime : 3 × x = 3x (le nombre s'écrit <b>devant</b>). On multiplie les nombres entre eux. x × x = x<sup>2</sup>, mais x + x = 2x.`,
    solution: `${tip}. Donc ${h(ast)} = <b>${poly3(p)}</b>.`,
  }), { afterVisual: small ? tuiles([[p[0], 2], [p[1], 1], [p[2], 0]]) : '', replaceVisual: false });
}
function C3() {
  return `<h2>3. Conventions d'écriture</h2>
<p class="intro">Pour écrire plus vite, on simplifie l'écriture des produits. Ces règles reviennent dans tous les calculs qui suivent.</p>
<div class="def">• On peut <b>supprimer le signe ×</b> devant une lettre ou une parenthèse : 3 × x = <b>3x</b> ; 5 × (x + 1) = 5(x + 1).<br>• Le nombre s'écrit <b>devant</b> la lettre : x × 4 = <b>4x</b>.<br>• x × x = <b>x<sup>2</sup></b> (« x au carré ») ; 1 × x = <b>x</b>.</div>
<div class="cols">
<div>${tuiles([[1, 2], [3, 1], [2, 0]])}</div>
<p class="note">Les tuiles de x<sup>2</sup> + 3x + 2 : un x<sup>2</sup> est un carré de côté x, un x est une barre x × 1, et 1 est un petit carré unité.</p>
</div>
<div class="methode"><b>Méthode</b><ol>
<li>Regroupe les <b>nombres</b> et multiplie-les entre eux (attention aux signes).</li>
<li>Compte les x <b>multipliés</b> : un seul x → x ; deux x → x<sup>2</sup>.</li>
<li>Écris le nombre devant, puis la lettre. Pour une addition x + x + x, compte les x : 3x.</li></ol></div>
<div class="ex"><span class="q">Exemple 1 : simplifie 2 × x × 5 et x × 7.</span><br>2 × x × 5 = 2 × 5 × x = <b>10x</b> ; x × 7 = <b>7x</b>.</div>
<div class="ex"><span class="q">Exemple 2 : simplifie −3 × x × x, 2x × (−4x) et x × x + x × 3 − 5.</span><br>• −3 × x × x = <b>−3x<sup>2</sup></b>.<br>• 2x × (−4x) = 2 × (−4) × x × x = <b>−8x<sup>2</sup></b>.<br>• x × x + x × 3 − 5 = <b>x<sup>2</sup> + 3x − 5</b> (les x<sup>2</sup> et les x ne se regroupent pas).</div>
<div class="warn">⚠️ x + x + x = <b>3x</b> (trois fois x), alors que x × x × x = x<sup>3</sup>. Ne confonds pas addition et multiplication !<br>⚠️ x × x = x<sup>2</sup>, pas 2x : pour x = 5, x<sup>2</sup> = 25 alors que 2x = 10.<br>⚠️ Dans 2 × x × 5, on <b>multiplie</b> 2 et 5 (10x), on ne les additionne pas.</div>
<div class="retenir">À retenir : 3 × x = 3x, x × x = x<sup>2</sup>, mais x + x = 2x.</div>`;
}

/* ======================================================================
   4. Réduire une expression
   ====================================================================== */
function L4(d) {
  let t, deg;
  if (d < 2) {
    deg = 2;
    let a1, a2, b1, b2;
    do {
      if (d < 1) { a1 = ri(1, 7); a2 = ri(1, 7); b1 = ri(1, 9); b2 = ri(1, 9); }
      else { a1 = nz(-8, 8); a2 = nz(-8, 8); b1 = nz(-9, 9); b2 = nz(-9, 9); }
    } while (a1 + a2 === 0 || b1 + b2 === 0); // aucune famille ne s'annule (« 9 − 9 »)
    t = [[a1, 1], [b1, 0], [a2, 1], [b2, 0]];
    if (d >= 1) shuffle(t);
  } else {
    deg = 3;
    // chaque famille (x², x, nombres) garde un coefficient non nul : pas de « 7 − 7 » qui disparaît
    const fam0 = q => t.filter(u => u[1] === q).reduce((s, u) => s + u[0], 0);
    do {
      t = [[nz(-5, 5), 2], [nz(-5, 5), 2], [nz(-8, 8), 1], [nz(-8, 8), 1], [nz(-9, 9), 0]];
      if (d >= 3) t.push(pick([[nz(-3, 3), 1], [nz(-9, 9), 0], [nz(-2, 2), 2]]));
    } while ([0, 1, 2].some(q => fam0(q) === 0));
    shuffle(t);
  }
  const p = [0, 0, 0];
  t.forEach(([c, q]) => { p[2 - q] += c; });
  const ast = S(...t.map(([c, q]) => Mo(c, q)));
  const nTiles = t.reduce((s, u) => s + Math.abs(u[0]), 0);
  const fam = q => t.filter(u => u[1] === q).map((u, i) => (i ? ' ' + (u[0] < 0 ? '− ' + M(-u[0]) : '+ ' + M(u[0])) : M(u[0]))).join('');
  const lines = [2, 1, 0].filter(q => t.some(u => u[1] === q)).map(q => `${['nombres', 'termes en x', 'termes en x<sup>2</sup>'][q]} : ${fam(q)} = ${M(p[2 - q])}`);
  return devQ(ast, p, deg, {
    html: `Réduis l'expression :${big('A = ' + h(ast))}${deg === 3 ? NOTE3 : NOTE2}`,
    msg: v => v[0] + v[1] + v[2] === p[0] + p[1] + p[2] && (deg === 3 ? v[0] !== p[0] && v[2] === p[2] : v[1] !== p[1])
      ? (deg === 3 ? 'Les x² et les x ne sont pas de la même famille : on ne les ajoute pas ensemble.' : 'Un x et un nombre seul ne s\'ajoutent pas : 3x + 2 ne fait pas 5x.')
      : v.every((c, i) => Math.abs(c) === Math.abs(p[i])) ? 'Presque ! Vérifie les signes : chaque terme garde le signe écrit <b>devant</b> lui.' : '',
    hint: `Repère les familles : ${deg === 3 ? 'les x<sup>2</sup>, ' : ''}les x, les nombres seuls. Ajoute les coefficients de chaque famille, en gardant le signe qui est <b>devant</b> chaque terme.`,
    solution: `${lines.join(' ; ')}. Donc A = <b>${poly3(p)}</b>.`,
    visual: nTiles <= 26 ? tuiles(t.map(([c, q]) => [c, q])) : '',
    afterVisual: nTiles <= 26 ? tuiles([[p[0], 2], [p[1], 1], [p[2], 0]]) : '',
  });
}
function C4() {
  return `<h2>4. Réduire une expression</h2>
<p class="intro">Une expression est plus facile à lire et à calculer quand elle est <b>réduite</b> : le moins de termes possible.</p>
<div class="def"><b>Réduire</b>, c'est regrouper les <b>termes semblables</b> (de la même famille) : les x<sup>2</sup> avec les x<sup>2</sup>, les x avec les x, les nombres avec les nombres. On ajoute leurs coefficients.</div>
<div class="cols">
<div>${tuiles([[2, 1], [3, 0], [1, 1], [-1, 0]])}</div>
<div>${tuiles([[3, 1], [2, 0]])}</div>
</div>
<p class="note">2x + 3 + x − 1 donne 3x + 2 : trois barres x, et 3 − 1 = 2 unités. Une tuile rouge (négative) annule une tuile jaune.</p>
<div class="methode"><b>Méthode</b><ol>
<li>Repère les familles : les x<sup>2</sup>, les x, les nombres seuls.</li>
<li>Chaque terme garde le signe écrit <b>devant</b> lui.</li>
<li>Pour chaque famille, ajoute les coefficients.</li>
<li>Écris le résultat dans l'ordre : x<sup>2</sup>, puis x, puis le nombre.</li></ol></div>
<div class="ex"><span class="q">Exemple 1 : réduis A = 5x + 3 − 2x + 4.</span><br>Les x : 5 − 2 = 3. Les nombres : 3 + 4 = 7. Donc A = <b>3x + 7</b>.</div>
<div class="ex"><span class="q">Exemple 2 : réduis B = −4 + 3x − 7x + 9 et C = x<sup>2</sup> + 4x − 3x<sup>2</sup> − x + 2.</span><br>• Les x : 3 − 7 = −4 ; les nombres : −4 + 9 = 5. Donc B = <b>−4x + 5</b>.<br>• Les x<sup>2</sup> : 1 − 3 = −2 ; les x : 4 − 1 = 3 ; le nombre : 2. Donc C = <b>−2x<sup>2</sup> + 3x + 2</b>.</div>
<div class="warn">⚠️ 3x + 2 ne se réduit pas : un x et un nombre ne sont pas de la même famille. De même, x<sup>2</sup> + x n'est pas 2x<sup>2</sup>.<br>⚠️ Le signe appartient au terme qui le suit : dans 7 − 2x, le terme en x est <b>−2x</b>.</div>
<div class="retenir">À retenir : on n'ajoute que des termes de la même famille, chacun avec son signe.</div>`;
}

/* ======================================================================
   5. Simple distributivité k(a + b)
   ====================================================================== */
function L5(d) {
  const fx = d >= 3 && chance(0.5);
  const k = d < 2 ? ri(2, 9) : (chance(0.5) ? -1 : 1) * ri(2, 9);
  const a = d < 1 ? 1 : fx ? nz(-4, 5) : ri(1, 5), b = d < 1 ? ri(1, 9) : nz(-9, 9);
  const rev = d >= 3 && !fx && chance(0.5);
  const inner = rev ? Lr(a, b) : L(a, b);
  const kf = fx ? [k, 1] : [k, 0];
  const ast = Pr(Mo(...kf), inner);
  const p = fx ? [k * a, k * b, 0] : [0, k * a, k * b];
  const deg = fx ? 3 : 2;
  const tops = linTerms(a, b, rev);
  const aire = k > 0 && a > 0 && b > 0 && !fx;
  const g = grilles([kf], tops, prodCells([kf], tops), aire);
  return devQ(ast, p, deg, {
    html: `Développe et réduis :${big('A = ' + h(ast))}${deg === 3 ? NOTE3 : NOTE2}`,
    msg: v => fx && v[1] === k * a && v[0] === 0 ? `${mono(k, 1)} × ${mono(a, 1)} donne des x<sup>2</sup> (x × x = x²).`
      : (fx ? v[0] === p[0] && v[1] === b : v[1] === p[1] && v[2] === b) ? `Tu n'as multiplié que le premier terme : ${mono(...kf)} multiplie <b>tous</b> les termes de la parenthèse.`
        : (fx ? v[0] === p[0] && v[1] === -p[1] : v[1] === p[1] && v[2] === -p[2]) ? 'Le premier produit est juste. Revois le signe du second (règle des signes).' : '',
    hint: `Distribue : ${mono(...kf)} multiplie <b>chaque</b> terme de la parenthèse. k(a + b) = k × a + k × b. Attention aux signes.`,
    solution: `${h(ast)} = ${tops.map(t => `${k < 0 ? '(' + mono(...kf) + ')' : mono(...kf)} × ${t[0] < 0 ? '(' + mono(...t) + ')' : mono(...t)}`).join(' + ')} = <b>${poly3(p)}</b>`,
    visual: g.visual, afterVisual: g.afterVisual,
  });
}
function C5() {
  return `<h2>5. Simple distributivité</h2>
<p class="intro">Développer permet de se débarrasser des parenthèses. C'est souvent la première étape pour résoudre une équation ou comparer deux expressions.</p>
<div class="def"><b>Développer</b>, c'est transformer un produit en somme.<br><b>k(a + b) = k × a + k × b</b> &nbsp;&nbsp; et &nbsp;&nbsp; <b>k(a − b) = k × a − k × b</b></div>
<div class="cols">
<div>${grille({ left: ['3'], top: ['x', '4'], cells: [['3x', '12']], aire: true, legende: 'Aire : 3(x + 4) = 3x + 12' })}</div>
<div>${grille({ left: ['−2'], top: ['x', '−6'], cells: [['−2x', '12']], legende: '−2(x − 6) = −2x + 12' })}</div>
</div>
<div class="methode"><b>Méthode</b><ol>
<li>Repère le facteur k devant la parenthèse (avec son signe).</li>
<li>Multiplie k par <b>chaque</b> terme de la parenthèse : le tableau t'aide.</li>
<li>Applique la règle des signes, puis écris le résultat réduit.</li></ol></div>
<div class="ex"><span class="q">Exemple 1 : développe 5(2x − 3).</span><br>5(2x − 3) = 5 × 2x − 5 × 3 = <b>10x − 15</b></div>
<div class="ex"><span class="q">Exemple 2 : développe −2(x − 6), 4(3 − 2x) et 3x(2x − 5).</span><br>• −2(x − 6) = −2 × x + (−2) × (−6) = <b>−2x + 12</b>.<br>• 4(3 − 2x) = 12 − 8x = <b>−8x + 12</b>.<br>• 3x(2x − 5) = 3x × 2x − 3x × 5 = <b>6x<sup>2</sup> − 15x</b> (x × x donne x<sup>2</sup>).</div>
<div class="warn">⚠️ k multiplie <b>tous</b> les termes : 3(x + 4) n'est pas 3x + 4.<br>⚠️ Avec un k négatif, utilise la règle des signes : (−2) × (−6) = +12.<br>⚠️ 3x × 2x = 6x<sup>2</sup>, pas 6x.</div>
<div class="retenir">À retenir : k(a + b) = ka + kb, le facteur k multiplie chaque terme.</div>`;
}

/* ======================================================================
   6. Parenthèses précédées d'un signe −
   ====================================================================== */
function L6(d) {
  const v = d < 1 ? 0 : d < 2 ? 1 : d < 3 ? 2 : d < 4 ? 3 : pick([2, 3, 4]);
  let ast, A, B, deg = 2, Bterms;
  if (v === 0) {
    const a = ri(1, 5), b = ri(1, 9), c = ri(2, 15);
    ast = chance(0.5) ? S(N(c), Ng(L(a, b))) : S(Ng(L(a, b)), N(c));
    A = [0, 0, c]; B = [0, a, b]; Bterms = linTerms(a, b);
  } else if (v === 1) {
    let m, c, a, b;
    do { m = nz(-6, 6); c = ri(-9, 9); a = nz(-5, 5); b = nz(-9, 9); } while (m === a || c === b); // pas « 3 − 3 » une fois la parenthèse ôtée
    ast = S(Mo(m, 1), N(c), Ng(L(a, b))); A = [0, m, c]; B = [0, a, b]; Bterms = linTerms(a, b);
  } else if (v === 2) {
    let a, b, c, e; do { a = nz(-6, 6); b = nz(-9, 9); c = nz(-6, 6); e = nz(-9, 9); } while (a === c || b === e);
    ast = S(L(a, b), Ng(L(c, e))); A = [0, a, b]; B = [0, c, e]; Bterms = linTerms(c, e);
  } else if (v === 3) {
    deg = 3;
    let a1, a2, b1, b2, c1, c2;
    do { a1 = nz(-4, 5); a2 = nz(-4, 5); b1 = ri(-7, 7); b2 = nz(-7, 7); c1 = nz(-9, 9); c2 = nz(-9, 9); } while (a1 === a2 || b1 === b2 || c1 === c2);
    ast = S(Pa(S(Mo(a1, 2), Mo(b1, 1), N(c1))), Ng(Pa(S(Mo(a2, 2), Mo(b2, 1), N(c2)))));
    A = [a1, b1, c1]; B = [a2, b2, c2]; Bterms = [[a2, 2], [b2, 1], [c2, 0]].filter(t => t[0]);
  } else {
    let k, a, b, c, e; do { k = ri(2, 6); a = ri(1, 4); b = nz(-9, 9); c = nz(-6, 6); e = nz(-9, 9); } while (k * a === c || k * b === e);
    ast = S(Pr(Mo(k, 0), L(a, b)), Ng(L(c, e))); A = [0, k * a, k * b]; B = [0, c, e]; Bterms = linTerms(c, e);
  }
  const p = sub(A, B);
  // erreur classique : le − ne change que le signe du premier terme de la parenthèse
  const lead = 2 - Bterms[0][1], wrongFirst = add(A, B.map((c, i) => (i === lead ? -c : c)));
  const g = v <= 2 ? grilles([[-1, 0]], Bterms, prodCells([[-1, 0]], Bterms), false) : {};
  return devQ(ast, p, deg, {
    html: `Supprime les parenthèses et réduis :${big('A = ' + h(ast))}${deg === 3 ? NOTE3 : NOTE2}`,
    msg: u => eq(u, wrongFirst) ? 'Le − devant la parenthèse change le signe de <b>tous</b> les termes de la parenthèse, pas seulement du premier.'
      : eq(u, add(A, B)) ? "Tu as enlevé la parenthèse sans changer les signes : avec un − devant, il faut les changer tous." : '',
    hint: `Un signe − devant une parenthèse, c'est −1 × ( … ) : on enlève la parenthèse en <b>changeant le signe de chaque terme</b> à l'intérieur. Ensuite, on réduit.`,
    solution: `−(${monos(Bterms)}) = ${monos(Bterms.map(([c, q]) => [-c, q]))}. Donc A = ${monos([[A[0], 2], [A[1], 1], [A[2], 0]]).replace(/^0$/, '')}${A.some(c => c) ? ' ' : ''}${Bterms.map(([c, q], i) => (i || A.some(x => x) ? (c > 0 ? '− ' : '+ ') + mono(Math.abs(c), q) : mono(-c, q))).join(' ')} = <b>${poly3(p)}</b>.`,
    visual: g.visual, afterVisual: g.afterVisual,
  });
}
function C6() {
  return `<h2>6. Un signe − devant une parenthèse</h2>
<p class="intro">Un signe − devant une parenthèse est un piège fréquent. Il suffit de se rappeler qu'il veut dire « multiplier par −1 ».</p>
<div class="cols">
<div class="def">• Un <b>+</b> devant une parenthèse : on l'enlève sans rien changer.<br>a + (b − c) = a + b − c<br>• Un <b>−</b> devant une parenthèse : on l'enlève en <b>changeant le signe de chaque terme</b>.<br>a − (b − c) = a − b + c</div>
<div>${grille({ left: ['−1'], top: ['2x', '−3'], cells: [['−2x', '3']], legende: '−(2x − 3) = −2x + 3' })}</div>
</div>
<div class="methode"><b>Méthode</b><ol>
<li>Repère le signe juste devant la parenthèse.</li>
<li>Si c'est un −, recopie chaque terme de la parenthèse avec le <b>signe contraire</b>, et le − disparaît.</li>
<li>Si un produit est devant (3(x + 2)), développe-le d'abord.</li>
<li>Réduis : les x avec les x, les nombres avec les nombres.</li></ol></div>
<div class="ex"><span class="q">Exemple 1 : réduis 10 − (3x + 4) et (5x − 2) − (x − 7).</span><br>• 10 − (3x + 4) = 10 − 3x − 4 = <b>−3x + 6</b>.<br>• (5x − 2) − (x − 7) = 5x − 2 − x + 7 = <b>4x + 5</b>.</div>
<div class="ex"><span class="q">Exemple 2 : réduis (x<sup>2</sup> − 3x + 1) − (2x<sup>2</sup> + x − 5), puis 3(x + 2) − (4x − 1).</span><br>• x<sup>2</sup> − 3x + 1 − 2x<sup>2</sup> − x + 5 = <b>−x<sup>2</sup> − 4x + 6</b> (les trois signes changent).<br>• 3x + 6 − 4x + 1 = <b>−x + 7</b>.</div>
<div class="warn">⚠️ Erreur classique : 10 − (3x + 4) = 10 − 3x <b>+ 4</b>. Non ! Le − s'applique à <b>tous</b> les termes : − 3x <b>− 4</b>.<br>⚠️ Ne l'oublie pas non plus : enlever la parenthèse sans changer les signes est faux.<br>⚠️ Le signe − devant la parenthèse disparaît avec elle : ne le compte pas deux fois.</div>
<div class="retenir">À retenir : −(a + b − c) = −a − b + c, tous les signes changent.</div>`;
}

/* ======================================================================
   7. Double distributivité
   ====================================================================== */
function L7(d) {
  let a = 1, b, c = 1, e;
  if (d < 1) { b = ri(1, 9); e = ri(1, 9); }
  else if (d < 2) { b = nz(-9, 9); e = nz(-9, 9); }
  else if (d < 3) { a = chance(0.7) ? ri(2, 5) : 1; b = nz(-9, 9); e = nz(-9, 9); }
  else { a = nz(-4, 5); c = nz(-3, 4); b = nz(-9, 9); e = nz(-9, 9); }
  const r1 = d >= 3 && chance(0.3), r2 = d >= 3 && chance(0.3);
  const ast = Pr(r1 ? Lr(a, b) : L(a, b), r2 ? Lr(c, e) : L(c, e));
  const p = mulL(a, b, c, e);
  const left = linTerms(a, b, r1), top = linTerms(c, e, r2);
  const g = grilles(left, top, prodCells(left, top), a > 0 && b > 0 && c > 0 && e > 0);
  return devQ(ast, p, 3, {
    html: `Développe et réduis :${big('A = ' + h(ast))}${NOTE3}`,
    msg: v => v[0] === p[0] && v[2] === p[2] && v[1] !== p[1]
      ? (v[1] === 0 ? 'Tu as fait 2 produits sur 4 : il manque les deux produits « croisés » du milieu.'
        : v[1] === a * e || v[1] === b * c ? 'Il manque un produit : en double distributivité, il y en a <b>4</b>.'
          : 'Le terme en x<sup>2</sup> et le nombre seul sont justes. Revois les deux produits du milieu (et leurs signes).')
      : v[0] === p[0] && v[1] === p[1] && v[2] === b + e ? `Le nombre seul est un <b>produit</b> : ${P(b)} × ${P(e)}.` : '',
    hint: `Chaque terme de la 1<sup>re</sup> parenthèse multiplie chaque terme de la 2<sup>e</sup> : cela fait <b>4 produits</b> (le tableau t'aide). Ensuite, réduis les deux termes en x.`,
    solution: `${h(ast)} = ${prodCells(left, top).flat().map((s, i) => (i && !s.startsWith('−') ? '+ ' : i ? '− ' : '') + (i ? s.replace(/^−/, '') : s)).join(' ')} = <b>${poly3(p)}</b>`,
    visual: g.visual, afterVisual: g.afterVisual,
  });
}
function C7() {
  return `<h2>7. Double distributivité</h2>
<p class="intro">Pour développer le produit de deux parenthèses, on distribue deux fois. Un tableau évite d'oublier un produit.</p>
<div class="def"><b>(a + b)(c + d) = ac + ad + bc + bd</b><br>Chaque terme de la première parenthèse multiplie chaque terme de la seconde : <b>4 produits</b>.</div>
<div class="cols">
<div>${grille({ left: ['x', '2'], top: ['x', '5'], cells: [['x²', '5x'], ['2x', '10']], aire: true, legende: '(x + 2)(x + 5)' })}</div>
<div>${grille({ left: ['2x', '−3'], top: ['x', '4'], cells: [['2x²', '8x'], ['−3x', '−12']], legende: '(2x − 3)(x + 4)' })}</div>
</div>
<div class="methode"><b>Méthode</b><ol>
<li>Écris les termes de la 1<sup>re</sup> parenthèse à gauche, ceux de la 2<sup>e</sup> en haut, <b>avec leurs signes</b>.</li>
<li>Remplis les 4 cases : chaque case est un produit.</li>
<li>Additionne les 4 cases, puis réduis les deux termes en x.</li></ol></div>
<div class="ex"><span class="q">Exemple 1 : développe (x + 2)(x + 5).</span><br>(x + 2)(x + 5) = x<sup>2</sup> + 5x + 2x + 10 = <b>x<sup>2</sup> + 7x + 10</b></div>
<div class="ex"><span class="q">Exemple 2 : développe (2x − 3)(x + 4) et (3 − x)(2x + 1).</span><br>• 2x<sup>2</sup> + 8x − 3x − 12 = <b>2x<sup>2</sup> + 5x − 12</b>.<br>• (3 − x)(2x + 1) = 6x + 3 − 2x<sup>2</sup> − x = <b>−2x<sup>2</sup> + 5x + 3</b> (les termes sont dans le désordre : range-les à la fin).</div>
<div class="warn">⚠️ (x + 2)(x + 5) n'est pas x<sup>2</sup> + 10 : il manque les deux produits du milieu.<br>⚠️ Le nombre seul est un <b>produit</b> : 2 × 5 = 10, pas 2 + 5.<br>⚠️ Garde les signes dans le tableau : (−3) × 4 = −12.</div>
<div class="retenir">À retenir : deux parenthèses de deux termes donnent 4 produits, puis on réduit.</div>`;
}

/* ======================================================================
   8. Identités remarquables : développer
   ====================================================================== */
function L8(d) {
  const v = d < 1 ? 0 : d < 2 ? ri(0, 1) : d < 3 ? ri(0, 2) : pick([0, 1, 2, 3, 3, 4]);
  const a = ri(1, d < 2 ? 9 : 10);
  let k = 1, ast, p, A, B, kind;
  if (v <= 1) { const s = v ? -a : a; ast = Sq(L(1, s)); p = [1, 2 * s, a * a]; kind = 'sq'; A = 'x'; B = String(a); }
  else if (v === 2) { ast = chance(0.5) ? Pr(L(1, a), L(1, -a)) : Pr(L(1, -a), L(1, a)); p = [1, 0, -a * a]; kind = 'diff'; A = 'x'; B = String(a); }
  else if (v === 3) {
    k = ri(2, 5);
    if (chance(0.6)) { const s = chance(0.5) ? a : -a; ast = Sq(L(k, s)); p = [k * k, 2 * k * s, a * a]; kind = 'sq'; }
    else { ast = Pr(L(k, a), L(k, -a)); p = [k * k, 0, -a * a]; kind = 'diff'; }
    A = k + 'x'; B = String(a);
  } else { k = ri(1, 3); ast = Sq(Lr(-k, a)); p = [k * k, -2 * k * a, a * a]; kind = 'sq'; A = String(a); B = mono(k, 1); }
  const s = kind === 'sq' ? p[1] / (2 * k) : 0;
  const plus = kind === 'sq' && p[1] > 0;
  const ID = kind === 'diff' ? '(A + B)(A − B) = A<sup>2</sup> − B<sup>2</sup>' : plus ? '(A + B)<sup>2</sup> = A<sup>2</sup> + 2AB + B<sup>2</sup>' : '(A − B)<sup>2</sup> = A<sup>2</sup> − 2AB + B<sup>2</sup>';
  const sides = v === 4 ? [[a, 0], [-k, 1]] : [[k, 1], [kind === 'sq' ? s : a, 0]];
  const sides2 = v === 4 ? sides : [[k, 1], [kind === 'sq' ? s : -a, 0]];
  const g = grilles(sides, sides2, prodCells(sides, sides2), kind === 'sq' && sides.every(t => t[0] > 0));
  return devQ(ast, p, 3, {
    html: `Développe à l'aide d'une identité remarquable :${big('A = ' + h(ast))}${NOTE3}`,
    msg: u => kind === 'sq' && u[0] === p[0] && u[2] === p[2] && u[1] === 0 ? 'Il manque le <b>double produit</b> 2AB : (A + B)<sup>2</sup> n\'est pas A<sup>2</sup> + B<sup>2</sup> !'
      : kind === 'sq' && u[1] === p[1] / 2 ? 'Le terme du milieu est le <b>double</b> produit : 2 × A × B.'
        : u[0] === p[0] && u[1] === p[1] && u[2] === -p[2] ? (kind === 'sq' ? 'Le dernier terme est un carré : B<sup>2</sup> est toujours positif.' : '(A + B)(A − B) = A<sup>2</sup> <b>−</b> B<sup>2</sup> : le nombre seul est négatif.')
          : k > 1 && u[0] === k && u[1] === p[1] ? `(${k}x)<sup>2</sup> = ${k}x × ${k}x = ${k * k}x<sup>2</sup> : le ${k} est aussi élevé au carré.`
            : kind === 'diff' && u[1] !== 0 && u[0] === p[0] && u[2] === p[2] ? 'Dans (A + B)(A − B), les termes en x s\'annulent : AB − AB = 0.' : '',
    hint: `Utilise ${ID}, avec A = ${A} et B = ${B}.${kind === 'sq' ? ' N\'oublie pas le double produit 2AB !' : ''}`,
    solution: kind === 'sq'
      ? `${ID} avec A = ${A}, B = ${B} : ${h(ast)} = ${v === 4 ? a * a : (k === 1 ? 'x' : `(${k}x)`) + '<sup>2</sup>'} ${plus ? '+' : '−'} 2 × ${v === 4 ? a + ' × ' + mono(k, 1) : A + ' × ' + B} + ${v === 4 ? (k === 1 ? 'x' : `(${k}x)`) + '<sup>2</sup>' : B + '<sup>2</sup>'} = <b>${poly3(p)}</b>`
      : `${ID} avec A = ${A}, B = ${B} : ${h(ast)} = ${k === 1 ? 'x' : `(${k}x)`}<sup>2</sup> − ${B}<sup>2</sup> = <b>${poly3(p)}</b>`,
    visual: g.visual, afterVisual: g.afterVisual,
  });
}
function C8() {
  return `<h2>8. Les identités remarquables</h2>
<p class="intro">Trois produits reviennent si souvent qu'on apprend leur développement par cœur. Ils font gagner du temps et servent aussi à factoriser.</p>
<div class="cols">
<div class="def">(A + B)<sup>2</sup> = A<sup>2</sup> + <b>2AB</b> + B<sup>2</sup><br>(A − B)<sup>2</sup> = A<sup>2</sup> − <b>2AB</b> + B<sup>2</sup><br>(A + B)(A − B) = A<sup>2</sup> − B<sup>2</sup></div>
<div>${grille({ left: ['x', '3'], top: ['x', '3'], cells: [['x²', '3x'], ['3x', '9']], aire: true, legende: '(x + 3)² = x² + 6x + 9' })}</div>
</div>
<p class="note">Le carré de côté x + 3 contient <b>deux</b> rectangles 3x : c'est le double produit 2AB.</p>
<div class="methode"><b>Méthode</b><ol>
<li>Reconnais la forme : un carré d'une somme, d'une différence, ou (A + B)(A − B).</li>
<li>Repère A et B : dans (2x − 5)<sup>2</sup>, A = 2x et B = 5.</li>
<li>Applique la formule, en calculant (2x)<sup>2</sup> = 4x<sup>2</sup> et le double produit 2 × A × B.</li></ol></div>
<div class="ex"><span class="q">Exemple 1 : développe (x + 3)<sup>2</sup> et (x + 7)(x − 7).</span><br>• (x + 3)<sup>2</sup> = x<sup>2</sup> + 2 × x × 3 + 3<sup>2</sup> = <b>x<sup>2</sup> + 6x + 9</b>.<br>• (x + 7)(x − 7) = x<sup>2</sup> − 7<sup>2</sup> = <b>x<sup>2</sup> − 49</b>.</div>
<div class="ex"><span class="q">Exemple 2 : développe (2x − 5)<sup>2</sup>, (3x + 2)(3x − 2) et (5 − 2x)<sup>2</sup>.</span><br>• (2x)<sup>2</sup> − 2 × 2x × 5 + 5<sup>2</sup> = <b>4x<sup>2</sup> − 20x + 25</b>.<br>• (3x)<sup>2</sup> − 2<sup>2</sup> = <b>9x<sup>2</sup> − 4</b>.<br>• 5<sup>2</sup> − 2 × 5 × 2x + (2x)<sup>2</sup> = 25 − 20x + 4x<sup>2</sup> = <b>4x<sup>2</sup> − 20x + 25</b>.</div>
<div class="warn">⚠️ Erreur classique : (x + 3)<sup>2</sup> = x<sup>2</sup> + 9. <b>Faux !</b> Il manque le double produit 6x. Vérifie avec x = 1 : 4<sup>2</sup> = 16, mais 1 + 9 = 10.<br>⚠️ (2x)<sup>2</sup> = 4x<sup>2</sup>, pas 2x<sup>2</sup> ; et B<sup>2</sup> est toujours positif : (−5)<sup>2</sup> = +25.<br>⚠️ (A + B)(A − B) = A<sup>2</sup> <b>−</b> B<sup>2</sup> : le nombre seul est négatif.</div>
<div class="retenir">À retenir : (A ± B)<sup>2</sup> = A<sup>2</sup> ± 2AB + B<sup>2</sup>, sans oublier le double produit.</div>`;
}

/* ======================================================================
   9. Développer et réduire une somme de produits
   ====================================================================== */
function L9(d) {
  const v = d < 1 ? 0 : d < 2 ? 1 : d < 3 ? 2 : d < 4 ? 3 : pick([1, 2, 3, 4]);
  let ast, A, B, minus = false, deg = 3, Bt;
  if (v === 0) {
    const k = ri(2, 6), m = ri(2, 6), a = ri(1, 9), b = ri(1, 9);
    ast = S(Pr(Mo(k, 0), L(1, a)), Pr(Mo(m, 0), L(1, b))); A = [0, k, k * a]; B = [0, m, m * b]; deg = 2;
  } else if (v === 1) {
    let k, m, a, b, c, e; // les termes en x ou les nombres ne s'annulent pas
    do { k = ri(2, 6); m = ri(2, 6); a = ri(1, 4); b = nz(-9, 9); c = ri(1, 4); e = nz(-9, 9); } while (k * a === m * c || k * b === m * e);
    ast = S(Pr(Mo(k, 0), L(a, b)), Pr(Mo(-m, 0), L(c, e))); A = [0, k * a, k * b]; B = [0, m * c, m * e]; minus = true; deg = 2;
  } else if (v === 2) {
    const a = nz(-7, 7), b = nz(-7, 7), k = nz(-5, 6), c = nz(-8, 8);
    ast = S(Pr(L(1, a), L(1, b)), Pr(Mo(k, 0), L(1, c))); A = mulL(1, a, 1, b); B = [0, k, k * c];
  } else if (v === 3) {
    const a = nz(-6, 6), b = nz(-6, 6), c = nz(-6, 6);
    ast = S(Sq(L(1, a)), Pr(Mo(-1, 0), L(1, b), L(1, c))); A = [1, 2 * a, a * a]; B = mulL(1, b, 1, c); minus = true;
  } else {
    const a = ri(2, 3), b = nz(-5, 5), c = ri(1, 3), e = nz(-5, 5), f = ri(1, 3), g = nz(-5, 5);
    ast = S(Pr(L(a, b), L(c, e)), Pr(Mo(-1, 0), Sq(L(f, g)))); A = mulL(a, b, c, e); B = [f * f, 2 * f * g, g * g]; minus = true;
  }
  const p = minus ? sub(A, B) : add(A, B);
  if (deg === 2 && p[0] !== 0) deg = 3;
  Bt = [[B[0], 2], [B[1], 1], [B[2], 0]].filter(t => t[0]);
  const lead = 2 - Bt[0][1];
  const wrongFirst = add(A, B.map((c, i) => (i === lead ? -c : c)));
  return devQ(ast, p, deg, {
    html: `Développe et réduis :${big('A = ' + h(ast))}${deg === 3 ? NOTE3 : NOTE2}`,
    msg: u => minus && eq(u, wrongFirst) ? 'Un − devant un produit : développe d\'abord le produit <b>entre parenthèses</b>, puis change le signe de <b>tous</b> ses termes.'
      : minus && eq(u, add(A, B)) ? 'Tu as oublié le signe − devant le second produit : il change le signe de tous ses termes.' : '',
    hint: `Développe chaque produit séparément${minus ? ', en gardant le second <b>entre parenthèses</b> (il est précédé d\'un −)' : ''}. Ensuite, enlève les parenthèses et réduis.`,
    solution: `Premier produit : ${ptxt(A)}. Second produit : ${ptxt(B)}. A = ${ptxt(A)} ${minus ? '− (' + ptxt(B) + ')' : '+ ' + ptxt(B)}${minus ? ' = ' + ptxt(A) + ' ' + Bt.map(([c, q]) => (c > 0 ? '− ' : '+ ') + mono(Math.abs(c), q)).join(' ') : ''} = <b>${poly3(p)}</b>`,
  });
}
function C9() {
  return `<h2>9. Développer et réduire une somme de produits</h2>
<p class="intro">On combine tout ce qu'on a vu : distributivité, identités remarquables et signe − devant une parenthèse. L'ordre des étapes compte.</p>
<div class="cols">
<div class="def">Pour développer une somme de produits, on développe <b>chaque</b> produit à part, puis on réduit.<br>Un produit précédé d'un <b>−</b> se développe <b>entre parenthèses</b>.</div>
<div>${grille({ left: ['x', '1'], top: ['x', '4'], cells: [['x²', '4x'], ['x', '4']], legende: '(x + 1)(x + 4) = x² + 5x + 4' })}</div>
</div>
<div class="methode"><b>Méthode</b><ol>
<li>Souligne chaque produit et développe-le à part, au brouillon.</li>
<li>S'il est précédé d'un −, écris son développement <b>entre parenthèses</b>.</li>
<li>Enlève les parenthèses en changeant tous les signes après un −.</li>
<li>Réduis : les x<sup>2</sup>, les x, puis les nombres.</li></ol></div>
<div class="ex"><span class="q">Exemple 1 : A = 3(x + 2) − 2(x − 5).</span><br>A = 3x + 6 − (2x − 10) = 3x + 6 − 2x + 10 = <b>x + 16</b></div>
<div class="ex"><span class="q">Exemple 2 : B = (x + 3)<sup>2</sup> − (x + 1)(x + 4).</span><br>B = x<sup>2</sup> + 6x + 9 − (x<sup>2</sup> + 5x + 4)<br>= x<sup>2</sup> + 6x + 9 − x<sup>2</sup> − 5x − 4 = <b>x + 5</b> (les x<sup>2</sup> s'annulent).</div>
<div class="ex"><span class="q">Exemple 3 : C = (2x + 1)(x − 3) − (x − 2)<sup>2</sup>.</span><br>C = (2x<sup>2</sup> − 5x − 3) − (x<sup>2</sup> − 4x + 4) = 2x<sup>2</sup> − 5x − 3 − x<sup>2</sup> + 4x − 4 = <b>x<sup>2</sup> − x − 7</b></div>
<div class="warn">⚠️ Erreur classique : − (x + 1)(x + 4) = − x<sup>2</sup> + 5x + 4. Non : le − change <b>tous</b> les signes : − x<sup>2</sup> <b>− 5x − 4</b>.<br>⚠️ Les x<sup>2</sup> peuvent s'annuler : le résultat peut être de degré 1 (tape alors 0 devant x<sup>2</sup>).</div>
<div class="retenir">À retenir : chaque produit d'abord, entre parenthèses s'il suit un −, puis on réduit.</div>`;
}

/* ======================================================================
   10. Factoriser par un facteur commun
   ====================================================================== */
function L10(d) {
  const v = d < 1 ? 0 : d < 2 ? 1 : d < 3 ? 2 : d < 4 ? pick([1, 2, 3]) : pick([2, 3, 4]);
  if (v <= 2) {
    let g, a, b; const fx = v === 2;
    do { g = fx ? ri(1, 6) : ri(2, 9); a = fx ? ri(1, 5) : ri(1, 6); b = v === 0 ? ri(1, 9) : nz(-9, 9); } while (gcd(a, b) !== 1 || (fx && g === 1 && a === 1 && chance(0.5)));
    const rev = v === 1 && chance(0.5);
    const t1 = fx ? Mo(g * a, 2) : Mo(g * a, 1), t2 = fx ? Mo(g * b, 1) : N(g * b);
    const ast = rev ? S(t2, t1) : S(t1, t2);
    const E = [g, a, b];
    const form = fx ? u => x => u[0] * x * (u[1] * x + u[2]) : u => x => u[0] * (u[1] * x + u[2]);
    const lt = fx ? 'x' : '';
    const kt = fx ? [g, 1] : [g, 0], in1 = [a, 1], in2 = [b, 0];
    const cellsT = rev ? [[mono(g * b, fx ? 1 : 0), mono(g * a, fx ? 2 : 1)]] : [[mono(g * a, fx ? 2 : 1), mono(g * b, fx ? 1 : 0)]];
    const tops = rev ? [in2, in1] : [in1, in2];
    const aire = g * a > 0 && g * b > 0;
    const before = grille({ left: ['?'], top: ['?', '?'], cells: cellsT, aire: false });
    const after = grille({ left: [mono(...kt)], top: tops.map(t => mono(...t)), cells: cellsT, aire });
    return {
      type: 'nums', tpl: `{0} ${lt}( {1} x + {2} )`,
      html: `Factorise avec le <b>plus grand</b> facteur commun${fx ? ' (de la forme k x)' : ''} :${big('A = ' + h(ast))}<span class="note">Tape le facteur positif, puis le contenu de la parenthèse (avec − si besoin).</span>`,
      check: formCheck(E, form, {
        accept: u => Math.abs(u[0]) === g,
        msg: (u, eqv) => eqv ? `C'est bien égal, mais ce n'est pas fini : on peut encore sortir un facteur de la parenthèse. Cherche le <b>plus grand</b> facteur commun.`
          : u[0] === g ? `Bon facteur commun ! Pour remplir la parenthèse, divise chaque terme par ${mono(...kt)}.` : '',
      }),
      verify: Ev => {
        const f = x => ev(ast, x);
        if (!same(f, form(Ev))) return false;
        const A2 = fx ? (f(1) + f(-1)) / 2 : 0, A1 = fx ? (f(1) - f(-1)) / 2 : f(1) - f(0), A0 = f(0);
        return Ev[0] === gcd(fx ? A2 : A1, fx ? A1 : A0);
      },
      hint: `Cherche le plus grand nombre qui divise ${fx ? 'les deux coefficients' : `${Math.abs(g * a)} et ${Math.abs(g * b)}`}${fx ? ', et remarque que x est dans les deux termes' : ''}. Puis divise chaque terme par ce facteur : k × □ + k × □ = k(□ + □).`,
      solution: `${h(ast)} = ${mono(...kt)} × ${mono(a, fx ? 1 : 1)} ${b < 0 ? '−' : '+'} ${mono(...kt)} × ${Math.abs(b)} = <b>${mono(...kt)}(${monos([[a, 1], [b, 0]])})</b>`,
      visual: before, afterVisual: after, replaceVisual: true,
    };
  }
  // facteur commun entre parenthèses
  const a = nz(-6, 6), com = L(1, a);
  let ast, E, minus = false;
  if (v === 3) {
    let b, c, e, f, op;
    do { b = nz(-3, 4); c = nz(-8, 8); e = nz(-3, 4); f = nz(-8, 8); op = chance(0.5) ? 1 : -1; } while (b + op * e === 0 || (c + op * f === 0 && chance(0.7)));
    minus = op < 0;
    const p1 = chance(0.5) ? Pr(com, L(b, c)) : Pr(L(b, c), com);
    ast = S(p1, minus ? Pr(Mo(-1, 0), com, L(e, f)) : Pr(com, L(e, f)));
    E = [b + op * e, c + op * f];
  } else {
    if (chance(0.5)) { const k = nz(-7, 7); ast = S(Sq(com), Pr(Mo(k, 0), com)); E = [1, a + k]; if (E[1] === 0) return L10(d); }
    else { let e, f; do { e = nz(-3, 4); f = nz(-8, 8); } while (e === 1); ast = S(Sq(com), Pr(Mo(-1, 0), com, L(e, f))); E = [1 - e, a - f]; minus = true; }
  }
  const form = u => x => (x + a) * (u[0] * x + u[1]);
  return {
    type: 'nums', tpl: `${h(com)}( {0} x + {1} )`,
    html: `Factorise :${big('A = ' + h(ast))}<span class="note">Le facteur commun est déjà écrit : complète la seconde parenthèse.</span>`,
    check: formCheck(E, form, {
      msg: u => minus ? 'Attention : le − devant le second produit s\'applique à <b>toute</b> sa parenthèse. Écris A = ' + h(com) + '[ … − ( … ) ] puis réduis le crochet.' : '',
    }),
    verify: Ev => same(x => ev(ast, x), form(Ev)),
    hint: `${h(com)} apparaît dans chaque terme : c'est le facteur commun. A = ${h(com)} × [ ce qui reste du 1<sup>er</sup> terme ${minus ? '−' : '+'} ce qui reste du 2<sup>e</sup> ]. Réduis ensuite le crochet.`,
    solution: `A = ${h(com)} × [ … ${minus ? '−' : '+'} … ] = <b>${h(com)}(${monos([[E[0], 1], [E[1], 0]])})</b>`,
  };
}
function C10() {
  return `<h2>10. Factoriser par un facteur commun</h2>
<p class="intro">Factoriser, c'est faire le chemin inverse du développement. Une expression factorisée est un produit : c'est très utile pour résoudre une équation.</p>
<div class="def"><b>Factoriser</b>, c'est transformer une somme en produit.<br><b>k × a + k × b = k(a + b)</b> &nbsp; (k est le <b>facteur commun</b>)</div>
<div class="cols">
<div>${grille({ left: ['?'], top: ['?', '?'], cells: [['6x', '9']], legende: 'Aires connues : 6x et 9' })}</div>
<div>${grille({ left: ['3'], top: ['2x', '3'], cells: [['6x', '9']], aire: true, legende: '6x + 9 = 3(2x + 3)' })}</div>
</div>
<div class="methode"><b>Méthode</b><ol>
<li>Cherche le <b>plus grand</b> nombre qui divise tous les coefficients ; regarde aussi si x est dans tous les termes.</li>
<li>Écris chaque terme comme un produit par ce facteur : 6x = 3 × 2x et 9 = 3 × 3.</li>
<li>Mets le facteur devant, et ce qui reste dans la parenthèse.</li>
<li>Si le facteur commun est une parenthèse, recopie-la, puis réduis le crochet.</li></ol></div>
<div class="ex"><span class="q">Exemple 1 : factorise 6x + 9, x<sup>2</sup> − 5x et 6x<sup>2</sup> + 4x.</span><br>• 6x + 9 = 3 × 2x + 3 × 3 = <b>3(2x + 3)</b>.<br>• x<sup>2</sup> − 5x = x × x − x × 5 = <b>x(x − 5)</b>.<br>• 6x<sup>2</sup> + 4x = 2x × 3x + 2x × 2 = <b>2x(3x + 2)</b>.</div>
<div class="ex"><span class="q">Exemple 2 : factorise (x − 2)(3x + 1) − (x − 2)(x + 4), puis (x + 3)<sup>2</sup> + 5(x + 3).</span><br>• Le facteur commun est (x − 2) :<br>(x − 2)[(3x + 1) − (x + 4)] = (x − 2)(3x + 1 − x − 4) = <b>(x − 2)(2x − 3)</b>.<br>• Un carré cache le facteur : (x + 3)<sup>2</sup> = (x + 3)(x + 3). Donc (x + 3)[(x + 3) + 5] = <b>(x + 3)(x + 8)</b>.</div>
<div class="warn">⚠️ Prends le <b>plus grand</b> facteur commun : 12x + 8 = 2(6x + 4) est juste mais pas fini ; on écrit <b>4(3x + 2)</b>.<br>⚠️ Après un −, garde la seconde parenthèse entière dans le crochet : −(x + 4) = −x − 4.<br>⚠️ Vérifie toujours en développant ta réponse : tu dois retrouver l'expression de départ.</div>
<div class="retenir">À retenir : ka + kb = k(a + b), avec le plus grand facteur commun k.</div>`;
}

/* ======================================================================
   11. Factoriser avec les identités remarquables
   ====================================================================== */
function L11(d) {
  const v = d < 1 ? 0 : d < 2 ? ri(0, 1) : d < 3 ? ri(0, 2) : pick([0, 1, 2, 3, 4]);
  const a = ri(1, 10);
  let ast, E, tpl, form, kind, k = 1, msg, sol;
  if (v === 0) {
    kind = 'diff'; ast = d >= 4 && chance(0.4) ? S(N(-a * a), Mo(1, 2)) : S(Mo(1, 2), N(-a * a));
    E = [a, a]; tpl = '(x + {0})(x − {1})'; form = u => x => (x + u[0]) * (x - u[1]);
    msg = u => u[0] === a * a || u[1] === a * a ? `Le nombre à écrire est B, avec B<sup>2</sup> = ${a * a} : prends la racine carrée.` : u[0] !== u[1] ? 'Dans (A + B)(A − B), c\'est le <b>même</b> B dans les deux parenthèses.' : '';
    sol = `x<sup>2</sup> − ${a * a} = x<sup>2</sup> − ${a}<sup>2</sup> = <b>(x + ${a})(x − ${a})</b>`;
  } else if (v <= 2) {
    kind = 'sq'; const s = v === 1 ? a : -a;
    const t = [Mo(1, 2), Mo(2 * s, 1), N(a * a)]; if (d >= 4 && chance(0.4)) shuffle(t);
    ast = S(...t); E = [a]; tpl = v === 1 ? '(x + {0}<span>)<sup>2</sup></span>' : '(x − {0}<span>)<sup>2</sup></span>';
    form = v === 1 ? u => x => (x + u[0]) ** 2 : u => x => (x - u[0]) ** 2;
    msg = u => u[0] === 2 * a ? `Le terme en x est le <b>double</b> produit 2 × x × B : B est la moitié de ${2 * a}.` : u[0] === a * a ? `B<sup>2</sup> = ${a * a} : B est la racine carrée de ${a * a}.` : u[0] === -a ? 'Regarde la forme : le signe est déjà écrit dans la parenthèse.' : '';
    sol = `${poly3([1, 2 * s, a * a])} = x<sup>2</sup> ${s > 0 ? '+' : '−'} 2 × x × ${a} + ${a}<sup>2</sup> = <b>(x ${s > 0 ? '+' : '−'} ${a})<sup>2</sup></b>`;
  } else if (v === 3) {
    kind = 'diff'; k = ri(2, 5);
    ast = S(Mo(k * k, 2), N(-a * a)); E = [k, a, k, a]; tpl = '({0} x + {1})({2} x − {3})';
    form = u => x => (u[0] * x + u[1]) * (u[2] * x - u[3]);
    msg = u => (u[0] === k * k || u[2] === k * k) ? `${k * k}x<sup>2</sup> = (${k}x)<sup>2</sup> : A = ${k}x.` : (u[1] === a * a || u[3] === a * a) ? `B<sup>2</sup> = ${a * a} : prends la racine carrée.` : '';
    sol = `${k * k}x<sup>2</sup> − ${a * a} = (${k}x)<sup>2</sup> − ${a}<sup>2</sup> = <b>(${k}x + ${a})(${k}x − ${a})</b>`;
  } else {
    kind = 'sq'; k = ri(2, 5); const s = chance(0.5) ? a : -a;
    ast = S(Mo(k * k, 2), Mo(2 * k * s, 1), N(a * a)); E = [k, s]; tpl = '({0} x + {1}<span>)<sup>2</sup></span>';
    form = u => x => (u[0] * x + u[1]) ** 2;
    msg = u => Math.abs(u[0]) === k && Math.abs(u[1]) === a ? 'Les nombres sont bons : regarde le <b>signe</b> du terme en x.' : u[0] === k * k ? `${k * k}x<sup>2</sup> = (${k}x)<sup>2</sup> : A = ${k}x.` : '';
    sol = `${poly3([k * k, 2 * k * s, a * a])} = (${k}x)<sup>2</sup> ${s > 0 ? '+' : '−'} 2 × ${k}x × ${a} + ${a}<sup>2</sup> = <b>(${k}x ${s > 0 ? '+' : '−'} ${a})<sup>2</sup></b>`;
  }
  const after = kind === 'sq' && E[E.length - 1] > 0 && v !== 2
    ? grille({ left: [mono(k, 1), String(a)], top: [mono(k, 1), String(a)], cells: prodCells([[k, 1], [a, 0]], [[k, 1], [a, 0]]), aire: true })
    : '';
  return {
    type: 'nums', tpl,
    html: `Factorise à l'aide d'une identité remarquable :${big('A = ' + h(ast))}${tpl.includes('{1}') && kind === 'sq' ? '<span class="note">Tape −3 pour obtenir (… − 3)<sup>2</sup>.</span>' : ''}`,
    check: formCheck(E, form, { msg }),
    verify: Ev => same(x => ev(ast, x), form(Ev)),
    hint: kind === 'diff' ? 'Reconnais A<sup>2</sup> − B<sup>2</sup> = (A + B)(A − B) : trouve A et B en prenant les racines carrées des deux carrés.'
      : 'Reconnais A<sup>2</sup> ± 2AB + B<sup>2</sup> = (A ± B)<sup>2</sup> : A et B sont les racines carrées des termes carrés ; vérifie que le terme en x vaut bien 2AB.',
    solution: sol,
    afterVisual: after,
  };
}
function C11() {
  return `<h2>11. Factoriser avec les identités remarquables</h2>
<p class="intro">Quand il n'y a pas de facteur commun, on peut parfois reconnaître une identité remarquable déjà développée.</p>
<div class="def">On lit les identités <b>de droite à gauche</b> :<br>A<sup>2</sup> + 2AB + B<sup>2</sup> = (A + B)<sup>2</sup><br>A<sup>2</sup> − 2AB + B<sup>2</sup> = (A − B)<sup>2</sup><br>A<sup>2</sup> − B<sup>2</sup> = (A + B)(A − B)</div>
${carreDiff()}
<div class="methode"><b>Méthode</b><ol>
<li>Range les termes : x<sup>2</sup>, puis x, puis le nombre.</li>
<li>Deux termes séparés par un − et deux carrés ? C'est A<sup>2</sup> − B<sup>2</sup>.</li>
<li>Trois termes ? Trouve A et B (racines carrées des deux carrés) et <b>vérifie</b> que le terme en x vaut 2AB.</li>
<li>Le signe du terme en x donne (A + B)<sup>2</sup> ou (A − B)<sup>2</sup>.</li></ol></div>
<div class="ex"><span class="q">Exemple 1 : factorise x<sup>2</sup> − 25 et x<sup>2</sup> + 8x + 16.</span><br>• x<sup>2</sup> − 25 = x<sup>2</sup> − 5<sup>2</sup> = <b>(x + 5)(x − 5)</b>.<br>• A = x, B = 4 (car 16 = 4<sup>2</sup>) et 2AB = 2 × x × 4 = 8x ✓, donc <b>(x + 4)<sup>2</sup></b>.</div>
<div class="ex"><span class="q">Exemple 2 : factorise 4x<sup>2</sup> − 49 et 4 − 12x + 9x<sup>2</sup>.</span><br>• 4x<sup>2</sup> − 49 = (2x)<sup>2</sup> − 7<sup>2</sup> = <b>(2x + 7)(2x − 7)</b>.<br>• On range : 9x<sup>2</sup> − 12x + 4 = (3x)<sup>2</sup> − 2 × 3x × 2 + 2<sup>2</sup> = <b>(3x − 2)<sup>2</sup></b>. Si la case suit un « + », tape −2 ; si le « − » est déjà écrit avant la case, tape 2.</div>
<div class="warn">⚠️ x<sup>2</sup> + 25 ne se factorise pas avec A<sup>2</sup> − B<sup>2</sup> : il faut un <b>moins</b> entre les deux carrés.<br>⚠️ On écrit B, pas B<sup>2</sup> : x<sup>2</sup> − 25 = (x + 5)(x − 5), pas (x + 25)(x − 25).<br>⚠️ Vérifie le double produit : x<sup>2</sup> + 6x + 16 n'est <b>pas</b> un carré (il faudrait 9).</div>
<div class="retenir">À retenir : A<sup>2</sup> − B<sup>2</sup> = (A + B)(A − B), et A<sup>2</sup> ± 2AB + B<sup>2</sup> = (A ± B)<sup>2</sup>.</div>`;
}

/* ======================================================================
   12. Défis mêlés
   ====================================================================== */
function L12(d) {
  const pool = d < 1 ? [0, 1, 2] : d < 2 ? [0, 1, 2, 3] : d < 3 ? [1, 2, 3, 4, 5] : [2, 3, 4, 5, 6];
  const v = pick(pool);
  if (v === 0) { // programme de calcul avec un carré
    const a = ri(1, 9);
    const st = [stA(a), { t: 'Élever le résultat au carré', f: y => y * y, l: 'au carré' }, { t: 'Soustraire le carré du nombre de départ', f: null, l: '− x²' }];
    const prog = x => (x + a) ** 2 - x * x;
    const E = [2 * a, a * a];
    return {
      type: 'nums', tpl: TPL2,
      html: `${progHTML(st)}Montre que le résultat s'écrit a x + b : donne a et b.`,
      visual: programme(st.map(s => s.l)),
      check: numsCheck(E, { msg: u => u[0] === 0 && u[1] === a * a ? 'Il manque le double produit : (x + a)<sup>2</sup> = x<sup>2</sup> + 2ax + a<sup>2</sup>.' : '' }),
      verify: Ev => same(prog, F2(Ev)),
      hint: `Écris le résultat avec x : (x + ${a})<sup>2</sup> − x<sup>2</sup>. Développe avec une identité remarquable, puis réduis.`,
      solution: `(x + ${a})<sup>2</sup> − x<sup>2</sup> = x<sup>2</sup> + ${2 * a}x + ${a * a} − x<sup>2</sup> = <b>${2 * a}x + ${a * a}</b>`,
    };
  }
  if (v === 1) { // (x + a)² − (x − a)²
    const a = ri(1, 9), ast = S(Sq(L(1, a)), Pr(Mo(-1, 0), Sq(L(1, -a))));
    return devQ(ast, [0, 4 * a, 0], 2, {
      html: `Développe et réduis :${big('A = ' + h(ast))}${NOTE2}`,
      msg: u => u[1] === 0 && u[2] === 2 * a * a ? 'Le − devant (x − a)<sup>2</sup> change le signe de <b>tous</b> les termes de son développement.' : '',
      hint: 'Développe chaque carré entre parenthèses, puis enlève les parenthèses (attention au −) et réduis.',
      solution: `A = (x<sup>2</sup> + ${2 * a}x + ${a * a}) − (x<sup>2</sup> − ${2 * a}x + ${a * a}) = x<sup>2</sup> + ${2 * a}x + ${a * a} − x<sup>2</sup> + ${2 * a}x − ${a * a} = <b>${4 * a}x</b>`,
    });
  }
  if (v === 2) { // (kx + a)² − (mx + b)(mx − b)
    const k = ri(1, 3), a = nz(-6, 6), m = ri(1, 3), b = ri(1, 6);
    const ast = S(Sq(L(k, a)), Pr(Mo(-1, 0), L(m, b), L(m, -b)));
    const p = sub([k * k, 2 * k * a, a * a], [m * m, 0, -b * b]);
    return devQ(ast, p, 3, {
      html: `Développe et réduis :${big('A = ' + h(ast))}${NOTE3}`,
      msg: u => eq(u, add([k * k, 2 * k * a, a * a], [-m * m, 0, -b * b])) ? 'Le − devant le produit change aussi le signe du nombre : −(… − ' + b * b + ') = … + ' + b * b + '.' : u[1] === 0 ? 'N\'oublie pas le double produit du premier carré.' : '',
      hint: 'Utilise (A + B)<sup>2</sup> pour le premier terme et (A + B)(A − B) pour le second, que tu gardes entre parenthèses.',
      solution: `A = (${poly3([k * k, 2 * k * a, a * a])}) − (${poly3([m * m, 0, -b * b])}) = <b>${poly3(p)}</b>`,
    });
  }
  if (v === 3 || v === 6) { // factoriser (x + p)² − q² : lien avec la forme canonique
    let p, q; do { p = nz(-6, 6); q = ri(1, 7); } while (p === q || p === -q);
    const ast = v === 6 ? S(Mo(1, 2), Mo(2 * p, 1), N(p * p - q * q)) : S(Sq(L(1, p)), N(-q * q));
    const E = [p + q, p - q], form = u => x => (x + u[0]) * (x + u[1]);
    return {
      type: 'nums', tpl: '(x + {0})(x + {1})',
      html: `Factorise :${big('A = ' + h(ast))}${v === 6 ? `<span class="note">Indice : commence par écrire A = (x ${p > 0 ? '+' : '−'} ${Math.abs(p)})<sup>2</sup> − … (forme canonique).</span>` : '<span class="note">Tape les nombres avec leur signe (−2 pour x − 2).</span>'}`,
      check: formCheck(E, form, { msg: u => (u[0] === p + q * q || u[1] === p - q * q || u[0] === p - q * q) ? `${q * q} = ${q}<sup>2</sup> : B = ${q}, pas ${q * q}.` : '' }),
      verify: Ev => same(x => ev(ast, x), form(Ev)),
      hint: `${v === 6 ? `Les premiers termes ressemblent à (x ${p > 0 ? '+' : '−'} ${Math.abs(p)})<sup>2</sup> = ${poly3([1, 2 * p, p * p])}. Écris A comme ce carré moins un nombre, puis ` : ''}Reconnais A<sup>2</sup> − B<sup>2</sup> = (A + B)(A − B) avec A = x ${p > 0 ? '+' : '−'} ${Math.abs(p)}.`,
      solution: `${v === 6 ? `A = (x ${p > 0 ? '+' : '−'} ${Math.abs(p)})<sup>2</sup> − ${p * p} + ${P(p * p - q * q)} = (x ${p > 0 ? '+' : '−'} ${Math.abs(p)})<sup>2</sup> − ${q * q}. ` : ''}A = (x ${p > 0 ? '+' : '−'} ${Math.abs(p)})<sup>2</sup> − ${q}<sup>2</sup> = (x ${p > 0 ? '+' : '−'} ${Math.abs(p)} + ${q})(x ${p > 0 ? '+' : '−'} ${Math.abs(p)} − ${q}) = <b>(${h(S(X, N(p + q)))})(${h(S(X, N(p - q)))})</b>. C'est la méthode du module « Second degré » : forme canonique, puis A<sup>2</sup> − B<sup>2</sup>.`,
    };
  }
  if (v === 4) { // calcul astucieux
    if (chance(0.5)) {
      const c = pick([20, 30, 40, 50, 60, 100]), u = ri(1, 9), Y = 4 * c * u;
      return {
        type: 'nums', tpl: 'Réponse : {0}', html: `Calcule astucieusement, sans poser de multiplication :${big(`${c + u}<sup>2</sup> − ${c - u}<sup>2</sup>`)}`,
        check: numsCheck([Y]), value: (c + u) * (c + u) - (c - u) * (c - u),
        hint: 'Utilise A<sup>2</sup> − B<sup>2</sup> = (A + B)(A − B).',
        solution: `${c + u}<sup>2</sup> − ${c - u}<sup>2</sup> = (${c + u} + ${c - u})(${c + u} − ${c - u}) = ${2 * c} × ${2 * u} = <b>${Y}</b>`,
      };
    }
    const c = pick([10, 20, 30, 50, 100]), u = pick([1, 2, 3]), s = chance(0.5) ? 1 : -1, n = c + s * u, Y = c * c + 2 * c * s * u + u * u;
    return {
      type: 'nums', tpl: 'Réponse : {0}', html: `Calcule astucieusement avec une identité remarquable :${big(`${n}<sup>2</sup>`)}`,
      check: numsCheck([Y], { msg: w => w[0] === c * c + u * u ? 'Il manque le double produit 2AB !' : '' }), value: n * n,
      hint: `Écris ${n} = ${c} ${s > 0 ? '+' : '−'} ${u}, puis utilise (A ${s > 0 ? '+' : '−'} B)<sup>2</sup> = A<sup>2</sup> ${s > 0 ? '+' : '−'} 2AB + B<sup>2</sup>.`,
      solution: `${n}<sup>2</sup> = (${c} ${s > 0 ? '+' : '−'} ${u})<sup>2</sup> = ${c * c} ${s > 0 ? '+' : '−'} ${2 * c * u} + ${u * u} = <b>${Y}</b>`,
    };
  }
  // v === 5 : facteur commun caché dans un carré
  let a, b, e, f; do { a = ri(2, 3); b = nz(-5, 5); e = nz(-3, 3); f = nz(-6, 6); } while (a - e === 0 || b === f || gcd(a, Math.abs(b)) !== 1);
  const com = L(a, b), ast = S(Sq(com), Pr(Mo(-1, 0), com, L(e, f)));
  const E = [a - e, b - f], form = u => x => (a * x + b) * (u[0] * x + u[1]);
  return {
    type: 'nums', tpl: `${h(com)}( {0} x + {1} )`,
    html: `Factorise :${big('A = ' + h(ast))}`,
    check: formCheck(E, form, { msg: u => (u[0] === a + e && u[1] === b + f) ? 'Le − devant le second produit s\'applique à toute la parenthèse (' + monos([[e, 1], [f, 0]]) + ').' : '' }),
    verify: Ev => same(x => ev(ast, x), form(Ev)),
    hint: `Un carré est un produit : ${h(com)}<sup>2</sup> = ${h(com)} × ${h(com)}. Le facteur commun est ${h(com)}.`,
    solution: `A = ${h(com)} × ${h(com)} − ${h(com)}(${monos([[e, 1], [f, 0]])}) = ${h(com)}[(${monos([[a, 1], [b, 0]])}) − (${monos([[e, 1], [f, 0]])})] = <b>${h(com)}(${monos([[a - e, 1], [b - f, 0]])})</b>`,
  };
}
function C12() {
  return `<h2>12. Défis</h2>
<p class="intro">On mélange tout ! Le plus important est de bien choisir l'outil avant de se lancer.</p>
<div class="def">Pour chaque expression, demande-toi d'abord : <b>développer</b> (produit → somme) ou <b>factoriser</b> (somme → produit) ?<br>Puis choisis l'outil : distributivité, double distributivité, identité remarquable, facteur commun.</div>
<div class="cols">
<div>${programme(['+ 3', 'au carré', '− x²'])}</div>
<div>${carreDiff()}</div>
</div>
<div class="methode"><b>Méthode</b><ol>
<li>Lis la consigne : développer, factoriser ou calculer.</li>
<li>Cherche un facteur commun (même caché dans un carré : (2x + 1)<sup>2</sup> = (2x + 1)(2x + 1)).</li>
<li>Sinon, cherche une identité remarquable (A<sup>2</sup> − B<sup>2</sup>, A est parfois une parenthèse).</li>
<li>Vérifie en développant ou en testant avec x = 1.</li></ol></div>
<div class="ex"><span class="q">Exemple 1 : programme : choisir x, ajouter 3, élever au carré, soustraire x<sup>2</sup>.</span><br>(x + 3)<sup>2</sup> − x<sup>2</sup> = x<sup>2</sup> + 6x + 9 − x<sup>2</sup> = <b>6x + 9</b>.<br>Calcul astucieux : 53<sup>2</sup> − 47<sup>2</sup> = (53 + 47)(53 − 47) = 100 × 6 = <b>600</b> ; 31<sup>2</sup> = (30 + 1)<sup>2</sup> = 900 + 60 + 1 = <b>961</b>.</div>
<div class="ex"><span class="q">Exemple 2 : factorise (x + 1)<sup>2</sup> − 9 et (2x + 1)<sup>2</sup> − (2x + 1)(x − 3).</span><br>• (x + 1)<sup>2</sup> − 3<sup>2</sup> = (x + 1 + 3)(x + 1 − 3) = <b>(x + 4)(x − 2)</b>.<br>• Facteur commun (2x + 1) : (2x + 1)[(2x + 1) − (x − 3)] = <b>(2x + 1)(x + 4)</b>.</div>
<div class="ex"><span class="q">Exemple 3 : développe et réduis (x − 3)<sup>2</sup> − (x + 5)(x − 5).</span><br>Chaque morceau avec son identité : (x − 3)<sup>2</sup> = x<sup>2</sup> − 6x + 9 et (x + 5)(x − 5) = x<sup>2</sup> − 25.<br>Le − porte sur tout le second : x<sup>2</sup> − 6x + 9 <b>−</b> (x<sup>2</sup> − 25) = x<sup>2</sup> − 6x + 9 − x<sup>2</sup> + 25 = <b>−6x + 34</b>.</div>
<div class="ex"><span class="q">Exemple 4 : factorise x<sup>2</sup> + 6x − 7 (l'indice dit : commence par écrire (x + 3)<sup>2</sup> − …).</span><br>(x + 3)<sup>2</sup> = x<sup>2</sup> + 6x + 9, donc x<sup>2</sup> + 6x − 7 = (x + 3)<sup>2</sup> − 9 − 7 = (x + 3)<sup>2</sup> − 16 = (x + 3)<sup>2</sup> − 4<sup>2</sup>.<br>Puis A<sup>2</sup> − B<sup>2</sup> : (x + 3 + 4)(x + 3 − 4) = <b>(x + 7)(x − 1)</b>.</div>
<div class="warn">⚠️ Un − devant un carré ou un produit change le signe de <b>tous</b> les termes de son développement.<br>⚠️ Pour vérifier une factorisation, développe-la : tu dois retrouver l'expression de départ.</div>
<div class="retenir">À retenir : d'abord choisir (développer ou factoriser), ensuite l'outil, enfin vérifier.</div>
<h3>Et après ?</h3><p>Le module <a href="../poly2/">📈 Second degré</a> réutilise tout ceci : développer (x + p)(x + q), reconnaître un carré, écrire x<sup>2</sup> + 2x − 8 = (x + 1)<sup>2</sup> − 9 (la <b>forme canonique</b>), puis factoriser avec A<sup>2</sup> − B<sup>2</sup> pour trouver les racines.</p>`;
}

/* ================= niveaux ================= */
export const LEVELS = [
  { titre: 'Écrire une expression', generate: L1, cours: C1, classe: '4e' },
  { titre: "Valeur d'une expression", generate: L2, cours: C2, classe: '4e' },
  { titre: "Conventions d'écriture", generate: L3, cours: C3, classe: '4e' },
  { titre: 'Réduire une expression', generate: L4, cours: C4, classe: '4e' },
  { titre: 'Simple distributivité', generate: L5, cours: C5, classe: '4e' },
  { titre: 'Signe − devant une parenthèse', generate: L6, cours: C6, classe: '4e' },
  { titre: 'Double distributivité', generate: L7, cours: C7, classe: '4e – 3e' },
  { titre: 'Identités remarquables', generate: L8, cours: C8, classe: '3e' },
  { titre: 'Développer et réduire', generate: L9, cours: C9, classe: '3e' },
  { titre: 'Factoriser : facteur commun', generate: L10, cours: C10, classe: '3e' },
  { titre: 'Factoriser : identités', generate: L11, cours: C11, classe: '3e' },
  { titre: 'Défis', generate: L12, cours: C12, classe: '3e' },
];
export const OPTIONS = { need: 4, keys: { neg: true, comma: false } };

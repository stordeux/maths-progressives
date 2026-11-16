// Équations (4e – 3e) : 12 niveaux, de « est-ce une solution ? » jusqu'aux défis.
// Visuel central : une balance à deux plateaux toujours en équilibre (draw.js) ; dans la correction, elle s'anime :
// on enlève (ou on ajoute) la même chose des deux côtés, puis on partage en parts égales. Quand les nombres
// deviennent négatifs ou grands, on passe à un visuel plus abstrait : les étapes alignées sur le signe « = ».
//
// Une équation du premier degré est décrite par ses deux membres, listes d'« atomes » :
//   ['x', c] → c·x ; ['n', c] → c ; ['p', k, p, q] → k(px + q) ; ['xf', n, d] → (n/d)·x.
// Vérifications indépendantes pour les tests : value (solution recalculée en flottants à partir des coefficients),
// verify (on remplace x par la réponse dans les deux membres affichés), truth (pour les types roots : on évalue les
// deux membres de l'équation affichée ; les solutions sont entières ou demi-entières).
import { ri, pick, nz, shuffle, chance, prenom, variant } from '../../engine/util/rand.js';
import { numsCheck, fracCheck, choiceCheck } from '../../engine/answers/checks.js';
import { gcd, lcm, red, approx } from '../../engine/util/arith.js';
import { M, P, F, X2, terms, big } from '../../engine/util/fmt.js';
import { balance, canBalance, steps, rect, sqGraph } from './draw.js';
import { intLine, fracLine } from '../../engine/draw/numberLine.js';
import { plot } from '../../engine/draw/plot.js';

/* ================= équations du premier degré ================= */
const ax = c => ['x', c], nb = c => ['n', c], par = (k, p, q) => ['p', k, p, q];
const lin = (p, q) => terms([[p, 'x'], [q, '']]);
const cx = k => (k === 1 ? '' : k === -1 ? '−' : M(k)) + 'x';

/** écriture d'un membre */
function side(atoms) {
  let s = '';
  atoms.forEach((a, i) => {
    let neg, body;
    if (a[0] === 'x') { neg = a[1] < 0; const v = Math.abs(a[1]); body = (v === 1 ? '' : M(v)) + 'x'; }
    else if (a[0] === 'n') { neg = a[1] < 0; body = M(Math.abs(a[1])); }
    else if (a[0] === 'p') { neg = a[1] < 0; const v = Math.abs(a[1]); body = (v === 1 ? '' : M(v)) + '(' + lin(a[2], a[3]) + ')'; }
    else { neg = a[1] < 0; const v = Math.abs(a[1]); body = F((v === 1 ? '' : M(v)) + 'x', a[2]); }
    s += i ? (neg ? ' − ' : ' + ') + body : (neg ? '−' : '') + body;
  });
  return s || '0';
}
/** valeur d'un membre pour x donné (calcul direct sur l'écriture) */
function ev(atoms, x) {
  let s = 0;
  for (const a of atoms) {
    if (a[0] === 'x') s += a[1] * x;
    else if (a[0] === 'n') s += a[1];
    else if (a[0] === 'p') s += a[1] * (a[2] * x + a[3]);
    else s += a[1] * x / a[2];
  }
  return s;
}
/** coefficients [A, B] du membre réduit Ax + B ; wrong : on ne multiplie que le premier terme de la parenthèse */
function coef(atoms, wrong = false) {
  let A = 0, B = 0;
  for (const a of atoms) {
    if (a[0] === 'x') A += a[1];
    else if (a[0] === 'n') B += a[1];
    else if (a[0] === 'p') { A += a[1] * a[2]; B += wrong ? a[3] : a[1] * a[3]; }
    else A += a[1] / a[2];
  }
  return [A, B];
}
const eqStr = q => `${side(q.L)} = ${side(q.R)}`;
const solveFloat = (q, wrong) => { const [a, b] = coef(q.L, wrong), [c, d] = coef(q.R, wrong); return (d - b) / (a - c); };
const holds = (q, x) => Math.abs(ev(q.L, x) - ev(q.R, x)) < 1e-9;

/** remplacement de x par t dans un membre (pour les vérifications écrites) */
function subst(atoms, t) {
  let s = '';
  atoms.forEach((a, i) => {
    let neg, body;
    if (a[0] === 'x') { neg = a[1] < 0; const v = Math.abs(a[1]); body = v === 1 ? (i || neg ? P(t) : M(t)) : `${M(v)} × ${P(t)}`; }
    else if (a[0] === 'n') { neg = a[1] < 0; body = M(Math.abs(a[1])); }
    else if (a[0] === 'p') { neg = a[1] < 0; const v = Math.abs(a[1]); body = `${v === 1 ? '' : M(v) + ' × '}(${a[2] === 1 ? P(t) : a[2] === -1 ? '−' + P(t) : M(a[2]) + ' × ' + P(t)} ${a[3] < 0 ? '− ' + M(-a[3]) : '+ ' + M(a[3])})`; }
    else { neg = a[1] < 0; const v = Math.abs(a[1]); body = `${v === 1 ? '' : M(v) + ' × '}${P(t)} ÷ ${a[2]}`; }
    s += i ? (neg ? ' − ' : ' + ') + body : (neg ? '−' : '') + body;
  });
  return s;
}
const sv = (at, t) => { const s = subst(at, t), v = M(ev(at, t)); return s === v ? `<b>${v}</b>` : `${s} = <b>${v}</b>`; };
const valStr = (n, d = 1) => { const [a, b] = red(n, d); return b === 1 ? M(a) : (a < 0 ? '−' : '') + F(Math.abs(a), b); };

/**
 * Résolution détaillée d'une équation du premier degré : lignes pour steps() et chaîne « ⇔ » pour la correction.
 * Les nombres sont entiers ; la solution peut être une fraction.
 */
function solve(q) {
  const rows = [{ l: side(q.L), r: side(q.R) }], chain = [eqStr(q)];
  let [a, b] = coef(q.L), [c, d] = coef(q.R);
  if (a === 0 && c !== 0) { // l'inconnue est à droite : on échange les deux membres
    q = { L: q.R, R: q.L }; [a, b, c, d] = [c, d, a, b];
    rows.push({ op: ['', ''], why: 'on échange les deux membres' }); rows.push({ l: side(q.L), r: side(q.R) }); chain.push(eqStr(q));
  }
  const push = (l, r) => { rows.push({ l, r }); chain.push(`${l} = ${r}`); };
  const red2 = () => [terms([[a, 'x'], [b, '']]), terms([[c, 'x'], [d, '']])];
  const hasPar = [...q.L, ...q.R].some(t => t[0] === 'p');
  const [l0, r0] = red2();
  if (hasPar) { rows.push({ op: ['', ''], why: 'on développe et on réduit' }); push(l0, r0); }
  else if (q.L.length + q.R.length > [a, b, c, d].filter(v => v).length) { rows.push({ op: ['', ''], why: 'on réduit' }); push(l0, r0); }
  if (c !== 0) {
    const o = c > 0 ? '− ' + cx(c) : '+ ' + cx(-c);
    rows.push({ op: [o, o], why: 'pour ne plus avoir de x à droite' }); a -= c; c = 0; push(...red2());
  }
  if (b !== 0) {
    const o = b > 0 ? '− ' + M(b) : '+ ' + M(-b);
    rows.push({ op: [o, o], why: 'pour isoler le terme en x' }); d -= b; b = 0; push(...red2());
  }
  if (a !== 1) {
    const o = '÷ ' + P(a);
    rows.push({ op: [o, o], why: a === -1 ? 'on divise par −1 (on change les signes)' : 'on divise les deux membres par ' + M(a) });
    push('x', valStr(d, a));
  }
  return { rows, html: steps(rows), chain: chain.join(' ⇔ '), N: d, D: a };
}
const checkLine = (q, t) => {
  const part = at => { const s = subst(at, t), v = M(ev(at, t)); return s === v ? '' : `${s} = ${v}`; };
  return `Vérification : ${[part(q.L), part(q.R)].filter(Boolean).join(' et ')} ✓`;
};

/** balance pour une équation sans parenthèse, à coefficients et nombres positifs (ballons pour − n) */
function pans(q) {
  const one = atoms => {
    const p = { x: 0, u: 0, b: 0 };
    for (const a of atoms) {
      if (a[0] === 'x') { if (a[1] < 0) return null; p.x += a[1]; }
      else if (a[0] === 'n') { if (a[1] < 0) p.b -= a[1]; else p.u += a[1]; }
      else return null;
    }
    return p;
  };
  const L = one(q.L), R = one(q.R);
  return L && R && canBalance(L, R) ? [L, R] : null;
}
function addVisuals(r, q, S) {
  const pp = pans(q);
  if (pp) {
    r.visual = balance(pp[0], pp[1], { labels: [side(q.L), side(q.R)], label: `Balance en équilibre : ${side(q.L)} à gauche, ${side(q.R)} à droite` });
    r.afterVisual = balance(pp[0], pp[1], { labels: [side(q.L), side(q.R)], anim: true, start: 'Équilibre : ' + eqStr(q), label: 'Résolution sur la balance' });
    r.replaceVisual = true;
  } else r.afterVisual = S.html;
}

/** check d'une solution entière avec messages « presque juste » */
function solCheck(q, X, traps = []) {
  return numsCheck([X], {
    msg: v => {
      const y = v[0];
      for (const t of traps) if (t.v !== undefined && isFinite(t.v) && approx(y, t.v) && !approx(t.v, X)) return t.m;
      if (X !== 0 && approx(y, -X)) return 'Presque ! Le <b>signe</b> de ta solution est faux. Remplace x par ta réponse pour vérifier.';
      const l = ev(q.L, y), r = ev(q.R, y);
      if (!Number.isInteger(Math.round(l * 1e6) / 1e6) || !Number.isInteger(Math.round(r * 1e6) / 1e6)) return "Remplace x par ta réponse dans l'équation : les deux membres doivent être égaux.";
      return `Vérifie en remplaçant x par ${M(y)} : le membre de gauche vaut ${M(l)}, celui de droite ${M(r)}. Ce n'est pas égal.`;
    },
  });
}

/** exercice « résous » à solution entière */
function linQ(q, o = {}) {
  const S = solve(q), X = S.N / S.D;
  const r = {
    type: 'nums', tpl: 'x = {0}', html: `${o.pre || 'Résous l\'équation :'}${big(eqStr(q))}`,
    check: solCheck(q, X, o.traps || []), value: solveFloat(q), verify: E => holds(q, E[0]),
    hint: o.hint, solution: `${S.chain}<br>${checkLine(q, X)}`,
  };
  addVisuals(r, q, S);
  return r;
}

/* ================= niveaux ================= */

/* ---------- 1. est-ce une solution ? ---------- */
function L1(d) {
  const v = variant(d, 3);
  let q, s;
  if (v === 0) { s = ri(1, 9); const a = ri(1, 9); q = chance(.5) ? { L: [ax(1), nb(a)], R: [nb(s + a)] } : (a2 => ({ L: [ax(a2)], R: [nb(a2 * s)] }))(ri(2, 5)); }
  else if (v === 1) { s = ri(1, 6); const a = ri(2, 5), b = ri(1, 9); q = { L: [ax(a), nb(b)], R: [nb(a * s + b)] }; }
  else { s = nz(-6, 8); let a, c, b; do { a = nz(-5, 6); c = nz(-5, 6); b = nz(-9, 9); } while (a === c || (a - c) * s + b === 0); q = { L: [ax(a), nb(b)], R: [ax(c), nb((a - c) * s + b)] }; } // pas « −x + 0 »
  const L = side(q.L), R = side(q.R);
  if (v === 3) {
    const cand = new Set([s]);
    for (const t of shuffle([-s, s + 1, s - 1, s + 2, s - 2, 2 * s, s + 3])) { if (cand.size < 4 && !cand.has(t)) cand.add(t); }
    const opts = shuffle([...cand]).map(t => ({ v: String(t), l: `x = ${M(t)}` }));
    return {
      type: 'choice', opts, html: `Lequel de ces nombres est solution de l'équation ?${big(`${L} = ${R}`)}`,
      check: choiceCheck(String(s), { msg: () => 'Remplace x par ce nombre dans <b>chaque</b> membre : les deux résultats doivent être égaux.' }),
      verify: E => holds(q, +E),
      hint: `Teste chaque proposition : remplace x par le nombre, calcule le membre de gauche puis le membre de droite. La solution est celle qui donne deux résultats <b>égaux</b>.`,
      solution: `Pour x = ${M(s)} : à gauche ${sv(q.L, s)} ; à droite ${sv(q.R, s)}. Égalité : <b>x = ${M(s)}</b> est la solution.`,
    };
  }
  const t = chance(.5) ? s : s + pick([-2, -1, 1, 2]);
  const lv = ev(q.L, t), rv = ev(q.R, t), ok = approx(lv, rv);
  const r = {
    type: 'choice', opts: [{ v: 'oui', l: `Oui, ${M(t)} est solution` }, { v: 'non', l: `Non, ${M(t)} n'est pas solution` }],
    html: `Le nombre <b>${M(t)}</b> est-il solution de l'équation ?${big(`${L} = ${R}`)}`,
    check: choiceCheck(ok ? 'oui' : 'non', { msg: () => 'Calcule les deux membres <b>séparément</b> avec x = ' + M(t) + ', puis compare les deux résultats.' }),
    verify: E => (E === 'oui') === holds(q, t),
    hint: `Remplace chaque x par ${P(t)}. Calcule le membre de gauche, puis le membre de droite. ${M(t)} est solution seulement si les deux résultats sont égaux.`,
    solution: `Pour x = ${M(t)} : à gauche ${sv(q.L, t)} ; à droite ${sv(q.R, t)}.<br>${ok ? `Les deux membres sont égaux : <b>oui</b>, ${M(t)} est solution.` : `${M(lv)} ≠ ${M(rv)} : <b>non</b>, ${M(t)} n'est pas solution.`}`,
  };
  const pp = pans(q);
  if (pp) r.visual = balance(pp[0], pp[1], { labels: [L, R], label: `Balance en équilibre : ${L} à gauche, ${R} à droite` });
  r.afterVisual = steps([{ l: subst(q.L, t), r: subst(q.R, t) }, { l: M(lv), r: M(rv) }, { t: ok ? '✅ égalité vraie' : '❌ ' + M(lv) + ' ≠ ' + M(rv) }]);
  return r;
}
function C1() {
  return `<h2>1. Est-ce une solution ?</h2>
<p class="intro">Une équation pose une question : « pour quelle valeur de x l'égalité est-elle vraie ? ». Avant d'apprendre à la résoudre, on apprend à <b>tester</b> un nombre.</p>
<div class="def">Une <b>équation</b> est une égalité avec une inconnue, souvent notée <b>x</b>. Elle a deux <b>membres</b> : à gauche et à droite du signe =.<br>Un nombre est <b>solution</b> si, en remplaçant x par ce nombre, les deux membres sont <b>égaux</b>.</div>
<div><p>Une équation, c'est comme une <b>balance en équilibre</b> : chaque sac « x » contient le même nombre de masses.</p></div>
<div>${balance({ x: 2, u: 3 }, { u: 11 }, { labels: ['2x + 3', '11'], label: 'Balance : 2x + 3 à gauche, 11 à droite' })}</div>
<div class="methode"><b>Méthode</b><ol>
<li>Remplace <b>chaque</b> x par le nombre, des deux côtés (entre parenthèses s'il est négatif).</li>
<li>Calcule le membre de gauche, puis le membre de droite, <b>séparément</b>.</li>
<li>Compare : égaux → c'est une solution ; différents → ce n'en est pas une.</li>
<li>S'il y a plusieurs nombres proposés, teste-les un par un.</li></ol></div>
<div class="ex"><span class="q">Exemple 1 : 4 est-il solution de 2x + 3 = 11 ?</span><br>À gauche : 2 × 4 + 3 = 11. À droite : 11. Égalité : <b>oui</b>.</div>
<div class="ex"><span class="q">Exemple 2 : 5 est-il solution de 3x − 1 = 2x + 3 ? Et −2 de 4x + 5 = x − 1 ?</span><br>• À gauche : 3 × 5 − 1 = 14. À droite : 2 × 5 + 3 = 13. 14 ≠ 13 : <b>non</b>.<br>• À gauche : 4 × (−2) + 5 = −3. À droite : −2 − 1 = −3. Égalité : <b>oui</b>, −2 est solution.</div>
<div class="warn">⚠️ Calcule les deux membres <b>séparément</b>, puis compare.<br>⚠️ Remplace <b>tous</b> les x, des deux côtés !<br>⚠️ 4x avec x = −2, c'est 4 × (−2) = −8 : attention à la règle des signes.</div>
<div class="retenir">À retenir : un nombre est solution s'il rend les deux membres égaux.</div>`;
}

/* ---------- 2. x + a = b et x − a = b ---------- */
function L2(d) {
  const bigN = d >= 3 && chance(.5);
  const kind = d < 1 ? 'plus' : d < 2 ? 'moins' : pick(['plus', 'moins']);
  const a = bigN ? ri(11, 60) : ri(1, d < 2 ? 6 : 8);
  const s = kind === 'plus' ? (bigN ? ri(5, 80) : ri(1, d < 2 ? 8 : 10)) : a + (bigN ? ri(3, 60) : ri(1, 8));
  const rhs = kind === 'plus' ? s + a : s - a;
  let Lm = kind === 'plus' ? [ax(1), nb(a)] : [ax(1), nb(-a)], q = { L: Lm, R: [nb(rhs)] };
  if (d >= 2 && kind === 'plus' && chance(.3)) q.L = [nb(a), ax(1)];
  if (d >= 2 && chance(.3)) q = { L: q.R, R: q.L };
  const plus = kind === 'plus';
  return linQ(q, {
    traps: plus ? [{ v: rhs + a, m: `⚠️ Tu as <b>ajouté</b> ${a}. Pour faire disparaître « + ${a} », on <b>enlève</b> ${a} des deux côtés.` }]
      : [{ v: rhs - a, m: `⚠️ « − ${a} » a changé de côté sans changer d'opération ! Pour l'annuler, on <b>ajoute</b> ${a} des deux côtés.` }],
    hint: plus ? `On veut x tout seul. Pour faire disparaître « + ${a} », on <b>enlève ${a} des deux côtés</b> : la balance reste en équilibre.`
      : `« x − ${a} », c'est comme si ${a} ballon${a > 1 ? 's' : ''} tirai${a > 1 ? 'ent' : 't'} le plateau vers le haut. Pour les annuler, on <b>ajoute ${a} des deux côtés</b>.`,
  });
}
function C2() {
  return `<h2>2. x + a = b et x − a = b</h2>
<p class="intro">Résoudre une équation, c'est trouver la valeur de x. On la transforme pas à pas, sans casser l'équilibre, jusqu'à obtenir « x = … ».</p>
<div class="def"><b>Règle d'or</b> : on peut ajouter ou enlever le <b>même nombre</b> aux <b>deux membres</b> d'une équation. La balance reste en équilibre.</div>
<div>${balance({ x: 1, u: 3 }, { u: 7 }, { labels: ['x + 3', '7'], anim: true, start: 'Équilibre : x + 3 = 7', label: 'Animation : on enlève 3 des deux côtés' })}</div>
<div>${balance({ x: 1, b: 2 }, { u: 5 }, { labels: ['x − 2', '5'], anim: true, start: 'Équilibre : x − 2 = 5', label: 'Animation : on ajoute 2 des deux côtés' })}</div>
<div class="methode"><b>Méthode</b><ol>
<li>Repère le nombre collé à x : « + a » ou « − a ».</li>
<li>Fais l'opération <b>contraire</b> des deux côtés : on enlève a pour annuler + a, on ajoute a pour annuler − a.</li>
<li>Vérifie en remplaçant x par ta réponse dans l'équation de départ.</li></ol></div>
<div class="ex"><span class="q">Exemple 1 : x + 3 = 7 et x − 2 = 5.</span><br>• On enlève 3 des deux côtés : x = 7 − 3, donc <b>x = 4</b>.<br>• Les 2 ballons tirent vers le haut (− 2). On ajoute 2 des deux côtés : x = 5 + 2, donc <b>x = 7</b>.</div>
<div class="ex"><span class="q">Exemple 2 : 12 = x + 5 et x − 38 = 25.</span><br>• L'inconnue peut être à droite : on enlève 5 des deux côtés, 12 − 5 = x, donc <b>x = 7</b>.<br>• On ajoute 38 des deux côtés : x = 25 + 38, donc <b>x = 63</b>. Vérification : 63 − 38 = 25 ✓</div>
<div class="warn">⚠️ « Passer de l'autre côté » sans changer d'opération est l'erreur classique : x − 2 = 5 ne donne <b>pas</b> x = 5 − 2.<br>⚠️ Pour x + 3 = 7, on n'ajoute pas 3 : on l'<b>enlève</b>.</div>
<div class="retenir">À retenir : pour annuler + a on enlève a, pour annuler − a on ajoute a, des deux côtés.</div>`;
}

/* ---------- 3. ax = b ---------- */
function L3(d) {
  const a = ri(2, d < 1 ? 4 : d < 3 ? 6 : 12), s = ri(1, d < 1 ? 5 : d < 3 ? 9 : 12), b = a * s;
  let q = { L: [ax(a)], R: [nb(b)] };
  if (d >= 2 && chance(.35)) q = { L: q.R, R: q.L };
  return linQ(q, {
    traps: [{ v: b - a, m: `⚠️ ${a}x veut dire ${a} × x : on ne soustrait pas ${a}, on <b>divise</b> les deux membres par ${a}.` },
      { v: b * a, m: `⚠️ On <b>divise</b> par ${a}, on ne multiplie pas.` }],
    hint: `${a}x = ${a} × x : il y a ${a} sacs identiques. On partage chaque plateau en ${a} parts égales : on <b>divise les deux membres par ${a}</b>.`,
  });
}
function C3() {
  return `<h2>3. ax = b</h2>
<p class="intro">Quand x est multiplié par un nombre, on ne soustrait pas : on <b>partage</b> les deux plateaux de la balance en parts égales.</p>
<div class="def">On peut <b>diviser</b> (ou multiplier) les deux membres d'une équation par un <b>même nombre non nul</b>.<br>ax = b ⇔ x = b ÷ a.</div>
<div>${balance({ x: 3 }, { u: 12 }, { labels: ['3x', '12'], anim: true, start: 'Équilibre : 3x = 12', label: 'Animation : on partage en 3 parts égales' })}</div>
<div class="methode"><b>Méthode</b><ol>
<li>Lis ax comme a × x : il y a a sacs identiques.</li>
<li>Divise les <b>deux</b> membres par a.</li>
<li>Vérifie : a × (ta réponse) doit redonner b.</li></ol></div>
<div class="ex"><span class="q">Exemple 1 : 3x = 12.</span><br>Trois sacs pèsent 12. Un sac pèse 12 ÷ 3 = 4, donc <b>x = 4</b>.</div>
<div class="ex"><span class="q">Exemple 2 : 56 = 7x et 12x = 144.</span><br>• 56 ÷ 7 = 8, donc <b>x = 8</b> (l'inconnue peut être à droite).<br>• 144 ÷ 12 = 12, donc <b>x = 12</b>. Vérification : 12 × 12 = 144 ✓</div>
<div class="warn">⚠️ 3x = 12 ne donne pas x = 12 − 3 : 3x veut dire 3 × x, on <b>divise</b> par 3.<br>⚠️ On divise, on ne multiplie pas : 3x = 12 ne donne pas x = 36.<br>⚠️ On divise <b>les deux membres</b>, pas un seul : sinon la balance n'est plus en équilibre.</div>
<div class="retenir">À retenir : ax = b donne x = b ÷ a.</div>`;
}

/* ---------- 4. ax + b = c ---------- */
function L4(d) {
  const minus = d >= 3 && chance(.45);
  const a = ri(2, d < 1 ? 3 : d < 3 ? 4 : 9), b = ri(1, d < 1 ? 5 : d < 3 ? 8 : 20);
  const s = minus ? ri(Math.ceil((b + 1) / a), Math.ceil((b + 1) / a) + 6) : ri(1, d < 1 ? 5 : d < 3 ? 6 : 12);
  const c = minus ? a * s - b : a * s + b;
  let q = { L: minus ? [ax(a), nb(-b)] : [ax(a), nb(b)], R: [nb(c)] };
  if (d >= 2 && !minus && chance(.3)) q.L = [nb(b), ax(a)];
  if (d >= 2 && chance(.3)) q = { L: q.R, R: q.L };
  return linQ(q, {
    traps: [{ v: minus ? (c - b) / a : (c + b) / a, m: `⚠️ « ${minus ? '− ' : '+ '}${b} » a changé de côté sans changer d'opération. Pour l'annuler, on ${minus ? '<b>ajoute</b>' : '<b>enlève</b>'} ${b} des deux côtés.` },
      { v: c / a - (minus ? -b : b), m: `⚠️ Attention à l'ordre : on s'occupe d'abord de ${b} (des deux côtés), <b>ensuite</b> on divise les deux membres par ${a}.` },
      { v: minus ? c + b - a : c - b - a, m: `⚠️ ${a}x veut dire ${a} × x : à la fin on <b>divise</b> par ${a}.` }],
    hint: `Deux étapes : 1) ${minus ? 'ajoute' : 'enlève'} ${b} des deux côtés pour isoler ${a}x ; 2) divise les deux membres par ${a}.`,
  });
}
function C4() {
  return `<h2>4. ax + b = c</h2>
<p class="intro">On combine les deux règles précédentes. Le secret : faire les étapes <b>dans le bon ordre</b>.</p>
<div class="def">Méthode en deux étapes :<br>1) on <b>isole</b> le terme en x en ajoutant ou en enlevant le même nombre des deux côtés ;<br>2) on <b>divise</b> les deux membres par le coefficient de x.</div>
<div>${balance({ x: 2, u: 3 }, { u: 11 }, { labels: ['2x + 3', '11'], anim: true, start: 'Équilibre : 2x + 3 = 11', label: 'Animation : on enlève 3 puis on partage en 2' })}</div>
<div class="methode"><b>Méthode</b><ol>
<li>Repère le nombre seul du côté de x (avec son signe).</li>
<li>Fais l'opération contraire des deux côtés : il reste ax = … .</li>
<li>Divise les deux membres par a.</li>
<li>Vérifie dans l'équation de départ.</li></ol></div>
<div class="ex"><span class="q">Exemple 1 : 2x + 3 = 11.</span><br>2x = 11 − 3 = 8, puis x = 8 ÷ 2, donc <b>x = 4</b>. Vérification : 2 × 4 + 3 = 11 ✓</div>
<div class="ex"><span class="q">Exemple 2 : 3x − 4 = 11 et 29 = 5 + 4x.</span><br>• On ajoute 4 : 3x = 15, donc <b>x = 5</b>.<br>• On enlève 5 : 24 = 4x, donc <b>x = 6</b>.</div>
<div class="warn">⚠️ Dans l'ordre ! On s'occupe d'abord du nombre seul, <b>ensuite</b> on divise. Si on divise d'abord, il faut diviser <b>tous</b> les termes : (2x + 3) ÷ 2 n'est pas x + 3.<br>⚠️ « − 4 » ne change pas de côté sans changer d'opération : on <b>ajoute</b> 4.</div>
<div class="retenir">À retenir : d'abord isoler ax, ensuite diviser par a.</div>`;
}

/* ---------- 5. solutions négatives ---------- */
function L5(d) {
  const v = variant(d, 3);
  let q, a, s;
  if (v === 0) { a = ri(3, 12); const b = ri(0, a - 1); s = b - a; q = b && chance(.5) ? { L: [ax(1), nb(-b)], R: [nb(-a)] } : { L: [ax(1), nb(a)], R: [nb(b)] }; } // b = 0 : « x + a = 0 », jamais « x = −a » (déjà résolue)
  else if (v === 1) { a = ri(2, 6); s = -ri(1, 7); const b = ri(1, 15); q = { L: [ax(a), nb(b)], R: [nb(a * s + b)] }; }
  else if (v === 2) { a = -ri(1, 6); s = chance(.75) ? -ri(1, 8) : ri(1, 8); const b = chance(.5) ? 0 : nz(-9, 9); q = { L: b ? [nb(b), ax(a)] : [ax(a)], R: [nb(a * s + b)] }; }
  else { a = nz(-8, 8); s = chance(.75) ? -ri(1, 9) : ri(1, 9); const b = nz(-15, 15); q = { L: [ax(a), nb(b)], R: [nb(a * s + b)] }; if (chance(.3)) q = { L: q.R, R: q.L }; }
  const [A, B] = coef(q.L.some(t => t[0] === 'x') ? q.L : q.R), C = coef(q.L.some(t => t[0] === 'x') ? q.R : q.L)[1];
  return linQ(q, {
    traps: [{ v: A < 0 ? (C - B) / -A : undefined, m: `⚠️ On divise par ${P(A)} <b>avec son signe</b>.` }, { v: (C + B) / A, m: `⚠️ Le nombre ${M(B)} a changé de côté sans changer de signe : on fait l'opération <b>contraire</b> des deux côtés.` }],
    hint: `Même méthode qu'avant : isole le terme en x, puis divise. Attention aux signes : règle des signes pour la division (− ÷ + = −, − ÷ − = +).`,
  });
}
function C5() {
  const q = { L: [ax(3), nb(7)], R: [nb(1)] };
  return `<h2>5. Solutions négatives</h2>
<p class="intro">La solution d'une équation peut être un nombre négatif. La méthode ne change pas, il faut seulement être soigneux avec les signes.</p>
<div class="def">Les mêmes règles marchent avec tous les nombres relatifs : on fait <b>la même opération des deux côtés</b>.<br>Règle des signes pour diviser : deux nombres de même signe donnent un quotient positif, deux nombres de signes contraires un quotient négatif.</div>
<div>${intLine({ min: -6, max: 5, marks: [{ x: -5 }, { x: 4, c: '#2b8a3e' }], arrows: [{ from: -5, to: 4, l: '+ 9' }] })}</div>
<div><p class="note">x + 9 = 4 : en partant de x et en avançant de 9, on arrive à 4. Donc x est à 9 crans à gauche de 4 : x = −5.</p></div>
<div class="methode"><b>Méthode</b><ol>
<li>Isole le terme en x (opération contraire des deux côtés).</li>
<li>Divise par le coefficient de x <b>avec son signe</b>.</li>
<li>Applique la règle des signes, puis vérifie.</li></ol></div>
<div class="ex"><span class="q">Exemple 1 : x + 9 = 4 et 3x + 7 = 1.</span><br>• x = 4 − 9, donc <b>x = −5</b>. Vérification : −5 + 9 = 4 ✓<br>• 3x = 1 − 7 = −6, donc x = −6 ÷ 3, <b>x = −2</b> :</div>
${solve(q).html}
<div class="ex"><span class="q">Exemple 2 : −4x = 20, −x = 6 et 5 − 2x = 11.</span><br>• x = 20 ÷ (−4), donc <b>x = −5</b>.<br>• −x = 6 veut dire −1 × x = 6, donc <b>x = −6</b>.<br>• On enlève 5 : −2x = 6, puis x = 6 ÷ (−2), donc <b>x = −3</b>.</div>
<div class="warn">⚠️ Dans −4x = 20, on divise par <b>−4</b> (avec le signe), pas par 4.<br>⚠️ Le nombre qui change de côté change aussi d'opération : 3x + 7 = 1 donne 3x = 1 − 7, pas 1 + 7.</div>
<div class="retenir">À retenir : même méthode, et on divise par le coefficient de x avec son signe.</div>`;
}

/* ---------- 6. solutions fractionnaires ---------- */
function L6(d) {
  const v = variant(d, 3);
  let a, b = 0, c;
  for (;;) {
    if (v === 0) { a = ri(2, 9); c = ri(1, 20); if (gcd(a, c) !== 1) continue; }
    else if (v === 1) { a = ri(4, 12); c = ri(2, 30); if (gcd(a, c) === 1) continue; }
    else if (v === 2) { a = ri(2, 9); b = ri(1, 12); c = ri(b + 1, b + 25); }
    else { a = nz(-9, 9); b = nz(-12, 12); c = nz(-20, 20); if (Math.abs(a) < 2) continue; }
    if ((c - b) % a !== 0) break;
  }
  const q = { L: b ? [ax(a), nb(b)] : [ax(a)], R: [nb(c)] };
  if (v >= 2 && chance(.3)) q.L = b ? [nb(b), ax(a)] : q.L;
  const S = solve(q), [rn, rd] = red(c - b, a);
  const base = fracCheck(c - b, a, { irr: true });
  const check = v2 => {
    const [n, dd] = v2;
    if (dd !== 0 && Number.isInteger(n) && Number.isInteger(dd) && n * a === (c - b) * dd && dd < 0) return { ok: false, msg: 'C\'est la bonne valeur ! Mets le signe − en haut (le dénominateur doit être positif).' };
    const r = base(v2);
    if (r.ok || r.msg || !dd) return r;
    const y = n / dd;
    if (approx(y, a / (c - b))) return { ok: false, msg: `⚠️ Tu as <b>inversé</b> la fraction : x = (nombre de droite) ÷ (coefficient de x).` };
    if (approx(y, -rn / rd)) return { ok: false, msg: 'Presque ! Le <b>signe</b> de ta fraction est faux.' };
    if (b && approx(y, (c + b) / a)) return { ok: false, msg: `⚠️ ${M(b)} a changé de côté sans changer d'opération.` };
    return r;
  };
  check.expected = base.expected;
  const r = {
    type: 'frac', html: `Résous l'équation. La solution est une <b>fraction</b> : écris-la simplifiée.${big(eqStr(q))}<span class="note">Pour une solution négative, mets le signe − au numérateur.</span>`,
    check, value: solveFloat(q), verify: E => holds(q, E[0] / E[1]),
    hint: `${b ? `Isole d'abord ${cx(a)} : ${b > 0 ? 'enlève' : 'ajoute'} ${M(Math.abs(b))} des deux côtés. Puis d` : 'D'}ivise les deux membres par ${P(a)}. La division ne « tombe pas juste » : le résultat est une fraction, à simplifier si possible.`,
    solution: `${S.chain}${gcd(c - b, a) > 1 ? ` (on simplifie par ${gcd(c - b, a)})` : ''}.<br>Une fraction est un nombre comme un autre : <b>x = ${valStr(rn, rd)}</b>.`,
  };
  r.afterVisual = S.html;
  return r;
}
function C6() {
  return `<h2>6. Solutions fractionnaires</h2>
<p class="intro">Quand la division ne tombe pas juste, la solution n'est pas un nombre entier. On l'écrit alors avec une <b>fraction</b>, qui est sa valeur exacte.</p>
<div class="def">ax = b ⇔ x = ${F('b', 'a')}. On donne la fraction <b>simplifiée</b>, avec le signe − au numérateur si elle est négative.</div>
<div class="cols">
<div>${fracLine(7, 3, 3)}</div>
<div><p class="note">La solution de 3x = 7 est le point A : on partage chaque unité en 3, et on compte 7 tiers. ${F(7, 3)} est entre 2 et 3.</p></div>
</div>
<div class="methode"><b>Méthode</b><ol>
<li>Isole le terme en x comme d'habitude.</li>
<li>Écris x = (nombre de droite) ÷ (coefficient de x), sous forme de fraction.</li>
<li>Simplifie la fraction (divise en haut et en bas par le même nombre).</li>
<li>Si elle est négative, écris le − en haut : −${F(3, 4)} se tape −3 sur 4.</li></ol></div>
<div class="ex"><span class="q">Exemple 1 : 3x = 7 et 6x = 4.</span><br>• <b>x = ${F(7, 3)}</b> (et pas 2,33… qui n'est qu'une valeur approchée).<br>• x = ${F(4, 6)} = <b>${F(2, 3)}</b> (on simplifie par 2).</div>
<div class="ex"><span class="q">Exemple 2 : 4x + 5 = 2.</span><br>On enlève 5 puis on divise par 4 :</div>
${solve({ L: [ax(4), nb(5)], R: [nb(2)] }).html}
<div class="warn">⚠️ Ne pas inverser : 3x = 7 donne ${F(7, 3)}, pas ${F(3, 7)}. Le coefficient de x va <b>en bas</b>.<br>⚠️ Signe : −2x = 3 donne x = ${F('−3', 2)} ; le dénominateur reste positif.<br>⚠️ Une fraction non simplifiée, comme ${F(4, 6)}, n'est pas la réponse attendue.</div>
<div class="retenir">À retenir : ax = b donne x = ${F('b', 'a')}, une fraction simplifiée.</div>`;
}

/* ---------- 7. x des deux côtés ---------- */
function L7(d) {
  const v = variant(d, 3);
  let a, b, c, e, s;
  for (;;) {
    if (v === 0) { c = ri(1, 2); a = c + ri(1, 3); s = ri(1, 5); b = ri(0, 6); }
    else if (v === 1) { c = ri(1, 6); a = c + ri(1, 5); s = ri(1, 12); b = ri(0, 20); }
    else if (v === 2) { a = ri(1, 6); c = a + ri(1, 5); s = nz(-9, 9); b = nz(-12, 12); }
    else { a = nz(-8, 8); c = nz(-8, 8); s = nz(-10, 10); b = nz(-15, 15); }
    if (a === c) continue;
    e = (a - c) * s + b;
    if (v < 2 && e <= b) continue;
    if (v === 0 && e > 18) continue;
    break;
  }
  let q = { L: b ? [ax(a), nb(b)] : [ax(a)], R: e ? [ax(c), nb(e)] : [ax(c)] };
  if (v === 3 && chance(.4)) q = { L: b ? [nb(b), ax(a)] : q.L, R: e ? [nb(e), ax(c)] : q.R };
  return linQ(q, {
    traps: [{ v: (e - b) / (a + c), m: `⚠️ Pour faire disparaître ${cx(c)} à droite, on <b>${c > 0 ? 'soustrait' : 'ajoute'}</b> ${cx(Math.abs(c))} des deux côtés : on calcule ${M(a)} − ${P(c)}, pas ${M(a)} + ${P(c)}.` },
      { v: (e + b) / (a - c), m: `⚠️ ${M(b)} a changé de côté sans changer d'opération.` }],
    hint: `D'abord, regroupe les x d'un seul côté : ${c > 0 ? 'enlève' : 'ajoute'} ${cx(Math.abs(c))} des deux côtés. Ensuite, c'est une équation ax + b = c comme au niveau 4.`,
  });
}
function C7() {
  return `<h2>7. Des x des deux côtés</h2>
<p class="intro">Quand il y a des x dans les deux membres, on commence par les rassembler d'un seul côté. Ensuite, on retrouve une équation déjà connue.</p>
<div class="def">On regroupe d'abord tous les x <b>du même côté</b> en enlevant (ou en ajoutant) le même terme en x aux deux membres. Puis on termine comme au niveau 4.</div>
${balance({ x: 3, u: 2 }, { x: 1, u: 8 }, { labels: ['3x + 2', 'x + 8'], anim: true, start: 'Équilibre : 3x + 2 = x + 8', label: 'Animation : on enlève un sac x, puis 2 masses, puis on partage' })}
<div class="methode"><b>Méthode</b><ol>
<li>Choisis un côté pour les x (souvent celui où il y en a le plus).</li>
<li>Enlève (ou ajoute) le terme en x de l'autre côté, dans les deux membres.</li>
<li>Isole le terme en x, puis divise.</li></ol></div>
<div class="ex"><span class="q">Exemple 1 : 3x + 2 = x + 8.</span><br>On enlève x des deux côtés : 2x + 2 = 8. Puis 2x = 6, donc <b>x = 3</b>.</div>
<div class="ex"><span class="q">Exemple 2 : 2x − 5 = 6x + 3.</span><br>• On enlève 6x : −4x − 5 = 3, puis −4x = 8, donc <b>x = −2</b>.<br>• Autre façon : on enlève 2x, −5 = 4x + 3, puis −8 = 4x, donc x = −2 aussi.<br>Vérification : 2 × (−2) − 5 = −9 et 6 × (−2) + 3 = −9 ✓</div>
<div class="warn">⚠️ Pour faire disparaître « + x » à droite, on <b>enlève</b> x des deux côtés : 3x − x = 2x (et non 3x + x).<br>⚠️ Le nombre seul change d'opération en changeant de côté, comme avant.</div>
<div class="retenir">À retenir : d'abord tous les x du même côté, ensuite comme ax + b = c.</div>`;
}

/* ---------- 8. parenthèses à développer ---------- */
function L8(d) {
  const v = variant(d, 3);
  let q;
  for (;;) {
    const k = ri(2, d < 2 ? 5 : 7), a = nz(-6, 6), s = d < 1 ? ri(1, 9) : nz(-9, 9);
    if (v === 0) q = { L: [par(k, 1, a)], R: [nb(k * (s + a))] };
    else if (v === 1) { const c = nz(-4, 6); if (c === k) continue; const e = k * (s + a) - c * s; q = { L: [par(k, 1, a)], R: e ? [ax(c), nb(e)] : [ax(c)] }; }
    else if (v === 2) { const m = ri(2, 6), b = nz(-6, 6); if (m === k) continue; const e = k * (s + a) - m * (s + b); q = { L: e ? [par(k, 1, a), nb(-e)] : [par(k, 1, a)], R: [par(m, 1, b)] }; }
    else { const b0 = nz(-12, 15), kk = pick([-1, -2, -3, -4]), c = nz(-5, 5); if (c === kk) continue; const e = b0 + kk * (s + a) - c * s; q = { L: [nb(b0), par(kk, 1, a)], R: e ? [ax(c), nb(e)] : [ax(c)] }; }
    break;
  }
  const k0 = q.L.find(t => t[0] === 'p');
  return linQ(q, {
    pre: 'Développe, puis résous l\'équation :',
    traps: [{ v: solveFloat(q, true), m: k0[1] < 0 ? '⚠️ Un « − » devant une parenthèse change le signe de <b>tous</b> les termes de la parenthèse.' : `⚠️ Le nombre devant la parenthèse multiplie <b>tous</b> les termes : ${M(k0[1])}(${lin(1, k0[3])}) = ${terms([[k0[1], 'x'], [k0[1] * k0[3], '']])}.` }],
    hint: `Commence par développer : k(x + a) = kx + ka (le nombre devant multiplie <b>chaque</b> terme). Réduis chaque membre, puis résous comme avant.`,
  });
}
function C8() {
  return `<h2>8. Équations avec des parenthèses</h2>
<p class="intro">Si l'équation contient des parenthèses, on les fait disparaître en développant. On retrouve alors une équation des niveaux précédents.</p>
<div class="def">On <b>développe</b> d'abord : k(a + b) = ka + kb. On réduit chaque membre, puis on résout comme avant.<br>Un « − » devant une parenthèse change le signe de tous ses termes.</div>
<div>${balance({ x: 3, u: 6 }, { u: 15 }, { labels: ['3(x + 2)', '15'], anim: true, start: '3(x + 2) = 3x + 6 = 15', label: 'Animation : 3 fois (x + 2), soit 3 sacs et 6 masses, pèsent 15' })}</div>
<div class="methode"><b>Méthode</b><ol>
<li>Développe chaque produit : le nombre devant multiplie <b>chaque</b> terme.</li>
<li>Réduis chaque membre (les x ensemble, les nombres ensemble).</li>
<li>Regroupe les x d'un côté, isole, divise. Vérifie.</li></ol></div>
<div class="ex"><span class="q">Exemple 1 : 3(x − 2) = x + 4.</span><br>3x − 6 = x + 4, puis 2x − 6 = 4, puis 2x = 10, donc <b>x = 5</b>.</div>
${solve({ L: [par(3, 1, -2)], R: [ax(1), nb(4)] }).html}
<div class="ex"><span class="q">Exemple 2 : 10 − 2(x + 1) = x + 2 et 2(x + 3) − 4 = 3(x − 1).</span><br>• 10 − 2x − 2 = x + 2, soit 8 − 2x = x + 2, puis 6 = 3x, donc <b>x = 2</b>.<br>• 2x + 6 − 4 = 3x − 3, soit 2x + 2 = 3x − 3, donc <b>x = 5</b>.</div>
<div class="warn">⚠️ 3(x − 2) n'est pas 3x − 2 : le 3 multiplie <b>aussi</b> le 2.<br>⚠️ 10 − 2(x + 1) = 10 − 2x − 2 : le « − » devant change le signe de <b>tous</b> les termes.</div>
<div class="retenir">À retenir : développer et réduire d'abord, résoudre ensuite.</div>`;
}

/* ---------- 9. mise en équation ---------- */
function L9(d) {
  const t = d < 1 ? 0 : d < 2 ? pick([0, 1]) : d < 3 ? pick([1, 2, 4]) : pick([1, 2, 3, 4]);
  let q, html, tpl, value, verify, unk, extra = '';
  if (t === 0) {
    const a = ri(2, 9), b = ri(1, 20), s = ri(1, 15), c = a * s + b, P1 = prenom();
    q = { L: [ax(a), nb(b)], R: [nb(c)] };
    html = `${P1} pense à un nombre. Ce nombre est multiplié par ${a}, puis on ajoute ${b} : on obtient ${c}.<br>Quel est ce nombre ?`;
    tpl = 'Le nombre est {0}'; value = (c - b) / a; verify = E => E[0] * a + b === c; unk = 'x le nombre';
  } else if (t === 1) {
    const m = ri(2, 4), a = ri(1, 9), s = ri(3, 25), T = s + m * s + a, P1 = prenom(); let P2; do { P2 = prenom(); } while (P2 === P1);
    q = { L: [ax(1), ax(m), nb(a)], R: [nb(T)] };
    html = `${P2} a ${a} billes de plus que ${m === 2 ? 'le double' : m === 3 ? 'le triple' : 'le quadruple'} du nombre de billes de ${P1}. À eux deux, ils ont ${T} billes.<br>Combien de billes a ${P1} ?`;
    tpl = `${P1} a {0} billes`; value = (T - a) / (1 + m); verify = E => E[0] + (m * E[0] + a) === T; unk = `x le nombre de billes de ${P1} (${P2} en a ${m}x + ${a})`;
  } else if (t === 2) {
    const a = ri(1, 9), s = ri(2, 20), Pm = 2 * (s + s + a);
    q = { L: [par(2, 2, a)], R: [nb(Pm)] };
    html = `Un rectangle a une longueur qui dépasse sa largeur de ${a} cm. Son périmètre est ${Pm} cm.<br>Quelle est sa largeur ?`;
    tpl = 'largeur = {0} cm'; value = (Pm / 2 - a) / 2; verify = E => 2 * (E[0] + E[0] + a) === Pm && E[0] > 0; unk = `x la largeur (la longueur vaut x + ${a})`;
    extra = rect('x', `x + ${a}`);
  } else if (t === 3) {
    const p = ri(2, 6), qq = p + ri(1, 4), s = ri(4, 20), b = (qq - p) * s;
    q = { L: [nb(b), ax(p)], R: [ax(qq)] };
    html = `Piscine : tarif A, abonnement de ${b} € puis ${p} € par séance ; tarif B, ${qq} € par séance sans abonnement.<br>Pour combien de séances les deux tarifs coûtent-ils le même prix ?`;
    tpl = '{0} séances'; value = b / (qq - p); verify = E => b + p * E[0] === qq * E[0]; unk = 'x le nombre de séances';
  } else {
    const s = ri(-5, 40), S = 3 * s + 3;
    q = { L: [ax(1), ax(1), nb(1), ax(1), nb(2)], R: [nb(S)] };
    html = `La somme de trois nombres entiers consécutifs est ${M(S)}.<br>Quel est le plus petit des trois ?`;
    tpl = 'Le plus petit est {0}'; value = (S - 3) / 3; verify = E => E[0] + (E[0] + 1) + (E[0] + 2) === S; unk = 'x le plus petit (les suivants sont x + 1 et x + 2)';
  }
  const S = solve(q), X = S.N / S.D;
  const eqH = t === 2 ? `2(x + x + ${q.L[0][3]}) = ${M(q.R[0][1])}` : t === 4 ? `x + (x + 1) + (x + 2) = ${M(q.R[0][1])}` : t === 1 ? `x + ${q.L[1][1]}x + ${q.L[2][1]} = ${q.R[0][1]}` : eqStr(q);
  return {
    type: 'nums', html: html + extra, tpl, check: solCheck(q, X), value, verify,
    hint: `Appelle x ce que l'on cherche. Traduis chaque phrase en calcul avec x, écris l'équation, puis résous-la. Vérifie enfin avec l'énoncé !`,
    solution: `On appelle ${unk}. L'équation est <b>${eqH}</b>.<br>${S.chain}.<br>Réponse : <b>${M(X)}</b>. ${t === 4 ? `(${M(X)} + ${M(X + 1)} + ${M(X + 2)} = ${M(q.R[0][1])} ✓)` : ''}`,
    afterVisual: steps([{ t: `<span style="color:#868e96;font-size:.85em">x = ${unk}</span>` }, ...S.rows]),
  };
}
function C9() {
  return `<h2>9. Mettre un problème en équation</h2>
<p class="intro">Les équations servent à résoudre des problèmes : âges, prix, longueurs… Il faut traduire le texte en langage mathématique.</p>
<div class="cols">
<div class="def">Une <b>mise en équation</b> se fait en 4 temps : choisir l'inconnue, traduire l'énoncé par une équation, la résoudre, vérifier et répondre par une phrase.</div>
<div>${rect('x', 'x + 3')}</div>
</div>
<div class="methode"><b>Méthode</b><ol>
<li><b>Choisis l'inconnue</b> : « soit x … » (ce que demande la question).</li>
<li>Écris les autres quantités avec x (le double : 2x ; 3 de plus : x + 3 ; le suivant : x + 1).</li>
<li><b>Traduis</b> la phrase qui donne une égalité, puis <b>résous</b>.</li>
<li><b>Vérifie</b> avec l'énoncé et réponds par une phrase.</li></ol></div>
<div class="ex"><span class="q">Exemple 1 : « Je pense à un nombre, je le multiplie par 4 et j'ajoute 7 : j'obtiens 31. »</span><br>Soit x le nombre : 4x + 7 = 31, donc 4x = 24 et <b>x = 6</b>. Vérification : 4 × 6 + 7 = 31 ✓<br>Rectangle : la longueur dépasse la largeur de 3 cm, le périmètre vaut 26 cm. Soit x la largeur : 2(x + x + 3) = 26, soit 4x + 6 = 26, donc <b>x = 5</b> cm.</div>
<div class="ex"><span class="q">Exemple 2 : billes et tarifs.</span><br>• Léa a 5 billes de plus que le double de Tom ; à eux deux, ils en ont 35. Soit x le nombre de billes de Tom : x + 2x + 5 = 35, donc 3x = 30 et <b>Tom a 10 billes</b> (Léa 25).<br>• Tarif A : 30 € puis 4 € par séance ; tarif B : 7 € par séance. 30 + 4x = 7x, donc 30 = 3x et <b>x = 10 séances</b>.<br>• Trois entiers consécutifs ont pour somme 48 : x + (x + 1) + (x + 2) = 48, donc 3x = 45 et le plus petit est <b>15</b>.</div>
<div class="warn">⚠️ Écris clairement ce que représente x.<br>⚠️ Vérifie que la réponse a du sens : une longueur positive, un nombre entier de séances…<br>⚠️ Réponds à la question posée : si on demande le nombre de billes de Tom, ne donne pas celui de Léa.</div>
<div class="retenir">À retenir : inconnue, équation, résolution, vérification.</div>`;
}

/* ---------- 10. équation produit nul ---------- */
const fac = (p, q, cst = false) => (q === 0 ? cx(p) : '(' + (cst ? terms([[q, ''], [p, 'x']]) : lin(p, q)) + ')');
/** check d'un ensemble de solutions avec messages « presque juste » */
function rootsMsg(E, o = {}) {
  const e = [...new Set(E)].sort((p, q) => p - q);
  const fn = v => {
    if (v.none) return { ok: e.length === 0, msg: e.length ? (o.noneWrong || 'Il y a pourtant des solutions : cherche encore !') : '' };
    const u = [...new Set(v.vals.filter(x => x !== null))].sort((p, q) => p - q);
    if (e.length === 0) return { ok: false, msg: o.noneMsg || 'As-tu vérifié que ce nombre est vraiment solution ?' };
    if (u.length === e.length && u.every((x, i) => approx(x, e[i]))) return { ok: true };
    if (u.length < e.length && u.every(x => e.some(y => approx(x, y)))) return { ok: false, msg: o.oneMsg || 'Tu as trouvé une solution juste, mais il en manque une !' };
    if (u.every(x => e.some(y => approx(x, -y))) && !u.every(x => e.some(y => approx(x, y)))) return { ok: false, msg: o.signMsg || 'Presque ! Regarde les <b>signes</b> de tes solutions.' };
    for (const t of o.traps || []) if (t.test(u)) return { ok: false, msg: t.m };
    return { ok: false };
  };
  fn.expected = e;
  return fn;
}
function L10(d) {
  const v = variant(d, 3);
  let f;
  for (;;) {
    if (v === 0) { const r1 = nz(-9, 9), r2 = nz(-9, 9); f = [[1, -r1], [1, -r2]]; }
    else if (v === 1) { const r = nz(-12, 12), r2 = ri(-12, 12); f = chance(.5) ? [[1, 0], [1, -r]] : [[1, -r2], [1, -r]]; }
    else if (v === 2) { const p = pick([2, 3, 4, 5]), r = nz(-8, 8), r2 = nz(-9, 9); f = [[p, p === 2 ? -ri(-9, 9) : -p * r], [1, -r2]]; }
    else { const p = pick([2, -1, 3, -2]), m = ri(-9, 9), r2 = nz(-9, 9); f = [[p, Math.abs(p) === 2 ? m : -p * nz(-6, 6)], [pick([1, 2]), 0]]; f[1][1] = -f[1][0] * r2; if (chance(.25)) f[1] = [2 * f[0][0], 2 * f[0][1]]; }
    const roots = f.map(([p, q]) => -q / p);
    if (roots.every(r => Number.isInteger(2 * r) && Math.abs(r) <= 20)) break;
  }
  if (f[1][1] === 0 && f[0][1] !== 0) f = [f[1], f[0]]; // le facteur « x » en premier : x(x + 4)
  const roots = f.map(([p, q]) => -q / p + 0), cst = v === 3 && chance(.5);
  const html = `Résous l'équation produit nul :${big(`${f.map(([p, q]) => fac(p, q, cst && p < 0)).join('')} = 0`)}`;
  const half = roots.some(r => !Number.isInteger(r));
  const E = [...new Set(roots)].sort((a, b) => a - b);
  const sub = ([p, q]) => `${terms(cst && p < 0 ? [[q, ''], [p, 'x']] : [[p, 'x'], [q, '']])} = 0`;
  const sol1 = ([p, q]) => (p === 1 ? `x = ${M(-q)}` : `${cx(p)} = ${M(-q)} ⇔ x = ${valStr(-q, p)}`);
  return {
    type: 'roots', html: html + (half ? '<span class="note">Une solution peut être décimale (par exemple 1,5).</span>' : ''), keys: half ? { comma: true } : undefined,
    check: rootsMsg(E, { oneMsg: '⚠️ Un produit nul a souvent <b>deux</b> solutions : il faut annuler <b>chaque</b> facteur. Il en manque une !', signMsg: 'Presque ! Attention aux signes : x − 3 = 0 donne x = 3 (et non −3).' }),
    truth: x => Math.abs((f[0][0] * x + f[0][1]) * (f[1][0] * x + f[1][1])) < 1e-9,
    hint: `Un produit est nul si et seulement si <b>l'un des facteurs</b> est nul. Écris « ${sub(f[0])} <b>ou</b> ${sub(f[1])} » et résous chaque petite équation.`,
    solution: `${sub(f[0])} ou ${sub(f[1])}<br>${sol1(f[0])} ou ${sol1(f[1])}.<br>${E.length === 1 ? `Les deux facteurs donnent la même valeur : <b>une seule solution, x = ${M(E[0])}</b>.` : `Deux solutions : <b>x = ${M(E[0])} ou x = ${M(E[1])}</b>.`}`,
    afterVisual: steps([{ t: `${f.map(([p, q]) => fac(p, q, cst && p < 0)).join('')} = 0` }, { t: '⇕ un des facteurs est nul' }, { t: `${sub(f[0])} &nbsp;<b>ou</b>&nbsp; ${sub(f[1])}` }, { t: `x = ${M(roots[0])} &nbsp;<b>ou</b>&nbsp; x = ${M(roots[1])}` }]),
  };
}
function C10() {
  return `<h2>10. Équation produit nul</h2>
<p class="intro">Certaines équations ont <b>plusieurs</b> solutions. Quand l'équation est un produit égal à 0, on les trouve toutes facilement.</p>
<div class="def"><b>Un produit est nul si et seulement si l'un de ses facteurs est nul</b> :<br>A × B = 0 ⇔ A = 0 <b>ou</b> B = 0.</div>
<div>${steps([{ t: '(x − 3)(x + 5) = 0' }, { t: '⇕' }, { t: 'x − 3 = 0 &nbsp;<b>ou</b>&nbsp; x + 5 = 0' }, { t: 'x = 3 &nbsp;<b>ou</b>&nbsp; x = −5' }])}</div>
${plot({ fs: [{ f: x => (x - 3) * (x + 5), l: 'y = (x − 3)(x + 5)' }], xr: [-7, 5], yr: [-17, 13], pts: [{ x: -5, y: 0, l: '−5' }, { x: 3, y: 0, l: '3' }] })}
<div class="methode"><b>Méthode</b><ol>
<li>Vérifie que l'équation est bien de la forme « produit = 0 ».</li>
<li>Écris : premier facteur = 0 <b>ou</b> second facteur = 0.</li>
<li>Résous chaque petite équation du premier degré.</li>
<li>Donne toutes les solutions (une seule si les deux facteurs donnent la même).</li></ol></div>
<div class="ex"><span class="q">Exemple 1 : (x − 3)(x + 5) = 0.</span><br>x − 3 = 0 ou x + 5 = 0, donc <b>x = 3 ou x = −5</b>. Sur la courbe, ce sont les points où y = 0.</div>
<div class="ex"><span class="q">Exemple 2 : x(2x − 3) = 0 et (4 − 2x)(x + 1) = 0.</span><br>• x = 0 ou 2x = 3, donc <b>x = 0 ou x = 1,5</b>.<br>• 4 − 2x = 0 ou x + 1 = 0, soit 2x = 4 ou x = −1, donc <b>x = 2 ou x = −1</b>.<br>• Cas particulier : (x − 2)(2x − 4) = 0 donne deux fois x = 2 : <b>une seule solution</b>.</div>
<div class="warn">⚠️ Ne pas <b>oublier une solution</b> : il faut annuler chaque facteur. Et x tout seul est un facteur (solution 0) !<br>⚠️ Signe : x + 5 = 0 donne x = <b>−5</b>, pas 5.<br>⚠️ La règle ne marche que pour un produit égal à <b>0</b> : (x − 1)(x + 2) = 6 ne donne pas x − 1 = 6 ou x + 2 = 6.</div>
<div class="retenir">À retenir : A × B = 0 ⇔ A = 0 ou B = 0.</div>`;
}

/* ---------- 11. x² = a ---------- */
function sqEq(k, h, b, c) { // k(x − h)² + b = c
  const sq = h === 0 ? X2 : `(${lin(1, -h)})<sup>2</sup>`;
  return `${k === 1 ? '' : M(k)}${sq}${b ? (b > 0 ? ' + ' + M(b) : ' − ' + M(-b)) : ''} = ${M(c)}`;
}
function L11(d) {
  const v = variant(d, 3);
  const kind = v === 0 ? 2 : pick([2, 2, 1, 0]);
  const n = ri(1, v === 0 ? 10 : 9), A = kind === 2 ? n * n : kind === 1 ? 0 : -ri(1, 25);
  let k = 1, h = 0, b = 0;
  if (v === 2) { if (chance(.5)) k = ri(2, 5); else b = nz(-20, 20); }
  if (v === 3) h = nz(-6, 6);
  const c = k * A + b;
  const E = kind === 2 ? [h - n, h + n] : kind === 1 ? [h] : [];
  const html = `Résous l'équation :${big(sqEq(k, h, b, c))}`;
  const red_ = (k !== 1 || b) ? `${sqEq(1, h, 0, A)} (on isole le carré). ` : '';
  const X = h === 0 ? 'x' : `x ${h > 0 ? '− ' + h : '+ ' + (-h)}`;
  const sol = kind === 2 ? `${X} = ${n} ou ${X} = −${n}${h ? ` ⇔ x = ${M(h + n)} ou x = ${M(h - n)}` : ''}. Deux solutions : <b>x = ${M(E[0])} ou x = ${M(E[1])}</b>.`
    : kind === 1 ? `${X} = 0 : <b>une seule solution, x = ${M(h)}</b>.` : `Un carré n'est jamais négatif : <b>aucune solution</b>.`;
  return {
    type: 'roots', html,
    check: rootsMsg(E, {
      oneMsg: `Presque ! ${sqEq(1, h, 0, A)} a <b>deux</b> solutions : un carré égal à ${A} vient de ${n} <b>ou</b> de −${n}. (−${n})<sup>2</sup> = ${A} aussi !`,
      noneMsg: 'Peut-il exister un nombre dont le carré est négatif ?', noneWrong: A === 0 ? 'Il y a une solution : quel nombre a pour carré 0 ?' : 'Il y a pourtant des solutions : pense à la racine carrée.',
      traps: [{ test: u => A > 0 && u.length && u.every(x => approx(x, A / 2)), m: `⚠️ x<sup>2</sup> = x × x, pas 2 × x : on cherche un nombre dont le <b>carré</b> vaut ${A}.` },
        { test: u => h !== 0 && u.length === 2 && approx(u[0], -n) && approx(u[1], n), m: `Presque ! C'est <b>${X}</b> qui vaut ${n} ou −${n}. Trouve x ensuite.` }],
    }),
    truth: x => Math.abs(k * (x - h) * (x - h) + b - c) < 1e-9,
    hint: `${red_ ? 'Isole d\'abord le carré. ' : ''}Un carré égal à un nombre positif : <b>deux</b> solutions (un nombre et son opposé). Égal à 0 : une seule. Égal à un nombre négatif : aucune.`,
    solution: `${red_}${sol}`,
    afterVisual: sqGraph(h, A, E, h ? `y = (${lin(1, -h)})²` : 'y = x²'),
  };
}
function C11() {
  return `<h2>11. Équations x<sup>2</sup> = a</h2>
<p class="intro">Un nombre et son opposé ont le même carré : 3<sup>2</sup> = 9 et (−3)<sup>2</sup> = 9. C'est pourquoi une équation x<sup>2</sup> = a peut avoir deux solutions.</p>
<div class="def">• Si <b>a &gt; 0</b> : x<sup>2</sup> = a a <b>deux</b> solutions, √a et −√a.<br>• Si <b>a = 0</b> : une seule solution, x = 0.<br>• Si <b>a &lt; 0</b> : <b>aucune</b> solution (un carré n'est jamais négatif).</div>
<div>${sqGraph(0, 9, [-3, 3], 'y = x²')}</div>
<p class="note">La parabole y = x<sup>2</sup> coupe la droite y = a deux fois si a &gt; 0, la touche si a = 0, ne la rencontre pas si a &lt; 0.</p>
<div class="methode"><b>Méthode</b><ol>
<li>Isole le carré : enlève le nombre ajouté, divise par le coefficient.</li>
<li>Regarde le signe de a : positif, nul ou négatif.</li>
<li>Si a &gt; 0 : ce qui est au carré vaut √a <b>ou</b> −√a. Termine le calcul de x.</li></ol></div>
<div class="ex"><span class="q">Exemple 1 : x<sup>2</sup> = 49 et x<sup>2</sup> + 5 = 1.</span><br>• <b>x = 7 ou x = −7</b>, car 7<sup>2</sup> = 49 et (−7)<sup>2</sup> = 49.<br>• x<sup>2</sup> = −4 : <b>aucune solution</b>.</div>
<div class="ex"><span class="q">Exemple 2 : 3x<sup>2</sup> = 48 et (x − 2)<sup>2</sup> = 9.</span><br>• x<sup>2</sup> = 48 ÷ 3 = 16, donc <b>x = 4 ou x = −4</b>.<br>• x − 2 = 3 ou x − 2 = −3, donc <b>x = 5 ou x = −1</b>.</div>
<div class="warn">⚠️ N'oublie pas la solution <b>négative</b> !<br>⚠️ x<sup>2</sup> = 16 ne donne pas x = 8 : x<sup>2</sup> = x × x, pas 2 × x.<br>⚠️ Dans (x − 2)<sup>2</sup> = 9, c'est x − 2 qui vaut 3 ou −3, pas x.</div>
<div class="retenir">À retenir : x<sup>2</sup> = a a deux solutions si a &gt; 0, une si a = 0, aucune si a &lt; 0.</div>`;
}

/* ---------- 12. défis ---------- */
function L12(d) {
  const v = pick(d < 1 ? [0, 4] : d < 2 ? [0, 1, 2, 4] : [0, 1, 2, 3, 4]);
  if (v === 0) { // fractions de x
    let a, c; do { a = pick([2, 3, 4, 5, 6]); c = pick([2, 3, 4, 5, 6]); } while (a === c);
    const m = lcm(a, c), s = m * nz(-4, 5), b = ri(-9, 12), e = s / a + b - s / c;
    const q = { L: [['xf', 1, a], nb(b)], R: [['xf', 1, c], nb(e)] };
    if (!b) q.L.pop(); if (!e) q.R.pop();
    const q2 = { L: [ax(m / a), nb(m * b)], R: [ax(m / c), nb(m * e)] };
    if (!q2.L[1][1]) q2.L.pop(); if (!q2.R[1][1]) q2.R.pop();
    const S = solve(q2);
    return {
      type: 'nums', tpl: 'x = {0}', html: `Défi : résous l'équation.${big(eqStr(q))}`, check: solCheck(q, s), value: solveFloat(q), verify: E => holds(q, E[0]),
      hint: `Multiplie les deux membres par ${m} (un multiple commun de ${a} et ${c}) pour faire disparaître les fractions, puis résous comme d'habitude.`,
      solution: `On multiplie les deux membres par ${m} : ${eqStr(q2)}.<br>${S.chain}.<br>${checkLine(q, s)}`,
      afterVisual: steps([{ l: side(q.L), r: side(q.R) }, { op: ['× ' + m, '× ' + m], why: 'pour chasser les dénominateurs' }, ...S.rows]),
    };
  }
  if (v === 1) { // (x + a)² = (x + b)(x + c) : les x² s'éliminent
    let a, b, c, s;
    for (;;) { a = nz(-7, 7); b = nz(-7, 7); s = nz(-9, 9); if (b + s === 0) continue; const num = 2 * a * s - b * s + a * a; if (num % (b + s)) continue; c = num / (b + s); if (c === 0 || Math.abs(c) > 15 || 2 * a - b - c === 0) continue; break; }
    const ex = (x) => (x + a) * (x + a) - (x + b) * (x + c);
    const html = `Défi : résous l'équation.${big(`(${lin(1, a)})<sup>2</sup> = (${lin(1, b)})(${lin(1, c)})`)}`;
    const k = 2 * a - b - c, r0 = b * c - a * a;
    const q = { L: [ax(k)], R: [nb(r0)] };
    return {
      type: 'nums', tpl: 'x = {0}', html,
      check: numsCheck([s], { msg: v2 => (approx(v2[0], -s) ? 'Presque ! Le <b>signe</b> est faux.' : `Développe les deux membres : les x<sup>2</sup> s'en vont !`) }),
      value: r0 / k, verify: E => Math.abs(ex(E[0])) < 1e-9,
      hint: `Développe chaque membre : identité remarquable à gauche, double distributivité à droite. Les x<sup>2</sup> s'éliminent : il reste une équation du premier degré.`,
      solution: `${terms([[1, X2], [2 * a, 'x'], [a * a, '']])} = ${terms([[1, X2], [b + c, 'x'], [b * c, '']])}<br>On enlève x<sup>2</sup> des deux côtés : ${terms([[2 * a, 'x'], [a * a, '']])} = ${terms([[b + c, 'x'], [b * c, '']])}<br>⇔ ${eqStr(q)} ⇔ <b>x = ${M(s)}</b>.`,
      afterVisual: steps([{ l: `(${lin(1, a)})<sup>2</sup>`, r: `(${lin(1, b)})(${lin(1, c)})` }, { op: ['', ''], why: 'on développe' }, { l: terms([[1, X2], [2 * a, 'x'], [a * a, '']]), r: terms([[1, X2], [b + c, 'x'], [b * c, '']]) }, { op: ['− x²', '− x²'], why: 'les x² s\'éliminent' }, ...solve({ L: [ax(2 * a), nb(a * a)].filter(t => t[1]), R: [ax(b + c), nb(b * c)].filter(t => t[1]) }).rows]),
    };
  }
  if (v === 2) { // x² = kx : ne pas diviser par x
    const k = nz(-12, 12), m = pick([1, 1, 2]);
    const E = [0, k];
    const html = `Défi : résous l'équation.${big(`${m === 1 ? '' : m}${X2} = ${M(m * k)}x`.replace(' = 1x', ' = x').replace(' = −1x', ' = −x'))}`;
    return {
      type: 'roots', html,
      check: rootsMsg(E, { oneMsg: `⚠️ Il manque une solution ! On ne divise pas par x (x pourrait être nul) : ${terms([[m, X2], [-m * k, 'x']])} = 0 ⇔ ${cx(m)}(${lin(1, -k)}) = 0.` }),
      truth: x => Math.abs(m * x * x - m * k * x) < 1e-9,
      hint: `Ne divise pas par x ! Ramène tout à gauche, puis factorise par x : on obtient une équation produit nul.`,
      solution: `${terms([[m, X2], [-m * k, 'x']])} = 0 ⇔ ${cx(m)}(${lin(1, -k)}) = 0 ⇔ x = 0 ou ${lin(1, -k)} = 0 ⇔ <b>x = ${M(Math.min(0, k))} ou x = ${M(Math.max(0, k))}</b>.`,
      afterVisual: steps([{ l: `${m === 1 ? '' : m}${X2}`, r: `${M(m * k)}x`.replace(/^1x/, 'x').replace(/^−1x/, '−x') }, { op: [`${m * k > 0 ? '−' : '+'} ${cx(Math.abs(m * k))}`, `${m * k > 0 ? '−' : '+'} ${cx(Math.abs(m * k))}`], why: '' }, { l: terms([[m, X2], [-m * k, 'x']]), r: '0' }, { op: ['', ''], why: 'on factorise par x' }, { l: `${cx(m)}(${lin(1, -k)})`, r: '0' }, { t: `x = 0 &nbsp;<b>ou</b>&nbsp; x = ${M(k)}` }]),
    };
  }
  if (v === 3) { // (px + q)² = n²
    const p = pick([1, 2, 2, 3]), qq = nz(-7, 7), n = ri(1, 9);
    const rs = [(n - qq) / p, (-n - qq) / p];
    if (!rs.every(r => Number.isInteger(2 * r))) return L12(d);
    const E = [...rs].sort((a, b) => a - b), half = E.some(r => !Number.isInteger(r));
    const inner = lin(p, qq);
    return {
      type: 'roots', html: `Défi : résous l'équation.${big(`(${inner})<sup>2</sup> = ${n * n}`)}`, keys: half ? { comma: true } : undefined,
      check: rootsMsg(E, { oneMsg: `Il manque une solution : ${inner} peut valoir ${n} <b>ou</b> −${n}.` }),
      truth: x => Math.abs((p * x + qq) * (p * x + qq) - n * n) < 1e-9,
      hint: `Un carré égal à ${n * n} : ce qui est dans la parenthèse vaut ${n} ou −${n}. Résous les deux équations du premier degré.`,
      solution: `${inner} = ${n} ou ${inner} = −${n} ⇔ x = ${valStr(n - qq, p)} ou x = ${valStr(-n - qq, p)}, soit <b>x = ${M(E[0])} ou x = ${M(E[1])}</b>.`,
      afterVisual: steps([{ t: `(${inner})<sup>2</sup> = ${n * n}` }, { t: `${inner} = ${n} &nbsp;<b>ou</b>&nbsp; ${inner} = −${n}` }, { t: `x = ${M(rs[0])} &nbsp;<b>ou</b>&nbsp; x = ${M(rs[1])}` }]),
    };
  }
  // v === 4 : équation sans solution (ou piège qui en a une)
  const k = ri(2, 6), a = nz(-6, 6), trap = chance(.35);
  let b; do { b = nz(-20, 20); } while (b === k * a);
  const q = trap ? { L: [par(k, 1, a)], R: [ax(k - 1), nb(b)] } : { L: [par(k, 1, a)], R: [ax(k), nb(b)] };
  const E = trap ? [b - k * a] : [];
  return {
    type: 'roots', html: `Défi : résous l'équation (s'il y a des solutions).${big(eqStr(q))}`,
    check: rootsMsg(E, { noneMsg: 'Développe et regarde bien ce qui reste quand on regroupe les x…', noneWrong: 'Regarde bien : les x ne s\'éliminent pas tous ici.' }),
    truth: x => holds(q, x),
    hint: `Développe le membre de gauche, puis regroupe les x d'un côté. Que reste-t-il ?`,
    solution: trap ? `${terms([[k, 'x'], [k * a, '']])} = ${side(q.R)} ⇔ <b>x = ${M(E[0])}</b> (une seule solution).`
      : `${terms([[k, 'x'], [k * a, '']])} = ${side(q.R)} ⇔ ${M(k * a)} = ${M(b)} en enlevant ${k}x des deux côtés : c'est <b>impossible</b>. <b>Aucune solution.</b>`,
    afterVisual: trap ? solve(q).html : steps([{ l: side(q.L), r: side(q.R) }, { op: ['', ''], why: 'on développe' }, { l: terms([[k, 'x'], [k * a, '']]), r: side(q.R) }, { op: ['− ' + k + 'x', '− ' + k + 'x'], why: '' }, { l: M(k * a), r: M(b) }, { t: '❌ égalité fausse : aucune solution' }]),
  };
}
function C12() {
  return `<h2>12. Défis</h2>
<p class="intro">Tout ce qu'on a appris, mélangé : fractions, carrés, produit nul, équations sans solution. Avant de calculer, <b>regarde la forme</b> de l'équation.</p>
<div class="def">• Des fractions ? On multiplie tout par un dénominateur commun.<br>• Un x<sup>2</sup> ? On ramène tout à 0 et on factorise, ou on isole le carré.<br>• Les x disparaissent ? Aucune solution (égalité fausse) ou une infinité (égalité toujours vraie).</div>
${plot({ fs: [{ f: x => x * x, l: 'y = x²' }, { f: x => 5 * x, c: '#e8590c', l: 'y = 5x' }], xr: [-2, 7], yr: [-5, 40], pts: [{ x: 0, y: 0, l: '0' }, { x: 5, y: 25 }] })}
<div class="methode"><b>Méthode</b><ol>
<li>Repère la forme : premier degré, fractions, carré, produit.</li>
<li>Ne divise jamais par x : ramène tout à gauche et factorise.</li>
<li>Avec des carrés des deux côtés, développe : souvent les x<sup>2</sup> s'éliminent.</li>
<li>Vérifie chaque solution dans l'équation de départ.</li></ol></div>
<div class="ex"><span class="q">Exemple 1 : ${F('x', 2)} + 1 = ${F('x', 3)} + 3 et x<sup>2</sup> = 5x.</span><br>• On multiplie tout par 6 : 3x + 6 = 2x + 18, donc <b>x = 12</b>.<br>• x<sup>2</sup> − 5x = 0, soit x(x − 5) = 0, donc <b>x = 0 ou x = 5</b> (les deux points communs sur le graphique).</div>
${steps([{ l: 'x<sup>2</sup>', r: '5x' }, { op: ['− 5x', '− 5x'], why: '' }, { l: 'x<sup>2</sup> − 5x', r: '0' }, { l: 'x(x − 5)', r: '0' }, { t: 'x = 0 &nbsp;<b>ou</b>&nbsp; x = 5' }])}
<div class="ex"><span class="q">Exemple 2 : (x + 1)<sup>2</sup> = (x + 3)(x − 2), (2x − 1)<sup>2</sup> = 9 et 2(x + 3) = 2x + 1.</span><br>• x<sup>2</sup> + 2x + 1 = x<sup>2</sup> + x − 6 : les x<sup>2</sup> s'éliminent, x + 1 = −6, donc <b>x = −7</b>.<br>• 2x − 1 = 3 ou 2x − 1 = −3, donc <b>x = 2 ou x = −1</b>.<br>• 2x + 6 = 2x + 1, soit 6 = 1 : impossible, <b>aucune solution</b>.</div>
<div class="warn">⚠️ Ne jamais diviser par x : on perdrait la solution x = 0.<br>⚠️ Un carré égal à un nombre positif : <b>deux</b> cas à traiter.</div>
<div class="retenir">À retenir : d'abord reconnaître la forme, ensuite choisir la méthode.</div>`;
}

export const LEVELS = [
  { titre: 'Est-ce une solution ?', generate: L1, cours: C1, classe: '4e' },
  { titre: 'x + a = b et x − a = b', generate: L2, cours: C2, classe: '4e' },
  { titre: 'ax = b', generate: L3, cours: C3, classe: '4e' },
  { titre: 'ax + b = c', generate: L4, cours: C4, classe: '4e' },
  { titre: 'Solutions négatives', generate: L5, cours: C5, classe: '4e' },
  { titre: 'Solutions fractionnaires', generate: L6, cours: C6, classe: '4e' },
  { titre: 'Des x des deux côtés', generate: L7, cours: C7, classe: '4e' },
  { titre: 'Avec des parenthèses', generate: L8, cours: C8, classe: '4e – 3e' },
  { titre: 'Mettre en équation', generate: L9, cours: C9, classe: '4e – 3e' },
  { titre: 'Équation produit nul', generate: L10, cours: C10, classe: '3e' },
  { titre: 'Équations x² = a', generate: L11, cours: C11, classe: '3e' },
  { titre: 'Défis', generate: L12, cours: C12, classe: '3e' },
];
export const OPTIONS = { need: 4, keys: { neg: true, comma: false } };

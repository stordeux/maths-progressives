// Priorités opératoires : 12 niveaux de calcul pas à pas.
// Chaque expression est construite comme un arbre ; l'ordre des étapes suit les règles de priorité
// (parenthèses les plus intérieures, puis carrés, puis × et ÷ de gauche à droite, puis + et − de gauche à droite).
// L'élève écrit le résultat de chaque étape (type `steps`) ; le site signale la première étape fausse.
// Vérification indépendante (tests) : le texte affiché est relu par un petit analyseur d'expressions
// (sans l'arbre) et chaque ligne doit garder la même valeur que l'expression de départ.
import { ri, pick, shuffle, chance, nz } from '../../engine/util/rand.js';
import { F, M } from '../../engine/util/fmt.js';
import { approx } from '../../engine/util/arith.js';
import { stepsCheck, choiceCheck } from '../../engine/answers/checks.js';
import { treeSVG, LET, SYM } from './draw.js';

/* =====================================================================
   Arbres d'expressions
   ===================================================================== */
const N = v => ({ k: 'n', v });
const op = (o, a, b) => (a && b ? { k: 'op', o, a, b } : null);
const add = (a, b) => op('+', a, b), sub = (a, b) => op('-', a, b), mul = (a, b) => op('*', a, b), dvd = (a, b) => op('/', a, b);
const sq = a => (a ? { k: 'sq', a } : null);
const fr = (a, b) => (a && b ? { k: 'fr', a, b } : null);
/** parenthèses voulues (elles sont de toute façon ajoutées quand l'arbre l'exige) */
const P = x => { if (x) x.par = true; return x; };
/** crochets */
const B = x => { if (x) { x.par = true; x.br = true; } return x; };
const n = (a, b) => N(ri(a, b));
const m = (hi = 9, lo = 2) => mul(n(lo, hi), n(lo, hi));
const kids = t => (t.k === 'n' ? [] : t.k === 'sq' ? [t.a] : [t.a, t.b]);
const prec = t => (t.k === 'op' ? (t.o === '+' || t.o === '-' ? 1 : 2) : t.k === 'fr' ? 3 : t.k === 'sq' ? 4 : 5);

/** valeur directe d'un sous-arbre (pour construire des divisions exactes) */
function ev(t) {
  if (t.k === 'n') return t.v;
  if (t.k === 'sq') return ev(t.a) ** 2;
  const a = ev(t.a), b = ev(t.b);
  if (t.k === 'fr') return a / b;
  return t.o === '+' ? a + b : t.o === '-' ? a - b : t.o === '*' ? a * b : a / b;
}
/** diviseurs de x entre 2 et hi (avec un quotient ≥ 2 en valeur absolue) */
const divs = (x, hi = 9) => { const r = []; for (let k = 2; k <= hi; k++) if (x % k === 0 && Math.abs(x / k) >= 2) r.push(k); return r; };
/** t ÷ (un diviseur de sa valeur), ou null */
const divBy = (t, hi = 9) => { if (!t) return null; const ds = divs(ev(t), hi); return ds.length ? dvd(t, N(pick(ds))) : null; };
/** quotient exact c·q ÷ c */
const quo = (hi = 9) => { const c = ri(2, hi); return dvd(N(c * ri(2, 9)), N(c)); };
/** petite expression (sans parenthèses) qui vaut V (entier ≥ 2) ; cx = complexité */
function expr(V, cx) {
  if (cx <= 0 || V < 2) return N(V);
  const f = [];
  if (V >= 3) f.push(() => { const x = ri(1, V - 1); return add(N(x), N(V - x)); });
  f.push(() => { const y = ri(1, 9); return sub(N(V + y), N(y)); });
  const ds = divs(V);
  if (ds.length) f.push(() => { const a = pick(ds); return mul(N(a), N(V / a)); });
  if (cx >= 2 && V >= 6) f.push(() => { const x = ri(1, V - 4), ds2 = divs(V - x); if (!ds2.length) return add(N(x), N(V - x)); const a = pick(ds2); return add(N(x), mul(N(a), N((V - x) / a))); });
  if (cx >= 2) f.push(() => { const a = ri(2, 9), b = ri(2, 9); return a * b > V ? sub(mul(N(a), N(b)), N(a * b - V)) : add(mul(N(a), N(b)), N(V - a * b)); });
  return pick(f)();
}
/** fraction exacte : numérateur et dénominateur de complexités cn, cd */
function frac(cn, cd, hiQ = 9) {
  const v = ri(2, 9), q = ri(2, hiQ);
  return fr(expr(v * q, cn), expr(v, cd));
}

/** parenthèses exigées par la structure ; les numérateurs et dénominateurs sont des « groupes » */
function fixPar(t) {
  if (t.k === 'op') { const p = prec(t); if (prec(t.a) < p) t.a.par = true; if (prec(t.b) <= p) t.b.par = true; }
  if (t.k === 'sq' && t.a.k !== 'n') t.a.par = true;
  if (t.k === 'fr') { t.a.grp = true; t.b.grp = true; }
  if (t.k === 'n') { t.par = false; t.br = false; }
  kids(t).forEach(fixPar);
  return t;
}

/* ---------- ordre des étapes ---------- */
const atom = t => t.k === 'n' || t.step !== undefined;
const val = t => (t.k === 'n' ? t.v : t.val);
function compute(t) {
  const a = val(t.a);
  if (t.k === 'sq') return a * a;
  const b = val(t.b);
  if (t.k === 'fr') return a / b;
  return t.o === '+' ? a + b : t.o === '-' ? a - b : t.o === '*' ? a * b : a / b;
}
/** premier groupe (parenthèses, numérateur, dénominateur) pas encore calculé, de gauche à droite */
function firstGroup(t) {
  for (const c of kids(t)) {
    if (atom(c)) continue;
    if (c.par || c.grp) return c;
    const r = firstGroup(c); if (r) return r;
  }
  return null;
}
/** première opération prête (ses opérandes sont des nombres) du genre voulu, de gauche à droite */
function firstReady(t, test) {
  if (atom(t)) return null;
  if (kids(t).every(atom)) return test(t) ? t : null;
  for (const c of kids(t)) { const r = firstReady(c, test); if (r) return r; }
  return null;
}
const isMul = t => t.k === 'fr' || (t.k === 'op' && (t.o === '*' || t.o === '/'));
/** prochaine opération à faire dans t (vu comme une expression entière) */
function find(t) {
  if (atom(t)) return null;
  const g = firstGroup(t);
  if (g) return find(g);
  return firstReady(t, x => x.k === 'sq') || firstReady(t, isMul) || firstReady(t, x => x.k === 'op');
}
function run(root) {
  const steps = [];
  while (!atom(root)) {
    const t = find(root);
    if (!t) throw new Error('aucune étape trouvée');
    t.val = compute(t); t.step = steps.length; steps.push(t);
  }
  return steps;
}

/* ---------- écriture ---------- */
const numTxt = (v, first) => (v < 0 ? (first ? '−' + Math.abs(v) : '(−' + Math.abs(v) + ')') : String(v));
const ref = k => `<b class="ref">${LET[k]}</b>`;
/**
 * Écrit l'expression telle qu'elle est avant l'étape k.
 * o.mode : 'ref' (les calculs faits deviennent des lettres) ou 'val' (leurs valeurs) ;
 * o.hl : surligne l'opération de l'étape k ; o.nopar : sans aucune parenthèse (distracteurs).
 */
function R(t, k, o = {}, first = true) {
  if (t.step !== undefined && t.step < k) return o.mode === 'val' ? numTxt(t.val, first) : ref(t.step);
  let s;
  const par = t.par && !o.nopar;
  if (t.k === 'n') s = numTxt(t.v, first);
  else if (t.k === 'sq') s = R(t.a, k, o, false) + '<sup>2</sup>';
  else if (t.k === 'fr') s = F(R(t.a, k, o, true), R(t.b, k, o, true));
  else s = `${R(t.a, k, o, par ? true : first)} ${SYM[t.o]} ${R(t.b, k, o, false)}`;
  if (par && t.k !== 'n') s = t.br ? `[${s}]` : `(${s})`;
  if (o.hl && t.step === k) s = `<mark>${s}</mark>`;
  return s;
}
const unmark = s => s.replace(/<\/?mark>/g, '');

/* =====================================================================
   Vérification indépendante : on relit le texte affiché (HTML) avec un petit analyseur
   d'expressions (règles usuelles de priorité), sans utiliser l'arbre.
   ===================================================================== */
export function toJs(html, E = []) {
  let s = String(html).replace(/<b class="ref">([A-Z])<\/b>/g, (_, L) => {
    const i = LET.indexOf(L);
    if (!(i >= 0 && i < E.length)) throw new Error('lettre inconnue ' + L);
    return `(${E[i]})`;
  });
  s = s.replace(/<\/?mark>/g, '').replace(/<sup>2<\/sup>/g, '**2').replace(/&nbsp;/g, ' ');
  const FR = /<span class="frac"><span>([^<]*)<\/span><span>([^<]*)<\/span><\/span>/g;
  while (FR.test(s)) { FR.lastIndex = 0; s = s.replace(FR, '(($1)/($2))'); }
  s = s.replace(/×/g, '*').replace(/÷/g, '/').replace(/−/g, '-').replace(/\[/g, '(').replace(/\]/g, ')');
  if (/[^0-9+\-*/(). ]/.test(s)) throw new Error('texte non reconnu : ' + s);
  return s;
}
/** analyseur à descente récursive : + − (gauche à droite) < × ÷ (gauche à droite) < − unaire < ** */
export function calc(html, E) {
  const src = toJs(html, E).replace(/\s+/g, '');
  let i = 0;
  const peek = () => src[i];
  const num = () => { const j = i; while (/[0-9.]/.test(src[i] || '')) i++; if (j === i) throw new Error('nombre attendu : ' + src); return Number(src.slice(j, i)); };
  const prim = () => { if (peek() === '(') { i++; const v = sum(); if (src[i++] !== ')') throw new Error(') attendue'); return v; } return num(); };
  const pow = () => { const b = prim(); if (src.startsWith('**', i)) { i += 2; return b ** un(); } return b; };
  const un = () => { if (peek() === '-') { i++; return -un(); } return pow(); };
  const prod = () => { let v = un(); while (peek() === '*' || peek() === '/') { const o = src[i++]; const w = un(); v = o === '*' ? v * w : v / w; } return v; };
  function sum() { let v = prod(); while (peek() === '+' || peek() === '-') { const o = src[i++]; const w = prod(); v = o === '+' ? v + w : v - w; } return v; }
  const v = sum();
  if (i !== src.length) throw new Error('fin inattendue : ' + src);
  return v;
}
const safeCalc = (h, E) => { try { return calc(h, E); } catch (e) { return NaN; } };

/* =====================================================================
   Fabrication d'un exercice pas à pas
   ===================================================================== */
const RULE = "Rappel : d'abord les <b>parenthèses</b> (les plus intérieures), puis les <b>carrés</b>, puis <b>× et ÷</b> de gauche à droite, enfin <b>+ et −</b> de gauche à droite.";

/**
 * Nombres écrits de part et d'autre d'un opérateur (ou du trait de fraction) : le dernier nombre écrit à gauche
 * et le premier écrit à droite ; null quand une parenthèse ou un carré les sépare dans le texte.
 */
const lastLeaf = t => (t.par || t.k === 'sq' ? null : t.k === 'n' ? t : lastLeaf(t.b));
const firstLeaf = t => (t.par ? null : t.k === 'n' ? t : firstLeaf(t.a));
/** le texte affiché lit-il un faux calcul trivial (« 7/7 », « 12/1 + 3 », « 5 × 1 + 3/2 », « 14 − 14 », « 7 ÷ 7 ») ? */
function trivialText(root) {
  let bad = false;
  (function f(t) {
    if (bad || t.k === 'n') return;
    if (t.k === 'op' || t.k === 'fr') {
      const L = lastLeaf(t.a), Rt = firstLeaf(t.b);
      if (L && Rt) {
        const x = Math.abs(L.v), y = Math.abs(Rt.v), div = t.k === 'fr' || t.o === '/';
        if ((div || t.o === '*') && (x === 1 || y === 1)) bad = true;
        if ((div || t.o === '-') && x === y) bad = true;
      }
    }
    kids(t).forEach(f);
  })(root);
  return bad;
}
/** deux opérations qui s'annulent : (a × b) ÷ b, (a ÷ b) × b, (a + b) − b, (a − b) + b */
function cancels(t) {
  if (t.k !== 'op' && t.k !== 'fr') return false;
  const A = t.a, b = val(t.b);
  if (A.k !== 'op') return false;
  if ((t.k === 'fr' || t.o === '/') && A.o === '*') return val(A.a) === b || val(A.b) === b;
  if (t.o === '*' && A.o === '/') return val(A.b) === b;
  if ((t.o === '-' && A.o === '+') || (t.o === '+' && A.o === '-')) return val(A.b) === b;
  return false;
}
/** l'arbre est-il acceptable ? (résultats entiers, divisions exactes, pas de 0, pas de × 1, pas de 7/7…) */
function valid(root, steps, o) {
  if (steps.length < (o.minSteps || 2) || steps.length > (o.maxSteps || 8)) return false;
  for (const t of steps) {
    const v = t.val;
    if (!Number.isInteger(v) || v === 0 || Math.abs(v) > (o.lim || 999)) return false;
    if (!o.neg && v < 0) return false;
    if (isMul(t)) { const a = val(t.a), b = val(t.b); if (Math.abs(a) === 1 || Math.abs(b) === 1 || a === 0 || b === 0) return false; }
    if (cancels(t)) return false;
    // une division dont le quotient vaut ±1 (7 ÷ 7, (3 + 4) ÷ 7) n'apprend rien
    if ((t.k === 'fr' || t.o === '/') && Math.abs(val(t.a)) === Math.abs(val(t.b))) return false;
  }
  if (trivialText(root)) return false;
  const leaves = []; (function f(t) { if (t.k === 'n') leaves.push(t.v); kids(t).forEach(f); })(root);
  if (!o.neg && leaves.some(v => v < 0)) return false;
  if (leaves.some(v => v === 0)) return false;
  if (o.needNeg && !leaves.some(v => v < 0)) return false;
  if (o.ok && !o.ok(root, steps)) return false;
  return true;
}
/** construit un arbre valide avec make() (plusieurs essais) */
function build(make, o) {
  for (let tries = 0; tries < 3000; tries++) {
    const root = make();
    if (!root) continue;
    fixPar(root);
    const steps = run(root);
    if (valid(root, steps, o)) return { root, steps };
  }
  throw new Error('aucun exercice valide trouvé');
}

/**
 * Ordre libre. Dans l'arbre du calcul, toute opération dont les opérandes sont déjà des nombres est
 * un calcul permis à cet instant (deux parenthèses, deux produits… se font dans n'importe quel ordre).
 * On cherche (en profondeur, avec retour arrière si deux calculs donnent le même résultat) une suite
 * de calculs permis qui donne exactement les valeurs v de l'élève.
 * Renvoie {ok, other} ou {ok: false, i, ready} : i = première case impossible, ready = calculs permis alors.
 */
function freeOrder(steps, v) {
  const n = steps.length;
  let best = { i: -1, ready: [] };
  const readyAt = done => steps.filter(t => !done.has(t) && kids(t).every(c => c.k === 'n' || done.has(c)));
  (function dfs(done, i, other) {
    if (i === n) { best = { ok: true, other }; return true; }
    const ready = readyAt(done);
    if (i > best.i && !best.ok) best = { i, ready };
    for (const t of ready) {
      if (!approx(t.val, v[i])) continue;
      const d2 = new Set(done); d2.add(t);
      if (dfs(d2, i + 1, other || t !== steps[i])) return true;
    }
    return false;
  })(new Set(), 0, false);
  return best;
}
/** texte d'un calcul prêt (ses opérandes sont des nombres) */
function readyTxt(t) {
  const x = c => numTxt(val(c), false);
  if (t.k === 'sq') return `${x(t.a)}<sup>2</sup>`;
  if (t.k === 'fr') return `${numTxt(val(t.a), true)} ÷ ${x(t.b)}`;
  return `${numTxt(val(t.a), true)} ${SYM[t.o]} ${x(t.b)}`;
}

/** pièges : autres calculs « tentants » à l'étape k (autre opération prête, ou mauvais regroupement) */
function traps(root, k, target) {
  const out = [];
  const atomAt = t => t.k === 'n' || t.step < k;
  const vAt = t => val(t);
  const txt = t => R(t, k, { mode: 'ref' }, false);
  (function walk(t) {
    if (atomAt(t)) return;
    if (t !== target && kids(t).every(atomAt)) {
      const v = t.k === 'sq' ? vAt(t.a) ** 2 : t.k === 'fr' ? vAt(t.a) / vAt(t.b) : compute(t);
      out.push({ v, txt: unmark(R(t, k, { mode: 'ref' }, false)) });
    }
    if (t.k === 'op') {
      const A = t.a, Bn = t.b;
      // 10 − 3 + 2 lu comme 10 − (3 + 2) : on regroupe à droite
      if (A.k === 'op' && !A.par && atomAt(A.b) && atomAt(Bn) && !atomAt(A)) {
        const x = vAt(A.b), y = vAt(Bn), w = t.o === '+' ? x + y : t.o === '-' ? x - y : t.o === '*' ? x * y : x / y;
        out.push({ v: w, txt: `${txt(A.b)} ${SYM[t.o]} ${txt(Bn)}` });
      }
      // a + b × c lu comme (a + b) × c : on calcule de gauche à droite sans priorité
      if (Bn.k === 'op' && !Bn.par && atomAt(A) && atomAt(Bn.a) && !atomAt(Bn)) {
        const x = vAt(A), y = vAt(Bn.a), w = t.o === '+' ? x + y : t.o === '-' ? x - y : t.o === '*' ? x * y : x / y;
        out.push({ v: w, txt: `${txt(A)} ${SYM[t.o]} ${txt(Bn.a)}` });
      }
    }
    kids(t).forEach(walk);
  })(root);
  return out.filter(a => Number.isFinite(a.v));
}

/**
 * Exercice « pas à pas ».
 * o : { hl, neg, intro, hint, lim, minSteps, maxSteps, ok, needNeg, extraVerify }
 */
function stepsExo(make, o) {
  const { root, steps } = build(make, o);
  const E = steps.map(t => t.val), last = E.length - 1;
  const expr = R(root, 0, {});
  const marked = steps.map((_, k) => R(root, k, { mode: 'ref', hl: true }));
  const shown = o.hl ? marked : marked.map(unmark);
  // mode guidé (o.hl) : une ligne par étape, la partie à calculer en couleur ;
  // mode libre : l'élève choisit l'ordre, une case par calcul (tout ordre permis par les priorités est accepté)
  const tpl = o.hl
    ? shown.map((s, k) => `<div class="stepline"><span class="pn">${k + 1}</span><span class="pexp">${s}</span><span class="pres">${k < last ? ref(k) + ' =' : '='}&nbsp;{${k}}</span></div>`).join('')
    : steps.map((_, k) => `<div class="stepline"><span class="pn">${k + 1}</span><span class="pexp">${k < last ? `Résultat du calcul n° ${k + 1}` : '<b>Résultat final</b>'}</span><span class="pres">=&nbsp;{${k}}</span></div>`).join('');
  const opTxt = steps.map((t, k) => unmark(R(t, k, { mode: 'ref' }, true)));
  const trapList = steps.map((t, k) => traps(root, k, t).filter(a => !approx(a.v, E[k])));
  const base = stepsCheck(E, opTxt.map(s => `le calcul ${s}`));
  const guided = v => {
    const r = base(v);
    if (r.ok) return r;
    const i = r.bad[0], tr = trapList[i].find(a => approx(a.v, v[i]));
    let msg = `Erreur à l'étape ${i + 1}. ${i ? "Les étapes d'avant sont justes. " : ''}`;
    if (tr) msg += `Tu as calculé ${tr.txt} = ${M(v[i])} : ce n'est pas le calcul prioritaire ici. ${RULE}`;
    else msg += `Refais le calcul en couleur : ${opTxt[i]}.`;
    return { ok: false, bad: [i], msg };
  };
  const check = o.hl ? guided : v => {
    const r = freeOrder(steps, v);
    if (r.ok) return { ok: true, msg: r.other ? 'Tu as calculé dans un autre ordre que la correction : c\'est juste aussi, les deux calculs étaient permis.' : '' };
    const i = r.i;
    const can = r.ready.map(t => `${readyTxt(t)} = ${M(t.val)}`);
    let msg = `Erreur au calcul n° ${i + 1}. ${i ? 'Les calculs d\'avant sont justes. ' : ''}`;
    msg += can.length > 1 ? `À ce moment, les calculs permis étaient : ${can.join(' ou ')}.` : `À ce moment, le seul calcul permis était ${can[0]}.`;
    return { ok: false, bad: [i], msg: msg + ` ${RULE}` };
  };
  check.expected = E;
  const chain = steps.map((_, k) => R(root, k, { mode: 'val', hl: true }));
  const solution = `<div class="chain">${chain.map((s, k) => `<div>${k ? '= ' : ''}${s}</div>`).join('')}<div>= <b>${M(E[last])}</b></div></div>`;
  const howTo = o.hl
    ? `À chaque ligne, calcule la partie <mark>en couleur</mark> et écris son résultat. La lettre ${ref(0)} le remplace à la ligne suivante.`
    : `<b>Trouve toi-même</b> les calculs à faire, dans un ordre permis par les priorités, et écris le résultat de chaque calcul, un par case. Quand deux calculs sont possibles en même temps (deux parenthèses, deux produits…), commence par celui que tu veux.`;
  const q = {
    type: 'steps',
    html: `${o.intro || 'Calcule pas à pas :'}<div class="big">${expr}</div><p class="note">${howTo}</p>`,
    tpl, labels: steps.map((_, k) => `résultat de l'étape ${k + 1}`),
    keys: { neg: !!o.neg },
    check, expected: E,
    value: safeCalc(expr),
    lines: marked,
    free: !o.hl,
    /** pour les tests : valeurs d'un ordre de calcul permis tiré au hasard (rnd : fonction aléatoire dans [0 ; 1[) */
    randomOrder(rnd) {
      const done = new Set(), out = [];
      while (out.length < steps.length) {
        const ready = steps.filter(t => !done.has(t) && kids(t).every(c => c.k === 'n' || done.has(c)));
        const t = ready[Math.floor(rnd() * ready.length)]; done.add(t); out.push(t.val);
      }
      return out;
    },
    hint: o.hint + (o.hl ? '' : `<br>${RULE}`),
    solution,
    afterVisual: `<p class="note treecap">L'arbre de calcul : on part des nombres (en bas) et on remonte, dans l'ordre des lettres.</p>${treeSVG(root)}`,
    verify(Ex) {
      // 1. l'expression affichée, relue sans l'arbre, vaut le dernier résultat
      if (!approx(calc(expr), Ex[last])) return false;
      for (let k = 0; k <= last; k++) {
        if (!Number.isInteger(Ex[k])) return false;
        if (!o.neg && Ex[k] < 0) return false;
        // 2. chaque ligne (lettres remplacées par les résultats précédents) garde la même valeur
        const prev = Ex.slice(0, k);
        if (!approx(calc(marked[k], prev), Ex[last])) return false;
        // 3. la partie en couleur vaut bien le résultat attendu de l'étape
        const mk = marked[k].match(/<mark>([\s\S]*?)<\/mark>/);
        if (!mk || !approx(calc(mk[1], prev), Ex[k])) return false;
      }
      return o.extraVerify ? o.extraVerify(Ex) : true;
    },
  };
  return q;
}

/** exemple de cours : la chaîne de calcul (titre facultatif) et, sauf tree = false, son arbre */
function demo(make, title = '', tree = true) {
  const root = fixPar(make()), steps = run(root);
  const chain = steps.map((_, k) => R(root, k, { mode: 'val', hl: true }));
  return `<div class="ex chain">${title ? `<span class="q">${title}</span>` : ''}${chain.map((s, k) => `<div>${k ? '= ' : ''}${s}</div>`).join('')}<div>= <b>${M(steps[steps.length - 1].val)}</b></div></div>${tree ? treeSVG(root) : ''}`;
}

/** tire un modèle dans le palier de difficulté d (parfois dans le palier d'avant) */
const tier = (d, T) => { const t = Math.min(d, T.length - 1); return pick(T[t > 0 && chance(0.3) ? t - 1 : t]); };

/* =====================================================================
   1. × avant + et −
   ===================================================================== */
const T1 = [
  [() => add(n(1, 20), m()), () => add(m(), n(1, 20))],
  [() => sub(n(20, 90), m()), () => sub(m(), n(1, 15)), () => add(n(1, 30), m())],
  [() => sub(add(n(1, 30), m()), n(1, 9)), () => add(m(), m()), () => sub(n(30, 99), m())],
  [() => sub(add(m(12), m()), n(1, 30)), () => add(sub(n(50, 150), m(12)), m()), () => sub(m(12), m())],
];
const H1 = 'La <b>multiplication</b> passe avant l\'addition et la soustraction : cherche d\'abord le signe ×.';
function L1(d) { return stepsExo(() => tier(d, T1)(), { hl: d < 2, hint: H1 }); }
function C1() {
  return `<h2>1. La multiplication d'abord</h2>
<p class="intro">Pour que tout le monde (toi, ton voisin, la calculatrice) trouve le même résultat, on suit des <b>règles de priorité</b>. La première : la multiplication passe avant l'addition et la soustraction.</p>
<div class="def">Dans un calcul <b>sans parenthèses</b>, on effectue d'abord les <b>multiplications</b>, puis les additions et les soustractions.</div>
<div class="methode"><b>Méthode</b><ol><li>Repère les signes ×.</li><li>Calcule le produit et réécris toute la ligne avec son résultat.</li><li>Termine par les + et −, de gauche à droite.</li><li>Une ligne par étape : la partie <mark>en couleur</mark> est celle qu'on calcule.</li></ol></div>
${demo(() => add(N(7), mul(N(4), N(5))), 'Exemple 1')}
<p class="treecap">L'<b>arbre de calcul</b> montre l'ordre : le × est plus bas, il est calculé en premier (étape A), puis le + (étape B).</p>
${demo(() => sub(add(N(3), mul(N(6), N(2))), N(5)), 'Exemple 2', false)}
${demo(() => add(mul(N(4), N(3)), mul(N(2), N(5))), 'Exemple 3 : deux produits', false)}
<div class="warn">⚠️ On ne calcule pas « dans l'ordre de lecture » : 7 + 4 × 5 n'est pas 11 × 5 = 55. Le résultat est 27.<br>⚠️ Avec deux produits, on peut commencer par l'un ou par l'autre : ils passent tous deux avant le +.</div>
<div class="retenir">À retenir : × avant + et −.</div>`;
}

/* =====================================================================
   2. + et − : de gauche à droite
   ===================================================================== */
function chainAdd(d) {
  const c = d < 1 ? 3 : d < 3 ? ri(3, 4) : ri(4, 5), mx = [20, 30, 60, 100][Math.min(d, 3)];
  let ops = Array.from({ length: c - 1 }, () => pick(['+', '-']));
  if (d < 1) ops = ['-', pick(['+', '+', '-'])];
  else if (!ops.slice(0, -1).includes('-')) ops[ri(0, c - 3)] = '-';
  let t = n(Math.ceil(mx / 2), mx);
  for (const o of ops) t = op(o, t, n(1, Math.ceil(mx * 0.6)));
  return t;
}
const H2 = 'Il n\'y a que des + et des − : on calcule <b>de gauche à droite</b>, dans l\'ordre de lecture. Commence par les deux premiers nombres.';
function L2(d) { return stepsExo(() => chainAdd(d), { hl: d < 2, hint: H2 }); }
function C2() {
  return `<h2>2. Additions et soustractions : de gauche à droite</h2>
<p class="intro">Quand il n'y a que des + et des −, on calcule dans l'ordre de lecture, comme on compte son argent au fil des achats.</p>
<div class="def">Quand il n'y a que des <b>+</b> et des <b>−</b>, on calcule <b>de gauche à droite</b>.<br>Le signe écrit devant un nombre ne s'applique qu'à ce nombre.</div>
<div class="methode"><b>Méthode</b><ol><li>Calcule les deux premiers nombres.</li><li>Remplace-les par leur résultat.</li><li>Continue avec le nombre suivant, jusqu'au bout.</li></ol></div>
${demo(() => add(sub(N(10), N(3)), N(2)), 'Exemple 1')}
${demo(() => sub(sub(N(20), N(6)), N(4)), 'Exemple 2', false)}
<div class="ex"><span class="q">Exemple 3 : en euros</span><br>10 − 3 + 2, c'est « j'ai 10 €, je dépense 3 €, puis je gagne 2 € » : il me reste <b>9 €</b>.</div>
<div class="warn">⚠️ 10 − 3 + 2 n'est pas 10 − 5 : on ne commence pas par 3 + 2 ! Le signe − s'applique seulement au 3.<br>⚠️ 20 − 6 − 4 n'est pas 20 − 2 : on enlève 6, puis on enlève encore 4.</div>
<div class="retenir">À retenir : que des + et des − → de gauche à droite.</div>`;
}

/* =====================================================================
   3. × et ÷ : de gauche à droite
   ===================================================================== */
function chainMul(d) {
  if (d < 1) {
    const b = ri(2, 9), k = ri(2, 9);
    return chance(0.6) ? mul(dvd(N(b * k), N(b)), n(2, 9)) : dvd(dvd(N(b * k * pick([2, 3])), N(b)), N(pick([2, 3])));
  }
  const c = d < 3 ? ri(3, 4) : 4;
  let t = N(ri(2, 9) * ri(2, 9) * (d >= 3 ? ri(1, 3) : 1));
  for (let i = 1; i < c; i++) {
    const dv = chance(0.55) ? divBy(t) : null;
    t = dv || mul(t, n(2, d < 3 ? 6 : 9));
  }
  return t;
}
const hasDivThen = (root, steps) => steps.some((t, i) => t.k === 'op' && t.o === '/' && i < steps.length - 1);
const H3 = 'Il n\'y a que des × et des ÷ : on calcule <b>de gauche à droite</b>. Commence par les deux premiers nombres.';
function L3(d) { return stepsExo(() => chainMul(d), { hl: d < 2, hint: H3, ok: hasDivThen }); }
function C3() {
  return `<h2>3. Multiplications et divisions : de gauche à droite</h2>
<p class="intro">× et ÷ sont de la même « famille » : aucune ne passe avant l'autre, on les fait dans l'ordre de lecture.</p>
<div class="def">× et ÷ ont la <b>même priorité</b>. Quand il n'y a que des × et des ÷, on calcule <b>de gauche à droite</b>.</div>
<div class="methode"><b>Méthode</b><ol><li>Calcule les deux premiers nombres (× ou ÷).</li><li>Remplace-les par leur résultat.</li><li>Continue vers la droite.</li></ol></div>
${demo(() => mul(dvd(N(24), N(4)), N(3)), 'Exemple 1')}
${demo(() => dvd(dvd(N(36), N(6)), N(2)), 'Exemple 2', false)}
${demo(() => dvd(mul(N(5), N(6)), N(3)), 'Exemple 3', false)}
<div class="warn">⚠️ 24 ÷ 4 × 3 n'est pas 24 ÷ 12 = 2 : on fait d'abord 24 ÷ 4 = 6, puis 6 × 3 = 18.<br>⚠️ 36 ÷ 6 ÷ 2 n'est pas 36 ÷ 3 : on divise par 6, puis encore par 2.</div>
<div class="retenir">À retenir : que des × et des ÷ → de gauche à droite.</div>`;
}

/* =====================================================================
   4. Les quatre opérations (sans parenthèses)
   ===================================================================== */
const T4 = [
  [() => add(n(1, 30), quo()), () => sub(n(20, 60), quo()), () => add(quo(), m())],
  [() => sub(m(), quo()), () => add(n(1, 20), divBy(m())), () => add(quo(), m())],
  [() => sub(add(n(1, 30), m()), quo()), () => add(sub(m(), quo()), n(1, 20)), () => add(divBy(m()), n(1, 30))],
  [() => sub(add(m(), quo()), m(5)), () => add(sub(n(40, 99), divBy(m())), m()), () => sub(add(n(1, 50), divBy(m(12))), quo())],
];
const H4 = 'Repère d\'abord tous les × et ÷ : ils passent avant les + et −. Entre eux, de gauche à droite.';
function L4(d) { return stepsExo(() => tier(d, T4)(), { hl: d < 2, hint: H4, ok: (r, s) => s.some(t => t.o === '/') }); }
function C4() {
  return `<h2>4. Les quatre opérations</h2>
<p class="intro">Quand les quatre opérations sont mélangées, on combine les deux règles précédentes.</p>
<div class="def">Sans parenthèses : d'abord les <b>× et ÷</b> (de gauche à droite), ensuite les <b>+ et −</b> (de gauche à droite).</div>
<div class="methode"><b>Méthode</b><ol><li>Souligne au brouillon les « blocs » de × et ÷ : 5 + <u>6 × 4 ÷ 3</u>.</li><li>Calcule chaque bloc, de gauche à droite à l'intérieur du bloc.</li><li>Il ne reste que des + et − : de gauche à droite.</li></ol></div>
${demo(() => add(N(5), dvd(mul(N(6), N(4)), N(3))), 'Exemple 1')}
${demo(() => sub(N(30), dvd(N(12), N(3))), 'Exemple 2', false)}
${demo(() => sub(add(dvd(N(18), N(3)), mul(N(4), N(5))), N(2)), 'Exemple 3 : deux blocs', false)}
<div class="warn">⚠️ Dans 30 − 12 ÷ 3, on commence par 12 ÷ 3 = 4 : 30 − 4 = 26 (et pas 18 ÷ 3 = 6).<br>⚠️ La division est prioritaire sur le + et le −, comme la multiplication.</div>
<div class="retenir">À retenir : × et ÷ d'abord, + et − ensuite, chaque fois de gauche à droite.</div>`;
}

/* =====================================================================
   5. Parenthèses
   ===================================================================== */
const T5 = [
  [() => mul(n(2, 9), P(add(n(1, 9), n(1, 9)))), () => mul(P(add(n(1, 9), n(1, 9))), n(2, 9))],
  [() => mul(n(2, 9), P(sub(n(5, 20), n(1, 9)))), () => sub(n(20, 60), P(add(n(2, 15), n(2, 15)))), () => divBy(P(add(n(2, 30), n(2, 30))))],
  [() => mul(P(add(n(1, 9), n(1, 9))), P(sub(n(5, 15), n(1, 9)))), () => { const v = ri(2, 9), b = ri(1, 9); return dvd(N(v * ri(2, 9)), P(sub(N(v + b), N(b)))); }],
  [() => mul(P(add(n(2, 20), n(2, 20))), P(sub(n(8, 20), n(1, 9)))), () => dvd(P(add(n(10, 50), n(10, 50))), P(sub(n(5, 15), n(1, 5)))), () => sub(n(50, 99), P(sub(n(20, 50), n(1, 19))))],
];
const H5 = 'On calcule d\'abord ce qui est <b>entre parenthèses</b>, même si c\'est une addition.';
function L5(d) { return stepsExo(() => tier(d, T5)(), { hl: d < 2, hint: H5 }); }
function C5() {
  return `<h2>5. Les parenthèses</h2>
<p class="intro">Les parenthèses servent à imposer un ordre : « calcule ceci en premier ». Elles changent souvent le résultat.</p>
<div class="def">Les <b>parenthèses</b> passent avant tout : on calcule d'abord ce qu'elles contiennent, même si c'est une addition.</div>
<div class="methode"><b>Méthode</b><ol><li>Repère les parenthèses.</li><li>Calcule leur contenu et remplace la parenthèse par le résultat.</li><li>Deux parenthèses : l'ordre entre elles est libre.</li><li>Puis applique les priorités habituelles.</li></ol></div>
${demo(() => mul(N(4), P(add(N(3), N(5)))), 'Exemple 1')}
<div class="ex"><span class="q">Comparer</span><br>4 × 3 + 5 = 12 + 5 = 17, mais 4 × (3 + 5) = 4 × 8 = 32 : les parenthèses changent le résultat !</div>
${demo(() => dvd(N(36), P(sub(N(13), N(4)))), 'Exemple 2', false)}
${demo(() => mul(P(add(N(2), N(5))), P(sub(N(9), N(3)))), 'Exemple 3 : deux parenthèses', false)}
<div class="warn">⚠️ 50 − (12 + 8) = 50 − 20 = 30. Sans les parenthèses, 50 − 12 + 8 = 46 : ce n'est pas le même calcul.<br>⚠️ N'oublie pas d'enlever les parenthèses une fois leur contenu calculé.</div>
<div class="retenir">À retenir : les parenthèses d'abord.</div>`;
}

/* =====================================================================
   6. Parenthèses et priorités mêlées
   ===================================================================== */
const T6 = [
  [() => add(n(1, 20), mul(n(2, 9), P(sub(n(6, 15), n(1, 5))))), () => sub(mul(P(add(n(1, 9), n(1, 9))), n(2, 9)), n(1, 20))],
  [() => sub(n(40, 99), P(add(n(1, 9), m()))), () => add(mul(P(add(n(1, 9), n(1, 9))), n(2, 6)), m())],
  [() => add(divBy(P(sub(m(), n(1, 9)))), n(1, 20)), () => sub(mul(n(2, 9), P(add(m(), n(1, 9)))), n(1, 30)), () => mul(P(sub(n(20, 40), m(5))), P(add(n(1, 9), quo())))],
  [() => add(sub(mul(P(add(n(1, 9), n(1, 9))), n(2, 9)), quo()), n(1, 9)), () => sub(divBy(P(add(m(), m()))), n(1, 9)), () => add(mul(n(2, 9), P(sub(m(), n(1, 20)))), divBy(P(add(n(5, 30), n(5, 30)))))],
];
const H6 = 'Dans l\'ordre : les parenthèses d\'abord (et, à l\'intérieur, les priorités habituelles : × avant +), puis × et ÷, puis + et −.';
function L6(d) { return stepsExo(() => tier(d, T6)(), { hl: d < 2, hint: H6, minSteps: 3 }); }
function C6() {
  return `<h2>6. Parenthèses et priorités mêlées</h2>
<p class="intro">Voici l'ordre complet pour les calculs du collège sans puissances : il suffit d'appliquer les règles une par une.</p>
<div class="def">Ordre des calculs : 1) les <b>parenthèses</b> ; 2) les <b>× et ÷</b> ; 3) les <b>+ et −</b>. Chaque fois de gauche à droite.<br>À l'intérieur des parenthèses, on applique les mêmes règles.</div>
<div class="methode"><b>Méthode</b><ol><li>Ouvre la parenthèse : y a-t-il un × à l'intérieur ? Il passe avant le + de la parenthèse.</li><li>Quand la parenthèse est un seul nombre, enlève-la.</li><li>Puis × et ÷ ; enfin + et −.</li></ol></div>
${demo(() => sub(N(40), P(add(N(2), mul(N(3), N(6))))), 'Exemple 1')}
${demo(() => add(N(5), mul(N(2), P(sub(N(9), N(4))))), 'Exemple 2', false)}
${demo(() => sub(mul(P(add(N(3), N(5))), N(2)), mul(N(4), N(3))), 'Exemple 3', false)}
<div class="warn">⚠️ Dans 5 + 2 × (9 − 4), ne fais pas 5 + 2 = 7 ! On calcule 9 − 4 = 5, puis 2 × 5 = 10, puis 5 + 10 = 15.<br>⚠️ Dans 40 − (2 + 3 × 6), le × passe avant le + même dans la parenthèse.</div>
<div class="retenir">À retenir : parenthèses, puis × ÷, puis + −.</div>`;
}

/* =====================================================================
   7. Crochets et parenthèses imbriquées
   ===================================================================== */
const T7 = [
  [() => mul(n(2, 6), B(add(n(1, 9), mul(n(2, 5), P(sub(n(5, 12), n(1, 4))))))), () => sub(n(50, 99), B(mul(n(2, 6), P(add(n(1, 6), n(1, 6))))))],
  [() => sub(n(40, 99), B(sub(mul(n(2, 6), P(add(n(1, 9), n(1, 9)))), n(1, 9)))), () => mul(B(add(n(1, 9), mul(P(sub(n(6, 12), n(1, 5))), n(2, 5)))), n(2, 4))],
  [() => divBy(B(add(n(2, 20), mul(n(2, 6), P(sub(n(6, 15), n(1, 5)))))), 9), () => add(n(1, 20), mul(n(2, 5), B(sub(n(20, 40), P(add(n(2, 9), n(2, 9)))))))],
  [() => mul(B(add(n(1, 9), mul(P(sub(n(6, 12), n(1, 5))), n(2, 5)))), P(sub(n(8, 15), n(1, 6)))), () => sub(n(60, 99), B(sub(mul(n(2, 4), P(add(m(4), n(1, 9)))), n(1, 9)))), () => divBy(B(sub(mul(P(add(n(2, 9), n(2, 9))), n(2, 5)), P(sub(n(10, 20), n(1, 9))))))],
];
const H7 = 'Commence par les parenthèses <b>les plus intérieures</b> ( ), puis ce qui est entre crochets [ ].';
function L7(d) { return stepsExo(() => tier(d, T7)(), { hl: d < 2, hint: H7, minSteps: 3 }); }
function C7() {
  return `<h2>7. Crochets et parenthèses imbriquées</h2>
<p class="intro">Parfois une parenthèse est à l'intérieur d'une autre. Pour s'y retrouver, la grande s'écrit avec des crochets [ ].</p>
<div class="def">Quand des parenthèses sont à l'intérieur d'autres, on écrit les grandes avec des <b>crochets [ ]</b>. On commence par les parenthèses <b>les plus intérieures</b>.</div>
<div class="methode"><b>Méthode</b><ol><li>Trouve la parenthèse la plus intérieure ( ) et calcule-la.</li><li>Calcule ensuite le contenu des crochets [ ], avec les priorités (× avant +).</li><li>Termine par ce qui est à l'extérieur.</li></ol></div>
${demo(() => mul(N(3), B(add(N(2), mul(N(4), P(sub(N(7), N(2))))))), 'Exemple 1')}
<p class="treecap">Comme des poupées russes : on ouvre d'abord la plus petite.</p>
${demo(() => sub(N(50), B(mul(N(3), P(add(N(4), N(2)))))), 'Exemple 2', false)}
<div class="warn">⚠️ À l'intérieur des crochets, les priorités continuent : dans [2 + 4 × 5], on fait 4 × 5 avant le +.<br>⚠️ Ne commence pas par les crochets : d'abord la parenthèse qui est dedans.</div>
<div class="retenir">À retenir : de l'intérieur vers l'extérieur.</div>`;
}

/* =====================================================================
   8. Traits de fraction
   ===================================================================== */
const T8 = [
  [() => frac(1, 0), () => frac(0, 1)],
  [() => frac(1, 1), () => add(n(1, 20), frac(1, 0))],
  [() => frac(2, 1), () => sub(frac(1, 1), n(1, 5)), () => mul(n(2, 5), frac(1, 1))],
  [() => add(frac(1, 1), frac(1, 0)), () => frac(2, 2), () => sub(n(20, 60), mul(n(2, 4), frac(1, 1)))],
];
const H8 = 'Un trait de fraction est comme deux parenthèses : calcule d\'abord tout le <b>numérateur</b> (en haut), puis tout le <b>dénominateur</b> (en bas), et seulement ensuite la division.';
function L8(d) { return stepsExo(() => tier(d, T8)(), { hl: d < 2, hint: H8 }); }
function C8() {
  return `<h2>8. Le trait de fraction</h2>
<p class="intro">Un trait de fraction est une division qui « cache » des parenthèses : tout le haut est divisé par tout le bas.</p>
<div class="def">Le trait de fraction est une <b>division</b> ; il <b>regroupe</b> ce qui est au-dessus et ce qui est en dessous, comme des parenthèses :<br>${F('12 + 8', '7 − 2')} = (12 + 8) ÷ (7 − 2).</div>
<div class="methode"><b>Méthode</b><ol><li>Calcule tout le <b>numérateur</b> (en haut).</li><li>Calcule tout le <b>dénominateur</b> (en bas).</li><li>Fais la division.</li><li>Termine le reste du calcul avec les priorités.</li></ol></div>
${demo(() => fr(add(N(12), N(8)), sub(N(7), N(2))), 'Exemple 1')}
${demo(() => add(N(3), fr(mul(N(4), N(5)), N(2))), 'Exemple 2', false)}
<div class="warn">⚠️ On ne « simplifie » pas un morceau : dans ${F('12 + 8', '2')}, on ne divise pas seulement le 8 par 2. On calcule 12 + 8 = 20, puis 20 ÷ 2 = 10.<br>⚠️ Le trait de fraction passe avant le + qui est à côté : 3 + ${F('20', '2')} = 3 + 10.</div>
<div class="retenir">À retenir : tout le haut, tout le bas, puis la division.</div>`;
}

/* =====================================================================
   9. Carrés
   ===================================================================== */
const T9 = [
  [() => mul(n(2, 5), sq(n(2, 9))), () => sq(P(mul(n(2, 4), n(2, 5)))), () => add(n(1, 20), sq(n(2, 9)))],
  [() => sub(sq(n(4, 12)), n(1, 20)), () => sq(P(add(n(1, 6), n(1, 6)))), () => mul(n(2, 4), sq(n(2, 9)))],
  [() => add(sq(n(2, 9)), sq(n(2, 9))), () => mul(n(2, 5), sq(P(sub(n(5, 12), n(1, 4))))), () => sub(sq(P(add(n(2, 8), n(2, 8)))), m())],
  [() => divBy(sq(P(add(n(1, 9), n(1, 9))))), () => sub(sq(P(add(n(2, 9), n(2, 9)))), mul(n(2, 5), sq(n(2, 6)))), () => add(mul(n(2, 3), sq(n(2, 9))), sq(P(sub(n(6, 12), n(1, 5)))))],
];
const H9 = 'Le carré ne porte que sur ce qui est juste avant lui : un nombre seul, ou toute une parenthèse. Les carrés passent avant × et ÷ (mais après les parenthèses).';
function L9(d) { return stepsExo(() => tier(d, T9)(), { hl: d < 2, hint: H9 }); }
function C9() {
  return `<h2>9. Les carrés</h2>
<p class="intro">Le carré est une multiplication d'un nombre par lui-même. Il a sa place dans l'ordre des priorités : juste après les parenthèses.</p>
<div class="def">3<sup>2</sup> = 3 × 3 = 9. Le carré passe <b>avant</b> ×, ÷, + et −, mais <b>après</b> les parenthèses.<br>Il ne porte que sur ce qui est juste avant lui : un nombre seul, ou toute une parenthèse.</div>
<div class="methode"><b>Méthode</b><ol><li>Parenthèses d'abord (même s'il y a un carré dessus).</li><li>Puis les carrés.</li><li>Puis × et ÷, enfin + et −.</li></ol></div>
<div class="cols"><div>${demo(() => mul(N(2), sq(N(3))), 'Exemple 1 : 2 × 3<sup>2</sup>')}</div><div>${demo(() => sq(P(mul(N(2), N(3)))), 'Exemple 2 : (2 × 3)<sup>2</sup>')}</div></div>
${demo(() => add(sq(N(3)), sq(N(4))), 'Exemple 3', false)}
<div class="warn">⚠️ 2 × 3<sup>2</sup> = 2 × 9 = 18, mais (2 × 3)<sup>2</sup> = 6<sup>2</sup> = 36.<br>⚠️ 3<sup>2</sup> = 9, pas 6 ! Et 3<sup>2</sup> + 4<sup>2</sup> = 25, pas 7<sup>2</sup> = 49.</div>
<div class="retenir">À retenir : parenthèses, puis carrés, puis × ÷, puis + −.</div>`;
}

/* =====================================================================
   10. Avec des nombres relatifs
   ===================================================================== */
const r = () => N(nz(-9, 9));
const quoR = () => { const v = nz(-9, 9); return dvd(N(v * nz(-9, 9)), N(v)); };
const T10 = [
  [() => add(r(), mul(r(), r())), () => sub(r(), mul(r(), r())), () => mul(r(), P(add(r(), r())))],
  [() => sub(mul(r(), r()), mul(r(), r())), () => add(mul(P(sub(r(), r())), r()), r()), () => add(quoR(), r())],
  [() => sq(P(add(r(), r()))), () => sub(r(), sq(r())), () => mul(r(), sq(P(sub(r(), r())))), () => fr(add(r(), r()), r())],
  [() => mul(r(), B(add(r(), mul(r(), P(sub(r(), r())))))), () => sub(sq(P(add(r(), r()))), mul(r(), r())), () => fr(sub(mul(r(), r()), r()), add(r(), r()))],
];
const H10 = 'Mêmes priorités qu\'avant ; en plus, la <b>règle des signes</b> pour × et ÷ : deux signes pareils donnent +, deux signes contraires donnent −. Soustraire un nombre, c\'est ajouter son opposé.';
function L10(d) { return stepsExo(() => tier(d, T10)(), { hl: d < 2, neg: true, needNeg: true, hint: H10 }); }
function C10() {
  return `<h2>10. Avec des nombres relatifs</h2>
<p class="intro">Les priorités ne changent pas avec les nombres négatifs ; on ajoute seulement les règles de calcul des relatifs à chaque étape.</p>
<div class="def">Mêmes priorités. Règle des signes : (−) × (−) = (+) ; (−) × (+) = (−) ; pareil pour ÷.<br>Soustraire un nombre, c'est ajouter son opposé. Un nombre négatif s'écrit entre parenthèses après un signe : 5 × (−3).</div>
<div class="methode"><b>Méthode</b><ol><li>Applique les priorités comme d'habitude.</li><li>Pour chaque × ou ÷ : règle des signes.</li><li>Pour chaque + ou − : règle d'addition des relatifs.</li><li>Garde les parenthèses autour des résultats négatifs.</li></ol></div>
${demo(() => add(N(-3), mul(N(4), N(-2))), 'Exemple 1')}
${demo(() => mul(P(add(N(-5), N(2))), N(-3)), 'Exemple 2', false)}
<div class="ex"><span class="q">Exemple 3 : des carrés</span><br>(−2)<sup>2</sup> = (−2) × (−2) = <b>4</b> : le carré d'un nombre non nul est toujours positif.</div>
<div class="warn">⚠️ 6 − (−4) = 6 + 4 = 10 : soustraire un négatif, c'est ajouter son opposé.<br>⚠️ (−3) × (−3) = 9, pas −9 : même signe → positif.</div>
<div class="retenir">À retenir : mêmes priorités, plus la règle des signes.</div>`;
}

/* =====================================================================
   11. Programme de calcul → expression
   ===================================================================== */
const INSTR = {
  '+': c => `Ajoute ${c}.`, '-': c => `Soustrais ${c}.`, '*': c => `Multiplie par ${c}.`, '/': c => `Divise par ${c}.`, sq: () => 'Élève au carré.',
};
function progMake(d) {
  const cnt = d < 2 ? 3 : d < 3 ? ri(3, 4) : 4;
  const x = ri(2, d < 3 ? 9 : 15);
  const ins = []; let t = N(x), cur = x;
  for (let i = 0; i < cnt; i++) {
    let o;
    if (i === 0) o = pick(['*', '+', '-']);
    else if (ins[i - 1][0] === '+' || ins[i - 1][0] === '-') o = d >= 2 && chance(0.3) ? 'sq' : chance(0.7) ? '*' : '/';
    else o = pick(['+', '-', '+']);
    if (o === 'sq' && Math.abs(cur) > 12) o = '*';
    let c;
    if (o === '/') { const ds = divs(cur); if (!ds.length) o = '*'; else c = pick(ds); }
    if (o === '*') c = ri(2, d < 3 ? 5 : 9);
    if (o === '+') c = ri(1, d < 3 ? 9 : 20);
    if (o === '-') { if (cur < 3) { o = '+'; c = ri(1, 9); } else c = ri(1, Math.min(cur - 1, 20)); }
    if (o === 'sq') { t = sq(t); cur = cur * cur; } else { t = op(o, t, N(c)); cur = o === '+' ? cur + c : o === '-' ? cur - c : o === '*' ? cur * c : cur / c; }
    ins.push([o, c]);
  }
  t.prog = { x, ins };
  return t;
}
/** simulation du programme, instruction par instruction (indépendante de l'arbre) */
const simulate = ({ x, ins }) => ins.map(([o, c]) => (x = o === '+' ? x + c : o === '-' ? x - c : o === '*' ? x * c : o === '/' ? x / c : x * x));
const needsPar = root => R(root, 0, {}).includes('(');
function progHtml(p) {
  return `<ol class="prog"><li>Choisis le nombre <b>${p.x}</b>.</li>${p.ins.map(([o, c]) => `<li>${INSTR[o](c)}</li>`).join('')}</ol>`;
}
/** expression « dans un autre ordre » ou « sans parenthèses » : distracteurs */
function progTree(x, ins) {
  let t = N(x);
  for (const [o, c] of ins) t = o === 'sq' ? sq(t) : op(o, t, N(c));
  return fixPar(t);
}
const H11 = 'Chaque instruction s\'applique à <b>tout le résultat précédent</b> : s\'il y avait une addition ou une soustraction avant un ×, un ÷ ou un carré, il faut des <b>parenthèses</b>.';
function L11(d) {
  const asChoice = d >= 2 ? chance(0.65) : d >= 1 ? chance(0.4) : false;
  if (!asChoice) {
    let prog;
    const q = stepsExo(() => { const t = progMake(d); prog = t.prog; return t; },
      { hl: d < 1, hint: H11, ok: needsPar, extraVerify: E => approx(simulate(prog).slice(-1)[0], E.slice(-1)[0]) });
    q.html = `Voici un programme de calcul :${progHtml(prog)}Il se traduit par l'expression ci-dessous. Calcule-la pas à pas :` + q.html.replace(/^Calcule pas à pas :/, '');
    return q;
  }
  for (let tries = 0; tries < 500; tries++) {
    const t = progMake(d), p = t.prog;
    fixPar(t);
    const steps = run(t);
    if (!valid(t, steps, { minSteps: 3, ok: needsPar })) continue;
    const good = R(t, 0, {}), goodV = simulate(p).slice(-1)[0];
    const rev = [...p.ins].reverse(), sw = [p.ins[1], p.ins[0], ...p.ins.slice(2)];
    const cands = [
      { l: R(t, 0, { nopar: true }), why: 'nopar' },
      { l: R(progTree(p.x, sw), 0, {}), why: 'ordre' },
      { l: R(progTree(p.x, rev), 0, {}), why: 'ordre' },
      { l: R(progTree(p.x, sw), 0, { nopar: true }), why: 'ordre' },
    ];
    const seen = new Set([good]), vals = [goodV], ds = [];
    for (const c of cands) {
      const v = safeCalc(c.l);
      if (seen.has(c.l) || !Number.isFinite(v) || vals.some(w => approx(w, v))) continue;
      seen.add(c.l); vals.push(v); ds.push(c);
    }
    if (ds.length < 2) continue;
    const opts = shuffle([{ l: good, why: 'ok' }, ...ds.slice(0, 3)]).map((o, i) => ({ v: 'abcd'[i], l: o.l, why: o.why }));
    const E = opts.find(o => o.why === 'ok').v;
    const chain = steps.map((_, k) => R(t, k, { mode: 'val', hl: true }));
    return {
      type: 'choice',
      html: `Voici un programme de calcul :${progHtml(p)}Quelle expression donne le résultat de ce programme ?`,
      opts: opts.map(({ v, l }) => ({ v, l })),
      check: choiceCheck(E, { msg: c => (opts.find(o => o.v === c) || {}).why === 'nopar' ? 'Les bons nombres dans le bon ordre… mais sans parenthèses, les priorités changent l\'ordre des calculs !' : '' }),
      expected: E,
      hint: H11,
      solution: `On applique les instructions une par une à tout le résultat : ${good}.<div class="chain">${chain.map((s, k) => `<div>${k ? '= ' : ''}${s}</div>`).join('')}<div>= <b>${M(goodV)}</b></div></div>`,
      afterVisual: treeSVG(t),
      verify(Ex) {
        // l'option choisie, relue par l'analyseur, donne le résultat du programme simulé ; les autres non
        const sims = simulate(p);
        if (!opts.every(o => Number.isFinite(safeCalc(o.l)))) return false;
        return opts.every(o => (o.v === Ex) === approx(calc(o.l), sims.slice(-1)[0]));
      },
    };
  }
  throw new Error('programme introuvable');
}
function C11() {
  return `<h2>11. Programme de calcul → expression</h2>
<p class="intro">Un programme de calcul donne des instructions l'une après l'autre. Pour l'écrire en une seule ligne, il faut parfois ajouter des parenthèses.</p>
<div class="def">Un <b>programme de calcul</b> applique chaque instruction à <b>tout le résultat précédent</b>. Pour l'écrire en une seule expression, on met des <b>parenthèses</b> quand une instruction × ou ÷ suit un + ou un −, et avant « élève au carré » dès que l'expression n'est pas un nombre seul.</div>
<div class="methode"><b>Méthode</b><ol><li>Écris le nombre choisi.</li><li>Pour chaque instruction, applique-la à <b>tout</b> ce que tu as écrit.</li><li>× ou ÷ : mets l'expression entre parenthèses si elle contient un + ou un − hors parenthèses. Carré : mets-la entre parenthèses si ce n'est pas un nombre seul.</li><li>Vérifie en suivant le programme étape par étape.</li></ol></div>
<div class="ex"><span class="q">Exemple 1</span><ol class="prog"><li>Choisis 5.</li><li>Ajoute 3.</li><li>Multiplie par 4.</li></ol>→ (5 + 3) × 4. Sans parenthèses, 5 + 3 × 4 = 17 : ce n'est pas le programme !</div>
${demo(() => mul(P(add(N(5), N(3))), N(4)))}
<div class="ex"><span class="q">Exemple 2</span><ol class="prog"><li>Choisis 4.</li><li>Soustrais 1.</li><li>Élève au carré.</li><li>Ajoute 5.</li></ol>→ (4 − 1)<sup>2</sup> + 5.</div>
${demo(() => add(sq(P(sub(N(4), N(1)))), N(5)), '', false)}
<div class="warn">⚠️ « Choisis 5, multiplie par 2, puis ajoute 7 » donne 5 × 2 + 7 : ici pas besoin de parenthèses, le × passe déjà en premier.<br>⚠️ « Choisis 4, soustrais 1, élève au carré » : 4 − 1<sup>2</sup> = 3, mais (4 − 1)<sup>2</sup> = 9.<br>⚠️ « Choisis 5, multiplie par 2, élève au carré » : (5 × 2)<sup>2</sup> = 100, mais 5 × 2<sup>2</sup> = 20.</div>
<div class="retenir">À retenir : chaque instruction porte sur tout le résultat d'avant → parenthèses si besoin.</div>`;
}

/* =====================================================================
   12. Défis
   ===================================================================== */
const T12 = [
  () => tier(3, T6)(), () => tier(3, T7)(), () => tier(3, T8)(), () => tier(3, T9)(),
  () => add(mul(n(2, 4), B(sub(sq(n(3, 9)), mul(n(2, 5), P(add(n(1, 4), n(1, 4))))))), frac(1, 0)),
  () => sub(frac(2, 1), sq(P(sub(n(5, 9), n(1, 4))))),
];
const T12R = [() => tier(2, T10)(), () => tier(3, T10)(), () => sub(mul(r(), B(add(r(), sq(r())))), fr(add(r(), r()), r()))];
const H12 = 'Prends ton temps : repère les parenthèses et les traits de fraction, puis les carrés, puis × ÷, puis + −.';
function L12(d) {
  const rel = d >= 2 && chance(0.4);
  return stepsExo(() => (rel ? pick(T12R) : pick(T12))(), { hl: false, neg: rel, needNeg: rel, hint: H12, minSteps: 4, lim: 2000 });
}
function C12() {
  return `<h2>12. Défis</h2>
<p class="intro">Tout ce qu'on a vu, mélangé. Ici, c'est à toi de trouver le calcul prioritaire à chaque ligne.</p>
<div class="def">L'ordre complet :<br>1) parenthèses et crochets (les plus intérieurs d'abord), numérateur et dénominateur ;<br>2) carrés ;<br>3) × et ÷ de gauche à droite ;<br>4) + et − de gauche à droite.</div>
<div class="methode"><b>Méthode</b><ol><li>Repère les « groupes » : parenthèses, crochets, traits de fraction.</li><li>Dans chaque groupe, applique l'ordre complet.</li><li>Quand deux calculs sont possibles en même temps, choisis celui que tu veux.</li><li>Une ligne par étape au brouillon.</li></ol></div>
${demo(() => sub(fr(add(N(9), mul(N(3), N(5))), sub(N(7), N(3))), sq(P(sub(N(4), N(2))))), 'Exemple 1')}
${demo(() => sub(mul(N(-2), B(add(N(3), sq(N(-1))))), fr(add(N(-6), N(2)), N(-2))), 'Exemple 2 : avec des relatifs', false)}
<div class="warn">⚠️ Écris une ligne par étape et recopie bien tout ce qui n'a pas encore été calculé.<br>⚠️ (−1)<sup>2</sup> = 1 : le carré porte sur toute la parenthèse, signe compris.</div>
<div class="retenir">À retenir : groupes, carrés, × ÷, + − : toujours dans cet ordre.</div>`;
}


// Après 2 réussites, les exercices passent en « trouve toi-même les calculs » : chaque cours en montre un exemple
// (retour d'élève 2026-11-18 : les cours doivent ressembler aux exercices).
const LIBRE = {
  1: ['30 + 4 × 9 − 4', ['4 × 9 = 36', '30 + 36 = 66'], '66 − 4 = 62'],
  2: ['20 − 7 + 5 − 3', ['20 − 7 = 13', '13 + 5 = 18'], '18 − 3 = 15'],
  3: ['48 ÷ 6 × 2 ÷ 4', ['48 ÷ 6 = 8', '8 × 2 = 16'], '16 ÷ 4 = 4'],
  4: ['6 × 5 − 12 ÷ 3', ['6 × 5 = 30', '12 ÷ 3 = 4'], '30 − 4 = 26'],
  5: ['40 ÷ (13 − 5)', ['13 − 5 = 8'], '40 ÷ 8 = 5'],
  6: ['3 × (2 × 4 + 1) − 5', ['2 × 4 = 8', '8 + 1 = 9', '3 × 9 = 27'], '27 − 5 = 22'],
  7: ['2 + 3 × [10 − (1 + 4)]', ['1 + 4 = 5', '10 − 5 = 5', '3 × 5 = 15'], '2 + 15 = 17'],
  8: ['(18 + 6) ÷ (2 × 4), écrit avec un trait de fraction', ['18 + 6 = 24 (le haut)', '2 × 4 = 8 (le bas)'], '24 ÷ 8 = 3'],
  9: ['5 + 3<sup>2</sup> × 2', ['3<sup>2</sup> = 9', '9 × 2 = 18'], '5 + 18 = 23'],
  10: ['−3 + (−2) × 5 − 4', ['(−2) × 5 = −10', '−3 + (−10) = −13'], '−13 − 4 = −17'],
  11: ['le programme « Choisis 3. Ajoute 2. Multiplie par 4. Soustrais 5. », écrit (3 + 2) × 4 − 5', ['3 + 2 = 5', '5 × 4 = 20'], '20 − 5 = 15'],
};
const libre = n => {
  const [e, etapes, fin] = LIBRE[n];
  return `<h3>Quand l'exercice dit « Trouve toi-même les calculs »</h3>
<p>Après deux réussites, les calculs ne sont plus mis en couleur : c'est toi qui choisis le calcul à faire à chaque ligne, en respectant les priorités. Écris le résultat de chaque calcul dans sa case, dans l'ordre où tu les fais.</p>
<div class="ex"><span class="q">Exemple : ${e}</span><br>${etapes.map((t, i) => `Calcul n° ${i + 1} : ${t}`).join('<br>')}<br>Résultat final : <b>${fin}</b></div>`;
};

export const LEVELS = [
  { titre: '× avant + et −', generate: L1, cours: () => C1() + libre(1), classe: '5e' },
  { titre: '+ et − : de gauche à droite', generate: L2, cours: () => C2() + libre(2), classe: '5e' },
  { titre: '× et ÷ : de gauche à droite', generate: L3, cours: () => C3() + libre(3), classe: '5e' },
  { titre: 'Les quatre opérations', generate: L4, cours: () => C4() + libre(4), classe: '5e' },
  { titre: 'Parenthèses', generate: L5, cours: () => C5() + libre(5), classe: '5e' },
  { titre: 'Parenthèses et priorités mêlées', generate: L6, cours: () => C6() + libre(6), classe: '5e' },
  { titre: 'Crochets, parenthèses imbriquées', generate: L7, cours: () => C7() + libre(7), classe: '5e / 4e' },
  { titre: 'Traits de fraction', generate: L8, cours: () => C8() + libre(8), classe: '4e' },
  { titre: 'Carrés', generate: L9, cours: () => C9() + libre(9), classe: '4e' },
  { titre: 'Avec des nombres relatifs', generate: L10, cours: () => C10() + libre(10), classe: '4e' },
  { titre: 'Programme de calcul → expression', generate: L11, cours: () => C11() + libre(11), classe: '4e' },
  { titre: 'Défis', generate: L12, cours: C12, classe: '4e' },
];
export const OPTIONS = { need: 4, keys: { neg: false } };

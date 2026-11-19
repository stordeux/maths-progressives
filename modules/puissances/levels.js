// Puissances (4e – 3e) : 12 niveaux, du produit répété à l'écriture scientifique.
// Une difficulté nouvelle par niveau ; dans un niveau, les paramètres s'élargissent avec d.
// Vérifications indépendantes : `value` recalculé avec Math.pow / Math.log10 à partir des données
// affichées, `verify` pour l'écriture scientifique (a × 10ⁿ égal au nombre et 1 ≤ a < 10) et les exposants.
import { ri, pick, chance } from '../../engine/util/rand.js';
import { r6, approx, gcd } from '../../engine/util/arith.js';
import { M, F } from '../../engine/util/fmt.js';
import { numsCheck, fracCheck, choiceCheck } from '../../engine/answers/checks.js';
import { bulles, chaine, numeration, virgule, piege, echelle, U } from './draw.js';

/* ---------- outils ---------- */
const big = s => `<div class="big">${s}</div>`;
const sp = n => `<sup>${M(n)}</sup>`;
/** base affichée : entre parenthèses si négative */
const B = a => (typeof a === 'string' ? a : a < 0 ? `(${M(a)})` : M(a));
const pw = (a, n) => `${B(a)}${sp(n)}`;
/** case surélevée (exposant) dans un gabarit */
const EXP = i => `<span style="margin:0 0 44px -6px;font-size:.85em">{${i}}</span>`;
/** égalité relative (nombres très grands ou très petits) */
const rel = (x, y) => (y === 0 ? x === 0 : Math.abs(x - y) <= 1e-9 * Math.abs(y));
/** produit répété par une boucle (calcul de la réponse ; la vérification utilise Math.pow) */
const prod = (a, n) => { let p = 1; for (let i = 0; i < n; i++) p *= a; return r6(p); };
const pair = n => n % 2 === 0;
/** écart relatif u − v (0 si égaux aux erreurs d'arrondi près) : signe de la comparaison */
const relDiff = (u, v) => { const s = Math.max(Math.abs(u), Math.abs(v)); return Math.abs(u - v) <= 1e-9 * s ? 0 : (u - v) / s; };
const rangs = n => `${n} rang${n > 1 ? 's' : ''}`;

/** écriture décimale exacte de m × 10^e (m entier ≥ 0), avec un point : decStr(45, -3) = '0.045' */
function decStr(m, e) {
  let s = String(m);
  if (e >= 0) return m === 0 ? '0' : s + '0'.repeat(e);
  const k = -e;
  s = s.padStart(k + 1, '0');
  s = s.slice(0, s.length - k) + '.' + s.slice(s.length - k);
  return s.replace(/0+$/, '').replace(/\.$/, '');
}
/** affichage français groupé par 3 : '1234567.0001' → '1 234 567,000 1' */
function grp(s) {
  const [i, f] = s.split('.');
  const gi = i.replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
  return f ? gi + ',' + f.replace(/(\d{3})(?=\d)/g, '$1 ') : gi;
}
/** écriture scientifique exacte de m × 10^e (m entier > 0) : [a, n] */
function sciNorm(m, e) {
  let s = String(m);
  const t = s.replace(/0+$/, '');
  e += s.length - t.length; s = t;
  return [Number(s[0] + (s.length > 1 ? '.' + s.slice(1) : '')), e + s.length - 1];
}
const sciH = (a, n) => `${M(a)} × 10${sp(n)}`;
const intLen = s => s.split('.')[0].length;
const decLen = s => (s.split('.')[1] || '').length;

/** ajoute des messages « presque juste » à une fabrique de check */
function withMsg(base, f) {
  const c = v => { const r = base(v); if (r.ok || r.msg) return r; const m = f(v); return m ? { ...r, msg: m } : r; };
  c.expected = base.expected;
  return c;
}

/** check de l'écriture scientifique de m × 10^e ; extra(v) : message ciblé supplémentaire */
function sciCheck(m, e, extra) {
  const [A, N] = sciNorm(m, e), x = m * Math.pow(10, e);
  const c = v => {
    const [a, n] = v;
    if (approx(a, A) && n === N) return { ok: true };
    if (a !== 0 && rel(a * Math.pow(10, n), x)) return { ok: false, bad: [0, 1], msg: `C'est bien égal au nombre… mais ce n'est pas l'écriture scientifique : a doit vérifier <b>1 ≤ a &lt; 10</b>.` };
    const ex = extra && extra(v);
    if (ex) return { ok: false, bad: [1], msg: ex };
    if (approx(a, A)) return { ok: false, bad: [1], msg: n === -N ? `a est juste, mais revois le <b>signe</b> de l'exposant : un nombre ≥ 10 a un exposant positif, un nombre &lt; 1 un exposant négatif.` : `a est juste ! Revois l'exposant : compte de combien de rangs la virgule se déplace.` };
    if (n === N) return { ok: false, bad: [0], msg: `L'exposant est juste ! Revois les chiffres de a.` };
    if (a >= 10 || a < 1) return { ok: false, bad: [0, 1], msg: `Rappel : en écriture scientifique, <b>1 ≤ a &lt; 10</b>.` };
    return { ok: false, bad: [0, 1] };
  };
  c.expected = [A, N];
  return c;
}
const SCI_TPL = `{0} <span>× 10</span>${EXP(1)}`;
const SCI_LAB = ['a (entre 1 et 10)', 'exposant n'];
/** vérification indépendante d'une écriture scientifique */
const sciVerify = x => E => E[0] >= 1 && E[0] < 10 && rel(E[0] * Math.pow(10, E[1]), x);

/* ---------- 1. produit répété → puissance ---------- */
function L1(d) {
  const n = d < 1 ? ri(2, 4) : d < 2 ? ri(2, 6) : ri(3, 9);
  const a = d < 3 ? ri(2, 9) : pick([2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 0.5, 1.5, 0.1]);
  const both = d >= 2 && chance(.5);
  const facts = Array(n).fill(a), prodS = facts.map(x => M(x)).join(' × ');
  const value = prodS.split('×').length; // recompte des facteurs dans le texte affiché
  const cnt = `Tu as peut-être compté les signes × : il y en a un de moins que de facteurs. Compte les nombres ${M(a)}.`;
  const afterVisual = bulles([{ groups: [{ n, t: M(a) }] }], { caption: `${n} facteurs égaux à ${M(a)} : ${M(a)}${U(n)}` });
  const common = {
    type: 'nums', value, afterVisual,
    hint: `L'exposant est le <b>nombre de facteurs</b> : compte combien de fois ${M(a)} est écrit dans le produit.`,
    solution: `Il y a ${n} facteurs égaux à ${M(a)}, donc ${prodS} = ${pw(a, n)}.<br>La base est ${M(a)}, l'exposant est ${n}.`,
  };
  if (!both) {
    return { ...common, html: `Écris ce produit sous la forme d'une <b>puissance</b> (complète l'exposant) :${big(prodS)}`,
      tpl: `${M(a)}${EXP(0)}`, labels: ['exposant'],
      check: numsCheck([n], { msg: v => (v[0] === n - 1 ? cnt : '') }) };
  }
  return { ...common, html: `Écris ce produit sous la forme d'une <b>puissance</b> (la base, puis l'exposant) :${big(prodS)}`,
    tpl: `{0}${EXP(1)}`, labels: ['base', 'exposant'],
    check: numsCheck([a, n], { msg: v => (v[0] === n && v[1] === a ? `Tu as inversé : la <b>base</b> est le nombre répété (${M(a)}), l'<b>exposant</b> compte les facteurs.` : approx(v[0], a) && v[1] === n - 1 ? cnt : '') }),
    verify: E => rel(Math.pow(E[0], E[1]), facts.reduce((p, x) => p * x, 1)) };
}
function C1() {
  return `<h2>1. Une puissance, c'est un produit répété</h2>
<p class="intro">Quand on multiplie plusieurs fois le même nombre, on l'écrit en plus court avec une <b>puissance</b>. C'est très utile pour les très grands et les très petits nombres.</p>
<div class="cols">
<div class="def">Pour un nombre a et un entier n ≥ 1 :<br><b>a<sup>n</sup> = a × a × … × a</b> (n facteurs).<br>a est la <b>base</b>, n est l'<b>exposant</b>. On lit « a puissance n ».</div>
${bulles([{ groups: [{ n: 5, t: '3' }] }], { caption: '5 facteurs égaux à 3 : 3⁵' })}
</div>
<div class="methode"><b>Méthode</b><ol>
<li>Repère le nombre qui se répète : c'est la <b>base</b>.</li>
<li>Compte combien de fois il est écrit : c'est l'<b>exposant</b>.</li>
<li>Écris la base, puis l'exposant en petit, en haut à droite.</li></ol></div>
<div class="ex"><span class="q">Exemple 1 : écris 7 × 7 × 7 × 7 en puissance.</span><br>Le nombre 7 est écrit 4 fois : 7 × 7 × 7 × 7 = <b>7<sup>4</sup></b>. La base est 7, l'exposant est 4.</div>
<div class="cols">
<div class="ex"><span class="q">Exemple 2 : écris 0,5 × 0,5 × 0,5 en puissance.</span><br>La base peut être un nombre décimal : 0,5 est écrit 3 fois, donc c'est <b>0,5<sup>3</sup></b>.<br>Cas particuliers : 7 × 7 = 7<sup>2</sup> se lit « 7 au carré », 4 × 4 × 4 = 4<sup>3</sup> se lit « 4 au cube », et a<sup>1</sup> = a.</div>
${bulles([{ groups: [{ n: 3, t: '0,5' }] }], { caption: '3 facteurs égaux à 0,5 : 0,5³' })}
</div>
<div class="warn">⚠️ On compte les <b>facteurs</b>, pas les signes × : dans 3 × 3 × 3 × 3, il y a 3 signes × mais 4 facteurs. C'est 3<sup>4</sup>.<br>⚠️ Ne mélange pas base et exposant : 2 × 2 × 2 = 2<sup>3</sup>, et pas 3<sup>2</sup>.<br>⚠️ 3 + 3 + 3 + 3 = 3 × 4 = 12, mais 3 × 3 × 3 × 3 = 3<sup>4</sup> = 81.</div>
<div class="retenir">À retenir : l'exposant compte le nombre de facteurs égaux à la base.</div>`;
}

/* ---------- 2. calculer a^n : carrés, cubes… ---------- */
function L2(d) {
  let a, n;
  if (d < 1) { if (chance(.6)) { a = ri(2, 10); n = 2; } else { a = ri(2, 5); n = 3; } }
  else if (d < 2) { if (chance(.5)) { a = ri(2, 15); n = 2; } else { a = ri(2, 10); n = 3; } }
  else if (d < 3) { if (chance(.7)) { a = pick([2, 3]); n = a === 2 ? ri(4, 7) : ri(4, 6); } else { a = pick([4, 5]); n = 4; } }
  else {
    const v = ri(0, 3);
    if (v === 0) { a = 2; n = ri(7, 10); }
    else if (v === 1) { a = pick([0.5, 0.1, 0.2, 0.3, 1.5, 1.2]); n = a === 0.5 || a === 0.1 ? ri(2, 3) : 2; }
    else if (v === 2) { a = pick([0, 1]); n = ri(3, 9); }
    else { a = ri(5, 9); n = 3; }
  }
  const X = prod(a, n), facts = Array(n).fill(M(a)).join(' × ');
  const items = [], ops = [];
  for (let k = 1; k <= n; k++) { items.push({ top: `${M(a)}${U(k)}`, val: M(prod(a, k)) }); if (k < n) ops.push(`× ${M(a)}`); }
  return {
    type: 'nums', html: `Calcule :${big(pw(a, n))}`, tpl: `<span>${pw(a, n)} =</span> {0}`,
    check: numsCheck([X], { msg: v => {
      const x = v[0];
      if (approx(x, r6(a * n))) return `⚠️ ${pw(a, n)} ne veut pas dire ${M(a)} × ${n} : c'est ${M(a)} multiplié par <b>lui-même</b>, ${n} fois.`;
      if (n >= 2 && (approx(x, prod(a, n - 1)) || approx(x, prod(a, n + 1)))) return `Presque : il faut exactement <b>${n} facteurs</b> égaux à ${M(a)}. Recompte.`;
      if (Number.isInteger(a) && a >= 2 && approx(x, prod(n, a))) return `Tu as inversé la base et l'exposant : ici c'est ${M(a)} qui est répété.`;
      return '';
    } }),
    value: Math.pow(a, n),
    hint: `${pw(a, n)} = ${facts}. Multiplie pas à pas : ${M(a)}, puis × ${M(a)}, puis encore × ${M(a)}…`,
    solution: `${pw(a, n)} = ${facts} = <b>${M(X)}</b><br>Pas à pas : ${items.map(i => i.val).join(' → ')}`,
    afterVisual: chaine(items, ops, `${n} facteurs égaux à ${M(a)}`),
  };
}
function C2() {
  const it = [1, 2, 3, 4].map(k => ({ top: `2${U(k)}`, val: String(2 ** k) }));
  return `<h2>2. Calculer une puissance</h2>
<p class="intro">Pour trouver la valeur d'une puissance, on fait les multiplications une par une. Avec un peu d'entraînement, tu connaîtras les plus courantes par cœur.</p>
<div class="def">a<sup>2</sup> = a × a se lit « a <b>au carré</b> » ; a<sup>3</sup> = a × a × a se lit « a <b>au cube</b> ».<br>Pour tout n ≥ 1 : <b>1<sup>n</sup> = 1</b> et <b>0<sup>n</sup> = 0</b>.</div>
${chaine(it, ['× 2', '× 2', '× 2'], 'chaque fois, on multiplie encore par 2', 4)}
<div class="methode"><b>Méthode</b><ol>
<li>Écris le produit : a<sup>n</sup> = a × a × … (n facteurs).</li>
<li>Multiplie pas à pas : a, puis × a, puis encore × a…</li>
<li>Arrête-toi quand tu as utilisé <b>exactement n facteurs</b>.</li></ol></div>
<div class="ex"><span class="q">Exemple 1 : calcule 3<sup>4</sup>.</span><br>3<sup>4</sup> = 3 × 3 × 3 × 3. Pas à pas : 3 → 9 → 27 → <b>81</b>.</div>
<div class="ex"><span class="q">Exemple 2 : calcule 0,1<sup>3</sup> et 1,5<sup>2</sup>.</span><br>0,1<sup>3</sup> = 0,1 × 0,1 × 0,1 = 0,01 × 0,1 = <b>0,001</b> (le nombre rapetisse : 0,1 est plus petit que 1).<br>1,5<sup>2</sup> = 1,5 × 1,5 = <b>2,25</b>.</div>
<p>À connaître : les carrés de 1 à 12 (1, 4, 9, 16, 25, 36, 49, 64, 81, 100, 121, 144), les cubes 1, 8, 27, 64, 125 et les puissances de 2 : 2, 4, 8, 16, 32, 64, 128, 256, 512, 1 024.</p>
<div class="warn">⚠️ 2<sup>3</sup> n'est pas 2 × 3 = 6 : 2<sup>3</sup> = 2 × 2 × 2 = <b>8</b>.<br>⚠️ N'inverse pas : 2<sup>5</sup> = 32, mais 5<sup>2</sup> = 25.<br>⚠️ 0,1<sup>3</sup> = 0,001, et pas 0,3.</div>
<div class="retenir">À retenir : a<sup>n</sup>, c'est a multiplié par lui-même, avec n facteurs en tout.</div>`;
}

/* ---------- 3. base négative ---------- */
function L3(d) {
  let a, n;
  if (d < 1) { a = -ri(2, 5); n = ri(2, 3); }
  else if (d < 2) { if (chance(.6)) { a = -ri(2, 9); n = ri(2, 3); } else { a = -ri(2, 3); n = ri(4, 5); } }
  else if (d < 3) { a = -pick([2, 3, 4, 5]); n = a === -2 ? ri(4, 7) : a === -3 ? ri(4, 6) : 4; }
  else {
    const v = ri(0, 2);
    if (v === 0) { a = -1; n = ri(10, 99); }
    else if (v === 1) { a = -10; n = ri(2, 6); }
    else { a = -pick([0.5, 0.1, 0.2]); n = ri(2, 3); }
  }
  const X = prod(a, n), sg = pair(n) ? 'positif' : 'négatif';
  const items = [], ops = [], show = Math.min(n, 5);
  for (let k = 1; k <= show; k++) { const v = prod(a, k); items.push({ top: `(${M(a)})${U(k)}`, val: M(v), c: v < 0 ? '#ffe3e3' : '#d3f9d8' }); if (k < show) ops.push(`× (${M(a)})`); }
  return {
    type: 'nums', html: `Calcule :${big(pw(a, n))}`, tpl: `<span>${pw(a, n)} =</span> {0}`,
    check: numsCheck([X], { msg: v => {
      const x = v[0];
      if (approx(x, -X)) return `La valeur est bonne… mais revois le <b>signe</b> : l'exposant ${n} est ${pair(n) ? 'pair' : 'impair'}, donc le résultat est ${sg}.`;
      if (approx(x, r6(a * n))) return `⚠️ ${pw(a, n)} n'est pas ${M(a)} × ${n} : c'est ${M(a)} multiplié par lui-même ${n} fois.`;
      return '';
    } }),
    value: Math.pow(a, n),
    hint: `Calcule d'abord ${pw(-a, n)} = ${M(prod(-a, n))}, puis le signe : un nombre <b>pair</b> de facteurs négatifs donne un résultat positif, un nombre <b>impair</b> un résultat négatif.`,
    solution: `${pw(a, n)}${n <= 6 ? ` = ${Array(n).fill(B(a)).join(' × ')}` : ''} : il y a ${n} facteurs négatifs, ${n} est ${pair(n) ? 'pair' : 'impair'}, donc le résultat est ${sg}.<br>${pw(-a, n)} = ${M(prod(-a, n))}, donc ${pw(a, n)} = <b>${M(X)}</b>.`,
    afterVisual: chaine(items, ops, n > show ? `le signe change à chaque facteur… jusqu'à ${n} : ${pair(n) ? 'pair → +' : 'impair → −'}` : `le signe change à chaque facteur`),
  };
}
function C3() {
  const it = [1, 2, 3, 4].map(k => { const v = (-2) ** k; return { top: `(−2)${U(k)}`, val: M(v), c: v < 0 ? '#ffe3e3' : '#d3f9d8' }; });
  return `<h2>3. Puissances d'un nombre négatif</h2>
<p class="intro">La base peut être négative. Le calcul est le même, il faut juste bien trouver le <b>signe</b> du résultat.</p>
<div class="def">On applique la règle des signes à chaque multiplication :<br>• exposant <b>pair</b> → résultat <b>positif</b> ;<br>• exposant <b>impair</b> → résultat <b>négatif</b>.<br>Par exemple, (−1)<sup>n</sup> vaut 1 si n est pair et −1 si n est impair.</div>
${chaine(it, ['× (−2)', '× (−2)', '× (−2)'], 'le signe change à chaque facteur', 4)}
<div class="methode"><b>Méthode</b><ol>
<li>Calcule la puissance <b>sans le signe</b> : pour (−3)<sup>3</sup>, calcule 3<sup>3</sup> = 27.</li>
<li>Regarde l'exposant : pair ou impair ?</li>
<li>Pair → résultat positif ; impair → résultat négatif.</li></ol></div>
<div class="ex"><span class="q">Exemple 1 : calcule (−3)<sup>2</sup> et (−3)<sup>3</sup>.</span><br>(−3)<sup>2</sup> = (−3) × (−3) = <b>9</b> (exposant 2 pair).<br>(−3)<sup>3</sup> = (−3) × (−3) × (−3) = 9 × (−3) = <b>−27</b> (exposant 3 impair).</div>
<div class="ex"><span class="q">Exemple 2 : calcule (−1)<sup>37</sup>, (−10)<sup>4</sup> et (−0,5)<sup>3</sup>.</span><br>• 37 est impair, donc (−1)<sup>37</sup> = <b>−1</b> (inutile de faire 37 multiplications !).<br>• 10<sup>4</sup> = 10 000 et 4 est pair, donc (−10)<sup>4</sup> = <b>10 000</b>.<br>• 0,5<sup>3</sup> = 0,125 et 3 est impair, donc (−0,5)<sup>3</sup> = <b>−0,125</b>.</div>
<div class="warn">⚠️ (−2)<sup>4</sup> = 16 est <b>positif</b> : 4 facteurs négatifs, c'est un nombre pair de « moins ».<br>⚠️ (−2)<sup>3</sup> n'est pas (−2) × 3 = −6 : c'est (−2) × (−2) × (−2) = −8.</div>
<div class="retenir">À retenir : base négative et exposant pair → positif ; exposant impair → négatif.</div>`;
}

/* ---------- 4. le piège −a^n et (−a)^n ---------- */
function L4(d) {
  const a = d < 1 ? ri(2, 9) : ri(2, 6);
  const n = d < 1 ? 2 : d < 2 ? ri(2, 3) : ri(2, 4);
  const forms = d < 2 ? [0, 1] : [0, 1, 2];
  const term = (f, b, m) => f === 0 ? { h: `−${b}${sp(m)}`, x: -prod(b, m), v: -Math.pow(b, m) }
    : f === 1 ? { h: `(−${b})${sp(m)}`, x: prod(-b, m), v: Math.pow(-b, m) }
      : { h: `−(−${b})${sp(m)}`, x: -prod(-b, m), v: -Math.pow(-b, m) };
  if (d >= 3 && chance(.5)) { // deux termes
    const b = ri(2, 5), m = ri(2, 3), t1 = term(pick([0, 1]), a, 2), t2 = pick([0, 1]);
    const t2h = t2 === 0 ? `${b}${sp(m)}` : `(−${b})${sp(m)}`, t2x = t2 === 0 ? prod(b, m) : prod(-b, m), t2v = t2 === 0 ? Math.pow(b, m) : Math.pow(-b, m);
    const plus = chance(.5), X = r6(t1.x + (plus ? 1 : -1) * t2x);
    return {
      type: 'nums', html: `Calcule (attention aux parenthèses !) :${big(`${t1.h} ${plus ? '+' : '−'} ${t2h}`)}`, tpl: 'Réponse : {0}',
      check: numsCheck([X], { msg: v => (approx(v[0], -X) ? 'Revois les signes : regarde pour chaque puissance si le « − » est dans la parenthèse ou non.' : '') }),
      value: t1.v + (plus ? 1 : -1) * t2v,
      hint: `Calcule chaque puissance séparément. Sans parenthèses, l'exposant ne porte que sur le nombre ; avec (−${b}), il porte aussi sur le signe.`,
      solution: `${t1.h} = ${M(t1.x)} et ${t2h} = ${M(t2x)}.<br>Donc ${t1.h} ${plus ? '+' : '−'} ${t2h} = ${M(t1.x)} ${plus ? '+' : '−'} ${t2x < 0 ? `(${M(t2x)})` : M(t2x)} = <b>${M(X)}</b>.`,
    };
  }
  const f = pick(forms), t = term(f, a, n);
  const msg = f === 0 ? `⚠️ Sans parenthèses, l'exposant ne porte que sur ${a} : −${a}${sp(n)} = −(${Array(n).fill(a).join(' × ')}) = ${M(t.x)}.`
    : f === 1 ? `Avec les parenthèses, l'exposant porte sur −${a} : ${n} facteurs négatifs, ${n} est ${pair(n) ? 'pair' : 'impair'}.`
      : `Calcule d'abord (−${a})${sp(n)} = ${M(prod(-a, n))}, puis prends son <b>opposé</b>.`;
  return {
    type: 'nums', html: `Calcule :${big(t.h)}`, tpl: `<span>${t.h} =</span> {0}`,
    check: numsCheck([t.x], { msg: v => (approx(v[0], -t.x) ? msg : '') }),
    value: t.v,
    hint: f === 0 ? `Pas de parenthèses : −${a}${sp(n)} = −(${a}${sp(n)}). L'exposant ne touche que ${a}.` : f === 1 ? `Les parenthèses sont là : on multiplie (−${a}) par lui-même ${n} fois.` : `D'abord la puissance (−${a})${sp(n)}, ensuite le « − » de devant.`,
    solution: f === 0 ? `−${a}${sp(n)} = −(${Array(n).fill(a).join(' × ')}) = −${prod(a, n)} = <b>${M(t.x)}</b>` : f === 1 ? `(−${a})${sp(n)} = ${Array(n).fill(`(−${a})`).join(' × ')} = <b>${M(t.x)}</b>` : `(−${a})${sp(n)} = ${M(prod(-a, n))}, donc −(−${a})${sp(n)} = <b>${M(t.x)}</b>`,
    afterVisual: piege(a, n),
  };
}
function C4() {
  return `<h2>4. Le piège : −3² et (−3)²</h2>
<p class="intro">Ces deux écritures se ressemblent beaucoup, mais elles ne donnent pas le même résultat. Tout dépend des <b>parenthèses</b>.</p>
<div class="def">L'exposant porte <b>seulement</b> sur ce qui est juste avant lui :<br>• −a<sup>n</sup> = −(a<sup>n</sup>) : on calcule a<sup>n</sup>, puis on prend l'<b>opposé</b> ;<br>• (−a)<sup>n</sup> : les parenthèses font porter l'exposant sur −a.</div>
${piege(3, 2)}
<div class="methode"><b>Méthode</b><ol>
<li>Regarde ce qui est juste avant l'exposant : un nombre seul ou une parenthèse ?</li>
<li>Sans parenthèses : calcule a<sup>n</sup>, puis mets le « − » devant.</li>
<li>Avec parenthèses : calcule (−a)<sup>n</sup> avec la règle des signes (pair ou impair).</li>
<li>S'il y a plusieurs termes, calcule chaque puissance à part, puis additionne ou soustrais.</li></ol></div>
<div class="ex"><span class="q">Exemple 1 : calcule −5<sup>2</sup> et (−5)<sup>2</sup>.</span><br>−5<sup>2</sup> = −(5 × 5) = <b>−25</b> &nbsp; mais &nbsp; (−5)<sup>2</sup> = (−5) × (−5) = <b>25</b>.</div>
<div class="ex"><span class="q">Exemple 2 : calcule −4<sup>2</sup> + (−2)<sup>3</sup>, puis −(−2)<sup>4</sup>.</span><br>• −4<sup>2</sup> = −16 et (−2)<sup>3</sup> = −8, donc −4<sup>2</sup> + (−2)<sup>3</sup> = −16 + (−8) = <b>−24</b>.<br>• (−2)<sup>4</sup> = 16, puis on prend l'opposé : −(−2)<sup>4</sup> = <b>−16</b>.<br>Remarque : −2<sup>3</sup> = −8 et (−2)<sup>3</sup> = −8, c'est pareil ici car l'exposant 3 est impair.</div>
<div class="warn">⚠️ −3<sup>2</sup> = <b>−9</b>, pas 9. La calculatrice le sait : tape les parenthèses si tu veux (−3)<sup>2</sup>.<br>⚠️ Quand tu trouves le bon nombre mais pas le bon signe, c'est presque toujours ce piège.</div>
<div class="retenir">À retenir : pas de parenthèses, pas de signe dans la puissance : −a<sup>n</sup> = −(a<sup>n</sup>).</div>`;
}

/* ---------- 5. puissances de 10 (exposant positif) ---------- */
const MOTS = { 2: 'cent', 3: 'mille', 4: 'dix mille', 5: 'cent mille', 6: 'un million', 9: 'un milliard', 12: 'mille milliards' };
function L5(d) {
  const askExp = d >= 1 && chance(.5);
  if (!askExp) {
    const n = ri(1, d < 1 ? 3 : d < 2 ? 5 : 6), X = prod(10, n);
    return {
      type: 'nums', html: `Écris en écriture décimale :${big(pw(10, n))}`, tpl: `<span>${pw(10, n)} =</span> {0}`,
      check: numsCheck([X], { msg: v => {
        if (v[0] === 10 * n && n > 1) return `⚠️ ${pw(10, n)} n'est pas 10 × ${n} : c'est 1 suivi de <b>${n} zéros</b>.`;
        if (v[0] === X * 10 || v[0] === X / 10) return `Compte les zéros : ${pw(10, n)} s'écrit 1 suivi d'exactement <b>${n}</b> zéro${n > 1 ? 's' : ''}.`;
        return '';
      } }),
      value: Math.pow(10, n),
      hint: `10<sup>n</sup> s'écrit avec un 1 suivi de n zéros.`,
      solution: `${pw(10, n)} = ${Array(n).fill(10).join(' × ')} = <b>${grp(String(X))}</b> (1 suivi de ${n} zéro${n > 1 ? 's' : ''}).`,
      afterVisual: numeration([{ s: String(X), l: `10${U(n)}`, c: '#6741d9' }], { hi: Math.max(n, 3), lo: 0, note: `le 1 est dans la colonne 10${U(n)}` }),
    };
  }
  const words = d >= 3 && chance(.4);
  const n = words ? pick([2, 3, 4, 5, 6, 9, 12]) : ri(1, d < 2 ? 6 : d < 3 ? 9 : 12);
  const raw = decStr(1, n), shown = words ? MOTS[n] : grp(raw);
  return {
    type: 'nums', html: `Complète :${big(`${shown} = 10<sup>?</sup>`)}`, tpl: `<span>${shown} = 10</span>${EXP(0)}`, labels: ['exposant'],
    check: numsCheck([n], { msg: v => (v[0] === n + 1 ? `Tu as compté tous les chiffres : l'exposant est le nombre de <b>zéros</b> après le 1.` : v[0] === n - 1 ? `Recompte les zéros : il y en a ${n > 1 ? 'plus' : 'un'}.` : '') }),
    value: Math.log10(Number(raw)),
    hint: words ? `Écris d'abord ce nombre en chiffres, puis compte les zéros après le 1.` : `Compte les zéros après le 1 : c'est l'exposant.`,
    solution: `${shown} = ${grp(raw)} : un 1 suivi de ${n} zéro${n > 1 ? 's' : ''}, donc ${shown} = <b>${pw(10, n)}</b>.`,
    afterVisual: n <= 6 ? numeration([{ s: raw, l: '', c: '#6741d9' }], { hi: Math.max(n, 3), lo: 0, note: `le 1 est dans la colonne 10${U(n)}` }) : '',
  };
}
function C5() {
  return `<h2>5. Puissances de 10</h2>
<p class="intro">Les puissances de 10 servent à écrire vite les grands nombres : un million, un milliard… C'est la base de l'écriture scientifique.</p>
<div class="def">Pour n ≥ 1 : <b>10<sup>n</sup> = 1 suivi de n zéros</b>.<br>10<sup>1</sup> = 10 ; 10<sup>2</sup> = 100 (cent) ; 10<sup>3</sup> = 1 000 (mille) ; 10<sup>6</sup> = 1 000 000 (un million) ; 10<sup>9</sup> (un milliard) ; 10<sup>12</sup> (mille milliards).</div>
${numeration([{ s: '100', l: '10²' }, { s: '1000', l: '10³' }, { s: '1000000', l: '10⁶' }], { hi: 6, lo: 0, note: "l'exposant donne la colonne du 1" })}
<div class="methode"><b>Méthode</b><ol>
<li>Pour écrire 10<sup>n</sup> : écris un 1, puis <b>n zéros</b>.</li>
<li>Pour trouver l'exposant d'un nombre comme 100 000 : compte les <b>zéros après le 1</b>.</li>
<li>Si le nombre est écrit en lettres, écris-le d'abord en chiffres.</li></ol></div>
<div class="ex"><span class="q">Exemple 1 : écris 10<sup>5</sup> en écriture décimale.</span><br>Un 1 suivi de 5 zéros : 10<sup>5</sup> = <b>100 000</b> (cent mille).</div>
<div class="ex"><span class="q">Exemple 2 : un milliard = 10<sup>?</sup></span><br>Un milliard = 1 000 000 000 : il y a 9 zéros après le 1, donc un milliard = <b>10<sup>9</sup></b>.<br>Astuce : les espaces groupent les zéros par 3. Trois groupes de 3 zéros, cela fait 9.</div>
<div class="warn">⚠️ 10<sup>3</sup> n'est pas 10 × 3 = 30 : c'est 10 × 10 × 10 = 1 000.<br>⚠️ On compte les <b>zéros</b>, pas tous les chiffres : 10 000 a 5 chiffres mais 4 zéros, donc 10 000 = 10<sup>4</sup>.</div>
<div class="retenir">À retenir : 10<sup>n</sup> s'écrit avec un 1 suivi de n zéros.</div>`;
}

/* ---------- 6. puissances de 10 (exposant négatif) ---------- */
const MOTS_N = { 1: 'un dixième', 2: 'un centième', 3: 'un millième', 6: 'un millionième', 9: 'un milliardième' };
function L6(d) {
  const v = d < 1 ? 0 : d < 2 ? ri(0, 1) : d < 3 ? ri(0, 2) : ri(0, 3);
  if (v === 0) {
    const n = ri(1, 3), X = Number(decStr(1, -n));
    return {
      type: 'nums', html: `Écris en écriture décimale :${big(pw(10, -n))}`, tpl: `<span>${pw(10, -n)} =</span> {0}`,
      check: numsCheck([X], { msg: w => {
        const x = w[0];
        if (x < 0) return `⚠️ ${pw(10, -n)} n'est pas négatif ! L'exposant négatif veut dire « 1 divisé par 10${sp(n)} » : c'est un petit nombre positif.`;
        if (x >= 1) return `L'exposant est négatif : le nombre est <b>plus petit que 1</b>. ${pw(10, -n)} = 1 ÷ 10${sp(n)}.`;
        if (approx(x, X * 10) || approx(x, X / 10)) return `Presque : dans ${pw(10, -n)}, le 1 est au <b>${n}<sup>e</sup> rang</b> après la virgule.`;
        return '';
      } }),
      value: Math.pow(10, -n),
      hint: `${pw(10, -n)} = 1 ÷ 10${sp(n)} : la virgule part de 1 et recule de ${rangs(n)}. Il y a ${n} chiffre${n > 1 ? 's' : ''} après la virgule.`,
      solution: `${pw(10, -n)} = ${F(1, pw(10, n))} = ${F(1, grp(decStr(1, n)))} = <b>${M(X)}</b> (${n} chiffre${n > 1 ? 's' : ''} après la virgule, le dernier est le 1).`,
      afterVisual: numeration([{ s: decStr(1, -n), l: `10${U(-n)}`, c: '#6741d9' }], { hi: 1, lo: -Math.max(n, 3), note: `le 1 est dans la colonne 10${U(-n)}` }),
    };
  }
  if (v === 2) {
    const n = ri(1, 6), X = prod(10, n);
    return {
      type: 'nums', html: `Complète :${big(`${pw(10, -n)} = ${F(1, '?')}`)}`, tpl: `<span>${pw(10, -n)} =</span> ${F('1', '{0}')}`, labels: ['dénominateur'],
      check: numsCheck([X], { msg: w => (w[0] < 0 ? `Le dénominateur est positif : ${pw(10, -n)} = ${F(1, pw(10, n))}.` : (w[0] === X * 10 || w[0] === X / 10) ? `Presque : il faut 10${sp(n)}, c'est-à-dire ${n} zéro${n > 1 ? 's' : ''}.` : '') }),
      value: 1 / Math.pow(10, -n),
      hint: `Un exposant négatif donne l'<b>inverse</b> : 10${sp(-n)} = ${F(1, `10${sp(n)}`)}.`,
      solution: `${pw(10, -n)} = ${F(1, pw(10, n))} = ${F(1, `<b>${grp(String(X))}</b>`)}`,
    };
  }
  const words = v === 3;
  const n = words ? pick([1, 2, 3, 6, 9]) : ri(1, d < 2 ? 6 : 9);
  const raw = decStr(1, -n), shown = words ? MOTS_N[n] : grp(raw);
  return {
    type: 'nums', html: `Complète :${big(`${shown} = 10<sup>?</sup>`)}`, tpl: `<span>${shown} = 10</span>${EXP(0)}`, labels: ['exposant'],
    check: numsCheck([-n], { msg: w => {
      if (w[0] === n) return `Le nombre est plus petit que 1 : l'exposant est <b>négatif</b>.`;
      if (w[0] === -(n - 1) && n > 1) return `Tu as compté les zéros : compte plutôt les <b>chiffres après la virgule</b> (le 1 compris).`;
      return '';
    } }),
    value: Math.log10(Number(raw)),
    hint: words ? `Écris-le d'abord en écriture décimale, puis compte les chiffres après la virgule.` : `Compte les chiffres après la virgule, le 1 compris : c'est l'exposant, avec un signe −.`,
    solution: `${shown} = ${grp(raw)} : le 1 est au ${n}<sup>e</sup> rang après la virgule, donc ${shown} = <b>${pw(10, -n)}</b>.`,
    afterVisual: n <= 6 ? numeration([{ s: raw, l: '', c: '#6741d9' }], { hi: 0, lo: -Math.max(n, 3), note: `le 1 est dans la colonne 10${U(-n)}` }) : '',
  };
}
function C6() {
  return `<h2>6. Puissances de 10 à exposant négatif</h2>
<p class="intro">Les exposants négatifs servent à écrire les petits nombres : un dixième, un millième, un millionième…</p>
<div class="def">Pour n ≥ 1 : <b>10<sup>−n</sup> = ${F(1, '10<sup>n</sup>')}</b> = 0,0…01, avec <b>n chiffres après la virgule</b> (le dernier est le 1).<br>10<sup>−1</sup> = 0,1 (un dixième) ; 10<sup>−2</sup> = 0,01 (un centième) ; 10<sup>−3</sup> = 0,001 (un millième) ; 10<sup>−6</sup> (un millionième).</div>
${numeration([{ s: '0.1', l: '10⁻¹' }, { s: '0.01', l: '10⁻²' }, { s: '0.001', l: '10⁻³' }, { s: '0.0001', l: '10⁻⁴' }], { hi: 0, lo: -4, note: 'dixièmes, centièmes, millièmes…' })}
<div class="methode"><b>Méthode</b><ol>
<li>Pour écrire 10<sup>−n</sup> : écris « 0, » puis des zéros, en plaçant le 1 au <b>n<sup>e</sup> rang</b> après la virgule.</li>
<li>Pour trouver l'exposant de 0,000 1 : compte les <b>chiffres après la virgule</b>, le 1 compris, et mets un signe −.</li>
<li>Pour l'écrire en fraction : 10<sup>−n</sup> = ${F(1, '10<sup>n</sup>')}.</li></ol></div>
<div class="ex"><span class="q">Exemple 1 : écris 10<sup>−4</sup> en écriture décimale.</span><br>Le 1 est au 4<sup>e</sup> rang après la virgule : 10<sup>−4</sup> = <b>0,000 1</b> = ${F(1, '10 000')}.</div>
<div class="ex"><span class="q">Exemple 2 : un millionième = 10<sup>?</sup></span><br>Un millionième = ${F(1, '1 000 000')} = 0,000 001. Il y a 6 chiffres après la virgule (5 zéros puis le 1), donc un millionième = <b>10<sup>−6</sup></b>.</div>
<div class="warn">⚠️ 10<sup>−2</sup> n'est <b>pas</b> −100 ni −20 : c'est 0,01, un petit nombre <b>positif</b>.<br>⚠️ Dans 0,001, il y a 2 zéros après la virgule, mais 3 chiffres : 0,001 = 10<sup>−3</sup>.</div>
<div class="retenir">À retenir : 10<sup>−n</sup> = ${F(1, '10<sup>n</sup>')}, avec n chiffres après la virgule.</div>`;
}

/* ---------- 7. multiplier ou diviser par 10^n ---------- */
function L7(d) {
  for (;;) {
    // 0 : entier × 10^n ; 1 : décimal × 10^n ; 2 : ÷ 10^n ; 3 : × 10^−n ; 4 : ÷ 10^−n
    const kind = d < 1 ? 0 : d < 2 ? ri(0, 1) : d < 3 ? ri(1, 2) : d < 4 ? ri(1, 3) : ri(1, 4);
    const k = kind === 0 ? 0 : kind === 2 ? ri(0, 2) : ri(1, 3);
    let m = kind === 0 ? ri(2, 99) : ri(11, 9999);
    if (k > 0 && m % 10 === 0) m += 1;
    const n = ri(1, d < 3 ? 3 : 4);
    const s = kind === 0 || kind === 1 || kind === 4 ? n : -n; // décalage effectif
    const op = kind === 2 || kind === 4 ? '÷' : '×', ex = kind >= 3 ? -n : n;
    const xs = decStr(m, -k), rs = decStr(m, s - k);
    if (decLen(rs) > 3 || intLen(rs) + decLen(rs) > 7 || decLen(xs) > 3) continue;
    if (intLen(xs) > 4) continue;
    const x = Number(xs), X = Number(rs), dir = s > 0 ? 'droite' : 'gauche';
    const hi = Math.max(intLen(xs), intLen(rs), 3) - 1, lo = -Math.max(decLen(xs), decLen(rs), 1);
    const H = `${grp(xs)} ${op} 10${sp(ex)}`;
    const ruleH = kind === 3 ? `Multiplier par 10${sp(-n)}, c'est <b>diviser</b> par 10${sp(n)}. ` : kind === 4 ? `Diviser par 10${sp(-n)}, c'est <b>multiplier</b> par 10${sp(n)}. ` : '';
    return {
      type: 'nums', html: `Calcule :${big(H)}`, tpl: `<span>${H} =</span> {0}`,
      check: numsCheck([X], { msg: v => {
        if (approx(v[0], r6(x * Math.pow(10, -s)))) return `Tu as déplacé la virgule dans le <b>mauvais sens</b> : ici le nombre doit devenir plus ${s > 0 ? 'grand' : 'petit'}.`;
        if (approx(v[0], r6(x * Math.pow(10, s + 1))) || approx(v[0], r6(x * Math.pow(10, s - 1)))) return `Bon sens ! Mais la virgule doit bouger d'exactement <b>${rangs(n)}</b>.`;
        return '';
      } }),
      value: r6(op === '×' ? x * Math.pow(10, ex) : x / Math.pow(10, ex)), // recalcul en flottants, arrondi propre
      hint: `${ruleH}La virgule se déplace de ${rangs(n)} vers la <b>${dir}</b> (on ajoute des zéros si besoin).`,
      solution: `${ruleH}${H} = <b>${grp(rs)}</b> : la virgule se déplace de ${rangs(n)} vers la ${dir}.`,
      visual: numeration([{ s: xs, l: 'nombre' }], { hi, lo }),
      afterVisual: numeration([{ s: xs, l: 'nombre' }, { s: rs, l: 'résultat', c: '#6741d9' }], { hi, lo, note: `chaque chiffre glisse de ${rangs(n)} vers la ${dir === 'droite' ? 'gauche' : 'droite'}` }), // la virgule et les chiffres vont en sens contraires
      replaceVisual: true,
    };
  }
}
function C7() {
  return `<h2>7. Multiplier ou diviser par 10<sup>n</sup></h2>
<p class="intro">Multiplier par 10, 100, 1 000… revient à déplacer la virgule. Avec les puissances de 10, c'est le même principe, quel que soit l'exposant.</p>
<div class="def">•&nbsp;×&nbsp;10<sup>n</sup> : la virgule se déplace de n rangs vers la <b>droite</b> (le nombre grandit) ;<br>• ÷ 10<sup>n</sup> : la virgule se déplace de n rangs vers la <b>gauche</b> (le nombre rapetisse) ;<br>•&nbsp;×&nbsp;10<sup>−n</sup>, c'est ÷ 10<sup>n</sup> ; et ÷ 10<sup>−n</sup>, c'est&nbsp;×&nbsp;10<sup>n</sup>.</div>
${numeration([{ s: '3.45', l: 'nombre' }, { s: '345', l: '× 10²', c: '#6741d9' }, { s: '0.0345', l: '× 10⁻²', c: '#c2255c' }], { hi: 2, lo: -4, note: 'les chiffres glissent dans le tableau' })}
<div class="methode"><b>Méthode</b><ol>
<li>Ramène-toi à&nbsp;×&nbsp;10<sup>n</sup> ou ÷ 10<sup>n</sup> avec n positif (× 10<sup>−2</sup> devient ÷ 10<sup>2</sup>).</li>
<li>Prévois le sens : le résultat doit-il être plus grand ou plus petit ?</li>
<li>Déplace la virgule d'exactement n rangs, en ajoutant des zéros si besoin.</li></ol></div>
<div class="ex"><span class="q">Exemple 1 : calcule 0,72&nbsp;×&nbsp;10<sup>3</sup> et 47 ÷ 10<sup>3</sup>.</span><br>•&nbsp;×&nbsp;10<sup>3</sup> : virgule de 3 rangs vers la droite, on ajoute un zéro : 0,72&nbsp;×&nbsp;10<sup>3</sup> = <b>720</b>.<br>• ÷ 10<sup>3</sup> : virgule de 3 rangs vers la gauche : 47 ÷ 10<sup>3</sup> = <b>0,047</b>.</div>
<div class="ex"><span class="q">Exemple 2 : calcule 3,8&nbsp;×&nbsp;10<sup>−2</sup> et 5,6 ÷ 10<sup>−2</sup>.</span><br>• Multiplier par 10<sup>−2</sup>, c'est diviser par 10<sup>2</sup> : 3,8&nbsp;×&nbsp;10<sup>−2</sup> = <b>0,038</b>.<br>• Diviser par 10<sup>−2</sup>, c'est multiplier par 10<sup>2</sup> : 5,6 ÷ 10<sup>−2</sup> = <b>560</b>.</div>
<div class="warn">⚠️ Vérifie le sens : multiplier par 10<sup>3</sup> donne un nombre plus <b>grand</b>, multiplier par 10<sup>−3</sup> un nombre plus <b>petit</b>.<br>⚠️ Compte bien les rangs : la virgule bouge d'exactement n rangs, ni plus ni moins.</div>
<div class="retenir">À retenir :&nbsp;×&nbsp;10<sup>n</sup> → virgule vers la droite ; ÷ 10<sup>n</sup> ou&nbsp;×&nbsp;10<sup>−n</sup> → virgule vers la gauche.</div>`;
}

/* ---------- 8. écriture scientifique ---------- */
function L8(d) {
  // 0 : grand nombre, 1 chiffre significatif ; 1 : grand nombre, 2 ou 3 chiffres ; 2 : nombre < 1 ;
  // 3 : décimal ≥ 1 ; 4 : « g × 10^p » avec g hors de [1 ; 10[
  const kind = d < 1 ? 0 : d < 2 ? ri(0, 1) : d < 3 ? ri(1, 2) : d < 4 ? ri(1, 3) : ri(1, 4);
  const nz = (lo, hi) => { let m; do { m = ri(lo, hi); } while (m % 10 === 0); return m; };
  let m, e;
  if (kind === 4) {
    const f = pick([0, 1, -2, -3]), g = f === 0 ? nz(11, 99) : f === 1 ? ri(2, 9) : nz(1, 99), p = ri(-6, 8);
    m = g; e = f + p;
    const gs = decStr(g, f), H = `${grp(gs)} × 10${sp(p)}`, [A, N] = sciNorm(m, e), q = N - p;
    return {
      type: 'nums', html: `Écris en <b>écriture scientifique</b> :${big(H)}`, tpl: SCI_TPL, labels: SCI_LAB,
      check: sciCheck(m, e), verify: sciVerify(Number(gs) * Math.pow(10, p)),
      hint: `${grp(gs)} n'est pas entre 1 et 10. Écris d'abord ${grp(gs)} = ${M(A)} × 10<sup>…</sup>, puis additionne les exposants.`,
      solution: `${grp(gs)} = ${sciH(A, q)}, donc ${H} = ${M(A)} × 10${sp(q)} × 10${sp(p)} = <b>${sciH(A, N)}</b>.`,
    };
  }
  if (kind === 0) { m = ri(2, 9); e = ri(2, d < 1 ? 5 : 8); }
  else if (kind === 1) { m = chance(.5) ? nz(11, 99) : nz(101, 999); e = ri(1, 6); }
  else if (kind === 2) { m = chance(.4) ? ri(2, 9) : nz(11, 999); e = -(String(m).length + ri(0, 5)); }
  else { m = nz(11, 9999); e = -ri(1, String(m).length - 1); }
  const raw = decStr(m, e), [A, N] = sciNorm(m, e);
  return {
    type: 'nums', html: `Écris ce nombre en <b>écriture scientifique</b> a × 10<sup>n</sup> (avec 1 ≤ a &lt; 10) :${big(grp(raw))}`,
    tpl: SCI_TPL, labels: SCI_LAB, check: sciCheck(m, e), verify: sciVerify(Number(raw)),
    hint: `Place la virgule juste après le <b>premier chiffre non nul</b> : tu obtiens a. Puis compte de combien de rangs la virgule a bougé : c'est n (positif si le nombre est ≥ 10, négatif s'il est &lt; 1).`,
    solution: `${grp(raw)} = <b>${sciH(A, N)}</b> : ${N === 0 ? 'le nombre est déjà entre 1 et 10, donc n = 0' : `la virgule se déplace de ${rangs(Math.abs(N))} ${N > 0 ? 'vers la gauche ; le nombre est ≥ 10 : exposant positif' : 'vers la droite ; le nombre est &lt; 1 : exposant négatif'}`}.`,
    afterVisual: virgule(raw),
  };
}
function C8() {
  return `<h2>8. Écriture scientifique</h2>
<p class="intro">Les scientifiques écrivent tous les nombres de la même façon : un nombre entre 1 et 10, multiplié par une puissance de 10. On voit tout de suite si le nombre est grand ou petit.</p>
<div class="def">L'<b>écriture scientifique</b> d'un nombre positif est <b>a&nbsp;×&nbsp;10<sup>n</sup></b> avec <b>1 ≤ a &lt; 10</b> (un seul chiffre non nul avant la virgule) et n entier relatif.</div>
<div class="methode"><b>Méthode</b><ol>
<li>Place la virgule juste après le <b>premier chiffre non nul</b> : tu obtiens a (enlève les zéros inutiles).</li>
<li>Compte de combien de rangs la virgule a bougé : c'est la valeur de n.</li>
<li>Nombre ≥ 10 → n positif ; nombre &lt; 1 → n négatif ; nombre entre 1 et 10 → n = 0.</li></ol></div>
<div class="ex"><span class="q">Exemple 1 : écris 45 000 en écriture scientifique.</span><br>a = 4,5. La virgule recule de 4 rangs, et 45 000 ≥ 10 : 45 000 = <b>4,5&nbsp;×&nbsp;10<sup>4</sup></b>.</div>
<div class="ex"><span class="q">Exemple 2 : écris 0,003 2 en écriture scientifique.</span><br>a = 3,2. La virgule avance de 3 rangs, et 0,003 2 &lt; 1 : 0,003 2 = <b>3,2&nbsp;×&nbsp;10<sup>−3</sup></b>.</div>
<div class="cols">${virgule('45000')}${virgule('0.0032')}</div>
<div class="ex"><span class="q">Exemple 3 : écris 0,06&nbsp;×&nbsp;10<sup>5</sup> en écriture scientifique.</span><br>0,06 n'est pas entre 1 et 10. On l'écrit d'abord 0,06 = 6&nbsp;×&nbsp;10<sup>−2</sup>, puis on additionne les exposants : 6&nbsp;×&nbsp;10<sup>−2</sup>&nbsp;×&nbsp;10<sup>5</sup> = <b>6&nbsp;×&nbsp;10<sup>3</sup></b>.</div>
<div class="warn">⚠️ 45&nbsp;×&nbsp;10<sup>3</sup> et 0,45&nbsp;×&nbsp;10<sup>5</sup> sont égaux à 45 000, mais ce ne sont <b>pas</b> des écritures scientifiques : 45 et 0,45 ne sont pas entre 1 et 10.<br>⚠️ Attention au signe de l'exposant : un nombre plus petit que 1 a un exposant <b>négatif</b>.</div>
<div class="retenir">À retenir : a&nbsp;×&nbsp;10<sup>n</sup> avec un seul chiffre non nul avant la virgule de a.</div>`;
}

/* ---------- 9. a^0 et a^−n ---------- */
function L9(d) {
  const kind = d < 1 ? (chance(.3) ? 0 : 1) : d < 2 ? pick([0, 1, 2, 2]) : d < 3 ? ri(1, 3) : ri(0, 4);
  if (kind === 0) {
    const a = ri(2, 15), f = d >= 3 ? ri(0, 2) : 0; // 0 : a^0 ; 1 : (−a)^0 ; 2 : −a^0
    const h = f === 0 ? `${a}<sup>0</sup>` : f === 1 ? `(−${a})<sup>0</sup>` : `−${a}<sup>0</sup>`, X = f === 2 ? -1 : 1;
    return {
      type: 'nums', html: `Calcule :${big(h)}`, tpl: `<span>${h} =</span> {0}`,
      check: numsCheck([X], { msg: v => (v[0] === 0 ? `⚠️ Un nombre (non nul) à la puissance 0 ne vaut pas 0 : il vaut <b>1</b>.` : v[0] === a || v[0] === -a ? `${a}<sup>0</sup> n'est pas ${a} (c'est ${a}<sup>1</sup> qui vaut ${a}).` : v[0] === -X ? (f === 2 ? `Sans parenthèses, l'exposant ne porte que sur ${a} : −${a}<sup>0</sup> = −(${a}<sup>0</sup>) = −1.` : `Avec les parenthèses, (−${a})<sup>0</sup> = 1, comme tout nombre non nul à la puissance 0.`) : '') }),
      value: f === 2 ? -Math.pow(a, 0) : Math.pow(f === 1 ? -a : a, 0),
      hint: `Pour tout nombre a non nul, a<sup>0</sup> = 1. ${f === 2 ? 'Attention au « − » devant, sans parenthèses.' : ''}`,
      solution: f === 2 ? `${a}<sup>0</sup> = 1, donc −${a}<sup>0</sup> = <b>−1</b>.` : `${h} = <b>1</b> : tout nombre non nul à la puissance 0 vaut 1 (par exemple ${a}<sup>2</sup> ÷ ${a}<sup>2</sup> = 1 = ${a}<sup>2 − 2</sup>).`,
    };
  }
  let a, n, N, D, h, val, p, q;
  if (kind === 4) { // (p/q)^−n
    do { p = ri(2, 5); q = ri(2, 7); } while (gcd(p, q) !== 1);
    n = ri(1, 2); N = prod(q, n); D = prod(p, n); h = `(${F(p, q)})${sp(-n)}`; val = Math.pow(p / q, -n);
  } else {
    if (kind === 1) { a = ri(2, 12); n = 1; }
    else if (kind === 2) { if (chance(.4)) { a = 10; n = ri(1, 6); } else { a = ri(2, 5); n = ri(2, a === 2 ? 5 : 3); } }
    else { a = -ri(2, 5); n = ri(1, 3); }
    const P = prod(Math.abs(a), n); N = a < 0 && !pair(n) ? -1 : 1; D = P;
    h = pw(a, -n); val = Math.pow(a, -n);
  }
  const fc = fracCheck(N, D);
  const check = withMsg(fc, v => {
    const [x, y] = v;
    if (x * D === -N * y) return kind === 3 ? `Revois le <b>signe</b> : la base est négative et l'exposant ${n} est ${pair(n) ? 'pair → résultat positif' : 'impair → résultat négatif'}.` : `⚠️ Un exposant négatif ne rend pas le nombre négatif : il donne l'<b>inverse</b>.`;
    if (x * N === D * y) return `Tu as calculé la puissance avec l'exposant ${n} : avec l'exposant −${n}, on prend l'<b>inverse</b>.`;
    if (x * N === -D * y) return `⚠️ a<sup>−n</sup> n'est pas −a<sup>n</sup> : c'est ${F(1, 'a<sup>n</sup>')}, l'inverse (et pas l'opposé).`;
    return '';
  });
  let afterVisual = '';
  if (kind === 1 || kind === 2) {
    const items = [], ops = [];
    for (let k = 2; k >= -n; k--) { items.push({ top: `${a}${U(k)}`, val: k >= 0 ? String(prod(a, k)) : `1/${prod(a, -k)}`, c: k < 0 ? '#fff3bf' : k === 0 ? '#d3f9d8' : '' }); if (k > -n) ops.push(`÷ ${a}`); }
    afterVisual = chaine(items, ops, `on divise par ${a} à chaque pas`);
  }
  return {
    type: 'frac', html: `Écris sous la forme d'une fraction :${big(h)}`, check, value: val,
    hint: kind === 4 ? `L'inverse de ${F(p, q)} est ${F(q, p)} : (${F(p, q)})${sp(-n)} = (${F(q, p)})${sp(n)}.` : `a<sup>−n</sup> = ${F(1, 'a<sup>n</sup>')} : calcule d'abord ${pw(a, n)}, puis prends l'inverse.`,
    solution: kind === 4 ? `(${F(p, q)})${sp(-n)} = (${F(q, p)})${sp(n)} = <b>${F(N, D)}</b>` : `${h} = ${F(1, pw(a, n))} = ${F(1, M(prod(a, n)))} = <b>${N < 0 ? '−' : ''}${F(1, D)}</b>`,
    afterVisual,
  };
}
function C9() {
  const it = [3, 2, 1, 0, -1, -2].map(k => ({ top: `2${U(k)}`, val: k >= 0 ? String(2 ** k) : `1/${2 ** -k}`, c: k < 0 ? '#fff3bf' : k === 0 ? '#d3f9d8' : '' }));
  return `<h2>9. Exposant 0 et exposants négatifs</h2>
<p class="intro">On prolonge les puissances aux exposants 0 et négatifs, comme pour les puissances de 10. Le schéma montre pourquoi : en descendant d'un exposant, on divise par la base.</p>
<div class="def">Pour tout nombre a <b>non nul</b> et tout entier n :<br>• <b>a<sup>0</sup> = 1</b> ;<br>• <b>a<sup>−n</sup> = ${F(1, 'a<sup>n</sup>')}</b> : c'est l'<b>inverse</b> de a<sup>n</sup>.</div>
${chaine(it, ['÷ 2', '÷ 2', '÷ 2', '÷ 2', '÷ 2'], "en descendant d'un exposant, on divise par 2", 3)}
<div class="methode"><b>Méthode</b><ol>
<li>Exposant 0 : la réponse est 1 (attention au « − » éventuel devant, sans parenthèses).</li>
<li>Exposant −n : calcule d'abord a<sup>n</sup>.</li>
<li>Prends l'inverse : ${F(1, 'a<sup>n</sup>')}. Le signe vient de la base, pas du « − » de l'exposant.</li>
<li>Pour une fraction : (${F('p', 'q')})<sup>−n</sup> = (${F('q', 'p')})<sup>n</sup>.</li></ol></div>
<div class="ex"><span class="q">Exemple 1 : calcule 7<sup>0</sup>, 4<sup>−1</sup> et 2<sup>−3</sup>.</span><br>7<sup>0</sup> = <b>1</b> ; 4<sup>−1</sup> = <b>${F(1, 4)}</b> ; 2<sup>−3</sup> = ${F(1, '2<sup>3</sup>')} = <b>${F(1, 8)}</b>.</div>
<div class="ex"><span class="q">Exemple 2 : calcule −5<sup>0</sup>, (−3)<sup>−3</sup> et (${F(2, 3)})<sup>−2</sup>.</span><br>• −5<sup>0</sup> = −(5<sup>0</sup>) = <b>−1</b>, mais (−5)<sup>0</sup> = 1.<br>• (−3)<sup>3</sup> = −27, donc (−3)<sup>−3</sup> = ${F(1, '−27')} = <b>−${F(1, 27)}</b>.<br>• (${F(2, 3)})<sup>−2</sup> = (${F(3, 2)})<sup>2</sup> = <b>${F(9, 4)}</b>.</div>
<div class="warn">⚠️ 2<sup>−3</sup> n'est pas −8 ni −6 : un exposant négatif donne l'<b>inverse</b>, pas l'opposé.<br>⚠️ 5<sup>0</sup> = 1, pas 0 ni 5.<br>⚠️ 2<sup>−3</sup> n'est pas 2<sup>3</sup> = 8 : n'oublie pas de prendre l'inverse.</div>
<div class="retenir">À retenir : a<sup>0</sup> = 1 et a<sup>−n</sup> = ${F(1, 'a<sup>n</sup>')} (l'inverse, jamais l'opposé).</div>`;
}

/* ---------- 10. règles de calcul ---------- */
function L10(d) {
  const kind = pick(d < 1 ? [0] : d < 2 ? [0, 1] : d < 4 ? [0, 1, 2] : [0, 1, 2, 3]);
  const neg = d >= 3, lettre = d >= 3 && chance(.3);
  const b = lettre ? pick(['a', 'x']) : pick([2, 3, 5, 7, 10]), num = lettre ? 2 : b, bs = String(b);
  const ex = (lo, hi) => { let e; do { e = neg ? ri(-lo, hi) : ri(2, hi); } while (e === 0 || e === 1 || e === -1 && !neg); return e; };
  const P = (e) => `${bs}${sp(e)}`;
  let n = ex(5, 9), p = ex(5, 9), q, r, X, expr, val, msg, solution, hint, afterVisual = '';
  if (kind === 0) {
    X = n + p; expr = `${P(n)} × ${P(p)}`; val = Math.pow(num, n) * Math.pow(num, p);
    msg = v => (v === n * p ? `On <b>additionne</b> les exposants (on ne les multiplie pas) : a<sup>n</sup> × a<sup>p</sup> = a<sup>n + p</sup>.` : '');
    hint = `Même base : a<sup>n</sup> × a<sup>p</sup> = a<sup>n + p</sup>. On <b>additionne</b> les exposants.`;
    solution = `${expr} = ${bs}<sup>${M(n)} + ${p < 0 ? `(${M(p)})` : p}</sup> = <b>${P(X)}</b>`;
    if (n > 0 && p > 0 && n + p <= 12) afterVisual = bulles([{ groups: [{ n, t: bs }, { n: p, t: bs, c: '#ffd8a8' }] }], { caption: `${n} facteurs + ${p} facteurs = ${n + p} facteurs` });
  } else if (kind === 1) {
    if (!neg && n <= p) { if (n === p) n++; [n, p] = n < p ? [p, n] : [n, p]; }
    X = n - p; expr = F(P(n), P(p)); val = Math.pow(num, n) / Math.pow(num, p);
    msg = v => (v === n + p ? `Pour un quotient, on <b>soustrait</b> les exposants.` : v === p - n ? `Dans l'ordre : exposant du <b>haut</b> moins exposant du <b>bas</b>.` : '');
    hint = `Même base : ${F('a<sup>n</sup>', 'a<sup>p</sup>')} = a<sup>n − p</sup>. On <b>soustrait</b> les exposants (haut moins bas).`;
    solution = `${expr} = ${bs}<sup>${M(n)} − ${p < 0 ? `(${M(p)})` : p}</sup> = <b>${P(X)}</b>`;
    if (n > 0 && p > 0 && n <= 10) afterVisual = bulles([{ groups: [{ n, t: bs }], cross: p }, { groups: [{ n: p, t: bs }], cross: p }], { bar: true, caption: `on simplifie ${p} facteurs : il en reste ${n - p} en haut` });
  } else if (kind === 2) {
    n = neg ? ex(4, 6) : ri(2, 6); p = neg ? ex(3, 4) : ri(2, 4);
    X = n * p; expr = `(${P(n)})${sp(p)}`; val = Math.pow(Math.pow(num, n), p);
    msg = v => (v === n + p ? `(a<sup>n</sup>)<sup>p</sup> : on <b>multiplie</b> les exposants (on ne les additionne pas).` : '');
    hint = `(a<sup>n</sup>)<sup>p</sup> = a<sup>n</sup> × a<sup>n</sup> × … (p fois) = a<sup>n × p</sup>. On <b>multiplie</b> les exposants.`;
    solution = `${expr} = ${bs}<sup>${M(n)} × ${p < 0 ? `(${M(p)})` : p}</sup> = <b>${P(X)}</b>`;
    if (n > 0 && p > 0 && n * p <= 12) afterVisual = bulles([{ groups: Array.from({ length: p }, (_, i) => ({ n, t: bs, c: i % 2 ? '#ffd8a8' : '#d0bfff' })) }], { caption: `${p} groupes de ${n} facteurs : ${n * p} facteurs` });
  } else {
    n = ri(2, 4); p = ri(2, 3); q = ex(4, 6); r = ex(4, 6);
    X = n * p + q - r; expr = F(`(${P(n)})${sp(p)} × ${P(q)}`, P(r));
    val = Math.pow(Math.pow(num, n), p) * Math.pow(num, q) / Math.pow(num, r);
    msg = () => '';
    hint = `Dans l'ordre : (a<sup>n</sup>)<sup>p</sup> → on multiplie ; × → on additionne ; la fraction → on soustrait.`;
    solution = `(${P(n)})${sp(p)} = ${P(n * p)}, puis ${P(n * p)} × ${P(q)} = ${P(n * p + q)}, puis ${F(P(n * p + q), P(r))} = <b>${P(X)}</b>`;
  }
  return {
    type: 'nums', html: `Écris sous la forme d'<b>une seule puissance</b> de ${bs} :`, tpl: `<span>${expr} = ${bs}</span>${EXP(0)}`, labels: ['exposant'],
    check: numsCheck([X], { msg: v => msg(v[0]) || (v[0] === -X && X !== 0 ? 'Attention au <b>signe</b> des exposants.' : '') }),
    verify: E => rel(Math.pow(num, E[0]), val),
    hint, solution, afterVisual,
  };
}
function C10() {
  return `<h2>10. Règles de calcul</h2>
<p class="intro">Avec la même base, on peut regrouper plusieurs puissances en une seule, sans rien calculer : il suffit de travailler sur les exposants.</p>
<div class="def">Pour une même base a (non nulle) et des entiers n et p :<br>
• <b>a<sup>n</sup> × a<sup>p</sup> = a<sup>n + p</sup></b> (on additionne) ;<br>
• <b>${F('a<sup>n</sup>', 'a<sup>p</sup>')} = a<sup>n − p</sup></b> (on soustrait : haut moins bas) ;<br>
• <b>(a<sup>n</sup>)<sup>p</sup> = a<sup>n × p</sup></b> (on multiplie).</div>
<div class="cols">
${bulles([{ groups: [{ n: 3, t: '2' }, { n: 2, t: '2', c: '#ffd8a8' }] }], { caption: '2³ × 2² : 3 + 2 = 5 facteurs' })}
${bulles([{ groups: [{ n: 5, t: '2' }], cross: 2 }, { groups: [{ n: 2, t: '2' }], cross: 2 }], { bar: true, caption: '2⁵ ÷ 2² : il reste 2³' })}
</div>
<div class="methode"><b>Méthode</b><ol>
<li>Vérifie que toutes les puissances ont la <b>même base</b>.</li>
<li>Repère l'opération : produit → +, quotient → −, puissance d'une puissance → ×.</li>
<li>Calcule l'exposant en faisant attention aux nombres négatifs (mets-les entre parenthèses).</li>
<li>Avec plusieurs opérations, avance dans l'ordre : parenthèses, puis produit, puis quotient.</li></ol></div>
<div class="ex"><span class="q">Exemple 1 : écris 5<sup>4</sup> × 5<sup>3</sup>, ${F('5<sup>7</sup>', '5<sup>2</sup>')} et (5<sup>2</sup>)<sup>3</sup> avec une seule puissance.</span><br>5<sup>4</sup> × 5<sup>3</sup> = 5<sup>4 + 3</sup> = <b>5<sup>7</sup></b> ; ${F('5<sup>7</sup>', '5<sup>2</sup>')} = 5<sup>7 − 2</sup> = <b>5<sup>5</sup></b> ; (5<sup>2</sup>)<sup>3</sup> = 5<sup>2 × 3</sup> = <b>5<sup>6</sup></b>.</div>
<div class="ex"><span class="q">Exemple 2 : avec des exposants négatifs et une lettre.</span><br>• 10<sup>4</sup>&nbsp;×&nbsp;10<sup>−6</sup> = 10<sup>4 + (−6)</sup> = <b>10<sup>−2</sup></b>.<br>• ${F('3<sup>2</sup>', '3<sup>−5</sup>')} = 3<sup>2 − (−5)</sup> = <b>3<sup>7</sup></b>.<br>• ${F('(x<sup>3</sup>)<sup>2</sup> × x<sup>4</sup>', 'x<sup>5</sup>')} = ${F('x<sup>6</sup> × x<sup>4</sup>', 'x<sup>5</sup>')} = ${F('x<sup>10</sup>', 'x<sup>5</sup>')} = <b>x<sup>5</sup></b>.</div>
<div class="warn">⚠️ 2<sup>3</sup> × 2<sup>4</sup> = 2<sup>7</sup>, pas 2<sup>12</sup> ; et (2<sup>3</sup>)<sup>2</sup> = 2<sup>6</sup>, pas 2<sup>5</sup>.<br>⚠️ Pour un quotient, c'est l'exposant du <b>haut</b> moins celui du <b>bas</b>.<br>⚠️ Ces règles marchent seulement avec la <b>même base</b> : 2<sup>3</sup> × 3<sup>2</sup> ne s'écrit pas comme une seule puissance.</div>
<div class="retenir">À retenir : produit → on additionne, quotient → on soustrait, puissance de puissance → on multiplie.</div>`;
}

/* ---------- 11. calculs en écriture scientifique ---------- */
function L11(d) {
  const kind = d < 1 ? 0 : d < 2 ? ri(0, 1) : d < 3 ? ri(1, 2) : ri(1, 4);
  // 0 : produit, a × b < 10 ; 1 : produit, a × b ≥ 10 ; 2 : quotient ; 3 : quotient avec a < b ; 4 : puissance
  const ex = () => { let e; do { e = ri(neg(d) ? -6 : 1, 8); } while (e === 0); return e; };
  const n = ex(), p = ex();
  let A, Bm, m, e, op, H, x, extra, hint;
  if (kind === 0 || kind === 1) {
    if (kind === 0) { do { A = ri(1, 9); Bm = ri(1, 9); } while (A * Bm >= 10 || A === 1 && Bm === 1); A *= 10; Bm *= 10; }
    else if (d >= 3 && chance(.5)) { A = pick([12, 15, 25, 35, 45]); Bm = ri(2, 8) * 10; }
    else { do { A = ri(2, 9); Bm = ri(2, 9); } while (A * Bm < 10); A *= 10; Bm *= 10; }
    m = A * Bm; e = n + p - 2; op = '×';
    H = `(${sciH(A / 10, n)}) × (${sciH(Bm / 10, p)})`;
    x = (A / 10) * Math.pow(10, n) * ((Bm / 10) * Math.pow(10, p));
    extra = v => (v[1] === n * p && n * p !== n + p ? `On <b>additionne</b> les exposants : 10${sp(n)} × 10${sp(p)} = 10<sup>${M(n)} + ${p < 0 ? `(${M(p)})` : p}</sup>.` : '');
    hint = `Regroupe : (${M(A / 10)} × ${M(Bm / 10)}) × (10${sp(n)} × 10${sp(p)}). Puis vérifie que le premier nombre est entre 1 et 10.`;
  } else if (kind === 2 || kind === 3) {
    let a, b, c;
    if (kind === 2) { do { b = ri(2, 9); c = ri(1, d >= 3 ? 99 : 9) * (d >= 3 ? 1 : 10); } while (b * c < 10 || b * c > 99 || c < 10); a = b * c; m = c; e = n - p - 1; A = a; Bm = b * 10; }
    else { do { a = ri(1, 8); b = ri(a + 1, 9); } while ((a * 100) % b !== 0); m = a * 100 / b; e = n - p - 2; A = a * 10; Bm = b * 10; }
    op = '÷';
    H = F(sciH(A / 10, n), sciH(Bm / 10, p));
    x = (A / 10) * Math.pow(10, n) / ((Bm / 10) * Math.pow(10, p));
    extra = v => (v[1] === n + p && p !== 0 ? `Pour un quotient, on <b>soustrait</b> les exposants : 10${sp(n)} ÷ 10${sp(p)} = 10<sup>${M(n)} − ${p < 0 ? `(${M(p)})` : p}</sup>.` : '');
    hint = `Sépare : ${F(M(A / 10), M(Bm / 10))} × ${F(`10${sp(n)}`, `10${sp(p)}`)}. Puis vérifie que le premier nombre est entre 1 et 10.`;
  } else {
    const a = ri(2, 9), k = a <= 4 ? pick([2, 3]) : 2, nn = pick(neg(d) ? [-4, -3, -2, -1, 1, 2, 3, 4] : [1, 2, 3, 4]);
    m = prod(a, k); e = nn * k; op = '^';
    H = `(${sciH(a, nn)})${sp(k)}`;
    x = Math.pow(a * Math.pow(10, nn), k);
    extra = v => (v[1] === nn + k ? `(10${sp(nn)})${sp(k)} = 10<sup>${M(nn)} × ${k}</sup> : on <b>multiplie</b> les exposants.` : '');
    hint = `(a × 10<sup>n</sup>)<sup>${k}</sup> = a<sup>${k}</sup> × (10<sup>n</sup>)<sup>${k}</sup> : calcule ${a}${sp(k)} et multiplie les exposants.`;
  }
  const [Ar, Nr] = sciNorm(m, e);
  const e1 = op === '^' ? e : op === '×' ? n + p : n - p; // exposant de 10 avant de normaliser
  const firstS = decStr(m, e - e1), first = Number(firstS); // premier facteur (a × b, a ÷ b ou a^k)
  return {
    type: 'nums', html: `Calcule et donne le résultat en <b>écriture scientifique</b> :${big(H)}`,
    tpl: SCI_TPL, labels: SCI_LAB, check: sciCheck(m, e, extra), verify: sciVerify(x), hint,
    solution: `${H} = ${M(first)} × 10${sp(e1)}${approx(first, Ar) ? '' : ` = ${sciH(Ar, Nr - e1)} × 10${sp(e1)}`} = <b>${sciH(Ar, Nr)}</b>${approx(first, Ar) ? '' : `<br>${M(first)} n'est pas entre 1 et 10 : on l'écrit ${sciH(Ar, Nr - e1)}.`}`,
    afterVisual: approx(first, Ar) ? '' : virgule(firstS),
  };
}
const neg = d => d >= 2;
function C11() {
  return `<h2>11. Calculer en écriture scientifique</h2>
<p class="intro">Pour multiplier ou diviser de très grands ou de très petits nombres, on calcule séparément les nombres a et les puissances de 10.</p>
<div class="def">On <b>regroupe</b> les nombres d'un côté et les puissances de 10 de l'autre :<br>• (a&nbsp;×&nbsp;10<sup>n</sup>) × (b&nbsp;×&nbsp;10<sup>p</sup>) = (a × b)&nbsp;×&nbsp;10<sup>n + p</sup> ;<br>• ${F('a&nbsp;×&nbsp;10<sup>n</sup>', 'b&nbsp;×&nbsp;10<sup>p</sup>')} = ${F('a', 'b')}&nbsp;×&nbsp;10<sup>n − p</sup> ;<br>• (a&nbsp;×&nbsp;10<sup>n</sup>)<sup>k</sup> = a<sup>k</sup>&nbsp;×&nbsp;10<sup>n × k</sup>.</div>
<div class="methode"><b>Méthode</b><ol>
<li>Calcule le nombre : a × b, a ÷ b ou a<sup>k</sup>.</li>
<li>Calcule l'exposant de 10 avec les règles du niveau 10.</li>
<li><b>Vérifie</b> que le nombre est entre 1 et 10. Sinon, écris-le en écriture scientifique et additionne les exposants.</li></ol></div>
<div class="ex"><span class="q">Exemple 1 : calcule (2&nbsp;×&nbsp;10<sup>3</sup>) × (4&nbsp;×&nbsp;10<sup>5</sup>).</span><br>2 × 4 = 8 et 10<sup>3 + 5</sup> = 10<sup>8</sup>. Comme 8 est entre 1 et 10 : résultat <b>8&nbsp;×&nbsp;10<sup>8</sup></b>.</div>
<div class="ex"><span class="q">Exemple 2 : calcule (5&nbsp;×&nbsp;10<sup>3</sup>) × (4&nbsp;×&nbsp;10<sup>−7</sup>).</span><br>5 × 4 = 20 et 10<sup>3 + (−7)</sup> = 10<sup>−4</sup>, soit 20&nbsp;×&nbsp;10<sup>−4</sup>.<br>Mais 20 n'est pas entre 1 et 10 : 20 = 2&nbsp;×&nbsp;10<sup>1</sup>.<br>Donc 2&nbsp;×&nbsp;10<sup>1</sup>&nbsp;×&nbsp;10<sup>−4</sup> = <b>2&nbsp;×&nbsp;10<sup>−3</sup></b>.</div>
<div class="ex"><span class="q">Exemple 3 : calcule ${F('2&nbsp;×&nbsp;10<sup>5</sup>', '8&nbsp;×&nbsp;10<sup>2</sup>')} et (3&nbsp;×&nbsp;10<sup>−2</sup>)<sup>2</sup>.</span><br>• ${F(2, 8)} = 0,25 et 10<sup>5 − 2</sup> = 10<sup>3</sup>. Or 0,25 = 2,5&nbsp;×&nbsp;10<sup>−1</sup>, donc le résultat est <b>2,5&nbsp;×&nbsp;10<sup>2</sup></b>.<br>• 3<sup>2</sup> = 9 et 10<sup>−2 × 2</sup> = 10<sup>−4</sup> : <b>9&nbsp;×&nbsp;10<sup>−4</sup></b>.</div>
<div class="cols">${virgule('20')}${virgule('0.25')}</div>
<div class="warn">⚠️ 20&nbsp;×&nbsp;10<sup>−4</sup> est juste, mais ce n'est pas l'écriture scientifique : le nombre devant doit être entre 1 et 10.<br>⚠️ Pour le produit, on <b>additionne</b> les exposants (on ne les multiplie pas) ; pour le quotient, on les <b>soustrait</b>.</div>
<div class="retenir">À retenir : nombres avec nombres, puissances de 10 avec puissances de 10, puis on vérifie que 1 ≤ a &lt; 10.</div>`;
}

/* ---------- 12. défis ---------- */
const PREF = [['k', 'kilo', 3, 1e3], ['M', 'méga', 6, 1e6], ['G', 'giga', 9, 1e9], ['m', 'milli', -3, 1e-3], ['µ', 'micro', -6, 1e-6], ['n', 'nano', -9, 1e-9]];
function L12(d) {
  const v = ri(0, Math.min(4, d + 1));
  if (v === 0) { // comparer deux nombres en écriture scientifique
    const mk = () => ({ A: ri(10, 99), n: ri(d >= 2 ? -9 : 1, 9) });
    const x1 = mk(); let x2 = mk();
    const t = ri(0, 2);
    if (t === 0) x2.n = x1.n; // même exposant
    else if (t === 1 && d >= 2) x2 = { A: x1.A > 50 ? ri(10, 30) : ri(60, 99), n: x1.n + pick([-1, 1]) }; // piège : grande mantisse, petit exposant
    const show1 = sciH(x1.A / 10, x1.n);
    let eq = false;
    if (d >= 3 && chance(.3)) { // même nombre écrit autrement (pas en écriture scientifique)
      x2 = { A: x1.A, n: x1.n }; eq = true;
    }
    const show2 = eq ? `${M(x2.A)} × 10${sp(x2.n - 1)}` : sciH(x2.A / 10, x2.n);
    const [a1, N1] = sciNorm(x1.A, x1.n - 1), [a2, N2] = sciNorm(x2.A, x2.n - 1);
    const X = N1 !== N2 ? (N1 < N2 ? '<' : '>') : approx(a1, a2) ? '=' : a1 < a2 ? '<' : '>';
    const v2 = eq ? x2.A * Math.pow(10, x2.n - 1) : (x2.A / 10) * Math.pow(10, x2.n);
    const S = X === '<' ? '&lt;' : X === '>' ? '&gt;' : '=';
    return {
      type: 'cmp', html: `Compare ces deux nombres :${big(`${show1} &nbsp;<span class="slot">?</span>&nbsp; ${show2}`)}`,
      check: choiceCheck(X, { msg: () => (N1 !== N2 ? `Compare d'abord les <b>exposants</b> (en écriture scientifique) : le plus grand exposant donne le plus grand nombre.` : '') }),
      value: relDiff((x1.A / 10) * Math.pow(10, x1.n), v2),
      hint: `Écris les deux nombres en écriture scientifique, puis compare d'abord les exposants. S'ils sont égaux, compare les nombres a.`,
      solution: `${eq ? `${show2} = ${sciH(a2, N2)}. ` : ''}${N1 !== N2 ? `Les exposants sont ${M(N1)} et ${M(N2)}` : `Même exposant ${M(N1)} : on compare ${M(a1)} et ${M(a2)}`}. Donc ${show1} ${S} ${show2}.`,
    };
  }
  if (v === 1) { // ordre de grandeur : 10^n ≤ x < 10^(n+1)
    let m; do { m = ri(2, 9999); } while (m % 10 === 0);
    const L = String(m).length, e = ri(-6 - L, 6), raw = decStr(m, e), N = L + e - 1;
    if (decLen(raw) > 9 || intLen(raw) > 10) return L12(d);
    const x = Number(raw);
    return {
      type: 'nums', html: `Trouve l'entier n tel que :${big(`10<sup>n</sup> ≤ ${grp(raw)} &lt; 10<sup>n + 1</sup>`)}`, tpl: 'n = {0}', labels: ['exposant n'],
      check: numsCheck([N], { msg: w => (w[0] === N + 1 ? `Trop grand : 10${sp(N + 1)} est plus grand que le nombre.` : w[0] === N - 1 ? `Trop petit : 10${sp(N)} est encore plus petit que le nombre.` : w[0] === -N ? 'Revois le signe : le nombre est-il plus grand ou plus petit que 1 ?' : '') }),
      verify: E => Math.pow(10, E[0]) <= x && x < Math.pow(10, E[0] + 1),
      hint: `Écris le nombre en écriture scientifique a × 10<sup>n</sup> : l'exposant n est la réponse (c'est l'<b>ordre de grandeur</b>).`,
      solution: `${grp(raw)} = ${sciH(sciNorm(m, e)[0], N)}, donc 10${sp(N)} ≤ ${grp(raw)} &lt; 10${sp(N + 1)} : <b>n = ${M(N)}</b>.`,
    };
  }
  if (v === 2) { // préfixes
    const [s, nom, X, fac] = pick(PREF), u = s === 'G' || s === 'M' ? pick(['W', 'o']) : s === 'k' ? pick(['m', 'g', 'W']) : s === 'n' ? 'm' : pick(['m', 'g']);
    const c = ri(2, 9), un = { m: 'mètres', g: 'grammes', o: 'octets', W: 'watts' }[u];
    const H = `${c} ${s}${u}`;
    return {
      type: 'nums', html: `Complète (« ${nom} ») :${big(`${H} = ${c} × 10<sup>?</sup> ${u}`)}`, tpl: `<span>${H} = ${c} × 10</span>${EXP(0)} ${u}`, labels: ['exposant'],
      check: numsCheck([X], { msg: w => (w[0] === -X ? `Attention au signe : ${X > 0 ? `${nom} est un multiple (plus grand que l'unité)` : `${nom} est une petite partie de l'unité`}.` : '') }),
      verify: E => rel(c * Math.pow(10, E[0]), c * fac),
      hint: `kilo = 10<sup>3</sup>, méga = 10<sup>6</sup>, giga = 10<sup>9</sup> ; milli = 10<sup>−3</sup>, micro = 10<sup>−6</sup>, nano = 10<sup>−9</sup>.`,
      solution: `${nom} (${s}) = 10${sp(X)}, donc ${H} = <b>${c} × 10${sp(X)}</b> ${un}.`,
    };
  }
  if (v === 3) { // problème en écriture scientifique
    const ctx = ri(0, 3);
    let a, n, b, p, op = '×', T, U2;
    if (ctx === 0) { a = 3; n = 5; b = ri(2, 9); p = ri(1, 3); T = `La lumière parcourt environ ${sciH(3, 5)} km en une seconde. Quelle distance (en km) parcourt-elle en ${sciH(b, p)} secondes ?`; U2 = 'km'; }
    else if (ctx === 1) { a = ri(1, 5); n = -ri(5, 7); b = ri(2, 9); p = ri(3, 5); T = `Une bactérie mesure ${sciH(a, n)} m. On en aligne ${sciH(b, p)} bout à bout. Quelle longueur obtient-on (en m) ?`; U2 = 'm'; }
    else if (ctx === 2) { a = ri(2, 4); n = -2; b = ri(2, 9); p = ri(3, 6); T = `Un grain de riz pèse environ ${sciH(a, n)} g. Quelle est la masse (en g) de ${sciH(b, p)} grains ?`; U2 = 'g'; }
    else { b = ri(2, 4); p = ri(5, 6); const c = ri(1, 2); a = b * c; n = ri(9, 12); op = '÷'; T = `Une clé USB contient ${sciH(a, n)} octets. Une photo occupe ${sciH(b, p)} octets. Combien de photos peut-on y mettre ?`; U2 = 'photos'; }
    const m = op === '×' ? a * b : a / b, e = op === '×' ? n + p : n - p;
    const x = op === '×' ? a * Math.pow(10, n) * b * Math.pow(10, p) : a * Math.pow(10, n) / (b * Math.pow(10, p));
    const [Ar, Nr] = sciNorm(m, e);
    return {
      type: 'nums', html: T + `<br>Donne le résultat en écriture scientifique.`, tpl: SCI_TPL, labels: SCI_LAB,
      check: sciCheck(m, e), verify: sciVerify(x),
      hint: op === '×' ? `Multiplie : (${M(a)} × ${M(b)}) × 10<sup>${M(n)} + ${M(p)}</sup>, puis vérifie que a est entre 1 et 10.` : `Divise : ${F(a, b)} × 10<sup>${M(n)} − ${M(p)}</sup>.`,
      solution: `${sciH(a, n)} ${op} ${sciH(b, p)} = ${M(m)} × 10${sp(e)}${m >= 10 ? ` = ${sciH(Ar, Nr)}` : ''} : <b>${sciH(Ar, Nr)}</b> ${U2}.`,
    };
  }
  // pièges mêlés
  const a = ri(2, 5), b = ri(2, 4), n = ri(2, 3), m = ri(2, 3), f1 = ri(0, 1), f2 = ri(0, 1), plus = chance(.5);
  const t1 = f1 ? { h: `(−${a})${sp(n)}`, x: prod(-a, n), v: Math.pow(-a, n) } : { h: `−${a}${sp(n)}`, x: -prod(a, n), v: -Math.pow(a, n) };
  const t2 = f2 ? { h: `(−${b})${sp(m)}`, x: prod(-b, m), v: Math.pow(-b, m) } : { h: `${b}${sp(m)}`, x: prod(b, m), v: Math.pow(b, m) };
  const b3 = pick([2, 3, 5, 7]), t3 = { h: `${b3}<sup>0</sup>`, x: 1 };
  const X = t1.x + (plus ? t2.x : -t2.x) + t3.x;
  const H = `${t1.h} ${plus ? '+' : '−'} ${t2.h} + ${t3.h}`;
  return {
    type: 'nums', html: `Calcule (attention aux pièges !) :${big(H)}`, tpl: 'Réponse : {0}',
    check: numsCheck([X], { msg: w => (w[0] === X - 1 ? `As-tu bien compté ${t3.h} = 1 ?` : '') }),
    value: t1.v + (plus ? t2.v : -t2.v) + Math.pow(b3, 0),
    hint: `Calcule chaque terme séparément : attention aux parenthèses autour des nombres négatifs, et a<sup>0</sup> = 1.`,
    solution: `${t1.h} = ${M(t1.x)} ; ${t2.h} = ${M(t2.x)} ; ${t3.h} = 1.<br>Donc ${H} = ${M(t1.x)} ${plus ? '+' : '−'} ${t2.x < 0 ? `(${M(t2.x)})` : M(t2.x)} + 1 = <b>${M(X)}</b>.`,
  };
}
function C12() {
  const it = [['nano', -9], ['micro', -6], ['milli', -3], ['unité', 0], ['kilo', 3], ['méga', 6], ['giga', 9]].map(([t, k]) => ({ t, v: `10${U(k)}` }));
  return `<h2>12. Défis</h2>
<p class="intro">On mélange tout ! Comparer, trouver un ordre de grandeur, utiliser les préfixes, résoudre un petit problème. Prends le temps d'écrire les étapes au brouillon.</p>
<div class="def">• <b>Comparer</b> deux nombres en écriture scientifique : d'abord les exposants, puis les nombres a.<br>• <b>Encadrer</b> par deux puissances de 10 : si x = a&nbsp;×&nbsp;10<sup>n</sup> avec 1 ≤ a &lt; 10, alors <span style="white-space:nowrap">10<sup>n</sup> ≤ x &lt; 10<sup>n + 1</sup></span> (l'exposant n donne l'ordre de grandeur).<br>• <b>Préfixes</b> : chacun vaut une puissance de 10 (k = 10<sup>3</sup>, M = 10<sup>6</sup>, G = 10<sup>9</sup>, m = 10<sup>−3</sup>, µ = 10<sup>−6</sup>, n = 10<sup>−9</sup>).</div>
${echelle(it, '× 10³', 'chaque préfixe vaut 1 000 fois le précédent')}
<div class="methode"><b>Méthode</b><ol>
<li>Commence par écrire chaque nombre en <b>écriture scientifique</b>.</li>
<li>Pour comparer : le plus grand exposant gagne ; à exposant égal, compare les nombres a.</li>
<li>Dans un problème : choisis l'opération (× ou ÷), puis calcule comme au niveau 11.</li>
<li>Pour un calcul mêlé : calcule chaque terme à part (parenthèses, a<sup>0</sup> = 1), puis additionne.</li></ol></div>
<div class="ex"><span class="q">Exemple 1 : compare 9,5&nbsp;×&nbsp;10<sup>3</sup> et 1,2&nbsp;×&nbsp;10<sup>4</sup> ; puis 42&nbsp;×&nbsp;10<sup>2</sup> et 4,2&nbsp;×&nbsp;10<sup>3</sup>.</span><br>• Les exposants sont 3 et 4 : 9,5&nbsp;×&nbsp;10<sup>3</sup> <b>&lt;</b> 1,2&nbsp;×&nbsp;10<sup>4</sup>, même si 9,5 &gt; 1,2.<br>• 42&nbsp;×&nbsp;10<sup>2</sup> n'est pas en écriture scientifique : 42&nbsp;×&nbsp;10<sup>2</sup> = 4,2&nbsp;×&nbsp;10<sup>3</sup>. Les deux nombres sont <b>égaux</b>.</div>
<div class="ex"><span class="q">Exemple 2 : un grain de riz pèse 2&nbsp;×&nbsp;10<sup>−2</sup> g. Quelle est la masse de 5&nbsp;×&nbsp;10<sup>4</sup> grains ?</span><br>(2&nbsp;×&nbsp;10<sup>−2</sup>) × (5&nbsp;×&nbsp;10<sup>4</sup>) = 10&nbsp;×&nbsp;10<sup>2</sup> = <b>1&nbsp;×&nbsp;10<sup>3</sup> g</b>, soit 1 kg.<br>Encadrer 0,045 : 0,045 = 4,5&nbsp;×&nbsp;10<sup>−2</sup>, donc 10<sup>−2</sup> ≤ 0,045 &lt; 10<sup>−1</sup> et n = −2.</div>
<div class="ex"><span class="q">Exemple 3 : trouve l'entier n tel que 10<sup>n</sup> ≤ 72 740 &lt; 10<sup>n + 1</sup>.</span><br>72 740 = 7,274&nbsp;×&nbsp;10<sup>4</sup>, donc 10<sup>4</sup> ≤ 72 740 &lt; 10<sup>5</sup> : <b>n = 4</b>. Pour 0,000 680 9 = 6,809&nbsp;×&nbsp;10<sup>−4</sup> : <b>n = −4</b>.</div>
<div class="ex"><span class="q">Exemple 4 : complète 4 µm = 4&nbsp;×&nbsp;10<sup>?</sup> m et 8 GW = 8&nbsp;×&nbsp;10<sup>?</sup> W.</span><br>« micro » (µ) vaut 10<sup>−6</sup> : 4 µm = 4&nbsp;×&nbsp;10<sup>−6</sup> m. « giga » (G) vaut 10<sup>9</sup> : 8 GW = <b>8&nbsp;×&nbsp;10<sup>9</sup> W</b>.</div>
<div class="ex"><span class="q">Exemple 5 : calcule −2<sup>2</sup> − (−3)<sup>3</sup> + 5<sup>0</sup>.</span><br>Terme par terme : −2<sup>2</sup> = −4 (le carré ne porte que sur 2) ; (−3)<sup>3</sup> = −27 ; 5<sup>0</sup> = 1.<br>Donc −4 − (−27) + 1 = −4 + 27 + 1 = <b>24</b>.</div>
<div class="warn">⚠️ 9,9&nbsp;×&nbsp;10<sup>3</sup> &lt; 1,1&nbsp;×&nbsp;10<sup>4</sup> : un grand a ne rattrape pas un exposant plus petit.<br>⚠️ milli, micro, nano sont des <b>petites</b> parties de l'unité : exposants négatifs.<br>⚠️ −2<sup>4</sup> = −16, mais (−2)<sup>4</sup> = 16 ; et 7<sup>0</sup> = 1.</div>
<div class="retenir">À retenir : en écriture scientifique, c'est l'exposant qui donne la taille du nombre.</div>`;
}

export const LEVELS = [
  { titre: 'Produit répété et puissance', generate: L1, cours: C1, classe: '4e' },
  { titre: 'Calculer aⁿ (carrés, cubes…)', generate: L2, cours: C2, classe: '4e' },
  { titre: "Puissances d'un nombre négatif", generate: L3, cours: C3, classe: '4e' },
  { titre: 'Le piège −3² et (−3)²', generate: L4, cours: C4, classe: '4e' },
  { titre: 'Puissances de 10', generate: L5, cours: C5, classe: '4e' },
  { titre: 'Puissances de 10 négatives', generate: L6, cours: C6, classe: '4e' },
  { titre: 'Multiplier, diviser par 10ⁿ', generate: L7, cours: C7, classe: '4e' },
  { titre: 'Écriture scientifique', generate: L8, cours: C8, classe: '4e' },
  { titre: 'Exposant 0 et exposants négatifs', generate: L9, cours: C9, classe: '4e / 3e' },
  { titre: 'Règles de calcul', generate: L10, cours: C10, classe: '3e' },
  { titre: 'Calculer en écriture scientifique', generate: L11, cours: C11, classe: '3e' },
  { titre: 'Défis : comparer, ordres de grandeur, préfixes', generate: L12, cours: C12, classe: '3e' },
];
export const OPTIONS = { need: 4, keys: { neg: true, comma: true } };

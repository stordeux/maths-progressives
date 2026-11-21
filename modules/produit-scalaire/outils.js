// Produit scalaire : outils communs.
//
// Une FORME d'exercice = { id, dmin, titre, draw(d) → paramètres, build(p) → exercice, ex: paramètres fixes }.
//  - generate(d) tire une forme parmi celles dont dmin ≤ d, ses paramètres avec draw(d), puis build(p) ;
//  - cours() montre, pour CHAQUE forme du niveau, un exemple corrigé obtenu avec build(ex) : le cours et les exercices
//    partagent donc exactement le même énoncé, le même indice et la même correction.
//  - build(p) peut renvoyer null (tirage refusé) : generate retire.
// build renvoie un exercice du moteur (type, html, visual, tpl, check, hint, solution…) plus :
//  rep = la réponse écrite (HTML), affichée dans l'exemple du cours.
// Dans build, tout hasard passe par melange() : en mode « cours » (FIXE) l'ordre des choix est celui de la liste.
import { ri, pick, nz, shuffle, chance, prenom } from '../../engine/util/rand.js';
import { numsCheck, fracCheck, choiceCheck } from '../../engine/answers/checks.js';
import { M, P, F, R, terms } from '../../engine/util/fmt.js';
import { r6, gcd } from '../../engine/util/arith.js';

export { ri, pick, nz, shuffle, chance, prenom, M, P, F, R, terms, r6, gcd };

let FIXE = false;
export const melange = a => (FIXE ? [...a] : shuffle([...a]));

/* ---------- écritures ---------- */
const NBSP = String.fromCharCode(160);
/** nom de vecteur surmonté d'une flèche (HTML) : la flèche est en position absolue, elle ne change pas la largeur du nom */
const ARR = '<svg viewBox="0 0 20 6" preserveAspectRatio="none" aria-hidden="true" style="position:absolute;left:0;top:0;width:100%;height:.34em;overflow:visible"><path d="M0.5,3H18.5M14.5,0.6L19.2,3L14.5,5.4" fill="none" stroke="currentColor" stroke-width="1.4" vector-effect="non-scaling-stroke" stroke-linecap="round" stroke-linejoin="round"/></svg>';
export const V = n => `<span style="position:relative;display:inline-block;line-height:1;padding-top:.32em">${ARR}${n}</span>`;
/** espace insécable : jamais de saut de ligne dans une formule */
export const nw = s => `<span class="nw">${s}</span>`;
/** coordonnées (x ; y), espaces insécables */
export const cp = (x, y) => `(${M(x)}${NBSP};${NBSP}${M(y)})`;
/** point avec ses coordonnées : A(3 ; −2) */
export const pt = (n, A) => nw(`${n}${cp(A[0], A[1])}`);
/** vecteur avec ses coordonnées : u(3 ; −2) */
export const vc = (n, u) => nw(`${V(n)}${cp(u[0], u[1])}`);
/** produit scalaire a · b (a et b déjà écrits) */
export const dot = (a, b) => `${a}${NBSP}·${NBSP}${b}`;
/** norme d'un vecteur : ‖u‖ */
export const norm = n => `‖${V(n)}‖`;
export const sq = a => `${a}<sup>2</sup>`;
/** carré d'un nombre écrit : (−3)² */
export const carre = a => `${P(a)}<sup>2</sup>`;
export const big = s => `<div class="big">${s}</div>`;
/** √n écrit (racine surmontée d'une barre) et k√n */
export const rac = n => R(M(n));
export const kRac = (k, n) => (k === 1 ? '' : M(k)) + rac(n);
/** équation ax + by + c = 0 */
export const cart = (a, b, c) => `${terms([[a, 'x'], [b, 'y'], [c, '']])} = 0`;
/** (x − a)² ou x² si a = 0 */
const carreX = (v, nom) => (v === 0 ? `${nom}<sup>2</sup>` : `(${nom} ${v > 0 ? '−' : '+'} ${M(Math.abs(v))})<sup>2</sup>`);
/** équation réduite du cercle : (x − a)² + (y − b)² = r² (r2 = r² déjà calculé) */
export const cercle = (a, b, r2) => `${carreX(a, 'x')} + ${carreX(b, 'y')} = ${M(r2)}`;
/** équation développée x² + y² + px + qy + s = 0 */
export const cercleDev = (p, q, s) => `${terms([[1, 'x<sup>2</sup>'], [1, 'y<sup>2</sup>'], [p, 'x'], [q, 'y'], [s, '']])} = 0`;
/** somme de termes écrits, signes propres : somme(['3', '−2', ...]) → on passe les nombres */
export const somme = nums => nums.map((n, i) => (i === 0 ? M(n) : n < 0 ? ` − ${M(-n)}` : ` + ${M(n)}`)).join('');
/** a × b avec parenthèses si négatif */
export const fois = (a, b) => `${P(a)} × ${P(b)}`;
/** a + b écrit proprement (b négatif : « − ») ; p est déjà écrit */
export const plus = (p, q) => (q < 0 ? `${p} − ${M(-q)}` : `${p} + ${M(q)}`);
/** x × x′ + y × y′ avec les valeurs, puis le résultat : « 3 × (−2) + 4 × 5 = −6 + 20 = 14 » */
export const calcAn = (u, v) => {
  const p1 = u[0] * v[0], p2 = u[1] * v[1];
  return `${fois(u[0], v[0])} + ${fois(u[1], v[1])} = ${plus(M(p1), p2)} = ${M(p1 + p2)}`;
};
/** combinaison de nombres, calculée : comb([2, −3], [5, 4]) → « 2 × 5 − 3 × 4 = 10 − 12 = −2 » */
export const comb = (coefs, vals) => {
  let t = '', tot = 0;
  const prods = [];
  coefs.forEach((k, i) => {
    if (!k) return;
    const ab = Math.abs(k), first = !t;
    const piece = ab === 1 ? (k > 0 ? (first ? M(vals[i]) : P(vals[i])) : `1 × ${P(vals[i])}`) : `${M(ab)} × ${P(vals[i])}`;
    t += (k < 0 ? (first ? '−' : ' − ') : (first ? '' : ' + ')) + piece;
    prods.push(k * vals[i]); tot += k * vals[i];
  });
  const s2 = somme(prods);
  return t === s2 ? `${t} = ${M(tot)}` : `${t} = ${s2} = ${M(tot)}`;
};
/** combinaison k₁ x₁ + k₂ x₂ … (éléments déjà écrits), coefficients 1 et −1 sans « 1 » */
export const cv = (coefs, items) => {
  let s = '';
  coefs.forEach((k, i) => {
    if (k === 0) return;
    const ab = Math.abs(k), c = ab === 1 ? '' : M(ab);
    s += (k < 0 ? (s ? ' − ' : '−') : (s ? ' + ' : '')) + c + items[i];
  });
  return s || '0';
};
/** x − v (ou x + |v|, ou x si v = 0) : le nom de la variable est n */
export const xm = (v, n = 'x') => (v === 0 ? n : v > 0 ? `${n} − ${M(v)}` : `${n} + ${M(-v)}`);
/** parenthèses autour d'une expression, sauf si elle tient en une seule lettre : pa('x − 2') → '(x − 2)', pa('x') → 'x' */
export const pa = e => (e.length === 1 ? e : `(${e})`);
/** espaces insécables dans les coordonnées « (x ; y) » écrites avec des espaces ordinaires (pas de saut de ligne dans un couple) */
export const nbspCoord = s => {
  let t = String(s), prev;
  do { prev = t; t = t.replace(/\(([^()<>;]*?) ; ([^()<>;]*?)\)/g, `($1${NBSP};${NBSP}$2)`); } while (t !== prev);
  return t;
};
/** « 4x = 12, donc x = 3 » : isole x dans m x = rhs, sans « 1x » ni division par 1 */
export const isole = (m, rhs) => (Math.abs(m) === 1 ? `${terms([[m, 'x']])} = ${M(rhs)}, donc x = ${M(rhs / m)}` : `${M(m)}x = ${M(rhs)}, donc x = ${M(rhs)} ÷ ${P(m)} = ${M(rhs / m)}`);
/** (x ; y) avec des expressions déjà écrites, espaces insécables */
export const cpx = (x, y) => `(${x}${NBSP};${NBSP}${y})`;
const fill = (tpl, E) => tpl.replace(/\{(\d+)\}/g, (_, i) => `<b>${M(E[+i])}</b>`);

/* ---------- géométrie : calculs exacts sur des entiers ---------- */
export const sc = (u, v) => u[0] * v[0] + u[1] * v[1];
export const vec = (A, B) => [B[0] - A[0], B[1] - A[1]];
export const n2 = u => u[0] * u[0] + u[1] * u[1];
export const sqrtInt = n => { const r = Math.round(Math.sqrt(n)); return r * r === n ? r : null; };
/** triplets pythagoriciens (a, b, c) */
export const TRIPLES = [[3, 4, 5], [6, 8, 10], [5, 12, 13], [8, 15, 17], [9, 12, 15], [12, 16, 20], [7, 24, 25], [20, 21, 29]];
/** noms de points et de vecteurs */
export const NOMS3 = [['A', 'B', 'C'], ['E', 'F', 'G'], ['K', 'L', 'M'], ['M', 'N', 'P'], ['R', 'S', 'T'], ['D', 'E', 'F']];
export const NOMS_V = [['u', 'v'], ['v', 'w'], ['u', 'w']];
/** vecteur au hasard à coordonnées entre a et b (non nul) */
export const vecAl = (a, b) => { let v; do { v = [ri(a, b), ri(a, b)]; } while (!v[0] && !v[1]); return v; };

/* ---------- réponses ---------- */
/** cases numériques ; tpl : gabarit {0}, {1}… ; msg(v) : message « presque juste » */
export function rNums(E, o = {}) {
  const tpl = o.tpl || 'Réponse : {0}';
  const q = { type: 'nums', tpl, check: numsCheck(E, { msg: o.msg }), expected: E, rep: fill(tpl, E) };
  if (o.value !== undefined) q.value = o.value;
  return q;
}
/** fraction irréductible N/D */
export function rFrac(N, D, o = {}) {
  const g = gcd(N, D), n = N / g, d = D / g, s = n * d < 0 ? '−' : '';
  const q = { type: 'frac', check: fracCheck(n * Math.sign(d), Math.abs(d), { irr: true }), rep: d === 1 ? M(n) : `${s}${F(Math.abs(n), Math.abs(d))}` };
  if (o.value !== undefined) q.value = o.value;
  return q;
}
/** QCM : items [{ l, ok?, why? }] (un seul ok) ; indep : texte du bon choix recalculé autrement */
export function rChoice(items, o = {}) {
  const all = o.ordre ? [...items] : melange(items);
  const i = all.findIndex(x => x.ok), E = String(i);
  const q = {
    type: 'choice', opts: all.map((x, k) => ({ v: String(k), l: x.l })),
    check: choiceCheck(E, { msg: c => { const b = all[+c]; return b && b.why ? `⚠️ ${b.why}` : ''; } }),
    expected: E, rep: all[i].l,
  };
  if (o.indep !== undefined) q.verify = e => all[+e].l === o.indep;
  return q;
}
/** Oui / Non : ok = la bonne réponse ; why = message affiché si l'élève se trompe */
export function rOuiNon(ok, whyOui, whyNon) {
  return rChoice([{ l: 'Oui', ok: ok, why: ok ? undefined : whyOui }, { l: 'Non', ok: !ok, why: ok ? whyNon : undefined }], { ordre: true, indep: ok ? 'Oui' : 'Non' });
}
/**
 * Équation ax + by + c = 0 : trois cases ; toute équation PROPORTIONNELLE à (A, B, C) est acceptée
 * (k(ax + by + c) = 0 décrit la même droite).
 */
export function rEquation(A, B, C, o = {}) {
  const E = [A, B, C];
  const prop = (a, b, c) => {
    const k = A !== 0 ? a / A : b / B;
    return k !== 0 && Math.abs(a - k * A) < 1e-9 && Math.abs(b - k * B) < 1e-9 && Math.abs(c - k * C) < 1e-9;
  };
  const check = v => {
    const [a, b, c] = v;
    if (prop(a, b, c)) return { ok: true };
    const colin = Math.abs(a * B - b * A) < 1e-9 && (a !== 0 || b !== 0);
    return { ok: false, bad: [2], msg: colin ? 'Ton vecteur normal est bon, mais la droite ne passe pas par le bon point : remplace x et y par les coordonnées du point connu pour trouver c.' : (o.msgNormal || 'Les coefficients de x et de y doivent être les coordonnées d’un vecteur normal.') };
  };
  check.expected = E;
  return { type: 'nums', tpl: '{0} x + {1} y + {2} = 0', check, expected: E, rep: `<b>${cart(A, B, C)}</b>`, verify: e => prop(e[0], e[1], e[2]) };
}

/* ---------- niveaux ---------- */
const sansBalises = s => String(s).replace(/<[^>]+>/g, '');
/** exemple corrigé d'une forme (cours) : mêmes énoncé, indice et solution que l'exercice, ordre des choix fixe */
function exemple(f, num) {
  FIXE = true;
  let q;
  try { q = f.build(f.ex); } finally { FIXE = false; }
  if (!q) throw new Error(`exemple impossible : ${f.id}`);
  let choix = '';
  if (q.type === 'choice' && !q.opts.some(o => /<table|<svg/.test(o.l))) {
    choix = `<div class="choixex">${q.opts.map((o, i) => `<b>${'ABCD'[i]}.</b> ${i === +q.expected ? '<b>' + o.l + ' ✓</b>' : o.l}`).join(' &nbsp;·&nbsp; ')}</div>`;
  }
  const rep = `<b>Réponse :</b> ${q.rep}`;
  return nbspCoord(`<div class="ex" data-form="${f.id}"><span class="q">Exemple ${num} : ${f.titre}</span><br>${q.html}${q.visual || ''}${choix}<div class="repex">${rep}</div>${q.solution}${q.afterVisual || ''}</div>`);
}
export const exemples = forms => forms.map((f, i) => exemple(f, i + 1)).join('\n');
/** l'exemple d'une forme, pour les tests */
export function exempleDe(f) { FIXE = true; try { return normalise(f.build(f.ex)); } finally { FIXE = false; } }
/** applique nbspCoord aux textes d'un exercice */
function normalise(q) {
  if (!q) return q;
  for (const k of ['html', 'hint', 'solution', 'rep', 'tpl']) if (typeof q[k] === 'string') q[k] = nbspCoord(q[k]);
  if (q.opts) q.opts = q.opts.map(o => ({ ...o, l: nbspCoord(o.l) }));
  return q;
}

/**
 * Niveau : { titre, generate(d), cours(), forms, classe }.
 *  c = { n, intro, def, visuel, methode: [étapes], warn: [pièges], retenir, classe }
 */
export function niveau(titre, forms, c) {
  const generate = d => {
    const ok = forms.filter(f => f.dmin <= d);
    for (let k = 0; k < 80; k++) {
      const f = pick(ok);
      const q = normalise(f.build(f.draw(d)));
      if (q) { q.form = f.id; return q; }
    }
    throw new Error(`niveau ${titre} : aucun tirage valide (d = ${d})`);
  };
  const cours = () => `<h2>${c.n}. ${titre}</h2>
<p class="intro">${c.intro}</p>
<div class="def">${c.def}</div>
${c.visuel || ''}
<div class="methode"><b>Méthode</b><ol>${c.methode.map(x => `<li>${x}</li>`).join('')}</ol></div>
${exemples(forms)}
<div class="warn">${c.warn.map(x => '⚠️ ' + x).join('<br>')}</div>
<div class="retenir">À retenir : ${c.retenir}</div>`;
  return { titre, generate, cours, forms, classe: c.classe || '1re' };
}
export const txt = sansBalises;

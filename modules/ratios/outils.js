// Outils communs des niveaux de « Ratios et fractions » : calculs de fractions, réponses, écriture des énoncés,
// exemples de cours fabriqués par les MÊMES fonctions que les exercices (donc toujours de la même forme).
import { ri, pick, shuffle, chance, prenom } from '../../engine/util/rand.js';
import { gcd, red, r6, approx } from '../../engine/util/arith.js';
import { M, F } from '../../engine/util/fmt.js';
import { numsCheck, fracCheck } from '../../engine/answers/checks.js';

export { ri, pick, shuffle, chance, prenom, gcd, red, r6, M, F };

export const big = s => `<div class="big">${s}</div>`;
export const slot = '<span class="slot">?</span>';
/** ratio écrit : 3 : 5 (espace insécable avant les deux-points) */
export const rt = (...v) => v.join('&nbsp;: ');
/** « que Tom » mais « qu'Adam » */
export const que = w => (/^[AEIOUYÉÈH]/.test(w) ? `qu'${w}` : `que ${w}`);
/** « de lait » mais « d'huile » */
export const de = w => (/^[aeiouyâêéèîôh]/i.test(w) ? `d'${w}` : `de ${w}`);
/** fraction empilée, ou entier si le dénominateur vaut 1 */
export const sfx = (n, d) => (d === 1 ? String(n) : F(n, d));
/** prix : 7,50 € */
export const eur = x => { const v = r6(x); return (Number.isInteger(v) ? String(v) : v.toFixed(2).replace('.', ',')) + ' €'; };
/** grands entiers avec espace insécable : 12 000 */
export const gi = n => String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
/** pluriel : 1 verre, 2 verres */
export const pl = (n, mot, plur) => `${n} ${Math.abs(n) > 1 ? plur || mot + 's' : mot}`;

/* ---------- fractions [n, d] réduites ---------- */
export const fr = {
  add: (x, y) => red(x[0] * y[1] + y[0] * x[1], x[1] * y[1]),
  sub: (x, y) => red(x[0] * y[1] - y[0] * x[1], x[1] * y[1]),
  mul: (x, y) => red(x[0] * y[0], x[1] * y[1]),
  div: (x, y) => red(x[0] * y[1], x[1] * y[0]),
  val: x => x[0] / x[1],
};
/** tire un couple (a, b) premiers entre eux, a dans [alo ; ahi], b dans [blo ; bhi] et qui vérifie ok */
export function coprime(alo, ahi, blo, bhi, ok = () => true) {
  for (let i = 0; i < 2000; i++) { const a = ri(alo, ahi), b = ri(blo, bhi); if (gcd(a, b) === 1 && ok(a, b)) return [a, b]; }
  throw new Error(`pas de couple premier entre eux dans [${alo};${ahi}] × [${blo};${bhi}]`);
}
/** tire un entier dans [lo ; hi] qui vérifie ok */
export function tirer(lo, hi, ok = () => true) {
  for (let i = 0; i < 2000; i++) { const v = ri(lo, hi); if (ok(v)) return v; }
  for (let v = lo; v <= hi; v++) if (ok(v)) return v;
  throw new Error(`aucun entier dans [${lo} ; ${hi}]`);
}

/* ---------- réponses ---------- */
/** cases numériques. o.near = [[case, valeur, message]] (erreurs « presque justes »), o.value, o.verify, o.keys */
export function nums(E, tpl, o = {}) {
  E = E.map(r6);
  const near = (o.near || []).filter(([i, v]) => isFinite(v) && !approx(r6(v), E[i]));
  const msg = v => { for (const [i, val, m] of near) if (v[i] !== null && v[i] !== undefined && approx(v[i], r6(val), 1e-6)) return m; return ''; };
  const q = { type: 'nums', tpl, expected: E, check: numsCheck(E, { msg }) };
  if (o.value !== undefined) q.value = o.value;
  if (o.verify) q.verify = o.verify;
  if (o.keys) q.keys = o.keys;
  return q;
}
/**
 * Résultat N/D (fraction irréductible exigée) : une fraction à deux cases, ou un entier à une case si N/D est entier.
 * `value` : le même résultat recalculé autrement (en flottants, à partir de l'énoncé).
 */
export function res(N, D, value) {
  const [n, d] = red(N, D);
  if (d === 1) return { type: 'nums', tpl: 'Réponse : {0}', expected: [n], check: numsCheck([n]), value };
  return { type: 'frac', check: fracCheck(n, d, { irr: true }), value };
}
/** résultat entier « Réponse : {0} unité » */
export const ent = (X, value, unite = '', o = {}) => nums([X], `Réponse : {0}${unite ? ' ' + unite : ''}`, { value, ...o });

/** ratio réduit E = [a, b, …] : refuse le ratio juste mais non simplifié, et signale l'ordre inversé */
export function ratioCheck(E, { ordre = '' } = {}) {
  const f = v => {
    if (E.every((e, i) => approx(v[i], e))) return { ok: true };
    const bad = E.map((_, i) => i);
    if (v.every(x => x > 0) && E.every((e, i) => approx(v[i] * E[0], e * v[0]))) return { ok: false, bad, msg: 'Ce ratio est juste, mais pas simplifié : divise tous les nombres par le même nombre.' };
    const rev = [...E].reverse();
    if (rev.every((e, i) => approx(v[i], e))) return { ok: false, bad, msg: `Tu as inversé l'ordre${ordre ? ' : ' + ordre : ''}.` };
    return { ok: false, bad };
  };
  f.expected = E;
  return f;
}

/* ---------- cours ---------- */
/** un exemple corrigé, fabriqué avec la même fonction que l'exercice : énoncé (sans figure) puis solution */
export const ex = q => `<div class="ex"><span class="q">${q.html.replace(/<div class="big">([\s\S]*?)<\/div>/g, ' $1 ')}</span><br>${q.solution}</div>`;
export const exs = l => l.map(ex).join('\n');
export const warn = t => `<div class="warn">${t}</div>`;
export const retenir = t => `<div class="retenir">À retenir : ${t}</div>`;
export const methode = l => `<div class="methode"><b>Méthode</b><ol>${l.map(x => `<li>${x}</li>`).join('')}</ol></div>`;
export const def = t => `<div class="def">${t}</div>`;
export const cols = (a, b) => `<div class="cols">${a}${b}</div>`;

/* ---------- calculs expliqués : { t: texte de l'étape, r: résultat [n, d] réduit } ---------- */
const lcm = (a, b) => a / gcd(a, b) * b;
/** « = 3 » ou « = 2/3 » si la fraction n/d n'était pas réduite */
export const simpl = (n, d) => { const [a, b] = red(n, d); if (a === n && b === d) return ''; return ` = ${sfx(a, b)}`; };
const dn = (u, v) => (u === 1 ? String(v) : v === 1 ? String(u) : `${u} × ${v}`);
export const mulT = (x, y) => { const p = x[0] * y[0], q = x[1] * y[1]; return { t: `${sfx(...x)} × ${sfx(...y)} = ${F(`${x[0]} × ${y[0]}`, dn(x[1], y[1]))} = ${sfx(p, q)}${simpl(p, q)}`, r: red(p, q) }; };
export const divT = (x, y) => { const p = x[0] * y[1], q = x[1] * y[0]; if (x[1] === 1) return { t: `${sfx(...x)} ÷ ${sfx(...y)} = ${sfx(...x)} × ${sfx(y[1], y[0])} = ${y[0] === 1 ? p : `${F(`${x[0]} × ${y[1]}`, y[0])} = ${sfx(p, q)}${simpl(p, q)}`}`, r: red(p, q) }; return { t: `${sfx(...x)} ÷ ${sfx(...y)} = ${sfx(...x)} × ${sfx(y[1], y[0])} = ${F(`${x[0]} × ${y[1]}`, dn(x[1], y[0]))} = ${sfx(p, q)}${simpl(p, q)}`, r: red(p, q) }; };
/** somme ou différence : mise au même dénominateur */
export const addT = (x, y, op = '+') => {
  const D = lcm(x[1], y[1]), a = x[0] * (D / x[1]), b = y[0] * (D / y[1]), s = op === '+' ? a + b : a - b;
  const mid = D === x[1] && D === y[1] ? '' : `${F(a, D)} ${op} ${F(b, D)} = `;
  return { t: `${sfx(...x)} ${op} ${sfx(...y)} = ${mid}${F(s, D)}${simpl(s, D)}`, r: red(s, D) };
};

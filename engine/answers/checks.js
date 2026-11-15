// Fabriques de fonctions check(answer) → {ok, msg?, bad?}.
// Chaque fabrique attache la réponse canonique dans check.expected (utilisée par les tests
// et par generate() quand le générateur ne fournit pas lui-même `expected`).
import { gcd, red, approx } from '../util/arith.js';
import { F } from '../util/fmt.js';

const withExp = (fn, expected) => { fn.expected = expected; return fn; };

/** cases numériques : v = [nombres] ; o.msg(v) peut renvoyer un message « presque juste » */
export const numsCheck = (E, o = {}) => withExp(v => {
  const bad = E.map((e, i) => (approx(v[i], e) ? -1 : i)).filter(i => i >= 0);
  if (!bad.length) return { ok: true };
  return { ok: false, bad, msg: o.msg ? o.msg(v) : '' };
}, E);

/** fraction : v = [n, d]. o.irr : forme irréductible exigée */
export const fracCheck = (N, D, o = {}) => {
  const [rn, rd] = red(N, D);
  return withExp(v => {
    const [n, d] = v;
    if (d === 0) return { ok: false, msg: 'Le dénominateur ne peut pas être 0.' };
    if (!Number.isInteger(n) || !Number.isInteger(d)) return { ok: false, msg: 'Écris des nombres entiers en haut et en bas.' };
    if (n * D !== N * d) return { ok: false };
    if (o.irr && (n !== rn || d !== rd)) return { ok: false, msg: "C'est bien égal… mais on peut encore simplifier !" };
    if (!o.irr && gcd(n, d) > 1) return { ok: true, msg: `Astuce : ${F(n, d)} se simplifie en ${rd === 1 ? rn : F(rn, rd)}.` };
    return { ok: true };
  }, [rn, rd]);
};

/** solutions d'une équation : v = {none, vals} */
export const rootsCheck = (E, o = {}) => {
  const e = [...new Set(E)].sort((p, q) => p - q);
  return withExp(v => {
    if (v.none) return { ok: e.length === 0, msg: e.length ? "Il y a pourtant des solutions : cherche encore !" : '' };
    const u = [...new Set(v.vals.filter(x => x !== null))].sort((p, q) => p - q);
    if (e.length === 0) return { ok: false, msg: o.noneMsg || "As-tu vérifié qu'il y a vraiment des solutions ?" };
    if (u.length < e.length && u.every(x => e.some(y => approx(x, y)))) return { ok: false, msg: 'Tu as trouvé une solution juste, mais il en manque une !' };
    return { ok: u.length === e.length && u.every((x, i) => approx(x, e[i])) };
  }, e);
};

/** choix parmi des options (ou comparaison < = >) : v = {c} */
export const choiceCheck = (E, o = {}) => withExp(v => {
  const ok = String(v.c) === String(E);
  return { ok, msg: !ok && o.msg ? o.msg(v.c) : '' };
}, E);

/** réunion d'intervalles : v = {set} ou {err} */
export const ivCheck = E => withExp(v => {
  if (v.err) return { ok: false, msg: v.err };
  const u = v.set;
  if (u.length !== E.length) return { ok: false, msg: E.length === 2 && u.length === 1 ? "Il faut <b>deux</b> intervalles ici." : '' };
  const sameBounds = E.every((e, i) => e.lo === u[i].lo && e.hi === u[i].hi);
  const ok = sameBounds && E.every((e, i) => e.lc === u[i].lc && e.hc === u[i].hc);
  return { ok, msg: !ok && sameBounds ? 'Les bornes sont bonnes ! Vérifie le sens des crochets (borne comprise ou non ?).' : '' };
}, E);

/** tableau de signes : v = {z: ['+','−',…]} */
export const tableCheck = E => withExp(v => {
  const bad = E.map((e, i) => (v.z[i] === e ? -1 : i)).filter(i => i >= 0);
  return { ok: !bad.length, bad };
}, E);

/** étapes de calcul : v = [nombres], on signale la première étape fausse */
export const stepsCheck = (E, labels = []) => withExp(v => {
  const i = E.findIndex((e, k) => !approx(v[k], e));
  if (i < 0) return { ok: true };
  return { ok: false, bad: [i], msg: `Erreur à l'étape ${i + 1}${labels[i] ? ' : ' + labels[i] : ''}. Les étapes d'avant sont justes.` };
}, E);

/** réponse à fournir pour la réponse canonique (tests) */
export function toAnswer(type, E) {
  switch (type) {
    case 'nums': case 'frac': case 'steps': return E;
    case 'roots': return { none: E.length === 0, vals: E.length ? E : [null, null] };
    case 'choice': case 'cmp': return { c: E };
    case 'iv': return { set: E };
    case 'table': return { z: E };
    default: throw new Error('type inconnu ' + type);
  }
}

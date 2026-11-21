// Statistiques au lycée : outils communs (même architecture qu'Automatismes et Fonctions de référence).
//
// Une FORME d'exercice = { id, dmin, titre, draw(d) → paramètres, build(p) → exercice, ex: paramètres fixes }.
//  - generate(d) tire une forme parmi celles dont dmin ≤ d, ses paramètres avec draw(d), puis build(p) ;
//  - cours() montre, pour CHAQUE forme du niveau, un exemple corrigé obtenu avec build(ex) : le cours et les exercices
//    partagent donc le même énoncé, le même indice, la même correction et la même présentation de la réponse ;
//  - draw ou build peut renvoyer null (tirage refusé) : generate retire.
// build renvoie un exercice du moteur (type, html, visual, tpl, check, hint, solution…) plus :
//  rep = la réponse écrite (HTML), affichée dans l'exemple du cours ; meta = données pour les tests du module.
// Dans build, tout hasard passe par melange() : en mode « cours » (FIXE) l'ordre des choix est celui de la liste.
import { ri, pick, shuffle, chance } from '../../engine/util/rand.js';
import { numsCheck, choiceCheck } from '../../engine/answers/checks.js';
import { M, P, F, strip } from '../../engine/util/fmt.js';
import { approx } from '../../engine/util/arith.js';
import { multiCheck } from '../stats3e/util.js';

export { ri, pick, shuffle, chance, M, P, F, strip };

let FIXE = false;
export const melange = a => (FIXE ? [...a] : shuffle([...a]));

/* ---------- écritures ---------- */
export const big = s => `<div class="big">${s}</div>`;
export const lst = a => a.map(M).join(' ; ');
/** pourcentage : « 35 % » avec espace insécable */
export const pc = x => `${M(x)}&nbsp;%`;
/** nombre suivi de son unité (l'unité commence par une espace) : « 12 min » */
export const fv = (v, u = '') => `${M(v)}${u ? u.replace(/^ /, '&nbsp;') : ''}`;
export const pl = (n, mot, mots = mot + 's') => `${M(n)} ${n > 1 ? mots : mot}`;
/** « 3 × 12 + 5 × 14 » : somme de produits effectif × valeur */
export const somme = (vals, effs, f = (x, e) => `${M(e)} × ${M(x)}`) => vals.map((x, i) => f(x, effs[i])).join(' + ');
/** « 12 + 8 + 20 » */
export const plus = a => a.map(M).join(' + ');
/** « 3 + (−2) » sans « + − » : somme de nombres relatifs avec parenthèses */
export const plusP = a => a.map(P).join(' + ');

/* ---------- réponses ---------- */
const fill = (tpl, E) => tpl.replace(/\{(\d+)\}/g, (_, i) => `<b>${M(E[+i])}</b>`);
/** cases numériques ; tpl : gabarit {0}, {1}… ; near : par case, [[valeur, message « presque juste »], …] */
export function rNums(E, o = {}) {
  const tpl = o.tpl || 'Réponse : {0}';
  const q = { type: 'nums', tpl, check: multiCheck(E, o.near || []), expected: E, rep: fill(tpl, E), keys: { comma: true, neg: o.neg !== undefined ? o.neg : false } };
  if (o.value !== undefined) q.value = o.value;
  if (o.verify) q.verify = o.verify;
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
/** vrai si deux listes de nombres sont égales (à 1e-9) */
export const memes = (a, b) => a.length === b.length && a.every((x, i) => approx(x, b[i]));

/* ---------- niveaux ---------- */
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
  return `<div class="ex" data-form="${f.id}"><span class="q">Exemple ${num} : ${f.titre}</span><br>${q.html}${q.visual || ''}${choix}<div class="repex"><b>Réponse :</b> ${q.rep}</div>${q.solution}${q.afterVisual || ''}</div>`;
}
export const exemples = forms => forms.map((f, i) => exemple(f, i + 1)).join('\n');
/** l'exemple d'une forme, pour les tests */
export function exempleDe(f) { FIXE = true; try { return f.build(f.ex); } finally { FIXE = false; } }

/**
 * Niveau : { titre, generate(d), cours(), forms, classe }.
 *  c = { n, intro, def, visuel, methode: [étapes], warn: [pièges], retenir, classe }
 */
export function niveau(titre, forms, c) {
  const generate = d => {
    const ok = forms.filter(f => f.dmin <= d);
    for (let k = 0; k < 120; k++) {
      const f = pick(ok);
      const p = f.draw(d);
      const q = p === null ? null : f.build(p);
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
  return { titre, generate, cours, forms, classe: c.classe || '2de – 1re' };
}

/* ---------- tableaux ---------- */
import { tab } from './draw.js';
/** tableau valeurs / effectifs d'un contexte ; extra : lignes supplémentaires [[intitulé, cellules…]] */
export const tabEff = (C, vals, effs, { lab = 'Effectif', extra = [] } = {}) => tab([[C.h, ...vals], [lab, ...effs], ...extra]);

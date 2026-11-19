// Outils communs des niveaux de Géométrie plane (questions à cases, questions à choix, exemples du cours).
import { shuffle, pick, ri, chance } from '../../engine/util/rand.js';
import { numsCheck, choiceCheck } from '../../engine/answers/checks.js';

const LET = 'ABCDEGNPRSTUV'.split('');
/** noms des points : ceux par défaut, puis au hasard à partir de d = 2 */
export const names = (d, def) => (d >= 2 ? shuffle([...LET]).slice(0, def.length) : def.split(''));
/** orientation de la figure : fixe à d = 0, au hasard ensuite */
export const orient = d => (d >= 1 ? ri(0, 359) : 0);
/** orientation « douce » : multiple de 15° */
export const orient15 = d => (d >= 1 ? 15 * ri(0, 23) : 0);
export const near = (a, b) => Math.abs(a - b) < 1e-6;
/** nombre décimal à la française */
export const fr = n => (Math.round(n * 1e6) / 1e6 < 0 ? '−' : '') + String(Math.abs(Math.round(n * 1e6) / 1e6)).replace('.', ',');
export const cm = n => `${fr(n)} cm`;
export const deg = n => `${fr(n)}°`;
/** nom d'angle avec son chapeau (classe .ang du module angles, reprise dans style.css de ce module) */
export const H = s => `<span class="ang">${s}</span>`;
/** parenthèses d'un nom de droite : (AB) */
export const dr = (a, b) => `(${a}${b})`;
export { pick, ri, shuffle, chance };

/** question à cases numériques */
export function numQ(o) {
  const E = o.E;
  return {
    type: 'nums', tpl: o.tpl, check: numsCheck(E, { msg: v => (o.msg ? o.msg(v) || '' : '') }),
    keys: { neg: !!o.neg, comma: !!o.comma, ...(o.keys || {}) },
    html: o.html, visual: o.visual, afterVisual: o.after, replaceVisual: !!o.after, hint: o.hint, solution: o.solution,
    value: o.value, verify: o.verify,
  };
}
/** question à choix : o.opts = [{v, l}], o.good = v de la bonne réponse ; les choix sont mélangés */
export function choiceQ(o) {
  return {
    type: 'choice', opts: o.keep ? o.opts : shuffle([...o.opts]), check: choiceCheck(o.good, { msg: o.msg }),
    html: o.html, visual: o.visual, afterVisual: o.after, replaceVisual: !!o.after, hint: o.hint, solution: o.solution, verify: o.verify,
  };
}

/* ---------- cours ---------- */
/** exemple corrigé : titre (forme de l'énoncé) puis corps ; la réponse est toujours écrite par rep() */
export const ex = (q, body) => `<div class="ex"><span class="q">${q}</span><br>${body}</div>`;
/** présentation commune des réponses dans les exemples */
export const rep = s => `<b>Réponse : ${s}</b>`;
export const warn = (...l) => `<div class="warn">${l.map(s => '⚠️ ' + s).join('<br>')}</div>`;
export const retenir = s => `<div class="retenir">À retenir : ${s}</div>`;
export const meth = (...steps) => `<div class="methode"><b>Méthode</b><ol>${steps.map(s => `<li>${s}</li>`).join('')}</ol></div>`;
export const def = s => `<div class="def">${s}</div>`;
export const cours = (titre, intro, ...parts) => `<h2>${titre}</h2>\n<p class="intro">${intro}</p>\n${parts.join('\n')}`;
export const cols = (...f) => `<div class="cols">${f.join('')}</div>`;

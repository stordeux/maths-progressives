// Outils communs des niveaux de « Pensée informatique » : questions à cases ou à choix, exemples du cours, aides d'indice.
import { shuffle, pick, ri, chance } from '../../engine/util/rand.js';
import { numsCheck, choiceCheck } from '../../engine/answers/checks.js';
import { M } from '../../engine/util/fmt.js';
import { run, tb, tx, tableau, dirTexte } from './lang.js';
import { progSvg, grille, dual, figure } from './blocs.js';

export { shuffle, pick, ri, chance, M, run, tb, tx, tableau, dirTexte, progSvg, grille, dual, figure };

/** texte d'un nombre dans une phrase */
export const nb = n => M(n);
export const s = n => (Math.abs(n) > 1 ? 's' : '');
/** « 3 cases » */
export const cases = n => `${n} case${n > 1 ? 's' : ''}`;
export const sansFleche = hd => dirTexte(hd).slice(2);

/** question à cases numériques */
export function numQ(o) {
  const E = o.E;
  const q = {
    type: 'nums', tpl: o.tpl, labels: o.labels, check: numsCheck(E, { msg: v => (o.msg ? o.msg(v) || '' : '') }),
    keys: { neg: !!o.neg, comma: false },
    html: o.html, visual: o.visual ?? (o.prog ? progSvg(o.prog) : ''), afterVisual: o.after, replaceVisual: !!o.after && o.replace !== false,
    hint: o.hint, solution: o.solution, value: o.value, verify: o.verify,
  };
  q.rep = o.tpl.replace(/\{(\d+)\}/g, (_, i) => M(E[+i]));
  return q;
}
/** question à choix : opts = [{ v, l }] (l : HTML), good = v de la bonne réponse ; texte : réponse écrite dans le cours */
export function choiceQ(o) {
  const q = {
    type: 'choice', opts: o.keep ? o.opts : shuffle([...o.opts]), check: choiceCheck(o.good, { msg: o.msg }),
    html: o.html, visual: o.visual ?? (o.prog ? progSvg(o.prog) : ''), afterVisual: o.after, replaceVisual: !!o.after && o.replace !== false,
    hint: o.hint, solution: o.solution, verify: o.verify,
  };
  q.rep = o.texte ?? o.opts.find(x => String(x.v) === String(o.good)).l;
  return q;
}
export const OUI_NON = [{ v: 'oui', l: 'Oui' }, { v: 'non', l: 'Non' }];
export const LETTRES = ['A', 'B', 'C', 'D'];
/** options « programme A, B, C » : un dessin par option ; ordre mélangé puis relettré ; renvoie { opts, good } */
export function optsProgs(progs, iBon, o = {}) {
  const ordre = o.ordre || shuffle(progs.map((_, i) => i));
  const opts = ordre.map((i, k) => ({ v: LETTRES[k], l: `<span class="optprog"><b>${LETTRES[k]}</b>${progSvg(progs[i], { echelle: o.echelle ?? 0.78 })}</span>` }));
  return { opts, good: LETTRES[ordre.indexOf(iBon)], ordre };
}

/* ---------- cours ---------- */
/** exemple corrigé : même énoncé, même dessin et même solution que l'exercice ; la réponse est écrite par « Réponse : … » */
export const ex = (q, corps) => `<div class="ex"><span class="q">${q}</span><br>${corps}</div>`;
export function exQ(q) {
  const vis = q.afterVisual ? (q.replaceVisual ? q.afterVisual : q.visual + q.afterVisual) : q.visual;
  return ex(q.html, `${vis}<div class="sol">${q.solution}</div><b>Réponse : ${q.rep}</b>`);
}
export const warn = (...l) => `<div class="warn">${l.map(t => '⚠️ ' + t).join('<br>')}</div>`;
export const retenir = t => `<div class="retenir">À retenir : ${t}</div>`;
export const meth = (...steps) => `<div class="methode"><b>Méthode</b><ol>${steps.map(t => `<li>${t}</li>`).join('')}</ol></div>`;
export const def = t => `<div class="def">${t}</div>`;
export const cours = (titre, intro, ...parts) => `<h2>${titre}</h2>\n<p class="intro">${intro}</p>\n${parts.join('\n')}`;
export const cols = (...f) => `<div class="cols">${f.join('')}</div>`;

/* ---------- aides pour les indices et les solutions ---------- */
/** première étape d'un programme de lutin : « avancer de 3 cases » : de (2 ; 3) à (5 ; 3) */
export function premierPas(prog, st) {
  const b = prog[0];
  if (b.t === 'rep') return `Le bloc « ${tb(b)} » refait ${b.body.length > 1 ? 'tous les blocs qu\'il contient' : 'le bloc qu\'il contient'} à chaque tour.`;
  const r = run([b], st);
  if (b.t === 'av') return `Premier bloc, « ${tb(b)} » : le lutin va de (${st.x} ; ${st.y}) à (${r.x} ; ${r.y}).`;
  return `Premier bloc, « ${tb(b)} » : le lutin regarde alors ${sansFleche(r.hd)}.`;
}
/** compare deux listes de nombres */
export const egal = (a, b) => a.length === b.length && a.every((x, i) => Math.abs(x - b[i]) < 1e-9);

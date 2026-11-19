// Aides communes aux niveaux du module « Statistiques de 3e ».
import { approx } from '../../engine/util/arith.js';
import { M } from '../../engine/util/fmt.js';
import { numsCheck } from '../../engine/answers/checks.js';

export const big = s => `<div class="big">${s}</div>`;
export const list = a => a.map(M).join(' ; ');
export const COMMA = { comma: true };
export const NOCOMMA = { comma: false };
/** « 1 élève », « 5 élèves » */
export const pl = (n, mot, mots = mot + 's') => `${M(n)} ${n > 1 ? mots : mot}`;
/** valeur avec son unité : « 15 min » */
export const fv = (v, u) => `${M(v)}${u}`;

/** check « un nombre » avec messages « presque juste » : near = [[valeur, message], …] */
export function numCheck(X, near = []) {
  return numsCheck([X], { msg: v => { const hit = near.find(([y]) => !approx(y, X) && approx(v[0], y)); return hit ? hit[1] : ''; } });
}
/** check de plusieurs cases : near[i] = [[valeur, message], …] pour la case i */
export function multiCheck(E, near = []) {
  return numsCheck(E, { msg: v => {
    for (let i = 0; i < E.length; i++) { const hit = (near[i] || []).find(([y]) => !approx(y, E[i]) && approx(v[i], y)); if (hit && !approx(v[i], E[i])) return hit[1]; }
    return '';
  } });
}

/** phrases des questions sur un tableau : « les élèves dont la note est d'au plus 12 » */
export const dont = (T, kind, v) => {
  const { np, ent, u } = T.C, f = np.startsWith('la ') ? 'e' : '';
  if (kind === 'between') return `${ent} dont ${np} est compris${f} entre ${fv(v[0], u)} et ${fv(v[1], u)} (bornes comprises)`;
  const val = fv(v, u);
  return kind === 'eq' ? `${ent} dont ${np} est de ${val}` : kind === 'max' ? `${ent} dont ${np} est d'au plus ${val}` : kind === 'min' ? `${ent} dont ${np} est d'au moins ${val}` : `${ent} dont ${np} est strictement supérieur${f} à ${val}`;
};

/** exemple corrigé du cours */
export const ex = (q, corr) => `<div class="ex"><span class="q">${q}</span><br>${corr}</div>`;
export const warn = (...l) => `<div class="warn">${l.map(x => '⚠️ ' + x).join('<br>')}</div>`;
export const retenir = t => `<div class="retenir">À retenir : ${t}</div>`;
export const methode = (...l) => `<div class="methode"><b>Méthode</b><ol>${l.map(x => `<li>${x}</li>`).join('')}</ol></div>`;

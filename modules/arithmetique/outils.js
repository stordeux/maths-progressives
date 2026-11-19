// Outils communs des niveaux d'Arithmétique : calculs sur les entiers, affichage, gabarits de réponse.
import { ri, pick, shuffle } from '../../engine/util/rand.js';
import { gcd, lcm } from '../../engine/util/arith.js';
import { choiceCheck } from '../../engine/answers/checks.js';

export { gcd as pgcd, lcm as ppcm };

/** diviseurs de n, dans l'ordre croissant */
export function diviseurs(n) {
  const a = [], b = [];
  for (let i = 1; i * i <= n; i++) if (n % i === 0) { a.push(i); if (i * i !== n) b.push(n / i); }
  return a.concat(b.reverse());
}
export function estPremier(n) {
  if (n < 2) return false;
  for (let i = 2; i * i <= n; i++) if (n % i === 0) return false;
  return true;
}
export const premiersJusqua = n => { const r = []; for (let i = 2; i <= n; i++) if (estPremier(i)) r.push(i); return r; };
/** décomposition : [[p, e], …] */
export function facteurs(n) {
  const r = [];
  for (let p = 2; p * p <= n; p++) if (n % p === 0) { let e = 0; while (n % p === 0) { n /= p; e++; } r.push([p, e]); }
  if (n > 1) r.push([n, 1]);
  return r;
}
/** plus petit diviseur premier */
export const petitFacteur = n => { for (let p = 2; p * p <= n; p++) if (n % p === 0) return p; return n; };
/** valeur d'une décomposition [[p, e], …] */
export const valeur = f => f.reduce((s, [p, e]) => s * Math.pow(p, e), 1);

/* ---------- affichage ---------- */
export const big = s => `<div class="big">${s}</div>`;
/** nombre en français : espace insécable tous les 3 chiffres à partir de 5 chiffres */
export const gr = n => (Math.abs(n) >= 10000 ? String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ' ') : String(n));
export const sup = e => `<sup>${e}</sup>`;
/** puissance de p : « 2<sup>3</sup> », ou « 3 » si e = 1 */
export const pw = (p, e) => (e === 1 ? String(p) : `${p}${sup(e)}`);
/** décomposition écrite : « 2<sup>2</sup> × 3 × 5 » */
export const fdec = f => f.map(([p, e]) => pw(p, e)).join(' × ');
/** décomposition écrite sans exposant : « 2 × 2 × 3 × 5 » */
export const fdecLong = f => f.flatMap(([p, e]) => Array(e).fill(p)).join(' × ');
/** case surélevée (exposant) dans un gabarit */
export const EXP = i => `<span style="margin:0 0 44px -6px;font-size:.85em">{${i}}</span>`;
/** liste « a, b et c » */
export const et = l => (l.length < 2 ? l.join('') : l.slice(0, -1).join(', ') + ' et ' + l[l.length - 1]);
export const liste = l => l.map(gr).join(', ');

export const OUI_NON = [{ v: 'oui', l: 'Oui' }, { v: 'non', l: 'Non' }];
export const yn = b => (b ? 'oui' : 'non');
/** choix de nombres : toutes les valeurs, bonne réponse E (la bonne réponse est stockée en texte) */
export const choixNombres = vals => shuffle(vals.slice()).map(x => ({ v: String(x), l: gr(x) }));

/** un exemple corrigé du cours */
export const ex = (q, corps) => `<div class="ex"><span class="q">${q}</span><br>${corps}</div>`;
export const warn = t => `<div class="warn">${t}</div>`;
export const retenir = t => `<div class="retenir">À retenir : ${t}</div>`;
export const methode = l => `<div class="methode"><b>Méthode</b><ol>${l.map(x => `<li>${x}</li>`).join('')}</ol></div>`;
export const def = t => `<div class="def">${t}</div>`;
export const cols = (a, b) => `<div class="cols">${a}${b}</div>`;

/** tirage sans répétition dans [lo ; hi] qui vérifie ok */
export function tirer(lo, hi, ok = () => true, essais = 400) {
  for (let i = 0; i < essais; i++) { const v = ri(lo, hi); if (ok(v)) return v; }
  for (let v = lo; v <= hi; v++) if (ok(v)) return v;
  throw new Error(`aucun entier dans [${lo} ; ${hi}]`);
}
/** tire parmi les entiers [lo ; hi] qui ont n diviseurs au plus */
export const petitsDiv = (lo, hi, max, min = 2) => tirer(lo, hi, v => { const k = diviseurs(v).length; return k <= max && k >= min; });

/** prénoms et accord : pour les énoncés de problèmes */
export { ri, pick, shuffle };

/** check d'un choix « oui / non » avec message par réponse */
export const checkOuiNon = (E, msgSiFaux) => choiceCheck(E, { msg: c => msgSiFaux(c) });

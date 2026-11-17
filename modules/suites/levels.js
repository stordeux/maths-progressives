// Suites (1re spécialité) : 12 niveaux, du calcul d'un terme jusqu'aux seuils.
// Vérifications indépendantes : les réponses attendues viennent des formules du cours (formule explicite,
// u₀ + n·r, u₀·qⁿ, sommes (n + 1)(u₀ + uₙ)/2 et (1 − qⁿ⁺¹)/(1 − q), seuils par logarithme) ;
// les champs verify / value les recalculent AUTREMENT : en itérant la récurrence dans une boucle,
// en sommant terme à terme, en relisant la position d'un point dessiné, en classant des listes de termes
// d'après leurs différences et leurs quotients.
// Visuels : nuage de points (n ; uₙ), escalier de récurrence, seuil horizontal.
import { ri, pick, nz, chance } from '../../engine/util/rand.js';
import { numsCheck, choiceCheck } from '../../engine/answers/checks.js';
import { M, P, F, big, terms, sgn } from '../../engine/util/fmt.js';
import { r6 } from '../../engine/util/arith.js';
import { nuage, lireNuage, escalier, gauss, somme2 } from './draw.js';

/* ================= écriture ================= */
const U = (k, nom = 'u') => `${nom}<sub>${k}</sub>`;
const UN = U('n'), UN1 = U('n+1');
/** étiquette « uₖ = » d'un gabarit de réponse (un seul bloc : le gabarit est un conteneur flex) */
const TU = k => `<span>${U(k)} =</span>`;
const N2 = 'n<sup>2</sup>';
const near = (a, b, t = 1e-6) => a !== null && b !== null && a !== undefined && Math.abs(a - b) <= t * Math.max(1, Math.abs(a), Math.abs(b));
/** « + 3 » / « − 3 » dans une somme, rien si 0 */
const plus = n => (n === 0 ? '' : ' ' + sgn(n));
/** coefficient multiplicatif devant un facteur : 1 → '', −1 → '−', sinon « k × » */
const kx = k => (k === 1 ? '' : k === -1 ? '−' : `${M(k)} × `);
/** puissance q^e avec parenthèses si q < 0 ou décimal */
const pw = (q, e) => `${q < 0 || !Number.isInteger(q) ? `(${M(q)})` : M(q)}<sup>${e}</sup>`;
/** récurrence uₙ₊₁ = a uₙ + b */
const recAff = (a, b) => `${UN1} = ${terms([[a, UN], [b, '']])}`;
/** tableau n | uₙ */
function tab(idx, vals, nom = 'u') {
  return `<div class="tablewrap"><table class="data"><tr><th>n</th>${idx.map(k => `<td>${k}</td>`).join('')}</tr>`
    + `<tr><th>${U('n', nom)}</th>${vals.map(v => `<td>${M(v)}</td>`).join('')}</tr></table></div>`;
}
/** bloc de code Python (algorithme de seuil) */
const PY = lines => `<pre style="text-align:left;display:inline-block;background:#f1f3f5;border-radius:8px;padding:8px 16px;margin:6px 0;font-size:.92em;line-height:1.5;white-space:pre;overflow-x:auto;max-width:100%">${lines.join('\n')}</pre>`;
/** check « cases » avec un message ciblé quand la réponse est fausse */
function chk(E, msg) {
  return numsCheck(E, { msg: v => (v.some(x => x === null) ? '' : msg ? msg(v) || '' : '') });
}
/** liste des termes [u_s, …, u_{s+k}] en itérant u ← next(u, n) (vérifications) */
function iterate(us, s, k, next) { const out = [us]; let u = us; for (let n = s; n < s + k; n++) { u = next(u, n); out.push(u); } return out; }
const pts = (s, vals) => vals.map((v, i) => [s + i, r6(v)]);
/** nombre écrit exactement s'il a au plus 2 décimales, sinon arrondi au centième précédé de « ≈ » */
const A2 = x => (Math.abs(r6(x * 100) - Math.round(x * 100)) < 1e-9 ? M(r6(x)) : '≈ ' + M(Math.round(x * 100) / 100));

/* ================= encarts de cours ================= */
/** exemple corrigé : énoncé en gras puis correction */
const EXC = (q, body) => `<div class="ex"><span class="q">${q}</span><br>${body}</div>`;
/** encadré « Méthode » */
const METH = steps => `<div class="methode"><b>Méthode</b><ol>${steps.map(s => `<li>${s}</li>`).join('')}</ol></div>`;
/** figure avec une légende courte en dessous */
const FIG = (svg, cap) => `<div>${svg}<div style="text-align:center;font-size:.92em;margin-top:-4px">${cap}</div></div>`;

/* =====================================================================
   1. Terme d'une suite explicite uₙ = f(n)
   ===================================================================== */
function L1(d) {
  const kind = d < 1 ? 'lin0' : d < 2 ? 'lin' : d < 3 ? 'quad0' : d < 4 ? 'quad' : d < 5 ? 'pow' : pick(['quad', 'pow', 'lin']);
  let a2 = 0, a1 = 0, a0 = 0, k = 1, b = 2, c = 0, p, tex;
  if (kind === 'lin0') { a1 = ri(2, 6); a0 = ri(0, 9); p = ri(1, 6); }
  else if (kind === 'lin') { a1 = nz(-7, 7); a0 = ri(-9, 9); p = ri(2, 10); }
  else if (kind === 'quad0') { a2 = 1; a1 = ri(-5, 5); a0 = ri(-5, 9); p = ri(2, 8); }
  else if (kind === 'quad') { a2 = pick([2, -1, 3, -2]); a1 = ri(-6, 6); a0 = ri(-9, 9); p = ri(2, 9); }
  else { b = pick([2, 3]); k = pick([1, 2, 3, -2, 5]); c = ri(-9, 9); p = ri(2, b === 2 ? 9 : 6); }
  const pow = kind === 'pow';
  const f = pow ? n => k * b ** n + c : n => a2 * n * n + a1 * n + a0;
  tex = pow ? `${kx(k)}${b}<sup>n</sup>${plus(c)}` : terms([[a2, N2], [a1, 'n'], [a0, '']]);
  const E = f(p);
  // calcul indépendant : on part de u₀ et on ajoute les écarts uⱼ₊₁ − uⱼ (calculés à part), ou on multiplie par b
  let val;
  if (pow) { let t = k; for (let j = 0; j < p; j++) t *= b; val = t + c; }
  else { val = a0; for (let j = 0; j < p; j++) val += a2 * (2 * j + 1) + a1; }
  const viaF = d >= 3 && !pow && chance(0.5);
  const html = viaF
    ? `Soit f(x) = ${terms([[a2, 'x<sup>2</sup>'], [a1, 'x'], [a0, '']])} et la suite (${UN}) définie pour tout entier n ≥ 0 par ${UN} = f(n).<br>Calcule ${U(p)}.`
    : `La suite (${UN}) est définie pour tout entier n ≥ 0 par :${big(`${UN} = ${tex}`)}Calcule ${U(p)}.`;
  const sub = pow ? `${kx(k)}${b}<sup>${p}</sup>${plus(c)} = ${kx(k)}${b ** p}${plus(c)}`
    : [a2 ? `${a2 === 1 ? '' : a2 === -1 ? '−' : M(a2) + ' × '}${p}<sup>2</sup>` : '', a1 ? `${a2 ? (a1 < 0 ? ' − ' : ' + ') : a1 < 0 ? '−' : ''}${Math.abs(a1) === 1 ? '' : M(Math.abs(a1)) + ' × '}${p}` : '', a0 ? ' ' + sgn(a0) : ''].join('')
      + (a2 ? ` = ${M(a2 * p * p)}${a1 ? ' ' + sgn(a1 * p) : ''}${plus(a0)}` : '');
  return {
    type: 'nums', html, tpl: `${TU(p)} {0}`,
    check: chk([E], v => {
      if (near(v[0], f(p + 1)) || near(v[0], f(p - 1))) return `Tu as calculé un terme voisin. Pour ${U(p)}, on remplace n par <b>${p}</b> exactement.`;
      if (a2 && near(v[0], a2 * 2 * p + a1 * p + a0)) return `⚠️ ${p}<sup>2</sup> = ${p} × ${p}, pas 2 × ${p}.`;
      if (pow && near(v[0], k * b * p + c)) return `⚠️ ${b}<sup>${p}</sup> = ${Array(p).fill(b).join(' × ')}, pas ${b} × ${p}.`;
      return '';
    }),
    value: val,
    hint: `Remplace <b>n</b> par <b>${p}</b> dans la formule${viaF ? ` : ${U(p)} = f(${p})` : ''}, puis calcule${a2 || pow ? ' (la puissance d\'abord)' : ''}.`,
    solution: `${U(p)} = ${sub} = <b>${M(E)}</b>.`,
    afterVisual: nuage({ pts: pts(0, [...Array(Math.max(p + 2, 7))].map((_, n) => f(n))), hl: [p], aria: 'nuage de points des premiers termes' }),
  };
}
function C1() {
  const f = n => n * n - 4 * n + 5;
  return `<h2>1. Suite définie par une formule</h2>
<p class="intro">Une suite, c'est une liste de nombres numérotés : ${U(0)}, ${U(1)}, ${U(2)}… Avec une formule, tu peux calculer directement le terme que tu veux, sans calculer les autres.</p>
<div class="def">Une <b>suite</b> (${UN}) associe à chaque entier naturel n un nombre ${UN}, le <b>terme de rang n</b>.<br>Quand on a une formule ${UN} = f(n), la suite est définie de façon <b>explicite</b>.</div>
${METH([`Repère le rang demandé : pour ${U(5)}, c'est n = 5.`, 'Remplace <b>chaque</b> n de la formule par ce nombre (avec des parenthèses s\'il le faut).', 'Calcule dans l\'ordre des priorités : puissances, puis multiplications, puis additions.', `Si on te donne f(x) et ${UN} = f(n), calcule simplement f(5).`])}
${EXC(`Exemple 1 : ${UN} = n<sup>2</sup> − 4n + 5. Calcule ${U(3)} et ${U(6)}.`, `${U(3)} = 3<sup>2</sup> − 4 × 3 + 5 = 9 − 12 + 5 = <b>2</b>.<br>${U(6)} = 6<sup>2</sup> − 4 × 6 + 5 = 36 − 24 + 5 = <b>17</b>.`)}
${EXC(`Exemple 2 : ${UN} = −2n<sup>2</sup> + 3n + 1. Calcule ${U(4)}.`, `${U(4)} = −2 × 4<sup>2</sup> + 3 × 4 + 1 = −2 × 16 + 12 + 1 = −32 + 13 = <b>−19</b>.<br>Le carré porte sur 4 seulement : on calcule 4<sup>2</sup> = 16 avant de multiplier par −2.`)}
${EXC(`Exemple 3 : ${UN} = 3 × 2<sup>n</sup> − 5. Calcule ${U(4)}.`, `2<sup>4</sup> = 2 × 2 × 2 × 2 = 16, donc ${U(4)} = 3 × 16 − 5 = <b>43</b>.`)}
<div class="cols"><div class="warn">⚠️ ${U(3)} n'est pas ${UN} + 3 : c'est le terme obtenu en remplaçant n par 3.<br>⚠️ ${N2} = n × n : pour n = 3, c'est 9 et pas 6.<br>⚠️ 2<sup>5</sup> = 32, pas 2 × 5 = 10.<br>⚠️ Ne te trompe pas de rang : ${U(4)} et ${U(5)} sont deux termes voisins, différents.</div>
${FIG(nuage({ pts: pts(0, [0, 1, 2, 3, 4, 5, 6].map(f)), hl: [3], vals: true }), `Les points (n ; ${UN}) de l'exemple 1 : des points <b>isolés</b>, qu'on ne relie pas.`)}</div>
<div class="retenir">À retenir : pour calculer ${UN} avec une formule explicite, on remplace n par le rang voulu.</div>`;
}

/* =====================================================================
   2. Suite récurrente uₙ₊₁ = f(uₙ)
   ===================================================================== */
function L2(d) {
  let kind = 'aff', a = 2, b, k = 0, c = 0, s = 0, us;
  const v = d < 5 ? d : pick([2, 3, 4, 5]);
  if (v === 0) { a = 2; b = ri(1, 4); us = ri(0, 4); }
  else if (v === 1) { a = pick([2, 3]); b = nz(-5, 5); us = ri(-3, 5); }
  else if (v === 2) { a = pick([-1, -2, 3]); b = nz(-5, 5); us = ri(-4, 5); }
  else if (v === 3) { a = pick([-2, -3, 0.5]); b = a === 0.5 ? 2 * nz(-4, 4) : nz(-5, 5); us = a === 0.5 ? 4 * ri(-5, 10) : ri(-4, 4); }
  else if (v === 4) { kind = 'n'; k = pick([1, 2, 3]); c = ri(-4, 4); us = ri(-5, 8); }
  else { s = 1; if (chance(0.5)) { kind = 'n'; k = pick([2, -1, 3, -2]); c = ri(-4, 4); us = ri(-5, 8); } else { a = pick([2, -2, 3, 0.5]); b = a === 0.5 ? 2 * nz(-4, 4) : nz(-5, 5); us = a === 0.5 ? 4 * ri(-5, 10) : ri(-4, 4); } }
  if (kind === 'aff' && near(us, b / (1 - a))) us += a === 0.5 ? 4 : 1; // pas de suite constante
  const next = kind === 'aff' ? (u => a * u + b) : ((u, n) => u + k * n + c);
  const tex = kind === 'aff' ? recAff(a, b) : `${UN1} = ${terms([[1, UN], [k, 'n'], [c, '']])}`;
  // réponse : formules fermées ; vérification : la boucle
  let E;
  if (kind === 'aff') { const l = b / (1 - a); E = [1, 2, 3].map(j => r6(a ** j * (us - l) + l)); }
  else E = [1, 2, 3].map(j => r6(us + c * j + k * ((s + j - 1) * (s + j) / 2 - (s - 1) * s / 2)));
  const idx = [s + 1, s + 2, s + 3], T = [us, ...E];
  const html = `La suite (${UN}) est définie par ${U(s)} = ${M(us)} et, pour tout entier n ≥ ${s} :${big(tex)}Calcule les trois termes suivants.`;
  const step = j => kind === 'aff'
    ? `${U(idx[j])} = ${a === 1 ? '' : a === -1 ? '−' : M(a) + ' × '}${P(T[j])}${plus(b)} = <b>${M(T[j + 1])}</b>`
    : `${U(idx[j])} = ${P(T[j])}${k ? ` ${k < 0 ? '−' : '+'} ${Math.abs(k) === 1 ? '' : M(Math.abs(k)) + ' × '}${s + j}` : ''}${plus(c)} = <b>${M(T[j + 1])}</b> (on prend n = ${s + j})`;
  return {
    type: 'nums', html, keys: { comma: a === 0.5 },
    tpl: idx.map((k2, j) => `${TU(k2)} {${j}}`).join(' &nbsp; '),
    check: chk(E, w => {
      if (kind === 'aff' && near(w[0], a * (us + b)) && !near(a * (us + b), E[0])) return `Priorités : on <b>multiplie</b> ${U(s)} par ${M(a)}, <b>puis</b> on ajoute ${M(b)}.`;
      if (kind === 'aff' && near(w[0], a * us)) return `N'oublie pas d'ajouter ${M(b)} après la multiplication.`;
      if (kind === 'n' && near(w[0], us + k * (s + 1) + c) && k) return `Dans la formule, n est l'indice du terme <b>d'avant</b> : pour calculer ${U(s + 1)}, on prend n = ${s}.`;
      if (near(w[0], E[0]) && near(w[1], E[0]) && !near(E[0], E[1])) return `${U(s + 2)} se calcule à partir de ${U(s + 1)} : on réapplique la règle au terme qu'on vient de trouver.`;
      return '';
    }),
    verify: Ev => iterate(us, s, 3, next).slice(1).every((x, i) => near(x, Ev[i])),
    hint: `On obtient chaque terme à partir du <b>précédent</b> : ${U(s + 1)} = règle appliquée à ${U(s)} = ${M(us)}${kind === 'n' ? ` avec n = ${s}` : ''}, puis ${U(s + 2)} à partir de ${U(s + 1)}…`,
    solution: [0, 1, 2].map(step).join('<br>'),
    afterVisual: kind === 'aff' ? escalier({ f: next, u0: us, k: 3, s, fl: `y = ${terms([[a, 'x'], [b, '']])}` })
      : nuage({ pts: pts(s, T), vals: true }),
  };
}
function C2() {
  return `<h2>2. Suite définie par récurrence</h2>
<p class="intro">Parfois, on ne connaît pas de formule directe : on sait seulement comment passer d'un terme au suivant. C'est comme une chaîne : chaque maillon se fabrique à partir du précédent.</p>
<div class="def">Une suite est définie <b>par récurrence</b> quand on donne son <b>premier terme</b> et une règle pour passer d'un terme au <b>suivant</b> :<br>${U(0)} donné et ${UN1} = f(${UN}) pour tout n.<br>Pour calculer ${U(3)}, il faut d'abord ${U(1)}, puis ${U(2)}.</div>
${METH([`Pars du terme donné (${U(0)}, ou ${U(1)} si la suite commence à 1).`, `Applique la règle à ce terme : tu obtiens le suivant. Mets les nombres négatifs entre parenthèses.`, `Recommence avec le terme que tu viens de trouver, autant de fois que nécessaire.`, `Si la règle contient aussi n, prends pour n le rang du terme <b>de départ</b> : ${U(1)} se calcule avec n = 0.`])}
${EXC(`Exemple 1 : ${U(0)} = 1 et ${recAff(2, 3)}. Calcule ${U(1)}, ${U(2)}, ${U(3)}.`, `${U(1)} = 2 × 1 + 3 = <b>5</b> ; ${U(2)} = 2 × 5 + 3 = <b>13</b> ; ${U(3)} = 2 × 13 + 3 = <b>29</b>.`)}
${EXC(`Exemple 2 : ${U(0)} = 2 et ${recAff(-3, 1)}.`, `${U(1)} = −3 × 2 + 1 = <b>−5</b> ; ${U(2)} = −3 × (−5) + 1 = 15 + 1 = <b>16</b> ; ${U(3)} = −3 × 16 + 1 = <b>−47</b>.<br>On multiplie d'abord, puis on ajoute.`)}
${EXC(`Exemple 3 : ${U(0)} = 4 et ${UN1} = ${UN} + 2n − 1.`, `${U(1)} = ${U(0)} + 2 × 0 − 1 = <b>3</b> (n = 0) ; ${U(2)} = ${U(1)} + 2 × 1 − 1 = <b>4</b> (n = 1) ; ${U(3)} = ${U(2)} + 2 × 2 − 1 = <b>7</b> (n = 2).`)}
<div class="warn">⚠️ ${UN1} n'est pas ${UN} + 1 : c'est le terme <b>qui suit</b> ${UN}.<br>⚠️ ${U(2)} se calcule à partir de ${U(1)}, pas à partir de ${U(0)}.<br>⚠️ Priorités : 2 × ${UN} + 3, c'est « fois 2 » <b>puis</b> « plus 3 ».</div>
<div class="cols"><p><b>L'escalier</b> (ici ${U(0)} = 0 et ${UN1} = 0,5${UN} + 4) : on part de ${U(0)} sur l'axe horizontal et on monte jusqu'à la droite y = f(x) : on est à la hauteur ${U(1)}. On va à l'horizontale jusqu'à la droite y = x : on est alors au-dessus de ${U(1)} sur l'axe horizontal. On remonte jusqu'à y = f(x) pour obtenir ${U(2)}, et ainsi de suite.</p>
${escalier({ f: x => 0.5 * x + 4, u0: 0, k: 3, fl: 'y = 0,5x + 4' })}</div>
<div class="retenir">À retenir : par récurrence, on avance pas à pas ; chaque terme se calcule avec le précédent.</div>`;
}

/* =====================================================================
   3. Lire des termes sur la représentation graphique
   ===================================================================== */
function L3(d) {
  const N = d < 4 ? 8 : 10;
  const draw = () => [...Array(N)].map(() => (d < 1 ? ri(1, 9) : d < 2 ? ri(0, 12) : ri(-5, 9)));
  let vals = draw(), p, q, mode = d < 4 ? 'un' : d < 5 ? 'deux' : 'rang';
  if (mode === 'rang') { p = ri(1, N - 1); let g = 0; while (vals.filter(v => v === vals[p]).length > 1 && g++ < 50) vals = draw(); if (vals.filter(v => v === vals[p]).length > 1) mode = 'un'; }
  if (mode !== 'rang') p = ri(d < 1 ? 0 : 1, N - 1);
  if (mode === 'deux') { do q = ri(1, N - 1); while (q === p); if (q < p) [p, q] = [q, p]; }
  const P0 = pts(0, vals), yr = [Math.min(0, ...vals) - 1, Math.max(...vals) + 2];
  const visual = nuage({ pts: P0, ask: mode === 'un' ? p : mode === 'deux' ? [p, q] : undefined, yr, grid1: true });
  const after = nuage({ pts: P0, hl: mode === 'deux' ? [p, q] : [p], yr, grid1: true });
  const v = vals[p];
  if (mode === 'rang') {
    return {
      type: 'nums', html: `Voici la représentation graphique de la suite (${UN}) : les points de coordonnées (n ; ${UN}).<br>Pour quel entier n a-t-on <b>${UN} = ${M(v)}</b> ?`,
      visual, afterVisual: after, replaceVisual: true, keys: { neg: false, comma: false }, tpl: 'n = {0}',
      check: chk([p], w => (vals.includes(w[0]) ? `${M(w[0])} est une <b>valeur</b> sur l'axe vertical. On demande le <b>rang</b> n, lu sur l'axe horizontal.` : '')),
      verify: Ev => Math.abs(lireNuage(visual, Ev[0]) - v) < 0.05,
      hint: `Repère la hauteur ${M(v)} sur l'axe vertical, cherche le point situé à cette hauteur, puis lis son abscisse n.`,
      solution: `Le point de hauteur ${M(v)} est le point (${p} ; ${M(v)}) : <b>n = ${p}</b>, c'est-à-dire ${U(p)} = ${M(v)}.`,
    };
  }
  const E = mode === 'deux' ? [vals[p], vals[q]] : [v];
  return {
    type: 'nums', html: `Voici la représentation graphique de la suite (${UN}) : les points de coordonnées (n ; ${UN}).<br>Lis ${mode === 'deux' ? `${U(p)} et ${U(q)}` : U(p)}.`,
    visual, afterVisual: after, replaceVisual: true, keys: { comma: false },
    tpl: mode === 'deux' ? `${TU(p)} {0} &nbsp; ${TU(q)} {1}` : `${TU(p)} {0}`,
    check: chk(E, w => {
      if (mode === 'un' && w[0] === p && p !== v) return `${p}, c'est le <b>rang</b> (axe horizontal). ${U(p)} est la <b>hauteur</b> du point d'abscisse ${p}.`;
      if (mode === 'un' && (w[0] === vals[p - 1] || w[0] === vals[p + 1])) return `C'est la hauteur d'un point voisin : compte bien les rangs à partir de <b>0</b>.`;
      if (mode === 'deux' && w[0] === E[1] && w[1] === E[0]) return 'Les deux valeurs sont inversées.';
      return '';
    }),
    verify: Ev => (mode === 'deux' ? [p, q] : [p]).every((k, i) => Math.abs(lireNuage(visual, k) - Ev[i]) < 0.05),
    hint: `Le point d'abscisse n a pour ordonnée ${UN}. Pars de n = ${p} sur l'axe horizontal (le premier point est n = 0), monte jusqu'au point et lis sa hauteur.`,
    solution: mode === 'deux' ? `Point d'abscisse ${p} : hauteur ${M(vals[p])}, donc <b>${U(p)} = ${M(vals[p])}</b>.<br>Point d'abscisse ${q} : hauteur ${M(vals[q])}, donc <b>${U(q)} = ${M(vals[q])}</b>.`
      : `Le point d'abscisse ${p} est à la hauteur ${M(v)} : <b>${U(p)} = ${M(v)}</b>.`,
  };
}
function C3() {
  return `<h2>3. Représentation graphique</h2>
<p class="intro">Un graphique permet de voir d'un coup d'œil comment évoluent les termes d'une suite. Il faut savoir y lire un terme, et retrouver un rang.</p>
<div class="def">Dans un repère, la suite (${UN}) est représentée par le <b>nuage de points</b> de coordonnées <b>(n ; ${UN})</b> : un point au-dessus de chaque entier n.<br>L'abscisse est le <b>rang</b> n (axe horizontal), l'ordonnée est la <b>valeur</b> ${UN} (axe vertical).</div>
${METH([`Pour lire ${U(4)} : pars de 4 sur l'axe <b>horizontal</b>, monte (ou descends) jusqu'au point, puis lis sa hauteur sur l'axe vertical.`, `Compte les rangs à partir de <b>0</b> : le premier point est en général celui de ${U(0)}.`, `Pour trouver le rang n tel que ${UN} = 8 : repère la hauteur 8 sur l'axe vertical, cherche le point à cette hauteur et lis son <b>abscisse</b>.`])}
<div class="cols"><div>${EXC(`Exemple 1 : lis ${U(4)} et ${U(2)}.`, `Le point d'abscisse 4 est à la hauteur 6 : <b>${U(4)} = 6</b>.<br>Le point d'abscisse 2 est à la hauteur 1 : <b>${U(2)} = 1</b>.`)}
${EXC(`Exemple 2 : pour quel n a-t-on ${UN} = 8 ?`, `Le seul point à la hauteur 8 est le point (6&nbsp;;&nbsp;8) : <b>n = 6</b>, c'est-à-dire ${U(6)} = 8.<br>On répond par le <b>rang</b> 6, pas par la valeur 8.`)}</div>
${nuage({ pts: pts(0, [3, 2, 1, 4, 6, 5, 8]), hl: [2, 4, 6], grid1: true })}</div>
<div class="warn">⚠️ Ne confonds pas le <b>rang</b> n (en bas) et la <b>valeur</b> ${UN} (la hauteur).<br>⚠️ Le premier point est souvent n = 0 : ne te décale pas en comptant.<br>⚠️ On ne relie pas les points : la suite n'a pas de valeur entre deux entiers.</div>
<div class="retenir">À retenir : le point (n ; ${UN}) a pour abscisse le rang et pour ordonnée la valeur du terme.</div>`;
}

/* =====================================================================
   4. Suite arithmétique : raison et terme suivant
   ===================================================================== */
function L4(d) {
  let s = 0, u0, r;
  if (d < 1) { u0 = ri(0, 20); r = ri(2, 9); }
  else if (d < 2) { u0 = ri(-20, 20); r = nz(-9, 9); }
  else if (d < 3) { s = ri(1, 6); u0 = ri(-20, 30); r = nz(-12, 12); }
  else if (d < 4) { s = ri(0, 4); r = (2 * ri(-5, 4) + 1) / 2; u0 = ri(-10, 10) + (chance(0.5) ? 0.5 : 0); }
  else if (d < 5) { s = ri(0, 8); u0 = ri(-60, 60); r = nz(-25, 25); }
  else { s = ri(0, 8); r = pick([1, -1]) * pick([3, 7, 9, 11, 13, 17]) / 10; u0 = ri(-50, 50) / 10; }
  const T = [0, 1, 2, 3].map(j => r6(u0 + j * r)), nx = r6(u0 + 4 * r), idx = [s, s + 1, s + 2, s + 3];
  const E = [r, nx];
  return {
    type: 'nums',
    html: `La suite (${UN}) est <b>arithmétique</b>. Voici quatre termes consécutifs :${tab(idx, T)}Donne sa raison r et le terme suivant ${U(s + 4)}.`,
    visual: nuage({ pts: pts(s, T), vals: true }), afterVisual: nuage({ pts: pts(s, [...T, nx]), vals: true, hl: [s + 4] }), replaceVisual: true,
    tpl: `r = {0} &nbsp; ${TU(s + 4)} {1}`,
    check: chk(E, w => {
      if (near(w[0], -r)) return `Attention au signe : r = ${U('n+1')} − ${UN}, le terme <b>suivant</b> moins le terme <b>précédent</b>.`;
      if (near(w[0], r) && near(w[1], T[3] - r)) return `La raison est juste ! Pour le terme suivant, on <b>ajoute</b> r : ${M(T[3])} + ${P(r)}.`;
      return '';
    }),
    verify: Ev => [...T, Ev[1]].every((x, i, A) => i === 0 || near(x - A[i - 1], Ev[0])),
    hint: `Dans une suite arithmétique, on passe d'un terme au suivant en ajoutant toujours le même nombre r. Calcule ${U(s + 1)} − ${U(s)}.`,
    solution: `r = ${U(s + 1)} − ${U(s)} = ${M(T[1])} − ${P(T[0])} = <b>${M(r)}</b> (même écart entre tous les termes).<br>${U(s + 4)} = ${U(s + 3)} + r = ${M(T[3])} + ${P(r)} = <b>${M(nx)}</b>.`,
  };
}
function C4() {
  return `<h2>4. Suites arithmétiques</h2>
<p class="intro">Une quantité qui augmente (ou diminue) chaque fois de la même valeur, comme une tirelire où l'on met 3 € par semaine, se modélise par une suite arithmétique.</p>
<div class="def">Une suite est <b>arithmétique</b> quand on passe d'un terme au suivant en <b>ajoutant toujours le même nombre r</b>, appelé la <b>raison</b> :<br>${UN1} = ${UN} + r &nbsp; pour tout n.<br>Donc <b>r = ${UN1} − ${UN}</b> (terme suivant moins terme précédent).</div>
${METH(['Calcule l\'écart entre deux termes consécutifs : r = (terme suivant) − (terme précédent).', 'Vérifie sur un autre couple de termes que l\'écart est le même.', 'Pour le terme suivant, <b>ajoute</b> r au dernier terme connu (si r est négatif, cela fait diminuer).'])}
${EXC('Exemple 1 : 5 ; 8 ; 11 ; 14 ; …', `On ajoute 3 à chaque fois : r = 8 − 5 = <b>3</b>.<br>Le terme suivant est 14 + 3 = <b>17</b>.`)}
${EXC(`Exemple 2 : ${U(3)} = 10 ; ${U(4)} = 7,5 ; ${U(5)} = 5 ; ${U(6)} = 2,5.`, `r = ${U(4)} − ${U(3)} = 7,5 − 10 = <b>−2,5</b> (la suite diminue).<br>${U(7)} = 2,5 + (−2,5) = <b>0</b>.<br>Peu importe que la suite commence au rang 3 : la raison se calcule pareil.`)}
<div class="warn">⚠️ r = (terme suivant) − (terme précédent), dans cet ordre : sinon on se trompe de signe.<br>⚠️ Si les termes diminuent, la raison est <b>négative</b>.<br>⚠️ Pour le terme suivant, on <b>ajoute</b> r : on ne le retranche pas.</div>
<div class="cols">${FIG(nuage({ pts: pts(0, [5, 8, 11, 14, 17]), vals: true }), 'Exemple 1 : r = 3, les points montent.')}${FIG(nuage({ pts: pts(3, [10, 7.5, 5, 2.5, 0]), vals: true, hl: [7] }), 'Exemple 2 : r = −2,5, les points descendent.')}</div>
<div class="retenir">À retenir : les points d'une suite arithmétique sont alignés ; à chaque pas on monte (ou on descend) de r.</div>`;
}

/* =====================================================================
   5. Suite arithmétique : formule explicite uₙ = u₀ + n r
   ===================================================================== */
function L5(d) {
  const kind = d < 2 ? 'u0' : d < 3 ? 'up' : d < 4 ? 'formule' : d < 5 ? 'deux' : pick(['upd', 'deux', 'formule']);
  let u0, r, p = 0, n, q, up, uq, E, html, tpl, verify, msg, sol, hint;
  if (kind === 'u0' || kind === 'up' || kind === 'upd') {
    r = kind === 'upd' ? (2 * ri(-6, 5) + 1) / 2 : d < 1 ? ri(2, 9) : nz(-9, 9);
    p = kind === 'u0' ? 0 : ri(1, 6); up = ri(-30, 30); n = ri(12, 60);
    E = [r6(up + (n - p) * r)];
    html = `(${UN}) est une suite arithmétique de raison r = ${M(r)}, avec ${U(p)} = ${M(up)}.<br>Calcule ${U(n)}.`;
    tpl = `${TU(n)} {0}`;
    verify = Ev => { let u = up; for (let k = p; k < n; k++) u += r; return near(u, Ev[0]); };
    msg = w => {
      if (near(w[0], up + (n - p - 1) * r) || near(w[0], up + (n - p + 1) * r)) return `Compte bien les pas : de ${U(p)} à ${U(n)}, on ajoute r exactement ${n} − ${p} = <b>${n - p}</b> fois.`;
      if (p && near(w[0], up + n * r)) return `On ne part pas de ${U(0)} mais de ${U(p)} : il y a ${n - p} pas, pas ${n}.`;
      return '';
    };
    hint = p ? `De ${U(p)} à ${U(n)}, on ajoute r à chaque pas, et il y a ${n} − ${p} pas : ${U(n)} = ${U(p)} + (n − ${p}) × r.` : `${UN} = ${U(0)} + n × r : on ajoute r, n fois.`;
    sol = `${U(n)} = ${U(p)} + (${n} − ${p}) × r = ${M(up)} + ${n - p} × ${P(r)} = ${M(up)} ${sgn(r6((n - p) * r))} = <b>${M(E[0])}</b>.`;
    if (!p) sol = `${U(n)} = ${U(0)} + ${n} × r = ${M(up)} + ${n} × ${P(r)} = <b>${M(E[0])}</b>.`;
  } else if (kind === 'formule') {
    p = ri(1, 5); u0 = ri(-15, 15); r = nz(-9, 9); up = u0 + p * r;
    E = [u0, r];
    html = `(${UN}) est une suite arithmétique de raison ${M(r)} et ${U(p)} = ${M(up)}.<br>Donne sa formule explicite.`;
    tpl = `${TU('n')} {0} + {1} × n`;
    verify = Ev => { let u = Ev[0]; for (let k = 0; k < p; k++) u += r; return near(u, up) && near(Ev[1], r); };
    msg = w => (near(w[0], up) ? `${M(up)}, c'est ${U(p)}. Dans ${UN} = ${U(0)} + n × r, il faut ${U(0)} : recule de ${p} pas.` : near(w[0], up + p * r) ? 'Pour revenir en arrière, on <b>retire</b> r à chaque pas.' : '');
    hint = `La formule est ${UN} = ${U(0)} + n × r. Pour trouver ${U(0)}, pars de ${U(p)} et retire ${p} fois la raison.`;
    sol = `${U(0)} = ${U(p)} − ${p} × r = ${M(up)} − ${p} × ${P(r)} = ${M(u0)}.<br>Donc <b>${UN} = ${M(u0)} ${sgn(r)} × n</b> (soit ${terms([[r, 'n'], [u0, '']])}).`;
  } else {
    p = ri(1, 5); q = p + ri(2, 6); u0 = d >= 5 ? ri(-80, 80) / 2 : ri(-20, 20); r = d >= 5 ? nz(-9, 9) / 2 : nz(-9, 9);
    up = r6(u0 + p * r); uq = r6(u0 + q * r);
    E = [r, u0];
    html = `(${UN}) est une suite arithmétique avec ${U(p)} = ${M(up)} et ${U(q)} = ${M(uq)}.<br>Calcule sa raison r et son premier terme ${U(0)}.`;
    tpl = `r = {0} &nbsp; ${TU(0)} {1}`;
    verify = Ev => { let u = Ev[1], okp = false, okq = false; for (let k = 0; k <= q; k++) { if (k === p) okp = near(u, up); if (k === q) okq = near(u, uq); u += Ev[0]; } return okp && okq; };
    msg = w => (near(w[0], uq - up) && q - p > 1 ? `De ${U(p)} à ${U(q)}, il y a ${q - p} pas : divise ${M(r6(uq - up))} par <b>${q - p}</b>.` : near(w[0], -r) ? `r = (${U(q)} − ${U(p)}) ÷ (${q} − ${p}) : attention au sens de la soustraction.` : '');
    hint = `Entre ${U(p)} et ${U(q)}, on ajoute ${q} − ${p} = ${q - p} fois la raison : ${U(q)} − ${U(p)} = ${q - p} × r.`;
    sol = `${U(q)} − ${U(p)} = ${M(uq)} − ${P(up)} = ${M(r6(uq - up))} = ${q - p} × r, donc <b>r = ${M(r)}</b>.<br>${U(0)} = ${U(p)} − ${p} × r = ${M(up)} − ${p} × ${P(r)} = <b>${M(u0)}</b>.`;
  }
  return { type: 'nums', html, tpl, check: chk(E, msg), verify, hint, solution: sol };
}
function C5() {
  return `<h2>5. Formule explicite d'une suite arithmétique</h2>
<p class="intro">Pour calculer ${U(50)}, pas question d'ajouter r cinquante fois à la main : la formule explicite donne n'importe quel terme d'un coup.</p>
<div class="def">Si (${UN}) est arithmétique de raison r, pour aller de ${U(0)} à ${UN} on ajoute n fois r :<br><b>${UN} = ${U(0)} + n × r</b>.<br>Plus généralement, de ${U('p')} à ${UN} il y a n − p pas : <b>${UN} = ${U('p')} + (n − p) × r</b>.</div>
${METH([`Repère le terme connu (${U(0)} ou ${U('p')}) et compte les <b>pas</b> jusqu'au terme cherché : n − p.`, 'Calcule : terme connu + (nombre de pas) × r.', `Pour la formule explicite, il faut ${U(0)} : recule de p pas en retirant r, p fois : ${U(0)} = ${U('p')} − p × r.`, `Si on donne deux termes ${U('p')} et ${U('q')} : ${U('q')} − ${U('p')} = (q − p) × r, donc on divise l'écart par le nombre de pas.`])}
${EXC(`Exemple 1 : ${U(0)} = 4 et r = 3. Calcule ${U(20)}.`, `${U(20)} = ${U(0)} + 20 × r = 4 + 20 × 3 = <b>64</b>.`)}
${EXC(`Exemple 2 : ${U(2)} = 10 et ${U(7)} = 25. Trouve r et ${U(0)}.`, `De ${U(2)} à ${U(7)}, il y a 7 − 2 = 5 pas, qui font 25 − 10 = 15. Donc r = 15 ÷ 5 = <b>3</b>.<br>${U(0)} = ${U(2)} − 2 × r = 10 − 6 = <b>4</b>, d'où ${UN} = 4 + 3n.`)}
${EXC(`Exemple 3 : r = −4 et ${U(3)} = 5. Calcule ${U(20)} et donne la formule explicite.`, `${U(20)} = ${U(3)} + (20 − 3) × (−4) = 5 − 68 = <b>−63</b>.<br>${U(0)} = 5 − 3 × (−4) = 5 + 12 = 17, donc <b>${UN} = 17 − 4n</b>, c'est-à-dire 17 + (−4) × n.`)}
<div class="cols"><div class="warn">⚠️ De ${U(3)} à ${U(10)}, il y a 10 − 3 = 7 pas, pas 10 : compte les sauts, pas les termes.<br>⚠️ Pour reculer vers ${U(0)}, on <b>retire</b> r ; attention au signe quand r est négatif.<br>⚠️ Avec deux termes, divise l'écart par le nombre de pas (q − p), pas par 1.</div>
${FIG(nuage({ pts: pts(0, [4, 7, 10, 13, 16, 19, 22, 25]), vals: true, hl: [2, 7] }), `Exemple 2 : 5 pas de 3 entre ${U(2)} et ${U(7)}.`)}</div>
<div class="retenir">À retenir : ${UN} = ${U(0)} + n × r, et de ${U('p')} à ${UN} on fait n − p pas.</div>`;
}

/* =====================================================================
   6. Suite géométrique : raison et terme suivant
   ===================================================================== */
function L6(d) {
  let s = 0, a, q;
  if (d < 1) { a = ri(1, 5); q = pick([2, 3]); }
  else if (d < 2) { a = nz(-5, 5); q = pick([2, 3, 4, -2, -3]); }
  else if (d < 3) { q = pick([0.5, 1.5]); a = 16 * ri(1, 4); }
  else if (d < 4) { s = ri(1, 5); q = pick([2, 3, -2, 0.5]); a = q === 0.5 ? 16 * ri(1, 5) : nz(-6, 6); }
  else if (d < 5) { const c = pick([[1.1, 1000], [0.9, 1000], [1.2, 625], [0.8, 625]]); q = c[0]; a = c[1] * ri(1, 4); s = ri(0, 3); }
  else { s = ri(0, 6); const c = pick([[-0.5, 16], [0.5, -16], [1.5, -16], [-2, 3], [0.8, -625]]); q = c[0]; a = c[1] * ri(1, 3); }
  const T = [0, 1, 2, 3].map(j => r6(a * q ** j)), nx = r6(a * q ** 4), idx = [s, s + 1, s + 2, s + 3], E = [q, nx];
  return {
    type: 'nums',
    html: `La suite (${UN}) est <b>géométrique</b>. Voici quatre termes consécutifs :${tab(idx, T)}Donne sa raison q et le terme suivant ${U(s + 4)}.`,
    visual: nuage({ pts: pts(s, T), vals: true }), afterVisual: nuage({ pts: pts(s, [...T, nx]), vals: true, hl: [s + 4] }), replaceVisual: true,
    tpl: `q = {0} &nbsp; ${TU(s + 4)} {1}`,
    check: chk(E, w => {
      if (near(w[0], T[1] - T[0])) return `C'est l'écart ${U(s + 1)} − ${U(s)}. Pour une suite géométrique, on <b>divise</b> : q = ${U(s + 1)} ÷ ${U(s)}.`;
      if (near(w[0], 1 / q)) return `C'est l'inverse : q = (terme suivant) ÷ (terme précédent).`;
      if (near(w[0], q) && near(w[1], T[3] + q)) return `La raison est juste ! Pour le terme suivant, on <b>multiplie</b> par q.`;
      return '';
    }),
    verify: Ev => [...T, Ev[1]].every((x, i, A) => i === 0 || near(A[i - 1] * Ev[0], x)),
    hint: `Dans une suite géométrique, on passe d'un terme au suivant en multipliant toujours par le même nombre q. Calcule ${U(s + 1)} ÷ ${U(s)}.`,
    solution: `q = ${U(s + 1)} ÷ ${U(s)} = ${M(T[1])} ÷ ${P(T[0])} = <b>${M(q)}</b> (même quotient entre tous les termes).<br>${U(s + 4)} = ${U(s + 3)} × q = ${M(T[3])} × ${P(q)} = <b>${M(nx)}</b>.`,
  };
}
function C6() {
  return `<h2>6. Suites géométriques</h2>
<p class="intro">Une quantité qui est multipliée chaque fois par le même nombre (une population qui double, un prix qui augmente de 5 % par an) se modélise par une suite géométrique.</p>
<div class="def">Une suite est <b>géométrique</b> quand on passe d'un terme au suivant en <b>multipliant toujours par le même nombre q</b>, appelé la <b>raison</b> :<br>${UN1} = q × ${UN} &nbsp; pour tout n.<br>Si les termes ne sont pas nuls : <b>q = ${UN1} ÷ ${UN}</b>.</div>
${METH(['Calcule le quotient de deux termes consécutifs : q = (terme suivant) ÷ (terme précédent).', 'Vérifie avec un autre couple de termes que le quotient est le même.', 'Pour le terme suivant, <b>multiplie</b> le dernier terme par q (règle des signes si q &lt; 0).'])}
${EXC('Exemple 1 : 3 ; 6 ; 12 ; 24 ; …', `q = 6 ÷ 3 = <b>2</b> (et 12 ÷ 6 = 2, 24 ÷ 12 = 2).<br>Le terme suivant est 24 × 2 = <b>48</b>.`)}
${EXC('Exemple 2 : 16 ; −8 ; 4 ; −2 ; …', `q = −8 ÷ 16 = <b>−0,5</b>.<br>Le terme suivant est −2 × (−0,5) = <b>1</b>. Avec q &lt; 0, les signes alternent.`)}
${EXC('Exemple 3 : pourcentages.', 'Augmenter de 10 %, c\'est multiplier par <b>1,1</b> ; baisser de 20 %, c\'est multiplier par <b>0,8</b>.<br>1 000 ; 1 100 ; 1 210 ; … : q = 1 100 ÷ 1 000 = <b>1,1</b>.')}
<div class="warn">⚠️ On divise (q = suivant ÷ précédent), on ne soustrait pas : l'écart 6 − 3 = 3 n'est pas la raison.<br>⚠️ Attention à l'ordre : précédent ÷ suivant donne l'<b>inverse</b> de q (3 ÷ 6 = 0,5 au lieu de 2).<br>⚠️ Pour le terme suivant, on <b>multiplie</b> par q, on n'ajoute pas.</div>
<div class="cols">${FIG(nuage({ pts: pts(0, [3, 6, 12, 24, 48]), vals: true }), 'Exemple 1 : q = 2, ça monte de plus en plus vite.')}${FIG(nuage({ pts: pts(0, [16, -8, 4, -2, 1]), vals: true }), 'Exemple 2 : q = −0,5, les signes alternent.')}</div>
<div class="retenir">À retenir : dans une suite géométrique, on multiplie toujours par q ; q = terme suivant ÷ terme précédent.</div>`;
}

/* =====================================================================
   7. Suite géométrique : formule explicite uₙ = u₀ × qⁿ
   ===================================================================== */
function L7(d) {
  let kind = d < 3 ? 'u0' : d < 4 ? 'up' : d < 5 ? 'formule' : pick(['demi', 'up', 'formule']);
  let u0, q, p = 0, n, up, E, html, tpl, verify, msg, hint, sol;
  if (kind === 'u0' || kind === 'demi') {
    if (kind === 'demi') { const k = ri(6, 8); q = 0.5; u0 = 2 ** k * ri(1, 3); n = ri(3, k); }
    else if (d < 1) { q = 2; u0 = ri(1, 5); n = ri(5, 10); }
    else if (d < 2) { q = 3; u0 = ri(1, 5); n = ri(4, 8); }
    else { q = pick([-2, -3]); u0 = nz(-5, 5); n = ri(3, 8); }
    E = [r6(u0 * q ** n)];
    html = `(${UN}) est une suite géométrique de premier terme ${U(0)} = ${M(u0)} et de raison q = ${M(q)}.<br>Calcule ${U(n)}.`;
    tpl = `${TU(n)} {0}`;
    verify = Ev => { let u = u0; for (let k = 0; k < n; k++) u *= q; return near(u, Ev[0]); };
    msg = w => (near(w[0], u0 * q * n) ? `⚠️ q<sup>${n}</sup> n'est pas q × ${n} : c'est q multiplié ${n} fois par lui-même.` : near(w[0], (u0 * q) ** n) && u0 !== 1 ? `Seul q est à la puissance ${n} : ${U(n)} = ${U(0)} × q<sup>${n}</sup>, pas (${U(0)} × q)<sup>${n}</sup>.` : near(w[0], u0 * q ** (n - 1)) || near(w[0], u0 * q ** (n + 1)) ? `De ${U(0)} à ${U(n)}, on multiplie <b>${n}</b> fois par q.` : near(w[0], u0 + n * q) ? 'Ça, c\'est la formule des suites <b>arithmétiques</b>. Ici on multiplie.' : '');
    hint = `${UN} = ${U(0)} × q<sup>n</sup> : calcule d'abord ${pw(q, n)}${q < 0 ? ' (attention au signe : puissance paire ou impaire ?)' : ''}.`;
    sol = `${U(n)} = ${U(0)} × q<sup>${n}</sup> = ${M(u0)} × ${pw(q, n)} = ${M(u0)} × ${P(r6(q ** n))} = <b>${M(E[0])}</b>.`;
  } else if (kind === 'up') {
    q = pick([2, 3, -2]); p = ri(1, 3); u0 = nz(-5, 5); up = u0 * q ** p; n = p + ri(3, 6);
    E = [up * q ** (n - p)];
    html = `(${UN}) est une suite géométrique de raison q = ${M(q)}, avec ${U(p)} = ${M(up)}.<br>Calcule ${U(n)}.`;
    tpl = `${TU(n)} {0}`;
    verify = Ev => { let u = up; for (let k = p; k < n; k++) u *= q; return near(u, Ev[0]); };
    msg = w => (near(w[0], up * q ** n) ? `On part de ${U(p)}, pas de ${U(0)} : il y a ${n} − ${p} = ${n - p} multiplications par q.` : near(w[0], up * q ** (n - p - 1)) || near(w[0], up * q ** (n - p + 1)) ? `Compte les pas : de ${U(p)} à ${U(n)}, il y en a ${n - p}.` : '');
    hint = `De ${U(p)} à ${U(n)}, on multiplie ${n} − ${p} = ${n - p} fois par q : ${U(n)} = ${U(p)} × q<sup>${n - p}</sup>.`;
    sol = `${U(n)} = ${U(p)} × q<sup>${n - p}</sup> = ${M(up)} × ${pw(q, n - p)} = ${M(up)} × ${M(q ** (n - p))} = <b>${M(E[0])}</b>.`;
  } else {
    q = pick([2, 3, -2, 5]); p = ri(1, 3); u0 = nz(-6, 6); up = u0 * q ** p; const up1 = up * q;
    E = [u0, q];
    html = `(${UN}) est une suite géométrique avec ${U(p)} = ${M(up)} et ${U(p + 1)} = ${M(up1)}.<br>Donne sa formule explicite.`;
    tpl = `${TU('n')} {0} × ({1})<sup>n</sup>`;
    verify = Ev => { let u = Ev[0]; for (let k = 0; k < p; k++) u *= Ev[1]; return near(u, up) && near(u * Ev[1], up1); };
    msg = w => (near(w[1], q) && near(w[0], up) ? `${M(up)}, c'est ${U(p)}. Il faut ${U(0)} : divise ${p} fois par q.` : near(w[1], up1 - up) ? 'La raison s\'obtient en <b>divisant</b> deux termes consécutifs.' : '');
    hint = `q = ${U(p + 1)} ÷ ${U(p)}. Puis ${U(0)} = ${U(p)} ÷ q<sup>${p}</sup> (on recule de ${p} pas en divisant).`;
    sol = `q = ${M(up1)} ÷ ${P(up)} = ${M(q)} ; ${U(0)} = ${M(up)} ÷ ${pw(q, p)} = ${M(up)} ÷ ${P(q ** p)} = ${M(u0)}.<br>Donc <b>${UN} = ${M(u0)} × ${pw(q, 'n')}</b>.`;
  }
  return { type: 'nums', html, tpl, check: chk(E, msg), verify, hint, solution: sol };
}
function C7() {
  return `<h2>7. Formule explicite d'une suite géométrique</h2>
<p class="intro">Comme pour les suites arithmétiques, une formule permet de sauter directement au terme voulu ; ici, les multiplications répétées deviennent une <b>puissance</b>.</p>
<div class="def">Si (${UN}) est géométrique de raison q, pour aller de ${U(0)} à ${UN} on multiplie n fois par q :<br><b>${UN} = ${U(0)} × q<sup>n</sup></b>.<br>Plus généralement, de ${U('p')} à ${UN} il y a n − p pas : <b>${UN} = ${U('p')} × q<sup>n − p</sup></b>.</div>
${METH([`Repère le terme connu (${U(0)} ou ${U('p')}) et compte les pas jusqu'au terme cherché.`, 'Calcule d\'abord la puissance de q (attention au signe si q &lt; 0 : puissance paire → positif, impaire → négatif).', 'Multiplie ensuite par le terme connu.', `Pour la formule explicite à partir de ${U('p')} et ${U('p+1')} : q = ${U('p+1')} ÷ ${U('p')}, puis ${U(0)} = ${U('p')} ÷ q<sup>p</sup>.`])}
${EXC(`Exemple 1 : ${U(0)} = 3 et q = 2. Calcule ${U(5)}.`, `${U(5)} = 3 × 2<sup>5</sup> = 3 × 32 = <b>96</b>.`)}
${EXC(`Exemple 2 : ${U(0)} = 5 et q = −2. Calcule ${U(3)}.`, `(−2)<sup>3</sup> = −8 (exposant impair : négatif), donc ${U(3)} = 5 × (−8) = <b>−40</b>.`)}
${EXC(`Exemple 3 : ${U(2)} = −18 et ${U(3)} = −54. Formule explicite ? Puis ${U(6)} ?`, `q = −54 ÷ (−18) = <b>3</b> ; ${U(0)} = −18 ÷ 3<sup>2</sup> = −18 ÷ 9 = <b>−2</b>, donc <b>${UN} = −2 × 3<sup>n</sup></b>.<br>${U(6)} = ${U(2)} × 3<sup>4</sup> = −18 × 81 = <b>−1 458</b>.`)}
<div class="cols"><div class="warn">⚠️ ${U(0)} × q<sup>n</sup> n'est pas (${U(0)} × q)<sup>n</sup> : seul q est à la puissance n.<br>⚠️ q<sup>5</sup> = q × q × q × q × q, pas 5 × q.<br>⚠️ De ${U(2)} à ${U(6)}, il y a 4 multiplications par q, pas 6.<br>⚠️ ${U(0)} + n × q, c'est la formule des suites <b>arithmétiques</b>.</div>
${FIG(nuage({ pts: pts(0, [3, 6, 12, 24, 48, 96]), vals: true, hl: [5] }), `Exemple 1 : avec q &gt; 1 et ${U(0)} &gt; 0, les points montent de plus en plus vite ; ils ne sont pas alignés.`)}</div>
<div class="retenir">À retenir : ${UN} = ${U(0)} × q<sup>n</sup>, et seul q est élevé à la puissance.</div>`;
}

/* =====================================================================
   8. Arithmétique, géométrique ou ni l'un ni l'autre ?
   ===================================================================== */
const KIND_OPTS = [{ v: 'a', l: 'arithmétique' }, { v: 'g', l: 'géométrique' }, { v: 'n', l: 'ni arithmétique, ni géométrique' }];
/** classement d'une liste de termes par ses écarts et ses quotients */
function classe(T) {
  const D = T.slice(1).map((x, i) => x - T[i]);
  if (D.every(x => near(x, D[0])) && !near(D[0], 0)) return 'a';
  if (T.every(x => !near(x, 0))) { const Q = T.slice(1).map((x, i) => x / T[i]); if (Q.every(x => near(x, Q[0])) && !near(Q[0], 1)) return 'g'; }
  return 'n';
}
function L8(d) {
  const want = pick(['a', 'g', 'n']);
  const mode = d < 2 ? 'liste' : d < 4 ? 'formule' : 'rec';
  let gen, tex, how;
  if (mode === 'liste') {
    if (want === 'a') { const u0 = d < 1 ? ri(1, 10) : ri(-10, 20), r = d < 1 ? ri(2, 6) : pick([nz(-8, 8), 0.5, -1.5, 2.5]); gen = k => u0 + k * r; how = `on ajoute toujours ${M(r)}`; }
    else if (want === 'g') { const u0 = d < 1 ? ri(1, 4) : 8 * nz(-3, 3), q = d < 1 ? pick([2, 3]) : pick([0.5, -2, 3, -0.5]); gen = k => u0 * q ** k; how = `on multiplie toujours par ${M(q)}`; }
    else {
      const t = d < 1 ? pick(['carre', 'tri']) : pick(['carre', 'tri', 'presque', 'alt']);
      if (t === 'carre') { const c = ri(0, 3); gen = k => (k + 1) ** 2 + c; how = 'les écarts (3, 5, 7…) changent et les quotients aussi'; }
      else if (t === 'tri') { const u0 = ri(1, 5); gen = k => u0 + k * (k + 1) / 2; how = 'les écarts (1, 2, 3, 4) augmentent, et les quotients ne sont pas égaux'; }
      else if (t === 'presque') { const u0 = ri(1, 4); gen = k => u0 * 2 ** k + (k === 4 ? u0 : 0); how = 'les premiers quotients valent 2, mais pas le dernier : il faut vérifier <b>tous</b> les termes'; }
      else { const a = ri(1, 5), b = a + ri(2, 4); gen = k => (k % 2 ? b : a); how = 'les écarts changent de signe et les quotients alternent'; }
    }
    tex = null;
  } else if (mode === 'formule') {
    if (want === 'a') { const a = nz(-6, 6), b = ri(-9, 9); if (d < 3 || chance(0.5)) { gen = k => a * k + b; tex = `${UN} = ${terms([[a, 'n'], [b, '']])}`; } else { const m = pick([2, 3, -2]), c = nz(-4, 4); gen = k => m * (k + c); tex = `${UN} = ${M(m)}(${terms([[1, 'n'], [c, '']])})`; } how = `${UN1} − ${UN} est constant (le coefficient de n)`; }
    else if (want === 'g') { const k0 = pick([1, 2, 3, 5, -1, -4]), q = pick([2, 3, 4, -2]); if (d < 3 || chance(0.5)) { gen = k => k0 * q ** k; tex = `${UN} = ${kx(k0)}${pw(q, 'n')}`; } else { gen = k => q ** (k + 1); tex = `${UN} = ${pw(q, 'n + 1')}`; } how = `${UN1} ÷ ${UN} est constant : chaque terme est multiplié par ${M(gen(1) / gen(0))}`; }
    else { const t = pick(['n2', 'pow1', 'n3', 'mix']), c = nz(-4, 4); if (t === 'n2') { gen = k => k * k + c; tex = `${UN} = ${terms([[1, N2], [c, '']])}`; } else if (t === 'pow1') { gen = k => 2 ** k + c; tex = `${UN} = 2<sup>n</sup>${plus(c)}`; } else if (t === 'n3') { gen = k => 2 * k * k; tex = `${UN} = 2${N2}`; } else { gen = k => 3 ** k + k; tex = `${UN} = 3<sup>n</sup> + n`; } how = 'ni les écarts, ni les quotients ne sont constants (calcule les premiers termes pour le voir)'; }
  } else {
    if (want === 'a') { const c = d < 5 ? nz(-7, 7) : pick([0.5, -1.5, 4]), u0 = ri(-5, 9); gen = k => u0 + k * c; tex = `${U(0)} = ${M(u0)} et ${UN1} = ${UN}${plus(c)}`; how = `on ajoute toujours ${M(c)}`; }
    else if (want === 'g') { const q = pick([2, 3, -3, 0.5, -1]), u0 = q === 0.5 ? 16 * ri(1, 3) : nz(-5, 5); gen = k => u0 * q ** k; tex = `${U(0)} = ${M(u0)} et ${UN1} = ${q === 0.5 ? `${UN} ÷ 2` : q === -1 ? `−${UN}` : `${M(q)}${UN}`}`; how = `on multiplie toujours par ${M(q)}`; }
    else {
      const t = pick(['aff', 'plusn', 'carre']);
      if (t === 'aff') { const a = pick([2, 3, -2]), b = nz(-4, 4); let u0 = ri(-3, 5); if (near(u0, b / (1 - a))) u0++; gen = k => { let u = u0; for (let j = 0; j < k; j++) u = a * u + b; return u; }; tex = `${U(0)} = ${M(u0)} et ${recAff(a, b)}`; how = `on multiplie <b>et</b> on ajoute : ni les écarts, ni les quotients ne restent constants`; }
      else if (t === 'plusn') { const u0 = ri(-3, 6); gen = k => u0 + k * (k - 1) / 2; tex = `${U(0)} = ${M(u0)} et ${UN1} = ${UN} + n`; how = `l'écart ${UN1} − ${UN} = n change à chaque pas`; }
      else { const u0 = pick([2, 3, -2]); gen = k => u0 ** (2 ** k); tex = `${U(0)} = ${M(u0)} et ${UN1} = ${UN}<sup>2</sup>`; how = `le quotient ${UN1} ÷ ${UN} = ${UN} change à chaque pas`; }
    }
  }
  const K = mode === 'rec' && want === 'n' ? 4 : 5;
  const T = [...Array(K)].map((_, k) => r6(gen(k)));
  // garde-fou : la liste doit vraiment être du type voulu (sinon on retire)
  if (classe(T) !== want) return L8(d);
  const html = mode === 'liste' ? `Voici les premiers termes d'une suite (${UN}) :${tab([0, 1, 2, 3, 4], T)}Cette suite semble-t-elle arithmétique, géométrique, ou ni l'un ni l'autre ?`
    : `La suite (${UN}) est définie par :${big(tex)}Est-elle arithmétique, géométrique, ou ni l'une ni l'autre ?`;
  const D = T.slice(1).map((x, i) => r6(x - T[i]));
  const Q = T.every(x => x !== 0) ? T.slice(1).map((x, i) => r6(x / T[i])) : null;
  return {
    type: 'choice', opts: KIND_OPTS, html,
    check: choiceCheck(want, { msg: c => (c === 'a' ? 'Calcule tous les écarts u<sub>n+1</sub> − u<sub>n</sub> : sont-ils vraiment tous égaux ?' : c === 'g' ? 'Calcule tous les quotients u<sub>n+1</sub> ÷ u<sub>n</sub> : sont-ils vraiment tous égaux ?' : 'Regarde à nouveau : ajoute-t-on toujours le même nombre, ou multiplie-t-on toujours par le même nombre ?') }),
    verify: E => {
      // on recalcule les termes à partir de la définition (récurrence itérée ou formule) et on les classe
      const V = [...Array(K)].map((_, k) => gen(k));
      return classe(V) === E && T.every((x, i) => near(x, V[i]));
    },
    hint: `Calcule les écarts ${UN1} − ${UN}${mode !== 'liste' ? ' (après avoir calculé quelques termes)' : ''} : s'ils sont tous égaux, la suite est arithmétique. Sinon, calcule les quotients ${UN1} ÷ ${UN}.`,
    solution: `${mode !== 'liste' ? `Premiers termes : ${T.map(A2).join(' ; ')}.<br>` : ''}Écarts : ${D.map(A2).join(' ; ')}.${Q ? `<br>Quotients : ${Q.map(A2).join(' ; ')}.` : ''}<br>Ici ${how} : la suite ${want === 'n' ? "<b>n'est ni arithmétique, ni géométrique</b>" : `est <b>${KIND_OPTS.find(o => o.v === want).l}</b>`}.`,
    afterVisual: nuage({ pts: pts(0, T), vals: true }),
  };
}
function C8() {
  return `<h2>8. Arithmétique ou géométrique ?</h2>
<p class="intro">Avant d'utiliser une formule, il faut savoir à quel type de suite on a affaire. Deux tests suffisent : les écarts et les quotients.</p>
<div class="def">Pour reconnaître une suite :<br>• si l'<b>écart</b> ${UN1} − ${UN} est toujours le même nombre r : suite <b>arithmétique</b> ;<br>• si le <b>quotient</b> ${UN1} ÷ ${UN} est toujours le même nombre q : suite <b>géométrique</b> ;<br>• sinon : <b>ni l'une ni l'autre</b>.</div>
${METH(['Si la suite est donnée par une formule ou une récurrence, calcule ses premiers termes (au moins 4).', `Calcule <b>tous</b> les écarts ${UN1} − ${UN} : s'ils sont tous égaux, la suite est arithmétique.`, `Sinon, calcule <b>tous</b> les quotients ${UN1} ÷ ${UN} : s'ils sont tous égaux, elle est géométrique.`, 'Sinon, elle n\'est ni l\'une ni l\'autre.', `Raccourcis : ${UN1} = ${UN} + c → arithmétique ; ${UN1} = c × ${UN} → géométrique ; ${UN} = an + b → arithmétique ; ${UN} = k × q<sup>n</sup> → géométrique.`])}
${EXC(`Exemple 1 : ${UN} = 3n − 1.`, `${UN1} − ${UN} = 3(n + 1) − 1 − (3n − 1) = 3 : <b>arithmétique</b> de raison 3.`)}
${EXC(`Exemple 2 : ${UN} = 5 × 2<sup>n</sup>.`, `${UN1} ÷ ${UN} = (5 × 2<sup>n+1</sup>) ÷ (5 × 2<sup>n</sup>) = 2 : <b>géométrique</b> de raison 2.`)}
${EXC(`Exemple 3 : ${U(0)} = 2 et ${recAff(2, 1)}.`, `Termes : 2 ; 5 ; 11 ; 23. Écarts : 3 ; 6 ; 12 (pas égaux). Quotients : 2,5 ; 2,2 ; ≈ 2,09 (pas égaux).<br>Elle n'est <b>ni arithmétique, ni géométrique</b> : on multiplie <b>et</b> on ajoute.`)}
<div class="warn">⚠️ Deux écarts (ou deux quotients) égaux ne suffisent pas : il faut que <b>tous</b> le soient. Pour 1 ; 2 ; 4 ; 8 ; 17, les quotients valent 2 ; 2 ; 2 puis 17 ÷ 8 = 2,125 : la suite n'est pas géométrique.<br>⚠️ 1 ; 4 ; 9 ; 16 (les carrés) n'est ni l'une ni l'autre : les écarts 3 ; 5 ; 7 changent.</div>
<div class="cols">${FIG(nuage({ pts: pts(0, [1, 4, 7, 10, 13]), vals: true }), 'Arithmétique : points alignés.')}${FIG(nuage({ pts: pts(0, [1, 2, 4, 8, 16]), vals: true }), 'Géométrique : on multiplie par 2.')}${FIG(nuage({ pts: pts(0, [0, 1, 4, 9, 16]), vals: true }), 'Ni l\'une ni l\'autre : n<sup>2</sup>.')}</div>
<div class="retenir">À retenir : écarts tous égaux → arithmétique ; quotients tous égaux → géométrique.</div>`;
}

/* =====================================================================
   9. Sens de variation
   ===================================================================== */
const VAR_OPTS = [{ v: 'c', l: 'croissante' }, { v: 'd', l: 'décroissante' }, { v: 'n', l: 'ni croissante, ni décroissante' }];
/** sens de variation constaté sur les 30 premiers termes */
function sens(T) {
  const D = T.slice(1).map((x, i) => x - T[i]);
  return D.every(x => x > 1e-12) ? 'c' : D.every(x => x < -1e-12) ? 'd' : 'n';
}
function L9(d) {
  const v = d < 5 ? d : pick([2, 3, 4, 5]);
  let gen, tex, E, why;
  if (v === 0) {
    const r = nz(-9, 9), u0 = ri(-10, 20); gen = k => u0 + k * r; E = r > 0 ? 'c' : 'd';
    tex = `(${UN}) est arithmétique de premier terme ${U(0)} = ${M(u0)} et de raison r = ${M(r)}.`;
    why = `${UN1} − ${UN} = r = ${M(r)} ${r > 0 ? '&gt; 0' : '&lt; 0'}`;
  } else if (v === 1) {
    const a = nz(-6, 6), b = ri(-9, 9);
    if (chance(0.5)) { gen = k => a * k + b; tex = `${UN} = ${terms([[a, 'n'], [b, '']])} pour tout n ≥ 0.`; why = `${UN1} − ${UN} = ${M(a)} ${a > 0 ? '&gt; 0' : '&lt; 0'} (le coefficient de n)`; }
    else { const u0 = ri(-5, 9); gen = k => u0 + k * a; tex = `${U(0)} = ${M(u0)} et ${UN1} = ${UN}${plus(a)}.`; why = `${UN1} − ${UN} = ${M(a)} ${a > 0 ? '&gt; 0' : '&lt; 0'}`; }
    E = a > 0 ? 'c' : 'd';
  } else if (v === 2 || v === 3) {
    let u0, q;
    if (v === 2) { u0 = ri(1, 9); q = pick([2, 3, 1.5, 1.2, 0.5, 0.8, 0.9]); }
    else if (chance(0.5)) { u0 = -ri(1, 9); q = pick([2, 3, 1.5, 0.5, 0.8]); }
    else { u0 = nz(-9, 9); q = pick([-2, -0.5, -3]); }
    gen = k => u0 * q ** k;
    tex = chance(0.5) ? `(${UN}) est géométrique de premier terme ${U(0)} = ${M(u0)} et de raison q = ${M(q)}.` : `${UN} = ${kx(u0)}${pw(q, 'n')} pour tout n ≥ 0.`;
    if (q < 0) { E = 'n'; why = `q &lt; 0 : les termes changent de signe à chaque pas, la suite monte puis descend`; }
    else { const up = (q > 1) === (u0 > 0); E = up ? 'c' : 'd'; why = `${UN1} − ${UN} = ${UN}(q − 1) = ${U(0)} × q<sup>n</sup> × (${M(q)} − 1) : ${U(0)} ${u0 > 0 ? '&gt;' : '&lt;'} 0 et q − 1 ${q > 1 ? '&gt;' : '&lt;'} 0, donc ce signe est ${up ? 'positif' : 'négatif'}`; }
  } else if (v === 4) {
    const u0 = ri(-5, 9), t = pick(['c', 'd', 'n']);
    let g, gt;
    if (t === 'c') { const c = ri(1, 4); g = n => n * n + c; gt = `${N2} + ${c}`; }
    else if (t === 'd') { const c = ri(1, 5); g = n => -2 * n - c; gt = `−2n − ${c}`; }
    else { const c = 2 * ri(1, 4) + 1; g = n => 2 * n - c; gt = `2n − ${c}`; }
    gen = k => { let u = u0; for (let n = 0; n < k; n++) u += g(n); return u; };
    tex = `${U(0)} = ${M(u0)} et, pour tout n ≥ 0, ${UN1} = ${UN} + ${gt.startsWith('−') ? `(${gt})` : gt}.`;
    E = t; why = t === 'c' ? `${UN1} − ${UN} = ${gt} &gt; 0 pour tout n` : t === 'd' ? `${UN1} − ${UN} = ${gt} &lt; 0 pour tout n ≥ 0` : `${UN1} − ${UN} = ${gt} est négatif pour n = 0 et positif pour n grand : la suite descend puis remonte`;
  } else {
    const t = pick(['poly', 'poly', 'inv', 'expo']);
    if (t === 'poly') {
      const a = pick([1, -1]), b = 2 * ri(-4, 2), c = ri(-5, 9);
      gen = k => a * k * k + b * k + c; tex = `${UN} = ${terms([[a, N2], [b, 'n'], [c, '']])} pour tout n ≥ 0.`;
      // uₙ₊₁ − uₙ = a(2n + 1) + b, de signe constant ssi il l'est en n = 0
      E = a === 1 ? (1 + b > 0 ? 'c' : 'n') : (b - 1 < 0 ? 'd' : 'n');
      why = `${UN1} − ${UN} = ${terms([[2 * a, 'n'], [a + b, '']])}${E === 'n' ? ' change de signe quand n augmente' : E === 'c' ? ' &gt; 0 pour tout n ≥ 0' : ' &lt; 0 pour tout n ≥ 0'}`;
    } else if (t === 'inv') {
      const k0 = ri(1, 6); gen = k => k0 / (k + 1); tex = `${UN} = ${F(k0, 'n + 1')} pour tout n ≥ 0.`; E = 'd';
      why = `le dénominateur n + 1 augmente et le numérateur ${k0} &gt; 0 est fixe : la fraction diminue`;
    } else {
      const a = ri(1, 9), k0 = pick([2, 3]); gen = k => a - k0 * 2 ** k; tex = `${UN} = ${a} − ${k0} × 2<sup>n</sup> pour tout n ≥ 0.`; E = 'd';
      why = `2<sup>n</sup> augmente, donc ${k0} × 2<sup>n</sup> augmente et on retire de plus en plus : ${UN1} − ${UN} = −${k0} × 2<sup>n</sup> &lt; 0`;
    }
  }
  const T7 = [...Array(7)].map((_, k) => r6(gen(k)));
  return {
    type: 'choice', opts: VAR_OPTS,
    html: `${tex}<br>Quel est le sens de variation de la suite (${UN}) ?`,
    check: choiceCheck(E, { msg: c => (v === 3 && E !== 'n' && c !== 'n' ? `Attention au signe de ${U(0)} : multiplier un nombre <b>négatif</b> par q &gt; 1 le rend encore plus négatif.` : `Étudie le signe de ${UN1} − ${UN}, ou calcule les premiers termes pour voir.`) }),
    verify: Ev => sens([...Array(30)].map((_, k) => gen(k))) === Ev,
    hint: `Étudie le <b>signe de ${UN1} − ${UN}</b> : toujours positif → croissante ; toujours négatif → décroissante.${v === 2 || v === 3 ? ` Pour une suite géométrique, regarde le signe de ${U(0)} et la position de q par rapport à 1 (et si q &lt; 0 ?).` : ''}`,
    solution: `${why}.<br>La suite ${E === 'n' ? "<b>n'est ni croissante, ni décroissante</b>" : `est <b>${VAR_OPTS.find(o => o.v === E).l}</b>`}. Premiers termes : ${T7.slice(0, 5).map(A2).join(' ; ')} …`,
    afterVisual: nuage({ pts: pts(0, T7) }),
  };
}
function C9() {
  return `<h2>9. Sens de variation</h2>
<p class="intro">Savoir si une suite monte ou descend, c'est savoir si la quantité qu'elle décrit augmente ou diminue au fil du temps.</p>
<div class="def">(${UN}) est <b>croissante</b> si ${UN1} ≥ ${UN} pour tout n, <b>décroissante</b> si ${UN1} ≤ ${UN} pour tout n.<br>Elle peut aussi n'être <b>ni croissante, ni décroissante</b> (elle monte puis descend, ou alterne).</div>
${METH([`Calcule et simplifie la différence ${UN1} − ${UN}.`, 'Étudie son signe pour tout n ≥ 0 : toujours positif → croissante ; toujours négatif → décroissante ; change de signe → ni l\'une ni l\'autre.', `Arithmétique : ${UN1} − ${UN} = r. Croissante si r &gt; 0, décroissante si r &lt; 0.`, `Géométrique (q &gt; 0) : ${UN1} − ${UN} = ${UN} × (q − 1). Avec ${U(0)} &gt; 0 : croissante si q &gt; 1, décroissante si 0 &lt; q &lt; 1 ; avec ${U(0)} &lt; 0, c'est l'inverse. Si q &lt; 0 : ni l'une ni l'autre.`, 'En cas de doute, calcule les premiers termes pour contrôler.'])}
${EXC(`Exemple 1 : ${UN} = n<sup>2</sup> + 2n.`, `${UN1} − ${UN} = (n + 1)<sup>2</sup> + 2(n + 1) − n<sup>2</sup> − 2n = 2n + 3 &gt; 0 : (${UN}) est <b>croissante</b>.`)}
${EXC(`Exemple 2 : géométrique, ${U(0)} = −4 et q = 2.`, `−4 ; −8 ; −16 … : multiplier un nombre négatif par 2 le rend <b>plus</b> négatif. La suite est <b>décroissante</b>.`)}
${EXC(`Exemple 3 : ${UN} = n<sup>2</sup> − 4n.`, `${UN1} − ${UN} = 2n − 3 : négatif pour n = 0 et n = 1, positif ensuite.<br>0 ; −3 ; −4 ; −3 ; 0 ; 5 : la suite descend puis remonte, elle n'est <b>ni croissante, ni décroissante</b>.`)}
<div class="warn">⚠️ « q &gt; 1 donc croissante » n'est vrai que si ${U(0)} &gt; 0.<br>⚠️ Si ${UN1} − ${UN} change de signe, la suite n'est ni croissante ni décroissante.<br>⚠️ ${UN} = ${F(6, 'n + 1')} : le dénominateur augmente, donc la fraction <b>diminue</b> (décroissante).</div>
<div class="cols">${FIG(nuage({ pts: pts(0, [0, 3, 8, 15, 24]), vals: true }), 'Exemple 1 : croissante.')}${FIG(nuage({ pts: pts(0, [0, -3, -4, -3, 0, 5]), vals: true }), 'Exemple 3 : ni croissante, ni décroissante.')}</div>
<div class="retenir">À retenir : le sens de variation se lit sur le signe de ${UN1} − ${UN}.</div>`;
}

/* =====================================================================
   10. Sommes 1 + 2 + … + n et sommes de termes arithmétiques
   ===================================================================== */
function L10(d) {
  const v = d < 5 ? d : pick([2, 3, 4]);
  let first, r, N, html, sol, label = 'S';
  if (v === 0 || v === 1) {
    const n = v === 0 ? ri(10, 30) : pick([ri(40, 99), 100, 2 * ri(50, 500), ri(100, 1500)]);
    first = 1; r = 1; N = n;
    html = `Calcule la somme :${big(`S = 1 + 2 + 3 + … + ${n}`)}`;
    sol = `1 + 2 + … + n = ${F('n(n + 1)', 2)} avec n = ${n} : S = ${F(`${n} × ${n + 1}`, 2)} = <b>${M(n * (n + 1) / 2)}</b>.`;
  } else if (v === 2) {
    const u0 = d >= 5 ? ri(-20, 10) : ri(1, 10), rr = d >= 5 ? nz(-6, 6) : ri(2, 6), n = ri(8, 25);
    first = u0; r = rr; N = n + 1;
    html = `(${UN}) est arithmétique de premier terme ${U(0)} = ${M(u0)} et de raison ${M(rr)}.<br>Calcule :${big(`S = ${U(0)} + ${U(1)} + … + ${U(n)}`)}`;
    const un = u0 + n * rr;
    sol = `${U(n)} = ${M(u0)} + ${n} × ${P(rr)} = ${M(un)}. De ${U(0)} à ${U(n)}, il y a <b>${n + 1} termes</b>.<br>S = (nombre de termes) × ${F('premier + dernier', 2)} = ${n + 1} × ${F(`${M(u0)} + ${P(un)}`, 2)} = <b>${M(r6(N * (u0 + un) / 2))}</b>.`;
  } else if (v === 3) {
    first = d >= 5 ? ri(-30, -1) : ri(1, 9); r = d >= 5 ? pick([2, 3, 5]) : ri(2, 7); N = ri(10, 40);
    const last = first + (N - 1) * r;
    html = `Calcule la somme (on ajoute ${r} à chaque fois) :${big(`S = ${M(first)} ${sgn(first + r)} ${sgn(first + 2 * r)} + … ${sgn(last)}`)}`;
    sol = `Nombre de termes : ${F(`${M(last)} − ${P(first)}`, r)} + 1 = ${N - 1} + 1 = <b>${N}</b>.<br>S = ${N} × ${F(`${M(first)} + ${P(last)}`, 2)} = <b>${M(N * (first + last) / 2)}</b>.`;
  } else {
    const u0 = ri(-10, 15), rr = d >= 5 ? pick([0.5, -0.5, 1.5, -3]) : nz(-5, 6), p = ri(2, 6), n = p + ri(8, 20);
    first = r6(u0 + p * rr); r = rr; N = n - p + 1; label = 'S';
    const last = r6(u0 + n * rr);
    html = `(${UN}) est arithmétique avec ${UN} = ${terms([[rr, 'n'], [u0, '']])}.<br>Calcule :${big(`S = ${U(p)} + ${U(p + 1)} + … + ${U(n)}`)}`;
    sol = `${U(p)} = ${M(first)} et ${U(n)} = ${M(last)}. De ${U(p)} à ${U(n)}, il y a ${n} − ${p} + 1 = <b>${N} termes</b>.<br>S = ${N} × ${F(`${M(first)} + ${P(last)}`, 2)} = <b>${M(r6(N * (first + last) / 2))}</b>.`;
  }
  const last = r6(first + (N - 1) * r), E = [r6(N * (first + last) / 2)];
  // vérification indépendante : somme terme à terme
  let tot = 0; for (let k = 0; k < N; k++) tot += first + k * r;
  return {
    type: 'nums', html, tpl: `${label} = {0}`,
    check: chk(E, w => {
      if (near(w[0], (N - 1) * (first + last) / 2) || near(w[0], (N + 1) * (first + last) / 2)) return `Compte bien les termes : il y en a <b>${N}</b>${v >= 2 ? ' (dernier rang − premier rang + 1)' : ''}.`;
      if (near(w[0], N * (first + last))) return 'Tu as oublié de diviser par 2.';
      if (v < 2 && near(w[0], N * (N - 1) / 2)) return `La formule est ${F('n(n + 1)', 2)}.`;
      return '';
    }),
    value: r6(tot),
    hint: v < 2 ? `Astuce de Gauss : 1 + 2 + … + n = ${F('n(n + 1)', 2)}.` : `Somme de termes consécutifs d'une suite arithmétique = (nombre de termes) × ${F('premier + dernier', 2)}. Commence par compter les termes.`,
    solution: sol,
  };
}
function C10() {
  return `<h2>10. Sommes de termes arithmétiques</h2>
<p class="intro">Ajouter 100 nombres un par un, c'est long ! Pour les termes d'une suite arithmétique, une formule donne la somme en une ligne.</p>
<div class="def"><b>1 + 2 + 3 + … + n = ${F('n(n + 1)', 2)}</b>.<br>Plus généralement, pour des termes consécutifs d'une suite arithmétique :<br><b>S = (nombre de termes) × ${F('premier terme + dernier terme', 2)}</b>.</div>
${METH(['Calcule le <b>premier</b> et le <b>dernier</b> terme de la somme.', `Compte les termes : de ${U('p')} à ${U('n')}, il y en a n − p + 1 ; pour une liste qui avance de r, (dernier − premier) ÷ r + 1.`, 'Applique : S = (nombre de termes) × (premier + dernier) ÷ 2.'])}
${EXC('Exemple 1 : S = 1 + 2 + … + 100.', `S = ${F('100 × 101', 2)} = ${F('10 100', 2)} = <b>5 050</b>.`)}
${EXC('Exemple 2 : S = 3 + 7 + 11 + … + 43.', `On ajoute 4 à chaque fois. Nombre de termes : (43 − 3) ÷ 4 + 1 = 10 + 1 = 11.<br>S = 11 × ${F('3 + 43', 2)} = 11 × 23 = <b>253</b>.`)}
${EXC(`Exemple 3 : ${UN} = 2n + 1. Calcule S = ${U(3)} + ${U(4)} + … + ${U(12)}.`, `${U(3)} = 7 et ${U(12)} = 25. Nombre de termes : 12 − 3 + 1 = 10.<br>S = 10 × ${F('7 + 25', 2)} = 10 × 16 = <b>160</b>.`)}
<div class="warn">⚠️ De ${U(0)} à ${U('n')} il y a <b>n + 1</b> termes ; de ${U('p')} à ${U('n')}, il y en a n − p + 1 (n'oublie pas le « + 1 »).<br>⚠️ N'oublie pas de <b>diviser par 2</b>.<br>⚠️ La formule de Gauss est n(n + 1) ÷ 2, pas n(n − 1) ÷ 2.</div>
<div class="cols"><p>Pourquoi ça marche ? On écrit 1 + 2 + 3 + 4 + 5 à l'endroit (bleu) et à l'envers (orange) : chaque colonne fait 5 + 1 = 6 cases, et il y a 5 colonnes. Le rectangle contient 5 × 6 = 30 cases, donc la somme vaut 30 ÷ 2 = 15.</p>
${gauss(5)}</div>
<div class="retenir">À retenir : somme = nombre de termes × (premier + dernier) ÷ 2.</div>`;
}

/* =====================================================================
   11. Somme de termes géométriques
   ===================================================================== */
function L11(d) {
  const v = d < 5 ? d : pick([3, 4, 5]);
  let u0 = 1, q, p = 0, n, html, txt;
  if (v === 0) { q = 2; n = ri(4, 12); html = `Calcule la somme :${big(`S = 1 + 2 + 2<sup>2</sup> + … + 2<sup>${n}</sup>`)}`; }
  else if (v === 1) { q = pick([3, 4, 5, 10]); n = q === 3 ? ri(3, 9) : q === 4 ? ri(3, 7) : q === 5 ? ri(3, 6) : ri(3, 5); html = `Calcule la somme :${big(`S = 1 + ${q} + ${q}<sup>2</sup> + … + ${q}<sup>${n}</sup>`)}`; }
  else if (v === 2) { u0 = ri(2, 5); q = pick([2, 3]); n = q === 2 ? ri(4, 10) : ri(3, 8); }
  else if (v === 3) { q = pick([-2, -3]); n = ri(3, 9); html = `Calcule la somme :${big(`S = 1 + ${pw(q, 1).replace('<sup>1</sup>', '')} + ${pw(q, 2)} + … + ${pw(q, n)}`)}`; }
  else if (v === 4) { if (chance(0.5)) { const k = ri(5, 9); q = 0.5; u0 = 2 ** k; n = ri(3, Math.min(k, 5)); } else { q = 1.1; u0 = 1000 * ri(1, 3); n = ri(2, 4); } }
  else { q = pick([2, 3]); u0 = ri(1, 4); p = ri(2, 4); n = p + ri(3, 6); }
  if (!html) html = `(${UN}) est géométrique de premier terme ${U(0)} = ${M(u0)} et de raison ${M(q)}.<br>Calcule :${big(`S = ${U(p)} + ${U(p + 1)} + … + ${U(n)}`)}`;
  const N = n - p + 1, a = r6(u0 * q ** p);
  const E = [r6(a * (1 - q ** N) / (1 - q))];
  let tot = 0, t = u0; for (let k = 0; k <= n; k++) { if (k >= p) tot += t; t *= q; }
  txt = u0 === 1 && p === 0 ? `1 + q + … + q<sup>n</sup> = ${F('1 − q<sup>n+1</sup>', '1 − q')} avec q = ${M(q)} et n = ${n}`
    : `S = (premier terme) × ${F('1 − q<sup>nombre de termes</sup>', '1 − q')}, avec premier terme ${U(p)} = ${M(a)} et ${N} termes`;
  return {
    type: 'nums', html, tpl: 'S = {0}',
    check: chk(E, w => {
      if (near(w[0], a * (1 - q ** (N - 1)) / (1 - q)) || near(w[0], a * (1 - q ** (N + 1)) / (1 - q))) return `Attention à l'exposant : il y a <b>${N}</b> termes, donc q<sup>${N}</sup> dans la formule.`;
      if (near(w[0], (1 - q ** N) / (1 - q)) && a !== 1) return `Il manque le premier terme ${M(a)} en facteur.`;
      if (near(w[0], -E[0])) return 'Attention au signe : (1 − q<sup>N</sup>) ÷ (1 − q), ou bien (q<sup>N</sup> − 1) ÷ (q − 1).';
      return '';
    }),
    value: r6(tot),
    hint: `${u0 === 1 && p === 0 ? `1 + q + q<sup>2</sup> + … + q<sup>n</sup> = ${F('1 − q<sup>n+1</sup>', '1 − q')}` : `S = (premier terme) × ${F('1 − q<sup>N</sup>', '1 − q')}, où N est le nombre de termes`} (pour q ≠ 1).`,
    solution: `${txt} :<br>S = ${a === 1 ? '' : `${M(a)} × `}${F(`1 − ${pw(q, N)}`, `1 − ${P(q)}`)} = ${a === 1 ? '' : `${M(a)} × `}${F(M(r6(1 - q ** N)), M(r6(1 - q)))} = <b>${M(E[0])}</b>.`,
  };
}
function C11() {
  return `<h2>11. Sommes de termes géométriques</h2>
<p class="intro">Quand les termes sont multipliés à chaque fois par q, la somme grandit très vite. Une formule permet de la calculer sans additionner tous les termes.</p>
<div class="def">Pour q ≠ 1 : <b>1 + q + q<sup>2</sup> + … + q<sup>n</sup> = ${F('1 − q<sup>n+1</sup>', '1 − q')}</b>.<br>Pour des termes consécutifs d'une suite géométrique de raison q :<br><b>S = (premier terme) × ${F('1 − q<sup>nombre de termes</sup>', '1 − q')}</b>.</div>
${METH(['Repère le <b>premier terme</b> de la somme (ce n\'est pas forcément ' + U(0) + ') et la raison q.', `Compte les termes N : de 1 à q<sup>n</sup> il y en a n + 1 ; de ${U('p')} à ${U('n')}, n − p + 1.`, 'Applique S = (premier terme) × (1 − q<sup>N</sup>) ÷ (1 − q), en calculant la puissance d\'abord.', 'Contrôle le signe et l\'ordre de grandeur (par exemple en ajoutant les premiers termes).'])}
${EXC('Exemple 1 : S = 1 + 2 + 4 + … + 2<sup>9</sup>.', `q = 2 et il y a 10 termes : S = ${F('1 − 2<sup>10</sup>', '1 − 2')} = ${F('1 − 1 024', '−1')} = <b>1 023</b>.`)}
${EXC('Exemple 2 : S = 1 + (−2) + (−2)<sup>2</sup> + (−2)<sup>3</sup> + (−2)<sup>4</sup>.', `q = −2 et 5 termes : S = ${F('1 − (−2)<sup>5</sup>', '1 − (−2)')} = ${F('1 + 32', 3)} = <b>11</b>.<br>Contrôle : 1 − 2 + 4 − 8 + 16 = 11.`)}
${EXC(`Exemple 3 : ${U(0)} = 1, q = 3. Calcule S = ${U(2)} + ${U(3)} + ${U(4)} + ${U(5)}.`, `Premier terme ${U(2)} = 3<sup>2</sup> = 9 ; nombre de termes 5 − 2 + 1 = 4.<br>S = 9 × ${F('1 − 3<sup>4</sup>', '1 − 3')} = 9 × ${F('−80', '−2')} = 9 × 40 = <b>360</b> (9 + 27 + 81 + 243).`)}
<div class="warn">⚠️ L'exposant est le <b>nombre de termes</b> : de 1 à q<sup>n</sup>, il y a n + 1 termes.<br>⚠️ N'oublie pas le premier terme en facteur s'il n'est pas égal à 1.<br>⚠️ Pour q = 1 la formule ne marche pas (on divise par 0) : la somme vaut simplement (nombre de termes) × (premier terme).</div>
<p>Pourquoi 1 + 2 + 4 + 8 + 16 = 2<sup>5</sup> − 1 ? Chaque bande est aussi longue que toutes les précédentes, plus la case grise. Avec la case grise, on obtient une barre de longueur 32 = 2<sup>5</sup>.</p>
${somme2(4)}
<div class="retenir">À retenir : somme = premier terme × (1 − q<sup>nombre de termes</sup>) ÷ (1 − q), pour q ≠ 1.</div>`;
}

/* =====================================================================
   12. Problèmes et seuils
   ===================================================================== */
function seuilModel(d) {
  const kind = d < 1 ? 'ariC' : d < 2 ? 'ariD' : d < 3 ? 'geoC' : d < 4 ? 'place' : d < 5 ? 'deprec' : pick(['affine', 'affine', 'place', 'deprec']);
  if (kind === 'ariC') {
    const u0 = ri(10, 40), k = ri(2, 6), n = ri(4, 15), S = u0 + k * (n - 1) + ri(0, k - 1);
    return { kind, u0, next: u => u + k, up: true, S, closed: Math.floor((S - u0) / k) + 1, unit: '€', ans: 'années',
      txt: `Un abonnement coûte ${u0} € la première année (année 0). Son prix augmente de ${k} € chaque année. On note ${UN} le prix l'année n : ${UN} = ${u0} + ${k}n.`,
      q: `Au bout de combien d'années le prix dépassera-t-il ${S} € ?`, py: [`u = ${u0}`, `u = u + ${k}`], f: `${u0} + ${k}n &gt; ${S}` };
  }
  if (kind === 'ariD') {
    const u0 = 10 * ri(40, 90), k = ri(15, 40), n = ri(5, 18), S = u0 - k * (n - 1) - ri(0, k - 1);
    return { kind, u0, next: u => u - k, up: false, S, closed: Math.floor((u0 - S) / k) + 1, unit: 'L', ans: 'jours',
      txt: `Une citerne contient ${u0} L d'eau. Chaque jour, on y prélève ${k} L. On note ${UN} le volume (en L) au bout de n jours : ${UN} = ${u0} − ${k}n.`,
      q: `Au bout de combien de jours la citerne contiendra-t-elle moins de ${S} L ?`, py: [`u = ${u0}`, `u = u - ${k}`], f: `${u0} − ${k}n &lt; ${S}` };
  }
  if (kind === 'geoC') {
    const u0 = pick([50, 100, 200, 300, 500]), m = ri(3, 8), S = Math.round(u0 * 2 ** m * (1.1 + 0.8 * ri(0, 8) / 8) / 50) * 50;
    return { kind, u0, next: u => 2 * u, up: true, S, closed: Math.floor(Math.log(S / u0) / Math.log(2)) + 1, unit: 'bactéries', ans: 'heures', q0: 2,
      txt: `Une culture contient ${u0} bactéries. Leur nombre double toutes les heures. On note ${UN} le nombre de bactéries au bout de n heures : ${UN} = ${u0} × 2<sup>n</sup>.`,
      q: `Au bout de combien d'heures y aura-t-il plus de ${M(S)} bactéries ?`, py: [`u = ${u0}`, 'u = 2 * u'] };
  }
  if (kind === 'place') {
    const u0 = pick([1000, 2000, 5000, 1500, 3000]), t = pick([2, 3, 4, 5, 6, 8]), q = r6(1 + t / 100), S = Math.round(u0 * pick([1.25, 1.5, 2, 1.2]));
    return { kind, u0, next: u => u * q, up: true, S, closed: Math.floor(Math.log(S / u0) / Math.log(q)) + 1, unit: '€', ans: 'années', q0: q,
      txt: `On place ${M(u0)} € à intérêts composés au taux annuel de ${t} % : chaque année, le capital est multiplié par ${M(q)}. On note ${UN} le capital au bout de n années : ${UN} = ${M(u0)} × ${M(q)}<sup>n</sup>.`,
      q: `Au bout de combien d'années le capital dépassera-t-il ${M(S)} € ?`, py: [`u = ${u0}`, `u = ${q} * u`] };
  }
  if (kind === 'deprec') {
    const u0 = pick([12000, 15000, 20000, 25000, 30000]), t = pick([10, 12, 15, 20, 25]), q = r6(1 - t / 100), S = Math.round(u0 * pick([0.5, 0.4, 0.3, 0.25]));
    return { kind, u0, next: u => u * q, up: false, S, closed: Math.floor(Math.log(S / u0) / Math.log(q)) + 1, unit: '€', ans: 'années', q0: q,
      txt: `Une voiture neuve vaut ${M(u0)} €. Elle perd ${t} % de sa valeur chaque année : sa valeur est multipliée par ${M(q)}. On note ${UN} sa valeur au bout de n années : ${UN} = ${M(u0)} × ${M(q)}<sup>n</sup>.`,
      q: `Au bout de combien d'années vaudra-t-elle moins de ${M(S)} € ?`, py: [`u = ${u0}`, `u = ${q} * u`] };
  }
  // affine : uₙ₊₁ = a uₙ + b, limite l = b / (1 − a)
  const a = pick([0.9, 0.8, 0.75]), b = pick([40, 60, 80, 100, 120]), l = r6(b / (1 - a)), up = chance(0.5);
  const u0 = up ? Math.round(l * pick([0.2, 0.3, 0.5]) / 10) * 10 : Math.round(l * pick([1.5, 2, 2.5]) / 10) * 10;
  const S = Math.round((up ? u0 + (l - u0) * pick([0.7, 0.8, 0.9]) : l + (u0 - l) * pick([0.3, 0.2, 0.1])) / 5) * 5;
  const closed = Math.floor(Math.log((l - S) / (l - u0)) / Math.log(a)) + 1;
  return { kind, u0, next: u => a * u + b, up, S, closed, unit: 'adhérents', ans: 'années', l, a,
    txt: `Un club compte ${u0} adhérents. Chaque année, ${Math.round((1 - a) * 100)} % des adhérents partent et ${b} nouveaux arrivent. On note ${UN} le nombre d'adhérents au bout de n années : ${U(0)} = ${u0} et ${recAff(a, b)}.`,
    q: `Au bout de combien d'années le club comptera-t-il ${up ? 'plus' : 'moins'} de ${S} adhérents ?`, py: [`u = ${u0}`, `u = ${a} * u + ${b}`] };
}
function L12(d) {
  let m, g = 0;
  // pas de terme exactement égal au seuil, réponse entre 2 et 30
  do { m = seuilModel(d); g++; } while (g < 100 && (m.closed < 2 || m.closed > 30 || [m.closed - 1, m.closed].some(k => near(iterate(m.u0, 0, k, m.next)[k], m.S, 1e-9))));
  const { u0, next, up, S, closed } = m, E = [closed];
  const cmpPy = up ? '&lt;=' : '&gt;=', cmpTx = up ? '&gt;' : '&lt;';
  const code = PY(['def seuil():', `    ${m.py[0]}`, '    n = 0', `    while u ${cmpPy} ${S}:`, `        ${m.py[1]}`, '        n = n + 1', '    return n']);
  const withCode = d >= 3;
  const T = iterate(u0, 0, closed + 1, next).map(r6);
  const show = k => (Number.isInteger(r6(T[k] * 100)) ? M(r6(T[k])) : `≈ ${M(Math.round(T[k] * 100) / 100)}`);
  const sh = k => (show(k).startsWith('≈') ? show(k) : `= ${show(k)}`);
  let sol = `On cherche le plus petit n tel que ${UN} ${cmpTx} ${M(S)}.<br>`;
  if (m.f) sol += `${m.f} donne n &gt; ${F(M(Math.abs(S - u0)), M(Math.abs(T[1] - u0)))} ${A2(Math.abs(S - u0) / Math.abs(T[1] - u0)).startsWith("≈") ? "" : "= "}${A2(Math.abs(S - u0) / Math.abs(T[1] - u0))} ; le premier entier qui convient est <b>${closed}</b>.<br>`;
  sol += `Vérification : ${U(closed - 1)} ${sh(closed - 1)} (pas encore) et ${U(closed)} ${sh(closed)} ${cmpTx} ${M(S)}.<br>Réponse : <b>${closed} ${m.ans}</b>.${withCode ? '' : `<br>Avec Python, l'algorithme de seuil :<br>${code}`}`;
  return {
    type: 'nums', keys: { neg: false, comma: false },
    html: `${m.txt}<br>${m.q}${withCode ? `<br>La fonction Python ci-dessous répond à la question. Que renvoie <b>seuil()</b> ?<br>${code}` : ''}`,
    tpl: `n = {0} ${m.ans}`,
    check: chk(E, w => {
      if (w[0] === closed - 1) return `Calcule ${U(closed - 1)} : le seuil n'est pas encore franchi. Il faut aller un rang plus loin.`;
      if (w[0] === closed + 1) return `Calcule ${U(closed)} : le seuil est déjà franchi. On cherche le <b>premier</b> n qui convient.`;
      return '';
    }),
    // vérification indépendante : on fait tourner l'algorithme de seuil (boucle tant que)
    verify: Ev => { let u = u0, n = 0; while ((up ? u <= S : u >= S) && n < 1000) { u = next(u); n++; } return n === Ev[0]; },
    hint: `Calcule les termes un par un (à la calculatrice) et arrête-toi au <b>premier</b> n tel que ${UN} ${cmpTx} ${M(S)}${m.f ? ' ; ou résous l\'inéquation ' + m.f : ''}.`,
    solution: sol,
    afterVisual: nuage({ pts: pts(0, T), hl: [closed], seuil: { y: S, l: `${M(S)}` }, aria: 'termes de la suite et seuil' }),
  };
}
function C12() {
  return `<h2>12. Problèmes et algorithme de seuil</h2>
<p class="intro">Un capital, une population, la valeur d'une voiture : les suites servent à prévoir. La question typique : « à partir de quand dépasse-t-on telle valeur ? ».</p>
<div class="def">Une évolution de <b>+ k chaque année</b> se modélise par une suite <b>arithmétique</b> ; une évolution de <b>+ t % chaque année</b> par une suite <b>géométrique</b> de raison 1 + t/100 (et 1 − t/100 pour une baisse).<br>Chercher un <b>seuil</b>, c'est chercher le <b>plus petit n</b> tel que ${UN} dépasse (ou passe sous) une valeur donnée. On calcule les termes un par un jusqu'à franchir le seuil : c'est l'<b>algorithme de seuil</b>.</div>
${METH([`Écris la suite : ${UN} = ${U(0)} + n × r, ou ${UN} = ${U(0)} × q<sup>n</sup>, ou la récurrence de l'énoncé.`, 'Calcule les termes un par un (calculatrice, tableau de valeurs) jusqu\'au <b>premier</b> qui franchit le seuil.', `Arithmétique : tu peux aussi résoudre l'inéquation, par exemple 30 + 4n &gt; 75 donne n &gt; 11,25, donc n = 12.`, `Vérifie : ${U('n−1')} ne convient pas encore et ${UN} convient.`, 'Avec Python : la boucle <b>while</b> tourne tant que le seuil n\'est <b>pas</b> franchi ; la fonction renvoie n.'])}
<div class="cols"><div>${EXC('Exemple 1 : on place 1 000 € à 5 % par an. Quand dépasse-t-on 1 500 € ?', `${UN} = 1 000 × 1,05<sup>n</sup>.<br>${U(8)} ≈ 1 477,46 (pas encore) et ${U(9)} ≈ 1 551,33 &gt; 1 500 : il faut <b>9 ans</b>.`)}</div>
<div style="text-align:center">${PY(['def seuil():', '    u = 1000', '    n = 0', '    while u &lt;= 1500:', '        u = 1.05 * u', '        n = n + 1', '    return n'])}</div></div>
${EXC('Exemple 2 : une voiture de 20 000 € perd 15 % de sa valeur par an. Quand vaudra-t-elle moins de 10 000 € ?', `On multiplie par 0,85 chaque année : ${UN} = 20 000 × 0,85<sup>n</sup>.<br>${U(4)} ≈ 10 440,13 (pas encore) et ${U(5)} ≈ 8 874,11 &lt; 10 000 : il faut <b>5 ans</b>.<br>En Python : <code>while u &gt;= 10000:</code> (on continue tant qu'on n'est pas passé sous le seuil).`)}
<div class="warn">⚠️ La boucle continue <b>tant que</b> le seuil n'est pas franchi : la condition du « while » est le contraire de ce qu'on cherche.<br>⚠️ On répond avec le <b>premier</b> n qui convient, pas le dernier qui ne convient pas.<br>⚠️ Une baisse de 15 %, c'est multiplier par 0,85, pas par 0,15.</div>
${FIG(nuage({ pts: pts(0, [...Array(11)].map((_, n) => 1000 * 1.05 ** n)), hl: [9], seuil: { y: 1500, l: '1 500 €' } }), `Exemple 1 : ${U(9)} est le premier point au-dessus du seuil.`)}
<div class="retenir">À retenir : le seuil est le premier rang n où la condition est vraie ; vérifie toujours le rang d'avant.</div>`;
}

/* ================= niveaux ================= */
const LEVELS_ = [
  { titre: 'Terme d\'une suite explicite', generate: L1, cours: C1 },
  { titre: 'Suite définie par récurrence', generate: L2, cours: C2 },
  { titre: 'Lire des termes sur un graphique', generate: L3, cours: C3 },
  { titre: 'Arithmétique : raison', generate: L4, cours: C4 },
  { titre: 'Arithmétique : uₙ = u₀ + nr', generate: L5, cours: C5 },
  { titre: 'Géométrique : raison', generate: L6, cours: C6 },
  { titre: 'Géométrique : uₙ = u₀ × qⁿ', generate: L7, cours: C7 },
  { titre: 'Arithmétique ou géométrique ?', generate: L8, cours: C8 },
  { titre: 'Sens de variation', generate: L9, cours: C9 },
  { titre: 'Sommes 1 + 2 + … + n', generate: L10, cours: C10 },
  { titre: 'Sommes géométriques', generate: L11, cours: C11 },
  { titre: 'Problèmes et seuils', generate: L12, cours: C12 },
];
export const LEVELS = LEVELS_.map(L => ({ classe: '1re', ...L }));
export const OPTIONS = { need: 4, keys: { comma: true } };

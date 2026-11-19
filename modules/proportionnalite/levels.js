// Proportionnalité et pourcentages (6e – 3e) : 12 niveaux, une difficulté nouvelle par niveau,
// et des exercices qui se corsent avec d (série de réussites en cours).
// Chaque exercice porte une vérification indépendante : `value` est recalculé par une autre méthode
// que celle qui a construit la réponse (produit en croix en flottants, passage par 1 %, coefficient…).
import { ri, pick, shuffle, chance, prenom } from '../../engine/util/rand.js';
import { gcd, r6, approx } from '../../engine/util/arith.js';
import { M, F } from '../../engine/util/fmt.js';
import { numsCheck, choiceCheck } from '../../engine/answers/checks.js';
import { tab, graph, niceStep, plan, pctBar, cells, evoBars, road, cross } from './draw.js';

const big = s => `<div class="big">${s}</div>`;
const slot = '<span class="slot">?</span>';
const X_ = '<i>x</i>';
/** prix : 7,50 € */
const eur = x => { const v = r6(x); return (Number.isInteger(v) ? M(v) : v.toFixed(2).replace('.', ',')) + ' €'; };
/** grands entiers avec espace fine : 25 000 */
const gi = n => String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
/** quotient affiché « = 3 » ou « ≈ 2,33 » */
const quo = v => { const r = Math.round(v * 1000) / 1000; return Math.abs(r - v) < 1e-9 ? '= ' + M(r) : '≈ ' + M(Math.round(v * 100) / 100); };
/** durée en minutes → « 1 h 30 min » */
const dur = m => { const h = Math.floor(m / 60), r = m % 60; return h ? `${h} h${r ? ' ' + r + ' min' : ''}` : `${r} min`; };

/**
 * Réponse à cases. E = valeurs attendues ; o.near = [[case, valeur, message]] pour les erreurs « presque
 * justes » (bonne valeur dans la mauvaise unité, coefficient inversé…) ; o.value = vérification indépendante
 * de la dernière case.
 */
function nums(E, tpl, o = {}) {
  E = E.map(r6);
  const near = (o.near || []).filter(([i, val]) => isFinite(val) && !approx(r6(val), E[i]));
  const msg = v => {
    for (const [i, val, m] of near) if (v[i] !== null && v[i] !== undefined && approx(v[i], r6(val), 1e-6)) return m;
    return '';
  };
  return { type: 'nums', tpl, expected: E, check: numsCheck(E, { msg }), value: o.value };
}

const CTX = [
  ['Masse de pommes (kg)', 'Prix (€)'], ['Nombre de cahiers', 'Prix (€)'], ['Durée (h)', 'Distance (km)'],
  ['Volume de peinture (L)', 'Surface (m²)'], ['Nombre de tours', 'Distance (km)'],
];

/* ---------- 1. reconnaître un tableau de proportionnalité ---------- */
function L1(d) {
  const n = d < 2 ? 3 : 4, cx = pick(CTX);
  const k = d < 1 ? pick([2, 3, 4, 5, 10]) : d < 3 ? pick([2, 3, 4, 5, 6, 7, 8, 9, 1.5, 2.5]) : pick([0.5, 1.2, 1.5, 2.5, 3.5, 0.8, 2.4, 0.4]);
  let xs; do { xs = Array.from({ length: n }, () => ri(1, d < 2 ? 10 : 20)); } while (new Set(xs).size < n);
  xs.sort((a, b) => a - b);
  let ys = xs.map(x => r6(k * x)), kind = 'prop', c = 0;
  if (chance(0.5)) {
    kind = d < 1 ? 'add' : pick(d < 2 ? ['add', 'one'] : ['add', 'one', 'aff']);
    if (kind === 'add') { c = ri(1, 9); ys = xs.map(x => x + c); }
    else if (kind === 'one') { const j = ri(1, n - 1); ys[j] = r6(ys[j] + (ys[j] > 3 && chance(0.5) ? -1 : 1)); }
    else { c = ri(1, 5); ys = xs.map(x => r6(k * x + c)); }
  }
  const E = kind === 'prop' ? 'oui' : 'non';
  const sol = `On divise chaque nombre du bas par celui du haut :<br>${xs.map((x, i) => `${M(ys[i])} ÷ ${M(x)} ${quo(ys[i] / x)}`).join(' ; ')}.<br>`
    + (E === 'oui' ? `Le quotient est toujours ${M(k)} : c'est un tableau de proportionnalité, de coefficient ${M(k)}.${tab(cx, xs, ys, { coef: '× ' + M(k) })}`
      : `Les quotients ne sont pas tous égaux : ce n'est <b>pas</b> un tableau de proportionnalité.` + (kind === 'add' ? ` Ici on <b>ajoute</b> ${c} à chaque fois : ajouter n'est pas multiplier !` : ''));
  return {
    type: 'choice', html: `Ce tableau est-il un tableau de proportionnalité ?${tab(cx, xs, ys)}`,
    opts: [{ v: 'oui', l: 'Oui, c\'est proportionnel' }, { v: 'non', l: 'Non, ce n\'est pas proportionnel' }],
    check: choiceCheck(E, { msg: ch => (ch === 'oui' ? (kind === 'add' ? 'Attention : on <b>ajoute</b> toujours le même nombre… mais on ne multiplie pas par le même nombre !' : 'Vérifie le quotient de <b>chaque</b> colonne, pas seulement la première.') : 'Refais les divisions : trouves-tu vraiment des quotients différents ?') }),
    verify: e => e === (xs.every((x, i) => Math.abs(xs[0] * ys[i] - x * ys[0]) < 1e-9) ? 'oui' : 'non'),
    hint: `Divise chaque nombre de la 2<sup>e</sup> ligne par celui de la 1<sup>re</sup> ligne. Si on trouve <b>toujours le même nombre</b>, c'est proportionnel.`,
    solution: sol,
  };
}
function C1() {
  return `<h2>1. Reconnaître un tableau de proportionnalité</h2>
<p class="intro">Deux quantités sont proportionnelles quand l'une s'obtient en multipliant l'autre toujours par le même nombre : le prix et la masse de pommes, la distance et la durée à vitesse constante…</p>
<div class="def">Un tableau est un <b>tableau de proportionnalité</b> quand on passe de la 1<sup>re</sup> ligne à la 2<sup>e</sup> en <b>multipliant toujours par le même nombre</b>. Ce nombre s'appelle le <b>coefficient de proportionnalité</b>.</div>
${graph({ xr: [0, 10], xs: 1, yr: [0, 16], ys: 2, xt: 'nombre de croissants', yt: 'prix (€)', fs: [{ f: x => 1.5 * x }], pts: [{ x: 2, y: 3 }, { x: 4, y: 6 }, { x: 10, y: 15 }] })}
<p class="note">Les colonnes d'un tableau de proportionnalité donnent des points alignés avec l'origine (voir le niveau 5).</p>
<div class="methode"><b>Méthode</b><ol>
<li>Pour chaque colonne, divise le nombre du bas par celui du haut.</li>
<li>Si tu trouves <b>toujours le même quotient</b>, c'est proportionnel : ce quotient est le coefficient.</li>
<li>Si au moins un quotient est différent des autres, ce n'est <b>pas</b> proportionnel.</li></ol></div>
<div class="ex"><span class="q">Exemple 1 : des croissants à 1,50 € pièce.</span>${tab(['Nombre de croissants', 'Prix (€)'], [2, 4, 10], [3, 6, 15], { coef: '× 1,5' })}3 ÷ 2 = 1,5 ; 6 ÷ 4 = 1,5 ; 15 ÷ 10 = 1,5 : toujours 1,5, c'est proportionnel.</div>
<div class="ex"><span class="q">Exemple 2 : trois tableaux qui ne sont pas proportionnels.</span>${tab(['Âge de Léa', 'Âge de son frère'], [1, 2, 3], [4, 5, 6])}• On ajoute toujours 3, mais 4 ÷ 1 = 4 et 5 ÷ 2 = 2,5.<br>• 2 → 6, 5 → 15, 8 → 25 : 6 ÷ 2 = 3 et 15 ÷ 5 = 3, mais 25 ÷ 8 = 3,125. Une seule colonne suffit à tout casser.<br>• 1 → 5, 2 → 8, 3 → 11 (on multiplie par 3 puis on ajoute 2) : 5 ÷ 1 = 5 et 8 ÷ 2 = 4.</div>
<div class="warn">⚠️ <b>Ajouter n'est pas multiplier</b> : ajouter toujours le même nombre ne donne pas un tableau de proportionnalité.<br>⚠️ Il faut vérifier <b>toutes</b> les colonnes, pas seulement la première.</div>
<div class="retenir">À retenir : proportionnel ⇔ le quotient bas ÷ haut est le même dans toutes les colonnes.</div>`;
}

/* ---------- 2. compléter un tableau (coefficient) ---------- */
function L2(d) {
  const cx = pick(CTX);
  const k = d < 2 ? ri(2, 9) : pick([1.5, 2.5, 0.5, 1.2, 0.4, 3.5, 0.6, 1.25]);
  let xs; do { xs = Array.from({ length: 4 }, () => ri(1, 12)); } while (new Set(xs).size < 4);
  xs.sort((a, b) => a - b);
  const ys = xs.map(x => r6(k * x));
  let holes;
  if (d < 1) holes = [{ r: 1, c: ri(1, 3) }];
  else if (d < 3) holes = [{ r: ri(0, 1), c: ri(1, 3) }];
  else { const c1 = ri(1, 3); let c2; do { c2 = ri(1, 3); } while (c2 === c1); holes = [{ r: 1, c: c1 }, { r: 0, c: c2 }].sort((a, b) => a.c - b.c); }
  const top = [...xs], bot = [...ys];
  holes.forEach((h, i) => { (h.r ? bot : top)[h.c] = `{${i}}`; });
  const E = holes.map(h => (h.r ? ys[h.c] : xs[h.c]));
  const near = [];
  holes.forEach((h, i) => {
    if (h.r) {
      near.push([i, xs[h.c] + ys[0] - xs[0], `On ne passe pas d'une ligne à l'autre en <b>ajoutant</b> : on <b>multiplie</b> par le coefficient.`]);
      near.push([i, xs[h.c] / k, `Coefficient inversé : pour <b>descendre</b> (1<sup>re</sup> → 2<sup>e</sup> ligne), on <b>multiplie</b> par ${M(k)}.`]);
    } else {
      near.push([i, ys[h.c] - (ys[0] - xs[0]), `On ne passe pas d'une ligne à l'autre en <b>soustrayant</b> : on <b>divise</b> par le coefficient.`]);
      near.push([i, ys[h.c] * k, `Coefficient inversé : pour <b>remonter</b> (2<sup>e</sup> → 1<sup>re</sup> ligne), on <b>divise</b> par ${M(k)}.`]);
    }
  });
  const last = holes[holes.length - 1];
  const value = last.r ? xs[last.c] * ys[0] / xs[0] : ys[last.c] * xs[0] / ys[0]; // produit en croix, en flottants
  return {
    ...nums(E, tab(cx, top, bot), { near, value }),
    html: `Complète ce tableau de proportionnalité${holes.length > 1 ? ' (deux cases)' : ''}.`,
    hint: `Cherche d'abord le coefficient avec la colonne complète : ${M(ys[0])} ÷ ${M(xs[0])}. Pour descendre, on <b>multiplie</b> par le coefficient ; pour remonter, on <b>divise</b>.`,
    solution: `Coefficient : ${M(ys[0])} ÷ ${M(xs[0])} = ${M(k)}.<br>` + holes.map(h => (h.r ? `${M(xs[h.c])} × ${M(k)} = <b>${M(ys[h.c])}</b>` : `${M(ys[h.c])} ÷ ${M(k)} = <b>${M(xs[h.c])}</b>`)).join(' ; ') + tab(cx, xs, ys, { coef: '× ' + M(k) }),
  };
}
function C2() {
  return `<h2>2. Compléter un tableau</h2>
<p class="intro">Quand on sait qu'un tableau est proportionnel, une seule colonne complète suffit pour trouver toutes les autres valeurs.</p>
<div class="def">On calcule le <b>coefficient</b> avec une colonne complète : coefficient = (nombre du bas) ÷ (nombre du haut).<br>• Pour <b>descendre</b> : on <b>multiplie</b> par le coefficient.<br>• Pour <b>remonter</b> : on <b>divise</b> par le coefficient.</div>
${graph({ xr: [0, 10], xs: 1, yr: [0, 35], ys: 5, xt: 'masse (kg)', yt: 'prix (€)', fs: [{ f: x => 3.5 * x }], guides: [{ x: 5, y: 17.5 }, { x: 8, y: 28 }], pts: [{ x: 2, y: 7 }, { x: 5, y: 17.5 }, { x: 8, y: 28 }] })}
<div class="methode"><b>Méthode</b><ol>
<li>Choisis une colonne complète et calcule le coefficient : bas ÷ haut.</li>
<li>Case vide en bas : multiplie le nombre du haut par le coefficient.</li>
<li>Case vide en haut : divise le nombre du bas par le coefficient.</li></ol></div>
<div class="ex"><span class="q">Exemple 1 : un tableau masse – prix.</span>${tab(['Masse (kg)', 'Prix (€)'], [2, 5, '?'], [7, '?', 28], { coef: '× 3,5' })}Coefficient : 7 ÷ 2 = 3,5. Puis 5 × 3,5 = <b>17,5</b> et 28 ÷ 3,5 = <b>8</b>.</div>
<div class="ex"><span class="q">Exemple 2 : un coefficient plus petit que 1.</span>${tab(['Volume (L)', 'Surface (m²)'], [5, 12, '?'], [2, '?', '3,2'], { coef: '× 0,4' })}Coefficient : 2 ÷ 5 = 0,4. Puis 12 × 0,4 = <b>4,8</b> et 3,2 ÷ 0,4 = <b>8</b>.</div>
<div class="warn">⚠️ On ne complète pas en <b>ajoutant</b> : 2 → 7 c'est « × 3,5 », pas « + 5 ».<br>⚠️ Ne pas inverser : pour remonter on divise, on ne multiplie pas.</div>
<div class="retenir">À retenir : on descend en multipliant par le coefficient, on remonte en divisant.</div>`;
}

/* ---------- 3. passage à l'unité ---------- */
const OBJ = [['cahier', 'cahiers', 'un'], ['croissant', 'croissants', 'un'], ['stylo', 'stylos', 'un'], ['ticket de bus', 'tickets de bus', 'un'], ['place de cinéma', 'places de cinéma', 'une'], ['classeur', 'classeurs', 'un']];
function L3(d) {
  const m = ri(2, d < 2 ? 6 : 9); let n; do { n = ri(2, d < 2 ? 10 : 15); } while (n === m || n % m === 0);
  if (d >= 3 && chance(0.5)) {
    const g = 5 * ri(5, 30), Q = g * m;
    return {
      ...nums([g, g * n], `Pour 1 personne : {0} g <span class="sep"></span> Pour ${n} personnes : {1} g`, {
        value: Q * n / m,
        near: [[0, m / Q, 'Pour 1 personne, on divise la <b>masse</b> par le nombre de personnes.'], [1, Q * n, `Tu as multiplié la masse pour ${m} personnes : pars de la masse pour <b>une</b> personne.`]],
      }),
      html: `Pour ${m} personnes, il faut ${Q} g de farine.<br>Combien en faut-il pour ${n} personnes ?`,
      visual: tab(['Nombre de personnes', 'Farine (g)'], [m, 1, n], [Q, slot, slot]),
      hint: `Calcule d'abord la farine pour <b>1</b> personne (divise par ${m}), puis multiplie par ${n}.`,
      solution: `Pour 1 personne : ${Q} ÷ ${m} = ${g} g.<br>Pour ${n} personnes : ${g} × ${n} = <b>${g * n} g</b>.`,
    };
  }
  const uc = d < 1 ? 100 * ri(2, 9) : d < 2 ? 50 * ri(3, 19) : 5 * ri(21, 99); // prix unitaire en centimes
  const P = uc * m / 100, u = uc / 100, T = uc * n / 100, [s1, sp, un] = pick(OBJ);
  return {
    ...nums([u, T], `1 ${s1} : {0} € <span class="sep"></span> ${n} ${sp} : {1} €`, {
      value: P * n / m,
      near: [[0, m / P, `Pour le prix d'<b>${un}</b> ${s1}, on divise le <b>prix</b> par le nombre de ${sp} (pas l'inverse).`], [0, P * m, 'Pour revenir à 1, on <b>divise</b>, on ne multiplie pas.'], [1, P * n, `Tu as multiplié le prix de ${m} ${sp} : pars du prix d'<b>${un}</b> ${s1}.`]],
    }),
    html: `${m} ${sp} coûtent ${eur(P)}.<br>Combien coûtent ${n} ${sp} ?`,
    visual: tab([`Nombre de ${sp}`, 'Prix (€)'], [m, 1, n], [eur(P).replace(' €', ''), slot, slot]),
    hint: `Passe par l'unité : calcule d'abord le prix d'<b>${un}</b> ${s1} (divise par ${m}), puis multiplie par ${n}.`,
    solution: `Prix d'${un} ${s1} : ${eur(P)} ÷ ${m} = ${eur(u)}.<br>Prix de ${n} ${sp} : ${eur(u)} × ${n} = <b>${eur(T)}</b>.`,
  };
}
function C3() {
  return `<h2>3. Passage à l'unité</h2>
<p class="intro">Si on connaît le prix de 5 stylos, combien en coûtent 3 ? L'idée la plus simple : chercher d'abord le prix d'<b>un seul</b> stylo.</p>
<div class="def">Pour passer d'une quantité à une autre, on calcule d'abord la valeur pour <b>1</b> (on divise), puis pour la quantité demandée (on multiplie).</div>
${graph({ xr: [0, 6], xs: 1, yr: [0, 8], ys: 1, xt: 'nombre de stylos', yt: 'prix (€)', fs: [{ f: x => 1.2 * x }], guides: [{ x: 1, y: 1.2 }, { x: 3, y: 3.6 }, { x: 5, y: 6 }], pts: [{ x: 1, y: 1.2 }, { x: 3, y: 3.6 }, { x: 5, y: 6 }] })}
<p class="note">5 stylos → 6 € ; on redescend à 1 stylo → 1,20 € ; puis on remonte à 3 stylos → 3,60 €.</p>
<div class="methode"><b>Méthode</b><ol>
<li>Valeur pour 1 : divise la quantité connue (prix, masse…) par le nombre d'objets.</li>
<li>Valeur demandée : multiplie la valeur pour 1 par le nouveau nombre.</li>
<li>Écris l'unité dans la réponse (€, g…).</li></ol></div>
<div class="ex"><span class="q">Exemple 1 : 5 stylos coûtent 6 €. Combien coûtent 3 stylos ?</span>${tab(['Nombre de stylos', 'Prix (€)'], [5, 1, 3], [6, '1,2', '3,6'])}1 stylo : 6 ÷ 5 = 1,20 €. 3 stylos : 1,20 × 3 = <b>3,60 €</b>.</div>
<div class="ex"><span class="q">Exemple 2 : pour 4 personnes, il faut 300 g de farine. Et pour 7 personnes ?</span><br>Pour 1 personne : 300 ÷ 4 = 75 g. Pour 7 personnes : 75 × 7 = <b>525 g</b>.</div>
<div class="warn">⚠️ Pour 1 stylo, on divise le <b>prix</b> par le <b>nombre</b> de stylos : 6 ÷ 5, et pas 5 ÷ 6.<br>⚠️ Pour la 2<sup>e</sup> étape, pars du prix d'<b>un</b> stylo, pas du prix des 5.<br>⚠️ Garde l'unité : la réponse est un prix, en €.</div>
<div class="retenir">À retenir : on divise pour revenir à 1, puis on multiplie.</div>`;
}

/* ---------- 4. quatrième proportionnelle, produit en croix ---------- */
const PB = [
  { l: ['Farine (g)', 'Sucre (g)'], u: 'g', t: (a, b, c) => `Une recette utilise ${M(a)} g de farine pour ${M(b)} g de sucre.<br>Combien de sucre faut-il avec ${M(c)} g de farine ?` },
  { l: ['Peinture blanche (L)', 'Peinture bleue (L)'], u: 'L', t: (a, b, c) => `Pour obtenir un bleu clair, on mélange ${M(a)} L de peinture blanche avec ${M(b)} L de peinture bleue.<br>Combien de peinture bleue faut-il pour ${M(c)} L de blanche ?` },
  { l: ['Nombre de tours', 'Distance (km)'], u: 'km', t: (a, b, c) => `En ${M(a)} tours de piste, ${prenom()} parcourt ${M(b)} km.<br>Quelle distance parcourt-on en ${M(c)} tours ?` },
];
function L4(d) {
  let p, q; do { p = ri(2, 5); q = ri(2, 9); } while (gcd(p, q) !== 1);
  const s = ri(2, d < 2 ? 5 : 9); let t; do { t = ri(2, 9); } while (t === s || t % s === 0);
  const h = d >= 2 && chance(0.5) ? 2 : 1;
  const a = p * s, c = q * s, b = r6(p * t / h), x = r6(q * t / h); // colonnes (a, b) et (c, x)
  const near = [[0, a * b / c, `Tu as divisé par le mauvais nombre : on multiplie les deux nombres de la diagonale <b>sans</b> ${X_}, puis on divise par celui qui est <b>en face</b> de ${X_}.`],
    [0, a * c / b, `Tu as multiplié les mauvais nombres : on multiplie les deux nombres de la diagonale <b>sans</b> ${X_}.`],
    [0, b + c - a, `On ne trouve pas ${X_} en ajoutant : dans un tableau de proportionnalité, on <b>multiplie</b>.`]];
  const value = c * (b / a); // par le coefficient, en flottants
  const sol = `Les produits en croix sont égaux : ${X_} × ${M(a)} = ${M(b)} × ${M(c)}.<br>Donc ${X_} = ${M(b)} × ${M(c)} ÷ ${M(a)} = ${M(r6(b * c))} ÷ ${M(a)} = <b>${M(x)}</b>.`;
  const hint = `Produit en croix : multiplie les deux nombres de la diagonale <b>sans</b> ${X_}, puis divise par le nombre qui est en face de ${X_}.`;
  if (d >= 3 && chance(0.5)) {
    const P = pick(PB);
    return { ...nums([x], `{0} ${P.u}`, { near, value }), html: P.t(a, b, c), visual: tab(P.l, [a, c], [b, X_]), hint, solution: sol };
  }
  // position de x : en bas à droite, ou ailleurs (on échange colonnes et lignes)
  const sc = d >= 1 && chance(0.5), sr = d >= 1 && chance(0.5), cx = pick(CTX.filter(c => c[0] !== 'Durée (h)')); // pas de durées de 60 h
  let g = [[a, c], [b, X_]], lab = [...cx];
  if (sc) g = g.map(r => [r[1], r[0]]);
  if (sr) { g = [g[1], g[0]]; lab = [lab[1], lab[0]]; }
  return {
    ...nums([x], `${X_} = {0}`, { near, value }),
    html: `Ce tableau est un tableau de proportionnalité. Calcule ${X_}.${tab(lab, g[0], g[1])}`,
    hint, solution: sol,
  };
}
function C4() {
  return `<h2>4. Quatrième proportionnelle et produit en croix</h2>
<p class="intro">Le produit en croix est une méthode rapide qui marche dans tous les cas, même quand le coefficient n'est pas simple.</p>
<div class="cols">
<div class="def">Dans un tableau de proportionnalité, les <b>produits en croix</b> sont égaux :<br>si ${tab(null, ['a', 'c'], ['b', 'd'])} alors <b>a × d = b × c</b>.</div>
<div>${cross(4, 10, 6, X_)}</div>
</div>
<div class="methode"><b>Méthode</b><ol>
<li>Écris les quatre nombres dans un tableau, ${X_} à la place de l'inconnue.</li>
<li>Multiplie les deux nombres de la diagonale <b>sans ${X_}</b>.</li>
<li>Divise par le nombre <b>en face de ${X_}</b> (sur l'autre diagonale).</li></ol></div>
<div class="ex"><span class="q">Exemple 1 : 4 kg coûtent 10 €, combien coûtent 6 kg ?</span><br>${X_} × 4 = 10 × 6, donc ${X_} = 10 × 6 ÷ 4 = 60 ÷ 4 = <b>15 €</b>.</div>
<div class="ex"><span class="q">Exemple 2 : ${X_} peut être n'importe où.</span>${tab(['Nombre de tours', 'Distance (km)'], [X_, 12], [15, 20])}${X_} × 20 = 12 × 15, donc ${X_} = 12 × 15 ÷ 20 = 180 ÷ 20 = <b>9</b>.<br>Problème : 250 g de farine pour 100 g de sucre ; avec 400 g de farine, il faut 100 × 400 ÷ 250 = <b>160 g</b> de sucre.</div>
<div class="warn">⚠️ On ne calcule pas ${X_} en ajoutant : 4 → 6 c'est « × 1,5 », pas « + 2 ».<br>⚠️ Attention à la diagonale : on ne multiplie jamais deux nombres de la même ligne.<br>⚠️ On divise par le nombre <b>en face</b> de ${X_}, pas par un autre.</div>
<div class="retenir">À retenir : ${X_} = (produit de la diagonale sans ${X_}) ÷ (nombre en face de ${X_}).</div>`;
}

/* ---------- 5. graphique de proportionnalité ---------- */
const GC = [
  { xt: 'masse (kg)', yt: 'prix (€)', ux: 'kg', uy: '€', a0: X => `Quel est le prix de ${M(X)} kg ?`, a2: 'Quel est le prix d\'<b>un</b> kilogramme (le coefficient) ?', a3: Y => `Quelle masse peut-on acheter avec ${M(Y)} € ?`, what: 'le prix en fonction de la masse' },
  { xt: 'durée (h)', yt: 'distance (km)', ux: 'h', uy: 'km', a0: X => `Quelle distance est parcourue en ${M(X)} h ?`, a2: 'Quelle distance est parcourue en <b>une</b> heure (le coefficient) ?', a3: Y => `Combien d'heures faut-il pour parcourir ${M(Y)} km ?`, what: 'la distance en fonction de la durée' },
  { xt: 'volume (L)', yt: 'prix (€)', ux: 'L', uy: '€', a0: X => `Quel est le prix de ${M(X)} L ?`, a2: 'Quel est le prix d\'<b>un</b> litre (le coefficient) ?', a3: Y => `Quel volume peut-on acheter avec ${M(Y)} € ?`, what: 'le prix en fonction du volume' },
];
function L5(d) {
  const v = d < 1 ? 0 : d < 2 ? ri(0, 1) : d < 3 ? ri(0, 2) : ri(0, 3);
  const k = d < 1 ? pick([1, 2, 3, 4, 5]) : pick([1, 2, 3, 4, 5, 0.5, 1.5, 2.5, 10, 20]);
  const cx = pick(GC), xmax = 10;
  const ys = (v === 2 || !Number.isInteger(k)) ? niceStep(k * xmax) : k;
  const cand = [1, 2, 3, 4, 5, 6, 7, 8, 9].filter(X => Number.isInteger(r6(k * X / ys)));
  const X = pick(cand), Y = r6(k * X), f = x => k * x;
  const base = { xr: [0, xmax], xs: 1, xt: cx.xt, yt: cx.yt };
  const yr = top => [0, Math.ceil(r6(top / ys)) * ys];
  if (v === 1) {
    const kind = pick(['oui', 'oui', 'origine', 'courbe']), c0 = ys * ri(1, 2);
    const g = kind === 'oui' ? f : kind === 'origine' ? (x => k * x + c0) : chance(0.5) ? (x => k * xmax * (x / xmax) ** 2) : (x => k * xmax * Math.sqrt(x / xmax));
    const opts = [{ v: 'oui', l: 'Oui : c\'est une droite qui passe par l\'origine' }, { v: 'origine', l: 'Non : la droite ne passe pas par l\'origine' }, { v: 'courbe', l: 'Non : ce n\'est pas une droite' }];
    const msgs = { origine: 'Regarde le point de départ : la ligne passe-t-elle par l\'origine (0 ; 0) ?', courbe: 'Regarde bien : la ligne est-elle vraiment <b>droite</b> ?', oui: 'C\'est bien une droite, et elle part de l\'origine (0 ; 0).' };
    return {
      type: 'choice', opts,
      html: `Ce graphique donne ${cx.what}.<br>Représente-t-il une situation de <b>proportionnalité</b> ?`,
      visual: graph({ ...base, yr: yr(k * xmax + (kind === 'origine' ? c0 : 0)), ys, fs: [{ f: g }] }),
      check: choiceCheck(kind, { msg: () => msgs[kind] }),
      verify: e => {
        const lin = Math.abs(g(2) - g(1) - (g(7) - g(6))) < 1e-9 && Math.abs(g(9) - g(8) - (g(4) - g(3))) < 1e-9;
        return e === (lin && Math.abs(g(0)) < 1e-9 ? 'oui' : lin ? 'origine' : 'courbe');
      },
      hint: 'Une situation de proportionnalité est représentée par une <b>droite</b> qui passe par l\'<b>origine</b> du repère.',
      solution: kind === 'oui' ? 'C\'est une droite qui passe par l\'origine : c\'est une situation de proportionnalité.' : kind === 'origine' ? `C'est une droite, mais elle coupe l'axe vertical en ${M(c0)}, pas en 0 : ce n'est <b>pas</b> proportionnel.` : 'Les points ne sont pas alignés (c\'est une courbe) : ce n\'est <b>pas</b> proportionnel.',
    };
  }
  const vis = graph({ ...base, yr: yr(k * xmax), ys, fs: [{ f }], pts: v === 2 ? [{ x: X, y: Y, l: 'A' }] : [] });
  const after = graph({ ...base, yr: yr(k * xmax), ys, fs: [{ f }], guides: [{ x: X, y: Y }], pts: [{ x: X, y: Y, l: v === 2 ? 'A' : '' }] });
  if (v === 0) return {
    ...nums([Y], `{0} ${cx.uy}`, { value: f(10) / 10 * X, near: [[0, X / k, 'On part de l\'axe <b>horizontal</b>, on monte jusqu\'à la droite, puis on lit sur l\'axe <b>vertical</b>.']] }),
    html: `Ce graphique donne ${cx.what}.<br>${cx.a0(X)}`, visual: vis, afterVisual: after, replaceVisual: true,
    hint: `Pars de ${M(X)} sur l'axe horizontal, monte jusqu'à la droite, puis va à gauche lire la valeur sur l'axe vertical.`,
    solution: `On monte de ${M(X)} ${cx.ux} jusqu'à la droite, puis on lit sur l'axe vertical : <b>${M(Y)} ${cx.uy}</b>.`,
  };
  if (v === 2) return {
    ...nums([k], `{0} ${cx.uy}`, { value: Y / X, near: [[0, X / Y, `Coefficient inversé : on divise ${cx.yt.split(' ')[0]} par ${cx.xt.split(' ')[0]}.`], [0, Y, `C'est la valeur pour ${M(X)} ${cx.ux} : divise par ${M(X)} pour l'avoir pour 1 ${cx.ux}.`]] }),
    html: `Ce graphique donne ${cx.what}. Le point A est sur la droite.<br>${cx.a2}`, visual: vis, afterVisual: after, replaceVisual: true,
    hint: `Lis les coordonnées du point A, puis divise la valeur verticale par la valeur horizontale.`,
    solution: `A(${M(X)} ; ${M(Y)}) : ${M(X)} ${cx.ux} ↔ ${M(Y)} ${cx.uy}. Pour 1 ${cx.ux} : ${M(Y)} ÷ ${M(X)} = <b>${M(k)} ${cx.uy}</b>.`,
  };
  return {
    ...nums([X], `{0} ${cx.ux}`, { value: Y / k, near: [[0, Y * k, 'Ici on connaît la valeur <b>verticale</b> : on part de l\'axe vertical et on lit sur l\'axe horizontal.']] }),
    html: `Ce graphique donne ${cx.what}.<br>${cx.a3(Y)}`, visual: vis, afterVisual: after, replaceVisual: true,
    hint: `Pars de ${M(Y)} sur l'axe <b>vertical</b>, va jusqu'à la droite, puis descends lire la valeur sur l'axe horizontal.`,
    solution: `On part de ${M(Y)} ${cx.uy} sur l'axe vertical, on rejoint la droite et on descend : <b>${M(X)} ${cx.ux}</b>.`,
  };
}
function C5() {
  const vis = graph({ xr: [0, 10], xs: 1, yr: [0, 30], ys: 5, xt: 'masse (kg)', yt: 'prix (€)', fs: [{ f: x => 2.5 * x }, { f: x => 1.5 * x + 10, c: '#868e96' }], guides: [{ x: 4, y: 10 }, { x: 8, y: 20 }], pts: [{ x: 4, y: 10, l: 'A' }, { x: 8, y: 20 }] });
  return `<h2>5. Graphique de proportionnalité</h2>
<p class="intro">Un graphique permet de voir d'un coup d'œil si une situation est proportionnelle, et de lire des valeurs sans calculer.</p>
<div class="def">Une situation de proportionnalité est représentée par des points <b>alignés sur une droite qui passe par l'origine</b> (0 ; 0). Et réciproquement.</div>
${vis}
<div class="methode"><b>Méthode</b><ol>
<li>Pour reconnaître : est-ce une <b>droite</b> ? passe-t-elle par l'<b>origine</b> ? Il faut les deux.</li>
<li>Pour lire une valeur : pars de l'axe connu, va jusqu'à la droite, puis lis sur l'autre axe.</li>
<li>Pour le coefficient : prends un point de la droite et divise sa valeur verticale par sa valeur horizontale.</li></ol></div>
<div class="ex"><span class="q">Exemple 1 : droite orange, des pommes à 2,50 € le kg.</span><br>Pour 4 kg, on monte jusqu'à la droite et on lit <b>10 €</b> (point A). Coefficient : 10 ÷ 4 = <b>2,5 €</b> par kg.</div>
<div class="ex"><span class="q">Exemple 2 : dans l'autre sens, et un piège.</span><br>• Avec 20 €, on part de 20 sur l'axe vertical, on rejoint la droite et on descend : <b>8 kg</b>.<br>• La droite grise (abonnement de 10 € + 1,50 € par kg) ne passe pas par l'origine : ce n'est <b>pas</b> proportionnel.</div>
<div class="warn">⚠️ Une droite qui ne passe pas par l'origine n'est pas proportionnelle.<br>⚠️ Une courbe qui passe par l'origine n'est pas proportionnelle non plus : il faut une <b>droite</b>.<br>⚠️ Ne confonds pas les axes : la quantité connue se cherche sur son propre axe.</div>
<div class="retenir">À retenir : proportionnalité ⇔ droite passant par l'origine.</div>`;
}

/* ---------- 6. échelles ---------- */
const UF = { cm: 1, m: 100, km: 100000 };
function L6(d) {
  const v = d < 1 ? 0 : d < 2 ? ri(0, 1) : d < 3 ? ri(0, 2) : ri(0, 3);
  const maison = v === 0 || (v >= 2 && chance(0.3));
  const s = maison ? pick([50, 100, 200, 250, 500]) : pick([1000, 2000, 5000, 10000, 20000, 25000, 50000, 100000]);
  const L = (d < 1 ? 2 * ri(2, 9) : ri(4, 24)) / 2;           // longueur sur le plan, en cm
  const realCm = r6(L * s), u = maison || realCm < 100000 ? 'm' : 'km', real = r6(realCm / UF[u]);
  const kind = maison ? 'maison' : 'carte', what = maison ? 'ce plan' : 'cette carte', sc = `1/${gi(s)}`;
  const unitNear = (val) => ['cm', 'm', 'km'].filter(w => w !== u).map(w => [0, realCm / UF[w], `Bonne valeur… mais en <b>${w}</b> : la question demande des <b>${u}</b>.`]).concat([[0, val / 10, 'Attention à la conversion : 1 m = 100 cm et 1 km = 100 000 cm.'], [0, val * 10, 'Attention à la conversion : 1 m = 100 cm et 1 km = 100 000 cm.']]);
  const conv = `${gi(realCm)} cm = ${M(real)} ${u}`;
  if (v <= 1) return {
    ...nums([real], `{0} ${u}`, { value: L * (s / UF[u]), near: unitNear(real).concat([[0, L / s, `Du plan vers la réalité, on <b>multiplie</b> par ${gi(s)}.`]]) }),
    html: `Sur ${what} à l'échelle ${sc}, la longueur indiquée mesure ${M(L)} cm.<br>Quelle est la longueur réelle, en <b>${u}</b> ?`,
    visual: plan({ kind, lab: `${M(L)} cm`, scale: sc }),
    hint: `Échelle ${sc} : 1 cm sur le plan représente ${gi(s)} cm en réalité. Multiplie, puis convertis les cm en ${u}.`,
    solution: `${M(L)} × ${gi(s)} = ${gi(realCm)} cm en réalité, et ${conv}.<br>Longueur réelle : <b>${M(real)} ${u}</b>.`,
  };
  if (v === 2) return {
    ...nums([L], '{0} cm', { value: real * UF[u] / s, near: [[0, L * 10, 'Tu as répondu en mm ? La question demande des cm.'], [0, L / 10, 'Attention à la conversion : exprime d\'abord la longueur réelle en cm.'], [0, L * 100, 'Attention à la conversion : exprime d\'abord la longueur réelle en cm.'], [0, L / 100, 'Attention à la conversion : exprime d\'abord la longueur réelle en cm.'], [0, real * s, `De la réalité vers le plan, on <b>divise</b> par ${gi(s)}.`]] }),
    html: `Sur ${what} à l'échelle ${sc}, quelle longueur (en cm) représente une distance réelle de ${M(real)} ${u} ?`,
    visual: plan({ kind, lab: '? cm', scale: sc, real: `${M(real)} ${u}` }),
    hint: `Convertis d'abord ${M(real)} ${u} en cm, puis divise par ${gi(s)}.`,
    solution: `${M(real)} ${u} = ${gi(realCm)} cm, puis ${gi(realCm)} ÷ ${gi(s)} = <b>${M(L)} cm</b> sur le plan.`,
  };
  return {
    ...nums([s], 'Échelle : 1/{0}', { value: real * UF[u] / L, near: [100, 1000, 100000].map(f => [0, s / f, 'Les deux longueurs doivent être dans la <b>même unité</b> : convertis la longueur réelle en cm.']).concat([[0, L / realCm, 'L\'échelle s\'écrit 1/… : divise la longueur réelle par la longueur sur le plan.']]) }),
    html: `Sur ${what}, ${M(L)} cm représentent ${M(real)} ${u} en réalité.<br>Quelle est l'échelle ?`,
    visual: plan({ kind, lab: `${M(L)} cm`, scale: '1/?', real: `${M(real)} ${u}` }),
    hint: `Convertis ${M(real)} ${u} en cm, puis cherche combien de fois ${M(L)} cm y entrent (division).`,
    solution: `${M(real)} ${u} = ${gi(realCm)} cm, et ${gi(realCm)} ÷ ${M(L)} = ${gi(s)}. L'échelle est <b>1/${gi(s)}</b>.`,
  };
}
function C6() {
  return `<h2>6. Échelles</h2>
<p class="intro">Un plan ou une carte est une réduction de la réalité. L'échelle dit combien de fois tout a été réduit.</p>
<div class="def">Sur un plan à l'échelle <b>1/200</b>, 1 cm sur le plan représente <b>200 cm</b> en réalité. Les longueurs sont proportionnelles (dans la <b>même unité</b>) :<br>longueur réelle = longueur sur le plan × 200 ; longueur sur le plan = longueur réelle ÷ 200.<br>Conversions : 1 m = 100 cm ; 1 km = 1 000 m = 100 000 cm.</div>
${plan({ kind: 'maison', lab: '3 cm', scale: '1/200', real: '6 m' })}
<div class="methode"><b>Méthode</b><ol>
<li>Du plan vers la réalité : <b>multiplie</b> par le nombre de l'échelle, puis convertis les cm en m ou en km.</li>
<li>De la réalité vers le plan : convertis d'abord en cm, puis <b>divise</b>.</li>
<li>Pour trouver l'échelle : mets les deux longueurs en cm, puis divise la réelle par celle du plan.</li></ol></div>
<div class="ex"><span class="q">Exemple 1 : du plan vers la réalité.</span><br>• Plan au 1/200 : 3 cm × 200 = 600 cm = <b>6 m</b>.<br>• Carte au 1/25 000 : 4 cm × 25 000 = 100 000 cm = <b>1 km</b>.</div>
<div class="ex"><span class="q">Exemple 2 : de la réalité vers la carte, et trouver l'échelle.</span><br>• Carte au 1/50 000, distance réelle 3 km = 300 000 cm : 300 000 ÷ 50 000 = <b>6 cm</b>.<br>• 2 cm sur la carte pour 1 km = 100 000 cm : 100 000 ÷ 2 = 50 000, échelle <b>1/50 000</b>.</div>
<div class="warn">⚠️ Le calcul donne des <b>cm</b> : pense à convertir dans l'unité demandée (m, km).<br>⚠️ Pour trouver l'échelle, les deux longueurs doivent être dans la <b>même unité</b>.</div>
<div class="retenir">À retenir : échelle 1/n : réel = plan × n, dans la même unité.</div>`;
}

/* ---------- 7. vitesses ---------- */
function L7(d) {
  const v = d < 1 ? 0 : d < 2 ? ri(0, 1) : d < 3 ? ri(0, 2) : ri(0, 3);
  let tm, V;
  if (v === 0) { tm = 60 * ri(1, 4); V = 5 * ri(6, 26); }
  else { tm = pick([15, 20, 30, 40, 45, 90, 75, 150, 105, 80]); const g = 60 / gcd(tm, 60); V = g * ri(Math.ceil(20 / g), Math.floor(120 / g)); }
  const D = V * tm / 60, h = Math.floor(tm / 60), r = tm % 60;
  const who = V <= 30 ? 'Un cycliste' : V <= 90 ? 'Une voiture' : 'Un train';
  const fake = h + r / 100; // 1 h 30 lu comme 1,30 h
  const tH = r6(tm / 60);
  const hmsg = r ? `Attention : ${dur(tm)} ne s'écrit pas ${M(fake)} h ! ${r} min = ${r} ÷ 60 h, donc ${dur(tm)} = ${M(tH)} h.` : '';
  if (v <= 1) return {
    ...nums([D], '{0} km', { value: (V / 60) * tm, near: [[0, V * tm, 'Tu as multiplié par des <b>minutes</b> : convertis d\'abord la durée en heures.'], [0, V * fake, hmsg], [0, V / tH, 'Distance = vitesse × durée : on <b>multiplie</b>.']] }),
    html: `${who} roule à ${V} km/h pendant ${dur(tm)}.<br>Quelle distance parcourt-${who === 'Une voiture' ? 'elle' : 'il'} ?`,
    visual: road({ d: '? km', t: dur(tm), v: `${V} km/h` }),
    hint: r || h === 0 ? `Écris d'abord la durée en heures (${r} min = ${r} ÷ 60 h), puis distance = vitesse × durée.` : 'Distance = vitesse × durée (en heures).',
    solution: (r || !h ? `${dur(tm)} = ${M(tH)} h. ` : '') + `Distance = ${V} × ${M(tH)} = <b>${M(D)} km</b>.`,
  };
  if (v === 2) return {
    ...nums([V], '{0} km/h', { value: D / (tm / 60), near: [[0, D / tm, 'C\'est une vitesse en km par <b>minute</b> : multiplie par 60 pour l\'avoir en km/h.'], [0, D * tH, 'Vitesse = distance ÷ durée : on <b>divise</b>.'], [0, D / fake, hmsg]] }),
    html: `${who} parcourt ${M(D)} km en ${dur(tm)}.<br>Quelle est sa vitesse moyenne, en km/h ?`,
    visual: road({ d: `${M(D)} km`, t: dur(tm), v: '? km/h' }),
    hint: `Vitesse = distance ÷ durée, avec la durée <b>en heures</b> (${dur(tm)} = ? h). Ou : combien de km en 60 min ?`,
    solution: `${dur(tm)} = ${M(tH)} h. Vitesse = ${M(D)} ÷ ${M(tH)} = <b>${V} km/h</b>.`,
  };
  return {
    ...nums([tm], '{0} min', { value: D * 60 / V, near: [[0, D / V, 'C\'est la durée en <b>heures</b> : convertis-la en minutes (× 60).'], [0, V / D * 60, 'Durée = distance ÷ vitesse (et pas l\'inverse).']] }),
    html: `${who} roule à ${V} km/h. Combien de <b>minutes</b> lui faut-il pour parcourir ${M(D)} km ?`,
    visual: road({ d: `${M(D)} km`, t: '? min', v: `${V} km/h` }),
    hint: `Durée (en h) = distance ÷ vitesse, puis multiplie par 60 pour avoir des minutes.`,
    solution: `Durée = ${M(D)} ÷ ${V} = ${M(tH)} h = ${M(tH)} × 60 min = <b>${tm} min</b>.`,
  };
}
function C7() {
  return `<h2>7. Vitesses</h2>
<p class="intro">À vitesse constante, plus on roule longtemps, plus on va loin, proportionnellement : la vitesse est le coefficient de proportionnalité.</p>
<div class="def">À vitesse constante, la distance est proportionnelle à la durée :<br><b>d = v × t</b> ; <b>v = d ÷ t</b> ; <b>t = d ÷ v</b> (v en km/h, t en heures).</div>
${road({ d: '120 km', t: '1 h 30 min', v: '80 km/h' })}
${tab(['Minutes', 'Heures'], [15, 20, 30, 45, 90], ['0,25', `${F(1, 3)}`, '0,5', '0,75', '1,5'], { coef: '÷ 60' })}
<div class="methode"><b>Méthode</b><ol>
<li>Convertis la durée en <b>heures</b> : minutes ÷ 60 (30 min = 0,5 h).</li>
<li>Choisis la formule : distance → ×, vitesse ou durée → ÷.</li>
<li>Si on demande des minutes, multiplie la durée en heures par 60.</li></ol></div>
<div class="ex"><span class="q">Exemple 1 : 80 km/h pendant 1 h 30 min.</span><br>1 h 30 min = 1,5 h, donc d = 80 × 1,5 = <b>120 km</b>.</div>
<div class="ex"><span class="q">Exemple 2 : une vitesse et une durée.</span><br>• 45 km en 45 min : 45 min = 0,75 h, donc v = 45 ÷ 0,75 = <b>60 km/h</b> (1 km par minute).<br>• 18 km à 12 km/h : t = 18 ÷ 12 = 1,5 h = 1,5 × 60 = <b>90 min</b>.</div>
<div class="ex"><span class="q">Exemple 3 : des durées qui ne tombent pas juste (20 min, 40 min, 1 h 20 min).</span><br>• 37 km en 20 min : en 1 h il y a 3 fois 20 min, donc v = 37 × 3 = <b>111 km/h</b>.<br>• 140 km en 1 h 20 min = 80 min : 140 ÷ 80 = 1,75 km par minute, donc v = 1,75 × 60 = <b>105 km/h</b>.<br>• 48 km/h pendant 1 h 20 min : 48 km en 1 h, plus 48 ÷ 3 = 16 km en 20 min, donc d = <b>64 km</b>.</div>
<div class="warn">⚠️ <b>1 h 30 min ≠ 1,30 h</b> : 30 min = une demi-heure, donc 1 h 30 min = 1,5 h.<br>⚠️ Les unités doivent aller ensemble : avec des km/h, la durée est en <b>heures</b>.<br>⚠️ v = d ÷ t, pas t ÷ d.</div>
<div class="retenir">À retenir : d = v × t, avec t en heures.</div>`;
}

/* ---------- 8. appliquer un pourcentage ---------- */
function L8(d) {
  let t, N;
  if (d < 1) { t = pick([50, 25, 10, 75, 20]); N = 20 * ri(1, 15); }
  else if (d < 3) { t = pick([5, 15, 30, 40, 60, 70, 80, 90, 35, 12]); N = 20 * ri(1, 20); }
  else { t = ri(1, 99); N = 10 * ri(2, 60); }
  const T = r6(t * N / 100);
  const near = [[0, N * t, `N'oublie pas de diviser par 100 : ${t} % = ${F(t, 100)}.`], [0, N - T, `Tu as calculé ce qui <b>reste</b> (${100 - t} %), pas les ${t} %.`], [0, N / t, `On ne divise pas par ${t} : on prend ${t} centièmes.`]];
  let html = `Calcule ${t} % de ${gi(N)}.`, tpl = '{0}';
  if (d >= 2 && chance(0.6)) {
    if (Number.isInteger(T) && chance(0.5)) { html = `Un collège compte ${gi(N)} élèves. ${t} % d'entre eux viennent à vélo.<br>Combien d'élèves viennent à vélo ?`; tpl = '{0} élèves'; }
    else { html = `Un article coûte ${eur(N)}. Il est soldé à −${t} %.<br>Quel est le montant de la réduction ?`; tpl = '{0} €'; }
  }
  const tip = t === 50 ? ' (50 %, c\'est la moitié)' : t === 25 ? ' (25 %, c\'est le quart)' : t === 10 ? ' (10 %, c\'est diviser par 10)' : t === 75 ? ' (75 %, ce sont les trois quarts)' : '';
  return {
    ...nums([T], tpl, { value: (N / 100) * t, near }),
    html, visual: pctBar(t, { total: `100 % = ${gi(N)}`, part: '?' }),
    hint: `${t} % de ${gi(N)}, c'est ${F(t, 100)} × ${gi(N)} : divise ${gi(N)} par 100, puis multiplie par ${t}.`,
    solution: `${t} % de ${gi(N)} = ${gi(N)} ÷ 100 × ${t} = ${M(N / 100)} × ${t} = <b>${M(T)}</b>${tip}.`,
  };
}
function C8() {
  return `<h2>8. Appliquer un pourcentage</h2>
<p class="intro">Soldes, élèves qui viennent à vélo, part d'un budget… Un pourcentage est une proportion « sur 100 ».</p>
<div class="def">Prendre <b>t %</b> d'une quantité, c'est la multiplier par ${F('t', 100)} :<br>t % de N = N ÷ 100 × t.</div>
${pctBar(30, { total: '100 % = 80 €', part: '24 €' })}
<div class="methode"><b>Méthode</b><ol>
<li>Divise la quantité par 100 : c'est 1 %.</li>
<li>Multiplie par t.</li>
<li>Astuces : 50 % = la moitié ; 25 % = le quart ; 10 % = ÷ 10 ; 5 % = la moitié de 10 %.</li></ol></div>
<div class="ex"><span class="q">Exemple 1 : 30 % de 80 €.</span><br>80 ÷ 100 × 30 = 0,8 × 30 = <b>24 €</b>.</div>
<div class="ex"><span class="q">Exemple 2 : des pourcentages dans des problèmes.</span><br>• Un collège de 240 élèves, dont 15 % viennent à vélo : 240 ÷ 100 × 15 = 2,4 × 15 = <b>36 élèves</b>.<br>• Un article à 45 € soldé à −20 % : la réduction est 45 ÷ 100 × 20 = <b>9 €</b>.<br>• 5 % de 60 : 10 % de 60 = 6, donc 5 % = <b>3</b>.</div>
<div class="warn">⚠️ Ne pas oublier de diviser par 100 : 30 % de 80, ce n'est pas 30 × 80.<br>⚠️ On ne divise pas par 30 : on prend 30 centièmes.<br>⚠️ Lis bien la question : la réduction (20 %) ou ce qui reste à payer (80 %) ?</div>
<div class="retenir">À retenir : t % de N = N × t ÷ 100.</div>`;
}

/* ---------- 9. calculer un pourcentage ---------- */
function L9(d) {
  const Ts = d < 1 ? [10, 20, 25, 50, 100, 200] : d < 3 ? [20, 25, 40, 50, 80, 200, 250, 300, 400, 500] : [8, 16, 40, 80, 120, 160, 200, 30, 60];
  let T, part, p;
  do { T = pick(Ts); part = ri(1, T - 1); p = r6(part * 100 / T); } while (d < 3 ? !Number.isInteger(p) : !Number.isInteger(r6(p * 10)));
  const nm = prenom();
  const html = pick([
    `Dans un club de ${T} membres, ${part} font de la natation.<br>Quel <b>pourcentage</b> des membres font de la natation ?`,
    `${nm} a réussi ${part} questions sur ${T}.<br>Quel est son <b>pourcentage</b> de réussite ?`,
    `Sur ${T} graines plantées, ${part} ont germé.<br>Quel <b>pourcentage</b> des graines a germé ?`,
  ]);
  const near = [[0, part / T, 'Tu as trouvé la proportion : multiplie-la par 100 pour l\'écrire en %.'], [0, T / part * 100, 'C\'est l\'inverse : on divise la <b>partie</b> par le <b>total</b>.'], [0, 100 - p, 'Tu as calculé le pourcentage de l\'autre partie (le reste).']];
  if (T !== 100) near.push([0, part, 'Le pourcentage n\'est égal au nombre que si le total vaut 100.']);
  return {
    ...nums([p], '{0} %', { value: part / T * 100, near }),
    html, visual: T <= 50 ? cells(part, T) : pctBar(p, { label: '? %', part: `${part}`, total: `${T} = 100 %` }),
    hint: `Pourcentage = partie ÷ total × 100. Ou : tableau de proportionnalité ${T} → 100, ${part} → ?`,
    solution: `${part} ÷ ${T} = ${M(part / T)}, et ${M(part / T)} × 100 = <b>${M(p)} %</b>.${tab(['Effectif', 'Pourcentage'], [T, part], [100, p])}`,
  };
}
function C9() {
  return `<h2>9. Calculer un pourcentage</h2>
<p class="intro">Pour comparer des parts de totaux différents, on les ramène toutes à un total de 100 : c'est le pourcentage.</p>
<div class="cols">
<div class="def">Pour savoir quel pourcentage représente une partie d'un total :<br><b>pourcentage = partie ÷ total × 100</b>.</div>
<div>${cells(6, 25)}</div>
</div>
<div class="methode"><b>Méthode</b><ol>
<li>Repère la <b>partie</b> et le <b>total</b>.</li>
<li>Divise la partie par le total.</li>
<li>Multiplie par 100 et écris le signe %. Ou fais un tableau total → 100, partie → ?</li></ol></div>
<div class="ex"><span class="q">Exemple 1 : 6 cases coloriées sur 25.</span><br>6 ÷ 25 = 0,24 et 0,24 × 100 = <b>24 %</b>. Avec un tableau de proportionnalité :${tab(['Effectif', 'Pourcentage'], [25, 6], [100, 24], { coef: '× 4' })}</div>
<div class="ex"><span class="q">Exemple 2 : 18 graines sur 40 ont germé ; 7 questions réussies sur 8.</span><br>• 18 ÷ 40 = 0,45, soit <b>45 %</b>.<br>• 7 ÷ 8 = 0,875, soit <b>87,5 %</b> : un pourcentage peut être décimal.</div>
<div class="warn">⚠️ On divise la <b>partie</b> par le <b>total</b>, pas l'inverse.<br>⚠️ 6 sur 25, ce n'est pas 6 % : le nombre n'est égal au pourcentage que si le total vaut 100.<br>⚠️ 0,24 n'est pas la réponse : il faut multiplier par 100.</div>
<div class="retenir">À retenir : pourcentage = partie ÷ total × 100.</div>`;
}

/* ---------- 10. hausses et baisses en % ---------- */
const ART = ['pull', 'jeu vidéo', 'vélo', 'casque audio', 'sac à dos', 'ballon'];
function L10(d) {
  const up = chance(0.5), obj = pick(ART);
  let t, P;
  if (d < 1) { t = pick([10, 20, 25, 50]); P = 10 * ri(2, 30); }
  else { t = pick([5, 15, 30, 40, 12, 35, 8, 60]); P = 20 * ri(1, 25); }
  const dv = r6(P * t / 100), NP = r6(up ? P + dv : P - dv), mot = up ? 'hausse' : 'baisse';
  const phr = up ? `Le prix d'un ${obj} est de ${eur(P)}. Il augmente de ${t} %.` : `Un ${obj} coûte ${eur(P)}. Son prix baisse de ${t} %.`;
  const sol = `${mot[0].toUpperCase() + mot.slice(1)} : ${t} % de ${eur(P)} = ${eur(P)} ÷ 100 × ${t} = ${eur(dv)}.<br>Nouveau prix : ${eur(P)} ${up ? '+' : '−'} ${eur(dv)} = <b>${eur(NP)}</b>.`;
  if (d >= 3 && chance(0.5)) return {
    ...nums([t], `${up ? 'Hausse' : 'Baisse'} de {0} %`, { value: Math.abs(NP - P) / P * 100, near: [[0, Math.abs(NP - P) / NP * 100, 'Le pourcentage se calcule par rapport au prix de <b>départ</b>, pas au nouveau prix.'], [0, Math.abs(NP - P), 'C\'est la variation en euros : divise-la par le prix de départ, puis multiplie par 100.']] }),
    html: `Le prix d'un ${obj} passe de ${eur(P)} à ${eur(NP)}.<br>De quel pourcentage a-t-il ${up ? 'augmenté' : 'baissé'} ?`,
    visual: evoBars(t, up, { before: eur(P), after: eur(NP), hide: true }),
    hint: 'Calcule la variation en euros, puis divise-la par le prix de <b>départ</b> et multiplie par 100.',
    solution: `Variation : ${eur(Math.abs(NP - P))}. Puis ${M(dv)} ÷ ${M(P)} × 100 = <b>${t} %</b>.`,
  };
  const two = d < 2, i = two ? 1 : 0;
  const near = [[i, up ? P + t : P - t, `Tu as ${up ? 'ajouté' : 'enlevé'} ${t} <b>euros</b>, pas ${t} % !`], [i, up ? P - dv : P + dv, `Attention au sens : c'est une <b>${mot}</b>.`], [i, dv, `C'est le montant de la ${mot} : il faut encore ${up ? 'l\'ajouter au' : 'l\'enlever du'} prix de départ.`]];
  if (two) near.push([0, P * t, 'N\'oublie pas de diviser par 100.'], [0, NP, `C'est le nouveau prix : la 1<sup>re</sup> case attend seulement le montant de la ${mot}.`]);
  return {
    ...nums(two ? [dv, NP] : [NP], two ? `Montant de la ${mot} : {0} € <span class="sep"></span> Nouveau prix : {1} €` : 'Nouveau prix : {0} €', { value: P * (1 + (up ? t : -t) / 100), near }),
    html: phr + '<br>Quel est son nouveau prix ?',
    visual: evoBars(t, up, { before: eur(P), after: '?' }),
    hint: `Calcule d'abord ${t} % de ${eur(P)}, puis ${up ? 'ajoute-le au' : 'enlève-le du'} prix de départ.`,
    solution: sol,
  };
}
function C10() {
  return `<h2>10. Hausses et baisses en %</h2>
<p class="intro">Les prix montent ou baissent souvent d'un certain pourcentage. Le calcul se fait toujours à partir du prix de départ.</p>
<div class="def">Une hausse (ou une baisse) de t % se calcule <b>sur la valeur de départ</b> :<br>nouvelle valeur = valeur de départ + (ou −) t % de la valeur de départ.</div>
${evoBars(20, false, { before: '45 €', after: '36 €' })}
<div class="methode"><b>Méthode</b><ol>
<li>Calcule le montant de la variation : t % du prix de départ.</li>
<li>Ajoute-le (hausse) ou enlève-le (baisse).</li>
<li>Pour retrouver le pourcentage : variation ÷ prix de départ × 100.</li></ol></div>
<div class="ex"><span class="q">Exemple 1 : un jeu à 45 € baisse de 20 %.</span><br>20 % de 45 = 45 ÷ 100 × 20 = 9 €. Nouveau prix : 45 − 9 = <b>36 €</b>.</div>
<div class="ex"><span class="q">Exemple 2 : une hausse, puis retrouver le pourcentage.</span><br>• Un pull à 60 € augmente de 15 % : 15 % de 60 = 9 €, nouveau prix 60 + 9 = <b>69 €</b>.<br>• Un prix passe de 50 € à 56 € : la hausse est de 6 €, et 6 ÷ 50 × 100 = <b>12 %</b>.</div>
<div class="warn">⚠️ Baisser de 20 %, ce n'est pas enlever 20 € !<br>⚠️ Le pourcentage se calcule par rapport à la valeur de <b>départ</b> : 6 ÷ 50, pas 6 ÷ 56.<br>⚠️ Le montant de la hausse n'est pas le nouveau prix : il faut encore l'ajouter.</div>
<div class="retenir">À retenir : nouvelle valeur = départ ± t % du départ.</div>`;
}

/* ---------- 11. coefficient multiplicateur ---------- */
function L11(d) {
  const v = d < 1 ? 0 : d < 2 ? ri(0, 1) : d < 3 ? ri(0, 2) : ri(0, 3);
  const up = chance(0.5), t = pick(d < 1 ? [10, 20, 30, 50, 25, 5] : [5, 15, 12, 35, 8, 40, 60, 3, 2]);
  const c = r6(1 + (up ? t : -t) / 100), mot = up ? 'hausse' : 'baisse', sgn = up ? '+' : '−', obj = pick(ART);
  const cExpl = `${up ? 'Hausse' : 'Baisse'} de ${t} % : on multiplie par 1 ${sgn} ${F(t, 100)} = 1 ${sgn} ${M(t / 100)} = ${M(c)}.`;
  if (v === 0) return {
    ...nums([c], `${up ? 'Augmenter' : 'Diminuer'} de ${t} %, c'est multiplier par {0}`, {
      value: (200 + (up ? 1 : -1) * 2 * t) / 200, // effet sur 200 €
      near: [[0, t / 100, `${t} % = ${M(t / 100)}, mais il faut partir de 1 : le coefficient est 1 ${sgn} ${M(t / 100)}.`], [0, 1 + (up ? 1 : -1) * t / 10, `Attention à la virgule : ${t} % = ${M(t / 100)}.`], [0, up ? 1 - t / 100 : 1 + t / 100, 'Attention au sens : une hausse donne un coefficient plus grand que 1, une baisse plus petit que 1.']],
    }),
    html: `Complète.`, visual: evoBars(t, up, { before: '100 %', after: `${100 + (up ? t : -t)} %` }),
    hint: `100 % ${sgn} ${t} % = ${100 + (up ? t : -t)} %. Écris ce pourcentage sous forme décimale.`,
    solution: cExpl,
  };
  if (v === 1) {
    const P = 20 * ri(1, 25), NP = r6(P * c);
    return {
      ...nums([c, NP], `${eur(P)} × {0} = {1} €`, { value: P + (up ? 1 : -1) * P * t / 100, near: [[0, t / 100, 'Il faut partir de 1 : le coefficient est 1 + ou − le pourcentage.'], [0, 1 + (up ? 1 : -1) * t / 10, `Attention à la virgule : ${t} % = ${M(t / 100)}.`], [1, up ? P + t : P - t, `Tu as ${up ? 'ajouté' : 'enlevé'} ${t} euros, pas ${t} % !`]] }),
      html: `Le prix d'un ${obj} (${eur(P)}) subit une <b>${mot} de ${t} %</b>.<br>Calcule le nouveau prix avec le coefficient multiplicateur.`,
      hint: `Le coefficient d'une ${mot} de ${t} % est 1 ${sgn} ${F(t, 100)}.`,
      solution: `${cExpl}<br>${eur(P)} × ${M(c)} = <b>${eur(NP)}</b>.`,
    };
  }
  if (v === 2) {
    const r1 = r6(c * 100), opts = [`${up ? 'h' : 'b'}${t}`, `${up ? 'b' : 'h'}${t}`, `h${r1}`];
    if (r1 < 100) opts.push(`b${r1}`); else opts.push(`b${r6(r1 - 100)}`);
    const uniq = shuffle([...new Set(opts)]).map(o => ({ v: o, l: `une <b>${o[0] === 'h' ? 'hausse' : 'baisse'}</b> de ${M(+o.slice(1))} %` }));
    const E = `${up ? 'h' : 'b'}${t}`;
    return {
      type: 'choice', opts: uniq, check: choiceCheck(E, { msg: ch => (ch.slice(1) === String(r1) ? 'Le coefficient n\'est pas le pourcentage : compare-le à 1.' : ch[0] !== E[0] ? `Le coefficient est ${c > 1 ? 'plus grand' : 'plus petit'} que 1 : c'est une ${mot}.` : '') }),
      verify: e => Math.abs((1 + (e[0] === 'h' ? 1 : -1) * +e.slice(1) / 100) - c) < 1e-9,
      html: `Multiplier un prix par <b>${M(c)}</b>, c'est appliquer…`,
      hint: `Compare ${M(c)} à 1 : plus grand → hausse, plus petit → baisse. L'écart avec 1, écrit en %, donne le pourcentage.`,
      solution: `${M(c)} = 1 ${sgn} ${M(t / 100)}, et ${M(t / 100)} = ${t} %. C'est une <b>${mot} de ${t} %</b>.`,
    };
  }
  const t3 = pick([10, 20, 25, 50, 5, 40]), c3 = r6(1 + (up ? t3 : -t3) / 100), Pi = 20 * ri(2, 25), NP = r6(Pi * c3);
  return {
    ...nums([Pi], 'Prix de départ : {0} €', { value: NP / c3, near: [[0, NP * (1 + (up ? -t3 : t3) / 100), `On ne peut pas appliquer ${up ? '−' : '+'} ${t3} % au nouveau prix : le pourcentage porte sur le prix de <b>départ</b>. Divise par le coefficient ${M(c3)}.`], [0, up ? NP - t3 : NP + t3, `${t3} %, ce ne sont pas ${t3} euros.`], [0, NP * c3, 'On remonte vers le prix de départ : on <b>divise</b> par le coefficient.']] }),
    html: `Après une ${up ? 'hausse' : 'baisse'} de ${t3} %, un ${obj} coûte ${eur(NP)}.<br>Quel était son prix <b>avant</b> ?`,
    visual: evoBars(t3, up, { before: '?', after: eur(NP) }),
    hint: `Prix de départ × ${M(c3)} = ${eur(NP)}. Pour retrouver le prix de départ, on <b>divise</b> par le coefficient.`,
    solution: `Coefficient : ${M(c3)}. Prix de départ = ${eur(NP)} ÷ ${M(c3)} = <b>${eur(Pi)}</b>.<br>Vérification : ${eur(Pi)} × ${M(c3)} = ${eur(NP)}.`,
  };
}
function C11() {
  return `<h2>11. Coefficient multiplicateur</h2>
<p class="intro">On peut faire une hausse ou une baisse en <b>une seule multiplication</b>. C'est plus rapide et cela permet de remonter au prix de départ.</p>
<div class="def">• Augmenter de t %, c'est <b>multiplier par 1 + ${F('t', 100)}</b>.<br>• Diminuer de t %, c'est <b>multiplier par 1 − ${F('t', 100)}</b>.<br>Coefficient &gt; 1 : hausse ; coefficient &lt; 1 : baisse.</div>
${evoBars(15, true, { before: '100 %', after: '× 1,15' })}
${tab(['Évolution', 'Coefficient'], ['+ 15 %', '− 20 %', '+ 5 %', '− 3 %'], ['1,15', '0,8', '1,05', '0,97'])}
<div class="methode"><b>Méthode</b><ol>
<li>Écris 100 % ± t %, puis divise par 100 : c'est le coefficient.</li>
<li>Nouveau prix = prix de départ × coefficient.</li>
<li>Prix de départ = nouveau prix ÷ coefficient.</li>
<li>Pour lire un coefficient : compare-le à 1, l'écart donne le pourcentage (0,97 = 1 − 0,03 : baisse de 3 %).</li></ol></div>
<div class="ex"><span class="q">Exemple 1 : un vélo à 300 € augmente de 15 %.</span><br>Coefficient 1 + 0,15 = 1,15, donc 300 × 1,15 = <b>345 €</b>.</div>
<div class="ex"><span class="q">Exemple 2 : retrouver le prix de départ, lire un coefficient.</span><br>• Après −20 %, un jeu coûte 32 €. Coefficient 0,8, donc avant : 32 ÷ 0,8 = <b>40 €</b>.<br>• Multiplier par 1,4, c'est une <b>hausse de 40 %</b> ; multiplier par 0,6, une <b>baisse de 40 %</b>.</div>
<div class="warn">⚠️ + 5 % donne le coefficient 1,05 et non 1,5 !<br>⚠️ Le coefficient n'est pas le pourcentage : 0,15 seul ne suffit pas, il faut partir de 1.<br>⚠️ Pour revenir au prix de départ, on <b>divise</b> par le coefficient : enlever 20 % au nouveau prix ne marche pas.</div>
<div class="retenir">À retenir : ± t % ⇔ × (1 ± t ÷ 100).</div>`;
}

/* ---------- 12. évolutions successives et défis ---------- */
function L12(d) {
  const v = ri(0, Math.min(4, d + 1));
  if (v === 0) {
    const t = pick([10, 20, 25, 50]), P = 20 * ri(2, 25), upFirst = chance(0.5);
    const c1 = 1 + (upFirst ? t : -t) / 100, c2 = 1 + (upFirst ? -t : t) / 100, P1 = r6(P * c1), Pf = r6(P1 * c2);
    return {
      ...nums([Pf], 'Prix final : {0} €', { value: (P + (upFirst ? 1 : -1) * P * t / 100) * (1 + (upFirst ? -1 : 1) * t / 100), near: [[0, P, `${upFirst ? '+' : '−'} ${t} % puis ${upFirst ? '−' : '+'} ${t} % ne s'annulent pas : le 2<sup>e</sup> pourcentage porte sur le <b>nouveau</b> prix.`]] }),
      html: `Un prix de ${eur(P)} ${upFirst ? 'augmente' : 'baisse'} de ${t} %, puis ${upFirst ? 'baisse' : 'augmente'} de ${t} %.<br>Quel est le prix final ?`,
      hint: `Applique les deux évolutions l'une après l'autre : × ${M(c1)}, puis × ${M(c2)}.`,
      solution: `${eur(P)} × ${M(c1)} = ${eur(P1)}, puis ${eur(P1)} × ${M(c2)} = <b>${eur(Pf)}</b>. Ce n'est pas le prix de départ !`,
    };
  }
  if (v === 1) {
    const up = chance(0.5), t1 = 10 * ri(1, 5), t2 = 10 * ri(1, 5), s = up ? 1 : -1;
    const cg = r6((1 + s * t1 / 100) * (1 + s * t2 / 100)), g = r6(Math.abs(cg - 1) * 100);
    const a1 = 100 + s * t1, a2 = a1 + s * a1 * t2 / 100; // sur 100 €
    return {
      ...nums([g], `${up ? 'Hausse' : 'Baisse'} globale de {0} %`, { value: Math.abs(a2 - 100), near: [[0, t1 + t2, 'Les pourcentages successifs ne s\'additionnent pas : on <b>multiplie</b> les coefficients.']] }),
      html: `Un prix ${up ? 'augmente' : 'baisse'} de ${t1} %, puis ${up ? 'augmente' : 'baisse'} encore de ${t2} %.<br>Quelle est l'évolution globale ?`,
      hint: `Multiplie les deux coefficients (${M(1 + s * t1 / 100)} et ${M(1 + s * t2 / 100)}), puis compare le résultat à 1. Ou essaie avec un prix de 100 €.`,
      solution: `${M(1 + s * t1 / 100)} × ${M(1 + s * t2 / 100)} = ${M(cg)} = 1 ${up ? '+' : '−'} ${M(g / 100)} : ${up ? 'hausse' : 'baisse'} globale de <b>${M(g)} %</b> (et pas ${t1 + t2} %).`,
    };
  }
  if (v === 2) {
    const t = pick([10, 20, 30, 40, 50]), g = r6(t * t / 100);
    return {
      ...nums([g], 'Baisse globale de {0} %', { value: 100 - (100 + t) * (100 - t) / 100, near: [[0, 0, `Eh non, + ${t} % puis − ${t} % ne fait pas 0 % : la baisse porte sur un prix plus grand.`]] }),
      html: `Un prix augmente de ${t} %, puis baisse de ${t} %.<br>Globalement, de combien de % a-t-il baissé ?`,
      visual: evoBars(t, true, { before: '100 €', after: `${100 + t} €` }),
      hint: `Essaie avec un prix de 100 € : calcule le prix après la hausse, puis après la baisse.`,
      solution: `100 € × ${M(1 + t / 100)} = ${100 + t} €, puis ${100 + t} € × ${M(1 - t / 100)} = ${M(100 - g)} €. Baisse globale : <b>${M(g)} %</b>.`,
    };
  }
  if (v === 3) { // carte + vitesse
    let s, V, tm, D, L, k = 0;
    do {
      s = pick([10000, 20000, 25000, 50000]); V = pick([4, 5, 6, 12, 15, 18, 20]); tm = pick([10, 12, 15, 20, 24, 30, 36, 40, 45, 48, 60, 90]);
      D = r6(V * tm / 60); L = r6(D * 100000 / s);
    } while (k++ < 300 && !(Number.isInteger(L * 2) && L >= 2 && L <= 24 && Number.isInteger(r6(D * 1000))));
    if (!(Number.isInteger(L * 2) && L >= 2 && L <= 24)) { s = 25000; V = 15; tm = 12; D = 3; L = 12; }
    const nm = prenom();
    return {
      ...nums([tm], '{0} min', { value: (L * s / 100000) / V * 60, near: [[0, tm / 60, 'C\'est la durée en <b>heures</b> : convertis-la en minutes.'], [0, L / V * 60, 'Commence par la distance <b>réelle</b> (avec l\'échelle).']] }),
      html: `Sur une carte au 1/${gi(s)}, le trajet de ${nm} mesure ${M(L)} cm. ${nm} roule à vélo à ${V} km/h.<br>Combien de minutes dure le trajet ?`,
      visual: plan({ kind: 'carte', lab: `${M(L)} cm`, scale: `1/${gi(s)}` }),
      hint: 'Étape 1 : distance réelle en km avec l\'échelle. Étape 2 : durée = distance ÷ vitesse, en heures, puis en minutes.',
      solution: `${M(L)} × ${gi(s)} = ${gi(r6(L * s))} cm = ${M(D)} km. Durée : ${M(D)} ÷ ${V} = ${M(r6(tm / 60))} h = <b>${tm} min</b>.`,
    };
  }
  const a = pick([20, 30, 40, 50, 60, 80]), b = pick([10, 20, 25, 50, 30]), g = r6(a * b / 100);
  return {
    ...nums([g], '{0} %', { value: (1000 * a / 100) * b / 100 / 1000 * 100, near: [[0, a + b, 'On ne les additionne pas : c\'est un pourcentage <b>d\'un</b> pourcentage.'], [0, b, `${b} %, c'est parmi les demi-pensionnaires seulement : ramène-le à <b>tous</b> les élèves.`], [0, Math.abs(a - b), 'On ne les soustrait pas : on prend ' + b + ' % de ' + a + ' %.']] }),
    html: `Dans un collège, ${a} % des élèves sont demi-pensionnaires. Parmi eux, ${b} % sont en 6<sup>e</sup>.<br>Quel pourcentage de <b>tous</b> les élèves sont des demi-pensionnaires de 6<sup>e</sup> ?`,
    visual: pctBar(a, { label: `${a} % demi-pensionnaires`, total: '100 % des élèves' }),
    hint: `Prends ${b} % de ${a} % : ${F(b, 100)} × ${a}. Ou essaie avec 100 élèves.`,
    solution: `${b} % de ${a} % = ${M(b / 100)} × ${a} = <b>${M(g)} %</b>. (Sur 100 élèves : ${a} demi-pensionnaires, dont ${M(g)} en 6<sup>e</sup>.)`,
  };
}
function C12() {
  return `<h2>12. Évolutions successives et défis</h2>
<p class="intro">Quand plusieurs évolutions s'enchaînent, chaque pourcentage s'applique au prix <b>du moment</b>. Les coefficients sont alors indispensables.</p>
<div class="def">Pour des évolutions successives, on <b>multiplie les coefficients</b> :<br>+ 20 % puis − 20 % → × 1,2 × 0,8 = × 0,96, soit une <b>baisse de 4 %</b>.</div>
${evoBars(20, true, { before: '100 €', after: '120 €' })}${evoBars(20, false, { before: '120 €', after: '96 €' })}
<div class="methode"><b>Méthode</b><ol>
<li>Écris le coefficient de chaque évolution.</li>
<li>Multiplie-les : c'est le coefficient global.</li>
<li>Compare-le à 1 pour lire l'évolution globale. Astuce : essaie avec un prix de 100 €.</li>
<li>Pour un pourcentage d'un pourcentage : multiplie, par exemple 25 % de 40 % = 0,25 × 40 %.</li></ol></div>
<div class="ex"><span class="q">Exemple 1 : + 10 % puis + 20 %.</span><br>1,1 × 1,2 = 1,32, soit une hausse de <b>32 %</b> (et pas 30 %). Sur 100 € : 110 €, puis 132 €.</div>
<div class="ex"><span class="q">Exemple 2 : deux défis.</span><br>• Sur une carte au 1/25 000, un trajet mesure 12 cm : 12 × 25 000 = 300 000 cm = 3 km. À 15 km/h : 3 ÷ 15 = 0,2 h = <b>12 min</b>.<br>• 40 % des élèves sont demi-pensionnaires, et 25 % d'entre eux sont en 6<sup>e</sup> : 0,25 × 40 = <b>10 %</b> de tous les élèves.</div>
<div class="warn">⚠️ <b>+ 20 % puis − 20 % ≠ 0 %</b> : la baisse s'applique à un prix plus grand.<br>⚠️ Les pourcentages successifs ne s'additionnent pas.<br>⚠️ Dans un défi, vérifie les <b>unités</b> à chaque étape (cm → km, h → min).</div>
<div class="retenir">À retenir : évolutions successives → on multiplie les coefficients.</div>`;
}

export const LEVELS = [
  { titre: 'Reconnaître la proportionnalité', generate: L1, cours: C1, classe: '6e' },
  { titre: 'Compléter un tableau', generate: L2, cours: C2, classe: '6e' },
  { titre: 'Passage à l\'unité', generate: L3, cours: C3, classe: '6e' },
  { titre: 'Produit en croix', generate: L4, cours: C4, classe: '5e' },
  { titre: 'Graphique de proportionnalité', generate: L5, cours: C5, classe: '5e / 4e' },
  { titre: 'Échelles', generate: L6, cours: C6, classe: '5e' },
  { titre: 'Vitesses', generate: L7, cours: C7, classe: '4e' },
  { titre: 'Appliquer un pourcentage', generate: L8, cours: C8, classe: '6e / 5e' },
  { titre: 'Calculer un pourcentage', generate: L9, cours: C9, classe: '5e / 4e' },
  { titre: 'Hausses et baisses en %', generate: L10, cours: C10, classe: '4e' },
  { titre: 'Coefficient multiplicateur', generate: L11, cours: C11, classe: '3e' },
  { titre: 'Évolutions successives et défis', generate: L12, cours: C12, classe: '3e' },
];
export const OPTIONS = { need: 4, keys: { neg: false, comma: true } };

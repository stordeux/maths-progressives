// Pensée informatique, niveaux 5 à 8 : variables, variable dans une boucle, « si… alors », « si… alors… sinon ».
import { entree, mettre, ajouter, dire, rep, si, E, txt, plus, moins, fois, reste, tx, tb, run, ev } from './lang.js';
import { exec } from './verif.js';
import {
  ri, pick, chance, shuffle, M, numQ, choiceQ, OUI_NON, progSvg, tableau, exQ, warn, retenir, meth, def, cours, cols,
} from './outils.js';

const NOMS = ['a', 'b', 'c', 'x', 'y', 'n', 'p', 's', 't'];
const lis = prog => run(prog);
const nomsDe = k => shuffle([...NOMS]).slice(0, k);
const cond = (o, a, b) => E(o, a, b);
/** copie du programme où le premier « répéter » fait m tours */
const variante = (prog, m) => prog.map(b => (b.t === 'rep' && !b.fait ? { ...b, n: m } : b));
/** copie où les branches du premier « si » sont échangées */
const echangeSi = prog => prog.map(b => (b.t === 'si' ? { ...b, a: b.b || [], b: b.a } : b));
const premierSi = prog => prog.find(b => b.t === 'si');
const premiereBoucle = prog => prog.find(b => b.t === 'rep' || b.t === 'jus');

/* =====================================================================
   5. Variables
   ===================================================================== */
/** { v, prog } : valeur finale d'une variable */
export function F5val({ v, prog }) {
  const r = lis(prog), E_ = [r.env[v]];
  const interm = r.rows.slice(0, -1).map(x => x.snap[v]).filter(x => x !== undefined && x !== E_[0]);
  const b0 = prog[0], r0 = lis([b0]);
  return numQ({
    html: `Quelle valeur a la variable ${v} à la fin du programme ?`, prog, tpl: `${v} = {0}`, E: E_,
    msg: x => (interm.includes(x[0]) ? `${M(x[0])} est la valeur de ${v} avant le dernier bloc : il reste « ${tb(prog[prog.length - 1])} » à exécuter.` : ''),
    hint: `Au départ, ${v} n'a pas de valeur. Premier bloc, « ${tb(b0)} » : ${v} vaut alors ${M(r0.env[v])}. Continue bloc par bloc en réécrivant la valeur de ${v} à chaque étape (une ligne par bloc).`,
    solution: `On suit la valeur de ${v}, bloc par bloc :${tableau(r)}À la fin, ${v} vaut ${M(E_[0])}.`,
    verify: e => exec(prog).v[v] === e[0],
  });
}
/** { prog, ask } : deux ou trois variables qui dépendent l'une de l'autre */
export function F5deux({ prog, ask }) {
  const r = lis(prog), E_ = [r.env[ask]];
  const blocAsk = prog.find(b => b.t === 'set' && b.v === ask && typeof b.e === 'object');
  const tardif = blocAsk ? (() => { try { return ev(blocAsk.e, r.env); } catch (e) { return null; } })() : null;
  return numQ({
    html: `À la fin du programme, quelle valeur a la variable ${ask} ?`, prog, tpl: `${ask} = {0}`, E: E_,
    msg: x => (tardif !== null && x[0] === tardif && tardif !== E_[0] ? `Quand on exécute « ${tb(blocAsk)} », ${ask} prend la valeur calculée <b>à ce moment-là</b> : changer l'autre variable ensuite ne modifie pas ${ask}.` : ''),
    hint: `Suis les deux variables dans un tableau, une ligne par bloc. Un bloc « mettre ${ask} à … » calcule avec les valeurs que les variables ont <b>à cet instant</b>. Premier bloc : « ${tb(prog[0])} ».`,
    solution: `On suit les variables, bloc par bloc :${tableau(r)}À la fin, ${ask} vaut ${M(E_[0])}.`,
    verify: e => exec(prog).v[ask] === e[0],
  });
}
/** { x, y } : échange de deux variables avec une variable temporaire t */
export function F5echange({ x, y }) {
  const prog = [mettre('a', x), mettre('b', y), mettre('t', 'a'), mettre('a', 'b'), mettre('b', 't')], r = lis(prog);
  return numQ({
    html: 'Que valent a et b à la fin du programme ?', prog, tpl: 'a = {0} ; b = {1}', E: [r.env.a, r.env.b],
    msg: v => (v[0] === y && v[1] === y ? `Après « mettre a à b », a et b valent tous les deux ${M(y)}. La variable t a justement gardé l'ancienne valeur de a pour la rendre à b.` : v[0] === x && v[1] === y ? 'Les valeurs ont été échangées : regarde ce que fait chaque bloc.' : ''),
    hint: `Au départ, a vaut ${M(x)} et b vaut ${M(y)}. Le bloc « mettre t à a » garde ${M(x)} dans t. Continue avec une colonne par variable (a, b et t) et une ligne par bloc.`,
    solution: `On suit a, b et t, bloc par bloc :${tableau(r)}À la fin, a = ${M(r.env.a)} et b = ${M(r.env.b)} : les deux valeurs ont été échangées.`,
    verify: e => { const w = exec(prog).v; return w.a === e[0] && w.b === e[1] && e[0] === y && e[1] === x; },
  });
}
/** { prog } : ce que dit le programme */
export function F5dire({ prog }) {
  const r = lis(prog), E_ = [r.out[0]];
  return numQ({
    html: 'Que dit le programme ?', prog, tpl: 'Il dit {0}', E: E_,
    msg: v => (r.rows.some(x => Object.values(x.snap).includes(v[0])) && v[0] !== E_[0] ? `${M(v[0])} est la valeur d'une variable à un moment du programme, mais le bloc « dire » affiche le calcul demandé : ${tx(prog[prog.length - 1].e)}.` : ''),
    hint: `Suis les valeurs de chaque variable bloc par bloc. Le dernier bloc, « ${tb(prog[prog.length - 1])} », dit le résultat de ce calcul avec les valeurs que les variables ont à ce moment-là.`,
    solution: `On suit les variables, bloc par bloc :${tableau(r)}Le programme dit ${M(E_[0])}.`,
    verify: e => exec(prog).out[0] === e[0],
  });
}
function genVal(d) {
  const [v] = nomsDe(1);
  for (let t = 0; t < 400; t++) {
    const prog = [mettre(v, ri(2, 9))]; let cur = prog[0].e;
    const n = d < 1 ? 2 : d < 3 ? 3 : 4;
    for (let i = 0; i < n; i++) {
      const choix = ['add', ...(d >= 1 ? ['mul', 'sub'] : []), ...(d >= 2 ? ['raz'] : [])];
      const c = pick(choix);
      if (c === 'add') { const k = ri(2, 9); prog.push(chance(0.5) ? ajouter(v, k) : mettre(v, plus(v, k))); cur += k; }
      else if (c === 'mul') { const k = ri(2, 3); prog.push(mettre(v, fois(v, k))); cur *= k; }
      else if (c === 'sub') { if (cur < 4) continue; const k = ri(1, cur - 2); prog.push(mettre(v, moins(v, k))); cur -= k; }
      else { const k = ri(2, 12); prog.push(mettre(v, k)); cur = k; }
    }
    if (prog.length >= 3 && cur < 400 && cur > 0) return F5val({ v, prog });
  }
  throw new Error('genVal');
}
function genDeux(d) {
  const [a, b, c] = nomsDe(3), tpl = pick(d < 3 ? [1, 2] : [1, 2, 3]);
  if (tpl === 1) {
    const x = ri(2, 9), k = ri(2, 6), j = ri(2, 6);
    const prog = [mettre(a, x), mettre(b, plus(a, k)), pick([ajouter(a, j), mettre(a, fois(a, 2))])];
    return F5deux({ prog, ask: d < 1 ? a : pick([b, b, a]) });
  }
  if (tpl === 2) {
    const x = ri(2, 9), y = ri(2, 9);
    const prog = [mettre(a, x), mettre(b, y), mettre(a, plus(a, b)), ...(d >= 2 ? [mettre(b, moins(a, b))] : [])];
    return F5deux({ prog, ask: d >= 2 ? pick([a, b]) : a });
  }
  const x = ri(2, 6);
  const prog = [mettre(a, x), mettre(b, fois(a, 2)), mettre(c, plus(a, b)), mettre(b, plus(b, c))];
  return F5deux({ prog, ask: pick([b, c]) });
}
export function L5(d) {
  const f = pick(d < 1 ? ['val', 'deux'] : d < 2 ? ['val', 'deux'] : d < 3 ? ['val', 'deux', 'echange', 'dire'] : ['val', 'deux', 'echange', 'dire']);
  if (f === 'val') return genVal(d);
  if (f === 'deux') return genDeux(d);
  if (f === 'echange') { const x = ri(2, 9); let y = ri(2, 9); while (y === x) y = ri(2, 9); return F5echange({ x, y }); }
  const [a, b] = nomsDe(2), x = ri(2, 8), y = ri(2, 8);
  const prog = [mettre(a, x), mettre(b, y), mettre(a, plus(a, b)), dire(pick([fois(a, b), moins(a, b), plus(a, b)]))];
  return F5dire({ prog });
}
export function C5() {
  const P1 = { v: 'a', prog: [mettre('a', 4), ajouter('a', 3), mettre('a', fois('a', 2))] };
  const P2 = { prog: [mettre('a', 3), mettre('b', plus('a', 2)), ajouter('a', 4)], ask: 'b' };
  const P3 = { prog: [mettre('a', 5), mettre('b', 2), mettre('a', plus('a', 'b')), mettre('b', moins('a', 'b'))], ask: 'a' };
  const P4 = { x: 7, y: 2 };
  const P5 = { prog: [mettre('a', 3), mettre('b', 4), mettre('a', plus('a', 'b')), dire(fois('a', 'b'))] };
  return cours('5. Les variables',
    'Une <b>variable</b> est une boîte qui porte un nom et qui garde une valeur. On peut y mettre un nombre, le lire, le changer. Un programme se suit en écrivant, pour chaque bloc, la valeur de toutes les variables dans un <b>tableau de suivi</b>.',
    cols(def('<b>mettre a à 5</b> : la variable a prend la valeur 5 (l\'ancienne valeur est effacée).<br><b>ajouter 3 à a</b> : la valeur de a augmente de 3.<br><b>mettre a à (a × 2)</b> : on calcule avec la valeur <b>actuelle</b> de a, puis on range le résultat dans a.'),
      progSvg([mettre('a', 5), ajouter('a', 3), mettre('b', fois('a', 2))])),
    meth('Dessine un tableau avec une colonne par variable et une ligne par bloc.', 'À chaque bloc, ne recopie que la valeur qui change ; les autres restent.', 'Pour « mettre b à (a + 2) », utilise la valeur de a <b>à ce moment-là</b>.'),
    exQ(F5val(P1)), exQ(F5deux(P2)), exQ(F5deux(P3)), exQ(F5echange(P4)), exQ(F5dire(P5)),
    warn('« mettre a à 5 » <b>remplace</b> l\'ancienne valeur ; « ajouter 5 à a » la fait <b>augmenter</b> de 5.', 'Une variable calculée avec une autre ne se met pas à jour toute seule : b garde sa valeur même si a change ensuite.', 'Pour échanger deux variables, il faut une troisième variable qui garde une valeur.'),
    retenir('on suit un programme avec un tableau de suivi ; une variable garde sa valeur jusqu\'à ce qu\'un bloc la change.'));
}

/* =====================================================================
   6. Une variable dans une boucle
   ===================================================================== */
const msgTours = (prog, ask, v, E_, n) => {
  const m1 = run(variante(prog, n - 1)).env[ask], p1 = run(variante(prog, n + 1)).env[ask];
  return v === m1 ? `La boucle fait ${n} tours, pas ${n - 1} : il manque un tour.` : v === p1 ? `La boucle fait ${n} tours, pas ${n + 1} : tu as compté un tour de trop.` : '';
};
const dernierTour = (prog, ask) => { const B = premiereBoucle(prog); return run(prog).rows.filter(r => r.label.startsWith('tour')).map(r => r.snap[ask]); };
/** { v, x0, k, n } : un compteur qui augmente à chaque tour */
export function F6compteur({ v, x0, k, n }) {
  const prog = [mettre(v, x0), rep(n, [ajouter(v, k)])], r = lis(prog), E_ = [r.env[v]];
  return numQ({
    html: `Quelle valeur a ${v} à la fin du programme ?`, prog, tpl: `${v} = {0}`, E: E_,
    msg: x => msgTours(prog, v, x[0], E_, n) || (x[0] === k * n ? `N'oublie pas la valeur de départ : avant la boucle, ${v} vaut ${M(x0)}.` : ''),
    hint: `Avant la boucle, ${v} vaut ${M(x0)}. Le bloc « répéter ${n} fois » exécute « ${tb(prog[1].body[0])} » à chaque tour. Écris la valeur de ${v} après chaque tour dans un tableau.`,
    solution: `On suit ${v}, tour par tour :${tableau(r)}Après les ${n} tours, ${v} vaut ${M(E_[0])}.`,
    verify: e => exec(prog).v[v] === e[0] && e[0] === x0 + k * n,
  });
}
/** { n } : 1 + 2 + … + n avec un compteur et un total */
export function F6somme({ n }) {
  const prog = [mettre('i', 0), mettre('s', 0), rep(n, [ajouter('i', 1), ajouter('s', 'i')]), dire('s')], r = lis(prog), E_ = [r.out[0]];
  return numQ({
    html: 'Quelle somme le programme dit-il à la fin ?', prog, tpl: 'Il dit {0}', E: E_,
    msg: x => msgTours(prog, 's', x[0], E_, n) || (x[0] === n * n ? `Le compteur i augmente de 1 à chaque tour : on additionne 1, 2, 3… et pas ${n} à chaque fois.` : ''),
    hint: `Dans chaque tour, le compteur i augmente de 1, puis la valeur de i est ajoutée à s. Au premier tour, i vaut 1 : s vaut alors 0 + 1. Écris i et s après chaque tour (${n} tours).`,
    solution: `On suit i et s, tour par tour :${tableau(r)}Le programme dit ${M(E_[0])} (c'est 1 + 2 + … + ${n}).`,
    verify: e => exec(prog).out[0] === e[0] && e[0] === n * (n + 1) / 2,
  });
}
/** { x0, m, n } : une variable multipliée à chaque tour */
export function F6puiss({ v, x0, m, n }) {
  const prog = [mettre(v, x0), rep(n, [mettre(v, fois(v, m))]), dire(v)], r = lis(prog), E_ = [r.out[0]];
  return numQ({
    html: 'Que dit le programme ?', prog, tpl: 'Il dit {0}', E: E_,
    msg: x => msgTours(prog, v, x[0], E_, n) || (x[0] === x0 * m * n ? `La variable est multipliée par ${m} à chaque tour : on ne l'ajoute pas ${n} fois.` : ''),
    hint: `${v} vaut ${M(x0)} avant la boucle. À chaque tour, « ${tb(prog[1].body[0])} » multiplie la valeur <b>actuelle</b> de ${v} par ${m}. Écris ${v} après chaque tour (${n} tours).`,
    solution: `On suit ${v}, tour par tour :${tableau(r)}Le programme dit ${M(E_[0])}.`,
    verify: e => exec(prog).out[0] === e[0] && e[0] === x0 * Math.pow(m, n),
  });
}
/** { p0, kp, q0, kq, n } : deux variables qui évoluent dans la boucle */
export function F6duo({ p0, kp, q0, kq, n }) {
  const prog = [mettre('p', p0), mettre('q', q0), rep(n, [ajouter('p', kp), mettre('q', moins('q', kq))])], r = lis(prog), E_ = [r.env.q];
  return numQ({
    html: 'Après la boucle, quelle est la valeur de q ?', prog, tpl: 'q = {0}', E: E_,
    msg: x => msgTours(prog, 'q', x[0], E_, n) || (x[0] === r.env.p ? 'Tu as donné la valeur de p : on te demande celle de q.' : ''),
    hint: `Avant la boucle, p vaut ${p0} et q vaut ${q0}. À chaque tour, p augmente de ${kp} et q diminue de ${kq}. On te demande q : écris p et q après chaque tour (${n} tours).`,
    solution: `On suit p et q, tour par tour :${tableau(r)}Après les ${n} tours, q vaut ${M(E_[0])}.`,
    verify: e => exec(prog).v.q === e[0] && e[0] === q0 - kq * n,
  });
}
export function L6(d) {
  const f = pick(d < 1 ? ['compteur'] : d < 2 ? ['compteur', 'somme'] : d < 3 ? ['compteur', 'somme', 'puiss'] : ['compteur', 'somme', 'puiss', 'duo']);
  const n = d < 1 ? ri(3, 5) : d < 2 ? ri(3, 6) : d < 3 ? ri(4, 8) : ri(5, 10);
  if (f === 'compteur') return F6compteur({ v: pick(NOMS), x0: d < 1 ? 0 : ri(1, 9), k: ri(2, d < 2 ? 5 : 9), n });
  if (f === 'somme') return F6somme({ n });
  if (f === 'puiss') return F6puiss({ v: pick(NOMS), x0: ri(1, 3), m: ri(2, 3), n: Math.min(n, 7) });
  const kq = ri(1, 4);
  return F6duo({ p0: ri(0, 5), kp: ri(2, 6), q0: kq * n + ri(2, 30), kq, n });
}
export function C6() {
  return cours('6. Une variable dans une boucle',
    'Les boucles et les variables vont ensemble : à chaque tour, une variable change. C\'est ainsi qu\'un programme <b>compte</b> ou <b>additionne</b> sans écrire chaque calcul.',
    cols(def('Un <b>compteur</b> est une variable qu\'on augmente d\'un même nombre à chaque tour. Un <b>total</b> est une variable à laquelle on ajoute une valeur différente à chaque tour.'),
      progSvg([mettre('i', 0), rep(3, [ajouter('i', 1)])])),
    meth('Note les valeurs de départ des variables (avant la boucle).', 'Un tour = une ligne du tableau de suivi : écris les nouvelles valeurs.', 'Fais exactement <b>n</b> lignes pour « répéter n fois » ; la valeur finale est celle de la dernière ligne.'),
    exQ(F6compteur({ v: 'c', x0: 5, k: 3, n: 4 })), exQ(F6somme({ n: 5 })), exQ(F6puiss({ v: 'x', x0: 1, m: 2, n: 5 })), exQ(F6duo({ p0: 0, kp: 4, q0: 30, kq: 3, n: 5 })),
    warn('Ne pas oublier la valeur de départ de la variable : le compteur ne commence pas toujours à 0.', 'Compte bien <b>n tours</b> : ni n − 1, ni n + 1.', 'Dans la somme 1 + 2 + … + n, on ajoute <b>i</b> (qui change), pas n.'),
    retenir('dans une boucle, on recopie le tableau de suivi tour après tour ; n tours = n lignes.'));
}

/* =====================================================================
   7. La condition « si … alors »
   ===================================================================== */
const verdictSi = (prog, val) => { const s = premierSi(prog); return ev(s.c, { n: val }); };
/** { val, c, base, corps } : entrée, test, bloc exécuté seulement si le test est vrai */
export function F7sortie({ val, c, base, corps }) {
  const prog = [entree('n', val), mettre('p', base), si(c, corps), dire('p')], r = lis(prog), E_ = [r.out[0]];
  const autre = run(echangeSi(prog)).out[0], v = ev(c, { n: val });
  return numQ({
    html: `On entre ${M(val)}. Que dit le programme ?`, prog, tpl: 'Il dit {0}', E: E_,
    msg: x => (x[0] === autre ? (v ? `Le test « ${tx(c)} » est vrai pour n = ${M(val)} : le bloc « ${tb(corps[0])} » est exécuté.` : `Le test « ${tx(c)} » est faux pour n = ${M(val)} : le bloc « ${tb(corps[0])} » est sauté.`) : ''),
    hint: `Remplace n par ${M(val)} dans le test « ${tx(c)} » : est-il vrai ou faux ? S'il est vrai, on exécute « ${tb(corps[0])} » ; sinon on passe directement au bloc suivant.`,
    solution: `On suit le programme, bloc par bloc :${tableau(r)}${v ? 'Le test est vrai : le bloc du « si » est exécuté.' : 'Le test est faux : le bloc du « si » est sauté.'} Le programme dit ${M(E_[0])}.`,
    verify: e => exec(prog).out[0] === e[0],
  });
}
const BRAVO = si => [si];
/** { c, entrees, bon } : pour quelle entrée dit-il « Bravo » ? */
export function F7quand({ c, entrees, ordre }) {
  const prog = [si(c, [dire(txt('Bravo'))])], dit = n => run([entree('n', n), ...prog]).out.length > 0;
  const bons = entrees.filter(dit), bon = bons[0];
  const opts = entrees.map(n => ({ v: String(n), l: M(n) }));
  return choiceQ({
    html: 'Le programme teste le nombre entré, n. Pour laquelle de ces entrées dit-il « Bravo » ?', prog, opts, keep: true, good: String(bon), texte: M(bon),
    msg: x => `Avec n = ${M(+x)}, le test « ${tx(c)} » est faux : le programme ne dit rien.`,
    hint: `Essaie chaque entrée : remplace n par sa valeur dans le test « ${tx(c)} ». Le programme dit « Bravo » seulement quand ce test est vrai.`,
    solution: `On teste chaque entrée dans « ${tx(c)} » :<br>${entrees.map(n => `n = ${M(n)} : ${dit(n) ? 'vrai ✔' : 'faux ✘'}`).join('<br>')}<br>Seule l'entrée ${M(bon)} fait dire « Bravo ».`,
    verify: e => { const ok = n => exec([entree('n', n), ...prog]).out.length === 1; return ok(+e) && entrees.filter(ok).length === 1; },
  });
}
/** { c } : plus petit entier qui fait dire « Bravo » */
export function F7seuil({ c }) {
  const prog = [si(c, [dire(txt('Bravo'))])];
  let E_ = null;
  for (let n = 0; n < 500; n++) if (ev(c, { n })) { E_ = n; break; }
  const a = typeof c.b === 'number' ? c.b : null;
  return numQ({
    html: 'Le programme teste le nombre entré, n. Quel est le plus petit nombre entier que l\'on peut entrer pour qu\'il dise « Bravo » ?', prog, tpl: 'n = {0}', E: [E_],
    msg: x => (!ev(c, { n: x[0] }) ? `Avec n = ${M(x[0])}, le test « ${tx(c)} » est faux : le programme ne dit rien.` : x[0] > E_ ? `Avec n = ${M(x[0])} il dit « Bravo », mais ${M(E_)} fonctionne aussi et il est plus petit.` : ''),
    hint: `Cherche à partir de quel nombre le test « ${tx(c)} » devient vrai. Essaie quelques valeurs de n autour de ${a ?? 'la valeur du test'}, et fais attention : « &gt; » est strict, « ≥ » ne l'est pas.`,
    solution: `Le test « ${tx(c)} » est vrai pour n = ${M(E_)}${E_ > 0 ? ` et faux pour n = ${M(E_ - 1)}` : ''}.<br>Le plus petit entier qui fait dire « Bravo » est ${M(E_)}.`,
    verify: e => { const ok = n => exec([entree('n', n), ...prog]).out.length === 1; let m = 0; while (!ok(m)) m++; return m === e[0] && ok(e[0]); },
  });
}
function condSimple(d) {
  const t = ri(5, 20);
  const choix = d < 1 ? [cond('>', 'n', t), cond('<', 'n', t)] : d < 2 ? [cond('>', 'n', t), cond('<', 'n', t), cond('≥', 'n', t)] : d < 3 ? [cond('>', 'n', t), cond('≥', 'n', t), cond('≤', 'n', t), cond('=', 'n', t)] : [cond('>', 'n', t), cond('≥', 'n', t), cond('=', reste('n', 2), 0), cond('=', reste('n', 3), 0), cond('=', reste('n', 5), 0)];
  return pick(choix);
}
function genSortie7(d) {
  const c = condSimple(d), base = ri(2, 9), k = ri(2, 9);
  const corps = pick(d < 1 ? [[ajouter('p', k)]] : [[ajouter('p', k)], [mettre('p', fois('p', 2))], ...(d >= 2 ? [[mettre('p', 0)]] : [])]);
  const t = typeof c.b === 'number' ? c.b : 10;
  for (let i = 0; i < 100; i++) {
    const val = chance(0.5) ? ri(Math.max(1, t - 6), t + 6) : ri(1, 30);
    const prog = [entree('n', val), mettre('p', base), si(c, corps), dire('p')];
    if (run(prog).out[0] !== run(echangeSi(prog)).out[0]) return F7sortie({ val, c, base, corps });
  }
  return F7sortie({ val: 4, c: cond('>', 'n', 10), base, corps });
}
function genQuand(d) {
  const c = condSimple(d);
  for (let t = 0; t < 300; t++) {
    const base = typeof c.b === 'number' && c.a === 'n' ? c.b : 10;
    const vals = new Set(); while (vals.size < 4) vals.add(ri(1, 30));
    const L = [...vals], dit = n => ev(c, { n });
    if (L.filter(dit).length === 1) return F7quand({ c, entrees: L });
  }
  return F7quand({ c: cond('>', 'n', 12), entrees: [5, 9, 20, 3] });
}
function genSeuil(d) {
  const a = ri(4, 30), k = ri(2, 5);
  const c = pick([cond('>', 'n', a), cond('≥', 'n', a), cond('>', fois('n', k), a), cond('≥', plus('n', ri(2, 6)), a + 6)]);
  return F7seuil({ c });
}
export function L7(d) {
  const f = pick(d < 1 ? ['sortie'] : d < 3 ? ['sortie', 'quand'] : ['sortie', 'quand', 'seuil']);
  return f === 'sortie' ? genSortie7(d) : f === 'quand' ? genQuand(d) : genSeuil(d);
}
export function C7() {
  const c = cond('>', 'n', 10);
  return cours('7. La condition « si … alors »',
    'Un programme peut <b>faire un choix</b> : le bloc « si … alors » n\'exécute les blocs qu\'il contient <b>que si le test est vrai</b>. Sinon, il les saute et passe directement au bloc suivant.',
    cols(def('Le test est une phrase qui est <b>vraie</b> ou <b>fausse</b> : « n &gt; 10 », « n ≤ 3 », « le reste de n ÷ 2 = 0 ». On remplace n par sa valeur pour savoir.'),
      progSvg([si(c, [ajouter('p', 5)])])),
    meth('Remplace n par la valeur entrée dans le test.', 'Test <b>vrai</b> : exécute les blocs du « alors ». Test <b>faux</b> : saute-les.', 'Continue avec le bloc qui suit le « si ».'),
    exQ(F7sortie({ val: 14, c, base: 3, corps: [ajouter('p', 5)] })), exQ(F7sortie({ val: 8, c, base: 3, corps: [ajouter('p', 5)] })),
    exQ(F7quand({ c: cond('≥', 'n', 15), entrees: [8, 12, 15, 9] })), exQ(F7seuil({ c: cond('>', fois('n', 3), 20) })),
    warn('« n &gt; 10 » est faux pour n = 10 (10 n\'est pas strictement plus grand que 10) ; « n ≥ 10 » est vrai.', 'Quand le test est faux, le programme ne s\'arrête pas : il continue avec le bloc suivant.'),
    retenir('« si test alors blocs » : les blocs ne sont exécutés que si le test est vrai.'));
}

/* =====================================================================
   8. « si … alors … sinon »
   ===================================================================== */
/** { val, c, a, b } : deux branches qui rangent chacune un résultat dans r */
export function F8sn({ val, c, a, b }) {
  const prog = [entree('n', val), si(c, [mettre('r', a)], [mettre('r', b)]), dire('r')], r = lis(prog), E_ = [r.out[0]];
  const autre = run(echangeSi(prog)).out[0], v = ev(c, { n: val });
  return numQ({
    html: `On entre ${M(val)}. Que dit le programme ?`, prog, tpl: 'Il dit {0}', E: E_,
    msg: x => (x[0] === autre ? `Le test « ${tx(c)} » est ${v ? 'vrai' : 'faux'} pour n = ${M(val)} : on exécute le bloc « ${v ? 'alors' : 'sinon'} », pas l'autre.` : ''),
    hint: `Remplace n par ${M(val)} dans le test « ${tx(c)} » : vrai ou faux ? Vrai : on exécute « ${tb(prog[1].a[0])} » ; faux : « ${tb(prog[1].b[0])} ». Un seul des deux blocs est exécuté.`,
    solution: `On suit le programme, bloc par bloc :${tableau(r)}${v ? 'Le test est vrai : on exécute le bloc « alors », pas le bloc « sinon ».' : 'Le test est faux : on exécute le bloc « sinon », pas le bloc « alors ».'} Le programme dit ${M(E_[0])}.`,
    verify: e => exec(prog).out[0] === e[0],
  });
}
/** { n, seuil, p1, p2 } : tarif par quantité */
export function F8tarif({ n, seuil, p1, p2 }) {
  const prog = [entree('n', n), si(cond('≥', 'n', seuil), [mettre('p', fois('n', p2))], [mettre('p', fois('n', p1))]), dire('p')], r = lis(prog), E_ = [r.out[0]];
  const v = n >= seuil;
  return numQ({
    html: `Une boutique calcule le prix p, en euros, de n paquets de cartes avec ce programme. Quel prix affiche-t-elle pour ${n} paquets ?`, prog, tpl: '{0} €', E: E_,
    msg: x => (x[0] === n * (v ? p1 : p2) ? `Pour ${n} paquets, le test « n ≥ ${seuil} » est ${v ? 'vrai' : 'faux'} : c'est le tarif du bloc « ${v ? 'alors' : 'sinon'} » qui s'applique.` : ''),
    hint: `Teste d'abord n = ${n} dans « n ≥ ${seuil} » : vrai ou faux ? Cela te dit quel bloc est exécuté (« ${tb(prog[1].a[0])} » ou « ${tb(prog[1].b[0])} »). Calcule ensuite p avec n = ${n}.`,
    solution: `Test : ${n} ≥ ${seuil} est ${v ? 'vrai' : 'faux'}, donc on exécute le bloc « ${v ? 'alors' : 'sinon'} » : p = ${n} × ${v ? p2 : p1} = ${E_[0]}.${tableau(r)}`,
    verify: e => exec(prog).out[0] === e[0] && e[0] === (n >= seuil ? n * p2 : n * p1),
  });
}
/** { n, mod, mots : [si vrai, si faux] } : pair / impair, multiple ou non */
export function F8parite({ n, m, ordre }) {
  const oui = m === 2 ? 'pair' : `multiple de ${m}`, non = m === 2 ? 'impair' : `pas multiple de ${m}`;
  const c = cond('=', reste('n', m), 0), prog = [entree('n', n), si(c, [dire(txt(oui))], [dire(txt(non))])];
  const bon = n % m === 0 ? oui : non;
  const opts = [{ v: oui, l: oui }, { v: non, l: non }];
  return choiceQ({
    html: `Le programme teste le nombre ${M(n)}. Que dit-il ?`, prog, opts: ordre ? ordre.map(i => opts[i]) : opts, keep: !!ordre, good: bon, texte: bon,
    msg: () => `Le reste de ${n} ÷ ${m} est ${n % m} : le test « reste de n ÷ ${m} = 0 » est ${n % m === 0 ? 'vrai' : 'faux'}.`,
    hint: `Calcule le reste de la division de ${M(n)} par ${m} et compare-le à 0 : le test « ${tx(c)} » est-il vrai ou faux ? Le bloc « alors » dit « ${oui} », le bloc « sinon » dit « ${non} ».`,
    solution: `Reste de ${n} ÷ ${m} : ${n} = ${m} × ${Math.floor(n / m)} + ${n % m}, le reste est ${n % m}.<br>Le test « reste = 0 » est ${n % m === 0 ? 'vrai' : 'faux'} : le programme dit « ${bon} ».`,
    verify: e => exec(prog.map(b => (b.t === 'in' ? b : b))).out[0] === e,
  });
}
/** { a, b, mode } : deux entrées à comparer */
export function F8compare({ a, b, mode }) {
  const c = cond('>', 'a', 'b');
  const [d1, d2] = mode === 'max' ? ['a', 'b'] : mode === 'min' ? ['b', 'a'] : [moins('a', 'b'), moins('b', 'a')];
  const prog = [entree('a', a), entree('b', b), si(c, [dire(d1)], [dire(d2)])], r = lis(prog), E_ = [r.out[0]];
  const autre = run(echangeSi(prog)).out[0], v = a > b;
  return numQ({
    html: `On entre a = ${M(a)} et b = ${M(b)}. Que dit le programme ?`, prog, tpl: 'Il dit {0}', E: E_,
    msg: x => (x[0] === autre ? `Le test « a &gt; b » est ${v ? 'vrai' : 'faux'} pour a = ${M(a)} et b = ${M(b)} : c'est le bloc « ${v ? 'alors' : 'sinon'} » qui est exécuté.` : ''),
    hint: `Remplace a par ${M(a)} et b par ${M(b)} dans le test « a &gt; b » : vrai ou faux ? Exécute seulement le bloc correspondant, « alors » si c'est vrai, « sinon » si c'est faux.`,
    solution: `Test : ${M(a)} &gt; ${M(b)} est ${v ? 'vrai' : 'faux'}, donc on exécute le bloc « ${v ? 'alors' : 'sinon'} » : « ${tb(v ? prog[2].a[0] : prog[2].b[0])} ».${tableau(r)}Le programme dit ${M(E_[0])}.`,
    verify: e => exec(prog).out[0] === e[0],
  });
}
function genSn(d) {
  for (let t = 0; t < 200; t++) {
    const s = ri(5, 15), c = d < 2 ? pick([cond('<', 'n', s), cond('>', 'n', s)]) : d < 3 ? pick([cond('≤', 'n', s), cond('≥', 'n', s), cond('=', reste('n', 2), 0)]) : pick([cond('=', reste('n', 2), 0), cond('=', reste('n', 3), 0), cond('≥', 'n', s)]);
    const f1 = () => pick(d < 1 ? [fois('n', ri(2, 4)), plus('n', ri(2, 9))] : [fois('n', ri(2, 5)), plus('n', ri(2, 12)), moins('n', ri(1, 3)), plus(fois('n', 2), ri(1, 5))]);
    const a = f1(), b = f1(), val = ri(Math.max(1, s - 5), s + 6);
    if (ev(a, { n: val }) !== ev(b, { n: val }) && ev(a, { n: val }) > 0 && ev(b, { n: val }) > 0) return F8sn({ val, c, a, b });
  }
  throw new Error('genSn');
}
export function L8(d) {
  const f = pick(d < 1 ? ['sn', 'parite'] : d < 2 ? ['sn', 'parite', 'tarif'] : ['sn', 'parite', 'tarif', 'compare']);
  if (f === 'sn') return genSn(d);
  if (f === 'tarif') { const seuil = ri(5, 12), p2 = ri(2, 5), p1 = p2 + ri(1, 2); return F8tarif({ n: chance(0.5) ? ri(seuil, seuil + 8) : ri(2, seuil - 1), seuil, p1, p2 }); }
  if (f === 'parite') { const m = d < 2 ? 2 : pick([2, 2, 3, 5]); return F8parite({ n: ri(10, d < 2 ? 99 : 999), m }); }
  const a = ri(3, 30); let b = ri(3, 30); while (b === a) b = ri(3, 30);
  return F8compare({ a, b, mode: pick(d < 3 ? ['max', 'min'] : ['max', 'min', 'ecart']) });
}
export function C8() {
  const c = cond('<', 'n', 10);
  return cours('8. « si … alors … sinon »',
    'Avec « sinon », le programme a <b>deux chemins</b> : un seul des deux est suivi. Si le test est vrai, on exécute le « alors » ; s\'il est faux, on exécute le « sinon ».',
    cols(def('<b>si</b> test <b>alors</b> blocs A <b>sinon</b> blocs B : on exécute <b>soit A, soit B</b>, jamais les deux, jamais aucun.'),
      progSvg([si(c, [mettre('r', fois('n', 3))], [mettre('r', plus('n', 7))])])),
    meth('Remplace n par la valeur entrée dans le test et décide : vrai ou faux ?', 'Exécute <b>un seul</b> des deux blocs : « alors » si vrai, « sinon » si faux.', 'Continue avec le bloc qui suit tout le « si … sinon ».'),
    exQ(F8sn({ val: 6, c, a: fois('n', 3), b: plus('n', 7) })), exQ(F8sn({ val: 12, c, a: fois('n', 3), b: plus('n', 7) })),
    exQ(F8tarif({ n: 12, seuil: 10, p1: 6, p2: 5 })), exQ(F8parite({ n: 47, m: 2, ordre: [0, 1] })), exQ(F8compare({ a: 8, b: 15, mode: 'max' })),
    warn('Les deux blocs ne sont jamais exécutés ensemble : si le test est faux, le « alors » est ignoré.', 'Pour savoir si un nombre est pair, regarde le reste de sa division par 2 : reste 0 → pair, reste 1 → impair.', 'Teste avec les <b>valeurs entrées</b>, pas avec les lettres.'),
    retenir('« si … alors … sinon » : un seul des deux blocs est exécuté, selon que le test est vrai ou faux.'));
}

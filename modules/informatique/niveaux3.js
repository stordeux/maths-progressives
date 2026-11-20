// Pensée informatique, niveaux 9 à 12 : conditions composées (et, ou), « répéter jusqu'à », trouver l'erreur ou modifier
// un programme, défis (division euclidienne par soustractions, suite de Syracuse, programmes mêlant boucle, variable et condition).
import { av, tD, tG, entree, mettre, ajouter, op, dire, rep, jusqua, si, E, txt, plus, moins, fois, reste, et, ou, tx, tb, run, ev } from './lang.js';
import { exec } from './verif.js';
import {
  ri, pick, chance, shuffle, M, numQ, choiceQ, optsProgs, LETTRES, progSvg, grille, dual, tableau, sansFleche, exQ, warn, retenir, meth, def, cours, cols,
} from './outils.js';
import { F7quand, F7sortie } from './niveaux2.js';
import { marche, chaine, genChaine, inv, dedans, vec } from './niveaux1.js';

const cond = (o, a, b) => E(o, a, b);
const PUIS = (c, a, b) => ({ ...c });
/** même condition avec « et » et « ou » échangés */
const permuteConn = c => (c && c.o === 'et' ? { ...c, o: 'ou' } : c && c.o === 'ou' ? { ...c, o: 'et' } : c);
const sym = o => o;

/* =====================================================================
   9. Conditions composées : et, ou
   ===================================================================== */
const interessant = (c, N) => { let k = 0; for (let n = 1; n <= N; n++) if (ev(c, { n })) k++; return k >= 2 && k <= N - 3; };
function condComp(d) {
  for (let t = 0; t < 300; t++) {
    const a = ri(4, 14), b = a + ri(4, 12);
    const types = d < 1 ? ['etInt'] : d < 2 ? ['etInt', 'ouExt'] : ['etInt', 'ouExt', 'etMod', 'ouMod'];
    const ty = pick(types);
    const c = ty === 'etInt' ? et(cond('>', 'n', a), cond('<', 'n', b))
      : ty === 'ouExt' ? ou(cond('<', 'n', a), cond('>', 'n', b))
        : ty === 'etMod' ? et(cond('≥', 'n', a), cond('=', reste('n', 2), 0))
          : ou(cond('<', 'n', a), cond('=', reste('n', 5), 0));
    if (interessant(c, 30)) return c;
  }
  return et(cond('>', 'n', 8), cond('<', 'n', 16));
}
export function F9quand(P) { return F7quand(P); }
function genSortie9(d) {
  const c = condComp(d), base = ri(2, 9), k = ri(2, 9);
  const corps = pick([[ajouter('p', k)], [mettre('p', fois('p', 2))]]);
  for (let i = 0; i < 200; i++) {
    const val = ri(1, 30), prog = [entree('n', val), mettre('p', base), si(c, corps), dire('p')];
    if (run(prog).out[0] !== run([entree('n', val), mettre('p', base), si(permuteConn(c), corps), dire('p')]).out[0]) return F7sortie({ val, c, base, corps });
  }
  return F7sortie({ val: 12, c, base, corps });
}
function genQuand9(d) {
  const c = condComp(d);
  for (let t = 0; t < 400; t++) {
    const vals = new Set(); while (vals.size < 4) vals.add(ri(1, 30));
    const L = [...vals];
    if (L.filter(n => ev(c, { n })).length === 1) return F7quand({ c, entrees: L });
  }
  return F7quand({ c: et(cond('>', 'n', 8), cond('<', 'n', 16)), entrees: [3, 12, 20, 27] });
}
/** { c, N } : combien de nombres de 1 à N font dire « Bravo » ? */
export function F9compte({ c, N }) {
  const prog = [si(c, [dire(txt('Bravo'))])], dit = n => run([entree('n', n), ...prog]).out.length > 0;
  const liste = []; for (let n = 1; n <= N; n++) if (dit(n)) liste.push(n);
  const alt = []; for (let n = 1; n <= N; n++) if (ev(permuteConn(c), { n })) alt.push(n);
  return numQ({
    html: `Le programme teste le nombre entré, n. Combien de nombres entiers de 1 à ${N} lui font dire « Bravo » ?`, prog, tpl: '{0} nombres', E: [liste.length],
    msg: v => (v[0] === alt.length ? `Vérifie le mot « ${c.o} » : avec « et », les deux tests doivent être vrais en même temps ; avec « ou », un seul suffit.` : ''),
    hint: `Pour chaque nombre de 1 à ${N}, regarde les deux tests de « ${tx(c)} » : avec « ${c.o} », ${c.o === 'et' ? 'il faut que les deux soient vrais' : 'il suffit qu\'un des deux soit vrai'}. Repère d'abord les nombres qui rendent chaque test vrai, puis compte ceux qui conviennent.`,
    solution: `Test 1 : « ${tx(c.a)} », test 2 : « ${tx(c.b)} ». Avec « ${c.o} » ${c.o === 'et' ? 'les deux doivent être vrais' : 'un seul suffit'}.<br>Les nombres de 1 à ${N} qui font dire « Bravo » : ${liste.join(', ')}.<br>Il y en a ${liste.length}.`,
    verify: e => { let k = 0; for (let n = 1; n <= N; n++) if (exec([entree('n', n), ...prog]).out.length === 1) k++; return k === e[0]; },
  });
}
export function L9(d) {
  const f = pick(d < 1 ? ['sortie'] : d < 2 ? ['sortie', 'quand'] : ['sortie', 'quand', 'compte']);
  if (f === 'sortie') return genSortie9(d);
  if (f === 'quand') return genQuand9(d);
  return F9compte({ c: condComp(d), N: d < 4 ? 20 : 30 });
}
export function C9() {
  const c1 = et(cond('>', 'n', 5), cond('<', 'n', 12)), c2 = ou(cond('<', 'n', 4), cond('>', 'n', 15));
  return cours('9. Les conditions composées : et, ou',
    'On peut combiner deux tests dans un même bloc « si ». Avec <b>et</b>, il faut que les deux tests soient vrais ; avec <b>ou</b>, il suffit qu\'un seul des deux soit vrai.',
    cols(def('<b>et</b> : vrai seulement si les <b>deux</b> tests sont vrais.<br><b>ou</b> : vrai si <b>au moins un</b> des tests est vrai (faux seulement si les deux sont faux).'),
      progSvg([si(c1, [ajouter('p', 5)])])),
    meth('Remplace n dans chaque test et écris vrai ou faux pour chacun.', 'Combine : « et » → les deux vrais ; « ou » → au moins un vrai.', 'Exécute le « alors » si le résultat est vrai, sinon passe au bloc suivant.'),
    exQ(F7sortie({ val: 8, c: c1, base: 2, corps: [ajouter('p', 5)] })), exQ(F7sortie({ val: 14, c: c1, base: 2, corps: [ajouter('p', 5)] })),
    exQ(F7sortie({ val: 2, c: c2, base: 2, corps: [mettre('p', fois('p', 2))] })), exQ(F9quand({ c: et(cond('>', 'n', 10), cond('<', 'n', 20)), entrees: [5, 14, 25, 30] })),
    exQ(F9compte({ c: et(cond('>', 'n', 5), cond('<', 'n', 12)), N: 20 })),
    warn('« n &gt; 5 et n &lt; 12 » : un nombre ne peut pas être à la fois plus petit que 5 et plus grand que 12, mais il peut être entre 5 et 12.', 'Avec « ou », un seul test vrai suffit : ne cherche pas les deux.', 'Chaque test se vérifie séparément, avant de combiner.'),
    retenir('et : les deux tests vrais ; ou : au moins un vrai.'));
}

/* =====================================================================
   10. « répéter jusqu'à »
   ===================================================================== */
const flip = (c, T) => c;
/** boucle de test : { v, x0, corps, c } ; la boucle s'arrête dès que c est vraie (test avant chaque tour) */
const dernierAvant = (r, v) => { const tr = r.rows.filter(x => /^tour/.test(x.label)); return tr.length >= 2 ? tr[tr.length - 2].snap[v] : tr.length === 1 ? r.rows[0].snap[v] : undefined; };
/** { v, x0, corps, c } : valeur finale */
export function F10valeur({ v, x0, corps, c }) {
  const prog = [mettre(v, x0), jusqua(c, corps)], r = run(prog), E_ = [r.env[v]];
  const avant = dernierAvant(r, v);
  return numQ({
    html: `Quelle valeur a ${v} à la fin du programme ?`, prog, tpl: `${v} = {0}`, E: E_,
    msg: x => (x[0] === avant && avant !== undefined ? `${M(x[0])} est la valeur de ${v} avant le dernier tour. Le test « ${tx(c)} » est ${ev(c, { [v]: x[0] }) ? 'déjà vrai' : 'encore faux'} pour ${M(x[0])} : ${ev(c, { [v]: x[0] }) ? 'on aurait dû s\'arrêter plus tôt' : 'il faut faire un tour de plus'}.` : ''),
    hint: `Avant la boucle, ${v} vaut ${M(x0)}. Le test « ${tx(c)} » est fait <b>avant chaque tour</b> : s'il est faux, on refait « ${tb(corps[0])} » ; dès qu'il est vrai, on s'arrête. Écris ${v} après chaque tour et teste à chaque fois.`,
    solution: `On répète jusqu'à ce que « ${tx(c)} » soit vrai :${tableau(r)}La boucle s'arrête quand le test est vrai : ${v} vaut ${M(E_[0])}.`,
    verify: e => exec(prog).v[v] === e[0],
  });
}
/** { v, w, x0, corps, c } : nombre de tours (compteur w) */
export function F10tours({ v, w, x0, corps, c }) {
  const prog = [mettre(v, x0), mettre(w, 0), jusqua(c, [...corps, ajouter(w, 1)]), dire(w)], r = run(prog), E_ = [r.out[0]];
  return numQ({
    html: 'Que dit le programme ?', prog, tpl: 'Il dit {0}', E: E_,
    msg: x => (x[0] === E_[0] + 1 ? `Le test « ${tx(c)} » est fait avant chaque tour : le compteur ${w} s'arrête dès que le test devient vrai, sans tour de plus.` : x[0] === E_[0] - 1 ? `Il manque un tour : ${M(x[0])} tours ne suffisent pas, le test « ${tx(c)} » est encore faux à ce moment-là.` : ''),
    hint: `Avant la boucle, ${v} vaut ${M(x0)} et ${w} vaut 0. À chaque tour, ${v} change puis ${w} augmente de 1. Repère à quel tour le test « ${tx(c)} » devient vrai : le programme dit la valeur de ${w} à ce moment-là.`,
    solution: `On suit ${v} et ${w}, tour par tour :${tableau(r)}Le test devient vrai après ${M(E_[0])} tours : le programme dit ${M(E_[0])}.`,
    verify: e => exec(prog).out[0] === e[0],
  });
}
/** { v, x0, corps, c } : combien de fois le bloc est exécuté, sans compteur */
export function F10combien({ v, x0, corps, c }) {
  const prog = [mettre(v, x0), jusqua(c, corps)], r = run(prog), E_ = [r.tours];
  return numQ({
    html: `Combien de fois le bloc « ${tb(corps[0])} » est-il exécuté ?`, prog, tpl: '{0} fois', E: E_,
    msg: x => (x[0] === E_[0] + 1 ? 'Le test est fait <b>avant</b> chaque tour : dès qu\'il est vrai, on ne refait pas le bloc.' : x[0] === E_[0] - 1 ? 'Tu as compté un tour de moins : vérifie que le test est encore faux après ton dernier tour.' : ''),
    hint: `Avant la boucle, ${v} vaut ${M(x0)}. Après chaque exécution de « ${tb(corps[0])} », teste « ${tx(c)} » : tant qu'il est faux, on recommence. Compte les tours jusqu'à ce que le test soit vrai.`,
    solution: `On suit ${v}, tour par tour :${tableau(r)}Le test devient vrai après ${E_[0]} tour${E_[0] > 1 ? 's' : ''} : le bloc est exécuté ${E_[0]} fois.`,
    verify: e => { const w = exec([mettre('t', 0), mettre(v, x0), jusqua(c, [...corps, ajouter('t', 1)])]).v.t; return w === e[0]; },
  });
}
function genJusqua(d) {
  for (let t = 0; t < 400; t++) {
    const ty = pick(d < 1 ? ['add'] : d < 2 ? ['add', 'mul'] : ['add', 'mul', 'sub']), v = pick(['x', 'x', 'n', 's']);
    let x0, corps, c;
    if (ty === 'add') { const k = ri(2, 9); x0 = ri(0, 9); const T = x0 + k * ri(3, d < 2 ? 5 : 9) + ri(0, k - 1); corps = [ajouter(v, k)]; c = cond(chance(0.5) ? '>' : '≥', v, T); }
    else if (ty === 'mul') { const m = ri(2, 3); x0 = ri(1, 4); corps = [mettre(v, fois(v, m))]; c = cond(chance(0.5) ? '>' : '≥', v, x0 * Math.pow(m, ri(3, 6)) + ri(0, 3)); }
    else { const k = ri(2, 8); x0 = ri(40, 99); corps = [mettre(v, moins(v, k))]; c = cond(chance(0.5) ? '<' : '≤', v, x0 - k * ri(3, 8) - ri(0, k - 1)); }
    const r = run([mettre(v, x0), jusqua(c, corps)]);
    const lim = d < 1 ? 5 : d < 2 ? 7 : 10;
    if (r.tours >= 2 && r.tours <= lim && Math.abs(r.env[v]) < 5000 && r.env[v] > 0) return { v, x0, corps, c, tours: r.tours };
  }
  throw new Error('genJusqua');
}
export function L10(d) {
  const P = genJusqua(d), f = pick(d < 1 ? ['valeur', 'combien'] : ['valeur', 'tours', 'combien']);
  if (f === 'valeur') {
    if (d >= 3 && chance(0.2)) { // le test est déjà vrai au départ : zéro tour
      const c = cond('>', P.v, 5), x0 = ri(8, 40); return F10valeur({ v: P.v, x0, corps: P.corps, c });
    }
    return F10valeur(P);
  }
  if (f === 'tours') { const w = P.v === 'x' ? 't' : 'k'; return F10tours({ ...P, w }); }
  return F10combien(P);
}
export function C10() {
  const P1 = { v: 'x', x0: 3, corps: [ajouter('x', 4)], c: cond('>', 'x', 20) };
  const P2 = { v: 'x', w: 't', x0: 1, corps: [mettre('x', fois('x', 2))], c: cond('≥', 'x', 50) };
  const P3 = { v: 'x', x0: 70, corps: [mettre('x', moins('x', 15))], c: cond('<', 'x', 20) };
  const P4 = { v: 'x', x0: 30, corps: [ajouter('x', 4)], c: cond('>', 'x', 20) };
  return cours('10. « répéter jusqu\'à »',
    'Quand on ne sait pas à l\'avance combien de tours il faudra, on utilise « répéter <b>jusqu\'à</b> ». La boucle recommence tant que le test est <b>faux</b> et s\'arrête dès qu\'il devient <b>vrai</b>.',
    cols(def('<b>répéter jusqu\'à (test)</b> : avant chaque tour, on regarde le test. S\'il est faux, on exécute les blocs ; s\'il est vrai, on sort de la boucle. Si le test est vrai dès le départ, on ne fait <b>aucun</b> tour.'),
      progSvg([mettre('x', 1), jusqua(cond('>', 'x', 20), [mettre('x', fois('x', 2))])])),
    meth('Écris la valeur de départ des variables.', 'Teste <b>avant chaque tour</b> : faux → exécute les blocs, puis reteste ; vrai → stop.', 'Une ligne par tour dans le tableau de suivi ; la dernière ligne est celle où le test devient vrai.'),
    exQ(F10valeur(P1)), exQ(F10tours(P2)), exQ(F10combien(P3)), exQ(F10valeur(P4)),
    warn('Le test est fait avant chaque tour, pas à la fin : la valeur qui rend le test vrai est <b>gardée</b> (on s\'arrête, on ne recommence pas).', 'Avec « répéter jusqu\'à x &gt; 20 », la boucle s\'arrête pour x = 21 (ou plus), pas pour x = 20.', 'Attention aux tours en trop ou en moins : compte les lignes de ton tableau.'),
    retenir('« répéter jusqu\'à » : on recommence tant que le test est faux ; dès qu\'il est vrai, on s\'arrête (peut-être sans aucun tour).'));
}

/* =====================================================================
   11. Trouver l'erreur, modifier un programme
   ===================================================================== */
const Q = { txt: '?' };
const SYMB = { '+': '+', '−': '−', '×': '×', '÷': '÷' };
/** { val, ops, i } : quel nombre mettre à la place du ? dans un bloc de calcul */
export function F11op({ val, ops, i }) {
  const vs = chaine(val, ops), G = vs[vs.length - 1];
  const montre = [entree('nombre', val), ...ops.map((o, j) => (j === i ? op(o.o, Q) : o)), dire('nombre')];
  const apres = vs[i + 1]; let lignes = [];
  let cur = G;
  for (let j = ops.length - 1; j > i; j--) { const nx = vs[j]; lignes.push(`on défait « ${tb(ops[j])} » : ${M(cur)} ${SYMB[inv(ops[j]).o]} ${M(ops[j].k)} = ${M(nx)}`); cur = nx; }
  const o = ops[i], A = vs[i];
  const eq = o.o === '+' ? `${M(A)} + ? = ${M(apres)}, donc ? = ${M(apres)} − ${M(A)} = ${M(o.k)}` : o.o === '−' ? `${M(A)} − ? = ${M(apres)}, donc ? = ${M(A)} − ${M(apres)} = ${M(o.k)}` : o.o === '×' ? `${M(A)} × ? = ${M(apres)}, donc ? = ${M(apres)} ÷ ${M(A)} = ${M(o.k)}` : `${M(A)} ÷ ? = ${M(apres)}, donc ? = ${M(A)} ÷ ${M(apres)} = ${M(o.k)}`;
  return numQ({
    html: `On entre ${M(val)} et le programme doit dire ${M(G)}. Quel nombre faut-il écrire à la place du point d'interrogation ?`, prog: montre, tpl: '? = {0}', E: [o.k],
    msg: x => { const t = vs[vs.length - 1]; return x[0] === A ? `${M(x[0])} est le nombre avant le bloc « ${tb(montre[i + 1])} » : cherche ce que ce bloc doit ajouter, retirer, multiplier ou diviser.` : ''; },
    hint: `On entre ${M(val)} et le programme doit dire ${M(G)}. Exécute les blocs connus depuis ${M(val)} jusqu'au bloc « ${tb(montre[i + 1])} », et remonte depuis ${M(G)} avec les opérations inverses : tu connais ainsi le nombre avant et après ce bloc.`,
    solution: `Avant le bloc « ${tb(montre[i + 1])} », le nombre vaut ${M(A)} (${vs.slice(0, i + 1).map(M).join(' → ')}).${lignes.length ? `<br>En remontant depuis ${M(G)} : ${lignes.join(' ; ')}.` : ''}<br>Après ce bloc, il doit valoir ${M(apres)}.<br>${eq}.`,
    verify: e => { const w = exec([entree('nombre', val), ...ops.map((p, j) => (j === i ? op(p.o, e[0]) : p)), dire('nombre')]).out[0] === G; let n = 0; for (let k = 1; k <= 300; k++) if (exec([entree('nombre', val), ...ops.map((p, j) => (j === i ? op(p.o, k) : p)), dire('nombre')]).out[0] === G) n++; return w && n === 1; },
  });
}
/** { s0, k, n } : nombre de tours à écrire */
export function F11rep({ s0, k, n }) {
  const prog = [mettre('s', s0), rep(Q, [ajouter('s', k)]), dire('s')], G = s0 + k * n, vrai = [mettre('s', s0), rep(n, [ajouter('s', k)]), dire('s')];
  return numQ({
    html: `Le programme doit dire ${M(G)}. Quel nombre faut-il écrire à la place du point d'interrogation dans « répéter ? fois » ?`, prog, tpl: '? = {0}', E: [n],
    msg: x => (x[0] === (G - s0) ? `${M(G - s0)} est ce que la boucle doit ajouter en tout. Chaque tour ajoute ${k} : combien de tours faut-il ?` : x[0] === n + 1 || x[0] === n - 1 ? `Vérifie avec ${M(x[0])} tours : s vaudrait ${M(s0 + k * x[0])}, pas ${M(G)}.` : ''),
    hint: `Avant la boucle, s vaut ${s0}. À chaque tour, s augmente de ${k}. Il faut que s soit égal à ${M(G)} à la fin : de combien la boucle doit-elle faire augmenter s, et combien de tours de ${k} cela représente-t-il ?`,
    solution: `s doit passer de ${s0} à ${M(G)} : la boucle doit ajouter ${M(G)} − ${s0} = ${M(G - s0)}.<br>Chaque tour ajoute ${k} : ${M(G - s0)} ÷ ${k} = ${n} tours.<br>Vérification : ${s0} + ${n} × ${k} = ${M(G)}.`,
    verify: e => { const f = m => exec([mettre('s', s0), rep(m, [ajouter('s', k)]), dire('s')]).out[0]; let c = 0; for (let m = 0; m <= 200; m++) if (f(m) === G) c++; return f(e[0]) === G && c === 1; },
  });
}
/** { nx, st, prog (avec la vraie valeur), i } : valeur de « avancer de ? cases » pour atteindre l'étoile */
export function F11av({ nx, st, prog, i }) {
  const r = run(prog, st), T = [r.x, r.y], montre = prog.map((b, j) => (j === i ? av(Q) : b));
  const n = prog[i].n;
  return numQ({
    html: `Le lutin part de la case (${st.x} ; ${st.y}) et regarde ${sansFleche(st.hd)}. Il doit s'arrêter sur l'étoile. Quel nombre faut-il écrire à la place du point d'interrogation ?`,
    visual: dual(grille({ nx, ny: nx, start: st, cible: T, cell: nx > 6 ? 38 : 44 }), progSvg(montre)), tpl: '? = {0}',
    after: dual(grille({ nx, ny: nx, start: st, cible: T, fin: { x: r.x, y: r.y, hd: r.hd }, trace: r.path, cell: nx > 6 ? 38 : 44 }), progSvg(prog)),
    E: [n],
    msg: x => (x[0] < n ? `Avec ${x[0]} case${x[0] > 1 ? 's' : ''}, le lutin s'arrête avant l'étoile.` : x[0] > n ? `Avec ${x[0]} cases, le lutin dépasse l'étoile.` : ''),
    hint: `Exécute les blocs avant le point d'interrogation : le lutin est alors dans la case ${(() => { const q = run(prog.slice(0, i), st); return `(${q.x} ; ${q.y})`; })()}, tourné ${sansFleche(run(prog.slice(0, i), st).hd)}. Combien de cases doit-il faire dans cette direction pour être sur la même ligne ou la même colonne que l'étoile ${`(${T[0]} ; ${T[1]})`}, avant les blocs suivants ?`,
    solution: `On exécute les blocs connus depuis le départ, puis on cherche la valeur manquante :${tableau(r)}Il faut écrire ${n} : « avancer de ${n} case${n > 1 ? 's' : ''} ».`,
    verify: e => { const w = exec(prog.map((b, j) => (j === i ? av(e[0]) : b)), st); let c = 0; for (let m = 1; m <= 12; m++) { const q = exec(prog.map((b, j) => (j === i ? av(m) : b)), st); if (q.x === T[0] && q.y === T[1]) c++; } return w.x === T[0] && w.y === T[1] && c === 1; },
  });
}
/** { nx, st, prog, i, cands, iBon, ordre } : quel bloc mettre à la place du bloc manquant ? */
export function F11bloc({ nx, st, prog, i, cands, ordre }) {
  const r = run(prog, st), T = [r.x, r.y], montre = prog.map((b, j) => (j === i ? { t: 'trou' } : b));
  const progs = cands.map(c => [c]); // cands[0] est le bon bloc
  const { opts, good, ordre: o2 } = optsProgs(progs, 0, { ordre });
  const par = {}; o2.forEach((j, k) => { par[LETTRES[k]] = j; });
  const fin = L => run(prog.map((b, j) => (j === i ? cands[par[L]] : b)), st);
  return choiceQ({
    html: `Le lutin part de la case (${st.x} ; ${st.y}) et regarde ${sansFleche(st.hd)}. Quel bloc faut-il mettre à la place du bloc manquant pour qu'il arrive sur l'étoile ?`,
    visual: dual(grille({ nx, ny: nx, start: st, cible: T, cell: nx > 6 ? 38 : 44 }), progSvg(montre)), opts, keep: true, good, texte: `Bloc ${good}`,
    after: dual(grille({ nx, ny: nx, start: st, cible: T, fin: { x: r.x, y: r.y, hd: r.hd }, trace: r.path, cell: nx > 6 ? 38 : 44 }), progSvg(prog)), replace: true,
    msg: c => { const q = fin(c); return `Avec le bloc ${c}, le lutin arrive en (${q.x} ; ${q.y}), pas sur l'étoile en (${T[0]} ; ${T[1]}).`; },
    hint: `Exécute les blocs avant le bloc manquant : le lutin est en (${run(prog.slice(0, i), st).x} ; ${run(prog.slice(0, i), st).y}). Il doit finir sur l'étoile, en (${T[0]} ; ${T[1]}). Essaie chaque bloc proposé à la place du bloc manquant, puis exécute la suite.`,
    solution: `On essaie chaque bloc à la place du bloc manquant :<br>${LETTRES.slice(0, cands.length).map(L => { const q = fin(L); return `Bloc ${L} : arrivée en (${q.x} ; ${q.y}) ${par[L] === 0 ? '✔' : '✘'}`; }).join('<br>')}<br>Seul le bloc ${good} amène le lutin sur l'étoile.`,
    verify: e => { const ok = L => { const q = exec(prog.map((b, j) => (j === i ? cands[par[L]] : b)), st); return q.x === T[0] && q.y === T[1]; }; return ok(e) && LETTRES.slice(0, cands.length).filter(ok).length === 1; },
  });
}
const BLOC = { x0: p => `mettre x à ${p.x0}`, k: p => `ajouter ${p.k} à x`, n: p => `répéter ${p.n} fois` };
const progErr = p => [mettre('x', p.x0), rep(p.n, [ajouter('x', p.k)]), dire('x')];
/** { vrai, faux, slot, mods, ordre } : corriger un programme qui ne dit pas le bon nombre */
export function F11erreur({ vrai, faux, slot, mods, ordre }) {
  const G = run(progErr(vrai)).out[0], B = run(progErr(faux)).out[0], prog = progErr(faux);
  const txtMod = m => `Remplacer ${faux[m.slot]} par ${m.val} dans « ${BLOC[m.slot](faux)} »`;
  const opts0 = mods.map((m, j) => ({ v: LETTRES[j], l: `<b>${LETTRES[j]}</b> ${txtMod(m)}` }));
  const ord = ordre || shuffle(mods.map((_, j) => j));
  const opts = ord.map((j, k) => ({ v: LETTRES[k], l: `<b>${LETTRES[k]}</b> ${txtMod(mods[j])}` })), good = LETTRES[ord.indexOf(0)];
  const par = {}; ord.forEach((j, k) => { par[LETTRES[k]] = j; });
  const res = m => run(progErr({ ...faux, [m.slot]: m.val })).out[0];
  return choiceQ({
    html: `Ce programme devrait dire ${M(G)}, mais il dit ${M(B)}. Quelle modification le corrige ?`, prog, opts, keep: true, good, texte: `${LETTRES[ord.indexOf(0)]} : ${txtMod(mods[0])}`,
    msg: c => `Avec cette modification, le programme dit ${M(res(mods[par[c]]))}, pas ${M(G)}.`,
    hint: `Exécute le programme tel qu'il est écrit : il dit ${M(B)}, alors qu'il devrait dire ${M(G)}. L'écart est de ${M(Math.abs(G - B))}. Quel bloc ou quelle valeur peut expliquer cet écart ? Essaie les modifications proposées l'une après l'autre.`,
    solution: `Le programme écrit : ${tableau(run(prog))}On essaie chaque modification :<br>${LETTRES.slice(0, mods.length).map(L => `${L} : le programme dit ${M(res(mods[par[L]]))} ${par[L] === 0 ? '✔' : '✘'}`).join('<br>')}<br>Seule la modification ${good} donne ${M(G)}.`,
    verify: e => { const f = L => exec(progErr({ ...faux, [mods[par[L]].slot]: mods[par[L]].val })).out[0] === G; return f(e) && LETTRES.slice(0, mods.length).filter(f).length === 1; },
  });
}
/** { T, o, bug, tests, mods, ordre } : corriger un test qui ne se comporte pas comme prévu */
export function F11cond({ T, o, bug, tests, mods, ordre }) {
  const c0 = cond(bug, 'n', T), prog = [si(c0, [dire(txt('Bravo'))])];
  const dit = (c, n) => ev(c, { n });
  const appli = m => (m.kind === 'op' ? cond(m.to, 'n', T) : cond(bug, 'n', T + m.delta));
  const txtM = m => (m.kind === 'op' ? `Remplacer « ${bug} » par « ${m.to} »` : `Remplacer ${T} par ${T + m.delta}`);
  const ord = ordre || shuffle(mods.map((_, j) => j));
  const opts = ord.map((j, k) => ({ v: LETTRES[k], l: `<b>${LETTRES[k]}</b> ${txtM(mods[j])}` })), good = LETTRES[ord.indexOf(0)];
  const par = {}; ord.forEach((j, k) => { par[LETTRES[k]] = j; });
  const oui = tests.filter(t => t.bravo).map(t => t.n), non = tests.filter(t => !t.bravo).map(t => t.n);
  const dev = m => tests.filter(t => dit(appli(m), t.n) !== t.bravo).map(t => t.n);
  return choiceQ({
    html: `Le programme devrait dire « Bravo » pour n = ${oui.join(' et pour n = ')}, et ne rien dire pour n = ${non.join(' ni pour n = ')}. Quelle modification le corrige ?`, prog, opts, keep: true, good, texte: `${good} : ${txtM(mods[0])}`,
    msg: c => { const d2 = dev(mods[par[c]]); return `Avec cette modification, le programme se trompe encore pour n = ${d2.join(' et pour n = ')}.`; },
    hint: `Teste le programme tel qu'il est écrit avec n = ${oui[0]} : le test « ${tx(c0)} » est ${dit(c0, oui[0]) ? 'vrai' : 'faux'}, alors que le programme devrait dire « Bravo ». Quelle plus petite modification rendrait le test vrai pour ${oui.join(' et ')} mais faux pour ${non.join(' et ')} ?`,
    solution: `Le test écrit est « ${tx(c0)} » : il est faux pour n = ${oui[0]}, alors qu'on veut « Bravo ».<br>On essaie chaque modification sur n = ${tests.map(t => t.n).join(', ')} :<br>${LETTRES.slice(0, mods.length).map(L => `${L} : ${dev(mods[par[L]]).length ? `se trompe pour n = ${dev(mods[par[L]]).join(', ')} ✘` : 'tous les cas sont bons ✔'}`).join('<br>')}<br>Seule la modification ${good} convient.`,
    verify: e => { const bon = L => tests.every(t => exec([entree('n', t.n), si(appli(mods[par[L]]), [dire(txt('Bravo'))])]).out.length === (t.bravo ? 1 : 0)); return bon(e) && LETTRES.slice(0, mods.length).filter(bon).length === 1; },
  });
}
function genOpInconnu(d) {
  for (let t = 0; t < 400; t++) {
    const { val, ops } = genChaine(d < 2 ? 2 : 3, d), i = ri(0, ops.length - 1);
    const vs = chaine(val, ops), G = vs[vs.length - 1];
    let n = 0; for (let k = 1; k <= 300; k++) { const o = ops.map((p, j) => (j === i ? op(p.o, k) : p)); const w = chaine(val, o).pop(); if (w === G) n++; }
    if (n === 1) return F11op({ val, ops, i });
  }
  throw new Error('genOpInconnu');
}
function genErreur(d) {
  for (let t = 0; t < 600; t++) {
    const vrai = { x0: ri(0, 9), k: ri(2, 9), n: ri(3, 8) }, slot = pick(['x0', 'k', 'n']);
    const faux = { ...vrai };
    faux[slot] = slot === 'x0' ? vrai.x0 + pick([-2, -1, 1, 2, 3].filter(v => vrai.x0 + v >= 0)) : slot === 'k' ? vrai.k + pick([-1, 1, 2]) : vrai.n + pick([-1, 1, 2]);
    if (faux.k < 1 || faux.n < 2) continue;
    const G = run(progErr(vrai)).out[0], B = run(progErr(faux)).out[0];
    if (G === B) continue;
    const mods = [{ slot, val: vrai[slot] }];
    const autres = shuffle(['x0', 'k', 'n'].map(s => ({ s }))), tries = [];
    for (const { s } of autres) {
      for (const dv of shuffle([-2, -1, 1, 2])) { const val = (s === slot ? vrai[s] : faux[s]) + dv; if (val < (s === 'x0' ? 0 : s === 'k' ? 1 : 2) || val === vrai[s] && s === slot) continue; tries.push({ slot: s, val }); }
    }
    for (const m of shuffle(tries)) {
      if (mods.length >= (d < 3 ? 3 : 4)) break;
      if (mods.some(x => x.slot === m.slot && x.val === m.val) || (m.slot === slot && m.val === faux[slot])) continue;
      if (run(progErr({ ...faux, [m.slot]: m.val })).out[0] !== G) mods.push(m);
    }
    if (mods.length >= (d < 3 ? 3 : 4)) return F11erreur({ vrai, faux, slot, mods });
  }
  throw new Error('genErreur');
}
function genCond11(d) {
  for (let t = 0; t < 200; t++) {
    const T = ri(5, 20), sup = chance(0.5), o = sup ? '≥' : '≤', bug = sup ? '>' : '<', s = sup ? 1 : -1;
    const tests = [{ n: T, bravo: true }, { n: T + s * ri(3, 6), bravo: true }, { n: T - s * ri(2, 4), bravo: false }];
    const opp = sup ? '<' : '>';
    const cand = [{ kind: 'op', to: o }, { kind: 'seuil', delta: s }, { kind: 'op', to: opp }, { kind: 'seuil', delta: s * 2 }, { kind: 'seuil', delta: s * 3 }];
    const appli = m => (m.kind === 'op' ? cond(m.to, 'n', T) : cond(bug, 'n', T + m.delta));
    const bons = cand.filter(m => tests.every(tt => ev(appli(m), { n: tt.n }) === tt.bravo));
    if (bons.length !== 1) continue;
    const faux = cand.filter(m => !bons.includes(m));
    const mods = [bons[0], ...shuffle(faux).slice(0, d < 3 ? 2 : 3)];
    return F11cond({ T, o, bug, tests: shuffle(tests), mods });
  }
  throw new Error('genCond11');
}
function genAv11(d, bloc) {
  const nx = d < 3 ? 6 : 7;
  for (let t = 0; t < 800; t++) {
    const { st, prog } = marche({ nx, k: d < 2 ? 3 : 4, hd0: pick([0, 90, 180, 270]) });
    const idxAv = prog.map((b, i) => (b.t === 'av' ? i : -1)).filter(i => i >= 0);
    if (!idxAv.length) continue;
    if (!bloc) { const i = pick(idxAv); const T = run(prog, st); let c = 0; for (let m = 1; m <= nx; m++) { const q = run(prog.map((b, j) => (j === i ? av(m) : b)), st); if (q.x === T.x && q.y === T.y) c++; } if (c === 1) return F11av({ nx, st, prog, i }); continue; }
    const i = ri(0, prog.length - 1), pool = [av(1), av(2), av(3), tD(), tG()];
    const T = run(prog, st);
    const bons = pool.filter(c => { const q = run(prog.map((b, j) => (j === i ? c : b)), st); return q.x === T.x && q.y === T.y; });
    const orig = JSON.stringify(prog[i]);
    if (bons.length !== 1 || JSON.stringify(bons[0]) !== orig) continue;
    const faux = shuffle(pool.filter(c => JSON.stringify(c) !== orig)).slice(0, d < 3 ? 2 : 3);
    return F11bloc({ nx, st, prog, i, cands: [prog[i], ...faux] });
  }
  throw new Error('genAv11');
}
export function L11(d) {
  const f = pick(d < 1 ? ['op', 'rep'] : d < 2 ? ['op', 'rep', 'av', 'erreur'] : ['op', 'rep', 'av', 'bloc', 'erreur', 'cond']);
  if (f === 'op') return genOpInconnu(d);
  if (f === 'rep') { const k = ri(2, 9), n = ri(3, d < 2 ? 6 : 9); return F11rep({ s0: ri(0, 9), k, n }); }
  if (f === 'av') return genAv11(d, false);
  if (f === 'bloc') return genAv11(d, true);
  if (f === 'erreur') return genErreur(d);
  return genCond11(d);
}
export function C11() {
  const P1 = { val: 4, ops: [op('×', 3), op('+', 5)], i: 0 };
  const P2 = { s0: 3, k: 4, n: 6 };
  const P3 = { nx: 5, st: { x: 1, y: 2, hd: 0 }, prog: [av(2), tG(), av(3)], i: 2 };
  const P4 = { nx: 5, st: { x: 1, y: 1, hd: 0 }, prog: [av(3), tG(), av(2)], i: 1, cands: [tG(), tD(), av(1)], ordre: [1, 0, 2] };
  const P5 = { vrai: { x0: 2, k: 5, n: 4 }, faux: { x0: 2, k: 5, n: 3 }, slot: 'n', mods: [{ slot: 'n', val: 4 }, { slot: 'k', val: 6 }, { slot: 'x0', val: 3 }], ordre: [1, 0, 2] };
  const P6 = { T: 10, o: '≥', bug: '>', tests: [{ n: 10, bravo: true }, { n: 15, bravo: true }, { n: 7, bravo: false }], mods: [{ kind: 'op', to: '≥' }, { kind: 'seuil', delta: 1 }, { kind: 'op', to: '<' }], ordre: [2, 0, 1] };
  return cours('11. Trouver l\'erreur, modifier un programme',
    'Un programmeur lit souvent des programmes <b>qui ne font pas ce qu\'on voulait</b>. Pour corriger, on exécute le programme, on compare avec le but, et on cherche <b>quel bloc ou quelle valeur</b> explique la différence.',
    cols(def('<b>Corriger un programme</b> : 1. exécuter le programme tel qu\'il est écrit ; 2. comparer son résultat à celui qu\'on veut ; 3. changer <b>un seul</b> bloc ou une seule valeur ; 4. exécuter à nouveau pour vérifier.'),
      progSvg([mettre('s', 0), rep(Q, [ajouter('s', 4)]), dire('s')])),
    meth('Pour trouver une valeur manquante : pars du résultat voulu et remonte (opérations inverses), ou calcule ce qui manque.', 'Pour choisir une modification : essaie chaque proposition et vérifie le résultat.', 'Une bonne modification donne le bon résultat <b>dans tous les cas demandés</b>.'),
    exQ(F11op(P1)), exQ(F11rep(P2)), exQ(F11av(P3)), exQ(F11bloc(P4)), exQ(F11erreur(P5)), exQ(F11cond(P6)),
    warn('Une modification qui marche pour un cas ne marche pas forcément pour les autres : teste-les tous.', 'Ne change qu\'<b>un seul</b> bloc à la fois, sinon on ne sait plus ce qui a corrigé l\'erreur.', '« n &gt; 10 » et « n ≥ 10 » ne se comportent pas pareil quand n vaut 10.'),
    retenir('pour corriger un programme, on l\'exécute, on compare au résultat voulu et on teste chaque modification possible.'));
}

/* =====================================================================
   12. Défis : boucle, variable et condition
   ===================================================================== */
/** { a, b } : division euclidienne par soustractions */
export function F12euclide({ a, b }) {
  const prog = [mettre('q', 0), mettre('r', a), jusqua(cond('<', 'r', b), [mettre('r', moins('r', b)), ajouter('q', 1)]), dire('q')], r = run(prog), q = r.env.q, rr = r.env.r;
  return numQ({
    html: `On divise ${a} par ${b} avec ce programme. Que valent le quotient q et le reste r à la fin ?`, prog, tpl: 'q = {0} ; r = {1}', E: [q, rr],
    msg: v => (v[0] === q + 1 ? `Le test est fait avant chaque tour : dès que r est plus petit que ${b}, on arrête sans soustraire une fois de plus.` : v[0] === q - 1 ? 'Il manque un tour : à ce moment-là, r est encore supérieur ou égal au diviseur.' : v[1] === q && v[0] === rr ? 'Tu as inversé q et r : q compte les soustractions, r est ce qui reste.' : ''),
    hint: `À chaque tour, on retire ${b} à r (qui vaut ${a} au départ) et on ajoute 1 à q. On s'arrête dès que r est plus petit que ${b}. Écris r et q après chaque tour.`,
    solution: `On suit q et r, tour par tour :${tableau(r)}On s'arrête quand r &lt; ${b} : q = ${q} et r = ${rr}. On retrouve ${a} = ${b} × ${q} + ${rr}.`,
    verify: e => { const w = exec(prog).v; return w.q === e[0] && w.r === e[1] && e[0] === Math.floor(a / b) && e[1] === a % b; },
  });
}
const syra = [si(cond('=', reste('n', 2), 0), [mettre('n', div2('n'))], [mettre('n', plus(fois(3, 'n'), 1))])];
function div2(v) { return E('÷', v, 2); }
/** { n0, k } : k tours de la suite de Syracuse */
export function F12syracuse({ n0, k }) {
  const prog = [entree('n', n0), rep(k, [...syra]), dire('n')], r = run(prog), E_ = [r.out[0]];
  const m1 = run([entree('n', n0), rep(k - 1, [...syra]), dire('n')]).out[0], p1 = run([entree('n', n0), rep(k + 1, [...syra]), dire('n')]).out[0];
  return numQ({
    html: `On entre ${n0}. Que dit le programme ?`, prog, tpl: 'Il dit {0}', E: E_,
    msg: x => (x[0] === m1 ? `La boucle fait ${k} tours : il en manque un.` : x[0] === p1 ? `La boucle fait ${k} tours, pas ${k + 1}.` : ''),
    hint: `À chaque tour, regarde si n est pair : si oui, on le divise par 2 ; sinon on calcule 3 × n + 1. Premier tour : n vaut ${n0}, il est ${n0 % 2 === 0 ? 'pair' : 'impair'}. Refais cela ${k} fois, en écrivant n à chaque tour.`,
    solution: `On suit n, tour par tour :${tableau(r)}Après ${k} tours, le programme dit ${M(E_[0])}.`,
    verify: e => { let n = n0; for (let i = 0; i < k; i++) n = n % 2 === 0 ? n / 2 : 3 * n + 1; return exec(prog).out[0] === e[0] && n === e[0]; },
  });
}
const pas = n0 => { let n = n0, c = 0; while (n !== 1 && c < 1000) { n = n % 2 === 0 ? n / 2 : 3 * n + 1; c++; } return c; };
/** { n0 } : nombre d'étapes avant d'arriver à 1 */
export function F12etapes({ n0 }) {
  const prog = [entree('n', n0), mettre('c', 0), jusqua(cond('=', 'n', 1), [...syra, ajouter('c', 1)]), dire('c')], r = run(prog), E_ = [r.out[0]];
  return numQ({
    html: `Combien d'étapes le programme compte-t-il quand on entre ${n0} ?`, prog, tpl: '{0} étapes', E: E_,
    msg: x => (x[0] === E_[0] + 1 || x[0] === E_[0] - 1 ? 'Vérifie le nombre de lignes de ton tableau : on s\'arrête dès que n vaut 1, et chaque tour compte une étape.' : ''),
    hint: `La boucle s'arrête quand n vaut 1. À chaque tour, n devient n ÷ 2 s'il est pair, 3 × n + 1 sinon, puis le compteur c augmente de 1. Part de n = ${n0} et écris n à chaque tour, jusqu'à arriver à 1.`,
    solution: `On suit n et c, tour par tour :${tableau(r)}On arrive à 1 après ${E_[0]} étapes : le programme dit ${E_[0]}.`,
    verify: e => exec(prog).out[0] === e[0] && pas(n0) === e[0],
  });
}
/** { n, c } : un compteur et une condition dans une boucle */
export function F12melange({ n, c, p }) {
  const prog = [mettre('i', 0), mettre('s', 0), rep(n, [ajouter('i', 1), si(c, [ajouter('s', 'i')])]), dire('s')], r = run(prog), E_ = [r.out[0]];
  return numQ({
    html: 'Que dit le programme ?', prog, tpl: 'Il dit {0}', E: E_,
    msg: x => (x[0] === n * (n + 1) / 2 ? 'Tu as additionné tous les nombres : seuls ceux qui passent le test « ' + tx(c) + ' » sont ajoutés à s.' : ''),
    hint: `À chaque tour, i augmente de 1, puis on teste « ${tx(c)} » avec la nouvelle valeur de i : si le test est vrai, on ajoute i à s. Écris i, le test (vrai ou faux) et s pour chacun des ${n} tours.`,
    solution: `On suit i et s, tour par tour :${tableau(r)}Le programme dit ${M(E_[0])}.`,
    verify: e => { let s = 0; for (let i = 1; i <= n; i++) if (ev(c, { i })) s += i; return exec(prog).out[0] === e[0] && s === e[0]; },
  });
}
export function L12(d) {
  const f = pick(d < 1 ? ['euclide', 'syra'] : d < 2 ? ['euclide', 'syra', 'etapes'] : ['euclide', 'syra', 'etapes', 'melange']);
  if (f === 'euclide') { const b = ri(3, d < 3 ? 7 : 9), q = ri(2, d < 3 ? 6 : 10); return F12euclide({ a: b * q + ri(0, b - 1), b }); }
  if (f === 'syra') { const n0 = ri(3, d < 3 ? 9 : 15); return F12syracuse({ n0, k: ri(3, d < 3 ? 5 : 7) }); }
  if (f === 'etapes') { const L = []; for (let n = 3; n <= (d < 3 ? 16 : 30); n++) if (pas(n) >= 4 && pas(n) <= (d < 3 ? 9 : 13)) L.push(n); return F12etapes({ n0: pick(L) }); }
  const n = ri(6, d < 3 ? 10 : 14);
  const c = pick([cond('=', reste('i', 3), 0), cond('=', reste('i', 2), 1), cond('>', 'i', ri(3, 6)), cond('=', reste('i', 5), 0)]);
  return F12melange({ n, c });
}
export function C12() {
  return cours('12. Défis : boucle, variable et condition',
    'Les vrais programmes mélangent tout : une <b>boucle</b> pour répéter, des <b>variables</b> pour mémoriser, des <b>conditions</b> pour choisir. La méthode reste la même : le tableau de suivi, tour par tour.',
    cols(def('<b>Algorithme</b> : une suite d\'instructions précises qui résout un problème. Compter ses <b>étapes</b> permet de comparer des algorithmes.<br>Exemples : la division euclidienne par soustractions successives, la suite de Syracuse (si n est pair : n ÷ 2 ; sinon : 3 × n + 1).'),
      progSvg([mettre('q', 0), mettre('r', 17), jusqua(cond('<', 'r', 5), [mettre('r', moins('r', 5)), ajouter('q', 1)])])),
    meth('Repère les variables et leurs valeurs de départ.', 'Fais un tableau : une ligne par tour, une colonne par variable, et le résultat des tests.', 'Dans une boucle avec « si », fais le test à <b>chaque</b> tour avec les valeurs de ce tour.'),
    exQ(F12euclide({ a: 29, b: 6 })), exQ(F12syracuse({ n0: 6, k: 4 })), exQ(F12etapes({ n0: 6 })), exQ(F12melange({ n: 8, c: cond('=', reste('i', 3), 0) })),
    warn('Dans « répéter jusqu\'à r &lt; b », le dernier tour est celui qui rend r plus petit que b : on ne refait pas de tour après.', 'Pour la suite de Syracuse, le test « pair ou impair » se refait avec la <b>nouvelle</b> valeur de n à chaque tour.', 'Ne mélange pas les tours (lignes) et les variables (colonnes) de ton tableau.'),
    retenir('un algorithme se simule avec un tableau de suivi ; le nombre de lignes du tableau est le nombre d\'étapes.'));
}

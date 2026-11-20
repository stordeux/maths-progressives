// Pensée informatique, niveaux 1 à 4 : séquence d'instructions (lutin sur une grille), ordre des instructions,
// programme de calcul (entrée, opérations, sortie), boucle « répéter n fois ».
// Chaque forme d'exercice est une fonction F…(paramètres) : l'exercice l'appelle avec des données tirées au hasard,
// le cours avec des données fixes (même énoncé, même dessin, même solution).
import { av, tD, tG, rot, entree, op, dire, rep, tx, tb, run, varsOf } from './lang.js';
import { exec } from './verif.js';
import {
  ri, pick, chance, shuffle, M, numQ, choiceQ, optsProgs, OUI_NON, LETTRES, progSvg, grille, dual, figure, tableau, dirTexte, sansFleche, cases,
  exQ, ex, warn, retenir, meth, def, cours, cols, premierPas, egal,
} from './outils.js';

/* ---------- grille : tirage d'un parcours qui reste dans la grille ---------- */
const VEC = [[1, 0], [0, 1], [-1, 0], [0, -1]];
export const vec = hd => VEC[(Math.round(hd / 90) % 4 + 4) % 4];
const miroir = b => (b.t === 'tn' ? (b.s === 'D' ? tG() : tD()) : b.t === 'rep' ? { ...b, body: b.body.map(miroir) } : b);
export const dedans = (r, nx, ny) => r.path.every(([x, y]) => x >= 1 && x <= nx && y >= 1 && y <= ny);
const cell = nx => (nx > 6 ? 38 : 44);
/** parcours aléatoire de k blocs dans une grille nx × ny ; fin : 'av' (dernier bloc = avancer), 'turn' ou null */
export function marche({ nx, ny = nx, k, hd0 = 0, fin = null, maxAv = 3, depart = null }) {
  for (let t = 0; t < 800; t++) {
    const st = depart ? { ...depart } : { x: ri(1, nx), y: ri(1, ny), hd: hd0 };
    let { x, y, hd } = st; const prog = []; let ok = true;
    for (let i = 0; i < k; i++) {
      const last = i === k - 1, [dx, dy] = vec(hd), prev = prog[i - 1];
      const libre = dx > 0 ? nx - x : dx < 0 ? x - 1 : dy > 0 ? ny - y : y - 1;
      let turn = fin === 'turn' && last ? true : fin === 'av' && last ? false : prev && prev.t === 'tn' ? false : chance(0.45);
      if (!turn && libre < 1) turn = true;
      if (fin === 'av' && last && turn) { ok = false; break; }
      if (turn) {
        const D = chance(0.5);
        if (prev && prev.t === 'tn' && prev.s !== (D ? 'D' : 'G')) { ok = false; break; } // pas de virage annulé aussitôt
        prog.push(D ? tD() : tG()); hd = (hd + (D ? 270 : 90)) % 360;
      } else { const n = ri(1, Math.min(maxAv, libre)); prog.push(av(n)); x += dx * n; y += dy * n; }
    }
    if (!ok || (x === st.x && y === st.y) || (k >= 3 && !prog.some(b => b.t === 'tn')) || !prog.some(b => b.t === 'av')) continue;
    return { st, prog };
  }
  throw new Error('marche impossible');
}
const grilleDe = (G, plus = {}) => grille({ nx: G.nx, ny: G.ny, cell: cell(G.nx), start: G.st, ...plus });
const finDe = r => ({ x: r.x, y: r.y, hd: r.hd });
const depart = st => `Le lutin part de la case (${st.x} ; ${st.y}) et regarde ${sansFleche(st.hd)}.`;

/* =====================================================================
   1. Séquence d'instructions : où arrive le lutin ?
   ===================================================================== */
/** G = { nx, ny, st, prog } : case d'arrivée */
export function F1pos(G) {
  const { st, prog } = G, r = run(prog, st), E = [r.x, r.y];
  const mir = run(prog.map(miroir), st), sans = run(prog.slice(0, -1), st);
  return numQ({
    html: `${depart(st)} Où arrive-t-il après ce programme ?`,
    visual: dual(grilleDe(G), progSvg(prog)),
    after: dual(grilleDe(G, { fin: finDe(r), trace: r.path }), progSvg(prog)),
    tpl: 'case ({0} ; {1})', labels: ['colonne', 'ligne'], E,
    msg: v => (v[0] === mir.x && v[1] === mir.y ? 'Vérifie le sens des virages : « tourner à droite » est un quart de tour dans le sens des aiguilles d\'une montre.'
      : v[0] === sans.x && v[1] === sans.y ? `Il manque le dernier bloc, « ${tb(prog[prog.length - 1])} » : le lutin bouge encore.`
        : v[0] === r.y && v[1] === r.x ? 'On donne la colonne (vers la droite) d\'abord, puis la ligne (vers le haut).' : ''),
    hint: `${premierPas(prog, st)} Continue bloc par bloc, en notant la case et la direction du lutin après chaque bloc (colonnes lues en bas, lignes lues à gauche).`,
    solution: `On suit le lutin bloc par bloc :${tableau(r)}Il arrive dans la case (${r.x} ; ${r.y}).`,
    verify: e => { const w = exec(prog, st); return w.x === e[0] && w.y === e[1]; },
  });
}
/** direction finale du lutin */
export function F1dir(G) {
  const { st, prog } = G, r = run(prog, st);
  const mir = run(prog.map(miroir), st);
  const iT = prog.findIndex(b => b.t === 'tn'), ap = run(prog.slice(0, iT + 1), st);
  return choiceQ({
    html: `${depart(st)} Dans quelle direction regarde-t-il à la fin du programme ?`,
    visual: dual(grilleDe(G), progSvg(prog)),
    after: dual(grilleDe(G, { fin: finDe(r), trace: r.path }), progSvg(prog)),
    opts: [0, 90, 180, 270].map(h => ({ v: String(h), l: dirTexte(h) })), keep: true, good: String(r.hd),
    texte: dirTexte(r.hd),
    msg: c => (c === String(mir.hd) ? 'Tu as tourné du mauvais côté : « tourner à droite » fait tourner dans le sens des aiguilles d\'une montre.' : 'Les blocs « avancer » ne changent pas la direction ; seuls les blocs « tourner » le font, d\'un quart de tour chacun.'),
    hint: `Au départ, le lutin regarde ${sansFleche(st.hd)}. Seuls les blocs « tourner » changent sa direction. Le premier, « ${tb(prog[iT])} », l'amène à regarder ${sansFleche(ap.hd)} ; continue avec les suivants.`,
    solution: `On suit la direction du lutin :${tableau(r)}À la fin, il regarde ${dirTexte(r.hd)}.`,
    verify: e => exec(prog, st).dir === Number(e),
  });
}
/** nombre total de cases parcourues */
export function F1dist(G) {
  const { st, prog } = G, r = run(prog, st), avs = prog.filter(b => b.t === 'av').map(b => b.n), E = [avs.reduce((a, b) => a + b, 0)];
  return numQ({
    html: `${depart(st)} Combien de cases parcourt-il en tout pendant le programme ?`,
    visual: dual(grilleDe(G), progSvg(prog)),
    after: dual(grilleDe(G, { fin: finDe(r), trace: r.path }), progSvg(prog)),
    tpl: '{0} cases', E,
    msg: v => (v[0] === avs.length ? 'Tu as compté les blocs « avancer » : il faut ajouter le nombre de cases de chacun.' : v[0] === E[0] + prog.filter(b => b.t === 'tn').length ? 'Les virages ne font pas avancer le lutin : ne les compte pas.' : ''),
    hint: `Seuls les blocs « avancer » font parcourir des cases ; les virages ne comptent pas. Ici, les blocs « avancer » sont de ${avs.map(String).join(', ').replace(/, ([^,]*)$/, ' et $1')} case${avs.some(n => n > 1) ? 's' : ''} : il reste à les additionner.`,
    solution: `Seuls les blocs « avancer » comptent : ${avs.join(' + ')} = ${E[0]}.<br>Le lutin parcourt ${cases(E[0])} (il finit en (${r.x} ; ${r.y})).`,
    verify: e => { const t = exec(prog, st).trail; let s = 0; for (let i = 1; i < t.length; i++) s += Math.abs(t[i][0] - t[i - 1][0]) + Math.abs(t[i][1] - t[i - 1][1]); return s === e[0]; },
  });
}
export function L1(d) {
  const f = pick(d < 1 ? ['pos', 'pos', 'dir'] : d < 2 ? ['pos', 'dir'] : ['pos', 'dir', 'dist']);
  const nx = d < 2 ? 5 : d < 4 ? 6 : 7, k = d < 1 ? 3 : d < 2 ? 4 : d < 4 ? 5 : 6, hd0 = d < 1 ? 0 : pick([0, 90, 180, 270]);
  const G = { nx, ny: nx, ...marche({ nx, k: f === 'dir' ? Math.max(k, 4) : k, hd0, fin: f === 'pos' ? 'av' : f === 'dir' ? 'turn' : null }) };
  return f === 'pos' ? F1pos(G) : f === 'dir' ? F1dir(G) : F1dist(G);
}
const G1a = { nx: 5, ny: 5, st: { x: 2, y: 4, hd: 0 }, prog: [av(2), tD(), av(2), tG(), av(1)] };
const G1b = { nx: 5, ny: 5, st: { x: 3, y: 3, hd: 0 }, prog: [tD(), av(1), tD(), av(1), tG()] };
const G1c = { nx: 5, ny: 5, st: { x: 1, y: 1, hd: 0 }, prog: [av(2), tG(), av(3), tD(), av(1)] };
export function C1() {
  return cours('1. Un lutin qui suit des instructions',
    'Un programme est une liste d\'instructions qu\'on exécute <b>dans l\'ordre, de haut en bas</b>, une seule à la fois. Ici, chaque bloc commande un petit lutin posé sur une grille.',
    cols(def(`<b>Les blocs du lutin</b> (bleus) :<br>• « <b>avancer de n cases</b> » : il se déplace de n cases dans la direction où il regarde ;<br>• « <b>tourner à droite</b> » / « <b>à gauche</b> » : il fait un quart de tour sans bouger de case (à droite = dans le sens des aiguilles d'une montre).<br>Les cases sont repérées par (colonne ; ligne), en comptant les colonnes vers la droite et les lignes vers le haut.`),
      progSvg([av(3), tD(), av(2), tG()])),
    meth('Pars de la case de départ, en regardant dans la direction donnée.', 'Exécute <b>un seul bloc à la fois</b> et note la case et la direction après chacun.', 'Un virage se fait <b>par rapport au lutin</b> (sa droite, pas la droite de l\'écran).'),
    exQ(F1pos(G1a)), exQ(F1dir(G1b)), exQ(F1dist(G1c)),
    warn('« Tourner à droite » veut dire : à la droite <b>du lutin</b>. S\'il regarde vers le bas, sa droite est à gauche sur l\'écran.', 'Colonne d\'abord, ligne ensuite : (colonne ; ligne).', 'Un virage ne fait pas avancer le lutin ; un « avancer » ne le fait pas tourner.'),
    retenir('un programme se lit de haut en bas, bloc par bloc ; on note la case et la direction du lutin après chaque bloc.'));
}

/* =====================================================================
   2. L'ordre des instructions
   ===================================================================== */
export function perms(a) {
  if (a.length <= 1) return [a];
  const out = [], vus = new Set();
  a.forEach((x, i) => {
    const key = JSON.stringify(x); if (vus.has(key)) return; vus.add(key);
    perms([...a.slice(0, i), ...a.slice(i + 1)]).forEach(p => out.push([x, ...p]));
  });
  return out;
}
const cleP = p => JSON.stringify(p);
const sansTour = (p, st, nx, ny) => { const r = run(p, st); return dedans(r, nx, ny) ? r : null; };
const fig = (n, p) => `<figure class="pg"><figcaption>Programme ${n}</figcaption>${progSvg(p)}</figure>`;

/** G = { nx, ny, st, progs, iBon, ordre } : quel programme amène le lutin sur l'étoile ? */
export function F2cible(G) {
  const { nx, ny, st, progs, iBon } = G;
  const fins = progs.map(p => run(p, st)), T = [fins[iBon].x, fins[iBon].y];
  const { opts, good, ordre } = optsProgs(progs, iBon, { ordre: G.ordre });
  const par = {}; ordre.forEach((i, k) => { par[LETTRES[k]] = i; });
  const memes = G.mode === 'perm';
  return choiceQ({
    html: `${depart(st)} Quel programme l'amène sur l'étoile ?`,
    visual: grilleDe(G, { cible: T }), opts, keep: true, good, texte: `Programme ${good}`,
    after: dual(grilleDe(G, { cible: T, fin: finDe(fins[iBon]), trace: fins[iBon].path }), progSvg(progs[iBon])), replace: true,
    msg: c => { const r = fins[par[c]]; return `Le programme ${c} arrive en (${r.x} ; ${r.y}), pas sur l'étoile en (${T[0]} ; ${T[1]}).`; },
    hint: `Le lutin part de (${st.x} ; ${st.y}) et doit finir sur l'étoile, en (${T[0]} ; ${T[1]}). Exécute chaque programme bloc par bloc depuis la case de départ et regarde où il s'arrête${memes ? ' (les programmes ont les mêmes blocs : seul l\'ordre change)' : ''}.`,
    solution: `On exécute chaque programme depuis (${st.x} ; ${st.y}) :<br>${LETTRES.slice(0, progs.length).map(L => { const r = fins[par[L]]; const ok = par[L] === iBon; return `Programme ${L} : il arrive en (${r.x} ; ${r.y}) ${ok ? '✔' : '✘'}`; }).join('<br>')}<br>Seul le programme ${good} arrive sur l'étoile (${T[0]} ; ${T[1]}) :${tableau(fins[iBon])}`,
    verify: e => { const fin = L => { const w = exec(progs[par[L]], st); return w.x === T[0] && w.y === T[1]; }; return fin(e) && LETTRES.slice(0, progs.length).filter(fin).length === 1; },
  });
}
/** G = { nx, ny, st, p1, p2 } : mêmes blocs, ordre différent ; même case d'arrivée ? */
export function F2meme(G) {
  const { st, p1, p2 } = G, r1 = run(p1, st), r2 = run(p2, st), pareil = r1.x === r2.x && r1.y === r2.y;
  return choiceQ({
    html: `${depart(st)} Les programmes 1 et 2 l'amènent-ils dans la même case ?`,
    visual: dual(grilleDe(G), fig(1, p1), fig(2, p2)), opts: OUI_NON, keep: true, good: pareil ? 'oui' : 'non', texte: pareil ? 'oui' : 'non',
    msg: c => (c === 'oui' ? `Regarde de plus près : le programme 1 arrive en (${r1.x} ; ${r1.y}) et le programme 2 en (${r2.x} ; ${r2.y}).` : `Les deux programmes finissent bien dans la même case, (${r1.x} ; ${r1.y}), même si l'ordre des blocs est différent.`),
    hint: `Fais d'abord le programme 1 depuis (${st.x} ; ${st.y}) et note sa case d'arrivée, puis le programme 2 depuis la même case de départ. Compare les deux cases d'arrivée.`,
    solution: `Programme 1 :${tableau(r1)}Programme 2 :${tableau(r2)}${pareil ? `Les deux arrivent en (${r1.x} ; ${r1.y}) : c'est la même case.` : `Le programme 1 arrive en (${r1.x} ; ${r1.y}) et le programme 2 en (${r2.x} ; ${r2.y}) : ce n'est pas la même case.`}`,
    verify: e => { const a = exec(p1, st), b = exec(p2, st); return (a.x === b.x && a.y === b.y) === (e === 'oui'); },
  });
}
function genCible(d) {
  const nx = d < 2 ? 5 : 6, mode = d < 3 ? 'perm' : 'diff', nOpt = mode === 'perm' ? 3 : 4;
  for (let t = 0; t < 600; t++) {
    const { st, prog } = marche({ nx, k: d < 2 ? 3 : 4, hd0: d < 1 ? 0 : pick([0, 90, 180, 270]), maxAv: 3 });
    if (prog.filter(b => b.t === 'av').length < 2) continue;
    const T = run(prog, st); const cands = [];
    if (mode === 'perm') for (const p of perms(prog)) cands.push(p);
    else {
      prog.forEach((b, i) => {
        if (b.t === 'tn') cands.push(prog.map((c, j) => (j === i ? miroir(c) : c)));
        else for (const n of [b.n - 1, b.n + 1, b.n + 2]) if (n >= 1) cands.push(prog.map((c, j) => (j === i ? av(n) : c)));
        if (i > 0) cands.push(prog.map((c, j) => (j === i ? prog[i - 1] : j === i - 1 ? prog[i] : c)));
      });
    }
    const vus = new Set([cleP(prog)]), faux = [];
    for (const p of shuffle(cands)) {
      const k = cleP(p); if (vus.has(k)) continue; vus.add(k);
      const r = sansTour(p, st, nx, nx); if (r && (r.x !== T.x || r.y !== T.y)) faux.push(p);
    }
    if (faux.length < nOpt - 1) continue;
    const progs = [prog, ...faux.slice(0, nOpt - 1)];
    return F2cible({ nx, ny: nx, st, progs, iBon: 0, mode });
  }
  throw new Error('genCible');
}
function genMeme(d) {
  const nx = d < 2 ? 5 : 6, voulu = chance(0.5);
  for (let t = 0; t < 800; t++) {
    const { st, prog } = marche({ nx, k: d < 2 ? 4 : 5, hd0: d < 1 ? 0 : pick([0, 90, 180, 270]), maxAv: 3 });
    const r = run(prog, st), autres = perms(prog).filter(p => cleP(p) !== cleP(prog)).map(p => [p, sansTour(p, st, nx, nx)]).filter(([, q]) => q);
    const bons = autres.filter(([, q]) => (q.x === r.x && q.y === r.y) === voulu);
    if (!bons.length) continue;
    const [p2] = pick(bons);
    return F2meme(chance(0.5) ? { nx, ny: nx, st, p1: prog, p2 } : { nx, ny: nx, st, p1: p2, p2: prog });
  }
  throw new Error('genMeme');
}
export function L2(d) { return pick(d < 1 ? ['cible'] : ['cible', 'meme']) === 'cible' ? genCible(d) : genMeme(d); }
const G2a = { nx: 5, ny: 5, st: { x: 1, y: 3, hd: 0 }, progs: [[av(2), tD(), av(1)], [av(1), tD(), av(2)], [av(2), av(1), tD()]], iBon: 0, ordre: [1, 0, 2], mode: 'perm' };
const G2b = { nx: 5, ny: 5, st: { x: 1, y: 1, hd: 0 }, p1: [av(2), tG(), av(2)], p2: [tG(), av(2), av(2)] };
const G2c = { nx: 5, ny: 5, st: { x: 1, y: 1, hd: 0 }, p1: [av(2), av(1), tG(), av(2)], p2: [av(1), av(2), tG(), av(2)] };
const G2d = { nx: 6, ny: 6, st: { x: 2, y: 3, hd: 90 }, progs: [[av(2), tD(), av(3), tD(), av(1)], [av(3), tD(), av(3), tD(), av(1)], [av(2), tD(), av(2), tD(), av(1)], [av(2), tD(), av(3), tG(), av(1)]], iBon: 0, ordre: [2, 0, 3, 1], mode: 'diff' };
export function C2() {
  return cours('2. L\'ordre des instructions compte',
    'Avec les mêmes blocs, on n\'arrive pas toujours au même endroit : <b>changer l\'ordre change le résultat</b>. Pour choisir un programme, on les exécute tous, bloc par bloc.',
    cols(def('Deux programmes qui ont <b>les mêmes blocs dans un ordre différent</b> sont différents. Un « avancer » ne se fait pas dans la même direction avant ou après un « tourner ».'),
      dual(fig(1, [av(2), tD(), av(1)]), fig(2, [tD(), av(2), av(1)]))),
    meth('Pour chaque programme : pars de la case de départ et exécute les blocs un par un.', 'Note la case d\'arrivée du programme.', 'Compare avec la case visée (l\'étoile) ou avec l\'autre programme.'),
    exQ(F2cible(G2a)), exQ(F2meme(G2b)), exQ(F2meme(G2c)), exQ(F2cible(G2d)),
    warn('Deux blocs « avancer » qui se suivent s\'additionnent : leur ordre ne change rien. Mais un virage placé avant ou après un « avancer » change tout.', 'Teste tous les programmes proposés : il n\'y en a qu\'un qui convient.'),
    retenir('l\'ordre des blocs compte ; on vérifie un programme en l\'exécutant depuis la case de départ.'));
}

/* =====================================================================
   3. Programme de calcul en blocs : entrée, opérations, sortie
   ===================================================================== */
const SYMB = { '+': '+', '−': '−', '×': '×', '÷': '÷' };
export const appl = (v, o) => (o.o === '+' ? v + o.k : o.o === '−' ? v - o.k : o.o === '×' ? v * o.k : v / o.k);
export const inv = o => (o.o === '+' ? op('−', o.k) : o.o === '−' ? op('+', o.k) : o.o === '×' ? op('÷', o.k) : op('×', o.k));
/** valeurs successives : [val, v1, v2…] */
export const chaine = (val, ops) => ops.reduce((a, o) => [...a, appl(a[a.length - 1], o)], [val]);
export const fleches = vs => vs.map(M).join(' → ');
/** tirage d'une chaîne d'opérations qui reste en nombres entiers positifs raisonnables */
export function genChaine(n, d, o = {}) {
  const types = d < 1 ? ['+', '×'] : d < 2 ? ['+', '−', '×'] : ['+', '−', '×', '÷'];
  for (let t = 0; t < 500; t++) {
    const val = o.val ?? ri(2, d < 2 ? 9 : 15); let cur = val; const ops = [], vus = new Set([val]); let ok = true;
    for (let i = 0; i < n && ok; i++) {
      ok = false;
      for (let e = 0; e < 40; e++) {
        const ty = pick(types); if (ops.length && ops[ops.length - 1].o === ty) continue;
        let k;
        if (ty === '+') k = ri(2, 12); else if (ty === '−') { if (cur < 4) continue; k = ri(2, Math.min(10, cur - 1)); } else if (ty === '×') { k = ri(2, d < 2 ? 4 : 6); if (cur * k > 500) continue; } else { const ds = []; for (let x = 2; x < cur; x++) if (cur % x === 0 && x <= 6) ds.push(x); if (!ds.length) continue; k = pick(ds); }
        const o2 = op(ty, k), nx = appl(cur, o2); if (vus.has(nx)) continue; vus.add(nx); cur = nx; ops.push(o2); ok = true; break;
      }
    }
    if (ok && cur !== val && cur <= 999 && cur >= 2) return { val, ops };
  }
  throw new Error('genChaine');
}
/** { val, ops } : que dit le programme ? */
export function F3sortie({ val, ops }) {
  const prog = [entree('nombre', val), ...ops, dire('nombre')], r = run(prog), vs = chaine(val, ops), E = [r.out[0]];
  const rev = chaine(val, [...ops].reverse()).pop(), sansDer = vs[vs.length - 2], sansPrem = chaine(val, ops.slice(1)).pop();
  return numQ({
    html: `On entre le nombre ${M(val)}. Que dit le programme ?`, prog, tpl: 'Il dit {0}', E,
    msg: v => (v[0] === rev ? 'L\'ordre des blocs compte : on exécute de haut en bas, dans l\'ordre où ils sont écrits.' : v[0] === sansDer ? `Il manque le dernier calcul : « ${tb(ops[ops.length - 1])} ».` : v[0] === sansPrem ? `Il manque le premier calcul : « ${tb(ops[0])} ».` : ''),
    hint: `Le nombre vaut ${M(val)} au départ. Exécute les blocs de haut en bas : après « ${tb(ops[0])} », il vaut ${M(vs[1])} ; continue jusqu'au bloc « dire le nombre ».`,
    solution: `On suit le nombre bloc par bloc :${tableau(r)}Le programme dit ${M(E[0])}.`,
    verify: e => exec(prog).out[0] === e[0] && e[0] === vs[vs.length - 1],
  });
}
/** { val, ops, faux : [ops, ops], iBon, ordre } : quel programme dit G quand on entre val ? */
export function F3choix({ val, ops, autres, ordre }) {
  const progs = [ops, ...autres], G = chaine(val, ops).pop();
  const { opts, good, ordre: o2 } = optsProgs(progs, 0, { ordre });
  const par = {}; o2.forEach((i, k) => { par[LETTRES[k]] = i; });
  const sortie = L => chaine(val, progs[par[L]]);
  return choiceQ({
    html: `On entre le nombre ${M(val)}. Lequel de ces programmes dit ${M(G)} ?`, visual: '', opts, keep: true, good, texte: `Programme ${good}`,
    msg: c => `Le programme ${c} dit ${M(sortie(c).pop())} quand on entre ${M(val)}, pas ${M(G)}.`,
    hint: `Entre ${M(val)} dans chaque programme et exécute ses blocs de haut en bas. Tu cherches celui qui dit ${M(G)}.`,
    solution: `On entre ${M(val)} dans chaque programme :<br>${LETTRES.slice(0, progs.length).map(L => `Programme ${L} : ${fleches(sortie(L))} ${par[L] === 0 ? '✔' : '✘'}`).join('<br>')}<br>Seul le programme ${good} dit ${M(G)}.`,
    verify: e => { const ok = L => exec([entree('nombre', val), ...progs[par[L]], dire('nombre')]).out[0] === G; return ok(e) && LETTRES.slice(0, progs.length).filter(ok).length === 1; },
  });
}
/** { val, ops } : remonter le programme */
export function F3inverse({ val, ops }) {
  const vs = chaine(val, ops), G = vs[vs.length - 1];
  const prog = [entree('nombre', null), ...ops, dire('nombre')];
  const etapes = []; let cur = G;
  for (let i = ops.length - 1; i >= 0; i--) { const avant = vs[i]; etapes.push(`« ${tb(ops[i])} » se défait avec « ${tb(inv(ops[i]))} » : ${M(cur)} ${SYMB[inv(ops[i]).o]} ${M(ops[i].k)} = ${M(avant)}`); cur = avant; }
  const dernier = ops[ops.length - 1];
  return numQ({
    html: `Le programme dit ${M(G)}. Quel nombre a-t-on entré ?`, visual: progSvg(prog), tpl: 'On a entré {0}', E: [val],
    msg: v => (v[0] === chaine(G, ops).pop() ? 'Tu as refait les mêmes opérations. Pour remonter, il faut faire les opérations inverses, en partant du dernier bloc.' : v[0] === vs[vs.length - 2] ? 'Il faut encore défaire le premier bloc.' : ''),
    hint: `Pour remonter le programme, pars de ${M(G)} et défais les blocs en commençant par le dernier : « ${tb(dernier)} » se défait avec « ${tb(inv(dernier))} ».`,
    solution: `On remonte le programme, du dernier bloc au premier :<br>${etapes.join('<br>')}<br>Vérification en descendant : ${fleches(vs)}.`,
    verify: e => exec([entree('nombre', e[0]), ...ops, dire('nombre')]).out[0] === G,
  });
}
export function L3(d) {
  const f = pick(d < 1 ? ['sortie'] : d < 3 ? ['sortie', 'choix'] : ['sortie', 'choix', 'inverse']);
  const n = d < 1 ? 2 : d < 2 ? 3 : d < 4 ? 3 : 4;
  const { val, ops } = genChaine(n, d);
  if (f === 'sortie') return F3sortie({ val, ops });
  if (f === 'inverse') return F3inverse({ val, ops });
  const G = chaine(val, ops).pop();
  for (let t = 0; t < 300; t++) {
    const autres = [];
    const r1 = shuffle([...ops]); if (r1.map(o => o.o + o.k).join() !== ops.map(o => o.o + o.k).join() && chaine(val, r1).pop() !== G) autres.push(r1);
    const m = ri(0, ops.length - 1); const k = ops[m].k + pick([-1, 1, 2]);
    if (k >= 2) { const r2 = ops.map((o, i) => (i === m ? op(o.o, k) : o)); const x = chaine(val, r2).pop(); if (x !== G && x > 0 && Number.isInteger(x)) autres.push(r2); }
    const r3 = ops.map(o => (o.o === '+' || o.o === '−' ? op(o.o === '+' ? '−' : '+', o.k) : o));
    if (r3.some((o, i) => o.o !== ops[i].o)) { const x = chaine(val, r3).pop(); if (x !== G && x > 0 && Number.isInteger(x)) autres.push(r3); }
    const uniq = []; for (const a of autres) if (!uniq.some(b => cleP(b) === cleP(a))) uniq.push(a);
    if (uniq.length >= 2) return F3choix({ val, ops, autres: uniq.slice(0, 2) });
  }
  return F3sortie({ val, ops });
}
const C3a = { val: 4, ops: [op('×', 3), op('+', 5)] };
const C3b = { val: 6, ops: [op('+', 4), op('×', 2), op('−', 3)] };
const C3c = { val: 5, ops: [op('×', 3), op('−', 4)], autres: [[op('−', 4), op('×', 3)], [op('×', 3), op('+', 4)]], ordre: [1, 0, 2] };
const C3d = { val: 4, ops: [op('+', 5), op('×', 3), op('−', 2)] };
export function C3() {
  return cours('3. Un programme de calcul en blocs',
    'Un programme peut calculer : il <b>reçoit un nombre</b> (l\'entrée), lui fait subir des opérations, puis <b>le dit</b> (la sortie).',
    cols(def('Le bloc violet donne le nombre de départ (<b>entrée</b>). Les blocs verts le transforment, l\'un après l\'autre, de haut en bas. Le bloc rose <b>« dire le nombre »</b> affiche le résultat (<b>sortie</b>).'),
      progSvg([entree('nombre', 5), op('×', 2), op('+', 1), dire('nombre')], { echelle: 1 })),
    meth('Écris le nombre d\'entrée.', 'Exécute les blocs verts <b>de haut en bas</b>, en écrivant le nombre après chacun (5 → 10 → 11).', 'Le résultat du dernier bloc est ce que dit le programme.'),
    exQ(F3sortie(C3a)), exQ(F3sortie(C3b)), exQ(F3choix(C3c)), exQ(F3inverse(C3d)),
    warn('Le nombre change à chaque bloc : le bloc suivant travaille sur le <b>nouveau</b> nombre, pas sur le nombre d\'entrée.', 'Multiplier puis ajouter n\'est pas ajouter puis multiplier : l\'ordre compte.', 'Pour remonter un programme, on défait <b>le dernier bloc en premier</b>, avec l\'opération inverse.'),
    retenir('on exécute les blocs dans l\'ordre ; pour retrouver l\'entrée, on remonte avec les opérations inverses, du dernier bloc au premier.'));
}

/* =====================================================================
   4. La boucle « répéter n fois »
   ===================================================================== */
const COTES = { 3: 'un triangle équilatéral', 4: 'un carré', 5: 'un pentagone régulier', 6: 'un hexagone régulier', 8: 'un octogone régulier', 10: 'un décagone régulier', 12: 'un dodécagone régulier' };
const OUVERTE = 'une figure qui ne se referme pas';
/** G = { nx, ny, st, prog } avec une boucle : case d'arrivée */
export function F4fin(G) {
  const { st, prog } = G, r = run(prog, st), E = [r.x, r.y];
  const iB = prog.findIndex(b => b.t === 'rep'), B = prog[iB], n = B.n;
  const alt = m => run(prog.map(b => (b.t === 'rep' ? { ...b, n: m } : b)), st);
  const moins = alt(n - 1), plus = alt(n + 1);
  const corps = B.body.map(b => `« ${tb(b)} »`).join(' puis ');
  return numQ({
    html: `${depart(st)} Où arrive-t-il après ce programme ?`,
    visual: dual(grilleDe(G), progSvg(prog)),
    after: dual(grilleDe(G, { fin: finDe(r), trace: r.path }), progSvg(prog)),
    tpl: 'case ({0} ; {1})', labels: ['colonne', 'ligne'], E,
    msg: v => (v[0] === moins.x && v[1] === moins.y ? `Le bloc « répéter ${n} fois » refait ses blocs ${n} fois : tu en as fait un de moins.` : v[0] === plus.x && v[1] === plus.y ? `Le bloc « répéter ${n} fois » refait ses blocs ${n} fois, pas plus : tu en as fait un de trop.` : ''),
    hint: `Le bloc « répéter ${n} fois » exécute ${n} fois de suite : ${corps}. Fais un tour, note la case et la direction du lutin, puis recommence le tour depuis ce nouvel état.${iB > 0 ? ` N'oublie pas les blocs placés avant la boucle.` : ''}`,
    solution: `Le bloc « répéter ${n} fois » refait ses blocs à chaque tour :${tableau(r)}Il arrive dans la case (${r.x} ; ${r.y}).`,
    verify: e => { const w = exec(prog, st); return w.x === e[0] && w.y === e[1]; },
  });
}
/** { prog } : nombre total de cases parcourues */
export function F4total({ prog }) {
  const r = run(prog, { x: 1, y: 1, hd: 0 });
  const B = prog.find(b => b.t === 'rep'), n = B.n, parTour = B.body.filter(b => b.t === 'av').reduce((a, b) => a + b.n, 0);
  const hors = prog.filter(b => b.t === 'av').reduce((a, b) => a + b.n, 0);
  const E = [n * parTour + hors];
  return numQ({
    html: 'Combien de cases le lutin parcourt-il en tout pendant ce programme ?', prog, tpl: '{0} cases', E,
    msg: v => (v[0] === (n - 1) * parTour + hors ? `Le bloc « répéter » fait ${n} tours, pas ${n - 1}.` : v[0] === (n + 1) * parTour + hors ? `Le bloc « répéter » fait ${n} tours, pas ${n + 1}.` : v[0] === parTour + hors ? `Tu n'as compté qu'un seul tour : la boucle en fait ${n}.` : ''),
    hint: `Compte d'abord les cases d'<b>un</b> tour de la boucle (blocs « avancer » à l'intérieur du « répéter ${n} fois »), puis multiplie par ${n}.${hors ? ' Ajoute enfin les cases des blocs « avancer » placés hors de la boucle.' : ''}`,
    solution: `Un tour de boucle : ${B.body.filter(b => b.t === 'av').map(b => b.n).join(' + ')} = ${parTour} case${parTour > 1 ? 's' : ''}.<br>${n} tours : ${n} × ${parTour} = ${n * parTour}.${hors ? `<br>Blocs hors de la boucle : ${hors} case${hors > 1 ? 's' : ''}. Total : ${n * parTour} + ${hors} = ${E[0]}.` : ''}`,
    verify: e => { const t = exec(prog, { x: 1, y: 1 }).trail; let s = 0; for (let i = 1; i < t.length; i++) s += Math.abs(t[i][0] - t[i - 1][0]) + Math.abs(t[i][1] - t[i - 1][1]); return s === e[0]; },
  });
}
const progFig = (k, a, ang) => [rep(k, [av(a), rot(ang)])];
const nbCotes = (p) => { const t = exec(p, { x: 0, y: 0 }).trail; const fermee = Math.abs(t[t.length - 1][0] - t[0][0]) < 1e-6 && Math.abs(t[t.length - 1][1] - t[0][1]) < 1e-6; return fermee ? t.length - 1 : 0; };
/** { k, a, ang, noms : [nombres de côtés proposés] } : quelle figure ? */
export function F4figure({ k, a, ang, noms, ordre }) {
  const prog = progFig(k, a, ang), r = run(prog, { x: 0, y: 0 }), ferme = k * ang === 360;
  const bon = ferme ? String(k) : 'o', lab = n => (n === 'o' ? OUVERTE : COTES[n]);
  const opts = noms.map(n => ({ v: String(n), l: lab(n) }));
  return choiceQ({
    html: 'Le lutin dessine en avançant et en tournant. Quelle figure obtient-il avec ce programme ?', prog, opts: ordre ? ordre.map(i => opts[i]) : opts, keep: !!ordre, good: bon, texte: lab(bon),
    after: dual(figure(r.path, { box: 150 }), progSvg(prog)), replace: true,
    msg: c => (c === 'o' ? 'Le lutin a fait un tour complet (360°) : la figure se referme.' : !ferme ? `Le lutin tourne de ${ang}° à chaque tour ; après ${k} tours, il n'a tourné que de ${k * ang}° : la figure n'est pas refermée.` : `Chaque tour de boucle trace un côté : ici ${k} côtés.`),
    hint: `Chaque tour du bloc « répéter ${k} fois » trace un côté (« avancer de ${a} ») puis fait tourner le lutin de ${ang}°. Compte les côtés tracés et regarde si le lutin revient à son point de départ (un tour complet fait 360°).`,
    solution: `Chaque tour : le lutin avance de ${a} (un côté) puis tourne de ${ang}°.<br>${k} tours : ${k} côtés et ${k} × ${ang} = ${k * ang}° de rotation${ferme ? ', soit un tour complet : la figure se referme.' : ` : ce n'est pas un tour complet (360°), la figure ne se referme pas.`}<br>${ferme ? `Il trace ${COTES[k]}.` : `Il trace ${k} côtés d'un polygone qu'il ne finit pas.`}`,
    verify: e => { const c = nbCotes(prog); return e === 'o' ? c === 0 : c === Number(e) && !!COTES[c]; },
  });
}
/** { k, a } : quel angle pour tracer la figure ? */
export function F4angle({ k, a }) {
  const ang = 360 / k, prog = progFig(k, a, { txt: '?' }), bon = progFig(k, a, ang), r = run(bon, { x: 0, y: 0 });
  const nom = COTES[k];
  return numQ({
    html: `Ce programme doit tracer ${nom}. Quel angle faut-il écrire à la place du point d'interrogation ?`, prog, tpl: 'tourner de {0} °', E: [ang],
    after: dual(figure(r.path, { box: 150 }), progSvg(bon)), replace: true,
    msg: v => (v[0] === 180 - ang ? `${v[0]}° est l'angle de la figure. Le lutin, lui, tourne de l'angle « extérieur » : un tour complet (360°) partagé entre les ${k} sommets.` : v[0] === 360 ? 'Un tour complet de 360° se fait en tout, pas à chaque sommet : il faut le partager entre les côtés.' : ''),
    hint: `Le lutin trace ${k} côtés, un par tour du « répéter ${k} fois ». À la fin, il doit avoir fait exactement un tour complet, soit 360°, en ${k} virages identiques.`,
    solution: `${k} virages identiques doivent faire un tour complet : 360° ÷ ${k} = ${ang}°.<br>Vérification : ${k} × ${ang} = 360°.`,
    verify: e => { const p = progFig(k, a, e[0]); return nbCotes(p) === k && Math.abs(exec(p, { x: 0, y: 0 }).tourne - 360) < 1e-9; },
  });
}
function genBoucle(d) {
  const nx = d < 2 ? 5 : d < 4 ? 6 : 7;
  for (let t = 0; t < 2000; t++) {
    const n = d < 1 ? ri(2, 4) : ri(2, 5), body = [av(ri(1, d < 2 ? 2 : 3))];
    if (d >= 1) body.push(chance(0.5) ? tD() : tG());
    if (d >= 3 && chance(0.5)) body.push(av(ri(1, 2)));
    const pre = d >= 2 ? (chance(0.5) ? [av(ri(1, 2))] : [chance(0.5) ? tD() : tG()]) : [];
    const post = d >= 3 && chance(0.6) ? [av(ri(1, 2))] : [];
    const prog = [...pre, rep(n, body), ...post], st = { x: ri(1, nx), y: ri(1, nx), hd: d < 1 ? 0 : pick([0, 90, 180, 270]) };
    const r = run(prog, st);
    if (!dedans(r, nx, nx) || (r.x === st.x && r.y === st.y)) continue;
    return F4fin({ nx, ny: nx, st, prog });
  }
  throw new Error('genBoucle');
}
export function L4(d) {
  const f = pick(d < 1 ? ['fin', 'total'] : d < 2 ? ['fin', 'total', 'figure'] : ['fin', 'total', 'figure', 'angle']);
  if (f === 'fin') return genBoucle(d);
  if (f === 'total') {
    const n = ri(3, d < 2 ? 6 : 9), body = [av(ri(1, 4)), chance(0.5) ? tD() : tG()];
    if (d >= 2) body.push(av(ri(1, 3)));
    const prog = d >= 3 && chance(0.5) ? [av(ri(1, 5)), rep(n, body)] : [rep(n, body)];
    return F4total({ prog });
  }
  if (f === 'figure') {
    const ks = d < 2 ? [3, 4] : d < 3 ? [3, 4, 6] : [3, 4, 5, 6, 8], k = pick(ks), a = ri(2, 6);
    if (d >= 3 && chance(0.35)) {
      const ang = pick([60, 72, 90, 45]), kk = ri(3, 360 / ang - 1);
      const noms = [...new Set([...(360 / ang <= 8 && COTES[360 / ang] ? [360 / ang] : [4]), 3, 4, 6])].filter(x => x !== 'o').slice(0, 3);
      return F4figure({ k: kk, a, ang, noms: shuffle(['o', ...noms]) });
    }
    const autres = shuffle(ks.filter(x => x !== k)).slice(0, d < 2 ? 1 : 2);
    const noms = shuffle([k, ...autres]);
    if (d >= 3) noms.push('o');
    return F4figure({ k, a, ang: 360 / k, noms: shuffle(noms) });
  }
  return F4angle({ k: pick(d < 3 ? [3, 4, 6] : [3, 4, 5, 6, 8, 10, 12]), a: ri(2, 6) });
}
const G4a = { nx: 5, ny: 5, st: { x: 1, y: 1, hd: 0 }, prog: [rep(3, [av(1), tG(), av(1), tD()])] };
const G4b = { prog: [av(2), rep(4, [av(3), tD(), av(1)])] };
export function C4() {
  return cours('4. La boucle « répéter n fois »',
    'Quand une suite de blocs se répète, on ne la recopie pas : on la place dans une <b>boucle</b>. Le bloc « répéter n fois » exécute n fois de suite tous les blocs qu\'il contient.',
    cols(def('<b>Répéter 4 fois [avancer de 2 ; tourner à droite]</b> revient à écrire ces deux blocs 4 fois de suite. Un « tour » de boucle est une exécution complète des blocs placés à l\'intérieur.'),
      dual(progSvg([rep(3, [av(2), rot(120)])]), figure(run([rep(3, [av(2), rot(120)])], { x: 0, y: 0 }).path, { box: 120 }))),
    meth('Repère les blocs <b>dans</b> la boucle (décalés vers la droite) et ceux avant ou après.', 'Fais le premier tour en notant l\'état du lutin, puis recommence <b>depuis ce nouvel état</b>, n fois.', 'Pour une figure : tourner de 360° ÷ (nombre de côtés) à chaque sommet.'),
    exQ(F4fin(G4a)), exQ(F4total(G4b)), exQ(F4figure({ k: 4, a: 3, ang: 90, noms: [3, 4, 6, 'o'], ordre: [0, 1, 2, 3] })), exQ(F4figure({ k: 4, a: 3, ang: 60, noms: [3, 4, 6, 'o'], ordre: [0, 1, 2, 3] })), exQ(F4angle({ k: 5, a: 3 })),
    warn('Un tour de boucle ≠ la boucle entière : le bloc « répéter 3 fois » refait <b>3</b> tours, pas 2 ni 4.', 'On ne repart pas du départ à chaque tour : le tour suivant commence là où le précédent s\'est arrêté.', 'Pour tracer un polygone régulier, l\'angle de rotation n\'est pas l\'angle de la figure : triangle équilatéral → 120°, carré → 90°.'),
    retenir('« répéter n fois » refait n fois les blocs qu\'il contient ; une figure régulière à n côtés se trace avec « répéter n fois [avancer ; tourner de 360 ÷ n °] ».'));
}

// Théorème de Pythagore (4e) : 12 niveaux, une figure SVG générée pour chaque exercice.
// d = série de réussites en cours : la figure tourne (d ≥ 1), les noms des points changent (d ≥ 2),
// les longueurs deviennent décimales (d ≥ 3).
// Vérifications indépendantes : `value` est recalculé avec Math.hypot / Math.sqrt à partir des coordonnées
// des sommets (ou par une autre formule), `verify` contrôle l'arrondi demandé et, pour la réciproque,
// l'angle droit par un produit scalaire calculé sur les coordonnées.
import { ri, pick, shuffle, chance, prenom } from '../../engine/util/rand.js';
import { M, R } from '../../engine/util/fmt.js';
import { approx, r6 } from '../../engine/util/arith.js';
import { choiceCheck, numsCheck } from '../../engine/answers/checks.js';
import { figure, carres, repere, pave, decorMur, decorSol, zoomArrondi } from './draw.js';

const big = s => `<div class="big">${s}</div>`;
const sq = s => `${s}<sup>2</sup>`;
const sqn = x => sq(M(x));
const s2 = x => r6(x * x);
const L = (x, u = 'cm') => `${M(x)} ${u}`;
const t10 = x => Math.round(x * 10);
const r1 = x => Math.round(x * 10) / 10;
const trunc2 = x => Math.floor(x * 100) / 100;
const ROUND = 'arrondie au dixième';

/* ---------- triangles : noms, orientation ---------- */
const SETS = ['ABC', 'DEF', 'EFG', 'IJK', 'MNP', 'RST', 'UVW', 'KLM', 'HIJ', 'PQR', 'GHI', 'LMN', 'XYZ', 'BCD'];
/** noms des sommets : R = sommet de l'angle droit, P et Q les deux autres */
function names(d) {
  const n = d < 2 ? 'ABC' : pick(SETS);
  const i = d < 1 ? 0 : ri(0, 2), o = shuffle([0, 1, 2].filter(k => k !== i));
  return { n, R: n[i], P: n[o[0]], Q: n[o[1]] };
}
/** segment XY écrit dans l'ordre du nom du triangle */
const seg = (n, X, Y) => (n.indexOf(X) < n.indexOf(Y) ? X + Y : Y + X);
function sidesOf(T) { return { a: seg(T.n, T.R, T.P), b: seg(T.n, T.R, T.Q), c: seg(T.n, T.P, T.Q) }; }
/** orientation de la figure selon d */
function orient(d) {
  if (d < 1) return { rot: 0, flip: false };
  if (d < 2) return { rot: pick([0, 90, 180, 270]) + ri(-8, 8), flip: chance(0.5) };
  return { rot: ri(0, 359), flip: chance(0.5) };
}
const rotate = ([x, y], deg) => { const t = deg * Math.PI / 180; return [x * Math.cos(t) - y * Math.sin(t), x * Math.sin(t) + y * Math.cos(t)]; };
/** sommets d'un triangle rectangle : [RP] = a, [RQ] = b, tournés de rot degrés */
function place(T, a, b, rot) {
  const pts = {};
  const raw = { [T.R]: [0, 0], [T.P]: [a, 0], [T.Q]: [0, b] };
  for (const k of T.n) pts[k] = rotate(raw[k], rot);
  return pts;
}
const dist = (p, q) => Math.hypot(p[0] - q[0], p[1] - q[1]);
/** cosinus de l'angle en V calculé sur les coordonnées (indépendant de Pythagore) */
function cosAt(pts, V, A, B) {
  const u = [pts[A][0] - pts[V][0], pts[A][1] - pts[V][1]], v = [pts[B][0] - pts[V][0], pts[B][1] - pts[V][1]];
  return (u[0] * v[0] + u[1] * v[1]) / (Math.hypot(...u) * Math.hypot(...v));
}

/**
 * Figure d'un triangle rectangle. lab : {a, b, c} textes des côtés [RP], [RQ], [PQ] (null : rien, '?' : cherché).
 * o.squares : carrés construits sur les côtés (correction)
 */
function triFig(T, pts, o = {}) {
  const S = sidesOf(T), lab = o.lab || {};
  const sides = [];
  [['a', T.Q], ['b', T.P], ['c', T.R]].forEach(([k, away]) => {
    if (lab[k]) sides.push({ k: S[k], t: lab[k], unk: lab[k] === '?', away });
  });
  return figure({
    pts, polys: [[...T.n]], rights: o.noRight ? [] : [[T.R, T.P, T.Q]], sides: o.squares ? [] : sides, flip: o.flip,
    squares: o.squares ? [['a', T.Q], ['b', T.P], ['c', T.R]].map(([k, away]) => ({ k: S[k], t: o.squares[k], away })) : undefined,
    size: o.squares ? [300, 260] : undefined,
    aria: `triangle ${T.n}${o.noRight ? '' : ' rectangle en ' + T.R}`, maxw: o.maxw,
  });
}

/* ---------- vérification d'une longueur (entière ou arrondie au dixième) ---------- */
/** message « presque juste » pour une longueur x quand on attend E (valeur exacte ex) */
function lenMsg(x, E, o) {
  const ex = o.exact;
  if (x === null || x === undefined || !isFinite(x)) return '';
  const tenth = Math.abs(x * 10 - Math.round(x * 10)) < 1e-9;
  if (o.round && tenth && Math.abs(x - ex) < 0.1 + 1e-9 && !approx(x, E)) return "Presque ! Vérifie l'arrondi au dixième : regarde le chiffre des <b>centièmes</b> (5 ou plus : on arrondit au-dessus).";
  if (o.round && !tenth && Math.abs(x - ex) < 0.1) return 'Presque ! Il faut arrondir au <b>dixième</b> : un seul chiffre après la virgule.';
  if (o.round && approx(x, Math.round(ex)) && Math.abs(x - ex) < 1) return "Presque ! On demande un arrondi au <b>dixième</b> (un chiffre après la virgule), pas à l'unité.";
  if (Math.abs(x - ex * ex) < (o.round ? 0.6 : 1e-6)) return `Tu as trouvé le <b>carré</b> de la longueur. Il reste à prendre la <b>racine carrée</b> !`;
  if (o.known) {
    const [p, q] = o.known;
    if (o.mode === 'leg') {
      if (Math.abs(x - Math.hypot(p, q)) < 0.1) return "Tu as <b>additionné</b> les carrés. Mais le côté cherché n'est pas l'hypoténuse : il faut <b>soustraire</b> (hypoténuse² − autre côté²).";
      if (Math.abs(x - (p * p + q * q)) < 0.6) return "Tu as additionné les carrés et oublié la racine. Ici on cherche un côté de l'angle droit : il faut <b>soustraire</b>, puis prendre la racine carrée.";
    }
    if (o.mode === 'hyp' && Math.abs(x - Math.sqrt(Math.abs(p * p - q * q))) < 0.1) return "Tu as <b>soustrait</b> les carrés. Mais on cherche l'hypoténuse : on <b>additionne</b> les carrés des deux autres côtés.";
    if (approx(x, p + q) || approx(x, Math.abs(p - q))) return "On ne calcule pas avec les longueurs elles-mêmes, mais avec leurs <b>carrés</b>.";
  }
  return '';
}
/** check pour une ou plusieurs longueurs ; infos[i] = {exact, round, mode, known} */
function lensCheck(E, infos) {
  const fn = v => {
    const bad = E.map((e, i) => (approx(v[i], e) ? -1 : i)).filter(i => i >= 0);
    if (!bad.length) return { ok: true };
    let msg = lenMsg(v[bad[0]], E[bad[0]], infos[bad[0]] || {});
    if (E.length > 1 && bad.length === 1 && bad[0] === E.length - 1) msg = `La première étape est juste ! ${msg || 'Vérifie la deuxième.'}`;
    return { ok: false, bad, msg };
  };
  fn.expected = E;
  return fn;
}
/** E est-il l'arrondi au dixième de la longueur `ex` (ex non ambigu), ou ex lui-même s'il est entier ? */
function okRound(E, ex, round) {
  if (!round) return Math.abs(E - ex) < 1e-9;
  const k = ex * 10, frac = k - Math.floor(k);
  return Math.abs(E * 10 - Math.round(E * 10)) < 1e-9 && Math.abs(E - ex) <= 0.05 + 1e-9 && Math.abs(frac - 0.5) > 1e-7;
}

/* ---------- calculs exacts (en dixièmes entiers) ---------- */
/** hypoténuse à partir des côtés de l'angle droit : {E, ex, exact} */
function hypOf(a, b) { const s = t10(a) ** 2 + t10(b) ** 2, r = Math.sqrt(s); const exact = Number.isInteger(r); return { E: exact ? r / 10 : Math.round(r) / 10, ex: r / 10, exact, S: s / 100 }; }
/** côté de l'angle droit à partir de l'hypoténuse c et de l'autre côté a */
function legOf(c, a) { const s = t10(c) ** 2 - t10(a) ** 2, r = Math.sqrt(s); const exact = Number.isInteger(r); return { E: exact ? r / 10 : Math.round(r) / 10, ex: r / 10, exact, S: s / 100 }; }
/** arrondi au dixième écrit avec son chiffre des dixièmes : 17,0 */
const D1 = x => x.toFixed(1).replace('.', ',');
const approxTxt = (x, E, u) => `${M(trunc2(x))}…, donc ≈ <b>${D1(E)} ${u}</b> (arrondi au dixième)`;

/** rédaction : calcul de l'hypoténuse */
function solHyp(T, a, b, H, u = 'cm', intro = '') {
  const S = sidesOf(T);
  return `${intro}Le triangle ${T.n} est rectangle en ${T.R} : son hypoténuse est [${S.c}].<br>D'après le théorème de Pythagore : ${sq(S.c)} = ${sq(S.a)} + ${sq(S.b)}<br>${sq(S.c)} = ${sqn(a)} + ${sqn(b)} = ${M(s2(a))} + ${M(s2(b))} = ${M(H.S)}<br>${S.c} = ${R(M(H.S))} ${H.exact ? `= <b>${L(H.E, u)}</b>` : `≈ ${approxTxt(H.ex, H.E, u)}`}`;
}
/** rédaction : calcul d'un côté de l'angle droit ([RQ] cherché, hypoténuse c et [RP] = a connus) */
function solLeg(T, c, a, G, u = 'cm', intro = '') {
  const S = sidesOf(T);
  return `${intro}Le triangle ${T.n} est rectangle en ${T.R} : son hypoténuse est [${S.c}].<br>D'après le théorème de Pythagore : ${sq(S.c)} = ${sq(S.a)} + ${sq(S.b)}, donc ${sq(S.b)} = ${sq(S.c)} − ${sq(S.a)}<br>${sq(S.b)} = ${sqn(c)} − ${sqn(a)} = ${M(s2(c))} − ${M(s2(a))} = ${M(G.S)}<br>${S.b} = ${R(M(G.S))} ${G.exact ? `= <b>${L(G.E, u)}</b>` : `≈ ${approxTxt(G.ex, G.E, u)}`}`;
}

/* ---------- triplets pythagoriciens ---------- */
const TRIP = [[3, 4, 5], [6, 8, 10], [5, 12, 13], [8, 15, 17], [7, 24, 25], [20, 21, 29], [12, 16, 20], [9, 12, 15], [12, 35, 37]];
function triplet(d) {
  if (d < 1) return pick([[3, 4, 5], [6, 8, 10], [9, 12, 15]]);
  if (d < 2) { const k = ri(1, 4); return pick([[3, 4, 5], [5, 12, 13]]).map(x => x * k); }
  if (d < 3) { const t = pick(TRIP.slice(0, 6)), k = t[2] > 20 ? 1 : ri(1, 3); return t.map(x => x * k); }
  if (chance(0.5)) return pick(TRIP).slice();
  // triplets décimaux
  const t = pick([[3, 4, 5], [5, 12, 13], [6, 8, 10], [8, 15, 17]]), k = pick([0.1, 0.5, 0.3, 1.5, 0.2]);
  return t.map(x => r6(x * k));
}

/* ======================================================================
   1. Repérer l'hypoténuse
   ====================================================================== */
function L1(d) {
  const T = names(d), S = sidesOf(T), O = orient(d);
  let a = ri(3, 9), b = ri(3, 9); while (Math.max(a, b) / Math.min(a, b) > 2.6) b = ri(3, 9);
  const pts = place(T, a, b, O.rot);
  const visual = triFig(T, pts, { flip: O.flip });
  // vérification : angle droit trouvé par produit scalaire, hypoténuse = côté opposé = plus long côté
  const cR = cosAt(pts, T.R, T.P, T.Q);
  const longest = [S.a, S.b, S.c].sort((x, y) => dist(pts[y[0]], pts[y[1]]) - dist(pts[x[0]], pts[x[1]]))[0];
  const all = [...T.n];
  if (d >= 3 && chance(0.5)) {
    const sd = [all[0] + all[1], all[0] + all[2], all[1] + all[2]];
    const pairs = [[sd[0], sd[1]], [sd[0], sd[2]], [sd[1], sd[2]]];
    const good = pairs.find(p => !p.includes(S.c));
    const opts = pairs.map(p => ({ v: p.join('-'), l: `[${p[0]}] et [${p[1]}]` }));
    return { type: 'choice', opts, check: choiceCheck(good.join('-'), { msg: () => "L'hypoténuse n'est pas un côté de l'angle droit : les côtés de l'angle droit sont ceux qui <b>forment</b> l'angle droit (ils partent du sommet codé)." }),
      html: `Voici un triangle rectangle. Quels sont les <b>côtés de l'angle droit</b> ?`, visual,
      hint: `Repère le petit carré qui code l'angle droit. Les deux côtés qui partent de ce sommet sont les côtés de l'angle droit.`,
      solution: `L'angle droit est en ${T.R}. Les côtés de l'angle droit sont [${S.a}] et [${S.b}] ; l'hypoténuse est [${S.c}].`,
      verify: E => Math.abs(cR) < 1e-9 && !E.split('-').includes(longest) && longest === S.c };
  }
  const opts = [S.a, S.b, S.c].sort().map(s => ({ v: s, l: `[${s}]` }));
  const txt = d < 3 ? `Le triangle ${T.n} est rectangle en ${T.R}. Quelle est son <b>hypoténuse</b> ?` : `Voici un triangle rectangle. Quelle est son <b>hypoténuse</b> ?`;
  return { type: 'choice', opts, check: choiceCheck(S.c, { msg: () => `Ce côté touche l'angle droit : c'est un <b>côté de l'angle droit</b>. L'hypoténuse est <b>en face</b> de l'angle droit.` }),
    html: txt, visual,
    hint: `L'hypoténuse est le côté <b>opposé</b> à l'angle droit (celui qui ne touche pas le petit carré). C'est aussi le plus long côté.`,
    solution: `L'angle droit est en ${T.R}. Le côté opposé à ${T.R} est [${S.c}] : c'est l'hypoténuse, le plus long des trois côtés.`,
    verify: E => Math.abs(cR) < 1e-9 && E === longest };
}
function C1() {
  const T = { n: 'ABC', R: 'A', P: 'B', Q: 'C' }, U = { n: 'RST', R: 'S', P: 'R', Q: 'T' };
  return `<h2>1. Le triangle rectangle et son hypoténuse</h2>
<p class="intro">Avant d'utiliser le théorème de Pythagore, il faut savoir « lire » un triangle rectangle : où est l'angle droit, et quel côté est l'hypoténuse.</p>
<div class="def">Un triangle <b>rectangle</b> a un angle droit, codé par un petit carré.<br>• Les deux côtés qui forment l'angle droit sont les <b>côtés de l'angle droit</b>.<br>• Le côté <b>opposé</b> à l'angle droit s'appelle l'<b>hypoténuse</b>. C'est le plus long côté.</div>
<div class="methode"><b>Méthode</b><ol><li>Cherche le petit carré : son sommet est le sommet de l'angle droit.</li><li>Les deux côtés qui <b>partent</b> de ce sommet sont les côtés de l'angle droit.</li><li>Le troisième côté, qui ne touche pas ce sommet, est l'hypoténuse.</li><li>Vérifie : c'est bien le plus long des trois côtés.</li></ol></div>
<div class="cols">${triFig(T, place(T, 5, 3.4, 0), { lab: { c: 'hypoténuse' }, maxw: 320 })}${triFig(U, place(U, 4.2, 3, 125), { lab: { c: 'hypoténuse' }, maxw: 260 })}</div>
<div class="ex"><span class="q">Exemple 1 : ABC est rectangle en A.</span><br>L'angle droit est en A. Les côtés qui partent de A sont [AB] et [AC] : ce sont les côtés de l'angle droit.<br>L'hypoténuse est <b>[BC]</b>, le côté qui ne passe pas par A.</div>
<div class="ex"><span class="q">Exemple 2 : une figure tournée, RST rectangle en S.</span><br>Le petit carré est en S, même si le triangle est « penché ».<br>Côtés de l'angle droit : [RS] et [ST]. Hypoténuse : <b>[RT]</b>.<br>Astuce : l'hypoténuse s'écrit avec les deux lettres qui ne sont <b>pas</b> le sommet de l'angle droit.</div>
<div class="warn">⚠️ L'hypoténuse n'est pas toujours « en bas » ou « en biais » : la figure peut être tournée. Cherche d'abord le codage de l'angle droit.<br>⚠️ L'hypoténuse ne touche jamais le petit carré : si ton côté passe par le sommet de l'angle droit, c'est un côté de l'angle droit.<br>⚠️ Si on te demande les <b>côtés de l'angle droit</b>, réponds par les deux côtés qui partent du petit carré, pas par l'hypoténuse.</div>
<div class="retenir">À retenir : l'hypoténuse est le côté en face de l'angle droit ; c'est le plus long côté du triangle rectangle.</div>`;
}

/* ======================================================================
   2. Carrés et racines carrées
   ====================================================================== */
function L2(d) {
  const v = d < 1 ? ri(0, 1) : d < 2 ? ri(0, 2) : d < 3 ? ri(0, 3) : ri(1, 5);
  const top = d < 2 ? 12 : 20;
  if (v === 0) {
    const n = ri(2, top);
    return { type: 'nums', tpl: `${sqn(n)} = {0}`, check: lensCheck([n * n], [{}]), value: Math.pow(n, 2),
      html: `Calcule le carré :${big(sqn(n))}`, visual: carres([{ c: n, side: String(n), area: '?' }], `carré de côté ${n}`),
      hint: `${sqn(n)} = ${n} × ${n} (et non ${n} × 2).`, solution: `${sqn(n)} = ${n} × ${n} = ${n * n}. C'est l'aire d'un carré de côté ${n}.`,
      verify: E => Math.sqrt(E[0]) === n };
  }
  if (v === 1) {
    const n = ri(2, top), N = n * n;
    return { type: 'nums', tpl: `${R(N)} = {0}`, check: lensCheck([n], [{ exact: n }]), value: Math.sqrt(N),
      html: `Calcule la racine carrée :${big(R(N))}`, visual: carres([{ c: n, side: '?', area: `aire ${N}` }], `carré d'aire ${N}`),
      hint: `Cherche le nombre positif qui, multiplié par lui-même, donne ${N}. C'est le côté d'un carré d'aire ${N}.`,
      solution: `${n} × ${n} = ${N}, donc ${R(N)} = ${n}.`, verify: E => E[0] * E[0] === N && E[0] > 0 };
  }
  if (v === 2) {
    const n = ri(3, 15), N = n * n + ri(1, 2 * n);
    const lo = Math.floor(Math.sqrt(N));
    return { type: 'nums', tpl: `{0} &lt; ${R(N)} &lt; {1}`, labels: ['entier de gauche', 'entier de droite'],
      check: numsCheck([lo, lo + 1], { msg: v => (v[0] * v[0] < N && N < v[1] * v[1] ? "C'est vrai, mais il faut deux entiers <b>consécutifs</b> (qui se suivent)." : '') }), value: Math.ceil(Math.sqrt(N)),
      html: `${R(N)} n'est pas un nombre entier. Entre quels <b>entiers consécutifs</b> se trouve-t-il ?`,
      visual: carres([{ c: lo, side: String(lo), area: String(lo * lo) }, { c: Math.sqrt(N), side: '?', area: String(N) }, { c: lo + 1, side: String(lo + 1), area: String((lo + 1) ** 2) }], 'trois carrés'),
      hint: `Cherche les carrés parfaits qui encadrent ${N} : ${lo}² = ?, ${lo + 1}² = ?`,
      solution: `${sqn(lo)} = ${lo * lo} &lt; ${N} &lt; ${(lo + 1) ** 2} = ${sqn(lo + 1)}, donc ${lo} &lt; ${R(N)} &lt; ${lo + 1}.`,
      verify: E => E[0] * E[0] < N && N < E[1] * E[1] && E[1] === E[0] + 1 };
  }
  if (v === 3 || v === 4) {
    const a = ri(2, 12), b = ri(2, 12), add = v === 3 || a === b;
    const [p, q] = add ? [a, b] : [Math.max(a, b), Math.min(a, b)];
    const X = add ? p * p + q * q : p * p - q * q;
    return { type: 'nums', tpl: `${sqn(p)} ${add ? '+' : '−'} ${sqn(q)} = {0}`, check: lensCheck([X], [{}]), value: add ? Math.hypot(p, q) ** 2 : (p - q) * (p + q),
      html: `Calcule :${big(`${sqn(p)} ${add ? '+' : '−'} ${sqn(q)}`)}`,
      visual: carres([{ c: p, side: String(p), area: '?' }, { c: q, side: String(q), area: '?' }], 'deux carrés'),
      hint: `Calcule d'abord chaque carré (${p} × ${p} et ${q} × ${q}), puis ${add ? 'additionne' : 'soustrais'}.`,
      solution: `${sqn(p)} ${add ? '+' : '−'} ${sqn(q)} = ${p * p} ${add ? '+' : '−'} ${q * q} = ${X}`,
      verify: E => Math.abs(E[0] - (add ? p * p + q * q : p * p - q * q)) < 1e-9 };
  }
  // carré d'un décimal
  let x; do { x = r6(ri(11, 39) / 10); } while (Number.isInteger(x));
  const X = s2(x);
  return { type: 'nums', tpl: `${sqn(x)} = {0}`, keys: { comma: true }, check: lensCheck([X], [{}]), value: Math.pow(x, 2),
    html: `Calcule le carré :${big(sqn(x))}`, visual: carres([{ c: x, side: M(x), area: '?' }], `carré de côté ${M(x)}`),
    hint: `${sqn(x)} = ${M(x)} × ${M(x)}. Calcule ${t10(x)} × ${t10(x)}, puis place la virgule : il y a 2 chiffres après la virgule.`,
    solution: `${sqn(x)} = ${M(x)} × ${M(x)} = ${M(X)} (${t10(x)} × ${t10(x)} = ${t10(x) ** 2}, et deux chiffres après la virgule).`,
    verify: E => Math.abs(E[0] * 100 - t10(x) ** 2) < 1e-6 };
}
function C2() {
  return `<h2>2. Carrés et racines carrées</h2>
<p class="intro">Le théorème de Pythagore parle de <b>carrés</b> de longueurs ; pour revenir à une longueur, on prend une <b>racine carrée</b>. Ce niveau t'entraîne à ces deux calculs.</p>
<div class="def">• Le <b>carré</b> d'un nombre : ${sq('a')} = a × a. C'est l'aire d'un carré de côté a.<br>• La <b>racine carrée</b> d'un nombre positif b est le nombre positif dont le carré est b : ${R(49)} = 7 car ${sqn(7)} = 49. C'est le côté d'un carré d'aire b.</div>
<div class="cols">${carres([{ c: 3, side: '3', area: '9' }, { c: 5, side: '5', area: '25' }], 'carrés de côtés 3 et 5, d\'aires 9 et 25')}<div class="ex">Carrés à connaître : 1, 4, 9, 16, 25, 36, 49, 64, 81, 100, 121, 144, 169, 196, 225, 256, 289, 324, 361, 400 (de ${sqn(1)} à ${sqn(20)}).</div></div>
<div class="methode"><b>Méthode</b><ol><li><b>Carré</b> : multiplie le nombre par lui-même (${sqn(6)} = 6 × 6).</li><li><b>Racine carrée</b> : cherche le nombre positif qui, multiplié par lui-même, donne le nombre.</li><li><b>Encadrer</b> ${R('N')} : trouve les deux carrés parfaits qui se suivent autour de N.</li><li><b>Somme ou différence de carrés</b> : calcule chaque carré d'abord, puis additionne ou soustrais.</li><li><b>Décimal</b> : calcule sans la virgule, puis mets deux fois plus de chiffres après la virgule.</li></ol></div>
<div class="ex"><span class="q">Exemple 1 : ${sqn(13)} et ${R(81)}.</span><br>${sqn(13)} = 13 × 13 = 169.<br>9 × 9 = 81, donc ${R(81)} = 9.</div>
<div class="ex"><span class="q">Exemple 2 : entre quels entiers consécutifs est ${R(50)} ?</span><br>49 &lt; 50 &lt; 64, c'est-à-dire ${sqn(7)} &lt; 50 &lt; ${sqn(8)}, donc 7 &lt; ${R(50)} &lt; 8. (La calculatrice donne ${R(50)} ≈ 7,07.)</div>
${carres([{ c: 7, side: '7', area: '49' }, { c: Math.sqrt(50), side: '?', area: '50' }, { c: 8, side: '8', area: '64' }], 'un carré d\'aire 50 a un côté entre 7 et 8')}
<div class="ex"><span class="q">Exemple 3 : ${sqn(2.4)} et ${sqn(9)} − ${sqn(5)}.</span><br>24 × 24 = 576 et 2,4 a un chiffre après la virgule, donc ${sqn(2.4)} = 5,76 (deux chiffres après la virgule).<br>${sqn(9)} − ${sqn(5)} = 81 − 25 = 56.</div>
<div class="warn">⚠️ ${sqn(6)} = 6 × 6 = 36, pas 6 × 2 = 12.<br>⚠️ ${sqn(3)} + ${sqn(4)} = 9 + 16 = 25, mais (3 + 4)² = 49 : on calcule chaque carré <b>avant</b> d'additionner.<br>⚠️ ${sqn(2.4)} n'est pas 4,16 : on ne met pas au carré « la partie entière puis la partie décimale ».</div>
<div class="retenir">À retenir : carré = nombre × lui-même ; racine carrée = le nombre positif dont le carré est donné.</div>`;
}

/* ======================================================================
   3. Écrire l'égalité de Pythagore
   ====================================================================== */
function L3(d) {
  const T = names(d), S = sidesOf(T), O = orient(d);
  let a = ri(3, 9), b = ri(3, 9); while (Math.max(a, b) / Math.min(a, b) > 2.6) b = ri(3, 9);
  const pts = place(T, a, b, O.rot);
  const len = s => dist(pts[s[0]], pts[s[1]]);
  const mix = (x, y) => (d >= 2 && chance(0.5) ? [y, x] : [x, y]);
  // chaque option : [côté seul, opération, côté, côté, au carré ?]
  let F, good, txt, msg;
  if (d < 3 || chance(0.4)) {
    const [p, q] = mix(S.a, S.b);
    F = { ok: [S.c, '+', p, q, 1], w1: [S.a, '+', S.c, S.b, 1], w2: [S.b, '+', S.a, S.c, 1], nosq: [S.c, '+', p, q, 0] };
    good = 'ok'; txt = `Le triangle ${T.n} est rectangle en ${T.R}. Quelle égalité est vraie ?`;
    msg = c => (c === 'nosq' ? "Il manque les <b>carrés</b> ! Le théorème parle des carrés des longueurs." : "L'hypoténuse doit être <b>seule</b> d'un côté du signe = : c'est le côté opposé à l'angle droit.");
  } else {
    F = { ok: [S.a, '−', S.c, S.b, 1], add: [S.a, '+', S.c, S.b, 1], rev: [S.a, '−', S.b, S.c, 1], nosq: [S.a, '−', S.c, S.b, 0] };
    good = 'ok'; txt = `Le triangle ${T.n} est rectangle en ${T.R}. Quelle égalité permet de calculer <b>${S.a}</b> ?`;
    msg = c => (c === 'add' ? "On n'additionne pas : [" + S.a + "] n'est pas l'hypoténuse. On part de " + sq(S.c) + ' et on <b>enlève</b> ' + sq(S.b) + '.' : c === 'nosq' ? 'Il manque les <b>carrés</b> !' : "Attention à l'ordre : c'est l'hypoténuse (la plus grande) moins l'autre côté.");
  }
  const show = ([l, op, x, y, k]) => (k ? `${sq(l)} = ${sq(x)} ${op} ${sq(y)}` : `${l} = ${x} ${op} ${y}`);
  const opts = shuffle(Object.keys(F).map(v => ({ v, l: show(F[v]) })));
  // vérification : l'égalité choisie est vraie avec les longueurs mesurées sur la figure, les autres sont fausses
  const holds = ([l, op, x, y, k]) => { const e = k ? 2 : 1, r = op === '+' ? len(x) ** e + len(y) ** e : len(x) ** e - len(y) ** e; return Math.abs(len(l) ** e - r) < 1e-9; };
  return { type: 'choice', opts, check: choiceCheck(good, { msg }), html: txt, visual: triFig(T, pts, { flip: O.flip }),
    hint: `Repère d'abord l'hypoténuse : le côté opposé à l'angle droit ${T.R}. Le théorème dit : hypoténuse² = somme des carrés des deux autres côtés.`,
    solution: `L'hypoténuse est [${S.c}], donc ${sq(S.c)} = ${sq(S.a)} + ${sq(S.b)}${F.ok[1] === '−' ? `, et donc ${show(F.ok)}` : ''}.`,
    verify: E => holds(F[E]) && Object.keys(F).filter(k => k !== E).every(k => !holds(F[k])) };
}
function C3() {
  const T = { n: 'ABC', R: 'A', P: 'B', Q: 'C' };
  return `<h2>3. L'égalité de Pythagore</h2>
<p class="intro">Le théorème de Pythagore relie les trois côtés d'un triangle rectangle. Bien l'écrire, c'est déjà la moitié du travail.</p>
<div class="def"><b>Théorème de Pythagore.</b> Si un triangle est rectangle, alors le carré de l'hypoténuse est égal à la somme des carrés des deux autres côtés.<br>ABC rectangle en A : &nbsp;<b>${sq('BC')} = ${sq('AB')} + ${sq('AC')}</b></div>
<div class="cols">${triFig(T, place(T, 4, 3, 0), { squares: { a: 'AB²', b: 'AC²', c: 'BC²' } })}${triFig(T, place(T, 4, 3, 0), { squares: { a: '16', b: '9', c: '25' } })}</div>
<p>L'aire du grand carré (construit sur l'hypoténuse) est égale à la somme des aires des deux petits carrés : 16 + 9 = 25.</p>
<div class="methode"><b>Méthode</b><ol><li>Repère l'angle droit, puis l'hypoténuse (en face).</li><li>Écris : hypoténuse² = côté² + autre côté². L'ordre des deux côtés de droite n'a pas d'importance.</li><li>Pour isoler un côté de l'angle droit : côté² = hypoténuse² − autre côté².</li></ol></div>
<div class="ex"><span class="q">Exemple 1 : RST est rectangle en S.</span><br>L'hypoténuse est [RT] (en face de S), donc ${sq('RT')} = ${sq('RS')} + ${sq('ST')}.<br>On peut aussi écrire ${sq('RT')} = ${sq('ST')} + ${sq('RS')} : c'est la même égalité.</div>
<div class="ex"><span class="q">Exemple 2 : EFG est rectangle en F. Quelle égalité permet de calculer EF ?</span><br>L'hypoténuse est [EG] : ${sq('EG')} = ${sq('EF')} + ${sq('FG')}.<br>On enlève ${sq('FG')} des deux côtés : <b>${sq('EF')} = ${sq('EG')} − ${sq('FG')}</b>.</div>
<div class="warn">⚠️ Sans les carrés, c'est faux : BC n'est pas égal à AB + AC.<br>⚠️ L'hypoténuse est toujours <b>seule</b> d'un côté du signe = dans l'égalité de départ.<br>⚠️ Pour un côté de l'angle droit, c'est l'hypoténuse² <b>moins</b> l'autre côté², jamais l'inverse : ${sq('EF')} = ${sq('FG')} − ${sq('EG')} est faux.</div>
<div class="retenir">À retenir : hypoténuse² = somme des carrés des deux côtés de l'angle droit.</div>`;
}

/* ======================================================================
   4. à 7. Calculer une longueur
   ====================================================================== */
/** exercice « calculer une longueur » dans un triangle rectangle tourné */
function lengthQ(d, mode, a, b, c, round, title) {
  const T = names(d), S = sidesOf(T), O = orient(d);
  // mode 'hyp' : on donne a = RP et b = RQ ; mode 'leg' : on donne c = PQ et a = RP, on cherche b = RQ
  const G = mode === 'hyp' ? hypOf(a, b) : legOf(c, a);
  const bb = mode === 'hyp' ? b : G.ex, cc = mode === 'hyp' ? G.ex : c;
  const pts = place(T, a, bb, O.rot);
  const dec = [a, b, c].some(x => x !== undefined && !Number.isInteger(x)) || round;
  const lab = mode === 'hyp' ? { a: L(a), b: L(b), c: '?' } : { a: L(a), b: '?', c: L(c) };
  const known = mode === 'hyp' ? [a, b] : [c, a];
  const unk = mode === 'hyp' ? S.c : S.b;
  const sym = round ? '≈' : '=';
  // valeur indépendante : distance entre les sommets tournés (hypoténuse) ou √((c − a)(c + a)) (côté)
  const raw = mode === 'hyp' ? dist(pts[T.P], pts[T.Q]) : Math.sqrt((c - a) * (c + a));
  const value = round ? r1(raw) : raw;
  const info = { exact: G.ex, round, mode, known };
  return { type: 'nums', tpl: `${unk} ${sym} {0} cm`, keys: { comma: dec }, check: lensCheck([G.E], [info]), value,
    html: `${T.n} est un triangle rectangle en ${T.R}${mode === 'hyp' ? ` avec ${S.a} = ${L(a)} et ${S.b} = ${L(b)}` : ` avec ${S.c} = ${L(c)} et ${S.a} = ${L(a)}`}.<br>Calcule <b>${unk}</b>${round ? ` (valeur ${ROUND})` : ''}.`,
    visual: triFig(T, pts, { lab, flip: O.flip }),
    afterVisual: triFig(T, pts, { flip: O.flip, squares: { a: `${M(s2(a))}`, b: `${M(r6(bb * bb))}`, c: `${M(r6(cc * cc))}` } }), replaceVisual: true,
    hint: mode === 'hyp'
      ? `On cherche l'<b>hypoténuse</b> (en face de l'angle droit) : ${sq(S.c)} = ${sq(S.a)} + ${sq(S.b)}. Calcule la somme, puis prends la racine carrée${round ? ' et arrondis au dixième' : ''}.`
      : `On cherche un <b>côté de l'angle droit</b> : ${sq(S.b)} = ${sq(S.c)} − ${sq(S.a)} (hypoténuse² <b>moins</b> l'autre côté²). Puis prends la racine carrée${round ? ' et arrondis au dixième' : ''}.`,
    solution: mode === 'hyp' ? solHyp(T, a, b, G) : solLeg(T, c, a, G),
    verify: E => okRound(E[0], mode === 'hyp' ? Math.hypot(a, b) : Math.sqrt(c * c - a * a), round)
      && (mode === 'hyp' || (Math.hypot(a, E[0] - (round ? 0.05 : 0)) <= c + 1e-9 && Math.hypot(a, E[0] + (round ? 0.05 : 0)) >= c - 1e-9)) };
}
/** jambes au hasard selon d (nombres « non pythagoriciens » pour les arrondis) */
function legsRound(d) {
  for (;;) {
    let a, b;
    if (d < 1) { a = ri(2, 9); b = ri(2, 9); } else if (d < 2) { a = ri(2, 12); b = ri(2, 12); } else if (d < 3) { a = ri(3, 20); b = ri(3, 20); } else if (d < 4) { a = ri(2, 12) + 0.5; b = ri(2, 15); } else { a = ri(15, 99) / 10; b = ri(15, 120) / 10; }
    if (Math.max(a, b) / Math.min(a, b) > 3.2) continue;
    if (!hypOf(a, b).exact) return chance(0.5) ? [a, b] : [b, a];
  }
}

function L4(d) {
  const t = triplet(d), [a, b] = chance(0.5) ? [t[0], t[1]] : [t[1], t[0]];
  return lengthQ(d, 'hyp', a, b, undefined, false);
}
function C4() {
  const T = { n: 'ABC', R: 'A', P: 'B', Q: 'C' };
  return `<h2>4. Calculer l'hypoténuse</h2>
<p class="intro">Quand tu connais les deux côtés de l'angle droit, le théorème de Pythagore te donne la longueur du troisième côté, l'hypoténuse.</p>
<div class="def">On connaît les deux côtés de l'angle droit. On calcule la <b>somme</b> de leurs carrés : c'est le carré de l'hypoténuse. L'hypoténuse est la <b>racine carrée</b> de cette somme.</div>
<div class="cols">${triFig(T, place(T, 4, 3, 0), { lab: { a: '4 cm', b: '3 cm', c: '?' } })}${triFig(T, place(T, 4, 3, 0), { squares: { a: '16', b: '9', c: '25' } })}</div>
<div class="methode"><b>Méthode</b><ol><li>Repère l'angle droit : l'hypoténuse est le côté cherché, en face.</li><li>Écris l'égalité de Pythagore.</li><li>Remplace par les longueurs données.</li><li>Calcule les carrés, puis leur somme.</li><li>Prends la racine carrée et n'oublie pas l'unité.</li></ol></div>
<div class="ex"><span class="q">Exemple 1 : ABC rectangle en A, AB = 4 cm, AC = 3 cm. Calcule BC.</span><br>L'hypoténuse est [BC]. D'après le théorème de Pythagore :<br>${sq('BC')} = ${sq('AB')} + ${sq('AC')} = ${sqn(4)} + ${sqn(3)} = 16 + 9 = 25<br>BC = ${R(25)} = <b>5 cm</b>.</div>
<div class="ex"><span class="q">Exemple 2 (décimaux) : DEF rectangle en E, DE = 1,5 cm, EF = 2 cm. Calcule DF.</span><br>${sq('DF')} = ${sqn(1.5)} + ${sqn(2)} = 2,25 + 4 = 6,25<br>DF = ${R('6,25')} = <b>2,5 cm</b> (car 2,5 × 2,5 = 6,25).</div>
<div class="warn">⚠️ Ne t'arrête pas à ${sq('BC')} = 25 : on cherche BC, pas ${sq('BC')}. N'oublie pas la <b>racine carrée</b>.<br>⚠️ BC n'est pas 4 + 3 = 7 : on additionne les <b>carrés</b>, pas les longueurs.<br>⚠️ Contrôle : l'hypoténuse est plus longue que chacun des deux autres côtés (5 &gt; 4 et 5 &gt; 3).</div>
<div class="retenir">À retenir : hypoténuse = racine carrée de la somme des carrés des deux autres côtés.</div>`;
}

function L5(d) {
  const [a, b] = legsRound(d);
  return lengthQ(d, 'hyp', a, b, undefined, true);
}
function C5() {
  const T = { n: 'ABC', R: 'A', P: 'B', Q: 'C' };
  return `<h2>5. Hypoténuse : arrondir au dixième</h2>
<p class="intro">Le plus souvent, la racine carrée « ne tombe pas juste ». On donne alors une valeur approchée, arrondie au dixième.</p>
<div class="def">Arrondir <b>au dixième</b>, c'est garder un seul chiffre après la virgule, en prenant la valeur la plus proche. On regarde le chiffre des <b>centièmes</b> : de 0 à 4 on garde le chiffre des dixièmes, de 5 à 9 on l'augmente de 1. On écrit le signe <b>≈</b>.</div>
<div class="cols">${triFig(T, place(T, 5, 3, 0), { lab: { a: '5 cm', b: '3 cm', c: '?' } })}${zoomArrondi(5.8, 5.831, '√34 ≈ 5,83')}</div>
<div class="methode"><b>Méthode</b><ol><li>Écris l'égalité de Pythagore et calcule la somme des carrés.</li><li>Calcule la racine carrée à la calculatrice et écris au moins deux chiffres après la virgule.</li><li>Regarde le chiffre des centièmes pour arrondir au dixième.</li><li>Écris le résultat avec ≈ et l'unité (touche <b>,</b> du pavé pour la virgule).</li></ol></div>
<div class="ex"><span class="q">Exemple 1 : AB = 5 cm, AC = 3 cm, ABC rectangle en A.</span><br>${sq('BC')} = ${sqn(5)} + ${sqn(3)} = 25 + 9 = 34<br>BC = ${R(34)} ≈ 5,83… Le chiffre des centièmes est 3 : on garde. BC ≈ <b>5,8 cm</b>.</div>
<div class="ex"><span class="q">Exemple 2 : AB = 4 cm, AC = 7 cm.</span><br>${sq('BC')} = 16 + 49 = 65, BC = ${R(65)} ≈ 8,06…<br>Le chiffre des centièmes est 6 : on augmente. BC ≈ <b>8,1 cm</b>.</div>
<div class="ex"><span class="q">Exemple 3 (décimaux) : AB = 2,5 cm, AC = 4 cm.</span><br>${sq('BC')} = ${sqn(2.5)} + ${sqn(4)} = 6,25 + 16 = 22,25<br>BC = ${R('22,25')} ≈ 4,71… donc BC ≈ <b>4,7 cm</b>.</div>
<div class="warn">⚠️ 5,83… arrondi au dixième donne 5,8 ; mais 8,06… donne 8,1 (le chiffre des centièmes est 6).<br>⚠️ Arrondir au dixième, c'est <b>un</b> chiffre après la virgule : ni 5,83 ni 6.<br>⚠️ On arrondit seulement à la fin, sur la racine carrée, pas sur les carrés.</div>
<div class="retenir">À retenir : on calcule la racine carrée à la calculatrice, puis on regarde le chiffre des centièmes pour arrondir.</div>`;
}

function L6(d) {
  const t = triplet(d);
  const [a] = chance(0.5) ? [t[0], t[1]] : [t[1], t[0]];
  return lengthQ(d, 'leg', a, undefined, t[2], false);
}
function C6() {
  const T = { n: 'ABC', R: 'A', P: 'B', Q: 'C' };
  return `<h2>6. Calculer un côté de l'angle droit</h2>
<p class="intro">Si tu connais l'hypoténuse et un côté de l'angle droit, Pythagore te donne aussi le troisième côté : cette fois, on <b>soustrait</b>.</p>
<div class="def">ABC rectangle en A : ${sq('BC')} = ${sq('AB')} + ${sq('AC')} &nbsp;donc&nbsp; <b>${sq('AC')} = ${sq('BC')} − ${sq('AB')}</b><br>Le carré d'un côté de l'angle droit = hypoténuse² <b>moins</b> l'autre côté².</div>
<div class="cols">${triFig(T, place(T, 12, 5, 0), { lab: { a: '12 cm', b: '?', c: '13 cm' } })}${triFig(T, place(T, 12, 5, 0), { squares: { a: '144', b: '?', c: '169' } })}</div>
<div class="methode"><b>Méthode</b><ol><li>Repère l'hypoténuse : ici, c'est une longueur <b>connue</b>.</li><li>Écris l'égalité de Pythagore, puis transforme-la : côté² = hypoténuse² − autre côté².</li><li>Remplace, calcule la différence.</li><li>Prends la racine carrée, avec l'unité.</li></ol></div>
<div class="ex"><span class="q">Exemple 1 : ABC rectangle en A, BC = 13 cm, AB = 12 cm. Calcule AC.</span><br>L'hypoténuse est [BC]. ${sq('BC')} = ${sq('AB')} + ${sq('AC')}, donc ${sq('AC')} = ${sq('BC')} − ${sq('AB')}<br>${sq('AC')} = ${sqn(13)} − ${sqn(12)} = 169 − 144 = 25, donc AC = ${R(25)} = <b>5 cm</b>.</div>
<div class="ex"><span class="q">Exemple 2 (décimaux) : MNP rectangle en N, MP = 2,5 cm, MN = 1,5 cm. Calcule NP.</span><br>L'hypoténuse est [MP]. ${sq('NP')} = ${sqn(2.5)} − ${sqn(1.5)} = 6,25 − 2,25 = 4<br>NP = ${R(4)} = <b>2 cm</b>.</div>
<div class="warn">⚠️ L'erreur la plus fréquente : <b>additionner</b> au lieu de soustraire. Ici 169 + 144 = 313 donnerait AC ≈ 17,7 cm, plus long que l'hypoténuse : impossible !<br>⚠️ C'est toujours la plus grande moins la plus petite : 144 − 169 serait négatif.<br>⚠️ Contrôle : un côté de l'angle droit est toujours plus court que l'hypoténuse.</div>
<div class="retenir">À retenir : pour un côté de l'angle droit, on fait hypoténuse² − autre côté², puis la racine carrée.</div>`;
}

function L7(d) {
  for (;;) {
    let c, a;
    if (d < 1) { c = ri(5, 12); a = ri(2, c - 1); } else if (d < 2) { c = ri(6, 15); a = ri(2, c - 1); } else if (d < 3) { c = ri(10, 25); a = ri(3, c - 2); } else { c = ri(40, 150) / 10; a = ri(15, Math.floor(c * 10) - 5) / 10; }
    const G = legOf(c, a);
    if (G.exact || G.ex < 1 || G.ex < c / 3.2 || a < c / 3.4) continue;
    return lengthQ(d, 'leg', a, undefined, c, true);
  }
}
function C7() {
  const T = { n: 'ABC', R: 'A', P: 'B', Q: 'C' };
  return `<h2>7. Côté de l'angle droit : arrondir au dixième</h2>
<p class="intro">On combine les deux niveaux précédents : soustraire les carrés, puis arrondir la racine carrée au dixième.</p>
<div class="def">Même méthode qu'au niveau 6 : hypoténuse² <b>moins</b> l'autre côté², puis racine carrée. Si elle ne tombe pas juste, on l'arrondit au dixième avec le signe ≈.</div>
<div class="cols">${triFig(T, place(T, 6, 5.3, 0), { lab: { a: '6 cm', b: '?', c: '8 cm' } })}${zoomArrondi(5.2, 5.292, '√28 ≈ 5,29')}</div>
<div class="methode"><b>Méthode</b><ol><li>Repère l'hypoténuse (connue) et le côté cherché.</li><li>côté² = hypoténuse² − autre côté² : calcule la différence.</li><li>Racine carrée à la calculatrice (ou tape ${R('64 − 36')} avec des parenthèses).</li><li>Arrondis au dixième grâce au chiffre des centièmes, et écris l'unité.</li></ol></div>
<div class="ex"><span class="q">Exemple 1 : ABC rectangle en A, BC = 8 cm, AB = 6 cm.</span><br>${sq('AC')} = ${sqn(8)} − ${sqn(6)} = 64 − 36 = 28<br>AC = ${R(28)} ≈ 5,29… Le chiffre des centièmes est 9 : on augmente. AC ≈ <b>5,3 cm</b>.</div>
<div class="ex"><span class="q">Exemple 2 (décimaux) : BC = 7,5 cm, AB = 4,2 cm.</span><br>${sq('AC')} = ${sqn(7.5)} − ${sqn(4.2)} = 56,25 − 17,64 = 38,61<br>AC = ${R('38,61')} ≈ 6,21… donc AC ≈ <b>6,2 cm</b>.</div>
<div class="warn">⚠️ Si tu trouves un côté plus long que l'hypoténuse, tu as additionné au lieu de soustraire.<br>⚠️ Avec des décimaux : ${sqn(2.5)} = 6,25 (pas 4,25 ni 5).<br>⚠️ Si tu tapes ${R(64)} − 36 à la calculatrice, tu obtiens 8 − 36 : mets des parenthèses ou calcule 28 d'abord.</div>
<div class="retenir">À retenir : soustraire les carrés, prendre la racine carrée, puis arrondir à la toute fin.</div>`;
}

/* ======================================================================
   8. Pythagore en situation
   ====================================================================== */
function L8(d) {
  const v = d < 1 ? pick(['echelle', 'rect']) : pick(['echelle', 'rect', 'ecran', 'cerf', 'toboggan']);
  const dec = d >= 3;
  let mode = d < 1 ? 'hyp' : pick(['hyp', 'leg', 'leg2']);
  if (v === 'cerf') mode = 'leg';
  if (v === 'toboggan') mode = 'hyp';
  // choix des longueurs : jambes x (horizontale) et y (verticale), hypoténuse h
  let x, y, h, u;
  const pickT = (lo, hi) => (dec ? ri(lo * 10, hi * 10) / 10 : ri(lo, hi));
  for (;;) {
    if (v === 'echelle') { u = 'm'; x = ri(8, 20) / 10; y = ri(20, 60) / 10; }
    else if (v === 'rect') { u = pick(['m', 'cm']); x = pickT(20, 90); y = pickT(10, 60); }
    else if (v === 'ecran') { u = 'cm'; x = pickT(50, 140); y = r6(Math.round(x * 9 / 16 * (dec ? 10 : 1)) / (dec ? 10 : 1)); }
    else if (v === 'cerf') { u = 'm'; x = pickT(10, 40); y = pickT(15, 50); }
    else { u = 'm'; x = ri(15, 40) / 10; y = ri(12, 30) / 10; }
    if (Math.max(x, y) / Math.min(x, y) > 4.5) continue;
    h = hypOf(x, y);
    if (mode !== 'hyp') { h = { ...h, give: h.exact ? h.E : r1(h.ex + (chance(0.5) ? 0.3 : 0.6)) }; }
    break;
  }
  const T = { n: 'ABC', R: 'B', P: 'C', Q: 'A' }; // B : coin, C sur l'horizontale, A sur la verticale
  let html, unkSide, G, ex;
  const giveH = mode === 'hyp' ? null : h.give;
  if (mode === 'hyp') { G = h; unkSide = 'AC'; ex = Math.hypot(x, y); }
  else if (mode === 'leg') { G = legOf(giveH, x); unkSide = 'AB'; ex = Math.sqrt(giveH * giveH - x * x); }
  else { G = legOf(giveH, y); unkSide = 'BC'; ex = Math.sqrt(giveH * giveH - y * y); }
  const yy = mode === 'leg' ? G.ex : y, xx = mode === 'leg2' ? G.ex : x;
  const pts = { A: [0, yy], B: [0, 0], C: [xx, 0] };
  const lab = { AB: mode === 'leg' ? '?' : L(y, u), BC: mode === 'leg2' ? '?' : L(x, u), AC: mode === 'hyp' ? '?' : L(giveH, u) };
  const sides = Object.keys(lab).map(k => ({ k, t: lab[k], unk: lab[k] === '?', away: 'ABC'.replace(k[0], '').replace(k[1], ''), gapU: v === 'echelle' && k === 'AB' ? yy * 0.06 : 0 }));
  let polys = [['A', 'B', 'C']], decor = [], ptsF = pts, rights = [['B', 'A', 'C']];
  const nm = prenom();
  const X = L(x, u), Y = L(y, u), HH = giveH !== null ? L(giveH, u) : '';
  if (v === 'echelle') {
    decor = decorMur(yy, xx * 1.25);
    html = mode === 'hyp' ? `Le pied d'une échelle est posé à ${X} d'un mur vertical. Le haut de l'échelle touche le mur à ${Y} du sol. Quelle est la <b>longueur de l'échelle</b> ?`
      : mode === 'leg' ? `Une échelle de ${HH} est appuyée contre un mur vertical. Son pied est à ${X} du mur. À quelle <b>hauteur</b> le haut de l'échelle touche-t-il le mur ?`
        : `Une échelle de ${HH} est appuyée contre un mur vertical et touche le mur à ${Y} du sol. À quelle <b>distance du mur</b> est son pied ?`;
  } else if (v === 'rect' || v === 'ecran') {
    const D = [xx, yy];
    ptsF = { A: [0, yy], B: [0, 0], C: [xx, 0], D };
    polys = [['A', 'B', 'C', 'D']];
    // le rectangle est ABCD, la diagonale [AC]
    if (v === 'ecran') {
      decor = [{ pts: [[0, 0], [xx, 0], [xx, yy], [0, yy]], close: true, fill: '#343a40', stroke: '#212529', sw: 3 }];
      html = mode === 'hyp' ? `Un écran rectangulaire ABCD mesure ${X} de large et ${Y} de haut. Quelle est la longueur de sa <b>diagonale</b> [AC] ?`
        : mode === 'leg' ? `Un écran rectangulaire ABCD mesure ${X} de large et sa diagonale [AC] mesure ${HH}. Quelle est sa <b>hauteur</b> AB ?`
          : `Un écran rectangulaire ABCD mesure ${Y} de haut et sa diagonale [AC] mesure ${HH}. Quelle est sa <b>largeur</b> BC ?`;
    } else {
      const what = u === 'm' ? 'Un terrain rectangulaire ABCD' : 'Une plaque rectangulaire ABCD';
      html = mode === 'hyp' ? `${what} a pour côtés AB = ${Y} et BC = ${X}. Quelle est la longueur de sa <b>diagonale</b> [AC] ?`
        : mode === 'leg' ? `${what} a un côté BC = ${X} et une diagonale AC = ${HH}. Calcule la longueur <b>AB</b>.`
          : `${what} a un côté AB = ${Y} et une diagonale AC = ${HH}. Calcule la longueur <b>BC</b>.`;
    }
    rights = [['B', 'A', 'C']];
  } else if (v === 'cerf') {
    decor = decorSol(-xx * 0.15, xx * 1.15);
    html = `${nm} fait voler un cerf-volant. Le fil, bien tendu, mesure ${HH}. Le point du sol situé juste sous le cerf-volant est à ${X} de ${nm}. À quelle <b>hauteur</b> vole le cerf-volant ? <span class="note">(on néglige la taille de ${nm})</span>`;
  } else {
    decor = decorSol(-xx * 0.15, xx * 1.2);
    html = `Le haut d'un toboggan est à ${Y} du sol. Le bas de la glissière est à ${X} du pied de l'échelle du toboggan (verticale). Quelle est la <b>longueur de la glissière</b> ?`;
  }
  const segs = (v === 'rect' || v === 'ecran') ? [{ k: 'AC', sw: 2.4 }] : [];
  const sidesF = sides.map(s => ((v === 'rect' || v === 'ecran') ? { ...s, away: s.k === 'AC' ? 'D' : s.away } : s));
  const visual = figure({ pts: ptsF, polys, segs, rights, sides: sidesF, decor, aria: 'figure de la situation' });
  html += `<br><span class="note">Donne une valeur ${ROUND} si besoin.</span>`;
  const round = !G.exact;
  const value = round ? r1(ex) : ex;
  const info = { exact: G.ex, round: true, mode: mode === 'hyp' ? 'hyp' : 'leg', known: mode === 'hyp' ? [x, y] : [giveH, mode === 'leg' ? x : y] };
  const T2 = mode === 'hyp' ? T : mode === 'leg' ? { n: 'ABC', R: 'B', P: 'C', Q: 'A' } : { n: 'ABC', R: 'B', P: 'A', Q: 'C' };
  const intro = v === 'echelle' ? 'Le mur est perpendiculaire au sol. ' : v === 'cerf' ? 'Le cerf-volant est à la verticale du point du sol. ' : v === 'toboggan' ? "L'échelle du toboggan est verticale. " : 'Les angles d\'un rectangle sont droits. ';
  const solution = mode === 'hyp' ? solHyp(T2, x, y, G, u, intro) : solLeg(T2, giveH, mode === 'leg' ? x : y, G, u, intro);
  return { type: 'nums', tpl: `${unkSide} ${round ? '≈' : '='} {0} ${u}`, keys: { comma: true }, check: lensCheck([G.E], [info]), value,
    html, visual,
    hint: `Repère le triangle rectangle et son angle droit (${v === 'echelle' ? 'entre le mur et le sol' : v === 'cerf' || v === 'toboggan' ? 'entre la verticale et le sol' : 'un coin du rectangle'}). La longueur cherchée est-elle l'hypoténuse (on additionne les carrés) ou un côté de l'angle droit (on soustrait) ?`,
    solution, verify: E => okRound(E[0], ex, round) };
}
function C8() {
  return `<h2>8. Pythagore en situation</h2>
<p class="intro">Échelles, écrans, terrains, cerfs-volants : dès qu'un angle droit se cache dans un problème, Pythagore permet de calculer une distance qu'on ne peut pas mesurer.</p>
<div class="def">Les angles droits les plus courants : un <b>mur</b> vertical et le <b>sol</b> ; les <b>coins d'un rectangle</b> ; une <b>verticale</b> (fil à plomb, poteau) et le sol. L'objet « en biais » (échelle, fil, diagonale, glissière) est l'<b>hypoténuse</b>.</div>
<div class="cols">${figure({ pts: { A: [0, 4], B: [0, 0], C: [1.5, 0] }, rights: [['B', 'A', 'C']], sides: [{ k: 'AB', t: '4 m', away: 'C', gapU: 0.24 }, { k: 'BC', t: '1,5 m', away: 'A' }, { k: 'AC', t: '?', unk: true, away: 'B' }], decor: decorMur(4, 1.9), aria: 'échelle contre un mur', maxw: 210 })}${figure({ pts: { A: [0, 45], B: [0, 0], C: [80, 0], D: [80, 45] }, polys: [['A', 'B', 'C', 'D']], segs: [{ k: 'AC', sw: 2.4 }], rights: [['B', 'A', 'C']], sides: [{ k: 'AB', t: '45 cm', away: 'C' }, { k: 'BC', t: '80 cm', away: 'A' }, { k: 'AC', t: '?', unk: true, away: 'D' }], decor: [{ pts: [[0, 0], [80, 0], [80, 45], [0, 45]], close: true, fill: '#343a40', stroke: '#212529', sw: 3 }], aria: 'écran rectangulaire et sa diagonale' })}</div>
<div class="methode"><b>Méthode</b><ol><li>Repère le triangle rectangle et <b>justifie</b> l'angle droit (« le mur est perpendiculaire au sol »).</li><li>Repère l'hypoténuse : l'échelle, le fil, la diagonale, la glissière.</li><li>Hypoténuse cherchée : on <b>additionne</b> les carrés. Côté de l'angle droit cherché : on <b>soustrait</b>.</li><li>Racine carrée, arrondi au dixième si besoin, et réponds avec l'<b>unité</b> (m ou cm).</li></ol></div>
<div class="ex"><span class="q">Exemple 1 : le pied d'une échelle est à 1,5 m du mur, son haut à 4 m du sol. Longueur de l'échelle ?</span><br>Le mur est perpendiculaire au sol : ABC est rectangle en B, d'hypoténuse [AC].<br>${sq('AC')} = ${sqn(1.5)} + ${sqn(4)} = 2,25 + 16 = 18,25 ; AC = ${R('18,25')} ≈ 4,27… ≈ <b>4,3 m</b>.</div>
<div class="ex"><span class="q">Exemple 2 : un écran de 80 cm de large et 45 cm de haut. Diagonale ?</span><br>Les angles d'un rectangle sont droits : ${sq('AC')} = ${sqn(80)} + ${sqn(45)} = 6 400 + 2 025 = 8 425<br>AC = ${R('8 425')} ≈ 91,78… ≈ <b>91,8 cm</b>.</div>
<div class="ex"><span class="q">Exemple 3 : le fil d'un cerf-volant mesure 25 m ; le point du sol sous le cerf-volant est à 15 m. Hauteur ?</span><br>Le fil est l'hypoténuse (connue) : on soustrait. h² = ${sqn(25)} − ${sqn(15)} = 625 − 225 = 400, h = ${R(400)} = <b>20 m</b>.</div>
<div class="warn">⚠️ L'échelle (ou le fil, la diagonale) est l'<b>hypoténuse</b> : si elle est connue, on soustrait pour trouver la hauteur.<br>⚠️ Toutes les longueurs doivent être dans la même unité avant de calculer.<br>⚠️ N'oublie pas l'unité dans la réponse.</div>
<div class="retenir">À retenir : trouver l'angle droit caché, repérer l'hypoténuse, puis appliquer Pythagore.</div>`;
}

/* ======================================================================
   9. et 10. Réciproque et contraposée
   ====================================================================== */
/** triangle dont les trois côtés sont donnés ; lens = {côté: longueur} ; coordonnées par les cosinus */
function triFromSides(T, lens, rot) {
  const [A, B, C] = T.n, c = lens[A + B], b = lens[A + C], a = lens[B + C];
  const x = (c * c + a * a - b * b) / (2 * a), y = Math.sqrt(Math.max(0, c * c - x * x));
  const raw = { [B]: [0, 0], [C]: [a, 0], [A]: [x, y] };
  const pts = {}; for (const k of T.n) pts[k] = rotate(raw[k], rot); return pts;
}
/** sommet de l'angle droit trouvé sur les coordonnées (ou null) */
function rightVertex(T, pts) {
  const [A, B, C] = T.n;
  for (const [V, P, Q] of [[A, B, C], [B, A, C], [C, A, B]]) if (Math.abs(cosAt(pts, V, P, Q)) < 1e-9) return V;
  return null;
}
function recData(d, rect) {
  const n = d < 2 ? 'ABC' : pick(SETS);
  let t;
  if (rect) t = triplet(d >= 3 ? 3 : d);
  else {
    for (;;) {
      let base = triplet(Math.min(d, 2)).slice();
      const i = ri(0, 2); base[i] += pick([-1, 1]);
      if (d >= 3) { const k = pick([0.1, 0.5]); base = base.map(x => r6(x * k)); } // décimaux
      const s = [...base].sort((p, q) => p - q);
      if (s[0] <= 0 || s[0] + s[1] <= s[2] * 1.05) continue;
      if (t10(s[2]) ** 2 === t10(s[0]) ** 2 + t10(s[1]) ** 2) continue;
      if (s[1] === s[2]) continue;
      t = s; break;
    }
  }
  const s = [...t].sort((p, q) => p - q);
  // le plus grand côté est en face du sommet V
  const V = n[ri(0, 2)], others = [...n].filter(k => k !== V), hyp = others.join('');
  const legs = shuffle([V + others[0], V + others[1]]).map(k => seg(n, k[0], k[1]));
  const lens = { [hyp]: s[2], [legs[0]]: s[0], [legs[1]]: s[1] };
  const T = { n, R: V, P: others[0], Q: others[1] };
  const pts = triFromSides(T, lens, d < 1 ? 0 : ri(0, 359));
  return { T, lens, hyp, legs, pts, V, s };
}
function recFig(D, flip) {
  return figure({ pts: D.pts, polys: [[...D.T.n]], flip, sides: Object.keys(D.lens).map(k => ({ k, t: L(D.lens[k]), away: [...D.T.n].find(x => !k.includes(x)) })), aria: `triangle ${D.T.n}` });
}
const enonceRec = D => `Le triangle ${D.T.n} a pour côtés ${shuffle(Object.keys(D.lens)).map(k => `${k} = ${L(D.lens[k])}`).join(', ')}.`;

function L9(d) {
  const D = recData(d, true), { hyp, legs, lens } = D, flip = chance(0.5);
  const H2 = s2(lens[hyp]), S2 = r6(s2(lens[legs[0]]) + s2(lens[legs[1]]));
  const calc = `${sq(hyp)} = ${sqn(lens[hyp])} = ${M(H2)}<br>${sq(legs[0])} + ${sq(legs[1])} = ${sqn(lens[legs[0]])} + ${sqn(lens[legs[1]])} = ${M(s2(lens[legs[0]]))} + ${M(s2(lens[legs[1]]))} = ${M(S2)}`;
  const concl = `${sq(hyp)} = ${sq(legs[0])} + ${sq(legs[1])}. D'après la <b>réciproque</b> du théorème de Pythagore, le triangle ${D.T.n} est rectangle en ${D.V}.`;
  const Vgeo = rightVertex(D.T, D.pts);
  if (d < 2) {
    return { type: 'nums', tpl: `<span>${sq(hyp)} =</span>{0}<span class="sep">${sq(legs[0])} + ${sq(legs[1])} =</span>{1}`, labels: [sq(hyp), 'somme des carrés'],
      check: (() => { const f = v => { const bad = [H2, S2].map((e, i) => (approx(v[i], e) ? -1 : i)).filter(i => i >= 0); if (!bad.length) return { ok: true }; return { ok: false, bad, msg: approx(v[0], lens[hyp]) ? "Il faut le <b>carré</b> de la longueur, pas la longueur." : '' }; }; f.expected = [H2, S2]; return f; })(),
      value: Math.pow(dist(D.pts[hyp[0]], D.pts[hyp[1]]), 2),
      html: `${enonceRec(D)}<br>Pour savoir s'il est rectangle, calcule le carré du plus grand côté, puis la somme des carrés des deux autres.`,
      visual: recFig(D, flip),
      hint: `Le plus grand côté est [${hyp}]. Calcule ${sq(hyp)}, puis ${sq(legs[0])} + ${sq(legs[1])}.`,
      solution: `${calc}<br>${concl}`,
      verify: E => Vgeo === D.V && Math.abs(E[0] - E[1]) < 1e-9 };
  }
  const opts = [...D.T.n].map(k => ({ v: k, l: `rectangle en ${k}` }));
  return { type: 'choice', opts, check: choiceCheck(D.V, { msg: () => "Le triangle est bien rectangle, mais l'angle droit est <b>en face du plus grand côté</b>." }),
    html: `${enonceRec(D)}<br>Montre qu'il est rectangle : en quel sommet est l'angle droit ?`, visual: recFig(D, flip),
    hint: `Repère le plus grand côté et compare son carré à la somme des carrés des deux autres. L'angle droit est en face du plus grand côté.`,
    solution: `Le plus grand côté est [${hyp}].<br>${calc}<br>${concl}`,
    verify: E => E === Vgeo };
}
function C9() {
  const D = { T: { n: 'ABC' }, lens: { AB: 6, AC: 8, BC: 10 } };
  D.pts = triFromSides(D.T, D.lens, 0);
  const sqf = figure({ pts: D.pts, polys: [['A', 'B', 'C']], squares: [{ k: 'AB', t: '36', away: 'C' }, { k: 'AC', t: '64', away: 'B' }, { k: 'BC', t: '100', away: 'A' }], size: [300, 260], aria: 'carrés construits sur les côtés : 36 + 64 = 100' });
  return `<h2>9. La réciproque : prouver qu'un triangle est rectangle</h2>
<p class="intro">On connaît les trois côtés d'un triangle, sans codage d'angle droit. Un calcul permet de <b>prouver</b> qu'il est rectangle et de dire où est l'angle droit.</p>
<div class="def"><b>Réciproque du théorème de Pythagore.</b> Si, dans un triangle, le carré du plus grand côté est <b>égal</b> à la somme des carrés des deux autres côtés, alors ce triangle est rectangle. L'angle droit est au sommet <b>en face du plus grand côté</b>.</div>
<div class="cols">${recFig(D, false)}${sqf}</div>
<div class="methode"><b>Méthode</b><ol><li>Repère le plus grand côté.</li><li>Calcule son carré.</li><li>Calcule <b>séparément</b> la somme des carrés des deux autres côtés.</li><li>Compare : si c'est égal, le triangle est rectangle (réciproque du théorème de Pythagore).</li><li>L'angle droit est au sommet qui n'est pas sur le plus grand côté.</li></ol></div>
<div class="ex"><span class="q">Exemple 1 : ABC avec AB = 6 cm, AC = 8 cm, BC = 10 cm.</span><br>Le plus grand côté est [BC].<br>${sq('BC')} = ${sqn(10)} = 100<br>${sq('AB')} + ${sq('AC')} = 36 + 64 = 100<br>Les deux résultats sont égaux : d'après la réciproque du théorème de Pythagore, ABC est rectangle en <b>A</b>.</div>
<div class="ex"><span class="q">Exemple 2 (décimaux) : EFG avec EF = 1,5 cm, FG = 2 cm, EG = 2,5 cm.</span><br>Le plus grand côté est [EG] : ${sq('EG')} = 6,25.<br>${sq('EF')} + ${sq('FG')} = 2,25 + 4 = 6,25.<br>Égalité vérifiée : EFG est rectangle en <b>F</b> (le sommet qui n'est pas sur [EG]).</div>
<div class="warn">⚠️ On calcule les deux nombres <b>séparément</b>, puis on compare. N'écris pas ${sq('BC')} = ${sq('AB')} + ${sq('AC')} avant de l'avoir vérifié.<br>⚠️ L'angle droit est au sommet qui n'est <b>pas</b> sur le plus grand côté : pas en B ni en C ici.<br>⚠️ Ne compare pas avec n'importe quel côté : c'est le carré du <b>plus grand</b> côté qu'on compare.</div>
<div class="retenir">À retenir : plus grand côté² = somme des deux autres carrés ⟹ triangle rectangle, en face du plus grand côté.</div>`;
}

function L10(d) {
  const rect = chance(0.5), D = recData(d, rect), { hyp, legs, lens } = D, flip = chance(0.5);
  const H2 = s2(lens[hyp]), S2 = r6(s2(lens[legs[0]]) + s2(lens[legs[1]]));
  const W = pick([...D.T.n].filter(k => k !== D.V));
  const opts = [{ v: 'r' + D.V, l: `Oui, il est rectangle en ${D.V}` }, { v: 'r' + W, l: `Oui, il est rectangle en ${W}` }];
  shuffle(opts); opts.push({ v: 'non', l: "Non, il n'est pas rectangle" });
  const good = rect ? 'r' + D.V : 'non';
  const calc = `Le plus grand côté est [${hyp}].<br>${sq(hyp)} = ${sqn(lens[hyp])} = ${M(H2)}<br>${sq(legs[0])} + ${sq(legs[1])} = ${M(s2(lens[legs[0]]))} + ${M(s2(lens[legs[1]]))} = ${M(S2)}`;
  const concl = rect ? `Les deux résultats sont égaux : d'après la réciproque du théorème de Pythagore, ${D.T.n} est rectangle en ${D.V}.`
    : `${M(H2)} ≠ ${M(S2)} : ${sq(hyp)} ≠ ${sq(legs[0])} + ${sq(legs[1])}. D'après la <b>contraposée</b> du théorème de Pythagore, ${D.T.n} n'est <b>pas</b> rectangle (même s'il en a l'air !).`;
  const Vgeo = rightVertex(D.T, D.pts);
  return { type: 'choice', opts,
    check: choiceCheck(good, { msg: c => (rect && c !== 'non' ? "Il est bien rectangle, mais l'angle droit est <b>en face du plus grand côté</b>." : rect ? 'Refais les calculs : compare bien le carré du plus grand côté et la somme des carrés des deux autres.' : "Les deux nombres ne sont pas égaux : le triangle n'est pas rectangle, même si la figure en a l'air.") }),
    html: `${enonceRec(D)}<br>Ce triangle est-il rectangle ?`, visual: recFig(D, flip),
    hint: `Calcule le carré du plus grand côté, puis la somme des carrés des deux autres. Égaux : rectangle (réciproque). Différents : pas rectangle (contraposée).`,
    solution: `${calc}<br>${concl}`,
    verify: E => (Vgeo === null ? E === 'non' : E === 'r' + Vgeo) };
}
function C10() {
  const D = { T: { n: 'RST' }, lens: { RS: 5, RT: 7, ST: 9 } };
  D.pts = triFromSides(D.T, D.lens, 0);
  const Y = { T: { n: 'ABC' }, lens: { AB: 6, AC: 8, BC: 10 } }, N = { T: { n: 'ABC' }, lens: { AB: 6, AC: 8, BC: 11 } };
  Y.pts = triFromSides(Y.T, Y.lens, 0); N.pts = triFromSides(N.T, N.lens, 0);
  return `<h2>10. Rectangle ou pas ? La contraposée</h2>
<p class="intro">Deux triangles peuvent se ressembler beaucoup sans être tous les deux rectangles. Le calcul tranche : il dit oui (réciproque) ou non (contraposée).</p>
<div class="def"><b>Contraposée du théorème de Pythagore.</b> Si le carré du plus grand côté n'est <b>pas égal</b> à la somme des carrés des deux autres, alors le triangle n'est <b>pas</b> rectangle.</div>
<div class="cols"><div>${recFig(Y, false)}<p>6, 8, 10 : 100 = 36 + 64, <b>rectangle</b></p></div><div>${recFig(N, false)}<p>6, 8, 11 : 121 ≠ 100, <b>pas rectangle</b></p></div></div>
<div class="methode"><b>Méthode</b><ol><li>Repère le plus grand côté et calcule son carré.</li><li>Calcule la somme des carrés des deux autres côtés.</li><li>Égaux : le triangle est rectangle (réciproque), en face du plus grand côté.</li><li>Différents : le triangle n'est pas rectangle (contraposée).</li></ol></div>
<div class="cols"><div class="ex"><span class="q">Exemple 1 : RST avec RS = 5 cm, RT = 7 cm, ST = 9 cm.</span><br>Le plus grand côté est [ST].<br>${sq('ST')} = 81 et ${sq('RS')} + ${sq('RT')} = 25 + 49 = 74.<br>81 ≠ 74 : d'après la contraposée du théorème de Pythagore, RST <b>n'est pas</b> rectangle.</div>${recFig(D, false)}</div>
<div class="ex"><span class="q">Exemple 2 (presque un piège) : IJK avec IJ = 0,7 cm, JK = 2,4 cm, IK = 2,6 cm.</span><br>${sq('IK')} = 6,76 et ${sq('IJ')} + ${sq('JK')} = 0,49 + 5,76 = 6,25.<br>6,76 ≠ 6,25 : IJK n'est pas rectangle. (Avec IK = 2,5 cm, il l'aurait été !)</div>
<div class="warn">⚠️ Une figure qui « a l'air » rectangle ne prouve rien : seul le calcul compte.<br>⚠️ 6, 8 et 11 « ressemblent » à 6, 8, 10, mais 121 ≠ 100 : ce triangle n'est pas rectangle.<br>⚠️ Si c'est rectangle, l'angle droit est en face du plus grand côté, pas n'importe où.</div>
<div class="retenir">À retenir : égalité ⟹ rectangle (réciproque) ; pas d'égalité ⟹ pas rectangle (contraposée).</div>`;
}

/* ======================================================================
   11. Problèmes à deux étapes
   ====================================================================== */
function L11(d) {
  const v = d < 1 ? ri(0, 1) : d < 2 ? ri(0, 2) : ri(0, 3);
  const k = ri(1, 3);
  if (v === 0) { // périmètre
    let a, b;
    if (d < 2) { const t = triplet(d); [a, b] = chance(0.5) ? [t[0], t[1]] : [t[1], t[0]]; } else [a, b] = legsRound(Math.min(d, 2));
    const T = names(d), S = sidesOf(T), O = orient(d), pts = place(T, a, b, O.rot), H = hypOf(a, b);
    const ex = dist(pts[T.P], pts[T.Q]), per = a + b + ex, Pr = H.exact ? r6(a + b + H.E) : r1(a + b + H.ex);
    const sym = H.exact ? '=' : '≈';
    return { type: 'nums', tpl: `<span>${S.c} ${sym}</span>{0}<span>cm</span><span class="sep">Périmètre ${sym}</span>{1}<span>cm</span>`, labels: [S.c, 'périmètre'], keys: { comma: !H.exact },
      check: lensCheck([H.E, Pr], [{ exact: H.ex, round: !H.exact, mode: 'hyp', known: [a, b] }, { exact: a + b + H.ex, round: !H.exact }]),
      value: H.exact ? per : r1(per),
      html: `${T.n} est rectangle en ${T.R}, avec ${S.a} = ${L(a)} et ${S.b} = ${L(b)}.<br>Calcule ${S.c}, puis le <b>périmètre</b> du triangle${H.exact ? '' : ` (valeurs ${ROUND.replace('ie', 'ies')})`}.`,
      visual: triFig(T, pts, { lab: { a: L(a), b: L(b), c: '?' }, flip: O.flip }),
      hint: `Étape 1 : Pythagore pour l'hypoténuse ${S.c}. Étape 2 : le périmètre est la somme des trois côtés.`,
      solution: `${solHyp(T, a, b, H)}<br>Périmètre = ${M(a)} + ${M(b)} + ${S.c} ${sym} <b>${H.exact ? L(Pr) : D1(Pr) + " cm"}</b>.`,
      verify: E => okRound(E[0], Math.hypot(a, b), !H.exact) && okRound(E[1], a + b + Math.hypot(a, b), !H.exact) };
  }
  if (v === 1) { // côté puis aire
    const t = triplet(Math.min(d, 2)); const [a, b] = chance(0.5) ? [t[0], t[1]] : [t[1], t[0]], c = t[2];
    const T = names(d), S = sidesOf(T), O = orient(d), pts = place(T, a, b, O.rot), G = legOf(c, a);
    const A = r6(a * G.E / 2);
    return { type: 'nums', tpl: `<span>${S.b} =</span>{0}<span>cm</span><span class="sep">Aire =</span>{1}<span>cm²</span>`, labels: [S.b, 'aire'], keys: { comma: true },
      check: lensCheck([G.E, A], [{ exact: G.ex, mode: 'leg', known: [c, a] }, { exact: A }]),
      value: dist(pts[T.R], pts[T.P]) * dist(pts[T.R], pts[T.Q]) / 2,
      html: `${T.n} est rectangle en ${T.R}, avec ${S.c} = ${L(c)} et ${S.a} = ${L(a)}.<br>Calcule ${S.b}, puis l'<b>aire</b> du triangle ${T.n}.`,
      visual: triFig(T, pts, { lab: { a: L(a), b: '?', c: L(c) }, flip: O.flip }),
      hint: `Étape 1 : ${S.b} est un côté de l'angle droit (soustraction). Étape 2 : l'aire d'un triangle rectangle est (côté × côté de l'angle droit) ÷ 2.`,
      solution: `${solLeg(T, c, a, G)}<br>Aire = ${S.a} × ${S.b} ÷ 2 = ${M(a)} × ${M(G.E)} ÷ 2 = <b>${M(A)} cm²</b>.`,
      verify: E => okRound(E[0], Math.sqrt(c * c - a * a), false) && Math.abs(E[1] - a * E[0] / 2) < 1e-9 };
  }
  if (v === 2) { // hauteur d'un triangle isocèle
    const t = pick([[3, 4, 5], [5, 12, 13], [6, 8, 10], [8, 15, 17], [9, 12, 15], [4, 3, 5], [8, 6, 10], [12, 5, 13]]).map(x => x * (k === 3 ? 1 : k));
    const [m, h, c] = t;
    const pts = { A: [0, h], B: [-m, 0], C: [m, 0], H: [0, 0] };
    const Aire = m * h;
    const visual = figure({ pts, polys: [['A', 'B', 'C']], segs: [{ k: 'AH', dash: true }], rights: [['H', 'A', 'C']],
      sides: [{ k: 'AB', t: L(c), away: 'C' }, { k: 'AC', t: L(c), away: 'B' }, { k: 'BH', t: L(m), away: 'A' }, { k: 'HC', t: L(m), away: 'A' }, { k: 'AH', t: '?', unk: true, away: 'C' }],
      rot: d < 1 ? 0 : ri(-30, 30), aria: 'triangle isocèle ABC et sa hauteur AH' });
    const G = legOf(c, m);
    return { type: 'nums', tpl: `<span>AH =</span>{0}<span>cm</span><span class="sep">Aire =</span>{1}<span>cm²</span>`, labels: ['AH', 'aire'],
      check: lensCheck([h, Aire], [{ exact: h, mode: 'leg', known: [c, m] }, { exact: Aire }]), value: dist(pts.B, pts.C) * dist(pts.A, pts.H) / 2,
      html: `ABC est isocèle en A avec AB = AC = ${L(c)} et BC = ${L(2 * m)}. H est le milieu de [BC] et (AH) est perpendiculaire à (BC).<br>Calcule la hauteur AH, puis l'<b>aire</b> du triangle ABC.`,
      visual,
      hint: `Le triangle ABH est rectangle en H, d'hypoténuse [AB] ; BH = ${M(2 * m)} ÷ 2 = ${M(m)} cm. Puis aire = base × hauteur ÷ 2.`,
      solution: `${solLeg({ n: 'ABH', R: 'H', P: 'B', Q: 'A' }, c, m, G, 'cm', `H est le milieu de [BC], donc BH = ${M(m)} cm. `)}<br>Aire = BC × AH ÷ 2 = ${M(2 * m)} × ${M(h)} ÷ 2 = <b>${M(Aire)} cm²</b>.`,
      verify: E => Math.abs(E[0] - Math.sqrt(c * c - m * m)) < 1e-9 && Math.abs(E[1] - 2 * m * E[0] / 2) < 1e-9 };
  }
  // deux triangles accolés : ABC rectangle en B, ACD rectangle en C
  const t = pick([[3, 4, 5], [4, 3, 5], [6, 8, 10], [8, 6, 10], [9, 12, 15], [12, 9, 15]]);
  const [AB, BC, AC] = t, CD = d >= 3 ? ri(2, 9) : { 5: 12, 10: 24, 15: 20 }[AC];
  const AD = hypOf(AC, CD);
  const ptsB = { A: [0, AB], B: [0, 0], C: [BC, 0] };
  const nrm = [AB / AC, BC / AC]; // unitaire, perpendiculaire à (AC), du côté opposé à B
  ptsB.D = [BC + nrm[0] * CD, nrm[1] * CD];
  const rot = d < 1 ? 0 : ri(0, 359), pts = {}; for (const kk of 'ABCD') pts[kk] = rotate(ptsB[kk], rot);
  const visual = figure({ pts, polys: [['A', 'B', 'C'], ['A', 'C', 'D']], rights: [['B', 'A', 'C'], ['C', 'A', 'D']], flip: chance(0.5),
    sides: [{ k: 'AB', t: L(AB), away: 'C' }, { k: 'BC', t: L(BC), away: 'A' }, { k: 'CD', t: L(CD), away: 'A' }, { k: 'AD', t: '?', unk: true, away: 'C' }], aria: 'triangles ABC et ACD rectangles' });
  const sym = AD.exact ? '=' : '≈';
  const H1 = hypOf(AB, BC);
  return { type: 'nums', tpl: `<span>AC =</span>{0}<span>cm</span><span class="sep">AD ${sym}</span>{1}<span>cm</span>`, labels: ['AC', 'AD'], keys: { comma: !AD.exact },
    check: lensCheck([AC, AD.E], [{ exact: AC, mode: 'hyp', known: [AB, BC] }, { exact: AD.ex, round: !AD.exact, mode: 'hyp', known: [AC, CD] }]),
    value: AD.exact ? dist(pts.A, pts.D) : r1(dist(pts.A, pts.D)),
    html: `ABC est rectangle en B, ACD est rectangle en C. AB = ${L(AB)}, BC = ${L(BC)} et CD = ${L(CD)}.<br>Calcule AC, puis AD${AD.exact ? '' : ` (${ROUND.replace('arrondie', 'arrondi')})`}.`,
    visual,
    hint: `Étape 1 : dans ABC (rectangle en B), calcule l'hypoténuse AC. Étape 2 : dans ACD (rectangle en C), AC est un côté de l'angle droit et [AD] l'hypoténuse.`,
    solution: `${solHyp({ n: 'ABC', R: 'B', P: 'A', Q: 'C' }, AB, BC, H1)}<br>${solHyp({ n: 'ACD', R: 'C', P: 'A', Q: 'D' }, AC, CD, AD)}`,
    verify: E => okRound(E[0], Math.hypot(AB, BC), false) && okRound(E[1], Math.hypot(Math.hypot(AB, BC), CD), !AD.exact) && Math.abs(cosAt(pts, 'C', 'A', 'D')) < 1e-9 };
}
function C11() {
  const pts = { A: [0, 4], B: [-3, 0], C: [3, 0], H: [0, 0] };
  const iso = figure({ pts, polys: [['A', 'B', 'C']], segs: [{ k: 'AH', dash: true }], rights: [['H', 'A', 'C']], sides: [{ k: 'AB', t: '5 cm', away: 'C' }, { k: 'AC', t: '5 cm', away: 'B' }, { k: 'BH', t: '3 cm', away: 'A' }, { k: 'HC', t: '3 cm', away: 'A' }, { k: 'AH', t: '?', unk: true, away: 'C' }], aria: 'triangle isocèle et sa hauteur' });
  const P2 = { A: [0, 3], B: [0, 0], C: [4, 0] }; P2.D = [4 + (3 / 5) * 12, (4 / 5) * 12]; // [CD] perpendiculaire à [AC], CD = 12
  const two = figure({ pts: P2, polys: [['A', 'B', 'C'], ['A', 'C', 'D']], rights: [['B', 'A', 'C'], ['C', 'A', 'D']], sides: [{ k: 'AB', t: '3 cm', away: 'C' }, { k: 'BC', t: '4 cm', away: 'A' }, { k: 'CD', t: '12 cm', away: 'A' }, { k: 'AD', t: '?', unk: true, away: 'C' }], aria: 'triangles ABC et ACD rectangles accolés' });
  return `<h2>11. Problèmes à deux étapes</h2>
<p class="intro">Souvent, Pythagore ne donne pas directement la réponse : il fournit une longueur <b>intermédiaire</b> qu'on réutilise ensuite.</p>
<div class="def">Étape 1 : Pythagore dans un triangle rectangle où deux longueurs sont connues.<br>Étape 2 : on se sert du résultat pour un <b>périmètre</b> (somme des 3 côtés), une <b>aire</b> (triangle rectangle : côté × côté de l'angle droit ÷ 2 ; triangle : base × hauteur ÷ 2) ou un <b>deuxième Pythagore</b>.</div>
<div class="cols">${iso}${two}</div>
<div class="methode"><b>Méthode</b><ol><li>Repère le triangle rectangle dans lequel deux longueurs sont connues.</li><li>Calcule la longueur manquante avec Pythagore (addition ou soustraction).</li><li>Utilise-la dans la deuxième étape : périmètre, aire ou autre triangle rectangle.</li><li>Garde la valeur exacte (ou la calculatrice) et n'arrondis qu'à la fin.</li></ol></div>
<div class="ex"><span class="q">Exemple 1 (périmètre) : ABC rectangle en A, AB = 4 cm, AC = 7 cm.</span><br>${sq('BC')} = 16 + 49 = 65, BC = ${R(65)} ≈ 8,06… ≈ 8,1 cm.<br>Périmètre = 4 + 7 + ${R(65)} ≈ 19,06… ≈ <b>19,1 cm</b>.</div>
<div class="ex"><span class="q">Exemple 2 (isocèle) : ABC isocèle en A, AB = 5 cm, BC = 6 cm, H milieu de [BC].</span><br>BH = 6 ÷ 2 = 3 cm. ABH est rectangle en H : ${sq('AH')} = ${sqn(5)} − ${sqn(3)} = 25 − 9 = 16, AH = 4 cm.<br>Aire = BC × AH ÷ 2 = 6 × 4 ÷ 2 = <b>12 cm²</b>.</div>
<div class="ex"><span class="q">Exemple 3 (deux triangles) : ABC rectangle en B, ACD rectangle en C, AB = 3 cm, BC = 4 cm, CD = 12 cm.</span><br>Dans ABC : ${sq('AC')} = 9 + 16 = 25, AC = 5 cm.<br>Dans ACD, [AD] est l'hypoténuse : ${sq('AD')} = ${sqn(5)} + ${sqn(12)} = 25 + 144 = 169, AD = <b>13 cm</b>.</div>
<div class="warn">⚠️ Garde la valeur <b>exacte</b> pour la deuxième étape (par exemple ${sq('AC')} = 25), et n'arrondis qu'à la fin.<br>⚠️ À chaque étape, repère bien l'hypoténuse du triangle utilisé : elle change d'un triangle à l'autre.<br>⚠️ L'aire d'un triangle rectangle utilise les deux côtés de l'angle droit, pas l'hypoténuse ; dans l'isocèle, BH est la <b>moitié</b> de BC.</div>
<div class="retenir">À retenir : d'abord la longueur intermédiaire avec Pythagore, ensuite le calcul demandé.</div>`;
}

/* ======================================================================
   12. Défis
   ====================================================================== */
function L12(d) {
  const v = d < 1 ? pick([0, 1]) : d < 2 ? pick([0, 1, 2, 4]) : pick([0, 1, 2, 3, 4, 5]);
  if (v === 0) { // distance dans un repère
    const lo = d >= 2 ? -5 : 0, hi = d >= 2 ? 5 : 7;
    let A, B; do { A = [ri(lo, hi), ri(lo, hi)]; B = [ri(lo, hi), ri(lo, hi)]; } while (A[0] === B[0] || A[1] === B[1] || !A[0] || !A[1] || !B[0] || !B[1] || Math.abs(A[0] - B[0]) < 2 || Math.abs(A[1] - B[1]) < 2);
    const dx = Math.abs(B[0] - A[0]), dy = Math.abs(B[1] - A[1]), H = hypOf(dx, dy);
    const ex = Math.hypot(B[0] - A[0], B[1] - A[1]);
    const P = p => `(${M(p[0])} ; ${M(p[1])})`;
    return { type: 'nums', tpl: `AB ${H.exact ? '=' : '≈'} {0}`, keys: { comma: true }, check: lensCheck([H.E], [{ exact: H.ex, round: true, mode: 'hyp', known: [dx, dy] }]),
      value: H.exact ? ex : r1(ex),
      html: `Dans un repère orthonormé (unité : 1 carreau), on place A${P(A)} et B${P(B)}.<br>Calcule la longueur AB (${ROUND} si besoin).`,
      visual: repere(A, B), afterVisual: repere(A, B, { tri: [String(dx), String(dy)] }), replaceVisual: true,
      hint: `Trace le triangle rectangle qui a [AB] pour hypoténuse, avec un côté horizontal et un côté vertical. Compte les carreaux de chaque côté.`,
      solution: `Côté horizontal : ${dx} carreaux ; côté vertical : ${dy} carreaux.<br>${sq('AB')} = ${sqn(dx)} + ${sqn(dy)} = ${dx * dx} + ${dy * dy} = ${dx * dx + dy * dy}<br>AB = ${R(dx * dx + dy * dy)} ${H.exact ? `= <b>${M(H.E)}</b>` : `≈ ${M(trunc2(H.ex))}… ≈ <b>${D1(H.E)}</b>`}`,
      verify: E => okRound(E[0], ex, !H.exact) };
  }
  if (v === 1 || v === 3) { // carré : diagonale, ou côté à partir de la diagonale
    const inv = v === 3;
    const c = ri(3, 15), D = ri(5, 20);
    const pts = { A: [0, 1], B: [0, 0], C: [1, 0], D: [1, 1] };
    const ex = inv ? D / Math.SQRT2 : c * Math.SQRT2;
    const E = r1(ex);
    const sides = inv ? [{ k: 'AC', t: L(D), away: 'D' }, { k: 'BC', t: '?', unk: true, away: 'A' }] : [{ k: 'AB', t: L(c), away: 'C' }, { k: 'BC', t: L(c), away: 'A' }, { k: 'AC', t: '?', unk: true, away: 'D' }];
    const visual = figure({ pts, polys: [['A', 'B', 'C', 'D']], segs: [{ k: 'AC' }], rights: [['B', 'A', 'C']], sides, rot: d < 2 ? 0 : ri(0, 359), aria: 'carré ABCD et sa diagonale' });
    return { type: 'nums', tpl: inv ? 'côté ≈ {0} cm' : 'AC ≈ {0} cm', keys: { comma: true },
      check: lensCheck([E], [{ exact: ex, round: true, mode: inv ? 'leg' : 'hyp', known: inv ? [D, D] : [c, c] }]),
      value: r1(inv ? Math.sqrt(D * D / 2) : Math.hypot(c, c)),
      html: inv ? `La diagonale d'un carré ABCD mesure ${L(D)}. Quelle est la longueur de son <b>côté</b> (${ROUND}) ?` : `ABCD est un carré de côté ${L(c)}. Calcule la longueur de sa diagonale [AC] (${ROUND}).`,
      visual,
      hint: inv ? `Appelle c le côté : ABC est rectangle en B, donc c² + c² = ${sq('AC')}, soit 2 × c² = ${D * D}.` : `ABC est rectangle en B (angle d'un carré) : ${sq('AC')} = ${sq('AB')} + ${sq('BC')}.`,
      solution: inv ? `ABC est rectangle en B et AB = BC = c : c² + c² = ${sqn(D)} = ${D * D}, donc 2c² = ${D * D}, c² = ${M(D * D / 2)}<br>c = ${R(M(D * D / 2))} ≈ ${M(trunc2(ex))}… ≈ <b>${D1(E)} cm</b>`
        : `ABC est rectangle en B : ${sq('AC')} = ${sqn(c)} + ${sqn(c)} = ${c * c} + ${c * c} = ${2 * c * c}<br>AC = ${R(2 * c * c)} ≈ ${M(trunc2(ex))}… ≈ <b>${D1(E)} cm</b>`,
      verify: e => okRound(e[0], inv ? Math.hypot(D, 0) / Math.hypot(1, 1) : Math.hypot(c, c), true) };
  }
  if (v === 2) { // hauteur d'un triangle équilatéral
    const c = ri(2, 15) * (d >= 3 && chance(0.5) ? 1 : 2), m = c / 2;
    const ex = Math.sqrt(c * c - m * m), E = r1(ex);
    const pts = { A: [0, ex], B: [-m, 0], C: [m, 0], H: [0, 0] };
    const visual = figure({ pts, polys: [['A', 'B', 'C']], segs: [{ k: 'AH', dash: true }], rights: [['H', 'A', 'C']],
      sides: [{ k: 'AB', t: L(c), away: 'C' }, { k: 'AC', t: L(c), away: 'B' }, { k: 'BH', t: L(m), away: 'A' }, { k: 'AH', t: '?', unk: true, away: 'C' }], aria: 'triangle équilatéral et sa hauteur' });
    const G = legOf(c, m);
    return { type: 'nums', tpl: 'AH ≈ {0} cm', keys: { comma: true }, check: lensCheck([G.E], [{ exact: G.ex, round: true, mode: 'leg', known: [c, m] }]),
      value: r1(dist(pts.A, pts.H) * 1), html: `ABC est un triangle <b>équilatéral</b> de côté ${L(c)}. H est le milieu de [BC]. Calcule la hauteur AH (${ROUND}).`,
      visual, hint: `Dans un triangle équilatéral, la hauteur (AH) tombe au milieu de [BC] : ABH est rectangle en H, avec BH = ${M(m)} cm.`,
      solution: solLeg({ n: 'ABH', R: 'H', P: 'B', Q: 'A' }, c, m, G, 'cm', `H est le milieu de [BC] : BH = ${M(m)} cm. `),
      verify: e => okRound(e[0], c * Math.sqrt(3) / 2, true) && E === e[0] };
  }
  if (v === 4) { // pavé droit
    const t = pick([[3, 4, 5], [6, 8, 10], [4, 3, 5], [5, 12, 13], [8, 6, 10]]), [Lg, lg, AC] = t, h = ri(2, 9);
    const G = hypOf(AC, h), sym = G.exact ? '=' : '≈';
    return { type: 'nums', tpl: `<span>AC =</span>{0}<span>cm</span><span class="sep">AG ${sym}</span>{1}<span>cm</span>`, labels: ['AC', 'AG'], keys: { comma: !G.exact },
      check: lensCheck([AC, G.E], [{ exact: AC, mode: 'hyp', known: [Lg, lg] }, { exact: G.ex, round: !G.exact, mode: 'hyp', known: [AC, h] }]),
      value: G.exact ? Math.hypot(Lg, lg, h) : r1(Math.hypot(Lg, lg, h)),
      html: `ABCDEFGH est un pavé droit : AB = ${L(Lg)}, BC = ${L(lg)} et CG = ${L(h)}.<br>Calcule la diagonale AC de la base, puis la grande diagonale AG${G.exact ? '' : ` (${ROUND.replace('arrondie', 'arrondi')})`}.`,
      visual: pave(Lg, lg, h, { L: L(Lg), l: L(lg), h: L(h) }, { diag: true, base: true }),
      hint: `ABC est rectangle en B (dans la base) : calcule AC. Puis ACG est rectangle en C (l'arête [CG] est verticale) : AG est son hypoténuse.`,
      solution: `${solHyp({ n: 'ABC', R: 'B', P: 'A', Q: 'C' }, Lg, lg, hypOf(Lg, lg))}<br>${solHyp({ n: 'ACG', R: 'C', P: 'A', Q: 'G' }, AC, h, G, 'cm', '[CG] est perpendiculaire à la base. ')}`,
      verify: E => okRound(E[0], Math.hypot(Lg, lg), false) && okRound(E[1], Math.hypot(Lg, lg, h), !G.exact) };
  }
  // échelle qui glisse
  const t = pick([[3, 4, 5], [6, 8, 10], [1.5, 2, 2.5], [1.8, 2.4, 3], [2.4, 3.2, 4]]);
  const [e1, h1, Lc] = t, s = ri(2, 8) / 10, e2 = r6(e1 + s);
  const G = legOf(Lc, e2);
  const pts = { A: [0, h1], B: [0, 0], C: [e1, 0], D: [0, G.ex], E: [e2, 0] };
  const visual = figure({ pts, polys: [['A', 'B', 'C']], segs: [{ k: 'DE', c: '#c2255c', dash: true, sw: 2.5 }], rights: [['B', 'A', 'C']],
    vdir: { D: [1, 0.2] }, sides: [{ k: 'AB', t: L(h1, 'm'), away: 'C', gapU: h1 * 0.06 }, { k: 'AC', t: L(Lc, 'm'), away: 'B' }], decor: decorMur(h1, e2 * 1.3), aria: "échelle qui glisse le long d'un mur" });
  return { type: 'nums', tpl: `<span>BC =</span>{0}<span>m</span><span class="sep">BD ≈</span>{1}<span>m</span>`, labels: ['BC', 'BD'], keys: { comma: true },
    check: lensCheck([e1, G.E], [{ exact: e1, mode: 'leg', known: [Lc, h1] }, { exact: G.ex, round: true, mode: 'leg', known: [Lc, e2] }]),
    value: r1(Math.sqrt((Lc - e2) * (Lc + e2))),
    html: `Une échelle [AC] de ${L(Lc, 'm')} est appuyée contre un mur ; son sommet A est à ${L(h1, 'm')} du sol (B est le pied du mur). Calcule BC.<br>Le pied de l'échelle glisse de ${L(s, 'm')} en s'éloignant du mur (nouvelle position [DE]). À quelle hauteur BD est maintenant le haut de l'échelle (${ROUND}) ?`,
    visual,
    hint: `Étape 1 : ABC est rectangle en B, calcule BC. Étape 2 : BE = BC + ${M(s)} ; DBE est rectangle en B et DE = ${M(Lc)} m (même échelle).`,
    solution: `${solLeg({ n: 'ABC', R: 'B', P: 'A', Q: 'C' }, Lc, h1, legOf(Lc, h1), 'm')}<br>BE = ${M(e1)} + ${M(s)} = ${M(e2)} m.<br>${solLeg({ n: 'BDE', R: 'B', P: 'E', Q: 'D' }, Lc, e2, G, 'm')}`,
    verify: E => okRound(E[0], Math.sqrt(Lc * Lc - h1 * h1), false) && okRound(E[1], Math.sqrt(Lc * Lc - (E[0] + s) ** 2), true) };
}
function C12() {
  return `<h2>12. Défis</h2>
<p class="intro">On réutilise tout : repérer un triangle rectangle caché, calculer, arrondir, raisonner en deux étapes.</p>
<div class="def">• Dans un <b>repère</b>, AB est l'hypoténuse d'un triangle rectangle dont on compte les côtés en carreaux.<br>• Dans un <b>carré</b> de côté c, la diagonale d vérifie d² = c² + c² = 2c².<br>• Dans un triangle <b>équilatéral</b>, la hauteur tombe au milieu du côté opposé.<br>• Dans un <b>pavé droit</b>, on calcule d'abord la diagonale de la base, puis la grande diagonale.</div>
<div class="cols">${repere([-2, 2], [2, 5], { tri: ['4', '3'] })}${pave(4, 3, 4, { L: '4 cm', l: '3 cm', h: '4 cm' }, { diag: true, base: true })}</div>
<div class="methode"><b>Méthode</b><ol><li>Cherche le triangle rectangle caché (carreaux, coin du carré, hauteur, arête verticale du pavé, mur).</li><li>Note ce que tu connais : deux côtés de l'angle droit, ou l'hypoténuse et un côté.</li><li>Applique Pythagore, éventuellement deux fois.</li><li>Arrondis au dixième seulement à la fin.</li></ol></div>
<div class="ex"><span class="q">Exemple 1 (repère) : A(−2 ; 2) et B(2 ; 5).</span><br>Horizontalement : 2 − (−2) = 4 carreaux ; verticalement : 5 − 2 = 3 carreaux.<br>${sq('AB')} = ${sqn(4)} + ${sqn(3)} = 16 + 9 = 25, AB = <b>5</b>.</div>
<div class="ex"><span class="q">Exemple 2 (carré) : la diagonale d'un carré mesure 10 cm. Son côté c ?</span><br>c² + c² = ${sqn(10)}, donc 2c² = 100, c² = 50, c = ${R(50)} ≈ <b>7,1 cm</b>.</div>
<div class="ex"><span class="q">Exemple 3 (équilatéral) : côté 6 cm, hauteur AH ?</span><br>BH = 3 cm et ABH est rectangle en H : ${sq('AH')} = 36 − 9 = 27, AH = ${R(27)} ≈ 5,19… ≈ <b>5,2 cm</b>.</div>
<div class="ex"><span class="q">Exemple 4 (pavé) : AB = 4 cm, BC = 3 cm, CG = 4 cm.</span><br>Base : ${sq('AC')} = 16 + 9 = 25, AC = 5 cm. ACG est rectangle en C : ${sq('AG')} = 25 + 16 = 41, AG ≈ <b>6,4 cm</b>.</div>
<div class="warn">⚠️ Une échelle qui glisse garde la même longueur : c'est l'hypoténuse dans les deux positions.<br>⚠️ Avec des coordonnées négatives, compte bien les carreaux : de −2 à 2, il y a 4 carreaux, pas 0.<br>⚠️ N'arrondis pas les résultats intermédiaires.</div>
<div class="retenir">À retenir : dans chaque défi, il y a un triangle rectangle caché ; trouve-le, et Pythagore fait le reste.</div>`;
}

export const LEVELS = [
  { titre: "Repérer l'hypoténuse", generate: L1, cours: C1, classe: '4e' },
  { titre: 'Carrés et racines carrées', generate: L2, cours: C2, classe: '4e' },
  { titre: "Écrire l'égalité de Pythagore", generate: L3, cours: C3, classe: '4e' },
  { titre: "Calculer l'hypoténuse", generate: L4, cours: C4, classe: '4e' },
  { titre: 'Hypoténuse : arrondir au dixième', generate: L5, cours: C5, classe: '4e' },
  { titre: "Calculer un côté de l'angle droit", generate: L6, cours: C6, classe: '4e' },
  { titre: "Côté de l'angle droit : arrondir", generate: L7, cours: C7, classe: '4e' },
  { titre: 'Pythagore en situation', generate: L8, cours: C8, classe: '4e' },
  { titre: 'Réciproque : prouver un angle droit', generate: L9, cours: C9, classe: '4e' },
  { titre: 'Rectangle ou pas ? (contraposée)', generate: L10, cours: C10, classe: '4e' },
  { titre: 'Problèmes à deux étapes', generate: L11, cours: C11, classe: '4e' },
  { titre: 'Défis', generate: L12, cours: C12, classe: '4e / 3e' },
];
export const OPTIONS = { need: 4, keys: { neg: false, comma: false } };

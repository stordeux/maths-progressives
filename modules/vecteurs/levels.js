// Vecteurs et droites (2de) : 12 niveaux, de la lecture d'un vecteur sur un quadrillage
// jusqu'à l'intersection de deux droites.
// Vérifications indépendantes (verify / value) : elles ne recopient pas la formule de la réponse.
// Les vecteurs sont recalculés en coordonnées POLAIRES (r cos θ, r sin θ, avec r et θ tirés de hypot / atan2),
// les points par des critères GÉOMÉTRIQUES (même milieu pour les diagonales d'un parallélogramme,
// égalité AI = IB = AB ÷ 2 pour un milieu, points de l'énoncé qui vérifient l'équation proposée…).
// Visuels : une figure dans un repère orthonormé quadrillé pour chaque exercice (draw.js).
import { ri, pick, nz, chance } from '../../engine/util/rand.js';
import { numsCheck, choiceCheck } from '../../engine/answers/checks.js';
import { M, P, F, big, terms } from '../../engine/util/fmt.js';
import { r6, gcd } from '../../engine/util/arith.js';
import { grille, fen, C } from './draw.js';

/* ================= outils ================= */
const near = (a, b, t = 1e-7) => a !== null && b !== null && a !== undefined && b !== undefined && Math.abs(a - b) <= t * Math.max(1, Math.abs(a), Math.abs(b));
const eq2 = (v, w) => near(v[0], w[0]) && near(v[1], w[1]);
/** combinaison Σ k·(x ; y) recalculée en coordonnées polaires */
const comb = list => list.reduce((s, [k, x, y]) => { const r = Math.hypot(x, y), t = Math.atan2(y, x); return [s[0] + k * r * Math.cos(t), s[1] + k * r * Math.sin(t)]; }, [0, 0]);
/** le point S translaté du vecteur E (en polaire) tombe-t-il sur T ? */
const lands = (S, E, T) => { const w = comb([[1, E[0], E[1]]]); return eq2([S[0] + w[0], S[1] + w[1]], T); };
const dist = (A, B) => Math.hypot(B[0] - A[0], B[1] - A[1]);
/** [P1P2] et [Q1Q2] ont-ils le même milieu ? (critère du parallélogramme) */
const sameMid = (P1, P2, Q1, Q2) => eq2([(P1[0] + P2[0]) / 2, (P1[1] + P2[1]) / 2], [(Q1[0] + Q2[0]) / 2, (Q1[1] + Q2[1]) / 2]);
const sinAng = (a, b, c, d) => Math.sin(Math.atan2(d, c) - Math.atan2(b, a));
const empty = v => v.some(x => x === null || x === undefined);
/** check « cases » avec un message ciblé */
const chk = (E, msg) => numsCheck(E, { msg: v => (empty(v) ? '' : (msg && msg(v)) || '') });
const add = (A, B) => [A[0] + B[0], A[1] + B[1]];
const sub = (A, B) => [A[0] - B[0], A[1] - B[1]];

/* ================= écriture ================= */
/** nom de vecteur surmonté d'une flèche (HTML) */
// la flèche est en position absolue : elle ne change pas la largeur du nom
const ARR = '<svg viewBox="0 0 20 6" preserveAspectRatio="none" aria-hidden="true" style="position:absolute;left:0;top:0;width:100%;height:.34em;overflow:visible"><path d="M0.5,3H18.5M14.5,0.6L19.2,3L14.5,5.4" fill="none" stroke="currentColor" stroke-width="1.4" vector-effect="non-scaling-stroke" stroke-linecap="round" stroke-linejoin="round"/></svg>';
const V = n => `<span style="position:relative;display:inline-block;line-height:1;padding-top:.32em">${ARR}${n}</span>`;
const cp = (x, y) => `(${M(x)} ; ${M(y)})`;
const pt = (n, A) => `${n}${cp(A[0], A[1])}`;
const vc = (n, u) => `${V(n)}${cp(u[0], u[1])}`;
const xs = n => `x<sub>${n}</sub>`, ys = n => `y<sub>${n}</sub>`;
const sg = v => (v > 0 ? '+' : '') + M(v);
const TPLV = n => `${V(n)} ( {0} ; {1} )`;
const TPLP = n => `${n} ( {0} ; {1} )`;
/** équation ax + by + c = 0 */
const cart = (a, b, c) => `${terms([[a, 'x'], [b, 'y'], [c, '']])} = 0`;
/** équation réduite y = mx + p */
const red = (m, p) => `y = ${terms([[m, 'x'], [p, '']])}`;
/** quotient n ÷ q écrit en fraction irréductible (ou en entier) */
const kfr = (n, q) => { const g = gcd(n, q) || 1, s = (n < 0) !== (q < 0) ? -1 : 1, a = Math.abs(n) / g, b = Math.abs(q) / g; return b === 1 ? M(s * a) : (s < 0 ? '−' : '') + F(a, b); };
const ex = t => `<div class="ex">${t}</div>`;
// briques des encarts de cours
const exq = (n, q, t) => ex(`<span class="q">Exemple ${n} : ${q}</span><br>${t}`);
const meth = steps => `<div class="methode"><b>Méthode</b><ol>${steps.map(s => `<li>${s}</li>`).join('')}</ol></div>`;
const cols = (...a) => `<div class="cols">${a.join('')}</div>`;
const warn = list => `<div class="warn">${list.map(s => `⚠️ ${s}`).join('<br>')}</div>`;
const retenir = s => `<div class="retenir">À retenir : ${s}</div>`;
/** sens d'un déplacement */
const hor = a => (a > 0 ? `${M(a)} vers la droite` : a < 0 ? `${M(-a)} vers la gauche` : 'aucun déplacement horizontal');
const ver = b => (b > 0 ? `${M(b)} vers le haut` : b < 0 ? `${M(-b)} vers le bas` : 'aucun déplacement vertical');
/** plusieurs vecteurs posés côte à côte (sans se chevaucher), centrés autour de l'axe des ordonnées */
function rang(list) {
  let x = 0;
  const out = list.map(([dx, dy, l, c]) => { const t = { x: x - Math.min(0, dx), y: -Math.round(dy / 2), dx, dy, l, c }; x += Math.max(1, Math.abs(dx)) + 2; return t; });
  const sh = -Math.round((x - 2) / 2);
  out.forEach(t => { t.x += sh; });
  return out;
}
/** fenêtre contenant des vecteurs et des points */
function fenV(vecs = [], pts = [], m = 1) {
  const X = [], Y = [];
  vecs.forEach(v => { X.push(v.x, v.x + v.dx); Y.push(v.y, v.y + v.dy); });
  pts.forEach(p => { X.push(p[0]); Y.push(p[1]); });
  return fen(X, Y, m);
}
/** position de l'étiquette d'un point posé sur le segment [AB] : perpendiculairement au segment */
const perp = (A, B) => { const dx = B[0] - A[0], dy = B[1] - A[1]; return !dx ? 'e' : !dy ? 'n' : dx * dy > 0 ? 'se' : 'ne'; };
const ctr = list => [list.reduce((s, p) => s + p[0], 0) / list.length, list.reduce((s, p) => s + p[1], 0) / list.length];

/* =====================================================================
   1. Lire les coordonnées d'un vecteur
   ===================================================================== */
function L1(d) {
  let a, b;
  do {
    if (d < 1) { a = ri(1, 4); b = ri(1, 4); }
    else if (d < 2) { a = nz(-4, 4); b = nz(-4, 4); }
    else if (d < 3) { a = nz(-5, 5); b = nz(-5, 5); }
    else { a = ri(-6, 6); b = ri(-6, 6); }
  } while ((a === 0 && b === 0) || (d === 1 && a < 0 && b < 0) || (d >= 3 && Math.abs(a) + Math.abs(b) < 3));
  const name = d >= 4 ? pick(['v', 'w']) : 'u';
  const T0 = [ri(-3, 3) - (a > 3 ? 2 : 0) + (a < -3 ? 2 : 0), ri(-3, 3) - (b > 3 ? 2 : 0) + (b < -3 ? 2 : 0)], H = add(T0, [a, b]);
  const vec = { x: T0[0], y: T0[1], dx: a, dy: b, l: `{${name}}`, c: C.u };
  const W = fenV([vec]);
  return {
    type: 'nums',
    html: `Lis sur le quadrillage les <b>coordonnées</b> du vecteur ${V(name)}.`,
    visual: grille({ ...W, vecs: [vec] }),
    afterVisual: grille({ ...W, vecs: [vec], steps: [{ x: T0[0], y: T0[1], dx: a, dy: b }] }), replaceVisual: true,
    tpl: TPLV(name),
    check: chk([a, b], v => {
      if (a !== b && near(v[0], b) && near(v[1], a)) return "Tu as inversé l'ordre : d'abord le déplacement <b>horizontal</b> (x), puis le <b>vertical</b> (y).";
      if (near(v[0], -a) && near(v[1], -b)) return 'Regarde le sens de la flèche : on va du <b>départ</b> vers la <b>pointe</b>.';
      if (near(Math.abs(v[0]), Math.abs(a)) && near(Math.abs(v[1]), Math.abs(b))) return 'Les longueurs sont bonnes ; vérifie les signes : vers la gauche ou vers le bas, la coordonnée est <b>négative</b>.';
      return '';
    }),
    verify: E => lands(T0, E, H),
    hint: 'Pars du <b>départ</b> de la flèche et compte les carreaux jusqu\'à la <b>pointe</b> : d\'abord horizontalement (→ positif, ← négatif), puis verticalement (↑ positif, ↓ négatif).',
    solution: `Du départ à la pointe : ${hor(a)}, puis ${ver(b)}.<br>Donc ${V(name)}(<b>${M(a)} ; ${M(b)}</b>).`,
  };
}
function C1() {
  const vec = { x: -3, y: -1, dx: 4, dy: 3, l: '{u}', c: C.u }, v2 = { x: 2, y: 3, dx: 3, dy: -4, l: '{v}', c: C.v };
  const w = { x: 3, y: 2, dx: -5, dy: 0, l: '{w}', c: C.w }, u2 = { x: -3, y: -3, dx: 4, dy: 3, l: '{u}', c: C.u, side: -1 };
  return `<h2>1. Coordonnées d'un vecteur</h2>
<p class="intro">Un vecteur, c'est un déplacement. Ses coordonnées disent « de combien » on bouge : c'est la base de tout le chapitre.</p>
<div class="def">Un <b>vecteur</b> représente un <b>déplacement</b> : une direction, un sens et une longueur.<br>Ses <b>coordonnées</b> (x ; y) disent de combien on se déplace :<br>• <b>x</b> : horizontalement (positif vers la droite, négatif vers la gauche) ;<br>• <b>y</b> : verticalement (positif vers le haut, négatif vers le bas).</div>
${meth(['Repère le <b>départ</b> de la flèche (le bout sans pointe) et sa <b>pointe</b>.', 'Compte les carreaux <b>horizontalement</b>, du départ jusqu\'à être juste au-dessus (ou au-dessous) de la pointe : → positif, ← négatif. C\'est <b>x</b>.', 'Compte ensuite <b>verticalement</b>, jusqu\'à la pointe : ↑ positif, ↓ négatif. C\'est <b>y</b>.', 'Écris (x ; y) dans cet ordre. Pas de déplacement dans un sens ? La coordonnée vaut <b>0</b>.'])}
${exq(1, 'une flèche qui monte', `${V('u')} avance de 4 carreaux vers la droite et monte de 3 : <b>${V('u')}(4 ; 3)</b>.`)}
${exq(2, 'des signes moins', `${V('v')} avance de 3 vers la droite et <b>descend</b> de 4 : <b>${V('v')}(3 ; −4)</b>.<br>${V('w')} recule de 5 vers la gauche et ne monte pas : <b>${V('w')}(−5 ; 0)</b>.`)}
${cols(grille({ xr: [-4, 6], yr: [-3, 4], vecs: [vec, v2], steps: [{ x: -3, y: -1, dx: 4, dy: 3 }, { x: 2, y: 3, dx: 3, dy: -4, c: C.v }], aria: 'vecteurs u et v avec leurs déplacements' }),
    grille({ xr: [-4, 5], yr: [-4, 3], vecs: [w, u2, { x: 0, y: -2, dx: 4, dy: 3, l: '{u}', c: C.u, side: -1 }], aria: 'vecteur w horizontal et deux flèches du même vecteur u' }))}
<p class="note">À droite : deux flèches parallèles, de même sens et de même longueur représentent le <b>même</b> vecteur ${V('u')}(4 ; 3). Un vecteur ne dépend pas de l'endroit où on le dessine.</p>
${warn(['On compte du <b>départ</b> vers la <b>pointe</b> de la flèche, jamais l\'inverse (sinon tous les signes sont faux).', 'L\'ordre compte : d\'abord x (horizontal), puis y (vertical).', 'Vers la gauche ou vers le bas, la coordonnée est <b>négative</b>.'])}
${retenir(`${V('u')}(x ; y) : x carreaux en horizontal, puis y carreaux en vertical, du départ vers la pointe.`)}`;
}

/* =====================================================================
   2. Coordonnées du vecteur AB
   ===================================================================== */
function L2(d) {
  const R = d < 2 ? [0, 6] : d < 4 ? [-6, 6] : [-7, 7];
  let A, B;
  do { A = [ri(...R), ri(...R)]; B = [ri(...R), ri(...R)]; }
  while ((A[0] === B[0] && A[1] === B[1]) || (d < 1 && (B[0] < A[0] || B[1] < A[1])) || (d >= 3 && (A[0] === B[0] || A[1] === B[1])) || dist(A, B) < 2.5 || Math.abs(A[0] - B[0]) > 10 || Math.abs(A[1] - B[1]) > 10);
  const rev = d >= 4 && chance(0.5);
  const [S, T, ns, nt] = rev ? [B, A, 'B', 'A'] : [A, B, 'A', 'B'];
  const E = sub(T, S), W = fen([A[0], B[0]], [A[1], B[1]]), ce = ctr([A, B]);
  const pts = [{ x: A[0], y: A[1], l: 'A' }, { x: B[0], y: B[1], l: 'B' }];
  return {
    type: 'nums',
    html: `On donne ${pt('A', A)} et ${pt('B', B)}.<br>Calcule les coordonnées du vecteur ${V(ns + nt)}.`,
    visual: grille({ ...W, pts, center: ce }),
    afterVisual: grille({ ...W, pts, center: ce, vecs: [{ x: S[0], y: S[1], dx: E[0], dy: E[1], c: C.u }], steps: [{ x: S[0], y: S[1], dx: E[0], dy: E[1] }] }), replaceVisual: true,
    tpl: TPLV(ns + nt),
    check: chk(E, v => {
      if (near(v[0], -E[0]) && near(v[1], -E[1])) return `Tu as fait départ − arrivée. Pour ${V(ns + nt)}, c'est <b>arrivée − départ</b> : ${xs(nt)} − ${xs(ns)}.`;
      if (near(v[0], S[0] + T[0]) && near(v[1], S[1] + T[1])) return 'On <b>soustrait</b> les coordonnées, on ne les additionne pas.';
      return '';
    }),
    verify: Ev => lands(S, Ev, T),
    hint: `${V(ns + nt)} va de ${ns} (départ) à ${nt} (arrivée) : ses coordonnées sont <b>(${xs(nt)} − ${xs(ns)} ; ${ys(nt)} − ${ys(ns)})</b>.`,
    solution: `${V(ns + nt)}(${xs(nt)} − ${xs(ns)} ; ${ys(nt)} − ${ys(ns)}) = (${M(T[0])} − ${P(S[0])} ; ${M(T[1])} − ${P(S[1])}) = (<b>${M(E[0])} ; ${M(E[1])}</b>).<br>Sur la figure, de ${ns} à ${nt} : ${hor(E[0])}, puis ${ver(E[1])}.`,
  };
}
function C2() {
  return `<h2>2. Le vecteur ${V('AB')}</h2>
<p class="intro">Quand on connaît deux points, on peut calculer le déplacement de l'un à l'autre sans rien dessiner.</p>
<div class="def">Le vecteur ${V('AB')} est le déplacement qui va de <b>A</b> (départ) à <b>B</b> (arrivée).<br>Ses coordonnées : <b>${V('AB')}(${xs('B')} − ${xs('A')} ; ${ys('B')} − ${ys('A')})</b> : « arrivée moins départ ».</div>
${meth([`Repère le <b>départ</b> (première lettre) et l'<b>arrivée</b> (deuxième lettre) : pour ${V('BA')}, on part de B !`, `Calcule x<sub>arrivée</sub> − x<sub>départ</sub>, en mettant les nombres négatifs entre parenthèses.`, `Calcule de même y<sub>arrivée</sub> − y<sub>départ</sub>.`, 'Contrôle sur la figure : le signe de chaque coordonnée doit correspondre au sens du déplacement.'])}
${exq(1, 'des nombres positifs', `A(1 ; 1) et B(4 ; 3) : ${V('AB')}(4 − 1 ; 3 − 1) = <b>(3 ; 2)</b>.`)}
${exq(2, 'avec des négatifs', `A(−2 ; 1) et B(3 ; −1) : ${V('AB')}(3 − (−2) ; −1 − 1) = <b>(5 ; −2)</b>.<br>De A à B : 5 carreaux vers la droite et 2 vers le bas.<br>Et ${V('BA')}(−2 − 3 ; 1 − (−1)) = <b>(−5 ; 2)</b> : le déplacement inverse.`)}
${cols(grille({ xr: [-3, 4], yr: [-2, 2], pts: [{ x: -2, y: 1, l: 'A', pos: 'nw' }, { x: 3, y: -1, l: 'B', pos: 'ne' }], vecs: [{ x: -2, y: 1, dx: 5, dy: -2, l: '{AB}', c: C.u, side: -1 }], steps: [{ x: -2, y: 1, dx: 5, dy: -2 }], aria: 'vecteur AB' }),
    grille({ xr: [-3, 4], yr: [-2, 2], pts: [{ x: -2, y: 1, l: 'A', pos: 'nw' }, { x: 3, y: -1, l: 'B', pos: 'ne' }], vecs: [{ x: 3, y: -1, dx: -5, dy: 2, l: '{BA}', c: C.v, side: -1 }], steps: [{ x: 3, y: -1, dx: -5, dy: 2, c: C.v }], aria: 'vecteur BA, opposé de AB' }))}
${warn([`« Arrivée moins départ », pas l'inverse : départ − arrivée donne ${V('BA')}, avec tous les signes changés.`, 'On <b>soustrait</b> les coordonnées, on ne les additionne pas.', 'Attention aux parenthèses : 3 − (−2) = 3 + 2 = 5.'])}
${retenir(`${V('AB')}(${xs('B')} − ${xs('A')} ; ${ys('B')} − ${ys('A')}) : arrivée moins départ.`)}`;
}

/* =====================================================================
   3. Translation : image d'un point
   ===================================================================== */
function L3(d) {
  if (d >= 4) { // translation qui transforme A en B
    let A, B, Mp;
    do { A = [ri(-5, 3), ri(-5, 3)]; B = add(A, [nz(-4, 4), nz(-4, 4)]); Mp = [ri(-4, 4), ri(-4, 4)]; }
    while (Math.max(...[...B, ...add(Mp, sub(B, A))].map(Math.abs)) > 8 || dist(A, Mp) < 2 || dist(B, Mp) < 2);
    const u = sub(B, A), E = add(Mp, u), W = fen([A[0], B[0], Mp[0], E[0]], [A[1], B[1], Mp[1], E[1]]);
    const base = { ...W, pts: [{ x: A[0], y: A[1], l: 'A', c: C.u }, { x: B[0], y: B[1], l: 'B', c: C.u }, { x: Mp[0], y: Mp[1], l: 'M' }], vecs: [{ x: A[0], y: A[1], dx: u[0], dy: u[1], c: C.u }] };
    return {
      type: 'nums',
      html: `On donne ${pt('A', A)}, ${pt('B', B)} et ${pt('M', Mp)}.<br>M′ est l'image de M par la <b>translation qui transforme A en B</b>. Calcule les coordonnées de M′.`,
      visual: grille(base),
      afterVisual: grille({ ...base, pts: [...base.pts, { x: E[0], y: E[1], l: 'M′', c: C.s }], vecs: [...base.vecs, { x: Mp[0], y: Mp[1], dx: u[0], dy: u[1], c: C.s }], poly: { pts: [A, B, E, Mp], c: '#868e96' } }), replaceVisual: true,
      tpl: TPLP('M′'),
      check: chk(E, v => (eq2(v, u) ? `Ce sont les coordonnées de ${V('AB')}. Il reste à les <b>ajouter</b> à celles de M.` : eq2(v, sub(Mp, u)) ? `Tu as soustrait : on <b>ajoute</b> les coordonnées de ${V('AB')}.` : '')),
      verify: Ev => sameMid(A, Ev, B, Mp) && !eq2(A, B), // ABM′M est un parallélogramme : [AM′] et [BM] ont le même milieu
      hint: `Calcule d'abord ${V('AB')}. Puis ${V('MM′')} = ${V('AB')} : on ajoute ses coordonnées à celles de M.`,
      solution: `${V('AB')}(${M(B[0])} − ${P(A[0])} ; ${M(B[1])} − ${P(A[1])}) = ${cp(u[0], u[1])}.<br>${V('MM′')} = ${V('AB')}, donc M′(${M(Mp[0])} + ${P(u[0])} ; ${M(Mp[1])} + ${P(u[1])}) = M′(<b>${M(E[0])} ; ${M(E[1])}</b>).<br>ABM′M est un parallélogramme.`,
    };
  }
  let u, Mp, T0;
  do {
    u = d < 1 ? [ri(1, 4), ri(1, 4)] : d < 2 ? [nz(-4, 4), nz(-4, 4)] : [nz(-5, 5), ri(-5, 5)];
    Mp = d < 2 ? [ri(-3, 3), ri(-3, 3)] : [ri(-5, 5), ri(-5, 5)];
    T0 = [ri(-5, 3), ri(-5, 3)];
  } while (Math.abs(u[0]) + Math.abs(u[1]) < 3 || Math.max(...add(Mp, u).map(Math.abs), ...add(T0, u).map(Math.abs)) > 8 || dist(T0, Mp) < 2 || dist(add(T0, u), Mp) < 2 || dist(add(T0, u), add(Mp, u)) < 2);
  const E = add(Mp, u), H = add(T0, u);
  const W = fen([T0[0], H[0], Mp[0], E[0]], [T0[1], H[1], Mp[1], E[1]]);
  const vu = { x: T0[0], y: T0[1], dx: u[0], dy: u[1], l: '{u}', c: C.u };
  return {
    type: 'nums',
    html: `M′ est l'image du point ${pt('M', Mp)} par la <b>translation de vecteur</b> ${vc('u', u)}.<br>Calcule les coordonnées de M′.`,
    visual: grille({ ...W, vecs: [vu], pts: [{ x: Mp[0], y: Mp[1], l: 'M' }] }),
    afterVisual: grille({ ...W, vecs: [vu, { x: Mp[0], y: Mp[1], dx: u[0], dy: u[1], c: C.s }], pts: [{ x: Mp[0], y: Mp[1], l: 'M' }, { x: E[0], y: E[1], l: 'M′', c: C.s }], steps: [{ x: Mp[0], y: Mp[1], dx: u[0], dy: u[1] }] }), replaceVisual: true,
    tpl: TPLP('M′'),
    check: chk(E, v => (eq2(v, u) ? `Ce sont les coordonnées de ${V('u')} ; on demande le <b>point d'arrivée</b> M′ = M + ${V('u')}.` : eq2(v, sub(Mp, u)) ? 'Tu as soustrait : on <b>ajoute</b> les coordonnées du vecteur.' : '')),
    verify: Ev => sameMid(T0, Ev, H, Mp), // la flèche de u et MM′ forment un parallélogramme
    hint: `Partir de M et suivre ${V('u')} : ${V('MM′')} = ${V('u')}, donc on <b>ajoute</b> les coordonnées de ${V('u')} à celles de M.`,
    solution: `${V('MM′')} = ${V('u')}, donc M′(${M(Mp[0])} + ${P(u[0])} ; ${M(Mp[1])} + ${P(u[1])}) = M′(<b>${M(E[0])} ; ${M(E[1])}</b>).<br>Depuis M : ${hor(u[0])}, puis ${ver(u[1])}.`,
  };
}
function C3() {
  return `<h2>3. Translation</h2>
<p class="intro">Une translation fait glisser une figure sans la tourner ni la déformer. Avec les coordonnées, trouver l'image d'un point est une simple addition.</p>
<div class="def">L'<b>image</b> d'un point M par la <b>translation de vecteur</b> ${V('u')} est le point M′ tel que <b>${V('MM′')} = ${V('u')}</b> : on fait glisser M en suivant ${V('u')}.<br>Si ${V('u')}(a ; b) et M(x ; y), alors <b>M′(x + a ; y + b)</b>.<br>La translation qui <b>transforme A en B</b> est celle de vecteur ${V('AB')}.</div>
${meth([`Trouve les coordonnées (a ; b) du vecteur de la translation. Si on parle de la translation qui transforme A en B, calcule d'abord ${V('AB')} (arrivée − départ).`, 'Ajoute : x′ = x + a et y′ = y + b.', 'Contrôle sur la figure : M′ est au bout de la flèche partie de M.'])}
${exq(1, 'translation de vecteur donné', `M(−3 ; 2) et ${V('u')}(4 ; −3) : M′(−3 + 4 ; 2 + (−3)) = <b>M′(1 ; −1)</b>.`)}
${exq(2, 'la translation qui transforme A en B', `A(−3 ; −2), B(0 ; −1) et M(−2 ; 2).<br>${V('AB')}(0 − (−3) ; −1 − (−2)) = (3 ; 1).<br>M′(−2 + 3 ; 2 + 1) = <b>M′(1 ; 3)</b>. ABM′M est un <b>parallélogramme</b>.`)}
${cols(grille({ xr: [-4, 3], yr: [-2, 3], pts: [{ x: -3, y: 2, l: 'M', pos: 'nw' }, { x: 1, y: -1, l: 'M′', c: C.s, pos: 'se' }], vecs: [{ x: -3, y: 2, dx: 4, dy: -3, c: C.s, l: '{u}' }], steps: [{ x: -3, y: 2, dx: 4, dy: -3 }], aria: 'image de M par la translation de vecteur u' }),
    grille({ xr: [-4, 2], yr: [-3, 4], center: [-1, 0.5], pts: [{ x: -3, y: -2, l: 'A', c: C.u }, { x: 0, y: -1, l: 'B', c: C.u }, { x: -2, y: 2, l: 'M' }, { x: 1, y: 3, l: 'M′', c: C.s }], poly: { pts: [[-3, -2], [0, -1], [1, 3], [-2, 2]], c: '#868e96' }, vecs: [{ x: -3, y: -2, dx: 3, dy: 1, c: C.u }, { x: -2, y: 2, dx: 3, dy: 1, c: C.s }], aria: 'translation qui transforme A en B : ABM′M est un parallélogramme' }))}
${warn(['On <b>ajoute</b> les coordonnées du vecteur à celles du point (on ne soustrait pas).', `Ne réponds pas avec les coordonnées de ${V('u')} : on demande le <b>point d'arrivée</b> M′.`, 'Ne pas confondre le vecteur (un déplacement) et le point (une position).'])}
${retenir(`M′ image de M par la translation de vecteur ${V('u')}(a ; b) : M′(x + a ; y + b).`)}`;
}

/* =====================================================================
   4. Somme de vecteurs (relation de Chasles)
   ===================================================================== */
function L4(d) {
  const kind = d < 3 ? 'sum' : d < 4 ? 'diff' : d < 5 ? 'three' : 'chasles';
  const gen = () => (d < 1 ? [ri(0, 4), ri(0, 4)] : d < 2 ? [nz(-4, 4), nz(-4, 4)] : [ri(-5, 5), ri(-5, 5)]);
  if (kind === 'chasles') {
    let A, B, Cc;
    do { A = [ri(-5, 5), ri(-5, 5)]; B = [ri(-5, 5), ri(-5, 5)]; Cc = [ri(-5, 5), ri(-5, 5)]; }
    while (dist(A, B) < 2.5 || dist(B, Cc) < 2.5 || dist(A, Cc) < 2.5 || Math.abs((B[0] - A[0]) * (Cc[1] - A[1]) - (B[1] - A[1]) * (Cc[0] - A[0])) < 4);
    const E = sub(Cc, A), W = fen([A[0], B[0], Cc[0]], [A[1], B[1], Cc[1]]), ce = ctr([A, B, Cc]);
    const pts = [{ x: A[0], y: A[1], l: 'A' }, { x: B[0], y: B[1], l: 'B' }, { x: Cc[0], y: Cc[1], l: 'C' }];
    const ab = sub(B, A), bc = sub(Cc, B);
    return {
      type: 'nums',
      html: `On donne ${pt('A', A)}, ${pt('B', B)} et ${pt('C', Cc)}.<br>Calcule les coordonnées du vecteur ${V('AB')} + ${V('BC')}.`,
      visual: grille({ ...W, pts, center: ce }),
      afterVisual: grille({ ...W, pts, center: ce, vecs: [{ x: A[0], y: A[1], dx: ab[0], dy: ab[1], c: C.u }, { x: B[0], y: B[1], dx: bc[0], dy: bc[1], c: C.v }, { x: A[0], y: A[1], dx: E[0], dy: E[1], c: C.s, w: 4 }] }), replaceVisual: true,
      tpl: `${V('AB')} + ${V('BC')} ( {0} ; {1} )`,
      check: chk(E, v => (eq2(v, add(A, Cc)) ? 'On ne fait pas la somme des points : calcule les vecteurs (arrivée − départ).' : '')),
      verify: Ev => eq2(Ev, comb([[1, ...ab], [1, ...bc]])) && lands(A, Ev, Cc),
      hint: `Relation de Chasles : <b>${V('AB')} + ${V('BC')} = ${V('AC')}</b> (le B « du milieu » disparaît). Il suffit de calculer ${V('AC')}.`,
      solution: `${V('AB')} + ${V('BC')} = ${V('AC')} (Chasles).<br>${V('AC')}(${M(Cc[0])} − ${P(A[0])} ; ${M(Cc[1])} − ${P(A[1])}) = (<b>${M(E[0])} ; ${M(E[1])}</b>).<br>Vérification : ${V('AB')}${cp(...ab)} + ${V('BC')}${cp(...bc)} = ${cp(E[0], E[1])}.`,
    };
  }
  const n = kind === 'three' ? 3 : 2, names = ['u', 'v', 'w'], cols = [C.u, C.v, C.w];
  let vs, res;
  const sgs = kind === 'diff' ? [1, -1] : [1, 1, 1];
  do {
    vs = Array.from({ length: n }, gen);
    res = vs.reduce((s, v, i) => [s[0] + sgs[i] * v[0], s[1] + sgs[i] * v[1]], [0, 0]);
    // le chemin bout à bout doit rester dans une fenêtre raisonnable
    let cur = [0, 0], ok = true;
    vs.forEach((v, i) => { cur = [cur[0] + sgs[i] * v[0], cur[1] + sgs[i] * v[1]]; if (Math.abs(cur[0]) > 8 || Math.abs(cur[1]) > 8) ok = false; });
    if (n === 2 && Math.abs(vs[0][0] * vs[1][1] - vs[0][1] * vs[1][0]) < 3) ok = false;
    if (ok && vs.every(v => v[0] || v[1]) && (res[0] || res[1]) && vs.every(v => Math.abs(v[0]) + Math.abs(v[1]) >= 2)) break;
  } while (true);
  const E = res, lab = kind === 'diff' ? `${V('u')} − ${V('v')}` : names.slice(0, n).map(V).join(' + ');
  const svlab = kind === 'diff' ? '{u} − {v}' : names.slice(0, n).map(x => `{${x}}`).join(' + ');
  const before = rang(vs.map((v, i) => [v[0], v[1], `{${names[i]}}`, cols[i]]));
  const chain = []; let cur = [0, 0];
  vs.forEach((v, i) => {
    const w = [sgs[i] * v[0], sgs[i] * v[1]];
    chain.push({ x: cur[0], y: cur[1], dx: w[0], dy: w[1], c: cols[i], l: sgs[i] < 0 ? `−{${names[i]}}` : `{${names[i]}}` });
    cur = add(cur, w);
  });
  chain.push({ x: 0, y: 0, dx: E[0], dy: E[1], c: C.s, l: svlab, side: -1, w: 4 });
  const W0 = fenV(before), W1 = fenV(chain);
  const given = vs.map((v, i) => vc(names[i], v)).join(n === 3 ? ', ' : ' et ');
  const verb = kind === 'diff' ? 'la différence' : 'la somme';
  return {
    type: 'nums',
    html: `On donne ${given}.<br>Calcule les coordonnées de ${verb} ${lab}.`,
    visual: grille({ ...W0, vecs: before }),
    afterVisual: grille({ ...W1, vecs: chain }), replaceVisual: true,
    tpl: `${lab} ( {0} ; {1} )`,
    check: chk(E, v => {
      if (kind === 'diff' && eq2(v, add(vs[0], vs[1]))) return `C'est une <b>différence</b> : x − x′ et y − y′.`;
      if (kind !== 'diff' && n === 2 && eq2(v, sub(vs[0], vs[1]))) return 'Pour une somme, on <b>ajoute</b> les abscisses entre elles et les ordonnées entre elles.';
      if (near(v[0], E[0]) !== near(v[1], E[1])) return 'Une coordonnée est juste. Reprends l\'autre calmement (attention aux signes).';
      return '';
    }),
    verify: Ev => eq2(Ev, comb(vs.map((v, i) => [sgs[i], v[0], v[1]]))),
    hint: kind === 'diff' ? `${V('u')} − ${V('v')} = ${V('u')} + (−${V('v')}) : on <b>soustrait</b> les coordonnées, x avec x et y avec y.` : 'On <b>ajoute</b> les abscisses entre elles, puis les ordonnées entre elles. Sur un dessin : on met les flèches <b>bout à bout</b>.',
    solution: kind === 'diff'
      ? `${lab}(${M(vs[0][0])} − ${P(vs[1][0])} ; ${M(vs[0][1])} − ${P(vs[1][1])}) = (<b>${M(E[0])} ; ${M(E[1])}</b>).<br>Sur la figure : on met ${V('u')} puis −${V('v')} bout à bout.`
      : `${lab}(${vs.map(v => P(v[0])).join(' + ')} ; ${vs.map(v => P(v[1])).join(' + ')}) = (<b>${M(E[0])} ; ${M(E[1])}</b>).<br>Sur la figure : on met les flèches bout à bout ; la somme va du départ de la première à la pointe de la dernière.`,
  };
}
function C4() {
  return `<h2>4. Somme de vecteurs</h2>
<p class="intro">Faire un déplacement puis un autre, c'est faire leur somme. On additionne les coordonnées une par une.</p>
<div class="def">Si ${V('u')}(x ; y) et ${V('v')}(x′ ; y′), alors <b>${V('u')} + ${V('v')}(x + x′ ; y + y′)</b> et <b>${V('u')} − ${V('v')}(x − x′ ; y − y′)</b>.<br>Sur un dessin, on met les flèches <b>bout à bout</b> : le départ de ${V('v')} à la pointe de ${V('u')}.<br><b>Relation de Chasles</b> : ${V('AB')} + ${V('BC')} = ${V('AC')}.</div>
${meth(['Somme : ajoute les abscisses entre elles, puis les ordonnées entre elles (avec trois vecteurs, trois termes).', `Différence : ${V('u')} − ${V('v')} = ${V('u')} + (−${V('v')}) : on soustrait x′ de x et y′ de y.`, `Avec des points (${V('AB')} + ${V('BC')}) : Chasles donne ${V('AC')}, puis arrivée − départ.`])}
${exq(1, 'une somme', `${V('u')}(3 ; 1) et ${V('v')}(1 ; 3) : ${V('u')} + ${V('v')}(3 + 1 ; 1 + 3) = <b>(4 ; 4)</b>.<br>Différence : ${V('u')} − ${V('v')}(3 − 1 ; 1 − 3) = <b>(2 ; −2)</b>.`)}
${exq(2, 'relation de Chasles', `A(1 ; 0), B(4 ; 2) et C(2 ; 5) : ${V('AB')} + ${V('BC')} = ${V('AC')}.<br>${V('AC')}(2 − 1 ; 5 − 0) = <b>(1 ; 5)</b>.<br>Vérification : ${V('AB')}(3 ; 2) + ${V('BC')}(−2 ; 3) = (1 ; 5).`)}
${cols(grille({ xr: [-1, 5], yr: [-1, 5], vecs: [{ x: 0, y: 0, dx: 3, dy: 1, l: '{u}', c: C.u, side: -1 }, { x: 3, y: 1, dx: 1, dy: 3, l: '{v}', c: C.v, side: -1 }, { x: 0, y: 0, dx: 4, dy: 4, l: '{u} + {v}', c: C.s, w: 4, at: 0.55 }], aria: 'somme de u et v, flèches bout à bout' }),
    grille({ xr: [-1, 5], yr: [-1, 6], center: [2.3, 2.3], pts: [{ x: 1, y: 0, l: 'A' }, { x: 4, y: 2, l: 'B' }, { x: 2, y: 5, l: 'C' }], vecs: [{ x: 1, y: 0, dx: 3, dy: 2, c: C.u, l: '{AB}', side: -1 }, { x: 4, y: 2, dx: -2, dy: 3, c: C.v, l: '{BC}', side: -1 }, { x: 1, y: 0, dx: 1, dy: 5, c: C.s, w: 4, l: '{AC}' }], aria: 'relation de Chasles : AB + BC = AC' }))}
${warn(['On ajoute x avec x et y avec y, jamais x avec y.', 'Pour une différence, soustrais <b>toutes</b> les coordonnées de ' + V('v') + ' (attention aux signes moins).', `Chasles : la pointe du premier vecteur doit être le départ du second (${V('AB')} + ${V('BC')}, B au milieu). On n'additionne pas les points !`])}
${retenir(`on additionne les vecteurs coordonnée par coordonnée ; ${V('AB')} + ${V('BC')} = ${V('AC')}.`)}`;
}

/* =====================================================================
   5. Produit par un réel
   ===================================================================== */
function L5(d) {
  if (d >= 4) { // combinaison k·u + m·v
    let k, m, u, v, E;
    do { k = nz(-3, 3); m = nz(-3, 3); u = [ri(-3, 3), ri(-3, 3)]; v = [ri(-3, 3), ri(-3, 3)]; E = [k * u[0] + m * v[0], k * u[1] + m * v[1]]; }
    while ((k === 1 && m === 1) || (!u[0] && !u[1]) || (!v[0] && !v[1]) || (!E[0] && !E[1]) || [k * u[0], k * u[1], ...E].some(z => Math.abs(z) > 8) || u[0] * v[1] === u[1] * v[0]);
    const co = c => (c === 1 ? '' : c === -1 ? '−' : M(c));
    const lab = `${co(k)}${V('u')} ${m < 0 ? '−' : '+'} ${co(Math.abs(m))}${V('v')}`;
    const slab = `${co(k)}{u} ${m < 0 ? '−' : '+'} ${co(Math.abs(m))}{v}`;
    const before = rang([[u[0], u[1], '{u}', C.u], [v[0], v[1], '{v}', C.v]]);
    const ku = [k * u[0], k * u[1]], mv = [m * v[0], m * v[1]];
    const chain = [{ x: 0, y: 0, dx: ku[0], dy: ku[1], c: C.u, l: `${co(k)}{u}` }, { x: ku[0], y: ku[1], dx: mv[0], dy: mv[1], c: C.v, l: `${co(m)}{v}` }, { x: 0, y: 0, dx: E[0], dy: E[1], c: C.s, w: 4, side: -1, l: slab }];
    return {
      type: 'nums',
      html: `On donne ${vc('u', u)} et ${vc('v', v)}.<br>Calcule les coordonnées du vecteur ${lab}.`,
      visual: grille({ ...fenV(before), vecs: before }),
      afterVisual: grille({ ...fenV(chain), vecs: chain }), replaceVisual: true,
      tpl: `${lab} ( {0} ; {1} )`,
      check: chk(E, w => (eq2(w, add(u, v).map(z => z * k)) ? `Le coefficient ${M(m)} ne s'applique qu'à ${V('v')}.` : eq2(w, add(ku, mv.map(z => -z))) ? `Attention au signe devant ${V('v')}.` : '')),
      verify: Ev => eq2(Ev, comb([[k, ...u], [m, ...v]])),
      hint: `Calcule d'abord ${co(k)}${V('u')} et ${co(m)}${V('v')} (on multiplie chaque coordonnée), puis ajoute-les.`,
      solution: `${co(k)}${V('u')}${cp(...ku)} et ${co(m)}${V('v')}${cp(...mv)}.<br>${lab}(${M(ku[0])} + ${P(mv[0])} ; ${M(ku[1])} + ${P(mv[1])}) = (<b>${M(E[0])} ; ${M(E[1])}</b>).`,
    };
  }
  let k, u;
  do {
    if (d < 1) { k = ri(2, 3); u = [ri(1, 3), ri(-2, 3)]; }
    else if (d < 2) { k = pick([-1, -2, -3]); u = [nz(-3, 3), nz(-3, 3)]; }
    else if (d < 3) { k = pick([-3, -2, 2, 3, 4]); u = [ri(-3, 3), ri(-3, 3)]; }
    else { k = pick([0.5, -0.5, 1.5, -1.5, 2.5]); u = [nz(-4, 4), nz(-4, 4)]; }
  } while ((!u[0] && !u[1]) || Math.abs(k * u[0]) > 8 || Math.abs(k * u[1]) > 8 || (Math.abs(k) < 1 && Math.abs(k * u[0]) + Math.abs(k * u[1]) < 1.5));
  const E = [r6(k * u[0]), r6(k * u[1])], co = k === -1 ? '−' : M(k);
  const tail = [-Math.round((u[0] + E[0]) / 2), -Math.round((u[1] + E[1]) / 2)];
  // u dessiné à côté de k·u (décalé perpendiculairement) pour que les deux flèches se voient
  const n = Math.hypot(u[0], u[1]), off = [Math.round(-u[1] / n * 1.6), Math.round(u[0] / n * 1.6)];
  const vu = { x: tail[0] + off[0], y: tail[1] + off[1], dx: u[0], dy: u[1], l: '{u}', c: C.u };
  const vk = { x: tail[0], y: tail[1], dx: E[0], dy: E[1], l: `${co}{u}`, c: C.s, side: -1, w: 4 };
  const W = fenV([vu, vk]);
  return {
    type: 'nums',
    html: `On donne ${vc('u', u)}.<br>Calcule les coordonnées du vecteur <b>${co}</b>${V('u')}.`,
    visual: grille({ ...W, vecs: [vu] }),
    afterVisual: grille({ ...W, vecs: [vu, vk], steps: [{ x: tail[0], y: tail[1], dx: E[0], dy: E[1], c: C.s }] }), replaceVisual: true,
    tpl: `${co}${V('u')} ( {0} ; {1} )`, keys: { comma: Math.abs(k) % 1 !== 0 },
    check: chk(E, v => {
      if (eq2(v, [u[0] + k, u[1] + k])) return `On <b>multiplie</b> chaque coordonnée par ${M(k)}, on n'ajoute pas.`;
      if ((near(v[0], E[0]) && near(v[1], u[1]) && u[1] !== E[1]) || (near(v[1], E[1]) && near(v[0], u[0]) && u[0] !== E[0])) return `Multiplie <b>les deux</b> coordonnées par ${M(k)}.`;
      if (eq2(v, [-E[0], -E[1]])) return `Attention au signe : ${M(k)} est ${k < 0 ? 'négatif' : 'positif'}.`;
      return '';
    }),
    verify: Ev => eq2(Ev, comb([[k, ...u]])),
    hint: `${M(k)}${V('u')} : on multiplie <b>chaque</b> coordonnée de ${V('u')} par ${M(k)}.${k < 0 ? ' Comme k est négatif, le sens change.' : ''}`,
    solution: `${co}${V('u')}(${M(k)} × ${P(u[0])} ; ${M(k)} × ${P(u[1])}) = (<b>${M(E[0])} ; ${M(E[1])}</b>).<br>${co}${V('u')} a la même direction que ${V('u')}, ${k < 0 ? '<b>le sens contraire</b>' : 'le même sens'}, et une longueur ${Math.abs(k) === 1 ? 'égale' : `multipliée par ${M(Math.abs(k))}`}.`,
  };
}
function C5() {
  return `<h2>5. Produit d'un vecteur par un réel</h2>
<p class="intro">Multiplier un vecteur par un nombre, c'est l'allonger, le raccourcir ou le retourner, sans changer sa direction.</p>
<div class="def">Si ${V('u')}(x ; y) et k est un réel, alors <b>k${V('u')}(kx ; ky)</b>.<br>k${V('u')} a la même <b>direction</b> que ${V('u')} ; même sens si k &gt; 0, sens <b>contraire</b> si k &lt; 0 ; sa longueur est multipliée par |k|.</div>
${meth(['Multiplie <b>chaque</b> coordonnée par k, avec la règle des signes.', 'Si k est décimal (0,5 ; 1,5…), calcule avec soin : 0,5 × 4 = 2, 1,5 × (−2) = −3.', `Pour une combinaison comme 2${V('u')} − ${V('v')} : calcule d'abord 2${V('u')} et −${V('v')}, puis ajoute-les coordonnée par coordonnée.`])}
${exq(1, 'k entier', `${V('u')}(2 ; 1) : 3${V('u')}(3 × 2 ; 3 × 1) = <b>(6 ; 3)</b> et −2${V('u')}(−2 × 2 ; −2 × 1) = <b>(−4 ; −2)</b>.`)}
${exq(2, 'k décimal', `${V('u')}(4 ; −2) : 0,5${V('u')}(2 ; −1) (la moitié de ${V('u')}) et −1,5${V('u')}(−6 ; 3).`)}
${exq(3, 'une combinaison', `${V('u')}(1 ; 2) et ${V('v')}(3 ; −1) : 2${V('u')}(2 ; 4) et −${V('v')}(−3 ; 1).<br>2${V('u')} − ${V('v')}(2 + (−3) ; 4 + 1) = <b>(−1 ; 5)</b>.`)}
${cols(grille({ xr: [-5, 7], yr: [-3, 4], vecs: [{ x: -1, y: 1, dx: 2, dy: 1, l: '{u}', c: C.u }, { x: 0, y: -1, dx: 6, dy: 3, l: '3{u}', c: C.s, side: -1, w: 4 }, { x: -1, y: 2, dx: -4, dy: -2, l: '−2{u}', c: C.v }], aria: 'u, 3u et −2u ont la même direction' }),
    grille({ xr: [-2, 3], yr: [-1, 6], vecs: [{ x: 0, y: 0, dx: 2, dy: 4, l: '2{u}', c: C.u, side: -1 }, { x: 2, y: 4, dx: -3, dy: 1, l: '−{v}', c: C.v }, { x: 0, y: 0, dx: -1, dy: 5, l: '2{u} − {v}', c: C.s, w: 4 }], aria: 'combinaison 2u − v' }))}
${warn(['On multiplie les <b>deux</b> coordonnées par k (pas seulement la première).', 'On <b>multiplie</b>, on n\'ajoute pas k.', `−${V('u')} est l'opposé de ${V('u')} : (−x ; −y). Si k &lt; 0, les deux signes changent.`])}
${retenir(`k${V('u')}(kx ; ky) : même direction que ${V('u')}, sens contraire si k est négatif.`)}`;
}

/* =====================================================================
   6. Milieu d'un segment
   ===================================================================== */
function L6(d) {
  if (d >= 4) { // A et le milieu I donnés, trouver B
    let A, I;
    do { A = [ri(-6, 6), ri(-6, 6)]; I = d < 5 ? [ri(-4, 4), ri(-4, 4)] : [ri(-8, 8) / 2, ri(-8, 8) / 2]; }
    while (dist(A, I) < 2 || Math.max(...[2 * I[0] - A[0], 2 * I[1] - A[1]].map(Math.abs)) > 8);
    const E = [r6(2 * I[0] - A[0]), r6(2 * I[1] - A[1])], W = fen([A[0], E[0]], [A[1], E[1]]);
    const pts = [{ x: A[0], y: A[1], l: 'A' }, { x: I[0], y: I[1], l: 'I', c: C.s, pos: perp(A, I) }], ce = I;
    return {
      type: 'nums',
      html: `On donne ${pt('A', A)} et ${pt('I', I)}.<br>Calcule les coordonnées du point B tel que <b>I soit le milieu de [AB]</b>.`,
      visual: grille({ ...W, pts, center: ce }),
      afterVisual: grille({ ...W, pts: [...pts, { x: E[0], y: E[1], l: 'B' }], center: ce, segs: [{ x1: A[0], y1: A[1], x2: E[0], y2: E[1] }] }), replaceVisual: true,
      tpl: TPLP('B'),
      check: chk(E, v => (eq2(v, [(A[0] + I[0]) / 2, (A[1] + I[1]) / 2]) ? 'Ça, c\'est le milieu de [AI]. Ici, I est le milieu de [AB] : B est « de l\'autre côté » de I.' : eq2(v, sub(I, A)) ? `C'est ${V('AI')}. Le point B vérifie ${V('IB')} = ${V('AI')}.` : '')),
      verify: Ev => near(dist(A, I), dist(I, Ev)) && near(dist(A, Ev), 2 * dist(A, I)),
      hint: `${xs('I')} = (${xs('A')} + ${xs('B')}) ÷ 2, donc <b>${xs('B')} = 2 × ${xs('I')} − ${xs('A')}</b> (et de même pour y). Ou bien : ${V('IB')} = ${V('AI')}.`,
      solution: `${xs('B')} = 2 × ${P(I[0])} − ${P(A[0])} = ${M(E[0])} et ${ys('B')} = 2 × ${P(I[1])} − ${P(A[1])} = ${M(E[1])}.<br>Donc B(<b>${M(E[0])} ; ${M(E[1])}</b>). Vérification : (${M(A[0])} + ${P(E[0])}) ÷ 2 = ${M(I[0])}.`,
    };
  }
  let A, B;
  do {
    const R = d < 1 ? [0, 6] : [-6, 6];
    A = [ri(...R), ri(...R)]; B = [ri(...R), ri(...R)];
  } while (dist(A, B) < 3 || (d < 3 && ((A[0] + B[0]) % 2 || (A[1] + B[1]) % 2)) || (d >= 3 && !((A[0] + B[0]) % 2) && !((A[1] + B[1]) % 2)));
  const E = [(A[0] + B[0]) / 2, (A[1] + B[1]) / 2], W = fen([A[0], B[0]], [A[1], B[1]]);
  const pts = [{ x: A[0], y: A[1], l: 'A' }, { x: B[0], y: B[1], l: 'B' }], ce = E;
  return {
    type: 'nums',
    html: `On donne ${pt('A', A)} et ${pt('B', B)}.<br>Calcule les coordonnées du <b>milieu</b> I du segment [AB].`,
    visual: grille({ ...W, pts, center: ce, segs: [{ x1: A[0], y1: A[1], x2: B[0], y2: B[1] }] }),
    afterVisual: grille({ ...W, pts: [...pts, { x: E[0], y: E[1], l: 'I', c: C.s, pos: perp(A, B) }], center: ce, segs: [{ x1: A[0], y1: A[1], x2: B[0], y2: B[1] }] }), replaceVisual: true,
    tpl: TPLP('I'), keys: { comma: d >= 3 },
    check: chk(E, v => {
      if (eq2(v, add(A, B))) return 'Tu as fait la somme : il faut encore <b>diviser par 2</b>.';
      if (eq2(v, sub(B, A).map(z => z / 2)) || eq2(v, sub(A, B).map(z => z / 2))) return 'On fait la <b>moyenne</b> : (x<sub>A</sub> + x<sub>B</sub>) ÷ 2, avec un « + ».';
      return '';
    }),
    verify: Ev => near(dist(A, Ev), dist(Ev, B)) && near(dist(A, B), dist(A, Ev) + dist(Ev, B)),
    hint: `Le milieu, c'est la <b>moyenne</b> des coordonnées : ${xs('I')} = (${xs('A')} + ${xs('B')}) ÷ 2 et ${ys('I')} = (${ys('A')} + ${ys('B')}) ÷ 2.`,
    solution: `${xs('I')} = (${M(A[0])} + ${P(B[0])}) ÷ 2 = ${M(A[0] + B[0])} ÷ 2 = ${M(E[0])}<br>${ys('I')} = (${M(A[1])} + ${P(B[1])}) ÷ 2 = ${M(A[1] + B[1])} ÷ 2 = ${M(E[1])}<br>Donc I(<b>${M(E[0])} ; ${M(E[1])}</b>).`,
  };
}
function C6() {
  return `<h2>6. Milieu d'un segment</h2>
<p class="intro">Le milieu d'un segment est « à mi-chemin » : ses coordonnées sont les moyennes de celles des extrémités.</p>
<div class="def">Le milieu I de [AB] a pour coordonnées la <b>moyenne</b> de celles de A et B :<br><b>${xs('I')} = (${xs('A')} + ${xs('B')}) ÷ 2</b> et <b>${ys('I')} = (${ys('A')} + ${ys('B')}) ÷ 2</b>.<br>Avec les vecteurs : I est le milieu de [AB] quand ${V('AI')} = ${V('IB')}.</div>
${meth(['Pour trouver le milieu : <b>ajoute</b> les deux abscisses puis divise par 2 ; pareil pour les ordonnées.', 'Le résultat peut être décimal : (−3 + 2) ÷ 2 = −0,5.', `Pour trouver une extrémité B quand on connaît A et le milieu I : <b>${xs('B')} = 2 × ${xs('I')} − ${xs('A')}</b> et ${ys('B')} = 2 × ${ys('I')} − ${ys('A')} (ou bien ${V('IB')} = ${V('AI')}).`])}
${exq(1, 'calculer le milieu', 'A(−3 ; 2) et B(5 ; −1) : I((−3 + 5) ÷ 2 ; (2 + (−1)) ÷ 2) = <b>I(1 ; 0,5)</b>.')}
${exq(2, 'retrouver une extrémité', `I(0 ; 1) est le milieu de [AB] et A(2 ; −3).<br>${xs('B')} = 2 × 0 − 2 = −2 et ${ys('B')} = 2 × 1 − (−3) = 5 : <b>B(−2 ; 5)</b>.<br>Vérification : (2 + (−2)) ÷ 2 = 0 et (−3 + 5) ÷ 2 = 1.`)}
${cols(grille({ xr: [-4, 6], yr: [-2, 3], pts: [{ x: -3, y: 2, l: 'A', pos: 'nw' }, { x: 5, y: -1, l: 'B', pos: 'se' }, { x: 1, y: 0.5, l: 'I', c: C.s, pos: 'n' }], segs: [{ x1: -3, y1: 2, x2: 5, y2: -1 }], aria: 'milieu I du segment AB' }),
    grille({ xr: [-3, 3], yr: [-4, 6], pts: [{ x: 2, y: -3, l: 'A', pos: 'e' }, { x: 0, y: 1, l: 'I', c: C.s, pos: 'e' }, { x: -2, y: 5, l: 'B', pos: 'w' }], vecs: [{ x: 2, y: -3, dx: -2, dy: 4, c: C.u, l: '{AI}', side: -1 }, { x: 0, y: 1, dx: -2, dy: 4, c: C.u, l: '{IB}', side: -1 }], aria: 'B est de l\'autre côté de I : AI = IB' }))}
${warn(['C\'est une <b>somme</b> divisée par 2, pas une différence.', 'N\'oublie pas de diviser par 2 !', 'Pour retrouver B, ce n\'est pas le milieu de [AI] : B est <b>de l\'autre côté</b> de I, à la même distance.'])}
${retenir('le milieu a pour coordonnées les moyennes : ((x<sub>A</sub> + x<sub>B</sub>) ÷ 2 ; (y<sub>A</sub> + y<sub>B</sub>) ÷ 2).')}`;
}

/* =====================================================================
   7. Norme d'un vecteur, distance
   ===================================================================== */
const TRIP = [[3, 4, 5], [4, 3, 5], [6, 8, 10], [8, 6, 10], [5, 12, 13], [12, 5, 13], [0, 4, 4], [5, 0, 5]];
function L7(d) {
  const sq = d >= 4;
  let a, b, n;
  if (sq) { do { a = nz(-6, 6); b = nz(-6, 6); } while (Math.abs(a) === Math.abs(b) && chance(0.7)); n = a * a + b * b; }
  else {
    const t = pick(d < 1 ? TRIP.slice(0, 4) : d < 2 ? TRIP.slice(0, 6) : TRIP.slice(0, d < 3 ? 6 : 8));
    a = t[0] * (d < 1 ? 1 : pick([1, -1])); b = t[1] * (d < 1 ? 1 : pick([1, -1])); n = t[2];
  }
  const pts = d >= 2;
  let A = [0, 0];
  if (pts) { do { A = [ri(-6, 6), ri(-6, 6)]; } while (Math.abs(A[0] + a) > 7 || Math.abs(A[1] + b) > 7); }
  const B = add(A, [a, b]);
  if (!pts) A = [-Math.round(a / 2), -Math.round(b / 2)];
  const Bv = add(A, [a, b]), W = fen([A[0], Bv[0]], [A[1], Bv[1]]), ce = ctr([A, Bv]);
  const item = pts ? { pts: [{ x: A[0], y: A[1], l: 'A' }, { x: B[0], y: B[1], l: 'B' }], segs: [{ x1: A[0], y1: A[1], x2: B[0], y2: B[1], c: C.u, w: 3 }], center: [ce[0] + 0.2 * Math.sign(b || 1), ce[1] - 0.2 * Math.sign(a || 1)] } : { vecs: [{ x: A[0], y: A[1], dx: a, dy: b, l: '{u}', c: C.u }] };
  const lab = pts ? (sq ? 'AB<sup>2</sup>' : 'AB') : `‖${V('u')}‖`;
  const E = n, s2 = `${P(a)}<sup>2</sup> + ${P(b)}<sup>2</sup> = ${a * a} + ${b * b} = ${a * a + b * b}`;
  return {
    type: 'nums', keys: { neg: false },
    html: pts ? `On donne ${pt('A', A)} et ${pt('B', B)} dans un repère orthonormé.<br>Calcule ${sq ? `<b>AB<sup>2</sup></b> (le carré de la distance AB)` : 'la <b>distance</b> AB'}.` : `On donne ${vc('u', [a, b])} dans un repère orthonormé.<br>Calcule la <b>norme</b> ‖${V('u')}‖ (la longueur de la flèche).`,
    visual: grille({ ...W, ...item }),
    afterVisual: grille({ ...W, ...item, steps: [{ x: A[0], y: A[1], dx: a, dy: b }] }), replaceVisual: true,
    tpl: `${lab} = {0}`,
    check: chk([E], v => {
      if (!sq && near(v[0], a * a + b * b)) return `C'est le <b>carré</b> de la longueur : il reste à prendre la racine carrée de ${a * a + b * b}.`;
      if (near(v[0], Math.abs(a) + Math.abs(b))) return 'On n\'additionne pas les déplacements : c\'est le <b>théorème de Pythagore</b>.';
      if (sq && near(v[0], (a + b) ** 2)) return `(x + y)<sup>2</sup> n'est pas x<sup>2</sup> + y<sup>2</sup> : élève <b>chaque</b> coordonnée au carré.`;
      if (near(v[0], Math.abs(a * a - b * b))) return 'On <b>ajoute</b> les deux carrés.';
      return '';
    }),
    value: sq ? Math.hypot(a, b) ** 2 : (pts ? dist(A, B) : Math.hypot(a, b)),
    hint: `Le déplacement horizontal et le déplacement vertical forment un triangle rectangle : ${pts ? 'AB' : `‖${V('u')}‖`}<sup>2</sup> = x<sup>2</sup> + y<sup>2</sup>${pts ? ` avec x = ${xs('B')} − ${xs('A')} et y = ${ys('B')} − ${ys('A')}` : ''}.`,
    solution: `${pts ? `${V('AB')}(${M(B[0])} − ${P(A[0])} ; ${M(B[1])} − ${P(A[1])}) = ${cp(a, b)}.<br>` : ''}${pts ? 'AB' : `‖${V('u')}‖`}<sup>2</sup> = ${s2}${sq ? '' : `<br>donc ${pts ? 'AB' : `‖${V('u')}‖`} = √${a * a + b * b} = ${n}`}.<br><b>${lab} = ${E}</b>.`,
  };
}
function C7() {
  return `<h2>7. Norme et distance</h2>
<p class="intro">La longueur d'une flèche se calcule avec le théorème de Pythagore : le déplacement horizontal et le déplacement vertical forment un triangle rectangle.</p>
<div class="def">Dans un repère <b>orthonormé</b>, la <b>norme</b> (longueur) de ${V('u')}(x ; y) est <b>‖${V('u')}‖ = √(x<sup>2</sup> + y<sup>2</sup>)</b> (théorème de Pythagore).<br>La distance AB est la norme de ${V('AB')} : <b>AB = √((${xs('B')} − ${xs('A')})<sup>2</sup> + (${ys('B')} − ${ys('A')})<sup>2</sup>)</b>.</div>
${meth([`Avec deux points, calcule d'abord ${V('AB')}(x ; y) (arrivée − départ).`, 'Élève <b>chaque</b> coordonnée au carré, puis <b>ajoute</b> : x<sup>2</sup> + y<sup>2</sup>.', 'Prends la racine carrée pour avoir la longueur. Si on demande AB<sup>2</sup>, on s\'arrête avant la racine.'])}
${exq(1, 'norme d\'un vecteur', `${V('u')}(3 ; −4) : ‖${V('u')}‖<sup>2</sup> = 3<sup>2</sup> + (−4)<sup>2</sup> = 9 + 16 = 25, donc ‖${V('u')}‖ = √25 = <b>5</b>.`)}
${exq(2, 'distance entre deux points', `A(−1 ; 2) et B(5 ; −6) : ${V('AB')}(6 ; −8).<br>AB<sup>2</sup> = 6<sup>2</sup> + (−8)<sup>2</sup> = 36 + 64 = 100, donc <b>AB = 10</b>.`)}
${exq(3, 'le carré de la distance', `A(1 ; −2) et B(3 ; 1) : ${V('AB')}(2 ; 3), AB<sup>2</sup> = 4 + 9 = <b>13</b> (et AB = √13 ≈ 3,6).`)}
${cols(grille({ xr: [-3, 4], yr: [-2, 4], vecs: [{ x: -1, y: 3, dx: 3, dy: -4, l: '{u}', c: C.u, side: -1 }], steps: [{ x: -1, y: 3, dx: 3, dy: -4 }], aria: 'norme de u : triangle rectangle de côtés 3 et 4' }),
    grille({ xr: [-1, 4], yr: [-3, 2], pts: [{ x: 1, y: -2, l: 'A', pos: 'w' }, { x: 3, y: 1, l: 'B', pos: 'nw' }], segs: [{ x1: 1, y1: -2, x2: 3, y2: 1, c: C.u, w: 3 }], steps: [{ x: 1, y: -2, dx: 2, dy: 3 }], aria: 'distance AB : triangle rectangle de côtés 2 et 3' }))}
${warn(['On n\'additionne pas les déplacements : 3 + 4 = 7 n\'est pas la longueur, c\'est <b>Pythagore</b>.', 'Un carré est toujours positif : (−4)<sup>2</sup> = 16. Et (x + y)<sup>2</sup> n\'est pas x<sup>2</sup> + y<sup>2</sup>.', '√(9 + 16) n\'est pas √9 + √16 : 5 ≠ 7. La formule n\'est valable que dans un repère <b>orthonormé</b>.'])}
${retenir(`‖${V('u')}‖ = √(x<sup>2</sup> + y<sup>2</sup>) : on ajoute les carrés, puis on prend la racine.`)}`;
}

/* =====================================================================
   8. Colinéarité
   ===================================================================== */
function L8(d) {
  const kind = d < 2 ? 'det' : d < 4 ? 'qcm' : 'miss';
  let u, v, w, m1, m2;
  if (kind === 'det') {
    do { u = d < 1 ? [ri(1, 5), ri(1, 5)] : [nz(-5, 5), ri(-5, 5)]; v = d < 1 ? [ri(1, 5), ri(1, 5)] : [ri(-5, 5), nz(-5, 5)]; } while (u[0] === v[0] && u[1] === v[1]);
  } else {
    do { w = [nz(-3, 3), nz(-3, 3)]; m1 = nz(-3, 3); m2 = nz(-3, 3); } while (m1 === m2 || Math.abs(w[0] * m1) > 6 || Math.abs(w[1] * m1) > 6 || Math.abs(w[0] * m2) > 6 || Math.abs(w[1] * m2) > 6);
    u = [w[0] * m1, w[1] * m1]; v = [w[0] * m2, w[1] * m2];
    if (kind === 'qcm' && chance(0.5)) v = [v[0], v[1] + pick([1, -1])];
  }
  const det = u[0] * v[1] - u[1] * v[0];
  const before = [{ x: 0, y: 0, dx: u[0], dy: u[1], l: '{u}', c: C.u, side: 1 }, { x: 0, y: 0, dx: v[0], dy: v[1], l: '{v}', c: C.v, side: -1 }];
  const Wf = fenV(before);
  const detTxt = `${M(u[0])} × ${P(v[1])} − ${P(u[1])} × ${P(v[0])} = ${M(u[0] * v[1])} − ${P(u[1] * v[0])} = ${M(det)}`;
  const DEF = `det(${V('u')}, ${V('v')}) = x × y′ − y × x′`;
  if (kind === 'det') return {
    type: 'nums',
    html: `On donne ${vc('u', u)} et ${vc('v', v)}.<br>Calcule le <b>déterminant</b> det(${V('u')}, ${V('v')}).`,
    visual: grille({ ...Wf, vecs: before }),
    tpl: `det(${V('u')}, ${V('v')}) = {0}`,
    check: chk([det], x => (near(x[0], u[0] * v[0] + u[1] * v[1]) && det !== u[0] * v[0] + u[1] * v[1] ? 'Ça, c\'est x × x′ + y × y′. Le déterminant croise : <b>x × y′ − y × x′</b>.' : near(x[0], -det) ? 'Attention à l\'ordre : <b>x × y′ − y × x′</b> (x de ' + V('u') + ' en premier).' : '')),
    value: Math.hypot(...u) * Math.hypot(...v) * sinAng(u[0], u[1], v[0], v[1]),
    hint: `${DEF} : on fait le produit « en croix » ${M(u[0])} × ${P(v[1])}, moins l'autre produit ${P(u[1])} × ${P(v[0])}.`,
    solution: `det(${V('u')}, ${V('v')}) = ${detTxt}.<br>${det === 0 ? `Le déterminant est nul : ${V('u')} et ${V('v')} sont <b>colinéaires</b>.` : `Il n'est pas nul : ${V('u')} et ${V('v')} ne sont pas colinéaires.`}`,
  };
  if (kind === 'qcm') {
    const E = det === 0 ? 'oui' : 'non';
    return {
      type: 'choice',
      html: `On donne ${vc('u', u)} et ${vc('v', v)}.<br>Les vecteurs ${V('u')} et ${V('v')} sont-ils <b>colinéaires</b> ?`,
      visual: grille({ ...Wf, vecs: before }),
      opts: [{ v: 'oui', l: 'Oui, colinéaires' }, { v: 'non', l: 'Non' }],
      check: choiceCheck(E, { msg: () => (det === 0 ? `Calcule le déterminant : il est nul.` : `Le déterminant vaut ${M(det)}, il n'est pas nul.`) }),
      verify: Ev => (Ev === 'oui') === (Math.abs(sinAng(u[0], u[1], v[0], v[1])) < 1e-9),
      hint: `Calcule ${DEF}. Les vecteurs sont colinéaires quand il vaut <b>0</b>.`,
      solution: `det(${V('u')}, ${V('v')}) = ${detTxt}.<br>${det === 0 ? `Il est nul : <b>${V('u')} et ${V('v')} sont colinéaires</b> (${V('v')} = ${kfr(m2, m1)}${V('u')}).` : `Il n'est pas nul : <b>${V('u')} et ${V('v')} ne sont pas colinéaires</b>.`}`,
    };
  }
  // coordonnée manquante
  const y = v[1];
  return {
    type: 'nums',
    html: `On donne ${vc('u', u)} et ${V('v')}(${M(v[0])} ; y).<br>Trouve y pour que ${V('u')} et ${V('v')} soient <b>colinéaires</b>.`,
    visual: grille({ ...Wf, vecs: [before[0]], lines: [{ a: 1, b: 0, c: -v[0], col: '#adb5bd', dash: true, l: `x = ${M(v[0])}`, at: 0.1 }] }),
    afterVisual: grille({ ...Wf, vecs: before, lines: [{ a: 1, b: 0, c: -v[0], col: '#adb5bd', dash: true }] }), replaceVisual: true,
    tpl: 'y = {0}',
    check: chk([y], x => (near(x[0], -y) ? 'Presque : vérifie le signe avec le déterminant.' : near(x[0], r6(u[0] * v[0] / u[1])) && x[0] !== y ? 'Attention au produit en croix : x × y′ − y × x′ = 0.' : '')),
    verify: Ev => Math.abs(sinAng(u[0], u[1], v[0], Ev[0])) < 1e-9,
    hint: `Écris det(${V('u')}, ${V('v')}) = ${M(u[0])} × y − ${P(u[1])} × ${P(v[0])} = 0 et résous cette équation.`,
    solution: `${M(u[0])} × y − ${P(u[1])} × ${P(v[0])} = 0, soit ${M(u[0])}y = ${M(u[1] * v[0])}, donc y = ${M(u[1] * v[0])} ÷ ${P(u[0])} = <b>${M(y)}</b>.<br>Alors ${V('v')}${cp(v[0], y)} = ${kfr(m2, m1)}${V('u')}.`,
  };
}
function C8() {
  return `<h2>8. Vecteurs colinéaires</h2>
<p class="intro">Deux vecteurs colinéaires ont la même direction. Le déterminant permet de le vérifier par un seul calcul.</p>
<div class="def">${V('u')} et ${V('v')} sont <b>colinéaires</b> quand l'un est un multiple de l'autre (${V('v')} = k${V('u')}) : ils ont la même direction.<br>Le <b>déterminant</b> de ${V('u')}(x ; y) et ${V('v')}(x′ ; y′) est <b>det(${V('u')}, ${V('v')}) = x × y′ − y × x′</b>.<br>${V('u')} et ${V('v')} sont colinéaires <b>si et seulement si</b> det(${V('u')}, ${V('v')}) = 0.</div>
${meth([`Écris les coordonnées l'une sous l'autre : x et y de ${V('u')}, puis x′ et y′ de ${V('v')}.`, 'Fais le produit « en croix » <b>x × y′</b>, puis retranche l\'autre produit <b>y × x′</b>.', 'Déterminant nul ⇔ colinéaires ; déterminant non nul ⇔ pas colinéaires.', 'S\'il manque une coordonnée, écris det = 0 et résous l\'équation obtenue.'])}
${exq(1, 'colinéaires', `${V('u')}(2 ; −1) et ${V('v')}(−6 ; 3) : det = 2 × 3 − (−1) × (−6) = 6 − 6 = <b>0</b> : colinéaires (${V('v')} = −3${V('u')}).`)}
${exq(2, 'pas colinéaires', `${V('u')}(2 ; −1) et ${V('w')}(3 ; 1) : det = 2 × 1 − (−1) × 3 = 2 + 3 = 5 ≠ 0 : <b>pas colinéaires</b>.`)}
${exq(3, 'coordonnée manquante', `${V('u')}(2 ; −1) et ${V('v')}(6 ; y) colinéaires : 2 × y − (−1) × 6 = 0, soit 2y + 6 = 0, donc <b>y = −3</b>.<br>On a bien ${V('v')}(6 ; −3) = 3${V('u')}.`)}
${cols(grille({ xr: [-6, 4], yr: [-2, 4], vecs: [{ x: 0, y: 0, dx: 2, dy: -1, l: '{u}', c: C.u, side: -1 }, { x: 0, y: 0, dx: -6, dy: 3, l: '{v}', c: C.v }, { x: 0, y: 0, dx: 3, dy: 1, l: '{w}', c: C.w }], aria: 'u et v colinéaires, w non' }),
    grille({ xr: [-1, 7], yr: [-4, 2], vecs: [{ x: 0, y: 0, dx: 6, dy: -3, l: '{v}', c: C.v, at: 0.7 }, { x: 0, y: 0, dx: 2, dy: -1, l: '{u}', c: C.u, w: 5, side: -1, at: 0.6 }], lines: [{ a: 1, b: 0, c: -6, col: '#adb5bd', dash: true, l: 'x = 6', at: 0.85 }], aria: 'v(6 ; y) colinéaire à u : y = −3' }))}
${warn(['C\'est un produit « en croix » : x × y′ − y × x′, pas x × x′ + y × y′.', `L'ordre compte : commence par x de ${V('u')} (sinon on obtient l'opposé).`, `Colinéaires ne veut pas dire « même sens » : −3${V('u')} est colinéaire à ${V('u')}.`])}
${retenir(`${V('u')} et ${V('v')} colinéaires ⇔ x × y′ − y × x′ = 0.`)}`;
}

/* =====================================================================
   9. Parallélogramme
   ===================================================================== */
function L9(d) {
  const askC = d >= 4;
  let A, B, Cc, D;
  do {
    const R = d < 2 ? [0, 6] : [-6, 6];
    A = [ri(...R), ri(...R)]; B = [ri(...R), ri(...R)]; Cc = [ri(...R), ri(...R)]; D = add(A, sub(Cc, B));
  } while (Math.abs((B[0] - A[0]) * (Cc[1] - B[1]) - (B[1] - A[1]) * (Cc[0] - B[0])) < 6 || dist(A, B) < 2.5 || dist(B, Cc) < 2.5 || D.some(z => Math.abs(z) > 8));
  const all = [A, B, Cc, D], W = fen(all.map(p => p[0]), all.map(p => p[1])), ce = ctr(all);
  const known = askC ? [['A', A], ['B', B], ['D', D]] : [['A', A], ['B', B], ['C', Cc]];
  const E = askC ? Cc : D, nm = askC ? 'C' : 'D';
  const pts = known.map(([l, p]) => ({ x: p[0], y: p[1], l }));
  const segs = askC ? [{ x1: A[0], y1: A[1], x2: B[0], y2: B[1] }, { x1: A[0], y1: A[1], x2: D[0], y2: D[1] }] : [{ x1: A[0], y1: A[1], x2: B[0], y2: B[1] }, { x1: B[0], y1: B[1], x2: Cc[0], y2: Cc[1] }];
  const alt = askC ? [add(A, sub(D, B)), add(A, sub(B, D))] : [add(B, sub(Cc, A)), add(A, sub(B, Cc))];
  return {
    type: 'nums',
    html: `On donne ${known.map(([l, p]) => pt(l, p)).join(', ')}.<br>Calcule les coordonnées du point ${nm} tel que <b>ABCD soit un parallélogramme</b>.`,
    visual: grille({ ...W, pts, segs, center: ce }),
    afterVisual: grille({ ...W, pts: [...pts, { x: E[0], y: E[1], l: nm, c: C.s }], center: ce, poly: { pts: [A, B, Cc, D] }, vecs: [{ x: A[0], y: A[1], dx: B[0] - A[0], dy: B[1] - A[1], c: C.u }, { x: D[0], y: D[1], dx: B[0] - A[0], dy: B[1] - A[1], c: C.u }] }), replaceVisual: true,
    tpl: TPLP(nm),
    check: chk(E, v => (alt.some(z => eq2(v, z)) ? `Attention à l'ordre des lettres : dans ABCD, les sommets se suivent. ${askC ? 'C est le sommet opposé à A' : 'D est le sommet opposé à B'}, et ${V('AB')} = ${V('DC')}.` : '')),
    verify: Ev => sameMid(A, askC ? Ev : Cc, B, askC ? D : Ev) && Math.abs(sinAng(B[0] - A[0], B[1] - A[1], Cc[0] - A[0], Cc[1] - A[1])) > 1e-6,
    hint: askC ? `ABCD parallélogramme ⇔ <b>${V('AB')} = ${V('DC')}</b> : C est l'image de D par la translation de vecteur ${V('AB')}.` : `ABCD parallélogramme ⇔ <b>${V('AD')} = ${V('BC')}</b> : D est l'image de A par la translation de vecteur ${V('BC')}.`,
    solution: askC
      ? `${V('AB')}(${M(B[0])} − ${P(A[0])} ; ${M(B[1])} − ${P(A[1])}) = ${cp(...sub(B, A))}.<br>${V('DC')} = ${V('AB')} donne C(${M(D[0])} + ${P(B[0] - A[0])} ; ${M(D[1])} + ${P(B[1] - A[1])}) = C(<b>${M(Cc[0])} ; ${M(Cc[1])}</b>).<br>Vérification : [AC] et [BD] ont le même milieu.`
      : `${V('BC')}(${M(Cc[0])} − ${P(B[0])} ; ${M(Cc[1])} − ${P(B[1])}) = ${cp(...sub(Cc, B))}.<br>${V('AD')} = ${V('BC')} donne D(${M(A[0])} + ${P(Cc[0] - B[0])} ; ${M(A[1])} + ${P(Cc[1] - B[1])}) = D(<b>${M(D[0])} ; ${M(D[1])}</b>).<br>Vérification : [AC] et [BD] ont le même milieu (${M((A[0] + Cc[0]) / 2)} ; ${M((A[1] + Cc[1]) / 2)}).`,
  };
}
function C9() {
  return `<h2>9. Parallélogramme</h2>
<p class="intro">Les vecteurs donnent une façon très rapide de construire le quatrième sommet d'un parallélogramme.</p>
<div class="def">ABCD est un <b>parallélogramme</b> ⇔ <b>${V('AB')} = ${V('DC')}</b> ⇔ ${V('AD')} = ${V('BC')} ⇔ les diagonales [AC] et [BD] ont le <b>même milieu</b>.<br>Dans ABCD, les sommets se suivent dans l'ordre : A et C sont opposés, B et D aussi.</div>
${meth([`Choisis l'égalité qui contient le point cherché : pour D, ${V('AD')} = ${V('BC')} ; pour C, ${V('DC')} = ${V('AB')}.`, 'Calcule le vecteur connu (arrivée − départ).', `Ajoute ses coordonnées au point de départ : D = A + ${V('BC')}, ou C = D + ${V('AB')}.`, 'Vérifie : [AC] et [BD] doivent avoir le même milieu.'])}
${exq(1, 'trouver D', `A(0 ; 0), B(4 ; 1), C(5 ; 4) : ${V('BC')}(1 ; 3), donc D(0 + 1 ; 0 + 3) = <b>D(1 ; 3)</b>.<br>Vérification : milieu de [AC] = (2,5 ; 2) = milieu de [BD].`)}
${exq(2, 'trouver C', `A(1 ; −1), B(3 ; 2), D(−2 ; 1) : ${V('AB')}(2 ; 3).<br>${V('DC')} = ${V('AB')}, donc C(−2 + 2 ; 1 + 3) = <b>C(0 ; 4)</b>.<br>Vérification : milieu de [AC] = (0,5 ; 1,5) = milieu de [BD].`)}
${cols(grille({ xr: [-1, 6], yr: [-1, 5], center: [2.5, 2], pts: [{ x: 0, y: 0, l: 'A' }, { x: 4, y: 1, l: 'B' }, { x: 5, y: 4, l: 'C' }, { x: 1, y: 3, l: 'D', c: C.s }], poly: { pts: [[0, 0], [4, 1], [5, 4], [1, 3]] }, vecs: [{ x: 0, y: 0, dx: 4, dy: 1, c: C.u }, { x: 1, y: 3, dx: 4, dy: 1, c: C.u }], aria: 'parallélogramme ABCD : AB = DC' }),
    grille({ xr: [-3, 4], yr: [-2, 5], center: [0.5, 1.5], pts: [{ x: 1, y: -1, l: 'A' }, { x: 3, y: 2, l: 'B' }, { x: 0, y: 4, l: 'C', c: C.s }, { x: -2, y: 1, l: 'D' }, { x: 0.5, y: 1.5, l: '', c: C.s }], poly: { pts: [[1, -1], [3, 2], [0, 4], [-2, 1]] }, segs: [{ x1: 1, y1: -1, x2: 0, y2: 4, c: '#868e96', dash: true }, { x1: 3, y1: 2, x2: -2, y2: 1, c: '#868e96', dash: true }], aria: 'les diagonales d\'un parallélogramme ont le même milieu' }))}
${warn(['L\'ordre des lettres compte : dans ABCD, A est relié à B et à D ; D est le sommet <b>opposé</b> à B.', `${V('AB')} = ${V('DC')} (et non ${V('CD')}) : les flèches vont dans le même sens.`, 'Fais la vérification des milieux : elle détecte presque toutes les erreurs.'])}
${retenir(`ABCD parallélogramme ⇔ ${V('AB')} = ${V('DC')} ⇔ [AC] et [BD] ont le même milieu.`)}`;
}

/* =====================================================================
   10. Vecteur directeur et équation cartésienne
   ===================================================================== */
/** équations proportionnelles acceptées : v = [a, b, c] */
function eqCheck(E, u) {
  const f = v => {
    if (empty(v)) return { ok: false, msg: 'Remplis les trois cases (0 si un terme manque).' };
    const [a, b, c] = v;
    if (a === 0 && b === 0) return { ok: false, msg: 'a et b ne peuvent pas être nuls tous les deux.' };
    const pab = near(a * E[1], b * E[0]);
    if (pab && near(a * E[2], c * E[0]) && near(b * E[2], c * E[1])) return { ok: true, msg: eq2([a, b], E) ? '' : `Juste ! (Toutes les équations proportionnelles conviennent, par exemple ${cart(...E)}.)` };
    if (pab) return { ok: false, bad: [2], msg: 'a et b sont bons : il reste c. Remplace x et y par les coordonnées de A.' };
    if (near(a * u[1], b * u[0])) return { ok: false, msg: `(a ; b) n'est pas un vecteur directeur : la droite ax + by + c = 0 a pour vecteur directeur <b>(−b ; a)</b>.` };
    return { ok: false };
  };
  f.expected = E; return f;
}
function L10(d) {
  if (d >= 4) { // équation → vecteur directeur
    let a, b, P0;
    do { a = ri(-5, 5); b = nz(-5, 5); P0 = [ri(-4, 4), ri(-4, 4)]; } while ((a === 0 && d < 5) || Math.abs(a * P0[0] + b * P0[1]) > 20 || Math.abs(a) + Math.abs(b) < 3);
    const c = -(a * P0[0] + b * P0[1]), E = [-b, a], W = fen([P0[0], P0[0] - b], [P0[1], P0[1] + a], 1);
    const line = { a, b, c, l: 'd' };
    return {
      type: 'nums',
      html: `La droite d a pour équation ${big(cart(a, b, c))}Donne un <b>vecteur directeur</b> ${V('u')} de d.`,
      visual: grille({ ...W, lines: [line] }),
      afterVisual: grille({ ...W, lines: [line], vecs: [{ x: P0[0], y: P0[1], dx: -b, dy: a, l: '{u}', c: C.u }], pts: [{ x: P0[0], y: P0[1], l: '' }] }), replaceVisual: true,
      tpl: TPLV('u'),
      check: (() => {
        const f = v => {
          if (empty(v)) return { ok: false };
          if (v[0] === 0 && v[1] === 0) return { ok: false, msg: 'Le vecteur nul n\'est pas un vecteur directeur.' };
          if (near(v[0] * E[1], v[1] * E[0])) return { ok: true, msg: eq2(v, E) ? '' : `Juste ! Tout vecteur colinéaire à ${V('u')}${cp(...E)} convient.` };
          if (near(v[0] * b, v[1] * a)) return { ok: false, msg: `(a ; b) = ${cp(a, b)} n'est pas un vecteur directeur : on prend <b>(−b ; a)</b>.` };
          return { ok: false };
        };
        f.expected = E; return f;
      })(),
      // vérification : en partant d'un point de d, on reste sur d
      verify: Ev => (Ev[0] || Ev[1]) && [0, 1, -2.5].every(t => { const x = 0.7 + t * Ev[0], y = (-c - a * 0.7) / b + t * Ev[1]; return Math.abs(a * x + b * y + c) < 1e-9; }),
      hint: 'Pour la droite ax + by + c = 0, le vecteur <b>(−b ; a)</b> est un vecteur directeur. Attention aux signes !',
      solution: `Ici a = ${M(a)} et b = ${M(b)}, donc ${V('u')}(−b ; a) = (<b>${M(-b)} ; ${M(a)}</b>) est un vecteur directeur.<br>Vérification : le point (${M(P0[0])} ; ${M(P0[1])}) est sur d, et (${M(P0[0] - b)} ; ${M(P0[1] + a)}) aussi.`,
    };
  }
  const two = d >= 2;
  let A, u, B;
  do {
    A = d < 1 ? [ri(-3, 3), ri(-3, 3)] : [ri(-5, 5), ri(-5, 5)];
    u = d < 1 ? [ri(1, 3), nz(-3, 3)] : d < 3 ? [nz(-4, 4), nz(-4, 4)] : [ri(-4, 4), ri(-4, 4)];
    B = add(A, u);
  } while ((!u[0] && !u[1]) || B.some(z => Math.abs(z) > 7) || (two && Math.abs(u[0]) + Math.abs(u[1]) < 2));
  const E = [u[1], -u[0], u[0] * A[1] - u[1] * A[0]], W = fen([A[0], B[0]], [A[1], B[1]]);
  const pA = { x: A[0], y: A[1], l: 'A' }, line = { a: E[0], b: E[1], c: E[2], l: 'd', side: -1 };
  const vis = two ? { pts: [pA, { x: B[0], y: B[1], l: 'B' }], center: [(A[0] + B[0]) / 2 - u[1] * 0.3, (A[1] + B[1]) / 2 + u[0] * 0.3] } : { pts: [pA], vecs: [{ x: A[0], y: A[1], dx: u[0], dy: u[1], l: '{u}', c: C.u }] };
  const uu = two ? 'AB' : 'u';
  return {
    type: 'nums',
    html: two ? `On donne ${pt('A', A)} et ${pt('B', B)}.<br>Trouve une <b>équation cartésienne</b> de la droite (AB).` : `La droite d passe par ${pt('A', A)} et a pour <b>vecteur directeur</b> ${vc('u', u)}.<br>Trouve une <b>équation cartésienne</b> de d.`,
    visual: grille({ ...W, ...vis }),
    afterVisual: grille({ ...W, ...vis, lines: [line], vecs: [...(vis.vecs || []), ...(two ? [{ x: A[0], y: A[1], dx: u[0], dy: u[1], l: '{AB}', c: C.u }] : [])] }), replaceVisual: true,
    tpl: '{0} x + {1} y + {2} = 0',
    check: eqCheck(E, u),
    // la réponse est vérifiée par les deux points de l'énoncé (A et l'extrémité de la flèche / B)
    verify: Ev => (Ev[0] || Ev[1]) && [A, B].every(p => Math.abs(Ev[0] * p[0] + Ev[1] * p[1] + Ev[2]) < 1e-9),
    hint: `${two ? `Un vecteur directeur est ${V('AB')}. ` : ''}Un point M(x ; y) est sur la droite quand ${V('AM')} et ${V(uu)} sont <b>colinéaires</b> : det(${V('AM')}, ${V(uu)}) = 0.`,
    solution: `${two ? `${V('AB')}${cp(...u)} est un vecteur directeur.<br>` : ''}M(x ; y) ∈ d ⇔ det(${V('AM')}, ${V(uu)}) = 0 ⇔ (x − ${P(A[0])}) × ${P(u[1])} − (y − ${P(A[1])}) × ${P(u[0])} = 0<br>⇔ <b>${cart(...E)}</b>.<br>(Toute équation proportionnelle convient aussi.)`,
  };
}
function C10() {
  return `<h2>10. Équation cartésienne d'une droite</h2>
<p class="intro">Une équation de droite est un « test » : un point est sur la droite exactement quand ses coordonnées vérifient l'équation.</p>
<div class="def">Un <b>vecteur directeur</b> d'une droite d est un vecteur ${V('u')} non nul qui a sa direction (par exemple ${V('AB')} si A et B sont sur d).<br>Toute droite a une équation <b>ax + by + c = 0</b> (a et b non tous deux nuls), et <b>${V('u')}(−b ; a)</b> est un vecteur directeur.</div>
${meth([`Trouve un point A de d et un vecteur directeur ${V('u')} (avec deux points : ${V('u')} = ${V('AB')}).`, `Pour un point M(x ; y) : M ∈ d ⇔ ${V('AM')}(x − ${xs('A')} ; y − ${ys('A')}) et ${V('u')} colinéaires ⇔ det(${V('AM')}, ${V('u')}) = 0.`, 'Développe et range sous la forme ax + by + c = 0. Dans les cases, tape a, b et c avec leur signe : x − 3y + 5 = 0 se saisit 1, −3 et 5. Si un terme manque, son coefficient vaut 0.', 'Dans l\'autre sens : de ax + by + c = 0, on lit le vecteur directeur <b>(−b ; a)</b>.'])}
${exq(1, 'un point et un vecteur directeur', `d passe par A(1 ; 2), de vecteur directeur ${V('u')}(3 ; 1) :<br>(x − 1) × 1 − (y − 2) × 3 = 0 ⇔ x − 1 − 3y + 6 = 0 ⇔ <b>x − 3y + 5 = 0</b>.`)}
${exq(2, 'deux points', `A(−1 ; 0) et B(1 ; 4) : ${V('AB')}(2 ; 4).<br>(x + 1) × 4 − (y − 0) × 2 = 0 ⇔ <b>4x − 2y + 4 = 0</b> (ou, en divisant par 2, 2x − y + 2 = 0).`)}
${exq(3, 'lire un vecteur directeur', `Pour 2x + 5y − 1 = 0 : a = 2, b = 5, donc ${V('u')}(−5 ; 2).<br>Pour 3y − 6 = 0 : a = 0, b = 3, donc ${V('u')}(−3 ; 0) : la droite est horizontale.`)}
${cols(grille({ xr: [-5, 5], yr: [-1, 4], pts: [{ x: 1, y: 2, l: 'A', pos: 'nw' }], vecs: [{ x: 1, y: 2, dx: 3, dy: 1, l: '{u}', c: C.u }], lines: [{ a: 1, b: -3, c: 5, l: 'd : x − 3y + 5 = 0', at: 0.3, side: -1 }], aria: 'droite passant par A de vecteur directeur u' }),
    grille({ xr: [-3, 3], yr: [-1, 5], pts: [{ x: -1, y: 0, l: 'A', pos: 'se' }, { x: 1, y: 4, l: 'B', pos: 'se' }], vecs: [{ x: -1, y: 0, dx: 2, dy: 4, l: '{AB}', c: C.u, at: 0.3 }], lines: [{ a: 2, b: -1, c: 2, l: 'd : 2x − y + 2 = 0' }], aria: 'droite (AB)' }))}
${warn(['Une droite a <b>plusieurs</b> équations cartésiennes : 2x − 6y + 10 = 0 décrit la même droite que x − 3y + 5 = 0.', '(a ; b) n\'est pas un vecteur directeur : c\'est <b>(−b ; a)</b>.', 'Pour c, vérifie en remplaçant x et y par les coordonnées de A : on doit trouver 0.'])}
${retenir(`ax + by + c = 0 a pour vecteur directeur (−b ; a) ; on l'obtient avec <span style="white-space:nowrap">det(${V('AM')}, ${V('u')}) = 0</span>.`)}`;
}

/* =====================================================================
   11. Équation réduite, coefficient directeur
   ===================================================================== */
function L11(d) {
  if (d >= 4) { // de ax + by + c = 0 à y = mx + p
    let m, p, b;
    do {
      const half = chance(0.4);
      m = half ? nz(-5, 5) / 2 : nz(-3, 3); p = half ? ri(-6, 6) / 2 : ri(-5, 5);
      b = half ? pick([2, -2, 4, -4]) : pick([-3, -2, -1, 2, 3, 4]);
    } while (Number.isInteger(m * b) === false || Number.isInteger(p * b) === false || (m === 0));
    const a = -m * b, c = -p * b, W = fen([-3, 3], [p - 3 * Math.abs(m), p + 3 * Math.abs(m)].map(z => Math.max(-8, Math.min(8, z))));
    return {
      type: 'nums',
      html: `La droite d a pour équation cartésienne ${big(cart(a, b, c))}Donne son <b>équation réduite</b> y = mx + p.`,
      visual: grille({ ...W, lines: [{ a, b, c, l: 'd' }] }),
      afterVisual: grille({ ...W, lines: [{ a, b, c, l: red(m, p).replace('y =', 'd : y =') }], pts: [{ x: 0, y: p, l: `(0 ; ${M(p)})`, c: C.s, pos: 'e' }] }), replaceVisual: true,
      tpl: 'y = {0} x + {1}', keys: { comma: true },
      check: chk([m, p], v => {
        if (eq2(v, [-m, -p])) return `Attention aux signes : on isole y, donc ${terms([[b, 'y']])} = ${terms([[-a, 'x'], [-c, '']])}.`;
        if (eq2(v, [-a, -c]) || eq2(v, [a, c])) return `Il faut encore <b>diviser par ${M(b)}</b> (le coefficient de y).`;
        if (near(v[0], m) && !near(v[1], p)) return 'Le coefficient directeur est bon ; vérifie p.';
        return '';
      }),
      // deux points de d (calculés à partir de l'équation cartésienne) doivent vérifier y = mx + p
      verify: Ev => [-2, 3].every(x => near(Ev[0] * x + Ev[1], (-c - a * x) / b)),
      hint: `Isole y : passe les termes en x et le nombre de l'autre côté, puis divise par le coefficient de y (${M(b)}).`,
      solution: `${cart(a, b, c)} ⇔ ${terms([[b, 'y']])} = ${terms([[-a, 'x'], [-c, '']])} ⇔ y = (${terms([[-a, 'x'], [-c, '']])}) ÷ ${P(b)}<br>⇔ <b>${red(m, p)}</b> : m = ${M(m)} et p = ${M(p)}.`,
    };
  }
  const only = d < 1, dec = d === 3;
  let A, dx, dy, m;
  do {
    A = [ri(-4, 4), ri(-4, 4)];
    if (dec) { dx = pick([2, -2, 4, -4]); dy = nz(-6, 6); m = dy / dx; }
    else { dx = d < 1 ? ri(1, 3) : nz(-3, 3); m = d < 2 ? nz(-3, 3) : ri(-3, 3); dy = m * dx; }
  } while ((dec && Number.isInteger(m)) || Math.abs(A[0] + dx) > 7 || Math.abs(A[1] + dy) > 7);
  const B = [A[0] + dx, A[1] + dy], p = r6(A[1] - m * A[0]);
  const W = fen([A[0], B[0], 0], [A[1], B[1], ...(only ? [] : [Math.max(-8, Math.min(8, p))])]);
  const pts = [{ x: A[0], y: A[1], l: 'A' }, { x: B[0], y: B[1], l: 'B' }], ce = [(A[0] + B[0]) / 2 + dy * 0.2, (A[1] + B[1]) / 2 - dx * 0.2];
  const line = { a: dy, b: -dx, c: dx * A[1] - dy * A[0], l: red(m, p).replace('y =', '(AB) : y =') };
  const mTxt = `m = (${ys('B')} − ${ys('A')}) ÷ (${xs('B')} − ${xs('A')}) = (${M(B[1])} − ${P(A[1])}) ÷ (${M(B[0])} − ${P(A[0])}) = ${M(dy)} ÷ ${P(dx)} = ${M(r6(m))}`;
  return {
    type: 'nums',
    html: `On donne ${pt('A', A)} et ${pt('B', B)}.<br>${only ? 'Calcule le <b>coefficient directeur</b> m de la droite (AB).' : 'Donne l\'<b>équation réduite</b> y = mx + p de la droite (AB).'}`,
    visual: grille({ ...W, pts, center: ce }),
    afterVisual: grille({ ...W, pts, center: ce, lines: [line], steps: [{ x: A[0], y: A[1], dx, dy }] }), replaceVisual: true,
    tpl: only ? 'm = {0}' : 'y = {0} x + {1}', keys: { comma: dec },
    check: chk(only ? [r6(m)] : [r6(m), p], v => {
      if (dy !== 0 && near(v[0], r6(dx / dy)) && !near(dx / dy, m)) return 'C\'est l\'inverse : la variation de <b>y en haut</b>, celle de x en bas.';
      if (m !== 0 && near(v[0], -m)) return 'Attention au signe : même ordre en haut et en bas (B − A).';
      if (!only && near(v[0], m)) return `m est bon. Pour p, remplace x et y par les coordonnées de A dans y = ${M(m)}x + p.`;
      return '';
    }),
    verify: only ? Ev => near(Math.tan(Math.atan2(B[1] - A[1], B[0] - A[0])), Ev[0]) : Ev => [A, B].every(q => near(Ev[0] * q[0] + Ev[1], q[1])),
    hint: only ? `<b>m = (${ys('B')} − ${ys('A')}) ÷ (${xs('B')} − ${xs('A')})</b> : la variation de y divisée par la variation de x.` : `Calcule d'abord m = (${ys('B')} − ${ys('A')}) ÷ (${xs('B')} − ${xs('A')}), puis trouve p en écrivant que A est sur la droite : ${ys('A')} = m × ${xs('A')} + p.`,
    solution: `${mTxt}.${only ? `<br>Quand x augmente de 1, y ${m > 0 ? 'augmente' : m < 0 ? 'diminue' : 'ne change pas'}${m ? ` de ${M(Math.abs(m))}` : ''}.` : `<br>A est sur la droite : ${M(A[1])} = ${M(r6(m))} × ${P(A[0])} + p, donc p = ${M(A[1])} − ${P(r6(m * A[0]))} = ${M(p)}.<br><b>${red(r6(m), p)}</b>.`}`,
  };
}
function C11() {
  return `<h2>11. Équation réduite</h2>
<p class="intro">L'équation réduite y = mx + p se lit directement : m dit si la droite monte ou descend, p dit où elle coupe l'axe des ordonnées.</p>
<div class="def">Une droite <b>non verticale</b> a une équation réduite <b>y = mx + p</b> : m est le <b>coefficient directeur</b> (la pente), p l'<b>ordonnée à l'origine</b>.<br>Si A et B sont sur la droite : <b>m = (${ys('B')} − ${ys('A')}) ÷ (${xs('B')} − ${xs('A')})</b>.<br>Une droite verticale a une équation x = k (pas d'équation réduite y = …).</div>
${meth([`Calcule m = (${ys('B')} − ${ys('A')}) ÷ (${xs('B')} − ${xs('A')}) : variation de y en haut, variation de x en bas, dans le même ordre.`, `Trouve p en écrivant que A est sur la droite : ${ys('A')} = m × ${xs('A')} + p.`, 'Depuis ax + by + c = 0 : laisse by d\'un côté, passe le reste de l\'autre (en changeant les signes), puis <b>divise par b</b>.'])}
${exq(1, 'avec deux points', `A(1 ; 1) et B(3 ; 5) : m = (5 − 1) ÷ (3 − 1) = 4 ÷ 2 = 2.<br>1 = 2 × 1 + p donc p = −1 : <b>y = 2x − 1</b>.`)}
${exq(2, 'une pente décimale', 'A(−2 ; 3) et B(2 ; 1) : m = (1 − 3) ÷ (2 − (−2)) = −2 ÷ 4 = −0,5.<br>3 = −0,5 × (−2) + p = 1 + p, donc p = 2 : <b>y = −0,5x + 2</b>.')}
${exq(3, 'depuis une équation cartésienne', '2x + 4y − 8 = 0 ⇔ 4y = −2x + 8 ⇔ y = (−2x + 8) ÷ 4 ⇔ <b>y = −0,5x + 2</b>.<br>C\'est la même droite qu\'à l\'exemple 2 !')}
${cols(grille({ xr: [-2, 5], yr: [-2, 6], pts: [{ x: 1, y: 1, l: 'A', pos: 'nw' }, { x: 3, y: 5, l: 'B', pos: 'nw' }], lines: [{ a: 2, b: -1, c: -1, l: 'y = 2x − 1', at: 0.82, side: -1 }], steps: [{ x: 1, y: 1, dx: 2, dy: 4 }], aria: 'droite y = 2x − 1 : on avance de 2, on monte de 4' }),
    grille({ xr: [-3, 5], yr: [-1, 4], pts: [{ x: -2, y: 3, l: 'A', pos: 'sw' }, { x: 2, y: 1, l: 'B', pos: 'sw' }, { x: 0, y: 2, l: 'p = 2', c: C.s, pos: 'ne' }], lines: [{ a: 1, b: 2, c: -4, l: 'y = −0,5x + 2', at: 0.88 }], steps: [{ x: 2, y: 1, dx: 2, dy: -1 }], aria: 'droite y = −0,5x + 2 : pente négative, ordonnée à l\'origine 2' }))}
${warn(['m = variation de y ÷ variation de x (et pas l\'inverse), dans le même ordre en haut et en bas.', 'Pour passer de ax + by + c = 0 à y = mx + p, il faut <b>diviser par b</b> (et garder les bons signes).', 'm &gt; 0 : la droite monte ; m &lt; 0 : elle descend. Contrôle sur la figure !'])}
${retenir('y = mx + p : m = (y<sub>B</sub> − y<sub>A</sub>) ÷ (x<sub>B</sub> − x<sub>A</sub>), puis p avec les coordonnées d\'un point.')}`;
}

/* =====================================================================
   12. Droites parallèles ou sécantes, intersection
   ===================================================================== */
/** la droite ax + by + c = 0 coupe-t-elle un axe entre −5 et 5 ? (elle se voit dans la fenêtre [−6 ; 6]) */
const visible = (a, b, c) => (b !== 0 && Math.abs(c / b) <= 5) || (a !== 0 && Math.abs(c / a) <= 5);
function L12(d) {
  const L1c = C.u, L2c = C.v;
  if (d >= 4 && chance(0.5)) { // parallèles ou sécantes ?
    let a1, b1, c1, a2, b2, c2, E;
    do {
      a1 = nz(-4, 4); b1 = nz(-4, 4); c1 = ri(-6, 6);
      const k = pick([-2, -1, 2, 3]), r = ri(0, d >= 5 ? 2 : 1);
      if (r === 0) { a2 = k * a1 + pick([1, -1]); b2 = k * b1; c2 = ri(-6, 6); E = 'sec'; }
      else if (r === 1) { a2 = k * a1; b2 = k * b1; c2 = k * c1 + nz(-4, 4); E = 'par'; }
      else { a2 = k * a1; b2 = k * b1; c2 = k * c1; E = 'conf'; }
    } while ([a2, b2, c2].some(z => Math.abs(z) > 12) || (a2 === 0 && b2 === 0) || !visible(a1, b1, c1) || !visible(a2, b2, c2));
    const opts = [{ v: 'sec', l: 'Sécantes' }, { v: 'par', l: 'Strictement parallèles' }, ...(d >= 5 ? [{ v: 'conf', l: 'Confondues' }] : [])];
    const W = { xr: [-6, 6], yr: [-6, 6] };
    const det = a1 * b2 - a2 * b1;
    return {
      type: 'choice',
      html: `On donne les droites ${big(`d<sub>1</sub> : ${cart(a1, b1, c1)}<br>d<sub>2</sub> : ${cart(a2, b2, c2)}`)}Ces deux droites sont-elles :`,
      visual: grille({ ...W, lines: [{ a: a1, b: b1, c: c1, col: L1c, l: 'd₁' }, { a: a2, b: b2, c: c2, col: L2c, l: 'd₂', dash: E === 'conf', side: -1 }] }),
      opts,
      check: choiceCheck(E, { msg: () => (E === 'sec' ? `Les vecteurs directeurs ne sont pas colinéaires (déterminant ${M(det)} ≠ 0).` : 'Les vecteurs directeurs sont colinéaires : les droites sont parallèles.' + (d >= 5 ? ' Sont-elles confondues ? Teste un point.' : '')) }),
      // vérification : directions comparées par les angles, puis un point de d₁ testé dans d₂
      verify: Ev => {
        const par = Math.abs(sinAng(-b1, a1, -b2, a2)) < 1e-9;
        if (!par) return Ev === 'sec';
        const x = 1.3, y = (-c1 - a1 * x) / b1, on = Math.abs(a2 * x + b2 * y + c2) < 1e-9;
        return Ev === (on ? 'conf' : 'par');
      },
      hint: `Compare les vecteurs directeurs ${V('u')}<sub>1</sub>(−b ; a) de d<sub>1</sub> et ${V('u')}<sub>2</sub> de d<sub>2</sub> : sont-ils colinéaires (déterminant nul) ?${d >= 5 ? ' Si oui, regarde si un point de d<sub>1</sub> est sur d<sub>2</sub>.' : ''}`,
      solution: `${V('u')}<sub>1</sub>${cp(-b1, a1)} et ${V('u')}<sub>2</sub>${cp(-b2, a2)} : det = ${M(-b1)} × ${P(a2)} − ${P(a1)} × ${P(-b2)} = ${M(-b1 * a2 + a1 * b2)}.<br>`
        + (E === 'sec' ? 'Il n\'est pas nul : les droites sont <b>sécantes</b>.' : `Il est nul : les droites sont parallèles. ${E === 'conf' ? `De plus d<sub>2</sub> s'obtient en multipliant l'équation de d<sub>1</sub> par ${M(a2 / a1)} : elles sont <b>confondues</b>.` : `Mais les équations ne sont pas proportionnelles (c ne suit pas) : elles sont <b>strictement parallèles</b>.`}`),
    };
  }
  let x0, y0, eqs, html, l1, l2, sol;
  x0 = ri(-4, 4); y0 = ri(-5, 5);
  if (d < 2) {
    let m1, m2, p1, p2;
    do { m1 = d < 1 ? nz(-2, 3) : nz(-3, 3); m2 = ri(-3, 3); p1 = y0 - m1 * x0; p2 = y0 - m2 * x0; } while (m1 === m2 || Math.abs(p1) > 9 || Math.abs(p2) > 9);
    eqs = [[m1, -1, p1], [m2, -1, p2]];
    l1 = red(m1, p1); l2 = red(m2, p2);
    html = `On donne les droites ${big(`d<sub>1</sub> : ${l1}<br>d<sub>2</sub> : ${l2}`)}Elles sont sécantes. Calcule les coordonnées de leur point d'intersection I.`;
    sol = `I est sur les deux droites : ${terms([[m1, 'x'], [p1, '']])} = ${terms([[m2, 'x'], [p2, '']])}<br>⇔ ${terms([[m1 - m2, 'x']])} = ${M(p2 - p1)} ⇔ x = ${M(x0)}.<br>Puis y = ${M(m1)} × ${P(x0)} ${p1 < 0 ? '−' : '+'} ${M(Math.abs(p1))} = ${M(y0)}. Donc I(<b>${M(x0)} ; ${M(y0)}</b>).`;
  } else {
    let a1, b1, a2, b2;
    do { a1 = nz(-4, 4); b1 = nz(-4, 4); a2 = nz(-4, 4); b2 = d < 3 ? pick([1, -1]) : nz(-4, 4); } while (a1 * b2 - a2 * b1 === 0 || Math.abs(a1 * x0 + b1 * y0) > 20 || Math.abs(a2 * x0 + b2 * y0) > 20);
    eqs = [[a1, b1, -(a1 * x0 + b1 * y0)], [a2, b2, -(a2 * x0 + b2 * y0)]];
    l1 = cart(...eqs[0]); l2 = cart(...eqs[1]);
    html = `On donne les droites ${big(`d<sub>1</sub> : ${l1}<br>d<sub>2</sub> : ${l2}`)}Elles sont sécantes. Calcule les coordonnées de leur point d'intersection I (on résout le système).`;
    sol = `On résout le système formé par les deux équations (par substitution ou par combinaison).<br>`
      + (Math.abs(b2) === 1 ? `De d<sub>2</sub> : y = ${terms([[-a2 * b2, 'x'], [-eqs[1][2] * b2, '']])}. On remplace dans d<sub>1</sub> et on trouve x = ${M(x0)}, puis y = ${M(y0)}.` : `En éliminant y (on multiplie d<sub>1</sub> par ${P(b2)} et d<sub>2</sub> par ${P(b1)} puis on soustrait) : ${M(a1 * b2 - a2 * b1)}x = ${M((a1 * b2 - a2 * b1) * x0)}, donc x = ${M(x0)} ; puis y = ${M(y0)}.`)
      + `<br>Donc I(<b>${M(x0)} ; ${M(y0)}</b>). Vérification : ${M(eqs[0][0])} × ${P(x0)} + ${P(eqs[0][1])} × ${P(y0)} + ${P(eqs[0][2])} = 0.`;
  }
  const W = fen([x0, -4, 4], [y0, -4, 4], 2);
  const lines = [{ a: eqs[0][0], b: eqs[0][1], c: eqs[0][2], col: L1c, l: 'd₁' }, { a: eqs[1][0], b: eqs[1][1], c: eqs[1][2], col: L2c, l: 'd₂' }];
  return {
    type: 'nums',
    html,
    visual: grille({ ...W, lines, avoid: [[x0, y0]] }),
    afterVisual: grille({ ...W, lines, avoid: [[x0, y0]], pts: [{ x: x0, y: y0, l: 'I', c: C.s, pos: 'e' }] }), replaceVisual: true,
    tpl: TPLP('I'),
    check: chk([x0, y0], v => {
      if (x0 !== y0 && near(v[0], y0) && near(v[1], x0)) return 'Tu as inversé x et y.';
      if (near(v[0], x0) && !near(v[1], y0)) return `x est bon ! Remplace x par ${M(x0)} dans une des équations pour trouver y.`;
      return '';
    }),
    verify: Ev => eqs.every(([a, b, c]) => Math.abs(a * Ev[0] + b * Ev[1] + c) < 1e-9),
    hint: d < 2 ? 'Au point d\'intersection, les deux droites ont le même y : écris l\'égalité des deux expressions et résous en x.' : 'Résous le système : isole une inconnue dans une équation et remplace-la dans l\'autre (substitution), ou combine les équations pour éliminer y.',
    solution: sol + '<br>Sur la figure, on lit bien le point d\'intersection.',
  };
}
function C12() {
  return `<h2>12. Droites parallèles ou sécantes</h2>
<p class="intro">Deux droites du plan sont soit parallèles, soit sécantes. Les vecteurs directeurs le disent ; un système d'équations donne le point commun.</p>
<div class="def">Deux droites sont <b>parallèles</b> quand leurs vecteurs directeurs sont <b>colinéaires</b> (déterminant nul) ; avec des équations réduites : même coefficient directeur m.<br>Sinon, elles sont <b>sécantes</b> : leur point d'intersection est la solution du <b>système</b> formé par les deux équations.<br>Deux droites parallèles sont soit <b>strictement parallèles</b>, soit <b>confondues</b> (équations proportionnelles).</div>
${meth(['Parallèles ou sécantes ? Prends les vecteurs directeurs (−b ; a) et calcule leur déterminant : nul ⇔ parallèles.', 'Parallèles : si un point de d<sub>1</sub> est aussi sur d<sub>2</sub>, elles sont confondues ; sinon, strictement parallèles.', 'Sécantes, avec y = mx + p : écris m<sub>1</sub>x + p<sub>1</sub> = m<sub>2</sub>x + p<sub>2</sub>, trouve x, puis y.', 'Sécantes, avec ax + by + c = 0 : isole une inconnue dans une équation et remplace-la dans l\'autre (substitution), ou combine les équations.', 'Vérifie : le point trouvé doit vérifier les <b>deux</b> équations.'])}
${exq(1, 'équations réduites', 'd<sub>1</sub> : y = 2x − 1 et d<sub>2</sub> : y = −x + 5.<br>2x − 1 = −x + 5 ⇔ 3x = 6 ⇔ x = 2, puis y = 2 × 2 − 1 = 3 : <b>I(2 ; 3)</b>.')}
${exq(2, 'un système', 'd<sub>1</sub> : 2x + y − 4 = 0 et d<sub>2</sub> : x − y + 1 = 0.<br>De d<sub>2</sub> : y = x + 1. Dans d<sub>1</sub> : 2x + (x + 1) − 4 = 0 ⇔ 3x = 3 ⇔ x = 1, puis y = 1 + 1 = 2 : <b>I(1&nbsp;;&nbsp;2)</b>.<br>Vérification : 2 × 1 + 2 − 4 = 0 et 1 − 2 + 1 = 0.')}
${exq(3, 'parallèles', 'd<sub>1</sub> : 2x − y − 1 = 0 et d<sub>3</sub> : 4x − 2y − 3 = 0 : vecteurs directeurs (1 ; 2) et (2 ; 4), det = 1 × 4 − 2 × 2 = 0 : parallèles. Les équations ne sont pas proportionnelles (−1 × 2 ≠ −3) : <b>strictement parallèles</b>.<br>Avec 4x − 2y − 2 = 0 (2 fois d<sub>1</sub>), elles seraient <b>confondues</b>.')}
${cols(grille({ xr: [-2, 5], yr: [-2, 6], lines: [{ a: 2, b: -1, c: -1, col: C.u, l: 'd₁', at: 0.85 }, { a: 1, b: 1, c: -5, col: C.v, l: 'd₂', at: 0.15 }, { a: 4, b: -2, c: -3, col: '#868e96', l: 'd₃', at: 0.7, dash: true }], pts: [{ x: 2, y: 3, l: 'I(2 ; 3)', c: C.s, pos: 'e' }], aria: 'd1 et d2 sécantes en I, d1 et d3 parallèles' }),
    grille({ xr: [-2, 4], yr: [-2, 5], lines: [{ a: 2, b: 1, c: -4, col: C.u, l: 'd₁', at: 0.2 }, { a: 1, b: -1, c: 1, col: C.v, l: 'd₂', at: 0.85 }], pts: [{ x: 1, y: 2, l: 'I(1 ; 2)', c: C.s, pos: 'e' }], aria: 'intersection de deux droites par un système' }))}
${warn(['Une fois x trouvé, ne pas oublier de calculer y !', 'Ne pas inverser x et y dans la réponse.', 'Même direction ne veut pas dire même droite : teste un point pour savoir si elles sont confondues.'])}
${retenir('parallèles ⇔ vecteurs directeurs colinéaires ; sinon, le point d\'intersection est la solution du système.')}`;
}

/* ================= niveaux ================= */
const LEVELS_ = [
  { titre: 'Lire un vecteur', generate: L1, cours: C1 },
  { titre: 'Coordonnées de AB', generate: L2, cours: C2 },
  { titre: 'Translation', generate: L3, cours: C3 },
  { titre: 'Somme de vecteurs', generate: L4, cours: C4 },
  { titre: 'Produit par un réel', generate: L5, cours: C5 },
  { titre: 'Milieu d\'un segment', generate: L6, cours: C6 },
  { titre: 'Norme et distance', generate: L7, cours: C7 },
  { titre: 'Colinéarité', generate: L8, cours: C8 },
  { titre: 'Parallélogramme', generate: L9, cours: C9 },
  { titre: 'Équation cartésienne', generate: L10, cours: C10 },
  { titre: 'Équation réduite', generate: L11, cours: C11 },
  { titre: 'Intersection de droites', generate: L12, cours: C12 },
];
export const LEVELS = LEVELS_.map(L => ({ classe: '2de', ...L }));
export const OPTIONS = { need: 4, keys: { comma: true } };

// Thalès et trigonométrie (3e) : 12 niveaux.
// Chaque exercice est construit à partir de COORDONNÉES : la figure est dessinée à partir d'elles
// (rotation et symétrie au hasard selon d) et les tests recalculent la réponse sur ces coordonnées
// (Math.hypot, Math.atan2, produit vectoriel pour le parallélisme) dans verify / value.
import { ri, pick, shuffle, chance } from '../../engine/util/rand.js';
import { gcd, r6, decimals } from '../../engine/util/arith.js';
import { M, F, big } from '../../engine/util/fmt.js';
import { numsCheck, choiceCheck } from '../../engine/answers/checks.js';
import { figure, grilleK } from './draw.js';

/* ================= outils ================= */
const DEG = Math.PI / 180;
const sub = (p, q) => [p[0] - q[0], p[1] - q[1]];
const mul = (p, k) => [p[0] * k, p[1] * k];
const D = (P, a, b) => Math.hypot(P[a][0] - P[b][0], P[a][1] - P[b][1]);
const cross = (u, v) => u[0] * v[1] - u[1] * v[0];
const dot = (u, v) => u[0] * v[0] + u[1] * v[1];
/** angle (en degrés) de sommet v entre les demi-droites [va) et [vb), à partir des coordonnées */
const angleAt = (P, v, a, b) => { const u = sub(P[a], P[v]), w = sub(P[b], P[v]); return Math.abs(Math.atan2(cross(u, w), dot(u, w))) / DEG; };
/** (ab) et (cd) parallèles ? (produit vectoriel normalisé) */
const parallel = (P, a, b, c, d) => { const u = sub(P[b], P[a]), w = sub(P[d], P[c]); return Math.abs(cross(u, w)) < 1e-9 * Math.hypot(...u) * Math.hypot(...w); };
const r1 = x => Math.round(x * 10) / 10;
const cm = x => `${M(x)} cm`;
const near = (x, y, e = 0.05 + 1e-9) => Math.abs(x - y) <= e;
/** trop près d'un arrondi ambigu (…,x5 au dixième ou …,5 au degré) */
const tie = (x, step) => { const f = x / step - Math.floor(x / step); return Math.abs(f - 0.5) < 0.04; };
const LETTRES = 'ABCDEFGHJKLMNPRSTUVXYZ'.split('');
/** noms des points : rôles fixes jusqu'à d = 2, lettres au hasard ensuite */
function noms(d, roles, std = roles) {
  if (d < 3) return Object.fromEntries(roles.map((r, i) => [r, std[i]]));
  const L = shuffle([...LETTRES]).slice(0, roles.length);
  return Object.fromEntries(roles.map((r, i) => [r, L[i]]));
}
/** orientation de la figure : droite au début, puis légèrement tournée, puis n'importe comment */
function orient(d) {
  if (d < 1) return { rot: 0, flip: false };
  if (d < 2) return { rot: ri(-15, 15) * DEG, flip: chance(0.5) };
  return { rot: ri(0, 359) * DEG, flip: chance(0.5) };
}
/** figure à partir de rôles (A, B, M…) et des noms affichés N */
function mk(P, N, o) {
  const n = r => (N[r] !== undefined ? N[r] : r);
  const Q = {}; for (const k in P) Q[n(k)] = P[k];
  return figure({
    ...o, P: Q,
    segs: (o.segs || []).map(([a, b, s]) => [n(a), n(b), s]),
    lens: (o.lens || []).map(L => ({ ...L, a: n(L.a), b: n(L.b) })),
    par: (o.par || []).map(([a, b]) => [n(a), n(b)]),
    right: (o.right || []).map(r => r.map(n)),
    angs: (o.angs || []).map(g => ({ ...g, v: n(g.v), a: n(g.a), b: n(g.b) })),
    hide: (o.hide || []).map(n),
  });
}
const ang = (a, v, b) => `${a}${v}̂${b}`;     // angle BÂC (accent circonflexe combinant)
const dr = s => `(${s})`;                                 // droite (MN)
/** check numérique avec messages « presque juste » : alts = [{x, msg}] */
function lenCheck(E, exact, alts = [], step = 0.1, unite = 'au dixième') {
  return numsCheck([E], {
    msg: v => {
      const x = v[0];
      if (step && Math.abs(x - exact) < step + 1e-9 && x !== E) return `Presque ! Vérifie l'arrondi ${unite} : regarde le chiffre suivant pour arrondir (et non tronquer).`;
      for (const a of alts) if (a.x !== undefined && isFinite(a.x) && near(x, a.x, a.e)) return a.msg;
      return '';
    },
  });
}

/* ================= Thalès : construction ================= */
// Grand triangle ABC (c = AB, b = AC, a = BC) ; M sur (AB), N sur (AC) avec AM = k·AB et AN = k·AC.
// En configuration « papillon », M et N sont de l'autre côté de A.
function okTri(a, b, c) {
  if (a >= b + c || b >= a + c || c >= a + b) return false;
  const A = Math.acos((b * b + c * c - a * a) / (2 * b * c)) / DEG, B = Math.acos((a * a + c * c - b * b) / (2 * a * c)) / DEG, C = 180 - A - B;
  return A >= 34 && A <= 100 && B >= 32 && C >= 32;
}
function thalesPts(c, b, a, k, pap, tilt = ri(-8, 8) * DEG) {
  const al = Math.acos((b * b + c * c - a * a) / (2 * b * c));
  const u = [Math.cos(-Math.PI / 2 - al / 2 + tilt), Math.sin(-Math.PI / 2 - al / 2 + tilt)];
  const v = [Math.cos(-Math.PI / 2 + al / 2 + tilt), Math.sin(-Math.PI / 2 + al / 2 + tilt)];
  const s = pap ? -1 : 1;
  return { A: [0, 0], B: mul(u, c), C: mul(v, b), M: mul(u, s * k * c), N: mul(v, s * k * b) };
}
/** longueurs d'une configuration de Thalès : entières (mode 'int') ou décimales ('dec') */
function thalesNums(d, mode, pap = false) {
  for (;;) {
    let k, AB, AC, BC;
    if (mode === 'int') {
      let p, q;
      do { q = pick(d < 1 ? [2, 3] : [2, 3, 4, 5]); p = ri(1, pap ? 2 * q - 1 : q - 1); } while (gcd(p, q) !== 1 || p / q < 0.3 || p / q > (pap ? 1.7 : 0.8) || p === q);
      const mx = Math.floor(20 / Math.max(p, q));
      if (mx < 2) continue;
      k = p / q; AB = q * ri(2, mx); AC = q * ri(2, mx); BC = q * ri(2, mx);
    } else {
      k = pick(pap ? [0.4, 0.6, 0.8, 0.75, 1.5, 1.2, 0.5] : [0.4, 0.6, 0.8, 0.75, 0.3, 0.7, 0.5]);
      AB = ri(6, 32) / 2; AC = ri(6, 32) / 2; BC = ri(30, 160) / 10;
      if ([AB, AC, BC].some(x => decimals(k * x) > 1) || [AB, AC, BC].every(x => Number.isInteger(x))) continue;
    }
    if (!okTri(BC, AC, AB)) continue;
    return { k, AB, AC, BC, AM: r6(k * AB), AN: r6(k * AC), MN: r6(k * BC), MB: r6(pap ? AB + k * AB : AB - k * AB), NC: r6(pap ? AC + k * AC : AC - k * AC) };
  }
}
// les trois rapports : [petit, grand]
const RAT = [[['A', 'M'], ['A', 'B']], [['A', 'N'], ['A', 'C']], [['M', 'N'], ['B', 'C']]];
const key = r => r.join('');
const sg = (N, r) => N[r[0]] + N[r[1]];
const ratioRow = (N, list) => list.map(([p, q]) => F(sg(N, p), sg(N, q))).join(' = ');
/** segments de la figure de Thalès */
function thalesSegs(pap, parMarks = true) {
  const st = parMarks ? 'par' : undefined;
  return pap
    ? [['M', 'A'], ['A', 'B'], ['N', 'A'], ['A', 'C'], ['M', 'N', st], ['B', 'C', st]]
    : [['A', 'M'], ['M', 'B'], ['A', 'N'], ['N', 'C'], ['M', 'N', st], ['B', 'C', st]];
}
const WHOLE = { AB: 1, AC: 1, MB: 0, NC: 0 };
/** étiquette de longueur (cote pour un côté entier en configuration emboîtée) */
const lenLab = (pap, r, t, ask) => ({ a: r[0], b: r[1], t, ask, dim: !pap && WHOLE[key(r)] === 1, });
const hypText = (N, pap) => pap
  ? `Les droites ${dr(N.M + N.B)} et ${dr(N.N + N.C)} se coupent en ${N.A}, et ${dr(N.M + N.N)} // ${dr(N.B + N.C)}.`
  : `${N.M} ∈ [${N.A}${N.B}], ${N.N} ∈ [${N.A}${N.C}] et ${dr(N.M + N.N)} // ${dr(N.B + N.C)}.`;
const thmText = (N, pap) => `${dr(N.M + N.N)} // ${dr(N.B + N.C)}${pap ? `, les points ${N.M}, ${N.A}, ${N.B} sont alignés ainsi que ${N.N}, ${N.A}, ${N.C}` : ''} : d'après le <b>théorème de Thalès</b>,`;

/**
 * Question « calculer une longueur » en configuration de Thalès.
 * i = rapport complet connu, j = rapport où l'on cherche, s = 0 (petit triangle) ou 1 (grand).
 */
function thalesAsk(d, { pap, mode, i, j, s, extra }) {
  const T = thalesNums(d, mode, pap);
  const P = thalesPts(T.AB, T.AC, T.BC, T.k, pap);
  const N = noms(d, ['A', 'B', 'C', 'M', 'N']);
  const L = { AM: T.AM, AB: T.AB, AN: T.AN, AC: T.AC, MN: T.MN, BC: T.BC };
  const asked = RAT[j][s], known = RAT[j][1 - s];
  const sm = L[key(RAT[i][0])], bg = L[key(RAT[i][1])], kn = L[key(known)];
  const X = r6(s === 0 ? kn * sm / bg : kn * bg / sm), Xinv = s === 0 ? kn * bg / sm : kn * sm / bg;
  const given = [RAT[i][0], RAT[i][1], known];
  if (extra) { const t = 3 - i - j; given.push(RAT[t][chance(0.5) ? 0 : 1]); }
  const lens = given.map(r => lenLab(pap, r, cm(L[key(r)]))).concat([lenLab(pap, asked, '?', true)]);
  const fig = mk(P, N, { segs: thalesSegs(pap), par: [['M', 'N'], ['B', 'C']], lens, ...orient(d), aria: 'configuration de Thalès' });
  const order = shuffle(given.slice());
  const aN = sg(N, asked);
  return {
    type: 'nums', tpl: `${aN} = {0} cm`, keys: { comma: true, neg: false },
    html: `${hypText(N, pap)}<br>On donne ${order.map(r => `${sg(N, r)} = ${cm(L[key(r)])}`).join(' ; ')}.<br>Calcule <b>${aN}</b>.`,
    visual: fig,
    check: lenCheck(X, X, [{ x: Xinv, msg: `Un rapport est inversé ! En haut, les longueurs du triangle ${N.A}${N.M}${N.N} ; en bas, celles du triangle ${N.A}${N.B}${N.C}.` }], 0),
    value: r6(D(P, asked[0], asked[1])),
    verify: ([E]) => parallel(P, 'M', 'N', 'B', 'C') && Math.abs(E - D(P, asked[0], asked[1])) < 1e-9 && near(D(P, 'B', 'C'), T.BC, 1e-9),
    hint: `Écris l'égalité des trois rapports ${ratioRow(N, RAT)}, puis remplace par les longueurs connues. Garde les deux rapports où il y a ${aN} et le rapport complet, et fais un produit en croix.`,
    solution: `${thmText(N, pap)} ${big(ratioRow(N, RAT))}On utilise ${F(sg(N, RAT[i][0]), sg(N, RAT[i][1]))} = ${F(sg(N, RAT[j][0]), sg(N, RAT[j][1]))} : ${F(M(sm), M(bg))} = ${s === 0 ? F(aN, M(kn)) : F(M(kn), aN)}.<br>Produit en croix : ${aN} = ${s === 0 ? `${M(kn)} × ${M(sm)} ÷ ${M(bg)}` : `${M(kn)} × ${M(bg)} ÷ ${M(sm)}`} = <b>${cm(X)}</b>.`,
  };
}
function pickIJS(d) {
  if (d < 1) return { i: 0, j: 2, s: 0 };
  if (d < 2) return { i: pick([0, 1]), j: 2, s: ri(0, 1) };
  const i = ri(0, 2); let j; do { j = ri(0, 2); } while (j === i);
  return { i, j, s: ri(0, 1) };
}

/* ================= niveaux de Thalès ================= */

/* ---------- 1. configuration et égalité des rapports ---------- */
function L1(d) {
  for (;;) {
    const pap = d >= 2 && chance(0.5);
    const T = thalesNums(d, 'int', pap);
    const P = thalesPts(T.AB, T.AC, T.BC, T.k, pap);
    const N = noms(d, ['A', 'B', 'C', 'M', 'N']);
    const inv = ri(0, 1);
    const O = {
      ok: RAT,
      inv: RAT.map((r, t) => (t === inv ? [r[1], r[0]] : r)),
      som: pap ? [[['A', 'M'], ['A', 'C']], [['A', 'N'], ['A', 'B']], RAT[2]] : [[['A', 'M'], ['M', 'B']], [['A', 'N'], ['N', 'C']], RAT[2]],
      cote: [RAT[0], RAT[1], [['M', 'N'], ['A', 'C']]],
    };
    const allEq = l => { const v = l.map(([p, q]) => D(P, ...p) / D(P, ...q)); return v.every(x => Math.abs(x - v[0]) < 1e-9); };
    if (['inv', 'som', 'cote'].some(id => allEq(O[id]))) continue;
    const opts = shuffle(Object.keys(O).map(id => ({ v: id, l: ratioRow(N, O[id]) })));
    const fig = mk(P, N, { segs: thalesSegs(pap), par: [['M', 'N'], ['B', 'C']], ...orient(d), aria: 'configuration de Thalès' });
    const MSG = {
      inv: `Un rapport est à l'envers : en haut, toujours les côtés du triangle ${N.A}${N.M}${N.N} ; en bas, ceux du triangle ${N.A}${N.B}${N.C}.`,
      som: pap ? `Chaque rapport reste sur la même droite : ${N.A}${N.M} va avec ${N.A}${N.B} (points alignés).` : `Les longueurs se mesurent toutes depuis le sommet commun ${N.A} : ${N.A}${N.M} et ${N.A}${N.B}, pas ${N.M}${N.B}.`,
      cote: `Le troisième rapport compare les deux côtés parallèles : ${N.M}${N.N} et ${N.B}${N.C}.`,
    };
    return {
      type: 'choice', opts, visual: fig,
      html: `${hypText(N, pap)}<br>Quelle égalité donne le théorème de Thalès ?`,
      check: choiceCheck('ok', { msg: c => MSG[c] || '' }),
      verify: E => parallel(P, 'M', 'N', 'B', 'C') && allEq(O[E]) && Object.keys(O).filter(id => id !== E).every(id => !allEq(O[id])),
      hint: `Repère les deux triangles : le petit ${N.A}${N.M}${N.N} et le grand ${N.A}${N.B}${N.C}, avec le sommet commun ${N.A}. Chaque rapport = côté du petit ÷ côté correspondant du grand.`,
      solution: `${thmText(N, pap)}${big(ratioRow(N, RAT))}Les côtés correspondants : ${N.A}${N.M} et ${N.A}${N.B} (sur la même droite), ${N.A}${N.N} et ${N.A}${N.C}, puis les côtés parallèles ${N.M}${N.N} et ${N.B}${N.C}.`,
    };
  }
}
function C1() {
  const T = { AB: 10, AC: 12, BC: 9, k: 0.4 };
  const emb = mk(thalesPts(T.AB, T.AC, T.BC, T.k, false, 0), {}, { segs: thalesSegs(false), par: [['M', 'N'], ['B', 'C']], aria: 'triangles emboîtés AMN et ABC' });
  const pap = mk(thalesPts(8, 10, 9, 0.5, true, 0), {}, { segs: thalesSegs(true), par: [['M', 'N'], ['B', 'C']], aria: 'configuration papillon' });
  return `<h2>1. Reconnaître une configuration de Thalès</h2>
<p class="intro">Le théorème de Thalès sert à calculer des longueurs quand deux droites parallèles coupent deux droites sécantes. Avant de calculer, il faut savoir écrire la bonne égalité.</p>
<div class="def">Deux droites sécantes en <b>A</b> ; M et B sur l'une, N et C sur l'autre ; <b>(MN) // (BC)</b>.<br>
Alors les triangles AMN et ABC ont des côtés proportionnels : ${big(`${F('AM', 'AB')} = ${F('AN', 'AC')} = ${F('MN', 'BC')}`)}</div>
<div class="cols">${emb}${pap}</div>
<div class="methode"><b>Méthode</b><ol><li>Repère le sommet commun A : le point où se coupent les deux droites.</li><li>Repère les deux droites parallèles : elles donnent le triangle AMN et le triangle ABC.</li><li>En haut des fractions : les côtés de AMN (AM, AN, MN). En bas : les côtés <b>correspondants</b> de ABC (AB, AC, BC).</li><li>Vérifie : dans chaque fraction, les deux longueurs sont sur la même droite, ou sur les deux parallèles.</li></ol></div>
<div class="ex"><span class="q">Exemple 1 : M ∈ [AB], N ∈ [AC] et (MN) // (BC).</span><br>Petit triangle AMN, grand triangle ABC : ${F('AM', 'AB')} = ${F('AN', 'AC')} = ${F('MN', 'BC')}.</div>
<div class="ex"><span class="q">Exemple 2 : d'autres lettres. R ∈ [PT], S ∈ [PU] et (RS) // (TU).</span><br>Le sommet commun est P ; les parallèles sont (RS) et (TU).<br>Donc ${F('PR', 'PT')} = ${F('PS', 'PU')} = ${F('RS', 'TU')}.</div>
<div class="warn">⚠️ Rapports dans le désordre : ${F('AM', 'AB')} = ${F('AC', 'AN')} est faux (un rapport est retourné).<br>⚠️ On mesure depuis le sommet commun A : ${F('AM', 'MB')} ne fait pas partie de l'égalité de Thalès.<br>⚠️ Le troisième rapport compare les deux côtés <b>parallèles</b> : ${F('MN', 'BC')}, pas ${F('MN', 'AC')}.</div>
<p class="note">Le théorème marche aussi quand M et N sont de l'autre côté de A (configuration « papillon », à droite, et niveau 5).</p>
<div class="retenir">À retenir : en haut le petit triangle, en bas le grand, côtés correspondants face à face.</div>`;
}

/* ---------- 2. triangles emboîtés : entiers ---------- */
function L2(d) { return thalesAsk(d, { pap: false, mode: 'int', ...pickIJS(d), extra: d >= 4 }); }
function C2() {
  const T = { AB: 10, AC: 12, BC: 15, k: 0.4 };
  const f1 = mk(thalesPts(T.AB, T.AC, T.BC, T.k, false, 0), {}, { segs: thalesSegs(false), par: [['M', 'N'], ['B', 'C']], lens: [lenLab(false, ['A', 'M'], '4 cm'), lenLab(false, ['A', 'B'], '10 cm'), lenLab(false, ['B', 'C'], '15 cm'), lenLab(false, ['M', 'N'], '?', true)], aria: 'exemple 1' });
  const f2 = mk(thalesPts(7.5, 9, 6, 2 / 3, false, 0), {}, { segs: thalesSegs(false), par: [['M', 'N'], ['B', 'C']], lens: [lenLab(false, ['A', 'N'], '6 cm'), lenLab(false, ['A', 'C'], '9 cm'), lenLab(false, ['M', 'N'], '4 cm'), lenLab(false, ['B', 'C'], '?', true)], aria: 'exemple 2' });
  return `<h2>2. Calculer une longueur avec Thalès</h2>
<p class="intro">Grâce à l'égalité des rapports, on calcule une longueur qu'on ne connaît pas à partir de trois longueurs connues.</p>
<div class="def">Si M ∈ [AB], N ∈ [AC] et (MN) // (BC), alors ${F('AM', 'AB')} = ${F('AN', 'AC')} = ${F('MN', 'BC')}.<br>On garde <b>deux</b> rapports : un rapport <b>complet</b> (deux longueurs connues) et celui qui contient la longueur cherchée.</div>
<div class="methode"><b>Méthode</b><ol><li>Écris l'égalité des trois rapports avec les lettres.</li><li>Remplace par les longueurs connues.</li><li>Garde le rapport complet et le rapport où se trouve l'inconnue.</li><li>Produit en croix : inconnue = (les deux nombres en diagonale multipliés) ÷ le troisième.</li><li>Contrôle : un côté du petit triangle est plus court que le côté correspondant du grand.</li></ol></div>
<div class="cols">${f1}<div class="ex"><span class="q">Exemple 1 : AM = 4 cm, AB = 10 cm, BC = 15 cm. Calcule MN.</span><br>${F('AM', 'AB')} = ${F('MN', 'BC')} donc ${F('4', '10')} = ${F('MN', '15')}.<br>MN = 15 × 4 ÷ 10 = <b>6 cm</b>.</div></div>
<div class="cols">${f2}<div class="ex"><span class="q">Exemple 2 : l'inconnue est en bas. AN = 6 cm, AC = 9 cm, MN = 4 cm. Calcule BC.</span><br>${F('AN', 'AC')} = ${F('MN', 'BC')} donc ${F('6', '9')} = ${F('4', 'BC')}.<br>BC = 4 × 9 ÷ 6 = <b>6 cm</b>.</div></div>
<p class="note">Parfois l'énoncé donne une longueur de trop : elle ne sert pas, ne te laisse pas piéger.</p>
<div class="warn">⚠️ Ne pas inverser : ${F('4', '10')} = ${F('15', 'MN')} donnerait MN = 37,5 cm, plus grand que BC… impossible pour le petit triangle !<br>⚠️ Choisis un rapport où les <b>deux</b> longueurs sont connues : avec ${F('AN', 'AC')} sans AN, on ne peut rien calculer.</div>
<div class="retenir">À retenir : égalité des rapports, on garde le rapport complet et celui de l'inconnue, puis produit en croix.</div>`;
}

/* ---------- 3. décimaux ---------- */
function L3(d) { return thalesAsk(d, { pap: false, mode: 'dec', ...pickIJS(Math.max(d, 1)), extra: d >= 4 }); }
function C3() {
  const T = { AB: 7.5, AC: 9, BC: 6.5, k: 0.4 };
  const f1 = mk(thalesPts(T.AB, T.AC, T.BC, T.k, false, 0), {}, { segs: thalesSegs(false), par: [['M', 'N'], ['B', 'C']], lens: [lenLab(false, ['A', 'N'], '3,6 cm'), lenLab(false, ['A', 'C'], '9 cm'), lenLab(false, ['M', 'N'], '2,6 cm'), lenLab(false, ['B', 'C'], '?', true)], aria: 'exemple 1' });
  const f2 = mk(thalesPts(6, 8.5, 7, 0.4, false, 0), {}, { segs: thalesSegs(false), par: [['M', 'N'], ['B', 'C']], lens: [lenLab(false, ['A', 'M'], '2,4 cm'), lenLab(false, ['A', 'B'], '6 cm'), lenLab(false, ['A', 'C'], '8,5 cm'), lenLab(false, ['A', 'N'], '?', true)], aria: 'exemple 2' });
  return `<h2>3. Thalès avec des décimaux</h2>
<p class="intro">Les longueurs ne sont pas toujours entières. La méthode reste exactement la même : seule la calculatrice travaille un peu plus.</p>
<div class="def">Égalité des rapports, puis produit en croix.<br>Avec la calculatrice, on tape le calcul en une fois : <b>a × b ÷ c</b>.<br>Autre façon : le rapport k = ${F('AM', 'AB')} est le même partout ; une longueur du petit triangle = k × la longueur correspondante du grand.</div>
<div class="methode"><b>Méthode</b><ol><li>Écris la ligne ${F('AM', 'AB')} = ${F('AN', 'AC')} = ${F('MN', 'BC')} avec les lettres.</li><li>Remplace par les nombres décimaux (virgule !).</li><li>Produit en croix, calcul en une seule fois à la calculatrice.</li><li>Vérifie l'ordre de grandeur, puis écris le résultat avec la touche <b>,</b>.</li></ol></div>
<div class="cols">${f1}<div class="ex"><span class="q">Exemple 1 : AN = 3,6 cm, AC = 9 cm, MN = 2,6 cm. Calcule BC.</span><br>${F('AN', 'AC')} = ${F('MN', 'BC')} donc ${F('3,6', '9')} = ${F('2,6', 'BC')}.<br>BC = 2,6 × 9 ÷ 3,6 = <b>6,5 cm</b>.</div></div>
<div class="cols">${f2}<div class="ex"><span class="q">Exemple 2 : AM = 2,4 cm, AB = 6 cm, AC = 8,5 cm. Calcule AN.</span><br>${F('AM', 'AB')} = ${F('AN', 'AC')} donc ${F('2,4', '6')} = ${F('AN', '8,5')}.<br>AN = 8,5 × 2,4 ÷ 6 = <b>3,4 cm</b>.<br>(Ou : k = 2,4 ÷ 6 = 0,4 et AN = 0,4 × 8,5 = 3,4.)</div></div>
<div class="warn">⚠️ Rapports dans le désordre : écris toujours la ligne avec les lettres <b>avant</b> de remplacer par les nombres.<br>⚠️ Ici les réponses tombent juste : si tu obtiens beaucoup de décimales, vérifie ton produit en croix.<br>⚠️ Contrôle : AN doit être plus petit que AC (3,4 &lt; 8,5).</div>
<div class="retenir">À retenir : avec des décimaux, même méthode ; écris d'abord les lettres, puis les nombres.</div>`;
}

/* ---------- 4. côté « extérieur » : AB = AM + MB ---------- */
function L4(d) {
  const mode = d >= 4 ? 'dec' : 'int';
  const T = thalesNums(Math.max(d, 1), mode);
  const P = thalesPts(T.AB, T.AC, T.BC, T.k, false);
  let N = noms(d, ['A', 'B', 'C', 'M', 'N']);
  if (d >= 3 && chance(0.5)) N = { ...N, B: N.C, C: N.B, M: N.N, N: N.M }; // l'autre côté du triangle
  const v = d < 2 ? 0 : ri(0, 1);
  const segs = thalesSegs(false), par = [['M', 'N'], ['B', 'C']], o = orient(d);
  if (v === 0) { // AM, MB, MN → BC (ou AM, MB, BC → MN)
    const toBig = d < 1 || chance(0.5);
    const given = toBig ? ['MN', T.MN] : ['BC', T.BC], askR = toBig ? ['B', 'C'] : ['M', 'N'];
    const X = r6(toBig ? T.MN * (T.AM + T.MB) / T.AM : T.BC * T.AM / (T.AM + T.MB));
    const wrong = toBig ? T.MN * T.MB / T.AM : T.BC * T.AM / T.MB;
    const lens = [{ a: 'A', b: 'M', t: cm(T.AM) }, { a: 'M', b: 'B', t: cm(T.MB) }, { a: given[0][0], b: given[0][1], t: cm(given[1]) }, { a: askR[0], b: askR[1], ask: true }];
    const aN = sg(N, askR), AB = N.A + N.B;
    return {
      type: 'nums', tpl: `${aN} = {0} cm`, keys: { comma: true, neg: false },
      html: `${hypText(N, false)}<br>On donne ${N.A}${N.M} = ${cm(T.AM)} ; ${N.M}${N.B} = ${cm(T.MB)} ; ${sg(N, given[0])} = ${cm(given[1])}.<br>Calcule <b>${aN}</b>.`,
      visual: mk(P, N, { segs, par, lens, ...o, aria: 'configuration de Thalès' }),
      check: lenCheck(X, X, [{ x: wrong, msg: `Attention : le rapport utilise ${AB} (depuis le sommet ${N.A}), pas ${N.M}${N.B}. Calcule d'abord ${AB} = ${N.A}${N.M} + ${N.M}${N.B}.` }], 0),
      value: r6(D(P, ...askR)),
      verify: ([E]) => parallel(P, 'M', 'N', 'B', 'C') && Math.abs(E - D(P, ...askR)) < 1e-9 && near(D(P, 'A', 'B'), T.AM + T.MB, 1e-9),
      hint: `Les rapports de Thalès partent du sommet ${N.A} : il te faut ${AB}. Comme ${N.M} est sur [${AB}], ${AB} = ${N.A}${N.M} + ${N.M}${N.B}.`,
      solution: `${AB} = ${M(T.AM)} + ${M(T.MB)} = ${cm(T.AB)}.<br>${thmText(N, false)} ${F(N.A + N.M, AB)} = ${F(N.M + N.N, N.B + N.C)}, donc ${F(M(T.AM), M(T.AB))} = ${toBig ? F(M(T.MN), aN) : F(aN, M(T.BC))}.<br>${aN} = ${toBig ? `${M(T.MN)} × ${M(T.AB)} ÷ ${M(T.AM)}` : `${M(T.BC)} × ${M(T.AM)} ÷ ${M(T.AB)}`} = <b>${cm(X)}</b>.`,
    };
  }
  // AM, MB, AN → NC
  const AC = T.AN * (T.AM + T.MB) / T.AM, X = r6(AC - T.AN);
  const lens = [{ a: 'A', b: 'M', t: cm(T.AM) }, { a: 'M', b: 'B', t: cm(T.MB) }, { a: 'A', b: 'N', t: cm(T.AN) }, { a: 'N', b: 'C', ask: true }];
  const AB = N.A + N.B, NC = N.N + N.C;
  return {
    type: 'nums', tpl: `${NC} = {0} cm`, keys: { comma: true, neg: false },
    html: `${hypText(N, false)}<br>On donne ${N.A}${N.M} = ${cm(T.AM)} ; ${N.M}${N.B} = ${cm(T.MB)} ; ${N.A}${N.N} = ${cm(T.AN)}.<br>Calcule <b>${NC}</b>.`,
    visual: mk(P, N, { segs, par, lens, ...o, aria: 'configuration de Thalès' }),
    check: lenCheck(X, X, [
      { x: AC, msg: `Tu as calculé ${N.A}${N.C}. Il reste une étape : ${NC} = ${N.A}${N.C} − ${N.A}${N.N}.` },
    ], 0),
    value: r6(D(P, 'N', 'C')),
    verify: ([E]) => parallel(P, 'M', 'N', 'B', 'C') && Math.abs(E - D(P, 'N', 'C')) < 1e-9,
    hint: `Trois étapes : ${AB} = ${N.A}${N.M} + ${N.M}${N.B} ; puis Thalès pour ${N.A}${N.C} ; enfin ${NC} = ${N.A}${N.C} − ${N.A}${N.N}.`,
    solution: `${AB} = ${M(T.AM)} + ${M(T.MB)} = ${cm(T.AB)}.<br>${thmText(N, false)} ${F(N.A + N.M, AB)} = ${F(N.A + N.N, N.A + N.C)}, donc ${F(M(T.AM), M(T.AB))} = ${F(M(T.AN), N.A + N.C)} et ${N.A}${N.C} = ${M(T.AN)} × ${M(T.AB)} ÷ ${M(T.AM)} = ${cm(r6(AC))}.<br>${NC} = ${M(r6(AC))} − ${M(T.AN)} = <b>${cm(X)}</b>.`,
  };
}
function C4() {
  const T = { AB: 10, AC: 12, BC: 15, k: 0.4 };
  const f1 = mk(thalesPts(T.AB, T.AC, T.BC, T.k, false, 0), {}, { segs: thalesSegs(false), par: [['M', 'N'], ['B', 'C']], lens: [{ a: 'A', b: 'M', t: '4 cm' }, { a: 'M', b: 'B', t: '6 cm' }, { a: 'M', b: 'N', t: '6 cm' }, { a: 'B', b: 'C', ask: true }], aria: 'exemple 1' });
  const f2 = mk(thalesPts(10, 12.5, 11, 0.4, false, 0), {}, { segs: thalesSegs(false), par: [['M', 'N'], ['B', 'C']], lens: [{ a: 'A', b: 'M', t: '4 cm' }, { a: 'M', b: 'B', t: '6 cm' }, { a: 'A', b: 'N', t: '5 cm' }, { a: 'N', b: 'C', ask: true }], aria: 'exemple 2' });
  return `<h2>4. Quand on donne MB au lieu de AB</h2>
<p class="intro">L'énoncé ne donne pas toujours les longueurs depuis le sommet A. Il faut alors une petite addition (ou soustraction) avant ou après Thalès.</p>
<div class="def">Les rapports de Thalès partent <b>toujours du sommet commun A</b>.<br>Si M ∈ [AB] : <b>AB = AM + MB</b> ; si N ∈ [AC] : <b>NC = AC − AN</b>.</div>
<div class="methode"><b>Méthode</b><ol><li>Si on te donne MB : calcule d'abord AB = AM + MB.</li><li>Écris l'égalité de Thalès (longueurs depuis A) et fais le produit en croix.</li><li>Si on te demande NC : Thalès donne AC, puis NC = AC − AN.</li></ol></div>
<div class="cols">${f1}<div class="ex"><span class="q">Exemple 1 : AM = 4 cm, MB = 6 cm, MN = 6 cm. Calcule BC.</span><br>AB = 4 + 6 = 10 cm.<br>${F('AM', 'AB')} = ${F('MN', 'BC')} : ${F('4', '10')} = ${F('6', 'BC')}, donc BC = 6 × 10 ÷ 4 = <b>15 cm</b>.</div></div>
<div class="cols">${f2}<div class="ex"><span class="q">Exemple 2 : AM = 4 cm, MB = 6 cm, AN = 5 cm. Calcule NC.</span><br>AB = 4 + 6 = 10 cm.<br>${F('AM', 'AB')} = ${F('AN', 'AC')} : ${F('4', '10')} = ${F('5', 'AC')}, donc AC = 5 × 10 ÷ 4 = 12,5 cm.<br>NC = AC − AN = 12,5 − 5 = <b>7,5 cm</b>.</div></div>
<div class="warn">⚠️ Mesure depuis le mauvais sommet : ${F('AM', 'MB')} = ${F('MN', 'BC')} est faux ! MB ne part pas de A.<br>⚠️ Si l'on demande NC, Thalès donne d'abord AC ; il faut ensuite enlever AN.<br>⚠️ Les lettres peuvent changer de côté : repère toujours quel point est sur quel segment.</div>
<div class="retenir">À retenir : toutes les longueurs des rapports partent du sommet commun A.</div>`;
}

/* ---------- 5. papillon ---------- */
function L5(d) { return thalesAsk(d, { pap: true, mode: d >= 3 ? 'dec' : 'int', ...pickIJS(d), extra: d >= 4 }); }
function C5() {
  const T = { AB: 8, AC: 10, BC: 9, k: 0.5 };
  const f1 = mk(thalesPts(T.AB, T.AC, T.BC, T.k, true, 0), {}, { segs: thalesSegs(true), par: [['M', 'N'], ['B', 'C']], lens: [lenLab(true, ['A', 'M'], '4 cm'), lenLab(true, ['A', 'B'], '8 cm'), lenLab(true, ['B', 'C'], '9 cm'), lenLab(true, ['M', 'N'], '?', true)], aria: 'papillon, exemple 1' });
  const f2 = mk(thalesPts(4, 5, 5, 1.5, true, 0), {}, { segs: thalesSegs(true), par: [['M', 'N'], ['B', 'C']], lens: [lenLab(true, ['A', 'M'], '6 cm'), lenLab(true, ['A', 'B'], '4 cm'), lenLab(true, ['B', 'C'], '5 cm'), lenLab(true, ['M', 'N'], '?', true)], aria: 'papillon, exemple 2' });
  return `<h2>5. La configuration « papillon »</h2>
<p class="intro">Les deux triangles peuvent aussi être « tête-bêche », de part et d'autre du point A. Le théorème de Thalès s'applique de la même façon.</p>
<div class="def">Les droites (MB) et (NC) se coupent en A, avec M et B <b>de part et d'autre</b> de A, et de même N et C. Si <b>(MN) // (BC)</b> :${big(`${F('AM', 'AB')} = ${F('AN', 'AC')} = ${F('MN', 'BC')}`)}C'est la même égalité que pour les triangles emboîtés.</div>
<div class="methode"><b>Méthode</b><ol><li>Repère A, le point où se croisent les deux droites.</li><li>Associe les côtés : AM avec AB (même droite), AN avec AC (même droite), MN avec BC (parallèles).</li><li>Écris l'égalité des rapports, remplace, produit en croix.</li></ol></div>
<div class="cols">${f1}<div class="ex"><span class="q">Exemple 1 : AM = 4 cm, AB = 8 cm, BC = 9 cm. Calcule MN.</span><br>${F('AM', 'AB')} = ${F('MN', 'BC')} : ${F('4', '8')} = ${F('MN', '9')}, donc MN = 9 × 4 ÷ 8 = <b>4,5 cm</b>.</div></div>
<div class="cols">${f2}<div class="ex"><span class="q">Exemple 2 : ici le triangle AMN est le plus grand ! AM = 6 cm, AB = 4 cm, BC = 5 cm.</span><br>${F('AM', 'AB')} = ${F('MN', 'BC')} : ${F('6', '4')} = ${F('MN', '5')}, donc MN = 5 × 6 ÷ 4 = <b>7,5 cm</b>.<br>Le rapport est supérieur à 1 : c'est normal, AMN est plus grand.</div></div>
<div class="warn">⚠️ Ici AB n'est <b>pas</b> AM + MB : A est entre M et B, et c'est MB = AM + AB.<br>⚠️ Associe bien les côtés : AM et AB sont sur la même droite ; MN et BC sont parallèles.<br>⚠️ En papillon, le « petit » triangle n'est pas toujours le plus petit : ne te fie qu'aux lettres.</div>
<div class="retenir">À retenir : papillon ou emboîtés, c'est la même égalité ${F('AM', 'AB')} = ${F('AN', 'AC')} = ${F('MN', 'BC')}.</div>`;
}

/* ---------- 6. réciproque ---------- */
function L6(d) {
  for (;;) {
    const pap = d >= 2 && chance(0.5), dec = d >= 3;
    const q = pick([2, 3, 4, 5]); let p; do { p = ri(1, pap ? 2 * q - 1 : q - 1); } while (gcd(p, q) !== 1 || p === q || p / q < 0.4 || p / q > 1.7);
    const f = dec ? 0.5 : 1, mx = Math.floor(18 / Math.max(p, q));
    if (mx < 2) continue;
    const m1 = ri(2, mx), m2 = ri(2, mx);
    if (m1 === m2) continue;
    const AB = q * m1 * f, AM = p * m1 * f, AC = q * m2 * f;
    const yes = chance(0.5);
    const AN = yes ? p * m2 * f : p * m2 * f + pick([-1, 1]) * f;
    if (AN <= 0 || (!pap && AN >= AC)) continue;
    if (!yes && Math.abs(AM / AB - AN / AC) < 0.02) continue;
    const al = ri(45, 85) * DEG, tilt = ri(-8, 8) * DEG, s = pap ? -1 : 1;
    const u = [Math.cos(-Math.PI / 2 - al / 2 + tilt), Math.sin(-Math.PI / 2 - al / 2 + tilt)], v = [Math.cos(-Math.PI / 2 + al / 2 + tilt), Math.sin(-Math.PI / 2 + al / 2 + tilt)];
    const P = { A: [0, 0], B: mul(u, AB), C: mul(v, AC), M: mul(u, s * AM), N: mul(v, s * AN) };
    const N = noms(d, ['A', 'B', 'C', 'M', 'N']);
    const sums = d >= 4 && !pap; // on donne MB et NC
    const MB = r6(AB - AM), NC = r6(AC - AN);
    const given = sums ? [['A', 'M', AM], ['M', 'B', MB], ['A', 'N', AN], ['N', 'C', NC]] : [['A', 'M', AM], ['A', 'B', AB], ['A', 'N', AN], ['A', 'C', AC]];
    const lens = given.map(([a, b, x]) => ({ a, b, t: cm(x), dim: !pap && !sums && (b === 'B' || b === 'C') && a === 'A' }));
    const fig = mk(P, N, { segs: thalesSegs(pap, false), lens, ...orient(d), aria: 'les droites sont-elles parallèles ?' });
    const n = x => N[x];
    const p1 = r6(AM * AC), p2 = r6(AB * AN);
    const opts = [{ v: 'oui', l: `Oui, ${dr(n('M') + n('N'))} // ${dr(n('B') + n('C'))}` }, { v: 'non', l: 'Non, elles ne sont pas parallèles' }, { v: 'nsp', l: 'On ne peut pas savoir' }];
    const E = yes ? 'oui' : 'non';
    const AMs = n('A') + n('M'), ABs = n('A') + n('B'), ANs = n('A') + n('N'), ACs = n('A') + n('C');
    return {
      type: 'choice', opts, visual: fig,
      html: `${pap ? `Les points ${n('M')}, ${n('A')}, ${n('B')} sont alignés dans cet ordre, ainsi que ${n('N')}, ${n('A')}, ${n('C')}.` : `${n('M')} ∈ [${ABs}] et ${n('N')} ∈ [${ACs}].`}<br>On donne ${given.map(([a, b, x]) => `${n(a)}${n(b)} = ${cm(x)}`).join(' ; ')}.<br>Les droites ${dr(n('M') + n('N'))} et ${dr(n('B') + n('C'))} sont-elles parallèles ?`,
      check: choiceCheck(E, { msg: c => (c === 'nsp' ? `On peut savoir : compare ${F(AMs, ABs)} et ${F(ANs, ACs)} (produits en croix).` : '') }),
      verify: e => (e === 'oui') === parallel(P, 'M', 'N', 'B', 'C') && near(D(P, 'A', 'M'), AM, 1e-9) && near(D(P, 'A', 'N'), AN, 1e-9),
      hint: `${sums ? `Calcule d'abord ${ABs} = ${AMs} + ${n('M')}${n('B')} et ${ACs} = ${ANs} + ${n('N')}${n('C')}. ` : ''}Compare les rapports ${F(AMs, ABs)} et ${F(ANs, ACs)} : s'ils sont égaux (et les points dans le même ordre), les droites sont parallèles. Pour comparer, fais les produits en croix.`,
      solution: `${sums ? `${ABs} = ${M(AM)} + ${M(MB)} = ${cm(AB)} et ${ACs} = ${M(AN)} + ${M(NC)} = ${cm(AC)}.<br>` : ''}${F(AMs, ABs)} = ${F(M(AM), M(AB))} et ${F(ANs, ACs)} = ${F(M(AN), M(AC))}.<br>Produits en croix : ${M(AM)} × ${M(AC)} = ${M(p1)} et ${M(AB)} × ${M(AN)} = ${M(p2)}.<br>` +
        (yes ? `Les rapports sont <b>égaux</b> et les points sont dans le même ordre : d'après la <b>réciproque du théorème de Thalès</b>, <b>${dr(n('M') + n('N'))} // ${dr(n('B') + n('C'))}</b>.`
          : `Les rapports sont <b>différents</b> : si les droites étaient parallèles, Thalès donnerait des rapports égaux. Donc <b>${dr(n('M') + n('N'))} et ${dr(n('B') + n('C'))} ne sont pas parallèles</b>.`),
    };
  }
}
function C6() {
  const al = 60 * DEG, u = [Math.cos(-Math.PI / 2 - al / 2), Math.sin(-Math.PI / 2 - al / 2)], v = [Math.cos(-Math.PI / 2 + al / 2), Math.sin(-Math.PI / 2 + al / 2)];
  const non = { A: [0, 0], B: mul(u, 10), C: mul(v, 13), M: mul(u, 4), N: mul(v, 5) };
  const f1 = mk(thalesPts(10, 15, 12, 0.4, false, 0), {}, { segs: thalesSegs(false, false), lens: [{ a: 'A', b: 'M', t: '4 cm' }, { a: 'A', b: 'B', t: '10 cm', dim: true }, { a: 'A', b: 'N', t: '6 cm' }, { a: 'A', b: 'C', t: '15 cm', dim: true }], aria: 'rapports égaux : parallèles' });
  const f2 = mk(non, {}, { segs: thalesSegs(false, false), lens: [{ a: 'A', b: 'M', t: '4 cm' }, { a: 'A', b: 'B', t: '10 cm', dim: true }, { a: 'A', b: 'N', t: '5 cm' }, { a: 'A', b: 'C', t: '13 cm', dim: true }], aria: 'rapports différents : pas parallèles' });
  return `<h2>6. La réciproque de Thalès</h2>
<p class="intro">Cette fois, on ne sait pas si (MN) et (BC) sont parallèles : on veut le <b>prouver</b> (ou montrer que non) grâce aux longueurs.</p>
<div class="def"><b>Réciproque.</b> Si les points A, M, B et A, N, C sont alignés <b>dans le même ordre</b> et si ${F('AM', 'AB')} = ${F('AN', 'AC')}, alors <b>(MN) // (BC)</b>.<br>Si les rapports sont <b>différents</b>, les droites ne sont <b>pas</b> parallèles (sinon le théorème de Thalès donnerait l'égalité).</div>
<div class="methode"><b>Méthode</b><ol><li>Si on te donne MB et NC : calcule d'abord AB = AM + MB et AC = AN + NC.</li><li>Écris les deux rapports ${F('AM', 'AB')} et ${F('AN', 'AC')}, dans le même sens.</li><li>Compare-les avec les produits en croix : AM × AC et AB × AN.</li><li>Égaux (et points dans le même ordre) : parallèles. Différents : pas parallèles.</li></ol></div>
<div class="cols">${f1}<div class="ex"><span class="q">Exemple 1 : AM = 4, AB = 10, AN = 6, AC = 15.</span><br>Produits en croix : 4 × 15 = 60 et 10 × 6 = 60.<br>Égaux : d'après la réciproque du théorème de Thalès, <b>(MN) // (BC)</b>.</div></div>
<div class="cols">${f2}<div class="ex"><span class="q">Exemple 2 : AM = 4, AB = 10, AN = 5, AC = 13.</span><br>4 × 13 = 52 et 10 × 5 = 50.<br>Différents : <b>(MN) et (BC) ne sont pas parallèles</b>, même si ça y ressemble.</div></div>
<div class="ex"><span class="q">Exemple 3 : on donne AM = 3, MB = 4,5, AN = 4, NC = 6.</span><br>AB = 3 + 4,5 = 7,5 et AC = 4 + 6 = 10.<br>3 × 10 = 30 et 7,5 × 4 = 30 : égaux, donc <b>(MN) // (BC)</b>.</div>
<div class="ex"><span class="q">Exemple 4 : « les points P, U, G sont alignés dans cet ordre, ainsi que M, U, F » (papillon). UP = 4 cm, UG = 6 cm, UM = 5,5 cm, UF = 8,25 cm.</span><br>« Dans cet ordre » : U est entre P et G, et entre M et F. Les deux droites se coupent en U : c'est un papillon, et les rapports partent de U.<br>UP ÷ UG = 4 ÷ 6 ≈ 0,667 et UM ÷ UF = 5,5 ÷ 8,25 ≈ 0,667 : les rapports sont égaux et les points sont dans le même ordre, donc <b>(PM) // (GF)</b>.</div>
<div class="warn">⚠️ Une figure « qui a l'air » parallèle ne prouve rien : on calcule. « On ne peut pas savoir » n'est jamais la bonne réponse ici.<br>⚠️ Compare des rapports écrits dans le même sens : AM ÷ AB et AN ÷ AC (en haut, toujours les côtés du triangle AMN).<br>⚠️ Les points doivent aussi être dans le même ordre : M entre A et B et N entre A et C, ou bien A entre M et B et A entre N et C (papillon).<br>⚠️ ${F('AM', 'MB')} et ${F('AN', 'NC')} ne servent pas : les rapports partent de A.</div>
<div class="retenir">À retenir : rapports égaux et points dans le même ordre ⟹ parallèles ; rapports différents ⟹ pas parallèles.</div>`;
}

/* ---------- 7. agrandissement et réduction ---------- */
function L7(d) {
  for (;;) {
    const v = d < 1 ? 0 : d < 2 ? 1 : d < 3 ? pick([0, 1, 2]) : d < 4 ? pick([1, 2, 3]) : pick([2, 3, 4]);
    const up = v === 0 ? true : v === 1 ? false : chance(0.5);
    const k = up ? pick([1.5, 2, 2.5, 3, 1.2]) : pick([0.5, 0.4, 0.6, 0.75, 0.8]);
    const AB = ri(3, 10) + (d >= 3 && chance(0.5) ? 0.5 : 0), BC = ri(3, 9);
    const dir = pick([[-0.6, 0.8], [-0.8, 0.6], [0.6, 0.8]]);
    const P = { A: [0, 0], B: [AB, 0], C: [AB + BC * dir[0], BC * dir[1]] };
    const tri = ['A', 'B', 'C'];
    if (tri.some(t => { const o = tri.filter(x => x !== t); return angleAt(P, t, ...o) < 28; })) continue;
    // image : rotation (d ≥ 2), symétrie (d ≥ 3), mise à l'échelle k, placée à droite
    const rot = d >= 2 ? ri(-40, 40) * DEG : 0, fl = d >= 3 && chance(0.5);
    const img = tri.map(t => { let [x, y] = P[t]; if (fl) x = -x; return mul([x * Math.cos(rot) - y * Math.sin(rot), x * Math.sin(rot) + y * Math.cos(rot)], k); });
    const xmax = Math.max(...tri.map(t => P[t][0])), imin = Math.min(...img.map(p => p[0]));
    const gap = 0.35 * Math.max(AB, AB * k) + 1.5;
    tri.forEach((t, i) => { P[t + '′'] = [img[i][0] - imin + xmax + gap, img[i][1]]; });
    const AB2 = r6(k * AB), BC2 = r6(k * BC);
    if (decimals(AB2) > 2 || decimals(BC2) > 2) continue;
    const area = r6(Math.abs(cross(sub(P.B, P.A), sub(P.C, P.A))) / 2), area2 = r6(k * k * area);
    if (v === 4 && (decimals(area) > 2 || decimals(area2) > 2)) continue;
    const segs = [['A', 'B'], ['B', 'C'], ['C', 'A'], ['A′', 'B′'], ['B′', 'C′'], ['C′', 'A′']];
    const kind = up ? 'un agrandissement' : 'une réduction';
    const intro = `Le triangle A′B′C′ est ${kind} du triangle ABC (A′ correspond à A, B′ à B, C′ à C).`;
    const o = { segs, W: 380, H: 170, flip: false, aria: 'deux triangles' };
    if (v <= 1) {
      return {
        type: 'nums', tpl: 'k = {0}', keys: { comma: true, neg: false },
        html: `${intro}<br>AB = ${cm(AB)} et A′B′ = ${cm(AB2)}.<br>Quel est le rapport ${up ? "d'agrandissement" : 'de réduction'} k ?`,
        visual: mk(P, {}, { ...o, lens: [{ a: 'A', b: 'B', t: cm(AB) }, { a: 'A′', b: 'B′', t: cm(AB2) }] }),
        check: lenCheck(k, k, [{ x: r6(AB / AB2), e: 1e-9, msg: 'Rapport inversé : k = longueur de la figure obtenue ÷ longueur de la figure de départ.' }], 0),
        value: r6(D(P, 'A′', 'B′') / D(P, 'A', 'B')),
        verify: ([E]) => near(E, D(P, 'B′', 'C′') / D(P, 'B', 'C'), 1e-9) && near(E, D(P, 'C′', 'A′') / D(P, 'C', 'A'), 1e-9),
        hint: `k = ${F('A′B′', 'AB')} : longueur de l'image divisée par la longueur correspondante de départ. ${up ? 'Pour un agrandissement, k > 1.' : 'Pour une réduction, k < 1.'}`,
        solution: `k = ${F('A′B′', 'AB')} = ${M(AB2)} ÷ ${M(AB)} = <b>${M(k)}</b>. ${up ? 'k > 1 : c\'est bien un agrandissement.' : 'k < 1 : c\'est bien une réduction.'}`,
      };
    }
    if (v === 2 || v === 3) {
      const fwd = v === 2;
      const X = fwd ? BC2 : BC, giv = fwd ? BC : BC2;
      const lens = fwd ? [{ a: 'B', b: 'C', t: cm(BC) }, { a: 'B′', b: 'C′', ask: true }] : [{ a: 'B', b: 'C', ask: true }, { a: 'B′', b: 'C′', t: cm(BC2) }];
      return {
        type: 'nums', tpl: `${fwd ? 'B′C′' : 'BC'} = {0} cm`, keys: { comma: true, neg: false },
        html: `${intro}<br>Le rapport est k = ${M(k)} et ${fwd ? 'BC' : 'B′C′'} = ${cm(giv)}.<br>Calcule <b>${fwd ? 'B′C′' : 'BC'}</b>.`,
        visual: mk(P, {}, { ...o, lens }),
        check: lenCheck(X, X, [{ x: fwd ? r6(BC / k) : r6(BC2 * k), e: 1e-9, msg: fwd ? "On passe de ABC à A′B′C′ en <b>multipliant</b> par k." : "Ici on revient de l'image à la figure de départ : on <b>divise</b> par k." }], 0),
        value: r6(fwd ? D(P, 'B′', 'C′') : D(P, 'B', 'C')),
        verify: ([E]) => near(E, fwd ? D(P, 'B′', 'C′') : D(P, 'B', 'C'), 1e-9),
        hint: fwd ? `Dans ${kind} de rapport k, toutes les longueurs sont <b>multipliées par k</b>.` : `B′C′ = k × BC. Pour retrouver BC, on fait l'opération inverse.`,
        solution: fwd ? `B′C′ = k × BC = ${M(k)} × ${M(BC)} = <b>${cm(BC2)}</b>.` : `B′C′ = k × BC, donc BC = B′C′ ÷ k = ${M(BC2)} ÷ ${M(k)} = <b>${cm(BC)}</b>.`,
      };
    }
    return {
      type: 'nums', tpl: 'Aire de A′B′C′ = {0} cm²', keys: { comma: true, neg: false },
      html: `${intro}<br>Le rapport est k = ${M(k)} et l'aire de ABC est ${M(area)} cm².<br>Calcule l'aire de A′B′C′.`,
      visual: mk(P, {}, o),
      check: lenCheck(area2, area2, [{ x: r6(k * area), e: 1e-9, msg: 'Les longueurs sont multipliées par k, mais les <b>aires</b> par <b>k²</b> !' }], 0),
      verify: ([E]) => near(E, Math.abs(cross(sub(P['B′'], P['A′']), sub(P['C′'], P['A′']))) / 2, 1e-9),
      hint: `Dans ${kind} de rapport k, les longueurs sont multipliées par k et les <b>aires par k²</b>.`,
      solution: `Aire de A′B′C′ = k² × aire de ABC = ${M(k)}² × ${M(area)} = ${M(r6(k * k))} × ${M(area)} = <b>${M(area2)} cm²</b>.`,
    };
  }
}
function C7() {
  const P = { A: [0, 0], B: [4, 0], C: [2.2, 2.4], 'A′': [5.5, 0], 'B′': [11.5, 0], 'C′': [8.8, 3.6] };
  return `<h2>7. Agrandissement et réduction</h2>
<p class="intro">Une photo agrandie, un plan, une maquette : toutes les longueurs sont multipliées par un même nombre k. Ce nombre suffit pour tout calculer.</p>
<div class="def">Une figure de rapport <b>k</b> s'obtient en multipliant <b>toutes les longueurs par k</b> (les angles ne changent pas).<br>k &gt; 1 : <b>agrandissement</b> ; k &lt; 1 : <b>réduction</b>.<br>k = ${F('longueur de l\'image', 'longueur de départ')} ; les <b>aires</b> sont multipliées par <b>k²</b>.</div>
<div class="cols">${figure({ P, segs: [['A', 'B'], ['B', 'C'], ['C', 'A'], ['A′', 'B′'], ['B′', 'C′'], ['C′', 'A′']], lens: [{ a: 'A', b: 'B', t: '4 cm' }, { a: 'A′', b: 'B′', t: '6 cm' }], W: 380, H: 150, aria: 'agrandissement de rapport 1,5' })}${grilleK()}</div>
<div class="methode"><b>Méthode</b><ol><li>Trouver k : divise une longueur de l'image par la longueur correspondante de départ.</li><li>Longueur de l'image : multiplie par k.</li><li>Revenir à la figure de départ : divise par k.</li><li>Aire de l'image : multiplie l'aire de départ par k².</li></ol></div>
<div class="ex"><span class="q">Exemple 1 : AB = 4 cm et A′B′ = 6 cm.</span><br>k = 6 ÷ 4 = <b>1,5</b> (k &gt; 1 : agrandissement).<br>Si l'aire de ABC est 5 cm², celle de A′B′C′ est 1,5² × 5 = 2,25 × 5 = <b>11,25 cm²</b>.</div>
<div class="ex"><span class="q">Exemple 2 : réduction de rapport k = 0,75 avec B′C′ = 6 cm. Calcule BC.</span><br>B′C′ = 0,75 × BC, donc BC = 6 ÷ 0,75 = <b>8 cm</b>.<br>Contrôle : la figure de départ est plus grande que sa réduction (8 &gt; 6).</div>
<div class="ex">Dans une configuration de Thalès emboîtée (M ∈ [AB]), le triangle AMN est une réduction du triangle ABC, de rapport k = ${F('AM', 'AB')}.</div>
<div class="warn">⚠️ k = longueur de l'<b>image</b> ÷ longueur de <b>départ</b> (pas l'inverse).<br>⚠️ Une aire n'est pas multipliée par k mais par k² : en doublant les côtés, l'aire est multipliée par 4.<br>⚠️ Pour revenir de l'image au départ, on <b>divise</b> par k.</div>
<div class="retenir">À retenir : longueurs × k, aires × k².</div>`;
}

/* ================= trigonométrie ================= */
// Triangle rectangle : V = sommet de l'angle étudié, R = sommet de l'angle droit, W = troisième sommet.
const ROLE = { adj: ['V', 'R'], opp: ['R', 'W'], hyp: ['V', 'W'] };
const NOMR = { adj: 'côté adjacent', opp: 'côté opposé', hyp: 'hypoténuse' };
const FN = { cos: ['adj', 'hyp'], sin: ['opp', 'hyp'], tan: ['opp', 'adj'] };
const TRIG = { cos: Math.cos, sin: Math.sin, tan: Math.tan };
const INV = { cos: Math.acos, sin: Math.asin, tan: Math.atan };
const FORM = { cos: 'côté adjacent ÷ hypoténuse', sin: 'côté opposé ÷ hypoténuse', tan: 'côté opposé ÷ côté adjacent' };
/** construction géométrique à partir de l'angle θ (degrés) et d'un côté connu */
function trigPts(theta, role, x) {
  const t = theta * DEG;
  if (role === 'hyp') { const W = [x * Math.cos(t), x * Math.sin(t)]; return { V: [0, 0], R: [W[0], 0], W }; }
  if (role === 'adj') return { V: [0, 0], R: [x, 0], W: [x, x * Math.sin(t) / Math.cos(t)] };
  const ax = x / Math.tan(t); return { V: [0, 0], R: [ax, 0], W: [ax, x] };
}
/** rôle d'un segment, retrouvé par les coordonnées (angle droit par le produit scalaire) */
function roleOf(P, seg, V) {
  const ks = Object.keys(P);
  const rv = ks.find(k => { const [a, b] = ks.filter(x => x !== k); const u = sub(P[a], P[k]), w = sub(P[b], P[k]); return Math.abs(dot(u, w)) < 1e-9 * Math.hypot(...u) * Math.hypot(...w); });
  if (!seg.includes(rv)) return 'hyp';
  return seg.includes(V) ? 'adj' : 'opp';
}
function trigNames(d) {
  if (d < 2) return { V: 'A', R: 'B', W: 'C' };
  if (d < 3) { const p = shuffle(['A', 'B', 'C']); return { V: p[0], R: p[1], W: p[2] }; }
  return noms(d, ['V', 'R', 'W']);
}
const trigFig = (P, N, d, lens, angT, angAsk) => mk(P, N, {
  segs: [['V', 'R'], ['R', 'W'], ['V', 'W']], right: [['R', 'V', 'W']],
  angs: [{ v: 'V', a: 'R', b: 'W', t: angT, ask: angAsk }], lens, ...orient(d), aria: 'triangle rectangle',
});
const angName = N => ang(N.R, N.V, N.W);
const rectText = N => `Le triangle ${N.V}${N.R}${N.W} est rectangle en ${N.R}.`;
const sN = (N, role) => N[ROLE[role][0]] + N[ROLE[role][1]];

/* ---------- 8. vocabulaire ---------- */
function L8(d) {
  const th = ri(25, 65), x = ri(4, 12);
  const P = trigPts(th, 'adj', x);
  const N = trigNames(d);
  // d ≥ 2 : parfois on étudie l'autre angle aigu (les rôles changent)
  const other = d >= 2 && chance(0.5);
  const V = other ? 'W' : 'V';
  const want = d < 1 ? pick(['hyp', 'adj']) : pick(['adj', 'opp', 'hyp', 'opp']);
  const segs = { [N.V + N.R]: ['V', 'R'], [N.R + N.W]: ['R', 'W'], [N.V + N.W]: ['V', 'W'] };
  const E = Object.keys(segs).find(s => roleOf(P, segs[s], V) === want);
  const A = other ? ang(N.R, N.W, N.V) : angName(N);
  const fig = mk(P, N, { segs: [['V', 'R'], ['R', 'W'], ['V', 'W']], right: [['R', 'V', 'W']], angs: [other ? { v: 'W', a: 'R', b: 'V', t: A } : { v: 'V', a: 'R', b: 'W', t: A }], ...orient(d), aria: 'triangle rectangle' });
  const opts = Object.keys(segs).map(s => ({ v: s, l: `[${s}]` }));
  const MSG = c => {
    const r = roleOf(P, segs[c], V);
    return `[${c}] est ${r === 'hyp' ? "l'hypoténuse" : `le ${NOMR[r]}`} à l'angle ${A}.`;
  };
  const vName = other ? N.W : N.V;
  return {
    type: 'choice', opts, visual: fig,
    html: `${rectText(N)}<br>Quel est ${want === 'hyp' ? "l'<b>hypoténuse</b>" : `le <b>${NOMR[want]}</b> à l'angle ${A}`} ?`,
    check: choiceCheck(E, { msg: MSG }),
    verify: e => roleOf(P, segs[e], V) === want && Math.abs(angleAt(P, 'R', 'V', 'W') - 90) < 1e-9,
    hint: want === 'hyp' ? `L'hypoténuse est le côté <b>en face de l'angle droit</b> (le plus long).` : want === 'adj' ? `Le côté adjacent touche le sommet ${vName} de l'angle, mais ce n'est pas l'hypoténuse.` : `Le côté opposé est <b>en face</b> de l'angle : il ne passe pas par le sommet ${vName}.`,
    solution: `L'angle droit est en ${N.R} : l'hypoténuse est [${sN(N, 'hyp')}]. Pour l'angle ${A} (sommet ${vName}) : côté adjacent [${other ? sN(N, 'opp') : sN(N, 'adj')}], côté opposé [${other ? sN(N, 'adj') : sN(N, 'opp')}].<br>Réponse : <b>[${E}]</b>.`,
  };
}
function C8() {
  const P = trigPts(35, 'adj', 8);
  const f1 = mk(P, { V: 'A', R: 'B', W: 'C' }, { segs: [['V', 'R'], ['R', 'W'], ['V', 'W']], right: [['R', 'V', 'W']], angs: [{ v: 'V', a: 'R', b: 'W', t: ang('B', 'A', 'C') }], lens: [{ a: 'V', b: 'R', t: 'adjacent' }, { a: 'R', b: 'W', t: 'opposé' }, { a: 'V', b: 'W', t: 'hypoténuse' }], aria: 'vocabulaire pour l\'angle en A' });
  const f2 = mk(P, { V: 'A', R: 'B', W: 'C' }, { segs: [['V', 'R'], ['R', 'W'], ['V', 'W']], right: [['R', 'V', 'W']], angs: [{ v: 'W', a: 'R', b: 'V', t: ang('B', 'C', 'A') }], lens: [{ a: 'V', b: 'R', t: 'opposé' }, { a: 'R', b: 'W', t: 'adjacent' }, { a: 'V', b: 'W', t: 'hypoténuse' }], aria: 'vocabulaire pour l\'angle en C' });
  return `<h2>8. Côté adjacent, côté opposé, hypoténuse</h2>
<p class="intro">La trigonométrie relie un angle aigu d'un triangle rectangle à ses côtés. Il faut d'abord savoir nommer chaque côté <b>par rapport à l'angle étudié</b>.</p>
<div class="def">Dans un triangle <b>rectangle</b>, pour un angle aigu donné :<br>• l'<b>hypoténuse</b> est en face de l'angle droit (c'est le plus long côté) ;<br>• le <b>côté adjacent</b> touche le sommet de l'angle (et n'est pas l'hypoténuse) ;<br>• le <b>côté opposé</b> est en face de l'angle : il ne touche pas son sommet.</div>
<div class="cols">${f1}${f2}</div>
<div class="methode"><b>Méthode</b><ol><li>Repère l'angle droit : l'hypoténuse est en face.</li><li>Repère le sommet de l'angle étudié.</li><li>Le côté qui part de ce sommet, autre que l'hypoténuse, est le côté adjacent.</li><li>Le côté restant, qui ne touche pas ce sommet, est le côté opposé.</li></ol></div>
<div class="ex"><span class="q">Exemple 1 : ABC rectangle en B, angle ${ang('B', 'A', 'C')}.</span><br>Hypoténuse [AC] ; côté adjacent [AB] (il part de A) ; côté opposé [BC].</div>
<div class="ex"><span class="q">Exemple 2 : même triangle, mais pour l'angle ${ang('B', 'C', 'A')}.</span><br>L'hypoténuse reste [AC]. Mais le côté adjacent devient [BC] (il part de C) et le côté opposé devient [AB].</div>
<div class="warn">⚠️ « Adjacent » et « opposé » dépendent de l'angle choisi ; l'hypoténuse, elle, ne change jamais.<br>⚠️ L'hypoténuse touche aussi le sommet de l'angle, mais ce n'est jamais le côté adjacent.<br>⚠️ La figure peut être tournée et les lettres changées : pars toujours du codage de l'angle droit.</div>
<div class="retenir">À retenir : adjacent = touche l'angle, opposé = en face de l'angle, hypoténuse = en face de l'angle droit.</div>`;
}

/* ---------- 9. choisir cos, sin ou tan ---------- */
function L9(d) {
  const th = ri(22, 68), P = trigPts(th, 'adj', ri(4, 12));
  const N = trigNames(d);
  const fn = pick(['cos', 'sin', 'tan']);
  const [r1_, r2_] = shuffle([...FN[fn]]);
  const findAngle = d >= 4 && chance(0.4);
  const A = angName(N);
  const lens = findAngle
    ? [{ a: ROLE[r1_][0], b: ROLE[r1_][1], t: 'connu' }, { a: ROLE[r2_][0], b: ROLE[r2_][1], t: 'connu' }]
    : [{ a: ROLE[r1_][0], b: ROLE[r1_][1], t: 'connu' }, { a: ROLE[r2_][0], b: ROLE[r2_][1], ask: true }];
  const fig = trigFig(P, N, d, lens, findAngle ? '?' : `${th}°`, findAngle);
  const opts = ['cos', 'sin', 'tan'].map(f => ({ v: f, l: `${f} ${A}` }));
  const html = findAngle
    ? `${rectText(N)} On connaît ${sN(N, r1_)} et ${sN(N, r2_)}, et on cherche l'angle ${A}.<br>Quelle formule faut-il utiliser ?`
    : `${rectText(N)} On connaît l'angle ${A} = ${th}° et la longueur ${sN(N, r1_)}, et on cherche ${sN(N, r2_)}.<br>Quelle formule faut-il utiliser ?`;
  return {
    type: 'choice', opts, visual: fig, html,
    check: choiceCheck(fn, { msg: c => `${c} ${A} = ${FORM[c]} : avec ${sN(N, r1_)} et ${sN(N, r2_)}, ce n'est pas la bonne paire de côtés.` }),
    verify: e => { const roles = [r1_, r2_].map(r => roleOf(P, ROLE[r], 'V')).sort(); return roles.join() === [...FN[e]].sort().join() && Math.abs(angleAt(P, 'V', 'R', 'W') - th) < 1e-9; },
    hint: `Dis d'abord le rôle de chaque côté pour l'angle ${A} (adjacent, opposé ou hypoténuse), puis souviens-toi de <b>SOH-CAH-TOA</b> : Sin = Opposé/Hypoténuse, Cos = Adjacent/Hypoténuse, Tan = Opposé/Adjacent.`,
    solution: `Pour l'angle ${A} : ${sN(N, r1_)} est ${r1_ === 'hyp' ? "l'hypoténuse" : `le ${NOMR[r1_]}`} et ${sN(N, r2_)} est ${r2_ === 'hyp' ? "l'hypoténuse" : `le ${NOMR[r2_]}`}.<br>La formule qui relie ces deux côtés : <b>${fn} ${A} = ${FORM[fn]}</b>.`,
  };
}
function C9() {
  const f1 = mk(trigPts(40, 'hyp', 9), { V: 'A', R: 'B', W: 'C' }, { segs: [['V', 'R'], ['R', 'W'], ['V', 'W']], right: [['R', 'V', 'W']], angs: [{ v: 'V', a: 'R', b: 'W', t: '40°' }], lens: [{ a: 'V', b: 'W', t: '9 cm' }, { a: 'V', b: 'R', ask: true }], aria: 'exemple 1 : cosinus' });
  const f2 = mk(trigPts(50, 'opp', 5), { V: 'A', R: 'B', W: 'C' }, { segs: [['V', 'R'], ['R', 'W'], ['V', 'W']], right: [['R', 'V', 'W']], angs: [{ v: 'V', a: 'R', b: 'W', t: '50°' }], lens: [{ a: 'R', b: 'W', t: '5 cm' }, { a: 'V', b: 'R', ask: true }], aria: 'exemple 2 : tangente' });
  return `<h2>9. Cosinus, sinus, tangente</h2>
<p class="intro">Trois formules relient un angle aigu à deux côtés du triangle rectangle. Le tout est de choisir celle qui contient les deux côtés de l'exercice.</p>
<div class="def">Dans un triangle rectangle, pour un angle aigu :${big('cos = <span class="frac"><span>adjacent</span><span>hypoténuse</span></span> &nbsp; sin = <span class="frac"><span>opposé</span><span>hypoténuse</span></span> &nbsp; tan = <span class="frac"><span>opposé</span><span>adjacent</span></span>')}Moyen mnémotechnique : <b>SOH-CAH-TOA</b> (Sin Opp/Hyp, Cos Adj/Hyp, Tan Opp/Adj).</div>
<div class="methode"><b>Méthode</b><ol><li>Écris le rôle des deux côtés utiles pour l'angle étudié (celui qu'on connaît et celui qu'on cherche, ou les deux connus si on cherche l'angle).</li><li>adjacent + hypoténuse : <b>cos</b> ; opposé + hypoténuse : <b>sin</b> ; opposé + adjacent : <b>tan</b>.</li><li>Écris la formule avec les lettres du triangle.</li></ol></div>
<div class="cols">${f1}<div class="ex"><span class="q">Exemple 1 : on connaît AC = 9 cm et on cherche AB.</span><br>Pour l'angle ${ang('B', 'A', 'C')} : [AC] est l'hypoténuse, [AB] le côté adjacent.<br>Adjacent + hypoténuse : <b>cos ${ang('B', 'A', 'C')} = ${F('AB', 'AC')}</b>.</div></div>
<div class="cols">${f2}<div class="ex"><span class="q">Exemple 2 : on connaît BC = 5 cm et on cherche AB.</span><br>[BC] est opposé à l'angle en A, [AB] est adjacent. Pas d'hypoténuse !<br>Opposé + adjacent : <b>tan ${ang('B', 'A', 'C')} = ${F('BC', 'AB')}</b>.</div></div>
<div class="ex"><span class="q">Exemple 3 : on connaît BC (opposé) et AC (hypoténuse), on cherche l'angle ${ang('B', 'A', 'C')}.</span><br>Opposé + hypoténuse : <b>sin ${ang('B', 'A', 'C')} = ${F('BC', 'AC')}</b>.</div>
<div class="warn">⚠️ SOH-CAH-TOA mal appliqué : avant de choisir, écris le rôle de <b>chaque</b> côté pour l'angle étudié.<br>⚠️ Le côté qui n'intervient pas dans l'exercice ne compte pas : regarde seulement les deux côtés utiles.<br>⚠️ Si l'angle étudié change, les rôles adjacent / opposé s'échangent.</div>
<div class="retenir">À retenir : SOH-CAH-TOA, choisi d'après les deux côtés de l'exercice.</div>`;
}

/* ---------- 10. calculer une longueur ---------- */
function L10(d) {
  for (;;) {
    const fn = d < 1 ? 'cos' : d < 2 ? 'sin' : d < 3 ? 'tan' : pick(['cos', 'sin', 'tan']);
    const den = d >= 3 && chance(0.5); // longueur cherchée au dénominateur
    const th = ri(22, 68);
    const [top, bot] = FN[fn];
    const knownR = den ? top : bot, askR = den ? bot : top;
    const kx = d >= 4 ? ri(25, 150) / 10 : ri(3, 15);
    const f = TRIG[fn](th * DEG), X = den ? kx / f : kx * f;
    if (tie(X, 0.1) || X < 1 || X > 999) continue;
    const E = r1(X);
    const P = trigPts(th, knownR, kx);
    const N = trigNames(d);
    const A = angName(N), kN = sN(N, knownR), aN = sN(N, askR);
    const fig = trigFig(P, N, d, [{ a: ROLE[knownR][0], b: ROLE[knownR][1], t: cm(kx) }, { a: ROLE[askR][0], b: ROLE[askR][1], ask: true }], `${th}°`);
    const alts = [
      { x: den ? kx / TRIG[fn](th) : kx * TRIG[fn](th), msg: 'Ta calculatrice est-elle en <b>radians</b> ? Passe-la en mode <b>degrés</b> (DEG).' },
      { x: den ? kx * f : kx / f, msg: den ? `${aN} est au <b>dénominateur</b> : on divise, on ne multiplie pas.` : `${aN} est au <b>numérateur</b> : on multiplie par ${fn} ${A}.` },
      ...['cos', 'sin', 'tan'].filter(g => g !== fn).map(g => ({ x: den ? kx / TRIG[g](th * DEG) : kx * TRIG[g](th * DEG), msg: `Tu as utilisé ${g} : revois SOH-CAH-TOA (quel côté est adjacent, opposé, l'hypoténuse ?).` })),
    ];
    const formula = `${fn} ${A} = ${F(sN(N, top), sN(N, bot))}`;
    return {
      type: 'nums', tpl: `${aN} ≈ {0} cm`, keys: { comma: true, neg: false },
      html: `${rectText(N)}<br>On donne ${A} = ${th}° et ${kN} = ${cm(kx)}.<br>Calcule <b>${aN}</b>, arrondi au dixième.`,
      visual: fig,
      check: lenCheck(E, X, alts),
      verify: ([e]) => near(e, r1(D(P, ...ROLE[askR])), 1e-9) && Math.abs(angleAt(P, 'V', 'R', 'W') - th) < 1e-9 && Math.abs(angleAt(P, 'R', 'V', 'W') - 90) < 1e-9 && near(D(P, ...ROLE[knownR]), kx, 1e-9),
      hint: `${kN} est ${knownR === 'hyp' ? "l'hypoténuse" : `le ${NOMR[knownR]}`} et ${aN} ${askR === 'hyp' ? "l'hypoténuse" : `le ${NOMR[askR]}`} : utilise <b>${fn}</b> (SOH-CAH-TOA). Écris ${formula}, puis remplace.`,
      solution: `${formula}, donc ${den ? `${fn}(${th}°) = ${F(M(kx), aN)} et ${aN} = ${M(kx)} ÷ ${fn}(${th}°)` : `${fn}(${th}°) = ${F(aN, M(kx))} et ${aN} = ${M(kx)} × ${fn}(${th}°)`} ≈ ${M(r6(Math.round(X * 1000) / 1000))}…<br>Arrondi au dixième : <b>${aN} ≈ ${cm(E)}</b>.`,
    };
  }
}
function C10() {
  const f1 = mk(trigPts(35, 'hyp', 8), { V: 'A', R: 'B', W: 'C' }, { segs: [['V', 'R'], ['R', 'W'], ['V', 'W']], right: [['R', 'V', 'W']], angs: [{ v: 'V', a: 'R', b: 'W', t: '35°' }], lens: [{ a: 'V', b: 'W', t: '8 cm' }, { a: 'R', b: 'W', ask: true }], aria: 'exemple 1 : sinus' });
  const f3 = mk(trigPts(40, 'adj', 6), { V: 'A', R: 'B', W: 'C' }, { segs: [['V', 'R'], ['R', 'W'], ['V', 'W']], right: [['R', 'V', 'W']], angs: [{ v: 'V', a: 'R', b: 'W', t: '40°' }], lens: [{ a: 'V', b: 'R', t: '6 cm' }, { a: 'V', b: 'W', ask: true }], aria: 'exemple 3 : longueur au dénominateur' });
  return `<h2>10. Calculer une longueur</h2>
<p class="intro">Avec un angle et une longueur, la trigonométrie donne n'importe quel autre côté du triangle rectangle.</p>
<div class="def">On écrit la formule (cos, sin ou tan) avec les lettres, on remplace ce qu'on connaît, puis on isole la longueur cherchée :<br>• si elle est <b>en haut</b> de la fraction, on <b>multiplie</b> : BC = AC × sin(35°) ;<br>• si elle est <b>en bas</b>, on <b>divise</b> : AC = AB ÷ cos(40°).</div>
<div class="methode"><b>Méthode</b><ol><li>Repère le rôle des deux côtés (celui qu'on connaît, celui qu'on cherche).</li><li>Choisis cos, sin ou tan (SOH-CAH-TOA) et écris la formule.</li><li>Remplace, puis produit en croix.</li><li>Calculatrice en mode <b>degrés</b>, puis arrondis au dixième.</li></ol></div>
<div class="cols">${f1}<div class="ex"><span class="q">Exemple 1 : ${ang('B', 'A', 'C')} = 35°, AC = 8 cm. Calcule BC.</span><br>BC est opposé, AC l'hypoténuse : sin ${ang('B', 'A', 'C')} = ${F('BC', 'AC')}.<br>sin(35°) = ${F('BC', '8')}, donc BC = 8 × sin(35°) ≈ 4,588… ≈ <b>4,6 cm</b>.</div></div>
<div class="ex"><span class="q">Exemple 2 : ${ang('B', 'A', 'C')} = 40°, AB = 6 cm. Calcule BC.</span><br>BC est opposé, AB adjacent : tan ${ang('B', 'A', 'C')} = ${F('BC', 'AB')}.<br>BC = 6 × tan(40°) ≈ 5,034… ≈ <b>5,0 cm</b>.</div>
<div class="cols">${f3}<div class="ex"><span class="q">Exemple 3 : la longueur cherchée est en bas. ${ang('B', 'A', 'C')} = 40°, AB = 6 cm. Calcule AC.</span><br>cos(40°) = ${F('6', 'AC')}, donc AC = 6 ÷ cos(40°) ≈ 7,832… ≈ <b>7,8 cm</b>.<br>Contrôle : l'hypoténuse est bien plus longue que AB.</div></div>
<div class="warn">⚠️ Calculatrice en <b>radians</b> : sin(35) ≈ −0,43 au lieu de 0,57 ! Vérifie le mode DEG.<br>⚠️ Arrondir n'est pas tronquer : 4,588 → 4,6 (et pas 4,5).<br>⚠️ Longueur au dénominateur : on divise par le cosinus (ou sinus, tangente), on ne multiplie pas.</div>
<div class="retenir">À retenir : en haut on multiplie, en bas on divise ; toujours en degrés.</div>`;
}

/* ---------- 11. calculer un angle ---------- */
function L11(d) {
  for (;;) {
    const fn = d < 1 ? 'cos' : d < 2 ? 'sin' : d < 3 ? 'tan' : pick(['cos', 'sin', 'tan']);
    const [top, bot] = FN[fn];
    const dec = d >= 4;
    const b = dec ? ri(30, 150) / 10 : ri(4, 15);
    const t = dec ? ri(15, 140) / 10 : ri(2, 14);
    if (bot === 'hyp' && t >= b) continue;
    const ratio = t / b, th = INV[fn](ratio) / DEG;
    if (th < 15 || th > 75 || tie(th, 1)) continue;
    const E = Math.round(th);
    let P;
    if (fn === 'cos') P = { V: [0, 0], R: [t, 0], W: [t, Math.sqrt(b * b - t * t)] };
    else if (fn === 'sin') { const a = Math.sqrt(b * b - t * t); P = { V: [0, 0], R: [a, 0], W: [a, t] }; } else P = { V: [0, 0], R: [b, 0], W: [b, t] };
    const N = trigNames(d), A = angName(N);
    const tN = sN(N, top), bN = sN(N, bot);
    const fig = trigFig(P, N, d, [{ a: ROLE[top][0], b: ROLE[top][1], t: cm(t) }, { a: ROLE[bot][0], b: ROLE[bot][1], t: cm(b) }], '?', true);
    const alts = [
      { x: INV[fn](ratio), msg: 'Ta calculatrice donne l\'angle en <b>radians</b> : passe-la en mode <b>degrés</b>.' },
      { x: 90 - th, e: 0.5 + 1e-9, msg: `Tu as trouvé l'autre angle aigu : vérifie le côté adjacent et le côté opposé pour l'angle ${A}.` },
      ...['cos', 'sin', 'tan'].filter(g => g !== fn).map(g => ({ x: INV[g](ratio) / DEG, e: 0.5 + 1e-9, msg: `Tu as utilisé ${g}<sup>−1</sup> : revois SOH-CAH-TOA.` })),
    ];
    return {
      type: 'nums', tpl: `${A} ≈ {0} °`, keys: { comma: true, neg: false },
      html: `${rectText(N)}<br>On donne ${tN} = ${cm(t)} et ${bN} = ${cm(b)}.<br>Calcule l'angle <b>${A}</b>, arrondi au degré.`,
      visual: fig,
      check: lenCheck(E, th, alts, 1, 'au degré'),
      verify: ([e]) => e === Math.round(angleAt(P, 'V', 'R', 'W')) && Math.abs(angleAt(P, 'R', 'V', 'W') - 90) < 1e-9 && near(D(P, ...ROLE[top]), t, 1e-9) && near(D(P, ...ROLE[bot]), b, 1e-9),
      hint: `Pour l'angle ${A}, ${tN} est ${top === 'hyp' ? "l'hypoténuse" : `le ${NOMR[top]}`} et ${bN} ${bot === 'hyp' ? "l'hypoténuse" : `le ${NOMR[bot]}`} : c'est le <b>${fn}</b>. Calcule le rapport, puis utilise la touche ${fn}<sup>−1</sup> (ou « arc${fn} ») de la calculatrice.`,
      solution: `${fn} ${A} = ${F(tN, bN)} = ${F(M(t), M(b))}.<br>${A} = ${fn}<sup>−1</sup>(${M(t)} ÷ ${M(b)}) ≈ ${M(Math.round(th * 100) / 100)}°.<br>Arrondi au degré : <b>${A} ≈ ${E}°</b>.`,
    };
  }
}
function C11() {
  const fc = mk({ V: [0, 0], R: [4, 0], W: [4, Math.sqrt(33)] }, { V: 'A', R: 'B', W: 'C' }, { segs: [['V', 'R'], ['R', 'W'], ['V', 'W']], right: [['R', 'V', 'W']], angs: [{ v: 'V', a: 'R', b: 'W', ask: true }], lens: [{ a: 'V', b: 'R', t: '4 cm' }, { a: 'V', b: 'W', t: '7 cm' }], aria: 'exemple 1 : cosinus' });
  const ft = mk({ V: [0, 0], R: [5, 0], W: [5, 6] }, { V: 'A', R: 'B', W: 'C' }, { segs: [['V', 'R'], ['R', 'W'], ['V', 'W']], right: [['R', 'V', 'W']], angs: [{ v: 'V', a: 'R', b: 'W', ask: true }], lens: [{ a: 'V', b: 'R', t: '5 cm' }, { a: 'R', b: 'W', t: '6 cm' }], aria: 'exemple 2 : tangente' });
  return `<h2>11. Calculer un angle</h2>
<p class="intro">Quand on connaît deux côtés d'un triangle rectangle, on peut retrouver la mesure d'un angle aigu grâce aux touches « inverses » de la calculatrice.</p>
<div class="def">On calcule le cosinus (ou sinus, ou tangente) de l'angle, puis on retrouve l'angle avec la touche <b>cos<sup>−1</sup></b> (ou sin<sup>−1</sup>, tan<sup>−1</sup>), parfois notée « arccos » ou « Acs ».</div>
<div class="methode"><b>Méthode</b><ol><li>Repère le rôle des deux côtés connus pour l'angle cherché.</li><li>Choisis cos, sin ou tan, et écris le rapport des deux longueurs.</li><li>Calculatrice en degrés : angle = cos<sup>−1</sup>(rapport) (ou sin<sup>−1</sup>, tan<sup>−1</sup>).</li><li>Arrondis au degré.</li></ol></div>
<div class="cols">${fc}<div class="ex"><span class="q">Exemple 1 : AB = 4 cm (adjacent), AC = 7 cm (hypoténuse).</span><br>cos ${ang('B', 'A', 'C')} = ${F('4', '7')}.<br>${ang('B', 'A', 'C')} = cos<sup>−1</sup>(4 ÷ 7) ≈ 55,15° ≈ <b>55°</b>.</div></div>
<div class="cols">${ft}<div class="ex"><span class="q">Exemple 2 : AB = 5 cm (adjacent), BC = 6 cm (opposé).</span><br>tan ${ang('B', 'A', 'C')} = ${F('6', '5')} = 1,2.<br>${ang('B', 'A', 'C')} = tan<sup>−1</sup>(1,2) ≈ 50,19° ≈ <b>50°</b>.</div></div>
<div class="ex"><span class="q">Exemple 3 : BC = 3 cm (opposé), AC = 8 cm (hypoténuse).</span><br>sin ${ang('B', 'A', 'C')} = ${F('3', '8')} = 0,375, donc ${ang('B', 'A', 'C')} = sin<sup>−1</sup>(0,375) ≈ 22,02° ≈ <b>22°</b>.</div>
<div class="warn">⚠️ En mode radians, tan<sup>−1</sup>(1,2) ≈ 0,876 : ce n'est pas un angle en degrés ! Passe en DEG.<br>⚠️ Si tu trouves 90° moins la bonne réponse, tu as calculé l'autre angle aigu : revois adjacent et opposé.<br>⚠️ Un angle aigu est entre 0° et 90° ; un cosinus ou un sinus est toujours entre 0 et 1.</div>
<div class="retenir">À retenir : rapport des deux côtés, puis touche cos<sup>−1</sup>, sin<sup>−1</sup> ou tan<sup>−1</sup> en degrés.</div>`;
}

/* ---------- 12. défis : problèmes ---------- */
function L12(d) {
  const list = d < 2 ? ['echelle', 'ombre'] : d < 3 ? ['echelle', 'arbre', 'rampe', 'ombre'] : ['echelle', 'arbre', 'rampe', 'ombre', 'cerf'];
  const kind = pick(list);
  const fl = chance(0.5);
  const m = x => `${M(x)} m`;
  for (;;) {
    if (kind === 'echelle') {
      const L = d >= 3 ? ri(30, 90) / 10 : ri(3, 9), a = ri(60, 75);
      const h = L * Math.sin(a * DEG);
      if (tie(h, 0.1)) continue;
      const E = r1(h), b = L * Math.cos(a * DEG);
      const P = { P: [0, 0], M: [b, 0], S: [b, h], g: [-0.25 * b, 0], w: [b, h * 1.12] };
      const fig = figure({ P, segs: [['g', 'M', 'thin'], ['M', 'w', 'thin'], ['P', 'S'], ['P', 'M'], ['M', 'S']], right: [['M', 'P', 'S']], angs: [{ v: 'P', a: 'M', b: 'S', t: `${a}°` }], lens: [{ a: 'P', b: 'S', t: m(L) }, { a: 'M', b: 'S', ask: true }], hide: ['g', 'w'], flip: fl, W: 220, H: 200, aria: 'échelle contre un mur' });
      return {
        type: 'nums', tpl: 'MS ≈ {0} m', keys: { comma: true, neg: false }, visual: fig,
        html: `Une échelle [PS] de ${m(L)} est appuyée contre un mur vertical. Elle fait un angle de ${a}° avec le sol horizontal.<br>À quelle hauteur MS arrive-t-elle ? (arrondi au dixième)`,
        check: lenCheck(E, h, [{ x: L * Math.cos(a * DEG), msg: 'Tu as calculé la distance au mur (cosinus). La hauteur est le côté <b>opposé</b> à l\'angle.' }, { x: L * Math.sin(a), msg: 'Calculatrice en radians ? Passe en degrés.' }]),
        verify: ([e]) => near(e, r1(D(P, 'M', 'S')), 1e-9) && Math.abs(angleAt(P, 'P', 'M', 'S') - a) < 1e-9 && near(D(P, 'P', 'S'), L, 1e-9),
        hint: 'Le triangle PMS est rectangle en M. Pour l\'angle en P, l\'échelle est l\'hypoténuse et la hauteur MS est le côté opposé : c\'est le sinus.',
        solution: `sin ${ang('M', 'P', 'S')} = ${F('MS', 'PS')}, donc MS = ${M(L)} × sin(${a}°) ≈ ${M(Math.round(h * 1000) / 1000)}.<br><b>MS ≈ ${m(E)}</b>.`,
      };
    }
    if (kind === 'arbre') {
      const eye = d >= 4 ? pick([1.5, 1.6]) : 0, Dd = eye ? ri(6, 12) : ri(8, 30), a = eye ? ri(25, 45) : ri(25, 55);
      const top = Dd * Math.tan(a * DEG), h = top + eye;
      if (tie(h, 0.1)) continue;
      const E = r1(h);
      if (!eye) {
        const P = { O: [0, 0], P: [Dd, 0], S: [Dd, top], g: [Dd * 1.15, 0] };
        const fig = figure({ P, segs: [['P', 'g', 'thin'], ['O', 'P'], ['P', 'S'], ['O', 'S', 'dash']], right: [['P', 'O', 'S']], angs: [{ v: 'O', a: 'P', b: 'S', t: `${a}°` }], lens: [{ a: 'O', b: 'P', t: m(Dd) }, { a: 'P', b: 'S', ask: true }], hide: ['g'], flip: fl, W: 300, H: 170, aria: 'hauteur d\'un arbre' });
        return {
          type: 'nums', tpl: 'PS ≈ {0} m', keys: { comma: true, neg: false }, visual: fig,
          html: `Depuis un point O du sol, à ${m(Dd)} du pied P d'un arbre vertical, on voit son sommet S sous un angle de ${a}° avec le sol.<br>Quelle est la hauteur PS de l'arbre ? (arrondi au dixième)`,
          check: lenCheck(E, h, [{ x: Dd * Math.sin(a * DEG), msg: 'Ce serait le sinus, mais OS (l\'hypoténuse) est inconnue. Ici on connaît le côté adjacent OP : tangente !' }, { x: Dd * Math.tan(a), msg: 'Calculatrice en radians ? Passe en degrés.' }]),
          verify: ([e]) => near(e, r1(D(P, 'P', 'S')), 1e-9) && Math.abs(angleAt(P, 'O', 'P', 'S') - a) < 1e-9 && Math.abs(angleAt(P, 'P', 'O', 'S') - 90) < 1e-9,
          hint: 'Le triangle OPS est rectangle en P. Pour l\'angle en O : OP est le côté adjacent et PS le côté opposé. Quelle formule les relie ?',
          solution: `tan ${ang('P', 'O', 'S')} = ${F('PS', 'OP')}, donc PS = ${M(Dd)} × tan(${a}°) ≈ ${M(Math.round(h * 1000) / 1000)}.<br><b>PS ≈ ${m(E)}</b>.`,
        };
      }
      const P = { F: [0, 0], O: [0, eye], H: [Dd, eye], S: [Dd, eye + top], G: [Dd, 0] };
      const fig = figure({ P, segs: [['F', 'G', 'thin'], ['F', 'O', 'thin'], ['O', 'H', 'dash'], ['G', 'H'], ['H', 'S'], ['O', 'S', 'dash']], right: [['H', 'O', 'S']], angs: [{ v: 'O', a: 'H', b: 'S', t: `${a}°` }], lens: [{ a: 'O', b: 'H', t: m(Dd) }, { a: 'G', b: 'H', t: m(eye) }, { a: 'G', b: 'S', ask: true, dim: true }], hide: ['F'], flip: fl, W: 300, H: 180, aria: 'hauteur d\'un arbre' });
      return {
        type: 'nums', tpl: 'GS ≈ {0} m', keys: { comma: true, neg: false }, visual: fig,
        html: `Les yeux O de Malo sont à ${m(eye)} du sol. Il est à ${m(Dd)} d'un arbre [GS] et voit son sommet S sous un angle de ${a}° avec l'horizontale [OH].<br>Quelle est la hauteur GS de l'arbre ? (arrondi au dixième)`,
        check: lenCheck(E, h, [{ x: top, msg: `Tu as calculé HS. N'oublie pas d'ajouter la hauteur des yeux : GS = GH + HS.` }, { x: Dd * Math.tan(a) + eye, msg: 'Calculatrice en radians ? Passe en degrés.' }]),
        verify: ([e]) => near(e, r1(D(P, 'G', 'S')), 1e-9) && Math.abs(angleAt(P, 'O', 'H', 'S') - a) < 1e-9 && parallel(P, 'O', 'H', 'F', 'G'),
        hint: 'Deux étapes : dans le triangle OHS rectangle en H, calcule HS avec la tangente ; puis ajoute GH (la hauteur des yeux).',
        solution: `tan ${ang('H', 'O', 'S')} = ${F('HS', 'OH')}, donc HS = ${M(Dd)} × tan(${a}°) ≈ ${M(Math.round(top * 1000) / 1000)}.<br>GS = GH + HS ≈ ${M(eye)} + ${M(Math.round(top * 1000) / 1000)} ≈ ${M(Math.round(h * 1000) / 1000)}. <b>GS ≈ ${m(E)}</b>.`,
      };
    }
    if (kind === 'rampe') {
      const L = ri(30, 60) / 10, h = ri(9, 30) / 10;
      if (h >= L) continue;
      const th = Math.asin(h / L) / DEG;
      if (th < 15 || th > 55 || tie(th, 1)) continue;
      const E = Math.round(th), x = Math.sqrt(L * L - h * h);
      const P = { A: [0, 0], D: [x, 0], C: [x, h] };
      const fig = figure({ P, segs: [['A', 'D'], ['D', 'C'], ['A', 'C']], right: [['D', 'A', 'C']], angs: [{ v: 'A', a: 'D', b: 'C', ask: true }], lens: [{ a: 'A', b: 'C', t: m(L) }, { a: 'D', b: 'C', t: m(h) }], flip: fl, W: 300, H: 150, aria: 'rampe' });
      return {
        type: 'nums', tpl: `${ang('D', 'A', 'C')} ≈ {0} °`, keys: { comma: true, neg: false }, visual: fig,
        html: `Une rampe de skate [AC] mesure ${m(L)}. Son sommet C est à ${m(h)} au-dessus du sol (D est au pied de la verticale).<br>Quel angle ${ang('D', 'A', 'C')} fait-elle avec le sol ? (arrondi au degré)`,
        check: lenCheck(E, th, [{ x: Math.asin(h / L), msg: 'Angle en radians : passe la calculatrice en degrés.' }, { x: Math.atan(h / L) / DEG, e: 0.5 + 1e-9, msg: 'AC est l\'hypoténuse, pas le côté adjacent : c\'est le sinus.' }, { x: 90 - th, e: 0.5 + 1e-9, msg: 'Tu as trouvé l\'angle en C, pas l\'angle au sol.' }], 1, 'au degré'),
        verify: ([e]) => e === Math.round(angleAt(P, 'A', 'D', 'C')) && near(D(P, 'A', 'C'), L, 1e-9),
        hint: 'Le triangle ADC est rectangle en D. Pour l\'angle en A : DC est le côté opposé et AC l\'hypoténuse.',
        solution: `sin ${ang('D', 'A', 'C')} = ${F('DC', 'AC')} = ${F(M(h), M(L))}, donc ${ang('D', 'A', 'C')} = sin<sup>−1</sup>(${M(h)} ÷ ${M(L)}) ≈ ${M(Math.round(th * 100) / 100)}°. <b>Environ ${E}°</b>.`,
      };
    }
    if (kind === 'ombre') {
      const h1 = pick([1, 1.2, 1.5, 2]), s1 = pick([0.8, 1.2, 1.5, 2, 2.5, 3]), s2 = d >= 3 ? ri(60, 200) / 10 : ri(6, 20);
      const h2 = r6(h1 * s2 / s1);
      if (decimals(h2) > 2 || s2 < s1 * 2.5 || s2 > s1 * 6) continue;
      const P = { S: [0, 0], B: [s1, 0], H: [s1, h1], T: [s2, 0], A: [s2, h2] };
      const fig = figure({ P, segs: [['S', 'B'], ['B', 'T'], ['B', 'H', 'par'], ['T', 'A', 'par'], ['S', 'A', 'dash']], par: [['H', 'B'], ['A', 'T']], right: [['B', 'S', 'H'], ['T', 'S', 'A']], lens: [{ a: 'B', b: 'H', t: m(h1) }, { a: 'S', b: 'B', t: m(s1), side: 'in' }, { a: 'S', b: 'T', t: m(s2), dim: true }, { a: 'T', b: 'A', ask: true }], flip: fl, W: 320, H: 170, aria: 'ombres' });
      return {
        type: 'nums', tpl: 'TA = {0} m', keys: { comma: true, neg: false }, visual: fig,
        html: `Au même moment, un bâton vertical [BH] de ${m(h1)} a une ombre [SB] de ${m(s1)}, et un arbre vertical [TA] a une ombre [ST] de ${m(s2)}. Les rayons du soleil sont parallèles : S, H, A sont alignés.<br>Quelle est la hauteur TA de l'arbre ?`,
        check: lenCheck(h2, h2, [{ x: h1 * s1 / s2, msg: 'Rapport inversé : l\'arbre a une ombre plus longue, il est donc plus haut que le bâton.' }], 0),
        value: r6(D(P, 'T', 'A')),
        verify: ([e]) => near(e, D(P, 'T', 'A'), 1e-9) && parallel(P, 'B', 'H', 'T', 'A'),
        hint: '(BH) et (TA) sont parallèles (toutes deux verticales) : c\'est une configuration de Thalès de sommet S. Écris SB/ST = BH/TA.',
        solution: `(BH) // (TA), B ∈ [ST], H ∈ [SA] : d'après le théorème de Thalès, ${F('SB', 'ST')} = ${F('BH', 'TA')}, donc ${F(M(s1), M(s2))} = ${F(M(h1), 'TA')}.<br>TA = ${M(s2)} × ${M(h1)} ÷ ${M(s1)} = <b>${m(h2)}</b>.`,
      };
    }
    // cerf-volant : longueur cherchée au dénominateur
    const hh = ri(8, 30), a = ri(30, 60);
    const L = hh / Math.sin(a * DEG);
    if (tie(L, 0.1)) continue;
    const E = r1(L), x = hh / Math.tan(a * DEG);
    const P = { E: [0, 0], H: [x, 0], C: [x, hh] };
    const fig = figure({ P, segs: [['E', 'H', 'thin'], ['H', 'C', 'dash'], ['E', 'C']], right: [['H', 'E', 'C']], angs: [{ v: 'E', a: 'H', b: 'C', t: `${a}°` }], lens: [{ a: 'H', b: 'C', t: m(hh) }, { a: 'E', b: 'C', ask: true }], flip: fl, W: 280, H: 180, aria: 'cerf-volant' });
    return {
      type: 'nums', tpl: 'EC ≈ {0} m', keys: { comma: true, neg: false }, visual: fig,
      html: `Le fil tendu [EC] d'un cerf-volant fait un angle de ${a}° avec le sol. Le cerf-volant C est à ${m(hh)} de hauteur (H est au sol, à la verticale de C).<br>Quelle est la longueur du fil EC ? (arrondi au dixième)`,
      check: lenCheck(E, L, [{ x: hh * Math.sin(a * DEG), msg: 'EC est l\'hypoténuse, au <b>dénominateur</b> : on divise par le sinus.' }, { x: hh / Math.sin(a), msg: 'Calculatrice en radians ? Passe en degrés.' }, { x: hh / Math.cos(a * DEG), msg: 'HC est le côté opposé à l\'angle en E : c\'est le sinus, pas le cosinus.' }]),
      verify: ([e]) => near(e, r1(D(P, 'E', 'C')), 1e-9) && Math.abs(angleAt(P, 'E', 'H', 'C') - a) < 1e-9 && Math.abs(angleAt(P, 'H', 'E', 'C') - 90) < 1e-9,
      hint: 'Triangle EHC rectangle en H. Pour l\'angle en E : HC est le côté opposé, EC l\'hypoténuse. sin = opposé ÷ hypoténuse, puis produit en croix.',
      solution: `sin ${ang('H', 'E', 'C')} = ${F('HC', 'EC')}, donc EC = ${M(hh)} ÷ sin(${a}°) ≈ ${M(Math.round(L * 1000) / 1000)}. <b>EC ≈ ${m(E)}</b>.`,
    };
  }
}
function C12() {
  const P = { S: [0, 0], B: [2, 0], H: [2, 1.6], T: [6, 0], A: [6, 4.8] };
  const ombre = figure({ P, segs: [['S', 'B'], ['B', 'T'], ['B', 'H', 'par'], ['T', 'A', 'par'], ['S', 'A', 'dash']], par: [['H', 'B'], ['A', 'T']], right: [['B', 'S', 'H'], ['T', 'S', 'A']], lens: [{ a: 'B', b: 'H', t: '1,6 m' }, { a: 'S', b: 'B', t: '2 m', side: 'in' }, { a: 'S', b: 'T', t: '6 m', dim: true }, { a: 'T', b: 'A', ask: true }], W: 320, H: 170, aria: 'ombres' });
  const top = 10 * Math.tan(35 * DEG);
  const Q = { F: [0, 0], O: [0, 1.5], H: [10, 1.5], S: [10, 1.5 + top], G: [10, 0] };
  const arbre = figure({ P: Q, segs: [['F', 'G', 'thin'], ['F', 'O', 'thin'], ['O', 'H', 'dash'], ['G', 'H'], ['H', 'S'], ['O', 'S', 'dash']], right: [['H', 'O', 'S']], angs: [{ v: 'O', a: 'H', b: 'S', t: '35°' }], lens: [{ a: 'O', b: 'H', t: '10 m' }, { a: 'G', b: 'H', t: '1,5 m' }, { a: 'G', b: 'S', ask: true, dim: true }], hide: ['F'], W: 300, H: 180, aria: 'hauteur d\'un arbre' });
  return `<h2>12. Défis : problèmes</h2>
<p class="intro">Ombres, échelles, arbres, rampes, cerfs-volants : dans chaque situation se cache un triangle rectangle ou des droites parallèles.</p>
<div class="def"><b>Thalès</b> : deux droites parallèles (par exemple deux objets verticaux et les rayons du soleil).<br><b>Trigonométrie</b> : un triangle rectangle avec un angle connu ou cherché (« angle avec le sol », « avec l'horizontale »).</div>
<div class="methode"><b>Méthode</b><ol><li>Fais un schéma et repère un <b>triangle rectangle</b> (trigonométrie) ou des <b>droites parallèles</b> (Thalès).</li><li>Écris la formule avec les lettres.</li><li>Calcule (calculatrice en degrés), arrondis à la fin.</li><li>Vérifie que le résultat est réaliste et réponds par une phrase.</li></ol></div>
<div class="cols">${ombre}<div class="ex"><span class="q">Exemple 1 (ombres, Thalès) : bâton de 1,6 m, ombre 2 m ; ombre de l'arbre 6 m.</span><br>(BH) // (TA) : ${F('SB', 'ST')} = ${F('BH', 'TA')}, donc ${F('2', '6')} = ${F('1,6', 'TA')} et TA = 6 × 1,6 ÷ 2 = <b>4,8 m</b>.</div></div>
<div class="cols">${arbre}<div class="ex"><span class="q">Exemple 2 (arbre, deux étapes) : yeux à 1,5 m du sol, à 10 m de l'arbre, angle 35°.</span><br>tan 35° = ${F('HS', '10')}, donc HS = 10 × tan(35°) ≈ 7,00 m.<br>GS = GH + HS ≈ 1,5 + 7,00 ≈ <b>8,5 m</b>.</div></div>
<div class="ex"><span class="q">Exemple 3 (échelle) : échelle de 5 m, angle 70° avec le sol.</span><br>La hauteur est opposée à l'angle, l'échelle est l'hypoténuse : hauteur = 5 × sin(70°) ≈ <b>4,7 m</b>.</div>
<div class="ex"><span class="q">Exemple 4 (cerf-volant) : hauteur 20 m, fil incliné à 50°.</span><br>sin 50° = ${F('20', 'fil')}, donc fil = 20 ÷ sin(50°) ≈ <b>26,1 m</b> (le fil est au dénominateur : on divise).</div>
<div class="warn">⚠️ Un « angle avec le sol » est mesuré depuis le sol : repère bien son sommet.<br>⚠️ Avec la hauteur des yeux, n'oublie pas de l'ajouter à la fin.<br>⚠️ Calculatrice en degrés ; arrondir seulement à la fin.</div>
<div class="retenir">À retenir : parallèles → Thalès ; triangle rectangle et angle → trigonométrie.</div>`;
}

export const LEVELS = [
  { titre: 'Reconnaître une configuration de Thalès', generate: L1, cours: C1, classe: '3e' },
  { titre: 'Thalès : calculer une longueur', generate: L2, cours: C2, classe: '3e' },
  { titre: 'Thalès avec des décimaux', generate: L3, cours: C3, classe: '3e' },
  { titre: 'Thalès : AB = AM + MB', generate: L4, cours: C4, classe: '3e' },
  { titre: 'Configuration papillon', generate: L5, cours: C5, classe: '3e' },
  { titre: 'Réciproque : parallèles ou non ?', generate: L6, cours: C6, classe: '3e' },
  { titre: 'Agrandissement et réduction', generate: L7, cours: C7, classe: '3e' },
  { titre: 'Adjacent, opposé, hypoténuse', generate: L8, cours: C8, classe: '3e' },
  { titre: 'Choisir cos, sin ou tan', generate: L9, cours: C9, classe: '3e' },
  { titre: 'Trigonométrie : calculer une longueur', generate: L10, cours: C10, classe: '3e' },
  { titre: 'Trigonométrie : calculer un angle', generate: L11, cours: C11, classe: '3e' },
  { titre: 'Défis : problèmes', generate: L12, cours: C12, classe: '3e' },
];
export const OPTIONS = { need: 4, keys: { comma: true, neg: false } };

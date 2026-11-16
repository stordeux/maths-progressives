// Angles (6e – 5e) : 12 niveaux. Chaque exercice a sa figure SVG, construite à partir de coordonnées
// (draw.js). Les mesures sont recalculées avec Math.atan2 (angleAt) dans `value` ou `verify` :
// c'est la vérification indépendante des tests.
// La difficulté monte avec d : figure tournée (d ≥ 1), noms des points au hasard (d ≥ 2), mesures plus fines.
import { ri, pick, shuffle, chance } from '../../engine/util/rand.js';
import { numsCheck, choiceCheck } from '../../engine/answers/checks.js';
import { figure, pol, dirDeg, angleAt, inter, rotAll, mod360 } from './draw.js';

const LET = 'ABCDEFGHJKLMNPRSTUVXYZ'.split('');
/** nom d'angle avec son chapeau */
const H = s => `<span class="ang">${s}</span>`;
const dg = n => `${n}°`;
/** noms des points : ceux par défaut, puis au hasard à partir de d = 2 */
const letters = (d, def) => (d >= 2 ? shuffle([...LET]).slice(0, def.length) : def.split(''));
/** orientation de la figure : fixe à d = 0, au hasard ensuite */
const orient = d => (d >= 1 ? ri(0, 359) : 0);
const close = (a, b) => Math.abs(a - b) < 1e-6;
/** mesure au hasard, multiple de st, dans [lo ; hi] */
const meas = (st, lo, hi) => st * ri(Math.ceil(lo / st), Math.floor(hi / st));
/** pas des mesures selon d : 10, puis 5, puis 1 */
const stepOf = (d, a = 1, b = 3) => (d < a ? 10 : d < b ? 5 : 1);
const nature = m => (m < 90 ? 'aigu' : m === 90 ? 'droit' : m < 180 ? 'obtus' : 'plat');

/** question à une case (degrés entiers, pas de touche moins) */
function numQ(o) {
  return {
    type: 'nums', tpl: o.tpl, check: numsCheck([o.X], { msg: v => (o.msg ? o.msg(v[0]) || '' : '') }),
    value: o.value, keys: { neg: false }, html: o.html, visual: o.visual, hint: o.hint, solution: o.solution, verify: o.verify,
  };
}
const CONFUS = `Attention : <b>complémentaires</b> → somme 90° ; <b>supplémentaires</b> → somme 180°.`;

/* =========================================================================================
   1. Nommer un angle
   ========================================================================================= */
function L1(d) {
  const [a, b, c, e] = letters(d, 'ABCD');
  const t = orient(d), m = ri(d < 2 ? 40 : 25, d < 2 ? 140 : 155);
  const B = [0, 0];
  const P = { [a]: pol(B, 135, t), [b]: B, [c]: pol(B, 125, t + m) };
  const segs = [[b, a], [b, c]];
  const good = d >= 1 && chance(.5) ? c + b + a : a + b + c;
  let wrong = shuffle([b + a + c, a + c + b, c + a + b, b + c + a]).slice(0, 2);
  if (d >= 3) {
    const ex = ri(45, Math.min(120, 360 - m - 45));
    P[e] = pol(B, 115, t - ex); segs.push([b, e]);
    wrong = [wrong[0], wrong[1], pick([a + b + e, e + b + c])];
  }
  const opts = shuffle([good, ...wrong]).map(v => ({ v, l: `l'angle ${H(v)}` }));
  return {
    type: 'choice', opts, check: choiceCheck(good, { msg: v => (v[1] !== b ? `La lettre du <b>sommet</b> (le point où se rejoignent les deux côtés) doit être écrite <b>au milieu</b>.` : `Le sommet est bien au milieu, mais regarde les deux côtés de l'angle marqué : par quels points passent-ils ?`) }),
    html: d < 3 ? `Comment s'appelle l'angle marqué en orange ?` : `Plusieurs angles ont le sommet ${b}. Comment s'appelle celui qui est marqué en orange ?`,
    visual: figure({ P, segs, arcs: [{ v: b, a, b: c, r: 32 }], aria: 'angle marqué' }),
    hint: `Le nom d'un angle a trois lettres. Le <b>sommet</b> (le point où les deux côtés se rejoignent) s'écrit <b>au milieu</b> ; les deux autres lettres sont des points de chaque côté.`,
    solution: `Le sommet est ${b}, les côtés sont [${b}${a}) et [${b}${c}). On écrit ${b} au milieu : ${H(a + b + c)} ou ${H(c + b + a)} (c'est le même angle).`,
    verify: E => {
      const A = P[E[0]], S = P[E[1]], C = P[E[2]];
      const ends = [dirDeg(S, A), dirDeg(S, C)].map(mod360).sort((x, y) => x - y);
      const arc = [t, t + m].map(mod360).sort((x, y) => x - y);
      return E[1] === b && close(angleAt(A, S, C), m) && close(ends[0], arc[0]) && close(ends[1], arc[1]);
    },
  };
}
function C1() {
  const P = { A: pol([0, 0], 150, 0), B: [0, 0], C: pol([0, 0], 140, 50) };
  const E = [0, 0], Q = { E, D: pol(E, 140, 0), F: pol(E, 140, 55), G: pol(E, 140, 120) };
  return `<h2>1. Nommer un angle</h2>
<p class="intro">Pour parler d'un angle sans se tromper, on lui donne un nom de trois lettres. Tout le reste du chapitre utilise ces noms !</p>
<div class="def">Un <b>angle</b> est formé par deux demi-droites de même origine. Cette origine est le <b>sommet</b> de l'angle, les demi-droites sont ses <b>côtés</b>.<br>On le nomme avec <b>trois lettres</b>, la lettre du <b>sommet au milieu</b>, et on met un chapeau : ${H('ABC')}.</div>
<div class="methode"><b>Méthode</b><ol><li>Repère le <b>sommet</b> : le point où les deux côtés de l'angle marqué se rejoignent.</li><li>Repère un point sur <b>chacun</b> des deux côtés de l'angle marqué.</li><li>Écris : un point d'un côté, puis le <b>sommet</b>, puis le point de l'autre côté.</li></ol></div>
<div class="cols">${figure({ P, segs: [['B', 'A'], ['B', 'C']], arcs: [{ v: 'B', a: 'A', b: 'C', r: 34 }], width: 300, aria: 'angle ABC' })}
${figure({ P: Q, segs: [['E', 'D'], ['E', 'F'], ['E', 'G']], arcs: [{ v: 'E', a: 'F', b: 'G', r: 36 }], lab: { E: 240 }, width: 300, aria: 'trois demi-droites de sommet E' })}</div>
<div class="ex"><span class="q">Exemple 1 : un seul angle</span><br>Sommet B, côtés [BA) et [BC) : c'est l'angle ${H('ABC')}, qu'on peut aussi lire ${H('CBA')} (c'est le même).</div>
<div class="ex"><span class="q">Exemple 2 : plusieurs angles au même sommet</span><br>Sur la 2<sup>e</sup> figure, trois demi-droites partent de E. L'angle marqué a pour côtés [EF) et [EG) : c'est ${H('FEG')}.<br>${H('DEF')} est l'autre petit angle, et ${H('DEG')} est le grand angle qui contient les deux.</div>
<div class="warn">⚠️ ${H('BAC')} n'est <b>pas</b> le même angle que ${H('ABC')} : son sommet est A ! Le sommet est <b>toujours au milieu</b>.<br>⚠️ Avec plusieurs demi-droites, vérifie que les deux lettres extérieures sont bien sur les côtés de l'angle <b>marqué</b>.<br>⚠️ La longueur des côtés dessinés ne change pas l'angle : seul compte l'« écartement ».</div>
<div class="retenir">À retenir : trois lettres, et la lettre du sommet toujours au milieu.</div>`;
}

/* =========================================================================================
   2. Aigu, droit, obtus, plat
   ========================================================================================= */
function L2(d) {
  const [a, b, c] = letters(d, 'ABC');
  const t = orient(d), u = ri(0, 7);
  const m = u === 0 ? 180 : u <= 2 ? 90 : u <= 4 ? (d < 2 ? meas(5, 25, 65) : meas(5, 15, 75)) : (d < 2 ? meas(5, 115, 160) : meas(5, 105, 170));
  const B = [0, 0], P = { [a]: pol(B, 140, t), [b]: B, [c]: pol(B, 130, t + m) };
  const arcs = m === 180 ? [{ v: b, d1: t, span: 180, r: 30 }] : [{ v: b, a, b: c, r: 30 }];
  const rights = m === 90 && d < 1 ? [{ v: b, a, b: c }] : [];
  const E = nature(m);
  const opts = ['aigu', 'droit', 'obtus', 'plat'].map(v => ({ v, l: `${H(a + b + c)} est un angle <b>${v}</b>` }));
  return {
    type: 'choice', opts, check: choiceCheck(E, { msg: v => ((v === 'aigu' || v === 'obtus') && (E === 'aigu' || E === 'obtus') ? `Compare avec un angle droit (le coin d'une feuille) : plus petit → aigu, plus grand → obtus.` : '') }),
    html: `De quelle nature est l'angle ${H(a + b + c)} ?`,
    visual: figure({ P, segs: [[b, a], [b, c]], arcs: m === 90 && d < 1 ? [] : arcs, rights, lab: m === 180 ? { [b]: t - 90 } : undefined, aria: 'angle' }),
    hint: `Compare l'angle avec un <b>angle droit</b> (90°, le coin d'une feuille) et avec un <b>angle plat</b> (180°, les deux côtés forment une droite).`,
    solution: `${H(a + b + c)} mesure ${m}° : ${m < 90 ? 'il est plus petit qu\'un angle droit, il est <b>aigu</b>' : m === 90 ? 'c\'est un angle <b>droit</b>' : m < 180 ? 'il est plus grand qu\'un angle droit mais plus petit qu\'un angle plat : il est <b>obtus</b>' : 'ses deux côtés forment une droite : il est <b>plat</b>'}.`,
    verify: v => v === nature(Math.round(angleAt(P[a], P[b], P[c]) * 1e6) / 1e6),
  };
}
function C2() {
  const O = k => [k * 175, 0];
  const P = {}, segs = [], arcs = [], rights = [], texts = [];
  [[50, 'aigu'], [90, 'droit'], [130, 'obtus'], [180, 'plat']].forEach(([m, n], k) => {
    const V = O(k), A = pol(V, 70, 0), C = pol(V, 70, m);
    const p = 'abcd'[k];
    P[p + 1] = A; P[p + 2] = V; P[p + 3] = C;
    segs.push([p + 2, p + 1], [p + 2, p + 3]);
    if (m === 90) rights.push({ v: p + 2, a: p + 1, b: p + 3 }); else arcs.push(m === 180 ? { v: V, d1: 0, span: 180, r: 22 } : { v: p + 2, a: p + 1, b: p + 3, r: 22 });
    texts.push({ p: [V[0], -28], s: n, fs: 20 });
  });
  const Z = [0, 0], R = { Z, r0: pol(Z, 150, 0), r90: pol(Z, 150, 90), r180: pol(Z, 150, 180) };
  return `<h2>2. Aigu, droit, obtus, plat</h2>
<p class="intro">Avant de mesurer un angle, on sait déjà beaucoup en le comparant à un <b>angle droit</b> (le coin d'une feuille).</p>
<div class="def">• angle <b>aigu</b> : plus petit qu'un angle droit (moins de 90°)<br>• angle <b>droit</b> : 90°, le coin d'une feuille, codé par un petit carré<br>• angle <b>obtus</b> : plus grand qu'un angle droit, mais moins qu'un angle plat (entre 90° et 180°)<br>• angle <b>plat</b> : 180°, ses deux côtés forment une droite</div>
${figure({ P, hide: Object.keys(P), segs, arcs, rights, texts, width: 560, aria: 'les quatre natures d\'angles' })}
<div class="cols"><div class="methode"><b>Méthode</b><ol><li>Les deux côtés forment-ils une droite ? → <b>plat</b>.</li><li>Sinon, pose ton équerre (ou le coin d'une feuille) sur un côté, le coin sur le sommet.</li><li>Pile sur l'équerre → <b>droit</b> ; à l'intérieur → <b>aigu</b> ; il dépasse → <b>obtus</b>.</li></ol></div>
${figure({ P: R, hide: ['Z', 'r0', 'r90', 'r180'], segs: [['Z', 'r0'], ['Z', 'r90'], ['Z', 'r180']], arcs: [{ v: Z, d1: 0, span: 90, r: 110, kind: 'other' }, { v: Z, d1: 90, span: 90, r: 110 }], rights: [{ v: 'Z', a: 'r0', b: 'r90', size: 16 }], texts: [{ p: pol(Z, 62, 40), s: 'aigu', fs: 18 }, { p: pol(Z, 62, 140), s: 'obtus', fs: 18 }, { p: pol(Z, 170, 90), s: '90°', fs: 15 }, { p: pol(Z, 172, 0), s: '0°', fs: 15 }, { p: pol(Z, 176, 180), s: '180°', fs: 15 }], width: 300, aria: 'zones aigu et obtus' })}</div>
<div class="ex"><span class="q">Exemple 1 :</span><br>Un angle de 35° est <b>aigu</b> (35 &lt; 90) ; un angle de 120° est <b>obtus</b> (90 &lt; 120 &lt; 180).</div>
<div class="ex"><span class="q">Exemple 2 : figure penchée, pas de codage</span><br>Un angle peut être dessiné tourné, sans petit carré. S'il tombe pile sur l'équerre, il est quand même <b>droit</b>. Un angle de 175° est <b>obtus</b>, pas plat : ses côtés ne sont pas tout à fait alignés.</div>
<div class="warn">⚠️ Ne te laisse pas tromper par la longueur des côtés ou la position de la figure : seul compte l'écartement.<br>⚠️ Aigu ou obtus ? Compare toujours avec l'angle <b>droit</b> : plus petit → aigu, plus grand → obtus.</div>
<div class="retenir">À retenir : aigu → moins de 90° ; droit → 90° ; obtus → entre 90° et 180° ; plat → 180°.</div>`;
}

/* =========================================================================================
   3 et 4. Le rapporteur virtuel
   ========================================================================================= */
function protQ(d, lvl) {
  const st = lvl === 3 ? (d < 3 ? 10 : 5) : (d < 1 ? 10 : d < 3 ? 5 : 1);
  let m;
  do { m = meas(st, 15, 165); } while ((m === 90 && chance(.8)) || (st === 5 && m % 10 === 0 && chance(.7)) || (st === 1 && m % 5 === 0 && chance(.8)));
  const left = lvl === 4 && chance(.5);
  const r0 = lvl === 4 && d >= 4 ? ri(-30, 30) : 0;
  const R = 170, O = [0, 0], kSide = left ? 180 : 0, kOther = left ? 180 - m : m;
  const [o, a, b] = letters(d, 'OAB');
  const P = { [o]: O, [a]: pol(O, R + 30, r0 + kSide), [b]: pol(O, R + 30, r0 + kOther) };
  const name = a + o + b, col = left ? '<span style="color:#1d4ed8">bleue (intérieure)</span>' : '<span style="color:#b91c1c">rouge (extérieure)</span>';
  const visual = figure({
    P, prot: { O, rot: r0, R }, segs: [{ a: o, b: a, w: 3.2, c: '#7c2d12' }, { a: o, b, w: 3.2, c: '#7c2d12' }],
    arcs: [{ v: o, a, b, r: 24, kind: 'ask' }], lab: { [o]: r0 - 90 }, width: 700, scale: 1.9, aria: 'angle et rapporteur',
  });
  const wrongMsg = x => (x === 180 - m && m !== 90 ? `Tu as lu la <b>mauvaise graduation</b> du rapporteur ! L'angle est ${m < 90 ? 'aigu : sa mesure est plus petite' : 'obtus : sa mesure est plus grande'} que 90°.` : '');
  return numQ({
    X: m, tpl: `${H(name)} = {0} °`, msg: wrongMsg,
    html: lvl === 3 ? `Le rapporteur est bien placé. Lis la mesure de l'angle ${H(name)}.` : `Lis la mesure de l'angle ${H(name)}. Attention à la graduation !`,
    visual, value: angleAt(P[a], O, P[b]),
    hint: `Le côté [${o}${a}) passe par un <b>0</b> du rapporteur : c'est celui de la graduation ${col}. Suis cette graduation (0, 10, 20…) jusqu'à l'autre côté [${o}${b}).${st < 10 ? ' Compte ensuite les petits traits : un grand trait tous les 10°, un moyen tous les 5°.' : ''}`,
    solution: `Le centre du rapporteur est sur le sommet ${o}, et le côté [${o}${a}) passe par le 0 de la graduation ${col}. En suivant cette graduation jusqu'à [${o}${b}), on lit <b>${m}°</b>.<br>Contrôle : l'angle est ${m < 90 ? 'aigu, la mesure est bien plus petite' : m === 90 ? 'droit' : 'obtus, la mesure est bien plus grande'} que 90°. (L'autre graduation donnerait ${180 - m}°.)`,
    verify: E => {
      const side = mod360(dirDeg(O, P[a]) - r0), other = mod360(dirDeg(O, P[b]) - r0);
      const reading = close(side, 0) ? other : close(side, 180) ? 180 - other : NaN;
      return close(angleAt(P[a], O, P[b]), E[0]) && close(reading, E[0]);
    },
  });
}
const L3 = d => protQ(d, 3), L4 = d => protQ(d, 4);
function C3() {
  const O = [0, 0], P = { O, A: pol(O, 200, 0), B: pol(O, 200, 50) }, Q = { O, A: pol(O, 200, 0), B: pol(O, 200, 125) };
  const fig = (P, aria) => figure({ P, prot: { O, rot: 0, R: 170 }, segs: [{ a: 'O', b: 'A', w: 3.2, c: '#7c2d12' }, { a: 'O', b: 'B', w: 3.2, c: '#7c2d12' }], arcs: [{ v: 'O', a: 'A', b: 'B', r: 24, kind: 'ask' }], lab: { O: -90 }, width: 460, aria });
  return `<h2>3. Mesurer avec un rapporteur</h2>
<p class="intro">Le rapporteur donne la <b>mesure</b> d'un angle, en degrés (°). Bien placé, il suffit de savoir lire la bonne graduation.</p>
<div class="def">Un rapporteur a deux graduations de 0° à 180°, qui vont en sens contraires :<br>• la graduation <b style="color:#b91c1c">rouge (extérieure)</b> part de 0 à droite ;<br>• la graduation <b style="color:#1d4ed8">bleue (intérieure)</b> part de 0 à gauche.</div>
<div class="methode"><b>Méthode</b><ol><li>Le <b>centre</b> du rapporteur est sur le <b>sommet</b> de l'angle.</li><li>La ligne du <b>0</b> est sur un <b>côté</b> : repère de quelle couleur est ce 0.</li><li>Suis la graduation <b>de cette couleur</b> (0, 10, 20…) jusqu'à l'autre côté.</li><li>Contrôle : angle aigu → moins de 90° ; angle obtus → plus de 90°.</li></ol></div>
${fig(P, 'rapporteur posé sur un angle de 50 degrés')}
<div class="ex"><span class="q">Exemple 1 : un angle aigu</span><br>[OA) passe par le 0 de la graduation <b style="color:#b91c1c">rouge</b>. On la suit : 0, 10, 20, 30, 40, <b>50</b>. Donc ${H('AOB')} = <b>50°</b>. Contrôle : l'angle est aigu et 50 &lt; 90 ✓.</div>
${fig(Q, 'rapporteur posé sur un angle de 125 degrés')}
<div class="ex"><span class="q">Exemple 2 : un angle obtus, entre deux nombres</span><br>Toujours la graduation rouge (le 0 est sur [OA)). L'autre côté tombe sur le <b>trait moyen</b> entre 120 et 130 : ${H('AOB')} = <b>125°</b>. Contrôle : l'angle est obtus et 125 &gt; 90 ✓.</div>
<div class="warn">⚠️ Erreur classique : lire la <b>mauvaise graduation</b>. Dans l'exemple 1, la graduation bleue donne 130° : c'est faux ! Les deux lectures font toujours 180° à elles deux (50 + 130 = 180).<br>⚠️ Un grand trait tous les 10°, un trait moyen tous les 5°.</div>
<div class="retenir">À retenir : centre sur le sommet, 0 sur un côté, et on suit la graduation qui part de CE 0.</div>`;
}
function C4() {
  const O = [0, 0], P = { O, A: pol(O, 200, 180), B: pol(O, 200, 120) };
  // zoom sur la graduation entre 40° et 50° : l'autre côté tombe sur 43°
  const x = k => 30 + k * 34;
  let z = '<svg viewBox="0 0 400 120" class="vis" role="img" aria-label="zoom sur la graduation entre 40 et 50 degrés" font-family="system-ui,sans-serif" style="max-width:400px"><rect x="10" y="20" width="380" height="60" rx="6" fill="#fef3c7" stroke="#92400e"/>';
  for (let k = 0; k <= 10; k++) {
    const h = k % 10 === 0 ? 30 : k % 5 === 0 ? 20 : 11;
    z += `<line x1="${x(k)}" y1="20" x2="${x(k)}" y2="${20 + h}" stroke="#78350f" stroke-width="${k % 5 === 0 ? 2 : 1.2}"/>`;
  }
  z += `<text x="${x(0)}" y="70" font-size="17" text-anchor="middle" fill="#b91c1c" font-weight="700">40</text><text x="${x(10)}" y="70" font-size="17" text-anchor="middle" fill="#b91c1c" font-weight="700">50</text>`;
  z += `<line x1="${x(3)}" y1="8" x2="${x(3)}" y2="92" stroke="#7c2d12" stroke-width="3.2"/><text x="${x(3)}" y="112" font-size="17" text-anchor="middle" fill="#7c2d12" font-weight="700">43°</text></svg>`;
  return `<h2>4. Intérieur ou extérieur ?</h2>
<p class="intro">L'angle n'est pas toujours tourné vers la droite : il faut alors choisir l'autre graduation, et parfois lire au degré près.</p>
<div class="def">Le rapporteur a <b>deux graduations</b> qui vont en sens contraires. On utilise celle dont le <b>0</b> est <b>sur le côté</b> de l'angle.<br>Mesures fines : un grand trait tous les 10°, un trait moyen tous les 5°, un petit trait par degré.</div>
<div class="methode"><b>Méthode</b><ol><li>Cherche quel côté de l'angle passe par un <b>0</b> : à droite → graduation <b style="color:#b91c1c">rouge</b> ; à gauche → graduation <b style="color:#1d4ed8">bleue</b>.</li><li>Suis cette graduation jusqu'à l'autre côté et lis la <b>dizaine</b> juste avant.</li><li>Compte les <b>petits traits</b> après cette dizaine (5 au trait moyen).</li><li>Contrôle : aigu → moins de 90° ; obtus → plus de 90°.</li></ol></div>
${figure({ P, prot: { O, rot: 0, R: 170 }, segs: [{ a: 'O', b: 'A', w: 3.2, c: '#7c2d12' }, { a: 'O', b: 'B', w: 3.2, c: '#7c2d12' }], arcs: [{ v: 'O', a: 'A', b: 'B', r: 24, kind: 'ask' }], lab: { O: -90 }, width: 460, aria: 'rapporteur, côté à gauche' })}
<div class="ex"><span class="q">Exemple 1 : le côté est à gauche</span><br>[OA) est à <b>gauche</b> : il passe par le 0 de la graduation <b style="color:#1d4ed8">bleue</b> (intérieure). On lit ${H('AOB')} = <b>60°</b> (et non 120°). Contrôle : aigu, 60 &lt; 90 ✓.</div>
${z}
<div class="ex"><span class="q">Exemple 2 : lire au degré près</span><br>L'autre côté tombe après le grand trait 40, sur le <b>3<sup>e</sup> petit trait</b> : 40 + 3 = <b>43°</b>. S'il tombait sur le trait moyen, ce serait 45°.</div>
<div class="warn">⚠️ Ne lis pas toujours la graduation extérieure ! Cherche d'abord <b>où est le 0</b>.<br>⚠️ Le rapporteur peut être un peu tourné : la règle ne change pas, on suit la graduation dont le 0 est sur un côté.<br>⚠️ Si tu trouves 120° pour un angle aigu, tu as lu l'autre graduation : la bonne réponse est 180° − 120° = 60°.</div>
<div class="retenir">À retenir : d'abord trouver le 0 sur un côté, ensuite lire, enfin contrôler aigu ou obtus.</div>`;
}

/* =========================================================================================
   5. Estimer un angle
   ========================================================================================= */
function L5(d) {
  const [a, b, c] = letters(d, 'ABC');
  const t = orient(d), m = d < 2 ? meas(10, 20, 170) : meas(5, 15, 175);
  const gap = d < 2 ? 40 : d < 4 ? 25 : 15;
  const vals = [m];
  if (chance(.5) && Math.abs(180 - 2 * m) >= gap) vals.push(180 - m);
  let guard = 0;
  while (vals.length < 4 && guard++ < 500) {
    const x = meas(5, 5, 180);
    if (vals.every(y => Math.abs(x - y) >= gap)) vals.push(x);
  }
  for (let x = 5; vals.length < 4; x += 5) if (vals.every(y => Math.abs(x - y) >= gap)) vals.push(x);
  vals.sort((x, y) => x - y);
  const B = [0, 0], P = { [a]: pol(B, 150, t), [b]: B, [c]: pol(B, 150, t + m) };
  return {
    type: 'choice', opts: vals.map(v => ({ v, l: `environ ${v}°` })),
    check: choiceCheck(m, { msg: v => ((+v - 90) * (m - 90) < 0 ? `Ton angle est ${m < 90 ? 'aigu' : 'obtus'} : sa mesure est ${m < 90 ? 'plus petite' : 'plus grande'} que 90°.` : `Tu es du bon côté de 90°. Compare aussi avec 45° (la moitié d'un angle droit) et 135°.`) }),
    html: `Sans rapporteur, estime la mesure de l'angle ${H(a + b + c)}.`,
    visual: figure({ P, segs: [[b, a], [b, c]], arcs: [{ v: b, a, b: c, r: 34, kind: 'ask', label: '?' }], aria: 'angle à estimer' }),
    hint: `Compare avec des angles repères : 90° (angle droit), 45° (la moitié), 180° (angle plat), 135° (90° + 45°).`,
    solution: `L'angle est ${nature(m)}${m !== 90 && m !== 180 ? ` ; il est proche de ${m < 68 ? '45°' : m < 113 ? '90°' : m < 158 ? '135°' : '180°'}` : ''}. Sa mesure est environ <b>${m}°</b>.`,
    verify: E => { const x = angleAt(P[a], B, P[c]); return close(x, E) && vals.every(v => v === E || Math.abs(v - x) >= gap - 1e-9); },
  };
}
function C5() {
  const O = [0, 0], P = { O }, segs = [], arcs = [], texts = [];
  [0, 45, 90, 135, 180].forEach((k, i) => { P['r' + i] = pol(O, 150, k); segs.push(['O', 'r' + i]); texts.push({ p: pol(O, 172, k), s: k + '°', fs: 15 }); });
  arcs.push({ v: O, d1: 0, span: 45, r: 40, kind: 'other' }, { v: O, d1: 90, span: 45, r: 40, kind: 'other' });
  const Q = { S: [0, 0], U: pol([0, 0], 150, 0), V: pol([0, 0], 150, 150), W: pol([0, 0], 135, 135) };
  return `<h2>5. Estimer un angle</h2>
<p class="intro">Estimer, c'est trouver « à peu près » la mesure sans rapporteur. C'est aussi le meilleur moyen de vérifier une mesure !</p>
<div class="def">Pour estimer un angle, on le compare à des <b>angles repères</b> : 45° (la moitié d'un angle droit), 90° (angle droit), 135° (90° + 45°), 180° (angle plat).</div>
<div class="methode"><b>Méthode</b><ol><li>Aigu ou obtus ? Cela élimine déjà la moitié des réponses.</li><li>De quel angle repère est-il le plus proche : 45°, 90°, 135° ou 180° ?</li><li>Un peu plus ou un peu moins que ce repère ? Choisis la mesure qui convient.</li></ol></div>
<div class="cols">${figure({ P, hide: Object.keys(P).filter(k => k !== 'O'), segs, arcs, texts, lab: { O: -90 }, width: 320, aria: 'angles repères' })}
${figure({ P: Q, hide: ['W'], segs: [['S', 'U'], ['S', 'V'], { a: 'S', b: 'W', c: '#a8a29e', w: 1.6 }], arcs: [{ v: 'S', a: 'U', b: 'V', r: 34, kind: 'ask', label: '?' }], texts: [{ p: pol([0, 0], 158, 128), s: '135°', fs: 14, c: '#78716c' }], lab: { S: -90 }, width: 300, aria: 'angle de 150 degrés comparé à 135 degrés' })}</div>
<div class="ex"><span class="q">Exemple 1 :</span><br>Un angle un peu plus ouvert que la moitié d'un angle droit mesure environ <b>50° ou 60°</b>, pas 20°, ni 100°.</div>
<div class="ex"><span class="q">Exemple 2 : choisir entre 30°, 70°, 110° et 150°</span><br>L'angle de la 2<sup>e</sup> figure est <b>obtus</b> : il reste 110° et 150°. Il dépasse nettement le repère gris de 135°, presque jusqu'à l'angle plat : c'est environ <b>150°</b>.</div>
<div class="warn">⚠️ Commence toujours par décider : aigu ou obtus ? Un angle obtus ne peut pas mesurer 40°.<br>⚠️ Ne confonds pas 30° et 150° : ils font 180° à eux deux, comme les deux graduations du rapporteur.</div>
<div class="retenir">À retenir : aigu ou obtus d'abord, puis comparer à 45°, 90°, 135° et 180°.</div>`;
}

/* =========================================================================================
   6. Angles adjacents
   ========================================================================================= */
function L6(d) {
  const [o, a, b, c] = letters(d, 'OABC');
  const st = stepOf(d, 2, 4), t = orient(d);
  let a1, a2;
  do { a1 = meas(st, 20, 100); a2 = meas(st, 20, 100); } while (a1 + a2 > 165);
  const O = [0, 0], P = { [o]: O, [a]: pol(O, 185, t), [b]: pol(O, 170, t + a1), [c]: pol(O, 185, t + a1 + a2) };
  const sum = !(d >= 2 && chance(.5));
  const arcs = [
    { v: o, a, b, r: 38, label: dg(a1) },
    { v: o, a: b, b: c, r: 38, kind: sum ? 'other' : 'ask', label: sum ? dg(a2) : '?' },
    { v: o, a, b: c, r: 125, fill: false, kind: sum ? 'ask' : 'other', label: sum ? '?' : dg(a1 + a2) },
  ];
  const visual = figure({ P, segs: [[o, a], [o, b], [o, c]], arcs, lab: { [o]: t + (a1 + a2) / 2 + 180 }, aria: 'angles adjacents' });
  if (sum) {
    return numQ({
      X: a1 + a2, tpl: `${H(a + o + c)} = {0} °`, visual, value: angleAt(P[a], O, P[c]),
      msg: x => (x === Math.abs(a1 - a2) ? `${H(a + o + c)} est formé des deux angles : il faut <b>additionner</b>.` : ''),
      html: `Les angles ${H(a + o + b)} et ${H(b + o + c)} sont adjacents. Calcule ${H(a + o + c)}.`,
      hint: `${H(a + o + c)} est « fait » des deux angles adjacents ${H(a + o + b)} et ${H(b + o + c)}, collés l'un à l'autre.`,
      solution: `${H(a + o + c)} = ${H(a + o + b)} + ${H(b + o + c)} = ${a1}° + ${a2}° = <b>${a1 + a2}°</b>.`,
      verify: E => close(angleAt(P[a], O, P[b]) + angleAt(P[b], O, P[c]), E[0]),
    });
  }
  return numQ({
    X: a2, tpl: `${H(b + o + c)} = {0} °`, visual, value: angleAt(P[b], O, P[c]),
    msg: x => (x === 2 * a1 + a2 ? `${H(b + o + c)} est une <b>partie</b> de ${H(a + o + c)} : il faut soustraire.` : ''),
    html: `Les angles ${H(a + o + b)} et ${H(b + o + c)} sont adjacents. ${H(a + o + c)} = ${a1 + a2}°. Calcule ${H(b + o + c)}.`,
    hint: `${H(a + o + c)} = ${H(a + o + b)} + ${H(b + o + c)}. Quel nombre faut-il ajouter à ${a1} pour obtenir ${a1 + a2} ?`,
    solution: `${H(b + o + c)} = ${H(a + o + c)} − ${H(a + o + b)} = ${a1 + a2}° − ${a1}° = <b>${a2}°</b>.`,
    verify: E => close(angleAt(P[a], O, P[c]) - angleAt(P[a], O, P[b]), E[0]),
  });
}
function C6() {
  const O = [0, 0], P = { O, A: pol(O, 185, 10), B: pol(O, 170, 55), C: pol(O, 185, 120) };
  const Q = { O, A: pol(O, 150, 0), B: pol(O, 150, 40), C: pol(O, 150, 95) };
  return `<h2>6. Angles adjacents</h2>
<p class="intro">Quand deux angles sont « collés » l'un à l'autre, leurs mesures s'additionnent, comme deux longueurs mises bout à bout.</p>
<div class="def">Deux angles sont <b>adjacents</b> s'ils ont :<br>• le <b>même sommet</b> ;<br>• un <b>côté commun</b> ;<br>• et s'ils sont <b>de part et d'autre</b> de ce côté commun (ils ne se chevauchent pas).<br>Alors la mesure du grand angle est la <b>somme</b> des deux mesures.</div>
<div class="methode"><b>Méthode</b><ol><li>Vérifie que les deux angles sont bien adjacents (même sommet, côté commun, pas de chevauchement).</li><li>On cherche le <b>grand</b> angle → on <b>additionne</b>.</li><li>On cherche un des <b>petits</b> angles → on fait grand angle <b>moins</b> l'autre petit angle.</li></ol></div>
<div class="cols">${figure({ P, segs: [['O', 'A'], ['O', 'B'], ['O', 'C']], arcs: [{ v: 'O', a: 'A', b: 'B', r: 38, label: '45°' }, { v: 'O', a: 'B', b: 'C', r: 38, kind: 'other', label: '65°' }, { v: 'O', a: 'A', b: 'C', r: 125, fill: false, kind: 'ask', label: '110°' }], lab: { O: 245 }, width: 320, aria: 'angles adjacents' })}
${figure({ P: Q, segs: [['O', 'A'], ['O', 'B'], ['O', 'C']], arcs: [{ v: 'O', a: 'A', b: 'B', r: 36 }, { v: 'O', a: 'A', b: 'C', r: 70, kind: 'ask', fill: false }], lab: { O: 225 }, width: 260, aria: 'angles qui se chevauchent' })}</div>
<div class="ex"><span class="q">Exemple 1 : le grand angle</span><br>${H('AOB')} et ${H('BOC')} sont adjacents (côté commun [OB)) : ${H('AOC')} = 45° + 65° = <b>110°</b>.</div>
<div class="ex"><span class="q">Exemple 2 : un petit angle</span><br>On sait que ${H('AOC')} = 110° et ${H('AOB')} = 45°. Alors ${H('BOC')} = 110° − 45° = <b>65°</b>.<br>Contrôle : 45 + 65 = 110 ✓.</div>
<div class="warn">⚠️ Sur la 2<sup>e</sup> figure, ${H('AOB')} et ${H('AOC')} ne sont <b>pas</b> adjacents : ils se chevauchent (${H('AOB')} est à l'intérieur de ${H('AOC')}).<br>⚠️ Si on cherche une <b>partie</b>, il faut soustraire, pas additionner : additionner donnerait un angle plus grand que le tout !</div>
<div class="retenir">À retenir : grand angle = petit angle + petit angle.</div>`;
}

/* =========================================================================================
   7. Complémentaires et supplémentaires
   ========================================================================================= */
function L7(d) {
  const comp = d < 2 ? true : chance(.5), st = stepOf(d, 1, 3), tot = comp ? 90 : 180;
  const sep = d >= 3 && chance(.4); // deux angles séparés, énoncé en texte
  const x = comp ? meas(st, 15, 75) : meas(st, 20, 160), X = tot - x;
  const msg = y => (y === (comp ? 180 : 90) - x ? CONFUS : '');
  const word = comp ? 'complémentaires' : 'supplémentaires';
  const hint = `Deux angles ${word} ont une somme de <b>${tot}°</b>${comp ? ' (un angle droit)' : ' (un angle plat)'}.`;
  if (sep) {
    const [a, b, c, e, f, g] = letters(d, 'ABCDEF');
    const t1 = ri(0, 180 - x), t2 = ri(0, 180 - X), Q1 = [0, 0], Q2 = [300, 0];
    let P = { [a]: pol(Q1, 115, t1), [b]: Q1, [c]: pol(Q1, 115, t1 + x), [e]: pol(Q2, 115, t2), [f]: Q2, [g]: pol(Q2, 115, t2 + X) };
    if (d >= 4) P = rotAll(P, ri(-25, 25));
    return numQ({
      X, tpl: `${H(e + f + g)} = {0} °`, msg, value: angleAt(P[e], P[f], P[g]),
      html: `Les angles ${H(a + b + c)} et ${H(e + f + g)} sont <b>${word}</b>. ${H(a + b + c)} = ${x}°. Calcule ${H(e + f + g)}.`,
      visual: figure({ P, segs: [[b, a], [b, c], [f, e], [f, g]], arcs: [{ v: b, a, b: c, r: 30, label: dg(x) }, { v: f, a: e, b: g, r: 30, kind: 'ask', label: '?' }], aria: 'deux angles' }),
      hint, solution: `${H(a + b + c)} + ${H(e + f + g)} = ${tot}°, donc ${H(e + f + g)} = ${tot}° − ${x}° = <b>${X}°</b>.`,
      verify: E => close(angleAt(P[a], P[b], P[c]) + E[0], tot) && close(angleAt(P[e], P[f], P[g]), E[0]),
    });
  }
  const [o, a, b, c] = letters(d, 'OABC');
  const t = orient(d), O = [0, 0];
  const P = { [o]: O, [a]: pol(O, 150, t), [b]: pol(O, 160, t + x), [c]: pol(O, 150, t + tot) };
  return numQ({
    X, tpl: `${H(b + o + c)} = {0} °`, msg, value: angleAt(P[b], O, P[c]),
    html: comp ? `L'angle ${H(a + o + c)} est droit. Calcule ${H(b + o + c)}.` : `Les points ${a}, ${o} et ${c} sont alignés. Calcule ${H(b + o + c)}.`,
    visual: figure({ P, segs: [[o, a], [o, b], [o, c]], arcs: [{ v: o, a, b, r: 40, label: dg(x) }, { v: o, a: b, b: c, r: 40, kind: 'ask', label: '?' }], rights: comp ? [{ v: o, a, b: c, size: 14 }] : [], lab: { [o]: t + tot / 2 + 180 }, aria: comp ? 'angle droit partagé' : 'angle plat partagé' }),
    hint: hint + ` Les angles ${H(a + o + b)} et ${H(b + o + c)} sont ${word}.`,
    solution: `${comp ? `${H(a + o + c)} est droit` : `${H(a + o + c)} est plat`}, donc ${H(a + o + b)} + ${H(b + o + c)} = ${tot}° : ils sont ${word}.<br>${H(b + o + c)} = ${tot}° − ${x}° = <b>${X}°</b>.`,
    verify: E => close(angleAt(P[a], O, P[b]) + E[0], angleAt(P[a], O, P[c])) && close(angleAt(P[a], O, P[c]), tot),
  });
}
function C7() {
  const O = [0, 0], Q = [320, 0];
  const P = { A: pol(O, 120, 0), O, B: pol(O, 125, 35), C: pol(O, 120, 90), D: pol(Q, 120, 0), E: Q, F: pol(Q, 125, 50), G: pol(Q, 120, 180) };
  return `<h2>7. Complémentaires et supplémentaires</h2>
<p class="intro">Deux mots à bien retenir : ils disent quelle est la <b>somme</b> de deux angles, et permettent de trouver l'un quand on connaît l'autre.</p>
<div class="def">• Deux angles sont <b>complémentaires</b> si leur somme vaut <b>90°</b> (un angle droit).<br>• Deux angles sont <b>supplémentaires</b> si leur somme vaut <b>180°</b> (un angle plat).<br>Ils peuvent être côte à côte… ou séparés : seule la somme compte.</div>
${figure({ P, segs: [['O', 'A'], ['O', 'B'], ['O', 'C'], ['E', 'D'], ['E', 'F'], ['E', 'G']], arcs: [{ v: 'O', a: 'A', b: 'B', r: 36, label: '35°' }, { v: 'O', a: 'B', b: 'C', r: 36, kind: 'ask', label: '55°' }, { v: 'E', a: 'D', b: 'F', r: 36, label: '50°' }, { v: 'E', a: 'F', b: 'G', r: 36, kind: 'ask', label: '130°' }], rights: [{ v: 'O', a: 'A', b: 'C', size: 14 }], lab: { O: 225, E: -90 }, width: 520, aria: 'angles complémentaires et supplémentaires' })}
<div class="methode"><b>Méthode</b><ol><li>Trouve le total : angle <b>droit</b> partagé ou mot « complémentaires » → <b>90°</b> ; points <b>alignés</b> ou mot « supplémentaires » → <b>180°</b>.</li><li>Angle cherché = total − angle connu.</li><li>Vérifie : la somme des deux angles redonne bien le total.</li></ol></div>
<div class="ex"><span class="q">Exemple 1 : sur la figure</span><br>${H('AOC')} est droit, donc ${H('AOB')} et ${H('BOC')} sont complémentaires : ${H('BOC')} = 90° − 35° = <b>55°</b>.<br>D, E et G sont alignés : ${H('FEG')} = 180° − 50° = <b>130°</b>.</div>
<div class="ex"><span class="q">Exemple 2 : deux angles séparés</span><br>${H('KLM')} et ${H('RST')} sont supplémentaires, avec ${H('KLM')} = 47°. Ils n'ont pas le même sommet, mais leur somme vaut 180° : ${H('RST')} = 180° − 47° = <b>133°</b>.</div>
<div class="warn">⚠️ Ne confonds pas : <b>complémentaire → 90°</b>, <b>supplémentaire → 180°</b>. Astuce : « <b>s</b>upplémentaire » comme « <b>s</b>omme plus grande ».<br>⚠️ Un angle obtus n'a pas de complémentaire (il dépasse déjà 90°).</div>
<div class="retenir">À retenir : complémentaires → somme 90° ; supplémentaires → somme 180°.</div>`;
}

/* =========================================================================================
   8. Angles opposés par le sommet
   ========================================================================================= */
function L8(d) {
  const [o, a, b, c, e] = letters(d, 'OABCD');
  const st = stepOf(d, 1, 4), x = meas(st, 30, 150), t = orient(d), O = [0, 0];
  const P = { [o]: O, [a]: pol(O, 140, t), [b]: pol(O, 140, t + 180), [c]: pol(O, 130, t + x), [e]: pol(O, 130, t + x + 180) };
  // angles autour de O : AOC (donné), COB, BOD (opposé), DOA
  const sect = [[a, c], [c, b], [b, e], [e, a]];
  const k = d < 2 ? 2 : pick([1, 2, 3]);
  const opp = k === 2, X = opp ? x : 180 - x, [p, q] = sect[k];
  const free = [1, 2, 3].find(i => i !== k), mids = [t + x / 2, t + x + (180 - x) / 2, t + 180 + x / 2, t + 180 + x + (180 - x) / 2];
  const nm = p + o + q;
  return numQ({
    X, tpl: `${H(nm)} = {0} °`, value: angleAt(P[p], O, P[q]),
    msg: y => (opp && y === 180 - x ? `${H(nm)} et ${H(a + o + c)} sont <b>opposés par le sommet</b> : ils ont la même mesure.` : !opp && y === x ? `${H(nm)} et ${H(a + o + c)} ne sont pas opposés : ils sont adjacents et forment un angle plat.` : ''),
    html: `Les droites (${a}${b}) et (${c}${e}) se coupent en ${o}. ${H(a + o + c)} = ${x}°. Calcule ${H(nm)}.`,
    visual: figure({ P, segs: [[a, b], [c, e]], arcs: [{ v: o, a, b: c, r: 34, label: dg(x) }, { v: o, a: p, b: q, r: 34, kind: 'ask', label: '?' }], lab: { [o]: mids[free] }, aria: 'deux droites sécantes' }),
    hint: opp ? `Deux angles <b>opposés par le sommet</b> (en face l'un de l'autre, de part et d'autre du sommet) ont la même mesure.` : `${H(a + o + c)} et ${H(nm)} sont côte à côte sur une droite : ils forment un angle plat (180°).`,
    solution: opp ? `${H(nm)} et ${H(a + o + c)} sont opposés par le sommet, donc ils ont la même mesure : ${H(nm)} = <b>${x}°</b>.`
      : `${H(nm)} et ${H(a + o + c)} sont adjacents et leurs côtés extérieurs forment une droite : ils sont supplémentaires.<br>${H(nm)} = 180° − ${x}° = <b>${180 - x}°</b>.`,
    verify: E => close(angleAt(P[p], O, P[q]), E[0]) && close(angleAt(P[a], O, P[b]), 180),
  });
}
function C8() {
  const O = [0, 0], P = { O, A: pol(O, 130, 10), B: pol(O, 130, 190), C: pol(O, 120, 70), D: pol(O, 120, 250) };
  return `<h2>8. Angles opposés par le sommet</h2>
<p class="intro">Deux droites qui se croisent forment quatre angles. Il suffit d'en connaître un pour trouver les trois autres !</p>
<div class="def">Deux angles <b>opposés par le sommet</b> ont le même sommet et leurs côtés dans le prolongement l'un de l'autre (ils sont « en face » l'un de l'autre).<br><b>Propriété</b> : deux angles opposés par le sommet ont la <b>même mesure</b>.</div>
<div class="cols">${figure({ P, segs: [['A', 'B'], ['C', 'D']], arcs: [{ v: 'O', a: 'A', b: 'C', r: 44, label: '60°' }, { v: 'O', a: 'B', b: 'D', r: 44, label: '60°' }, { v: 'O', a: 'C', b: 'B', r: 44, kind: 'ask', n: 2, label: '120°' }, { v: 'O', a: 'D', b: 'A', r: 44, kind: 'ask', n: 2, label: '120°' }], lab: { O: 160 }, width: 340, aria: 'deux droites sécantes' })}
<div class="methode"><b>Méthode</b><ol><li>Repère l'angle connu et l'angle cherché.</li><li>Ils sont <b>en face</b> l'un de l'autre → <b>même mesure</b>.</li><li>Ils sont <b>côte à côte</b> le long d'une des droites → ils forment un angle plat : angle cherché = <b>180° − angle connu</b>.</li></ol></div></div>
<div class="ex"><span class="q">Exemple 1 : opposés</span><br>${H('AOC')} et ${H('BOD')} sont opposés par le sommet : ${H('BOD')} = ${H('AOC')} = <b>60°</b>.</div>
<div class="ex"><span class="q">Exemple 2 : côte à côte</span><br>${H('COB')} est à côté de ${H('AOC')}, et A, O, B sont alignés : ${H('COB')} = 180° − 60° = <b>120°</b>. Puis ${H('DOA')}, opposé à ${H('COB')}, mesure aussi 120°.<br>Contrôle : 60 + 120 + 60 + 120 = 360 (un tour complet) ✓.</div>
<div class="warn">⚠️ Deux angles <b>côte à côte</b> le long d'une droite ne sont pas égaux (sauf s'ils sont droits) : ils sont <b>supplémentaires</b>.<br>⚠️ Les angles opposés sont ceux qui ne se touchent que par le sommet.</div>
<div class="retenir">À retenir : en face → égaux ; côte à côte sur une droite → somme 180°.</div>`;
}

/* =========================================================================================
   9. Somme des angles d'un triangle
   ========================================================================================= */
function triangle(x, y, t) {
  const A = [0, 0], B = [220, 0], C = inter(A, x, B, 180 - y).P;
  return rotAll({ A, B, C }, t);
}
function L9(d) {
  const [a, b, c] = letters(d, 'ABC'), st = stepOf(d, 1, 3), t = orient(d);
  let x, y; do { x = meas(st, 25, 125); y = meas(st, 25, 125); } while (180 - x - y < 25);
  const T = triangle(x, y, t), P = { [a]: T.A, [b]: T.B, [c]: T.C }, X = 180 - x - y;
  return numQ({
    X, tpl: `${H(a + c + b)} = {0} °`, value: angleAt(P[a], P[c], P[b]),
    msg: v => (v === 180 - x || v === 180 - y ? `Tu n'as enlevé qu'un seul angle : il faut enlever les <b>deux</b> angles connus.` : v === x + y ? `${x} + ${y} = ${x + y}, mais l'angle cherché est ce qui <b>manque</b> pour aller jusqu'à 180°.` : ''),
    html: `Dans le triangle ${a}${b}${c}, ${H(b + a + c)} = ${x}° et ${H(a + b + c)} = ${y}°. Calcule ${H(a + c + b)}.`,
    visual: figure({ P, segs: [[a, b], [b, c], [c, a]], arcs: [{ v: a, a: b, b: c, r: 30, label: dg(x) }, { v: b, a: c, b: a, r: 30, label: dg(y) }, { v: c, a, b, r: 30, kind: 'ask', label: '?' }], aria: 'triangle' }),
    hint: `Dans un triangle, la somme des trois angles vaut toujours <b>180°</b>. Additionne les deux angles connus, puis cherche ce qui manque.`,
    solution: `${x}° + ${y}° = ${x + y}°, donc ${H(a + c + b)} = 180° − ${x + y}° = <b>${X}°</b>.`,
    verify: E => close(angleAt(P[b], P[a], P[c]) + angleAt(P[a], P[b], P[c]) + E[0], 180) && close(angleAt(P[a], P[c], P[b]), E[0]),
  });
}
function C9() {
  const T = triangle(70, 50, 0), Z = [0, 0];
  return `<h2>9. Somme des angles d'un triangle</h2>
<p class="intro">Les trois angles d'un triangle ne sont pas « libres » : si on en connaît deux, on peut calculer le troisième.</p>
<div class="def"><b>Propriété</b> : dans <b>tout</b> triangle, la somme des mesures des trois angles est égale à <b>180°</b>.</div>
<div class="cols">${figure({ P: T, segs: [['A', 'B'], ['B', 'C'], ['C', 'A']], arcs: [{ v: 'A', a: 'B', b: 'C', r: 30, label: '70°' }, { v: 'B', a: 'C', b: 'A', r: 30, kind: 'other', label: '50°' }, { v: 'C', a: 'A', b: 'B', r: 30, kind: 'ask', label: '?' }], width: 300, aria: 'triangle' })}
${figure({ P: { Z, u: pol(Z, 130, 0), v: pol(Z, 130, 70), w: pol(Z, 130, 130), x: pol(Z, 130, 180) }, hide: ['Z', 'u', 'v', 'w', 'x'], segs: [['Z', 'u'], ['Z', 'v'], ['Z', 'w'], ['Z', 'x']], arcs: [{ v: Z, d1: 0, span: 70, r: 50, label: '70°' }, { v: Z, d1: 70, span: 60, r: 50, kind: 'ask', label: '60°' }, { v: Z, d1: 130, span: 50, r: 50, kind: 'other', label: '50°' }], width: 300, aria: 'les trois angles mis côte à côte forment un angle plat' })}</div>
<p>Pourquoi ? Si on découpe les trois coins d'un triangle en papier et qu'on les met côte à côte (à droite), ils forment un <b>angle plat</b>.</p>
<div class="methode"><b>Méthode</b><ol><li>Additionne les <b>deux</b> angles connus.</li><li>Angle cherché = 180° − cette somme.</li><li>Vérifie : les trois angles font bien 180°.</li></ol></div>
<div class="ex"><span class="q">Exemple 1 :</span><br>${H('BAC')} = 70° et ${H('ABC')} = 50°.<br>70° + 50° = 120°, donc ${H('ACB')} = 180° − 120° = <b>60°</b>.</div>
<div class="ex"><span class="q">Exemple 2 : avec un angle obtus</span><br>Dans le triangle DEF, ${H('EDF')} = 105° et ${H('DEF')} = 38°.<br>105° + 38° = 143°, donc ${H('DFE')} = 180° − 143° = <b>37°</b>. Contrôle : 105 + 38 + 37 = 180 ✓.</div>
<div class="warn">⚠️ Il faut enlever les <b>deux</b> angles connus de 180°, pas un seul.<br>⚠️ N'additionne pas les deux angles connus pour répondre : l'angle cherché, c'est ce qui <b>manque</b> pour aller jusqu'à 180°.</div>
<div class="retenir">À retenir : dans un triangle, angle 1 + angle 2 + angle 3 = 180°.</div>`;
}

/* =========================================================================================
   10. Triangles isocèle, équilatéral, rectangle
   ========================================================================================= */
function L10(d) {
  const [a, b, c] = letters(d, 'ABC'), t = orient(d), st = d < 2 ? 10 : d < 4 ? 5 : 1;
  const kinds = d < 2 ? ['rect', 'isoApex'] : d < 3 ? ['rect', 'isoApex', 'isoBase'] : ['rect', 'isoApex', 'isoBase', 'isoBase', 'equi'];
  const k = pick(kinds), codes = d >= 4;
  let P, X, html, ticks = [], rights = [], arcs, hint, solution, ask, msg = () => '', given = 0;
  if (k === 'rect') {
    const x = meas(st, 20, 70); given = x;
    P = rotAll({ [c]: [0, 0], [a]: [250 * Math.cos(x * Math.PI / 180), 0], [b]: [0, 250 * Math.sin(x * Math.PI / 180)] }, t);
    X = 90 - x; ask = [a, b, c]; rights = [{ v: c, a, b }];
    arcs = [{ v: a, a: b, b: c, r: 32, label: dg(x) }, { v: b, a, b: c, r: 32, kind: 'ask', label: '?' }];
    html = `${codes ? `Observe les codages.` : `Le triangle ${a}${b}${c} est rectangle en ${c}.`} ${H(b + a + c)} = ${x}°. Calcule ${H(a + b + c)}.`;
    hint = `L'angle droit mesure 90°. La somme des trois angles vaut 180° : il reste 90° pour les deux autres angles.`;
    solution = `Le triangle est rectangle en ${c} : ${H(a + c + b)} = 90°. Donc ${H(a + b + c)} = 180° − 90° − ${x}° = <b>${X}°</b> (les deux angles aigus sont complémentaires).`;
    msg = v => (v === 180 - x ? `N'oublie pas l'<b>angle droit</b> : il mesure déjà 90°.` : '');
  } else if (k === 'isoApex') {
    const y = meas(st, 30, 75); given = y;
    P = rotAll({ [b]: [0, 0], [c]: [400 * Math.cos(y * Math.PI / 180), 0], [a]: pol([0, 0], 200, y) }, t);
    X = 180 - 2 * y; ask = [b, a, c]; ticks = [{ a, b }, { a, b: c }];
    arcs = [{ v: b, a: c, b: a, r: 30, label: dg(y) }, { v: a, a: b, b: c, r: 30, kind: 'ask', label: '?' }];
    html = `${codes ? `Observe les codages.` : `Le triangle ${a}${b}${c} est isocèle en ${a}.`} ${H(a + b + c)} = ${y}°. Calcule ${H(b + a + c)}.`;
    hint = `Dans un triangle isocèle, les deux angles <b>à la base</b> sont égaux : ${H(a + c + b)} = ${H(a + b + c)}. Puis utilise la somme 180°.`;
    solution = `Isocèle en ${a} : ${H(a + c + b)} = ${H(a + b + c)} = ${y}°. Donc ${H(b + a + c)} = 180° − ${y}° − ${y}° = <b>${X}°</b>.`;
    msg = v => (v === 180 - y ? `Les <b>deux</b> angles à la base mesurent ${y}° : il faut enlever ${y}° deux fois.` : '');
  } else if (k === 'isoBase') {
    const x = 2 * meas(st === 10 ? 10 : st, 10, 70); given = x; // angle au sommet pair → base entière
    P = rotAll({ [a]: [0, 0], [b]: pol([0, 0], 190, -90 - x / 2), [c]: pol([0, 0], 190, -90 + x / 2) }, t);
    X = (180 - x) / 2; ask = [a, b, c]; ticks = [{ a, b }, { a, b: c }];
    arcs = [{ v: a, a: b, b: c, r: 30, label: dg(x) }, { v: b, a, b: c, r: 30, kind: 'ask', label: '?' }];
    html = `${codes ? `Observe les codages.` : `Le triangle ${a}${b}${c} est isocèle en ${a}.`} ${H(b + a + c)} = ${x}°. Calcule ${H(a + b + c)}.`;
    hint = `Il reste 180° − ${x}° pour les deux angles à la base, qui sont <b>égaux</b> : partage en deux.`;
    solution = `180° − ${x}° = ${180 - x}° pour les deux angles à la base, égaux car le triangle est isocèle en ${a}.<br>${H(a + b + c)} = ${180 - x}° ÷ 2 = <b>${X}°</b>.`;
    msg = v => (v === 180 - x ? `Ce reste est partagé entre les <b>deux</b> angles à la base : divise par 2.` : '');
  } else {
    P = rotAll({ [a]: pol([0, 0], 120, 90), [b]: pol([0, 0], 120, 210), [c]: pol([0, 0], 120, 330) }, t);
    X = 60; ask = [a, b, c]; ticks = [{ a, b }, { a: b, b: c }, { a: c, b: a }];
    arcs = [{ v: b, a, b: c, r: 30, kind: 'ask', label: '?' }];
    html = `${codes ? `Observe les codages.` : `Le triangle ${a}${b}${c} est équilatéral.`} Calcule ${H(a + b + c)}.`;
    hint = `Un triangle équilatéral a ses trois angles égaux, et leur somme vaut 180°.`;
    solution = `Les trois angles sont égaux : ${H(a + b + c)} = 180° ÷ 3 = <b>60°</b>.`;
  }
  const [p, q, r] = ask;
  return numQ({
    X, tpl: `${H(p + q + r)} = {0} °`, msg, value: angleAt(P[p], P[q], P[r]), html, hint, solution,
    visual: figure({ P, segs: [[a, b], [b, c], [c, a]], arcs, ticks, rights, aria: 'triangle particulier' }),
    verify: E => {
      const A = angleAt(P[b], P[a], P[c]), B = angleAt(P[a], P[b], P[c]), C = angleAt(P[a], P[c], P[b]);
      const okSum = close(A + B + C, 180), got = angleAt(P[p], P[q], P[r]);
      const okKind = k === 'rect' ? close(C, 90) && close(A, given) : k === 'equi' ? close(A, B) && close(B, C) : close(B, C);
      return okSum && okKind && close(got, E[0]);
    },
  });
}
function C10() {
  const P = { A: [70, 120], B: [0, 0], C: [140, 0], D: [220, 0], E: [360, 0], F: [220, 98] /* angle en E ≈ 35°, comme dans l'exemple 1 */, G: [430, 0], H: [570, 0], K: [500, 121.24] };
  return `<h2>10. Triangles particuliers</h2>
<p class="intro">Dans un triangle particulier, les <b>codages</b> donnent des angles « gratuits » : il en faut alors moins pour tout calculer.</p>
<div class="def">• <b>Isocèle</b> en A (AB = AC) : les deux angles <b>à la base</b> ${H('ABC')} et ${H('ACB')} sont égaux.<br>• <b>Équilatéral</b> (trois côtés égaux) : trois angles de <b>60°</b>.<br>• <b>Rectangle</b> en D : un angle de 90°, les deux autres sont <b>complémentaires</b> (somme 90°).</div>
${figure({ P, segs: [['A', 'B'], ['B', 'C'], ['C', 'A'], ['D', 'E'], ['E', 'F'], ['F', 'D'], ['G', 'H'], ['H', 'K'], ['K', 'G']], ticks: [{ a: 'A', b: 'B' }, { a: 'A', b: 'C' }, { a: 'G', b: 'H', n: 2 }, { a: 'H', b: 'K', n: 2 }, { a: 'K', b: 'G', n: 2 }], rights: [{ v: 'D', a: 'E', b: 'F' }], arcs: [{ v: 'B', a: 'C', b: 'A', r: 24 }, { v: 'C', a: 'A', b: 'B', r: 24 }], width: 560, aria: 'triangles isocèle, rectangle et équilatéral' })}
<div class="methode"><b>Méthode</b><ol><li>Lis les <b>codages</b> : petits traits = côtés égaux ; petit carré = angle droit.</li><li>Isocèle : repère le <b>sommet principal</b> (entre les deux côtés égaux) ; les deux autres angles sont égaux.</li><li>Écris ce que tu sais, puis utilise la somme <b>180°</b>.</li></ol></div>
<div class="ex"><span class="q">Exemple 1 : rectangle</span><br>DEF rectangle en D avec ${H('DEF')} = 35° : ${H('DFE')} = 180° − 90° − 35° = <b>55°</b> (ou 90° − 35°).</div>
<div class="ex"><span class="q">Exemple 2 : isocèle, angle à la base connu</span><br>Isocèle en A avec ${H('ABC')} = 50° : ${H('ACB')} = 50° aussi, et ${H('BAC')} = 180° − 50° − 50° = <b>80°</b>.</div>
<div class="ex"><span class="q">Exemple 3 : isocèle, angle au sommet connu</span><br>Isocèle en A avec ${H('BAC')} = 40° : il reste 180° − 40° = 140° pour les deux angles à la base, égaux : 140° ÷ 2 = <b>70°</b> chacun.</div>
<div class="warn">⚠️ Les angles égaux d'un triangle isocèle sont ceux <b>à la base</b>, pas celui du sommet principal.<br>⚠️ Pour un angle à la base, pense à <b>diviser par 2</b>. Pour l'angle au sommet, enlève l'angle à la base <b>deux fois</b>.<br>⚠️ N'oublie pas l'angle droit : il compte déjà pour 90°.</div>
<div class="retenir">À retenir : isocèle → 2 angles égaux ; équilatéral → 3 × 60° ; rectangle → les 2 autres font 90°.</div>`;
}

/* =========================================================================================
   11 et 12. Deux droites et une sécante
   ========================================================================================= */
/**
 * Droites (d₁) passant par E (direction r0) et (d₂) passant par F (direction r0 + delta), sécante (EF) de direction r0 + s.
 * Secteurs en V ∈ {E, F} : q = 0 [u, w], 1 [w, −u], 2 [−u, −w], 3 [−w, u] (u : direction de la droite, w : de la sécante).
 */
function secante(d, delta = 0) {
  const r0 = d >= 3 ? ri(-40, 40) : d >= 1 ? ri(-20, 20) : 0, st = d < 1 ? 10 : d < 3 ? 5 : 1;
  let s; do { s = meas(st, 40, 140); } while (Math.abs(s - 90) < 15);
  const E = [0, 0], gap = 130, F = pol(E, gap / Math.sin(s * Math.PI / 180), r0 + s);
  const c = ((F[0] - E[0]) * Math.cos(r0 * Math.PI / 180) + (F[1] - E[1]) * Math.sin(r0 * Math.PI / 180)) / 2, half = 200;
  const pts = {
    E, F, L1m: pol(E, c - half, r0), L1p: pol(E, c + half, r0), L2m: pol(F, -c - half, r0 + delta), L2p: pol(F, -c + half, r0 + delta),
    S1: pol(E, -85, r0 + s), S2: pol(F, 85, r0 + s),
  };
  // points qui portent les côtés de chaque secteur
  const B = { E: [pts.L1p, pts.F, pts.L1m, pts.S1], F: [pts.L2p, pts.S2, pts.L2m, pts.E] };
  const sector = (V, q) => ({ v: pts[V], a: B[V][q], b: B[V][(q + 1) % 4] });
  /** mesure « calculée » (arithmétique) d'un secteur */
  const arith = (V, q) => { const m = V === 'E' ? s : s - delta; return q % 2 === 0 ? m : 180 - m; };
  /** mesure recalculée avec atan2 */
  const geo = (V, q) => { const S = sector(V, q); return angleAt(S.a, S.v, S.b); };
  const lines = [{ a: pts.L1m, b: pts.L1p, label: '(d₁)' }, { a: pts.L2m, b: pts.L2p, label: '(d₂)' }, { a: pts.S1, b: pts.S2, label: '(d)', c: '#44403c', side: -1 }];
  return { pts, s, r0, sector, arith, geo, lines };
}
const REL = (qE, qF) => (qE === qF ? 'corr' : qE <= 1 && qF === qE + 2 ? 'alt' : qE >= 2 && qF === qE - 2 ? 'altext' : 'supp');
function L11(d) {
  const S = secante(d);
  let qE, qF;
  if (d < 2) { if (chance(.5)) { qE = ri(0, 1); qF = qE + 2; } else { qE = ri(0, 3); qF = qE; } }
  else { qE = ri(0, 3); qF = ri(0, 3); }
  const givenAtE = d < 1 || chance(.5);
  const G = givenAtE ? ['E', qE] : ['F', qF], A = givenAtE ? ['F', qF] : ['E', qE];
  const g = S.arith(...G), X = S.arith(...A), rel = REL(qE, qF);
  const arcs = [{ ...S.sector(...G), r: 30, label: dg(g) }, { ...S.sector(...A), r: 30, kind: 'ask', label: '?' }];
  const relTxt = { corr: 'correspondants', alt: 'alternes-internes' }[rel];
  const corrAsk = S.sector(A[0], G[1]);
  return numQ({
    X, tpl: `? = {0} °`, value: S.geo(...A),
    msg: v => (v === 180 - X && X !== 90 ? (X === g ? `Ces deux angles sont ${relTxt || 'égaux'} : avec des droites parallèles, ils ont la <b>même mesure</b>.` : `Regarde mieux : l'angle « ? » n'est pas égal à l'angle de ${g}°, il forme un angle plat avec un angle qui lui est égal.`) : ''),
    html: `Les droites (d₁) et (d₂) sont <b>parallèles</b>, coupées par la sécante (d). Calcule la mesure de l'angle marqué « ? ».`,
    visual: figure({ lines: S.lines, arcs, aria: 'deux droites parallèles et une sécante' }),
    hint: rel === 'corr' ? `Les deux angles sont à la <b>même place</b> à chaque intersection : ils sont correspondants.`
      : rel === 'alt' ? `Les deux angles sont <b>entre</b> les parallèles et de part et d'autre de la sécante : ils sont alternes-internes.`
        : `Cherche d'abord, à l'intersection de l'angle « ? », l'angle <b>correspondant</b> à l'angle de ${g}°. Puis compare-le avec « ? ».`,
    solution: rel === 'corr' ? `Les angles sont <b>correspondants</b> et les droites sont parallèles, donc ils ont la même mesure : ? = <b>${X}°</b>.`
      : rel === 'alt' ? `Les angles sont <b>alternes-internes</b> et les droites sont parallèles, donc ils ont la même mesure : ? = <b>${X}°</b>.`
        : rel === 'altext' ? `L'angle correspondant à l'angle de ${g}° mesure aussi ${g}° ; il est <b>opposé par le sommet</b> à l'angle « ? ». Donc ? = <b>${X}°</b>.`
          : `L'angle correspondant à l'angle de ${g}° mesure aussi ${g}° (droites parallèles). Il forme un angle plat avec l'angle « ? » : ? = 180° − ${g}° = <b>${X}°</b>.`,
    verify: E => close(S.geo(...A), E[0]) && close(S.geo(...G), g) && close(angleAt(corrAsk.a, corrAsk.v, corrAsk.b), g),
  });
}
function C11() {
  // figures de démonstration fixes (pas d'aléatoire dans un cours)
  const s = 60, E = [0, 0], F = pol(E, 130 / Math.sin(Math.PI / 3), s), c = F[0] / 2;
  const L1m = pol(E, c - 200, 0), L1p = pol(E, c + 200, 0), L2m = pol(F, -c - 200, 0), L2p = pol(F, -c + 200, 0), S1 = pol(E, -85, s), S2 = pol(F, 85, s);
  const lines = [{ a: L1m, b: L1p, label: '(d₁)' }, { a: L2m, b: L2p, label: '(d₂)' }, { a: S1, b: S2, label: '(d)', side: -1, c: '#44403c' }];
  const eight = V => [[0, 60, 'given', '60°'], [60, 120, 'other', '120°'], [180, 60, 'given', '60°'], [240, 120, 'other', '120°']].map(([d1, span, kind, label]) => ({ v: V, d1, span, r: 26, kind, label }));
  return `<h2>11. Alternes-internes et correspondants</h2>
<p class="intro">Quand une droite coupe deux droites <b>parallèles</b>, beaucoup d'angles sont égaux. On apprend à les repérer par leur position.</p>
<div class="def">Deux droites (d₁) et (d₂) coupées par une <b>sécante</b> (d) forment 8 angles.<br>• <b>Alternes-internes</b> : <b>entre</b> (d₁) et (d₂), et <b>de part et d'autre</b> de (d).<br>• <b>Correspondants</b> : à la <b>même place</b> à chaque intersection.<br><b>Propriété</b> : si (d₁) et (d₂) sont <b>parallèles</b>, deux angles alternes-internes ont la même mesure, et deux angles correspondants aussi.</div>
${figure({ lines, arcs: [{ v: E, a: L1p, b: F, r: 30, label: '60°' }, { v: F, a: L2m, b: E, r: 30, kind: 'ask', label: '60°' }, { v: F, a: L2p, b: S2, r: 30, kind: 'other', label: '60°' }], width: 440, aria: 'angles alternes-internes et correspondants' })}
<div class="methode"><b>Méthode</b><ol><li>Regarde la place de chaque angle : entre les parallèles ou dehors ? à gauche ou à droite de la sécante ?</li><li>Même place aux deux intersections → <b>correspondants</b> → égaux.</li><li>Entre les parallèles et de part et d'autre de (d) → <b>alternes-internes</b> → égaux.</li><li>Sinon, passe par un angle intermédiaire : l'angle correspondant, puis un angle <b>opposé par le sommet</b> (égal) ou un angle <b>supplémentaire</b> (180° − …).</li></ol></div>
<div class="ex"><span class="q">Exemple 1 : la première figure</span><br>Orange et bleu : alternes-internes. Orange et vert : correspondants. Les droites sont parallèles, donc ils mesurent tous <b>60°</b>.</div>
${figure({ lines, arcs: [...eight(E), ...eight(F)], width: 440, aria: 'les huit angles' })}
<div class="ex"><span class="q">Exemple 2 : un angle « ni l'un ni l'autre »</span><br>Avec des parallèles, les 8 angles ne prennent que <b>deux</b> valeurs : 60° (orange) et 180° − 60° = <b>120°</b> (vert). Un angle vert et un angle orange sont supplémentaires.</div>
<div class="warn">⚠️ Ces égalités ne sont vraies <b>que si les droites sont parallèles</b>.<br>⚠️ Un angle aigu et un angle obtus ne peuvent pas être égaux : si tu trouves 60° pour un angle obtus, c'est 180° − 60° = 120°.</div>
<div class="retenir">À retenir : avec deux parallèles, alternes-internes et correspondants sont égaux ; tous les angles valent x ou 180° − x.</div>`;
}

function L12(d) {
  const v = d < 2 ? 'par' : pick(d < 3 ? ['par', 'quad', 'ext'] : ['par', 'quad', 'ext', 'poly', 'iso']);
  if (v === 'par') {
    const par = chance(.5), delta = par ? 0 : (chance(.5) ? 1 : -1) * (d < 3 ? ri(4, 8) : ri(2, 4));
    const S = secante(d, delta);
    const corr = chance(.5), qE = corr ? ri(0, 3) : ri(0, 1), qF = corr ? qE : qE + 2;
    const rel = REL(qE, qF), gE = S.arith('E', qE), gF = S.arith('F', qF);
    const E = par ? 'oui' : 'non';
    const name = rel === 'corr' ? 'correspondants' : rel === 'alt' ? 'alternes-internes' : 'alternes-externes';
    return {
      type: 'choice', opts: [{ v: 'oui', l: 'Oui, (d₁) et (d₂) sont parallèles' }, { v: 'non', l: 'Non, elles ne sont pas parallèles' }],
      check: choiceCheck(E, { msg: () => (par ? `Les deux angles ${name} ont la même mesure : c'est le signe de droites parallèles.` : `${gE}° et ${gF}° : les deux angles ${name} n'ont pas la même mesure. Ne te fie pas seulement au dessin !`) }),
      html: `Les droites (d₁) et (d₂) sont-elles parallèles ?`,
      visual: figure({ lines: S.lines, arcs: [{ ...S.sector('E', qE), r: 30, label: dg(gE) }, { ...S.sector('F', qF), r: 30, kind: 'other', label: dg(gF) }], aria: 'deux droites et une sécante' }),
      hint: `Les deux angles marqués sont ${name}. Si deux angles ${name} ont la même mesure, les droites sont parallèles ; sinon, elles ne le sont pas.`,
      solution: `Les angles marqués sont ${name} : ${gE}° et ${gF}°. ${par ? `Ils sont <b>égaux</b>, donc (d₁) et (d₂) sont <b>parallèles</b>.` : `Ils ne sont <b>pas égaux</b>, donc (d₁) et (d₂) ne sont <b>pas parallèles</b> (même si elles en ont l'air).`}`,
      verify: ans => {
        const p1 = dirDeg(S.pts.L1m, S.pts.L1p), p2 = dirDeg(S.pts.L2m, S.pts.L2p);
        const isPar = close(Math.abs(mod360(p1 - p2 + 90) % 180 - 90), 0);
        return ans === (isPar ? 'oui' : 'non') && close(S.geo('E', qE), gE) && close(S.geo('F', qF), gF);
      },
    };
  }
  const [a, b, c, e] = letters(d, 'ABCD'), t = orient(d);
  if (v === 'quad') {
    let al, be, de, ga, Q, guard = 0;
    do {
      al = meas(5, 60, 120); be = meas(5, 60, 120); de = meas(5, 60, 120); ga = 360 - al - be - de;
      const A = [0, 0], B = [220, 0], D = pol(A, 170, al), I = inter(B, 180 - be, D, al + 180 + de);
      Q = { A, B, C: I.P, D }; Q.ok = I.t > 60 && I.s > 60 && I.t < 300 && I.s < 300 && ga >= 50 && ga <= 140;
    } while (!Q.ok && guard++ < 200);
    if (!Q.ok) { al = 90; be = 90; de = 90; ga = 90; Q = { A: [0, 0], B: [200, 0], C: [200, 170], D: [0, 170] }; }
    const R = rotAll({ A: Q.A, B: Q.B, C: Q.C, D: Q.D }, t), P = { [a]: R.A, [b]: R.B, [c]: R.C, [e]: R.D };
    return numQ({
      X: ga, tpl: `${H(b + c + e)} = {0} °`, value: angleAt(P[b], P[c], P[e]),
      html: `Dans le quadrilatère ${a}${b}${c}${e}, calcule l'angle ${H(b + c + e)}.`,
      visual: figure({ P, segs: [[a, b], [b, c], [c, e], [e, a]], arcs: [{ v: a, a: b, b: e, r: 28, label: dg(al) }, { v: b, a: c, b: a, r: 28, label: dg(be) }, { v: e, a, b: c, r: 28, label: dg(de) }, { v: c, a: b, b: e, r: 28, kind: 'ask', label: '?' }], aria: 'quadrilatère' }),
      hint: `Trace une diagonale : le quadrilatère est fait de <b>deux triangles</b>. La somme de ses quatre angles vaut donc 2 × 180° = 360°.`,
      solution: `La somme des angles d'un quadrilatère vaut 360° (deux triangles).<br>${al}° + ${be}° + ${de}° = ${al + be + de}°, donc ${H(b + c + e)} = 360° − ${al + be + de}° = <b>${ga}°</b>.`,
      verify: E => close(angleAt(P[e], P[a], P[b]) + angleAt(P[a], P[b], P[c]) + angleAt(P[c], P[e], P[a]) + E[0], 360) && close(angleAt(P[b], P[c], P[e]), E[0]),
    });
  }
  if (v === 'poly') {
    const n = pick([5, 6, 8, 9, 10]), X = (n - 2) * 180 / n, P = {};
    const nm = shuffle([...LET]).slice(0, n);
    for (let i = 0; i < n; i++) P[nm[i]] = pol([0, 0], 130, t + 90 + i * 360 / n);
    const segs = nm.map((p, i) => [p, nm[(i + 1) % n]]);
    const [p, q, r] = [nm[n - 1], nm[0], nm[1]];
    return numQ({
      X, tpl: `${H(p + q + r)} = {0} °`, value: angleAt(P[p], P[q], P[r]),
      html: `Ce polygone à ${n} côtés est <b>régulier</b> (côtés égaux, angles égaux). Calcule l'angle ${H(p + q + r)}.`,
      visual: figure({ P, segs, ticks: segs.map(([x, y]) => ({ a: x, b: y })), arcs: [{ v: q, a: p, b: r, r: 26, kind: 'ask', label: '?' }], aria: 'polygone régulier' }),
      msg: x => (x === 360 / n ? `${360 / n}° est l'angle <b>au centre</b> ; on cherche l'angle entre deux côtés.` : ''),
      hint: `Depuis un sommet, les diagonales découpent le polygone en ${n - 2} triangles. La somme des angles vaut donc ${n - 2} × 180°, à partager entre ${n} angles égaux.`,
      solution: `${n} côtés → ${n - 2} triangles : somme des angles = ${n - 2} × 180° = ${(n - 2) * 180}°.<br>Les ${n} angles sont égaux : ${(n - 2) * 180}° ÷ ${n} = <b>${X}°</b>.`,
      verify: E => close(angleAt(P[p], P[q], P[r]), E[0]) && close(nm.reduce((S, x, i) => S + angleAt(P[nm[(i + n - 1) % n]], P[x], P[nm[(i + 1) % n]]), 0), (n - 2) * 180),
    });
  }
  // figures composées : angle extérieur d'un triangle (quelconque ou isocèle)
  const iso = v === 'iso';
  let x, y;
  if (iso) { x = 2 * meas(5, 15, 50); y = (180 - x) / 2; } else { do { x = meas(5, 30, 100); y = meas(5, 30, 100); } while (180 - x - y < 30); }
  const T = iso ? triangle(y, y, 0) : triangle(x, y, 0), Cc = T.C, Bb = T.B;
  // A en (0,0), B à droite ; on prolonge [AB] au-delà de B : point D
  const D = [Bb[0] + 110, 0];
  const R = rotAll({ A: T.A, B: Bb, C: Cc, D }, t), P = { [a]: R.A, [b]: R.B, [c]: R.C, [e]: R.D };
  const X = 180 - y; // angle CBD = x + angle C
  return numQ({
    X, tpl: `${H(c + b + e)} = {0} °`, value: angleAt(P[c], P[b], P[e]),
    html: iso ? `Le triangle ${a}${b}${c} est isocèle en ${c}. Le point ${e} est sur la droite (${a}${b}). Calcule ${H(c + b + e)}.`
      : `Le point ${e} est sur la droite (${a}${b}). Calcule ${H(c + b + e)}.`,
    visual: figure({ P, segs: [[a, e], [b, c], [c, a]], ticks: iso ? [{ a: c, b: a }, { a: c, b }] : [], arcs: iso ? [{ v: c, a, b, r: 28, label: dg(x) }, { v: b, a: c, b: e, r: 30, kind: 'ask', label: '?' }] : [{ v: a, a: b, b: c, r: 28, label: dg(x) }, { v: c, a, b, r: 28, label: dg(180 - x - y) }, { v: b, a: c, b: e, r: 30, kind: 'ask', label: '?' }], aria: 'figure composée' }),
    msg: z => (z === y ? `Tu as trouvé ${H(a + b + c)}. L'angle cherché est son <b>supplémentaire</b> (${a}, ${b}, ${e} sont alignés).` : ''),
    hint: iso ? `Calcule d'abord les angles à la base ${H(c + a + b)} = ${H(c + b + a)}, puis utilise l'angle plat ${H(a + b + e)}.` : `Calcule d'abord ${H(a + b + c)} avec la somme des angles du triangle, puis utilise l'angle plat ${H(a + b + e)}.`,
    solution: iso ? `Angles à la base : (180° − ${x}°) ÷ 2 = ${y}°, donc ${H(a + b + c)} = ${y}°.<br>${a}, ${b}, ${e} sont alignés : ${H(c + b + e)} = 180° − ${y}° = <b>${X}°</b>.`
      : `${H(a + b + c)} = 180° − ${x}° − ${180 - x - y}° = ${y}°.<br>${a}, ${b}, ${e} sont alignés : ${H(c + b + e)} = 180° − ${y}° = <b>${X}°</b>.`,
    verify: E => close(angleAt(P[a], P[b], P[e]), 180) && close(angleAt(P[a], P[b], P[c]) + E[0], 180) && close(angleAt(P[c], P[b], P[e]), E[0]),
  });
}
function C12() {
  const P = { A: [0, 0], B: [200, -10], C: [230, 150], D: [-20, 120] };
  const T = triangle(50, 70, 0), Q = { A: T.A, B: T.B, C: T.C, D: [T.B[0] + 110, 0] };
  return `<h2>12. Défis</h2>
<p class="intro">On mélange tout ce qui précède : il faut souvent calculer un angle « intermédiaire » avant d'arriver à celui qu'on cherche.</p>
<div class="def"><b>Droites parallèles ?</b> Si deux angles alternes-internes (ou correspondants) ont la <b>même mesure</b>, alors les droites sont parallèles. S'ils sont différents, elles ne le sont pas.</div>
<div class="def"><b>Polygones</b> : une diagonale coupe un quadrilatère en deux triangles, donc la somme de ses angles vaut <b>2 × 180° = 360°</b>. Un polygone à n côtés se découpe en n − 2 triangles : somme = <b>(n − 2) × 180°</b>. S'il est <b>régulier</b>, ses n angles sont égaux.</div>
<div class="methode"><b>Méthode</b><ol><li>Parallèles : repère deux angles alternes-internes ou correspondants et <b>compare leurs mesures</b>.</li><li>Quadrilatère : angle cherché = 360° − (somme des trois autres).</li><li>Polygone régulier : (n − 2) × 180°, puis ÷ n.</li><li>Figure composée : calcule d'abord l'angle du triangle, puis utilise l'angle plat (180°).</li></ol></div>
<div class="cols">${figure({ P, segs: [['A', 'B'], ['B', 'C'], ['C', 'D'], ['D', 'A'], { a: 'A', b: 'C', c: '#a8a29e', w: 1.6 }], arcs: [{ v: 'A', a: 'B', b: 'D', r: 26 }, { v: 'B', a: 'C', b: 'A', r: 26 }, { v: 'C', a: 'D', b: 'B', r: 26 }, { v: 'D', a: 'A', b: 'C', r: 26 }], width: 280, aria: 'quadrilatère coupé par une diagonale' })}
${figure({ P: Q, segs: [['A', 'D'], ['B', 'C'], ['C', 'A']], arcs: [{ v: 'A', a: 'B', b: 'C', r: 28, label: '50°' }, { v: 'C', a: 'A', b: 'B', r: 28, label: '60°' }, { v: 'B', a: 'C', b: 'D', r: 30, kind: 'ask', label: '?' }], width: 320, aria: 'angle extérieur d\'un triangle' })}</div>
<div class="ex"><span class="q">Exemple 1 : quadrilatère et polygone</span><br>Un quadrilatère a des angles de 85°, 95° et 110° : le 4<sup>e</sup> mesure 360° − 290° = <b>70°</b>.<br>Hexagone régulier : 6 − 2 = 4 triangles, 4 × 180° = 720°, et 720° ÷ 6 = <b>120°</b> par angle.</div>
<div class="ex"><span class="q">Exemple 2 : figure composée (2<sup>e</sup> figure)</span><br>D est sur la droite (AB). Dans le triangle ABC : ${H('ABC')} = 180° − 50° − 60° = 70°.<br>A, B, D sont alignés : ${H('CBD')} = 180° − 70° = <b>110°</b>.</div>
<div class="warn">⚠️ Ne te fie pas au dessin pour décider si deux droites sont parallèles : regarde les <b>mesures</b> (61° et 59°, ce n'est pas pareil !).<br>⚠️ Polygone régulier : 360° ÷ n est l'angle <b>au centre</b>, pas l'angle entre deux côtés.<br>⚠️ Dans une figure composée, ne t'arrête pas à l'angle intermédiaire.</div>
<div class="retenir">À retenir : triangle 180°, quadrilatère 360°, polygone à n côtés (n − 2) × 180°.</div>`;
}

export const LEVELS = [
  { titre: 'Nommer un angle', generate: L1, cours: C1, classe: '6e' },
  { titre: 'Aigu, droit, obtus, plat', generate: L2, cours: C2, classe: '6e' },
  { titre: 'Rapporteur : lire une mesure', generate: L3, cours: C3, classe: '6e' },
  { titre: 'Rapporteur : la bonne graduation', generate: L4, cours: C4, classe: '6e' },
  { titre: 'Estimer un angle', generate: L5, cours: C5, classe: '6e' },
  { titre: 'Angles adjacents', generate: L6, cours: C6, classe: '5e' },
  { titre: 'Complémentaires et supplémentaires', generate: L7, cours: C7, classe: '5e' },
  { titre: 'Angles opposés par le sommet', generate: L8, cours: C8, classe: '5e' },
  { titre: "Somme des angles d'un triangle", generate: L9, cours: C9, classe: '5e' },
  { titre: 'Triangles isocèle, équilatéral, rectangle', generate: L10, cours: C10, classe: '5e' },
  { titre: 'Alternes-internes et correspondants', generate: L11, cours: C11, classe: '5e' },
  { titre: 'Défis : parallèles, polygones, figures', generate: L12, cours: C12, classe: '5e' },
];
export const OPTIONS = { need: 4, keys: { neg: false } };

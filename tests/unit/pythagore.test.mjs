// Régression du module Pythagore : cohérence énoncé ↔ figure ↔ réponse attendue.
// On relit l'énoncé (texte) et la figure (SVG : sommets, codage de l'angle droit, étiquettes des longueurs),
// puis on vérifie, sans réutiliser les calculs du générateur :
//  • les longueurs écrites sur la figure sont celles de l'énoncé, le « ? » est sur la longueur demandée ;
//  • l'angle droit codé sur la figure est au sommet annoncé (et il est vraiment droit, en pixels) ;
//  • la figure est à l'échelle : la longueur cherchée, mesurée en pixels, est proche de la réponse attendue ;
//  • la réponse attendue est la bonne, recalculée à partir des nombres DU TEXTE par une méthode géométrique
//    (coordonnées, recherche par dichotomie, formule de Héron), avec l'arrondi au dixième si nécessaire.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { setSeed } from '../../engine/util/rand.js';
import { LEVELS } from '../../modules/pythagore/levels.js';

const N = +(process.env.N_PY || 300);

/* ---------- lecture du texte ---------- */
const strip = h => String(h).replace(/<sup>2<\/sup>/g, '²').replace(/<[^>]+>/g, ' ').replace(/&nbsp;/g, ' ').replace(/\s+/g, ' ').trim();
const num = s => Number(String(s).replace(/\s/g, '').replace('−', '-').replace(',', '.'));
const key = (X, Y) => [X, Y].sort().join('');
/** longueurs « XY = 3,5 cm » de l'énoncé */
function givenLengths(txt) {
  const g = {};
  for (const m of txt.matchAll(/\b([A-Z])([A-Z]) = (\d+(?:,\d+)?) (cm|m)\b/g)) g[key(m[1], m[2])] = { v: num(m[3]), t: `${m[3]} ${m[4]}`, u: m[4] };
  return g;
}

/* ---------- lecture de la figure SVG ---------- */
const P = s => s.split(',').map(Number);
const pathPts = d => d.replace('Z', '').trim().slice(1).split(/\s*L/).map(p => P(p.trim()));
const dist = (p, q) => Math.hypot(p[0] - q[0], p[1] - q[1]);
function readFig(svg) {
  const polys = [...svg.matchAll(/<path d="([^"]+)" fill="#fff0f6"/g)].map(m => pathPts(m[1]));
  const segs = [...svg.matchAll(/<path d="(M[^"]+)" stroke="[^"]+" stroke-width="[\d.]+"/g)].map(m => pathPts(m[1]));
  const texts = [...svg.matchAll(/<text x="([-\d.]+)" y="([-\d.]+)"[^>]*font-size="(\d+)" font-weight="(\d+)" fill="([^"]+)"[^>]*>([^<]*)<\/text>/g)]
    .map(m => ({ x: +m[1], y: +m[2], fs: +m[3], w: +m[4], c: m[5], t: m[6] }));
  // points dessinés (sommets des contours, extrémités des segments)
  const pts = [];
  for (const p of [...polys.flat(), ...segs.flat()]) if (!pts.some(q => dist(p, q) < 0.6)) pts.push(p);
  // noms des sommets (taille 19, gras) : chaque nom va au point dessiné le plus proche
  const V = {};
  for (const t of texts.filter(t => t.fs === 19)) {
    const p = pts.reduce((b, q) => (dist(q, [t.x, t.y]) < dist(b, [t.x, t.y]) ? q : b));
    // lisibilité : le nom est plus près de son point que de tout autre point dessiné
    const o = Object.keys(V).find(n => V[n] === p);
    assert.ok(!o, `les noms ${o} et ${t.t} désignent le même point (${p}) : un nom est plus près d'un autre point que du sien`);
    V[t.t] = p;
  }
  const nameOf = p => Object.keys(V).find(n => dist(V[n], p) < 0.6);
  // côtés : arêtes des contours et segments, plus les morceaux d'arête coupés par un point (H milieu de [BC])
  const edges = new Set();
  polys.forEach(pl => pl.forEach((p, i) => { const a = nameOf(p), b = nameOf(pl[(i + 1) % pl.length]); if (a && b) edges.add(key(a, b)); }));
  segs.forEach(([p, q]) => { const a = nameOf(p), b = nameOf(q); if (a && b) edges.add(key(a, b)); });
  const onSeg = (Z, X, Y) => { const [x, y] = [V[X], V[Y]], z = V[Z]; return Math.abs(dist(x, z) + dist(z, y) - dist(x, y)) < 0.3; };
  for (const e of [...edges]) for (const Z of Object.keys(V)) if (!e.includes(Z) && onSeg(Z, e[0], e[1])) { edges.add(key(e[0], Z)); edges.add(key(Z, e[1])); }
  // codages d'angle droit (p1, p2, p3) : le sommet est p1 + p3 − p2, les branches vont vers p1 et p3
  const rights = [...svg.matchAll(/<path d="([^"]+)" fill="none" stroke="#1f2328" stroke-width="1\.8"\/>/g)].map(m => {
    const [p1, p2, p3] = pathPts(m[1]), c = [p1[0] + p3[0] - p2[0], p1[1] + p3[1] - p2[1]];
    const S = Object.keys(V).reduce((b, n) => (dist(V[n], c) < dist(V[b], c) ? n : b));
    return { S, u: [p1[0] - c[0], p1[1] - c[1]], v: [p3[0] - c[0], p3[1] - c[1]] };
  });
  // étiquettes de longueur (taille 18, ou 22 pour « ? ») : chacune est posée sur la perpendiculaire au côté
  // menée par son milieu ; on choisit le côté pour lequel l'écart le long du côté est le plus faible
  const lab = {};
  for (const t of texts.filter(t => t.fs === 18 || t.fs === 22)) {
    let best = null, bd = Infinity;
    for (const e of edges) {
      const A = V[e[0]], B = V[e[1]], m = [(A[0] + B[0]) / 2, (A[1] + B[1]) / 2], l = dist(A, B), w = [t.x - m[0], t.y - m[1]];
      const par = Math.abs(w[0] * (B[0] - A[0]) + w[1] * (B[1] - A[1])) / l, dd = par + 0.05 * Math.hypot(...w);
      if (dd < bd) { bd = dd; best = e; }
    }
    assert.ok(!(best in lab), `deux étiquettes sur le côté ${best}`);
    lab[best] = t.t;
  }
  const len = k => dist(V[k[0]], V[k[1]]);
  /** cosinus de l'angle entre deux vecteurs */
  const cos = (u, v) => (u[0] * v[0] + u[1] * v[1]) / (Math.hypot(...u) * Math.hypot(...v));
  const vec = (S, A) => [V[A][0] - V[S][0], V[A][1] - V[S][1]];
  /** cosinus de l'angle en S, mesuré en pixels */
  const cosAt = (S, A, B) => cos(vec(S, A), vec(S, B));
  return { V, lab, rights, names: rights.map(r => r.S), len, cos, vec, cosAt, edges };
}

/* ---------- calculs indépendants ---------- */
/** côté de l'angle droit par dichotomie : R(0,0), P(a,0), Q(0,y) avec PQ = c */
const legBis = (c, a) => bis(y => Math.hypot(a, y) < c, 0, c);
/** aire par la formule de Héron (n'utilise pas l'angle droit) */
const heron = (a, b, c) => { const s = (a + b + c) / 2; return Math.sqrt(s * (s - a) * (s - b) * (s - c)); };
/** E est-il la valeur exacte x (si x a au plus un chiffre après la virgule) ou son arrondi au dixième (cas non limite) ? */
function bonArrondi(E, x, where) {
  const exact = Math.abs(x * 10 - Math.round(x * 10)) < 1e-6;
  if (exact) { assert.ok(Math.abs(E - x) < 1e-6, `${where} : attendu ${E}, valeur exacte ${x}`); return true; }
  const f = x * 10 - Math.floor(x * 10);
  assert.ok(Math.abs(f - 0.5) > 1e-6, `${where} : ${x} est un cas limite au demi-dixième`);
  assert.ok(Math.abs(E * 10 - Math.round(E * 10)) < 1e-9 && Math.abs(E - x) <= 0.05, `${where} : ${E} n'est pas l'arrondi au dixième de ${x}`);
  return false;
}
/** symbole de la grille de saisie (= ou ≈) cohérent avec l'exactitude */
function symbole(tpl, exact, where, i = 0) {
  const s = [...tpl.matchAll(/(=|≈)(?:<\/span>)?\s*\{\d\}/g)].map(m => m[1])[i];
  assert.equal(s, exact ? '=' : '≈', `${where} : signe ${s} dans « ${tpl} »`);
}
/** figure à l'échelle : longueur en pixels / longueur de l'énoncé constante ; renvoie l'échelle */
function echelle(F, g, where) {
  const ks = Object.keys(g).filter(k => F.edges.has(k)).map(k => F.len(k) / g[k].v);
  assert.ok(ks.length >= 1, `${where} : aucune longueur de l'énoncé sur la figure`);
  ks.forEach(k => assert.ok(Math.abs(k / ks[0] - 1) < 0.01, `${where} : figure pas à l'échelle (${ks})`));
  return ks[0];
}
/** étiquettes de la figure = longueurs de l'énoncé ; « ? » sur le côté demandé, et lui seul */
function etiquettes(F, g, asked, where) {
  for (const k of Object.keys(g)) if (F.edges.has(k) && k in F.lab) assert.equal(F.lab[k], g[k].t, `${where} : étiquette de ${k}`);
  const q = Object.keys(F.lab).filter(k => F.lab[k] === '?');
  assert.deepEqual(q, [asked], `${where} : « ? » sur ${q}, côté demandé ${asked}`);
}
/** angle droit codé en S, posé sur deux côtés dessinés, et vraiment droit sur le dessin */
function angleDroit(F, S, where) {
  const r = F.rights.find(x => x.S === S);
  assert.ok(r, `${where} : angle droit codé en ${F.names}, énoncé en ${S}`);
  const arms = [...F.edges].filter(e => e.includes(S)).map(e => e.replace(S, ''));
  const A = arms.find(X => F.cos(r.u, F.vec(S, X)) > 0.999), B = arms.find(X => F.cos(r.v, F.vec(S, X)) > 0.999);
  assert.ok(A && B, `${where} : le codage en ${S} n'est pas posé sur deux côtés`);
  assert.ok(Math.abs(F.cosAt(S, A, B)) < 0.01, `${where} : l'angle ${A}${S}${B} n'est pas droit sur la figure`);
}
/** dichotomie : plus grand x de [lo, hi] tel que f(x) (f vraie puis fausse) */
function bis(f, lo, hi) {
  for (let i = 0; i < 200; i++) { const x = (lo + hi) / 2; if (f(x)) lo = x; else hi = x; }
  return (lo + hi) / 2;
}

function run(L, fn) {
  test(`pythagore niveau ${L} : énoncé, figure et réponse cohérents`, () => {
    for (let d = 0; d <= 5; d++) {
      for (let i = 0; i < N; i++) {
        const seed = 7e6 + L * 1e5 + d * 1e4 + i;
        setSeed(seed);
        const q = LEVELS[L - 1].generate(d);
        const E = q.expected !== undefined ? q.expected : q.check.expected;
        fn(q, E, `N${L} d=${d} graine=${seed}`, d);
      }
    }
  });
}

/* 1. hypoténuse : le côté qui ne touche pas le sommet codé, et le plus long sur le dessin */
run(1, (q, E, where) => {
  const F = readFig(q.visual), txt = strip(q.html);
  assert.equal(F.rights.length, 1, where);
  const S = F.names[0], m = txt.match(/rectangle en ([A-Z])/);
  if (m) assert.equal(m[1], S, `${where} : énoncé « rectangle en ${m[1]} », figure en ${S}`);
  const sides = [...F.edges];
  const hyp = sides.find(e => !e.includes(S));
  assert.equal(hyp, sides.reduce((a, b) => (F.len(a) > F.len(b) ? a : b)), `${where} : l'hypoténuse n'est pas le plus long côté dessiné`);
  if (/côtés de l'angle droit/.test(txt)) assert.deepEqual(E.split('-').map(s => key(s[0], s[1])).sort(), sides.filter(e => e !== hyp).sort(), where);
  else assert.equal(key(E[0], E[1]), hyp, where);
});

/* 2. carrés et racines : on relit le calcul affiché */
run(2, (q, E, where) => {
  const t = strip(q.tpl).replace(/\{\d\}/g, '#');
  const sqs = [...t.matchAll(/(\d+(?:,\d+)?)²/g)].map(m => num(m[1]));
  const root = t.match(/√ (\d+)/);
  // carré par addition répétée en entiers (dixièmes) : n² = n + n + … + n
  const carre = x => { const k = Math.round(x * 10); let s = 0; for (let j = 0; j < k; j++) s += k; return s / 100; };
  if (/&lt;/.test(q.tpl)) { const N2 = num(root[1]); assert.ok(carre(E[0]) < N2 && N2 < carre(E[1]) && E[1] === E[0] + 1, where); return; }
  if (root) { let r = 0; while (carre(r) < num(root[1])) r++; assert.equal(E[0], r, where); assert.equal(carre(r), num(root[1]), where); return; }
  const op = t.includes('−') ? -1 : 1;
  const want = sqs.length === 1 ? carre(sqs[0]) : carre(sqs[0]) + op * carre(sqs[1]);
  assert.ok(Math.abs(E[0] - want) < 1e-9, `${where} : ${t} attendu ${E[0]} au lieu de ${want}`);
});

/* 3. l'égalité choisie est vraie avec les longueurs mesurées sur la figure, les autres sont fausses */
run(3, (q, E, where) => {
  const F = readFig(q.visual), txt = strip(q.html);
  const S = txt.match(/rectangle en ([A-Z])/)[1];
  angleDroit(F, S, where);
  const parse = l => { const m = strip(l).match(/^([A-Z]{2})(²?) = ([A-Z]{2})²? ([+−]) ([A-Z]{2})²?$/); return { l: m[1], e: m[2] ? 2 : 1, x: m[3], op: m[4], y: m[5] }; };
  const holds = o => { const f = k => F.len(key(k[0], k[1])) ** o.e, r = o.op === '+' ? f(o.x) + f(o.y) : f(o.x) - f(o.y); return Math.abs(f(o.l) - r) / f(o.l) < 0.01; };
  for (const o of q.opts) assert.equal(holds(parse(o.l)), o.v === E, `${where} : « ${strip(o.l)} »`);
  const m = txt.match(/calculer ([A-Z]{2})/);
  if (m) assert.equal(parse(q.opts.find(o => o.v === E).l).l, m[1], where);
});

/* 4 à 7. calculer une longueur dans un triangle rectangle */
function longueur(q, E, where, round) {
  const F = readFig(q.visual), txt = strip(q.html), g = givenLengths(txt);
  const S = txt.match(/rectangle en ([A-Z])/)[1], asked = txt.match(/Calcule ([A-Z]{2})/)[1];
  const A = key(asked[0], asked[1]);
  assert.ok(q.tpl.startsWith(asked + ' '), `${where} : grille « ${q.tpl} » pour ${asked}`);
  assert.equal(Object.keys(g).length, 2, where);
  assert.equal(/arrondie au dixième/.test(txt), round, `${where} : consigne d'arrondi`);
  angleDroit(F, S, where);
  etiquettes(F, g, A, where);
  // valeur exacte par coordonnées : sommet de l'angle droit en (0,0), côtés sur les axes
  let x;
  if (!A.includes(S)) { const [u, v] = Object.values(g).map(o => o.v); x = Math.hypot(u - 0, 0 - v); } // hypoténuse : distance entre (u,0) et (0,v)
  else { const hk = Object.keys(g).find(k => !k.includes(S)), lk = Object.keys(g).find(k => k.includes(S)); x = legBis(g[hk].v, g[lk].v); }
  const exact = bonArrondi(E[0], x, where);
  assert.equal(exact, !round, `${where} : exactitude`);
  symbole(q.tpl, exact, where);
  const k = echelle(F, g, where);
  assert.ok(Math.abs(F.len(A) / k - x) < 0.02 * x + 0.05, `${where} : ${asked} mesuré ${F.len(A) / k} sur la figure, calculé ${x}`);
}
run(4, (q, E, w) => longueur(q, E, w, false));
run(5, (q, E, w) => longueur(q, E, w, true));
run(6, (q, E, w) => longueur(q, E, w, false));
run(7, (q, E, w) => longueur(q, E, w, true));

/* 8. situations : on relit chaque longueur dans sa phrase */
run(8, (q, E, where) => {
  const txt = strip(q.html), F = readFig(q.visual);
  const n = '(\\d+(?:,\\d+)?) (cm|m)';
  const R = [
    [new RegExp(`pied d'une échelle est posé à ${n} d'un mur`), 'BC'], [new RegExp(`touche le mur à ${n} du sol`), 'AB'],
    [new RegExp(`Une échelle de ${n}`), 'AC'], [new RegExp(`Son pied est à ${n} du mur`), 'BC'],
    [new RegExp(`mesure ${n} de large`), 'BC'], [new RegExp(`${n} de haut`), 'AB'], [new RegExp(`diagonale \\[AC\\] mesure ${n}`), 'AC'],
    [new RegExp(`AB = ${n}`), 'AB'], [new RegExp(`BC = ${n}`), 'BC'], [new RegExp(`AC = ${n}`), 'AC'],
    [new RegExp(`Le fil, bien tendu, mesure ${n}`), 'AC'], [new RegExp(`juste sous le cerf-volant est à ${n}`), 'BC'],
    [new RegExp(`haut d'un toboggan est à ${n} du sol`), 'AB'], [new RegExp(`glissière est à ${n} du pied`), 'BC'],
  ];
  const g = {};
  for (const [re, k] of R) { const m = txt.match(re); if (m) { assert.ok(!(k in g), `${where} : ${k} lu deux fois`); g[k] = { v: num(m[1]), t: `${m[1]} ${m[2]}`, u: m[2] }; } }
  assert.equal(Object.keys(g).length, 2, `${where} : deux longueurs lues dans « ${txt} »`);
  const asked = /longueur de l'échelle|diagonale \[AC\] \?|longueur de la glissière/.test(txt) ? 'AC'
    : /hauteur|Calcule la longueur AB/.test(txt) ? 'AB' : /distance du mur|largeur|Calcule la longueur BC/.test(txt) ? 'BC' : null;
  assert.ok(asked && !(asked in g), `${where} : longueur demandée ${asked}`);
  const u = Object.values(g)[0].u;
  assert.ok(Object.values(g).every(o => o.u === u), `${where} : unités mélangées`);
  assert.ok(q.tpl.startsWith(asked + ' ') && q.tpl.endsWith(' ' + u), `${where} : grille « ${q.tpl} »`);
  angleDroit(F, 'B', where);
  assert.ok(Math.abs(F.V.A[0] - F.V.B[0]) < 0.5 && Math.abs(F.V.B[1] - F.V.C[1]) < 0.5, `${where} : [AB] vertical et [BC] horizontal`);
  etiquettes(F, g, asked, where);
  const x = asked === 'AC' ? Math.hypot(g.AB.v, g.BC.v) : legBis(g.AC.v, g[asked === 'AB' ? 'BC' : 'AB'].v);
  symbole(q.tpl, bonArrondi(E[0], x, where), where);
  if (asked !== 'AC') assert.ok(g.AC.v > g[asked === 'AB' ? 'BC' : 'AB'].v, `${where} : hypoténuse plus courte qu'un côté`);
  const k = echelle(F, g, where);
  assert.ok(Math.abs(F.len(asked) / k - x) < 0.02 * x + 0.05, `${where} : ${asked} mesuré ${F.len(asked) / k}, calculé ${x}`);
});

/* 9 et 10. réciproque et contraposée : l'angle est mesuré sur la figure (produit scalaire en pixels) */
run(9, (q, E, where) => {
  const txt = strip(q.html), F = readFig(q.visual), g = givenLengths(txt), n = txt.match(/Le triangle ([A-Z]{3})/)[1];
  assert.equal(Object.keys(g).length, 3, where);
  for (const k of Object.keys(g)) assert.equal(F.lab[k], g[k].t, `${where} : étiquette ${k}`);
  echelle(F, g, where);
  const droit = [...n].filter(S => { const [A, B] = [...n].filter(x => x !== S); return Math.abs(F.cosAt(S, A, B)) < 0.01; });
  assert.equal(droit.length, 1, `${where} : angle droit sur la figure : ${droit}`);
  const big = Object.keys(g).reduce((a, b) => (g[a].v > g[b].v ? a : b));
  assert.ok(!big.includes(droit[0]), `${where} : l'angle droit n'est pas en face du plus grand côté`);
  if (q.type === 'choice') { assert.equal(E, droit[0], where); return; }
  const carre = v => Math.round(v * 10) ** 2 / 100;
  const autres = Object.keys(g).filter(k => k !== big);
  assert.ok(Math.abs(E[0] - carre(g[big].v)) < 1e-9 && Math.abs(E[1] - carre(g[autres[0]].v) - carre(g[autres[1]].v)) < 1e-9, where);
});
run(10, (q, E, where) => {
  const txt = strip(q.html), F = readFig(q.visual), g = givenLengths(txt), n = txt.match(/Le triangle ([A-Z]{3})/)[1];
  assert.equal(Object.keys(g).length, 3, where);
  for (const k of Object.keys(g)) assert.equal(F.lab[k], g[k].t, `${where} : étiquette ${k}`);
  echelle(F, g, where);
  const cos = [...n].map(S => { const [A, B] = [...n].filter(x => x !== S); return [S, F.cosAt(S, A, B)]; });
  const droit = cos.filter(([, c]) => Math.abs(c) < 0.006).map(([S]) => S);
  // les triangles « non rectangles » peuvent en avoir l'air (c'est voulu), mais l'écart doit rester mesurable sur la figure
  assert.ok(cos.every(([, c]) => Math.abs(c) < 0.006 || Math.abs(c) > 0.015), `${where} : angle presque droit ${JSON.stringify(cos)}`);
  assert.equal(E, droit.length ? 'r' + droit[0] : 'non', where);
});

/* 11. problèmes à deux étapes */
run(11, (q, E, where) => {
  const txt = strip(q.html), F = readFig(q.visual), g = givenLengths(txt);
  if (/périmètre/.test(txt)) {
    const S = txt.match(/rectangle en ([A-Z])/)[1], asked = txt.match(/Calcule ([A-Z]{2})/)[1], A = key(asked[0], asked[1]);
    angleDroit(F, S, where); etiquettes(F, g, A, where);
    const [u, v] = Object.values(g).map(o => o.v), x = Math.hypot(u, v);
    const exact = bonArrondi(E[0], x, where);
    bonArrondi(E[1], u + v + x, where + ' (périmètre)');
    symbole(q.tpl, exact, where, 0); symbole(q.tpl, exact, where, 1);
    assert.equal(/arrondies au dixième/.test(txt), !exact, `${where} : consigne d'arrondi`);
    const k = echelle(F, g, where);
    assert.ok(Math.abs(F.len(A) / k - x) < 0.02 * x + 0.05, where);
  } else if (/isocèle/.test(txt)) {
    const c = num(txt.match(/AB = AC = (\d+(?:,\d+)?) cm/)[1]), b = num(txt.match(/BC = (\d+(?:,\d+)?) cm/)[1]);
    angleDroit(F, 'H', where);
    assert.ok(dist(F.V.H, [(F.V.B[0] + F.V.C[0]) / 2, (F.V.B[1] + F.V.C[1]) / 2]) < 0.5, `${where} : H n'est pas le milieu de [BC]`);
    assert.equal(F.lab.AB, `${txt.match(/AB = AC = (\S+) cm/)[1]} cm`, where); assert.equal(F.lab.AC, F.lab.AB, where);
    assert.equal(num(F.lab.BH.split(" ")[0]), b / 2, where); assert.equal(num(F.lab.CH.split(" ")[0]), b / 2, where); assert.equal(F.lab.AH, '?', where);
    const h = legBis(c, b / 2);
    bonArrondi(E[0], h, where);
    assert.ok(Math.abs(E[1] - heron(c, c, b)) < 1e-6, `${where} : aire ${E[1]}, Héron ${heron(c, c, b)}`);
  } else if (/aire/.test(txt)) {
    const S = txt.match(/rectangle en ([A-Z])/)[1], asked = txt.match(/Calcule ([A-Z]{2})/)[1], A = key(asked[0], asked[1]);
    angleDroit(F, S, where); etiquettes(F, g, A, where);
    const hk = Object.keys(g).find(k => !k.includes(S)), lk = Object.keys(g).find(k => k.includes(S));
    assert.ok(A.includes(S), `${where} : ${asked} doit être un côté de l'angle droit`);
    const x = legBis(g[hk].v, g[lk].v);
    bonArrondi(E[0], x, where);
    assert.ok(Math.abs(E[1] - heron(g[hk].v, g[lk].v, x)) < 1e-6, `${where} : aire ${E[1]}, Héron ${heron(g[hk].v, g[lk].v, x)}`);
  } else {
    // deux triangles accolés : B(0,0), A(0,AB), C(BC,0), D = C + CD × (vecteur unitaire ⟂ à (AC), du côté opposé à B)
    assert.match(txt, /ABC est rectangle en B, ACD est rectangle en C/, where);
    assert.deepEqual([...F.names].sort(), ['B', 'C'], where);
    angleDroit(F, 'B', where);
    assert.ok(Math.abs(F.cosAt('C', 'A', 'D')) < 0.01, `${where} : angle ACD pas droit sur la figure`);
    etiquettes(F, g, 'AD', where);
    const A = [0, g.AB.v], C = [g.BC.v, 0], v = [C[0] - A[0], C[1] - A[1]], l = Math.hypot(...v);
    let nrm = [-v[1] / l, v[0] / l]; if (nrm[0] * (0 - C[0]) + nrm[1] * (0 - C[1]) > 0) nrm = [-nrm[0], -nrm[1]];
    const D = [C[0] + g.CD.v * nrm[0], C[1] + g.CD.v * nrm[1]];
    bonArrondi(E[0], dist(A, C), where);
    const exact = bonArrondi(E[1], dist(A, D), where);
    symbole(q.tpl, exact, where, 1);
    const k = echelle(F, g, where);
    assert.ok(Math.abs(F.len('AD') / k - dist(A, D)) < 0.02 * dist(A, D) + 0.05, where);
  }
});

/* 12. défis */
run(12, (q, E, where) => {
  const txt = strip(q.html);
  if (/repère/.test(txt)) {
    const m = txt.match(/A\((−?\d+) ; (−?\d+)\) et B\((−?\d+) ; (−?\d+)\)/), [xa, ya, xb, yb] = m.slice(1).map(num);
    symbole(q.tpl, bonArrondi(E[0], Math.hypot(xb - xa, yb - ya), where), where);
    // les deux points sont bien placés sur le quadrillage : même distance en pixels / taille d'un carreau
    const c = [...q.visual.matchAll(/<circle cx="([-\d.]+)" cy="([-\d.]+)"/g)].map(m => [+m[1], +m[2]]);
    const xs = [...q.visual.matchAll(/<line x1="([-\d.]+)" y1="0" x2="\1"/g)].map(m => +m[1]);
    const u = xs[1] - xs[0];
    assert.ok(Math.abs((c[1][0] - c[0][0]) / u - (xb - xa)) < 0.02 && Math.abs((c[0][1] - c[1][1]) / u - (yb - ya)) < 0.02, `${where} : points mal placés`);
    return;
  }
  if (/carré/.test(txt)) {
    const F = readFig(q.visual), g = givenLengths(txt);
    angleDroit(F, 'B', where);
    if (/diagonale d'un carré ABCD mesure/.test(txt)) {
      const D = num(txt.match(/mesure (\d+) cm/)[1]);
      assert.equal(F.lab.AC, `${D} cm`, where); assert.equal(F.lab.BC, '?', where);
      // côté s cherché par dichotomie : la diagonale du carré de côté s, mesurée en coordonnées, vaut D
      bonArrondi(E[0], bis(s => dist([0, s], [s, 0]) < D, 0, D), where);
    } else {
      const c = num(txt.match(/carré de côté (\d+) cm/)[1]);
      assert.equal(F.lab.AB, `${c} cm`, where); assert.equal(F.lab.BC, `${c} cm`, where); assert.equal(F.lab.AC, '?', where);
      bonArrondi(E[0], dist([0, c], [c, 0]), where);
    }
    return;
  }
  if (/équilatéral/.test(txt)) {
    const F = readFig(q.visual), c = num(txt.match(/de côté (\d+) cm/)[1]);
    angleDroit(F, 'H', where);
    assert.equal(F.lab.AB, `${c} cm`, where); assert.equal(F.lab.AC, `${c} cm`, where); assert.equal(num(F.lab.BH.split(" ")[0]), c / 2, where); assert.equal(F.lab.AH, '?', where);
    assert.ok(Math.abs(F.len('AB') / F.len('BC') - 1) < 0.01 && Math.abs(F.len('AC') / F.len('BC') - 1) < 0.01, `${where} : pas équilatéral`);
    // hauteur : aire de Héron × 2 ÷ base
    bonArrondi(E[0], 2 * heron(c, c, c) / c, where);
    return;
  }
  if (/pavé/.test(txt)) {
    const g = givenLengths(txt);
    bonArrondi(E[0], Math.hypot(g.AB.v, g.BC.v), where);
    // A(0,0,0) et G(AB, BC, CG) : distance dans l'espace
    const exact = bonArrondi(E[1], Math.sqrt((g.AB.v - 0) ** 2 + (g.BC.v - 0) ** 2 + (g.CG.v - 0) ** 2), where);
    symbole(q.tpl, exact, where, 1);
    for (const k of ['AB', 'BC', 'CG']) assert.ok(q.visual.includes(`>${g[k].t}</text>`), `${where} : étiquette ${k}`);
    return;
  }
  // échelle qui glisse
  const F = readFig(q.visual);
  const Lc = num(txt.match(/Une échelle \[AC\] de (\S+) m/)[1]), h1 = num(txt.match(/sommet A est à (\S+) m du sol/)[1]), s = num(txt.match(/glisse de (\S+) m/)[1]);
  assert.equal(F.lab.AC, `${txt.match(/de (\S+) m est appuyée/)[1]} m`, where);
  assert.equal(F.lab.AB, `${txt.match(/à (\S+) m du sol/)[1]} m`, where);
  angleDroit(F, 'B', where);
  const bc = legBis(Lc, h1), bd = legBis(Lc, bc + s);
  bonArrondi(E[0], bc, where); bonArrondi(E[1], bd, where);
  assert.ok(Math.abs(F.len('DE') / F.len('AC') - 1) < 0.01, `${where} : l'échelle n'a pas la même longueur dans les deux positions`);
  const k = F.len('AC') / Lc;
  assert.ok(Math.abs(F.len('BD') / k - bd) < 0.02 * bd + 0.05 && Math.abs(F.len('BE') / k - bc - s) < 0.02 * bc + 0.05, `${where} : BD ou BE faux sur la figure`);
});

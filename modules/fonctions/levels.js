// Fonctions (3e – 2de) : 12 niveaux, de « image / antécédent » jusqu'aux fonctions affines.
// Un repère quadrillé accompagne chaque exercice qui s'y prête ; après la réponse, les points utiles sont marqués.
// Lectures graphiques des premiers niveaux : courbes non affines (paraboles, cubiques) qui passent par des
// points entiers, avec une vérification au chargement que les antécédents lus sont exactement entiers.
import { ri, pick, shuffle, nz, chance, variant } from '../../engine/util/rand.js';
import { numsCheck, rootsCheck, choiceCheck } from '../../engine/answers/checks.js';
import { M, P, F, big, terms, sgn } from '../../engine/util/fmt.js';
import { graph, machine } from './draw.js';

/* ================= outils ================= */
const near = (a, b) => Math.abs(a - b) < 1e-9;
const z = v => (Math.abs(v) < 1e-12 ? 0 : Math.round(v * 1e9) / 1e9); // pas de −0, pas de 0,30000000000000004
const X2 = 'x<sup>2</sup>';
const lin = (a, b) => terms([[a, 'x'], [b, '']]);              // ax + b
const poly = (a, b, c) => terms([[a, X2], [b, 'x'], [c, '']]);
const AB = 'a = {0} &nbsp;&nbsp; b = {1}';
const RED = '#e03131', VIO = '#5f3dc4', ORA = '#e8590c', GRN = '#2b8a3e';
const NOTE_AB = '<br><span class="note">Tape les nombres avec leur signe (et la virgule si besoin).</span>';

/** fenêtre contenant 0 et les valeurs données, avec une marge et une étendue minimale */
function span(v, m = 1, min = 8) {
  let lo = Math.floor(Math.min(0, ...v)) - m, hi = Math.ceil(Math.max(0, ...v)) + m;
  while (hi - lo < min) { lo--; if (hi - lo < min) hi++; }
  return [lo, hi];
}
/** substitution d'un polynôme a·x² + b·x + c en x0 : « 2 × (−3)² − (−3) + 1 » */
function subst(a, b, c, x0) {
  const parts = [];
  if (a) parts.push([a, `${Math.abs(a) === 1 ? '' : M(Math.abs(a)) + ' × '}${P(x0)}<sup>2</sup>`]);
  if (b) parts.push([b, `${Math.abs(b) === 1 ? '' : M(Math.abs(b)) + ' × '}${P(x0)}`]);
  if (c || !parts.length) parts.push([c, M(Math.abs(c))]);
  return parts.map(([k, t], i) => (i ? (k < 0 ? ' − ' : ' + ') : (k < 0 ? '−' : '')) + t).join('');
}
/** valeurs des termes : « 18 + 3 + 1 » */
function vals(list) { const l = list.filter(([k]) => k !== 0); if (!l.length) return '0'; return l.map(([, v], i) => (i ? ' ' + sgn(v) : M(v))).join(''); }

/** check d'une équation à solutions (type roots) avec un message « presque juste » en plus */
function rootsMsg(E, extra, noneMsg) {
  const base = rootsCheck(E, { noneMsg });
  const fn = v => {
    const r = base(v);
    if (r.ok || r.msg || v.none) return r;
    const m = extra(v.vals.filter(x => x !== null));
    return m ? { ...r, msg: m } : r;
  };
  fn.expected = base.expected;
  return fn;
}
/** plusieurs cases dont l'ordre est libre (3 antécédents ou plus) */
function setCheck(E) {
  const e = [...E].sort((p, q) => p - q);
  const fn = v => {
    const u = [...v].sort((p, q) => p - q);
    if (u.every((x, i) => near(x, e[i]))) return { ok: true };
    if (new Set(u).size < u.length) return { ok: false, msg: 'Tu as écrit deux fois le même nombre : il y a trois antécédents <b>différents</b>.' };
    const good = u.filter(x => e.some(y => near(x, y))).length;
    return { ok: false, msg: good ? `${good} réponse${good > 1 ? 's' : ''} juste${good > 1 ? 's' : ''} sur 3 : cherche encore.` : '' };
  };
  fn.expected = e;
  return fn;
}

/* ================= courbes non affines ================= */
// Formes de base g(t) sur un intervalle ; une courbe = s·g(x − h) + k0 (s = ±1, décalages entiers).
const FAM = {
  P1: { g: t => t * t, dom: [-3, 3] },
  P2: { g: t => t * t / 2, dom: [-4, 4] },
  C1: { g: t => (t ** 3 - 9 * t) / 4, dom: [-3, 3] },
  C2: { g: t => (t ** 3 - 12 * t) / 4, dom: [-4, 4] },
};
// Au chargement : pour chaque valeur entière kk, les antécédents entiers de kk, ou null si l'équation g(t) = kk
// a une solution non entière (illisible sur le quadrillage) ou frôle la valeur kk sans l'atteindre.
for (const Fm of Object.values(FAM)) {
  const [a, b] = Fm.dom, N = 4000, xs = [], us = [];
  for (let i = 0; i <= N; i++) { const x = a + (b - a) * i / N; xs.push(x); us.push(Fm.g(x)); }
  Fm.lo = Math.min(...us); Fm.hi = Math.max(...us);
  Fm.nodes = [];
  for (let t = a; t <= b; t++) if (near(Fm.g(t), Math.round(Fm.g(t)))) Fm.nodes.push(t);
  Fm.ante = {};
  for (let kk = Math.floor(Fm.lo) - 3; kk <= Math.ceil(Fm.hi) + 3; kk++) {
    const R = [];
    for (let t = a; t <= b; t++) if (near(Fm.g(t), kk)) R.push(t);
    let ok = true;
    for (let i = 0; i < N && ok; i++) {
      const u = us[i] - kk, v = us[i + 1] - kk;
      if (u * v < 0 && !R.some(r => Math.abs(r - xs[i]) < 0.01)) ok = false;
      if (Math.abs(u) < 0.02 && !R.some(r => Math.abs(r - xs[i]) < 0.25)) ok = false;
    }
    Fm.ante[kk] = ok ? R : null;
  }
}
function mkCurve(name, s, h, k0) {
  const Fm = FAM[name];
  return {
    name, s, h, k0, f: x => s * Fm.g(x - h) + k0, dom: [Fm.dom[0] + h, Fm.dom[1] + h],
    lo: s > 0 ? Fm.lo + k0 : k0 - Fm.hi, hi: s > 0 ? Fm.hi + k0 : k0 - Fm.lo,
    nodes: Fm.nodes.map(t => ({ x: z(t + h), y: z(s * Fm.g(t) + k0) })),
  };
}
function randCurve(names, s0) {
  const name = pick(names), s = s0 || pick([1, -1]);
  if (name === 'P1') return mkCurve(name, s, ri(-2, 2), s > 0 ? ri(-5, -1) : ri(1, 5));
  if (name === 'P2') return mkCurve(name, s, ri(-1, 1), s > 0 ? ri(-4, -1) : ri(1, 4));
  if (name === 'C1') return mkCurve(name, s, ri(-2, 2), ri(-2, 2));
  return mkCurve(name, s, ri(-1, 1), ri(-2, 2));
}
/** antécédents (entiers) de k par la courbe C ; null si illisibles */
function antes(C, k) {
  const Fm = FAM[C.name], kk = z((k - C.k0) * C.s);
  if (!Number.isInteger(kk)) return null;
  const r = Fm.ante[kk];
  if (r === undefined) return kk < Fm.lo || kk > Fm.hi ? [] : null;
  return r ? r.map(t => z(t + C.h)) : null;
}
const inDom = (C, x) => x >= C.dom[0] - 1e-9 && x <= C.dom[1] + 1e-9;
const cWin = (C, extraY = []) => ({ xr: span(C.dom, 1), yr: span([C.lo, C.hi, ...extraY], 1) });
const cDraw = (C, o = {}) => graph({ ...cWin(C, o.ey || []), fs: [{ f: C.f, dom: C.dom, l: 'y = f(x)', ends: true }], ...o });
const domTxt = C => `[${M(C.dom[0])} ; ${M(C.dom[1])}]`;

/* ================= niveaux ================= */
const LEVELS_ = [
  { titre: 'Image et antécédent', generate: L1, cours: C1, classe: '3e' },
  { titre: 'Lire une image sur un graphique', generate: L2, cours: C2, classe: '3e' },
  { titre: 'Lire des antécédents sur un graphique', generate: L3, cours: C3, classe: '3e' },
  { titre: 'Calculer une image avec une formule', generate: L4, cours: C4, classe: '3e' },
  { titre: 'Tableau de valeurs', generate: L5, cours: C5, classe: '3e' },
  { titre: 'Fonction linéaire f(x) = ax', generate: L6, cours: C6, classe: '3e' },
  { titre: 'Fonction affine f(x) = ax + b', generate: L7, cours: C7, classe: '3e' },
  { titre: 'Lire a et b sur le graphique', generate: L8, cours: C8, classe: '3e' },
  { titre: 'La droite passant par deux points', generate: L9, cours: C9, classe: '3e – 2de' },
  { titre: 'Résoudre f(x) = k', generate: L10, cours: C10, classe: '3e' },
  { titre: 'Sens de variation et signe de a', generate: L11, cours: C11, classe: '2de' },
  { titre: 'Défis : droites, forfaits, vers la 2de', generate: L12, cours: C12, classe: '2de' },
];

/* ---------- 1. vocabulaire ---------- */
function L1(d) {
  const v = variant(d, 3), n = d < 2 ? 'f' : pick(['f', 'g', 'h']);
  const a = d < 1 ? ri(0, 9) : ri(-9, 9);
  let b; do { b = d < 1 ? ri(0, 12) : ri(-12, 12); } while (b === a);
  const A = M(a), B = M(b), eq = `${n}(${A}) = ${B}`, after = machine(A, B, n);
  const inv = `Tu as inversé les rôles : dans ${n}(${A}) = ${B}, <b>${B}</b> est le résultat (l'image) et <b>${A}</b> le nombre de départ (l'antécédent).`;
  const sol = `${eq} : on part de <b>${A}</b> (l'antécédent) et ${n} le transforme en <b>${B}</b> (l'image).`;
  if (v === 0) {
    const opts = shuffle([{ v: 'ok', l: `${B} est l'image de ${A} par ${n}` }, { v: 'inv', l: `${A} est l'image de ${B} par ${n}` },
      { v: 'ant', l: `${B} est un antécédent de ${A} par ${n}` }, { v: 'eq', l: `${n}(${B}) = ${A}` }]);
    return { type: 'choice', opts, html: `On sait que ${big(eq)}Quelle phrase est juste ?`, check: choiceCheck('ok', { msg: c => (c === 'eq' ? '' : inv) }),
      hint: `Dans ${n}(nombre de départ) = résultat, le résultat s'appelle l'<b>image</b> ; le nombre de départ s'appelle un <b>antécédent</b>.`,
      solution: `${sol} Donc <b>${B} est l'image de ${A} par ${n}</b>.`, afterVisual: after };
  }
  if (v === 1) {
    const img = chance(0.5), E = img ? b : a;
    return { type: 'nums', html: `On sait que ${big(eq)}${img ? `Quelle est l'<b>image</b> de ${A} par ${n} ?` : `Donne un <b>antécédent</b> de ${B} par ${n}.`}`,
      tpl: img ? `image de ${A} : {0}` : `antécédent de ${B} : {0}`, value: E,
      check: numsCheck([E], { msg: u => (near(u[0], img ? a : b) ? inv : '') }),
      hint: img ? `L'image, c'est ce qui « sort » de la machine ${n} : le nombre écrit après le signe =.` : `Un antécédent, c'est un nombre qu'on « met dans » la machine ${n} : le nombre écrit entre les parenthèses.`,
      solution: `${sol} ${img ? `L'image de ${A} est <b>${B}</b>.` : `Un antécédent de ${B} est <b>${A}</b>.`}`, afterVisual: after };
  }
  if (v === 2) {
    const s = pick([`L'image de ${A} par ${n} est ${B}.`, `${A} est un antécédent de ${B} par ${n}.`, `Par ${n}, ${A} a pour image ${B}.`, `${B} a pour antécédent ${A} par ${n}.`]);
    const opts = shuffle([{ v: 'ok', l: eq }, { v: 'inv', l: `${n}(${B}) = ${A}` }, { v: 'mul', l: `${n} × ${P(a)} = ${B}` }]);
    return { type: 'choice', opts, html: `Quelle égalité traduit la phrase :${big(s)}`,
      check: choiceCheck('ok', { msg: c => (c === 'mul' ? `${n}(${A}) ne veut pas dire « ${n} fois ${A} » : c'est l'image de ${A} par la fonction ${n}.` : inv) }),
      hint: `On écrit toujours ${n}(antécédent) = image.`, solution: `L'antécédent ${A} va entre les parenthèses, l'image ${B} après le signe = : <b>${eq}</b>.`, afterVisual: after };
  }
  let c; do { c = ri(-9, 9); } while (c === a || c === b);
  const C = M(c), opts = shuffle([{ v: 'ok', l: `${B} a au moins deux antécédents par ${n}` }, { v: 'deux', l: `${A} a deux images par ${n}` },
    { v: 'inv', l: `${n}(${B}) = ${C}` }, { v: 'img', l: `${A} et ${C} sont des images de ${B}` }]);
  return { type: 'choice', opts, html: `On sait que ${big(`${eq} &nbsp; et &nbsp; ${n}(${C}) = ${B}`)}Quelle phrase est juste ?`,
    check: choiceCheck('ok', { msg: c2 => (c2 === 'deux' ? `Un nombre a <b>une seule</b> image. Ici c'est ${B} qui est atteint deux fois.` : c2 === 'img' ? inv : '') }),
    hint: `${A} et ${C} sont deux nombres de départ différents qui donnent le même résultat ${B}.`,
    solution: `${A} et ${C} ont la même image ${B} : <b>${B} a (au moins) deux antécédents, ${A} et ${C}</b>. Un nombre a toujours une seule image, mais il peut avoir plusieurs antécédents.`,
    afterVisual: machine(`${A} ; ${C}`, B, n, true, `${n}(${A}) = ${n}(${C}) = ${B}`) };
}
function C1() {
  return `<h2>1. Image et antécédent</h2>
<div class="def">Une <b>fonction</b> f est une « machine » : on y met un nombre x, elle en donne <b>un seul</b> en sortie, noté <b>f(x)</b>.<br>
Si <b>f(3) = 5</b> : <b>5 est l'image de 3</b> par f, et <b>3 est un antécédent de 5</b> par f.</div>
${machine('3', '5')}
<div class="ex">f(−2) = 7 : l'image de −2 est 7 ; −2 est un antécédent de 7.</div>
<div class="ex">Si f(1) = 4 et f(−1) = 4, alors 4 a deux antécédents : 1 et −1.</div>
<div class="warn">⚠️ Ne confonds pas : l'<b>image</b> est le résultat (après le =), l'<b>antécédent</b> est le nombre de départ (entre les parenthèses).</div>
<div class="warn">⚠️ Un nombre a <b>une seule image</b>, mais il peut avoir 0, 1 ou plusieurs antécédents.<br>⚠️ f(3) ne veut pas dire « f × 3 ».</div>`;
}

/* ---------- 2. lire une image ---------- */
function L2(d) {
  const C = randCurve(d < 2 ? ['P1', 'P2'] : ['P1', 'P2', 'C1', 'C2'], d < 1 ? 1 : 0);
  let cand = C.nodes;
  if (d < 1) { const c2 = cand.filter(p => p.x > 0 && p.y > 0); if (c2.length) cand = c2; }
  else if (d >= 3) { const c2 = cand.filter(p => p.y < 0 || p.x < 0); if (c2.length) cand = c2; }
  const { x: x0, y: Y } = pick(cand);
  const back = (antes(C, x0) || []).filter(t => !near(t, Y));
  return { type: 'nums', html: `Voici la courbe d'une fonction f définie sur ${domTxt(C)}.<br>${d >= 2 && chance(0.5) ? `Lis <b>f(${M(x0)})</b>.` : `Lis l'<b>image de ${M(x0)}</b> par f.`}`,
    tpl: `f(${M(x0)}) = {0}`, check: numsCheck([Y], { msg: u => (near(u[0], x0) && !near(x0, Y) ? `Tu as recopié ${M(x0)} : c'est l'abscisse. L'image se lit sur l'axe <b>vertical</b> (des ordonnées).`
      : back.some(t => near(t, u[0])) ? `Tu as cherché un antécédent de ${M(x0)}. Ici on part de x = ${M(x0)} sur l'axe <b>horizontal</b>.`
        : near(u[0], -Y) ? 'Attention au signe : le point est-il au-dessus ou en dessous de l\'axe des abscisses ?' : '') }),
    value: C.f(x0),
    hint: `Pars de <b>${M(x0)}</b> sur l'axe des abscisses (horizontal). Monte ou descends jusqu'à la courbe, puis va horizontalement jusqu'à l'axe des ordonnées (vertical) et lis la valeur.`,
    solution: `Le point de la courbe d'abscisse ${M(x0)} a pour ordonnée ${M(Y)} : <b>f(${M(x0)}) = ${M(Y)}</b>. L'image de ${M(x0)} est ${M(Y)}.`,
    visual: cDraw(C), afterVisual: cDraw(C, { pts: [{ x: x0, y: Y, px: true, py: true, l: `(${M(x0)} ; ${M(Y)})` }], xl: [{ x: x0, l: M(x0), c: ORA }] }) };
}
function C2() {
  const C = mkCurve('P1', 1, 1, -4);
  return `<h2>2. Lire une image sur un graphique</h2>
<div class="def">La <b>courbe</b> de f est formée des points de coordonnées <b>(x ; f(x))</b>.<br>Pour lire l'image de a : on part de <b>a sur l'axe des abscisses</b> (horizontal), on va jusqu'à la courbe, puis on lit l'<b>ordonnée</b> sur l'axe vertical.</div>
<div class="ex">Sur la courbe ci-dessous, on part de x = 3, on monte jusqu'à la courbe, on lit y = 0 : <b>f(3) = 0</b>. De même f(−1) = 0 et f(1) = −4.</div>
${cDraw(C, { pts: [{ x: 3, y: 0, px: true, py: true, l: '(3 ; 0)' }, { x: 1, y: -4, px: true, py: true, l: '(1 ; −4)', c: VIO }] })}
<div class="warn">⚠️ Erreur classique : lire l'axe des abscisses au lieu de l'axe des ordonnées. L'image se lit toujours sur l'axe <b>vertical</b>.</div>
<div class="warn">⚠️ Une image peut être négative : le point est alors <b>sous</b> l'axe des abscisses.</div>`;
}

/* ---------- 3. lire des antécédents ---------- */
function L3(d) {
  const want = d < 1 ? [2] : d < 2 ? [1, 2] : d < 3 ? [0, 1, 2, 2] : [0, 1, 2, 3, 3];
  const cnt = pick(want);
  const names = cnt === 3 ? ['C1'] : cnt === 2 ? (d < 3 ? ['P1', 'P2'] : ['P1', 'P2', 'C2', 'C2']) : cnt === 1 ? ['P1', 'P2'] : ['P1', 'P2', 'C2'];
  let C, k, A;
  for (;;) {
    C = randCurve(names, d < 1 ? 1 : 0);
    const ks = [];
    for (let kk = Math.floor(C.lo) - 2; kk <= Math.ceil(C.hi) + 2; kk++) { const r = antes(C, kk); if (r && r.length === cnt) ks.push([kk, r]); }
    if (ks.length) { [k, A] = pick(ks); break; }
  }
  const truth = x => inDom(C, x) && near(C.f(x), k);
  const pts = A.map(x => ({ x, y: k, px: true, c: RED })), xl = A.map(x => ({ x, l: M(x), c: RED, below: k >= 0 }));
  const after = cDraw(C, { ey: [k], h: { y: k, l: `y = ${M(k)}` }, pts, xl });
  const visual = cDraw(C, d < 1 ? { ey: [k], h: { y: k, l: `y = ${M(k)}` } } : { ey: [k] });
  const fk = inDom(C, k) && Number.isInteger(z(C.f(k))) ? z(C.f(k)) : null;
  const extra = u => (u.length && u.every(x => near(x, k)) && !A.includes(k) ? `Tu as recopié ${M(k)} : c'est l'image. Les antécédents se lisent sur l'axe des <b>abscisses</b> (horizontal).`
    : fk !== null && u.some(x => near(x, fk)) && !A.includes(fk) ? `Tu as lu l'image de ${M(k)}. Ici on cherche au contraire les x tels que f(x) = ${M(k)}.` : '');
  const html = `Voici la courbe d'une fonction f définie sur ${domTxt(C)}.<br>Lis ${cnt === 3 ? `les <b>trois antécédents</b> de ${M(k)}` : `le ou les <b>antécédents</b> de ${M(k)}`} par f.`;
  const hint = `Trace (au doigt) la droite horizontale y = ${M(k)}. Repère <b>tous</b> les points où elle coupe ou touche la courbe, puis lis leur <b>abscisse</b> sur l'axe horizontal. Il peut y en avoir 0, 1, 2 ou plus !`;
  const sol = cnt === 0 ? `La droite y = ${M(k)} ne rencontre pas la courbe : <b>${M(k)} n'a aucun antécédent</b> par f.`
    : `La droite y = ${M(k)} rencontre la courbe en ${cnt === 1 ? 'un seul point' : cnt + ' points'}, d'abscisse${cnt > 1 ? 's' : ''} <b>${A.map(M).join(' ; ')}</b>. ${cnt === 1 ? `${M(k)} a un seul antécédent.` : `On a bien ${A.map(x => `f(${M(x)}) = ${M(k)}`).join(', ')}.`}`;
  if (cnt === 3) {
    return { type: 'nums', html, tpl: 'x₁ = {0} &nbsp; x₂ = {1} &nbsp; x₃ = {2}', check: setCheck(A), hint, solution: sol, visual, afterVisual: after,
      verify: E => { const f = []; for (let x = -60; x <= 60; x += 0.5) if (truth(x)) f.push(x); return E.length === 3 && E.every(truth) && f.length === 3; } };
  }
  return { type: 'roots', noneLabel: 'Aucun antécédent', html: html + '<br><span class="note">Une case par antécédent (dans n\'importe quel ordre).</span>',
    check: rootsMsg(A, extra, `Regarde bien : la droite y = ${M(k)} touche-t-elle la courbe ?`), truth, hint, solution: sol, visual, afterVisual: after };
}
function C3() {
  const C = mkCurve('P1', 1, 1, -4);
  return `<h2>3. Lire des antécédents sur un graphique</h2>
<div class="def">Pour trouver les antécédents de k : on trace la droite <b>horizontale y = k</b>, on repère les points où elle rencontre la courbe, et on lit leurs <b>abscisses</b>.</div>
<div class="ex">Ci-dessous, la droite y = −3 coupe la courbe en deux points d'abscisses 0 et 2 : <b>−3 a deux antécédents, 0 et 2</b>.</div>
${cDraw(C, { h: { y: -3, l: 'y = −3' }, pts: [{ x: 0, y: -3, px: true, c: RED }, { x: 2, y: -3, px: true, c: RED }], xl: [{ x: 0, l: '0', c: RED, below: false }, { x: 2, l: '2', c: RED, below: false }] })}
<div class="ex">La droite y = −4 touche la courbe en un seul point : −4 a <b>un seul</b> antécédent, 1.<br>La droite y = −6 ne rencontre pas la courbe : −6 n'a <b>aucun</b> antécédent.</div>
<div class="warn">⚠️ Ne confonds pas image et antécédent : l'antécédent se lit sur l'axe <b>horizontal</b>.</div>
<div class="warn">⚠️ N'en oublie pas : un nombre peut avoir plusieurs antécédents. Suis toute la droite horizontale !</div>`;
}

/* ---------- 4. calculer une image ---------- */
function L4(d) {
  const v = variant(d, 3);
  let a2 = 0, a1, a0, x0, expr, f, prod = null;
  if (v === 0) { a1 = ri(2, 6); a0 = nz(-9, 9); x0 = ri(1, 6); }
  else if (v === 1) { a1 = nz(-7, 7); a0 = ri(-9, 9); x0 = nz(-6, 6); if (x0 > 0 && chance(0.6)) x0 = -x0; }
  else if (v === 2) { a2 = pick([1, 1, -1]); a1 = ri(-5, 5); a0 = ri(-9, 9); x0 = nz(-4, 4); }
  else if (chance(0.5)) { a2 = pick([2, -1, 3, -2]); a1 = ri(-5, 5); a0 = ri(-9, 9); x0 = nz(-4, 4); }
  else { const p = nz(-6, 6), q = nz(-6, 6); prod = [p, q]; a2 = 1; a1 = p + q; a0 = p * q; x0 = nz(-5, 5); }
  const fac = r => (r ? `(x ${sgn(r)})` : 'x');
  if (prod) { expr = `${fac(prod[0])}${fac(prod[1])}`; f = x => (x + prod[0]) * (x + prod[1]); }
  else { expr = poly(a2, a1, a0); f = x => a2 * Math.pow(x, 2) + a1 * x + a0; }
  const Y = z((a2 * x0 + a1) * x0 + a0);
  const wrongSq = a2 && x0 < 0 ? z(-a2 * x0 * x0 + a1 * x0 + a0) : null, wrongSg = x0 < 0 ? z(a2 * x0 * x0 - a1 * x0 + a0) : null;
  const sol = prod ? `f(${M(x0)}) = (${M(x0)} ${sgn(prod[0])}) × (${M(x0)} ${sgn(prod[1])}) = ${P(x0 + prod[0])} × ${P(x0 + prod[1])} = <b>${M(Y)}</b>`
    : `f(${M(x0)}) = ${subst(a2, a1, a0, x0)} = ${vals([[a2, a2 * x0 * x0], [a1, a1 * x0], [a0, a0]])} = <b>${M(Y)}</b>`;
  const xr = span([x0 - 2, x0 + 2], 1, 8), ys = [Y]; for (let x = xr[0]; x <= xr[1]; x += 0.5) ys.push(Math.max(Y - 12, Math.min(Y + 12, f(x))));
  const yr = span([Y, Math.max(Y - 6, Math.min(...ys)), Math.min(Y + 6, Math.max(...ys))], 1, 8);
  return { type: 'nums', html: `Soit f la fonction définie par ${big(`f(x) = ${expr}`)}Calcule l'image de <b>${M(x0)}</b> par f.`, tpl: `f(${M(x0)}) = {0}`,
    check: numsCheck([Y], { msg: u => (wrongSq !== null && near(u[0], wrongSq) && !near(wrongSq, Y) ? `Presque ! ${P(x0)}<sup>2</sup> = ${P(x0)} × ${P(x0)} = <b>${x0 * x0}</b> : un carré est toujours positif.`
      : wrongSg !== null && near(u[0], wrongSg) && !near(wrongSg, Y) ? `As-tu bien mis ${M(x0)} entre parenthèses ? ${M(a1)} × ${P(x0)} = ${M(a1 * x0)}.`
        : near(u[0], -Y) ? 'Le calcul est presque juste, mais vérifie le signe.' : '') }),
    value: f(x0),
    hint: `Remplace <b>chaque</b> x par <b>${P(x0)}</b>${x0 < 0 ? ', entre parenthèses' : ''}, puis calcule en respectant les priorités${a2 ? ' (le carré d\'abord)' : ' (la multiplication d\'abord)'}.`,
    solution: sol,
    afterVisual: graph({ xr, yr, fs: [{ f, l: 'y = f(x)' }], pts: [{ x: x0, y: Y, px: true, py: true, l: `(${M(x0)} ; ${M(Y)})` }] }) };
}
function C4() {
  return `<h2>4. Calculer une image avec une formule</h2>
<div class="def">Si f est donnée par une formule, par exemple <b>f(x) = 3x − 2</b>, l'image de a s'obtient en <b>remplaçant x par a</b> dans la formule.</div>
<div class="ex">f(x) = 3x − 2 : f(4) = 3 × 4 − 2 = 12 − 2 = <b>10</b></div>
<div class="ex">f(x) = 3x − 2 : f(−5) = 3 × (−5) − 2 = −15 − 2 = <b>−17</b></div>
<div class="ex">g(x) = x<sup>2</sup> + 2x − 1 : g(−3) = (−3)<sup>2</sup> + 2 × (−3) − 1 = 9 − 6 − 1 = <b>2</b></div>
<div class="warn">⚠️ Mets les nombres négatifs <b>entre parenthèses</b> : (−3)<sup>2</sup> = 9, alors que −3<sup>2</sup> = −9.</div>
<div class="warn">⚠️ 3x veut dire 3 × x : avec x = −5, on calcule 3 × (−5), pas 3 − 5 ni 35.</div>
<p>Le point (4 ; 10) est sur la courbe de f : sa hauteur est l'image de 4.</p>
${graph({ xr: [-2, 6], yr: [-4, 12], fs: [{ f: x => 3 * x - 2, l: 'y = 3x − 2' }], pts: [{ x: 4, y: 10, px: true, py: true, l: '(4 ; 10)' }] })}`;
}

/* ---------- 5. tableau de valeurs ---------- */
function tableHTML(xs, cells, lab = 'f(x)') {
  return `<div class="tablewrap"><table class="data"><tr><th>x</th>${xs.map(x => `<td>${M(x)}</td>`).join('')}</tr><tr><th>${lab}</th>${cells.map(c => `<td>${c}</td>`).join('')}</tr></table></div>`;
}
function L5(d) {
  const v = variant(d, 3);
  if (v <= 1) {
    const s = d < 1 ? 1 : pick([1, -1]), h = ri(-2, 2), k0 = s > 0 ? ri(-6, 0) : ri(0, 6);
    const f = x => s * (x - h) * (x - h) + k0, xs = [-3, -2, -1, 0, 1, 2, 3].map(t => t + h), ys = xs.map(x => z(f(x)));
    const tab = tableHTML(xs, ys.map(M)), gw = { xr: span(xs, 1), yr: span(ys, 1) };
    const dots = xs.map((x, i) => ({ x, y: ys[i], c: VIO }));
    if (v === 0) {
      const i = ri(0, 6), x0 = xs[i], Y = ys[i];
      const back = xs.filter((x, j) => near(ys[j], x0));
      return { type: 'nums', html: `Voici un tableau de valeurs d'une fonction f :${tab}Quelle est l'image de <b>${M(x0)}</b> par f ?`, tpl: `f(${M(x0)}) = {0}`,
        check: numsCheck([Y], { msg: u => (back.some(x => near(x, u[0])) && !near(u[0], Y) ? `Tu as lu le tableau à l'envers : cherche ${M(x0)} dans la ligne des <b>x</b>, l'image est juste en dessous.` : '') }),
        value: f(x0), hint: `Cherche ${M(x0)} dans la <b>première ligne</b> (celle des x). L'image est juste en dessous, dans la ligne f(x).`,
        solution: `Dans la colonne de x = ${M(x0)}, on lit f(x) = ${M(Y)} : <b>f(${M(x0)}) = ${M(Y)}</b>.`,
        afterVisual: graph({ ...gw, fs: [{ f, l: 'y = f(x)' }], pts: [...dots.filter(p => p.x !== x0), { x: x0, y: Y, px: true, py: true, l: `(${M(x0)} ; ${M(Y)})` }] }) };
    }
    const k = pick(ys), A = xs.filter((x, j) => ys[j] === k);
    const img = xs.includes(k) ? ys[xs.indexOf(k)] : null;
    return { type: 'roots', noneLabel: 'Aucun antécédent', html: `Voici un tableau de valeurs d'une fonction f :${tab}D'après le tableau, quels sont les <b>antécédents</b> de ${M(k)} par f ?`,
      check: rootsMsg(A, u => (img !== null && !A.includes(img) && u.some(x => near(x, img)) ? `Tu as donné l'image de ${M(k)}. Cherche plutôt ${M(k)} dans la ligne des <b>f(x)</b>.` : '')),
      truth: x => near(f(x), k), hint: `Cherche ${M(k)} dans la <b>deuxième ligne</b> (celle des f(x)) — peut-être plusieurs fois ! Les antécédents sont au-dessus, dans la ligne des x.`,
      solution: `${M(k)} apparaît ${A.length > 1 ? 'deux fois' : 'une fois'} dans la ligne f(x), sous x = ${A.map(M).join(' et x = ')} : <b>${A.length > 1 ? 'les antécédents de ' + M(k) + ' sont ' + A.map(M).join(' et ') : 'le seul antécédent de ' + M(k) + ' est ' + M(A[0])}</b>.`,
      afterVisual: graph({ ...gw, fs: [{ f, l: 'y = f(x)' }], h: { y: k, l: `y = ${M(k)}` }, pts: [...dots.filter(p => !A.includes(p.x)), ...A.map(x => ({ x, y: k, px: true, c: RED }))] }) };
  }
  // compléter un tableau avec une formule
  let f, expr, pr;
  if (v === 2) { const a = nz(-4, 5), b = ri(-6, 6); f = x => a * x + b; expr = lin(a, b); pr = x => `${subst(0, a, b, x)} = ${M(z(a * x + b))}`; }
  else { const a = pick([1, -1, 2]), c = ri(-5, 5); f = x => a * x * x + c; expr = poly(a, 0, c); pr = x => `${subst(a, 0, c, x)} = ${M(z(a * x * x + c))}`; }
  const xs = shuffle([-4, -3, -2, -1, 0, 1, 2, 3, 4]).slice(0, 5).sort((p, q) => p - q);
  const holes = shuffle([0, 1, 2, 3, 4]).slice(0, 3).sort((p, q) => p - q);
  if (v === 3 && !holes.some(i => xs[i] < 0)) { const i = xs.findIndex(x => x < 0); if (i >= 0) { holes[0] = i; holes.sort((p, q) => p - q); } }
  const E = holes.map(i => z(f(xs[i])));
  if (new Set(holes).size < 3) return L5(d);
  let n = 0; const cells = xs.map((x, i) => (holes.includes(i) ? `{${n++}}` : M(z(f(x)))));
  return { type: 'nums', html: `Soit f(x) = ${expr}.<br>Complète le tableau de valeurs.`, tpl: tableHTML(xs, cells), check: numsCheck(E, { msg: u => (v === 3 && holes.some((i, j) => xs[i] < 0 && near(u[j], -f(xs[i]) + 2 * f(0)) && !near(u[j], E[j])) ? 'Attention : le carré d\'un nombre négatif est positif, (−2)<sup>2</sup> = 4.' : '') }),
    verify: e => holes.every((i, j) => near(e[j], f(xs[i]))),
    hint: `Pour chaque case vide, remplace x par le nombre du dessus (entre parenthèses s'il est négatif) dans f(x) = ${expr}.`,
    solution: holes.map(i => `f(${M(xs[i])}) = ${pr(xs[i])}`).join('<br>'),
    afterVisual: graph({ xr: span(xs, 1), yr: span(xs.map(f), 1), fs: [{ f, l: 'y = f(x)' }], pts: xs.map((x, i) => ({ x, y: f(x), c: holes.includes(i) ? ORA : VIO })) }) };
}
function C5() {
  const f = x => x * x - 2;
  return `<h2>5. Tableau de valeurs</h2>
<div class="def">Un <b>tableau de valeurs</b> d'une fonction f donne, pour quelques nombres x (1<sup>re</sup> ligne), leurs images f(x) (2<sup>e</sup> ligne).<br>Chaque colonne correspond à un <b>point (x ; f(x))</b> de la courbe.</div>
${tableHTML([-2, -1, 0, 1, 2], ['2', '−1', '−2', '−1', '2'])}
<div class="ex">Avec f(x) = x<sup>2</sup> − 2 : f(−2) = (−2)<sup>2</sup> − 2 = 4 − 2 = 2.<br>L'image de 1 est −1 (on lit <b>sous</b> le 1). Les antécédents de −1 sont <b>−1 et 1</b> (on cherche −1 dans la 2<sup>e</sup> ligne).</div>
<div class="warn">⚠️ L'image se lit dans la ligne f(x), sous le x ; l'antécédent se lit dans la ligne des x, au-dessus de la valeur cherchée.</div>
<div class="warn">⚠️ Une valeur peut apparaître plusieurs fois dans la 2<sup>e</sup> ligne : elle a alors plusieurs antécédents.</div>
${graph({ xr: [-3, 3], yr: [-3, 3], fs: [{ f, l: 'y = x² − 2' }], pts: [-2, -1, 0, 1, 2].map(x => ({ x, y: f(x), c: VIO })) })}`;
}

/* ---------- 6. fonction linéaire ---------- */
function L6(d) {
  const v = variant(d, 3);
  const msgs = (a, x0, y0) => u => (!near(a, 0) && near(u[0], x0 / y0) && !near(u[0], a) ? `Tu as calculé x ÷ f(x). C'est l'inverse : <b>a = f(x) ÷ x</b>.`
    : near(u[0], y0 - x0) && !near(u[0], a) ? 'Ce n\'est pas une soustraction : f(x) = a × x, donc a s\'obtient par une <b>division</b>.'
      : near(u[0], -a) ? 'Attention au signe de a.' : '');
  if (v === 0 || v === 3) {
    const a = v === 0 ? (d < 1 ? ri(2, 6) : nz(-6, 6)) : pick([0.5, 1.5, 2.5, -0.5, -1.5, -2.5, 3.5]);
    const x0 = v === 0 ? (d < 1 ? ri(2, 6) : nz(-7, 7)) : pick([2, 4, 6, -2, -4]), y0 = z(a * x0);
    return { type: 'nums', html: `f est une fonction <b>linéaire</b> telle que ${big(`f(${M(x0)}) = ${M(y0)}`)}Trouve son coefficient a (f(x) = ax).`, tpl: `a = {0}`,
      check: numsCheck([a], { msg: msgs(a, x0, y0) }), verify: E => near(E[0] * x0, y0),
      hint: `f(x) = a × x, donc ${M(y0)} = a × ${P(x0)}. Quel nombre multiplié par ${P(x0)} donne ${M(y0)} ? Divise : a = ${M(y0)} ÷ ${P(x0)}.`,
      solution: `f(${M(x0)}) = a × ${P(x0)} = ${M(y0)}, donc a = ${M(y0)} ÷ ${P(x0)} = <b>${M(a)}</b> : f(x) = ${lin(a, 0)}.`,
      afterVisual: lineG(a, 0, { pts: [{ x: x0, y: y0, px: true, py: true, l: `(${M(x0)} ; ${M(y0)})` }], x: [x0], y: [y0], tri: { x: 0, y: 0, dx: 1, dy: a } }) };
  }
  if (v === 1) {
    const a = d < 2 ? ri(2, 7) : nz(-7, 7), xs = shuffle([1, 2, 3, 4, 5, 6, 7, 8, 10]).slice(0, 4), x4 = xs.pop();
    xs.sort((p, q) => p - q);
    return { type: 'nums', html: `f est une fonction <b>linéaire</b>. Voici un tableau de valeurs :${tableHTML(xs, xs.map(x => M(a * x)))}C'est un tableau de proportionnalité. Trouve le coefficient a, puis f(${x4}).`,
      tpl: `a = {0} &nbsp;&nbsp; f(${x4}) = {1}`, check: numsCheck([a, a * x4], { msg: u => (near(u[0], a) ? `a est juste ! Pour f(${x4}), calcule ${M(a)} × ${x4}.` : msgs(a, xs[0], a * xs[0])(u)) }),
      verify: E => xs.every(x => near(E[0] * x, a * x)) && near(E[1], E[0] * x4), value: a * x4,
      hint: `Dans un tableau de proportionnalité, on passe de la 1<sup>re</sup> ligne à la 2<sup>e</sup> en multipliant toujours par le même nombre : c'est a. Divise une image par son x.`,
      solution: `${M(a * xs[0])} ÷ ${xs[0]} = ${M(a)} (et de même pour les autres colonnes) : <b>a = ${M(a)}</b>. Puis f(${x4}) = ${M(a)} × ${x4} = <b>${M(a * x4)}</b>.`,
      afterVisual: lineG(a, 0, { x: [0, x4 + 1], y: [a * x4], pts: [...xs.map(x => ({ x, y: a * x, c: VIO })), { x: x4, y: a * x4, px: true, py: true, l: `(${x4} ; ${M(a * x4)})` }] }) };
  }
  // v === 2 : lecture graphique
  const half = d >= 3 && chance(0.5), a = half ? pick([0.5, -0.5, 1.5, -1.5]) : (d < 3 ? pick([1, 2, 3, -1, -2, 3]) : nz(-3, 3)), p = half ? 2 : 1;
  return { type: 'nums', html: `La droite ci-dessous représente une fonction <b>linéaire</b> f(x) = ax.<br>Lis le coefficient a.`, tpl: `a = {0}`,
    check: numsCheck([a], { msg: msgs(a, p, a * p) }), verify: E => near(E[0] * p, a * p) && near(E[0] * 2 * p, a * 2 * p),
    hint: `La droite passe par l'origine. Avance de ${p} carreau${p > 1 ? 'x' : ''} vers la droite à partir de l'origine : de combien la droite monte-t-elle (ou descend-elle) ?${p > 1 ? ' Puis divise par 2.' : ''}`,
    solution: `La droite passe par O(0 ; 0) et par (${p} ; ${M(a * p)}) : a = ${M(a * p)} ÷ ${p} = <b>${M(a)}</b>.`,
    visual: lineG(a, 0, {}), afterVisual: lineG(a, 0, { pts: [{ x: p, y: a * p, px: true, py: true, l: `(${p} ; ${M(a * p)})` }], tri: { x: 0, y: 0, dx: p, dy: a * p } }) };
}
/** graphique d'une droite y = ax + b, fenêtre [−5 ; 5] élargie si besoin */
function lineG(a, b, o = {}) {
  const xr = span([-4, 4, ...(o.x || [])], 1, 10);
  const yv = [b, ...(o.y || []), ...(o.tri ? [o.tri.y + o.tri.dy] : [])], yr = [Math.min(-6, Math.floor(Math.min(...yv)) - 1), Math.max(6, Math.ceil(Math.max(...yv)) + 1)];
  return graph({ xr, yr, fs: [{ f: x => a * x + b, l: o.l || 'y = f(x)' }, ...(o.fs || [])], pts: o.pts, tri: o.tri, h: o.h, xl: o.xl });
}
function C6() {
  return `<h2>6. Fonction linéaire f(x) = ax</h2>
<div class="def">Une fonction <b>linéaire</b> s'écrit <b>f(x) = ax</b>, où a est un nombre fixé : le <b>coefficient</b>.<br>Sa courbe est une <b>droite qui passe par l'origine</b>. Elle traduit une situation de <b>proportionnalité</b> : f(x) est proportionnel à x, a est le coefficient de proportionnalité.</div>
<div class="ex">Si f est linéaire et f(4) = 12, alors 12 = a × 4, donc <b>a = 12 ÷ 4 = 3</b> : f(x) = 3x.</div>
<div class="ex">Si f(−2) = 7 : a = 7 ÷ (−2) = <b>−3,5</b>.</div>
<div class="ex">Sur le graphique : à partir de l'origine, quand on avance de 1, la droite monte de a.</div>
${graph({ xr: [-4, 5], yr: [-4, 8], fs: [{ f: x => 1.5 * x, l: 'y = 1,5x' }], pts: [{ x: 2, y: 3, px: true, py: true, l: '(2 ; 3)' }], tri: { x: 0, y: 0, dx: 2, dy: 3 } })}
<p>Ici : on avance de 2, on monte de 3, donc a = 3 ÷ 2 = 1,5.</p>
<div class="warn">⚠️ a = f(x) ÷ x, pas x ÷ f(x).</div>
<div class="warn">⚠️ Une droite qui ne passe pas par l'origine ne représente pas une fonction linéaire.</div>`;
}

/* ---------- 7. fonction affine : a et b ---------- */
function L7(d) {
  const v = variant(d, 3);
  let a, b, expr, f;
  if (v === 0) { a = ri(2, 6); b = nz(-9, 9); expr = lin(a, b); }
  else if (v === 1) { a = nz(-6, 6); b = nz(-9, 9); expr = `${M(b)} ${sgn(a).replace(/ 1$/, '')}x`; }
  else if (v === 2) {
    const c = ri(0, 3);
    if (c === 0) { a = -1; b = nz(-9, 9); expr = chance(0.5) ? lin(a, b) : `${M(b)} − x`; }
    else if (c === 1) { a = nz(-7, 7); b = 0; expr = lin(a, 0); }
    else if (c === 2) { a = 0; b = nz(-9, 9); expr = M(b); }
    else { a = 1; b = nz(-9, 9); expr = lin(1, b); }
  } else {
    const c = ri(0, 2);
    if (c === 0) { const m = pick([2, 3, -2, 4]), p = nz(-5, 5); a = m; b = m * p; expr = `${M(m)}(x ${sgn(p)})`; }
    else if (c === 1) { a = pick([0.5, -0.5]); b = nz(-6, 6); expr = `${a < 0 ? '−' : ''}${F('x', 2)} ${sgn(b)}`; }
    else { const p = nz(-6, 6); a = -1; b = -p; expr = `−(x ${sgn(p)})`; }
  }
  f = x => a * x + b; // la forme affichée est équivalente : vérifiée par verify en plusieurs points
  const tf = v === 3 && /\(/.test(expr) ? (expr.startsWith('−(') ? (x => -(x - b)) : (x => a * (x + b / a))) : f;
  return { type: 'nums', html: `Soit la fonction affine ${big(`f(x) = ${expr}`)}Donne ses coefficients a et b (forme f(x) = ax + b).${NOTE_AB}`, tpl: AB,
    check: numsCheck([a, b], { msg: u => (near(u[0], b) && near(u[1], a) && a !== b ? 'a et b sont inversés : <b>a</b> est le nombre qui multiplie x, <b>b</b> est le nombre seul.'
      : near(u[0], -a) && near(u[1], b) && a ? 'b est juste. Pour a, garde le <b>signe</b> qui est devant x.'
        : v === 3 && near(u[0], a) && !near(u[1], b) ? `a est juste. Développe pour trouver b : ${expr} = ${lin(a, b)}.` : '') }),
    verify: E => [-3, 0, 1, 2, 5].every(x => near(E[0] * x + E[1], tf(x))),
    hint: v === 3 ? 'Écris d\'abord f(x) sous la forme ax + b (développe, ou écris x/2 = 0,5x).' : `Range f(x) sous la forme <b>a</b>x + <b>b</b> : a est le nombre devant x (avec son signe), b est le nombre seul.${v === 2 ? ' S\'il n\'y a pas de nombre seul, b = 0 ; s\'il n\'y a pas de x, a = 0 ; « −x » veut dire −1x.' : ''}`,
    solution: `f(x) = ${lin(a, b)}${a === 0 ? ' (aucun terme en x)' : ''}, donc <b>a = ${M(a)} et b = ${M(b)}</b>. On retrouve b = f(0) : la droite coupe l'axe des ordonnées en ${M(b)}.`,
    afterVisual: lineG(a, b, { pts: [{ x: 0, y: b, l: `b = ${M(b)}`, c: VIO, anchor: 'end' }], tri: Math.abs(a) <= 3 && a ? { x: 0, y: b, dx: 1, dy: a } : null }) };
}
function C7() {
  return `<h2>7. Fonction affine f(x) = ax + b</h2>
<div class="def">Une fonction <b>affine</b> s'écrit <b>f(x) = ax + b</b>. a est le <b>coefficient directeur</b>, b l'<b>ordonnée à l'origine</b>.<br>Sa courbe est une <b>droite</b>. Cas particuliers : b = 0 → fonction linéaire ; a = 0 → fonction constante.</div>
<div class="ex">f(x) = 2x − 3 : <b>a = 2, b = −3</b>.</div>
<div class="ex">g(x) = 5 − 4x = −4x + 5 : <b>a = −4, b = 5</b> (on range les termes).</div>
<div class="ex">h(x) = 2(x + 3) = 2x + 6 : a = 2, b = 6. &nbsp; k(x) = 7 : a = 0, b = 7.</div>
${graph({ xr: [-4, 5], yr: [-5, 6], fs: [{ f: x => 2 * x - 3, l: 'y = 2x − 3' }], pts: [{ x: 0, y: -3, l: 'b = −3', c: VIO, anchor: 'end' }], tri: { x: 0, y: -3, dx: 1, dy: 2 } })}
<div class="warn">⚠️ Erreur classique : <b>a et b inversés</b>. a est toujours le nombre qui multiplie x, même s'il est écrit en second.</div>
<div class="warn">⚠️ Le signe fait partie du coefficient : dans 5 − 4x, a = −4.</div>`;
}

/* ---------- 8. lire a et b sur le graphique ---------- */
function L8(d) {
  const half = d >= 3 && chance(0.45);
  const a = half ? pick([0.5, -0.5, 1.5, -1.5]) : d < 1 ? ri(1, 3) : d < 2 ? nz(-3, 3) : ri(-3, 3);
  const b = d < 2 ? nz(-3, 3) : ri(-4, 4), p = half ? 2 : 1;
  return { type: 'nums', html: `La droite ci-dessous représente une fonction affine f(x) = ax + b.<br>Lis a et b.${NOTE_AB}`, tpl: AB,
    check: numsCheck([a, b], { msg: u => (near(u[0], b) && near(u[1], a) && a !== b ? 'a et b sont inversés : <b>b</b> se lit sur l\'axe des ordonnées, <b>a</b> est la pente (on avance de 1, on monte de a).'
      : near(u[1], b) && near(u[0], -a) && a ? 'b est juste ! Pour a : la droite monte-t-elle ou descend-elle quand on va vers la droite ?'
        : near(u[1], b) && a && near(u[0], 1 / a) && Math.abs(a) !== 1 ? 'b est juste ! Pour a : on avance de 1 <b>horizontalement</b> et on mesure la variation <b>verticale</b>.'
          : near(u[0], a) && !near(u[1], b) ? 'a est juste ! b est l\'ordonnée du point où la droite coupe l\'axe <b>vertical</b>.' : '') }),
    verify: E => near(E[1], b) && near(E[0] * p + E[1], a * p + b),
    hint: `<b>b</b> : lis l'ordonnée du point où la droite coupe l'axe vertical. <b>a</b> : à partir de ce point, avance de ${p} carreau${p > 1 ? 'x' : ''} vers la droite : de combien la droite monte-t-elle (a &gt; 0) ou descend-elle (a &lt; 0) ?${p > 1 ? ' Divise par 2.' : ''}`,
    solution: `La droite coupe l'axe des ordonnées en ${M(b)} : <b>b = ${M(b)}</b>. En avançant de ${p}, elle ${a > 0 ? 'monte' : a < 0 ? 'descend' : 'ne monte pas'}${a ? ' de ' + M(Math.abs(a * p)) : ''} : <b>a = ${a ? `${M(a * p)}${p > 1 ? ' ÷ 2 = ' + M(a) : ''}` : '0'}</b>. Donc f(x) = ${lin(a, b)}.`,
    visual: lineG(a, b, { l: '𝒟' }), afterVisual: lineG(a, b, { l: '𝒟', pts: [{ x: 0, y: b, l: `b = ${M(b)}`, c: VIO, anchor: 'end' }], tri: a ? { x: 0, y: b, dx: p, dy: a * p } : null }) };
}
function C8() {
  return `<h2>8. Lire a et b sur le graphique</h2>
<div class="def">Pour la droite de f(x) = ax + b :<br>• <b>b</b> est l'ordonnée du point où la droite coupe l'<b>axe des ordonnées</b> (car f(0) = b) ;<br>• <b>a</b> : quand on avance de <b>1</b> vers la droite, la droite <b>monte de a</b> (ou descend si a &lt; 0).</div>
${graph({ xr: [-4, 5], yr: [-4, 6], fs: [{ f: x => -2 * x + 4, l: 'y = −2x + 4' }], pts: [{ x: 0, y: 4, l: 'b = 4', c: VIO, anchor: 'end' }], tri: { x: 0, y: 4, dx: 1, dy: -2 } })}
<div class="ex">Ci-dessus : la droite coupe l'axe vertical en 4, donc b = 4. On avance de 1, elle descend de 2 : a = −2. <b>f(x) = −2x + 4</b>.</div>
<div class="ex">Si on avance de 2 et qu'on monte de 1 : a = 1 ÷ 2 = 0,5.</div>
<div class="warn">⚠️ Ne pas inverser a et b. Ne pas lire b sur l'axe des abscisses : b est sur l'axe <b>vertical</b>.</div>
<div class="warn">⚠️ Droite qui descend → a négatif. Droite horizontale → a = 0.</div>`;
}

/* ---------- 9. droite passant par deux points ---------- */
function L9(d) {
  let a, b, x1, x2;
  const half = d >= 3 && chance(0.4);
  if (d < 1) { a = ri(1, 4); b = ri(-4, 4); x1 = 0; x2 = ri(1, 4); }
  else {
    a = half ? pick([0.5, -0.5, 1.5, -1.5]) : d < 2 ? nz(-3, 3) : ri(-3, 3);
    do { x1 = ri(-4, 3); x2 = half ? x1 + pick([2, 4]) : ri(-3, 5); } while (x2 <= x1 || Math.abs(x1) + Math.abs(x2) === 0 || (half && x2 > 5));
    b = half ? z(ri(-4, 4) - a * x1) : ri(-4, 4);
    if (half && !Number.isInteger(a * x1 + b)) return L9(d);
  }
  if (chance(0.3) && d >= 1) [x1, x2] = [x2, x1];
  const y1 = z(a * x1 + b), y2 = z(a * x2 + b);
  if (Math.abs(y1) > 9 || Math.abs(y2) > 9) return L9(d);
  const A = `A(${M(x1)} ; ${M(y1)})`, B = `B(${M(x2)} ; ${M(y2)})`;
  const ptsAB = [{ x: x1, y: y1, l: 'A', c: VIO }, { x: x2, y: y2, l: 'B', c: VIO }];
  const g = (line) => graph({ xr: span([x1, x2], 1, 10), yr: span([y1, y2, b], 1, 10), fs: line ? [{ f: x => a * x + b, l: 'y = f(x)' }] : [], pts: line ? [...ptsAB, { x: 0, y: b, l: `b = ${M(b)}`, c: ORA, anchor: 'end' }] : ptsAB });
  return { type: 'nums', html: `f est une fonction affine telle que ${big(`f(${M(x1)}) = ${M(y1)} &nbsp; et &nbsp; f(${M(x2)}) = ${M(y2)}`)}Sa droite passe donc par ${A} et ${B}. Trouve a et b (f(x) = ax + b).${NOTE_AB}`, tpl: AB,
    check: numsCheck([a, b], { msg: u => (y1 !== y2 && near(u[0], (x2 - x1) / (y2 - y1)) && !near(u[0], a) ? 'Pour a, c\'est la variation des <b>y</b> divisée par la variation des <b>x</b> (et pas l\'inverse).'
      : near(u[0], a) && !near(u[1], b) ? `a est juste ! Pour b, remplace x et y par les coordonnées de A : ${M(y1)} = ${M(a)} × ${P(x1)} + b.`
        : near(u[0], b) && near(u[1], a) && a !== b ? 'a et b sont inversés.' : near(u[0], -a) ? 'Attention au signe de a : calcule (y<sub>B</sub> − y<sub>A</sub>) ÷ (x<sub>B</sub> − x<sub>A</sub>) dans le même ordre en haut et en bas.' : '') }),
    verify: E => near(E[0] * x1 + E[1], y1) && near(E[0] * x2 + E[1], y2),
    hint: `<b>a</b> = (f(${M(x2)}) − f(${M(x1)})) ÷ (${M(x2)} − ${P(x1)}) : variation des y divisée par variation des x. Puis <b>b</b> : remplace dans ${M(y1)} = a × ${P(x1)} + b.`,
    solution: `a = (${M(y2)} − ${P(y1)}) ÷ (${M(x2)} − ${P(x1)}) = ${M(y2 - y1)} ÷ ${P(x2 - x1)} = <b>${M(a)}</b>.<br>Puis ${M(y1)} = ${M(a)} × ${P(x1)} + b, donc b = ${M(y1)} ${sgn(z(-a * x1))} = <b>${M(b)}</b>.<br>f(x) = ${lin(a, b)}. Vérification : f(${M(x2)}) = ${M(a)} × ${P(x2)} ${sgn(b)} = ${M(y2)} ✓`,
    visual: g(false), afterVisual: g(true) };
}
function C9() {
  return `<h2>9. La fonction affine passant par deux points</h2>
<div class="def">Si la droite de f(x) = ax + b passe par A(x<sub>A</sub> ; y<sub>A</sub>) et B(x<sub>B</sub> ; y<sub>B</sub>) :<br>
<b>a = (y<sub>B</sub> − y<sub>A</sub>) ÷ (x<sub>B</sub> − x<sub>A</sub>)</b> &nbsp; (variation des y ÷ variation des x)<br>puis on trouve <b>b</b> en écrivant y<sub>A</sub> = a × x<sub>A</sub> + b.</div>
<div class="ex">f(1) = 5 et f(3) = 9 : A(1 ; 5), B(3 ; 9).<br>a = (9 − 5) ÷ (3 − 1) = 4 ÷ 2 = <b>2</b>.<br>5 = 2 × 1 + b, donc b = 5 − 2 = <b>3</b>. &nbsp; f(x) = 2x + 3.<br>Vérification : f(3) = 2 × 3 + 3 = 9 ✓</div>
${graph({ xr: [-3, 5], yr: [-2, 11], fs: [{ f: x => 2 * x + 3, l: 'y = 2x + 3' }], pts: [{ x: 1, y: 5, l: 'A', c: VIO }, { x: 3, y: 9, l: 'B', c: VIO }, { x: 0, y: 3, l: 'b = 3', c: ORA, anchor: 'end' }], tri: { x: 1, y: 5, dx: 2, dy: 4 } })}
<div class="warn">⚠️ Même ordre en haut et en bas : (y<sub>B</sub> − y<sub>A</sub>) ÷ (x<sub>B</sub> − x<sub>A</sub>). Et pas (x ÷ y) !</div>
<div class="warn">⚠️ Vérifie toujours avec le 2<sup>e</sup> point.</div>`;
}

/* ---------- 10. résoudre f(x) = k ---------- */
function L10(d) {
  const v = variant(d, 3);
  let a, b, x0, cst = false;
  if (v === 0) { a = ri(2, 5); b = nz(-8, 8); x0 = ri(-3, 6); }
  else if (v === 1) { a = pick([1, 2, -1, -2, 0.5]); b = ri(-3, 3); x0 = a === 0.5 ? pick([-4, -2, 2, 4]) : ri(-4, 4); }
  else if (v === 2) { a = nz(-6, -2); b = ri(-9, 9); x0 = ri(-5, 5); }
  else if (chance(0.3)) { cst = true; a = 0; b = nz(-6, 6); x0 = null; }
  else { a = pick([2, -2, 4, -4]); b = ri(-7, 7); x0 = ri(-4, 3) + (Math.abs(a) === 2 ? 0.5 : pick([0.5, 0.25 * 2])); }
  const k = cst ? b + nz(-3, 3) : z(a * x0 + b), E = cst ? [] : [z(x0)], f = x => a * x + b;
  if (Math.abs(k) > 12) return L10(d);
  const graphQ = v === 1, ant = v === 2;
  const html = graphQ ? `La droite ci-dessous représente une fonction affine f.<br>Résous graphiquement l'équation <b>f(x) = ${M(k)}</b>.`
    : cst ? `Soit la fonction ${big(`f(x) = ${M(b)}`)}(f est constante). Résous l'équation <b>f(x) = ${M(k)}</b>.`
      : `Soit ${big(`f(x) = ${lin(a, b)}`)}${ant ? `Trouve l'<b>antécédent</b> de ${M(k)} par f.` : `Résous l'équation <b>f(x) = ${M(k)}</b>.`}`;
  const extra = u => (!u.length ? '' : a !== 1 && a && near(u[0], k - b) ? `Tu as fait ${M(k)} ${sgn(-b)} = ${M(k - b)}, c'est bien. Il reste à <b>diviser par ${P(a)}</b>.`
    : a && near(u[0], (k + b) / a) ? `Attention au signe : pour faire disparaître ${sgn(b)}, on fait ${M(k)} ${sgn(-b)}.`
      : near(u[0], z(a * k + b)) ? `Tu as calculé l'image de ${M(k)}. On cherche au contraire x tel que f(x) = ${M(k)}.` : '');
  const sol = cst ? `f(x) vaut toujours ${M(b)}, jamais ${M(k)} : <b>aucune solution</b>. La droite horizontale y = ${M(b)} ne rencontre jamais la droite y = ${M(k)}.`
    : graphQ ? `La droite y = ${M(k)} coupe la droite de f au point d'abscisse ${M(x0)} : <b>x = ${M(x0)}</b>. Par le calcul : ${lin(a, b)} = ${M(k)} ⇔ ${lin(a, 0)} = ${M(z(k - b))} ⇔ x = ${M(x0)}.`
      : `${lin(a, b)} = ${M(k)}<br>⇔ ${lin(a, 0)} = ${M(k)} ${sgn(-b)} = ${M(z(k - b))}<br>⇔ x = ${M(z(k - b))} ÷ ${P(a)} = <b>${M(x0)}</b>.<br>Vérification : f(${M(x0)}) = ${M(a)} × ${P(x0)} ${sgn(b)} = ${M(k)} ✓`;
  const G = o => lineG(a, b, { y: [k], x: x0 !== null ? [x0] : [], ...o });
  return { type: 'roots', noneLabel: 'Aucune solution', html, check: rootsMsg(E, extra, cst ? '' : undefined), truth: x => near(f(x), k),
    hint: graphQ ? `Trace la droite horizontale y = ${M(k)}. Lis l'<b>abscisse</b> du point où elle coupe la droite de f.`
      : cst ? `f(x) = ${M(b)} pour <b>tous</b> les x. Peut-elle valoir ${M(k)} ?`
        : `Écris ${lin(a, b)} = ${M(k)}. ${b > 0 ? `Enlève ${M(b)} des deux côtés, puis divise` : b < 0 ? `Ajoute ${M(-b)} des deux côtés, puis divise` : 'Divise les deux côtés'} par ${P(a)}.`,
    solution: sol, visual: graphQ ? G({}) : '',
    afterVisual: G({ h: { y: k, l: `y = ${M(k)}` }, pts: cst ? [] : [{ x: x0, y: k, px: true, c: RED }], xl: cst ? [] : [{ x: x0, l: M(x0), c: RED, below: k >= 0 }] }) };
}
function C10() {
  return `<h2>10. Résoudre f(x) = k</h2>
<div class="def">Résoudre f(x) = k, c'est trouver les <b>antécédents</b> de k par f.<br>• <b>Par le calcul</b> (f affine) : on résout l'équation ax + b = k.<br>• <b>Sur le graphique</b> : on trace la droite horizontale y = k et on lit les abscisses des points d'intersection.</div>
<div class="ex">f(x) = 3x − 4. Résoudre f(x) = 5 :<br>3x − 4 = 5 ⇔ 3x = 9 ⇔ <b>x = 3</b>. Vérification : f(3) = 9 − 4 = 5 ✓</div>
${graph({ xr: [-2, 5], yr: [-5, 8], fs: [{ f: x => 3 * x - 4, l: 'y = 3x − 4' }], h: { y: 5, l: 'y = 5' }, pts: [{ x: 3, y: 5, px: true, c: RED }], xl: [{ x: 3, l: '3', c: RED }] })}
<div class="ex">Si f(x) = 2 pour tout x (fonction constante), l'équation f(x) = 5 n'a <b>aucune solution</b>.</div>
<div class="warn">⚠️ Ne pas calculer f(5) à la place ! On cherche x, pas l'image de 5.</div>
<div class="warn">⚠️ Fais la même opération des deux côtés : on <b>enlève</b> b, puis on <b>divise</b> par a.</div>`;
}

/* ---------- 11. sens de variation ---------- */
function L11(d) {
  const v = variant(d, 3);
  const OPTS = [{ v: 'c', l: 'croissante' }, { v: 'd', l: 'décroissante' }, { v: 'k', l: 'constante' }];
  const cat = (f) => { const t = f(1) - f(0); return t > 1e-12 ? 'c' : t < -1e-12 ? 'd' : 'k'; };
  if (v <= 1) {
    let a = nz(-6, 6), b = nz(-9, 9), expr;
    if (v === 0) expr = lin(a, b);
    else if (chance(0.25)) { a = 0; expr = M(b); }
    else expr = `${M(b)} ${sgn(a).replace(/ 1$/, '')}x`;
    const f = x => a * x + b, E = cat(f);
    return { type: 'choice', opts: OPTS, html: `La fonction ${big(`f(x) = ${expr}`)}est…`,
      check: choiceCheck(E, { msg: c => (c !== 'k' && E !== 'k' && b * a < 0 ? `Regarde le signe de <b>a</b> (le nombre devant x), pas celui de b.` : '') }), verify: e => e === cat(f),
      hint: `Repère a, le coefficient de x${v === 1 ? ' (range d\'abord sous la forme ax + b)' : ''}. a &gt; 0 : croissante ; a &lt; 0 : décroissante ; a = 0 : constante.`,
      solution: `f(x) = ${lin(a, b)} : a = ${M(a)} ${a > 0 ? '&gt; 0, donc f est <b>croissante</b>' : a < 0 ? '&lt; 0, donc f est <b>décroissante</b>' : ': f est <b>constante</b>'}.`,
      afterVisual: lineG(a, b, { tri: a ? { x: 0, y: b, dx: 1, dy: a } : null }) };
  }
  if (v === 2) {
    const a = pick([-3, -2, -1, -0.5, 0, 0.5, 1, 2, 3]), b = ri(-3, 3), f = x => a * x + b, E = cat(f);
    return { type: 'choice', opts: [{ v: 'c', l: 'a &gt; 0' }, { v: 'd', l: 'a &lt; 0' }, { v: 'k', l: 'a = 0' }],
      html: 'La droite ci-dessous représente une fonction affine f(x) = ax + b.<br>Que peut-on dire de a ?', check: choiceCheck(E), verify: e => e === cat(f),
      hint: 'Parcours la droite de gauche à droite : monte-t-elle, descend-elle, ou reste-t-elle horizontale ?',
      solution: `La droite ${a > 0 ? 'monte : f est croissante, <b>a &gt; 0</b>' : a < 0 ? 'descend : f est décroissante, <b>a &lt; 0</b>' : 'est horizontale : f est constante, <b>a = 0</b>'} (ici a = ${M(a)}).`,
      visual: lineG(a, b, {}), afterVisual: lineG(a, b, { tri: a ? { x: 0, y: b, dx: 1, dy: a } : null }) };
  }
  const a = nz(-7, 7), b = ri(-20, 20), f = x => a * x + b;
  let x1 = ri(-40, 40), x2; do { x2 = ri(-40, 40); } while (x2 === x1);
  const rel = (p, q) => (p < q - 1e-12 ? 'lt' : p > q + 1e-12 ? 'gt' : 'eq');
  const E = rel(f(x1), f(x2)), fx1 = `f(${M(x1)})`, fx2 = `f(${M(x2)})`;
  return { type: 'choice', opts: [{ v: 'lt', l: `${fx1} &lt; ${fx2}` }, { v: 'eq', l: `${fx1} = ${fx2}` }, { v: 'gt', l: `${fx1} &gt; ${fx2}` }],
    html: `Soit ${big(`f(x) = ${lin(a, b)}`)}Sans calculer, compare ${fx1} et ${fx2}.`,
    check: choiceCheck(E, { msg: c => (c !== 'eq' && (a < 0) ? 'Attention : a est négatif, donc f <b>renverse</b> l\'ordre.' : '') }),
    verify: e => e === rel(a * x1 + b, a * x2 + b),
    hint: `a = ${M(a)}, donc f est ${a > 0 ? 'croissante' : 'décroissante'}. Compare d'abord ${M(x1)} et ${M(x2)}.`,
    solution: `${M(x1)} ${x1 < x2 ? '&lt;' : '&gt;'} ${M(x2)} et f est ${a > 0 ? 'croissante (a &gt; 0) : elle <b>conserve</b> l\'ordre' : 'décroissante (a &lt; 0) : elle <b>renverse</b> l\'ordre'}. Donc <b>${fx1} ${E === 'lt' ? '&lt;' : '&gt;'} ${fx2}</b>. (Calcul : ${fx1} = ${M(f(x1))}, ${fx2} = ${M(f(x2))}.)`,
    afterVisual: lineG(a, b, { tri: { x: 0, y: b, dx: 1, dy: a } }) };
}
function C11() {
  return `<h2>11. Sens de variation et signe de a</h2>
<div class="def">Pour f(x) = ax + b :<br>• <b>a &gt; 0</b> : f est <b>croissante</b> (la droite monte) ;<br>• <b>a &lt; 0</b> : f est <b>décroissante</b> (la droite descend) ;<br>• <b>a = 0</b> : f est <b>constante</b> (droite horizontale).</div>
${graph({ xr: [-4, 4], yr: [-5, 5], fs: [{ f: x => 2 * x - 1, l: 'a > 0', c: GRN }, { f: x => -x + 2, l: 'a < 0', c: RED }, { f: () => -3, l: 'a = 0', c: VIO }] })}
<div class="ex">f(x) = 7 − 3x : a = −3 &lt; 0, f est décroissante.</div>
<div class="ex">Croissante : si x<sub>1</sub> &lt; x<sub>2</sub> alors f(x<sub>1</sub>) &lt; f(x<sub>2</sub>) (l'ordre est conservé).<br>Décroissante : si x<sub>1</sub> &lt; x<sub>2</sub> alors f(x<sub>1</sub>) &gt; f(x<sub>2</sub>) (l'ordre est renversé).</div>
<div class="warn">⚠️ C'est le signe de <b>a</b> qui compte, pas celui de b : f(x) = −5 + 2x est croissante.</div>`;
}

/* ---------- 12. défis ---------- */
function L12(d) {
  const v = d < 1 ? 0 : d < 2 ? ri(0, 1) : d < 3 ? ri(0, 2) : ri(0, 3);
  if (v === 0) { // intersection de deux droites
    const x0 = ri(-4, 4), y0 = ri(-5, 5);
    let a1 = nz(-3, 3), a2; do { a2 = nz(-3, 3); } while (a2 === a1);
    const b1 = y0 - a1 * x0, b2 = y0 - a2 * x0, f = x => a1 * x + b1, g = x => a2 * x + b2;
    return { type: 'nums', html: `Les droites de ${big(`f(x) = ${lin(a1, b1)} &nbsp; et &nbsp; g(x) = ${lin(a2, b2)}`)}se coupent en un point I. Trouve ses coordonnées.`, tpl: 'I ( {0} ; {1} )',
      check: numsCheck([x0, y0], { msg: u => (near(u[0], x0) ? `x = ${M(x0)} est juste ! Pour y, calcule f(${M(x0)}).` : '') }),
      verify: E => near(f(E[0]), E[1]) && near(g(E[0]), E[1]),
      hint: `Au point d'intersection, f(x) = g(x). Résous ${lin(a1, b1)} = ${lin(a2, b2)}, puis calcule y = f(x).`,
      solution: `${lin(a1, b1)} = ${lin(a2, b2)} ⇔ ${lin(z(a1 - a2), 0)} = ${M(z(b2 - b1))}${a1 - a2 === 1 ? '' : ` ⇔ x = ${M(x0)}`}. Puis y = f(${M(x0)}) = ${M(y0)} (et g(${M(x0)}) = ${M(y0)} ✓). <b>I(${M(x0)} ; ${M(y0)})</b>.`,
      afterVisual: graph({ xr: span([x0], 2, 10), yr: span([y0], 3, 10), fs: [{ f, l: 'f', c: 'var(--curve)' }, { f: g, l: 'g', c: GRN }], pts: [{ x: x0, y: y0, px: true, py: true, l: `I(${M(x0)} ; ${M(y0)})`, c: RED }] }) };
  }
  if (v === 1) { // deux forfaits
    const p2 = ri(2, 6), diff = ri(2, 5), p1 = p2 + diff, n0 = ri(4, 12), c = diff * n0;
    const A = n => p1 * n, B = n => c + p2 * n;
    const W = { xr: [-1, 2 * n0 + 2], yr: [-Math.ceil(p1 * n0 * 0.1), Math.ceil(A(2 * n0 + 1) / 10) * 10], fs: [{ f: A, l: 'A', c: 'var(--curve)', dom: [0, 2 * n0 + 2] }, { f: B, l: 'B', c: GRN, dom: [0, 2 * n0 + 2] }] };
    const ctx = `Piscine. <b>Tarif A</b> : ${p1} € l'entrée. <b>Tarif B</b> : abonnement de ${c} €, puis ${p2} € l'entrée.<br>Pour n entrées : A(n) = ${p1}n et B(n) = ${c} + ${p2}n.`;
    if (chance(0.5)) {
      return { type: 'nums', html: `${ctx}<br>Pour combien d'entrées les deux tarifs coûtent-ils <b>le même prix</b> ?`, tpl: 'n = {0}', keys: { neg: false },
        check: numsCheck([n0], { msg: u => (near(u[0], A(n0)) ? `${A(n0)} €, c'est le prix commun. On demande le <b>nombre d'entrées</b>.` : '') }), value: c / (p1 - p2),
        hint: `Résous ${p1}n = ${c} + ${p2}n : regroupe les n d'un côté.`,
        solution: `${p1}n = ${c} + ${p2}n ⇔ ${diff}n = ${c} ⇔ <b>n = ${n0}</b>. Pour ${n0} entrées, les deux tarifs coûtent ${A(n0)} €. Avant, A est moins cher ; après, B est moins cher.`,
        afterVisual: graph({ ...W, pts: [{ x: n0, y: A(n0), px: true, l: `${n0} entrées : ${A(n0)} €`, c: RED, lx: 12, ly: 26, anchor: 'start' }] }) };
    }
    let n; do { n = ri(1, 2 * n0); } while (n === n0 && chance(0.7));
    const E = A(n) < B(n) ? 'A' : A(n) > B(n) ? 'B' : 'eq';
    return { type: 'choice', opts: [{ v: 'A', l: 'Le tarif A' }, { v: 'B', l: 'Le tarif B' }, { v: 'eq', l: 'Les deux coûtent pareil' }],
      html: `${ctx}<br>Léo va à la piscine <b>${n} fois</b>. Quel tarif est le plus avantageux ?`, check: choiceCheck(E), verify: e => e === (p1 * n < c + p2 * n ? 'A' : p1 * n > c + p2 * n ? 'B' : 'eq'),
      hint: `Calcule A(${n}) = ${p1} × ${n} et B(${n}) = ${c} + ${p2} × ${n}, puis compare.`,
      solution: `A(${n}) = ${A(n)} € et B(${n}) = ${c} + ${p2 * n} = ${B(n)} € : <b>${E === 'eq' ? 'les deux coûtent pareil' : 'le tarif ' + E + ' est le plus avantageux'}</b>.`,
      afterVisual: graph({ ...W, pts: [{ x: n, y: A(n), px: true, c: 'var(--curve)' }, { x: n, y: B(n), c: GRN }] }) };
  }
  if (v === 2) { // fonction carré
    const c = ri(-5, 3), kind = pick(['two', 'two', 'one', 'none']), m = ri(1, 4);
    const k = kind === 'two' ? c + m * m : kind === 'one' ? c : c - ri(1, 4), E = kind === 'two' ? [-m, m] : kind === 'one' ? [0] : [];
    const f = x => x * x + c;
    return { type: 'roots', noneLabel: 'Aucun antécédent', html: `Vers la 2<sup>de</sup> : soit la fonction ${big(`f(x) = ${poly(1, 0, c)}`)}Trouve tous les antécédents de <b>${M(k)}</b> par f.`,
      check: rootsMsg(E, () => '', 'Un carré n\'est jamais négatif… mais vérifie quand même !'), truth: x => near(f(x), k),
      hint: `Écris x<sup>2</sup> ${sgn(c)} = ${M(k)}, donc x<sup>2</sup> = ${M(k - c)}. Un carré positif a <b>deux</b> racines (une positive, une négative) ; un carré n'est jamais négatif.`,
      solution: `x<sup>2</sup> = ${M(k)} ${sgn(-c)} = ${M(k - c)}. ${kind === 'two' ? `x = ${m} ou x = −${m} : <b>deux antécédents, ${-m} et ${m}</b> (car (−${m})<sup>2</sup> = ${m}<sup>2</sup> = ${m * m}).` : kind === 'one' ? 'x<sup>2</sup> = 0 ⇔ <b>x = 0</b> (un seul antécédent).' : `Un carré n'est jamais négatif : <b>${M(k)} n'a aucun antécédent</b>.`}`,
      afterVisual: graph({ xr: [-5, 5], yr: span([c, k, c + 9], 1, 8), fs: [{ f, l: 'y = f(x)' }], h: { y: k, l: `y = ${M(k)}` }, pts: E.map(x => ({ x, y: k, px: true, c: RED })), xl: E.map(x => ({ x, l: M(x), c: RED, below: k >= 0 })) }) };
  }
  // produit nul
  const p = ri(-5, 5); let q; do { q = ri(-5, 5); } while (q === p);
  const f = x => (x - p) * (x - q), fac = r => (r === 0 ? 'x' : `(x ${sgn(-r)})`);
  const lo = Math.min(p, q), hi = Math.max(p, q), vmin = -((hi - lo) ** 2) / 4;
  return { type: 'roots', noneLabel: 'Aucun antécédent', html: `Vers la 2<sup>de</sup> : soit la fonction ${big(`f(x) = ${fac(p)}${fac(q)}`)}Trouve les antécédents de <b>0</b> par f.`,
    check: rootsMsg([p, q], u => (u.some(x => near(x, -p) || near(x, -q)) ? 'Attention au signe : x − 3 s\'annule pour x = 3, et x + 3 pour x = −3.' : '')), truth: x => near(f(x), 0),
    hint: 'Un produit est nul si et seulement si l\'un de ses facteurs est nul.',
    solution: `f(x) = 0 ⇔ ${fac(p).replace(/[()]/g, '')} = 0 ou ${fac(q).replace(/[()]/g, '')} = 0 ⇔ <b>x = ${M(lo)} ou x = ${M(hi)}</b>.`,
    afterVisual: graph({ xr: span([lo, hi], 2, 8), yr: span([Math.max(vmin, -12), 6], 1, 8), fs: [{ f, l: 'y = f(x)' }], pts: [p, q].map(x => ({ x, y: 0, c: RED })), xl: [p, q].map(x => ({ x, l: M(x), c: RED, below: false })) }) };
}
function C12() {
  return `<h2>12. Défis : droites, forfaits, vers la 2<sup>de</sup></h2>
<div class="def"><b>Intersection de deux droites</b> : au point commun, f(x) = g(x). On résout cette équation pour trouver x, puis y = f(x).</div>
<div class="ex">f(x) = 2x + 1 et g(x) = −x + 7 : 2x + 1 = −x + 7 ⇔ 3x = 6 ⇔ x = 2 ; y = f(2) = 5. <b>I(2 ; 5)</b>.</div>
${graph({ xr: [-2, 6], yr: [-2, 9], fs: [{ f: x => 2 * x + 1, l: 'f' }, { f: x => -x + 7, l: 'g', c: GRN }], pts: [{ x: 2, y: 5, px: true, py: true, l: 'I(2 ; 5)', c: RED }] })}
<div class="ex"><b>Comparer deux forfaits</b> : A(n) = 8n (8 € l'entrée) et B(n) = 30 + 5n. Même prix quand 8n = 30 + 5n ⇔ 3n = 30 ⇔ n = 10. Moins de 10 entrées : A est moins cher ; plus de 10 : B.</div>
<div class="ex"><b>Vers la 2<sup>de</sup></b> : f(x) = x<sup>2</sup>. Les antécédents de 9 sont <b>3 et −3</b> ; 0 a un seul antécédent ; −4 n'en a aucun (un carré n'est jamais négatif).<br>f(x) = (x − 2)(x + 5) : les antécédents de 0 sont 2 et −5 (produit nul).</div>
<div class="warn">⚠️ Pour l'intersection, n'oublie pas de calculer y après avoir trouvé x.</div>
<div class="warn">⚠️ x<sup>2</sup> = 9 a <b>deux</b> solutions : 3 et −3.</div>`;
}

/* ================= export ================= */
const wrap = g => d => { const q = g(d); q.replaceVisual = true; return q; };
export const LEVELS = LEVELS_.map(L => ({ ...L, generate: wrap(L.generate) }));
export const OPTIONS = { need: 4, keys: { comma: true } };

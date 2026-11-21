// Niveaux 10 à 12 : résolution graphique de f(x) = g(x) et f(x) < g(x) ; tableau de signes d'un produit et d'un
// quotient ; défis (mélange, parité, problèmes).
import {
  ri, pick, chance, M, P, F, R, I, REALS, INF, fmtSet, r6, niveau, rNums, rIv, rRoots, rCmp, rChoice,
  carre, cube, X2, X3, big, fx, lin, ax, signe, sgnTxt, REL, rTable, terms, ent, sensNum,
} from './outils.js';
import { REF, CLES, graph, graphCourbe, tabSignes, ligneSignes } from './draw.js';
import { genCourbe, genDroite, fromYs, ensemble, ensembleDe, degenere } from './courbes.js';

const nz = (a, b) => { let v; do { v = ri(a, b); } while (v === 0); return v; };
const CMPF = { '<': (u, v) => u < v, '≤': (u, v) => u <= v, '>': (u, v) => u > v, '≥': (u, v) => u >= v };
const ORANGE = '#e8590c';

/* =====================================================================================================
   Niveau 10 : résolution graphique de f(x) = g(x) et f(x) < g(x)
   ===================================================================================================== */
const EX10 = { a: -4, ys: [0, 1, 2, 3, 2, 1, 0, -1, -2], m: 0, p: 1 };           // g : y = 1 ; f = g en −3 et 1
const EX10B = { a: -4, ys: [0, 1, 2, 3, 2, 1, 0, -1, -2], m: 1, p: 0 };          // g : y = x ; f = g en 1
const EX10C = { a: -4, ys: [-2, -1, 0, 1, 2, 3, 2, 1, 0], gys: [-2, 1, 2, 1, 0, -2, -1, 1, 3] };

function paire(p) {
  const F = fromYs(p.a, p.ys), G = p.gys ? fromYs(p.a, p.gys) : genDroite(p.a, F.b, p.m, p.p);
  return { F, G, h: F.ys.map((y, i) => y - G.ys[i]) };
}
/** les deux courbes ne se coupent qu'aux nœuds entiers (aucun croisement caché entre deux entiers) */
function propre({ F, G, h }) {
  const e = ensemble(h, F.a, '<');
  if (!e) return null;
  for (let i = 0; i + 1 < h.length; i++) {
    const s = h[i] + h[i + 1];
    for (let t = 0.1; t < 0.95; t += 0.1) { const v = F.f(F.a + i + t) - G.f(F.a + i + t); if (!(v * s > 1e-9)) return null; }
  }
  return e;
}
function drawPaire(d, o = {}) {
  for (let t = 0; t < 800; t++) {
    const C = genCourbe(d < 1 ? 1 : d < 3 ? ri(1, 2) : ri(1, 3));
    let p;
    if (d < 3 || chance(0.4)) { p = { a: C.a, ys: C.ys, m: pick([-1, 0, 0, 1, 1, 2]), p: ri(-3, 3) }; if (Math.max(...genDroite(C.a, C.b, p.m, p.p).ys.map(Math.abs)) > 6) continue; }
    else { const G = genCourbe(ri(1, 2), { a: C.a, W: C.W }); p = { a: C.a, ys: C.ys, gys: G.ys }; }
    const Q = paire(p), e = propre(Q);
    if (!e || e.racines.length > (o.maxRac ?? 2) || e.racines.length < (o.minRac ?? 1)) continue;
    return p;
  }
  throw new Error('drawPaire');
}
const lim10 = F => `[${M(F.a)} ; ${M(F.b)}]`;
const stem10 = F => `Voici les courbes représentatives de deux fonctions f et g définies sur ${lim10(F)}.`;
const ptsX = (F, xs) => xs.map(x => ({ x, y: F.f(x), px: true, c: ORANGE, l: M(x), ly: -12 }));
const vis10 = (F, G, pts) => graphCourbe(F, { G, pts, aria: 'courbes de f et de g' });

const hCmp = {
  id: 'h-cmp', dmin: 0, titre: 'comparer f(x) et g(x) sur le graphique',
  draw(d) { const p = drawPaire(d, { minRac: 0 }), { F, h } = paire(p), L = F.xs.filter((x, i) => h[i] !== 0); return { ...p, x0: pick(L) }; },
  ex: { ...EX10, x0: -1 },
  build({ a, ys, m, p, gys, x0 }) {
    const { F, G } = paire({ a, ys, m, p, gys }), u = F.f(x0), v = G.f(x0), s = signe(u - v);
    if (s === '=') return null;
    return {
      html: `${stem10(F)}Compare f(${M(x0)}) et g(${M(x0)}).`,
      visual: vis10(F, G),
      ...rCmp(s, { value: u - v }),
      hint: `Place-toi sur l’abscisse ${M(x0)} : lis la hauteur de la courbe étiquetée f et celle de la courbe étiquetée g. La courbe la plus haute à cet endroit correspond au plus grand nombre.`,
      solution: `À l’abscisse ${M(x0)}, la courbe de f est à la hauteur ${M(u)} et celle de g à la hauteur ${M(v)} : f(${M(x0)}) = ${M(u)} ${sgnTxt[s]} ${M(v)} = g(${M(x0)}).`,
      afterVisual: vis10(F, G, [{ x: x0, y: u, px: true, c: ORANGE }, { x: x0, y: v, c: ORANGE }]),
    };
  },
};

const hEq = {
  id: 'h-eq', dmin: 0, titre: 'résoudre f(x) = g(x)',
  draw(d) { return drawPaire(d, { minRac: d < 2 ? 1 : 0 }); },
  ex: EX10,
  build(p) {
    const { F, G } = paire(p), e = ensemble(paire(p).h, F.a, '<');
    if (!e) return null;
    const E = e.racines;
    return {
      html: `${stem10(F)}Résous graphiquement l’équation f(x) = g(x).`,
      visual: vis10(F, G),
      ...rRoots(E, x => x >= F.a && x <= F.b && Math.abs(F.f(x) - G.f(x)) < 1e-9, { none: 'Aucune solution', noneMsg: 'Regarde bien : les deux courbes se coupent-elles ?' }),
      hint: `Les solutions de f(x) = g(x) sont les abscisses des points où les deux courbes (f et g) se coupent. Repère ces points et lis leur abscisse sur l’axe horizontal${E.length === 0 ? ' (ou conclus qu’il n’y en a pas)' : ''}.`,
      solution: E.length ? `Les courbes de f et de g se coupent ${E.length === 1 ? 'en un point, d’abscisse' : 'en deux points, d’abscisses'} ${E.map(M).join(' et ')}. Les solutions de f(x) = g(x) sont donc ${E.map(M).join(' et ')}.`
        : 'Les courbes de f et de g ne se coupent pas : f(x) = g(x) n’a aucune solution.',
      afterVisual: vis10(F, G, ptsX(F, E)),
    };
  },
};

const mkIneq10 = inf => ({
  id: inf ? 'h-ineq-inf' : 'h-ineq-sup', dmin: inf ? 1 : 2, titre: inf ? 'résoudre f(x) < g(x)' : 'résoudre f(x) > g(x)',
  draw(d) {
    for (let t = 0; t < 400; t++) {
      const p = drawPaire(d, { minRac: d < 3 ? 1 : 0 }), rel = inf ? pick(['<', '≤']) : pick(['>', '≥']), { F, h } = paire(p), e = ensemble(h, F.a, rel);
      if (e && e.S.length <= 2 && !degenere(e.S) && (e.S.length >= 1)) return { ...p, rel };
    }
    throw new Error('h-ineq');
  },
  ex: inf ? { ...EX10, rel: '<' } : { ...EX10, rel: '≥' },
  build({ rel, ...p }) {
    const { F, G, h } = paire(p), e = ensemble(h, F.a, rel);
    if (!e) return null;
    const { S, racines } = e, strict = rel === '<' || rel === '>';
    return {
      html: `${stem10(F)}Résous graphiquement l’inéquation f(x) ${REL[rel]} g(x).`,
      visual: vis10(F, G),
      ...rIv(S, x => x >= F.a - 1e-12 && x <= F.b + 1e-12 && CMPF[rel](F.f(x), G.f(x))),
      hint: `Repère les abscisses où les deux courbes se coupent${racines.length ? ` (${racines.map(M).join(' ; ')})` : ''}, puis les endroits où la courbe de f est ${inf ? 'en dessous de' : 'au-dessus de'} celle de g. ${strict ? 'Inégalité stricte : les abscisses d’intersection sont exclues.' : 'Inégalité large : les abscisses d’intersection sont comprises.'}`,
      solution: `Les courbes se coupent aux abscisses ${racines.map(M).join(' et ')}. La courbe de f est ${inf ? 'en dessous de' : 'au-dessus de'} celle de g ${strict ? '(strictement) ' : '(ou sur elle) '}pour x dans ${fmtSet(S)}.`,
      afterVisual: vis10(F, G, ptsX(F, racines)),
    };
  },
});

const hNsol = {
  id: 'h-nsol', dmin: 3, titre: 'combien de points communs ?',
  draw(d) { return drawPaire(d, { minRac: 0, maxRac: 3 }); },
  ex: EX10C,
  build(p) {
    const { F, G, h } = paire(p), e = ensemble(h, F.a, '<');
    if (!e) return null;
    const n = e.racines.length;
    return {
      html: `${stem10(F)}Combien l’équation f(x) = g(x) a-t-elle de solutions ?`,
      visual: vis10(F, G),
      ...rNums([n], { tpl: 'Nombre de solutions : {0}', value: n }),
      verify: E => { let c = 0; for (let x = F.a; x <= F.b + 1e-9; x += 0.5) if (Math.abs(F.f(Math.min(x, F.b)) - G.f(Math.min(x, F.b))) < 1e-9) c++; return c === E[0]; },
      hint: `Compte les points où les deux courbes se coupent ou se touchent : chacun donne une solution de f(x) = g(x).`,
      solution: `Les courbes ont ${n} point${n > 1 ? 's' : ''} commun${n > 1 ? 's' : ''}${n ? `, d’abscisses ${e.racines.map(M).join(' ; ')}` : ''} : l’équation f(x) = g(x) a ${n} solution${n > 1 ? 's' : ''}.`,
      afterVisual: vis10(F, G, ptsX(F, e.racines)),
    };
  },
};

/* paires de fonctions de référence */
const PAIRES = [
  { f: x => x * x, g: x => x, ef: X2, eg: 'x', crit: [0, 1], ok: () => true, win: { xr: [-2, 3], yr: [-2, 6] }, nf: 'carré' },
  { f: x => x ** 3, g: x => x * x, ef: X3, eg: X2, crit: [0, 1], ok: () => true, win: { xr: [-2, 2], yr: [-5, 5] }, nf: 'cube' },
  { f: Math.sqrt, g: x => x, ef: R('x'), eg: 'x', crit: [0, 1], ok: x => x >= 0, win: { xr: [-1, 5], yr: [-1, 4] }, nf: 'racine carrée' },
  { f: x => 1 / x, g: x => x, ef: F(1, 'x'), eg: 'x', crit: [-1, 0, 1], ok: x => x !== 0, win: { xr: [-4, 4], yr: [-4, 4] }, nf: 'inverse' },
];
const hRef = {
  id: 'h-ref', dmin: 4, titre: 'comparer deux fonctions usuelles',
  draw() { return { i: ri(0, PAIRES.length - 1), rel: pick(['<', '≤', '>', '≥']) }; },
  ex: { i: 0, rel: '<' },
  build({ i, rel }) {
    const Pq = PAIRES[i], W = Pq.win, truth = x => Pq.ok(x) && CMPF[rel](Pq.f(x), Pq.g(x));
    const S = ensembleDe(Pq.crit, truth);
    const fs = [];
    if (i === 3) { fs.push({ f: Pq.f, dom: [W.xr[0], -0.2], l: 'f' }, { f: Pq.f, dom: [0.2, W.xr[1]] }); } else fs.push({ f: Pq.f, dom: [Pq.ok(-1) ? W.xr[0] : 0, W.xr[1]], l: 'f' });
    fs.push({ f: Pq.g, dom: [W.xr[0], W.xr[1]], l: 'g', c: '#c2255c' });
    const crit = Pq.crit.filter(c => Pq.ok(c));
    const vis = pts => graph({ ...W, fs, pts, aria: 'courbes de f et de g' });
    return {
      html: `On a tracé les courbes des fonctions f et g définies par f(x) = ${Pq.ef} et g(x) = ${Pq.eg}. Résous l’inéquation f(x) ${REL[rel]} g(x) sur l’ensemble de définition commun.`,
      visual: vis(),
      ...rIv(S, truth),
      hint: `Repère les abscisses où les deux courbes se coupent (${crit.map(M).join(' ; ')}), puis où la courbe de f est ${rel === '<' || rel === '≤' ? 'en dessous de' : 'au-dessus de'} celle de g. ${Pq.ok(0) ? '' : 'Attention : en x = 0 il y a un problème de définition.'}`,
      solution: `Les courbes se coupent aux abscisses ${crit.map(M).join(' et ')}. La courbe de f est ${rel === '<' || rel === '≤' ? 'en dessous de' : 'au-dessus de'} celle de g${rel === '≤' || rel === '≥' ? ' (ou sur elle)' : ''} pour x dans ${fmtSet(S)}.`,
      afterVisual: vis(crit.map(c => ({ x: c, y: Pq.f(c), px: true, c: ORANGE, l: M(c), ly: -12 }))),
    };
  },
};

const FORMS10 = [hCmp, hEq, mkIneq10(true), mkIneq10(false), hNsol, hRef];
const visu10 = (() => { const { F, G } = paire(EX10); return vis10(F, G, ptsX(F, [-3, 1])); })();

export const LV10 = niveau('Résolution graphique : f(x) = g(x) et f(x) < g(x)', FORMS10, {
  n: 10, classe: '2de',
  intro: 'Avec <b>deux courbes</b>, on compare directement les hauteurs : là où la courbe de f est plus haute que celle de g, on a f(x) &gt; g(x). Résoudre f(x) = g(x) ou f(x) &lt; g(x), c’est lire des abscisses sur le graphique.',
  def: '<b>f(x) = g(x)</b> : abscisses des points d’intersection des deux courbes. <b>f(x) &lt; g(x)</b> : abscisses des points où la courbe de f est <i>strictement en dessous</i> de celle de g. <b>f(x) &gt; g(x)</b> : au-dessus.',
  visuel: visu10,
  methode: [
    'Repère laquelle des deux courbes est f et laquelle est g (étiquettes).',
    '<b>Équation</b> : lis l’abscisse de chaque point d’intersection.',
    '<b>Inéquation</b> : entre deux intersections, regarde quelle courbe est au-dessus ; écris l’intervalle avec les bons crochets (ouverts pour &lt; et &gt;, fermés pour ≤ et ≥).',
    'N’oublie pas les extrémités de l’ensemble de définition.',
  ],
  warn: [
    'On lit des abscisses, pas des ordonnées : la solution de f(x) = g(x) est la valeur de x où les courbes se croisent.',
    'Pour f(x) &lt; g(x), c’est la courbe de f qui doit être en dessous : relis l’énoncé avant de répondre.',
    'Deux courbes peuvent se toucher sans se couper : ce point est solution de l’équation, pas de l’inéquation stricte.',
  ],
  retenir: 'f(x) = g(x) : intersections ; f(x) &lt; g(x) : f sous g ; f(x) &gt; g(x) : f au-dessus de g. On répond par des abscisses.',
});

/* =====================================================================================================
   Niveau 11 : tableau de signes d'un produit et d'un quotient
   ===================================================================================================== */
/** facteur ax + b de racine entière r : { a, b, r, s } */
const fac = (a, r) => ({ a, b: -a * r, r, s: lin(a, -a * r), mono: -a * r === 0 });
const parenth = f => (f.mono ? f.s : `(${f.s})`);
const prodTxt = fs => fs.map(parenth).join('');
const sg = v => (v > 0 ? '+' : '−');
const evalP = (fs, x) => fs.reduce((p, f) => p * (f.a * x + f.b), 1);
/** abscisses critiques triées */
const critiques = fs => [...new Set(fs.map(f => f.r))].sort((u, v) => u - v);
/** point de test dans chaque zone */
const tests = xs => [xs[0] - 1, ...xs.slice(1).map((x, i) => (xs[i] + x) / 2), xs[xs.length - 1] + 1];
/** signes (par zone) d'un facteur */
const zonesF = (f, xs) => tests(xs).map(t => sg(f.a * t + f.b));
/** tirage de facteurs à racines distinctes */
function tirerFacteurs(n, d, coefs) {
  for (;;) {
    const rs = []; while (rs.length < n) { const r = ri(-6, 6); if (!rs.includes(r)) rs.push(r); }
    const fs = rs.map(r => fac(d >= 3 ? pick(coefs) : pick([1, 1, -1]), r));
    if (fs.filter(f => f.mono).length <= 1) return fs;
  }
}
/** tableau de signes complet (facteurs puis produit ou quotient) pour la solution */
function tableauComplet(num, den) {
  const all = [...num, ...den], xs = critiques(all), L = [];
  const pole = xs.map(x => den.some(f => f.r === x));
  const lignes = all.map(f => ({ l: f.s, z: zonesF(f, xs), zero: xs.map(x => x === f.r) }));
  const zp = tests(xs).map((t, i) => sg(evalP(all, t)));
  lignes.push({ l: den.length ? 'quotient' : 'produit', z: zp, barre: pole });
  return { xs, html: tabSignes(xs, lignes), zp, pole };
}
const zoneTxt = (xs, z, nom = 'Le produit') => `${nom} est ` + z.map((s, i) => `${s === '+' ? 'positif' : 'négatif'} sur ${i === 0 ? ']−∞' : `]${M(xs[i - 1])}`} ; ${i === xs.length ? '+∞[' : `${M(xs[i])}[`}`).join(', ') + '.';

const pAffine = {
  id: 'p-affine', dmin: 0, titre: 'signe de ax + b',
  draw(d) { return { a: pick([1, 1, -1, 2, -2, 3, -3, 5, -5]), r: ri(-9, 9), rel: pick(['>', '<', '≥', '≤']) }; },
  ex: { a: 2, r: 3, rel: '>' },
  build({ a, r, rel }) {
    const f = fac(a, r), pos = (rel === '>' || rel === '≥') === (a > 0);
    const S = [pos ? I(r, rel === '≥' || rel === '≤', INF, 0) : I(-INF, 0, r, rel === '≥' || rel === '≤')];
    return {
      html: `Pour quelles valeurs de x a-t-on ${f.s} ${REL[rel]} 0 ?`,
      ...rIv(S, x => CMPF[rel](f.a * x + f.b, 0)),
      hint: `${f.s} s’annule pour x = ${M(r)}. ${a > 0 ? `Le coefficient de x est ${M(a)}, positif : l’expression est négative avant ${M(r)} et positive après` : `Le coefficient de x est ${M(a)}, négatif : l’expression est positive avant ${M(r)} et négative après`}. Choisis le bon côté, puis décide du crochet.`,
      solution: `${f.s} = 0 pour x = ${M(r)}. Comme le coefficient de x est ${a > 0 ? 'positif' : 'négatif'}, ${f.s} est ${a > 0 ? 'négatif avant' : 'positif avant'} ${M(r)} et ${a > 0 ? 'positif après' : 'négatif après'}. Donc ${f.s} ${REL[rel]} 0 pour x dans ${fmtSet(S)}.`,
    };
  },
};

const pSigneEn = {
  id: 'p-signe-en', dmin: 0, titre: 'signe d’un produit en un nombre',
  draw(d) { const fs = tirerFacteurs(2, d, [2, 3, -2, -3]); let x0 = ri(-7, 7); if (chance(0.15)) x0 = fs[0].r; return { fs: fs.map(f => [f.a, f.r]), x0 }; },
  ex: { fs: [[1, 2], [1, -3]], x0: 1 },
  build({ fs: raw, x0 }) {
    const fs = raw.map(([a, r]) => fac(a, r)), v = evalP(fs, x0), bon = v > 0 ? 'positif' : v < 0 ? 'négatif' : 'nul';
    const vals = fs.map(f => f.a * x0 + f.b);
    return {
      html: `Soit f(x) = ${prodTxt(fs)}. Quel est le signe de f(${M(x0)}) ?`,
      ...rChoice(['positif', 'négatif', 'nul'].map(l => ({ l, ok: l === bon, why: `${fs.map((f, i) => `${f.s} vaut ${M(vals[i])} pour x = ${M(x0)}`).join(' et ')} : leur produit vaut ${M(v)}.` })), { ordre: true, indep: Math.sign(fs.reduce((p, f) => p * (f.a * x0 + f.b), 1)) > 0 ? 'positif' : Math.sign(fs.reduce((p, f) => p * (f.a * x0 + f.b), 1)) < 0 ? 'négatif' : 'nul' }),
      hint: `Remplace x par ${M(x0)} dans chaque facteur : ${fs.map(f => `${f.s}`).join(' et ')}. Donne le signe de chacun, puis applique la règle des signes pour le produit.`,
      solution: `Pour x = ${M(x0)} : ${fs.map((f, i) => `${f.s} = ${M(vals[i])}`).join(' et ')}. Le produit est ${v === 0 ? 'nul (un facteur est nul)' : v > 0 ? 'positif' : 'négatif'}${v !== 0 ? ` (${vals.filter(w => w < 0).length} facteur${vals.filter(w => w < 0).length > 1 ? 's' : ''} négatif${vals.filter(w => w < 0).length > 1 ? 's' : ''})` : ''}.`,
    };
  },
};

const pTable = {
  id: 'p-table', dmin: 1, titre: 'tableau de signes d’un produit',
  draw(d) { return { fs: tirerFacteurs(2, d, [2, 3, 4, -2, -3]).map(f => [f.a, f.r]) }; },
  ex: { fs: [[1, 2], [1, -3]] },
  build({ fs: raw }) {
    const fs = raw.map(([a, r]) => fac(a, r)), xs = critiques(fs), T = tableauComplet(fs, []);
    return {
      html: `Dresse le tableau de signes de${big(fx('f', prodTxt(fs)))}Complète la ligne de f(x), zone par zone.`,
      ...rTable(xs, T.zp, { label: 'f(x)' }),
      verify: E => E.every((s, i) => sg(evalP(fs, tests(xs)[i])) === s),
      hint: `Cherche d’abord les valeurs de x qui annulent chaque facteur : ${fs.map(f => `${f.s} = 0`).join(' ; ')}. Ce sont les colonnes (${xs.map(M).join(' et ')}). Puis donne le signe de chaque facteur dans chaque zone et applique la règle des signes.`,
      solution: `${fs.map(f => `${f.s} = 0 pour x = ${M(f.r)}`).join(' ; ')}. Tableau complet :${T.html}${zoneTxt(xs, T.zp)}`,
    };
  },
};

const pTable3 = {
  id: 'p-table3', dmin: 4, titre: 'tableau de signes d’un produit de trois facteurs',
  draw(d) { return { fs: tirerFacteurs(3, d, [2, 3, -2, -3, -1]).map(f => [f.a, f.r]) }; },
  ex: { fs: [[1, -2], [-1, 1], [2, 4]] },
  build({ fs: raw }) {
    const fs = raw.map(([a, r]) => fac(a, r)), xs = critiques(fs), T = tableauComplet(fs, []);
    return {
      html: `Dresse le tableau de signes de${big(fx('f', prodTxt(fs)))}Complète la ligne de f(x), zone par zone.`,
      ...rTable(xs, T.zp, { label: 'f(x)' }),
      verify: E => E.every((s, i) => sg(evalP(fs, tests(xs)[i])) === s),
      hint: `Trois facteurs, donc trois valeurs qui annulent : ${fs.map(f => `${f.s} = 0`).join(' ; ')}. Range ${xs.map(M).join(', ')} dans l’ordre croissant, puis fais le signe de chaque facteur par zone (attention aux coefficients négatifs).`,
      solution: `${fs.map(f => `${f.s} = 0 pour x = ${M(f.r)}`).join(' ; ')}. Tableau complet :${T.html}Chaque fois qu’on passe un zéro, le signe du produit change.`,
    };
  },
};

const pIneq = {
  id: 'p-ineq', dmin: 2, titre: 'résoudre une inéquation produit',
  draw(d) { return { fs: tirerFacteurs(d >= 4 && chance(0.4) ? 3 : 2, d, [2, 3, -2, -3]).map(f => [f.a, f.r]), rel: pick(['>', '<', '≥', '≤']) }; },
  ex: { fs: [[1, 2], [1, -3]], rel: '>' },
  build({ fs: raw, rel }) {
    const fs = raw.map(([a, r]) => fac(a, r)), xs = critiques(fs), T = tableauComplet(fs, []);
    const S = ensembleDe(xs, x => CMPF[rel](evalP(fs, x), 0));
    if (!S.length || S.length > 2 || degenere(S)) return null;
    return {
      html: `Résous l’inéquation${big(`${prodTxt(fs)} ${REL[rel]} 0`)}`,
      ...rIv(S, x => CMPF[rel](evalP(fs, x), 0)),
      hint: `Dresse d’abord le tableau de signes du produit ${prodTxt(fs)} (zéros : ${xs.map(M).join(' et ')}), puis garde les zones où le signe est ${rel === '>' || rel === '≥' ? '+' : '−'}. Les zéros eux-mêmes sont ${rel === '≥' || rel === '≤' ? 'inclus' : 'exclus'}.`,
      solution: `Tableau de signes de ${prodTxt(fs)} :${T.html}On garde les zones « ${rel === '>' || rel === '≥' ? '+' : '−'} »${rel === '≥' || rel === '≤' ? ' et les zéros' : ''} : S = ${fmtSet(S)}.`,
    };
  },
};

const tirerQuot = (d, n3) => {
  for (;;) {
    const fs = tirerFacteurs(n3 ? 3 : 2, d, [2, 3, -2, -3]);
    const nb = n3 ? pick([1, 2]) : 1, num = fs.slice(0, nb), den = fs.slice(nb);
    return { num: num.map(f => [f.a, f.r]), den: den.map(f => [f.a, f.r]) };
  }
};
const quotTxt = (num, den) => F(num.length === 1 && num[0].mono ? num[0].s : prodTxt(num).replace(/^\((.*)\)$/, num.length === 1 ? '$1' : '($1)'), den.length === 1 && den[0].mono ? den[0].s : prodTxt(den).replace(/^\((.*)\)$/, den.length === 1 ? '$1' : '($1)'));
const evalQ = (num, den, x) => evalP(num, x) / evalP(den, x);

const qTable = {
  id: 'q-table', dmin: 2, titre: 'tableau de signes d’un quotient',
  draw(d) { return tirerQuot(d, d >= 4 && chance(0.5)); },
  ex: { num: [[1, 2]], den: [[1, -3]] },
  build({ num: rn, den: rd }) {
    const num = rn.map(([a, r]) => fac(a, r)), den = rd.map(([a, r]) => fac(a, r)), all = [...num, ...den], xs = critiques(all), T = tableauComplet(num, den);
    return {
      html: `Dresse le tableau de signes de${big(fx('f', quotTxt(num, den)))}Complète la ligne de f(x), zone par zone (la double barre ‖ marque la valeur interdite).`,
      ...rTable(xs, T.zp, { label: 'f(x)', barre: T.pole }),
      verify: E => E.every((s, i) => sg(evalQ(num, den, tests(xs)[i])) === s),
      hint: `Cherche les valeurs qui annulent le numérateur (${num.map(f => `${f.s} = 0`).join(' ; ')}) et celles qui annulent le dénominateur (${den.map(f => `${f.s} = 0`).join(' ; ')}, valeurs interdites ‖). Fais le signe de chaque facteur par zone, puis la règle des signes pour le quotient.`,
      solution: `Numérateur nul en ${num.map(f => M(f.r)).join(' ; ')} ; dénominateur nul en ${den.map(f => M(f.r)).join(' ; ')} (valeur interdite, double barre). Tableau complet :${T.html}${zoneTxt(xs, T.zp, 'Le quotient')}`,
    };
  },
};

const qSigneEn = {
  id: 'q-signe-en', dmin: 2, titre: 'signe d’un quotient en un nombre',
  draw(d) { const q = tirerQuot(d, false); let x0 = ri(-7, 7); if (chance(0.15)) x0 = pick([q.num[0][1], q.den[0][1]]); return { ...q, x0 }; },
  ex: { num: [[1, 2]], den: [[1, -3]], x0: 5 },
  build({ num: rn, den: rd, x0 }) {
    const n = fac(...rn[0]), dn = fac(...rd[0]), vn = n.a * x0 + n.b, vd = dn.a * x0 + dn.b;
    const bon = vd === 0 ? 'non défini' : vn === 0 ? 'nul' : vn * vd > 0 ? 'positif' : 'négatif';
    return {
      html: `Soit f(x) = ${quotTxt([n], [dn])}. Quel est le signe de f(${M(x0)}) ?`,
      ...rChoice(['positif', 'négatif', 'nul', 'non défini'].map(l => ({ l, ok: l === bon, why: `Pour x = ${M(x0)} : ${n.s} = ${M(vn)} et ${dn.s} = ${M(vd)}.` })), { ordre: true, indep: vd === 0 ? 'non défini' : vn / vd > 0 ? 'positif' : vn / vd < 0 ? 'négatif' : 'nul' }),
      hint: `Remplace x par ${M(x0)} dans le numérateur ${n.s} et dans le dénominateur ${dn.s}. Un dénominateur nul rend f(${M(x0)}) impossible à calculer ; sinon, compare les signes.`,
      solution: `Pour x = ${M(x0)} : numérateur ${n.s} = ${M(vn)}, dénominateur ${dn.s} = ${M(vd)}. ${vd === 0 ? 'Le dénominateur est nul : f(' + M(x0) + ') n’est pas défini.' : vn === 0 ? 'Le numérateur est nul : le quotient est nul.' : vn * vd > 0 ? 'Numérateur et dénominateur ont le même signe : le quotient est positif.' : 'Numérateur et dénominateur sont de signes contraires : le quotient est négatif.'}`,
    };
  },
};

const qIneq = {
  id: 'q-ineq', dmin: 3, titre: 'résoudre une inéquation quotient',
  draw(d) { return { ...tirerQuot(d, d >= 5 && chance(0.4)), rel: pick(['>', '<', '≥', '≤']) }; },
  ex: { num: [[1, 2]], den: [[1, -3]], rel: '≤' },
  build({ num: rn, den: rd, rel }) {
    const num = rn.map(([a, r]) => fac(a, r)), den = rd.map(([a, r]) => fac(a, r)), all = [...num, ...den], xs = critiques(all), T = tableauComplet(num, den);
    const truth = x => { if (den.some(f => f.a * x + f.b === 0)) return false; return CMPF[rel](evalQ(num, den, x), 0); };
    const S = ensembleDe(xs, truth);
    if (!S.length || S.length > 2 || degenere(S)) return null;
    return {
      html: `Résous l’inéquation${big(`${quotTxt(num, den)} ${REL[rel]} 0`)}`,
      ...rIv(S, truth),
      hint: `Dresse le tableau de signes du quotient (zéros : ${num.map(f => M(f.r)).join(' ; ')} ; valeurs interdites : ${den.map(f => M(f.r)).join(' ; ')}), puis garde les zones « ${rel === '>' || rel === '≥' ? '+' : '−'} ». Une valeur interdite n’est jamais solution, même avec ≤ ou ≥.`,
      solution: `Tableau de signes de ${quotTxt(num, den)} :${T.html}On garde les zones « ${rel === '>' || rel === '≥' ? '+' : '−'} »${rel === '≥' || rel === '≤' ? ', avec les zéros du numérateur mais jamais la valeur interdite' : ''} : S = ${fmtSet(S)}.`,
    };
  },
};

const FORMS11 = [pAffine, pSigneEn, pTable, pIneq, qTable, qSigneEn, qIneq, pTable3];
const visu11 = (() => { const T = tableauComplet([fac(1, 2)], [fac(1, -3)]); return `${T.html}${ligneSignes(T.xs, T.zp, T.pole)}`; })();

export const LV11 = niveau('Tableau de signes d’un produit et d’un quotient', FORMS11, {
  n: 11, classe: '2de',
  intro: 'Pour savoir où un produit ou un quotient est positif ou négatif, on étudie le signe de <b>chaque facteur</b>, puis on les combine avec la <b>règle des signes</b> dans un tableau de signes.',
  def: '<b>Signe de ax + b.</b> Il s’annule en x = −b/a. Si a &gt; 0, il est négatif avant ce zéro et positif après ; si a &lt; 0, c’est l’inverse. <b>Produit ou quotient</b> : on met une ligne par facteur, puis une ligne pour le résultat (règle des signes). Un quotient n’est pas défini quand le dénominateur est nul : on le note par une double barre ‖.',
  visuel: visu11,
  methode: [
    'Cherche les valeurs de x qui annulent chaque facteur et range-les dans l’ordre croissant : ce sont les colonnes.',
    'Pour chaque facteur, écris son signe dans chaque zone (en regardant le signe du coefficient de x).',
    'Dernière ligne : applique la règle des signes zone par zone. Mets 0 là où le produit s’annule, ‖ là où le dénominateur s’annule.',
    'Pour une inéquation, garde les zones demandées ; les zéros du numérateur sont inclus avec ≤ ou ≥, les valeurs interdites jamais.',
  ],
  warn: [
    'Ne multiplie pas « au pif » : un facteur comme 3 − x est <b>positif avant 3</b> et négatif après (coefficient de x négatif).',
    'Un quotient n’est pas défini quand le dénominateur est nul : ‖ dans le tableau, crochet ouvert dans la réponse.',
    'x² &lt; 9 ou (x − 2)(x + 3) &gt; 0 ne se résolvent pas en regardant un seul facteur : il faut le tableau complet.',
  ],
  retenir: 'racines des facteurs → colonnes ; signe de chaque facteur → règle des signes → ligne finale ; ‖ pour une valeur interdite.',
});

/* =====================================================================================================
   Niveau 12 : défis (mélange, parité, problèmes)
   ===================================================================================================== */
const PARITE = [
  { e: 'x', f: x => x, p: 'impaire' }, { e: X2, f: x => x * x, p: 'paire' }, { e: X3, f: x => x ** 3, p: 'impaire' },
  { e: 'x<sup>4</sup>', f: x => x ** 4, p: 'paire' }, { e: 'x<sup>5</sup>', f: x => x ** 5, p: 'impaire' }, { e: 'x<sup>6</sup>', f: x => x ** 6, p: 'paire' },
  { e: F(1, 'x'), f: x => 1 / x, p: 'impaire' }, { e: F(1, X2), f: x => 1 / (x * x), p: 'paire' }, { e: F(1, X3), f: x => 1 / x ** 3, p: 'impaire' }, { e: R('x'), f: Math.sqrt, p: 'ni' },
];
const NOMP = { paire: 'paire', impaire: 'impaire', ni: 'ni paire ni impaire' };
const parNum = (f, def = true) => { const xs = [0.5, 1, 2, 3]; if (!def) return 'ni'; return xs.every(x => Math.abs(f(-x) - f(x)) < 1e-9) ? 'paire' : xs.every(x => Math.abs(f(-x) + f(x)) < 1e-9) ? 'impaire' : 'ni'; };
const NOMS_F = ['f', 'g', 'h'];

const mPariteRef = {
  id: 'm-parite-ref', dmin: 0, titre: 'parité d’une fonction usuelle',
  draw() { return { i: ri(0, PARITE.length - 1), nom: pick(NOMS_F) }; },
  ex: { i: 2, nom: 'f' },
  build({ i, nom }) {
    const Pq = PARITE[i], v = x => `${nom}(${M(x)}) = ${M(r6(Pq.f(x)))}`;
    const def = Pq.p !== 'ni';
    const why = {
      paire: def ? `Pour être paire, il faudrait ${nom}(−2) = ${nom}(2) : ici ${v(-2)} et ${v(2)}.` : `Pour être paire, il faudrait ${nom}(−x) = ${nom}(x), mais ${nom}(−4) n’existe pas.`,
      impaire: def ? `Pour être impaire, il faudrait ${nom}(−2) = −${nom}(2) : ici ${v(-2)} et ${v(2)}.` : `Pour être impaire, il faudrait ${nom}(−x) = −${nom}(x), mais ${nom}(−4) n’existe pas.`,
      ni: `Calcule ${nom}(−2) et ${nom}(2) : ${v(-2)} et ${v(2)} sont ${Pq.p === 'paire' ? 'égales' : 'opposées'}, donc la fonction est ${Pq.p}.`,
    };
    return {
      html: `Soit ${nom} la fonction définie par${big(fx(nom, Pq.e))}La fonction ${nom} est-elle paire, impaire, ou ni l’une ni l’autre ?`,
      ...rChoice(['paire', 'impaire', 'ni'].map(k => ({ l: NOMP[k], ok: k === Pq.p, why: why[k] })), { ordre: true, indep: NOMP[parNum(Pq.f, def)] }),
      hint: `Compare ${nom}(−2) et ${nom}(2) : sont-elles égales (paire), opposées (impaire) ? Et ${nom}(−2) existe-t-elle ? Pour une puissance de x, regarde si l’exposant est pair ou impair.`,
      solution: Pq.p === 'ni' ? `${nom} n’est définie que pour x ≥ 0 : ${nom}(−4) n’existe pas alors que ${nom}(4) existe. L’ensemble de définition n’est pas symétrique par rapport à 0 : ${nom} est ni paire ni impaire.`
        : `${v(-2)} et ${v(2)} : ${Pq.p === 'paire' ? `elles sont égales, ${nom}(−x) = ${nom}(x)` : `elles sont opposées, ${nom}(−x) = −${nom}(x)`}. ${nom} est ${Pq.p}${Pq.p === 'paire' ? ' (sa courbe est symétrique par rapport à l’axe des ordonnées)' : ' (sa courbe est symétrique par rapport à l’origine)'}.`,
    };
  },
};

const mkVal = paire => ({
  id: paire ? 'm-paire-val' : 'm-impaire-val', dmin: paire ? 1 : 2, titre: `image d’un opposé (fonction ${paire ? 'paire' : 'impaire'})`,
  draw() { return { a: ri(1, 9), y: nz(-20, 20), sens: chance(0.5) }; },
  ex: { a: 3, y: 7, sens: true },
  build({ a, y, sens }) {
    const x0 = sens ? a : -a, x1 = -x0, rep = paire ? y : -y;
    return {
      html: `Soit f une fonction ${paire ? 'paire' : 'impaire'} telle que f(${M(x0)}) = ${M(y)}. Que vaut f(${M(x1)}) ?`,
      ...rNums([rep], { tpl: `f(${M(x1)}) = {0}`, value: rep, msg: v => (v[0] === (paire ? -y : y) ? `${paire ? 'Une fonction paire vérifie f(−x) = f(x) : les opposés ont la même image.' : 'Une fonction impaire vérifie f(−x) = −f(x) : les opposés ont des images opposées.'}` : '') }),
      hint: `${M(x0)} et ${M(x1)} sont opposés. Pour une fonction ${paire ? 'paire' : 'impaire'}, ${paire ? 'f(−x) = f(x) : deux nombres opposés ont la même image' : 'f(−x) = −f(x) : deux nombres opposés ont des images opposées'}. Utilise f(${M(x0)}) = ${M(y)}.`,
      solution: `${paire ? `f est paire : f(−x) = f(x), donc f(${M(x1)}) = f(${M(x0)}) = ${M(y)}.` : `f est impaire : f(−x) = −f(x), donc f(${M(x1)}) = −f(${M(x0)}) = −${P(y)} = ${M(-y)}.`}`,
    };
  },
});

const POS = { sqrt: { l: R('x'), f: Math.sqrt, r: 0 }, x: { l: 'x', f: x => x, r: 1 }, x2: { l: X2, f: x => x * x, r: 2 }, x3: { l: X3, f: x => x ** 3, r: 3 } };
const mPosition = {
  id: 'm-position', dmin: 2, titre: 'position relative de x, x², x³ et √x',
  draw() { const k = Object.keys(POS); let a = pick(k), b = pick(k); while (b === a) b = pick(k); return { a, b, haut: chance(0.5) }; },
  ex: { a: 'x2', b: 'x3', haut: true },
  build({ a, b, haut }) {
    const A = POS[a], B = POS[b], x0 = haut ? 4 : 0.25;
    const s = haut ? signe(A.r - B.r) : signe(B.r - A.r);
    return {
      html: `${haut ? 'Pour x &gt; 1' : 'Pour 0 &lt; x &lt; 1'}, compare ${A.l} et ${B.l}.`,
      ...rCmp(s, { value: A.f(x0) - B.f(x0), msg: haut ? 'Pour x > 1, les puissances plus grandes donnent des nombres plus grands (et √x est le plus petit).' : 'Entre 0 et 1, c’est l’inverse : multiplier deux nombres plus petits que 1 donne un nombre encore plus petit.' }),
      hint: `Pour comparer ${A.l} et ${B.l}, teste avec un nombre ${haut ? 'plus grand que 1' : 'entre 0 et 1'} : prends x = ${M(x0)} et calcule ${A.l.replace('x', M(x0))} et ${B.l.replace('x', M(x0))}, puis demande-toi si le résultat change quand x varie dans la même zone.`,
      solution: `Prenons x = ${M(x0)} : ${A.l.replace(/x/g, M(x0))} = ${M(r6(A.f(x0)))} et ${B.l.replace(/x/g, M(x0))} = ${M(r6(B.f(x0)))}. ${haut ? 'Pour x > 1, on a √x &lt; x &lt; x² &lt; x³' : 'Pour 0 &lt; x &lt; 1, on a x³ &lt; x² &lt; x &lt; √x'} : ${A.l} ${sgnTxt[s]} ${B.l}.`,
    };
  },
};

/* fonction affine ou puissance : parité d'une expression */
const TERMES = { 2: X2, 4: 'x<sup>4</sup>', 3: X3, 1: 'x', '-1': 'inv' };
function exprTxt(ts, c) {
  const l = ts.map(([k, p]) => (p === -1 ? [k < 0 ? -1 : 1, F(Math.abs(k), 'x')] : [k, TERMES[p]]));
  if (c) l.push([c, '']);
  return terms(l);
}
const evalE = (ts, c, x) => ts.reduce((s, [k, p]) => s + k * x ** p, 0) + c;
const mPariteExpr = {
  id: 'm-parite-expr', dmin: 2, titre: 'parité d’une expression',
  draw(d) {
    const cible = pick(['paire', 'impaire', 'ni']);
    const pairs = d >= 4 ? [2, 4] : [2], impairs = d >= 4 ? [1, 3, -1] : [1, 3];
    const coef = () => nz(-4, 4);
    let ts = [], c = 0;
    if (cible === 'paire') { ts = [[coef(), pick(pairs)]]; c = chance(0.6) ? nz(-6, 6) : 0; if (chance(0.4) && d >= 3) ts.push([coef(), 4]); }
    else if (cible === 'impaire') { ts = [[coef(), pick(impairs)]]; if (chance(0.5)) ts.push([coef(), pick(impairs.filter(p => p !== ts[0][1]))]); }
    else { const t = pick(['mix', 'cst']); if (t === 'mix') ts = [[coef(), pick(pairs)], [coef(), pick(impairs.filter(p => p !== -1))]]; else { ts = [[coef(), pick(impairs.filter(p => p !== -1))]]; c = nz(-6, 6); } }
    const un = ts.map(([, p]) => p); if (new Set(un).size !== un.length) return this.draw(d);
    return { ts, c };
  },
  ex: { ts: [[1, 3], [-4, 1]], c: 0 },
  build({ ts, c }) {
    const f = x => evalE(ts, c, x), bon = parNum(f), e = exprTxt(ts, c);
    const ts2 = ts.map(([k, p]) => [p % 2 === 0 ? k : -k, p]), em = exprTxt(ts2, c), eo = exprTxt(ts.map(([k, p]) => [-k, p]), -c);
    const v2 = M(f(2)), vm2 = M(f(-2));
    const why = {
      paire: `Pour être paire, il faudrait f(−2) = f(2) : ici f(−2) = ${vm2} et f(2) = ${v2}.`,
      impaire: `Pour être impaire, il faudrait f(−2) = −f(2) : ici f(−2) = ${vm2} et f(2) = ${v2}.`,
      ni: `Ici f(−x) = ${bon === 'paire' ? 'f(x)' : '−f(x)'} : vérifie avec f(−2) = ${vm2} et f(2) = ${v2}.`,
    };
    return {
      html: `Soit f la fonction définie sur ℝ${ts.some(([, p]) => p === -1) ? ' privé de 0' : ''} par${big(fx('f', e))}La fonction f est-elle paire, impaire, ou ni l’une ni l’autre ?`,
      ...rChoice(['paire', 'impaire', 'ni'].map(k => ({ l: NOMP[k], ok: k === bon, why: why[k] })), { ordre: true, indep: NOMP[bon] }),
      hint: `Calcule f(−x) en remplaçant x par −x dans ${e} : une puissance paire de −x donne la même chose que x, une puissance impaire change le signe. Compare ensuite f(−x) avec f(x), puis avec −f(x).`,
      solution: `f(−x) = ${em}. ${bon === 'paire' ? 'C’est exactement f(x) : f est paire.' : bon === 'impaire' ? `C’est l’opposé de f(x) = ${e}, soit −f(x) = ${eo} : f est impaire.` : `Ce n’est ni f(x) ni −f(x) = ${eo} : f n’est ni paire ni impaire.`}`,
    };
  },
};

const compteSol = (R, k) => {
  let n = 0, prev = null;
  for (let x = -160; x <= 160.0001; x = Math.round((x + 0.05) * 1e6) / 1e6) {
    if (!R.ok(x)) { prev = null; continue; }
    const e = R.f(x) - k, s = Math.abs(e) < 1e-9 ? 0 : Math.sign(e);
    if (s === 0) n++;
    else if (prev !== null && prev !== 0 && prev !== s) n++;
    prev = s;
  }
  return n;
};
const mNbAnt = {
  id: 'm-nbant', dmin: 3, titre: 'combien d’antécédents ?',
  draw() { const cle = pick(CLES); return { cle, k: cle === 'inverse' ? pick([1, -1, 2, -2, 3, -3, 5, -5, 10, 0, 0.5, -0.5]) : pick([0, 0, ...Array.from({ length: 12 }, (_, i) => i + 1), ...Array.from({ length: 12 }, (_, i) => -(i + 1))]) }; },
  ex: { cle: 'racine', k: -3 },
  build({ cle, k }) {
    const n = { carre: k > 0 ? 2 : k === 0 ? 1 : 0, inverse: k === 0 ? 0 : 1, racine: k < 0 ? 0 : 1, cube: 1 }[cle];
    return {
      html: `Combien le nombre <b>${M(k)}</b> a-t-il d’antécédents par la fonction ${REF[cle].nom} ?`,
      ...rNums([n], { tpl: 'Nombre d’antécédents : {0}', value: n }),
      verify: E => compteSol(REF[cle], k) === E[0],
      hint: `Imagine la courbe de la fonction ${REF[cle].nom} (f(x) = ${REF[cle].expr}) et la droite horizontale y = ${M(k)} : combien de fois la coupe-t-elle ?`,
      solution: { carre: k > 0 ? `${X2} = ${M(k)} a deux solutions opposées : ${M(k)} a 2 antécédents.` : k === 0 ? `${X2} = 0 n’a que la solution 0 : 1 antécédent.` : `Un carré n’est jamais négatif : ${M(k)} n’a aucun antécédent.`,
        inverse: k === 0 ? `${F(1, 'x')} n’est jamais nul : 0 n’a aucun antécédent.` : `${F(1, 'x')} = ${M(k)} a une seule solution, x = ${F(1, M(k))} : 1 antécédent.`,
        racine: k < 0 ? `Une racine carrée n’est jamais négative : ${M(k)} n’a aucun antécédent.` : `${R('x')} = ${M(k)} a une seule solution, x = ${carre(k)} : 1 antécédent.`,
        cube: `${X3} = ${M(k)} a toujours une seule solution : 1 antécédent.` }[cle],
    };
  },
};

const mCmp = {
  id: 'm-cmp', dmin: 3, titre: 'comparer deux images (toutes les fonctions)',
  draw() {
    const cle = pick(CLES); let a, b;
    const bon = v => (cle === 'racine' ? ri(0, 20) : cle === 'inverse' ? pick([-1, 1]) * ri(2, 8) : nz(-8, 8));
    do { a = bon(); b = bon(); } while (a >= b);
    return { cle, a, b };
  },
  ex: { cle: 'inverse', a: -2, b: 4 },
  build({ cle, a, b }) {
    const f = REF[cle].f, s = signe(f(a) - f(b));
    const T = {
      carre: `Regarde le signe de ${M(a)} et de ${M(b)} : la fonction carré n’est pas croissante partout.`,
      inverse: `Regarde si ${M(a)} et ${M(b)} sont du même côté de 0 : la fonction inverse est décroissante de chaque côté, mais pas sur la réunion.`,
      racine: `Compare d’abord ${M(a)} et ${M(b)} : dans quel sens varie la fonction racine carrée ?`,
      cube: `Compare d’abord ${M(a)} et ${M(b)} : dans quel sens varie la fonction cube, et sur quel intervalle ?`,
    }[cle];
    const A = cle === 'carre' ? carre(a) : cle === 'cube' ? cube(a) : cle === 'inverse' ? F(1, M(a)) : R(M(a));
    const B = cle === 'carre' ? carre(b) : cle === 'cube' ? cube(b) : cle === 'inverse' ? F(1, M(b)) : R(M(b));
    return {
      html: `On sait que ${M(a)} &lt; ${M(b)}. Compare ${A} et ${B}.`,
      ...rCmp(s, { value: f(a) - f(b), msg: 'Regarde bien les signes de a et de b et le sens de variation de la fonction sur l’intervalle qui les contient.' }),
      hint: T,
      solution: { carre: a < 0 && b > 0 ? `${M(a)} et ${M(b)} sont de signes différents : on calcule ${carre(a)} = ${M(a * a)} et ${carre(b)} = ${M(b * b)}.` : b <= 0 ? `Sur ]−∞ ; 0], le carré est décroissant : il renverse l’ordre.` : `Sur [0 ; +∞[, le carré est croissant : il conserve l’ordre.`,
        inverse: a < 0 && b > 0 ? `${F(1, M(a))} est négatif et ${F(1, M(b))} positif : le négatif est plus petit.` : `La fonction inverse est décroissante de ce côté de 0 : elle renverse l’ordre.`,
        racine: 'La fonction racine carrée est croissante : elle conserve l’ordre.', cube: 'La fonction cube est croissante sur ℝ : elle conserve l’ordre.' }[cle] + ` Donc ${A} ${sgnTxt[s]} ${B}.`,
    };
  },
};

const pbAire = {
  id: 'prob-aire', dmin: 3, titre: 'problème : aire d’un carré',
  draw() { return { n: ri(3, 12), rel: pick(['<', '≤', '>', '≥']) }; },
  ex: { n: 7, rel: '<' },
  build({ n, rel }) {
    const A = n * n, S = [rel === '<' ? I(0, 0, n, 0) : rel === '≤' ? I(0, 0, n, 1) : rel === '>' ? I(n, 0, INF, 0) : I(n, 1, INF, 0)];
    return {
      html: `Un carré de côté c centimètres a pour aire c<sup>2</sup> cm<sup>2</sup>. Pour quelles valeurs de c a-t-on c<sup>2</sup> ${REL[rel]} ${M(A)} ?`,
      ...rIv(S, x => x > 0 && CMPF[rel](x * x, A)),
      hint: `Le côté c est un nombre strictement positif. Résous c<sup>2</sup> ${REL[rel]} ${M(A)} comme avec la parabole (les solutions de c<sup>2</sup> = ${M(A)} sont ${M(-n)} et ${M(n)}), puis garde seulement les valeurs positives.`,
      solution: `c<sup>2</sup> = ${M(A)} pour c = ${M(n)} (ou c = ${M(-n)}, impossible car un côté est positif). ${rel === '<' || rel === '≤' ? `c<sup>2</sup> ${REL[rel]} ${M(A)} équivaut à c entre ${M(-n)} et ${M(n)}` : `c<sup>2</sup> ${REL[rel]} ${M(A)} équivaut à c ${rel === '>' ? '&gt;' : '≥'} ${M(n)} ou c ≤ ${M(-n)}`}, et c &gt; 0 : S = ${fmtSet(S)}.`,
    };
  },
};

const pbCube = {
  id: 'prob-cube', dmin: 3, titre: 'problème : arête d’un cube',
  draw() { return { n: ri(2, 12) }; },
  ex: { n: 5 },
  build({ n }) {
    const V = n ** 3;
    return {
      html: `Un cube d’arête a centimètres a pour volume a<sup>3</sup> cm<sup>3</sup>. Quelle est l’arête d’un cube de volume ${ent(V)} cm<sup>3</sup> ?`,
      ...rNums([n], { tpl: 'Arête : {0} cm', value: n }),
      verify: E => Math.abs(E[0] ** 3 - V) < 1e-9,
      hint: `On cherche le nombre a tel que a<sup>3</sup> = ${ent(V)}. Essaie de petits entiers : à quel entier faut-il multiplier trois fois par lui-même pour obtenir ${ent(V)} ?`,
      solution: `a<sup>3</sup> = ${ent(V)}. Comme ${n} × ${n} × ${n} = ${ent(V)}, l’arête vaut ${n} cm (c’est l’antécédent de ${ent(V)} par la fonction cube).`,
    };
  },
};

const VIT = { 120: [40, 60, 80, 100], 240: [30, 48, 60, 80, 100, 120, 150], 180: [36, 45, 60, 90, 120], 360: [60, 72, 90, 120, 180] };
const pbInverse = {
  id: 'prob-inverse', dmin: 4, titre: 'problème : durée d’un trajet',
  draw() { const D = pick(Object.keys(VIT).map(Number)), L = VIT[D], i = ri(0, L.length - 2), j = ri(i + 1, L.length - 1); return { D, v1: L[i], v2: L[j] }; },
  ex: { D: 120, v1: 60, v2: 80 },
  build({ D, v1, v2 }) {
    const lo = r6(D / v2), hi = r6(D / v1);
    return {
      html: `Une voiture parcourt ${M(D)} km à la vitesse constante v (en km/h). La durée du trajet, en heures, est t = ${F(M(D), 'v')}. Sachant que ${M(v1)} ≤ v ≤ ${M(v2)}, encadre t.`,
      ...rNums([lo, hi], { tpl: '{0} ≤ t ≤ {1}', value: hi, msg: v => (v[0] === hi && v[1] === lo ? 'Plus la vitesse est grande, plus la durée est petite : le plus petit nombre va à gauche.' : '') }),
      verify: E => { let l = Infinity, h = -Infinity; for (let v = v1; v <= v2 + 1e-9; v += 0.5) { l = Math.min(l, D / v); h = Math.max(h, D / v); } return Math.abs(l - E[0]) < 0.02 && Math.abs(h - E[1]) < 0.02; },
      hint: `La durée ${F(M(D), 'v')} est une fonction décroissante de v (fonction inverse multipliée par ${M(D)}) : elle renverse l’ordre. Calcule la durée aux deux vitesses ${M(v1)} et ${M(v2)} km/h.`,
      solution: `La fonction v ↦ ${F(M(D), 'v')} est décroissante sur ]0 ; +∞[ : elle renverse l’ordre. De ${M(v1)} ≤ v ≤ ${M(v2)} on tire ${F(M(D), M(v2))} ≤ t ≤ ${F(M(D), M(v1))}, soit ${M(lo)} ≤ t ≤ ${M(hi)} (en heures).`,
    };
  },
};

const pbChute = {
  id: 'prob-chute', dmin: 4, titre: 'problème : chute libre',
  draw() { return { n: ri(2, 9) }; },
  ex: { n: 4 },
  build({ n }) {
    const H = 5 * n * n;
    return {
      html: `Un objet lâché sans vitesse initiale tombe de h = 5t<sup>2</sup> mètres en t secondes. Au bout de combien de secondes a-t-il parcouru ${M(H)} m ?`,
      ...rNums([n], { tpl: 't = {0} s', value: n }),
      verify: E => Math.abs(5 * E[0] ** 2 - H) < 1e-9 && E[0] > 0,
      hint: `On cherche le temps t (positif) tel que 5t<sup>2</sup> = ${M(H)}. Divise d’abord par 5, puis cherche le nombre positif dont le carré est le résultat.`,
      solution: `5t<sup>2</sup> = ${M(H)} donne t<sup>2</sup> = ${M(H / 5)}, donc t = ${M(n)} (ou t = ${M(-n)}, impossible car un temps est positif). L’objet met ${M(n)} s.`,
    };
  },
};

const FORMS12 = [mPariteRef, mkVal(true), mkVal(false), mPosition, mPariteExpr, mCmp, mNbAnt, pbAire, pbCube, pbInverse, pbChute];

const visu12 = graph({ xr: [-3, 3], yr: [-9, 9], fs: [{ f: x => x ** 3, dom: [-2.08, 2.08], l: 'cube' }, { f: x => x * x, dom: [-3, 3], l: 'carré', c: '#c2255c' }], pts: [{ x: -2, y: -8, l: 'A(−2 ; −8)', px: true, py: true, anchor: 'start', ly: 18 }, { x: 2, y: 8, l: 'B(2 ; 8)', px: true, py: true, anchor: 'end' }], aria: 'courbes du carré (symétrique par rapport à l’axe des ordonnées) et du cube (symétrique par rapport à l’origine)' });

export const LV12 = niveau('Défis : parité et problèmes', FORMS12, {
  n: 12, classe: '2de',
  intro: 'Dernier niveau : on mélange tout ce que tu sais sur les fonctions de référence et on y ajoute la <b>parité</b>, avant de résoudre quelques problèmes concrets.',
  def: '<b>Fonction paire</b> : f(−x) = f(x) pour tout x (la courbe est symétrique par rapport à l’axe des ordonnées) : carré, x⁴… <b>Fonction impaire</b> : f(−x) = −f(x) (symétrie par rapport à l’origine) : cube, inverse, x… Il faut aussi que −x soit dans l’ensemble de définition quand x y est : la racine carrée n’est ni paire ni impaire.',
  visuel: visu12,
  methode: [
    '<b>Parité</b> : remplace x par −x. Si tu retrouves f(x), f est paire ; si tu retrouves −f(x), elle est impaire ; sinon ni l’un ni l’autre. Une puissance paire de x ne change pas de signe, une puissance impaire change de signe, une constante ne change pas.',
    '<b>Position</b> : pour x &gt; 1, √x &lt; x &lt; x² &lt; x³ ; pour 0 &lt; x &lt; 1, c’est l’inverse.',
    '<b>Problème</b> : traduis l’énoncé par une équation ou une inéquation avec une fonction de référence, puis utilise ses variations ; garde seulement les valeurs qui ont un sens (longueur, durée positives).',
  ],
  warn: [
    'x² + x n’est ni paire ni impaire : le carré est pair, mais x est impair. Un mélange donne « ni l’un ni l’autre ».',
    'x³ + 1 n’est pas impaire : la constante 1 ne change pas de signe quand on remplace x par −x.',
    'Entre 0 et 1, x³ est plus petit que x² : multiplier des nombres inférieurs à 1 les fait diminuer.',
    'Dans un problème, élimine les solutions négatives quand la grandeur est une longueur, une durée ou une aire.',
  ],
  retenir: 'paire : f(−x) = f(x) (carré) ; impaire : f(−x) = −f(x) (cube, inverse) ; √x n’est ni l’une ni l’autre. On vérifie toujours que la solution a un sens dans le problème.',
});

// Niveaux 7 à 9 : lire un tableau de variations ; dresser un tableau de variations à partir d'une courbe ;
// résolution graphique de f(x) = k et de f(x) < k.
import {
  ri, pick, chance, shuffle, M, P, F, R, I, REALS, INF, fmtSet, r6, niveau, rNums, rIv, rRoots, rCmp, rChoice,
  carre, cube, X2, big, fx, signe, sgnTxt, REL, melange,
} from './outils.js';
import { REF, graph, graphRef, graphCourbe, tabVarXY, tabVarRef } from './draw.js';
import { genCourbe, fromYs, tournants, ensemble, ensembleDe, degenere, niveauxPropres } from './courbes.js';

/* ---------- données communes ---------- */
/** table de variations d'une courbe : abscisses et valeurs aux changements de sens */
function tableDe(C) {
  const idx = tournants(C.ys);
  return { idx, xs: idx.map(i => C.a + i), ys: idx.map(i => C.ys[i]) };
}
const tv = (T, o) => tabVarXY(T.xs, T.ys, o);
const lim = T => `[${M(T.xs[0])} ; ${M(T.xs[T.xs.length - 1])}]`;
const stemTab = (T, nom = 'f') => `Voici le tableau de variations d’une fonction ${nom} définie sur ${lim(T)}.${tv(T)}`;
const unique = (ys, v) => ys.filter(y => y === v).length === 1;
/** morceaux monotones : [{ lo, hi, up }] */
const morceaux = T => T.xs.slice(1).map((x, i) => ({ lo: T.xs[i], hi: x, up: T.ys[i + 1] > T.ys[i], y0: T.ys[i], y1: T.ys[i + 1] }));
const dansUn = (ms, x) => ms.some(m => x >= m.lo && x <= m.hi);
const maxAbs = C => Math.max(...C.ys.map(Math.abs));
const fenetre = nT => genCourbe(nT);

/* =====================================================================================================
   Niveau 7 : lire un tableau de variations
   ===================================================================================================== */
const EX7 = { a: -4, ys: [-1, 1, 3, 4, 2, 0, -2, -1, 1] };   // tableau : x −4, −1, 2, 4 ; f −1, 4, −2, 1
const draw7 = d => { const C = fenetre(d < 1 ? 1 : d < 3 ? ri(1, 2) : ri(2, 3)); return { a: C.a, ys: C.ys }; };

const vLire = {
  id: 'v-lire', dmin: 0, titre: 'lire une valeur dans le tableau',
  draw(d) { const p = draw7(d), T = tableDe(fromYs(p.a, p.ys)); return { ...p, i: ri(0, T.xs.length - 1) }; },
  ex: { ...EX7, i: 1 },
  build({ a, ys, i }) {
    const T = tableDe(fromYs(a, ys)), x = T.xs[i], y = T.ys[i];
    return {
      html: `${stemTab(T)}Quelle est l’image de <b>${M(x)}</b> par f ?`,
      ...rNums([y], { tpl: `f(${M(x)}) = {0}`, value: y }),
      hint: `Dans la ligne « x » du tableau, repère la colonne ${M(x)} : la valeur de f(${M(x)}) est écrite dans la ligne « f(x) », juste en dessous.`,
      solution: `La colonne x = ${M(x)} du tableau donne f(${M(x)}) = ${M(y)}.`,
    };
  },
};

const mkExt = (quoi, abs) => {
  const max = quoi === 'max', nom = max ? 'maximum' : 'minimum';
  return {
    id: `v-${abs ? 'ou-' : ''}${quoi}`, dmin: abs ? 1 : 0, titre: abs ? `où le ${nom} est-il atteint ?` : `${nom} d’une fonction`,
    draw(d) {
      for (;;) { const p = draw7(d), v = (max ? Math.max : Math.min)(...tournants(p.ys).map(i => p.ys[i])); if (unique(tournants(p.ys).map(i => p.ys[i]), v)) return p; }
    },
    ex: abs ? { a: -4, ys: [-1, 1, 3, 4, 2, 0, -2, -1, 1] } : { a: -4, ys: [-1, 1, 3, 4, 2, 0, -2, -1, 1] },
    build({ a, ys }) {
      const T = tableDe(fromYs(a, ys)), v = (max ? Math.max : Math.min)(...T.ys), x = T.xs[T.ys.indexOf(v)];
      const liste = T.ys.map(M).join(' ; ');
      return {
        html: `${stemTab(T)}${abs ? `Pour quelle valeur de x le ${nom} de f est-il atteint ?` : `Quel est le ${nom} de f sur ${lim(T)} ?`}`,
        ...rNums([abs ? x : v], { tpl: abs ? 'x = {0}' : `${nom[0].toUpperCase() + nom.slice(1)} : {0}`, value: abs ? x : v, msg: w => (abs && w[0] === v ? 'C’est la valeur du extremum, pas l’abscisse où il est atteint : lis la ligne « x ».' : !abs && w[0] === x ? 'C’est l’abscisse où il est atteint ; le extremum est la valeur de f(x).' : '') }),
        verify: E => (abs ? tableDe(fromYs(a, ys)).ys[tableDe(fromYs(a, ys)).xs.indexOf(E[0])] === v : fromYs(a, ys).ys.every(y => (max ? y <= E[0] : y >= E[0])) && fromYs(a, ys).ys.includes(E[0])),
        hint: abs ? `Repère d’abord dans la ligne « f(x) » le ${nom}, parmi ${liste} ; la colonne où il se trouve te donne la valeur de x demandée.`
          : `Le ${nom} est la ${max ? 'plus grande' : 'plus petite'} valeur de f(x) : compare les valeurs ${liste} écrites dans la ligne « f(x) ».`,
        solution: abs ? `Les valeurs du tableau sont ${liste}. Le ${nom} est ${M(v)} ; il est atteint pour x = ${M(x)}.`
          : `Les valeurs du tableau sont ${liste}. La ${max ? 'plus grande' : 'plus petite'} est ${M(v)} : le ${nom} de f est ${M(v)} (atteint pour x = ${M(x)}).`,
      };
    },
  };
};

const mkSens = up => {
  const nom = up ? 'croissante' : 'décroissante', fl = up ? '↗' : '↘';
  return {
    id: `v-sens-${up ? 'croiss' : 'decr'}`, dmin: 1, titre: `où f est ${nom}`,
    draw(d) { const p = draw7(d); return p; },
    ex: { a: -4, ys: [-1, 1, 3, 4, 2, 0, -2, -1, 1] },
    build({ a, ys }) {
      const T = tableDe(fromYs(a, ys)), ms = morceaux(T).filter(m => m.up === up);
      const S = ms.map(m => I(m.lo, 1, m.hi, 1));
      return {
        html: `${stemTab(T)}Donne l’ensemble des x où f est ${nom}.`,
        ...rIv(S, x => dansUn(ms, x)),
        hint: `Dans la ligne « f(x) », les flèches ${fl} indiquent les intervalles où f est ${nom}. Repère-les et lis les abscisses de la ligne « x » à leurs extrémités. Donne un seul ensemble, avec ∪ s’il y a deux morceaux.`,
        solution: `Les flèches ${fl} se trouvent ${ms.map(m => `entre ${M(m.lo)} et ${M(m.hi)}`).join(' et ')}. f est ${nom} sur ${fmtSet(S)}.`,
      };
    },
  };
};

/** deux nombres entiers dans la même zone de monotonie, non marqués dans le tableau */
function dansMorceau(T) {
  const ms = morceaux(T).filter(m => m.hi - m.lo >= 2);
  if (!ms.length) return null;
  const m = pick(ms), u = ri(m.lo, m.hi - 1), v = ri(u + 1, m.hi);
  return { u, v, m };
}
const vCmp = {
  id: 'v-cmp', dmin: 2, titre: 'comparer deux images grâce aux variations',
  draw(d) { for (;;) { const p = draw7(d), T = tableDe(fromYs(p.a, p.ys)), c = dansMorceau(T); if (c) return { ...p, u: c.u, v: c.v }; } },
  ex: { ...EX7, u: -3, v: -2 },
  build({ a, ys, u, v }) {
    const C = fromYs(a, ys), T = tableDe(C), m = morceaux(T).find(m => u >= m.lo && v <= m.hi);
    if (!m) return null;
    const s = m.up ? '<' : '>';
    return {
      html: `${stemTab(T)}Compare f(${M(u)}) et f(${M(v)}).`,
      ...rCmp(s, { value: C.f(u) - C.f(v), msg: `Regarde le sens de la flèche entre ${M(m.lo)} et ${M(m.hi)} : f ${m.up ? 'monte' : 'descend'} sur cet intervalle.` }),
      hint: `${M(u)} et ${M(v)} sont tous deux entre ${M(m.lo)} et ${M(m.hi)}, dans la même colonne de flèche du tableau. Cette flèche monte-t-elle ou descend-elle ? Et ${M(u)} est-il plus petit que ${M(v)} ?`,
      solution: `${M(u)} et ${M(v)} sont dans [${M(m.lo)} ; ${M(m.hi)}], où f est ${m.up ? 'croissante' : 'décroissante'} (flèche ${m.up ? '↗' : '↘'}). Comme ${M(u)} &lt; ${M(v)}, ${m.up ? 'f conserve l’ordre' : 'f renverse l’ordre'} : f(${M(u)}) ${sgnTxt[s]} f(${M(v)}).`,
    };
  },
};

/** bornes possibles de f(x) pour x dans le morceau contenant u (u strictement entre deux nœuds du tableau) */
const bornes = (T, u) => { const m = morceaux(T).find(m => u > m.lo && u < m.hi); return m ? [Math.min(m.y0, m.y1), Math.max(m.y0, m.y1)] : null; };
/** vérification indépendante : valeurs prises par la vraie courbe sur les deux morceaux (échantillonnage) */
function indepNc(C, T, u, v) {
  const ms = morceaux(T), mu = ms.find(m => u > m.lo && u < m.hi), mv = ms.find(m => v > m.lo && v < m.hi);
  const ext = m => { let lo = Infinity, hi = -Infinity; for (let x = m.lo + 0.01; x < m.hi; x += 0.01) { const y = C.f(x); lo = Math.min(lo, y); hi = Math.max(hi, y); } return [lo, hi]; };
  const [a0, a1] = ext(mu), [b0, b1] = ext(mv);
  return a1 <= b0 + 1e-9 ? 0 : a0 >= b1 - 1e-9 ? 1 : 2;
}
const vCmpNc = {
  id: 'v-cmp-nc', dmin: 3, titre: 'peut-on comparer ?',
  draw(d) {
    for (;;) {
      const p = draw7(d), C = fromYs(p.a, p.ys), T = tableDe(C), L = [];
      for (let x = C.a + 1; x < C.b; x++) if (!T.xs.includes(x)) L.push(x);
      if (L.length < 2) continue;
      const u = pick(L), v = pick(L);
      const bu = bornes(T, u), bv = bornes(T, v);
      if (u < v && bu && bv && bu[0] !== bu[1] && !morceaux(T).some(m => u >= m.lo && v <= m.hi)) return { ...p, u, v, voulu: chance(0.5) };
    }
  },
  ex: { ...EX7, u: -3, v: 3, voulu: true },
  build({ a, ys, u, v }) {
    const C = fromYs(a, ys), T = tableDe(C), bu = bornes(T, u), bv = bornes(T, v);
    if (!bu || !bv) return null;
    const vrai = bu[1] <= bv[0] ? '<' : bu[0] >= bv[1] ? '>' : '?';
    const lab = [`f(${M(u)}) &lt; f(${M(v)})`, `f(${M(u)}) &gt; f(${M(v)})`, 'on ne peut pas savoir'];
    const bon = vrai === '<' ? 0 : vrai === '>' ? 1 : 2;
    const why = [
      vrai === '?' ? `Rien ne l’assure : f(${M(u)}) est entre ${M(bu[0])} et ${M(bu[1])}, f(${M(v)}) entre ${M(bv[0])} et ${M(bv[1])} ; ces valeurs peuvent se chevaucher.` : `Compare les valeurs possibles : f(${M(u)}) est entre ${M(bu[0])} et ${M(bu[1])}, f(${M(v)}) entre ${M(bv[0])} et ${M(bv[1])}.`,
      vrai === '?' ? `Rien ne l’assure : f(${M(u)}) est entre ${M(bu[0])} et ${M(bu[1])}, f(${M(v)}) entre ${M(bv[0])} et ${M(bv[1])} ; ces valeurs peuvent se chevaucher.` : `Compare les valeurs possibles : f(${M(u)}) est entre ${M(bu[0])} et ${M(bu[1])}, f(${M(v)}) entre ${M(bv[0])} et ${M(bv[1])}.`,
      `Si : f(${M(u)}) est entre ${M(bu[0])} et ${M(bu[1])}, f(${M(v)}) entre ${M(bv[0])} et ${M(bv[1])}, et ces deux ensembles de valeurs ne se chevauchent pas.`,
    ];
    return {
      html: `${stemTab(T)}Que peut-on dire de f(${M(u)}) et f(${M(v)}) ?`,
      ...rChoice(lab.map((l, i) => ({ l, ok: i === bon, why: why[i] })), { ordre: true, indep: lab[indepNc(C, T, u, v)] }),
      hint: `${M(u)} et ${M(v)} ne sont pas dans le même intervalle du tableau : la flèche ne suffit pas. Cherche entre quelles valeurs f(${M(u)}) peut se trouver (ses deux nombres voisins dans le tableau), puis fais pareil pour f(${M(v)}).`,
      solution: `${M(u)} et ${M(v)} sont dans deux intervalles différents du tableau. Sur le premier, f(${M(u)}) est entre ${M(bu[0])} et ${M(bu[1])} ; sur le second, f(${M(v)}) est entre ${M(bv[0])} et ${M(bv[1])}. ${vrai === '?' ? 'Ces deux ensembles de valeurs se chevauchent : on ne peut pas savoir lequel est le plus grand.' : vrai === '<' ? `Tout nombre du premier est plus petit que tout nombre du second : f(${M(u)}) &lt; f(${M(v)}).` : `Tout nombre du premier est plus grand que tout nombre du second : f(${M(u)}) &gt; f(${M(v)}).`}`,
    };
  },
};

const vEnc = {
  id: 'v-enc', dmin: 3, titre: 'encadrer f(x) sur un intervalle',
  draw(d) { for (;;) { const p = draw7(d), T = tableDe(fromYs(p.a, p.ys)), n = T.xs.length; const i = ri(0, n - 2), j = ri(i + 1, Math.min(n - 1, i + (d >= 4 ? 2 : 1))); if (j > i) return { ...p, i, j }; } },
  ex: { ...EX7, i: 0, j: 2 },
  build({ a, ys, i, j }) {
    const C = fromYs(a, ys), T = tableDe(C), p = T.xs[i], q = T.xs[j], vals = T.ys.slice(i, j + 1), lo = Math.min(...vals), hi = Math.max(...vals);
    return {
      html: `${stemTab(T)}Encadre f(x) lorsque ${M(p)} ≤ x ≤ ${M(q)}.`,
      ...rNums([lo, hi], { tpl: '{0} ≤ f(x) ≤ {1}', value: hi, msg: w => (w[0] > w[1] ? 'Le plus petit nombre va à gauche.' : '') }),
      verify: E => { let l = Infinity, h = -Infinity; for (let x = p; x <= q + 1e-9; x += 0.01) { const y = C.f(x); l = Math.min(l, y); h = Math.max(h, y); } return Math.abs(l - E[0]) < 0.05 && Math.abs(h - E[1]) < 0.05; },
      hint: `Sur [${M(p)} ; ${M(q)}], lis dans le tableau les valeurs de f aux abscisses ${T.xs.slice(i, j + 1).map(M).join(' ; ')} : le minimum et le maximum de f sont parmi elles, puisque f est monotone entre deux abscisses consécutives.`,
      solution: `Sur [${M(p)} ; ${M(q)}], les valeurs du tableau sont ${vals.map(M).join(' ; ')}. La plus petite est ${M(lo)}, la plus grande ${M(hi)} : ${M(lo)} ≤ f(x) ≤ ${M(hi)}.`,
    };
  },
};

/** nombre de solutions de f(x) = k pour une courbe aux nœuds entiers (k jamais égal à une valeur du tableau) */
const nbSol = (C, k) => { let n = 0; for (let i = 0; i < C.ys.length; i++) { if (C.ys[i] === k) n++; if (i + 1 < C.ys.length && Math.min(C.ys[i], C.ys[i + 1]) < k && k < Math.max(C.ys[i], C.ys[i + 1])) n++; } return n; };
const echantNb = (C, k) => {
  const runs = [];
  for (let i = 0; ; i++) { const x = C.a + i * 0.01; if (x > C.b + 1e-9) break; const e = C.f(Math.min(x, C.b)) - k, v = Math.abs(e) < 1e-9 ? 0 : Math.sign(e); if (runs[runs.length - 1] !== v) runs.push(v); }
  let n = 0;
  runs.forEach((v, i) => { if (v === 0) n++; else if (i > 0 && runs[i - 1] !== 0 && runs[i - 1] !== v) n++; });
  return n;
};
const vNsol = {
  id: 'v-nsol', dmin: 4, titre: 'nombre de solutions de f(x) = k',
  draw(d) { for (;;) { const p = draw7(d), T = tableDe(fromYs(p.a, p.ys)), lo = Math.min(...T.ys), hi = Math.max(...T.ys), k = ri(lo - 1, hi + 1); if (!T.ys.includes(k)) return { ...p, k }; } },
  ex: { ...EX7, k: 0 },
  build({ a, ys, k }) {
    const C = fromYs(a, ys), T = tableDe(C), ms = morceaux(T), n = ms.filter(m => Math.min(m.y0, m.y1) < k && k < Math.max(m.y0, m.y1)).length;
    return {
      html: `${stemTab(T)}Combien l’équation f(x) = ${M(k)} a-t-elle de solutions ?`,
      ...rNums([n], { tpl: 'Nombre de solutions : {0}', value: n }),
      verify: E => E[0] === nbSol(C, k),
      hint: `Sur chaque flèche du tableau, f prend une seule fois chaque valeur comprise entre ses deux extrémités. Pour chaque flèche, regarde si ${M(k)} est entre les deux valeurs qu’elle relie.`,
      solution: `${ms.map(m => `Sur [${M(m.lo)} ; ${M(m.hi)}], f va de ${M(m.y0)} à ${M(m.y1)} : ${M(k)} ${Math.min(m.y0, m.y1) < k && k < Math.max(m.y0, m.y1) ? 'est atteint une fois' : 'n’est pas atteint'}.`).join(' ')} Au total : ${n} solution${n > 1 ? 's' : ''}.`,
    };
  },
};

const FORMS7 = [vLire, mkExt('max'), mkExt('min'), mkExt('max', true), mkSens(false), mkSens(true), vCmp, vEnc, mkExt('min', true), vCmpNc, vNsol];
const visu7 = tabVarXY([-4, -1, 2, 4], [-1, 4, -2, 1]) + graphCourbe(fromYs(-4, EX7.ys), { aria: 'courbe de f, dont le tableau de variations est ci-dessus' });

export const LV7 = niveau('Lire les variations', FORMS7, {
  n: 7, classe: '2de',
  intro: 'Un <b>tableau de variations</b> résume le comportement d’une fonction : les flèches ↗ et ↘ indiquent si f est croissante ou décroissante, et les nombres aux extrémités des flèches sont les valeurs de f.',
  def: 'Un <b>maximum</b> de f sur un intervalle est la plus grande valeur prise par f(x) ; un <b>minimum</b> la plus petite. On précise où ils sont atteints : « le maximum de f est 4, atteint pour x = −1 ». Entre deux abscisses voisines du tableau, f est monotone (une seule flèche).',
  visuel: visu7,
  methode: [
    '<b>Valeur</b> : la colonne de x donne f(x), écrit au bout de la flèche.',
    '<b>Extremum</b> : compare les valeurs de la ligne « f(x) » ; l’abscisse se lit dans la même colonne, ligne « x ».',
    '<b>Comparer f(u) et f(v)</b> : si u et v sont sur la même flèche, ↗ garde l’ordre, ↘ le renverse. Sinon, encadre chaque image par les valeurs voisines du tableau.',
  ],
  warn: [
    'Le maximum est une valeur de f(x) (ligne du bas) ; l’abscisse où il est atteint est dans la ligne du haut : ne les confonds pas.',
    'Si u et v sont de part et d’autre d’un changement de flèche, on ne peut pas toujours comparer f(u) et f(v) : ça dépend des valeurs.',
    'Un « extremum local » n’est pas toujours le maximum sur tout l’intervalle : compare toutes les valeurs.',
  ],
  retenir: '↗ f croissante (ordre conservé), ↘ f décroissante (ordre renversé) ; maximum = plus grande valeur du tableau, minimum = plus petite.',
});

/* =====================================================================================================
   Niveau 8 : dresser un tableau de variations à partir d'une courbe
   ===================================================================================================== */
const EX8 = { a: -3, ys: [2, 1, 0, -1, 0, 1, 2, 3] };   // x −3, 0, 4 ; f 2, −1, 3
const EX8B = { a: -4, ys: [0, 1, 2, 3, 2, 1, 0, -1, -2] };
const draw8 = d => { const C = genCourbe(d < 1 ? 1 : d < 3 ? ri(1, 2) : ri(2, 3)); return { a: C.a, ys: C.ys }; };
const pointsTab = T => T.xs.map((x, i) => ({ x, y: T.ys[i], px: true, py: true, c: '#e8590c' }));

const dComplete = {
  id: 'd-complete', dmin: 0, titre: 'compléter les valeurs du tableau',
  draw(d) { return draw8(d); },
  ex: EX8,
  build({ a, ys }) {
    const C = fromYs(a, ys), T = tableDe(C);
    let k = 0;
    const tpl = tabVarXY(T.xs, T.ys, { y: () => `{${k++}}` });
    return {
      html: `Voici la courbe représentative d’une fonction f définie sur ${lim(T)}. Complète son tableau de variations (les abscisses et les flèches sont donnés).`,
      visual: graphCourbe(C),
      ...rNums(T.ys, { tpl }),
      verify: E => E.every((y, i) => Math.abs(C.f(T.xs[i]) - y) < 1e-9),
      hint: `Pour chaque abscisse du tableau (${T.xs.map(M).join(' ; ')}), repère sur la courbe le point d’abscisse x et lis sa hauteur : c’est la valeur de f(x) à écrire dans la case.`,
      solution: `On lit sur la courbe : ${T.xs.map((x, i) => `f(${M(x)}) = ${M(T.ys[i])}`).join(' ; ')}. Les flèches montent là où la courbe monte et descendent là où elle descend.`,
      afterVisual: graphCourbe(C, { pts: pointsTab(T), aria: 'courbe de f avec les points du tableau' }),
    };
  },
};

const mkExtGraph = quoi => {
  const max = quoi === 'max', nom = max ? 'maximum' : 'minimum';
  return {
    id: `d-extr-${quoi}`, dmin: 1, titre: `${nom} lu sur la courbe`,
    draw(d) { for (;;) { const p = draw8(d), T = tableDe(fromYs(p.a, p.ys)), v = (max ? Math.max : Math.min)(...T.ys); if (unique(T.ys, v)) return p; } },
    ex: max ? EX8B : EX8,
    build({ a, ys }) {
      const C = fromYs(a, ys), T = tableDe(C), v = (max ? Math.max : Math.min)(...T.ys), x = T.xs[T.ys.indexOf(v)];
      return {
        html: `Voici la courbe représentative d’une fonction f définie sur ${lim(T)}. Donne le ${nom} de f et la valeur de x où il est atteint.`,
        visual: graphCourbe(C),
        ...rNums([v, x], { tpl: `${nom[0].toUpperCase() + nom.slice(1)} : {0} en x = {1}`, value: x, msg: w => (w[0] === x && w[1] === v ? 'Tu as inversé : le premier nombre est la hauteur (valeur de f), le second l’abscisse.' : '') }),
        verify: E => { let m = max ? -Infinity : Infinity, xm = 0; for (let t = C.a; t <= C.b + 1e-9; t += 0.01) { const y = C.f(t); if (max ? y > m : y < m) { m = y; xm = t; } } return Math.abs(m - E[0]) < 0.01 && Math.abs(xm - E[1]) < 0.02; },
        hint: `Cherche sur la courbe le point le plus ${max ? 'haut' : 'bas'} : sa hauteur est le ${nom} (valeur de f), son abscisse est la valeur de x demandée. Attention, les extrémités de la courbe comptent aussi.`,
        solution: `Le point le plus ${max ? 'haut' : 'bas'} de la courbe a pour coordonnées (${M(x)} ; ${M(v)}). Le ${nom} de f est donc ${M(v)}, atteint pour x = ${M(x)}.`,
        afterVisual: graphCourbe(C, { pts: [{ x, y: v, px: true, py: true, c: '#e8590c', l: `(${M(x)} ; ${M(v)})` }] }),
      };
    },
  };
};

const mkSensGraph = up => {
  const nom = up ? 'croissante' : 'décroissante';
  return {
    id: `d-sens-${up ? 'croiss' : 'decr'}`, dmin: 2, titre: `où f est ${nom} (sur la courbe)`,
    draw(d) { return draw8(d); },
    ex: up ? EX8 : EX8B,
    build({ a, ys }) {
      const C = fromYs(a, ys), T = tableDe(C), ms = morceaux(T).filter(m => m.up === up), S = ms.map(m => I(m.lo, 1, m.hi, 1));
      return {
        html: `Voici la courbe représentative d’une fonction f définie sur ${lim(T)}. Donne l’ensemble des x où f est ${nom}.`,
        visual: graphCourbe(C),
        ...rIv(S, x => dansUn(ms, x)),
        hint: `f est ${nom} là où la courbe ${up ? 'monte' : 'descend'} quand on la parcourt de gauche à droite. Repère les abscisses où la courbe change de sens, puis donne un seul ensemble (avec ∪ s’il y a deux morceaux).`,
        solution: `La courbe ${up ? 'monte' : 'descend'} ${ms.map(m => `entre x = ${M(m.lo)} et x = ${M(m.hi)}`).join(' puis ')}. f est ${nom} sur ${fmtSet(S)}.`,
        afterVisual: graphCourbe(C, { pts: pointsTab(T), aria: 'courbe de f avec ses changements de sens' }),
      };
    },
  };
};

const dChoix = {
  id: 'd-choix', dmin: 2, titre: 'choisir le bon tableau de variations',
  draw(d) { return draw8(d); },
  ex: EX8,
  build({ a, ys }) {
    const C = fromYs(a, ys), T = tableDe(C), n = T.ys.length;
    const cand = [];
    const ajoute = (y, why) => { if (y.join() !== T.ys.join() && !cand.some(c => c.y.join() === y.join())) cand.push({ y, why }); };
    ajoute([...T.ys].reverse(), 'Tu as lu la courbe de droite à gauche : le tableau se lit de gauche à droite.');
    ajoute(T.ys.map(y => -y), 'Les flèches sont inversées : là où la courbe monte, la flèche doit monter.');
    for (let i = 0; i < n && cand.length < 6; i++) { const y = [...T.ys]; y[i] += pick([-1, 1, 2]); ajoute(y, 'Une des valeurs ne correspond pas à la hauteur du point sur la courbe : relis-la.'); }
    const bads = cand.slice(0, 3);
    if (bads.length < 3) return null;
    const items = [{ l: tv(T), ok: true }, ...bads.map(c => ({ l: tabVarXY(T.xs, c.y), why: c.why }))];
    return {
      html: `Voici la courbe représentative d’une fonction f définie sur ${lim(T)}. Quel tableau de variations est le sien ?`,
      visual: graphCourbe(C),
      ...rChoice(items, { indep: tv(T) }),
      hint: `Regarde où la courbe monte et où elle descend (de gauche à droite), puis lis la hauteur des points où elle change de sens, ainsi que celle des deux extrémités. Élimine les tableaux dont les flèches ou les valeurs ne correspondent pas.`,
      solution: `La courbe ${T.xs.slice(1).map((x, i) => `${T.ys[i + 1] > T.ys[i] ? 'monte' : 'descend'} de ${M(T.ys[i])} à ${M(T.ys[i + 1])} entre ${M(T.xs[i])} et ${M(x)}`).join(', puis ')}. Le bon tableau est celui dont les flèches et les valeurs sont ${T.ys.map(M).join(' ; ')}.`,
      afterVisual: tv(T),
    };
  },
};

const dCompleteX = {
  id: 'd-complete-x', dmin: 3, titre: 'compléter abscisses et valeurs',
  draw(d) { return draw8(d); },
  ex: EX8B,
  build({ a, ys }) {
    const C = fromYs(a, ys), T = tableDe(C), n = T.xs.length, nx = n - 2;
    let kx = 0, ky = nx;
    const tpl = tabVarXY(T.xs, T.ys, { x: i => (i === 0 || i === n - 1 ? M(T.xs[i]) : `{${kx++}}`), y: () => `{${ky++}}` });
    return {
      html: `Voici la courbe représentative d’une fonction f définie sur ${lim(T)}. Complète son tableau de variations : les abscisses des changements de sens et toutes les valeurs. Les flèches sont données.`,
      visual: graphCourbe(C),
      ...rNums([...T.xs.slice(1, -1), ...T.ys], { tpl }),
      verify: E => { const xs = [T.xs[0], ...E.slice(0, nx), T.xs[n - 1]], yv = E.slice(nx); return xs.every((x, i) => Math.abs(C.f(x) - yv[i]) < 1e-9) && xs.join() === T.xs.join(); },
      hint: `Repère sur la courbe les points où elle change de sens (là où elle passe de la montée à la descente ou l’inverse) : leur abscisse va dans la ligne « x », leur hauteur dans la ligne « f(x) ». N’oublie pas les valeurs aux deux extrémités ${M(T.xs[0])} et ${M(T.xs[n - 1])}.`,
      solution: `La courbe change de sens en ${T.xs.slice(1, -1).map(M).join(' et en ')}. On lit : ${T.xs.map((x, i) => `f(${M(x)}) = ${M(T.ys[i])}`).join(' ; ')}.`,
      afterVisual: graphCourbe(C, { pts: pointsTab(T), aria: 'courbe de f avec les points du tableau' }),
    };
  },
};

const FORMS8 = [dComplete, mkExtGraph('max'), mkExtGraph('min'), mkSensGraph(true), mkSensGraph(false), dChoix, dCompleteX];
const visu8 = graphCourbe(fromYs(-3, EX8.ys), { pts: [{ x: -3, y: 2, px: true, py: true, c: '#e8590c' }, { x: 0, y: -1, px: true, py: true, c: '#e8590c' }, { x: 4, y: 3, px: true, py: true, c: '#e8590c' }], aria: 'courbe de f avec trois points repérés' }) + tabVarXY([-3, 0, 4], [2, -1, 3]);

export const LV8 = niveau('Dresser un tableau', FORMS8, {
  n: 8, classe: '2de',
  intro: 'Sur une courbe, on voit où la fonction monte et où elle descend. Un tableau de variations range ces informations : il suffit de repérer les points où la courbe <b>change de sens</b>.',
  def: '<b>Méthode du tableau.</b> 1) Repère les abscisses des deux extrémités et des points où la courbe change de sens : ce sont les colonnes. 2) Entre deux colonnes, dessine ↗ si la courbe monte, ↘ si elle descend. 3) Au bout de chaque flèche, écris la hauteur du point (valeur de f).',
  visuel: visu8,
  methode: [
    'Parcours la courbe de <b>gauche à droite</b>.',
    'Note les abscisses où elle passe d’une montée à une descente (ou l’inverse), et les deux extrémités.',
    'Lis la hauteur de chacun de ces points : ce sont les valeurs de f.',
    'Chaque flèche relie deux valeurs : ↗ si la deuxième est plus grande, ↘ sinon.',
  ],
  warn: [
    'Les valeurs du tableau sont des ordonnées (hauteurs), pas des abscisses.',
    'Ne lis pas la courbe de droite à gauche : le tableau va dans le sens des x croissants.',
    'Les extrémités de la courbe (début et fin) sont toujours des colonnes du tableau, même si la courbe n’y change pas de sens.',
  ],
  retenir: 'colonnes = extrémités + points de changement de sens ; flèche ↗ si la courbe monte, ↘ si elle descend ; valeurs = hauteurs lues.',
});

/* =====================================================================================================
   Niveau 9 : résolution graphique de f(x) = k et f(x) < k
   ===================================================================================================== */
const EX9 = { a: -4, ys: [0, 1, 2, 3, 2, 1, 0, -1, -2] };
const draw9 = d => { const C = genCourbe(d < 1 ? 1 : d < 3 ? ri(1, 2) : ri(2, 3)); return { a: C.a, ys: C.ys }; };
const stem9 = (T, extra = '') => `Voici la courbe représentative d’une fonction f définie sur ${lim(T)}, avec la droite horizontale d’équation y = `;
const ptsSol = (xs, k) => xs.map(x => ({ x, y: k, px: true, c: '#e8590c', l: M(x), ly: -12 }));

const gEq = {
  id: 'g-eq', dmin: 0, titre: 'résoudre f(x) = k',
  draw(d) {
    for (let t = 0; t < 400; t++) {
      const p = draw9(d), C = fromYs(p.a, p.ys), ok = niveauxPropres(C.ys);
      let k;
      if (d >= 1 && chance(0.25)) k = chance(0.5) ? Math.max(...C.ys) + ri(1, 2) : Math.min(...C.ys) - ri(1, 2); else k = pick(ok);
      if (!ok.includes(k)) continue;
      const n = C.ys.filter(y => y === k).length;
      if (n > 2 || (n === 0 && d < 1)) continue;
      return { ...p, k };
    }
    throw new Error('g-eq');
  },
  ex: { ...EX9, k: 1 },
  build({ a, ys, k }) {
    const C = fromYs(a, ys), T = tableDe(C), E = C.xs.filter((x, i) => C.ys[i] === k);
    return {
      html: `${stem9(T)}${M(k)}. Résous graphiquement l’équation f(x) = ${M(k)}.`,
      visual: graphCourbe(C, { k }),
      ...rRoots(E, x => x >= C.a && x <= C.b && Math.abs(C.f(x) - k) < 1e-9, { none: 'Aucune solution', noneMsg: `Regarde bien : la droite y = ${M(k)} coupe-t-elle la courbe ?` }),
      hint: `Repère la droite horizontale y = ${M(k)} : les solutions de f(x) = ${M(k)} sont les abscisses des points où elle coupe la courbe. Lis-les sur l’axe des abscisses${E.length === 0 ? ' (ou conclus qu’il n’y en a pas)' : ''}.`,
      solution: E.length ? `La droite y = ${M(k)} coupe la courbe en ${E.length === 1 ? 'un point, d’abscisse' : 'deux points, d’abscisses'} ${E.map(M).join(' et ')}. Les solutions de f(x) = ${M(k)} sont donc ${E.map(M).join(' et ')}.`
        : `La droite y = ${M(k)} ne coupe pas la courbe : f(x) = ${M(k)} n’a aucune solution.`,
      afterVisual: graphCourbe(C, { k, pts: ptsSol(E, k) }),
    };
  },
};

const mkIneq = inf => ({
  id: inf ? 'g-ineq-inf' : 'g-ineq-sup', dmin: inf ? 1 : 2, titre: inf ? 'résoudre f(x) < k (en dessous)' : 'résoudre f(x) > k (au-dessus)',
  draw(d) {
    for (let t = 0; t < 600; t++) {
      const p = draw9(d), C = fromYs(p.a, p.ys), k = pick(niveauxPropres(C.ys)), rel = inf ? pick(['<', '≤']) : pick(['>', '≥']);
      const e = ensemble(C.ys.map(y => y - k), C.a, rel);
      if (e && e.S.length >= 1 && e.S.length <= 2 && !degenere(e.S) && e.racines.length >= 1) return { ...p, k, rel };
    }
    throw new Error('g-ineq');
  },
  ex: inf ? { ...EX9, k: 1, rel: '<' } : { ...EX9, k: 1, rel: '≥' },
  build({ a, ys, k, rel }) {
    const C = fromYs(a, ys), T = tableDe(C), e = ensemble(C.ys.map(y => y - k), C.a, rel);
    if (!e) return null;
    const { S, racines } = e, cmpf = { '<': (u, v) => u < v, '≤': (u, v) => u <= v, '>': (u, v) => u > v, '≥': (u, v) => u >= v }[rel];
    const strict = rel === '<' || rel === '>';
    return {
      html: `${stem9(T)}${M(k)}. Résous graphiquement l’inéquation f(x) ${REL[rel]} ${M(k)}.`,
      visual: graphCourbe(C, { k }),
      ...rIv(S, x => x >= C.a - 1e-12 && x <= C.b + 1e-12 && cmpf(C.f(x), k)),
      hint: `Repère d’abord les points où la courbe coupe la droite y = ${M(k)} et lis leurs abscisses, puis repère les parties de la courbe ${inf ? 'en dessous de' : 'au-dessus de'} cette droite. ${strict ? 'L’inégalité est stricte : les points où la courbe touche la droite sont exclus.' : 'L’inégalité est large : les points de la droite font partie des solutions.'}`,
      solution: `La droite y = ${M(k)} coupe la courbe aux abscisses ${racines.map(M).join(' et ')}. La courbe est ${inf ? 'en dessous de' : 'au-dessus de'} la droite ${strict ? '(strictement) ' : '(ou sur elle) '}pour x dans ${fmtSet(S)}. Les crochets sont ${strict ? 'ouverts sur les abscisses d’intersection (inégalité stricte)' : 'fermés sur les abscisses d’intersection (inégalité large)'}, et fermés aux extrémités ${M(C.a)} et ${M(C.b)} de l’ensemble de définition quand elles conviennent.`,
      afterVisual: graphCourbe(C, { k, pts: ptsSol(racines, k) }),
    };
  },
});

const gNsol = {
  id: 'g-nsol', dmin: 3, titre: 'combien de solutions ?',
  draw(d) { for (;;) { const p = draw9(d), C = fromYs(p.a, p.ys), k = pick(niveauxPropres(C.ys).concat([Math.max(...C.ys) + 1])); if (k >= -6 && k <= 6) return { ...p, k }; } },
  ex: { ...EX9, k: 2 },
  build({ a, ys, k }) {
    const C = fromYs(a, ys), T = tableDe(C), n = nbSol(C, k);
    return {
      html: `${stem9(T)}${M(k)}. Combien l’équation f(x) = ${M(k)} a-t-elle de solutions ?`,
      visual: graphCourbe(C, { k }),
      ...rNums([n], { tpl: 'Nombre de solutions : {0}', value: n }),
      verify: E => E[0] === echantNb(C, k),
      hint: `Compte les points communs à la courbe et à la droite horizontale y = ${M(k)}. Un point où la courbe ne fait que toucher la droite compte aussi.`,
      solution: `La droite y = ${M(k)} et la courbe ont ${n} point${n > 1 ? 's' : ''} commun${n > 1 ? 's' : ''} : l’équation f(x) = ${M(k)} a ${n} solution${n > 1 ? 's' : ''}.`,
    };
  },
};

/* fonctions de référence : f(x) rel k avec la droite y = k tracée */
const GREF = [
  { cle: 'carre', ks: [1, 4, 9], crit: k => [-Math.sqrt(k), Math.sqrt(k)], win: k => ({ xr: [-4, 4], yr: [-1, 10] }) },
  { cle: 'cube', ks: [-8, -1, 1, 8], crit: k => [Math.cbrt(k)], win: () => ({ xr: [-3, 3], yr: [-10, 10] }) },
  { cle: 'racine', ks: [1, 2, 3], crit: k => [0, k * k], win: () => ({ xr: [-1, 10], yr: [-1, 4] }) },
  { cle: 'inverse', ks: [-1, 1], crit: k => [0, 1 / k], win: () => ({ xr: [-5, 5], yr: [-5, 5] }) },
];
const gRef = {
  id: 'g-ref', dmin: 4, titre: 'f(x) < k avec une fonction de référence',
  draw() { const G = pick(GREF); return { cle: G.cle, k: pick(G.ks), rel: pick(['<', '≤', '>', '≥']) }; },
  ex: { cle: 'carre', k: 4, rel: '<' },
  build({ cle, k, rel }) {
    const G = GREF.find(g => g.cle === cle), R = REF[cle], W = G.win(k);
    const cmpf = { '<': (u, v) => u < v, '≤': (u, v) => u <= v, '>': (u, v) => u > v, '≥': (u, v) => u >= v }[rel];
    const truth = x => R.ok(x) && cmpf(R.f(x), k);
    const crit = G.crit(k).map(r6).sort((u, v) => u - v);
    const S = ensembleDe(crit, truth);
    const fs = cle === 'inverse' ? [{ f: R.f, dom: [W.xr[0], -0.2], l: 'f' }, { f: R.f, dom: [0.2, W.xr[1]] }] : [{ f: R.f, dom: [cle === 'racine' ? 0 : W.xr[0], W.xr[1]], l: 'f' }];
    const vis = pts => graph({ ...W, fs, h: { y: k, l: `y = ${M(k)}` }, pts, aria: `courbe de la fonction ${R.nom} et droite y = ${M(k)}` });
    return {
      html: `On a tracé la courbe de la fonction ${R.nom} (f(x) = ${R.expr}) et la droite d’équation y = ${M(k)}. Résous l’inéquation f(x) ${REL[rel]} ${M(k)} sur l’ensemble de définition de f.`,
      visual: vis(),
      ...rIv(S, truth),
      hint: `Repère les points où la droite y = ${M(k)} coupe la courbe, puis les parties de la courbe ${rel === '<' || rel === '≤' ? 'en dessous' : 'au-dessus'} de la droite. La courbe continue au-delà du cadre : pense à l’allure de la fonction ${R.nom}${cle === 'inverse' || cle === 'racine' ? ' et à ce qui se passe en x = 0' : ''}.`,
      solution: `La droite y = ${M(k)} coupe la courbe aux abscisses ${G.crit(k).filter(c => R.ok(c) && Math.abs(R.f(c) - k) < 1e-9).map(c => M(r6(c))).join(' et ')}. En lisant les parties de la courbe ${rel === '<' || rel === '≤' ? 'sous' : 'sur ou au-dessus de'} la droite, on trouve S = ${fmtSet(S)}.`,
      afterVisual: vis(G.crit(k).filter(c => R.ok(c) && Math.abs(R.f(c) - k) < 1e-9).map(c => ({ x: r6(c), y: k, px: true, c: '#e8590c', l: M(r6(c)), ly: -12 }))),
    };
  },
};

const FORMS9 = [gEq, mkIneq(true), mkIneq(false), gNsol, gRef];
const C9 = fromYs(-4, EX9.ys);
const visu9 = graphCourbe(C9, { k: 1, pts: ptsSol([-3, 1], 1) });

export const LV9 = niveau('Graphique : f(x) = k', FORMS9, {
  n: 9, classe: '2de',
  intro: 'Pour résoudre <b>f(x) = k</b> ou <b>f(x) &lt; k</b> sur la courbe de f, on trace la <b>droite horizontale</b> d’équation y = k et on regarde où la courbe la rencontre ou passe en dessous.',
  def: '<b>f(x) = k</b> : les solutions sont les abscisses des points d’intersection de la courbe et de la droite y = k. <b>f(x) &lt; k</b> : ce sont les abscisses des points de la courbe situés <i>strictement en dessous</i> de la droite. <b>f(x) &gt; k</b> : au-dessus.',
  visuel: visu9,
  methode: [
    'Trace (ou repère) la droite horizontale y = k.',
    '<b>Équation</b> : lis les abscisses des points communs ; il peut n’y en avoir aucun, un ou plusieurs.',
    '<b>Inéquation</b> : lis les abscisses des intersections, puis les parties de courbe en dessous (&lt;) ou au-dessus (&gt;) de la droite.',
    'Écris la réponse avec des intervalles : crochet ouvert pour &lt; et &gt;, fermé pour ≤ et ≥, en pensant aux extrémités de l’ensemble de définition.',
  ],
  warn: [
    'Les solutions sont des <b>abscisses</b> (sur l’axe horizontal), pas des ordonnées : ne donne pas k comme solution.',
    'Pour f(x) &lt; k, les points d’intersection sont exclus ; pour f(x) ≤ k, ils sont inclus.',
    'Au bout de l’ensemble de définition, le crochet est fermé si la courbe y est bien dans la zone cherchée.',
  ],
  retenir: 'f(x) = k : intersections avec y = k ; f(x) &lt; k : courbe en dessous ; f(x) &gt; k : courbe au-dessus. On répond par des abscisses.',
});

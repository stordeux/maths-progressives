// Niveaux 4 à 6 : écart type (sens, petite série) ; écart type avec effectifs ; données regroupées en classes.
import { ri, pick, shuffle, chance, M, big, lst, pc, fv, plus, sm, somme, rNums, rChoice, niveau, tabEff } from './outils.js';
import { CTX, sum, range, moy, variance, sigma, racineExacte, rnd, entier, dec, cherche, serie, valeursTab, effCloche, partition, mean } from './stat.js';
import { tab, pointsSurDroite, histogramme } from './draw.js';

const tplU = (lab, C, i = 0) => `${lab} : {${i}}${C.u}`;
const uns = vals => vals.map(() => 1);
const PAS1 = CTX.filter(c => c.pas === 1);

/** fenêtre de valeurs [lo ; lo + largeur × pas] dans le contexte */
function fenetre(C, largeur) {
  const span = largeur * C.pas, lo0 = Math.ceil(C.lo / C.pas) * C.pas;
  const hi0 = Math.floor(C.hi / C.pas) * C.pas;
  if (hi0 - lo0 <= span) return { lo: lo0, hi: hi0 };
  const lo = lo0 + C.pas * ri(0, Math.floor((hi0 - lo0 - span) / C.pas));
  return { lo, hi: lo + span };
}
/** petite série (n valeurs) de moyenne entière ; mode : 'exact' (écart type entier), 'var' (variance entière, écart type non entier), 'any' */
function petite(C, n, mode, largeur = 10) {
  const W = fenetre(C, largeur);
  return cherche(() => serie(C, n, W), v => {
    const m = sum(v) / n; if (!entier(m) || new Set(v).size < 3) return false;
    const S2 = sum(v.map(x => (x - m) ** 2)), va = S2 / n;
    if (mode === 'exact') return entier(va) && racineExacte(va) !== null && va >= 1;
    if (mode === 'var') return entier(va) && racineExacte(va) === null;
    return S2 > 0;
  }, 40000);
}
/** étapes d'un calcul d'écart type sur une liste : texte de solution */
function etapesListe(vals, C, dec_) {
  const n = vals.length, S = sum(vals), m = S / n, ec = vals.map(x => x - m), ca = ec.map(e => e * e), S2 = sum(ca), va = S2 / n, sg = Math.sqrt(va);
  const fin = dec_ === 0 ? `Écart type : √${M(va)} = <b>${M(sg)}</b>${C.u}.` : `Écart type : √${M(va)} ≈ <b>${M(rnd(sg, dec_))}</b>${C.u} (arrondi au ${dec_ === 1 ? 'dixième' : 'centième'}).`;
  return { m, ec, ca, S2, va, sg, texte: `Moyenne : ${plus(vals)} = ${M(S)}, puis ${M(S)} ÷ ${M(n)} = ${M(m)}.<br>Écarts à la moyenne (valeur − moyenne) : ${lst(ec)}.<br>Carrés des écarts : ${lst(ca)}.<br>Somme des carrés : ${plus(ca)} = ${M(S2)}.<br>Variance : ${M(S2)} ÷ ${M(n)} = ${M(va)}.<br>${fin}` };
}

/* ===================================================================== 4. écart type : sens et petite série */
const SC_COMP = [
  { t: (mu, n) => `Voici les durées (en minutes) de ${n} trajets sur deux lignes de bus, A et B. Les deux séries ont la même moyenne : ${M(mu)} minutes.`, a: 'Ligne A', b: 'Ligne B' },
  { t: (mu, n) => `Voici les ${n} dernières notes (sur 20) de deux élèves, A et B. Les deux séries ont la même moyenne : ${M(mu)}.`, a: 'Élève A', b: 'Élève B' },
  { t: (mu, n) => `Voici la température maximale (en °C) relevée pendant ${n} jours dans deux villes, A et B. Les deux séries ont la même moyenne : ${M(mu)} °C.`, a: 'Ville A', b: 'Ville B' },
];
/** série de 2 × k valeurs symétriques autour de mu : mu ± e */
const sym = (mu, es) => es.flatMap(e => (e === 0 ? [mu, mu] : [mu - e, mu + e]));
const comparDisp = {
  id: 'compar-disp', dmin: 0, titre: 'comparer deux séries sans calcul',
  draw: d => cherche(() => {
    const mu = ri(11, 15), eA = Array.from({ length: 4 }, () => ri(0, 8)), eB = Array.from({ length: 4 }, () => ri(0, 8));
    const A = sym(mu, eA), B = sym(mu, eB), sA = sigma(A), sB = sigma(B);
    const egal = d >= 2 && chance(0.25);
    const dup = L => Math.max(...[...new Set(L)].map(v => L.filter(x => x === v).length));
    if (dup(A) > 3 || dup(B) > 3) return null;
    const ok = egal ? Math.abs(sA - sB) < 1e-9 && sA > 0 : Math.abs(sA - sB) >= 1.2;
    return ok ? { i: ri(0, SC_COMP.length - 1), mu, A: shuffle([...A]), B: shuffle([...B]) } : null;
  }),
  build: p => {
    const S = SC_COMP[p.i], { mu, A, B } = p, sA = sigma(A), sB = sigma(B), egal = Math.abs(sA - sB) < 1e-9;
    const bon = egal ? 'Les deux séries ont le même écart type.' : sA > sB ? `${S.a}.` : `${S.b}.`;
    const items = [{ l: `${S.a}.`, ok: bon === `${S.a}.` }, { l: `${S.b}.`, ok: bon === `${S.b}.` }, { l: 'Les deux séries ont le même écart type.', ok: egal }]
      .map(x => ({ ...x, why: x.ok ? '' : `Compare l’éloignement des points à la moyenne ${M(mu)} : ${S.a} va de ${M(Math.min(...A))} à ${M(Math.max(...A))}, ${S.b} va de ${M(Math.min(...B))} à ${M(Math.max(...B))}.` }));
    return { ...rChoice(items, { ordre: true, indep: bon }), meta: { sA, sB },
      html: `${S.t(mu, A.length)}${pointsSurDroite([{ nom: S.a, vals: A }, { nom: S.b, vals: B }], { lo: mu - 10, hi: mu + 10, g: 1, lab: 2 })}Quelle série a le plus grand écart type ?`,
      hint: `Les deux séries ont la même moyenne, ${M(mu)} : l’écart type est d’autant plus grand que les points s’éloignent de ${M(mu)}. Regarde les points les plus éloignés de ${M(mu)} dans chaque série.`,
      solution: `Moyenne commune : ${M(mu)}. Les valeurs de ${S.a} sont entre ${M(Math.min(...A))} et ${M(Math.max(...A))} ; celles de ${S.b} sont entre ${M(Math.min(...B))} et ${M(Math.max(...B))}.<br>Calculs (non demandés) : écart type de ${S.a} ≈ ${M(rnd(sA, 1))}, de ${S.b} ≈ ${M(rnd(sB, 1))}.<br>Réponse : <b>${bon[0].toUpperCase()}${bon.slice(1)}</b>` };
  },
  ex: { i: 0, mu: 14, A: sym(14, [1, 2, 2, 3]), B: sym(14, [5, 6, 7, 8]) },
};

const sigmaNul = {
  id: 'sigma-nul', dmin: 0, titre: 'quand l’écart type est-il nul ?',
  draw: d => { const C = pick(PAS1.filter(c => c.hi - c.lo >= 8)), n = ri(4, 6), v = ri(C.lo + 2, C.hi - 2); return { C, n, v, pos: [ri(0, n - 1), ri(0, n - 1), ri(0, n - 1)], dv: [pick([1, -1]), pick([2, -2]), pick([1, -1, 3])] }; },
  build: p => {
    const { C, n, v, pos, dv } = p, tous = Array(n).fill(v);
    const autres = pos.map((k, i) => { const L = [...tous]; L[k] = v + dv[i]; return L; });
    const bon = lst(tous);
    if (new Set([bon, ...autres.map(lst)]).size < 4) return null;
    const items = [{ l: bon, ok: true }, ...autres.map(L => ({ l: lst(L), why: `Dans la série ${lst(L)}, les valeurs ne sont pas toutes égales à leur moyenne : l’écart type n’est pas nul.` }))];
    return { ...rChoice(items, { indep: bon }),
      html: `On a relevé les ${C.noms} de ${n} ${C.ent} dans quatre situations. Dans quelle situation l’écart type de la série est-il égal à 0 ?`,
      hint: `L’écart type mesure l’éloignement des valeurs à leur moyenne. Regarde, dans chacune des quatre listes de ${n} valeurs, si toutes les valeurs sont égales.`,
      solution: `L’écart type est nul quand tous les écarts à la moyenne sont nuls, c’est-à-dire quand toutes les valeurs sont égales.<br>Seule la série <b>${bon}</b> a ses ${n} valeurs égales ; dans les autres, une valeur est différente des autres.` };
  },
  ex: { C: CTX[0], n: 5, v: 11, pos: [1, 3, 4], dv: [1, -2, 3] },
};

const sommeCarres = {
  id: 'somme-carres', dmin: 0, titre: 'somme des carrés des écarts',
  draw: d => { const C = pick(CTX), n = ri(4, d < 3 ? 5 : 6), v = petite(C, n, 'any', d < 3 ? 6 : 8); return v && { C, vals: v }; },
  build: p => {
    const { C, vals } = p, n = vals.length, m = sum(vals) / n, ec = vals.map(x => x - m), ca = ec.map(e => e * e), S2 = sum(ca);
    return { ...rNums([S2], { tpl: 'Somme des carrés : {0}', value: S2, near: [[[S2 / n, `${M(S2 / n)} est la somme des carrés divisée par ${M(n)} : c’est la variance, qu’on ne demande pas ici.`], [sum(ec.map(Math.abs)), 'Les écarts sont à élever au carré avant de les additionner.']]] }),
      html: `${C.liste(n)}${big(lst(vals))}La moyenne de cette série est ${fv(m, C.u)}. Calcule la somme des carrés des écarts à la moyenne.`,
      hint: `Pour chaque valeur (${vals.slice(0, 2).map(M).join(' ; ')} …), retire la moyenne ${M(m)}, élève l’écart au carré, puis additionne les ${n} carrés.`,
      solution: `Écarts à la moyenne (valeur − ${M(m)}) : ${lst(ec)}.<br>Carrés des écarts : ${lst(ca)}.<br>Somme : ${plus(ca)} = <b>${M(S2)}</b>.`, meta: { ecarts: ec, carres: ca } };
  },
  ex: { C: CTX[0], vals: [8, 10, 12, 14, 11] },
};

const SC_VAL4 = [
  { t: (a, b) => `Deux machines remplissent des paquets de farine de 500 g. Machine A : moyenne ${M(a.m)} g, écart type ${M(a.s)} g. Machine B : moyenne ${M(b.m)} g, écart type ${M(b.s)} g.`, Q: 'Quelle machine est la plus régulière ?', regul: true, X: 'Machine', base: () => 500, gaps: [1, 2, 3, 4] },
  { t: (a, b) => `Deux élèves ont passé le même nombre d’épreuves. Élève A : note moyenne ${M(a.m)}, écart type ${M(a.s)}. Élève B : note moyenne ${M(b.m)}, écart type ${M(b.s)}.`, Q: 'Quel élève est le plus régulier ?', regul: true, X: 'Élève', base: () => ri(9, 13), gaps: [1, 2, 3] },
  { t: (a, b) => `Deux lignes de bus ont les durées de trajet suivantes. Ligne A : moyenne ${M(a.m)} min, écart type ${M(a.s)} min. Ligne B : moyenne ${M(b.m)} min, écart type ${M(b.s)} min.`, Q: 'Quelle ligne a les durées de trajet les plus dispersées ?', regul: false, X: 'Ligne', base: () => ri(20, 30), gaps: [1, 2, 3, 4] },
];
const compVal = {
  id: 'comp-val', dmin: 1, titre: 'comparer avec les écarts types',
  draw: d => {
    const i = ri(0, SC_VAL4.length - 1), S = SC_VAL4[i], sMin = ri(10, 30) / 10, sMax = sMin + ri(8, 40) / 10, base = S.base(), gap = pick(S.gaps);
    // la série qui a la plus grande moyenne est celle qui ne répond PAS à la question (piège : la moyenne ne mesure pas la dispersion)
    const piege = { m: base + gap, s: S.regul ? sMax : sMin }, bonne = { m: base, s: S.regul ? sMin : sMax };
    return chance(0.5) ? { i, A: piege, B: bonne } : { i, A: bonne, B: piege };
  },
  build: p => {
    const S = SC_VAL4[p.i], { A, B } = p;
    const bonne = (S.regul ? A.s < B.s : A.s > B.s) ? 'A' : 'B', autre = bonne === 'A' ? 'B' : 'A', plusMoy = A.m > B.m ? 'A' : 'B';
    const crit = S.regul ? 'le plus petit' : 'le plus grand', txt = k => `${S.X} ${k}, car son écart type est ${crit}.`;
    const items = [
      { l: txt(bonne), ok: true },
      { l: txt(autre), why: `Compare bien les écarts types : ${M(A.s)} pour A et ${M(B.s)} pour B.` },
      { l: `${S.X} ${plusMoy}, car sa moyenne est la plus grande.`, why: 'La moyenne indique le niveau moyen, pas la dispersion : c’est l’écart type qui la mesure.' },
      { l: 'On ne peut pas savoir sans connaître toutes les valeurs.', why: 'L’écart type suffit pour comparer la dispersion de deux séries.' },
    ];
    return { ...rChoice(items, { indep: txt(bonne) }),
      html: `${S.t(A, B)} ${S.Q}`,
      hint: `Compare les écarts types ${M(A.s)} et ${M(B.s)} : ${S.regul ? 'une série est régulière quand ses valeurs sont proches de la moyenne, donc quand son écart type est petit' : 'des valeurs dispersées donnent un grand écart type'}.`,
      solution: `L’écart type mesure la dispersion des valeurs autour de la moyenne : ${M(A.s)} pour A, ${M(B.s)} pour B.<br>${S.regul ? 'Le plus petit écart type correspond à la série la plus régulière' : 'Le plus grand écart type correspond à la série la plus dispersée'} : <b>${S.X.toLowerCase()} ${bonne}</b>. La moyenne ne sert pas à comparer la dispersion.` };
  },
  ex: { i: 0, A: { m: 502, s: 3.4 }, B: { m: 500, s: 1.2 } },
};

const sigmaCalc = {
  id: 'sigma-calc', dmin: 2, titre: 'écart type d’une petite série (valeur exacte)',
  draw: d => { const C = pick(CTX), n = ri(4, d < 4 ? 5 : 6), v = petite(C, n, 'exact', d < 4 ? 6 : 8); return v && { C, vals: v }; },
  build: p => {
    const { C, vals } = p, E = etapesListe(vals, C, 0);
    return { ...rNums([E.sg], { tpl: tplU('Écart type', C), value: E.sg, near: [[[E.va, `${M(E.va)} est la variance : l’écart type est sa racine carrée.`], [E.S2, 'C’est la somme des carrés des écarts : divise par l’effectif, puis prends la racine carrée.']]] }),
      html: `${C.liste(vals.length)}${big(lst(vals))}Calcule l’écart type de cette série (le résultat est un nombre entier).`,
      hint: `Calcule la moyenne des ${vals.length} valeurs (${vals.slice(0, 3).map(M).join(' + ')} …), puis les écarts à cette moyenne, leurs carrés, leur moyenne (la variance) et enfin la racine carrée.`,
      solution: E.texte, meta: { sigma: E.sg, dec: 0, liste: { vals, effs: uns(vals) }, ecarts: E.ec, carres: E.ca } };
  },
  ex: { C: CTX[0], vals: [8, 10, 11, 12, 14] },
};

const sigmaArr = {
  id: 'sigma-arr', dmin: 3, titre: 'écart type arrondi (calculatrice)',
  draw: d => { const C = pick(CTX), n = ri(4, 6), v = petite(C, n, 'var', 8); return v && { C, vals: v, dec: d < 5 ? 1 : pick([1, 2]) }; },
  build: p => {
    const { C, vals, dec: k } = p, E = etapesListe(vals, C, k), prec = k === 1 ? 'dixième' : 'centième';
    return { ...rNums([rnd(E.sg, k)], { tpl: tplU('Écart type', C), value: rnd(E.sg, k), near: [[[E.va, `${M(E.va)} est la variance : prends-en la racine carrée.`], [rnd(E.sg, k === 1 ? 0 : 1), `Attention à l’arrondi demandé : au ${prec}.`]]] }),
      html: `${C.liste(vals.length)}${big(lst(vals))}Calcule l’écart type de cette série, arrondi au ${prec} (la calculatrice est utile pour la racine carrée).`,
      hint: `Moyenne des ${vals.length} valeurs, écarts à cette moyenne, carrés, variance (moyenne des carrés des écarts), puis racine carrée de la variance, arrondie au ${prec}.`,
      solution: E.texte, meta: { sigma: E.sg, dec: k, liste: { vals, effs: uns(vals) }, ecarts: E.ec, carres: E.ca } };
  },
  ex: { C: CTX[0], vals: [8, 9, 10, 11, 12], dec: 1 },
};

const sigmaTransf = {
  id: 'sigma-transf', dmin: 4, titre: 'écart type après transformation',
  draw: d => ({ op: pick(['add', 'mul', 'add', 'mul']), s: ri(12, 60) / 10, k: pick([2, 3, 5, 10]), a: pick([2, 5, 10, 20]) }),
  build: p => {
    const { op, s, k, a } = p, r = op === 'add' ? s : rnd(s * k, 3);
    if (dec(r) < 0 || dec(r) > 2) return null;
    const ctx = op === 'add'
      ? `Les notes d’un devoir ont pour écart type ${M(s)}. Le professeur ajoute ${M(a)} points à toutes les notes (barème généreux).`
      : `Les durées de trajet, en minutes, ont pour écart type ${M(s)}. On convertit toutes les durées en multipliant chacune par ${M(k)} (changement d’unité).`;
    return { ...rNums([r], { tpl: 'Nouvel écart type : {0}', value: r, near: [op === 'add' ? [[rnd(s + a, 3), 'Ajouter le même nombre à toutes les valeurs les décale, sans changer leur dispersion.']] : [[rnd(s + k, 3), 'Multiplier toutes les valeurs par k multiplie aussi leur dispersion par k.']]] }),
      html: `${ctx} Quel est le nouvel écart type ?`,
      hint: op === 'add' ? `Ajouter ${M(a)} à chaque valeur décale toute la série de ${M(a)} : les écarts entre les valeurs (et à la moyenne) ne changent pas. Compare avec l’écart type ${M(s)} de départ.` : `Multiplier chaque valeur par ${M(k)} multiplie aussi les écarts à la moyenne par ${M(k)}. Que devient l’écart type ${M(s)} ?`,
      solution: op === 'add' ? `On a ajouté ${M(a)} à chaque valeur : la moyenne augmente de ${M(a)}, mais chaque écart à la moyenne reste le même.<br>L’écart type ne change pas : <b>${M(r)}</b>.` : `Chaque valeur est multipliée par ${M(k)}, donc la moyenne et chaque écart à la moyenne aussi : l’écart type est multiplié par ${M(k)}.<br>${M(s)} × ${M(k)} = <b>${M(r)}</b>.` };
  },
  ex: { op: 'mul', s: 2.5, k: 3, a: 5 },
  ex2: [{ op: 'add', s: 3.2, k: 3, a: 5 }],
};

export const LV4 = niveau('Écart type simple', [comparDisp, sigmaNul, sommeCarres, compVal, sigmaCalc, sigmaArr, sigmaTransf], {
  n: 4,
  intro: 'La moyenne ne dit pas tout : deux séries de même moyenne peuvent être très différentes. L’écart type mesure la dispersion des valeurs autour de leur moyenne.',
  def: `Pour une série de valeurs de moyenne m : la <b>variance</b> est la moyenne des carrés des écarts à la moyenne, <span class="nw">V = ((x₁ − m)² + (x₂ − m)² + …) ÷ N</span> ; l’<b>écart type</b> est sa racine carrée, <span class="nw">σ = √V</span>. Plus l’écart type est <b>grand</b>, plus les valeurs sont <b>dispersées</b> ; il est nul si toutes les valeurs sont égales.`,
  visuel: pointsSurDroite([{ nom: 'Série A : σ petit', vals: [11, 12, 13, 13, 14, 15] }, { nom: 'Série B : σ grand', vals: [8, 10, 12, 14, 16, 18] }], { lo: 6, hi: 20, g: 1, lab: 2 }),
  methode: ['Calcule la moyenne m de la série.', 'Pour chaque valeur, calcule l’écart à la moyenne (valeur − m), puis son carré.', 'Additionne les carrés, divise par l’effectif : c’est la variance. Prends la racine carrée : c’est l’écart type.'],
  warn: ['Oublier de passer à la racine carrée : la variance n’est pas l’écart type.', 'Additionner les écarts sans les élever au carré : leur somme vaut toujours 0.', 'Un écart type n’est jamais négatif ; il s’exprime dans la même unité que les valeurs.'],
  retenir: 'σ = √V, où V est la moyenne des carrés des écarts à la moyenne ; σ grand = valeurs dispersées, σ = 0 = valeurs toutes égales.',
});

/* ===================================================================== 5. écart type avec effectifs */
/** tableau (k valeurs consécutives, effectif total N) de moyenne entière ; mode : 'exact', 'var', 'dec' (variance décimale finie) */
function tableauSigma(d, mode, { kmin = 3, kmax = 4, Ns = [10, 12, 15, 16, 20], essais = 80000 } = {}) {
  return cherche(() => {
    const C = pick(PAS1), k = ri(kmin, kmax), N = pick(Ns), sp = pick(C.sps || [1]), W = fenetre(C, (k - 1) * sp), vals = range(0, k - 1).map(i => W.lo + i * sp), effs = effCloche(k, N);
    return { C, vals, effs };
  }, t => {
    const m = moy(t.vals, t.effs); if (!entier(m)) return false;
    const N = sum(t.effs), S2 = sum(t.vals.map((x, i) => t.effs[i] * (x - m) ** 2)), va = S2 / N;
    if (S2 === 0) return false;
    if (mode === 'exact') return entier(va) && racineExacte(va) !== null && Math.min(...t.effs) >= 1;
    if (mode === 'var') return entier(va) && racineExacte(va) === null;
    return dec(va) >= 0 && dec(va) <= 3 && racineExacte(va) === null;
  }, essais);
}
/** décomposition d'un calcul d'écart type avec effectifs */
function detailEff(C, vals, effs, dec_) {
  const N = sum(effs), S = vals.map((x, i) => x * effs[i]), m = sum(S) / N, ec = vals.map(x => x - m), ca = ec.map(e => e * e), pr = ca.map((c, i) => c * effs[i]), S2 = sum(pr), va = S2 / N, sg = Math.sqrt(va);
  const tabC = tab([[C.h, ...vals], ['Effectif', ...effs], ['Écart à la moyenne', ...ec], ['Carré de l’écart', ...ca], ['Effectif × carré', ...pr]]);
  const fin = dec_ === 0 ? `Écart type : √${M(va)} = <b>${M(sg)}</b>${C.u}.` : `Écart type : √${M(va)} ≈ <b>${M(rnd(sg, dec_))}</b>${C.u} (arrondi au ${dec_ === 1 ? 'dixième' : 'centième'}).`;
  return { N, m, ec, ca, pr, S2, va, sg, tabC, moyTxt: `Moyenne : ${somme(vals, effs)} = ${M(sum(S))}, puis ${M(sum(S))} ÷ ${M(N)} = ${M(m)}.`,
    suite: `${tabC}Somme des (effectif × carré) : ${plus(pr)} = ${M(S2)}.<br>Variance : ${M(S2)} ÷ ${M(N)} = ${M(va)}.<br>${fin}` };
}

const termeLigne = {
  id: 'terme-ligne', dmin: 0, titre: 'une ligne du calcul : effectif × (écart)²',
  draw: d => { const C = pick(PAS1), m = ri(C.lo + 3, C.hi - 3), x = m + pick([-1, 1]) * ri(1, d < 3 ? 3 : 5), n = ri(2, d < 3 ? 6 : 9); return { C, m, x, n }; },
  build: p => {
    const { C, m, x, n } = p, e = x - m, c = e * e, r = n * c;
    return { ...rNums([r], { tpl: 'Résultat : {0}', value: r, near: [[[n * e, 'Il faut élever l’écart au carré avant de multiplier par l’effectif.'], [c, `${M(c)} est le carré de l’écart : il reste à multiplier par l’effectif ${M(n)}.`]]] }),
      html: `Dans le calcul de l’écart type d’une série, la moyenne est ${fv(m, C.u)}. La valeur ${fv(x, C.u)} a pour effectif ${M(n)}. Calcule <b>effectif × (écart à la moyenne)²</b> pour cette valeur.`,
      hint: `Calcule l’écart entre ${M(x)} et la moyenne ${M(m)}, élève-le au carré, puis multiplie par l’effectif ${M(n)}.`,
      solution: `Écart à la moyenne : ${M(x)} − ${M(m)} = ${M(e)}.<br>Carré de l’écart : ${P0(e)} × ${P0(e)} = ${M(c)}.<br>Effectif × carré : ${M(n)} × ${M(c)} = <b>${M(r)}</b>.` };
  },
  ex: { C: CTX[0], m: 11, x: 14, n: 4 },
};
/** nombre entre parenthèses s'il est négatif */
function P0(e) { return e < 0 ? `(${M(e)})` : M(e); }

const sigmaEff = {
  id: 'sigma-eff', dmin: 0, titre: 'écart type avec effectifs (valeur exacte)',
  draw: d => tableauSigma(d, 'exact', { kmin: 4, kmax: 4, Ns: [12, 16, 20, 24] }),
  build: p => {
    const { C, vals, effs } = p, D = detailEff(C, vals, effs, 0);
    return { ...rNums([D.sg], { tpl: tplU('Écart type', C), value: D.sg, near: [[[D.va, `${M(D.va)} est la variance : l’écart type est sa racine carrée.`]]] }),
      html: `${C.tab}${tabEff(C, vals, effs)}Calcule l’écart type de cette série (le résultat est un nombre entier).`,
      hint: `Commence par la moyenne : chaque valeur (${vals.map(M).join(', ')}) est multipliée par son effectif, la somme est divisée par ${M(D.N)}. Puis écarts, carrés pondérés par les effectifs, variance, racine carrée.`,
      solution: `${D.moyTxt}<br>${D.suite}`, meta: { sigma: D.sg, dec: 0, liste: { vals, effs } } };
  },
  ex: { C: CTX[0], vals: [8, 9, 10, 11], effs: [1, 3, 3, 5] },
};

const varianceEff = {
  id: 'variance-eff', dmin: 1, titre: 'variance avec effectifs',
  draw: d => tableauSigma(d, 'dec', { kmin: 3, kmax: 4, Ns: [10, 20, 25, 40] }),
  build: p => {
    const { C, vals, effs } = p, D = detailEff(C, vals, effs, 1);
    return { ...rNums([D.va], { tpl: 'Variance : {0}', value: D.va, near: [[[D.S2, `${M(D.S2)} est la somme des (effectif × carré) : divise-la par l’effectif total ${M(D.N)}.`], [D.sg, 'C’est l’écart type (racine de la variance) : on demande la variance.']]] }),
      html: `${C.tab}${tabEff(C, vals, effs)}La moyenne de cette série est ${fv(D.m, C.u)}. Calcule sa variance.`,
      hint: `Pour chaque valeur (${vals.map(M).join(', ')}), calcule le carré de l’écart à la moyenne ${M(D.m)}, multiplie-le par l’effectif, additionne, puis divise par l’effectif total ${M(D.N)}.`,
      solution: `${D.suite.replace(/<br>Écart type[\s\S]*$/, '')}`, meta: { liste: { vals, effs } } };
  },
  ex: { C: CTX[0], vals: [8, 9, 10, 11], effs: [1, 3, 3, 5] },
};

const moySigma = {
  id: 'moy-sigma', dmin: 2, titre: 'moyenne et écart type',
  draw: d => tableauSigma(d, 'exact', { kmin: 4, kmax: 5, Ns: [12, 15, 16, 20, 24, 25] }),
  build: p => {
    const { C, vals, effs } = p, D = detailEff(C, vals, effs, 0);
    return { ...rNums([D.m, D.sg], { tpl: `Moyenne : {0}${C.u} Écart type : {1}${C.u}`, value: D.sg, near: [[], [[D.va, `${M(D.va)} est la variance : l’écart type est sa racine carrée.`]]] }),
      html: `${C.tab}${tabEff(C, vals, effs)}Calcule la moyenne et l’écart type de cette série (résultats entiers).`,
      hint: `Moyenne : somme des produits valeur × effectif (${M(vals[0])} × ${M(effs[0])}, ${M(vals[1])} × ${M(effs[1])} …) divisée par ${M(D.N)}. Puis écarts à cette moyenne, carrés pondérés, variance, racine carrée.`,
      solution: `${D.moyTxt}<br>${D.suite}`, meta: { sigma: D.sg, dec: 0, liste: { vals, effs } } };
  },
  ex: { C: CTX[0], vals: [8, 9, 10, 11], effs: [2, 2, 6, 6] },
};

const sigmaArrEff = {
  id: 'sigma-arr-eff', dmin: 3, titre: 'écart type avec effectifs (arrondi)',
  draw: d => { const t = tableauSigma(d, 'dec', { kmax: 5, Ns: [20, 25, 40] }); return t && { ...t, dec: d < 5 ? 1 : pick([1, 2]) }; },
  build: p => {
    const { C, vals, effs, dec: k } = p, D = detailEff(C, vals, effs, k), prec = k === 1 ? 'dixième' : 'centième';
    return { ...rNums([rnd(D.sg, k)], { tpl: tplU('Écart type', C), value: rnd(D.sg, k), near: [[[D.va, `${M(D.va)} est la variance : prends-en la racine carrée.`]]] }),
      html: `${C.tab}${tabEff(C, vals, effs)}Calcule l’écart type de cette série, arrondi au ${prec} (la calculatrice est utile pour la racine carrée).`,
      hint: `Moyenne des ${M(sum(effs))} données avec les effectifs, écarts à cette moyenne, carrés pondérés par les effectifs, variance, puis racine carrée arrondie au ${prec}.`,
      solution: `${D.moyTxt}<br>${D.suite}`, meta: { sigma: D.sg, dec: k, liste: { vals, effs } } };
  },
  ex: { C: CTX[0], vals: [8, 9, 10, 11, 12], effs: [2, 4, 8, 4, 2], dec: 1 },
};

const sigmaFreq = {
  id: 'sigma-freq', dmin: 4, titre: 'écart type avec des fréquences',
  draw: d => cherche(() => {
    const C = pick(PAS1), k = 4, W = fenetre(C, k - 1), vals = range(W.lo, W.lo + k - 1), fr = partition(20, k, 1).map(x => x * 5);
    return { C, vals, fr };
  }, t => { const m = moy(t.vals, t.fr); if (!entier(m)) return false; const va = variance(t.vals, t.fr); return entier(va) && racineExacte(va) !== null && va >= 1; }, 80000),
  build: p => {
    const { C, vals, fr } = p, S = sum(vals.map((x, i) => x * fr[i])), m = S / 100, ec = vals.map(x => x - m), ca = ec.map(e => e * e), pr = ca.map((c, i) => c * fr[i]), S2 = sum(pr), va = S2 / 100, sg = Math.sqrt(va);
    const tabC = tab([[C.h, ...vals], ['Fréquence (%)', ...fr], ['Écart à la moyenne', ...ec], ['Carré de l’écart', ...ca], ['Fréquence × carré', ...pr]]);
    return { ...rNums([sg], { tpl: tplU('Écart type', C), value: sg, near: [[[va, `${M(va)} est la variance : l’écart type est sa racine carrée.`], [S2, 'Les fréquences sont en pourcentage : il faut diviser la somme par 100.']]] }),
      html: `${C.tab}${tab([[C.h, ...vals], ['Fréquence (%)', ...fr]])}Calcule l’écart type de cette série (le résultat est un nombre entier).`,
      hint: `Les fréquences sont en pourcentage (${fr.map(M).join(' %, ')} %) : la moyenne est la somme des valeurs multipliées par leur fréquence, divisée par 100. Il en est de même pour la variance.`,
      solution: `Moyenne : ${somme(vals, fr, (x, f) => `${M(f)} × ${M(x)}`)} = ${M(S)}, puis ${M(S)} ÷ 100 = ${M(m)}.<br>${tabC}Somme des (fréquence × carré) : ${plus(pr)} = ${M(S2)}.<br>Variance : ${M(S2)} ÷ 100 = ${M(va)}.<br>Écart type : √${M(va)} = <b>${M(sg)}</b>${C.u}.`, meta: { sigma: sg, dec: 0, liste: { vals, effs: fr } } };
  },
  ex: { C: CTX[0], vals: [8, 9, 10, 11], fr: [10, 20, 30, 40] },
};

export const LV5 = niveau('Écart type, effectifs', [termeLigne, sigmaEff, varianceEff, moySigma, sigmaArrEff, sigmaFreq], {
  n: 5,
  intro: 'Avec un tableau d’effectifs, chaque valeur compte autant de fois que son effectif : on pondère les carrés des écarts, comme on pondère les valeurs pour la moyenne.',
  def: `Pour une série de valeurs x₁, x₂, … d’effectifs n₁, n₂, … et d’effectif total N, de moyenne m : <span class="nw">V = (n₁ × (x₁ − m)² + n₂ × (x₂ − m)² + …) ÷ N</span> et <span class="nw">σ = √V</span>. Avec des fréquences f₁, f₂, … : <span class="nw">V = f₁ × (x₁ − m)² + f₂ × (x₂ − m)² + …</span>`,
  visuel: tab([['Valeur x', 9, 10, 11], ['Effectif n', 3, 4, 3], ['Écart x − m (m = 10)', -1, 0, 1], ['Carré', 1, 0, 1], ['n × carré', 3, 0, 3]]) + histogramme([8.5, 9.5, 10.5, 11.5], [3, 4, 3], { gy: 1, ly: 1, xtitle: 'valeur x (m = 10, V = 6 ÷ 10 = 0,6)' }),
  methode: ['Calcule la moyenne m avec les effectifs.', 'Dans un tableau : écart à la moyenne, carré, puis effectif × carré pour chaque valeur.', 'Additionne la dernière ligne, divise par l’effectif total N (variance), puis prends la racine carrée.'],
  warn: ['Oublier de multiplier le carré de l’écart par l’effectif.', 'Diviser par le nombre de valeurs différentes au lieu de l’effectif total N.', 'Avec des fréquences en pourcentage, penser à diviser par 100.'],
  retenir: 'V = somme des (effectif × carré de l’écart) ÷ N ; σ = √V.',
});

/* ===================================================================== 6. données en classes */
export const CTXC = [
  { id: 'trajet', h: 'Durée du trajet (min)', u: ' min', ent: 'élèves', ws: [5, 10], a0: () => 0, intro: 'Le tableau donne la durée (en minutes) du trajet entre la maison et le lycée des élèves d’une classe, regroupée en classes.', liste: n => `Voici la durée (en minutes) du trajet entre la maison et le lycée de ${n} élèves.`, hist: () => 'Voici l’histogramme de la durée (en minutes) du trajet entre la maison et le lycée des élèves d’une classe.' },
  { id: 'taille', h: 'Taille (cm)', u: ' cm', ent: 'élèves', ws: [5, 10], a0: () => 150, intro: 'Le tableau donne la taille (en cm) des élèves d’un lycée, regroupée en classes.', liste: n => `Voici la taille (en cm) de ${n} élèves d’un lycée.`, hist: () => 'Voici l’histogramme de la taille (en cm) des élèves d’un lycée.' },
  { id: 'bagage', h: 'Masse du bagage (kg)', u: ' kg', ent: 'bagages', ws: [2, 4], a0: () => 10, intro: 'Le tableau donne la masse (en kg) des bagages en soute enregistrés pour un vol, regroupée en classes.', liste: n => `Voici la masse (en kg) de ${n} bagages en soute.`, hist: () => 'Voici l’histogramme de la masse (en kg) des bagages en soute enregistrés pour un vol.' },
  { id: 'salaire', h: 'Salaire mensuel (€)', u: ' €', ent: 'salariés', ws: [200, 500], a0: () => 1400, intro: 'Le tableau donne le salaire mensuel net (en €) des salariés d’une entreprise, regroupé en classes.', liste: n => `Voici le salaire mensuel net (en €) de ${n} salariés d’une entreprise.`, hist: () => 'Voici l’histogramme du salaire mensuel net (en €) des salariés d’une entreprise.' },
];
/** k classes de même amplitude w à partir de a0 : bornes b0 … bk */
export const classesDe = (C, k, w, a0) => range(0, k).map(i => a0 + i * w);
export const cl = (a, b) => `[${M(a)}&nbsp;;&nbsp;${M(b)}[`;
const tabClasses = (C, bornes, effs, lab = 'Effectif') => tab([[C.h, ...bornes.slice(0, -1).map((b, i) => cl(b, bornes[i + 1]))], [lab, ...effs]]);
const tirageClasses = (d, kmax = 5) => { const C = pick(CTXC), w = pick(C.ws), k = ri(4, kmax), a0 = C.a0() + (C.id === 'trajet' ? 0 : w * ri(0, 1)); return { C, bornes: classesDe(C, k, w, a0), effs: effCloche(k, pick([20, 25, 30, 40, 50])) }; };

const centre = {
  id: 'centre', dmin: 0, titre: 'centre d’une classe',
  draw: d => { const C = pick(CTXC), w = pick(C.ws), a = C.a0() + w * ri(0, 6); return { C, a, b: a + w }; },
  build: p => {
    const { C, a, b } = p, c = (a + b) / 2;
    return { ...rNums([c], { tpl: tplU('Centre', C), value: c, near: [[[b - a, `${M(b - a)} est l’amplitude de la classe : le centre est le milieu de la classe.`], [(b - a) / 2, 'C’est la demi-amplitude : le centre est la borne de gauche plus cette demi-amplitude.']]] }),
      html: `On regroupe des ${C.ent} en classes. Quel est le centre de la classe ${cl(a, b)} (en ${C.u.trim()}) ?`,
      hint: `Le centre d’une classe est le milieu de ses deux bornes ${M(a)} et ${M(b)} : additionne les deux bornes puis divise par 2.`,
      solution: `Centre : (${M(a)} + ${M(b)}) ÷ 2 = ${M(a + b)} ÷ 2 = <b>${M(c)}</b>${C.u}.` };
  },
  ex: { C: CTXC[0], a: 20, b: 30 },
};

const classeDe = {
  id: 'classe-de', dmin: 0, titre: 'dans quelle classe se trouve une valeur ?',
  draw: d => { const C = pick(CTXC), w = pick(C.ws), k = 5, a0 = C.a0(), bornes = classesDe(C, k, w, a0), bord = d >= 2 && chance(0.5); const i = ri(1, k - 2); const v = bord ? bornes[i] : bornes[i] + ri(1, w - 1); return { C, bornes, v, s: Math.min(Math.max(i - ri(0, 3), 0), k - 4) }; },
  build: p => {
    const { C, bornes, v, s } = p, i = bornes.findIndex((b, k) => v >= b && v < bornes[k + 1]);
    const cand = [s, s + 1, s + 2, s + 3];
    const lig = k => cl(bornes[k], bornes[k + 1]);
    const items = cand.slice(0, 4).map(k => ({ l: lig(k), ok: k === i, why: k === i - 1 && v === bornes[i] ? `${M(v)} est la borne de droite de ${lig(k)} : cette borne est exclue. La classe ${cl(bornes[k], bornes[k + 1])} s’arrête juste avant ${M(v)}.` : `${M(v)} ${v < bornes[k] ? 'est plus petit que' : 'est plus grand que ou égal à'} ${M(v < bornes[k] ? bornes[k] : bornes[k + 1])} : regarde les bornes de ${lig(k)}.` }));
    if (items.length < 4 || new Set(items.map(x => x.l)).size < 4) return null;
    return { ...rChoice(items, { ordre: true, indep: lig(i) }),
      html: `Les classes sont de la forme [a&nbsp;;&nbsp;b[ (la borne a est comprise, la borne b ne l’est pas). Dans quelle classe se trouve la valeur ${fv(v, C.u)} (${C.h.split(' (')[0].toLowerCase()}) ?`,
      hint: `Cherche la classe dont la borne de gauche est inférieure ou égale à ${M(v)} et dont la borne de droite est strictement supérieure à ${M(v)} (l’amplitude est ${M(bornes[1] - bornes[0])}).`,
      solution: `${M(bornes[i])} ≤ ${M(v)} &lt; ${M(bornes[i + 1])} : la valeur ${M(v)} est dans la classe <b>${lig(i)}</b>.` };
  },
  ex: { C: CTXC[0], bornes: [0, 10, 20, 30, 40, 50], v: 30, s: 1 },
};

const effClasse = {
  id: 'eff-classe', dmin: 1, titre: 'compter les valeurs d’une classe',
  draw: d => { const C = pick(CTXC.filter(c => c.id !== 'salaire')), w = pick(C.ws), a0 = C.a0(), k = 4, bornes = classesDe(C, k, w, a0), n = ri(14, d < 3 ? 16 : 20); const L = Array.from({ length: n }, () => ri(Math.max(bornes[0], C.id === 'trajet' ? 1 : 0), bornes[k] - 1)); if (d >= 2) { L[0] = bornes[1]; L[1] = bornes[2]; } return { C, bornes, L, j: ri(0, k - 1) }; },
  build: p => {
    const { C, bornes, L, j } = p, a = bornes[j], b = bornes[j + 1], dans = L.filter(x => x >= a && x < b), r = dans.length;
    if (r < 2) return null;
    return { ...rNums([r], { tpl: 'Effectif : {0}', value: r, near: [[[L.filter(x => x >= a && x <= b).length, `Attention : dans ${cl(a, b)}, la borne ${M(b)} est exclue.`]]] }),
      html: `${C.liste(L.length)}${big(lst(L))}Combien de ces valeurs sont dans la classe ${cl(a, b)} ?`,
      hint: `Parcours la liste et compte les valeurs supérieures ou égales à ${M(a)} et strictement inférieures à ${M(b)} (la borne ${M(b)} n’est pas dans la classe).`,
      solution: `Les valeurs vérifiant ${M(a)} ≤ valeur &lt; ${M(b)} sont : ${lst(dans)}.<br>Il y en a <b>${M(r)}</b>.` };
  },
  ex: { C: CTXC[0], bornes: [0, 10, 20, 30], L: [12, 25, 7, 18, 20, 9, 14, 29, 22, 15, 5, 20, 8, 11], j: 1 },
};

const moyClasses = {
  id: 'moy-classes', dmin: 1, titre: 'moyenne estimée avec les centres des classes',
  draw: d => cherche(() => tirageClasses(d, d < 3 ? 4 : 5), t => { const c = t.bornes.slice(0, -1).map((b, i) => (b + t.bornes[i + 1]) / 2), m = moy(c, t.effs); return dec(m) >= 0 && dec(m) <= 2; }),
  build: p => {
    const { C, bornes, effs } = p, N = sum(effs), c = bornes.slice(0, -1).map((b, i) => (b + bornes[i + 1]) / 2), S = sum(c.map((x, i) => x * effs[i])), m = S / N;
    return { ...rNums([m], { tpl: tplU('Moyenne estimée', C), value: m, near: [[[mean(c), 'Tu as fait la moyenne des centres sans tenir compte des effectifs.'], [S, `${M(S)} est la somme des (effectif × centre) : divise par l’effectif total ${M(N)}.`]]] }),
      html: `${C.intro}${tabClasses(C, bornes, effs)}Estime la moyenne de cette série en utilisant les centres des classes.`,
      hint: `Calcule le centre de chaque classe (${M((bornes[0] + bornes[1]) / 2)} pour ${cl(bornes[0], bornes[1])}, …), multiplie chaque centre par l’effectif de sa classe, additionne, puis divise par ${M(N)}.`,
      solution: `Centres des classes : ${lst(c)}.<br>Somme : ${somme(c, effs)} = ${M(S)}.<br>Effectif total : ${plus(effs)} = ${M(N)}.<br>Moyenne estimée : ${M(S)} ÷ ${M(N)} = <b>${M(m)}</b>${C.u}.` };
  },
  ex: { C: CTXC[0], bornes: [0, 10, 20, 30, 40], effs: [2, 6, 8, 4] },
};

const freqClasses = {
  id: 'freq-classes', dmin: 2, titre: 'proportion de valeurs dans plusieurs classes',
  draw: d => cherche(() => { const t = tirageClasses(d, 5), k = t.effs.length, i = ri(0, k - 2); return { ...t, i, j: ri(i + 1, k - 1), seuil: chance(0.5) }; }, t => { const N = sum(t.effs); return [10, 20, 25, 40, 50].includes(N) || N === 20; }),
  build: p => {
    const { C, bornes, effs, j } = p, N = sum(effs), s = sum(effs.slice(0, j)), f = s / N * 100;
    if (dec(f) < 0 || dec(f) > 2) return null;
    const lim = bornes[j];
    return { ...rNums([f], { tpl: 'Proportion : {0} %', value: f, near: [[[s, 'Tu as donné un effectif : la proportion est cet effectif divisé par l’effectif total, en %.'], [100 - f, 'Tu as calculé la proportion des valeurs de l’autre côté de la limite.']]] }),
      html: `${C.intro}${tabClasses(C, bornes, effs)}Quel pourcentage des ${C.ent} ont une valeur strictement inférieure à ${fv(lim, C.u)} ?`,
      hint: `Additionne les effectifs des classes situées avant ${M(lim)} (${effs.slice(0, j).map(M).join(' + ')}), puis divise par l’effectif total ${M(N)}.`,
      solution: `Classes avant ${M(lim)} : ${sm(effs.slice(0, j))} ${C.ent}.<br>Effectif total : ${plus(effs)} = ${M(N)}.<br>Proportion : ${M(s)} ÷ ${M(N)} = ${M(f / 100)}, soit <b>${M(f)} %</b>.` };
  },
  ex: { C: CTXC[0], bornes: [0, 10, 20, 30, 40], effs: [3, 5, 8, 4], j: 2 },
};

const estimExacte = {
  id: 'estim-exacte', dmin: 3, titre: 'moyenne exacte et moyenne estimée',
  draw: d => cherche(() => { const C = pick(CTXC.filter(c => c.id !== 'salaire')), w = C.ws[C.ws.length - 1], a0 = C.a0(), bornes = classesDe(C, 3, w, a0); const L = Array.from({ length: 10 }, () => ri(Math.max(bornes[0], C.id === 'trajet' ? 1 : 0), bornes[3] - 1)); return { C, bornes, L }; }, t => new Set(t.L).size >= 7),
  build: p => {
    const { C, bornes, L } = p, k = bornes.length - 1, effs = range(0, k - 1).map(i => L.filter(x => x >= bornes[i] && x < bornes[i + 1]).length);
    if (effs.some(e => e === 0)) return null;
    const c = bornes.slice(0, -1).map((b, i) => (b + bornes[i + 1]) / 2), S = sum(L), Se = sum(c.map((x, i) => x * effs[i])), me = S / 10, mc = Se / 10;
    return { ...rNums([me, mc], { tpl: `Moyenne exacte : {0}${C.u} Moyenne estimée : {1}${C.u}`, value: mc, near: [[], []], verify: E => Math.abs(E[0] - mean(L)) < 1e-9 }),
      html: `${C.liste(10)}${big(lst(L))}Ces valeurs sont regroupées en classes.${tabClasses(C, bornes, effs)}Calcule la moyenne exacte de la série, puis la moyenne estimée avec les centres des classes.`,
      hint: `Moyenne exacte : additionne les 10 valeurs (${L.slice(0, 3).map(M).join(' + ')} …) et divise par 10. Moyenne estimée : utilise les centres des classes ${lst(c)} pondérés par les effectifs.`,
      solution: `Moyenne exacte : ${plus(L)} = ${M(S)}, puis ${M(S)} ÷ 10 = <b>${M(me)}</b>${C.u}.<br>Centres : ${lst(c)}. Somme : ${somme(c, effs)} = ${M(Se)}, puis ${M(Se)} ÷ 10 = <b>${M(mc)}</b>${C.u}.<br>Les deux valeurs sont proches mais pas égales : le regroupement en classes fait perdre un peu de précision.` };
  },
  ex: { C: CTXC[0], bornes: [0, 10, 20, 30], L: [4, 8, 12, 15, 17, 21, 22, 26, 13, 18] },
};

export const LV6 = niveau('Données en classes', [centre, classeDe, effClasse, moyClasses, freqClasses, estimExacte], {
  n: 6,
  intro: 'Quand les données sont nombreuses ou très variées (durées, tailles, salaires…), on les regroupe en classes de même amplitude. On perd un peu de précision, mais on y gagne en lisibilité.',
  def: `Une <b>classe</b> [a&nbsp;;&nbsp;b[ contient les valeurs x telles que a ≤ x &lt; b. Son <b>amplitude</b> est b − a et son <b>centre</b> est <span class="nw">(a + b) ÷ 2</span>. La <b>moyenne estimée</b> d’une série en classes se calcule comme une moyenne pondérée, en remplaçant chaque classe par son centre.`,
  visuel: tabClasses(CTXC[0], [0, 10, 20, 30], [5, 8, 7]) + tab([['Centre', 5, 15, 25]]) + histogramme([0, 10, 20, 30], [5, 8, 7], { gy: 1, ly: 1, xtitle: 'durée du trajet (min)' }),
  methode: ['Repère les bornes : a est compris dans la classe, b est exclu.', 'Calcule le centre de chaque classe : (a + b) ÷ 2.', 'Moyenne estimée : somme des (effectif × centre) ÷ effectif total.'],
  warn: ['La valeur b (borne de droite) appartient à la classe suivante, pas à [a&nbsp;;&nbsp;b[.', 'La moyenne calculée avec les centres est une estimation : elle n’est en général pas égale à la moyenne exacte.', 'Ne pas oublier les effectifs : la moyenne des centres seule est fausse.'],
  retenir: 'classe [a&nbsp;;&nbsp;b[ : centre (a + b) ÷ 2 ; moyenne estimée = somme des (effectif × centre) ÷ effectif total.',
});

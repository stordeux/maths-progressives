// Arithmétique, niveaux 7 à 12 : décomposition, PGCD, fractions irréductibles, partages, PPCM, défis.
import { ri, pick, shuffle, chance } from '../../engine/util/rand.js';
import { numsCheck, choiceCheck } from '../../engine/answers/checks.js';
import { F } from '../../engine/util/fmt.js';
import { arbre, venn, simplif, paquets, carreaux, frise, pairesImpaires, rectangles } from './draw.js';
import {
  diviseurs, estPremier, facteurs, petitFacteur, valeur, pgcd, ppcm, big, gr, sup, pw, fdec, fdecLong, EXP, liste, OUI_NON, yn, choixNombres, ex, warn, retenir, methode, def, cols, tirer,
} from './outils.js';

/** produit de p^e sur une liste de nombres premiers (calcul par boucle) */
const prodExp = (primes, exps) => primes.reduce((s, p, i) => { for (let k = 0; k < exps[i]; k++) s *= p; return s; }, 1);
const gcdBrute = (a, b) => { for (let k = Math.min(a, b); k >= 1; k--) if (a % k === 0 && b % k === 0) return k; return 1; };
const lcmBrute = (a, b) => { for (let m = Math.max(a, b); ; m += Math.max(a, b)) if (m % a === 0 && m % b === 0) return m; };

/* =====================================================================
   7. Décomposition en facteurs premiers
   ===================================================================== */
/** nombre tiré en multipliant nf nombres premiers de la liste, avec lo ≤ N ≤ hi */
function tireProduit(primes, nfLo, nfHi, lo, hi, exige = () => true) {
  for (let t = 0; t < 4000; t++) {
    const nf = ri(nfLo, nfHi), fs = Array.from({ length: nf }, () => pick(primes));
    const N = fs.reduce((s, x) => s * x, 1);
    if (N >= lo && N <= hi && exige(N)) return N;
  }
  throw new Error('tireProduit : aucun nombre');
}
export function L7(d) {
  const formes = d < 1 ? ['decomp'] : d < 2 ? ['decomp', 'verif'] : d < 3 ? ['decomp', 'verif', 'retour'] : ['decomp', 'verif', 'retour', 'grand'];
  const f = pick(formes);
  const N = d < 1 ? tireProduit([2, 3, 5], 2, 3, 12, 60) : d < 2 ? tireProduit([2, 3, 5, 7], 3, 4, 24, 200) : d < 3 ? tireProduit([2, 3, 5, 7], 3, 5, 60, 600) : d < 4 ? tireProduit([2, 3, 5, 7], 4, 6, 200, 2000) : tireProduit([2, 3, 5, 7, 11, 13], 3, 6, 100, 20000, n => facteurs(n).some(([p]) => p >= 11));
  const fac = facteurs(N), primes = d < 4 ? [2, 3, 5, 7] : [2, 3, 5, 7, 11, 13];
  if (f === 'decomp') {
    const E = primes.map(p => (fac.find(x => x[0] === p) || [p, 0])[1]);
    const petit = petitFacteur(N);
    const check = v => {
      if (v.every((x, i) => x === E[i])) return { ok: true };
      const P = prodExp(primes, v), bad = E.map((e, i) => (v[i] === e ? -1 : i)).filter(i => i >= 0);
      let msg;
      if (!isFinite(P) || P > 1e9) msg = `Ton écriture donne un nombre beaucoup trop grand : revois tes exposants.`;
      else if (P < N && N % P === 0) msg = `Ton écriture vaut ${gr(P)}, pas ${gr(N)} : il manque des facteurs.`;
      else if (P > N) msg = `Ton écriture vaut ${gr(P)}, c'est trop grand : un exposant est trop fort.`;
      else msg = `Ton écriture vaut ${gr(P)}, pas ${gr(N)}. Refais les divisions une par une.`;
      return { ok: false, bad, msg };
    };
    check.expected = E;
    return {
      type: 'nums', keys: { neg: false },
      tpl: `${gr(N)} = ` + primes.map((p, i) => `<span>${p}</span>${EXP(i)}`).join(' <span>×</span> '),
      labels: primes.map(p => `exposant de ${p}`),
      html: `Décompose ${gr(N)} en produit de facteurs premiers. Écris les exposants ; mets 0 pour un nombre premier qui n'apparaît pas.`,
      check, verify: Ev => prodExp(primes, Ev) === N,
      hint: `Divise ${gr(N)} par ${petit} (le plus petit nombre premier qui le divise), puis recommence avec le quotient ${gr(N / petit)}, jusqu'à obtenir 1. Compte combien de fois chaque nombre premier a servi.`,
      solution: (() => { let r = N, l = []; while (r > 1) { const p = petitFacteur(r); l.push(`${gr(r)} = ${p} × ${gr(r / p)}`); r /= p; } return l.join('<br>') + `<br>Donc ${gr(N)} = ${fdec(fac)}.`; })(),
      afterVisual: arbre(N, fac),
    };
  }
  if (f === 'verif') {
    const longue = fac.flatMap(([p, e]) => Array(e).fill(p));
    const sc = pick(['oui', 'prem', 'prod']);
    let items = longue.slice();
    if (sc === 'prem') {
      // on fusionne deux facteurs : le produit reste N mais un facteur n'est plus premier
      const i = ri(0, items.length - 2), j = ri(i + 1, items.length - 1);
      const m = items[i] * items[j]; items = items.filter((_, k) => k !== i && k !== j); items.push(m);
      items.sort((a, b) => a - b);
    } else if (sc === 'prod') {
      const i = ri(0, items.length - 1);
      let q; do { q = pick([2, 3, 5, 7]); } while (q === items[i]);
      items[i] = q; items.sort((a, b) => a - b);
    }
    const P = items.reduce((s, x) => s * x, 1), compo = items.find(x => !estPremier(x));
    const E = sc === 'oui' ? 'oui' : sc === 'prem' ? 'prem' : 'prod';
    const opts = [{ v: 'oui', l: 'Oui, c\'est la décomposition en facteurs premiers' }, { v: 'prem', l: 'Non : un des facteurs n\'est pas premier' }, { v: 'prod', l: `Non : le produit n'est pas égal à ${gr(N)}` }];
    return {
      type: 'choice', opts, html: `Voici une écriture de ${gr(N)} : ${big(`${gr(N)} = ${items.join(' × ')}`)}Est-ce la décomposition de ${gr(N)} en produit de facteurs premiers ?`,
      check: choiceCheck(E, { msg: c => (E === 'prem' ? `Le produit est bon, mais regarde le facteur ${compo} : ${compo} = ${petitFacteur(compo)} × ${compo / petitFacteur(compo)}, il n'est pas premier.` : E === 'prod' ? `Calcule le produit : ${items.join(' × ')} = ${gr(P)}, et ce n'est pas ${gr(N)}.` : c === 'prem' ? `Vérifie chaque facteur : ils sont tous premiers.` : `Calcule le produit : ${items.join(' × ')} = ${gr(N)}, c'est bon.`) }),
      verify: Eq => { const sieveOk = items.every(x => { if (x < 2) return false; for (let k = 2; k < x; k++) if (x % k === 0) return false; return true; }); const prod = items.reduce((s, x) => s * x, 1); return Eq === (!sieveOk && prod === N ? 'prem' : sieveOk && prod === N ? 'oui' : 'prod'); },
      hint: `Vérifie deux choses sur ${items.join(' × ')} : chaque facteur est-il un nombre premier ? et le produit vaut-il bien ${gr(N)} ?`,
      solution: sc === 'oui' ? `Tous les facteurs (${items.join(', ')}) sont premiers et ${items.join(' × ')} = ${gr(N)} : c'est la décomposition.` : sc === 'prem' ? `Le produit vaut bien ${gr(N)}, mais ${compo} n'est pas premier (${compo} = ${petitFacteur(compo)} × ${compo / petitFacteur(compo)}) : il faut continuer à décomposer. La vraie décomposition est ${fdec(fac)}.` : `${items.join(' × ')} = ${gr(P)}, et ${gr(P)} ≠ ${gr(N)} : l'écriture est fausse. La bonne décomposition est ${fdec(fac)}.`,
    };
  }
  if (f === 'retour') {
    const ps = shuffle([2, 3, 5, 7]).slice(0, ri(2, 3)).sort((a, b) => a - b), es = ps.map(p => ri(1, p === 2 ? 4 : 3));
    const Nn = prodExp(ps, es), expr = ps.map((p, i) => pw(p, es[i])).join(' × ');
    return {
      type: 'nums', tpl: 'Réponse : {0}', keys: { neg: false }, html: `Calcule ${expr}.`,
      check: numsCheck([Nn], { msg: v => (v[0] === ps.reduce((s, p, i) => s * p * es[i], 1) ? `Attention : ${pw(ps[0], es[0])} n'est pas ${ps[0]} × ${es[0]} ; c'est ${ps[0]} multiplié par lui-même ${es[0]} fois.` : '') }),
      value: ps.reduce((s, p, i) => s * Math.pow(p, es[i]), 1),
      hint: `Calcule d'abord chaque puissance séparément (${ps.map((p, i) => pw(p, es[i])).join(' ; ')}), puis multiplie les résultats entre eux.`,
      solution: `${ps.map((p, i) => `${pw(p, es[i])} = ${Math.pow(p, es[i])}`).join(' ; ')}.<br>${ps.map((p, i) => Math.pow(p, es[i])).join(' × ')} = ${gr(Nn)}.`,
    };
  }
  // grand
  const gp = Math.max(...fac.map(x => x[0]));
  return {
    type: 'nums', tpl: 'Réponse : {0}', keys: { neg: false }, html: `Quel est le plus grand facteur premier de ${gr(N)} ?`,
    check: numsCheck([gp], { msg: v => (v[0] !== 1 && N % v[0] === 0 && !estPremier(v[0]) ? `${v[0]} divise ${gr(N)}, mais il n'est pas premier : il se décompose encore.` : v[0] === N ? `${gr(N)} n'est pas premier : il se décompose.` : '') }),
    value: (() => { let m = N, best = 1; for (let p = 2; p <= m; p++) while (m % p === 0) { best = p; m /= p; } return best; })(),
    hint: `Décompose ${gr(N)} en facteurs premiers, par exemple en divisant d'abord par ${petitFacteur(N)}. Le plus grand des nombres premiers obtenus est la réponse.`,
    solution: `${gr(N)} = ${fdec(fac)}. Les facteurs premiers sont ${fac.map(x => x[0]).join(', ')} : le plus grand est ${gp}.`,
    afterVisual: arbre(N, fac),
  };
}
export function C7() {
  return `<h2>7. Décomposer en facteurs premiers</h2>
<p class="intro">Tout entier plus grand que 1 s'écrit, d'une seule façon, comme un <b>produit de nombres premiers</b>. C'est sa « carte d'identité ».</p>
${cols(def(`<b>Décomposer N en facteurs premiers</b>, c'est l'écrire comme un produit de nombres premiers (avec des exposants pour les répétitions). Par exemple<br><b>60 = 2 × 2 × 3 × 5 = 2<sup>2</sup> × 3 × 5</b>.<br>Cette écriture est <b>unique</b> (à l'ordre près).`), arbre(60, [[2, 2], [3, 1], [5, 1]]))}
${methode(['Divise N par le plus petit nombre premier qui le divise (2, puis 3, 5, 7…).', 'Recommence avec le quotient, jusqu\'à obtenir 1.', 'Écris le produit de tous les diviseurs utilisés, avec des exposants.'])}
${ex('Décompose 60 en produit de facteurs premiers. Écris les exposants ; mets 0 pour un nombre premier qui n\'apparaît pas.', `60 = 2 × 30 ; 30 = 2 × 15 ; 15 = 3 × 5 ; 5 est premier.<br>60 = 2<sup>2</sup> × 3 × 5. Dans le gabarit : exposant de 2 : <b>2</b>, de 3 : <b>1</b>, de 5 : <b>1</b>, de 7 : <b>0</b> (7 n'apparaît pas).`)}
${ex('Décompose 924 en produit de facteurs premiers (avec 11 et 13 possibles).', `924 = 2 × 462 ; 462 = 2 × 231 ; 231 = 3 × 77 ; 77 = 7 × 11.<br>924 = 2<sup>2</sup> × 3 × 7 × 11 : exposants <b>2 ; 1 ; 0 ; 1 ; 1 ; 0</b> pour 2, 3, 5, 7, 11, 13.`)}
${ex('Voici une écriture de 60 : 60 = 4 × 3 × 5. Est-ce la décomposition de 60 en produit de facteurs premiers ?', `4 × 3 × 5 = 60, le produit est bon. Mais 4 = 2 × 2 n'est pas premier. Réponse : <b>Non : un des facteurs n'est pas premier</b>.`)}
${ex('Voici une écriture de 60 : 60 = 2 × 3 × 5. Est-ce la décomposition de 60 en produit de facteurs premiers ?', `Les facteurs 2, 3, 5 sont premiers, mais 2 × 3 × 5 = 30, pas 60. Réponse : <b>Non : le produit n'est pas égal à 60</b>.`)}
${ex('Voici une écriture de 60 : 60 = 2 × 2 × 3 × 5. Est-ce la décomposition de 60 en produit de facteurs premiers ?', `2, 2, 3 et 5 sont premiers et 2 × 2 × 3 × 5 = 60. Réponse : <b>Oui, c'est la décomposition en facteurs premiers</b>.`)}
${ex('Calcule 2<sup>3</sup> × 3<sup>2</sup> × 5.', `2<sup>3</sup> = 8 ; 3<sup>2</sup> = 9. 8 × 9 × 5 = 72 × 5 = <b>360</b>.`)}
${ex('Quel est le plus grand facteur premier de 924 ?', `924 = 2<sup>2</sup> × 3 × 7 × 11 : les facteurs premiers sont 2, 3, 7 et 11. Le plus grand est <b>11</b>.`)}
${warn(`⚠️ Chaque facteur doit être <b>premier</b> : 60 = 4 × 15 n'est pas une décomposition en facteurs premiers.<br>⚠️ Ne confonds pas 2<sup>3</sup> et 2 × 3 : 2<sup>3</sup> = 2 × 2 × 2 = 8.<br>⚠️ N'oublie aucun facteur : vérifie à la fin en refaisant le produit.<br>⚠️ 1 ne sert à rien dans une décomposition.`)}
${retenir('décomposer, c\'est diviser par 2, 3, 5, 7… jusqu\'à 1 ; l\'écriture obtenue (60 = 2² × 3 × 5) est unique.')}`;
}

/* =====================================================================
   8. Diviseurs communs et PGCD
   ===================================================================== */
/** (a, b, g) avec g = PGCD exact, a = g×u, b = g×v, u et v premiers entre eux, supérieurs à 1 */
function paire(gLo, gHi, uvHi, maxVal) {
  for (let t = 0; t < 5000; t++) {
    const g = ri(gLo, gHi), u = ri(2, uvHi), v = ri(2, uvHi);
    if (u !== v && pgcd(u, v) === 1 && g * u <= maxVal && g * v <= maxVal) return [g * u, g * v, g];
  }
  throw new Error('paire : aucune');
}
const P8 = d => (d < 1 ? paire(2, 6, 5, 30) : d < 2 ? paire(2, 9, 7, 60) : d < 3 ? paire(2, 15, 10, 120) : d < 4 ? paire(4, 30, 15, 300) : paire(6, 60, 25, 999));
const vennSi = (a, b) => { const da = diviseurs(a), db = diviseurs(b); return da.length <= 12 && db.length <= 12 ? venn(a, b, da, db) : undefined; };
export function L8(d) {
  const formes = d < 1 ? ['liste'] : d < 2 ? ['liste', 'direct'] : d < 3 ? ['liste', 'direct', 'decomp', 'combien'] : ['direct', 'decomp', 'combien', 'premiers', 'lequel'];
  const f = pick(formes);
  const msgPgcd = (a, b, g) => v => (v[0] === 1 && g > 1 ? `1 est un diviseur commun, mais il y en a un plus grand.` : a % v[0] === 0 && b % v[0] === 0 ? `${v[0]} est bien un diviseur commun, mais pas le plus grand : cherche encore.` : v[0] % a === 0 && v[0] % b === 0 ? `${gr(v[0])} est un multiple commun : on demande le plus grand <b>diviseur</b> commun.` : `${v[0]} ne divise pas à la fois ${a} et ${b}.`);
  if (f === 'liste') {
    const [a, b, g] = P8(Math.min(d, 1)), da = diviseurs(a), db = diviseurs(b);
    return {
      type: 'nums', tpl: 'PGCD : {0}', html: `Les diviseurs de ${a} sont : ${liste(da)}.<br>Les diviseurs de ${b} sont : ${liste(db)}.<br>Quel est le plus grand diviseur commun (PGCD) de ${a} et ${b} ?`,
      check: numsCheck([g], { msg: msgPgcd(a, b, g) }), value: gcdBrute(a, b),
      hint: `Cherche les nombres qui sont à la fois dans la liste de ${a} et dans celle de ${b} : ce sont les diviseurs communs. Le PGCD est le plus grand d'entre eux.`,
      solution: `Diviseurs communs de ${a} et ${b} : ${liste(da.filter(x => db.includes(x)))}. Le plus grand est ${g} : PGCD(${a} ; ${b}) = ${g}.`,
      afterVisual: venn(a, b, da, db),
    };
  }
  if (f === 'direct') {
    const [a, b, g] = P8(d);
    return {
      type: 'nums', tpl: 'PGCD : {0}', html: `Quel est le plus grand diviseur commun (PGCD) de ${a} et ${b} ?`,
      check: numsCheck([g], { msg: msgPgcd(a, b, g) }), value: gcdBrute(a, b),
      hint: d < 3 ? `Écris la liste des diviseurs de ${a} et celle des diviseurs de ${b}, puis cherche le plus grand nombre qui est dans les deux listes.` : `Décompose ${a} et ${b} en facteurs premiers, puis multiplie les facteurs qu'ils ont en commun (chacun avec le plus petit de ses deux exposants).`,
      solution: `${a} = ${fdec(facteurs(a))} et ${b} = ${fdec(facteurs(b))}.<br>Facteurs communs : ${fdec(facteurs(g)) || '1'} = ${g}.<br>PGCD(${a} ; ${b}) = ${g}.`,
      afterVisual: vennSi(a, b),
    };
  }
  if (f === 'decomp') {
    const base = [2, 3, 5, 7];
    let ea, eb;
    do { ea = base.map(() => (chance(.65) ? ri(0, 3) : 0)); eb = base.map(() => (chance(.65) ? ri(0, 3) : 0)); } while (prodExp(base, ea) === prodExp(base, eb) || prodExp(base, ea) < 6 || prodExp(base, eb) < 6 || pgcd(prodExp(base, ea), prodExp(base, eb)) === 1);
    const A = prodExp(base, ea), B = prodExp(base, eb), g = pgcd(A, B);
    const dec = es => base.map((p, i) => (es[i] ? pw(p, es[i]) : null)).filter(Boolean).join(' × ');
    return {
      type: 'nums', tpl: 'PGCD : {0}', html: `On donne A = ${dec(ea)} et B = ${dec(eb)}. Quel est le PGCD de A et B ?`,
      check: numsCheck([g], { msg: v => (v[0] === A || v[0] === B ? `Le PGCD ne peut pas dépasser le plus petit des deux nombres : il garde seulement les facteurs <b>communs</b>.` : v[0] > g && v[0] % g === 0 ? `Tu as gardé trop de facteurs : le PGCD ne garde que les facteurs présents dans A <b>et</b> dans B, avec le plus petit exposant.` : '') }), value: gcdBrute(A, B),
      hint: `Regarde chaque nombre premier : s'il apparaît dans A et dans B, garde-le avec le plus petit de ses deux exposants ; sinon, laisse-le de côté. Puis multiplie.`,
      solution: base.map((p, i) => (ea[i] && eb[i] ? `${p} : exposants ${ea[i]} et ${eb[i]}, on garde ${pw(p, Math.min(ea[i], eb[i]))}` : null)).filter(Boolean).join('<br>') + `<br>PGCD = ${base.map((p, i) => (ea[i] && eb[i] ? pw(p, Math.min(ea[i], eb[i])) : null)).filter(Boolean).join(' × ')} = ${g}.`,
    };
  }
  if (f === 'combien') {
    const [a, b, g] = P8(Math.min(d, 3)), nb = Array.from({ length: Math.min(a, b) }, (_, i) => i + 1).filter(k => a % k === 0 && b % k === 0).length;
    return {
      type: 'nums', tpl: 'Réponse : {0}', html: `Combien ${a} et ${b} ont-ils de diviseurs communs ?`,
      check: numsCheck([diviseurs(g).length], { msg: v => (v[0] === diviseurs(g).length - 1 ? `Presque ! 1 est aussi un diviseur commun : ne l'oublie pas.` : '') }), value: nb,
      hint: `Écris la liste des diviseurs de ${a} et celle des diviseurs de ${b}, puis compte les nombres qui sont dans les deux listes (1 en fait partie).`,
      solution: `Diviseurs communs de ${a} et ${b} : ${liste(diviseurs(g))}. Il y en a ${nb}. (Ce sont exactement les diviseurs de leur PGCD ${g}.)`,
      afterVisual: vennSi(a, b),
    };
  }
  if (f === 'premiers') {
    const oui = chance(.5);
    let a, b, g;
    if (oui) { do { a = ri(4, d < 4 ? 100 : 300); b = ri(4, d < 4 ? 100 : 300); } while (a === b || gcdBrute(a, b) !== 1); g = 1; } else [a, b, g] = P8(d);
    const p = petitFacteur(g);
    return {
      type: 'choice', opts: OUI_NON, html: `${a} et ${b} sont-ils premiers entre eux ?`,
      check: choiceCheck(yn(oui), { msg: c => (c === 'oui' ? `${a} et ${b} sont tous les deux divisibles par ${p} : leur PGCD n'est pas 1.` : `Cherche un nombre premier qui divise à la fois ${a} et ${b} : tu n'en trouveras pas, leur seul diviseur commun est 1.`) }),
      verify: E => ((gcdBrute(a, b) === 1) === (E === 'oui')),
      hint: `Deux nombres sont premiers entre eux si leur seul diviseur commun est 1. Cherche un nombre premier (2, 3, 5, 7…) qui divise à la fois ${a} et ${b}.`,
      solution: oui ? `Aucun nombre premier ne divise à la fois ${a} et ${b} (${fdec(facteurs(a))} et ${fdec(facteurs(b))}) : PGCD = 1, ils sont premiers entre eux.` : `${a} et ${b} sont tous les deux divisibles par ${p} : PGCD(${a} ; ${b}) = ${g}, ce n'est pas 1.`,
    };
  }
  // lequel
  const [a, b, g] = P8(Math.min(d, 3)), communs = diviseurs(g).filter(x => x > 1), E = pick(communs);
  const seulA = diviseurs(a).filter(x => b % x !== 0), seulB = diviseurs(b).filter(x => a % x !== 0);
  const aucun = [];
  for (let x = 2; x <= Math.max(a, b); x++) if (a % x && b % x) aucun.push(x);
  const set = new Set([E, pick(seulA), pick(seulB), pick(aucun)]);
  const opts = choixNombres([...set]);
  return {
    type: 'choice', opts, html: `Lequel de ces nombres est un diviseur commun de ${a} et de ${b} ?`,
    check: choiceCheck(String(E), { msg: c => (a % c === 0 ? `${c} divise ${a} mais ne divise pas ${b}.` : b % c === 0 ? `${c} divise ${b} mais ne divise pas ${a}.` : `${c} ne divise ni ${a} ni ${b}.`) }),
    verify: Eq => a % Eq === 0 && b % Eq === 0 && opts.filter(o => a % o.v === 0 && b % o.v === 0).length === 1,
    hint: `Un diviseur commun doit diviser ${a} <b>et</b> ${b}. Pour chacun des quatre nombres proposés, fais les deux divisions.`,
    solution: `${E} divise ${a} (${a} = ${E} × ${a / E}) et ${b} (${b} = ${E} × ${b / E}). Les autres nombres ne divisent pas les deux.`,
  };
}
export function C8() {
  return `<h2>8. Diviseurs communs et PGCD</h2>
<p class="intro">Quels nombres divisent <b>deux</b> nombres en même temps ? Le plus grand d'entre eux est le PGCD.</p>
${cols(def(`Un <b>diviseur commun</b> de a et b divise a <b>et</b> b. Le plus grand s'appelle le <b>PGCD</b> de a et b : « plus grand diviseur commun ».<br>Si leur PGCD est 1, on dit que a et b sont <b>premiers entre eux</b>.`), venn(12, 18, diviseurs(12), diviseurs(18)))}
${methode(['<b>Par les listes</b> : écris les diviseurs de a, ceux de b, et garde les communs.', '<b>Par la décomposition</b> : décompose a et b en facteurs premiers ; garde les facteurs communs, chacun avec le plus petit exposant ; multiplie.'])}
${ex('Les diviseurs de 12 sont : 1, 2, 3, 4, 6, 12. Ceux de 18 sont : 1, 2, 3, 6, 9, 18. Quel est le plus grand diviseur commun (PGCD) de 12 et 18 ?', `Communs : 1, 2, 3, 6. Le plus grand est <b>6</b>.`)}
${ex('Quel est le plus grand diviseur commun (PGCD) de 36 et 48 ?', `36 = 2<sup>2</sup> × 3<sup>2</sup> et 48 = 2<sup>4</sup> × 3. Facteurs communs : 2<sup>2</sup> (le plus petit exposant de 2) et 3 (le plus petit exposant de 3). PGCD = 4 × 3 = <b>12</b>.`)}
${ex('On donne A = 2<sup>3</sup> × 3 × 5 et B = 2 × 3<sup>2</sup> × 7. Quel est le PGCD de A et B ?', `Facteurs présents dans A et B : 2 (exposants 3 et 1, on garde 2<sup>1</sup>) et 3 (exposants 1 et 2, on garde 3<sup>1</sup>). 5 et 7 ne sont que d'un côté. PGCD = 2 × 3 = <b>6</b>.`)}
${ex('Combien 12 et 18 ont-ils de diviseurs communs ?', `Les diviseurs communs sont 1, 2, 3 et 6 : <b>4</b> diviseurs. Ce sont les diviseurs de leur PGCD 6.`)}
${ex('14 et 25 sont-ils premiers entre eux ?', `14 = 2 × 7 et 25 = 5 × 5 : aucun facteur commun, leur seul diviseur commun est 1. <b>Oui</b>.`)}
${ex('18 et 30 sont-ils premiers entre eux ?', `18 et 30 sont tous les deux divisibles par 2 (et par 3, et par 6) : leur PGCD est 6, pas 1. <b>Non</b>.`)}
${ex('Lequel de ces nombres est un diviseur commun de 24 et de 36 : 8, 9, 12 ou 16 ?', `8 divise 24 mais pas 36 ; 9 divise 36 mais pas 24 ; 16 ne divise ni l'un ni l'autre ; 12 divise 24 (24 = 12 × 2) et 36 (36 = 12 × 3). Réponse : <b>12</b>.`)}
${warn(`⚠️ PGCD ≠ PPCM : le PGCD est plus <b>petit</b> que les deux nombres (ou égal), le PPCM est plus grand.<br>⚠️ Avec la décomposition, ne garde que les facteurs présents <b>dans les deux</b> nombres, avec le <b>plus petit</b> exposant.<br>⚠️ 1 est toujours un diviseur commun : si c'est le seul, les nombres sont premiers entre eux.`)}
${retenir('le PGCD de a et b est le plus grand nombre qui divise à la fois a et b ; les diviseurs communs sont les diviseurs du PGCD.')}`;
}

/* =====================================================================
   9. Fractions irréductibles
   ===================================================================== */
const fracIrr = (N, D) => {
  const g = pgcd(N, D), rn = N / g, rd = D / g;
  const c = v => {
    const [n, d] = v;
    if (d === 0) return { ok: false, msg: 'Le dénominateur ne peut pas être 0.' };
    if (n * D !== N * d) return { ok: false, bad: [0, 1], msg: `Ta fraction n'est pas égale à ${F(N, D)} : on divise le haut et le bas par le <b>même</b> nombre.` };
    if (n === rn && d === rd) return { ok: true };
    return { ok: false, bad: [0, 1], msg: `C'est bien égal, mais ${n} et ${d} sont encore divisibles par ${petitFacteur(pgcd(n, d))} : continue de simplifier.` };
  };
  c.expected = [rn, rd];
  return c;
};
const frac9 = (a, b) => ({ type: 'frac', check: fracIrr(a, b), value: a / b, verify: E => E[0] * b === E[1] * a && gcdBrute(E[0], E[1]) === 1 });
export function L9(d) {
  const formes = d < 1 ? ['simp'] : d < 2 ? ['simp', 'irr'] : d < 3 ? ['simp', 'irr', 'pgcd'] : ['simp', 'irr', 'pgcd', 'decomp'];
  const f = pick(formes);
  const [gLo, gHi, uv] = d < 1 ? [2, 5, 6] : d < 2 ? [2, 9, 8] : d < 3 ? [2, 15, 12] : d < 4 ? [3, 30, 20] : [5, 99, 30];
  const coprime = () => { for (; ;) { const u = ri(1, uv), v = ri(2, uv); if (pgcd(u, v) === 1 && u !== v) return d >= 2 && chance(.2) ? [v, u] : [u, v]; } };
  if (f === 'simp') {
    let u, v; do { [u, v] = coprime(); } while (d < 2 && u >= v);
    const g = ri(gLo, gHi), a = g * u, b = g * v;
    return {
      ...frac9(a, b), html: `Rends irréductible la fraction ${F(gr(a), gr(b))}.`,
      hint: `Décompose ${a} et ${b} en facteurs premiers, puis barre les facteurs communs. Pour commencer : ${a} et ${b} sont tous les deux divisibles par ${petitFacteur(g)}.`,
      solution: `${a} = ${fdec(facteurs(a))} et ${b} = ${fdec(facteurs(b))}. Le PGCD est ${g}.<br>${F(a, b)} = ${F(`${g} × ${u}`, `${g} × ${v}`)} = ${F(u, v)}. Cette fraction est irréductible.`,
      afterVisual: simplif(a, b, u, v, g),
    };
  }
  if (f === 'irr') {
    const oui = chance(.5);
    let a, b;
    if (oui) { do { a = ri(4, uv * 4); b = ri(4, uv * 4); } while (a === b || gcdBrute(a, b) !== 1); } else { const [u, v] = coprime(), g = ri(Math.max(2, gLo), gHi); a = g * u; b = g * v; }
    const p = petitFacteur(gcdBrute(a, b));
    return {
      type: 'choice', opts: OUI_NON, html: `La fraction ${F(a, b)} est-elle irréductible ?`,
      check: choiceCheck(yn(oui), { msg: c => (c === 'oui' ? `${a} et ${b} sont tous les deux divisibles par ${p} : on peut encore simplifier.` : `Cherche un nombre premier qui divise à la fois ${a} et ${b} : il n'y en a pas.`) }),
      verify: E => ((gcdBrute(a, b) === 1) === (E === 'oui')),
      hint: `Une fraction est irréductible quand son numérateur et son dénominateur n'ont aucun diviseur commun autre que 1. Cherche un nombre premier (2, 3, 5, 7…) qui divise à la fois ${a} et ${b}.`,
      solution: oui ? `${a} = ${fdec(facteurs(a))} et ${b} = ${fdec(facteurs(b))} n'ont aucun facteur premier commun : la fraction est irréductible.` : `${a} et ${b} sont divisibles par ${p} : ${F(a, b)} = ${F(a / p, b / p)}. Elle n'est pas irréductible.`,
    };
  }
  if (f === 'pgcd') {
    let u, v; do { [u, v] = coprime(); } while (u === 1 && v === 1);
    const g = ri(Math.max(2, gLo), gHi), a = g * u, b = g * v;
    return {
      type: 'nums', tpl: 'Réponse : {0}', keys: { neg: false }, html: `Par quel nombre faut-il diviser le numérateur et le dénominateur de ${F(a, b)} pour obtenir <b>en une seule étape</b> la fraction irréductible ?`,
      check: numsCheck([g], { msg: v1 => (a % v1[0] === 0 && b % v1[0] === 0 && v1[0] < g ? `Tu peux diviser par ${v1[0]}, mais la fraction obtenue n'est pas encore irréductible : cherche le plus grand diviseur commun.` : v1[0] === 1 ? `Diviser par 1 ne change rien à la fraction.` : '') }),
      value: gcdBrute(a, b),
      hint: `C'est le PGCD de ${a} et ${b} : décompose les deux nombres en facteurs premiers et multiplie les facteurs communs.`,
      solution: `${a} = ${fdec(facteurs(a))} et ${b} = ${fdec(facteurs(b))}. Le PGCD est ${g}.<br>On divise en haut et en bas par ${g} : ${F(a, b)} = ${F(u, v)}.`,
      afterVisual: simplif(a, b, u, v, g),
    };
  }
  // decomp : la fraction est donnée avec les décompositions de ses termes
  const base = [2, 3, 5, 7];
  let ea, eb, A, B;
  do {
    ea = base.map(() => (chance(.65) ? ri(0, 3) : 0)); eb = base.map(() => (chance(.65) ? ri(0, 3) : 0));
    A = prodExp(base, ea); B = prodExp(base, eb);
  } while (A === B || A < 6 || B < 6 || A > 9999 || B > 9999 || pgcd(A, B) === 1);
  const dec = es => base.map((p, i) => (es[i] ? pw(p, es[i]) : null)).filter(Boolean).join(' × ');
  const g = pgcd(A, B);
  return {
    ...frac9(A, B), html: `On donne ${F(gr(A), gr(B))} avec ${gr(A)} = ${dec(ea)} et ${gr(B)} = ${dec(eb)}. Rends cette fraction irréductible.`,
    hint: `Les décompositions sont déjà écrites : barre dans le numérateur et dans le dénominateur chaque facteur premier qui apparaît des deux côtés (avec le plus petit exposant), puis calcule ce qui reste.`,
    solution: `${F(A, B)} = ${F(dec(ea), dec(eb))}. On simplifie par les facteurs communs (leur produit est le PGCD ${g}) : ${F(A / g, B / g)}.`,
  };
}
export function C9() {
  return `<h2>9. Rendre une fraction irréductible</h2>
<p class="intro">Simplifier jusqu'au bout : on divise le haut et le bas par leur <b>PGCD</b>, et on obtient la fraction la plus simple possible.</p>
${cols(def(`Une fraction est <b>irréductible</b> si son numérateur et son dénominateur n'ont pas d'autre diviseur commun que 1.<br>Pour y arriver en une étape : on les divise tous les deux par leur <b>PGCD</b>.`), simplif(84, 126, 2, 3, 42))}
${methode(['Décompose le numérateur et le dénominateur en facteurs premiers.', 'Barre les facteurs communs (ou divise par le PGCD).', 'Multiplie ce qui reste en haut et en bas.', 'Vérifie : il ne reste aucun facteur premier commun.'])}
${ex('Rends irréductible la fraction 84/126.', `84 = 2<sup>2</sup> × 3 × 7 et 126 = 2 × 3<sup>2</sup> × 7. PGCD = 2 × 3 × 7 = 42.<br>84/126 = (42 × 2)/(42 × 3) = <b>2/3</b>.`)}
${ex('Rends irréductible la fraction 126/84.', `126 = 2 × 3<sup>2</sup> × 7 et 84 = 2<sup>2</sup> × 3 × 7. PGCD = 2 × 3 × 7 = 42. 126/84 = <b>3/2</b>. Une fraction plus grande que 1 peut être irréductible.`)}
${ex('La fraction 15/28 est-elle irréductible ?', `15 = 3 × 5 et 28 = 2<sup>2</sup> × 7 n'ont aucun facteur premier commun : <b>oui</b>.`)}
${ex('La fraction 21/35 est-elle irréductible ?', `21 = 3 × 7 et 35 = 5 × 7 sont tous les deux divisibles par 7 : <b>non</b>. (21/35 = 3/5.)`)}
${ex('Par quel nombre faut-il diviser le numérateur et le dénominateur de 90/150 pour obtenir <b>en une seule étape</b> la fraction irréductible ?', `90 = 2 × 3<sup>2</sup> × 5 et 150 = 2 × 3 × 5<sup>2</sup>. PGCD = 2 × 3 × 5 = <b>30</b>. On obtient 3/5.`)}
${ex('On donne 360/540 avec 360 = 2<sup>3</sup> × 3<sup>2</sup> × 5 et 540 = 2<sup>2</sup> × 3<sup>3</sup> × 5. Rends cette fraction irréductible.', `Facteurs communs : 2<sup>2</sup>, 3<sup>2</sup> et 5, soit 4 × 9 × 5 = 180. Il reste 2 en haut et 3 en bas : <b>2/3</b>.`)}
${warn(`⚠️ On divise (ou on barre) <b>en haut et en bas</b>, par le même nombre.<br>⚠️ « Pair » ne suffit pas : après avoir divisé par 2, regarde s'il reste un facteur commun (3, 5, 7…).<br>⚠️ On ne simplifie pas des <i>termes</i> d'une somme : on simplifie des facteurs.<br>⚠️ Une fraction irréductible peut avoir un grand dénominateur : 21/40 est irréductible.`)}
${retenir('on divise numérateur et dénominateur par leur PGCD : la fraction obtenue est irréductible.')}`;
}

/* =====================================================================
   10. Problèmes de partage
   ===================================================================== */
const PAIRES_OBJ = [['roses', 'tulipes'], ['stylos', 'crayons'], ['filles', 'garçons'], ['billes rouges', 'billes bleues'], ['bonbons', 'chocolats']];
const P10 = d => (d < 1 ? paire(2, 6, 6, 40) : d < 2 ? paire(3, 9, 8, 72) : d < 3 ? paire(4, 20, 12, 240) : d < 4 ? paire(6, 40, 20, 600) : paire(8, 80, 25, 999));
export function L10(d) {
  const formes = d < 1 ? ['max', 'contenu'] : d < 2 ? ['max', 'contenu', 'carreaux'] : d < 3 ? ['max', 'contenu', 'carreaux', 'peut'] : d < 4 ? ['max', 'contenu', 'carreaux', 'peut', 'nbcarr'] : ['max', 'contenu', 'carreaux', 'peut', 'nbcarr', 'trois'];
  const f = pick(formes);
  const [o1, o2] = pick(PAIRES_OBJ);
  const [a, b, g] = P10(d), n1 = a / g, n2 = b / g;
  const vis = g <= 8 && n1 + n2 <= 15 ? paquets(g, n1, n2, o1, o2) : undefined;
  if (f === 'max') return {
    type: 'nums', tpl: 'Nombre de paquets : {0}', keys: { neg: false },
    html: `On a ${a} ${o1} et ${b} ${o2}. On veut faire le plus grand nombre possible de paquets identiques, sans rien laisser de côté. Combien de paquets peut-on faire ?`,
    check: numsCheck([g], { msg: v => (v[0] === n1 || v[0] === n2 ? `Tu as donné le contenu d'une sorte dans un paquet, pas le nombre de paquets.` : a % v[0] === 0 && b % v[0] === 0 ? `${v[0]} paquets, c'est possible, mais ce n'est pas le plus grand nombre : cherche encore.` : `Avec ${v[0]} paquets, il resterait des objets : ${v[0]} doit diviser ${a} et ${b}.`) }),
    value: gcdBrute(a, b),
    hint: `Le nombre de paquets doit diviser ${a} et ${b} (sinon il reste des objets) : c'est un diviseur commun. Pour en avoir le plus possible, cherche le plus grand : le PGCD de ${a} et ${b}.`,
    solution: `${a} = ${fdec(facteurs(a))} et ${b} = ${fdec(facteurs(b))}. PGCD(${a} ; ${b}) = ${g}.<br>On peut faire ${g} paquets (${n1} ${o1} et ${n2} ${o2} dans chacun).`, afterVisual: vis,
  };
  if (f === 'contenu') return {
    type: 'nums', tpl: `{0} ${o1} et {1} ${o2}`, keys: { neg: false }, labels: [o1, o2],
    html: `On a ${a} ${o1} et ${b} ${o2}. On fait le plus grand nombre possible de paquets identiques, sans rien laisser de côté. Combien y a-t-il de ${o1} et de ${o2} dans chaque paquet ?`,
    check: numsCheck([n1, n2], { msg: v => (v[0] === g || v[1] === g ? `${g} est le nombre de paquets : on demande ce qu'il y a dans <b>un</b> paquet.` : '') }),
    value: b / gcdBrute(a, b),
    hint: `Cherche d'abord le plus grand nombre de paquets (le PGCD de ${a} et ${b}), puis partage chaque sorte entre ces paquets : fais deux divisions.`,
    solution: `PGCD(${a} ; ${b}) = ${g} paquets. ${a} ÷ ${g} = ${n1} ${o1} et ${b} ÷ ${g} = ${n2} ${o2} dans chaque paquet.`, afterVisual: vis,
  };
  if (f === 'carreaux' || f === 'nbcarr') {
    const nb = f === 'nbcarr';
    return {
      type: 'nums', tpl: nb ? 'Nombre de carreaux : {0}' : 'Côté : {0} cm', keys: { neg: false },
      html: `Un sol rectangulaire mesure ${a} cm sur ${b} cm. On veut le recouvrir avec des carreaux carrés tous identiques, sans découpe ni espace. ${nb ? 'On choisit les plus grands carreaux possibles : combien en faut-il ?' : 'Quelle est la plus grande longueur possible du côté d\'un carreau, en cm ?'}`,
      check: numsCheck([nb ? n1 * n2 : g], { msg: v => (nb ? (v[0] === g ? `${g} cm est le côté d'un carreau : on demande le <b>nombre</b> de carreaux.` : v[0] === n1 + n2 ? `Tu as additionné : il faut <b>multiplier</b> le nombre de carreaux d'une rangée par le nombre de rangées.` : '') : (a % v[0] === 0 && b % v[0] === 0 ? `${v[0]} cm convient, mais ce n'est pas le plus grand côté possible.` : `Un carreau de ${v[0]} cm ne tient pas un nombre entier de fois dans ${a} cm et dans ${b} cm.`)) }),
      value: nb ? (a * b) / (gcdBrute(a, b) ** 2) : gcdBrute(a, b),
      hint: nb ? `Trouve d'abord le plus grand côté possible (le PGCD de ${a} et ${b}). Combien de carreaux tiennent dans la longueur ${a} ? dans la largeur ${b} ? Multiplie ces deux nombres.` : `Le côté du carreau doit tenir un nombre entier de fois dans ${a} et dans ${b} : c'est un diviseur commun. Le plus grand côté est le PGCD de ${a} et ${b}.`,
      solution: `PGCD(${a} ; ${b}) = ${g} : les carreaux ont ${g} cm de côté.${nb ? `<br>Dans la longueur : ${a} ÷ ${g} = ${n1} carreaux ; dans la largeur : ${b} ÷ ${g} = ${n2} carreaux.<br>${n1} × ${n2} = ${gr(n1 * n2)} carreaux.` : ''}`,
      afterVisual: n1 <= 24 && n2 <= 24 ? carreaux(a, b, g) : undefined,
    };
  }
  if (f === 'peut') {
    const oui = chance(.5);
    const divCom = diviseurs(g).filter(x => x > 1);
    let k;
    if (oui && divCom.length) k = pick(divCom);
    else { const seul = diviseurs(a).filter(x => x > 1 && b % x !== 0); k = seul.length && chance(.6) ? pick(seul) : tirer(2, Math.max(a, b), v => a % v !== 0 || b % v !== 0); }
    const est = a % k === 0 && b % k === 0;
    return {
      type: 'choice', opts: OUI_NON, html: `On a ${a} ${o1} et ${b} ${o2}. Peut-on faire ${k} paquets identiques, sans rien laisser de côté ?`,
      check: choiceCheck(yn(est), { msg: c => (c === 'oui' ? `Teste les deux divisions : ${a} ÷ ${k} ${a % k === 0 ? 'tombe juste' : 'ne tombe pas juste'} et ${b} ÷ ${k} ${b % k === 0 ? 'tombe juste' : 'ne tombe pas juste'}.` : `Vérifie les deux divisions : ${a} ÷ ${k} et ${b} ÷ ${k} tombent juste.`) }),
      verify: E => ((a % k === 0 && b % k === 0) === (E === 'oui')),
      hint: `Pour faire ${k} paquets identiques, il faut que ${k} divise ${a} <b>et</b> ${b}. Fais les deux divisions.`,
      solution: est ? `${a} = ${k} × ${a / k} et ${b} = ${k} × ${b / k} : oui, ${k} divise les deux nombres.` : `${a} ÷ ${k} ${a % k === 0 ? 'tombe juste' : `donne un reste ${a % k}`} et ${b} ÷ ${k} ${b % k === 0 ? 'tombe juste' : `donne un reste ${b % k}`} : non.`,
    };
  }
  // trois sortes
  const [o3a, o3b, o3c] = pick([['pommes', 'poires', 'oranges'], ['billes', 'dés', 'jetons']]);
  let A, B, C, G;
  for (; ;) { G = ri(4, 30); A = G * ri(2, 12); B = G * ri(2, 12); C = G * ri(2, 12); if (new Set([A, B, C]).size === 3 && pgcdTrois(A / G, B / G, C / G) === 1 && Math.max(A, B, C) <= 999) break; }
  return {
    type: 'nums', tpl: 'Nombre de paquets : {0}', keys: { neg: false },
    html: `On a ${A} ${o3a}, ${B} ${o3b} et ${C} ${o3c}. On veut faire le plus grand nombre possible de paquets identiques, sans rien laisser de côté. Combien de paquets peut-on faire ?`,
    check: numsCheck([G], { msg: v => (A % v[0] === 0 && B % v[0] === 0 && C % v[0] === 0 ? `${v[0]} paquets, c'est possible, mais ce n'est pas le plus grand nombre.` : `${v[0]} doit diviser ${A}, ${B} <b>et</b> ${C}.`) }),
    value: (() => { for (let k = Math.min(A, B, C); k >= 1; k--) if (A % k === 0 && B % k === 0 && C % k === 0) return k; return 1; })(),
    hint: `Le nombre de paquets doit diviser ${A}, ${B} et ${C}. Cherche le PGCD de deux des nombres, puis le PGCD de ce résultat avec le troisième.`,
    solution: `PGCD(${A} ; ${B}) = ${pgcd(A, B)}, puis PGCD(${pgcd(A, B)} ; ${C}) = ${G}. On peut faire ${G} paquets, chacun avec ${A / G} ${o3a}, ${B / G} ${o3b} et ${C / G} ${o3c}.`,
  };
}
const pgcdTrois = (a, b, c) => pgcd(pgcd(a, b), c);
export function C10() {
  return `<h2>10. Partager en paquets identiques</h2>
<p class="intro">Quand on veut partager <b>sans rien laisser de côté</b>, le nombre de paquets doit diviser chaque quantité : c'est un <b>diviseur commun</b>. Le maximum, c'est le PGCD.</p>
${cols(def(`« Plus grand nombre de paquets identiques » ou « plus grand carreau » : on cherche le <b>PGCD</b>.<br>Ensuite, on divise chaque quantité par le PGCD pour connaître le contenu d'un paquet.`), paquets(4, 3, 5, 'roses', 'tulipes'))}
${methode(['Repère les quantités à partager (a, b…) et ce qu\'on veut : nombre de paquets ? contenu d\'un paquet ?', 'Calcule leur PGCD.', 'Divise chaque quantité par le PGCD si on demande le contenu.'])}
${ex('On a 24 roses et 40 tulipes. On veut faire le plus grand nombre possible de paquets identiques, sans rien laisser de côté. Combien de paquets peut-on faire ?', `PGCD(24 ; 40) : 24 = 2<sup>3</sup> × 3 et 40 = 2<sup>3</sup> × 5, donc PGCD = 8. Réponse : <b>8 paquets</b>.`)}
${ex('On a 24 roses et 40 tulipes. On fait le plus grand nombre possible de paquets identiques, sans rien laisser de côté. Combien y a-t-il de roses et de tulipes dans chaque paquet ?', `8 paquets. 24 ÷ 8 = 3 roses et 40 ÷ 8 = 5 tulipes. Réponse : <b>3 roses et 5 tulipes</b>.`)}
${ex('Un sol rectangulaire mesure 180 cm sur 120 cm. On veut le recouvrir avec des carreaux carrés tous identiques, sans découpe ni espace. Quelle est la plus grande longueur possible du côté d\'un carreau, en cm ?', `Le côté divise 180 et 120 : c'est le PGCD. 180 = 2<sup>2</sup> × 3<sup>2</sup> × 5 et 120 = 2<sup>3</sup> × 3 × 5, donc PGCD = 4 × 3 × 5 = <b>60</b> cm.`)}
${ex('Un sol rectangulaire mesure 180 cm sur 120 cm. On veut le recouvrir avec des carreaux carrés tous identiques, sans découpe ni espace. On choisit les plus grands carreaux possibles : combien en faut-il ?', `Côté 60 cm. Dans la longueur : 180 ÷ 60 = 3 carreaux ; dans la largeur : 120 ÷ 60 = 2 carreaux. 3 × 2 = <b>6 carreaux</b>.`)}
${ex('On a 24 roses et 40 tulipes. Peut-on faire 4 paquets identiques, sans rien laisser de côté ?', `24 = 4 × 6 et 40 = 4 × 10 : 4 divise les deux nombres. Réponse : <b>oui</b>.`)}
${ex('On a 24 roses et 40 tulipes. Peut-on faire 6 paquets identiques, sans rien laisser de côté ?', `24 ÷ 6 = 4 tombe juste, mais 40 ÷ 6 = 6 reste 4 : non. Réponse : <b>non</b>.`)}
${ex('On a 48 pommes, 72 poires et 120 oranges. On veut faire le plus grand nombre possible de paquets identiques, sans rien laisser de côté. Combien de paquets peut-on faire ?', `PGCD(48 ; 72) = 24, puis PGCD(24 ; 120) = 24. Réponse : <b>24 paquets</b> (2 pommes, 3 poires et 5 oranges dans chacun).`)}
${warn(`⚠️ Ne confonds pas le <b>nombre de paquets</b> (le PGCD) et le <b>contenu</b> d'un paquet (quotient).<br>⚠️ Si un nombre de paquets ne divise qu'une des quantités, il reste des objets : il faut qu'il divise <b>toutes</b> les quantités.<br>⚠️ « Le plus grand carreau » = PGCD ; « le plus petit nombre de carreaux » correspond au même PGCD.`)}
${retenir('partage sans reste en paquets identiques : le nombre de paquets divise toutes les quantités ; le maximum est leur PGCD.')}`;
}

/* =====================================================================
   11. Multiples communs et PPCM
   ===================================================================== */
function paire11(d) {
  const [lo, hi, maxL] = d < 2 ? [2, 10, 72] : d < 3 ? [4, 20, 400] : d < 4 ? [6, 36, 800] : [8, 60, 3000];
  for (let t = 0; t < 5000; t++) {
    const a = ri(lo, hi), b = ri(lo, hi), m = lcmBrute(a, b);
    if (a !== b && m <= maxL && (m > Math.max(a, b) || (d >= 3 && chance(.15)))) return [a, b, m];
  }
  throw new Error('paire11');
}
export function L11(d) {
  const formes = d < 1 ? ['liste', 'direct'] : d < 2 ? ['liste', 'direct', 'bus'] : d < 3 ? ['direct', 'bus'] : d < 4 ? ['direct', 'bus', 'heure', 'roues'] : ['direct', 'bus', 'heure', 'roues', 'trois', 'relation'];
  const f = pick(formes);
  const [a, b, m] = paire11(Math.min(d, 4)), lo = Math.min(a, b), hi = Math.max(a, b);
  const visu = m <= 120 ? frise(a, b, m) : undefined;
  const msg = v => (m % v[0] !== 0 || v[0] % a !== 0 || v[0] % b !== 0 ? (v[0] === pgcd(a, b) ? `Tu as calculé le PGCD : on cherche un <b>multiple</b> commun, plus grand que les deux nombres.` : `${gr(v[0])} n'est pas un multiple de ${a} et de ${b}.`) : v[0] === a * b && a * b > m ? `${gr(v[0])} = ${a} × ${b} est bien un multiple commun, mais il y en a un plus petit.` : v[0] > m ? `${gr(v[0])} est un multiple commun, mais pas le plus petit.` : '');
  const sol = `${a} = ${fdec(facteurs(a))} et ${b} = ${fdec(facteurs(b))}.<br>On garde <b>tous</b> les facteurs avec leur plus grand exposant : PPCM = ${fdec(facteurs(m))} = ${gr(m)}.`;
  if (f === 'liste') {
    const ma = Array.from({ length: Math.min(14, m / a + 1) }, (_, i) => a * (i + 1)), mb = Array.from({ length: Math.min(14, m / b + 1) }, (_, i) => b * (i + 1));
    return {
      type: 'nums', tpl: 'PPCM : {0}', html: `Multiples de ${a} : ${ma.join(', ')}…<br>Multiples de ${b} : ${mb.join(', ')}…<br>Quel est le plus petit multiple commun (PPCM) de ${a} et ${b} ?`,
      check: numsCheck([m], { msg }), value: lcmBrute(a, b),
      hint: `Cherche les nombres qui sont dans les deux listes de multiples : le PPCM est le plus petit d'entre eux (le plus à gauche).`,
      solution: `Multiples communs : ${ma.filter(x => mb.includes(x)).join(', ')}… Le plus petit est ${m} : PPCM(${a} ; ${b}) = ${m}.`, afterVisual: visu,
    };
  }
  if (f === 'direct') return {
    type: 'nums', tpl: 'PPCM : {0}', html: `Quel est le plus petit multiple commun (PPCM) de ${a} et ${b} ?`,
    check: numsCheck([m], { msg }), value: lcmBrute(a, b),
    hint: d < 3 ? `Écris les multiples du plus grand nombre (${hi}, ${2 * hi}, ${3 * hi}…) : le premier qui est aussi dans la table de ${lo} est le PPCM.` : `Décompose ${a} et ${b} en facteurs premiers. Pour le PPCM, garde <b>tous</b> les facteurs, chacun avec son plus grand exposant, puis multiplie.`,
    solution: sol, afterVisual: visu,
  };
  if (f === 'bus') return {
    type: 'nums', tpl: 'Dans {0} minutes', keys: { neg: false },
    html: `Deux bus partent ensemble du même arrêt. Le premier repasse toutes les ${a} minutes, le second toutes les ${b} minutes. Dans combien de minutes seront-ils de nouveau ensemble à l'arrêt ?`,
    check: numsCheck([m], { msg }), value: lcmBrute(a, b),
    hint: `Le premier bus est à l'arrêt aux multiples de ${a}, le second aux multiples de ${b}. Ils se retrouvent au premier multiple commun de ${a} et ${b} : cherche le PPCM.`,
    solution: `Il faut le plus petit multiple commun de ${a} et ${b}. ${sol.replace('PPCM', 'PPCM')}<br>Ils se retrouvent dans ${m} minutes.`, afterVisual: visu,
  };
  if (f === 'heure') {
    const h = ri(6, 9), mn0 = d >= 4 ? pick([15, 30, 45]) : 0, total = h * 60 + mn0 + m, H = Math.floor(total / 60), Mn = total % 60;
    const check = v => {
      if (v[0] === H && v[1] === Mn) return { ok: true };
      let ms = '';
      if (v[1] >= 60) ms = `Les minutes doivent être entre 0 et 59 : 60 minutes font 1 heure.`;
      else if (v[0] * 60 + v[1] === m) ms = `Tu as donné la <b>durée</b> (${m} minutes), mais on demande l'<b>heure</b> : ajoute l'heure de départ.`;
      else if (v[0] === H) ms = `L'heure est juste, vérifie les minutes.`;
      return { ok: false, bad: v[0] === H ? [1] : [0, 1], msg: ms };
    };
    check.expected = [H, Mn];
    return {
      type: 'nums', tpl: '{0} h {1} min', labels: ['heures', 'minutes'], keys: { neg: false },
      html: `Deux bus partent ensemble à ${h} h${mn0 ? ' ' + mn0 : ''}. Le premier repasse toutes les ${a} minutes, le second toutes les ${b} minutes. À quelle heure seront-ils de nouveau ensemble à l'arrêt ?`,
      check, verify: E => E[0] * 60 + E[1] === h * 60 + mn0 + lcmBrute(a, b) && E[1] < 60,
      hint: `Cherche d'abord dans combien de minutes ils se retrouvent (le PPCM de ${a} et ${b}), puis ajoute cette durée à l'heure de départ ${h} h${mn0 ? ' ' + mn0 : ''} et convertis en heures et minutes.`,
      solution: `PPCM(${a} ; ${b}) = ${m} : ils se retrouvent ${m} minutes plus tard.<br>${m} min = ${Math.floor(m / 60)} h ${m % 60} min. ${h} h ${mn0} + ${Math.floor(m / 60)} h ${m % 60} min = ${H} h ${Mn} min.`,
    };
  }
  if (f === 'roues') return {
    type: 'nums', tpl: 'Réponse : {0} tours', keys: { neg: false },
    html: `Deux roues dentées s'engrènent : la première a ${a} dents, la seconde en a ${b}. On marque une dent sur chaque roue, au contact. Au bout de combien de tours de la première roue les deux dents marquées se retrouvent-elles en contact ?`,
    check: numsCheck([m / a], { msg: v => (v[0] === m ? `${m} est le nombre de dents qui sont passées, pas le nombre de tours de la première roue : divise par ${a}.` : v[0] === m / b ? `${v[0]} est le nombre de tours de la <b>seconde</b> roue : on demande ceux de la première.` : '') }),
    verify: E => { let t = 1; while ((t * a) % b !== 0) t++; return t === E[0]; },
    hint: `Les deux dents se retrouvent quand le nombre de dents passées est un multiple de ${a} <b>et</b> de ${b} : cherche le PPCM de ${a} et ${b}, puis compte combien de tours de ${a} dents cela représente.`,
    solution: `PPCM(${a} ; ${b}) = ${m} dents passées. La première roue a ${a} dents : ${m} ÷ ${a} = ${m / a} tours.`,
  };
  if (f === 'trois') {
    let A, B, C, M3;
    do { A = ri(2, 20); B = ri(2, 20); C = ri(2, 20); M3 = lcmBrute(lcmBrute(A, B), C); } while (new Set([A, B, C]).size < 3 || M3 > 5000 || M3 === Math.max(A, B, C));
    return {
      type: 'nums', tpl: 'PPCM : {0}', html: `Quel est le plus petit multiple commun (PPCM) de ${A}, ${B} et ${C} ?`,
      check: numsCheck([M3], { msg: v => (v[0] % A === 0 && v[0] % B === 0 && v[0] % C === 0 ? `${gr(v[0])} est un multiple commun des trois, mais pas le plus petit.` : `${gr(v[0])} n'est pas un multiple de ${[A, B, C].filter(x => v[0] % x !== 0)[0]}.`) }), value: lcmBrute(lcmBrute(A, B), C),
      hint: `Décompose ${A}, ${B} et ${C} en facteurs premiers. Garde chaque facteur premier avec son plus grand exposant, puis multiplie.`,
      solution: `${A} = ${fdec(facteurs(A))} ; ${B} = ${fdec(facteurs(B))} ; ${C} = ${fdec(facteurs(C))}.<br>PPCM = ${fdec(facteurs(M3))} = ${gr(M3)}.`,
    };
  }
  // relation
  const [u, v] = (() => { for (; ;) { const x = ri(2, 30), y = ri(2, 30); if (x !== y && pgcd(x, y) === 1) return [x, y]; } })(), g = ri(3, 30), A = g * u, B = g * v;
  return {
    type: 'nums', tpl: 'PPCM : {0}', keys: { neg: false },
    html: `Pour deux entiers a et b, on sait que PGCD(a ; b) × PPCM(a ; b) = a × b. Ici a = ${A}, b = ${B} et PGCD(a ; b) = ${g}. Quel est leur PPCM ?`,
    check: numsCheck([g * u * v], { msg: v1 => (v1[0] === A * B ? `${gr(A * B)} est le produit a × b : il faut le <b>diviser</b> par le PGCD ${g}.` : '') }), value: (A * B) / g,
    hint: `Divise le produit ${A} × ${B} par le PGCD ${g}. Pour éviter de grands nombres, commence par diviser ${A} par ${g}, puis multiplie par ${B}.`,
    solution: `PPCM = (${A} × ${B}) ÷ ${g} = ${A} ÷ ${g} × ${B} = ${u} × ${B} = ${gr(g * u * v)}.`,
  };
}
export function C11() {
  return `<h2>11. Multiples communs et PPCM</h2>
<p class="intro">Deux événements qui reviennent régulièrement se retrouvent… au <b>plus petit multiple commun</b> de leurs durées.</p>
${cols(def(`Un <b>multiple commun</b> de a et b est un multiple de a <b>et</b> de b. Le plus petit multiple commun non nul s'appelle le <b>PPCM</b>.<br>Relation utile : <b>PGCD(a ; b) × PPCM(a ; b) = a × b</b>.`), frise(6, 8, 24))}
${methode(['<b>Par les listes</b> : écris les multiples du plus grand nombre jusqu\'à en trouver un qui est aussi multiple de l\'autre.', '<b>Par la décomposition</b> : garde <b>tous</b> les facteurs premiers, chacun avec son <b>plus grand</b> exposant, et multiplie.'])}
${ex('Multiples de 6 : 6, 12, 18, 24, 30, 36… Multiples de 8 : 8, 16, 24, 32, 40… Quel est le plus petit multiple commun (PPCM) de 6 et 8 ?', `Le premier nombre qui est dans les deux listes est <b>24</b>.`)}
${ex('Quel est le plus petit multiple commun (PPCM) de 12 et 18 ?', `12 = 2<sup>2</sup> × 3 et 18 = 2 × 3<sup>2</sup>. On garde 2<sup>2</sup> et 3<sup>2</sup> : PPCM = 4 × 9 = <b>36</b>.`)}
${ex('Deux bus partent ensemble du même arrêt. Le premier repasse toutes les 12 minutes, le second toutes les 18 minutes. Dans combien de minutes seront-ils de nouveau ensemble à l\'arrêt ?', `Il faut le PPCM de 12 et 18, soit 36. Réponse : dans <b>36</b> minutes.`)}
${ex('Deux bus partent ensemble à 8 h. Le premier repasse toutes les 20 minutes, le second toutes les 30 minutes. À quelle heure seront-ils de nouveau ensemble à l\'arrêt ?', `PPCM(20 ; 30) = 60 : ils se retrouvent 60 minutes, soit 1 h, plus tard. 8 h + 1 h = <b>9 h 0 min</b>.<br>Autre cas : départ à 7 h 30 avec PPCM = 90 min = 1 h 30 : 7 h 30 + 1 h 30 = <b>9 h 0 min</b>.`)}
${ex('Deux roues dentées s\'engrènent : la première a 12 dents, la seconde en a 8. On marque une dent sur chaque roue, au contact. Au bout de combien de tours de la première roue les deux dents marquées se retrouvent-elles en contact ?', `PPCM(12 ; 8) = 24 dents passées. La première roue a 12 dents : 24 ÷ 12 = <b>2 tours</b>.`)}
${ex('Quel est le plus petit multiple commun (PPCM) de 4, 6 et 10 ?', `4 = 2<sup>2</sup>, 6 = 2 × 3, 10 = 2 × 5. On garde 2<sup>2</sup>, 3 et 5 : PPCM = 4 × 3 × 5 = <b>60</b>.`)}
${ex('Pour deux entiers a et b, PGCD(a ; b) × PPCM(a ; b) = a × b. Ici a = 36, b = 48 et PGCD(a ; b) = 12. Quel est leur PPCM ?', `PPCM = (36 × 48) ÷ 12 = 36 × 4 = <b>144</b>.`)}
${warn(`⚠️ Le PPCM est plus <b>grand</b> que les deux nombres (ou égal au plus grand), le PGCD est plus <b>petit</b>.<br>⚠️ Le produit a × b est un multiple commun, mais pas toujours le plus petit : 6 × 8 = 48 alors que le PPCM est 24.<br>⚠️ Avec la décomposition, on garde <b>tous</b> les facteurs (même ceux d'un seul nombre), avec le plus grand exposant.<br>⚠️ Pour une heure, ajoute la durée à l'heure de départ et convertis les minutes en heures.`)}
${retenir('le PPCM de a et b est le plus petit multiple commun non nul ; c\'est la première fois où deux cycles de durées a et b se retrouvent.')}`;
}

/* =====================================================================
   12. Défis : pair, impair, petites preuves
   ===================================================================== */
const ECRI = {
  pair: { ok: [['2n', n => 2 * n], ['2n + 2', n => 2 * n + 2], ['4n', n => 4 * n], ['2(n + 1)', n => 2 * (n + 1)], ['6n', n => 6 * n]], ko: [['2n + 1', n => 2 * n + 1], ['n + 2', n => n + 2], ['3n', n => 3 * n], ['n²', n => n * n], ['2n − 1', n => 2 * n - 1], ['n + n + 1', n => 2 * n + 1]] },
  impair: { ok: [['2n + 1', n => 2 * n + 1], ['2n − 1', n => 2 * n - 1], ['2n + 3', n => 2 * n + 3], ['4n + 1', n => 4 * n + 1], ['2(n + 4) + 1', n => 2 * (n + 4) + 1]], ko: [['2n', n => 2 * n], ['2n + 2', n => 2 * n + 2], ['n + 1', n => n + 1], ['3n', n => 3 * n], ['n²', n => n * n], ['4n', n => 4 * n]] },
};
const PARITE = [['n + 1', n => n + 1], ['3n', n => 3 * n], ['n + n', n => 2 * n], ['n²', n => n * n], ['2n + 3', n => 2 * n + 3], ['n × (n + 1)', n => n * (n + 1)], ['n + 7', n => n + 7], ['5n + 2', n => 5 * n + 2], ['3n + 1', n => 3 * n + 1], ['(n + 1)²', n => (n + 1) * (n + 1)], ['n² + n', n => n * n + n], ['n² + 1', n => n * n + 1]];
const typeDe = vals => (vals.every(x => x % 2 === 0) ? 'pair' : vals.every(x => x % 2 !== 0) ? 'impair' : 'dep');
export function L12(d) {
  const formes = d < 1 ? ['ecriture', 'valeur'] : d < 2 ? ['ecriture', 'valeur', 'consec3', 'consec2'] : d < 3 ? ['ecriture', 'valeur', 'consec3', 'consec2', 'parite', 'consecimp', 'preuve'] : ['ecriture', 'valeur', 'consec3', 'consec2', 'parite', 'consecimp', 'preuve', 'consec4', 'contre'];
  const f = pick(formes);
  if (f === 'ecriture') {
    const kind = pick(['pair', 'impair']), pool = ECRI[kind], ok = pick(pool.ok), ko = shuffle(pool.ko.slice()).slice(0, 3);
    const items = shuffle([ok, ...ko]), opts = items.map(([t]) => ({ v: t, l: t }));
    return {
      type: 'choice', opts, html: `Quelle écriture désigne <b>toujours</b> un nombre ${kind}, quel que soit l'entier n ?`,
      check: choiceCheck(ok[0], { msg: c => { const it = items.find(x => x[0] === c); return `Avec ${c} : pour n = 1 on obtient ${it[1](1)}, pour n = 2 on obtient ${it[1](2)}. ${[1, 2, 3].map(n => it[1](n) % 2).every(x => x === (kind === 'pair' ? 0 : 1)) ? '' : `Ce n'est pas toujours ${kind}.`}`; } }),
      verify: Eq => { const g = items.find(x => x[0] === Eq)[1]; const want = kind === 'pair' ? 0 : 1; const all = it => Array.from({ length: 31 }, (_, n) => it[1](n)).every(v => ((v % 2) + 2) % 2 === want); return all(items.find(x => x[0] === Eq)) && items.filter(all).length === 1 && g(3) !== undefined; },
      hint: kind === 'pair' ? `Un nombre pair est un multiple de 2 : il s'écrit 2 × (un entier). Regarde, parmi les quatre écritures, celle qui a cette forme pour tout n.` : `Un nombre impair est un nombre pair plus 1 (ou moins 1). Regarde, parmi les quatre écritures, celle qui a cette forme pour tout n.`,
      solution: `${ok[0]} ${kind === 'pair' ? 'est toujours le double d\'un entier' : 'est un nombre pair plus ou moins un nombre impair, donc toujours impair'} : c'est la bonne écriture. Pour les autres, un essai avec n = 1 ou n = 2 donne un résultat du mauvais type.`,
      afterVisual: pairesImpaires(kind === 'pair' ? [4, 6, 8] : [3, 5, 7]),
    };
  }
  if (f === 'valeur') {
    const pair = d >= 1 && chance(.5), n = ri(2, d < 1 ? 20 : d < 2 ? 100 : 5000), N = pair ? 2 * n : 2 * n + 1;
    return {
      type: 'nums', tpl: 'n = {0}', keys: { neg: false },
      html: `Le nombre ${pair ? 'pair' : 'impair'} ${gr(N)} s'écrit ${pair ? '2n' : '2n + 1'}. Quelle est la valeur de n ?`,
      check: numsCheck([n], { msg: v => (v[0] === N ? `Tu as recopié le nombre : il faut trouver n tel que ${pair ? '2n' : '2n + 1'} = ${gr(N)}.` : !pair && v[0] === N / 2 ? `N'oublie pas de retirer 1 avant de diviser par 2.` : '') }),
      value: pair ? N / 2 : (N - 1) / 2,
      hint: pair ? `Résous 2n = ${gr(N)} : divise ${gr(N)} par 2.` : `Résous 2n + 1 = ${gr(N)} : retire d'abord 1 de chaque côté, puis divise par 2.`,
      solution: pair ? `2n = ${gr(N)} donc n = ${gr(N)} ÷ 2 = ${gr(n)}.` : `2n + 1 = ${gr(N)} donc 2n = ${gr(N)} − 1 = ${gr(N - 1)}, puis n = ${gr(n)}.`,
      afterVisual: undefined,
    };
  }
  if (f === 'consec3') {
    const n = ri(1, d < 2 ? 30 : 500), S = 3 * n + 3;
    return {
      type: 'nums', tpl: 'Réponse : {0}', keys: { neg: false }, html: `La somme de trois entiers consécutifs est ${gr(S)}. Quel est le plus petit de ces trois entiers ?`,
      check: numsCheck([n], { msg: v => (v[0] === S / 3 ? `${v[0]} est celui du milieu : le plus petit est 1 de moins.` : v[0] === n + 2 ? `${v[0]} est le plus grand des trois : on demande le plus petit.` : '') }), value: S / 3 - 1,
      hint: `Appelle n le plus petit : la somme est n + (n + 1) + (n + 2) = 3n + 3. Résous 3n + 3 = ${gr(S)}.`,
      solution: `n + (n + 1) + (n + 2) = 3n + 3 = ${gr(S)}, donc 3n = ${gr(S - 3)} et n = ${gr(n)}. Les trois entiers sont ${gr(n)}, ${gr(n + 1)} et ${gr(n + 2)}.`,
    };
  }
  if (f === 'consec2') {
    const n = ri(1, d < 2 ? 40 : 2000), S = 2 * n + 1;
    const check = v => {
      if (v[0] === n && v[1] === n + 1) return { ok: true };
      const ms = v[0] + v[1] === S && v[1] !== v[0] + 1 ? `Leur somme est bonne, mais ils ne sont pas consécutifs : le deuxième est le premier plus 1.` : v[1] === v[0] + 1 ? `Ils sont bien consécutifs, mais leur somme n'est pas ${gr(S)}.` : '';
      return { ok: false, bad: [0, 1], msg: ms };
    };
    check.expected = [n, n + 1];
    return {
      type: 'nums', tpl: '{0} et {1}', keys: { neg: false }, labels: ['le plus petit', 'le suivant'],
      html: `La somme de deux entiers consécutifs est ${gr(S)}. Quels sont ces deux entiers ? (le plus petit d'abord)`,
      check, verify: E => E[0] + E[1] === S && E[1] === E[0] + 1,
      hint: `Appelle n le plus petit : la somme est n + (n + 1) = 2n + 1. Résous 2n + 1 = ${gr(S)}.`,
      solution: `n + (n + 1) = 2n + 1 = ${gr(S)}, donc 2n = ${gr(S - 1)} et n = ${gr(n)}. Les deux entiers sont ${gr(n)} et ${gr(n + 1)}.`,
    };
  }
  if (f === 'consecimp') {
    const n = ri(1, d < 3 ? 30 : 400), S = 4 * n + 4;
    return {
      type: 'nums', tpl: 'Réponse : {0}', keys: { neg: false }, html: `La somme de deux nombres impairs consécutifs est ${gr(S)}. Quel est le plus petit des deux ?`,
      check: numsCheck([2 * n + 1], { msg: v => (v[0] === n ? `${v[0]} est la valeur de n, pas le nombre impair 2n + 1.` : v[0] % 2 === 0 ? `Le nombre cherché doit être impair.` : '') }), value: S / 2 - 1,
      hint: `Si le plus petit est 2n + 1, le suivant est 2n + 3. Leur somme est 4n + 4 : résous 4n + 4 = ${gr(S)}, puis calcule 2n + 1.`,
      solution: `(2n + 1) + (2n + 3) = 4n + 4 = ${gr(S)}, donc 4n = ${gr(S - 4)} et n = ${gr(n)}. Le plus petit est 2n + 1 = ${gr(2 * n + 1)} (et le suivant est ${gr(2 * n + 3)}).`,
    };
  }
  if (f === 'parite') {
    const [t, fn] = pick(PARITE), mode = pick(['pair', 'impair', 'tout']);
    const pool = Array.from({ length: 21 }, (_, n) => n).filter(n => mode === 'tout' || (mode === 'pair' ? n % 2 === 0 : n % 2 === 1));
    const E = typeDe(pool.map(fn)), ex1 = mode === 'impair' ? 3 : 4;
    return {
      type: 'choice', opts: [{ v: 'pair', l: 'Toujours pair' }, { v: 'impair', l: 'Toujours impair' }, { v: 'dep', l: 'Cela dépend de n' }],
      html: `Soit n un entier ${mode === 'tout' ? 'quelconque' : mode}. Le nombre ${t} est-il pair, impair, ou cela dépend-il de n ?`,
      check: choiceCheck(E, { msg: () => `Teste avec deux valeurs de n ${mode === 'tout' ? '(un pair, un impair)' : `${mode}s`}, par exemple ${mode === 'impair' ? '1 et 3' : mode === 'pair' ? '2 et 4' : '2 et 3'} : le résultat change-t-il de type ?` }),
      verify: Eq => Eq === typeDe(Array.from({ length: 41 }, (_, i) => i - 20).filter(n => mode === 'tout' || (((n % 2) + 2) % 2 === (mode === 'pair' ? 0 : 1))).map(fn)),
      hint: `Remplace n par un exemple${mode === 'tout' ? ' pair (n = 4), puis impair (n = 3)' : ` ${mode} (n = ${ex1}, puis un autre)`} dans ${t} : calcule et regarde le type du résultat.`,
      solution: `Avec n = ${mode === 'impair' ? '3' : '4'} : ${t.replace(/n/g, mode === 'impair' ? '3' : '4')} → ${fn(mode === 'impair' ? 3 : 4)}${mode === 'tout' ? `. Avec n = 3 : ${fn(3)}.` : ''}. ${E === 'dep' ? 'Le type du résultat change selon n.' : `Cela reste ${E} pour tous les n ${mode === 'tout' ? '' : mode + 's'}.`}`,
    };
  }
  if (f === 'preuve') {
    const v = pick(['impairs', 'consec3', 'consec5', 'consec7', ...(d >= 4 ? ['carre'] : [])]);
    if (v === 'impairs') {
      const a = pick([1, 3, 5, 7]), b = pick([1, 3, 5, 7]);
      return {
        type: 'nums', keys: { neg: false }, tpl: `(2n + ${a}) + (2m + ${b}) = 2n + 2m + {0} = 2 × (n + m + {1})`, labels: ['somme des nombres seuls', 'moitié'],
        html: `Complète la démonstration : la somme de deux nombres impairs est un nombre pair.`,
        check: numsCheck([a + b, (a + b) / 2], { msg: v1 => (v1[0] === a + b ? `Le premier nombre est bon. Pour factoriser par 2, divise-le par 2.` : v1[1] === (a + b) / 2 ? `Le second nombre est bon : regroupe d'abord les nombres seuls, ${a} + ${b}.` : '') }),
        verify: E => [0, 1, 5, 9].every(n => [0, 2, 7].every(m => (2 * n + a) + (2 * m + b) === 2 * n + 2 * m + E[0] && 2 * n + 2 * m + E[0] === 2 * (n + m + E[1]))),
        hint: `Regroupe les n, les m et les nombres seuls : ${a} + ${b} = ? Puis mets 2 en facteur : tous les termes sont des multiples de 2, donc le résultat est pair.`,
        solution: `(2n + ${a}) + (2m + ${b}) = 2n + 2m + ${a + b} = 2 × (n + m + ${(a + b) / 2}). C'est 2 fois un entier : la somme est paire.`,
      };
    }
    if (v === 'carre') {
      const a = pick([1, 3, 5]);
      return {
        type: 'nums', keys: { neg: false }, tpl: `(2n + ${a})² = 4n² + {0}n + ${a * a} = 4n × (n + {1}) + ${a * a}`, labels: ['coefficient de n', 'nombre dans la parenthèse'],
        html: `Complète la démonstration : le carré d'un nombre impair est de la forme 4k + ${a * a} (pour un entier k).`,
        check: numsCheck([4 * a, a], { msg: v1 => (v1[0] === 2 * a ? `Pense à la double distributivité : (2n + ${a})² = 4n² + 2 × 2n × ${a} + ${a * a}, donc le coefficient de n est 4 × ${a}.` : v1[0] === 4 * a ? `Le premier nombre est bon. Pour la factorisation, 4a n = 4n × a : combien dans la parenthèse ?` : '') }),
        verify: E => [0, 1, 4, 7].every(n => (2 * n + a) ** 2 === 4 * n * n + E[0] * n + a * a && 4 * n * n + E[0] * n === 4 * n * (n + E[1])),
        hint: `Développe (2n + ${a})² avec l'identité (x + y)² = x² + 2xy + y² : le terme du milieu est 2 × 2n × ${a}. Puis mets 4n en facteur.`,
        solution: `(2n + ${a})² = 4n² + ${4 * a}n + ${a * a} = 4n × (n + ${a}) + ${a * a}. C'est bien un multiple de 4, plus ${a * a}.`,
      };
    }
    const k = v === 'consec3' ? 3 : v === 'consec5' ? 5 : 7, h = (k - 1) / 2, E = [k * h, h];
    const terms = k <= 5 ? Array.from({ length: k }, (_, i) => (i ? `(n + ${i})` : 'n')).join(' + ') : `n + (n + 1) + … + (n + ${k - 1})`;
    return {
      type: 'nums', keys: { neg: false }, tpl: `${terms} = ${k}n + {0} = ${k} × (n + {1})`, labels: ['somme des nombres seuls', 'nombre dans la parenthèse'],
      html: `Complète la démonstration : la somme de ${k} entiers consécutifs est un multiple de ${k}.`,
      check: numsCheck(E, { msg: v1 => (v1[0] === E[0] ? `Le premier nombre est bon. Pour factoriser par ${k}, divise-le par ${k}.` : v1[1] === h ? `Le second nombre est bon : additionne les nombres seuls 0 + 1 + … + ${k - 1}.` : '') }),
      verify: Ev => [0, 2, 5, 11].every(n => { let s = 0; for (let i = 0; i < k; i++) s += n + i; return s === k * n + Ev[0] && k * n + Ev[0] === k * (n + Ev[1]); }),
      hint: `Les n s'additionnent : il y en a ${k}. Les nombres seuls sont 0, 1, 2… jusqu'à ${k - 1} : additionne-les. Puis mets ${k} en facteur.`,
      solution: `Les n donnent ${k}n. Les nombres seuls : ${Array.from({ length: k }, (_, i) => i).join(' + ')} = ${E[0]}. Donc la somme est ${k}n + ${E[0]} = ${k} × (n + ${h}), un multiple de ${k}.`,
    };
  }
  if (f === 'consec4') {
    const n = ri(1, 300), S = 4 * n + 6;
    return {
      type: 'nums', tpl: 'Réponse : {0}', keys: { neg: false }, html: `La somme de quatre entiers consécutifs est ${gr(S)}. Quel est le plus petit de ces quatre entiers ?`,
      check: numsCheck([n], { msg: v => (v[0] === S / 4 ? `${S / 4} est la moyenne des quatre (qui n'est pas un entier ici) : appelle n le plus petit et écris la somme.` : '') }), value: (S - 6) / 4,
      hint: `Appelle n le plus petit : la somme est n + (n + 1) + (n + 2) + (n + 3) = 4n + 6. Résous 4n + 6 = ${gr(S)}.`,
      solution: `n + (n + 1) + (n + 2) + (n + 3) = 4n + 6 = ${gr(S)}, donc 4n = ${gr(S - 6)} et n = ${gr(n)}. Les quatre entiers sont ${gr(n)}, ${gr(n + 1)}, ${gr(n + 2)}, ${gr(n + 3)}.`,
    };
  }
  // contre-exemple
  const t = pick(['prem', 'carre', 'somme', 'impair']);
  let enonce, items, counter;
  if (t === 'prem') { enonce = 'Tout nombre premier est impair.'; items = shuffle([2, pick([3, 5, 7, 11, 13]), pick([4, 6, 8, 10, 12]), pick([9, 15, 21, 25])]).map(x => ({ v: String(x), l: String(x), x })); counter = it => estPremier(it.x) && it.x % 2 === 0; }
  else if (t === 'carre') { enonce = 'Pour tout entier n supérieur ou égal à 1, n² est strictement plus grand que n.'; items = shuffle([1, ri(2, 5), ri(6, 12), ri(13, 30)]).map(x => ({ v: String(x), l: `n = ${x}`, x })); counter = it => it.x * it.x <= it.x; }
  else if (t === 'somme') {
    enonce = 'La somme de deux nombres premiers est un nombre impair.';
    const ip = [3, 5, 7, 11, 13, 17], c = shuffle(ip.slice()).slice(0, 2), all = [[2, pick(ip)], [2, pick(ip)], [2, pick(ip)]];
    items = shuffle([[c[0], c[1]], ...all.map((p, i) => [2, ip[i + ri(0, 2)]])]).map(p => ({ v: p.join('+'), l: `${p[0]} + ${p[1]}`, x: p })); counter = it => estPremier(it.x[0]) && estPremier(it.x[1]) && (it.x[0] + it.x[1]) % 2 === 0;
  } else { enonce = 'Tout nombre impair est un nombre premier.'; items = shuffle([pick([9, 15, 21, 25, 27, 33, 35]), 3, pick([5, 7]), pick([11, 13, 17])]).map(x => ({ v: String(x), l: String(x), x })); counter = it => it.x % 2 === 1 && !estPremier(it.x); }
  const E = items.find(counter);
  return {
    type: 'choice', opts: items.map(i => ({ v: i.v, l: i.l })), html: `Un élève affirme : « ${enonce} » Lequel de ces exemples est un <b>contre-exemple</b>, c'est-à-dire montre que c'est faux ?`,
    check: choiceCheck(E.v, { msg: c => `Teste ${items.find(i => i.v === c).l} : il vérifie l'affirmation, il ne la contredit pas.` }),
    verify: Eq => items.filter(counter).length === 1 && counter(items.find(i => i.v === Eq)),
    hint: `Un contre-exemple est un cas qui rend l'affirmation fausse. Teste chaque proposition avec « ${enonce} » : cherche celle qui ne marche pas.`,
    solution: `${E.l} est un contre-exemple : ${t === 'prem' ? '2 est premier et pair' : t === 'carre' ? '1² = 1 n\'est pas strictement plus grand que 1' : t === 'somme' ? `${E.x[0]} + ${E.x[1]} = ${E.x[0] + E.x[1]} est pair` : `${E.x} est impair mais ${E.x} = ${petitFacteur(E.x)} × ${E.x / petitFacteur(E.x)}`}. Un seul contre-exemple suffit pour prouver qu'une affirmation est fausse.`,
  };
}
export function C12() {
  return `<h2>12. Défis : pair, impair et petites preuves</h2>
<p class="intro">Avec une lettre, on peut parler de <b>tous</b> les nombres pairs ou impairs d'un coup, et démontrer des propriétés qu'aucun exemple ne suffit à prouver.</p>
${cols(def(`Si n est un entier :<br>• <b>2n</b> est un nombre <b>pair</b> (n paires de points) ;<br>• <b>2n + 1</b> est un nombre <b>impair</b> (n paires et un point seul).<br>Trois entiers consécutifs : n, n + 1, n + 2.`), pairesImpaires([4, 5, 6, 7]))}
${methode(['Traduis l\'énoncé avec une lettre : le plus petit entier est n, le suivant n + 1…', 'Écris la somme ou le produit, réduis-le.', 'Résous l\'équation, ou mets le facteur voulu en évidence pour prouver.', 'Pour montrer qu\'une affirmation est <b>fausse</b>, un seul contre-exemple suffit.'])}
${ex('Quelle écriture désigne <b>toujours</b> un nombre impair, quel que soit l\'entier n ? (2n, 2n + 1, n + 1 ou n²)', `2n est pair, donc 2n + 1 (un pair plus 1) est toujours impair. Réponse : <b>2n + 1</b>.`)}
${ex('Quelle écriture désigne <b>toujours</b> un nombre pair, quel que soit l\'entier n ? (4n, 2n + 1, n + 2 ou 3n)', `4n = 2 × 2n est le double d'un entier : toujours pair. Les autres changent de type (n = 1 puis n = 2). Réponse : <b>4n</b>.`)}
${ex('Le nombre impair 41 s\'écrit 2n + 1. Quelle est la valeur de n ?', `2n + 1 = 41 donc 2n = 40 et n = <b>20</b>.`)}
${ex('Le nombre pair 52 s\'écrit 2n. Quelle est la valeur de n ?', `2n = 52 donc n = 52 ÷ 2 = <b>26</b>.`)}
${ex('La somme de trois entiers consécutifs est 45. Quel est le plus petit de ces trois entiers ?', `n + (n + 1) + (n + 2) = 3n + 3 = 45, donc 3n = 42 et n = <b>14</b> (14, 15, 16).`)}
${ex('La somme de deux entiers consécutifs est 37. Quels sont ces deux entiers ? (le plus petit d\'abord)', `n + (n + 1) = 2n + 1 = 37, donc n = 18. Les entiers sont <b>18 et 19</b>.`)}
${ex('La somme de deux nombres impairs consécutifs est 24. Quel est le plus petit des deux ?', `(2n + 1) + (2n + 3) = 4n + 4 = 24, donc n = 5. Le plus petit est 2n + 1 = <b>11</b> (11 et 13).`)}
${ex('La somme de quatre entiers consécutifs est 58. Quel est le plus petit de ces quatre entiers ?', `n + (n + 1) + (n + 2) + (n + 3) = 4n + 6 = 58, donc 4n = 52 et n = <b>13</b> (13, 14, 15, 16).`)}
${ex('Soit n un entier impair. Le nombre 3n est-il pair, impair, ou cela dépend-il de n ?', `Avec n = 3 : 9 ; avec n = 5 : 15. Un impair multiplié par 3 reste impair. Réponse : <b>toujours impair</b>.`)}
${ex('Soit n un entier pair. Le nombre n + 1 est-il pair, impair, ou cela dépend-il de n ?', `Avec n = 4 : 5 ; avec n = 6 : 7. Un pair plus 1 est impair. Réponse : <b>toujours impair</b>.`)}
${ex('Soit n un entier impair. Le nombre n² + 1 est-il pair, impair, ou cela dépend-il de n ?', `Avec n = 3 : 10 ; avec n = 5 : 26. Un impair au carré est impair, plus 1 il devient pair. Réponse : <b>toujours pair</b>.`)}
${ex('Soit n un entier quelconque. Le nombre n × (n + 1) est-il pair, impair, ou cela dépend-il de n ?', `L'un des deux entiers consécutifs est pair : le produit est pair (n = 3 : 12 ; n = 4 : 20). Réponse : <b>toujours pair</b>.`)}
${ex('Complète la démonstration : la somme de deux nombres impairs est un nombre pair.', `(2n + 1) + (2m + 3) = 2n + 2m + <b>4</b> = 2 × (n + m + <b>2</b>) : c'est le double d'un entier, donc un nombre pair.`)}
${ex('Complète la démonstration : la somme de 3 entiers consécutifs est un multiple de 3.', `n + (n + 1) + (n + 2) = 3n + <b>3</b> = 3 × (n + <b>1</b>). (Pour 5 entiers : 5n + 10 = 5 × (n + 2).)`)}
${ex('Complète la démonstration : la somme de 5 entiers consécutifs est un multiple de 5.', `n + (n + 1) + (n + 2) + (n + 3) + (n + 4) = 5n + <b>10</b> = 5 × (n + <b>2</b>).`)}
${ex('Complète la démonstration : la somme de 7 entiers consécutifs est un multiple de 7.', `n + (n + 1) + … + (n + 6) = 7n + <b>21</b> = 7 × (n + <b>3</b>) (car 0 + 1 + … + 6 = 21).`)}
${ex('Complète la démonstration : le carré d\'un nombre impair est de la forme 4k + 1 (pour un entier k).', `(2n + 1)² = 4n² + <b>4</b>n + 1 = 4n × (n + <b>1</b>) + 1 : un multiple de 4, plus 1.`)}
${ex('Un élève affirme : « Tout nombre premier est impair. » Lequel de ces exemples est un contre-exemple ? (2, 3, 9 ou 11)', `3 et 11 sont premiers et impairs ; 9 n'est pas premier ; 2 est premier <b>et pair</b>. Réponse : <b>2</b>.`)}
${ex('Un élève affirme : « La somme de deux nombres premiers est un nombre impair. » Lequel de ces exemples est un contre-exemple ? (2 + 5, 2 + 11, 3 + 7 ou 2 + 3)', `2 + 5 = 7, 2 + 11 = 13 et 2 + 3 = 5 sont impairs. 3 + 7 = 10 est pair. Réponse : <b>3 + 7</b>.`)}
${ex('Un élève affirme : « Tout nombre impair est un nombre premier. » Lequel de ces exemples est un contre-exemple ? (3, 5, 9 ou 13)', `3, 5 et 13 sont premiers. 9 = 3 × 3 est impair mais pas premier. Réponse : <b>9</b>.`)}
${ex('Un élève affirme : « Pour tout entier n supérieur ou égal à 1, n² est strictement plus grand que n. » Lequel de ces exemples est un contre-exemple ? (n = 1, n = 3, n = 7 ou n = 12)', `3² = 9 &gt; 3, 7² = 49 &gt; 7, 12² = 144 &gt; 12. Mais 1² = 1 n'est pas plus grand que 1. Réponse : <b>n = 1</b>.`)}
${warn(`⚠️ Plusieurs exemples qui marchent ne <b>prouvent</b> rien ; un seul contre-exemple <b>réfute</b>.<br>⚠️ 2n + 1 est impair, mais n + 1 ne l'est pas toujours.<br>⚠️ Deux entiers consécutifs s'écrivent n et n + 1 (pas n et n + 2).<br>⚠️ Dans une démonstration, il faut que la lettre représente un entier <b>quelconque</b>.`)}
${retenir('2n est pair, 2n + 1 est impair ; pour prouver une propriété, on la montre avec une lettre ; pour la réfuter, un contre-exemple suffit.')}`;
}

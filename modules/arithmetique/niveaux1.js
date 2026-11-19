// Arithmétique, niveaux 1 à 6 : multiples, diviseurs, critères de divisibilité, division euclidienne, nombres premiers.
import { ri, pick, shuffle, chance } from '../../engine/util/rand.js';
import { numsCheck, choiceCheck } from '../../engine/answers/checks.js';
import { tableMult, entre, rectangles, finaux, chiffresSomme, groupes, crible } from './draw.js';
import {
  diviseurs, estPremier, premiersJusqua, petitFacteur, big, gr, OUI_NON, yn, choixNombres, ex, warn, retenir, methode, def, cols, tirer, petitsDiv,
} from './outils.js';

const NOM_JOURS = ['lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi', 'dimanche'];

/* =====================================================================
   1. Multiples d'un nombre
   ===================================================================== */
export function L1(d) {
  const formes = d < 1 ? ['oui', 'suiv'] : d < 2 ? ['oui', 'suiv', 'trois'] : d < 3 ? ['oui', 'suiv', 'prec', 'trois'] : ['oui', 'suiv', 'prec', 'trois', 'lequel'];
  const f = pick(formes);
  const b = d < 1 ? pick([2, 3, 4, 5, 10]) : d < 2 ? ri(2, 9) : d < 3 ? ri(6, 12) : ri(7, 25);
  if (f === 'oui') {
    const k = ri(3, d < 1 ? 10 : d < 2 ? 12 : d < 3 ? 20 : 60), est = chance(.5);
    const m = b * k, X = est ? m : m + (d < 2 ? ri(1, b - 1) : pick([1, b - 1, ri(1, b - 1)]));
    return {
      type: 'choice', opts: OUI_NON,
      html: `${gr(X)} est-il un multiple de ${b} ?`,
      check: choiceCheck(yn(est), { msg: c => (c === 'oui' ? `Compte de ${b} en ${b} : tu passes de ${gr(m)} à ${gr(m + b)} sans tomber sur ${gr(X)}.` : `Regarde mieux : en comptant de ${b} en ${b}, tu tombes exactement sur ${gr(X)}.`) }),
      verify: E => ((X % b === 0) === (E === 'oui')),
      hint: d < 3 ? `Compte de ${b} en ${b} (${b}, ${2 * b}, ${3 * b}…) : est-ce que tu tombes exactement sur ${gr(X)} ? Sinon, tu le dépasses.` : `Pose la division de ${gr(X)} par ${b} : si le reste est 0, alors ${gr(X)} est dans la table de ${b}.`,
      solution: est ? `${gr(X)} = ${b} × ${k} : ${gr(X)} est dans la table de ${b}, c'est un multiple de ${b}.` : `Les multiples de ${b} voisins de ${gr(X)} sont ${gr(m)} et ${gr(m + b)}. ${gr(X)} est entre les deux : ce n'est pas un multiple de ${b}.`,
      afterVisual: entre(b, est ? X : m, est ? X + b : m + b, X),
    };
  }
  if (f === 'suiv' || f === 'prec') {
    const suiv = f === 'suiv';
    const N = ri(b + 1, d < 1 ? 60 : d < 2 ? 150 : d < 3 ? 400 : 2000);
    const Nm = d >= 2 && chance(.3) ? b * Math.floor(N / b) : N; // N peut être lui-même un multiple
    const q = Math.floor(Nm / b), prev = Nm % b === 0 ? Nm - b : b * q, next = Nm % b === 0 ? Nm + b : b * (q + 1);
    const ans = suiv ? next : prev;
    const piege = Nm % b === 0 ? `« strictement ${suiv ? 'supérieur' : 'inférieur'} » : ${gr(Nm)} lui-même ne compte pas.` : '';
    return {
      type: 'nums', tpl: 'Réponse : {0}',
      html: `Quel est le plus ${suiv ? 'petit' : 'grand'} multiple de ${b} strictement ${suiv ? 'supérieur' : 'inférieur'} à ${gr(Nm)} ?`,
      check: numsCheck([ans], { msg: v => (v[0] === Nm && piege ? piege : v[0] === (suiv ? prev : next) ? `${gr(v[0])} est du mauvais côté de ${gr(Nm)} : ${suiv ? 'cherche le multiple qui vient après' : 'cherche le multiple qui vient avant'}.` : v[0] % b === 0 && (suiv ? v[0] > Nm : v[0] < Nm) ? `${gr(v[0])} est bien un multiple de ${b}, mais ce n'est pas le plus ${suiv ? 'proche' : 'proche'} de ${gr(Nm)}.` : '') }),
      value: suiv ? Math.ceil((Nm + 1) / b) * b : b * Math.floor((Nm - 1) / b),
      hint: d < 3 ? `Compte de ${b} en ${b} ${suiv ? `jusqu'à dépasser ${gr(Nm)}` : `en t'arrêtant juste avant ${gr(Nm)}`}.` : `Divise ${gr(Nm)} par ${b} : le quotient entier q donne le multiple ${b} × q qui est juste en dessous (ou égal). Il reste à ${suiv ? 'passer au suivant' : 'vérifier qu\'il est bien strictement inférieur'}.`,
      solution: `${b} × ${Nm % b === 0 ? q - 1 : q} = ${gr(prev)} et ${b} × ${Nm % b === 0 ? q + 1 : q + 1} = ${gr(next)} encadrent ${gr(Nm)}. Le plus ${suiv ? 'petit multiple de ' + b + ' strictement supérieur' : 'grand multiple de ' + b + ' strictement inférieur'} à ${gr(Nm)} est ${gr(ans)}.`,
      afterVisual: entre(b, prev, next, Nm),
    };
  }
  if (f === 'trois') {
    return {
      type: 'nums', tpl: '{0} ; {1} ; {2}', labels: ['1er multiple', '2e multiple', '3e multiple'],
      html: `Écris les trois premiers multiples non nuls de ${b}.`,
      check: numsCheck([b, 2 * b, 3 * b], { msg: v => (v[0] === 0 ? `0 est un multiple de ${b}, mais on demande les multiples <b>non nuls</b> : le premier est ${b} lui-même.` : v[1] - v[0] === b && v[2] - v[1] === b ? `Tes nombres vont bien de ${b} en ${b}, mais le premier multiple non nul est ${b} lui-même.` : '') }),
      value: 3 * b,
      hint: `Le premier multiple non nul de ${b} est ${b} × 1. Ajoute ${b} à chaque fois : ${b} × 1, ${b} × 2, ${b} × 3.`,
      solution: `${b} × 1 = ${b}, ${b} × 2 = ${2 * b}, ${b} × 3 = ${3 * b}. Les trois premiers multiples non nuls de ${b} sont ${b}, ${2 * b} et ${3 * b}.`,
      afterVisual: tableMult(b, 10),
    };
  }
  // lequel
  const X = b * ri(5, 60), autres = new Set();
  while (autres.size < 3) { const v = b * ri(5, 60) + ri(1, b - 1); if (v % b) autres.add(v); }
  const opts = choixNombres([X, ...autres]);
  return {
    type: 'choice', opts,
    html: `Lequel de ces nombres est un multiple de ${b} ?`,
    check: choiceCheck(String(X), { msg: c => `${gr(+c)} n'est pas dans la table de ${b} : il tombe entre deux multiples de ${b}.` }),
    verify: E => Number(E) % b === 0 && opts.filter(o => Number(o.v) % b === 0).length === 1,
    hint: `Un multiple de ${b} est dans la table de ${b}. Pour chaque nombre proposé, divise-le par ${b} : tu cherches celui qui « tombe juste » (reste 0).`,
    solution: `${gr(X)} = ${b} × ${X / b} : c'est le seul nombre de la liste qui est dans la table de ${b}.`,
  };
}
export function C1() {
  return `<h2>1. Les multiples d'un nombre</h2>
<p class="intro">Les multiples d'un nombre, ce sont les résultats de sa table de multiplication… et de toutes les suivantes, sans jamais s'arrêter.</p>
${cols(def(`Un <b>multiple</b> de b est un nombre qu'on obtient en multipliant b par un entier : b × 1, b × 2, b × 3… (et 0 = b × 0).<br>Il y en a une infinité. <b>b est un diviseur de a</b> signifie que a est un multiple de b.`), tableMult(6, 8))}
${methode(['Pour savoir si N est un multiple de b : compte de b en b, ou divise N par b ; si le reste est 0, c\'est un multiple.', 'Pour trouver le multiple suivant (ou précédent) : encadre N entre deux multiples consécutifs de b.', 'Attention aux mots « strictement » : si N est lui-même un multiple, il ne compte pas.'])}
${ex('42 est-il un multiple de 6 ?', `Je compte de 6 en 6 : 6, 12, 18, 24, 30, 36, <b>42</b>. Je tombe dessus : 42 = 6 × 7, donc <b>oui</b>.`)}
${ex('45 est-il un multiple de 6 ?', `Les multiples de 6 voisins sont 42 et 48. 45 est entre les deux : <b>non</b>.`)}
${ex('Quel est le plus petit multiple de 7 strictement supérieur à 30 ?', `7 × 4 = 28 ≤ 30 et 7 × 5 = 35 &gt; 30. Réponse : <b>35</b>.`)}
${ex('Quel est le plus grand multiple de 7 strictement inférieur à 30 ?', `7 × 4 = 28 &lt; 30 et 7 × 5 = 35 &gt; 30. Réponse : <b>28</b>.`)}
${ex('Quel est le plus petit multiple de 5 strictement supérieur à 40 ?', `40 est déjà un multiple de 5, mais il n'est pas <i>strictement</i> supérieur à 40. On passe au suivant : 40 + 5 = <b>45</b>.`)}
${ex('Écris les trois premiers multiples non nuls de 9.', `9 × 1 = 9, 9 × 2 = 18, 9 × 3 = 27. Réponse : <b>9 ; 18 ; 27</b>.`)}
${ex('Lequel de ces nombres est un multiple de 8 : 52, 60, 64 ou 90 ?', `Je regarde la table de 8 : 8, 16, 24, 32, 40, 48, 56, <b>64</b>. 52 et 60 tombent entre deux multiples, 90 aussi (88 et 96). Réponse : <b>64</b>.`)}
${warn(`⚠️ 0 est un multiple de tous les nombres (0 = b × 0), mais on demande souvent les multiples <b>non nuls</b>.<br>⚠️ Un nombre est un multiple de lui-même : b = b × 1.<br>⚠️ Ne confonds pas « multiple » et « diviseur » : 12 est un multiple de 3, et 3 est un diviseur de 12.`)}
${retenir('les multiples de b sont b × 0, b × 1, b × 2… ; pour tester N, regarde s\'il est dans la table de b (division sans reste).')}`;
}

/* =====================================================================
   2. Diviseurs d'un nombre
   ===================================================================== */
export function L2(d) {
  const formes = d < 1 ? ['est', 'liste'] : d < 3 ? ['est', 'liste', 'nb', 'petit'] : ['est', 'liste', 'nb', 'petit', 'grand'];
  const f = pick(formes);
  if (f === 'est') {
    const b = ri(2, 9 + 2 * d), k = ri(2, 6 + 3 * d), est = chance(.5), m = b * k;
    const X = est ? m : m + (d < 2 ? ri(1, b - 1) : pick([1, b - 1, ri(1, b - 1)]));
    return {
      type: 'choice', opts: OUI_NON,
      html: `${b} est-il un diviseur de ${gr(X)} ?`,
      check: choiceCheck(yn(est), { msg: c => (c === 'oui' ? `Si ${b} divisait ${gr(X)}, on aurait ${gr(X)} = ${b} × un entier. Or ${b} × ${k} = ${gr(m)} et ${b} × ${k + 1} = ${gr(m + b)} : ${gr(X)} est entre les deux.` : `Regarde mieux : en divisant ${gr(X)} par ${b}, il ne reste rien.`) }),
      verify: E => ((X % b === 0) === (E === 'oui')),
      hint: `Pose la division de ${gr(X)} par ${b} : si le reste est 0, alors ${b} est un diviseur de ${gr(X)}. Tu peux aussi chercher ${gr(X)} dans la table de ${b}.`,
      solution: est ? `${gr(X)} = ${b} × ${k} : la division de ${gr(X)} par ${b} tombe juste, donc ${b} est un diviseur de ${gr(X)}.` : `${gr(X)} = ${b} × ${k} + ${X - m} : il reste ${X - m}, donc ${b} n'est pas un diviseur de ${gr(X)}.`,
    };
  }
  if (f === 'liste') {
    const X = d < 1 ? petitsDiv(6, 20, 6, 3) : d < 2 ? petitsDiv(12, 30, 8, 4) : petitsDiv(20, 48, 8, 4), D = diviseurs(X), n = D.length;
    const check = v => {
      const E = D;
      if (v.every((x, i) => x === E[i])) return { ok: true };
      const bad = E.map((e, i) => (v[i] === e ? -1 : i)).filter(i => i >= 0);
      const faux = v.find(x => X % x !== 0 || x === 0);
      let msg = '';
      if (faux !== undefined) msg = `${faux} n'est pas un diviseur de ${X} : ${X} ÷ ${faux} ne tombe pas juste.`;
      else if (new Set(v).size < n) msg = `Tu as écrit deux fois le même nombre : il en manque un.`;
      else if ([...v].sort((p, q) => p - q).every((x, i) => x === E[i])) msg = `Tu as tous les diviseurs, mais écris-les dans l'ordre croissant.`;
      else msg = `Les nombres écrits sont des diviseurs, mais il en manque : ${X} a ${n} diviseurs en tout.`;
      return { ok: false, bad, msg };
    };
    check.expected = D;
    return {
      type: 'nums', tpl: D.map((_, i) => `{${i}}`).join(' ; '), labels: D.map((_, i) => `diviseur ${i + 1}`),
      html: `Écris tous les diviseurs de ${X}, dans l'ordre croissant.`,
      check, value: D[n - 1],
      verify: E => Array.from({ length: X }, (_, i) => i + 1).filter(k => X % k === 0).join() === E.join(),
      hint: `Essaie 1, 2, 3, 4… : chaque fois que k divise ${X}, ${X} ÷ k est un autre diviseur (ils vont par paires). ${X} a ${n} diviseurs en tout : autant que de cases.`,
      solution: `On cherche les paires de nombres dont le produit est ${X} : ${D.filter(x => x * x <= X).map(x => `${x} × ${X / x}`).join(' ; ')}.<br>Les diviseurs de ${X} sont : ${D.join(', ')}.`,
      afterVisual: rectangles(X, D),
    };
  }
  if (f === 'nb') {
    const X = d < 2 ? tirer(12, 60) : d < 3 ? tirer(30, 100) : tirer(50, 200), D = diviseurs(X), r = Math.floor(Math.sqrt(X));
    const carre = r * r === X;
    return {
      type: 'nums', tpl: 'Réponse : {0}',
      html: `Combien ${X} a-t-il de diviseurs ?`,
      check: numsCheck([D.length], { msg: v => (carre && v[0] === D.length + 1 ? `Attention : dans ${r} × ${r}, le diviseur ${r} est le même des deux côtés : il ne compte qu'une seule fois.` : v[0] === D.length - 1 || v[0] === D.length + 1 ? `Presque ! N'oublie ni 1 ni ${X} lui-même, et ne compte pas deux fois le même diviseur.` : v[0] * 2 === D.length ? `Tu n'as compté que la moitié des diviseurs : chaque diviseur trouvé a un « partenaire » (${X} ÷ lui).` : '') }),
      value: Array.from({ length: X }, (_, i) => i + 1).filter(k => X % k === 0).length,
      hint: `Cherche les diviseurs par paires en essayant 1, 2, 3… jusqu'à ${r} : chaque diviseur k trouvé donne aussi ${X} ÷ k. Puis compte-les tous.`,
      solution: `Paires de produit ${X} : ${D.filter(x => x * x <= X).map(x => `${x} × ${X / x}`).join(' ; ')}.<br>Diviseurs : ${D.join(', ')}. Il y en a ${D.length}.`,
      afterVisual: X <= 60 ? rectangles(X, D) : undefined,
    };
  }
  if (f === 'petit') {
    const X = d < 2 ? tirer(6, 60, v => !estPremier(v)) : tirer(20, 400, v => !estPremier(v) && (d < 3 || petitFacteur(v) > 2)), p = petitFacteur(X), r = Math.floor(Math.sqrt(X));
    return {
      type: 'nums', tpl: 'Réponse : {0}',
      html: `Quel est le plus petit diviseur de ${X} supérieur à 1 ?`,
      check: numsCheck([p], { msg: v => (v[0] === 1 ? `1 divise tous les nombres : on demande un diviseur <b>supérieur à 1</b>.` : X % v[0] === 0 ? `${v[0]} est bien un diviseur de ${X}, mais il y en a un plus petit (supérieur à 1).` : `${v[0]} ne divise pas ${X}.`) }),
      value: (() => { let k = 2; while (X % k) k++; return k; })(),
      hint: `Teste dans l'ordre 2, 3, 4, 5… : le premier nombre qui divise ${X} est la réponse. Tu n'as pas besoin d'aller au-delà de ${r}.`,
      solution: `On teste 2, 3, 5, 7… dans l'ordre : le premier qui divise ${X} est ${p}, car ${X} = ${p} × ${X / p}.`,
    };
  }
  // grand
  const X = tirer(20, 400, v => !estPremier(v)), p = petitFacteur(X);
  return {
    type: 'nums', tpl: 'Réponse : {0}',
    html: `Quel est le plus grand diviseur de ${X} autre que ${X} lui-même ?`,
    check: numsCheck([X / p], { msg: v => (v[0] === X ? `On demande un diviseur <b>autre que ${X} lui-même</b>.` : v[0] === p ? `${p} est le plus petit diviseur (après 1), pas le plus grand : pense à la paire ${p} × ${X / p}.` : X % v[0] === 0 ? `${v[0]} est un diviseur de ${X}, mais il y en a un plus grand.` : '') }),
    value: (() => { let k = X - 1; while (X % k) k--; return k; })(),
    hint: `Les diviseurs vont par paires : le plus grand (autre que ${X}) est le partenaire du plus petit diviseur supérieur à 1. Trouve ce petit diviseur de ${X}, puis divise ${X} par lui.`,
    solution: `Le plus petit diviseur de ${X} supérieur à 1 est ${p}, et ${X} = ${p} × ${X / p}. Le plus grand diviseur autre que ${X} est donc ${X / p}.`,
  };
}
export function C2() {
  return `<h2>2. Les diviseurs d'un nombre</h2>
<p class="intro">Diviser sans reste : voilà ce qu'est un diviseur. On les cherche toujours <b>par paires</b>.</p>
${cols(def(`Un nombre <b>d</b> est un <b>diviseur</b> de N si la division de N par d tombe juste (reste 0), c'est-à-dire si N = d × (un entier).<br>1 et N sont toujours des diviseurs de N.`), rectangles(12, [1, 2, 3, 4, 6, 12]))}
${methode(['Essaie 1, 2, 3, 4… dans l\'ordre.', 'À chaque fois que k divise N, note k et son partenaire N ÷ k.', 'Arrête-toi quand les deux nombres de la paire se rejoignent (vers la racine carrée de N).', 'Range les diviseurs dans l\'ordre croissant.'])}
${ex('6 est-il un diviseur de 48 ?', `48 = 6 × 8 : la division tombe juste, donc <b>oui</b>.`)}
${ex('6 est-il un diviseur de 50 ?', `50 = 6 × 8 + 2 : il reste 2, donc <b>non</b>.`)}
${ex('Écris tous les diviseurs de 18, dans l\'ordre croissant.', `Paires de produit 18 : 1 × 18 ; 2 × 9 ; 3 × 6. 4 et 5 ne marchent pas, et après 3 les paires se répètent.<br>Réponse : <b>1 ; 2 ; 3 ; 6 ; 9 ; 18</b>.`)}
${ex('Combien 36 a-t-il de diviseurs ?', `Paires : 1 × 36 ; 2 × 18 ; 3 × 12 ; 4 × 9 ; 6 × 6. Le dernier diviseur, 6, est seul (6 × 6) : il ne compte qu'une fois.<br>Diviseurs : 1, 2, 3, 4, 6, 9, 12, 18, 36. Réponse : <b>9</b>.`)}
${ex('Quel est le plus petit diviseur de 35 supérieur à 1 ?', `2 ne divise pas 35, 3 non plus, 4 non, mais 5 oui (35 = 5 × 7). Réponse : <b>5</b>.`)}
${ex('Quel est le plus grand diviseur de 35 autre que 35 lui-même ?', `35 = 5 × 7, le plus petit diviseur supérieur à 1 est 5, son partenaire est 35 ÷ 5 = <b>7</b>.`)}
${warn(`⚠️ N'oublie jamais <b>1</b> et <b>N lui-même</b> : ils sont toujours dans la liste.<br>⚠️ Dans un carré parfait (36 = 6 × 6), le diviseur du milieu ne compte qu'<b>une fois</b>.<br>⚠️ Un diviseur est toujours plus petit ou égal au nombre : 24 n'est pas un diviseur de 12.`)}
${retenir('les diviseurs de N vont par paires (d et N ÷ d) ; 1 et N en font toujours partie.')}`;
}

/* =====================================================================
   3. Critères de divisibilité par 2, 5 et 10
   ===================================================================== */
const FIN = { 2: [0, 2, 4, 6, 8], 5: [0, 5], 10: [0] };
const finTxt = k => (k === 2 ? '0, 2, 4, 6 ou 8' : k === 5 ? '0 ou 5' : '0');
const nombreFin = (nChiffres, u) => { const lo = Math.pow(10, nChiffres - 2), hi = Math.pow(10, nChiffres - 1) - 1; return ri(lo, hi) * 10 + u; };
export function L3(d) {
  const formes = d < 1 ? ['oui'] : d < 2 ? ['oui', 'lequel', 'chiffre'] : d < 3 ? ['oui', 'lequel', 'chiffre'] : ['oui', 'lequel', 'chiffre', 'classe'];
  const f = pick(formes);
  const k = d < 1 ? pick([2, 5, 10]) : pick([2, 5, 10]);
  const nch = d < 1 ? ri(2, 3) : d < 2 ? ri(3, 4) : d < 3 ? ri(4, 5) : ri(4, 6);
  const ok = () => pick(FIN[k]), ko = () => pick([0, 1, 2, 3, 4, 5, 6, 7, 8, 9].filter(u => !FIN[k].includes(u)));
  if (f === 'oui') {
    const est = chance(.5), N = nombreFin(nch, est ? ok() : ko()), u = N % 10;
    return {
      type: 'choice', opts: OUI_NON,
      html: `${gr(N)} est-il divisible par ${k} ?`,
      check: choiceCheck(yn(est), { msg: c => (c === 'oui' ? `Regarde le chiffre des unités de ${gr(N)} : c'est ${u}. Pour être divisible par ${k}, il devrait être ${finTxt(k)}.` : `Regarde le chiffre des unités de ${gr(N)} : c'est ${u}, et ${u} fait partie de ${finTxt(k)}.`) }),
      verify: E => ((N % k === 0) === (E === 'oui')),
      hint: `Seul le dernier chiffre de ${gr(N)} compte (ici ${u}). Un nombre est divisible par ${k} quand son chiffre des unités est ${finTxt(k)}.`,
      solution: `Le chiffre des unités de ${gr(N)} est ${u}. ${est ? `${k === 10 ? 'Il se termine par 0' : `Il se termine par ${u}, qui est l'un des chiffres ${finTxt(k)}`} : oui, ${gr(N)} est divisible par ${k}.` : `${k === 10 ? `Il ne se termine pas par 0` : `${u} n'est pas l'un des chiffres ${finTxt(k)}`} : non, ${gr(N)} n'est pas divisible par ${k}.`}`,
    };
  }
  if (f === 'lequel') {
    const X = nombreFin(nch, ok()), autres = new Set();
    while (autres.size < 3) autres.add(nombreFin(nch, ko()));
    const opts = choixNombres([X, ...autres]);
    return {
      type: 'choice', opts,
      html: `Lequel de ces nombres est divisible par ${k} ?`,
      check: choiceCheck(String(X), { msg: c => `${gr(+c)} se termine par ${c % 10} : ce n'est pas ${finTxt(k)}.` }),
      verify: E => Number(E) % k === 0 && opts.filter(o => Number(o.v) % k === 0).length === 1,
      hint: `Regarde seulement le dernier chiffre de chacun des quatre nombres : tu cherches celui qui se termine par ${finTxt(k)}.`,
      solution: `Seul ${gr(X)} se termine par ${X % 10}, un chiffre parmi ${finTxt(k)} : il est divisible par ${k}.`,
    };
  }
  if (f === 'chiffre') {
    const pref = ri(Math.pow(10, nch - 2), Math.pow(10, nch - 1) - 1), E = Math.max(...FIN[k]);
    const check = numsCheck([E], { msg: v => ((pref * 10 + v[0]) % k === 0 ? `${v[0]} convient, mais cherche le <b>plus grand</b> chiffre possible.` : `Avec ${v[0]} à la fin, le nombre ne se termine pas par ${finTxt(k)}.`) });
    return {
      type: 'nums', tpl: 'Chiffre : {0}', keys: { neg: false },
      html: `Quel est le plus grand chiffre qu'on peut écrire à la place de ? pour que ${pref}? soit divisible par ${k} ?`,
      check, value: E,
      hint: `Le nombre ${pref}? se termine par le chiffre cherché. Pour être divisible par ${k}, ce chiffre doit être ${finTxt(k)} : prends le plus grand.`,
      solution: `Il faut que le dernier chiffre soit ${finTxt(k)}. Le plus grand est ${E} : ${pref}${E} est divisible par ${k}.`,
    };
  }
  // classe
  const u = pick([0, 1, 2, 3, 4, 5, 6, 7, 8, 9]), N = nombreFin(nch, u);
  const E = u === 0 ? '10' : u % 2 === 0 ? '2' : u === 5 ? '5' : 'aucun';
  return {
    type: 'choice', opts: [{ v: '2', l: 'par 2 seulement' }, { v: '5', l: 'par 5 seulement' }, { v: '10', l: 'par 2 et par 5 (donc par 10)' }, { v: 'aucun', l: 'ni par 2 ni par 5' }],
    html: `${gr(N)} est divisible…`,
    check: choiceCheck(E, { msg: () => `Teste les deux critères sur le chiffre des unités ${u} : est-il pair ? est-ce 0 ou 5 ?` }),
    verify: q => q === ((N % 2 === 0 && N % 5 === 0) ? '10' : N % 2 === 0 ? '2' : N % 5 === 0 ? '5' : 'aucun'),
    hint: `Le chiffre des unités de ${gr(N)} est ${u}. Demande-toi : ${u} est-il pair ? ${u} est-il 0 ou 5 ? Tu as les deux réponses.`,
    solution: `Le chiffre des unités est ${u}. ${u % 2 === 0 ? `${u} est pair : divisible par 2. ` : `${u} est impair : pas divisible par 2. `}${u % 5 === 0 ? `${u} est 0 ou 5 : divisible par 5. ` : `${u} n'est ni 0 ni 5 : pas divisible par 5. `}${u === 0 ? 'Divisible par 2 et par 5, donc par 10 (terminé par 0).' : ''}`,
  };
}
export function C3() {
  return `<h2>3. Critères de divisibilité par 2, 5 et 10</h2>
<p class="intro">Pas besoin de poser la division : <b>le dernier chiffre</b> suffit pour savoir si un nombre est divisible par 2, par 5 ou par 10.</p>
${cols(def(`Un nombre est divisible…<br>• <b>par 2</b> s'il se termine par 0, 2, 4, 6 ou 8 (il est <i>pair</i>) ;<br>• <b>par 5</b> s'il se termine par 0 ou 5 ;<br>• <b>par 10</b> s'il se termine par 0.`), finaux())}
${methode(['Repère le chiffre des unités.', 'Compare-le aux listes : 0, 2, 4, 6, 8 pour 2 ; 0, 5 pour 5 ; 0 pour 10.', 'Si le nombre est divisible à la fois par 2 et par 5, il est divisible par 10.'])}
${ex('3 470 est-il divisible par 5 ?', `Le chiffre des unités est 0 : <b>oui</b>.`)}
${ex('7 934 est-il divisible par 2 ?', `Le chiffre des unités est 4 : pair, donc <b>oui</b>.`)}
${ex('1 250 est-il divisible par 10 ?', `Le chiffre des unités est 0 : <b>oui</b>. (1 255 ne l'est pas : il se termine par 5.)`)}
${ex('1 568 est-il divisible par 5 ?', `Le chiffre des unités est 8 : ce n'est ni 0 ni 5, donc <b>non</b>.`)}
${ex('Lequel de ces nombres est divisible par 2 : 4 573, 8 261, 7 934 ou 3 055 ?', `Je regarde les chiffres des unités : 3, 1, 4, 5. Seul 4 est pair. Réponse : <b>7 934</b>.`)}
${ex('Quel est le plus grand chiffre qu\'on peut écrire à la place de ? pour que 83? soit divisible par 5 ?', `Le dernier chiffre doit être 0 ou 5. Le plus grand est <b>5</b> : 835 est divisible par 5.`)}
${ex('Quel est le plus grand chiffre qu\'on peut écrire à la place de ? pour que 83? soit divisible par 2 ?', `Le dernier chiffre doit être 0, 2, 4, 6 ou 8. Le plus grand est <b>8</b> : 838 est divisible par 2.`)}
${ex('Quel est le plus grand chiffre qu\'on peut écrire à la place de ? pour que 83? soit divisible par 10 ?', `Seul 0 convient : <b>0</b> (830 est divisible par 10).`)}
${ex('1 250 est divisible…', `Le chiffre des unités est 0 : divisible par 2 (pair) et par 5, donc par 10. Réponse : <b>par 2 et par 5 (donc par 10)</b>.`)}
${ex('1 255 est divisible…', `Le chiffre des unités est 5 : pas pair, mais divisible par 5. Réponse : <b>par 5 seulement</b>.`)}
${ex('1 258 est divisible…', `Le chiffre des unités est 8 : pair, mais ni 0 ni 5. Réponse : <b>par 2 seulement</b>.`)}
${ex('1 257 est divisible…', `Le chiffre des unités est 7 : impair, et ni 0 ni 5. Réponse : <b>ni par 2 ni par 5</b>.`)}
${warn(`⚠️ Seul le <b>dernier</b> chiffre compte : 2 051 n'est pas divisible par 2 même s'il contient un 2 et un 0.<br>⚠️ Un nombre qui se termine par 5 est divisible par 5 mais <b>pas par 10</b> : 45 = 5 × 9.<br>⚠️ « Divisible par 10 » veut dire terminé par 0, pas « par 5 ».`)}
${retenir('par 2 : terminé par 0, 2, 4, 6, 8 ; par 5 : terminé par 0 ou 5 ; par 10 : terminé par 0.')}`;
}

/* =====================================================================
   4. Critères de divisibilité par 3 et par 9
   ===================================================================== */
const somme = n => String(n).split('').reduce((s, c) => s + Number(c), 0);
export function L4(d) {
  const formes = d < 1 ? ['somme', 'oui'] : d < 2 ? ['somme', 'oui', 'lequel'] : ['somme', 'oui', 'lequel', 'chiffre', 'classe'];
  const f = pick(formes);
  const k = d < 1 ? 3 : pick([3, 9]);
  const nch = d < 1 ? 3 : d < 2 ? ri(3, 4) : d < 3 ? ri(4, 5) : ri(5, 6);
  const lo = Math.pow(10, nch - 1), hi = Math.pow(10, nch) - 1;
  const plus = n => String(n).split('').join(' + ');
  if (f === 'somme') {
    const N = ri(lo, hi);
    return {
      type: 'nums', tpl: 'Somme : {0}',
      html: `Calcule la somme des chiffres de ${gr(N)}.`,
      check: numsCheck([somme(N)], { msg: v => (v[0] === N ? `Il faut <b>additionner les chiffres</b> un par un, pas recopier le nombre : ${plus(N)}.` : '') }),
      value: String(N).split('').map(Number).reduce((a, b) => a + b, 0),
      hint: `Écris ${plus(N)} et calcule de gauche à droite.`,
      solution: `${plus(N)} = ${somme(N)}.`,
      afterVisual: chiffresSomme(N),
    };
  }
  if (f === 'oui') {
    const est = chance(.5);
    const N = tirer(lo, hi, v => (est ? somme(v) % k === 0 : somme(v) % k !== 0 && (k === 3 || d < 1 || chance(.5) || somme(v) % 3 === 0)));
    const s = somme(N);
    return {
      type: 'choice', opts: OUI_NON,
      html: `${gr(N)} est-il divisible par ${k} ?`,
      check: choiceCheck(yn(est), { msg: c => (c === 'oui' ? `La somme des chiffres de ${gr(N)} est ${s} : ${s} n'est pas dans la table de ${k}.` : `La somme des chiffres de ${gr(N)} est ${s} : ${s} est dans la table de ${k}.`) }),
      verify: E => ((N % k === 0) === (E === 'oui')),
      hint: `Additionne les chiffres de ${gr(N)} : ${plus(N)}. Cette somme est-elle dans la table de ${k} ?`,
      solution: `${plus(N)} = ${s}. ${s} ${s % k === 0 ? `est dans la table de ${k}` : `n'est pas dans la table de ${k}`} : ${gr(N)} ${est ? 'est' : "n'est pas"} divisible par ${k}.${k === 9 && !est && s % 3 === 0 ? ` (Il est divisible par 3, mais pas par 9.)` : ''}`,
      afterVisual: chiffresSomme(N),
    };
  }
  if (f === 'lequel') {
    const X = tirer(lo, hi, v => somme(v) % k === 0), autres = new Set();
    while (autres.size < 3) { const v = ri(lo, hi); if (somme(v) % k !== 0 && !(k === 9 && false)) autres.add(v); }
    const opts = choixNombres([X, ...autres]);
    return {
      type: 'choice', opts,
      html: `Lequel de ces nombres est divisible par ${k} ?`,
      check: choiceCheck(String(X), { msg: c => `Pour ${gr(+c)}, la somme des chiffres est ${somme(+c)} : elle n'est pas dans la table de ${k}.` }),
      verify: E => Number(E) % k === 0 && opts.filter(o => Number(o.v) % k === 0).length === 1,
      hint: `Pour chacun des quatre nombres, additionne les chiffres et regarde si la somme est dans la table de ${k}.`,
      solution: `${plus(X)} = ${somme(X)}, qui est dans la table de ${k}. Pour les autres nombres, la somme des chiffres n'est pas un multiple de ${k}.`,
    };
  }
  if (f === 'chiffre') {
    const ch = String(ri(lo, hi)).split(''), pos = ri(1, ch.length - 1), shown = ch.map((c, i) => (i === pos ? '?' : c)).join('');
    const s = ch.reduce((a, c, i) => a + (i === pos ? 0 : Number(c)), 0);
    let E = 1; while ((s + E) % k !== 0) E++;
    const reste = ch.filter((_, i) => i !== pos).join(' + ');
    return {
      type: 'nums', tpl: 'Chiffre : {0}',
      html: `Quel est le plus petit chiffre <b>non nul</b> qu'on peut écrire à la place de ? pour que ${shown} soit divisible par ${k} ?`,
      check: numsCheck([E], { msg: v => (v[0] === 0 ? `On demande un chiffre <b>non nul</b>.` : (s + v[0]) % k === 0 ? `${v[0]} convient, mais cherche le <b>plus petit</b> chiffre non nul.` : `Avec ${v[0]}, la somme des chiffres vaut ${s + v[0]} : elle n'est pas dans la table de ${k}.`) }),
      verify: Eq => { const Nn = x => Number(ch.map((c, i) => (i === pos ? x : c)).join('')); let m = 1; while (Nn(m) % k !== 0) m++; return m === Eq[0] && Nn(Eq[0]) % k === 0; },
      hint: `Additionne les chiffres connus (${reste}) : il faut leur ajouter un chiffre pour atteindre un nombre de la table de ${k}. Prends le plus petit qui marche (pas 0).`,
      solution: `Chiffres connus : ${reste} = ${s}. Il faut que ${s} + ? soit dans la table de ${k} : le plus petit chiffre non nul est ${E} (${s} + ${E} = ${s + E}).`,
    };
  }
  // classe
  const kinds = ['3', '9', 'aucun'], kind = pick(kinds);
  const N = tirer(lo, hi, v => (kind === '9' ? somme(v) % 9 === 0 : kind === '3' ? somme(v) % 3 === 0 && somme(v) % 9 !== 0 : somme(v) % 3 !== 0));
  const s = somme(N);
  return {
    type: 'choice', opts: [{ v: '3', l: 'par 3 mais pas par 9' }, { v: '9', l: 'par 9 (donc aussi par 3)' }, { v: 'aucun', l: 'ni par 3 ni par 9' }],
    html: `${gr(N)} est divisible…`,
    check: choiceCheck(kind, { msg: () => `La somme des chiffres de ${gr(N)} est ${s}. Est-elle dans la table de 3 ? dans la table de 9 ?` }),
    verify: E => E === (N % 9 === 0 ? '9' : N % 3 === 0 ? '3' : 'aucun'),
    hint: `Additionne les chiffres de ${gr(N)} (${plus(N)}), puis regarde si la somme est dans la table de 9, ou seulement dans celle de 3.`,
    solution: `${plus(N)} = ${s}. ${s % 9 === 0 ? `${s} est dans la table de 9 : ${gr(N)} est divisible par 9, donc aussi par 3.` : s % 3 === 0 ? `${s} est dans la table de 3 mais pas de 9 : divisible par 3 seulement.` : `${s} n'est dans aucune des deux tables : ni par 3 ni par 9.`}`,
    afterVisual: chiffresSomme(N),
  };
}
export function C4() {
  return `<h2>4. Critères de divisibilité par 3 et par 9</h2>
<p class="intro">Pour 3 et pour 9, ce n'est plus le dernier chiffre qui compte : c'est la <b>somme de tous les chiffres</b>.</p>
${cols(def(`Un nombre est divisible <b>par 3</b> si la somme de ses chiffres est dans la table de 3.<br>Il est divisible <b>par 9</b> si la somme de ses chiffres est dans la table de 9.<br>Un nombre divisible par 9 l'est aussi par 3 (9 = 3 × 3).`), chiffresSomme(4527))}
${methode(['Additionne tous les chiffres du nombre.', 'Regarde si la somme est dans la table de 3, ou de 9.', 'Si la somme est trop grande, recommence : additionne ses chiffres.'])}
${ex('Calcule la somme des chiffres de 4 527.', `4 + 5 + 2 + 7 = <b>18</b>.`)}
${ex('4 527 est-il divisible par 3 ?', `La somme des chiffres est 18, qui est dans la table de 3 (18 = 3 × 6) : <b>oui</b>.`)}
${ex('4 527 est-il divisible par 9 ?', `La somme des chiffres est 18 = 9 × 2, qui est dans la table de 9 : <b>oui</b>.`)}
${ex('4 521 est-il divisible par 9 ?', `4 + 5 + 2 + 1 = 12. 12 n'est pas dans la table de 9 : <b>non</b> (mais il est divisible par 3).`)}
${ex('Lequel de ces nombres est divisible par 9 : 7 316, 5 328, 4 205 ou 6 112 ?', `Sommes des chiffres : 17, 18, 11, 10. Seule 18 est dans la table de 9. Réponse : <b>5 328</b>.`)}
${ex('Quel est le plus petit chiffre <b>non nul</b> qu\'on peut écrire à la place de ? pour que 4?7 soit divisible par 3 ?', `Les chiffres connus : 4 + 7 = 11. Il faut atteindre un nombre de la table de 3 : 12 (avec 1). Réponse : <b>1</b> (417 = 3 × 139).`)}
${ex('Quel est le plus petit chiffre <b>non nul</b> qu\'on peut écrire à la place de ? pour que 4?7 soit divisible par 9 ?', `4 + 7 = 11. La table de 9 : 9, 18… on atteint 18 avec 7. Réponse : <b>7</b> (477 = 9 × 53).`)}
${ex('4 527 est divisible…', `La somme des chiffres est 18 : dans la table de 9, donc divisible par 9 (et aussi par 3). Réponse : <b>par 9 (donc aussi par 3)</b>.`)}
${ex('4 521 est divisible…', `La somme est 12 : dans la table de 3, pas dans celle de 9. Réponse : <b>par 3 mais pas par 9</b>.`)}
${ex('4 523 est divisible…', `La somme est 14 : dans aucune des deux tables. Réponse : <b>ni par 3 ni par 9</b>.`)}
${warn(`⚠️ Une somme de chiffres multiple de 3 ne suffit pas pour 9 : 12 = 3 × 4 mais 12 n'est pas dans la table de 9.<br>⚠️ Ne regarde pas le dernier chiffre seul : 4 523 se termine par 3, mais il n'est pas divisible par 3.<br>⚠️ Avec un chiffre manquant, ajoute les chiffres connus <i>avant</i> de chercher.`)}
${retenir('on additionne tous les chiffres : somme dans la table de 3 → divisible par 3 ; dans la table de 9 → divisible par 9 (et par 3).')}`;
}

/* =====================================================================
   5. Division euclidienne
   ===================================================================== */
const eucl = (a, b) => {
  const q = Math.floor(a / b), r = a % b;
  const c = v => {
    const [x, y] = v;
    if (x === q && y === r) return { ok: true };
    let msg = '';
    if (y >= b && x * b + y === a) msg = `Le reste doit être <b>strictement plus petit</b> que le diviseur ${b} : tu peux encore mettre un groupe de ${b} de plus dans le quotient.`;
    else if (x === r && y === q && q !== r) msg = `Tu as inversé le quotient et le reste.`;
    else if (x * b + y !== a) msg = `Vérifie : ${b} × ${x} + ${y} = ${gr(b * x + y)}, ce n'est pas ${gr(a)}.`;
    else msg = `Ton calcul est cohérent, mais le reste doit être plus petit que ${b}.`;
    return { ok: false, bad: x === q ? [1] : y === r ? [0] : [0, 1], msg };
  };
  c.expected = [q, r];
  return c;
};
export function L5(d) {
  const formes = d < 1 ? ['div', 'egalite'] : d < 2 ? ['div', 'egalite', 'contexte'] : d < 3 ? ['div', 'egalite', 'contexte', 'retrouve', 'max'] : d < 4 ? ['div', 'egalite', 'contexte', 'retrouve', 'max', 'cars'] : ['div', 'egalite', 'contexte', 'retrouve', 'max', 'cars', 'jour'];
  const f = pick(formes);
  const [bMax, aMax] = d < 1 ? [9, 60] : d < 2 ? [12, 150] : d < 3 ? [25, 500] : d < 4 ? [99, 3000] : [999, 99999];
  const b = ri(2, bMax);
  const q = d >= 2 && chance(.1) ? 0 : ri(2, Math.max(2, Math.floor(aMax / b)));
  const r = d >= 1 && chance(.1) ? 0 : ri(d >= 2 && q === 0 ? 1 : 0, b - 1);
  const a = b * q + r, vis = groupes(a, b);
  if (f === 'div') return {
    type: 'nums', tpl: 'quotient : {0}  reste : {1}', labels: ['quotient', 'reste'], html: `Effectue la division euclidienne de ${gr(a)} par ${b}.`,
    check: eucl(a, b), verify: E => E[0] * b + E[1] === a && E[1] >= 0 && E[1] < b,
    hint: `Cherche le plus grand multiple de ${b} qui ne dépasse pas ${gr(a)} : c'est ${b} × (le quotient). Le reste est ce qui manque pour arriver à ${gr(a)}.`,
    solution: `${b} × ${q} = ${gr(b * q)} ≤ ${gr(a)} et ${b} × ${q + 1} = ${gr(b * (q + 1))} &gt; ${gr(a)}.<br>${gr(a)} − ${gr(b * q)} = ${r}.<br>${gr(a)} = ${b} × ${q} + ${r} : quotient ${q}, reste ${r}.`,
    afterVisual: vis,
  };
  if (f === 'egalite') return {
    type: 'nums', tpl: `${gr(a)} = ${b} × {0} + {1}`, labels: ['quotient', 'reste'], html: `Complète l'égalité de la division euclidienne de ${gr(a)} par ${b}, avec un reste plus petit que ${b}.`,
    check: eucl(a, b), verify: E => E[0] * b + E[1] === a && E[1] >= 0 && E[1] < b,
    hint: `Cherche le plus grand multiple de ${b} inférieur ou égal à ${gr(a)} : ${b} × ? ≤ ${gr(a)}. Le reste est la différence, et il doit rester plus petit que ${b}.`,
    solution: `${b} × ${q} = ${gr(b * q)} est le plus grand multiple de ${b} qui ne dépasse pas ${gr(a)}. Reste : ${gr(a)} − ${gr(b * q)} = ${r}.<br>${gr(a)} = ${b} × ${q} + ${r}.`,
    afterVisual: vis,
  };
  if (f === 'contexte') {
    const c = pick([['œufs', 'des boîtes de', 'boîtes pleines', 'œufs restants'], ['bonbons', 'des sachets de', 'sachets pleins', 'bonbons restants']]);
    return {
      type: 'nums', tpl: `{0} ${c[2]}, {1} ${c[3]}`, labels: ['pleins', 'restants'],
      html: `On range ${gr(a)} ${c[0]} dans ${c[1]} ${b}. Combien peut-on en remplir complètement, et combien ${c[0].startsWith('œ') ? "d'" : 'de '}${c[0]} restent-ils ?`,
      check: eucl(a, b), verify: E => E[0] * b + E[1] === a && E[1] >= 0 && E[1] < b,
      hint: `C'est la division euclidienne de ${gr(a)} par ${b} : le quotient donne les ${c[2]}, le reste donne les ${c[3]}.`,
      solution: `${gr(a)} = ${b} × ${q} + ${r}, avec ${r} &lt; ${b}. On remplit ${q} ${q > 1 ? c[2] : c[2].replace(/s/g, '')} et ${r === 0 ? `il ne reste aucun ${c[0].replace(/s$/, '')}` : `il reste ${r} ${r > 1 ? c[0] : c[0].replace(/s$/, '')}`}.`,
      afterVisual: vis,
    };
  }
  if (f === 'retrouve') return {
    type: 'nums', tpl: 'Dividende : {0}', html: `Dans une division euclidienne par ${b}, le quotient est ${q} et le reste est ${r}. Quel est le dividende ?`,
    check: numsCheck([a], { msg: v => (v[0] === b * q ? `Tu as oublié d'ajouter le reste ${r} : dividende = diviseur × quotient + reste.` : '') }), value: q * b + r,
    hint: `Utilise l'égalité dividende = ${b} × ${q} + ${r} : multiplie d'abord, puis ajoute le reste.`,
    solution: `dividende = ${b} × ${q} + ${r} = ${gr(b * q)} + ${r} = ${gr(a)}. On vérifie : ${r} &lt; ${b}.`,
  };
  if (f === 'max') return {
    type: 'nums', tpl: 'Réponse : {0}', html: `Quel est le plus grand reste possible dans une division euclidienne par ${b} ?`,
    check: numsCheck([b - 1], { msg: v => (v[0] === b ? `Le reste est <b>strictement</b> plus petit que le diviseur : si on avait ${b}, on pourrait encore remplir un groupe de plus.` : v[0] > b ? `Le reste doit être strictement plus petit que ${b}.` : '') }), value: b - 1,
    hint: `Le reste doit être strictement plus petit que ${b}. Quel est le plus grand entier strictement plus petit que ${b} ?`,
    solution: `Les restes possibles vont de 0 à ${b - 1}. Le plus grand reste possible est ${b - 1}.`,
  };
  if (f === 'cars') {
    const p = ri(12, 60), n = ri(2, Math.floor(1500 / p)) * p + (chance(.15) ? 0 : ri(1, p - 1)), qq = Math.floor(n / p), rr = n % p;
    return {
      type: 'nums', tpl: 'Réponse : {0}', html: `${gr(n)} élèves partent en sortie. Chaque car a ${p} places. Combien de cars faut-il au minimum ?`,
      check: numsCheck([qq + (rr ? 1 : 0)], { msg: v => (rr && v[0] === qq ? `Avec ${qq} cars, il reste ${rr} élèves sans place : il faut un car de plus.` : '') }), value: Math.ceil(n / p),
      hint: `Fais la division euclidienne de ${gr(n)} par ${p}. Si le reste n'est pas nul, les élèves qui restent ont encore besoin d'un car.`,
      solution: `${gr(n)} = ${p} × ${qq} + ${rr}. ${rr ? `${qq} cars sont pleins, mais il reste ${rr} élèves : il faut un car de plus, soit ${qq + 1} cars.` : `Les ${qq} cars sont exactement pleins : ${qq} cars suffisent.`}`,
    };
  }
  // jour
  const i0 = ri(0, 6), n = ri(20, 400), E = NOM_JOURS[(i0 + n) % 7];
  return {
    type: 'choice', opts: NOM_JOURS.map(j => ({ v: j, l: j })), html: `Aujourd'hui, nous sommes ${NOM_JOURS[i0]}. Quel jour de la semaine serons-nous dans ${n} jours ?`,
    check: choiceCheck(E, { msg: () => `Fais la division euclidienne de ${n} par 7 : le reste dit de combien de jours on avance après les semaines entières.` }),
    verify: Eq => { let j = i0; for (let k = 0; k < n; k++) j = (j + 1) % 7; return NOM_JOURS[j] === Eq; },
    hint: `Une semaine a 7 jours : fais la division euclidienne de ${n} par 7. Les semaines entières ramènent au même jour, seul le reste compte.`,
    solution: `${n} = 7 × ${Math.floor(n / 7)} + ${n % 7}. Après ${Math.floor(n / 7)} semaines entières on est de nouveau ${NOM_JOURS[i0]}, puis on avance de ${n % 7} jour${n % 7 > 1 ? 's' : ''} : ${E}.`,
  };
}
export function C5() {
  return `<h2>5. La division euclidienne</h2>
<p class="intro">Partager <b>en parts entières</b> : on met le plus possible de groupes complets, et il reste quelques objets.</p>
${cols(def(`Diviser <b>a</b> (le dividende) par <b>b</b> (le diviseur), c'est trouver deux entiers <b>q</b> (le quotient) et <b>r</b> (le reste) tels que<br><b>a = b × q + r</b> avec <b>0 ≤ r &lt; b</b>.`), groupes(23, 5))}
${methode(['Cherche le plus grand multiple de b qui ne dépasse pas a : b × q.', 'Le reste est r = a − b × q.', 'Vérifie que r est strictement plus petit que b, et que a = b × q + r.'])}
${ex('Effectue la division euclidienne de 83 par 6.', `6 × 13 = 78 ≤ 83 et 6 × 14 = 84 &gt; 83. Reste : 83 − 78 = 5.<br>Réponse : quotient <b>13</b>, reste <b>5</b>.`)}
${ex('Effectue la division euclidienne de 5 par 8.', `On ne peut pas remplir un seul groupe de 8 avec 5 objets : 8 × 0 = 0 ≤ 5. Reste : 5 − 0 = 5.<br>Réponse : quotient <b>0</b>, reste <b>5</b> (5 = 8 × 0 + 5).`)}
${ex('Complète l\'égalité de la division euclidienne de 83 par 6, avec un reste plus petit que 6.', `83 = 6 × <b>13</b> + <b>5</b> (et 5 &lt; 6).`)}
${ex('On range 83 œufs dans des boîtes de 6. Combien peut-on en remplir complètement, et combien d\'œufs restent-ils ?', `83 = 6 × 13 + 5 : <b>13 boîtes pleines</b> et <b>5 œufs</b> restants.`)}
${ex('Dans une division euclidienne par 7, le quotient est 12 et le reste est 3. Quel est le dividende ?', `dividende = 7 × 12 + 3 = 84 + 3 = <b>87</b>.`)}
${ex('Quel est le plus grand reste possible dans une division euclidienne par 7 ?', `Le reste est strictement plus petit que 7 : les restes possibles sont 0, 1, 2, 3, 4, 5, 6. Réponse : <b>6</b>.`)}
${ex('158 élèves partent en sortie. Chaque car a 40 places. Combien de cars faut-il au minimum ?', `158 = 40 × 3 + 38. Trois cars sont pleins, mais il reste 38 élèves : il faut un quatrième car. Réponse : <b>4</b>.`)}
${ex('Aujourd\'hui, nous sommes mardi. Quel jour de la semaine serons-nous dans 100 jours ?', `100 = 7 × 14 + 2. Après 14 semaines on est de nouveau mardi, puis on avance de 2 jours. Réponse : <b>jeudi</b>.`)}
${warn(`⚠️ Le reste est <b>toujours plus petit que le diviseur</b> : 83 = 6 × 12 + 11 est vrai, mais 11 &gt; 6 : ce n'est pas la division euclidienne.<br>⚠️ Ne confonds pas quotient et reste.<br>⚠️ Dans un problème de places (cars, boîtes), un reste non nul demande <b>un groupe de plus</b>.<br>⚠️ Si a &lt; b, le quotient est 0 et le reste est a.`)}
${retenir('a = b × q + r avec 0 ≤ r < b : le reste est toujours strictement plus petit que le diviseur.')}`;
}

/* =====================================================================
   6. Nombres premiers
   ===================================================================== */
const COMPOSES_IMPAIRS = n => n % 2 === 1 && n > 8 && !estPremier(n);
export function L6(d) {
  const formes = d < 1 ? ['est', 'lequel'] : d < 2 ? ['est', 'lequel', 'pas'] : d < 3 ? ['est', 'lequel', 'pas', 'suivant'] : ['est', 'lequel', 'pas', 'suivant', 'combien'];
  const f = pick(formes);
  const max = d < 1 ? 30 : d < 2 ? 50 : d < 3 ? 100 : d < 4 ? 150 : 200;
  const prem = () => pick(premiersJusqua(max));
  const comp = () => tirer(4, max, v => !estPremier(v) && (d < 2 || !chance(.7) || COMPOSES_IMPAIRS(v)) && (d < 2 || !(v % 2 === 0 && chance(.6))));
  const crible = N => { const t = Array(N + 1).fill(true); t[0] = t[1] = false; for (let i = 2; i * i <= N; i++) if (t[i]) for (let j = i * i; j <= N; j += i) t[j] = false; return t; };
  if (f === 'est') {
    const un = d >= 1 && chance(.1), est = !un && chance(.5), N = un ? 1 : est ? prem() : comp();
    const r = Math.floor(Math.sqrt(N)), tests = premiersJusqua(r), p = petitFacteur(N);
    return {
      type: 'choice', opts: OUI_NON, html: `${N} est-il un nombre premier ?`,
      check: choiceCheck(yn(est), { msg: c => (N === 1 ? `1 n'a qu'un seul diviseur (lui-même), alors qu'un nombre premier en a exactement <b>deux</b> : 1 n'est pas premier.` : c === 'oui' ? `${N} est divisible par ${p} : il a donc d'autres diviseurs que 1 et lui-même.` : `Teste les nombres premiers ${tests.join(', ')} : aucun ne divise ${N}.`) }),
      verify: E => { const s = crible(Math.max(N, 2)); return s[N] === (E === 'oui'); },
      hint: N <= 3 ? `Un nombre premier a exactement deux diviseurs : 1 et lui-même. Combien de diviseurs ${N} a-t-il ?` : `Cherche un diviseur de ${N} autre que 1 et ${N} : teste les nombres premiers ${tests.join(', ')} (inutile d'aller plus loin que ${r}).`,
      solution: N === 1 ? `1 n'a qu'un seul diviseur : 1 n'est pas premier.` : est ? `Aucun des nombres premiers ${tests.join(', ') || '(aucun)'} ne divise ${N} : ses seuls diviseurs sont 1 et ${N}. Il est premier.` : `${N} = ${p} × ${N / p} : ${N} a d'autres diviseurs que 1 et lui-même, il n'est pas premier.`,
    };
  }
  if (f === 'lequel' || f === 'pas') {
    const pas = f === 'pas', t = crible(max + 1);
    const un = pas && d >= 2 && chance(.25);
    const ps = new Set(); while (ps.size < (pas ? 3 : 1)) ps.add(prem());
    const cs = new Set(); while (cs.size < (pas ? 1 : 3)) { const c = comp(); cs.add(c); }
    const vals = pas ? [...ps, ...(un ? [1] : [...cs])] : [...ps, ...cs];
    const E = pas ? (un ? 1 : [...cs][0]) : [...ps][0];
    const opts = choixNombres(un ? vals.slice(0, 4) : vals);
    return {
      type: 'choice', opts, html: `Lequel de ces nombres ${pas ? "n'est <b>pas</b> premier" : 'est premier'} ?`,
      check: choiceCheck(String(E), { msg: c => (+c === 1 ? `1 n'est pas premier, mais il n'est pas non plus ce qu'on cherche ici : relis la question.` : pas ? `${c} est premier : ses seuls diviseurs sont 1 et ${c}.` : `${c} est divisible par ${petitFacteur(+c)} : il n'est pas premier.`) }),
      verify: Eq => (pas ? !t[+Eq] && opts.filter(o => !t[+o.v]).length === 1 : t[+Eq] && opts.filter(o => t[+o.v]).length === 1),
      hint: `Pour chacun des nombres ${opts.map(o => o.l).join(', ')}, cherche un diviseur autre que 1 et lui-même : teste 2, 3, 5 et 7. ${pas ? 'Tu cherches celui qui en a un.' : 'Tu cherches celui qui n\'en a aucun.'}`,
      solution: opts.map(o => { const n = +o.v; return n === 1 ? '1 n\'est pas premier (un seul diviseur).' : estPremier(n) ? `${n} est premier.` : `${n} = ${petitFacteur(n)} × ${n / petitFacteur(n)} : pas premier.`; }).join('<br>'),
    };
  }
  if (f === 'suivant') {
    const N = ri(8, d < 3 ? 60 : 140); let E = N + 1; while (!estPremier(E)) E++;
    return {
      type: 'nums', tpl: 'Réponse : {0}', html: `Quel est le plus petit nombre premier strictement supérieur à ${N} ?`,
      check: numsCheck([E], { msg: v => (v[0] > N && !estPremier(v[0]) ? `${v[0]} n'est pas premier : il est divisible par ${petitFacteur(v[0])}.` : v[0] > E ? `${v[0]} est peut-être premier, mais il y en a un plus petit après ${N}.` : '') }),
      value: (() => { let x = N + 1; const isP = z => { for (let k = 2; k < z; k++) if (z % k === 0) return false; return z > 1; }; while (!isP(x)) x++; return x; })(),
      hint: `Essaie ${N + 1}, ${N + 2}, ${N + 3}… dans l'ordre : élimine les nombres pairs, puis teste 3, 5 et 7 sur les autres. Le premier qui résiste est premier.`,
      solution: `On teste ${Array.from({ length: E - N }, (_, i) => N + 1 + i).map(x => (x === E ? `${x} (premier)` : `${x} = ${petitFacteur(x)} × ${x / petitFacteur(x)}`)).join(' ; ')}. Le plus petit nombre premier après ${N} est ${E}.`,
    };
  }
  // combien
  const a = ri(2, d < 4 ? 40 : 100), b = a + ri(9, 19), liste = Array.from({ length: b - a + 1 }, (_, i) => a + i), E = liste.filter(estPremier);
  return {
    type: 'nums', tpl: 'Réponse : {0}', html: `Combien y a-t-il de nombres premiers entre ${a} et ${b} (${a} et ${b} inclus) ?`,
    check: numsCheck([E.length], { msg: v => (Math.abs(v[0] - E.length) === 1 ? `Presque ! N'oublie pas que ${a} et ${b} sont inclus, et que 1 n'est pas premier.` : '') }),
    value: (() => { const t = crible(b); return t.slice(a, b + 1).filter(Boolean).length; })(),
    hint: `Dans la liste ${a}, ${a + 1}, …, ${b} : barre les nombres pairs, puis les multiples de 3, de 5 et de 7. Ceux qui restent sont premiers : compte-les.`,
    solution: `Les nombres premiers entre ${a} et ${b} sont : ${E.join(', ') || 'aucun'}. Il y en a ${E.length}.`,
  };
}
export function C6() {
  const p50 = premiersJusqua(50);
  return `<h2>6. Les nombres premiers</h2>
<p class="intro">Les nombres premiers sont les « briques » avec lesquelles on fabrique tous les autres nombres entiers.</p>
${cols(def(`Un nombre est <b>premier</b> s'il a <b>exactement deux diviseurs</b> : 1 et lui-même.<br>Les premiers jusqu'à 50 : <b>${p50.join(', ')}</b>.<br><b>1 n'est pas premier</b> (un seul diviseur) ; <b>2</b> est le seul premier pair.`), crible(p50))}
${methode(['Si N est pair (et différent de 2), il n\'est pas premier.', 'Sinon, teste les nombres premiers 3, 5, 7, 11… dans l\'ordre.', 'Arrête-toi quand le nombre premier testé au carré dépasse N : si aucun n\'a divisé N, N est premier.'])}
${ex('51 est-il un nombre premier ?', `51 n'est pas pair. 3 divise 51 car 5 + 1 = 6 : 51 = 3 × 17. <b>Non</b>, il n'est pas premier.`)}
${ex('53 est-il un nombre premier ?', `Je teste 2, 3, 5, 7 (car 7 × 7 = 49 ≤ 53 mais 11 × 11 = 121 &gt; 53) : aucun ne divise 53. <b>Oui</b>, 53 est premier.`)}
${ex('1 est-il un nombre premier ?', `1 n'a qu'un seul diviseur (lui-même) : <b>non</b>.`)}
${ex('Lequel de ces nombres est premier : 21, 27, 31 ou 39 ?', `21 = 3 × 7, 27 = 3 × 9, 39 = 3 × 13. 31 n'a pas de diviseur autre que 1 et 31. Réponse : <b>31</b>.`)}
${ex('Lequel de ces nombres n\'est <b>pas</b> premier : 13, 17, 19 ou 21 ?', `13, 17 et 19 sont premiers. 21 = 3 × 7 : réponse <b>21</b>.`)}
${ex('Lequel de ces nombres n\'est <b>pas</b> premier : 1, 3, 5 ou 7 ?', `3, 5 et 7 sont premiers. 1 n'a qu'un seul diviseur : il n'est pas premier. Réponse : <b>1</b>.`)}
${ex('Quel est le plus petit nombre premier strictement supérieur à 24 ?', `25 = 5 × 5, 26 = 2 × 13, 27 = 3 × 9, 28 = 2 × 14 : aucun n'est premier. 29 est premier. Réponse : <b>29</b>.`)}
${ex('Combien y a-t-il de nombres premiers entre 10 et 25 (10 et 25 inclus) ?', `Les premiers entre 10 et 25 : 11, 13, 17, 19, 23. Réponse : <b>5</b>.`)}
${warn(`⚠️ <b>1 n'est pas premier</b> (un seul diviseur).<br>⚠️ <b>2</b> est premier, et c'est le seul premier pair.<br>⚠️ Un nombre impair n'est pas forcément premier : 9, 15, 21, 25, 27, 33, 35, 39, 49, 51, 55, 57, 63, 65, 69, 77, 87, 91 sont des pièges !`)}
${retenir('un nombre premier a exactement deux diviseurs, 1 et lui-même ; 1 n\'est pas premier.')}`;
}

// Nombres décimaux, niveaux 9 à 12 : multiplication, division, ordre de grandeur, problèmes.
import { ri, pick, chance, shuffle, prenom, r6, approx, fx, f, nd, raw, rd, digitAt, tronque, arrondi, commaMsg, mk, numQ, big } from './num.js';
import { numsCheck, choiceCheck, stepsCheck } from '../../engine/answers/checks.js';
import { gcd } from '../../engine/util/arith.js';
import { multSchema, divPosed, approxBoxes, barres, posed } from './draw.js';
import { ex } from './niveaux-a.js';

const sc = (x, K = 3) => Math.round(r6(x) * 10 ** K);
const s = n => (n > 1 ? 's' : '');
const eu = x => fx(x, 2); // montants en euros : toujours deux décimales

/* ================= 9. multiplier deux décimaux ================= */
function L9(d) {
  const pool = d < 2 ? ['ent'] : d < 4 ? ['dec'] : d < 5 ? ['dec', 'sach'] : ['dec', 'sach', 'ent'];
  const form = pick(pool);
  let a, b, ka, kb, tries = 0;
  do {
    tries++;
    if (form === 'ent') { ka = d < 1 ? 1 : ri(1, 2); kb = 0; a = rd(ka, 1, d < 1 ? 9 : 30); b = ri(2, d < 1 ? 5 : 9); if (d >= 5) { ka = ri(1, 3); a = rd(ka, 1, 20); } } else if (d < 3) { ka = kb = 1; a = rd(1, 1, 9); b = rd(1, 1, 9); } else if (d < 4) { ka = 1; kb = ri(1, 2); a = rd(1, 0, 0); b = rd(kb, 0, 0); } else if (d < 5) { ka = ri(1, 2); kb = 1; a = rd(ka, 1, 30); b = rd(1, 0, 9); } else { ka = ri(1, 2); kb = ri(1, 2); a = rd(ka, 0, 20); b = rd(kb, 0, 9); }
  } while (tries < 300 && (nd(r6(a * b)) > 3 || Math.round(a * 10 ** ka) === 1 || Math.round(b * 10 ** kb) === 1 || b === 10 || a === 10 || a * b > 9999));
  const A = sc(a, ka), B = sc(b, kb), k = ka + kb, E = r6(a * b), P = A * B;
  const small = Math.min(a, b), other = Math.max(a, b);
  const more = v => (v[0] !== null && small < 1 && v[0] > other + 1e-9 ? `Multiplier par ${f(small)}, qui est inférieur à 1, donne un résultat <b>plus petit</b> que ${f(other)}.` : '');
  const ctx = `Compte les chiffres après la virgule dans les deux facteurs : ${ka} + ${kb} = ${k}.`;
  const eq = nd(E) < k ? `${fx(E, k)} = <b>${f(E)}</b>` : `<b>${fx(E, k)}</b>`;
  const solB = `${fx(A, 0)} × ${fx(B, 0)} = ${fx(P, 0)}. Chiffres après la virgule : ${ka} + ${kb} = ${k}.<br>${f(a)} × ${f(b)} = ${eq}`;
  const value = r6(P / 10 ** k);
  const vis = multSchema(a, b, E);
  if (form === 'sach') {
    return { ...numQ([E], value, { tpl: `${f(a)} × ${f(b)} = {0}`, more, ctx: `${f(a)} a ${ka} décimale${s(ka)} et ${f(b)} en a ${kb} : le résultat en a ${k}.` }),
      html: `Sachant que ${fx(A, 0)} × ${fx(B, 0)} = ${fx(P, 0)}, calcule : ${big(`${f(a)} × ${f(b)}`)}`,
      hint: `${f(a)} et ${f(b)} s'écrivent comme ${fx(A, 0)} et ${fx(B, 0)}, avec une virgule. Compte les chiffres après la virgule dans les deux facteurs (${ka} et ${kb}) : leur somme est le nombre de décimales du résultat, à placer dans ${fx(P, 0)}.`,
      solution: solB, afterVisual: vis, replaceVisual: false };
  }
  return { ...numQ([E], value, { tpl: 'Résultat : {0}', more, ctx }),
    html: `Calcule : ${big(`${f(a)} × ${f(b)}`)}`,
    hint: form === 'ent' ? `Calcule ${fx(A, 0)} × ${b} sans la virgule. Remets ensuite la virgule : ${f(a)} a ${ka} chiffre${s(ka)} après la virgule et ${b} n'en a pas, donc le résultat en a ${k}.` : `Calcule ${fx(A, 0)} × ${fx(B, 0)} comme avec des entiers. Compte ensuite les chiffres après la virgule dans ${f(a)} (${ka}) et dans ${f(b)} (${kb}) : le résultat en a ${ka} + ${kb}.`,
    solution: solB, afterVisual: vis, replaceVisual: false };
}
function C9() {
  return `<h2>9. Multiplier deux décimaux</h2>
<p class="intro">Pour multiplier des décimaux, on oublie d'abord les virgules, puis on les remet au bon endroit.</p>
<div class="def">Le produit de deux décimaux a <b>autant de chiffres après la virgule que les deux facteurs réunis</b>.<br>Exemple : 2,5 (1 chiffre) × 0,3 (1 chiffre) : le résultat a 1 + 1 = 2 chiffres après la virgule.</div>
<div class="methode"><b>Méthode</b><ol><li>Écris les nombres sans virgule et multiplie-les comme des entiers.</li><li>Compte les chiffres après la virgule dans chaque facteur et additionne.</li><li>Place la virgule dans le résultat pour avoir ce nombre de décimales (ajoute des zéros devant si besoin).</li><li>Contrôle avec un ordre de grandeur.</li></ol></div>
${multSchema(3.2, 1.5, 4.8)}
${ex('Exemple 1 : calcule 3,2 × 4 (décimal × entier)', `32 × 4 = 128. Le facteur 3,2 a 1 décimale et 4 en a 0 : le résultat a 1 décimale.<br>Résultat : <b>12,8</b>`)}
${ex('Exemple 2 : calcule 2,5 × 0,3 (décimal × décimal)', `25 × 3 = 75. Décimales : 1 + 1 = 2.<br>Résultat : <b>0,75</b>`)}
${ex('Exemple 3 : calcule 0,4 × 0,05 (avec des zéros)', `4 × 5 = 20. Décimales : 1 + 2 = 3 : on écrit 20 avec 3 décimales, 0,020.<br>0,4 × 0,05 = 0,020.<br>Résultat : <b>0,02</b>`)}
${ex('Exemple 4 : sachant que 32 × 15 = 480, calcule 3,2 × 1,5', `3,2 a 1 décimale et 1,5 aussi : le résultat en a 2. On place la virgule dans 480.<br>3,2 × 1,5 = 4,80 = <b>4,8</b>`)}
<div class="warn">⚠️ 0,3 × 0,3 n'est pas 0,9 mais <b>0,09</b> : 3 × 3 = 9, avec 2 décimales.<br>⚠️ Multiplier par un nombre inférieur à 1 rend plus petit : 2,5 × 0,3 est plus petit que 2,5.</div>
<div class="retenir">À retenir : décimales du produit = décimales du 1er facteur + décimales du 2<sup>e</sup>.</div>`;
}

/* ================= 10. division décimale ================= */
const terminating = (a, b) => { let r = b / gcd(a, b); while (r % 2 === 0) r /= 2; while (r % 5 === 0) r /= 5; return r === 1; };
/** arrondi du quotient a ÷ b (a entier ou décimal ≤ 3 décimales) au rang p, en entiers (demi vers le haut) */
const divRound = (a, b, p) => { const num = sc(a, 3) * 10 ** -p, den = b * 1000; return Math.floor((2 * num + den) / (2 * den)) / 10 ** -p; };
const PARTAGE = [
  (P, a, n) => ({ txt: `${P} coupe un ruban de ${f(a)} m en ${n} morceaux de même longueur. Quelle est la longueur de chaque morceau ?`, u: 'm', tot: `${f(a)} m` }),
  (P, a, n) => ({ txt: `${P} verse ${f(a)} L de jus dans ${n} bouteilles identiques. Quelle quantité de jus y a-t-il dans chaque bouteille ?`, u: 'L', tot: `${f(a)} L` }),
  (P, a, n) => ({ txt: `${n} amis se partagent équitablement une facture de ${eu(a)} €. Combien chacun paie-t-il ?`, u: '€', tot: `${eu(a)} €` }),
  (P, a, n) => ({ txt: `${P} répartit ${f(a)} kg de farine dans ${n} sacs identiques. Quelle est la masse de farine dans chaque sac ?`, u: 'kg', tot: `${f(a)} kg` }),
];
const COMBIEN = [
  (P, T, v) => ({ txt: `${P} a ${f(T)} L de jus. ${P} remplit des verres de ${f(v)} L. Combien de verres peut-elle remplir ?`, lab: 'Nombre de verres' }),
  (P, T, v) => ({ txt: `Un paquet de ${f(T)} kg de riz est réparti en sachets de ${f(v)} kg. Combien de sachets obtient-on ?`, lab: 'Nombre de sachets' }),
  (P, T, v) => ({ txt: `Une corde de ${f(T)} m est découpée en morceaux de ${f(v)} m. Combien de morceaux obtient-on ?`, lab: 'Nombre de morceaux' }),
  (P, T, v) => ({ txt: `Avec ${eu(T)} €, ${P} achète des cartes postales à ${eu(v)} € pièce (il n'y a pas de reste). Combien de cartes achète-t-elle ?`, lab: 'Nombre de cartes' }),
];
function L10(d) {
  const pool = d < 2 ? ['d1'] : d < 3 ? ['d1', 'd2'] : d < 4 ? ['d1', 'd2', 'ap', 'part'] : d < 5 ? ['d2', 'ap', 'part', 'nb'] : ['d1', 'd2', 'ap', 'part', 'nb'];
  const form = pick(pool);
  const exact = (a, b, E, extraHint) => ({ ...numQ([E], r6(sc(a, 3) / b / 1000), { tpl: 'Résultat : {0}', ctx: `La virgule du quotient se place quand on abaisse le premier chiffre après la virgule de ${f(a)}.` }),
    html: `Calcule : ${big(`${f(a)} ÷ ${b}`)}`, hint: extraHint,
    solution: `${f(a)} ÷ ${b} : on divise ${nd(a) ? 'la partie entière, on met la virgule, puis on continue avec les chiffres décimaux' : 'jusqu\'au dernier chiffre, puis on met une virgule et on ajoute des zéros au reste'}.<br>${f(a)} ÷ ${b} = <b>${f(E)}</b>.`,
    afterVisual: divPosed(raw(a), b, Math.max(0, nd(E) - nd(a))), replaceVisual: false });
  if (form === 'd1') {
    const q = rd(d < 1 ? 1 : ri(1, 2), 1, d < 3 ? 9 : 30), b = d < 1 ? ri(2, 5) : d < 3 ? ri(2, 9) : pick([2, 3, 4, 5, 6, 7, 8, 9, 11, 12]), a = r6(q * b);
    return exact(a, b, q, `Pose la division de ${f(a)} par ${b} : divise d'abord la partie entière (${Math.floor(a)}). Quand tu abaisses le premier chiffre après la virgule, mets la virgule au quotient, puis continue.`);
  }
  if (form === 'd2') {
    const b = pick(d < 4 ? [2, 4, 5] : [2, 4, 5, 8, 20, 25]);
    let a; do { a = ri(2, 99); } while (a % b === 0 || a < b);
    return exact(a, b, r6(a / b), `${a} n'est pas un multiple de ${b} : fais la division euclidienne, puis mets une virgule au quotient et ajoute un zéro au reste pour continuer. Recommence jusqu'à ce que le reste soit 0.`);
  }
  if (form === 'ap') {
    const p = d < 4 ? -1 : pick([-1, -2]), b = pick([3, 6, 7, 9, 11]);
    let a; do { a = ri(2, 99); } while (terminating(a, b) || a < b);
    const E = arrondi(a / b, p), t = tronque(a / b, p), nxt = digitAt(a / b, p - 1);
    return { ...numQ([E], divRound(a, b, p), { tpl: `${a} ÷ ${b} ≈ {0}`, more: v => (v[0] !== null && approx(v[0], t) && t !== E ? `Tu as coupé le quotient (troncature). Le chiffre suivant est ${nxt} : il est ≥ 5, donc on augmente le dernier chiffre.` : ''), comma: true }),
      html: `Donne le quotient de ${a} par ${b}, arrondi ${p === -1 ? 'au dixième' : 'au centième'}.`,
      hint: `Pose la division de ${a} par ${b} et continue jusqu'à ${-p + 1} chiffre${-p + 1 > 1 ? 's' : ''} après la virgule (le reste n'est jamais nul). Arrondis ensuite en regardant le dernier chiffre obtenu.`,
      solution: `${a} ÷ ${b} = ${fx(tronque(a / b, p - 1), -p + 1)}… ; on arrondit ${p === -1 ? 'au dixième' : 'au centième'} : <b>${fx(E, -p)}</b>.`,
      afterVisual: divPosed(String(a), b, -p + 1), replaceVisual: false };
  }
  if (form === 'part') {
    const n = ri(2, 8), q = rd(ri(1, 2), 1, 12), a = r6(q * n), P = prenom(), c = pick(PARTAGE)(P, a, n);
    return { ...numQ([q], r6(sc(a, 3) / n / 1000), { tpl: `{0} ${c.u}`, ctx: 'Partager, c\'est diviser : vérifie avec une multiplication.' }),
      html: c.txt, visual: barres(c.tot, Array.from({ length: n }, () => ({ l: '?', v: 1 }))),
      hint: `Partager ${f(a)} en ${n} parts égales, c'est diviser : ${f(a)} ÷ ${n}. Pose la division en mettant la virgule au quotient.`,
      solution: `${f(a)} ÷ ${n} = <b>${f(q)}</b> ${c.u}. Vérification : ${n} × ${f(q)} = ${f(a)}.`,
      afterVisual: divPosed(raw(a), n, Math.max(0, nd(q) - nd(a))), replaceVisual: false };
  }
  // combien de parts
  const n = ri(3, 40), v = pick([0.25, 0.5, 0.75, 1.5, 0.2, 2.5, 1.2, 0.4, 0.05]), T = r6(n * v), kv = nd(v), P = prenom(), c = pick(COMBIEN)(P, T, v), M = 10 ** kv;
  return { ...numQ([n], Math.round(sc(T, 3) / sc(v, 3)), { tpl: `${c.lab} : {0}`, ctx: '' }),
    html: c.txt,
    hint: `Il faut chercher combien de fois ${f(v)} tient dans ${f(T)} : c'est ${f(T)} ÷ ${f(v)}. Pour t'aider, multiplie les deux nombres par ${fx(M, 0)} (le quotient ne change pas) : tu divises alors ${f(r6(T * M))} par ${f(r6(v * M))}.`,
    solution: `On multiplie les deux nombres par ${fx(M, 0)} : ${f(T)} ÷ ${f(v)} = ${f(r6(T * M))} ÷ ${f(r6(v * M))} = <b>${n}</b>. Vérification : ${n} × ${f(v)} = ${f(T)}.` };
}
function C10() {
  return `<h2>10. Division décimale</h2>
<p class="intro">Diviser, c'est partager ou chercher « combien de fois ». Avec les décimaux, on peut continuer la division après la virgule.</p>
<div class="def">Pour diviser un décimal par un entier : on divise la partie entière, on met la <b>virgule au quotient</b> quand on abaisse le 1<sup>er</sup> chiffre décimal, et on continue. Si le reste n'est pas nul, on peut <b>ajouter des zéros</b> après la virgule.<br>Si la division ne tombe jamais juste, on donne une <b>valeur approchée</b> (arrondie).<br>Pour « combien de fois 0,25 dans 3 ? » : on multiplie les deux nombres par 100 (le quotient ne change pas) : 300 ÷ 25.</div>
<div class="methode"><b>Méthode</b><ol><li>Pose la division.</li><li>Quand tu arrives à la virgule du dividende, mets la virgule au quotient.</li><li>Reste non nul ? Ajoute un 0 au reste et continue.</li><li>Valeur approchée : va un chiffre plus loin que demandé, puis arrondis.</li></ol></div>
${divPosed('7,5', 5)}
${ex('Exemple 1 : calcule 7,5 ÷ 5', `On divise 7 par 5 : 1, reste 2. On met la virgule, on abaisse 5 : 25 ÷ 5 = 5, reste 0.<br>Résultat : <b>1,5</b>`)}
${ex('Exemple 2 : calcule 3 ÷ 4', `3 ÷ 4 = 0, reste 3. On met la virgule et un zéro : 30 ÷ 4 = 7, reste 2 ; puis 20 ÷ 4 = 5, reste 0.<br>Résultat : <b>0,75</b>`)}
${ex('Exemple 3 : donne 17 ÷ 3 arrondi au dixième', `17 ÷ 3 = 5,66… (le reste n'est jamais nul). Le chiffre suivant les dixièmes est 6 (≥ 5) : on augmente.<br>17 ÷ 3 ≈ <b>5,7</b>.<br>Au centième : le chiffre suivant les centièmes est 6, donc 17 ÷ 3 ≈ <b>5,67</b>.`)}
${ex('Exemple 4 : 13,5 m de ruban partagés en 5 morceaux égaux', `Partager, c'est diviser : 13,5 ÷ 5 = 2,7.<br>Réponse : <b>2,7</b> m.`)}
${ex('Exemple 5 : combien de verres de 0,25 L avec 2 L ?', `On cherche 2 ÷ 0,25. On multiplie par 100 : 200 ÷ 25 = 8.<br>Nombre de verres : <b>8</b>.`)}
<div class="warn">⚠️ N'oublie pas la virgule au quotient : 7,5 ÷ 5 = 1,5 et non 15.<br>⚠️ Pour une valeur approchée, on ne coupe pas : 5,66… au dixième donne 5,7 et non 5,6.<br>⚠️ Diviser par un nombre plus petit que 1 donne un résultat plus grand.</div>
<div class="retenir">À retenir : virgule au quotient quand on abaisse le 1<sup>er</sup> chiffre décimal ; on peut ajouter des zéros au reste.</div>`;
}

/* ================= 11. ordre de grandeur, vraisemblance ================= */
const OPS = { '×': (x, y) => x * y, '+': (x, y) => x + y, '−': (x, y) => x - y, '÷': (x, y) => x / y };
const terminates = (x, y) => terminating(x, y);
/** expression a op b avec leurs arrondis à l'unité ra, rb */
function genExpr(op) {
  for (;;) {
    let a, b;
    if (op === '×') { a = rd(1, 2, 20); b = chance(0.5) ? rd(1, 2, 9) : ri(2, 9); } else if (op === '+') { a = rd(chance(0.5) ? 1 : 2, 5, 60); b = rd(chance(0.5) ? 1 : 2, 5, 60); } else if (op === '−') { a = rd(chance(0.5) ? 1 : 2, 10, 80); b = rd(chance(0.5) ? 1 : 2, 3, 40); } else { b = chance(0.5) ? rd(1, 2, 9) : ri(2, 9); a = r6(rd(1, 2, 30) * b); }
    const ra = Math.round(a), rb = Math.round(b);
    if (ra < 2 || rb < 2) continue;
    if (op === '−' && (a <= b + 2 || ra <= rb)) continue;
    if (op === '÷' && (!terminates(ra, rb) || ra === rb || nd(r6(a / b)) > 3 || nd(a) > 3)) continue;
    const ex_ = r6(OPS[op](a, b));
    if (nd(ex_) > 3 || ex_ > 9999) continue;
    return { a, b, ra, rb, ex: ex_, r: r6(OPS[op](ra, rb)), op };
  }
}
/** exacte, recalculée en entiers */
const exactInt = (e) => { const { a, b, op } = e; const ka = nd(a), kb = nd(b), A = sc(a, ka), B = sc(b, kb); if (op === '×') return r6(A * B / 10 ** (ka + kb)); const K = Math.max(ka, kb); if (op === '÷') return r6((sc(a, K) / sc(b, K))); return r6((op === '+' ? sc(a, K) + sc(b, K) : sc(a, K) - sc(b, K)) / 10 ** K); };
function L11(d) {
  const pool = d < 1 ? ['og'] : d < 2 ? ['og', 'vrai'] : d < 3 ? ['og', 'vrai', 'oui'] : ['og', 'vrai', 'oui', 'virg'];
  const form = pick(pool);
  const ops = d < 3 ? ['×', '+'] : d < 4 ? ['×', '+', '−'] : ['×', '+', '−', '÷'];
  const op = pick(ops), e = genExpr(op), { a, b, ra, rb, r } = e;
  const txt = `${f(a)} ${op} ${f(b)}`;
  if (form === 'og') {
    const E = [ra, rb, r];
    const check = numsCheck(E, { msg: v => {
      if (v[0] !== null && !approx(v[0], ra)) return `${f(a)} arrondi à l'unité n'est pas ${f(v[0])} : regarde son chiffre des dixièmes (${digitAt(a, -1)}).`;
      if (v[1] !== null && !approx(v[1], rb)) return `${f(b)} arrondi à l'unité n'est pas ${f(v[1])} : regarde son chiffre des dixièmes (${digitAt(b, -1)}).`;
      if (v[2] !== null) return `Les arrondis sont justes. Calcule maintenant ${ra} ${op} ${rb}, avec les nombres arrondis.`;
      return '';
    } });
    return { type: 'nums', tpl: `${txt} ≈ {0} ${op} {1} = {2}`, expected: E, check, keys: { comma: true }, value: r6(OPS[op](Math.round(Number(raw(a).replace(',', '.'))), Math.round(Number(raw(b).replace(',', '.'))))),
      html: `Donne un ordre de grandeur de ${big(txt)} en arrondissant chaque nombre à l'unité.`,
      hint: `Arrondis ${f(a)} et ${f(b)} à l'unité (regarde le chiffre des dixièmes de chacun), puis effectue l'opération ${op} avec les deux nombres arrondis.`,
      solution: `${f(a)} ≈ ${ra} et ${f(b)} ≈ ${rb}. Donc ${txt} ≈ ${ra} ${op} ${rb} = <b>${f(r)}</b>.`,
      afterVisual: approxBoxes([[f(a), String(ra)], [f(b), String(rb)]], op, f(r)), replaceVisual: false };
  }
  if (form === 'vrai') {
    const ex_ = e.ex, cand = shuffle([-2, -1, 1, 2]).map(k => r6(ex_ * 10 ** k)).filter(x => nd(x) <= 3 && x < 1e7 && x >= 0.001).slice(0, 3);
    const vals = shuffle([ex_, ...cand]), idx = vals.indexOf(ex_), E = String(idx);
    return { type: 'choice', opts: vals.map((x, i) => ({ v: String(i), l: f(x) })), expected: E, verify: c => approx(vals[+c], exactInt(e)),
      check: choiceCheck(E, { msg: c => `${f(vals[+c])} n'est pas du bon ordre de grandeur : ${ra} ${op} ${rb} = ${f(r)}, donc le résultat est proche de ${f(r)}.` }),
      html: `Sans poser l'opération, quel est le seul résultat vraisemblable pour ${big(txt)}`,
      hint: `Arrondis ${f(a)} et ${f(b)} à l'unité (${ra} et ${rb}) et fais l'opération : le bon résultat est du même ordre de grandeur que le calcul approché. Élimine les propositions beaucoup trop grandes ou trop petites.`,
      solution: `${f(a)} ≈ ${ra}, ${f(b)} ≈ ${rb} et ${ra} ${op} ${rb} = ${f(r)}. Le seul résultat proche de ${f(r)} est <b>${f(ex_)}</b>.`,
      afterVisual: approxBoxes([[f(a), String(ra)], [f(b), String(rb)]], op, f(r)), replaceVisual: false };
  }
  if (form === 'oui') {
    const good = chance(0.5), k = pick([-1, 1, 1, -2, 2]), shown = good ? e.ex : (nd(r6(e.ex * 10 ** k)) <= 3 && r6(e.ex * 10 ** k) >= 0.01 ? r6(e.ex * 10 ** k) : r6(e.ex * 10)), P = prenom();
    const E = good ? 'oui' : 'non';
    return { type: 'choice', opts: [{ v: 'oui', l: 'Oui, c\'est vraisemblable' }, { v: 'non', l: 'Non, il y a une erreur' }], expected: E, verify: c => (c === 'oui') === approx(shown, exactInt(e)),
      check: choiceCheck(E, { msg: c => (c === 'oui' ? `${f(shown)} est très éloigné du calcul approché ${ra} ${op} ${rb} = ${f(r)} : il y a une erreur de virgule.` : `Le calcul approché ${ra} ${op} ${rb} = ${f(r)} est proche de ${f(shown)} : ce résultat est vraisemblable.`) }),
      html: `${P} a calculé ${txt} = ${f(shown)}. Ce résultat est-il vraisemblable ?`,
      hint: `Fais un calcul approché : arrondis ${f(a)} et ${f(b)} à l'unité (${ra} et ${rb}) et calcule ${ra} ${op} ${rb}. Compare avec ${f(shown)} : sont-ils du même ordre de grandeur ?`,
      solution: `${f(a)} ≈ ${ra}, ${f(b)} ≈ ${rb}, et ${ra} ${op} ${rb} = ${f(r)}. ${good ? `${f(shown)} est proche de ${f(r)} : c'est <b>vraisemblable</b>.` : `${f(shown)} est loin de ${f(r)} : ce n'est <b>pas vraisemblable</b> (la virgule est mal placée ; le bon résultat est ${f(e.ex)}).`}`,
      afterVisual: approxBoxes([[f(a), String(ra)], [f(b), String(rb)]], op, f(r)), replaceVisual: false };
  }
  // virg : placer la virgule dans le résultat d'un produit
  let a2, b2, A, B, ka2, kb2;
  do { ka2 = ri(1, 2); kb2 = ri(1, 2); a2 = rd(ka2, 1, 30); b2 = rd(kb2, 1, 9); A = sc(a2, ka2); B = sc(b2, kb2); } while ((A * B) % 10 === 0 || ka2 + kb2 > 3 || Math.round(a2) < 2 || Math.round(b2) < 2);
  const E = r6(a2 * b2), ra2 = Math.round(a2), rb2 = Math.round(b2), P = A * B;
  return { ...numQ([E], r6(P / 10 ** (ka2 + kb2)), { tpl: `${f(a2)} × ${f(b2)} = {0}`, ctx: `Un calcul approché (${ra2} × ${rb2} = ${ra2 * rb2}) te dit où mettre la virgule.` }),
    html: `Les chiffres du résultat de ${f(a2)} × ${f(b2)} sont <b>${P}</b> (la virgule manque). Où faut-il la placer ?`,
    hint: `Fais un calcul approché : ${ra2} × ${rb2} = ${ra2 * rb2}. Place la virgule dans ${P} pour obtenir un nombre proche de ${ra2 * rb2}.`,
    solution: `${f(a2)} ≈ ${ra2} et ${f(b2)} ≈ ${rb2}, donc le résultat est proche de ${ra2 * rb2}. Avec les chiffres ${P}, la bonne virgule donne <b>${f(E)}</b>. (Contrôle : ${ka2} + ${kb2} = ${ka2 + kb2} décimales.)`,
    afterVisual: approxBoxes([[f(a2), String(ra2)], [f(b2), String(rb2)]], '×', String(ra2 * rb2)), replaceVisual: false };
}
function C11() {
  return `<h2>11. Ordre de grandeur et vraisemblance</h2>
<p class="intro">Avant (ou après) un calcul, on peut estimer le résultat avec des nombres simples. C'est un excellent moyen de repérer une erreur de virgule.</p>
<div class="def">Un <b>ordre de grandeur</b> est un résultat approché obtenu en arrondissant les nombres (souvent à l'unité) avant de calculer.<br>Un résultat est <b>vraisemblable</b> s'il est proche de l'ordre de grandeur.</div>
<div class="methode"><b>Méthode</b><ol><li>Arrondis chaque nombre à l'unité (regarde le chiffre des dixièmes).</li><li>Fais le calcul avec les nombres arrondis.</li><li>Compare avec le résultat exact : s'ils sont très différents (rapport 10, 100…), il y a une erreur.</li></ol></div>
${approxBoxes([['4,87', '5'], ['19,6', '20']], '×', '100')}
${ex('Exemple 1 : donne un ordre de grandeur de 4,87 × 19,6', `4,87 ≈ 5 et 19,6 ≈ 20. Donc 4,87 × 19,6 ≈ 5 × 20 = <b>100</b>.`)}
${ex('Exemple 2 : quel est le seul résultat vraisemblable pour 3,2 × 4,9 ?', `3,2 ≈ 3 et 4,9 ≈ 5 : 3 × 5 = 15. Parmi 1,568 ; 15,68 ; 156,8 ; 0,1568, le seul proche de 15 est 15,68.<br>Réponse : <b>15,68</b>.`)}
${ex('Exemple 3 : Léa a calculé 6,8 × 4,2 = 285,6. Est-ce vraisemblable ?', `6,8 ≈ 7 et 4,2 ≈ 4 : 7 × 4 = 28. Le résultat 285,6 est 10 fois trop grand : Réponse : <b>Non, il y a une erreur</b> (erreur de virgule : le bon résultat est 28,56).`)}
${ex('Exemple 4 : place la virgule : les chiffres de 24,3 × 1,9 sont 4617', `24,3 ≈ 24 et 1,9 ≈ 2 : 24 × 2 = 48. Le nombre proche de 48 avec les chiffres 4617 est 46,17.<br>24,3 × 1,9 = <b>46,17</b>.`)}
${ex('Exemple 5 : ordre de grandeur d\'une somme, d\'une différence, d\'un quotient', `37,8 + 12,4 ≈ 38 + 12 = <b>50</b>. 45,2 − 9,7 ≈ 45 − 10 = <b>35</b>. 47,6 ÷ 4,8 ≈ 48 ÷ 5 = <b>9,6</b> (on peut aussi arrondir 4,8 à 5 et 47,6 à 50 : 10).`)}
<div class="warn">⚠️ L'ordre de grandeur ne donne pas le résultat exact : il sert à <b>contrôler</b>.<br>⚠️ Une erreur de virgule change le résultat d'un facteur 10 ou 100 : l'ordre de grandeur la détecte tout de suite.</div>
<div class="retenir">À retenir : j'arrondis, je calcule, je compare : le résultat doit être proche.</div>`;
}

/* ================= 12. problèmes ================= */
const lines = ls => ls.map((l, i) => `<div class="stepline">${l.replace('{}', `{${i}}`)}</div>`).join('');
/** check d'étapes avec message de virgule */
const stepCheck = (E, labels) => {
  const base = stepsCheck(E, labels);
  const fn = v => { const r = base(v); if (!r.ok && r.bad) { const c = commaMsg(v[r.bad[0]], E[r.bad[0]]); if (c) r.msg = c + ' ' + r.msg; } return r; };
  fn.expected = E;
  return fn;
};
const OBJ = [['cahier', 'cahiers'], ['stylo', 'stylos'], ['classeur', 'classeurs'], ['bouteille de jus', 'bouteilles de jus'], ['pain aux raisins', 'pains aux raisins'], ['gomme', 'gommes']];
const MES = [
  { ph: (P, T, n, v) => `Une corde mesure ${f(T)} m. ${P} en coupe ${n} morceaux de ${f(v)} m chacun. Quelle longueur reste-t-il ?`, a: 'Longueur coupée : {} m', b: 'Longueur restante : {} m', la: 'la longueur coupée', lb: 'la longueur restante', u: 'm' },
  { ph: (P, T, n, v) => `Un sac contient ${f(T)} kg de farine. ${P} utilise ${n} sachets de ${f(v)} kg. Quelle masse de farine reste-t-il ?`, a: 'Farine utilisée : {} kg', b: 'Farine restante : {} kg', la: 'la masse utilisée', lb: 'la masse restante', u: 'kg' },
  { ph: (P, T, n, v) => `Un bidon contient ${f(T)} L d'eau. ${P} remplit ${n} arrosoirs de ${f(v)} L. Quelle quantité d'eau reste-t-il dans le bidon ?`, a: 'Eau utilisée : {} L', b: 'Eau restante : {} L', la: "la quantité d'eau utilisée", lb: "la quantité d'eau restante", u: 'L' },
];
function L12(d) {
  const pool = d < 1 ? ['mon'] : d < 2 ? ['mon', 'mes'] : d < 3 ? ['mon', 'mes', 'uni'] : d < 4 ? ['mon', 'mes', 'uni', 'max'] : d < 5 ? ['mes', 'uni', 'max', 'car'] : ['mon', 'uni', 'max', 'car', 'fru'];
  const form = pick(pool), P = prenom();
  const steps = (E, ls, labels, value, hint, solution, extra = {}) => ({ type: 'steps', tpl: lines(ls), expected: E, check: stepCheck(E, labels), value, keys: { comma: true }, hint, solution, ...extra });
  if (form === 'mon') {
    const [o1, o2] = pick(OBJ), n = ri(2, d < 2 ? 4 : 6), p = r6(ri(80, 350) / 100), two = d >= 1, q = two ? r6(ri(50, 250) / 100) : 0, B = pick([10, 20, 50]);
    const tot = r6(n * p + q);
    if (tot >= B || tot < 1) return L12(d);
    const E = [tot, r6(B - tot)], pc = Math.round(p * 100), qc = Math.round(q * 100);
    return steps(E, ['Prix total : {} €', 'Monnaie rendue : {} €'], ['le prix total', 'la monnaie rendue'], (B * 100 - (n * pc + qc)) / 100,
      `Calcule d'abord le prix de ${n} ${o2} : ${n} × ${eu(p)}${two ? `, puis ajoute le prix de l'autre achat (${f(q)} €)` : ''}. La monnaie rendue est la différence entre ${B} € et le prix total.`,
      `Prix des ${n} ${o2} : ${n} × ${eu(p)} = ${f(r6(n * p))} €.${two ? `<br>Prix total : ${eu(r6(n * p))} + ${f(q)} = <b>${f(tot)} €</b>.` : ''}<br>Monnaie : ${B} − ${eu(tot)} = <b>${f(E[1])} €</b>.`,
      { html: `${P} achète ${n} ${o2} à ${eu(p)} € l'un${two ? ` et un stylo à ${eu(q)} €` : ''}. ${P} paie avec un billet de ${B} €. Quel est le prix total ? Combien lui rend-on ?`, visual: barres(`Billet de ${B} €`, [{ l: 'dépensé', v: tot }, { l: '?', v: B - tot }]) });
  }
  if (form === 'mes') {
    const c = pick(MES), n = ri(2, 6), v = r6(ri(15, 95) / 100), T = r6(Math.ceil(n * v + 0.5) + ri(0, 2) + ri(0, 1) * 0.5);
    const used = r6(n * v);
    if (used >= T) return L12(d);
    const E = [used, r6(T - used)];
    return steps(E, [c.a, c.b], [c.la, c.lb], (Math.round(T * 100) - n * Math.round(v * 100)) / 100,
      `Calcule d'abord ${c.la} : ${n} × ${f(v)} ${c.u}. Pour ${c.lb}, retranche ce résultat de ${f(T)} ${c.u}.`,
      `${c.la[0].toUpperCase() + c.la.slice(1)} : ${n} × ${f(v)} = ${f(used)} ${c.u}.<br>${c.lb[0].toUpperCase() + c.lb.slice(1)} : ${f(T)} − ${f(used)} = <b>${f(E[1])} ${c.u}</b>.`,
      { html: c.ph(P, T, n, v), visual: barres(`${f(T)} ${c.u}`, [{ l: `${n} × ${f(v)}`, v: used }, { l: '?', v: T - used }]) });
  }
  if (form === 'uni') {
    const n = ri(3, 8); let m; do { m = ri(2, 12); } while (m === n);
    const u = r6(ri(60, 380) / 100), Ptot = r6(n * u), [o1, o2] = pick(OBJ);
    const E = [u, r6(m * u)];
    return steps(E, ["Prix d'un objet : {} €", `Prix de ${m} objets : {} €`], ["le prix d'un objet", `le prix de ${m} objets`], (Math.round(u * 100) * m) / 100,
      `Pour le prix d'un objet, divise ${eu(Ptot)} € par ${n}. Multiplie ensuite ce prix par ${m}.`,
      `Prix d'un objet : ${eu(Ptot)} ÷ ${n} = <b>${f(u)} €</b>.<br>Prix de ${m} objets : ${m} × ${eu(u)} = <b>${f(E[1])} €</b>.`,
      { html: `${n} objets identiques coûtent ${eu(Ptot)} € en tout. Quel est le prix d'un objet ? Combien coûtent ${m} de ces objets ?`, visual: n <= 8 ? barres(`${eu(Ptot)} €`, Array.from({ length: n }, () => ({ l: '?', v: 1 }))) : '' });
  }
  if (form === 'max') {
    const B = pick([5, 10, 20, 50]), p = r6(ri(90, 480) / 100), k = Math.floor(B / p + 1e-9), rest = r6(B - k * p);
    if (k < 2 || rest <= 0 || k > 30) return L12(d);
    const E = [k, rest], [o1, o2] = pick(OBJ);
    return steps(E, ['Nombre acheté : {}', 'Argent restant : {} €'], ['le nombre acheté', "l'argent restant"], (B * 100 - k * Math.round(p * 100)) / 100,
      `Cherche le plus grand nombre de fois que ${eu(p)} € tient dans ${B} € : essaie ${k - 1}, ${k}, ${k + 1} fois ${eu(p)} € (ou calcule ${B} ÷ ${f(p)} et garde la partie entière). L'argent restant est ${B} € moins le prix de ce nombre d'objets.`,
      `${k} × ${eu(p)} = ${f(r6(k * p))} € (≤ ${B} €) et ${k + 1} × ${eu(p)} = ${f(r6((k + 1) * p))} € (&gt; ${B} €) : on peut acheter <b>${k}</b> ${k > 1 ? o2 : o1}.<br>Argent restant : ${B} − ${eu(r6(k * p))} = <b>${f(rest)} €</b>.`,
      { html: `${P} a ${B} €. Un ${o1} coûte ${eu(p)} €. Combien de ${o2} peut-on acheter au maximum ? Combien lui reste-t-il ?` });
  }
  if (form === 'car') {
    let c, D, pr, L, cost;
    do { c = rd(1, 4, 9); D = pick([150, 200, 250, 300, 350, 450]); pr = r6(ri(150, 210) / 100); L = r6(c * D / 100); cost = r6(L * pr); } while (nd(L) > 2 || nd(cost) > 2 || cost > 999);
    const E = [L, cost];
    return steps(E, ['Carburant consommé : {} L', 'Coût du trajet : {} €'], ['le carburant consommé', 'le coût du trajet'], (Math.round(L * 100) * Math.round(pr * 100)) / 10000,
      `${D} km, c'est ${eu(D / 100)} fois 100 km : multiplie la consommation ${f(c)} L par ${f(D / 100)}. Multiplie ensuite les litres par le prix ${f(pr)} € le litre.`,
      `${D} km = ${eu(D / 100)} × 100 km. Carburant : ${f(D / 100)} × ${f(c)} = <b>${f(L)} L</b>.<br>Coût : ${f(L)} × ${f(pr)} = <b>${f(cost)} €</b>.`,
      { html: `Une voiture consomme ${eu(c)} L d'essence pour 100 km. ${P} fait un trajet de ${D} km ; le litre coûte ${f(pr)} €. Combien de litres sont consommés ? Quel est le coût du trajet ?` });
  }
  // fru : deux produits au kilo, monnaie
  let q1, q2, p1, p2, B, t1, t2;
  do { q1 = rd(1, 1, 3); q2 = rd(1, 1, 3); p1 = r6(ri(150, 450) / 100); p2 = r6(ri(150, 450) / 100); t1 = r6(q1 * p1); t2 = r6(q2 * p2); B = pick([20, 50]); } while (nd(t1) > 2 || nd(t2) > 2 || t1 + t2 >= B || t1 + t2 < 5);
  const E = [t1, t2, r6(B - t1 - t2)];
  return steps(E, ['Pommes : {} €', 'Poires : {} €', 'Monnaie rendue : {} €'], ['le prix des pommes', 'le prix des poires', 'la monnaie rendue'], (B * 100 - Math.round(q1 * 10) * Math.round(p1 * 100) / 10 - Math.round(q2 * 10) * Math.round(p2 * 100) / 10) / 100,
    `Prix des pommes : ${f(q1)} × ${f(p1)}. Prix des poires : ${f(q2)} × ${f(p2)}. La monnaie est ${B} € moins la somme des deux prix.`,
    `Pommes : ${eu(q1)} × ${f(p1)} = <b>${f(t1)} €</b>.<br>Poires : ${eu(q2)} × ${f(p2)} = <b>${f(t2)} €</b>.<br>Monnaie : ${B} − (${eu(t1)} + ${f(t2)}) = ${B} − ${f(r6(t1 + t2))} = <b>${f(E[2])} €</b>.`,
    { html: `${P} achète ${eu(q1)} kg de pommes à ${f(p1)} € le kilo et ${eu(q2)} kg de poires à ${f(p2)} € le kilo. ${P} paie avec ${B} €. Calcule le prix de chaque fruit, puis la monnaie rendue.` });
}
function C12() {
  return `<h2>12. Problèmes avec des décimaux</h2>
<p class="intro">Prix, monnaie, longueurs, masses, consommation : les décimaux sont partout. On découpe le problème en étapes.</p>
<div class="def">Pour résoudre un problème : <b>1.</b> je lis et je repère les données (avec leurs unités) ; <b>2.</b> je choisis les opérations (acheter plusieurs fois → ×, partager → ÷, rendre la monnaie → −) ; <b>3.</b> je calcule étape par étape ; <b>4.</b> je contrôle avec un ordre de grandeur et j'écris l'unité.</div>
<div class="methode"><b>Méthode</b><ol><li>Fais un schéma en barre si ça aide.</li><li>Écris chaque calcul avec son unité (€, m, kg, L).</li><li>Réponds par une phrase.</li></ol></div>
${barres('Billet de 20 €', [{ l: 'dépensé', v: 11.75 }, { l: '?', v: 8.25 }])}
${ex('Exemple 1 : 3 cahiers à 2,35 € et un stylo à 1,80 €, payés avec 20 €', `3 × 2,35 + 1,80 = 7,05 + 1,80 = 8,85 et 20 − 8,85 = 11,15.<br>Prix total : <b>8,85</b> €<br>Monnaie rendue : <b>11,15</b> €`)}
${ex('Exemple 2 : une corde de 4,5 m, on coupe 3 morceaux de 0,85 m', `3 × 0,85 = 2,55 et 4,5 − 2,55 = 1,95.<br>Longueur coupée : <b>2,55</b> m<br>Longueur restante : <b>1,95</b> m`)}
${ex('Exemple 3 : 5 objets coûtent 6,75 €. Prix d\'un objet ? Prix de 8 objets ?', `6,75 ÷ 5 = 1,35 et 8 × 1,35 = 10,80.<br>Prix d'un objet : <b>1,35</b> €<br>Prix de 8 objets : <b>10,80</b> €`)}
${ex('Exemple 4 : avec 20 €, combien d\'objets à 1,35 € ? Combien reste-t-il ?', `14 × 1,35 = 18,90 € (≤ 20 €) et 15 × 1,35 = 20,25 € (&gt; 20 €) : on en achète 14 et 20 − 18,90 = 1,10.<br>Nombre acheté : <b>14</b><br>Argent restant : <b>1,10</b> €`)}
${ex('Exemple 5 : 6,4 L pour 100 km, trajet de 250 km, litre à 1,80 €', `250 km = 2,5 × 100 km. 2,5 × 6,4 = 16 et 16 × 1,80 = 28,80.<br>Carburant consommé : <b>16</b> L<br>Coût du trajet : <b>28,80</b> €`)}
${ex('Exemple 6 : 2,5 kg de pommes à 3,20 € le kilo et 1,5 kg de poires à 2,80 € le kilo, payés avec 20 €', `2,5 × 3,20 = 8 ; 1,5 × 2,80 = 4,20 ; 20 − (8 + 4,20) = 7,80.<br>Pommes : <b>8</b> €<br>Poires : <b>4,20</b> €<br>Monnaie rendue : <b>7,80</b> €`)}
<div class="warn">⚠️ N'oublie pas l'unité et vérifie qu'elle est la même partout (m avec m, € avec €).<br>⚠️ Une monnaie rendue ne peut pas être négative : si c'est le cas, vérifie le total.</div>
<div class="retenir">À retenir : un problème, plusieurs petites étapes, un contrôle à la fin.</div>`;
}

export const C = [
  { titre: 'Multiplier deux décimaux', generate: L9, cours: C9, classe: '6e' },
  { titre: 'Division décimale', generate: L10, cours: C10, classe: '6e' },
  { titre: 'Ordre de grandeur et vraisemblance', generate: L11, cours: C11, classe: '6e' },
  { titre: 'Problèmes : prix, monnaie, mesures', generate: L12, cours: C12, classe: '6e' },
];

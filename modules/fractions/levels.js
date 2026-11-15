// Fractions : 12 niveaux. Repris de fractions.html, avec un cours par niveau et une difficulté
// qui augmente avec d (série de réussites en cours).
import { ri, pick, shuffle, chance, prenom } from '../../engine/util/rand.js';
import { gcd, lcm, red } from '../../engine/util/arith.js';
import { F, R } from '../../engine/util/fmt.js';
import { fracCheck, numsCheck, choiceCheck } from '../../engine/answers/checks.js';
import { disc, bar, fracLine } from '../../engine/draw/numberLine.js';

const big = s => `<div class="big">${s}</div>`;
const slot = '<span class="slot">?</span>';
const simpl = (n, d) => { const [a, b] = red(n, d); if (b === 1 && d !== 1) return ` = ${a}`; return a !== n ? ` = ${F(a, b)}` : ''; };
const int = (X, extra = {}) => ({ type: 'nums', tpl: 'Réponse : {0}', check: numsCheck([X]), value: X, ...extra });
const frac = (N, D, o = {}) => ({ type: 'frac', check: fracCheck(N, D, o), value: N / D });

/* ---------- 1. lire une fraction ---------- */
function L1(d) {
  const v = d < 1 ? 0 : d < 2 ? ri(0, 1) : ri(0, 2);
  if (v < 2) {
    const b = ri(2, v ? 8 + d : 6 + d), a = ri(1, b - 1);
    return { ...frac(a, b), html: `Quelle fraction de la figure est coloriée ?${v ? bar(a, b) : disc(a, b)}`,
      hint: `Le <b>dénominateur</b> (en bas) = le nombre total de parts égales : compte-les.<br>Le <b>numérateur</b> (en haut) = le nombre de parts coloriées.`,
      solution: `Il y a ${b} parts en tout et ${a} coloriées : ${F(a, b)}.` };
  }
  const b = pick([2, 3, 4, 5, 6, 8, 10]); let a; do { a = ri(1, 2 * b - 1); } while (a % b === 0 || (d < 3 && a > b));
  return { ...frac(a, b), html: `Quelle fraction repère le point A ?${fracLine(a, b)}`,
    hint: `Regarde entre 0 et 1 : en combien de parts égales l'unité est-elle partagée ? C'est le dénominateur. Puis compte les graduations de 0 jusqu'à A.`,
    solution: `L'unité est partagée en ${b} et A est à ${a} graduations de 0 : ${F(a, b)}.` };
}
function C1() {
  return `<h2>1. Lire une fraction</h2>
<div class="def">Dans ${F('a', 'b')} : le <b>dénominateur</b> b (en bas) dit en combien de parts <b>égales</b> on a partagé l'unité ; le <b>numérateur</b> a (en haut) dit combien de parts on prend.</div>
<div class="ex">${disc(3, 8)}3 parts coloriées sur 8 : ${F(3, 8)} (« trois huitièmes »).</div>
<h3>Sur une droite graduée</h3>On regarde en combien de parts l'unité (de 0 à 1) est partagée, puis on compte les graduations depuis 0.
${fracLine(5, 3)}<div class="ex">L'unité est partagée en 3, A est à 5 graduations : A = ${F(5, 3)}. Une fraction peut être plus grande que 1 !</div>
<div class="warn">⚠️ Les parts doivent être <b>égales</b>. Et on compte <b>toutes</b> les parts pour le dénominateur, pas seulement les blanches.</div>`;
}

/* ---------- 2. fractions égales ---------- */
function L2(d) {
  const b = ri(2, 9), a = ri(1, b + (d >= 2 ? 6 : 3)), k = ri(2, d < 2 ? 5 : 9), v = d < 1 ? ri(0, 1) : ri(0, 2);
  let html, X, sol;
  if (v === 0) { html = `${F(a, b)} = ${F(slot, k * b)}`; X = k * a; sol = `${b} × ${k} = ${k * b}, donc ${a} × ${k} = ${k * a} : ${F(a, b)} = ${F(k * a, k * b)}`; }
  else if (v === 1) { html = `${F(a, b)} = ${F(k * a, slot)}`; X = k * b; sol = `${a} × ${k} = ${k * a}, donc ${b} × ${k} = ${k * b} : ${F(a, b)} = ${F(k * a, k * b)}`; }
  else { html = `${F(k * a, k * b)} = ${F(slot, b)}`; X = a; sol = `${k * b} ÷ ${k} = ${b}, donc ${k * a} ÷ ${k} = ${a} : ${F(k * a, k * b)} = ${F(a, b)}`; }
  return { ...int(X), html: `Complète l'égalité :${big(html)}`,
    hint: `Une fraction ne change pas si on <b>multiplie</b> (ou divise) le numérateur <b>et</b> le dénominateur par le <b>même</b> nombre. Cherche par combien on a multiplié (ou divisé) la partie connue.`,
    solution: sol };
}
function C2() {
  return `<h2>2. Fractions égales</h2>
<div class="def">On ne change pas une fraction en multipliant (ou en divisant) son numérateur <b>et</b> son dénominateur par le <b>même</b> nombre (non nul).</div>
<div class="ex">${F(2, 3)} = ${F('2 × 4', '3 × 4')} = ${F(8, 12)}</div>
<div style="display:flex;gap:10px;justify-content:center;flex-wrap:wrap">${bar(2, 3).replace('style="width:340px"', 'style="width:220px"')}${bar(8, 12).replace('style="width:340px"', 'style="width:220px"')}</div>
<p>Même longueur coloriée : ${F(2, 3)} et ${F(8, 12)} sont égales.</p>
<div class="warn">⚠️ Ajouter le même nombre en haut et en bas ne marche pas : ${F(1, 2)} ≠ ${F(2, 3)}.</div>`;
}

/* ---------- 3. simplifier ---------- */
function L3(d) {
  let a, b; do { b = ri(2, d < 2 ? 9 : 12); a = ri(1, b + 4); } while (gcd(a, b) !== 1 || a % b === 0);
  const k = d < 1 ? pick([2, 3, 5, 10]) : d < 3 ? pick([2, 3, 4, 5, 6, 7, 9, 10]) : pick([6, 8, 12, 14, 15, 18]);
  return { ...frac(a, b, { irr: true }), html: `Écris cette fraction sous forme <b>irréductible</b> (la plus simplifiée possible) :${big(F(k * a, k * b))}`,
    hint: `Cherche un nombre qui divise à la fois ${k * a} et ${k * b} (pense aux tables : 2, 3, 5…). Divise les deux par ce nombre, et recommence si c'est encore possible.`,
    solution: `${k * a} = ${k} × ${a} et ${k * b} = ${k} × ${b}, donc ${F(k * a, k * b)} = ${F(a, b)}.` };
}
function C3() {
  return `<h2>3. Simplifier une fraction</h2>
<div class="def"><b>Simplifier</b>, c'est diviser le numérateur et le dénominateur par un même nombre. Une fraction est <b>irréductible</b> quand on ne peut plus simplifier.</div>
<div class="ex">${F(18, 24)} : 18 et 24 sont dans la table de 6 → ${F('18 ÷ 6', '24 ÷ 6')} = ${F(3, 4)}</div>
<div class="ex">On peut aussi y aller en plusieurs fois : ${F(18, 24)} = ${F(9, 12)} (÷ 2) = ${F(3, 4)} (÷ 3).</div>
<h3>Critères utiles</h3>Divisible par <b>2</b> : se termine par 0, 2, 4, 6, 8. Par <b>5</b> : se termine par 0 ou 5. Par <b>3</b> : la somme des chiffres est dans la table de 3.
<div class="warn">⚠️ ${F(6, 8)} = ${F(3, 4)} est juste, mais n'oublie pas de vérifier qu'on ne peut plus simplifier.</div>`;
}

/* ---------- 4. comparer ---------- */
function L4(d) {
  let n1, d1, n2, d2, c1, c2, sol;
  if (chance(d < 1 ? .6 : d < 3 ? .3 : .15)) {
    const dd = ri(3, 12); n1 = ri(1, 2 * dd); do { n2 = ri(1, 2 * dd); } while (n2 === n1); d1 = d2 = dd; c1 = n1; c2 = n2;
    sol = `Même dénominateur : on compare les numérateurs ${n1} et ${n2}.`;
  } else {
    const dd = ri(2, 6), k = ri(2, d >= 3 ? 5 : 4), D = dd * k; const a = ri(1, 2 * dd), b = chance(.15) ? a * k : ri(1, 2 * D);
    if (chance(.5)) { n1 = a; d1 = dd; n2 = b; d2 = D; c1 = a * k; c2 = b; sol = `${F(a, dd)} = ${F(a * k, D)}, puis on compare ${a * k} et ${b}.`; }
    else { n1 = b; d1 = D; n2 = a; d2 = dd; c1 = b; c2 = a * k; sol = `${F(a, dd)} = ${F(a * k, D)}, puis on compare ${b} et ${a * k}.`; }
  }
  const X = c1 < c2 ? '<' : c1 > c2 ? '>' : '=';
  const S = X === '<' ? '&lt;' : X === '>' ? '&gt;' : '=';
  return { type: 'cmp', check: choiceCheck(X), value: n1 / d1 - n2 / d2, html: `Compare ces deux fractions :${big(`${F(n1, d1)} ${slot} ${F(n2, d2)}`)}`,
    hint: d1 === d2 ? `Les dénominateurs sont égaux : la plus grande fraction est celle qui a le plus grand numérateur.` : `Les dénominateurs sont différents : écris d'abord les deux fractions avec le <b>même dénominateur</b> (${Math.max(d1, d2)}).`,
    solution: sol + ` Donc ${F(n1, d1)} ${S} ${F(n2, d2)}.` };
}
function C4() {
  return `<h2>4. Comparer des fractions</h2>
<div class="def">• <b>Même dénominateur</b> : la plus grande est celle qui a le plus grand numérateur.<br>• <b>Dénominateurs différents</b> : on les met d'abord au même dénominateur.</div>
<div class="ex">${F(5, 7)} &gt; ${F(3, 7)} car 5 &gt; 3.</div>
<div class="ex">${F(2, 3)} et ${F(5, 6)} : ${F(2, 3)} = ${F(4, 6)}, et ${F(4, 6)} &lt; ${F(5, 6)}, donc ${F(2, 3)} &lt; ${F(5, 6)}.</div>
<div class="warn">⚠️ Une fraction dont le numérateur est plus grand que le dénominateur est plus grande que 1 : ${F(7, 5)} &gt; 1.</div>`;
}

/* ---------- 5. additionner, même dénominateur ---------- */
function L5(d) {
  const dd = ri(3, d < 2 ? 9 : 12), sub = d >= 1 && chance(.4); let a = ri(1, dd + (d >= 3 ? 6 : 2)), b = ri(1, dd);
  if (sub && b > a) [a, b] = [b, a]; if (sub && a === b) a++;
  const N = sub ? a - b : a + b, op = sub ? '−' : '+';
  return { ...frac(N, dd), html: `Calcule :${big(`${F(a, dd)} ${op} ${F(b, dd)}`)}`,
    hint: `Les dénominateurs sont égaux : on ${sub ? 'soustrait' : 'additionne'} les <b>numérateurs</b> et on <b>garde</b> le dénominateur ${dd}.`,
    solution: `${F(a, dd)} ${op} ${F(b, dd)} = ${F(`${a} ${op} ${b}`, dd)} = ${F(N, dd)}${simpl(N, dd)}` };
}
function C5() {
  return `<h2>5. Additionner (même dénominateur)</h2>
<div class="def">${F('a', 'd')} + ${F('b', 'd')} = ${F('a + b', 'd')} &nbsp; et &nbsp; ${F('a', 'd')} − ${F('b', 'd')} = ${F('a − b', 'd')}</div>
<div class="ex">${F(2, 7)} + ${F(3, 7)} = ${F(5, 7)} &nbsp; : 2 septièmes + 3 septièmes = 5 septièmes.</div>
${bar(5, 7)}
<div class="warn">⚠️ On n'additionne <b>pas</b> les dénominateurs : ${F(2, 7)} + ${F(3, 7)} n'est pas ${F(5, 14)} !</div>`;
}

/* ---------- 6. dénominateurs multiples ---------- */
function L6(d) {
  const dd = ri(2, 6), k = ri(2, d < 2 ? 3 : 4), D = dd * k, sub = d >= 1 && chance(.4);
  const a = ri(1, dd + 1), b = ri(1, D + 2); let t = [{ n: a, d: dd, c: a * k }, { n: b, d: D, c: b }];
  if (chance(.5)) t.reverse();
  if (sub && t[0].c <= t[1].c) { t.reverse(); if (t[0].c === t[1].c) t[0] = t[0].d === dd ? { n: t[0].n + 1, d: dd, c: (t[0].n + 1) * k } : { n: t[0].n + 1, d: D, c: t[0].n + 1 }; }
  const op = sub ? '−' : '+', N = sub ? t[0].c - t[1].c : t[0].c + t[1].c;
  return { ...frac(N, D), html: `Calcule :${big(`${F(t[0].n, t[0].d)} ${op} ${F(t[1].n, t[1].d)}`)}`,
    hint: `${D} est un multiple de ${dd} (${dd} × ${k} = ${D}). Transforme la fraction de dénominateur ${dd} en une fraction de dénominateur ${D}, puis ${sub ? 'soustrais' : 'additionne'} les numérateurs.`,
    solution: `${F(t[0].n, t[0].d)} ${op} ${F(t[1].n, t[1].d)} = ${F(t[0].c, D)} ${op} ${F(t[1].c, D)} = ${F(N, D)}${simpl(N, D)}` };
}
function C6() {
  return `<h2>6. Dénominateurs multiples l'un de l'autre</h2>
<div class="def">Si un dénominateur est un multiple de l'autre, on transforme la fraction qui a le plus petit dénominateur.</div>
<div class="ex">${F(1, 3)} + ${F(4, 9)} : 9 = 3 × 3, donc ${F(1, 3)} = ${F(3, 9)}.<br>${F(3, 9)} + ${F(4, 9)} = ${F(7, 9)}</div>
<div class="ex">${F(5, 4)} − ${F(3, 8)} = ${F(10, 8)} − ${F(3, 8)} = ${F(7, 8)}</div>
<div class="warn">⚠️ Quand on multiplie le dénominateur, il faut multiplier aussi le numérateur !</div>`;
}

/* ---------- 7. fraction d'une quantité ---------- */
function L7(d) {
  const b = ri(2, d < 2 ? 6 : 10), a = ri(1, b - 1), v = d < 1 ? ri(0, 1) : d < 3 ? ri(0, 3) : ri(0, 4);
  if (v === 4) {
    const n = ri(2, 9), A = ri(1, 8), B = ri(2, 9), N = n * A;
    return { ...frac(N, B), html: `Calcule :${big(`${n} × ${F(A, B)}`)}`,
      hint: `Pour multiplier un nombre entier par une fraction, on multiplie le <b>numérateur</b> par ce nombre et on garde le dénominateur.`,
      solution: `${n} × ${F(A, B)} = ${F(`${n} × ${A}`, B)} = ${F(N, B)}${simpl(N, B)}` };
  }
  const N = b * (v === 2 ? ri(2, Math.max(2, Math.floor(32 / b))) : ri(2, d < 2 ? 6 : 12)), X = N / b * a;
  const nm = prenom();
  const txt = [`Calcule les ${F(a, b)} de ${N}.`,
    `Un livre a ${N} pages. ${nm} en a lu les ${F(a, b)}. Combien de pages cela représente-t-il ?`,
    `Une classe compte ${N} élèves ; les ${F(a, b)} font du sport en club. Combien d'élèves cela représente-t-il ?`,
    `Un film dure ${N} minutes. Les ${F(a, b)} du film sont passés. Combien de minutes cela fait-il ?`][v];
  return { ...int(X), html: txt, hint: `Calcule d'abord ${F(1, b)} de ${N} (c'est ${N} ÷ ${b}), puis multiplie par ${a}.`,
    solution: `${N} ÷ ${b} = ${N / b}, puis ${N / b} × ${a} = ${X}.` };
}
function C7() {
  return `<h2>7. Fraction d'une quantité</h2>
<div class="def">Prendre les ${F('a', 'b')} d'une quantité : on la <b>divise par b</b>, puis on <b>multiplie par a</b>.</div>
<div class="ex">Les ${F(3, 4)} de 20 : 20 ÷ 4 = 5, puis 5 × 3 = <b>15</b>.</div>
${bar(3, 4)}
<div class="def">Multiplier un entier par une fraction : n × ${F('a', 'b')} = ${F('n × a', 'b')}.</div>
<div class="ex">5 × ${F(2, 3)} = ${F(10, 3)}</div>
<div class="warn">⚠️ Les ${F(3, 4)} de 20, ce n'est pas 20 ÷ 3 × 4 : on divise par le <b>dénominateur</b>.</div>`;
}

/* ---------- 8. multiplier ---------- */
function L8(d) {
  const m = d < 2 ? 6 : 9, a = ri(1, m), b = ri(2, m), c = ri(1, m), e = ri(2, m), N = a * c, D = b * e;
  return { ...frac(N, D), html: `Calcule (donne si possible le résultat simplifié) :${big(`${F(a, b)} × ${F(c, e)}`)}`,
    hint: `Pour multiplier deux fractions : <b>numérateur × numérateur</b> et <b>dénominateur × dénominateur</b>. (Pas besoin de même dénominateur !)`,
    solution: `${F(a, b)} × ${F(c, e)} = ${F(`${a} × ${c}`, `${b} × ${e}`)} = ${F(N, D)}${simpl(N, D)}` };
}
function C8() {
  return `<h2>8. Multiplier des fractions</h2>
<div class="def">${F('a', 'b')} × ${F('c', 'd')} = ${F('a × c', 'b × d')}</div>
<div class="ex">${F(2, 3)} × ${F(4, 5)} = ${F('2 × 4', '3 × 5')} = ${F(8, 15)}</div>
<div class="ex">Astuce : on peut simplifier avant de multiplier. ${F(3, 4)} × ${F(2, 9)} = ${F('3 × 2', '4 × 9')} = ${F(6, 36)} = ${F(1, 6)}</div>
<div class="warn">⚠️ Pour multiplier, <b>pas besoin</b> de même dénominateur (c'est seulement pour + et −).</div>`;
}

/* ---------- 9. dénominateurs quelconques ---------- */
function L9(d) {
  let d1, d2; do { d1 = ri(2, d < 2 ? 5 : 7); d2 = ri(2, d < 2 ? 7 : 9); } while (d1 === d2 || d1 % d2 === 0 || d2 % d1 === 0);
  const D = lcm(d1, d2), sub = d >= 1 && chance(.4); let a = ri(1, d1 + 1), b = ri(1, d2 + 1);
  if (sub && a * (D / d1) <= b * (D / d2)) [a, b, d1, d2] = [b, a, d2, d1];
  const K1 = D / d1, K2 = D / d2; if (sub && a * K1 === b * K2) a++;
  const op = sub ? '−' : '+', N = sub ? a * K1 - b * K2 : a * K1 + b * K2;
  return { ...frac(N, D), html: `Calcule :${big(`${F(a, d1)} ${op} ${F(b, d2)}`)}`,
    hint: `Cherche un dénominateur commun : un nombre qui est à la fois dans la table de ${d1} et dans celle de ${d2} (le plus petit est ${D}).`,
    solution: `${F(a, d1)} ${op} ${F(b, d2)} = ${F(a * K1, D)} ${op} ${F(b * K2, D)} = ${F(N, D)}${simpl(N, D)}` };
}
function C9() {
  return `<h2>9. Dénominateurs quelconques</h2>
<div class="def">On cherche un <b>dénominateur commun</b> : un multiple des deux dénominateurs (le plus petit possible).</div>
<div class="ex">${F(2, 3)} + ${F(1, 4)} : 12 est dans la table de 3 et de 4.<br>${F(2, 3)} = ${F(8, 12)} et ${F(1, 4)} = ${F(3, 12)}, donc ${F(2, 3)} + ${F(1, 4)} = ${F(11, 12)}.</div>
<div class="ex">${F(5, 6)} − ${F(3, 4)} = ${F(10, 12)} − ${F(9, 12)} = ${F(1, 12)}</div>
<div class="warn">⚠️ Le produit des dénominateurs marche toujours (3 × 4 = 12), mais parfois il y a plus petit : pour 4 et 6, 12 suffit (pas besoin de 24).</div>`;
}

/* ---------- 10. racines carrées ---------- */
function L10(d) {
  const v = d < 1 ? ri(0, 1) : d < 3 ? ri(0, 2) : ri(0, 3);
  if (v === 3) {
    const n = ri(2, 9), m = ri(2, 9);
    return { ...int(n * m), html: `Calcule :${big(`${R(n * n)} × ${R(m * m)}`)}`,
      hint: `Calcule chaque racine séparément : quel nombre au carré donne ${n * n} ? et ${m * m} ?`,
      solution: `${R(n * n)} = ${n} et ${R(m * m)} = ${m}, donc le résultat est ${n} × ${m} = ${n * m}.` };
  }
  const n = v === 2 ? 10 * ri(2, 9) : ri(1, d < 2 ? 10 : 15);
  return { ...int(n), html: v === 1 ? `Quel nombre positif a pour carré ${n * n} ?` : `Calcule :${big(R(n * n))}`,
    hint: `${R('x')} est le nombre positif qui, multiplié par lui-même, donne x. Exemple : ${R(25)} = 5 car 5 × 5 = 25.` + (v === 2 ? ` Ici, pense à ${R(n * n / 100)} puis × 10.` : ''),
    solution: `${n} × ${n} = ${n * n}, donc ${R(n * n)} = ${n}.` };
}
function C10() {
  return `<h2>10. Racines carrées</h2>
<div class="def">Pour un nombre a ≥ 0, ${R('a')} est le nombre <b>positif</b> dont le carré vaut a.</div>
<div class="ex">${R(49)} = 7 car 7 × 7 = 49 &nbsp;&nbsp; ${R(1)} = 1 &nbsp;&nbsp; ${R(0)} = 0 &nbsp;&nbsp; ${R(3600)} = 60</div>
<div class="def">Carrés à connaître : 1, 4, 9, 16, 25, 36, 49, 64, 81, 100, 121, 144, 169, 196, 225.</div>
<div class="ex">${R(16)} × ${R(9)} = 4 × 3 = 12</div>
<div class="warn">⚠️ ${R(16)} n'est pas 8 (la moitié) : c'est 4, car 4 × 4 = 16.</div>`;
}

/* ---------- 11. racines et carrés de fractions ---------- */
function L11(d) {
  let a, b; do { a = ri(1, d < 2 ? 7 : 10); b = ri(2, d < 2 ? 7 : 10); } while (gcd(a, b) !== 1);
  const v = d < 1 ? ri(0, 1) : ri(0, 2);
  if (v === 0) return { ...frac(a, b), html: `Calcule :${big(R(F(a * a, b * b)))}`,
    hint: `${R(F('a', 'b'))} = ${F(R('a'), R('b'))} : prends la racine du numérateur et celle du dénominateur.`,
    solution: `${R(a * a)} = ${a} et ${R(b * b)} = ${b}, donc ${R(F(a * a, b * b))} = ${F(a, b)}.` };
  if (v === 1) return { ...frac(a * a, b * b), html: `Calcule :${big(`(${F(a, b)})<sup>2</sup>`)}`,
    hint: `Mettre au carré, c'est multiplier par soi-même : ${F(a, b)} × ${F(a, b)}.`,
    solution: `(${F(a, b)})<sup>2</sup> = ${F(`${a} × ${a}`, `${b} × ${b}`)} = ${F(a * a, b * b)}` };
  const c = ri(1, 5), e = ri(2, 6), N = a * c, D = b * e;
  return { ...frac(N, D), html: `Calcule :${big(`${R(F(a * a, b * b))} × ${F(c, e)}`)}`,
    hint: `Commence par la racine : ${R(F(a * a, b * b))} = ? Puis multiplie les fractions (haut × haut, bas × bas).`,
    solution: `${R(F(a * a, b * b))} = ${F(a, b)}, puis ${F(a, b)} × ${F(c, e)} = ${F(N, D)}${simpl(N, D)}` };
}
function C11() {
  return `<h2>11. Racines et carrés de fractions</h2>
<div class="def">(${F('a', 'b')})<sup>2</sup> = ${F('a<sup>2</sup>', 'b<sup>2</sup>')} &nbsp;&nbsp;&nbsp; ${R(F('a', 'b'))} = ${F(R('a'), R('b'))}</div>
<div class="ex">(${F(2, 3)})<sup>2</sup> = ${F(4, 9)} &nbsp;&nbsp; ${R(F(25, 36))} = ${F(5, 6)}</div>
<div class="warn">⚠️ (${F(2, 3)})<sup>2</sup> n'est pas ${F(4, 6)} : on met au carré le haut <b>et</b> le bas.</div>`;
}

/* ---------- 12. défis ---------- */
function L12(d) {
  const v = ri(0, Math.min(4, d + 2));
  if (v === 0) {
    const d1 = pick([2, 3, 4, 5]), k = pick([2, 3]), d2 = d1 * k, a1 = ri(1, d1 - 1), rest = d2 - a1 * k;
    if (rest < 2) return L12(d);
    const a2 = ri(1, rest - 1), N = rest - a2, nm = prenom();
    return { ...frac(N, d2), html: `Pour aller au collège, ${nm} fait ${F(a1, d1)} du trajet à vélo, ${F(a2, d2)} en bus et le reste à pied.<br>Quelle fraction du trajet est faite à pied ?`,
      hint: `Le trajet entier vaut 1 = ${F(d2, d2)}. Additionne ce qui est fait à vélo et en bus (dénominateur ${d2}), puis enlève-le de ${F(d2, d2)}.`,
      solution: `${F(a1, d1)} + ${F(a2, d2)} = ${F(a1 * k, d2)} + ${F(a2, d2)} = ${F(a1 * k + a2, d2)}, puis ${F(d2, d2)} − ${F(a1 * k + a2, d2)} = ${F(N, d2)}${simpl(N, d2)}` };
  }
  if (v === 1) {
    const b = pick([3, 4, 5, 6, 7, 8]), a = ri(1, b - 1), N = b * ri(3, 8), X = N - N / b * a;
    return { ...int(X), html: `Dans un club de ${N} membres, les ${F(a, b)} sont des filles. Combien y a-t-il de garçons ?`,
      hint: `Calcule d'abord le nombre de filles (les ${F(a, b)} de ${N}), puis soustrais de ${N}.`,
      solution: `Filles : ${N} ÷ ${b} × ${a} = ${N / b * a}. Garçons : ${N} − ${N / b * a} = ${X}.` };
  }
  if (v === 2) {
    const a = ri(1, 5), b = ri(2, 6), c = ri(1, 5), e0 = ri(2, 6), e = ri(1, 5), f = pick([2, 3, 4, 6]);
    const P = a * c, Q = b * e0, D = lcm(Q, f), N = P * (D / Q) + e * (D / f);
    return { ...frac(N, D), value: e / f + (a / b) * (c / e0), html: `Calcule (attention aux priorités !) :${big(`${F(e, f)} + ${F(a, b)} × ${F(c, e0)}`)}`,
      hint: `La multiplication est prioritaire : calcule d'abord ${F(a, b)} × ${F(c, e0)}, puis ajoute ${F(e, f)}.`,
      solution: `${F(a, b)} × ${F(c, e0)} = ${F(P, Q)}, puis ${F(e, f)} + ${F(P, Q)} = ${F(e * (D / f), D)} + ${F(P * (D / Q), D)} = ${F(N, D)}${simpl(N, D)}` };
  }
  if (v === 3) {
    const n = ri(2, 9), m = ri(2, 9), a = ri(1, 6), b = ri(2, 7), N = n * a, D = m * b;
    return { ...frac(N, D), html: `Calcule :${big(`${R(F(n * n, m * m))} × ${F(a, b)}`)}`,
      hint: `Commence par la racine, puis multiplie.`,
      solution: `${R(F(n * n, m * m))} = ${F(n, m)}, puis ${F(n, m)} × ${F(a, b)} = ${F(N, D)}${simpl(N, D)}` };
  }
  const [a, b] = pick([[3, 4], [2, 3], [5, 8], [3, 5], [4, 5]]), k = pick([2, 3]), x = ri(1, a), N = a * k - x, D = b * k;
  return { ...frac(N, D), html: `Il reste ${F(a, b)} d'un gâteau. ${prenom()} en mange ${F(x, D)} (du gâteau entier).<br>Quelle fraction du gâteau reste-t-il maintenant ?`,
    hint: `Calcule ${F(a, b)} − ${F(x, D)} : écris d'abord ${F(a, b)} avec le dénominateur ${D}.`,
    solution: `${F(a, b)} − ${F(x, D)} = ${F(a * k, D)} − ${F(x, D)} = ${F(N, D)}${simpl(N, D)}` };
}
function C12() {
  return `<h2>12. Défis</h2>
<p>On mélange tout ce qui précède. Prends le temps de lire l'énoncé et d'écrire les étapes au brouillon.</p>
<div class="def">Ordre des opérations : <b>racines et carrés</b>, puis <b>× et ÷</b>, puis <b>+ et −</b>.</div>
<div class="ex">${F(1, 2)} + ${F(1, 3)} × ${F(3, 4)} = ${F(1, 2)} + ${F(1, 4)} = ${F(2, 4)} + ${F(1, 4)} = ${F(3, 4)}</div>
<div class="ex">« Le reste » : le tout vaut 1. Si ${F(1, 3)} et ${F(1, 6)} sont utilisés, il reste 1 − ${F(1, 3)} − ${F(1, 6)} = ${F(6, 6)} − ${F(2, 6)} − ${F(1, 6)} = ${F(3, 6)} = ${F(1, 2)}.</div>
<div class="warn">⚠️ Une fraction « des filles » se calcule sur le total, pas sur les garçons.</div>`;
}

export const LEVELS = [
  { titre: 'Lire une fraction', generate: L1, cours: C1, classe: '6e' },
  { titre: 'Fractions égales', generate: L2, cours: C2, classe: '6e' },
  { titre: 'Simplifier', generate: L3, cours: C3, classe: '5e' },
  { titre: 'Comparer', generate: L4, cours: C4, classe: '5e' },
  { titre: 'Additionner (même dénominateur)', generate: L5, cours: C5, classe: '5e' },
  { titre: 'Additionner (dénominateurs multiples)', generate: L6, cours: C6, classe: '5e' },
  { titre: "Fraction d'une quantité", generate: L7, cours: C7, classe: '5e' },
  { titre: 'Multiplier des fractions', generate: L8, cours: C8, classe: '4e' },
  { titre: 'Additionner (dénominateurs quelconques)', generate: L9, cours: C9, classe: '4e' },
  { titre: 'Racines carrées', generate: L10, cours: C10, classe: '4e / 3e' },
  { titre: 'Racines et carrés de fractions', generate: L11, cours: C11, classe: '3e' },
  { titre: 'Défis : problèmes et calculs mêlés', generate: L12, cours: C12, classe: '3e' },
];
export const OPTIONS = { need: 4, keys: { neg: false } };

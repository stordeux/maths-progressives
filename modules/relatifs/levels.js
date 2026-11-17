// Nombres relatifs (5e – 4e) : 12 niveaux, de la droite graduée aux calculs enchaînés.
// La réponse attendue est calculée avec les règles du cours (règle d'addition, règle des signes, pas à pas) ;
// le champ `value` la recalcule autrement, en évaluant l'expression affichée (évaluateur ev ci-dessous),
// ou en relisant la figure (niveau 1). Les tests comparent les deux.
import { ri, pick, nz, shuffle, chance, prenom } from '../../engine/util/rand.js';
import { r6, approx } from '../../engine/util/arith.js';
import { M, P, F } from '../../engine/util/fmt.js';
import { numsCheck, choiceCheck } from '../../engine/answers/checks.js';
import { intLine } from '../../engine/draw/numberLine.js';
import { thermo, signRule, signChain } from './draw.js';

/* ================= outils ================= */
const big = s => `<div class="big">${s}</div>`;
const slot = '<span class="slot">?</span>';
const z = x => (x === 0 ? 0 : r6(x)); // pas de −0
/** écriture avec signe entre parenthèses : (+5), (−3) */
const S = n => (n === 0 ? '0' : r6(n) < 0 ? `(${M(n)})` : `(+${M(n)})`);
/** « + 5 » ou « − 3 » (opération lue sur la droite) */
const sgd = n => (r6(n) < 0 ? '− ' + M(-n) : '+ ' + M(n));
const sg = n => (n < 0 ? -1 : 1);
const dz = Math.abs; // distance à zéro
const isDec = (...xs) => xs.some(x => !Number.isInteger(r6(x)));
/** entier non nul de distance à zéro au moins 2 (pas de facteur 1 ou −1, qui rendrait le calcul trivial) */
const nz2 = (lo, hi) => { let v; do { v = ri(lo, hi); } while (v > -2 && v < 2); return v; };
const dec1 = (lo, hi) => { let x; do { x = r6(ri(lo * 10, hi * 10) / 10); } while (x === 0 || Number.isInteger(x)); return x; };

/** règle d'addition du cours (signes, distances à zéro) */
function addRule(a, b) {
  if (a === 0) return z(b);
  if (b === 0) return z(a);
  if (sg(a) === sg(b)) return z(sg(a) * (dz(a) + dz(b)));
  const [g, p] = dz(a) >= dz(b) ? [a, b] : [b, a];
  return z(sg(g) * (dz(g) - dz(p)));
}
/** règle des signes du cours */
const mulRule = (a, b) => z(sg(a) * sg(b) * dz(a) * dz(b));

/**
 * Évaluateur indépendant d'une expression affichée (texte brut) :
 * nombres à virgule, −, +, ×, ÷, parenthèses, signe unaire. lr = true : calcul de gauche à droite
 * sans priorités (pour reconnaître l'erreur classique).
 */
export function ev(txt, lr = false) {
  const s = String(txt).replace(/<[^>]+>/g, '').replace(/&nbsp;/g, '').replace(/−/g, '-').replace(/,/g, '.').replace(/\s+/g, '');
  let i = 0;
  const expr = () => {
    let v = term();
    while (s[i] === '+' || s[i] === '-' || (lr && (s[i] === '×' || s[i] === '÷'))) {
      const o = s[i++], t = term();
      v = o === '+' ? v + t : o === '-' ? v - t : o === '×' ? v * t : v / t;
    }
    return v;
  };
  const term = () => {
    let v = unary();
    while (!lr && (s[i] === '×' || s[i] === '÷')) { const o = s[i++], t = unary(); v = o === '×' ? v * t : v / t; }
    return v;
  };
  const unary = () => (s[i] === '-' ? (i++, -unary()) : s[i] === '+' ? (i++, unary()) : atom());
  const atom = () => {
    if (s[i] === '(') { i++; const v = expr(); if (s[i++] !== ')') throw new Error('ev : parenthèse ' + s); return v; }
    const m = /^\d+(\.\d+)?/.exec(s.slice(i));
    if (!m) throw new Error('ev : ' + s);
    i += m[0].length; return +m[0];
  };
  const v = expr();
  if (i !== s.length) throw new Error('ev : reste ' + s.slice(i));
  return v;
}

/** check numérique avec message « presque juste » : bon nombre, mauvais signe */
function relCheck(E, more) {
  return numsCheck(E, {
    msg: v => {
      const m = more ? more(v) : '';
      if (m) return m;
      if (E.some((e, i) => e !== 0 && v[i] !== null && approx(v[i], -e))) return 'Presque ! La distance à zéro est bonne, mais <b>le signe</b> est faux.';
      return '';
    },
  });
}
/** exercice numérique : E = réponses des cases, value = dernière case recalculée autrement */
const numQ = (E, value, o = {}) => ({ type: 'nums', tpl: o.tpl || 'Réponse : {0}', check: relCheck(E, o.more), expected: E, value, keys: isDec(...E) ? { comma: true } : undefined });

/** droite graduée qui contient 0 et les valeurs données */
function line(vals, extra = {}) {
  let lo = Math.floor(Math.min(0, ...vals)) - 1, hi = Math.ceil(Math.max(0, ...vals)) + 1;
  while (hi - lo < 10) { lo--; if (hi - lo < 10) hi++; }
  return intLine({ min: lo, max: hi, ...extra });
}
/** relit les abscisses des points d'une droite intLine (lecture de la figure, arrondie à la graduation) */
function readMarks(svg, min, max) {
  const sx = (480 - 44) / (max - min);
  return [...svg.matchAll(/<circle cx="([\d.]+)"/g)].map(m => Math.round(min + (+m[1] - 22) / sx));
}
/** droite en pleine largeur (dans le cours, sinon elle est rendue trop petite) */
const wide = svg => svg.replace('class="vis"', 'class="vis" style="width:100%;max-width:640px"');
/** flèches successives 0 → t0 → t0 + t1 → … */
function chain(ts, cols = ['#1971c2', '#e8590c', '#2b8a3e', '#9c36b5', '#c2255c', '#0b7285']) {
  let cur = 0; const arrows = [], pts = [0];
  ts.forEach((t, k) => { arrows.push({ from: cur, to: z(cur + t), l: k ? sgd(t) : M(t), c: cols[k % cols.length] }); cur = z(cur + t); pts.push(cur); });
  return line(pts, { arrows, marks: [{ x: cur, c: '#e03131' }] });
}

/* ================= 1. repérer sur une droite graduée ================= */
function L1(d) {
  const R = d < 1 ? 5 : d < 3 ? 10 : 20, n = d < 2 ? 1 : 2;
  const xs = [];
  while (xs.length < n) {
    const x = nz(-R + 1, R - 1);
    if (xs.every(y => Math.abs(y - x) >= 2)) xs.push(x);
  }
  if (xs.every(x => x > 0)) xs[0] = -xs[0];
  if (n === 2 && Math.abs(xs[0] - xs[1]) < 2) xs[1] = xs[0] < 0 ? xs[0] - 3 : xs[0] + 3;
  const names = ['A', 'B'], cols = ['#e03131', '#1971c2'];
  const vis = intLine({ min: -R, max: R, marks: xs.map((x, i) => ({ x, l: names[i], c: cols[i] })) });
  const lu = readMarks(vis, -R, R);
  const sol = xs.map((x, i) => `${names[i]} est à ${x === 1 || x === -1 ? '1 graduation' : dz(x) + ' graduations'} à ${x < 0 ? 'gauche' : 'droite'} de 0 : son abscisse est <b>${M(x)}</b>.`).join('<br>');
  return { ...numQ(xs, lu[n - 1], { tpl: n === 1 ? 'A a pour abscisse {0}' : 'A : {0} <span class="sep">B :</span> {1}' }),
    html: n === 1 ? `Quelle est l'abscisse du point A ?` : `Quelles sont les abscisses des points A et B ?`, visual: vis,
    hint: `Pars de 0. Compte les graduations jusqu'au point : à droite de 0, l'abscisse est positive ; à gauche, elle est <b>négative</b> (signe −).${R > 10 ? ' Ici, les nombres ne sont écrits que de 5 en 5 : compte à partir du nombre écrit le plus proche.' : ''}`,
    solution: sol };
}
function C1() {
  return `<h2>1. Repérer sur une droite graduée</h2>
<p class="intro">Les nombres relatifs permettent d'aller « en dessous de zéro » : températures négatives, étages de parking, altitudes sous la mer. On les place sur une droite graduée.</p>
<div class="def">Sur une droite graduée, chaque point a une <b>abscisse</b>. À droite de 0, les nombres sont <b>positifs</b> ; à gauche de 0, ils sont <b>négatifs</b> et s'écrivent avec le signe −. Ce sont les <b>nombres relatifs</b>.</div>
<div class="methode"><b>Méthode</b><ol><li>Repère le 0 (le trait plus épais).</li><li>Regarde de combien en combien la droite est graduée (de 1 en 1 ? les nombres écrits de 5 en 5 ?).</li><li>Compte les graduations entre 0 et le point.</li><li>À gauche de 0, mets le signe −.</li></ol></div>
${wide(intLine({ min: -6, max: 6, marks: [{ x: -4, l: 'A' }, { x: 3, l: 'B', c: '#1971c2' }] }))}
<div class="ex"><span class="q">Exemple 1 : les points A et B</span><br>A est à 4 graduations à <b>gauche</b> de 0 : A a pour abscisse <b>−4</b>.<br>B est à 3 graduations à droite : B a pour abscisse <b>3</b> (on peut écrire +3).</div>
<div class="ex"><span class="q">Exemple 2 : une droite de −20 à 20</span><br>Les nombres ne sont écrits que de 5 en 5. Un point situé 2 graduations à gauche de −10 a pour abscisse <b>−12</b> : on compte à partir du nombre écrit le plus proche.</div>
<div class="warn">⚠️ À gauche de 0, on écrit −1, −2, −3… : on s'éloigne de 0, mais le nombre porte le signe&nbsp;−.<br>⚠️ 0 est le seul nombre à la fois positif et négatif : on l'écrit sans signe.</div>
<div class="retenir">À retenir : à droite de 0, positif ; à gauche de 0, négatif.</div>`;
}

/* ================= 2. comparer ================= */
function L2(d) {
  const v = d < 1 ? 0 : d < 2 ? 1 : d < 3 ? ri(0, 2) : ri(1, 3);
  let a, b;
  if (v === 0) { a = nz(-9, 9); b = a > 0 ? -ri(1, 9) : chance(.25) ? 0 : ri(1, 9); }
  else if (v === 1) { a = -ri(1, 12); do { b = -ri(1, 12); } while (b === a); }
  else if (v === 2) { a = nz(-20, 20); b = chance(.12) ? a : nz(-20, 20); }
  else { const base = -ri(1, 9); a = r6(base - ri(0, 9) / 10); do { b = r6(base - ri(0, 9) / 10); } while (b === a && chance(.8)); }
  if (chance(.5)) [a, b] = [b, a];
  // règle du cours
  const s = x => (x > 0 ? 1 : x < 0 ? -1 : 0);
  let X;
  if (a === b) X = '=';
  else if (s(a) !== s(b)) X = s(a) > s(b) ? '>' : '<';
  else if (s(a) > 0) X = dz(a) > dz(b) ? '>' : '<';
  else X = dz(a) > dz(b) ? '<' : '>';
  const H = { '<': '&lt;', '>': '&gt;', '=': '=' };
  const bothNeg = a < 0 && b < 0;
  const far = Math.abs(a - b) >= 1.5;
  return { type: 'cmp', check: choiceCheck(X, { msg: c => (bothNeg && c !== '=' ? 'Attention : entre deux nombres <b>négatifs</b>, le plus grand est le plus <b>proche de zéro</b>.' : '') }),
    value: ev(M(a)) - ev(M(b)),
    html: `Compare ces deux nombres :${big(`${M(a)} ${slot} ${M(b)}`)}`,
    hint: bothNeg ? 'Les deux nombres sont négatifs : sur la droite graduée, le plus grand est celui qui est le plus à <b>droite</b>, donc le plus proche de 0.' : 'Imagine la droite graduée : le plus grand nombre est celui qui est le plus à <b>droite</b>. Un nombre positif est toujours plus grand qu\'un nombre négatif.',
    solution: (a === b ? 'Les deux nombres sont égaux.' : bothNeg ? `Les deux sont négatifs : ${M(dz(a) < dz(b) ? a : b)} est plus proche de 0, c'est le plus grand.` : s(a) !== s(b) ? (() => { const g = s(a) > s(b) ? a : b, l = g === a ? b : a; return `${M(g)} est ${g === 0 ? 'nul' : 'positif'} et ${M(l)} est ${l === 0 ? 'nul' : 'négatif'} : ${M(g)} est le plus grand.`; })() : `Les deux sont positifs : on compare les distances à zéro.`) + ` Donc ${M(a)} ${H[X]} ${M(b)}.`,
    afterVisual: line([a, b], { marks: [{ x: a, l: far ? M(a) : '', c: '#e03131' }, { x: b, l: far ? M(b) : '', c: '#1971c2' }] }) };
}
function C2() {
  return `<h2>2. Comparer des nombres relatifs</h2>
<p class="intro">Comparer des relatifs, c'est savoir s'il fait plus froid à −6 °C ou à −2 °C, ou quel compte en banque est le moins à découvert.</p>
<div class="def">Sur la droite graduée, le plus grand de deux nombres est celui qui est le plus à <b>droite</b>.<br>• Un nombre positif est plus grand qu'un nombre négatif.<br>• Entre deux nombres <b>négatifs</b>, le plus grand est celui qui est le plus <b>proche de zéro</b>.</div>
<div class="methode"><b>Méthode</b><ol><li>Les signes sont différents ? Le positif est le plus grand.</li><li>Les deux sont positifs ? Le plus grand est le plus loin de 0.</li><li>Les deux sont négatifs ? Le plus grand est le plus <b>proche</b> de 0.</li><li>Écris &lt; ou &gt; : la pointe est tournée vers le plus petit (= si les deux nombres sont égaux).</li></ol></div>
${wide(intLine({ min: -8, max: 4, marks: [{ x: -6, l: '−6' }, { x: -2, l: '−2', c: '#1971c2' }, { x: 3, l: '3', c: '#2b8a3e' }] }))}
<div class="ex"><span class="q">Exemple 1 : −6 et −2, puis −2 et 3</span><br>−2 est plus à droite que −6 : −6 &lt; −2. Et un négatif est plus petit qu'un positif : −2 &lt; 3.</div>
<div class="ex"><span class="q">Exemple 2 : −3,5 et −3,2</span><br>Les deux sont négatifs ; −3,2 est plus proche de 0, donc −3,5 &lt; −3,2.</div>
<div class="warn">⚠️ −6 n'est pas plus grand que −2 ! Il fait plus froid à −6 °C qu'à −2 °C.<br>⚠️ Ne compare pas seulement les chiffres : 6 &gt; 2, mais −6 &lt; −2.</div>
<div class="retenir">À retenir : le plus grand est le plus à droite sur la droite graduée.</div>`;
}

/* ================= 3. opposé et distance à zéro ================= */
function L3(d) {
  const v = d < 1 ? 0 : d < 3 ? ri(0, 1) : ri(0, 2);
  const dec = d >= 4 && v < 2 && chance(.4);
  if (v < 2) {
    const x = dec ? dec1(-9, 9) : nz(-15, 15);
    const k = { comma: dec };
    if (v === 0) {
      return { ...numQ([z(-x)], ev(`-(${M(x)})`), { tpl: `L'opposé de ${M(x)} est {0}`, more: w => (approx(w[0], x) ? "C'est le même nombre ! L'opposé a le <b>signe contraire</b>." : '') }), keys: k,
        html: `Quel est l'<b>opposé</b> de ${M(x)} ?`, visual: line([x, -x], { marks: [{ x, l: M(x) }] }),
        hint: `Deux nombres opposés sont à la même distance de 0, de part et d'autre de 0 : on garde la distance à zéro et on change le signe.`,
        solution: `${M(x)} est à ${M(dz(x))} de 0, ${x < 0 ? 'à gauche' : 'à droite'}. Son opposé est à la même distance, ${x < 0 ? 'à droite' : 'à gauche'} : <b>${M(-x)}</b>.`,
        afterVisual: line([x, -x], { arrows: [{ from: 0, to: x, l: M(dz(x)), c: '#1971c2' }, { from: 0, to: -x, l: M(dz(x)), c: '#e8590c' }], marks: [{ x, c: '#1971c2' }, { x: -x, c: '#e8590c' }] }), replaceVisual: true };
    }
    return { ...numQ([dz(x)], Math.sqrt(ev(`${P(x)} × ${P(x)}`)), { tpl: `La distance à zéro de ${M(x)} est {0}`, more: w => (w[0] < 0 ? 'Une distance est toujours <b>positive</b> !' : '') }), keys: k,
      html: `Quelle est la <b>distance à zéro</b> de ${M(x)} ?`, visual: line([x], { marks: [{ x, l: M(x) }] }),
      hint: `La distance à zéro, c'est le nombre de graduations entre le point et 0. C'est le nombre <b>sans son signe</b>.`,
      solution: `${M(x)} est à ${M(dz(x))} unités de 0 : sa distance à zéro est <b>${M(dz(x))}</b>.`,
      afterVisual: line([x], { arrows: [{ from: 0, to: x, l: M(dz(x)), c: '#e8590c' }], marks: [{ x }] }), replaceVisual: true };
  }
  const k = ri(1, 15), E = [-k, k];
  const check = numsCheck(E);
  return { type: 'nums', tpl: '{0} <span class="sep">et</span> {1}', expected: E,
    check: Object.assign(w => {
      const u = [...w].sort((p, q) => p - q);
      if (approx(u[0], -k) && approx(u[1], k)) return { ok: true };
      const good = [0, 1].filter(i => approx(dz(w[i]), k));
      if (good.length === 2) return { ok: false, msg: 'Il faut deux nombres <b>différents</b> : un de chaque côté de 0.' };
      if (good.length === 1) return { ok: false, bad: [1 - good[0]], msg: 'Un des deux est juste. Il en manque un : un nombre de chaque côté de 0.' };
      return { ok: false, bad: [0, 1] };
    }, { expected: check.expected }),
    verify: e => e.length === 2 && e[0] !== e[1] && e.every(x => Math.abs(x) === k),
    html: `Quels sont les deux nombres dont la distance à zéro est ${k} ?`,
    hint: `Sur la droite graduée, il y a un point à ${k} graduations à droite de 0, et un autre à ${k} graduations à gauche.`,
    solution: `Les deux nombres sont <b>${M(-k)}</b> et <b>${M(k)}</b> : ce sont deux nombres opposés.`,
    afterVisual: line([-k, k], { arrows: [{ from: 0, to: -k, l: String(k), c: '#1971c2' }, { from: 0, to: k, l: String(k), c: '#e8590c' }], marks: [{ x: -k, c: '#1971c2' }, { x: k, c: '#e8590c' }] }) };
}
function C3() {
  return `<h2>3. Opposé et distance à zéro</h2>
<p class="intro">Deux nombres opposés sont comme le reflet l'un de l'autre dans un miroir placé en 0.</p>
<div class="def">La <b>distance à zéro</b> d'un nombre est la distance entre son point et 0 sur la droite graduée : c'est le nombre <b>sans son signe</b>.<br>Deux nombres sont <b>opposés</b> quand ils ont la même distance à zéro et des signes contraires.</div>
<div class="methode"><b>Méthode</b><ol><li>Distance à zéro : enlève le signe (elle est toujours positive).</li><li>Opposé : garde la distance à zéro et <b>change le signe</b>.</li><li>Les deux nombres à une distance k de 0 : k et −k.</li></ol></div>
${wide(intLine({ min: -6, max: 6, arrows: [{ from: 0, to: -4, l: '4', c: '#1971c2' }, { from: 0, to: 4, l: '4', c: '#e8590c' }], marks: [{ x: -4, c: '#1971c2' }, { x: 4, c: '#e8590c' }] }))}
<div class="ex"><span class="q">Exemple 1 : −4 et 4</span><br>Tous deux sont à 4 de 0 : ils sont opposés. La distance à zéro de −4 est <b>4</b>.</div>
<div class="ex"><span class="q">Exemple 2 : opposés et cas particuliers</span><br>L'opposé de 7 est −7 ; l'opposé de −2,5 est 2,5 ; l'opposé de 0 est 0.<br>Les deux nombres dont la distance à zéro est 9 : <b>−9 et 9</b>.</div>
<div class="warn">⚠️ Une distance n'est jamais négative : la distance à zéro de −9 est 9, pas −9.<br>⚠️ L'opposé n'est pas le même nombre : l'opposé de −3 est 3.</div>
<div class="retenir">À retenir : opposé = même distance à zéro, signe contraire.</div>`;
}

/* ================= 4. le thermomètre (ajouter ou enlever des degrés) ================= */
function L4(d) {
  const n = d >= 3 ? 2 : 1;
  let t, ch, E;
  for (;;) {
    t = d < 1 ? -ri(1, 6) : ri(-12, 10);
    ch = Array.from({ length: n }, () => ({ up: d < 1 ? true : chance(.5), m: ri(1, d < 2 ? 8 : 15) }));
    // pas à pas, degré par degré, comme on lit le thermomètre
    E = t; for (const c of ch) for (let k = 0; k < c.m; k++) E += c.up ? 1 : -1;
    if (E < -20 || E > 20) continue;
    if (d >= 2 && sg(t) === sg(E) && chance(.7)) continue; // on passe souvent par zéro
    break;
  }
  const expr = M(t) + ch.map(c => (c.up ? ' + ' : ' − ') + c.m).join('');
  const verbe = c => `${c.up ? 'monte' : 'baisse'} de ${c.m} °C`;
  const story = n === 1 ? `La température ${verbe(ch[0])}.` : `Elle ${verbe(ch[0])}, puis elle ${verbe(ch[1])}.`;
  const wrongDir = n === 1 ? t - (ch[0].up ? ch[0].m : -ch[0].m) : null;
  return { ...numQ([E], ev(expr), { tpl: '{0} °C', more: w => (wrongDir !== null && approx(w[0], wrongDir) && wrongDir !== E ? 'Tu es parti dans le mauvais sens : quand la température <b>monte</b>, on va vers le haut du thermomètre ; quand elle <b>baisse</b>, vers le bas.' : '') }),
    html: `Le matin, il fait <b>${M(t)} °C</b>. ${story}<br>Quelle température fait-il ${n === 1 ? 'ensuite' : 'à la fin'} ?`,
    visual: thermo({ t }),
    hint: `Sur le thermomètre, pars de ${M(t)}. Monter de 1 °C, c'est aller à la graduation au-dessus ; baisser, à celle du dessous. N'oublie pas de passer par 0.`,
    solution: `On part de ${M(t)} °C. ` + (n === 1 ? `${ch[0].up ? 'On monte' : 'On descend'} de ${ch[0].m} graduation${ch[0].m > 1 ? 's' : ''} : ${expr} = <b>${M(E)}</b> °C.` : (() => { const m1 = t + (ch[0].up ? ch[0].m : -ch[0].m); return `${ch[0].up ? 'On monte' : 'On descend'} de ${ch[0].m} : ${M(t)} ${ch[0].up ? '+' : '−'} ${ch[0].m} = ${M(m1)} ; puis ${ch[1].up ? 'on monte' : 'on descend'} de ${ch[1].m} : ${M(m1)} ${ch[1].up ? '+' : '−'} ${ch[1].m} = <b>${M(E)}</b> °C.`; })()),
    afterVisual: thermo({ t, to: E, label: n === 1 ? (ch[0].up ? '+ ' : '− ') + ch[0].m : '' }), replaceVisual: true };
}
function C4() {
  return `<h2>4. Le thermomètre</h2>
<p class="intro">Le thermomètre est une droite graduée verticale : on y voit très bien ce qui se passe quand on passe sous zéro.</p>
<div class="def">Sur un thermomètre, les températures sous 0 °C sont <b>négatives</b>. Quand la température <b>monte</b>, on avance vers le haut (vers les nombres plus grands) ; quand elle <b>baisse</b>, on descend.</div>
<div class="cols"><div class="methode"><b>Méthode</b><ol><li>Place-toi à la température de départ.</li><li>Monte ou descends d'autant de graduations que l'énoncé l'indique.</li><li>Si tu passes 0, fais-le en deux temps : d'abord jusqu'à 0, puis le reste.</li><li>Deux changements ? Fais-les l'un après l'autre.</li></ol></div>
${thermo({ t: -3, to: 2, label: '+ 5' })}</div>
<div class="ex"><span class="q">Exemple 1 : il fait −3 °C, la température monte de 5 °C</span><br>De −3 à 0 : on monte de 3 ; il reste 2 au-dessus de 0. Il fait <b>2 °C</b>.</div>
<div class="ex"><span class="q">Exemple 2 : il fait 4 °C, elle baisse de 6 °C, puis monte de 1 °C</span><br>De 4 à 0 : 4 degrés, puis encore 2 en dessous : −2 °C. Ensuite −2 + 1 = <b>−1 °C</b>.</div>
<div class="warn">⚠️ Monter de 5 depuis −3 ne donne pas −8 ! Monter, c'est aller vers les nombres plus grands.<br>⚠️ Ne saute pas le 0 : compte bien les degrés de chaque côté.</div>
<div class="retenir">À retenir : monter, c'est ajouter ; baisser, c'est enlever.</div>`;
}

/* ================= 5. additionner deux relatifs ================= */
function L5(d) {
  const dec = d >= 4 && chance(.35);
  const R = d < 2 ? 9 : 20;
  const word = d >= 3 && !dec && chance(.35);
  const same = d < 1 ? true : chance(.3);
  let a, b;
  do {
    a = dec ? dec1(-R, R) : nz(-R, R);
    b = dec ? dec1(-R, R) : nz(-R, R);
    if (same) { if (sg(a) !== sg(b)) b = -b; if (d < 1 && a > 0) { a = -a; b = -b; } }
    else if (sg(a) === sg(b)) b = -b;
  } while ((word && a < 0 && b < 0) || a === -b); // pas deux opposés : la somme 0 serait immédiate
  const E = addRule(a, b);
  const txt = d < 2 ? `${S(a)} + ${S(b)}` : `${M(a)} + ${P(b)}`;
  const more = w => {
    if (sg(a) === sg(b) && approx(w[0], sg(a) * Math.abs(dz(a) - dz(b)))) return 'Les deux nombres ont le <b>même signe</b> : on <b>additionne</b> les distances à zéro.';
    if (sg(a) !== sg(b) && approx(dz(w[0]), dz(a) + dz(b))) return 'Les signes sont <b>contraires</b> : on fait la <b>différence</b> des distances à zéro.';
    return '';
  };
  const expl = sg(a) === sg(b)
    ? `Même signe (${a < 0 ? '−' : '+'}) : on additionne les distances à zéro, ${M(dz(a))} + ${M(dz(b))} = ${M(dz(a) + dz(b))}, et on garde le signe.`
    : `Signes contraires : on soustrait les distances à zéro, ${M(Math.max(dz(a), dz(b)))} − ${M(Math.min(dz(a), dz(b)))} = ${M(dz(E))}, et on prend le signe du nombre le plus éloigné de 0 (${M(dz(a) >= dz(b) ? a : b)}).`;
  const vis = chain([a, b]);
  if (word) {
    const nm = prenom(), g = x => (x > 0 ? `gagne ${x} points` : `perd ${-x} points`);
    return { ...numQ([E], ev(txt), { tpl: 'Bilan : {0} points', more }),
      html: `Au jeu, ${nm} ${g(a)}, puis ${g(b)}.<br>Quel est son bilan ? (un gain est positif, une perte est négative)`,
      hint: `Écris le calcul avec des relatifs : ${S(a)} + ${S(b)}. ${sg(a) === sg(b) ? 'Même signe : on additionne les distances à zéro.' : 'Signes contraires : on fait la différence des distances à zéro.'}`,
      solution: `${S(a)} + ${S(b)} = <b>${M(E)}</b>. ${expl}`, afterVisual: vis };
  }
  return { ...numQ([E], ev(txt), { more }),
    html: `Calcule :${big(txt)}`,
    hint: sg(a) === sg(b) ? `Les deux nombres ont le même signe : additionne leurs distances à zéro et garde ce signe.` : `Les signes sont contraires : fais la différence des distances à zéro, et prends le signe du nombre le plus éloigné de 0.`,
    solution: `${txt} = <b>${M(E)}</b>. ${expl}`, afterVisual: vis };
}
function C5() {
  return `<h2>5. Additionner deux nombres relatifs</h2>
<p class="intro">Additionner des relatifs, c'est faire le bilan de gains et de pertes, ou enchaîner deux déplacements sur la droite graduée.</p>
<div class="def">• <b>Même signe</b> : on additionne les distances à zéro et on garde le signe.<br>• <b>Signes contraires</b> : on soustrait les distances à zéro (la plus grande moins la plus petite) et on prend le signe du nombre le plus éloigné de zéro.</div>
<div class="methode"><b>Méthode</b><ol><li>Regarde les signes des deux nombres.</li><li>Même signe : additionne les distances à zéro.</li><li>Signes contraires : fais la différence des distances à zéro.</li><li>Mets le signe (le commun, ou celui du plus éloigné de 0).</li></ol></div>
${wide(chain([-3, 5]))}
<div class="ex"><span class="q">Exemple 1 : (−3) + (+5)</span><br>Signes contraires : 5 − 3 = 2, et 5 est le plus loin de 0 : (−3) + (+5) = <b>2</b>. Sur la droite : 3 pas à gauche, puis 5 pas à droite.</div>
<div class="ex"><span class="q">Exemple 2 : (−4) + (−7) et (−2,5) + 1,5</span><br>Même signe : 4 + 7 = 11, on garde − : <b>−11</b>.<br>Signes contraires : 2,5 − 1,5 = 1, signe de −2,5 : <b>−1</b>.</div>
<div class="ex"><span class="q">Exemple 3 : gagner 6 points puis perdre 10 points</span><br>(+6) + (−10) = <b>−4</b> : le bilan est une perte de 4 points.</div>
<div class="warn">⚠️ (−4) + (−7) n'est pas 11 : deux pertes font une perte plus grande.<br>⚠️ (−3) + (+5) n'est pas −8 : avec des signes contraires, on fait une <b>différence</b>.</div>
<div class="retenir">À retenir : même signe → j'additionne ; signes contraires → je soustrais.</div>`;
}

/* ================= 6. soustraire, c'est ajouter l'opposé ================= */
function L6(d) {
  const R = d < 2 ? 10 : 20, dec = d >= 5 && chance(.3);
  const a = dec ? dec1(-R, R) : nz(-R, R);
  let b; do { b = dec ? dec1(-R, R) : nz(-R, R); } while (b === a); // pas « 7 − 7 »
  const E = addRule(a, -b);
  const more = w => (approx(w[0], b) && w.length === 2 ? `Pour soustraire ${S(b)}, on ajoute son <b>opposé</b> : change le signe !` : approx(w[w.length - 1], addRule(a, b)) && addRule(a, b) !== E ? 'Tu as <b>ajouté</b> le deuxième nombre. Soustraire, c\'est ajouter son <b>opposé</b>.' : '');
  const vis = line([a, E], { arrows: [{ from: 0, to: a, l: M(a), c: '#1971c2' }, { from: a, to: E, l: sgd(-b), c: '#e8590c' }], marks: [{ x: E }] });
  if (d >= 4 && !dec && chance(.35)) {
    const t1 = ri(-12, 6); let t2; do { t2 = ri(-15, 15); } while (t2 === t1);
    const txt = `${M(t2)} − ${P(t1)}`, V = addRule(t2, -t1);
    return { ...numQ([V], ev(txt), { tpl: 'Variation : {0} °C', more }),
      html: `À 8 h, il fait <b>${M(t1)} °C</b> ; à 14 h, il fait <b>${M(t2)} °C</b>.<br>Calcule la variation de température : température d'arrivée − température de départ.`,
      hint: `Calcule ${txt}. Soustraire ${P(t1)}, c'est ajouter son opposé ${P(-t1)}.`,
      solution: `${txt} = ${M(t2)} + ${P(-t1)} = <b>${M(V)}</b> °C : la température a ${V > 0 ? 'monté' : 'baissé'} de ${dz(V)} °C.`,
      afterVisual: thermo({ t: t1, to: t2, label: V > 0 ? '+ ' + V : '− ' + (-V) }), replaceVisual: true, visual: thermo({ t: t1 }) };
  }
  if (d < 3) {
    return { ...numQ([z(-b), E], ev(`${S(a)} − ${S(b)}`), { tpl: `${S(a)} + ( {0} ) = {1}`, more }),
      html: `Calcule en ajoutant l'opposé :${big(`${S(a)} − ${S(b)}`)}`,
      hint: `Soustraire un nombre, c'est <b>ajouter son opposé</b>. Quel est l'opposé de ${M(b)} ? Puis fais l'addition comme au niveau précédent.`,
      solution: `L'opposé de ${M(b)} est ${M(-b)}, donc ${S(a)} − ${S(b)} = ${S(a)} + ${S(-b)} = <b>${M(E)}</b>.`, afterVisual: vis };
  }
  const txt = `${M(a)} − ${P(b)}`;
  return { ...numQ([E], ev(txt), { more }),
    html: `Calcule :${big(txt)}`,
    hint: `Transforme la soustraction : ${M(a)} − ${P(b)} = ${M(a)} + ${P(-b)}. Puis applique la règle d'addition.`,
    solution: `${txt} = ${M(a)} + ${P(-b)} = <b>${M(E)}</b>.`, afterVisual: vis };
}
function C6() {
  return `<h2>6. Soustraire, c'est ajouter l'opposé</h2>
<p class="intro">On ne retient pas une nouvelle règle pour la soustraction : on la transforme en addition, que l'on sait déjà faire.</p>
<div class="def">Pour <b>soustraire</b> un nombre relatif, on <b>ajoute son opposé</b> : a − b = a + (opposé de b).</div>
<div class="methode"><b>Méthode</b><ol><li>Garde le premier nombre tel quel.</li><li>Change le − en + et remplace le deuxième nombre par son <b>opposé</b>.</li><li>Fais l'addition avec la règle du niveau 5.</li><li>Variation de température : arrivée − départ.</li></ol></div>
${wide(chain([2, -5]))}
<div class="ex"><span class="q">Exemple 1 : (+2) − (+5)</span><br>(+2) + (−5) = <b>−3</b> : sur la droite, 2 pas à droite puis 5 pas à gauche.</div>
<div class="ex"><span class="q">Exemple 2 : (−4) − (−6)</span><br>(−4) + (+6) = <b>2</b> : enlever une dette de 6, c'est comme gagner 6.</div>
<div class="ex"><span class="q">Exemple 3 : à 8 h il fait −3 °C, à 14 h il fait 5 °C</span><br>Variation : 5 − (−3) = 5 + 3 = <b>8 °C</b> (la température a monté de 8 °C).</div>
<div class="warn">⚠️ On ne change que le signe du nombre <b>soustrait</b> (le deuxième), jamais celui du premier.<br>⚠️ (−4) − (−6) n'est pas −10 : − (−6) devient + 6.</div>
<div class="retenir">À retenir : soustraire un nombre, c'est ajouter son opposé.</div>`;
}

/* ================= 7. sommes algébriques ================= */
function L7(d) {
  const nT = d < 1 ? 3 : d < 2 ? 4 : d < 4 ? ri(4, 5) : ri(5, 6), R = d < 3 ? 9 : 15;
  const paren = d >= 2 && chance(.5);
  let eff;
  // deux termes voisins opposés (« 4 + 5 − 5 ») s'annuleraient sans calcul
  do { eff = Array.from({ length: nT }, () => nz(-R, R)); } while (!eff.some(x => x > 0) || !eff.some(x => x < 0) || eff.some((x, i) => i && x === -eff[i - 1]));
  // écriture simplifiée
  const simp = M(eff[0]) + eff.slice(1).map(x => (x < 0 ? ' − ' : ' + ') + dz(x)).join('');
  let txt = simp;
  if (paren) {
    txt = S(eff[0]) + eff.slice(1).map(x => { const minus = chance(.5); return minus ? ` − ${S(-x)}` : ` + ${S(x)}`; }).join('');
  }
  let sp = 0, sn = 0;
  for (const x of eff) { if (x > 0) sp += x; else sn += x; }
  const E = addRule(sp, sn);
  const pos = eff.filter(x => x > 0), neg = eff.filter(x => x < 0);
  const sol = (paren ? `On simplifie l'écriture : ${txt} = ${simp}.<br>` : '') +
    `Positifs : ${pos.length > 1 ? pos.join(' + ') + ' = ' : ''}${sp}. Négatifs : ${neg.length > 1 ? neg.map((x, i) => (i ? '− ' + dz(x) : M(x))).join(' ') + ' = ' : ''}${M(sn)}.<br>Total : ${sp} − ${dz(sn)} = <b>${M(E)}</b>.`;
  return { ...numQ([E], ev(txt), { more: w => (approx(w[0], eff.reduce((s, x) => s + dz(x), 0)) ? 'Attention aux signes « − » : certains termes sont négatifs.' : '') }),
    html: `Calcule :${big(txt)}`,
    hint: (paren ? 'Commence par simplifier l\'écriture : + (−3) devient − 3, et − (−3) devient + 3. ' : '') + 'Puis regroupe les termes positifs d\'un côté, les termes négatifs de l\'autre.',
    solution: sol, afterVisual: nT <= 4 ? chain(eff) : '' };
}
function C7() {
  return `<h2>7. Sommes de plusieurs relatifs</h2>
<p class="intro">Avec beaucoup de termes, on s'organise : on regroupe tout ce qui est positif et tout ce qui est négatif.</p>
<div class="def">Dans une <b>écriture simplifiée</b>, on supprime les parenthèses et les signes + inutiles :<br>+ (+3) → + 3 &nbsp; ; &nbsp; + (−3) → − 3 &nbsp; ; &nbsp; − (+3) → − 3 &nbsp; ; &nbsp; − (−3) → + 3.</div>
<div class="methode"><b>Méthode</b><ol><li>S'il y a des parenthèses, simplifie l'écriture.</li><li>Chaque nombre garde le signe écrit <b>devant</b> lui.</li><li>Additionne les termes positifs, puis les termes négatifs.</li><li>Termine par une seule addition de deux relatifs.</li></ol></div>
${wide(chain([-3, 7, -5, 2]))}
<div class="ex"><span class="q">Exemple 1 : −3 + 7 − 5 + 2</span><br>Positifs : 7 + 2 = 9. Négatifs : −3 − 5 = −8. Total : 9 − 8 = <b>1</b>.</div>
<div class="ex"><span class="q">Exemple 2 : (+4) − (−6) + (−9) − (+2)</span><br>Écriture simplifiée : 4 + 6 − 9 − 2. Positifs : 10 ; négatifs : −11. Total : <b>−1</b>.</div>
<div class="warn">⚠️ Le signe devant un nombre lui appartient : dans 7 − 5, le 5 est compté comme −5.<br>⚠️ − (−6) donne + 6 : deux « moins » qui se suivent font un « plus ».</div>
<div class="retenir">À retenir : je regroupe les positifs, je regroupe les négatifs, puis je fais le bilan.</div>`;
}

/* ================= 8. multiplier deux relatifs ================= */
function L8(d) {
  const T = d < 2 ? 5 : 10, dec = d >= 4 && chance(.3);
  let a, b;
  if (dec) { a = pick([-0.5, 0.5, -1.5, 1.5, -2.5, 0.1, -0.1, 0.2, -0.2]); b = nz(-10, 10) * 2; if (chance(.5)) [a, b] = [b, a]; }
  else if (d >= 3 && chance(.2)) { a = pick([-10, 10, -100]); b = nz2(-15, 15); if (chance(.5)) [a, b] = [b, a]; }
  else {
    a = nz2(-T, T); b = nz2(-T, T); // pas de facteur 1 ni −1 : « 1 × (−6) » ne demande aucun calcul
    if (d < 1) { if (sg(a) === sg(b)) b = -b; }
    else if (a > 0 && b > 0) { if (chance(.5)) a = -a; else b = -b; if (chance(.5)) { a = -dz(a); b = -dz(b); } }
  }
  const E = mulRule(a, b);
  const txt = d < 2 ? `${S(a)} × ${S(b)}` : `${M(a)} × ${P(b)}`;
  let vis = '';
  const [k, u] = a > 0 && a <= 5 ? [a, b] : b > 0 && b <= 5 ? [b, a] : [0, 0];
  if (k && Number.isInteger(k) && Number.isInteger(u) && Math.abs(k * u) <= 25) vis = chain(Array(k).fill(u));
  const ns = (a < 0) + (b < 0);
  return { ...numQ([E], ev(txt), { more: w => (approx(w[0], a + b) && a + b !== E ? 'Attention : c\'est une <b>multiplication</b>, pas une addition.' : '') }),
    html: `Calcule :${big(txt)}`,
    hint: `On multiplie les distances à zéro, puis on applique la règle des signes : deux facteurs de <b>même signe</b> donnent un produit <b>positif</b>, de <b>signes contraires</b> un produit <b>négatif</b>.`,
    solution: (a === 0 || b === 0) ? `Un des facteurs est nul : ${txt} = <b>0</b>.` : `${M(dz(a))} × ${M(dz(b))} = ${M(dz(E))}. ${ns === 1 ? 'Signes contraires : le produit est négatif' : 'Même signe : le produit est positif'}. Donc ${txt} = <b>${M(E)}</b>.`,
    afterVisual: vis };
}
function C8() {
  return `<h2>8. Multiplier deux nombres relatifs</h2>
<p class="intro">Multiplier, c'est répéter une addition : 3 × (−2), c'est trois fois −2. Il suffit ensuite de trouver le bon signe.</p>
<div class="def">Pour multiplier deux relatifs, on multiplie leurs distances à zéro, puis on met le signe :<br>• <b>même signe</b> → produit <b>positif</b> ; &nbsp; • <b>signes contraires</b> → produit <b>négatif</b>.<br>Si un facteur est 0, le produit est 0.</div>
<div class="cols"><div class="methode"><b>Méthode</b><ol><li>Trouve le signe du produit avec le tableau.</li><li>Multiplie les nombres sans leur signe.</li><li>Écris le résultat avec son signe.</li></ol></div>
${signRule()}</div>
${wide(chain([-2, -2, -2]))}
<div class="ex"><span class="q">Exemple 1 : 3 × (−2)</span><br>(−2) + (−2) + (−2) = <b>−6</b> : trois pas de −2 sur la droite. Signes contraires → négatif.</div>
<div class="ex"><span class="q">Exemple 2 : (−4) × (−5), (−7) × 3 et (−0,5) × 8</span><br>Même signe : <b>20</b>. Signes contraires : <b>−21</b>. Signes contraires : 0,5 × 8 = 4, donc <b>−4</b>.</div>
<div class="warn">⚠️ (−4) × (−5) n'est pas −20 : « moins par moins donne plus » pour la <b>multiplication</b>.<br>⚠️ Mais pas pour l'addition : (−4) + (−5) = −9.</div>
<div class="retenir">À retenir : même signe → +, signes contraires → −.</div>`;
}

/* ================= 9. règle des signes : produits de plusieurs facteurs ================= */
const SIGN_OPTS = [{ v: 'pos', l: 'Positif' }, { v: 'neg', l: 'Négatif' }, { v: 'nul', l: 'Nul (égal à 0)' }];
function L9(d) {
  const asChoice = d < 2 || chance(.3);
  const nf = asChoice ? (d < 1 ? 3 : ri(3, 5)) : (d < 4 ? 3 : 4), R = asChoice ? 12 : (nf === 3 ? 6 : 5);
  // facteurs de distance à zéro au moins 2 : un facteur 1 ou 0 rendrait le produit trivial
  const f = Array.from({ length: nf }, () => (chance(.5) ? -1 : 1) * ri(2, R));
  if (!f.some(x => x < 0)) f[ri(0, nf - 1)] *= -1;
  const txt = f.map((x, i) => (i ? P(x) : M(x))).join(' × ');
  const nNeg = f.filter(x => x < 0).length, zero = f.includes(0);
  if (asChoice) {
    const X = zero ? 'nul' : nNeg % 2 ? 'neg' : 'pos';
    return { type: 'choice', opts: SIGN_OPTS, check: choiceCheck(X, { msg: c => (zero ? 'Regarde bien <b>tous</b> les facteurs…' : c !== 'nul' ? 'Compte les facteurs <b>négatifs</b> : nombre pair → positif, nombre impair → négatif.' : '') }),
      verify: e => { const x = ev(txt); return e === (x === 0 ? 'nul' : x < 0 ? 'neg' : 'pos'); },
      html: `<b>Sans calculer</b>, quel est le signe de ce produit ?${big(txt)}`,
      hint: `Si un facteur vaut 0, le produit est nul. Sinon, compte les facteurs négatifs : s'il y en a un nombre <b>pair</b>, le produit est positif ; <b>impair</b>, il est négatif.`,
      solution: zero ? `Un des facteurs est 0 : le produit est <b>nul</b>.` : `Il y a ${nNeg} facteur${nNeg > 1 ? 's' : ''} négatif${nNeg > 1 ? 's' : ''} : c'est un nombre ${nNeg % 2 ? 'impair' : 'pair'}, donc le produit est <b>${nNeg % 2 ? 'négatif' : 'positif'}</b>.` };
  }
  let p = 1; for (const x of f) p *= dz(x);
  const E = z((nNeg % 2 ? -1 : 1) * p);
  return { ...numQ([E], ev(txt)),
    html: `Calcule :${big(txt)}`,
    hint: `Trouve d'abord le signe en comptant les facteurs négatifs (pair → +, impair → −). Puis multiplie les distances à zéro.`,
    solution: `${nNeg} facteur${nNeg > 1 ? 's' : ''} négatif${nNeg > 1 ? 's' : ''} (nombre ${nNeg % 2 ? 'impair' : 'pair'}) : le produit est ${nNeg % 2 ? 'négatif' : 'positif'}.<br>${f.map(dz).join(' × ')} = ${p}, donc ${txt} = <b>${M(E)}</b>.` };
}
function C9() {
  return `<h2>9. Règle des signes : plusieurs facteurs</h2>
<p class="intro">Avec plusieurs facteurs, inutile de tout calculer pour connaître le signe : il suffit de compter les facteurs négatifs.</p>
<div class="def">Le signe d'un produit de nombres relatifs non nuls dépend du <b>nombre de facteurs négatifs</b> :<br>• nombre <b>pair</b> de facteurs négatifs → produit <b>positif</b> ;<br>• nombre <b>impair</b> → produit <b>négatif</b>.<br>Si un des facteurs est 0, le produit est nul.</div>
<div class="methode"><b>Méthode</b><ol><li>Y a-t-il un facteur égal à 0 ? Alors le produit est nul.</li><li>Sinon, compte les facteurs négatifs : pair → +, impair → −.</li><li>Pour la valeur, multiplie les distances à zéro.</li></ol></div>
${signChain([-2, 3, -5])}
<div class="ex"><span class="q">Exemple 1 : (−2) × 3 × (−5)</span><br>2 facteurs négatifs (pair) → positif. 2 × 3 × 5 = 30, donc le produit vaut <b>30</b>. Chaque facteur négatif fait changer le signe.</div>
<div class="ex"><span class="q">Exemple 2 : (−1) × (−2) × (−3) × 4</span><br>3 facteurs négatifs (impair) → négatif. 1 × 2 × 3 × 4 = 24 : <b>−24</b>.</div>
<div class="ex"><span class="q">Exemple 3 : 12 × (−7) × 0 × (−3)</span><br>Un facteur vaut 0 : le produit est <b>nul</b>, inutile de calculer le reste !</div>
<div class="warn">⚠️ On compte les facteurs <b>négatifs</b>, pas tous les facteurs.<br>⚠️ Si un facteur est 0, le produit vaut 0 : on répond « nul », sans chercher de signe.</div>
<div class="retenir">À retenir : nombre pair de signes − → positif ; impair → négatif.</div>`;
}

/* ================= 10. diviser ================= */
function L10(d) {
  const v = d < 1 ? 0 : d < 2 ? ri(0, 1) : ri(Math.max(0, d - 3), Math.min(4, d));
  let b, q;
  if (v === 4 && chance(.5)) { b = pick([2, 4]) * (chance(.5) ? -1 : 1); q = r6(nz(-19, 19) / 2); if (Number.isInteger(q)) q += q > 0 ? 0.5 : -0.5; }
  else if (v === 4) { b = (chance(.5) ? -1 : 1) * ri(11, 15); q = nz2(-12, 12); } // q ≠ ±1 : pas « (−13) ÷ (−13) »
  else { b = (chance(.5) ? -1 : 1) * ri(2, 9); q = (chance(.5) ? -1 : 1) * ri(2, 10); }
  if (v === 0 && sg(b) === sg(q)) q = -q; // un dividende ou un diviseur négatif, pas les deux
  if (v === 1) { b = -dz(b); q = dz(q); } // deux négatifs
  const n = z(b * q);
  const E = z(sg(n) * sg(b) * dz(n) / dz(b));
  const rule = `${sg(n) === sg(b) ? 'Même signe : le quotient est positif' : 'Signes contraires : le quotient est négatif'}.`;
  if (v === 3) {
    const tpl = `${S(b)} × {0} = ${M(n)}`;
    return { ...numQ([E], ev(`${M(n)} ÷ ${P(b)}`), { tpl }),
      html: `Trouve le nombre manquant :${big(`${S(b)} × ${slot} = ${M(n)}`)}`,
      hint: `Le nombre manquant est le quotient ${M(n)} ÷ ${P(b)}. Pense à la règle des signes.`,
      solution: `${M(n)} ÷ ${P(b)} = <b>${M(E)}</b> (${rule.slice(0, -1).toLowerCase()}). Vérification : ${S(b)} × ${S(E)} = ${M(n)}.` };
  }
  const html = v === 2 ? F(M(n), M(b)) : `${M(n)} ÷ ${P(b)}`;
  return { ...numQ([E], ev(`${M(n)} ÷ ${P(b)}`)),
    html: `Calcule :${big(html)}`,
    hint: `${v === 2 ? 'Une fraction est une division : numérateur ÷ dénominateur. ' : ''}Divise les distances à zéro, puis applique la même règle des signes que pour la multiplication.`,
    solution: `${M(dz(n))} ÷ ${M(dz(b))} = ${M(dz(E))}. ${rule} Donc ${html} = <b>${M(E)}</b>.` };
}
function C10() {
  return `<h2>10. Diviser des nombres relatifs</h2>
<p class="intro">La division est l'opération inverse de la multiplication : elle suit donc exactement la même règle des signes.</p>
<div class="def">Pour diviser, on divise les distances à zéro, puis on applique la <b>même règle des signes</b> que pour la multiplication : même signe → quotient positif ; signes contraires → quotient négatif.<br>Une fraction est une division : ${F('−18', '−3')} = (−18) ÷ (−3).</div>
<div class="cols"><div class="methode"><b>Méthode</b><ol><li>Trouve le signe du quotient.</li><li>Divise les nombres sans leur signe.</li><li>Nombre manquant (−4) × ? = 28 : calcule 28 ÷ (−4).</li><li>Vérifie en multipliant.</li></ol></div>
${signRule()}</div>
${wide(chain([-3, -3, -3, -3]))}
<p style="text-align:center">(−12) ÷ 4 = −3 : on coupe −12 en 4 pas égaux de −3.</p>
<div class="ex"><span class="q">Exemple 1 : (−24) ÷ 6 ; (−35) ÷ (−7) ; ${F('−18', '−3')}</span><br><b>−4</b> (signes contraires) ; <b>5</b> (même signe) ; <b>6</b> (même signe).</div>
<div class="ex"><span class="q">Exemple 2 : (−4) × ? = 28</span><br>28 ÷ (−4) = <b>−7</b>. Vérification : (−4) × (−7) = 28 ✔.</div>
<div class="ex"><span class="q">Exemple 3 : (−7) ÷ 2</span><br>Signes contraires : 7 ÷ 2 = 3,5, donc <b>−3,5</b>. Le quotient peut être décimal.</div>
<div class="warn">⚠️ On ne divise jamais par 0.<br>⚠️ (−35) ÷ (−7) n'est pas −5 : même signe → positif.</div>
<div class="retenir">À retenir : pour ÷, la même règle des signes que pour ×.</div>`;
}

/* ================= 11. calculs enchaînés et priorités ================= */
function L11(d) {
  const top = Math.min(d, 5), k = d < 1 ? 0 : chance(.5) ? top : ri(0, top);
  const a = nz(-15, 15), b = nz2(-9, 9), c = nz2(-9, 9), e = nz2(-9, 9), f = nz2(-6, 6);
  let txt, steps, E, par = []; // par : valeurs des parenthèses
  if (k === 0) {
    const op = chance(.5) ? '+' : '−', m = mulRule(b, c);
    txt = `${M(a)} ${op} ${P(b)} × ${P(c)}`;
    E = addRule(a, op === '+' ? m : -m);
    steps = [`${M(a)} ${op} ${P(m)}`];
  } else if (k === 1) {
    const a2 = a > 9 || a < -9 ? sg(a) * 3 : dz(a) < 2 ? sg(a) * 2 : a, m1 = mulRule(a2, b), m2 = mulRule(c, e), op = chance(.5) ? '+' : '−';
    txt = `${M(a2)} × ${P(b)} ${op} ${P(c)} × ${P(e)}`;
    E = addRule(m1, op === '+' ? m2 : -m2);
    steps = [`${M(m1)} ${op} ${P(m2)}`];
  } else if (k === 2) {
    const op = chance(.5) ? '+' : '−', inner = addRule(b, op === '+' ? c : -c); par = [inner];
    if (chance(.5)) { txt = `(${M(b)} ${op} ${P(c)}) × ${P(e)}`; E = mulRule(inner, e); steps = [`${P(inner)} × ${P(e)}`]; }
    else { txt = `${M(e)} × (${M(b)} ${op} ${P(c)})`; E = mulRule(e, inner); steps = [`${M(e)} × ${P(inner)}`]; }
  } else if (k === 3) {
    const op = chance(.5) ? '+' : '−', inner = addRule(c, op === '+' ? e : -e), m = mulRule(b, inner); par = [inner];
    txt = `${M(a)} − ${P(b)} × (${M(c)} ${op} ${P(e)})`;
    E = addRule(a, -m);
    steps = [`${M(a)} − ${P(b)} × ${P(inner)}`, `${M(a)} − ${P(m)}`];
  } else if (k === 4) {
    const n = mulRule(b, f), m = mulRule(c, e);
    txt = `${M(n)} ÷ ${P(f)} − ${P(c)} × ${P(e)}`;
    E = addRule(b, -m);
    steps = [`${M(b)} − ${P(m)}`];
  } else {
    const i1 = addRule(a > 9 || a < -9 ? sg(a) * 4 : a, b), a2 = a > 9 || a < -9 ? sg(a) * 4 : a, i2 = addRule(c, -e); par = [i1, i2];
    txt = `(${M(a2)} + ${P(b)}) × (${M(c)} − ${P(e)})`;
    E = mulRule(i1, i2);
    steps = [`${P(i1)} × ${P(i2)}`];
  }
  if (!txt.includes('−')) return L11(d); // toujours au moins un nombre négatif
  // une parenthèse qui vaut 0, 1 ou −1 cacherait un produit par 0 ou par ±1 (« −2 × (1 − 1) »)
  if (par.some(x => dz(x) < 2)) return L11(d);
  const naive = ev(txt, true);
  return { ...numQ([E], ev(txt), { more: w => (approx(w[0], naive) && !approx(naive, E) ? 'Attention aux <b>priorités</b> : les calculs entre parenthèses d\'abord, puis × et ÷, puis + et −.' : '') }),
    html: `Calcule en respectant les priorités :${big(txt)}`,
    hint: k === 2 || k === 3 || k === 5 ? 'Commence par ce qui est <b>entre parenthèses</b>. Ensuite les multiplications et divisions, et enfin les additions et soustractions.' : 'La multiplication et la division passent <b>avant</b> l\'addition et la soustraction. Repère-les et calcule-les d\'abord.',
    solution: [txt, ...steps].map((s, i) => (i ? '= ' : '') + s).join('<br>') + `<br>= <b>${M(E)}</b>` };
}
function C11() {
  const hl = s => `<span style="background:#ffe3e3;border-radius:6px;padding:0 4px">${s}</span>`;
  return `<h2>11. Calculs enchaînés : les priorités</h2>
<p class="intro">Quand plusieurs opérations se suivent, l'ordre des calculs compte. On applique les priorités, et à chaque étape les règles des relatifs.</p>
<div class="def">Dans un calcul, on effectue dans l'ordre :<br>1. les calculs <b>entre parenthèses</b> ;<br>2. les <b>multiplications et divisions</b> (de gauche à droite) ;<br>3. les <b>additions et soustractions</b> (de gauche à droite).</div>
<div class="methode"><b>Méthode</b><ol><li>Repère les parenthèses, puis les × et ÷.</li><li>Calcule une seule étape à la fois (en couleur ci-dessous).</li><li>Recopie tout ce qui n'a pas encore été calculé.</li><li>Termine par les + et −, avec la règle d'addition.</li></ol></div>
<div class="ex" style="line-height:2"><span class="q">Exemple 1 : −5 + 3 × (−4)</span><br>−5 + ${hl('3 × (−4)')}<br>= ${hl('−5 + (−12)')}<br>= <b>−17</b></div>
${wide(intLine({ min: -20, max: 2, arrows: [{ from: 0, to: -5, l: '−5', c: '#1971c2' }, { from: -5, to: -17, l: '+ (−12)', c: '#e8590c' }], marks: [{ x: -17, l: '−17' }] }))}
<div class="ex" style="line-height:2"><span class="q">Exemple 2 : 2 − 3 × (−1 − 4)</span><br>2 − 3 × ${hl('(−1 − 4)')}<br>= 2 − ${hl('3 × (−5)')}<br>= ${hl('2 − (−15)')}<br>= 2 + 15 = <b>17</b></div>
<div class="warn">⚠️ −5 + 3 × (−4) n'est pas (−2) × (−4) = 8 : la multiplication passe avant l'addition.<br>⚠️ 2 − (−15) : soustraire −15, c'est ajouter 15.</div>
<div class="retenir">À retenir : parenthèses, puis × et ÷, puis + et −.</div>`;
}

/* ================= 12. défis et problèmes ================= */
function L12(d) {
  const v = ri(0, Math.min(4, d + 1));
  if (v === 0) {
    const a = nz2(-9, 9), b = nz(-15, 15), x = nz2(-9, 9); // coefficient et valeur ≠ ±1 : pas « 1 × (−3) »
    const two = d >= 3 && chance(.5), c = nz2(-6, 6), y = nz2(-6, 6);
    const fx = (k, name) => (k === 1 ? '' : k === -1 ? '−' : M(k)) + name;
    const expr = two ? `${fx(a, 'x')} ${c < 0 ? '−' : '+'} ${fx(dz(c), 'y')}` : `${fx(a, 'x')} ${b < 0 ? '−' : '+'} ${dz(b)}`;
    const txt = two ? `${M(a)} × ${P(x)} ${c < 0 ? '−' : '+'} ${dz(c)} × ${P(y)}` : `${M(a)} × ${P(x)} ${b < 0 ? '−' : '+'} ${dz(b)}`;
    const m1 = mulRule(a, x), m2 = two ? mulRule(dz(c), y) : dz(b);
    const sgn2 = (two ? c : b) < 0 ? -1 : 1;
    const E = addRule(m1, sgn2 * m2);
    return { ...numQ([E], ev(txt), { tpl: 'A = {0}' }),
      html: `Calcule A = ${expr} pour <b>x = ${M(x)}</b>${two ? ` et <b>y = ${M(y)}</b>` : ''}.`,
      hint: `Remplace ${two ? 'x et y' : 'x'} par ${two ? 'leurs valeurs' : 'sa valeur'}, <b>entre parenthèses</b>, et rétablis le signe × : ${fx(a, 'x')} = ${M(a)} × ${P(x)}. Puis respecte les priorités.`,
      solution: `A = ${txt}<br>= ${M(m1)} ${sgn2 < 0 ? '−' : '+'} ${P(m2)}<br>= <b>${M(E)}</b>` };
  }
  if (v === 1) {
    const t = -ri(5, 30), m1 = ri(2, 15), m2 = ri(2, 20);
    let E = t; for (let k = 0; k < m1; k++) E++; for (let k = 0; k < m2; k++) E--;
    if (E >= 0) return L12(d);
    const txt = `${M(t)} + ${m1} − ${m2}`;
    return { ...numQ([E], ev(txt), { tpl: 'Altitude : {0} m' }),
      html: `Une plongeuse est à l'altitude <b>${M(t)} m</b> (${-t} m sous la surface de l'eau). Elle remonte de ${m1} m, puis redescend de ${m2} m.<br>À quelle altitude est-elle maintenant ?`,
      hint: `Remonter, c'est ajouter ; descendre, c'est soustraire. Calcule ${txt}.`,
      solution: `${txt} = ${M(t + m1)} − ${m2} = <b>${M(E)}</b> m : elle est à ${-E} m sous la surface.` };
  }
  if (v === 2) {
    const s = -ri(10, 80), dep = 10 * ri(3, 15), k = ri(2, 4), p = 5 * ri(2, 9);
    const E = addRule(addRule(s, dep), -k * p), txt = `${M(s)} + ${dep} − ${k} × ${p}`;
    return { ...numQ([E], ev(txt), { tpl: 'Solde : {0} €' }),
      html: `Le compte de ${prenom()} est à <b>${M(s)} €</b> (à découvert). Il dépose ${dep} €, puis paie ${k} places de concert à ${p} € chacune.<br>Quel est le nouveau solde ?`,
      hint: `Écris le calcul : ${M(s)} + ${dep} − ${k} × ${p}. Attention, la multiplication passe d'abord.`,
      solution: `${txt} = ${M(s)} + ${dep} − ${k * p} = ${M(s + dep)} − ${k * p} = <b>${M(E)}</b> €.` };
  }
  if (v === 3) {
    const n = pick([4, 5]); let t;
    do { t = Array.from({ length: n }, () => ri(-12, 9)); } while (t.reduce((s, x) => s + x, 0) % n !== 0 || !t.some(x => x < 0));
    let sum = 0; for (const x of t) sum = addRule(sum, x);
    const E = z(sum / n), txt = `(${t.map((x, i) => (i ? P(x) : M(x))).join(' + ')}) ÷ ${n}`;
    return { ...numQ([E], ev(txt), { tpl: 'Moyenne : {0} °C' }),
      html: `Températures relevées à midi pendant ${n} jours : ${t.map(x => `<b>${M(x)} °C</b>`).join(', ')}.<br>Quelle est la température moyenne ?`,
      hint: `Moyenne = somme des températures ÷ nombre de jours. Pour la somme, regroupe les positifs et les négatifs.`,
      solution: `Somme : ${t.map((x, i) => (i ? P(x) : M(x))).join(' + ')} = ${M(sum)}.<br>Moyenne : ${M(sum)} ÷ ${n} = <b>${M(E)}</b> °C.` };
  }
  // v === 4 : parenthèses imbriquées
  const a = nz(-12, 12), b = nz(-9, 9), c = nz2(-6, 6), e = nz2(-6, 6);
  const m = mulRule(c, e), in1 = addRule(b, -m), E = addRule(a, -in1);
  if (in1 === 0) return L12(d); // « a − (0) » : la réponse serait le premier nombre
  const txt = `${M(a)} − (${M(b)} − ${P(c)} × ${P(e)})`;
  const naive = ev(txt, true);
  return { ...numQ([E], ev(txt), { more: w => (approx(w[0], addRule(a, in1)) && addRule(a, in1) !== E ? 'Attention au « − » devant la parenthèse : on <b>soustrait</b> le résultat de la parenthèse.' : approx(w[0], naive) && naive !== E ? 'Attention aux <b>priorités</b>.' : '') }),
    html: `Calcule :${big(txt)}`,
    hint: `Commence par l'intérieur de la parenthèse, en faisant la multiplication avant la soustraction. Puis soustrais le résultat.`,
    solution: `${txt}<br>= ${M(a)} − (${M(b)} − ${P(m)})<br>= ${M(a)} − ${P(in1)}<br>= <b>${M(E)}</b>` };
}
function C12() {
  return `<h2>12. Défis : problèmes et expressions</h2>
<p class="intro">On mélange tout : additions, soustractions, produits, quotients et priorités, dans des situations concrètes (altitude, compte en banque, moyenne de températures).</p>
<div class="def">Pour <b>remplacer une lettre</b> par un nombre négatif, on le met <b>entre parenthèses</b> et on rétablit le signe × :<br>si x = −3, alors 4x − 5 = 4 × (−3) − 5 = −12 − 5 = −17.<br><b>Moyenne</b> = somme des valeurs ÷ nombre de valeurs.</div>
<div class="methode"><b>Méthode</b><ol><li>Traduis l'énoncé en calcul : monter, gagner → + ; descendre, perdre → −.</li><li>Remplace les lettres par leur valeur, entre parenthèses.</li><li>Respecte les priorités.</li><li>Relis la question : réponds avec l'unité (m, €, °C).</li></ol></div>
${wide(chain([-12, 5]))}
<div class="ex"><span class="q">Exemple 1 : un plongeur à −12 m remonte de 5 m</span><br>−12 + 5 = <b>−7</b> : il est à 7 m sous la surface.</div>
<div class="ex"><span class="q">Exemple 2 : moyenne de −4, 2, −1 et −5</span><br>Somme : −4 + 2 − 1 − 5 = −8. Moyenne : −8 ÷ 4 = <b>−2</b>.</div>
<div class="ex"><span class="q">Exemple 3 : 3 − (−2 − 4 × (−1))</span><br>Dans la parenthèse : −2 − (−4) = 2. Puis 3 − 2 = <b>1</b>.</div>
<div class="warn">⚠️ 4x avec x = −3 n'est pas 4 − 3 : c'est 4 <b>×</b> (−3).<br>⚠️ « − ( … ) » : on soustrait tout le résultat de la parenthèse.</div>
<div class="retenir">À retenir : je traduis, je mets les négatifs entre parenthèses, je respecte les priorités.</div>`;
}

export const LEVELS = [
  { titre: 'Repérer sur une droite graduée', generate: L1, cours: C1, classe: '5e' },
  { titre: 'Comparer des relatifs', generate: L2, cours: C2, classe: '5e' },
  { titre: 'Opposé et distance à zéro', generate: L3, cours: C3, classe: '5e' },
  { titre: 'Le thermomètre : monter, descendre', generate: L4, cours: C4, classe: '5e' },
  { titre: 'Additionner deux relatifs', generate: L5, cours: C5, classe: '5e' },
  { titre: "Soustraire, c'est ajouter l'opposé", generate: L6, cours: C6, classe: '5e' },
  { titre: 'Sommes de plusieurs relatifs', generate: L7, cours: C7, classe: '5e' },
  { titre: 'Multiplier deux relatifs', generate: L8, cours: C8, classe: '4e' },
  { titre: 'Règle des signes : plusieurs facteurs', generate: L9, cours: C9, classe: '4e' },
  { titre: 'Diviser des relatifs', generate: L10, cours: C10, classe: '4e' },
  { titre: 'Calculs enchaînés : priorités', generate: L11, cours: C11, classe: '4e' },
  { titre: 'Défis : problèmes et expressions', generate: L12, cours: C12, classe: '4e' },
];
export const OPTIONS = { need: 4, keys: { neg: true, comma: false } };

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

/* ---------- dessins fixes des cours (sans hasard : les parts coloriées sont les premières) ---------- */
const C_BLUE = '#74c0fc', C_ORA = '#ffa94d', C_GRN = '#8ce99a', C_INK = '#343a40';
const svg = (w, h, label, inner, maxw = w) => `<svg viewBox="0 0 ${w} ${h}" style="max-width:${maxw}px" role="img" aria-label="${label}" font-family="system-ui,sans-serif">${inner}</svg>`;
const tx = (x, y, s, o = {}) => `<text x="${x}" y="${y}" font-size="${o.fs || 16}" text-anchor="${o.a || 'middle'}" fill="${o.c || C_INK}"${o.b ? ' font-weight="700"' : ''}>${s}</text>`;
/** fraction empilée dans un SVG : trait de fraction en (x, y) */
const sf = (x, y, n, d) => tx(x, y - 5, n, { b: 1, fs: 17 }) + `<line x1="${x - 13}" y1="${y}" x2="${x + 13}" y2="${y}" stroke="${C_INK}" stroke-width="2"/>` + tx(x, y + 18, d, { b: 1, fs: 17 });
/** disque partagé en b parts égales, les a premières coloriées */
function discD(a, b) {
  const r = 70, c = 76;
  let s = '';
  for (let i = 0; i < b; i++) {
    const t1 = i / b * 2 * Math.PI - Math.PI / 2, t2 = (i + 1) / b * 2 * Math.PI - Math.PI / 2;
    s += `<path d="M${c},${c} L${(c + r * Math.cos(t1)).toFixed(2)},${(c + r * Math.sin(t1)).toFixed(2)} A${r},${r} 0 0 1 ${(c + r * Math.cos(t2)).toFixed(2)},${(c + r * Math.sin(t2)).toFixed(2)} Z" fill="${i < a ? C_BLUE : '#fff'}" stroke="#333" stroke-width="2"/>`;
  }
  return svg(152, 152, `disque partagé en ${b} parts égales dont ${a} coloriées`, s, 170);
}
/**
 * barres de même longueur (l'unité), l'une sous l'autre :
 * rows = [{ b, segs: [[nombre de parts, couleur]…], l: [num, dén] ou texte, txt: [texte de chaque part] }]
 */
function bars(rows, { W = 300, cap = '' } = {}) {
  const lx = 58, bh = 40, gap = 18, H = 12 + rows.length * bh + (rows.length - 1) * gap + 12 + (cap ? 30 : 0);
  let s = '';
  rows.forEach((r, i) => {
    const y = 12 + i * (bh + gap), w = W / r.b, cols = [];
    (r.segs || []).forEach(([n, c]) => { for (let j = 0; j < n; j++) cols.push(c); });
    for (let j = 0; j < r.b; j++) {
      s += `<rect x="${(lx + j * w).toFixed(2)}" y="${y}" width="${w.toFixed(2)}" height="${bh}" fill="${cols[j] || '#fff'}" stroke="#333" stroke-width="2"/>`;
      if (r.txt && r.txt[j]) s += tx((lx + j * w + w / 2).toFixed(1), y + bh / 2 + 5, r.txt[j], { b: 1, fs: r.fs || 15 });
    }
    s += Array.isArray(r.l) ? sf(lx / 2 - 4, y + bh / 2, r.l[0], r.l[1]) : tx(lx / 2 - 4, y + bh / 2 + 6, r.l || '', { b: 1 });
  });
  if (cap) s += tx(lx + W / 2, H - 9, cap, { b: 1, fs: 16 });
  return svg(lx + W + 8, H, 'barres de même longueur partagées en parts égales', s);
}
/** carré unité : a/b des lignes en bleu, c/d des colonnes en orange ; la partie commune vaut (a × c)/(b × d) */
function areaFrac(a, b, c, d, cap = '') {
  const S = 210, x0 = 60, y0 = 66, H = y0 + S + (cap ? 42 : 12);
  let s = '';
  for (let i = 0; i < b; i++) for (let j = 0; j < d; j++) {
    const inA = i < a, inC = j < c, fill = inA && inC ? '#b197fc' : inA ? '#d0ebff' : inC ? '#ffe8cc' : '#fff';
    s += `<rect x="${(x0 + j * S / d).toFixed(2)}" y="${(y0 + i * S / b).toFixed(2)}" width="${(S / d).toFixed(2)}" height="${(S / b).toFixed(2)}" fill="${fill}" stroke="#495057" stroke-width="1.5"/>`;
  }
  s += `<rect x="${x0}" y="${y0}" width="${S}" height="${S}" fill="none" stroke="#212529" stroke-width="3"/>`;
  s += `<line x1="${x0 - 10}" y1="${y0}" x2="${x0 - 10}" y2="${(y0 + a * S / b).toFixed(1)}" stroke="#1971c2" stroke-width="4"/>` + sf(x0 - 34, y0 + a * S / b / 2, a, b);
  s += `<line x1="${x0}" y1="${y0 - 10}" x2="${(x0 + c * S / d).toFixed(1)}" y2="${y0 - 10}" stroke="#e8590c" stroke-width="4"/>` + sf(x0 + c * S / d / 2, y0 - 38, c, d);
  if (cap) s += tx(x0 + S / 2, H - 12, cap, { b: 1, fs: 17 });
  return svg(x0 + S + 12, H, `carré unité : la partie commune représente ${a * c} cases sur ${b * d}`, s, 280);
}
/** carré de n × n petits carreaux (aire n²) */
function sqGrid(n, cap = '') {
  const c = 22, x0 = 40, y0 = 30, S = n * c, H = y0 + S + (cap ? 42 : 12);
  let s = '';
  for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) s += `<rect x="${x0 + j * c}" y="${y0 + i * c}" width="${c}" height="${c}" fill="${(i + j) % 2 ? '#d0ebff' : '#e7f5ff'}" stroke="#74c0fc"/>`;
  s += `<rect x="${x0}" y="${y0}" width="${S}" height="${S}" fill="none" stroke="#1864ab" stroke-width="3"/>` + tx(x0 + S / 2, y0 - 10, n, { b: 1, fs: 18 }) + tx(x0 - 12, y0 + S / 2 + 6, n, { b: 1, fs: 18, a: 'end' });
  if (cap) s += tx(x0 + S / 2, H - 12, cap, { b: 1, fs: 16 });
  return svg(x0 + S + 40, H, `carré de côté ${n} : son aire est ${n * n}`, s, 260);
}

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
<p class="intro">Une fraction décrit une partie d'un tout qu'on a partagé en parts <b>égales</b> : une part de pizza, un morceau de trajet, un point sur une droite.</p>
<div class="def">Dans ${F('a', 'b')} : le <b>dénominateur</b> b (en bas) dit en combien de parts <b>égales</b> on a partagé l'unité ; le <b>numérateur</b> a (en haut) dit combien de parts on prend.<br>${F(3, 8)} se lit « trois huitièmes ».</div>
<div class="cols"><div class="methode"><b>Méthode</b><ol><li>Vérifie que les parts sont égales.</li><li>Compte <b>toutes</b> les parts : c'est le dénominateur.</li><li>Compte les parts coloriées : c'est le numérateur.</li></ol></div>
${discD(3, 8)}</div>
<div class="ex"><span class="q">Exemple 1 : le disque</span><br>Il y a 8 parts égales et 3 sont coloriées : ${F(3, 8)}.</div>
<h3>Sur une droite graduée</h3>
<p>On regarde en combien de parts l'unité (de 0 à 1) est partagée : c'est le dénominateur. Puis on compte les petits intervalles de 0 jusqu'au point.</p>
${fracLine(5, 3)}
<div class="ex"><span class="q">Exemple 2 : le point A</span><br>L'unité est partagée en 3, et A est à 5 graduations de 0 : A = ${F(5, 3)}.<br>Le numérateur est plus grand que le dénominateur : ${F(5, 3)} est plus grand que 1.</div>
<div class="warn">⚠️ Le dénominateur compte <b>toutes</b> les parts : 3 parts coloriées et 5 blanches, c'est ${F(3, 8)}, pas ${F(3, 5)}.<br>⚠️ Sur la droite, compte les <b>intervalles</b> entre deux graduations, pas les traits.</div>
<div class="retenir">À retenir : en bas, le nombre de parts égales ; en haut, le nombre de parts prises.</div>`;
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
<p class="intro">Une même quantité peut s'écrire avec plusieurs fractions : c'est comme couper un gâteau en parts plus petites, il reste le même gâteau.</p>
<div class="def">On ne change pas une fraction en multipliant (ou en divisant) son numérateur <b>et</b> son dénominateur par le <b>même</b> nombre non nul :<br>${F('a', 'b')} = ${F('a × k', 'b × k')}</div>
<div class="cols"><div class="methode"><b>Méthode</b><ol><li>Regarde l'étage où les deux nombres sont connus (en haut ou en bas).</li><li>Trouve par combien on a multiplié ou divisé : 3 × ? = 12.</li><li>Fais <b>la même</b> opération à l'autre étage.</li></ol></div>
${bars([{ b: 3, segs: [[2, C_BLUE]], l: [2, 3] }, { b: 12, segs: [[8, C_BLUE]], l: [8, 12] }], { cap: 'même longueur coloriée' })}</div>
<div class="ex"><span class="q">Exemple 1 : ${F(2, 3)} = ${F('?', 12)}</span><br>3 × 4 = 12, donc on multiplie aussi le haut par 4 : 2 × 4 = 8. ${F(2, 3)} = ${F(8, 12)}.</div>
<div class="ex"><span class="q">Exemple 2 : ${F(5, 7)} = ${F(15, '?')}</span><br>5 × 3 = 15, donc 7 × 3 = 21 : ${F(5, 7)} = ${F(15, 21)}.</div>
<div class="ex"><span class="q">Exemple 3 : ${F(18, 24)} = ${F('?', 4)}</span><br>24 ÷ 6 = 4, donc 18 ÷ 6 = 3 : ${F(18, 24)} = ${F(3, 4)}.</div>
<div class="warn">⚠️ Ajouter le même nombre en haut et en bas ne marche pas : ${F(1, 2)} ≠ ${F(2, 3)}.<br>⚠️ Multiplie <b>les deux</b> étages, pas seulement celui où il y a le « ? ».</div>
<div class="retenir">À retenir : même multiplication (ou même division) en haut et en bas.</div>`;
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
<p class="intro">Simplifier, c'est écrire la même fraction avec des nombres plus petits : elle devient plus facile à lire et à comparer.</p>
<div class="def"><b>Simplifier</b>, c'est diviser le numérateur et le dénominateur par un même nombre. Une fraction est <b>irréductible</b> quand on ne peut plus la simplifier.<br>Divisible par <b>2</b> : se termine par 0, 2, 4, 6, 8. Par <b>5</b> : se termine par 0 ou 5. Par <b>3</b> : la somme des chiffres est dans la table de 3.</div>
<div class="cols"><div class="methode"><b>Méthode</b><ol><li>Cherche un nombre qui divise le haut <b>et</b> le bas (critères, tables).</li><li>Divise les deux par ce nombre.</li><li>Recommence tant que c'est possible.</li><li>Plus rapide : divise tout de suite par le plus grand diviseur commun.</li></ol></div>
${bars([{ b: 24, segs: [[18, C_BLUE]], l: [18, 24] }, { b: 4, segs: [[3, C_BLUE]], l: [3, 4] }], { cap: 'même valeur, nombres plus petits' })}</div>
<div class="ex"><span class="q">Exemple 1 : ${F(18, 24)}</span><br>18 et 24 sont dans la table de 6 : ${F('18 ÷ 6', '24 ÷ 6')} = ${F(3, 4)}.</div>
<div class="ex"><span class="q">Exemple 2 : ${F(45, 60)} en plusieurs fois</span><br>÷ 5 : ${F(9, 12)} ; puis ÷ 3 : ${F(3, 4)}. On s'arrête : 3 et 4 n'ont plus de diviseur commun.</div>
<div class="ex"><span class="q">Exemple 3 : ${F(84, 98)}</span><br>÷ 2 : ${F(42, 49)} ; puis ÷ 7 : ${F(6, 7)}. (En une fois : ÷ 14.)</div>
<div class="warn">⚠️ ${F(12, 16)} = ${F(6, 8)} est juste, mais pas fini : ${F(6, 8)} = ${F(3, 4)}. Vérifie toujours qu'on ne peut plus simplifier.<br>⚠️ On <b>divise</b>, on ne soustrait pas : enlever le même nombre en haut et en bas change la fraction.</div>
<div class="retenir">À retenir : je divise le haut et le bas par le même nombre, jusqu'à la fraction irréductible.</div>`;
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
<p class="intro">Comparer deux fractions, c'est savoir laquelle représente la plus grande part.</p>
<div class="def">• <b>Même dénominateur</b> : la plus grande est celle qui a le plus grand numérateur.<br>• <b>Dénominateurs différents</b> : on les écrit d'abord avec le même dénominateur.<br>• Une fraction est plus grande que 1 quand son numérateur dépasse son dénominateur.</div>
<div class="cols"><div class="methode"><b>Méthode</b><ol><li>Mêmes dénominateurs ? Compare directement les numérateurs.</li><li>Sinon, transforme la fraction qui a le plus petit dénominateur (2 × 3 = 6 : ${F(2, 3)} = ${F(4, 6)}).</li><li>Compare les numérateurs et choisis &lt;, &gt; ou =.</li></ol></div>
${bars([{ b: 3, segs: [[2, C_BLUE]], l: [2, 3] }, { b: 6, segs: [[4, C_BLUE]], l: [4, 6] }, { b: 6, segs: [[5, C_ORA]], l: [5, 6] }])}</div>
<div class="ex"><span class="q">Exemple 1 : ${F(5, 7)} et ${F(3, 7)}</span><br>Même dénominateur et 5 &gt; 3, donc ${F(5, 7)} &gt; ${F(3, 7)}.</div>
<div class="ex"><span class="q">Exemple 2 : ${F(2, 3)} et ${F(5, 6)}</span><br>${F(2, 3)} = ${F(4, 6)} et 4 &lt; 5, donc ${F(2, 3)} &lt; ${F(5, 6)}.</div>
<div class="ex"><span class="q">Exemple 3 : ${F(9, 12)} et ${F(3, 4)}</span><br>${F(3, 4)} = ${F(9, 12)} : les deux fractions sont <b>égales</b>, on écrit =.</div>
<div class="warn">⚠️ Ne compare pas les dénominateurs seuls : ${F(1, 3)} &gt; ${F(1, 4)}, car plus il y a de parts, plus elles sont petites.<br>⚠️ Pense à la réponse = : deux fractions écrites différemment peuvent être égales.</div>
<div class="retenir">À retenir : pour comparer, je mets les fractions au même dénominateur.</div>`;
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
<p class="intro">Quand les parts ont la même taille, on peut les compter ensemble : 2 septièmes et 3 septièmes, cela fait 5 septièmes.</p>
<div class="def">${F('a', 'd')} + ${F('b', 'd')} = ${F('a + b', 'd')} &nbsp; et &nbsp; ${F('a', 'd')} − ${F('b', 'd')} = ${F('a − b', 'd')}</div>
<div class="cols"><div class="methode"><b>Méthode</b><ol><li>Vérifie que les dénominateurs sont égaux.</li><li>Additionne (ou soustrais) les <b>numérateurs</b>.</li><li><b>Garde</b> le dénominateur.</li><li>Simplifie le résultat si c'est possible.</li></ol></div>
${bars([{ b: 7, segs: [[2, C_BLUE]], l: [2, 7] }, { b: 7, segs: [[3, C_ORA]], l: [3, 7] }, { b: 7, segs: [[2, C_BLUE], [3, C_ORA]], l: [5, 7] }])}</div>
<div class="ex"><span class="q">Exemple 1 : ${F(2, 7)} + ${F(3, 7)}</span><br>${F('2 + 3', 7)} = ${F(5, 7)}.</div>
<div class="ex"><span class="q">Exemple 2 : ${F(11, 9)} − ${F(4, 9)}</span><br>${F('11 − 4', 9)} = ${F(7, 9)}.</div>
<div class="ex"><span class="q">Exemple 3 : ${F(5, 12)} + ${F(3, 12)}</span><br>${F(8, 12)}, qui se simplifie par 4 : ${F(2, 3)}.</div>
<div class="warn">⚠️ On n'additionne <b>pas</b> les dénominateurs : ${F(2, 7)} + ${F(3, 7)} n'est pas ${F(5, 14)} ! La taille des parts ne change pas.<br>⚠️ Dans une soustraction, garde bien l'ordre : le premier numérateur moins le deuxième.</div>
<div class="retenir">À retenir : même dénominateur → j'additionne les numérateurs et je garde le dénominateur.</div>`;
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
<p class="intro">Pour additionner des tiers et des neuvièmes, il faut d'abord des parts de même taille : on découpe les tiers en neuvièmes.</p>
<div class="def">Si un dénominateur est un <b>multiple</b> de l'autre, on transforme seulement la fraction qui a le <b>plus petit</b> dénominateur, en multipliant son numérateur et son dénominateur par le même nombre.</div>
<div class="cols"><div class="methode"><b>Méthode</b><ol><li>Repère le plus grand dénominateur D.</li><li>Trouve k tel que petit dénominateur × k = D.</li><li>Multiplie le haut et le bas de la petite fraction par k.</li><li>Additionne (ou soustrais) les numérateurs, garde D, simplifie.</li></ol></div>
${bars([{ b: 3, segs: [[1, C_BLUE]], l: [1, 3] }, { b: 9, segs: [[3, C_BLUE]], l: [3, 9] }, { b: 9, segs: [[3, C_BLUE], [4, C_ORA]], l: [7, 9] }])}</div>
<div class="ex"><span class="q">Exemple 1 : ${F(1, 3)} + ${F(4, 9)}</span><br>3 × 3 = 9, donc ${F(1, 3)} = ${F(3, 9)}. Puis ${F(3, 9)} + ${F(4, 9)} = ${F(7, 9)}.</div>
<div class="ex"><span class="q">Exemple 2 : ${F(5, 4)} − ${F(3, 8)}</span><br>4 × 2 = 8 : ${F(5, 4)} = ${F(10, 8)}. Puis ${F(10, 8)} − ${F(3, 8)} = ${F(7, 8)}.</div>
<div class="ex"><span class="q">Exemple 3 : ${F(7, 10)} − ${F(1, 5)}</span><br>${F(1, 5)} = ${F(2, 10)}, donc ${F(7, 10)} − ${F(2, 10)} = ${F(5, 10)} = ${F(1, 2)}.</div>
<div class="warn">⚠️ Quand on multiplie le dénominateur, on multiplie aussi le numérateur : ${F(1, 3)} = ${F(3, 9)}, pas ${F(1, 9)}.<br>⚠️ On ne touche pas à la fraction qui a déjà le grand dénominateur.</div>
<div class="retenir">À retenir : je transforme la petite fraction pour avoir le même dénominateur, puis j'additionne.</div>`;
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
<p class="intro">« Les trois quarts des élèves », « les deux tiers du trajet » : on calcule une fraction d'un nombre très souvent dans la vie.</p>
<div class="def">Prendre les ${F('a', 'b')} d'une quantité : on la <b>divise par b</b> (une part), puis on <b>multiplie par a</b>.<br>Multiplier un entier par une fraction : n × ${F('a', 'b')} = ${F('n × a', 'b')}.</div>
<div class="cols"><div class="methode"><b>Méthode</b><ol><li>Repère la quantité et la fraction.</li><li>Calcule une part : quantité ÷ dénominateur.</li><li>Multiplie par le numérateur.</li><li>Dans un problème, réponds par une phrase avec l'unité.</li></ol></div>
${bars([{ b: 4, segs: [[3, C_ORA]], l: '20', txt: ['5', '5', '5', '5'] }], { cap: '3 parts de 5 : 15' })}</div>
<div class="ex"><span class="q">Exemple 1 : les ${F(3, 4)} de 20</span><br>Une part : 20 ÷ 4 = 5. Trois parts : 5 × 3 = <b>15</b>.</div>
<div class="ex"><span class="q">Exemple 2 : un livre de 240 pages, on en a lu les ${F(5, 8)}</span><br>240 ÷ 8 = 30, puis 30 × 5 = 150. On a lu <b>150 pages</b>.</div>
<div class="ex"><span class="q">Exemple 3 : 5 × ${F(2, 3)}</span><br>On multiplie le numérateur : ${F('5 × 2', 3)} = ${F(10, 3)}.</div>
<div class="warn">⚠️ On divise par le <b>dénominateur</b> : les ${F(3, 4)} de 20, ce n'est pas 20 ÷ 3 × 4.<br>⚠️ 5 × ${F(2, 3)} n'est pas ${F(10, 15)} : on ne multiplie pas le dénominateur.</div>
<div class="retenir">À retenir : les ${F('a', 'b')} de N, c'est N ÷ b × a.</div>`;
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
<p class="intro">Multiplier deux fractions, c'est prendre une fraction d'une fraction : les ${F(2, 3)} des ${F(4, 5)}.</p>
<div class="def">${F('a', 'b')} × ${F('c', 'd')} = ${F('a × c', 'b × d')} &nbsp; (numérateur × numérateur, dénominateur × dénominateur)</div>
<div class="cols"><div class="methode"><b>Méthode</b><ol><li>Multiplie les numérateurs entre eux.</li><li>Multiplie les dénominateurs entre eux.</li><li>Simplifie le résultat.</li><li>Astuce : on peut simplifier <b>avant</b> de multiplier, un nombre du haut avec un nombre du bas.</li></ol></div>
${areaFrac(2, 3, 4, 5, '8 cases sur 15')}</div>
<div class="ex"><span class="q">Exemple 1 : ${F(2, 3)} × ${F(4, 5)}</span><br>${F('2 × 4', '3 × 5')} = ${F(8, 15)}. Sur le carré : 8 cases violettes sur 15.</div>
<div class="ex"><span class="q">Exemple 2 : ${F(3, 4)} × ${F(2, 9)}</span><br>${F('3 × 2', '4 × 9')} = ${F(6, 36)} = ${F(1, 6)}.<br>Ou avant : 3 avec 9 (÷ 3) et 2 avec 4 (÷ 2) : ${F('1 × 1', '2 × 3')} = ${F(1, 6)}.</div>
<div class="ex"><span class="q">Exemple 3 : ${F(6, 5)} × ${F(5, 3)}</span><br>${F('6 × 5', '5 × 3')} = ${F(30, 15)} = 2.</div>
<div class="warn">⚠️ Pour multiplier, <b>pas besoin</b> de même dénominateur (c'est seulement pour + et −).<br>⚠️ N'additionne pas : ${F(2, 3)} × ${F(4, 5)} n'est pas ${F(6, 8)}.</div>
<div class="retenir">À retenir : haut × haut, bas × bas, puis je simplifie.</div>`;
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
<p class="intro">Des tiers et des quarts n'ont pas la même taille : on les redécoupe tous en douzièmes pour pouvoir les additionner.</p>
<div class="def">On cherche un <b>dénominateur commun</b> : un nombre qui est un multiple des deux dénominateurs, le plus petit possible.</div>
<div class="cols"><div class="methode"><b>Méthode</b><ol><li>Récite la table du plus grand dénominateur jusqu'à trouver un multiple de l'autre (4, 8, 12 → 12 est dans la table de 3).</li><li>Écris chaque fraction avec ce dénominateur.</li><li>Additionne (ou soustrais) les numérateurs.</li><li>Simplifie si possible.</li></ol></div>
${bars([{ b: 3, segs: [[2, C_BLUE]], l: [2, 3] }, { b: 4, segs: [[1, C_ORA]], l: [1, 4] }, { b: 12, segs: [[8, C_BLUE], [3, C_ORA]], l: [11, 12] }])}</div>
<div class="ex"><span class="q">Exemple 1 : ${F(2, 3)} + ${F(1, 4)}</span><br>12 est dans la table de 3 et de 4. ${F(2, 3)} = ${F(8, 12)} et ${F(1, 4)} = ${F(3, 12)}, donc la somme vaut ${F(11, 12)}.</div>
<div class="ex"><span class="q">Exemple 2 : ${F(5, 6)} − ${F(3, 4)}</span><br>Table de 6 : 6, 12 → 12. ${F(10, 12)} − ${F(9, 12)} = ${F(1, 12)}.</div>
<div class="ex"><span class="q">Exemple 3 : ${F(3, 4)} + ${F(1, 6)}</span><br>12 suffit (pas besoin de 24) : ${F(9, 12)} + ${F(2, 12)} = ${F(11, 12)}.</div>
<div class="warn">⚠️ ${F(2, 3)} + ${F(1, 4)} n'est pas ${F(3, 7)} : on n'additionne jamais les dénominateurs.<br>⚠️ Le produit des dénominateurs marche toujours, mais donne de grands nombres : pense à simplifier à la fin.</div>
<div class="retenir">À retenir : même dénominateur d'abord, puis j'additionne les numérateurs.</div>`;
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
<p class="intro">La racine carrée fait le chemin inverse du carré : si un carré a une aire de 49, son côté mesure √49 = 7.</p>
<div class="def">Pour un nombre a ≥ 0, ${R('a')} est le nombre <b>positif</b> dont le carré vaut a.<br>Carrés à connaître : 1, 4, 9, 16, 25, 36, 49, 64, 81, 100, 121, 144, 169, 196, 225.</div>
<div class="cols"><div class="methode"><b>Méthode</b><ol><li>Cherche le nombre dans la liste des carrés.</li><li>Grand nombre terminé par 00 : ${R(3600)} = ${R(36)} × 10 = 60.</li><li>Produit de racines : calcule chaque racine, puis multiplie.</li><li>Vérifie : ton résultat × lui-même redonne le nombre.</li></ol></div>
${sqGrid(7, '7 × 7 = 49, donc √49 = 7')}</div>
<div class="ex"><span class="q">Exemple 1 : ${R(49)} et ${R(144)}</span><br>${R(49)} = 7 car 7 × 7 = 49 ; ${R(144)} = 12 car 12 × 12 = 144.</div>
<div class="ex"><span class="q">Exemple 2 : ${R(3600)}</span><br>36 = 6 × 6, donc 3600 = 60 × 60 et ${R(3600)} = <b>60</b>.</div>
<div class="ex"><span class="q">Exemple 3 : ${R(16)} × ${R(9)}</span><br>4 × 3 = <b>12</b>. Cas particuliers : ${R(1)} = 1 et ${R(0)} = 0.</div>
<div class="warn">⚠️ ${R(16)} n'est pas 8 (la moitié) : c'est 4, car 4 × 4 = 16.<br>⚠️ ${R(3600)} n'est pas 600 : 600 × 600 = 360 000.</div>
<div class="retenir">À retenir : ${R('a')}, c'est le nombre positif qui, multiplié par lui-même, donne a.</div>`;
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
<p class="intro">On met au carré, ou on prend la racine, d'une fraction en travaillant séparément en haut et en bas.</p>
<div class="def">(${F('a', 'b')})<sup>2</sup> = ${F('a<sup>2</sup>', 'b<sup>2</sup>')} &nbsp;&nbsp;&nbsp; ${R(F('a', 'b'))} = ${F(R('a'), R('b'))} &nbsp; (a ≥ 0, b &gt; 0)</div>
<div class="cols"><div class="methode"><b>Méthode</b><ol><li>Carré : mets au carré le numérateur <b>et</b> le dénominateur.</li><li>Racine : prends la racine du haut et celle du bas.</li><li>Avec un produit : calcule d'abord la racine, puis multiplie les fractions (haut × haut, bas × bas).</li></ol></div>
${areaFrac(2, 3, 2, 3, '4 cases sur 9')}</div>
<div class="ex"><span class="q">Exemple 1 : (${F(2, 3)})<sup>2</sup></span><br>${F('2 × 2', '3 × 3')} = ${F(4, 9)} : le carré montre 4 cases sur 9.</div>
<div class="ex"><span class="q">Exemple 2 : ${R(F(25, 36))}</span><br>${R(25)} = 5 et ${R(36)} = 6, donc ${R(F(25, 36))} = ${F(5, 6)}.</div>
<div class="ex"><span class="q">Exemple 3 : ${R(F(9, 16))} × ${F(2, 5)}</span><br>${F(3, 4)} × ${F(2, 5)} = ${F(6, 20)} = ${F(3, 10)}.</div>
<div class="warn">⚠️ (${F(2, 3)})<sup>2</sup> n'est pas ${F(4, 6)} : on met au carré le haut <b>et</b> le bas.<br>⚠️ ${R(F(25, 36))} n'est pas ${F(5, 36)} : la racine porte aussi sur le dénominateur.</div>
<div class="retenir">À retenir : carré ou racine, je l'applique en haut et en bas.</div>`;
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
<p class="intro">On mélange tout ce qui précède, souvent dans des problèmes. Prends le temps de lire l'énoncé et d'écrire les étapes au brouillon.</p>
<div class="def">Ordre des opérations : <b>racines et carrés</b>, puis <b>× et ÷</b>, puis <b>+ et −</b>.<br>« Le reste » : le tout vaut 1, que l'on écrit ${F('d', 'd')} pour avoir le bon dénominateur.</div>
<div class="cols"><div class="methode"><b>Méthode</b><ol><li>Repère le tout et les parts déjà connues.</li><li>Écris le calcul complet avant de calculer.</li><li>Respecte les priorités.</li><li>Vérifie que la réponse a du sens (le reste est plus petit que 1…).</li></ol></div>
${bars([{ b: 6, segs: [[2, C_BLUE], [1, C_ORA], [3, C_GRN]], l: '1', txt: ['vélo', 'vélo', 'bus', 'pied', 'pied', 'pied'], fs: 13 }], { cap: 'à pied : 3 parts sur 6' })}</div>
<div class="ex"><span class="q">Exemple 1 : ${F(1, 2)} + ${F(1, 3)} × ${F(3, 4)}</span><br>× d'abord : ${F(1, 3)} × ${F(3, 4)} = ${F(3, 12)} = ${F(1, 4)}. Puis ${F(1, 2)} + ${F(1, 4)} = ${F(2, 4)} + ${F(1, 4)} = ${F(3, 4)}.</div>
<div class="ex"><span class="q">Exemple 2 : ${F(1, 3)} du trajet à vélo, ${F(1, 6)} en bus, le reste à pied</span><br>1 − ${F(1, 3)} − ${F(1, 6)} = ${F(6, 6)} − ${F(2, 6)} − ${F(1, 6)} = ${F(3, 6)} = ${F(1, 2)}.</div>
<div class="ex"><span class="q">Exemple 3 : un club de 30 membres, les ${F(2, 5)} sont des filles</span><br>Filles : 30 ÷ 5 × 2 = 12. Garçons : 30 − 12 = <b>18</b>.</div>
<div class="warn">⚠️ Une fraction « des filles » se calcule sur le <b>total</b>, pas sur les garçons.<br>⚠️ Dans ${F(1, 2)} + ${F(1, 3)} × ${F(3, 4)}, la multiplication passe avant l'addition.</div>
<div class="retenir">À retenir : je lis, j'écris le calcul en entier, puis je respecte les priorités.</div>`;
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

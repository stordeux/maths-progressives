// Aires, périmètres, volumes : 12 niveaux, du comptage de carreaux aux boules et aux agrandissements.
// Une figure SVG générée pour chaque exercice (draw.js). Réponses décimales (virgule), jamais négatives.
// Vérification indépendante : `value` est recalculée autrement que la réponse attendue (comptage effectif
// des carreaux de la grille, formule de l'aire d'un polygone par ses sommets, formules avec le diamètre,
// méthode de Simpson sur les sections pour les volumes, conversions par puissances de 10 en flottants),
// et `verify` contrôle la cohérence de l'arrondi demandé.
import { ri, pick, chance } from '../../engine/util/rand.js';
import { numsCheck } from '../../engine/answers/checks.js';
import { approx, r6, decimals } from '../../engine/util/arith.js';
import { M, F } from '../../engine/util/fmt.js';
import * as D from './draw.js';

/* ================= outils ================= */
const KEYS = { comma: true, neg: false };
const NB = ' ';
const PREC = ["à l'unité", 'au dixième', 'au centième', 'au millième'];
const PI = Math.PI;
/** nombre à la française, chiffres groupés par 3 à partir de 1 000 */
const N = x => {
  const [i, dp] = M(x).split(',');
  const g = i.length > 3 ? i.replace(/\B(?=(\d{3})+(?!\d))/g, ' ') : i;
  return dp ? `${g},${dp}` : g;
};
const U = (x, u) => `${N(x)}${NB}${u}`;
const rnd = (x, p) => r6(Math.round(x * 10 ** p) / 10 ** p);
const trunc = (x, p) => r6(Math.floor(x * 10 ** p + 1e-9) / 10 ** p);
const dots = x => `${N(trunc(x, 3))}…`; // valeur exacte tronquée, pour les corrections
const dec = (a, b, st) => r6(ri(Math.round(a / st), Math.round(b / st)) * st);
const big = s => `<div class="big">${s}</div>`;
/** aire d'un polygone par ses sommets (formule du lacet) */
const lacet = pts => Math.abs(pts.reduce((s, p, i) => { const q = pts[(i + 1) % pts.length]; return s + p[0] * q[1] - q[0] * p[1]; }, 0)) / 2;
/** périmètre d'un polygone par ses sommets */
const tour = pts => pts.reduce((s, p, i) => { const q = pts[(i + 1) % pts.length]; return s + Math.hypot(q[0] - p[0], q[1] - p[1]); }, 0);
/** volume par la méthode de Simpson sur l'aire des sections S(y), y ∈ [a ; b] (exacte pour nos solides) */
const simpson = (S, a, b) => (b - a) / 6 * (S(a) + 4 * S((a + b) / 2) + S(b));
const rect = (L, l) => [[0, 0], [L, 0], [L, l], [0, l]];
const arrondi = p => `Arrondis le résultat <b>${PREC[p]}</b>.`;

/** message « presque juste » pour la réponse x (attendu E) */
function presque(x, E, o) {
  if (x === null || x === undefined || !isFinite(x)) return '';
  if (o.fn) { const m = o.fn(x); if (m) return m; }
  const p = o.p;
  for (const [a, m] of o.alts || []) {
    if (!isFinite(a) || Math.abs(a - E) < (p === undefined ? 1e-9 : 2 * 10 ** -p)) continue;
    if (Math.abs(x - a) < 1e-6 * Math.max(1, Math.abs(a)) || (p !== undefined && Math.abs(x - a) < 10 ** -p)) return m;
  }
  if (p !== undefined && o.exact !== undefined) {
    const ex = o.exact;
    if (Math.abs(x - ex) < 10 ** -p) {
      if (decimals(x) > p) return `Bonne valeur ! Il reste à l'arrondir ${PREC[p]} (${p ? (p === 1 ? 'un seul chiffre' : p + ' chiffres') + ' après la virgule' : 'pas de virgule'}).`;
      if (approx(x, trunc(ex, p))) return "Presque ! Tu as coupé au lieu d'arrondir : regarde le chiffre suivant ; s'il vaut 5 ou plus, on arrondit au-dessus.";
      return `Presque ! Vérifie ton arrondi ${PREC[p]}.`;
    }
    for (let q = 0; q < p; q++) if (approx(x, rnd(ex, q))) return `C'est arrondi trop grossièrement : on demande l'arrondi ${PREC[p]}.`;
  }
  if (o.pow10 !== false && E > 0 && x > 0) {
    const k = Math.round(Math.log10(x / E));
    if (k !== 0 && Math.abs(x - E * 10 ** k) < 1e-6 * Math.max(x, 1)) return `Les chiffres sont bons, mais ton résultat est ${N(10 ** Math.abs(k))} fois trop ${k > 0 ? 'grand' : 'petit'}. Vérifie les unités et la place de la virgule.`;
  }
  return '';
}
/** question à une case numérique */
function Q(o) {
  return {
    type: 'nums', keys: KEYS, html: o.html, visual: o.visual || '', afterVisual: o.after || '', replaceVisual: !!o.after,
    tpl: o.tpl, check: numsCheck([o.E], { msg: v => presque(v[0], o.E, o) }), expected: [o.E],
    value: o.value, verify: o.verify, hint: o.hint, solution: o.solution,
  };
}
/** arrondi demandé à p décimales : valeur et vérification à partir d'un calcul indépendant */
const arr = (p, indep) => ({
  value: rnd(indep, p),
  verify: E => approx(E[0] * 10 ** p, Math.round(E[0] * 10 ** p), 1e-6) && Math.abs(E[0] - indep) <= 0.5 * 10 ** -p + 1e-9,
});

/* ================= 1. compter les carreaux ================= */
function grille(d) {
  const W = 10, H = 7;
  for (;;) {
    const set = new Set(), put = (x, y) => set.add(`${x},${y}`);
    let A0, P0, info;
    if (d < 1) {
      const a = ri(2, 6), b = ri(2, 4), x0 = ri(1, W - a - 1), y0 = ri(1, H - b - 1);
      for (let i = 0; i < a; i++) for (let j = 0; j < b; j++) put(x0 + i, y0 + j);
      A0 = a * b; P0 = 2 * (a + b); info = { rect: [a, b] };
    } else if (d < 2 || chance(0.3)) {
      const a = ri(3, 7), b = ri(3, 5), c = ri(1, a - 2), e = ri(1, b - 1), cn = ri(0, 3), x0 = ri(1, W - a - 1), y0 = ri(1, H - b - 1);
      for (let i = 0; i < a; i++) for (let j = 0; j < b; j++) {
        const out = (cn & 1 ? i >= a - c : i < c) && (cn & 2 ? j >= b - e : j < e);
        if (!out) put(x0 + i, y0 + j);
      }
      A0 = a * b - c * e; P0 = 2 * (a + b); info = {};
    } else {
      const n = ri(6, d < 3 ? 10 : 13), list = [[ri(3, 6), ri(2, 4)]];
      put(...list[0]);
      while (set.size < n) {
        const [x, y] = pick(list), [dx, dy] = pick([[1, 0], [-1, 0], [0, 1], [0, -1]]), X = x + dx, Y = y + dy;
        if (X < 1 || X > W - 2 || Y < 1 || Y > H - 2 || set.has(`${X},${Y}`)) continue;
        put(X, Y); list.push([X, Y]);
      }
      // pas de trou : tous les carreaux vides doivent être reliés au bord
      const seen = new Set(['0,0']), st = [[0, 0]];
      while (st.length) {
        const [x, y] = st.pop();
        for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
          const X = x + dx, Y = y + dy, k = `${X},${Y}`;
          if (X < 0 || X >= W || Y < 0 || Y >= H || seen.has(k) || set.has(k)) continue;
          seen.add(k); st.push([X, Y]);
        }
      }
      if (seen.size !== W * H - n) continue;
      let adj = 0;
      for (const k of set) { const [x, y] = k.split(',').map(Number); if (set.has(`${x + 1},${y}`)) adj++; if (set.has(`${x},${y + 1}`)) adj++; }
      A0 = n; P0 = 4 * n - 2 * adj; info = {};
    }
    const mat = [...Array(H)].map((_, y) => [...Array(W)].map((_, x) => set.has(`${x},${y}`)));
    return { mat, A0, P0, info };
  }
}
/** comptage effectif sur la grille dessinée */
function compte(mat) {
  const H = mat.length, W = mat[0].length, on = (x, y) => y >= 0 && y < H && x >= 0 && x < W && mat[y][x];
  let A = 0, hz = 0, vt = 0, bord = 0; const lignes = [];
  for (let y = 0; y < H; y++) {
    let c = 0;
    for (let x = 0; x < W; x++) {
      if (!mat[y][x]) continue;
      A++; c++;
      const h = !on(x, y - 1) + !on(x, y + 1), v = !on(x - 1, y) + !on(x + 1, y);
      hz += h; vt += v; if (h + v) bord++;
    }
    if (c) lignes.push(c);
  }
  return { A, P: hz + vt, hz, vt, bord, lignes };
}
function L1(d) {
  const { mat, A0, P0, info } = grille(d), c = compte(mat);
  const both = d >= 3, q = both ? 'AP' : pick(['A', 'P']);
  const intro = "Sur ce quadrillage, l'unité d'aire est <b>un carreau</b> et l'unité de longueur est <b>le côté d'un carreau</b>.<br>";
  const solA = info.rect ? `${info.rect[1]} lignes de ${info.rect[0]} carreaux : ${info.rect[1]} × ${info.rect[0]} = ${A0} carreaux.` : `Ligne par ligne : ${c.lignes.join(' + ')} = ${A0} carreaux.`;
  const solP = info.rect ? `On fait le tour : ${info.rect[0]} + ${info.rect[1]} + ${info.rect[0]} + ${info.rect[1]} = ${P0} côtés de carreau.` : `On fait le tour : ${c.hz} côtés horizontaux et ${c.vt} côtés verticaux, soit ${c.hz} + ${c.vt} = ${P0} côtés de carreau.`;
  const hA = "L'aire, c'est la surface : compte les carreaux coloriés, ligne par ligne pour n'en oublier aucun.";
  const hP = "Le périmètre, c'est la longueur du tour : suis le bord épais avec ton doigt et compte les côtés de carreau. Un carreau dans un coin compte pour 2 côtés.";
  const msgBord = 'Tu as compté les carreaux du bord. Il faut compter les <b>côtés</b> de carreau sur le tour : un carreau de coin compte pour 2.';
  const visual = D.quadrillage(mat);
  if (both) {
    return {
      type: 'nums', keys: KEYS, visual, html: intro + "Donne l'<b>aire</b> et le <b>périmètre</b> de la figure coloriée.",
      tpl: 'Aire = {0} carreaux<br>Périmètre = {1} côtés de carreau', labels: ['aire', 'périmètre'],
      check: numsCheck([A0, P0], { msg: v => (v[0] === P0 && v[1] === A0 ? "Tu as inversé l'aire et le périmètre !" : v[1] === c.bord && c.bord !== P0 ? msgBord : '') }),
      expected: [A0, P0], value: c.P, verify: E => E[0] === c.A && E[1] === c.P,
      hint: `${hA}<br>${hP}`, solution: `Aire : ${solA}<br>Périmètre : ${solP}`,
    };
  }
  if (q === 'A') return Q({ visual, html: intro + "Quelle est l'<b>aire</b> de la figure coloriée ?", tpl: 'Aire = {0} carreaux', E: A0, value: c.A, pow10: false,
    alts: [[P0, "Ça, c'est le périmètre (le tour). L'aire, c'est le nombre de carreaux coloriés."]], hint: hA, solution: solA });
  return Q({ visual, html: intro + 'Quel est le <b>périmètre</b> de la figure coloriée ?', tpl: 'Périmètre = {0} côtés de carreau', E: P0, value: c.P, pow10: false,
    alts: [[A0, "Ça, c'est l'aire (les carreaux à l'intérieur). Le périmètre, c'est le nombre de côtés de carreau sur le tour."], [c.bord, msgBord]], hint: hP, solution: solP });
}
/** fenêtre Cours : affiche une figure plus petite (largeur en pixels) */
const petit = (svg, w) => svg.replace(/style="width:[\d.]+px"/, `style="width:${w}px;max-width:min(${w}px, 100%)"`);
function C1() {
  const ex = [[false, false, false, false, false, false], [false, true, true, true, true, false], [false, true, true, false, false, false], [false, false, false, false, false, false]];
  const rec = [...Array(5)].map((_, y) => [...Array(7)].map((_, x) => x >= 1 && x <= 5 && y >= 1 && y <= 3));
  return `<h2>1. Compter les carreaux</h2>
<p class="intro">Sur un quadrillage, on mesure une surface en comptant des carreaux, et un tour en comptant des côtés de carreau. Ce sont les deux grandeurs de base : l'aire et le périmètre.</p>
<div class="def">L'<b>aire</b> d'une figure, c'est la place qu'occupe sa surface : on compte les <b>carreaux</b> à l'intérieur.<br>
Le <b>périmètre</b>, c'est la longueur de son <b>tour</b> : on compte les <b>côtés de carreau</b> sur le bord.</div>
<div class="cols">${D.quadrillage(rec, 'rectangle de 5 carreaux sur 3')}${D.quadrillage(ex, 'figure de 6 carreaux')}</div>
<div class="methode"><b>Méthode</b><ol><li><b>Aire</b> : compte les carreaux ligne par ligne, puis additionne. Pour un rectangle : nombre de lignes × nombre de carreaux par ligne.</li><li><b>Périmètre</b> : suis le bord épais avec ton doigt et compte les côtés de carreau.</li><li>Pour ne rien oublier, compte d'abord les côtés <b>horizontaux</b>, puis les côtés <b>verticaux</b>, et additionne.</li></ol></div>
<div class="ex"><span class="q">Exemple 1 : le rectangle de 5 carreaux sur 3 (à gauche).</span><br>Aire : 3 lignes de 5 carreaux, 3 × 5 = <b>15 carreaux</b>.<br>Périmètre : 5 + 3 + 5 + 3 = <b>16 côtés de carreau</b>.</div>
<div class="ex"><span class="q">Exemple 2 : la figure en escalier (à droite).</span><br>Aire : 4 + 2 = <b>6 carreaux</b>.<br>Périmètre : 8 côtés horizontaux et 4 côtés verticaux, soit <b>12 côtés de carreau</b>.</div>
<div class="warn">⚠️ Ne confonds pas <b>aire</b> (l'intérieur) et <b>périmètre</b> (le tour).<br>⚠️ Pour le périmètre, on compte des côtés, pas des carreaux du bord : un carreau dans un coin apporte 2 côtés.<br>⚠️ Quand on te demande les deux, vérifie que tu ne les as pas inversés dans les cases.</div>
<div class="retenir">À retenir : aire = carreaux à l'intérieur ; périmètre = côtés de carreau sur le tour.</div>`;
}

/* ================= 2. rectangle et carré ================= */
function L2(d) {
  const u = d < 1 ? 'cm' : pick(['cm', 'm', 'mm']), st = d < 2 ? 1 : d < 3 ? 0.5 : 0.1;
  if (d >= 3 && chance(0.35)) {
    if (chance(0.5)) { // carré dont on connaît le périmètre
      const c = dec(2, 15, 0.5), P = r6(4 * c), E = r6((P / 4) ** 2);
      return Q({ visual: D.rectangle(c, c, '?', '', { carre: true }), html: `Un carré a un périmètre de ${U(P, u)}. Quelle est son <b>aire</b> ?`,
        tpl: `A = {0} ${u}²`, E, value: r6(lacet(rect(c, c))),
        alts: [[c, "Ça, c'est la longueur du côté. Il reste à calculer l'aire : côté × côté."], [r6((P / 2) ** 2), 'Un carré a 4 côtés : le côté vaut P ÷ 4.'], [r6(P * P), "Commence par trouver le côté : P ÷ 4."]],
        hint: `Trouve d'abord le côté : un carré a 4 côtés égaux, donc côté = périmètre ÷ 4. Puis aire = côté × côté.`,
        solution: `Côté : ${N(P)} ÷ 4 = ${U(c, u)}. Aire : ${N(c)} × ${N(c)} = ${U(E, u + '²')}.` });
    }
    const L = ri(4, 15), l = dec(1, L - 1, 0.5), A = r6(L * l), E = r6(A / L);
    return Q({ visual: D.rectangle(L, l, U(L, u), '?'), html: `Un rectangle a une aire de ${U(A, u + '²')} et une longueur de ${U(L, u)}. Quelle est sa <b>largeur</b> ?`,
      tpl: `l = {0} ${u}`, E, value: l,
      alts: [[r6(A - L), "On ne soustrait pas : aire = longueur × largeur, donc largeur = aire ÷ longueur."], [r6(A / 2 - L), "Ça, c'est avec le périmètre. Ici, on connaît l'aire : largeur = aire ÷ longueur."]],
      hint: 'Aire = longueur × largeur. On cherche donc le nombre qui, multiplié par la longueur, donne l\'aire : c\'est une division.',
      solution: `${N(L)} × l = ${N(A)}, donc l = ${N(A)} ÷ ${N(L)} = ${U(E, u)}.` });
  }
  const carre = chance(0.35), L = dec(3, d < 1 ? 10 : 20, st), l = carre ? L : dec(1, L - st, st);
  const q = pick(['A', 'P']), pts = rect(L, l);
  const E = q === 'A' ? r6(L * l) : r6(2 * (L + l)), value = r6(q === 'A' ? lacet(pts) : tour(pts));
  const nom = carre ? `un carré de côté ${U(L, u)}` : `un rectangle de longueur ${U(L, u)} et de largeur ${U(l, u)}`;
  const alts = q === 'A'
    ? [[r6(2 * (L + l)), "Ça, c'est le périmètre (le tour). L'aire, c'est " + (carre ? 'côté × côté.' : 'longueur × largeur.')], [r6(L + l), "Pour l'aire, on multiplie (on n'additionne pas)."], [r6(2 * L), carre ? 'côté × côté, ce n\'est pas côté × 2.' : '']]
    : [[r6(L * l), "Ça, c'est l'aire. Le périmètre, c'est la longueur du tour."], [r6(L + l), "Tu as fait la moitié du tour : il y a deux longueurs et deux largeurs."], [carre ? r6(2 * L) : NaN, 'Un carré a 4 côtés.']];
  return Q({
    visual: D.rectangle(L, l, U(L, u), carre ? '' : U(l, u), { carre }), html: `Voici ${nom}.<br>Calcule son <b>${q === 'A' ? 'aire' : 'périmètre'}</b>.`,
    tpl: q === 'A' ? `A = {0} ${u}²` : `P = {0} ${u}`, E, value, alts: alts.filter(a => a[1]),
    hint: q === 'A' ? (carre ? 'Aire du carré = côté × côté. L\'unité est le ' + u + '².' : 'Aire du rectangle = longueur × largeur. L\'unité est le ' + u + '².')
      : (carre ? 'Périmètre du carré = 4 × côté.' : 'Périmètre du rectangle = 2 × (longueur + largeur) : c\'est le tour complet.'),
    solution: q === 'A' ? `A = ${N(L)} × ${N(l)} = ${U(E, u + '²')}.` : carre ? `P = 4 × ${N(L)} = ${U(E, u)}.` : `P = ${N(L)} + ${N(l)} + ${N(L)} + ${N(l)} = 2 × (${N(L)} + ${N(l)}) = ${U(E, u)}.`,
  });
}
function C2() {
  return `<h2>2. Rectangle et carré</h2>
<p class="intro">Plus besoin de compter : pour un rectangle ou un carré, deux formules donnent directement le périmètre et l'aire.</p>
<div class="def"><b>Rectangle</b> de longueur L et de largeur l : &nbsp; P = 2 × (L + l) &nbsp;&nbsp; A = L × l<br>
<b>Carré</b> de côté c : &nbsp; P = 4 × c &nbsp;&nbsp; A = c × c</div>
<div class="cols">${D.rectangle(5, 3, '5 cm', '3 cm')}${D.rectangle(5, 5, '5 cm', '', { carre: true })}</div>
<div class="methode"><b>Méthode</b><ol><li>Lis bien ce qu'on demande : le <b>périmètre</b> (le tour) ou l'<b>aire</b> (la surface).</li><li>Applique la formule, avec des longueurs dans la même unité.</li><li>Écris l'unité : cm, m, mm pour un périmètre ; cm², m², mm² pour une aire.</li><li>Si on te donne l'aire ou le périmètre, fais l'opération inverse (division).</li></ol></div>
<div class="ex"><span class="q">Exemple 1 : rectangle de 5 cm sur 3 cm.</span><br>P = 2 × (5 + 3) = 2 × 8 = <b>16 cm</b> et A = 5 × 3 = <b>15 cm²</b>.</div>
<div class="ex"><span class="q">Exemple 2 : un carré a un périmètre de 20 cm. Son aire ?</span><br>Côté : 20 ÷ 4 = 5 cm. Aire : 5 × 5 = <b>25 cm²</b>.</div>
<div class="ex"><span class="q">Exemple 3 : un rectangle a une aire de 24 m² et une longueur de 6 m. Sa largeur ?</span><br>6 × l = 24, donc l = 24 ÷ 6 = <b>4 m</b>.</div>
<div class="warn">⚠️ Un périmètre est une <b>longueur</b> (cm, m) ; une aire se mesure en <b>unités d'aire</b> (cm², m²).<br>⚠️ Aire du carré : c × c, et non c × 2. Périmètre du rectangle : il y a <b>deux</b> longueurs et <b>deux</b> largeurs.<br>⚠️ Pour retrouver une largeur, on <b>divise</b> l'aire par la longueur ; on ne soustrait pas.</div>
<div class="retenir">À retenir : P = 2 × (L + l) et A = L × l ; carré : P = 4 × c et A = c × c.</div>`;
}

/* ================= 3. aire du triangle ================= */
const TRIP = [[3, 4], [4, 3], [6, 8], [8, 6], [5, 12], [12, 5], [9, 12], [12, 9]];
function L3(d) {
  const u = d < 1 ? 'cm' : pick(['cm', 'm', 'mm']);
  let b, h, f, side = 0, intro = '';
  if (d < 1) { b = ri(3, 12); h = ri(2, 10); f = chance(0.5) ? 0 : b; intro = `ABC est rectangle en ${f ? 'B' : 'A'}. `; }
  else if (d < 2) { b = ri(5, 14); h = ri(3, 10); f = ri(1, b - 1); }
  else {
    const [o, hh] = pick(TRIP); h = hh; side = Math.hypot(o, hh);
    if (chance(0.5)) { b = o + ri(2, 8); f = o; } else { b = ri(3, 10); f = -o; intro = 'La hauteur issue de C tombe en dehors du triangle. '; }
    if (d >= 3) b = r6(b + pick([0.5, 0.2, 0.6, 0]));
  }
  const E = r6(b * h / 2), value = r6(lacet([[0, 0], [b, 0], [f, h]]));
  return Q({
    visual: D.triangle(b, h, f, { b: U(b, u), h: U(h, u), side: side ? U(side, u) : '' }),
    html: `${intro}Calcule l'<b>aire</b> du triangle ABC.`, tpl: `A = {0} ${u}²`, E, value,
    alts: [[r6(b * h), "Tu as oublié de diviser par 2 : un triangle, c'est la moitié d'un rectangle."],
      [side ? r6(b * side / 2) : NaN, "Tu as pris le côté [AC] : il faut la <b>hauteur</b>, perpendiculaire à la base (en pointillés)."],
      [side ? r6(b * side) : NaN, "Il faut la hauteur (perpendiculaire à la base), et diviser par 2."], [r6(b + h), 'On multiplie la base par la hauteur, puis on divise par 2.']],
    hint: `Aire du triangle = base × hauteur ÷ 2. La hauteur est ${f === 0 || f === b ? 'le côté perpendiculaire à la base' : 'le segment en pointillés, perpendiculaire à la base'}.`,
    solution: `Base AB = ${U(b, u)}, hauteur ${f === 0 ? 'AC' : f === b ? 'BC' : 'CH'} = ${U(h, u)}.<br>A = ${N(b)} × ${N(h)} ÷ 2 = ${N(r6(b * h))} ÷ 2 = ${U(E, u + '²')}.`,
  });
}
function C3() {
  return `<h2>3. Aire du triangle</h2>
<p class="intro">Un triangle, c'est la moitié d'un rectangle bien choisi. Toute la difficulté est de trouver la bonne <b>hauteur</b>.</p>
<div class="def">A = <b>base × hauteur ÷ 2</b>. La <b>hauteur</b> issue d'un sommet est le segment qui part de ce sommet et arrive <b>perpendiculairement</b> sur le côté opposé (la base), éventuellement prolongé.</div>
<div class="cols">${D.triangle(6, 4, 2, { b: '6 cm', h: '4 cm' })}${D.triangle(5, 4, -3, { b: '5 cm', h: '4 cm', side: '5 cm' })}</div>
<div class="methode"><b>Méthode</b><ol><li>Choisis la base (souvent le côté du bas).</li><li>Repère la hauteur : le segment en pointillés, avec l'angle droit sur la base.</li><li>Calcule base × hauteur, puis divise par 2.</li><li>Écris l'unité d'aire (cm², m²…).</li></ol></div>
<div class="ex"><span class="q">Exemple 1 : base AB = 6 cm, hauteur CH = 4 cm.</span><br>A = 6 × 4 ÷ 2 = 24 ÷ 2 = <b>12 cm²</b>.<br>Pourquoi ÷ 2 ? Le triangle est la moitié du rectangle de 6 cm sur 4 cm.</div>
<div class="ex"><span class="q">Exemple 2 (piège) : base AB = 5 cm, hauteur CH = 4 cm, côté [AC] = 5&nbsp;cm.</span><br>La hauteur tombe en dehors du triangle : on prolonge la base jusqu'à H. On utilise la hauteur, pas le côté penché : A = 5 × 4 ÷ 2 = <b>10 cm²</b> (et non 5 × 5 ÷ 2).</div>
<div class="ex"><span class="q">Exemple 3 : triangle rectangle de côtés de l'angle droit 3 cm et 8 cm.</span><br>Un côté de l'angle droit sert de hauteur pour l'autre : A = 3 × 8 ÷ 2 = <b>12 cm²</b>.</div>
<div class="warn">⚠️ Ne prends pas un côté penché pour la hauteur : la hauteur fait un angle droit avec la base.<br>⚠️ N'oublie pas le « ÷ 2 ».<br>⚠️ On multiplie base et hauteur : on ne les additionne pas.</div>
<div class="retenir">À retenir : aire du triangle = base × hauteur ÷ 2, avec la hauteur perpendiculaire à la base.</div>`;
}

/* ================= 4. le disque ================= */
function L4(d) {
  const u = d < 1 ? 'cm' : pick(['cm', 'm', 'mm']), r = ri(2, d < 2 ? 10 : 15), Dm = 2 * r;
  const mode = d < 2 ? 'r' : pick(['r', 'd']), q = d < 1 ? 'P' : pick(['P', 'A']);
  const visual = D.disque(mode, U(mode === 'r' ? r : Dm, u));
  const donne = `Un disque a un ${mode === 'r' ? 'rayon' : 'diamètre'} de ${U(mode === 'r' ? r : Dm, u)}.<br>Calcule son <b>${q === 'P' ? 'périmètre' : 'aire'}</b>`;
  const hint = (q === 'P' ? 'Périmètre du cercle : P = 2 × π × r = π × d.' : 'Aire du disque : A = π × r × r, avec le <b>rayon</b>.') + (mode === 'd' ? ' Ici on donne le diamètre : le rayon en est la moitié.' : '');
  const uu = q === 'P' ? u : u + '²';
  const altsFor = pi => q === 'P'
    ? [[pi * r, "Tu as pris le rayon à la place du diamètre : P = π × d = 2 × π × r."], [pi * r * r, "Ça, c'est l'aire ! Le périmètre, c'est π × d."], [mode === 'd' ? 2 * pi * Dm : NaN, 'Tu as doublé le diamètre : P = π × d (ou 2 × π × r).']]
    : [[pi * Dm * Dm, "Tu as utilisé le diamètre : l'aire, c'est π × r × r avec le <b>rayon</b> (la moitié du diamètre)."], [pi * Dm, "Ça, c'est le périmètre (ou tu as calculé r × 2 au lieu de r × r)."], [pi * r, 'r² = r × r : il faut multiplier le rayon par lui-même.']];
  if (d < 2) { // π ≈ 3,14 : résultat décimal exact
    const E = q === 'P' ? r6(314 * Dm / 100) : r6(314 * r * r / 100), value = q === 'P' ? r6(2 * 3.14 * r) : r6(3.14 * Dm * Dm / 4);
    return Q({ visual, html: `${donne}, en prenant π ≈ 3,14.`, tpl: `${q} ≈ {0} ${uu}`, E, value, alts: altsFor(3.14).map(([a, m]) => [r6(a), m]), hint,
      solution: q === 'P' ? `P = 2 × π × r ≈ 2 × 3,14 × ${r} = ${U(E, u)}.` : `A = π × r × r ≈ 3,14 × ${r} × ${r} = ${U(E, uu)}.` });
  }
  if (d >= 3 && chance(0.3)) { // valeur exacte en fonction de π
    const E = q === 'P' ? Dm : r * r, value = q === 'P' ? r6(PI * Dm / PI) : r6(PI * Dm * Dm / 4 / PI);
    return Q({ visual, html: `${donne} : donne la <b>valeur exacte</b>, en fonction de π.`, tpl: `${q} = {0} π ${uu}`, E, value, pow10: false,
      alts: q === 'P' ? [[r, 'P = 2 × π × r : le nombre devant π est 2 × r.'], [r * r, "Ça, c'est le nombre de l'aire."]] : [[Dm * Dm, 'Avec le rayon : A = π × r².'], [Dm, 'r² = r × r, pas r × 2.']],
      hint, solution: q === 'P' ? `P = 2 × π × ${r} = ${Dm}π ${u}.` : `A = π × ${r} × ${r} = ${r * r}π ${uu}.` });
  }
  const p = d < 3 ? 1 : pick([0, 1, 2]), ex = q === 'P' ? PI * Dm : PI * r * r, indep = q === 'P' ? 2 * PI * r : PI * Dm * Dm / 4, E = rnd(ex, p);
  return Q({ visual, html: `${donne}. 🧮 Utilise la touche π de la calculatrice. ${arrondi(p)}`, tpl: `${q} ≈ {0} ${uu}`, E, ...arr(p, indep), p, exact: ex, alts: altsFor(PI), hint,
    solution: q === 'P' ? `P = 2 × π × ${r} = ${Dm}π ≈ ${dots(ex)} donc P ≈ ${U(E, u)}.` : `A = π × ${r} × ${r} = ${r * r}π ≈ ${dots(ex)} donc A ≈ ${U(E, uu)}.` });
}
function C4() {
  return `<h2>4. Le disque</h2>
<p class="intro">Pour un cercle, tout dépend du rayon et du nombre π (« pi »), environ 3,14. Ses formules servent ensuite pour les cylindres, cônes et boules.</p>
<div class="def">Disque de <b>rayon</b> r et de <b>diamètre</b> d = 2 × r :<br>
<b>périmètre</b> (longueur du cercle) P = 2 × π × r = π × d &nbsp;&nbsp;&nbsp; <b>aire</b> A = π × r × r = π × r²<br>π ≈ 3,14 (touche π de la calculatrice).</div>
<div class="cols">${D.disque('r', '3 cm', { size: 130 })}${D.disque('d', '10 cm', { size: 130 })}</div>
<div class="methode"><b>Méthode</b><ol><li>Repère si on te donne le rayon ou le diamètre ; si c'est le diamètre, r = d ÷ 2.</li><li>Périmètre : 2 × π × r. Aire : π × r × r.</li><li>Avec π ≈ 3,14, calcule à la main ; sinon utilise la touche π et arrondis comme demandé.</li><li>Valeur exacte : garde π dans le résultat (6π, 9π…) ; dans la case, tape seulement le nombre devant π.</li></ol></div>
<div class="ex"><span class="q">Exemple 1 : r = 3 cm, avec π ≈ 3,14.</span><br>P ≈ 2 × 3,14 × 3 = <b>18,84 cm</b> ; A ≈ 3,14 × 3 × 3 = 3,14 × 9 = <b>28,26 cm²</b>.</div>
<div class="ex"><span class="q">Exemple 2 : diamètre 10 cm, touche π, arrondi au dixième.</span><br>r = 10 ÷ 2 = 5 cm. P = π × 10 ≈ 31,41… ≈ <b>31,4 cm</b>.<br>A = π × 5 × 5 = 25π ≈ 78,53… ≈ <b>78,5 cm²</b>.</div>
<div class="ex"><span class="q">Exemple 3 : valeur exacte, r = 4 cm.</span><br>P = 2 × π × 4 = <b>8π cm</b> ; A = π × 4 × 4 = <b>16π cm²</b>.</div>
<div class="warn">⚠️ <b>Rayon</b> ou <b>diamètre</b> ? Si on te donne le diamètre, divise par 2 pour avoir le rayon de l'aire.<br>⚠️ r² = r × r, et non r × 2.<br>⚠️ Arrondir n'est pas couper : 78,53… au dixième donne 78,5, mais 28,27… donne 28,3.</div>
<div class="retenir">À retenir : P = 2 × π × r = π × d et A = π × r × r : l'aire se calcule toujours avec le rayon.</div>`;
}

/* ================= 5. figures composées ================= */
function L5(d) {
  const u = pick(['cm', 'm']), uu = u + '²';
  const kind = pick(d < 1 ? ['L'] : d < 2 ? ['L', 'maison'] : d < 3 ? ['L', 'maison', 'demi', 'trou'] : ['maison', 'demi', 'trou', 'demiP']);
  if (kind === 'L') {
    const a = ri(5, 12), b = ri(4, 9), c = ri(2, a - 2), e = ri(2, b - 2);
    const pts = [[0, 0], [a, 0], [a, b - e], [a - c, b - e], [a - c, b], [0, b]], E = a * b - c * e;
    return Q({ visual: D.figureL(a, b, c, e, { a: U(a, u), b: U(b, u), c: U(c, u), e: U(e, u) }), html: "Calcule l'<b>aire</b> de la figure coloriée.",
      tpl: `A = {0} ${uu}`, E, value: lacet(pts),
      alts: [[a * b, "Tu as oublié d'enlever le coin vide (en pointillés)."], [a * b + c * e, 'Le coin est vide : il faut le <b>soustraire</b>.'], [2 * (a + b), "Ça, c'est le périmètre."]],
      hint: `Imagine le grand rectangle de ${U(a, u)} sur ${U(b, u)}, puis enlève le petit rectangle vide (le coin).`,
      solution: `Grand rectangle : ${a} × ${b} = ${a * b} ${uu}. Coin vide : ${c} × ${e} = ${c * e} ${uu}.<br>A = ${a * b} − ${c * e} = ${U(E, uu)}.<br>(On peut aussi découper en deux rectangles : ${a} × ${b - e} + ${a - c} × ${e} = ${E}.)` });
  }
  if (kind === 'maison') {
    const L = ri(4, 12), h1 = ri(3, 8), h2 = ri(2, 6), E = r6(L * h1 + L * h2 / 2);
    return Q({ visual: D.maison(L, h1, h2, { L: U(L, u), h1: U(h1, u), h2: U(h2, u) }), html: "Calcule l'<b>aire</b> de la figure coloriée : un rectangle surmonté d'un triangle.",
      tpl: `A = {0} ${uu}`, E, value: r6(lacet([[0, 0], [L, 0], [L, h1], [L / 2, h1 + h2], [0, h1]])),
      alts: [[L * h1 + L * h2, "Pour le triangle, n'oublie pas de diviser par 2."], [L * h1, "Tu as oublié le triangle du haut."], [r6(L * h2 / 2), 'Il manque le rectangle du bas.']],
      hint: 'Découpe la figure : aire du rectangle + aire du triangle (base × hauteur ÷ 2). La base du triangle est la largeur du rectangle.',
      solution: `Rectangle : ${L} × ${h1} = ${L * h1} ${uu}. Triangle : ${L} × ${h2} ÷ 2 = ${N(r6(L * h2 / 2))} ${uu}.<br>A = ${L * h1} + ${N(r6(L * h2 / 2))} = ${U(E, uu)}.` });
  }
  const p = d < 3 ? 1 : pick([0, 1, 2]);
  if (kind === 'trou') {
    const L = ri(6, 14), l = ri(5, 10), r = ri(1, Math.floor(Math.min(L, l) / 2) - 1);
    const ex = L * l - PI * r * r, indep = lacet(rect(L, l)) - PI * (2 * r) ** 2 / 4, E = rnd(ex, p);
    return Q({ visual: D.trou(L, l, r, { L: U(L, u), l: U(l, u), r: U(r, u) }), html: `Une plaque rectangulaire est percée d'un trou rond de rayon ${U(r, u)}. Calcule l'<b>aire</b> de la plaque (partie coloriée). ${arrondi(p)}`,
      tpl: `A ≈ {0} ${uu}`, E, ...arr(p, indep), p, exact: ex,
      alts: [[L * l + PI * r * r, "Le trou est vide : on <b>soustrait</b> l'aire du disque."], [L * l - PI * 4 * r * r, 'Aire du disque : π × r × r avec le rayon.'], [L * l - 2 * PI * r, "Tu as enlevé le périmètre du trou ; il faut enlever son aire : π × r × r."], [L * l, "N'oublie pas d'enlever le trou."]],
      hint: 'Aire de la plaque = aire du rectangle − aire du disque (π × r × r).',
      solution: `Rectangle : ${L} × ${l} = ${L * l} ${uu}. Disque : π × ${r} × ${r} ≈ ${dots(PI * r * r)} ${uu}.<br>A = ${L * l} − ${r === 1 ? "" : r * r}π ≈ ${dots(ex)} donc A ≈ ${U(E, uu)}.` });
  }
  const L = ri(4, 12), l = 2 * ri(1, 5), r = l / 2, visual = D.demiDisque(L, l, { L: U(L, u), l: U(l, u) });
  if (kind === 'demiP') {
    const ex = 2 * L + l + PI * r, indep = L + L + l + 2 * PI * r / 2, E = rnd(ex, p);
    return Q({ visual, html: `La figure est formée d'un rectangle et d'un demi-disque. Calcule son <b>périmètre</b>. ${arrondi(p)}`,
      tpl: `P ≈ {0} ${u}`, E, ...arr(p, indep), p, exact: ex,
      alts: [[ex + l, "Le côté en pointillés est à l'intérieur de la figure : il ne fait pas partie du tour."], [2 * L + l + 2 * PI * r, "C'est un <b>demi</b>-cercle : la moitié de π × d."], [2 * (L + l), "Le côté droit est remplacé par un demi-cercle."]],
      hint: `Fais le tour : trois côtés du rectangle (${L}, ${l} et ${L}) puis le demi-cercle, dont la longueur est la moitié de π × ${l}.`,
      solution: `Côtés droits : ${L} + ${l} + ${L} = ${2 * L + l} ${u}. Demi-cercle : π × ${l} ÷ 2 ≈ ${dots(PI * r)} ${u}.<br>P ≈ ${dots(ex)} donc P ≈ ${U(E, u)}.` });
  }
  const ex = L * l + PI * r * r / 2, indep = lacet(rect(L, l)) + PI * l * l / 8, E = rnd(ex, p);
  return Q({ visual, html: `La figure est formée d'un rectangle et d'un demi-disque. Calcule son <b>aire</b>. ${arrondi(p)}`,
    tpl: `A ≈ {0} ${uu}`, E, ...arr(p, indep), p, exact: ex,
    alts: [[L * l + PI * r * r, "C'est un <b>demi</b>-disque : divise l'aire du disque par 2."], [L * l + PI * l * l / 2, `Le rayon du demi-disque est la moitié de ${l}, soit ${r}.`], [L * l, 'Il manque le demi-disque.']],
    hint: `Aire = aire du rectangle + aire du demi-disque. Le diamètre du demi-disque est ${U(l, u)}, donc son rayon est ${U(r, u)}.`,
    solution: `Rectangle : ${L} × ${l} = ${L * l} ${uu}. Demi-disque : π × ${r} × ${r} ÷ 2 ≈ ${dots(PI * r * r / 2)} ${uu}.<br>A ≈ ${dots(ex)} donc A ≈ ${U(E, uu)}.` });
}
function C5() {
  return `<h2>5. Figures composées</h2>
<p class="intro">Une figure compliquée se découpe en morceaux simples dont on connaît déjà l'aire : rectangles, triangles, disques.</p>
<div class="def">On <b>découpe</b> la figure en morceaux connus (rectangles, triangles, disques…) :<br>on <b>additionne</b> les aires des morceaux, ou on <b>soustrait</b> ce qui manque (un coin, un trou).</div>
<div class="cols">${D.maison(6, 4, 3, { L: '6 cm', h1: '4 cm', h2: '3 cm' })}${D.figureL(8, 6, 3, 2, { a: '8 cm', b: '6 cm', c: '3 cm', e: '2 cm' })}</div>
<div class="methode"><b>Méthode</b><ol><li>Repère les morceaux simples (trace les découpes en pointillés).</li><li>Calcule l'aire de chaque morceau avec sa formule.</li><li>Additionne les morceaux, ou soustrais le coin vide ou le trou.</li><li>Pour un <b>périmètre</b>, fais seulement le tour extérieur.</li></ol></div>
<div class="ex"><span class="q">Exemple 1 : une « maison » (à gauche).</span><br>Rectangle : 6 × 4 = 24 cm². Triangle : 6 × 3 ÷ 2 = 9 cm². Total : 24 + 9 = <b>33 cm²</b>.</div>
<div class="ex"><span class="q">Exemple 2 : un rectangle avec un coin vide (à droite).</span><br>Grand rectangle : 8 × 6 = 48 cm². Coin vide : 3 × 2 = 6 cm². A = 48 − 6 = <b>42 cm²</b>.</div>
<div class="cols">${D.trou(10, 6, 2, { L: '10 cm', l: '6 cm', r: '2 cm' })}${D.demiDisque(6, 4, { L: '6 cm', l: '4 cm' })}</div>
<div class="ex"><span class="q">Exemple 3 : plaque de 10 cm sur 6 cm percée d'un trou de rayon 2 cm.</span><br>A = 60 − π × 2 × 2 = 60 − 4π ≈ 47,43… ≈ <b>47,4 cm²</b>.</div>
<div class="ex"><span class="q">Exemple 4 : périmètre d'un rectangle de 6 cm sur 4 cm terminé par un demi-disque.</span><br>Côtés droits : 6 + 4 + 6 = 16 cm. Demi-cercle : π × 4 ÷ 2 = 2π ≈ 6,28 cm.<br>P ≈ 22,28… ≈ <b>22,3 cm</b> (le côté en pointillés ne compte pas).</div>
<div class="warn">⚠️ Un <b>demi</b>-disque : on divise l'aire du disque par 2, et son rayon est la moitié de la largeur.<br>⚠️ Un trou ou un coin vide se <b>soustrait</b>.<br>⚠️ Pour le <b>périmètre</b>, seul le bord extérieur compte : un segment intérieur (en pointillés) n'en fait pas partie.</div>
<div class="retenir">À retenir : découper en morceaux connus, puis additionner ou soustraire.</div>`;
}

/* ================= conversions (6, 7, 9) ================= */
const EXP = {
  L: { km: 6, hm: 5, dam: 4, m: 3, dm: 2, cm: 1, mm: 0 },
  A: { 'km²': 12, 'hm²': 10, 'dam²': 8, 'm²': 6, 'dm²': 4, 'cm²': 2, 'mm²': 0, ha: 10, a: 8 },
  V: { 'm³': 9, 'dm³': 6, 'cm³': 3, 'mm³': 0, hL: 8, daL: 7, L: 6, dL: 5, cL: 4, mL: 3 },
};
/** écriture décimale (point) de m × 10^e, sans zéro inutile */
function toStr(m, e) {
  const s = String(m);
  if (e >= 0) return s + '0'.repeat(e);
  const t = s.padStart(-e + 1, '0'), i = t.length + e;
  return (t.slice(0, i) + '.' + t.slice(i)).replace(/0+$/, '').replace(/\.$/, '');
}
const ndec = s => (s.split('.')[1] || '').length;
const ndig = s => s.replace('.', '').length;
const fits = (kind, s, e) => D.digitsAt(s, e).every(g => g.e >= 0 && g.e <= D.tabMax(kind));
const pairsOf = (units, ok) => units.flatMap(a => units.filter(b => b !== a && ok(a, b)).map(b => [a, b]));

function conversion(kind, pairs, d, o = {}) {
  const P = EXP[kind];
  for (;;) {
    const [src, dst] = pick(pairs), k = P[src] - P[dst];
    const nd = d < 1 ? ri(1, 2) : d < 2 ? ri(1, 3) : ri(2, 4);
    const m = ri(10 ** (nd - 1), 10 ** nd - 1);
    if (nd > 1 && m % 10 === 0) continue;
    const e = d < 1 ? 0 : -ri(0, Math.min(3, d));
    const s1 = toStr(m, e), s2 = toStr(m, e + k);
    if (ndec(s1) > 3 || ndec(s2) > 3 || ndig(s1) > 7 || ndig(s2) > 7) continue;
    if (!fits(kind, s1, P[src]) || !fits(kind, s2, P[dst])) continue;
    const x = Number(s1), E = Number(s2), value = r6(x * 10 ** k);
    const extra = kind === 'V' ? [src, dst].some(v => !v.includes('³')) : kind === 'A' && [src, dst].some(v => !v.includes('²'));
    const hl = [[src, '#fff3bf'], [dst, '#d3f9d8']];
    const in1 = new Set(D.digitsAt(s1, P[src]).map(g => g.e));
    const zeros = D.digitsAt(s2, P[dst]).map(g => g.e).filter(e2 => !in1.has(e2));
    const visual = D.tableau(kind, [{ s: s1, e: P[src] }], { hl, extra });
    const after = D.tableau(kind, [{ s: s1, e: P[src] }, { s: s2, e: P[dst], color: '#2b8a3e', zeros }], { hl, extra });
    const col = kind === 'L' ? 'une colonne' : kind === 'A' ? 'deux colonnes' : 'trois colonnes';
    const fac = N(10 ** Math.abs(k));
    const fn = v => {
      if (!(v > 0)) return '';
      const j = Math.round(Math.log10(v / x));
      if (Math.abs(v - x * 10 ** j) > 1e-6 * Math.max(v, 1) || j === k) return '';
      if (k !== 0 && j === -k) return `Tu as converti dans le mauvais sens : un ${dst} est plus ${k > 0 ? 'petit' : 'grand'} qu'un ${src}, donc le nombre doit ${k > 0 ? 'grandir' : 'diminuer'}.`;
      if (kind === 'A' && 2 * j === k) return "Pour les aires, c'est × 100 (ou ÷ 100) à chaque unité, pas × 10 : il y a <b>deux colonnes</b> par unité d'aire.";
      if (kind === 'V' && k % 3 === 0 && (3 * j === k || 3 * j === 2 * k)) return "Pour les volumes, c'est × 1 000 (ou ÷ 1 000) à chaque unité : il y a <b>trois colonnes</b> par unité de volume.";
      if (k === 0) return `1 ${src} = 1 ${dst} : le nombre ne change pas !`;
      return `Ce n'est pas le bon nombre de rangs : la virgule doit se déplacer de ${Math.abs(k)} rang${Math.abs(k) > 1 ? 's' : ''} vers la ${k > 0 ? 'droite' : 'gauche'}.`;
    };
    const rel = k === 0 ? `1 ${src} = 1 ${dst}` : k > 0 ? `1 ${src} = ${fac} ${dst}` : `1 ${dst} = ${fac} ${src}`;
    return Q({
      visual, after, html: (o.ctx ? o.ctx(src, dst) : 'Convertis. Aide-toi du tableau de conversion.'),
      tpl: `${U(x, src)} = {0} ${dst}`, E, value, pow10: false, fn,
      hint: `Écris ${N(x)} dans le tableau, avec le chiffre des unités dans la colonne des ${src}, puis place la virgule juste après la colonne des ${dst} (complète par des zéros si besoin). Ici, ${col} par unité.`,
      solution: k === 0 ? `${rel}, donc ${U(x, src)} = ${U(E, dst)}.` : `${rel}, donc on ${k > 0 ? 'multiplie' : 'divise'} par ${fac} : ${N(x)} ${k > 0 ? '×' : '÷'} ${fac} = ${N(E)}.<br>${U(x, src)} = ${U(E, dst)}.`,
    });
  }
}

/* ================= 6. conversions de longueurs ================= */
const UL = ['km', 'hm', 'dam', 'm', 'dm', 'cm', 'mm'];
function L6(d) {
  const mx = d < 1 ? 1 : d < 2 ? 2 : d < 3 ? 3 : 6;
  return conversion('L', pairsOf(UL, (a, b) => Math.abs(EXP.L[a] - EXP.L[b]) <= mx), d);
}
function C6() {
  return `<h2>6. Conversions de longueurs</h2>
<p class="intro">Pour comparer ou additionner des longueurs, il faut les écrire dans la même unité. Le tableau de conversion évite les erreurs de virgule.</p>
<div class="def">Chaque unité de longueur vaut <b>10 fois</b> l'unité située à sa droite : 1 km = 10 hm = 100 dam = 1 000 m ; 1 m = 10 dm = 100 cm = 1 000 mm.<br>Dans le tableau : <b>une colonne</b> par unité.</div>
${D.tableau('L', [{ s: '3.25', e: 3 }, { s: '325', e: 1, color: '#2b8a3e' }])}
<div class="methode"><b>Méthode</b><ol><li>Écris le nombre dans le tableau : le chiffre des <b>unités</b> va dans la colonne de l'unité de départ.</li><li>Place la virgule juste après la colonne de l'unité d'arrivée.</li><li>Complète par des zéros les colonnes vides.</li><li>Contrôle : vers une unité plus petite, le nombre grandit.</li></ol></div>
<div class="ex"><span class="q">Exemple 1 : 3,25 m en cm.</span><br>Le 3 va dans la colonne des m ; la virgule se place après la colonne des cm : <b>3,25 m = 325 cm</b> (× 100).</div>
${D.tableau('L', [{ s: '45', e: 3 }, { s: '0.045', e: 6, color: '#2b8a3e' }])}
<div class="ex"><span class="q">Exemple 2 : 45 m en km.</span><br>Le 5 va dans la colonne des m. Virgule après les km, et on complète par des zéros : <b>45 m = 0,045 km</b> (÷ 1 000).</div>
<div class="ex"><span class="q">Exemple 3 : 7,8 mm en cm.</span><br>Un cm vaut 10 mm : 7,8 ÷ 10 = <b>0,78 cm</b>.</div>
<div class="warn">⚠️ Vers une unité <b>plus petite</b>, le nombre <b>grandit</b> ; vers une unité plus grande, il diminue.<br>⚠️ Un rang par unité : de m à mm, c'est 3 rangs (× 1 000), pas 2.<br>⚠️ N'oublie pas le dam (décamètre) entre le hm et le m.</div>
<div class="retenir">À retenir : longueurs, × 10 ou ÷ 10 à chaque colonne.</div>`;
}

/* ================= 7. conversions d'aires ================= */
const UA = ['km²', 'hm²', 'dam²', 'm²', 'dm²', 'cm²', 'mm²'];
function L7(d) {
  const mx = d < 2 ? 1 : d < 3 ? 2 : 3, step = (a, b) => Math.abs(EXP.A[a] - EXP.A[b]) / 2;
  let pairs = pairsOf(UA, (a, b) => step(a, b) <= mx);
  if (d >= 3 && chance(0.35)) pairs = [['ha', 'm²'], ['m²', 'ha'], ['a', 'm²'], ['m²', 'a'], ['ha', 'a'], ['a', 'ha'], ['km²', 'ha'], ['ha', 'km²']];
  return conversion('A', pairs, d);
}
function C7() {
  const g = [...Array(10)].map(() => [...Array(10)].map(() => true));
  return `<h2>7. Conversions d'aires</h2>
<p class="intro">Une unité d'aire est un carré : quand le côté est multiplié par 10, l'aire est multipliée par 100. D'où deux colonnes par unité dans le tableau.</p>
<div class="def">1 m² est l'aire d'un carré de 1 m de côté, soit 10 dm × 10 dm = <b>100 dm²</b>.<br>Chaque unité d'aire vaut <b>100 fois</b> l'unité à sa droite : dans le tableau, <b>deux colonnes</b> par unité.<br>Unités agraires : 1 a = 1 dam² = 100 m² et 1 ha = 1 hm² = 10 000 m² ; 1 km² = 100 ha.</div>
<div class="cols">${petit(D.quadrillage(g, '1 dm² = 100 cm²'), 200)}<div class="ex">Un carré de 1 dm de côté contient 10 × 10 = <b>100</b> carrés de 1 cm de côté :<br>1 dm² = 100 cm².</div></div>
${D.tableau('A', [{ s: '3.5', e: 6 }, { s: '35000', e: 2, color: '#2b8a3e' }])}
<div class="methode"><b>Méthode</b><ol><li>Écris le nombre : le chiffre des unités va dans la colonne de <b>droite</b> de l'unité de départ.</li><li>Place la virgule juste après la colonne de droite de l'unité d'arrivée.</li><li>Complète par des zéros.</li><li>Contrôle : × 100 (ou ÷ 100) à chaque unité.</li></ol></div>
<div class="ex"><span class="q">Exemple 1 : 3,5 m² en cm².</span><br>Le 3 va dans la colonne de droite des m², la virgule se place après les cm² : <b>3,5 m² = 35 000 cm²</b> (× 10 000).</div>
<div class="ex"><span class="q">Exemple 2 : 250 cm² en m².</span><br>De cm² à m², deux unités, donc ÷ 10 000 : <b>250 cm² = 0,025 m²</b>.</div>
<div class="ex"><span class="q">Exemple 3 : 2,4 ha en m².</span><br>1 ha = 10 000 m², donc <b>2,4 ha = 24 000 m²</b>.</div>
<div class="warn">⚠️ Le piège classique : faire × 10 au lieu de × 100. 1 m² = 100 dm², <b>pas</b> 10 dm² !<br>⚠️ Dans le tableau, chaque unité d'aire occupe <b>deux</b> colonnes : place le chiffre des unités dans celle de droite.<br>⚠️ Un hectare (ha) n'est pas un hm : c'est un hm².</div>
<div class="retenir">À retenir : aires, × 100 ou ÷ 100 à chaque unité.</div>`;
}

/* ================= 8. volume du pavé et du cube ================= */
function L8(d) {
  if (d < 1) {
    const L = ri(2, 5), h = ri(2, 4), l = ri(2, 4); let n = 0;
    for (let i = 0; i < L; i++) for (let j = 0; j < h; j++) for (let k = 0; k < l; k++) n++; // comptage des petits cubes
    return Q({ visual: D.pave(L, h, l, { L: `${L}`, h: `${h}`, l: `${l}` }, { grille: true }),
      html: 'Ce pavé droit est rempli de petits cubes de 1 cm de côté (1 cm³ chacun). Quel est son <b>volume</b> ?',
      tpl: 'V = {0} cm³', E: L * h * l, value: n, pow10: false,
      alts: [[L * l, "Ça, c'est une seule couche. Combien y a-t-il de couches ?"], [L + h + l, 'On multiplie les trois dimensions.'], [2 * (L * h + h * l + L * l), "Ça, c'est le nombre de faces de petits cubes visibles sur l'extérieur."]],
      hint: `Compte les cubes d'une couche (${L} × ${l}), puis multiplie par le nombre de couches (${h}).`,
      solution: `Une couche : ${L} × ${l} = ${L * l} cubes. Il y a ${h} couches : ${L * l} × ${h} = ${L * h * l} cubes, soit ${L * h * l} cm³.` });
  }
  const u = 'cm';
  let cube = chance(0.35), L, h, l, txt, tx, unconv = NaN;
  if (d < 2) { L = ri(2, 12); h = cube ? L : ri(2, 12); l = cube ? L : ri(2, 12); }
  else if (d < 3 || chance(0.5)) { L = dec(2, 9, 0.5); h = cube ? L : dec(2, 12, 0.5); l = cube ? L : ri(2, 10); }
  else { // une dimension dans une autre unité : toujours un pavé (trois dimensions différentes)
    cube = false;
    L = ri(2, 9) * 10; h = ri(2, 15); l = ri(2, 12);
    if (chance(0.5)) { txt = `une longueur de ${U(L / 10, 'dm')}, une hauteur de ${U(h, u)} et une profondeur de ${U(l, u)}`; unconv = r6(L / 10 * h * l); tx = { L: U(L / 10, 'dm'), h: U(h, u), l: U(l, u) }; }
    else { const hmm = h * 10; txt = `une longueur de ${U(L, u)}, une hauteur de ${U(hmm, 'mm')} et une profondeur de ${U(l, u)}`; unconv = r6(L * hmm * l); tx = { L: U(L, u), h: U(hmm, 'mm'), l: U(l, u) }; }
  }
  const E = r6(L * h * l), value = r6(Math.round(L * 10) * Math.round(h * 10) * Math.round(l * 10) / 1000);
  const t = tx || { L: U(L, u), h: cube ? '' : U(h, u), l: cube ? '' : U(l, u) };
  const html = cube ? `Calcule le <b>volume</b> d'un cube d'arête ${U(L, u)}.` : txt ? `Un pavé droit a ${txt}.<br>Calcule son <b>volume en cm³</b>.` : `Calcule le <b>volume</b> de ce pavé droit.`;
  return Q({ visual: D.pave(L, h, l, t), html, tpl: `V = {0} ${u}³`, E, value,
    alts: [[unconv, "Une des longueurs n'est pas en cm : convertis-la d'abord (1 dm = 10 cm, 1 cm = 10 mm)."], [r6(L * l), "Ça, c'est l'aire de la base. Multiplie encore par la hauteur."], [r6(L + h + l), 'On multiplie les trois dimensions.'],
      [cube ? r6(L * L) : NaN, 'Pour un cube : arête × arête × arête.'], [r6(2 * (L * h + h * l + L * l)), "Ça, c'est l'aire de toutes les faces (la surface du pavé), pas le volume."]],
    hint: cube ? 'Volume du cube = arête × arête × arête (a³).' : `Volume du pavé = longueur × largeur × hauteur.${txt ? ' Mets d\'abord toutes les longueurs en cm.' : ''}`,
    solution: `${txt ? `En cm : ${N(L)} cm, ${N(h)} cm et ${N(l)} cm.<br>` : ''}V = ${N(L)} × ${N(h)} × ${N(l)} = ${U(E, 'cm³')}.` });
}
function C8() {
  return `<h2>8. Volume du pavé et du cube</h2>
<p class="intro">Le volume mesure la place occupée dans l'espace. On compte combien de petits cubes de 1 cm³ remplissent le solide.</p>
<div class="def">1 cm³ est le volume d'un cube de 1 cm d'arête.<br>
<b>Pavé droit</b> : V = longueur × largeur × hauteur &nbsp;&nbsp; <b>Cube</b> d'arête a : V = a × a × a = a³</div>
<div class="cols">${D.pave(4, 2, 3, { L: '4', h: '2', l: '3' }, { grille: true })}${D.pave(5, 5, 5, { L: '5 cm', h: '', l: '' })}</div>
<div class="methode"><b>Méthode</b><ol><li>Vérifie que les trois longueurs sont dans la <b>même unité</b> ; sinon, convertis d'abord.</li><li>Multiplie les trois dimensions (une couche × le nombre de couches).</li><li>Écris l'unité de volume : cm³, m³…</li></ol></div>
<div class="ex"><span class="q">Exemple 1 : le pavé de petits cubes (à gauche).</span><br>Une couche : 4 × 3 = 12 petits cubes ; 2 couches : 12 × 2 = 24 cubes. V = 4 × 3 × 2 = <b>24 cm³</b>.</div>
<div class="ex"><span class="q">Exemple 2 : cube de 5 cm d'arête (à droite).</span><br>V = 5 × 5 × 5 = <b>125 cm³</b>.</div>
<div class="ex"><span class="q">Exemple 3 : pavé de 2 dm, 7 cm et 5 cm. Volume en cm³ ?</span><br>2 dm = 20 cm. V = 20 × 7 × 5 = <b>700 cm³</b>.<br>Avec des décimaux : 2,5 × 4 × 3 = 30 cm³.</div>
<div class="warn">⚠️ Les trois longueurs doivent être dans la <b>même unité</b> avant de multiplier.<br>⚠️ Ne confonds pas le volume (on multiplie 3 longueurs) avec l'aire d'une face (2 longueurs) ou de toutes les faces.<br>⚠️ Cube : a × a × a, pas a × 3.</div>
<div class="retenir">À retenir : V = L × l × h ; cube : V = a³.</div>`;
}

/* ================= 9. volumes et contenances ================= */
const UV = ['m³', 'dm³', 'cm³', 'mm³'], UC = ['hL', 'daL', 'L', 'dL', 'cL', 'mL'];
function L9(d) {
  const e = EXP.V, gap = (a, b) => Math.abs(e[a] - e[b]);
  let pairs;
  if (d < 1) pairs = pairsOf(['m³', 'dm³', 'cm³'], (a, b) => gap(a, b) === 3);
  else if (d < 2) pairs = pairsOf(['L', 'dL', 'cL', 'mL', 'hL'], (a, b) => gap(a, b) <= 2);
  else if (d < 3) pairs = [['dm³', 'L'], ['L', 'dm³'], ['cm³', 'mL'], ['mL', 'cm³'], ['L', 'cm³'], ['cm³', 'L'], ['dm³', 'cL'], ['cL', 'cm³'], ['m³', 'L'], ['L', 'm³']];
  else pairs = pairsOf([...UV, ...UC], (a, b) => gap(a, b) <= 6 && (a.includes('³') !== b.includes('³') || gap(a, b) >= 3));
  return conversion('V', pairs, d);
}
function C9() {
  return `<h2>9. Volumes et contenances</h2>
<p class="intro">Le litre sert à mesurer ce que contient un récipient. Il se relie directement aux unités de volume : 1 L, c'est un cube de 10 cm d'arête.</p>
<div class="def">1 dm³ = 10 cm × 10 cm × 10 cm = <b>1 000 cm³</b> : chaque unité de volume vaut 1 000 fois la suivante (<b>trois colonnes</b> par unité).<br>
Contenances : <b>1 L = 1 dm³</b> et <b>1 mL = 1 cm³</b> ; 1 hL = 10 daL = 100 L ; 1 L = 10 dL = 100 cL = 1 000 mL.</div>
<div class="cols">${petit(D.pave(1, 1, 1, { L: '10 cm', h: '10 cm', l: '10 cm' }), 230)}<div class="ex">Ce cube de 10 cm d'arête a un volume de 1 dm³ = 1 000 cm³ : il contient exactement <b>1 litre</b>.</div></div>
${D.tableau('V', [{ s: '2.5', e: 6 }, { s: '2500', e: 3, color: '#2b8a3e' }], { extra: true })}
<div class="methode"><b>Méthode</b><ol><li>Volumes entre eux (m³, dm³, cm³, mm³) : × 1 000 ou ÷ 1 000 à chaque unité.</li><li>Contenances entre elles (hL, daL, L, dL, cL, mL) : × 10 ou ÷ 10 à chaque unité.</li><li>Pour passer de l'un à l'autre, utilise les ponts : 1 dm³ = 1 L et 1 cm³ = 1 mL.</li></ol></div>
<div class="ex"><span class="q">Exemple 1 : 2,5 dm³ en cm³ et en mL.</span><br>2,5 dm³ = 2,5 L = <b>2 500 cm³</b> = <b>2 500 mL</b>.</div>
<div class="ex"><span class="q">Exemple 2 : 75 cL en L.</span><br>1 L = 100 cL, donc 75 cL = <b>0,75 L</b>.</div>
<div class="ex"><span class="q">Exemple 3 : 3 500 cm³ en L.</span><br>3 500 cm³ = 3,5 dm³ = <b>3,5 L</b>. Et 1 m³ = 1 000 dm³ = 1 000 L.</div>
<div class="warn">⚠️ Pour les volumes c'est × 1 000 à chaque unité, pas × 10 ni × 100.<br>⚠️ 1 L = 1 dm³ (pas 1 m³) : un litre, c'est un cube de 10 cm d'arête.<br>⚠️ Pour les contenances (L, dL, cL, mL), c'est × 10 par unité, comme les longueurs.</div>
<div class="retenir">À retenir : 1 L = 1 dm³ = 1 000 cm³ et 1 mL = 1 cm³.</div>`;
}

/* ================= 10. prisme droit et cylindre ================= */
function L10(d) {
  const kind = d < 1 ? 'P' : d < 2 ? pick(['P', 'C']) : d < 3 ? pick(['P', 'C', 'C']) : pick(['P', 'C', 'CL']);
  if (kind === 'P') {
    const a = ri(3, 10), b = ri(3, 10), H = ri(4, 15), B = r6(a * b / 2), E = r6(B * H);
    const value = r6(simpson(() => lacet([[0, 0], [a, 0], [0, b]]), 0, H));
    return Q({ visual: D.prisme(a, b, H, { a: U(a, 'cm'), b: U(b, 'cm'), H: U(H, 'cm') }), html: 'Ce prisme droit a pour base un triangle rectangle. Calcule son <b>volume</b>.',
      tpl: 'V = {0} cm³', E, value,
      alts: [[a * b * H, "La base est un triangle : son aire est (a × b) ÷ 2. N'oublie pas le ÷ 2."], [B, "Ça, c'est l'aire de la base. Multiplie par la hauteur du prisme."], [a * b, "Volume = aire de la base × hauteur."]],
      hint: 'Volume du prisme droit = aire de la base × hauteur. La base est un triangle rectangle : son aire est (côté × côté) ÷ 2.',
      solution: `Base : ${a} × ${b} ÷ 2 = ${N(B)} cm². V = ${N(B)} × ${H} = ${U(E, 'cm³')}.` });
  }
  const r = ri(kind === 'CL' ? 3 : 2, 10), h = ri(kind === 'CL' ? 10 : 3, 20), Dm = 2 * r, mode = d < 2 ? 'r' : pick(['r', 'd']);
  const visual = D.cylindre(r, h, mode, { r: U(mode === 'r' ? r : Dm, 'cm'), h: U(h, 'cm') });
  const donne = `Un cylindre a un ${mode === 'r' ? 'rayon' : 'diamètre'} de ${U(mode === 'r' ? r : Dm, 'cm')} et une hauteur de ${U(h, 'cm')}.`;
  const hint = `Volume du cylindre = aire du disque de base × hauteur = π × r × r × h.${mode === 'd' ? ' Le rayon est la moitié du diamètre.' : ''}`;
  const indepC = simpson(() => PI * Dm * Dm / 4, 0, h);
  if (kind === 'CL') {
    const p = 2, ex = PI * r * r * h / 1000, E = rnd(ex, p);
    return Q({ visual, html: `${donne}<br>Quelle est sa <b>contenance en litres</b> ? 🧮 ${arrondi(p)}`, tpl: 'V ≈ {0} L', E, ...arr(p, indepC / 1000), p, exact: ex,
      alts: [[PI * Dm * Dm * h / 1000, 'Avec le rayon, pas le diamètre.'], [PI * r * r * h / 100, '1 L = 1 dm³ = 1 000 cm³ : on divise par 1 000.']],
      hint: `${hint} Le résultat est en cm³ ; puis 1 L = 1 dm³ = 1 000 cm³.`,
      solution: `V = π × ${r} × ${r} × ${h} = ${r * r * h}π ≈ ${dots(PI * r * r * h)} cm³.<br>En litres : ÷ 1 000, donc V ≈ ${U(E, 'L')}.` });
  }
  const p = d < 2 ? 0 : d < 3 ? 1 : pick([0, 1, 2]), ex = PI * r * r * h, E = rnd(ex, p);
  return Q({ visual, html: `${donne}<br>Calcule son <b>volume</b>. 🧮 ${arrondi(p)}`, tpl: 'V ≈ {0} cm³', E, ...arr(p, indepC), p, exact: ex,
    alts: [[PI * Dm * Dm * h, 'Tu as utilisé le diamètre : il faut le rayon (la moitié).'], [2 * PI * r * h, "Ça, c'est l'aire de la surface latérale (2 × π × r × h), pas le volume."], [PI * r * r, "Ça, c'est l'aire de la base : multiplie par la hauteur."], [PI * r * 2 * h, 'r² = r × r, pas r × 2.']],
    hint, solution: `V = π × ${r} × ${r} × ${h} = ${r * r * h}π ≈ ${dots(ex)} donc V ≈ ${U(E, 'cm³')}.` });
}
function C10() {
  return `<h2>10. Prisme droit et cylindre</h2>
<p class="intro">Un prisme droit et un cylindre sont des « empilements » de leur base : leur volume se calcule de la même façon.</p>
<div class="def">Pour un <b>prisme droit</b> comme pour un <b>cylindre</b> : &nbsp; <b>V = aire de la base × hauteur</b>.<br>Cylindre de rayon r et de hauteur h : V = π × r × r × h.</div>
<div class="cols">${D.prisme(4, 3, 6, { a: '4 cm', b: '3 cm', H: '6 cm' })}${D.cylindre(2, 5, 'r', { r: '2 cm', h: '5 cm' })}</div>
<div class="methode"><b>Méthode</b><ol><li>Repère la base (triangle, rectangle, disque) et la hauteur du solide.</li><li>Calcule l'aire de la base (triangle rectangle : côté × côté ÷ 2 ; disque : π × r × r).</li><li>Multiplie par la hauteur.</li><li>Arrondis si demandé ; pour des litres, divise des cm³ par 1 000.</li></ol></div>
<div class="ex"><span class="q">Exemple 1 : prisme à base triangle rectangle 4 cm × 3 cm, hauteur 6 cm.</span><br>Base = 4 × 3 ÷ 2 = 6 cm². V = 6 × 6 = <b>36 cm³</b>.</div>
<div class="ex"><span class="q">Exemple 2 : cylindre de rayon 2 cm et de hauteur 5 cm.</span><br>V = π × 2 × 2 × 5 = 20π ≈ 62,83… ≈ <b>62,8 cm³</b> (au dixième).</div>
<div class="ex"><span class="q">Exemple 3 : boîte cylindrique de diamètre 10 cm et de hauteur 20 cm. Contenance en L ?</span><br>r = 5 cm. V = π × 5 × 5 × 20 = 500π ≈ 1 570,8 cm³.<br>1 L = 1 000 cm³, donc V ≈ <b>1,57 L</b> (au centième).</div>
<div class="warn">⚠️ La base d'un prisme peut être un triangle : son aire a un « ÷ 2 ».<br>⚠️ Rayon, pas diamètre ! Et 2 × π × r × h est l'aire de la surface latérale, pas le volume.<br>⚠️ La hauteur d'un prisme couché est la longueur qui « part en profondeur ».</div>
<div class="retenir">À retenir : prisme ou cylindre, V = aire de la base × hauteur.</div>`;
}

/* ================= 11. pyramide et cône ================= */
function L11(d) {
  const kind = d < 1 ? 'PC' : d < 2 ? pick(['PC', 'PR']) : d < 3 ? pick(['PR', 'C', 'C']) : pick(['PR', 'PX', 'C', 'C']);
  if (kind !== 'C') {
    let a, b, h;
    do { a = ri(2, 10); b = kind === 'PC' ? a : ri(2, 10); h = ri(3, 15); } while (kind !== 'PX' && (a * b * h) % 3 !== 0 || kind === 'PX' && (a * b * h) % 3 === 0);
    const B = a * b, ex = B * h / 3, sec = y => a * b * (1 - y / h) ** 2, indep = simpson(sec, 0, h);
    const p = kind === 'PX' ? 1 : undefined, E = kind === 'PX' ? rnd(ex, 1) : r6(ex);
    const base = kind === 'PC' ? `carrée de côté ${U(a, 'cm')}` : `rectangulaire de ${U(a, 'cm')} sur ${U(b, 'cm')}`;
    return Q({ visual: D.pyramide(a, b, h, { a: U(a, 'cm'), b: kind === 'PC' ? '' : U(b, 'cm'), h: U(h, 'cm') }),
      html: `Une pyramide a une base ${base} et une hauteur de ${U(h, 'cm')}. Calcule son <b>volume</b>.${p ? ' 🧮 ' + arrondi(1) : ''}`,
      tpl: `V ${p ? '≈' : '='} {0} cm³`, E, ...(p ? arr(1, indep) : { value: r6(indep) }), p, exact: p ? ex : undefined,
      alts: [[B * h, "Tu as oublié le « ÷ 3 » : une pyramide occupe le tiers du pavé de même base et de même hauteur."], [B * h / 2, 'On divise par 3, pas par 2.'], [B / 3, 'Il faut multiplier l\'aire de la base par la hauteur, puis diviser par 3.']],
      hint: "Volume de la pyramide = aire de la base × hauteur ÷ 3. Commence par l'aire de la base.",
      solution: `Base : ${a} × ${b} = ${B} cm². V = ${B} × ${h} ÷ 3 = ${B * h} ÷ 3 ${p ? `≈ ${dots(ex)} donc V ≈ ${U(E, 'cm³')}` : `= ${U(E, 'cm³')}`}.` });
  }
  const r = ri(2, 10), h = ri(3, 15), Dm = 2 * r, mode = d < 3 ? 'r' : pick(['r', 'd']), p = d < 3 ? 1 : pick([0, 1, 2]);
  const ex = PI * r * r * h / 3, indep = simpson(y => PI * Dm * Dm / 4 * (1 - y / h) ** 2, 0, h), E = rnd(ex, p);
  return Q({ visual: D.cone(r, h, mode, { r: U(mode === 'r' ? r : Dm, 'cm'), h: U(h, 'cm') }),
    html: `Un cône de révolution a un ${mode === 'r' ? 'rayon' : 'diamètre'} de base de ${U(mode === 'r' ? r : Dm, 'cm')} et une hauteur de ${U(h, 'cm')}.<br>Calcule son <b>volume</b>. 🧮 ${arrondi(p)}`,
    tpl: 'V ≈ {0} cm³', E, ...arr(p, indep), p, exact: ex,
    alts: [[PI * r * r * h, "Tu as oublié le « ÷ 3 » : le cône occupe le tiers du cylindre de même base et de même hauteur."], [PI * Dm * Dm * h / 3, 'Il faut le rayon, pas le diamètre.'], [PI * r * r * h / 2, 'On divise par 3, pas par 2.']],
    hint: `Volume du cône = π × r × r × h ÷ 3.${mode === 'd' ? ' Le rayon est la moitié du diamètre.' : ''}`,
    solution: `V = π × ${r} × ${r} × ${h} ÷ 3 = ${(r * r * h) % 3 ? `${r * r * h}π ÷ 3` : `${r * r * h / 3}π`} ≈ ${dots(ex)} donc V ≈ ${U(E, 'cm³')}.` });
}
function C11() {
  return `<h2>11. Pyramide et cône</h2>
<p class="intro">Une pyramide ou un cône « pointu » occupe exactement le tiers du prisme ou du cylindre de même base et de même hauteur.</p>
<div class="def">Pyramide ou cône : &nbsp; <b>V = aire de la base × hauteur ÷ 3</b>.<br>Cône de rayon r : V = π × r × r × h ÷ 3.<br>La hauteur va du sommet à la base, <b>perpendiculairement</b>.</div>
<div class="cols">${D.pyramide(4, 4, 6, { a: '4 cm', h: '6 cm' })}${D.cone(3, 5, 'r', { r: '3 cm', h: '5 cm' })}</div>
<div class="methode"><b>Méthode</b><ol><li>Calcule l'aire de la base (carré, rectangle ou disque).</li><li>Multiplie par la hauteur (en pointillés).</li><li>Divise par 3.</li><li>Arrondis à la fin si demandé (cône : touche π).</li></ol></div>
<div class="ex"><span class="q">Exemple 1 : pyramide à base carrée de 4 cm, hauteur 6 cm.</span><br>Base : 4 × 4 = 16 cm². V = 16 × 6 ÷ 3 = 96 ÷ 3 = <b>32 cm³</b>.</div>
<div class="ex"><span class="q">Exemple 2 : pyramide à base rectangulaire de 5 cm sur 3 cm, hauteur 7 cm.</span><br>Base : 15 cm². V = 15 × 7 ÷ 3 = 105 ÷ 3 = <b>35 cm³</b>.</div>
<div class="ex"><span class="q">Exemple 3 : cône de rayon 3 cm, hauteur 5 cm.</span><br>V = π × 3 × 3 × 5 ÷ 3 = 15π ≈ 47,12… ≈ <b>47,1 cm³</b>.</div>
<div class="ex"><span class="q">Exemple 4 : cône de diamètre 8 cm, hauteur 6 cm.</span><br>r = 4 cm. V = π × 4 × 4 × 6 ÷ 3 = 32π ≈ 100,53… ≈ <b>100,5 cm³</b>.</div>
<div class="warn">⚠️ Le plus fréquent : <b>oublier le ÷ 3</b> (le « 1/3 »). On divise par 3, pas par 2.<br>⚠️ La hauteur est perpendiculaire à la base (en pointillés), ce n'est pas une arête penchée.<br>⚠️ Pour le cône, rayon et non diamètre.</div>
<div class="retenir">À retenir : pyramide ou cône, V = aire de la base × hauteur ÷ 3.</div>`;
}

/* ================= 12. défis : boule, sphère, agrandissement ================= */
function L12(d) {
  const kind = pick(d < 2 ? ['BV', 'SA'] : d < 3 ? ['BV', 'SA', 'KA', 'KR'] : ['BV', 'SA', 'KA', 'KV', 'KR']);
  if (kind === 'BV' || kind === 'SA') {
    const r = ri(1, 12), Dm = 2 * r, mode = d < 1 ? 'r' : pick(['r', 'd']), p = d < 1 ? 1 : pick([0, 1, 2]);
    const visual = D.boule(mode, U(mode === 'r' ? r : Dm, 'cm'));
    const donne = `Une boule a un ${mode === 'r' ? 'rayon' : 'diamètre'} de ${U(mode === 'r' ? r : Dm, 'cm')}.`;
    if (kind === 'BV') {
      const ex = 4 / 3 * PI * r ** 3, indep = simpson(y => PI * (r * r - y * y), -r, r), E = rnd(ex, p);
      return Q({ visual, html: `${donne}<br>Calcule son <b>volume</b>. 🧮 ${arrondi(p)}`, tpl: 'V ≈ {0} cm³', E, ...arr(p, indep), p, exact: ex,
        alts: [[4 * PI * r ** 3, "Tu as oublié le « ÷ 3 » : V = 4 × π × r³ ÷ 3."], [4 / 3 * PI * Dm ** 3, 'Il faut le rayon (la moitié du diamètre).'], [4 * PI * r * r, "Ça, c'est l'aire de la sphère. Le volume utilise r³ = r × r × r."], [PI * r ** 3, 'Il manque le facteur 4/3.']],
        hint: `Volume de la boule : V = ${F(4, 3)} × π × r³ (r³ = r × r × r).${mode === 'd' ? ' Le rayon est la moitié du diamètre.' : ''}`,
        solution: `V = 4 × π × ${r}³ ÷ 3 = 4 × π × ${r ** 3} ÷ 3 ≈ ${dots(ex)} donc V ≈ ${U(E, 'cm³')}.` });
    }
    const ex = 4 * PI * r * r, indep = PI * Dm * Dm, E = rnd(ex, p);
    return Q({ visual, html: `${donne}<br>Calcule l'<b>aire de la sphère</b> (sa surface). 🧮 ${arrondi(p)}`, tpl: 'A ≈ {0} cm²', E, ...arr(p, indep), p, exact: ex,
      alts: [[4 / 3 * PI * r ** 3, "Ça, c'est le volume de la boule. L'aire de la sphère est 4 × π × r²."], [PI * r * r, "Ça, c'est l'aire d'un disque : la sphère, c'est 4 fois plus."], [4 * PI * Dm * Dm, 'Il faut le rayon, pas le diamètre.']],
      hint: `Aire de la sphère : A = 4 × π × r².${mode === 'd' ? ' Le rayon est la moitié du diamètre.' : ''}`,
      solution: `A = 4 × π × ${r} × ${r} = ${4 * r * r}π ≈ ${dots(ex)} donc A ≈ ${U(E, 'cm²')}.` });
  }
  const k = pick(d < 3 ? [2, 3, 4, 0.5] : [2, 3, 0.5, 1.5, 10]), ag = k > 1 ? `agrandi à l'échelle ${N(k)}` : `réduit à l'échelle ${N(k)}`;
  if (kind === 'KR') {
    const vol = chance(0.5), E = r6(vol ? k ** 3 : k ** 2), value = r6(vol ? (k * 1) * (k * 1) * (k * 1) : lacet(rect(k, k)));
    return Q({ visual: D.agrandi(vol ? 'v' : 'a', 2, 2, 2, k, { L: 'a', h: 'a' }, { L: `${N(k)}a`, h: `${N(k)}a` }, `× ${N(k)}`),
      html: `Les longueurs d'un ${vol ? 'cube' : 'carré'} sont multipliées par ${N(k)}. Par combien son <b>${vol ? 'volume' : 'aire'}</b> est-${vol ? 'il' : 'elle'} multiplié${vol ? '' : 'e'} ?`,
      tpl: 'multiplié par {0}', E, value, pow10: false,
      alts: [[k, `Les longueurs sont multipliées par ${N(k)}, mais ${vol ? 'le volume' : "l'aire"} par ${N(k)}${vol ? '³' : '²'}.`], [r6(vol ? k * k : k ** 3), vol ? 'Pour un volume (3 dimensions), c\'est k³ = k × k × k.' : 'Pour une aire (2 dimensions), c\'est k² = k × k.'], [r6((vol ? 3 : 2) * k), `k${vol ? '³' : '²'} = k × k${vol ? ' × k' : ''}, pas ${vol ? 3 : 2} × k.`]],
      hint: `Dans un agrandissement de rapport k, les longueurs sont multipliées par k, les aires par k² et les volumes par k³.`,
      solution: `${vol ? 'Volume' : 'Aire'} multiplié${vol ? '' : 'e'} par ${N(k)}${vol ? '³' : '²'} = ${vol ? `${N(k)} × ${N(k)} × ${N(k)}` : `${N(k)} × ${N(k)}`} = ${N(E)}.` });
  }
  if (kind === 'KA') {
    let L, h; do { L = ri(2, 8); h = ri(2, 6); } while (L === h && chance(0.5));
    const A = L * h, E = r6(k * k * A), value = r6(lacet(rect(k * L, k * h)));
    return Q({ visual: D.agrandi('a', L, h, 0, k, { L: U(L, 'cm'), h: U(h, 'cm') }, { L: '?', h: '?' }, `× ${N(k)}`),
      html: `Un rectangle de ${U(L, 'cm')} sur ${U(h, 'cm')} (aire ${U(A, 'cm²')}) est ${ag}. Quelle est l'<b>aire</b> du nouveau rectangle ?`,
      tpl: 'A = {0} cm²', E, value,
      alts: [[r6(k * A), `Les aires ne sont pas multipliées par ${N(k)}, mais par ${N(k)}² = ${N(r6(k * k))}.`], [r6(k ** 3 * A), "k³, c'est pour les volumes. Pour une aire, c'est k²."]],
      hint: `Les longueurs sont multipliées par ${N(k)} : calcule les nouvelles dimensions, ou multiplie l'aire par ${N(k)}².`,
      solution: `Nouvelles dimensions : ${N(r6(k * L))} cm et ${N(r6(k * h))} cm, donc A = ${N(r6(k * L))} × ${N(r6(k * h))} = ${U(E, 'cm²')}.<br>Ou : ${A} × ${N(k)}² = ${A} × ${N(r6(k * k))} = ${N(E)}.` });
  }
  let L, h, l; do { L = ri(2, 6); h = ri(2, 5); l = ri(2, 5); } while (k === 10 && L * h * l > 999);
  const V = L * h * l, E = r6(k ** 3 * V), value = r6((k * L) * (k * h) * (k * l));
  return Q({ visual: D.agrandi('v', L, h, l, k, { L: `${L} cm`, h: `${h} cm`, l: `${l} cm` }, {}, `× ${N(k)}`),
    html: `Un pavé droit de ${L} cm × ${h} cm × ${l} cm (volume ${U(V, 'cm³')}) est ${ag}. Quel est le <b>volume</b> du nouveau pavé ?`,
    tpl: 'V = {0} cm³', E, value,
    alts: [[r6(k * V), `Le volume n'est pas multiplié par ${N(k)}, mais par ${N(k)}³ = ${N(r6(k ** 3))}.`], [r6(k * k * V), "k², c'est pour les aires. Pour un volume, c'est k³."]],
    hint: `Les trois dimensions sont multipliées par ${N(k)}, donc le volume par ${N(k)} × ${N(k)} × ${N(k)}.`,
    solution: `V' = ${V} × ${N(k)}³ = ${V} × ${N(r6(k ** 3))} = ${U(E, 'cm³')}.<br>(Vérification : ${N(r6(k * L))} × ${N(r6(k * h))} × ${N(r6(k * l))} = ${N(E)}.)` });
}
function C12() {
  return `<h2>12. Défis : boule, sphère, agrandissement</h2>
<p class="intro">Deux nouveautés de 3e : les formules de la boule, et l'effet d'un agrandissement sur les aires et les volumes.</p>
<div class="def">Boule de rayon r : &nbsp; <b>V = ${F(4, 3)} × π × r³</b> &nbsp;&nbsp; Sphère (la surface) : <b>A = 4 × π × r²</b><br>
<b>Agrandissement ou réduction de rapport k</b> : les longueurs sont multipliées par k, les <b>aires par k²</b>, les <b>volumes par k³</b>.</div>
<div class="cols">${petit(D.boule('r', '3 cm'), 240)}${D.agrandi('v', 2, 2, 2, 2, { L: '1 cm', h: '1 cm' }, { L: '2 cm', h: '2 cm' }, '× 2')}</div>
<div class="methode"><b>Méthode</b><ol><li>Boule ou sphère : prends le <b>rayon</b> (moitié du diamètre). Volume : 4 × π × r × r × r ÷ 3. Aire : 4 × π × r × r.</li><li>Agrandissement : repère k, puis multiplie les longueurs par k, les aires par k × k, les volumes par k × k × k.</li><li>Arrondis à la fin.</li></ol></div>
<div class="ex"><span class="q">Exemple 1 : boule de rayon 3 cm.</span><br>r³ = 3 × 3 × 3 = 27, donc V = 4 × π × 27 ÷ 3 = 36π ≈ <b>113,1 cm³</b>.<br>r² = 3 × 3 = 9, donc A = 4 × π × 9 = 36π ≈ <b>113,1 cm²</b> (même nombre ici, par hasard : l'un est un volume, l'autre une aire).</div>
<div class="ex"><span class="q">Exemple 2 : boule de diamètre 10 cm.</span><br>r = 5 cm. V = 4 × π × 125 ÷ 3 ≈ 523,59… ≈ <b>523,6 cm³</b> ; A = 4 × π × 25 = 100π ≈ <b>314,2 cm²</b>.</div>
<div class="ex"><span class="q">Exemple 3 : un rectangle de 3 cm sur 2 cm (aire 6 cm²) est agrandi à l'échelle 3.</span><br>Aire × 3² = × 9 : 6 × 9 = <b>54 cm²</b> (vérification : 9 cm × 6 cm = 54 cm²).</div>
<div class="ex"><span class="q">Exemple 4 : un pavé de 24 cm³ est réduit à l'échelle 0,5.</span><br>Volume × 0,5³ = × 0,125 : 24 × 0,125 = <b>3 cm³</b>.</div>
<div class="warn">⚠️ N'oublie pas le ${F(4, 3)} (et donc le ÷ 3) dans le volume de la boule ; r³ = r × r × r.<br>⚠️ Aires × k², volumes × k³ : pas × k !<br>⚠️ Ne confonds pas le volume de la boule (r³) et l'aire de la sphère (r²).</div>
<div class="retenir">À retenir : boule V = 4/3 × π × r³, sphère A = 4 × π × r² ; agrandissement : k, k², k³.</div>`;
}

export const LEVELS = [
  { titre: 'Compter les carreaux', generate: L1, cours: C1, classe: '6e' },
  { titre: 'Rectangle et carré', generate: L2, cours: C2, classe: '6e' },
  { titre: 'Aire du triangle', generate: L3, cours: C3, classe: '6e' },
  { titre: 'Le disque (avec π)', generate: L4, cours: C4, classe: '6e / 5e' },
  { titre: 'Figures composées', generate: L5, cours: C5, classe: '5e' },
  { titre: 'Conversions de longueurs', generate: L6, cours: C6, classe: '6e' },
  { titre: "Conversions d'aires", generate: L7, cours: C7, classe: '6e / 5e' },
  { titre: 'Volume du pavé et du cube', generate: L8, cours: C8, classe: '6e / 5e' },
  { titre: 'Volumes et contenances', generate: L9, cours: C9, classe: '5e' },
  { titre: 'Prisme droit et cylindre', generate: L10, cours: C10, classe: '5e' },
  { titre: 'Pyramide et cône', generate: L11, cours: C11, classe: '4e' },
  { titre: 'Défis : boule, sphère, agrandissement', generate: L12, cours: C12, classe: '3e' },
];
export const OPTIONS = { need: 4, keys: { comma: true, neg: false } };

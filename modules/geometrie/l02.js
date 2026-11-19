// Niveau 2 : symétrie axiale sur quadrillage (image d'un point ; nombre d'axes de symétrie d'une figure). 6e.
import { figure, rot, COL, dist } from './draw.js';
import { names, orient15, numQ, ex, rep, warn, retenir, meth, def, cours, cols, pick, ri, fr, chance } from './util.js';
import { M } from '../../engine/util/fmt.js';

const sg = n => (n < 0 ? '−' : '') + Math.abs(n);
const Mi = n => M(n);
const G = 6; // le repère va de −G à G

/** axes possibles : v (x = a), h (y = b), d1 (y = x + c), d2 (y = −x + c) */
const axisPts = ax => {
  if (ax.k === 'v') return [[ax.a, -G], [ax.a, G]];
  if (ax.k === 'h') return [[-G, ax.a], [G, ax.a]];
  if (ax.k === 'd1') return [[-G, -G + ax.a], [G, G + ax.a]];
  return [[-G, G + ax.a], [G, -G + ax.a]];
};
/** image de (x, y) en suivant les pas en diagonale (méthode des carreaux) : renvoie {img, steps, dir} */
function reflect(ax, p) {
  const [x, y] = p;
  if (ax.k === 'v') return { img: [2 * ax.a - x, y], n: Math.abs(x - ax.a) };
  if (ax.k === 'h') return { img: [x, 2 * ax.a - y], n: Math.abs(y - ax.a) };
  if (ax.k === 'd1') { const s = y - x - ax.a, m = s / 2, st = s > 0 ? [1, -1] : [-1, 1]; return { img: [x + 2 * Math.abs(m) * st[0], y + 2 * Math.abs(m) * st[1]], n: Math.abs(m), st }; }
  const t = x + y - ax.a, m = t / 2, st = t > 0 ? [-1, -1] : [1, 1];
  return { img: [x + 2 * Math.abs(m) * st[0], y + 2 * Math.abs(m) * st[1]], n: Math.abs(m), st };
}
const onAxis = (ax, p) => reflect(ax, p).n === 0;
const inGrid = p => Math.abs(p[0]) <= G && Math.abs(p[1]) <= G;
const stepWords = st => `${Math.abs(st[0])} carreau ${st[0] > 0 ? 'vers la droite' : 'vers la gauche'} et 1 carreau ${st[1] > 0 ? 'vers le haut' : 'vers le bas'}`.replace(/^1 carreau/, '1 carreau');

function gridFig(ax, pts, extra = {}) {
  const [a1, a2] = axisPts(ax);
  const P = { ...pts };
  return figure({
    P, grid: { x0: -G, y0: -G, x1: G, y1: G, axes: true }, k: 28, maxW: 400, maxH: 400, ext: 0,
    lines: [{ a: a1, b: a2, c: COL.a, w: 3, label: '(d)', arrows: false }], colors: { [Object.keys(pts)[0]]: COL.b, ...(extra.colors || {}) },
    ...extra.fig, aria: 'quadrillage, axe de symétrie (d) et point',
  });
}

function pointQ(d) {
  const a = names(d, 'A')[0], a2 = a + '′';
  const kinds = d < 2 ? ['v', 'h'] : d < 3 ? ['v', 'h', 'd1', 'd2'] : ['v', 'h', 'd1', 'd2'];
  let ax, A, R;
  for (;;) {
    const k = pick(kinds);
    ax = { k, a: k === 'v' || k === 'h' ? (d < 1 ? ri(-1, 2) : ri(-3, 3)) : (d < 3 ? 0 : ri(-2, 2) * 2) };
    A = [ri(-5, 5), ri(-5, 5)];
    R = reflect(ax, A);
    const parity = (ax.k === 'd1' ? A[1] - A[0] - ax.a : ax.k === 'd2' ? A[0] + A[1] - ax.a : 0) % 2;
    const wantOn = d >= 3 && ri(0, 5) === 0;
    if (parity !== 0 || !inGrid(R.img) || R.n > (d < 2 ? 5 : 8) || (R.n === 0) !== wantOn || Math.abs(R.n) < 1 && !wantOn) continue;
    if ((ax.k === 'v' && Math.abs(A[1]) === 0 && false)) continue;
    break;
  }
  const E = R.img;
  const where = ax.k === 'v' ? `${R.n} carreau${R.n > 1 ? 'x' : ''} ${A[0] < ax.a ? 'à gauche' : 'à droite'} de (d)` : ax.k === 'h' ? `${R.n} carreau${R.n > 1 ? 'x' : ''} ${A[1] < ax.a ? 'en dessous' : 'au-dessus'} de (d)` : '';
  const after = gridFig(ax, { [a]: A, [a2]: E }, { colors: { [a2]: COL.g }, fig: { segs: [{ a: A, b: E, c: COL.g, dash: true, w: 2 }] } });
  const lineMsg = ax.k === 'v' ? 'verticale' : ax.k === 'h' ? 'horizontale' : 'en diagonale';
  return numQ({
    E, tpl: `${a2}( {0} ; {1} )`, neg: true,
    html: `Le point ${a}(${Mi(A[0])} ; ${Mi(A[1])}) est tracé sur le quadrillage. Donne les coordonnées de son symétrique ${a2} par rapport à la droite (d).`,
    visual: gridFig(ax, { [a]: A }), after,
    hint: R.n === 0 ? `Regarde où se trouve ${a}(${Mi(A[0])} ; ${Mi(A[1])}) par rapport à la droite (d) : est-il sur l'axe, ou de l'un des côtés ?`
      : ax.k === 'v' || ax.k === 'h' ? `Pars de ${a}(${Mi(A[0])} ; ${Mi(A[1])}) et avance ${ax.k === 'v' ? 'horizontalement' : 'verticalement'} jusqu'à (d) en comptant les carreaux : ${a} est à ${R.n} carreau${R.n > 1 ? 'x' : ''}. Que faut-il faire ensuite de l'autre côté de l'axe ?`
        : `La droite (d) est une diagonale du quadrillage. Pars de ${a}(${Mi(A[0])} ; ${Mi(A[1])}) et rejoins (d) <b>en diagonale</b> (perpendiculairement à l'axe) en comptant les pas ; que fais-tu ensuite ?`,
    solution: R.n === 0 ? `${a}(${Mi(A[0])} ; ${Mi(A[1])}) est <b>sur l'axe</b> (d) : un point de l'axe est son propre symétrique. ${a2} = ${a}, donc ${a2}(${Mi(E[0])} ; ${Mi(E[1])}).`
      : ax.k === 'v' || ax.k === 'h' ? `${a} est à ${where}. Son symétrique ${a2} est à la même distance, de l'autre côté de (d), sur la même ligne ${lineMsg}. ${ax.k === 'v' ? `L'ordonnée ne change pas (${Mi(A[1])}) et l'abscisse devient ${Mi(E[0])}.` : `L'abscisse ne change pas (${Mi(A[0])}) et l'ordonnée devient ${Mi(E[1])}.`} Donc ${a2}(${Mi(E[0])} ; ${Mi(E[1])}).`
        : `De ${a}, on rejoint (d) en ${R.n} pas de (${stepWords(R.st)}), perpendiculairement à (d). On refait ${R.n} pas identiques de l'autre côté : ${a2}(${Mi(E[0])} ; ${Mi(E[1])}).`,
    msg: v => (v[0] === A[0] && v[1] === A[1] ? `Tu as recopié ${a} : ${R.n === 0 ? '' : `son symétrique est de l'autre côté de la droite (d).`}` : ax.k === 'v' && v[0] === A[0] ? `L'ordonnée ne change pas avec un axe vertical, mais l'abscisse, si : ${a2} est de l'autre côté de (d).` : ax.k === 'h' && v[1] === A[1] ? `Avec un axe horizontal, c'est l'ordonnée qui change.` : (v[0] === -A[0] && v[1] === -A[1]) ? `Attention : ce n'est pas le symétrique par rapport à l'origine, mais par rapport à la droite (d).` : (v[0] === A[1] && v[1] === A[0] && (ax.k === 'd1' || ax.k === 'd2') ? `Compte les pas en diagonale depuis ${a} jusqu'à (d), puis recommence de l'autre côté.` : '')),
    verify: Ev => { // le milieu de [AA′] est sur (d) et (AA′) ⟂ (d) (ou A′ = A sur l'axe)
      const [p, q] = axisPts(ax), u = [q[0] - p[0], q[1] - p[1]], mx = [(A[0] + Ev[0]) / 2 - p[0], (A[1] + Ev[1]) / 2 - p[1]], w = [Ev[0] - A[0], Ev[1] - A[1]];
      return Math.abs(mx[0] * u[1] - mx[1] * u[0]) < 1e-9 && Math.abs(w[0] * u[0] + w[1] * u[1]) < 1e-9;
    },
  });
}

/* ---------- nombre d'axes de symétrie d'une figure ---------- */
const REG = (n, r = 2) => Array.from({ length: n }, (_, i) => [r * Math.cos(Math.PI / 2 + 2 * Math.PI * i / n), r * Math.sin(Math.PI / 2 + 2 * Math.PI * i / n)]);
/** compte les axes de symétrie d'un polygone convexe par calcul (vérification indépendante) */
export function countAxes(poly) {
  const n = poly.length, c = [poly.reduce((s, p) => s + p[0], 0) / n, poly.reduce((s, p) => s + p[1], 0) / n];
  const dirs = [];
  for (let i = 0; i < n; i++) {
    dirs.push([poly[i][0] - c[0], poly[i][1] - c[1]]); // axe passant par le centre et un sommet
    for (let j = i + 1; j < n; j++) { const m = [(poly[i][0] + poly[j][0]) / 2 - c[0], (poly[i][1] + poly[j][1]) / 2 - c[1]]; dirs.push(m); } // axe passant par le centre et un milieu
  }
  const axes = [];
  for (const u of dirs) {
    const L = Math.hypot(...u); if (L < 1e-9) continue;
    const e = [u[0] / L, u[1] / L];
    const ref = p => { const x = p[0] - c[0], y = p[1] - c[1], dp = x * e[0] + y * e[1]; return [c[0] + 2 * dp * e[0] - x, c[1] + 2 * dp * e[1] - y]; };
    const ok = poly.every(p => { const r = ref(p); return poly.some(q => Math.hypot(q[0] - r[0], q[1] - r[1]) < 1e-6); });
    if (!ok) continue;
    const ang = ((Math.atan2(e[1], e[0]) % Math.PI) + Math.PI) % Math.PI;
    if (!axes.some(a => Math.abs(a - ang) < 1e-6 || Math.abs(a - ang) > Math.PI - 1e-6)) axes.push(ang);
  }
  return axes.length;
}
const SHAPES = {
  rect: { n: 2, nom: 'rectangle', pts: [[-2.4, -1.4], [2.4, -1.4], [2.4, 1.4], [-2.4, 1.4]], rights: true, lvl: 0, hint: `Cherche d'abord les droites qui passent par le milieu de deux côtés opposés, puis regarde si une diagonale convient.` },
  carre: { n: 4, nom: 'carré', pts: [[-1.8, -1.8], [1.8, -1.8], [1.8, 1.8], [-1.8, 1.8]], rights: true, ticks: [1, 1, 1, 1], lvl: 0, hint: `Teste les droites qui passent par les milieux de côtés opposés (deux sortes), et les diagonales.` },
  equi: { n: 3, nom: 'triangle équilatéral', pts: REG(3, 2.2), ticks: [1, 1, 1], lvl: 0, hint: `Pour chaque sommet, regarde si la droite qui le relie au milieu du côté opposé plie la figure en deux moitiés superposables.` },
  iso: { n: 1, nom: 'triangle isocèle', pts: [[-1.8, -1.4], [1.8, -1.4], [0, 2]], ticks: [0, 1, 1], lvl: 0, hint: `Les deux côtés codés sont égaux : cherche la droite qui passe par leur sommet commun et le milieu du troisième côté.` },
  scal: { n: 0, nom: 'triangle quelconque', pts: [[-2.2, -1.3], [2.4, -1.0], [0.6, 2.0]], ticks: [1, 2, 3], lvl: 0, hint: `Les trois côtés sont de longueurs différentes (codages différents) : une droite peut-elle plier le triangle en deux moitiés superposables ?` },
  los: { n: 2, nom: 'losange', pts: [[-2.4, 0], [0, -1.5], [2.4, 0], [0, 1.5]], ticks: [1, 1, 1, 1], lvl: 1, hint: `Pense aux diagonales : est-ce qu'en pliant le long de chacune, les deux moitiés se superposent ? Et pour les droites passant par les milieux des côtés ?` },
  para: { n: 0, nom: 'parallélogramme', pts: [[-2.4, -1.3], [1.6, -1.3], [2.6, 1.3], [-1.4, 1.3]], pars: true, lvl: 1, hint: `Un parallélogramme « penché » : essaie de plier selon une diagonale, puis selon la droite qui passe par les milieux de deux côtés opposés. Les deux moitiés se superposent-elles ?` },
  trap: { n: 1, nom: 'trapèze isocèle', pts: [[-2.4, -1.3], [2.4, -1.3], [1.3, 1.3], [-1.3, 1.3]], ticks: [0, 1, 0, 1], lvl: 1, hint: `Les deux côtés non parallèles sont égaux (codage) : cherche la droite qui passe par les milieux des deux bases.` },
  cerf: { n: 1, nom: 'cerf-volant', pts: [[0, -2], [1.7, 0], [0, 1.4], [-1.7, 0]], ticks: [1, 2, 2, 1], lvl: 3, hint: `Les côtés sont égaux deux par deux (codages) : cherche la diagonale qui relie les deux sommets où se rejoignent des côtés <b>différents</b>, et teste l'autre diagonale.` },
  pent: { n: 5, nom: 'pentagone régulier', pts: REG(5), ticks: [1, 1, 1, 1, 1], lvl: 3, hint: `Pour une figure régulière, compte les axes passant par un sommet et le milieu du côté opposé : combien y a-t-il de sommets ?` },
  hexa: { n: 6, nom: 'hexagone régulier', pts: REG(6), ticks: [1, 1, 1, 1, 1, 1], lvl: 3, hint: `Une figure régulière a des axes passant par deux sommets opposés, et d'autres passant par les milieux de côtés opposés : compte chaque sorte.` },
  risoc: { n: 1, nom: 'triangle rectangle isocèle', pts: [[-1.8, -1.4], [1.8, -1.4], [-1.8, 2.2]], rights: true, ticks: [0, 0, 0], lvl: 3, hint: `Ce triangle a un angle droit et deux côtés égaux : cherche la droite qui passe par l'angle droit et le milieu du côté opposé.` },
};
SHAPES.risoc.pts = [[-1.8, -1.8], [1.8, -1.8], [-1.8, 1.8]]; SHAPES.risoc.ticks = [1, 0, 1]; SHAPES.risoc.rightAt = 0;

function shapeFig(key, nm, t) {
  const S = SHAPES[key], P = {}, pts = S.pts.map(p => rot(p, t)), n = pts.length;
  nm.forEach((l, i) => { P[l] = pts[i]; });
  const f = { P, polys: [{ p: nm, c: COL.ink }], ticks: [], rights: [], pars: [], maxW: 360, maxH: 260, aria: S.nom + ' ' + nm.join(''), lab: {} };
  (S.ticks || []).forEach((k, i) => { if (k) f.ticks.push({ a: nm[i], b: nm[(i + 1) % n], n: k }); });
  if (S.rights) (key === 'risoc' ? [0] : [0, 1, 2, 3]).forEach(i => f.rights.push({ v: nm[i], a: nm[(i + 1) % n], b: nm[(i + n - 1) % n], size: 12 }));
  if (S.pars) f.pars = [{ a: nm[0], b: nm[1], n: 1 }, { a: nm[3], b: nm[2], n: 1 }, { a: nm[1], b: nm[2], n: 2 }, { a: nm[0], b: nm[3], n: 2 }];
  if (key === 'trap') f.pars = [{ a: nm[0], b: nm[1], n: 1 }, { a: nm[3], b: nm[2], n: 1 }];
  return { svg: figure(f), pts };
}
function axesQ(d) {
  const lvl = d < 1 ? 0 : d < 3 ? 1 : 3;
  const key = pick(Object.keys(SHAPES).filter(k => SHAPES[k].lvl <= lvl)), S = SHAPES[key];
  const nm = names(d, 'ABCDEF'.slice(0, S.pts.length)), { svg, pts } = shapeFig(key, nm, orient15(d));
  const nameTxt = S.pts.length === 3 ? `le triangle ${nm.join('')}` : S.pts.length === 4 ? `le quadrilatère ${nm.join('')}` : `le polygone ${nm.join('')}`;
  return numQ({
    E: [S.n], tpl: `Nombre d'axes : {0}`, keys: { neg: false }, html: `Combien d'axes de symétrie possède ${nameTxt} ? <small>(${S.nom})</small>`,
    visual: svg, hint: S.hint,
    solution: `Un axe de symétrie plie la figure en deux moitiés qui se superposent. Pour ${/^[aeiouéh]/.test(S.nom) ? 'cet' : 'ce'} ${S.nom} : ${S.n === 0 ? 'aucune droite ne convient (ni les diagonales, ni les droites passant par les milieux des côtés) : <b>0 axe</b>.' : `on trouve <b>${S.n} axe${S.n > 1 ? 's' : ''}</b> (${{ rect: 'les deux droites qui passent par les milieux des côtés opposés', carre: 'les 2 droites passant par les milieux de côtés opposés et les 2 diagonales', equi: 'une droite par sommet : elle passe par le sommet et le milieu du côté opposé', iso: 'la droite qui passe par le sommet principal et le milieu de la base', los: 'ses deux diagonales', trap: 'la droite qui passe par les milieux des deux bases', cerf: 'la diagonale qui relie les sommets « aux côtés différents »', pent: 'une droite par sommet, qui passe aussi par le milieu du côté opposé', hexa: '3 droites passant par deux sommets opposés et 3 passant par les milieux de côtés opposés', risoc: 'la droite qui passe par l\'angle droit et le milieu de l\'hypoténuse' }[key]}).`}`,
    msg: v => (key === 'rect' && v[0] === 4 ? `Les diagonales du rectangle ne sont pas des axes : elles ne plient pas la figure en deux moitiés superposables (ce n'est vrai que pour le carré).` : key === 'los' && v[0] === 4 ? `Les droites qui passent par les milieux des côtés opposés ne sont pas des axes du losange.` : key === 'para' && v[0] > 0 ? `Un parallélogramme « penché » n'a aucun axe : même la diagonale ne convient pas.` : ''),
    verify: Ev => countAxes(pts) === Ev[0],
  });
}
export function L2(d) { return chance(d < 1 ? 0.2 : d < 3 ? 0.35 : 0.45) ? axesQ(d) : pointQ(d); }

export function C2() {
  const ax = { k: 'v', a: 1 }, axh = { k: 'h', a: -1 }, ax2 = { k: 'd1', a: 0 }, ax3 = { k: 'd2', a: 2 }, axs = { k: 'v', a: 0 };
  const fig = (ax, A, name, extra) => gridFig(ax, { [name]: A, [name + '′']: reflect(ax, A).img }, { colors: { [name + '′']: COL.g }, fig: { segs: [{ a: A, b: reflect(ax, A).img, c: COL.g, dash: true, w: 2 }], ...(extra || {}) } });
  const figOn = gridFig({ k: 'v', a: 2 }, { C: [2, 3] }, {});
  const sh = k => shapeFig(k, 'ABCDEF'.split('').slice(0, SHAPES[k].pts.length), 0).svg;
  return cours('2. Symétrie axiale sur quadrillage', `Deux figures sont <b>symétriques par rapport à une droite</b> quand on peut en plier l'une sur l'autre le long de cette droite, comme les ailes d'un papillon.`,
    def(`Le <b>symétrique</b> du point A par rapport à la droite (d) est le point A′ tel que (d) coupe [AA′] <b>en son milieu et à angle droit</b>. La droite (d) est l'<b>axe de symétrie</b>. Un point de l'axe est son propre symétrique. Une figure a un <b>axe de symétrie</b> quand la symétrie par rapport à cette droite la laisse inchangée : on peut la plier en deux moitiés qui se superposent.`),
    meth(`Sur le quadrillage, trace (ou imagine) le chemin le plus court de A jusqu'à (d), <b>perpendiculaire</b> à (d) : horizontal pour un axe vertical, vertical pour un axe horizontal, en diagonale pour un axe diagonal.`, `Compte les pas jusqu'à (d), puis refais <b>autant de pas</b> de l'autre côté : tu arrives en A′.`, `Lis ses coordonnées sur le repère : abscisse (horizontale) d'abord, ordonnée ensuite.`),
    cols(fig(ax, [-2, 3], 'A'), fig(axh, [3, 2], 'B')),
    ex(`Exemple 1 : axe vertical, point A(−2 ; 3), image sur la droite x = 1`, `A est à 3 carreaux à gauche de (d), sur la ligne d'ordonnée 3. A′ est à 3 carreaux à droite de (d), sur la même ligne : l'abscisse devient 1 + 3 = 4, l'ordonnée ne change pas.<br>${rep('A′( 4 ; 3 )')}`),
    ex(`Exemple 2 : axe horizontal, point B(3 ; 2), (d) à la hauteur −1`, `B est à 3 carreaux au-dessus de (d). B′ est à 3 carreaux en dessous, dans la même colonne : l'abscisse ne change pas, l'ordonnée devient −1 − 3 = −4.<br>${rep('B′( 3 ; −4 )')}`),
    cols(fig(ax2, [-3, 1], 'C'), fig(ax3, [3, 3], 'D')),
    ex(`Exemple 3 : axe en diagonale, point C(−3 ; 1), (d) passe par O et (1 ; 1)`, `De C, on rejoint (d) <b>en diagonale</b>, perpendiculairement à l'axe : 2 pas « 1 carreau vers la droite et 1 vers le bas » mènent en (−1 ; −1), sur (d). On refait 2 pas identiques : on arrive en (1 ; −3).<br>${rep('C′( 1 ; −3 )')}`),
    ex(`Exemple 4 : autre diagonale, point D(3 ; 3), (d) passe par (2 ; 0) et (0 ; 2)`, `De D(3 ; 3), on rejoint (d) en diagonale : un pas « 1 carreau vers la gauche et 1 vers le bas » mène en (2 ; 2), puis un deuxième en (1 ; 1), qui est sur (d) car 1 + 1 = 2. Il y a donc 2 pas. On refait 2 pas de l'autre côté : (0 ; 0) puis (−1 ; −1).<br>${rep('D′( −1 ; −1 )')}`),
    ex(`Exemple 5 : le point est sur l'axe`, figOn + `Le point C(2 ; 3) est sur la droite (d) : x = 2. Un point de l'axe est son propre symétrique : C′ = C.<br>${rep('C′( 2 ; 3 )')}`),
    cols(sh('rect'), sh('equi'), sh('para')),
    ex(`Exemple 6 : combien d'axes de symétrie a une figure ? (rectangle, triangle équilatéral, parallélogramme)`, `On cherche toutes les droites qui plient la figure en deux moitiés superposables. Le rectangle ABCD : <b>2 axes</b> (les droites qui passent par les milieux de côtés opposés ; les diagonales ne conviennent pas). Le triangle équilatéral : <b>3 axes</b> (un par sommet, vers le milieu du côté opposé). Le parallélogramme : <b>0 axe</b>.<br>${rep('2 axes, 3 axes, 0 axe')}`),
    cols(sh('carre'), sh('los'), sh('iso'), sh('trap')),
    ex(`Exemple 7 : d'autres figures usuelles`, `Le carré : <b>4 axes</b> (2 médianes de côtés + 2 diagonales). Le losange : <b>2 axes</b> (ses diagonales). Le triangle isocèle : <b>1 axe</b>. Le trapèze isocèle : <b>1 axe</b> (la droite qui passe par les milieux des bases).<br>${rep('4 axes, 2 axes, 1 axe, 1 axe')}`),
    cols(sh('cerf'), sh('pent'), sh('hexa'), sh('risoc')),
    ex(`Exemple 8 : figures plus riches`, `Le cerf-volant : <b>1 axe</b> (une diagonale). Le pentagone régulier : <b>5 axes</b>. L'hexagone régulier : <b>6 axes</b>. Le triangle rectangle isocèle : <b>1 axe</b>, qui passe par l'angle droit.<br>${rep('1 axe, 5 axes, 6 axes, 1 axe')}`),
    warn(`Compte les carreaux sur un chemin <b>perpendiculaire</b> à l'axe, pas en allant n'importe où vers (d).`, `Les diagonales d'un rectangle ne sont pas des axes de symétrie (celles d'un losange, oui) ; un parallélogramme n'a aucun axe.`, `Après la symétrie, ni la distance à l'axe ni la ligne (ou la colonne) pour un axe horizontal ou vertical ne changent.`),
    retenir(`le symétrique est à la même distance de l'axe, de l'autre côté, sur un chemin perpendiculaire à l'axe.`));
}
void sg; void fr; void dist;

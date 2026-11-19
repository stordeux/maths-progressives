// Niveau 11 : aire du parallélogramme et de figures composées. 5e.
import { figure, rot, COL } from './draw.js';
import { numQ, orient, ex, rep, warn, retenir, meth, def, cours, cols, pick, ri, fr } from './util.js';

const K = 0.4; // unités du dessin par cm
const area = pts => Math.abs(pts.reduce((s, p, i) => { const q = pts[(i + 1) % pts.length]; return s + p[0] * q[1] - q[0] * p[1]; }, 0)) / 2;
const TRIPLES = [[3, 4, 5], [6, 8, 10], [5, 12, 13], [4, 3, 5], [8, 6, 10], [12, 5, 13]];
const sc = (pts, t) => pts.map(p => rot([p[0] * K, p[1] * K], t));

/** parallélogramme de base b, de hauteur h, décalage p ; la hauteur (pointillés) part de D */
function paraScene(b, h, p, t, o = {}) {
  const [A, B, C, D] = sc([[0, 0], [b, 0], [b + p, h], [p, h]], t), Fp = rot([p * K, 0], t), nm = o.nm || ['A', 'B', 'C', 'D'];
  const P = { [nm[0]]: A, [nm[1]]: B, [nm[2]]: C, [nm[3]]: D, H: Fp };
  const g = [(A[0] + B[0] + C[0] + D[0]) / 4, (A[1] + B[1] + C[1] + D[1]) / 4];
  const out = (p1, p2, s, c) => { const u = [p2[0] - p1[0], p2[1] - p1[1]], m = [(p1[0] + p2[0]) / 2 - g[0], (p1[1] + p2[1]) / 2 - g[1]]; return { a: p1, b: p2, s, c, off: 14, side: (-u[1] * m[0] + u[0] * m[1]) >= 0 ? 1 : -1 }; };
  const f = {
    P, polys: [{ p: nm, c: COL.ink, fill: o.fill || '#dbeafe' }], segs: [{ a: D, b: Fp, c: COL.a, dash: true, w: 2 }], rights: [{ v: 'H', a: nm[3], b: nm[1], size: 11 }], ext: 0, maxW: 460, maxH: 250, colors: { H: COL.a }, aria: 'parallélogramme et sa hauteur',
    len: [out(A, B, o.lb || `${b} cm`, COL.b), { a: D, b: Fp, s: o.lh || `${h} cm`, side: -1, c: COL.a, off: 14 }, ...(o.side ? [out(A, D, o.side, COL.g)] : [])],
  };
  if (o.hideH) f.hide = ['H'];
  return { svg: figure(f), pts: [A, B, C, D] };
}
/** maison : rectangle a × b surmonté d'un triangle de base a et de hauteur tt */
function houseScene(a, b, tt, x, t) {
  const R = sc([[0, 0], [a, 0], [a, b], [0, b]], t), T = rot([x * K, (b + tt) * K], t), F = rot([x * K, b * K], t), L = sc([[0, b], [a, b]], t);
  const f = {
    P: { A: R[0], B: R[1], C: R[2], D: R[3], T }, polys: [{ p: ['A', 'B', 'C', 'D'], c: COL.ink, fill: '#dbeafe' }, { p: ['D', 'C', 'T'], c: COL.ink, fill: '#fde68a' }], segs: [{ a: T, b: F, c: COL.a, dash: true, w: 2 }],
    ext: 0, maxW: 400, maxH: 270, aria: 'rectangle surmonté d\'un triangle', hide: ['A', 'B', 'C', 'D', 'T'], rights: [], colors: {},
    len: [{ a: R[0], b: R[1], s: `${a} cm`, side: -1, c: COL.b, off: 14 }, { a: R[1], b: R[2], s: `${b} cm`, side: -1, c: COL.b, off: 14 }, { a: T, b: F, s: `${tt} cm`, side: 1, c: COL.a, off: 14 }],
  };
  void L;
  return { svg: figure(f), pts: [R[0], R[1], R[2], T, R[3]] };
}
/** rectangle L × l dont on retire un parallélogramme intérieur (base b, hauteur h) */
function holeScene(L, l, b, h, t) {
  const Rr = sc([[0, 0], [L, 0], [L, l], [0, l]], t), x0 = (L - b - 1) / 2, y0 = (l - h) / 2, Pp = sc([[x0, y0], [x0 + b, y0], [x0 + b + 1, y0 + h], [x0 + 1, y0 + h]], t);
  const Fp = rot([(x0 + 1) * K, y0 * K], t), top = Pp[3];
  const f = {
    P: { A: Rr[0], B: Rr[1], C: Rr[2], D: Rr[3], E: Pp[0], F: Pp[1], G: Pp[2], I: Pp[3], H: Fp }, hide: ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'I', 'H'],
    polys: [{ p: ['A', 'B', 'C', 'D'], c: COL.ink, fill: '#fed7aa' }, { p: ['E', 'F', 'G', 'I'], c: COL.ink, fill: '#ffffff' }], segs: [{ a: top, b: Fp, c: COL.a, dash: true, w: 2 }], ext: 0, maxW: 420, maxH: 260, aria: 'rectangle avec un trou en forme de parallélogramme', colors: {},
    len: [{ a: Rr[0], b: Rr[1], s: `${L} cm`, side: -1, c: COL.b, off: 14 }, { a: Rr[1], b: Rr[2], s: `${l} cm`, side: -1, c: COL.b, off: 14 }, { a: Pp[0], b: Pp[1], s: `${b} cm`, side: 1, c: COL.g, off: 14 }, { a: Fp, b: top, s: `${h} cm`, side: 1, c: COL.a, off: 14 }],
  };
  return { svg: figure(f), outer: Rr, inner: Pp };
}

export function L11(d) {
  const t = orient(d);
  const forms = d < 1 ? ['para'] : d < 2 ? ['para', 'quelle'] : d < 3 ? ['para', 'quelle', 'base'] : d < 4 ? ['para', 'quelle', 'base', 'maison'] : ['quelle', 'base', 'maison', 'hole', 'maison'];
  const f = pick(forms);
  if (f === 'para') {
    const b = ri(4, d < 1 ? 9 : 14), h = ri(3, d < 1 ? 6 : 9), sc0 = paraScene(b, h, ri(1, 3), t), E = b * h;
    return numQ({
      E: [E], tpl: `Aire : {0} cm²`, html: `Quelle est l'aire de ce parallélogramme, de base ${b} cm et de hauteur ${h} cm ?`, visual: sc0.svg,
      hint: `La hauteur (en pointillés, avec l'angle droit) est <b>perpendiculaire</b> à la base de ${b} cm : multiplie la base par la hauteur de ${h} cm, sans ÷ 2.`,
      solution: `Aire du parallélogramme = base × hauteur = ${b} × ${h} = <b>${E} cm²</b>.`,
      msg: v => (v[0] === b * h / 2 ? `Pas de ÷ 2 pour le parallélogramme (c'est pour le triangle) : aire = base × hauteur.` : v[0] === 2 * (b + h) ? `Tu as calculé le périmètre d'un rectangle ; on cherche l'aire : base × hauteur.` : ''), value: area(sc0.pts) / (K * K),
    });
  }
  if (f === 'quelle') {
    const [p, h, s] = pick(TRIPLES), b = ri(Math.max(p + 1, 5), 14), sc0 = paraScene(b, h, p, t, { side: `${s} cm`, hideH: false }), E = b * h;
    return numQ({
      E: [E], tpl: `Aire : {0} cm²`, html: `ABCD est un parallélogramme avec AB = ${b} cm, AD = ${s} cm. La hauteur relative à [AB] mesure ${h} cm. Quelle est son aire ?`, visual: sc0.svg,
      hint: `Le côté de ${s} cm est penché : ce n'est pas la hauteur. L'aire utilise un côté et la hauteur qui lui correspond : ici AB = ${b} cm et la hauteur en pointillés (${h} cm, perpendiculaire à [AB]).`,
      solution: `La hauteur relative à [AB] est ${h} cm (la longueur AD = ${s} cm n'est pas une hauteur). Aire = AB × hauteur = ${b} × ${h} = <b>${E} cm²</b>.`,
      msg: v => (v[0] === b * s ? `${s} cm est la longueur du côté penché [AD], pas la hauteur : utilise ${h} cm.` : ''), value: area(sc0.pts) / (K * K),
    });
  }
  if (f === 'base') {
    const h = ri(3, 9), b = ri(4, 14), A = b * h, which = ri(0, 1) === 0, sc0 = paraScene(b, h, ri(1, 3), t, which ? { lb: '?', lh: `${h} cm` } : { lb: `${b} cm`, lh: '?' });
    return numQ({
      E: [which ? b : h], tpl: which ? `base : {0} cm` : `hauteur : {0} cm`, html: which ? `Un parallélogramme a une aire de ${A} cm² et une hauteur de ${h} cm. Quelle est la longueur de sa base ?` : `Un parallélogramme a une aire de ${A} cm² et une base de ${b} cm. Quelle est la hauteur correspondante ?`, visual: sc0.svg,
      hint: which ? `L'aire est base × hauteur : ${A} = base × ${h}. Quel calcul (une division) te donne la base ?` : `L'aire est base × hauteur : ${A} = ${b} × hauteur. Quel calcul (une division) te donne la hauteur ?`,
      solution: which ? `Aire = base × hauteur donc base = aire ÷ hauteur = ${A} ÷ ${h} = <b>${b} cm</b>.` : `Aire = base × hauteur donc hauteur = aire ÷ base = ${A} ÷ ${b} = <b>${h} cm</b>.`,
      msg: v => (v[0] === A * (which ? h : b) ? `Tu as multiplié : pour retrouver un facteur, on <b>divise</b> l'aire par l'autre.` : ''), value: which ? A / h : A / b,
    });
  }
  if (f === 'maison') {
    let a, tt; do { a = ri(4, 12); tt = ri(2, 8); } while (d < 4 && (a * tt) % 2);
    const b = ri(3, 8), x = ri(1, a - 1), sc0 = houseScene(a, b, tt, x, t), E = a * b + a * tt / 2;
    return numQ({
      E: [E], tpl: `Aire : {0} cm²`, comma: true, html: `Cette figure est un rectangle (${a} cm sur ${b} cm) surmonté d'un triangle de base ${a} cm et de hauteur ${tt} cm. Quelle est son aire totale ?`, visual: sc0.svg,
      hint: `Découpe la figure en deux : le rectangle ${a} cm × ${b} cm et le triangle (base ${a} cm, hauteur ${tt} cm, en pointillés). Calcule chaque aire (n'oublie pas la ÷ 2 pour le triangle), puis additionne.`,
      solution: `Rectangle : ${a} × ${b} = ${a * b} cm². Triangle : ${a} × ${tt} ÷ 2 = ${fr(a * tt / 2)} cm². Total : ${a * b} + ${fr(a * tt / 2)} = <b>${fr(E)} cm²</b>.`,
      msg: v => (v[0] === a * b + a * tt ? `Il manque la ÷ 2 pour l'aire du triangle.` : v[0] === a * b ? `Tu as oublié le triangle au-dessus du rectangle.` : ''), value: area(sc0.pts) / (K * K),
    });
  }
  // hole
  const b = ri(2, 5), h = ri(2, 4), L = ri(b + 4, 12), l = ri(h + 3, 9), E = L * l - b * h, sc0 = holeScene(L, l, b, h, t);
  return numQ({
    E: [E], tpl: `Aire colorée : {0} cm²`, html: `Dans un rectangle de ${L} cm sur ${l} cm, on a découpé un parallélogramme de base ${b} cm et de hauteur ${h} cm. Quelle est l'aire de la partie colorée (orange) ?`, visual: sc0.svg,
    hint: `L'aire colorée est celle du grand rectangle (${L} cm sur ${l} cm) <b>moins</b> celle du parallélogramme (base ${b} cm, hauteur ${h} cm) : calcule les deux, puis soustrais.`,
    solution: `Rectangle : ${L} × ${l} = ${L * l} cm². Parallélogramme : ${b} × ${h} = ${b * h} cm². Aire colorée = ${L * l} − ${b * h} = <b>${E} cm²</b>.`,
    msg: v => (v[0] === L * l + b * h ? `La partie colorée est ce qui <b>reste</b> : il faut soustraire l'aire du trou, pas l'ajouter.` : v[0] === L * l ? `Tu as oublié d'enlever le trou.` : ''), value: (area(sc0.outer) - area(sc0.inner)) / (K * K),
  });
}

export function C11() {
  const p1 = paraScene(7, 4, 2, 0).svg, p2 = paraScene(8, 4, 3, 0, { side: '5 cm' }).svg, p3 = paraScene(6, 5, 2, 0, { lb: '?' }).svg, p4 = paraScene(6, 5, 2, 0, { lh: '?' }).svg;
  const hs = houseScene(8, 5, 3, 3, 0).svg, ho = holeScene(10, 7, 4, 3, 0).svg;
  return cours('11. Aire d\'un parallélogramme et figures composées', `Un parallélogramme a la même aire qu'un rectangle de même base et de même hauteur : on « déplace » le triangle de gauche à droite. Pour une figure compliquée, on la découpe en figures simples.`,
    def(`<b>Aire d'un parallélogramme</b> = <b>base × hauteur</b>, où la hauteur est perpendiculaire à la base (pas le côté penché !).<br>Aire d'un triangle = base × hauteur ÷ 2 ; aire d'un rectangle = longueur × largeur.<br>Une <b>figure composée</b> se découpe en figures simples dont on ajoute (ou retranche) les aires.`),
    meth(`Repère la <b>base</b> et la <b>hauteur</b> qui lui correspond (angle droit, pointillés).`, `Pour une figure composée, découpe-la en rectangle, parallélogramme, triangle…`, `Calcule chaque aire, puis ajoute (pièces côte à côte) ou soustrais (partie enlevée). Écris l'unité : cm².`),
    p1,
    ex(`Exemple 1 : aire d'un parallélogramme de base 7 cm et de hauteur 4 cm`, `Aire = base × hauteur = 7 × 4.<br>${rep('aire : 28 cm²')}`),
    p2,
    ex(`Exemple 2 : AB = 8 cm, AD = 5 cm, la hauteur relative à [AB] mesure 4 cm`, `Le côté de 5 cm est penché : ce n'est pas la hauteur. On prend AB et la hauteur correspondante : 8 × 4.<br>${rep('aire : 32 cm²')}`),
    p3,
    ex(`Exemple 3 : retrouver la base (aire 30 cm², hauteur 5 cm)`, `Aire = base × hauteur, donc base = aire ÷ hauteur = 30 ÷ 5.<br>${rep('base : 6 cm')}`),
    p4,
    ex(`Exemple 4 : retrouver la hauteur (aire 30 cm², base 6 cm)`, `Hauteur = aire ÷ base = 30 ÷ 6.<br>${rep('hauteur : 5 cm')}`),
    hs,
    ex(`Exemple 5 : un rectangle de 8 cm sur 5 cm surmonté d'un triangle de base 8 cm et de hauteur 3 cm`, `Rectangle : 8 × 5 = 40 cm². Triangle : 8 × 3 ÷ 2 = 12 cm². On additionne : 40 + 12.<br>${rep('aire : 52 cm²')}`),
    ho,
    ex(`Exemple 6 : un rectangle de 10 cm sur 7 cm dont on a enlevé un parallélogramme de base 4 cm et de hauteur 3 cm`, `Rectangle : 10 × 7 = 70 cm². Parallélogramme enlevé : 4 × 3 = 12 cm². On soustrait : 70 − 12.<br>${rep('aire de la partie colorée : 58 cm²')}`),
    warn(`La hauteur n'est pas le côté penché : c'est la distance perpendiculaire entre deux côtés opposés.`, `Pas de ÷ 2 pour un parallélogramme (seulement pour un triangle).`, `Pour une partie « enlevée », on <b>soustrait</b> ; pour des pièces côte à côte, on <b>ajoute</b>.`),
    retenir(`aire du parallélogramme = base × hauteur (hauteur perpendiculaire à la base) ; figure composée : on ajoute ou on retranche les aires.`));
}
void cols;

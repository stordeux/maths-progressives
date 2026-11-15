// Dessins du module « Aires, périmètres, volumes » (chaînes SVG, sans DOM : importable par Node).
// Figures planes cotées, quadrillage, solides en perspective cavalière, tableaux de conversion.
// Toutes les fonctions sont déterministes (aucun tirage aléatoire ici).

const COL = { line: '#1c3d6e', fill: '#d0ebff', fill2: '#a5d8ff', fill3: '#74c0fc', acc: '#1971c2', red: '#d6336c', txt: '#212529', grid: '#ced4da', cote: '#495057', ok: '#2b8a3e' };
const r1 = x => Math.round(x * 10) / 10;
const FONT = 'font-family="system-ui,sans-serif"';

/* ================= scène plane générique ================= */
// On décrit la figure en coordonnées « mathématiques » (y vers le haut), puis svg() met à l'échelle
// et calcule la boîte englobante en pixels (étiquettes comprises) : rien n'est coupé.
export class Scene {
  constructor() { this.el = []; this.P = []; }
  add(...pts) { pts.forEach(p => this.P.push(p)); return this; }
  /** polygone ou ligne brisée ; o : {fill, stroke, dash, w, open} */
  poly(pts, o = {}) { this.add(...pts); this.el.push({ t: 'poly', pts, o }); return this; }
  line(a, b, o = {}) { this.add(a, b); this.el.push({ t: 'poly', pts: [a, b], o: { open: true, ...o } }); return this; }
  /** texte placé au point p, décalé de (dx, dy) pixels */
  text(p, s, o = {}) { this.el.push({ t: 'text', p, s, o }); return this; }
  /** cote de a à b, du côté side (+1 / −1) */
  cote(a, b, s, side = 1, o = {}) { this.el.push({ t: 'cote', a, b, s, side, o }); return this; }
  /** angle droit en p, entre les directions p→u et p→v */
  right(p, u, v) { this.el.push({ t: 'right', p, u, v }); return this; }
  dot(p, s, o = {}) { this.add(p); this.el.push({ t: 'dot', p, s, o }); return this; }
  /** maxW, maxH : taille du dessin (hors étiquettes) en pixels */
  svg({ maxW = 330, maxH = 200, label = 'figure', scale } = {}) {
    const xs = this.P.map(p => p[0]), ys = this.P.map(p => p[1]);
    const x0 = Math.min(...xs), x1 = Math.max(...xs), y0 = Math.min(...ys), y1 = Math.max(...ys);
    const s = scale || Math.min(maxW / Math.max(x1 - x0, 1e-9), maxH / Math.max(y1 - y0, 1e-9));
    const T = p => [(p[0] - x0) * s, (y1 - p[1]) * s];
    let bx0 = 0, by0 = 0, bx1 = (x1 - x0) * s, by1 = (y1 - y0) * s;
    const grow = (x, y) => { bx0 = Math.min(bx0, x); bx1 = Math.max(bx1, x); by0 = Math.min(by0, y); by1 = Math.max(by1, y); };
    const txt = (x, y, str, o = {}) => {
      const size = o.size || 16, w = String(str).length * size * 0.56;
      const anc = o.anchor || 'middle';
      const xl = anc === 'start' ? x : anc === 'end' ? x - w : x - w / 2;
      grow(xl - 2, y - size * 0.62); grow(xl + w + 2, y + size * 0.62);
      str = String(str).replace(/[  ]/g, ' '); // espaces simples dans le SVG
      return `<text x="${r1(x)}" y="${r1(y)}" font-size="${size}" text-anchor="${anc}" dominant-baseline="central" fill="${o.color || COL.txt}"${o.bold === false ? '' : ' font-weight="600"'} paint-order="stroke" stroke="#fff" stroke-width="4" stroke-linejoin="round">${str}</text>`;
    };
    let out = '', top = '';
    for (const e of this.el) {
      if (e.t === 'poly') {
        const q = e.pts.map(T), o = e.o;
        out += `<path d="M${q.map(p => `${r1(p[0])},${r1(p[1])}`).join(' L')}${o.open ? '' : ' Z'}" fill="${o.open ? 'none' : (o.fill || 'none')}" stroke="${o.stroke === undefined ? COL.line : o.stroke}" stroke-width="${o.w || 2.4}"${o.dash ? ` stroke-dasharray="${o.dash === true ? '7 5' : o.dash}"` : ''} stroke-linejoin="round" stroke-linecap="round"/>`;
      } else if (e.t === 'text') {
        const [x, y] = T(e.p);
        top += txt(x + (e.o.dx || 0), y + (e.o.dy || 0), e.s, e.o);
      } else if (e.t === 'dot') {
        const [x, y] = T(e.p);
        out += `<circle cx="${r1(x)}" cy="${r1(y)}" r="${e.o.r || 3.5}" fill="${e.o.color || COL.line}"/>`;
        if (e.s) top += txt(x + (e.o.dx ?? -12), y + (e.o.dy ?? 12), e.s, { size: 16, color: e.o.color });
      } else if (e.t === 'right') {
        const [px, py] = T(e.p), [ux, uy] = T(e.u), [vx, vy] = T(e.v);
        const nu = Math.hypot(ux - px, uy - py) || 1, nv = Math.hypot(vx - px, vy - py) || 1, k = 11;
        const a = [px + (ux - px) / nu * k, py + (uy - py) / nu * k], b = [px + (vx - px) / nv * k, py + (vy - py) / nv * k];
        out += `<path d="M${r1(a[0])},${r1(a[1])} L${r1(a[0] + b[0] - px)},${r1(a[1] + b[1] - py)} L${r1(b[0])},${r1(b[1])}" fill="none" stroke="${COL.cote}" stroke-width="1.6"/>`;
      } else if (e.t === 'cote') {
        const A = T(e.a), B = T(e.b), L = Math.hypot(B[0] - A[0], B[1] - A[1]) || 1;
        const d = [(B[0] - A[0]) / L, (B[1] - A[1]) / L], n = [d[1] * e.side, -d[0] * e.side];
        const off = e.o.off ?? 16, c = e.o.color || COL.cote;
        const A2 = [A[0] + n[0] * off, A[1] + n[1] * off], B2 = [B[0] + n[0] * off, B[1] + n[1] * off];
        out += `<path d="M${r1(A2[0])},${r1(A2[1])} L${r1(B2[0])},${r1(B2[1])}" stroke="${c}" stroke-width="1.4" fill="none"/>`;
        for (const P of [A2, B2]) out += `<path d="M${r1(P[0] - n[0] * 6)},${r1(P[1] - n[1] * 6)} L${r1(P[0] + n[0] * 6)},${r1(P[1] + n[1] * 6)}" stroke="${c}" stroke-width="1.4"/>`;
        const size = e.o.size || 16, w = String(e.s).length * size * 0.56;
        const gap = 6 + Math.abs(n[0]) * w / 2 + Math.abs(n[1]) * size * 0.55;
        top += txt((A2[0] + B2[0]) / 2 + n[0] * gap, (A2[1] + B2[1]) / 2 + n[1] * gap, e.s, { size, color: e.o.tcolor || COL.txt });
        grow(A2[0], A2[1]); grow(B2[0], B2[1]);
      }
    }
    const m = 4, W = bx1 - bx0 + 2 * m, H = by1 - by0 + 2 * m;
    return `<svg viewBox="${r1(bx0 - m)} ${r1(by0 - m)} ${r1(W)} ${r1(H)}" class="vis" style="width:${Math.round(W)}px" role="img" aria-label="${label}" ${FONT}>${out}${top}</svg>`;
  }
}

/* ================= outils ================= */
/** points d'un arc d'ellipse de centre c, demi-axes rx, ry, de t1 à t2 (radians) */
export function arc(c, rx, ry, t1, t2, n = 48) {
  const out = [];
  for (let i = 0; i <= n; i++) { const t = t1 + (t2 - t1) * i / n; out.push([c[0] + rx * Math.cos(t), c[1] + ry * Math.sin(t)]); }
  return out;
}
/** ramène des dimensions à des proportions lisibles (rapport max/min ≤ 3) */
export function lisible(...v) {
  const mx = Math.max(...v);
  return v.map(x => Math.max(x, mx / 3));
}
/** perspective cavalière : angle 45°, coefficient 0,5 (x à droite, y en haut, z en profondeur) */
const K = 0.5 * Math.SQRT1_2;
export const proj = ([x, y, z]) => [x + K * z, y + K * z];

/* ================= quadrillage ================= */
/** mat[y][x] = true si le carreau est colorié (y = 0 en haut) */
export function quadrillage(mat, label = 'figure sur quadrillage') {
  const H = mat.length, W = mat[0].length, c = 32, m = 3;
  const on = (x, y) => y >= 0 && y < H && x >= 0 && x < W && mat[y][x];
  let s = `<svg viewBox="${-m} ${-m} ${W * c + 2 * m} ${H * c + 2 * m}" class="vis" style="width:${W * c + 2 * m}px" role="img" aria-label="${label}">`;
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) if (mat[y][x]) s += `<rect x="${x * c}" y="${y * c}" width="${c}" height="${c}" fill="${COL.fill3}"/>`;
  for (let i = 0; i <= W; i++) s += `<line x1="${i * c}" y1="0" x2="${i * c}" y2="${H * c}" stroke="${COL.grid}" stroke-width="1"/>`;
  for (let j = 0; j <= H; j++) s += `<line x1="0" y1="${j * c}" x2="${W * c}" y2="${j * c}" stroke="${COL.grid}" stroke-width="1"/>`;
  // contour de la figure : côtés entre un carreau colorié et un carreau vide
  let p = '';
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    if (!mat[y][x]) continue;
    if (!on(x, y - 1)) p += `M${x * c},${y * c}h${c}`;
    if (!on(x, y + 1)) p += `M${x * c},${(y + 1) * c}h${c}`;
    if (!on(x - 1, y)) p += `M${x * c},${y * c}v${c}`;
    if (!on(x + 1, y)) p += `M${(x + 1) * c},${y * c}v${c}`;
  }
  return s + `<path d="${p}" stroke="${COL.line}" stroke-width="3.5" stroke-linecap="round" fill="none"/></svg>`;
}

/* ================= figures planes ================= */
/** rectangle (ou carré) coté ; tL, tl : étiquettes de la longueur et de la largeur */
export function rectangle(L, l, tL, tl, o = {}) {
  const [a, b] = lisible(L, l), S = new Scene();
  const P = [[0, 0], [a, 0], [a, b], [0, b]];
  S.poly(P, { fill: COL.fill });
  [[0, 0, 1, 0, 0, 1], [a, 0, -1, 0, 0, 1], [a, b, -1, 0, 0, -1], [0, b, 1, 0, 0, -1]].forEach(([x, y, ux, uy, vx, vy]) => S.right([x, y], [x + ux, y + uy], [x + vx, y + vy]));
  if (o.carre) { // codage : quatre côtés égaux
    const tick = (p, q) => { const m = [(p[0] + q[0]) / 2, (p[1] + q[1]) / 2], hor = p[1] === q[1], e = a * 0.035; S.line(hor ? [m[0], m[1] - e] : [m[0] - e, m[1]], hor ? [m[0], m[1] + e] : [m[0] + e, m[1]], { w: 2, stroke: COL.red }); };
    P.forEach((p, i) => tick(p, P[(i + 1) % 4]));
  }
  if (tL) S.cote([0, 0], [a, 0], tL, -1);
  if (tl) S.cote([a, 0], [a, b], tl, -1);
  return S.svg({ maxW: o.maxW || 280, maxH: o.maxH || 170, label: o.label || 'rectangle' });
}

/** triangle ABC de base AB = b, sommet C d'abscisse f et de hauteur h ; t : étiquettes {b, h, side} */
export function triangle(b, h, f, t = {}) {
  const S = new Scene(), A = [0, 0], B = [b, 0], C = [f, h], H = [f, 0];
  S.poly([A, B, C], { fill: COL.fill });
  if (f < 0) S.line([f, 0], A, { dash: true, w: 1.6 });
  if (f > b) S.line(B, [f, 0], { dash: true, w: 1.6 });
  const footOnVertex = Math.abs(f) < 1e-9 || Math.abs(f - b) < 1e-9;
  if (!footOnVertex) S.line(C, H, { dash: true, stroke: COL.red, w: 2 });
  S.right(H, [f + (f > b / 2 ? -1 : 1), 0], C);
  S.text(A, 'A', { dx: -12, dy: 12 }).text(B, 'B', { dx: 12, dy: 12 }).text(C, 'C', { dy: -14 });
  if (!footOnVertex) S.text(H, 'H', { dx: f > b ? 12 : f < 0 ? -12 : 0, dy: 14 });
  if (t.b) S.cote(A, B, t.b, -1, { off: 30 });
  const left = f <= 0 || (f < b && f > b / 2); // étiquette de la hauteur à gauche du segment
  if (t.h) S.text([f, h / 2], t.h, { dx: left ? -8 : 8, anchor: left ? 'end' : 'start', color: COL.red });
  if (t.side) S.text([f / 2, h / 2], t.side, f < 0 ? { dx: 10, anchor: 'start' } : { dx: -10, anchor: 'end' });
  return S.svg({ maxW: 300, maxH: 170, label: 'triangle ABC et sa hauteur' });
}

/** disque de rayon r ; mode 'r' (rayon coté) ou 'd' (diamètre coté) */
export function disque(mode, t, o = {}) {
  const S = new Scene(), r = 1;
  S.poly(arc([0, 0], r, r, 0, 2 * Math.PI, 72), { fill: COL.fill });
  S.dot([0, 0], 'O', { dx: mode === 'd' ? 0 : -10, dy: mode === 'd' ? 14 : 14 });
  if (mode === 'd') { S.line([-r, 0], [r, 0], { stroke: COL.red, w: 2.4 }); S.text([0, 0], t, { dy: -14, color: COL.red }); }
  else { S.line([0, 0], [r * Math.cos(0.6), r * Math.sin(0.6)], { stroke: COL.red, w: 2.4 }); S.text([0.5 * Math.cos(0.6), 0.5 * Math.sin(0.6)], t, { dx: -6, dy: -12, anchor: 'end', color: COL.red }); }
  return S.svg({ maxW: o.size || 150, maxH: o.size || 150, label: 'disque de centre O' });
}

/** figure en L : rectangle a × b privé du coin c × e en haut à droite */
export function figureL(a, b, c, e, t) {
  const S = new Scene(), P = [[0, 0], [a, 0], [a, b - e], [a - c, b - e], [a - c, b], [0, b]];
  S.poly(P, { fill: COL.fill });
  S.poly([[a - c, b - e], [a, b - e], [a, b], [a - c, b]], { dash: '4 4', stroke: '#adb5bd', w: 1.5 });
  S.cote([0, 0], [a, 0], t.a, -1).cote([0, 0], [0, b], t.b, 1);
  S.cote([a - c, b], [a, b], t.c, 1, { off: 10 }).cote([a, b - e], [a, b], t.e, -1, { off: 10 });
  return S.svg({ maxW: 280, maxH: 190, label: 'figure en forme de L' });
}

/** « maison » : rectangle L × h1 surmonté d'un triangle isocèle de hauteur h2 */
export function maison(L, h1, h2, t) {
  const S = new Scene(), P = [[0, 0], [L, 0], [L, h1], [L / 2, h1 + h2], [0, h1]];
  S.poly(P, { fill: COL.fill });
  S.line([0, h1], [L, h1], { dash: '4 4', stroke: '#868e96', w: 1.5 });
  S.line([L / 2, h1], [L / 2, h1 + h2], { dash: true, stroke: COL.red, w: 2 });
  S.right([L / 2, h1], [L, h1], [L / 2, h1 + h2]);
  S.cote([0, 0], [L, 0], t.L, -1).cote([L, 0], [L, h1], t.h1, -1);
  S.cote([0, h1], [0, h1 + h2], t.h2, 1, { off: 14, tcolor: COL.red });
  S.line([0, h1 + h2], [L / 2, h1 + h2], { dash: '2 4', w: 1, stroke: COL.cote });
  return S.svg({ maxW: 260, maxH: 200, label: 'rectangle surmonté d\'un triangle' });
}

/** rectangle L × l prolongé par un demi-disque de diamètre l (à droite) */
export function demiDisque(L, l, t) {
  const S = new Scene(), lab = t;
  [L, l] = lisible(L, l);
  const r = l / 2, P = [[0, 0], [L, 0], ...arc([L, r], r, r, -Math.PI / 2, Math.PI / 2, 40), [0, l]];
  t = lab;
  S.poly(P, { fill: COL.fill });
  S.line([L, 0], [L, l], { dash: '4 4', stroke: '#868e96', w: 1.5 });
  S.cote([0, 0], [L, 0], t.L, -1).cote([0, 0], [0, l], t.l, 1);
  return S.svg({ maxW: 300, maxH: 160, label: 'rectangle et demi-disque' });
}

/** rectangle L × l percé d'un trou circulaire de rayon r au centre */
export function trou(L0, l0, r0, t) {
  const S = new Scene(), [L, l] = lisible(L0, l0), k = Math.min(L / L0, l / l0);
  const r = Math.min(Math.max(r0 * k, 0.15 * Math.min(L, l)), 0.42 * Math.min(L, l));
  S.poly([[0, 0], [L, 0], [L, l], [0, l]], { fill: COL.fill });
  S.poly(arc([L / 2, l / 2], r, r, 0, 2 * Math.PI, 60), { fill: '#fff' });
  S.dot([L / 2, l / 2], '', { r: 3 });
  S.line([L / 2, l / 2], [L / 2 + r, l / 2], { stroke: COL.red, w: 2 });
  S.text([L / 2 + r, l / 2], t.r, { dx: 6, anchor: 'start', color: COL.red });
  S.cote([0, 0], [L, 0], t.L, -1).cote([0, 0], [0, l], t.l, 1);
  return S.svg({ maxW: 280, maxH: 170, label: 'rectangle percé d\'un disque' });
}

/* ================= solides ================= */
function pave3(S, L, h, l, t = {}, o = {}) {
  const x0 = o.x0 || 0, p = (x, y, z) => { const q = proj([x, y, z]); return [q[0] + x0, q[1]]; };
  const A = p(0, 0, 0), B = p(L, 0, 0), C = p(L, h, 0), D = p(0, h, 0), E = p(0, 0, l), F = p(L, 0, l), G = p(L, h, l), H = p(0, h, l);
  S.poly([A, B, C, D], { fill: COL.fill, stroke: 'none' }).poly([D, C, G, H], { fill: COL.fill3, stroke: 'none' }).poly([B, F, G, C], { fill: COL.fill2, stroke: 'none' });
  if (o.grille) {
    const g = { stroke: '#4dabf7', w: 1.1 };
    for (let i = 1; i < L; i++) { S.line(p(i, 0, 0), p(i, h, 0), g); S.line(p(i, h, 0), p(i, h, l), g); }
    for (let j = 1; j < h; j++) { S.line(p(0, j, 0), p(L, j, 0), g); S.line(p(L, j, 0), p(L, j, l), g); }
    for (let k = 1; k < l; k++) { S.line(p(0, h, k), p(L, h, k), g); S.line(p(L, 0, k), p(L, h, k), g); }
  }
  [[E, A], [E, F], [E, H]].forEach(([a, b]) => S.line(a, b, { dash: '6 5', w: 1.6 }));
  [[A, B], [B, C], [C, D], [D, A], [B, F], [F, G], [G, C], [G, H], [H, D]].forEach(([a, b]) => S.line(a, b));
  if (t.L) S.cote(A, B, t.L, -1, { off: 12 });
  if (t.h) { if (o.hDroite) S.cote(F, G, t.h, -1, { off: 12 }); else S.cote(A, D, t.h, 1, { off: 12 }); }
  if (t.l) S.text([(B[0] + F[0]) / 2, (B[1] + F[1]) / 2], t.l, { dx: 10, dy: 8, anchor: 'start' });
}
/** pavé droit L (largeur à l'écran) × h (hauteur) × l (profondeur) ; grille : petits cubes visibles */
export function pave(L, h, l, t, o = {}) {
  const S = new Scene();
  const [a, b, c] = o.grille ? [L, h, l] : lisible(L, h, l);
  pave3(S, a, b, c, t, o);
  return S.svg({ maxW: 260, maxH: 180, label: o.label || 'pavé droit en perspective cavalière' });
}

/** agrandissement ou réduction : deux pavés (kind 'v') ou deux rectangles (kind 'a') côte à côte, rapport k */
export function agrandi(kind, L, h, l, k, t1, t2, kt) {
  const S = new Scene(), dk = Math.min(Math.max(k, 0.5), 2.2);
  const [a, b, c] = kind === 'v' ? lisible(L, h, l) : [...lisible(L, h), 0];
  const w1 = a + c * K, gap = Math.max(w1, (a + c * K) * dk) * 0.5, x0 = w1 + gap;
  if (kind === 'v') { pave3(S, a, b, c, t1); pave3(S, a * dk, b * dk, c * dk, t2, { x0, hDroite: true }); }
  else {
    S.poly(rectPts(0, a, b), { fill: COL.fill });
    if (t1.L) S.cote([0, 0], [a, 0], t1.L, -1, { off: 12 });
    if (t1.h) S.cote([0, 0], [0, b], t1.h, 1, { off: 12 });
    S.poly(rectPts(x0, a * dk, b * dk), { fill: COL.fill2 });
    if (t2.L) S.cote([x0, 0], [x0 + a * dk, 0], t2.L, -1, { off: 12 });
    if (t2.h) S.cote([x0 + a * dk, 0], [x0 + a * dk, b * dk], t2.h, -1, { off: 12 });
  }
  if (kt) S.text([w1 + gap / 2, Math.max(b, b * dk) * 0.55], kt, { color: COL.red, size: 18 });
  return S.svg({ maxW: 340, maxH: 170, label: 'figure et figure agrandie ou réduite' });
}
const rectPts = (x0, a, b) => [[x0, 0], [x0 + a, 0], [x0 + a, b], [x0, b]];

/** prisme droit à base triangle rectangle (côtés a et b de l'angle droit), hauteur H (profondeur) */
export function prisme(a, b, H, t) {
  const S = new Scene(), [x, y, z] = lisible(a, b, H);
  const A = proj([0, 0, 0]), B = proj([x, 0, 0]), C = proj([0, y, 0]), A2 = proj([0, 0, z]), B2 = proj([x, 0, z]), C2 = proj([0, y, z]);
  S.poly([A, B, C], { fill: COL.fill, stroke: 'none' }).poly([B, B2, C2, C], { fill: COL.fill2, stroke: 'none' });
  [[A2, B2], [A2, C2], [A, A2]].forEach(([p, q]) => S.line(p, q, { dash: '6 5', w: 1.6 }));
  [[A, B], [B, C], [C, A], [B, B2], [C, C2], [B2, C2]].forEach(([p, q]) => S.line(p, q));
  S.right(A, B, C);
  S.cote(A, B, t.a, -1, { off: 12 }).cote(A, C, t.b, 1, { off: 12 });
  S.text([(B[0] + B2[0]) / 2, (B[1] + B2[1]) / 2], t.H, { dx: 10, dy: 8, anchor: 'start' });
  return S.svg({ maxW: 260, maxH: 180, label: 'prisme droit à base triangulaire' });
}

/** cylindre de rayon r et de hauteur h ; mode 'r' ou 'd' */
export function cylindre(r, h, mode, t) {
  const S = new Scene(), [R, Hh] = lisible(r * 2, h).map((v, i) => (i ? v : v / 2)), ry = R * 0.3;
  S.poly([[-R, 0], [-R, Hh], [R, Hh], [R, 0], ...arc([0, 0], R, ry, 0, -Math.PI, 40)], { fill: COL.fill, stroke: 'none' });
  S.poly(arc([0, Hh], R, ry, 0, 2 * Math.PI, 60), { fill: COL.fill2 });
  S.poly(arc([0, 0], R, ry, Math.PI, 2 * Math.PI, 40), { open: true });
  S.poly(arc([0, 0], R, ry, 0, Math.PI, 40), { open: true, dash: '6 5', w: 1.6 });
  S.line([-R, 0], [-R, Hh]).line([R, 0], [R, Hh]);
  S.dot([0, Hh], '', { r: 3 }).dot([0, 0], '', { r: 3 });
  S.line([0, 0], [0, Hh], { dash: '3 4', w: 1.2, stroke: COL.cote });
  if (mode === 'd') { S.line([-R, Hh], [R, Hh], { stroke: COL.red }); S.text([0, Hh + ry], t.r, { dy: -12, color: COL.red }); }
  else { S.line([0, Hh], [R, Hh], { stroke: COL.red }); S.text([R / 2, Hh + ry], t.r, { dy: -12, color: COL.red }); }
  S.cote([R, 0], [R, Hh], t.h, -1, { off: 14 });
  return S.svg({ maxW: 220, maxH: 190, label: 'cylindre de révolution' });
}

/** pyramide à base rectangulaire a × b (b en profondeur), hauteur h */
export function pyramide(a, b, h, t) {
  const S = new Scene(), [x, z, y] = lisible(a, b, h);
  const A = proj([0, 0, 0]), B = proj([x, 0, 0]), C = proj([x, 0, z]), D = proj([0, 0, z]), O = proj([x / 2, 0, z / 2]), Sm = proj([x / 2, y, z / 2]);
  S.poly([A, B, Sm], { fill: COL.fill, stroke: 'none' }).poly([B, C, Sm], { fill: COL.fill2, stroke: 'none' });
  [[A, D], [D, C], [D, Sm]].forEach(([p, q]) => S.line(p, q, { dash: '6 5', w: 1.6 }));
  S.line(Sm, O, { dash: true, stroke: COL.red, w: 2 }).dot(O, '', { r: 3 });
  S.right(O, B, Sm);
  [[A, B], [B, C], [A, Sm], [B, Sm], [C, Sm]].forEach(([p, q]) => S.line(p, q));
  S.cote([A[0], O[1]], [A[0], Sm[1]], t.h, 1, { off: 14, tcolor: COL.red });
  S.line([A[0], Sm[1]], Sm, { dash: '2 4', w: 1, stroke: COL.cote });
  S.cote(A, B, t.a, -1, { off: 12 });
  if (t.b) S.text([(B[0] + C[0]) / 2, (B[1] + C[1]) / 2], t.b, { dx: 10, dy: 6, anchor: 'start' });
  return S.svg({ maxW: 240, maxH: 190, label: 'pyramide à base rectangulaire' });
}

/** cône de révolution de rayon r et de hauteur h ; mode 'r' ou 'd' */
export function cone(r, h, mode, t) {
  const S = new Scene(), [R, Hh] = lisible(r * 2, h).map((v, i) => (i ? v : v / 2)), ry = R * 0.3;
  S.poly([[-R, 0], [0, Hh], [R, 0], ...arc([0, 0], R, ry, 0, -Math.PI, 40)], { fill: COL.fill, stroke: 'none' });
  S.poly(arc([0, 0], R, ry, Math.PI, 2 * Math.PI, 40), { open: true });
  S.poly(arc([0, 0], R, ry, 0, Math.PI, 40), { open: true, dash: '6 5', w: 1.6 });
  S.line([-R, 0], [0, Hh]).line([R, 0], [0, Hh]);
  S.line([0, Hh], [0, 0], { dash: true, stroke: COL.red, w: 2 }).dot([0, 0], '', { r: 3 });
  S.right([0, 0], [R, 0], [0, Hh]);
  S.cote([-R, 0], [-R, Hh], t.h, 1, { off: 14, tcolor: COL.red });
  S.line([-R, Hh], [0, Hh], { dash: '2 4', w: 1, stroke: COL.cote });
  if (mode === 'd') { S.line([-R, 0], [R, 0], { stroke: COL.ok }); S.text([R * 0.5, -ry], t.r, { dy: 14, color: COL.ok }); }
  else { S.line([0, 0], [R, 0], { stroke: COL.ok }); S.text([R / 2, -ry], t.r, { dy: 14, color: COL.ok }); }
  return S.svg({ maxW: 200, maxH: 190, label: 'cône de révolution' });
}

/** boule de centre O ; mode 'r' ou 'd' */
export function boule(mode, t) {
  const S = new Scene(), R = 1, ry = 0.3;
  S.poly(arc([0, 0], R, R, 0, 2 * Math.PI, 80), { fill: COL.fill });
  S.poly(arc([0, 0], R, ry, Math.PI, 2 * Math.PI, 40), { open: true, w: 1.6 });
  S.poly(arc([0, 0], R, ry, 0, Math.PI, 40), { open: true, dash: '6 5', w: 1.4 });
  const c = Math.cos(0.8), sn = Math.sin(0.8);
  S.dot([0, 0], 'O', { dx: 12, dy: 12 });
  if (mode === 'd') S.line([-R * c, -R * sn], [R * c, R * sn], { stroke: COL.red });
  else S.line([0, 0], [R * c, R * sn], { stroke: COL.red });
  S.text([0.55 * R * c, 0.55 * R * sn], t, { dx: -8, dy: -6, anchor: 'end', color: COL.red });
  return S.svg({ maxW: 160, maxH: 160, label: 'boule de centre O' });
}

/* ================= tableau de conversion ================= */
// Unités repérées par l'exposant de 10 de leur chiffre des unités par rapport à l'unité de base
// (mm, mm², mm³). Chaque ligne : {s: '3.05', e: exposant du chiffre des unités, color}.
const TAB = {
  L: { cw: 50, groups: ['km', 'hm', 'dam', 'm', 'dm', 'cm', 'mm'], sub: 1 },
  A: { cw: 29, groups: ['km²', 'hm²', 'dam²', 'm²', 'dm²', 'cm²', 'mm²'], sub: 2, extra: { 10: 'ha', 8: 'a' } },
  V: { cw: 34, groups: ['m³', 'dm³', 'cm³', 'mm³'], sub: 3, extra: { 9: 'kL', 8: 'hL', 7: 'daL', 6: 'L', 5: 'dL', 4: 'cL', 3: 'mL' } },
};
export const tabMax = kind => TAB[kind].groups.length * TAB[kind].sub - 1;
/** exposants occupés par les chiffres d'un nombre écrit s (point décimal) dont le chiffre des unités est à l'exposant e */
export function digitsAt(s, e) {
  const [ip, dp = ''] = s.split('.'), out = [];
  for (let i = 0; i < ip.length; i++) out.push({ ch: ip[i], e: e + ip.length - 1 - i });
  for (let j = 0; j < dp.length; j++) out.push({ ch: dp[j], e: e - 1 - j });
  return out;
}
export function tableau(kind, rows, o = {}) {
  const T = TAB[kind], maxE = tabMax(kind), n = maxE + 1, cw = T.cw, W = n * cw;
  const extra = o.extra && T.extra, h1 = 30, h2 = extra ? 24 : 0, rh = 36, H = h1 + h2 + rows.length * rh;
  const X = e => (maxE - e) * cw;
  let s = `<svg viewBox="-2 -2 ${W + 4} ${H + 4}" class="vis" style="width:${W + 4}px" role="img" aria-label="tableau de conversion" ${FONT}>`;
  (o.hl || []).forEach(([u, c]) => { // colonnes mises en valeur (unité de départ, d'arrivée)
    const g = T.groups.indexOf(u);
    if (g >= 0) s += `<rect x="${g * T.sub * cw}" y="0" width="${T.sub * cw}" height="${H}" fill="${c}"/>`;
    else if (extra) { const e = +Object.keys(T.extra).find(k => T.extra[k] === u); if (!isNaN(e)) s += `<rect x="${X(e)}" y="${h1}" width="${cw}" height="${H - h1}" fill="${c}"/>`; }
  });
  T.groups.forEach((g, i) => { s += `<text x="${(i + 0.5) * T.sub * cw}" y="${h1 / 2}" font-size="15" font-weight="700" text-anchor="middle" dominant-baseline="central" fill="${COL.txt}">${g}</text>`; });
  if (extra) for (const [e, u] of Object.entries(T.extra)) s += `<text x="${X(+e) + cw / 2}" y="${h1 + h2 / 2}" font-size="12.5" text-anchor="middle" dominant-baseline="central" fill="${COL.acc}" font-weight="600">${u}</text>`;
  for (let i = 0; i <= n; i++) { const big = i % T.sub === 0; s += `<line x1="${i * cw}" y1="${big ? 0 : h1}" x2="${i * cw}" y2="${H}" stroke="${big ? '#495057' : '#adb5bd'}" stroke-width="${big ? 2 : 1}"/>`; }
  [0, h1, ...(extra ? [h1 + h2] : []), H].forEach(y => { s += `<line x1="0" y1="${y}" x2="${W}" y2="${y}" stroke="#495057" stroke-width="${y === h1 || y === h1 + h2 ? 2 : 1.4}"/>`; });
  for (let r = 1; r < rows.length; r++) s += `<line x1="0" y1="${h1 + h2 + r * rh}" x2="${W}" y2="${h1 + h2 + r * rh}" stroke="#adb5bd"/>`;
  rows.forEach((row, r) => {
    const y = h1 + h2 + r * rh + rh / 2;
    digitsAt(row.s, row.e).forEach(dg => { s += `<text x="${X(dg.e) + cw / 2}" y="${y}" font-size="19" font-weight="700" text-anchor="middle" dominant-baseline="central" fill="${row.zeros && row.zeros.includes(dg.e) ? '#868e96' : (row.color || COL.txt)}">${dg.ch}</text>`; });
    if (row.s.includes('.') || row.virgule) s += `<path d="M${X(row.e) + cw},${y + 7} q2,6 -4,11" stroke="${COL.red}" stroke-width="2.5" fill="none" stroke-linecap="round"/><circle cx="${X(row.e) + cw}" cy="${y + 8}" r="3.4" fill="${COL.red}"/>`;
  });
  return s + '</svg>';
}

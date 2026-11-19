// Figures du module « Repérage et solides » : chaînes SVG, sans DOM (importable par Node).
// - repère du plan (graduations entières, en demis, en dixièmes ; planisphère)
// - solides en perspective cavalière (angle 45°, coefficient 1/2) : arêtes cachées calculées, jamais écrites à la main
// - solides ronds (cylindre, cône, boule) et sections
// - patrons à plat
// Tout est déterministe. Les points d'un repère portent data-n / data-k pour que les tests relisent leurs coordonnées dans le SVG.

export const COL = { ink: '#1f1f1f', a: '#c2410c', aFill: '#fed7aa', b: '#1d4ed8', bFill: '#bfdbfe', g: '#15803d', gFill: '#bbf7d0', grid: '#d6d3d1', grid2: '#ebe8e4', axis: '#44403c', hid: '#6b7280', sec: '#f97316', face: ['#e0ecff', '#c7dcfb', '#a8c8f5'] };
const r1 = x => { const v = Math.round(x * 10) / 10; return v === 0 ? 0 : v; };
/** nombre à la française (virgule, vrai signe moins) */
export const mn = n => (Math.round(n * 1e6) / 1e6 < 0 ? '−' : '') + String(Math.abs(Math.round(n * 1e6) / 1e6)).replace('.', ',');

/* ---------------------------------------------------------------- canevas en pixels */
class Cv {
  constructor() { this.L = [[], [], []]; this.b = { x0: Infinity, y0: Infinity, x1: -Infinity, y1: -Infinity }; this.k = 1; }
  grow(x, y, hw = 0, hh = hw) { const b = this.b; b.x0 = Math.min(b.x0, x - hw); b.x1 = Math.max(b.x1, x + hw); b.y0 = Math.min(b.y0, y - hh); b.y1 = Math.max(b.y1, y + hh); }
  put(z, s) { this.L[z].push(s); }
  line(a, b, o = {}, z = 1) {
    this.grow(a[0], a[1], 1); this.grow(b[0], b[1], 1);
    this.put(z, `<line x1="${r1(a[0])}" y1="${r1(a[1])}" x2="${r1(b[0])}" y2="${r1(b[1])}" stroke="${o.c || COL.ink}" stroke-width="${o.w || 2.4}"${o.dash ? ` stroke-dasharray="${o.dash === true ? '6 5' : o.dash}"` : ''} stroke-linecap="round"/>`);
  }
  poly(pts, o = {}, z = 1) {
    pts.forEach(p => this.grow(p[0], p[1], 1));
    this.put(z, `<path d="M${pts.map(p => r1(p[0]) + ',' + r1(p[1])).join(' L')}${o.open ? '' : ' Z'}" fill="${o.open ? 'none' : (o.fill || 'none')}"${o.op ? ` fill-opacity="${o.op}"` : ''} stroke="${o.c || COL.ink}" stroke-width="${o.w === undefined ? 2.4 : o.w}"${o.dash ? ` stroke-dasharray="${o.dash === true ? '6 5' : o.dash}"` : ''} stroke-linejoin="round" stroke-linecap="round"/>`);
  }
  /** arc d'ellipse échantillonné (t en radians, y vers le bas : t ∈ [0, π] = demi-ellipse du bas) */
  arc(c, rx, ry, t1, t2, o = {}, z = 1) {
    const pts = []; for (let i = 0; i <= 48; i++) { const t = t1 + (t2 - t1) * i / 48; pts.push([c[0] + rx * Math.cos(t), c[1] + ry * Math.sin(t)]); }
    this.poly(pts, { open: !o.fill, ...o }, z);
  }
  dot(p, r = 4, c = COL.ink, z = 2, n) { this.grow(p[0], p[1], r); const q = n ? [p[0].toFixed(3), p[1].toFixed(3)] : [r1(p[0]), r1(p[1])];
    this.put(z, `<circle cx="${q[0]}" cy="${q[1]}" r="${r}" fill="${c}"${n ? ` data-n="${n}"` : ''}/>`); }
  text(p, s, o = {}, z = 2) {
    const fs = o.fs || 17, w = String(s).replace(/<[^>]+>/g, '').length * fs * 0.56;
    const anc = o.anchor || 'middle', xl = anc === 'start' ? p[0] : anc === 'end' ? p[0] - w : p[0] - w / 2;
    this.grow(xl - 2, p[1] - fs * 0.62); this.grow(xl + w + 2, p[1] + fs * 0.62);
    this.put(z, `<text x="${r1(p[0])}" y="${r1(p[1])}" font-size="${fs}" text-anchor="${anc}" dominant-baseline="central" fill="${o.c || COL.ink}" font-weight="${o.w || 700}"${o.it ? ' font-style="italic"' : ''} paint-order="stroke" stroke="#fff" stroke-width="3.5" stroke-linejoin="round">${s}</text>`);
  }
  arrow(T, u, c = COL.axis) { // pointe de flèche en T (pixels), direction u (pixels, y vers le bas)
    const l = 11, w = 5, n = Math.hypot(u[0], u[1]) || 1, dx = u[0] / n, dy = u[1] / n;
    this.grow(T[0], T[1], 2);
    this.put(2, `<path d="M${r1(T[0])},${r1(T[1])} L${r1(T[0] - l * dx + w * dy)},${r1(T[1] - l * dy - w * dx)} L${r1(T[0] - l * dx - w * dy)},${r1(T[1] - l * dy + w * dx)} Z" fill="${c}"/>`);
  }
  svg(aria, extra = '') {
    const m = 8, b = this.b, x0 = b.x0 - m, y0 = b.y0 - m, w = b.x1 - b.x0 + 2 * m, h = b.y1 - b.y0 + 2 * m;
    return `<svg viewBox="${r1(x0)} ${r1(y0)} ${r1(w)} ${r1(h)}" class="vis" style="width:${Math.round(Math.min(w, 560))}px" role="img" aria-label="${aria}"${extra} font-family="system-ui, sans-serif">${this.L.flat().join('')}</svg>`;
  }
}

/* ---------------------------------------------------------------- repère du plan */
/**
 * o.x0, o.x1, o.y0, o.y1 : étendue ; o.step : pas du quadrillage ; o.labelStep : pas des nombres écrits ; o.lab(v) : écriture d'un nombre
 * o.pts [{n, p, c, dx, dy, nolab}] points (nom écrit à côté) ; o.guides [{p, c}] pointillés vers les axes ; o.segs [{a, b, c, dash, w}] ; o.texts [{p, s, c, dx, dy}]
 * o.k : pixels par unité (sinon calculé pour tenir dans maxW × maxH). Les cercles des points portent data-n et le <svg> data-k.
 */
export function repere(o) {
  const st = o.step || 1, ls = o.labelStep || 1, lab = o.lab || mn;
  const { x0: X0, x1: X1, y0: Y0, y1: Y1 } = o;
  const k = o.k || Math.min((o.maxW || 380) / (X1 - X0 + (X0 < 0 ? 0.6 : 0.9)), (o.maxH || 380) / (Y1 - Y0 + (Y0 < 0 ? 0.6 : 0.9)));
  const c = new Cv(), X = x => k * x, Y = y => -k * y;
  const major = v => Math.abs(v / ls - Math.round(v / ls)) < 1e-9;
  for (let i = Math.ceil(X0 / st - 1e-9); i * st <= X1 + 1e-9; i++) { const v = i * st; c.line([X(v), Y(Y0)], [X(v), Y(Y1)], { c: major(v) ? COL.grid : COL.grid2, w: 1 }, 0); }
  for (let i = Math.ceil(Y0 / st - 1e-9); i * st <= Y1 + 1e-9; i++) { const v = i * st; c.line([X(X0), Y(v)], [X(X1), Y(v)], { c: major(v) ? COL.grid : COL.grid2, w: 1 }, 0); }
  const xa = Math.min(X0, 0), ya = Math.min(Y0, 0), ext = 18;
  c.line([X(xa), 0], [X(X1) + ext, 0], { c: COL.axis, w: 1.8 }, 1); c.arrow([X(X1) + ext, 0], [1, 0]);
  c.line([0, Y(ya)], [0, Y(Y1) - ext], { c: COL.axis, w: 1.8 }, 1); c.arrow([0, Y(Y1) - ext], [0, -1]);
  c.text([X(X1) + ext - 2, -13], 'x', { c: COL.axis, fs: 15, it: true, w: 600 });
  c.text([13, Y(Y1) - ext + 2], 'y', { c: COL.axis, fs: 15, it: true, w: 600 });
  for (let i = Math.ceil(X0 / ls - 1e-9); i * ls <= X1 + 1e-9; i++) if (i !== 0) c.text([X(i * ls), 13], lab(i * ls, 'x'), { c: '#57534e', fs: 12, w: 600 });
  for (let i = Math.ceil(Y0 / ls - 1e-9); i * ls <= Y1 + 1e-9; i++) if (i !== 0) c.text([-8, Y(i * ls)], lab(i * ls, 'y'), { c: '#57534e', fs: 12, w: 600, anchor: 'end' });
  c.text([-9, 13], 'O', { c: '#57534e', fs: 13, w: 600 });
  for (const g of o.guides || []) {
    c.line([X(g.p[0]), Y(g.p[1])], [X(g.p[0]), 0], { c: g.c || COL.a, w: 1.8, dash: '5 4' }, 1);
    c.line([X(g.p[0]), Y(g.p[1])], [0, Y(g.p[1])], { c: g.c || COL.a, w: 1.8, dash: '5 4' }, 1);
  }
  for (const s of o.segs || []) c.line([X(s.a[0]), Y(s.a[1])], [X(s.b[0]), Y(s.b[1])], { c: s.c || COL.b, w: s.w || 2.4, dash: s.dash }, 1);
  for (const p of o.pts || []) {
    const col = p.c || COL.b, x = X(p.p[0]), y = Y(p.p[1]);
    c.dot([x, y], 4.4, col, 2, p.n);
    if (p.n && !p.nolab) c.text([x + (p.dx === undefined ? (p.p[0] < 0 ? -12 : 12) : p.dx), y + (p.dy === undefined ? (p.p[1] < 0 ? 12 : -12) : p.dy)], p.n, { c: col, fs: 18, it: true });
  }
  for (const t of o.texts || []) c.text([X(t.p[0]) + (t.dx || 0), Y(t.p[1]) + (t.dy || 0)], t.s, { c: t.c || COL.ink, fs: t.fs || 14 });
  return c.svg(o.aria || 'repère du plan', ` data-k="${k.toFixed(5)}"`);
}
/** coordonnées des points d'un repère, relues dans le SVG (pixels / échelle) : vérification indépendante des tests */
export function lirePoints(svg) {
  const k = +/data-k="([\d.]+)"/.exec(svg)[1], out = {};
  for (const m of svg.matchAll(/<circle cx="(-?[\d.]+)" cy="(-?[\d.]+)" r="[\d.]+" fill="[^"]*" data-n="([^"]+)"/g)) out[m[3]] = [Math.round(+m[1] / k * 1e2) / 1e2 + 0, Math.round(-m[2] / k * 1e2) / 1e2 + 0];
  return out;
}

/* ---------------------------------------------------------------- polyèdres en perspective cavalière */
const K = 0.5 * Math.SQRT1_2;
/** projection cavalière : angle 45°, coefficient 1/2 (x à droite, y en haut, z en profondeur) */
export const P2 = p => [p[0] + K * p[2], p[1] + K * p[2]];
const SIGHT = [-K, -K, 1]; // direction du regard : sa projection est nulle
const sub3 = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
const dot3 = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const cross3 = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
export const dist3 = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]);
const mean3 = L => [0, 1, 2].map(i => L.reduce((s, p) => s + p[i], 0) / L.length);
/** faces visibles (normale sortante · regard < 0) et arêtes cachées (aucune face visible ne les porte) */
export function analyse(V, F) {
  const cen = mean3(V);
  const fa = F.map(f => {
    let n = [0, 0, 0];
    f.forEach((a, i) => { const c = cross3(V[a], V[f[(i + 1) % f.length]]); n = [n[0] + c[0], n[1] + c[1], n[2] + c[2]]; });
    const len = Math.hypot(...n) || 1; n = n.map(v => v / len);
    if (dot3(n, sub3(mean3(f.map(i => V[i])), cen)) < 0) n = n.map(v => -v);
    return { f, n, vis: dot3(n, SIGHT) < -1e-9 };
  });
  const em = new Map();
  fa.forEach((g, gi) => g.f.forEach((a, i) => { const b = g.f[(i + 1) % g.f.length], key = Math.min(a, b) + '-' + Math.max(a, b); if (!em.has(key)) em.set(key, { a: Math.min(a, b), b: Math.max(a, b), faces: [] }); em.get(key).faces.push(gi); }));
  const edges = [...em.values()].map(e => ({ ...e, hidden: !e.faces.some(gi => fa[gi].vis) }));
  return { fa, edges };
}
/** arêtes cachées recalculées autrement (rayons vers l'observateur, comme un tampon de profondeur) : vérification indépendante */
export function aretesCachees(V, F) {
  const set = new Set(), seen = new Set();
  const inside = (pt, poly) => { // point strictement dans un polygone convexe (2D)
    let pos = 0, neg = 0;
    poly.forEach((a, i) => { const b = poly[(i + 1) % poly.length], cr = (b[0] - a[0]) * (pt[1] - a[1]) - (b[1] - a[1]) * (pt[0] - a[0]); if (cr > 1e-9) pos++; else if (cr < -1e-9) neg++; });
    return pos === poly.length || neg === poly.length;
  };
  for (const f of F) f.forEach((a, i) => {
    const b = f[(i + 1) % f.length], key = Math.min(a, b) + '-' + Math.max(a, b);
    if (seen.has(key)) return; seen.add(key);
    for (const tt of [0.5, 0.37, 0.63]) {
    const M = [0, 1, 2].map(t => V[a][t] + tt * (V[b][t] - V[a][t]));
    for (const g of F) {
      const n = cross3(sub3(V[g[1]], V[g[0]]), sub3(V[g[2]], V[g[0]])), nd = dot3(n, SIGHT);
      if (Math.abs(nd) < 1e-9) continue;
      const s = (dot3(n, M) - dot3(n, V[g[0]])) / nd;
      if (s > 1e-7 && inside(P2(M), g.map(i => P2(V[i])))) { set.add(key); break; }
    }
    if (set.has(key)) break;
    }
  });
  return set;
}

/** pavé ABCDEFGH : ABCD en bas (A devant à gauche), EFGH en haut, [AE] vertical */
export function pave3(L, h, l) {
  return { V: [[0, 0, 0], [L, 0, 0], [L, 0, l], [0, 0, l], [0, h, 0], [L, h, 0], [L, h, l], [0, h, l]], F: [[0, 1, 2, 3], [4, 5, 6, 7], [0, 1, 5, 4], [1, 2, 6, 5], [2, 3, 7, 6], [3, 0, 4, 7]], N: 'ABCDEFGH'.split('') };
}
/** prisme droit « couché » : base polygonale dans le plan de face (points [x, y]), profondeur l ; sommets : base avant puis base arrière */
export function prisme3(base, l) {
  const n = base.length, V = [...base.map(p => [p[0], p[1], 0]), ...base.map(p => [p[0], p[1], l])];
  const F = [base.map((_, i) => i), base.map((_, i) => n + i)];
  for (let i = 0; i < n; i++) F.push([i, (i + 1) % n, n + (i + 1) % n, n + i]);
  return { V, F, N: 'ABCDEFGHIJKL'.split('') };
}
/** pyramide : base (points [x, z] dans le plan horizontal, y = 0), sommet S à la verticale du point (cx, cz) à la hauteur h */
export function pyramide3(base, h, ap) {
  const n = base.length, c = ap || [base.reduce((s, p) => s + p[0], 0) / n, base.reduce((s, p) => s + p[1], 0) / n];
  const V = [...base.map(p => [p[0], 0, p[1]]), [c[0], h, c[1]]];
  const F = [base.map((_, i) => i)];
  for (let i = 0; i < n; i++) F.push([i, (i + 1) % n, n]);
  return { V, F, N: [...'ABCDEF'.slice(0, n).split(''), 'S'] };
}
/** polygone régulier à n côtés, côté s, centré en (0, 0) (sommet 0 en bas à gauche) : points [x, y] */
export function regulier(n, s, rot = 0) {
  const R = s / (2 * Math.sin(Math.PI / n));
  return Array.from({ length: n }, (_, i) => { const t = -Math.PI / 2 - Math.PI / n + 2 * Math.PI * i / n + rot; return [R * Math.cos(t), R * Math.sin(t)]; });
}

/**
 * Dessin d'un polyèdre. o.S = {V, F, N} ; o.names : afficher les lettres ; o.hideNames : indices sans lettre
 * o.el [{a, b, s, c}] : texte le long d'une arête ; o.dots [{p, n, c, dx, dy}] points 3D ; o.segs [{a, b, c, dash}] segments 3D ;
 * o.sec [{pts, fill, c}] polygones 3D translucides (sections) ; o.maxW, o.maxH, o.kmax
 */
export function solide(o) {
  const { V, F, N } = o.S, { fa, edges } = analyse(V, F);
  const Q = V.map(P2), all = [...Q, ...(o.dots || []).map(d => P2(d.p)), ...(o.sec || []).flatMap(s => s.pts.map(P2))];
  const xs = all.map(p => p[0]), ys = all.map(p => p[1]), W = Math.max(...xs) - Math.min(...xs), H = Math.max(...ys) - Math.min(...ys);
  const k = Math.min((o.maxW || 300) / W, (o.maxH || 220) / H, o.kmax || 60), c = new Cv();
  const T = q => [k * q[0], -k * q[1]], pt = p => T(P2(p));
  fa.forEach(g => { if (g.vis) c.poly(g.f.map(i => T(Q[i])), { fill: g.n[1] > 0.5 ? COL.face[0] : Math.abs(g.n[0]) > Math.abs(g.n[2]) ? COL.face[2] : COL.face[1], c: 'none', w: 0 }, 0); });
  for (const s of o.sec || []) c.poly(s.pts.map(pt), { fill: s.fill || COL.sec, op: 0.5, c: s.c || COL.a, w: 2.2 }, 1);
  edges.filter(e => e.hidden).forEach(e => c.line(T(Q[e.a]), T(Q[e.b]), { c: COL.hid, w: 1.7, dash: '5 4' }, 1));
  edges.filter(e => !e.hidden).forEach(e => c.line(T(Q[e.a]), T(Q[e.b]), { c: COL.ink, w: 2.5 }, 1));
  for (const s of o.segs || []) c.line(pt(s.a), pt(s.b), { c: s.c || COL.a, w: s.w || 2, dash: s.dash }, 1);
  const g2 = T(mean3(Q.map(q => [q[0], q[1], 0])));
  if (o.names) Q.forEach((q, i) => {
    if ((o.hideNames || []).includes(i)) return;
    const p = T(q); c.dot(p, 3.2, COL.ink, 2);
    let u = [p[0] - g2[0], p[1] - g2[1]]; const n = Math.hypot(...u) || 1; u = [u[0] / n, u[1] / n];
    c.text([p[0] + 15 * u[0], p[1] + 15 * u[1]], N[i], { it: true, fs: 18 });
  });
  for (const d of o.dots || []) { const p = pt(d.p); c.dot(p, 4.4, d.c || COL.a, 2); if (d.n) c.text([p[0] + (d.dx === undefined ? 13 : d.dx), p[1] + (d.dy === undefined ? -11 : d.dy)], d.n, { c: d.c || COL.a, it: true, fs: 18 }); }
  for (const e of o.el || []) {
    const a = T(Q[e.a]), b = T(Q[e.b]), m = [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
    let nx = -(b[1] - a[1]), ny = b[0] - a[0]; const len = Math.hypot(nx, ny) || 1; nx /= len; ny /= len;
    if (nx * (m[0] - g2[0]) + ny * (m[1] - g2[1]) < 0) { nx = -nx; ny = -ny; }
    const tw = String(e.s).replace(/<[^>]+>/g, '').length * 15 * 0.3, off = 11 + Math.abs(nx) * tw + Math.abs(ny) * 8;
    c.text([m[0] + nx * off, m[1] + ny * off], e.s, { c: e.c || COL.a, fs: 15, w: 600 });
  }
  return c.svg(o.aria || 'solide en perspective cavalière');
}

/* ---------------------------------------------------------------- solides ronds (vue légèrement plongeante : y + 0,3 z) */
const EL = 0.3;
const wp = (k, x, y, z = 0) => [k * x, -k * (y + EL * z)];
function bandeau(c, k, R, H, cote, lab) {
  if (cote) c.line([R + 12, 0], [R + 12, -H], { c: COL.a, w: 1.6 }), c.text([R + 14, -H / 2], lab, { c: COL.a, fs: 15, anchor: 'start', w: 600 });
}
/** cylindre : o.r, o.h, o.sec = {t: 'perp', y} | {t: 'axe'} | {t: 'par', a} ; o.lr, o.lh : textes des cotes ; o.axe : axe en pointillés */
export function cylindre(o) {
  const { r, h } = o, k = Math.min((o.maxW || 230) / (2 * r + 1), (o.maxH || 200) / (h + 2 * EL * r + 0.3), 50), c = new Cv(), R = k * r, H = k * h, E = EL * R;
  c.poly([[-R, 0], [-R, -H], [R, -H], [R, 0], ...Array.from({ length: 41 }, (_, i) => [R * Math.cos(Math.PI * i / 40), E * Math.sin(Math.PI * i / 40)])], { fill: COL.face[1], c: 'none', w: 0 }, 0);
  c.arc([0, -H], R, E, 0, 2 * Math.PI, { fill: COL.face[0], c: COL.ink, w: 2.4 }, 0);
  c.arc([0, 0], R, E, Math.PI, 2 * Math.PI, { c: COL.hid, w: 1.7, dash: '5 4' });
  c.arc([0, 0], R, E, 0, Math.PI, { c: COL.ink, w: 2.5 });
  c.line([-R, 0], [-R, -H], { w: 2.5 }); c.line([R, 0], [R, -H], { w: 2.5 });
  const s = o.sec;
  if (s && s.t === 'perp') { const y = -k * s.y; c.arc([0, y], R, E, 0, 2 * Math.PI, { fill: COL.sec, op: 0.55, c: COL.a, w: 2.2 }, 1); }
  if (s && s.t === 'axe') c.poly([[-R, 0], [R, 0], [R, -H], [-R, -H]], { fill: COL.sec, op: 0.5, c: COL.a, w: 2.2 }, 1);
  if (s && s.t === 'par') { const cc = Math.sqrt(r * r - s.a * s.a) * k, dy = EL * k * s.a; c.poly([[-cc, dy], [cc, dy], [cc, dy - H], [-cc, dy - H]], { fill: COL.sec, op: 0.5, c: COL.a, w: 2.2 }, 1); }
  if (o.axe) { c.line([0, -H], [0, 0], { c: COL.hid, w: 1.4, dash: '3 4' }); c.dot([0, 0], 3, COL.hid); c.dot([0, -H], 3, COL.hid); }
  if (o.lr) { c.line([0, -H], [R, -H], { c: COL.a, w: 2 }); c.text([R / 2, -H - E - 12], o.lr, { c: COL.a, fs: 15, w: 600 }); }
  if (o.lh) bandeau(c, k, R, H, true, o.lh);
  return c.svg(o.aria || 'cylindre');
}
/** cône : o.r, o.h, o.sec = {t: 'perp', y} | {t: 'apex'} */
export function cone(o) {
  const { r, h } = o, k = Math.min((o.maxW || 220) / (2 * r + 1), (o.maxH || 200) / (h + EL * r + 0.3), 50), c = new Cv(), R = k * r, H = k * h, E = EL * R;
  c.poly([[-R, 0], [0, -H], [R, 0], ...Array.from({ length: 41 }, (_, i) => [R * Math.cos(Math.PI * i / 40), E * Math.sin(Math.PI * i / 40)])], { fill: COL.face[1], c: 'none', w: 0 }, 0);
  c.arc([0, 0], R, E, Math.PI, 2 * Math.PI, { c: COL.hid, w: 1.7, dash: '5 4' });
  c.arc([0, 0], R, E, 0, Math.PI, { c: COL.ink, w: 2.5 });
  c.line([-R, 0], [0, -H], { w: 2.5 }); c.line([R, 0], [0, -H], { w: 2.5 });
  const s = o.sec;
  if (s && s.t === 'perp') { const rho = R * (1 - s.y / h); c.arc([0, -k * s.y], rho, EL * rho, 0, 2 * Math.PI, { fill: COL.sec, op: 0.55, c: COL.a, w: 2.2 }, 1); }
  if (s && s.t === 'apex') c.poly([[-R, 0], [R, 0], [0, -H]], { fill: COL.sec, op: 0.5, c: COL.a, w: 2.2 }, 1);
  if (o.lh) { c.line([0, -H], [0, 0], { c: COL.a, w: 1.8, dash: '5 4' }); c.text([-16, -H / 2], o.lh, { c: COL.a, fs: 15, w: 600, anchor: 'end' }); }
  if (o.lr) { c.line([0, 0], [R, 0], { c: COL.g, w: 2 }); c.text([R / 2, E + 15], o.lr, { c: COL.g, fs: 15, w: 600 }); }
  return c.svg(o.aria || 'cône');
}
/**
 * boule de rayon o.R ; o.sec = {t: 'centre'} (plan par le centre) | {t: 'plan', a} (plan à la distance a du centre) ;
 * o.lR, o.la, o.lr : cotes (rayon de la boule, distance au centre, rayon de la section) ; le triangle O O′ M est tracé à l'échelle
 */
export function boule(o) {
  const { R } = o, k = Math.min((o.maxW || 220) / (2 * R), (o.maxH || 220) / (2 * R), 40), c = new Cv(), P = k * R, E = EL * P;
  c.arc([0, 0], P, P, 0, 2 * Math.PI, { fill: COL.face[0], c: COL.ink, w: 2.5 }, 0);
  const s = o.sec;
  if (s && s.t === 'centre') c.arc([0, 0], P, E, 0, 2 * Math.PI, { fill: COL.sec, op: 0.55, c: COL.a, w: 2.2 }, 1);
  else { c.arc([0, 0], P, E, Math.PI, 2 * Math.PI, { c: COL.hid, w: 1.5, dash: '5 4' }); c.arc([0, 0], P, E, 0, Math.PI, { c: COL.ink, w: 1.8 }); }
  c.dot([0, 0], 3.6, COL.ink); c.text([-12, 12], 'O', { it: true, fs: 17 });
  if (s && s.t === 'plan') {
    const a = k * s.a, rr = k * Math.sqrt(R * R - s.a * s.a);
    c.arc([0, -a], rr, EL * rr, 0, 2 * Math.PI, { fill: COL.sec, op: 0.55, c: COL.a, w: 2.2 }, 1);
    c.line([0, 0], [0, -a], { c: COL.b, w: 2.2 }, 2); c.line([0, -a], [rr, -a], { c: COL.g, w: 2.2 }, 2); c.line([0, 0], [rr, -a], { c: COL.a, w: 2.2 }, 2);
    c.dot([0, -a], 3.4, COL.b); c.dot([rr, -a], 3.4, COL.a);
    c.text([-12, -a - 13], 'O′', { it: true, fs: 17, c: COL.b }); c.text([rr + 12, -a - 12], 'M', { it: true, fs: 17, c: COL.a });
    const ra = Math.min(11, a / 3, rr / 3); c.poly([[ra, -a], [ra, -a + ra], [0, -a + ra]], { open: true, c: COL.ink, w: 1.5 }, 2);
    if (o.la) c.text([-8, -a / 2], o.la, { c: COL.b, fs: 14, w: 600, anchor: 'end' });
    if (o.lr) c.text([rr / 2, -a + 15], o.lr, { c: COL.g, fs: 14, w: 600 });
    if (o.lR) c.text([rr / 2 + 5, -a / 2 + 12], o.lR, { c: COL.a, fs: 14, w: 600, anchor: 'start' });
  } else if (o.lR) { c.line([0, 0], [P * 0.8, -P * 0.6], { c: COL.a, w: 2.2 }, 2); c.text([P * 0.4 + 6, -P * 0.3 - 12], o.lR, { c: COL.a, fs: 15, w: 600 }); }
  return c.svg(o.aria || 'boule');
}

/* ---------------------------------------------------------------- patrons à plat (repère mathématique, y vers le haut) */
/**
 * o.polys [{p: [[x, y]…], fill, c, w, dash}] ; o.circles [{c, r, fill}] ; o.segs [{a, b, c, dash}] ;
 * o.texts [{p, s, c, fs}] ; o.dims [{a, b, s, side, c}] : texte à côté d'un segment, du côté side (±1)
 */
export function plat(o) {
  const pts = [...(o.polys || []).flatMap(p => p.p), ...(o.circles || []).flatMap(ci => [[ci.c[0] - ci.r, ci.c[1] - ci.r], [ci.c[0] + ci.r, ci.c[1] + ci.r]]), ...(o.texts || []).map(t => t.p)];
  const xs = pts.map(p => p[0]), ys = pts.map(p => p[1]), W = Math.max(...xs) - Math.min(...xs), H = Math.max(...ys) - Math.min(...ys);
  const k = o.k || Math.min((o.maxW || 340) / W, (o.maxH || 260) / H, o.kmax || 50), c = new Cv(), T = p => [k * p[0], -k * p[1]];
  for (const g of o.polys || []) c.poly(g.p.map(T), { fill: g.fill || '#fff', c: g.c || COL.ink, w: g.w || 2.2, dash: g.dash }, 0);
  for (const ci of o.circles || []) { const m = T(ci.c); c.arc(m, k * ci.r, k * ci.r, 0, 2 * Math.PI, { fill: ci.fill || '#fff', c: COL.ink, w: 2.2 }, 0); }
  for (const s of o.segs || []) c.line(T(s.a), T(s.b), { c: s.c || COL.ink, w: s.w || 2, dash: s.dash }, 1);
  for (const t of o.texts || []) { const q = T(t.p); c.text([q[0] + (t.dx || 0), q[1] + (t.dy || 0)], t.s, { c: t.c || COL.ink, fs: t.fs || 17 }); }
  for (const d of o.dims || []) {
    const a = T(d.a), b = T(d.b), m = [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
    let nx = -(b[1] - a[1]), ny = b[0] - a[0]; const len = Math.hypot(nx, ny) || 1; nx = nx / len * (d.side || 1); ny = ny / len * (d.side || 1);
    const tw = String(d.s).replace(/<[^>]+>/g, '').length * 15 * 0.3, off = 12 + Math.abs(nx) * tw + Math.abs(ny) * 8;
    c.text([m[0] + nx * off, m[1] + ny * off], d.s, { c: d.c || COL.a, fs: 15, w: 600 });
  }
  return c.svg(o.aria || 'patron');
}

// Figures du module Géométrie plane : chaînes SVG construites à partir de COORDONNÉES (repère mathématique, y vers le haut).
// Le dessin est mis à l'échelle (px par unité), puis le cadre (viewBox) est calculé sur tout ce qui est dessiné :
// rien n'est coupé, quelle que soit l'orientation de la figure. Pas de DOM : importable par Node pour les tests.

export const COL = { ink: '#1f1f1f', a: '#c2410c', aFill: '#fed7aa', b: '#1d4ed8', bFill: '#bfdbfe', g: '#15803d', gFill: '#bbf7d0', line: '#57534e', grid: '#d6d3d1', axis: '#44403c' };
const R2D = 180 / Math.PI;
const f1 = x => { const v = Math.round(x * 10) / 10; return String(v === 0 ? 0 : v); };
const dist = (P, Q) => Math.hypot(Q[0] - P[0], Q[1] - P[1]);
const mid = (P, Q) => [(P[0] + Q[0]) / 2, (P[1] + Q[1]) / 2];
const unit = (P, Q) => { const n = dist(P, Q) || 1; return [(Q[0] - P[0]) / n, (Q[1] - P[1]) / n]; };
const norm360 = a => ((a % 360) + 360) % 360;
/** point à la distance r de O dans la direction deg (degrés) */
export const pol = (O, r, deg) => [O[0] + r * Math.cos(deg / R2D), O[1] + r * Math.sin(deg / R2D)];
/** rotation de P d'un angle deg autour de O */
export const rot = (P, deg, O = [0, 0]) => {
  const c = Math.cos(deg / R2D), s = Math.sin(deg / R2D), x = P[0] - O[0], y = P[1] - O[1];
  return [O[0] + c * x - s * y, O[1] + s * x + c * y];
};
/** tourne tous les points d'un dictionnaire */
export const rotAll = (P, deg, O = [0, 0]) => Object.fromEntries(Object.entries(P).map(([k, p]) => [k, rot(p, deg, O)]));
/** mesure (0 à 180°) de l'angle ABC, recalculée avec atan2 */
export function angleAt(A, B, C) {
  const u = [A[0] - B[0], A[1] - B[1]], v = [C[0] - B[0], C[1] - B[1]];
  return Math.abs(Math.atan2(u[0] * v[1] - u[1] * v[0], u[0] * v[0] + u[1] * v[1])) * R2D;
}
export { dist, mid };

/**
 * Figure.
 * o.P       points nommés {A: [x, y]} (nom affiché sauf si dans o.hide)
 * o.grid    {x0, y0, x1, y1, axes, nums, step} : quadrillage (et repère gradué si axes)
 * o.polys   [{p: ['A','B','C'], fill, c, w, dash}] contours fermés
 * o.segs    [{a, b, c, w, dash}] (a, b : noms ou coordonnées) ; ouvert : {open: true} met un petit crochet sur les extrémités
 * o.lines   [{a, b, c, w, dash, label, side}] droites prolongées jusqu'au bord du dessin
 * o.rays    [{a, b, c, w}] demi-droites d'origine a, passant par b, prolongées jusqu'au bord
 * o.ticks   [{a, b, n}] codage de longueurs égales ; o.pars [{a, b, n}] codage de droites parallèles
 * o.rights  [{v, a, b}] angles droits ; o.arcs [{v, a, b, label, c, r, n, fill}] angles
 * o.dots    [{p, c, r}] points sans nom ; o.texts [{p, s, c, fs, dx, dy}] ; o.len [{a, b, s, side, c}] longueur le long d'un segment
 * o.lab     {nom: direction en degrés} pour imposer la place d'une étiquette
 * o.ext     marge de prolongement des droites (unités) ; o.maxW, o.maxH, o.kmax : taille visée
 */
export function figure(o) {
  const P = o.P || {};
  const at = p => (typeof p === 'string' ? P[p] : p);
  // --- échelle : à partir des points, du quadrillage et des éléments de longueur
  const pts = [...Object.values(P), ...(o.circles || []).flatMap(c => [[c.c[0] - c.r, c.c[1] - c.r], [c.c[0] + c.r, c.c[1] + c.r]]), ...(o.dots || []).map(d => d.p), ...(o.texts || []).map(t => t.p), ...(o.extra || [])];
  if (o.grid) pts.push([o.grid.x0, o.grid.y0], [o.grid.x1, o.grid.y1]);
  const xs = pts.map(p => p[0]), ys = pts.map(p => p[1]);
  const wx0 = Math.min(...xs), wx1 = Math.max(...xs), wy0 = Math.min(...ys), wy1 = Math.max(...ys);
  const W = Math.max(wx1 - wx0, 1e-6), H = Math.max(wy1 - wy0, 1e-6);
  const maxW = o.maxW || 440, maxH = o.maxH || 300;
  const k = o.k || Math.min(maxW / W, maxH / H, o.kmax || 60);
  const X = p => k * p[0], Y = p => -k * p[1];
  const box = { x0: Infinity, y0: Infinity, x1: -Infinity, y1: -Infinity };
  const grow = (x, y, hw = 0, hh = hw) => { box.x0 = Math.min(box.x0, x - hw); box.x1 = Math.max(box.x1, x + hw); box.y0 = Math.min(box.y0, y - hh); box.y1 = Math.max(box.y1, y + hh); };
  const gw = p => grow(X(p), Y(p), 2);
  const back = [], mids = [], front = [];
  const text = (x, y, s, c = COL.ink, fs = 17, w = 700, it = false) => {
    grow(x, y, String(s).replace(/<[^>]+>/g, '').length * fs * 0.3 + 3, fs * 0.6);
    return `<text x="${f1(x)}" y="${f1(y)}" font-size="${fs}" text-anchor="middle" dominant-baseline="central" fill="${c}" font-weight="${w}"${it ? ' font-style="italic"' : ''} paint-order="stroke" stroke="#fff" stroke-width="3.5" stroke-linejoin="round">${s}</text>`;
  };
  // --- zone de prolongement des droites
  const ex = o.ext === undefined ? 0.6 : o.ext;
  const zx0 = wx0 - ex, zx1 = wx1 + ex, zy0 = wy0 - ex, zy1 = wy1 + ex;
  /** extrémités de la droite (A, B) découpée par le rectangle de prolongement */
  const clip = (A, B) => {
    const u = unit(A, B); let lo = -Infinity, hi = Infinity;
    for (const [p, d, a, b] of [[A[0], u[0], zx0, zx1], [A[1], u[1], zy0, zy1]]) {
      if (Math.abs(d) < 1e-9) continue;
      const t1 = (a - p) / d, t2 = (b - p) / d;
      lo = Math.max(lo, Math.min(t1, t2)); hi = Math.min(hi, Math.max(t1, t2));
    }
    return [[A[0] + lo * u[0], A[1] + lo * u[1]], [A[0] + hi * u[0], A[1] + hi * u[1]]];
  };
  const arrowHead = (T, u, c) => { // pointe de flèche en T, dirigée selon u (coordonnées pixels, u en monde)
    const x = X(T), y = Y(T), dx = u[0], dy = -u[1], l = 11, w = 5;
    return `<path d="M${f1(x)},${f1(y)} L${f1(x - l * dx + w * dy)},${f1(y - l * dy - w * dx)} L${f1(x - l * dx - w * dy)},${f1(y - l * dy + w * dx)} Z" fill="${c}"/>`;
  };

  // --- quadrillage et repère
  if (o.grid) {
    const g = o.grid, st = g.step || 1;
    for (let x = Math.ceil(g.x0 / st) * st; x <= g.x1 + 1e-9; x += st) back.push(`<line x1="${f1(X([x, 0]))}" y1="${f1(Y([0, g.y0]))}" x2="${f1(X([x, 0]))}" y2="${f1(Y([0, g.y1]))}" stroke="${COL.grid}" stroke-width="${x === 0 && g.axes ? 0 : 1}"/>`);
    for (let y = Math.ceil(g.y0 / st) * st; y <= g.y1 + 1e-9; y += st) back.push(`<line x1="${f1(X([g.x0, 0]))}" y1="${f1(Y([0, y]))}" x2="${f1(X([g.x1, 0]))}" y2="${f1(Y([0, y]))}" stroke="${COL.grid}" stroke-width="${y === 0 && g.axes ? 0 : 1}"/>`);
    grow(X([g.x0, 0]), Y([0, g.y0])); grow(X([g.x1, 0]), Y([0, g.y1]));
    if (g.axes) {
      const ax = [g.x0, 0], bx = [g.x1, 0], ay = [0, g.y0], by = [0, g.y1];
      mids.push(`<line x1="${f1(X(ax))}" y1="0" x2="${f1(X(bx))}" y2="0" stroke="${COL.axis}" stroke-width="1.6"/><line x1="0" y1="${f1(Y(ay))}" x2="0" y2="${f1(Y(by))}" stroke="${COL.axis}" stroke-width="1.6"/>`);
      front.push(arrowHead([g.x1, 0], [1, 0], COL.axis), arrowHead([0, g.y1], [0, 1], COL.axis));
      if (g.nums !== false) {
        for (let x = Math.ceil(g.x0 / st) * st; x <= g.x1 + 1e-9; x += st) if (x !== 0 && x !== g.x1) front.push(text(X([x, 0]), 12, x < 0 ? '−' + (-x) : x, '#57534e', 12, 600));
        for (let y = Math.ceil(g.y0 / st) * st; y <= g.y1 + 1e-9; y += st) if (y !== 0 && y !== g.y1) front.push(text(-11, Y([0, y]), y < 0 ? '−' + (-y) : y, '#57534e', 12, 600));
        front.push(text(-9, 11, 'O', '#57534e', 12, 600));
      }
      front.push(text(X(bx) - 4, 14, 'x', COL.axis, 14, 600, true), text(-12, Y(by) + 4, 'y', COL.axis, 14, 600, true));
    }
  }
  for (const ci of o.circles || []) { mids.push(`<circle cx="${f1(X(ci.c))}" cy="${f1(Y(ci.c))}" r="${f1(ci.r * k)}" fill="none" stroke="${ci.col || COL.g}" stroke-width="2.2"${ci.dash ? ' stroke-dasharray="7 5"' : ''}/>`); grow(X(ci.c) - ci.r * k, Y(ci.c) - ci.r * k); grow(X(ci.c) + ci.r * k, Y(ci.c) + ci.r * k); }
  // --- polygones
  for (const pg of o.polys || []) {
    const q = pg.p.map(at);
    mids.push(`<path d="M${q.map(p => f1(X(p)) + ',' + f1(Y(p))).join(' L')} Z" fill="${pg.fill || 'none'}"${pg.fill ? ' fill-opacity=".8"' : ''} stroke="${pg.c || COL.ink}" stroke-width="${pg.w || 2.6}" stroke-linejoin="round"${pg.dash ? ' stroke-dasharray="7 5"' : ''}/>`);
    q.forEach(gw);
  }
  // --- droites, demi-droites, segments
  for (const l of o.lines || []) {
    const A = at(l.a), B = at(l.b), [S, T] = clip(A, B), u = unit(A, B);
    mids.push(`<line x1="${f1(X(S))}" y1="${f1(Y(S))}" x2="${f1(X(T))}" y2="${f1(Y(T))}" stroke="${l.c || COL.line}" stroke-width="${l.w || 2.2}"${l.dash ? ' stroke-dasharray="7 5"' : ''} stroke-linecap="round"/>`);
    if (l.arrows !== false) front.push(arrowHead(T, u, l.c || COL.line), arrowHead(S, [-u[0], -u[1]], l.c || COL.line));
    gw(S); gw(T);
    if (l.label) { const L = [T[0] - u[0] * 1.2 / k * 14 - (l.side || 1) * u[1] * 16 / k, T[1] - u[1] * 1.2 / k * 14 + (l.side || 1) * u[0] * 16 / k]; front.push(text(X(L), Y(L), l.label, l.c || COL.line, 16, 600, true)); }
  }
  for (const l of o.rays || []) {
    const A = at(l.a), B = at(l.b), [, T] = clip(A, B), u = unit(A, B), c = l.c || COL.ink;
    mids.push(`<line x1="${f1(X(A))}" y1="${f1(Y(A))}" x2="${f1(X(T))}" y2="${f1(Y(T))}" stroke="${c}" stroke-width="${l.w || 2.6}" stroke-linecap="round"/>`);
    front.push(arrowHead(T, u, c)); gw(A); gw(T);
  }
  const nb = {};
  const link = (a, b) => { if (typeof a === 'string' && b) (nb[a] = nb[a] || []).push(at(b)); };
  for (const s of o.segs || []) {
    const A = at(s.a), B = at(s.b);
    mids.push(`<line x1="${f1(X(A))}" y1="${f1(Y(A))}" x2="${f1(X(B))}" y2="${f1(Y(B))}" stroke="${s.c || COL.ink}" stroke-width="${s.w || 2.6}"${s.dash ? ' stroke-dasharray="7 5"' : ''} stroke-linecap="round"/>`);
    if (s.ends) for (const [T, U] of [[A, unit(A, B)], [B, unit(B, A)]]) { const n = [-U[1], U[0]]; front.push(`<line x1="${f1(X(T) - 7 * n[0])}" y1="${f1(Y(T) + 7 * n[1])}" x2="${f1(X(T) + 7 * n[0])}" y2="${f1(Y(T) - 7 * n[1])}" stroke="${s.c || COL.ink}" stroke-width="2.6"/>`); }
    gw(A); gw(B); link(s.a, s.b); link(s.b, s.a);
  }
  for (const pg of o.polys || []) pg.p.forEach((n, i) => { link(n, pg.p[(i + 1) % pg.p.length]); link(n, pg.p[(i + pg.p.length - 1) % pg.p.length]); });
  // --- codages
  for (const t of o.ticks || []) {
    const A = at(t.a), B = at(t.b), f = t.t === undefined ? 0.5 : t.t, M = [A[0] + f * (B[0] - A[0]), A[1] + f * (B[1] - A[1])], u = unit(A, B), n = t.n || 1;
    for (let i = 0; i < n; i++) {
      const s = (i - (n - 1) / 2) * 6 / k, C = [M[0] + s * u[0], M[1] + s * u[1]];
      const x = X(C), y = Y(C), dx = u[0], dy = -u[1];
      front.push(`<line x1="${f1(x - 7 * dy - 2 * dx)}" y1="${f1(y + 7 * dx - 2 * dy)}" x2="${f1(x + 7 * dy + 2 * dx)}" y2="${f1(y - 7 * dx + 2 * dy)}" stroke="${t.c || COL.ink}" stroke-width="2"/>`);
    }
  }
  for (const t of o.pars || []) {
    const A = at(t.a), B = at(t.b), f = t.t === undefined ? 0.5 : t.t, M = [A[0] + f * (B[0] - A[0]), A[1] + f * (B[1] - A[1])], u = unit(A, B), n = t.n || 1;
    for (let i = 0; i < n; i++) {
      const C = [M[0] + (i - (n - 1) / 2) * 8 / k * u[0], M[1] + (i - (n - 1) / 2) * 8 / k * u[1]];
      const x = X(C), y = Y(C), dx = u[0], dy = -u[1];
      front.push(`<path d="M${f1(x - 5 * dx + 5 * dy)},${f1(y - 5 * dy - 5 * dx)} L${f1(x + 2 * dx)},${f1(y + 2 * dy)} L${f1(x - 5 * dx - 5 * dy)},${f1(y - 5 * dy + 5 * dx)}" fill="none" stroke="${t.c || COL.ink}" stroke-width="2"/>`);
    }
  }
  for (const r of o.rights || []) {
    const V = at(r.v), ua = unit(V, at(r.a)), ub = unit(V, at(r.b)), q = (r.size || 13) / k;
    const p1 = [V[0] + q * ua[0], V[1] + q * ua[1]], p2 = [p1[0] + q * ub[0], p1[1] + q * ub[1]], p3 = [V[0] + q * ub[0], V[1] + q * ub[1]];
    back.push(`<path d="M${f1(X(V))},${f1(Y(V))} L${f1(X(p1))},${f1(Y(p1))} L${f1(X(p2))},${f1(Y(p2))} L${f1(X(p3))},${f1(Y(p3))} Z" fill="#e7e5e4"/>`);
    front.push(`<path d="M${f1(X(p1))},${f1(Y(p1))} L${f1(X(p2))},${f1(Y(p2))} L${f1(X(p3))},${f1(Y(p3))}" fill="none" stroke="${r.c || COL.ink}" stroke-width="1.8"/>`);
  }
  for (const ar of o.arcs || []) {
    const V = at(ar.v), A = at(ar.a), B = at(ar.b);
    let d1 = Math.atan2(A[1] - V[1], A[0] - V[0]) * R2D, span = norm360(Math.atan2(B[1] - V[1], B[0] - V[0]) * R2D - d1);
    if (span > 180) { d1 += span; span = 360 - span; }
    const col = ar.c || COL.a, fill = ar.fill || COL.aFill, r = ar.r || 24, n = ar.n || 1;
    const S = pol([0, 0], r, d1), E = pol([0, 0], r, d1 + span), x = X(V), y = Y(V);
    back.push(`<path d="M${f1(x)},${f1(y)} L${f1(x + S[0])},${f1(y - S[1])} A${r},${r} 0 ${span > 180 ? 1 : 0} 0 ${f1(x + E[0])},${f1(y - E[1])} Z" fill="${fill}" fill-opacity=".85"/>`);
    for (let i = 0; i < n; i++) {
      const rr = r + i * 5, S2 = pol([0, 0], rr, d1), E2 = pol([0, 0], rr, d1 + span);
      front.push(`<path d="M${f1(x + S2[0])},${f1(y - S2[1])} A${rr},${rr} 0 ${span > 180 ? 1 : 0} 0 ${f1(x + E2[0])},${f1(y - E2[1])}" fill="none" stroke="${col}" stroke-width="2.2"/>`);
    }
    grow(x, y, r + 4 * n);
    if (ar.label !== undefined) {
      const wd = String(ar.label).length * 9 + 8, off = Math.max(r + 16, (wd / 2 + 6) / Math.sin(Math.max(Math.min(span, 170), 20) / 2 / R2D)), Lp = pol([0, 0], Math.min(off, r + 46), d1 + span / 2);
      front.push(text(x + Lp[0], y - Lp[1], ar.label, col, 16));
    }
  }
  // --- points
  for (const d of o.dots || []) { front.push(`<circle cx="${f1(X(d.p))}" cy="${f1(Y(d.p))}" r="${d.r || 3.4}" fill="${d.c || COL.ink}"/>`); gw(d.p); }
  for (const [name, p] of Object.entries(P)) {
    if ((o.hide || []).includes(name)) continue;
    front.push(`<circle cx="${f1(X(p))}" cy="${f1(Y(p))}" r="3.4" fill="${(o.colors || {})[name] || COL.ink}"/>`);
    let dir;
    if (o.lab && o.lab[name] !== undefined) dir = o.lab[name];
    else {
      let sx = 0, sy = 0;
      for (const q of nb[name] || []) { const n = dist(p, q) || 1; sx += (q[0] - p[0]) / n; sy += (q[1] - p[1]) / n; }
      dir = Math.hypot(sx, sy) < 0.3 ? (nb[name] && nb[name].length ? Math.atan2(nb[name][0][1] - p[1], nb[name][0][0] - p[0]) * R2D + 90 : 60) : Math.atan2(-sy, -sx) * R2D;
    }
    const L = pol([0, 0], 17, dir);
    front.push(text(X(p) + L[0], Y(p) - L[1], name.replace(/'/g, '′'), (o.colors || {})[name] || COL.ink, 19, 700, true));
    gw(p);
  }
  for (const t of o.texts || []) front.push(text(X(t.p) + (t.dx || 0), Y(t.p) + (t.dy || 0), t.s, t.c, t.fs || 16, t.w || 700));
  for (const l of o.len || []) {
    const A = at(l.a), B = at(l.b), pf = l.pos === undefined ? 0.5 : l.pos, M = [A[0] + pf * (B[0] - A[0]), A[1] + pf * (B[1] - A[1])], u = unit(A, B), side = l.side || 1, fs = l.fs || 15;
    const nx = -side * u[1], ny = -side * u[0], hw = String(l.s).replace(/<[^>]+>/g, '').length * fs * 0.3;
    const off = 8 + Math.abs(nx) * hw + Math.abs(ny) * fs * 0.6 + (l.off ? l.off - 14 : 0);
    front.push(text(X(M) + nx * off, Y(M) + ny * off, l.s, l.c || COL.ink, fs, 600));
  }
  const m = 6, x0 = box.x0 - m, x1 = box.x1 + m, y0 = box.y0 - m, y1 = box.y1 + m;
  const wd = x1 - x0, ht = y1 - y0;
  const width = Math.round(Math.min(o.width || 560, wd));
  return `<svg viewBox="${f1(x0)} ${f1(y0)} ${f1(wd)} ${f1(ht)}" class="vis" style="width:${width}px" role="img" aria-label="${o.aria || 'figure'}" font-family="system-ui, sans-serif">${back.join('')}${mids.join('')}${front.join('')}</svg>`;
}

// Figures du module Pythagore (chaînes SVG, sans DOM : importable par Node pour les tests).
// figure() dessine des triangles (ou des assemblages de triangles) donnés par les coordonnées de leurs sommets,
// les fait tourner, puis place les étiquettes en pixels (toujours droites, hors des segments).
// La boîte du dessin (viewBox) est calculée à la fin à partir de tout ce qui est dessiné : rien n'est coupé.

export const ACC = '#c2255c';
const INK = '#1f2328', FS = 18;
const f1 = x => (Math.round(x * 10) / 10).toString();
/** largeur approximative d'un texte en pixels */
const tw = (t, fs = FS) => [...String(t)].length * fs * 0.58;
const unit = ([x, y]) => { const n = Math.hypot(x, y) || 1; return [x / n, y / n]; };

/** boîte englobante en pixels */
function Box() {
  const b = { x0: Infinity, y0: Infinity, x1: -Infinity, y1: -Infinity };
  b.add = (x, y, hw = 0, hh = 0) => { b.x0 = Math.min(b.x0, x - hw); b.x1 = Math.max(b.x1, x + hw); b.y0 = Math.min(b.y0, y - hh); b.y1 = Math.max(b.y1, y + hh); };
  return b;
}
/** texte centré en (x, y), avec un halo blanc pour rester lisible sur les traits */
function label(box, x, y, t, o = {}) {
  const fs = o.fs || FS;
  box.add(x, y, tw(t, fs) / 2 + 2, fs * 0.55);
  return `<text x="${f1(x)}" y="${f1(y)}" dy=".35em" text-anchor="middle" font-size="${fs}" font-weight="${o.bold ? 700 : 500}" fill="${o.c || INK}" paint-order="stroke" stroke="#fff" stroke-width="4" stroke-linejoin="round">${t}</text>`;
}
/** distance à laquelle placer le centre d'une étiquette pour qu'elle ne touche pas un trait de direction normale n */
const clear = (n, t, fs = FS, gap = 7) => gap + Math.abs(n[0]) * tw(t, fs) / 2 + Math.abs(n[1]) * fs * 0.45;

/**
 * Figure générale.
 * o.pts     : { A: [x, y], … } coordonnées mathématiques (y vers le haut)
 * o.polys   : [['A','B','C'], …] contours fermés (par défaut : tous les points)
 * o.segs    : [{ k: 'AH', dash: true, c }] segments supplémentaires
 * o.rights  : [['A','B','C']] angle droit en A entre [AB] et [AC] (codage)
 * o.sides   : [{ k: 'AB', t: '5 cm', unk: true, away: 'C' }] étiquettes de longueur (« ? » si unk)
 * o.squares : [{ k: 'AB', t: 'AB² = 9', away: 'C', c }] carrés construits sur les côtés, vers l'extérieur
 * o.decor   : [{ pts: [[x,y],…], close, fill, stroke, sw, dash }] éléments de décor (mur, sol…), dessinés dessous
 * o.rot     : rotation en degrés ; o.flip : symétrie ; o.size : taille visée du dessin (pixels)
 * o.names   : false pour cacher les noms des points ; o.vdir : { D: [dx, dy] } direction imposée d'un nom (pixels)
 * o.aria    : description ; dans o.sides, gapU = écart supplémentaire (unités de la figure), par exemple l'épaisseur d'un mur
 */
export function figure(o) {
  const names = Object.keys(o.pts);
  const polys = o.polys || [names];
  const th = (o.rot || 0) * Math.PI / 180, cs = Math.cos(th), sn = Math.sin(th);
  const tr = ([x, y]) => { let X = x * cs - y * sn; const Y = x * sn + y * cs; if (o.flip) X = -X; return [X, -Y]; };
  const third = (k, away) => away || polys.flat().find(n => !k.includes(n)) || names.find(n => !k.includes(n));
  // carrés sur les côtés (coordonnées mathématiques)
  const sqs = (o.squares || []).map(q => {
    const P = o.pts[q.k[0]], Q = o.pts[q.k[1]], W = o.pts[third(q.k, q.away)];
    const v = [Q[0] - P[0], Q[1] - P[1]];
    let n = [-v[1], v[0]];
    if (n[0] * (W[0] - P[0]) + n[1] * (W[1] - P[1]) > 0) n = [-n[0], -n[1]];
    return { ...q, c4: [P, Q, [Q[0] + n[0], Q[1] + n[1]], [P[0] + n[0], P[1] + n[1]]] };
  });
  // mise à l'échelle sur les points (et carrés, décor)
  const all = [...names.map(n => tr(o.pts[n])), ...sqs.flatMap(q => q.c4.map(tr)), ...(o.decor || []).flatMap(e => e.pts.map(tr))];
  const X0 = Math.min(...all.map(p => p[0])), X1 = Math.max(...all.map(p => p[0]));
  const Y0 = Math.min(...all.map(p => p[1])), Y1 = Math.max(...all.map(p => p[1]));
  const size = o.size || [300, 220];
  const k = Math.min(size[0] / ((X1 - X0) || 1), size[1] / ((Y1 - Y0) || 1));
  const px = p => { const [X, Y] = tr(p); return [(X - X0) * k, (Y - Y0) * k]; };
  const P = {}; names.forEach(n => { P[n] = px(o.pts[n]); });
  const box = Box(); Object.values(P).forEach(p => box.add(p[0], p[1]));
  const path = (ps, close) => 'M' + ps.map(p => f1(p[0]) + ',' + f1(p[1])).join(' L') + (close ? ' Z' : '');
  let s = '';
  // décor
  (o.decor || []).forEach(e => {
    const ps = e.pts.map(px); ps.forEach(p => box.add(p[0], p[1]));
    s += `<path d="${path(ps, e.close)}" fill="${e.fill || 'none'}" stroke="${e.stroke || '#868e96'}" stroke-width="${e.sw || 2}"${e.dash ? ' stroke-dasharray="6 5"' : ''} stroke-linejoin="round"/>`;
  });
  // carrés
  sqs.forEach(q => {
    const ps = q.c4.map(px); ps.forEach(p => box.add(p[0], p[1]));
    s += `<path d="${path(ps, true)}" fill="${q.c || '#fcc2d7'}" fill-opacity=".45" stroke="${q.c || ACC}" stroke-width="1.5"/>`;
  });
  // contours
  polys.forEach(pl => { s += `<path d="${path(pl.map(n => P[n]), true)}" fill="#fff0f6" fill-opacity=".6" stroke="${INK}" stroke-width="2.4" stroke-linejoin="round"/>`; });
  (o.segs || []).forEach(g => { s += `<path d="${path([P[g.k[0]], P[g.k[1]]])}" stroke="${g.c || INK}" stroke-width="${g.sw || 2}"${g.dash ? ' stroke-dasharray="7 5"' : ''}/>`; });
  // côté cherché : en couleur
  (o.sides || []).filter(q => q.unk).forEach(q => { s += `<path d="${path([P[q.k[0]], P[q.k[1]]])}" stroke="${ACC}" stroke-width="4.5" stroke-linecap="round"/>`; });
  // codage des angles droits
  (o.rights || []).forEach(([a, b, c]) => {
    const u = unit([P[b][0] - P[a][0], P[b][1] - P[a][1]]), v = unit([P[c][0] - P[a][0], P[c][1] - P[a][1]]), r = 15;
    const p1 = [P[a][0] + u[0] * r, P[a][1] + u[1] * r], p3 = [P[a][0] + v[0] * r, P[a][1] + v[1] * r], p2 = [p1[0] + v[0] * r, p1[1] + v[1] * r];
    s += `<path d="${path([p1, p2, p3])}" fill="none" stroke="${INK}" stroke-width="1.8"/>`;
  });
  // textes dans les carrés
  sqs.forEach(q => {
    if (!q.t) return;
    const ps = q.c4.map(px), cx = ps.reduce((a, p) => a + p[0], 0) / 4, cy = ps.reduce((a, p) => a + p[1], 0) / 4;
    s += label(box, cx, cy, q.t, { fs: 16, c: '#862e9c', bold: true });
  });
  // longueurs : au milieu du côté, vers l'extérieur
  (o.sides || []).forEach(q => {
    const A = P[q.k[0]], B = P[q.k[1]], W = P[third(q.k, q.away)];
    const m = [(A[0] + B[0]) / 2, (A[1] + B[1]) / 2];
    let n = unit([-(B[1] - A[1]), B[0] - A[0]]);
    if (n[0] * (W[0] - m[0]) + n[1] * (W[1] - m[1]) > 0) n = [-n[0], -n[1]];
    if (q.inside) n = [-n[0], -n[1]];
    const t = q.unk ? '?' : q.t, fs = q.unk ? 22 : FS, d = clear(n, t, fs, 7 + (q.gapU || 0) * k);
    s += label(box, m[0] + n[0] * d, m[1] + n[1] * d, t, { fs, bold: !!q.unk, c: q.unk ? ACC : INK });
  });
  // noms des sommets : à l'opposé des segments qui partent du sommet
  if (o.names !== false) {
    const nb = {}; names.forEach(n => { nb[n] = new Set(); });
    const link = (a, b) => { nb[a].add(b); nb[b].add(a); };
    polys.forEach(pl => pl.forEach((a, i) => link(a, pl[(i + 1) % pl.length])));
    (o.segs || []).forEach(g => link(g.k[0], g.k[1]));
    names.forEach(n => {
      let dx = 0, dy = 0;
      nb[n].forEach(m => { const u = unit([P[m][0] - P[n][0], P[m][1] - P[n][1]]); dx -= u[0]; dy -= u[1]; });
      let dir = Math.hypot(dx, dy) < 0.2 ? (() => { const m = [...nb[n]][0]; const u = unit([P[m][0] - P[n][0], P[m][1] - P[n][1]]); return [u[1], -u[0]]; })() : unit([dx, dy]);
      if (!nb[n].size) dir = [0, -1];
      if (o.vdir && o.vdir[n]) dir = unit(o.vdir[n]);
      const d = clear(dir, n, 19, 6);
      s += label(box, P[n][0] + dir[0] * d, P[n][1] + dir[1] * d, n, { fs: 19, bold: true });
    });
  }
  const pad = 4, W = box.x1 - box.x0 + 2 * pad, H = box.y1 - box.y0 + 2 * pad;
  return `<svg viewBox="${f1(box.x0 - pad)} ${f1(box.y0 - pad)} ${f1(W)} ${f1(H)}" width="${Math.round(W)}" class="vis fig" role="img" aria-label="${o.aria || 'figure'}" font-family="system-ui,sans-serif">${s}</svg>`;
}

/* ---------- décors (coordonnées mathématiques) ---------- */
/** mur vertical en x = 0, de y = 0 à y = h, côté gauche ; sol de x0 à x1 */
export function decorMur(h, x1, x0 = 0) {
  const e = h * 0.06, out = [{ pts: [[-e, 0], [-e, h], [0, h], [0, 0]], close: true, fill: '#dee2e6', stroke: '#868e96' }];
  return [...out, decorSol(x0 - e * 1.5, x1)[0]];
}
export function decorSol(x0, x1) { return [{ pts: [[x0, 0], [x1, 0]], stroke: '#5c940d', sw: 4 }]; }

/* ---------- carrés (niveau des carrés et racines) ---------- */
/** sq : [{ c: côté en unités de dessin, side: 'texte du côté', area: 'texte de l'aire' }] */
export function carres(list, aria = 'carrés') {
  const k = 150 / Math.max(...list.map(q => q.c));
  let x = 10, s = '';
  const box = Box();
  list.forEach(q => {
    const a = Math.max(36, q.c * k), y = 170 - a;
    s += `<rect x="${f1(x)}" y="${f1(y)}" width="${f1(a)}" height="${f1(a)}" fill="#fcc2d7" fill-opacity=".55" stroke="${ACC}" stroke-width="2"/>`;
    box.add(x, y); box.add(x + a, 170);
    if (q.area) s += label(box, x + a / 2, y + a / 2, q.area, { fs: q.area === '?' ? 22 : 16, bold: true, c: q.area === '?' ? ACC : '#862e9c' });
    if (q.side) s += label(box, x + a / 2, 170 + 16, q.side, { fs: q.side === '?' ? 22 : 17, bold: q.side === '?', c: q.side === '?' ? ACC : INK });
    x += a + 40;
  });
  const pad = 4;
  return `<svg viewBox="${f1(box.x0 - pad)} ${f1(box.y0 - pad)} ${f1(box.x1 - box.x0 + 2 * pad)} ${f1(box.y1 - box.y0 + 2 * pad)}" width="${Math.round(box.x1 - box.x0 + 2 * pad)}" class="vis fig" role="img" aria-label="${aria}" font-family="system-ui,sans-serif">${s}</svg>`;
}

/* ---------- repère quadrillé (distance entre deux points) ---------- */
export function repere(A, B, o = {}) {
  const xs = [A[0], B[0], 0], ys = [A[1], B[1], 0];
  const xm = Math.min(...xs) - 1, xM = Math.max(...xs) + 1, ym = Math.min(...ys) - 1, yM = Math.max(...ys) + 1;
  const u = Math.min(34, 330 / (xM - xm), 280 / (yM - ym));
  const X = x => (x - xm) * u, Y = y => (yM - y) * u;
  let s = '';
  for (let x = xm; x <= xM; x++) s += `<line x1="${f1(X(x))}" y1="0" x2="${f1(X(x))}" y2="${f1(Y(ym))}" stroke="#dee2e6"/>`;
  for (let y = ym; y <= yM; y++) s += `<line x1="0" y1="${f1(Y(y))}" x2="${f1(X(xM))}" y2="${f1(Y(y))}" stroke="#dee2e6"/>`;
  s += `<line x1="0" y1="${f1(Y(0))}" x2="${f1(X(xM))}" y2="${f1(Y(0))}" stroke="#495057" stroke-width="1.8"/><line x1="${f1(X(0))}" y1="${f1(Y(ym))}" x2="${f1(X(0))}" y2="0" stroke="#495057" stroke-width="1.8"/>`;
  const box = Box(); box.add(0, 0); box.add(X(xM), Y(ym));
  s += label(box, X(0) - 10, Y(0) + 12, '0', { fs: 14 });
  s += label(box, X(1), Y(0) + 13, '1', { fs: 14 }) + label(box, X(0) - 10, Y(1), '1', { fs: 14 });
  if (o.tri) { // triangle rectangle de la correction
    const C = [B[0], A[1]];
    s += `<path d="M${f1(X(A[0]))},${f1(Y(A[1]))} L${f1(X(C[0]))},${f1(Y(C[1]))} L${f1(X(B[0]))},${f1(Y(B[1]))}" fill="none" stroke="#1c7ed6" stroke-width="2.5" stroke-dasharray="7 5"/>`;
    const sx = Math.sign(A[0] - C[0]) || 1, sy = Math.sign(B[1] - C[1]) || 1, r = 12;
    if (A[0] !== C[0] && B[1] !== C[1]) s += `<path d="M${f1(X(C[0] + sx * r / u))},${f1(Y(C[1]))} L${f1(X(C[0] + sx * r / u))},${f1(Y(C[1] + sy * r / u))} L${f1(X(C[0]))},${f1(Y(C[1] + sy * r / u))}" fill="none" stroke="#1c7ed6" stroke-width="1.6"/>`;
    s += label(box, X((A[0] + C[0]) / 2), Y(C[1]) + (B[1] > A[1] ? 14 : -14), o.tri[0], { fs: 16, c: '#1864ab', bold: true });
    s += label(box, X(C[0]) + (A[0] < C[0] ? 1 : -1) * (tw(o.tri[1], 16) / 2 + 8), Y((B[1] + C[1]) / 2), o.tri[1], { fs: 16, c: '#1864ab', bold: true });
  }
  s += `<line x1="${f1(X(A[0]))}" y1="${f1(Y(A[1]))}" x2="${f1(X(B[0]))}" y2="${f1(Y(B[1]))}" stroke="${ACC}" stroke-width="3.5"/>`;
  [[A, 'A'], [B, 'B']].forEach(([p, n]) => {
    const other = p === A ? B : A, dir = unit([p[0] - other[0], other[1] - p[1]]);
    s += `<circle cx="${f1(X(p[0]))}" cy="${f1(Y(p[1]))}" r="5" fill="${ACC}"/>`;
    const d = clear(dir, n, 19, 8);
    s += label(box, X(p[0]) + dir[0] * d, Y(p[1]) + dir[1] * d, n, { fs: 19, bold: true, c: ACC });
  });
  const pad = 4;
  return `<svg viewBox="${f1(box.x0 - pad)} ${f1(box.y0 - pad)} ${f1(box.x1 - box.x0 + 2 * pad)} ${f1(box.y1 - box.y0 + 2 * pad)}" width="${Math.round(box.x1 - box.x0 + 2 * pad)}" class="vis fig" role="img" aria-label="repère avec les points A et B" font-family="system-ui,sans-serif">${s}</svg>`;
}

/* ---------- pavé droit en perspective cavalière ---------- */
/** L longueur, l largeur (fuyante), h hauteur ; t = textes {L, l, h} ; diag : montrer [AG] ; base : montrer [AC] */
export function pave(L, l, h, t, o = {}) {
  const k = 200 / Math.max(L + l * 0.5, h + l * 0.4), a = Math.PI / 6;
  const dx = l * 0.55 * Math.cos(a) * k, dy = -l * 0.55 * Math.sin(a) * k;
  const A = [0, h * k], B = [L * k, h * k], D = [dx, h * k + dy], C = [L * k + dx, h * k + dy];
  const E = [0, 0], F = [L * k, 0], H = [dx, dy], G = [L * k + dx, dy];
  const P = { A, B, C, D, E, F, G, H };
  const ln = (p, q, st = '', c = INK, sw = 2) => `<line x1="${f1(p[0])}" y1="${f1(p[1])}" x2="${f1(q[0])}" y2="${f1(q[1])}" stroke="${c}" stroke-width="${sw}" ${st}/>`;
  let s = '';
  // arêtes visibles
  [[A, B], [B, F], [F, E], [E, A], [B, C], [C, G], [G, F], [E, H], [H, G]].forEach(([p, q]) => { s += ln(p, q); });
  // arêtes cachées
  [[A, D], [D, C], [D, H]].forEach(([p, q]) => { s += ln(p, q, 'stroke-dasharray="6 5" stroke-opacity=".7"'); });
  if (o.base) s += ln(A, C, 'stroke-dasharray="6 4"', '#1c7ed6', 2.5);
  if (o.diag) s += `<line x1="${f1(A[0])}" y1="${f1(A[1])}" x2="${f1(G[0])}" y2="${f1(G[1])}" stroke="${ACC}" stroke-width="3.5"/>`;
  const box = Box(); Object.values(P).forEach(p => box.add(p[0], p[1]));
  const lab = (p, dir, n) => { const d = clear(dir, n, 18, 5); return label(box, p[0] + dir[0] * d, p[1] + dir[1] * d, n, { fs: 18, bold: true }); };
  s += lab(A, [-0.7, 0.7], 'A') + lab(B, [0.7, 0.7], 'B') + lab(C, [1, 0], 'C') + lab(D, [-0.6, -0.8], 'D');
  s += lab(E, [-0.7, -0.7], 'E') + lab(F, [0.2, -1], 'F') + lab(G, [0.7, -0.7], 'G') + lab(H, [-0.3, -1], 'H');
  s += label(box, (A[0] + B[0]) / 2, A[1] + 20, t.L);
  s += label(box, (B[0] + C[0]) / 2 + tw(t.l) / 2 + 10, (B[1] + C[1]) / 2 + 8, t.l);
  s += label(box, A[0] - tw(t.h) / 2 - 8, (A[1] + E[1]) / 2, t.h);
  const pad = 4;
  return `<svg viewBox="${f1(box.x0 - pad)} ${f1(box.y0 - pad)} ${f1(box.x1 - box.x0 + 2 * pad)} ${f1(box.y1 - box.y0 + 2 * pad)}" width="${Math.round(box.x1 - box.x0 + 2 * pad)}" class="vis fig" role="img" aria-label="pavé droit ABCDEFGH" font-family="system-ui,sans-serif">${s}</svg>`;
}

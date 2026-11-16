// Figures géométriques SVG construites à partir de COORDONNÉES (Thalès, trigonométrie).
// figure(o) transforme les points (symétrie, rotation), les met à l'échelle, puis place les
// étiquettes (noms des points, longueurs, angles) en évitant les segments et les autres étiquettes.
// Aucun aléatoire ici : la rotation et la symétrie sont choisies par levels.js.

const FP = 19;   // taille des noms de points
const FL = 17;   // taille des longueurs et des angles
const INK = '#2b2b2b', PAR = '#364fc7', ASK = '#e03131', SOFT = '#868e96';

const f1 = v => (Math.round(v * 10) / 10).toString();
const plain = t => String(t).replace(/<[^>]+>/g, '');
/** largeur approximative d'un texte (px) */
const textW = (t, fs) => {
  let w = 0;
  for (const ch of plain(t)) w += /[ ,.′'°]/.test(ch) ? 0.32 : /[mMW]/.test(ch) ? 0.85 : 0.6;
  return w * fs;
};
const sub = (p, q) => [p[0] - q[0], p[1] - q[1]];
const add = (p, q) => [p[0] + q[0], p[1] + q[1]];
const mul = (p, k) => [p[0] * k, p[1] * k];
const len = p => Math.hypot(p[0], p[1]);
const unit = p => { const l = len(p) || 1; return [p[0] / l, p[1] / l]; };
const esc = s => String(s).replace(/&(?!(amp|lt|gt|nbsp|#\d+);)/g, '&amp;');

/** une boîte de texte {x, y (centre), w, h} touche-t-elle une autre ? */
const boxHit = (a, b, m = 2) => Math.abs(a.x - b.x) * 2 < a.w + b.w + 2 * m && Math.abs(a.y - b.y) * 2 < a.h + b.h + 2 * m;
/** un segment [p, q] traverse-t-il la boîte (échantillonnage) ? */
function segHit(b, p, q, m = 2) {
  const n = Math.max(8, Math.ceil(len(sub(q, p)) / 3));
  for (let i = 0; i <= n; i++) {
    const x = p[0] + (q[0] - p[0]) * i / n, y = p[1] + (q[1] - p[1]) * i / n;
    if (Math.abs(x - b.x) * 2 < b.w + 2 * m && Math.abs(y - b.y) * 2 < b.h + 2 * m) return true;
  }
  return false;
}

/** les segments [p, q] et [r, s] se coupent-ils ? */
function segCross(p, q, r, s) {
  const o = (a, b, c) => Math.sign((b[0] - a[0]) * (c[1] - a[1]) - (b[1] - a[1]) * (c[0] - a[0]));
  return o(p, q, r) * o(p, q, s) < 0 && o(r, s, p) * o(r, s, q) < 0;
}

/**
 * o = {
 *   P: { A: [x, y], … }            coordonnées (repère mathématique, y vers le haut)
 *   segs: [['A', 'B', style?], …]  style : 'par' (droite parallèle, en couleur), 'thin', 'dash'
 *   lens: [{ a, b, t, ask, dim, side: 'in' | 'out' }]   longueurs ; dim = cote parallèle au segment
 *   par: [['M', 'N'], ['B', 'C']]  marques de parallélisme (chevrons)
 *   right: [['B', 'A', 'C']]       angle droit en B entre (BA) et (BC)
 *   angs: [{ v, a, b, t, ask }]     angle de sommet v entre (va) et (vb)
 *   hide: ['X']                     points sans nom affiché
 *   rot (radians), flip (symétrie axiale), W, H (taille maximale de la figure, sans les étiquettes)
 * }
 */
export function figure(o) {
  const { segs = [], lens = [], par = [], right = [], angs = [], hide = [], rot = 0, flip = false, W = 330, H = 200, aria = 'figure' } = o;
  // 1. transformation et mise à l'échelle
  const T = {};
  const c = Math.cos(rot), s = Math.sin(rot);
  for (const k in o.P) { let [x, y] = o.P[k]; if (flip) x = -x; T[k] = [x * c - y * s, x * s + y * c]; }
  const xs = Object.values(T).map(p => p[0]), ys = Object.values(T).map(p => p[1]);
  const minx = Math.min(...xs), maxx = Math.max(...xs), miny = Math.min(...ys), maxy = Math.max(...ys);
  const sc = Math.min(W / Math.max(maxx - minx, 1e-9), H / Math.max(maxy - miny, 1e-9));
  const S = {};
  for (const k in T) S[k] = [(T[k][0] - minx) * sc, (maxy - T[k][1]) * sc];
  const pts = Object.keys(S);
  const cen = mul(pts.reduce((a, k) => add(a, S[k]), [0, 0]), 1 / pts.length);

  const lines = segs.map(([a, b, st]) => [S[a], S[b], st]);
  const boxes = [];          // étiquettes déjà placées (et points)
  const extra = [];          // segments ajoutés (cotes, marques) à éviter aussi
  let out = '';
  /** nombre de collisions d'une boîte (étiquettes, segments, marques) */
  const hits = (b, skip) => boxes.filter(x => boxHit(b, x)).length + lines.filter((l, i) => i !== skip && segHit(b, l[0], l[1])).length + extra.filter(l => segHit(b, l[0], l[1])).length;
  /** premier candidat sans collision, sinon celui qui en a le moins */
  const best = (cands, f) => { let m = null, mv = Infinity; for (const c of cands) { const v = f(c); if (v === 0) return c; if (v < mv) { mv = v; m = c; } } return m; };
  pts.forEach(k => boxes.push({ x: S[k][0], y: S[k][1], w: 7, h: 7 }));

  // 2. segments
  for (const [p, q, st] of lines) {
    const col = st === 'par' ? PAR : st === 'thin' ? SOFT : INK;
    out += `<line x1="${f1(p[0])}" y1="${f1(p[1])}" x2="${f1(q[0])}" y2="${f1(q[1])}" stroke="${col}" stroke-width="${st === 'thin' ? 1.6 : 2.6}" stroke-linecap="round"${st === 'dash' ? ' stroke-dasharray="7 6"' : ''}/>`;
  }
  // 3. angles droits
  for (const [v, a, b] of right) {
    const ua = unit(sub(S[a], S[v])), ub = unit(sub(S[b], S[v])), r = 13;
    const p1 = add(S[v], mul(ua, r)), p2 = add(p1, mul(ub, r)), p3 = add(S[v], mul(ub, r));
    out += `<path d="M${f1(p1[0])},${f1(p1[1])} L${f1(p2[0])},${f1(p2[1])} L${f1(p3[0])},${f1(p3[1])}" fill="none" stroke="${INK}" stroke-width="1.6"/>`;
    extra.push([p1, p2], [p2, p3]);
  }
  // 4. marques de parallélisme : un chevron dans le même sens sur chaque droite
  if (par.length) {
    const ref = unit(sub(S[par[0][1]], S[par[0][0]]));
    for (const [a, b] of par) {
      let u = unit(sub(S[b], S[a]));
      if (u[0] * ref[0] + u[1] * ref[1] < 0) u = mul(u, -1);
      const n = [-u[1], u[0]];
      const tip = add(S[a], mul(sub(S[b], S[a]), 0.24));
      const l1 = add(tip, add(mul(u, -8), mul(n, 6))), l2 = add(tip, add(mul(u, -8), mul(n, -6)));
      out += `<path d="M${f1(l1[0])},${f1(l1[1])} L${f1(tip[0])},${f1(tip[1])} L${f1(l2[0])},${f1(l2[1])}" fill="none" stroke="${PAR}" stroke-width="2.4" stroke-linecap="round"/>`;
      extra.push([l1, tip], [tip, l2]);
    }
  }
  // 5. arcs d'angle (les étiquettes viennent après)
  const arcs = angs.map(g => {
    const V = S[g.v], ua = unit(sub(S[g.a], V)), ub = unit(sub(S[g.b], V)), r = g.r || 26;
    const p = add(V, mul(ua, r)), q = add(V, mul(ub, r));
    const sweep = ua[0] * ub[1] - ua[1] * ub[0] > 0 ? 1 : 0;
    out += `<path d="M${f1(p[0])},${f1(p[1])} A${r},${r} 0 0 ${sweep} ${f1(q[0])},${f1(q[1])}" fill="none" stroke="${g.ask ? ASK : PAR}" stroke-width="2.2"/>`;
    return { V, bis: unit(add(ua, ub)), ua, ub, g };
  });
  // 6. points et leurs noms : direction qui s'écarte le plus des segments
  let labels = '';
  for (const k of pts) {
    if (hide.includes(k)) continue;
    out += `<circle cx="${f1(S[k][0])}" cy="${f1(S[k][1])}" r="3.2" fill="${INK}"/>`;
    const dirs = [];
    for (const [p, q] of lines) {
      const P = S[k];
      const onP = len(sub(p, P)) < 0.5, onQ = len(sub(q, P)) < 0.5;
      if (onP) dirs.push(Math.atan2(q[1] - P[1], q[0] - P[0]));
      else if (onQ) dirs.push(Math.atan2(p[1] - P[1], p[0] - P[0]));
      else {
        const d = sub(q, p), t = ((P[0] - p[0]) * d[0] + (P[1] - p[1]) * d[1]) / (d[0] ** 2 + d[1] ** 2);
        const pr = add(p, mul(d, t));
        if (t > 0 && t < 1 && len(sub(pr, P)) < 0.5) { const a = Math.atan2(d[1], d[0]); dirs.push(a, a + Math.PI); }
      }
    }
    const w = textW(k, FP) + 2, h = FP;
    const cands = [];
    for (let i = 0; i < 36; i++) {
      const a = i * Math.PI / 18;
      let gap = Math.PI;
      for (const d of dirs) { let x = Math.abs(a - d) % (2 * Math.PI); if (x > Math.PI) x = 2 * Math.PI - x; gap = Math.min(gap, x); }
      const u = [Math.cos(a), Math.sin(a)];
      const away = (u[0] * (S[k][0] - cen[0]) + u[1] * (S[k][1] - cen[1])) / (len(sub(S[k], cen)) || 1);
      for (const r of [9, 14, 20]) {
        const ext = Math.abs(u[0]) * w / 2 + Math.abs(u[1]) * h / 2;
        const b = { x: S[k][0] + u[0] * (r + ext), y: S[k][1] + u[1] * (r + ext), w, h };
        cands.push({ b, score: gap + 0.15 * away - r * 0.01 });
      }
    }
    cands.sort((p, q) => q.score - p.score);
    const ch = best(cands, cd => hits(cd.b));
    boxes.push(ch.b);
    labels += `<text x="${f1(ch.b.x)}" y="${f1(ch.b.y)}" font-size="${FP}" font-weight="700" text-anchor="middle" dominant-baseline="central" fill="${INK}">${esc(k)}</text>`;
  }
  // 7. longueurs
  for (const L of lens) {
    const p = S[L.a], q = S[L.b], u = unit(sub(q, p));
    let n = [-u[1], u[0]];
    const mid = mul(add(p, q), 0.5);
    if ((mid[0] - cen[0]) * n[0] + (mid[1] - cen[1]) * n[1] < 0) n = mul(n, -1); // n vers l'extérieur
    const t = L.ask ? '?' : L.t, fs = L.ask ? FL + 3 : FL, w = textW(t, fs) + 6, h = fs + 2;
    const segIdx = lines.findIndex(l => (l[0] === p && l[1] === q) || (l[0] === q && l[1] === p));
    const ext = nn => Math.abs(nn[0]) * w / 2 + Math.abs(nn[1]) * h / 2;
    const cands = [];
    const sides = L.side === 'in' ? [-1, 1] : [1, -1];
    if (L.dim) {
      for (const off of [24, 36, 48, 62, 76]) for (const sd of sides) for (const tt of [0.5, 0.4, 0.6]) {
        const nn = mul(n, sd), a1 = add(p, mul(nn, off)), b1 = add(q, mul(nn, off));
        const c0 = add(a1, mul(sub(b1, a1), tt));
        cands.push({ b: { x: c0[0], y: c0[1], w, h }, dim: [a1, b1], nn, off });
      }
    } else {
      for (const sd of sides) for (const tt of [0.5, 0.4, 0.6, 0.32, 0.68]) for (const gap of [5, 11]) {
        const nn = mul(n, sd), c0 = add(add(p, mul(sub(q, p), tt)), mul(nn, gap + ext(nn)));
        cands.push({ b: { x: c0[0], y: c0[1], w, h } });
      }
    }
    const good = best(cands, cd => {
      let v = hits(cd.b, cd.dim ? -1 : segIdx);
      if (cd.dim) { // la cote elle-même ne doit croiser ni étiquette, ni segment, ni autre cote
        const [a1, b1] = cd.dim, a2 = add(a1, mul(u, 6)), b2 = sub(b1, mul(u, 6));
        v += boxes.filter(bx => segHit(bx, a2, b2, 1)).length;
        v += lines.filter(l => segCross(a2, b2, l[0], l[1])).length + extra.filter(l => segCross(a2, b2, l[0], l[1])).length;
      }
      return v;
    });
    const col = L.ask ? ASK : INK;
    if (good.dim) {
      const [a1, b1] = good.dim, nn = good.nn;
      const e1 = add(p, mul(nn, 6)), e2 = add(q, mul(nn, 6)), e3 = add(p, mul(nn, good.off + 6)), e4 = add(q, mul(nn, good.off + 6));
      out += `<line x1="${f1(e1[0])}" y1="${f1(e1[1])}" x2="${f1(e3[0])}" y2="${f1(e3[1])}" stroke="${SOFT}" stroke-width="1.2"/><line x1="${f1(e2[0])}" y1="${f1(e2[1])}" x2="${f1(e4[0])}" y2="${f1(e4[1])}" stroke="${SOFT}" stroke-width="1.2"/>`;
      const h1 = add(a1, mul(u, 9)), h2 = sub(b1, mul(u, 9)), m1 = [-u[1] * 4, u[0] * 4];
      out += `<line x1="${f1(a1[0])}" y1="${f1(a1[1])}" x2="${f1(b1[0])}" y2="${f1(b1[1])}" stroke="${col}" stroke-width="1.5"/>`;
      out += `<path d="M${f1(h1[0] + m1[0])},${f1(h1[1] + m1[1])} L${f1(a1[0])},${f1(a1[1])} L${f1(h1[0] - m1[0])},${f1(h1[1] - m1[1])} M${f1(h2[0] + m1[0])},${f1(h2[1] + m1[1])} L${f1(b1[0])},${f1(b1[1])} L${f1(h2[0] - m1[0])},${f1(h2[1] - m1[1])}" fill="none" stroke="${col}" stroke-width="1.5"/>`;
      extra.push([a1, b1], [e1, e3], [e2, e4]);
      labels += `<rect x="${f1(good.b.x - w / 2)}" y="${f1(good.b.y - h / 2)}" width="${f1(w)}" height="${f1(h)}" rx="4" fill="#fff"/>`;
    }
    boxes.push(good.b);
    labels += `<text x="${f1(good.b.x)}" y="${f1(good.b.y)}" font-size="${fs}" font-weight="${L.ask ? 800 : 600}" text-anchor="middle" dominant-baseline="central" fill="${col}" stroke="#fff" stroke-width="4" paint-order="stroke">${esc(t)}</text>`;
  }
  // 8. étiquettes d'angles : le long de la bissectrice, à l'intérieur si possible
  for (const A of arcs) {
    const t = A.g.ask ? '?' : A.g.t, fs = A.g.ask ? FL + 3 : FL, w = textW(t, fs) + 4, h = fs;
    const cands = [];
    for (const r of [44, 54, 64, 76, 90]) cands.push({ x: A.V[0] + A.bis[0] * r, y: A.V[1] + A.bis[1] * r, w, h });
    for (const r of [30, 42]) cands.push({ x: A.V[0] - A.bis[0] * r, y: A.V[1] - A.bis[1] * r, w, h });
    const b = best(cands, cd => hits(cd));
    boxes.push(b);
    labels += `<text x="${f1(b.x)}" y="${f1(b.y)}" font-size="${fs}" font-weight="700" text-anchor="middle" dominant-baseline="central" fill="${A.g.ask ? ASK : PAR}" stroke="#fff" stroke-width="4" paint-order="stroke">${esc(t)}</text>`;
  }
  // 9. cadre : tout ce qui est dessiné
  let x0 = 0, y0 = 0, x1 = (maxx - minx) * sc, y1 = (maxy - miny) * sc;
  for (const b of boxes) { x0 = Math.min(x0, b.x - b.w / 2); x1 = Math.max(x1, b.x + b.w / 2); y0 = Math.min(y0, b.y - b.h / 2); y1 = Math.max(y1, b.y + b.h / 2); }
  for (const [p, q] of extra) for (const z of [p, q]) { x0 = Math.min(x0, z[0]); x1 = Math.max(x1, z[0]); y0 = Math.min(y0, z[1]); y1 = Math.max(y1, z[1]); }
  x0 -= 6; y0 -= 6; x1 += 6; y1 += 6;
  const vw = x1 - x0, vh = y1 - y0;
  return `<svg viewBox="${f1(x0)} ${f1(y0)} ${f1(vw)} ${f1(vh)}" width="${Math.round(vw)}" style="width:${Math.round(vw)}px;max-width:100%;height:auto" class="vis fig" role="img" aria-label="${esc(aria)}">${out}${labels}</svg>`;
}

/** fenêtre Cours : carrés de côté 1, 2 et 3 quadrillés — les longueurs sont multipliées par k, les aires par k² */
export function grilleK() {
  const u = 30, base = 100;
  let x = 24, out = '';
  for (const k of [1, 2, 3]) {
    const a = k * u, y = base - a;
    for (let i = 0; i < k; i++) for (let j = 0; j < k; j++) out += `<rect x="${x + i * u}" y="${y + j * u}" width="${u}" height="${u}" fill="${k === 1 ? '#d0ebff' : '#e5dbff'}" stroke="${PAR}" stroke-width="1.2"/>`;
    out += `<rect x="${x}" y="${y}" width="${a}" height="${a}" fill="none" stroke="${INK}" stroke-width="2.2"/>`;
    const cx = x + a / 2;
    out += `<text x="${cx}" y="${base + 20}" font-size="15" font-weight="700" text-anchor="middle" fill="${INK}">k = ${k}</text>`;
    out += `<text x="${cx}" y="${base + 40}" font-size="14" text-anchor="middle" fill="${SOFT}">aire × ${k * k}</text>`;
    x += a + 46;
  }
  const W = x - 46 + 24, H = base + 50;
  return `<svg viewBox="0 0 ${W} ${H}" width="${W}" style="width:${W}px;max-width:100%;height:auto" class="vis fig" role="img" aria-label="carrés de côtés 1, 2 et 3 : aires 1, 4 et 9" font-family="system-ui,sans-serif">${out}</svg>`;
}

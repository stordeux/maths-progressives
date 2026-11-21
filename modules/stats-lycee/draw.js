// Dessins du module « Statistiques au lycée » (chaînes SVG / HTML, sans DOM) :
// histogramme, polygone des fréquences cumulées, nuage de points, courbe des fréquences observées, tableaux.
// Chaque dessin porte les données de son échelle (data-…) : readHisto(), readPoly(), readNuage() relisent les valeurs
// d'après la GÉOMÉTRIE du dessin (vérification indépendante des tests).
import { M } from '../../engine/util/fmt.js';

const FONT = 'font-family="system-ui,-apple-system,Segoe UI,Roboto,sans-serif"';
const f1 = x => (Math.round(x * 1000) / 1000).toString();
const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const STROKE = 'var(--curve)';

/** tableau de données : rows = [[intitulé, cellules…], …] (nombres → format français) */
export const tab = rows => `<div class="tablewrap"><table class="data">${rows.map(r => `<tr><th>${r[0]}</th>${r.slice(1).map(c => `<td>${typeof c === 'number' ? M(c) : c}</td>`).join('')}</tr>`).join('')}</table></div>`;

/** graduations : positions multiples de step dans [a ; b] */
const graduations = (a, b, step) => { const out = []; for (let v = Math.ceil(a / step - 1e-9) * step; v <= b + 1e-9; v += step) out.push(Math.round(v * 1e6) / 1e6); return out; };

/* ===================================================================== histogramme */
/**
 * Histogramme de classes de même amplitude.
 * bornes : k + 1 limites ; h : k hauteurs (effectifs ou fréquences) ; o.gy : pas du quadrillage ; o.ly : pas des nombres ;
 * o.ytitle : titre de l'axe vertical ; o.xtitle ; o.hl : indices de classes en couleur ; o.top : hauteur maximale de l'axe.
 */
export function histogramme(bornes, h, { gy = 1, ly = 1, ytitle = 'effectif', xtitle = '', hl = [], top = null, width = 520 } = {}) {
  const k = h.length, W = width, L = 50, R = 14, T = 26, B = xtitle ? 62 : 40, H = 300;
  const hi = top || Math.ceil(Math.max(...h) / gy - 1e-9) * gy + gy;
  const pw = W - L - R, ph = H - T - B, ux = pw / (bornes[k] - bornes[0]), uy = ph / hi;
  const X = v => L + (v - bornes[0]) * ux, Y = v => T + ph - v * uy;
  let s = `<svg viewBox="0 0 ${W} ${H}" class="vis histo" style="max-width:${W}px;width:100%" data-x0="${f1(L)}" data-a0="${bornes[0]}" data-ux="${ux}" data-uy="${uy}" role="img" aria-label="histogramme" ${FONT}>`;
  for (const g of graduations(0, hi, gy)) {
    const major = Math.abs(g / ly - Math.round(g / ly)) < 1e-9;
    s += `<line x1="${L}" y1="${f1(Y(g))}" x2="${W - R}" y2="${f1(Y(g))}" stroke="${major ? '#adb5bd' : '#dee2e6'}" stroke-width="1"/>`;
    if (major) s += `<text x="${L - 7}" y="${f1(Y(g) + 5)}" font-size="14" text-anchor="end" fill="#333">${M(g)}</text>`;
  }
  s += `<text x="6" y="16" font-size="14" fill="#555">${esc(ytitle)}</text>`;
  h.forEach((v, i) => {
    s += `<rect class="bar" data-i="${i}" x="${f1(X(bornes[i]))}" y="${f1(Y(v))}" width="${f1((bornes[i + 1] - bornes[i]) * ux)}" height="${f1(v * uy)}" fill="${hl.includes(i) ? '#f08c00' : STROKE}" fill-opacity="${hl.includes(i) ? '.75' : '.35'}" stroke="${STROKE}" stroke-width="2"/>`;
  });
  bornes.forEach(b => { s += `<text x="${f1(X(b))}" y="${T + ph + 20}" font-size="14" text-anchor="middle" fill="#222">${M(b)}</text><line x1="${f1(X(b))}" y1="${T + ph}" x2="${f1(X(b))}" y2="${T + ph + 5}" stroke="#333" stroke-width="1.5"/>`; });
  s += `<line x1="${L}" y1="${T + ph}" x2="${W - R}" y2="${T + ph}" stroke="#333" stroke-width="2"/><line x1="${L}" y1="${T - 6}" x2="${L}" y2="${T + ph}" stroke="#333" stroke-width="2"/>`;
  if (xtitle) s += `<text x="${f1(L + pw / 2)}" y="${H - 8}" font-size="14" text-anchor="middle" fill="#555">${esc(xtitle)}</text>`;
  return s + '</svg>';
}
/** relit l'histogramme : [{a, b, h}] d'après la géométrie des rectangles */
export function readHisto(svg) {
  const g = n => +svg.match(new RegExp(`data-${n}="([^"]+)"`))[1];
  const x0 = g('x0'), a0 = g('a0'), ux = g('ux'), uy = g('uy');
  return [...svg.matchAll(/<rect class="bar" [^>]*?x="([\d.]+)" y="[\d.]+" width="([\d.]+)" height="([\d.]+)"/g)]
    .map(m => { const a = a0 + (+m[1] - x0) / ux; return { a: Math.round(a * 100) / 100, b: Math.round((a + +m[2] / ux) * 100) / 100, h: Math.round(+m[3] / uy * 100) / 100 }; });
}

/* ===================================================================== polygone des fréquences cumulées */
/**
 * Polygone des fréquences cumulées croissantes (en %).
 * bornes : limites des classes ; F : fréquences cumulées (en %) à chaque borne (F[0] = 0, dernier = 100).
 * o.gx : pas du quadrillage horizontal ; o.lx : pas des nombres ; o.h : [{y, l}] droites horizontales en pointillés.
 */
export function polygone(bornes, F, { gx = null, lx = null, h = [], xtitle = '', width = 520, hl = [] } = {}) {
  const k = bornes.length - 1, W = width, L = 50, R = 18, T = 26, B = xtitle ? 62 : 42, H = 330;
  const pw = W - L - R, ph = H - T - B, ux = pw / (bornes[k] - bornes[0]), uy = ph / 100;
  const X = v => L + (v - bornes[0]) * ux, Y = v => T + ph - v * uy;
  const g = gx || (bornes[1] - bornes[0]), l = lx || g;
  let s = `<svg viewBox="0 0 ${W} ${H}" class="vis poly" style="max-width:${W}px;width:100%" data-x0="${f1(L)}" data-a0="${bornes[0]}" data-ux="${ux}" data-yb="${f1(T + ph)}" data-uy="${uy}" role="img" aria-label="polygone des fréquences cumulées" ${FONT}>`;
  for (const y of graduations(0, 100, 10)) {
    const major = y % 20 === 0;
    s += `<line x1="${L}" y1="${f1(Y(y))}" x2="${W - R}" y2="${f1(Y(y))}" stroke="${major ? '#adb5bd' : '#dee2e6'}" stroke-width="1"/>`;
    if (major) s += `<text x="${L - 7}" y="${f1(Y(y) + 5)}" font-size="14" text-anchor="end" fill="#333">${y}</text>`;
  }
  for (const x of graduations(bornes[0], bornes[k], g)) {
    const major = Math.abs((x - bornes[0]) / l - Math.round((x - bornes[0]) / l)) < 1e-9;
    s += `<line x1="${f1(X(x))}" y1="${T}" x2="${f1(X(x))}" y2="${T + ph}" stroke="${major ? '#ced4da' : '#edf0f2'}" stroke-width="1"/>`;
    if (major) s += `<text x="${f1(X(x))}" y="${T + ph + 20}" font-size="14" text-anchor="middle" fill="#222">${M(x)}</text>`;
  }
  s += `<text x="6" y="16" font-size="14" fill="#555">fréquence cumulée (%)</text>`;
  h.forEach(r => {
    s += `<line x1="${L}" y1="${f1(Y(r.y))}" x2="${W - R}" y2="${f1(Y(r.y))}" stroke="#e8590c" stroke-width="2.2" stroke-dasharray="8 6"/>`;
    if (r.l) s += `<text x="${W - R - 4}" y="${f1(Y(r.y) - 6)}" font-size="14" font-weight="700" text-anchor="end" fill="#e8590c">${esc(r.l)}</text>`;
  });
  s += `<polyline points="${F.map((v, i) => `${f1(X(bornes[i]))},${f1(Y(v))}`).join(' ')}" fill="none" stroke="${STROKE}" stroke-width="3" stroke-linejoin="round"/>`;
  F.forEach((v, i) => { s += `<circle class="pt" data-i="${i}" cx="${f1(X(bornes[i]))}" cy="${f1(Y(v))}" r="5" fill="${hl.includes(i) ? '#f08c00' : STROKE}" stroke="#fff" stroke-width="1.5"/>`; });
  s += `<line x1="${L}" y1="${T + ph}" x2="${W - R}" y2="${T + ph}" stroke="#333" stroke-width="2"/><line x1="${L}" y1="${T - 6}" x2="${L}" y2="${T + ph}" stroke="#333" stroke-width="2"/>`;
  if (xtitle) s += `<text x="${f1(L + pw / 2)}" y="${H - 8}" font-size="14" text-anchor="middle" fill="#555">${esc(xtitle)}</text>`;
  return s + '</svg>';
}
/** relit le polygone : [{x, y}] d'après les cercles */
export function readPoly(svg) {
  const g = n => +svg.match(new RegExp(`data-${n}="([^"]+)"`))[1];
  const x0 = g('x0'), a0 = g('a0'), ux = g('ux'), yb = g('yb'), uy = g('uy');
  return [...svg.matchAll(/<circle class="pt" data-i="\d+" cx="([\d.]+)" cy="([\d.]+)"/g)]
    .map(m => ({ x: Math.round((a0 + (+m[1] - x0) / ux) * 100) / 100, y: Math.round((yb - +m[2]) / uy * 100) / 100 }));
}

/* ===================================================================== nuage de points */
/**
 * Nuage de points (x, y).
 * pts : [{x, y, l?}] ; o.xr, o.yr : fenêtres [min ; max] ; o.gx, o.gy : pas du quadrillage ; o.xt, o.yt : titres des axes ;
 * o.G : {x, y, l} point moyen (croix) ; o.cand : [{x, y, l}] croix candidates ; o.droite : {a, b, x0, x1} droite y = ax + b tracée.
 */
export function nuage(pts, { xr, yr, gx = 1, gy = 1, lx = null, ly = null, xt = 'x', yt = 'y', G = null, cand = [], droite = null, width = 520, mark = [] } = {}) {
  const W = width, L = 56, R = 16, T = 28, B = 56, H = 340;
  const pw = W - L - R, ph = H - T - B, ux = pw / (xr[1] - xr[0]), uy = ph / (yr[1] - yr[0]);
  const X = v => L + (v - xr[0]) * ux, Y = v => T + ph - (v - yr[0]) * uy;
  let s = `<svg viewBox="0 0 ${W} ${H}" class="vis nuage" style="max-width:${W}px;width:100%" data-x0="${f1(L)}" data-a0="${xr[0]}" data-ux="${ux}" data-yb="${f1(T + ph)}" data-b0="${yr[0]}" data-uy="${uy}" role="img" aria-label="nuage de points" ${FONT}>`;
  for (const y of graduations(yr[0], yr[1], gy)) {
    const major = !ly || Math.abs((y - yr[0]) / ly - Math.round((y - yr[0]) / ly)) < 1e-9;
    s += `<line x1="${L}" y1="${f1(Y(y))}" x2="${W - R}" y2="${f1(Y(y))}" stroke="${major ? '#ced4da' : '#edf0f2'}" stroke-width="1"/>`;
    if (major) s += `<text x="${L - 7}" y="${f1(Y(y) + 5)}" font-size="14" text-anchor="end" fill="#333">${M(y)}</text>`;
  }
  for (const x of graduations(xr[0], xr[1], gx)) {
    const major = !lx || Math.abs((x - xr[0]) / lx - Math.round((x - xr[0]) / lx)) < 1e-9;
    s += `<line x1="${f1(X(x))}" y1="${T}" x2="${f1(X(x))}" y2="${T + ph}" stroke="${major ? '#ced4da' : '#edf0f2'}" stroke-width="1"/>`;
    if (major) s += `<text x="${f1(X(x))}" y="${T + ph + 20}" font-size="14" text-anchor="middle" fill="#222">${M(x)}</text>`;
  }
  s += `<text x="6" y="16" font-size="14" fill="#555">${esc(yt)}</text><text x="${f1(L + pw / 2)}" y="${H - 10}" font-size="14" text-anchor="middle" fill="#555">${esc(xt)}</text>`;
  if (droite) s += `<line x1="${f1(X(droite.x0))}" y1="${f1(Y(droite.a * droite.x0 + droite.b))}" x2="${f1(X(droite.x1))}" y2="${f1(Y(droite.a * droite.x1 + droite.b))}" stroke="#e8590c" stroke-width="2.6"/>`;
  pts.forEach((p, i) => {
    s += `<circle class="pt" data-i="${i}" cx="${f1(X(p.x))}" cy="${f1(Y(p.y))}" r="${mark.includes(i) ? 7 : 5}" fill="${mark.includes(i) ? '#f08c00' : STROKE}" stroke="#fff" stroke-width="1.2"/>`;
    if (p.l) s += `<text x="${f1(X(p.x) + 9)}" y="${f1(Y(p.y) - 7)}" font-size="15" font-weight="700" fill="#222" paint-order="stroke" stroke="#fff" stroke-width="3">${esc(p.l)}</text>`;
  });
  const croix = (p, c) => `<g class="cx" data-l="${esc(p.l || '')}" data-cx="${f1(X(p.x))}" data-cy="${f1(Y(p.y))}"><line x1="${f1(X(p.x) - 7)}" y1="${f1(Y(p.y) - 7)}" x2="${f1(X(p.x) + 7)}" y2="${f1(Y(p.y) + 7)}" stroke="${c}" stroke-width="3"/><line x1="${f1(X(p.x) - 7)}" y1="${f1(Y(p.y) + 7)}" x2="${f1(X(p.x) + 7)}" y2="${f1(Y(p.y) - 7)}" stroke="${c}" stroke-width="3"/>${p.l ? `<text x="${f1(X(p.x) + 10)}" y="${f1(Y(p.y) - 8)}" font-size="16" font-weight="800" fill="${c}" paint-order="stroke" stroke="#fff" stroke-width="3">${esc(p.l)}</text>` : ''}</g>`;
  cand.forEach(p => { s += croix(p, '#c2255c'); });
  if (G) s += croix(G, '#c2255c');
  s += `<line x1="${L}" y1="${T + ph}" x2="${W - R}" y2="${T + ph}" stroke="#333" stroke-width="2"/><line x1="${L}" y1="${T - 6}" x2="${L}" y2="${T + ph}" stroke="#333" stroke-width="2"/>`;
  return s + '</svg>';
}
/** relit le nuage : points [{x, y}] et croix [{l, x, y}] d'après la géométrie */
export function readNuage(svg) {
  const g = n => +svg.match(new RegExp(`data-${n}="([^"]+)"`))[1];
  const x0 = g('x0'), a0 = g('a0'), ux = g('ux'), yb = g('yb'), b0 = g('b0'), uy = g('uy');
  const vx = px => Math.round((a0 + (px - x0) / ux) * 100) / 100, vy = py => Math.round((b0 + (yb - py) / uy) * 100) / 100;
  return {
    pts: [...svg.matchAll(/<circle class="pt" data-i="\d+" cx="([\d.]+)" cy="([\d.]+)"/g)].map(m => ({ x: vx(+m[1]), y: vy(+m[2]) })),
    croix: [...svg.matchAll(/<g class="cx" data-l="([^"]*)" data-cx="([\d.]+)" data-cy="([\d.]+)"/g)].map(m => ({ l: m[1], x: vx(+m[2]), y: vy(+m[3]) })),
  };
}

/* ===================================================================== fréquences observées */
/**
 * Fréquence d'apparition d'un événement en fonction du nombre d'essais n : points (n, f), joints par des segments.
 * o.yr : [min ; max] de l'axe vertical ; o.gy : pas.
 */
export function courbeFreq(pts, { nmax, yr = [0, 1], gy = 0.1, ly = 0.2, width = 520, xt = "nombre d'essais" } = {}) {
  const W = width, L = 56, R = 16, T = 28, B = 52, H = 300;
  const pw = W - L - R, ph = H - T - B, ux = pw / nmax, uy = ph / (yr[1] - yr[0]);
  const X = v => L + v * ux, Y = v => T + ph - (v - yr[0]) * uy;
  let s = `<svg viewBox="0 0 ${W} ${H}" class="vis freq" style="max-width:${W}px;width:100%" data-x0="${f1(L)}" data-ux="${ux}" data-yb="${f1(T + ph)}" data-b0="${yr[0]}" data-uy="${uy}" role="img" aria-label="fréquence observée selon le nombre d'essais" ${FONT}>`;
  for (const y of graduations(yr[0], yr[1], gy)) {
    const major = Math.abs((y - yr[0]) / ly - Math.round((y - yr[0]) / ly)) < 1e-9;
    s += `<line x1="${L}" y1="${f1(Y(y))}" x2="${W - R}" y2="${f1(Y(y))}" stroke="${major ? '#adb5bd' : '#dee2e6'}" stroke-width="1"/>`;
    if (major) s += `<text x="${L - 7}" y="${f1(Y(y) + 5)}" font-size="14" text-anchor="end" fill="#333">${M(y)}</text>`;
  }
  const step = nmax <= 100 ? 20 : nmax <= 500 ? 100 : 200;
  for (let n = 0; n <= nmax; n += step) s += `<text x="${f1(X(n))}" y="${T + ph + 20}" font-size="14" text-anchor="middle" fill="#222">${n}</text><line x1="${f1(X(n))}" y1="${T + ph}" x2="${f1(X(n))}" y2="${T + ph + 5}" stroke="#333"/>`;
  s += `<text x="6" y="16" font-size="14" fill="#555">fréquence observée</text><text x="${f1(L + pw / 2)}" y="${H - 8}" font-size="14" text-anchor="middle" fill="#555">${esc(xt)}</text>`;
  s += `<polyline points="${pts.map(p => `${f1(X(p.n))},${f1(Y(p.f))}`).join(' ')}" fill="none" stroke="${STROKE}" stroke-width="2.4" stroke-linejoin="round"/>`;
  pts.forEach((p, i) => { if (pts.length <= 40 || i === pts.length - 1) s += `<circle class="pt" cx="${f1(X(p.n))}" cy="${f1(Y(p.f))}" r="3.4" fill="${STROKE}"/>`; });
  s += `<line x1="${L}" y1="${T + ph}" x2="${W - R}" y2="${T + ph}" stroke="#333" stroke-width="2"/><line x1="${L}" y1="${T - 6}" x2="${L}" y2="${T + ph}" stroke="#333" stroke-width="2"/>`;
  return s + '</svg>';
}
/** relit la dernière fréquence tracée */
export function readFreqFin(svg) {
  const g = n => +svg.match(new RegExp(`data-${n}="([^"]+)"`))[1];
  const yb = g('yb'), b0 = g('b0'), uy = g('uy');
  const pts = [...svg.matchAll(/<polyline points="([^"]+)"/g)][0][1].split(' ').map(p => p.split(',').map(Number));
  return b0 + (yb - pts[pts.length - 1][1]) / uy;
}

/** trois barres d'une série (diagramme à points) : valeurs sur une droite graduée, pour comparer la dispersion */
export function pointsSurDroite(series, { lo, hi, g = 1, lab = 1, width = 520 } = {}) {
  const W = width, L = 30, R = 20, rowH = 64, T = 8, H = T + series.length * rowH + 40;
  const ux = (W - L - R) / (hi - lo), X = v => L + (v - lo) * ux;
  let s = `<svg viewBox="0 0 ${W} ${H}" class="vis" style="max-width:${W}px;width:100%" role="img" aria-label="valeurs de chaque série sur une droite graduée" ${FONT}>`;
  const ay = T + series.length * rowH;
  for (const x of graduations(lo, hi, g)) {
    const major = Math.abs((x - lo) / lab - Math.round((x - lo) / lab)) < 1e-9;
    s += `<line x1="${f1(X(x))}" y1="${T}" x2="${f1(X(x))}" y2="${ay}" stroke="${major ? '#ced4da' : '#edf0f2'}"/>`;
    if (major) s += `<text x="${f1(X(x))}" y="${ay + 22}" font-size="14" text-anchor="middle" fill="#222">${M(x)}</text>`;
  }
  series.forEach((S, r) => {
    const y = T + r * rowH + rowH / 2 + 4, cnt = new Map();
    s += `<text x="${L}" y="${T + r * rowH + 14}" font-size="15" font-weight="700" fill="#222">${esc(S.nom)}</text>`;
    S.vals.forEach(v => { const c = cnt.get(v) || 0; cnt.set(v, c + 1); s += `<circle cx="${f1(X(v))}" cy="${f1(y + 10 - c * 11)}" r="4.6" fill="${r % 2 ? '#c2255c' : STROKE}" fill-opacity=".85"/>`; });
    s += `<line x1="${L}" y1="${T + (r + 1) * rowH - 2}" x2="${W - R}" y2="${T + (r + 1) * rowH - 2}" stroke="#ced4da" stroke-dasharray="3 4"/>`;
  });
  s += `<line x1="${L}" y1="${ay}" x2="${W - R}" y2="${ay}" stroke="#333" stroke-width="2"/>`;
  return s + '</svg>';
}

/** barres horizontales de même longueur découpées selon les fréquences conditionnelles : rows = [{ nom, a, b }], leg = [libellé a, libellé b] */
export function barresCond(rows, leg, { width = 520 } = {}) {
  const L = 110, R = 16, T = 34, rowH = 48, W = width, H = T + rows.length * rowH + 12, pw = W - L - R;
  let s = `<svg viewBox="0 0 ${W} ${H}" class="vis" style="max-width:${W}px;width:100%" role="img" aria-label="fréquences conditionnelles dans chaque groupe" ${FONT}>`;
  s += `<rect x="${L}" y="8" width="14" height="14" fill="${STROKE}" fill-opacity=".55"/><text x="${L + 20}" y="20" font-size="14" fill="#222">${esc(leg[0])}</text><rect x="${L + 20 + leg[0].length * 7.6 + 16}" y="8" width="14" height="14" fill="#f08c00" fill-opacity=".6"/><text x="${L + 20 + leg[0].length * 7.6 + 36}" y="20" font-size="14" fill="#222">${esc(leg[1])}</text>`;
  rows.forEach((r, i) => {
    const tot = r.a + r.b, y = T + i * rowH, wa = pw * r.a / tot, fa = Math.round(r.a / tot * 1000) / 10, fb = Math.round(r.b / tot * 1000) / 10;
    s += `<text x="${L - 8}" y="${y + 26}" font-size="15" text-anchor="end" fill="#222">${esc(r.nom)}</text>`;
    s += `<rect x="${L}" y="${y + 6}" width="${f1(wa)}" height="28" fill="${STROKE}" fill-opacity=".55" stroke="#333"/><rect x="${f1(L + wa)}" y="${y + 6}" width="${f1(pw - wa)}" height="28" fill="#f08c00" fill-opacity=".6" stroke="#333"/>`;
    s += `<text x="${f1(L + wa / 2)}" y="${y + 26}" font-size="14" text-anchor="middle" font-weight="700" fill="#111">${M(fa)} %</text><text x="${f1(L + wa + (pw - wa) / 2)}" y="${y + 26}" font-size="14" text-anchor="middle" font-weight="700" fill="#111">${M(fb)} %</text>`;
  });
  return s + '</svg>';
}

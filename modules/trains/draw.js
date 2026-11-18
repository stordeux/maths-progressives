// Figures du module Trains (chaînes SVG, sans DOM : importable par Node pour les tests).
// frise et horloges (horaires), fiche horaire (tableau), barre des heures, ligne de train (gares et distances),
// deux trains sur une ligne, graphique horaire, panneau de vitesse.
import { M } from '../../engine/util/fmt.js';

const INK = '#343a40', ACC = '#1d4ed8', ORA = '#d9480f', GRN = '#2b8a3e', GRY = '#adb5bd', PALE = '#e8efff';
const f1 = x => (Math.round(x * 10) / 10).toString();
const svg = (w, h, label, inner, maxw = w) => `<svg viewBox="0 0 ${w} ${h}" class="vis" style="max-width:${maxw}px" role="img" aria-label="${label}" font-family="system-ui,sans-serif">${inner}</svg>`;
const tx = (x, y, s, o = {}) => `<text x="${f1(x)}" y="${f1(y)}" font-size="${o.fs || 14}" text-anchor="${o.a || 'middle'}" fill="${o.c || INK}"${o.b ? ' font-weight="700"' : ''}${o.halo ? ' paint-order="stroke" stroke="#fff" stroke-width="4" stroke-linejoin="round"' : ''}>${s}</text>`;
const ln = (x1, y1, x2, y2, c = INK, w = 2, extra = '') => `<line x1="${f1(x1)}" y1="${f1(y1)}" x2="${f1(x2)}" y2="${f1(y2)}" stroke="${c}" stroke-width="${w}"${extra}/>`;

/** horaire « 8 h 15 » (t en minutes depuis minuit), pour les textes SVG */
export const hmTxt = t => `${Math.floor(t / 60)} h ${String(t % 60).padStart(2, '0')}`;
/** durée « 1 h 35 min » */
export const dureeTxt = m => (m < 60 ? `${m} min` : `${Math.floor(m / 60)} h${m % 60 ? ` ${m % 60} min` : ''}`);

/* ---------- frise des horaires ---------- */
/** frise de a à b (minutes depuis minuit). o.dur : texte de la durée ('?' si inconnue) ; o.endUnknown : l'arrivée est inconnue */
export function frise(a, b, o = {}) {
  const W = 460, H = 128, x0 = 66, x1 = W - 66, y = 84;
  const T0 = Math.floor(a / 60) * 60, T1 = Math.max(Math.ceil(b / 60) * 60, T0 + 60), span = T1 - T0;
  const X = t => x0 + (t - T0) / span * (x1 - x0);
  let s = ln(x0 - 14, y, x1 + 14, y, INK, 2.5);
  const minor = span <= 60 ? 5 : span <= 180 ? 15 : 30;
  for (let t = T0; t <= T1; t += minor) {
    const hour = t % 60 === 0, q = span <= 60 && t % 15 === 0;
    s += ln(X(t), y - (hour ? 13 : q ? 9 : 5), X(t), y + (hour ? 13 : q ? 9 : 5), hour ? INK : '#868e96', hour ? 2.5 : 1.5);
    if (hour) s += tx(X(t), y + 31, `${t / 60} h`, { b: 1, fs: 15 });
    else if (q) s += tx(X(t), y + 28, String(t % 60), { fs: 11, c: '#868e96' });
  }
  const xa = X(a), xb = X(b);
  s += ln(xa, 30, xa, y, GRN, 1.5, ' stroke-dasharray="4 3"') + ln(xb, 30, xb, y, ORA, 1.5, ' stroke-dasharray="4 3"');
  s += `<circle cx="${f1(xa)}" cy="${y}" r="6" fill="${GRN}"/><circle cx="${f1(xb)}" cy="${y}" r="6" fill="${ORA}"/>`;
  s += tx(xa - 6, 22, o.startUnknown ? '?' : hmTxt(a), { a: 'end', b: 1, fs: 16, c: o.startUnknown ? ORA : GRN });
  s += tx(xb + 6, 22, o.endUnknown ? '?' : hmTxt(b), { a: 'start', b: 1, fs: 16, c: ORA });
  s += ln(xa, 50, xb, 50, ACC, 2.5) + `<path d="M${f1(xa + 8)},45 L${f1(xa)},50 L${f1(xa + 8)},55 M${f1(xb - 8)},45 L${f1(xb)},50 L${f1(xb - 8)},55" fill="none" stroke="${ACC}" stroke-width="2.5"/>`;
  if (o.dur !== undefined) s += tx((xa + xb) / 2, 44, o.dur === '?' ? 'durée ?' : o.dur, { b: 1, fs: 14, c: ACC, halo: 1 });
  return svg(W, H, `frise des horaires, de ${hmTxt(a)} à ${o.endUnknown ? 'une heure inconnue' : hmTxt(b)}`, s, 480);
}

/* ---------- horloges ---------- */
function clock(cx, cy, r, t, c) {
  let s = `<circle cx="${cx}" cy="${cy}" r="${r}" fill="#fff" stroke="${INK}" stroke-width="3"/>`;
  for (let i = 0; i < 60; i++) {
    const an = i * 6 * Math.PI / 180, big = i % 5 === 0, r1 = r - (big ? 9 : 4);
    s += ln(cx + r1 * Math.sin(an), cy - r1 * Math.cos(an), cx + (r - 2) * Math.sin(an), cy - (r - 2) * Math.cos(an), big ? INK : GRY, big ? 2 : 1);
  }
  for (const n of [12, 3, 6, 9]) { const an = n * 30 * Math.PI / 180; s += tx(cx + (r - 20) * Math.sin(an), cy - (r - 20) * Math.cos(an) + 5, n, { fs: 13, b: 1 }); }
  const am = (t % 60) * 6 * Math.PI / 180, ah = ((t / 60) % 12) * 30 * Math.PI / 180;
  s += ln(cx, cy, cx + (r - 30) * Math.sin(ah), cy - (r - 30) * Math.cos(ah), INK, 5) + ln(cx, cy, cx + (r - 12) * Math.sin(am), cy - (r - 12) * Math.cos(am), c, 3);
  return s + `<circle cx="${cx}" cy="${cy}" r="4" fill="${INK}"/>`;
}
/** deux horloges : départ et arrivée (l'arrivée peut être inconnue) */
export function horloges(a, b, o = {}) {
  let s = clock(75, 74, 62, a, GRN) + tx(75, 156, `départ ${hmTxt(a)}`, { b: 1, c: GRN, fs: 15 });
  s += `<path d="M150,74 H198 m-10,-8 l10,8 l-10,8" fill="none" stroke="${INK}" stroke-width="3"/>`;
  s += o.endUnknown ? `<circle cx="285" cy="74" r="62" fill="#fff" stroke="${INK}" stroke-width="3" stroke-dasharray="6 5"/>` + tx(285, 90, '?', { fs: 48, b: 1, c: ORA }) + tx(285, 156, 'arrivée ?', { b: 1, c: ORA, fs: 15 })
    : clock(285, 74, 62, b, ORA) + tx(285, 156, `arrivée ${hmTxt(b)}`, { b: 1, c: ORA, fs: 15 });
  return svg(360, 166, `horloges : départ à ${hmTxt(a)}`, s, 380);
}

/* ---------- fiche horaire ---------- */
/** rows : [{ g, arr, dep }] (minutes ou null) ; o.hl : indices de gares en surbrillance */
export function ficheHoraire(rows, o = {}) {
  const W = 440, rh = 30, H = 44 + rows.length * rh + 8, hl = new Set(o.hl || []);
  let s = `<rect x="2" y="2" width="${W - 4}" height="${H - 4}" rx="10" fill="#fff" stroke="${ACC}" stroke-width="3"/>`;
  s += `<path d="M2,12 a10,10 0 0 1 10,-10 h${W - 24} a10,10 0 0 1 10,10 v26 h-${W - 4} z" fill="${ACC}"/>`;
  s += tx(16, 26, 'Gare', { a: 'start', c: '#fff', b: 1, fs: 15 }) + tx(300, 26, 'Arrivée', { c: '#fff', b: 1, fs: 15 }) + tx(386, 26, 'Départ', { c: '#fff', b: 1, fs: 15 });
  rows.forEach((r, i) => {
    const y = 40 + i * rh;
    if (i % 2) s += `<rect x="4" y="${y}" width="${W - 8}" height="${rh}" fill="${PALE}"/>`;
    if (hl.has(i)) s += `<rect x="4" y="${y}" width="${W - 8}" height="${rh}" fill="#fff3bf"/>`;
    s += tx(16, y + 20, r.g, { a: 'start', b: 1, fs: 15 });
    s += tx(300, y + 20, r.arr == null ? '–' : hmTxt(r.arr), { fs: 15 }) + tx(386, y + 20, r.dep == null ? '–' : hmTxt(r.dep), { fs: 15 });
  });
  return svg(W, H, 'fiche horaire du train : gares, heures d\'arrivée et de départ', s, 460);
}

/* ---------- barre des heures ---------- */
/** barre de ceil(total/60) heures, remplie sur `total` minutes (sans étiquette de la réponse) */
export function barreHeures(total) {
  const n = Math.max(1, Math.ceil(total / 60)), hw = 88, x0 = 24, W = x0 * 2 + n * hw, H = 78;
  let s = `<rect x="${x0}" y="14" width="${f1(total / 60 * hw)}" height="34" fill="#a5d8ff"/>`;
  for (let i = 0; i < n; i++) s += `<rect x="${x0 + i * hw}" y="14" width="${hw}" height="34" fill="none" stroke="${INK}" stroke-width="2.5"/>` + [1, 2, 3].map(k => ln(x0 + i * hw + k * hw / 4, 14, x0 + i * hw + k * hw / 4, 14 + (k === 2 ? 22 : 14), '#495057', 1.2)).join('');
  for (let i = 0; i <= n; i++) s += tx(x0 + i * hw, 68, `${i} h`, { b: 1, fs: 15 });
  return svg(W, H, `barre de ${n} heures, remplie sur ${total} minutes`, s, W + 20);
}

/* ---------- trains et lignes ---------- */
function trainIcon(x, yr, c = ACC, dir = 1) {
  const w = 66, h = 26, top = yr - 5 - h;
  let s = `<rect x="${f1(x - w / 2)}" y="${top}" width="${w}" height="${h}" rx="7" fill="${c}"/>`;
  s += `<path d="M${f1(x + dir * w / 2)},${top + 4} q${dir * 12},${h / 2 - 2} 0,${h - 8} z" fill="${c}"/>`;
  for (let i = 0; i < 4; i++) s += `<rect x="${f1(x - w / 2 + 7 + i * 14)}" y="${top + 5}" width="9" height="9" rx="2" fill="#fff"/>`;
  s += `<circle cx="${f1(x - 18)}" cy="${yr - 3}" r="4.5" fill="${INK}"/><circle cx="${f1(x + 18)}" cy="${yr - 3}" r="4.5" fill="${INK}"/>`;
  return s;
}
const gare = (x, y, nom, c = INK) => `<circle cx="${f1(x)}" cy="${y}" r="7" fill="#fff" stroke="${c}" stroke-width="3.5"/>` + tx(x, y + 26, nom, { b: 1, fs: 15 });
const val = (t, unknown) => (unknown ? `<tspan fill="${ORA}" font-size="18">?</tspan>` : t);
/** accolade horizontale de xa à xb avec son étiquette au-dessus */
function accolade(xa, xb, y, label, c = INK, fs = 15) {
  return `<path d="M${f1(xa)},${y + 8} v-8 H${f1(xb)} v8" fill="none" stroke="${c}" stroke-width="2.5"/>` + tx((xa + xb) / 2, y - 7, label, { b: 1, fs, c });
}

/** ligne de train entre deux gares. o : { a, b, dist, dur, v, inconnu: 'dist' | 'dur' | 'v' | '' } (textes déjà formatés) */
export function ligne(o) {
  const W = 470, xa = 60, xb = W - 60, yr = 104;
  let s = ln(xa, yr, xb, yr, INK, 4) + gare(xa, yr, o.a, GRN) + gare(xb, yr, o.b, ORA);
  s += accolade(xa, xb, 40, o.inconnu === 'dist' ? `<tspan fill="${ORA}">distance ? km</tspan>` : `${o.dist}`, INK);
  s += trainIcon(xa + 110, yr, ACC) + tx(xa + 110, yr - 42, o.inconnu === 'v' ? `<tspan fill="${ORA}">vitesse ?</tspan>` : `${o.v}`, { b: 1, fs: 14, c: ACC });
  const dur = o.inconnu === 'dur' ? '<tspan fill="#d9480f">durée ?</tspan>' : `durée ${o.dur}`;
  s += `<rect x="${W / 2 - 74}" y="148" width="148" height="26" rx="13" fill="${PALE}" stroke="${ACC}" stroke-width="2"/>` + tx(W / 2, 166, dur, { b: 1, fs: 14, c: ACC });
  s += `<path d="M${xa + 150},${yr - 14} h40 m-9,-6 l9,6 l-9,6" fill="none" stroke="${ACC}" stroke-width="2.5"/>`;
  return svg(W, 184, `ligne de train de ${o.a} à ${o.b}`, s, 500);
}

/**
 * Deux trains. o.mode = 'croise' : A à gauche, B à droite, trains face à face ; D = texte de la distance A–B.
 * o.mode = 'rattrape' : tous deux partent de A vers la droite ; le train 1 (lent) a pris de l'avance.
 * o.a, o.b : noms ; o.v1, o.v2 : textes des vitesses ; o.h1, o.h2 : textes des heures de départ (rattrapage).
 */
export function deuxTrains(o) {
  const W = 470, xa = 60, xb = W - 60, yr = 108;
  if (o.mode === 'croise') {
    let s = ln(xa, yr, xb, yr, INK, 4) + gare(xa, yr, o.a, GRN) + gare(xb, yr, o.b, ORA);
    s += accolade(xa, xb, 40, `distance ${o.D}`, INK);
    s += trainIcon(xa + 100, yr, ACC, 1) + tx(xa + 100, yr - 42, `train 1 : ${o.v1}`, { b: 1, c: ACC });
    s += trainIcon(xb - 100, yr, GRN, -1) + tx(xb - 100, yr - 42, `train 2 : ${o.v2}`, { b: 1, c: GRN });
    s += `<path d="M${xa + 142},${yr - 14} h26 m-8,-6 l8,6 l-8,6 M${xb - 142},${yr - 14} h-26 m8,-6 l-8,6 l8,6" fill="none" stroke="${INK}" stroke-width="2.5"/>`;
    s += `<circle cx="${W / 2}" cy="${yr}" r="9" fill="none" stroke="${ORA}" stroke-width="3" stroke-dasharray="4 3"/>` + tx(W / 2, yr + 30, 'rencontre ?', { b: 1, c: ORA });
    return svg(W, 150, `deux trains partent de ${o.a} et de ${o.b} l'un vers l'autre`, s, 500);
  }
  const x1 = 250;
  let s = ln(xa - 20, yr, xb + 10, yr, INK, 4) + gare(xa, yr, o.a, GRN);
  s += trainIcon(x1, yr, ACC, 1) + tx(x1, yr - 42, `train 1 : ${o.v1}`, { b: 1, c: ACC }) + tx(x1, yr - 58, `parti à ${o.h1}`, { fs: 13, c: ACC });
  s += trainIcon(xa + 10, yr, GRN, 1) + tx(xa + 10, yr - 42, `train 2 : ${o.v2}`, { b: 1, c: GRN }) + tx(xa + 10, yr - 58, `part à ${o.h2}`, { fs: 13, c: GRN });
  s += accolade(xa + 44, x1 - 34, 34, 'avance du train 1', ORA, 13);
  s += `<path d="M${xb - 30},${yr - 14} h26 m-8,-6 l8,6 l-8,6" fill="none" stroke="${INK}" stroke-width="2.5"/>` + tx(xb - 20, yr + 30, 'rattrapage ?', { b: 1, c: ORA, fs: 13 });
  return svg(W, 150, `deux trains partent de ${o.a} dans le même sens, le train 2 plus tard`, s, 500);
}

/* ---------- panneau de vitesse ---------- */
export function panneau(texte, unite) {
  const s = `<circle cx="70" cy="62" r="52" fill="#fff" stroke="#c92a2a" stroke-width="10"/>` + tx(70, 66, texte, { fs: 34, b: 1 }) + tx(70, 90, unite, { fs: 16, b: 1 })
    + trainIcon(215, 112, ACC, 1) + ln(150, 112, 290, 112, INK, 4) + `<path d="M${298},${100} h26 m-8,-6 l8,6 l-8,6" fill="none" stroke="${INK}" stroke-width="2.5"/>`;
  return svg(340, 130, `panneau de vitesse : ${texte} ${unite}`, s, 360);
}
/** schéma de conversion km/h ↔ m/s */
export function conversion() {
  const box = (x, t) => `<rect x="${x}" y="30" width="110" height="52" rx="10" fill="${PALE}" stroke="${ACC}" stroke-width="3"/>` + tx(x + 55, 63, t, { b: 1, fs: 22, c: ACC });
  const s = box(20, 'km/h') + box(250, 'm/s')
    + `<path d="M138,42 H240 m-9,-7 l9,7 l-9,7" fill="none" stroke="${INK}" stroke-width="2.5"/>` + tx(189, 34, '÷ 3,6', { b: 1, fs: 16, c: ORA })
    + `<path d="M242,70 H140 m9,-7 l-9,7 l9,7" fill="none" stroke="${INK}" stroke-width="2.5"/>` + tx(189, 94, '× 3,6', { b: 1, fs: 16, c: GRN })
    + tx(190, 120, '1 m/s = 3,6 km/h', { fs: 14 });
  return svg(380, 130, 'conversion entre kilomètres par heure et mètres par seconde', s, 400);
}

/* ---------- graphique horaire ---------- */
const nice = y1 => [10, 20, 25, 50, 100, 200, 250].find(k => y1 / k <= 10) || 500;
/**
 * o.t0, o.t1 : minutes ; o.y1 : km maximal ; o.step : pas des lignes horizontales (km) ;
 * o.lines : [{ pts: [[t, km], …], c, l (nom), side: -1 | 1 }] ; o.marks : [{ t, y, c }] repères en pointillés vers les axes.
 */
export function graphe(o) {
  const W = 470, H = 310, L = 56, R = 16, T = 24, B = 44, { t0, t1, y1 } = o, step = o.step || nice(y1);
  const X = t => L + (t - t0) / (t1 - t0) * (W - L - R), Y = y => H - B - y / y1 * (H - B - T);
  let s = '';
  for (let t = t0; t <= t1; t += 30) s += ln(X(t), T, X(t), H - B, t % 60 === 0 ? '#ced4da' : '#e9ecef', t % 60 === 0 ? 1.4 : 1);
  const every = y1 / step > 8 ? 2 : 1;
  for (let k = 0, y = 0; y <= y1 + 1e-9; k++, y += step) {
    s += ln(L, Y(y), W - R, Y(y), y === 0 ? INK : '#e9ecef', y === 0 ? 2 : 1);
    if (k % every === 0) s += tx(L - 6, Y(y) + 4, M(y), { a: 'end', fs: 12, c: '#495057' });
  }
  s += ln(L, T - 8, L, H - B, INK, 2) + `<path d="M${L},${T - 12} l-5,9 h10 z" fill="${INK}"/>`;
  s += `<path d="M${W - R + 8},${H - B} l-9,-5 v10 z" fill="${INK}"/>`;
  for (let t = t0; t <= t1; t += 60) s += ln(X(t), H - B, X(t), H - B + 5, INK, 2) + tx(X(t), H - B + 20, `${t / 60} h`, { fs: 13, b: 1 });
  s += tx(L + 6, T - 8, 'distance (km)', { a: 'start', fs: 12, c: '#495057' }) + tx(W - R, H - 6, 'heure', { a: 'end', fs: 12, c: '#495057' });
  (o.lines || []).forEach(l => {
    s += `<polyline points="${l.pts.map(([t, y]) => `${f1(X(t))},${f1(Y(y))}`).join(' ')}" fill="none" stroke="${l.c || ACC}" stroke-width="3.5" stroke-linejoin="round"/>`;
    l.pts.forEach(([t, y]) => { s += `<circle cx="${f1(X(t))}" cy="${f1(Y(y))}" r="3.5" fill="${l.c || ACC}"/>`; });
    if (l.l) {
      const m = l.pts[Math.min(1, l.pts.length - 1)], p0 = l.pts[0], sd = l.side || -1;
      s += tx(X((m[0] + p0[0]) / 2) + sd * 10, Y((m[1] + p0[1]) / 2) - 10, l.l, { a: sd < 0 ? 'end' : 'start', b: 1, fs: 14, c: l.c || ACC, halo: 1 });
    }
  });
  (o.marks || []).forEach(m => {
    const c = m.c || ORA;
    s += ln(X(m.t), Y(m.y), X(m.t), H - B, c, 2, ' stroke-dasharray="5 4"') + ln(L, Y(m.y), X(m.t), Y(m.y), c, 2, ' stroke-dasharray="5 4"');
    s += `<circle cx="${f1(X(m.t))}" cy="${f1(Y(m.y))}" r="6" fill="${c}" stroke="#fff" stroke-width="2"/>`;
    if (m.lt) s += tx(X(m.t), H - B + 36, m.lt, { b: 1, fs: 13, c, halo: 1 });
    if (m.ly) s += tx(L + 8, Y(m.y) - 6, m.ly, { a: 'start', b: 1, fs: 13, c, halo: 1 });
  });
  return svg(W, H, o.aria || 'graphique horaire : distance parcourue en fonction de l\'heure', s, 520);
}

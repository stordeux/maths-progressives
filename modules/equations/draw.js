// Dessins du module Équations.
// • balance(L, R, o) : balance à deux plateaux (Roberval) toujours en équilibre. Chaque plateau porte des sacs « x »,
//   des masses d'une unité et, pour les nombres négatifs, des ballons qui tirent vers le haut (−1 chacun).
//   Avec o.anim, la balance est animée en SMIL (<animate>, <animateTransform>, sans bibliothèque) : on enlève (ou on
//   ajoute) la même chose des deux côtés, puis on partage en parts égales. Un bouton « Revoir » relance l'animation.
//   Si l'utilisateur a demandé moins d'animations (prefers-reduced-motion), on montre l'état final, fixe.
// • steps(rows) : étapes de résolution alignées sur le signe « = » (visuel abstrait des niveaux suivants).
// Fonctions pures : chaînes SVG / HTML, aucun accès au DOM (le fichier est importé par Node pour les tests).
import { M } from '../../engine/util/fmt.js';

let uid = 0;
const W = 480, H = 324, PY = 182; // PY : dessus des plateaux
const CX = [120, 360];
const ROW = 164;
const COLORS = ['#1c7ed6', '#e8590c', '#9c36b5', '#2f9e44', '#c2255c', '#0c8599', '#5c940d', '#d6336c'];
const BAG = '#a8682a', UNIT = '#495057', ACC = '#2b8a3e';
const f1 = v => String(Math.round(v * 10) / 10);
const pl = (n, w) => `${n} ${w}${n > 1 ? 's' : ''}`;
const xs = n => (n === 1 ? 'x' : n + 'x');

/** combien de sacs, masses, ballons au plus sur un plateau (au-delà, on passe au visuel abstrait) */
const MAXX = 5, MAXU = 28, MAXB = 8;

/**
 * Plan de résolution sur la balance. L, R = {x, u, b} (sacs, masses, ballons).
 * Renvoie null si la situation ne se représente pas proprement (solution non entière positive, trop d'objets…).
 */
export function balancePlan(L, R) {
  const S = [L, R].map(p => ({ x: p.x || 0, u: p.u || 0, b: p.b || 0 }));
  if (S.some(p => p.x < 0 || p.u < 0 || p.b < 0 || p.x > MAXX || p.b > MAXB || (p.u && p.b))) return null;
  if (S[0].x === S[1].x) return null;
  const X = S[0].x > S[1].x ? 0 : 1, O = 1 - X;
  if (S[O].b) return null;
  // objets : {side, kind, add?, rm?, late?, col?}
  const items = [];
  S.forEach((p, side) => {
    for (let i = 0; i < p.x; i++) items.push({ side, kind: 'x' });
    for (let i = 0; i < p.u; i++) items.push({ side, kind: 'u' });
    for (let i = 0; i < p.b; i++) items.push({ side, kind: 'b' });
  });
  const live = (side, kind) => items.filter(it => it.side === side && it.kind === kind && it.rm === undefined);
  const steps = [];
  let k = 0;
  if (S[O].x) {
    const m = S[O].x;
    live(O, 'x').forEach(it => { it.rm = k; });
    live(X, 'x').slice(-m).forEach(it => { it.rm = k; });
    steps.push({ cap: [`On enlève ${m === 1 ? 'un sac x' : m + ' sacs x'} de chaque côté`], op: '− ' + xs(m) });
    k++;
  }
  if (S[X].u) {
    const m = S[X].u;
    if (S[O].u <= m) return null;
    live(X, 'u').forEach(it => { it.rm = k; });
    live(O, 'u').slice(0, m).forEach(it => { it.rm = k; });
    steps.push({ cap: [`On enlève ${m === 1 ? 'une masse' : m + ' masses'} de chaque côté`], op: '− ' + m });
    k++;
  }
  if (S[X].b) {
    const m = S[X].b;
    for (let i = 0; i < m; i++) items.push({ side: X, kind: 'u', add: k, rm: k, late: true });
    for (let i = 0; i < m; i++) items.push({ side: O, kind: 'u', add: k });
    live(X, 'b').forEach(it => { it.rm = k; it.late = true; });
    steps.push({ cap: [`On ajoute ${m === 1 ? 'une masse' : m + ' masses'} de chaque côté :`, m === 1 ? 'la masse annule le ballon' : 'chaque masse annule un ballon'], op: '+ ' + m });
    k++;
  }
  const bags = live(X, 'x'), units = live(O, 'u'), n = bags.length, r = units.length;
  if (n < 1 || r < 1 || r % n) return null;
  const sol = r / n;
  if (n > 1) {
    bags.forEach((it, i) => { it.col = i; it.colAt = k; });
    units.forEach((it, j) => { it.col = Math.floor(j / sol); it.colAt = k; });
    steps.push({ cap: [`On partage chaque plateau en ${n} parts égales :`, `un sac x équilibre ${pl(sol, 'masse')}`], op: '÷ ' + n });
    k++;
  }
  // place : chaque plateau doit tout contenir (objets ajoutés compris)
  for (const side of [0, 1]) {
    const its = items.filter(it => it.side === side);
    if (its.filter(it => it.kind === 'u').length > MAXU) return null;
    if (!layout(its)) return null;
  }
  return { items, steps, sol, X };
}

/** vrai si la balance sait représenter l'équation et la résoudre */
export const canBalance = (L, R) => !!balancePlan(L, R);

/** positions des sacs et masses d'un plateau (rangées de bas en haut, centrées) ; ballons à part */
function layout(its) {
  // De gauche à droite : les sacs qui restent, un bloc de masses (empilées en colonnes), les sacs qu'on retirera.
  // Dans le bloc, les masses qui restent sont en bas et celles qu'on retirera en haut : rien ne flotte jamais.
  if (!its.length) return true;
  const cx = CX[its[0].side], BW = 33, UW = 23;
  const bags = its.filter(it => it.kind === 'x'), kb = bags.filter(it => it.rm === undefined), rb = bags.filter(it => it.rm !== undefined);
  const units = its.filter(it => it.kind === 'u'), U = [...units.filter(it => it.rm === undefined), ...units.filter(it => it.rm !== undefined)];
  bags.forEach(it => { it.w = 30; it.h = 38; });
  U.forEach(it => { it.w = 20; it.h = 20; });
  let top = bags.length ? PY - 38 : PY;
  const free = Math.floor((ROW + 3 - bags.length * BW) / UW);
  if (!U.length || (free >= 1 && Math.ceil(U.length / free) <= 4)) {
    const cols = Math.min(Math.max(free, 1), U.length), rows = U.length ? Math.ceil(U.length / cols) : 0;
    let x = cx - (bags.length * BW + cols * UW - 3) / 2;
    kb.forEach(it => { it.px = x; it.py = PY; x += BW; });
    U.forEach((it, j) => { it.px = x + (j % cols) * UW; it.py = PY - Math.floor(j / cols) * UW; });
    x += cols * UW;
    rb.forEach(it => { it.px = x; it.py = PY; x += BW; });
    if (rows) top = Math.min(top, PY - (rows - 1) * UW - 20);
  } else { // trop de sacs : les sacs en bas, les masses en rangées par-dessus
    let x = cx - (bags.length * BW - 3) / 2;
    [...kb, ...rb].forEach(it => { it.px = x; it.py = PY; x += BW; });
    const cols = 7, rows = Math.ceil(U.length / cols);
    U.forEach((it, j) => {
      const r = Math.floor(j / cols), inRow = Math.min(cols, U.length - r * cols);
      it.px = cx - (inRow * UW - 3) / 2 + (j % cols) * UW; it.py = PY - 41 - r * UW;
    });
    top = PY - 41 - (rows - 1) * UW - 20;
  }
  if (top < 86) return false;
  const bl = its.filter(it => it.kind === 'b');
  bl.forEach((it, i) => { // ballons attachés au bord extérieur du plateau, au-dessus des objets
    const cx = CX[it.side], half = (bl.length - 1) * 10.5 + 11;
    const c0 = Math.max(half + 4, Math.min(W - half - 4, cx + (it.side ? 30 : -30)));
    it.px = c0 + (i - (bl.length - 1) / 2) * 21; it.py = i % 2 ? 58 : 50;
    it.sx = cx + (it.side ? 62 : -62) + (i - (bl.length - 1) / 2) * 5;
  });
  return true;
}

/* ---------- formes ---------- */
const bagShape = (fill, anim = '') =>
  `<path d="M3,0 Q-1,-16 7,-27 L10,-31 L20,-31 L23,-27 Q31,-16 27,0 Z" fill="${fill}" stroke="#5c3a12" stroke-width="1.5">${anim}</path>` +
  `<rect x="9" y="-35" width="12" height="5" rx="2" fill="#5c3a12"/><text x="15" y="-8" text-anchor="middle" font-size="17" font-style="italic" font-weight="700" fill="#fff">x</text>`;
const unitShape = (fill, anim = '') =>
  `<rect x="0" y="-20" width="20" height="20" rx="3" fill="${fill}">${anim}</rect><text x="10" y="-5" text-anchor="middle" font-size="13" font-weight="700" fill="#fff">1</text>`;
const balloonShape = it =>
  `<path d="M${f1(it.px)},${it.py + 15} Q${f1((it.px + it.sx) / 2 + 6)},${(it.py + PY) / 2} ${f1(it.sx)},${PY}" fill="none" stroke="#868e96" stroke-width="1.2"/>` +
  `<ellipse cx="${f1(it.px)}" cy="${it.py}" rx="10" ry="13" fill="#fa5252" stroke="#c92a2a" stroke-width="1.2"/><path d="M${f1(it.px - 3)},${it.py + 16} l3,-4 l3,4 z" fill="#c92a2a"/>` +
  `<text x="${f1(it.px)}" y="${it.py + 4}" text-anchor="middle" font-size="10" font-weight="700" fill="#fff">−1</text>`;

/** cadre : socle, colonne, fléau horizontal (toujours en équilibre), plateaux, aiguille « = » */
function frame(labels) {
  let s = `<rect x="186" y="${PY + 76}" width="108" height="11" rx="5" fill="#868e96"/>` +
    `<rect x="233" y="${PY + 30}" width="14" height="48" fill="#adb5bd"/>` +
    `<rect x="${CX[0]}" y="${PY + 24}" width="${CX[1] - CX[0]}" height="9" rx="4" fill="#495057"/>` +
    `<circle cx="240" cy="${PY + 28}" r="7" fill="#212529"/>`;
  for (const cx of CX) s += `<rect x="${cx - 4}" y="${PY + 6}" width="8" height="20" fill="#495057"/><rect x="${cx - 86}" y="${PY}" width="172" height="8" rx="4" fill="#343a40"/>`;
  s += `<line x1="240" y1="${PY + 24}" x2="240" y2="${PY - 50}" stroke="#495057" stroke-width="3"/>` +
    `<circle cx="240" cy="${PY - 64}" r="15" fill="#ebfbee" stroke="${ACC}" stroke-width="2.5"/><text x="240" y="${PY - 57}" text-anchor="middle" font-size="22" font-weight="700" fill="${ACC}">=</text>`;
  if (labels) labels.forEach((l, i) => { s += `<text x="${CX[i]}" y="${PY + 54}" text-anchor="middle" font-size="18" font-weight="700" fill="#212529">${l}</text>`; });
  return s;
}

/* ---------- animation : valeurs par morceaux ---------- */
function track(pts, D) {
  const P = pts.map(([t, v]) => [Math.max(0, Math.min(D, t)), v]).sort((a, b) => a[0] - b[0]);
  if (P[0][0] > 0) P.unshift([0, P[0][1]]);
  if (P[P.length - 1][0] < D) P.push([D, P[P.length - 1][1]]);
  const kt = P.map(p => (p[0] / D).toFixed(4)); kt[0] = '0'; kt[kt.length - 1] = '1';
  for (let i = 1; i < kt.length; i++) if (+kt[i] < +kt[i - 1]) kt[i] = kt[i - 1];
  return { values: P.map(p => p[1]).join(';'), keyTimes: kt.join(';') };
}
const animA = (attr, pts, D, begin) => { const t = track(pts, D); return `<animate attributeName="${attr}" values="${t.values}" keyTimes="${t.keyTimes}" dur="${f1(D)}s" begin="${begin}" fill="freeze"/>`; };
const animT = (pts, D, begin) => { const t = track(pts, D); return `<animateTransform attributeName="transform" type="translate" values="${t.values}" keyTimes="${t.keyTimes}" dur="${f1(D)}s" begin="${begin}" fill="freeze"/>`; };

const capText = (lines, y0, size = 16) => lines.map((l, i) => `<text x="${W / 2}" y="${y0 + i * 21}" text-anchor="middle" font-size="${size}" font-weight="700" fill="${ACC}">${l}</text>`).join('');

/**
 * Balance. L, R = {x, u, b}. o = { labels: [gauche, droite], anim: bool, label: texte pour l'accessibilité }.
 * Sans animation : l'état de départ. Avec animation : la résolution pas à pas (si balancePlan la sait faire).
 */
export function balance(L, R, o = {}) {
  const plan = balancePlan(L, R);
  const id = 'eqb' + (++uid);
  const aria = o.label || 'Balance en équilibre';
  // sans animation ni ballon, on recadre sur la balance (pas de place perdue au-dessus ni de légende en dessous)
  const tight = !o.anim && plan && !plan.items.some(it => it.kind === 'b');
  const top = tight ? Math.min(PY - 90, ...plan.items.map(it => it.py - (it.h || 0) - 8)) : 0, hh = tight ? PY + 92 - top : H;
  let s = `<svg viewBox="0 ${top} ${W} ${hh}" class="vis eqbal" style="width:100%;max-width:${tight ? 520 : 560}px" role="img" aria-label="${aria}" font-family="system-ui,sans-serif">`;
  s += frame(o.labels);
  if (!plan) return s + '</svg>';
  const items = plan.items;
  if (!o.anim) { // état de départ, fixe
    items.filter(it => it.add === undefined).forEach(it => { s += drawStatic(it, false); });
    return s + '</svg>';
  }
  const ST = 3.6, T0 = 2.2, n = plan.steps.length, Tf = T0 + n * ST, D = Tf + 0.6;
  const begin = `0.4s;${id}.click`;
  const Tk = k => T0 + k * ST;
  s += `<style>.eqb-s{display:none}@media (prefers-reduced-motion: reduce){.eqb-a{display:none}.eqb-s{display:inline}}</style>`;
  // --- version animée
  let a = '<g class="eqb-a">';
  for (const it of items) {
    const op = [], tr = [];
    const up = it.kind === 'b' ? '0 -50' : '0 -34';
    if (it.add !== undefined) { const t = Tk(it.add); op.push([0, 0], [t + 0.5, 0], [t + 1.2, 1]); tr.push([0, '0 -30'], [t + 0.5, '0 -30'], [t + 1.2, '0 0']); }
    if (it.rm !== undefined) {
      const t = Tk(it.rm) + (it.late ? 1.9 : 1.1);
      if (!op.length) op.push([0, 1]); if (!tr.length) tr.push([0, '0 0']);
      op.push([t, 1], [t + 1.1, 0]); tr.push([t, '0 0'], [t + 1.1, up]);
    }
    let inner = '';
    if (op.length) inner += animA('opacity', op, D, begin);
    if (tr.length) inner += animT(tr, D, begin);
    let fillAnim = '';
    if (it.col !== undefined) { const t = Tk(it.colAt) + 1.0, base = it.kind === 'x' ? BAG : UNIT; fillAnim = animA('fill', [[0, base], [t, base], [t + 0.6, COLORS[it.col % COLORS.length]]], D, begin); }
    const shape = it.kind === 'x' ? bagShape(BAG, fillAnim) : it.kind === 'u' ? unitShape(UNIT, fillAnim) : balloonShape(it);
    const pos = it.kind === 'b' ? '' : ` transform="translate(${f1(it.px)},${it.py})"`;
    a += `<g${pos}><g${it.add !== undefined ? ' opacity="0"' : ''}>${inner}${shape}</g></g>`;
  }
  // légendes : départ, une par étape, conclusion
  const caps = [{ cap: [o.start || 'La balance est en équilibre'] }, ...plan.steps, { cap: [`Donc x = ${M(plan.sol)}`], fin: true }];
  caps.forEach((c, k) => {
    const t0 = k ? Tk(k - 1) : 0, t1 = k < caps.length - 1 ? Tk(k) : D;
    const pts = k ? [[0, 0], [t0, 0], [t0 + 0.3, 1]] : [[0, 1]];
    if (k < caps.length - 1) pts.push([t1 - 0.25, 1], [t1, 0]);
    a += `<g opacity="${k ? 0 : 1}">${animA('opacity', pts, D, begin)}${capText(c.cap, c.cap.length > 1 ? 290 : 302, c.fin ? 22 : 16)}</g>`;
    if (c.op) for (const cx of CX) a += `<g opacity="0">${animA('opacity', [[0, 0], [t0 + 0.2, 0], [t0 + 0.5, 1], [t1 - 0.25, 1], [t1, 0]], D, begin)}<rect x="${cx - 34}" y="6" width="68" height="28" rx="14" fill="#fff4e6" stroke="#e8590c" stroke-width="2"/><text x="${cx}" y="27" text-anchor="middle" font-size="19" font-weight="700" fill="#d9480f">${c.op}</text></g>`;
  });
  a += `<g id="${id}" style="cursor:pointer" role="button" aria-label="Revoir l'animation"><rect x="197" y="44" width="86" height="30" rx="15" fill="#ebfbee" stroke="${ACC}" stroke-width="1.5"/><text x="240" y="64" text-anchor="middle" font-size="14" font-weight="700" fill="${ACC}">↻ Revoir</text></g>`;
  a += '</g>';
  // --- version fixe (moins d'animations) : état final, objets retirés en pointillés
  let st = '<g class="eqb-s">';
  for (const it of items) st += drawStatic(it, true);
  const ops = plan.steps.map(p => p.op).join(' puis ');
  st += capText([`${ops} des deux côtés :`, `x = ${M(plan.sol)}`], 290, 17);
  st += '</g>';
  return s + a + st + '</svg>';
}

/** objet dessiné fixe ; final = état après résolution (retirés estompés, groupes colorés) */
function drawStatic(it, final) {
  const gone = final && it.rm !== undefined;
  const col = final && it.col !== undefined ? COLORS[it.col % COLORS.length] : null;
  const shape = it.kind === 'x' ? bagShape(col || BAG) : it.kind === 'u' ? unitShape(col || UNIT) : balloonShape(it);
  const pos = it.kind === 'b' ? '' : ` transform="translate(${f1(it.px)},${it.py})"`;
  return `<g${pos}${gone ? ' opacity=".18"' : ''}>${shape}</g>`;
}

/**
 * Étapes alignées sur « = ». rows : {l, r} (une ligne d'équation), {op: [gauche, droite], why} (ce qu'on fait des
 * deux côtés), {t} (une ligne de texte centrée).
 */
export function steps(rows) {
  const td = 'padding:3px 8px;white-space:nowrap';
  let s = `<div class="eqsteps" style="overflow-x:auto;max-width:100%"><table role="presentation" style="margin:8px auto;border-collapse:collapse;font-size:1.15em;line-height:1.45">`;
  for (const r of rows) {
    if (r.t !== undefined) s += `<tr><td colspan="4" style="${td};text-align:center">${r.t}</td></tr>`;
    else if (r.op) s += `<tr style="color:#d9480f;font-weight:700;font-size:.82em"><td style="${td};text-align:right">${r.op[0]}</td><td></td><td style="${td};text-align:left">${r.op[1]}</td><td style="${td};color:#868e96;font-weight:400;font-size:.9em;white-space:normal">${r.why || ''}</td></tr>`;
    else s += `<tr><td style="${td};text-align:right">${r.l}</td><td style="padding:3px 2px">=</td><td style="${td};text-align:left">${r.r}</td><td></td></tr>`;
  }
  return s + '</table></div>';
}

/** rectangle légendé (problèmes de périmètre) */
export function rect(wl, ll) {
  return `<svg viewBox="0 0 320 170" class="vis" style="width:320px" role="img" aria-label="rectangle de largeur ${wl} et de longueur ${ll}" font-family="system-ui,sans-serif">` +
    `<rect x="60" y="30" width="200" height="100" fill="#ebfbee" stroke="${ACC}" stroke-width="3"/>` +
    `<text x="160" y="152" text-anchor="middle" font-size="18" font-weight="700">${ll}</text>` +
    `<text x="48" y="86" text-anchor="end" font-size="18" font-weight="700">${wl}</text></svg>`;
}

/**
 * Parabole y = (x − h)² et droite y = A : les solutions de (x − h)² = A sont les abscisses des points communs.
 * Seuls les nombres utiles sont écrits (solutions sur l'axe des x) pour rester lisible.
 */
export function sqGraph(h, A, roots, curveLabel) {
  const Wg = 440, Hg = 270, pad = 30;
  const n = A > 0 ? Math.sqrt(A) : 0, span = Math.max(3, n + 2.5);
  const xmin = h - span, xmax = h + span, ymax = Math.max(4, A) * 1.35 + 1, ymin = Math.min(-1.5, A - 2);
  const X = x => pad + (x - xmin) / (xmax - xmin) * (Wg - 2 * pad), Y = y => Hg - pad - (y - ymin) / (ymax - ymin) * (Hg - 2 * pad);
  const cl = 'sqg' + (++uid);
  let s = `<svg viewBox="0 0 ${Wg} ${Hg}" class="vis" style="width:100%;max-width:${Wg}px" role="img" aria-label="parabole ${curveLabel} et droite y = ${M(A)}" font-family="system-ui,sans-serif">` +
    `<defs><clipPath id="${cl}"><rect x="${pad}" y="${pad - 10}" width="${Wg - 2 * pad}" height="${Hg - 2 * pad + 10}"/></clipPath></defs>`;
  const y0 = Y(0), xa = xmin <= 0 && xmax >= 0 ? X(0) : pad;
  s += `<line x1="${pad - 6}" y1="${f1(y0)}" x2="${Wg - pad + 10}" y2="${f1(y0)}" stroke="#333" stroke-width="1.5"/><path d="M${Wg - pad + 14},${f1(y0)} l-9,-4 v8z" fill="#333"/>`;
  s += `<line x1="${f1(xa)}" y1="${Hg - pad + 6}" x2="${f1(xa)}" y2="${pad - 14}" stroke="#333" stroke-width="1.5"/><path d="M${f1(xa)},${pad - 18} l-4,9 h8z" fill="#333"/>`;
  s += `<text x="${Wg - pad + 8}" y="${f1(y0 + 18)}" font-size="13" fill="#555">x</text><text x="${f1(xa + 8)}" y="${pad - 6}" font-size="13" fill="#555">y</text>`;
  let d = '';
  for (let i = 0; i <= 200; i++) { const x = xmin + (xmax - xmin) * i / 200; d += (i ? 'L' : 'M') + f1(X(x)) + ',' + f1(Math.max(-500, Y((x - h) * (x - h)))); }
  s += `<path d="${d}" fill="none" stroke="${ACC}" stroke-width="3" clip-path="url(#${cl})"/>`;
  s += `<text x="${pad + 6}" y="${pad + 4}" font-size="14" font-weight="700" fill="${ACC}">${curveLabel}</text>`;
  s += `<line x1="${pad}" y1="${f1(Y(A))}" x2="${Wg - pad}" y2="${f1(Y(A))}" stroke="#e8590c" stroke-width="2" stroke-dasharray="7 5"/>`;
  s += `<text x="${Wg - pad}" y="${f1(Y(A) - 7)}" text-anchor="end" font-size="14" font-weight="700" fill="#e8590c">y = ${M(A)}</text>`;
  for (const r of roots) {
    s += `<line x1="${f1(X(r))}" y1="${f1(Y(A))}" x2="${f1(X(r))}" y2="${f1(y0)}" stroke="${ACC}" stroke-width="1.5" stroke-dasharray="4 4"/>` +
      `<circle cx="${f1(X(r))}" cy="${f1(Y(A))}" r="6" fill="${ACC}"/>` +
      `<text x="${f1(X(r))}" y="${f1(y0 + 20)}" text-anchor="middle" font-size="15" font-weight="700" fill="${ACC}">${M(r)}</text>`;
  }
  if (!roots.length) s += `<text x="${Wg / 2}" y="${Hg - 6}" text-anchor="middle" font-size="14" font-weight="700" fill="#c92a2a">aucun point commun : aucune solution</text>`;
  return s + '</svg>';
}

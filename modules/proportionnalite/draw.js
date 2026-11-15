// Dessins du module Proportionnalité et pourcentages (chaînes HTML / SVG, sans DOM).
import { M } from '../../engine/util/fmt.js';

const C = '#a14d00', BLUE = '#1971c2', GREEN = '#2b8a3e', GREY = '#666';
const f1 = v => (isFinite(v) ? (+v).toFixed(1) : '0');
let uid = 0;

/** cellule : nombre → écriture française, chaîne → telle quelle */
const cell = v => (typeof v === 'number' ? M(v) : v);

/**
 * Tableau à deux lignes (HTML, classe data).
 * labels = [titre ligne 1, titre ligne 2] (null : pas de titres) ; top, bot = cellules ; o.coef = texte de la flèche (« × 3 »).
 */
export function tab(labels, top, bot, o = {}) {
  const arrow = o.coef ? `<td rowspan="2" class="coefcell" style="border:none;min-width:0;padding:0 0 0 6px;color:${C};font-weight:700;white-space:nowrap"><svg viewBox="0 0 30 70" width="22" height="56" aria-hidden="true" style="vertical-align:middle"><path d="M6 10 C 26 16, 26 54, 6 60" fill="none" stroke="${C}" stroke-width="3"/><path d="M6 60 l9 -1 l-5 -7 z" fill="${C}"/></svg>${o.coef}</td>` : '';
  const row = (l, cs, first) => `<tr>${labels ? `<th scope="row">${l}</th>` : ''}${cs.map(cell).map(c => `<td>${c}</td>`).join('')}${first ? arrow : ''}</tr>`;
  return `<div class="tablewrap" style="overflow-x:auto;max-width:100%"><table class="data prop">${row(labels && labels[0], top, true)}${row(labels && labels[1], bot, false)}</table></div>`;
}

/** pas de graduation « ronds » */
export function niceStep(span, n = 10) {
  const raw = span / n, p = 10 ** Math.floor(Math.log10(raw));
  for (const m of [1, 2, 5, 10]) if (m * p >= raw - 1e-9) return m * p;
  return 10 * p;
}

/**
 * Repère (premier quadrant) avec titres des axes.
 * o.xr = [0, xmax], o.yr = [0, ymax], o.xs, o.ys = pas des graduations, o.xt, o.yt = titres des axes,
 * o.fs = [{f, c}] courbes, o.pts = [{x, y, l}], o.guides = [{x, y}] pointillés vers les axes.
 */
export function graph(o) {
  const W = 480, H = 330, L = 50, R = 20, T = 34, B = 46;
  const [x0, x1] = o.xr, [y0, y1] = o.yr;
  const X = x => L + (x - x0) * (W - L - R) / (x1 - x0), Y = y => H - B - (y - y0) * (H - T - B) / (y1 - y0);
  const cl = `pcl${++uid}`;
  let s = `<svg viewBox="0 0 ${W} ${H}" class="vis plot" role="img" aria-label="graphique" font-family="system-ui,sans-serif" style="width:480px"><defs><clipPath id="${cl}"><rect x="${L}" y="${T}" width="${W - L - R}" height="${H - T - B}"/></clipPath></defs>`;
  for (let x = x0; x <= x1 + 1e-9; x += o.xs) s += `<line x1="${f1(X(x))}" y1="${T}" x2="${f1(X(x))}" y2="${H - B}" stroke="#e7e3da"/>`;
  for (let y = y0; y <= y1 + 1e-9; y += o.ys) s += `<line x1="${L}" y1="${f1(Y(y))}" x2="${W - R}" y2="${f1(Y(y))}" stroke="#e7e3da"/>`;
  s += `<line x1="${L}" y1="${H - B}" x2="${W - R + 8}" y2="${H - B}" stroke="#333" stroke-width="1.6"/><path d="M${W - R + 12} ${H - B} l-8 -4 v8 z" fill="#333"/>`;
  s += `<line x1="${L}" y1="${H - B}" x2="${L}" y2="${T - 10}" stroke="#333" stroke-width="1.6"/><path d="M${L} ${T - 14} l-4 8 h8 z" fill="#333"/>`;
  for (let x = x0; x <= x1 + 1e-9; x += o.xs) s += `<text x="${f1(X(x))}" y="${H - B + 16}" font-size="12" text-anchor="middle" fill="${GREY}">${M(+x.toFixed(6))}</text>`;
  for (let y = y0 + o.ys; y <= y1 + 1e-9; y += o.ys) s += `<text x="${L - 5}" y="${f1(Y(y) + 4)}" font-size="12" text-anchor="end" fill="${GREY}">${M(+y.toFixed(6))}</text>`;
  if (o.xt) s += `<text x="${W - R}" y="${H - 8}" font-size="13" text-anchor="end" fill="#333" font-weight="600">${o.xt}</text>`;
  if (o.yt) s += `<text x="${L + 8}" y="${T - 14}" font-size="13" fill="#333" font-weight="600">${o.yt}</text>`;
  (o.guides || []).forEach(g => {
    s += `<path d="M${f1(X(g.x))} ${H - B} V${f1(Y(g.y))} H${L}" fill="none" stroke="${BLUE}" stroke-width="2" stroke-dasharray="6 5"/>`;
  });
  (o.fs || []).forEach(F => {
    let d = ''; for (let i = 0; i <= 120; i++) { const x = x0 + (x1 - x0) * i / 120; d += (i ? 'L' : 'M') + f1(X(x)) + ',' + f1(Y(F.f(x))); }
    s += `<path d="${d}" fill="none" stroke="${F.c || C}" stroke-width="3" clip-path="url(#${cl})"/>`;
  });
  (o.pts || []).forEach(p => {
    s += `<circle cx="${f1(X(p.x))}" cy="${f1(Y(p.y))}" r="5.5" fill="${p.c || BLUE}"/>`;
    if (p.l) s += `<text x="${f1(X(p.x) - 9)}" y="${f1(Y(p.y) - 7)}" font-size="15" font-weight="700" text-anchor="end" fill="${p.c || BLUE}">${p.l}</text>`;
  });
  return s + '</svg>';
}

/**
 * Plan ou carte à l'échelle 1/s. o.kind = 'maison' | 'carte' ; o.lab = texte de la longueur mesurée
 * (« 4,5 cm » ou « ? ») ; o.real = texte de la longueur réelle (facultatif).
 */
export function plan(o) {
  const W = 460, H = 250;
  let s = `<svg viewBox="0 0 ${W} ${H}" class="vis" role="img" aria-label="${o.kind === 'maison' ? 'plan' : 'carte'} à l'échelle" font-family="system-ui,sans-serif" style="width:460px">`;
  if (o.kind === 'maison') {
    s += `<rect x="40" y="40" width="380" height="170" fill="#fffaf2" stroke="#333" stroke-width="5"/>`;
    s += `<line x1="250" y1="40" x2="250" y2="130" stroke="#333" stroke-width="4"/><line x1="250" y1="170" x2="250" y2="210" stroke="#333" stroke-width="4"/>`;
    s += `<path d="M250 130 A40 40 0 0 1 290 170" fill="none" stroke="#999" stroke-width="1.5" stroke-dasharray="4 3"/><line x1="250" y1="130" x2="290" y2="130" stroke="#999" stroke-width="1.5"/>`;
    s += `<text x="145" y="135" font-size="15" text-anchor="middle" fill="${GREY}">salon</text><text x="335" y="100" font-size="15" text-anchor="middle" fill="${GREY}">chambre</text>`;
    s += `<line x1="40" y1="22" x2="250" y2="22" stroke="${C}" stroke-width="2.5"/><path d="M40 22 l10 -5 v10 z M250 22 l-10 -5 v10 z" fill="${C}"/>`;
    s += `<rect x="115" y="8" width="60" height="26" rx="6" fill="#fff"/><text x="145" y="27" font-size="17" font-weight="700" text-anchor="middle" fill="${C}">${o.lab}</text>`;
  } else {
    s += `<rect x="10" y="10" width="440" height="200" rx="10" fill="#eef7e8" stroke="#b2d3a1"/>`;
    s += `<path d="M10 150 C 120 120, 200 200, 300 160 S 420 110, 450 130" fill="none" stroke="#74c0fc" stroke-width="9"/>`;
    s += `<path d="M60 190 C 140 170, 180 60, 260 80 S 380 70, 410 50" fill="none" stroke="#d9cbb0" stroke-width="5"/>`;
    s += `<line x1="70" y1="70" x2="390" y2="70" stroke="${C}" stroke-width="2.5" stroke-dasharray="8 5"/>`;
    s += `<circle cx="70" cy="70" r="8" fill="#333"/><circle cx="390" cy="70" r="8" fill="#333"/><text x="70" y="100" font-size="16" font-weight="700" text-anchor="middle">A</text><text x="390" y="100" font-size="16" font-weight="700" text-anchor="middle">B</text>`;
    s += `<rect x="190" y="40" width="80" height="26" rx="6" fill="#fff"/><text x="230" y="59" font-size="17" font-weight="700" text-anchor="middle" fill="${C}">${o.lab}</text>`;
  }
  s += `<text x="${W - 10}" y="${H - 10}" font-size="16" font-weight="700" text-anchor="end" fill="#333">Échelle ${o.scale}</text>`;
  if (o.real) s += `<text x="10" y="${H - 10}" font-size="15" fill="${BLUE}" font-weight="700">en vrai : ${o.real}</text>`;
  return s + '</svg>';
}

/**
 * Barre de pourcentage : t % colorié, graduations 0 / 25 / 50 / 75 / 100 %.
 * o.total = texte sous 100 % ; o.part = texte sous la partie coloriée ; o.label = texte au-dessus.
 */
export function pctBar(t, o = {}) {
  const W = 480, H = 136, x0 = 24, x1 = 456, y = 40, h = 36, xt = x0 + (x1 - x0) * Math.min(t, 100) / 100;
  const lab = o.label || M(t) + ' %', long = lab.length > 9;
  let s = `<svg viewBox="0 0 ${W} ${H}" class="vis" role="img" aria-label="barre de pourcentage" font-family="system-ui,sans-serif" style="width:480px">`;
  s += `<rect x="${x0}" y="${y}" width="${x1 - x0}" height="${h}" rx="4" fill="#f1efe9" stroke="#999"/>`;
  s += `<rect x="${x0}" y="${y}" width="${f1(xt - x0)}" height="${h}" rx="4" fill="${C}" opacity=".8"/>`;
  [0, 25, 50, 75, 100].forEach(p => { const x = x0 + (x1 - x0) * p / 100; s += `<line x1="${x}" y1="${y + h}" x2="${x}" y2="${y + h + 6}" stroke="#666"/><text x="${x}" y="${y + h + 20}" font-size="13" text-anchor="middle" fill="${GREY}">${p} %</text>`; });
  s += long ? `<text x="${x0}" y="${y - 12}" font-size="17" font-weight="700" fill="${C}">${lab}</text>`
    : `<text x="${f1(Math.max(x0 + 30, Math.min(x1 - 30, (x0 + xt) / 2)))}" y="${y - 12}" font-size="17" font-weight="700" text-anchor="middle" fill="${C}">${lab}</text>`;
  if (o.part) s += `<text x="${f1(Math.max(x0 + 24, Math.min(x1 - 170, (x0 + xt) / 2)))}" y="${H - 8}" font-size="17" font-weight="700" text-anchor="middle" fill="${C}">${o.part}</text>`;
  if (o.total) s += `<text x="${x1}" y="${H - 8}" font-size="17" font-weight="700" text-anchor="end" fill="#333">${o.total}</text>`;
  return s + '</svg>';
}

/** n cases dont k coloriées (n ≤ 50), par lignes de 10 */
export function cells(k, n) {
  const per = n <= 10 ? n : n === 25 ? 5 : 10, rows = Math.ceil(n / per), c = 30, W = per * c + 4, H = rows * c + 4;
  let s = `<svg viewBox="0 0 ${W} ${H}" class="vis" role="img" aria-label="${k} cases coloriées sur ${n}" style="width:${Math.min(W, 340)}px">`;
  for (let i = 0; i < n; i++) s += `<rect x="${2 + (i % per) * c}" y="${2 + Math.floor(i / per) * c}" width="${c - 3}" height="${c - 3}" rx="4" fill="${i < k ? C : '#f1efe9'}" stroke="#999"/>`;
  return s + '</svg>';
}

/**
 * Évolution en % : barre « avant » (100 %) et barre « après » (100 % ± t %).
 * o.before, o.after = textes (prix) ; up = hausse ? ; o.hide = cacher le pourcentage.
 */
export function evoBars(t, up, o = {}) {
  const W = 480, H = 132, x0 = 70, base = Math.min(280, 300 / (1 + (up ? t : 0) / 100)), after = base * (1 + (up ? t : -t) / 100);
  let s = `<svg viewBox="0 0 ${W} ${H}" class="vis" role="img" aria-label="${up ? 'hausse' : 'baisse'} de ${o.hide ? '?' : t} %" font-family="system-ui,sans-serif" style="width:480px">`;
  s += `<text x="${x0 - 8}" y="44" font-size="16" text-anchor="end" fill="#333">avant</text><rect x="${x0}" y="22" width="${f1(base)}" height="32" rx="4" fill="${BLUE}" opacity=".8"/><text x="${f1(x0 + base / 2)}" y="44" font-size="15" font-weight="700" text-anchor="middle" fill="#fff">100 %</text>`;
  s += `<text x="${f1(x0 + base + 8)}" y="44" font-size="17" font-weight="700" fill="${BLUE}">${o.before || ''}</text>`;
  s += `<text x="${x0 - 8}" y="110" font-size="16" text-anchor="end" fill="#333">après</text><rect x="${x0}" y="88" width="${f1(Math.min(base, after))}" height="32" rx="4" fill="${C}" opacity=".85"/>`;
  if (up) s += `<rect x="${f1(x0 + base)}" y="88" width="${f1(after - base)}" height="32" fill="${GREEN}" opacity=".8"/><text x="${f1(x0 + base + (after - base) / 2)}" y="82" font-size="14" font-weight="700" text-anchor="middle" fill="${GREEN}">${o.hide ? '?' : '+ ' + M(t) + ' %'}</text>`;
  else s += `<rect x="${f1(x0 + after)}" y="88" width="${f1(base - after)}" height="32" fill="none" stroke="#c92a2a" stroke-width="2" stroke-dasharray="5 4"/><text x="${f1(x0 + after + (base - after) / 2)}" y="82" font-size="14" font-weight="700" text-anchor="middle" fill="#c92a2a">${o.hide ? '?' : '− ' + M(t) + ' %'}</text>`;
  if (!o.hide && Math.min(base, after) > 50) s += `<text x="${f1(x0 + Math.min(base, after) / 2)}" y="110" font-size="15" font-weight="700" text-anchor="middle" fill="#fff">${M(+(100 + (up ? t : -t)).toFixed(6))} %</text>`;
  s += `<text x="${f1(x0 + Math.max(base, after) + 8)}" y="110" font-size="17" font-weight="700" fill="${C}">${o.after || ''}</text>`;
  return s + '</svg>';
}

/** trajet de A à B : o.d, o.t, o.v = textes (distance, durée, vitesse) */
export function road(o) {
  const W = 460, H = 150;
  let s = `<svg viewBox="0 0 ${W} ${H}" class="vis" role="img" aria-label="trajet" font-family="system-ui,sans-serif" style="width:460px">`;
  s += `<rect x="30" y="70" width="400" height="26" rx="6" fill="#868e96"/><line x1="40" y1="83" x2="420" y2="83" stroke="#fff" stroke-width="3" stroke-dasharray="14 10"/>`;
  s += `<path d="M30 70 v-40 l26 9 l-26 9" fill="${C}"/><path d="M430 70 v-40 l26 9 l-26 9" fill="${GREEN}"/><text x="30" y="20" font-size="15" font-weight="700">A</text><text x="430" y="20" font-size="15" font-weight="700">B</text>`;
  s += `<g transform="translate(80 52)"><rect x="0" y="6" width="54" height="16" rx="5" fill="${BLUE}"/><path d="M10 6 l8 -10 h20 l8 10 z" fill="${BLUE}"/><circle cx="12" cy="24" r="6" fill="#222"/><circle cx="42" cy="24" r="6" fill="#222"/></g>`;
  s += `<line x1="30" y1="112" x2="430" y2="112" stroke="${C}" stroke-width="2"/><path d="M30 112 l9 -5 v10 z M430 112 l-9 -5 v10 z" fill="${C}"/>`;
  s += `<text x="230" y="134" font-size="16" font-weight="700" text-anchor="middle" fill="${C}">distance : ${o.d}</text>`;
  s += `<text x="230" y="30" font-size="15" font-weight="700" text-anchor="middle" fill="#333">durée : ${o.t} &#160; · &#160; vitesse : ${o.v}</text>`;
  return s + '</svg>';
}

/** produit en croix : tableau 2 × 2 avec les deux diagonales colorées */
export function cross(a, b, c, d) {
  const W = 300, H = 150, x0 = 50, w = 100, h = 50, y0 = 25;
  let s = `<svg viewBox="0 0 ${W} ${H}" class="vis" role="img" aria-label="produit en croix" font-family="system-ui,sans-serif" style="width:300px">`;
  s += `<rect x="${x0}" y="${y0}" width="${2 * w}" height="${2 * h}" fill="#fff" stroke="#555" stroke-width="2"/><line x1="${x0 + w}" y1="${y0}" x2="${x0 + w}" y2="${y0 + 2 * h}" stroke="#555" stroke-width="2"/><line x1="${x0}" y1="${y0 + h}" x2="${x0 + 2 * w}" y2="${y0 + h}" stroke="#555" stroke-width="2"/>`;
  s += `<line x1="${x0 + 30}" y1="${y0 + 18}" x2="${x0 + w + 70}" y2="${y0 + h + 32}" stroke="${BLUE}" stroke-width="4" opacity=".55"/><line x1="${x0 + w + 70}" y1="${y0 + 18}" x2="${x0 + 30}" y2="${y0 + h + 32}" stroke="${C}" stroke-width="4" opacity=".55"/>`;
  const txt = v => (typeof v === 'number' ? M(v) : String(v).replace(/<i>(.*?)<\/i>/g, '<tspan font-style="italic">$1</tspan>'));
  [[a, 0, 0], [c, 1, 0], [b, 0, 1], [d, 1, 1]].forEach(([v, i, j]) => { s += `<text x="${x0 + w * i + w / 2}" y="${y0 + h * j + 33}" font-size="22" font-weight="700" text-anchor="middle" stroke="#fff" stroke-width="6" paint-order="stroke">${txt(v)}</text>`; });
  return s + '</svg>';
}

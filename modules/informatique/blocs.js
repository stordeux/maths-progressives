// Dessin SVG des programmes en blocs (style original : briques arrondies, une couleur par catégorie),
// de la grille du lutin et des figures tracées par la tortue.
import { M } from '../../engine/util/fmt.js';
import { tx, lignes, estComp } from './lang.js';

const FS = 16;
/** couleur du fond, de l'ombre et de l'encre par catégorie de bloc */
const CAT = {
  mouv: { f: '#1d5fd0', s: '#0f3f94', ink: '#fff' },
  vari: { f: '#c2410c', s: '#7c2a08', ink: '#fff' },
  calc: { f: '#1a7f43', s: '#0f4f29', ink: '#fff' },
  ctrl: { f: '#f2b52e', s: '#a87400', ink: '#2b1d00' },
  sort: { f: '#a21caf', s: '#6b1073', ink: '#fff' },
  entr: { f: '#6d28d9', s: '#431a8a', ink: '#fff' },
};
const CAT_DE = { av: 'mouv', tn: 'mouv', rot: 'mouv', set: 'vari', add: 'vari', op: 'calc', dire: 'sort', in: 'entr', rep: 'ctrl', jus: 'ctrl', si: 'ctrl' };
const DARK = '#1f2937';
const esc = s => s.replace(/&(?!lt;|gt;|amp;)/g, '&amp;');

/* ---------- mesure du texte (estimation ; textLength force la largeur exacte) ---------- */
function tw(s) {
  let w = 0;
  for (const c of s.replace(/&lt;|&gt;|&amp;/g, '<')) {
    if ('ilj.,;:\'!|()[]tfr'.includes(c)) w += 0.32;
    else if (c === ' ') w += 0.3;
    else if ('mwMW'.includes(c)) w += 0.92;
    else if (c >= '0' && c <= '9') w += 0.6;
    else if (c >= 'A' && c <= 'Z') w += 0.68;
    else if ('+−×÷=<>≤≥≠'.includes(c)) w += 0.7;
    else if ('«»'.includes(c)) w += 0.5;
    else if (c === '°') w += 0.42;
    else w += 0.56;
  }
  return w * FS;
}

/* ---------- éléments : { w, h, draw(x, cy) } ---------- */
const text = (s, ink = '#fff', cls = '') => {
  const w = Math.ceil(tw(s));
  return { w, h: 20, draw: (x, cy) => `<text x="${x}" y="${(cy + 5.6).toFixed(1)}" font-size="${FS}" font-weight="600" fill="${ink}" textLength="${w}" lengthAdjust="spacingAndGlyphs"${cls}>${esc(s)}</text>` };
};
/** flèche circulaire : cw = tourner à droite (sens des aiguilles d'une montre) */
const icone = (cw, ink = '#fff') => ({
  w: 20, h: 20,
  draw: (x, cy) => {
    const r = 6.5, p = a => [r * Math.cos(a * Math.PI / 180), -r * Math.sin(a * Math.PI / 180)];
    const [x1, y1] = p(45), [x2, y2] = p(-30);
    const head = `${(x1 + 5.5).toFixed(1)},${(y1 + 1).toFixed(1)} ${(x1 - 2).toFixed(1)},${(y1 - 5.5).toFixed(1)} ${(x1 - 3.5).toFixed(1)},${(y1 + 3.5).toFixed(1)}`;
    return `<g transform="translate(${x + 10} ${cy})${cw ? '' : ' scale(-1 1)'}"><path d="M${x1.toFixed(1)} ${y1.toFixed(1)} A${r} ${r} 0 1 0 ${x2.toFixed(1)} ${y2.toFixed(1)}" fill="none" stroke="${ink}" stroke-width="2.4" stroke-linecap="round"/><polygon points="${head}" fill="${ink}"/></g>`;
  },
});
const GAP = 7;
const seq = items => {
  const w = items.reduce((s, it) => s + it.w, 0) + GAP * (items.length - 1), h = Math.max(...items.map(it => it.h));
  return { w, h, draw: (x, cy) => { let s = ''; for (const it of items) { s += it.draw(x, cy); x += it.w + GAP; } return s; } };
};
const pill = (inner, fill = '#fff', stroke = 'rgba(0,0,0,.35)', padX = 9) => {
  const h = Math.max(inner.h + 6, 25), w = inner.w + 2 * padX;
  return { w, h, draw: (x, cy) => `<rect x="${x}" y="${(cy - h / 2).toFixed(1)}" width="${w}" height="${h}" rx="${h / 2}" fill="${fill}" stroke="${stroke}" stroke-width="1.2"/>${inner.draw(x + padX, cy)}` };
};
const hexa = (inner, fill = '#fff') => {
  const h = Math.max(inner.h + 8, 31), w = inner.w + h;
  return {
    w, h, draw: (x, cy) => {
      const t = cy - h / 2, k = h / 2;
      return `<polygon points="${x},${cy} ${x + k},${t} ${x + w - k},${t} ${x + w},${cy} ${x + w - k},${t + h} ${x + k},${t + h}" fill="${fill}" stroke="rgba(0,0,0,.4)" stroke-width="1.2"/>${inner.draw(x + k, cy)}`;
    },
  };
};
const varPill = v => pill(text(v, '#7c2d12'), '#ffe8d1', '#c2410c', 8);

/** expression ou condition → élément ; dep : profondeur d'emboîtement */
function slot(e, dep = 0) {
  if (typeof e === 'number') return dep === 0 ? pill(text(M(e), DARK)) : text(M(e), DARK);
  if (typeof e === 'string') return varPill(e);
  if (e.txt === '?') return pill(text('?', '#b91c1c'));
  if (e.txt !== undefined) return pill(text(`« ${e.txt} »`, DARK));
  if (e.o === 'non') return hexa(seq([text('non', DARK), slot(e.a, dep + 1)]), dep % 2 ? '#fff' : '#eef2f7');
  if (e.o === 'et' || e.o === 'ou') return hexa(seq([slot(e.a, dep + 1), text(e.o, DARK), slot(e.b, dep + 1)]), dep % 2 ? '#fff' : '#eef2f7');
  if (estComp(e)) return hexa(seq([slot(e.a, dep + 1), text(e.o === '<' ? '<' : e.o === '>' ? '>' : e.o, DARK), slot(e.b, dep + 1)]), dep % 2 ? '#fff' : '#eef2f7');
  const fill = dep % 2 ? '#fff' : '#eef2f7';
  if (e.o === 'mod') return pill(seq([text('reste de', DARK), slot(e.a, dep + 1), text('÷', DARK), slot(e.b, dep + 1)]), fill);
  return pill(seq([slot(e.a, dep + 1), text(e.o, DARK), slot(e.b, dep + 1)]), fill);
}
const hexTop = c => { const x = slot(c, 1); return x; };

/** contenu de l'en-tête d'un bloc */
function entete(b, ink) {
  const T = s => text(s, ink);
  switch (b.t) {
    case 'av': return seq([T('avancer de'), slot(b.n, 0), T(b.n === 1 ? 'case' : 'cases')]);
    case 'tn': return b.s === 'D' ? seq([T('tourner à droite'), icone(true, ink)]) : seq([T('tourner à gauche'), icone(false, ink)]);
    case 'rot': return seq([T('tourner'), icone(true, ink), T('de'), slot(b.a, 0), T('°')]);
    case 'in': return b.v === 'nombre' ? seq([T('Entrée : le nombre ='), slot(b.val ?? { txt: '?' }, 0)]) : seq([T('Entrée :'), varPill(b.v), T('='), slot(b.val ?? { txt: '?' }, 0)]);
    case 'set': return seq([T('mettre'), varPill(b.v), T('à'), slot(b.e, 0)]);
    case 'add': return seq([T('ajouter'), slot(b.e, 0), T('à'), varPill(b.v)]);
    case 'op': return seq([T(b.o === '+' ? 'ajouter' : b.o === '−' ? 'soustraire' : b.o === '×' ? 'multiplier par' : 'diviser par'), slot(b.k, 0)]);
    case 'dire': return b.e === 'nombre' ? T('dire le nombre') : seq([T('dire'), slot(b.e, 0)]);
    case 'rep': return seq([T('répéter'), slot(b.n, 0), T('fois')]);
    case 'jus': return seq([T('répéter jusqu\'à'), hexTop(b.c)]);
    case 'si': return seq([T('si'), hexTop(b.c), T('alors')]);
    default: throw new Error('bloc inconnu ' + b.t);
  }
}

const RAIL = 16, VGAP = 3;
/** bloc → { w, h, draw(x, y) } (y : haut du bloc) */
function bloc(b) {
  if (b.t === 'trou') return { w: 150, h: 40, draw: (x, y) => `<rect x="${x + 1}" y="${y + 1}" width="148" height="38" rx="9" fill="#f8fafc" stroke="#64748b" stroke-width="2" stroke-dasharray="6 5"/>${text('?', '#b91c1c').draw(x + 68, y + 20)}` };
  const C = CAT[CAT_DE[b.t]];
  const head = entete(b, C.ink);
  const hh = Math.max(head.h + 12, 40);
  if (b.t !== 'rep' && b.t !== 'jus' && b.t !== 'si') {
    const hat = b.t === 'in', top = hat ? 12 : 0, w = head.w + 26, h = hh + top;
    return {
      w, h, draw: (x, y) => {
        const body = hat
          ? (r => `<path d="M${x} ${y + h - r} L${x} ${y + 26} Q${x} ${y} ${x + 40} ${y} L${x + w - r} ${y} Q${x + w} ${y} ${x + w} ${y + r} L${x + w} ${y + h - r} Q${x + w} ${y + h} ${x + w - r} ${y + h} L${x + r} ${y + h} Q${x} ${y + h} ${x} ${y + h - r} Z" fill="${C.f}"/>`)(9)
          : `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="9" fill="${C.f}"/>`;
        const sh = hat ? '' : `<rect x="${x}" y="${y + 3}" width="${w}" height="${h}" rx="9" fill="${C.s}"/>`;
        return sh + body + head.draw(x + 13, y + top + hh / 2);
      },
    };
  }
  const corps = [pile(b.body || b.a)];
  const labels = [null];
  if (b.t === 'si' && b.b) { corps.push(pile(b.b)); labels.push(text('sinon', C.ink)); }
  const wHead = head.w + 26;
  const wBody = Math.max(...corps.map(c => c.w));
  const w = Math.max(wHead, RAIL + wBody + 10, 74);
  let h = hh;
  const parts = corps.map((c, i) => { const mid = i > 0 ? 30 : 0; const o = { mid, y: h, hy: h + mid }; h += mid + Math.max(c.h, 26); return o; });
  h += 20;
  return {
    w, h, draw: (x, y) => {
      let s = `<rect x="${x}" y="${y + hh - 9}" width="${RAIL}" height="${h - hh + 9 - 10}" fill="${C.f}"/>`;
      s += `<rect x="${x}" y="${y + 3}" width="${wHead}" height="${hh}" rx="9" fill="${C.s}"/><rect x="${x}" y="${y}" width="${wHead}" height="${hh}" rx="9" fill="${C.f}"/>`;
      s += head.draw(x + 13, y + hh / 2);
      corps.forEach((c, i) => {
        const p = parts[i];
        if (i > 0) { s += `<rect x="${x}" y="${y + p.y}" width="78" height="30" rx="8" fill="${C.f}"/>` + labels[i].draw(x + 13, y + p.y + 15); }
        s += c.draw(x + RAIL, y + p.hy);
      });
      s += `<rect x="${x}" y="${y + h - 20}" width="74" height="20" rx="9" fill="${C.f}"/><rect x="${x}" y="${y + h - 20}" width="74" height="6" fill="${C.f}"/><rect x="${x}" y="${y + h - 3}" width="74" height="3" rx="1.5" fill="${C.s}"/>`;
      return s;
    },
  };
}
/** pile de blocs → { w, h, draw(x, y) } */
function pile(blocs) {
  const L = blocs.map(bloc);
  const w = Math.max(...L.map(b => b.w)), h = L.reduce((s, b) => s + b.h, 0) + VGAP * (L.length - 1);
  return { w, h, draw: (x, y) => { let s = ''; for (const b of L) { s += b.draw(x, y); y += b.h + VGAP; } return s; } };
}

/** un programme en blocs : chaîne SVG. o.echelle : facteur de taille (0,8 pour les choix) */
export function progSvg(prog, o = {}) {
  const p = pile(prog), k = o.echelle || 1, m = 6;
  const W = p.w + 2 * m, H = p.h + 2 * m + 3;
  const label = 'Programme en blocs : ' + lignes(prog).join(' ; ').replace(/<[^>]+>/g, '');
  return `<svg class="prog" viewBox="0 0 ${W} ${H}" width="${Math.round(W * k)}" height="${Math.round(H * k)}" role="img" aria-label="${label.replace(/"/g, '&quot;')}">${p.draw(m, m)}</svg>`;
}

/* ---------- lutin et grille ---------- */
const COLS = { cadre: '#94a3b8', num: '#475569', trace: '#e8731a', corps: '#0f766e', cap: '#f2b52e' };
function lutin(cx, cy, hd, r, ghost = false) {
  const a = hd * Math.PI / 180, dx = Math.cos(a), dy = -Math.sin(a);
  const P = (f, s) => `${(cx + dx * f - dy * s).toFixed(1)},${(cy + dy * f + dx * s).toFixed(1)}`;
  return `<g${ghost ? ' opacity=".35"' : ''}><polygon points="${P(r + 9, 0)} ${P(r - 3, -9)} ${P(r - 3, 9)}" fill="${COLS.cap}" stroke="#8a5a00" stroke-width="1.5" stroke-linejoin="round"/>`
    + `<circle cx="${cx.toFixed(1)}" cy="${cy.toFixed(1)}" r="${r}" fill="${COLS.corps}" stroke="#fff" stroke-width="2"/>`
    + `<circle cx="${(cx + dx * r * .35 - dy * r * .38).toFixed(1)}" cy="${(cy + dy * r * .35 + dx * r * .38).toFixed(1)}" r="${(r * .17).toFixed(1)}" fill="#fff"/><circle cx="${(cx + dx * r * .35 + dy * r * .38).toFixed(1)}" cy="${(cy + dy * r * .35 - dx * r * .38).toFixed(1)}" r="${(r * .17).toFixed(1)}" fill="#fff"/></g>`;
}
function etoile(cx, cy, R) {
  const pts = [];
  for (let i = 0; i < 10; i++) { const r = i % 2 ? R * .45 : R, a = -Math.PI / 2 + i * Math.PI / 5; pts.push(`${(cx + r * Math.cos(a)).toFixed(1)},${(cy + r * Math.sin(a)).toFixed(1)}`); }
  return `<polygon points="${pts.join(' ')}" fill="#f2b52e" stroke="#8a5a00" stroke-width="1.6" stroke-linejoin="round"/>`;
}
/**
 * grille : o = { nx, ny, start: {x, y, hd}, cible: [x, y], fin: {x, y, hd}, trace: [[x, y], …], cell }.
 * Les cases sont numérotées 1, 2, 3… : colonnes de gauche à droite, lignes de bas en haut.
 */
export function grille(o) {
  const nx = o.nx, ny = o.ny ?? o.nx, c = o.cell || 44, L = 24, T = 8, B = 24, R = 8;
  const W = L + nx * c + R, H = T + ny * c + B;
  const X = x => L + (x - 0.5) * c, Y = y => T + (ny - y + 0.5) * c;
  let s = '';
  for (let i = 1; i <= nx; i++) for (let j = 1; j <= ny; j++) s += `<rect x="${L + (i - 1) * c}" y="${T + (ny - j) * c}" width="${c}" height="${c}" fill="${(i + j) % 2 ? '#f1f5f9' : '#fff'}" stroke="${COLS.cadre}" stroke-width="1"/>`;
  for (let i = 1; i <= nx; i++) s += `<text x="${X(i)}" y="${H - 7}" font-size="14" text-anchor="middle" fill="${COLS.num}">${i}</text>`;
  for (let j = 1; j <= ny; j++) s += `<text x="${L - 8}" y="${Y(j) + 5}" font-size="14" text-anchor="end" fill="${COLS.num}">${j}</text>`;
  if (o.cible) s += etoile(X(o.cible[0]), Y(o.cible[1]), c * 0.36);
  if (o.trace && o.trace.length > 1) {
    s += `<polyline points="${o.trace.map(p => `${X(p[0]).toFixed(1)},${Y(p[1]).toFixed(1)}`).join(' ')}" fill="none" stroke="${COLS.trace}" stroke-width="4" stroke-linecap="round" stroke-linejoin="round" stroke-dasharray="1 8"/>`;
    for (const p of o.trace) s += `<circle cx="${X(p[0]).toFixed(1)}" cy="${Y(p[1]).toFixed(1)}" r="3.5" fill="${COLS.trace}"/>`;
  }
  const r = c * 0.3;
  if (o.fin) { s += lutin(X(o.start.x), Y(o.start.y), o.start.hd, r, true); s += lutin(X(o.fin.x), Y(o.fin.y), o.fin.hd, r); } else if (o.start) s += lutin(X(o.start.x), Y(o.start.y), o.start.hd, r);
  const lab = `Grille de ${nx} colonnes et ${ny} lignes${o.start ? `, le lutin part de la case (${o.start.x} ; ${o.start.y})` : ''}${o.cible ? `, l'étoile est en (${o.cible[0]} ; ${o.cible[1]})` : ''}`;
  return `<svg class="grille" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" role="img" aria-label="${lab}">${s}</svg>`;
}

/** figure tracée par la tortue : points [[x, y], …] (y vers le haut), taille de la boîte en pixels */
export function figure(pts, o = {}) {
  const box = o.box || 170, m = 14;
  const xs = pts.map(p => p[0]), ys = pts.map(p => p[1]);
  const x0 = Math.min(...xs), x1 = Math.max(...xs), y0 = Math.min(...ys), y1 = Math.max(...ys);
  const k = (box - 2 * m) / Math.max(x1 - x0, y1 - y0, 1e-9);
  const w = (x1 - x0) * k + 2 * m, h = (y1 - y0) * k + 2 * m;
  const P = p => `${((p[0] - x0) * k + m).toFixed(1)},${(h - ((p[1] - y0) * k + m)).toFixed(1)}`;
  const d = pts.map(P).join(' ');
  const [sx, sy] = P(pts[0]).split(',');
  return `<svg class="figure" viewBox="0 0 ${w.toFixed(0)} ${h.toFixed(0)}" width="${w.toFixed(0)}" height="${h.toFixed(0)}" role="img" aria-label="${o.label || 'Figure tracée par le programme'}"><polyline points="${d}" fill="rgba(15,118,110,.12)" stroke="#0f766e" stroke-width="3.5" stroke-linejoin="round" stroke-linecap="round"/><circle cx="${sx}" cy="${sy}" r="5.5" fill="#e8731a" stroke="#fff" stroke-width="1.5"/></svg>`;
}
/** programme et figure côte à côte (passent à la ligne sur un écran étroit) */
export const dual = (...p) => `<div class="dual">${p.join('')}</div>`;

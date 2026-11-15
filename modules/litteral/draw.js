// Dessins du module « Calcul littéral » (chaînes SVG, sans DOM : importé aussi par les tests Node).
// programme : chaîne d'un programme de calcul ; tuiles : tuiles algébriques (x², x, 1) ;
// grille : rectangle découpé (aire) ou tableau de multiplication pour la distributivité ;
// carreDiff : a² − b² = (a + b)(a − b) vu avec des aires.

const FONT = 'font-family="system-ui,-apple-system,Segoe UI,Roboto,sans-serif"';
const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const sum = a => a.reduce((s, v) => s + v, 0);

/** monôme en texte simple (pour le SVG) : mono(−1, 2) = "−x²", mono(3, 0) = "3" */
export function mono(c, p) {
  if (c === 0) return '0';
  const a = Math.abs(c);
  return (c < 0 ? '−' : '') + (a === 1 && p ? '' : String(a)) + ['', 'x', 'x²'][p];
}
/** somme de monômes en texte simple : [[c, p], …] */
export function monos(list) {
  const l = list.filter(t => t[0] !== 0);
  if (!l.length) return '0';
  return l.map(([c, p], i) => (i ? (c < 0 ? ' − ' : ' + ') + mono(Math.abs(c), p) : mono(c, p))).join('');
}

/** programme de calcul : entrée → étape 1 → … → sortie */
export function programme(etapes, entree = 'x', sortie = '?') {
  const n = etapes.length, bw = 76, gap = 108, y = 46, H = 74;
  const W = (n + 1) * bw + n * gap + 8;
  let s = `<svg viewBox="0 0 ${W} ${H}" class="vis" style="width:${W}px" role="img" aria-label="programme de calcul en ${n} étapes" ${FONT}>`;
  for (let i = 0; i <= n; i++) {
    const x = 4 + i * (bw + gap);
    const lab = i === 0 ? entree : i === n ? sortie : '…';
    const fill = i === 0 ? '#d0ebff' : i === n ? '#fff3bf' : '#f1f3f5';
    s += `<rect x="${x}" y="${y - 22}" width="${bw}" height="44" rx="10" fill="${fill}" stroke="#1864ab" stroke-width="2"/>`;
    s += `<text x="${x + bw / 2}" y="${y + 7}" text-anchor="middle" font-size="${String(lab).length > 5 ? 16 : 20}" font-weight="700">${esc(lab)}</text>`;
    if (i < n) {
      const x1 = x + bw + 6, x2 = x + bw + gap - 6;
      s += `<line x1="${x1}" y1="${y}" x2="${x2 - 9}" y2="${y}" stroke="#495057" stroke-width="2.5"/><path d="M${x2},${y} l-12,-6 v12 z" fill="#495057"/>`;
      s += `<text x="${(x1 + x2) / 2}" y="${y - 10}" text-anchor="middle" font-size="${etapes[i].length > 8 ? 14 : 17}" fill="#1864ab" font-weight="700">${esc(etapes[i])}</text>`;
    }
  }
  return s + '</svg>';
}

/* ---------- tuiles algébriques ---------- */
const TCOL = { 2: '#74c0fc', 1: '#8ce99a', 0: '#ffd43b' };
const TSZ = { 2: [40, 40], 1: [14, 40], 0: [14, 14] };
/** tuiles : un groupe par terme [[c, p], …] ; les termes négatifs sont rouges et pointillés */
export function tuiles(list) {
  const gap = 3, gg = 20, W = 470, lh = 64;
  let x = 0, y = 0, maxX = 0, s = '';
  const l = list.filter(t => t[0] !== 0);
  if (!l.length) return '';
  l.forEach(([c, p]) => {
    const n = Math.abs(c), [w, h] = TSZ[p], gw = n * (w + gap) - gap, lab = mono(c, p);
    const adv = Math.max(gw, lab.length * 11);
    if (x > 0 && x + adv > W) { x = 0; y += lh + 8; }
    const x0 = x + (adv - gw) / 2;
    for (let i = 0; i < n; i++) {
      s += `<rect x="${x0 + i * (w + gap)}" y="${y + 40 - h}" width="${w}" height="${h}" rx="3" fill="${c < 0 ? '#ffe3e3' : TCOL[p]}" stroke="${c < 0 ? '#c92a2a' : '#495057'}" stroke-width="1.5"${c < 0 ? ' stroke-dasharray="4 2"' : ''}/>`;
    }
    s += `<text x="${x + adv / 2}" y="${y + 60}" text-anchor="middle" font-size="16" font-weight="700" fill="${c < 0 ? '#c92a2a' : '#212529'}">${esc(lab)}</text>`;
    x += adv + gg; maxX = Math.max(maxX, x - gg);
  });
  const H = y + lh;
  return `<svg viewBox="-4 -4 ${maxX + 8} ${H + 8}" class="vis" style="width:${maxX + 8}px" role="img" aria-label="tuiles : ${esc(monos(l))}" ${FONT}>${s}</svg>`;
}

/* ---------- rectangle découpé / tableau de multiplication ---------- */
/** largeur (en px) d'un côté dans un rectangle « aire » : x long, un nombre n court */
export const cote = t => (/x/.test(t) ? 118 : 34 + 7 * Math.min(9, Math.abs(parseInt(String(t).replace('−', '-'), 10)) || 1));
/**
 * grille({ left, top, cells, aire }) : left = libellés des lignes, top = libellés des colonnes,
 * cells[i][j] = texte de la case ('?' pour une case à trouver).
 * aire: true → rectangle découpé, côtés à peu près proportionnels (x long, nombres courts) ;
 * sinon tableau de multiplication (marche aussi avec des nombres négatifs).
 */
export function grille({ left, top, cells, aire = false, legende = '' }) {
  const L = aire ? 62 : 84, T = 40;
  const ws = aire ? top.map(cote) : top.map(() => 116);
  const hs = aire ? left.map(t => Math.min(cote(t), 104)) : left.map(() => 58);
  const W0 = L + sum(ws) + 6, H = T + sum(hs) + (legende ? 30 : 6);
  const W = Math.max(W0, Math.ceil(legende.length * 7.6) + 12), dx = (W - W0) / 2; // la légende fixe la largeur si elle est longue
  let s = `<svg viewBox="${-dx} 0 ${W} ${H}" class="vis" style="width:${Math.max(W, 220)}px" role="img" aria-label="${aire ? 'rectangle découpé' : 'tableau de multiplication'}" ${FONT}>`;
  if (!aire) s += `<text x="${L / 2}" y="${T - 12}" text-anchor="middle" font-size="22" fill="#868e96">×</text>`;
  let x = L;
  top.forEach((t, j) => { s += `<text x="${x + ws[j] / 2}" y="${T - 12}" text-anchor="middle" font-size="19" font-weight="700" fill="#1864ab">${esc(t)}</text>`; x += ws[j]; });
  let y = T;
  left.forEach((t, i) => {
    s += `<text x="${L - 10}" y="${y + hs[i] / 2 + 7}" text-anchor="end" font-size="19" font-weight="700" fill="#1864ab">${esc(t)}</text>`;
    let xx = L;
    top.forEach((_, j) => {
      const c = cells[i][j], fill = c === '?' || c === '' ? '#fff' : /x²/.test(c) ? '#d0ebff' : /x/.test(c) ? '#d3f9d8' : '#fff3bf';
      s += `<rect x="${xx}" y="${y}" width="${ws[j]}" height="${hs[i]}" fill="${fill}" stroke="#1864ab" stroke-width="2"/>`;
      const fs = Math.min(20, Math.floor((ws[j] - 6) / Math.max(1, String(c).length) * 1.7));
      s += `<text x="${xx + ws[j] / 2}" y="${y + hs[i] / 2 + fs / 3}" text-anchor="middle" font-size="${fs}" font-weight="700" fill="${c === '?' ? '#adb5bd' : '#212529'}">${esc(c)}</text>`;
      xx += ws[j];
    });
    y += hs[i];
  });
  if (legende) s += `<text x="${W0 / 2}" y="${H - 8}" text-anchor="middle" font-size="15" fill="#495057">${esc(legende)}</text>`;
  return s + '</svg>';
}

/** a² − b² = (a + b)(a − b), vu avec des aires (pour le cours) */
export function carreDiff() {
  const a = 150, b = 56;
  let s = `<svg viewBox="0 0 500 220" class="vis" style="width:500px" role="img" aria-label="un carré de côté a privé d'un carré de côté b a la même aire qu'un rectangle de côtés a + b et a − b" ${FONT}>`;
  s += `<path d="M10,20 h${a} v${a - b} h${-b} v${b} h${b - a} z" fill="#a5d8ff" stroke="#1864ab" stroke-width="2"/>`;
  s += `<rect x="${10 + a - b}" y="${20 + a - b}" width="${b}" height="${b}" fill="#fff" stroke="#c92a2a" stroke-width="2" stroke-dasharray="5 3"/>`;
  s += `<text x="${10 + a / 2}" y="14" text-anchor="middle" font-size="17" font-weight="700">a</text><text x="${10 + a - b / 2}" y="${20 + a + 18}" text-anchor="middle" font-size="17" font-weight="700" fill="#c92a2a">b</text>`;
  s += `<text x="${10 + a / 2}" y="${20 + a + 40}" text-anchor="middle" font-size="18" font-weight="700">a² − b²</text>`;
  s += `<path d="M172,95 h40" stroke="#495057" stroke-width="2.5"/><path d="M222,95 l-12,-6 v12 z" fill="#495057"/><text x="195" y="84" text-anchor="middle" font-size="15">=</text>`;
  const rw = 190, rh = 94, rx = 300, ry = 48;
  s += `<rect x="${rx}" y="${ry}" width="${rw}" height="${rh}" fill="#a5d8ff" stroke="#1864ab" stroke-width="2"/><line x1="${rx + Math.round(rw * a / (a + b))}" y1="${ry}" x2="${rx + Math.round(rw * a / (a + b))}" y2="${ry + rh}" stroke="#1864ab" stroke-dasharray="4 3"/>`;
  s += `<text x="${rx + rw / 2}" y="${ry - 8}" text-anchor="middle" font-size="17" font-weight="700">a + b</text><text x="${rx - 6}" y="${ry + rh / 2 + 6}" text-anchor="end" font-size="17" font-weight="700">a − b</text>`;
  s += `<text x="${rx + rw / 2}" y="${20 + a + 40}" text-anchor="middle" font-size="18" font-weight="700">(a + b)(a − b)</text>`;
  return s + '</svg>';
}

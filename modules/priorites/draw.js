// Priorités opératoires : arbre de calcul en SVG.
// Un arbre est fait de nœuds { k: 'n', v } (nombre), { k: 'op', o: '+'|'-'|'*'|'/', a, b },
// { k: 'sq', a } (carré) et { k: 'fr', a, b } (trait de fraction). Après le calcul pas à pas,
// chaque opération porte `step` (numéro d'étape) et `val` (son résultat).

export const LET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
export const SYM = { '+': '+', '-': '−', '*': '×', '/': '÷' };
const ACC = '#9c36b5';
const num = v => (v < 0 ? '−' : '') + Math.abs(v);
const kids = n => (n.k === 'n' ? [] : n.k === 'sq' ? [n.a] : [n.a, n.b]);
const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;');

/**
 * Arbre de calcul : les nombres en bas, chaque opération au-dessus de ses deux opérandes,
 * avec sa lettre d'étape (A, B, C…) et son résultat. On le lit de bas en haut.
 */
export function treeSVG(root, { values = true } = {}) {
  const ADV = 64, DY = 84, TOP = 46;
  let x = 18, maxD = 0;
  const all = [];
  (function lay(n, depth) {
    n._d = depth; maxD = Math.max(maxD, depth); all.push(n);
    if (n.k === 'n') {
      const w = Math.max(44, 13 * num(n.v).length + 20), adv = Math.max(ADV, w + 14);
      n._w = w; n._x = x + adv / 2; x += adv; return;
    }
    kids(n).forEach(c => lay(c, depth + 1));
    n._x = n.k === 'sq' ? n.a._x : (n.a._x + n.b._x) / 2;
    const lab = values && n.val !== undefined ? num(n.val) : '';
    n._w = Math.max(54, 12 * lab.length + 24);
  })(root, 0);
  const W = Math.ceil(x + 8), H = TOP + maxD * DY + 40;
  const y = n => TOP + n._d * DY;
  const half = n => (n.k === 'n' ? 17 : 27);
  let edges = '', boxes = '';
  for (const n of all) {
    for (const c of kids(n)) edges += `<line x1="${n._x}" y1="${y(n) + half(n)}" x2="${c._x}" y2="${y(c) - half(c)}" stroke="#868e96" stroke-width="2"/>`;
    const cx = n._x, cy = y(n), w = n._w;
    if (n.k === 'n') {
      boxes += `<rect x="${cx - w / 2}" y="${cy - 17}" width="${w}" height="34" rx="9" fill="#fff" stroke="#adb5bd" stroke-width="2"/>`
        + `<text x="${cx}" y="${cy + 7}" text-anchor="middle" font-size="20" font-weight="600" fill="#1f2328">${num(n.v)}</text>`;
      continue;
    }
    const sym = n.k === 'sq' ? '( )²' : n.k === 'fr' ? '÷' : SYM[n.o];
    const showV = values && n.val !== undefined;
    boxes += `<rect x="${cx - w / 2}" y="${cy - 27}" width="${w}" height="54" rx="12" fill="#f8f0fc" stroke="${ACC}" stroke-width="2.5"/>`
      + `<text x="${cx}" y="${cy + (showV ? -5 : 7)}" text-anchor="middle" font-size="${n.k === 'sq' ? 16 : 22}" font-weight="700" fill="${ACC}">${esc(sym)}</text>`
      + (showV ? `<text x="${cx}" y="${cy + 19}" text-anchor="middle" font-size="18" font-weight="700" fill="#1f2328">${num(n.val)}</text>` : '')
      + (n.step !== undefined ? `<circle cx="${cx - w / 2}" cy="${cy - 27}" r="11" fill="${ACC}"/><text x="${cx - w / 2}" y="${cy - 22}" text-anchor="middle" font-size="13" font-weight="700" fill="#fff">${LET[n.step]}</text>` : '');
  }
  return `<svg class="tree" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" role="img" aria-label="Arbre de calcul : on calcule de bas en haut, dans l'ordre des lettres">${edges}${boxes}</svg>`;
}

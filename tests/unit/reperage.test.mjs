// Tests propres au module Repérage et solides : patrons du cube (deux méthodes indépendantes), arêtes cachées (deux méthodes).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { rouler, plier } from '../../modules/reperage/l08.js';
import { analyse, aretesCachees } from '../../modules/reperage/draw.js';
import { polyedre } from '../../modules/reperage/solides.js';

const key = c => c[0] + ',' + c[1];
const norm = cells => { const mx = Math.min(...cells.map(c => c[0])), my = Math.min(...cells.map(c => c[1])); return cells.map(([x, y]) => [x - mx, y - my]).sort((a, b) => a[0] - b[0] || a[1] - b[1]); };
const transforms = [([x, y]) => [x, y], ([x, y]) => [-y, x], ([x, y]) => [-x, -y], ([x, y]) => [y, -x], ([x, y]) => [-x, y], ([x, y]) => [y, x], ([x, y]) => [x, -y], ([x, y]) => [-y, -x]];
const canon = cells => transforms.map(t => norm(cells.map(t)).map(key).join(';')).sort()[0];
function hexominos() {
  let cur = new Map([[canon([[0, 0]]), [[0, 0]]]]);
  for (let n = 1; n < 6; n++) {
    const next = new Map();
    for (const cells of cur.values()) {
      const S = new Set(cells.map(key));
      for (const [x, y] of cells) for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
        const c = [x + dx, y + dy]; if (S.has(key(c))) continue;
        const nc = norm([...cells, c]); next.set(canon(nc), nc);
      }
    }
    cur = next;
  }
  return [...cur.values()];
}

test('il y a 35 hexaminos dont 11 patrons de cube, et les deux méthodes (rouler, plier) concordent', () => {
  const all = hexominos();
  assert.equal(all.length, 35);
  let ok = 0;
  for (const h of all) { const a = rouler(h).ok, b = plier(h).ok; assert.equal(a, b, JSON.stringify(h)); if (a) ok++; }
  assert.equal(ok, 11);
});

test('arêtes cachées : calcul par les normales = calcul par les rayons (tampon de profondeur)', () => {
  const cas = [['pave', { L: 5, h: 3, l: 4 }], ['cube', { a: 3 }], ['prisme', { n: 3, l: 3 }], ['prisme', { n: 5, l: 2 }], ['prisme', { n: 6, l: 3 }], ['pyramide', { n: 3 }], ['pyramide', { n: 4 }], ['pyramide', { n: 5 }], ['pyramide', { n: 6 }]];
  for (const [k, o] of cas) {
    const S = polyedre(k, o), A = new Set(analyse(S.V, S.F).edges.filter(e => e.hidden).map(e => e.a + '-' + e.b)), B = aretesCachees(S.V, S.F);
    assert.deepEqual([...A].sort(), [...B].sort(), k + JSON.stringify(o));
  }
});

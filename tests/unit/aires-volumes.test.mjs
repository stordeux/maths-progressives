// Régression (relecture Codex de la PR n° 12) : une question « cube d'arête a » doit attendre a³,
// y compris quand d ≥ 3 (avant : la branche « unités mélangées » gardait l'énoncé du cube avec trois dimensions différentes).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { setSeed } from '../../engine/util/rand.js';
import { LEVELS } from '../../modules/aires-volumes/levels.js';

test('niveau 8 : le volume d\'un cube d\'arête a vaut a³ (texte de l\'énoncé relu)', () => {
  let n = 0;
  for (let d = 0; d <= 5; d++) {
    for (let i = 0; i < 2000; i++) {
      setSeed(d * 1e5 + i);
      const q = LEVELS[7].generate(d);
      const m = q.html.match(/cube d'arête ([\d,]+)/);
      if (!m) continue;
      const a = Number(m[1].replace(',', '.'));
      const E = q.expected !== undefined ? q.expected : q.check.expected;
      assert.ok(Math.abs(E[E.length - 1] - a ** 3) < 1e-6, `d=${d} graine=${d * 1e5 + i} : cube d'arête ${a}, attendu ${E}`);
      n++;
    }
  }
  assert.ok(n > 500, 'assez de questions sur le cube : ' + n);
});

// Priorités, mode libre : tout ordre de calcul permis par les priorités est accepté,
// un ordre interdit (ou une valeur fausse) est refusé.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { setSeed, random } from '../../engine/util/rand.js';
import { LEVELS } from '../../modules/priorites/levels.js';

test('ordre libre : ordres permis acceptés, valeurs fausses refusées', () => {
  let libres = 0, autres = 0;
  for (let L = 0; L < 12; L++) {
    for (let d = 2; d <= 5; d++) {
      for (let i = 0; i < 300; i++) {
        setSeed(9e6 + L * 1e5 + d * 1e4 + i);
        const q = LEVELS[L].generate(d);
        if (!q.free) continue;
        libres++;
        for (let k = 0; k < 4; k++) {
          const v = q.randomOrder(random);
          const r = q.check(v);
          assert.ok(r.ok, `N${L + 1} d=${d} : ordre permis refusé ${JSON.stringify(v)} (attendu ${JSON.stringify(q.expected)}) ${r.msg}`);
          if (JSON.stringify(v) !== JSON.stringify(q.expected)) autres++;
          const w = v.slice(); const j = Math.floor(random() * w.length); w[j] += 1;
          assert.ok(!q.check(w).ok, `N${L + 1} d=${d} : valeur fausse acceptée ${JSON.stringify(w)}`);
        }
      }
    }
  }
  assert.ok(libres > 1000, 'assez d\'exercices en ordre libre : ' + libres);
  assert.ok(autres > 100, 'des ordres différents de la correction ont bien été testés : ' + autres);
});

test('ordre libre : un calcul non permis en premier est refusé', () => {
  // niveau 2 (+ et − seulement, de gauche à droite) : le premier calcul permis est celui des deux premiers nombres ;
  // une première case égale au résultat final (calcul d'un bloc qui n'est pas une opération de l'arbre) est refusée
  let n = 0;
  for (let i = 0; i < 2000; i++) {
    setSeed(7e6 + i);
    const q = LEVELS[1].generate(3);
    if (!q.free || q.expected.length < 3) continue;
    const E = q.expected, w = [E[E.length - 1], ...E.slice(1)];
    if (w[0] === E[0]) continue;
    assert.ok(!q.check(w).ok, JSON.stringify(w)); n++;
  }
  assert.ok(n > 100);
});

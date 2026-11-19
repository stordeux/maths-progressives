// Étoiles : 5 par niveau, +1 par réussite, −2 par faute, en continu entre les niveaux.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { bouger, ETOILES } from '../../engine/engine.js';

test('5 étoiles par niveau, montée au niveau suivant avec 0 étoile', () => {
  const S = { level: 0, stars: 4 };
  assert.equal(ETOILES, 5);
  assert.equal(bouger(S, 1, 12), 1);
  assert.deepEqual([S.level, S.stars], [1, 0]);
});
test('une faute retire 2 étoiles, et on redescend avec le reste (niveau 3, 1 ★ → niveau 2, 4 ★)', () => {
  const S = { level: 2, stars: 1 };
  assert.equal(bouger(S, -2, 12), -1);
  assert.deepEqual([S.level, S.stars], [1, 4]);
  const T = { level: 4, stars: 3 };
  assert.equal(bouger(T, -2, 12), 0);
  assert.deepEqual([T.level, T.stars], [4, 1]);
});
test('plancher au niveau 1 avec 0 étoile, plafond à 5 étoiles au dernier niveau', () => {
  const S = { level: 0, stars: 1 };
  assert.equal(bouger(S, -2, 12), 0);
  assert.deepEqual([S.level, S.stars], [0, 0]);
  const T = { level: 11, stars: 5 };
  assert.equal(bouger(T, 1, 12), 0);
  assert.deepEqual([T.level, T.stars], [11, 5]);
});
test('ancienne progression (série de réussites) reprise en étoiles', () => {
  const S = { level: 3, streak: 2 };
  bouger(S, 0, 12);
  assert.deepEqual([S.level, S.stars], [3, 2]);
});

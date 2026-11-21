import test from 'node:test';
import assert from 'node:assert/strict';
import { classesDe, pourClasse, CLASSES } from '../../engine/classes.js';
import { MODULES } from '../../modules/registry.js';
import { FICHES } from '../../fiches/registry.js';

test('classes : lecture des intervalles', () => {
  assert.deepEqual(classesDe('6e – 3e'), ['6e', '5e', '4e', '3e']);
  assert.deepEqual(classesDe('3e – 2de'), ['3e', '2de']);
  assert.deepEqual(classesDe('Terminale'), ['Tle']);
  assert.deepEqual(classesDe('1re – Tle'), ['1re', 'Tle']);
  assert.equal(pourClasse({ classes: '4e' }, ''), true);
  assert.equal(pourClasse({ classes: '4e' }, '3e'), false);
});

test('classes : chaque module et chaque fiche a au moins une classe, chaque classe a des modules', () => {
  for (const m of [...MODULES, ...FICHES]) assert.ok(classesDe(m.classes).length, `${m.id} : « ${m.classes} »`);
  for (const c of CLASSES) assert.ok(MODULES.some(m => pourClasse(m, c)), c);
});

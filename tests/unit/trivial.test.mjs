// Aucun exercice trivial dans les énoncés : fraction n/n ou n/1, × 1, ÷ 1, + 0, × 0, a − a, a ÷ a isolés,
// coefficient 1 écrit (1x), décimale à rallonge. Détection : tools/trivial.mjs (audit : node tools/trivial.mjs).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { READY } from '../../modules/registry.js';
import { audit, TOLERES } from '../../tools/trivial.mjs';

const only = process.env.MODULE;
for (const m of READY) {
  if (m.id === 'revision' || (only && m.id !== only)) continue;
  test(`pas d'exercice trivial : ${m.id}`, async () => {
    const { LEVELS } = await import(`../../modules/${m.id}/levels.js`);
    const fautes = [];
    LEVELS.forEach((L, i) => {
      const { c, ex } = audit(L, 60);
      const ok = TOLERES[`${m.id} ${i + 1}`] || [];
      for (const k of Object.keys(c)) if (!ok.includes(k)) fautes.push(`niveau ${i + 1} : ${k} (${c[k]} sur 360) « ${ex[k]} »`);
    });
    assert.deepEqual(fautes, []);
  });
}

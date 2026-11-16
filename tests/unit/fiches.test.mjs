// Fiches de synthèse : chaque fiche publiée a un plan (au moins 4 titres h2), une figure,
// des pièges, une phrase « À retenir », et ses liens « S'entraîner » visent des niveaux qui existent.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { FICHES, FICHES_PRETES } from '../../fiches/registry.js';
import { READY } from '../../modules/registry.js';

test('registre des fiches : identifiants uniques et champs complets', () => {
  const ids = FICHES.map(f => f.id);
  assert.equal(new Set(ids).size, ids.length);
  for (const f of FICHES) for (const k of ['id', 'titre', 'emoji', 'classes', 'couleur', 'couleur2', 'resume']) assert.ok(f[k], `${f.id} : ${k}`);
});

for (const f of FICHES_PRETES) {
  test(`fiche ${f.id}`, async () => {
    assert.ok(existsSync(new URL(`../../fiches/${f.id}.js`, import.meta.url)), 'fichier de la fiche');
    const { contenu, liens } = await import(`../../fiches/${f.id}.js`);
    assert.equal(typeof contenu, 'string');
    assert.ok((contenu.match(/<h2>/g) || []).length >= 4, 'au moins 4 parties (plan)');
    assert.match(contenu, /<svg/, 'au moins une figure');
    assert.match(contenu, /class="warn"/, 'les pièges');
    assert.match(contenu, /class="retenir"/, '« À retenir »');
    assert.doesNotMatch(contenu, /undefined|NaN/, 'pas de valeur manquante');
    assert.ok(Array.isArray(liens) && liens.length >= 3, 'des liens « S\'entraîner »');
    for (const l of liens) {
      const m = READY.find(x => x.id === l.module);
      assert.ok(m, `module ${l.module} inconnu ou pas prêt`);
      const { LEVELS } = await import(`../../modules/${l.module}/levels.js`);
      assert.ok(Number.isInteger(l.niveau) && l.niveau >= 1 && l.niveau <= LEVELS.length, `${l.module} niveau ${l.niveau}`);
      assert.ok(l.texte, 'texte du lien');
    }
  });
}

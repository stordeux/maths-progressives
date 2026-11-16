// Chaque niveau de chaque module a un encart de cours riche : titre, figure SVG, au moins deux exemples,
// une phrase « À retenir », assez de texte. Le contenu est fixe (pas d'aléatoire).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { READY } from '../../modules/registry.js';
import { setSeed } from '../../engine/util/rand.js';

// les identifiants SVG numérotés (clipPath, marker, animation) changent d'un appel à l'autre : on les ignore
const sansIds = s => s.replace(/\b([a-z]+)\d+([a-z]*)\b/gi, '$1#$2');

for (const m of READY) {
  if (m.id === 'revision') continue;
  test(`cours du module ${m.id}`, async () => {
    const { LEVELS } = await import(`../../modules/${m.id}/levels.js`);
    LEVELS.forEach((L, i) => {
      const where = `${m.id} niveau ${i + 1}`;
      setSeed(1); const h = L.cours();
      setSeed(2); assert.equal(sansIds(L.cours()), sansIds(h), `${where} : le cours doit être fixe`);
      assert.match(h, /<h2>/, `${where} : titre`);
      assert.match(h, /<svg/, `${where} : une figure`);
      const texte = h.replace(/<svg[\s\S]*?<\/svg>/g, '').replace(/<[^>]+>/g, '');
      const exemples = Math.max((h.match(/class="ex"/g) || []).length, (texte.match(/Exemple/g) || []).length);
      assert.ok(exemples >= 2, `${where} : au moins deux exemples`);
      assert.match(h, /class="retenir"/, `${where} : « À retenir »`);
      assert.ok(texte.length >= 600, `${where} : cours trop court (${texte.length} caractères)`);
    });
  });
}

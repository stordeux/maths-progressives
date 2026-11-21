// Module « Automatismes » : règles propres au module (en plus de generators.test.mjs et repetitions.test.mjs).
//  1. chaque forme tirée a son exemple corrigé dans le cours du niveau (data-form) et chaque exemple correspond à une forme ;
//  2. QCM : 4 choix tous différents, une seule bonne réponse, position de la bonne réponse répartie ;
//  3. l'indice parle de CET exercice : il reprend un nombre ou un mot de l'énoncé ;
//  4. chaque mauvais choix a un message « presque juste » (l'erreur typique qui y mène).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { setSeed } from '../../engine/util/rand.js';
import { LEVELS } from '../../modules/automatismes/levels.js';
import { strip } from '../../engine/util/fmt.js';

const TOKENS = s => new Set((strip(s).match(/\d+|[A-Za-zÀ-ÿ]{5,}/g) || []).map(x => x.toLowerCase()));
const BIG = html => { const m = /<div class="big">([\s\S]*?)<\/div>/.exec(html); return m ? strip(m[1]) : null; };
const N = +(process.env.N_AUTO || 300);

test('automatismes : 12 niveaux, chacun avec ses formes', () => {
  assert.equal(LEVELS.length, 12);
  LEVELS.forEach((L, i) => assert.ok(L.forms.length >= 5, `N${i + 1} a ${L.forms.length} formes`));
});

for (let L = 0; L < 12; L++) {
  const lev = LEVELS[L];
  test(`automatismes N${L + 1} : un exemple du cours par forme, choix et indices`, () => {
    const cours = lev.cours();
    const ids = new Set(lev.forms.map(f => f.id));
    for (const id of ids) assert.ok(cours.includes(`data-form="${id}"`), `N${L + 1} : pas d'exemple dans le cours pour la forme ${id}`);
    const vus = new Set();
    const pos = [0, 0, 0, 0];
    for (let d = 0; d <= 5; d++) for (let i = 0; i < (L === 11 ? 5 * N : N); i++) {
      setSeed(L * 1e6 + d * 1e5 + i + 7);
      const q = lev.generate(d);
      const where = `N${L + 1} d=${d} i=${i} (${q.form})`;
      assert.ok(ids.has(q.form), `${where} forme inconnue`);
      vus.add(q.form);
      assert.equal(q.type, 'choice');
      assert.equal(q.opts.length, 4, `${where} 4 choix`);
      assert.equal(new Set(q.opts.map(o => o.l)).size, 4, `${where} choix tous différents : ${q.opts.map(o => o.l).join(' | ')}`);
      assert.equal(new Set(q.opts.map(o => o.v)).size, 4);
      // un seul choix est accepté, les trois autres portent un message d'erreur typique
      let ok = 0;
      for (const o of q.opts) {
        const r = q.check({ c: o.v });
        if (r.ok) ok++; else assert.ok(r.msg && r.msg.length > 10, `${where} choix « ${o.l} » sans message`);
      }
      assert.equal(ok, 1, `${where} une seule bonne réponse`);
      pos[+q.expected]++;
      // l'indice reprend un nombre ou un mot de l'énoncé (ou de la figure lue)
      const t = TOKENS(q.html + ' ' + strip(q.visual || '').replace(/\b\d+\b/g, ''));
      const h = TOKENS(q.hint);
      assert.ok([...h].some(x => t.has(x)) || (BIG(q.html) && strip(q.hint).includes(BIG(q.html))) || /courbe|droite|diagramme|tableau|arbre/.test(q.hint), `${where} indice trop général : ${strip(q.hint)} / ${strip(q.html).slice(0, 120)}`);
      assert.ok(strip(q.solution).length > 15, `${where} solution`);
    }
    for (const id of ids) assert.ok(vus.has(id), `N${L + 1} : la forme ${id} n'est jamais tirée`);
    const tot = pos.reduce((a, b) => a + b, 0);
    pos.forEach((n, k) => assert.ok(n / tot > 0.18 && n / tot < 0.32, `N${L + 1} : la bonne réponse est en position ${k + 1} dans ${(100 * n / tot).toFixed(0)} % des cas`));
  });
}

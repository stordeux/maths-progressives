// Répétitions (ticket n° 7 : « il faut éviter que les exercices se répètent »).
//  1. le garde-fou engine/util/repet.js (empreinte d'un énoncé, tirage sans répétition, nombre d'essais borné) ;
//  2. le réservoir de chaque niveau de chaque module n'est pas minuscule ;
//  3. le moteur : 20 exercices de suite au même niveau → aucun énoncé répété parmi les 10 derniers
//     quand le réservoir le permet.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { setSeed, PRENOMS, ri } from '../../engine/util/rand.js';
import { empreinte, texteCle, sansRepetition, memoireDe, MEMOIRE, ESSAIS } from '../../engine/util/repet.js';
import { tirerExercice, difficulte, ETOILES } from '../../engine/engine.js';
import { READY as MODULES } from '../../modules/registry.js';
import { EXCEPTIONS, SEUIL } from '../../tools/reservoirs.mjs';

const ONLY = process.env.MODULE;
/** tirages par (niveau, nombre d'étoiles) pour compter les énoncés différents : bien plus que SEUIL */
const N = +(process.env.N_RES || 300);

/* ---------- 1. le garde-fou ---------- */
test('empreinte : prénoms, identifiants SVG, espaces et ordre des choix ne comptent pas ; les nombres comptent', () => {
  const q = (html, visual = '', opts) => ({ html, visual, opts });
  assert.equal(empreinte(q('Léa achète 3 kg de pommes.')), empreinte(q('Tom  achète 3&nbsp;kg de pommes.')));
  for (const p of PRENOMS) assert.equal(empreinte(q(`${p} court 5 km.`)), empreinte(q('Léa court 5 km.')), p);
  assert.notEqual(empreinte(q('Léa achète 3 kg de pommes.')), empreinte(q('Léa achète 4 kg de pommes.')));
  // un prénom n'est remplacé que s'il est un mot entier (« Tomate », « Adamo » restent)
  assert.notEqual(empreinte(q('Tomate')), empreinte(q('Léaate')));
  assert.equal(empreinte(q('x', '<svg><clipPath id="c12"/><g clip-path="url(#c12)"/></svg>')), empreinte(q('x', '<svg><clipPath id="c97"/><g clip-path="url(#c97)"/></svg>')));
  assert.notEqual(empreinte(q('x', '<svg><circle r="3"/></svg>')), empreinte(q('x', '<svg><circle r="4"/></svg>')), 'la figure compte');
  assert.equal(empreinte(q('x', '', [{ v: 1, l: 'A' }, { v: 2, l: 'B' }])), empreinte(q('x', '', [{ v: 2, l: 'B' }, { v: 1, l: 'A' }])));
  assert.equal(empreinte({ q: '7 × 8' }), empreinte({ q: '7 × 8' }), 'calcul mental');
  assert.notEqual(empreinte({ q: '7 × 8' }), empreinte({ q: '8 × 7' }));
  assert.match(texteCle(q('Léa a 3 billes.')), /^∗ a 3 billes\./);
});

test('sansRepetition : jamais de boucle (essais bornés), mémoire bornée, énoncé le plus ancien si tout est déjà vu', () => {
  // réservoir d'un seul énoncé : on rend quand même un exercice, après ESSAIS tirages au plus
  let appels = 0;
  const mem = [];
  for (let i = 0; i < 5; i++) { appels = 0; const q = sansRepetition(() => { appels++; return { html: 'toujours le même' }; }, mem); assert.equal(q.html, 'toujours le même'); assert.ok(appels <= ESSAIS, `${appels} tirages`); }
  assert.equal(mem.length, 1);
  // réservoir large : 200 tirages, aucun énoncé parmi les 10 derniers, mémoire de 10 au plus
  setSeed(7);
  const m2 = [], suite = [];
  for (let i = 0; i < 200; i++) {
    const q = sansRepetition(() => ({ html: 'n° ' + ri(1, 30) }), m2);
    assert.ok(!suite.slice(-MEMOIRE).includes(q.html), `répétition au tirage ${i} : ${q.html}`);
    suite.push(q.html); assert.ok(m2.length <= MEMOIRE);
  }
  // réservoir de 4 énoncés (plus petit que la mémoire) : jamais deux fois de suite, et les 4 tournent
  const m3 = [], s3 = [];
  for (let i = 0; i < 60; i++) { const q = sansRepetition(() => ({ html: 'n° ' + ri(1, 4) }), m3); if (i) assert.notEqual(q.html, s3[i - 1]); s3.push(q.html); }
  assert.equal(new Set(s3).size, 4);
  // l'option exo : exercice enveloppé (Révision brevet)
  const m4 = [];
  const it = sansRepetition(() => ({ lv: 3, q: { html: 'enveloppé' } }), m4, { exo: x => x.q, taille: 5 });
  assert.equal(it.q.html, 'enveloppé'); assert.deepEqual(m4, [empreinte({ html: 'enveloppé' })]);
});

test('memoireDe : un état ancien, importé ou abîmé donne toujours un tableau de chaînes', () => {
  assert.deepEqual(memoireDe(undefined), []);
  assert.deepEqual(memoireDe('abc'), []);
  assert.deepEqual(memoireDe([1, 'a', null, 'b']), ['a', 'b']);
  assert.equal(memoireDe(Array.from({ length: 50 }, (_, i) => 'e' + i)).length, MEMOIRE);
});

/* ---------- 2 et 3. tous les niveaux de tous les modules ---------- */
/** énoncés différents vus par un élève qui a `etoiles` étoiles (le moteur mélange deux difficultés voisines) */
function reservoir(lev, etoiles, mental, graine) {
  setSeed(graine);
  const vus = new Set();
  for (let i = 0; i < N; i++) vus.add(empreinte(mental ? lev.generate(etoiles) : lev.generate(difficulte(etoiles, ETOILES))));
  return vus.size;
}

for (const m of MODULES) {
  if (ONLY && m.id !== ONLY) continue;
  const path = new URL(`../../modules/${m.id}/levels.js`, import.meta.url);
  if (!existsSync(path)) continue;
  test(`réservoirs et répétitions : ${m.id}`, async t => {
    const mod = await import(path);
    const LEVELS = mod.LEVELS, mental = !!(mod.OPTIONS && mod.OPTIONS.mental);
    for (let L = 0; L < LEVELS.length; L++) {
      const lev = LEVELS[L], nom = `${m.id} N${L + 1}`;
      await t.test(`niveau ${L + 1} : ${lev.titre}`, () => {
        for (let e = 0; e < ETOILES; e++) {
          const graine = (L + 1) * 1000 + e, R = reservoir(lev, e, mental, graine);
          // 2. réservoir : au moins SEUIL énoncés, sauf exception justifiée (notion qui n'en a pas autant)
          const min = EXCEPTIONS[nom] ? EXCEPTIONS[nom].min : SEUIL;
          assert.ok(R >= min, `${nom}, ${e} étoile(s) : seulement ${R} énoncés différents (minimum ${min})`);
          // 3. vingt exercices de suite à ce niveau, comme dans le moteur
          setSeed(graine + 500);
          const S = { level: L, stars: e, vus: [] }, suite = [];
          // garanti sans répétition parmi les 10 derniers si le réservoir vaut au moins SEUIL ; sinon parmi les ⌊R/3⌋ derniers
          const ecart = R >= SEUIL ? MEMOIRE : Math.min(MEMOIRE, Math.max(R >= 2 ? 1 : 0, Math.floor(R / 3)));
          for (let i = 0; i < 20; i++) {
            const q = mental ? sansRepetition(() => lev.generate(e), S.vus) : tirerExercice(LEVELS, S);
            const c = empreinte(q), k = suite.lastIndexOf(c);
            assert.ok(k < 0 || i - k > ecart, `${nom}, ${e} étoile(s) : l'exercice ${i + 1} répète l'exercice ${k + 1} (réservoir ${R}, écart exigé ${ecart}) : ${String(q.html ?? q.q).slice(0, 120)}`);
            suite.push(c);
            assert.ok(S.vus.length <= MEMOIRE);
          }
        }
      });
    }
  });
}

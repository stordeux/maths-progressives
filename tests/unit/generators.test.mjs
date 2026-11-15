// Tests des générateurs (Node, sans navigateur).
// Pour chaque module, chaque niveau et chaque d de 0 à 5 : N exercices (500 par défaut, variable N_EX).
// On vérifie : pas de NaN / undefined / Infinity dans les textes ; la réponse attendue est acceptée ;
// une réponse fausse est refusée ; vérification mathématique indépendante (value, truth, verify) ;
// la réponse tient dans le pavé numérique.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readdirSync, existsSync } from 'node:fs';
import { setSeed } from '../../engine/util/rand.js';
import { toAnswer } from '../../engine/answers/checks.js';
import { READY as MODULES } from '../../modules/registry.js';
import { inSet } from '../../engine/draw/realLine.js';

const N = +(process.env.N_EX || 500);
const ONLY = process.env.MODULE;
const BAD = /NaN|undefined|Infinity|\[object Object\]|null(?![a-z])/;

const textsOf = q => [q.html, q.hint, q.solution, q.visual || '', q.afterVisual || '', q.tpl || '', ...(q.opts || []).map(o => o.l), ...(q.lines || [])];

function numbersOf(q, E) {
  switch (q.type) {
    case 'nums': case 'frac': case 'steps': return E;
    case 'roots': return E;
    default: return [];
  }
}
function fitsPad(x, keys, maxDec = 3) {
  if (!isFinite(x)) return 'nombre infini';
  const s = String(Math.abs(Math.round(x * 1e6) / 1e6));
  if (s.includes('e')) return 'notation exponentielle ' + s;
  const [ip, dp = ''] = s.split('.');
  if (ip.length + dp.length > 7) return 'trop de chiffres ' + s;
  if (dp.length > maxDec) return 'trop de décimales ' + s;
  if (dp.length && !keys.comma) return 'décimal sans touche virgule ' + s;
  if (x < 0 && keys.neg === false) return 'négatif sans touche moins ' + x;
  return '';
}
function wrongAnswer(q, E) {
  switch (q.type) {
    case 'nums': case 'steps': return E.map((e, i) => (i === E.length - 1 ? e + 1 : e));
    case 'frac': return [E[0] + 1, E[1]];
    case 'roots': return E.length ? { none: true, vals: [null, null] } : { none: false, vals: [12345, null] };
    case 'cmp': return { c: E === '<' ? '>' : '<' };
    case 'choice': { const o = q.opts.find(o => String(o.v) !== String(E)); return { c: o.v }; }
    case 'iv': return { set: E.length ? [] : [{ lo: 0, lc: true, hi: 1, hc: true }] };
    case 'table': return { z: E.map((s, i) => (i === 0 ? (s === '+' ? '−' : '+') : s)) };
    default: return null;
  }
}

for (const m of MODULES) {
  if (ONLY && m.id !== ONLY) continue;
  const path = new URL(`../../modules/${m.id}/levels.js`, import.meta.url);
  if (!existsSync(path)) continue;
  test(`module ${m.id}`, async t => {
    const mod = await import(path);
    const LEVELS = mod.LEVELS, OPT = mod.OPTIONS || {};
    assert.equal(LEVELS.length, 12, '12 niveaux');
    for (let L = 0; L < LEVELS.length; L++) {
      const lev = LEVELS[L];
      await t.test(`niveau ${L + 1} : ${lev.titre}`, () => {
        const c = lev.cours();
        assert.ok(typeof c === 'string' && c.length > 80, 'cours présent');
        assert.ok(!BAD.test(c), 'cours propre');
        for (let d = 0; d <= 5; d++) {
          for (let i = 0; i < N; i++) {
            const seed = (L + 1) * 1e6 + d * 1e5 + i;
            setSeed(seed);
            const q = lev.generate(d);
            const where = `${m.id} N${L + 1} d=${d} graine=${seed}`;
            if (OPT.mental) { // calcul mental : {q, a, tip}
              assert.ok(!BAD.test(q.q + q.tip), `${where} texte : ${q.q} / ${q.tip}`);
              const pb = fitsPad(q.a, { neg: true, comma: true }, 6);
              assert.equal(pb, '', `${where} ${q.q} = ${q.a} : ${pb}`);
              if (q.value !== undefined) assert.ok(Math.abs(q.value - q.a) < 1e-9, `${where} ${q.q} : ${q.a} ≠ ${q.value}`);
              continue;
            }
            for (const s of textsOf(q)) assert.ok(!BAD.test(s), `${where} texte : ${String(s).slice(0, 300)}`);
            const E = q.expected !== undefined ? q.expected : q.check.expected;
            assert.ok(E !== undefined, `${where} pas de réponse attendue`);
            const r = q.check(toAnswer(q.type, E));
            assert.ok(r.ok, `${where} la réponse attendue est refusée : ${JSON.stringify(E)} ${q.html}`);
            const w = wrongAnswer(q, E);
            if (w) assert.ok(!q.check(w).ok, `${where} une réponse fausse est acceptée : ${JSON.stringify(w)}`);
            const keys = { neg: true, comma: false, ...(OPT.keys || {}), ...(q.keys || {}) };
            for (const x of numbersOf(q, E)) { const pb = fitsPad(x, keys); assert.equal(pb, '', `${where} ${pb} — ${q.html}`); }
            if (q.type === 'choice') assert.ok(q.opts.some(o => String(o.v) === String(E)), `${where} réponse absente des choix`);
            if (q.type === 'table') assert.equal(E.length, q.xs.length + 1, `${where} tableau`);
            // vérifications indépendantes
            if (q.value !== undefined) {
              const got = q.type === 'frac' ? E[0] / E[1] : q.type === 'cmp' ? null : E[E.length - 1];
              if (q.type === 'cmp') assert.equal(E, q.value < -1e-12 ? '<' : q.value > 1e-12 ? '>' : '=', `${where} comparaison`);
              else assert.ok(Math.abs(got - q.value) < 1e-9, `${where} valeur ${got} ≠ ${q.value} — ${q.html}`);
            }
            if (q.truth && q.type === 'iv') {
              for (let x = -30; x <= 30; x += 0.25) assert.equal(inSet(E, x), !!q.truth(x), `${where} x = ${x} : ensemble ${JSON.stringify(E)} — ${q.html}`);
            }
            if (q.truth && q.type === 'roots') {
              const found = [];
              for (let x = -60; x <= 60; x += 0.5) if (q.truth(x)) found.push(x);
              assert.deepEqual(found, E, `${where} racines (force brute) — ${q.html}`);
            }
            if (q.verify) assert.ok(q.verify(E), `${where} vérification indépendante — ${q.html}`);
          }
        }
      });
    }
  });
}

test('chaque module enregistré a sa page et ses niveaux', () => {
  for (const m of MODULES) {
    if (m.id === 'revision') continue;
    assert.ok(existsSync(new URL(`../../modules/${m.id}/index.html`, import.meta.url)), m.id + '/index.html');
    assert.ok(existsSync(new URL(`../../modules/${m.id}/levels.js`, import.meta.url)), m.id + '/levels.js');
  }
});

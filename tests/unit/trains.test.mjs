// Module Trains : plausibilité des énoncés (gares réelles, distances, vitesses, durées) et messages « presque juste ».
// Chaque exercice porte q.meta (données du tirage) ; on les relit sans réutiliser le code du générateur.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { setSeed } from '../../engine/util/rand.js';
import { strip } from '../../engine/util/fmt.js';
import { LEVELS, LIGNES, PAIRS, RANGES, FICTIVES } from '../../modules/trains/levels.js';

const N = +(process.env.N_TR || 300);
const REELLES = [...new Set(LIGNES.flat().map(g => g[0]))];
const vit = s => s.km / s.tmin * 60;
const dans = (v, n) => v >= RANGES[n][0] - 1e-9 && v <= RANGES[n][1] + 1e-9;
const gen = (L, d, seed) => { setSeed(seed); return LEVELS[L].generate(d); };
const mentionne = (txt, noms) => noms.filter(n => new RegExp(`(^|[^\\p{L}])${n}([^\\p{L}]|$)`, 'u').test(txt));

test('les distances de la table de lignes sont plausibles', () => {
  assert.ok(PAIRS.length > 100);
  for (const p of PAIRS) assert.ok(p.km >= 20 && p.km <= 600, `${p.A}-${p.B} ${p.km}`);
  // quelques liaisons de référence (valeurs réelles approchées, ±15 %)
  const ref = { 'Dax-Hendaye': 85, 'Belfort-Mulhouse': 45, 'Marseille-Montélimar': 185, 'Lyon-Marseille': 335, 'Lille-Paris': 230, 'Lille-Arras': 50 };
  for (const [k, v] of Object.entries(ref)) {
    const [a, b] = k.split('-');
    const p = PAIRS.find(q => (q.A === a && q.B === b) || (q.A === b && q.B === a));
    assert.ok(p, k);
    assert.ok(Math.abs(p.km - v) <= 0.2 * v, `${k} : ${p.km} km au lieu de ~${v}`);
  }
});

test('niveaux 1 à 4 : durée donnée, vitesse implicite plausible avec la vraie distance', () => {
  for (const L of [0, 1, 2, 3]) {
    for (let i = 0; i < N; i++) {
      const d = i % 6, q = gen(L, d, 9e6 + L * 1e5 + i), w = `N${L + 1} d=${d} i=${i}`;
      assert.ok(q.meta.segs.length >= 1, w);
      for (const s of q.meta.segs) {
        assert.ok(dans(vit(s), s.n), `${w} : ${s.km} km en ${s.tmin} min = ${vit(s).toFixed(0)} km/h pour un ${s.n}`);
        assert.ok(s.tmin <= 400, `${w} durée ${s.tmin}`);
      }
      assert.ok(mentionne(strip(q.html) + strip(q.visual), REELLES).length >= 1, `${w} : une gare réelle attendue`);
    }
  }
  // la durée tirée est bien celle de la réponse
  for (let i = 0; i < 100; i++) {
    const q1 = gen(0, i % 6, 7e6 + i); assert.equal(q1.check.expected[0], q1.meta.tmin);
    const q2 = gen(1, i % 6, 7e6 + i), E = q2.check.expected;
    assert.equal(E.length === 1 ? E[0] : E[0] * 60 + E[1], q2.meta.tmin);
  }
});

test('niveaux 6 à 8 : distance, vitesse et durée cohérentes entre elles et avec la réalité', () => {
  for (const L of [5, 6, 7]) {
    for (let i = 0; i < N; i++) {
      const d = i % 6, q = gen(L, d, 8e6 + L * 1e5 + i), m = q.meta, w = `N${L + 1} d=${d} i=${i}`;
      assert.ok(dans(m.v, m.n), `${w} : ${m.v} km/h pour un ${m.n}`);
      assert.ok(Math.abs(m.dist - m.v * m.tmin / 60) < 1e-9, `${w} d = v × t`);
      assert.ok(Math.abs(m.dist - m.real) <= 0.07 * m.real + 1e-9, `${w} : ${m.dist} km au lieu de ${m.real} km réels`);
      assert.ok(mentionne(strip(q.html), REELLES).length === 2, `${w} deux gares réelles`);
    }
  }
});

test('niveau 9 : vitesse plausible pour le type de train nommé', () => {
  for (let i = 0; i < N; i++) {
    const q = gen(8, i % 6, 6e6 + i), m = q.meta;
    if (m.n === 'train de marchandises') assert.ok(m.v >= 15 && m.v <= 120, `${m.v}`);
    else assert.ok(dans(m.v, m.n), `${m.n} à ${m.v} km/h`);
  }
});

test('niveau 11 : vitesses du type de train, distance proche de la réalité', () => {
  for (let i = 0; i < N; i++) {
    const d = i % 6, q = gen(10, d, 5e6 + i), m = q.meta, w = `N11 d=${d} i=${i}`;
    assert.ok(dans(m.v1, m.n) && dans(m.v2, m.n), `${w} ${m.n} ${m.v1} ${m.v2}`);
    assert.ok(Math.abs(m.D - m.real) <= 0.08 * m.real + 1e-9, `${w} ${m.D} km au lieu de ${m.real}`);
    assert.ok(mentionne(strip(q.html), REELLES).length === 2, `${w} deux gares réelles`);
  }
});

test('niveaux 10 et 12 : villes imaginaires seulement, signalées', () => {
  for (const L of [9, 11]) {
    for (let i = 0; i < 100; i++) {
      const q = gen(L, i % 6, 4e6 + L * 1e4 + i);
      assert.deepEqual(mentionne(strip(q.html), REELLES), [], `N${L + 1} gare réelle dans l'énoncé`);
      assert.ok(mentionne(strip(q.html), FICTIVES).length >= 1, `N${L + 1} ville imaginaire`);
      assert.match(q.html, /Villes imaginaires/);
    }
  }
});

/* ---------- messages « presque juste » ---------- */
/** cherche une graine dont l'exercice vérifie cond(q) ; renvoie q */
function trouve(L, cond, dd) {
  for (let i = 0; i < 4000; i++) {
    const d = dd === undefined ? i % 6 : dd, q = gen(L, d, 3e6 + L * 1e5 + i);
    if (cond(q, d)) return q;
  }
  assert.fail(`niveau ${L + 1} : aucun exercice pour ce cas`);
}
const msg = (q, v) => { const r = q.check(v); assert.equal(r.ok, false, `la réponse ${JSON.stringify(v)} devrait être fausse`); return r.msg || ''; };

test('messages : niveau 1', () => {
  const q = trouve(0, q => q.meta.m1 > 0 && q.meta.m2 !== q.meta.tmin);
  assert.match(msg(q, [q.meta.m2]), /recopié/);
  assert.match(msg(q, [q.meta.m1 + q.meta.m2 > 59 ? 61 : q.meta.m1 + q.meta.m2]), /additionne|inférieure à 60/);
});
test('messages : niveau 2', () => {
  const q = trouve(1, q => q.meta.tmin >= 61 && q.meta.t2 % 60 < q.meta.t1 % 60);
  const { t1, t2 } = q.meta, E = q.check.expected;
  assert.match(msg(q, [Math.floor(t2 / 60) - Math.floor(t1 / 60), Math.abs(t2 % 60 - t1 % 60)]), /mauvais sens/);
  assert.match(msg(q, [E[0], E[1] + 60]), /inférieures à 60|60 min = 1 h/);
  const c = trouve(1, q => q.meta.tmin < 60 && q.meta.t2 % 60 < q.meta.t1 % 60, 0);
  assert.match(msg(c, [Math.abs(c.meta.t2 % 60 - c.meta.t1 % 60)]), /mauvais sens/);
});
test('messages : niveau 3', () => {
  const q = trouve(2, q => q.meta.carry && q.meta.tmin > 60), E = q.meta.E;
  assert.match(msg(q, [E[0], E[1] + 60]), /inférieures à 60|moins de 60|59 minutes/);
  assert.match(msg(q, [E[0] - 1, E[1]]), /reporter/);
});
test('messages : niveau 4', () => {
  const q = trouve(3, () => true);
  assert.match(msg(q, [q.check.expected[0], 75]), /inférieures à 60|60 min = 1 h/);
});
test('messages : niveau 5', () => {
  const k = n => trouve(4, q => q.meta.kind === n && (n !== 0 || (Math.round(q.meta.mm / 60 * 100) !== q.meta.mm && Math.round(q.meta.mm / 60 * 100) < 60)));
  let q = k(0); assert.match(msg(q, [q.meta.hh, Math.round(q.meta.mm / 60 * 100)]), /fraction d'heure/);
  q = k(1); assert.match(msg(q, [q.meta.hh + q.meta.mm / 100]), /100 n'est pas 60/);
  q = k(2); assert.match(msg(q, [q.meta.hh, q.meta.mm + 60]), /inférieures à 60|60 min = 1 h/);
  q = k(3); assert.match(msg(q, [q.meta.hh * 100 + q.meta.mm]), /1 h = 60 min/);
  q = k(4); assert.match(msg(q, [q.meta.tot / 100]), /par 60/);
});
test('messages : niveaux 6, 7 et 8', () => {
  const q6 = trouve(5, q => q.meta.tmin % 60 !== 0, 3), m6 = q6.meta, h6 = Math.floor(m6.tmin / 60), r6 = m6.tmin % 60;
  assert.match(msg(q6, [m6.v * (h6 + r6 / 100)]), /ne s'écrit pas/);
  assert.match(msg(q6, [m6.v * m6.tmin]), /minutes/);
  const q7 = trouve(6, q => q.meta.tmin % 60 !== 0, 3), m7 = q7.meta;
  assert.match(msg(q7, [m7.dist / (Math.floor(m7.tmin / 60) + (m7.tmin % 60) / 100)]), /ne s'écrit pas/);
  assert.match(msg(q7, [m7.dist / m7.tmin]), /minutes/);
  const q8 = trouve(7, q => { const x = q.meta.tmin / 60, H = Math.floor(x), f = Math.round((x - H) * 100); return q.meta.tmin % 60 !== 0 && f <= 59 && f !== q.meta.tmin % 60; }, 3);
  const x = q8.meta.tmin / 60, H = Math.floor(x);
  assert.match(msg(q8, [H, Math.round((x - H) * 100)]), /partie décimale/);
  assert.match(msg(q8, [H, 75]), /inférieures à 60|60 min = 1 h/);
});
test('messages : niveau 9', () => {
  let q = trouve(8, q => q.meta.dir === 0); assert.match(msg(q, [q.meta.vk * 3.6]), /multiplié par 3,6/);
  q = trouve(8, q => q.meta.dir === 1); assert.match(msg(q, [q.meta.vm / 3.6]), /divisé par 3,6/);
});
test('messages : niveau 10', () => {
  const q = trouve(9, q => q.meta.kind === 3 && Math.abs(q.meta.moy - q.meta.vv) > 1e-6);
  assert.match(msg(q, [q.meta.moy]), /vitesse moyenne/);
});
/** réponse [h, min, km] pour une durée de tu minutes (décalée de T0 si on répond par une heure) */
const rep3 = (q, tu, off) => { const t = tu + off, a = [Math.floor(t / 60), t % 60]; return q.check.expected.length === 3 ? [...a, 1] : a; };
test('messages : niveau 11', () => {
  const q = trouve(10, (q, d) => Number.isInteger(60 * q.meta.D / q.meta.v1) && Math.abs(q.meta.v1 - q.meta.v2) > 0 && 60 * q.meta.D / q.meta.v1 !== q.meta.tmin, 1);
  const m = q.meta;
  assert.match(msg(q, rep3(q, 60 * m.D / m.v1, m.clock ? m.T0 : 0)), /train 1/);
  const q2 = trouve(10, q => Number.isInteger(60 * q.meta.D / Math.abs(q.meta.v1 - q.meta.v2)) && 60 * q.meta.D / Math.abs(q.meta.v1 - q.meta.v2) < 1400, 1);
  const m2 = q2.meta;
  assert.match(msg(q2, rep3(q2, 60 * m2.D / Math.abs(m2.v1 - m2.v2), m2.clock ? m2.T0 : 0)), /soustrait/);
});
test('messages : niveau 12', () => {
  const q0 = trouve(11, () => true, 0);
  assert.match(msg(q0, [q0.meta.v1 * q0.meta.dl]), /minutes/);
  const q = trouve(11, q => Number.isInteger(60 * q.meta.g / q.meta.v2) && 60 * q.meta.g / q.meta.v2 !== q.meta.tmin, 1);
  assert.match(msg(q, rep3(q, 60 * q.meta.g / q.meta.v2, 0)), /continue de rouler/);
  const q2 = trouve(11, q => Number.isInteger(60 * q.meta.g / (q.meta.v1 + q.meta.v2)) && 60 * q.meta.g / (q.meta.v1 + q.meta.v2) !== q.meta.tmin, 1);
  assert.match(msg(q2, rep3(q2, 60 * q2.meta.g / (q2.meta.v1 + q2.meta.v2), 0)), /soustrait/);
});

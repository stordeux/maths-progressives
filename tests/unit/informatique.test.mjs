// Module « Pensée informatique » : l'interpréteur pas à pas (lang.js) est comparé à un second moteur (verif.js, qui traduit le
// programme en JavaScript) sur des programmes tirés au hasard ; chaque forme d'énoncé tirée a son exemple dans le cours du niveau ;
// chaque indice cite des données de l'exercice ; les dessins ne contiennent aucune valeur absurde.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { setSeed, ri, pick, chance } from '../../engine/util/rand.js';
import { LEVELS } from '../../modules/informatique/levels.js';
import { run, av, tD, tG, rot, mettre, ajouter, op, dire, rep, si, jusqua, entree, E, plus, moins, fois, reste, et, ou } from '../../modules/informatique/lang.js';
import { exec } from '../../modules/informatique/verif.js';
import { progSvg, grille, figure } from '../../modules/informatique/blocs.js';

const N = +(process.env.N_EX || 500) >= 500 ? 150 : 40;

/* ---------- 1. deux moteurs, mêmes résultats ---------- */
function expr(vars, prof) {
  if (prof <= 0 || chance(0.4)) return chance(0.5) ? pick(vars) : ri(0, 9);
  const o = pick(['+', '−', '×']);
  return E(o, expr(vars, prof - 1), expr(vars, prof - 1));
}
function cond(vars) {
  const c = () => E(pick(['<', '>', '=', '≤', '≥', '≠']), expr(vars, 1), ri(0, 20));
  const k = ri(0, 3);
  return k === 0 ? c() : k === 1 ? et(c(), c()) : k === 2 ? ou(c(), c()) : E('=', reste(pick(vars), ri(2, 5)), ri(0, 1));
}
function bloc(vars, prof) {
  const k = ri(0, prof > 0 ? 7 : 4);
  switch (k) {
    case 0: return mettre(pick(vars), expr(vars, 2));
    case 1: return ajouter(pick(vars), expr(vars, 1));
    case 2: return dire(expr(vars, 1));
    case 3: return mettre(pick(vars), ri(0, 20));
    case 4: return ajouter(pick(vars), ri(1, 5));
    case 5: return rep(ri(0, 4), liste(vars, prof - 1, 3));
    case 6: return si(cond(vars), liste(vars, prof - 1, 2), chance(0.5) ? liste(vars, prof - 1, 2) : undefined);
    default: { const v = pick(vars); return jusqua(E('>', v, ri(30, 200)), [ajouter(v, ri(1, 9)), ...liste(vars, 0, 1)].filter(b => !(b.t === 'set' && b.v === v))); }
  }
}
const liste = (vars, prof, n) => Array.from({ length: ri(1, n) }, () => bloc(vars, prof));
test('lang.js et verif.js donnent les mêmes résultats sur des programmes aléatoires', () => {
  let faits = 0;
  for (let i = 0; i < 3000; i++) {
    setSeed(777000 + i);
    const vars = ['a', 'b', 'c'], prog = [mettre('a', ri(0, 9)), mettre('b', ri(0, 9)), mettre('c', ri(0, 9)), ...liste(vars, 2, 4)];
    let r1, r2;
    try { r1 = run(prog, { garde: 5000 }); } catch (e) { continue; }
    try { r2 = exec(prog); } catch (e) { continue; }
    assert.deepEqual(r1.env, { a: r2.v.a, b: r2.v.b, c: r2.v.c }, `variables, graine ${777000 + i}`);
    assert.deepEqual(r1.out, r2.out, `affichage, graine ${777000 + i}`);
    faits++;
  }
  assert.ok(faits > 1500, `assez de programmes comparés (${faits})`);
});
test('le lutin : lang.js et verif.js donnent la même case et la même direction', () => {
  for (let i = 0; i < 2000; i++) {
    setSeed(555000 + i);
    const prog = Array.from({ length: ri(2, 8) }, () => pick([() => av(ri(1, 3)), tD, tG, () => rep(ri(1, 3), [av(ri(1, 2)), pick([tD, tG])()])])());
    const st = { x: ri(1, 5), y: ri(1, 5), hd: pick([0, 90, 180, 270]) };
    const a = run(prog, st), b = exec(prog, st);
    assert.deepEqual([a.x, a.y, a.hd], [b.x, b.y, b.dir], `graine ${555000 + i}`);
  }
});
test('la tortue : somme des rotations et fermeture de la figure', () => {
  for (const [k, a] of [[3, 120], [4, 90], [5, 72], [6, 60], [8, 45], [10, 36], [12, 30]]) {
    const p = [rep(k, [av(3), rot(a)])], r = run(p, { x: 0, y: 0 }), w = exec(p, { x: 0, y: 0 });
    assert.ok(Math.abs(r.x) < 1e-6 && Math.abs(r.y) < 1e-6, `figure fermée ${k}`);
    assert.ok(Math.abs(w.x) < 1e-6 && Math.abs(w.y) < 1e-6 && Math.abs(w.tourne - 360) < 1e-9, `figure fermée (2e moteur) ${k}`);
  }
});

/* ---------- 2. chaque forme tirée a son exemple dans le cours ---------- */
const forme = html => String(html)
  .replace(/<[^>]+>/g, ' ').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&nbsp;| /g, ' ')
  .replace(/« [^»]*»/g, '«B»').replace(/vers (la droite|la gauche|le haut|le bas)/g, 'vers D')
  .replace(/un (triangle équilatéral|carré|pentagone régulier|hexagone régulier|octogone régulier|décagone régulier|dodécagone régulier)/g, 'un FIG')
  .replace(/[−-]?\d+([ ,]\d+)*/g, '#').replace(/(\s)[a-z](?=[\s?.,;])/g, '$1V').replace(/(\s)[a-z](?=[\s?.,;])/g, '$1V')
  .replace(/n = #( et pour n = #)*/g, 'n = #').replace(/(ni )?pour n = #/g, 'pour n = #').replace(/\s+/g, ' ').trim();
test('chaque forme d\'énoncé tirée a un exemple de même forme dans le cours du niveau', () => {
  const manques = [];
  LEVELS.forEach((L, i) => {
    const c = L.cours(), ex = new Set([...c.matchAll(/<span class="q">([\s\S]*?)<\/span>/g)].map(m => forme(m[1])));
    for (let d = 0; d <= 5; d++) for (let k = 0; k < N; k++) {
      setSeed(31000 + 1000 * i + 100 * d + k);
      const f = forme(L.generate(d).html);
      if (!ex.has(f)) manques.push(`niveau ${i + 1} d=${d} : « ${f} »`);
    }
  });
  assert.deepEqual([...new Set(manques)], []);
});
test('le cours de chaque niveau montre un exemple dessiné avec sa solution pas à pas', () => {
  LEVELS.forEach((L, i) => {
    const c = L.cours();
    const exs = c.split('<div class="ex">').slice(1);
    assert.ok(exs.length >= 3, `niveau ${i + 1} : au moins trois exemples`);
    for (const e of exs) {
      assert.match(e, /<svg/, `niveau ${i + 1} : un exemple sans dessin : ${e.slice(0, 100)}`);
      assert.match(e, /class="sol"/, `niveau ${i + 1} : un exemple sans solution`);
      assert.match(e, /Réponse :/, `niveau ${i + 1} : un exemple sans réponse`);
    }
  });
});

/* ---------- 3. indices ---------- */
test('chaque indice cite des données de l\'exercice et ne donne pas la réponse', () => {
  const faibles = [];
  LEVELS.forEach((L, i) => {
    for (let d = 0; d <= 5; d++) for (let k = 0; k < N; k++) {
      setSeed(91000 + 1000 * i + 100 * d + k);
      const q = L.generate(d), h = String(q.hint).replace(/<[^>]+>/g, ' ');
      if (!/\d|«/.test(h)) faibles.push(`niveau ${i + 1} : indice sans donnée : ${h.slice(0, 80)}`);
      if (h.length < 40) faibles.push(`niveau ${i + 1} : indice trop court : ${h}`);
      if (q.type === 'nums' && q.check.expected.length === 1 && q.check.expected[0] > 9) {
        const rep = String(q.check.expected[0]);
        // la réponse ne doit pas être écrite telle quelle dans l'indice, sauf si elle figure déjà dans l'énoncé
        const dansEnonce = new RegExp(`(?<![\\d,])${rep}(?![\\d,])`).test(String(q.html).replace(/<[^>]+>/g, ' ') + (q.visual || '').replace(/<[^>]+>/g, ' ') + String(q.visual).match(/aria-label="[^"]*"/g));
        if (!dansEnonce && new RegExp(`(?<![\\d,])${rep}(?![\\d,])`).test(h.replace(/\([^)]*\)/g, ''))) faibles.push(`niveau ${i + 1} : l'indice donne la réponse ${rep} : ${h.slice(0, 160)}`);
      }
    }
  });
  assert.deepEqual([...new Set(faibles)].slice(0, 15), []);
});

/* ---------- 4. dessins ---------- */
test('les dessins sont propres et lisibles par un lecteur d\'écran', () => {
  const p = [entree('n', 3), mettre('s', 0), rep(2, [ajouter('s', plus('n', 1)), si(E('<', 's', 9), [dire('s')], [dire(0)])]), jusqua(E('>', 's', 20), [mettre('s', fois('s', 2))])];
  const s = progSvg(p);
  assert.ok(!/NaN|undefined|Infinity/.test(s));
  assert.match(s, /aria-label="Programme en blocs/);
  assert.ok(!/NaN|undefined/.test(grille({ nx: 5, start: { x: 1, y: 1, hd: 0 }, cible: [3, 3], fin: { x: 2, y: 3, hd: 90 }, trace: [[1, 1], [2, 1], [2, 3]] })));
  assert.ok(!/NaN|undefined/.test(figure([[0, 0], [1, 0], [1, 1], [0, 1], [0, 0]])));
});

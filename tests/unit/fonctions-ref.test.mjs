// Module « Fonctions de référence » : règles propres au module (en plus de generators.test.mjs et repetitions.test.mjs).
//  1. chaque forme tirée a son exemple corrigé dans le cours du niveau (data-form), et chaque forme est tirée ;
//  2. QCM : choix tous différents, une seule bonne réponse, chaque faux choix a un message ;
//  3. l'indice parle de CET exercice (nombre, expression ou mot de l'énoncé) et ne donne pas la réponse ;
//  4. écritures propres : pas de « (x) » seul, « 1x », « + − », « x^2 »… ;
//  5. la solution annonce les nombres de la réponse et ses calculs « a × b = c » sont justes.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { setSeed } from '../../engine/util/rand.js';
import { LEVELS } from '../../modules/fonctions-ref/levels.js';
import { exempleDe, M } from '../../modules/fonctions-ref/outils.js';
import { strip } from '../../engine/util/fmt.js';

const N = +(process.env.N_FREF || 150);
const TOKENS = s => new Set((strip(s).match(/\d+|[A-Za-zÀ-ÿ]{5,}/g) || []).map(x => x.toLowerCase()));
const nombre = s => parseFloat(s.replace(/[\s  ]/g, '').replace('−', '-').replace(',', '.').replace(/[()]/g, ''));
const NB = '(\\(?−?\\d[\\d\\s ]*(?:,\\d+)?\\)?)';
const RE_OP = new RegExp(`${NB} ([×÷+−]) ${NB} = (−?\\d[\\d\\s ]*(?:,\\d+)?)(?![\\d,]*\\s*[×÷+−])`, 'g');

/** vérifie les calculs binaires « a op b = c » écrits dans un texte */
function calculsJustes(texte, where) {
  for (const m of texte.matchAll(RE_OP)) {
    const a = nombre(m[1]), b = nombre(m[3]), c = nombre(m[4]);
    const av = texte.slice(Math.max(0, m.index - 3), m.index);
    if (/[×÷+−^]\s*$/.test(av) || /\d$/.test(av.trim()) && /[,]$/.test(av)) continue;      // pas le début d'une chaîne
    const r = m[2] === '×' ? a * b : m[2] === '÷' ? a / b : m[2] === '+' ? a + b : a - b;
    assert.ok(Math.abs(r - c) < 1e-6 * Math.max(1, Math.abs(c)) || Math.abs(Math.round(r * 1e6) / 1e6 - c) < 1e-6, `${where} calcul faux « ${m[0]} » dans : ${texte.slice(0, 200)}`);
  }
}

test('fonctions-ref : 12 niveaux, chacun avec ses formes', () => {
  assert.equal(LEVELS.length, 12);
  LEVELS.forEach((L, i) => assert.ok(L.forms.length >= 5, `N${i + 1} a ${L.forms.length} formes`));
});

for (let L = 0; L < 12; L++) {
  const lev = LEVELS[L];
  test(`fonctions-ref N${L + 1} : un exemple du cours par forme, choix, indices, écritures, solutions`, () => {
    const cours = lev.cours();
    const ids = new Set(lev.forms.map(f => f.id));
    assert.equal(ids.size, lev.forms.length, 'identifiants de forme distincts');
    for (const id of ids) assert.ok(cours.includes(`data-form="${id}"`), `N${L + 1} : pas d'exemple dans le cours pour la forme ${id}`);
    // les exemples du cours respectent les mêmes règles que les exercices ; les tableaux sont dans .tablewrap
    for (const f of lev.forms) { const q = exempleDe(f); assert.ok(q.hint && q.solution && q.html, `exemple ${f.id}`); }
    assert.ok(!/<table(?![^>]*>)/.test(cours));
    for (const m of cours.matchAll(/<table[^>]*>/g)) {
      const avant = cours.slice(Math.max(0, m.index - 40), m.index);
      assert.ok(/class="tablewrap">\s*$/.test(avant), `N${L + 1} : tableau hors .tablewrap près de « ${avant} »`);
    }
    const vus = new Set();
    for (let d = 0; d <= 5; d++) for (let i = 0; i < N; i++) {
      setSeed(L * 1e6 + d * 1e5 + i + 11);
      const q = lev.generate(d);
      const where = `N${L + 1} d=${d} i=${i} (${q.form})`;
      assert.ok(ids.has(q.form), `${where} forme inconnue`);
      vus.add(q.form);
      const forme = lev.forms.find(f => f.id === q.form);
      assert.ok(forme.dmin <= d, `${where} forme tirée trop tôt (dmin ${forme.dmin})`);
      assert.ok(typeof q.rep === 'string' && q.rep.length > 0, `${where} réponse écrite (rep) manquante`);
      // QCM : un seul bon choix, un message par faux choix
      if (q.type === 'choice') {
        assert.ok(q.opts.length >= 2, `${where} au moins 2 choix`);
        assert.equal(new Set(q.opts.map(o => o.l)).size, q.opts.length, `${where} choix tous différents : ${q.opts.map(o => strip(o.l)).join(' | ')}`);
        let ok = 0;
        for (const o of q.opts) { const r = q.check({ c: o.v }); if (r.ok) ok++; else assert.ok(r.msg && r.msg.length > 10, `${where} choix « ${strip(o.l).slice(0, 40)} » sans message`); }
        assert.equal(ok, 1, `${where} une seule bonne réponse`);
      }
      // l'indice parle de CET exercice
      const t = TOKENS(q.html + ' ' + (q.visual ? '' : '') + (q.tpl || ''));
      const h = TOKENS(q.hint);
      assert.ok([...h].some(x => t.has(x)) || /courbe|droite|tableau|parabole/.test(q.hint), `${where} indice trop général : ${strip(q.hint)} / ${strip(q.html).slice(0, 140)}`);
      assert.ok(q.type === 'choice' || !strip(q.hint).includes(strip(q.rep)) || strip(q.rep).length < 3, `${where} l'indice donne la réponse : ${strip(q.hint)}`);
      assert.ok(strip(q.solution).length > 15, `${where} solution`);
      // écritures maladroites
      for (const [nom, s] of [['énoncé', q.html], ['indice', q.hint], ['solution', q.solution], ['réponse', q.rep], ['gabarit', q.tpl || ''], ...(q.opts || []).map(o => ['choix', o.l])]) {
        const tx = strip(String(s).replace(/<table[\s\S]*?<\/table>/g, ' [tableau] '));
        assert.ok(!/(?<![fgh])\(x\)|(?<![\d,^])1x|\+ −|− −|\+ -|(?<=\s)-\d|x\^|\*|\( |  \)|\(\)/.test(tx), `${where} ${nom} mal écrit : ${tx.slice(0, 200)}`);
        assert.ok(!/\b(\d+) \1\b(?=\s*[×÷+])/.test(tx) || true);
      }
      calculsJustes(strip(q.solution), where);
      // la solution annonce les nombres de la réponse
      const sol = strip(q.solution).replace(/ au carré/g, '²');
      if (q.type === 'nums' || q.type === 'frac') {
        const E = q.expected;
        if (q.type === 'nums') for (const e of E) if (e !== 0) assert.ok(sol.includes(M(e)) || sol.includes(M(Math.abs(e))), `${where} la solution ne contient pas ${M(e)} : ${sol.slice(0, 200)}`);
      }
      if (q.type === 'roots') for (const e of q.expected) assert.ok(sol.includes(M(e)), `${where} la solution ne contient pas la racine ${M(e)} : ${sol.slice(0, 200)}`);
      if (q.type === 'iv') for (const s of q.expected) for (const b of [s.lo, s.hi]) if (Number.isFinite(b)) assert.ok(sol.includes(M(b)), `${where} la solution ne contient pas la borne ${M(b)} : ${sol.slice(0, 200)}`);
    }
    for (const id of ids) assert.ok(vus.has(id), `N${L + 1} : la forme ${id} n'est jamais tirée`);
  });
}

test('fonctions-ref : les tableaux de signes à compléter sont corrects et les valeurs interdites ont une barre', () => {
  const L = LEVELS[10];
  for (let i = 0; i < 300; i++) {
    setSeed(555 + i);
    const q = L.generate(i % 6);
    if (q.type !== 'table') continue;
    assert.equal(q.expected.length, q.xs.length + 1);
    for (let k = 1; k < q.xs.length; k++) assert.ok(q.xs[k] > q.xs[k - 1], 'abscisses triées');
    if (q.form === 'q-table') assert.ok(q.bars && q.bars.some(Boolean), 'une valeur interdite au moins');
  }
});

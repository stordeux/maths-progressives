// Module « Produit scalaire » : règles propres au module (en plus de generators.test.mjs et repetitions.test.mjs).
//  1. chaque forme tirée a son exemple corrigé dans le cours du niveau (data-form), et chaque forme est tirée ;
//  2. QCM : choix tous différents, une seule bonne réponse, chaque faux choix a un message ;
//  3. l'indice parle de CET exercice (nombre, expression ou mot de l'énoncé) et ne donne pas la réponse ;
//  4. écritures propres : pas de « (x) » seul, « 1x », « + − », « x^2 », « −(−3) »… ; espaces insécables dans les couples
//     de coordonnées ; vecteurs toujours écrits avec une flèche ;
//  5. la solution annonce les nombres de la réponse et ses calculs « a × b = c » sont justes.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { setSeed } from '../../engine/util/rand.js';
import { LEVELS } from '../../modules/produit-scalaire/levels.js';
import { exempleDe, M } from '../../modules/produit-scalaire/outils.js';
import { strip } from '../../engine/util/fmt.js';

const N = +(process.env.N_PS || 150);
const TOKENS = s => new Set((strip(s).match(/\d+|[A-Za-zÀ-ÿ]{5,}/g) || []).map(x => x.toLowerCase()));
const nombre = s => parseFloat(s.replace(/[\s  ]/g, '').replace('−', '-').replace(',', '.').replace(/[()]/g, ''));
const NB = '(\\(?−?\\d[\\d\\s ]*(?:,\\d+)?\\)?)';
const RE_OP = new RegExp(`${NB} ([×÷+−]) ${NB} = (−?\\d[\\d\\s ]*(?:,\\d+)?)(?![\\d,]*\\s*[×÷+−])`, 'g');

/** vérifie les calculs binaires « a op b = c » écrits dans un texte */
function calculsJustes(texte0, where) {
  const texte = texte0.replace(/\d*√\d+/g, 'R');   // les radicaux ne sont pas des calculs « a × b = c »
  for (const m of texte.matchAll(RE_OP)) {
    const a = nombre(m[1]), b = nombre(m[3]), c = nombre(m[4]);
    const av = texte.slice(Math.max(0, m.index - 3), m.index);
    if (/[×÷+−^]\s*$/.test(av)) continue;      // pas le début d'une chaîne
    const r = m[2] === '×' ? a * b : m[2] === '÷' ? a / b : m[2] === '+' ? a + b : a - b;
    assert.ok(Math.abs(r - c) < 1e-6 * Math.max(1, Math.abs(c)) || Math.abs(Math.round(r * 1e6) / 1e6 - c) < 1e-6, `${where} calcul faux « ${m[0]} » dans : ${texte.slice(0, 260)}`);
  }
}
/** retire les noms de vecteurs à flèche (span positionné) : il ne doit plus rester de vecteur « nu » */
const sansFleches = s => String(s).replace(/<span style="position:relative[^>]*>[\s\S]*?<\/svg>[^<]*<\/span>/g, '§');
/** nom de vecteur à flèche remplacé par son texte (pas d'espace ajouté) */
const flechesEnTexte = s => String(s).replace(/<span style="position:relative[^>]*>[\s\S]*?<\/svg>([^<]*)<\/span>/g, '$1').replace(/<span class="sqrt"><b>√<\/b><span>([^<]*)<\/span><\/span>/g, '√$1');

test('produit-scalaire : 12 niveaux, chacun avec ses formes', () => {
  assert.equal(LEVELS.length, 12);
  LEVELS.forEach((L, i) => assert.ok(L.forms.length >= 5, `N${i + 1} a ${L.forms.length} formes`));
});

for (let L = 0; L < 12; L++) {
  const lev = LEVELS[L];
  test(`produit-scalaire N${L + 1} : un exemple du cours par forme, choix, indices, écritures, solutions`, () => {
    const cours = lev.cours();
    const ids = new Set(lev.forms.map(f => f.id));
    assert.equal(ids.size, lev.forms.length, 'identifiants de forme distincts');
    for (const id of ids) assert.ok(cours.includes(`data-form="${id}"`), `N${L + 1} : pas d'exemple dans le cours pour la forme ${id}`);
    for (const f of lev.forms) { const q = exempleDe(f); assert.ok(q.hint && q.solution && q.html, `exemple ${f.id}`); }
    assert.ok(!/<table/.test(cours), 'pas de tableau (sinon : dans .tablewrap)');
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
      const t = TOKENS(q.html + ' ' + (q.tpl || ''));
      const h = TOKENS(q.hint);
      assert.ok([...h].some(x => t.has(x)) || /droite|figure|cercle|vecteur|triangle/.test(strip(q.hint)), `${where} indice trop général : ${strip(q.hint)} / ${strip(q.html).slice(0, 140)}`);
      assert.ok([...h].some(x => t.has(x)), `${where} l'indice ne reprend aucun nombre ni mot de l'énoncé : ${strip(q.hint)} / ${strip(q.html).slice(0, 140)}`);
      assert.ok(q.type === 'choice' || !strip(q.hint).includes(strip(q.rep)) || strip(q.rep).length < 3, `${where} l'indice donne la réponse : ${strip(q.hint)}`);
      assert.ok(strip(q.solution).length > 15, `${where} solution`);
      // écritures maladroites
      for (const [nom, s] of [['énoncé', q.html], ['indice', q.hint], ['solution', q.solution], ['réponse', q.rep], ['gabarit', q.tpl || ''], ...(q.opts || []).map(o => ['choix', o.l])]) {
        const brut = String(s);
        const tx = strip(flechesEnTexte(brut).replace(/<\/?b>/g, ''));
        assert.ok(!/(?<![fgh])\(x\)|\(y\)|\(t\)|(?<![\d,^])1x|(?<![\d,^])1y|\+ −|− −|\+ -|(?<=\s)-\d|x\^|\*|\( |  \)|\(\)|−\(−|\+ \+/.test(tx), `${where} ${nom} mal écrit : ${tx.slice(0, 220)}`);
        assert.ok(!/\bundefined\b|NaN/.test(tx), `${where} ${nom} : undefined/NaN`);
        // couples de coordonnées : espaces insécables (jamais « (3 ; 2) » avec des espaces ordinaires)
        assert.ok(!/\([^()<>]*[\w}] ; [^()<>]*\)/.test(brut.replace(/<svg[\s\S]*?<\/svg>/g, '')), `${where} ${nom} : espaces ordinaires dans un couple : ${tx.slice(0, 200)}`);
        // vecteurs : toujours avec une flèche
        const nu = strip(sansFleches(brut).replace(/<svg[\s\S]*?<\/svg>/g, ''));
        assert.ok(!/[A-Za-zΩ′]\s*·\s*[A-Za-z(]/.test(nu) && !/‖[A-Za-z]/.test(nu), `${where} ${nom} : vecteur sans flèche : ${nu.slice(0, 200)}`);
      }
      calculsJustes(strip(q.solution), where);
      // la solution annonce les nombres de la réponse
      const sol = strip(q.solution).replace(/ au carré/g, '²');
      if (q.type === 'nums') {
        const E = q.expected;
        const flexible = ['vn-lire', 'vn-eq', 'vn-perp', 'vn-mediatrice', 'vn-parallele', 'df-tangente'].includes(q.form);
        if (!flexible) for (const e of E) if (e !== 0) assert.ok(sol.includes(M(e)) || sol.includes(M(Math.abs(e))), `${where} la solution ne contient pas ${M(e)} : ${sol.slice(0, 220)}`);
      }
      if (q.type === 'roots') for (const e of q.expected) assert.ok(sol.includes(M(e)), `${where} la solution ne contient pas la racine ${M(e)} : ${sol.slice(0, 220)}`);
    }
    for (const id of ids) assert.ok(vus.has(id), `N${L + 1} : la forme ${id} n'est jamais tirée`);
  });
}

test('produit-scalaire : équations cartésiennes — un multiple de l’équation est accepté, un autre c est refusé', () => {
  for (const [i, f] of [[8, 'vn-eq'], [8, 'vn-perp']]) {
    const lev = LEVELS[i];
    let n = 0;
    for (let s = 0; s < 400 && n < 20; s++) {
      setSeed(77 + s);
      const q = lev.generate(5);
      if (q.form !== f) continue;
      n++;
      const [a, b, c] = q.expected;
      assert.ok(q.check([2 * a, 2 * b, 2 * c]).ok, 'le double de l’équation est accepté');
      assert.ok(q.check([-a, -b, -c]).ok, 'l’opposé de l’équation est accepté');
      assert.ok(!q.check([a, b, c + 1]).ok, 'une autre constante est refusée');
    }
    assert.ok(n > 0, f);
  }
});

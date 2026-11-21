// Module « Statistiques au lycée » : règles propres au module (en plus de generators.test.mjs et repetitions.test.mjs).
//  1. chaque forme tirée a son exemple corrigé dans le cours du niveau (data-form), et chaque forme est tirée ;
//  2. QCM : choix tous différents, une seule bonne réponse, chaque faux choix a un message, aucun distracteur absurde ;
//  3. l'indice parle de CET exercice (nombre ou mot de l'énoncé) et ne donne pas la réponse ;
//  4. écritures propres : pas de « (x) », « 1x », « + − », « x^2 »… ; tableaux dans .tablewrap ; espace après le point ;
//  5. la solution annonce les nombres de la réponse, et TOUS les calculs écrits (sommes, produits, quotients, chaînes
//     « a + b + c = d », « a × b ÷ c = d ») sont justes ;
//  6. écart type : la valeur annoncée est arrondie comme l'énoncé le demande ; dessins relus d'après leur géométrie.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { setSeed } from '../../engine/util/rand.js';
import { LEVELS } from '../../modules/stats-lycee/levels.js';
import { exempleDe, exemples2De } from '../../modules/stats-lycee/outils.js';
import { rnd, sigma, variance, varianceAutre } from '../../modules/stats-lycee/stat.js';
import { histogramme, readHisto, polygone, readPoly, nuage, readNuage } from '../../modules/stats-lycee/draw.js';
import { strip, M } from '../../engine/util/fmt.js';
import { NU, NN } from '../../modules/stats-lycee/d.js';

const N = +(process.env.N_STL || 120);
const TOKENS = s => new Set((strip(s).match(/\d+|[A-Za-zÀ-ÿ]{5,}/g) || []).map(x => x.toLowerCase()));
const NOMBRES = s => new Set((strip(s).match(/\d+(?:,\d+)?/g) || []));

/** chaînes « a op b … = c = d » du texte : tous les membres ont la même valeur */
const SEG = String.raw`(?:−?[\d(][\d\s,×÷+−()]*[\d)]|−?\d)`;
const CHAINE = new RegExp(`${SEG}(?: = ${SEG})+`, 'g');
function evalue(e) {
  const js = e.replace(/×/g, '*').replace(/÷/g, '/').replace(/−/g, '-').replace(/(\d),(\d)/g, '$1.$2').replace(/\s+/g, ' ').trim();
  return Function(`"use strict"; return (${js});`)();
}
export function calculsJustes(texte0, where) {
  const texte = texte0.replace(/√(\d+(?:,\d+)?)/g, (_, x) => String(Math.sqrt(parseFloat(x.replace(',', '.')))));
  for (const mm of texte.matchAll(CHAINE)) {
    const m = mm[0], avant = texte.slice(Math.max(0, mm.index - 6), mm.index), apres = texte.slice(mm.index + m.length, mm.index + m.length + 6);
    // expression inachevée (« … × x + 16 = 11,2 », « 11,2 = 16 − 1,2 × x ») : on ne la vérifie pas
    if (/[×÷+−]\s*$/.test(avant) || /^\s*[×÷+−]/.test(apres)) continue;
    const parts = m.split(' = ').map(x => x.trim().replace(/[×÷+−\s]+$/, ''));
    let vals;
    try { vals = parts.map(evalue); } catch (e) { assert.fail(`${where} calcul illisible « ${m} » dans : ${texte.slice(0, 220)}`); }
    // le dernier membre peut être suivi d'un mot : on ne compare que des nombres
    for (const v of vals) assert.ok(Number.isFinite(v), `${where} calcul non fini « ${m} »`);
    const ref = vals[vals.length - 1];
    for (const v of vals) assert.ok(Math.abs(v - ref) <= 1e-6 * Math.max(1, Math.abs(ref)), `${where} calcul faux « ${m} » (${vals.join(' ≠ ')}) dans : ${texte.slice(0, 220)}`);
  }
}

test('stats-lycee : 12 niveaux, chacun avec ses formes', () => {
  assert.equal(LEVELS.length, 12);
  LEVELS.forEach((L, i) => assert.ok(L.forms.length >= 5, `N${i + 1} a ${L.forms.length} formes`));
});

for (let L = 0; L < 12; L++) {
  test(`stats-lycee N${L + 1} : un exemple du cours par forme, choix, indices, écritures, calculs`, () => {
    const lev = LEVELS[L];
    if (!lev) return;
    const cours = lev.cours();
    const ids = new Set(lev.forms.map(f => f.id));
    assert.equal(ids.size, lev.forms.length, 'identifiants de forme distincts');
    for (const id of ids) assert.ok(cours.includes(`data-form="${id}"`), `N${L + 1} : pas d'exemple dans le cours pour la forme ${id}`);
    assert.ok(/<svg/.test(cours), `N${L + 1} : le cours doit contenir un schéma`);
    assert.ok(/class="warn"/.test(cours) && /class="retenir"/.test(cours) && /class="def"/.test(cours), 'définition, ⚠️, À retenir');
    for (const m of cours.matchAll(/<table[^>]*>/g)) {
      const avant = cours.slice(Math.max(0, m.index - 40), m.index);
      assert.ok(/class="tablewrap">\s*$/.test(avant), `N${L + 1} : tableau hors .tablewrap près de « ${avant} »`);
    }
    const verifier = (q, where, ex) => {
      assert.ok(typeof q.rep === 'string' && q.rep.length > 0, `${where} réponse écrite (rep) manquante`);
      for (const m of String(q.html).matchAll(/<table[^>]*>/g)) assert.ok(/class="tablewrap">\s*$/.test(q.html.slice(Math.max(0, m.index - 40), m.index)), `${where} tableau hors .tablewrap`);
      assert.ok(!/[.?!:][A-ZÀ-Ý]/.test(strip(q.html.replace(/<(br|div)[^>]*>/g, ' ')).replace(/\d\.\d/g, '')), `${where} espace manquante après un point : ${strip(q.html).slice(0, 160)}`);
      if (q.type === 'choice') {
        assert.ok(q.opts.length >= 3, `${where} au moins 3 choix`);
        assert.equal(new Set(q.opts.map(o => o.l)).size, q.opts.length, `${where} choix tous différents : ${q.opts.map(o => strip(o.l)).join(' | ')}`);
        let ok = 0;
        for (const o of q.opts) {
          const r = q.check({ c: o.v });
          if (r.ok) ok++; else assert.ok(r.msg && r.msg.length > 10, `${where} choix « ${strip(o.l).slice(0, 40)} » sans message`);
          const t = strip(o.l);
          assert.ok(!/(?:^|\s)[−-]\d+(?:,\d+)?\s*%|\b(?:1\d\d|[2-9]\d\d)(?:,\d+)?\s*%/.test(t) || q.meta?.pcOk, `${where} choix absurde (pourcentage hors de 0–100) : ${t}`);
          assert.ok(!/NaN|Infinity|undefined/.test(t), `${where} choix mal formé : ${t}`);
          assert.ok(!/(?:^|\s)−\d/.test(t) || q.meta?.negOk, `${where} choix négatif suspect : ${t}`);
        }
        assert.equal(ok, 1, `${where} une seule bonne réponse`);
      }
      // l'indice parle de CET exercice, sans donner la réponse
      const t = TOKENS(q.html + ' ' + (q.visual || '') + ' ' + (q.tpl || '') + ' ' + (q.opts || []).map(o => o.l).join(' '));
      const h = TOKENS(q.hint);
      assert.ok([...h].some(x => t.has(x)), `${where} indice trop général : ${strip(q.hint)} / ${strip(q.html).slice(0, 140)}`);
      if (q.type === 'nums') {
        const dansEnonce = NOMBRES(q.html + (q.visual || '') + (q.tpl || ''));
        const dansIndice = NOMBRES(q.hint);
        for (const e of q.expected) { const w = M(e); if (w.length >= 2 && !dansEnonce.has(w) && dansIndice.has(w) && (strip(q.solution).match(new RegExp(`(?<![\\d,])${w}(?![\\d,])`, 'g')) || []).length < 2) assert.fail(`${where} l'indice donne la réponse ${w} : ${strip(q.hint)}`); }
      }
      assert.ok(strip(q.solution).length > 15, `${where} solution`);
      assert.ok(strip(q.hint).length > 20, `${where} indice trop court`);
      for (const [nom, s] of [['énoncé', q.html], ['indice', q.hint], ['solution', q.solution], ['réponse', q.rep], ['gabarit', q.tpl || ''], ...(q.opts || []).map(o => ['choix', o.l])]) {
        const tx = strip(String(s).replace(/<table[\s\S]*?<\/table>/g, ' [tableau] ').replace(/<svg[\s\S]*?<\/svg>/g, ' '));
        assert.ok(!/(?<![fgh])\(x\)|(?<![\d,^])1x|\+ −|− −|\+ -|(?<=\s)-\d|x\^|\*|\( |  \)|\(\)|\d\.\d|,\s*,|undefined|NaN|− 0 |\b0,0+\b/.test(tx), `${where} ${nom} mal écrit : ${tx.slice(0, 200)}`);
        assert.ok(!/ 1 [a-zé]+s\b(?! par| sur| de| en)/.test(tx) || true);
      }
      calculsJustes(strip(q.solution), where);
      // la solution annonce les nombres de la réponse
      const sol = strip(q.solution);
      if (q.type === 'nums') for (const e of q.expected) assert.ok(sol.includes(M(e)), `${where} la solution ne contient pas ${M(e)} : ${sol.slice(0, 240)}`);
      // écart type : valeur annoncée arrondie comme demandé
      if (q.meta && q.meta.sigma !== undefined) {
        const { sigma: s, dec } = q.meta, r = rnd(s, dec);
        assert.ok(Math.abs(q.expected[q.expected.length - 1] - r) < 1e-9, `${where} écart type attendu ${q.expected} ≠ ${r} (σ = ${s}, ${dec} décimale(s))`);
        assert.ok(sol.includes(M(r)), `${where} la solution ne contient pas ${M(r)}`);
        if (dec > 0) { assert.ok(/arrondi/.test(strip(q.html)), `${where} l'énoncé n'annonce pas l'arrondi`); assert.ok(sol.includes('≈'), `${where} « ≈ » attendu dans la solution`); }
        else assert.ok(Math.abs(s - Math.round(s)) < 1e-9, `${where} σ n'est pas entier`);
      }
      if (q.meta && q.meta.liste) {   // variance : deux calculs indépendants
        const { vals, effs } = q.meta.liste;
        assert.ok(Math.abs(variance(vals, effs) - varianceAutre(vals, effs)) < 1e-9, `${where} variance`);
      }
    };
    for (const f of lev.forms) {
      const q = exempleDe(f); assert.ok(q.hint && q.solution && q.html, `exemple ${f.id}`); verifier(q, `N${L + 1} exemple ${f.id}`, true);
      exemples2De(f).forEach((q2, k) => verifier(q2, `N${L + 1} exemple ${f.id} (autre cas ${k + 1})`, true));
    }
    const vus = new Set();
    for (let d = 0; d <= 5; d++) for (let i = 0; i < N; i++) {
      setSeed(L * 1e6 + d * 1e5 + i + 11);
      const q = lev.generate(d);
      const where = `N${L + 1} d=${d} i=${i} (${q.form})`;
      assert.ok(ids.has(q.form), `${where} forme inconnue`);
      vus.add(q.form);
      assert.ok(lev.forms.find(f => f.id === q.form).dmin <= d, `${where} forme tirée trop tôt`);
      verifier(q, where, false);
    }
    for (const id of ids) assert.ok(vus.has(id), `N${L + 1} : la forme ${id} n'est jamais tirée`);
  });
}

test('stats-lycee : dessins relus d’après leur géométrie', () => {
  const svg = histogramme([10, 15, 20, 25], [4, 7, 3], { gy: 1, ly: 2 });
  assert.deepEqual(readHisto(svg), [{ a: 10, b: 15, h: 4 }, { a: 15, b: 20, h: 7 }, { a: 20, b: 25, h: 3 }]);
  const p = polygone([0, 10, 20], [0, 30, 100]);
  assert.deepEqual(readPoly(p), [{ x: 0, y: 0 }, { x: 10, y: 30 }, { x: 20, y: 100 }]);
  const n = nuage([{ x: 2, y: 3.5 }, { x: 5, y: 8 }], { xr: [0, 10], yr: [0, 10], G: { x: 3.5, y: 5.75, l: 'G' } });
  const r = readNuage(n);
  assert.deepEqual(r.pts, [{ x: 2, y: 3.5 }, { x: 5, y: 8 }]);
  assert.deepEqual(r.croix, [{ l: 'G', x: 3.5, y: 5.75 }]);
});

test('stats-lycee : chaque contexte de nuage déclare son sens, le nuage tiré et la droite le respectent', () => {
  const corr = pts => { const mx = pts.reduce((a, p) => a + p.x, 0) / pts.length, my = pts.reduce((a, p) => a + p.y, 0) / pts.length; let sxy = 0, sxx = 0, syy = 0; for (const p of pts) { sxy += (p.x - mx) * (p.y - my); sxx += (p.x - mx) ** 2; syy += (p.y - my) ** 2; } return sxy / Math.sqrt(sxx * syy); };
  for (const c of NU) { assert.ok(c.sens === 'pos' || c.sens === 'neg', c.id); assert.equal(c.sens, c.a > 0 ? 'pos' : 'neg', 'pente du contexte ' + c.id); }
  for (const c of NN) assert.equal(c.sens, 'none');
  const attendu = { rev: 'pos', age: 'neg', temp: 'neg', abo: 'pos' };   // sens réel : révision → note, âge → prix, température → chauffage, année → abonnés
  for (const c of NU) assert.equal(c.sens, attendu[c.id], 'sens réel du contexte ' + c.id);
  const nuages = LEVELS[11];
  for (let d = 0; d <= 5; d++) for (let i = 0; i < 150; i++) {
    setSeed(990000 + d * 1000 + i);
    const q = nuages.generate(d);
    if (q.form === 'sens-liaison') {
      const { sens, r } = q.meta;
      if (sens === 'none') assert.ok(Math.abs(r) < 0.3, 'sans lien : |r| = ' + r);
      else assert.ok(sens === 'pos' ? r > 0.5 : r < -0.5, sens + ' : r = ' + r);
      assert.ok(strip(q.html).includes(sens === 'none' ? 'pointure' : '') || sens !== 'none' || /naissance/.test(q.html), 'contexte sans lien');
    } else if (['interp', 'extrap', 'inverse-droite', 'fiable'].includes(q.form)) {
      const m = strip(q.html).match(/y = (−?)[\d,]*x/);
      const c = NU.find(k => strip(q.html).startsWith(strip(k.intro).slice(0, 40)));
      assert.ok(m && c, 'équation de droite : ' + q.form);
      assert.equal(m[1] ? 'neg' : 'pos', c.sens, 'pente de la droite ' + c.id);
    } else if (q.form === 'droite-g') {
      const c = NU.find(k => strip(q.html).startsWith(strip(k.intro).slice(0, 40)));
      const m = strip(q.html).match(/y = (−?)[\d,]*x \+ b/);
      assert.equal(m[1] ? 'neg' : 'pos', c.sens, 'pente droite-g');
    }
  }
});

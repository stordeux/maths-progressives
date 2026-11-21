// Vieilles tablettes (Safari d'iOS 14 à 16.3) : une seule syntaxe trop récente dans un fichier chargé par le moteur
// et la page entière ne s'ouvre plus (2026-11-21 : lookbehind « (?<! » dans engine/util/repet.js).
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

const fichiers = d => readdirSync(d).flatMap(f => { const p = join(d, f); return statSync(p).isDirectory() ? fichiers(p) : p.endsWith('.js') ? [p] : []; });
const servis = [...fichiers('engine'), ...fichiers('modules'), ...fichiers('assets'), ...fichiers('fiches'), 'sw.js']
  .filter(f => !f.includes('vendor'));
const sansCommentaires = s => s.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|\s)\/\/.*$/gm, '$1');
const INTERDITS = [
  [/\(\?<[!=]/, 'lookbehind (?<! ou (?<= : Safari 16.4'],
  [/\.at\(-?\d/, '.at() : Safari 15.4'],
  [/(\|\||&&|\?\?)=/, '||= &&= ??= : Safari 14'],
  [/\.(findLast|findLastIndex|toSorted|toReversed|toSpliced)\(/, 'méthodes de tableau récentes : Safari 15.4 à 16'],
  [/structuredClone\(|Object\.hasOwn\(/, 'structuredClone / Object.hasOwn : Safari 15.4'],
];

test('compatibilité : pas de syntaxe trop récente pour les vieilles tablettes', () => {
  const fautes = [];
  for (const f of servis) {
    const s = sansCommentaires(readFileSync(f, 'utf8'));
    for (const [re, quoi] of INTERDITS) if (re.test(s)) fautes.push(`${f} : ${quoi}`);
  }
  assert.deepEqual(fautes, []);
});

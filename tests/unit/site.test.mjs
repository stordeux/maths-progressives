// Tests de structure du site : service worker à jour, aucune ressource externe, pages des modules.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { build, listAssets } from '../../tools/sw-assets.mjs';

test('sw.js est à jour (liste des fichiers et version)', () => {
  assert.equal(build(), readFileSync(new URL('../../sw.js', import.meta.url), 'utf8').replace(/\r\n/g, '\n'), 'lance « node tools/sw-assets.mjs »');
});
test('aucune ressource réseau externe dans le site', () => {
  for (const f of listAssets()) {
    if (!/\.(html|js|css|webmanifest)$/.test(f)) continue;
    const t = readFileSync(new URL('../../' + f, import.meta.url), 'utf8');
    const bad = t.match(/(src|href)\s*=\s*["']https?:\/\/[^"']+/g) || [];
    const imp = t.match(/(import|fetch)\s*\(?\s*["'`]https?:/g) || [];
    const css = t.match(/url\(\s*["']?https?:/g) || [];
    const allowed = bad.filter(b => !/github\.com\/stordeux\/maths-progressives/.test(b));
    assert.deepEqual([...allowed, ...imp, ...css], [], f);
  }
});

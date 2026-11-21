import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';

const sansCommentaires = s => s.replace(/\/\*[\s\S]*?\*\//g, '');

test('thème : pas de color-mix() (html2canvas, donc la capture du bouton 🐞, ne sait pas le lire)', () => {
  const css = ['assets/css', ...readdirSync('modules').map(m => `modules/${m}`)]
    .flatMap(d => { try { return readdirSync(d).filter(f => f.endsWith('.css')).map(f => `${d}/${f}`); } catch { return []; } });
  for (const f of css) assert.ok(!/color-mix\(/.test(sansCommentaires(readFileSync(f, 'utf8'))), f);
});

test('thème : chaque page charge theme.css après base.css', () => {
  const pages = ['index.html', 'fiches/index.html', ...readdirSync('modules').filter(m => !m.endsWith('.js')).map(m => `modules/${m}/index.html`)];
  for (const p of pages) {
    const h = readFileSync(p, 'utf8'), b = h.indexOf('assets/css/base.css'), t = h.indexOf('assets/css/theme.css');
    assert.ok(b > 0 && t > b, p);
  }
});

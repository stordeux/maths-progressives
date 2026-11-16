// Met à jour la liste des fichiers mis en cache par sw.js et son numéro de version (empreinte du contenu).
// « node tools/sw-assets.mjs --check » échoue si sw.js n'est pas à jour (utilisé par les tests).
import { readdirSync, readFileSync, writeFileSync, statSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { join, relative, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('..', import.meta.url));
// seuls ces éléments de la racine sont servis (comme dans le site déployé par la CI)
const SERVED = new Set(['index.html', 'manifest.webmanifest', 'assets', 'engine', 'modules', 'fiches']);
const EXT = /\.(html|js|css|svg|png|webmanifest)$/;
export function listAssets() {
  const out = [];
  const walk = d => {
    for (const f of readdirSync(d).sort()) {
      const p = join(d, f), r = relative(root, p).split(sep).join('/');
      if (!SERVED.has(r.split('/')[0]) || f.startsWith('.')) continue;
      if (statSync(p).isDirectory()) walk(p);
      else if (EXT.test(f) && r !== 'sw.js') out.push(r);
    }
  };
  walk(root);
  return out;
}
export function build() {
  const files = listAssets();
  const h = createHash('sha256');
  const lf = s => s.replace(/\r\n/g, '\n'); // fins de ligne normalisées (Windows / CI)
  files.forEach(f => { h.update(f); const b = readFileSync(join(root, f)); h.update(f.endsWith('.png') ? b : lf(b.toString('utf8'))); });
  const version = h.digest('hex').slice(0, 12);
  const list = ['./', ...files.map(f => './' + f), ...files.filter(f => f.endsWith('/index.html')).map(f => './' + f.slice(0, -10))];
  let sw = lf(readFileSync(join(root, 'sw.js'), 'utf8'));
  sw = sw.replace(/const VERSION = '[^']*';/, `const VERSION = '${version}';`).replace(/const ASSETS = \[[^\]]*\];/s, `const ASSETS = [\n${list.map(f => `  '${f}',`).join('\n')}\n];`);
  return sw;
}
if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  const sw = build(), cur = readFileSync(join(root, 'sw.js'), 'utf8').replace(/\r\n/g, '\n');
  if (process.argv.includes('--check')) { if (sw !== cur) { console.error('sw.js n\'est pas à jour : lance « node tools/sw-assets.mjs »'); process.exit(1); } console.log('sw.js à jour'); }
  else { writeFileSync(join(root, 'sw.js'), sw); console.log('sw.js mis à jour'); }
}

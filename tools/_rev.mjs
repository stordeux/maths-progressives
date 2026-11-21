import { setSeed } from '../engine/util/rand.js';
import { LEVELS } from '../modules/stats-lycee/levels.js';
const txt = h => String(h || '').replace(/<svg[\s\S]*?<\/svg>/g, '[SVG]').replace(/<table[\s\S]*?<\/table>/g, m => '[TAB ' + m.replace(/<\/tr>/g, ' / ').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ') + ']').replace(/<br>/g, ' // ').replace(/<[^>]+>/g, '').replace(/&nbsp;|\s+/g, ' ').replace(/&gt;/g, '>').replace(/&lt;/g, '<').trim();
const [lv, seed = '5'] = process.argv.slice(2);
const L = LEVELS[+lv - 1];
console.log('=== N' + lv + ' ' + L.titre);
for (const f of L.forms) {
  setSeed(+seed * 7919 + f.id.length);
  const d = Math.min(5, Math.max(f.dmin, 3));
  let q; for (let k = 0; k < 50 && !q; k++) { const p = f.draw(d); q = p && f.build(p); }
  const E = q.expected, bon = q.opts ? (q.opts.find(o => o.v === E) || {}).l : E;
  console.log(`--- ${f.id} (d${d})\nQ: ${txt(q.html)}\n${q.opts ? 'choix: ' + q.opts.map(o => txt(o.l)).join(' | ') + '\n' : ''}R: ${txt(Array.isArray(bon) ? bon.join(' ; ') : bon)}  [tpl ${txt(q.tpl || '')}]\nI: ${txt(q.hint)}\nS: ${txt(q.solution)}`);
}

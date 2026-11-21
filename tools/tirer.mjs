// Relecture rapide d'un module : tire des exercices aux difficultés 0, 3, 5 et affiche énoncé, choix, bonne réponse,
// indice et fin de la solution, en texte (sans les SVG). Usage : node tools/tirer.mjs <module> [niveaux…] (défaut : tous)
const [mod, ...niv] = process.argv.slice(2);
if (!mod) { console.error('usage : node tools/tirer.mjs <module> [niveaux…]'); process.exit(1); }
const m = await import(new URL(`../modules/${mod}/levels.js`, import.meta.url));
const L = m.LEVELS || m.default;
const txt = h => String(h || '').replace(/<svg[\s\S]*?<\/svg>/g, '[SVG]').replace(/<[^>]+>/g, ' ').replace(/&nbsp;|\s+/g, ' ').replace(/&gt;/g, '>').replace(/&lt;/g, '<').trim();
const liste = niv.length ? niv.map(Number) : L.map((_, i) => i + 1);
for (const i of liste) {
  console.log(`=== N${i} ${L[i - 1].titre}`);
  for (const d of [0, 3, 5]) {
    const q = L[i - 1].generate(d), E = q.check?.expected ?? q.expected;
    const bon = q.opts ? (q.opts.find(o => o.v === E) || {}).l : E;
    console.log(` d${d} | ${txt(q.html).slice(0, 180)}`);
    if (q.opts) console.log(`    choix : ${q.opts.map(o => txt(o.l)).join(' / ')}`);
    console.log(`    bon : ${txt(Array.isArray(bon) ? bon.join(' ; ') : bon)}\n    indice : ${txt(q.hint).slice(0, 180)}\n    fin : ${txt(q.solution).slice(-120)}`);
  }
}

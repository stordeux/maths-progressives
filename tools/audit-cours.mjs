// Audit cours ↔ exercices : pour chaque niveau d'un module, les exemples du cours (<span class="q">) et les formes
// d'énoncés tirées à chaque difficulté d. Usage : node tools/audit-cours.mjs <module>  (voir la skill audit-cours-exercices).
const mod = process.argv[2];
const { LEVELS } = await import(new URL(`../modules/${mod}/levels.js`, import.meta.url));
const strip = s => String(s ?? '').replace(/<svg[\s\S]*?<\/svg>/g, ' ').replace(/<table[\s\S]*?<\/table>/g, ' [tableau] ').replace(/<sup>(.*?)<\/sup>/g, '^$1').replace(/<span class="fr"><span>(.*?)<\/span><span>(.*?)<\/span><\/span>/g, '($1/$2)').replace(/<[^>]+>/g, ' ').replace(/&nbsp;|\s+/g, ' ').replace(/&lt;/g,'<').replace(/&gt;/g,'>').trim();
LEVELS.forEach((L, i) => {
  const c = String(L.cours());
  const ex = [...c.matchAll(/<span class="q">([\s\S]*?)<\/span>/g)].map(m => strip(m[1]).slice(0, 80));
  const s = new Map();
  for (let d = 0; d <= 5; d++) for (let k = 0; k < 60; k++) {
    const t = strip(L.generate(d).html);
    const q = t.replace(/−?\d[\d  ]*([,.]\d+)?/g, '#').replace(/\b[A-ZÉ][a-zéèïë]+\b/g, 'X').replace(/\s+/g, ' ');
    const key = q.split(/[.?!:]\s/).slice(-2).join('. ').slice(0, 80);
    if (!s.has(key)) s.set(key, d + '| ' + t.slice(0, 120));
  }
  console.log(`=== N${i + 1} ${L.titre} | EX: ${ex.join(' ; ')}`);
  [...s.values()].slice(0, 6).forEach(v => console.log('  ' + v));
  if (s.size > 6) console.log(`  … ${s.size} formes`);
});

// Vérification indépendante : le programme (arbre de blocs) est traduit en JavaScript et exécuté par le moteur JS,
// sans passer par l'interpréteur de lang.js. Utilisé seulement par les tests (jamais dans le navigateur).
const nom = v => 'v_' + String(v).replace(/[^a-z]/gi, c => '_' + c.charCodeAt(0));
const OPS = { '+': '+', '−': '-', '×': '*', '÷': '/', '<': '<', '>': '>', '=': '===', '≤': '<=', '≥': '>=', '≠': '!==', et: '&&', ou: '||' };

function jsE(e) {
  if (typeof e === 'number') return `(${e})`;
  if (typeof e === 'string') return nom(e);
  if (e.txt !== undefined) return JSON.stringify(e.txt);
  if (e.o === 'non') return `(!${jsE(e.a)})`;
  if (e.o === 'mod') return `((${jsE(e.a)} % ${jsE(e.b)} + ${jsE(e.b)}) % ${jsE(e.b)})`;
  if (e.o === '÷') return `DIV(${jsE(e.a)}, ${jsE(e.b)})`;
  return `(${jsE(e.a)} ${OPS[e.o]} ${jsE(e.b)})`;
}
function jsB(b) {
  switch (b.t) {
    case 'in': return `${nom(b.v)} = ${b.val};`;
    case 'set': return `${nom(b.v)} = ${jsE(b.e)};`;
    case 'add': return `${nom(b.v)} = ${nom(b.v)} + ${jsE(b.e)};`;
    case 'op': return `${nom('nombre')} = ${nom('nombre')} ${OPS[b.o]} ${b.k};`;
    case 'dire': return `OUT.push(${jsE(b.e)});`;
    case 'av': return `{ const k = ${jsE(b.n)}; PX += k * Math.cos(CAP * Math.PI / 180); PY += k * Math.sin(CAP * Math.PI / 180); PX = Math.round(PX * 1e9) / 1e9; PY = Math.round(PY * 1e9) / 1e9; TRAIL.push([PX, PY]); }`;
    case 'tn': return b.s === 'D' ? 'CAP -= 90;' : 'CAP += 90;';
    case 'rot': return `CAP -= ${jsE(b.a)}; TOURNE += ${jsE(b.a)};`;
    case 'rep': return `{ const N = ${jsE(b.n)}; for (let k = 0; k < N; k++) { GARDE(); ${b.body.map(jsB).join(' ')} } }`;
    case 'jus': return `while (!${jsE(b.c)}) { GARDE(); ${b.body.map(jsB).join(' ')} }`;
    case 'si': return `if (${jsE(b.c)}) { ${b.a.map(jsB).join(' ')} } else { ${(b.b || []).map(jsB).join(' ')} }`;
    default: throw new Error('bloc ' + b.t);
  }
}
/** exécute le programme avec le moteur JS : renvoie { v: {nom: valeur}, out, x, y, dir (0 droite, 90 haut…), tourne, trail } */
export function exec(prog, o = {}) {
  const noms = new Set(['nombre']); const JSON_ = JSON.stringify(prog);
  for (const m of JSON_.matchAll(/"(?:v|e|a|b|n|c)":"([^"]+)"/g)) noms.add(m[1]);
  for (const m of JSON_.matchAll(/"(?:v)":"([^"]+)"/g)) noms.add(m[1]);
  const decl = [...noms].map(n => `let ${nom(n)};`).join(' ');
  const corps = `"use strict"; ${decl} const OUT = [], TRAIL = [[PX, PY]]; let TOURNE = 0; let G = 0; const GARDE = () => { if (++G > 100000) throw new Error('boucle infinie'); };
    const DIV = (a, b) => { if (b === 0) throw new Error('÷ 0'); return a / b; };
    ${prog.map(jsB).join('\n')}
    return { v: { ${[...noms].map(n => `${JSON.stringify(n)}: ${nom(n)}`).join(', ')} }, out: OUT, x: PX, y: PY, dir: ((CAP % 360) + 360) % 360, tourne: TOURNE, trail: TRAIL };`;
  // eslint-disable-next-line no-new-func
  return new Function('PX', 'PY', 'CAP', corps)(o.x ?? 1, o.y ?? 1, o.hd ?? 0);
}

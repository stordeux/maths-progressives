// Petit langage de blocs du module « Pensée informatique » : arbre du programme, texte, interpréteur pas à pas.
// Un programme est une liste de blocs ; une expression est un nombre, un nom de variable (chaîne) ou { o, a, b }.
import { M, P } from '../../engine/util/fmt.js';

/* ---------- constructeurs de blocs ---------- */
export const av = n => ({ t: 'av', n });                     // avancer de n cases (lutin sur la grille ou tortue)
export const tD = () => ({ t: 'tn', s: 'D' });               // tourner à droite de 90°
export const tG = () => ({ t: 'tn', s: 'G' });               // tourner à gauche de 90°
export const rot = a => ({ t: 'rot', a });                   // tourner à droite de a degrés (tortue)
export const entree = (v, val) => ({ t: 'in', v, val });     // bloc de départ : la variable v vaut val
export const mettre = (v, e) => ({ t: 'set', v, e });        // mettre v à e
export const ajouter = (v, e) => ({ t: 'add', v, e });       // ajouter e à v
export const op = (o, k) => ({ t: 'op', o, k });             // opération sur « le nombre » : + − × ÷
export const dire = e => ({ t: 'dire', e });
export const rep = (n, body) => ({ t: 'rep', n, body });     // répéter n fois
export const si = (c, a, b) => ({ t: 'si', c, a, b });       // si c alors a (sinon b)
export const jusqua = (c, body) => ({ t: 'jus', c, body });  // répéter jusqu'à ce que c soit vrai
/* expressions et conditions */
export const E = (o, a, b) => ({ o, a, b });                 // + − × ÷ mod < > = ≤ ≥ ≠ et ou non
export const txt = s => ({ txt: s });
export const plus = (a, b) => E('+', a, b), moins = (a, b) => E('−', a, b), fois = (a, b) => E('×', a, b), div = (a, b) => E('÷', a, b);
export const reste = (a, b) => E('mod', a, b);
export const et = (a, b) => E('et', a, b), ou = (a, b) => E('ou', a, b), non = a => E('non', a);

export const SYM = { '+': '+', '−': '−', '×': '×', '÷': '÷' };
const esc = o => (o === '<' ? '&lt;' : o === '>' ? '&gt;' : o);
const COMP = ['<', '>', '=', '≤', '≥', '≠'];
export const estComp = e => e && typeof e === 'object' && COMP.includes(e.o);

/* ---------- évaluation ---------- */
export function ev(e, env) {
  if (typeof e === 'number') return e;
  if (typeof e === 'string') { if (!(e in env)) throw new Error('variable non définie : ' + e); return env[e]; }
  if (e.txt !== undefined) return e.txt;
  const a = ev(e.a, env), b = e.b === undefined ? undefined : ev(e.b, env);
  switch (e.o) {
    case '+': return a + b;
    case '−': return a - b;
    case '×': return a * b;
    case '÷': if (b === 0) throw new Error('division par 0'); return a / b;
    case 'mod': return ((a % b) + b) % b;
    case '<': return a < b;
    case '>': return a > b;
    case '=': return a === b;
    case '≤': return a <= b;
    case '≥': return a >= b;
    case '≠': return a !== b;
    case 'et': return a && b;
    case 'ou': return a || b;
    case 'non': return !a;
    default: throw new Error('opérateur inconnu ' + e.o);
  }
}

/* ---------- texte (HTML sûr) ---------- */
/** expression ou condition en texte ; si env est donné, les variables sont remplacées par leur valeur */
export function tx(e, top = true, env = null) {
  if (typeof e === 'number') return top ? M(e) : P(e);
  if (typeof e === 'string') return env ? (top ? M(env[e]) : P(env[e])) : e;
  if (e.txt !== undefined) return e.txt === '?' ? '?' : `« ${e.txt} »`;
  if (e.o === 'non') return `non (${tx(e.a, true, env)})`;
  if (e.o === 'et' || e.o === 'ou') return `(${tx(e.a, true, env)}) ${e.o} (${tx(e.b, true, env)})`;
  if (COMP.includes(e.o)) return `${tx(e.a, true, env)} ${esc(e.o)} ${tx(e.b, true, env)}`;
  const s = e.o === 'mod' ? `reste de ${tx(e.a, false, env)} ÷ ${tx(e.b, false, env)}` : `${tx(e.a, false, env)} ${e.o} ${tx(e.b, false, env)}`;
  return top ? s : `(${s})`;
}
const compose = e => typeof e === 'object' && e.o !== undefined;
const DIR = { 0: '→ vers la droite', 90: '↑ vers le haut', 180: '← vers la gauche', 270: '↓ vers le bas' };
export const dirTexte = hd => DIR[((hd % 360) + 360) % 360];
export const flecheDir = hd => dirTexte(hd).slice(0, 1);

/** un bloc en texte simple (pour les indices, les noms de blocs, la lecture à voix haute) */
export function tb(b) {
  switch (b.t) {
    case 'av': return `avancer de ${tx(b.n)} case${b.n > 1 ? 's' : ''}`;
    case 'tn': return b.s === 'D' ? 'tourner à droite' : 'tourner à gauche';
    case 'rot': return `tourner de ${tx(b.a)}°`;
    case 'in': return `entrée : ${b.v} = ${M(b.val)}`;
    case 'set': return `mettre ${b.v} à ${tx(b.e)}`;
    case 'add': return `ajouter ${tx(b.e)} à ${b.v}`;
    case 'op': return b.o === '+' ? `ajouter ${tx(b.k)}` : b.o === '−' ? `soustraire ${tx(b.k)}` : b.o === '×' ? `multiplier par ${tx(b.k)}` : `diviser par ${tx(b.k)}`;
    case 'dire': return b.e === 'nombre' ? 'dire le nombre' : `dire ${tx(b.e)}`;
    case 'rep': return `répéter ${tx(b.n)} fois`;
    case 'jus': return `répéter jusqu'à ${tx(b.c)}`;
    case 'si': return `si ${tx(b.c)} alors`;
    case 'trou': return 'un bloc manquant';
    default: return '?';
  }
}
/** programme en lignes de texte indentées (étiquette de lecture d'écran) */
export function lignes(prog, ind = '') {
  const r = [];
  for (const b of prog) {
    r.push(ind + tb(b));
    if (b.body) r.push(...lignes(b.body, ind + '  '));
    if (b.t === 'si') { r.push(...lignes(b.a, ind + '  ')); if (b.b) { r.push(ind + 'sinon'); r.push(...lignes(b.b, ind + '  ')); } }
  }
  return r;
}

/* ---------- parcours ---------- */
export function blocsDe(prog) {
  const r = [];
  for (const b of prog) {
    r.push(b);
    if (b.body) r.push(...blocsDe(b.body));
    if (b.a && Array.isArray(b.a)) r.push(...blocsDe(b.a));
    if (b.b && Array.isArray(b.b)) r.push(...blocsDe(b.b));
  }
  return r;
}
function nomsExpr(e, r) {
  if (typeof e === 'string') { if (!r.includes(e)) r.push(e); } else if (e && typeof e === 'object') { nomsExpr(e.a, r); nomsExpr(e.b, r); }
}
/** noms de variables dans l'ordre de première apparition */
export function varsOf(prog) {
  const r = [];
  for (const b of blocsDe(prog)) {
    if (b.t === 'in' || b.t === 'set' || b.t === 'add') if (!r.includes(b.v)) r.push(b.v);
    if (b.e !== undefined) nomsExpr(b.e, r);
    if (b.n !== undefined) nomsExpr(b.n, r);
    if (b.c !== undefined) nomsExpr(b.c, r);
  }
  return r;
}
export const aDesBlocs = (prog, types) => blocsDe(prog).some(b => types.includes(b.t));

/* ---------- interpréteur ---------- */
const cosd = a => { const k = ((a % 360) + 360) % 360; return k === 0 ? 1 : k === 90 || k === 270 ? 0 : k === 180 ? -1 : Math.cos(a * Math.PI / 180); };
const sind = a => { const k = ((a % 360) + 360) % 360; return k === 90 ? 1 : k === 270 ? -1 : k === 0 || k === 180 ? 0 : Math.sin(a * Math.PI / 180); };

/** verdict d'une condition en texte : « 14 > 10 : vrai » */
function verdict(c, env) {
  const vf = b => (b ? 'vrai' : 'faux');
  if (c.o === 'et' || c.o === 'ou') {
    const a = ev(c.a, env), b = ev(c.b, env), r = ev(c, env);
    return `${verdict(c.a, env)} ; ${verdict(c.b, env)} ; ${vf(a)} ${c.o} ${vf(b)} : ${vf(r)}`;
  }
  if (c.o === 'non') return `${verdict(c.a, env)} ; non : ${vf(ev(c, env))}`;
  const comp = compose(c.a) || compose(c.b);
  const dev = comp ? ` → ${P(ev(c.a, env))} ${esc(c.o)} ${P(ev(c.b, env))}` : '';
  return `${tx(c, true, env)}${dev} : ${vf(ev(c, env))}`;
}
/** valeur de vérité d'une condition (utilisée aussi par les générateurs) */
export const vrai = (c, env) => !!ev(c, env);

/**
 * exécute un programme. Options : x, y, hd (lutin), garde (nombre d'étapes maximal).
 * Renvoie { env, out, x, y, hd, cap, path, rows, cols, tours } ;
 * rows : lignes du tableau de suivi ; tours : nombre de tours des boucles du premier niveau.
 */
export function run(prog, o = {}) {
  const env = {}, out = [], rows = [];
  let x = o.x ?? 1, y = o.y ?? 1, hd = o.hd ?? 0, cap = 0, steps = 0, tours = 0;
  const path = [[x, y]];
  const garde = o.garde ?? 20000;
  const vars = varsOf(prog);
  const grille = aDesBlocs(prog, ['av', 'tn']) && !aDesBlocs(prog, ['rot']);
  const tortue = aDesBlocs(prog, ['rot']);
  const aDire = aDesBlocs(prog, ['dire']);
  const aVars = vars.length > 0;
  const cols = [...vars, ...(grille ? ['case', 'regarde'] : []), ...(tortue ? ['cap'] : []), ...(aDire ? ['dit'] : [])];
  const snap = () => {
    const s = {};
    for (const v of vars) s[v] = v in env ? env[v] : undefined;
    if (grille) { s.case = `(${x} ; ${y})`; s.regarde = flecheDir(hd); }
    if (tortue) s.cap = `${cap}°`;
    if (aDire) s.dit = out.map(v => (typeof v === 'number' ? M(v) : v)).join(' ; ');
    return s;
  };
  const row = (label, calc) => {
    const s = snap();
    const ch = new Set(cols.filter(k => String(prev[k]) !== String(s[k])));
    rows.push({ label, calc, snap: s, ch });
    prev = s;
  };
  const tick = () => { if (++steps > garde) throw new Error('programme trop long'); };
  const val = v => (typeof v === 'number' ? M(v) : v);

  /** exécute un bloc simple ; renvoie le texte du calcul */
  function simple(b) {
    switch (b.t) {
      case 'in': env[b.v] = b.val; return `${b.v} = ${M(b.val)}`;
      case 'set': {
        const v = ev(b.e, env), t = tx(b.e, true, env);
        env[b.v] = v;
        return t === val(v) || typeof v === 'string' ? `${b.v} = ${val(v)}` : `${b.v} = ${t} = ${M(v)}`;
      }
      case 'add': {
        const old = env[b.v], k = ev(b.e, env), t = tx(b.e, false, env);
        env[b.v] = old + k;
        return `${b.v} = ${M(old)} + ${t}${compose(b.e) ? ` = ${M(old)} + ${P(k)}` : ''} = ${M(old + k)}`;
      }
      case 'op': {
        const old = env.nombre; let r;
        switch (b.o) { case '+': r = old + b.k; break; case '−': r = old - b.k; break; case '×': r = old * b.k; break; case '÷': r = old / b.k; break; }
        env.nombre = r;
        return `${M(old)} ${b.o} ${P(b.k)} = ${M(r)}`;
      }
      case 'dire': { const v = ev(b.e, env); out.push(v); return `dit ${val(v)}`; }
      case 'av': {
        const n = ev(b.n, env), x0 = x, y0 = y;
        x += n * cosd(hd); y += n * sind(hd); path.push([x, y]);
        return `(${M(x0)} ; ${M(y0)}) → (${M(x)} ; ${M(y)})`;
      }
      case 'tn': hd = ((hd + (b.s === 'D' ? -90 : 90)) % 360 + 360) % 360; return `regarde ${dirTexte(hd).slice(2)}`;
      case 'rot': { const a = ev(b.a, env); hd -= a; cap += a; return `tourne de ${M(a)}° (total ${cap}°)`; }
      default: throw new Error('bloc simple inconnu ' + b.t);
    }
  }
  /** exécute une liste de blocs ; top : on écrit une ligne du tableau par bloc ; calcs : textes accumulés dans une boucle */
  function exec(blocs, top, calcs, pre = '') {
    for (const b of blocs) {
      tick();
      if (b.t === 'rep') {
        const n = ev(b.n, env);
        for (let k = 1; k <= n; k++) {
          const c = []; exec(b.body, false, c); tours += top ? 1 : 0;
          if (top) row(`tour ${k} sur ${n}`, c.join(' ; ')); else calcs.push(...c);
        }
      } else if (b.t === 'jus') {
        if (top) row('avant le tour 1', verdict(b.c, env));
        let k = 0;
        while (!ev(b.c, env)) {
          tick(); k++;
          const c = []; exec(b.body, false, c); tours += top ? 1 : 0;
          if (top) row(`tour ${k}`, c.join(' ; ') + ' ; test : ' + verdict(b.c, env)); else calcs.push(...c);
        }
      } else if (b.t === 'si') {
        const v = ev(b.c, env), t = verdict(b.c, env);
        if (top) { row(`${pre}si ${tx(b.c)}`, t); exec(v ? b.a : (b.b || []), true, calcs, '→ '); } else { calcs.push(t); exec(v ? b.a : (b.b || []), false, calcs); }
      } else {
        const c = simple(b);
        if (top) row(pre + tb(b), c); else calcs.push(c);
      }
    }
  }
  let prev = snap();
  if (grille || tortue) row('départ', '');
  exec(prog, true, []);
  return { env, out, x, y, hd, cap, path, rows, cols, tours, grille, tortue, aVars, aDire };
}

/** table des valeurs successives (HTML) à partir du résultat de run() */
export function tableau(res, o = {}) {
  const { rows, cols } = res;
  const calc = o.calc ?? (res.aVars || res.tortue);
  const nom = { case: 'case', regarde: 'regarde', cap: 'cap total', dit: 'affiche' };
  const th = k => `<th>${nom[k] || `<i>${k}</i>`}</th>`;
  const lig = r => `<tr><td class="et">${r.label}</td>${calc ? `<td class="ca">${r.calc}</td>` : ''}${cols.map(k => { const v = r.snap[k]; return `<td${r.ch.has(k) && r.snap[k] !== undefined ? ' class="ch"' : ''}>${v === undefined ? '' : typeof v === 'number' ? M(v) : v}</td>`; }).join('')}</tr>`;
  return `<div class="trwrap"><table class="trace"><thead><tr><th>étape</th>${calc ? '<th>calcul</th>' : ''}${cols.map(th).join('')}</tr></thead><tbody>${rows.map(lig).join('')}</tbody></table></div>`;
}

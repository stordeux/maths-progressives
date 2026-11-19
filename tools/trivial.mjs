// Repère les exercices « triviaux » dans les énoncés générés : fraction n/n ou n/1, × 1, ÷ 1, + 0, × 0,
// a − a, a ÷ a, coefficient 1 écrit (1x). Sert à l'audit (node tools/trivial.mjs [module]) et aux tests.
import { setSeed } from '../engine/util/rand.js';

/** texte lisible de l'énoncé : fractions en n/d, sans SVG ni balises */
export function texte(html) {
  return String(html || '')
    .replace(/<svg[\s\S]*?<\/svg>/g, ' ')
    // numérateur ou dénominateur composé (« 1 + 3 ») : entre parenthèses, pour ne pas lire « 12/1 + 3 »
    .replace(/<span class="frac"><span>([^<]*)<\/span><span>([^<]*)<\/span><\/span>/g,
      (_, n, d) => ` ${/\s/.test(n.trim()) ? `(${n.trim()})` : n}/${/\s/.test(d.trim()) ? `(${d.trim()})` : d} `)
    .replace(/<sup>([^<]*)<\/sup>/g, (_, e) => (/\s/.test(e.trim()) ? `^(${e.trim()})` : '^' + e))
    .replace(/<[^>]+>/g, ' ').replace(/&nbsp;| | /g, ' ')
    .replace(/\s+/g, ' ').trim()
    .replace(/(\d) (?=\d{3}(?!\d))/g, '$1'); // 10 000 → 10000
}

const NB = '(?<![\\d,])';
export const MOTIFS = [
  ['n/n', new RegExp(`${NB}(\\d+) ?\\/ ?\\1(?![\\d,a-z])`)],
  ['n/1', new RegExp(`${NB}\\d+ ?\\/ ?1(?![\\d,])`)],
  // × 1 (pas « × 1/6 », ni l'écriture scientifique « 1 × 10^3 », ni un exposant « e^1 × »)
  ['× 1', /× ?1(?![\d,^/])|(?<![\d,^/x] ?)(?<![\d,^/x])(?<!\^−)1 ?×(?! ?10\^)/],
  ['÷ 1', /÷ ?1(?![\d,/])/],
  ['+ 0 / − 0', new RegExp(`[+−] ?0(?![\\d,])`)],
  ['× 0', new RegExp(`× ?0(?![\\d,])|${NB}0 ?×`)],
  // a − a et a ÷ a isolés : pas « 8 × 4 − 4 », ni « x^2 − 2x », ni « 3 − 3x », ni « 7^2 − 2 »
  ['a − a', { test: t => isole(t, '−') }],
  ['a ÷ a', { test: t => isole(t, '÷') }],
  // coefficient 1 écrit devant x (« 1x », « −1x »), pas « 1/x » ni « x^1 »
  ['1x', /(?<![\d,^/.])(?<![\d,^/] )−? ?1 ?x(?![\w^])/],
  // nombre mal arrondi affiché (−0,666667) : écrire une fraction ou arrondir proprement
  ['décimale longue', /,\d*([1-9])\1{3,}/],
];
/** cas tolérés : « module niveau » → motifs (ex. une suite arithmétique qui passe par 0) */
export const TOLERES = { 'suites 10': ['+ 0 / − 0'] };

function isole(t, op) {
  const re = new RegExp(`(\\d+(?:,\\d+)?) ${op} (\\d+(?:,\\d+)?)`, 'g');
  for (const m of t.matchAll(re)) {
    if (m[1] !== m[2]) continue;
    const avant = t.slice(Math.max(0, m.index - 2), m.index);
    const apres = t.slice(m.index + m[0].length, m.index + m[0].length + 2);
    const av = avant.replace(/ /g, '');
    // « 16 − 3 − 5 − 5 » : dans une suite de soustractions, « 5 − 5 » n'est pas un calcul isolé
    if (/[\d,^×÷./a-z]/i.test(av.slice(-1)) || /\^−$/.test(av) || (op === '−' && /−$/.test(av))) continue;
    if (/^[\d,^(/a-z]/i.test(apres) || /^ ?[×÷^]/.test(apres)) continue;
    return true;
  }
  return false;
}

/** proportion d'énoncés triviaux par motif pour un niveau */
export function audit(L, n = 300) {
  const c = {}; let tot = 0; const ex = {};
  for (let d = 0; d <= 5; d++) for (let s = 1; s <= n; s++) {
    setSeed(1000 * d + s);
    const q = L.generate(d); tot++;
    const t = texte(q.html) + ' | ' + texte(q.tpl || '');
    for (const [nom, re] of MOTIFS) if (re.test(t)) { c[nom] = (c[nom] || 0) + 1; ex[nom] ??= t.slice(0, 140); }
  }
  return { tot, c, ex };
}

if (process.argv[1] && process.argv[1].endsWith('trivial.mjs')) {
  const { READY } = await import('../modules/registry.js');
  const ids = process.argv.slice(2).length ? process.argv.slice(2) : READY.map(m => m.id).filter(i => i !== 'revision');
  for (const id of ids) {
    const { LEVELS } = await import(`../modules/${id}/levels.js`);
    LEVELS.forEach((L, i) => {
      const { tot, c, ex } = audit(L, 100);
      const k = Object.keys(c);
      if (k.length) console.log(`${id} ${i + 1} (${L.titre}) : ` + k.map(x => `${x} ${Math.round(100 * c[x] / tot)} %  « ${ex[x]} »`).join(' ; '));
    });
  }
}

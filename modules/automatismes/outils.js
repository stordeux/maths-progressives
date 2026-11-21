// Automatismes : outils communs (QCM à 4 réponses, niveaux assemblés à partir de « formes » d'exercices).
//
// Une FORME d'exercice = { id, dmin, titre, draw(d) → paramètres, build(p) → exercice, ex: paramètres fixes }.
//  - generate(d) tire une forme parmi celles dont dmin ≤ d, tire ses paramètres avec draw(d), puis build(p) ;
//  - cours() montre, pour CHAQUE forme du niveau, un exemple corrigé obtenu avec build(ex) : le cours et les exercices
//    partagent donc exactement le même énoncé, le même indice et la même correction (règle « un exemple par forme »).
// build(p) renvoie { html, visual?, good: {l, n}, bads: [{l, n, why}], hint, solution, indep? } :
//  - l = texte du choix, n = valeur comparable (nombre ou chaîne) pour que les 4 choix soient tous différents ;
//  - why = l'erreur typique qui mène à ce faux choix (message affiché si l'élève le choisit) ;
//  - indep() recalcule la valeur de la bonne réponse autrement (vérification indépendante des tests).
import { pick, shuffle, ri } from '../../engine/util/rand.js';
import { choiceCheck } from '../../engine/answers/checks.js';
import { r6, gcd } from '../../engine/util/arith.js';
import { M, F } from '../../engine/util/fmt.js';

export { M, F, gcd };
export { ri, pick, shuffle };

const key = n => (typeof n === 'number' ? String(r6(n)) : String(n));

/** exercice QCM complet (type 'choice') à partir de la description d'une forme */
export function qcm(s, form, fixe = false) {
  const seen = new Set([key(s.good.n)]), labels = new Set([s.good.l]), ch = [];
  for (const b of (fixe ? s.bads : shuffle([...s.bads]))) {
    if (ch.length >= 3) break;
    const k = key(b.n);
    if (seen.has(k) || labels.has(b.l) || /\d,\d{5,}/.test(b.l)) continue; // pas de décimale interminable parmi les choix
    seen.add(k); labels.add(b.l); ch.push(b);
  }
  if (ch.length < 3) throw new Error(`pas assez de distracteurs (${form}) : ${s.html}`);
  let all;
  if (fixe) { all = [...ch]; all.splice([...form].reduce((a, c) => a + c.charCodeAt(0), 0) % 4, 0, { ...s.good, ok: true }); } // cours : ordre fixe
  else all = shuffle([{ ...s.good, ok: true }, ...ch]);
  const E = String(all.findIndex(o => o.ok));
  const q = {
    type: 'choice', form, html: s.html, opts: all.map((o, i) => ({ v: String(i), l: o.l })),
    check: choiceCheck(E, { msg: c => { const b = all[+c]; return b && b.why ? `⚠️ ${b.why}` : ''; } }),
    expected: E, hint: s.hint, solution: s.solution,
    verify: s.indep ? e => key(all[+e].n) === key(s.indep()) : undefined,
  };
  if (s.visual) q.visual = s.visual;
  return q;
}

/** exemple corrigé d'une forme, pour le cours : mêmes choix que l'exercice, la bonne réponse marquée */
function exemple(f, num) {
  const q = qcm(f.build(f.ex), f.id, true);
  const lettres = 'ABCD';
  const choix = q.opts.map((o, i) => `<b>${lettres[i]}.</b> ${i === +q.expected ? '<b>' + o.l + ' ✓</b>' : o.l}`).join(' &nbsp;·&nbsp; ');
  return `<div class="ex" data-form="${f.id}"><span class="q">Exemple ${num} : ${f.titre}</span><br>${q.html}${q.visual || ''}<div class="choixex">${choix}</div><b>Réponse : ${q.opts[+q.expected].l}</b><br>${q.solution}</div>`;
}
/** tous les exemples d'une liste de formes */
export const exemples = forms => forms.map((f, i) => exemple(f, i + 1)).join('\n');

/**
 * Niveau : { titre, generate(d), cours(), forms }.
 *  c = { n, intro, def, visuel?, methode: [étapes], warn: [pièges], retenir }
 */
export function niveau(titre, forms, c) {
  const generate = d => {
    const ok = forms.filter(f => f.dmin <= d);
    const f = pick(ok);
    // un tirage qui ne laisse pas 3 distracteurs distincts (cas limite) est simplement retiré
    for (let k = 0; k < 40; k++) {
      try { return qcm(f.build(f.draw(d)), f.id); } catch (e) { if (!/pas assez de distracteurs/.test(e.message)) throw e; }
    }
    throw new Error(`forme ${f.id} : aucun tirage valide`);
  };
  const cours = () => `<h2>${c.n}. ${titre}</h2>
<p class="intro">${c.intro}</p>
<div class="def">${c.def}</div>
${c.visuel || ''}
<div class="methode"><b>Méthode</b><ol>${c.methode.map(x => `<li>${x}</li>`).join('')}</ol></div>
${exemples(forms)}
<div class="warn">${c.warn.map(x => '⚠️ ' + x).join('<br>')}</div>
<div class="retenir">À retenir : ${c.retenir}</div>`;
  return { titre, generate, cours, forms, classe: c.classe };
}

/* ---------- petits outils d'écriture ---------- */
export const sup = (b, e) => `${b}<sup>${String(e).replace('-', '−')}</sup>`;
export const big = s => `<div class="big">${s}</div>`;
export const pc = n => `${M(n)}&nbsp;%`;
/** nombre entier avec espace insécable pour les milliers : 45 000 000 */
export const ent = n => {
  const s = String(Math.abs(Math.round(n)));
  const g = s.replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
  return (n < 0 ? '−' : '') + g;
};
/** décimal français avec espaces fines pour la partie entière (1 234,5) */
export const dec = n => {
  const [i, f] = String(r6(Math.abs(n))).split('.');
  return (r6(n) < 0 ? '−' : '') + i.replace(/\B(?=(\d{3})+(?!\d))/g, ' ') + (f ? ',' + f : '');
};
/** fraction irréductible écrite : entier si d = 1 */
export const fr = (n, d) => { const g = gcd(n, d) || 1; n /= g; d /= g; if (d < 0) { n = -n; d = -d; } return { n, d }; };
export const Fr = (n, d) => { const r = fr(n, d); const s = r.n < 0 ? '−' : ''; const a = Math.abs(r.n); return r.d === 1 ? s + a : s + F(a, r.d); };
/** fraction non simplifiée écrite telle quelle */
export const Fx = (n, d) => (d === 1 ? String(n) : F(n, d));
/** vrai si a et b sont proches */
export const near = (a, b) => Math.abs(a - b) < 1e-9;
export const sum = a => a.reduce((s, x) => s + x, 0);
/** tire dans une liste sans remise */
export const some = (list, k) => shuffle([...list]).slice(0, k);

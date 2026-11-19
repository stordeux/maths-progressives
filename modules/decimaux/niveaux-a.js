// Nombres décimaux, niveaux 1 à 4 : valeur des chiffres, fractions décimales, droite graduée, comparaison.
// Les décimaux sont tirés en entiers ÷ 10^k (rd) ; chaque réponse est recalculée autrement (`value`, `verify`).
import { ri, pick, chance, shuffle, r6, approx, fx, f, nd, raw, rd, digitAt, tronque, numQ, big, slot } from './num.js';
import { numsCheck, choiceCheck } from '../../engine/answers/checks.js';
import { F } from '../../engine/util/fmt.js';
import { numTable, decLine, readLine, barre10, grille100 } from './draw.js';

export const ex = (q, body) => `<div class="ex"><span class="q">${q}</span><br>${body}</div>`;
const NOM = { '-3': 'millièmes', '-2': 'centièmes', '-1': 'dixièmes', 0: 'unités', 1: 'dizaines', 2: 'centaines', 3: 'milliers' };
const OPP = { '-1': 1, '-2': 2, '-3': 3, 1: -1, 2: -2, 3: -3 };
const ord = n => (n === 1 ? '1er' : n + 'e');
/** chiffre de x à la puissance p, lu dans le texte (calcul indépendant de digitAt) */
const strDigit = (x, p) => { const [ip, dp = ''] = raw(x).split(','); const c = p >= 0 ? ip[ip.length - 1 - p] : dp[-p - 1]; return c === undefined ? 0 : +c; };
/** nombre à chiffres tous différents (sans zéro en tête ni en queue) */
const distinctNum = (nI, k) => {
  for (;;) {
    const ds = shuffle([0, 1, 2, 3, 4, 5, 6, 7, 8, 9]).slice(0, nI + k);
    if (ds[0] === 0 || (k && ds[nI + k - 1] === 0)) continue;
    return r6(+(ds.slice(0, nI).join('') + (k ? '.' + ds.slice(nI).join('') : '')));
  }
};
const lt = '&lt;', gt = '&gt;';

/* ================= 1. valeur des chiffres ================= */
function L1(d) {
  const form = d < 1 ? 'chiffre' : d < 2 ? pick(['chiffre', 'rang']) : pick(['chiffre', 'rang', 'nombre']);
  if (form === 'chiffre') {
    const nI = d < 3 ? ri(1, 2) : ri(2, 4), k = d < 1 ? 2 : ri(2, 3);
    const x = rd(k, nI === 1 ? 1 : 10 ** (nI - 1), 10 ** nI - 1);
    const ps = [-1, -2, -3, 0, 1, 2, 3].filter(p => p >= -k && p <= nI - 1 && (d < 1 ? p < 0 : d < 3 ? p <= 0 : true));
    const p = pick(ps), E = digitAt(x, p), alt = OPP[p] !== undefined && (p < 0 ? nI > -p : k >= p) ? digitAt(x, OPP[p]) : null;
    return { ...numQ([E], strDigit(x, p), { tpl: `Le chiffre des ${NOM[p]} est {0}`, more: v => (alt !== null && v[0] === alt && alt !== E ? `Attention : tu as pris le chiffre des <b>${NOM[OPP[p]]}</b>. Les ${NOM[p]} sont ${p < 0 ? 'à droite' : 'à gauche'} de la virgule, les ${NOM[OPP[p]]} de l'autre côté.` : '') }),
      html: `Dans ${f(x)}, quel est le chiffre des <b>${NOM[p]}</b> ?`,
      visual: d < 2 ? numTable([{ s: fx(x, k) }]) : '',
      hint: p < 0 ? `Dans ${f(x)}, regarde à droite de la virgule : les chiffres sont, dans l'ordre, dixièmes, centièmes, millièmes. Pour les ${NOM[p]}, compte ${ord(-p)} chiffre après la virgule.` : p === 0 ? `Dans ${f(x)}, le chiffre des unités est celui qui est juste à gauche de la virgule.` : `Dans ${f(x)}, pars de la virgule vers la gauche : unités, dizaines, centaines, milliers. Pour les ${NOM[p]}, compte ${p + 1} chiffre${p ? 's' : ''} à gauche de la virgule.`,
      solution: `Dans ${f(x)}, le chiffre des ${NOM[p]} est <b>${E}</b> (voir le tableau de numération).`,
      afterVisual: numTable([{ s: fx(x, k) }], { hi: p }), replaceVisual: true };
  }
  if (form === 'rang') {
    const nI = d < 3 ? 2 : ri(2, 3), k = d < 3 ? ri(2, 3) : 3, x = distinctNum(nI, k);
    const all = []; for (let p = nI - 1; p >= -k; p--) all.push(p);
    const p = pick(all), others = shuffle(all.filter(q => q !== p)).slice(0, 3), ps = [p, ...others].sort((a, b) => b - a);
    const dg = digitAt(x, p), E = String(p);
    return { type: 'choice', opts: ps.map(q => ({ v: String(q), l: NOM[q] })), expected: E,
      check: choiceCheck(E, { msg: c => (OPP[p] !== undefined && +c === OPP[p] ? `Attention : le chiffre ${dg} est ${p < 0 ? 'à droite' : 'à gauche'} de la virgule : ne confonds pas ${NOM[p]} et ${NOM[OPP[p]]}.` : '') }),
      verify: e => strDigit(x, +e) === dg,
      html: `Dans ${f(x)}, le chiffre <b>${dg}</b> est le chiffre des…`,
      visual: d < 2 ? numTable([{ s: fx(x, k) }]) : '',
      hint: `Repère où se trouve le chiffre ${dg} de ${f(x)} par rapport à la virgule (à gauche ou à droite), puis compte son rang : à droite, dixièmes, centièmes, millièmes ; à gauche, unités, dizaines, centaines.`,
      solution: `Dans ${f(x)}, le chiffre ${dg} est ${p < 0 ? `à droite de la virgule, au ${ord(-p)} rang` : `${p === 0 ? 'juste à gauche de la virgule' : `à gauche de la virgule, au ${ord(p + 1)} rang en partant de la virgule`}`} : c'est le chiffre des <b>${NOM[p]}</b>.`,
      afterVisual: numTable([{ s: fx(x, k) }], { hi: p }), replaceVisual: true };
  }
  // nombre de dixièmes, centièmes, millièmes
  const u = d < 3 ? pick([-1, -2]) : pick([-1, -2, -3]), k = d < 3 ? -u : ri(1, -u), x = rd(k, 1, d < 3 ? 20 : 99);
  const ipart = Math.floor(x), t = 10 ** -u, E = Math.round(r6(x) * t);
  const sdigits = Number(raw(x).replace(',', '.').split('.')[0] + (raw(x).split(',')[1] || '').padEnd(-u, '0'));
  return { ...numQ([E], sdigits, { tpl: `Il y a {0} ${NOM[u]}`, more: v => (v[0] === r6(E / 10) && -u >= 2 ? `Tu as compté des <b>${NOM[u + 1]}</b>. Or 1 ${NOM[u + 1].slice(0, -1)} contient 10 ${NOM[u]}.` : v[0] === ipart && ipart !== E ? 'Tu as seulement compté les unités entières. N\'oublie pas les chiffres après la virgule.' : '') }),
    html: `Combien y a-t-il de <b>${NOM[u]}</b> dans ${f(x)} ?`,
    visual: d < 2 ? numTable([{ s: fx(x, k) }]) : '',
    hint: `1 unité contient ${t} ${NOM[u]}. Compte d'abord les ${NOM[u]} dans la partie entière (${ipart} unité${ipart > 1 ? 's' : ''} : ${ipart} × ${t}), puis ajoute ceux de la partie décimale de ${f(x)}.`,
    solution: `${ipart} unité${ipart > 1 ? 's' : ''} = ${ipart} × ${t} = ${ipart * t} ${NOM[u]}. La partie décimale (${f(r6(x - ipart))}) en fait ${E - ipart * t}. Au total : ${ipart * t} + ${E - ipart * t} = <b>${E}</b> ${NOM[u]}.` };
}
function C1() {
  return `<h2>1. Valeur des chiffres</h2>
<p class="intro">Dans un nombre décimal, la virgule sépare la partie entière de la partie décimale. Chaque chiffre a une valeur qui dépend de sa place.</p>
<div class="def">À gauche de la virgule : <b>unités, dizaines, centaines, milliers</b>. À droite : <b>dixièmes, centièmes, millièmes</b>.<br>Un dixième est 10 fois plus petit qu'une unité ; un centième est 10 fois plus petit qu'un dixième.</div>
<div class="methode"><b>Méthode</b><ol><li>Repère la virgule.</li><li>À droite, compte les rangs : 1er chiffre = dixièmes, 2<sup>e</sup> = centièmes, 3<sup>e</sup> = millièmes.</li><li>À gauche, compte depuis la virgule : unités, dizaines, centaines…</li><li>Pour compter des dixièmes (ou des centièmes) dans un nombre : 1 unité = 10 dixièmes = 100 centièmes.</li></ol></div>
${numTable([{ s: '38,745' }], { hi: -2 })}
${ex('Exemple 1 : dans 38,745, quel est le chiffre des centièmes ?', `Le 2<sup>e</sup> chiffre après la virgule est 4.<br>Le chiffre des centièmes est <b>4</b>.`)}
${ex('Exemple 2 : dans 4 256,38, quel est le chiffre des centaines ?', `À gauche de la virgule : 6 (unités), 5 (dizaines), 2 (centaines).<br>Le chiffre des centaines est <b>2</b>. Le chiffre des centièmes est 8.`)}
${ex('Exemple 3 : dans 38,745, le chiffre 7 est le chiffre des…', `Le 7 est à droite de la virgule, au 1<sup>er</sup> rang.<br>Le 7 est le chiffre des <b>dixièmes</b>.`)}
${ex('Exemple 4 : combien y a-t-il de dixièmes dans 3,7 ?', `3 unités = 3 × 10 = 30 dixièmes, et 7 dixièmes de plus : 30 + 7 = <b>37</b> dixièmes.`)}
${ex('Exemple 5 : combien y a-t-il de centièmes dans 2,5 ?', `2 unités = 200 centièmes ; 5 dixièmes = 50 centièmes. Au total : 200 + 50 = <b>250</b> centièmes.`)}
<div class="warn">⚠️ Ne confonds pas <b>dixièmes</b> et <b>dizaines</b>, <b>centièmes</b> et <b>centaines</b> : les « -ièmes » sont à droite de la virgule.<br>⚠️ Dans 3,07, le chiffre des dixièmes est 0.</div>
<div class="retenir">À retenir : à droite de la virgule, le 1er chiffre est celui des dixièmes, le 2<sup>e</sup> celui des centièmes, le 3<sup>e</sup> celui des millièmes.</div>`;
}

/* ================= 2. fractions décimales ↔ écriture décimale ================= */
const isPow10 = n => Number.isInteger(n) && n >= 10 && /^10*$/.test(String(n));
/** check d'une fraction décimale : accepte toute fraction égale dont le dénominateur est 10, 100, 1 000… */
const decFracCheck = (N, D, x) => {
  const fn = v => {
    const [n, dd] = v;
    if (dd === 0) return { ok: false, msg: 'Le dénominateur ne peut pas être 0.' };
    if (n * D !== N * dd) return { ok: false, msg: n === N && dd !== D ? `Le numérateur est bon, mais compte les chiffres après la virgule de ${f(x)} : le dénominateur est 1 suivi d'autant de zéros.` : dd === D ? `Le dénominateur est bon. Pour le numérateur, lis ${f(x)} sans la virgule.` : '' };
    if (!isPow10(dd)) return { ok: false, msg: 'C\'est égal, mais une <b>fraction décimale</b> a pour dénominateur 10, 100, 1 000…' };
    if (dd !== D) return { ok: true, msg: `Astuce : on peut aussi écrire ${F(N, D)}.` };
    return { ok: true };
  };
  fn.expected = [N, D];
  return fn;
};
function L2(d) {
  const pool = d < 1 ? ['fd'] : d < 2 ? ['fd', 'df', 'comp'] : ['fd', 'df', 'comp', 'dec'];
  const form = pick(pool);
  if (form === 'fd') {
    const q = d < 1 ? 1 : d < 2 ? ri(1, 2) : ri(1, 3), D = 10 ** q;
    let n;
    if (d < 1) n = ri(1, 9);
    else if (d >= 3 && chance(0.5)) { do { n = ri(1, D - 1); } while (n % 10 === 0); } else { do { n = ri(D + 1, D * 10 - 1); } while (n % 10 === 0); }
    if (d >= 4 && chance(0.4)) { do { n = ri(D * 10 + 1, D * 100 - 1); } while (n % 10 === 0); }
    const x = r6(n / D);
    const vis = n < 10 && q === 1 ? barre10(n) : q === 2 && n < 100 && d < 2 ? grille100(n) : '';
    return { ...numQ([x], Number(String(n).padStart(q + 1, '0').slice(0, -q) + '.' + String(n).padStart(q + 1, '0').slice(-q)), { tpl: `${F(n, D)} = {0}`, ctx: `Le dénominateur est ${fx(D, 0)} : la virgule se place ${q} rang${q > 1 ? 's' : ''} avant la fin du numérateur.` }),
      html: `Écris cette fraction décimale sous forme décimale :${big(F(n, D))}`, visual: d < 2 ? vis : '',
      hint: `Le dénominateur est ${fx(D, 0)} : diviser ${fx(n, 0)} par ${fx(D, 0)}, c'est décaler la virgule de ${q} rang${q > 1 ? 's' : ''} vers la gauche${n < D ? ` (il faudra ajouter des zéros, car ${fx(n, 0)} a moins de ${q + 1} chiffres)` : ''}.`,
      solution: `${F(n, D)} : on divise par ${fx(D, 0)}, la virgule recule de ${q} rang${q > 1 ? 's' : ''}.<br>${F(n, D)} = <b>${f(x)}</b>.` };
  }
  if (form === 'df') {
    const k = d < 1 ? 1 : d < 3 ? ri(1, 2) : ri(1, 3), x = d >= 3 && chance(0.4) ? rd(k, 1, 9) : chance(0.5) ? rd(k, 0, 0) : rd(k, 1, 9), D = 10 ** k, N = Math.round(r6(x) * D);
    return { type: 'frac', check: decFracCheck(N, D, x), expected: [N, D], value: x, keys: { comma: false },
      html: `Écris ${f(x)} sous la forme d'une <b>fraction décimale</b> :${big(`${f(x)} =`)}`,
      hint: `Combien y a-t-il de chiffres après la virgule dans ${f(x)} ? Le dénominateur est 1 suivi d'autant de zéros ; le numérateur est ${f(x)} écrit sans la virgule.`,
      solution: `${f(x)} a ${k} chiffre${k > 1 ? 's' : ''} après la virgule : le dénominateur est ${fx(D, 0)}.<br>On lit ${f(x)} sans la virgule : ${fx(N, 0)}. Donc ${f(x)} = <b>${F(fx(N, 0), fx(D, 0))}</b>.` };
  }
  if (form === 'comp') {
    const u = ri(1, d < 2 ? 9 : 20);
    const sel = d < 2 ? [10, 100] : shuffle([10, 100, 1000]).slice(0, ri(2, 3)).sort((p, q) => p - q);
    const terms = sel.map(D => [ri(1, 9), D]), rk = D => -Math.round(Math.log10(D));
    const x = r6(u + terms.reduce((s, [n, D]) => s + n / D, 0));
    const value = Number(`${u}.${[10, 100, 1000].map(D => { const t = terms.find(([, DD]) => DD === D); return t ? t[0] : '0'; }).join('')}`);
    const txt = [String(u)].concat(terms.map(([n, D]) => F(n, D))).join(' + ');
    return { ...numQ([x], value, { tpl: `${txt} = {0}`, comma: true, ctx: 'Chaque fraction a son rang : dixièmes, centièmes, millièmes.' }),
      html: `Écris sous forme décimale :${big(txt)}`,
      hint: `Place chaque terme dans le tableau de numération : ${terms.map(([n, D]) => `${F(n, fx(D, 0))} → ${n} ${NOM[rk(D)]}`).join(', ')}. Les rangs qui ne sont pas utilisés se remplissent avec des 0.`,
      solution: `${terms.map(([n, D]) => `${F(n, fx(D, 0))} = ${f(r6(n / D))}`).join(' ; ')}.<br>On place les chiffres : ${u} unité${u > 1 ? 's' : ''}${terms.map(([n, D]) => `, ${n} ${NOM[rk(D)]}`).join('')}.<br>Résultat : <b>${f(x)}</b>.`,
      afterVisual: numTable([{ s: fx(x, nd(x)) }]), replaceVisual: false };
  }
  // dec : décomposer un décimal
  const k = d < 3 ? 2 : 3, x = rd(k, 1, 20), a = digitAt(x, -1), b = digitAt(x, -2), c = k === 3 ? digitAt(x, -3) : null, U = Math.floor(x);
  const E = k === 3 ? [a, b, c] : [a, b];
  return { type: 'nums', tpl: `${f(x)} = ${U} + {0} dixièmes + {1} centièmes${k === 3 ? ' + {2} millièmes' : ''}`, expected: E, check: numsCheck(E, { msg: v => (E.every((e, i) => v[i] !== null && !approx(v[i], e)) ? 'Lis les chiffres après la virgule, un par un, de gauche à droite.' : '') }),
    value: strDigit(x, -k), keys: undefined,
    html: `Complète la décomposition de ${f(x)} :`,
    hint: `Les chiffres après la virgule de ${f(x)} se lisent dans l'ordre : le 1er est le nombre de dixièmes, le 2<sup>e</sup> le nombre de centièmes${k === 3 ? ', le 3<sup>e</sup> le nombre de millièmes' : ''}.`,
    solution: `${f(x)} = ${U} + ${a} dixièmes + ${b} centièmes${k === 3 ? ` + ${c} millièmes` : ''} = ${U} + ${F(a, 10)} + ${F(b, 100)}${k === 3 ? ' + ' + F(c, 1000) : ''}.`,
    afterVisual: numTable([{ s: fx(x, k) }]), replaceVisual: true };
}
function C2() {
  return `<h2>2. Fractions décimales et écriture décimale</h2>
<p class="intro">Une fraction décimale est une fraction dont le dénominateur est 10, 100, 1 000… Elle s'écrit facilement avec une virgule.</p>
<div class="def">${F(1, 10)} = 0,1 (un dixième) ; ${F(1, 100)} = 0,01 (un centième) ; ${F(1, 1000)} = 0,001 (un millième).<br>Pour passer de ${F('n', 100)} à l'écriture décimale, on <b>décale la virgule de 2 rangs vers la gauche</b> ; de ${F('n', 1000)}, de 3 rangs.</div>
<div class="methode"><b>Méthode</b><ol><li>Compte les zéros du dénominateur : c'est le nombre de chiffres après la virgule.</li><li>Écris le numérateur et place la virgule en comptant ce nombre de rangs depuis la droite.</li><li>S'il manque des chiffres, ajoute des zéros devant (7/100 = 0,07).</li></ol></div>
${grille100(37)}
${ex('Exemple 1 : écris 37/100 sous forme décimale', `Le dénominateur est 100 : 2 chiffres après la virgule.<br>${F(37, 100)} = <b>0,37</b>.<br>Autre cas : ${F(7, 100)} = <b>0,07</b> (on ajoute un zéro) et ${F(4305, 1000)} = <b>4,305</b>.`)}
${ex('Exemple 2 : écris 0,37 sous la forme d\'une fraction décimale', `Il y a 2 chiffres après la virgule : le dénominateur est 100. Le numérateur est 37.<br>0,37 = <b>${F(37, 100)}</b>.<br>Autre cas : 4,25 = <b>${F(425, 100)}</b>.`)}
${ex('Exemple 3 : écris 2 + 4/10 + 5/1000 sous forme décimale', `2 unités, 4 dixièmes, 0 centième, 5 millièmes.<br>2 + ${F(4, 10)} + ${F(5, 1000)} = <b>2,405</b> (le rang des centièmes est vide : on met 0).`)}
${ex('Exemple 4 : complète 3,52 = 3 + … dixièmes + … centièmes', `Les chiffres après la virgule : 5 puis 2.<br>3,52 = 3 + <b>5</b> dixièmes + <b>2</b> centièmes = 3 + ${F(5, 10)} + ${F(2, 100)}.`)}
<div class="warn">⚠️ ${F(7, 100)} n'est pas 0,7 : il faut 2 chiffres après la virgule, donc 0,07.<br>⚠️ Ne mets pas la virgule au hasard : compte les zéros du dénominateur.</div>
<div class="retenir">À retenir : autant de zéros au dénominateur, autant de chiffres après la virgule.</div>`;
}

/* ================= 3. droite graduée ================= */
function L3(d) {
  const form = d < 1 ? 'L1' : d < 2 ? pick(['L1', 'L2']) : d < 3 ? pick(['L1', 'L2', 'P1']) : d < 4 ? pick(['LC', 'P1', 'LL']) : d < 5 ? pick(['LC', 'PC', 'LL']) : pick(['LC', 'PC', 'LL', 'P1', 'L2']);
  // fenêtre : [min, max], pas
  let min, max, step, ends = 'ends';
  if (form === 'L1' || form === 'P1' || form === 'LL') { min = ri(0, form === 'LL' ? 20 : 9); max = min + 1; step = 0.1; }
  else if (form === 'L2') { min = ri(0, 8); max = min + 2; step = 0.1; ends = 'half'; }
  else { min = r6(ri(0, 9) + ri(0, 9) / 10); max = r6(min + 0.1); step = 0.01; }
  if (form === 'LL' && d >= 5 && chance(0.5)) { min = r6(ri(1, 9) + ri(1, 8) / 10); max = r6(min + 0.1); step = 0.01; }
  const N = Math.round((max - min) / step), k = nd(step), idx = () => ri(1, N - 1);
  const pos = i => r6(min + i * step);
  const sx = x => fx(x, k);
  const winTxt = `entre ${sx(min)} et ${sx(max)}`;
  if (form === 'P1' || form === 'PC') {
    const ids = shuffle([...Array(N - 1).keys()].map(i => i + 1)).slice(0, 4), L = ['A', 'B', 'C', 'D'], tgt = ri(0, 3);
    const marks = ids.map((i, j) => ({ x: pos(i), l: L[j], c: ['#e03131', '#1971c2', '#2b8a3e', '#9c36b5'][j] }));
    const vis = decLine({ min, max, step, marks, lab: ends });
    const x = pos(ids[tgt]), E = L[tgt], T = ids[tgt];
    const near = L.filter((_, j) => Math.abs(ids[j] - T) === 1).map(l => l);
    const rd0 = readLine(vis);
    return { type: 'choice', opts: L.map(l => ({ v: l, l })), expected: E, keys: undefined, visual: vis,
      verify: e => approx(rd0[L.indexOf(e)], x),
      check: choiceCheck(E, { msg: c => (near.includes(c) ? `Presque ! Tu es à <b>une graduation</b> du bon point : recompte depuis ${sx(min)}.` : '') }),
      html: `Quel point a pour abscisse <b>${sx(x)}</b> ?`,
      hint: `La droite est partagée en ${N} parts égales ${winTxt} : une graduation vaut ${sx(step)}. ${sx(x)} est à ${T} graduation${T > 1 ? 's' : ''} de ${sx(min)} : cherche le point à cette distance.`,
      solution: `Une graduation vaut ${sx(step)}. ${sx(x)} = ${sx(min)} + ${T} × ${sx(step)} : on compte ${T} graduation${T > 1 ? 's' : ''} depuis ${sx(min)}. C'est le point <b>${E}</b>.`,
      afterVisual: decLine({ min, max, step, marks: [{ x, l: sx(x), c: marks[tgt].c }, ...marks.filter((_, j) => j !== tgt)], lab: ends }), replaceVisual: true };
  }
  const two = form === 'LL';
  const ids = two ? (() => { let a, b; do { a = idx(); b = idx(); } while (Math.abs(a - b) < 2); return [a, b]; })() : [idx()];
  const names = ['A', 'B'], cols = ['#e03131', '#1971c2'];
  const vis = decLine({ min, max, step, marks: ids.map((i, j) => ({ x: pos(i), l: names[j], c: cols[j] })), lab: two ? 'ends' : ends });
  const E = ids.map(pos), got = readLine(vis);
  const tick = e => Math.round((e - min) / step);
  const msg = v => {
    for (let j = 0; j < E.length; j++) {
      const t = tick(E[j]);
      if (v[j] === null) continue;
      if (v[j] === t && !approx(t, E[j])) return `Tu as donné le nombre de graduations. Chaque graduation vaut ${sx(step)} : ajoute-les à ${sx(min)}.`;
      if (approx(v[j], r6(min + t * step * 10)) && !approx(v[j], E[j])) return `Une graduation vaut <b>${sx(step)}</b>, pas ${sx(r6(step * 10))}.`;
      if (approx(v[j], r6(min + t * step / 10)) && !approx(v[j], E[j])) return `Une graduation vaut <b>${sx(step)}</b>, pas ${sx(r6(step / 10))}.`;
    }
    return '';
  };
  return { ...numQ(E, got[got.length - 1], { tpl: two ? 'A : {0} <span class="sep">B :</span> {1}' : 'A a pour abscisse {0}', more: msg, comma: true }),
    html: two ? `Quelles sont les abscisses des points A et B ?` : `Quelle est l'abscisse du point A ?`, visual: vis,
    hint: `La droite est partagée en ${N} parts égales ${winTxt} : une graduation vaut ${sx(step)}. Compte les graduations depuis ${sx(min)} jusqu'au point${two ? ' (puis jusqu\'au second)' : ''}, et ajoute-les à ${sx(min)}.`,
    solution: ids.map((i, j) => `${names[j]} est à ${i} graduation${i > 1 ? 's' : ''} de ${sx(min)} : ${sx(min)} + ${i} × ${sx(step)} = <b>${sx(E[j])}</b>.`).join('<br>') };
}
function C3() {
  const a = decLine({ min: 3, max: 4, step: 0.1, marks: [{ x: 3.4, l: 'A' }], lab: 'ends' });
  return `<h2>3. Droite graduée : lire et placer un décimal</h2>
<p class="intro">Sur une droite graduée, un décimal a sa place exacte entre deux entiers. On la repère en comptant les graduations.</p>
<div class="def">Quand l'unité est partagée en <b>10 parts égales</b>, une graduation vaut <b>0,1</b> (un dixième). Quand un dixième est lui-même partagé en 10, une graduation vaut <b>0,01</b> (un centième).</div>
<div class="methode"><b>Méthode</b><ol><li>Lis les deux nombres écrits aux extrémités.</li><li>Compte les parts entre eux : cela donne la valeur d'une graduation.</li><li>Compte les graduations depuis l'extrémité de gauche jusqu'au point.</li><li>Ajoute : abscisse = nombre de gauche + (graduations × valeur d'une graduation).</li></ol></div>
${a}
${ex('Exemple 1 : lis l\'abscisse du point A (entre 3 et 4)', `La droite est partagée en 10 parts : une graduation vaut 0,1. A est à 4 graduations de 3.<br>A a pour abscisse 3 + 4 × 0,1 = <b>3,4</b>.`)}
${ex('Exemple 2 : lis l\'abscisse du point A (entre 6,3 et 6,4)', `Entre 6,3 et 6,4, la droite est partagée en 10 parts : une graduation vaut 0,01. A est à 7 graduations de 6,3.<br>A a pour abscisse 6,3 + 7 × 0,01 = <b>6,37</b>.`)}
${ex('Exemple 3 : lis les abscisses de A et B', `Entre 8 et 9, une graduation vaut 0,1. A est à 2 graduations de 8 : A = <b>8,2</b>. B est à 7 graduations : B = <b>8,7</b>.`)}
${ex('Exemple 4 : quel point a pour abscisse 4,3 (entre 4 et 5) ?', `Une graduation vaut 0,1. 4,3 est à 3 graduations de 4 : on compte 3 graduations depuis 4 et on repère le point : c'est le point <b>C</b> (celui qui est à 3 graduations de 4).`)}
<div class="warn">⚠️ Ne confonds pas dixièmes et centièmes : entre 3 et 4 une graduation vaut 0,1 (pas 0,01).<br>⚠️ Le point à 4 graduations après 3 est 3,4 et non 3,04 ni 4.</div>
<div class="retenir">À retenir : on commence toujours par trouver la valeur d'une graduation.</div>`;
}

/* ================= 4. comparer ================= */
/** fenêtre de droite graduée pour deux nombres (vide si trop de décimales) */
function cmpLine(a, b) {
  const m = Math.max(nd(a), nd(b));
  if (m > 2) return '';
  const lo = Math.min(a, b), hi = Math.max(a, b);
  if (m <= 1) {
    const mn = Math.floor(lo), mx = Math.max(Math.ceil(hi), mn + 1);
    if (mx - mn > 3) return decLine({ min: mn, max: mx, step: 1, marks: [{ x: a, l: f(a) }, { x: b, l: f(b), c: '#1971c2' }], lab: 'all' });
    return decLine({ min: mn, max: mx, step: 0.1, marks: a === b ? [{ x: a, l: f(a) }] : [{ x: a, l: f(a) }, { x: b, l: f(b), c: '#1971c2' }], lab: 'ends' });
  }
  let mn = r6(Math.floor(lo * 10 + 1e-9) / 10), mx = r6(Math.ceil(hi * 10 - 1e-9) / 10);
  if (mx <= mn) mx = r6(mn + 0.1);
  if (Math.round((mx - mn) * 100) > 20) return '';
  return decLine({ min: mn, max: mx, step: 0.01, marks: a === b ? [{ x: a, l: f(a) }] : [{ x: a, l: f(a) }, { x: b, l: f(b), c: '#1971c2' }], lab: 'ends' });
}
function pair4(d) {
  const dgt = () => ri(1, 9);
  if (d < 1) { const ia = ri(1, 30); let ib; do { ib = ri(1, 30); } while (ib === ia); return [rd(1, ia, ia), 1, rd(1, ib, ib), 1]; }
  if (d < 2) { const i = ri(1, 30), t = dgt(); let u; do { u = ri(0, 9); } while (u === t); return [r6(i + t / 10), 1, r6(i + u / 10), 1]; }
  if (d < 3) { const i = ri(0, 20), t = dgt(); let u; do { u = dgt(); } while (u === t); return [r6(i + t / 10), 1, r6(i + u / 10 + dgt() / 100), 2]; }
  if (d < 4) {
    const i = ri(0, 20), v = dgt(), t = dgt(), p = ri(0, 3);
    if (p === 0) return [r6(i + t / 10), 1, r6(i + t / 10), 2]; // égaux : 3,5 et 3,50
    if (p === 1) return [r6(i + v / 100), 2, r6(i + v / 10), 1]; // 4,07 et 4,7
    if (p === 2) return [r6(i + t / 10), 1, r6(i + t / 100), 2]; // 3,5 et 3,05
    return [r6(i + t / 10), 2, r6(i + t / 10 + v / 100), 2];
  }
  if (d < 5) {
    const i = ri(0, 120), a = rd(3, i, i), kb = ri(1, 3);
    let b;
    if (chance(0.5)) { b = tronque(a, -kb); if (b === a) b = r6(a - 10 ** -3); } else b = r6(a + ri(-3, 3) * 10 ** -ri(1, 3));
    if (b <= 0 || nd(b) > 3) b = r6(a + 0.01);
    return [a, 3, b, chance(0.5) ? Math.max(nd(b), 1) : 3];
  }
  const t = ri(0, 4);
  if (t === 0) { const n = ri(2, 30); return [n, 0, r6(n - 1 + 0.9 + dgt() / 100), 2]; }
  if (t === 1) { const n = ri(1, 9); return [r6(n / 10), 1, r6(n / 100), 2]; }
  if (t === 2) { const n = ri(2, 30); return [n, 0, r6(n + 0.1 * dgt()), 2]; }
  if (t === 3) { const i = ri(0, 9), v = dgt(); return [r6(i + v / 10), 3, r6(i + v / 10 + 0.001 * dgt()), 3]; }
  const i = ri(0, 9), v = dgt(), w = dgt(); return [r6(i + v / 10 + w / 100), 2, r6(i + v / 10 + w / 100), 3];
}
function L4(d) {
  let a, ka, b, kb;
  do { [a, ka, b, kb] = pair4(d); } while (nd(a) > ka || nd(b) > kb);
  if (chance(0.5)) [a, ka, b, kb] = [b, kb, a, ka];
  const sa = fx(a, ka), sb = fx(b, kb), K = Math.max(ka, kb);
  const A = Math.round(a * 1000), B = Math.round(b * 1000), X = A === B ? '=' : A > B ? '>' : '<';
  const H = { '<': lt, '>': gt, '=': '=' };
  const [ia, da = ''] = raw(a).split(','), [ib, db = ''] = raw(b).split(',');
  // erreur classique : comparer les parties décimales comme des entiers (ou la longueur)
  const naive = ia !== ib ? (+ia > +ib ? '>' : '<') : (+da === +db ? '=' : +da > +db ? '>' : '<');
  const value = Number(sa.replace(/[^\d,]/g, '').replace(',', '.')) - Number(sb.replace(/[^\d,]/g, '').replace(',', '.'));
  const msg = c => {
    if (c === X) return '';
    if (X === '=') return `Écrire des zéros à droite de la partie décimale ne change pas la valeur d'un nombre : ${sa} et ${sb} sont <b>égaux</b>.`;
    if (c === naive && ia === ib) return `Tu as comparé ${da || '0'} et ${db || '0'} comme des nombres entiers. Écris les deux avec ${K} décimale${K > 1 ? 's' : ''} : ${fx(a, K)} et ${fx(b, K)}, puis compare !`;
    return '';
  };
  const same = ia === ib;
  return { type: 'cmp', check: choiceCheck(X, { msg }), expected: X, value,
    html: `Compare ces deux nombres :${big(`${sa} ${slot} ${sb}`)}`,
    hint: same ? `Les parties entières de ${sa} et ${sb} sont égales (${ia}). Écris les deux nombres avec le même nombre de décimales (${fx(a, K)} et ${fx(b, K)}), puis compare-les chiffre par chiffre : dixièmes, centièmes…` : `Les parties entières de ${sa} et ${sb} sont différentes (${ia} et ${ib}) : c'est elles qui décident, inutile de regarder les chiffres après la virgule.`,
    solution: (same ? `Mêmes parties entières. On écrit ${fx(a, K)} et ${fx(b, K)} avec ${K} décimale${K > 1 ? 's' : ''} : ${K === 0 ? '' : `on compare ${fx(a, K).split(',')[1]} et ${fx(b, K).split(',')[1]} comme des entiers.`}` : `Parties entières différentes : ${ia} ${+ia > +ib ? gt : lt} ${ib}.`) + ` Donc ${sa} ${H[X]} ${sb}.`,
    afterVisual: cmpLine(a, b) };
}
function C4() {
  return `<h2>4. Comparer deux décimaux</h2>
<p class="intro">Quel nombre est le plus grand, 2,5 ou 2,45 ? Ce n'est pas celui qui a le plus de chiffres !</p>
<div class="def">Pour comparer deux décimaux : on compare d'abord les <b>parties entières</b> ; si elles sont égales, on compare les <b>dixièmes</b>, puis les <b>centièmes</b>, puis les <b>millièmes</b>…<br>On peut ajouter des zéros à droite de la partie décimale sans changer le nombre : 2,5 = 2,50.</div>
<div class="methode"><b>Méthode</b><ol><li>Compare les parties entières.</li><li>Si elles sont égales, écris les deux nombres avec le même nombre de décimales (ajoute des zéros).</li><li>Compare alors les parties décimales comme des entiers.</li><li>Écris &lt;, &gt; ou = : la pointe est tournée vers le plus petit.</li></ol></div>
${decLine({ min: 2.4, max: 2.6, step: 0.01, marks: [{ x: 2.45, l: '2,45', c: '#1971c2' }, { x: 2.5, l: '2,5' }], lab: 'ends' })}
${ex('Exemple 1 : compare 12,4 et 9,8', `Parties entières : 12 &gt; 9. Donc 12,4 <b>&gt;</b> 9,8.`)}
${ex('Exemple 2 : compare 5,7 et 5,2', `Parties entières égales. Dixièmes : 7 &gt; 2. Donc 5,7 <b>&gt;</b> 5,2.`)}
${ex('Exemple 3 : compare 2,5 et 2,45', `On écrit 2,50 et 2,45. Centièmes : 50 &gt; 45. Donc 2,5 <b>&gt;</b> 2,45 (même si 2,45 a plus de chiffres).`)}
${ex('Exemple 4 : compare 3,50 et 3,5', `Un zéro à droite de la partie décimale ne change rien : 3,50 <b>=</b> 3,5.<br>Autre cas : 4,07 et 4,7 → 4,07 et 4,70 : 07 &lt; 70, donc 4,07 <b>&lt;</b> 4,7.`)}
${ex('Exemple 5 : compare 5,347 et 5,34', `On écrit 5,347 et 5,340. Millièmes : 347 &gt; 340. Donc 5,347 <b>&gt;</b> 5,34.<br>Autre cas : 0,8 et 0,08 → 0,80 &gt; 0,08. Et 7 et 6,99 → 7,00 &gt; 6,99.`)}
<div class="warn">⚠️ 2,45 n'est <b>pas</b> plus grand que 2,5 « parce que 45 &gt; 5 » : on compare 45 centièmes à 50 centièmes.<br>⚠️ Plus de chiffres après la virgule ne veut pas dire plus grand : 0,125 &lt; 0,13.</div>
<div class="retenir">À retenir : même nombre de décimales d'abord, on compare ensuite chiffre par chiffre.</div>`;
}

export const A = [
  { titre: 'Valeur des chiffres', generate: L1, cours: C1, classe: '6e' },
  { titre: 'Fractions décimales et écriture décimale', generate: L2, cours: C2, classe: '6e' },
  { titre: 'Droite graduée', generate: L3, cours: C3, classe: '6e' },
  { titre: 'Comparer deux décimaux', generate: L4, cours: C4, classe: '6e' },
];

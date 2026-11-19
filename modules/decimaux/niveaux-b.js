// Nombres décimaux, niveaux 5 à 8 : encadrer et ranger, arrondir, additionner et soustraire, ×/÷ 10, 100, 1 000, 0,1, 0,01.
import { ri, pick, chance, shuffle, r6, approx, fx, f, nd, raw, rd, digitAt, tronque, exces, arrondi, commaMsg, mk, numQ, big } from './num.js';
import { numsCheck } from '../../engine/answers/checks.js';
import { numTable, decLine, posed } from './draw.js';
import { ex } from './niveaux-a.js';

const lt = '&lt;', gt = '&gt;';
const NOMP = { 0: 'unité', '-1': 'dixième', '-2': 'centième', '-3': 'millième' };
const AU = { 0: "à l'unité", '-1': 'au dixième', '-2': 'au centième' };
const pw = p => 10 ** p;

/* ================= 5. ranger et encadrer ================= */
/** fenêtre de droite graduée autour de x entre les deux bornes (au rang p) */
const encLine = (x, lo, hi, p) => decLine({ min: lo, max: hi, step: pw(p - 1), marks: [{ x, l: f(x) }], segs: [{ a: lo, b: hi, c: '#b2f2bb' }], lab: 'ends' });
function list5(n, d) {
  for (;;) {
    const same = d < 4 || chance(0.6), i0 = ri(0, d < 4 ? 20 : 120), xs = [];
    for (let g = 0; xs.length < n && g < 60; g++) {
      const k = ri(1, d < 3 ? 2 : 3), ip = same ? i0 : ri(0, d < 4 ? 20 : 120), x = rd(k, ip, ip);
      if (!xs.includes(x)) xs.push(x);
    }
    if (xs.length === n && new Set(xs.map(nd)).size >= 2) return xs;
  }
}
function L5(d) {
  const pool = d < 1 ? ['e0'] : d < 2 ? ['e0', 'e1'] : d < 3 ? ['e0', 'e1', 'cr'] : d < 4 ? ['e1', 'cr', 'in'] : d < 5 ? ['e1', 'cr', 'in', 'dc', 'e2'] : ['e2', 'cr', 'in', 'dc', 'e1'];
  const form = pick(pool);
  if (form === 'e0' || form === 'e1' || form === 'e2') {
    const p = form === 'e0' ? 0 : form === 'e1' ? -1 : -2;
    const k = form === 'e0' ? (d < 1 ? 1 : ri(1, 2)) : form === 'e1' ? ri(2, 3) : 3, x = rd(k, 1, d < 4 ? 99 : 999);
    const lo = tronque(x, p), hi = exces(x, p), E = [lo, hi];
    const cl = Math.ceil(Number(raw(x).replace(',', '.')) * 10 ** -p - 1e-9) / 10 ** -p; // borne haute lue autrement
    return { ...numQ(E, p === 0 ? Math.ceil(Number(raw(x).replace(',', '.'))) : cl, { tpl: `{0} ${lt} ${f(x)} ${lt} {1}`, comma: true, more: v => (v[0] !== null && v[1] !== null && !approx(v[1] - v[0], pw(p)) ? `Les deux bornes doivent se suivre : ${p === 0 ? 'deux entiers consécutifs' : `deux nombres qui diffèrent d'un ${NOMP[p]}`}.` : '') }),
      html: p === 0 ? `Encadre ${f(x)} entre deux entiers consécutifs :` : `Encadre ${f(x)} ${AU[p]} :`,
      hint: p === 0 ? `Cherche le plus grand entier inférieur à ${f(x)} (sa partie entière : ${Math.floor(x)}) ; l'autre borne est l'entier suivant.` : `Garde ${-p} chiffre${-p > 1 ? 's' : ''} après la virgule dans ${f(x)} pour la borne de gauche (sans arrondir) ; la borne de droite est ce nombre augmenté d'un ${NOMP[p]}.`,
      solution: `${f(lo)} est le plus grand nombre à ${-p} décimale${-p > 1 ? 's' : ''} inférieur à ${f(x)}, et ${f(hi)} le plus petit supérieur à ${f(x)} : <b>${f(lo)} ${lt} ${f(x)} ${lt} ${f(hi)}</b>.`,
      afterVisual: encLine(x, lo, hi, p), replaceVisual: true };
  }
  if (form === 'cr' || form === 'dc') {
    const n = form === 'cr' ? (d < 4 ? 3 : ri(3, 4)) : 4, xs = list5(n, d), up = form === 'cr';
    const sorted = [...xs].sort((a, b) => (up ? a - b : b - a)), K = Math.max(...xs.map(nd));
    let shown = [...xs]; do { shuffle(shown); } while (shown.every((x, i) => x === sorted[i]));
    const sign = up ? lt : gt, rev = [...sorted].reverse();
    const tpl = sorted.map((_, i) => `{${i}}`).join(` ${sign} `);
    const check = numsCheck(sorted, { msg: v => (v.every((x, i) => approx(x, rev[i])) ? `Tu as rangé dans l'ordre <b>${up ? 'décroissant' : 'croissant'}</b> : ${up ? 'croissant = du plus petit au plus grand' : 'décroissant = du plus grand au plus petit'}.` : [...v].sort((a, b) => a - b).every((x, i) => approx(x, [...sorted].sort((a, b) => a - b)[i])) ? `Tu as les bons nombres, mais pas dans le bon ordre. Écris-les avec ${K} décimale${K > 1 ? 's' : ''} pour les comparer.` : '') });
    return { type: 'nums', tpl, expected: sorted, check, keys: { comma: true }, verify: E => E.every((x, i) => i === 0 || (up ? x > E[i - 1] : x < E[i - 1])) && [...E].sort().join() === [...xs].sort().join(),
      html: `Range ces nombres dans l'ordre <b>${up ? 'croissant' : 'décroissant'}</b> (${up ? 'du plus petit au plus grand' : 'du plus grand au plus petit'}) :${big(shown.map(f).join(' ; '))}`,
      hint: `Ces nombres n'ont pas le même nombre de décimales : écris-les tous avec ${K} décimale${K > 1 ? 's' : ''} (par exemple ${f(shown[0])} devient ${fx(shown[0], K)}), puis compare-les comme des entiers.`,
      solution: `Avec ${K} décimale${K > 1 ? 's' : ''} : ${shown.map(x => fx(x, K)).join(' ; ')}.<br>Rangés ${up ? 'du plus petit au plus grand' : 'du plus grand au plus petit'} : <b>${sorted.map(f).join(` ${sign} `)}</b>.` };
  }
  // intercaler
  const t = d < 4 ? 0 : ri(0, 2);
  let a, b;
  if (t === 0) { a = rd(1, 0, 20); b = r6(a + 0.1); } else if (t === 1) { a = rd(2, 0, 20); b = r6(a + 0.01); } else { a = ri(1, 20); b = a + 1; }
  const K = Math.max(nd(a), nd(b)) + 1, mid = r6((a + b) / 2), E = [mid];
  const check = Object.assign(v => {
    const x = v[0];
    if (x === null) return { ok: false };
    if (x > a + 1e-9 && x < b - 1e-9) return { ok: true };
    return { ok: false, msg: approx(x, a) || approx(x, b) ? `${f(x)} est l'une des bornes : il faut un nombre <b>strictement</b> compris entre ${f(a)} et ${f(b)}.` : `${f(x)} n'est pas compris entre ${f(a)} et ${f(b)}.` };
  }, { expected: E });
  return { type: 'nums', tpl: `${f(a)} ${lt} {0} ${lt} ${f(b)}`, expected: E, check, keys: { comma: true }, verify: e => e[0] > a && e[0] < b,
    html: `Trouve un nombre décimal <b>strictement compris</b> entre ${f(a)} et ${f(b)} :`,
    hint: `Écris ${f(a)} et ${f(b)} avec ${K} décimale${K > 1 ? 's' : ''} (${fx(a, K)} et ${fx(b, K)}) : il y a de la place entre ces deux nombres. Choisis-en un.`,
    solution: `${fx(a, K)} ${lt} ${fx(mid, K)} ${lt} ${fx(b, K)} : par exemple <b>${f(mid)}</b> convient (d'autres réponses sont possibles : tout nombre strictement compris entre ${f(a)} et ${f(b)}).`,
    afterVisual: decLine({ min: a, max: b, step: r6((b - a) / 10), marks: [{ x: mid, l: f(mid), c: '#2b8a3e' }], lab: 'ends' }), replaceVisual: false };
}
function C5() {
  return `<h2>5. Ranger et encadrer</h2>
<p class="intro">Encadrer un nombre, c'est trouver deux nombres « voisins », l'un plus petit, l'autre plus grand. Ranger, c'est les mettre dans l'ordre.</p>
<div class="def"><b>Encadrer</b> x entre deux entiers consécutifs : n ${lt} x ${lt} n + 1. <b>Au dixième</b> : les deux bornes sont des nombres à 1 décimale qui se suivent (3,4 ${lt} 3,47 ${lt} 3,5). <b>Au centième</b> : 2 décimales.<br><b>Croissant</b> : du plus petit au plus grand. <b>Décroissant</b> : du plus grand au plus petit.</div>
<div class="methode"><b>Méthode</b><ol><li>Encadrer : garde les chiffres demandés (sans arrondir) pour la borne de gauche, ajoute un dixième (ou un centième) pour celle de droite.</li><li>Ranger : écris tous les nombres avec le même nombre de décimales, puis compare.</li><li>Intercaler : écris les bornes avec une décimale de plus et prends un nombre entre les deux.</li></ol></div>
${encLine(7.38, 7.3, 7.4, -1)}
${ex('Exemple 1 : encadre 7,38 entre deux entiers consécutifs', `Le plus grand entier inférieur à 7,38 est 7, le suivant est 8.<br><b>7 ${lt} 7,38 ${lt} 8</b>`)}
${ex('Exemple 2 : encadre 7,38 au dixième', `On garde 1 décimale : 7,3. La borne suivante : 7,3 + 0,1 = 7,4.<br><b>7,3 ${lt} 7,38 ${lt} 7,4</b>`)}
${ex('Exemple 3 : encadre 3,472 au centième', `On garde 2 décimales : 3,47 ; puis 3,47 + 0,01 = 3,48.<br><b>3,47 ${lt} 3,472 ${lt} 3,48</b>`)}
${ex('Exemple 4 : range dans l\'ordre croissant 4,5 ; 4,05 ; 4,45', `Avec 2 décimales : 4,50 ; 4,05 ; 4,45. Du plus petit au plus grand : 4,05 ; 4,45 ; 4,50.<br><b>4,05 ${lt} 4,45 ${lt} 4,5</b>`)}
${ex('Exemple 5 : range dans l\'ordre décroissant 0,8 ; 0,08 ; 0,75 ; 0,805', `Avec 3 décimales : 0,800 ; 0,080 ; 0,750 ; 0,805. Du plus grand au plus petit :<br><b>0,805 ${gt} 0,8 ${gt} 0,75 ${gt} 0,08</b>`)}
${ex('Exemple 6 : trouve un nombre entre 2,3 et 2,4', `On écrit 2,30 et 2,40 : on peut prendre 2,35.<br><b>2,3 ${lt} 2,35 ${lt} 2,4</b> (d'autres réponses conviennent : 2,31 ; 2,399…)<br>Entre 5 et 6 : 5,5 convient. Entre 2,71 et 2,72 : 2,715 convient.`)}
<div class="warn">⚠️ Encadrer n'est pas arrondir : on garde les chiffres, on n'arrondit pas.<br>⚠️ Entre 2,3 et 2,4 il y a des nombres : il y en a une infinité !<br>⚠️ 4,5 n'est pas plus petit que 4,45 « parce qu'il a moins de chiffres ».</div>
<div class="retenir">À retenir : pour ranger, on écrit les nombres avec le même nombre de décimales.</div>`;
}

/* ================= 6. arrondir ================= */
/** arrondi (r), troncature (d) ou valeur par excès (e) calculés sur le texte du nombre */
function roundStr(x, p, mode) {
  const [ip, dp = ''] = raw(x).split(','), q = -p, rest = dp.slice(q);
  let kept = Number(ip + dp.padEnd(q, '0').slice(0, q));
  const up = mode === 'r' ? rest[0] >= '5' : mode === 'e' ? /[1-9]/.test(rest) : false;
  if (up) kept += 1;
  const s = String(kept).padStart(q + 1, '0');
  return Number(q ? s.slice(0, s.length - q) + '.' + s.slice(s.length - q) : s);
}
const winLine = (x, p, E) => {
  const t = tronque(x, p), marks = [{ x, l: f(x) }];
  if (E !== undefined) marks.push({ x: E, l: '', c: '#2b8a3e' });
  return decLine({ min: t, max: r6(t + pw(p)), step: pw(p - 1), marks, lab: 'ends' });
};
function L6(d) {
  const form = d < 3 ? 'r' : pick(['r', 'r', 'def', 'exc']);
  const p = d < 1 ? 0 : d < 2 ? pick([0, -1]) : pick([0, -1, -2]);
  let x, tries = 0;
  do {
    const k = p === 0 ? ri(1, 2) : p === -1 ? ri(2, 3) : 3;
    x = rd(k, d < 4 ? 0 : 100, d < 4 ? 30 : 4999); tries++;
  } while (form === 'r' && d >= 3 && tries < 200 && chance(0.6) && !(digitAt(x, p) === 9 && digitAt(x, p - 1) >= 5));
  const mode = form === 'r' ? 'r' : form === 'def' ? 'd' : 'e';
  const E = mode === 'r' ? arrondi(x, p) : mode === 'd' ? tronque(x, p) : exces(x, p);
  const t = tronque(x, p), e = exces(x, p), nxt = digitAt(x, p - 1);
  const tpl = form === 'r' ? `${f(x)} ≈ {0}` : form === 'def' ? 'Valeur approchée par défaut : {0}' : 'Valeur approchée par excès : {0}';
  const html = form === 'r' ? `Arrondis ${f(x)} <b>${AU[p]}</b>.` : `Donne la valeur approchée <b>par ${form === 'def' ? 'défaut' : 'excès'}</b> de ${f(x)} ${AU[p]}.`;
  const more = v => {
    if (v[0] === null || approx(v[0], E)) return '';
    if (form === 'r' && approx(v[0], t) && t !== E) return `Tu as <b>tronqué</b> (coupé) le nombre. Regarde le chiffre suivant (${nxt}) : s'il est 5 ou plus, on augmente le dernier chiffre gardé.`;
    if (form === 'r' && approx(v[0], e) && e !== E) return `Le chiffre suivant est ${nxt}, donc inférieur à 5 : on ne l'augmente pas, on garde ${f(t)}.`;
    if (form === 'def' && approx(v[0], e)) return `${f(e)} est la valeur par <b>excès</b> (la plus grande). Par défaut, c'est la plus petite des deux bornes.`;
    if (form === 'exc' && approx(v[0], t)) return `${f(t)} est la valeur par <b>défaut</b> (la plus petite). Par excès, c'est la plus grande des deux bornes.`;
    return '';
  };
  const hint = form === 'r' ? `Dans ${f(x)}, repère le chiffre des ${p === 0 ? 'unités' : p === -1 ? 'dixièmes' : 'centièmes'} (${digitAt(x, p)}), puis regarde le chiffre juste à sa droite : de 0 à 4 on garde, de 5 à 9 on ajoute 1 au chiffre gardé.`
    : `Encadre d'abord ${f(x)} ${AU[p]} : ${f(t)} ${lt} ${f(x)} ${lt} ${f(e)}. La valeur par défaut est la plus petite des deux bornes, la valeur par excès la plus grande.`;
  return { ...numQ([E], roundStr(x, p, mode), { tpl, comma: p !== 0 || nd(E) > 0, more }), keys: { comma: true },
    html, visual: d < 3 ? winLine(x, p) : '',
    hint,
    solution: form === 'r' ? `Le chiffre ${nxt === 0 ? '0' : nxt} qui suit ${p === 0 ? 'les unités' : p === -1 ? 'les dixièmes' : 'les centièmes'} est ${nxt >= 5 ? 'au moins 5' : 'inférieur à 5'} : on ${nxt >= 5 ? 'ajoute 1 au dernier chiffre gardé' : 'garde le dernier chiffre tel quel'}.<br>${f(x)} ≈ <b>${fx(E, Math.max(0, -p))}</b> (${f(t)} ${lt} ${f(x)} ${lt} ${f(e)}, et ${f(x)} est plus proche de ${f(E)}).` : `${f(t)} ${lt} ${f(x)} ${lt} ${f(e)}. Par ${form === 'def' ? 'défaut' : 'excès'}, on prend <b>${fx(E, Math.max(0, -p))}</b>.`,
    afterVisual: winLine(x, p, E), replaceVisual: true };
}
function C6() {
  return `<h2>6. Arrondir un décimal</h2>
<p class="intro">Souvent, on n'a pas besoin de tous les chiffres : 3,478 m, c'est « à peu près » 3,5 m. Arrondir, c'est remplacer un nombre par un nombre plus simple et le plus proche possible.</p>
<div class="def">Pour arrondir <b>au dixième</b> (au centième, à l'unité…), on regarde le chiffre <b>juste après</b> : de 0 à 4, on garde ; de 5 à 9, on ajoute 1 au dernier chiffre gardé.<br>La valeur approchée <b>par défaut</b> est la plus petite des deux bornes de l'encadrement, <b>par excès</b> la plus grande.</div>
<div class="methode"><b>Méthode</b><ol><li>Repère le chiffre du rang demandé (unités, dixièmes ou centièmes).</li><li>Regarde le chiffre juste à sa droite.</li><li>0, 1, 2, 3, 4 : on garde. 5, 6, 7, 8, 9 : on ajoute 1.</li><li>On supprime tous les chiffres suivants (mais on garde le zéro final demandé : 4,0).</li></ol></div>
${winLine(3.478, -2, 3.48)}
${ex('Exemple 1 : arrondis 7,38 à l\'unité', `Chiffre des unités : 7 ; chiffre suivant : 3 (&lt; 5). On garde.<br>7,38 ≈ <b>7</b>`)}
${ex('Exemple 2 : arrondis 7,38 au dixième', `Chiffre des dixièmes : 3 ; chiffre suivant : 8 (≥ 5). On ajoute 1 : 4.<br>7,38 ≈ <b>7,4</b>`)}
${ex('Exemple 3 : arrondis 3,478 au centième', `Chiffre des centièmes : 7 ; chiffre suivant : 8 (≥ 5). On ajoute 1 : 8.<br>3,478 ≈ <b>3,48</b>`)}
${ex('Exemple 4 : arrondis 3,96 au dixième (le chiffre est un 9)', `Chiffre des dixièmes : 9 ; chiffre suivant : 6 (≥ 5). 9 + 1 = 10 : on retient 1 pour les unités.<br>3,96 ≈ <b>4</b> (on peut écrire 4,0).`)}
${ex('Exemple 5 : valeur approchée de 3,478 au centième, par défaut puis par excès', `3,47 ${lt} 3,478 ${lt} 3,48.<br>Valeur approchée par défaut : <b>3,47</b>.<br>Valeur approchée par excès : <b>3,48</b>.`)}
<div class="warn">⚠️ Arrondir n'est pas couper : 3,478 au centième n'est pas 3,47, mais 3,48.<br>⚠️ On ne regarde que le chiffre juste après, pas tous les suivants : 2,349 au dixième → on regarde 4, donc 2,3.<br>⚠️ Par défaut et par excès ne sont pas toujours l'arrondi.</div>
<div class="retenir">À retenir : on regarde le chiffre suivant : 0 à 4 on garde, 5 à 9 on augmente.</div>`;
}

/* ================= 7. additionner et soustraire ================= */
const scaled = (x, K) => Math.round(r6(x) * 10 ** K);
const hasCarry = (a, b, K) => { let A = scaled(a, K), B = scaled(b, K), c = 0; while (A > 0 || B > 0) { const s = (A % 10) + (B % 10) + c; c = s >= 10 ? 1 : 0; if (c) return true; A = Math.floor(A / 10); B = Math.floor(B / 10); } return false; };
const hasBorrow = (a, b, K) => { let A = scaled(a, K), B = scaled(b, K), c = 0; while (A > 0 || B > 0) { const s = (A % 10) - (B % 10) - c; c = s < 0 ? 1 : 0; if (c) return true; A = Math.floor(A / 10); B = Math.floor(B / 10); } return false; };
function L7(d) {
  const pool = d < 3 ? ['add', 'sub'] : d < 4 ? ['add', 'sub', 'comp'] : ['add', 'sub', 'comp', 'add3'];
  const form = pick(pool);
  if (form === 'comp') {
    const T = pick([1, 10, 100].filter(t => t > 1 || d >= 3)), a = rd(ri(1, 2), 0, T === 1 ? 0 : T === 10 ? 9 : 99);
    const E = r6(T - a);
    return { ...numQ([E], r6((T * 1000 - Math.round(a * 1000)) / 1000), { tpl: `${f(a)} + {0} = ${fx(T, 0)}`, comma: true, ctx: `Vérifie : ${f(a)} + ton résultat doit faire ${fx(T, 0)}.` }),
      html: `Complète pour obtenir ${fx(T, 0)} :`,
      hint: `Pour trouver ce qui manque à ${f(a)} pour aller jusqu'à ${fx(T, 0)}, calcule la soustraction ${fx(T, 0)} − ${f(a)}. Écris ${fx(T, 0)} avec ${nd(a)} décimale${nd(a) > 1 ? 's' : ''} (${fx(T, nd(a))}) pour poser le calcul.`,
      solution: `${fx(T, 0)} − ${f(a)} = <b>${f(E)}</b>. Vérification : ${f(a)} + ${f(E)} = ${fx(T, 0)}.`,
      afterVisual: posed('−', String(T), raw(a), raw(E)), replaceVisual: true };
  }
  if (form === 'add3') {
    const a = rd(ri(1, 2), 1, d < 5 ? 30 : 300), b = rd(ri(1, 2), 1, d < 5 ? 30 : 300), c = rd(ri(1, 2), 1, 30), E = r6(a + b + c), ab = r6(a + b);
    const K = Math.max(nd(a), nd(b), nd(c));
    return { ...numQ([E], r6((scaled(a, 3) + scaled(b, 3) + scaled(c, 3)) / 1000), { tpl: 'Résultat : {0}', ctx: 'Aligne bien les virgules à chaque addition.' }),
      html: `Calcule : ${big(`${f(a)} + ${f(b)} + ${f(c)}`)}`,
      hint: `Additionne deux nombres à la fois, en alignant les virgules : d'abord ${f(a)} + ${f(b)}, puis ajoute ${f(c)} au résultat.`,
      solution: `${f(a)} + ${f(b)} = ${f(ab)}, puis ${f(ab)} + ${f(c)} = <b>${f(E)}</b>.`,
      afterVisual: posed('+', raw(ab), raw(c), raw(E)), replaceVisual: true };
  }
  const add = form === 'add';
  let ka, kb, lo, hi;
  if (d < 1) { ka = kb = 1; lo = 1; hi = 9; } else if (d < 2) { ka = kb = pick([1, 2]); lo = 1; hi = 30; } else if (d < 3) { [ka, kb] = pick([[1, 2], [2, 1], [1, 3], [3, 1], [2, 3]]); lo = 1; hi = 30; } else if (d < 5) { [ka, kb] = pick([[0, 2], [2, 0], [0, 1], [1, 0], [2, 1], [1, 2]]); lo = 1; hi = 99; } else { [ka, kb] = pick([[3, 2], [2, 3], [3, 1], [3, 0], [0, 3], [3, 3]]); lo = 1; hi = 300; }
  let a, b, tries = 0;
  do {
    a = rd(ka, lo, hi); b = rd(kb, lo, hi); tries++;
    if (!add && a < b) [a, b, ka, kb] = [b, a, kb, ka];
  } while (tries < 300 && (a === b || (d < 1 && (add ? hasCarry(a, b, 1) : hasBorrow(a, b, 1))) || (d >= 1 && d < 2 && chance(0.7) && (add ? !hasCarry(a, b, 2) : !hasBorrow(a, b, 2)))));
  const K = Math.max(nd(a), nd(b)), E = add ? r6(a + b) : r6(a - b);
  const sa = f(a), sb = f(b);
  const ints = String(raw(a)).replace(',', ''), intsB = String(raw(b)).replace(',', '');
  const misal = add ? r6((Number(ints) + Number(intsB)) / 10 ** K) : null;
  const colSwap = !add ? (() => { const A = String(scaled(a, K)).padStart(12, '0'), B = String(scaled(b, K)).padStart(12, '0'); let s = ''; for (let i = 0; i < 12; i++) s += Math.abs(+A[i] - +B[i]); return r6(Number(s) / 10 ** K); })() : null;
  const more = v => {
    if (v[0] === null || approx(v[0], E)) return '';
    if (add && nd(a) !== nd(b) && approx(v[0], misal)) return `Les virgules ne sont pas alignées : ${sa} et ${sb} n'ont pas le même nombre de décimales. Écris ${fx(a, K)} et ${fx(b, K)}, chiffre sous chiffre.`;
    if (!add && approx(v[0], colSwap)) return `Dans une colonne, on ne peut pas soustraire un grand chiffre à un petit : il faut une <b>retenue</b> (emprunter 1 à la colonne de gauche).`;
    return '';
  };
  return { ...numQ([E], r6((scaled(a, 3) + (add ? 1 : -1) * scaled(b, 3)) / 1000), { tpl: 'Résultat : {0}', more, ctx: 'Les virgules restent alignées l\'une sous l\'autre.' }),
    html: `Calcule : ${big(`${sa} ${add ? '+' : '−'} ${sb}`)}`,
    visual: d < 2 ? posed(add ? '+' : '−', raw(a), raw(b)) : '',
    hint: `Pose le calcul en alignant les virgules l'une sous l'autre${nd(a) !== nd(b) ? ` : complète avec des zéros (${fx(a, K)} et ${fx(b, K)})` : ''}. Calcule colonne par colonne en partant de la droite${add ? ', avec les retenues' : ', en empruntant si le chiffre du haut est trop petit'}.`,
    solution: `On aligne les virgules : ${fx(a, K)} ${add ? '+' : '−'} ${fx(b, K)} = <b>${f(E)}</b>.`,
    afterVisual: posed(add ? '+' : '−', raw(a), raw(b), raw(E)), replaceVisual: true };
}
function C7() {
  return `<h2>7. Additionner et soustraire des décimaux</h2>
<p class="intro">On additionne et on soustrait des décimaux comme des entiers, à condition d'aligner les virgules.</p>
<div class="def">On écrit les nombres <b>l'un sous l'autre, virgule sous virgule</b>. On complète avec des zéros pour avoir le même nombre de décimales. Puis on calcule colonne par colonne, de droite à gauche, et on place la virgule du résultat sous les autres.</div>
<div class="methode"><b>Méthode</b><ol><li>Aligne les virgules (unités sous unités, dixièmes sous dixièmes…).</li><li>Ajoute des zéros pour avoir autant de décimales.</li><li>Calcule colonne par colonne, avec les retenues.</li><li>Place la virgule dans le résultat, sous les autres.</li></ol></div>
${posed('+', '3,5', '2,48', '5,98')}
${ex('Exemple 1 : calcule 3,5 + 2,48', `On écrit 3,50 + 2,48. Centièmes : 0 + 8 = 8. Dixièmes : 5 + 4 = 9. Unités : 3 + 2 = 5.<br>3,5 + 2,48 = 5,98.<br>Résultat : <b>5,98</b>`)}
${ex('Exemple 2 : calcule 7,2 − 3,45 (avec retenue)', `On écrit 7,20 − 3,45. Centièmes : 0 − 5 impossible, on emprunte : 10 − 5 = 5. Dixièmes : 1 − 4 impossible, on emprunte : 11 − 4 = 7. Unités : 6 − 3 = 3.<br>7,2 − 3,45 = 3,75.<br>Résultat : <b>3,75</b>`)}
${ex('Exemple 3 : calcule 12 + 3,45 (un nombre entier)', `Un entier a une virgule « cachée » : 12 = 12,00. On écrit 12,00 + 3,45.<br>Résultat : <b>15,45</b>.<br>Autre cas : 10 − 3,6 = 10,0 − 3,6.<br>Résultat : <b>6,4</b>.`)}
${ex('Exemple 4 : complète 4,6 + … = 10', `Ce qu'il manque se calcule par une soustraction : 10 − 4,6 = 10,0 − 4,6 = 5,4.<br>4,6 + <b>5,4</b> = 10. (De même : 0,35 + <b>0,65</b> = 1 et 7,1 + <b>92,9</b> = 100.)`)}
${ex('Exemple 5 : calcule 3,5 + 12,07 + 0,248', `On additionne deux nombres à la fois : 3,5 + 12,07 = 15,57, puis 15,57 + 0,248.<br>Résultat : <b>15,818</b>.`)}
<div class="warn">⚠️ 3,5 + 2,48 n'est pas 2,83 : 5 dixièmes ne s'additionnent pas avec 8 centièmes. Il faut écrire 3,50.<br>⚠️ Ne soustrais pas « le petit chiffre au grand » : s'il manque, emprunte 1 à la colonne de gauche.</div>
<div class="retenir">À retenir : virgule sous virgule, et des zéros pour compléter.</div>`;
}

/* ================= 8. multiplier et diviser par 10, 100, 1 000, 0,1, 0,01 ================= */
/** décale la virgule de s rangs vers la droite (s < 0 : vers la gauche), en travaillant sur le texte */
function shiftStr(x, s) {
  const [ip, dp = ''] = raw(x).split(',');
  let digits = ip + dp, pos = ip.length + s;
  if (pos <= 0) { digits = '0'.repeat(1 - pos) + digits; pos = 1; } else if (pos > digits.length) digits = digits.padEnd(pos, '0');
  return Number(digits.slice(0, pos) + (digits.length > pos ? '.' + digits.slice(pos) : ''));
}
const shTable = (x, y, cap, links = true) => (Math.floor(Math.max(x, y)).toString().length <= 5 ? numTable([{ s: fx(x, nd(x)) }, { s: fx(y, nd(y)) }], { links, cap }) : '');
function L8(d) {
  const pool = d < 1 ? ['mul'] : d < 3 ? ['mul', 'div'] : d < 4 ? ['mul', 'div', 'comp'] : d < 5 ? ['mul', 'div', 'comp', 'm01'] : ['mul', 'div', 'comp', 'm01', 'd01'];
  const form = pick(pool);
  const ms = d < 1 ? [1] : d < 2 ? [1, 2] : [1, 2, 3], tpl = 'Résultat : {0}';
  const rk = (m, dir) => `${m} rang${m > 1 ? 's' : ''} vers la ${dir}`;
  if (form === 'mul') {
    const m = pick(ms), k = ri(0, 2), x = k ? rd(k, 1, 99) : ri(2, 99), E = r6(x * 10 ** m), D = fx(10 ** m, 0);
    return { ...numQ([E], shiftStr(x, m), { tpl, comma: true, ctx: `Multiplier par ${D}, c'est décaler la virgule de ${rk(m, 'droite')}.`, more: v => (approx(v[0], x) ? `Le nombre n'a pas changé ! Multiplier par ${D} décale les chiffres : on ne se contente pas de rajouter des zéros après la virgule.` : '') }),
      html: `Calcule : ${big(`${f(x)} × ${D}`)}`, visual: d < 2 ? shTable(x, E, `× ${D} : chaque chiffre se décale de ${rk(m, 'gauche')}`) : '',
      hint: `Multiplier ${f(x)} par ${D}, c'est décaler chaque chiffre de ${rk(m, 'gauche')} (la virgule avance de ${m} rang${m > 1 ? 's' : ''} vers la droite). S'il manque des chiffres, on ajoute des zéros.`,
      solution: `× ${D} : la virgule avance de ${m} rang${m > 1 ? 's' : ''} vers la droite.<br>${f(x)} × ${D} = <b>${f(E)}</b>.`,
      afterVisual: shTable(x, E, `× ${D} : chaque chiffre se décale de ${rk(m, 'gauche')}`), replaceVisual: true };
  }
  if (form === 'div') {
    const m = pick(ms), kmax = 3 - m, k = ri(0, Math.min(2, kmax)), x = k ? rd(k, 1, 999) : ri(2, 999), E = r6(x / 10 ** m), D = fx(10 ** m, 0);
    return { ...numQ([E], shiftStr(x, -m), { tpl, comma: true, ctx: `Diviser par ${D}, c'est décaler la virgule de ${rk(m, 'gauche')}.`, more: v => (approx(v[0], x) ? `Le nombre n'a pas changé ! Diviser par ${D} décale les chiffres vers la droite de ${m} rang${m > 1 ? 's' : ''}.` : '') }),
      html: `Calcule : ${big(`${f(x)} ÷ ${D}`)}`, visual: d < 2 ? shTable(x, E, `÷ ${D} : chaque chiffre se décale de ${rk(m, 'droite')}`) : '',
      hint: `Diviser ${f(x)} par ${D}, c'est décaler chaque chiffre de ${rk(m, 'droite')} (la virgule recule de ${m} rang${m > 1 ? 's' : ''}). S'il manque des chiffres devant, on ajoute des zéros (0,0…).`,
      solution: `÷ ${D} : la virgule recule de ${m} rang${m > 1 ? 's' : ''} vers la gauche.<br>${f(x)} ÷ ${D} = <b>${f(E)}</b>.`,
      afterVisual: shTable(x, E, `÷ ${D} : chaque chiffre se décale de ${rk(m, 'droite')}`), replaceVisual: true };
  }
  if (form === 'comp') {
    const m = pick(ms), mulFirst = chance(0.5);
    if (mulFirst) {
      const k = ri(1, 2), x = rd(k, 1, 99), y = r6(x * 10 ** m);
      return { ...numQ([10 ** m], 10 ** m, { tpl: `${f(x)} × {0} = ${f(y)}`, ctx: '' }), expected: [10 ** m], check: mk([10 ** m], v => (v[0] !== null && [10, 100, 1000].includes(v[0]) ? `Compte de combien de rangs la virgule a avancé entre ${f(x)} et ${f(y)}.` : ''), ''),
        html: `Complète avec 10, 100 ou 1 000 :`, hint: `Les chiffres de ${f(x)} et de ${f(y)} sont les mêmes : de combien de rangs la virgule a-t-elle avancé ? Ce nombre de rangs est le nombre de zéros du multiplicateur.`,
        solution: `La virgule avance de ${m} rang${m > 1 ? 's' : ''} : on a multiplié par ${fx(10 ** m, 0)}. ${f(x)} × <b>${fx(10 ** m, 0)}</b> = ${f(y)}.`, afterVisual: shTable(x, y, `× ${fx(10 ** m, 0)} : ${m} rang${m > 1 ? 's' : ''} vers la gauche`), replaceVisual: true };
    }
    const k = ri(0, Math.min(2, 3 - m)), y = k ? rd(k, 1, 99) : ri(2, 99), x = r6(y * 10 ** m);
    return { ...numQ([10 ** m], 10 ** m, { tpl: `${f(x)} ÷ {0} = ${f(r6(x / 10 ** m))}`, ctx: '' }), check: mk([10 ** m], v => (v[0] !== null && [10, 100, 1000].includes(v[0]) ? `Compte de combien de rangs la virgule a reculé entre ${f(x)} et ${f(y)}.` : ''), ''),
      html: `Complète avec 10, 100 ou 1 000 :`, hint: `Les chiffres de ${f(x)} et de ${f(y)} sont les mêmes : de combien de rangs la virgule a-t-elle reculé ? Ce nombre de rangs est le nombre de zéros du diviseur.`,
      solution: `La virgule recule de ${m} rang${m > 1 ? 's' : ''} : on a divisé par ${fx(10 ** m, 0)}. ${f(x)} ÷ <b>${fx(10 ** m, 0)}</b> = ${f(y)}.`, afterVisual: shTable(x, y, `÷ ${fx(10 ** m, 0)} : ${m} rang${m > 1 ? 's' : ''} vers la droite`), replaceVisual: true };
  }
  if (form === 'm01') {
    const m = pick([1, 2]), k = ri(0, Math.min(2, 3 - m)), x = k ? rd(k, 1, 99) : ri(2, 999), D = m === 1 ? '0,1' : '0,01', E = r6(x / 10 ** m);
    return { ...numQ([E], shiftStr(x, -m), { tpl, comma: true, ctx: `Multiplier par ${D}, c'est diviser par ${fx(10 ** m, 0)} : la virgule recule de ${m} rang${m > 1 ? 's' : ''}.`, more: v => (approx(v[0], r6(x * 10 ** m)) ? `Multiplier par ${D} revient à <b>diviser</b> par ${fx(10 ** m, 0)} : le résultat est plus petit que ${f(x)}.` : '') }),
      html: `Calcule : ${big(`${f(x)} × ${D}`)}`,
      hint: `Multiplier par ${D}, c'est prendre ${m === 1 ? 'un dixième' : 'un centième'} de ${f(x)} : c'est la même chose que diviser par ${fx(10 ** m, 0)}. Le résultat est plus petit que ${f(x)}.`,
      solution: `${f(x)} × ${D} = ${f(x)} ÷ ${fx(10 ** m, 0)} = <b>${f(E)}</b>.`, afterVisual: shTable(x, E, `× ${D} = ÷ ${fx(10 ** m, 0)} : ${m} rang${m > 1 ? 's' : ''} vers la droite`), replaceVisual: true };
  }
  const m = pick([1, 2]), x = rd(ri(0, 2), 1, 99) || ri(2, 99), D = m === 1 ? '0,1' : '0,01', E = r6(x * 10 ** m);
  return { ...numQ([E], shiftStr(x, m), { tpl, comma: true, ctx: `Diviser par ${D}, c'est multiplier par ${fx(10 ** m, 0)} : la virgule avance de ${m} rang${m > 1 ? 's' : ''}.`, more: v => (approx(v[0], r6(x / 10 ** m)) ? `Diviser par ${D} revient à <b>multiplier</b> par ${fx(10 ** m, 0)} : dans ${f(x)}, il y a ${fx(10 ** m, 0)} fois plus de ${m === 1 ? 'dixièmes' : 'centièmes'} que d'unités.` : '') }),
    html: `Calcule : ${big(`${f(x)} ÷ ${D}`)}`,
    hint: `Diviser par ${D}, c'est chercher combien de ${m === 1 ? 'dixièmes' : 'centièmes'} il y a dans ${f(x)} : c'est la même chose que multiplier par ${fx(10 ** m, 0)}. Le résultat est plus grand que ${f(x)}.`,
    solution: `${f(x)} ÷ ${D} = ${f(x)} × ${fx(10 ** m, 0)} = <b>${f(E)}</b>.`, afterVisual: shTable(x, E, `÷ ${D} = × ${fx(10 ** m, 0)} : ${m} rang${m > 1 ? 's' : ''} vers la gauche`), replaceVisual: true };
}
function C8() {
  return `<h2>8. Multiplier et diviser par 10, 100, 1 000, 0,1, 0,01</h2>
<p class="intro">Dans notre système décimal, multiplier par 10 décale tous les chiffres d'un rang vers la gauche. C'est la virgule qui « avance ».</p>
<div class="def"><b>× 10, × 100, × 1 000</b> : chaque chiffre se décale de 1, 2, 3 rangs vers la <b>gauche</b> (la virgule avance vers la droite).<br><b>÷ 10, ÷ 100, ÷ 1 000</b> : chaque chiffre se décale vers la <b>droite</b> (la virgule recule).<br>Multiplier par <b>0,1</b> revient à diviser par 10 ; par <b>0,01</b>, à diviser par 100. Diviser par 0,1 revient à multiplier par 10.</div>
<div class="methode"><b>Méthode</b><ol><li>Repère le nombre de zéros (ou de rangs : 0,01 → 2).</li><li>× : décale la virgule vers la droite ; ÷ : vers la gauche.</li><li>Ajoute des zéros s'il manque des chiffres.</li></ol></div>
${numTable([{ s: '3,45' }, { s: '345' }], { links: true, cap: '× 100 : chaque chiffre se décale de 2 rangs vers la gauche' })}
${ex('Exemple 1 : calcule 3,45 × 100', `La virgule avance de 2 rangs vers la droite : 3,45 → 345.<br>Résultat : <b>345</b>.<br>Autre cas (il manque des chiffres) : 7,5 × 1 000. Résultat : <b>7 500</b>.`)}
${ex('Exemple 2 : calcule 72,5 ÷ 10', `La virgule recule de 1 rang : 72,5 → 7,25.<br>Résultat : <b>7,25</b>.<br>Autre cas (on ajoute des zéros) : 4 ÷ 100 donne <b>0,04</b> et 45 ÷ 1 000 donne <b>0,045</b>.`)}
${ex('Exemple 3 : calcule 4,5 × 0,1', `× 0,1 revient à ÷ 10 : la virgule recule de 1 rang.<br>Résultat : <b>0,45</b>.<br>Et 36 × 0,01 = 36 ÷ 100 : résultat <b>0,36</b>.`)}
${ex('Exemple 4 : calcule 4,5 ÷ 0,1', `÷ 0,1 revient à × 10 : la virgule avance de 1 rang.<br>Résultat : <b>45</b>.<br>Et 0,36 ÷ 0,01 = 0,36 × 100 : résultat <b>36</b>.`)}
${ex('Exemple 5 : complète 4,56 × … = 456', `La virgule a avancé de 2 rangs : on a multiplié par 100 : 4,56 × <b>100</b> = 456.`)}
${ex('Exemple 6 : complète 3 400 ÷ … = 3,4', `La virgule a reculé de 3 rangs : on a divisé par 1 000 : 3 400 ÷ <b>1 000</b> = 3,4.`)}
<div class="warn">⚠️ 3,45 × 10 n'est pas 3,450 : on ne « rajoute pas un zéro », on décale les chiffres.<br>⚠️ 4,5 × 0,1 n'est pas 45 : multiplier par 0,1 rend le nombre <b>plus petit</b>.</div>
<div class="retenir">À retenir : × 10 → la virgule avance ; ÷ 10 → la virgule recule ; × 0,1 = ÷ 10.</div>`;
}

export const B = [
  { titre: 'Ranger et encadrer', generate: L5, cours: C5, classe: '6e' },
  { titre: 'Arrondir', generate: L6, cours: C6, classe: '6e' },
  { titre: 'Additionner et soustraire', generate: L7, cours: C7, classe: '6e' },
  { titre: 'Multiplier et diviser par 10, 100, 1 000, 0,1, 0,01', generate: L8, cours: C8, classe: '6e' },
];

// Niveaux 7 à 12 de « Ratios et fractions » : lire un ratio, trouver une quantité, partages proportionnels
// (deux parts, trois parts, âges / mises / durées), problèmes de synthèse. Comme dans niveaux1.js, chaque forme
// d'exercice est une fonction q…(paramètres) appelée avec des nombres tirés (exercice) ou fixes (cours).
import { ri, pick, shuffle, chance, prenom, gcd, red, r6, M, F, rt, de, que, sfx, eur, coprime, tirer, res, ent, nums, ratioCheck, ex, warn, retenir, methode, def, cols, big } from './outils.js';
import { ratioBar, barreFrac } from './draw.js';

const plus = (l, i) => l.reduce((s, x) => s + x, 0);
/** n prénoms distincts */
function noms(n) { const l = []; while (l.length < n) { const p = prenom(); if (!l.includes(p)) l.push(p); } return l; }
const rd = l => { const g = l.reduce((a, b) => gcd(a, b)); return l.map(x => x / g); };
const TPL_R = n => `Ratio : ${Array.from({ length: n }, (_, i) => `{${i}}`).join(' : ')}`;

/* ====================== 7. lire et écrire un ratio ====================== */
const CTX7 = [
  { tx: (a, b) => `Dans une classe, il y a ${a} filles et ${b} garçons.`, A: 'filles', B: 'garçons' },
  { tx: (a, b) => `Un sac contient ${a} billes rouges et ${b} billes bleues.`, A: 'billes rouges', B: 'billes bleues' },
  { tx: (a, b) => `Un bouquet est composé de ${a} roses et de ${b} tulipes.`, A: 'roses', B: 'tulipes' },
  { tx: (a, b) => `Une ferme élève ${a} poules et ${b} canards.`, A: 'poules', B: 'canards' },
  { tx: (a, b) => `Pour une peinture, on mélange ${a} pots de bleu et ${b} pots de jaune.`, A: 'bleu', B: 'jaune' },
  { tx: (a, b) => `Une recette de crêpes demande ${a} verres de farine et ${b} verres de lait.`, A: 'farine', B: 'lait' },
];
export const q7lire = (a, b, i, inv = false) => {
  const c = CTX7[i], [X, Y, x, y] = inv ? [c.B, c.A, b, a] : [c.A, c.B, a, b];
  return {
    type: 'nums', tpl: TPL_R(2), expected: [x, y],
    check: ratioCheck([x, y], { ordre: `le ratio demandé commence par les ${X}` }),
    html: `${c.tx(a, b)} Écris le ratio ${X} : ${Y}.`,
    visual: ratioBar({ parts: [a, b], names: [c.A, c.B], unit: '' }),
    hint: `Un ratio ${X} : ${Y} s'écrit dans cet ordre : d'abord le nombre qui correspond à « ${X} », puis celui qui correspond à « ${Y} ». Relis l'énoncé pour repérer ${a} et ${b}, sans te tromper d'ordre.`,
    solution: `Dans l'ordre demandé (${X} puis ${Y}), on lit ${x} puis ${y} : le ratio ${X} : ${Y} est ${rt(x, y)}.`,
  };
};
export const q7simple = (ka, kb, i) => {
  const c = CTX7[i], [a, b] = rd([ka, kb]), k = ka / a;
  return {
    type: 'nums', tpl: TPL_R(2), expected: [a, b], check: ratioCheck([a, b]),
    html: `${c.tx(ka, kb)} Écris le ratio ${c.A} : ${c.B} sous forme simplifiée.`,
    visual: ratioBar({ parts: [ka, kb], names: [c.A, c.B], unit: '' }),
    hint: `Écris d'abord le ratio ${rt(ka, kb)}. Cherche un nombre qui divise à la fois ${ka} et ${kb} (regarde les tables), divise les deux par ce nombre, et recommence si c'est encore possible.`,
    solution: `Le ratio est ${rt(ka, kb)}. On divise par ${k} : ${rt(`${ka} ÷ ${k}`, `${kb} ÷ ${k}`)} = ${rt(a, b)}.`,
  };
};
export const q7pur = (ka, kb) => {
  const [a, b] = rd([ka, kb]), k = ka / a;
  return {
    type: 'nums', tpl: TPL_R(2), expected: [a, b], check: ratioCheck([a, b]),
    html: `Simplifie le ratio ${rt(ka, kb)}.`,
    hint: `Cherche le plus grand nombre qui divise à la fois ${ka} et ${kb}, puis divise chaque nombre du ratio par lui. Vérifie qu'il ne reste plus de diviseur commun.`,
    solution: `${ka} et ${kb} sont divisibles par ${k} : ${rt(`${ka} ÷ ${k}`, `${kb} ÷ ${k}`)} = ${rt(a, b)}.`,
  };
};
const UN7 = [
  { A: 'farine', B: 'sucre', u1: 'g', u2: 'kg', f: 1000, t: (x, y) => `Une recette utilise ${x} g de farine et ${y} kg de sucre.`, m: [50, 100, 125, 250] },
  { A: 'largeur', B: 'longueur', u1: 'cm', u2: 'm', f: 100, t: (x, y) => `Un rectangle mesure ${x} cm de largeur et ${y} m de longueur.`, m: [10, 20, 25, 50] },
  { A: 'sirop', B: 'eau', u1: 'mL', u2: 'L', f: 1000, t: (x, y) => `Un mélange contient ${x} mL de sirop et ${y} L d'eau.`, m: [50, 100, 125, 250] },
];
export const q7unit = (a, b, m, i) => {
  const c = UN7[i], x = a * m, y = r6(b * m / c.f);
  return {
    type: 'nums', tpl: TPL_R(2), expected: [a, b], check: ratioCheck([a, b]),
    html: `${c.t(x, M(y))} Écris le ratio ${c.A} : ${c.B} sous forme simplifiée.`,
    hint: `Pour comparer, il faut la même unité : convertis ${M(y)} ${c.u2} en ${c.u1} (1 ${c.u2} = ${c.f} ${c.u1}). Écris ensuite le ratio ${c.A} : ${c.B} et simplifie-le.`,
    solution: `${M(y)} ${c.u2} = ${b * m} ${c.u1}. Le ratio est ${rt(x, b * m)} = ${rt(a, b)} (on divise par ${m}).`,
  };
};
function L7(d) {
  const formes = ['lire'];
  if (d >= 1) formes.push('inv', 'simple');
  if (d >= 2) formes.push('pur');
  if (d >= 3) formes.push('unit', 'unit');
  const k = pick(formes), i = ri(0, CTX7.length - 1);
  if (k === 'lire' || k === 'inv') { const [a, b] = coprime(2, d < 1 ? 6 : 9, 2, d < 1 ? 7 : 10, (x, y) => x !== y); return q7lire(a, b, i, k === 'inv'); }
  if (k === 'unit') { const [a, b] = coprime(1, 7, 1, 9, (x, y) => x !== y), j = ri(0, UN7.length - 1); return q7unit(a, b, pick(UN7[j].m), j); }
  const [a, b] = coprime(1, 6, 2, 8, (x, y) => x !== y), kk = ri(2, d < 3 ? 3 : 4);
  return k === 'simple' ? q7simple(a * kk, b * kk, i) : q7pur(a * kk, b * kk);
}
function C7() {
  return `<h2>7. Lire et écrire un ratio</h2>
<p class="intro">Un ratio compare deux quantités : « pour 3 filles, il y a 5 garçons » s'écrit 3 : 5. On le lit « 3 pour 5 ».</p>
${def(`Le <b>ratio</b> de a et b s'écrit ${rt('a', 'b')}. L'<b>ordre</b> compte : le ratio filles : garçons est ${rt(3, 5)}, le ratio garçons : filles est ${rt(5, 3)}.<br>Comme une fraction, un ratio se <b>simplifie</b> en divisant tous ses nombres par le même nombre : ${rt(6, 10)} = ${rt(3, 5)}.`)}
${cols(methode(['Repère les deux quantités et l\'ordre demandé.', 'Écris les nombres dans cet ordre, séparés par « : ».', 'Si les deux quantités sont dans des unités différentes, convertis-les d\'abord.', 'Simplifie en divisant par un diviseur commun.']), ratioBar({ parts: [3, 5], names: ['filles', 'garçons'], unit: '' }))}
${ex(q7lire(3, 5, 0))}
${ex(q7lire(2, 3, 4))}
${ex(q7lire(3, 5, 0, true))}
${ex(q7simple(8, 12, 2))}
${ex(q7pur(18, 30))}
${ex(q7unit(1, 4, 250, 0))}
${ex(q7unit(2, 3, 25, 1))}
${ex(q7unit(1, 8, 125, 2))}
${warn(`⚠️ L'ordre compte : ${rt(3, 5)} et ${rt(5, 3)} ne sont pas le même ratio.<br>⚠️ Un ratio compare deux parties entre elles ; ce n'est pas une fraction du total (3 filles pour 5 garçons : les filles sont les ${F(3, 8)} du groupe, pas les ${F(3, 5)}).<br>⚠️ Avant de simplifier, mets les deux nombres dans la même unité.`)}
${retenir('on écrit le ratio dans l\'ordre de la phrase, avec la même unité, puis on le simplifie.')}`;
}

/* ====================== 8. ratio et quantité ====================== */
const CTX8 = [
  { suj: 'une vinaigrette', A: 'huile', B: 'vinaigre', u: 'cuillères à soupe', r: [[3, 1], [2, 1], [3, 2], [4, 1]] },
  { suj: 'un sirop', A: 'sirop', B: 'eau', u: 'verres', r: [[1, 7], [1, 5], [1, 4], [1, 8]] },
  { suj: 'une peinture verte', A: 'bleu', B: 'jaune', u: 'pots', r: [[2, 3], [3, 5], [3, 4], [2, 5]] },
  { suj: 'un mortier', A: 'ciment', B: 'sable', u: 'seaux', r: [[1, 3], [1, 2], [2, 5], [2, 7]] },
];
const bar8 = (c, a, b, vA, vB) => ratioBar({ parts: [a, b], names: [c.A, c.B], vals: [vA, vB], unit: '' });
export const q8quant = (a, b, k, i, rev = false) => {
  const c = CTX8[i], [X, Y, x, y] = rev ? [c.B, c.A, b, a] : [c.A, c.B, a, b], n = x * k;
  return {
    ...ent(y * k, (n / x) * y, c.u),
    html: `Pour ${c.suj}, le ratio ${c.A} : ${c.B} est ${rt(a, b)}. Avec ${n} ${c.u} ${de(X)}, combien de ${c.u} ${de(Y)} faut-il ?`,
    visual: bar8(c, a, b, rev ? '?' : `${n}`, rev ? `${n}` : '?'),
    hint: `Cherche par combien il faut multiplier ${x} pour obtenir ${n} (c'est ${n} ÷ ${x}), puis multiplie ${y} par ce même nombre.`,
    solution: `${x} × ${k} = ${n}, donc ${y} × ${k} = <b>${y * k}</b> ${c.u} ${de(Y)}.`,
  };
};
export const q8nonred = (a, b, k, i) => {
  const c = CTX8[i], g = pick([2, 3]), ka = a * g, kb = b * g, n = a * k;
  return {
    ...ent(b * k, (n / ka) * kb, c.u),
    html: `Pour ${c.suj}, le ratio ${c.A} : ${c.B} est ${rt(ka, kb)}. Avec ${n} ${c.u} ${de(c.A)}, combien de ${c.u} ${de(c.B)} faut-il ?`,
    visual: bar8(c, ka, kb, `${n}`, '?'),
    hint: `Simplifie d'abord le ratio ${rt(ka, kb)} (divise les deux nombres par le même nombre), puis cherche par combien multiplier pour passer à ${n}.`,
    solution: `${rt(ka, kb)} = ${rt(a, b)} (÷ ${g}). ${a} × ${k} = ${n}, donc ${b} × ${k} = <b>${b * k}</b> ${c.u} ${de(c.B)}.`,
  };
};
export const q8dec = (a, b, z, i) => {
  const c = CTX8[i], x = r6(a * z), y = r6(b * z);
  return {
    ...nums([y], 'Réponse : {0} L', { value: (x / a) * b, keys: { comma: true } }),
    html: `Pour ${c.suj}, le ratio ${c.A} : ${c.B} est ${rt(a, b)}. Avec ${M(x)} L ${de(c.A)}, combien de litres ${de(c.B)} faut-il ?`,
    visual: bar8(c, a, b, `${M(x)} L`, '?'),
    hint: `Cherche par combien il faut multiplier ${a} pour obtenir ${M(x)} (c'est ${M(x)} ÷ ${a}), puis multiplie ${b} par ce même nombre.`,
    solution: `${a} × ${M(z)} = ${M(x)}, donc ${b} × ${M(z)} = <b>${M(y)}</b> L ${de(c.B)}.`,
  };
};
function L8(d) {
  const formes = ['dir'];
  if (d >= 1) formes.push('rev');
  if (d >= 2) formes.push('nonred');
  if (d >= 3) formes.push('dec');
  const k = pick(formes), i = ri(0, CTX8.length - 1), [a, b] = pick(CTX8[i].r);
  if (k === 'dec') return q8dec(a, b, pick([0.5, 1.5, 2.5, 0.25, 0.75, 1.25]), i);
  if (k === 'nonred') return q8nonred(a, b, ri(2, 6), i);
  return q8quant(a, b, ri(2, 4 + d), i, k === 'rev');
}
function C8() {
  return `<h2>8. Ratio et quantités</h2>
<p class="intro">Un ratio garde les proportions : si on double la quantité d'un ingrédient, on double aussi l'autre. On trouve donc une quantité inconnue avec le même coefficient.</p>
${def(`Si ${rt('a', 'b')} est le ratio de A et de B, et si A vaut a × k, alors B vaut <b>b × k</b>.<br>Le coefficient k se trouve par une division : k = (quantité connue) ÷ (nombre du ratio qui lui correspond).`)}
${cols(methode(['Écris le ratio et repère la quantité connue.', 'Trouve k : quantité connue ÷ nombre du ratio.', 'Multiplie l\'autre nombre du ratio par k.', 'Si le ratio n\'est pas simplifié, simplifie-le d\'abord.']), ratioBar({ parts: [3, 5], names: ['bleu', 'jaune'], vals: ['6 pots', '?'], unit: '' }))}
${ex(q8quant(3, 1, 4, 0))}
${ex(q8quant(2, 3, 5, 2, true))}
${ex(q8nonred(1, 4, 3, 1))}
${ex(q8dec(2, 5, 1.5, 3))}
${warn(`⚠️ On <b>multiplie</b> par le même coefficient : on n'ajoute pas le même nombre aux deux quantités.<br>⚠️ Fais attention à la quantité connue : si on te donne la deuxième, c'est b qu'il faut comparer, pas a.<br>⚠️ Un ratio ${rt(6, 4)} se simplifie en ${rt(3, 2)} avant de chercher k.`)}
${retenir('quantité connue ÷ nombre du ratio = k ; l\'autre quantité = son nombre du ratio × k.')}`;
}

/* ====================== 9. partage en deux parts ====================== */
const unite = (u, x) => (u === '€' ? eur(x) : `${M(x)} ${u}`);
const intro9 = (n1, n2, a, b, T, u) => `${n1} et ${n2} se partagent ${unite(u, T)} selon le ratio ${rt(a, b)}.`;
const ordMsg = (nm, k) => `Tu as peut-être inversé les parts : ${nm} correspond à ${k} parts.`;
export const q9tous = (n1, n2, a, b, T, u) => {
  const S = a + b, A = T / S * a, B = T / S * b, dec = !Number.isInteger(A) || !Number.isInteger(B);
  return {
    ...nums([A, B], `${n1} : {0} ${u}&nbsp;&nbsp; ${n2} : {1} ${u}`, {
      value: T * b / S, keys: dec ? { comma: true } : undefined,
      verify: E => Math.abs(E[0] + E[1] - T) < 1e-9 && Math.abs(E[0] * b - E[1] * a) < 1e-9,
      near: [[0, B, ordMsg(n1, a)], [1, A, ordMsg(n2, b)]],
    }),
    html: `${intro9(n1, n2, a, b, T, u)} Combien reçoit chacun ?`,
    visual: ratioBar({ parts: [a, b], names: [n1, n2], vals: ['?', '?'], total: unite(u, T), block: '1 part = ?' }),
    hint: `Il y a ${a} + ${b} parts égales en tout. Calcule la valeur d'une part (${M(T)} ÷ (${a} + ${b})), puis multiplie-la par ${a} pour ${n1} et par ${b} pour ${n2}.`,
    solution: `${a} + ${b} = ${S} parts. Une part : ${M(T)} ÷ ${S} = ${M(T / S)}. ${n1} : ${a} × ${M(T / S)} = <b>${M(A)}</b> ${u}. ${n2} : ${b} × ${M(T / S)} = <b>${M(B)}</b> ${u}. (Contrôle : ${M(A)} + ${M(B)} = ${M(T)}.)`,
  };
};
export const q9un = (n1, n2, a, b, T, u, qui) => {
  const S = a + b, A = T / S * a, B = T / S * b, nm = qui ? n2 : n1, p = qui ? b : a, X = qui ? B : A, Y = qui ? A : B;
  return {
    ...nums([X], `${nm} : {0} ${u}`, { value: T * p / S, keys: !Number.isInteger(X) ? { comma: true } : undefined, near: [[0, Y, ordMsg(nm, p)], [0, T / S, `${M(T / S)} est la valeur d'<b>une</b> part : ${nm} en reçoit ${p}.`]] }),
    html: `${intro9(n1, n2, a, b, T, u)} Combien reçoit ${nm} ?`,
    visual: ratioBar({ parts: [a, b], names: [n1, n2], vals: qui ? ['', '?'] : ['?', ''], total: unite(u, T), block: '1 part = ?' }),
    hint: `Le total est partagé en ${a} + ${b} parts égales. Calcule la valeur d'une part (${M(T)} ÷ (${a} + ${b})), puis multiplie-la par le nombre de parts ${de(nm)} (${p}).`,
    solution: `${a} + ${b} = ${S} parts. Une part : ${M(T)} ÷ ${S} = ${M(T / S)}. ${nm} reçoit ${p} ${p > 1 ? 'parts' : 'part'} : ${p} × ${M(T / S)} = <b>${M(X)}</b> ${u}.`,
  };
};
export const q9frac = (n1, n2, a, b, qui) => {
  const nm = qui ? n2 : n1, p = qui ? b : a, S = a + b;
  return {
    ...res(p, S, p / S),
    html: `Une somme d'argent est partagée entre ${n1} et ${n2} selon le ratio ${rt(a, b)}. Quelle fraction de la somme reçoit ${nm} ?<br>Donne une fraction irréductible.`,
    visual: ratioBar({ parts: [a, b], names: [n1, n2], total: 'toute la somme' }),
    hint: `La somme est partagée en ${a} + ${b} parts égales. ${nm} reçoit ${p} de ces parts : écris « parts ${de(nm)} sur parts totales » et simplifie si c'est possible.`,
    solution: `${a} + ${b} = ${S} parts en tout, dont ${p} pour ${nm} : ${F(p, S)} de la somme.`,
  };
};
export const q9total = (n1, n2, a, b, P, qui) => {
  const nm = qui ? n2 : n1, p = qui ? b : a, S = a + b, T = P / p * S, u = P / p;
  return {
    ...ent(T, (P / p) * S, '€'),
    html: `${n1} et ${n2} se partagent une somme d'argent selon le ratio ${rt(a, b)}. ${nm} reçoit ${eur(P)}. Quelle est la somme partagée ?`,
    visual: ratioBar({ parts: [a, b], names: [n1, n2], vals: qui ? ['', eur(P)] : [eur(P), ''], total: 'somme : ?', block: '1 part = ?' }),
    hint: `${nm} reçoit ${p} ${p > 1 ? "parts" : "part"} et cela fait ${eur(P)}. Cherche la valeur d'une part (${M(P)} ÷ ${p}), puis multiplie-la par le nombre total de parts (${a} + ${b}).`,
    solution: `${nm} reçoit ${p} ${p > 1 ? 'parts' : 'part'} : une part vaut ${M(P)} ÷ ${p} = ${M(u)} €. Il y a ${a} + ${b} = ${S} parts : ${S} × ${M(u)} = <b>${M(T)}</b> €.`,
  };
};
function L9(d) {
  const formes = ['tous'];
  if (d >= 1) formes.push('un');
  if (d >= 2) formes.push('frac', 'tous');
  if (d >= 3) formes.push('total');
  const k = pick(formes), [n1, n2] = noms(2), [a, b] = coprime(1, d < 2 ? 4 : 7, 2, d < 2 ? 5 : 9, (x, y) => x !== y), qui = chance(0.5);
  const S = a + b;
  if (k === 'frac') return q9frac(n1, n2, a, b, qui);
  if (k === 'total') return q9total(n1, n2, a, b, (qui ? b : a) * ri(3, 40), qui);
  const objets = d >= 2 && chance(0.4), dec = d >= 4 && !objets && chance(0.5);
  const T = dec ? S * pick([0.5, 1.5, 2.5, 4.5]) : S * (d < 1 ? ri(3, 12) * 2 : ri(3, 30));
  const u = objets ? 'billes' : '€';
  return k === 'un' ? q9un(n1, n2, a, b, T, u, qui) : q9tous(n1, n2, a, b, T, u);
}
function C9() {
  return `<h2>9. Partager en deux parts selon un ratio</h2>
<p class="intro">Partager 120 € selon le ratio ${rt(3, 5)}, c'est faire 3 parts pour le premier et 5 parts pour le second, toutes de même valeur.</p>
${def(`Partager T selon le ratio ${rt('a', 'b')} :<br>• nombre de parts : <b>a + b</b> ;<br>• valeur d'une part : <b>T ÷ (a + b)</b> ;<br>• première part : a × (une part), seconde part : b × (une part). La première part vaut les ${F('a', 'a + b')} du total.`)}
${cols(methode(['Additionne les nombres du ratio : c\'est le nombre de parts.', 'Divise le total par ce nombre : valeur d\'une part.', 'Multiplie par le nombre de parts de chacun.', 'Contrôle : la somme des parts redonne le total.']), ratioBar({ parts: [3, 5], names: ['Léa', 'Tom'], vals: ['45 €', '75 €'], total: '120 €', block: '1 part = 120 ÷ 8 = 15 €' }))}
${ex(q9tous('Léa', 'Tom', 3, 5, 120, '€'))}
${ex(q9tous('Inès', 'Hugo', 2, 3, 40, 'billes'))}
${ex(q9tous('Nour', 'Malo', 2, 7, 13.5, '€'))}
${ex(q9un('Chloé', 'Adam', 4, 5, 90, '€', true))}
${ex(q9frac('Sarah', 'Yanis', 3, 7, false))}
${ex(q9total('Jade', 'Lucas', 2, 3, 30, false))}
${warn(`⚠️ Le nombre de parts est la <b>somme</b> a + b (3 + 5 = 8), pas 3 × 5.<br>⚠️ Une part n'est pas le total divisé par a ou par b, mais par a + b.<br>⚠️ Respecte l'ordre : le premier nombre du ratio est pour la première personne citée.`)}
${retenir('parts en tout = a + b ; une part = total ÷ (a + b) ; chacun reçoit son nombre de parts × une part.')}`;
}

/* ====================== 10. partage en trois parts ====================== */
const T3 = [[1, 2, 3], [1, 2, 4], [1, 3, 5], [2, 3, 4], [2, 3, 5], [3, 4, 5], [1, 4, 5], [1, 1, 3], [2, 5, 3]];
const MEL = [
  { suj: 'Un béton', mat: ['ciment', 'sable', 'gravier'], u: 'kg', t: (r, T) => `Un béton est fait de ciment, de sable et de gravier dans le ratio ${rt(...r)}. On prépare ${T} kg de béton.` },
  { suj: 'Un jus', mat: ['orange', 'ananas', 'mangue'], u: 'L', t: (r, T) => `Un jus multifruits contient du jus d'orange, d'ananas et de mangue dans le ratio ${rt(...r)}. On en prépare ${T} L.` },
];
const visual3 = (r, noms3, vals, total, block = '1 part = ?') => ratioBar({ parts: r, names: noms3, vals, total, block });
export const q10tous = (ns, r, T) => {
  const S = plus(r), E = r.map(x => T / S * x);
  return {
    ...nums(E, `${ns[0]} : {0} €&nbsp; ${ns[1]} : {1} €&nbsp; ${ns[2]} : {2} €`, {
      value: T * r[2] / S, verify: v => Math.abs(plus(v) - T) < 1e-9 && v.every((x, i) => Math.abs(x * r[0] - v[0] * r[i]) < 1e-9),
    }),
    html: `${ns[0]}, ${ns[1]} et ${ns[2]} se partagent ${eur(T)} selon le ratio ${rt(...r)}. Combien reçoit chacun ?`,
    visual: visual3(r, ns, ['?', '?', '?'], eur(T)),
    hint: `Il y a ${r.join(' + ')} parts égales en tout. Calcule la valeur d'une part (${T} ÷ (${r.join(' + ')})), puis multiplie-la par ${r[0]}, ${r[1]} et ${r[2]}.`,
    solution: `${r.join(' + ')} = ${S} parts. Une part : ${T} ÷ ${S} = ${M(T / S)} €. ${ns.map((n, i) => `${n} : ${r[i]} × ${M(T / S)} = <b>${M(E[i])}</b> €`).join(' ; ')}. (Contrôle : ${E.map(M).join(' + ')} = ${T}.)`,
  };
};
export const q10un = (ns, r, T, j) => {
  const S = plus(r), X = T / S * r[j];
  return {
    ...nums([X], `${ns[j]} : {0} €`, { value: T * r[j] / S, near: [[0, T / S, `${M(T / S)} € est la valeur d'<b>une</b> part : ${ns[j]} en reçoit ${r[j]}.`]] }),
    html: `${ns[0]}, ${ns[1]} et ${ns[2]} se partagent ${eur(T)} selon le ratio ${rt(...r)}. Combien reçoit ${ns[j]} ?`,
    visual: visual3(r, ns, r.map((_, i) => (i === j ? '?' : '')), eur(T)),
    hint: `Le total est partagé en ${r.join(' + ')} parts égales. Calcule la valeur d'une part (${T} ÷ (${r.join(' + ')})), puis multiplie-la par le nombre de parts ${de(ns[j])} (${r[j]}).`,
    solution: `${r.join(' + ')} = ${S} parts. Une part : ${T} ÷ ${S} = ${M(T / S)} €. ${ns[j]} reçoit ${r[j]} ${r[j] > 1 ? 'parts' : 'part'} : ${r[j]} × ${M(T / S)} = <b>${M(X)}</b> €.`,
  };
};
export const q10melange = (r, T, ctx, j) => {
  const c = MEL[ctx], S = plus(r), X = T / S * r[j];
  return {
    ...nums([X], `Réponse : {0} ${c.u}`, { value: T * r[j] / S }),
    html: `${c.t(r, T)} Quelle quantité de ${c.mat[j]} faut-il ?`,
    visual: visual3(r, c.mat, r.map((_, i) => (i === j ? '?' : '')), `${T} ${c.u}`),
    hint: `Il y a ${r.join(' + ')} parts en tout pour ${T} ${c.u}. Calcule la valeur d'une part (${T} ÷ (${r.join(' + ')})), puis multiplie-la par le nombre de parts ${de(c.mat[j])} (${r[j]}).`,
    solution: `${r.join(' + ')} = ${S} parts. Une part : ${T} ÷ ${S} = ${M(T / S)} ${c.u}. ${c.mat[j][0].toUpperCase() + c.mat[j].slice(1)} : ${r[j]} × ${M(T / S)} = <b>${M(X)}</b> ${c.u}.`,
  };
};
export const q10total = (ns, r, j, P) => {
  const S = plus(r), u = P / r[j], T = u * S;
  return {
    ...ent(T, (P / r[j]) * S, '€'),
    html: `${ns[0]}, ${ns[1]} et ${ns[2]} se partagent une somme d'argent selon le ratio ${rt(...r)}. ${ns[j]} reçoit ${eur(P)}. Quelle est la somme partagée ?`,
    visual: visual3(r, ns, r.map((_, i) => (i === j ? eur(P) : '')), 'somme : ?'),
    hint: `${ns[j]} reçoit ${r[j]} ${r[j] > 1 ? "parts" : "part"} et cela fait ${eur(P)}. Cherche la valeur d'une part (${P} ÷ ${r[j]}), puis multiplie-la par le nombre total de parts (${r.join(' + ')}).`,
    solution: `Une part vaut ${P} ÷ ${r[j]} = ${M(u)} €. Il y a ${r.join(' + ')} = ${S} parts : ${S} × ${M(u)} = <b>${M(T)}</b> €.`,
  };
};
export const q10autre = (ns, r, j, l, P) => {
  const u = P / r[j], X = u * r[l];
  return {
    ...ent(X, (P / r[j]) * r[l], '€'),
    html: `${ns[0]}, ${ns[1]} et ${ns[2]} se partagent une somme d'argent selon le ratio ${rt(...r)}. ${ns[j]} reçoit ${eur(P)}. Combien reçoit ${ns[l]} ?`,
    visual: visual3(r, ns, r.map((_, i) => (i === j ? eur(P) : i === l ? '?' : '')), 'somme : ?'),
    hint: `${ns[j]} reçoit ${r[j]} ${r[j] > 1 ? "parts" : "part"}, soit ${eur(P)} : cherche la valeur d'une part (${P} ÷ ${r[j]}), puis multiplie-la par le nombre de parts ${de(ns[l])} (${r[l]}).`,
    solution: `Une part vaut ${P} ÷ ${r[j]} = ${M(u)} €. ${ns[l]} reçoit ${r[l]} ${r[l] > 1 ? 'parts' : 'part'} : ${r[l]} × ${M(u)} = <b>${M(X)}</b> €.`,
  };
};
function L10(d) {
  const formes = ['tous'];
  if (d >= 1) formes.push('un');
  if (d >= 2) formes.push('melange');
  if (d >= 3) formes.push('total');
  if (d >= 4) formes.push('autre');
  const k = pick(formes), ns = noms(3), r = shuffle(pick(T3).slice()), S = plus(r), j = ri(0, 2);
  if (k === 'melange') { const c = ri(0, MEL.length - 1); return q10melange(r, S * pick(c === 0 ? [10, 20, 30, 50] : [1, 2, 3, 4, 5]), c, j); }
  if (k === 'total') return q10total(ns, r, j, r[j] * ri(3, 40));
  if (k === 'autre') { let l; do { l = ri(0, 2); } while (l === j); return q10autre(ns, r, j, l, r[j] * ri(3, 40)); }
  const T = S * ri(d < 1 ? 3 : 5, d < 3 ? 25 : 60);
  return k === 'un' ? q10un(ns, r, T, j) : q10tous(ns, r, T);
}
function C10() {
  return `<h2>10. Partager en trois parts</h2>
<p class="intro">Un ratio peut avoir trois nombres : ${rt(2, 3, 5)} veut dire 2 parts, 3 parts et 5 parts, toutes égales. La méthode est la même que pour deux parts.</p>
${def(`Partager T selon le ratio ${rt('a', 'b', 'c')} :<br>• nombre de parts : <b>a + b + c</b> ;<br>• valeur d'une part : <b>T ÷ (a + b + c)</b> ;<br>• chaque personne reçoit son nombre de parts × la valeur d'une part.`)}
${cols(methode(['Additionne les trois nombres : nombre de parts.', 'Divise le total par ce nombre : valeur d\'une part.', 'Multiplie par le nombre de parts de chacun.', 'Contrôle : les trois parts s\'additionnent en T.']), visual3([2, 3, 5], ['Léa', 'Tom', 'Inès'], ['40 €', '60 €', '100 €'], '200 €', '1 part = 200 ÷ 10 = 20 €'))}
${ex(q10tous(['Léa', 'Tom', 'Inès'], [2, 3, 5], 200))}
${ex(q10un(['Nour', 'Malo', 'Sarah'], [1, 3, 4], 160, 1))}
${ex(q10melange([1, 2, 3], 300, 0, 1))}
${ex(q10melange([3, 2, 1], 12, 1, 0))}
${ex(q10total(['Hugo', 'Jade', 'Adam'], [2, 3, 4], 2, 80))}
${ex(q10autre(['Chloé', 'Yanis', 'Rayan'], [1, 2, 5], 0, 2, 30))}
${warn(`⚠️ Avec trois parts, on additionne les <b>trois</b> nombres : 2 + 3 + 5 = 10 (pas 2 + 3).<br>⚠️ Une part n'est pas ${F(1, 3)} du total : il y a autant de parts que la somme du ratio.<br>⚠️ Si on connaît la part d'une personne, on cherche d'abord la valeur d'<b>une</b> part.`)}
${retenir('parts en tout = a + b + c ; une part = total ÷ (a + b + c).')}`;
}

/* ====================== 11. partage proportionnel : âges, mises, durées ====================== */
const CTX11 = {
  mise: { mot: 'aux mises', d: (n, x) => `${n} a misé ${x} €`, u: '€' },
  age: { mot: 'à leur âge', d: (n, x) => `${n} a ${x} ans`, u: '€' },
  duree: { mot: 'à leur temps de travail', d: (n, x) => `${n} a travaillé ${x} h`, u: '€' },
};
const enonce11 = (ctx, ns, xs, T) => {
  const c = CTX11[ctx], liste = ns.map((n, i) => c.d(n, xs[i]));
  const deb = liste.length === 2 ? `${liste[0]} et ${liste[1]}` : `${liste[0]}, ${liste[1]} et ${liste[2]}`;
  if (ctx === 'mise') return `${deb}. Ils gagnent ensemble ${eur(T)} à la loterie et se partagent ce gain proportionnellement aux mises.`;
  if (ctx === 'age') return `${deb}. Ils se partagent ${eur(T)} proportionnellement à leur âge.`;
  return `${deb} sur un chantier payé ${eur(T)} en tout. Ils se partagent cette somme proportionnellement à leur temps de travail.`;
};
/** ask : 'all' ou l'indice de la personne dont on demande la part */
export const q11 = (ctx, ns, xs, T, ask) => {
  const r = rd(xs), g = xs[0] / r[0], S = plus(r), E = r.map(x => T / S * x), c = CTX11[ctx];
  const un = ask === 'all' ? null : ask, rat = rt(...xs), rr = rt(...r);
  const tpl = un === null ? ns.map((n, i) => `${n} : {${i}} €`).join('&nbsp; ') : `${ns[un]} : {0} €`;
  return {
    ...nums(un === null ? E : [E[un]], tpl, {
      value: un === null ? T * r[r.length - 1] / S : T * r[un] / S,
      verify: v => (un === null ? Math.abs(plus(v) - T) < 1e-9 && v.every((x, i) => Math.abs(x * xs[0] - v[0] * xs[i]) < 1e-9) : Math.abs(v[0] * S - T * r[un]) < 1e-9),
      near: un === null ? [] : [[0, T / S, `${M(T / S)} € est la valeur d'<b>une</b> part : ${ns[un]} en reçoit ${r[un]}.`]],
    }),
    html: `${enonce11(ctx, ns, xs, T)} ${un === null ? 'Combien reçoit chacun ?' : `Combien reçoit ${ns[un]} ?`}`,
    visual: ratioBar({ parts: xs, labels: xs.map(x => (ctx === 'mise' ? `${x} €` : ctx === 'age' ? `${x} ans` : `${x} h`)), names: ns, vals: ns.map((_, i) => (un === null || i === un ? '?' : '')), total: eur(T) }),
    hint: `Le partage est proportionnel ${c.mot} : le ratio est ${rat}. Simplifie-le en divisant tous les nombres par le même nombre, puis partage ${eur(T)} selon ce ratio simplifié (nombre de parts, valeur d'une part).`,
    solution: `Le ratio ${rat} se simplifie en ${rr} (÷ ${g}). ${r.join(' + ')} = ${S} parts. Une part : ${M(T)} ÷ ${S} = ${M(T / S)} €. ${(un === null ? ns.map((_, i) => i) : [un]).map(i => `${ns[i]} : ${r[i]} × ${M(T / S)} = <b>${M(E[i])}</b> €`).join(' ; ')}.`,
  };
};
const R2 = [[2, 3], [3, 4], [3, 5], [4, 5], [1, 2], [2, 5], [3, 7]];
const R3 = [[2, 3, 4], [1, 2, 3], [2, 3, 5], [1, 2, 4], [3, 4, 5]];
const maxX = { mise: 250, age: 17, duree: 12 };
function L11(d) {
  const formes = ['all2'];
  if (d >= 1) formes.push('one2');
  if (d >= 2) formes.push('all3');
  if (d >= 3) formes.push('one3');
  const k = pick(formes), ctx = pick(['mise', 'age', 'duree']), n = k.endsWith('3') ? 3 : 2;
  const r = pick(n === 3 ? R3 : R2), S = plus(r);
  const ks = {
    mise: [5, 10, 20, 25, 50].filter(x => Math.max(...r) * x <= maxX.mise), age: [2, 3, 4, 5].filter(x => Math.max(...r) * x <= maxX.age), duree: [2, 3, 4].filter(x => Math.max(...r) * x <= maxX.duree),
  }[ctx];
  if (!ks.length) return L11(d);
  const kk = pick(ks), xs = r.map(x => x * kk), T = S * pick([5, 10, 12, 15, 20, 25, 30, 40]);
  return q11(ctx, noms(n), xs, T, k.startsWith('all') ? 'all' : ri(0, n - 1));
}
function C11() {
  return `<h2>11. Partager proportionnellement</h2>
<p class="intro">« Proportionnellement aux mises », « à l'âge », « au temps de travail » : plus on a misé, plus on est âgé ou plus on a travaillé, plus on reçoit. Les nombres donnés forment le ratio du partage.</p>
${def(`Partager T <b>proportionnellement</b> à x, y (et z) : on partage T selon le ratio ${rt('x', 'y', 'z')}.<br>On simplifie d'abord le ratio (÷ un même nombre) : les nombres sont plus petits, le calcul plus simple.`)}
${cols(methode(['Écris le ratio avec les nombres donnés (mises, âges, durées…).', 'Simplifie-le.', 'Parts en tout = somme du ratio simplifié ; une part = total ÷ parts.', 'Multiplie par le nombre de parts de chacun.']), ratioBar({ parts: [30, 50], labels: ['30 €', '50 €'], names: ['Léa', 'Tom'], vals: ['', ''], total: 'ratio 30 : 50 = 3 : 5' }))}
${ex(q11('mise', ['Léa', 'Tom'], [30, 50], 400, 'all'))}
${ex(q11('age', ['Inès', 'Hugo'], [8, 12], 90, 'all'))}
${ex(q11('duree', ['Malo', 'Sarah'], [4, 6], 150, 'all'))}
${ex(q11('age', ['Nour', 'Adam'], [9, 15], 72, 1))}
${ex(q11('mise', ['Chloé', 'Yanis', 'Jade'], [20, 30, 50], 600, 'all'))}
${ex(q11('duree', ['Lucas', 'Rayan', 'Mila'], [2, 4, 6], 240, 2))}
${warn(`⚠️ Ne partage pas selon ${rt(30, 50)} directement (80 parts !) : simplifie d'abord en ${rt(3, 5)}.<br>⚠️ Plus la mise (ou l'âge, ou la durée) est grande, plus la part est grande : le plus petit nombre donne la plus petite part.<br>⚠️ Les nombres du ratio sont ceux de l'énoncé (30 et 50), pas le total à partager.`)}
${retenir('proportionnel à x, y, z : je simplifie le ratio x : y : z, puis je partage.')}`;
}

/* ====================== 12. synthèse ====================== */
const PCT_S = { 4: [1, 3], 5: [1, 2, 3, 4], 10: [1, 3, 7, 9], 20: [1, 3, 7, 9, 11, 13, 17, 19], 25: [1, 2, 3, 4, 6, 7, 8, 9, 11, 12, 13, 14, 16, 17, 18, 19, 21, 22, 23, 24] };
export const q12pct = (a, b) => {
  const S = a + b, P = 100 * a / S;
  return {
    ...nums([P], 'Réponse : {0} %', { value: (a / S) * 100 }),
    html: `Dans un club, le ratio filles : garçons est ${rt(a, b)}. Quel pourcentage des membres sont des filles ?`,
    visual: ratioBar({ parts: [a, b], names: ['filles', 'garçons'], unit: '', total: 'tous les membres' }),
    hint: `Le club est partagé en ${a} + ${b} parts égales et les filles en occupent ${a}. Écris la fraction « parts de filles sur parts totales », puis passe en pourcentage (sur 100).`,
    solution: `${a} + ${b} = ${a + b} parts, dont ${a} de filles : ${F(a, a + b)} = ${F(P, 100)} = <b>${M(P)} %</b>.`,
  };
};
export const q12ratio = p => {
  const E = rd([p, 100 - p]);
  return {
    type: 'nums', tpl: TPL_R(2), expected: E, check: ratioCheck(E),
    html: `Une boisson contient ${p} % de jus de fruit ; le reste est de l'eau. Écris le ratio jus : eau sous forme simplifiée.`,
    visual: ratioBar({ parts: [p, 100 - p], labels: [`${p} %`, `${100 - p} %`], names: ['jus', 'eau'] }),
    hint: `Sur 100 parts, ${p} sont du jus et le reste (${100} − ${p}) est de l'eau. Écris le ratio ${rt(p, 100 - p)}, puis simplifie-le.`,
    solution: `Jus : ${p} %, eau : ${100 - p} %. Ratio ${rt(p, 100 - p)} = ${rt(...E)} (÷ ${p / E[0]}).`,
  };
};
export const q12budget = (T, f, g, a, b) => {
  const R = T * (g - f) / g, X = R * a / (a + b);
  return {
    ...ent(X, T * (g - f) / g * a / (a + b), '€'),
    html: `Sur un budget de ${eur(T)}, les ${F(f, g)} servent à payer le loyer. Le reste est partagé entre l'alimentation et les loisirs selon le ratio ${rt(a, b)}. Quelle somme est consacrée à l'alimentation ?`,
    visual: barreFrac(f, g, { lab1: 'loyer', lab2: `budget : ${eur(T)}` }),
    hint: `Calcule d'abord ce qui reste après le loyer : le loyer est les ${F(f, g)} de ${T}, il reste le reste du budget (les ${F(g - f, g)}). Partage ensuite ce reste selon le ratio ${rt(a, b)} (${a} + ${b} parts).`,
    solution: `Loyer : ${T} ÷ ${g} × ${f} = ${M(T / g * f)} €. Reste : ${T} − ${M(T / g * f)} = ${M(R)} €. ${a} + ${b} = ${a + b} parts : une part = ${M(R)} ÷ ${a + b} = ${M(R / (a + b))} €. Alimentation : ${a} × ${M(R / (a + b))} = <b>${M(X)}</b> €.`,
  };
};
export const q12frac = (f, g) => {
  const E = [f, g - f];
  return {
    type: 'nums', tpl: TPL_R(2), expected: E, check: ratioCheck(E),
    html: `Dans un club, les ${F(f, g)} des membres sont des filles. Écris le ratio filles : garçons.`,
    visual: barreFrac(f, g, { lab1: 'filles', lab2: 'tous les membres' }),
    hint: `Si les filles sont ${f} parts sur ${g}, combien de parts de même taille reste-t-il pour les garçons ? Écris ensuite le ratio filles : garçons.`,
    solution: `Sur ${g} parts, ${f} sont des filles et ${g} − ${f} = ${g - f} sont des garçons : le ratio est ${rt(...E)}.`,
  };
};
export const q12diff = (n1, n2, a, b, D) => {
  const u = D / (b - a), T = u * (a + b);
  return {
    ...ent(T, (D / (b - a)) * (a + b), '€'),
    html: `${n1} et ${n2} se partagent une somme d'argent selon le ratio ${rt(a, b)}. ${n2} reçoit ${eur(D)} de plus ${que(n1)}. Quelle est la somme partagée ?`,
    visual: ratioBar({ parts: [a, b], names: [n1, n2], total: 'somme : ?', block: `différence = ${eur(D)}` }),
    hint: `${n2} a ${b} parts et ${n1} en a ${a} : la différence est de ${b} − ${a} parts, qui valent ${eur(D)}. Cherche la valeur d'une part, puis multiplie-la par le nombre total de parts (${a} + ${b}).`,
    solution: `${b} − ${a} = ${b - a} parts de différence, qui valent ${M(D)} € : une part = ${M(D)} ÷ ${b - a} = ${M(u)} €. Il y a ${a} + ${b} = ${a + b} parts : ${a + b} × ${M(u)} = <b>${M(T)}</b> €.`,
  };
};
function L12(d) {
  const formes = ['frac', 'pct'];
  if (d >= 1) formes.push('ratio');
  if (d >= 2) formes.push('budget');
  if (d >= 3) formes.push('diff', 'diff');
  const k = pick(formes);
  if (k === 'frac') { const [f, g] = coprime(1, 7, 3, 9, (x, y) => x < y); return q12frac(f, g); }
  if (k === 'pct') {
    const S = pick(d < 3 ? [4, 5, 10] : [4, 5, 10, 20, 25]), a = pick(PCT_S[S]);
    return q12pct(a, S - a);
  }
  if (k === 'ratio') return q12ratio(pick([10, 20, 25, 30, 40, 60, 75, 80, 90]));
  if (k === 'budget') {
    const g = pick([3, 4, 5, 8]), f = tirer(1, g - 1, x => gcd(x, g) === 1), [a, b] = coprime(1, 5, 2, 6, (x, y) => x !== y), S = a + b;
    const lo = Math.ceil(400 / (g * S)), T = g * S * ri(lo, Math.max(lo, Math.min(Math.floor(3000 / (g * S)), lo + 30)));
    return q12budget(T, f, g, a, b);
  }
  const [n1, n2] = noms(2), [a, b] = coprime(1, 6, 2, 8, (x, y) => x < y);
  return q12diff(n1, n2, a, b, (b - a) * pick([5, 10, 15, 20, 25, 30, 40]));
}
function C12() {
  return `<h2>12. Problèmes de synthèse</h2>
<p class="intro">On passe d'une écriture à l'autre : fraction, pourcentage, ratio. Chaque fois, on se ramène à des <b>parts égales</b>.</p>
${def(`• Ratio ${rt('a', 'b')} → la première quantité est les ${F('a', 'a + b')} du total.<br>• Fraction ${F('f', 'g')} → ratio ${rt('f', 'g − f')} (les f parts et les autres).<br>• Pourcentage p % → ratio ${rt('p', '100 − p')}.<br>• Une <b>différence</b> de parts connue permet de trouver la valeur d'une part.`)}
${cols(methode(['Dessine une barre et partage-la en parts égales.', 'Écris ce que représentent les parts connues.', 'Calcule la valeur d\'une part.', 'Réponds à la question posée et vérifie avec la barre.']), ratioBar({ parts: [2, 3], names: ['filles', 'garçons'], unit: '', total: '5 parts = 100 %' }))}
${ex(q12frac(2, 5))}
${ex(q12pct(2, 3))}
${ex(q12ratio(40))}
${ex(q12budget(1200, 3, 8, 2, 3))}
${ex(q12diff('Léa', 'Tom', 2, 5, 60))}
${warn(`⚠️ Le ratio filles : garçons ${rt(2, 3)} ne veut pas dire « 2 filles sur 3 élèves » : le total est de 2 + 3 = 5 parts.<br>⚠️ Dans un partage du « reste », retire d'abord la part déjà utilisée.<br>⚠️ Une différence de 60 € correspond à la différence des <b>nombres de parts</b> (5 − 2), pas au total.`)}
${retenir('je me ramène toujours à un nombre de parts égales, puis à la valeur d\'une part.')}`;
}

export { L7, C7, L8, C8, L9, C9, L10, C10, L11, C11, L12, C12 };

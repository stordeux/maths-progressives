// Niveau 7 : inégalité triangulaire (triangle constructible ou non, longueur possible). 5e.
import { figure, rot, COL } from './draw.js';
import { names, orient, numQ, choiceQ, ex, rep, warn, retenir, meth, def, cours, cols, pick, ri, fr, shuffle } from './util.js';
import { S, triSSS, lenOut } from './l03.js';

/** les trois longueurs en barres à l'échelle : la plus grande en haut, les deux autres bout à bout en dessous */
function rods(sides, nm) {
  const [a, b, c] = sides, [x, y, z] = nm; // c = longueur du côté [x z] ...
  const big = Math.max(a, b, c), k = Math.min(0.6, 8.4 / Math.max(big, a + b + c - big));
  const lens = [['AB', a, COL.b], ['BC', b, COL.g], ['AC', c, COL.a]].map(([n, v, col], i) => ({ n: n.split('').map(ch => ({ A: x, B: y, C: z })[ch]).join(''), v, col }));
  const sorted = [...lens].sort((p, q) => q.v - p.v), L = sorted[0], s2 = sorted[1], s3 = sorted[2];
  const P = {}, segs = [], len = [], H = 0.9;
  P.p1 = [0, H]; P.p2 = [L.v * k, H];
  segs.push({ a: P.p1, b: P.p2, c: L.col, w: 5 });
  P.q1 = [0, 0]; P.q2 = [s2.v * k, 0]; P.q3 = [(s2.v + s3.v) * k, 0];
  segs.push({ a: P.q1, b: P.q2, c: s2.col, w: 5 }, { a: P.q2, b: P.q3, c: s3.col, w: 5 });
  len.push({ a: P.p1, b: P.p2, s: `${L.n} = ${fr(L.v)}`, side: 1, c: L.col, off: 14 }, { a: P.q1, b: P.q2, s: `${s2.n} = ${fr(s2.v)}`, side: -1, c: s2.col, off: 14 }, { a: P.q2, b: P.q3, s: `${s3.n} = ${fr(s3.v)}`, side: -1, c: s3.col, off: 14 });
  segs.push({ a: P.p1, b: P.q1, c: '#a8a29e', dash: true, w: 1.5 }, { a: P.p2, b: [P.p2[0], 0], c: '#a8a29e', dash: true, w: 1.5 }, { a: P.q3, b: [P.q3[0], H], c: '#a8a29e', dash: true, w: 1.5 });
  return { svg: figure({ P, hide: Object.keys(P), segs, len, ext: 0, k: 40, maxW: 480, aria: 'trois longueurs, côtés mis bout à bout' }), big: L };
}
/** triangle schématique avec deux côtés connus et un côté cherché */
function askFig(nm, ab, bc, t) {
  const [a, b, c] = nm, mid = (Math.abs(ab - bc) + ab + bc) / 2 * (ab + bc > 0 ? 1 : 1), T = triSSS(bc, mid, ab);
  const A = rot([T.A[0] * S, T.A[1] * S], t), B = rot([0, 0], t), C = rot([bc * S, 0], t);
  const g = [(A[0] + B[0] + C[0]) / 3, (A[1] + B[1] + C[1]) / 3];
  return figure({
    P: { [a]: A, [b]: B, [c]: C }, segs: [{ a: A, b: B, c: COL.b }, { a: B, b: C, c: COL.g }, { a: A, b: C, c: COL.a, dash: true }],
    len: [lenOut(A, B, g, `${a}${b} = ${fr(ab)}`, COL.b), lenOut(B, C, g, `${b}${c} = ${fr(bc)}`, COL.g), lenOut(A, C, g, `${a}${c} = ?`, COL.a)], ext: 0, maxW: 400, maxH: 230, colors: {}, aria: 'triangle dont un côté est inconnu',
  });
}
const ok = (x, y, z) => x < y + z && y < x + z && z < x + y;
const possible = (ab, bc) => { const r = []; for (let k = 1; k <= 40; k++) if (ok(ab, bc, k)) r.push(k); return r; };
const lenWord = (x, s) => `${x}${s}`;
void lenWord;

export function L7(d) {
  const nm = names(d, 'ABC'), [a, b, c] = nm, t = orient(d), half = d >= 3;
  const forms = d < 1 ? ['peut'] : d < 2 ? ['peut', 'max'] : d < 3 ? ['peut', 'max', 'min'] : d < 4 ? ['peut', 'max', 'min', 'choix'] : ['peut', 'max', 'min', 'choix', 'nombre'];
  const f = pick(forms), pr = () => (half ? ri(6, 40) / 2 : ri(2, 14));
  if (f === 'peut') {
    let sd, yes;
    for (;;) {
      yes = d < 2 ? ri(0, 1) === 1 : ri(0, 2) > 0 || false;
      const x = pr(), y = pr(), mn = Math.abs(x - y), mx = x + y;
      let z;
      if (yes) z = d < 2 ? ri(Math.floor(mn) + 1, Math.ceil(mx) - 1) : (half ? ri(Math.ceil(mn * 2) + 1, Math.floor(mx * 2) - 1) / 2 : ri(Math.floor(mn) + 1, Math.ceil(mx) - 1));
      else z = d >= 2 && ri(0, 2) === 0 ? mx : ri(0, 1) ? mx + ri(1, 4) : Math.max(0.5, mn - ri(1, 3));
      if (z <= 0 || (yes && !ok(x, y, z)) || (!yes && ok(x, y, z))) continue;
      sd = [x, y, z]; break;
    }
    const [x, y, z] = sd, r = rods(sd, nm), sum = [x, y, z].sort((p, q) => p - q);
    const good = ok(x, y, z) ? 'oui' : 'non', bigS = sum[2], small = sum[0] + sum[1];
    return choiceQ({
      opts: [{ v: 'oui', l: '<b>Oui</b>, on peut construire ce triangle' }, { v: 'non', l: '<b>Non</b>, on ne peut pas' }], good,
      html: `Peut-on construire un triangle ${a}${b}${c} tel que ${a}${b} = ${fr(x)} cm, ${b}${c} = ${fr(y)} cm et ${a}${c} = ${fr(z)} cm ?`, visual: r.svg,
      hint: `Repère le côté le plus long (${fr(bigS)} cm) et compare-le à la somme des deux autres côtés (${fr(sum[0])} + ${fr(sum[1])}) : sur le dessin, les deux petits côtés mis bout à bout arrivent-ils jusqu'au bout du grand ?`,
      solution: `Le plus grand côté mesure ${fr(bigS)} cm ; la somme des deux autres est ${fr(sum[0])} + ${fr(sum[1])} = ${fr(small)} cm. ${bigS < small ? `${fr(bigS)} &lt; ${fr(small)} : l'inégalité triangulaire est vérifiée, le triangle est <b>constructible</b>.` : bigS === small ? `${fr(bigS)} = ${fr(small)} : les trois points seraient alignés (triangle « plat »), le triangle n'est <b>pas constructible</b>.` : `${fr(bigS)} &gt; ${fr(small)} : les deux petits côtés ne se rejoignent pas, le triangle n'est <b>pas constructible</b>.`}`,
      msg: v => (bigS === small && v === 'oui' ? `Quand le grand côté est <b>égal</b> à la somme des deux autres, les points sont alignés : ce n'est pas un vrai triangle.` : ''),
      verify: E => E === (ok(x, y, z) && sum[2] < sum[0] + sum[1] ? 'oui' : 'non'),
    });
  }
  const ab = pr(), bc = pr(), pos = possible(ab, bc), fig = askFig(nm, ab, bc, t);
  if (f === 'max') {
    const E = Math.ceil(ab + bc) - 1;
    return numQ({
      E: [E], tpl: `${a}${c} = {0} cm`, comma: false, html: `Dans le triangle ${a}${b}${c}, ${a}${b} = ${fr(ab)} cm et ${b}${c} = ${fr(bc)} cm. Quelle est la plus grande longueur entière (en cm) possible pour ${a}${c} ?`, visual: fig,
      hint: `L'inégalité triangulaire impose ${a}${c} &lt; ${a}${b} + ${b}${c}. Calcule ${a}${b} + ${b}${c} = ${fr(ab + bc)} : ${a}${c} doit être <b>strictement</b> plus petit que ce nombre ; quel est le plus grand entier qui convient ?`,
      solution: `${a}${c} &lt; ${a}${b} + ${b}${c} = ${fr(ab)} + ${fr(bc)} = ${fr(ab + bc)}. ${Number.isInteger(ab + bc) ? `${a}${c} ne peut pas être égal à ${fr(ab + bc)} (triangle plat) : le plus grand entier est <b>${E} cm</b>.` : `Le plus grand entier strictement inférieur à ${fr(ab + bc)} est <b>${E} cm</b>.`}`,
      msg: v => (v[0] === ab + bc ? `Il faut ${a}${c} <b>strictement</b> inférieur à ${fr(ab + bc)} : avec ${fr(ab + bc)}, les points seraient alignés.` : ''),
      verify: E2 => E2[0] === Math.max(...pos),
    });
  }
  if (f === 'min') {
    const E = Math.floor(Math.abs(ab - bc)) + 1;
    return numQ({
      E: [E], tpl: `${a}${c} = {0} cm`, html: `Dans le triangle ${a}${b}${c}, ${a}${b} = ${fr(ab)} cm et ${b}${c} = ${fr(bc)} cm. Quelle est la plus petite longueur entière (en cm) possible pour ${a}${c} ?`, visual: fig,
      hint: `Le plus grand des côtés connus (${fr(Math.max(ab, bc))} cm) doit être plus petit que la somme des deux autres : ${fr(Math.max(ab, bc))} &lt; ${fr(Math.min(ab, bc))} + ${a}${c}. Que peut-on en déduire pour ${a}${c} ?`,
      solution: `Il faut ${fr(Math.max(ab, bc))} &lt; ${fr(Math.min(ab, bc))} + ${a}${c}, donc ${a}${c} &gt; ${fr(Math.max(ab, bc))} − ${fr(Math.min(ab, bc))} = ${fr(Math.abs(ab - bc))}. ${Number.isInteger(ab - bc) ? `${a}${c} ne peut pas être égal à ${fr(Math.abs(ab - bc))} : le plus petit entier est <b>${E} cm</b>.` : `Le plus petit entier strictement supérieur à ${fr(Math.abs(ab - bc))} est <b>${E} cm</b>.`}`,
      msg: v => (v[0] === Math.abs(ab - bc) ? `${a}${c} doit être <b>strictement</b> supérieur à ${fr(Math.abs(ab - bc))} (sinon les points sont alignés).` : v[0] === ab + bc ? `Tu as calculé la somme : cherche plutôt la <b>différence</b> pour la valeur minimale.` : ''),
      verify: E2 => E2[0] === Math.min(...pos),
    });
  }
  if (f === 'nombre') {
    const E = pos.length;
    return numQ({
      E: [E], tpl: `{0} valeurs`, keys: { neg: false }, html: `Dans le triangle ${a}${b}${c}, ${a}${b} = ${fr(ab)} cm et ${b}${c} = ${fr(bc)} cm. Combien de longueurs entières (en cm) ${a}${c} peut-elle avoir ?`, visual: fig,
      hint: `Cherche d'abord la plus petite valeur entière possible pour ${a}${c} (elle doit dépasser la différence ${fr(Math.abs(ab - bc))}), puis la plus grande (elle doit rester inférieure à la somme ${fr(ab + bc)}), puis compte les entiers entre les deux.`,
      solution: `${fr(Math.abs(ab - bc))} &lt; ${a}${c} &lt; ${fr(ab + bc)}. Les entiers possibles vont de ${pos[0]} à ${pos[pos.length - 1]} : il y en a ${pos[pos.length - 1]} − ${pos[0]} + 1 = <b>${E}</b>.`,
      msg: v => (v[0] === pos[pos.length - 1] - pos[0] ? `Quand on compte de ${pos[0]} à ${pos[pos.length - 1]} <b>inclus</b>, il faut ajouter 1.` : ''),
      verify: E2 => E2[0] === pos.length,
    });
  }
  // choix : une seule longueur possible parmi quatre
  const good = pick(pos.filter(v => v >= 2)), bad = [];
  const cands = shuffle([Math.max(1, Math.floor(Math.abs(ab - bc))), Math.ceil(ab + bc) + (Number.isInteger(ab + bc) ? 0 : 1), Math.ceil(ab + bc) + 2, Math.max(1, Math.floor(Math.abs(ab - bc)) - 1)]);
  for (const v of cands) if (!ok(ab, bc, v) && !bad.includes(v) && v !== good) bad.push(v);
  let extra = 0; while (bad.length < 3) { const v = ab + bc + 3 + extra++; if (!ok(ab, bc, v) && !bad.includes(v)) bad.push(v); }
  const vals = shuffle([good, ...bad.slice(0, 3)]);
  return choiceQ({
    opts: vals.map(v => ({ v: String(v), l: `<b>${a}${c} = ${v} cm</b>` })), good: String(good), keep: true,
    html: `Dans le triangle ${a}${b}${c}, ${a}${b} = ${fr(ab)} cm et ${b}${c} = ${fr(bc)} cm. Laquelle de ces valeurs est possible pour ${a}${c} ?`, visual: fig,
    hint: `${a}${c} doit être strictement compris entre la différence ${fr(Math.abs(ab - bc))} et la somme ${fr(ab + bc)} des deux autres côtés : teste chaque proposition avec ces deux bornes.`,
    solution: `Il faut ${fr(Math.abs(ab - bc))} &lt; ${a}${c} &lt; ${fr(ab + bc)}. Seule la valeur <b>${good} cm</b> est dans cet intervalle.`,
    verify: E => ok(ab, bc, +E) && vals.filter(v => ok(ab, bc, v)).length === 1,
  });
}

export function C7() {
  const nm = ['A', 'B', 'C'];
  const r1 = rods([5, 6, 8], nm).svg, r2 = rods([3, 4, 9], nm).svg, r3 = rods([4, 6, 10], nm).svg;
  const af = askFig(nm, 7, 4, 0), af2 = askFig(nm, 6.5, 3.5, 0);
  return cours('7. Inégalité triangulaire', `Peut-on toujours construire un triangle avec trois longueurs données ? Non ! Si un côté est trop long, les deux autres ne « se rejoignent » pas.`,
    def(`<b>Inégalité triangulaire</b> : dans un triangle ABC, chaque côté est <b>strictement plus petit</b> que la somme des deux autres : AB &lt; AC + CB, etc. Il suffit de vérifier avec le <b>plus grand côté</b>.<br>Si le plus grand côté est <b>égal</b> à la somme des deux autres, les trois points sont <b>alignés</b> : le triangle est « plat », on ne peut pas le construire.<br>Pour trois longueurs données, on peut construire un triangle si et seulement si le plus grand côté est strictement plus petit que la somme des deux autres.`),
    meth(`Repère le <b>plus grand</b> des trois côtés.`, `Calcule la <b>somme des deux autres</b>.`, `Compare : plus petit (strictement) → constructible ; égal ou plus grand → impossible.`, `Pour une longueur cherchée x entre deux côtés connus a et b : |a − b| &lt; x &lt; a + b.`),
    cols(r1, r2),
    ex(`Exemple 1 : peut-on construire le triangle ABC avec AB = 5 cm, BC = 6 cm et AC = 8 cm ?`, `Le plus grand côté est AC = 8 cm ; 5 + 6 = 11 et 8 &lt; 11 : l'inégalité est vérifiée, les petits côtés mis bout à bout dépassent le grand.<br>${rep('oui')}`),
    ex(`Exemple 2 : AB = 3 cm, BC = 4 cm, AC = 9 cm`, `Le plus grand côté est AC = 9 cm ; 3 + 4 = 7 et 9 &gt; 7 : les deux petits côtés mis bout à bout n'atteignent pas la longueur du grand, ils ne peuvent pas se rejoindre.<br>${rep('non')}`),
    r3,
    ex(`Exemple 3 : le cas d'égalité, AB = 4 cm, BC = 6 cm, AC = 10 cm`, `Le plus grand côté est AC = 10 cm ; 4 + 6 = 10. Les deux petits côtés posés bout à bout recouvrent exactement le grand : A, B et C sont alignés, on obtient un triangle plat, qui n'existe pas.<br>${rep('non')}`),
    af,
    ex(`Exemple 4 : plus grande valeur entière de AC (AB = 7 cm, BC = 4 cm)`, `Il faut AC &lt; 7 + 4 = 11. AC ne peut pas valoir 11 (triangle plat) : le plus grand entier possible est 10.<br>${rep('AC = 10 cm')}`),
    ex(`Exemple 5 : plus petite valeur entière de AC (AB = 7 cm, BC = 4 cm)`, `Le côté de 7 cm doit être plus petit que 4 + AC, donc AC &gt; 7 − 4 = 3. Le plus petit entier strictement supérieur à 3 est 4.<br>${rep('AC = 4 cm')}`),
    af2,
    ex(`Exemple 6 : laquelle de ces longueurs est possible pour AC ? (AB = 6,5 cm, BC = 3,5 cm ; propositions : 2 cm, 3 cm, 7 cm, 10 cm)`, `Il faut 6,5 − 3,5 &lt; AC &lt; 6,5 + 3,5, c'est-à-dire 3 &lt; AC &lt; 10. Seule la valeur <b>7 cm</b> convient (2 et 3 sont trop petits, 10 est égal à la borne).<br>${rep('AC = 7 cm')}`),
    ex(`Exemple 7 : combien de valeurs entières pour AC ? (AB = 7 cm, BC = 4 cm)`, `3 &lt; AC &lt; 11 : les entiers possibles sont 4, 5, 6, 7, 8, 9, 10, soit 10 − 4 + 1 = 7 valeurs.<br>${rep('7 valeurs')}`),
    warn(`Il faut comparer le <b>plus grand</b> côté à la somme des deux autres (pas deux côtés au hasard).`, `Égalité = triangle plat : la longueur limite elle-même n'est pas possible.`, `Pour le minimum, on utilise la <b>différence</b> des deux côtés connus.`),
    retenir(`un triangle existe si le plus grand côté est strictement plus petit que la somme des deux autres.`));
}

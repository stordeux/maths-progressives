// Calcul mental : 12 niveaux, repris de calcul.html. g(d) renvoie {q, a, tip}.
// d = série de réussites rapides en cours (4 en mode défi).
import { ri, pick, nz, random } from '../../engine/util/rand.js';
import { F } from '../../engine/util/fmt.js';
import { intLine } from '../../engine/draw/numberLine.js';

const r6 = x => Math.round(x * 1e6) / 1e6;
const M = n => { n = r6(n); return (n < 0 ? '−' : '') + String(Math.abs(n)).replace('.', ','); };
const P = n => (n < 0 ? '(' + M(n) + ')' : M(n));
const X = '×', D = '÷';

const LEVELS_=[
 { titre: "Additions et soustractions jusqu'à 20", T: 5, generate: d => {
   if(d<1){const a=ri(1,9),b=ri(1,10-a);return{q:`${a} + ${b}`,a:a+b,tip:`Compte à partir du plus grand : ${Math.max(a,b)}, puis ${Math.min(a,b)} de plus.`}}
   if(d<3&&random()<.6){const a=ri(2,9),b=ri(11-a,9);return{q:`${a} + ${b}`,a:a+b,tip:`Passe par 10 : ${a} + ${10-a} = 10, puis + ${b-(10-a)} = ${a+b}.`}}
   if(d<4){const s=ri(11,19),b=ri(2,9);return{q:`${s} − ${b}`,a:s-b,tip:b<=s-10?`Enlève ${b} aux unités : ${s-10} − ${b} = ${s-10-b}, donc ${s-b}.`:`Passe par 10 : ${s} − ${s-10} = 10, puis 10 − ${b-(s-10)} = ${s-b}.`}}
   const a=ri(2,9),b=ri(2,9),c=ri(2,9);return{q:`${a} + ${b} + ${c}`,a:a+b+c,tip:`Cherche deux nombres qui font 10 ensemble, ou additionne de gauche à droite : ${a+b} + ${c} = ${a+b+c}.`}}},
 { titre: "Compléments à 10, 100, 1000", T: 6, generate: d => {
   const v=Math.min(4,d);
   if(v===0){const a=ri(1,9);return{q:`${a} + ? = 10`,a:10-a,tip:`Les paires qui font 10 : 1+9, 2+8, 3+7, 4+6, 5+5.`}}
   if(v===1){const a=ri(1,19);return{q:`${a} + ? = 20`,a:20-a,tip:`Va jusqu'à 10 ou 20 par étapes.`}}
   if(v===2){const a=5*ri(1,19);return{q:`${a} + ? = 100`,a:100-a,tip:`Complète les unités jusqu'à la dizaine, puis les dizaines jusqu'à 100.`}}
   if(v===3){const a=ri(1,99);return{q:`${a} + ? = 100`,a:100-a,tip:a%10===0?`${a}, c'est ${a/10} dizaines : pour aller à 100 (10 dizaines), il en manque ${10-a/10}.`:`Pour ${a} : les unités vont à 10 (${10-a%10}), les dizaines à 9 (${9-Math.floor(a/10)}). Astuce : dizaines → 9, unités → 10.`}}
   const a=10*ri(1,99);return{q:`${a} + ? = 1000`,a:1000-a,tip:`Comme pour 100, mais avec les centaines : ${a/10} + ${100-a/10} = 100, donc ${a} + ${1000-a} = 1000.`}}},
 { titre: "Tables de 2, 3, 4, 5", T: 5, generate: d => {
   const t=pick(d<1?[2,5]:[2,3,4,5]),n=ri(d<2?1:2,10);
   if(d>=3&&random()<.5)return{q:`${t} ${X} ? = ${t*n}`,a:n,tip:`Récite la table de ${t} jusqu'à ${t*n}.`};
   if(d>=4&&random()<.4)return{q:`${t*n} ${D} ${t}`,a:n,tip:`${t*n} ${D} ${t}, c'est chercher combien de fois ${t} dans ${t*n} : ${t} ${X} ${n} = ${t*n}.`};
   return{q:random()<.5?`${t} ${X} ${n}`:`${n} ${X} ${t}`,a:t*n,tip:t===4?`× 4 = double du double : ${n} → ${2*n} → ${4*n}.`:t===5?`× 5 = moitié de × 10 : ${n*10} ÷ 2 = ${5*n}.`:`Table de ${t}.`}}},
 { titre: "Tables de 6, 7, 8, 9", T: 5, generate: d => {
   const t=pick(d<2?[6,9]:[6,7,8,9]),n=ri(d<1?2:3,10);
   if(d>=3&&random()<.5)return{q:`${t} ${X} ? = ${t*n}`,a:n,tip:`Dans quelle table de ${t} trouve-t-on ${t*n} ?`};
   if(d>=4&&random()<.5)return{q:`${t*n} ${D} ${t}`,a:n,tip:`${t} ${X} ${n} = ${t*n}.`};
   return{q:random()<.5?`${t} ${X} ${n}`:`${n} ${X} ${t}`,a:t*n,tip:t===9?`× 9 = × 10 − 1 fois : ${10*n} − ${n} = ${9*n}.`:t===8?`× 8 = double, double, double : ${n} → ${2*n} → ${4*n} → ${8*n}.`:t===6?`× 6 = × 5 + 1 fois : ${5*n} + ${n} = ${6*n}.`:`7 × ${n} : ${5*n} + ${2*n} = ${7*n} (× 5 puis × 2).`}}},
 { titre: "Doubles et moitiés", T: 6, generate: d => {
   if(d<1){const n=ri(6,49);return{q:`Double de ${n}`,a:2*n,tip:`Double les dizaines puis les unités : ${2*(n-n%10)} + ${2*(n%10)} = ${2*n}.`}}
   if(d<2){const n=2*ri(6,49);return{q:`Moitié de ${n}`,a:n/2,tip:`Moitié de ${n-n%10} = ${(n-n%10)/2} et moitié de ${n%10} = ${n%10/2}, donc ${n/2}.`}}
   if(d<3){const n=ri(51,250);return random()<.5?{q:`Double de ${n}`,a:2*n,tip:`Double des centaines, dizaines, unités séparément.`}:{q:`Moitié de ${2*n}`,a:n,tip:`Moitié de ${2*n} : pense ${2*(n-n%10)} ÷ 2 = ${n-n%10} et ${2*(n%10)} ÷ 2 = ${n%10}.`}}
   if(d<4){const n=2*ri(5,49)+1;return{q:`Moitié de ${n}`,a:n/2,tip:`Moitié de ${n-1} = ${(n-1)/2}, plus la moitié de 1 = 0,5 → ${M(n/2)}.`}}
   const n=ri(11,99)/10;return{q:`Double de ${M(n)}`,a:2*n,tip:`Double de la partie entière, double des dixièmes : ${M(2*n)}.`}}},
 { titre: "× et ÷ par 10, 100, 1000", T: 7, generate: d => {
   const p=pick(d<2?[10,100]:[10,100,1000]);
   if(d<1){const n=ri(2,99);return{q:`${n} ${X} ${p}`,a:n*p,tip:`× ${p} : on ajoute ${String(p).length-1} zéro(s) (chaque chiffre prend ${String(p).length-1} rang(s) de plus).`}}
   const n=pick([ri(11,99)/10,ri(101,999)/100,ri(1,9)/10,ri(2,999)]);
   if(random()<.5)return{q:`${M(n)} ${X} ${p}`,a:n*p,tip:`× ${p} : la virgule se décale de ${String(p).length-1} rang(s) vers la <b>droite</b>.`};
   return{q:`${M(n)} ${D} ${p}`,a:n/p,tip:`÷ ${p} : la virgule se décale de ${String(p).length-1} rang(s) vers la <b>gauche</b> (on ajoute des 0 si besoin).`}}},
 { titre: "Additions et soustractions à 2-3 chiffres", T: 9, generate: d => {
   if(d<2){const a=ri(12,79),b=ri(11,99-a);return{q:`${a} + ${b}`,a:a+b,tip:`Dizaines d'abord : ${a} + ${b-b%10} = ${a+b-b%10}, puis + ${b%10} = ${a+b}.`}}
   if(d<3){const a=ri(31,99),b=ri(11,a-5);return{q:`${a} − ${b}`,a:a-b,tip:`Enlève d'abord les dizaines : ${a} − ${b-b%10} = ${a-b+b%10}, puis − ${b%10} = ${a-b}.`}}
   if(d<4){const a=ri(15,85),b=pick([19,29,39,49,59,99]);return random()<.5?{q:`${a} + ${b}`,a:a+b,tip:`+ ${b} = + ${b+1} − 1 : ${a+b+1} − 1 = ${a+b}.`}:{q:`${a+b} − ${b}`,a:a,tip:`− ${b} = − ${b+1} + 1.`}}
   const a=5*ri(20,150),b=5*ri(10,100);return random()<.5?{q:`${a} + ${b}`,a:a+b,tip:`Centaines, puis dizaines, puis unités.`}:{q:`${a+b} − ${b}`,a:a,tip:`Enlève les centaines, puis les dizaines, puis les unités.`}}},
 { titre: "Astuces : × 5, × 9, × 11, × 25", T: 9, generate: d => {
   const v=pick(d<1?[5]:d<2?[5,9]:d<3?[5,9,11]:[5,9,11,25]);
   if(v===5){const n=d<1?2*ri(6,40):ri(12,60);return{q:`${n} ${X} 5`,a:5*n,tip:`× 5 = × 10 puis ÷ 2 : ${10*n} ÷ 2 = ${5*n}.`}}
   if(v===9){const n=ri(12,40);return{q:`${n} ${X} 9`,a:9*n,tip:`× 9 = × 10 − ${n} : ${10*n} − ${n} = ${9*n}.`}}
   if(v===11){const n=ri(12,45);return{q:`${n} ${X} 11`,a:11*n,tip:`× 11 = × 10 + ${n} : ${10*n} + ${n} = ${11*n}.`}}
   const n=ri(2,24)*(d>=4?1:2);return{q:`${n} ${X} 25`,a:25*n,tip:`× 25 = × 100 puis ÷ 4 : ${100*n} ÷ 4 = ${25*n}.`}}},
 { titre: "Nombres relatifs : + et −", T: 7, generate: d => {
   if(d<1){const a=nz(-9,9),b=nz(-9,9);return{q:`${M(a)} + ${P(b)}`,a:a+b,tip:a*b>0?`Même signe : on additionne les distances à 0 et on garde le signe.`:`Signes contraires : on fait la différence des distances à 0, signe du plus « fort ».`}}
   if(d<3){const a=ri(-15,15),b=ri(1,15);return{q:`${M(a)} − ${b}`,a:a-b,tip:`Soustraire ${b}, c'est reculer de ${b} sur la droite graduée.`}}
   const a=ri(-15,15),b=nz(-15,15);return{q:`${M(a)} − ${P(b)}`,a:a-b,tip:`Soustraire un nombre = ajouter son opposé : ${M(a)} − ${P(b)} = ${M(a)} + ${P(-b)}.`}}},
 { titre: "Nombres relatifs : × et ÷", T: 7, generate: d => {
   const a=nz(-9,9),b=nz(-9,9);
   if(d<2)return{q:`${P(a)} ${X} ${P(b)}`,a:a*b,tip:`Règle des signes : même signe → +, signes contraires → −. Puis ${Math.abs(a)} × ${Math.abs(b)} = ${Math.abs(a*b)}.`};
   if(d<4)return{q:`${P(a*b)} ${D} ${P(b)}`,a:a,tip:`Même règle des signes pour la division. ${Math.abs(a*b)} ÷ ${Math.abs(b)} = ${Math.abs(a)}.`};
   const c=nz(-5,5),e=nz(-4,4);return{q:`${P(c)} ${X} ${P(e)} ${X} ${P(b)}`,a:c*e*b,tip:`Compte les signes − : ${[c,e,b].filter(x=>x<0).length} → ${[c,e,b].filter(x=>x<0).length%2?'nombre impair : résultat négatif':'nombre pair : résultat positif'}.`}}},
 { titre: "Pourcentages", T: 10, generate: d => {
   const v=pick(d<1?[50,10]:d<2?[50,10,25]:d<3?[10,20,25,75,5]:[1,5,20,30,75,150]);
   const base={50:2*ri(5,90),10:10*ri(2,90),25:4*ri(3,50),20:5*ri(2,40),75:4*ri(3,30),5:20*ri(1,25),1:100*ri(1,30),30:10*ri(2,30),150:2*ri(5,50)}[v];
   if(d>=4&&random()<.4){const b=10*ri(3,40),p=pick([10,20,50]),up=random()<.5;return{q:`<span class="small">Un prix de ${b} € ${up?'augmente':'baisse'} de ${p} %.</span> Nouveau prix : ?`,a:up?b*(1+p/100):b*(1-p/100),tip:`${p} % de ${b} = ${b*p/100} ; puis ${b} ${up?'+':'−'} ${b*p/100}.`}}
   const hints={50:`50 % = la moitié.`,10:`10 % = diviser par 10.`,25:`25 % = le quart (÷ 4, ou moitié de la moitié).`,20:`20 % = 2 × 10 %.`,75:`75 % = 3 quarts : (÷ 4) × 3.`,5:`5 % = moitié de 10 %.`,1:`1 % = diviser par 100.`,30:`30 % = 3 × 10 %.`,150:`150 % = le nombre + sa moitié.`};
   return{q:`${v} % de ${base}`,a:base*v/100,tip:`${hints[v]} → ${M(base*v/100)}`}}},
 { titre: "Carrés, racines et fractions", T: 10, generate: d => {
   const v=Math.min(4,ri(Math.max(0,d-1),d));
   if(v===0){const n=ri(2,12);return{q:`${n}<sup>2</sup>`,a:n*n,tip:`${n}<sup>2</sup> = ${n} × ${n}.`}}
   if(v===1){const n=ri(2,15);return{q:`√${n*n}`,a:n,tip:`Quel nombre multiplié par lui-même donne ${n*n} ?`}}
   if(v===2){const[a,b]=pick([[1,2],[1,4],[3,4],[1,5],[2,5],[1,10],[3,10],[1,8],[3,2],[5,4]]);return{q:`${F(a,b)} en écriture décimale`,a:a/b,tip:`${a} ÷ ${b}. À connaître par cœur : ${F(1,2)} = 0,5 ; ${F(1,4)} = 0,25 ; ${F(3,4)} = 0,75 ; ${F(1,5)} = 0,2.`}}
   if(v===3){const b=pick([2,3,4,5,10]),a=ri(1,b-1),n=b*ri(2,15);return{q:`${F(a,b)} de ${n}`,a:n/b*a,tip:`÷ ${b} puis × ${a} : ${n/b} × ${a} = ${n/b*a}.`}}
   const n=ri(13,20);return{q:`${n}<sup>2</sup>`,a:n*n,tip:`${n}<sup>2</sup> = ${n} × 10 + ${n} × ${n-10} = ${10*n} + ${n*(n-10)} = ${n*n}.`}}},
];
/* ================= Encarts « Astuces » : dessins SVG fixes (sans hasard) ================= */
const BLUE = '#1971c2', ORA = '#e8590c', GRN = '#2b8a3e', RED = '#e03131', INK = '#343a40';
const svg = (w, h, label, inner, maxw = w) => `<svg viewBox="0 0 ${w} ${h}" style="max-width:${maxw}px" role="img" aria-label="${label}" font-family="system-ui,sans-serif">${inner}</svg>`;
const tx = (x, y, s, o = {}) => `<text x="${x}" y="${y}" font-size="${o.fs || 15}" text-anchor="${o.a || 'middle'}" fill="${o.c || INK}"${o.b ? ' font-weight="700"' : ''}>${s}</text>`;
/** pointe de flèche en (x, y), direction (ux, uy) unitaire */
const head = (x, y, ux, uy, c) => `<path d="M${x},${y} L${(x - 11 * ux - 5 * uy).toFixed(1)},${(y - 11 * uy + 5 * ux).toFixed(1)} L${(x - 11 * ux + 5 * uy).toFixed(1)},${(y - 11 * uy - 5 * ux).toFixed(1)}Z" fill="${c}"/>`;

/** deux cadres de dix : a + b en passant par 10 */
function tenFrames(a, b) {
  const c = 34, k = 10 - a, rest = b - k, y0 = 36, X = [12, 218];
  let s = '';
  for (let f = 0; f < 2; f++) for (let i = 0; i < 10; i++) {
    const x = X[f] + (i % 5) * c, y = y0 + Math.floor(i / 5) * c;
    s += `<rect x="${x}" y="${y}" width="${c}" height="${c}" fill="#fff" stroke="#495057" stroke-width="2"/>`;
    const col = f === 0 ? (i < a ? BLUE : ORA) : (i < rest ? ORA : '');
    if (col) s += `<circle cx="${x + c / 2}" cy="${y + c / 2}" r="12" fill="${col}"/>`;
  }
  s += tx(X[0] + 85, 24, `${a} + ${k} = 10`, { b: 1, fs: 16 }) + tx(X[1] + 85, 24, `il reste ${rest}`, { c: ORA, b: 1, fs: 16 });
  s += tx(200, 136, `${a} + ${b} = 10 + ${rest} = ${a + b}`, { fs: 18, b: 1, c: GRN });
  return svg(400, 148, `deux cadres de dix : ${a} + ${b} = 10 + ${rest} = ${a + b}`, s);
}

/** droite « à sauts » (non graduée) : on part de start, chaque saut {to, l} est une flèche */
function jumps(start, hops, cap = '') {
  const pts = [start, ...hops.map(h => h.to)], vals = [...new Set(pts)].sort((p, q) => p - q);
  const W = 440, pad = 36, n = vals.length - 1, minG = 64;
  const raw = vals.slice(1).map((v, i) => v - vals[i]), tot = raw.reduce((s, g) => s + g, 0);
  const free = W - 2 * pad - minG * n, X = new Map();
  let x = pad;
  vals.forEach((v, i) => { X.set(v, x); if (i < n) x += minG + free * raw[i] / tot; });
  const y = 88, H = cap ? 150 : 124, end = pts[pts.length - 1];
  let s = `<line x1="${pad - 24}" y1="${y}" x2="${W - pad + 24}" y2="${y}" stroke="#495057" stroke-width="2"/>`;
  vals.forEach(v => {
    const xv = X.get(v).toFixed(1);
    s += `<line x1="${xv}" y1="${y - 7}" x2="${xv}" y2="${y + 7}" stroke="#495057" stroke-width="2"/>` + tx(xv, y + 28, M(v), { fs: 19, b: v === start || v === end, c: v === end ? GRN : INK });
  });
  hops.forEach((h, k) => {
    const x1 = X.get(pts[k]), x2 = X.get(h.to), c = h.c || (h.to >= pts[k] ? BLUE : ORA);
    const hh = Math.min(72, 30 + Math.abs(x2 - x1) * 0.25), mx = (x1 + x2) / 2, L = Math.hypot(x2 - mx, hh);
    s += `<path d="M${x1.toFixed(1)},${y} Q${mx.toFixed(1)},${(y - hh).toFixed(1)} ${x2.toFixed(1)},${y}" fill="none" stroke="${c}" stroke-width="3"/>`
      + head(+x2.toFixed(1), y, (x2 - mx) / L, hh / L, c) + tx(mx.toFixed(1), (y - hh / 2 - 8).toFixed(1), h.l, { c, b: 1, fs: 19 });
  });
  if (cap) s += tx(W / 2, H - 10, cap, { fs: 19, b: 1 });
  return svg(W, H, `sauts sur une droite : ${M(start)} ${hops.map(h => h.l).join(' ')} → ${M(end)}`, s);
}

/** quadrillage de points : rows rangées de cols points ; groups = [{n, c, l}] ; cross = colonnes barrées à droite */
function dotGrid(rows, cols, { groups, cross = 0, crossL = '', cap = '' }) {
  const c = 30, x0 = 16, y0 = cross ? 30 : 12, gw = cols * c, W = x0 + gw + 150, H = y0 + rows * c + (cap ? 44 : 12);
  let s = '', r0 = 0;
  groups.forEach(g => {
    for (let r = r0; r < r0 + g.n; r++) for (let k = 0; k < cols; k++) {
      const off = k >= cols - cross;
      s += `<circle cx="${x0 + k * c + c / 2}" cy="${y0 + r * c + c / 2}" r="10" fill="${off ? '#ced4da' : g.c}"/>`;
    }
    if (g.l) s += `<path d="M${x0 + gw + 8},${y0 + r0 * c + 4} h6 V${y0 + (r0 + g.n) * c - 4} h-6" fill="none" stroke="${g.c}" stroke-width="2"/>` + tx(x0 + gw + 22, y0 + (r0 + g.n / 2) * c + 5, g.l, { a: 'start', c: g.c, b: 1, fs: 16 });
    r0 += g.n;
  });
  if (cross) {
    const xa = x0 + (cols - cross) * c;
    s += `<rect x="${xa + 2}" y="${y0 + 2}" width="${cross * c - 4}" height="${rows * c - 4}" rx="8" fill="none" stroke="${RED}" stroke-width="2.5" stroke-dasharray="6 4"/>`
      + `<line x1="${xa + 6}" y1="${y0 + 6}" x2="${xa + cross * c - 6}" y2="${y0 + rows * c - 6}" stroke="${RED}" stroke-width="2.5"/>` + tx(xa + cross * c / 2, 20, crossL, { c: RED, b: 1, fs: 16 });
  }
  if (cap) s += tx(W / 2, H - 14, cap, { b: 1, fs: 17, c: GRN });
  return svg(W, H, `${rows} rangées de ${cols} points`, s);
}

/** rectangle découpé (calcul d'aire) : cols = [{w, l}], rows = [{h, l}], cells[i][j] ; hatch = ['i-j'] parties enlevées */
function areaRect({ cols, rows, cells, hatch = [], total = '', cap = '' }) {
  const x0 = 50, y0 = total ? 56 : 30, gw = cols.reduce((s, c) => s + c.w, 0), gh = rows.reduce((s, r) => s + r.h, 0);
  const W = x0 + gw + 16, H = y0 + gh + (cap ? 46 : 12), fills = ['#d0ebff', '#ffe8cc', '#d3f9d8', '#f3d9fa'];
  let s = '', y = y0;
  if (total) s += `<path d="M${x0},${y0 - 26} v-8 H${x0 + gw} v8" fill="none" stroke="${INK}" stroke-width="2"/>` + tx(x0 + gw / 2, y0 - 40, total, { b: 1 });
  rows.forEach((r, i) => {
    let x = x0;
    s += tx(x0 - 10, y + r.h / 2 + 6, r.l, { a: 'end', b: 1, fs: 16 });
    cols.forEach((c, j) => {
      const hz = hatch.includes(`${i}-${j}`);
      s += `<rect x="${x}" y="${y}" width="${c.w}" height="${r.h}" fill="${hz ? '#fff5f5' : fills[(i + j) % 4]}" stroke="${hz ? RED : '#495057'}" stroke-width="2"${hz ? ' stroke-dasharray="6 4"' : ''}/>`
        + tx(x + c.w / 2, y + r.h / 2 + 6, cells[i][j], { b: 1, fs: 17, c: hz ? RED : INK });
      if (i === 0) s += tx(x + c.w / 2, y0 - 9, c.l, { b: 1, fs: 16 });
      x += c.w;
    });
    y += r.h;
  });
  if (cap) s += tx(W / 2, H - 12, cap, { b: 1, fs: 17, c: GRN });
  return svg(W, H, 'rectangle découpé pour calculer un produit', s);
}

/** barre partagée : parts = [{w, l, c}], braces = [{from, to, l, c, bottom}] (indices des parts) */
function partBar({ parts, braces = [], cap = '' }) {
  const x0 = 14, top = braces.some(b => !b.bottom), bot = braces.some(b => b.bottom), y0 = top ? 46 : 12, bh = 44;
  const xs = [x0]; parts.forEach(p => xs.push(xs[xs.length - 1] + p.w));
  const W = xs[xs.length - 1] + x0, H = y0 + bh + (bot ? 46 : 10) + (cap ? 34 : 0);
  let s = '';
  parts.forEach((p, i) => { s += `<rect x="${xs[i]}" y="${y0}" width="${p.w}" height="${bh}" fill="${p.c || '#fff'}" stroke="#495057" stroke-width="2"/>` + tx(xs[i] + p.w / 2, y0 + bh / 2 + 6, p.l, { b: 1, fs: p.fs || 15 }); });
  braces.forEach(b => {
    const xa = xs[b.from] + 2, xb = xs[b.to + 1] - 2, c = b.c || INK;
    if (b.bottom) s += `<path d="M${xa},${y0 + bh + 6} v8 H${xb} v-8" fill="none" stroke="${c}" stroke-width="2"/>` + tx((xa + xb) / 2, y0 + bh + 34, b.l, { c, b: 1, fs: 16 });
    else s += `<path d="M${xa},${y0 - 6} v-8 H${xb} v8" fill="none" stroke="${c}" stroke-width="2"/>` + tx((xa + xb) / 2, y0 - 22, b.l, { c, b: 1, fs: 16 });
  });
  if (cap) s += tx(W / 2, H - 10, cap, { b: 1, fs: 17, c: GRN });
  return svg(W, H, 'barre partagée en parts', s);
}

/** arbre de décomposition : n → deux morceaux → chacun transformé (op) → somme */
function decomp({ n, parts, op, res, total }) {
  const cx = 200, xs = [110, 290], Y = [26, 96, 176, 246];
  const box = (x, y, s, c = INK, fill = '#fff') => `<rect x="${x - 48}" y="${y - 19}" width="96" height="38" rx="10" fill="${fill}" stroke="${c}" stroke-width="2"/>` + tx(x, y + 7, s, { b: 1, c, fs: 18 });
  let s = '';
  xs.forEach((x, i) => {
    s += `<line x1="${cx}" y1="${Y[0] + 19}" x2="${x}" y2="${Y[1] - 19}" stroke="#868e96" stroke-width="2"/>`;
    s += `<line x1="${x}" y1="${Y[1] + 19}" x2="${x}" y2="${Y[2] - 21}" stroke="${BLUE}" stroke-width="3"/>` + head(x, Y[2] - 19, 0, 1, BLUE) + tx(x + (i ? 12 : -12), (Y[1] + Y[2]) / 2 + 6, op, { a: i ? 'start' : 'end', c: BLUE, b: 1, fs: 16 });
    s += `<line x1="${x}" y1="${Y[2] + 19}" x2="${cx}" y2="${Y[3] - 19}" stroke="#868e96" stroke-width="2"/>`;
  });
  s += box(cx, Y[0], n) + box(xs[0], Y[1], parts[0]) + box(xs[1], Y[1], parts[1]) + tx(cx, Y[1] + 7, '+', { fs: 22, b: 1 })
    + box(xs[0], Y[2], res[0], BLUE, '#e7f5ff') + box(xs[1], Y[2], res[1], BLUE, '#e7f5ff') + tx(cx, Y[2] + 7, '+', { fs: 22, b: 1 })
    + box(cx, Y[3], total, GRN, '#ebfbee');
  return svg(400, 272, `${n} se découpe en ${parts.join(' et ')} ; ${op} donne ${res.join(' et ')} ; total ${total}`, s, 400);
}

/** tableau de numération : rows = [{d: {colonne: chiffre}, z: [colonnes des 0 ajoutés], l, gap}] ; arrows = [{r, from, to}] */
const COLS = ['milliers', 'centaines', 'dizaines', 'unités', 'dixièmes', 'centièmes'];
function placeTable(rows, arrows) {
  const cw = 60, x0 = 8, hh = 30, rh = 38, W = x0 + 6 * cw + 150;
  const ys = []; let y = hh;
  rows.forEach(r => { y += r.gap || 0; ys.push(y); y += rh; });
  const H = y + 8;
  let s = '';
  COLS.forEach((c, i) => { s += `<rect x="${x0 + i * cw}" y="0" width="${cw}" height="${hh}" fill="#f1f3f5" stroke="#adb5bd"/>` + tx(x0 + i * cw + cw / 2, 19, c, { fs: 11.5 }); });
  rows.forEach((r, k) => {
    for (let i = 0; i < 6; i++) {
      s += `<rect x="${x0 + i * cw}" y="${ys[k]}" width="${cw}" height="${rh}" fill="#fff" stroke="#adb5bd"/>`;
      if (r.d[i] !== undefined) s += tx(x0 + i * cw + cw / 2, ys[k] + 27, r.d[i], { fs: 21, b: 1, c: (r.z || []).includes(i) ? '#adb5bd' : INK });
    }
    s += tx(x0 + 6 * cw + 12, ys[k] + 25, r.l, { a: 'start', b: 1, fs: 15 });
  });
  s += `<line x1="${x0 + 4 * cw}" y1="0" x2="${x0 + 4 * cw}" y2="${H - 8}" stroke="${RED}" stroke-width="4"/>`;
  arrows.forEach(a => {
    const x1 = x0 + a.from * cw + cw / 2, x2 = x0 + a.to * cw + cw / 2, y1 = ys[a.r] + rh + 2, y2 = ys[a.r + 1] - 2, L = Math.hypot(x2 - x1, y2 - y1), c = a.to < a.from ? BLUE : ORA;
    s += `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${c}" stroke-width="2.5"/>` + head(x2, y2, (x2 - x1) / L, (y2 - y1) / L, c);
  });
  return svg(W, H, 'tableau de numération : les chiffres changent de rang', s);
}

/** tableau de la règle des signes (× et ÷) */
function signTable() {
  const c = 62, x0 = 4, y0 = 4, lab = ['×  ÷', '+', '−'];
  let s = '';
  for (let i = 0; i < 3; i++) for (let j = 0; j < 3; j++) {
    const head0 = i === 0 || j === 0, same = lab[i] === lab[j];
    const fill = head0 ? '#f1f3f5' : same ? '#ebfbee' : '#fff5f5', t = i === 0 ? lab[j] : j === 0 ? lab[i] : same ? '+' : '−';
    s += `<rect x="${x0 + j * c}" y="${y0 + i * c}" width="${c}" height="${c}" fill="${fill}" stroke="#adb5bd" stroke-width="1.5"/>` + tx(x0 + j * c + c / 2, y0 + i * c + c / 2 + 9, t, { fs: i && j ? 28 : 22, b: 1, c: head0 ? INK : same ? GRN : RED });
  }
  return svg(3 * c + 8, 3 * c + 8, 'règle des signes : même signe donne plus, signes contraires donnent moins', s, 200);
}

const COURS_ = [
 /* 1 */ `<h2>1. Jusqu'à 20</h2>
<p class="intro">Ces petits calculs reviennent partout. Les faire vite et sans les doigts te libère la tête pour le reste !</p>
<div class="def"><b>Passer par 10</b> : on complète d'abord jusqu'à 10, puis on ajoute ce qui reste.<br>Les <b>paires qui font 10</b> : 1 + 9, 2 + 8, 3 + 7, 4 + 6, 5 + 5.</div>
<div class="cols"><div class="methode"><b>Méthode</b><ol><li>Petite addition : pars du <b>plus grand</b> nombre et ajoute le petit.</li><li>Si on dépasse 10 : complète jusqu'à 10, puis ajoute le reste.</li><li>Soustraction : redescends d'abord jusqu'à 10, puis enlève le reste.</li><li>Trois nombres : cherche deux nombres qui font 10 ensemble.</li></ol></div>
${tenFrames(8, 5)}</div>
<div class="ex"><span class="q">Exemple 1 : 8 + 5</span><br>8 + <b>2</b> = 10, et il reste 5 − 2 = 3 à ajouter : 10 + 3 = <b>13</b>.</div>
<div class="ex"><span class="q">Exemple 2 : 14 − 6</span><br>14 − <b>4</b> = 10, et il reste 6 − 4 = 2 à enlever : 10 − 2 = <b>8</b>.</div>
<div class="ex"><span class="q">Exemple 3 : 7 + 5 + 3</span><br>7 et 3 font 10 : (7 + 3) + 5 = 10 + 5 = <b>15</b>. On a le droit de changer l'ordre dans une addition.</div>
<div class="warn">⚠️ Ne compte pas de 1 en 1 sur tes doigts : c'est lent et on se trompe facilement.<br>⚠️ Dans une soustraction, on ne peut <b>pas</b> changer l'ordre : 14 − 6 n'est pas 6 − 14.</div>
<div class="retenir">À retenir : pour dépasser 10, je passe par 10.</div>`,

 /* 2 */ `<h2>2. Compléments</h2>
<p class="intro">Le complément, c'est ce qu'il manque pour arriver à 10, 100 ou 1000. C'est très utile pour rendre la monnaie !</p>
<div class="def">Le <b>complément à 100</b> de 37 est le nombre ? tel que 37 + ? = 100. Ici, c'est 63.<br>Paires qui font 10 : 1 + 9, 2 + 8, 3 + 7, 4 + 6, 5 + 5.<br>Complément à 20 : 8 + ? = 20 → 8 + 2 = 10, puis 10 + 10 = 20 : il manque <b>12</b>.</div>
<div class="cols"><div class="methode"><b>Méthode</b><ol><li>Complète d'abord jusqu'à la <b>dizaine</b> suivante.</li><li>Puis complète de dizaine en dizaine jusqu'à 100.</li><li>Raccourci pour 100 : les dizaines vont à <b>9</b>, les unités à <b>10</b>.</li><li>Pour 1000 avec un nombre comme 380 : pense 38 + ? = 100.</li></ol></div>
${jumps(37, [{ to: 40, l: '+ 3' }, { to: 100, l: '+ 60' }], '37 + 63 = 100')}</div>
<div class="ex"><span class="q">Exemple 1 : 37 + ? = 100</span><br>Dizaines : 3 → <b>6</b> (3 + 6 = 9). Unités : 7 → <b>3</b> (7 + 3 = 10). Réponse : <b>63</b>.</div>
<div class="ex"><span class="q">Exemple 2 : 85 + ? = 100</span><br>85 + 5 = 90, puis 90 + 10 = 100 : il manque 5 + 10 = <b>15</b>.</div>
<div class="ex"><span class="q">Exemple 3 : 380 + ? = 1000</span><br>38 + 62 = 100, donc 380 + <b>620</b> = 1000.</div>
<div class="warn">⚠️ Le complément à 100 de 37 n'est pas 73 : vérifie toujours, 37 + 73 = 110 !<br>⚠️ Si le nombre finit par 0, la règle « 9 et 10 » ne marche pas : 40 + <b>60</b> = 100.</div>
<div class="retenir">À retenir : complément à 100 → les dizaines vont à 9 et les unités à 10.</div>`,

 /* 3 */ `<h2>3. Tables de 2 à 5</h2>
<p class="intro">Les tables sont les briques de tous les calculs. Quelques astuces aident à retrouver un résultat oublié.</p>
<div class="def">× 2 : c'est le <b>double</b>.<br>× 4 : c'est le <b>double du double</b>.<br>× 5 : c'est la <b>moitié de × 10</b>.<br>L'ordre ne compte pas : 3 × 8 = 8 × 3.</div>
<div class="cols"><div class="methode"><b>Méthode</b><ol><li>Produit : récite la table, ou utilise l'astuce du double ou de × 10.</li><li>Facteur manquant (4 × ? = 32) : cherche 32 dans la table de 4.</li><li>Division (35 ÷ 5) : combien de fois 5 dans 35 ? Cherche 5 × ? = 35.</li></ol></div>
${dotGrid(4, 7, { groups: [{ n: 2, c: BLUE, l: '7 × 2 = 14' }, { n: 2, c: ORA, l: '7 × 2 = 14' }], cap: '7 × 4 = 14 + 14 = 28' })}</div>
<div class="ex"><span class="q">Exemple 1 : 7 × 4</span><br>Double de 7 : 14 ; double de 14 : <b>28</b>.</div>
<div class="ex"><span class="q">Exemple 2 : 8 × 5</span><br>8 × 10 = 80, et la moitié de 80 est <b>40</b>.</div>
<div class="ex"><span class="q">Exemple 3 : 4 × ? = 32 et 35 ÷ 5</span><br>4 × <b>8</b> = 32. Et 5 × 7 = 35, donc 35 ÷ 5 = <b>7</b>.</div>
<div class="warn">⚠️ Ne confonds pas × et + : 4 × 7 = 28, mais 4 + 7 = 11.<br>⚠️ Pour une division, cherche dans la table du <b>diviseur</b> : 35 ÷ 5 → table de 5.</div>
<div class="retenir">À retenir : × 4 = double du double ; × 5 = × 10 puis moitié.</div>`,

 /* 4 */ `<h2>4. Tables de 6 à 9</h2>
<p class="intro">Ce sont les tables les plus difficiles. Avec les astuces, tu peux toujours retrouver un résultat à partir d'un plus facile.</p>
<div class="def">× 9 = × 10 moins une fois le nombre.<br>× 8 = trois doubles de suite.<br>× 6 = × 5 plus une fois le nombre.<br>× 7 = × 5 plus × 2.</div>
<div class="cols"><div class="methode"><b>Méthode</b><ol><li>Si tu connais le résultat par cœur, écris-le.</li><li>Sinon, pars d'un calcul facile (× 5 ou × 10) et corrige.</li><li>Facteur manquant ou division : cherche le nombre dans la table.</li></ol></div>
${dotGrid(7, 10, { groups: [{ n: 7, c: BLUE, l: '7 × 10 = 70' }], cross: 1, crossL: '− 7', cap: '7 × 9 = 70 − 7 = 63' })}</div>
<div class="ex"><span class="q">Exemple 1 : 6 × 9</span><br>6 × 10 = 60, on enlève une fois 6 : 60 − 6 = <b>54</b>.</div>
<div class="ex"><span class="q">Exemple 2 : 7 × 8</span><br>Double de 7 : 14 → 28 → <b>56</b>. Astuce : 5, 6, 7, 8 → 56 = 7 × 8.</div>
<div class="ex"><span class="q">Exemple 3 : 6 × ? = 42 et 63 ÷ 9</span><br>6 × <b>7</b> = 42. Et 9 × 7 = 63, donc 63 ÷ 9 = <b>7</b>.</div>
<div class="warn">⚠️ Pour × 9, on enlève le <b>nombre</b>, pas 9 : 7 × 9 = 70 − 7 (et pas 70 − 9).<br>⚠️ Pièges fréquents : 7 × 8 = 56 (pas 54), 6 × 7 = 42, 8 × 8 = 64.</div>
<div class="retenir">À retenir : dans la table de 9, la somme des chiffres fait 9 (54 : 5 + 4 = 9).</div>`,

 /* 5 */ `<h2>5. Doubles et moitiés</h2>
<p class="intro">Doubler, c'est multiplier par 2 ; prendre la moitié, c'est diviser par 2. On les utilise sans arrêt (× 4, × 5, partages…).</p>
<div class="def">On <b>découpe</b> le nombre en morceaux faciles (dizaines et unités), on double ou on partage chaque morceau, puis on additionne.<br>La moitié d'un nombre <b>impair</b> se termine par <b>,5</b>.</div>
<div class="cols"><div class="methode"><b>Méthode</b><ol><li>Découpe : 37 = 30 + 7.</li><li>Double (ou moitié) de chaque morceau.</li><li>Additionne les résultats.</li><li>Pour une moitié, choisis des morceaux <b>pairs</b> : 74 = 60 + 14.</li></ol></div>
${decomp({ n: '37', parts: ['30', '7'], op: '× 2', res: ['60', '14'], total: '74' })}</div>
<div class="ex"><span class="q">Exemple 1 : double de 37</span><br>Double de 30 = 60 ; double de 7 = 14 ; 60 + 14 = <b>74</b>.</div>
<div class="ex"><span class="q">Exemple 2 : moitié de 74</span><br>74 = 60 + 14 ; moitié de 60 = 30 ; moitié de 14 = 7 ; donc <b>37</b>.</div>
<div class="ex"><span class="q">Exemple 3 : moitié de 35 et double de 4,7</span><br>Moitié de 34 = 17, plus la moitié de 1 = 0,5 : <b>17,5</b>.<br>Double de 4 = 8 ; double de 0,7 = 1,4 ; 8 + 1,4 = <b>9,4</b>.</div>
<div class="warn">⚠️ La moitié de 74 n'est pas 32 : on ne prend pas la moitié de chaque chiffre (7 est impair). Coupe 74 en 60 + 14 (30 + 7), ou en 70 + 4 (35 + 2).<br>⚠️ Le double de 4,7 n'est pas 8,14 : 0,7 + 0,7 = 1,4.</div>
<div class="retenir">À retenir : je découpe, je double (ou je partage) chaque morceau, j'additionne.</div>`,

 /* 6 */ `<h2>6. × et ÷ par 10, 100, 1000</h2>
<p class="intro">Multiplier ou diviser par 10, 100 ou 1000 se fait sans poser d'opération : il suffit de déplacer les chiffres.</p>
<div class="def">× 10, × 100, × 1000 : chaque chiffre prend 1, 2 ou 3 rangs <b>de plus</b> ; la virgule se décale de 1, 2, 3 rangs vers la <b>droite</b>.<br>÷ 10, ÷ 100, ÷ 1000 : la virgule se décale vers la <b>gauche</b>.</div>
${placeTable([
  { d: { 3: '3', 4: '7' }, l: '3,7' },
  { d: { 1: '3', 2: '7', 3: '0' }, z: [3], l: '× 100 → 370', gap: 26 },
  { d: { 2: '4', 3: '5' }, l: '45', gap: 14 },
  { d: { 3: '0', 4: '4', 5: '5' }, z: [3], l: '÷ 100 → 0,45', gap: 26 },
], [{ r: 0, from: 3, to: 1 }, { r: 0, from: 4, to: 2 }, { r: 2, from: 2, to: 4 }, { r: 2, from: 3, to: 5 }])}
<div class="methode"><b>Méthode</b><ol><li>Compte les zéros : 10 → 1 rang, 100 → 2 rangs, 1000 → 3 rangs.</li><li>× : le nombre devient plus <b>grand</b>, la virgule va vers la droite.</li><li>÷ : le nombre devient plus <b>petit</b>, la virgule va vers la gauche.</li><li>S'il manque des chiffres, complète avec des 0.</li></ol></div>
<div class="ex"><span class="q">Exemple 1 : 3,7 × 100 et 45 ÷ 100</span><br>3,7 × 100 = <b>370</b> (la virgule avance de 2 rangs, on ajoute un 0).<br>45 ÷ 100 = <b>0,45</b>.</div>
<div class="ex"><span class="q">Exemple 2 : 0,08 × 1000 et 7 ÷ 1000</span><br>0,08 × 1000 = <b>80</b> &nbsp; ; &nbsp; 7 ÷ 1000 = <b>0,007</b> (on ajoute des 0 devant).</div>
<div class="warn">⚠️ « Ajouter un 0 » ne marche que pour les nombres entiers : 3,7 × 10 = 37, pas 3,70.<br>⚠️ Vérifie le sens : après un ÷, le résultat doit être plus petit.</div>
<div class="retenir">À retenir : × → la virgule va à droite ; ÷ → la virgule va à gauche.</div>`,

 /* 7 */ `<h2>7. Calculs à 2 ou 3 chiffres</h2>
<p class="intro">Pour additionner ou soustraire de tête des nombres plus grands, on avance par étapes : d'abord les gros morceaux.</p>
<div class="def">On <b>décompose</b> le deuxième nombre : 38 = 30 + 8. On ajoute (ou on enlève) d'abord les dizaines, puis les unités.<br>Avec 19, 29, 99… : + 29 = + 30 − 1.</div>
<div class="cols"><div class="methode"><b>Méthode</b><ol><li>Garde le premier nombre entier.</li><li>Ajoute ou enlève les <b>centaines</b>, puis les <b>dizaines</b>, puis les <b>unités</b>.</li><li>Avec 29, 49, 99… : arrondis à la dizaine, puis corrige de 1.</li></ol></div>
${jumps(47, [{ to: 77, l: '+ 30' }, { to: 85, l: '+ 8' }], '47 + 38 = 85')}</div>
<div class="ex"><span class="q">Exemple 1 : 47 + 38 et 92 − 57</span><br>47 + 30 = 77, puis 77 + 8 = <b>85</b>.<br>92 − 50 = 42, puis 42 − 7 = <b>35</b>.</div>
<div class="ex"><span class="q">Exemple 2 : 56 + 29 et 83 − 49</span><br>56 + 30 = 86, puis 86 − 1 = <b>85</b>.<br>83 − 50 = 33, puis 33 + 1 = <b>34</b> (on avait enlevé 1 de trop).</div>
${jumps(56, [{ to: 86, l: '+ 30' }, { to: 85, l: '− 1' }], '56 + 29 = 85')}
<div class="ex"><span class="q">Exemple 3 : 345 + 280</span><br>345 + 200 = 545, puis 545 + 80 = <b>625</b>.</div>
<div class="warn">⚠️ − 29, c'est − 30 <b>+ 1</b> (et non − 30 − 1) : en enlevant 30, on a enlevé 1 de trop.<br>⚠️ N'oublie pas les retenues : 77 + 8 passe la dizaine, cela donne 85.</div>
<div class="retenir">À retenir : d'abord les dizaines, ensuite les unités.</div>`,

 /* 8 */ `<h2>8. Astuces de multiplication</h2>
<p class="intro">Multiplier par 5, 9, 11 ou 25 devient facile si l'on passe par 10 ou 100, bien plus simples.</p>
<div class="def">× 5 = × 10 puis ÷ 2.<br>× 9 = × 10 puis <b>moins</b> une fois le nombre.<br>× 11 = × 10 puis <b>plus</b> une fois le nombre.<br>× 25 = × 100 puis ÷ 4 (car 4 × 25 = 100).</div>
<div class="cols"><div class="methode"><b>Méthode</b><ol><li>Reconnais le multiplicateur : 5, 9, 11 ou 25.</li><li>Multiplie d'abord par 10 (ou 100).</li><li>Corrige : moitié, moins le nombre, plus le nombre, ou quart.</li></ol></div>
${areaRect({ cols: [{ w: 270, l: '9' }, { w: 56, l: '1' }], rows: [{ h: 96, l: '23' }], cells: [['23 × 9', '23']], hatch: ['0-1'], total: '10', cap: '23 × 9 = 230 − 23 = 207' })}</div>
<div class="ex"><span class="q">Exemple 1 : 34 × 5 et 37 × 5</span><br>340 ÷ 2 = <b>170</b>. &nbsp; 370 ÷ 2 = <b>185</b> (moitié de 360 = 180, plus moitié de 10 = 5).</div>
<div class="ex"><span class="q">Exemple 2 : 23 × 9 et 34 × 11</span><br>230 − 23 = <b>207</b>. &nbsp; 340 + 34 = <b>374</b>.</div>
<div class="ex"><span class="q">Exemple 3 : 16 × 25</span><br>16 × 100 = 1600, puis 1600 ÷ 4 = <b>400</b> (moitié : 800, encore moitié : 400).</div>
${partBar({ parts: [{ w: 100, l: '25', c: '#ffe8cc' }, { w: 100, l: '25' }, { w: 100, l: '25' }, { w: 100, l: '25' }], braces: [{ from: 0, to: 3, l: '100' }], cap: '100 = 4 × 25' })}
<div class="warn">⚠️ 23 × 9, ce n'est pas 230 − 9 : on enlève une fois <b>23</b>.<br>⚠️ L'astuce « on écarte les chiffres » de × 11 (34 × 11 = 3<b>7</b>4) a un piège : 48 × 11 = 528, pas 4128. La méthode « × 10 + le nombre » marche toujours.</div>
<div class="retenir">À retenir : je passe par × 10 ou × 100, puis je corrige.</div>`,

 /* 9 */ `<h2>9. Relatifs : + et −</h2>
<p class="intro">Les nombres relatifs servent pour les températures, les altitudes, les gains et les pertes. On les calcule en pensant à la droite graduée.</p>
<div class="def"><b>Même signe</b> : on additionne les distances à 0 et on garde le signe : −4 + (−7) = −11.<br><b>Signes contraires</b> : on soustrait les distances à 0 et on prend le signe du nombre le plus éloigné de 0 : −9 + 4 = −5.<br><b>Soustraire</b>, c'est ajouter l'opposé : 3 − (−5) = 3 + 5 = 8.</div>
<div class="methode"><b>Méthode</b><ol><li>Une soustraction ? Transforme-la : − (−5) devient + 5, − (+5) devient − 5.</li><li>Regarde les signes des deux nombres.</li><li>Même signe : additionne ; signes contraires : soustrais les distances à 0.</li><li>Mets le bon signe.</li></ol></div>
${intLine({ min: -10, max: 2, arrows: [{ from: 0, to: -3, l: '−3', c: BLUE }, { from: -3, to: -9, l: '− 6', c: ORA }], marks: [{ x: -9, l: '−9' }] }).replace('class="vis"', 'class="vis" style="width:100%;max-width:640px"')}
<div class="ex"><span class="q">Exemple 1 : −3 − 6</span><br>On part de −3 et on recule de 6 : <b>−9</b>. Il fait −3 °C et la température baisse de 6 °C : −9 °C.</div>
<div class="ex"><span class="q">Exemple 2 : −9 + 4 et 5 − 8</span><br>Signes contraires : 9 − 4 = 5, et 9 est le plus loin de 0 : −9 + 4 = <b>−5</b>.<br>5 − 8 : on recule de 8 depuis 5, on passe 0 : <b>−3</b>.</div>
<div class="ex"><span class="q">Exemple 3 : 3 − (−5)</span><br>Soustraire −5, c'est ajouter 5 : 3 + 5 = <b>8</b>.</div>
<div class="warn">⚠️ −4 + (−7) n'est pas 11 : deux nombres négatifs donnent un résultat négatif, −11.<br>⚠️ 3 − (−5) n'est pas −2 : − (−5) devient + 5.</div>
<div class="retenir">À retenir : soustraire un nombre, c'est ajouter son opposé.</div>`,

 /* 10 */ `<h2>10. Relatifs : × et ÷</h2>
<p class="intro">Pour multiplier ou diviser des relatifs, on calcule comme d'habitude avec les distances à 0, puis on trouve le signe.</p>
<div class="def"><b>Règle des signes</b> : deux nombres de <b>même signe</b> → résultat <b>positif</b> ; de <b>signes contraires</b> → résultat <b>négatif</b>. Même règle pour ÷.<br>Avec plusieurs facteurs : un nombre <b>pair</b> de signes − → positif ; <b>impair</b> → négatif.</div>
<div class="cols"><div class="methode"><b>Méthode</b><ol><li>Trouve d'abord le <b>signe</b> du résultat (règle des signes, ou compte les −).</li><li>Calcule avec les nombres sans leur signe : 6 × 7 = 42.</li><li>Écris le résultat avec son signe.</li></ol></div>
${signTable()}</div>
<div class="ex"><span class="q">Exemple 1 : (−6) × 7</span><br>Signes contraires → négatif. 6 × 7 = 42. Donc (−6) × 7 = <b>−42</b>.</div>
<div class="ex"><span class="q">Exemple 2 : (−48) ÷ (−6)</span><br>Même signe → positif. 48 ÷ 6 = 8. Donc (−48) ÷ (−6) = <b>8</b>.</div>
<div class="ex"><span class="q">Exemple 3 : (−2) × 3 × (−4)</span><br>Deux signes − : nombre pair → positif. 2 × 3 × 4 = 24. Résultat : <b>24</b>.</div>
<div class="warn">⚠️ « Moins par moins donne plus » ne vaut que pour × et ÷ : (−3) × (−4) = 12, mais (−3) + (−4) = −7.<br>⚠️ Compte <b>tous</b> les signes − : (−1) × (−2) × (−3) = −6 (trois −, impair).</div>
<div class="retenir">À retenir : même signe → +, signes contraires → −.</div>`,

 /* 11 */ `<h2>11. Pourcentages</h2>
<p class="intro">Les pourcentages sont partout : soldes, notes, statistiques. Les plus courants se calculent de tête.</p>
<div class="def">Prendre <b>p %</b> d'un nombre, c'est prendre p parts sur 100.<br>50 % = la moitié ; 25 % = le quart ; 75 % = trois quarts ;<br>10 % = ÷ 10 ; 1 % = ÷ 100 ; 20 % = 2 × 10 % ; 5 % = moitié de 10 % ; 150 % = le nombre + sa moitié.</div>
<div class="methode"><b>Méthode</b><ol><li>Reconnais un pourcentage « facile » (50, 25, 10, 1…).</li><li>Sinon, construis-le à partir de 10 % : 30 % = 3 × 10 %.</li><li>Prix qui augmente ou baisse : calcule la variation, puis ajoute-la ou enlève-la au prix de départ.</li></ol></div>
${partBar({ parts: Array.from({ length: 10 }, (_, i) => ({ w: 44, l: '8 €', c: i < 2 ? '#ffe8cc' : '#fff' })), braces: [{ from: 0, to: 1, l: '20 % = 16 €', c: ORA }, { from: 0, to: 9, l: '100 % = 80 €', bottom: 1 }] })}
<div class="ex"><span class="q">Exemple 1 : 20 % de 45</span><br>10 % de 45 = 4,5 ; donc 20 % = 2 × 4,5 = <b>9</b>.</div>
<div class="ex"><span class="q">Exemple 2 : 75 % de 36 et 5 % de 140</span><br>Le quart de 36 est 9, trois quarts : 9 × 3 = <b>27</b>.<br>10 % de 140 = 14, la moitié : <b>7</b>.</div>
<div class="ex"><span class="q">Exemple 3 : un prix de 80 € baisse de 20 %</span><br>20 % de 80 = 16 €. Nouveau prix : 80 − 16 = <b>64 €</b>.</div>
<div class="warn">⚠️ 5 % ne veut pas dire ÷ 5 : c'est ÷ 20 (moitié de 10 %).<br>⚠️ Pour un nouveau prix, n'oublie pas la dernière étape : 16 € est la baisse, pas le prix !</div>
<div class="retenir">À retenir : 10 %, c'est diviser par 10 ; tout le reste se construit à partir de là.</div>`,

 /* 12 */ `<h2>12. Carrés, racines, fractions</h2>
<p class="intro">Connaître les carrés et quelques fractions par cœur fait gagner beaucoup de temps, en calcul comme en géométrie.</p>
<div class="def">Le <b>carré</b> de n : n<sup>2</sup> = n × n.<br>La <b>racine carrée</b> de 144 : √144 = 12, car 12 × 12 = 144.<br>Carrés à connaître : 1, 4, 9, 16, 25, 36, 49, 64, 81, 100, 121, 144 (puis 169, 196, 225).<br>${F(1, 2)} = 0,5 &nbsp; ${F(1, 4)} = 0,25 &nbsp; ${F(3, 4)} = 0,75 &nbsp; ${F(1, 5)} = 0,2 &nbsp; ${F(1, 10)} = 0,1 &nbsp; ${F(1, 8)} = 0,125</div>
<div class="cols"><div class="methode"><b>Méthode</b><ol><li>Carré : multiplie le nombre par lui-même (au-delà de 12, découpe : 14 = 10 + 4).</li><li>Racine : cherche le nombre qui, multiplié par lui-même, redonne le nombre.</li><li>${F('a', 'b')} de N : divise N par b, puis multiplie par a.</li></ol></div>
${areaRect({ cols: [{ w: 170, l: '10' }, { w: 68, l: '4' }], rows: [{ h: 238, l: '14' }], cells: [['140', '56']], cap: '14² = 140 + 56 = 196' })}</div>
<div class="ex"><span class="q">Exemple 1 : 7<sup>2</sup> et √81</span><br>7<sup>2</sup> = 7 × 7 = <b>49</b>. &nbsp; √81 = <b>9</b> car 9 × 9 = 81.</div>
<div class="ex"><span class="q">Exemple 2 : ${F(3, 4)} de 60 et ${F(3, 2)} en décimal</span><br>60 ÷ 4 = 15, puis 15 × 3 = <b>45</b>. &nbsp; ${F(3, 2)} = 3 ÷ 2 = <b>1,5</b>.</div>
<div class="ex"><span class="q">Exemple 3 : 16<sup>2</sup></span><br>16 × 10 + 16 × 6 = 160 + 96 = <b>256</b>.</div>
<div class="warn">⚠️ 7<sup>2</sup> n'est pas 14 : c'est 7 × 7, pas 7 × 2.<br>⚠️ √64 n'est pas 32 (la moitié) : c'est 8.<br>⚠️ Pour ${F(3, 4)} de 60, on divise par le dénominateur 4, pas par 3.</div>
<div class="retenir">À retenir : un carré, c'est un nombre multiplié par lui-même ; la racine fait le chemin inverse.</div>`,
];


export const LEVELS = LEVELS_.map((L, i) => ({ ...L, cours: () => COURS_[i] }));
export const OPTIONS = { need: 5, mental: true };

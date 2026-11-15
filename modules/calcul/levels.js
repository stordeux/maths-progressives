// Calcul mental : 12 niveaux, repris de calcul.html. g(d) renvoie {q, a, tip}.
// d = série de réussites rapides en cours (4 en mode défi).
import { ri, pick, nz, random } from '../../engine/util/rand.js';
import { F } from '../../engine/util/fmt.js';

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
   if(v===3){const a=ri(1,99);return{q:`${a} + ? = 100`,a:100-a,tip:`Pour ${a} : les unités vont à 10 (${(10-a%10)%10}), les dizaines à 9… Astuce : dizaines → 9, unités → 10.`}}
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
   const c=nz(-5,5),e=nz(-4,4);return{q:`${P(c)} ${X} ${P(e)} ${X} ${P(b)}`,a:c*e*b,tip:`Compte les signes −: ${[c,e,b].filter(x=>x<0).length} → ${[c,e,b].filter(x=>x<0).length%2?'nombre impair : résultat négatif':'nombre pair : résultat positif'}.`}}},
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
const COURS_=[
 `<h2>1. Jusqu'à 20</h2><div class="def"><b>Passer par 10</b> : 8 + 5 = 8 + 2 + 3 = 10 + 3 = 13.</div><div class="ex">14 − 6 = 14 − 4 − 2 = 10 − 2 = 8</div><div class="def">Avec trois nombres, cherche les paires qui font 10 : 7 + 5 + 3 = (7 + 3) + 5 = 15.</div>`,
 `<h2>2. Compléments</h2><div class="def">Paires qui font 10 : 1+9, 2+8, 3+7, 4+6, 5+5.</div><div class="ex">Complément à 100 de 37 : les dizaines vont à <b>9</b> (3 → 6) et les unités à <b>10</b> (7 → 3) : <b>63</b>.</div><div class="ex">Complément à 1000 de 380 : 38 + 62 = 100, donc 380 + 620 = 1000.</div>`,
 `<h2>3. Tables de 2 à 5</h2><div class="def">× 2 : le double. &nbsp; × 4 : le double du double. &nbsp; × 5 : la moitié de × 10.</div><div class="ex">7 × 4 : 7 → 14 → 28 &nbsp;&nbsp; 8 × 5 = 80 ÷ 2 = 40</div><div class="def">L'ordre ne compte pas : 3 × 8 = 8 × 3.</div>`,
 `<h2>4. Tables de 6 à 9</h2><div class="def">× 9 = × 10 − une fois : 7 × 9 = 70 − 7 = 63.<br>× 8 = trois doubles : 6 → 12 → 24 → 48.<br>× 6 = × 5 + une fois : 7 × 6 = 35 + 7 = 42.</div><div class="ex">Les plus difficiles à retenir : 7 × 8 = 56, 6 × 7 = 42, 7 × 7 = 49, 8 × 8 = 64.</div><div class="def">Table de 9 : les chiffres du résultat font toujours 9 (36 : 3 + 6 = 9).</div>`,
 `<h2>5. Doubles et moitiés</h2><div class="ex">Double de 37 = double de 30 + double de 7 = 60 + 14 = 74</div><div class="ex">Moitié de 86 = moitié de 80 + moitié de 6 = 40 + 3 = 43</div><div class="ex">Moitié de 35 = moitié de 34 + 0,5 = 17,5</div>`,
 `<h2>6. × et ÷ par 10, 100, 1000</h2><div class="def">× 10, × 100, × 1000 : la virgule se décale de 1, 2, 3 rangs vers la <b>droite</b>.<br>÷ 10, ÷ 100, ÷ 1000 : vers la <b>gauche</b>.</div><div class="ex">3,7 × 100 = 370 &nbsp;&nbsp; 45 ÷ 100 = 0,45 &nbsp;&nbsp; 0,08 × 1000 = 80</div>`,
 `<h2>7. Calculs à 2 ou 3 chiffres</h2><div class="def">On décompose : d'abord les dizaines, puis les unités.</div><div class="ex">47 + 38 = 47 + 30 + 8 = 77 + 8 = 85</div><div class="ex">92 − 57 = 92 − 50 − 7 = 42 − 7 = 35</div><div class="def">Avec 9, 19, 29… : + 29 = + 30 − 1.</div><div class="ex">56 + 29 = 86 − 1 = 85</div>`,
 `<h2>8. Astuces de multiplication</h2><div class="def">× 5 = × 10 ÷ 2 &nbsp; (34 × 5 = 340 ÷ 2 = 170)<br>× 9 = × 10 − une fois &nbsp; (23 × 9 = 230 − 23 = 207)<br>× 11 = × 10 + une fois &nbsp; (34 × 11 = 340 + 34 = 374)<br>× 25 = × 100 ÷ 4 &nbsp; (16 × 25 = 1600 ÷ 4 = 400)</div>`,
 `<h2>9. Relatifs : + et −</h2><div class="def">Même signe : on additionne les distances à 0 et on garde le signe : −4 + (−7) = −11.<br>Signes contraires : on soustrait les distances, on garde le signe du plus éloigné de 0 : −9 + 4 = −5.</div><div class="def">Soustraire, c'est ajouter l'opposé : 3 − (−5) = 3 + 5 = 8.</div><div class="ex">Pense à un thermomètre : il fait −3 °C, la température baisse de 6 °C → −9 °C.</div>`,
 `<h2>10. Relatifs : × et ÷</h2><div class="def"><b>Règle des signes</b> : (+)(+) = +, (−)(−) = +, (+)(−) = −, (−)(+) = −.<br>Même règle pour ÷.</div><div class="ex">(−6) × 7 = −42 &nbsp;&nbsp; (−48) ÷ (−6) = 8</div><div class="def">Avec plusieurs facteurs : nombre <b>pair</b> de signes − → positif ; <b>impair</b> → négatif.</div>`,
 `<h2>11. Pourcentages</h2><div class="def">50 % = moitié &nbsp; 25 % = quart &nbsp; 10 % = ÷ 10 &nbsp; 1 % = ÷ 100<br>20 % = 2 × 10 % &nbsp; 5 % = moitié de 10 % &nbsp; 75 % = 3 quarts</div><div class="ex">20 % de 45 : 10 % = 4,5 donc 20 % = 9</div><div class="ex">Un prix de 80 € augmente de 10 % : 80 + 8 = 88 €</div>`,
 `<h2>12. Carrés, racines, fractions</h2><div class="def">Carrés à connaître : 1, 4, 9, 16, 25, 36, 49, 64, 81, 100, 121, 144.<br>√144 = 12 car 12 × 12 = 144.</div><div class="def">${F(1,2)} = 0,5 &nbsp; ${F(1,4)} = 0,25 &nbsp; ${F(3,4)} = 0,75 &nbsp; ${F(1,5)} = 0,2 &nbsp; ${F(1,10)} = 0,1 &nbsp; ${F(1,8)} = 0,125</div><div class="ex">${F(3,4)} de 60 : 60 ÷ 4 = 15, × 3 = 45</div><div class="ex">14<sup>2</sup> = 14 × 10 + 14 × 4 = 140 + 56 = 196</div>`,
];


export const LEVELS = LEVELS_.map((L, i) => ({ ...L, cours: () => COURS_[i] }));
export const OPTIONS = { need: 5, mental: true };

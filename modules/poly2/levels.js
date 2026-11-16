// Second degré : 12 niveaux, repris de poly2.html (générateurs, cours, indices, corrections).
// Le graphe de la parabole est toujours affiché ; après la réponse, il montre racines / sommet / signes.
// Pas de dérivée : le sommet s'obtient par la forme canonique.
import { ri, pick, shuffle, nz, random } from '../../engine/util/rand.js';
import { numsCheck, rootsCheck, choiceCheck, tableCheck } from '../../engine/answers/checks.js';
import { parabola } from '../../engine/draw/plot.js';


/* ================= outils ================= */
const M=n=>n<0?'−'+(-n):''+n;               // nombre avec vrai signe moins
const P=n=>n<0?'('+M(n)+')':''+n;           // entre parenthèses si négatif
const X2='x<sup>2</sup>';
function terms(list){ // list de [coef, 'x²'|'x'|''] dans l'ordre voulu
  let s='';
  list.filter(t=>t[0]!==0).forEach((t,i)=>{
    const [k,v]=t,abs=Math.abs(k),c=(abs===1&&v)?'':abs;
    s+=(k<0?(i?' − ':'−'):(i?' + ':''))+c+v;
  });
  return s||'0';
}
const poly=(a,b,c)=>terms([[a,X2],[b,'x'],[c,'']]);
const lin=p=>p===0?'x':p>0?`x + ${p}`:`x − ${-p}`;          // x + p
const lmin=r=>r===0?'x':r>0?`x − ${r}`:`x + ${-r}`;         // x − r
const coefA=a=>a===1?'':a===-1?'−':M(a);
const canon=(a,h,k)=>`${coefA(a)}(${lmin(h)})<sup>2</sup>${k?(k>0?' + '+k:' − '+(-k)):''}`;
const fact=(a,r1,r2)=>{const f=r=>r===0?'x':`(${lmin(r)})`;return `${coefA(a)}${f(r1)}${f(r2)}`};
const big=s=>`<div class="big">${s}</div>`;
const fx=(a,b,c)=>x=>a*x*x+b*x+c;

/* ================= graphique ================= */

/* ================= niveaux ================= */
const LEVELS_=[
 { titre: "Calculer une image", generate: L1, cours: C1 },
 { titre: "Forme réduite : a, b, c", generate: L2, cours: C2 },
 { titre: "Réduire une expression", generate: L3, cours: C3 },
 { titre: "Développer (x + p)(x + q)", generate: L4, cours: C4 },
 { titre: "Identités remarquables", generate: L5, cours: C5 },
 { titre: "Reconnaître un carré", generate: L6, cours: C6 },
 { titre: "Forme canonique (x + p)² + k", generate: L7, cours: C7 },
 { titre: "Point de minimum / maximum", generate: L8, cours: C8 },
 { titre: "Résoudre (x − h)² = m", generate: L9, cours: C9 },
 { titre: "Racines d'une forme factorisée", generate: L10, cours: C10 },
 { titre: "Signe : pour quels x ?", generate: L11, cours: C11 },
 { titre: "Discriminant Δ", generate: L12, cours: C12 },
];

/* ---------- 1. image ---------- */
function L1(d){
  const a=d<2?1:pick([1,-1,2]),b=ri(-6,6),c=ri(-8,8),x0=d<1?ri(1,4):nz(-4,4),Y=a*x0*x0+b*x0+c;
  return{type:'nums',a,b,c,go:{x0},gs:{x0,show:true},
    html:`Soit f(x) = ${poly(a,b,c)}.<br>Calcule f(${M(x0)}).`,
    tpl:`f(${M(x0)}) = {0}`,check:numsCheck([Y]),
    hint:`Remplace chaque <b>x</b> par <b>(${M(x0)})</b>, avec des parenthèses. Calcule d'abord le carré : (${M(x0)})<sup>2</sup> = ${x0*x0}${x0<0?' (un carré est toujours positif !)':''}. Sur le graphique : c'est la hauteur de la courbe au-dessus (ou en dessous) de x = ${M(x0)}.`,
    solution:`f(${M(x0)}) = ${a===1?'':P(a)+' × '}(${M(x0)})<sup>2</sup> + ${P(b)} × ${P(x0)} + ${P(c)} = ${M(a*x0*x0)} + ${P(b*x0)} + ${P(c)} = <b>${M(Y)}</b>`};
}
function C1(){return `<h2>1. Fonction polynôme du second degré</h2>
<p class="intro">Les fonctions du second degré décrivent par exemple la trajectoire d'un ballon. Première étape : savoir calculer une image sans se tromper de signe.</p>
<div class="def">Une <b>fonction polynôme du second degré</b> s'écrit <b>f(x) = ax<sup>2</sup> + bx + c</b>, où a, b, c sont des nombres et <b>a ≠ 0</b>.<br>Sa courbe s'appelle une <b>parabole</b>.</div>
<div class="methode"><b>Méthode</b> pour calculer f(−2)<ol><li>Recopie la formule en remplaçant <b>chaque</b> x par <b>(−2)</b>, entre parenthèses.</li><li>Calcule d'abord le <b>carré</b> : (−2)<sup>2</sup> = 4.</li><li>Puis les <b>multiplications</b>, et enfin les additions et soustractions.</li></ol></div>
<div class="ex"><span class="q">Exemple 1 :</span><br>f(x) = x<sup>2</sup> − 3x + 1<br>f(−2) = (−2)<sup>2</sup> − 3 × (−2) + 1 = 4 + 6 + 1 = <b>11</b></div>
<div class="ex"><span class="q">Exemple 2 : a négatif</span><br>g(x) = −x<sup>2</sup> + 4x − 2<br>g(−3) = −(−3)<sup>2</sup> + 4 × (−3) − 2 = −9 − 12 − 2 = <b>−23</b><br>Le carré se calcule <b>avant</b> le signe − : −(−3)<sup>2</sup> = −(9) = −9.</div>
<div class="warn">⚠️ (−2)<sup>2</sup> = (−2) × (−2) = <b>4</b> (positif). Mais −x<sup>2</sup> pour x = −2 donne −(4) = −4.<br>⚠️ − 3 × (−2) = + 6 : moins par moins donne plus.</div>
<p>Sur le graphique : f(−2) est l'ordonnée (la hauteur) du point de la parabole d'abscisse −2.</p>${parabola(1,-3,1,{x0:-2,show:true})}
<div class="retenir">À retenir : chaque x devient (nombre), et le carré se calcule en premier.</div>`}

/* ---------- 2. coefficients ---------- */
function L2(d){
  const a=d<1?1:nz(-4,4),b=d<2?nz(-7,7):ri(-7,7),c=d<2?nz(-9,9):ri(-9,9);
  let t=[[a,X2],[b,'x'],[c,'']];if(d>=1)shuffle(t);
  return{type:'nums',a,b,c,go:{},gs:{},
    html:`Voici une fonction polynôme du second degré :${big('f(x) = '+terms(t))}Donne ses coefficients a, b et c (forme réduite ax<sup>2</sup> + bx + c).`,
    tpl:`a = {0} &nbsp; b = {1} &nbsp; c = {2}`,check:numsCheck([a,b,c]),
    hint:`a est le nombre devant x<sup>2</sup>, b le nombre devant x, c le nombre seul. Garde le <b>signe</b> qui est devant ! S'il n'y a rien devant x, c'est 1 (ou −1 si c'est −x). Si un terme manque, son coefficient vaut 0.`,
    solution:`Rangée dans l'ordre : f(x) = ${poly(a,b,c)}, donc <b>a = ${M(a)}, b = ${M(b)}, c = ${M(c)}</b>.`};
}
function C2(){return `<h2>2. La forme réduite</h2>
<p class="intro">Pour travailler sur une fonction du second degré, on la range toujours de la même façon. On peut alors lire ses trois coefficients.</p>
<div class="def">La <b>forme réduite</b> (ou développée) est <b>ax<sup>2</sup> + bx + c</b>, rangée par puissances décroissantes de x.<br>a, b, c sont les <b>coefficients</b> : a devant x<sup>2</sup>, b devant x, c le nombre seul.</div>
<div class="methode"><b>Méthode</b><ol><li>Repère chaque terme <b>avec le signe qui est devant</b>.</li><li>Range : d'abord le terme en x<sup>2</sup>, puis celui en x, puis le nombre seul.</li><li>Lis a, b, c. « x<sup>2</sup> » seul → a = 1 ; « −x » → b = −1 ; terme absent → 0.</li></ol></div>
<div class="ex"><span class="q">Exemple 1 :</span><br>f(x) = 5 − 3x + 2x<sup>2</sup> se range en 2x<sup>2</sup> − 3x + 5 : <b>a = 2, b = −3, c = 5</b>.</div>
<div class="ex"><span class="q">Exemple 2 : terme manquant</span><br>g(x) = −x<sup>2</sup> + 7 : il n'y a pas de terme en x, donc <b>a = −1, b = 0, c = 7</b>.<br>h(x) = 4x − x<sup>2</sup> = −x<sup>2</sup> + 4x : <b>a = −1, b = 4, c = 0</b>.</div>
<div class="warn">⚠️ Le signe fait partie du coefficient : dans « − 3x », b = −3.<br>⚠️ « x<sup>2</sup> » veut dire 1x<sup>2</sup>, donc a = 1 ; « −x<sup>2</sup> » donne a = −1.<br>⚠️ a n'est pas forcément le premier nombre écrit : c'est celui devant x<sup>2</sup>.</div>
<h3>Ce que a et c racontent sur le graphique</h3><p>Si <b>a &gt; 0</b>, la parabole est tournée vers le haut ∪ ; si <b>a &lt; 0</b>, vers le bas ∩. Et <b>c = f(0)</b> : c'est là où la courbe coupe l'axe des ordonnées. Ci-dessous, g(x) = −x<sup>2</sup> + 7 : a = −1 &lt; 0, et la courbe passe par (0 ; 7).</p>${parabola(-1,0,7,{x0:0,show:true})}
<div class="retenir">À retenir : a devant x<sup>2</sup>, b devant x, c tout seul, chacun avec son signe.</div>`}

/* ---------- 3. réduire ---------- */
function L3(d){
  const a1=nz(-3,4),a2=ri(-3,3),b1=ri(-6,6),b2=nz(-6,6),c1=ri(-8,8),c2=nz(-8,8);
  let a,b,c,html;
  if(d<2){a=a1+a2;b=b1+b2;c=c1+c2;if(!a||!b||!c)return L3(d); // aucune famille ne disparaît (« + 7 − 7 »)
    let t=[[a1,X2],[b1,'x'],[c1,''],[a2,X2],[b2,'x'],[c2,'']];if(d===1)shuffle(t);
    html=`Réduis (forme ax<sup>2</sup> + bx + c) :${big('f(x) = '+terms(t))}`}
  else{a=a1-a2;b=b1-b2;c=c1-c2;if(!a||!b||!c)return L3(d);
    html=`Réduis (attention au signe − devant la parenthèse) :${big(`f(x) = (${poly(a1,b1,c1)}) − (${poly(a2,b2,c2)})`)}`}
  return{type:'nums',a,b,c,go:{},gs:{},html,tpl:`{0} ${X2} + {1} x + {2}`,check:numsCheck([a,b,c]),
    hint:d<2?`Regroupe les termes de la même famille : les x<sup>2</sup> ensemble, les x ensemble, les nombres seuls ensemble.`:`Un « − » devant une parenthèse change le signe de <b>tous</b> les termes de la parenthèse. Ensuite regroupe les x<sup>2</sup>, les x et les nombres.`,
    solution:`x<sup>2</sup> : ${M(a)} ; x : ${M(b)} ; nombres : ${M(c)}. Donc f(x) = <b>${poly(a,b,c)}</b>.`};
}
function C3(){
  // regroupement par familles : 2x² + 3x − 5 + x² − x + 1 = 3x² + 2x − 4
  const fam={a:['#1971c2','#e7f5ff'],b:['#e8590c','#fff4e6'],c:['#2b8a3e','#ebfbee']};
  const top=[['2x²','a'],['+ 3x','b'],['− 5','c'],['+ x²','a'],['− x','b'],['+ 1','c']],bot=[['3x²','a',95],['+ 2x','b',230],['− 4','c',365]];
  let s='<svg viewBox="0 0 460 150" class="vis" role="img" aria-label="on regroupe les termes de la même famille" font-family="system-ui,sans-serif" style="max-width:460px">';
  top.forEach(([t,k],i)=>{const x=12+i*74,B=bot.find(r=>r[1]===k);
    s+=`<line x1="${x+33}" y1="48" x2="${B[2]}" y2="100" stroke="${fam[k][0]}" stroke-width="2" opacity=".7"/>`;
    s+=`<rect x="${x}" y="12" width="66" height="36" rx="9" fill="${fam[k][1]}" stroke="${fam[k][0]}" stroke-width="2"/><text x="${x+33}" y="37" font-size="19" text-anchor="middle" fill="${fam[k][0]}" font-weight="700">${t}</text>`});
  bot.forEach(([t,k,x])=>{s+=`<rect x="${x-45}" y="100" width="90" height="40" rx="10" fill="${fam[k][1]}" stroke="${fam[k][0]}" stroke-width="2.5"/><text x="${x}" y="127" font-size="21" text-anchor="middle" fill="${fam[k][0]}" font-weight="800">${t}</text>`});
  s+='</svg>';
  return `<h2>3. Réduire une expression</h2>
<p class="intro">Une expression écrite « en vrac » se simplifie en regroupant ce qui va ensemble. On obtient la forme réduite ax<sup>2</sup> + bx + c.</p>
<div class="def"><b>Réduire</b>, c'est regrouper les termes de même nature :<br>les x<sup>2</sup> avec les x<sup>2</sup>, les x avec les x, les nombres avec les nombres.</div>
<div class="methode"><b>Méthode</b><ol><li>S'il y a « − ( … ) », enlève la parenthèse en changeant le signe de <b>tous</b> les termes à l'intérieur.</li><li>Repère les trois familles (souligne-les de trois couleurs).</li><li>Additionne les coefficients de chaque famille, <b>avec leur signe</b>.</li></ol></div>
${s}
<div class="ex"><span class="q">Exemple 1 :</span><br>2x<sup>2</sup> + 3x − 5 + x<sup>2</sup> − x + 1<br>= (2 + 1)x<sup>2</sup> + (3 − 1)x + (−5 + 1)<br>= <b>3x<sup>2</sup> + 2x − 4</b></div>
<div class="ex"><span class="q">Exemple 2 : le signe − devant une parenthèse</span><br>(x<sup>2</sup> + 2x − 3) − (4x<sup>2</sup> − x + 5)<br>= x<sup>2</sup> + 2x − 3 − 4x<sup>2</sup> + x − 5<br>= <b>−3x<sup>2</sup> + 3x − 8</b></div>
<div class="warn">⚠️ On ne peut pas additionner x<sup>2</sup> et x : ce ne sont pas les mêmes « objets ».<br>⚠️ Avec « − ( … ) », <b>tous</b> les signes changent, pas seulement le premier : − (4x<sup>2</sup> − x + 5) = −4x<sup>2</sup> + x − 5.</div>
<p class="note">Pour répondre : tape les trois coefficients (1 si c'est juste « x », 0 s'il n'y a pas de terme, − pour les négatifs).</p>
<div class="retenir">À retenir : on additionne les x<sup>2</sup> entre eux, les x entre eux, les nombres entre eux.</div>`}

/* ---------- 4. développer ---------- */
function L4(d){
  let m=1,p=d<1?ri(1,6):nz(-7,7),q=d<1?ri(1,6):nz(-7,7);
  if(d>=3&&random()<.5)m=pick([2,3]);
  const a=m,b=m*q+p,c=p*q;
  const left=m===1?`(${lin(p)})`:`(${m}x ${p<0?'− '+(-p):'+ '+p})`;
  return{type:'nums',a,b,c,go:{},gs:{roots:true},
    html:`Développe et réduis :${big(`f(x) = ${left}(${lin(q)})`)}`,tpl:`{0} ${X2} + {1} x + {2}`,check:numsCheck([a,b,c]),
    hint:`Double distributivité : chaque terme de la 1<sup>re</sup> parenthèse multiplie chaque terme de la 2<sup>e</sup> (4 produits), puis on réduit.${m===1?` Raccourci : x<sup>2</sup> + (p + q)x + p×q.`:''}`,
    solution:`${left}(${lin(q)}) = ${m===1?'x':m+'x'} × x + ${m===1?'x':m+'x'} × ${P(q)} + ${P(p)} × x + ${P(p)} × ${P(q)} = ${terms([[m,X2],[m*q,'x'],[p,'x'],[c,'']])} = <b>${poly(a,b,c)}</b>`};
}
function C4(){
  // rectangle de côtés (x + 5) et (x + 2) découpé en quatre aires
  const W=[150,80],H=[150,55],X0=60,Y0=34,cell=(x,y,w,h,f,t)=>`<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${f}" stroke="#333" stroke-width="2"/><text x="${x+w/2}" y="${y+h/2+8}" font-size="22" text-anchor="middle" font-weight="700" fill="#333">${t}</text>`;
  const s=`<svg viewBox="0 0 330 270" class="vis" role="img" aria-label="aire du rectangle de côtés x + 5 et x + 2" font-family="system-ui,sans-serif" style="max-width:330px">`
    +cell(X0,Y0,W[0],H[0],'#e7f5ff','x × x = x²')+cell(X0+W[0],Y0,W[1],H[0],'#fff4e6','5x')+cell(X0,Y0+H[0],W[0],H[1],'#fff4e6','2x')+cell(X0+W[0],Y0+H[0],W[1],H[1],'#ebfbee','10')
    +`<text x="${X0+W[0]/2}" y="24" font-size="20" text-anchor="middle" font-style="italic">x</text><text x="${X0+W[0]+W[1]/2}" y="24" font-size="20" text-anchor="middle">5</text>`
    +`<text x="${X0-14}" y="${Y0+H[0]/2+7}" font-size="20" text-anchor="end" font-style="italic">x</text><text x="${X0-14}" y="${Y0+H[0]+H[1]/2+7}" font-size="20" text-anchor="end">2</text></svg>`;
  return `<h2>4. Développer un produit</h2>
<p class="intro">Développer, c'est transformer un produit de parenthèses en une somme de termes : on obtient la forme réduite ax<sup>2</sup> + bx + c.</p>
<div class="def"><b>Double distributivité</b> : (A + B)(C + D) = AC + AD + BC + BD<br>Chaque terme de la 1<sup>re</sup> parenthèse multiplie chaque terme de la 2<sup>e</sup> : <b>4 produits</b>.</div>
<div class="methode"><b>Méthode</b><ol><li>Écris les 4 produits, avec leurs signes (un nombre négatif garde son signe).</li><li>Calcule chaque produit : x × x = x<sup>2</sup>.</li><li>Réduis : regroupe les deux termes en x.</li></ol></div>
<div class="cols">${s}<div class="ex"><span class="q">Exemple 1 :</span><br>(x + 2)(x + 5)<br>= x × x + x × 5 + 2 × x + 2 × 5<br>= x<sup>2</sup> + 5x + 2x + 10<br>= <b>x<sup>2</sup> + 7x + 10</b><br>C'est l'aire du grand rectangle, somme des quatre morceaux.</div></div>
<div class="ex"><span class="q">Exemple 2 : avec des signes et un coefficient</span><br>(x − 3)(x + 4) = x<sup>2</sup> + 4x − 3x − 12 = <b>x<sup>2</sup> + x − 12</b><br>(2x − 1)(x + 3) = 2x<sup>2</sup> + 6x − x − 3 = <b>2x<sup>2</sup> + 5x − 3</b></div>
<h3>Le raccourci</h3><p>(x + p)(x + q) = x<sup>2</sup> + <b>(p + q)</b>x + <b>p × q</b>. Exemple : (x − 3)(x + 4) : −3 + 4 = 1 et −3 × 4 = −12.</p>
<div class="warn">⚠️ N'oublie aucun des 4 produits : (x + 2)(x + 5) n'est pas x<sup>2</sup> + 10.<br>⚠️ (−3) × 4 = −12 : attention aux signes des nombres.</div>
<h3>Lien avec le graphique</h3><p>La forme (x − 3)(x + 4) vaut 0 quand x = 3 ou x = −4 : ce sont les points où la parabole coupe l'axe des x.</p>${parabola(1,1,-12,{roots:true})}
<div class="retenir">À retenir : (A + B)(C + D) = AC + AD + BC + BD, puis on réduit.</div>`}

/* ---------- 5. identités ---------- */
function L5(d){
  const v=d<1?0:d<2?ri(0,1):ri(0,d>=3?3:2),p=ri(1,d<2?6:9);
  let a,b,c,e;
  if(v===0){a=1;b=2*p;c=p*p;e=`(x + ${p})<sup>2</sup>`}
  else if(v===1){a=1;b=-2*p;c=p*p;e=`(x − ${p})<sup>2</sup>`}
  else if(v===2){a=1;b=0;c=-p*p;e=`(x + ${p})(x − ${p})`}
  else{const m=pick([2,3]);a=m*m;b=2*m*p;c=p*p;e=`(${m}x + ${p})<sup>2</sup>`}
  const H=['(A + B)<sup>2</sup> = A<sup>2</sup> + 2AB + B<sup>2</sup>','(A − B)<sup>2</sup> = A<sup>2</sup> − 2AB + B<sup>2</sup>','(A + B)(A − B) = A<sup>2</sup> − B<sup>2</sup>','(A + B)<sup>2</sup> = A<sup>2</sup> + 2AB + B<sup>2</sup>'][v];
  return{type:'nums',a,b,c,go:{},gs:{vertex:true},html:`Développe à l'aide d'une identité remarquable :${big('f(x) = '+e)}`,
    tpl:`{0} ${X2} + {1} x + {2}`,check:numsCheck([a,b,c]),
    hint:`Utilise ${H}.${v!==2?' N\'oublie pas le terme du milieu « 2AB » !':''}`,
    solution:`${H} donne ${e} = <b>${poly(a,b,c)}</b>`};
}
function C5(){
  // carré de côté A + B découpé en A², AB, AB, B²
  const A=140,B=70,X0=40,Y0=34,cell=(x,y,w,h,f,t)=>`<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${f}" stroke="#333" stroke-width="2"/><text x="${x+w/2}" y="${y+h/2+8}" font-size="22" text-anchor="middle" font-weight="700" fill="#333">${t}</text>`;
  const s=`<svg viewBox="0 0 270 265" class="vis" role="img" aria-label="carré de côté A + B" font-family="system-ui,sans-serif" style="max-width:270px">`
    +cell(X0,Y0,A,A,'#e7f5ff','A²')+cell(X0+A,Y0,B,A,'#fff4e6','AB')+cell(X0,Y0+A,A,B,'#fff4e6','AB')+cell(X0+A,Y0+A,B,B,'#ebfbee','B²')
    +`<text x="${X0+A/2}" y="24" font-size="20" text-anchor="middle" font-weight="700">A</text><text x="${X0+A+B/2}" y="24" font-size="20" text-anchor="middle" font-weight="700">B</text>`
    +`<text x="${X0-10}" y="${Y0+A/2+7}" font-size="20" text-anchor="end" font-weight="700">A</text><text x="${X0-10}" y="${Y0+A+B/2+7}" font-size="20" text-anchor="end" font-weight="700">B</text></svg>`;
  return `<h2>5. Les identités remarquables</h2>
<p class="intro">Trois produits reviennent si souvent qu'on apprend leur développement par cœur : cela va beaucoup plus vite que la double distributivité.</p>
<div class="def">(A + B)<sup>2</sup> = A<sup>2</sup> + <b>2AB</b> + B<sup>2</sup><br>(A − B)<sup>2</sup> = A<sup>2</sup> − <b>2AB</b> + B<sup>2</sup><br>(A + B)(A − B) = A<sup>2</sup> − B<sup>2</sup></div>
<div class="cols">${s}<div class="methode"><b>Méthode</b><ol><li>Reconnais l'identité et repère <b>A</b> et <b>B</b> (A peut être 2x ou 3x !).</li><li>Calcule A<sup>2</sup>, le double produit <b>2 × A × B</b>, puis B<sup>2</sup>.</li><li>Écris le résultat avec les bons signes.</li></ol><p>Le carré de côté A + B est fait de A<sup>2</sup>, B<sup>2</sup> et <b>deux</b> rectangles AB.</p></div></div>
<div class="ex"><span class="q">Exemple 1 :</span><br>(x + 3)<sup>2</sup> = x<sup>2</sup> + 2 × x × 3 + 3<sup>2</sup> = <b>x<sup>2</sup> + 6x + 9</b><br>(x − 5)<sup>2</sup> = x<sup>2</sup> − 10x + 25 &nbsp;&nbsp; (x + 4)(x − 4) = x<sup>2</sup> − 16</div>
<div class="ex"><span class="q">Exemple 2 : A = 2x</span><br>(2x + 3)<sup>2</sup> : A = 2x, B = 3.<br>A<sup>2</sup> = (2x)<sup>2</sup> = 4x<sup>2</sup> ; 2AB = 2 × 2x × 3 = 12x ; B<sup>2</sup> = 9.<br>Donc (2x + 3)<sup>2</sup> = <b>4x<sup>2</sup> + 12x + 9</b>.</div>
<div class="warn">⚠️ Erreur classique : (x + 3)<sup>2</sup> n'est <b>pas</b> x<sup>2</sup> + 9. Il manque le double produit 6x !<br>⚠️ (2x)<sup>2</sup> = 4x<sup>2</sup>, pas 2x<sup>2</sup>.</div>
<p>Sur le graphique de (x − 5)<sup>2</sup>, la parabole touche l'axe des x en un seul point, x = 5 : c'est le sommet.</p>${parabola(1,-10,25,{vertex:true})}
<div class="retenir">À retenir : (A ± B)<sup>2</sup> = A<sup>2</sup> ± 2AB + B<sup>2</sup> ; (A + B)(A − B) = A<sup>2</sup> − B<sup>2</sup>.</div>`}

/* ---------- 6. reconnaître un carré ---------- */
function L6(d){
  const p=d<1?ri(1,6):nz(-9,9),b=2*p,c=p*p;
  if(d>=2&&random()<.5)return{type:'nums',a:1,b,c,go:{},gs:{vertex:true},
    html:`Complète pour obtenir le carré d'une parenthèse :`,
    tpl:`x<sup>2</sup> ${b<0?'− '+(-b):'+ '+b}x + {0} = (x + {1})<sup>2</sup>`,check:numsCheck([c,p]),
    hint:`Le terme du milieu ${M(b)}x vaut 2 × x × p : donc p = ${M(b)} ÷ 2. Le nombre seul doit être p<sup>2</sup>.`,
    solution:`${M(b)} ÷ 2 = ${M(p)}, et ${P(p)}<sup>2</sup> = ${c} : x<sup>2</sup> ${b<0?'− '+(-b):'+ '+b}x + ${c} = <b>(${lin(p)})<sup>2</sup></b>`};
  return{type:'nums',a:1,b,c,go:{},gs:{vertex:true},
    html:`Écris sous la forme d'un carré :${big('f(x) = '+poly(1,b,c))}<span class="note">Tape le nombre de la parenthèse avec son signe (par ex. −4 pour (x − 4)²).</span>`,
    tpl:`f(x) = (x + {0})<sup>2</sup>`,check:numsCheck([p]),
    hint:`Compare avec (x + p)<sup>2</sup> = x<sup>2</sup> + 2px + p<sup>2</sup>. Le terme en x est ${M(b)}x, donc 2p = ${M(b)}. Vérifie que p<sup>2</sup> = ${c}.`,
    solution:`2p = ${M(b)} donc p = ${M(p)} ; et ${P(p)}<sup>2</sup> = ${c} ✓. Donc f(x) = <b>(${lin(p)})<sup>2</sup></b>`};
}
function C6(){return `<h2>6. Reconnaître un carré</h2>
<p class="intro">On lit l'identité remarquable « à l'envers » : on <b>factorise</b> une expression en un carré. C'est la clé de la forme canonique.</p>
<div class="def">x<sup>2</sup> + <b>2p</b>x + <b>p<sup>2</sup></b> = (x + p)<sup>2</sup> &nbsp; (p peut être négatif)</div>
<div class="methode"><b>Méthode</b><ol><li>Regarde le terme en x : son coefficient vaut 2p. <b>Divise par 2</b> pour trouver p, avec son signe.</li><li>Vérifie que le nombre seul est bien p<sup>2</sup>.</li><li>Écris (x + p)<sup>2</sup> ; si p est négatif, cela donne (x − …)<sup>2</sup>.</li></ol></div>
<div class="ex"><span class="q">Exemple 1 :</span><br>x<sup>2</sup> + 6x + 9 : 6 ÷ 2 = 3 et 3<sup>2</sup> = 9 ✓ → <b>(x + 3)<sup>2</sup></b></div>
<div class="ex"><span class="q">Exemple 2 : coefficient négatif, case à compléter</span><br>x<sup>2</sup> − 8x + 16 : −8 ÷ 2 = −4 et (−4)<sup>2</sup> = 16 ✓ → <b>(x − 4)<sup>2</sup></b><br>Compléter x<sup>2</sup> + 10x + … = (x + …)<sup>2</sup> : p = 10 ÷ 2 = 5, et il faut p<sup>2</sup> = 25 → x<sup>2</sup> + 10x + <b>25</b> = (x + <b>5</b>)<sup>2</sup>.</div>
<div class="warn">⚠️ x<sup>2</sup> + 6x + 10 n'est <b>pas</b> un carré : il faudrait 9 au lieu de 10. (On verra au niveau suivant que c'est (x + 3)<sup>2</sup> + 1.)<br>⚠️ p est la <b>moitié</b> du coefficient de x, pas le coefficient lui-même : x<sup>2</sup> + 6x + 9 ≠ (x + 6)<sup>2</sup>.</div>
<p>Un carré ne descend jamais sous 0 : la parabole de (x + 3)<sup>2</sup> touche l'axe des x en x = −3, son sommet.</p>${parabola(1,6,9,{vertex:true})}
<div class="retenir">À retenir : p = moitié du coefficient de x, et le nombre seul doit être p<sup>2</sup>.</div>`}

/* ---------- 7. forme canonique ---------- */
function L7(d){
  const p=d<1?ri(1,5):nz(-6,6),k=d<2?ri(1,6):nz(-9,9),b=2*p,c=p*p+k;
  return{type:'nums',a:1,b,c,go:{},gs:{vertex:true},
    html:`Écris sous forme canonique (x + p)<sup>2</sup> + k :${big('f(x) = '+poly(1,b,c))}<span class="note">Tape les nombres avec leur signe.</span>`,
    tpl:`f(x) = (x + {0})<sup>2</sup> + {1}`,check:numsCheck([p,k]),
    hint:`p = la moitié du coefficient de x : ${M(b)} ÷ 2 = ${M(p)}. Puis (${lin(p)})<sup>2</sup> = ${poly(1,b,p*p)} : il faut ajouter ou enlever ce qui manque pour retrouver ${M(c)}.`,
    solution:`(${lin(p)})<sup>2</sup> = ${poly(1,b,p*p)}, donc f(x) = (${lin(p)})<sup>2</sup> − ${p*p} + ${P(c)} = <b>(${lin(p)})<sup>2</sup> ${k<0?'− '+(-k):'+ '+k}</b>`};
}
function C7(){return `<h2>7. La forme canonique</h2>
<p class="intro">Quand ce n'est pas un carré parfait, on « complète le carré » : on écrit f(x) comme un carré plus un nombre. Cette forme montre tout de suite le point le plus bas.</p>
<div class="def">x<sup>2</sup> + bx + c = (x + p)<sup>2</sup> + k &nbsp; avec <b>p = b ÷ 2</b> et <b>k = c − p<sup>2</sup></b></div>
<div class="methode"><b>Méthode</b><ol><li>p = la moitié du coefficient de x (avec son signe).</li><li>Développe (x + p)<sup>2</sup> = x<sup>2</sup> + bx + p<sup>2</sup> : seul le nombre seul diffère.</li><li>k = c − p<sup>2</sup> : ce qu'il faut ajouter (ou enlever) pour retrouver c.</li></ol></div>
<div class="ex"><span class="q">Exemple 1 :</span><br>f(x) = x<sup>2</sup> + 6x + 11<br>• p = 6 ÷ 2 = 3, et (x + 3)<sup>2</sup> = x<sup>2</sup> + 6x + 9<br>• Il manque 11 − 9 = 2<br>• Donc <b>f(x) = (x + 3)<sup>2</sup> + 2</b></div>
<div class="ex"><span class="q">Exemple 2 : k négatif</span><br>g(x) = x<sup>2</sup> − 4x − 1<br>• p = −2, (x − 2)<sup>2</sup> = x<sup>2</sup> − 4x + 4<br>• k = −1 − 4 = −5 → <b>g(x) = (x − 2)<sup>2</sup> − 5</b><br>Vérification : (x − 2)<sup>2</sup> − 5 = x<sup>2</sup> − 4x + 4 − 5 = x<sup>2</sup> − 4x − 1 ✓</div>
<div class="warn">⚠️ k n'est pas c : il faut retirer p<sup>2</sup>. Dans l'exemple 1, k = 2, pas 11.<br>⚠️ Garde le signe de p : x<sup>2</sup> − 4x donne (x − 2)<sup>2</sup>, donc p = −2.</div>
<h3>Pourquoi c'est utile ?</h3><p>Un carré est toujours ≥ 0. Donc (x + 3)<sup>2</sup> + 2 est toujours ≥ 2 : le plus bas point de la parabole est à la hauteur 2, pour x = −3.</p>${parabola(1,6,11,{vertex:true})}
<div class="retenir">À retenir : x<sup>2</sup> + bx + c = (x + b÷2)<sup>2</sup> + (c − (b÷2)<sup>2</sup>).</div>`}

/* ---------- 8. sommet ---------- */
function L8(d){
  if(d>=2&&random()<.65){ // forme développée -> passer par la forme canonique
    const a=d<3?1:pick([1,1,-1]),h=nz(-6,6),k=nz(-9,9),b=-2*a*h,c=a*h*h+k,mx=a<0;
    return{type:'nums',a,b,c,go:{},gs:{vertex:true},
      html:`Soit f(x) = ${poly(a,b,c)}.<br>Quel est le point de ${mx?'<b>maximum</b>':'<b>minimum</b>'} de la parabole ?<br><span class="note">Mets d'abord f(x) sous forme canonique (au brouillon).</span>`,
      tpl:`S ( {0} ; {1} )`,check:numsCheck([h,k]),
      hint:a>0?`Complète le carré : la moitié de ${M(b)} est ${M(-h)}, donc (${lmin(h)})<sup>2</sup> = ${poly(1,b,h*h)}. Ajuste le nombre pour retrouver ${M(c)} : tu obtiens (${lmin(h)})<sup>2</sup> + k. Le point de minimum se lit alors directement.`
        :`Mets −1 en facteur : f(x) = −(${poly(1,-b,-c)}). Complète le carré dans la parenthèse, puis lis le sommet. Comme a = −1 &lt; 0, c'est un maximum.`,
      solution:a>0?`(${lmin(h)})<sup>2</sup> = ${poly(1,b,h*h)}, donc f(x) = (${lmin(h)})<sup>2</sup> − ${h*h} + ${P(c)} = ${canon(1,h,k)}.<br>Un carré est toujours ≥ 0, donc f(x) ≥ ${M(k)}, avec égalité quand x = ${M(h)}. Point de minimum : <b>S(${M(h)} ; ${M(k)})</b>.`
        :`f(x) = −(${poly(1,-b,-c)}) = −[(${lmin(h)})<sup>2</sup> ${-k<0?'− '+k:'+ '+(-k)}] = ${canon(-1,h,k)}.<br>−(${lmin(h)})<sup>2</sup> est toujours ≤ 0, donc f(x) ≤ ${M(k)}, avec égalité quand x = ${M(h)}. Point de maximum : <b>S(${M(h)} ; ${M(k)})</b>.`}}
  const a=d<2?1:pick([1,-1,2,-2,-1]),h=d<1?ri(-4,4):nz(-6,6),k=nz(-7,7),b=-2*a*h,c=a*h*h+k;
  if(d>=1&&random()<.45){
    const opts=[{v:'min',l:`un <b>minimum</b> égal à ${M(k)}`},{v:'max',l:`un <b>maximum</b> égal à ${M(k)}`},{v:'minh',l:`un <b>minimum</b> égal à ${M(h)}`},{v:'maxh',l:`un <b>maximum</b> égal à ${M(h)}`}];
    return{type:'choice',a,b,c,go:{},gs:{vertex:true},opts:shuffle(opts),
      html:`Soit f(x) = ${canon(a,h,k)}.<br>La fonction f admet…`,check:choiceCheck(a>0?'min':'max'),
      hint:`Regarde le signe de a (le nombre devant la parenthèse) : a &gt; 0 → parabole ∪ → minimum ; a &lt; 0 → parabole ∩ → maximum. La valeur de l'extremum est le nombre ajouté à la fin.`,
      solution:`a = ${M(a)} ${a>0?'&gt; 0 : parabole tournée vers le haut, <b>minimum</b>':'&lt; 0 : parabole tournée vers le bas, <b>maximum</b>'} égal à <b>${M(k)}</b>, atteint en x = ${M(h)}.`}}
  return{type:'nums',a,b,c,go:{},gs:{vertex:true},
    html:`Soit f(x) = ${canon(a,h,k)}.<br>Donne les coordonnées du sommet S de la parabole.`,
    tpl:`S ( {0} ; {1} )`,check:numsCheck([h,k]),
    hint:`Pour a(x − α)<sup>2</sup> + β, le sommet est S(α ; β). Attention : (x − 3) donne α = 3 et (x + 3) donne α = −3 (la valeur qui annule la parenthèse).`,
    solution:`La parenthèse s'annule pour x = ${M(h)}, et alors f(${M(h)}) = ${M(k)}. Donc <b>S(${M(h)} ; ${M(k)})</b>.`};
}
function C8(){return `<h2>8. Le sommet de la parabole</h2>
<p class="intro">Le sommet est le point le plus bas (ou le plus haut) de la parabole. La forme canonique le donne sans aucun calcul.</p>
<div class="def">Si f(x) = a(x − α)<sup>2</sup> + β, alors le <b>sommet</b> est <b>S(α ; β)</b>.<br>• a &gt; 0 : parabole ∪, f a un <b>minimum</b> β atteint en x = α<br>• a &lt; 0 : parabole ∩, f a un <b>maximum</b> β atteint en x = α</div>
<div class="methode"><b>Méthode</b><ol><li>Si f est développée, mets-la d'abord sous <b>forme canonique</b> (niveau 7) ; si a = −1, mets −1 en facteur.</li><li>α = la valeur qui <b>annule la parenthèse</b> ; β = le nombre ajouté à la fin.</li><li>Signe de a : positif → minimum ; négatif → maximum.</li></ol></div>
<div class="ex"><span class="q">Exemple 1 : forme canonique</span><br>f(x) = (x − 2)<sup>2</sup> + 1 → S(2 ; 1), minimum 1.<br>g(x) = −(x + 1)<sup>2</sup> + 4 → S(−1 ; 4), maximum 4 (graphique ci-dessous).<br>Pourquoi ? (x − 2)<sup>2</sup> est toujours ≥ 0 et vaut 0 seulement pour x = 2 : donc f(x) ≥ 1, et f(2) = 1.</div>
<div class="ex"><span class="q">Exemple 2 : forme développée</span><br>f(x) = x<sup>2</sup> − 6x + 5 = (x − 3)<sup>2</sup> − 9 + 5 = <b>(x − 3)<sup>2</sup> − 4</b> → minimum en <b>S(3 ; −4)</b>.<br>g(x) = −x<sup>2</sup> − 2x + 3 = −(x<sup>2</sup> + 2x − 3) = −[(x + 1)<sup>2</sup> − 4] = <b>−(x + 1)<sup>2</sup> + 4</b> → maximum en <b>S(−1 ; 4)</b>.</div>
<div class="warn">⚠️ α est la valeur qui <b>annule</b> la parenthèse : (x + 1) s'annule pour x = −1, donc α = −1 (et pas 1).<br>⚠️ Ne confonds pas α et β : la valeur du minimum est β, pas α.<br>⚠️ Avec −1 en facteur, tous les signes de la parenthèse changent.</div>
<p>La parabole est symétrique par rapport à la droite verticale x = α.</p>${parabola(-1,-2,3,{vertex:true})}
<div class="retenir">À retenir : a(x − α)<sup>2</sup> + β → sommet S(α ; β), minimum si a &gt; 0, maximum si a &lt; 0.</div>`}

/* ---------- 9. (x-h)^2 = m ---------- */
function L9(d){
  const n=ri(1,6),h=d<1?0:nz(-5,5);
  let v=d<2?0:ri(0,4),m,k,html,roots,b=-2*h,c;
  if(v<=2){m=n*n;roots=[h-n,h+n]}else if(v===3){m=0;roots=[h]}else{m=-ri(1,9);roots=[]}
  k=-m;c=h*h+k;
  html=d<2?`Résous l'équation :${big(`(${lmin(h)})<sup>2</sup> = ${M(m)}`)}`:`Résous l'équation f(x) = 0 avec :${big(`f(x) = (${lmin(h)})<sup>2</sup> ${k<0?'− '+(-k):k>0?'+ '+k:''}`)}`;
  return{type:'roots',a:1,b,c,go:{},gs:{roots:true,vertex:true},html,check:rootsCheck(roots),
    hint:`${d>=2?`Isole d'abord le carré : (${lmin(h)})<sup>2</sup> = ${M(m)}. `:''}Un carré égal à n<sup>2</sup> : la parenthèse vaut <b>n ou −n</b>. Un carré égal à 0 : la parenthèse vaut 0. Un carré ne peut jamais être négatif. Sur le graphique : les solutions sont là où la parabole coupe l'axe des x.`,
    solution:m>0?`(${lmin(h)})<sup>2</sup> = ${m} ⇔ ${lmin(h)} = ${n} ou ${lmin(h)} = −${n} ⇔ <b>x = ${M(h+n)} ou x = ${M(h-n)}</b>`:m===0?`(${lmin(h)})<sup>2</sup> = 0 ⇔ ${lmin(h)} = 0 ⇔ <b>x = ${M(h)}</b> (une seule solution)`:`(${lmin(h)})<sup>2</sup> = ${M(m)} est impossible car un carré est toujours positif : <b>aucune solution</b>. La parabole ne coupe pas l'axe des x.`};
}
function C9(){return `<h2>9. Résoudre (x − h)<sup>2</sup> = m</h2>
<p class="intro">Avec la forme canonique, résoudre f(x) = 0 revient à résoudre « un carré égal à un nombre ». On trouve ainsi les racines.</p>
<div class="def">• Si m &gt; 0 : X<sup>2</sup> = m ⇔ X = √m <b>ou</b> X = −√m → <b>2 solutions</b><br>• Si m = 0 : X<sup>2</sup> = 0 ⇔ X = 0 → <b>1 solution</b><br>• Si m &lt; 0 : <b>aucune solution</b> (un carré n'est jamais négatif)<br>Les solutions de f(x) = 0 s'appellent les <b>racines</b> de f.</div>
<div class="methode"><b>Méthode</b><ol><li>Isole le carré : (x − h)<sup>2</sup> + k = 0 ⇔ (x − h)<sup>2</sup> = −k.</li><li>Regarde le signe du nombre de droite : positif, nul ou négatif ?</li><li>S'il est positif, écris x − h = √m <b>ou</b> x − h = −√m, et résous les deux.</li></ol></div>
<div class="ex"><span class="q">Exemple 1 :</span><br>x<sup>2</sup> = 25 ⇔ x = 5 ou x = −5<br>(x − 1)<sup>2</sup> = 9 ⇔ x − 1 = 3 ou x − 1 = −3 ⇔ <b>x = 4 ou x = −2</b></div>
<div class="ex"><span class="q">Exemple 2 : isoler d'abord le carré</span><br>(x + 3)<sup>2</sup> − 16 = 0 ⇔ (x + 3)<sup>2</sup> = 16 ⇔ x + 3 = 4 ou x + 3 = −4 ⇔ <b>x = 1 ou x = −7</b><br>(x − 2)<sup>2</sup> = 0 ⇔ <b>x = 2</b> (une seule solution)<br>(x + 2)<sup>2</sup> + 5 = 0 ⇔ (x + 2)<sup>2</sup> = −5 → <b>aucune solution</b></div>
<div class="warn">⚠️ N'oublie pas la solution « moins » : x<sup>2</sup> = 25 a <b>deux</b> solutions.<br>⚠️ En isolant le carré, le nombre change de signe : (x + 3)<sup>2</sup> − 16 = 0 donne (x + 3)<sup>2</sup> = <b>+16</b>.</div>
<p>Sur le graphique, les racines sont les abscisses des points où la parabole coupe l'axe des x. Ici f(x) = (x − 1)<sup>2</sup> − 9 : racines −2 et 4.</p>${parabola(1,-2,-8,{roots:true})}
<p class="note">Pour répondre : remplis x₁ et x₂ (dans n'importe quel ordre), une seule case s'il n'y a qu'une solution, ou appuie sur « Aucune solution ».</p>
<div class="retenir">À retenir : X<sup>2</sup> = m a 2 solutions si m &gt; 0, 1 si m = 0, aucune si m &lt; 0.</div>`}

/* ---------- 10. produit nul ---------- */
function L10(d){
  let a=1,r1=ri(-6,6),r2,html;do{r2=ri(-6,6)}while(r2===r1);
  if(d<1){html=`Résous l'équation :${big(`${fact(1,r1,r2)} = 0`)}`}
  else if(d<2){r1=0;html=`Trouve les racines de :${big(`f(x) = ${fact(1,0,r2)}`)}`}
  else{const m=pick([2,3,-1,-2]);if(random()<.5){a=m;html=`Trouve les racines de :${big(`f(x) = ${fact(m,r1,r2)}`)}`}
    else{a=m;const q=-m*r1,f1=q===0?coefA(m)+'x':`(${coefA(m)}x ${q<0?'− '+(-q):'+ '+q})`;html=`Trouve les racines de :${big(`f(x) = ${f1}(${lmin(r2)})`)}`}} // pas « (3x + 0) »
  const b=-a*(r1+r2),c=a*r1*r2;
  return{type:'roots',a,b,c,go:{},gs:{roots:true},html,check:rootsCheck([r1,r2]),
    hint:`Un produit est nul si et seulement si <b>l'un des facteurs</b> est nul. Écris « facteur 1 = 0 ou facteur 2 = 0 » et résous chaque petite équation.`,
    solution:`Produit nul : on annule chaque facteur → <b>x = ${M(Math.min(r1,r2))} ou x = ${M(Math.max(r1,r2))}</b>. On le voit sur le graphique : la parabole coupe l'axe des x en ces deux points.`};
}
function C10(){return `<h2>10. Racines d'une forme factorisée</h2>
<p class="intro">Quand f est écrite comme un produit, ses racines se lisent presque directement grâce à la règle du produit nul.</p>
<div class="def"><b>Produit nul</b> : A × B = 0 ⇔ A = 0 ou B = 0<br>Si f(x) = a(x − x₁)(x − x₂), les racines de f sont <b>x₁ et x₂</b> (le nombre a ne change pas les racines).</div>
<div class="methode"><b>Méthode</b><ol><li>Écris : « premier facteur = 0 <b>ou</b> second facteur = 0 ».</li><li>Résous chaque petite équation du premier degré.</li><li>Un facteur « x » tout seul donne la racine 0 ; un coefficient devant les parenthèses ne donne pas de racine.</li></ol></div>
<div class="ex"><span class="q">Exemple 1 :</span><br>(x − 3)(x + 5) = 0 ⇔ x − 3 = 0 ou x + 5 = 0 ⇔ <b>x = 3 ou x = −5</b><br>x(x + 4) = 0 ⇔ <b>x = 0 ou x = −4</b></div>
<div class="ex"><span class="q">Exemple 2 : un coefficient</span><br>f(x) = −2(x − 1)(x + 6) : les racines sont <b>1 et −6</b> (le −2 ne s'annule jamais).<br>(2x − 6)(x + 1) = 0 ⇔ 2x = 6 ou x = −1 ⇔ <b>x = 3 ou x = −1</b></div>
<div class="warn">⚠️ Attention au signe : x − 3 s'annule pour x = <b>3</b>, et x + 5 pour x = <b>−5</b>.<br>⚠️ Dans (2x − 6), la racine est 6 ÷ 2 = 3, pas 6.<br>⚠️ N'oublie pas la racine 0 quand un facteur est x.</div>
<p>Sur le graphique de f(x) = (x − 3)(x + 5), la parabole coupe l'axe des x en −5 et en 3.</p>${parabola(1,2,-15,{roots:true})}
<div class="retenir">À retenir : un produit est nul si et seulement si l'un de ses facteurs est nul.</div>`}

/* ---------- 11. signe ---------- */
function L11(d){
  let r1=ri(-6,5),r2;do{r2=ri(-5,6)}while(r2===r1);if(r1>r2)[r1,r2]=[r2,r1];
  const a=d<2?1:pick([1,-1,2,-1,-2]),b=-a*(r1+r2),c=a*r1*r2,S=a>0?['+','−','+']:['−','+','−'];
  const expr=fact(a,r1,r2);
  if(d>=1&&random()<.4){const neg=random()<.5,inside=(a>0)===neg;
    const opts=[{v:'in',l:`pour x entre ${M(r1)} et ${M(r2)}`},{v:'out',l:`pour x &lt; ${M(r1)} ou x &gt; ${M(r2)}`},{v:'all',l:'pour tous les x'},{v:'none',l:'pour aucun x'}];
    return{type:'choice',a,b,c,go:{},gs:{roots:true,signs:true},opts,
      html:`Soit f(x) = ${expr}.<br>Pour quelles valeurs de x a-t-on <b>f(x) ${neg?'&lt;':'&gt;'} 0</b> ?`,check:choiceCheck(inside?'in':'out'),
      hint:`Les racines sont ${M(r1)} et ${M(r2)}. f(x) a le signe de a = ${M(a)} <b>à l'extérieur</b> des racines, et le signe contraire <b>entre</b> les racines. Sur le graphique : où la courbe est-elle ${neg?'sous':'au-dessus de'} l'axe des x ?`,
      solution:`a = ${M(a)} : f(x) est ${a>0?'positif':'négatif'} à l'extérieur des racines et ${a>0?'négatif':'positif'} entre elles. Donc f(x) ${neg?'&lt;':'&gt;'} 0 <b>${inside?`pour x entre ${M(r1)} et ${M(r2)}`:`pour x &lt; ${M(r1)} ou x &gt; ${M(r2)}`}</b>.`}}
  return{type:'table',a,b,c,go:{},gs:{roots:true,signs:true},xs:[r1,r2],
    html:`Complète le tableau de signes de${big('f(x) = '+expr)}<span class="note">Touche chaque case pour choisir + ou −.</span>`,check:tableCheck(S),
    hint:`Teste une valeur dans chaque zone ! Par ex. x = ${M(r1-1)} (avant ${M(r1)}), x = ${M((r1+r2)/2|0)}${r2-r1===1?' … ou regarde le graphique':''} (entre), x = ${M(r2+1)} (après), et regarde le signe de f(x). Règle : signe de a à l'extérieur des racines, signe contraire entre.`,
    solution:`Racines ${M(r1)} et ${M(r2)}, a = ${M(a)}. Signes : <b>${S.join(' | 0 | ')}</b>. Sur le graphique, la courbe est au-dessus de l'axe (vert) là où f(x) &gt; 0 et en dessous (rouge) là où f(x) &lt; 0.`};
}
function C11(){return `<h2>11. Signe : pour quels x ?</h2>
<p class="intro">Savoir où f(x) est positif ou négatif, c'est savoir où la parabole est au-dessus ou au-dessous de l'axe des x.</p>
<div class="def"><b>Règle</b> : f(x) = a(x − x₁)(x − x₂) a le <b>signe de a à l'extérieur</b> des racines et le <b>signe contraire entre</b> les racines.</div>
<div class="methode"><b>Méthode</b><ol><li>Trouve les racines x₁ &lt; x₂ (produit nul) et le signe de a.</li><li>Place-les dans le tableau de signes.</li><li>À l'extérieur : signe de a ; entre : signe contraire ; 0 sur les racines.</li><li>En cas de doute, teste une valeur dans chaque zone.</li></ol></div>
<p>Étudions f(x) = (x + 2)(x + 3) avec un <b>tableau de signes</b> :</p>
<table class="st"><tr><td>x</td><td class="e">−∞</td><td class="e"></td><td>−3</td><td class="e"></td><td>−2</td><td class="e"></td><td class="e">+∞</td></tr>
<tr><td>x + 3</td><td class="e"></td><td class="e">−</td><td>0</td><td class="e">+</td><td></td><td class="e">+</td><td class="e"></td></tr>
<tr><td>x + 2</td><td class="e"></td><td class="e">−</td><td></td><td class="e">−</td><td>0</td><td class="e">+</td><td class="e"></td></tr>
<tr><td><b>f(x)</b></td><td class="e"></td><td class="e"><b>+</b></td><td>0</td><td class="e"><b>−</b></td><td>0</td><td class="e"><b>+</b></td><td class="e"></td></tr></table>
<div class="ex"><span class="q">Exemple 1 : a = 1</span><br>Règle des signes : (−)×(−) = +, (−)×(+) = −, (+)×(+) = +. Donc f(x) &lt; 0 <b>pour x entre −3 et −2</b>, et f(x) &gt; 0 pour x &lt; −3 ou x &gt; −2.</div>
<div class="ex"><span class="q">Exemple 2 : a négatif</span><br>g(x) = −2(x − 1)(x − 4) : a = −2 &lt; 0. Signes : <b>− | 0 | + | 0 | −</b>.<br>Test pour vérifier : g(2) = −2 × 1 × (−2) = 4 &gt; 0 ✓ (entre les racines).</div>
<div class="warn">⚠️ Le signe de f à l'extérieur des racines est celui de <b>a</b> : avec a &lt; 0, tout s'inverse.<br>⚠️ Range les racines dans l'ordre croissant avant de remplir le tableau.</div>
<p>Sur le graphique : f(x) &gt; 0 là où la courbe est au-dessus de l'axe (vert), f(x) &lt; 0 là où elle est en dessous (rouge).</p>${parabola(1,5,6,{roots:true,signs:true})}
<div class="retenir">À retenir : signe de a à l'extérieur des racines, signe contraire entre.</div>`}

/* ---------- 12. discriminant ---------- */
function L12(d){
  const v=Math.min(3,ri(Math.max(0,d-1),d)),kind=pick(['two','two','two','one','none']);
  let a=pick(d<2?[1,1,-1,2]:[1,-1,2,-2,3]),b,c,roots;
  if(kind==='two'){let r1=ri(-5,5),r2;do{r2=ri(-5,5)}while(r2===r1);b=-a*(r1+r2);c=a*r1*r2;roots=[r1,r2]}
  else if(kind==='one'){const h=nz(-4,4);/* h = 0 donnerait f(x) = ax², racine 0 évidente */b=-2*a*h;c=a*h*h;roots=[h]}
  else{const h=ri(-3,3),k=Math.sign(a)*ri(1,6);b=-2*a*h;c=a*h*h+k;roots=[]}
  const D=b*b-4*a*c,F=`f(x) = ${poly(a,b,c)}`,abc=`a = ${M(a)}, b = ${M(b)}, c = ${M(c)}`;
  const calc=`Δ = b<sup>2</sup> − 4ac = ${P(b)}<sup>2</sup> − 4 × ${P(a)} × ${P(c)} = ${b*b} ${-4*a*c<0?'− '+(4*a*c):'+ '+(-4*a*c)} = <b>${M(D)}</b>`;
  const gs={roots:true,vertex:kind!=='two',signs:true};
  if(v===0)return{type:'nums',a,b,c,go:{},gs,html:`Calcule le discriminant Δ de${big(F)}`,tpl:`Δ = {0}`,check:numsCheck([D]),
    hint:`Δ = b<sup>2</sup> − 4ac avec ${abc}. Mets les nombres négatifs entre parenthèses.`,solution:calc};
  if(v===1)return{type:'choice',a,b,c,go:{},gs,opts:[{v:2,l:'deux racines'},{v:1,l:'une seule racine'},{v:0,l:'aucune racine'}],
    html:`Combien de racines a${big(F)}`,check:choiceCheck(roots.length),
    hint:`Calcule Δ = b<sup>2</sup> − 4ac. Δ &gt; 0 : deux racines ; Δ = 0 : une racine ; Δ &lt; 0 : aucune.`,
    solution:`${calc}. ${D>0?'Δ &gt; 0 : <b>deux racines</b>.':D===0?'Δ = 0 : <b>une seule racine</b>.':'Δ &lt; 0 : <b>aucune racine</b>.'} Regarde le graphique : la parabole coupe l'axe des x ${roots.length===2?'deux fois':roots.length?'une fois (elle le touche)':'jamais'}.`};
  if(v===2){const rs=[...roots].sort((p,q)=>p-q);
    return{type:'roots',a,b,c,go:{},gs,html:`Trouve les racines de${big(F)}`,check:rootsCheck(roots),
    hint:`Calcule Δ. Si Δ &gt; 0 : x = (−b − √Δ) ÷ (2a) et x = (−b + √Δ) ÷ (2a). Si Δ = 0 : x = −b ÷ (2a). Si Δ &lt; 0 : aucune racine.`,
    solution:`${calc}. `+(D>0?`√Δ = ${Math.sqrt(D)} ; x₁ = (${M(-b)} − ${Math.sqrt(D)}) ÷ ${P(2*a)} et x₂ = (${M(-b)} + ${Math.sqrt(D)}) ÷ ${P(2*a)}, donc <b>x = ${M(rs[0])} ou x = ${M(rs[1])}</b>.`:D===0?`x₀ = ${M(-b)} ÷ ${P(2*a)} = <b>${M(rs[0])}</b>.`:`Δ &lt; 0 : <b>aucune racine</b>.`)}}
  // v===3 : signe
  if(roots.length<2){const all=a>0?'pos':'neg';
    return{type:'choice',a,b,c,go:{},gs,opts:[{v:'pos',l:`f(x) ≥ 0 pour tous les x`},{v:'neg',l:`f(x) ≤ 0 pour tous les x`},{v:'chg',l:`f(x) change de signe`}],
      html:`Étudie le signe de${big(F)}`,check:choiceCheck(all),
      hint:`Calcule Δ. S'il n'y a pas deux racines, la parabole ne traverse pas l'axe des x : f(x) garde le signe de a partout.`,
      solution:`${calc}. ${D<0?'Pas de racine':'Une seule racine'} : f(x) a toujours le signe de a = ${M(a)}, donc <b>${a>0?'f(x) ≥ 0':'f(x) ≤ 0'} pour tous les x</b>${D<0?(a>0?' (et même &gt; 0)':' (et même &lt; 0)'):''}.`}}
  const rs=[...roots].sort((p,q)=>p-q),S=a>0?['+','−','+']:['−','+','−'];
  return{type:'table',a,b,c,go:{},gs,xs:rs,html:`Tableau de signes de${big(F)}<span class="note">Calcule Δ et les racines au brouillon, puis touche chaque case.</span>`,check:tableCheck(S),
    hint:`1) Δ et les racines. 2) Signe de a à l'extérieur des racines, signe contraire entre.`,
    solution:`${calc}, racines ${M(rs[0])} et ${M(rs[1])}, a = ${M(a)} : <b>${S.join(' | 0 | ')}</b>.`};
}
function C12(){return `<h2>12. Le discriminant Δ</h2>
<p class="intro">Le discriminant est un seul nombre, calculé avec a, b et c, qui dit combien f a de racines et permet de les calculer, même sans forme factorisée.</p>
<p>Pour toute fonction f(x) = ax<sup>2</sup> + bx + c, on calcule :</p>
<div class="def" style="text-align:center;font-size:22px"><b>Δ = b<sup>2</sup> − 4ac</b></div>
<div class="def">• <b>Δ &gt; 0</b> : deux racines &nbsp; x₁ = (−b − √Δ) / (2a) &nbsp; et &nbsp; x₂ = (−b + √Δ) / (2a)<br>• <b>Δ = 0</b> : une racine &nbsp; x₀ = −b / (2a)<br>• <b>Δ &lt; 0</b> : aucune racine</div>
<div class="methode"><b>Méthode</b><ol><li>Lis a, b, c (forme réduite, avec les signes).</li><li>Calcule Δ = b<sup>2</sup> − 4ac, nombres négatifs entre parenthèses.</li><li>Signe de Δ → nombre de racines ; puis formules des racines.</li><li>Signe de f : Δ &gt; 0 → signe de a à l'extérieur des racines ; Δ ≤ 0 → signe de a partout.</li></ol></div>
<div class="ex"><span class="q">Exemple 1 : deux racines</span><br>f(x) = x<sup>2</sup> − x − 6 : a = 1, b = −1, c = −6<br>Δ = (−1)<sup>2</sup> − 4 × 1 × (−6) = 1 + 24 = 25, √Δ = 5<br>x₁ = (1 − 5) / 2 = −2 &nbsp; ; &nbsp; x₂ = (1 + 5) / 2 = 3. Signe : + | 0 | − | 0 | +</div>
<div class="ex"><span class="q">Exemple 2 : Δ = 0 et Δ &lt; 0</span><br>g(x) = 2x<sup>2</sup> − 12x + 18 : Δ = 144 − 144 = 0 → une racine x₀ = 12 / 4 = <b>3</b> ; g(x) ≥ 0 partout.<br>h(x) = −x<sup>2</sup> + 2x − 5 : Δ = 4 − 4 × (−1) × (−5) = 4 − 20 = −16 &lt; 0 → <b>aucune racine</b> ; a &lt; 0, donc h(x) &lt; 0 pour tout x.</div>
<div class="warn">⚠️ Mets les nombres négatifs entre parenthèses : b = −1 donne b<sup>2</sup> = (−1)<sup>2</sup> = 1, pas −1 !<br>⚠️ −4ac avec a et c de signes contraires donne un nombre <b>positif</b> : −4 × 1 × (−6) = +24.<br>⚠️ Divise par <b>2a</b> (tout le dénominateur), pas seulement par 2.</div>
<p>Pourquoi ça marche ? Δ vient de la forme canonique : a(x + b/(2a))<sup>2</sup> − Δ/(4a). C'est le niveau 9 avec des lettres !</p>${parabola(1,-1,-6,{roots:true,signs:true})}
<div class="retenir">À retenir : Δ = b<sup>2</sup> − 4ac ; Δ &gt; 0 → 2 racines, Δ = 0 → 1, Δ &lt; 0 → aucune.</div>`}


/* ================= enveloppe : graphe et vérifications indépendantes ================= */
const wrap = g => d => {
  const q = g(d);
  q.visual = parabola(q.a, q.b, q.c, q.go || {});
  q.afterVisual = parabola(q.a, q.b, q.c, q.gs || {});
  q.replaceVisual = true; // après la réponse, le graphe enrichi remplace le premier
  if (q.type === 'roots') q.truth = x => Math.abs(q.a * x * x + q.b * x + q.c) < 1e-9;
  if (q.type === 'table') q.fmtX = M;
  return q;
};
export const LEVELS = LEVELS_.map(L => ({ ...L, generate: wrap(L.generate) }));
export const OPTIONS = { need: 4 };

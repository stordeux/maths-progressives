// Inégalités : 12 niveaux, repris de inegalites.html (générateurs, cours, indices, corrections).
// Le graphique est affiché APRÈS la réponse (avant, il donnerait la solution).
// Chaque inéquation porte un prédicat truth(x) : les tests vérifient l'ensemble solution point par point.
import { ri, pick, shuffle, nz, random } from '../../engine/util/rand.js';
import { numsCheck, rootsCheck, choiceCheck, ivCheck } from '../../engine/answers/checks.js';
import { realLine } from '../../engine/draw/realLine.js';
import { plot } from '../../engine/draw/plot.js';


/* ================= outils ================= */
const INF=Infinity;
const CMP={lt:(u,v)=>u<v,le:(u,v)=>u<=v,gt:(u,v)=>u>v,ge:(u,v)=>u>=v};
const M=n=>n===INF?'+∞':n===-INF?'−∞':(n<0?'−':'')+String(Math.abs(n)).replace('.',',');
const P=n=>n<0?'('+M(n)+')':M(n);
const F=(n,d)=>`<span class="frac"><span>${n}</span><span>${d}</span></span>`;
const big=s=>`<div class="big">${s}</div>`;
function terms(list){let s='';list.filter(t=>t[0]!==0).forEach((t,i)=>{const[k,v]=t,ab=Math.abs(k),c=(ab===1&&v)?'':M(ab);s+=(k<0?(i?' − ':'−'):(i?' + ':''))+c+v});return s||'0'}
const lin=(a,b)=>terms([[a,'x'],[b,'']]);
const xm=a=>a===0?'x':a>0?`x − ${a}`:`x + ${-a}`;   // x − a
const REL={lt:'&lt;',le:'≤',gt:'&gt;',ge:'≥'},FLIP={lt:'gt',le:'ge',gt:'lt',ge:'le'};
const rr=()=>pick(['lt','le','gt','ge']);
const I=(lo,lc,hi,hc)=>({lo,lc:lo===-INF?false:!!lc,hi,hc:hi===INF?false:!!hc});
const R_=[I(-INF,0,INF,0)];
function relSet(rel,s){return{lt:[I(-INF,0,s,0)],le:[I(-INF,0,s,1)],gt:[I(s,0,INF,0)],ge:[I(s,1,INF,0)]}[rel]}
function fmtSet(S){if(!S.length)return'∅';if(S.length===1&&S[0].lo===-INF&&S[0].hi===INF)return'ℝ';
  return S.map(i=>`${i.lc?'[':']'}${M(i.lo)} ; ${M(i.hi)}${i.hc?']':'['}`).join(' ∪ ')}
const dm=n=>n<0?'−':'+';

/* ================= dessins ================= */

/* ================= niveaux ================= */
const LEVELS_=[
 { titre: "Comparer des nombres", generate: L1, cours: C1 },
 { titre: "Intervalles", generate: L2, cours: C2 },
 { titre: "Opérations et sens de l'inégalité", generate: L3, cours: C3 },
 { titre: "Inéquations simples", generate: L4, cours: C4 },
 { titre: "Inéquations ax + b < cx + d", generate: L5, cours: C5 },
 { titre: "Encadrements", generate: L6, cours: C6 },
 { titre: "Valeur absolue et distance", generate: L7, cours: C7 },
 { titre: "Inéquations avec valeur absolue", generate: L8, cours: C8 },
 { titre: "Carrés et inégalités", generate: L9, cours: C9 },
 { titre: "Inéquations avec des carrés", generate: L10, cours: C10 },
 { titre: "Inéquations produits", generate: L11, cours: C11 },
 { titre: "Défis : mélanges difficiles", generate: L12, cours: C12 },
];
const cmpQ=(Lh,Lv,Rh,Rv,hint,why,marks)=>{const X=Lv<Rv?'<':Lv>Rv?'>':'=';
  return{type:'cmp',html:`Compare :${big(`${Lh} &nbsp;<span style="color:var(--acc)">?</span>&nbsp; ${Rh}`)}`,check:choiceCheck(X),hint,
    solution:`${why} Donc ${Lh} <b>${X==='<'?'&lt;':X==='>'?'&gt;':'='}</b> ${Rh}.`,afterVisual:marks?realLine(null,marks):''}};

/* ---------- 1 ---------- */
function L1(d){
  const v=Math.min(3,ri(Math.max(0,d-1),d));
  if(v===0){const a=ri(-9,9);let b;do{b=ri(-9,9)}while(b===a);
    return cmpQ(M(a),a,M(b),b,`Place les deux nombres sur une droite graduée : le plus petit est le plus à <b>gauche</b>. Attention, −7 est plus petit que −3 !`,
      `Sur la droite, ${M(Math.min(a,b))} est à gauche de ${M(Math.max(a,b))}.`,[{x:a,l:M(a)},{x:b,l:M(b),c:'#5f3dc4'}])}
  if(v===1){const a=nz(-60,60)/10;let b=Math.round((a+(random()<.5?-1:1)*ri(1,15)/100)*100)/100;if(random()<.25)b=-b;if(b===a)b=Math.round((a+.05)*100)/100;
    const t2=n=>(n<0?'−':'')+Math.abs(n).toFixed(2).replace('.',',');
    return cmpQ(M(a),a,M(b),b,`Compare d'abord les signes, puis les parties entières, puis chiffre par chiffre après la virgule (écris les deux nombres avec deux décimales). Pour des négatifs, le plus petit est celui qui est le plus loin de 0.`,
      `Avec deux décimales : ${t2(a)} et ${t2(b)}.`,[{x:a,l:M(a)},{x:b,l:M(b),c:'#5f3dc4'}])}
  if(v===2){const pairs=[[ri(1,7),ri(2,9)],[ri(1,7),ri(2,9)]];let[[a,b],[c,e]]=pairs;if(a>=b)a=b-1;if(c>=e)c=e-1;if(a*e===c*b)return L1(d);
    const s=random()<.4?-1:1;
    return cmpQ((s<0?'−':'')+F(a,b),s*a/b,(s<0?'−':'')+F(c,e),s*c/e,`Mets les fractions au même dénominateur (${b} × ${e} = ${b*e}) et compare les numérateurs.${s<0?' Attention : avec le signe −, l\'ordre s\'inverse !':''}`,
      `${F(a,b)} = ${F(a*e,b*e)} et ${F(c,e)} = ${F(c*b,b*e)}.${s<0?' Avec le signe −, l\'ordre s\'inverse.':''}`)}
  const n=ri(2,6),k=ri(1,30),opts=[
    [`|−${n+1}|`,n+1,M(n),n,`La valeur absolue d'un nombre est sa distance à 0 : |−${n+1}| = ${n+1}.`],
    [`(−${n})<sup>2</sup>`,n*n,M(-k),-k,`(−${n})<sup>2</sup> = (−${n}) × (−${n}) = ${n*n}, positif.`],
    [`−${n}<sup>2</sup>`,-n*n,`(−${n})<sup>2</sup>`,n*n,`−${n}<sup>2</sup> = −(${n*n}) = −${n*n} alors que (−${n})<sup>2</sup> = ${n*n}.`],
    [`−|${k}|`,-k,`|−${n}|`,n,`−|${k}| = −${k} et |−${n}| = ${n}.`]];
  const[Lh,Lv,Rh,Rv,why]=pick(opts);
  return cmpQ(Lh,Lv,Rh,Rv,`Calcule d'abord chaque membre. Rappel : |a| est la distance de a à 0 (toujours ≥ 0), (−a)<sup>2</sup> est positif, mais −a<sup>2</sup> = −(a<sup>2</sup>).`,why);
}
function C1(){return `<h2>1. Comparer des nombres</h2>
<p class="intro">Comparer, c'est dire lequel de deux nombres est le plus petit. C'est la base de toutes les inégalités du chapitre.</p>
<div class="def">Sur une droite graduée, <b>le plus petit nombre est le plus à gauche</b>.<br>a &lt; b se lit « a est strictement inférieur à b » ; a ≤ b : « a est inférieur <b>ou égal</b> à b ».</div>
${realLine(null,[{x:-7,l:'−7'},{x:-3,l:'−3',c:'#5f3dc4'},{x:2,l:'2',c:'#2f9e44'}])}
<div class="methode"><b>Méthode</b><ol><li>Compare d'abord les <b>signes</b> : un négatif est toujours plus petit qu'un positif.</li><li>Décimaux : écris-les avec le même nombre de décimales, puis compare chiffre par chiffre.</li><li>Fractions : mets-les au <b>même dénominateur</b>, puis compare les numérateurs.</li><li>Deux négatifs : le plus petit est celui qui est le plus <b>loin de 0</b>.</li></ol></div>
<div class="ex"><span class="q">Exemple 1 : entiers et décimaux</span><br>−7 &lt; −3 &lt; 2 (voir la droite).<br>2,45 &lt; 2,5 car 2,45 &lt; 2,50. Mais −2,5 &lt; −2,45 : pour les négatifs, l'ordre s'inverse.</div>
<div class="ex"><span class="q">Exemple 2 : fractions, carrés, valeurs absolues</span><br>${F(2,3)} et ${F(3,4)} : ${F(8,12)} &lt; ${F(9,12)}, donc ${F(2,3)} &lt; ${F(3,4)}. Avec un signe − : −${F(2,3)} &gt; −${F(3,4)}.<br>(−3)<sup>2</sup> = 9 et −3<sup>2</sup> = −9, donc −3<sup>2</sup> &lt; (−3)<sup>2</sup>. Et |−5| = 5 &gt; 4.</div>
<div class="warn">⚠️ −7 n'est pas plus grand que −3 : il est plus loin de 0, mais à <b>gauche</b>.<br>⚠️ 2,45 n'est pas plus grand que 2,5 : « 45 » n'est pas comparable à « 5 » sans écrire 2,50.<br>⚠️ (−3)<sup>2</sup> = 9 mais −3<sup>2</sup> = −9. Et |−5| = 5 (une valeur absolue est toujours positive).</div>
<div class="retenir">À retenir : plus petit = plus à gauche sur la droite graduée.</div>`}

/* ---------- 2 ---------- */
function L2(d){
  let a=ri(-8,5),b=ri(a+1,a+9);const lc=random()<.5,hc=random()<.5,v=Math.min(3,ri(Math.max(0,d-1),d));
  let S,T=null,html,hint=`Crochet <b>tourné vers le nombre</b> [ ou ] : le nombre est compris (≤, ≥). Crochet <b>tourné vers l'extérieur</b> : exclu (&lt;, &gt;). Du côté de l'infini, le crochet est toujours ouvert.`;
  if(v===0){S=[I(a,lc,b,hc)];T=x=>(lc?x>=a:x>a)&&(hc?x<=b:x<b);html=`Écris sous forme d'intervalle l'ensemble des x tels que :${big(`${M(a)} ${lc?'≤':'&lt;'} x ${hc?'≤':'&lt;'} ${M(b)}`)}`}
  else if(v===1){const rel=rr();S=relSet(rel,a);T=x=>CMP[rel](x,a);html=`Écris sous forme d'intervalle l'ensemble des x tels que :${big(`x ${REL[rel]} ${M(a)}`)}`}
  else if(v===2){S=random()<.5?[I(a,lc,b,hc)]:relSet(rr(),a);html=`Quel intervalle est représenté en bleu sur la droite ?${realLine(S)}`}
  else{const r1=pick(['lt','le']),r2=pick(['gt','ge']);S=[relSet(r1,a)[0],relSet(r2,b)[0]];T=x=>CMP[r1](x,a)||CMP[r2](x,b);html=`Écris sous forme d'intervalle(s) l'ensemble des x tels que :${big(`x ${REL[r1]} ${M(a)} &nbsp;ou&nbsp; x ${REL[r2]} ${M(b)}`)}<span class="note">Utilise le bouton « ∪ 2<sup>e</sup> intervalle ».</span>`}
  return{type:'iv',truth:T,html,check:ivCheck(S),hint,solution:`<b>${fmtSet(S)}</b>`,afterVisual:realLine(S)};
}
function C2(){return `<h2>2. Les intervalles</h2>
<p class="intro">Un intervalle est une façon courte d'écrire « tous les nombres entre ceci et cela ». On s'en sert pour donner les solutions d'une inéquation.</p>
<div class="def">L'ensemble des x tels que −2 ≤ x &lt; 5 s'écrit <b>[−2 ; 5[</b>.<br>• Crochet <b>tourné vers le nombre</b> ( [−2 ) : le nombre est <b>compris</b> (≤ ou ≥).<br>• Crochet <b>tourné vers l'extérieur</b> ( 5[ ) : le nombre est <b>exclu</b> (&lt; ou &gt;).</div>
${realLine([I(-2,1,5,0)])}
<div class="methode"><b>Méthode</b><ol><li>Écris la plus petite borne à gauche, la plus grande à droite.</li><li>Pour chaque borne : ≤ ou ≥ → crochet tourné vers le nombre ; &lt; ou &gt; → crochet tourné vers l'extérieur.</li><li>Pas de borne d'un côté ? Écris −∞ ou +∞, avec un crochet <b>ouvert</b>.</li><li>« ou » entre deux conditions → deux intervalles reliés par <b>∪</b>.</li></ol></div>
<div class="ex"><span class="q">Exemple 1 : une seule inégalité</span><br>x &gt; 3 → <b>]3 ; +∞[</b> &nbsp;&nbsp; x ≤ 1 → <b>]−∞ ; 1]</b></div>${realLine([I(3,0,INF,0)])}
<div class="ex"><span class="q">Exemple 2 : réunion ∪</span><br>x &lt; −1 <b>ou</b> x ≥ 4 → <b>]−∞ ; −1[ ∪ [4 ; +∞[</b></div>${realLine([I(-INF,0,-1,0),I(4,1,INF,0)])}
<div class="warn">⚠️ Du côté de −∞ ou +∞, le crochet est <b>toujours ouvert</b> (l'infini n'est pas un nombre).<br>⚠️ Dans ]3 ; +∞[, le 3 est <b>exclu</b> : le crochet ] est tourné vers l'extérieur.<br>⚠️ Les bornes s'écrivent dans l'ordre : [−2 ; 5[, jamais [5 ; −2[.</div>
<p class="note">Pour répondre : touche un crochet pour le retourner ; tape les bornes (touche ∞, et − devant pour −∞). Boutons ℝ (tous les réels) et ∅ (aucun réel) si besoin.</p>
<div class="retenir">À retenir : crochet vers le nombre = compris ; crochet vers l'extérieur = exclu ; toujours ouvert en ±∞.</div>`}

/* ---------- 3 ---------- */
function L3(d){
  const k=ri(2,9),v=Math.min(3,ri(Math.max(0,d-1),d));
  const ops=[[[`x + ${k}`,`y + ${k}`,1,`Ajouter ${k} aux deux membres ne change pas le sens.`],[`x − ${k}`,`y − ${k}`,1,`Soustraire ${k} ne change pas le sens.`]],
    [[`${k}x`,`${k}y`,1,`Multiplier par ${k} &gt; 0 ne change pas le sens.`],[F('x',k),F('y',k),1,`Diviser par ${k} &gt; 0 ne change pas le sens.`]],
    [[`−${k}x`,`−${k}y`,-1,`Multiplier par −${k} &lt; 0 <b>change le sens</b>.`],[`−x`,`−y`,-1,`Prendre l'opposé <b>change le sens</b> (multiplier par −1).`]],
    [[`${k} − 2x`,`${k} − 2y`,-1,`On multiplie par −2 (le sens change), puis on ajoute ${k} (le sens ne change plus).`],[F('x',`−${k}`),F('y',`−${k}`),-1,`Diviser par −${k} &lt; 0 change le sens.`],[`3x − ${k}`,`3y − ${k}`,1,`× 3 (positif) puis − ${k} : le sens ne change pas.`]]][v];
  const[Lh,Rh,s,why]=pick(ops),X=s>0?'<':'>';
  return{type:'cmp',html:`On sait que <b>x &lt; y</b>.${big(`${Lh} &nbsp;<span style="color:var(--acc)">?</span>&nbsp; ${Rh}`)}`,check:choiceCheck(X),
    hint:`Ajouter ou soustraire un nombre : le sens reste. Multiplier ou diviser par un nombre <b>positif</b> : le sens reste. Par un nombre <b>négatif</b> : le sens <b>s'inverse</b>. Tu peux tester avec x = 1 et y = 2.`,
    solution:`${why} Donc ${Lh} <b>${s>0?'&lt;':'&gt;'}</b> ${Rh}.`,afterVisual:''};
}
function C3(){return `<h2>3. Opérations sur les inégalités</h2>
<p class="intro">Pour résoudre une inéquation, on fait des opérations des deux côtés. Presque toutes gardent le sens… sauf une, qu'il faut absolument connaître.</p>
<div class="def">Si a &lt; b, alors :<br>• a + c &lt; b + c et a − c &lt; b − c &nbsp; (le sens <b>ne change pas</b>)<br>• si k &gt; 0 : ka &lt; kb et a ÷ k &lt; b ÷ k &nbsp; (le sens <b>ne change pas</b>)<br>• si k &lt; 0 : ka <b>&gt;</b> kb et a ÷ k <b>&gt;</b> b ÷ k &nbsp; (le sens <b>change</b> !)</div>
<div class="methode"><b>Méthode</b><ol><li>Repère les opérations faites sur x pour obtenir l'expression, dans l'ordre.</li><li>Pour chaque opération : + ou − → rien ne change ; × ou ÷ par un <b>positif</b> → rien ne change ; × ou ÷ par un <b>négatif</b> → le sens <b>s'inverse</b>.</li><li>En cas de doute, teste avec x = 1 et y = 2.</li></ol></div>
${realLine(null,[{x:2,l:'2'},{x:5,l:'5'},{x:-2,l:'−2',c:'#5f3dc4'},{x:-5,l:'−5',c:'#5f3dc4'}])}
<p>Prendre l'opposé, c'est faire une symétrie par rapport à 0 : 2 est à gauche de 5, mais −2 est à <b>droite</b> de −5. L'ordre s'inverse.</p>
<div class="ex"><span class="q">Exemple 1 :</span><br>On sait que x &lt; y. Alors x + 7 &lt; y + 7 et 3x &lt; 3y.<br>Mais −3x <b>&gt;</b> −3y. Test : 2 &lt; 5 donne −6 &gt; −15 ✓.</div>
<div class="ex"><span class="q">Exemple 2 : deux opérations</span><br>x &lt; y. Pour 5 − 2x : on multiplie par −2 (le sens change : −2x &gt; −2y), puis on ajoute 5 (le sens ne change plus). Donc <b>5 − 2x &gt; 5 − 2y</b>.<br>Pour 3x − 4 : × 3 (positif) puis − 4 : <b>3x − 4 &lt; 3y − 4</b>.</div>
<div class="warn">⚠️ L'erreur la plus fréquente : oublier de retourner l'inégalité quand on multiplie ou divise par un <b>négatif</b>.<br>⚠️ Soustraire un nombre ne change <b>pas</b> le sens, même si le résultat est négatif.</div>
<div class="retenir">À retenir : × ou ÷ par un négatif → on retourne l'inégalité. Tout le reste la garde.</div>`}

/* ---------- 4 ---------- */
function L4(d){
  const rel=rr(),s=ri(-8,8);let html,sol,fr=rel,T;
  if(d<1){const a=nz(-9,9),c=s+a;T=x=>CMP[rel](x+a,c);html=`x ${a<0?'− '+(-a):'+ '+a} ${REL[rel]} ${M(c)}`;sol=`On ${a<0?'ajoute '+(-a):'soustrait '+a} aux deux membres : x ${REL[rel]} ${M(c)} ${a<0?'+ '+(-a):'− '+a}, soit x ${REL[rel]} ${M(s)}.`}
  else if(d<2){const a=ri(2,7),c=a*s;T=x=>CMP[rel](a*x,c);html=`${a}x ${REL[rel]} ${M(c)}`;sol=`On divise par ${a} &gt; 0 (le sens ne change pas) : x ${REL[rel]} ${M(s)}.`}
  else{const a=-ri(2,7),b=d>=3?nz(-9,9):0,c=a*s+b;T=x=>CMP[rel](a*x+b,c);fr=FLIP[rel];html=`${lin(a,b)} ${REL[rel]} ${M(c)}`;
    sol=(b?`On ${b>0?'soustrait '+b:'ajoute '+(-b)} : ${M(a)}x ${REL[rel]} ${M(a*s)}. `:'')+`On divise par ${M(a)} &lt; 0 : <b>le sens change</b>, x ${REL[fr]} ${M(s)}.`}
  const S=relSet(fr,s);
  return{type:'iv',truth:T,html:`Résous l'inéquation et donne l'ensemble des solutions :${big(html)}`,check:ivCheck(S),
    hint:`Isole x comme dans une équation. Si tu divises par un nombre <b>négatif</b>, retourne l'inégalité. Pour vérifier, teste une valeur dans ton intervalle.`,
    solution:`${sol} Solutions : <b>${fmtSet(S)}</b>`,afterVisual:realLine(S)};
}
function C4(){return `<h2>4. Inéquations simples</h2>
<p class="intro">Une inéquation se résout presque comme une équation : on isole x. La seule différence est le sens à surveiller.</p>
<div class="def">Résoudre une inéquation, c'est trouver <b>tous</b> les nombres x qui la vérifient. On donne la réponse sous forme d'<b>intervalle</b>.</div>
<div class="methode"><b>Méthode</b><ol><li>Enlève le nombre ajouté à x (même opération des deux côtés).</li><li>Divise par le nombre devant x ; s'il est <b>négatif</b>, <b>retourne</b> l'inégalité.</li><li>Écris l'intervalle (≤, ≥ → crochet fermé ; &lt;, &gt; → ouvert).</li><li>Vérifie avec une valeur de l'intervalle.</li></ol></div>
<div class="ex"><span class="q">Exemple 1 :</span><br>x + 4 ≤ 1 ⇔ x ≤ 1 − 4 ⇔ x ≤ −3 → <b>]−∞ ; −3]</b><br>3x &gt; 12 ⇔ x &gt; 4 (÷ 3, positif) → <b>]4 ; +∞[</b></div>
<div class="ex"><span class="q">Exemple 2 : diviser par un négatif</span><br>−2x + 5 &lt; 11 ⇔ −2x &lt; 6 ⇔ x <b>&gt;</b> −3 (÷ (−2), négatif : on retourne !) → <b>]−3 ; +∞[</b><br>Vérification avec x = 0 : −2 × 0 + 5 = 5 &lt; 11 : vrai, et 0 est bien dans ]−3 ; +∞[ ✓</div>${realLine([I(-3,0,INF,0)])}
<div class="warn">⚠️ Dans −2x &lt; 6, on divise par −2 : le &lt; devient &gt;. Sans cela, on trouverait x &lt; −3 : faux (x = 0 marche !).<br>⚠️ Retirer 4 ne retourne pas l'inégalité, même si le résultat est négatif : x + 4 ≤ 1 donne x ≤ −3, le sens reste le même.</div>
<div class="retenir">À retenir : on isole x comme dans une équation, et on retourne l'inégalité si on divise par un négatif.</div>`}

/* ---------- 5 ---------- */
function L5(d){
  let a,c;if(d<1){a=ri(3,8);c=ri(1,a-1)}else if(d<2){a=ri(1,7);c=nz(-3,7);if(c===a)c++}else{a=nz(-5,5);c=nz(-5,6);if(c===a)return L5(d)}
  if(d>=1&&random()<.5){[a,c]=[c,a];if(a===0||c===0)return L5(d)}
  const rel=rr(),s=ri(-7,7),b=ri(-9,9),k=a-c,dd=k*s+b,fr=k<0?FLIP[rel]:rel,S=relSet(fr,s);
  return{type:'iv',truth:x=>CMP[rel](a*x+b,c*x+dd),html:`Résous :${big(`${lin(a,b)} ${REL[rel]} ${lin(c,dd)}`)}`,check:ivCheck(S),
    hint:`Regroupe les x d'un côté et les nombres de l'autre : ${M(a)}x − ${P(c)}x ${REL[rel]} ${M(dd)} − ${P(b)}. Puis divise par le coefficient de x (attention à son signe).`,
    solution:`${M(a)}x − ${P(c)}x ${REL[rel]} ${M(dd)} − ${P(b)} ⇔ ${M(k)}x ${REL[rel]} ${M(k*s)} ⇔ x ${REL[fr]} ${M(s)}${k<0?' (division par un négatif : le sens change)':''}. Solutions : <b>${fmtSet(S)}</b>`,afterVisual:realLine(S)};
}
function C5(){return `<h2>5. Inéquations ax + b &lt; cx + d</h2>
<p class="intro">Quand x apparaît des deux côtés, on commence par le regrouper d'un seul côté. Ensuite, c'est une inéquation simple.</p>
<div class="def">Une inéquation du <b>premier degré</b> peut toujours se ramener à kx &lt; m (ou ≤, &gt;, ≥), puis à x &lt; m ÷ k ou x &gt; m ÷ k selon le signe de k.</div>
<div class="methode"><b>Méthode</b><ol><li>On regroupe les termes en x d'un côté, les nombres de l'autre (on change de côté = on fait l'opération inverse des deux côtés).</li><li>On réduit : on obtient kx &lt; m.</li><li>On divise par k, en retournant l'inégalité si <b>k &lt; 0</b>.</li><li>On écrit l'intervalle et on vérifie avec une valeur.</li></ol></div>
<div class="ex"><span class="q">Exemple 1 :</span><br>5x − 3 ≥ 2x + 9<br>⇔ 5x − 2x ≥ 9 + 3<br>⇔ 3x ≥ 12 ⇔ x ≥ 4 → <b>[4 ; +∞[</b></div>
<div class="ex"><span class="q">Exemple 2 : coefficient négatif</span><br>x + 7 &gt; 4x − 2<br>⇔ x − 4x &gt; −2 − 7 ⇔ −3x &gt; −9<br>⇔ x <b>&lt;</b> 3 (÷ (−3) : on retourne) → <b>]−∞ ; 3[</b><br>Vérification avec x = 0 : 7 &gt; −2 ✓</div>${realLine([I(-INF,0,3,0)])}
<div class="warn">⚠️ Quand un terme change de côté, il change de signe : + 2x à droite devient − 2x à gauche.<br>⚠️ −3x &gt; −9 : les deux nombres sont négatifs, mais c'est la division par −3 qui retourne le sens.</div>
<p class="note">Astuce : regrouper les x du côté où le coefficient reste positif évite de diviser par un négatif. Ici : 7 + 2 &gt; 4x − x ⇔ 9 &gt; 3x ⇔ 3 &gt; x.</p>
<div class="retenir">À retenir : x d'un côté, nombres de l'autre, puis division (attention au signe).</div>`}

/* ---------- 6 ---------- */
function L6(d){
  const lo=ri(-6,5),hi=ri(lo+1,lo+7),lc=random()<.5,hc=random()<.5;let m,p;
  if(d<1){m=1;p=nz(-9,9)}else if(d<2){m=ri(2,5);p=0}else if(d<3){m=ri(2,4);p=nz(-9,9)}else{m=-ri(1,4);p=ri(-9,9)}
  const A=m*lo+p,B=m*hi+p,S=m>0?[I(A,lc,B,hc)]:[I(B,hc,A,lc)],e=lin(m,p);
  return{type:'iv',truth:y=>{const x=(y-p)/m;return(lc?x>=lo:x>lo)&&(hc?x<=hi:x<hi)},html:`On sait que ${big(`${M(lo)} ${lc?'≤':'&lt;'} x ${hc?'≤':'&lt;'} ${M(hi)}`)}À quel intervalle appartient <b>${e}</b> ?`,check:ivCheck(S),
    hint:`Applique les mêmes opérations aux <b>trois</b> membres de l'encadrement${m<0?`. Multiplier par ${M(m)} (négatif) <b>retourne</b> les inégalités : la plus petite borne devient la plus grande.`:'.'}`,
    solution:`${m!==1?`On multiplie par ${M(m)}${m<0?' (négatif : les inégalités changent de sens)':''}`:''}${m!==1&&p?', puis ':''}${p?`on ${p>0?'ajoute '+p:'soustrait '+(-p)}`:''} : ${m>0?`${M(A)} ${lc?'≤':'&lt;'} ${e} ${hc?'≤':'&lt;'} ${M(B)}`:`${M(B)} ${hc?'≤':'&lt;'} ${e} ${lc?'≤':'&lt;'} ${M(A)}`}. Donc ${e} ∈ <b>${fmtSet(S)}</b>`,
    visual:realLine([I(lo,lc,hi,hc)],[],{}),afterVisual:realLine(S)};
}
function C6(){return `<h2>6. Encadrements</h2>
<p class="intro">Si on sait où se trouve x, on peut en déduire où se trouve 2x − 3, ou −x + 1 : on transporte l'encadrement.</p>
<div class="def">Un <b>encadrement</b> est une double inégalité : 2 &lt; x ≤ 5.<br>On applique la même opération aux <b>trois membres</b>, avec les règles du niveau 3 :<br>• + ou − un nombre : rien ne change<br>• × ou ÷ un positif : rien ne change<br>• × ou ÷ un <b>négatif</b> : les inégalités changent de sens (on réécrit dans l'ordre croissant)</div>
<div class="methode"><b>Méthode</b><ol><li>Multiplie d'abord les trois membres par le coefficient de x.</li><li>Ajoute ou retire ensuite le nombre seul aux trois membres.</li><li>Si tu as multiplié par un négatif, <b>réécris dans l'ordre croissant</b> : chaque crochet suit sa borne.</li></ol></div>
<div class="ex"><span class="q">Exemple 1 :</span><br>2 &lt; x ≤ 5 &nbsp;⇒&nbsp; 4 &lt; 2x ≤ 10 &nbsp;⇒&nbsp; 1 &lt; 2x − 3 ≤ 7 : <b>2x − 3 ∈ ]1 ; 7]</b></div>
${realLine([I(2,0,5,1)],[{x:2,c:'#5f3dc4'},{x:5,c:'#5f3dc4'}])}
<div class="ex"><span class="q">Exemple 2 : coefficient négatif</span><br>2 &lt; x ≤ 5 &nbsp;⇒&nbsp; −2 &gt; −x ≥ −5 (× (−1) : le sens change)<br>On réécrit dans l'ordre croissant : −5 ≤ −x &lt; −2, puis + 1 : −4 ≤ −x + 1 &lt; −1.<br><b>−x + 1 ∈ [−4 ; −1[</b> : le « ≤ » reste attaché à la borne qui vient de 5.</div>
${realLine([I(-4,1,-1,0)])}
<div class="warn">⚠️ Applique l'opération aux <b>trois</b> membres, pas seulement au milieu.<br>⚠️ Après une multiplication par un négatif, la plus petite borne devient la plus grande : n'oublie pas de remettre dans l'ordre, crochets compris.</div>
<div class="retenir">À retenir : mêmes opérations sur les trois membres ; × négatif → on retourne et on remet dans l'ordre.</div>`}

/* ---------- 7 ---------- */
function L7(d){
  const v=Math.min(3,ri(Math.max(0,d-1),d));
  if(v===0){const a=nz(-9,9),w=pick([0,1,1]);let b;do{b=nz(-9,9)}while(b===a); // pas « |−1 − 0| » ni « |1 − 1| »
    if(w===0){const n=nz(-12,12);return{type:'nums',html:`Calcule :${big(`|${M(n)}|`)}`,tpl:'{0}',check:numsCheck([Math.abs(n)]),hint:`|a| est la distance entre a et 0 : c'est a sans son signe.`,solution:`|${M(n)}| = <b>${Math.abs(n)}</b>`,afterVisual:realLine(null,[{x:0,l:'0'},{x:n,l:M(n)}],{arc:[0,n,String(Math.abs(n))]})}}
    return{type:'nums',html:`Calcule :${big(`|${M(a)} − ${P(b)}|`)}`,tpl:'{0}',check:numsCheck([Math.abs(a-b)]),hint:`Calcule d'abord l'intérieur ${M(a)} − ${P(b)}, puis prends la valeur absolue.`,
      solution:`${M(a)} − ${P(b)} = ${M(a-b)}, donc |${M(a-b)}| = <b>${Math.abs(a-b)}</b>`,afterVisual:''}}
  if(v===1){const a=ri(-8,8);let b;do{b=ri(-8,8)}while(b===a);
    return{type:'nums',html:`Sur une droite graduée, quelle est la distance entre les points d'abscisses ${M(a)} et ${M(b)} ?`,tpl:'d = {0}',check:numsCheck([Math.abs(a-b)]),
      hint:`La distance entre a et b est |a − b| (ou |b − a|, c'est pareil). Tu peux aussi compter les graduations.`,
      solution:`d = |${M(a)} − ${P(b)}| = |${M(a-b)}| = <b>${Math.abs(a-b)}</b>`,visual:realLine(null,[{x:a,l:M(a)},{x:b,l:M(b),c:'#5f3dc4'}]),afterVisual:realLine(null,[{x:a,l:M(a)},{x:b,l:M(b),c:'#5f3dc4'}],{arc:[a,b,String(Math.abs(a-b))]})}}
  const a=v===2?ri(-6,6):ri(-6,6),r=v===2?ri(1,7):pick([ri(1,7),ri(1,7),0,-ri(1,5)]),roots=r>0?[a-r,a+r]:r===0?[a]:[];
  return{type:'roots',truth:x=>Math.abs(x-a)===r,html:`Résous l'équation :${big(`|${xm(a)}| = ${M(r)}`)}`,check:rootsCheck(roots),
    hint:`|x − a| = r signifie : la distance entre x et ${M(a)} vaut r. On cherche les points situés à ${M(r)} de ${M(a)}, à gauche et à droite.${r<0?' Une distance peut-elle être négative ?':''}`,
    solution:r>0?`Les points à distance ${r} de ${M(a)} : <b>x = ${M(a-r)} ou x = ${M(a+r)}</b>`:r===0?`Distance nulle : <b>x = ${M(a)}</b>`:`Une valeur absolue est toujours ≥ 0 : <b>aucune solution</b>.`,
    visual:'',afterVisual:r>0?realLine(null,[{x:a,l:M(a),c:'#5f3dc4'},{x:a-r,l:M(a-r)},{x:a+r,l:M(a+r)}],{arc:[a,a+r,String(r)]}):plot({fs:[{f:x=>Math.abs(x-a),l:`y = |${xm(a)}|`}],xr:[a-7,a+7],h:{y:r,l:`y = ${M(r)}`}})};
}
function C7(){return `<h2>7. Valeur absolue et distance</h2>
<p class="intro">La valeur absolue mesure une <b>distance</b> sur la droite graduée. Cette idée permet de résoudre des équations presque sans calcul.</p>
<div class="def">La <b>valeur absolue</b> de a, notée |a|, est la <b>distance entre a et 0</b>.<br>|5| = 5, &nbsp; |−5| = 5, &nbsp; |0| = 0. &nbsp; Une valeur absolue est toujours ≥ 0.<br><b>|a − b| est la distance entre a et b</b> sur la droite graduée.</div>
${realLine(null,[{x:-2,l:'−2'},{x:5,l:'5',c:'#5f3dc4'}],{arc:[-2,5,'|5 − (−2)| = 7']})}
<div class="methode"><b>Méthode</b> pour |x − a| = r<ol><li>Lis : « la distance entre x et a vaut r ». Attention : |x + 4| = |x − (−4)|, c'est la distance à <b>−4</b>.</li><li>Si r &gt; 0 : deux solutions, <b>a − r</b> et <b>a + r</b> (à gauche et à droite de a).</li><li>Si r = 0 : une seule solution, x = a. Si r &lt; 0 : <b>aucune</b> solution.</li></ol></div>
<div class="ex"><span class="q">Exemple 1 : calculer</span><br>|−8| = 8 ; |3 − 10| = |−7| = 7 : la distance entre 3 et 10 vaut 7.</div>
<div class="ex"><span class="q">Exemple 2 : résoudre</span><br>|x − 3| = 2 : les points à distance 2 de 3 → <b>x = 1 ou x = 5</b>.<br>|x + 4| = 1 : distance à −4 égale à 1 → x = −5 ou x = −3.<br>|x − 1| = −3 : <b>aucune solution</b>.</div>${realLine(null,[{x:3,l:'3',c:'#5f3dc4'},{x:1,l:'1'},{x:5,l:'5'}],{arc:[3,5,'2']})}
<div class="warn">⚠️ |x − 3| = 2 a <b>deux</b> solutions : n'oublie pas celle de gauche.<br>⚠️ Dans |x + 4|, le centre est −4, pas 4.<br>⚠️ Une distance n'est jamais négative : |…| = −3 est impossible.</div>
<div class="retenir">À retenir : |x − a| = distance entre x et a.</div>`}

/* ---------- 8 ---------- */
function L8(d){
  const a=d<1?0:ri(-6,6);let r=ri(1,6),rel=d<2?pick(['lt','le']):rr(),S;
  if(d>=3&&random()<.25){r=pick([0,-ri(1,4)]);if(r===0)rel=pick(['lt','ge','gt'])}
  if(r<0)S=(rel==='lt'||rel==='le')?[]:R_;
  else if(r===0)S=rel==='lt'?[]:rel==='ge'?R_:[I(-INF,0,a,0),I(a,0,INF,0)];
  else S=(rel==='lt'||rel==='le')?[I(a-r,rel==='le',a+r,rel==='le')]:[I(-INF,0,a-r,rel==='ge'),I(a+r,rel==='ge',INF,0)];
  const inside=rel==='lt'||rel==='le';
  return{type:'iv',truth:x=>CMP[rel](Math.abs(x-a),r),html:`Résous :${big(`|${xm(a)}| ${REL[rel]} ${M(r)}`)}`,check:ivCheck(S),
    hint:r<0||r===0?`Une valeur absolue est toujours ≥ 0. Que peut-on dire de |${xm(a)}| ${REL[rel]} ${M(r)} ?`:`Lis : « la distance entre x et ${M(a)} est ${inside?'inférieure':'supérieure'} à ${r} ». Place ${M(a)} et les points ${M(a-r)} et ${M(a+r)} sur la droite.${inside?' Les solutions sont <b>entre</b> ces deux points.':' Les solutions sont <b>à l\'extérieur</b>.'}`,
    solution:r>0?`Distance de x à ${M(a)} ${inside?'au plus':'au moins'} ${r} (${rel==='lt'||rel==='gt'?'strictement':'au sens large'}) : <b>${fmtSet(S)}</b>`:`Une valeur absolue est toujours ≥ 0, donc : <b>${fmtSet(S)}</b>`,
    visual:'',afterVisual:realLine(S,[{x:a,l:M(a),c:'#5f3dc4'}])+(r>0?plot({fs:[{f:x=>Math.abs(x-a),l:`y = |${xm(a)}|`}],xr:[a-r-4,a+r+4],h:{y:r,l:`y = ${r}`},xset:S}):'')};
}
function C8(){return `<h2>8. Inéquations avec valeur absolue</h2>
<p class="intro">Avec l'idée de distance, |x − a| ≤ r se lit « x est proche de a », et |x − a| ≥ r « x est loin de a ».</p>
<div class="def">Pour r &gt; 0 :<br>|x − a| ≤ r : « x est à distance <b>au plus</b> r de a » → x ∈ <b>[a − r ; a + r]</b> (entre)<br>|x − a| ≥ r : « x est à distance <b>au moins</b> r de a » → x ∈ <b>]−∞ ; a − r] ∪ [a + r ; +∞[</b> (à l'extérieur)<br>Avec &lt; ou &gt;, les bornes sont exclues.</div>
<div class="methode"><b>Méthode</b><ol><li>Trouve le centre a (attention : |x + 1| → a = −1) et le rayon r.</li><li>Place a − r et a + r sur la droite.</li><li>≤ ou &lt; → solutions <b>entre</b> ; ≥ ou &gt; → solutions <b>à l'extérieur</b>.</li><li>Choisis les crochets : ≤, ≥ → fermés ; &lt;, &gt; → ouverts.</li></ol></div>
<div class="ex"><span class="q">Exemple 1 : entre</span><br>|x − 2| &lt; 3 : distance à 2 plus petite que 3 → <b>]−1 ; 5[</b></div>${realLine([I(-1,0,5,0)],[{x:2,l:'2',c:'#5f3dc4'}])}
<div class="ex"><span class="q">Exemple 2 : à l'extérieur</span><br>|x + 1| ≥ 2 : distance à −1 au moins 2 → <b>]−∞ ; −3] ∪ [1 ; +∞[</b></div>${realLine([I(-INF,0,-3,1),I(1,1,INF,0)],[{x:-1,l:'−1',c:'#5f3dc4'}])}
<p>Graphiquement : on cherche où la courbe en V de y = |x − a| est sous (ou au-dessus de) la droite y = r.</p>${plot({fs:[{f:x=>Math.abs(x-2),l:'y = |x − 2|'}],xr:[-4,8],h:{y:3,l:'y = 3'},xset:[I(-1,0,5,0)]})}
<div class="warn">⚠️ Cas particuliers : |x − 4| &lt; −1 : aucune solution (∅) ; |x − 4| ≥ −1 : toujours vrai (ℝ) ; |x − 4| &gt; 0 : tout sauf 4.<br>⚠️ « Au moins » donne <b>deux</b> intervalles, reliés par ∪.</div>
<div class="retenir">À retenir : |x − a| ≤ r → entre a − r et a + r ; |x − a| ≥ r → à l'extérieur.</div>`}

/* ---------- 9 ---------- */
function sqImg(lo,lc,hi,hc){
  if(lo>=0)return I(lo*lo,lc,hi*hi,hc);
  if(hi<=0)return I(hi*hi,hc,lo*lo,lc);
  const top=Math.max(-lo,hi),tc=(-lo===hi)?(lc||hc):(-lo>hi?lc:hc);return I(0,1,top*top,tc);
}
function L9(d){
  if(d>=1&&random()<.3){const neg=random()<.5;let a=ri(1,6),b=ri(a+1,9);
    if(neg){const[A,B]=[-b,-a];return{type:'cmp',html:`On sait que <b>${M(A)} ≤ a &lt; b ≤ ${M(B)}</b> (a et b négatifs).<br>Compare a<sup>2</sup> et b<sup>2</sup>.`,check:choiceCheck('>'),
      hint:`Pour des nombres <b>négatifs</b>, la fonction carré est <b>décroissante</b> : plus on est loin de 0, plus le carré est grand. Teste avec a = −3, b = −2.`,solution:`Sur les négatifs, x ↦ x<sup>2</sup> est décroissante : a &lt; b ⇒ a<sup>2</sup> <b>&gt;</b> b<sup>2</sup>. (Ex : −3 &lt; −2 mais 9 &gt; 4.)`,afterVisual:plot({fs:[{f:x=>x*x,l:'y = x²'}],xr:[-5,5],yr:[-1,20]})}}
    return{type:'cmp',html:`On sait que <b>0 ≤ a &lt; b</b>.<br>Compare a<sup>2</sup> et b<sup>2</sup>.`,check:choiceCheck('<'),hint:`Pour des nombres <b>positifs</b>, la fonction carré est croissante. Teste avec a = 2, b = 3.`,solution:`Sur les positifs, x ↦ x<sup>2</sup> est croissante : a &lt; b ⇒ a<sup>2</sup> <b>&lt;</b> b<sup>2</sup>.`,afterVisual:plot({fs:[{f:x=>x*x,l:'y = x²'}],xr:[-5,5],yr:[-1,20]})}}
  const v=Math.min(2,d);let lo,hi;
  if(v===0){lo=ri(0,5);hi=ri(lo+1,8)}else if(v===1){hi=-ri(0,4);lo=hi-ri(1,5)}else{lo=-ri(1,6);hi=ri(1,6)}
  if(d>=3){const w=ri(0,2);if(w===0){lo=ri(0,5);hi=ri(lo+1,8)}else if(w===1){hi=-ri(0,4);lo=hi-ri(1,5)}else{lo=-ri(1,6);hi=ri(1,6)}}
  const lc=random()<.5,hc=random()<.5,S=[sqImg(lo,lc,hi,hc)];
  return{type:'iv',truth:y=>{if(y<0)return false;const u=Math.sqrt(y),In=x=>(lc?x>=lo:x>lo)&&(hc?x<=hi:x<hi);return In(u)||In(-u)},html:`On sait que x ∈ ${fmtSet([I(lo,lc,hi,hc)])}.<br>À quel intervalle appartient <b>x<sup>2</sup></b> ?`,check:ivCheck(S),
    hint:lo>=0?`Les nombres sont positifs : la fonction carré est <b>croissante</b>, on élève les bornes au carré dans le même ordre.`:hi<=0?`Les nombres sont négatifs : la fonction carré est <b>décroissante</b>, l'ordre s'inverse (et les crochets suivent leur borne).`:`L'intervalle contient 0 ! Le plus petit carré est 0 (atteint en x = 0). Le plus grand vient de la borne la plus éloignée de 0.`,
    solution:lo>=0?`Croissante sur les positifs : x<sup>2</sup> ∈ <b>${fmtSet(S)}</b>`:hi<=0?`Décroissante sur les négatifs : ${M(lo)}<sup>2</sup> = ${lo*lo} et ${M(hi)}<sup>2</sup> = ${hi*hi}, l'ordre s'inverse : x<sup>2</sup> ∈ <b>${fmtSet(S)}</b>`:`0 est dans l'intervalle, donc le minimum de x<sup>2</sup> est 0. Le maximum vient de ${Math.abs(lo)>=hi?M(lo):M(hi)} : x<sup>2</sup> ∈ <b>${fmtSet(S)}</b>`,
    visual:realLine([I(lo,lc,hi,hc)]),afterVisual:plot({fs:[{f:x=>x*x,l:'y = x²'}],xr:[Math.min(lo,-1)-2,Math.max(hi,1)+2],yr:[-2,Math.max(lo*lo,hi*hi)+3],seg:[lo,hi,0]})};
}
function C9(){return `<h2>9. Carrés et inégalités</h2>
<p class="intro">Élever au carré ne garde pas toujours l'ordre : tout dépend du <b>signe</b> des nombres. La courbe de x ↦ x<sup>2</sup> permet de le voir.</p>
<div class="def">• Sur les <b>positifs</b>, la fonction carré est <b>croissante</b> : 0 ≤ a &lt; b ⇒ a<sup>2</sup> &lt; b<sup>2</sup>.<br>• Sur les <b>négatifs</b>, elle est <b>décroissante</b> : a &lt; b ≤ 0 ⇒ a<sup>2</sup> &gt; b<sup>2</sup>.</div>
${plot({fs:[{f:x=>x*x,l:'y = x²'}],xr:[-5,5],yr:[-1,20],seg:[-4,-2,0]})}
<div class="methode"><b>Méthode</b> pour trouver où est x<sup>2</sup><ol><li>Regarde le signe des nombres de l'intervalle de x.</li><li>Tous positifs : élève les bornes au carré, <b>dans le même ordre</b>.</li><li>Tous négatifs : élève au carré et <b>inverse l'ordre</b> (chaque crochet suit sa borne).</li><li>L'intervalle contient 0 : le minimum de x<sup>2</sup> est <b>0</b> (compris) ; le maximum vient de la borne la plus <b>loin</b> de 0.</li></ol></div>
<div class="ex"><span class="q">Exemple 1 : positifs</span><br>2 &lt; x ≤ 4 ⇒ 4 &lt; x<sup>2</sup> ≤ 16 : <b>x<sup>2</sup> ∈ ]4 ; 16]</b>.</div>
<div class="ex"><span class="q">Exemple 2 : négatifs, puis intervalle contenant 0</span><br>−4 ≤ x &lt; −2 ⇒ 4 &lt; x<sup>2</sup> ≤ 16 (l'ordre s'inverse ; −4 donne 16, compris) : la partie orange de la courbe.<br>−3 &lt; x ≤ 2 ⇒ <b>0 ≤ x<sup>2</sup> &lt; 9</b> (minimum 0 en x = 0 ; −3 est plus loin de 0 que 2, donc le maximum vient de (−3)<sup>2</sup> = 9, exclu comme −3).</div>
<div class="warn">⚠️ On ne peut <b>pas</b> « élever au carré » une inégalité sans regarder les signes : −5 &lt; 2 mais 25 &gt; 4 !<br>⚠️ Si l'intervalle contient 0, ne prends pas les carrés des bornes comme bornes : le plus petit carré est 0.</div>
<div class="retenir">À retenir : carré croissant sur les positifs, décroissant sur les négatifs.</div>`}

/* ---------- 10 ---------- */
function L10(d){
  const n=ri(1,8),k=n*n;let rel=rr(),a=0,html,S,c=0;
  if(d>=1&&random()<.25){const m=-ri(1,9);const ch=pick([['lt',[]],['le',[]],['gt',R_],['ge',R_]]);rel=ch[0];S=ch[1];
    return{type:'iv',truth:x=>CMP[rel](x*x,m),html:`Résous :${big(`x<sup>2</sup> ${REL[rel]} ${M(m)}`)}`,check:ivCheck(S),hint:`Un carré est toujours ≥ 0. Peut-il être ${REL[rel]} ${M(m)} ?`,
      solution:`x<sup>2</sup> ≥ 0 &gt; ${M(m)} pour tout x : <b>${fmtSet(S)}</b>`,afterVisual:plot({fs:[{f:x=>x*x,l:'y = x²'}],xr:[-5,5],yr:[m-2,12],h:{y:m,l:`y = ${M(m)}`},xset:S})}}
  if(d>=2)a=nz(-5,5);if(d>=3&&random()<.6)c=nz(-6,6);
  const inside=rel==='lt'||rel==='le',cl=rel==='le'||rel==='ge';
  S=inside?[I(a-n,cl,a+n,cl)]:[I(-INF,0,a-n,cl),I(a+n,cl,INF,0)];
  const sq=a?`(${xm(a)})<sup>2</sup>`:'x<sup>2</sup>';
  html=c?`${sq} ${c>0?'+ '+c:'− '+(-c)} ${REL[rel]} ${M(k+c)}`:`${sq} ${REL[rel]} ${k}`;
  return{type:'iv',truth:x=>CMP[rel]((x-a)**2+c,k+c),html:`Résous :${big(html)}`,check:ivCheck(S),
    hint:`${c?`Isole d'abord le carré : ${sq} ${REL[rel]} ${k}. `:''}Rappel : X<sup>2</sup> ${REL[rel]} ${k} ⇔ |X| ${REL[rel]} ${n} (car √${k} = ${n}). C'est une inéquation avec valeur absolue (niveau 8) !`,
    solution:`${c?`${sq} ${REL[rel]} ${k} ⇔ `:''}|${a?xm(a):'x'}| ${REL[rel]} ${n} ⇔ x ∈ <b>${fmtSet(S)}</b>`,
    afterVisual:realLine(S,a?[{x:a,l:M(a),c:'#5f3dc4'}]:[])+plot({fs:[{f:x=>(x-a)**2,l:a?'':'y = x²'}],xr:[a-n-3,a+n+3],yr:[-2,k+6],h:{y:k,l:`y = ${k}`},xset:S})};
}
function C10(){return `<h2>10. Inéquations avec des carrés</h2>
<p class="intro">Une inéquation comme x<sup>2</sup> &lt; 9 se ramène à une inéquation avec valeur absolue : on réutilise le niveau 8.</p>
<div class="def">Pour k &gt; 0 : &nbsp; x<sup>2</sup> &lt; k ⇔ |x| &lt; √k ⇔ <b>−√k &lt; x &lt; √k</b><br>x<sup>2</sup> &gt; k ⇔ |x| &gt; √k ⇔ <b>x &lt; −√k ou x &gt; √k</b><br>Même chose avec ≤ et ≥ (bornes comprises).</div>
<div class="methode"><b>Méthode</b><ol><li>Isole le carré : (x − a)<sup>2</sup> ≤ k (enlève d'abord le nombre ajouté).</li><li>Si k &lt; 0 : un carré est toujours ≥ 0, la réponse est ∅ ou ℝ.</li><li>Sinon, remplace par |x − a| ≤ √k et résous comme au niveau 8 : entre ou à l'extérieur.</li></ol></div>
<div class="ex"><span class="q">Exemple 1 :</span><br>x<sup>2</sup> ≤ 9 ⇔ |x| ≤ 3 → <b>[−3 ; 3]</b> (la parabole est sous la droite y = 9).<br>x<sup>2</sup> &gt; 16 ⇔ |x| &gt; 4 → <b>]−∞ ; −4[ ∪ ]4 ; +∞[</b></div>
${plot({fs:[{f:x=>x*x,l:'y = x²'}],xr:[-5,5],yr:[-1,14],h:{y:9,l:'y = 9'},xset:[I(-3,1,3,1)]})}
<div class="ex"><span class="q">Exemple 2 : carré décalé</span><br>(x − 1)<sup>2</sup> + 3 &lt; 7 ⇔ (x − 1)<sup>2</sup> &lt; 4 ⇔ |x − 1| &lt; 2 ⇔ <b>x ∈ ]−1 ; 3[</b><br>x<sup>2</sup> &lt; −2 : <b>∅</b> &nbsp;&nbsp; x<sup>2</sup> &gt; −2 : <b>ℝ</b> (un carré est toujours ≥ 0).</div>
<div class="warn">⚠️ Erreur fréquente : x<sup>2</sup> &lt; 9 ⇔ x &lt; 3 est <b>faux</b> ! x = −10 vérifie x &lt; 3 mais (−10)<sup>2</sup> = 100.<br>⚠️ x<sup>2</sup> &gt; 16 donne <b>deux</b> intervalles, pas seulement x &gt; 4.</div>
<div class="retenir">À retenir : X<sup>2</sup> &lt; k ⇔ |X| &lt; √k : on se ramène aux distances.</div>`}

/* ---------- 11 ---------- */
function prodSet(sg,r1,r2,rel){ // signe de sg(x-r1)(x-r2), r1<r2
  const cl=rel==='le'||rel==='ge',wantNeg=rel==='lt'||rel==='le',inside=(sg>0)===wantNeg;
  return inside?[I(r1,cl,r2,cl)]:[I(-INF,0,r1,cl),I(r2,cl,INF,0)];
}
function L11(d){
  let r1=ri(-6,5),r2;do{r2=ri(-5,6)}while(r2===r1);if(r1>r2)[r1,r2]=[r2,r1];
  const rel=rr();let sg=1,expr;const v=Math.min(3,ri(Math.max(0,d-1),d));
  const f=r=>r===0?'x':`(${xm(r)})`;let T=x=>CMP[rel]((x-r1)*(x-r2),0);
  if(v===0)expr=`${f(r1)}${f(r2)}`;
  else if(v===1){r1=0;r2=nz(-7,7);if(r1>r2)[r1,r2]=[r2,r1];expr=random()<.5?`${f(r1)}${f(r2)}`:`${f(r2)}${f(r1)}`}
  else if(v===2){if(random()<.5){const n=ri(1,9);r1=-n;r2=n;expr=`x<sup>2</sup> − ${n*n}`;T=x=>CMP[rel](x*x-n*n,0)}else{const k=nz(-7,7);r1=Math.min(0,k);r2=Math.max(0,k);
    return mk(`x<sup>2</sup> ${REL[rel]} ${lin(k,0)}`,`On passe tout à gauche et on factorise : ${terms([[1,'x<sup>2</sup>'],[-k,'x']])} = x(${xm(k)}).`,1,r1,r2,`x(${xm(k)}) ${REL[rel]} 0`,x=>CMP[rel](x*x,k*x))}}
  else{sg=-1;T=x=>CMP[rel]((r1-x)*(x-r2),0);expr=`(${r1<0?M(r1)+' − x':r1+' − x'})${f(r2)}`;expr=`(${r1===0?'−x':M(r1)+' − x'})${f(r2)}`}
  return mk(`${expr} ${REL[rel]} 0`,v===2?`x<sup>2</sup> − ${r2*r2} = (x − ${r2})(x + ${r2}) (identité remarquable).`:sg<0?`Attention : (${M(r1)} − x) est positif <b>avant</b> ${M(r1)} et négatif après.`:'',sg,r1,r2,null,T);
  function mk(html,extra,sg,r1,r2,fact,T){const S=prodSet(sg,r1,r2,rel);
    return{type:'iv',truth:T,html:`Résous :${big(html)}`,check:ivCheck(S),
      hint:`${extra} Fais un tableau de signes : les facteurs s'annulent en ${M(r1)} et ${M(r2)}. Le produit change de signe en ces valeurs. Teste une valeur dans chaque zone (par ex. x = ${M(r2+1)}).`,
      solution:`${fact?fact+'. ':''}Racines ${M(r1)} et ${M(r2)}. Le produit est ${sg>0?'positif':'négatif'} à l'extérieur des racines et ${sg>0?'négatif':'positif'} entre elles. Solutions : <b>${fmtSet(S)}</b>`,
      afterVisual:realLine(S,[{x:r1,c:'#e03131'},{x:r2,c:'#e03131'}])+plot({fs:[{f:x=>sg*(x-r1)*(x-r2),l:'y = produit'}],xr:[r1-3,r2+3],xset:S})}}
}
function C11(){return `<h2>11. Inéquations produits</h2>
<p class="intro">Pour savoir quand un produit est positif ou négatif, on étudie le signe de chaque facteur dans un <b>tableau de signes</b>.</p>
<div class="def">Règle des signes : (+) × (+) = (+), (−) × (−) = (+), (+) × (−) = (−).<br>Un facteur x − a est <b>négatif avant a</b>, nul en a, <b>positif après a</b>.</div>
<div class="methode"><b>Méthode</b><ol><li>Mets tout d'un côté (0 de l'autre) et <b>factorise</b> si besoin.</li><li>Trouve la valeur qui annule chaque facteur ; range-les dans l'ordre.</li><li>Remplis le tableau : signe de chaque facteur, puis règle des signes.</li><li>Lis les intervalles qui conviennent (crochets fermés pour ≤, ≥).</li></ol></div>
<table class="st"><tr><td>x</td><td class="e">−∞</td><td class="e"></td><td>−2</td><td class="e"></td><td>3</td><td class="e"></td><td class="e">+∞</td></tr>
<tr><td>x + 2</td><td class="e"></td><td class="e">−</td><td>0</td><td class="e">+</td><td></td><td class="e">+</td><td class="e"></td></tr>
<tr><td>x − 3</td><td class="e"></td><td class="e">−</td><td></td><td class="e">−</td><td>0</td><td class="e">+</td><td class="e"></td></tr>
<tr><td><b>produit</b></td><td class="e"></td><td class="e"><b>+</b></td><td>0</td><td class="e"><b>−</b></td><td>0</td><td class="e"><b>+</b></td><td class="e"></td></tr></table>
<div class="ex"><span class="q">Exemple 1 :</span><br>(x + 2)(x − 3) &lt; 0 → <b>]−2 ; 3[</b> &nbsp;&nbsp; (x + 2)(x − 3) ≥ 0 → <b>]−∞ ; −2] ∪ [3 ; +∞[</b></div>
${plot({fs:[{f:x=>(x+2)*(x-3),l:'y = (x+2)(x−3)'}],xr:[-5,6],xset:[I(-2,0,3,0)]})}
<div class="ex"><span class="q">Exemple 2 : factoriser d'abord</span><br>x<sup>2</sup> − 9 &gt; 0 ⇔ (x − 3)(x + 3) &gt; 0 → ]−∞ ; −3[ ∪ ]3 ; +∞[<br>x<sup>2</sup> ≤ 5x ⇔ x<sup>2</sup> − 5x ≤ 0 ⇔ x(x − 5) ≤ 0 → <b>[0 ; 5]</b><br>(2 − x)(x + 1) &gt; 0 : 2 − x est <b>positif avant 2</b> → ]−1 ; 2[</div>
<div class="warn">⚠️ Ne divise jamais par x : x<sup>2</sup> ≤ 5x ⇏ x ≤ 5 (x pourrait être négatif !).<br>⚠️ (2 − x) est <b>positif avant 2</b> et négatif après : c'est le contraire de (x − 2).</div>
<div class="retenir">À retenir : on cherche le signe de chaque facteur, puis la règle des signes donne celui du produit.</div>`}

/* ---------- 12 ---------- */
function L12(d){
  const v=ri(0,Math.min(3,d+1)),rel=rr(),inside=rel==='lt'||rel==='le',cl=rel==='le'||rel==='ge';
  if(v===0){const lo=ri(-6,3),hi=ri(lo+1,lo+7),p=lo+hi,r=hi-lo;
    const S=inside?[I(lo,cl,hi,cl)]:[I(-INF,0,lo,cl),I(hi,cl,INF,0)];
    return{type:'iv',truth:x=>CMP[rel](Math.abs(2*x-p),r),html:`Résous :${big(`|2x ${p<0?'+ '+(-p):p?'− '+p:''}| ${REL[rel]} ${r}`)}`,check:ivCheck(S),
      hint:`Pose X = 2x ${p<0?'+ '+(-p):p?'− '+p:''} : |X| ${REL[rel]} ${r} ⇔ ${inside?`−${r} ${REL[rel]} X ${REL[rel]} ${r}`:`X ${REL[FLIP[rel]]} −${r} ou X ${REL[rel]} ${r}`}. Puis résous en x (encadrement).`,
      solution:inside?`−${r} ${REL[rel]} 2x ${p<0?'+ '+(-p):p?'− '+p:''} ${REL[rel]} ${r} ⇔ ${M(p-r)} ${REL[rel]} 2x ${REL[rel]} ${M(p+r)} ⇔ ${M(lo)} ${REL[rel]} x ${REL[rel]} ${M(hi)} → <b>${fmtSet(S)}</b>`:`2x ${p<0?'+ '+(-p):p?'− '+p:''} ${REL[FLIP[rel]]} −${r} ou 2x ${p<0?'+ '+(-p):p?'− '+p:''} ${REL[rel]} ${r} ⇔ x ${REL[FLIP[rel]]} ${M(lo)} ou x ${REL[rel]} ${M(hi)} → <b>${fmtSet(S)}</b>`,
      afterVisual:realLine(S)+plot({fs:[{f:x=>Math.abs(2*x-p),l:'y = |2x − …|'}],xr:[lo-3,hi+3],h:{y:r,l:`y = ${r}`},xset:S})}}
  if(v===1||v===2){let a=ri(-7,5),b;do{b=ri(a+2,a+10)}while((a+b)%2);const m=(a+b)/2;
    // |x-a| rel |x-b| : plus proche de a <=> x < m
    const S=inside?relSet(rel==='lt'?'lt':'le',m):relSet(rel==='gt'?'gt':'ge',m);
    const e=v===1?`|${xm(a)}| ${REL[rel]} |${xm(b)}|`:`(${xm(a)})<sup>2</sup> ${REL[rel]} (${xm(b)})<sup>2</sup>`;
    return{type:'iv',truth:x=>v===1?CMP[rel](Math.abs(x-a),Math.abs(x-b)):CMP[rel]((x-a)**2,(x-b)**2),html:`Résous :${big(e)}`,check:ivCheck(S),
      hint:v===1?`|x − ${M(a)}| est la distance de x à ${M(a)}, |x − ${M(b)}| la distance à ${M(b)}. Pour quels x est-on ${inside?'plus proche':'plus loin'} de ${M(a)} que de ${M(b)} ? Pense au milieu de ${M(a)} et ${M(b)}.`
        :`Développe les deux carrés : les x<sup>2</sup> s'éliminent et il reste une inéquation du 1<sup>er</sup> degré. (Ou : X<sup>2</sup> &lt; Y<sup>2</sup> ⇔ |X| &lt; |Y|.)`,
      solution:v===1?`On compare les distances de x à ${M(a)} et à ${M(b)}. Le point à égale distance est le milieu ${M(m)}. ${inside?'Plus proche':'Plus loin'} de ${M(a)} : <b>${fmtSet(S)}</b>`
        :`x<sup>2</sup> ${dm(-2*a)} ${Math.abs(2*a)}x + ${a*a} ${REL[rel]} x<sup>2</sup> ${dm(-2*b)} ${Math.abs(2*b)}x + ${b*b} ⇔ ${M(2*b-2*a)}x ${REL[rel]} ${M(b*b-a*a)} ⇔ x ${REL[rel]} ${M(m)} → <b>${fmtSet(S)}</b>`,
      afterVisual:realLine(S,[{x:a,l:M(a),c:'#5f3dc4'},{x:b,l:M(b),c:'#e8590c'}])+plot({fs:[{f:x=>v===1?Math.abs(x-a):(x-a)**2,c:'#5f3dc4'},{f:x=>v===1?Math.abs(x-b):(x-b)**2,c:'#e8590c'}],xr:[a-3,b+3],yr:v===1?undefined:[-2,(b-a+3)**2/2],xset:S})}}
  const a=ri(-5,5),p=ri(1,3),q=ri(p+1,p+4),r1=pick(['lt','le']),r2=pick(['lt','le']),c1=r1==='le',c2=r2==='le';
  const S=[I(a-q,c2,a-p,c1),I(a+p,c1,a+q,c2)];
  return{type:'iv',truth:x=>CMP[r1](p,Math.abs(x-a))&&CMP[r2](Math.abs(x-a),q),html:`Résous :${big(`${p} ${REL[r1]} |${xm(a)}| ${REL[r2]} ${q}`)}<span class="note">Il y a deux intervalles.</span>`,check:ivCheck(S),
    hint:`La distance de x à ${M(a)} doit être entre ${p} et ${q}. Place ${M(a)} sur la droite : il y a une zone à gauche et une zone à droite.`,
    solution:`Distance à ${M(a)} entre ${p} et ${q} : à gauche [${M(a-q)} ; ${M(a-p)}], à droite [${M(a+p)} ; ${M(a+q)}] (crochets selon &lt; ou ≤) → <b>${fmtSet(S)}</b>`,
    afterVisual:realLine(S,[{x:a,l:M(a),c:'#5f3dc4'}])+plot({fs:[{f:x=>Math.abs(x-a),l:`y = |${xm(a)}|`}],xr:[a-q-2,a+q+2],h:{y:q,l:`y = ${q}`},xset:S})};
}
function C12(){return `<h2>12. Défis</h2>
<p class="intro">On combine tout ce qui précède. L'astuce est souvent de <b>reconnaître</b> à quel niveau on se ramène.</p>
<div class="def">• |X| ≤ r ⇔ −r ≤ X ≤ r &nbsp;&nbsp; • |X| ≥ r ⇔ X ≤ −r ou X ≥ r<br>• |x − a| &lt; |x − b| : x est plus <b>proche</b> de a que de b → on coupe au <b>milieu</b> de a et b.<br>• X<sup>2</sup> &lt; Y<sup>2</sup> ⇔ |X| &lt; |Y|.</div>
<div class="methode"><b>Méthode</b><ol><li>|2x − 3| ≤ 5 : écris l'encadrement −5 ≤ 2x − 3 ≤ 5, puis résous-le (niveau 6).</li><li>Deux valeurs absolues : pense aux distances et au milieu.</li><li>Deux carrés : développe, les x<sup>2</sup> s'éliminent.</li><li>p &lt; |x − a| &lt; q : une zone à gauche de a et une à droite.</li></ol></div>
<div class="ex"><span class="q">Exemple 1 : |2x − 3| ≤ 5</span><br>⇔ −5 ≤ 2x − 3 ≤ 5 ⇔ −2 ≤ 2x ≤ 8 ⇔ −1 ≤ x ≤ 4 → <b>[−1 ; 4]</b></div>
<div class="ex"><span class="q">Exemple 2 : |x − 1| &lt; |x − 5|</span><br>« x est plus proche de 1 que de 5 ». Le milieu est 3 → x &lt; 3 → <b>]−∞ ; 3[</b><br>Même réponse (au sens large) pour (x − 1)<sup>2</sup> ≤ (x − 5)<sup>2</sup> : x<sup>2</sup> − 2x + 1 ≤ x<sup>2</sup> − 10x + 25 ⇔ 8x ≤ 24 ⇔ x ≤ 3.</div>${realLine([I(-INF,0,3,0)],[{x:1,l:'1',c:'#5f3dc4'},{x:5,l:'5',c:'#e8590c'}])}
<div class="ex"><span class="q">Exemple 3 : 1 ≤ |x − 2| &lt; 3</span><br>Distance à 2 entre 1 (compris) et 3 (exclu) → <b>]−1 ; 1] ∪ [3 ; 5[</b></div>${realLine([I(-1,0,1,1),I(3,1,5,0)],[{x:2,l:'2',c:'#5f3dc4'}])}
<div class="warn">⚠️ Dans un encadrement, divise les <b>trois</b> membres par 2.<br>⚠️ Dans l'exemple 3, chaque crochet suit sa condition : « 1 ≤ |x − 2| » donne des crochets fermés en 1 et 3 (à distance 1 de 2), « |x − 2| &lt; 3 » des crochets ouverts en −1 et 5 (à distance 3 de 2).</div>
<div class="retenir">À retenir : valeur absolue = distance ; carrés → valeurs absolues ; encadrement → trois membres.</div>`}


export const LEVELS = LEVELS_;
export const OPTIONS = { need: 4 };

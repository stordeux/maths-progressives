// Fiche de synthèse : le triangle rectangle (4e – 2de).
// Contenu fixe (pas d'aléatoire). Les figures sont des SVG écrits à la main (coordonnées calculées ici).
// Convention de toute la fiche : ABC rectangle en B, donc [AC] est l'hypoténuse.

const HY = '#c2255c', ADJ = '#1864ab', OPP = '#2b8a3e', ANG = '#e8590c', GR = '#868e96', INK = '#1f2328', SUB = '#3d434d';
const FONT = 'font-family="system-ui,sans-serif"';

/** angle BAC dans le texte : chapeau dessiné sur les trois lettres (classe .ang de fiche.css) */
const ang = (a, v, b) => `<span class="ang">${a}${v}${b}</span>`;
/** même angle dans les figures SVG (pas de CSS possible) : sommet coiffé d'un accent circonflexe combinant */
const angS = (a, v, b) => `${a}${v}̂${b}`;
/** fraction écrite comme dans les cours (classe .frac de base.css) */
const fr = (n, d) => `<span class="frac"><span>${n}</span><span>${d}</span></span>`;

// --- petite géométrie pour placer les annotations -------------------------------------------------
const r1 = x => Math.round(x * 10) / 10;
const pt = P => `${r1(P[0])} ${r1(P[1])}`;
const unit = (P, Q) => { const dx = Q[0] - P[0], dy = Q[1] - P[1], l = Math.hypot(dx, dy); return [dx / l, dy / l]; };
const add = (P, u, k) => [P[0] + k * u[0], P[1] + k * u[1]];
/** arc de rayon r au sommet V, du côté de P vers le côté de Q */
function arc(V, P, Q, r, c = ANG) {
  const u = unit(V, P), w = unit(V, Q), s = add(V, u, r), e = add(V, w, r);
  const sweep = u[0] * w[1] - u[1] * w[0] > 0 ? 1 : 0;
  return `<path d="M${pt(s)} A${r} ${r} 0 0 ${sweep} ${pt(e)}" fill="none" stroke="${c}" stroke-width="2.5"/>`;
}
/** point sur la bissectrice de l'angle en V, à la distance k */
function bissec(V, P, Q, k) { const u = unit(V, P), w = unit(V, Q); return add(V, unit([0, 0], [u[0] + w[0], u[1] + w[1]]), k); }
/** petit carré de l'angle droit en V */
function droit(V, P, Q, s = 16) {
  const u = unit(V, P), w = unit(V, Q);
  return `<path d="M${pt(add(V, u, s))} L${pt(add(add(V, u, s), w, s))} L${pt(add(V, w, s))}" fill="none" stroke="${INK}" stroke-width="2"/>`;
}
/** texte parallèle au segment [PQ], décalé de off (vers la gauche du sens P → Q) */
function long(P, Q, off, t, attrs) {
  const u = unit(P, Q), n = [u[1], -u[0]], M = add([(P[0] + Q[0]) / 2, (P[1] + Q[1]) / 2], n, off);
  const deg = r1(Math.atan2(u[1], u[0]) * 180 / Math.PI);
  return `<text x="${r1(M[0])}" y="${r1(M[1])}" text-anchor="middle" transform="rotate(${deg} ${r1(M[0])} ${r1(M[1])})" ${attrs}>${t}</text>`;
}
const seg = (P, Q, c, w = 3, extra = '') => `<line x1="${P[0]}" y1="${P[1]}" x2="${Q[0]}" y2="${Q[1]}" stroke="${c}" stroke-width="${w}" stroke-linecap="round" ${extra}/>`;
const txt = (x, y, t, attrs = '') => `<text x="${x}" y="${y}" ${attrs}>${t}</text>`;
const BLOC = 'style="display:block;margin:10px auto"';

/** grande figure annotée : vocabulaire du triangle rectangle */
function figureVocabulaire() {
  const A = [60, 270], B = [420, 270], C = [420, 60];
  const lab = bissec(A, B, C, 72);
  return `<svg viewBox="0 0 640 330" ${BLOC} role="img" aria-label="Triangle ABC rectangle en B : l'hypoténuse AC est le côté le plus long, en face de l'angle droit ; pour l'angle BAC, AB est le côté adjacent et BC le côté opposé" ${FONT}>
<polygon points="${pt(A)} ${pt(B)} ${pt(C)}" fill="${HY}" fill-opacity=".06"/>
${seg(A, B, ADJ, 4)}${seg(B, C, OPP, 4)}${seg(A, C, HY, 5)}
${droit(B, A, C)}${arc(A, B, C, 46)}
${txt(r1(lab[0]), r1(lab[1] + 5), angS('B', 'A', 'C'), `text-anchor="middle" font-size="16" font-weight="700" fill="${ANG}"`)}
${txt(398, 260, 'angle droit', `text-anchor="end" font-size="14" fill="${INK}"`)}
${txt(44, 290, 'A', 'font-size="18" font-weight="700"')}${txt(428, 292, 'B', 'font-size="18" font-weight="700"')}${txt(428, 56, 'C', 'font-size="18" font-weight="700"')}
${long(A, C, 16, 'hypoténuse [AC]', `font-size="17" font-weight="700" fill="${HY}"`)}
${long(A, C, 38, 'côté le plus long, en face de l\'angle droit', `font-size="14" fill="${HY}"`)}
${txt(240, 296, `côté adjacent à ${angS('B', 'A', 'C')} : [AB]`, `text-anchor="middle" font-size="16" font-weight="700" fill="${ADJ}"`)}
${txt(240, 316, 'c\'est un côté de l\'angle droit', `text-anchor="middle" font-size="14" fill="${SUB}"`)}
${txt(436, 150, 'côté opposé', `font-size="16" font-weight="700" fill="${OPP}"`)}
${txt(436, 170, `à ${angS('B', 'A', 'C')} : [BC]`, `font-size="16" font-weight="700" fill="${OPP}"`)}
${txt(436, 194, 'c\'est l\'autre côté', `font-size="14" fill="${SUB}"`)}
${txt(436, 212, 'de l\'angle droit', `font-size="14" fill="${SUB}"`)}
</svg>`;
}

/** même triangle, petite taille : rôles des côtés pour l'angle en A ou en C */
function figureRoles(en) {
  const A = [30, 180], B = [250, 180], C = [250, 45];
  const enA = en === 'A';
  const V = enA ? A : C, P = B, Q = enA ? C : A;
  const lab = bissec(V, P, Q, enA ? 60 : 52);
  const nom = enA ? angS('B', 'A', 'C') : angS('B', 'C', 'A');
  const cAB = enA ? ADJ : OPP, cBC = enA ? OPP : ADJ;
  return `<svg viewBox="0 0 340 240" role="img" aria-label="Rôles des côtés pour l'angle ${enA ? 'en A' : 'en C'} : ${enA ? 'AB adjacent, BC opposé' : 'BC adjacent, AB opposé'}, AC hypoténuse" ${FONT}>
${seg(A, B, cAB, 4)}${seg(B, C, cBC, 4)}${seg(A, C, HY, 4)}${droit(B, A, C, 14)}${arc(V, P, Q, 34)}
${txt(r1(lab[0]), r1(lab[1] + 5), nom, `text-anchor="middle" font-size="15" font-weight="700" fill="${ANG}"`)}
${txt(16, 198, 'A', 'font-size="16" font-weight="700"')}${txt(258, 200, 'B', 'font-size="16" font-weight="700"')}${txt(258, 42, 'C', 'font-size="16" font-weight="700"')}
${txt(140, 202, enA ? 'adjacent' : 'opposé', `text-anchor="middle" font-size="15" font-weight="700" fill="${cAB}"`)}
${txt(262, 118, enA ? 'opposé' : 'adjacent', `font-size="15" font-weight="700" fill="${cBC}"`)}
${long(A, C, 12, 'hypoténuse', `font-size="15" font-weight="700" fill="${HY}"`)}
${txt(170, 230, `pour l'angle ${nom}`, `text-anchor="middle" font-size="15" fill="${SUB}"`)}
</svg>`;
}

/** preuve de Pythagore par découpage : carré de côté a + b = 4 triangles + carré c² */
function figurePreuve() {
  const a = 150, b = 80, L = a + b, x0 = 40, y0 = 22;
  const P1 = [x0 + a, y0], P2 = [x0 + L, y0 + a], P3 = [x0 + b, y0 + L], P4 = [x0, y0 + b];
  const tri = (S, U, W) => `<polygon points="${pt(S)} ${pt(U)} ${pt(W)}" fill="${ADJ}" fill-opacity=".16" stroke="${ADJ}" stroke-width="2"/>`;
  const t = (x, y, s, anchor = 'middle') => txt(x, y, s, `text-anchor="${anchor}" font-size="16"`);
  return `<svg viewBox="0 0 300 282" role="img" aria-label="Un carré de côté a plus b contient quatre triangles rectangles de côtés a et b, et un carré de côté c au milieu" ${FONT}>
${tri([x0, y0], P1, P4)}${tri([x0 + L, y0], P2, P1)}${tri([x0 + L, y0 + L], P3, P2)}${tri([x0, y0 + L], P4, P3)}
<polygon points="${pt(P1)} ${pt(P2)} ${pt(P3)} ${pt(P4)}" fill="${HY}" fill-opacity=".16" stroke="${HY}" stroke-width="2.5"/>
${txt(x0 + L / 2, y0 + L / 2 + 9, 'c²', `text-anchor="middle" font-size="26" font-weight="700" fill="${HY}"`)}
${txt(216, 104, 'c', `text-anchor="middle" font-size="17" font-weight="700" fill="${HY}"`)}
${t(x0 + a / 2, y0 - 6, 'a')}${t(x0 + a + b / 2, y0 - 6, 'b')}
${t(x0 + L + 8, y0 + a / 2 + 5, 'a', 'start')}${t(x0 + L + 8, y0 + a + b / 2 + 5, 'b', 'start')}
${t(x0 + b / 2, y0 + L + 20, 'b')}${t(x0 + b + a / 2, y0 + L + 20, 'a')}
${t(x0 - 14, y0 + b / 2 + 5, 'b')}${t(x0 - 14, y0 + b + a / 2 + 5, 'a')}
</svg>`;
}

/** le triangle rectangle est un demi-rectangle : le milieu de l'hypoténuse est le centre du cercle */
function figureCercle() {
  const A = [60, 185], B = [240, 185], C = [240, 65], D = [60, 65], O = [150, 125];
  const R = r1(Math.hypot(C[0] - A[0], C[1] - A[1]) / 2);
  return `<svg viewBox="0 0 300 250" role="img" aria-label="Triangle ABC rectangle en B inscrit dans un cercle de centre O, milieu de l'hypoténuse AC" ${FONT}>
<circle cx="${O[0]}" cy="${O[1]}" r="${R}" fill="none" stroke="${GR}" stroke-width="2"/>
<polyline points="${pt(A)} ${pt(D)} ${pt(C)}" fill="none" stroke="${GR}" stroke-width="1.5" stroke-dasharray="6 4"/>
${seg(B, D, GR, 1.5, 'stroke-dasharray="6 4"')}
${seg(A, B, INK, 3)}${seg(B, C, INK, 3)}${seg(A, C, HY, 4)}${droit(B, A, C, 14)}
${seg(O, B, ANG, 3.5)}
<circle cx="${O[0]}" cy="${O[1]}" r="4" fill="${INK}"/>
${txt(150, 150, 'O', 'text-anchor="middle" font-size="16" font-weight="700"')}
${txt(44, 202, 'A', 'font-size="16" font-weight="700"')}${txt(246, 204, 'B', 'font-size="16" font-weight="700"')}${txt(246, 60, 'C', 'font-size="16" font-weight="700"')}
${txt(44, 60, 'D', `font-size="15" fill="${GR}"`)}
${txt(206, 146, 'OB', `text-anchor="middle" font-size="15" font-weight="700" fill="${ANG}"`)}
</svg>`;
}

/** problème à deux étapes : ABC rectangle en B, D sur [BC] */
function figureDeuxEtapes() {
  const A = [50, 60], B = [50, 170], C = [314, 170], D = [127, 170];
  const lab = bissec(A, B, D, 56);
  return `<svg viewBox="0 0 360 205" style="display:block;margin:10px auto;max-width:440px" role="img" aria-label="Triangle ABC rectangle en B avec AB = 5 cm et AC = 13 cm ; D est sur le segment BC et l'angle BAD mesure 35 degrés ; on cherche CD" ${FONT}>
${seg(A, B, INK, 3)}${seg(B, C, INK, 3)}${seg(A, C, HY, 3)}${seg(A, D, ANG, 3)}
${droit(B, A, C, 14)}${arc(A, B, D, 36)}
${txt(r1(lab[0]), r1(lab[1] + 5), '35°', `text-anchor="middle" font-size="14" font-weight="700" fill="${ANG}"`)}
${txt(42, 122, '5 cm', 'text-anchor="end" font-size="15"')}
${long(A, C, 10, '13 cm', `font-size="15" fill="${HY}"`)}
${txt(50, 50, 'A', 'text-anchor="middle" font-size="16" font-weight="700"')}${txt(36, 190, 'B', 'font-size="16" font-weight="700"')}
${txt(322, 190, 'C', 'font-size="16" font-weight="700"')}${txt(127, 192, 'D', 'text-anchor="middle" font-size="16" font-weight="700"')}
${txt(220, 194, 'CD = ?', `text-anchor="middle" font-size="15" font-weight="700" fill="${ANG}"`)}
</svg>`;
}

/** arbre de décision : que cherches-tu, que connais-tu → quel outil */
function arbre() {
  const box = (x, y, w, h, c, lignes) => `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="10" fill="#fff" stroke="${c}" stroke-width="2"/>` +
    lignes.map(([t, dy, size, gras, coul]) => `<text x="${x + w / 2}" y="${y + dy}" text-anchor="middle" font-size="${size}"${gras ? ' font-weight="700"' : ''} fill="${coul || c}">${t}</text>`).join('');
  const l = (x1, y1, x2, y2) => `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${GR}" stroke-width="2"/>`;
  const feuille = (x, y, c, connu, outil, detail, w = 196) => box(x, y, w, 74, c, [[connu, 22, 14, false, SUB], [outil, 46, 16, true], [detail, 66, 14, false, SUB]]);
  const ou = x => txt(x, 256, 'ou', `text-anchor="middle" font-size="14" font-style="italic" fill="${GR}"`);
  return `<svg viewBox="0 0 640 380" ${BLOC} role="img" aria-label="Arbre de décision. Je cherche une longueur : avec deux côtés, Pythagore ; avec un côté et un angle, cosinus, sinus ou tangente. Je cherche un angle : avec l'autre angle aigu, 90 degrés moins cet angle ; avec deux côtés, cosinus, sinus ou tangente inverse. Je me demande s'il est rectangle : avec les trois longueurs, je compare le carré du plus long et la somme des carrés des deux autres ; égaux, il est rectangle (réciproque) ; différents, il ne l'est pas (contraposée)." ${FONT}>
${box(170, 6, 300, 52, INK, [['Qu\'est-ce que je cherche ?', 23, 16, true], ['et qu\'est-ce que je connais ?', 44, 14, false, SUB]])}
${l(320, 58, 110, 96)}${l(320, 58, 320, 96)}${l(320, 58, 530, 96)}
${box(12, 96, 196, 40, ADJ, [['UNE LONGUEUR', 26, 15, true]])}
${box(222, 96, 196, 40, ANG, [['UN ANGLE AIGU', 26, 15, true]])}
${box(432, 96, 196, 40, OPP, [['EST-IL RECTANGLE ?', 26, 15, true]])}
${l(110, 136, 110, 160)}${l(320, 136, 320, 160)}${l(530, 136, 530, 160)}
${feuille(12, 160, ADJ, 'connu : 2 côtés', 'PYTHAGORE', 'hyp² = côté² + côté²')}
${ou(110)}
${feuille(12, 268, ADJ, 'connu : 1 côté et 1 angle', 'cos, sin ou tan', 'SOH CAH TOA')}
${feuille(222, 160, ANG, 'connu : l\'autre angle aigu', '90° − l\'autre', 'angles complémentaires')}
${ou(320)}
${feuille(222, 268, ANG, 'connu : 2 côtés', 'cos⁻¹, sin⁻¹, tan⁻¹', 'calculatrice en degrés')}
${box(432, 160, 196, 74, OPP, [['connu : les 3 longueurs', 22, 14, false, SUB], ['le plus long au carré', 46, 15, true], ['et la somme des 2 autres²', 66, 14, false, SUB]])}
${l(500, 234, 479, 268)}${l(560, 234, 581, 268)}
${feuille(432, 268, OPP, 'égaux', 'OUI', 'réciproque', 94)}
${feuille(534, 268, '#c2410c', 'différents', 'NON', 'contraposée', 94)}
${txt(320, 370, 'Ensuite : formule → je remplace → je calcule → j\'arrondis à la fin.', `text-anchor="middle" font-size="14" fill="${SUB}"`)}
</svg>`;
}

const AC2 = '<span class="nw">AC² = AB² + BC²</span>';

export const contenu = `
<h2>En un coup d'œil</h2>
<p class="intro">Un triangle rectangle a un <b>angle droit</b>. Dès que tu en vois un, plusieurs outils s'ouvrent : Pythagore pour les longueurs, la trigonométrie pour relier longueurs et angles, et quelques propriétés à connaître. Dans toute la fiche, <b>ABC est rectangle en B</b>.</p>
${figureVocabulaire()}
<div class="def">L'<b>hypoténuse</b> est le côté <b>en face de l'angle droit</b>. C'est toujours le côté <b>le plus long</b>. Les deux autres sont les <b>côtés de l'angle droit</b>.<br>Pour un angle aigu, l'un d'eux est <b>adjacent</b> (il touche l'angle), l'autre est <b>opposé</b> (il est en face). Si on change d'angle, ils échangent leurs rôles.</div>
<div class="apercu">
  <div><b class="k">① Pythagore (4e)</b>Si ABC est rectangle en B, alors ${AC2}.<br>Sert à : trouver le 3e côté quand on en connaît 2.</div>
  <div><b class="k">② Réciproque et contraposée (4e)</b>On connaît les 3 longueurs. Si le plus long au carré est égal à la somme des carrés des deux autres, le triangle <b>est</b> rectangle. Sinon, il <b>ne l'est pas</b>.</div>
  <div><b class="k">③ Trigonométrie (3e)</b>Pour un angle aigu :<br><span class="nw">cos = ${fr('adj.', 'hyp.')}</span> &nbsp; <span class="nw">sin = ${fr('opp.', 'hyp.')}</span> &nbsp; <span class="nw">tan = ${fr('opp.', 'adj.')}</span><br>Moyen mnémotechnique : <b>SOH CAH TOA</b>.</div>
  <div><b class="k">④ Angles (5e)</b>La somme des angles vaut 180°. L'angle droit en prend 90°, donc les deux angles aigus font <span class="nw">90° à eux deux</span> : ils sont <b>complémentaires</b>.</div>
  <div><b class="k">⑤ Aire (6e)</b>Les côtés de l'angle droit sont une base et sa hauteur : <span class="nw">aire = ${fr('AB × BC', '2')}</span>.</div>
  <div><b class="k">⑥ Cercle circonscrit (4e)</b>Son centre est le <b>milieu de l'hypoténuse</b>. Donc la médiane issue de l'angle droit mesure <b>la moitié de l'hypoténuse</b>.</div>
</div>

<h2>D'où ça vient ?</h2>
<div class="cols">
  <div>${figurePreuve()}</div>
  <div><div class="ex"><span class="q">Pythagore en une image</span><br>Le grand carré a pour côté <span class="nw">a + b</span>. Il contient 4 triangles rectangles (côtés a et b, hypoténuse c) et un carré de côté c.<br>Aire : <span class="nw">(a + b)² = c² + 4 × ${fr('ab', '2')}</span>, soit <span class="nw">a² + 2ab + b² = c² + 2ab</span>.<br>Donc <b class="nw">c² = a² + b²</b>.</div></div>
</div>
<div class="ex"><span class="q">Pourquoi cos, sin et tan ne dépendent que de l'angle ?</span><br>Deux triangles rectangles qui ont le même angle aigu sont des <b>agrandissements</b> l'un de l'autre (c'est Thalès). Leurs côtés sont proportionnels, donc le rapport <span class="nw">adjacent / hypoténuse</span> est le même : il ne dépend que de l'angle. C'est pour cela que la calculatrice peut le donner.<br>Bonus (revu en 1re) : <span class="nw">cos² + sin² = ${fr('AB² + BC²', 'AC²')} = 1</span>, c'est Pythagore divisé par AC².</div>
<div class="cols">
  <div><div class="ex"><span class="q">Pourquoi le milieu de l'hypoténuse ?</span><br>Un triangle rectangle est un <b>demi-rectangle</b> ABCD. Les diagonales [AC] et [BD] d'un rectangle ont la même longueur et se coupent en leur milieu O.<br>Donc <span class="nw">OA = OB = OC = ${fr('AC', '2')}</span> : O est le centre du cercle qui passe par A, B et C.</div></div>
  <div>${figureCercle()}</div>
</div>

<h2>Quel outil choisir ?</h2>
<p>C'est la vraie question. Ne pars pas d'une formule : <b>fais la liste de ce que tu connais et de ce que tu cherches</b>, puis lis la bonne ligne. Toujours avec ABC rectangle en B.</p>
<div class="tablewrap"><table class="choix">
<tr><th>Je connais…</th><th>je cherche…</th><th>j'utilise…</th><th>et j'écris…</th></tr>
<tr><td>2 côtés</td><td>le 3e côté</td><td><b>Pythagore</b></td><td>${AC2}</td></tr>
<tr><td>1 côté et 1 angle aigu</td><td>un autre côté</td><td><b>cos, sin ou tan</b> selon les 2 côtés en jeu</td><td><span class="nw">cos ${ang('B', 'A', 'C')} = ${fr('AB', 'AC')}</span>, <span class="nw">sin ${ang('B', 'A', 'C')} = ${fr('BC', 'AC')}</span> ou <span class="nw">tan ${ang('B', 'A', 'C')} = ${fr('BC', 'AB')}</span></td></tr>
<tr><td>2 côtés</td><td>un angle aigu</td><td><b>cos⁻¹, sin⁻¹ ou tan⁻¹</b> (arccos…)</td><td><span class="nw">${ang('B', 'A', 'C')} = cos⁻¹(${fr('AB', 'AC')})</span></td></tr>
<tr><td>1 angle aigu</td><td>l'autre angle aigu</td><td><b>somme des angles</b></td><td><span class="nw">${ang('B', 'C', 'A')} = 90° − ${ang('B', 'A', 'C')}</span></td></tr>
<tr><td>3 longueurs (rectangle ou pas ?)</td><td>s'il est rectangle</td><td><b>réciproque</b> ou <b>contraposée</b> de Pythagore</td><td>AC² d'un côté, <span class="nw">AB² + BC²</span> de l'autre, puis je compare</td></tr>
<tr><td>les 2 côtés de l'angle droit</td><td>l'aire</td><td><b>aire du triangle</b></td><td><span class="nw">${fr('AB × BC', '2')}</span></td></tr>
<tr><td>l'hypoténuse</td><td>le rayon du cercle circonscrit, la médiane [BO]</td><td><b>milieu de l'hypoténuse</b></td><td><span class="nw">BO = ${fr('AC', '2')}</span></td></tr>
<tr><td>les coordonnées de 2 points (2de)</td><td>leur distance</td><td><b>Pythagore dans un repère</b></td><td><span class="nw">AB = √((x<sub>B</sub> − x<sub>A</sub>)² + (y<sub>B</sub> − y<sub>A</sub>)²)</span></td></tr>
</table></div>
${arbre()}
<div class="retenir">Un réflexe : <b>2 côtés → Pythagore ; un angle dans l'énoncé ou dans la question → trigonométrie</b>. Et pour savoir <b>si</b> le triangle est rectangle : la réciproque.</div>

<h2>Méthode : Pythagore</h2>
<div class="methode"><b>Méthode</b><ol>
<li>Repère l'angle droit, puis l'<b>hypoténuse</b> : le côté en face.</li>
<li>Écris l'égalité : <b>hypoténuse² = somme des carrés des deux autres</b>.</li>
<li>Remplace les longueurs connues et isole le carré cherché.</li>
<li>Prends la racine carrée. Donne la valeur exacte, puis l'arrondi demandé.</li></ol></div>
<div class="ex"><span class="q">Exemple 1 : on cherche l'hypoténuse. ABC rectangle en B, AB = 5 cm, BC = 7 cm.</span><ol class="pas">
<li>L'angle droit est en B, donc l'hypoténuse est [AC].</li>
<li>${AC2}</li>
<li><span class="nw">AC² = 5² + 7² = 25 + 49 = 74</span></li>
<li><span class="nw">AC = √74 cm</span> (valeur exacte), <b class="nw">AC ≈ 8,6 cm</b> (au dixième).</li></ol></div>
<div class="ex"><span class="q">Exemple 2 : on cherche un côté de l'angle droit. RST rectangle en S, RT = 9 cm, RS = 4 cm.</span><ol class="pas">
<li>L'angle droit est en S, donc l'hypoténuse est [RT]. Attention, ce n'est pas le côté qu'on cherche.</li>
<li><span class="nw">RT² = RS² + ST²</span>, donc <span class="nw">9² = 4² + ST²</span>.</li>
<li><span class="nw">ST² = 81 − 16 = 65</span> : on <b>soustrait</b>.</li>
<li><span class="nw">ST = √65 cm</span>, <b class="nw">ST ≈ 8,1 cm</b>. Contrôle : 8,1 &lt; 9, le côté trouvé est bien plus court que l'hypoténuse.</li></ol></div>

<h2>Méthode : rectangle ou pas ?</h2>
<div class="methode"><b>Méthode</b><ol>
<li>Repère le <b>plus long</b> côté : s'il y a un angle droit, il est en face.</li>
<li>Calcule <b>séparément</b> le carré du plus long côté, puis la somme des carrés des deux autres.</li>
<li>Compare. Égaux : le triangle est rectangle (<b>réciproque</b>), et l'angle droit est en face du plus long côté. Différents : il n'est pas rectangle (<b>contraposée</b>).</li></ol></div>
<div class="ex"><span class="q">Exemple 3 : KL = 7,5 cm, LM = 10 cm, KM = 12,5 cm.</span><ol class="pas">
<li>Le plus long côté est [KM].</li>
<li>D'une part, <span class="nw">KM² = 12,5² = 156,25</span>. D'autre part, <span class="nw">KL² + LM² = 56,25 + 100 = 156,25</span>.</li>
<li>Donc <span class="nw">KM² = KL² + LM²</span>. D'après la réciproque du théorème de Pythagore, <b>KLM est rectangle en L</b>.</li></ol></div>
<div class="ex"><span class="q">Exemple 4 : DE = 6 cm, EF = 9 cm, DF = 11 cm.</span><ol class="pas">
<li>Le plus long côté est [DF].</li>
<li>D'une part, <span class="nw">DF² = 121</span>. D'autre part, <span class="nw">DE² + EF² = 36 + 81 = 117</span>.</li>
<li><span class="nw">121 ≠ 117</span>. D'après la contraposée du théorème de Pythagore, <b>DEF n'est pas rectangle</b>.</li></ol></div>

<h2>Méthode : trigonométrie</h2>
<p>On se place sur <b>un angle aigu</b>. On nomme les trois côtés <b>par rapport à cet angle</b>. Puis on choisit la formule qui contient le côté connu et le côté cherché.</p>
<div class="cols">
  <div>${figureRoles('A')}</div>
  <div>${figureRoles('C')}</div>
</div>
<div class="methode"><b>Méthode : choisir cos, sin ou tan</b><ol>
<li>Repère l'angle aigu dont on parle (connu ou cherché).</li>
<li>Nomme les côtés : <b>hypoténuse</b> (en face de l'angle droit), <b>adjacent</b> (touche l'angle), <b>opposé</b> (en face de l'angle).</li>
<li>Ne garde que les <b>deux côtés utiles</b> : celui qu'on connaît et celui qu'on cherche.</li>
<li>Adjacent et hypoténuse : <b>cos</b> (CAH). Opposé et hypoténuse : <b>sin</b> (SOH). Opposé et adjacent : <b>tan</b> (TOA).</li></ol></div>
<div class="ex"><span class="q">Exemple 5 : calculer une longueur. ABC rectangle en B, AC = 9 cm, ${ang('B', 'A', 'C')} = 40°. Calcule AB.</span><ol class="pas">
<li>Pour l'angle ${ang('B', 'A', 'C')} : [AC] est l'hypoténuse (connue), [AB] est adjacent (cherché). Adjacent et hypoténuse : cos.</li>
<li><span class="nw">cos ${ang('B', 'A', 'C')} = ${fr('AB', 'AC')}</span>, donc <span class="nw">cos 40° = ${fr('AB', '9')}</span>.</li>
<li><span class="nw">AB = 9 × cos 40°</span>, calculatrice en degrés : <b class="nw">AB ≈ 6,9 cm</b>.</li></ol></div>
<div class="ex"><span class="q">Exemple 6 : la longueur cherchée est au dénominateur. ABC rectangle en B, AB = 5 cm, ${ang('B', 'A', 'C')} = 32°. Calcule AC.</span><ol class="pas">
<li>[AB] est adjacent (connu), [AC] est l'hypoténuse (cherchée) : cos.</li>
<li><span class="nw">cos 32° = ${fr('5', 'AC')}</span>. Produit en croix : <span class="nw">AC = ${fr('5', 'cos 32°')}</span>.</li>
<li><b class="nw">AC ≈ 5,9 cm</b>. Contrôle : l'hypoténuse est plus longue que AB.</li></ol></div>
<div class="methode"><b>Méthode : calculer un angle</b><ol>
<li>Choisis cos, sin ou tan avec les deux côtés <b>connus</b>.</li>
<li>Calcule le rapport (cos, sin ou tan de l'angle).</li>
<li>Retrouve l'angle avec la touche <b>cos⁻¹</b>, <b>sin⁻¹</b> ou <b>tan⁻¹</b> (souvent « 2nde » ou « shift » puis cos), en mode <b>degrés</b>.</li></ol></div>
<div class="ex"><span class="q">Exemple 7 : ABC rectangle en B, AB = 7 cm, BC = 4 cm. Calcule ${ang('B', 'A', 'C')}, puis ${ang('B', 'C', 'A')}.</span><ol class="pas">
<li>Pour l'angle en A : [BC] est opposé, [AB] est adjacent. Pas d'hypoténuse : tan.</li>
<li><span class="nw">tan ${ang('B', 'A', 'C')} = ${fr('BC', 'AB')} = ${fr('4', '7')}</span></li>
<li><span class="nw">${ang('B', 'A', 'C')} = tan⁻¹(${fr('4', '7')})</span>, donc <b class="nw">${ang('B', 'A', 'C')} ≈ 29,7°</b>.</li>
<li>Les angles aigus sont complémentaires : <span class="nw">${ang('B', 'C', 'A')} = 90° − ${ang('B', 'A', 'C')}</span>, <b class="nw">${ang('B', 'C', 'A')} ≈ 60,3°</b>.</li></ol></div>

<h2>Un problème à deux étapes</h2>
<p>Souvent, le triangle rectangle est caché dans une figure plus grande, ou il faut deux outils l'un après l'autre. <b>Découpe</b> : quel triangle rectangle ? que connais-tu dedans ? que cherches-tu ?</p>
${figureDeuxEtapes()}
<div class="ex"><span class="q">Exemple 8 : ABC est rectangle en B, AB = 5 cm, AC = 13 cm. D est sur [BC] et ${ang('B', 'A', 'D')} = 35°. Calcule CD.</span><ol class="pas">
<li><b>Triangle ABC</b> (2 côtés connus) : Pythagore. <span class="nw">BC² = 13² − 5² = 144</span>, donc <span class="nw">BC = 12 cm</span>.</li>
<li><b>Triangle ABD</b>, rectangle en B (1 côté et 1 angle) : pour ${ang('B', 'A', 'D')}, [AB] est adjacent et [BD] opposé, donc tan. <span class="nw">BD = 5 × tan 35°</span> <span class="nw">≈ 3,501 cm</span>.</li>
<li><span class="nw">CD = BC − BD</span> <span class="nw">≈ 12 − 3,501</span>, donc <b class="nw">CD ≈ 8,5 cm</b>. On garde la valeur de la calculatrice et on arrondit à la fin.</li></ol></div>

<h2>À quoi ça sert ?</h2>
<div class="apercu">
  <div><b class="k">🌳 Hauteur inaccessible</b>À 20 m du pied d'un arbre, tu vois le sommet sous un angle de 35°. Hauteur au-dessus de tes yeux : <span class="nw">20 × tan 35°</span> <span class="nw">≈ 14 m</span>.</div>
  <div><b class="k">🪜 Échelle contre un mur</b>Échelle de 5 m, pied à 1,4 m du mur. Hauteur atteinte : <span class="nw">√(5² − 1,4²)</span> <span class="nw">= √23,04</span> <span class="nw">= 4,8 m</span>.</div>
  <div><b class="k">⛰️ Pente d'une route</b>Une route monte de 8 m pour 100 m à l'horizontale (pente de 8 %). Angle avec l'horizontale : <span class="nw">tan⁻¹(0,08)</span> <span class="nw">≈ 4,6°</span>.</div>
  <div><b class="k">📍 Distance dans un repère (2de)</b>A(1 ; 2) et B(4 ; 6) : on se déplace de 3 puis de 4. <span class="nw">AB = √(3² + 4²)</span> <span class="nw">= 5</span>. C'est Pythagore.</div>
  <div><b class="k">📏 Vérifier un angle droit</b>Les maçons mesurent 60 cm, 80 cm et 1 m : <span class="nw">0,6² + 0,8² = 1²</span>, donc l'angle est droit (réciproque).</div>
  <div><b class="k">📺 Diagonale d'un écran</b>Écran de 60 cm sur 34 cm : diagonale <span class="nw">√(60² + 34²)</span> <span class="nw">= √4 756</span> <span class="nw">≈ 69 cm</span>.</div>
</div>

<h2>Les pièges classiques</h2>
<div class="warn">
⚠️ L'hypoténuse n'est pas toujours le dernier côté nommé. Elle est <b>en face de l'angle droit</b> : cherche d'abord l'angle droit.<br>
⚠️ Pour un côté de l'angle droit, on <b>soustrait</b> : <span class="nw">ST² = RT² − RS²</span>. Ne fais pas la racine de la somme.<br>
⚠️ <span class="nw">√(a² + b²) ≠ a + b</span>. Exemple : <span class="nw">√(3² + 4²) = 5</span>, pas 7.<br>
⚠️ Calculatrice en mode <b>degrés</b> (« D » ou « DEG » à l'écran), sinon cos 40° donne n'importe quoi.<br>
⚠️ Arrondis <b>seulement à la fin</b>. Garde la valeur exacte (√74) ou toute la valeur de la calculatrice dans les étapes intermédiaires.<br>
⚠️ <span class="nw">AC = √74</span> est la valeur exacte ; <span class="nw">AC ≈ 8,6</span> est une valeur approchée : écris « ≈ », pas « = ».<br>
⚠️ Réciproque : n'écris pas <span class="nw">AC² = AB² + BC²</span> avant de l'avoir vérifié. Calcule les deux membres <b>séparément</b> (« d'une part… d'autre part… »), puis conclus.<br>
⚠️ Si l'angle change, adjacent et opposé s'échangent. L'hypoténuse, elle, ne change jamais.<br>
⚠️ Un cosinus ou un sinus est toujours entre 0 et 1. Si tu trouves plus, tu as pris le mauvais côté pour l'hypoténuse.
</div>

<h2>À retenir</h2>
<div class="retenir">1. Trouve l'angle droit, puis l'hypoténuse en face.<br>
2. Fais la liste : je connais… / je cherche…<br>
3. Que des côtés : Pythagore. Un angle en jeu : cos, sin ou tan (SOH CAH TOA). Rectangle ou pas : réciproque.<br>
4. Calcule, arrondis à la fin, et contrôle : l'hypoténuse reste le plus long côté.</div>
`;

export const liens = [
  { module: 'pythagore', niveau: 1, texte: 'Repérer l\'hypoténuse.' },
  { module: 'pythagore', niveau: 4, texte: 'Calculer l\'hypoténuse.' },
  { module: 'pythagore', niveau: 6, texte: 'Calculer un côté de l\'angle droit.' },
  { module: 'pythagore', niveau: 9, texte: 'Réciproque : prouver un angle droit.' },
  { module: 'pythagore', niveau: 10, texte: 'Rectangle ou pas ? (contraposée)' },
  { module: 'pythagore', niveau: 11, texte: 'Problèmes à deux étapes.' },
  { module: 'thales-trigo', niveau: 8, texte: 'Adjacent, opposé, hypoténuse.' },
  { module: 'thales-trigo', niveau: 9, texte: 'Choisir cos, sin ou tan.' },
  { module: 'thales-trigo', niveau: 10, texte: 'Trigonométrie : calculer une longueur.' },
  { module: 'thales-trigo', niveau: 11, texte: 'Trigonométrie : calculer un angle.' },
  { module: 'thales-trigo', niveau: 12, texte: 'Défis : problèmes de hauteurs (Thalès, trigonométrie).' },
  { module: 'angles', niveau: 9, texte: 'Somme des angles d\'un triangle.' },
  { module: 'angles', niveau: 10, texte: 'Triangles isocèle, équilatéral, rectangle.' },
  { module: 'aires-volumes', niveau: 3, texte: 'Aire du triangle.' },
  { module: 'vecteurs', niveau: 7, texte: 'Norme et distance dans un repère (2de).' },
  { module: 'trigo', niveau: 8, texte: 'cos² x + sin² x = 1 (1re).' },
];

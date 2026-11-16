// Fiche de synthèse : le cercle (6e – 1re).
// Contenu fixe (pas d'aléatoire). Les figures sont des SVG écrits à la main (coordonnées calculées une fois
// pour toutes à partir d'angles fixes). Identifiants SVG préfixés « ce ».

const C1 = '#86198f', C2 = '#e8590c', C3 = '#2b8a3e', C4 = '#1864ab', C5 = '#c2255c', GR = '#868e96', INK = '#1f2328', SOFT = '#3d434d';
const FONT = 'font-family="system-ui,sans-serif"';
const f = v => (Math.round(v * 10) / 10).toString();
/** point du cercle de centre (cx ; cy) et de rayon r, à l'angle t en degrés (sens direct, y vers le bas en SVG) */
const pt = (cx, cy, r, t) => [cx + r * Math.cos(t * Math.PI / 180), cy - r * Math.sin(t * Math.PI / 180)];
const xy = p => `${f(p[0])} ${f(p[1])}`;
const dot = (p, c = INK) => `<circle cx="${f(p[0])}" cy="${f(p[1])}" r="4" fill="${c}"/>`;
const txt = (x, y, t, o = {}) => `<text x="${f(x)}" y="${f(y)}" text-anchor="${o.a || 'middle'}" font-size="${o.s || 15}"${o.b ? ' font-weight="700"' : ''}${o.i ? ' font-style="italic"' : ''} fill="${o.c || INK}">${t}</text>`;
/** petit carré d'angle droit au point P, côtés le long des vecteurs unitaires u et v */
const droit = (P, u, v, k = 12, c = INK) => `<path d="M${xy([P[0] + k * u[0], P[1] + k * u[1]])} L${xy([P[0] + k * (u[0] + v[0]), P[1] + k * (u[1] + v[1])])} L${xy([P[0] + k * v[0], P[1] + k * v[1]])}" fill="none" stroke="${c}" stroke-width="1.8"/>`;
const ang = (a, v, b) => `<span class="ang">${a}${v}${b}</span>`; // angle AMB : chapeau sur les trois lettres (classe .ang de fiche.css)
const nw = s => `<span class="nw">${s}</span>`;

/** la grande figure : centre, rayon, diamètre, corde, arc, tangente, disque */
function vueEnsemble() {
  const O = [210, 195], r = 145, P = t => pt(O[0], O[1], r, t);
  const A = P(180), B = P(0), M = P(60), a1 = P(105), a2 = P(150), C = P(205), D = P(265), T = P(315);
  const u = [Math.SQRT1_2, Math.SQRT1_2], v = [-Math.SQRT1_2, Math.SQRT1_2]; // u : de O vers T ; v : le long de la tangente
  const t1 = [T[0] - 95 * v[0], T[1] - 95 * v[1]], t2 = [T[0] + 95 * v[0], T[1] + 95 * v[1]];
  const la = P(128).map((c, i) => O[i] + (c - O[i]) * 168 / 145);
  const leg = (y, t, o = {}) => txt(446, y, t, { a: 'start', ...o });
  return `<svg viewBox="0 0 640 385" role="img" aria-label="Cercle de centre O : rayon, diamètre, corde, arc, tangente perpendiculaire au rayon, et disque" ${FONT}>
<circle cx="${O[0]}" cy="${O[1]}" r="${r}" fill="${C1}" fill-opacity=".08" stroke="${C1}" stroke-width="3"/>
<line x1="${f(A[0])}" y1="${f(A[1])}" x2="${f(B[0])}" y2="${f(B[1])}" stroke="${C4}" stroke-width="3"/>
<line x1="${O[0]}" y1="${O[1]}" x2="${f(M[0])}" y2="${f(M[1])}" stroke="${C2}" stroke-width="3"/>
<path d="M${xy(a1)} A${r} ${r} 0 0 0 ${xy(a2)}" fill="none" stroke="${C3}" stroke-width="7" stroke-linecap="round"/>
<line x1="${f(C[0])}" y1="${f(C[1])}" x2="${f(D[0])}" y2="${f(D[1])}" stroke="${INK}" stroke-width="2.5"/>
<line x1="${O[0]}" y1="${O[1]}" x2="${f(T[0])}" y2="${f(T[1])}" stroke="${GR}" stroke-width="2" stroke-dasharray="6 4"/>
<line x1="${f(t1[0])}" y1="${f(t1[1])}" x2="${f(t2[0])}" y2="${f(t2[1])}" stroke="${C5}" stroke-width="3"/>
${droit(T, [-u[0], -u[1]], v, 12, C5)}
${[O, A, B, M, C, D, T].map(p => dot(p)).join('')}
${txt(O[0] - 6, O[1] + 22, 'centre O', { a: 'end', b: true })}
${txt(A[0] - 8, A[1] + 6, 'A', { a: 'end', b: true })}${txt(B[0] + 8, B[1] - 8, 'B', { a: 'start', b: true })}
${txt(M[0] + 6, M[1] - 10, 'M', { a: 'start', b: true })}${txt(C[0] - 8, C[1] + 6, 'C', { a: 'end', b: true })}${txt(D[0] - 4, D[1] + 22, 'D', { b: true })}
${txt(T[0] + 16 * u[0] + 4, T[1] + 16 * u[1] + 10, 'T', { a: 'start', b: true })}
${txt(138, 185, 'diamètre [AB]', { c: C4, b: true })}
${txt(252, 140, 'rayon r', { a: 'start', c: C2, b: true })}
${txt(la[0], la[1], 'arc', { c: C3, b: true, s: 16 })}
${txt(152, 280, 'corde [CD]', { b: true })}
${txt(140, 140, 'disque', { c: C1, i: true, s: 16 })}
${txt(T[0] - 55 * v[0] + 14 * u[0], T[1] - 55 * v[1] + 14 * u[1] + 4, 'tangente', { a: 'start', c: C5, b: true })}
${leg(40, 'Cercle de centre O,', { b: true, c: C1 })}${leg(61, 'de rayon r :', { b: true, c: C1 })}
${leg(84, 'les points situés')}${leg(105, 'à la distance r de O.')}
${leg(146, 'Disque :', { b: true, c: C1 })}${leg(167, 'le cercle')}${leg(188, 'et son intérieur.')}
${leg(230, 'd = 2r', { b: true, c: C4, s: 17 })}
${leg(260, 'P = 2πr', { b: true, s: 17 })}
${leg(290, 'A = πr²', { b: true, s: 17 })}
${leg(326, 'Tangente en T :', { b: true, c: C5 })}${leg(347, 'perpendiculaire')}${leg(368, 'au rayon [OT].')}
</svg>`;
}

/** d'où vient πr² : le disque coupé en 12 parts, recollées tête-bêche en un « presque rectangle » */
function parts() {
  const R = 80, cx = 95, cy = 105, w = Math.PI * R / 6, x0 = 245, y0 = 60, yb = y0 + R;
  const P = t => pt(cx, cy, R, t);
  let g = '';
  for (let k = 0; k < 12; k++) {
    const c = k < 6 ? C1 : C2;
    g += `<path d="M${cx} ${cy} L${xy(P(k * 30))} A${R} ${R} 0 0 0 ${xy(P((k + 1) * 30))} Z" fill="${c}" fill-opacity="${k % 2 ? 0.4 : 0.2}" stroke="${c}" stroke-width="1.5"/>`;
  }
  let s = '';
  for (let k = 0; k < 6; k++) {
    const xL = x0 + k * w, xR = xL + w; // parts du bas du disque, pointe en haut
    s += `<path d="M${f(xL + w / 2)} ${y0} L${f(xL)} ${yb} A${R} ${R} 0 0 0 ${f(xR)} ${yb} Z" fill="${C2}" fill-opacity="${k % 2 ? 0.4 : 0.2}" stroke="${C2}" stroke-width="1.5"/>`;
    const xl = x0 + w / 2 + k * w, xr = xl + w; // parts du haut, pointe en bas
    s += `<path d="M${f(xl + w / 2)} ${yb} L${f(xl)} ${y0} A${R} ${R} 0 0 1 ${f(xr)} ${y0} Z" fill="${C1}" fill-opacity="${k % 2 ? 0.4 : 0.2}" stroke="${C1}" stroke-width="1.5"/>`;
  }
  const xe = x0 + 6.5 * w;
  return `<svg viewBox="0 0 560 215" role="img" aria-label="Le disque coupé en parts recollées tête-bêche forme presque un rectangle de longueur pi r et de hauteur r" ${FONT}>
<defs><marker id="ceFlP" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto"><path d="M0 0 L10 5 L0 10 z" fill="${GR}"/></marker></defs>
${g}<path d="M184 105 h46" stroke="${GR}" stroke-width="2.5" marker-end="url(#ceFlP)"/>${s}
<line x1="${x0}" y1="162" x2="${f(xe)}" y2="162" stroke="${INK}" stroke-width="1.5"/><line x1="${x0}" y1="156" x2="${x0}" y2="168" stroke="${INK}" stroke-width="1.5"/><line x1="${f(xe)}" y1="156" x2="${f(xe)}" y2="168" stroke="${INK}" stroke-width="1.5"/>
${txt((x0 + xe) / 2, 184, '≈ πr : la moitié du tour')}
${txt(xe + 10, 106, 'r', { a: 'start', b: true, s: 17 })}
${txt((x0 + xe) / 2, 208, 'Aire ≈ πr × r = πr²', { b: true, c: C1, s: 17 })}
</svg>`;
}

/** un secteur de 60° : arc et secteur en proportion de l'angle */
function secteur() {
  const O = [180, 115], R = 90, P = t => pt(O[0], O[1], R, t);
  const p0 = P(0), p60 = P(60), m1 = pt(O[0], O[1], 26, 0), m2 = pt(O[0], O[1], 26, 60);
  return `<svg viewBox="0 0 360 285" role="img" aria-label="Secteur de 60 degrés : l'arc vaut 60 sur 360 du tour, le secteur 60 sur 360 du disque" ${FONT}>
<circle cx="${O[0]}" cy="${O[1]}" r="${R}" fill="none" stroke="${INK}" stroke-width="2"/>
<path d="M${xy(O)} L${xy(p0)} A${R} ${R} 0 0 0 ${xy(p60)} Z" fill="${C3}" fill-opacity=".25" stroke="${C3}" stroke-width="2"/>
<path d="M${xy(p0)} A${R} ${R} 0 0 0 ${xy(p60)}" fill="none" stroke="${C3}" stroke-width="6" stroke-linecap="round"/>
<path d="M${xy(m1)} A26 26 0 0 0 ${xy(m2)}" fill="none" stroke="${INK}" stroke-width="1.5"/>
${dot(O)}${txt(O[0] - 8, O[1] + 6, 'O', { a: 'end', b: true })}
${txt(216, 102, '60°', { s: 14, b: true })}${txt(228, 133, 'r', { b: true })}
${txt(274, 62, 'arc', { a: 'start', c: C3, b: true, s: 16 })}
${txt(180, 238, 'arc = 60/360 du tour', { c: C3, b: true })}
${txt(180, 264, 'secteur = 60/360 du disque', { c: C3, b: true })}
</svg>`;
}

/** triangle inscrit dans un demi-cercle : angle droit en M, O milieu de l'hypoténuse */
function demiCercle() {
  const O = [180, 140], R = 100, A = [80, 140], B = [280, 140], M = pt(O[0], O[1], R, 60);
  const a = [(A[0] - M[0]) / 173.2, (A[1] - M[1]) / 173.2], b = [(B[0] - M[0]) / 100, (B[1] - M[1]) / 100];
  return `<svg viewBox="0 0 360 280" role="img" aria-label="Triangle AMB inscrit dans le cercle de diamètre AB : il est rectangle en M, et O, milieu de AB, est à la distance r de A, B et M" ${FONT}>
<circle cx="${O[0]}" cy="${O[1]}" r="${R}" fill="none" stroke="${INK}" stroke-width="2"/>
<path d="M${xy(A)} L${xy(M)} L${xy(B)} Z" fill="${C1}" fill-opacity=".12" stroke="${C1}" stroke-width="2.5"/>
<line x1="${O[0]}" y1="${O[1]}" x2="${f(M[0])}" y2="${f(M[1])}" stroke="${C2}" stroke-width="2" stroke-dasharray="6 4"/>
${droit(M, a, b, 13, C1)}
${[A, B, M, O].map(p => dot(p)).join('')}
${txt(A[0] - 8, A[1] + 6, 'A', { a: 'end', b: true })}${txt(B[0] + 8, B[1] + 6, 'B', { a: 'start', b: true })}
${txt(M[0] + 6, M[1] - 10, 'M', { a: 'start', b: true })}${txt(O[0], O[1] + 22, 'O', { b: true })}
${txt(196, 92, 'r', { a: 'end', c: C2, b: true })}${txt(130, 132, 'r', { c: C2, b: true })}${txt(230, 132, 'r', { c: C2, b: true })}
${txt(180, 196, '[AB] : diamètre', { s: 14 })}
${txt(180, 268, 'OA = OB = OM = r', { c: C2, b: true })}
</svg>`;
}

/** tangente issue d'un point A : OT ⟂ AT (exemple 6) */
function tangente() {
  const O = [120, 125], A = [280, 125], T = [177.6, 48.2];
  return `<svg viewBox="0 0 330 235" role="img" aria-label="Cercle de centre O et de rayon 3 cm, point A à 5 cm de O, tangente AT : le triangle OTA est rectangle en T" ${FONT}>
<circle cx="${O[0]}" cy="${O[1]}" r="96" fill="${C1}" fill-opacity=".06" stroke="${C1}" stroke-width="2"/>
<line x1="145.6" y1="24.2" x2="${A[0]}" y2="${A[1]}" stroke="${C5}" stroke-width="3"/>
<line x1="${O[0]}" y1="${O[1]}" x2="${A[0]}" y2="${A[1]}" stroke="${INK}" stroke-width="2"/>
<line x1="${O[0]}" y1="${O[1]}" x2="${T[0]}" y2="${T[1]}" stroke="${C2}" stroke-width="2.5"/>
${droit(T, [-0.6, 0.8], [0.8, 0.6], 12, C5)}
<path d="M250 125 A30 30 0 0 1 256 107" fill="none" stroke="${INK}" stroke-width="1.5"/>
${[O, A, T].map(p => dot(p)).join('')}
${txt(O[0] - 8, O[1] + 20, 'O', { a: 'end', b: true })}${txt(A[0] + 8, A[1] + 6, 'A', { a: 'start', b: true })}${txt(T[0] - 2, T[1] - 12, 'T', { a: 'end', b: true })}
${txt(140, 80, '3 cm', { a: 'end', c: C2, b: true })}${txt(250, 146, '5 cm', { b: true })}
${txt(238, 74, '?', { a: 'start', c: C5, b: true, s: 17 })}${txt(234, 113, 'α', { b: true })}
</svg>`;
}

/** le cercle trigonométrique : rayon 1, arc de longueur x, M(cos x ; sin x) */
function trigo() {
  const O = [170, 150], R = 110, M = pt(O[0], O[1], R, 60), I = [O[0] + R, O[1]];
  const m1 = pt(O[0], O[1], 28, 0), m2 = pt(O[0], O[1], 28, 60), lx = pt(O[0], O[1], 124, 30);
  return `<svg viewBox="0 0 380 290" role="img" aria-label="Cercle trigonométrique de rayon 1 : le point M associé à x a pour coordonnées cos x et sin x ; l'arc de I à M a pour longueur x" ${FONT}>
<defs><marker id="ceFlT" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto"><path d="M0 0 L10 5 L0 10 z" fill="${SOFT}"/></marker></defs>
<line x1="30" y1="${O[1]}" x2="320" y2="${O[1]}" stroke="${SOFT}" stroke-width="1.5" marker-end="url(#ceFlT)"/>
<line x1="${O[0]}" y1="280" x2="${O[0]}" y2="18" stroke="${SOFT}" stroke-width="1.5" marker-end="url(#ceFlT)"/>
<circle cx="${O[0]}" cy="${O[1]}" r="${R}" fill="none" stroke="${C1}" stroke-width="2.5"/>
<path d="M${xy(I)} A${R} ${R} 0 0 0 ${xy(M)}" fill="none" stroke="${C2}" stroke-width="6" stroke-linecap="round"/>
<line x1="${O[0]}" y1="${O[1]}" x2="${f(M[0])}" y2="${f(M[1])}" stroke="${INK}" stroke-width="2"/>
<path d="M${xy(M)} V${O[1]} M${xy(M)} H${O[0]}" fill="none" stroke="${GR}" stroke-width="1.8" stroke-dasharray="5 4"/>
<path d="M${xy(m1)} A28 28 0 0 0 ${xy(m2)}" fill="none" stroke="${INK}" stroke-width="1.5"/>
${[O, I, M, [O[0], O[1] - R]].map(p => dot(p)).join('')}
${txt(O[0] - 8, O[1] + 20, 'O', { a: 'end', b: true })}${txt(I[0] + 6, I[1] + 20, 'I', { a: 'start', b: true })}${txt(O[0] + 8, O[1] - R - 6, 'J', { a: 'start', b: true })}
${txt(M[0] + 8, M[1] - 10, 'M(cos x ; sin x)', { a: 'start', b: true })}
${txt(lx[0] + 4, lx[1], 'longueur x', { a: 'start', c: C2, b: true })}
${txt(M[0], O[1] + 22, 'cos x', { c: C4, b: true })}${txt(O[0] - 8, M[1] + 5, 'sin x', { a: 'end', c: C4, b: true })}
${txt(186, 100, '1', { a: 'end', b: true })}${txt(208, 136, 'x', { i: true, b: true })}
</svg>`;
}

/** dans un repère quadrillé : cercle de centre Ω(1 ; 2) passant par A(4 ; 6) (exemple 7), ΩA comme hypoténuse */
function repere() {
  const u = 24, X = x => 20 + (x + 5) * u, Y = y => 20 + (8 - y) * u; // x de −5 à 7, y de −4 à 8
  const W = [X(1), Y(2)], A = [X(4), Y(6)], B = [X(-2), Y(-2)], Cp = [X(5), Y(6)], H = [X(4), Y(2)];
  let grille = '';
  for (let k = -5; k <= 7; k++) grille += `M${X(k)} ${Y(-4)} V${Y(8)} `;
  for (let k = -4; k <= 8; k++) grille += `M${X(-5)} ${Y(k)} H${X(7)} `;
  return `<svg viewBox="0 0 330 360" role="img" aria-label="Repère quadrillé : cercle de centre Oméga(1 ; 2) et de rayon 5 passant par A(4 ; 6) et B(−2 ; −2) ; ΩA est l'hypoténuse d'un triangle rectangle de côtés 3 et 4 ; C(5 ; 6) est à l'extérieur" ${FONT}>
<defs><marker id="ceFlR" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto"><path d="M0 0 L10 5 L0 10 z" fill="${SOFT}"/></marker></defs>
<path d="${grille}" stroke="#dee2e6" stroke-width="1" fill="none"/>
<line x1="${X(-5)}" y1="${Y(0)}" x2="${X(7) + 6}" y2="${Y(0)}" stroke="${SOFT}" stroke-width="1.5" marker-end="url(#ceFlR)"/>
<line x1="${X(0)}" y1="${Y(-4)}" x2="${X(0)}" y2="${Y(8) - 6}" stroke="${SOFT}" stroke-width="1.5" marker-end="url(#ceFlR)"/>
<path d="M${X(1)} ${Y(0) - 4} v8 M${X(0) - 4} ${Y(1)} h8" stroke="${SOFT}" stroke-width="1.5"/>
${txt(X(0) - 6, Y(0) + 16, 'O', { a: 'end', s: 13 })}${txt(X(1), Y(0) + 16, '1', { s: 13 })}${txt(X(0) - 7, Y(1) + 4, '1', { a: 'end', s: 13 })}
<circle cx="${W[0]}" cy="${W[1]}" r="${5 * u}" fill="${C1}" fill-opacity=".06" stroke="${C1}" stroke-width="2.5"/>
<path d="M${xy(W)} H${H[0]} V${A[1]}" fill="none" stroke="${C4}" stroke-width="2" stroke-dasharray="6 4"/>
${droit(H, [-1, 0], [0, -1], 10, C4)}
<line x1="${W[0]}" y1="${W[1]}" x2="${A[0]}" y2="${A[1]}" stroke="${C2}" stroke-width="3"/>
<line x1="${W[0]}" y1="${W[1]}" x2="${Cp[0]}" y2="${Cp[1]}" stroke="${GR}" stroke-width="1.8" stroke-dasharray="3 4"/>
${[W, A, B].map(p => dot(p)).join('')}${dot(Cp, C5)}
${txt(W[0] - 8, W[1] - 8, 'Ω', { a: 'end', b: true, s: 17 })}
${txt(A[0] - 8, A[1] - 8, 'A', { a: 'end', b: true })}${txt(B[0] - 8, B[1] + 6, 'B', { a: 'end', b: true })}${txt(Cp[0] + 8, Cp[1] - 6, 'C', { a: 'start', b: true, c: C5 })}
${txt((W[0] + H[0]) / 2, W[1] + 18, '3', { c: C4, b: true })}${txt(H[0] + 8, (H[1] + A[1]) / 2 + 5, '4', { a: 'start', c: C4, b: true })}
${txt((W[0] + A[0]) / 2 - 8, (W[1] + A[1]) / 2 - 4, 'r = 5', { a: 'end', c: C2, b: true })}
${txt(165, 350, 'ΩA = √(3² + 4²) = 5', { b: true, c: C2 })}
</svg>`;
}

/** schéma de décision : que cherches-tu ? */
function arbre() {
  const W = 152, X = [4, 164, 324, 484];
  const boite = (x, y, h, titre, lignes, c) => `<rect x="${x}" y="${y}" width="${W}" height="${h}" rx="10" fill="#fff" stroke="${c}" stroke-width="2"/>${titre ? txt(x + W / 2, y + 23, titre, { b: true, c }) : ''}${lignes.map((l, i) => txt(x + W / 2, y + (titre ? 44 : 24) + i * 20, l, { s: 14, c: SOFT })).join('')}`;
  const n2 = [['MESURER', 'un tour, une aire', C3], ['UNE LONGUEUR', 'dans un triangle', C5], ['UN POINT', 'dans un repère', C4], ['UN ANGLE', 'cos, sin, radians', C2]];
  const n3 = [['r = d ÷ 2', 'P = 2πr ; A = πr²', 'morceau : × α/360'], ['angle droit caché ?', 'diamètre, tangente', '→ Pythagore, trigo'], ['ΩM = r ?', 'distance √(…)', '1re : équation'], ['cercle trigo, rayon 1', 'arc de longueur x', 'M(cos x ; sin x)']];
  return `<svg viewBox="0 0 640 305" role="img" aria-label="Schéma de décision : mesurer, chercher une longueur dans un triangle, un point dans un repère ou un angle" ${FONT}>
<rect x="160" y="4" width="320" height="40" rx="10" fill="#fff" stroke="${INK}" stroke-width="2"/>${txt(320, 30, 'Il y a un cercle. Que cherches-tu ?', { b: true })}
${X.map(x => `<line x1="320" y1="44" x2="${x + W / 2}" y2="84" stroke="${GR}" stroke-width="2"/><line x1="${x + W / 2}" y1="140" x2="${x + W / 2}" y2="176" stroke="${GR}" stroke-width="2"/>`).join('')}
${X.map((x, i) => boite(x, 84, 56, n2[i][0], [n2[i][1]], n2[i][2])).join('')}
${X.map((x, i) => boite(x, 176, 76, '', n3[i], n2[i][2])).join('')}
${txt(320, 290, 'Toujours : le rayon d\'abord, π gardé jusqu\'au bout, l\'unité à la fin.', { s: 14, c: SOFT })}
</svg>`;
}

/** typographie française : espaces insécables autour de « = », avant « : ; ? % », dans les guillemets et entre un nombre et son unité, pour ne pas isoler ces signes en début de ligne */
const typo = s => s.replace(/(\d) (cm³|cm²|km²|cm|km|m|rad)(?![A-Za-zé])/g, '$1&nbsp;$2').replace(/ = /g, '&nbsp;=&nbsp;').replace(/« /g, '«&nbsp;').replace(/ ([:;?»%])/g, '&nbsp;$1');

const brut = `
<h2>En un coup d'œil</h2>
<p class="intro">Un cercle, c'est un <b>centre</b> et un <b>rayon</b>. Tout le reste en découle : le diamètre, le périmètre, l'aire, les angles droits cachés, et même le cosinus et le sinus.</p>
${vueEnsemble()}
<div class="apercu">
  <div><b class="k">📏 Mesurer (6e – 3e)</b>${nw('d = 2r')} &nbsp; ${nw('P = 2πr = πd')} &nbsp; ${nw('A = πr²')}<br>Un morceau d'angle α (en degrés) : ${nw('α/360')} du tour (arc) ou du disque (secteur).</div>
  <div><b class="k">📐 Cercle et triangle rectangle (4e)</b>M est sur le cercle de diamètre [AB] ${nw('⟺')} AMB est rectangle en M.<br>Le centre du cercle circonscrit d'un triangle rectangle est le <b>milieu de l'hypoténuse</b>.</div>
  <div><b class="k">⟂ Angles et tangente</b>La tangente en T est <b>perpendiculaire au rayon</b> [OT].<br>Deux rayons OA = OB : le triangle OAB est <b>isocèle</b> en O.</div>
  <div><b class="k">📍 Dans un repère (2de – 1re)</b>M est sur le cercle ${nw('⟺ ΩM = r')}.<br>2de : ${nw('ΩM = √((x − a)² + (y − b)²)')}.<br>1re spécialité : équation ${nw('(x − a)² + (y − b)² = r²')}.</div>
  <div><b class="k">🔄 Cercle trigonométrique (1re)</b>Rayon 1, sens direct. ${nw('360° = 2π rad')}.<br>Un arc de x radians a pour longueur x. Le point associé est ${nw('M(cos x ; sin x)')}.</div>
  <div><b class="k">🥫 Solides (5e – 3e)</b>Cylindre : ${nw('V = πr²h')}.<br>Cône : ${nw('V = πr²h ÷ 3')}.<br>Boule : ${nw('V = 4/3 × πr³')}.<br>Sphère : ${nw('A = 4πr²')}.</div>
</div>
<div class="retenir">À retenir : cherche toujours le <b>rayon</b> d'abord. Puis demande-toi : je <b>mesure</b> (tour, aire, morceau) ou je cherche un <b>angle droit</b> caché ?</div>

<h2>D'où ça vient ?</h2>
<div class="def"><b>π</b> (« pi ») est le nombre de fois que le diamètre « rentre » dans le tour. Pour <b>tous</b> les cercles, ${nw('P ÷ d')} est le même nombre : ${nw('π ≈ 3,14159…')} Donc ${nw('P = π × d = 2πr')}.</div>
<p>Pour l'aire, on découpe le disque en parts fines et on les recolle tête-bêche. On obtient presque un rectangle : sa longueur est la moitié du tour (πr), sa hauteur est le rayon r.</p>
${parts()}
<div class="cols">
  <div><div class="ex"><span class="q">Pourquoi un angle droit dans un demi-cercle ?</span><ol class="pas">
  <li>OA = OM = OB = r : les triangles OAM et OMB sont <b>isocèles</b> en O.</li>
  <li>Leurs angles à la base sont égaux deux à deux : appelons-les a (en A et en M) et b (en B et en M).</li>
  <li>Dans le triangle AMB, la somme des angles donne ${nw('a + b + (a + b) = 180°')}.</li>
  <li>Donc ${nw('a + b = 90°')} : l'angle ${ang('A', 'M', 'B')} est <b>droit</b>.</li></ol></div></div>
  <div>${demiCercle()}</div>
</div>
<p>La tangente, elle, touche le cercle en un seul point T. Tous ses autres points sont plus loin de O que T : [OT] est le plus court chemin de O à la droite, donc il lui est <b>perpendiculaire</b>.</p>

<h2>Reconnaître la situation</h2>
<p>Un mot de l'énoncé suffit souvent à choisir l'outil. Repère-le, puis écris tout de suite la conséquence.</p>
<div class="tablewrap"><table class="choix">
<tr><th>Si l'énoncé dit…</th><th>pense à…</th><th>et tu écris…</th></tr>
<tr><td>« un diamètre de 10 cm »</td><td>le rayon est la moitié</td><td>${nw('r = 10 ÷ 2 = 5 cm')}</td></tr>
<tr><td>« longueur du cercle », « tour », « périmètre »</td><td>${nw('P = 2πr = πd')}</td><td>${nw('P = 2 × π × 5 = 10π')} ${nw('≈ 31,4 cm')}</td></tr>
<tr><td>« aire du disque », « surface »</td><td>${nw('A = πr²')}, avec le <b>rayon</b></td><td>${nw('A = π × 5² = 25π')} ${nw('≈ 78,5 cm²')}</td></tr>
<tr><td>« un arc de 60° », « un secteur de 60° »</td><td>la fraction ${nw('60/360 = 1/6')} du tour ou du disque</td><td>${nw('ℓ = 1/6 × 10π')}<br>${nw('A = 1/6 × 25π')}</td></tr>
<tr><td>« A et B sont sur le cercle de centre O »</td><td>deux rayons égaux</td><td>OA = OB = r : OAB est isocèle en O</td></tr>
<tr><td>« M est sur le cercle de diamètre [AB] »</td><td>un angle droit en M</td><td>AMB rectangle en M, puis Pythagore : ${nw('AM² + MB² = AB²')}</td></tr>
<tr><td>« ABC rectangle en A » et « cercle circonscrit »</td><td>le centre est le milieu de l'hypoténuse [BC]</td><td>${nw('r = BC ÷ 2')} et ${nw('OA = OB = OC')}</td></tr>
<tr><td>« cercle circonscrit » à un triangle quelconque</td><td>les médiatrices (5e)</td><td>le centre est le point commun des médiatrices des côtés</td></tr>
<tr><td>« (d) est tangente au cercle en T »</td><td>${nw('(d) ⟂ (OT)')}</td><td>un triangle rectangle en T, puis Pythagore ou la trigonométrie</td></tr>
<tr><td>« dans un repère, cercle de centre Ω(a ; b) »</td><td>la distance au centre</td><td>${nw('ΩM = √((x − a)² + (y − b)²)')}, à comparer à r</td></tr>
<tr><td>« angle de π/3 rad », « cercle trigonométrique »</td><td>rayon 1, arc de longueur x</td><td>${nw('60° = π/3 rad')} ; ${nw('M(cos x ; sin x)')}</td></tr>
<tr><td>« cylindre », « cône », « boule »</td><td>la base ou la coupe est un disque</td><td>${nw('V = πr²h')} ; ${nw('πr²h ÷ 3')} ; ${nw('4/3 × πr³')}</td></tr>
</table></div>
${arbre()}

<h2>Méthode : mesurer (périmètre, aire, arc, secteur)</h2>
<div class="methode"><b>Méthode</b><ol>
<li>Trouve le <b>rayon</b> (si on donne le diamètre, divise par 2).</li>
<li>Choisis la formule : un <b>tour</b> (longueur, en cm) ${nw('P = 2πr')} ; une <b>surface</b> (en cm²) ${nw('A = πr²')}.</li>
<li>Pour un morceau d'angle α en degrés, multiplie par ${nw('α/360')}.</li>
<li>Garde π dans la valeur exacte (10π), puis arrondis à la fin seulement, avec « ≈ ».</li></ol></div>
<div class="ex"><span class="q">Exemple 1 : une roue de vélo a un diamètre de 60 cm. Quelle distance parcourt-elle en 100 tours ?</span><ol class="pas">
<li>Un tour : ${nw('P = π × d = 60π cm')} ${nw('≈ 188,5 cm')}.</li>
<li>100 tours : ${nw('100 × 60π = 6&#8239;000π cm')}.</li>
<li>${nw('6&#8239;000π ≈ 18&#8239;850 cm')}, soit environ <b>188,5 m</b>.</li></ol></div>
<div class="cols">
  <div><div class="ex"><span class="q">Exemple 2 : une part de pizza est un secteur de 60° d'un disque de rayon 6 cm. Son aire ? Le tour de la part ?</span><ol class="pas">
  <li>60° sur 360°, c'est ${nw('60/360 = 1/6')} du disque.</li>
  <li>Aire : ${nw('1/6 × π × 6²')} ${nw('= 36π/6')} ${nw('= 6π ≈ 18,8 cm²')}.</li>
  <li>Arc : ${nw('1/6 × 2π × 6 = 2π')} ${nw('≈ 6,3 cm')}.</li>
  <li>Le tour de la part, c'est l'arc <b>plus deux rayons</b> : ${nw('2π + 6 + 6')} ${nw('= 12 + 2π')} ${nw('≈ 18,3 cm')}.</li></ol></div></div>
  <div>${secteur()}</div>
</div>
<div class="ex"><span class="q">Exemple 3 : le même arc, avec les radians (1re)</span><ol class="pas">
<li>En radians, ${nw('60° = 60 × π/180 = π/3 rad')}.</li>
<li>Longueur d'un arc d'angle θ (en radians) : ${nw('ℓ = r × θ')}.</li>
<li>${nw('ℓ = 6 × π/3 = 2π cm')} : le même résultat qu'à l'exemple 2, sans fraction de 360.</li></ol></div>

<h2>Méthode : l'angle droit caché</h2>
<div class="methode"><b>Méthode</b><ol>
<li>Cherche un <b>diamètre</b> (triangle dont un côté est un diamètre) ou une <b>tangente</b>.</li>
<li>Écris la phrase : « M est sur le cercle de diamètre [AB], donc AMB est rectangle en M » ou « la tangente en T est perpendiculaire au rayon [OT] ».</li>
<li>Dans le triangle rectangle obtenu, repère l'<b>hypoténuse</b> (face à l'angle droit).</li>
<li>Applique Pythagore (deux longueurs connues) ou la trigonométrie (un angle et une longueur).</li></ol></div>
<div class="ex"><span class="q">Exemple 4 : cercle + Pythagore. [AB] est un diamètre, AB = 10 cm. M est sur le cercle et AM = 6 cm. Calcule MB.</span><ol class="pas">
<li>M est sur le cercle de diamètre [AB] : AMB est <b>rectangle en M</b>, d'hypoténuse [AB].</li>
<li>Pythagore : ${nw('AM² + MB² = AB²')}, donc ${nw('MB² = 10² − 6² = 100 − 36 = 64')}.</li>
<li>${nw('MB = √64 =')} <b>8 cm</b>.</li>
<li>Bonus : l'aire du triangle vaut ${nw('6 × 8 ÷ 2 = 24 cm²')}, celle du disque ${nw('π × 5² = 25π ≈ 78,5 cm²')}.</li></ol></div>
<div class="ex"><span class="q">Exemple 5 : ABC est rectangle en A, avec AB = 5 cm et AC = 12 cm. Quel est le rayon de son cercle circonscrit ?</span><ol class="pas">
<li>Le centre est le milieu de l'hypoténuse [BC], et le rayon vaut ${nw('BC ÷ 2')}.</li>
<li>Pythagore : ${nw('BC² = 5² + 12² = 25 + 144 = 169')}, donc ${nw('BC = 13 cm')}.</li>
<li>Rayon : ${nw('13 ÷ 2 =')} <b>6,5 cm</b>.</li></ol></div>
<div class="cols">
  <div><div class="ex"><span class="q">Exemple 6 : tangente + trigonométrie. Le cercle a pour centre O et pour rayon 3 cm. OA = 5 cm et (AT) est tangente au cercle en T. Calcule AT et l'angle ${nw(`α = ${ang('O', 'A', 'T')}`)}.</span><ol class="pas">
  <li>Tangente en T : ${nw('(AT) ⟂ (OT)')}. OTA est rectangle en T, d'hypoténuse [OA].</li>
  <li>Pythagore : ${nw('AT² = 5² − 3² = 16')}, donc ${nw('AT = 4 cm')}.</li>
  <li>Trigonométrie : ${nw('sin α = OT/OA = 3/5 = 0,6')}.</li>
  <li>Calculatrice en <b>degrés</b> : ${nw('α = arcsin(0,6)')} ${nw('≈ 36,9°')}.</li></ol></div></div>
  <div>${tangente()}</div>
</div>

<h2>Méthode : dans un repère (2de – 1re)</h2>
<div class="def">M est sur le cercle de centre Ω et de rayon r <b>si et seulement si</b> ${nw('ΩM = r')}. Dans un repère orthonormé, avec Ω(a ; b) et M(x ; y) : ${nw('ΩM = √((x − a)² + (y − b)²)')}.</div>
<div class="cols">
  <div><div class="ex"><span class="q">Exemple 7 : Ω(1 ; 2) et A(4 ; 6). Le cercle de centre Ω passe par A. Les points B(−2 ; −2) et C(5 ; 6) sont-ils sur ce cercle ?</span><ol class="pas">
  <li>Rayon : ${nw('r = ΩA = √(3² + 4²) = √25 = 5')}. Sur la figure, ΩA est l'hypoténuse d'un triangle rectangle de côtés 3 et 4.</li>
  <li>${nw('ΩB = √((−3)² + (−4)²) = √25 = 5')} : B est <b>sur</b> le cercle.</li>
  <li>${nw('ΩC = √(4² + 4²) = √32 ≈ 5,66')} : ${nw('ΩC ≠ 5')}, C n'est <b>pas</b> sur le cercle (il est à l'extérieur).</li>
  <li>En 1re spécialité seulement : une équation du cercle est ${nw('(x − 1)² + (y − 2)² = 25')}. Pour A : ${nw('3² + 4² = 25')}, cela marche.</li></ol></div></div>
  <div>${repere()}</div>
</div>
<p>L'équation de cercle n'est pas au programme de 2de : en 2de, on calcule une distance et on la compare au rayon. C'est la même idée, élevée au carré.</p>

<h2>Méthode : le cercle trigonométrique (1re)</h2>
<div class="cols">
  <div><div class="def">C'est le cercle de centre O et de <b>rayon 1</b>, parcouru dans le sens direct (inverse des aiguilles d'une montre).<br>Le tour entier mesure 2π : ${nw('360° = 2π rad')}, ${nw('180° = π rad')}.<br>Au réel x on associe le point M au bout d'un arc de longueur x, parti de I. Alors ${nw('M(cos x ; sin x)')}.</div></div>
  <div>${trigo()}</div>
</div>
<div class="ex"><span class="q">Exemple 8 : où est le point associé à π/3 ?</span><ol class="pas">
<li>Conversion : ${nw('π/3 rad = 180° ÷ 3 = 60°')}.</li>
<li>Coordonnées : ${nw('cos(π/3) = 1/2')} et ${nw('sin(π/3) = √3/2')}, donc ${nw('M(1/2 ; √3/2)')}.</li>
<li>Longueur de l'arc de I à M : ${nw('π/3 ≈ 1,05')} (rayon 1). Sur un cercle de rayon 6, ce serait ${nw('6 × π/3 = 2π')} : c'est l'exemple 3.</li>
<li>Vérification : ${nw('cos² x + sin² x = 1/4 + 3/4 = 1')}, car OM = 1.</li></ol></div>

<h2>À quoi ça sert ?</h2>
<div class="apercu">
  <div><b class="k">🚲 Roues et distances</b>Un tour de roue fait avancer de ${nw('πd')}. Le tour de la Terre (rayon ≈ 6&#8239;371 km) : ${nw('2π × 6&#8239;371 ≈ 40&#8239;030 km')}.</div>
  <div><b class="k">🍕 Parts et diagrammes</b>Un diagramme circulaire : un secteur de 25 % a un angle de ${nw('25/100 × 360° = 90°')}.</div>
  <div><b class="k">📡 Portée</b>Une antenne qui porte à 30 km couvre un disque : ${nw('π × 30² ≈ 2&#8239;827 km²')}. « Être à moins de r du centre », c'est être dans le disque.</div>
  <div><b class="k">🥫 Volumes</b>Une boîte de conserve de rayon 5 cm et de hauteur 10 cm : ${nw('π × 5² × 10 = 250π')} ${nw('≈ 785 cm³')}, soit environ 0,79&nbsp;L.</div>
  <div><b class="k">✏️ Construire un angle droit</b>Trace un cercle, un diamètre [AB], et prends M sur le cercle : l'angle en M est droit, sans équerre.</div>
  <div><b class="k">🌊 Phénomènes périodiques</b>Un point qui tourne sur le cercle trigonométrique donne cos et sin : marées, sons, courant alternatif.</div>
</div>

<h2>Les pièges classiques</h2>
<div class="warn">
⚠️ <b>Rayon ou diamètre ?</b> Les formules utilisent le rayon. Avec d = 10 cm, l'aire est ${nw('π × 5² = 25π')}, pas ${nw('π × 10² = 100π')} (quatre fois trop).<br>
⚠️ <b>2πr ou πr² ?</b> Le périmètre est une longueur (cm), l'aire une surface (cm²). Le carré de r va avec le carré de l'unité : ${nw('πr² → cm²')}.<br>
⚠️ ${nw('πr²')} veut dire ${nw('π × r × r')}, pas ${nw('(πr)²')} ni ${nw('2πr')}.<br>
⚠️ <b>Valeur exacte ou arrondi ?</b> 25π est exact, 78,5 est arrondi : écris ${nw('A = 25π ≈ 78,5 cm²')}. N'arrondis qu'à la fin.<br>
⚠️ <b>Le tour d'une part</b> de pizza : l'arc <b>plus les deux rayons</b>.<br>
⚠️ Un triangle inscrit dans un cercle n'est rectangle que si l'un de ses côtés est un <b>diamètre</b>.<br>
⚠️ Pour une tangente, l'angle droit est au <b>point de contact</b> T, entre la tangente et le rayon [OT].<br>
⚠️ <b>Degrés ou radians sur la calculatrice ?</b> En mode radian, ${nw('cos(60) ≈ −0,95')} : c'est le cosinus de 60 radians, pas de 60°. Vérifie le mode (DEG ou RAD) avant de calculer.
</div>
<div class="retenir">À retenir : tout part du rayon r. ${nw('d = 2r')}, ${nw('P = 2πr')}, ${nw('A = πr²')}, et un morceau d'angle α vaut ${nw('α/360')} du tout (ou ${nw('ℓ = rθ')} en radians). Un cercle cache souvent un angle droit : diamètre ⟹ angle droit sur le cercle, tangente ⟂ rayon. Être sur le cercle, c'est être à la distance r du centre.</div>
`;
// les figures SVG ne passent pas par typo : leurs attributs (chemins « M80 140 L… ») doivent rester intacts
export const contenu = brut.split(/(<svg[\s\S]*?<\/svg>)/).map(s => (s.startsWith('<svg') ? s : typo(s))).join('');

export const liens = [
  { module: 'aires-volumes', niveau: 4, texte: 'Périmètre et aire du disque, avec π.' },
  { module: 'aires-volumes', niveau: 5, texte: 'Figures composées : demi-disques, trous.' },
  { module: 'aires-volumes', niveau: 10, texte: 'Volume du cylindre : πr²h.' },
  { module: 'aires-volumes', niveau: 11, texte: 'Volume du cône.' },
  { module: 'aires-volumes', niveau: 12, texte: 'Boule et sphère.' },
  { module: 'angles', niveau: 10, texte: 'Triangles isocèles et rectangles (deux rayons, un diamètre).' },
  { module: 'pythagore', niveau: 6, texte: 'Calculer un côté de l\'angle droit (demi-cercle, tangente).' },
  { module: 'pythagore', niveau: 11, texte: 'Problèmes à deux étapes.' },
  { module: 'thales-trigo', niveau: 11, texte: 'Trigonométrie : calculer un angle (tangente).' },
  { module: 'vecteurs', niveau: 7, texte: 'Norme et distance : un point est-il sur le cercle ?' },
  { module: 'trigo', niveau: 1, texte: 'Degrés → radians.' },
  { module: 'trigo', niveau: 3, texte: 'Repérer un point du cercle trigonométrique.' },
  { module: 'trigo', niveau: 5, texte: 'cos et sin des angles remarquables.' },
];

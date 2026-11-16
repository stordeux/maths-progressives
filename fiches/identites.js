// Fiche de synthèse : identités remarquables (3e – 2de).
// Contenu fixe (pas d'aléatoire). Les figures sont des SVG écrits à la main.

const C1 = '#1864ab', C2 = '#e8590c', C3 = '#2b8a3e', GR = '#868e96';

/** carré de côté a + b découpé en a², b² et deux rectangles ab */
function carreSomme() {
  const a = 150, b = 80, x0 = 40, y0 = 20;
  const r = (x, y, w, h, f, t) => `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${f}" fill-opacity=".22" stroke="${f}" stroke-width="2"/><text x="${x + w / 2}" y="${y + h / 2 + 7}" text-anchor="middle" font-size="22" font-weight="700" fill="${f}">${t}</text>`;
  return `<svg viewBox="0 0 300 300" role="img" aria-label="Carré de côté a plus b découpé en a au carré, b au carré et deux rectangles a fois b" font-family="system-ui,sans-serif">
${r(x0, y0, a, a, C1, 'a²')}${r(x0 + a, y0, b, a, C2, 'ab')}${r(x0, y0 + a, a, b, C2, 'ab')}${r(x0 + a, y0 + a, b, b, C3, 'b²')}
<text x="${x0 + a / 2}" y="${y0 + a + b + 26}" text-anchor="middle" font-size="18">a</text><text x="${x0 + a + b / 2}" y="${y0 + a + b + 26}" text-anchor="middle" font-size="18">b</text>
<text x="${x0 - 14}" y="${y0 + a / 2 + 6}" text-anchor="middle" font-size="18">a</text><text x="${x0 - 14}" y="${y0 + a + b / 2 + 6}" text-anchor="middle" font-size="18">b</text>
</svg>`;
}

/** a² − b² : on enlève le carré b² du coin, puis on recolle la bande pour faire un rectangle (a + b)(a − b) */
function differenceCarres() {
  const s = 0.9, a = 150 * s, b = 60 * s;
  const y0 = 30;
  // gauche : carré a×a avec le coin b×b retiré
  const g = `<path d="M20 ${y0} h${a} v${a - b} h${-b} v${b} h${-(a - b)} Z" fill="${C1}" fill-opacity=".22" stroke="${C1}" stroke-width="2"/>
<rect x="${20 + a - b}" y="${y0 + a - b}" width="${b}" height="${b}" fill="none" stroke="${GR}" stroke-dasharray="5 4"/>
<line x1="20" y1="${y0 + a - b}" x2="${20 + a - b}" y2="${y0 + a - b}" stroke="${C2}" stroke-width="2" stroke-dasharray="6 3"/>
<text x="${20 + a / 2}" y="${y0 - 8}" text-anchor="middle" font-size="16">a</text><text x="${20 + a - b / 2}" y="${y0 + a - b / 2 + 6}" text-anchor="middle" font-size="15" fill="${GR}">b²</text>
<text x="${20 + (a - b) / 2}" y="${y0 + a + 22}" text-anchor="middle" font-size="16" font-weight="700" fill="${C1}">a² − b²</text>`;
  // droite : rectangle (a + b) × (a − b)
  const X = 20 + a + 70, w = a + b, h = a - b;
  const d = `<rect x="${X}" y="${y0 + b}" width="${a}" height="${h}" fill="${C1}" fill-opacity=".22" stroke="${C1}" stroke-width="2"/>
<rect x="${X + a}" y="${y0 + b}" width="${b}" height="${h}" fill="${C2}" fill-opacity=".22" stroke="${C2}" stroke-width="2"/>
<text x="${X + w / 2}" y="${y0 + b - 8}" text-anchor="middle" font-size="16">a + b</text>
<text x="${X + w + 8}" y="${y0 + b + h / 2 + 6}" font-size="16">a − b</text>
<text x="${X + w / 2}" y="${y0 + a + 22}" text-anchor="middle" font-size="16" font-weight="700" fill="${C1}">(a + b)(a − b)</text>`;
  const fl = `<path d="M${20 + a + 14} ${y0 + a / 2} h40" stroke="${GR}" stroke-width="2" marker-end="url(#fiFl)"/>`;
  return `<svg viewBox="0 0 ${X + w + 70} ${y0 + a + 36}" role="img" aria-label="a² moins b² : en recollant la bande, on obtient un rectangle de côtés a plus b et a moins b" font-family="system-ui,sans-serif">
<defs><marker id="fiFl" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto"><path d="M0 0 L10 5 L0 10 z" fill="${GR}"/></marker></defs>
${g}${fl}${d}</svg>`;
}

/** arbre de décision : développer ou factoriser ? */
function arbre() {
  const box = (x, y, w, t, c, sous = '') => `<rect x="${x}" y="${y}" width="${w}" height="${sous ? 54 : 38}" rx="10" fill="#fff" stroke="${c}" stroke-width="2"/><text x="${x + w / 2}" y="${y + 24}" text-anchor="middle" font-size="15" font-weight="700" fill="${c}">${t}</text>${sous ? `<text x="${x + w / 2}" y="${y + 44}" text-anchor="middle" font-size="13" fill="#3d434d">${sous}</text>` : ''}`;
  const l = (x1, y1, x2, y2, t = '') => `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${GR}" stroke-width="2"/>${t ? `<text x="${(x1 + x2) / 2 + (x2 > x1 ? 8 : -8)}" y="${(y1 + y2) / 2}" text-anchor="${x2 > x1 ? 'start' : 'end'}" font-size="13" fill="${GR}">${t}</text>` : ''}`;
  return `<svg viewBox="0 0 640 300" role="img" aria-label="Arbre de décision : un produit ou un carré, on développe ; une somme de termes, on cherche à factoriser" font-family="system-ui,sans-serif">
${box(220, 6, 200, 'J\'ai une expression…', '#1f2328')}
${l(270, 44, 140, 86, 'c\'est un produit / un carré')}${l(370, 44, 500, 86, 'c\'est une somme')}
${box(40, 86, 200, 'DÉVELOPPER', C1, '(somme)² ou (a + b)(a − b)')}
${box(400, 86, 200, 'FACTORISER ?', C2, 'facteur commun d\'abord !')}
${l(500, 140, 410, 190, '2 termes')}${l(540, 140, 600, 190)}
${l(140, 140, 140, 190)}
${box(40, 190, 200, 'a² + 2ab + b²…', C1, 'on applique la formule')}
${box(300, 190, 180, 'a² − b² ?', C3, '→ (a + b)(a − b)')}
${box(490, 190, 145, '3 termes ?', C3, 'a² ± 2ab + b²')}
<text x="320" y="282" text-anchor="middle" font-size="13" fill="#3d434d">Toujours vérifier en redéveloppant le résultat.</text>
</svg>`;
}

export const contenu = `
<h2>En un coup d'œil</h2>
<p class="intro">Trois formules qui transforment un <b>produit</b> en <b>somme</b> (développer) et, lues à l'envers, une <b>somme</b> en <b>produit</b> (factoriser). Elles servent partout : calcul mental, équations, second degré, racines carrées.</p>
<div class="apercu">
  <div><b class="k">① Carré d'une somme</b>(a + b)² = a² + 2ab + b²</div>
  <div><b class="k">② Carré d'une différence</b>(a − b)² = a² − 2ab + b²</div>
  <div><b class="k">③ Produit somme × différence</b>(a + b)(a − b) = a² − b²</div>
</div>
<div class="cols">
  <div><div class="def">Lire de gauche à droite : <b>développer</b> (produit → somme).<br>Lire de droite à gauche : <b>factoriser</b> (somme → produit).</div>
  <div class="retenir">À retenir : le carré d'une somme n'est pas la somme des carrés. Il manque le <b>double produit 2ab</b>.</div></div>
  <div>${carreSomme()}</div>
</div>

<h2>D'où viennent-elles ?</h2>
<p>Ce ne sont pas des formules magiques : c'est la double distributivité, faite une fois pour toutes.</p>
<div class="ex"><span class="q">(a + b)²</span><br>(a + b)² = (a + b)(a + b) = a² + ab + ba + b² = <b>a² + 2ab + b²</b>. Les deux rectangles « ab » de la figure ci-dessus sont le double produit.</div>
<div class="ex"><span class="q">(a + b)(a − b)</span><br>= a² − ab + ba − b² = <b>a² − b²</b> : les termes du milieu s'annulent.</div>
${differenceCarres()}
<p class="intro">Si tu oublies une formule, redéveloppe avec la double distributivité : c'est plus long, mais sûr.</p>

<h2>Reconnaître la situation</h2>
<p>Le plus difficile n'est pas d'appliquer la formule, c'est de <b>voir</b> qu'elle s'applique. Regarde la <b>forme</b> de l'expression.</p>
<div class="tablewrap"><table class="choix">
<tr><th>Si tu vois…</th><th>c'est…</th><th>et tu écris…</th></tr>
<tr><td>(3x + 5)²</td><td>un carré d'une somme ①</td><td>9x² + 30x + 25</td></tr>
<tr><td>(2x − 7)²</td><td>un carré d'une différence ②</td><td>4x² − 28x + 49</td></tr>
<tr><td>(x + 4)(x − 4)</td><td>somme × différence des <b>mêmes</b> termes ③</td><td>x² − 16</td></tr>
<tr><td><span class="nw">x² − 25</span><br><span class="nw">9x² − 1</span><br><span class="nw">(x + 1)² − 16</span></td><td>deux carrés séparés par un <b>−</b> ③ à l'envers</td><td><span class="nw">(x − 5)(x + 5)</span><br><span class="nw">(3x − 1)(3x + 1)</span><br><span class="nw">(x + 1 − 4)(x + 1 + 4)</span></td></tr>
<tr><td><span class="nw">x² + 10x + 25</span><br><span class="nw">4x² − 12x + 9</span></td><td>trois termes : deux carrés et un double produit ① ou ② à l'envers</td><td>(x + 5)²<br>(2x − 3)²</td></tr>
<tr><td>x² + 25</td><td>une <b>somme</b> de carrés</td><td>rien : elle ne se factorise pas (au collège et au lycée)</td></tr>
<tr><td>3x² − 12</td><td>un facteur commun caché</td><td><span class="nw">3(x² − 4)</span> <span class="nw">= 3(x − 2)(x + 2)</span></td></tr>
</table></div>
${arbre()}

<h2>Méthode : développer</h2>
<div class="methode"><b>Méthode</b><ol>
<li>Reconnais la formule (① ② ③) et repère <b>a</b> et <b>b</b> : ce sont des <b>blocs</b>, avec leur coefficient.</li>
<li>Écris la formule avec des parenthèses autour de a et de b : (3x)², 2 × 3x × 5…</li>
<li>Calcule chaque terme. (3x)² = 9x², pas 3x².</li>
<li>Réduis si l'expression continue (autres termes à ajouter ou soustraire).</li></ol></div>
<div class="ex"><span class="q">Exemple 1 : développer (3x + 5)²</span><ol class="pas">
<li>Formule ① avec a = 3x et b = 5.</li>
<li>(3x)² + 2 × 3x × 5 + 5²</li>
<li>= <b>9x² + 30x + 25</b></li></ol></div>
<div class="ex"><span class="q">Exemple 2 : développer et réduire A = (x − 3)² − (x + 2)(x − 2)</span><ol class="pas">
<li>(x − 3)² = x² − 6x + 9 (formule ②).</li>
<li>(x + 2)(x − 2) = x² − 4 (formule ③).</li>
<li>Le signe − devant le produit change tous les signes : A = x² − 6x + 9 − x² + 4.</li>
<li>A = <b>−6x + 13</b>.</li></ol></div>

<h2>Méthode : factoriser</h2>
<div class="methode"><b>Méthode</b><ol>
<li><b>D'abord</b> un facteur commun, s'il y en a un (3x² − 12 = 3(x² − 4)).</li>
<li>Compte les termes. <b>Deux termes</b> séparés par − et tous deux des carrés : formule ③.</li>
<li><b>Trois termes</b> : repère les deux carrés a² et b², puis <b>vérifie</b> que le troisième vaut bien 2ab (au signe près).</li>
<li>Écris le produit, puis <b>vérifie en redéveloppant</b>.</li></ol></div>
<div class="ex"><span class="q">Exemple 3 : factoriser 4x² − 12x + 9</span><ol class="pas">
<li>Carrés : 4x² = (2x)² et 9 = 3². Donc a = 2x, b = 3.</li>
<li>Double produit : 2 × 2x × 3 = 12x. Il est précédé d'un − : formule ②.</li>
<li>4x² − 12x + 9 = <b>(2x − 3)²</b>.</li></ol></div>
<div class="ex"><span class="q">Exemple 4 : factoriser (x + 1)² − 16</span><ol class="pas">
<li>Deux carrés séparés par − : a = x + 1 (un bloc entier !) et b = 4.</li>
<li>a² − b² = (a − b)(a + b) = (x + 1 − 4)(x + 1 + 4).</li>
<li>= <b>(x − 3)(x + 5)</b>.</li></ol></div>
<div class="ex"><span class="q">Exemple 5 : x² + 6x + 4 se factorise-t-il avec ① ?</span><br>Les carrés seraient x² et 4 = 2², donc 2ab = 2 × x × 2 = 4x. Or on a 6x : <b>ce n'est pas</b> une identité remarquable. (En 1re, on utilisera la forme canonique ou le discriminant.)</div>

<h2>À quoi ça sert ? Les mobiliser</h2>
<div class="apercu">
  <div><b class="k">🧠 Calcul mental</b><span class="nw">101² = (100 + 1)²</span> <span class="nw">= 10 000 + 200 + 1</span> <span class="nw">= 10 201</span><br><span class="nw">99² = (100 − 1)²</span> <span class="nw">= 9 801</span><br><span class="nw">49 × 51 = (50 − 1)(50 + 1)</span> <span class="nw">= 2 500 − 1 = 2 499</span></div>
  <div><b class="k">⚖️ Résoudre une équation</b><span class="nw">x² − 9 = 0</span> <span class="nw">⟺ (x − 3)(x + 3) = 0</span> <span class="nw">⟺ x = 3 ou x = −3</span> (produit nul).</div>
  <div><b class="k">📈 Second degré</b><span class="nw">x² + 6x + 1</span> <span class="nw">= (x + 3)² − 9 + 1</span> <span class="nw">= (x + 3)² − 8</span> : c'est la <b>forme canonique</b> (on « complète le carré » avec ①).</div>
  <div><b class="k">√ Racines carrées</b><span class="nw">(√5 − 1)(√5 + 1)</span> <span class="nw">= 5 − 1 = 4</span> : utile pour enlever une racine d'un dénominateur.</div>
  <div><b class="k">🔍 Prouver</b><span class="nw">n² − 1 = (n − 1)(n + 1)</span> : le produit de deux entiers qui encadrent n.</div>
  <div><b class="k">✅ Vérifier un calcul</b>Une factorisation se contrôle toujours en redéveloppant, ou en remplaçant x par une valeur simple (<span class="nw">x = 0</span>, <span class="nw">x = 1</span>).</div>
</div>

<h2>Les pièges classiques</h2>
<div class="warn">
⚠️ (a + b)² ≠ a² + b². Exemple : <span class="nw">(3 + 4)² = 49</span>, mais <span class="nw">3² + 4² = 25</span>. Il manque <span class="nw">2 × 3 × 4 = 24</span>.<br>
⚠️ (3x)² = 9x², pas 3x² : le carré porte sur le coefficient aussi.<br>
⚠️ Dans (a − b)², le double produit est <b>négatif</b> mais b² est <b>positif</b> : <span class="nw">(x − 5)² = x² − 10x <b>+ 25</b></span>.<br>
⚠️ x² − 9 = (x − 3)(x + 3), pas (x − 3)². Et x² + 9 ne se factorise pas.<br>
⚠️ Avant de factoriser avec ③, cherche un facteur commun : <span class="nw">2x² − 50 = 2(x² − 25)</span> <span class="nw">= 2(x − 5)(x + 5)</span>.<br>
⚠️ Un signe − devant une parenthèse change <b>tous</b> les signes de ce qu'elle contient.
</div>
<div class="retenir">À retenir : regarde d'abord la forme (produit ou somme ? combien de termes ? des carrés ?), choisis la formule, repère a et b comme des blocs, puis vérifie en redéveloppant.</div>
`;

export const liens = [
  { module: 'litteral', niveau: 7, texte: 'Double distributivité : d\'où viennent les formules.' },
  { module: 'litteral', niveau: 8, texte: 'Développer avec les identités remarquables.' },
  { module: 'litteral', niveau: 9, texte: 'Développer et réduire des expressions plus longues.' },
  { module: 'litteral', niveau: 11, texte: 'Factoriser avec les identités.' },
  { module: 'poly2', niveau: 5, texte: 'Identités remarquables avec x.' },
  { module: 'poly2', niveau: 6, texte: 'Reconnaître un carré.' },
  { module: 'poly2', niveau: 7, texte: 'Forme canonique : compléter le carré.' },
  { module: 'equations', niveau: 10, texte: 'Équation produit nul après factorisation.' },
  { module: 'equations', niveau: 11, texte: 'Équations x² = a.' },
  { module: 'calcul', niveau: 12, texte: 'Calcul mental : carrés et racines.' },
];

# Ajouter un module

Lire d'abord le [README](README.md) (contrat d'un niveau) et regarder un module existant :
`modules/fractions/levels.js` (types `frac`, `nums`, `cmp`), `modules/inegalites/levels.js` (`iv`, `roots`, prédicats `truth`),
`modules/poly2/levels.js` (`table`, `choice`, graphe toujours affiché).

## Fichiers

1. `modules/<id>/index.html` : copie de `modules/fractions/index.html` où l'on remplace `fractions` par `<id>`
   et la couleur `theme-color`.
2. `modules/<id>/levels.js` : exporte `LEVELS` (exactement 12 niveaux `{ titre, generate(d), cours(), classe }`)
   et `OPTIONS` (`{ need: 4, keys: { neg, comma } }`).
3. Dessins propres au module : `modules/<id>/draw.js` (chaînes SVG). Ne modifier `engine/` que si c'est vraiment
   générique, et le signaler dans la PR.
4. Une entrée dans `modules/registry.js` : `{ id, titre, emoji, classes, groupe, couleur, couleur2, resume }`
   (`groupe` ∈ `GROUPES`, `couleur` assez foncée pour un texte blanc dessus : contraste AA).
5. `node tools/sw-assets.mjs` (liste des fichiers mis en cache hors ligne), puis les tests.

## Règles pédagogiques (voir le cahier des charges)

- 12 niveaux très progressifs : **une seule difficulté nouvelle par niveau**.
- `generate(d)` : `d` = série de réussites en cours (0, 1, 2, 3…). Les paramètres s'élargissent avec `d`
  (négatifs, coefficients ≠ 1, désordre, cas particuliers). Typiquement `d < 1`, `d < 2`, `d < 3`, `d ≥ 3`.
- `hint` : indice **ciblé** (méthode, pas la réponse). `solution` : correction **pas à pas**.
- `check` renvoie un `msg` quand l'erreur est « presque juste » (bonne valeur mal écrite, une solution sur deux,
  signe oublié, unité confondue…). Les fabriques de `engine/answers/checks.js` en gèrent déjà plusieurs.
- `cours()` : titre `<h2>n. …</h2>`, une définition `<div class="def">`, des exemples corrigés `<div class="ex">`,
  les erreurs classiques `<div class="warn">⚠️ …</div>` et **un visuel** (SVG).
- Visuels partout où ils aident. En géométrie : **une figure SVG générée pour chaque exercice** (`visual`).
- Notation française : `M(x)` de `engine/util/fmt.js` (virgule décimale, vrai signe « − »), espaces autour des
  opérateurs, `×` et `÷`, intervalles `]a ; b[`. Réponses « propres » : entiers ou décimaux courts.
- Ton encourageant, phrases courtes, vocabulaire du programme. Pas de dérivée avant la 1re.

## Règles techniques

- Aléatoire : **uniquement** `ri, pick, nz, shuffle, chance, prenom, random` de `engine/util/rand.js`
  (jamais `Math.random`, sinon les tests ne sont pas reproductibles).
- Aucune dépendance réseau, aucun `import` externe. Pas de DOM dans `levels.js` (il est importé par Node pour les tests).
- Réponses compatibles avec le pavé : 7 chiffres au plus, 3 décimales au plus ; `keys: { comma: true }` si la
  réponse peut être décimale, `keys: { neg: false }` si elle ne peut pas être négative.
- Types de réponse : `nums` (gabarit `tpl` avec `{0}`, `{1}`…), `frac`, `steps` (plusieurs lignes
  `<div class="stepline">… {0}</div>` avec `stepsCheck`), `roots`, `choice` (`opts: [{v, l}]`), `cmp` (`<`, `=`, `>`),
  `iv` (intervalles), `table` (tableau de signes, `xs`).
- **Vérification indépendante obligatoire** dès que possible : `value` (valeur numérique de la réponse recalculée
  autrement, par exemple en flottants à partir des données de l'énoncé), `truth(x)` (pour `iv` : x est-il solution
  de l'inéquation d'origine ? pour `roots` : x est-il racine ?), ou `verify(expected)` (fonction booléenne).

## Tests

```
npm ci
MODULE=<id> npm test                       # 500 exercices × 12 niveaux × d = 0…5
PW_PORT=8130 npx playwright test -g "<id> :"   # un port libre par copie de travail
```

Puis **regarder** les captures `tests/e2e/captures/<id>-*.png` (portrait 800 × 1280 et paysage 1280 × 800) :
pas de chevauchement, pas de texte coupé, figures lisibles. Enfin `npm test` complet avant la PR.

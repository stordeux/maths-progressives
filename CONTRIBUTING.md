# Ajouter un module

Lire d'abord le [README](README.md) (contrat d'un niveau) et regarder un module existant :
`modules/fractions/levels.js` (types `frac`, `nums`, `cmp`), `modules/inegalites/levels.js` (`iv`, `roots`, prédicats `truth`),
`modules/poly2/levels.js` (`table`, `choice`, graphe toujours affiché).

## Fichiers

1. `modules/<id>/index.html` : copie de `modules/fractions/index.html` où l'on remplace `fractions` par `<id>`
   et la couleur `theme-color`.
2. `modules/<id>/levels.js` : exporte `LEVELS` (exactement 12 niveaux `{ titre, generate(d), cours(), classe }`)
   et `OPTIONS` (`{ need: 4, keys: { neg, comma } }`).
3. Dessins propres au module : `modules/<id>/draw.js` (chaînes SVG). Styles propres : `modules/<id>/style.css`, relié dans la page et signalé par `css: true` au registre (la révision brevet le charge aussi). Ne modifier `engine/` que si c'est vraiment
   générique, et le signaler dans la PR.
4. Une entrée dans `modules/registry.js` : `{ id, titre, emoji, classes, groupe, couleur, couleur2, resume }`
   (`groupe` ∈ `GROUPES`, `couleur` assez foncée pour un texte blanc dessus : contraste AA).
5. `node tools/sw-assets.mjs` (liste des fichiers mis en cache hors ligne), puis les tests.

## Règles pédagogiques (voir le cahier des charges)

- 12 niveaux très progressifs : **une seule difficulté nouvelle par niveau**.
- `generate(d)` : `d` = série de réussites en cours (0, 1, 2, 3…). Les paramètres s'élargissent avec `d`
  (négatifs, coefficients ≠ 1, désordre, cas particuliers). Typiquement `d < 1`, `d < 2`, `d < 3`, `d ≥ 3`.
- **Assez d'énoncés différents** : à chaque nombre d'étoiles, un niveau doit pouvoir tirer au moins **20 énoncés
  différents** (`node tools/reservoirs.mjs <id>` les compte ; test `tests/unit/repetitions.test.mjs`). Le moteur évite
  de redonner l'un des 10 derniers énoncés (`engine/util/repet.js`), mais il ne peut rien si le niveau n'en a que six.
  Une notion qui n'en a vraiment pas 20 se déclare, avec sa raison, dans `EXCEPTIONS` de `tools/reservoirs.mjs`.
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

# Ajouter une fiche de synthèse

Une fiche est une page de lecture transversale (un grand thème, plusieurs modules), affichée par
`fiches/index.html?f=<id>`. Modèle : `fiches/identites.js`.

1. `fiches/<id>.js` exporte `contenu` (HTML fixe, sans aléatoire) et `liens` (`[{ module, niveau, texte }]`,
   niveaux 1 à 12 de modules prêts : ce sont les cartes « S'entraîner »).
2. Une entrée dans `fiches/registry.js` (`etat: 'bientot'` tant qu'elle n'est pas prête).
3. Structure attendue, chaque partie en `<h2>` (le plan cliquable est généré à partir des h2) :
   **En un coup d'œil** (vue d'ensemble : cartes `.apercu`, schéma SVG), **d'où ça vient**,
   **reconnaître / choisir l'outil** (tableau `table.choix` « si tu vois… → c'est… → tu écris… » et/ou arbre de
   décision SVG), **méthodes** avec exemples pas à pas (`ol.pas`), **à quoi ça sert**, **pièges** (`.warn`),
   **À retenir** (`.retenir`). Classes dans `assets/css/fiche.css` (plus celles du cours : `.def`, `.methode`, `.ex`).
   Formules qui ne doivent pas être coupées en fin de ligne : `<span class="nw">…</span>`.
4. `node tools/sw-assets.mjs`, `npm test`, `npx playwright test -g "fiche <id>"`, puis regarder les captures
   `tests/e2e/captures/fiche-<id>-*.png`.

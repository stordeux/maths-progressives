# Maths progressives

Des modules d'entraînement en mathématiques, du collège au début du lycée, qui **s'adaptent tout seuls au niveau de l'élève**.
Pensé d'abord pour une **tablette Android d'entrée de gamme**, au doigt ou au stylet, dans le navigateur.

**Site : https://stordeux.github.io/maths-progressives/**

Gratuit, sans compte, sans publicité, sans traceur. Rien n'est envoyé sur Internet, sauf les messages que l'élève écrit lui-même avec le bouton 🐞 (texte, capture de l'écran, exercice en cours) : la progression reste sur l'appareil.

## Sur la tablette

1. Ouvrir l'adresse ci-dessus dans Chrome (une connexion est nécessaire la première fois).
2. Menu ⋮ du navigateur → **« Ajouter à l'écran d'accueil »** (ou « Installer l'application »).
3. L'icône 🧮 lance le site en plein écran. Il marche ensuite **sans connexion**.

La progression est enregistrée dans le navigateur de la tablette. Pour la passer sur un autre appareil :
accueil → **Ma progression** → **Exporter** (code à recopier ou fichier `.json`), puis **Importer** sur l'autre appareil.

## Comment ça marche

- **12 niveaux par module**, chacun n'ajoute qu'une difficulté nouvelle.
- **Dans un niveau aussi**, les exercices se corsent à chaque réussite (nombres négatifs, coefficients, termes dans le désordre…).
- **On monte** d'un niveau après **4 réussites d'affilée** (5 réussites *rapides* ⚡ en calcul mental).
  Une réussite ne compte que si elle est obtenue du premier coup et sans indice.
- **On redescend** d'un niveau après **2 exercices ratés de suite**. Un bandeau annonce chaque changement.
- **Erreur → indice → deuxième essai → correction détaillée.** Quand la réponse est « presque juste »
  (bonnes bornes mais mauvais crochets, fraction égale mais pas simplifiée…), le message le dit.
- **Un cours par niveau** (définition, exemples, erreurs classiques ⚠️, visuel), **replié au-dessus de l'exercice** : l'élève le déplie quand il en a envie (bandeau 📘 ou bouton 📘 Cours) et le relit sans quitter l'exercice.
- **Brouillon** au stylet (pression prise en compte, rouge, gomme) ; **pavé numérique** à l'écran : le clavier système ne s'ouvre jamais. Le clavier physique marche aussi.
- Réglages : police plus lisible, caractères plus grands ; bouton 🔊 pour lire la consigne à voix haute.

## Modules

| Module | Classes | Domaine |
|---|---|---|
| ⚡ Calcul mental | 6e – 3e | Calcul |
| 🍕 Fractions | 6e – 4e | Calcul |
| 🌡️ Nombres relatifs | 5e – 4e | Calcul |
| 🪜 Priorités opératoires | 5e – 4e | Calcul |
| 🚀 Puissances | 4e – 3e | Calcul |
| 🔤 Calcul littéral | 4e – 3e | Calcul |
| ⚖️ Équations | 4e – 3e | Calcul |
| 📊 Proportionnalité et pourcentages | 6e – 3e | Proportionnalité et données |
| 🎲 Statistiques et probabilités | 5e – 3e | Proportionnalité et données |
| 🚆 Trains, durées et vitesses | 5e – 3e | Proportionnalité et données |
| 📐 Théorème de Pythagore | 4e | Géométrie |
| 🔺 Thalès et trigonométrie | 3e | Géométrie |
| 🧊 Aires, périmètres, volumes | 6e – 3e | Géométrie |
| 📏 Angles | 6e – 5e | Géométrie |
| 〰️ Fonctions | 3e – 2de | Vers le lycée |
| ↔️ Inégalités | 3e – 2de | Vers le lycée |
| 📈 Second degré | 2de – 1re | Vers le lycée |
| ➡️ Vecteurs et droites | 2de | Vers le lycée |
| 🔢 Suites | 1re | Lycée (1re – Tle) |
| ⭕ Trigonométrie | 1re | Lycée (1re – Tle) |
| 🌳 Probabilités conditionnelles | 1re – Tle | Lycée (1re – Tle) |
| 🌱 Exponentielle et logarithme | 1re – Tle | Lycée (1re – Tle) |
| 📉 Dérivées | 1re | Lycée (1re – Tle) |
| ∫ Intégrales | Terminale | Lycée (1re – Tle) |
| 🎓 Révision brevet | 3e | Transversal |

## Pour les développeurs

HTML, CSS et JavaScript « vanilla » en modules ES, **sans étape de build** et **sans dépendance réseau** à l'exécution.
Les modules ES exigent un serveur (GitHub Pages, ou `npm run serve` en local) : ouvrir `index.html` en `file://` ne marche pas dans Chrome.

```
index.html, manifest.webmanifest, sw.js   accueil, PWA hors ligne
assets/css/base.css                        thème commun (variables CSS, grands boutons tactiles)
engine/engine.js                           boucle d'exercice, adaptation, bandeaux, cours, menu
engine/answers/                            types de réponse (nums, frac, steps, roots, choice, cmp, iv, table) et fonctions check
engine/keypad.js, scratchpad.js            pavé numérique, brouillon
engine/draw/                               SVG : droite graduée, droite réelle, courbes, figures
engine/util/                               aléatoire avec graine, arithmétique, formatage français
modules/registry.js                        liste des modules (accueil, tests)
modules/<id>/index.html, levels.js         une page de quelques lignes + les 12 niveaux
tests/unit/                                tests Node des générateurs et du site
tests/e2e/                                 tests Playwright
tools/                                     serveur local, liste des fichiers du service worker, icônes
```

### Contrat d'un niveau

`levels.js` exporte `LEVELS` (12 objets `{ titre, generate(d), cours(), classe? }`) et `OPTIONS` (`{ need, keys }`).
`generate(d)` reçoit `d` = la série de réussites en cours et renvoie :

```js
{
  type,          // 'nums' | 'frac' | 'steps' | 'roots' | 'choice' | 'cmp' | 'iv' | 'table'
  html,          // énoncé
  visual,        // SVG affiché avec l'énoncé (facultatif)
  afterVisual,   // SVG ajouté après la réponse (facultatif ; replaceVisual: true pour remplacer)
  tpl, opts, xs, // gabarit des cases ({0}, {1}…), choix [{v, l}], abscisses du tableau de signes
  keys,          // touches du pavé : { neg, comma }
  check,         // check(answer) → { ok, msg?, bad? } ; fabriques dans engine/answers/checks.js
  hint, solution,
  expected,      // réponse canonique (sinon check.expected)
  value, truth, verify // vérifications indépendantes utilisées par les tests
}
```

L'« answerSpec » du cahier des charges est porté directement par ces champs (`type`, `tpl`, `opts`, `xs`, `keys`).

### Tests

```
npm install
npm test               # générateurs : 500 exercices × 12 niveaux × d = 0…5 par module
npx playwright install chromium
npx playwright test    # Chrome 800 × 1280 et 1280 × 800, captures dans tests/e2e/captures/
node tools/sw-assets.mjs   # après avoir ajouté ou modifié un fichier servi (version du cache hors ligne)
```

Les tests des générateurs vérifient : aucun `NaN`, `undefined` ou `Infinity` dans les textes ; la réponse attendue est acceptée
et une réponse fausse refusée ; la justesse mathématique par un calcul **indépendant** (`value`), une force brute pour les racines,
un échantillonnage point par point des ensembles solutions (`truth`) ; que la réponse tient dans le pavé.

La CI GitHub Actions lance tous les tests à chaque push et ne déploie sur GitHub Pages que si tout passe.

### Choix faits par défaut

- Dépôt `stordeux/maths-progressives`, site publié par GitHub Actions.
- Fractions : on monte après 4 réussites (3 dans la version d'origine) et un cours par niveau a été ajouté.
- Les quatre pages d'origine ont été reprises sans perte : mêmes générateurs, cours, indices et corrections.
- Données : `localStorage`, une clé `mp:<module>` par module ; tout accès est protégé, le site reste utilisable sans stockage.

## Licences

Code : **MIT**. Contenus pédagogiques (cours, énoncés, indices, corrections) : **CC BY-SA 4.0**. Voir [LICENSE](LICENSE).

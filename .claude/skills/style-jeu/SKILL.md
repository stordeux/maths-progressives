---
name: style-jeu
description: Habillage « jeu » de Maths progressives (thèmes, couleurs, boutons en relief, fêtes d'étoiles, série 🔥) et règles pour le changer sans casser la capture 🐞 ni les tests. À charger avant de toucher au style (assets/css, engine/fete.js, engine/couleurs.js), d'ajouter un thème, ou de créer un module (pour qu'il suive le style).
---

# Style « jeu » de Maths progressives

## Où est quoi
- `assets/css/base.css` : mise en page et variables (`--bg`, `--card`, `--ink`, `--acc`, `--acc2`, `--good`…). Apparence « Sobre ».
- `assets/css/theme.css` : habillage par thème, chargé par **chaque page après base.css** (test `tests/unit/theme.test.mjs`).
  Le thème « jeu » est le défaut : règles sous `:root:not([data-theme="sobre"])`. Un nouveau thème = un bloc
  `:root[data-theme="nom"]` + son entrée dans `THEMES` (`engine/engine.js`) ; réglage « Style » (accueil et menu Niveaux).
- `engine/couleurs.js` : teintes dérivées de la couleur du module (`--fonce`, `--pale`, `--point`, `--tres-pale` ;
  sur l'accueil `--c-…` par carte). **Jamais de `color-mix()` en CSS** : html2canvas (capture du 🐞) échoue.
- `engine/fete.js` : étoile qui s'envole de la réponse vers l'en-tête (`popEtoile`), gerbe, pluie (niveau débloqué),
  couronne + médaille (titre), étoiles perdues, `anime(el, classe)` (éclat vert, secousse). Rien si
  `prefers-reduced-motion`. Calque `.fete` sans clics.
- Série 🔥 : `afficherSerie(n)` (engine) ; pastille `#combo` dans l'en-tête, bandeau toutes les 5 réussites.

## Règles
- Un module ne fixe que `couleur` et `couleur2` dans `modules/registry.js` ; pas de couleurs en dur dans son CSS
  (utiliser `var(--acc)`, `var(--acc2)`, `var(--pale)`…), sinon le thème ne le suit pas.
- Boutons : classes `.btn` / `.btn.ghost` (relief automatique). Cartes : `.card`.
- Garder les identifiants du moteur (`#lvlName`, `#dots`, `#score`, `#fb`, `#banner`…) : les tests e2e s'en servent.
- Vérifier : `node --test tests/unit/theme.test.mjs`, Playwright `-g "signaler|accueil|fêtes"`, puis captures
  1280×800 et 400×860 (accueil, un module, calcul mental), en thème Jeu et Sobre.

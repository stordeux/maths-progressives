---
name: publier-maths-progressives
description: Publier un changement de Maths progressives (stordeux.github.io/maths-progressives) sans casse - sw.js, tests unitaires et e2e, déploiement GitHub Actions, vérification en ligne. À charger avant un push sur main, quand un déploiement échoue, ou quand une tablette ne voit pas la nouvelle version.
---

# Publier Maths progressives

Un push sur `main` lance « Tests et déploiement » (GitHub Actions) : tests, puis déploiement GitHub Pages des seuls
fichiers servis (`index.html sw.js manifest.webmanifest assets engine modules fiches`). `docs/`, `relais/`, `tools/`
et `.claude/` ne sont pas publiés.

## Avant de pousser
1. `node tools/sw-assets.mjs` (liste du cache hors ligne et version ; un test vérifie qu'elle est à jour).
2. `npm test` (tous les tests unitaires) et `PW_PORT=81xx npx playwright test` (port libre si une autre copie teste).
3. Regarder les captures touchées dans `tests/e2e/captures/` (portrait 800 × 1280, paysage 1280 × 800).
4. Jamais de mention de Claude dans les commits. Gros travail : branche ou worktree, fusion après tests.

## Après le push
- `gh run list -R stordeux/maths-progressives -L 3`, puis `gh run watch <id> -R stordeux/maths-progressives --exit-status`.
- Des runs « cancelled » sont normaux quand on pousse plusieurs fois de suite (concurrence) : seul le dernier compte.
- Vérifier en ligne : `curl -s "https://stordeux.github.io/maths-progressives/<fichier>?t=$RANDOM" | grep …`.

## Pièges vus
- **Déploiement « No artifacts named github-pages »** (incident GitHub) : ne pas relancer le job seul
  (`gh run rerun --failed` échoue ensuite avec « Multiple artifacts ») ; pousser un nouveau commit, qui redéploie tout.
- Une tablette ou Chrome garde l'ancienne version (service worker) un ou deux rechargements.
- Le compteur GoatCounter n'est chargé que sur `stordeux.github.io` (ni en local ni dans les tests) ; un test interdit
  toute autre ressource externe (`tests/unit/site.test.mjs`).
- Promesses publiques à garder exactes (README, accueil, post LinkedIn) : pas de cookie, compteur qui ne suit pas les
  personnes, progression jamais envoyée ; seuls partent les messages écrits par l'élève (bouton 🐞).

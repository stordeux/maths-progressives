---
name: creer-module
description: Créer un nouveau module de Maths progressives (12 niveaux, cours et exercices) avec un sous-agent, le relire, le fusionner et le publier. À charger quand S. Tordeux demande un nouveau module, un chapitre manquant du programme, ou de « créer les cours de … », et avant de lancer ou relancer un sous-agent sur un module.
---

# Créer un module (avec un sous-agent)

## Accord d'abord
S. Tordeux économise ses jetons : proposer le plan (modules, niveaux, nombre d'agents, coût ≈ 500 000 jetons par
module corrections comprises) et **attendre un « lance » / « oui fais tout » explicite** avant tout Agent.
Au plus **3 sous-agents à la fois** (Sonnet), un par module, nommés « MILA — <id> ».

## Consigne type d'un sous-agent (à adapter : id, titre, emoji, classes, groupe, port, niveaux)
- À lire : mémoire `C--Users-stordeux-COURS-MILA/memory`, `README.md`, `CONTRIBUTING.md` (en entier), skills
  `audit-cours-exercices` et `publier-maths-progressives`, `docs/PROGRAMMES-COLLEGE.md`, 2 ou 3 modules modèles proches,
  `engine/answers/`, `engine/util/rand.js`, `engine/util/fmt.js`, `tests/`.
- Où : `git worktree add /c/Users/stordeux/COURS/MILA-<id> -b cours/<id>` puis `npm ci` ; travailler seulement là ;
  push de la branche ; **jamais main** ; **jamais de mention de Claude dans les commits** ; port Playwright propre
  (`PW_PORT=81xx`, un par agent) ; dans `modules/registry.js` et le README, **seulement sa ligne**.
- Les 12 niveaux proposés, une seule difficulté nouvelle par niveau (l'agent peut ajuster et doit le dire).
- **Exigences de S. Tordeux, à écrire en toutes lettres :**
  1. **L'indice (`hint`) est en rapport direct avec la question posée** : il parle des nombres, points, figures de
     CET exercice et de la méthode à appliquer ici, sans donner la réponse ; jamais d'indice générique de niveau.
  2. **Le cours de chaque niveau contient un exemple corrigé de chaque forme d'exercice tirée**, à toutes les
     difficultés d, même présentation de la réponse ; vérifier avec `node tools/audit-cours.mjs <id>`.
- Le reste de CONTRIBUTING : `generate(d)` qui se corse (d = 0…5, tiré des étoiles), solution pas à pas, messages
  « presque juste », cours (définition, exemples, ⚠️, « À retenir », visuel SVG), visuels par exercice, vérification
  indépendante, pavé, aléatoire de `rand.js`, notation française, ton encourageant ; données réalistes (sinon fictives et annoncées).
- Fin : `node tools/sw-assets.mjs`, `npm test`, `npx playwright test -g "<id>|accueil"`, regarder les captures,
  acquis dans la mémoire du projet, rapport court et vérifié.

## Relecture par l'agent principal (avant toute fusion)
1. `git log main..cours/<id>` : pas de mention de Claude ; `npm test` dans le worktree.
2. `node tools/audit-cours.mjs <id>` : chaque forme tirée a son exemple ; sinon renvoyer l'agent (SendMessage, il garde son contexte).
3. Tirer des exercices concrets à d = 0…5 (énoncé, **indice**, fin de solution) : indices propres à l'exercice,
   réponses justes, données plausibles, français correct (« du Havre », accords, « x² » et non « (x)² »).
4. Regarder des captures (cours, juste, correction ; portrait et paysage).
5. Fusion `--no-ff` dans main, `node tools/sw-assets.mjs --check`, `npm test`, push, suivre le déploiement
   (skill `publier-maths-progressives`), `git worktree remove`.
6. Ligne dans `docs/RETOURS.md` et mise à jour de `docs/PROGRAMMES-COLLEGE.md` (❌ → ✅) et de `~/DESCRIPTION/A_FAIRE.md`.

## Pièges vus
- Agent coupé par une erreur réseau (ENOTFOUND) : le relancer par SendMessage (« git pull, git status, git log, puis reprends »).
- Plusieurs branches modifient `registry.js`, `README.md` et `sw.js` : fusionner une par une, régénérer `sw.js` après chaque fusion.
- Un premier rendu avait des gares réelles avec de fausses distances : toujours vérifier la vraisemblance des données.

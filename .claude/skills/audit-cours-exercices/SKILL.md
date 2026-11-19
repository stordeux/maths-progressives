---
name: audit-cours-exercices
description: Vérifier qu'un cours de Maths progressives couvre toutes les formes d'exercices que son niveau peut tirer, et le compléter. À charger quand un élève dit que le cours ne correspond pas aux exercices, après la création ou la modification d'un module, ou pour relire les cours module par module.
---

# Audit cours ↔ exercices

Règle (retour d'élève du 2026-11-18) : **chaque forme d'énoncé qu'un niveau peut tirer, à toutes les difficultés d,
a un exemple corrigé de la même forme dans le cours de ce niveau**, avec la même présentation de la réponse.

## Méthode, un module à la fois (S. Tordeux veut économiser ses jetons)
1. `node tools/audit-cours.mjs <module>` : pour chaque niveau, les titres des exemples du cours (`<span class="q">`)
   et les formes d'énoncés tirées (nombres → #, prénoms → X), avec la plus petite d où chacune apparaît.
2. Pour un niveau douteux, regarder des exercices concrets (énoncé et fin de la solution) à d = 0…5 et le texte du
   cours. Vérifier par une recherche que la notion n'est pas déjà ailleurs dans le cours (exemple, ⚠️, définition)
   **avant** d'ajouter quoi que ce soit (erreur déjà commise : ajout annoncé alors que le cours l'avait déjà).
3. Ajouter l'exemple manquant après le dernier exemple du niveau (`<div class="ex"><span class="q">…</span><br>…</div>`,
   ou l'aide `ex()` / `exq()` du module). Calculs vérifiés à la main. Insérer avec un script qui **échoue** si la
   ligne repère n'est pas trouvée, puis vérifier que `cours()` se génère sans `undefined` ni `NaN`.
4. Corriger en passant les défauts d'affichage repérés (« (x)² », « de Le Havre », « 1 coloriées »).
5. `node tools/sw-assets.mjs`, `npm test`, `PW_PORT=81xx npx playwright test -g "<module> :"` (skill `publier-maths-progressives`).
6. Une ligne dans `docs/RETOURS.md` (tableau « Suivi, module par module ») : ce qui est **repris**, ce qui ne l'est
   pas et pourquoi. Commit, push (publie le site).

## Formes souvent oubliées (relecture de 2026-11)
Mode « trouve toi-même les calculs » après 2 réussites (Priorités) ; remplacer une lettre par un relatif ; fraction > 1
ou résultat entier ; durées de 20 ou 40 min ; vocabulaire (premier, multiple, strictement, et / ou) ; cas « ni paire
ni impaire » ; extremums locaux de degré 3 ; complétion du carré ; formulation « alignés dans cet ordre ».
Bilan de la relecture complète : fin de `docs/RETOURS.md`.

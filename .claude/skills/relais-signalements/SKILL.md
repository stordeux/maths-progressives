---
name: relais-signalements
description: Relais Cloudflare du bouton 🐞 de Maths progressives (tickets GitLab). À charger quand les élèves ne peuvent plus envoyer de message, quand des tickets n'arrivent plus, pour renouveler la clé GitLab (expire le 2027-11-18), redéployer le Worker signalements-maths, ou toucher à engine/signaler.js ou relais/.
---

# Relais des signalements (bouton 🐞)

## Chaîne
Bouton 🐞 (`engine/signaler.js`, constante `RELAIS`) → POST multipart (message, contexte, capture) →
Cloudflare Worker `signalements-maths` (`relais/`, https://signalements-maths.sebastien-tordeux.workers.dev) →
API GitLab : ticket **confidentiel**, étiquette `signalement`, capture jointe, dans gitlab.inria.fr/tordeux/signalements-exercices
→ e-mail à l'adresse Inria de S. Tordeux (projet en « Watch »). Pas de secours par e-mail (choix de S. Tordeux) :
sans connexion, l'élève garde son texte et réessaie.

## Comptes
- Cloudflare : offre Workers Free (aucune facturation sans souscription), compte gmail de S. Tordeux,
  sous-domaine `sebastien-tordeux.workers.dev` (attribué tout seul au premier déploiement).
- GitLab : clé de projet `relais-signalements`, rôle **Guest** suffit, droit **`api`**, **expire le 2027-11-18**
  (noté dans `~/DESCRIPTION/A_FAIRE.md`). GitLab Inria impose une date : laissée vide, la clé expire le jour même.

## Renouveler la clé (ou panne « GitLab a refusé le ticket (401) »)
1. Ouvrir https://gitlab.inria.fr/tordeux/signalements-exercices/-/settings/access_tokens → *Add new token*.
   Claude peut préremplir nom, description, rôle et date ; **S. Tordeux coche `api` et clique Create** (la case `api`
   est refusée à Claude), puis copie la clé. Claude ne voit **jamais** la clé.
2. **Dans un terminal à part** (PowerShell ou Git Bash ; pas `!` dans Claude Code, la commande est interactive) :
   `cd ~/COURS/MILA/relais` puis `npx wrangler secret put GITLAB_TOKEN`, et coller la clé.
3. Vérifier la colonne **Expires** de la page des clés (survoler pour la date exacte), puis faire un ticket de test.
   Plusieurs clés peuvent porter le même nom : lire les colonnes rôle, expiration et dernière utilisation.
4. Supprimer l'ancienne clé (🗑 puis confirmer) seulement après le test.

## Déployer le relais
`cd relais && npx wrangler deploy` — **wrangler 3** (le poste a Node 21 ; wrangler 4 exige Node ≥ 22.12).
`npx wrangler login` une fois (autorisation OAuth dans le navigateur, par S. Tordeux). « fetch failed » : relancer.
`npx wrangler secret list` montre si `GITLAB_TOKEN` est posé (sans sa valeur).

## Tester
- `curl -s https://signalements-maths.sebastien-tordeux.workers.dev/` → `{"ok":true,…}`.
- POST avec `Origin: https://evil.example` → `origine refusée`.
- Vrai envoi : Playwright sur le site publié (ouvrir un module, `#sigBtn`, remplir `#sigTexte`, `#sigDirect`,
  attendre « Message envoyé »). Un curl depuis Git Bash abîme les accents ; le relais n'y est pour rien.
- Vérifier le ticket (confidentiel, étiquette, capture) et l'e-mail dans Zimbra (chercher « signalements-exercices »).
- Fermer les tickets de test.

## Pièges vus
- Une tablette garde l'ancienne version du site (cache hors ligne) pendant un ou deux chargements.
- Les tests e2e simulent le relais (`window.__sigRelais = 'https://relais.test/…'` et `page.route`).
- Ne jamais écrire de texte entre accents graves dans un heredoc non protégé : le shell l'exécute
  (une commande `npx wrangler secret put` s'est lancée ainsi par erreur le 2026-11-18).

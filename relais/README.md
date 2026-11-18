# Relais des signalements (Cloudflare Worker `signalements-maths`)

Le bouton 🐞 de l'application envoie le message, le contexte de l'exercice et la capture d'écran à ce relais
(`POST /signaler`, formulaire multipart), qui crée un **ticket confidentiel** (étiquette `signalement`) dans le
projet privé gitlab.inria.fr/tordeux/signalements-exercices. Le projet est en « Watch » : un e-mail part à chaque ticket.

- Code : `src/index.js` ; configuration : `wrangler.toml` (limiteur : 10 envois par minute et par IP).
- Origines acceptées : https://stordeux.github.io et localhost. Message ≤ 4 000 caractères, capture ≤ 4 Mo.
- Secret `GITLAB_TOKEN` : clé d'accès du projet `relais-signalements` (rôle Reporter, droit `api`), jamais dans git.
- wrangler 3 (le poste a Node 21 ; wrangler 4 demande Node ≥ 22.12).

```
cd relais
npm ci
npx wrangler login                     # une fois, autorisation dans le navigateur
npx wrangler secret put GITLAB_TOKEN   # coller la clé GitLab (à refaire quand elle expire)
npx wrangler deploy
```

Si la clé expire ou si le relais tombe, l'application propose l'envoi par messagerie en secours.

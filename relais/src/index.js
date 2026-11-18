// Relais des signalements de Maths progressives (Cloudflare Worker).
// L'application envoie ici le message, le contexte de l'exercice et la capture d'écran ; le relais crée un
// ticket confidentiel dans le projet privé gitlab.inria.fr/tordeux/signalements-exercices (capture jointe).
// La clé GitLab (secret GITLAB_TOKEN, clé de projet « Reporter », droit api) ne quitte jamais le relais.

const GITLAB = 'https://gitlab.inria.fr/api/v4/projects/tordeux%2Fsignalements-exercices';
const ORIGINES = [/^https:\/\/stordeux\.github\.io$/, /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/];
const MAX_TEXTE = 4000;            // caractères du message de l'élève
const MAX_CONTEXTE = 8000;         // caractères du contexte (énoncé, réponse attendue…)
const MAX_IMAGE = 4 * 1024 * 1024; // octets

function cors(origine) {
  const ok = origine && ORIGINES.some(r => r.test(origine));
  return {
    'Access-Control-Allow-Origin': ok ? origine : 'https://stordeux.github.io',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Max-Age': '86400',
    Vary: 'Origin',
  };
}
const reponse = (h, status, corps) => new Response(JSON.stringify(corps), { status, headers: { ...h, 'Content-Type': 'application/json; charset=utf-8' } });

/** texte brut → Markdown sans risque (pas de mentions @, pas de références #, pas de HTML) */
function echapper(s) {
  return String(s).replace(/[\\`*_{}[\]<>#@!|~]/g, c => '\\' + c);
}

export default {
  async fetch(req, env) {
    const origine = req.headers.get('Origin');
    const h = cors(origine);
    if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: h });
    const url = new URL(req.url);
    if (req.method === 'GET' && url.pathname === '/') return reponse(h, 200, { ok: true, service: 'relais des signalements de Maths progressives' });
    if (req.method !== 'POST' || url.pathname !== '/signaler') return reponse(h, 404, { ok: false, erreur: 'introuvable' });
    if (!origine || !ORIGINES.some(r => r.test(origine))) return reponse(h, 403, { ok: false, erreur: 'origine refusée' });
    if (!env.GITLAB_TOKEN) return reponse(h, 500, { ok: false, erreur: 'relais non configuré' });

    // au plus 10 signalements par minute et par adresse IP (limiteur de Cloudflare, s'il est configuré)
    if (env.LIMITEUR) {
      const ip = req.headers.get('CF-Connecting-IP') || 'inconnue';
      const { success } = await env.LIMITEUR.limit({ key: ip });
      if (!success) return reponse(h, 429, { ok: false, erreur: 'trop de signalements, réessaie dans une minute' });
    }

    let form;
    try { form = await req.formData(); } catch (e) { return reponse(h, 400, { ok: false, erreur: 'formulaire illisible' }); }
    const message = String(form.get('message') || '').trim().slice(0, MAX_TEXTE);
    const contexte = String(form.get('contexte') || '').slice(0, MAX_CONTEXTE);
    const titre = String(form.get('titre') || 'Signalement').replace(/\s+/g, ' ').slice(0, 200);
    const image = form.get('capture');
    if (!message && !(image && image.size)) return reponse(h, 400, { ok: false, erreur: 'message vide' });

    const auth = { 'PRIVATE-TOKEN': env.GITLAB_TOKEN };
    let capture = '';
    if (image && typeof image === 'object' && image.size) {
      if (image.size > MAX_IMAGE || !/^image\/(png|jpeg|webp)$/.test(image.type)) return reponse(h, 413, { ok: false, erreur: 'capture trop grosse ou format refusé' });
      const fd = new FormData();
      fd.append('file', image, image.name || 'capture.png');
      const r = await fetch(`${GITLAB}/uploads`, { method: 'POST', headers: auth, body: fd });
      if (r.ok) capture = (await r.json()).markdown || '';
      else capture = `_(capture non jointe : erreur GitLab ${r.status})_`;
    }

    const description = [
      '### Message', '', message ? echapper(message) : '_(pas de message)_', '',
      '### Capture', '', capture || '_(pas de capture)_', '',
      '### Contexte', '', '```text', contexte.replace(/```/g, "'''"), '```', '',
      `_Envoyé par le bouton 🐞 de Maths progressives, ${new Date().toISOString()}._`,
    ].join('\n');
    const r = await fetch(`${GITLAB}/issues`, {
      method: 'POST',
      headers: { ...auth, 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: titre, description, confidential: true, labels: 'signalement' }),
    });
    if (!r.ok) return reponse(h, 502, { ok: false, erreur: `GitLab a refusé le ticket (${r.status})` });
    const ticket = await r.json();
    return reponse(h, 201, { ok: true, numero: ticket.iid });
  },
};

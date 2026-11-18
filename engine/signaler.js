// Bouton « Signaler une erreur » (inspiré de PMS_SCAN) : capture de l'écran visible, texte libre,
// contexte ajouté automatiquement (module, niveau, énoncé, réponse attendue, appareil).
// Pas de serveur : l'envoi passe par le menu « Partager » de l'appareil (Android : Gmail, etc.)
// ou, s'il ne sait pas partager une image, par l'enregistrement de la capture + un e-mail pré-rempli.
//
// ⚠️ html2canvas REDESSINE la page (ce n'est pas une photo de l'écran) : de petits écarts de rendu
// sont possibles. Le brouillon (canvas) est bien repris : l'élève peut y entourer l'erreur avant.

// Service Desk du projet privé gitlab.inria.fr/tordeux/signalements-exercices :
// chaque e-mail reçu devient un ticket confidentiel (capture jointe comprise).
export const DESTINATAIRE = 'gitlab-reply+tordeux-signalements-exercices-73682-issue-@inria.fr';
let contexte = () => ({});
let prefixe = '../../';

/** fixe la fonction qui décrit l'exercice en cours (appelée au moment du signalement) */
export function setContexte(fn) { contexte = fn; }

function chargerHtml2canvas() {
  if (window.html2canvas) return Promise.resolve(window.html2canvas);
  return new Promise((ok, ko) => {
    const s = document.createElement('script');
    s.src = prefixe + 'engine/vendor/html2canvas.min.js';
    s.onload = () => ok(window.html2canvas);
    s.onerror = () => ko(new Error('html2canvas introuvable'));
    document.head.appendChild(s);
  });
}

/** capture de la partie visible de la page, sans les éléments [data-capture-exclude] */
export async function capturerPage() {
  const caches = [...document.querySelectorAll('[data-capture-exclude]')];
  const avant = caches.map(el => el.style.visibility);
  caches.forEach(el => { el.style.visibility = 'hidden'; });
  try {
    const h2c = await chargerHtml2canvas();
    // html2canvas dessine mal les <svg> intégrés (figures absentes) : dans la copie qu'il rend,
    // on remplace chaque SVG par une image data: de même taille, couleurs var(--…) résolues.
    const css = getComputedStyle(document.documentElement);
    const svgs = await Promise.all([...document.querySelectorAll('svg')].map(async s => {
      const r = s.getBoundingClientRect();
      if (!r.width || !r.height) return null;
      const c = s.cloneNode(true);
      c.setAttribute('width', r.width); c.setAttribute('height', r.height);
      c.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
      const fs = getComputedStyle(s);
      c.setAttribute('font-family', fs.fontFamily);
      const x = new XMLSerializer().serializeToString(c).replace(/var\((--[\w-]+)\)/g, (m, v) => css.getPropertyValue(v).trim() || '#333');
      try {
        const img = new Image();
        await new Promise((ok, ko) => { img.onload = ok; img.onerror = ko; img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(x); });
        const k = Math.min(window.devicePixelRatio || 1, 1.5) * 1.5;
        const cv = document.createElement('canvas'); cv.width = Math.round(r.width * k); cv.height = Math.round(r.height * k);
        const g = cv.getContext('2d'); g.scale(k, k); g.drawImage(img, 0, 0, r.width, r.height);
        return { w: r.width, h: r.height, url: cv.toDataURL('image/png') };
      } catch (e) { return null; }
    }));
    const canvas = await h2c(document.body, {
      onclone: doc => {
        doc.querySelectorAll('svg').forEach((s, i) => {
          const d = svgs[i]; if (!d || !d.w) return;
          const img = doc.createElement('img');
          img.src = d.url; img.width = d.w; img.height = d.h;
          img.style.cssText = `width:${d.w}px;height:${d.h}px;display:${getComputedStyle(s).display === 'inline' ? 'inline-block' : 'block'};margin:${getComputedStyle(s).margin}`;
          s.replaceWith(img);
        });
        const st = doc.createElement('style');
        st.textContent = '*{box-shadow:none!important;transition:none!important;animation:none!important}';
        doc.head.appendChild(st);
      },
      logging: false, backgroundColor: '#f4f2ec',
      width: window.innerWidth, height: window.innerHeight, x: window.scrollX, y: window.scrollY,
      windowWidth: document.documentElement.clientWidth,
      scale: Math.min(window.devicePixelRatio || 1, 1.5), // image lisible mais pas trop lourde
    });
    const blob = await new Promise(res => canvas.toBlob(res, 'image/png'));
    if (!blob) throw new Error('capture impossible');
    return new File([blob], `capture-maths-${new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-')}.png`, { type: 'image/png' });
  } finally {
    caches.forEach((el, i) => { el.style.visibility = avant[i]; });
  }
}

function texteSignalement(message, ctx) {
  const lignes = Object.entries(ctx).filter(([, v]) => v !== undefined && v !== null && v !== '').map(([k, v]) => `${k} : ${String(v).slice(0, 600)}`);
  return `Signalement — Maths progressives\n\n${message || '(pas de description)'}\n\n— Contexte —\n${lignes.join('\n')}\nPage : ${location.href}\nÉcran : ${window.innerWidth} × ${window.innerHeight}\nAppareil : ${navigator.userAgent}\nDate : ${new Date().toLocaleString('fr-FR')}`;
}

function telecharger(file) {
  const a = document.createElement('a');
  a.href = URL.createObjectURL(file); a.download = file.name;
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 4000);
}

/** installe le bouton flottant et la fenêtre de signalement */
export function installerSignalement(opts = {}) {
  prefixe = opts.prefixe ?? '../../';
  const fab = document.createElement('button');
  fab.type = 'button'; fab.className = 'sig-fab'; fab.id = 'sigBtn';
  fab.setAttribute('data-capture-exclude', '');
  fab.setAttribute('aria-label', 'Demander une explication ou signaler une erreur');
  fab.title = 'Demander une explication ou signaler une erreur';
  fab.innerHTML = '🐞<span>Signaler</span>';
  document.body.appendChild(fab);

  const dlg = document.createElement('div');
  dlg.className = 'modal'; dlg.id = 'sigModal';
  dlg.setAttribute('role', 'dialog'); dlg.setAttribute('aria-modal', 'true'); dlg.setAttribute('aria-labelledby', 'sigTitre');
  dlg.setAttribute('data-capture-exclude', '');
  dlg.innerHTML = `<div class="card sig">
    <h2 id="sigTitre">🐞 Une question, une erreur ?</h2>
    <p class="note">Tu veux une explication en plus sur un exercice ou un cours ? Tu as trouvé une erreur, une correction fausse, un affichage cassé ? Écris-le : la capture de l'écran et l'exercice en cours sont joints automatiquement.</p>
    <label for="sigTexte"><b>Ta question, ou ce qui ne va pas :</b></label>
    <textarea id="sigTexte" rows="4" placeholder="Par exemple : je ne comprends pas pourquoi on change de signe… ou : la correction dit 12 mais je trouve 14…"></textarea>
    <div class="sig-cap"><img id="sigApercu" alt="Aperçu de la capture d'écran"><label class="opt-line"><input type="checkbox" id="sigJoindre" checked> Joindre la capture</label></div>
    <p class="note" id="sigEtat" role="status"></p>
    <p class="note"><b>📤 Envoyer avec la capture</b> : choisis ta messagerie, puis colle l'adresse dans « À » (bouton <button type="button" class="opt" id="sigCopier">Copier l'adresse</button>).<br><b>✉️ Envoyer sans capture</b> : un e-mail s'ouvre, déjà adressé ; il n'y a plus qu'à l'envoyer.</p>
    <div class="actions"><button type="button" class="btn ghost" id="sigAnnuler">Annuler</button><button type="button" class="btn ghost" id="sigSansCapture">✉️ Envoyer sans capture</button><button type="button" class="btn" id="sigEnvoyer">📤 Envoyer avec la capture</button></div>
  </div>`;
  document.body.appendChild(dlg);
  const $ = s => dlg.querySelector(s);
  let fichier = null, retour = null;

  const fermer = () => { dlg.classList.remove('open'); retour && retour.focus && retour.focus(); };
  async function ouvrir() {
    retour = document.activeElement;
    fichier = null;
    $('#sigEtat').textContent = '📸 Capture de l\'écran…';
    $('#sigApercu').removeAttribute('src'); $('#sigApercu').hidden = true;
    $('#sigJoindre').checked = true; $('#sigJoindre').disabled = false;
    try {
      fichier = await capturerPage();
      $('#sigApercu').src = URL.createObjectURL(fichier); $('#sigApercu').hidden = false;
      $('#sigEtat').textContent = '';
    } catch (e) {
      $('#sigEtat').textContent = 'La capture automatique n\'a pas marché : décris simplement l\'erreur (tu peux aussi faire une capture d\'écran de la tablette et la joindre au message).';
      $('#sigJoindre').checked = false; $('#sigJoindre').disabled = true;
    }
    dlg.classList.add('open');
    $('#sigTexte').focus();
  }
  function message() {
    let ctx = {};
    try { ctx = contexte() || {}; } catch (e) { /* contexte indisponible */ }
    const texte = texteSignalement($('#sigTexte').value.trim(), ctx);
    const sujet = `Maths progressives : question ou erreur${ctx.Module ? ' — ' + ctx.Module : ''}${ctx.Niveau ? ', niveau ' + String(ctx.Niveau).split(' ')[0] : ''}`;
    return { texte, sujet };
  }
  const mailto = (sujet, corps) => `mailto:${DESTINATAIRE}?subject=${encodeURIComponent(sujet)}&body=${encodeURIComponent(corps.slice(0, 1800))}`;
  // ouverture du lien mailto (remplaçable par les tests via window.__sigOuvrir)
  const allerA = u => (window.__sigOuvrir || (x => { location.href = x; }))(u);
  function sansCapture() {
    const { texte, sujet } = message();
    allerA(mailto(sujet, texte));
    $('#sigEtat').innerHTML = '✅ Un e-mail s\'ouvre, déjà adressé : il n\'y a plus qu\'à l\'envoyer. Merci !';
  }
  async function envoyer() {
    const { texte, sujet } = message();
    const avecImage = fichier && $('#sigJoindre').checked;
    const data = { title: sujet, text: `À : ${DESTINATAIRE}\n\n${texte}` };
    if (avecImage) data.files = [fichier];
    try {
      if (navigator.share && (!avecImage || (navigator.canShare && navigator.canShare({ files: [fichier] })))) {
        await navigator.share(data);
        $('#sigEtat').innerHTML = '✅ Choisis ta messagerie et colle l\'adresse dans « À » (bouton « Copier l\'adresse »). Merci !';
        setTimeout(fermer, 2500);
        return;
      }
    } catch (e) {
      if (e && e.name === 'AbortError') { $('#sigEtat').textContent = 'Envoi annulé.'; return; }
    }
    // pas de partage d'image possible (ordinateur) : enregistrer la capture + e-mail pré-rempli
    if (avecImage) telecharger(fichier);
    const corps = (avecImage ? `(Pense à joindre la capture « ${fichier.name} », enregistrée dans tes téléchargements.)\n\n` : '') + texte;
    allerA(mailto(sujet, corps));
    $('#sigEtat').innerHTML = avecImage ? `✅ La capture est enregistrée (<b>${fichier.name}</b>) et un e-mail s'ouvre : joins-y la capture. Merci !` : '✅ Un e-mail s\'ouvre avec ton message. Merci !';
  }
  fab.onclick = ouvrir;
  $('#sigAnnuler').onclick = fermer;
  $('#sigEnvoyer').onclick = envoyer;
  $('#sigSansCapture').onclick = sansCapture;
  $('#sigCopier').onclick = async () => { try { await navigator.clipboard.writeText(DESTINATAIRE); $('#sigCopier').textContent = 'Copiée ✔'; } catch (e) { $('#sigCopier').textContent = DESTINATAIRE; } };
  dlg.addEventListener('click', e => { if (e.target === dlg) fermer(); });
  dlg.addEventListener('keydown', e => { if (e.key === 'Escape') { e.stopPropagation(); fermer(); } });
  bienvenue(fab);
  return { ouvrir, fermer, get fichier() { return fichier; } };
}

// Fenêtre d'accueil, montrée une seule fois par appareil (clé « mp:bienvenue ») : la ressource est en
// développement, et le bouton 🐞 (en bas à droite) sert à demander une explication ou une correction.
const CLE_BIENVENUE = 'mp:bienvenue';
function bienvenue(fab) {
  try { if (localStorage.getItem(CLE_BIENVENUE)) return; } catch (e) { return; }
  const dlg = document.createElement('div');
  dlg.className = 'modal open'; dlg.id = 'bienvenueModal';
  dlg.setAttribute('role', 'dialog'); dlg.setAttribute('aria-modal', 'true'); dlg.setAttribute('aria-labelledby', 'bienvenueTitre');
  dlg.setAttribute('data-capture-exclude', '');
  dlg.innerHTML = `<div class="card bienvenue">
    <h2 id="bienvenueTitre">👋 Bienvenue dans Maths progressives !</h2>
    <p class="warn">🚧 Ce site est <b>en cours de développement</b> : il reste sûrement des erreurs, et des explications peuvent manquer.</p>
    <p>Le bouton rond <span class="bv-btn">🐞</span> (avec le mot « Signaler » sur un grand écran), <b>en bas à droite de l'écran</b>, toujours au même endroit sur chaque page, sert à :</p>
    <ul>
      <li>💬 <b>demander une explication supplémentaire</b> quand un cours ou une correction n'est pas clair ;</li>
      <li>🛠️ <b>demander une correction</b> quand un énoncé, une réponse ou un affichage est faux.</li>
    </ul>
    <p class="note">Une capture de l'écran et l'exercice en cours sont joints automatiquement : il suffit d'écrire ta question.</p>
    <div class="actions"><button type="button" class="btn" id="bienvenueOk">J'ai compris</button></div>
  </div>
  <div class="bv-fleche" aria-hidden="true">le bouton est ici <span>↓</span></div>`;
  document.body.appendChild(dlg);
  fab.classList.add('sig-fab-montre');
  const fermer = () => {
    try { localStorage.setItem(CLE_BIENVENUE, '1'); } catch (e) { /* rien */ }
    dlg.remove(); fab.classList.remove('sig-fab-montre');
  };
  dlg.querySelector('#bienvenueOk').onclick = fermer;
  dlg.addEventListener('click', e => { if (e.target === dlg) fermer(); });
  dlg.addEventListener('keydown', e => { if (e.key === 'Escape') { e.stopPropagation(); fermer(); } });
  dlg.querySelector('#bienvenueOk').focus();
}

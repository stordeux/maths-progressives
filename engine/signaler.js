// Bouton « Signaler une erreur » (inspiré de PMS_SCAN) : capture de l'écran visible, texte libre,
// contexte ajouté automatiquement (module, niveau, énoncé, réponse attendue, appareil).
// Pas de serveur : l'envoi passe par le menu « Partager » de l'appareil (Android : Gmail, etc.)
// ou, s'il ne sait pas partager une image, par l'enregistrement de la capture + un e-mail pré-rempli.
//
// ⚠️ html2canvas REDESSINE la page (ce n'est pas une photo de l'écran) : de petits écarts de rendu
// sont possibles. Le brouillon (canvas) est bien repris : l'élève peut y entourer l'erreur avant.

export const DESTINATAIRE = 'sebastien.tordeux@univ-pau.fr';
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
  fab.setAttribute('aria-label', 'Signaler une erreur');
  fab.title = 'Signaler une erreur';
  fab.innerHTML = '🐞<span>Signaler</span>';
  document.body.appendChild(fab);

  const dlg = document.createElement('div');
  dlg.className = 'modal'; dlg.id = 'sigModal';
  dlg.setAttribute('role', 'dialog'); dlg.setAttribute('aria-modal', 'true'); dlg.setAttribute('aria-labelledby', 'sigTitre');
  dlg.setAttribute('data-capture-exclude', '');
  dlg.innerHTML = `<div class="card sig">
    <h2 id="sigTitre">🐞 Signaler une erreur</h2>
    <p class="note">Une erreur dans un exercice, une correction fausse, un affichage cassé ? Explique ce qui ne va pas : la capture de l'écran et l'exercice en cours sont joints automatiquement.</p>
    <label for="sigTexte"><b>Qu'est-ce qui ne va pas ?</b></label>
    <textarea id="sigTexte" rows="4" placeholder="Par exemple : la correction dit 12 mais je trouve 14…"></textarea>
    <div class="sig-cap"><img id="sigApercu" alt="Aperçu de la capture d'écran"><label class="opt-line"><input type="checkbox" id="sigJoindre" checked> Joindre la capture</label></div>
    <p class="note" id="sigEtat" role="status"></p>
    <p class="note">Le message part depuis ta messagerie, vers <b>${DESTINATAIRE}</b> <button type="button" class="opt" id="sigCopier">Copier l'adresse</button></p>
    <div class="actions"><button type="button" class="btn ghost" id="sigAnnuler">Annuler</button><button type="button" class="btn" id="sigEnvoyer">📤 Envoyer</button></div>
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
  async function envoyer() {
    let ctx = {};
    try { ctx = contexte() || {}; } catch (e) { /* contexte indisponible */ }
    const texte = texteSignalement($('#sigTexte').value.trim(), ctx);
    const sujet = `Maths progressives : erreur${ctx.Module ? ' — ' + ctx.Module : ''}${ctx.Niveau ? ', niveau ' + String(ctx.Niveau).split(' ')[0] : ''}`;
    const avecImage = fichier && $('#sigJoindre').checked;
    const data = { title: sujet, text: `À : ${DESTINATAIRE}\n\n${texte}` };
    if (avecImage) data.files = [fichier];
    try {
      if (navigator.share && (!avecImage || (navigator.canShare && navigator.canShare({ files: [fichier] })))) {
        await navigator.share(data);
        $('#sigEtat').innerHTML = `✅ Choisis ta messagerie et mets l'adresse <b>${DESTINATAIRE}</b> si elle n'y est pas. Merci !`;
        setTimeout(fermer, 2500);
        return;
      }
    } catch (e) {
      if (e && e.name === 'AbortError') { $('#sigEtat').textContent = 'Envoi annulé.'; return; }
    }
    // pas de partage d'image possible (ordinateur) : enregistrer la capture + e-mail pré-rempli
    if (avecImage) telecharger(fichier);
    const corps = (avecImage ? `(Pense à joindre la capture « ${fichier.name} », enregistrée dans tes téléchargements.)\n\n` : '') + texte;
    location.href = `mailto:${DESTINATAIRE}?subject=${encodeURIComponent(sujet)}&body=${encodeURIComponent(corps.slice(0, 1800))}`;
    $('#sigEtat').innerHTML = avecImage ? `✅ La capture est enregistrée (<b>${fichier.name}</b>) et un e-mail s'ouvre : joins-y la capture. Merci !` : '✅ Un e-mail s\'ouvre avec ton message. Merci !';
  }
  fab.onclick = ouvrir;
  $('#sigAnnuler').onclick = fermer;
  $('#sigEnvoyer').onclick = envoyer;
  $('#sigCopier').onclick = async () => { try { await navigator.clipboard.writeText(DESTINATAIRE); $('#sigCopier').textContent = 'Copiée ✔'; } catch (e) { $('#sigCopier').textContent = DESTINATAIRE; } };
  dlg.addEventListener('click', e => { if (e.target === dlg) fermer(); });
  dlg.addEventListener('keydown', e => { if (e.key === 'Escape') { e.stopPropagation(); fermer(); } });
  return { ouvrir, fermer, get fichier() { return fichier; } };
}

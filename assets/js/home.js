// Accueil : cartes des modules (niveau atteint, records, dernière activité), export / import, réglages.
import { MODULES, GROUPES } from '../../modules/registry.js';
import { FICHES } from '../../fiches/registry.js';
import * as store from '../../engine/storage.js';
import { applySettings } from '../../engine/engine.js';
import { installerSignalement, setContexte } from '../../engine/signaler.js';
import { TITRES, titreActuel, nbEtoiles } from '../../engine/titres.js';
import { CLASSES, NOMS, pourClasse } from '../../engine/classes.js';

const $ = s => document.querySelector(s);

function quand(t) {
  if (!t) return '';
  const j = Math.floor((Date.now() - t) / 864e5);
  if (j <= 0) return "aujourd'hui";
  if (j === 1) return 'hier';
  if (j < 7) return `il y a ${j} jours`;
  return 'le ' + new Date(t).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' });
}

/** titre de l'élève (toute sa progression) : nom, total d'étoiles, barre vers le titre suivant, échelle des 10 titres */
function renderTitre() {
  const t = titreActuel();
  const suite = t.suivant
    ? `<div class="tbar" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${t.pct}" aria-label="Avancement vers le titre ${t.suivant.nom}"><i style="width:${t.pct}%"></i></div>
       <p class="tsuite" id="titreSuite">Encore <b>${nbEtoiles(t.manque)}</b> pour devenir <b>${t.suivant.nom}</b> <span class="note">(${t.score} / ${t.suivant.seuil} ★)</span></p>`
    : `<div class="tbar" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow="100" aria-label="Dernier titre atteint"><i style="width:100%"></i></div>
       <p class="tsuite" id="titreSuite">🏆 Tu as obtenu le plus haut titre : bravo, tu es au sommet !</p>`;
  $('#titre').innerHTML = `<div class="thead"><span class="tnom">🎖️ Ton titre : <b id="titreNom">${t.nom}</b></span><span class="ttot" id="titreTotal">★ ${nbEtoiles(t.score)} en tout</span></div>
    ${suite}
    <ol class="techelle" aria-label="Les 10 titres">${TITRES.map((x, i) => `<li class="${i < t.rang ? 'fait' : i === t.rang ? 'ici' : ''}"${i === t.rang ? ' aria-current="true"' : ''}>${x.nom}</li>`).join('')}</ol>
    <p class="note">Chaque étoile ★ gagnée dans un module compte, tous modules confondus (5 étoiles par niveau).</p>`;
}

/** classe choisie (gardée dans les réglages, donc dans l'export et après « Réinitialiser ») ; '' = toutes */
const classeChoisie = () => { const c = store.settings.get().classe; return CLASSES.includes(c) ? c : ''; };
function renderClasses() {
  const c = classeChoisie();
  $('#choixClasse').innerHTML = `<span class="lab" id="labClasse">Ta classe :</span><div class="chips" role="group" aria-labelledby="labClasse">${
    CLASSES.map(k => `<button type="button" class="chip${k === c ? ' on' : ''}" data-classe="${k}" aria-pressed="${k === c}">${NOMS[k]}</button>`).join('')
  }<button type="button" class="chip tout${c ? '' : ' on'}" data-classe="" aria-pressed="${!c}">Toutes</button></div>`;
  $('#choixClasse').querySelectorAll('[data-classe]').forEach(b => { b.onclick = () => { store.settings.set({ classe: b.dataset.classe }); renderClasses(); render(); }; });
}

function render() {
  renderTitre();
  const classe = classeChoisie();
  let tot = 0, debut = 0;
  const html = GROUPES.map(g => {
    const mods = MODULES.filter(m => m.groupe === g && pourClasse(m, classe));
    if (!mods.length) return '';
    return `<section class="group" aria-labelledby="g-${g.replace(/\W/g, '')}"><h2 id="g-${g.replace(/\W/g, '')}">${g}</h2><div class="grid">${mods.map(m => {
      if (m.etat === 'bientot') return `<div class="mcard soon" style="--c:${m.couleur}" aria-disabled="true"><span class="t">${m.emoji} ${m.titre}</span><span class="cl">${m.classes}</span><span class="r">${m.resume}</span><span class="st"><span class="pill">Bientôt</span></span></div>`;
      if (m.id === 'revision') {
        const R = store.load('revision', { sessions: 0, best: null, last: 0 });
        return `<a class="mcard" href="modules/revision/" style="--c:${m.couleur}"><span class="t">${m.emoji} ${m.titre}</span><span class="cl">${m.classes}</span><span class="r">${m.resume}</span><span class="st">${R.sessions ? `<span class="pill">${R.sessions} séance${R.sessions > 1 ? 's' : ''}</span><span class="pill">record ${R.best} %</span><span class="new">${quand(R.last)}</span>` : '<span class="new">Pas encore commencé</span>'}</span></a>`;
      }
      const S = store.load(m.id, { level: 0, max: 0, total: 0, best: {}, last: 0 });
      const started = (S.total || 0) > 0 || S.last;
      const lv = Math.max(S.level || 0, S.max || 0);
      if (started) { tot += lv + 1; debut++; }
      const recs = S.best && Object.keys(S.best).length ? Math.max(...Object.values(S.best)) : null;
      const pct = Math.round(100 * (lv + (started ? 1 : 0)) / 12);
      return `<a class="mcard" href="modules/${m.id}/" style="--c:${m.couleur}">
        <span class="t">${m.emoji} ${m.titre}</span><span class="cl">${m.classes}</span>
        <span class="r">${m.resume}</span>
        <span class="st">${started
          ? `<span class="pill">Niveau ${(S.level || 0) + 1} / 12${S.stars != null ? ` · ${'★'.repeat(S.stars)}${'☆'.repeat(5 - S.stars)}` : ''}</span>${S.max > S.level ? `<span class="pill">max ${S.max + 1}</span>` : ''}${recs !== null ? `<span class="pill">⏱️ record ${recs}</span>` : ''}${S.total ? `<span class="pill">✔ ${S.good || 0} / ${S.total}</span>` : ''}<span class="new">${quand(S.last)}</span>`
          : '<span class="new">Pas encore commencé</span>'}
          <span class="bar" aria-hidden="true"><i style="width:${pct}%"></i></span></span></a>`;
    }).join('')}</div></section>`;
  }).join('');
  const fs = FICHES.filter(f => pourClasse(f, classe));
  const fiches = !fs.length ? '' : `<section class="group" aria-labelledby="g-fiches"><h2 id="g-fiches">📚 Fiches de synthèse</h2><div class="grid">${fs.map(f => f.etat === 'bientot'
    ? `<div class="mcard soon" style="--c:${f.couleur}" aria-disabled="true"><span class="t">${f.emoji} ${f.titre}</span><span class="cl">${f.classes}</span><span class="r">${f.resume}</span><span class="st"><span class="pill">Bientôt</span></span></div>`
    : `<a class="mcard" href="fiches/?f=${f.id}" style="--c:${f.couleur}"><span class="t">${f.emoji} ${f.titre}</span><span class="cl">${f.classes}</span><span class="r">${f.resume}</span><span class="st"><span class="new">Fiche à lire</span></span></a>`).join('')}</div></section>`;
  const n = MODULES.filter(m => pourClasse(m, classe)).length;
  const entete = classe ? `<p class="filtre" id="filtreClasse">${n} module${n > 1 ? 's' : ''} pour la ${NOMS[classe] === 'Terminale' ? 'Terminale' : NOMS[classe]} · <button type="button" class="lien" id="voirTout">voir tous les modules</button></p>` : '';
  $('#modules').innerHTML = entete + html + fiches;
  if (classe) $('#voirTout').onclick = () => { store.settings.set({ classe: '' }); renderClasses(); render(); };
  $('#global').textContent = debut ? `${debut} module${debut > 1 ? 's' : ''} commencé${debut > 1 ? 's' : ''} · ${tot} niveau${tot > 1 ? 'x' : ''} atteint${tot > 1 ? 's' : ''} en tout` : 'Choisis un module pour commencer 👇';
}

function toggle(id) { ['#expBox', '#impBox', '#setBox', '#rstBox'].forEach(b => { $(b).hidden = b === id ? !$(b).hidden : true; }); }
$('#expBtn').onclick = () => { $('#expCode').value = store.toCode(store.exportAll()); toggle('#expBox'); };
$('#copyBtn').onclick = async () => {
  try { await navigator.clipboard.writeText($('#expCode').value); $('#copyBtn').textContent = 'Copié ✔'; }
  catch (e) { $('#expCode').select(); $('#copyBtn').textContent = 'Sélectionné : fais Copier'; }
};
$('#dlBtn').onclick = () => {
  const blob = new Blob([JSON.stringify(store.exportAll(), null, 1)], { type: 'application/json' });
  const a = document.createElement('a'); a.href = URL.createObjectURL(blob);
  a.download = `progression-maths-${new Date().toISOString().slice(0, 10)}.json`;
  document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(a.href), 2000);
};
$('#impBtn').onclick = () => toggle('#impBox');
$('#rstBtn').onclick = () => { $('#rstMsg').textContent = ''; toggle('#rstBox'); };
$('#rstNo').onclick = () => toggle('#rstBox');
$('#rstYes').onclick = () => { const n = store.resetAll(); render(); $('#rstMsg').textContent = `✅ Tout est remis à zéro (${n} module${n > 1 ? 's' : ''} effacé${n > 1 ? 's' : ''}).`; };
function doImport(obj) {
  try { const n = store.importAll(obj); $('#impMsg').textContent = `✅ Progression importée (${n} élément${n > 1 ? 's' : ''}).`; render(); }
  catch (e) { $('#impMsg').textContent = '❌ ' + e.message; }
}
$('#impGo').onclick = () => {
  const v = $('#impCode').value.trim(); if (!v) return;
  let obj; try { obj = v.startsWith('{') ? JSON.parse(v) : store.fromCode(v); } catch (e) { $('#impMsg').textContent = '❌ Code illisible : vérifie qu\'il est complet.'; return; }
  doImport(obj);
};
$('#impFile').onchange = e => {
  const f = e.target.files[0]; if (!f) return;
  f.text().then(t => { try { doImport(JSON.parse(t)); } catch (x) { $('#impMsg').textContent = '❌ Fichier illisible.'; } });
};
$('#setBtn').onclick = () => toggle('#setBox');
const s = applySettings();
$('#optLisible').checked = !!s.lisible; $('#optGrand').checked = !!s.grand;
$('#optLisible').onchange = e => { store.settings.set({ lisible: e.target.checked }); applySettings(); };
$('#optGrand').onchange = e => { store.settings.set({ grand: e.target.checked }); applySettings(); };

installerSignalement({ prefixe: '' });
setContexte(() => ({ Page: 'Accueil', Classe: classeChoisie() || 'toutes' }));
renderClasses();
render();
if ('serviceWorker' in navigator && location.protocol.startsWith('http')) navigator.serviceWorker.register('sw.js').catch(() => {});

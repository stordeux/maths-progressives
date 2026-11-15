// Accueil : cartes des modules (niveau atteint, records, dernière activité), export / import, réglages.
import { MODULES, GROUPES } from '../../modules/registry.js';
import * as store from '../../engine/storage.js';
import { applySettings } from '../../engine/engine.js';

const $ = s => document.querySelector(s);

function quand(t) {
  if (!t) return '';
  const j = Math.floor((Date.now() - t) / 864e5);
  if (j <= 0) return "aujourd'hui";
  if (j === 1) return 'hier';
  if (j < 7) return `il y a ${j} jours`;
  return 'le ' + new Date(t).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' });
}

function render() {
  let tot = 0, debut = 0;
  const html = GROUPES.map(g => {
    const mods = MODULES.filter(m => m.groupe === g);
    if (!mods.length) return '';
    return `<section class="group" aria-labelledby="g-${g.replace(/\W/g, '')}"><h2 id="g-${g.replace(/\W/g, '')}">${g}</h2><div class="grid">${mods.map(m => {
      if (m.etat === 'bientot') return `<div class="mcard soon" style="--c:${m.couleur}" aria-disabled="true"><span class="t">${m.emoji} ${m.titre}</span><span class="cl">${m.classes}</span><span class="r">${m.resume}</span><span class="st"><span class="pill">Bientôt</span></span></div>`;
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
          ? `<span class="pill">Niveau ${(S.level || 0) + 1} / 12</span>${S.max > S.level ? `<span class="pill">max ${S.max + 1}</span>` : ''}${recs !== null ? `<span class="pill">⏱️ record ${recs}</span>` : ''}${S.total ? `<span class="pill">✔ ${S.good || 0} / ${S.total}</span>` : ''}<span class="new">${quand(S.last)}</span>`
          : '<span class="new">Pas encore commencé</span>'}
          <span class="bar" aria-hidden="true"><i style="width:${pct}%"></i></span></span></a>`;
    }).join('')}</div></section>`;
  }).join('');
  $('#modules').innerHTML = html;
  $('#global').textContent = debut ? `${debut} module${debut > 1 ? 's' : ''} commencé${debut > 1 ? 's' : ''} · ${tot} niveau${tot > 1 ? 'x' : ''} atteint${tot > 1 ? 's' : ''} en tout` : 'Choisis un module pour commencer 👇';
}

function toggle(id) { ['#expBox', '#impBox', '#setBox'].forEach(b => { $(b).hidden = b === id ? !$(b).hidden : true; }); }
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

render();
if ('serviceWorker' in navigator && location.protocol.startsWith('http')) navigator.serviceWorker.register('sw.js').catch(() => {});

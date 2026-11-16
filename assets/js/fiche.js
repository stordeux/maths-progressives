// Page d'une fiche de synthèse : fiches/index.html?f=<id> charge fiches/<id>.js et l'affiche,
// avec un plan cliquable (titres h2) et les liens « S'entraîner » vers les niveaux des modules.
import { FICHES } from '../../fiches/registry.js';
import { MODULES } from '../../modules/registry.js';
import { registerSW } from '../../engine/engine.js';
import { installerSignalement } from '../../engine/signaler.js';

const $ = s => document.querySelector(s);
const id = new URLSearchParams(location.search).get('f');
const meta = FICHES.find(f => f.id === id && f.etat !== 'bientot');

async function main() {
  registerSW('../');
  if (!meta) {
    $('#fiche').innerHTML = '<p>Cette fiche n\'existe pas (encore). <a href="../">Retour à l\'accueil</a>.</p>';
    return;
  }
  document.documentElement.style.setProperty('--acc', meta.couleur);
  document.documentElement.style.setProperty('--acc2', meta.couleur2);
  document.title = `${meta.titre} – Fiche – Maths progressives`;
  $('#ftitre').textContent = `${meta.emoji} ${meta.titre}`;
  const { contenu, liens = [] } = await import(`../../fiches/${meta.id}.js`);
  $('#fiche').innerHTML = contenu;

  // plan : un lien par titre h2, ancres générées
  const h2 = [...$('#fiche').querySelectorAll('h2')];
  h2.forEach((h, i) => { if (!h.id) h.id = 's' + (i + 1); });
  $('#fplan').innerHTML = h2.length ? `<b>Plan</b><ol>${h2.map(h => `<li><a href="#${h.id}">${h.textContent}</a></li>`).join('')}</ol>` : '';

  if (liens.length) {
    $('#fliens').hidden = false;
    $('#fliensGrid').innerHTML = liens.map(l => {
      const m = MODULES.find(x => x.id === l.module) || {};
      return `<a class="flien" style="--c:${m.couleur || 'var(--acc)'}" href="../modules/${l.module}/?niveau=${l.niveau}"><span class="t">${m.emoji || ''} ${m.titre || l.module} · niveau ${l.niveau}</span><span class="r">${l.texte}</span></a>`;
    }).join('');
  }
  installerSignalement({ prefixe: '../' });
}
main();

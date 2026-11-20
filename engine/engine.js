// Moteur commun : boucle d'exercice, adaptation du niveau, bandeaux, cours, menu, réglages.
import { pick, chance } from './util/rand.js';
import { sansRepetition, memoireDe } from './util/repet.js';
import { strip } from './util/fmt.js';
import { ANSWERS } from './answers/index.js';
import { createKeypad, physicalKey } from './keypad.js';
import { createScratchpad } from './scratchpad.js';
import * as store from './storage.js';
import { MODULES } from '../modules/registry.js';
import { installerSignalement, setContexte } from './signaler.js';
import { suiviTitre, titreActuel, nbEtoiles } from './titres.js';
export { setContexte };

const PRAISE = ['Bravo !', 'Excellent !', 'Parfait !', 'Bien joué !', 'Super !', 'Exactement !', 'Très bien !'];
const $ = (s, r = document) => r.querySelector(s);

/**
 * Difficulté d passée aux générateurs (0 à 5). Le nombre d'étoiles du niveau va de 0 à 4 (à 5 on monte) :
 * on l'étale sur 0…5, avec un peu de hasard pour que chaque valeur de d soit atteinte
 * (difficulte(étoiles, 5) : 0 → d 0 ou 1, 1 → 1 ou 2, 2 → 2 ou 3, 3 → 3 ou 4, 4 → 5).
 * (Relecture Codex : sans cela, les variantes d ≥ 4 n'apparaissaient jamais.)
 */
export function difficulte(streak, need) {
  const base = Math.floor(streak * 5 / Math.max(1, need - 1));
  return Math.min(5, base + (base < 5 && chance(0.5) ? 1 : 0));
}

/**
 * Étoiles (décision de S. Tordeux, 2026-11-19) : 5 étoiles par niveau, en continu.
 * Une réussite (du premier coup, sans indice) donne +1 étoile ; une faute (première réponse fausse) en retire 2.
 * À 5 étoiles on passe au niveau suivant avec 0 étoile ; sous 0 on redescend au niveau précédent avec le reste
 * (niveau 3, 1 étoile, une faute → niveau 2, 4 étoiles). Plancher : niveau 1, 0 étoile ; au dernier niveau, 5 au plus.
 * Renvoie le changement de niveau (+1, −1 ou 0).
 */
export const ETOILES = 5;
export function bouger(S, delta, nbNiveaux) {
  if (S.stars === undefined) S.stars = Math.min(ETOILES - 1, S.streak || 0);
  const avant = S.level, max = (nbNiveaux - 1) * ETOILES + ETOILES;
  // progression d'avant les titres (sans compteur) : on part de la position atteinte, pour que le titre ne recule pas
  const avantPos = S.level * ETOILES + S.stars;
  let p = Math.max(0, Math.min(max, S.level * ETOILES + S.stars + delta));
  S.level = Math.min(nbNiveaux - 1, Math.floor(p / ETOILES));
  S.stars = p - S.level * ETOILES;
  S.streak = S.stars; // compatibilité (difficulté, contexte des signalements)
  // étoiles gagnées en jouant (jamais retirées, pas changées par le menu Niveaux) : c'est ce qui compte pour le titre
  if (delta > 0) S.gagnees = (S.gagnees ?? avantPos) + delta;
  return Math.sign(S.level - avant);
}
export const etoilesHTML = n => Array.from({ length: ETOILES }, (_, i) => `<i class="${i < n ? 'on' : ''}">${i < n ? '★' : '☆'}</i>`).join('');

/** normalise la sortie d'un générateur (champs du contrat) */
export function normalize(q) {
  if (q.expected === undefined && q.check) q.expected = q.check.expected;
  q.visual = q.visual || '';
  q.afterVisual = q.afterVisual || '';
  return q;
}

/**
 * Exercice suivant du niveau en cours (S.level), à la difficulté donnée par les étoiles (S.stars).
 * Ticket n° 7 (« il faut éviter que les exercices se répètent ») : on retire tant que l'énoncé est l'un des
 * 10 derniers vus dans le module (S.vus, empreintes enregistrées avec la progression), 25 tirages au plus ;
 * si le réservoir du niveau est trop petit, on prend l'énoncé vu il y a le plus longtemps.
 */
export function tirerExercice(LEVELS, S) {
  if (!Array.isArray(S.vus)) S.vus = [];
  return normalize(sansRepetition(() => LEVELS[S.level].generate(difficulte(S.stars, ETOILES)), S.vus));
}

/** applique les réglages d'affichage (police plus lisible, grands caractères) */
export function applySettings() {
  const s = store.settings.get();
  document.documentElement.classList.toggle('lisible', !!s.lisible);
  document.documentElement.classList.toggle('grand', !!s.grand);
  return s;
}

/** bandeau temporaire ; plusieurs messages à la fois s'empilent (niveau débloqué + nouveau titre) au lieu de se remplacer */
export function banner(t, duree = 3000) {
  const b = $('#banner'); if (!b) return;
  const l = document.createElement('div'); l.className = 'ligne'; l.textContent = t;
  b.appendChild(l); b.classList.add('show');
  setTimeout(() => {
    if (b.children.length > 1) { l.remove(); return; }
    b.classList.remove('show'); // dernier message : on laisse le bandeau s'effacer avant de le vider
    setTimeout(() => { l.remove(); }, 400);
  }, duree);
}

/**
 * Titre de l'élève (toute sa progression, tous modules confondus : engine/titres.js).
 * Renvoie verifier(annoncer) à appeler après chaque enregistrement : bandeau « Tu deviens … » quand un seuil est franchi.
 * verifier(false) recale sans rien annoncer (niveau choisi dans le menu, remise à zéro).
 */
export function annonceTitre() {
  const suivi = suiviTitre();
  return (annoncer = true) => {
    const t = suivi();
    if (t && annoncer) banner(`🎖️ Tu deviens ${t.nom} !`, 4500);
    return t;
  };
}
/** rappel discret du titre dans le menu Niveaux */
export function titreMenu() {
  const e = $('#menuTitre'); if (!e) return;
  const t = titreActuel();
  e.textContent = `🎖️ Ton titre : ${t.nom} · ${nbEtoiles(t.score)} en tout` + (t.suivant ? ` · encore ${t.manque} pour devenir ${t.suivant.nom}` : '');
}

/** lecture à voix haute (si disponible) */
export function speak(html) {
  try {
    if (!('speechSynthesis' in window)) return;
    const t = strip(html).replace(/−/g, ' moins ').replace(/×/g, ' fois ').replace(/÷/g, ' divisé par ').replace(/√/g, ' racine de ').replace(/≤/g, ' inférieur ou égal à ').replace(/≥/g, ' supérieur ou égal à ').replace(/</g, ' inférieur à ').replace(/>/g, ' supérieur à ').replace(/∞/g, ' l\'infini ');
    speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(t); u.lang = 'fr-FR'; u.rate = .95;
    speechSynthesis.speak(u);
  } catch (e) { /* pas de voix */ }
}

/** fenêtres modales accessibles */
export function modal(id) {
  const m = $('#' + id);
  let back = null;
  const api = {
    open() { back = document.activeElement; m.classList.add('open'); m.setAttribute('aria-hidden', 'false'); const c = $('.card', m); c.scrollTop = 0; const f = $('[data-close]', m) || $('button', m); f && f.focus(); },
    close() { m.classList.remove('open'); m.setAttribute('aria-hidden', 'true'); back && back.focus && back.focus(); api.onclose && api.onclose(); },
    get isOpen() { return m.classList.contains('open'); },
    onclose: null,
  };
  m.addEventListener('click', e => { if (e.target === m) api.close(); });
  m.querySelectorAll('[data-close]').forEach(b => { b.onclick = () => api.close(); });
  return api;
}

/** squelette commun de la page d'un module */
export function shell(meta, { scratchpad = true, headerExtra = '' } = {}) {
  document.title = `${meta.titre} – Maths progressives`;
  document.documentElement.style.setProperty('--acc', meta.couleur);
  document.documentElement.style.setProperty('--acc2', meta.couleur2);
  document.body.innerHTML = `
<a class="skip" href="#q">Aller à l'exercice</a>
<header class="top">
  <a class="home" href="../../index.html" aria-label="Accueil">🏠</a>
  <h1><span class="mt">${meta.emoji} ${meta.titre}</span> <span class="lvl" id="lvlName"></span><span class="dots" id="dots" aria-hidden="true"></span></h1>
  <div class="hbtns">${headerExtra}
  <span class="score" id="score" aria-live="off"></span>
  <button type="button" class="btn ghost" id="coursBtn">📘 Cours</button>
  <button type="button" class="btn ghost" id="openMenu">Niveaux</button></div>
</header>
<main class="${scratchpad ? 'withpad' : 'nopad'}" id="main">
  <div class="col">
    <section class="card cours-panel" id="coursPanel">
      <button type="button" class="cours-toggle" id="coursToggle" aria-expanded="false" aria-controls="coursInline"><span id="coursLabel"></span><span class="cours-etat" id="coursEtat">Ouvrir ▾</span></button>
      <div class="cours" id="coursInline" hidden></div>
    </section>
    <section class="card" id="qcard" aria-labelledby="qnum">
      <div class="qhead"><span id="qnum"></span><span id="help"></span><button type="button" class="speak" id="speakBtn" aria-label="Lire la consigne à voix haute" title="Lire à voix haute">🔊</button></div>
      <div id="q" tabindex="-1"></div>
      <div id="vis"></div>
    </section>
    <section class="card" id="acard" aria-label="Ta réponse">
      <div class="answer" id="answer"></div>
      <div id="pad"></div>
      <div class="actions">
        <button type="button" class="btn ghost" id="hintBtn">💡 Indice</button>
        <button type="button" class="btn" id="okBtn">Valider</button>
        <button type="button" class="btn" id="nextBtn" hidden>Suivant →</button>
      </div>
      <div id="fb" role="status" aria-live="polite"></div>
    </section>
  </div>
  ${scratchpad ? '<section class="card" id="scratch"></section>' : ''}
</main>
<div id="banner" role="status" aria-live="assertive"></div>
<div class="modal" id="coursModal" role="dialog" aria-modal="true" aria-label="Cours" aria-hidden="true"><div class="card"><div class="cours" id="coursBody"></div>
  <div class="actions"><button type="button" class="btn" data-close>C'est parti !</button></div></div></div>
<div class="modal" id="menu" role="dialog" aria-modal="true" aria-label="Niveaux et réglages" aria-hidden="true"><div class="card">
  <h2>Choisir un niveau</h2>
  <p class="note" id="menuNote"></p>
  <p class="note menu-titre" id="menuTitre"></p>
  <div class="lvlist" id="lvlist"></div>
  <h2>Réglages</h2>
  <label class="opt-line"><input type="checkbox" id="optLisible"> Police plus lisible (lettres espacées)</label>
  <label class="opt-line"><input type="checkbox" id="optGrand"> Caractères plus grands</label>
  <div class="actions"><button type="button" class="btn ghost" id="resetBtn">Remettre ce module à zéro</button><button type="button" class="btn" data-close>Fermer</button></div>
  <div class="confirm" id="resetConfirm" hidden>Effacer toute la progression de ce module ? <button type="button" class="btn" id="resetYes">Oui, effacer</button> <button type="button" class="btn ghost" id="resetNo">Non</button></div>
</div></div>`;
  applySettings();
  const s = store.settings.get();
  $('#optLisible').checked = !!s.lisible; $('#optGrand').checked = !!s.grand;
  $('#optLisible').onchange = e => { store.settings.set({ lisible: e.target.checked }); applySettings(); };
  $('#optGrand').onchange = e => { store.settings.set({ grand: e.target.checked }); applySettings(); };
  if (!('speechSynthesis' in window)) $('#speakBtn').hidden = true;
  installerSignalement();
  setContexte(() => ({ Module: meta.titre }));
}

/** enregistre le service worker (hors ligne) */
export function registerSW(prefix = '../../') {
  if ('serviceWorker' in navigator && location.protocol.startsWith('http')) {
    navigator.serviceWorker.register(prefix + 'sw.js').catch(() => { /* hors ligne impossible : tant pis */ });
  }
}

/**
 * Démarre un module « standard ».
 * levels : [{titre, generate(d), cours()}] ; options : {need, scratchpad, keys}
 */
export function startModule(id, LEVELS, opts = {}) {
  const meta = MODULES.find(m => m.id === id);
  const NEED = opts.need || 4;
  shell(meta, { scratchpad: opts.scratchpad !== false });
  registerSW();
  const def = { level: 0, streak: 0, stars: 0, fails: 0, good: 0, total: 0, n: 0, seen: [], max: 0, vus: [] };
  let S = store.load(id, def);
  S.vus = memoireDe(S.vus); // empreintes des derniers énoncés vus dans ce module (anti-répétition)
  if (S.level >= LEVELS.length) S.level = 0;
  const save = () => { S.max = Math.max(S.max || 0, S.level); store.save(id, S); };
  // « ?niveau=n » (liens des fiches de synthèse) : ouvre directement le niveau n, comme le menu Niveaux
  const demande = +new URLSearchParams(location.search).get('niveau');
  if (demande >= 1 && demande <= LEVELS.length && demande - 1 !== S.level) {
    S.level = demande - 1; S.streak = 0; S.stars = 0; S.fails = 0; save();
  }

  if (S.stars === undefined) S.stars = Math.min(ETOILES - 1, S.streak || 0);
  $('#menuNote').innerHTML = `Chaque réussite (du premier coup, sans indice) donne <b>une étoile ★</b> ; chaque faute en retire <b>deux</b>. À <b>${ETOILES} étoiles</b> on passe au niveau suivant ; sous zéro on revient au niveau précédent, sans repartir de zéro. Les exercices se corsent un peu à chaque réussite. Il redescend après <b>2 exercices ratés de suite</b>.`;

  const pad = createKeypad($('#pad'), k => key(k));
  const sp = opts.scratchpad !== false ? createScratchpad($('#scratch')) : null;
  const cours = modal('coursModal'), menu = modal('menu');
  let Q, ui, attempt, usedHint, done, pending = 0, fauteFaite = false;
  const titre = annonceTitre();

  function newQ() {
    Q = tirerExercice(LEVELS, S);
    attempt = 1; usedHint = false; done = false; fauteFaite = false; S.n++;
    $('#q').innerHTML = Q.html;
    $('#vis').innerHTML = Q.visual;
    const fb = $('#fb'); fb.className = ''; fb.innerHTML = '';
    $('#okBtn').hidden = false; $('#nextBtn').hidden = true; $('#hintBtn').hidden = false;
    ui = ANSWERS[Q.type]($('#answer'), Q, { neg: true, comma: false, ...(opts.keys || {}), ...(Q.keys || {}) });
    pad.show(ui.usesPad);
    const k = { neg: true, comma: false, ...(opts.keys || {}), ...(Q.keys || {}) };
    pad.configure({ neg: k.neg, comma: k.comma, inf: Q.type === 'iv', nav: !!(ui.fields && ui.fields.list.length > 1) || Q.type === 'iv' });
    sp && sp.clear();
    renderHead();
    // le cours n'est jamais ouvert d'office : c'est l'élève qui le déplie (retour d'élève, 2026-11-18)
    if (coursNiveau !== S.level) { coursNiveau = S.level; setCours(false); }
  }

  function key(k) {
    if (done) return;
    if (ui.key) { ui.key(k); return; }
    if (ui.fields) ui.fields.key(k);
  }

  function nudge(t) {
    const fb = $('#fb'); if (fb.className && fb.className !== 'nudge') return;
    fb.className = 'nudge'; fb.innerHTML = t;
    setTimeout(() => { if (!done && fb.className === 'nudge' && fb.innerHTML === t) { fb.className = ''; fb.innerHTML = ''; } }, 1800);
  }

  function validate() {
    if (done) return;
    const v = ui.read();
    if (v && v.incomplete) { nudge(v.incomplete); return; }
    const r = Q.check(v) || { ok: false }, fb = $('#fb');
    ui.mark(r.bad || []);
    if (r.ok) {
      S.total++; S.good++; S.fails = 0;
      const auMax = S.level === LEVELS.length - 1 && S.stars === ETOILES;
      if (attempt === 1 && !usedHint) pending = bouger(S, 1, LEVELS.length);
      let m = `<b>✅ ${pick(PRAISE)}</b>`;
      if (attempt > 1 || usedHint) m += ` <span class="note">(réussi avec de l'aide : on s'entraîne encore un peu à ce niveau)</span>`;
      if (r.msg) m += `<br>${r.msg}`;
      m += `<div class="sol">${Q.solution}</div>`;
      fb.className = 'good'; fb.innerHTML = m; finish();
      if (!auMax && S.level === LEVELS.length - 1 && S.stars === ETOILES) banner(`🏆 Bravo, tu maîtrises tout le module « ${meta.titre} » !`);
    } else if (attempt === 1) {
      attempt = 2; usedHint = true; $('#hintBtn').hidden = true;
      if (!fauteFaite) { fauteFaite = true; pending = bouger(S, -2, LEVELS.length); }
      fb.className = 'bad';
      fb.innerHTML = `<b>Pas tout à fait…</b> ${r.msg || ''}<br>💡 ${Q.hint}<br><span class="note">Essaie encore une fois.</span>`;
    } else {
      S.total++; S.fails++;
      fb.className = 'bad'; fb.innerHTML = `<b>Voici la correction :</b>${r.msg ? `<br>${r.msg}` : ''}<div class="sol">${Q.solution}</div>`; finish();
    }
    save(); renderHead(); titre();
  }

  function finish() {
    done = true; ui.lock();
    $('#okBtn').hidden = true; $('#hintBtn').hidden = true; $('#nextBtn').hidden = false;
    if (Q.afterVisual) $("#vis").innerHTML = Q.replaceVisual ? Q.afterVisual : Q.visual + Q.afterVisual;
    $('#nextBtn').focus({ preventScroll: true });
  }

  function next() {
    if (pending === 1) banner(`🎉 Niveau ${S.level + 1} débloqué : ${LEVELS[S.level].titre}`);
    else if (pending === -1) banner(`On revient au niveau ${S.level + 1} (${S.stars} ★) pour consolider 💪`);
    pending = 0; save(); newQ();
    $('#q').focus({ preventScroll: true });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function renderHead() {
    $('#lvlName').textContent = `· Niveau ${S.level + 1} : ${LEVELS[S.level].titre}`;
    $('#dots').innerHTML = etoilesHTML(S.stars);
    $('#dots').setAttribute('aria-label', `${S.stars} étoile${S.stars > 1 ? 's' : ''} sur ${ETOILES}`);
    $('#score').textContent = `✔ ${S.good} / ${S.total}`;
    $('#qnum').textContent = `Exercice ${S.n}`;
    const r = ETOILES - S.stars;
    $('#help').textContent = S.level < LEVELS.length - 1 ? `★ ${S.stars}/${ETOILES} · encore ${r} pour monter` : `★ ${S.stars}/${ETOILES} · dernier niveau`;
  }

  // cours du niveau dans la page, au-dessus de l'exercice : fermé par défaut, déplié par l'élève, sans cacher l'exercice
  let coursNiveau = -1;
  function setCours(ouvert) {
    $('#coursLabel').textContent = `📘 Cours du niveau ${S.level + 1} : ${LEVELS[S.level].titre}`;
    $('#coursEtat').textContent = ouvert ? 'Fermer ▴' : 'Ouvrir ▾';
    $('#coursToggle').setAttribute('aria-expanded', String(ouvert));
    if (ouvert) $('#coursInline').innerHTML = LEVELS[S.level].cours();
    $('#coursInline').hidden = !ouvert;
  }
  function openCours() { setCours(true); $('#coursPanel').scrollIntoView({ behavior: 'smooth', block: 'start' }); }

  function renderMenu() {
    $('#lvlist').innerHTML = LEVELS.map((L, i) => `<button type="button" data-l="${i}" class="${i === S.level ? 'cur' : ''}" ${i === S.level ? 'aria-current="true"' : ''}><span class="tag">${i + 1}</span><span>${L.titre}</span>${L.classe ? `<small>${L.classe}</small>` : ''}</button>`).join('');
    $('#lvlist').querySelectorAll('[data-l]').forEach(b => {
      b.onclick = () => { S.level = +b.dataset.l; S.streak = 0; S.stars = 0; S.fails = 0; pending = 0; save(); titre(false); menu.close(); newQ(); };
    });
  }

  $('#okBtn').onclick = validate;
  $('#nextBtn').onclick = next;
  $('#hintBtn').onclick = () => { usedHint = true; const fb = $('#fb'); fb.className = 'bad'; fb.innerHTML = `💡 ${Q.hint}`; $('#hintBtn').hidden = true; };
  $('#coursBtn').onclick = openCours;
  $('#coursToggle').onclick = () => setCours($('#coursInline').hidden);
  $('#speakBtn').onclick = () => speak(Q.html);
  $('#openMenu').onclick = () => { renderMenu(); titreMenu(); menu.open(); };
  $('#resetBtn').onclick = () => { $('#resetConfirm').hidden = false; };
  $('#resetNo').onclick = () => { $('#resetConfirm').hidden = true; };
  $('#resetYes').onclick = () => { S = JSON.parse(JSON.stringify(def)); pending = 0; save(); titre(false); $('#resetConfirm').hidden = true; menu.close(); newQ(); };

  setContexte(() => ({
    Module: meta.titre, Niveau: `${S.level + 1} – ${LEVELS[S.level].titre}`, 'Exercice n°': S.n, 'Étoiles': S.stars,
    'Énoncé': Q ? strip(Q.html) : '', 'Réponse attendue': Q ? JSON.stringify(Q.expected) : '', 'Essai': attempt,
  }));

  document.addEventListener('keydown', e => {
    if (e.target && e.target.closest && e.target.closest('#sigModal')) return; // fenêtre de signalement : on tape du texte
    if (e.key === 'Escape') { if (cours.isOpen) cours.close(); else if (menu.isOpen) menu.close(); return; }
    if (cours.isOpen || menu.isOpen) return;
    if (e.target && e.target.closest && e.target.closest('#scratch')) return;
    if (e.key === 'Enter') {
      const t = e.target;
      if (t && t.tagName === 'BUTTON' && !t.closest('#pad') && t.id !== 'okBtn' && t.id !== 'nextBtn') return; // laisser le bouton agir
      e.preventDefault(); done ? next() : validate(); return;
    }
    const k = physicalKey(e);
    if (!k) return;
    if (k === 'next' || k === 'prev') { if (!(ui.fields && ui.fields.list.length) && Q.type !== 'table') return; }
    e.preventDefault(); key(k);
  });

  newQ();
  const api = { get state() { return S; }, get question() { return Q; }, levels: LEVELS, resetAnswer: () => ui.reset() };
  window.__mp = api; // accès pour les tests automatiques
  return api;
}

// Moteur commun : boucle d'exercice, adaptation du niveau, bandeaux, cours, menu, réglages.
import { pick, chance } from './util/rand.js';
import { strip } from './util/fmt.js';
import { ANSWERS } from './answers/index.js';
import { createKeypad, physicalKey } from './keypad.js';
import { createScratchpad } from './scratchpad.js';
import * as store from './storage.js';
import { MODULES } from '../modules/registry.js';
import { installerSignalement, setContexte } from './signaler.js';
export { setContexte };

const PRAISE = ['Bravo !', 'Excellent !', 'Parfait !', 'Bien joué !', 'Super !', 'Exactement !', 'Très bien !'];
const $ = (s, r = document) => r.querySelector(s);

/**
 * Difficulté d passée aux générateurs (0 à 5). La série de réussites ne va que de 0 à NEED − 1
 * (au NEED-ième succès on change de niveau) : on l'étale sur 0…5, avec un peu de hasard pour que
 * chaque valeur de d soit atteinte (NEED = 4 : série 0 → d 0 ou 1, 1 → 1 ou 2, 2 → 3 ou 4, 3 → 5).
 * (Relecture Codex : sans cela, les variantes d ≥ 4 n'apparaissaient jamais.)
 */
export function difficulte(streak, need) {
  const base = Math.floor(streak * 5 / Math.max(1, need - 1));
  return Math.min(5, base + (base < 5 && chance(0.5) ? 1 : 0));
}

/** normalise la sortie d'un générateur (champs du contrat) */
export function normalize(q) {
  if (q.expected === undefined && q.check) q.expected = q.check.expected;
  q.visual = q.visual || '';
  q.afterVisual = q.afterVisual || '';
  return q;
}

/** applique les réglages d'affichage (police plus lisible, grands caractères) */
export function applySettings() {
  const s = store.settings.get();
  document.documentElement.classList.toggle('lisible', !!s.lisible);
  document.documentElement.classList.toggle('grand', !!s.grand);
  return s;
}

/** bandeau temporaire */
let bt;
export function banner(t) {
  const b = $('#banner'); if (!b) return;
  b.textContent = t; b.classList.add('show'); clearTimeout(bt);
  bt = setTimeout(() => b.classList.remove('show'), 3000);
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
  const def = { level: 0, streak: 0, fails: 0, good: 0, total: 0, n: 0, seen: [], max: 0 };
  let S = store.load(id, def);
  if (S.level >= LEVELS.length) S.level = 0;
  const save = () => { S.max = Math.max(S.max || 0, S.level); store.save(id, S); };

  $('#dots').innerHTML = '<i></i>'.repeat(NEED);
  $('#menuNote').innerHTML = `Le niveau monte après <b>${NEED} bonnes réponses d'affilée</b> (du premier coup, sans indice) ; les exercices se corsent un peu à chaque réussite. Il redescend après <b>2 exercices ratés de suite</b>.`;

  const pad = createKeypad($('#pad'), k => key(k));
  const sp = opts.scratchpad !== false ? createScratchpad($('#scratch')) : null;
  const cours = modal('coursModal'), menu = modal('menu');
  let Q, ui, attempt, usedHint, done, pending = 0;

  function newQ() {
    Q = normalize(LEVELS[S.level].generate(difficulte(S.streak, NEED)));
    attempt = 1; usedHint = false; done = false; S.n++;
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
    if (!S.seen.includes(S.level)) { S.seen.push(S.level); save(); openCours(); }
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
      if (attempt === 1 && !usedHint) S.streak++;
      let m = `<b>✅ ${pick(PRAISE)}</b>`;
      if (attempt > 1 || usedHint) m += ` <span class="note">(réussi avec de l'aide : on s'entraîne encore un peu à ce niveau)</span>`;
      if (r.msg) m += `<br>${r.msg}`;
      m += `<div class="sol">${Q.solution}</div>`;
      fb.className = 'good'; fb.innerHTML = m; finish();
      if (S.streak >= NEED) {
        if (S.level < LEVELS.length - 1) pending = 1;
        else { S.streak = 0; banner(`🏆 Bravo, tu maîtrises tout le module « ${meta.titre} » !`); }
      }
    } else if (attempt === 1) {
      attempt = 2; usedHint = true; $('#hintBtn').hidden = true;
      fb.className = 'bad';
      fb.innerHTML = `<b>Pas tout à fait…</b> ${r.msg || ''}<br>💡 ${Q.hint}<br><span class="note">Essaie encore une fois.</span>`;
    } else {
      S.total++; S.streak = 0; S.fails++;
      fb.className = 'bad'; fb.innerHTML = `<b>Voici la correction :</b>${r.msg ? `<br>${r.msg}` : ''}<div class="sol">${Q.solution}</div>`; finish();
      if (S.fails >= 2 && S.level > 0) pending = -1;
    }
    save(); renderHead();
  }

  function finish() {
    done = true; ui.lock();
    $('#okBtn').hidden = true; $('#hintBtn').hidden = true; $('#nextBtn').hidden = false;
    if (Q.afterVisual) $("#vis").innerHTML = Q.replaceVisual ? Q.afterVisual : Q.visual + Q.afterVisual;
    $('#nextBtn').focus({ preventScroll: true });
  }

  function next() {
    if (pending === 1) { S.level++; S.streak = 0; S.fails = 0; banner(`🎉 Niveau ${S.level + 1} débloqué : ${LEVELS[S.level].titre}`); }
    else if (pending === -1) { S.level--; S.streak = 0; S.fails = 0; banner(`On revient au niveau ${S.level + 1} pour consolider 💪`); }
    pending = 0; save(); newQ();
    $('#q').focus({ preventScroll: true });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function renderHead() {
    $('#lvlName').textContent = `· Niveau ${S.level + 1} : ${LEVELS[S.level].titre}`;
    [...$('#dots').children].forEach((d, i) => d.classList.toggle('on', i < S.streak));
    $('#score').textContent = `✔ ${S.good} / ${S.total}`;
    $('#qnum').textContent = `Exercice ${S.n}`;
    const r = NEED - S.streak;
    $('#help').textContent = S.level < LEVELS.length - 1 ? `${r} réussite${r > 1 ? 's' : ''} pour monter` : 'Dernier niveau';
  }

  function openCours() {
    $('#coursBody').innerHTML = LEVELS[S.level].cours();
    cours.open();
  }

  function renderMenu() {
    $('#lvlist').innerHTML = LEVELS.map((L, i) => `<button type="button" data-l="${i}" class="${i === S.level ? 'cur' : ''}" ${i === S.level ? 'aria-current="true"' : ''}><span class="tag">${i + 1}</span><span>${L.titre}</span>${L.classe ? `<small>${L.classe}</small>` : ''}</button>`).join('');
    $('#lvlist').querySelectorAll('[data-l]').forEach(b => {
      b.onclick = () => { S.level = +b.dataset.l; S.streak = 0; S.fails = 0; pending = 0; save(); menu.close(); newQ(); };
    });
  }

  $('#okBtn').onclick = validate;
  $('#nextBtn').onclick = next;
  $('#hintBtn').onclick = () => { usedHint = true; const fb = $('#fb'); fb.className = 'bad'; fb.innerHTML = `💡 ${Q.hint}`; $('#hintBtn').hidden = true; };
  $('#coursBtn').onclick = openCours;
  $('#speakBtn').onclick = () => speak(Q.html);
  $('#openMenu').onclick = () => { renderMenu(); menu.open(); };
  $('#resetBtn').onclick = () => { $('#resetConfirm').hidden = false; };
  $('#resetNo').onclick = () => { $('#resetConfirm').hidden = true; };
  $('#resetYes').onclick = () => { S = JSON.parse(JSON.stringify(def)); pending = 0; save(); $('#resetConfirm').hidden = true; menu.close(); newQ(); };

  setContexte(() => ({
    Module: meta.titre, Niveau: `${S.level + 1} – ${LEVELS[S.level].titre}`, 'Exercice n°': S.n, 'Série en cours (d)': S.streak,
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

// Calcul mental : deux modes.
//  • Entraînement : adaptatif, barre de temps ; 5 réussites RAPIDES (⚡) d'affilée pour monter, 2 erreurs de suite pour redescendre.
//  • Défi 60 s : score, record par niveau, liste des erreurs à la fin.
// Pas de brouillon dans ce module.
import { shell, registerSW, banner, modal, speak, setContexte } from '../../engine/engine.js';
import { createKeypad, physicalKey } from '../../engine/keypad.js';
import { edit, show, parse } from '../../engine/answers/fields.js';
import * as store from '../../engine/storage.js';
import { MODULES } from '../registry.js';
import { LEVELS, OPTIONS } from './levels.js';

const $ = s => document.querySelector(s);
const ID = 'calcul', NEED = OPTIONS.need;
const meta = MODULES.find(m => m.id === ID);
const fmt = x => show(String(Math.round(x * 1e6) / 1e6).replace('.', ','));

shell(meta, { scratchpad: false, headerExtra: `<div class="modes" role="tablist" aria-label="Mode"><button type="button" role="tab" id="mTrain" class="on" aria-selected="true">Entraînement</button><button type="button" role="tab" id="mChrono" aria-selected="false">Défi 60 s</button></div>` });
registerSW();
$('#coursBtn').textContent = '💡 Astuces';
$('#score').hidden = true;
// remplacer la colonne d'exercice par l'interface du calcul mental
$('#main').innerHTML = `
<section class="card" id="play" aria-label="Calcul">
  <div class="qhead"><span id="info1"></span><span id="info2"></span><button type="button" class="speak" id="speakBtn2" aria-label="Lire le calcul à voix haute">🔊</button></div>
  <div id="mq" aria-live="polite"></div>
  <div class="timer" aria-hidden="true"><div id="bar"></div></div>
  <div id="disp" role="textbox" aria-label="ta réponse" tabindex="0"></div>
  <div id="pad"></div>
  <div id="fb" role="status" aria-live="polite"></div>
</section>
<section class="card center" id="chronoStart" hidden>
  <h2>⏱️ Défi 60 secondes</h2>
  <p>Niveau <b id="csLvl"></b><br>Réponds juste au maximum de calculs en une minute.</p>
  <p class="note">Ton record sur ce niveau : <b id="csBest"></b></p>
  <button type="button" class="btn big-btn" id="goBtn">C'est parti !</button>
</section>
<section class="card center" id="chronoEnd" hidden>
  <h2>Temps écoulé !</h2>
  <div class="bigscore" id="ceScore"></div>
  <p id="ceMsg"></p>
  <div class="errs" id="ceErrs"></div>
  <div class="actions"><button type="button" class="btn" id="againBtn">Rejouer</button><button type="button" class="btn ghost" id="backTrain">Retour à l'entraînement</button></div>
</section>`;

const def = { level: 0, streak: 0, fails: 0, good: 0, total: 0, seen: [], best: {}, max: 0 };
let S = store.load(ID, def);
const save = () => { S.max = Math.max(S.max || 0, S.level); store.save(ID, S); };
let mode = 'train', Q, val = '', t0, raf, locked = false, pending = 0, lastQ = '';
let C = { score: 0, errs: [], end: 0, timer: null };
const cours = modal('coursModal'), menu = modal('menu');
cours.onclose = () => { if (mode === 'train' && !locked) { t0 = performance.now(); cancelAnimationFrame(raf); tick(); } };

const pad = createKeypad($('#pad'), k => key(k), [
  ['7', '7'], ['8', '8'], ['9', '9'], ['del', '⌫', 'effacer'],
  ['4', '4'], ['5', '5'], ['6', '6'], ['neg', '−', 'signe moins'],
  ['1', '1'], ['2', '2'], ['3', '3'], [',', ',', 'virgule'],
  ['0', '0', '', true], ['ok', 'OK', 'valider', true],
]);

$('#dots').innerHTML = '<i></i>'.repeat(NEED);
$('#menuNote').innerHTML = `Entraînement : <b>${NEED} bonnes réponses rapides</b> d'affilée (⚡ avant la fin de la barre) pour monter ; <b>2 erreurs de suite</b> pour redescendre. Les calculs se corsent à chaque réussite.`;

function renderHead() {
  $('#lvlName').textContent = `· Niveau ${S.level + 1} : ${LEVELS[S.level].titre}`;
  [...$('#dots').children].forEach((d, i) => d.classList.toggle('on', i < S.streak));
  $('#dots').style.visibility = mode === 'train' ? 'visible' : 'hidden';
  $('#score').textContent = `✔ ${S.good} / ${S.total}`;
  if (mode === 'train') { $('#info1').textContent = `✔ ${S.good} / ${S.total}`; $('#info2').textContent = S.level < LEVELS.length - 1 ? `${NEED - S.streak} ⚡ pour monter` : 'Dernier niveau'; }
}
function newQ() {
  let g, k = 0;
  do { g = LEVELS[S.level].generate(mode === 'train' ? S.streak : 4); k++; } while (g.q === lastQ && k < 10);
  Q = g; lastQ = g.q; val = ''; locked = false;
  $('#mq').innerHTML = Q.q.includes('?') ? Q.q : Q.q + ' <span class="eq">=</span>';
  $('#disp').className = ''; showVal();
  if (mode === 'train') { $('#fb').className = ''; $('#fb').innerHTML = ''; }
  t0 = performance.now(); cancelAnimationFrame(raf); if (mode === 'train') tick();
}
function tick() {
  const T = LEVELS[S.level].T * 1000, e = performance.now() - t0, r = Math.max(0, 1 - e / T), b = $('#bar');
  b.style.transform = `scaleX(${r})`; b.style.background = r > .5 ? 'var(--good)' : r > .2 ? '#f59f00' : 'var(--bad)';
  if (!locked && r > 0) raf = requestAnimationFrame(tick);
}
function showVal() { $('#disp').textContent = show(val) || ' '; }
function key(k) {
  if (locked) return;
  if (k === 'ok') return submit();
  val = edit(val, k, { neg: true, comma: true });
  showVal();
}
function submit() {
  const x = parse(val); if (x === null) return;
  const ok = Math.abs(x - Q.a) < 1e-9, dt = (performance.now() - t0) / 1000;
  if (mode === 'chrono') return chronoAnswer(ok);
  locked = true; cancelAnimationFrame(raf); S.total++;
  const fast = dt <= LEVELS[S.level].T, sec = dt.toFixed(1).replace('.', ',');
  if (ok) {
    S.good++; S.fails = 0; $('#disp').className = 'ok';
    if (fast) { S.streak++; $('#fb').className = 'good'; $('#fb').innerHTML = `✅ ⚡ ${sec} s`; }
    else { $('#fb').className = 'good'; $('#fb').innerHTML = `✅ Juste ! <span class="note">(${sec} s — essaie d'être plus rapide pour gagner un ⚡)</span>`; }
    if (S.streak >= NEED) { if (S.level < LEVELS.length - 1) pending = 1; else { S.streak = 0; banner('🏆 Champion du calcul mental !'); } }
    save(); renderHead(); setTimeout(next, fast ? 750 : 1500);
  } else {
    S.streak = 0; S.fails++; $('#disp').className = 'ko';
    $('#fb').className = 'bad';
    $('#fb').innerHTML = `<b>${Q.q.includes('?') ? Q.q.replace('?', '<u>' + fmt(Q.a) + '</u>') : Q.q + ' = ' + fmt(Q.a)}</b><br>💡 ${Q.tip}<div class="actions"><button type="button" class="btn" id="nextBtn">Suivant →</button></div>`;
    $('#nextBtn').onclick = next; $('#nextBtn').focus();
    if (S.fails >= 2 && S.level > 0) pending = -1;
    save(); renderHead();
  }
}
function next() {
  if (pending === 1) { S.level++; S.streak = 0; S.fails = 0; banner(`🎉 Niveau ${S.level + 1} débloqué : ${LEVELS[S.level].titre}`); }
  else if (pending === -1) { S.level--; S.streak = 0; S.fails = 0; banner(`On revient au niveau ${S.level + 1} pour consolider 💪`); }
  pending = 0; save(); renderHead(); newQ();
  if (!S.seen.includes(S.level)) { S.seen.push(S.level); save(); openCours(); }
}

/* ---------- défi chrono ---------- */
function setMode(m) {
  mode = m;
  $('#mTrain').classList.toggle('on', m === 'train'); $('#mTrain').setAttribute('aria-selected', String(m === 'train'));
  $('#mChrono').classList.toggle('on', m === 'chrono'); $('#mChrono').setAttribute('aria-selected', String(m === 'chrono'));
  clearInterval(C.timer); cancelAnimationFrame(raf);
  $('#play').hidden = m !== 'train'; $('#chronoEnd').hidden = true; $('#chronoStart').hidden = m !== 'chrono';
  if (m === 'chrono') { $('#csLvl').textContent = `${S.level + 1} – ${LEVELS[S.level].titre}`; $('#csBest').textContent = S.best[S.level] ?? 'aucun'; $('#goBtn').focus(); }
  else newQ();
  renderHead();
}
function startChrono() {
  C = { score: 0, errs: [], end: performance.now() + 60000, timer: null };
  $('#chronoStart').hidden = true; $('#chronoEnd').hidden = true; $('#play').hidden = false; $('#fb').className = ''; $('#fb').innerHTML = '';
  newQ();
  C.timer = setInterval(() => {
    const r = Math.max(0, C.end - performance.now()); $('#info2').textContent = `⏱️ ${Math.ceil(r / 1000)} s`;
    const b = $('#bar'); b.style.transform = `scaleX(${r / 60000})`; b.style.background = r > 20000 ? 'var(--good)' : r > 8000 ? '#f59f00' : 'var(--bad)';
    if (r <= 0) endChrono();
  }, 100);
  $('#info1').textContent = 'Score : 0';
}
function chronoAnswer(ok) {
  locked = true;
  if (ok) C.score++;
  else C.errs.push(`${Q.q.includes('?') ? Q.q.replace('?', '<b>' + fmt(Q.a) + '</b>') : Q.q + ' = <b>' + fmt(Q.a) + '</b>'} <span class="note">(tu as répondu ${show(val)})</span>`);
  $('#disp').className = ok ? 'ok' : 'ko'; $('#info1').textContent = `Score : ${C.score}`;
  setTimeout(() => { if (performance.now() < C.end) newQ(); }, ok ? 220 : 650);
}
function endChrono() {
  clearInterval(C.timer); locked = true;
  const prev = S.best[S.level] ?? -1, rec = C.score > prev; if (rec) S.best[S.level] = C.score; save();
  $('#play').hidden = true; $('#chronoEnd').hidden = false;
  $('#ceScore').textContent = C.score;
  $('#ceMsg').innerHTML = (rec && prev >= 0 ? '🎉 <b>Nouveau record !</b> ' : rec ? 'Premier record enregistré ! ' : `Record : ${prev}. `) + (C.errs.length ? `${C.errs.length} erreur${C.errs.length > 1 ? 's' : ''} :` : 'Aucune erreur, bravo !');
  $('#ceErrs').innerHTML = C.errs.map(e => '• ' + e).join('<br>');
  $('#againBtn').focus();
}
$('#mTrain').onclick = () => setMode('train'); $('#mChrono').onclick = () => setMode('chrono');
$('#goBtn').onclick = startChrono; $('#againBtn').onclick = () => { setMode('chrono'); startChrono(); }; $('#backTrain').onclick = () => setMode('train');

/* ---------- divers ---------- */
function openCours() { $('#coursBody').innerHTML = LEVELS[S.level].cours(); cancelAnimationFrame(raf); cours.open(); }
$('#coursBtn').onclick = openCours;
$('#speakBtn2').onclick = () => speak(Q.q);
if (!('speechSynthesis' in window)) $('#speakBtn2').hidden = true;
function renderMenu() {
  $('#lvlist').innerHTML = LEVELS.map((L, i) => `<button type="button" data-l="${i}" class="${i === S.level ? 'cur' : ''}"><span class="tag">${i + 1}</span><span>${L.titre}</span><small>${S.best[i] != null ? '⏱️ record ' + S.best[i] : ''}</small></button>`).join('');
  $('#lvlist').querySelectorAll('[data-l]').forEach(b => {
    b.onclick = () => {
      S.level = +b.dataset.l; S.streak = 0; S.fails = 0; pending = 0; save(); menu.close(); setMode(mode);
      if (mode === 'train' && !S.seen.includes(S.level)) { S.seen.push(S.level); save(); openCours(); }
    };
  });
}
$('#openMenu').onclick = () => { renderMenu(); menu.open(); };
$('#resetBtn').onclick = () => { $('#resetConfirm').hidden = false; };
$('#resetNo').onclick = () => { $('#resetConfirm').hidden = true; };
$('#resetYes').onclick = () => { S = JSON.parse(JSON.stringify(def)); pending = 0; save(); $('#resetConfirm').hidden = true; menu.close(); setMode('train'); };

setContexte(() => ({ Module: meta.titre, Mode: mode === 'train' ? 'Entraînement' : 'Défi 60 s', Niveau: `${S.level + 1} – ${LEVELS[S.level].titre}`, Calcul: Q ? Q.q.replace(/<[^>]+>/g, ' ') : '', 'Réponse attendue': Q ? Q.a : '', 'Réponse tapée': val }));
document.addEventListener('keydown', e => {
    if (e.target && e.target.closest && e.target.closest('#sigModal')) return; // fenêtre de signalement : on tape du texte
  if (e.key === 'Escape') { if (cours.isOpen) cours.close(); else if (menu.isOpen) menu.close(); return; }
  if (cours.isOpen || menu.isOpen) return;
  if ($('#play').hidden) return; // écrans de début / fin du défi : les boutons gèrent Entrée
  if (e.key === 'Enter') {
    if (e.target && e.target.tagName === 'BUTTON' && !e.target.closest('#pad')) return;
    e.preventDefault();
    if (locked && mode === 'train' && $('#nextBtn')) $('#nextBtn').click(); else key('ok');
    return;
  }
  const k = physicalKey(e);
  if (k && !['prev', 'next', 'inf', '<', '>', '=', '+'].includes(k)) { e.preventDefault(); key(k); }
});

if (S.level >= LEVELS.length) S.level = 0;
// « ?niveau=n » (liens des fiches de synthèse) : ouvre directement le niveau n, comme le menu Niveaux
{
  const demande = +new URLSearchParams(location.search).get('niveau');
  if (demande >= 1 && demande <= LEVELS.length && demande - 1 !== S.level) { S.level = demande - 1; S.streak = 0; S.fails = 0; save(); }
}
window.__mp = { get state() { return S; }, get question() { return Q; }, levels: LEVELS };
setMode('train');
if (!S.seen.includes(S.level)) { S.seen.push(S.level); save(); openCours(); }

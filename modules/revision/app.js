// Révision brevet : exercices tirés de tous les modules du collège déjà en ligne, chronométrés,
// une seule tentative par exercice, puis un bilan des points forts et des points faibles.
import { shell, registerSW, banner, modal, speak, normalize, setContexte, titreMenu } from '../../engine/engine.js';
import { strip } from '../../engine/util/fmt.js';
import { ANSWERS } from '../../engine/answers/index.js';
import { numsCheck } from '../../engine/answers/checks.js';
import { createKeypad, physicalKey } from '../../engine/keypad.js';
import { createScratchpad } from '../../engine/scratchpad.js';
import { ri, shuffle } from '../../engine/util/rand.js';
import { M } from '../../engine/util/fmt.js';
import * as store from '../../engine/storage.js';
import { MODULES, READY } from '../registry.js';

const $ = s => document.querySelector(s);
const ID = 'revision';
// modules du collège (dans l'ordre du programme) ; seuls ceux qui sont en ligne sont utilisés
export const COLLEGE = ['calcul', 'fractions', 'relatifs', 'priorites', 'puissances', 'litteral', 'equations',
  'proportionnalite', 'stats-probas', 'pythagore', 'thales-trigo', 'aires-volumes', 'angles', 'fonctions'];
const meta = MODULES.find(m => m.id === ID);

shell(meta, { scratchpad: true });
registerSW();
$('#coursBtn').textContent = '📘 Conseils';
$('#openMenu').textContent = 'Réglages';
$('#dots').hidden = true;
const pad = createKeypad($('#pad'), k => key(k));
const sp = createScratchpad($('#scratch'));
const cours = modal('coursModal'), menu = modal('menu');
$('#menu h2').textContent = 'Révision brevet';
$('#menuNote').innerHTML = 'Les exercices viennent de tous les modules du collège déjà en ligne, aux niveaux 4 à 12. Une seule tentative par exercice : c\'est comme le jour du brevet !';
$('#lvlist').hidden = true;

const def = { sessions: 0, best: null, last: 0, history: [] };
let S = store.load(ID, def);
const save = () => store.save(ID, S);

let pool = [], session = null, Q = null, ui = null, done = false, timer = null;

async function loadPool() {
  const ids = COLLEGE.filter(id => READY.some(m => m.id === id));
  const mods = await Promise.all(ids.map(async id => {
    const mod = await import(`../${id}/levels.js`);
    const meta = MODULES.find(m => m.id === id);
    if (meta.css) { const l = document.createElement('link'); l.rel = 'stylesheet'; l.href = `../${id}/style.css`; document.head.appendChild(l); }
    return { id, meta, LEVELS: mod.LEVELS, OPT: mod.OPTIONS || {} };
  }));
  return mods;
}

/** un exercice d'un module ; le calcul mental est converti en exercice à une case */
function makeQuestion(m) {
  const lv = ri(Math.min(3, m.LEVELS.length - 1), m.LEVELS.length - 1);
  const L = m.LEVELS[lv];
  if (m.OPT.mental) {
    const g = L.generate(3);
    const html = `Calcul mental :<div class="big">${g.q}${g.q.includes('?') ? '' : ' = ?'}</div>`;
    return { mod: m, lv, q: normalize({ type: 'nums', html, tpl: 'Réponse : {0}', check: numsCheck([g.a]), keys: { comma: true }, hint: g.tip, solution: `${g.q.includes('?') ? g.q.replace('?', '<b>' + M(g.a) + '</b>') : g.q + ' = <b>' + M(g.a) + '</b>'}<br>💡 ${g.tip}` }) };
  }
  return { mod: m, lv, q: normalize(L.generate(ri(2, 5))), keys: m.OPT.keys };
}

function startScreen() {
  clearInterval(timer);
  // abandonner proprement toute séance en cours (relecture Codex : Entrée pouvait la reprendre)
  session = null; Q = null; ui = null; done = true;
  $('#qnum').textContent = 'Révision brevet'; $('#help').textContent = '';
  $('#lvlName').textContent = '';
  $('#score').textContent = S.best !== null ? `Record : ${S.best} %` : '';
  const n = pool.length;
  $('#q').innerHTML = `<h2 style="margin:0 0 8px">🎓 Prêt pour une révision ?</h2>
    <p>Des exercices tirés au hasard dans <b>${n} module${n > 1 ? 's' : ''}</b> du collège : ${pool.map(m => m.meta.emoji + ' ' + m.meta.titre).join(', ')}.</p>
    <p>Un exercice = <b>une seule tentative</b>. Le temps est limité : environ 1 minute 30 par exercice.</p>
    <div class="actions left"><button type="button" class="btn" data-n="10">10 exercices (15 min)</button><button type="button" class="btn ghost" data-n="20">20 exercices (30 min)</button><button type="button" class="btn ghost" data-n="5">5 exercices (7 min 30)</button></div>
    ${S.history.length ? `<p class="note">Dernières séances : ${S.history.slice(-5).map(h => `${h.score}/${h.n}`).join(' · ')}</p>` : ''}`;
  $('#vis').innerHTML = ''; $('#answer').innerHTML = ''; pad.show(false); $('#acard').hidden = true;
  $('#okBtn').hidden = true; $('#hintBtn').hidden = true; $('#nextBtn').hidden = true;
  const fb = $('#fb'); fb.className = ''; fb.innerHTML = '';
  $('#q').querySelectorAll('[data-n]').forEach(b => { b.onclick = () => start(+b.dataset.n); });
}

function start(n) {
  // répartir les exercices entre les modules, dans un ordre mélangé
  const order = []; while (order.length < n) order.push(...shuffle([...pool]));
  session = { n, i: 0, order: order.slice(0, n), res: [], end: Date.now() + n * 90000, t0: Date.now() };
  timer = setInterval(tick, 500); tick();
  nextQ();
}
function tick() {
  if (!session) return;
  const r = Math.max(0, session.end - Date.now()), mn = Math.floor(r / 60000), s = Math.floor(r / 1000) % 60;
  $('#help').textContent = `⏱️ ${mn} min ${String(s).padStart(2, '0')} s`;
  if (r <= 0) { banner('⏱️ Temps écoulé !'); finish(); }
}
function nextQ() {
  if (session.i >= session.n) return finish();
  const m = session.order[session.i];
  const item = makeQuestion(m); Q = item.q; session.cur = item; done = false; $('#acard').hidden = false;
  $('#qnum').textContent = `Exercice ${session.i + 1} / ${session.n}`;
  $('#lvlName').textContent = `· ${m.meta.emoji} ${m.meta.titre} (niveau ${item.lv + 1})`;
  $('#score').textContent = `✔ ${session.res.filter(r => r.ok).length} / ${session.res.length}`;
  $('#q').innerHTML = Q.html; $('#vis').innerHTML = Q.visual;
  const fb = $('#fb'); fb.className = ''; fb.innerHTML = '';
  const k = { neg: true, comma: false, ...(m.OPT.keys || {}), ...(Q.keys || {}) };
  ui = ANSWERS[Q.type]($('#answer'), Q, k);
  pad.show(ui.usesPad);
  pad.configure({ neg: k.neg, comma: k.comma, inf: Q.type === 'iv', nav: !!(ui.fields && ui.fields.list.length > 1) || Q.type === 'iv' });
  $('#okBtn').hidden = false; $('#nextBtn').hidden = true; $('#hintBtn').hidden = true;
  sp.clear();
  $('#q').focus({ preventScroll: true }); window.scrollTo({ top: 0, behavior: 'smooth' });
}
function key(k) { if (done || !ui) return; if (ui.key) ui.key(k); else if (ui.fields) ui.fields.key(k); }
function validate() {
  if (done || !session) return;
  const v = ui.read();
  if (v && v.incomplete) { const fb = $('#fb'); fb.className = 'nudge'; fb.innerHTML = v.incomplete; return; }
  const r = Q.check(v) || { ok: false }; ui.mark(r.bad || []); ui.lock(); done = true;
  const it = session.cur;
  session.res.push({ id: it.mod.id, ok: r.ok });
  const fb = $('#fb');
  if (r.ok) { fb.className = 'good'; fb.innerHTML = `<b>✅ Juste !</b>${r.msg ? '<br>' + r.msg : ''}<div class="sol">${Q.solution}</div>`; }
  else { fb.className = 'bad'; fb.innerHTML = `<b>Voici la correction :</b>${r.msg ? '<br>' + r.msg : ''}<div class="sol">${Q.solution}</div>`; }
  if (Q.afterVisual) $('#vis').innerHTML = Q.replaceVisual ? Q.afterVisual : Q.visual + Q.afterVisual;
  $('#okBtn').hidden = true; $('#nextBtn').hidden = false; $('#nextBtn').focus({ preventScroll: true });
  $('#score').textContent = `✔ ${session.res.filter(x => x.ok).length} / ${session.res.length}`;
  session.i++;
}
function finish() {
  clearInterval(timer);
  const s = session; if (!s) return; session = null; done = true;
  const n = s.res.length, ok = s.res.filter(r => r.ok).length, pct = n ? Math.round(100 * ok / s.n) : 0;
  const per = {};
  s.res.forEach(r => { per[r.id] = per[r.id] || { ok: 0, n: 0 }; per[r.id].n++; if (r.ok) per[r.id].ok++; });
  const rows = Object.entries(per).map(([id, v]) => ({ id, ...v, m: MODULES.find(m => m.id === id), p: v.ok / v.n })).sort((a, b) => b.p - a.p);
  const forts = rows.filter(r => r.p >= .75), faibles = rows.filter(r => r.p < .5);
  const prev = S.best; S.sessions++; S.history.push({ n: s.n, score: ok, date: Date.now() }); S.history = S.history.slice(-20);
  if (prev === null || pct > prev) S.best = pct;
  save();
  const lien = r => `<a href="../${r.id}/">${r.m.emoji} ${r.m.titre}</a> (${r.ok}/${r.n})`;
  $('#qnum').textContent = 'Bilan'; $('#lvlName').textContent = ''; $('#help').textContent = '';
  $('#q').innerHTML = `<h2 style="margin:0 0 6px">🎓 Bilan : ${ok} / ${s.n} (${pct} %)</h2>
    <p>${pct >= 80 ? 'Excellent travail ! 🎉' : pct >= 50 ? 'Bien ! Continue à t\'entraîner sur les points faibles. 💪' : 'Courage : chaque module se travaille à ton rythme, niveau par niveau. 💪'}
    ${prev !== null && pct > prev ? '<b>Nouveau record !</b>' : ''} ${n < s.n ? `<br><span class="note">${s.n - n} exercice(s) non traité(s) faute de temps.</span>` : ''}</p>
    <h3>💪 Points forts</h3><p>${forts.length ? forts.map(lien).join(' · ') : '<span class="note">Pas encore de module réussi à 75 % : ça viendra !</span>'}</p>
    <h3>🎯 À retravailler</h3><p>${faibles.length ? faibles.map(lien).join(' · ') : '<span class="note">Aucun point faible net. Bravo !</span>'}</p>
    <table class="data"><tr><th>Module</th><th>Réussis</th></tr>${rows.map(r => `<tr><td>${r.m.emoji} ${r.m.titre}</td><td>${r.ok} / ${r.n}</td></tr>`).join('')}</table>
    <div class="actions"><button type="button" class="btn" id="againBtn">Nouvelle révision</button></div>`;
  $('#vis').innerHTML = ''; $('#answer').innerHTML = ''; pad.show(false); $('#acard').hidden = true;
  $('#okBtn').hidden = true; $('#nextBtn').hidden = true; $('#fb').className = ''; $('#fb').innerHTML = '';
  $('#againBtn').onclick = startScreen;
  $('#score').textContent = `Record : ${S.best} %`;
}

$('#okBtn').onclick = validate;
$('#nextBtn').onclick = () => nextQ();
$('#coursBtn').onclick = () => {
  $('#coursBody').innerHTML = `<h2>Conseils pour le brevet</h2>
  <div class="def">Lis tout l'énoncé avant de commencer. Repère ce qu'on te demande (une longueur ? une probabilité ? un nombre ?).</div>
  <div class="ex">Écris les étapes au brouillon : une erreur se voit mieux quand chaque étape est écrite.</div>
  <div class="ex">Vérifie l'ordre de grandeur de ta réponse : une longueur négative, une probabilité plus grande que 1, un prix de 10 000 € pour un croissant… c'est qu'il y a une erreur.</div>
  <div class="warn">⚠️ Ne reste pas bloqué : si un exercice résiste, réponds au mieux et passe au suivant. Tu reviendras sur ce module avec le bilan.</div>
  <p>Après la séance, le bilan te propose de retravailler les modules où tu as eu des difficultés : chaque module a 12 niveaux avec un cours.</p>`;
  cours.open();
};
$('#speakBtn').onclick = () => Q && speak(Q.html);
$('#openMenu').onclick = () => { titreMenu(); menu.open(); };
$('#resetBtn').textContent = 'Effacer l\'historique des révisions';
$('#resetBtn').onclick = () => { $('#resetConfirm').hidden = false; };
$('#resetNo').onclick = () => { $('#resetConfirm').hidden = true; };
$('#resetYes').onclick = () => { S = JSON.parse(JSON.stringify(def)); save(); $('#resetConfirm').hidden = true; menu.close(); startScreen(); };

setContexte(() => {
  const it = session && session.cur;
  return { Module: 'Révision brevet', 'Exercice tiré de': it ? `${it.mod.meta.titre}, niveau ${it.lv + 1} – ${it.mod.LEVELS[it.lv].titre}` : '', 'Énoncé': Q ? strip(Q.html) : '', 'Réponse attendue': Q ? JSON.stringify(Q.expected) : '' };
});
document.addEventListener('keydown', e => {
    if (e.target && e.target.closest && e.target.closest('#sigModal')) return; // fenêtre de signalement : on tape du texte
  if (e.key === 'Escape') { if (cours.isOpen) cours.close(); else if (menu.isOpen) menu.close(); return; }
  if (cours.isOpen || menu.isOpen || !session) return;
  if (e.target && e.target.closest && e.target.closest('#scratch')) return;
  if (e.key === 'Enter') {
    const t = e.target;
    if (t && t.tagName === 'BUTTON' && !t.closest('#pad') && t.id !== 'okBtn' && t.id !== 'nextBtn') return;
    e.preventDefault(); done ? nextQ() : validate(); return;
  }
  const k = physicalKey(e); if (!k) return;
  e.preventDefault(); key(k);
});

window.__mp = { get question() { return Q; }, get session() { return session; }, start, resetAnswer: () => ui && ui.reset() };
pool = await loadPool();
startScreen();

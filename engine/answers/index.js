// Types de réponse. build(el, q, allow) renvoie
// { fields?: FieldSet, read(): valeur | {incomplete: msg}, mark(bad), lock(), usesPad, keys }
import { FieldSet, parse } from './fields.js';
import { INF } from '../util/fmt.js';
import { I, REALS } from '../draw/realLine.js';

export const FRAC_TPL = '<div class="ansfrac">{0}<div class="fbar"></div>{1}</div>';

function boxes(tpl, fs, vals, labels = []) {
  let k = 0;
  return tpl.replace(/\{(\d+)\}/g, (m, i) => `<span class="box" data-f="${i}" data-n="${k++}"></span>`);
}
function bindBoxes(el, fs, vals, labels = []) {
  const spans = [...el.querySelectorAll('.box[data-f]')].sort((a, b) => a.dataset.f - b.dataset.f);
  spans.forEach(s => { const i = +s.dataset.f; fs.add(s, () => vals[i], v => { vals[i] = v; }, labels[i]); });
}

/* ---------- nums / frac / steps : cases dans un gabarit ---------- */
function nums(el, q, allow) {
  const tpl = q.type === 'frac' ? FRAC_TPL : (q.tpl || 'Réponse : {0}');
  const n = (tpl.match(/\{\d+\}/g) || []).length;
  const vals = Array(n).fill('');
  const fs = new FieldSet(allow);
  el.innerHTML = `<div class="tpl ${q.type === 'steps' ? 'steps' : ''}">${boxes(tpl, fs, vals)}</div>`;
  bindBoxes(el, fs, vals, q.labels || (q.type === 'frac' ? ['numérateur', 'dénominateur'] : []));
  fs.render();
  return {
    fields: fs, usesPad: true,
    read() { if (fs.empty) return { incomplete: n > 1 ? 'Remplis toutes les cases.' : 'Écris ta réponse.' }; return vals.map(parse); },
    mark: bad => fs.mark(bad), lock: () => fs.lock(),
    reset() { vals.fill(''); fs.act = 0; fs.mark([]); fs.render(); },
  };
}

/* ---------- roots : x₁, x₂ ou « aucune solution » ---------- */
function roots(el, q, allow) {
  const vals = ['', ''], st = { none: false };
  const fs = new FieldSet(allow);
  el.innerHTML = `<div class="tpl"><span>x₁ =</span><span class="box" data-f="0"></span><span class="sep">x₂ =</span><span class="box" data-f="1"></span></div><button class="opt none" type="button" aria-pressed="false">${q.noneLabel || 'Aucune solution'}</button>`;
  bindBoxes(el, fs, vals, ['première solution', 'deuxième solution']);
  const nb = el.querySelector('.none');
  const orig = fs.key.bind(fs);
  fs.key = k => { if (st.none && k !== 'next' && k !== 'prev') { st.none = false; nb.classList.remove('sel'); nb.setAttribute('aria-pressed', 'false'); } return orig(k); };
  nb.onclick = () => { if (fs.locked) return; st.none = !st.none; nb.classList.toggle('sel', st.none); nb.setAttribute('aria-pressed', String(st.none)); if (st.none) { vals[0] = vals[1] = ''; fs.render(); } };
  fs.render();
  return {
    fields: fs, usesPad: true,
    read() {
      if (!st.none && vals.every(v => parse(v) === null)) return { incomplete: 'Écris au moins une solution, ou choisis « Aucune solution ».' };
      return { none: st.none, vals: vals.map(parse) };
    },
    mark: bad => fs.mark(bad), lock: () => { fs.lock(); nb.disabled = true; },
    reset() { vals[0] = vals[1] = ''; st.none = false; nb.classList.remove('sel'); fs.mark([]); fs.render(); },
  };
}

/* ---------- choice / cmp ---------- */
function choice(el, q) {
  const st = { c: null };
  const cmp = q.type === 'cmp';
  const opts = cmp ? [{ v: '<', l: '&lt;' }, { v: '=', l: '=' }, { v: '>', l: '&gt;' }] : q.opts;
  el.innerHTML = `<div class="${cmp ? 'cmp' : 'choices'}" role="radiogroup">${opts.map((o, i) => `<button type="button" role="radio" aria-checked="false" data-c="${o.v}" ${cmp ? `aria-label="${o.v === '<' ? 'plus petit que' : o.v === '>' ? 'plus grand que' : 'égal à'}"` : ''}>${cmp ? '' : `<span class="kbd">${i + 1}</span>`}${o.l}</button>`).join('')}</div>`;
  const btns = [...el.querySelectorAll('[data-c]')];
  let locked = false;
  const sel = b => { if (locked) return; st.c = b.dataset.c; btns.forEach(x => { x.classList.toggle('sel', x === b); x.setAttribute('aria-checked', String(x === b)); }); };
  btns.forEach(b => { b.onclick = () => sel(b); });
  return {
    usesPad: false,
    key(k) {
      if (cmp && ['<', '>', '='].includes(k)) { sel(btns.find(b => b.dataset.c === k)); return true; }
      if (!cmp && /^[1-9]$/.test(k) && btns[+k - 1]) { sel(btns[+k - 1]); return true; }
      return false;
    },
    read() { if (st.c === null) return { incomplete: cmp ? 'Choisis un signe.' : 'Choisis une réponse.' }; return { c: st.c }; },
    mark() {}, lock() { locked = true; btns.forEach(b => { b.disabled = !b.classList.contains('sel'); }); },
    reset() { st.c = null; btns.forEach(b => { b.classList.remove('sel'); b.setAttribute('aria-checked', 'false'); }); },
  };
}

/* ---------- iv : intervalles avec crochets ---------- */
function interval(el, q, allow) {
  const A = { iv: [{ lb: '[', lo: '', hi: '', rb: ']' }], sp: null };
  let fs = new FieldSet({ ...allow, inf: true, neg: true });
  let locked = false;
  const render = keepAct => {
    const act = keepAct ? fs.act : 0;
    fs = new FieldSet({ ...allow, inf: true, neg: true });
    let h = `<div class="ivrow ${A.sp ? 'dim' : ''}">`;
    A.iv.forEach((iv, i) => {
      if (i) h += `<span class="cup">∪</span>`;
      h += `<button type="button" class="br" data-b="${i}-l" aria-label="crochet gauche ${iv.lb}">${iv.lb}</button><span class="box" data-f="${2 * i}"></span><span>;</span><span class="box" data-f="${2 * i + 1}"></span><button type="button" class="br" data-b="${i}-r" aria-label="crochet droit ${iv.rb}">${iv.rb}</button>`;
    });
    h += `</div><div class="ivctl">${A.iv.length === 1 ? `<button type="button" data-a="add">∪ 2<sup>e</sup> intervalle</button>` : `<button type="button" data-a="rm">✕ retirer le 2<sup>e</sup></button>`}<button type="button" data-a="R" class="${A.sp === 'R' ? 'sel' : ''}">ℝ tous les réels</button><button type="button" data-a="E" class="${A.sp === 'E' ? 'sel' : ''}">∅ aucun réel</button></div>`;
    el.innerHTML = h;
    const spans = [...el.querySelectorAll('.box[data-f]')];
    spans.forEach(s => {
      const k = +s.dataset.f, iv = A.iv[k >> 1], key = k % 2 ? 'hi' : 'lo';
      fs.add(s, () => iv[key], v => { iv[key] = v; if (A.sp) { A.sp = null; el.querySelector('.ivrow').classList.remove('dim'); el.querySelectorAll('[data-a=R],[data-a=E]').forEach(b => b.classList.remove('sel')); } }, `${key === 'lo' ? 'borne gauche' : 'borne droite'} de l'intervalle ${(k >> 1) + 1}`);
    });
    fs.act = Math.min(act, spans.length - 1);
    if (locked) fs.lock();
    el.querySelectorAll('[data-b]').forEach(b => {
      b.onclick = () => {
        if (locked) return; const [i, s] = b.dataset.b.split('-'), iv = A.iv[+i];
        if (s === 'l') iv.lb = iv.lb === '[' ? ']' : '['; else iv.rb = iv.rb === ']' ? '[' : ']';
        b.textContent = s === 'l' ? iv.lb : iv.rb;
      };
    });
    el.querySelectorAll('[data-a]').forEach(b => {
      b.onclick = () => {
        if (locked) return; const a = b.dataset.a;
        if (a === 'add') { A.iv.push({ lb: '[', lo: '', hi: '', rb: ']' }); A.sp = null; render(false); fs.act = 2; fs.render(); return; }
        if (a === 'rm') { A.iv.pop(); render(false); return; }
        A.sp = A.sp === a ? null : a; render(true);
      };
    });
    fs.render();
    api.fields = fs;
  };
  const num = v => parse(v);
  const api = {
    usesPad: true, fields: fs,
    key: k => fs.key(k),
    read() {
      if (A.sp === 'R') return { set: REALS() }; if (A.sp === 'E') return { set: [] };
      const out = [];
      for (const iv of A.iv) {
        const lo = num(iv.lo), hi = num(iv.hi);
        if (lo === null || hi === null) return { incomplete: 'Complète les deux bornes de chaque intervalle (ou choisis ℝ / ∅).' };
        const lc = iv.lb === '[', hc = iv.rb === ']';
        if ((lo === -INF && lc) || (hi === INF && hc) || lo === INF || hi === -INF) return { err: "Du côté de l'infini, le crochet est toujours <b>ouvert</b> (et −∞ à gauche, +∞ à droite)." };
        if (lo >= hi) return { err: 'La borne de gauche doit être plus petite que celle de droite.' };
        out.push(I(lo, lc, hi, hc));
      }
      return { set: out.sort((a, b) => a.lo - b.lo) };
    },
    mark() {}, lock() { locked = true; fs.lock(); el.querySelectorAll('button').forEach(b => { b.disabled = true; }); },
    reset() { A.iv = [{ lb: '[', lo: '', hi: '', rb: ']' }]; A.sp = null; render(false); },
  };
  render(false);
  return api;
}

/* ---------- table : tableau de signes à compléter ---------- */
function signTable(el, q) {
  const xs = q.xs, z = Array(xs.length + 1).fill('');
  const fmt = q.fmtX || (x => String(x).replace('-', '−'));
  let h = `<table class="st"><tr><td>x</td><td class="e">−∞</td>`;
  xs.forEach(x => { h += `<td class="e"></td><td>${fmt(x)}</td>`; });
  h += `<td class="e"></td><td class="e">+∞</td></tr><tr><td>${q.rowLabel || 'f(x)'}</td><td class="e"></td>`;
  z.forEach((_, i) => { h += `<td class="e"><button type="button" class="z" data-z="${i}" aria-label="signe de la zone ${i + 1}">?</button></td>`; if (i < xs.length) h += `<td>0</td>`; });
  el.innerHTML = `<div class="tablewrap">${h}<td class="e"></td></tr></table></div>`;
  const btns = [...el.querySelectorAll('[data-z]')];
  let locked = false, act = 0;
  const set = (i, v) => { z[i] = v; const b = btns[i]; b.textContent = v || '?'; b.className = 'z ' + (v === '+' ? 'p' : v === '−' ? 'm' : ''); };
  btns.forEach((b, i) => { b.onclick = () => { if (locked) return; act = i; set(i, z[i] === '+' ? '−' : '+'); }; b.onfocus = () => { act = i; }; });
  return {
    usesPad: false,
    key(k) {
      if (locked) return false;
      if (k === '+' || k === '-' || k === 'neg') { set(act, k === '+' ? '+' : '−'); act = Math.min(act + 1, z.length - 1); btns[act].focus(); return true; }
      if (k === 'next' || k === 'prev') { act = (act + (k === 'next' ? 1 : -1) + z.length) % z.length; btns[act].focus(); return true; }
      return false;
    },
    read() { if (z.some(v => !v)) return { incomplete: 'Complète toutes les cases du tableau.' }; return { z: [...z] }; },
    mark(bad = []) { btns.forEach((b, i) => b.classList.toggle('wrong', bad.includes(i))); },
    lock() { locked = true; btns.forEach(b => { b.disabled = true; }); },
    reset() { z.forEach((_, i) => set(i, '')); },
  };
}

export const ANSWERS = { nums, frac: nums, steps: nums, roots, choice, cmp: choice, iv: interval, table: signTable };

// Cases de saisie « maison » (pas d'<input> : le clavier système ne s'ouvre jamais).
import { INF } from '../util/fmt.js';

export const MAXLEN = 7; // chiffres au plus par case

/** applique une touche à la valeur interne (« - » et « , » en interne) */
export function edit(v, k, allow = {}) {
  v = v || '';
  if (k === 'del') return v.includes('∞') ? (v.startsWith('-') ? '-' : '') : v.slice(0, -1);
  if (k === 'neg') return allow.neg === false ? v : (v.startsWith('-') ? v.slice(1) : '-' + v);
  if (k === 'inf') return allow.inf ? (v.startsWith('-') ? '-' : '') + '∞' : v;
  if (k === ',') {
    if (!allow.comma || v.includes(',') || v.includes('∞')) return v;
    return (v === '' || v === '-' ? v + '0' : v) + ',';
  }
  if (/^[0-9]$/.test(k)) {
    if (v.includes('∞')) v = v.startsWith('-') ? '-' : '';
    if (v.replace(/[-,]/g, '').length >= MAXLEN) return v;
    return v + k;
  }
  return v;
}
/** affichage : vrai signe moins, +∞ */
export const show = v => (v || '').replace('-', '−').replace(/^∞$/, '+∞');
/** lecture numérique ; null si vide */
export function parse(v) {
  if (v === undefined || v === null || v === '' || v === '-') return null;
  if (v.includes('∞')) return v.startsWith('-') ? -INF : INF;
  if (v.endsWith(',')) v = v.slice(0, -1);
  return Number(v.replace(',', '.'));
}

/**
 * Ensemble de cases. Chaque case : {el, get(), set(v)}.
 * Le moteur appelle key(k) ; la case active est entourée.
 */
export class FieldSet {
  constructor(allow) { this.list = []; this.act = 0; this.allow = allow; this.locked = false; }
  add(el, get, set, label) {
    const i = this.list.length;
    el.setAttribute('role', 'textbox');
    el.setAttribute('tabindex', '0');
    el.setAttribute('aria-label', label || `case ${i + 1}`);
    el.addEventListener('click', () => { if (!this.locked) { this.act = i; this.render(); } });
    el.addEventListener('focus', () => { if (!this.locked && this.act !== i) { this.act = i; this.render(); } });
    this.list.push({ el, get, set });
  }
  key(k) {
    if (this.locked || !this.list.length) return false;
    const n = this.list.length;
    if (k === 'next') this.act = (this.act + 1) % n;
    else if (k === 'prev') this.act = (this.act - 1 + n) % n;
    else { const f = this.list[this.act]; f.set(edit(f.get(), k, this.allow)); }
    this.render();
    return true;
  }
  render() {
    this.list.forEach((f, i) => {
      f.el.textContent = show(f.get());
      f.el.classList.toggle('act', i === this.act && !this.locked);
      f.el.setAttribute('aria-current', i === this.act ? 'true' : 'false');
    });
  }
  mark(bad = []) { this.list.forEach((f, i) => f.el.classList.toggle('wrong', bad.includes(i))); }
  lock() { this.locked = true; this.render(); }
  get empty() { return this.list.some(f => parse(f.get()) === null); }
}

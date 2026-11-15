// Progression dans localStorage (une clé par module : « mp:<id> »).
// Toutes les lectures/écritures sont protégées : si le stockage est indisponible,
// on garde l'état en mémoire et le site reste utilisable.
const PREFIX = 'mp:';
const mem = {};

function rawGet(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }
function rawSet(k, v) { try { localStorage.setItem(k, v); return true; } catch (e) { return false; } }

export function load(id, def) {
  let s = null;
  try { s = JSON.parse(rawGet(PREFIX + id)); } catch (e) { s = null; }
  if (!s && mem[id]) s = mem[id];
  return Object.assign(JSON.parse(JSON.stringify(def)), s && typeof s === 'object' ? s : {});
}
export function save(id, S) {
  S.last = Date.now();
  mem[id] = S;
  rawSet(PREFIX + id, JSON.stringify(S));
}
export function remove(id) { delete mem[id]; try { localStorage.removeItem(PREFIX + id); } catch (e) { /* rien */ } }

export const settings = {
  get() { return load('reglages', { lisible: false, voix: true, grand: false }); },
  set(o) { save('reglages', Object.assign(settings.get(), o)); },
};

/** toutes les progressions, pour l'export */
export function exportAll() {
  const out = { app: 'maths-progressives', version: 1, date: new Date().toISOString(), data: {} };
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k && k.startsWith(PREFIX)) out.data[k.slice(PREFIX.length)] = JSON.parse(localStorage.getItem(k));
    }
  } catch (e) { /* stockage indisponible */ }
  Object.keys(mem).forEach(k => { if (!(k in out.data)) out.data[k] = mem[k]; });
  return out;
}
/** importe un objet produit par exportAll ; renvoie le nombre de modules importés */
export function importAll(obj) {
  if (!obj || obj.app !== 'maths-progressives' || typeof obj.data !== 'object') throw new Error('Ce fichier ne vient pas de Maths progressives.');
  let n = 0;
  Object.entries(obj.data).forEach(([k, v]) => {
    if (!/^[a-z0-9-]+$/.test(k) || typeof v !== 'object' || v === null) return;
    mem[k] = v; rawSet(PREFIX + k, JSON.stringify(v)); n++;
  });
  return n;
}
/** code compact (base64 de l'UTF-8) pour recopier à la main d'un appareil à l'autre */
export const toCode = obj => btoa(unescape(encodeURIComponent(JSON.stringify(obj))));
export const fromCode = code => JSON.parse(decodeURIComponent(escape(atob(code.trim()))));

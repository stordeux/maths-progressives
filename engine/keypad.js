// Pavé numérique à l'écran. Les touches inutiles pour l'exercice sont masquées.
export const KEYS = [
  ['7', '7'], ['8', '8'], ['9', '9'], ['del', '⌫', 'effacer'],
  ['4', '4'], ['5', '5'], ['6', '6'], ['neg', '−', 'signe moins'],
  ['1', '1'], ['2', '2'], ['3', '3'], [',', ',', 'virgule'],
  ['prev', '◀', 'case précédente'], ['0', '0'], ['inf', '∞', 'infini'], ['next', '▶', 'case suivante'],
];

export function createKeypad(el, onKey, layout = KEYS) {
  el.classList.add('pad');
  el.setAttribute('role', 'group');
  el.setAttribute('aria-label', 'pavé numérique');
  el.innerHTML = layout.map(([k, t, l, w]) => `<button type="button" data-k="${k}" class="${/^[0-9]$/.test(k) ? '' : 'k2'} ${k === 'ok' ? 'ok' : ''} ${w ? 'wide' : ''}" aria-label="${l || 'chiffre ' + t}">${t}</button>`).join('');
  el.querySelectorAll('button').forEach(b => {
    // pointerdown : réponse immédiate au doigt ; click pour le clavier et les lecteurs d'écran
    b.addEventListener('click', e => { e.preventDefault(); onKey(b.dataset.k); });
  });
  return {
    configure({ neg = true, comma = false, inf = false, nav = false } = {}) {
      const vis = { neg, ',': comma, inf, prev: nav, next: nav };
      el.querySelectorAll('button').forEach(b => {
        const k = b.dataset.k;
        if (k in vis) { b.classList.toggle('off', !vis[k]); b.disabled = !vis[k]; b.setAttribute('aria-hidden', String(!vis[k])); }
      });
    },
    show(on) { el.hidden = !on; },
  };
}

/** traduit une touche du clavier physique en touche du pavé */
export function physicalKey(e) {
  const k = e.key;
  if (/^[0-9]$/.test(k)) return k;
  if (k === '-' || k === '−') return 'neg';
  if (k === ',' || k === '.') return ',';
  if (k === 'Backspace' || k === 'Delete') return 'del';
  if (k === 'i' || k === 'I') return 'inf';
  if (k === 'ArrowRight') return 'next';
  if (k === 'ArrowLeft') return 'prev';
  if (k === '<' || k === '>' || k === '=' || k === '+') return k;
  return null;
}

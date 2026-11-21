// Teintes dérivées d'une couleur de module, calculées ici plutôt qu'avec color-mix() en CSS :
// html2canvas (capture du bouton 🐞) ne sait pas lire color-mix() et la capture échouerait.
const rvb = h => { const x = h.replace('#', ''); const n = parseInt(x.length === 3 ? [...x].map(c => c + c).join('') : x, 16); return [n >> 16 & 255, n >> 8 & 255, n & 255]; };
const hex = a => '#' + a.map(v => Math.round(Math.max(0, Math.min(255, v))).toString(16).padStart(2, '0')).join('');
/** mélange de deux couleurs : t = part de la première (0 à 1) */
export const melange = (a, b, t) => { const A = rvb(a), B = rvb(b); return hex(A.map((v, i) => v * t + B[i] * (1 - t))); };
/** couleur avec transparence */
export const rgba = (a, alpha) => `rgba(${rvb(a).join(', ')}, ${alpha})`;
/** variables de teinte d'une couleur d'accent : --fonce (relief des boutons), --pale (bordures), --point (fond à pastilles) */
export function teintes(c, prefixe = '') {
  return { [`--${prefixe}fonce`]: melange(c, '#000000', .62), [`--${prefixe}pale`]: melange(c, '#ffffff', .33), [`--${prefixe}point`]: rgba(c, .14), [`--${prefixe}tres-pale`]: melange(c, '#ffffff', .16) };
}
export const styleTeintes = (c, prefixe = '') => Object.entries(teintes(c, prefixe)).map(([k, v]) => `${k}:${v}`).join(';');

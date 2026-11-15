// Dessins propres au module « Nombres relatifs » (chaînes SVG, sans DOM : importé aussi par Node).
import { M } from '../../engine/util/fmt.js';

/**
 * Thermomètre vertical gradué en °C.
 * t : température de départ ; to (facultatif) : température d'arrivée (flèche de t vers to, ancien niveau en pointillés).
 * label : texte de la flèche (« + 5 », « − 3 »…).
 */
export function thermo({ t, to = null, label = '' } = {}) {
  const vals = to === null ? [t] : [t, to];
  let min = Math.floor((Math.min(0, ...vals) - 2) / 5) * 5, max = Math.ceil((Math.max(0, ...vals) + 2) / 5) * 5;
  if (max - min < 15) { min -= 5; if (max - min < 15) max += 5; }
  const W = 210, x0 = 96, tw = 22, top = 22, bot = 292, cy = 318, br = 22;
  const Y = v => bot - (v - min) / (max - min) * (bot - top);
  const step = max - min > 30 ? 2 : 1;
  const cur = to === null ? t : to;
  let s = `<svg viewBox="0 0 ${W} 350" class="vis" style="width:250px" role="img" aria-label="thermomètre : ${M(t)} degrés${to === null ? '' : ' puis ' + M(to) + ' degrés'}" font-family="system-ui,sans-serif">`;
  // tube et réservoir
  s += `<rect x="${x0}" y="${top - 12}" width="${tw}" height="${bot - top + 24}" rx="11" fill="#fff" stroke="#495057" stroke-width="2"/>`;
  s += `<circle cx="${x0 + tw / 2}" cy="${cy}" r="${br}" fill="#e03131" stroke="#495057" stroke-width="2"/>`;
  s += `<rect x="${x0 + 6}" y="${Y(cur).toFixed(1)}" width="${tw - 12}" height="${(cy - Y(cur)).toFixed(1)}" fill="#e03131"/>`;
  // graduations
  for (let v = min; v <= max; v += step) {
    const y = Y(v).toFixed(1), big = v % 5 === 0;
    s += `<line x1="${x0 + tw}" y1="${y}" x2="${x0 + tw + (big ? 14 : 7)}" y2="${y}" stroke="#495057" stroke-width="${v === 0 ? 2.5 : big ? 1.6 : 1}"/>`;
    if (big) s += `<text x="${x0 + tw + 18}" y="${(+y + 5).toFixed(1)}" font-size="17" fill="${v === 0 ? '#1864ab' : '#343a40'}" font-weight="${v === 0 ? 700 : 400}">${M(v)}</text>`;
  }
  s += `<line x1="${x0 - 6}" y1="${Y(0).toFixed(1)}" x2="${x0 + tw + 14}" y2="${Y(0).toFixed(1)}" stroke="#1864ab" stroke-width="2.5"/>`;
  s += `<text x="${x0 + tw + 44}" y="${(Y(0) + 5).toFixed(1)}" font-size="15" fill="#1864ab">°C</text>`;
  if (to !== null) {
    const y1 = Y(t), y2 = Y(to), ax = x0 - 22;
    s += `<line x1="${x0 - 10}" y1="${y1.toFixed(1)}" x2="${x0 + tw + 4}" y2="${y1.toFixed(1)}" stroke="#495057" stroke-width="2" stroke-dasharray="4 3"/>`;
    s += `<line x1="${ax}" y1="${y1.toFixed(1)}" x2="${ax}" y2="${y2.toFixed(1)}" stroke="#e8590c" stroke-width="3.5"/>`;
    s += `<path d="M${ax},${y2.toFixed(1)} l-6,${to > t ? 10 : -10} h12z" fill="#e8590c"/>`;
    if (label) s += `<text x="${ax - 8}" y="${((y1 + y2) / 2 + 5).toFixed(1)}" font-size="18" font-weight="700" text-anchor="end" fill="#e8590c">${label}</text>`;
  } else {
    s += `<path d="M${x0 - 4},${Y(t).toFixed(1)} l-12,-7 v14z" fill="#e8590c"/>`;
  }
  return s + '</svg>';
}

/** tableau de la règle des signes (HTML) */
export function signRule() {
  const c = (a, b) => `<td style="padding:6px 14px;border:1px solid #adb5bd;text-align:center;font-weight:700;background:${a === b ? '#ebfbee' : '#fff5f5'}">${a === b ? '+' : '−'}</td>`;
  return `<table style="border-collapse:collapse;margin:8px auto;font-size:1.05em" aria-label="règle des signes">
<tr><th style="padding:6px 14px;border:1px solid #adb5bd">×</th><th style="padding:6px 14px;border:1px solid #adb5bd">+</th><th style="padding:6px 14px;border:1px solid #adb5bd">−</th></tr>
<tr><th style="padding:6px 14px;border:1px solid #adb5bd">+</th>${c('+', '+')}${c('+', '−')}</tr>
<tr><th style="padding:6px 14px;border:1px solid #adb5bd">−</th>${c('−', '+')}${c('−', '−')}</tr></table>`;
}

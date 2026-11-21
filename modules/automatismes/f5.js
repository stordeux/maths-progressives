// Niveaux 9 et 10 : lecture graphique ; statistiques et signe d'une expression.
import { ri, pick, shuffle, M, F, big, ent, dec, gcd, niveau } from './outils.js';
import { terms } from '../../engine/util/fmt.js';
import { r6 } from '../../engine/util/arith.js';
import { barChart, parseBars } from '../stats-probas/draw.js';

/* =================== dessin : repère et courbes =================== */
const GW = 460, GH = 330, GL = 30, GR = 14, GT = 14, GB = 26, SX = (GW - GL - GR) / 10, SY = (GH - GT - GB) / 10;
const PX = x => GL + (x + 5) * SX, PY = y => GT + (5 - y) * SY;
const f2 = v => (Math.round(v * 100) / 100).toString();
function repere(contenu, label) {
  let s = `<svg viewBox="0 0 ${GW} ${GH}" class="vis" data-g="${GL},${GT},${SX},${SY}" role="img" aria-label="${label}" font-family="system-ui,sans-serif">`;
  for (let x = -5; x <= 5; x++) s += `<line x1="${f2(PX(x))}" y1="${GT}" x2="${f2(PX(x))}" y2="${GH - GB}" stroke="#e3e0d8"/>`;
  for (let y = -5; y <= 5; y++) s += `<line x1="${GL}" y1="${f2(PY(y))}" x2="${GW - GR}" y2="${f2(PY(y))}" stroke="#e3e0d8"/>`;
  s += `<line x1="${GL}" y1="${f2(PY(0))}" x2="${GW - GR + 6}" y2="${f2(PY(0))}" stroke="#333" stroke-width="1.6"/><line x1="${f2(PX(0))}" y1="${GH - GB}" x2="${f2(PX(0))}" y2="${GT - 6}" stroke="#333" stroke-width="1.6"/>`;
  for (let x = -5; x <= 5; x++) if (x) s += `<text x="${f2(PX(x))}" y="${f2(PY(0) + 14)}" font-size="11" text-anchor="middle" fill="#555">${M(x)}</text>`;
  for (let y = -5; y <= 5; y++) if (y) s += `<text x="${f2(PX(0) - 5)}" y="${f2(PY(y) + 4)}" font-size="11" text-anchor="end" fill="#555">${M(y)}</text>`;
  return s + contenu + '</svg>';
}
const COUL = '#5f3dc4';
function courbe(xs, ys) {
  const pts = xs.map((x, i) => `${f2(PX(x))},${f2(PY(ys[i]))}`).join(' ');
  const dots = xs.map((x, i) => `<circle cx="${f2(PX(x))}" cy="${f2(PY(ys[i]))}" r="3.5" fill="${COUL}"/>`).join('');
  return repere(`<polyline data-c="1" points="${pts}" fill="none" stroke="${COUL}" stroke-width="3" stroke-linejoin="round"/>${dots}<text x="${f2(PX(xs[xs.length - 1]) - 4)}" y="${f2(PY(ys[ys.length - 1]) - 9)}" font-size="15" font-weight="700" text-anchor="end" fill="${COUL}">f</text>`, 'courbe représentative de f');
}
function droiteSvg(m, p) {
  // extrémités : x dans [-5 ; 5] avec |y| ≤ 5
  let lo = -5, hi = 5;
  if (m !== 0) { const a = (-5 - p) / m, b = (5 - p) / m; lo = Math.max(lo, Math.min(a, b)); hi = Math.min(hi, Math.max(a, b)); }
  let dots = '';
  for (let x = -5; x <= 5; x++) { const y = m * x + p; if (Number.isInteger(r6(y)) && Math.abs(y) <= 5) dots += `<circle cx="${f2(PX(x))}" cy="${f2(PY(y))}" r="3.5" fill="${COUL}"/>`; }
  return repere(`<line data-d="1" x1="${f2(PX(lo))}" y1="${f2(PY(m * lo + p))}" x2="${f2(PX(hi))}" y2="${f2(PY(m * hi + p))}" stroke="${COUL}" stroke-width="3"/>${dots}<text x="${f2(PX(hi) - 6)}" y="${f2(PY(m * hi + p) + (m > 0 ? 18 : -8))}" font-size="15" font-weight="700" text-anchor="end" fill="${COUL}">d</text>`, 'droite d');
}
/** relecture du dessin (vérification indépendante) : points de la ligne brisée en coordonnées mathématiques */
function lirePoly(svg) {
  const [L, T, sx, sy] = /data-g="([^"]+)"/.exec(svg)[1].split(',').map(Number);
  const raw = /<polyline data-c="1" points="([^"]+)"/.exec(svg)[1].trim().split(' ').map(p => p.split(',').map(Number));
  return raw.map(([px, py]) => [Math.round(((px - L) / sx - 5) * 1000) / 1000, Math.round((5 - (py - T) / sy) * 1000) / 1000]);
}
function lireDroite(svg) {
  const [L, T, sx, sy] = /data-g="([^"]+)"/.exec(svg)[1].split(',').map(Number);
  const m = /<line data-d="1" x1="([\d.-]+)" y1="([\d.-]+)" x2="([\d.-]+)" y2="([\d.-]+)"/.exec(svg).slice(1).map(Number);
  const pt = (px, py) => [(px - L) / sx - 5, 5 - (py - T) / sy];
  const [a, b] = [pt(m[0], m[1]), pt(m[2], m[3])];
  const pente = (b[1] - a[1]) / (b[0] - a[0]);
  return { pente: Math.round(pente * 100) / 100, ordo: Math.round((a[1] - pente * a[0]) * 100) / 100 };
}
const evalP = (pts, x) => {
  for (let i = 0; i + 1 < pts.length; i++) { const [x1, y1] = pts[i], [x2, y2] = pts[i + 1]; if (x >= x1 - 1e-9 && x <= x2 + 1e-9) return y1 + (y2 - y1) * (x - x1) / (x2 - x1); }
  return NaN;
};
const solveAll = (pts, y0) => {
  const out = [];
  for (let i = 0; i + 1 < pts.length; i++) {
    const [x1, y1] = pts[i], [x2, y2] = pts[i + 1];
    if (Math.abs(y1 - y0) < 1e-9) out.push(x1);
    else if ((y1 - y0) * (y2 - y0) < 0) out.push(x1 + (y0 - y1) * (x2 - x1) / (y2 - y1));
  }
  if (Math.abs(pts[pts.length - 1][1] - y0) < 1e-9) out.push(pts[pts.length - 1][0]);
  return [...new Set(out.map(v => Math.round(v * 1e6) / 1e6))];
};
/** courbe : 5 sommets entiers, pas de segment horizontal, au moins une montée et une descente */
function tirerCourbe(zeros) {
  for (;;) {
    const gaps = [ri(1, 3), ri(1, 3), ri(1, 3), ri(1, 3)], tot = gaps.reduce((a, b) => a + b, 0);
    if (tot > 10 || tot < 6) continue;
    const x0 = ri(-5, 5 - tot), xs = [x0]; gaps.forEach(g => xs.push(xs[xs.length - 1] + g));
    let ys;
    if (zeros) {
      const s = pick([1, -1]);
      ys = pick([
        [s * ri(1, 4), 0, -s * ri(1, 4), 0, s * ri(1, 4)],
        [s * ri(1, 4), s * ri(1, 4), 0, -s * ri(1, 4), -s * ri(1, 4)],
        [-s * ri(1, 4), 0, s * ri(1, 4), s * ri(1, 4), s * ri(1, 4)],
        [s * ri(1, 4), s * ri(1, 4), s * ri(1, 4), 0, -s * ri(1, 4)],
      ]);
      if (ys.some((y, i) => i && y === ys[i - 1])) continue;
    } else {
      ys = xs.map(() => ri(-4, 4));
      if (ys.some((y, i) => i && Math.abs(y - ys[i - 1]) < 2)) continue;
    }
    const d = ys.slice(1).map((y, i) => Math.sign(y - ys[i]));
    if (!d.includes(1) || !d.includes(-1)) continue;
    return { xs, ys };
  }
}
const ptsOf = c => c.xs.map((x, i) => [x, c.ys[i]]);
const num = v => M(v);
const opt = (l, n, why) => ({ l, n, why });

const image = {
  id: 'g-image', dmin: 0, titre: 'lire une image sur la courbe',
  draw() { const c = tirerCourbe(false); return { c, i: ri(0, 4) }; },
  ex: { c: { xs: [-4, -2, 0, 2, 3], ys: [-2, 2, 0, 4, 1] }, i: 3 },
  build({ c, i }) {
    const svg = courbe(c.xs, c.ys), pts = ptsOf(c), x0 = c.xs[i], y0 = c.ys[i];
    const near = [i - 1, i + 1].filter(k => k >= 0 && k < 5).map(k => c.ys[k]);
    const bads = [opt(num(x0), x0, 'Tu as donné l’abscisse x : l’image se lit sur l’axe des <b>ordonnées</b>.'), ...near.map(v => opt(num(v), v, 'Tu as lu le point voisin : place-toi bien en x = ' + num(x0) + '.')), opt(num(-y0), -y0, 'Attention au signe de l’ordonnée.'), opt(num(y0 + 1), y0 + 1, 'Lis précisément la hauteur du point (une graduation = 1).')];
    return {
      html: `Voici la courbe représentative d’une fonction f.${''} Quelle est l’image de <b>${num(x0)}</b> par f ?`,
      visual: svg,
      good: { l: num(y0), n: y0 }, bads,
      hint: `Place-toi sur l’axe horizontal en x = ${num(x0)}, monte (ou descends) jusqu’à la courbe, puis lis la hauteur sur l’axe vertical.`,
      solution: `Au point d’abscisse ${num(x0)}, la courbe est à la hauteur ${num(y0)} : f(${num(x0)}) = ${num(y0)}.`,
      indep: () => { const q = lirePoly(svg); return Math.round(evalP(q, x0) * 1000) / 1000; },
    };
  },
};
const antec = {
  id: 'g-antec', dmin: 1, titre: 'lire un antécédent sur la courbe',
  draw() { const c = tirerCourbe(false); return { c, i: ri(0, 4) }; },
  ex: { c: { xs: [-4, -2, 0, 2, 3], ys: [-2, 2, 0, 4, 1] }, i: 1 },
  build({ c, i }) {
    const svg = courbe(c.xs, c.ys), pts = ptsOf(c), y0 = c.ys[i], x0 = c.xs[i];
    const f = x => evalP(pts, x);
    const cands = [[y0, 'Tu as donné le nombre lui-même : un antécédent de ' + num(y0) + ' est une <b>abscisse</b> x telle que f(x) = ' + num(y0) + '.'], [x0 + 1, 'Vérifie : à cette abscisse, la hauteur de la courbe n’est pas ' + num(y0) + '.'], [x0 - 1, 'Vérifie : à cette abscisse, la hauteur de la courbe n’est pas ' + num(y0) + '.'], [-x0, 'Attention au signe de l’abscisse.'], [f(y0) !== y0 ? Math.round(f(y0)) : y0 + 2, 'Tu as cherché l’<b>image</b> de ' + num(y0) + ' alors qu’on te demande un antécédent.']]
      .filter(([x]) => Number.isInteger(x) && x >= -5 && x <= 5 && !(Math.abs(f(x) - y0) < 1e-9));
    return {
      html: `Voici la courbe représentative d’une fonction f. Quel nombre est un antécédent de <b>${num(y0)}</b> par f ?`,
      visual: svg,
      good: { l: num(x0), n: x0 }, bads: cands.map(([x, y]) => opt(num(x), x, y)),
      hint: `Place-toi sur l’axe vertical en y = ${num(y0)}, trace mentalement l’horizontale jusqu’à la courbe, puis lis l’abscisse du point rencontré.`,
      solution: `La courbe passe au point (${num(x0)} ; ${num(y0)}) : f(${num(x0)}) = ${num(y0)}, donc ${num(x0)} est un antécédent de ${num(y0)}.`,
      indep: () => { const q = lirePoly(svg); return solveAll(q, y0).includes(x0) ? x0 : NaN; },
    };
  },
};
const nbAnt = {
  id: 'g-nbant', dmin: 2, titre: 'compter les antécédents d’un nombre',
  draw() { const c = tirerCourbe(false); return { c, k: ri(-3, 4) }; },
  ex: { c: { xs: [-4, -2, 0, 2, 3], ys: [-2, 2, 0, 4, 1] }, k: 1 },
  build({ c, k }) {
    const svg = courbe(c.xs, c.ys), n = solveAll(ptsOf(c), k).length;
    const lab = v => String(v);
    return {
      html: `Voici la courbe représentative d’une fonction f. Combien le nombre <b>${num(k)}</b> a-t-il d’antécédents par f ?`,
      visual: svg,
      good: { l: lab(n), n },
      bads: [0, 1, 2, 3, 4].filter(v => v !== n).map(v => opt(lab(v), v, v < n ? 'Tu as oublié un point d’intersection : tends bien la droite horizontale y = ' + num(k) + ' sur toute la largeur.' : 'Tu as compté trop de points : regarde où l’horizontale y = ' + num(k) + ' coupe réellement la courbe.')),
      hint: `Trace l’horizontale d’équation y = ${num(k)} et compte tous les points où elle <b>rencontre</b> la courbe (de gauche à droite).`,
      solution: `La droite y = ${num(k)} coupe la courbe en ${n} point${n > 1 ? 's' : ''} : ${num(k)} a donc ${n} antécédent${n > 1 ? 's' : ''}.`,
      indep: () => solveAll(lirePoly(svg), k).length,
    };
  },
};
/** ensemble où la condition est vraie, sous forme d'intervalles [{lo, hi, lc, hc}] */
function ensemble(xs, ys, sat) {
  const items = [];
  xs.forEach((x, i) => {
    items.push(sat(Math.sign(ys[i])));
    if (i < xs.length - 1) { const a = ys[i], b = ys[i + 1]; items.push(sat(Math.sign(Math.abs(a) < 1e-9 ? b : Math.abs(b) < 1e-9 ? a : (a + b) / 2))); }
  });
  const out = []; let first = -1;
  for (let k = 0; k <= items.length; k++) {
    if (k < items.length && items[k]) { if (first < 0) first = k; }
    else if (first >= 0) {
      const last = k - 1;
      out.push({ lo: first % 2 === 0 ? xs[first / 2] : xs[(first - 1) / 2], hi: last % 2 === 0 ? xs[last / 2] : xs[(last + 1) / 2], lc: first % 2 === 0, hc: last % 2 === 0 });
      first = -1;
    }
  }
  return out;
}
const ivTxt = S => S.map(i => `${i.lc ? '[' : ']'}${M(i.lo)} ; ${M(i.hi)}${i.hc ? ']' : '['}`).join(' ∪ ') || '∅';
const SAT = { '≥ 0': s => s >= 0, '> 0': s => s > 0, '≤ 0': s => s <= 0, '< 0': s => s < 0 };
const OPP = { '≥ 0': '≤ 0', '> 0': '< 0', '≤ 0': '≥ 0', '< 0': '> 0' };
const STRICT = { '≥ 0': '> 0', '> 0': '≥ 0', '≤ 0': '< 0', '< 0': '≤ 0' };
const signeG = {
  id: 'g-signe', dmin: 2, titre: 'lire le signe de f(x) sur la courbe',
  draw() { return { c: tirerCourbe(true), r: pick(Object.keys(SAT)) }; },
  ex: { c: { xs: [-4, -2, 0, 2, 4], ys: [2, 0, -3, 0, 1] }, r: '≥ 0' },
  build({ c, r }) {
    const svg = courbe(c.xs, c.ys), g = ensemble(c.xs, c.ys, SAT[r]);
    const alt = [
      [ensemble(c.xs, c.ys, SAT[OPP[r]]), 'Tu as lu les valeurs où f est de signe <b>contraire</b>.'],
      [ensemble(c.xs, c.ys, SAT[STRICT[r]]), 'À un zéro, f(x) = 0 : avec ≥ ou ≤ le crochet est fermé ; avec > ou < il est ouvert.'],
      [ensemble(c.xs, c.ys, SAT[STRICT[OPP[r]]]), 'Tu as lu le signe contraire, et les crochets aux zéros sont à revoir.'],
      [g.length > 1 ? [g[0]] : [], 'Il manque un intervalle : cherche toutes les zones où la condition est vraie.'],
      [g.length > 1 ? [g[g.length - 1]] : [], 'Il manque un intervalle : cherche toutes les zones où la condition est vraie.'],
      [[{ lo: c.xs[0], hi: c.xs[4], lc: true, hc: true }], 'f ne garde pas le même signe sur tout l’intervalle : repère les zéros.'],
    ];
    return {
      html: `Voici la courbe de f définie sur [${M(c.xs[0])} ; ${M(c.xs[4])}]. Pour quelles valeurs de x a-t-on f(x) ${r} ?`,
      visual: svg,
      good: { l: ivTxt(g), n: ivTxt(g) },
      bads: alt.map(([S, w]) => opt(ivTxt(S), ivTxt(S), w)).filter(b => b.l !== '∅'),
      hint: `Repère où la courbe coupe l’axe des abscisses (aux points d’abscisse ${c.xs.filter((x, i) => c.ys[i] === 0).map(num).join(' et ')}), puis regarde sur quels intervalles elle est ${r[0] === '≥' || r[0] === '>' ? 'au-dessus' : 'en dessous'} de cet axe.`,
      solution: `La courbe est ${r[0] === '≥' || r[0] === '>' ? 'au-dessus' : 'en dessous'} de l’axe des abscisses ${r[1] === '=' ? '' : ''}sur : <b>${ivTxt(g)}</b> (les zéros sont ${r.includes('=') || r === '≥ 0' || r === '≤ 0' ? 'inclus' : 'exclus'}).`.replace('(les zéros sont inclus)', '(les zéros sont inclus : f = 0 y est permis)'),
      indep: () => { const q = lirePoly(svg); return ivTxt(ensemble(q.map(p => p[0]), q.map(p => p[1]), SAT[r])); },
    };
  },
};
const variations = dec_ => ({
  id: dec_ ? 'g-var-d' : 'g-var-c', dmin: 3, titre: dec_ ? 'trouver un intervalle où f est décroissante' : 'trouver un intervalle où f est croissante',
  draw() {
    for (;;) {
      const c = tirerCourbe(false), d = c.ys.slice(1).map((y, i) => Math.sign(y - c.ys[i]));
      // exactement un intervalle maximal pour le sens demandé
      const target = dec_ ? -1 : 1, runs = []; let s = null;
      d.forEach((v, i) => { if (v === target) { if (s === null) s = i; if (i === 3 || d[i + 1] !== target) { runs.push([s, i + 1]); s = null; } } });
      if (runs.length === 1) return { c };
    }
  },
  ex: dec_ ? { c: { xs: [-4, -2, 0, 2, 3], ys: [-3, 2, 3, -2, 1] } } : { c: { xs: [-4, -2, 0, 2, 3], ys: [3, -2, -3, 2, 1] } },
  build({ c }) {
    const svg = courbe(c.xs, c.ys), target = dec_ ? -1 : 1, d = c.ys.slice(1).map((y, i) => Math.sign(y - c.ys[i]));
    let a = d.indexOf(target), b = a + 1; while (d[b] === target) b++;
    const iv = (i, j) => `[${M(c.xs[i])} ; ${M(c.xs[j])}]`;
    const contraire = []; let s = null;
    d.forEach((v, i) => { if (v === -target) { if (s === null) s = i; if (i === 3 || d[i + 1] !== -target) { contraire.push([s, i + 1]); s = null; } } });
    const bads = [...contraire.map(([i, j]) => opt(iv(i, j), iv(i, j), 'C’est un intervalle où f est ' + (dec_ ? 'croissante' : 'décroissante') + ' : la courbe ' + (dec_ ? 'monte' : 'descend') + '.')), a > 0 ? opt(iv(a - 1, b), iv(a - 1, b), 'Sur cet intervalle, f ne ' + (dec_ ? 'descend' : 'monte') + ' pas tout du long : la courbe change de sens avant.') : null, b < 4 ? opt(iv(a, b + 1), iv(a, b + 1), 'Sur cet intervalle, f ne ' + (dec_ ? 'descend' : 'monte') + ' pas tout du long : la courbe change de sens avant la fin.') : null, opt(iv(0, 4), iv(0, 4), 'f n’est pas ' + (dec_ ? 'décroissante' : 'croissante') + ' sur tout l’intervalle : elle change de sens.')].filter(Boolean);
    return {
      html: `Voici la courbe de f définie sur [${M(c.xs[0])} ; ${M(c.xs[4])}]. Sur lequel de ces intervalles f est-elle <b>${dec_ ? 'décroissante' : 'croissante'}</b> ?`,
      visual: svg,
      good: { l: iv(a, b), n: iv(a, b) }, bads,
      hint: `Suis la courbe de gauche à droite : ${dec_ ? 'elle descend' : 'elle monte'} entre deux sommets d’abscisses consécutives. Repère où elle change de sens (aux sommets d’abscisses ${c.xs.slice(1, 4).map(num).join(', ')}).`,
      solution: `En allant de gauche à droite, la courbe ${dec_ ? 'descend' : 'monte'} de x = ${M(c.xs[a])} à x = ${M(c.xs[b])} : f est ${dec_ ? 'décroissante' : 'croissante'} sur ${iv(a, b)}.`,
      indep: () => { const q = lirePoly(svg), qx = q.map(p => p[0]), qy = q.map(p => p[1]); const dd = qy.slice(1).map((y, i) => Math.sign(y - qy[i])); const i0 = dd.indexOf(target); let j = i0 + 1; while (dd[j] === target) j++; return `[${M(qx[i0])} ; ${M(qx[j])}]`; },
    };
  },
});
const maxi = {
  id: 'g-max', dmin: 3, titre: 'lire le maximum de f',
  draw() { return { c: tirerCourbe(false) }; },
  ex: { c: { xs: [-4, -2, 0, 2, 3], ys: [-3, 2, 3, -2, 1] } },
  build({ c }) {
    const svg = courbe(c.xs, c.ys), mx = Math.max(...c.ys), im = c.ys.indexOf(mx), mn = Math.min(...c.ys);
    const bads = [opt(num(c.xs[im]), c.xs[im], 'C’est l’<b>abscisse</b> où le maximum est atteint ; le maximum est une valeur de f(x), lue sur l’axe vertical.'), opt(num(mn), mn, 'C’est le minimum (le point le plus bas).'), opt(num(c.xs[c.ys.indexOf(mn)]), c.xs[c.ys.indexOf(mn)], 'C’est l’abscisse du minimum.'), opt(num(mx - 1), mx - 1, 'Lis précisément la hauteur du point le plus haut.'), opt(num(mx + 1), mx + 1, 'Lis précisément la hauteur du point le plus haut.')];
    return {
      html: `Voici la courbe de f définie sur [${M(c.xs[0])} ; ${M(c.xs[4])}]. Quel est le <b>maximum</b> de f sur cet intervalle ?`,
      visual: svg,
      good: { l: num(mx), n: mx }, bads,
      hint: `Le maximum est la plus grande valeur prise par f(x) : cherche le point le plus <b>haut</b> de la courbe et lis sa hauteur (ordonnée), pas son abscisse.`,
      solution: `Le point le plus haut est en x = ${num(c.xs[im])} et sa hauteur est ${num(mx)} : le maximum de f est ${num(mx)} (atteint en x = ${num(c.xs[im])}).`,
      indep: () => Math.max(...lirePoly(svg).map(p => p[1])),
    };
  },
};
const PENTES = [1, -1, 2, -2, 3, -3, 0.5, -0.5];
const labPente = m => { if (Number.isInteger(m)) return M(m); const k = Math.round(1 / Math.abs(m)); return Math.abs(Math.abs(m) * k - 1) < 1e-9 ? `${m < 0 ? '−' : ''}${F(1, k)}` : M(m); };
const pente = {
  id: 'g-pente', dmin: 4, titre: 'lire le coefficient directeur d’une droite',
  draw() { return { m: pick(PENTES), p: ri(-3, 3) }; },
  ex: { m: -2, p: 1 },
  build({ m, p }) {
    const svg = droiteSvg(m, p);
    const bads = [opt(labPente(-m), -m, 'Le signe est à l’envers : une droite qui ' + (m > 0 ? 'monte' : 'descend') + ' a un coefficient ' + (m > 0 ? 'positif' : 'négatif') + '.'), Math.abs(m) !== 1 ? opt(labPente(1 / m), 1 / m, 'Tu as lu « horizontal sur vertical » : le coefficient directeur est « vertical sur horizontal » (de combien on monte quand x augmente de 1).') : null, opt(M(p), p, 'C’est l’ordonnée à l’origine (là où la droite coupe l’axe vertical), pas la pente.'), opt(labPente(m + (m > 0 ? 1 : -1)), m + (m > 0 ? 1 : -1), 'Compte précisément : quand x augmente de 1, de combien monte (ou descend) la droite ?'), opt(M(-p), -p, 'Ce n’est pas la pente : lis la variation de y pour une avancée de 1 en x.')].filter(Boolean);
    return {
      html: `Voici une droite d. Quel est son <b>coefficient directeur</b> ?`,
      visual: svg,
      good: { l: labPente(m), n: m }, bads,
      hint: `Pars d’un point de la droite sur la grille, avance de ${Number.isInteger(m) ? '1 carreau' : '2 carreaux'} vers la droite et regarde de combien la droite ${m > 0 ? 'monte' : 'descend'}.`,
      solution: `Quand x augmente de ${Number.isInteger(m) ? 1 : 2}, y ${m > 0 ? 'augmente' : 'diminue'} de ${Number.isInteger(m) ? M(Math.abs(m)) : 1} : le coefficient directeur est ${labPente(m)}.`,
      indep: () => lireDroite(svg).pente,
    };
  },
};
const ordo = {
  id: 'g-ordo', dmin: 4, titre: 'lire l’ordonnée à l’origine d’une droite',
  draw() { return { m: pick([1, -1, 2, -2, 3, -3]), p: nzr_(-4, 4) }; },
  ex: { m: 2, p: -3 },
  build({ m, p }) {
    const svg = droiteSvg(m, p), xi = -p / m;
    const bads = [opt(M(m), m, 'C’est le coefficient directeur (la pente), pas l’ordonnée à l’origine.'), opt(M(-p), -p, 'Attention au signe : la droite coupe l’axe vertical ' + (p > 0 ? 'au-dessus' : 'en dessous') + ' de l’origine.'), Number.isInteger(xi) && xi !== p ? opt(M(xi), xi, 'C’est l’abscisse du point où la droite coupe l’axe horizontal.') : null, opt(M(p + 1), p + 1, 'Lis précisément la hauteur du point d’abscisse 0.'), opt(M(p - 1), p - 1, 'Lis précisément la hauteur du point d’abscisse 0.')].filter(Boolean);
    return {
      html: `Voici une droite d. Quelle est son <b>ordonnée à l’origine</b> ?`,
      visual: svg,
      good: { l: M(p), n: p }, bads,
      hint: `L’ordonnée à l’origine est la hauteur du point où la droite coupe l’axe <b>vertical</b> (le point d’abscisse 0).`,
      solution: `La droite coupe l’axe des ordonnées au point (0 ; ${M(p)}) : l’ordonnée à l’origine est ${M(p)}.`,
      indep: () => lireDroite(svg).ordo,
    };
  },
};
function nzr_(a, b) { let v; do { v = ri(a, b); } while (v === 0); return v; }
const eqDroite = {
  id: 'g-eq', dmin: 5, titre: 'lire l’équation réduite d’une droite',
  draw() { return { m: pick([1, -1, 2, -2, 3, -3]), p: nzr_(-3, 3) }; },
  ex: { m: -1, p: 2 },
  build({ m, p }) {
    const svg = droiteSvg(m, p), eq = (a, b) => `y = ${terms([[a, 'x'], [b, '']])}`;
    const bads = [[p, m, 'Tu as échangé le coefficient directeur et l’ordonnée à l’origine : y = <b>m</b>x + <b>p</b>, m est la pente.'], [-m, p, 'Le signe de la pente est à l’envers.'], [m, -p, 'Le signe de l’ordonnée à l’origine est à l’envers.'], [m + (m > 0 ? 1 : -1), p, 'Revois la pente : de combien monte la droite quand x augmente de 1 ?']].filter(([a, b]) => !(a === m && b === p) && a !== 0);
    return {
      html: `Voici une droite d. Quelle est son <b>équation réduite</b> ?`,
      visual: svg,
      good: { l: eq(m, p), n: `${m}|${p}` }, bads: bads.map(([a, b, w]) => opt(eq(a, b), `${a}|${b}`, w)),
      hint: `Lis l’ordonnée à l’origine p (point d’abscisse 0), puis la pente m : de combien la droite ${m > 0 ? 'monte' : 'descend'} quand on avance de 1 vers la droite. Écris y = mx + p.`,
      solution: `Ordonnée à l’origine : ${M(p)}. Quand x augmente de 1, y ${m > 0 ? 'augmente' : 'diminue'} de ${M(Math.abs(m))} : m = ${M(m)}. Donc ${eq(m, p)}.`,
      indep: () => { const l = lireDroite(svg); return `${l.pente}|${l.ordo}`; },
    };
  },
};
const exCourbe = courbe([-4, -2, 0, 2, 3], [-2, 2, 0, 4, 1]);
const LV9 = niveau('Lecture graphique : image, antécédent, signe, droite', [image, antec, nbAnt, signeG, variations(true), variations(false), maxi, pente, ordo, eqDroite], {
  n: 9, classe: '2de – 1re',
  intro: 'Beaucoup de QCM s’appuient sur un graphique : il faut lire une image, un antécédent, un signe, un sens de variation ou l’équation d’une droite, sans calcul.',
  def: 'L’<b>image</b> de a est f(a) : on lit sur l’axe <b>vertical</b>. Un <b>antécédent</b> de b est un x tel que f(x) = b : on lit sur l’axe <b>horizontal</b>. Une droite d’équation <b>y = mx + p</b> a pour coefficient directeur m (de combien elle monte quand x augmente de 1) et pour ordonnée à l’origine p.',
  visuel: exCourbe,
  methode: ['<b>Image de a</b> : de x = a on monte jusqu’à la courbe, puis on lit y.', '<b>Antécédents de b</b> : on trace l’horizontale y = b ; chaque point d’intersection donne un antécédent (il peut y en avoir 0, 1, 2…).', '<b>Signe de f(x)</b> : au-dessus de l’axe des abscisses, f(x) &gt; 0 ; en dessous, f(x) &lt; 0 ; les zéros sont les points sur l’axe.', '<b>Variations</b> : on lit la courbe de gauche à droite : elle monte (croissante) ou descend (décroissante).', '<b>Droite</b> : p = hauteur en x = 0 ; m = variation de y quand x augmente de 1.'],
  warn: ['Image et antécédent ne se lisent pas sur le même axe.', 'Un nombre peut avoir plusieurs antécédents.', 'Le maximum est une <b>hauteur</b> (ordonnée), pas l’endroit (abscisse) où il est atteint.', 'La pente d’une droite descendante est négative.'],
  retenir: 'image : axe vertical ; antécédent : axe horizontal ; y = mx + p avec m la pente et p la hauteur en x = 0.',
});

/* =================== NIVEAU 10 : statistiques et signe =================== */
const lst = a => a.map(v => dec(v)).join(' ; ');
const moyenne = {
  id: 's-moy', dmin: 0, titre: 'calculer une moyenne',
  draw() { for (;;) { const n = ri(4, 6), a = Array.from({ length: n }, () => ri(5, 18)); a[n - 1] += (n - a.reduce((x, y) => x + y, 0) % n) % n; if (a[n - 1] <= 19 && new Set(a).size > 2) return { a }; } },
  ex: { a: [8, 12, 10, 14, 6] },
  build({ a }) {
    const n = a.length, S = a.reduce((x, y) => x + y, 0), mu = S / n, s = [...a].sort((p, q) => p - q), med = n % 2 ? s[(n - 1) / 2] : (s[n / 2 - 1] + s[n / 2]) / 2;
    const bads = [opt(dec(S), S, 'Tu as donné la somme : il faut la diviser par le nombre de valeurs (' + n + ').'), opt(dec(r6(S / (n - 1))), S / (n - 1), 'Tu as divisé par ' + (n - 1) + ' : il y a ' + n + ' valeurs.'), opt(dec(med), med, 'C’est la médiane (valeur du milieu), pas la moyenne.'), opt(dec((s[0] + s[n - 1]) / 2), (s[0] + s[n - 1]) / 2, 'Tu as pris le milieu entre la plus petite et la plus grande valeur : la moyenne tient compte de toutes les valeurs.'), opt(dec(mu + 1), mu + 1, 'Revérifie ta somme.')];
    return {
      html: `Léa a obtenu ces notes sur 20 : <b>${lst(a)}</b>. Quelle est sa moyenne ?`,
      good: { l: dec(mu), n: mu }, bads,
      hint: `Additionne les ${n} notes (${a.slice(0, 3).join(' + ')} + …), puis divise la somme par ${n}.`,
      solution: `Somme : ${a.join(' + ')} = ${S}. Moyenne : ${S} ÷ ${n} = ${dec(mu)}.`,
      indep: () => a.reduce((x, y) => x + y) / a.length,
    };
  },
};
const mediane = {
  id: 's-med', dmin: 1, titre: 'trouver une médiane',
  draw() { for (;;) { const n = pick([5, 6, 7]), a = Array.from({ length: n }, () => ri(2, 19)); const s = [...a].sort((x, y) => x - y); if (a.some((v, i) => i && v < a[i - 1]) && new Set(a).size === n && a.join() !== s.join()) return { a }; } },
  ex: { a: [12, 5, 17, 9, 14] },
  build({ a }) {
    const n = a.length, s = [...a].sort((p, q) => p - q), med = n % 2 ? s[(n - 1) / 2] : (s[n / 2 - 1] + s[n / 2]) / 2, mu = a.reduce((x, y) => x + y, 0) / n;
    const mid = n % 2 ? a[(n - 1) / 2] : (a[n / 2 - 1] + a[n / 2]) / 2;
    const bads = [opt(dec(mid), mid, 'Tu as pris la valeur du milieu <b>sans ranger</b> la liste dans l’ordre croissant.'), opt(dec(r6(mu)), mu, 'C’est la moyenne, pas la médiane.'), opt(dec((s[0] + s[n - 1]) / 2), (s[0] + s[n - 1]) / 2, 'Tu as pris le milieu entre le minimum et le maximum : la médiane coupe l’effectif en deux.'), n % 2 ? opt(dec(s[(n - 1) / 2 + 1]), s[(n - 1) / 2 + 1], 'Tu t’es trompé de rang : avec ' + n + ' valeurs, la médiane est la ' + ((n + 1) / 2) + '<sup>e</sup>.') : opt(dec(s[n / 2]), s[n / 2], 'Avec un nombre pair de valeurs, la médiane est la <b>moyenne</b> des deux valeurs centrales.'), opt(dec(s[Math.floor(n / 2) - 1]), s[Math.floor(n / 2) - 1], 'Tu t’es trompé de rang.')];
    return {
      html: `Voici une série de ${n} valeurs : <b>${lst(a)}</b>. Quelle est sa médiane ?`,
      good: { l: dec(med), n: med }, bads,
      hint: `Commence par <b>ranger</b> les ${n} valeurs dans l’ordre croissant, puis repère ${n % 2 ? 'celle du milieu (la ' + ((n + 1) / 2) + '<sup>e</sup>)' : 'les deux valeurs du milieu (3<sup>e</sup> et 4<sup>e</sup>) et fais leur moyenne'}.`,
      solution: `Rangées : ${s.join(' ; ')}. ${n % 2 ? `La valeur du milieu (${(n + 1) / 2}<sup>e</sup>) est ${med}` : `Les valeurs centrales sont ${s[n / 2 - 1]} et ${s[n / 2]} : médiane = ${dec(med)}`}.`,
      indep: () => { const t = a.slice().sort((x, y) => x - y); let lo = 0, hi = t.length - 1; while (hi - lo > 1) { lo++; hi--; } return (t[lo] + t[hi]) / 2; },
    };
  },
};
const tabHtml = (vals, effs, lab, eff) => `<div class="tablewrap"><table class="data"><tr><th>${lab}</th>${vals.map(v => `<td>${v}</td>`).join('')}</tr><tr><th>${eff}</th>${effs.map(v => `<td>${v}</td>`).join('')}</tr></table></div>`;
const moyEff = {
  id: 's-moy-eff', dmin: 2, titre: 'moyenne à partir d’un tableau d’effectifs',
  draw() { for (;;) { const vals = pick([[0, 1, 2, 3, 4], [1, 2, 3, 4], [10, 12, 14, 16], [8, 10, 12, 14, 16], [1, 2, 3, 4, 5]]), eff = vals.map(() => ri(1, 8)), N = eff.reduce((a, b) => a + b, 0); const S = vals.reduce((s, v, i) => s + v * eff[i], 0); if ([10, 20, 25, 8, 16, 5, 4, 40, 50].some(k => N === k) && Math.abs(S / N * 10 - Math.round(S / N * 10)) < 1e-9 && new Set(vals.map((v, i) => v * eff[i])).size === vals.length && Number.isInteger(S / N) === false) return { vals, eff }; } },
  ex: { vals: [0, 1, 2, 3, 4], eff: [3, 6, 5, 4, 2] },
  build({ vals, eff }) {
    const N = eff.reduce((a, b) => a + b, 0), S = vals.reduce((s, v, i) => s + v * eff[i], 0), mu = S / N, sm = vals.reduce((a, b) => a + b, 0) / vals.length;
    const mode = vals[eff.indexOf(Math.max(...eff))];
    const bads = [opt(dec(r6(sm)), sm, 'Tu as fait la moyenne des valeurs sans tenir compte des effectifs.'), opt(dec(S), S, 'Tu as additionné les produits valeur × effectif, mais il faut diviser par l’effectif total (' + N + ').'), opt(dec(r6(S / vals.length)), S / vals.length, 'Tu as divisé par le nombre de valeurs (' + vals.length + ') au lieu de l’effectif total (' + N + ').'), opt(dec(mode), mode, 'C’est le mode (la valeur la plus fréquente), pas la moyenne.'), opt(dec(r6(mu + 0.5)), mu + 0.5, 'Revérifie la somme valeur × effectif.')];
    return {
      html: `Dans une classe, on a relevé ${vals[0] === 0 ? 'le nombre de frères et sœurs' : 'une valeur'} de chaque élève. Quelle est la moyenne de la série ?${tabHtml(vals, eff, vals[0] === 0 ? 'Nombre' : 'Valeur', 'Effectif')}`,
      good: { l: dec(r6(mu)), n: mu }, bads,
      hint: `Multiplie chaque valeur par son effectif (${vals[0]} × ${eff[0]}, ${vals[1]} × ${eff[1]}, …), additionne, puis divise par l’effectif total ${N}.`,
      solution: `Somme : ${vals.map((v, i) => `${v} × ${eff[i]}`).join(' + ')} = ${S}. Effectif total : ${eff.join(' + ')} = ${N}. Moyenne : ${S} ÷ ${N} = ${dec(r6(mu))}.`,
      indep: () => { let t = 0, c = 0; vals.forEach((v, i) => { for (let k = 0; k < eff[i]; k++) { t += v; c++; } }); return t / c; },
    };
  },
};
const CAT = [[['Bus', 'Vélo', 'À pied', 'Voiture'], 'le moyen de transport des élèves'], [['Rouge', 'Bleu', 'Vert', 'Jaune'], 'la couleur préférée'], [['Pop', 'Rock', 'Rap', 'Jazz'], 'le style de musique préféré'], [['Pizza', 'Pâtes', 'Riz', 'Salade'], 'le plat choisi à la cantine']];
const drawBar = () => {
  for (;;) {
    const [cats, th] = pick(CAT), N = pick([20, 25, 40]), vals = cats.map(() => ri(2, 14));
    if (vals.reduce((a, b) => a + b, 0) === N && new Set(vals).size === vals.length) return { cats, th, vals };
  }
};
const barTotal = {
  id: 's-bar-tot', dmin: 3, titre: 'effectif total d’un diagramme en barres',
  draw: drawBar, ex: { cats: ['Bus', 'Vélo', 'À pied', 'Voiture'], th: 'le moyen de transport des élèves', vals: [9, 4, 5, 2] },
  build({ cats, th, vals }) {
    const N = vals.reduce((a, b) => a + b, 0), svg = barChart({ cats, vals, grid: 1, lab: 2, yTitle: 'élèves' });
    const bads = [opt(String(Math.max(...vals)), Math.max(...vals), 'C’est l’effectif de la plus grande barre : l’effectif total est la <b>somme</b> de toutes les barres.'), opt(String(cats.length), cats.length, 'C’est le nombre de catégories, pas le nombre d’élèves.'), opt(String(N - vals[0]), N - vals[0], 'Il manque la 1<sup>re</sup> barre dans ta somme.'), opt(String(N + 1), N + 1, 'Vérifie ton addition.'), opt(String(N - 1), N - 1, 'Vérifie ton addition.')];
    return {
      html: `Le diagramme donne ${th}. Combien d’élèves ont répondu en tout ?`,
      visual: svg,
      good: { l: String(N), n: N }, bads,
      hint: `Lis sur l’axe vertical la hauteur de chaque barre (${cats.join(', ')}), puis additionne-les pour obtenir le nombre d’élèves.`,
      solution: `Hauteurs : ${vals.join(' + ')} = ${N}. ${N} élèves ont répondu.`,
      indep: () => parseBars(svg).reduce((a, b) => a + b, 0),
    };
  },
};
const barMode = {
  id: 's-bar-mode', dmin: 3, titre: 'lire la catégorie la plus fréquente',
  draw: drawBar, ex: { cats: ['Pizza', 'Pâtes', 'Riz', 'Salade'], th: 'le plat choisi à la cantine', vals: [6, 11, 3, 5] },
  build({ cats, th, vals }) {
    const svg = barChart({ cats, vals, grid: 1, lab: 2, yTitle: 'élèves' }), k = vals.indexOf(Math.max(...vals));
    const bads = cats.map((c, i) => i === k ? null : opt(c, c, i === vals.indexOf(Math.min(...vals)) ? 'C’est la catégorie la moins choisie (barre la plus basse).' : 'Une autre barre est plus haute : cherche la plus haute.')).filter(Boolean);
    return {
      html: `Le diagramme donne ${th}. Quelle réponse a été la plus fréquente ?`,
      visual: svg,
      good: { l: cats[k], n: cats[k] }, bads,
      hint: `La réponse la plus fréquente correspond à la barre la plus <b>haute</b> : compare les hauteurs des ${cats.length} barres sur l’axe vertical.`,
      solution: `La barre la plus haute est « ${cats[k]} » (${vals[k]}) : c’est la réponse la plus fréquente.`,
      indep: () => { const b = parseBars(svg); return cats[b.indexOf(Math.max(...b))]; },
    };
  },
};
const barPct = {
  id: 's-bar-pct', dmin: 4, titre: 'proportion lue sur un diagramme en barres',
  draw: drawBar, ex: { cats: ['Rouge', 'Bleu', 'Vert', 'Jaune'], th: 'la couleur préférée', vals: [8, 5, 4, 3] },
  build({ cats, th, vals }) {
    const N = vals.reduce((a, b) => a + b, 0), k = ri(0, cats.length - 1), p = 100 * vals[k] / N, svg = barChart({ cats, vals, grid: 1, lab: 2, yTitle: 'élèves' });
    const pc = x => `${dec(r6(x))}&nbsp;%`;
    const bads = [opt(pc(vals[k]), vals[k], 'Tu as pris l’effectif comme un pourcentage : il faut le rapporter au total (' + N + ').'), opt(pc(100 * N / vals[k]), 100 * N / vals[k], 'Tu as divisé dans le mauvais sens : proportion = effectif ÷ total.'), opt(pc(100 - p), 100 - p, 'C’est la proportion de tous les autres.'), opt(pc(p * 2), p * 2, 'Vérifie ta division.'), opt(pc(100 * vals[k] / (N - vals[k])), 100 * vals[k] / (N - vals[k]), 'Tu as divisé par l’effectif des autres au lieu du total.')];
    return {
      html: `Le diagramme donne ${th}. Quelle proportion des élèves a choisi « ${cats[k]} » ?`,
      visual: svg,
      good: { l: pc(p), n: p }, bads,
      hint: `Lis l’effectif de « ${cats[k]} » sur le diagramme, calcule l’effectif total (somme de toutes les barres), puis fais effectif ÷ total.`,
      solution: `« ${cats[k]} » : ${vals[k]} élèves sur ${N} au total. ${vals[k]} ÷ ${N} = ${dec(r6(vals[k] / N))} = ${pc(p)}.`,
      indep: () => { const b = parseBars(svg); return 100 * b[k] / b.reduce((x, y) => x + y, 0); },
    };
  },
};
const signeAff = {
  id: 's-signe-aff', dmin: 4, titre: 'signe d’une expression affine',
  draw() { for (;;) { const a = nzr_(-5, 5), r = nzr_(-6, 6); if (Math.abs(a) !== 1 || ri(0, 1)) return { a, r, pos: pick([true, false]) }; } },
  ex: { a: 2, r: 3, pos: true },
  build({ a, r, pos }) {
    const b = -a * r, expr = terms([[a, 'x'], [b, '']]);
    const gt = pos ? a > 0 : a < 0;
    const lab = (g, v) => `x ${g ? '&gt;' : '&lt;'} ${M(v)}`;
    return {
      html: `Pour quelles valeurs de x l’expression <b>${expr}</b> est-elle strictement ${pos ? 'positive' : 'négative'} ?`,
      good: { l: lab(gt, r), n: `${gt}|${r}` },
      bads: [[!gt, r, 'Le sens est à l’envers : ' + (a > 0 ? 'la droite monte (coefficient ' + a + ' &gt; 0)' : 'le coefficient ' + M(a) + ' est négatif, donc l’expression diminue quand x augmente') + '.'], [gt, -r, 'Attention au signe de la racine : ' + expr + ' = 0 pour x = ' + M(r) + '.'], [!gt, -r, 'Sens et signe à revoir : résous ' + expr + ' = 0 d’abord.'], [gt, r === b ? r + 1 : b, 'Tu as pris le terme constant comme racine : la racine est la solution de ' + expr + ' = 0.']].map(([g, v, w]) => opt(lab(g, v), `${g}|${v}`, w)),
      hint: `Cherche d’abord la valeur de x qui annule ${expr} (équation ${expr} = 0). Puis regarde le signe du coefficient de x : ${a > 0 ? 'positif → l’expression croît' : 'négatif → l’expression décroît'}.`,
      solution: `${expr} = 0 ⇔ x = ${M(r)}. Le coefficient de x est ${M(a)} (${a > 0 ? 'positif' : 'négatif'}), donc l’expression est ${a > 0 ? 'négative avant, positive après' : 'positive avant, négative après'} ${M(r)} : ${pos ? 'positive' : 'négative'} pour <b>x ${gt ? '&gt;' : '&lt;'} ${M(r)}</b>.`,
      indep: () => { for (const t of [r - 3, r - 1, r + 1, r + 3]) { const inS = pos ? a * t + b > 0 : a * t + b < 0, held = gt ? t > r : t < r; if (inS !== held) return 'ko'; } return `${gt}|${r}`; },
    };
  },
};
const signeProd = {
  id: 's-signe-prod', dmin: 5, titre: 'signe d’un produit de deux facteurs affines',
  draw() { for (;;) { const r1 = ri(-6, 4), r2 = r1 + ri(2, 7); return { r1, r2, neg: pick([true, false]), flip: pick([true, false]) }; } },
  ex: { r1: -2, r2: 3, neg: true, flip: false },
  build({ r1, r2, neg, flip }) {
    const f1 = x => `(${x === 0 ? 'x' : x > 0 ? 'x − ' + x : 'x + ' + (-x)})`, f2_ = x => flip ? `(${x} − x)` : f1(x);
    const e = flip ? `${f1(r1)}${f2_(r2)}` : `${f1(r1)}${f1(r2)}`;
    const lead = flip ? -1 : 1, val = x => (x - r1) * (flip ? r2 - x : x - r2);
    const cond = neg ? '&lt; 0' : '&gt; 0';
    const fn = (outside) => outside ? `]−∞ ; ${M(r1)}[ ∪ ]${M(r2)} ; +∞[` : `]${M(r1)} ; ${M(r2)}[`;
    const wantOutside = (neg && lead < 0) || (!neg && lead > 0);
    const good = fn(wantOutside);
    const bads = [[fn(!wantOutside), 'Tu as pris le signe contraire : regarde le signe du produit quand x est grand (' + (lead > 0 ? 'positif : x² a un coefficient positif' : 'négatif : le coefficient de x² est négatif') + ').'], [`]${M(-r2)} ; ${M(-r1)}[`, 'Les racines sont ' + M(r1) + ' et ' + M(r2) + ' (valeurs qui annulent chaque facteur), pas leurs opposées.'], [wantOutside ? `]−∞ ; ${M(r1)}] ∪ [${M(r2)} ; +∞[` : `[${M(r1)} ; ${M(r2)}]`, 'Les inégalités sont strictes : les racines sont exclues (crochets ouverts).'], [wantOutside ? `]${M(r2)} ; +∞[` : `]${M(r1)} ; +∞[`, 'Il manque une partie des solutions : étudie le signe sur les trois zones.']];
    return {
      html: `Quel est l’ensemble des solutions de : ${big(`${e} ${cond}`)}`,
      good: { l: good, n: good }, bads: bads.map(([l, w]) => opt(l, l, w)),
      hint: `Les facteurs s’annulent en ${M(r1)} et en ${M(r2)} : ces deux nombres découpent la droite en trois zones. Teste le signe du produit pour un x très grand, puis pour un x entre ${M(r1)} et ${M(r2)}.`,
      solution: `Racines : ${M(r1)} et ${M(r2)}. ${flip ? 'Le coefficient de x² est négatif' : 'Le coefficient de x² est positif'} : le produit est ${lead > 0 ? 'positif à l’extérieur des racines et négatif entre elles' : 'négatif à l’extérieur des racines et positif entre elles'}. Solution de ${cond.replace('&lt;', '<').replace('&gt;', '>')} : <b>${good}</b>.`,
      indep: () => { const pts = [r1 - 3, r1 + 0.5, (r1 + r2) / 2, r2 - 0.5, r2 + 3]; const ok = pts.map(x => (neg ? val(x) < 0 : val(x) > 0)); const out = ok[0] && ok[4] && !ok[2]; const ins = !ok[0] && !ok[4] && ok[2]; return out ? fn(true) : ins ? fn(false) : 'ko'; },
    };
  },
};
const exBar = barChart({ cats: ['Bus', 'Vélo', 'À pied', 'Voiture'], vals: [9, 4, 5, 2], grid: 1, lab: 2, yTitle: 'élèves' });
const LV10 = niveau('Statistiques et signe d’une expression', [moyenne, mediane, moyEff, barTotal, barMode, barPct, signeAff, signeProd], {
  n: 10, classe: '2de – 1re',
  intro: 'Moyenne, médiane, lecture d’un diagramme, puis signe d’une expression : des questions rapides qui se règlent de tête avec la bonne méthode.',
  def: '<b>Moyenne</b> = somme des valeurs ÷ effectif total. <b>Médiane</b> : valeur qui partage la série <i>rangée</i> en deux groupes de même effectif. Le <b>signe</b> de ax + b change en x = −b/a ; celui d’un produit se lit dans un tableau de signes.',
  visuel: exBar,
  methode: ['Moyenne : on additionne <b>tout</b>, puis on divise par le nombre de valeurs (avec effectifs : valeur × effectif).', 'Médiane : on <b>range</b> d’abord ; nombre impair → valeur du milieu ; nombre pair → moyenne des deux valeurs centrales.', 'Diagramme : on lit chaque barre sur l’axe vertical ; proportion = effectif ÷ total.', 'ax + b : on cherche la racine −b/a ; le signe de a donne le sens (positif après la racine si a &gt; 0).', 'Produit de facteurs : on place les racines, on teste une valeur dans chaque zone.'],
  warn: ['On ne range pas toujours la liste dans l’énoncé : trie avant de chercher la médiane.', 'La moyenne d’un tableau d’effectifs n’est pas la moyenne des valeurs.', 'Si a &lt; 0, ax + b est positif <b>avant</b> la racine.', 'Dans une inéquation stricte, les racines sont exclues (crochets ouverts).'],
  retenir: 'moyenne : somme ÷ effectif ; médiane : liste rangée ; ax + b change de signe en −b/a.',
});

export { LV9, LV10 };

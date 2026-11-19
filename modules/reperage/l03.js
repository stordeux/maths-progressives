// Niveau 3 : placer un point (retrouver, parmi plusieurs points repérés par une lettre, celui qui a les coordonnées données). 5e.
import { repere, lirePoints, COL } from './draw.js';
import { choiceQ, ex, rep, warn, retenir, meth, def, cours, lettres, cp, ri, pick, shuffle, memes, ecartes } from './util.js';

const N = 5;
const fig = (pts, guides) => repere({ x0: -N, x1: N, y0: -N, y1: N, pts: pts.map(p => ({ n: p.n, p: p.p, c: COL.b })), guides: guides || [], aria: 'repère du plan et points repérés par des lettres', maxW: 380, maxH: 380 });
const ok = L => L.every(p => Math.abs(p[0]) <= N && Math.abs(p[1]) <= N) && ecartes(L, 2);
const opts = nm => [...nm].sort().map(v => ({ v, l: `<b>${v}</b>` }));

export function L3(d) {
  const nb = d < 2 ? 4 : 5, f = pick(d < 1 ? ['lettre'] : d < 2 ? ['lettre', 'axeL'] : ['lettre', 'axeL', 'meme']);
  const nm = lettres(nb, d), rnd = () => [ri(-N, N), ri(-N, N)];
  for (;;) {
    const L = []; let info = {};
    if (f === 'lettre') {
      const T = [ri(-N, N), ri(-N, N)]; if (!T[0] || !T[1] || Math.abs(T[0]) === Math.abs(T[1])) continue;
      L.push(T); info = { roles: { 0: 'cible' } };
      if (d >= 1) { L.push([T[1], T[0]]); info.roles[1] = 'swap'; }
      if (d >= 2) { L.push([-T[0], T[1]]); info.roles[2] = 'miroir'; }
      while (L.length < nb) L.push(rnd());
      if (!ok(L) || L.slice(3).some(p => p[0] === 0 || p[1] === 0)) continue;
      info.T = T;
    } else if (f === 'axeL') {
      const horiz = pick([true, false]), v = ri(1, N) * pick([-1, 1]), T = horiz ? [v, 0] : [0, v];
      L.push(T); info = { horiz, roles: { 0: 'cible' } };
      if (d >= 2) L.push(horiz ? [0, ri(1, N) * pick([-1, 1])] : [ri(1, N) * pick([-1, 1]), 0]);
      while (L.length < nb) L.push(rnd());
      if (!ok(L) || L.slice(d >= 2 ? 2 : 1).some(p => p[0] === 0 || p[1] === 0)) continue;
    } else {
      const vert = pick([true, false]), R = rnd();
      const M = vert ? [R[0], ri(-N, N)] : [ri(-N, N), R[1]];
      L.push(M, R); info = { vert, roles: { 0: 'cible' }, R };
      if (d >= 3) L.push(vert ? [ri(-N, N), R[1]] : [R[0], ri(-N, N)]);
      while (L.length < nb) L.push(rnd());
      const same = L.slice(2).filter(p => (vert ? p[0] === R[0] : p[1] === R[1])).length;
      if (!ok(L) || same || L.slice(d >= 3 ? 3 : 2).some(p => (vert ? p[1] === R[1] : p[0] === R[0]))) continue;
      if (d >= 3) info.roles[2] = 'piege';
    }
    // lettres au hasard sur les points
    const order = shuffle(L.map((p, i) => i)), pts = L.map((p, i) => ({ n: nm[order.indexOf(i)], p })), name = i => pts[i].n;
    const T = L[0], good = name(0), visual = f === 'meme' ? fig(pts) : fig(pts), after = fig(pts, [{ p: T, c: COL.a }]);
    const roleName = r => Object.entries(info.roles).filter(([, v]) => v === r).map(([i]) => name(+i))[0];
    if (f === 'lettre') {
      return choiceQ({
        keep: true, opts: opts(nm), good, visual, after, html: `Quel point a pour coordonnées ${cp(T)} ?`,
        hint: `Pour trouver le point ${cp(T)} : pars de O, avance de ${Math.abs(T[0])} carreau${Math.abs(T[0]) > 1 ? 'x' : ''} ${T[0] > 0 ? 'vers la droite' : 'vers la gauche'} (abscisse), puis de ${Math.abs(T[1])} ${T[1] > 0 ? 'vers le haut' : 'vers le bas'} (ordonnée). Quelle lettre se trouve là ?`,
        solution: `L'abscisse ${cp(T).slice(1).split(' ;')[0]} : ${Math.abs(T[0])} carreau${Math.abs(T[0]) > 1 ? 'x' : ''} ${T[0] > 0 ? 'vers la droite' : 'vers la gauche'} ; l'ordonnée : ${Math.abs(T[1])} ${T[1] > 0 ? 'vers le haut' : 'vers le bas'}. Le point ${cp(T)} est ${good}.`,
        msg: v => (v === roleName('swap') ? `Ce point a pour coordonnées ${cp([T[1], T[0]])} : tu as inversé l'abscisse et l'ordonnée. L'abscisse se lit d'abord, sur l'axe horizontal.` : v === roleName('miroir') ? `Ce point a pour coordonnées ${cp([-T[0], T[1]])} : regarde le signe de l'abscisse (à droite : positif, à gauche : négatif).` : ''),
        verify: E => memes(lirePoints(visual)[E], T),
      });
    }
    if (f === 'axeL') {
      const ax = info.horiz ? 'abscisses' : 'ordonnées';
      return choiceQ({
        keep: true, opts: opts(nm), good, visual, after, html: `Quel point est situé sur l'axe des ${ax} ?`,
        hint: `L'axe des ${ax} est ${info.horiz ? 'la droite horizontale' : 'la droite verticale'} qui passe par O. Parmi ${[...nm].sort().join(', ')}, repère celui qui est exactement sur cette droite.`,
        solution: `L'axe des ${ax} est ${info.horiz ? 'horizontal' : 'vertical'} ; seul le point ${good} est posé dessus (${info.horiz ? 'son ordonnée est 0' : 'son abscisse est 0'}).`,
        msg: v => { const q = lirePoints(visual)[v]; return q && (info.horiz ? q[0] === 0 : q[1] === 0) ? `${v} est sur l'autre axe : l'axe des ${ax} est ${info.horiz ? 'horizontal' : 'vertical'}.` : ''; },
        verify: E => { const q = lirePoints(visual)[E]; return info.horiz ? q[1] === 0 && q[0] !== 0 : q[0] === 0 && q[1] !== 0; },
      });
    }
    const Rn = name(1), what = info.vert ? 'abscisse' : 'ordonnée';
    return choiceQ({
      keep: true, opts: opts(nm.filter(n => n !== Rn)), good, visual, after, html: `Quel point a la même ${what} que le point ${Rn} ?`,
      hint: `Des points de même ${what} sont alignés sur une droite ${info.vert ? 'verticale' : 'horizontale'}. Imagine cette droite à partir de ${Rn} : quel autre point touche-t-elle ?`,
      solution: `Les points de même ${what} que ${Rn} sont sur la même ligne ${info.vert ? 'verticale' : 'horizontale'} que lui : c'est le point ${good}.`,
      msg: v => (v === roleName('piege') ? `${v} a la même ${info.vert ? 'ordonnée' : 'abscisse'} que ${Rn}, pas la même ${what}.` : ''),
      verify: E => { const P = lirePoints(visual), q = P[E], r = P[Rn]; return E !== Rn && (info.vert ? q[0] === r[0] : q[1] === r[1]); },
    });
  }
}

export function C3() {
  const f1 = fig([{ n: 'A', p: [-3, 2] }, { n: 'B', p: [2, 3] }, { n: 'C', p: [4, -2] }, { n: 'D', p: [-2, -4] }], [{ p: [-3, 2], c: COL.a }]);
  const f2 = fig([{ n: 'A', p: [-3, 2] }, { n: 'B', p: [3, 0] }, { n: 'C', p: [0, -3] }, { n: 'D', p: [2, 4] }], [{ p: [3, 0], c: COL.a }]);
  const f3 = fig([{ n: 'A', p: [-4, 3] }, { n: 'B', p: [2, 3] }, { n: 'C', p: [4, -2] }, { n: 'D', p: [-2, -4] }], [{ p: [-4, 3], c: COL.a }]);
  const f4 = fig([{ n: 'A', p: [-3, 2] }, { n: 'B', p: [4, 3] }, { n: 'C', p: [4, -2] }, { n: 'D', p: [-2, -4] }], [{ p: [4, 3], c: COL.a }]);
  return cours('3. Placer un point : retrouver le bon emplacement', `Quand on connaît les coordonnées d'un point, on le <b>place</b> en partant de l'origine, comme si on lisait le repère à l'envers.`,
    def(`Pour placer le point (a ; b) : on part de O, on se déplace de <b>a</b> carreaux sur l'horizontale (vers la droite si a &gt; 0, vers la gauche si a &lt; 0), puis de <b>b</b> carreaux sur la verticale (vers le haut si b &gt; 0, vers le bas si b &lt; 0).`),
    meth(`Lis l'abscisse : avance horizontalement, du bon côté de l'axe vertical.`, `Lis l'ordonnée : monte ou descends, du bon côté de l'axe horizontal.`, `Cherche la lettre posée à cet endroit.`),
    f1,
    ex(`Exemple 1 : quel point a pour coordonnées (−3 ; 2) ?`, `De O : 3 carreaux vers la gauche, puis 2 vers le haut : on est sur A. (Le point B(2 ; 3) est un piège : abscisse et ordonnée ne sont pas dans le même ordre.)<br>${rep('A')}`),
    f2,
    ex(`Exemple 2 : quel point est situé sur l'axe des abscisses ?`, `L'axe des abscisses est la droite horizontale qui passe par O. Un point posé dessus a une ordonnée égale à 0 : c'est B. (C est sur l'autre axe, l'axe vertical.)<br>${rep('B')}`),
    ex(`Exemple 2 bis : quel point est situé sur l'axe des ordonnées ?`, `L'axe des ordonnées est la droite verticale qui passe par O. Un point posé dessus a une abscisse égale à 0 : c'est C (le point B est sur l'autre axe).<br>${rep('C')}`),
    f3,
    ex(`Exemple 3 : quel point a la même ordonnée que le point B ?`, `Même ordonnée : même hauteur, sur une droite horizontale. B est à la hauteur 3, comme le point A.<br>${rep('A')}`),
    f4,
    ex(`Exemple 4 : quel point a la même abscisse que le point C ?`, `Même abscisse : même colonne, sur une droite verticale. C est dans la colonne 4, comme le point B.<br>${rep('B')}`),
    warn(`Ne pas inverser : <b>(−3 ; 2)</b> n'est pas <b>(2 ; −3)</b>. Vérifie aussi le <b>signe</b> de chaque nombre.`, `Deux points de même ordonnée sont à la même <b>hauteur</b> ; de même abscisse, dans la même <b>colonne</b>.`),
    retenir(`on place (a ; b) en allant de a à l'horizontale, puis de b à la verticale.`));
}

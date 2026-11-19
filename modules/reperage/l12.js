// Niveau 12 : sphère et boule : grands cercles, section par un plan (Pythagore), repérage sur la Terre (latitude, longitude). 3e.
import { repere, lirePoints, boule, COL } from './draw.js';
import { numQ, choiceQ, ex, rep, warn, retenir, meth, def, cours, pick, ri, shuffle, M } from './util.js';

const PI = 3.14, R2 = x => Math.round(x * 100) / 100;
const TRI = [[5, 3, 4], [5, 4, 3], [10, 6, 8], [10, 8, 6], [13, 5, 12], [13, 12, 5], [15, 9, 12], [17, 8, 15], [17, 15, 8], [25, 7, 24]];
const note = ' (figure non à l\'échelle)';
/** villes réelles : latitude et longitude arrondies au degré (positives : nord, est) */
const VILLES = [['Paris', 49, 2], ['Madrid', 40, -4], ['Le Caire', 30, 31], ['New York', 41, -74], ['Tokyo', 36, 140], ['Dakar', 15, -17], ['Nairobi', -1, 37], ['Le Cap', -34, 18], ['Sydney', -34, 151], ['Rio de Janeiro', -23, -43], ['Lima', -12, -77], ['Mexico', 19, -99], ['Moscou', 56, 38], ['Buenos Aires', -35, -58]];
const NS = v => `${Math.abs(v)}° ${v >= 0 ? 'nord' : 'sud'}`, EO = v => `${Math.abs(v)}° ${v >= 0 ? 'est' : 'ouest'}`;
const carte = pts => repere({ x0: -180, x1: 180, y0: -90, y1: 90, step: 30, labelStep: 60, lab: (v, ax) => Math.abs(v) + '°' + (ax === 'x' ? (v < 0 ? ' O' : ' E') : (v < 0 ? ' S' : ' N')), pts, maxW: 400, maxH: 220, aria: 'planisphère repéré par la longitude (horizontal) et la latitude (vertical)' });

export function L12(d) {
  const f = pick(d < 1 ? ['gc'] : d < 2 ? ['gc', 'terre'] : d < 3 ? ['gc', 'terre', 'sect', 'gcP'] : d < 4 ? ['gc', 'terre', 'sect', 'gcP', 'ecart'] : ['terre', 'sect', 'gcP', 'ecart', 'sectR']);
  if (f === 'gc' || f === 'gcP') {
    const R = ri(2, 9), diam = f === 'gc' && pick([true, false]);
    if (f === 'gcP') {
      const E = R2(2 * PI * R);
      return numQ({
        E: [E], tpl: `{0} cm`, neg: false, keys: { comma: true }, visual: boule({ R, sec: { t: 'centre' }, lR: `R = ${R} cm` }), html: `Une boule a pour rayon ${R} cm. On la coupe par un plan passant par son centre. Quel est le périmètre du grand cercle obtenu ? (π ≈ 3,14)${note}`,
        hint: `Un plan passant par le centre donne un grand cercle de même rayon que la boule, ${R} cm. Quelle formule donne le périmètre d'un cercle de rayon ${R} ?`,
        solution: `Le grand cercle a pour rayon ${R} cm : périmètre 2 × π × ${R} ≈ 2 × 3,14 × ${R} = ${M(E)} cm.`,
        msg: v => (Math.abs(v[0] - PI * R) < 0.011 ? `Tu as calculé π × ${R} : le périmètre est 2 × π × rayon.` : ''), verify: X => Math.abs(X[0] - 2 * Math.PI * R) < 0.01 * X[0],
      });
    }
    return numQ({
      E: [R], tpl: `disque de rayon {0} cm`, neg: false, visual: boule({ R, sec: { t: 'centre' }, lR: diam ? undefined : `R = ${R} cm` }),
      html: diam ? `Une boule a pour diamètre ${2 * R} cm. On la coupe par un plan passant par son centre. La section est un disque (le grand cercle) : quel est son rayon ?${note}` : `Une boule a pour rayon ${R} cm. On la coupe par un plan passant par son centre. La section est un disque : quel est son rayon ?${note}`,
      hint: diam ? `Un plan passant par le centre donne un grand cercle : son diamètre est celui de la boule, ${2 * R} cm. Que vaut le rayon par rapport au diamètre ?` : `Un plan passant par le centre de la boule donne un grand cercle : a-t-il un rayon plus petit que ${R} cm ou le même ?`,
      solution: diam ? `Le grand cercle a le même diamètre que la boule (${2 * R} cm), donc le rayon ${2 * R} ÷ 2 = ${R} cm.` : `Le grand cercle a le même rayon que la boule : ${R} cm.`,
      msg: v => (diam && v[0] === 2 * R ? `${2 * R} cm est le diamètre : le rayon en est la moitié.` : ''), verify: X => X[0] === R,
    });
  }
  if (f === 'sect' || f === 'sectR') {
    const [R, a, r] = pick(TRI), toR = f === 'sectR', E = toR ? R : r;
    return numQ({
      E: [E], tpl: toR ? `R = {0} cm` : `r = {0} cm`, neg: false, visual: boule({ R, sec: { t: 'plan', a }, lR: toR ? 'R = ?' : `R = ${R}`, la: `OO′ = ${a}`, lr: toR ? `r = ${r}` : 'r = ?' }),
      html: toR ? `Une section d'une boule de centre O par un plan est un disque de centre O′ et de rayon ${r} cm. Le plan est à ${a} cm du centre (OO′ = ${a} cm). Quel est le rayon R de la boule ?${note}` : `Une boule de centre O a pour rayon ${R} cm. On la coupe par un plan situé à ${a} cm de O (OO′ = ${a} cm, O′ centre de la section). Quel est le rayon r de la section ?${note}`,
      hint: toR ? `Le triangle OO′M est rectangle en O′ : O′M = ${r} cm et OO′ = ${a} cm sont les côtés de l'angle droit, OM = R est l'hypoténuse. Écris R² avec le théorème de Pythagore.` : `Le triangle OO′M est rectangle en O′ : OM = ${R} cm est l'hypoténuse (rayon de la boule), OO′ = ${a} cm est un côté de l'angle droit. Écris r² avec le théorème de Pythagore, puis prends la racine.`,
      solution: toR ? `Dans le triangle rectangle OO′M : R² = ${r}² + ${a}² = ${r * r + a * a}, donc R = ${R} cm.` : `Dans le triangle rectangle OO′M : r² = ${R}² − ${a}² = ${R * R - a * a}, donc r = ${r} cm.`,
      msg: v => (toR ? (v[0] === r + a ? `On n'additionne pas les longueurs : utilise R² = r² + OO′².` : '') : (v[0] === R - a ? `On ne soustrait pas simplement les longueurs : utilise r² = R² − OO′².` : '')),
      verify: X => (toR ? Math.abs(X[0] * X[0] - (r * r + a * a)) : Math.abs(X[0] * X[0] - (R * R - a * a))) < 1e-9,
    });
  }
  if (f === 'terre') {
    const [nom, la, lo] = pick(VILLES.filter(v => v[1] && v[2] && Math.abs(v[1]) > 5 && Math.abs(v[2]) > 15)), cand = [[lo, la], [-lo, la], [lo, -la], [-lo, -la]], L = shuffle(['A', 'B', 'C', 'D']);
    const pts = cand.map((p, i) => ({ n: L[i], p, c: COL.b })), good = L[0];
    return choiceQ({
      keep: true, opts: ['A', 'B', 'C', 'D'].map(v => ({ v, l: `<b>${v}</b>` })), good, visual: carte(pts), after: carte(pts.map(p => (p.n === good ? { ...p, c: COL.a } : p))),
      html: `${nom} a pour latitude ${NS(la)} et pour longitude ${EO(lo)} (valeurs arrondies au degré). Quel point de la carte est ${nom} ?`,
      hint: `La longitude se lit sur l'axe horizontal : ${lo >= 0 ? 'est = à droite' : 'ouest = à gauche'} du méridien de Greenwich (axe vertical). La latitude se lit sur l'axe vertical : ${la >= 0 ? 'nord = au-dessus' : 'sud = en dessous'} de l'équateur (axe horizontal). Dans quel quart de la carte se trouve ${nom} ?`,
      solution: `${EO(lo)} : à ${lo >= 0 ? 'droite' : 'gauche'} de l'axe vertical ; ${NS(la)} : ${la >= 0 ? 'au-dessus' : 'en dessous'} de l'équateur. C'est le point ${good}.`,
      msg: v => { const q = lirePoints(carte(pts))[v]; return q && q[0] !== lo && q[1] === la ? `Regarde la longitude : ${nom} est à l'${lo >= 0 ? 'est' : 'ouest'} de Greenwich.` : q && q[0] === lo && q[1] !== la ? `Regarde la latitude : ${nom} est dans l'hémisphère ${la >= 0 ? 'nord' : 'sud'}.` : ''; },
      verify: E => { const q = lirePoints(carte(pts))[E]; return q[0] === lo && q[1] === la; },
    });
  }
  // écart de latitude ou de longitude entre deux villes
  const lat = pick([true, false]);
  for (;;) {
    const [A, B] = shuffle([...VILLES]).slice(0, 2), k = lat ? 1 : 2, x = A[k], y = B[k];
    if (!x || !y || Math.abs(x - y) < 8 || (d < 4 && x * y < 0) || (!lat && Math.abs(x) + Math.abs(y) > 180 && x * y < 0)) continue;
    const E = Math.abs(x - y), pts = [{ n: A[0], p: [A[2], A[1]], c: COL.b, dx: 0, dy: -13 }, { n: B[0], p: [B[2], B[1]], c: COL.a, dx: 0, dy: -13 }];
    const same = x * y > 0;
    return numQ({
      E: [E], tpl: `{0}°`, neg: false, visual: carte(pts), html: `${A[0]} a pour ${lat ? 'latitude' : 'longitude'} ${lat ? NS(x) : EO(x)} et ${B[0]} ${lat ? NS(y) : EO(y)}. Quel est l'écart de ${lat ? 'latitude' : 'longitude'} entre les deux villes ? (valeurs arrondies au degré)`,
      hint: `${same ? `Les deux villes sont du même côté de ${lat ? "l'équateur" : 'Greenwich'} : cherche la différence entre ${Math.abs(x)}° et ${Math.abs(y)}°.` : `Les deux villes sont de part et d'autre de ${lat ? "l'équateur" : 'Greenwich'} : l'écart est la somme de ${Math.abs(x)}° et ${Math.abs(y)}°.`}`,
      solution: same ? `Même côté : ${Math.max(Math.abs(x), Math.abs(y))}° − ${Math.min(Math.abs(x), Math.abs(y))}° = ${E}°.` : `De part et d'autre : ${Math.abs(x)}° + ${Math.abs(y)}° = ${E}°.`,
      msg: v => (same && v[0] === Math.abs(x) + Math.abs(y) ? `Les villes sont du même côté : on soustrait.` : !same && v[0] === Math.abs(Math.abs(x) - Math.abs(y)) ? `Les villes sont de part et d'autre : on additionne.` : ''),
      verify: X => { const P = lirePoints(carte(pts)); return Math.abs((lat ? P[A[0]][1] - P[B[0]][1] : P[A[0]][0] - P[B[0]][0])) === X[0]; },
    });
  }
}

export function C12() {
  const pts = [{ n: 'A', p: [2, 49] }, { n: 'B', p: [-2, 49] }, { n: 'C', p: [2, -49] }, { n: 'D', p: [-2, -49] }];
  const pp = [{ n: 'Paris', p: [2, 49], dx: 0, dy: -13 }, { n: 'Le Cap', p: [18, -34], c: COL.a, dx: 0, dy: -13 }];
  void rep;
  return cours('12. Sphère et boule', `La <b>sphère</b> est la surface, la <b>boule</b> le solide plein. Couper une boule par un plan donne toujours un <b>disque</b> (et la sphère, un cercle).`,
    def(`Si le plan passe par le <b>centre</b> O, la section est un <b>grand cercle</b> : même rayon R que la boule. Sinon, à la distance OO′ de O, le rayon r de la section vérifie <b>R² = r² + OO′²</b> (triangle OO′M rectangle en O′, hypoténuse OM = R).<br>Sur la Terre, la <b>latitude</b> (0° à 90°, nord ou sud) se compte à partir de l'équateur ; la <b>longitude</b> (0° à 180°, est ou ouest) à partir du méridien de Greenwich. Sur la carte : longitude = abscisse, latitude = ordonnée.`),
    boule({ R: 5, sec: { t: 'plan', a: 3 }, lR: 'R = 5', la: 'OO′ = 3', lr: 'r = ?' }),
    meth(`Plan par le centre : r = R. Sinon, dessine le triangle OO′M rectangle en O′ et écris le théorème de Pythagore.`, `Latitude : nord = au-dessus de l'équateur (+), sud = en dessous (−). Longitude : est = à droite de Greenwich (+), ouest = à gauche (−).`),
    ex(`Exemple 1 : une boule de rayon 4 cm coupée par un plan passant par son centre ; rayon de la section`, `Un plan passant par le centre donne un grand cercle de même rayon que la boule.<br>${rep('disque de rayon 4 cm')}`),
    ex(`Exemple 2 : une boule de diamètre 10 cm coupée par un plan passant par son centre ; rayon de la section`, `Le grand cercle a le diamètre de la boule : 10 cm, donc un rayon de 10 ÷ 2 = 5 cm.<br>${rep('disque de rayon 5 cm')}`),
    ex(`Exemple 3 : boule de rayon 5 cm coupée par un plan passant par son centre ; périmètre du grand cercle (π ≈ 3,14)`, `2 × π × 5 ≈ 2 × 3,14 × 5 = 31,4 cm.<br>${rep('31,4 cm')}`),
    ex(`Exemple 4 : boule de rayon R = 5 cm, plan à 3 cm du centre ; rayon r de la section`, `r² = R² − OO′² = 5² − 3² = 25 − 9 = 16, donc r = 4 cm.<br>${rep('r = 4 cm')}`),
    ex(`Exemple 5 : section de rayon r = 12 cm, plan à 5 cm du centre ; rayon R de la boule`, `R² = r² + OO′² = 12² + 5² = 169, donc R = 13 cm.<br>${rep('R = 13 cm')}`),
    carte(pts),
    ex(`Exemple 6 : Paris a pour latitude 49° nord et pour longitude 2° est ; quel point de la carte est Paris ?`, `2° est : à droite de l'axe vertical ; 49° nord : au-dessus de l'équateur. C'est le point A.<br>${rep('A')}`),
    carte(pp),
    ex(`Exemple 7 : Paris a pour latitude 49° nord et Le Cap 34° sud ; écart de latitude`, `De part et d'autre de l'équateur : 49° + 34° = 83°.<br>${rep('83°')}`),
    ex(`Exemple 8 : Paris a pour longitude 2° est et Le Cap 18° est ; écart de longitude`, `Du même côté de Greenwich : 18° − 2° = 16°.<br>${rep('16°')}`),
    ex(`Exemple 9 : Paris a pour latitude 49° nord et Le Caire 30° nord ; écart de latitude`, `Même côté de l'équateur : 49° − 30° = 19°.<br>${rep('19°')}`),
    ex(`Exemple 10 : Paris a pour longitude 2° est et New York 74° ouest ; écart de longitude`, `De part et d'autre de Greenwich : 2° + 74° = 76°.<br>${rep('76°')}`),
    warn(`Pour une section à distance du centre, ne soustrais pas les longueurs (5 − 3) : utilise Pythagore, 5² − 3².`, `Deux villes de part et d'autre de l'équateur (ou de Greenwich) : on <b>additionne</b> les degrés ; du même côté : on <b>soustrait</b>.`),
    retenir(`section par un plan : disque ; R² = r² + OO′² ; latitude (équateur) et longitude (Greenwich) repèrent un point de la Terre.`));
}

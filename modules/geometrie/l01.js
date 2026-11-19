// Niveau 1 : vocabulaire (droite, demi-droite, segment ; droites parallèles et perpendiculaires). 6e.
import { figure, rot, COL } from './draw.js';
import { names, orient, H, choiceQ, ex, rep, warn, retenir, meth, def, cours, cols, pick, ri } from './util.js';

const KIND = { seg: 'un segment', ray: 'une demi-droite', line: 'une droite' };
const cross = (u, v) => u[0] * v[1] - u[1] * v[0], dotp = (u, v) => u[0] * v[0] + u[1] * v[1];
const vec = (P, Q) => [Q[0] - P[0], Q[1] - P[1]];

/** figure d'un segment, d'une demi-droite ou d'une droite (en orange) ; o = origine pour la demi-droite */
function objFig(kind, a, b, t, o) {
  const A = rot([0, 0], t), B = rot([3.6, 0], t);
  const [O, Q] = o === b ? [B, A] : [A, B];
  const f = { P: { [a]: A, [b]: B }, lab: { [a]: t + 90, [b]: t + 90 }, ext: 1, maxW: 420, maxH: 200, aria: KIND[kind] + ' ' + a + b };
  if (kind === 'seg') f.segs = [{ a: A, b: B, c: COL.a, w: 3.6, ends: true }];
  if (kind === 'ray') { const u = vec(O, Q); f.segs = [{ a: O, b: [O[0] + u[0] * 1e-3, O[1] + u[1] * 1e-3], c: COL.a, w: 3.6, ends: true }]; f.rays = [{ a: O, b: Q, c: COL.a, w: 3.6 }]; }
  if (kind === 'line') f.lines = [{ a: A, b: B, c: COL.a, w: 3.6 }];
  return figure(f);
}
const pairFig = (a, b, t) => figure({ P: { [a]: rot([0, 0], t), [b]: rot([3.6, 0], t) }, lab: { [a]: t + 90, [b]: t + 90 }, maxW: 360, maxH: 160, aria: 'les points ' + a + ' et ' + b });
const notation = (kind, a, b, o) => (kind === 'seg' ? `[${a}${b}]` : kind === 'line' ? `(${a}${b})` : o === b ? `[${b}${a})` : `[${a}${b})`);
const words = (kind, a, b, o) => (kind === 'seg' ? `le segment d'extrémités ${a} et ${b}` : kind === 'line' ? `la droite qui passe par ${a} et ${b}` : `la demi-droite d'origine ${o} qui passe par ${o === a ? b : a}`);
/** nombre d'extrémités « arrêtées » de la figure : 2 → segment, 1 → demi-droite, 0 → droite (vérification indépendante) */
const kindOfEnds = n => (n === 2 ? 'seg' : n === 1 ? 'ray' : 'line');

/** deux droites codées ; rel : 'par', 'perp' ou 'sec' ; renvoie la figure et les points définissant les droites */
function twoLines(rel, t, m = 60, labels = true) {
  const O = [0, 0];
  const d1 = [rot([-2.3, 0], t), rot([2.3, 0], t)];
  let d2;
  if (rel === 'par') d2 = [rot([-2.3, 1.5], t), rot([2.3, 1.5], t)];
  else if (rel === 'perp') d2 = [rot([0, -1.7], t), rot([0, 1.7], t)];
  else d2 = [rot([-1.9 * Math.cos(m / 57.29578), -1.9 * Math.sin(m / 57.29578)], t), rot([1.9 * Math.cos(m / 57.29578), 1.9 * Math.sin(m / 57.29578)], t)];
  const P = { O, u1: d1[1], v1: d1[0], u2: d2[1], v2: d2[0] };
  const f = {
    P, hide: Object.keys(P), maxW: 380, maxH: 230, ext: 0.7, aria: 'deux droites',
    lines: [{ a: d1[0], b: d1[1], c: COL.line, label: labels ? '(d₁)' : '' }, { a: d2[0], b: d2[1], c: COL.line, label: labels ? '(d₂)' : '', side: -1 }],
  };
  if (rel === 'perp') f.rights = [{ v: 'O', a: 'u1', b: 'u2', size: 14 }];
  if (rel === 'par') f.pars = [{ a: d1[0], b: d1[1] }, { a: d2[0], b: d2[1] }];
  if (rel === 'sec') f.arcs = [{ v: 'O', a: 'u1', b: 'u2', label: m + '°', r: 26 }];
  return { svg: figure(f), d1, d2 };
}
/** trois droites : cas 'ppp' (d₁ // d₂ et d₁ // d₃), 'perp' (d₂ ⊥ d₁ et d₃ ⊥ d₁), 'mix' (d₁ // d₂ et d₁ ⊥ d₃) */
function threeLines(cas, t) {
  const d1 = [rot([-2.6, 0], t), rot([2.6, 0], t)];
  let d2, d3;
  const f = { ext: 0.7, maxW: 400, maxH: 250, aria: 'trois droites' };
  if (cas === 'ppp') { d2 = [rot([-2.6, 1.3], t), rot([2.6, 1.3], t)]; d3 = [rot([-2.6, -1.3], t), rot([2.6, -1.3], t)]; f.pars = [{ a: d1[0], b: d1[1], t: 0.3 }, { a: d2[0], b: d2[1] }, { a: d1[0], b: d1[1], n: 2, t: 0.7 }, { a: d3[0], b: d3[1], n: 2 }]; }
  else if (cas === 'mix') { d2 = [rot([-2.6, 1.3], t), rot([2.6, 1.3], t)]; d3 = [rot([0.4, -1.6], t), rot([0.4, 1.9], t)]; f.pars = [{ a: d1[0], b: d1[1], t: 0.2 }, { a: d2[0], b: d2[1], t: 0.2 }]; }
  else { d2 = [rot([-1.2, -1.6], t), rot([-1.2, 1.6], t)]; d3 = [rot([1.2, -1.6], t), rot([1.2, 1.6], t)]; }
  const P = { p1: rot([-1.2, 0], t), p2: rot([1.2, 0], t), p3: rot([0.4, 0], t), h2: d1[1], q2: d2[1], q3: d3[1], q3b: d3[0] };
  f.P = P; f.hide = Object.keys(P);
  f.lines = [{ a: d1[0], b: d1[1], label: '(d₁)' }, { a: d2[0], b: d2[1], label: '(d₂)', side: -1 }, { a: d3[0], b: d3[1], label: '(d₃)' }];
  if (cas === 'perp') f.rights = [{ v: 'p1', a: 'h2', b: 'q2', size: 13 }, { v: 'p2', a: 'h2', b: 'q3', size: 13 }];
  if (cas === 'mix') f.rights = [{ v: 'p3', a: 'h2', b: 'q3', size: 13 }];
  return { svg: figure(f), d1, d2, d3 };
}
const rel = (u, v) => (Math.abs(cross(u, v)) < 1e-9 ? 'par' : Math.abs(dotp(u, v)) < 1e-9 ? 'perp' : 'sec');

export function L1(d) {
  const [a, b] = names(d, 'AB'), t = orient(d);
  const forms = d < 1 ? ['nom', 'lines'] : d < 3 ? ['nom', 'not', 'lines'] : d < 4 ? ['nom', 'not', 'mots', 'lines'] : ['nom', 'not', 'mots', 'lines', 'trois'];
  const f = pick(forms);
  if (f === 'nom') {
    const kind = pick(['seg', 'ray', 'line']), o = kind === 'ray' && d >= 1 && ri(0, 1) ? b : a;
    const stop = kind === 'seg' ? 2 : kind === 'ray' ? 1 : 0;
    return choiceQ({
      opts: Object.entries(KIND).map(([v, l]) => ({ v, l: `<b>${l}</b>` })), good: kind,
      html: `Comment s'appelle la figure tracée en orange ?`, visual: objFig(kind, a, b, t, o),
      hint: `Regarde ce qui se passe au-delà de ${a} et au-delà de ${b} : le trait s'arrête-t-il (petit trait d'arrêt), ou continue-t-il (flèche) ?`,
      solution: kind === 'seg' ? `Le trait s'arrête en ${a} <b>et</b> en ${b} : la figure a deux extrémités, c'est un <b>segment</b>, noté [${a}${b}].`
        : kind === 'ray' ? `Le trait s'arrête en ${o} mais continue de l'autre côté (flèche) : une seule extrémité, c'est une <b>demi-droite</b> d'origine ${o}, notée [${o}${o === a ? b : a}).`
          : `Le trait continue des deux côtés (deux flèches) : aucune extrémité, c'est une <b>droite</b>, notée (${a}${b}).`,
      msg: v => (v !== kind ? `Compte les extrémités : ${stop === 2 ? 'deux traits d\'arrêt' : stop === 1 ? 'un seul trait d\'arrêt' : 'aucun trait d\'arrêt, deux flèches'}.` : ''),
      verify: E => E === kindOfEnds(stop),
    });
  }
  if (f === 'not') {
    const kind = pick(['seg', 'ray', 'line']), o = kind === 'ray' && ri(0, 1) ? b : a, good = notation(kind, a, b, o);
    const opts = [`[${a}${b}]`, `(${a}${b})`, `[${a}${b})`, `[${b}${a})`].map(v => ({ v, l: `<b>${v}</b>` }));
    return choiceQ({
      opts, good, html: `Quelle est la notation ${kind === 'seg' ? 'du' : 'de la'} ${words(kind, a, b, o).replace(/^(le|la) /, '')} ?`, visual: pairFig(a, b, t),
      hint: `Les <b>crochets</b> disent si la figure s'arrête : [ ] pour une extrémité, ( ) quand elle continue. Ici, que se passe-t-il du côté de ${kind === 'ray' ? o === a ? a : b : a} puis du côté de ${kind === 'ray' ? (o === a ? b : a) : b} ?`,
      solution: kind === 'seg' ? `Un segment s'arrête aux deux points : crochet fermé de chaque côté, [${a}${b}].` : kind === 'line' ? `Une droite ne s'arrête d'aucun côté : parenthèses des deux côtés, (${a}${b}).`
        : `Une demi-droite s'arrête à son origine ${o} (crochet fermé, écrit <b>avec l'origine en premier</b>) et continue de l'autre côté (parenthèse) : [${o}${o === a ? b : a}).`,
      msg: v => (kind === 'ray' && v === `[${b}${a})` && good === `[${a}${b})` || kind === 'ray' && v === `[${a}${b})` && good === `[${b}${a})` ? `Pour une demi-droite, la <b>première lettre</b> est l'origine : celle où la figure s'arrête.` : ''),
      verify: E => E === notation(kind, a, b, o),
    });
  }
  if (f === 'mots') {
    const kind = pick(['seg', 'ray', 'line']), o = kind === 'ray' && ri(0, 1) ? b : a, shown = kind === 'ray' ? `[${o}${o === a ? b : a})` : notation(kind, a, b);
    const all = [['seg', a, b, a], ['line', a, b, a], ['ray', a, b, a], ['ray', a, b, b]];
    const opts = all.map(([k, p, q, oo]) => ({ v: notation(k, p, q, oo), l: words(k, p, q, oo) }));
    const good = notation(kind, a, b, o);
    return choiceQ({
      opts, good, html: `Que désigne la notation <b>${shown}</b> ?`, visual: pairFig(a, b, t),
      hint: `Dans ${shown}, regarde le crochet ou la parenthèse de chaque côté : lequel de ${a} ou de ${b} « arrête » la figure ?`,
      solution: `${shown} se lit : ${words(kind, a, b, o)}. ${kind === 'seg' ? 'Deux crochets fermés : elle s\'arrête aux deux points.' : kind === 'line' ? 'Deux parenthèses : elle ne s\'arrête nulle part.' : `Crochet fermé du côté de ${o} (l'origine), parenthèse de l'autre côté.`}`,
      verify: E => E === good,
    });
  }
  if (f === 'trois') {
    const cas = pick(['ppp', 'perp', 'mix']), { svg, d2, d3 } = threeLines(cas, t);
    return relQuestion(rel(vec(...d2), vec(...d3)), svg, cas);
  }
  // deux droites
  const relsPool = d < 3 ? ['par', 'perp'] : ['par', 'perp', 'sec'];
  const r = pick(relsPool), m = pick([35, 40, 50, 55, 65, 70, 110, 125]);
  const { svg, d1, d2 } = twoLines(r, t, m);
  const hint = r === 'perp' ? `Regarde l'endroit où (d₁) et (d₂) se coupent : y a-t-il un petit carré dessiné ?` : r === 'par' ? `Regarde les petites flèches dessinées sur (d₁) et sur (d₂) : sont-elles identiques ?` : `Les droites (d₁) et (d₂) se coupent avec un angle marqué ${m}° : est-ce un angle droit ?`;
  return choiceQ({
    opts: [{ v: 'par', l: 'parallèles' }, { v: 'perp', l: 'perpendiculaires' }, ...(d >= 3 ? [{ v: 'sec', l: 'ni parallèles ni perpendiculaires' }] : [])].map(o => ({ ...o, l: `<b>${o.l}</b>` })),
    good: r, html: `Les droites (d₁) et (d₂) sont-elles parallèles ou perpendiculaires ?`, visual: svg, hint,
    solution: r === 'perp' ? `Le petit carré au point d'intersection code un angle droit : (d₁) et (d₂) sont <b>perpendiculaires</b>, on écrit (d₁) ⊥ (d₂).`
      : r === 'par' ? `Les deux droites portent les mêmes flèches : elles sont <b>parallèles</b>, on écrit (d₁) // (d₂). Elles ne se coupent jamais.`
        : `Les droites se coupent, mais avec un angle de ${m}° et non 90° : elles ne sont pas perpendiculaires, et comme elles se coupent, elles ne sont pas parallèles.`,
    msg: v => (r === 'sec' && v === 'perp' ? `Un angle droit mesure exactement 90°, et ici l'angle marqué mesure ${m}°.` : r === 'sec' && v === 'par' ? `Deux droites parallèles ne se coupent jamais, or celles-ci se coupent.` : ''),
    verify: E => E === rel(vec(...d1), vec(...d2)),
  });
}
/** question « trois droites » : (d₂) et (d₃) */
function relQuestion(E, svg, cas) {
  const prem = cas === 'ppp' ? `(d₁) // (d₂) et (d₁) // (d₃)` : cas === 'perp' ? `(d₁) ⊥ (d₂) et (d₁) ⊥ (d₃)` : `(d₁) // (d₂) et (d₁) ⊥ (d₃)`;
  return choiceQ({
    opts: [{ v: 'par', l: '<b>parallèles</b>' }, { v: 'perp', l: '<b>perpendiculaires</b>' }], good: E,
    html: `Sur la figure, ${prem}. Que peut-on dire de (d₂) et (d₃) ?`, visual: svg,
    hint: cas === 'mix' ? `(d₃) coupe (d₁) à angle droit. Or (d₂) est parallèle à (d₁) : (d₃) coupe-t-elle (d₂) de la même façon ?` : `(d₂) et (d₃) sont placées de la même façon par rapport à (d₁) (${cas === 'ppp' ? 'parallèles' : 'perpendiculaires'} toutes les deux) : que peut-on en conclure entre elles ?`,
    solution: cas === 'ppp' ? `(d₂) et (d₃) sont toutes les deux parallèles à (d₁) : elles sont donc <b>parallèles</b> entre elles.`
      : cas === 'perp' ? `(d₂) et (d₃) sont toutes les deux perpendiculaires à (d₁) : elles sont donc <b>parallèles</b> entre elles.`
        : `(d₃) est perpendiculaire à (d₁), et (d₂) est parallèle à (d₁) : (d₃) est donc aussi <b>perpendiculaire</b> à (d₂).`,
    verify: v => v === E,
  });
}
void H;

export function C1() {
  const seg = objFig('seg', 'A', 'B', 0), ray = objFig('ray', 'A', 'B', 0, 'A'), line = objFig('line', 'A', 'B', 0);
  const perp = twoLines('perp', 20).svg, par = twoLines('par', 20).svg, sec = twoLines('sec', 20, 60).svg;
  const three = threeLines('perp', 0).svg;
  return cours('1. Droite, demi-droite, segment', `Pour décrire une figure sans ambiguïté, on utilise des mots précis et des notations : les crochets et les parenthèses disent si la figure « s'arrête » ou non.`,
    def(`• un <b>segment</b> [AB] : la partie de droite entre A et B, il a <b>deux</b> extrémités ;<br>• une <b>demi-droite</b> [AB) : elle part de A (son <b>origine</b>) et passe par B, elle continue à l'infini ; <b>une</b> extrémité ;<br>• une <b>droite</b> (AB) : elle passe par A et B et ne s'arrête jamais ;<br>• deux droites sont <b>parallèles</b> (//) si elles ne se coupent jamais, <b>perpendiculaires</b> (⊥) si elles se coupent en formant un angle droit.`),
    cols(seg, ray, line),
    meth(`Compte les extrémités de la figure : deux → segment, une → demi-droite, aucune → droite.`, `Pour la notation, un <b>crochet fermé</b> pour une extrémité, une <b>parenthèse</b> quand la figure continue.`, `Pour deux droites, cherche les codages : petit carré (angle droit), petites flèches identiques (parallèles).`),
    ex(`Exemple 1 : comment s'appelle la figure tracée en orange ?`, `Le trait s'arrête en A et en B (deux traits d'arrêt) : c'est <b>un segment</b>. Si une seule extrémité était un trait d'arrêt et l'autre une flèche, ce serait une demi-droite ; avec deux flèches, une droite.<br>${rep('un segment')}`),
    ex(`Exemple 2 : quelle est la notation de la demi-droite d'origine A qui passe par B ?`, `La figure s'arrête en A (crochet) et continue après B (parenthèse), et on écrit l'origine en premier : <b>[AB)</b>. La demi-droite d'origine B qui passe par A s'écrirait [BA).<br>${rep('[AB)')}`),
    ex(`Exemple 3 : que désigne la notation (AB) ?`, `Deux parenthèses : la figure ne s'arrête d'aucun côté, c'est la droite qui passe par A et B. [AB] serait le segment d'extrémités A et B.<br>${rep('la droite qui passe par A et B')}`),
    ex(`Exemple 4 : les droites (d₁) et (d₂) sont-elles parallèles ou perpendiculaires ?`, cols(perp, par) + `Le petit carré à l'intersection code un angle droit : les droites de la première figure sont <b>perpendiculaires</b> (⊥). Les mêmes flèches sur les deux droites de la deuxième figure codent le parallélisme : elles sont <b>parallèles</b> (//).<br>${rep('perpendiculaires (première figure), parallèles (deuxième figure)')}`),
    ex(`Exemple 5 : ni parallèles ni perpendiculaires`, sec + `Les droites se coupent (elles ne sont pas parallèles) en formant un angle marqué 60°, qui n'est pas droit : elles ne sont pas perpendiculaires.<br>${rep('ni parallèles ni perpendiculaires')}`),
    ex(`Exemple 6 : (d₁) ⊥ (d₂) et (d₁) ⊥ (d₃), que peut-on dire de (d₂) et (d₃) ?`, three + `Les deux droites sont perpendiculaires à la même droite (d₁) : elles sont <b>parallèles</b> entre elles.<br>${rep('parallèles')}`),
    ex(`Exemple 7 : (d₁) // (d₂) et (d₁) // (d₃), que peut-on dire de (d₂) et (d₃) ?`, threeLines('ppp', 0).svg + `Deux droites parallèles à une même troisième sont parallèles entre elles.<br>${rep('parallèles')}`),
    ex(`Exemple 8 : (d₁) // (d₂) et (d₁) ⊥ (d₃), que peut-on dire de (d₂) et (d₃) ?`, threeLines('mix', 0).svg + `(d₃) est perpendiculaire à (d₁) et (d₂) est parallèle à (d₁) : (d₃) est aussi <b>perpendiculaire</b> à (d₂).<br>${rep('perpendiculaires')}`),
    warn(`[AB) et [BA) ne sont <b>pas</b> la même demi-droite : l'origine s'écrit en premier. En revanche, [AB] = [BA] et (AB) = (BA).`, `On ne peut pas juger « à l'œil » : on s'appuie sur les codages (carré, flèches) ou sur les mesures données.`),
    retenir(`segment [AB] (2 extrémités), demi-droite [AB) (origine A), droite (AB) ; // pour parallèles, ⊥ pour perpendiculaires.`));
}

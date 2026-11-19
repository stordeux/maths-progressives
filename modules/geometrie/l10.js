// Niveau 10 : parallélogrammes particuliers : rectangle, losange, carré (nature d'un quadrilatère). 5e.
import { figure, rot, COL, dist } from './draw.js';
import { names, orient, choiceQ, ex, rep, warn, retenir, meth, def, cours, cols, pick, ri, shuffle } from './util.js';

const par = (a, b, al) => ({ A: [0, 0], B: [a, 0], D: [b * Math.cos(al * Math.PI / 180), b * Math.sin(al * Math.PI / 180)], C: [a + b * Math.cos(al * Math.PI / 180), b * Math.sin(al * Math.PI / 180)] });
const mp = (p, q) => [(p[0] + q[0]) / 2, (p[1] + q[1]) / 2];
const sub = (p, q) => [p[0] - q[0], p[1] - q[1]];
/** classification numérique d'un quadrilatère ABCD (coordonnées) */
export function numClass(Q) {
  const e = 1e-6, m1 = mp(Q.A, Q.C), m2 = mp(Q.B, Q.D), isPara = dist(m1, m2) < e;
  const de = Math.abs(dist(Q.A, Q.C) - dist(Q.B, Q.D)) < e, dp = Math.abs(sub(Q.C, Q.A)[0] * sub(Q.D, Q.B)[0] + sub(Q.C, Q.A)[1] * sub(Q.D, Q.B)[1]) < e;
  const sc = Math.abs(dist(Q.A, Q.B) - dist(Q.B, Q.C)) < e;
  const rect = isPara && de, los = isPara && sc;
  return { isPara, rect, los, carre: rect && los, de, dp, sc, nature: rect && los ? 'carre' : rect ? 'rect' : los ? 'los' : isPara ? 'para' : 'aucune' };
}
/** règles de déduction à partir de propriétés connues (ensemble de drapeaux) */
export function infer(S) {
  const rect0 = S.rg || S.a3 || S.a4, los0 = S.lg || S.c4;
  const para = S.pm || S.dm || rect0 || los0;
  const rect = rect0 || (para && (S.de || S.ar)), los = los0 || (para && (S.dp || S.sc));
  return rect && los ? 'carre' : rect ? 'rect' : los ? 'los' : para ? 'para' : 'aucune';
}
const TXT = {
  pm: n => `${n} est un parallélogramme.`, de: () => `Ses diagonales ont la même longueur.`, dp: () => `Ses diagonales sont perpendiculaires.`, sc: (n, d, N) => `Deux côtés consécutifs ont la même longueur (${N[0]}${N[1]} = ${N[1]}${N[2]}).`,
  ar: (n, d, N) => `Il a un angle droit en ${N[1]}.`, c4: () => `Ses quatre côtés ont la même longueur.`, a4: () => `Ses quatre angles sont droits.`, a3: () => `Il a trois angles droits.`, rg: n => `${n} est un rectangle.`, lg: n => `${n} est un losange.`,
  dm: () => `Ses diagonales se coupent en leur milieu.`,
};
const lc = s => s[0].toLowerCase() + s.slice(1).replace(/\.$/, '');
const NAT = { para: 'un parallélogramme (non rectangle, non losange)', rect: 'un rectangle (non carré)', los: 'un losange (non carré)', carre: 'un carré', aucune: 'on ne peut pas conclure : c\'est un quadrilatère quelconque' };
const SETS = {
  para: [['pm'], ['dm']],
  rect: [['a4'], ['a3'], ['pm', 'de'], ['pm', 'ar'], ['dm', 'de']],
  los: [['c4'], ['pm', 'sc'], ['pm', 'dp'], ['dm', 'dp']],
  carre: [['pm', 'de', 'dp'], ['pm', 'ar', 'sc'], ['c4', 'ar'], ['c4', 'a4'], ['rg', 'sc'], ['lg', 'ar'], ['rg', 'dp'], ['lg', 'de']],
};
const SIMPLE = { para: [['pm']], rect: [['a4'], ['a3']], los: [['c4']], carre: [['c4', 'a4']] };
const INSUFF = [[['dp'], 'kite'], [['de'], 'trap'], [['sc'], 'gen']];

function figOf(nm, Q, t, flags, diag) {
  const [a, b, c, e] = nm, q = {};
  for (const [k, n] of [['A', a], ['B', b], ['C', c], ['D', e]]) q[n] = rot(Q[k], t);
  const f = { P: q, polys: [{ p: nm, c: COL.ink }], ticks: [], rights: [], pars: [], segs: [], ext: 0, maxW: 420, maxH: 250, colors: {}, aria: 'quadrilatère ' + nm.join(''), arcs: [] };
  const O = (() => { const p = q[a], r = sub(q[c], q[a]), s2 = q[b], u = sub(q[e], q[b]), den = r[0] * u[1] - r[1] * u[0], k = ((s2[0] - p[0]) * u[1] - (s2[1] - p[1]) * u[0]) / den; return [p[0] + k * r[0], p[1] + k * r[1]]; })();
  if (flags.pm || flags.dm) { if (flags.pm) f.pars = [{ a: q[a], b: q[b], n: 1 }, { a: q[e], b: q[c], n: 1 }, { a: q[b], b: q[c], n: 2 }, { a: q[a], b: q[e], n: 2 }]; }
  if (flags.de || flags.dp || flags.dm || diag) {
    f.P.O = O; f.colors.O = COL.a; if (!flags.dm && !flags.pm && !flags.de && !flags.dp) delete f.P.O;
    f.segs.push({ a: q[a], b: q[c], c: COL.b, w: 2 }, { a: q[b], b: q[e], c: COL.g, w: 2 });
    if (flags.dm) f.ticks.push({ a: q[a], b: O, n: 1 }, { a: O, b: q[c], n: 1 }, { a: q[b], b: O, n: 2 }, { a: O, b: q[e], n: 2 });
    if (flags.de && !flags.dm) f.ticks.push({ a: q[a], b: q[c], n: 3, c: COL.b }, { a: q[b], b: q[e], n: 3, c: COL.g });
    if (flags.dp) f.rights.push({ v: 'O', a: a, b: b, size: 11 });
  }
  if (flags.sc) f.ticks.push({ a: q[a], b: q[b], n: 1 }, { a: q[b], b: q[c], n: 1 });
  if (flags.c4) f.ticks.push(...[[a, b], [b, c], [c, e], [e, a]].map(([x, y]) => ({ a: q[x], b: q[y], n: 1 })));
  if (flags.ar) f.rights.push({ v: b, a, b: c, size: 12 });
  if (flags.a4) [[a, b, e], [b, c, a], [c, e, b], [e, a, c]].forEach(([v, x, y]) => f.rights.push({ v, a: x, b: y, size: 12 }));
  if (flags.a3) [[a, b, e], [b, c, a], [c, e, b]].forEach(([v, x, y]) => f.rights.push({ v, a: x, b: y, size: 12 }));
  return figure(f);
}
const protoOf = nature => ({ para: par(5, 3, 70), rect: par(5, 3, 90), los: par(4, 4, 70), carre: par(4, 4, 90) })[nature];
const flagsOf = list => Object.fromEntries(list.map(k => [k, true]));
const clsStr = list => list.map((k, i) => (i === 0 ? '' : '')).join('');
void clsStr;

export function L10(d) {
  const nm = names(d, 'ABCD'), [a, b, c, e] = nm, N = [a, b, c, e], t = orient(d), n = `${a}${b}${c}${e}`;
  const forms = d < 1 ? ['nat'] : d < 2 ? ['nat', 'nat'] : d < 3 ? ['nat', 'ajout'] : ['nat', 'ajout', 'vf'];
  const f = pick(forms);
  if (f === 'nat') {
    const insuff = d >= 3 && ri(0, 3) === 0;
    let list, Q, E;
    if (insuff) {
      const [l, kind] = pick(INSUFF); list = l;
      Q = kind === 'kite' ? { A: [0, 0], B: [2, 1.5], C: [0, 5], D: [-1.5, 1.5] } : kind === 'trap' ? { A: [0, 0], B: [5, 0], C: [4, 2], D: [1, 2] } : { A: [0, 0], B: [3, 0], C: [3, 3], D: [-0.5, 2] };
      E = 'aucune';
    } else {
      const nat = pick(d < 1 ? ['rect', 'los', 'para', 'carre'] : ['rect', 'los', 'carre', 'para']), pool = d < 2 ? SIMPLE[nat] : SETS[nat];
      list = pick(pool); E = nat; Q = protoOf(nat);
      if (d >= 3 && ri(0, 1)) { const extra = pick(['dm', 'de', 'dp', 'sc'].filter(k => !list.includes(k))); const cand = [...list, extra]; if (infer(flagsOf(cand)) === nat) list = cand; }
    }
    const flags = flagsOf(list), fig = figOf(N, Q, t, flags, false);
    const text = list.map(k => TXT[k](n, d, N));
    const real = numClass({ A: Q.A, B: Q.B, C: Q.C, D: Q.D }).nature;
    const mk = (v, l) => ({ v, l: `<b>${l}</b>` });
    const opts = [mk('para', 'un parallélogramme'), mk('rect', 'un rectangle'), mk('los', 'un losange'), mk('carre', 'un carré'), ...(d >= 3 ? [mk('aucune', 'on ne peut pas conclure')] : [])];
    const head = ['pm', 'rg', 'lg'].includes(list[0]) ? TXT[list[0]](n, d, N) : `${n} est un quadrilatère.`, rest = list.filter((k, idx) => !(idx === 0 && ['pm', 'rg', 'lg'].includes(k))).map(k => TXT[k](n, d, N)), intro = [head, ...rest].join(' ');
    const sol = {
      para: `Un quadrilatère dont les diagonales se coupent en leur milieu (ou dont les côtés opposés sont parallèles) est un parallélogramme. Aucune autre propriété ne permet d'aller plus loin : <b>parallélogramme</b>.`,
      rect: `Un parallélogramme avec ${list.includes('de') ? 'des diagonales de même longueur' : list.includes('ar') ? 'un angle droit' : 'des angles droits'} (ou un quadrilatère à trois angles droits) est un <b>rectangle</b>.`,
      los: `Un parallélogramme avec ${list.includes('dp') ? 'des diagonales perpendiculaires' : list.includes('sc') ? 'deux côtés consécutifs égaux' : 'quatre côtés égaux'} (ou un quadrilatère à quatre côtés égaux) est un <b>losange</b>.`,
      carre: `Les propriétés données font de ${n} à la fois un rectangle et un losange : c'est un <b>carré</b>.`,
      aucune: `Ces propriétés ne suffisent pas : on ne peut pas affirmer que ${n} est un parallélogramme (contre-exemple : cerf-volant, trapèze isocèle…). On <b>ne peut pas conclure</b>.`,
    }[E];
    return choiceQ({
      opts, good: E, keep: true, html: `${intro} Quelle est la nature la plus précise de ${n} ?`, visual: fig,
      hint: insuff ? `Une seule propriété (${lc(text[0])}) ne donne pas, à elle seule, un parallélogramme : sers-toi du codage de la figure pour voir ce qu'elle dit des côtés opposés ou des diagonales de ${n}.`
        : (() => { const ex2 = list.filter(k => !['pm', 'dm'].includes(k)).map(k => TXT[k](n, d, N)); return ex2.length ? `Ici, ${n} a déjà de quoi être un parallélogramme (ou mieux) ; regarde ce qu'apportent « ${ex2.map(lc).join(' » et « ')} » : angle droit ou diagonales égales mènent au rectangle, côtés consécutifs égaux ou diagonales perpendiculaires au losange, les deux au carré.` : `Une seule information est donnée sur ${n} (${lc(text[0])}) : à quelle nature mène-t-elle d'après les définitions ?`; })(),
      solution: sol,
      msg: v => (E === 'carre' && (v === 'rect' || v === 'los') ? `Cette propriété est vraie, mais il y en a une autre qui fait de ${n} aussi un ${v === 'rect' ? 'losange' : 'rectangle'} : c'est donc un carré.` : E === 'rect' && v === 'carre' || E === 'los' && v === 'carre' ? `Rien ne dit qu'il a à la fois les propriétés du rectangle et du losange.` : ''),
      verify: Ev => Ev === infer(flags) && Ev === real,
    });
  }
  if (f === 'ajout') {
    const target = pick(['rect', 'los']), PRO = { de: 'ses diagonales ont la même longueur', dp: 'ses diagonales sont perpendiculaires', sc: `deux côtés consécutifs ont la même longueur`, ar: 'il a un angle droit', co: 'ses côtés opposés ont la même longueur' };
    const goodKeys = target === 'rect' ? ['de', 'ar'] : ['dp', 'sc'], bad = target === 'rect' ? ['dp', 'sc', 'co'] : ['de', 'ar', 'co'], good = pick(goodKeys);
    const keys = [good, ...bad];
    const nameT = target === 'rect' ? 'rectangle' : 'losange';
    const pred = { de: c => c.de, dp: c => c.dp, sc: c => c.sc, ar: c => c.rect, co: () => true };
    const suff = k => ['para', 'rect', 'los', 'carre'].map(protoOf).map(numClass).filter(pred[k]).every(c => (target === 'rect' ? c.rect : c.los));
    return choiceQ({
      opts: shuffle(keys).map(k => ({ v: k, l: `<b>${PRO[k][0].toUpperCase() + PRO[k].slice(1)}</b>` })), good, keep: true,
      html: `${n} est un parallélogramme. Quelle propriété supplémentaire permet d'affirmer que c'est un ${nameT} ?`,
      visual: figOf(N, protoOf('para'), t, { pm: true }, false),
      hint: target === 'rect' ? `Un rectangle est un parallélogramme avec un angle droit (donc quatre) ou des diagonales égales : parmi les propositions sur ${n}, laquelle parle d'angle droit ou de diagonales de même longueur ?` : `Un losange est un parallélogramme dont deux côtés consécutifs sont égaux (donc les quatre) ou dont les diagonales sont perpendiculaires : laquelle des propositions sur ${n} dit cela ?`,
      solution: `${n} est un parallélogramme. ${PRO[good][0].toUpperCase() + PRO[good].slice(1)} : un parallélogramme avec cette propriété est un <b>${nameT}</b>. Les autres propositions ne distinguent pas le ${nameT} (les côtés opposés d'un parallélogramme sont déjà égaux).`,
      msg: v => (v === 'co' ? `Un parallélogramme a toujours ses côtés opposés égaux : cela ne le rend pas particulier.` : ''),
      verify: Ev => Ev === good && keys.filter(suff).length === 1 && suff(Ev),
    });
  }
  // vrai / faux
  const stmts = [['rect', 'para', 'Tout rectangle est un parallélogramme'], ['carre', 'rect', 'Tout carré est un rectangle'], ['carre', 'los', 'Tout carré est un losange'], ['los', 'carre', 'Tout losange est un carré'], ['rect', 'los', 'Tout rectangle est un losange'], ['para', 'rect', 'Tout parallélogramme est un rectangle'], ['los', 'para', 'Tout losange est un parallélogramme'], ['rect', 'carre', 'Tout rectangle est un carré']];
  const [X, Y, text] = pick(stmts);
  const is = (Q, k) => { const c = numClass(Q); return k === 'para' ? c.isPara : c[k]; };
  const truth = ['para', 'rect', 'los', 'carre'].map(protoOf).filter(Q => is(Q, X)).every(Q => is(Q, Y));
  const vis = figOf(N, protoOf(X), t, X === 'carre' ? { c4: true, a4: true } : X === 'rect' ? { a4: true } : X === 'los' ? { c4: true } : { pm: true }, false);
  return choiceQ({
    opts: [{ v: 'vrai', l: '<b>Vrai</b>' }, { v: 'faux', l: '<b>Faux</b>' }], good: truth ? 'vrai' : 'faux', keep: true, html: `Vrai ou faux ? « ${text}. »`, visual: vis,
    hint: `Pose-toi la question : un ${X === 'para' ? 'parallélogramme quelconque' : X === 'rect' ? 'rectangle' : X === 'los' ? 'losange' : 'carré'} a-t-il <b>toutes</b> les propriétés exigées pour être ${Y === 'para' ? 'un parallélogramme' : Y === 'rect' ? 'un rectangle (angle droit)' : Y === 'los' ? 'un losange (côtés consécutifs égaux)' : 'un carré (angle droit et côtés égaux)'} ? Regarde le codage de la figure.`,
    solution: truth ? `Un ${{ para: 'parallélogramme', rect: 'rectangle', los: 'losange', carre: 'carré' }[X]} possède toutes les propriétés d'un ${{ para: 'parallélogramme', rect: 'rectangle', los: 'losange', carre: 'carré' }[Y]} : c'est <b>vrai</b>.` : `Contre-exemple : un ${{ para: 'parallélogramme quelconque', rect: 'rectangle qui n\'est pas un carré', los: 'losange qui n\'est pas un carré', carre: 'carré' }[X]} n'a pas toutes les propriétés d'un ${{ para: 'parallélogramme', rect: 'rectangle', los: 'losange', carre: 'carré' }[Y]} : c'est <b>faux</b>.`,
    verify: Ev => Ev === (truth ? 'vrai' : 'faux'),
  });
}

export function C10() {
  const N = ['A', 'B', 'C', 'D'], fg = (Q, flags) => figOf(N, Q, 0, flags, false);
  const fRect = fg(protoOf('rect'), { pm: true, ar: true }), fLos = fg(protoOf('los'), { pm: true, sc: true }), fCar = fg(protoOf('carre'), { pm: true, de: true, dp: true });
  const fR2 = fg(protoOf('rect'), { pm: true, de: true }), fL2 = fg(protoOf('los'), { dm: true, dp: true }), fPara = fg(protoOf('para'), { pm: true });
  const fA4 = fg(protoOf('rect'), { a4: true }), fC4 = fg(protoOf('los'), { c4: true }), fK = fg({ A: [0, 0], B: [2, 1.5], C: [0, 5], D: [-1.5, 1.5] }, { dp: true });
  const fAj = fg(protoOf('para'), { pm: true });
  return cours('10. Rectangle, losange, carré', `Le rectangle, le losange et le carré sont des parallélogrammes « avec quelque chose en plus ». Pour trouver la nature d'un quadrilatère, on cherche d'abord un parallélogramme, puis ce qu'il a de plus.`,
    def(`<b>Parallélogramme</b> : côtés opposés parallèles, ou diagonales qui se coupent en leur milieu.<br><b>Rectangle</b> : parallélogramme avec <b>un angle droit</b> ou avec des <b>diagonales de même longueur</b> (ou quadrilatère à 3 angles droits).<br><b>Losange</b> : parallélogramme avec <b>deux côtés consécutifs égaux</b> ou des <b>diagonales perpendiculaires</b> (ou quadrilatère à 4 côtés égaux).<br><b>Carré</b> : à la fois rectangle et losange. Un carré est donc un rectangle et un losange ; un rectangle et un losange sont des parallélogrammes.`),
    meth(`Cherche d'abord de quoi prouver un <b>parallélogramme</b> (parallèles ou milieu des diagonales).`, `Regarde ensuite ce qui s'ajoute : angle droit ou diagonales égales → rectangle ; côtés consécutifs égaux ou diagonales perpendiculaires → losange.`, `S'il y a les deux, c'est un carré. Si on n'a pas de parallélogramme, ne conclus pas.`),
    cols(fRect, fLos),
    ex(`Exemple 1 : ABCD est un parallélogramme et il a un angle droit`, `Parallélogramme avec un angle droit : c'est un <b>rectangle</b> (les trois autres angles sont alors droits aussi).<br>${rep('un rectangle')}`),
    ex(`Exemple 2 : ABCD est un parallélogramme dont deux côtés consécutifs ont la même longueur`, `Parallélogramme avec deux côtés consécutifs égaux : ses quatre côtés sont égaux, c'est un <b>losange</b>.<br>${rep('un losange')}`),
    cols(fR2, fL2),
    ex(`Exemple 3 : ABCD est un parallélogramme dont les diagonales ont la même longueur ; puis un quadrilatère dont les diagonales se coupent en leur milieu et sont perpendiculaires`, `Parallélogramme + diagonales égales : <b>rectangle</b>. Diagonales qui se coupent en leur milieu (parallélogramme) et perpendiculaires : <b>losange</b>.<br>${rep('un rectangle, puis un losange')}`),
    fCar,
    ex(`Exemple 4 : ABCD est un parallélogramme dont les diagonales ont la même longueur et sont perpendiculaires`, `Diagonales égales → rectangle ; diagonales perpendiculaires → losange. À la fois rectangle et losange : c'est un <b>carré</b>.<br>${rep('un carré')}`),
    cols(fA4, fC4),
    ex(`Exemple 5 : un quadrilatère avec quatre angles droits ; un quadrilatère avec quatre côtés égaux`, `Quatre angles droits : <b>rectangle</b>. Quatre côtés égaux : <b>losange</b>. Avec les deux à la fois : carré.<br>${rep('un rectangle, puis un losange')}`),
    cols(fPara, fK),
    ex(`Exemple 6 : on ne peut pas conclure (parallélogramme quelconque ; diagonales perpendiculaires seulement)`, `Si on sait seulement que ABCD est un parallélogramme (rien de plus), c'est <b>un parallélogramme</b>. Si on sait seulement que ses diagonales sont perpendiculaires, ABCD peut être un cerf-volant : on <b>ne peut pas conclure</b>.<br>${rep('un parallélogramme, puis on ne peut pas conclure')}`),
    fAj,
    ex(`Exemple 7 : quelle propriété permet d'affirmer qu'un parallélogramme est un rectangle ?`, `Pour un rectangle : un angle droit ou des diagonales de même longueur. « Côtés opposés égaux » est vrai pour tout parallélogramme, « diagonales perpendiculaires » ou « côtés consécutifs égaux » donnent un losange. Pour affirmer que c'est un losange, on prend donc « deux côtés consécutifs égaux » ou « diagonales perpendiculaires ».<br>${rep('un angle droit (ou des diagonales de même longueur)')}`),
    ex(`Exemple 8 : vrai ou faux ? « Tout carré est un rectangle » ; « tout losange est un carré »`, `Un carré a quatre angles droits : c'est un rectangle, <b>vrai</b>. Un losange n'a pas forcément d'angle droit (contre-exemple : un losange « penché »), donc <b>faux</b>.<br>${rep('vrai, puis faux')}`),
    warn(`Des diagonales perpendiculaires ou égales ne suffisent <b>pas</b> si on ne sait pas que c'est un parallélogramme.`, `Rectangle : angle droit ou diagonales <b>égales</b>. Losange : côtés consécutifs égaux ou diagonales <b>perpendiculaires</b> : ne les mélange pas !`, `Un carré a toutes les propriétés du rectangle <b>et</b> du losange.`),
    retenir(`parallélogramme + angle droit (ou diagonales égales) = rectangle ; parallélogramme + côtés consécutifs égaux (ou diagonales perpendiculaires) = losange ; les deux = carré.`));
}
void NAT; void pick; void ri;

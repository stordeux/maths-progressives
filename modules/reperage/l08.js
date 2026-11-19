// Niveau 8 : patrons du cube et du pavé : est-ce un patron ? quelle face sera opposée ? longueur d'un côté. 5e.
import { plat, COL } from './draw.js';
import { numQ, choiceQ, ex, rep, warn, retenir, meth, def, cours, pick, ri, shuffle, chance } from './util.js';

const key = c => c[0] + ',' + c[1];
/** a-t-on un bloc 2 × 2 de carrés ? (impossible à plier) */
const bloc = cells => { const s = new Set(cells.map(key)); return cells.some(([x, y]) => s.has(key([x + 1, y])) && s.has(key([x, y + 1])) && s.has(key([x + 1, y + 1]))); };
/** méthode 1 : on fait rouler un cube sur le patron ; chaque case reçoit la face du cube qui la touche (faces 0/1, 2/3, 4/5 opposées) */
export function rouler(cells) {
  const S = new Set(cells.map(key)), faces = new Map(), seen = new Set([key(cells[0])]);
  faces.set(key(cells[0]), 0);
  const q = [[cells[0], { b: 0, t: 1, n: 2, s: 3, e: 4, w: 5 }]];
  while (q.length) {
    const [[x, y], st] = q.shift();
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const c = [x + dx, y + dy], k = key(c);
      if (!S.has(k) || seen.has(k)) continue;
      const n = dx === 1 ? { b: st.e, e: st.t, t: st.w, w: st.b, n: st.n, s: st.s } : dx === -1 ? { b: st.w, w: st.t, t: st.e, e: st.b, n: st.n, s: st.s } : dy === 1 ? { b: st.n, n: st.t, t: st.s, s: st.b, e: st.e, w: st.w } : { b: st.s, s: st.t, t: st.n, n: st.b, e: st.e, w: st.w };
      seen.add(k); faces.set(k, n.b); q.push([c, n]);
    }
  }
  const ok = !bloc(cells) && seen.size === 6 && new Set(faces.values()).size === 6;
  return { ok, faces };
}
/** méthode 2 (indépendante) : on plie vraiment le patron dans l'espace ; renvoie la normale sortante de chaque case */
export function plier(cells) {
  const S = new Set(cells.map(key)), res = new Map(), add = (a, b, s = 1) => a.map((v, i) => v + s * b[i]), mul = (a, s) => a.map(v => v * s);
  const root = { u: [1, 0, 0], v: [0, 1, 0], n: [0, 0, 1], c: [0, 0, 0] };
  res.set(key(cells[0]), root);
  const q = [[cells[0], root]];
  while (q.length) {
    const [[x, y], f] = q.shift();
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const c = [x + dx, y + dy], k = key(c);
      if (!S.has(k) || res.has(k)) continue;
      const a3 = add(mul(f.u, dx), mul(f.v, dy)), b3 = add(mul(f.u, -dy), mul(f.v, dx)), mn = mul(f.n, -1);
      const g = { c: add(add(f.c, a3, 0.5), f.n, -0.5), n: a3, u: add(mul(mn, dx), b3, -dy), v: add(mul(mn, dy), b3, dx) };
      res.set(k, g); q.push([c, g]);
    }
  }
  const normales = [...res.values()].map(g => g.n.join(','));
  return { ok: res.size === 6 && new Set(normales).size === 6 && !bloc(cells), res };
}
const oppose = (res, k) => { const n = res.get(k).n.map(v => -v).join(','); return [...res.entries()].find(([, g]) => g.n.join(',') === n)?.[0]; };

const norm = cells => { const mx = Math.min(...cells.map(c => c[0])), my = Math.min(...cells.map(c => c[1])); return cells.map(([x, y]) => [x - mx, y - my]); };
/** hexomino aléatoire connexe */
function hexomino() {
  const cells = [[0, 0]], S = new Set(['0,0']);
  while (cells.length < 6) {
    const [x, y] = pick(cells), [dx, dy] = pick([[1, 0], [-1, 0], [0, 1], [0, -1]]), c = [x + dx, y + dy];
    if (!S.has(key(c))) { S.add(key(c)); cells.push(c); }
  }
  return norm(cells);
}
/** patron en « 1-4-1 » : bande de 4 carrés, un carré au-dessus et un carré en dessous (toujours un patron de cube) */
function patron141() {
  const c = [[0, 0], [1, 0], [2, 0], [3, 0], [ri(0, 3), 1], [ri(0, 3), -1]];
  return norm(chance(0.5) ? c : c.map(([x, y]) => [y, x]));
}
const longueur = cells => { let best = 1; for (const dir of [[1, 0], [0, 1]]) for (const c of cells) { let n = 0, p = c; const S = new Set(cells.map(key)); if (S.has(key([c[0] - dir[0], c[1] - dir[1]]))) continue; while (S.has(key(p))) { n++; p = [p[0] + dir[0], p[1] + dir[1]]; } best = Math.max(best, n); } return best; };

const carre = (c, fill, lw) => ({ p: [[c[0], c[1]], [c[0] + 1, c[1]], [c[0] + 1, c[1] + 1], [c[0], c[1] + 1]], fill, w: lw });
const FILLS = ['#bfdbfe', '#fed7aa', '#bbf7d0'];
function dessinNet(cells, o = {}) {
  const polys = cells.map(c => carre(c, (o.fills && o.fills[key(c)]) || '#e0ecff', o.w)), texts = o.lettres ? cells.map(c => ({ p: [c[0] + 0.5, c[1] + 0.5], s: o.lettres[key(c)], c: COL.ink, fs: 22 })) : [];
  return plat({ polys, texts, maxW: 300, maxH: 230, kmax: 56, aria: o.aria || 'patron fait de six carrés' });
}

export function L8(d) {
  const f = pick(d < 1 ? ['opp'] : d < 2 ? ['opp', 'est'] : ['opp', 'est', 'pave']);
  if (f === 'est') {
    const want = chance(0.5);
    for (let i = 0; i < 4000; i++) {
      const cells = d < 2 && want ? patron141() : hexomino();
      const r = rouler(cells);
      if (r.ok !== want) continue;
      if (!want && d < 2 && !(longueur(cells) >= 5 || bloc(cells))) continue;
      const long = longueur(cells), visual = dessinNet(cells);
      let fills;
      if (r.ok) { fills = {}; r.faces.forEach((fc, k) => { fills[k] = FILLS[fc >> 1]; }); }
      const raison = bloc(cells) ? `quatre carrés forment un bloc 2 × 2 : autour d'un même sommet du cube il n'y a que trois faces, le quatrième carré se superposerait` : long >= 5 ? `la bande de ${long} carrés alignés fait plus d'un tour du cube : le premier et le dernier carré se superposeraient` : `en pliant, deux carrés tomberaient l'un sur l'autre`;
      return choiceQ({
        keep: true, opts: [{ v: 'oui', l: '<b>Oui</b>, c\'est un patron de cube' }, { v: 'non', l: '<b>Non</b>, ce n\'est pas un patron de cube' }], good: r.ok ? 'oui' : 'non', visual, after: r.ok ? dessinNet(cells, { fills }) : undefined, html: `Cette figure faite de 6 carrés est-elle un patron de cube ?`,
        hint: long >= 5 ? `Il y a ${long} carrés alignés. Une bande de 4 carrés fait exactement le tour du cube : que devient le ${long === 5 ? '5e' : '5e et le 6e'} carré en pliant ?` : long === 4 ? `Il y a une bande de 4 carrés alignés : elle fait le tour du cube. Où sont les 2 autres carrés (un de chaque côté de la bande, ou du même côté) ? Imagine le pliage.` : bloc(cells) ? `Regarde si quatre carrés forment un grand carré 2 × 2. Peut-on plier quatre carrés autour d'un même sommet du cube ?` : `La plus longue bande de carrés alignés en compte ${long}. Imagine le pliage : une face du cube est le fond, les autres se rabattent autour. Deux carrés tombent-ils l'un sur l'autre ?`,
        solution: r.ok ? `On plie : chaque carré devient une face différente du cube, et aucun ne se superpose. C'est bien un patron de cube (les couleurs de la correction montrent les faces opposées).` : `Ce n'est pas un patron : ${raison}.`,
        msg: v => (v === 'oui' && !r.ok ? `Imagine le pliage : ${raison}.` : v === 'non' && r.ok ? `Pourtant les six carrés se plient bien en un cube sans se superposer : essaie en gardant un carré fixe pour le dessous.` : ''),
        verify: E => (E === 'oui') === plier(cells).ok,
      });
    }
  }
  if (f === 'opp') {
    for (;;) {
      const cells = d < 2 ? patron141() : pick([patron141, hexomino, hexomino])();
      const r = rouler(cells);
      if (!r.ok) continue;
      const L = shuffle('ABCDEF'.split('')), lett = {}; cells.forEach((c, i) => { lett[key(c)] = L[i]; });
      const t = pick(cells), lt = lett[key(t)], oppF = cells.find(c => r.faces.get(key(c)) === (r.faces.get(key(t)) ^ 1)), lo = lett[key(oppF)];
      const S = new Set(cells.map(key)), nb = [[1, 0], [-1, 0], [0, 1], [0, -1]].map(([dx, dy]) => [t[0] + dx, t[1] + dy]).filter(c => S.has(key(c))).map(c => lett[key(c)]);
      const triple = [[1, 0], [0, 1]].some(([dx, dy]) => S.has(key([t[0] + dx, t[1] + dy])) && S.has(key([t[0] + 2 * dx, t[1] + 2 * dy])) && lett[key([t[0] + 2 * dx, t[1] + 2 * dy])] === lo) || [[1, 0], [0, 1]].some(([dx, dy]) => S.has(key([t[0] - dx, t[1] - dy])) && S.has(key([t[0] - 2 * dx, t[1] - 2 * dy])) && lett[key([t[0] - 2 * dx, t[1] - 2 * dy])] === lo);
      const fills = {}; fills[key(t)] = COL.aFill; fills[key(oppF)] = COL.gFill;
      const visual = dessinNet(cells, { lettres: lett });
      return choiceQ({
        keep: true, opts: 'ABCDEF'.split('').filter(x => x !== lt).map(v => ({ v, l: `<b>${v}</b>` })), good: lo, visual, after: dessinNet(cells, { lettres: lett, fills }), html: `On plie ce patron pour former un cube. Quelle face sera opposée à la face ${lt} ?`,
        hint: triple ? `Dans le patron, la face ${lt} touche ${nb.join(', ')} : ${nb.length > 1 ? 'ces faces ne peuvent pas' : 'cette face ne peut pas'} être opposée${nb.length > 1 ? 's' : ''} à ${lt}. Regarde la rangée droite de 3 carrés qui contient ${lt} : deux faces séparées par une seule face dans une rangée droite sont opposées.` : `Dans le patron, la face ${lt} touche ${nb.join(', ')} : ${nb.length > 1 ? 'ces faces ne peuvent pas lui être opposées' : 'cette face ne peut pas lui être opposée'}. Parmi les autres, imagine le pliage : pose ${lt} sur la table et rabats les carrés autour.`,
        solution: `${lt} touche ${nb.join(', ')} dans le patron. ${triple ? `La rangée droite ${lt} – … – ${lo} contient exactement une face entre les deux : elles sont opposées.` : `En pliant, on trouve que ${lo} se retrouve face à ${lt} (les cases orange et verte de la correction).`} La face opposée à ${lt} est ${lo}.`,
        msg: v => (nb.includes(v) ? `${v} touche ${lt} dans le patron : en pliant elle sera à côté de ${lt}, pas en face.` : ''),
        verify: E => { const P = plier(cells).res, kk = Object.entries(lett).find(([, x]) => x === lt)[0], ko = Object.entries(lett).find(([, x]) => x === E)[0]; return oppose(P, kk) === ko; },
      });
    }
  }
  // patron d'un pavé : longueur d'un côté marqué
  const dims = shuffle([ri(2, 4), ri(5, 7), ri(3, 6)]);
  for (;;) {
    const [A, B, H] = dims; if (A === B || B === H || A === H) { dims[0] = ri(2, 4); dims[1] = ri(5, 8); dims[2] = ri(3, 7); continue; }
    const wd = [A, B, A, B], i = ri(0, 3), j = ri(0, 3), x0 = [0]; wd.forEach((w, k) => x0.push(x0[k] + w));
    const polys = [], rect = (x, y, w, h, fill) => ({ p: [[x, y], [x + w, y], [x + w, y + h], [x, y + h]], fill });
    wd.forEach((w, k) => polys.push(rect(x0[k], 0, w, H, FILLS[0])));
    const dTop = wd[i] === A ? B : A, dBot = wd[j] === A ? B : A;
    polys.push(rect(x0[i], H, wd[i], dTop, FILLS[1]), rect(x0[j], -dBot, wd[j], dBot, FILLS[1]));
    // côté marqué : un côté du contour, tiré parmi les côtés des rectangles
    const sides = []; polys.forEach((pg, pi) => pg.p.forEach((a, k) => { const b = pg.p[(k + 1) % 4]; sides.push({ a, b, pi, len: Math.hypot(b[0] - a[0], b[1] - a[1]) }); }));
    const free = sides.filter(s => !sides.some(t => t !== s && ((t.a[0] === s.a[0] && t.a[1] === s.a[1] && t.b[0] === s.b[0] && t.b[1] === s.b[1]) || (t.a[0] === s.b[0] && t.a[1] === s.b[1] && t.b[0] === s.a[0] && t.b[1] === s.a[1]))));
    const m = pick(free), E = Math.round(m.len), kind = m.pi < 4 ? 'de la bande' : m.pi === 4 ? 'de la face du dessus' : 'de la face du dessous';
    const visual = plat({ polys, segs: [{ a: m.a, b: m.b, c: COL.a, w: 5 }], maxW: 330, maxH: 250, kmax: 36, aria: 'patron d\'un pavé droit avec un côté marqué en rouge' });
    return numQ({
      E: [E], tpl: `{0} cm`, neg: false, visual, html: `Ce patron est celui d'un pavé droit de dimensions ${A} cm, ${B} cm et ${H} cm. Quelle est la longueur du côté marqué en rouge ? (dessin non à l'échelle)`,
      hint: `Le côté rouge est un côté ${kind}. Une fois le patron plié, ce côté devient une arête du pavé : laquelle ? Elle a la même longueur que les arêtes parallèles, soit ${A} cm, ${B} cm ou ${H} cm. Regarde quels côtés de la bande se rejoignent avec lui.`,
      solution: `Après pliage, le côté rouge devient une arête du pavé de longueur ${E} cm (les faces opposées sont identiques, donc les côtés qui se rejoignent ont la même longueur).`,
      msg: v => ([A, B, H].includes(v[0]) ? `${v[0]} cm est une dimension du pavé, mais pas celle de ce côté : cherche avec quel côté de la bande il se rejoint en pliant.` : ''),
      verify: E2 => Math.abs(E2[0] - m.len) < 1e-9,
    });
  }
}

export function C8() {
  const N1 = [[0, 0], [1, 0], [2, 0], [3, 0], [1, 1], [2, -1]], N2 = [[0, 0], [1, 0], [2, 0], [0, 1], [1, 1], [2, -1]].map(c => c), N3 = [[0, 0], [1, 0], [2, 0], [3, 0], [4, 0], [1, 1]];
  const L1 = {}; N1.forEach((c, i) => { L1[key(c)] = 'ABCDEF'[i]; });
  const r1 = rouler(N1), fills = {}; r1.faces.forEach((fc, k) => { fills[k] = FILLS[fc >> 1]; });
  void N2;
  const dimsA = 6, dimsB = 4, dimsH = 3, wd = [dimsA, dimsB, dimsA, dimsB], x0 = [0, 6, 10, 16, 20];
  const polys = wd.map((w, k) => ({ p: [[x0[k], 0], [x0[k + 1], 0], [x0[k + 1], dimsH], [x0[k], dimsH]], fill: FILLS[0] }));
  polys.push({ p: [[0, dimsH], [6, dimsH], [6, dimsH + 4], [0, dimsH + 4]], fill: FILLS[1] }, { p: [[0, -4], [6, -4], [6, 0], [0, 0]], fill: FILLS[1] });
  const pave = plat({ polys, segs: [{ a: [6, dimsH + 4], b: [6, dimsH], c: COL.a, w: 5 }], maxW: 330, maxH: 250, kmax: 36, aria: 'patron d\'un pavé' });
  const t3 = L1;
  void t3;
  return cours('8. Patrons du cube et du pavé', `Un <b>patron</b> est une figure plane qui, une fois découpée et pliée, donne un solide. Le cube et le pavé ont chacun 6 faces : leur patron est fait de 6 rectangles (ou carrés).`,
    def(`Un patron de <b>cube</b> est formé de <b>6 carrés</b> identiques reliés par des côtés entiers. Il y a 11 patrons de cube différents. Dans le cube, deux faces <b>opposées</b> n'ont aucune arête commune ; dans un patron, on les retrouve séparées par une face dans une bande droite.<br>Dans un patron de <b>pavé</b>, les faces opposées sont deux rectangles identiques et les côtés qui se rejoignent après pliage ont la même longueur.`),
    dessinNet(N1, { lettres: L1 }),
    meth(`Compte 6 faces. Vérifie qu'aucun bloc de 4 carrés (2 × 2) n'existe et qu'aucune bande n'a plus de 4 carrés.`, `Pour trouver la face opposée : une face touchée par la face A ne peut pas lui être opposée ; dans une bande droite, deux faces séparées par une seule face sont opposées.`, `Imagine le pliage : pose une face sur la table et rabats les autres autour.`),
    ex(`Exemple 1 : on plie ce patron pour former un cube ; quelle face sera opposée à la face B ?`, `B touche A, C et E : elles seront voisines de B. Dans la bande A – B – C – D, les faces B et D sont séparées par une seule face (C) : elles sont opposées.<br>${rep('D')}`),
    dessinNet(N1, { fills }),
    ex(`Exemple 2 : cette figure de 6 carrés est-elle un patron de cube ? (patron 1-4-1 ci-dessus)`, `Une bande de 4 carrés, un carré de chaque côté : en pliant, la bande fait le tour du cube et les deux autres carrés forment le dessus et le dessous. Les couleurs montrent les faces opposées.<br>${rep('Oui, c\'est un patron de cube')}`),
    dessinNet(N3),
    ex(`Exemple 3 : cette figure de 6 carrés est-elle un patron de cube ? (une bande de 5 carrés)`, `Une bande de 4 carrés fait déjà le tour du cube : avec 5 carrés alignés, le 5e se superposerait au 1er. Ce n'est pas un patron.<br>${rep('Non, ce n\'est pas un patron de cube')}`),
    dessinNet([[0, 0], [1, 0], [0, 1], [1, 1], [2, 0], [3, 0]]),
    ex(`Exemple 3 bis : cette figure de 6 carrés est-elle un patron de cube ? (un bloc de 4 carrés en 2 × 2)`, `Quatre carrés forment un grand carré : autour d'un sommet du cube il n'y a que trois faces, le quatrième carré se superposerait. Ce n'est pas un patron.<br>${rep('Non, ce n’est pas un patron de cube')}`),
    dessinNet([[0, 0], [1, 0], [1, 1], [1, 2], [1, 3], [2, 3]], { lettres: { '0,0': 'E', '1,0': 'A', '1,1': 'D', '1,2': 'F', '1,3': 'B', '2,3': 'C' } }),
    ex(`Exemple 3 ter : on plie ce patron pour former un cube ; quelle face sera opposée à la face E ?`, `E touche seulement A. Les faces A, D, F, B forment la bande qui entoure le cube ; E et C sont les deux extrémités, de part et d'autre de la bande : elles sont opposées.<br>${rep('C')}`),
    pave,
    ex(`Exemple 4 : ce patron est celui d'un pavé droit de dimensions 6 cm, 4 cm et 3 cm ; longueur du côté marqué en rouge`, `Le côté rouge est le côté droit de la face du dessus (6 cm sur 4 cm). Après pliage, il rejoint le côté du haut du rectangle voisin de la bande, large de 4 cm : les deux côtés qui se rejoignent ont la même longueur.<br>${rep('4 cm')}`),
    warn(`Quatre carrés en bloc 2 × 2 ne se plient pas : il n'y a que trois faces autour d'un sommet du cube.`, `Deux faces qui se touchent dans le patron ne sont jamais opposées dans le solide.`),
    retenir(`un patron de cube a 6 carrés, sans bloc 2 × 2 et sans bande de plus de 4 ; dans une bande droite, deux faces séparées par une seule face sont opposées.`));
}

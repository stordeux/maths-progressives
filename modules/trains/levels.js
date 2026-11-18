// Trains, durées et vitesses : 12 niveaux. Horaires et durées (6e), fiche horaire et conversions (5e),
// d = v × t, v = d ÷ t, t = d ÷ v, km/h et m/s (4e), graphique horaire (4e – 3e), croisement et rattrapage (3e).
// Toutes les durées sont calculées en minutes entières ; les « vérifications indépendantes » (value, verify)
// recalculent la réponse autrement (calendrier, simulation minute par minute, lecture du graphique).
import { ri, pick, shuffle, chance, prenom } from '../../engine/util/rand.js';
import { M } from '../../engine/util/fmt.js';
import { r6 } from '../../engine/util/arith.js';
import { numsCheck } from '../../engine/answers/checks.js';
import * as V from './draw.js';

export const OPTIONS = { need: 4, keys: { neg: false, comma: false } };

/* ---------- outils ---------- */
const NB = '&nbsp;';
/** horaire « 8 h 05 » (t en minutes depuis minuit) */
const hm = t => `${Math.floor(t / 60)}${NB}h${NB}${String(t % 60).padStart(2, '0')}`;
/** durée « 1 h 35 min » */
const dur = m => (m < 60 ? `${m}${NB}min` : `${Math.floor(m / 60)}${NB}h${m % 60 ? `${NB}${m % 60}${NB}min` : ''}`);
/** « v × durée » avec la durée en heures (décimale si elle tombe juste, sinon ÷ 60) */
const prod = (v, m) => (decimalOK(m) ? `${v} × ${M(r6(m / 60))}` : `${v} × ${m} ÷ 60`);
const hdec = m => `${M(m / 60)}${NB}h`;
const km = x => `${M(x)}${NB}km`;
const kmh = x => `${M(x)}${NB}km/h`;
/** minutes absolues (calendrier) : calcul indépendant des soustractions « à la main » */
const dt = (h, m) => Date.UTC(2026, 0, 1, h, m) / 60000;
const hOf = t => Math.floor(t / 60), mOf = t => t % 60;
/** la durée tmin donne-t-elle au plus 2 décimales en heures ? */
const decimalOK = m => m % 3 === 0;

/* Lignes réelles : [gare, kilomètre depuis la 1re gare] (distances approximatives par le rail, arrondies).
   Les distances entre deux gares d'une même ligne servent à rendre les énoncés plausibles. */
export const LIGNES = [
  [['Hendaye', 0], ['Biarritz', 30], ['Bayonne', 35], ['Dax', 85]],
  [['Dax', 0], ['Orthez', 45], ['Pau', 85], ['Lourdes', 125], ['Tarbes', 145]],
  [['Bordeaux', 0], ['Libourne', 35], ['Marmande', 90], ['Agen', 140], ['Montauban', 200], ['Toulouse', 250]],
  [['Toulouse', 0], ['Carcassonne', 90], ['Narbonne', 150], ['Béziers', 180], ['Sète', 215], ['Montpellier', 240]],
  [['Perpignan', 0], ['Narbonne', 65], ['Béziers', 95], ['Montpellier', 150], ['Nîmes', 205], ['Avignon', 250]],
  [['Lyon', 0], ['Vienne', 30], ['Valence', 105], ['Montélimar', 150], ['Orange', 210], ['Avignon', 230], ['Marseille', 335]],
  [['Lille', 0], ['Douai', 35], ['Arras', 50], ['Amiens', 120]],
  [['Rennes', 0], ['Vannes', 115], ['Lorient', 155], ['Quimper', 235]],
  [['Nantes', 0], ['Angers', 90], ['Saumur', 130], ['Tours', 200], ['Blois', 260], ['Orléans', 320]],
  [['Strasbourg', 0], ['Sélestat', 50], ['Colmar', 70], ['Mulhouse', 115], ['Belfort', 160]],
  [['Paris', 0], ['Orléans', 120], ['Blois', 180], ['Tours', 235], ['Poitiers', 335], ['Bordeaux', 580]],
  [['Paris', 0], ['Le Mans', 210], ['Angers', 305], ['Nantes', 395]],
  [['Paris', 0], ['Le Mans', 210], ['Rennes', 350]],
  [['Paris', 0], ['Évreux', 100], ['Lisieux', 175], ['Caen', 235], ['Cherbourg', 360]],
  [['Paris', 0], ['Amiens', 130], ['Arras', 180], ['Lille', 230]],
  [['Paris', 0], ['Rouen', 135], ['Le Havre', 225]],
  [['Paris', 0], ['Reims', 145]],
  [['Paris', 0], ['Metz', 330]],
  [['Paris', 0], ['Strasbourg', 490]],
  [['Paris', 0], ['Dijon', 315]],
  [['Paris', 0], ['Lyon', 465]],
  [['Dijon', 0], ['Besançon', 95]],
  [['Dijon', 0], ['Lyon', 195]],
  [['Metz', 0], ['Nancy', 55]],
  [['Nancy', 0], ['Strasbourg', 150]],
  [['Lyon', 0], ['Grenoble', 115]],
  [['Calais', 0], ['Lille', 110]],
  [['Rouen', 0], ['Le Havre', 90]],
  [['Cherbourg', 0], ['Caen', 125]],
];
/** toutes les paires de gares d'une même ligne (au moins 20 km) : { A, B, km } */
export const PAIRS = LIGNES.flatMap(L => L.flatMap((a, i) => L.slice(i + 1).map(b => ({ A: a[0], B: b[0], km: b[1] - a[1] })))).filter(p => p.km >= 20);
/** vitesses moyennes plausibles (km/h) par type de train */
export const RANGES = { TER: [60, 130], 'Intercités': [110, 180], TGV: [180, 300] };
/** types de train qui desservent réellement une liaison de km kilomètres */
const typesFor = k => [k <= 250 ? 'TER' : null, k >= 150 && k <= 500 ? 'Intercités' : null, k >= 250 ? 'TGV' : null].filter(Boolean);
/** villes imaginaires (niveaux 10 et 12 : distances et vitesses libres) */
export const FICTIVES = ['Pont-Morin', 'Val-Clairet', 'Beaulac', 'Roche-Sablon', 'Bois-Joli', 'Saint-Aubin', 'Port-Larive', 'Mont-Royal', 'Villebrée', 'Sainte-Orne'];
const fict = n => shuffle([...FICTIVES]).slice(0, n);
let META = {};
/** « de Pau », « d'Agen » */
const de = n => (/^[AEIOUÉH]/.test(n) ? `d'${n}` : `de ${n}`);
const asH = m => (m % 60 === 0 ? `${m / 60}${NB}h` : m < 60 ? `${m}${NB}min` : decimalOK(m) ? `${M(r6(m / 60))}${NB}h = ${dur(m)}` : `${m}${NB}min = ${dur(m)}`);
/** une liaison réelle (A, B, km) et une durée entière de [lo ; hi] minutes (par pas st) dont la vitesse moyenne est plausible pour le type de train ; null si le tirage échoue */
function trip(lo, hi, st = 1) {
  const p = pick(PAIRS), n = pick(typesFor(p.km)), [vlo, vhi] = RANGES[n];
  const k0 = Math.ceil(Math.max(lo, Math.ceil(p.km / vhi * 60)) / st), k1 = Math.floor(Math.min(hi, Math.floor(p.km / vlo * 60)) / st);
  if (k0 > k1) return null;
  const sw = chance(0.5);
  return { A: sw ? p.B : p.A, B: sw ? p.A : p.B, km: p.km, n, D: st * ri(k0, k1) };
}
/** liaison réelle, type de train, vitesse (multiple de 5) et durée de pool tels que d = v × t soit un entier à moins de 7 % de la distance réelle */
function fitTrip(pool, terOnly) {
  return search(() => {
    const p = pick(PAIRS), ts = typesFor(p.km).filter(n => !terOnly || n === 'TER');
    if (!ts.length) return null;
    const n = pick(ts), [lo, hi] = RANGES[n], v = 5 * ri(Math.ceil(lo / 5), Math.floor(hi / 5)), t = pick(pool);
    if ((v * t) % 60) return null;
    const dist = v * t / 60, sw = chance(0.5);
    return Math.abs(dist - p.km) <= 0.07 * p.km ? { A: sw ? p.B : p.A, B: sw ? p.A : p.B, km: p.km, n, v, tmin: t, dist } : null;
  }, 300000);
}
const range = (a, b, s) => { const r = []; for (let x = a; x <= b; x += s) r.push(x); return r; };
/** tire jusqu'à ce que f() renvoie quelque chose (les contraintes « tombe juste » rejettent beaucoup de tirages) */
function search(f, n = 5000) { for (let i = 0; i < n; i++) { const r = f(); if (r) return r; } throw new Error('trains : aucun tirage valide'); }
/** vitesses de la vidéo : « tu as fait telle erreur » → message */
const diag = (u, cands) => { for (const [val, msg] of cands) if (val !== undefined && Number.isFinite(val) && Math.abs(val - u) < 1e-6) return msg; return ''; };

const MSG60 = 'Les minutes doivent rester inférieures à 60 : 60 min = 1 h. Convertis les minutes en trop en heures.';
/** réponse [h, min] : check avec message « minutes ≥ 60 » et message supplémentaire facultatif extra(h, m) */
function hmCheck(H, Mi, extra) {
  const tot = H * 60 + Mi;
  return numsCheck([H, Mi], {
    msg: v => {
      const [h, m] = v;
      if (m > 59) return h * 60 + m === tot ? 'La durée est bonne, mais les minutes doivent rester inférieures à 60 : 60 min = 1 h. Reporte les heures en trop.' : MSG60;
      return (extra && extra(h, m)) || '';
    },
  });
}
const baseDur = '{0}&nbsp;h {1}&nbsp;min';
const TPL_DUR = `Durée : ${baseDur}`;
const ex = (q, body) => `<div class="ex"><span class="q">${q}</span><br>${body}</div>`;

/* ================= 1. Durée dans la même heure ================= */
function L1(d) {
  const tr = search(() => (d < 1 ? trip(5, 45, 5) : d < 2 ? trip(6, 55) : trip(7, 58))), gap = tr.D;
  const m1 = d < 1 ? 5 * ri(0, Math.floor((59 - gap) / 5)) : ri(0, 59 - gap), m2 = m1 + gap, h = ri(6, 21), t1 = h * 60 + m1, t2 = h * 60 + m2;
  const { A, B, n } = tr;
  META = { segs: [{ km: tr.km, tmin: gap, n }], tmin: gap, m1, m2 };
  const visual = d < 2 && chance(0.5) ? V.horloges(t1, t2) : V.frise(t1, t2, { dur: '?' });
  return {
    type: 'nums', tpl: 'Durée : {0} min', keys: {},
    html: `${prenom()} prend un ${n} pour aller ${de(A)} à ${B}.<br>Départ : <b>${hm(t1)}</b>. Arrivée : <b>${hm(t2)}</b>.<br>Quelle est la durée du trajet ?`,
    visual,
    check: numsCheck([gap], { msg: v => (v[0] === m2 ? 'Tu as recopié les minutes de l\'arrivée. Une durée, c\'est l\'écart entre le départ et l\'arrivée.' : v[0] === m1 + m2 ? 'On n\'additionne pas les deux horaires : la durée est l\'écart entre eux.' : v[0] > 59 ? 'Dans la même heure, la durée est inférieure à 60 min.' : '') }),
    value: dt(h, m2) - dt(h, m1),
    hint: `L'heure ne change pas : seules les minutes comptent. Compte de 5 en 5 sur la frise, ou calcule (minutes d'arrivée) − (minutes de départ).`,
    solution: `Le départ et l'arrivée sont dans la même heure (${h} h). Durée = ${m2} − ${m1} = ${gap} min.`,
  };
}
function C1() {
  return `<h2>1. Durée dans la même heure</h2>
<p class="intro">Un horaire s'écrit avec des <b>heures</b> et des <b>minutes</b> : 8 h 15 se lit « huit heures quinze ». Une <b>durée</b> dit combien de temps passe entre deux horaires.</p>
<div class="def">Quand le départ et l'arrivée sont dans la <b>même heure</b>, on soustrait les minutes :<br><b>durée = minutes d'arrivée − minutes de départ</b>.<br>1 heure = 60 minutes.</div>
${V.frise(8 * 60 + 15, 8 * 60 + 50, { dur: '? min' })}
<div class="cols"><div class="methode"><b>Méthode</b><ol><li>Vérifie que l'heure est la même au départ et à l'arrivée.</li><li>Soustrais les minutes : arrivée − départ.</li><li>Écris le résultat avec l'unité « min ».</li></ol></div>${V.horloges(8 * 60 + 15, 8 * 60 + 50)}</div>
${ex('Exemple 1 : de 8 h 15 à 8 h 50', 'Même heure (8 h) : 50 − 15 = 35. Le trajet dure 35 min.')}
${ex('Exemple 2 : de 14 h 05 à 14 h 40', '40 − 5 = 35 : le trajet dure 35 min. On peut aussi compter sur la frise : 5 → 10 → 15 → … → 40, soit 7 sauts de 5 min.')}
<div class="warn">⚠️ On <b>soustrait</b> : on n'additionne jamais les deux horaires.<br>⚠️ Une durée est suivie d'une unité (min), un horaire s'écrit « 8 h 50 ».</div>
<div class="retenir">À retenir : dans la même heure, durée = minutes d'arrivée − minutes de départ.</div>`;
}

/* ================= 2. Durée qui passe l'heure ================= */
function L2(d) {
  let t1, t2, D, tr;
  search(() => {
    tr = d < 1 ? trip(25, 59) : d < 2 ? trip(61, 150) : d < 3 ? trip(61, 270) : trip(61, 400);
    if (!tr) return null;
    D = tr.D;
    t1 = ri(6, 19) * 60 + (d < 2 ? 5 * ri(0, 11) : ri(0, 59)); t2 = t1 + D;
    return t2 < 1440 && mOf(t1) !== mOf(t2) && (D < 60 ? hOf(t1) !== hOf(t2) : true) && (mOf(t2) < mOf(t1) || chance(0.3));
  });
  const { A, B } = tr, pile = (hOf(t1) + 1) * 60, p1 = pile - t1, p2 = t2 - pile;
  META = { segs: [{ km: tr.km, tmin: D, n: tr.n }], tmin: D, t1, t2 };
  const h0 = hOf(t2) - hOf(t1), m0 = Math.abs(mOf(t2) - mOf(t1));
  const html = `${prenom()} prend un ${tr.n} qui part ${de(A)} à <b>${hm(t1)}</b> et arrive à ${B} à <b>${hm(t2)}</b>.<br>Combien de temps dure le trajet ?`;
  const common = { html, visual: V.frise(t1, t2, { dur: '?' }) };
  const err = 'Attention : tu as soustrait les minutes « dans le mauvais sens ». Quand les minutes d\'arrivée sont plus petites, passe par l\'heure pile.';
  if (D < 60) {
    return { ...common, type: 'nums', tpl: 'Durée : {0} min', keys: {},
      check: numsCheck([D], { msg: v => (v[0] === m0 ? err : v[0] > 59 ? 'La durée est inférieure à 1 h : elle s\'écrit en minutes seulement.' : '') }),
      value: dt(hOf(t2), mOf(t2)) - dt(hOf(t1), mOf(t1)),
      hint: `Les minutes d'arrivée sont plus petites que celles du départ : on a changé d'heure. Passe par l'heure pile suivante : du départ à ${hm(pile)}, puis de ${hm(pile)} à l'arrivée.`,
      solution: `Du départ à ${hm(pile)} : ${p1} min. De ${hm(pile)} à ${hm(t2)} : ${p2} min.<br>Durée : ${p1} + ${p2} = ${D} min.` };
  }
  return { ...common, type: 'nums', tpl: TPL_DUR, keys: {},
    check: hmCheck(hOf(D), mOf(D), (h, m) => (h === h0 && m === m0 ? err : '')),
    verify: E => E[0] * 60 + E[1] === dt(hOf(t2), mOf(t2)) - dt(hOf(t1), mOf(t1)),
    hint: `Passe par l'heure pile : du départ jusqu'à l'heure pile suivante, puis de cette heure pile jusqu'à l'arrivée. Additionne les deux morceaux (60 min = 1 h).`,
    solution: `Du départ à ${hm(pile)} : ${p1} min.<br>De ${hm(pile)} à ${hm(t2)} : ${dur(p2)}.<br>Durée : ${dur(p2)} + ${p1} min = ${dur(D)}.` };
}
function C2() {
  return `<h2>2. Durée qui passe l'heure</h2>
<p class="intro">Si les minutes d'arrivée sont plus petites que celles du départ, on a <b>changé d'heure</b> : on ne peut plus soustraire directement (20 − 45 est impossible).</p>
<div class="def">La méthode de l'<b>heure pile</b> : on découpe le trajet en deux morceaux autour de l'heure ronde, on calcule chaque morceau, puis on les additionne.<br>60 minutes = 1 heure.</div>
${V.frise(8 * 60 + 45, 10 * 60 + 20, { dur: '? h ? min' })}
<div class="cols"><div class="methode"><b>Méthode</b><ol><li>Du départ à l'heure pile suivante.</li><li>De cette heure pile à l'arrivée.</li><li>Additionne, puis convertis : 60 min = 1 h.</li></ol></div>
${V.horloges(8 * 60 + 45, 10 * 60 + 20)}</div>
${ex('Exemple 1 : de 8 h 45 à 10 h 20', 'De 8 h 45 à 9 h : 15 min. De 9 h à 10 h 20 : 1 h 20 min. Total : 1 h 20 min + 15 min = 1 h 35 min.')}
${ex('Exemple 2 : de 16 h 50 à 17 h 25', 'De 16 h 50 à 17 h : 10 min. De 17 h à 17 h 25 : 25 min. Total : 35 min (moins d\'une heure : on écrit seulement des minutes).')}
<div class="warn">⚠️ Ne retire pas 20 − 45 « à l'envers » : 10 h 20 − 8 h 45 ne fait pas 2 h 25.<br>⚠️ 75 min ne s'écrit pas « 0 h 75 » : c'est 1 h 15 min.</div>
<div class="retenir">À retenir : passe par l'heure pile, additionne les deux morceaux et convertis (60 min = 1 h).</div>`;
}

/* ================= 3. Horaire d'arrivée ================= */
function L3(d) {
  let t1, D, tr;
  search(() => {
    tr = d < 1 ? trip(10, 55, 5) : d < 2 ? trip(15, 59) : d < 3 ? trip(61, 180) : trip(61, 360);
    if (!tr) return null;
    D = tr.D;
    t1 = ri(6, 17) * 60 + (d < 2 ? 5 * ri(0, 11) : ri(0, 59));
    const carry = mOf(t1) + D >= 60;
    return t1 + D < 1440 && (d < 1 ? !carry : carry || chance(0.15));
  });
  const t2 = t1 + D, H2 = hOf(t2), M2 = mOf(t2), { A, B } = tr, carry = mOf(t1) + (D % 60) >= 60;
  META = { segs: [{ km: tr.km, tmin: D, n: tr.n }], tmin: D, carry, E: [H2, M2] };
  const e = new Date(Date.UTC(2026, 0, 1, hOf(t1), mOf(t1) + D));
  return {
    type: 'nums', tpl: 'Arrivée à {0} h {1}', keys: {},
    html: `Un ${tr.n} part ${de(A)} à <b>${hm(t1)}</b>. Le trajet jusqu'à ${B} dure <b>${dur(D)}</b>.<br>À quelle heure arrive-t-il ?`,
    visual: V.frise(t1, t2, { endUnknown: true, dur: V.dureeTxt(D) }),
    check: numsCheck([H2, M2], { msg: v => {
      if (v[1] > 59) return v[0] * 60 + v[1] === t2 ? 'L\'horaire est juste, mais on n\'écrit pas plus de 59 minutes : 60 min = 1 h, reporte l\'heure.' : MSG60;
      if (carry && v[0] === H2 - 1 && v[1] === M2) return 'Tu as oublié de reporter 1 h : quand les minutes dépassent 59, on retire 60 min et on ajoute 1 h.';
      return '';
    } }),
    verify: E => E[0] === e.getUTCHours() && E[1] === e.getUTCMinutes(),
    hint: `Ajoute d'abord les heures, puis les minutes. Si les minutes dépassent 59, retire 60 minutes et ajoute 1 heure.`,
    solution: D < 60 ? `${hm(t1)} + ${D} min : minutes ${mOf(t1)} + ${D} = ${mOf(t1) + D}${mOf(t1) + D >= 60 ? `, soit 1 h ${mOf(t1) + D - 60} min : arrivée à ${hm(t2)}.` : ` : arrivée à ${hm(t2)}.`}`
      : `Heures : ${hOf(t1)} + ${hOf(D)} = ${hOf(t1) + hOf(D)}. Minutes : ${mOf(t1)} + ${mOf(D)} = ${mOf(t1) + mOf(D)}${carry ? ` = 1 h ${mOf(t1) + mOf(D) - 60} min` : ''}.<br>Arrivée à ${hm(t2)}.`,
  };
}
function C3() {
  return `<h2>3. Horaire d'arrivée</h2>
<p class="intro">On connaît l'heure de départ et la durée du trajet : on cherche l'heure d'arrivée. C'est une <b>addition</b> d'un horaire et d'une durée.</p>
<div class="def"><b>arrivée = départ + durée</b>.<br>On additionne les heures avec les heures, les minutes avec les minutes. Si le total des minutes dépasse 59, on retire 60 min et on ajoute 1 h.</div>
${V.frise(7 * 60 + 40, 9 * 60 + 15, { endUnknown: true, dur: '1 h 35 min' })}
<div class="cols"><div class="methode"><b>Méthode</b><ol><li>Additionne les heures.</li><li>Additionne les minutes.</li><li>Si les minutes ≥ 60 : minutes − 60, heures + 1.</li></ol></div>
${V.horloges(7 * 60 + 40, 9 * 60 + 15, { endUnknown: true })}</div>
${ex('Exemple 1 : 7 h 40 + 1 h 35 min', 'Heures : 7 + 1 = 8. Minutes : 40 + 35 = 75 = 1 h 15 min. On ajoute 1 h : 9 h 15. Arrivée à 9 h 15.')}
${ex('Exemple 2 : 13 h 10 + 45 min', 'Minutes : 10 + 45 = 55, moins de 60. Arrivée à 13 h 55.')}
<div class="warn">⚠️ « 8 h 75 » n'existe pas : 75 min = 1 h 15 min, donc 9 h 15.<br>⚠️ N'oublie pas de reporter l'heure : 7 h 40 + 35 min n'est pas 7 h 15 mais 8 h 15.</div>
<div class="retenir">À retenir : arrivée = départ + durée, et 60 min = 1 h.</div>`;
}

/* ================= 4. Lire une fiche horaire ================= */
function L4(d) {
  const n = d < 1 ? 3 : d < 3 ? 4 : 5;
  // gares réelles d'une ligne, au moins 15 km entre deux arrêts ; vitesse commerciale d'un TER (60 à 120 km/h) entre deux arrêts
  const { stops, segs } = search(() => {
    const L = pick(LIGNES.filter(l => l.length >= n)), ids = shuffle([...L.keys()]).slice(0, n).sort((a, b) => a - b);
    let st = ids.map(i => L[i]);
    if (chance(0.5)) st = st.map(([g, k]) => [g, L[L.length - 1][1] - k]).reverse();
    const sg = [];
    for (let i = 1; i < n; i++) {
      const kmi = st[i][1] - st[i - 1][1];
      if (kmi < 15) return null;
      const tmin = Math.round(kmi / (5 * ri(12, 24)) * 60), v = kmi / tmin * 60;
      if (v < RANGES.TER[0] || v > RANGES.TER[1]) return null;
      sg.push({ km: kmi, tmin, n: 'TER' });
    }
    return { stops: st, segs: sg };
  });
  const names = stops.map(x => x[0]), t0 = ri(6, 18) * 60 + 5 * ri(0, 11);
  META = { segs, tmin: segs.reduce((a, x) => a + x.tmin, 0) };
  const rows = [];
  let t = t0;
  for (let i = 0; i < n; i++) {
    const arr = i ? t + segs[i - 1].tmin : null, stop = ri(2, 5);
    rows.push({ g: names[i], arr, dep: i < n - 1 ? (i ? arr + stop : t0) : null });
    t = rows[i].dep;
  }
  const kind = d < 1 ? 0 : d < 2 ? pick([0, 1]) : d < 3 ? pick([1, 1, 2]) : pick([1, 2, 3]);
  const p = prenom();
  if (kind === 2) {
    const i = ri(1, n - 2), S = rows[i].dep - rows[i].arr;
    return { type: 'nums', tpl: 'Durée de l\'arrêt : {0} min', keys: {}, visual: V.ficheHoraire(rows, { hl: [i] }),
      html: `Voici la fiche horaire d'un train. Combien de temps le train reste-t-il arrêté à <b>${names[i]}</b> ?`,
      check: numsCheck([S], { msg: v => (v[0] === rows[i].arr - rows[i - 1].dep ? 'Tu as calculé le temps de roulage depuis la gare précédente ; l\'arrêt, c\'est le temps entre l\'arrivée et le départ dans la même gare.' : '') }),
      value: dt(hOf(rows[i].dep), mOf(rows[i].dep)) - dt(hOf(rows[i].arr), mOf(rows[i].arr)),
      hint: `Pendant l'arrêt, le train est dans la même gare : regarde la ligne de ${names[i]}, colonne « Arrivée » puis colonne « Départ ».`,
      solution: `À ${names[i]}, le train arrive à ${hm(rows[i].arr)} et repart à ${hm(rows[i].dep)} : ${S} min d'arrêt.` };
  }
  let i, j;
  if (kind === 0) { i = ri(0, n - 2); j = i + 1; }
  else if (kind === 3) { i = ri(0, 1); j = ri(i + 2, n - 1); }
  else { i = ri(0, n - 3); j = ri(i + 2, n - 1); }
  if (kind === 1 && n === 3) { i = 0; j = 2; }
  const from = rows[i].dep, to = rows[j].arr, D = to - from;
  const alt = [i ? to - rows[i].arr : null, j < n - 1 ? rows[j].dep - from : null].filter(x => x !== null && x !== D);
  const txt = kind === 0 ? `Combien de temps le train met-il pour aller ${/^[AEIOUÉH]/.test(names[i]) ? "d'" : 'de '}<b>${names[i]}</b> à <b>${names[j]}</b> ?`
    : `${p} monte dans le train à <b>${names[i]}</b> et descend à <b>${names[j]}</b>. Combien de temps dure son trajet dans le train ?`;
  return { type: 'nums', tpl: TPL_DUR, keys: {}, visual: V.ficheHoraire(rows, { hl: [i, j] }),
    html: `Voici la fiche horaire d'un train.<br>${txt}`,
    check: hmCheck(hOf(D), mOf(D), (h, m) => (alt.includes(h * 60 + m) ? 'Presque : tu as pris la mauvaise colonne. On part à l\'heure de la colonne « Départ » de la gare de départ, et on arrive à l\'heure de la colonne « Arrivée » de la gare d\'arrivée.' : '')),
    verify: E => E[0] * 60 + E[1] === dt(hOf(to), mOf(to)) - dt(hOf(from), mOf(from)),
    hint: `Lis la bonne colonne : on quitte ${names[i]} à l'heure de la colonne « Départ », et on arrive à ${names[j]} à l'heure de la colonne « Arrivée ». Puis calcule l'écart (par l'heure pile si besoin).`,
    solution: `Départ de ${names[i]} : ${hm(from)}. Arrivée à ${names[j]} : ${hm(to)}.<br>De ${hm(from)} à ${hm(to)} : ${dur(D)}.` };
}
function C4() {
  const rows = [{ g: 'Pau', arr: null, dep: 7 * 60 + 52 }, { g: 'Tarbes', arr: 8 * 60 + 33, dep: 8 * 60 + 36 }, { g: 'Lourdes', arr: 8 * 60 + 55, dep: 8 * 60 + 58 }, { g: 'Toulouse', arr: 10 * 60 + 5, dep: null }];
  return `<h2>4. Lire une fiche horaire</h2>
<p class="intro">En gare, une <b>fiche horaire</b> donne pour chaque arrêt l'heure d'<b>arrivée</b> et l'heure de <b>départ</b>. Le tiret « – » veut dire « pas d'heure » : le train ne fait que partir ou que s'arrêter.</p>
<div class="def">Pour un trajet de la gare X à la gare Y : on lit l'heure de <b>départ de X</b> et l'heure d'<b>arrivée à Y</b>, puis on calcule la durée.<br>L'<b>arrêt</b> dans une gare dure : départ − arrivée (même ligne).</div>
${V.ficheHoraire(rows, { hl: [1, 3] })}
<div class="methode"><b>Méthode</b><ol><li>Repère la ligne de la gare de départ : colonne « Départ ».</li><li>Repère la ligne de la gare d'arrivée : colonne « Arrivée ».</li><li>Calcule l'écart (par l'heure pile si besoin).</li></ol></div>
${ex('Exemple 1 : de Tarbes à Toulouse', 'Départ de Tarbes : 8 h 36. Arrivée à Toulouse : 10 h 05. De 8 h 36 à 9 h : 24 min ; de 9 h à 10 h 05 : 1 h 05 min. Durée : 1 h 29 min.')}
${ex('Exemple 2 : l\'arrêt à Lourdes', 'Arrivée 8 h 55, départ 8 h 58 : le train reste 3 min.')}
<div class="warn">⚠️ Ne pars pas de l'heure d'arrivée dans la gare de départ : le train est encore à quai, il ne repart qu'à l'heure de « Départ ».<br>⚠️ Dans la ligne d'une même gare, la durée entre arrivée et départ est l'arrêt, pas le temps de trajet.</div>
<div class="retenir">À retenir : départ de la 1re gare, arrivée à la 2e, puis on calcule l'écart.</div>`;
}

/* ================= 5. Heures et minutes, durées décimales ================= */
function L5(d) {
  const kind = pick(d < 1 ? [0, 1] : d < 2 ? [0, 1, 2] : d < 3 ? [0, 1, 2, 3] : [0, 1, 2, 3, 4]);
  const fr = d < 1 ? [15, 30, 45] : d < 2 ? [6, 12, 15, 18, 24, 30, 36, 42, 45, 48, 54] : range(3, 57, 3);
  const hh = kind === 2 || kind === 3 ? ri(1, 5) : ri(d < 2 ? 0 : 1, d < 1 ? 3 : 5), mm = pick(fr), tot = hh * 60 + mm, X = r6(tot / 60);
  META = { kind, hh, mm, tot };
  const visual = V.barreHeures(tot);
  const dec100 = Math.round(mm / 60 * 100);
  const hintDec = `Une heure = 60 minutes. Pour passer des minutes à la partie décimale, divise par 60 (30 min = 30 ÷ 60 h) ; dans l'autre sens, multiplie la partie décimale par 60.`;
  if (kind === 0) {
    return { type: 'nums', tpl: baseDur, keys: {}, visual, html: `Écris <b>${hdec(tot)}</b> en heures et minutes.`,
      check: hmCheck(hh, mm, (h, m) => (h === hh && m === dec100 ? `${M(X)} h, ce n'est pas ${hh} h ${dec100} min : la partie décimale est une fraction d'heure. ${M(mm / 60)} h = ${M(mm / 60)} × 60 min.` : '')),
      verify: E => Math.abs(E[0] + E[1] / 60 - X) < 1e-9,
      hint: `Garde les heures entières. Pour la partie décimale, multiplie-la par 60 : 0,5 h est la moitié de 60 min.`,
      solution: `${M(X)} h = ${hh} h + ${M(r6(mm / 60))} h.<br>${M(r6(mm / 60))} × 60 = ${mm} min. Donc ${M(X)} h = ${hh} h ${mm} min.` };
  }
  if (kind === 1) {
    return { type: 'nums', tpl: '{0} h', keys: { comma: true }, visual, html: `Écris <b>${hh} h ${mm} min</b> en heures, avec une écriture décimale.`,
      check: numsCheck([X], { msg: v => diag(v[0], [[hh + mm / 100, `${hh} h ${mm} min ne s'écrit pas ${M(hh + mm / 100)} h : 100 n'est pas 60 ! Les minutes se divisent par 60 : ${mm} ÷ 60.`], [tot, 'Tu as donné des minutes. On demande la durée en heures.']]) }),
      value: hh + mm / 60,
      hint: hintDec,
      solution: `${mm} min = ${mm} ÷ 60 = ${M(r6(mm / 60))} h.<br>${hh} h ${mm} min = ${hh} + ${M(r6(mm / 60))} = ${M(X)} h.` };
  }
  if (kind === 2) {
    return { type: 'nums', tpl: baseDur, keys: {}, visual, html: `Écris <b>${tot} min</b> en heures et minutes.`,
      check: hmCheck(hh, mm, (h, m) => (h === 0 ? 'Cherche combien d\'heures entières (60 min chacune) il y a dans cette durée.' : '')),
      verify: E => E[0] * 60 + E[1] === tot,
      hint: `Combien de fois 60 minutes y a-t-il dans ${tot} ? C'est le nombre d'heures. Ce qui reste, ce sont les minutes.`,
      solution: `${tot} = ${hh} × 60 + ${mm}. Donc ${tot} min = ${hh} h ${mm} min.` };
  }
  if (kind === 3) {
    return { type: 'nums', tpl: '{0} min', keys: {}, visual, html: `Écris <b>${hh} h ${mm} min</b> en minutes.`,
      check: numsCheck([tot], { msg: v => diag(v[0], [[hh * 100 + mm, '1 h = 60 min, pas 100 min : multiplie les heures par 60 avant d\'ajouter les minutes.'], [hh + mm, 'Tu as additionné des heures et des minutes. Convertis d\'abord les heures en minutes.']]) }),
      value: dt(hh, mm) - dt(0, 0),
      hint: `1 h = 60 min. Convertis les heures en minutes (heures × 60), puis ajoute les minutes.`,
      solution: `${hh} h = ${hh} × 60 = ${hh * 60} min.<br>${hh * 60} + ${mm} = ${tot} min.` };
  }
  return { type: 'nums', tpl: '{0} h', keys: { comma: true }, visual, html: `Écris <b>${tot} min</b> en heures, avec une écriture décimale.`,
    check: numsCheck([X], { msg: v => diag(v[0], [[tot / 100, 'Pour passer des minutes aux heures, on divise par 60 (une heure = 60 min), pas par 100.'], [hh + mm / 100, `${hh} h ${mm} min n'est pas ${M(hh + mm / 100)} h : les minutes se divisent par 60.`]]) }),
    value: tot / 60,
    hint: hintDec,
    solution: `${tot} min = ${tot} ÷ 60 = ${M(X)} h.` };
}
function C5() {
  return `<h2>5. Heures, minutes et durées décimales</h2>
<p class="intro">Les calculs de vitesse demandent des durées en <b>heures</b> avec une virgule : 1,5 h. Les horaires, eux, s'écrivent en heures et minutes : 1 h 30 min. Il faut savoir passer de l'un à l'autre.</p>
<div class="def">1 h = 60 min. Une durée de <b>0,5 h</b> est la moitié de 60 min : 30 min. Une durée de <b>45 min</b> vaut 45 ÷ 60 = 0,75 h.<br>Les minutes se divisent par 60 (et non par 100 !).</div>
${V.barreHeures(90)}
<div class="cols"><div class="methode"><b>Méthode</b><ol><li>Heures entières : on les garde.</li><li>Partie décimale → minutes : × 60.</li><li>Minutes → partie décimale : ÷ 60.</li></ol></div>
<table class="data"><tr><th>min</th><td>15</td><td>30</td><td>45</td><td>6</td><td>12</td></tr><tr><th>h</th><td>0,25</td><td>0,5</td><td>0,75</td><td>0,1</td><td>0,2</td></tr></table></div>
${ex('Exemple 1 : 1,5 h en heures et minutes', '0,5 × 60 = 30. Donc 1,5 h = 1 h 30 min (et surtout pas 1 h 50 min).')}
${ex('Exemple 2 : 2 h 15 min en heures', '15 ÷ 60 = 0,25. Donc 2 h 15 min = 2,25 h.')}
<div class="warn">⚠️ 1,5 h ≠ 1 h 50 min et 2 h 15 min ≠ 2,15 h : 100 n'est pas 60.<br>⚠️ Avant de calculer une vitesse, convertis toute la durée en heures.</div>
<div class="retenir">À retenir : partie décimale × 60 = minutes ; minutes ÷ 60 = partie décimale.</div>`;
}

/* ================= 6, 7, 8 : d = v × t ================= */
function tPool6(d) { return d < 1 ? range(60, 240, 60) : d < 2 ? [15, 30, 45, 75, 90, 105, 135, 150, 210] : d < 3 ? [...range(15, 240, 15), 20, 40, 80, 100] : range(10, 300, 5); }
function tPool78(d) { return d < 1 ? range(60, 300, 60) : d < 2 ? [30, 90, 150, 210, 270] : d < 3 ? range(30, 300, 15) : range(20, 300, 5); }
function L6(d) {
  const { A, B, n, v, tmin, dist, km: real } = fitTrip(tPool6(d), d < 1);
  META = { n, v, tmin, dist, real, dir: 0 };
  const tTxt = d < 2 && d >= 1 ? hdec(tmin) : dur(tmin), h = hOf(tmin), m = mOf(tmin), tH = M(r6(tmin / 60));
  const conv = d < 1 ? '' : decimalOK(tmin) ? `${tmin === 60 * h ? '' : `${dur(tmin)} = ${tH} h.<br>`}` : `${dur(tmin)} = ${tmin} ÷ 60 h.<br>`;
  const calc = `d = v × t = ${prod(v, tmin)} = ${dist}`;
  let acc = 0; for (let i = 0; i < tmin; i++) acc += v / 60;
  return {
    type: 'nums', tpl: 'Distance : {0} km', keys: {}, visual: V.ligne({ a: A, b: B, dist: '', dur: V.dureeTxt(tmin), v: `${v} km/h`, inconnu: 'dist' }),
    html: `Un ${n} relie ${A} à ${B}. Il roule à la vitesse constante de <b>${kmh(v)}</b> pendant <b>${tTxt}</b>.<br>Quelle distance parcourt-il ?`,
    check: numsCheck([dist], { msg: u => diag(u[0], [[v * (h + m / 100), `${dur(tmin)} ne s'écrit pas ${M(h + m / 100)} h : convertis les minutes en heures (÷ 60).`], [v * tmin, 'Tu as multiplié par des minutes. La vitesse est en km/h : il faut une durée en heures.'], [v / (tmin / 60), 'Pour une distance, on multiplie la vitesse par la durée (d = v × t), on ne divise pas.']]) }),
    value: acc,
    hint: `Utilise d = v × t, avec v en km/h et t en <b>heures</b>.${d >= 2 ? ' Convertis d\'abord la durée en heures (30 min = 0,5 h).' : ''}`,
    solution: `${conv}${calc} km.`,
  };
}
function C6() {
  return `<h2>6. Distance parcourue : d = v × t</h2>
<p class="intro">Un train qui roule à vitesse constante parcourt toujours la même distance à chaque heure : la distance est <b>proportionnelle</b> à la durée.</p>
<div class="def">À vitesse constante : <b>d = v × t</b>, avec <b>d</b> en km, <b>v</b> en km/h et <b>t</b> en heures.<br>Si la vitesse est 90 km/h, le train parcourt 90 km en 1 h, 180 km en 2 h, 45 km en 0,5 h.</div>
${V.ligne({ a: 'Pau', b: 'Dax', dist: '', dur: '2 h 30 min', v: '90 km/h', inconnu: 'dist' })}
<div class="methode"><b>Méthode</b><ol><li>Convertis la durée en heures (30 min = 0,5 h ; 15 min = 0,25 h).</li><li>Vérifie les unités : km/h avec des h.</li><li>Multiplie : d = v × t.</li></ol></div>
${ex('Exemple 1 : un TER à 90 km/h pendant 2 h', 'd = 90 × 2 = 180 km.')}
${ex('Exemple 2 : un TGV à 300 km/h pendant 1 h 30 min', '1 h 30 min = 1,5 h. d = 300 × 1,5 = 450 km.')}
<div class="warn">⚠️ N'écris pas 300 × 1,30 : 1 h 30 min = 1,5 h (pas 1,30 h).<br>⚠️ Ne multiplie pas la vitesse par des minutes : 90 × 150 n'a pas de sens.</div>
<div class="retenir">À retenir : d = v × t, avec la durée en heures.</div>`;
}

function L7(d) {
  const { A, B, n, v, tmin, dist, km: real } = fitTrip(tPool78(d), d < 1);
  META = { n, v, tmin, dist, real };
  const h = hOf(tmin), m = mOf(tmin), tH = M(r6(tmin / 60));
  return {
    type: 'nums', tpl: 'Vitesse moyenne : {0} km/h', keys: {}, visual: V.ligne({ a: A, b: B, dist: `${dist} km`, dur: V.dureeTxt(tmin), v: '', inconnu: 'v' }),
    html: `Un ${n} parcourt <b>${km(dist)}</b> entre ${A} et ${B} en <b>${dur(tmin)}</b>.<br>Quelle est sa vitesse moyenne ?`,
    check: numsCheck([v], { msg: u => diag(u[0], [[dist / (h + m / 100), `${dur(tmin)} ne s'écrit pas ${M(h + m / 100)} h : convertis les minutes en heures (÷ 60) avant de diviser.`], [dist / tmin, 'Tu as divisé par des minutes : une vitesse en km/h demande une durée en heures.'], [dist * tmin / 60, 'Pour une vitesse, on divise la distance par la durée (v = d ÷ t), on ne multiplie pas.']]) }),
    value: (() => { let s = 0; while (s * (tmin / 60) < dist - 1e-9 && s < 1000) s++; return s; })(),
    hint: `Utilise v = d ÷ t, avec d en km et t en <b>heures</b>.${tmin % 60 ? ' Convertis d\'abord la durée en heures.' : ''}`,
    solution: `${tmin % 60 ? `${dur(tmin)} = ${decimalOK(tmin) ? tH + ' h' : `${tmin} ÷ 60 h`}.<br>` : ''}v = d ÷ t = ${dist} ÷ ${decimalOK(tmin) ? tH : `(${tmin} ÷ 60)`} = ${v} km/h.`,
  };
}
function C7() {
  return `<h2>7. Vitesse moyenne : v = d ÷ t</h2>
<p class="intro">Un train s'arrête, repart, ralentit : sa vitesse change. La <b>vitesse moyenne</b> est la vitesse constante qu'il aurait pour faire le même trajet dans le même temps.</p>
<div class="def"><b>v = d ÷ t</b> : la vitesse moyenne est la distance parcourue divisée par la durée du trajet (en heures).<br>Résultat en <b>km/h</b> : kilomètres parcourus en une heure.</div>
${V.ligne({ a: 'Lyon', b: 'Dijon', dist: '195 km', dur: '1 h 30 min', v: '', inconnu: 'v' })}
<div class="methode"><b>Méthode</b><ol><li>Convertis la durée en heures (1 h 30 min = 1,5 h).</li><li>Divise la distance par la durée.</li><li>Écris l'unité : km/h.</li></ol></div>
${ex('Exemple 1 : 270 km en 3 h', 'v = 270 ÷ 3 = 90 km/h.')}
${ex('Exemple 2 : 195 km en 1 h 30 min', '1 h 30 min = 1,5 h. v = 195 ÷ 1,5 = 130 km/h.')}
<div class="warn">⚠️ 195 ÷ 1,30 est faux : 1 h 30 min = 1,5 h.<br>⚠️ Ne divise pas par les minutes : 195 ÷ 90 donne des km par minute, pas des km/h.</div>
<div class="retenir">À retenir : v = d ÷ t, durée en heures, résultat en km/h.</div>`;
}

function L8(d) {
  const { A, B, n, v, tmin, dist, km: real } = fitTrip(tPool78(d), d < 1);
  META = { n, v, tmin, dist, real };
  const H = hOf(tmin), Mi = mOf(tmin);
  let m2 = 0; while (v * m2 < 60 * dist) m2++; // simulation : minutes écoulées quand la distance est atteinte
  const x = r6(tmin / 60);
  return {
    type: 'nums', tpl: TPL_DUR, keys: {}, visual: V.ligne({ a: A, b: B, dist: `${dist} km`, dur: '', v: `${v} km/h`, inconnu: 'dur' }),
    html: `Un ${n} doit parcourir <b>${km(dist)}</b> ${de(A)} à ${B} à la vitesse moyenne de <b>${kmh(v)}</b>.<br>Combien de temps dure le trajet ?`,
    check: hmCheck(H, Mi, (h, m) => (Mi && h === H && m === Math.round((x - H) * 100) ? `Attention : ${M(x)} h, ce n'est pas ${H} h ${Math.round((x - H) * 100)} min. La partie décimale se multiplie par 60 pour obtenir les minutes.` : '')),
    verify: E => E[0] * 60 + E[1] === m2,
    hint: `Utilise t = d ÷ v : le résultat est en heures. Si le résultat est décimal, convertis la partie décimale en minutes (× 60).`,
    solution: tmin % 60 === 0 ? `t = d ÷ v = ${dist} ÷ ${v} = ${H} h.` : decimalOK(tmin) ? `t = d ÷ v = ${dist} ÷ ${v} = ${M(x)} h.<br>${M(x)} h = ${dur(tmin)}${Mi ? ` (car ${M(r6(x - H))} × 60 = ${Mi})` : ''}.`
      : `t = d ÷ v = ${dist} ÷ ${v} h. En minutes : ${dist} × 60 ÷ ${v} = ${tmin} min = ${dur(tmin)}.`,
  };
}
function C8() {
  return `<h2>8. Durée d'un trajet : t = d ÷ v</h2>
<p class="intro">On connaît la distance et la vitesse du train : combien de temps va durer le voyage ? C'est la troisième écriture de la même relation.</p>
<div class="def"><b>t = d ÷ v</b> : la durée en heures est la distance divisée par la vitesse.<br>d = v × t, v = d ÷ t et t = d ÷ v sont la même égalité.</div>
${V.ligne({ a: 'Metz', b: 'Paris', dist: '330 km', dur: '', v: '220 km/h', inconnu: 'dur' })}
<div class="methode"><b>Méthode</b><ol><li>Calcule t = d ÷ v : c'est un nombre d'heures.</li><li>Garde les heures entières.</li><li>Partie décimale × 60 : ce sont les minutes.</li></ol></div>
${ex('Exemple 1 : 300 km à 100 km/h', 't = 300 ÷ 100 = 3 h. Le trajet dure 3 h.')}
${ex('Exemple 2 : 330 km à 220 km/h', 't = 330 ÷ 220 = 1,5 h. 0,5 h = 30 min. Le trajet dure 1 h 30 min.')}
<div class="warn">⚠️ 1,5 h se lit « 1 h 30 min », pas « 1 h 50 min ».<br>⚠️ Divise bien la distance par la vitesse (et pas l'inverse) : 100 ÷ 300 ne donne pas des heures.</div>
<div class="retenir">À retenir : t = d ÷ v ; la partie décimale se multiplie par 60.</div>`;
}

/* ================= 9. km/h ↔ m/s ================= */
function L9(d) {
  const dir = d < 1 ? 0 : d < 2 ? 1 : pick([0, 1]);
  let vk, vm;
  if (dir === 0) {
    vk = d < 1 ? pick([36, 72, 108, 144, 180]) : d < 3 ? 18 * ri(2, 16) : 9 * ri(4, 33);
    vm = vk * 1000 / 3600;
  } else {
    vm = d < 2 ? pick([10, 15, 20, 25, 30, 40, 50]) : d < 3 ? 5 * ri(2, 16) : ri(5, 83);
    vk = vm * 3600 / 1000;
  }
  vk = r6(vk); vm = r6(vm);
  const nom = vk < 60 ? 'train de marchandises' : vk <= 130 ? 'TER' : vk <= 180 ? 'Intercités' : 'TGV';
  META = { n: nom, v: vk, dir, vk, vm };
  const ans = dir === 0 ? vm : vk, given = dir === 0 ? vk : vm;
  const u1 = dir === 0 ? 'km/h' : 'm/s', u2 = dir === 0 ? 'm/s' : 'km/h';
  const other = dir === 0 ? vk * 3.6 : vm / 3.6;
  return {
    type: 'nums', tpl: `Vitesse : {0} ${u2}`, keys: { comma: true }, visual: V.panneau(M(given), u1),
    html: `Un ${nom} roule à <b>${M(given)} ${u1}</b>.<br>Exprime sa vitesse en <b>${u2}</b>.`,
    check: numsCheck([ans], { msg: u => diag(u[0], [[other, dir === 0 ? 'Tu as multiplié par 3,6 au lieu de diviser : en m/s le nombre est plus petit qu\'en km/h (on va moins « vite » en nombre).' : 'Tu as divisé par 3,6 au lieu de multiplier : en km/h le nombre est plus grand qu\'en m/s.'], [dir === 0 ? vk / 36 : vm * 36, 'Une conversion se fait avec 3,6 (1 m/s = 3,6 km/h), pas avec 36.']]) }),
    value: dir === 0 ? vk * 1000 / 3600 : vm * 3600 / 1000,
    hint: `1 m/s = 3,6 km/h. Pour passer de km/h à m/s, on <b>divise</b> par 3,6 ; pour passer de m/s à km/h, on <b>multiplie</b> par 3,6.`,
    solution: dir === 0 ? `${M(vk)} km/h = ${M(vk)} ÷ 3,6 = ${M(vm)} m/s.<br>Vérification : ${M(vk)} km = ${M(vk * 1000)} m en 3 600 s, et ${M(vk * 1000)} ÷ 3 600 = ${M(vm)}.`
      : `${M(vm)} m/s = ${M(vm)} × 3,6 = ${M(vk)} km/h.<br>Vérification : en 1 h = 3 600 s, le train fait ${M(vm)} × 3 600 = ${M(vm * 3600)} m = ${M(vk)} km.`,
  };
}
function C9() {
  return `<h2>9. km/h et m/s</h2>
<p class="intro">Les trains annoncent leur vitesse en km/h, mais en physique on la mesure en m/s. Il faut savoir passer de l'une à l'autre.</p>
<div class="def"><b>1 m/s = 3,6 km/h</b>.<br>En 1 s, un train à 1 m/s fait 1 m ; en 1 h (3 600 s) il fait 3 600 m = 3,6 km.<br>km/h → m/s : on <b>divise</b> par 3,6. m/s → km/h : on <b>multiplie</b> par 3,6.</div>
${V.conversion()}
${ex('Exemple 1 : 72 km/h en m/s', '72 ÷ 3,6 = 20. Donc 72 km/h = 20 m/s.')}
${ex('Exemple 2 : 25 m/s en km/h', '25 × 3,6 = 90. Donc 25 m/s = 90 km/h.')}
<div class="methode"><b>Pour ne pas se tromper de sens</b><ol><li>Le nombre en km/h est toujours le plus grand des deux.</li><li>Vérifie ton résultat avec cette idée : 20 m/s ≈ 72 km/h, c'est cohérent.</li></ol></div>
<div class="warn">⚠️ Ne confonds pas km/h et m/s : 20 m/s, ce n'est pas 20 km/h.<br>⚠️ On convertit avec 3,6, pas avec 36 ni avec 60.</div>
<div class="retenir">À retenir : km/h ÷ 3,6 = m/s et m/s × 3,6 = km/h.</div>`;
}

/* ================= 10. Graphique horaire ================= */
const VS10 = [80, 120, 160, 200];
const trace = (T0, segs) => { const pts = [[T0, 0]]; let t = T0, y = 0; for (const s of segs) { t += s.dur; y += s.v * s.dur / 60; pts.push([t, y]); } return pts; };
/** position (km) à l'heure t, par interpolation linéaire : lecture du graphique */
const at = (pts, t) => { for (let i = 0; i < pts.length - 1; i++) { const [a, ya] = pts[i], [b, yb] = pts[i + 1]; if (t >= a && t <= b) return ya + (yb - ya) * (t - a) / (b - a); } return NaN; };
/** première heure à laquelle la position vaut y */
const when = (pts, y) => { for (let i = 0; i < pts.length - 1; i++) { const [a, ya] = pts[i], [b, yb] = pts[i + 1]; if (yb > ya && y >= ya && y <= yb) return a + (b - a) * (y - ya) / (yb - ya); } return NaN; };
const graph10 = (lines, T0, marks = []) => {
  const ymax = Math.max(...lines.flatMap(l => l.pts.map(p => p[1]))), tmax = Math.max(...lines.flatMap(l => l.pts.map(p => p[0])));
  return V.graphe({ t0: T0, t1: Math.ceil(tmax / 30) * 30, y1: Math.ceil(ymax / 20) * 20 + 20, step: 20, lines, marks });
};
function L10(d) {
  const kind = d < 1 ? 0 : d < 2 ? pick([0, 1, 1]) : d < 3 ? pick([1, 2, 3, 2]) : pick([2, 3, 4, 5, 4]);
  const T0 = ri(6, 17) * 60 + pick([0, 30]), [A, B] = fict(2);
  if (kind <= 1) {
    const { v, n } = search(() => { const v = pick(VS10), n = ri(2, 5); return v * n / 2 <= 320 ? { v, n } : null; });
    const pts = trace(T0, [{ dur: 30 * n, v }]), D = pts[1][1];
    const line = { pts, c: '#1d4ed8', l: 'train' };
    if (kind === 0) {
      const k = ri(1, n - 1), t = T0 + 30 * k, y = at(pts, t);
      return { type: 'nums', tpl: 'Distance : {0} km', keys: {}, visual: graph10([line], T0), afterVisual: graph10([line], T0, [{ t, y, lt: hm(t).replace(/&nbsp;/g, ' '), ly: `${y} km` }]), replaceVisual: true,
        html: `Ce graphique donne la distance parcourue par un train depuis ${A} en fonction de l'heure.<br>Quelle distance le train a-t-il parcourue à <b>${hm(t)}</b> ?`,
        check: numsCheck([y], { msg: u => (u[0] === t / 60 ? 'Tu as lu l\'heure sur l\'axe horizontal. La distance se lit sur l\'axe vertical.' : '') }), value: at(pts, t),
        hint: `Place-toi sur l'axe horizontal à l'heure demandée, monte jusqu'à la courbe, puis va vers la gauche pour lire la distance sur l'axe vertical.`,
        solution: `À ${hm(t)}, la courbe est à la hauteur ${y} km sur l'axe vertical.` };
    }
    if (chance(0.5)) {
      const k = ri(1, n - 1), y = v * k / 2, t = when(pts, y);
      return { type: 'nums', tpl: 'À {0} h {1}', keys: {}, visual: graph10([line], T0), afterVisual: graph10([line], T0, [{ t, y, lt: hm(t).replace(/&nbsp;/g, ' '), ly: `${y} km` }]), replaceVisual: true,
        html: `Le graphique montre le trajet d'un train depuis ${A}.<br>À quelle heure le train se trouve-t-il à <b>${km(y)}</b> ${de(A)} ?`,
        check: numsCheck([hOf(t), mOf(t)], { msg: u => (u[1] > 59 ? MSG60 : u[0] === y ? 'Tu as lu la distance. On demande l\'heure : elle se lit sur l\'axe horizontal.' : '') }),
        verify: E => Math.abs(at(pts, E[0] * 60 + E[1]) - y) < 1e-9,
        hint: `Place-toi sur l'axe vertical à la distance demandée, va vers la droite jusqu'à la courbe, puis descends lire l'heure sur l'axe horizontal.`,
        solution: `À ${y} km, la courbe est au-dessus de ${hm(t)} : le train y est à ${hm(t)}.` };
    }
    const Dm = 30 * n;
    return { type: 'nums', tpl: TPL_DUR, keys: {}, visual: graph10([line], T0), afterVisual: graph10([line], T0, [{ t: T0 + Dm, y: D, lt: hm(T0 + Dm).replace(/&nbsp;/g, ' '), ly: `${D} km` }]), replaceVisual: true,
      html: `Le graphique montre le trajet d'un train ${de(A)} à ${B}.<br>Combien de temps dure le trajet ?`,
      check: hmCheck(hOf(Dm), mOf(Dm)),
      verify: E => E[0] * 60 + E[1] === pts[1][0] - pts[0][0],
      hint: `Le train part quand la courbe quitte l'axe, et arrive quand elle s'arrête. Lis ces deux heures sur l'axe horizontal, puis calcule l'écart.`,
      solution: `Départ à ${hm(T0)}, arrivée à ${hm(T0 + Dm)}. Durée : ${dur(Dm)}.` };
  }
  if (kind === 2 || kind === 3) {
    const s = search(() => {
      const v1 = pick(VS10), v2 = pick(VS10), d1 = 30 * ri(2, 4), st = 30 * ri(1, 2), d2 = 30 * ri(2, 3);
      return v1 * d1 / 60 + v2 * d2 / 60 <= 320 ? { v1, v2, d1, st, d2 } : null;
    });
    const pts = trace(T0, [{ dur: s.d1, v: s.v1 }, { dur: s.st, v: 0 }, { dur: s.d2, v: s.v2 }]), line = { pts, c: '#1d4ed8', l: 'train' };
    const vis = graph10([line], T0);
    if (kind === 2) {
      return { type: 'nums', tpl: TPL_DUR, keys: {}, visual: vis,
        html: `Le graphique montre le trajet d'un train ${de(A)} à ${B}, avec un arrêt en route.<br>Combien de temps dure l'arrêt ?`,
        check: hmCheck(hOf(s.st), mOf(s.st), (h, m) => (h * 60 + m === s.d1 || h * 60 + m === s.d2 ? 'Tu as lu la durée d\'un morceau de trajet. L\'arrêt, c\'est le morceau <b>horizontal</b> de la courbe : la distance ne change pas.' : '')),
        verify: E => E[0] * 60 + E[1] === pts[2][0] - pts[1][0] && pts[2][1] === pts[1][1],
        hint: `Pendant l'arrêt, la distance ne change pas : la courbe est horizontale. Lis l'heure où commence ce morceau horizontal et l'heure où il finit.`,
        solution: `Le morceau horizontal va de ${hm(pts[1][0])} à ${hm(pts[2][0])} : l'arrêt dure ${dur(s.st)}.` };
    }
    const first = chance(0.5), vv = first ? s.v1 : s.v2, [ta, tb] = first ? [pts[0], pts[1]] : [pts[2], pts[3]];
    const moy = pts[3][1] / ((pts[3][0] - T0) / 60);
    META = { kind: 3, moy, vv };
    return { type: 'nums', tpl: 'Vitesse : {0} km/h', keys: {}, visual: vis,
      html: `Le graphique montre le trajet d'un train ${de(A)} à ${B}, avec un arrêt.<br>Quelle est la vitesse du train ${first ? 'entre le départ et l\'arrêt' : 'après l\'arrêt, jusqu\'à l\'arrivée'} ?`,
      check: numsCheck([vv], { msg: u => (Math.abs(u[0] - moy) < 1e-6 ? 'Tu as calculé la vitesse moyenne de tout le trajet, arrêt compris. Ici, on demande la vitesse sur un seul morceau.' : u[0] === tb[1] - ta[1] ? 'Tu as donné la distance parcourue. Pour la vitesse, divise-la par la durée (en heures).' : '') }),
      value: (tb[1] - ta[1]) / ((tb[0] - ta[0]) / 60),
      hint: `Lis sur le graphique la distance parcourue et la durée de ce morceau, puis calcule v = d ÷ t (durée en heures).`,
      solution: `Sur ce morceau, le train va de ${ta[1]} km à ${tb[1]} km, soit ${tb[1] - ta[1]} km, entre ${hm(ta[0])} et ${hm(tb[0])}, soit ${dur(tb[0] - ta[0])}.<br>v = ${tb[1] - ta[1]} ÷ ${M((tb[0] - ta[0]) / 60)} = ${vv} km/h.` };
  }
  // deux trains qui roulent l'un vers l'autre
  const s = search(() => {
    const v1 = pick([80, 120, 160]), v2 = pick([80, 120, 160]), k = ri(2, 4), Dk = (v1 + v2) * k / 2;
    return v1 !== v2 && Dk <= 320 ? { v1, v2, k, Dk } : null;
  });
  const tc = T0 + 30 * s.k, kc = s.v1 * s.k / 2, D = s.Dk;
  const p1 = [[T0, 0], [T0 + 60 * D / s.v1, D]], p2 = [[T0, D], [T0 + 60 * D / s.v2, 0]];
  const l1 = { pts: p1, c: '#1d4ed8', l: 'train 1', side: -1 }, l2 = { pts: p2, c: '#2b8a3e', l: 'train 2', side: 1 };
  const vis = graph10([l1, l2], T0), after = graph10([l1, l2], T0, [{ t: tc, y: kc, lt: hm(tc).replace(/&nbsp;/g, ' '), ly: `${kc} km` }]);
  const crossOK = (E, isTime) => { // balayage minute par minute : les deux positions sont égales à la rencontre
    for (let t = T0; t <= T0 + 600; t++) if (Math.abs(at(p1, t) - at(p2, t)) < 1e-9) return isTime ? E[0] * 60 + E[1] === t : Math.abs(at(p1, t) - E[0]) < 1e-9;
    return false;
  };
  if (kind === 4) {
    return { type: 'nums', tpl: 'Ils se croisent à {0} h {1}', keys: {}, visual: vis, afterVisual: after, replaceVisual: true,
      html: `Le train 1 part ${de(A)} et le train 2 part ${de(B)}, en même temps, l'un vers l'autre. Le graphique montre leurs trajets.<br>À quelle heure se croisent-ils ?`,
      check: numsCheck([hOf(tc), mOf(tc)], { msg: u => (u[1] > 59 ? MSG60 : '') }), verify: E => crossOK(E, true),
      hint: `Les trains se croisent là où les deux courbes se coupent : ils sont alors à la même distance ${de(A)} au même moment. Lis l'heure de ce point sur l'axe horizontal.`,
      solution: `Les courbes se coupent au-dessus de ${hm(tc)} : les trains se croisent à ${hm(tc)}.` };
  }
  return { type: 'nums', tpl: `À {0} km ${de(A)}`, keys: {}, visual: vis, afterVisual: after, replaceVisual: true,
    html: `Le train 1 part ${de(A)} et le train 2 part ${de(B)}, en même temps, l'un vers l'autre. Le graphique montre leurs trajets.<br>À quelle distance ${de(A)} se croisent-ils ?`,
    check: numsCheck([kc], { msg: u => (u[0] === D - kc ? `Tu as lu la distance depuis ${B}. On demande la distance depuis ${A} (l'axe vertical part ${de(A)}).` : '') }), verify: E => crossOK(E, false),
    hint: `Repère le point où les deux courbes se coupent, puis lis sa hauteur sur l'axe vertical : c'est la distance depuis ${A}.`,
    solution: `Le point d'intersection est à la hauteur ${kc} km : les trains se croisent à ${kc} km ${de(A)}.` };
}
function C10() {
  const pts = trace(8 * 60, [{ dur: 60, v: 80 }, { dur: 30, v: 0 }, { dur: 60, v: 120 }]);
  const g = V.graphe({ t0: 480, t1: 600, y1: 220, step: 20, lines: [{ pts, c: '#1d4ed8', l: 'train' }], marks: [{ t: 540, y: 80, lt: '9 h', ly: '80 km' }] });
  return `<h2>10. Lire un graphique horaire</h2>
<p class="intro">Un <b>graphique horaire</b> montre où se trouve un train à chaque instant : l'heure est en abscisse (axe horizontal), la distance parcourue depuis le départ est en ordonnée (axe vertical).</p>
<div class="def">• Plus la courbe est <b>raide</b>, plus le train est <b>rapide</b>.<br>• Un morceau <b>horizontal</b> : la distance ne change pas, le train est <b>arrêté</b>.<br>• Le point où deux courbes se <b>coupent</b> : les deux trains sont au même endroit au même moment (ils se croisent ou se rattrapent).</div>
${g}
<div class="methode"><b>Méthode</b><ol><li>Pour une distance à une heure donnée : horizontal → courbe → vertical.</li><li>Pour une heure à une distance donnée : vertical → courbe → horizontal.</li><li>Vitesse d'un morceau : v = (distance parcourue) ÷ (durée en heures).</li></ol></div>
${ex('Exemple 1 : à 9 h', 'On monte depuis 9 h jusqu\'à la courbe : 80 km. À 9 h, le train est à 80 km du départ.')}
${ex('Exemple 2 : l\'arrêt', 'Le morceau horizontal va de 9 h à 9 h 30 : l\'arrêt dure 30 min.')}
<div class="warn">⚠️ Ne confonds pas les axes : l'heure est en bas, la distance sur le côté.<br>⚠️ Un morceau horizontal ne veut pas dire « le train roule vite » : il est arrêté.</div>
<div class="retenir">À retenir : courbe raide = train rapide ; morceau horizontal = arrêt ; intersection = même lieu, même heure.</div>`;
}

/* ================= 11. Croisement de deux trains ================= */
const MSGPLACE = (B, A) => `La durée est juste, mais cette distance se compte depuis ${B}. On demande la distance depuis ${A}.`;
function L11(d) {
  const s = search(() => {
    const p = pick(PAIRS), n = pick(typesFor(p.km)), [lo, hi] = RANGES[n];
    const tmin = d < 1 ? 60 * ri(1, 3) : d < 2 ? 30 * ri(2, 6) : d < 3 ? 15 * ri(3, 12) : 5 * ri(6, 36);
    const v1 = 10 * ri(Math.ceil(lo / 10), Math.floor(hi / 10)), v2 = 10 * ri(Math.ceil(lo / 10), Math.floor(hi / 10));
    const D = (v1 + v2) * tmin / 60, pp = v1 * tmin / 60, sw = chance(0.5);
    return v1 !== v2 && Number.isInteger(D) && Number.isInteger(pp) && Math.abs(D - p.km) <= 0.08 * p.km ? { tmin, v1, v2, D, p: pp, n, A: sw ? p.B : p.A, B: sw ? p.A : p.B, real: p.km } : null;
  }, 300000);
  const { tmin, v1, v2, D, p, A, B, n } = s, clock = d >= 2, T0 = clock ? ri(6, 18) * 60 + 5 * ri(0, 11) : 0;
  META = { n, v1, v2, D, real: s.real, tmin, T0, clock, p };
  const sameTime = clock ? ` à <b>${hm(T0)}</b>` : ' en même temps';
  const html = `Un ${n} part ${de(A)} vers ${B} à <b>${kmh(v1)}</b>. Au même moment, un autre ${n} part ${de(B)} vers ${A} à <b>${kmh(v2)}</b>. ${A} et ${B} sont distantes de <b>${km(D)}</b>.<br>Les deux trains partent${sameTime}${clock ? '' : ' et roulent à vitesse constante'}.`;
  const tEnd = T0 + tmin;
  const E = d < 1 ? [hOf(tmin), mOf(tmin)] : clock ? [hOf(tEnd), mOf(tEnd), p] : [hOf(tmin), mOf(tmin), p];
  const msg = u => {
    if (u[1] > 59) return MSG60;
    const tu = u[0] * 60 + u[1] - T0;
    return diag(tu, [[60 * D / v1, 'Tu n\'as utilisé que le train 1. Les deux trains avancent l\'un vers l\'autre : leurs vitesses s\'ajoutent.'], [60 * D / v2, 'Tu n\'as utilisé que le train 2. Les deux trains avancent l\'un vers l\'autre : leurs vitesses s\'ajoutent.'], [60 * D / Math.abs(v1 - v2), 'Les trains roulent l\'un vers l\'autre : on additionne leurs vitesses (v₁ + v₂), on ne les soustrait pas.']])
      || (tu === tmin && u.length > 2 && Math.abs(u[2] - v2 * tmin / 60) < 1e-9 ? MSGPLACE(B, A) : '');
  };
  const p1 = [[T0, 0], [T0 + 60 * D / v1, D]], p2 = [[T0, D], [T0 + 60 * D / v2, 0]];
  const l1 = { pts: p1, c: '#1d4ed8', l: 'train 1', side: -1 }, l2 = { pts: p2, c: '#2b8a3e', l: 'train 2', side: 1 };
  const t0g = clock ? Math.floor(T0 / 30) * 30 : 0, tmaxg = Math.ceil(Math.max(p1[1][0], p2[1][0]) / 30) * 30, ymaxg = Math.ceil(D / 50) * 50;
  const after = V.graphe({ t0: t0g, t1: tmaxg, y1: D <= 200 ? Math.ceil(D / 20) * 20 : ymaxg, step: D <= 200 ? 20 : 50, lines: [l1, l2], marks: [{ t: tEnd, y: p, lt: clock ? hm(tEnd).replace(/&nbsp;/g, ' ') : `${V.dureeTxt(tmin)} après`, ly: `${p} km` }] });
  const sim = () => { for (let t = 0; t <= 2000; t++) { if (v1 * t / 60 >= D - v2 * t / 60 - 1e-9) return { t, pos: v1 * t / 60 }; } return null; };
  const verify = e => { const r = sim(); if (!r) return false; const tt = clock ? e[0] * 60 + e[1] - T0 : e[0] * 60 + e[1]; return tt === r.t && (e.length < 3 || Math.abs(e[2] - r.pos) < 1e-9); };
  const sol = `Les trains se rapprochent de ${v1} + ${v2} = ${v1 + v2} km/h.<br>Durée avant la rencontre : ${D} ÷ ${v1 + v2} = ${asH(tmin)}.${clock ? `<br>Heure : ${hm(T0)} + ${dur(tmin)} = ${hm(tEnd)}.` : ''}`
    + (d >= 1 ? `<br>Distance depuis ${A} : ${prod(v1, tmin)} = ${p} km (le train 1 a roulé pendant ${dur(tmin)}).` : '');
  const hint = `Les deux trains se rapprochent l'un de l'autre : chaque heure, la distance qui les sépare diminue de v₁ + v₂. Durée = distance ÷ (v₁ + v₂). La distance depuis ${A} se calcule avec le train 1 seulement.`;
  const base = { html, visual: V.deuxTrains({ mode: 'croise', a: A, b: B, D: `${D} km`, v1: `${v1} km/h`, v2: `${v2} km/h` }), keys: {}, afterVisual: after, check: numsCheck(E, { msg }), verify, hint, solution: sol };
  if (d < 1) return { ...base, type: 'nums', tpl: 'Ils se croisent au bout de {0} h {1} min', html: html + '<br>Au bout de combien de temps se croisent-ils ?' };
  const steps = (l1t) => ({ ...base, type: 'steps', labels: ['heures', 'minutes', 'kilomètres'],
    tpl: `<div class="stepline">${l1t}</div><div class="stepline">Distance depuis ${A} : {2} km</div>` });
  if (!clock) return { ...steps('Durée avant la rencontre : {0} h {1} min'), html: html + '<br>Combien de temps après le départ se croisent-ils, et à quelle distance de ' + A + ' ?' };
  return { ...steps('Heure de la rencontre : {0} h {1}'), html: html + `<br>À quelle heure se croisent-ils, et à quelle distance ${de(A)} ?` };
}
function C11() {
  const g = V.graphe({ t0: 480, t1: 720, y1: 300, step: 50, lines: [{ pts: [[480, 0], [630, 300]], c: '#1d4ed8', l: 'train 1', side: -1 }, { pts: [[480, 300], [705, 0]], c: '#2b8a3e', l: 'train 2', side: 1 }], marks: [{ t: 570, y: 180, lt: '9 h 30', ly: '180 km' }] });
  return `<h2>11. Croisement de deux trains</h2>
<p class="intro">Deux trains partent en même temps de deux gares et roulent l'un vers l'autre. À quel moment et à quel endroit se croisent-ils ?</p>
<div class="def">Les trains <b>se rapprochent</b> : chaque heure, la distance qui les sépare diminue de <b>v₁ + v₂</b> (leurs vitesses s'ajoutent).<br><b>Durée avant la rencontre = distance entre les gares ÷ (v₁ + v₂)</b>.<br>Le lieu se trouve avec un seul train : d = v × t.</div>
${V.deuxTrains({ mode: 'croise', a: 'A', b: 'B', D: '300 km', v1: '120 km/h', v2: '80 km/h' })}
<div class="methode"><b>Méthode</b><ol><li>Additionne les vitesses : v₁ + v₂.</li><li>Calcule t = D ÷ (v₁ + v₂), puis convertis en h et min.</li><li>Distance depuis A : v₁ × t. Heure : départ + t.</li></ol></div>
${ex('Exemple : A et B à 300 km, trains à 120 km/h et 80 km/h, départ 8 h', 'v₁ + v₂ = 200 km/h. t = 300 ÷ 200 = 1,5 h = 1 h 30 min : rencontre à 9 h 30. Distance depuis A : 120 × 1,5 = 180 km (et 80 × 1,5 = 120 km depuis B : 180 + 120 = 300 km ✔).')}
${g}
${ex('Sur le graphique horaire', 'Les deux courbes se coupent au point (1 h 30 ; 180 km) : c\'est la rencontre. (Ici le train 2 a été tracé avec une vitesse de 100 km/h pour la lisibilité.)')}
<div class="warn">⚠️ Les vitesses <b>s'ajoutent</b> quand les trains vont l'un vers l'autre : on ne les soustrait pas.<br>⚠️ Le lieu se calcule depuis la gare du train choisi : v₁ × t depuis A, v₂ × t depuis B. La somme des deux fait la distance totale.</div>
<div class="retenir">À retenir : t = D ÷ (v₁ + v₂), puis d = v₁ × t depuis A.</div>`;
}

/* ================= 12. Rattrapage ================= */
function L12(d) {
  const s = search(() => {
    const v1 = pick(range(60, 120, 10)), v2 = pick([120, 130, 140, 150, 160, 180, 200, 250, 300]), dl = d < 1 ? 60 * ri(1, 2) : d < 2 ? 30 * ri(1, 4) : d < 3 ? 15 * ri(1, 8) : 5 * ri(3, 24);
    if (v2 < v1 + 20) return null;
    const g = v1 * dl / 60, tmin = 60 * g / (v2 - v1), p = v2 * tmin / 60;
    return Number.isInteger(g) && Number.isInteger(tmin) && Number.isInteger(p) && tmin >= 20 && tmin <= 360 && p <= 900 ? { v1, v2, dl, g, tmin, p } : null;
  });
  const { v1, v2, dl, g, tmin, p } = s;
  META = { v1, v2, dl, g, tmin, p, fictif: true };
  const [A] = fict(1), T1 = ri(6, 16) * 60 + 5 * ri(0, 11), T2 = T1 + dl, tc = T2 + tmin, clock = d >= 3;
  Object.assign(META, { T2, clock });
  const p1 = [[T1, 0], [tc + 30, v1 * (tc + 30 - T1) / 60]], p2 = [[T2, 0], [tc + 30, v2 * (tc + 30 - T2) / 60]];
  const ymax = p2[1][1], stp = [10, 20, 25, 50, 100, 200, 250].find(k => ymax / k <= 10) || 500;
  const after = V.graphe({ t0: Math.floor(T1 / 30) * 30, t1: Math.ceil((tc + 30) / 30) * 30, y1: Math.ceil(ymax / stp) * stp, step: stp, lines: [{ pts: p1, c: '#1d4ed8', l: 'train 1', side: -1 }, { pts: p2, c: '#2b8a3e', l: 'train 2', side: 1 }], marks: [{ t: tc, y: p, lt: hm(tc).replace(/&nbsp;/g, ' '), ly: `${p} km` }] });
  const info = `Le train 1 (vitesse constante ${kmh(v1)}) part ${de(A)} à <b>${hm(T1)}</b>. Le train 2, plus rapide (${kmh(v2)}), part ${de(A)} <b>${dur(dl)}</b> plus tard, à <b>${hm(T2)}</b>, sur la même voie et dans le même sens.`;
  const visual = V.deuxTrains({ mode: 'rattrape', a: A, v1: `${v1} km/h`, v2: `${v2} km/h`, h1: hm(T1).replace(/&nbsp;/g, ' '), h2: hm(T2).replace(/&nbsp;/g, ' ') });
  const sim = () => { for (let t = T2; t <= T2 + 3000; t++) { const a1 = v1 * (t - T1) / 60, a2 = v2 * (t - T2) / 60; if (a2 >= a1 - 1e-9) return { t, pos: a2 }; } return null; };
  const base = { html: info, visual, keys: {}, afterVisual: after };
  if (d < 1) {
    let acc = 0; for (let i = 0; i < dl; i++) acc += v1 / 60;
    return { ...base, type: 'nums', tpl: 'Avance : {0} km', html: info + `<br>Quand le train 2 démarre, de combien de kilomètres le train 1 est-il déjà en avance ?`, visual,
      afterVisual: undefined,
      check: numsCheck([g], { msg: u => diag(u[0], [[v1 * dl, 'Tu as multiplié par des minutes : la vitesse est en km/h, il faut une durée en heures.']]) }), value: acc,
      hint: `Pendant ${dur(dl)}, seul le train 1 roule : son avance est la distance qu'il a parcourue. Utilise d = v × t avec t en heures.`,
      solution: `Le train 1 roule pendant ${dur(dl)} avant le départ du train 2.<br>Avance : ${prod(v1, dl)} = ${g} km.` };
  }
  const msg = u => {
    if (u[1] > 59) return MSG60;
    const tu = u[0] * 60 + u[1] - (clock ? T2 : 0);
    return diag(tu, [[60 * g / v2, 'Le train 1 ne reste pas arrêté : il continue de rouler pendant que le train 2 le poursuit. Divise l\'avance par la <b>différence</b> des vitesses.'], [60 * g / (v1 + v2), 'Les deux trains vont dans le même sens : on <b>soustrait</b> les vitesses (v₂ − v₁), on ne les additionne pas.'], [tmin + dl, 'Tu as compté depuis le départ du train 1. On demande la durée depuis le départ du train 2.']])
      || (Math.abs(tu - tmin) < 0.5 && u.length > 2 && u[2] === g ? 'La durée est juste. Mais l\'avance n\'est pas la distance depuis ' + A + ' : calcule v₂ × t.' : '');
  };
  const verify = e => { const r = sim(); if (!r) return false; const tt = clock ? e[0] * 60 + e[1] - T2 : e[0] * 60 + e[1]; return tt === r.t - T2 && (e.length < 3 || Math.abs(e[2] - r.pos) < 1e-9); };
  const sol = `Avance du train 1 au départ du train 2 : ${prod(v1, dl)} = ${g} km.<br>Le train 2 gagne ${v2} − ${v1} = ${v2 - v1} km chaque heure.<br>Durée du rattrapage : ${g} ÷ ${v2 - v1} = ${asH(tmin)}.`
    + (d >= 2 ? `<br>Distance depuis ${A} : ${prod(v2, tmin)} = ${p} km.` : '') + (clock ? `<br>Heure : ${hm(T2)} + ${dur(tmin)} = ${hm(tc)}.` : '');
  const hint = `Quand le train 2 démarre, le train 1 a de l'avance. À chaque heure, le train 2 gagne v₂ − v₁ sur lui (les vitesses se soustraient). Durée du rattrapage = avance ÷ (v₂ − v₁).`;
  const hmK = { ...base, hint, solution: sol, verify };
  if (d < 2) return { ...hmK, type: 'nums', tpl: 'Après {0} h {1} min', check: numsCheck([hOf(tmin), mOf(tmin)], { msg }), html: info + '<br>Combien de temps après son départ le train 2 rattrape-t-il le train 1 ?' };
  const E = clock ? [hOf(tc), mOf(tc), p] : [hOf(tmin), mOf(tmin), p];
  return { ...hmK, type: 'steps', labels: ['heures', 'minutes', 'kilomètres'], check: numsCheck(E, { msg }),
    tpl: `<div class="stepline">${clock ? 'Heure du rattrapage : {0} h {1}' : 'Durée après le départ du train 2 : {0} h {1} min'}</div><div class="stepline">Distance depuis ${A} : {2} km</div>`,
    html: info + (clock ? `<br>À quelle heure le train 2 rattrape-t-il le train 1, et à quelle distance ${de(A)} ?` : `<br>Combien de temps après son départ le train 2 rattrape-t-il le train 1, et à quelle distance ${de(A)} ?`) };
}
function C12() {
  const g = V.graphe({ t0: 480, t1: 660, y1: 300, step: 50, lines: [{ pts: [[480, 0], [660, 180]], c: '#1d4ed8', l: 'train 1', side: -1 }, { pts: [[540, 0], [660, 240]], c: '#2b8a3e', l: 'train 2', side: 1 }], marks: [{ t: 600, y: 120, lt: '10 h', ly: '120 km' }] });
  return `<h2>12. Rattrapage</h2>
<p class="intro">Un train lent part le premier. Un train plus rapide part ensuite, sur la même voie et dans le même sens : va-t-il rattraper le premier, et où ?</p>
<div class="def">Quand le train rapide démarre, le train lent a une <b>avance</b> : <b>avance = v₁ × (retard au départ)</b>.<br>Ensuite le train rapide gagne <b>v₂ − v₁</b> km chaque heure (les vitesses se soustraient, car ils vont dans le même sens).<br><b>durée du rattrapage = avance ÷ (v₂ − v₁)</b>.</div>
${V.deuxTrains({ mode: 'rattrape', a: 'A', v1: '60 km/h', v2: '120 km/h', h1: '8 h 00', h2: '9 h 00' })}
<div class="methode"><b>Méthode</b><ol><li>Avance du train 1 = v₁ × retard (en heures).</li><li>Durée du rattrapage = avance ÷ (v₂ − v₁), à compter depuis le départ du train 2.</li><li>Lieu : v₂ × durée. Heure : départ du train 2 + durée.</li></ol></div>
${ex('Exemple : train 1 à 60 km/h parti à 8 h, train 2 à 120 km/h parti à 9 h', 'Avance : 60 × 1 = 60 km. Gain : 120 − 60 = 60 km/h. Durée : 60 ÷ 60 = 1 h après 9 h, soit à 10 h. Lieu : 120 × 1 = 120 km de A.')}
${g}
${ex('Sur le graphique horaire', 'La courbe du train 2 part plus tard mais est plus raide : elle coupe celle du train 1 en un seul point, le rattrapage.  Ici : rattrapage à 10 h, à 120 km de A.')}
<div class="warn">⚠️ Même sens : on <b>soustrait</b> les vitesses (on les additionne quand les trains vont l'un vers l'autre).<br>⚠️ Compte la durée du rattrapage depuis le départ du <b>train 2</b>, pas depuis celui du train 1.</div>
<div class="retenir">À retenir : avance = v₁ × retard ; durée = avance ÷ (v₂ − v₁).</div>`;
}

/** appelle le générateur et joint les données de plausibilité (q.meta) ; villes imaginaires signalées */
const w = f => d => {
  META = {};
  const q = f(d);
  if (f === L10 || f === L12) { q.html += '<br><i class="small">(Villes imaginaires.)</i>'; META.fictif = true; }
  q.meta = META;
  return q;
};
export const LEVELS = [
  { titre: 'Durée dans la même heure', generate: w(L1), cours: C1, classe: '6e' },
  { titre: 'Durée qui passe l\'heure', generate: w(L2), cours: C2, classe: '6e' },
  { titre: 'Horaire d\'arrivée', generate: w(L3), cours: C3, classe: '6e' },
  { titre: 'Lire une fiche horaire', generate: w(L4), cours: C4, classe: '5e' },
  { titre: 'Heures, minutes et durées décimales', generate: w(L5), cours: C5, classe: '5e' },
  { titre: 'Distance parcourue : d = v × t', generate: w(L6), cours: C6, classe: '5e' },
  { titre: 'Vitesse moyenne : v = d ÷ t', generate: w(L7), cours: C7, classe: '4e' },
  { titre: 'Durée d\'un trajet : t = d ÷ v', generate: w(L8), cours: C8, classe: '4e' },
  { titre: 'km/h et m/s', generate: w(L9), cours: C9, classe: '4e' },
  { titre: 'Lire un graphique horaire', generate: w(L10), cours: C10, classe: '4e – 3e' },
  { titre: 'Croisement de deux trains', generate: w(L11), cours: C11, classe: '3e' },
  { titre: 'Rattrapage', generate: w(L12), cours: C12, classe: '3e' },
];

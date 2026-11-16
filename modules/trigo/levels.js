// Trigonométrie (1re spécialité) : 12 niveaux, des radians aux fonctions cosinus et sinus.
// Les angles remarquables sont codés en DOUZIÈMES de π (K = 4 ↔ π/3, K = 9 ↔ 3π/4…) : les réponses
// attendues sont obtenues par les symétries du cercle (tables, raisonnements par cas), et les
// vérifications indépendantes (verify / value) recalculent tout en flottants avec Math.cos, Math.sin,
// Math.atan2, ou par force brute sur les multiples de π/12 et par échantillonnage.
// Saisie d'un réel en π : gabarit « □ π / □ » (deux cases au pavé : le nombre devant π et le dénominateur).
import { ri, pick, shuffle, chance } from '../../engine/util/rand.js';
import { numsCheck, choiceCheck } from '../../engine/answers/checks.js';
import { M, F, R } from '../../engine/util/fmt.js';
import { gcd, red, r6 } from '../../engine/util/arith.js';
import { cercle, courbe, piT, COL } from './draw.js';

/* ================= outils ================= */
const PI = Math.PI;
const near = (a, b, e = 1e-9) => a !== null && b !== null && Math.abs(a - b) <= e;
const md = k => ((k % 24) + 24) % 24;
/** positions remarquables du cercle, en douzièmes de π, dans [0 ; 24[ */
const REM = [...Array(24).keys()].filter(k => [0, 2, 3, 4].includes(k % 6));
const rad = K => K * PI / 12;
/** p π / q en HTML (fraction empilée) */
const pfr = (p, q) => {
  if (p === 0) return '0';
  const s = p < 0 ? '−' : '', a = Math.abs(p), n = `${a === 1 ? '' : a}π`;
  return s + (q === 1 ? n : F(n, q));
};
/** angle K π/12 en HTML et en texte */
const A = K => pfr(...red(K, 12));
const At = K => piT(...red(K, 12));
const H2 = F('π', 2);
/** « 3π », « π », « −π » (numérateur d'une fraction) */
const nπ = n => (n === 1 ? 'π' : n === -1 ? '−π' : M(n) + 'π');
const fq = (n, q) => (q === 1 ? nπ(n) : F(nπ(n), q));
/** k douzièmes de π décrits en quarts de tour (0 ≤ k < 24) */
function quarts(k) {
  const q = Math.floor(k / 6), r = k % 6, fr = { 2: 'un tiers de quart', 3: 'un demi-quart', 4: 'deux tiers de quart' }[r];
  return `${q ? `${q} quart${q > 1 ? 's' : ''} de tour` : ''}${q && r ? ' et ' : ''}${r ? fr + ' de tour' : ''}`;
}

/** gabarit « lab = □ π / □ » */
const PIT = lab => `<span>${lab} =</span><div class="ansfrac"><div style="display:flex;align-items:center;gap:6px">{0}<b style="font-size:1.25em">π</b></div><div class="fbar"></div>{1}</div>`;
const PINOTE = '<br><span class="note">Réponse sous la forme <b>(nombre) π / (nombre)</b>. Exemples : π s\'écrit 1 π / 1 ; −π/2 s\'écrit −1 π / 2.</span>';
/** check d'un réel p π / q : accepte toute écriture égale ; o.msg(r) reçoit r = n / d (en « nombre de π ») */
function piCheck(P, Q, o = {}) {
  const [rp, rq] = red(P, Q);
  const fn = v => {
    const [n, d] = v;
    if (n === null || d === null || n === undefined || d === undefined) return { ok: false };
    if (d === 0) return { ok: false, bad: [1], msg: 'Le dénominateur ne peut pas être 0.' };
    if (!Number.isInteger(n) || !Number.isInteger(d)) return { ok: false, msg: 'Écris des nombres entiers : en haut le nombre devant π, en bas le dénominateur.' };
    if (n * Q === P * d) return gcd(n, d) > 1 || d < 0 ? { ok: true, msg: `Juste ! Écriture simplifiée : ${pfr(rp, rq)}.` } : { ok: true };
    return { ok: false, msg: o.msg ? o.msg(n / d) || '' : '' };
  };
  fn.expected = [rp, rq];
  return fn;
}
/** encarts du cours : exemple corrigé, méthode (étapes), à retenir */
const exq = (q, t) => `<div class="ex"><span class="q">${q}</span><br>${t}</div>`;
const meth = steps => `<div class="methode"><b>Méthode</b><ol>${steps.map(s => `<li>${s}</li>`).join('')}</ol></div>`;
const nw = s => `<span style="white-space:nowrap">${s}</span>`;
const ret = t => `<div class="retenir">À retenir : ${t}</div>`;
/** check « une case » avec message ciblé */
const chk = (E, msg) => numsCheck([E], { msg: v => (v[0] === null ? '' : msg ? msg(v[0]) || '' : '') });

/* ---------- valeurs remarquables (clés) ---------- */
// '0', '1', 'h' = 1/2, 'r2' = √2/2, 'r3' = √3/2 ; préfixe 'm' = opposé
const QV = { 0: '1', 2: 'r3', 3: 'r2', 4: 'h', 6: '0' };      // cos sur [0 ; π/2]
const neg = k => (k === '0' ? '0' : k[0] === 'm' ? k.slice(1) : 'm' + k);
/** cos(Kπ/12) exact, par les symétries : cos(−x) = cos x, cos(π − x) = −cos x */
function cosKey(K) {
  let k = md(K); if (k > 12) k = 24 - k;
  return k <= 6 ? QV[k] : neg(QV[12 - k]);
}
/** sin x = cos(π/2 − x) */
const sinKey = K => cosKey(6 - K);
const KEYF = { cos: cosKey, sin: sinKey };
const VAL = { 0: 0, 1: 1, h: 0.5, r2: Math.SQRT2 / 2, r3: Math.sqrt(3) / 2 };
const val = k => (k[0] === 'm' ? -VAL[k.slice(1)] : VAL[k]);
const LABK = { 0: '0', 1: '1', h: F(1, 2), r2: F(R(2), 2), r3: F(R(3), 2) };
const lab = k => (k[0] === 'm' ? '−' + LABK[k.slice(1)] : LABK[k]);
const TXTK = { 0: '0', 1: '1', h: '1/2', r2: '√2/2', r3: '√3/2' };
const txt = k => (k[0] === 'm' ? '−' + TXTK[k.slice(1)] : TXTK[k]);
/** échange 1/2 ↔ √3/2 (confusion π/6 – π/3) */
const conj = k => ({ h: 'r3', r3: 'h', mh: 'mr3', mr3: 'mh' }[k] || null);
/** arccos en douzièmes (dans [0 ; 12]) et arcsin (dans [−6 ; 6]), lus dans la table */
const acosK = k => [...Array(13).keys()].find(K => [0, 2, 3, 4].includes(K % 6) && cosKey(K) === k);
const asinK = k => [...Array(13).keys()].map(K => K - 6).find(K => [0, 2, 3, 4].includes(md(K) % 6) && sinKey(K) === k);

/* =====================================================================
   1. Degrés → radians
   ===================================================================== */
const D_BASE = [30, 45, 60, 90, 180, 360], D_TOUR = [120, 135, 150, 210, 225, 240, 270, 300, 315, 330];
const D_FIN = [15, 75, 105, 165, 10, 20, 36, 72, 40, 18], D_BIG = [390, 405, 420, 450, 480, 495, 540, 600, 630, 720, 750, 1080];
function degPool(d) {
  if (d < 1) return pick(D_BASE);
  if (d < 2) return pick(D_TOUR);
  if (d < 3) return (chance(0.75) ? -1 : 1) * pick([...D_BASE.slice(0, 5), ...D_TOUR]);
  if (d < 4) return (chance(0.3) ? -1 : 1) * pick(D_FIN);
  return (chance(0.4) ? -1 : 1) * pick(d < 5 ? D_BIG : [...D_BIG, ...D_FIN, ...D_TOUR]);
}
function L1(d) {
  const deg = degPool(d), [p, q] = red(deg, 180), g = gcd(deg, 180), t = deg * PI / 180;
  const vis = l => cercle({ marks: true, arc: { t }, pts: [{ t, l, ray: true }] });
  return {
    type: 'nums', keys: { comma: false },
    html: `Convertis <b>${M(deg)}°</b> en radians.${PINOTE}`,
    visual: vis(`${M(deg)}°`), afterVisual: vis(piT(p, q)), replaceVisual: true,
    tpl: PIT(`${M(deg)}°`), labels: ['nombre devant π', 'dénominateur'],
    check: piCheck(deg, 180, {
      msg: r => {
        if (near(r, -deg / 180)) return 'Attention au signe : un angle négatif reste négatif en radians.';
        if (near(r, 180 / deg)) return "C'est l'inverse : on multiplie par π/180, donc on divise les degrés par 180.";
        if (near(r, deg / 360) || near(r, deg / 90)) return '⚠️ π rad = <b>180°</b> (un demi-tour), pas 360°.';
        return '';
      },
    }),
    verify: E => near(E[0] / E[1] * 180, deg),
    hint: `π rad = 180°. Donc ${M(deg)}° = ${F(M(deg), 180)} × π : il reste à simplifier la fraction.`,
    solution: `${M(deg)}° = ${F(M(deg), 180)} × π${g > 1 ? ` ; on simplifie par ${g} : ${F(M(deg) + ' ÷ ' + g, '180 ÷ ' + g)} = ${F(M(p), q)}` : ''}.<br>Donc ${M(deg)}° = <b>${pfr(p, q)}</b> rad.`,
  };
}
function C1() {
  return `<h2>1. Des degrés aux radians</h2>
<p class="intro">En trigonométrie, on mesure les angles en <b>radians</b> plutôt qu'en degrés : c'est l'unité qui relie un angle à une longueur d'arc. Tu vas apprendre à passer des degrés aux radians.</p>
<div class="def">Sur un cercle de rayon 1, un angle de <b>x radians</b> intercepte un arc de <b>longueur x</b>.<br>Le cercle entier mesure 2π : <b>360° = 2π rad</b>, donc <b>180° = π rad</b>.<br>Conversion : <b>mesure en radians = degrés × ${F('π', 180)}</b>, puis on simplifie la fraction.</div>
${meth([`Écris la fraction ${F('degrés', 180)} devant π.`, 'Simplifie la fraction (divise en haut et en bas par le même nombre).', 'Garde le signe : un angle négatif reste négatif.', `Saisie : le nombre devant π en haut, le dénominateur en bas (π s'écrit 1 π / 1, ${F('5π', 2)} s'écrit 5 π / 2).`])}
<div class="cols"><div>
${exq('Exemple 1 : 135°', `135° = ${F(135, 180)} × π. On simplifie par 45 : <b>${F('3π', 4)}</b>.`)}
${exq('Exemple 2 : −20° et 450°', `−20° = −${F(20, 180)} × π = <b>−${F('π', 9)}</b> (on simplifie par 20).<br>450° = ${F(450, 180)} × π = <b>${F('5π', 2)}</b> (par 90) : plus d'un tour, c'est permis.`)}
</div>${cercle({ marks: true, noGrad: true, arc: { t: 3 * PI / 4 }, pts: [{ t: 3 * PI / 4, l: '135° = 3π/4' }], tl: [{ t: 0, l: '0' }, { t: PI / 2, l: '90° = π/2' }, { t: -PI / 2, l: '−90° = −π/2' }] })}</div>
<div class="warn">⚠️ π rad = <b>180°</b>, pas 360° !<br>⚠️ Ne fais pas l'inverse : on divise les degrés par 180, pas 180 par les degrés.<br>⚠️ On garde π : ${F('π', 3)} est une valeur exacte, 1,047 n'est qu'une valeur approchée.</div>
${ret(`180° = π rad, donc on multiplie les degrés par ${F('π', 180)} et on simplifie.`)}`;
}

/* =====================================================================
   2. Radians → degrés
   ===================================================================== */
function L2(d) {
  if (d >= 5 && chance(0.5)) {
    const x = pick([0.5, 1, 1.5, 2, 2.5, 3]), E = Math.round(x * 180 / PI);
    return {
      type: 'nums', keys: { comma: false, neg: false },
      html: `Convertis <b>${M(x)} rad</b> en degrés, arrondi à l'unité.`,
      visual: cercle({ marks: true, arc: { t: x }, pts: [{ t: x, l: `${M(x)} rad` }] }),
      afterVisual: cercle({ marks: true, arc: { t: x }, pts: [{ t: x, l: `≈ ${E}°` }] }), replaceVisual: true,
      tpl: `${M(x)} rad ≈ {0} °`,
      check: chk(E, v => (near(v, Math.round(x * 3.14 * 100) / 100) ? 'Tu as multiplié par π. On multiplie par 180 et on divise par π.' : Math.abs(v - x * 180 / PI) < 1.01 ? 'Presque : vérifie l\'arrondi à l\'unité.' : '')),
      value: Math.round(Math.atan2(Math.sin(x), Math.cos(x)) / (2 * PI) * 360),
      hint: '1 rad = 180° ÷ π ≈ 57,3°. Multiplie par 180 puis divise par π (touche π de la calculatrice).',
      solution: `${M(x)} rad = ${M(x)} × 180 ÷ π ≈ ${M(r6(Math.round(x * 180 / PI * 10) / 10))}°, soit <b>${E}°</b> à l'unité.`,
    };
  }
  const deg = degPool(Math.min(d, 4)), [p, q] = red(deg, 180), t = deg * PI / 180;
  const vis = l => cercle({ marks: true, arc: { t }, pts: [{ t, l }] });
  return {
    type: 'nums', keys: { comma: false },
    html: `Convertis <b>${pfr(p, q)}</b> rad en degrés.`,
    visual: vis(piT(p, q)), afterVisual: vis(`${M(deg)}°`), replaceVisual: true,
    tpl: `${pfr(p, q)} = {0} °`,
    check: chk(deg, v => {
      if (near(v, p / q, 1e-6)) return `On remplace π par <b>180°</b> : ${pfr(p, q)} = ${M(p)} × 180 ÷ ${q}.`;
      if (Math.abs(v - p / q * PI) < 0.01) return `${M(r6(p / q * PI))}, c'est la valeur décimale en radians. On veut des degrés : π rad = 180°.`;
      if (near(v, -deg)) return 'Attention au signe !';
      if (near(v, 2 * deg) || near(v, deg / 2)) return '⚠️ π rad = <b>180°</b>, pas 360°.';
      return '';
    }),
    value: p * 180 / q,
    hint: `π rad = 180° : remplace π par 180, puis calcule ${M(p)} × 180 ÷ ${q}.`,
    solution: q === 1 ? `${pfr(p, q)} = ${M(p)} × 180° = <b>${M(deg)}°</b>.` : `${pfr(p, q)} = ${M(p)} × 180° ÷ ${q} = ${M(p * 180)}° ÷ ${q} = <b>${M(deg)}°</b>.`,
  };
}
function C2() {
  return `<h2>2. Des radians aux degrés</h2>
<p class="intro">Le chemin inverse : un angle donné en radians, tu le traduis en degrés pour mieux te le représenter.</p>
<div class="def">Comme π rad = 180°, on <b>remplace π par 180°</b>.<br>Si la mesure n'a pas de π : <b>degrés = radians × 180 ÷ π</b> (1 rad ≈ 57,3°).<br>Repères : ${F('π', 6)} = 30°, ${F('π', 4)} = 45°, ${F('π', 3)} = 60°, ${H2} = 90°, π = 180°, 2π = 360°.</div>
${meth(['Remplace π par 180.', 'Fais le calcul : multiplie par le nombre devant π, puis divise par le dénominateur.', 'Garde le signe.', 'Sans π (par exemple 2 rad) : multiplie par 180, divise par π à la calculatrice, puis arrondis à l\'unité.'])}
<div class="cols"><div>
${exq(`Exemple 1 : ${F('5π', 6)}`, `${F('5π', 6)} = 5 × 180° ÷ 6 = 900° ÷ 6 = <b>150°</b>.`)}
${exq(`Exemple 2 : −${F('7π', 3)} et 2 rad`, `−${F('7π', 3)} = −7 × 180° ÷ 3 = −1 260° ÷ 3 = <b>−420°</b>.<br>2 rad = 2 × 180 ÷ π ≈ 114,6°, soit <b>115°</b> à l'unité.`)}
</div>${cercle({ marks: true, noGrad: true, arc: { t: 2 }, pts: [{ t: 5 * PI / 6, l: '5π/6', c: COL.sin }, { t: 2, l: '2 rad' }], tl: [{ t: -PI / 6, l: '5π/6 = 150°', c: COL.sin }, { t: -PI / 3, l: '2 rad ≈ 115°', c: COL.P }] })}</div>
<div class="warn">⚠️ ${F('2π', 3)} ne vaut pas 2 ÷ 3 degré : on remplace π par 180, ce qui donne 120°.<br>⚠️ Ne confonds pas ${F('2π', 3)} ≈ 2,09 (radians, en décimal) et 120° (degrés).</div>
${ret('pour passer en degrés, on remplace π par 180.')}`;
}

/* =====================================================================
   3. Repérer un point du cercle trigonométrique
   ===================================================================== */
function L3(d) {
  const LET = shuffle('ABCDEFGHJK'.split(''));
  if (d >= 4) {
    // sens inverse : un point M, quel réel lui est associé ?
    const k = pick(REM.filter(k => k % 6)), off = d < 5 ? pick([0, 0, -24]) : pick([24, -24, 48, -48]);
    const T = k + off;
    const pos = [md(-k), md(12 - k), md(12 + k), md(6 - k)].filter((v, i, a) => v !== k && a.indexOf(v) === i);
    const Ks = shuffle([T, ...shuffle(pos).slice(0, 3).map(v => v + off)]);
    const opts = Ks.map((K, i) => ({ v: 'r' + i, l: `x = ${A(K)}`, K }));
    const good = opts.find(o => o.K === T);
    const vis = (l, arc) => cercle({ marks: true, arc: arc ? { t: rad(T) } : undefined, pts: [{ t: rad(k), l }] });
    return {
      type: 'choice', html: `Quel réel x est associé au point <b>M</b> du cercle trigonométrique ?`,
      visual: vis('M'), afterVisual: vis(`M(${At(T)})`, true), replaceVisual: true,
      opts: opts.map(({ v, l }) => ({ v, l })),
      check: choiceCheck(good.v, {
        msg: c => {
          const K = opts.find(o => o.v === c).K;
          if (md(K) === md(-k)) return 'Ce réel donne le symétrique de M par rapport à l\'axe horizontal. Le sens positif est le sens inverse des aiguilles d\'une montre.';
          if (md(K) === md(6 - k)) return '⚠️ Confusion entre π/6 et π/3 ? π/6 est près de l\'axe horizontal, π/3 près de l\'axe vertical.';
          return 'Pars du point (1 ; 0) et tourne dans le sens inverse des aiguilles d\'une montre.';
        },
      }),
      verify: c => { const K = opts.find(o => o.v === c).K; return near(Math.cos(rad(K)), Math.cos(k * PI / 12)) && near(Math.sin(rad(K)), Math.sin(k * PI / 12)); },
      hint: 'Un quart de tour vaut π/2 = 6π/12, un douzième de tour vaut π/6. Compte les repères gris depuis le point (1 ; 0).' + (off ? ' Un tour complet (2π) ramène au même point.' : ''),
      solution: `M est à ${At(k)} du point (1 ; 0) dans le sens direct${off ? `, et ajouter ou retrancher des tours de 2π ne change pas le point : ${At(T)} = ${At(k)} ${off > 0 ? '+' : '−'} ${Math.abs(off / 24) === 1 ? '' : Math.abs(off / 24) + ' × '}2π` : ''}.<br>Réponse : <b>x = ${A(T)}</b>.`,
    };
  }
  let k;
  if (d < 1) k = pick(REM.filter(k => k % 3 === 0 && k));
  else if (d < 2) k = pick(REM.filter(k => k % 3 !== 0 || (k % 6 === 0 && chance(0.2))).filter(k => k));
  else k = pick(REM.filter(k => k));
  const T = d < 2 ? k : d < 3 ? k - 24 : k + pick([24, -24, 48, -48]);
  const cand = shuffle([md(-k), md(12 - k), md(12 + k), md(6 - k), md(6 + k)].filter((v, i, a) => v !== k && a.indexOf(v) === i && REM.includes(v))).slice(0, 4);
  const others = shuffle(REM.filter(v => v !== k && !cand.includes(v)));
  const shown = shuffle([k, ...cand, ...others].slice(0, 6));
  const P = {}; shown.forEach((v, i) => { P[LET[i]] = v; });
  const goodL = LET[shown.indexOf(k)];
  const pts = shown.map((v, i) => ({ t: rad(v), l: LET[i] }));
  return {
    type: 'choice', html: `Quel point du cercle trigonométrique est associé au réel <b>${A(T)}</b> ?`,
    visual: cercle({ marks: true, pts }),
    afterVisual: cercle({ marks: true, arc: { t: rad(T) }, pts: pts.map(p => (p.l === goodL ? { ...p, c: COL.A, l: `${goodL} : ${At(T)}` } : { ...p, c: COL.soft, ray: false })) }), replaceVisual: true,
    opts: Object.keys(P).sort().map(L => ({ v: L, l: `le point ${L}` })),
    check: choiceCheck(goodL, {
      msg: c => {
        const v = P[c];
        if (v === md(-k)) return 'Tu as tourné dans le mauvais sens : le sens positif est le sens inverse des aiguilles d\'une montre.';
        if (v === md(6 - k) || v === md(6 + k)) return '⚠️ π/6 est un tiers de quart de tour, π/3 deux tiers de quart de tour : ne les confonds pas.';
        if (v === md(12 + k)) return 'Tu as fait un demi-tour de trop.';
        return '';
      },
    }),
    verify: c => near(Math.cos(P[c] * PI / 12), Math.cos(T * PI / 12)) && near(Math.sin(P[c] * PI / 12), Math.sin(T * PI / 12)),
    hint: `Pars du point (1 ; 0). ${T < 0 ? 'Le réel est négatif : tourne dans le sens des aiguilles d\'une montre.' : 'Tourne dans le sens inverse des aiguilles d\'une montre.'} Un quart de tour = π/2${Math.abs(T) >= 24 ? ' ; un tour complet = 2π ramène au même point' : ''}.`,
    solution: `${Math.abs(T) >= 24 ? `${At(T)} = ${At(k)} ${T > k ? '+' : '−'} ${Math.abs((T - k) / 24) === 1 ? '' : Math.abs((T - k) / 24) + ' × '}2π : même point que ${At(k)}.<br>` : T < 0 ? `${At(T)} = ${At(k)} − 2π : même point que ${At(k)}.<br>` : ''}${At(k)} = ${k} × π/12, soit ${quarts(k)}.<br>C'est le point <b>${goodL}</b>.`,
  };
}
function C3() {
  return `<h2>3. Le cercle trigonométrique</h2>
<p class="intro">Le cercle trigonométrique transforme chaque nombre réel en un point : c'est la base de tout le chapitre. Il faut savoir placer un réel, et retrouver le réel d'un point.</p>
<div class="def">C'est le cercle de centre O et de <b>rayon 1</b>, orienté dans le <b>sens direct</b> (inverse des aiguilles d'une montre).<br>À chaque réel x on associe un point M : on part de I(1 ; 0) et on parcourt sur le cercle un arc de longueur x dans le sens direct (si x &lt; 0 : un arc de longueur −x, dans l'autre sens).<br>Repères : quart de tour = ${H2}, demi-tour = π, un tour = 2π. ${F('π', 6)} = un tiers de quart de tour, ${F('π', 4)} = la moitié, ${F('π', 3)} = deux tiers.</div>
${meth(['Si le réel dépasse un tour, enlève ou ajoute des tours de 2π : x et x + 2π donnent le <b>même point</b>.', 'Regarde le signe : positif → sens inverse des aiguilles d\'une montre ; négatif → sens des aiguilles.', `Compte les quarts de tour (${H2}), puis la fraction de quart qui reste (${F('π', 6)}, ${F('π', 4)} ou ${F('π', 3)}).`, 'Pour retrouver le réel d\'un point M : fais le chemin inverse depuis I(1 ; 0), puis ajoute des tours si l\'énoncé le demande.'])}
<div class="cols"><div>
${exq(`Exemple 1 : placer ${F('13π', 6)}`, `${F('13π', 6)} = ${F('π', 6)} + ${F('12π', 6)} = ${F('π', 6)} + 2π.<br>Même point que ${F('π', 6)} : un tiers de quart de tour, près de l'axe horizontal.`)}
${exq(`Exemple 2 : placer −${F('2π', 3)}`, `Négatif : on tourne dans le sens des aiguilles d'une montre.<br>${F('2π', 3)} = un quart de tour (${H2}) + ${F('π', 6)}. On arrive en bas à gauche, au même point que ${F('4π', 3)}.`)}
</div>${cercle({ marks: true, noGrad: true, arc: { t: -2 * PI / 3 }, pts: [{ t: -2 * PI / 3, l: '−2π/3' }, { t: PI / 6, l: '13π/6', c: COL.sin }] })}</div>
<div class="warn">⚠️ Le sens positif est le sens <b>inverse</b> des aiguilles d'une montre.<br>⚠️ ${F('π', 6)} est près de l'axe horizontal, ${F('π', 3)} près de l'axe vertical : ne les échange pas.<br>⚠️ Un demi-tour de trop envoie au point diamétralement opposé.</div>
${cercle({ marks: true, noGrad: true, tl: [{ t: 0, l: '0' }, { t: PI / 6, l: 'π/6' }, { t: PI / 4, l: 'π/4' }, { t: PI / 3, l: 'π/3' }, { t: PI / 2, l: 'π/2' }, { t: 2 * PI / 3, l: '2π/3' }, { t: 3 * PI / 4, l: '3π/4' }, { t: 5 * PI / 6, l: '5π/6' }, { t: PI, l: 'π' }, { t: -PI / 2, l: '−π/2' }, { t: -PI / 4, l: '−π/4' }, { t: -3 * PI / 4, l: '−3π/4' }] })}
${ret('un réel, c\'est un chemin sur le cercle depuis I(1 ; 0) ; un tour de 2π de plus ramène au même point.')}`;
}

/* =====================================================================
   4. Mesure principale
   ===================================================================== */
function L4(d) {
  const nzRem = REM.filter(k => k).map(k => (k > 12 ? k - 24 : k));   // ]−12 ; 12]
  let K, n;
  if (d < 1) { K = pick(nzRem.filter(k => k > 0 && k < 12)); n = 1; }
  else if (d < 2) { K = pick(nzRem.filter(k => k > 0)); n = ri(1, 3); }
  else if (d < 3) { K = pick(nzRem.filter(k => k > 0)); n = -ri(1, 3); }
  else if (d < 4) { K = pick(nzRem.filter(k => k < 0)); n = pick([1, 1, 2, -1]); }
  else { K = pick(nzRem); n = pick([1, -1]) * ri(2, d < 5 ? 6 : 20); }
  const G = K + 24 * n, [p, q] = red(G, 12), [kp, kq] = red(K, 12);
  const vis = (l, arc) => cercle({ marks: true, arc: arc ? { t: rad(G) } : undefined, pts: [{ t: rad(G), l }] });
  return {
    type: 'nums', keys: { comma: false },
    html: `Donne la <b>mesure principale</b> du réel <b>${pfr(p, q)}</b>, c'est-à-dire le réel de l'intervalle ]−π ; π] associé au même point du cercle.${PINOTE}`,
    visual: vis(piT(p, q), true), afterVisual: vis(Math.abs(G) > 99 ? piT(kp, kq) : `${piT(p, q)} → ${piT(kp, kq)}`, true), replaceVisual: true,
    tpl: PIT('mesure principale'), labels: ['nombre devant π', 'dénominateur'],
    check: piCheck(K, 12, {
      msg: r => {
        const k = Math.round(r * 12);
        if (near(r * 12, k, 1e-9) && md(k) === md(K)) return k === -12 ? '−π n\'est pas dans ]−π ; π] (crochet ouvert) : on prend π.' : 'C\'est bien le même point du cercle, mais pas dans l\'intervalle ]−π ; π]. Enlève ou ajoute encore un tour de 2π.';
        if (near(r, -K / 12)) return 'Attention au signe.';
        return '';
      },
    }),
    verify: E => { const x = E[0] / E[1] * PI; return x > -PI + 1e-9 && x <= PI + 1e-9 && near(Math.cos(x), Math.cos(G * PI / 12)) && near(Math.sin(x), Math.sin(G * PI / 12)); },
    hint: `Un tour vaut 2π = ${fq(2 * q, q)}. ${G > 0 ? 'Enlève' : 'Ajoute'} des tours (des paquets de ${piT(2 * q, q)}) jusqu'à tomber entre −π et π.`,
    solution: `2π = ${fq(2 * q, q)}. ${fq(p, q)} = ${fq(K / 12 * q, q)} ${n > 0 ? '+' : '−'} ${Math.abs(n)} × ${fq(2 * q, q)} (${Math.abs(n)} tour${Math.abs(n) > 1 ? 's' : ''}).<br>Mesure principale : <b>${pfr(kp, kq)}</b>, qui est bien dans ]−π ; π].`,
  };
}
function C4() {
  return `<h2>4. Mesure principale</h2>
<p class="intro">Un même point du cercle correspond à une infinité de réels. Pour parler tous de la même chose, on choisit le « représentant » le plus simple : la mesure principale.</p>
<div class="def">Les réels x, x + 2π, x − 2π, x + 4π… donnent tous le <b>même point</b> du cercle.<br>Parmi eux, un seul est dans <b>]−π ; π]</b> : c'est la <b>mesure principale</b> de x.</div>
${meth([`Écris un tour, 2π, avec le même dénominateur : par exemple ${nw(`2π = ${F('12π', 6)} = ${F('8π', 4)} = ${F('6π', 3)}.`)}`, 'Enlève (si x est positif) ou ajoute (si x est négatif) des tours, jusqu\'à arriver entre −π et π.', 'Astuce pour les grands nombres : divise le numérateur par 2 × dénominateur ; le reste te donne presque la réponse.', 'Vérifie que le résultat est dans ]−π ; π] : sinon, enlève ou ajoute encore un tour.'])}
<div class="cols"><div>
${exq(`Exemple 1 : ${F('17π', 6)}`, `Un tour vaut ${F('12π', 6)}. ${nw(`${F('17π', 6)} − ${F('12π', 6)} = <b>${F('5π', 6)}</b>`)}, qui est bien dans ${nw(']−π ; π]')}.`)}
${exq(`Exemple 2 : ${F('43π', 6)}`, `Un tour = ${F('12π', 6)} et 43 = 3 × 12 + 7 : on enlève 3 tours, il reste ${F('7π', 6)}.<br>Piège : ${F('7π', 6)} &gt; π ! On enlève encore un tour : ${F('7π', 6)} − ${F('12π', 6)} = <b>−${F('5π', 6)}</b>.`)}
${exq(`Exemple 3 : −${F('11π', 3)}`, `Négatif : on ajoute 2 tours, soit 4π = ${F('12π', 3)}.<br>−${F('11π', 3)} + ${F('12π', 3)} = <b>${F('π', 3)}</b>.`)}
</div>${cercle({ marks: true, noGrad: true, arc: { t: 17 * PI / 6 }, pts: [{ t: 17 * PI / 6, l: '5π/6' }], tl: [{ t: -PI / 2, l: '17π/6 → 5π/6 (un tour en moins)', c: COL.P }] })}</div>
<div class="warn">⚠️ La mesure principale peut être <b>négative</b> : ${F('7π', 4)} a pour mesure principale −${F('π', 4)}.<br>⚠️ π est dans ]−π ; π] mais −π n'y est pas : la mesure principale de −π (ou de 5π) est π.<br>⚠️ Retirer un tour, c'est retirer 2π, pas π.</div>
${ret('la mesure principale est l\'unique réel de ]−π ; π] associé au même point ; on l\'obtient en enlevant ou ajoutant des tours de 2π.')}`;
}

/* =====================================================================
   5. cos et sin des angles remarquables
   ===================================================================== */
function L5(d) {
  let K;
  if (d < 2) K = pick(d < 1 ? [2, 3, 4] : [0, 2, 3, 4, 6]);
  else if (d < 3) K = pick([8, 9, 10, 12]);
  else if (d < 4) K = pick(REM.filter(k => k > 6));
  else K = pick(REM) - (d < 5 ? 24 : pick([24, -24, 48]));
  const fn = pick(['cos', 'sin']), oth = fn === 'cos' ? 'sin' : 'cos';
  const E = KEYF[fn](K), O = KEYF[oth](K);
  const set = [E, neg(E), O, neg(O)].filter((v, i, a) => a.indexOf(v) === i);
  for (const f of shuffle(['0', '1', 'h', 'r2', 'r3', 'mh', 'mr3', 'm1'])) if (set.length < 5 && !set.includes(f)) set.push(f);
  set.sort((a, b) => val(a) - val(b));
  const vis = after => cercle({ marks: true, arc: { t: rad(K) }, pts: [{ t: rad(K), l: At(K), proj: d < 1 || after, lc: after ? txt(cosKey(K)) : '', ls: after ? txt(sinKey(K)) : '' }] });
  const kk = md(K), quad = kk === 0 || kk === 12 || kk === 6 || kk === 18 ? '' : kk < 6 ? 'premier' : kk < 12 ? 'deuxième' : kk < 18 ? 'troisième' : 'quatrième';
  return {
    type: 'choice', html: `Quelle est la valeur exacte de <b>${fn}(${A(K)})</b> ?`,
    visual: vis(false), afterVisual: vis(true), replaceVisual: true,
    opts: set.map(v => ({ v, l: lab(v) })),
    check: choiceCheck(E, {
      msg: c => {
        if (c === neg(E)) return `Bonne valeur, mauvais signe : regarde si le point est ${fn === 'cos' ? 'à gauche ou à droite de l\'axe vertical' : 'au-dessus ou en dessous de l\'axe horizontal'}.`;
        if (c === O) return `C'est ${oth}(${A(K)}). Le cosinus se lit sur l'axe <b>horizontal</b>, le sinus sur l'axe <b>vertical</b>.`;
        return '';
      },
    }),
    verify: c => near(val(c), Math[fn](K * PI / 12)),
    hint: `Place le point sur le cercle. ${fn === 'cos' ? 'cos = abscisse (lecture sur l\'axe horizontal)' : 'sin = ordonnée (lecture sur l\'axe vertical)'}. Repères : cos(π/3) = 1/2, cos(π/6) = √3/2, cos(π/4) = √2/2.`,
    solution: `${Math.abs(K) >= 24 || K < 0 ? `${At(K)} donne le même point que ${At(kk > 12 ? kk - 24 : kk)}.<br>` : ''}Le point associé a pour coordonnées (${txt(cosKey(K))} ; ${txt(sinKey(K))})${quad ? ` (${quad} quart du cercle)` : ''}.<br>Donc <b>${fn}(${A(K)}) = ${lab(E)}</b>.`,
  };
}
function C5() {
  return `<h2>5. Cosinus et sinus des angles remarquables</h2>
<p class="intro">Le cosinus et le sinus d'un réel sont les coordonnées de son point sur le cercle. Pour les angles remarquables, on connaît leurs valeurs exactes.</p>
<div class="def">Si M est le point du cercle associé au réel x, ses coordonnées sont <b>M(cos x ; sin x)</b>.<br><b>cos x</b> se lit sur l'axe horizontal (abscisse), <b>sin x</b> sur l'axe vertical (ordonnée).</div>
<div class="ex"><table class="st"><tr><td>x</td><td>0</td><td>${F('π', 6)}</td><td>${F('π', 4)}</td><td>${F('π', 3)}</td><td>${H2}</td></tr><tr><td>cos x</td><td>1</td><td>${F(R(3), 2)}</td><td>${F(R(2), 2)}</td><td>${F(1, 2)}</td><td>0</td></tr><tr><td>sin x</td><td>0</td><td>${F(1, 2)}</td><td>${F(R(2), 2)}</td><td>${F(R(3), 2)}</td><td>1</td></tr></table></div>
${meth(['Si le réel est hors de ]−π ; π], ramène-le à sa mesure principale (enlève des tours de 2π).', `Place le point et repère son <b>angle de référence</b> avec l'axe horizontal : ${F('π', 6)}, ${F('π', 4)} ou ${F('π', 3)}.`, 'Lis la valeur (sans signe) dans le tableau.', 'Mets le signe : cos &lt; 0 si le point est à gauche, sin &lt; 0 s\'il est en bas.'])}
<div class="cols"><div>
${exq(`Exemple 1 : cos ${F('3π', 4)}`, `${F('3π', 4)} = π − ${F('π', 4)} : symétrique de ${F('π', 4)} par rapport à l'axe vertical, en haut à gauche.<br>Donc cos ${F('3π', 4)} = <b>−${F(R(2), 2)}</b> (à gauche : négatif).`)}
${exq(`Exemple 2 : ${nw(`sin(−${F('17π', 6)})`)}`, `−${F('17π', 6)} + 2π = −${F('5π', 6)} : en bas à gauche, à ${F('π', 6)} de l'axe horizontal.<br>sin ${F('π', 6)} = ${F(1, 2)} et le point est en bas : ${nw(`sin(−${F('17π', 6)})`)} = <b>−${F(1, 2)}</b>.`)}
</div>${cercle({ marks: true, pts: [{ t: PI / 3, l: 'π/3', proj: true, lc: '1/2', ls: '√3/2' }, { t: 3 * PI / 4, l: '3π/4', c: COL.A, proj: true, lc: '−√2/2' }] })}</div>
<div class="warn">⚠️ cos ${F('π', 3)} = ${F(1, 2)} mais cos ${F('π', 6)} = ${F(R(3), 2)} : ${F('π', 3)} est près de l'axe vertical, son abscisse est petite.<br>⚠️ Ne confonds pas cosinus (horizontal) et sinus (vertical).<br>⚠️ Le signe dépend du quart de cercle où se trouve le point.</div>
${ret('M(x) a pour coordonnées (cos x ; sin x) : la valeur vient du tableau, le signe vient de la position du point.')}`;
}

/* =====================================================================
   6 et 7. Angles associés
   ===================================================================== */
const TRIPLES = [[0.6, 0.8], [0.8, 0.6], [0.28, 0.96], [0.96, 0.28], [0.352, 0.936], [0.936, 0.352]];
const FORMS = {
  mx: { l: '−x', t: x => -x, cos: ['cos', 1], sin: ['sin', -1] },
  pmx: { l: 'π − x', t: x => PI - x, cos: ['cos', -1], sin: ['sin', 1] },
  ppx: { l: 'π + x', t: x => PI + x, cos: ['cos', -1], sin: ['sin', -1] },
  dpmx: { l: '2π − x', t: x => 2 * PI - x, cos: ['cos', 1], sin: ['sin', -1] },
  xmp: { l: 'x − π', t: x => x - PI, cos: ['cos', -1], sin: ['sin', -1] },
  hmx: { l: `${H2} − x`, t: x => PI / 2 - x, cos: ['sin', 1], sin: ['cos', 1] },
  hpx: { l: `${H2} + x`, t: x => PI / 2 + x, cos: ['sin', -1], sin: ['cos', 1] },
  xmh: { l: `x − ${H2}`, t: x => x - PI / 2, cos: ['sin', 1], sin: ['cos', -1] },
};
function assoc(fk, d, signs) {
  let [c, s] = pick(TRIPLES);
  if (signs) { if (chance(0.5)) c = -c; if (chance(0.5)) s = -s; }
  const fn = pick(['cos', 'sin']), Fm = FORMS[fk], [g, sg] = Fm[fn], E = r6(sg * (g === 'cos' ? c : s));
  const x = Math.atan2(s, c), y = Fm.t(x), cy = r6(Math.cos(y)), sy = r6(Math.sin(y));
  const other = fn === 'cos' ? s : c, same = fn === 'cos' ? c : s;
  const vis = after => cercle({ pts: [{ t: x, l: 'M', proj: true, lc: M(c), ls: M(s) }, { t: y, l: 'N', c: COL.A, proj: after, lc: after && !near(cy, c) ? M(cy) : '', ls: after && !near(sy, s) ? M(sy) : '' }] });
  const swap = g !== fn;
  return {
    type: 'nums', keys: { comma: true },
    html: `On sait que <b>cos x = ${M(c)}</b> et <b>sin x = ${M(s)}</b>.<br>Calcule <b>${fn}(${Fm.l})</b>.<br><span class="note">Sur la figure, M est associé à x et N à ${Fm.l}.</span>`,
    visual: vis(false), afterVisual: vis(true), replaceVisual: true,
    tpl: `${fn}(${Fm.l}) = {0}`,
    check: chk(E, v => {
      if (E !== 0 && near(v, -E)) return 'Bonne valeur, mais attention au signe : regarde où est N sur la figure.';
      if (!swap && (near(v, other) || near(v, -other))) return `Ici on garde la même fonction : ${fn}(${Fm.l}) s'exprime avec ${fn} x, pas avec ${fn === 'cos' ? 'sin' : 'cos'} x.`;
      if (swap && (near(v, same) || near(v, -same))) return `⚠️ Avec ${H2}, cosinus et sinus <b>s'échangent</b> : ${fn}(${Fm.l}) s'exprime avec ${g} x.`;
      return '';
    }),
    value: Math[fn](Fm.t(Math.atan2(s, c))),
    hint: swap ? `Avec ${H2} − x, ${H2} + x… le cosinus devient un sinus et inversement. Regarde sur la figure si N est à gauche ou à droite, en haut ou en bas.`
      : `N est un symétrique de M (par rapport à un axe ou au centre O). Regarde sur la figure ce qui change de signe.`,
    solution: `${fn}(${Fm.l}) = <b>${sg < 0 ? '−' : ''}${g} x</b> = ${sg < 0 ? '−' : ''}${g === 'cos' ? (c < 0 ? `(${M(c)})` : M(c)) : (s < 0 ? `(${M(s)})` : M(s))} = <b>${M(E)}</b>.<br>Sur la figure, N a pour coordonnées (${M(cy)} ; ${M(sy)}).`,
  };
}
function L6(d) {
  const fk = d < 1 ? 'mx' : d < 2 ? 'pmx' : d < 3 ? 'ppx' : d < 4 ? pick(['mx', 'pmx', 'ppx']) : pick(['mx', 'pmx', 'ppx', 'dpmx', 'xmp']);
  return assoc(fk, d, d >= 3);
}
function C6() {
  return `<h2>6. Angles associés : −x, π − x, π + x</h2>
<p class="intro">Connaissant cos x et sin x, tu peux obtenir sans calculatrice le cosinus et le sinus de −x, π − x ou π + x : il suffit de regarder des symétries sur le cercle.</p>
<div class="def">Sur le cercle, les points associés à −x, π − x et π + x sont des <b>symétriques</b> du point M(x) :<br>• −x : symétrie d'axe horizontal → <b>cos(−x) = cos x</b>, <b>sin(−x) = −sin x</b> ;<br>• π − x : symétrie d'axe vertical → <b>cos(π − x) = −cos x</b>, <b>sin(π − x) = sin x</b> ;<br>• π + x : symétrie de centre O → <b>cos(π + x) = −cos x</b>, <b>sin(π + x) = −sin x</b>.</div>
${meth(['Repère la symétrie : −x (axe horizontal), π − x (axe vertical), π + x (centre O).', '2π − x donne le même point que −x, et x − π le même point que π + x (un tour d\'écart).', 'Garde la <b>même fonction</b> : cos reste cos, sin reste sin.', 'Choisis le signe en regardant où est le point N sur la figure.'])}
<div class="cols"><div>
${exq('Exemple 1 : cos x = 0,6 et sin x = 0,8', 'cos(π − x) = −cos x = <b>−0,6</b> ; sin(π − x) = sin x = <b>0,8</b> ; sin(π + x) = −sin x = <b>−0,8</b>.')}
${exq('Exemple 2 : cos x = −0,28 et sin x = 0,96', 'cos(2π − x) = cos(−x) = cos x = <b>−0,28</b>.<br>sin(x − π) = sin(π + x) = −sin x = <b>−0,96</b>.<br>Attention : « −cos x » avec cos x = −0,28 donne +0,28.')}
</div>${cercle({ pts: [{ t: 0.9273, l: 'M(x)', proj: true }, { t: PI - 0.9273, l: 'π − x', c: COL.A }, { t: -0.9273, l: '−x', c: COL.cos }, { t: PI + 0.9273, l: 'π + x', c: COL.sin }] })}</div>
<div class="warn">⚠️ Ces formules gardent la même fonction (cos reste cos) ; seul le signe peut changer.<br>⚠️ Si cos x est déjà négatif, −cos x est positif : remplace avec des parenthèses.<br>⚠️ Plutôt que d'apprendre par cœur, retrouve tout sur le cercle.</div>
${ret('−x, π − x et π + x sont des symétriques de x : même fonction, et le signe se lit sur la figure.')}`;
}
function L7(d) {
  const fk = d < 1 ? 'hmx' : d < 2 ? pick(['hmx', 'hpx']) : d < 3 ? pick(['hmx', 'hpx']) : d < 4 ? pick(['hmx', 'hpx', 'xmh']) : pick(['hmx', 'hpx', 'xmh', 'mx', 'pmx', 'ppx']);
  return assoc(fk, d, d >= 2);
}
function C7() {
  return `<h2>7. Angles associés : π/2 − x et π/2 + x</h2>
<p class="intro">Ajouter ou retirer un quart de tour fait « tourner » le point : son abscisse et son ordonnée s'échangent. C'est ce qui relie cosinus et sinus.</p>
<div class="def">Le point associé à ${H2} − x est le symétrique de M(x) par rapport à la <b>diagonale</b> y = x : les coordonnées <b>s'échangent</b>.<br><b>cos(${H2} − x) = sin x</b> et <b>sin(${H2} − x) = cos x</b>.<br>Pour ${H2} + x (quart de tour de plus) : <b>cos(${H2} + x) = −sin x</b> et <b>sin(${H2} + x) = cos x</b>.<br>Pour x − ${H2} (un quart de tour en arrière) : <b>cos(x − ${H2}) = sin x</b> et <b>sin(x − ${H2}) = −cos x</b>.</div>
${meth([`Repère la présence de ${H2} : cosinus et sinus <b>s'échangent</b> (cos devient sin, sin devient cos).`, 'Trouve le signe : place le point N sur la figure (à gauche → cos &lt; 0, en bas → sin &lt; 0).', 'Remplace par la valeur donnée, entre parenthèses si elle est négative.', 'Sans ' + H2 + ' (−x, π − x, π + x) : on revient aux formules du niveau 6, sans échange.'])}
<div class="cols"><div>
${exq('Exemple 1 : cos x = 0,28 et sin x = 0,96', `cos(${H2} − x) = sin x = <b>0,96</b> ; cos(${H2} + x) = −sin x = <b>−0,96</b> ; sin(${H2} + x) = cos x = <b>0,28</b>.`)}
${exq('Exemple 2 : cos x = −0,6 et sin x = 0,8', `cos(${H2} + x) = −sin x = <b>−0,8</b>.<br>sin(x − ${H2}) = −cos x = −(−0,6) = <b>0,6</b>.`)}
</div>${cercle({ pts: [{ t: 0.4, l: 'M(x)', proj: true }, { t: PI / 2 - 0.4, l: 'π/2 − x', c: COL.A, proj: true }, { t: PI / 2 + 0.4, l: 'π/2 + x', c: COL.sin }] })}</div>
<div class="warn">⚠️ Avec ${H2}, cosinus et sinus s'échangent ; avec π, ils restent les mêmes.<br>⚠️ Vérifie le signe sur la figure : N à gauche de l'axe vertical → cosinus négatif.<br>⚠️ −(−0,6) = +0,6 : attention aux doubles signes.</div>
${ret(`avec ${H2}, on échange cos et sin ; le signe se lit sur le cercle.`)}`;
}

/* =====================================================================
   8. cos² + sin² = 1
   ===================================================================== */
const IVS = {
  q1: { l: `]0 ; ${H2}[`, a: 0, b: PI / 2 }, up: { l: ']0 ; π[', a: 0, b: PI }, dn: { l: ']−π ; 0[', a: -PI, b: 0 },
  rt: { l: `]−${H2} ; ${H2}[`, a: -PI / 2, b: PI / 2 }, lf: { l: `]${H2} ; π[`, a: PI / 2, b: PI }, lf2: { l: `]−π ; −${H2}[`, a: -PI, b: -PI / 2 },
};
const tie3 = x => Math.abs(x * 1000 - Math.floor(x * 1000) - 0.5) < 0.06;
function L8(d) {
  // gc : la donnée est cos x (on cherche sin x) ; sinon l'inverse
  const gc = d < 3 || (d >= 4 && chance(0.6));
  let a, b, iv;   // a = donnée, b = réponse (valeurs exactes) ; iv : intervalle de x
  let approxMode = d >= 4 && chance(0.5);
  if (approxMode) {
    do { a = pick([1, 2, 3, 4, 5, 6, 7, 8, 9]) / 10; } while (tie3(Math.sqrt(1 - a * a)));
    if (chance(0.5)) a = -a;
    b = Math.round(Math.sqrt(1 - a * a) * 1000) / 1000;
  } else {
    [a, b] = pick(TRIPLES);
    if (d >= 1 && chance(0.5)) a = -a;
  }
  // choix de l'intervalle selon le signe voulu de la réponse
  let sgn;
  if (gc) {
    if (d < 1) { iv = 'q1'; sgn = 1; a = Math.abs(a); }
    else if (d < 2) { iv = 'up'; sgn = 1; }
    else if (d < 3) { iv = 'dn'; sgn = -1; }
    else { sgn = pick([1, -1]); iv = sgn > 0 ? 'up' : 'dn'; }
  } else {
    sgn = pick([1, -1]);
    iv = sgn > 0 ? 'rt' : a > 0 ? 'lf' : 'lf2';
  }
  const E = r6(sgn * b);
  const fg = gc ? 'cos' : 'sin', fa = gc ? 'sin' : 'cos', I = IVS[iv];
  // vérification indépendante : on reconstruit x avec Math.acos / Math.asin dans l'intervalle donné
  let x = gc ? Math.acos(a) : Math.asin(a);
  if (gc && !(x > I.a && x < I.b)) x = -x;
  if (!gc && !(x > I.a && x < I.b)) x = (x >= 0 ? PI : -PI) - x;
  const v = gc ? Math.sin(x) : Math.cos(x);
  const value = approxMode ? Math.sign(v) * Math.round(Math.abs(v) * 1000) / 1000 : v;
  const vis = after => cercle({
    arcs: [{ a: I.a, b: I.b, c: '#f783ac' }],
    vline: gc ? { x: a, l: `cos x = ${M(a)}` } : undefined, hline: gc ? undefined : { y: a, l: `sin x = ${M(a)}` },
    pts: after ? [{ t: x, l: 'M', proj: true, lc: gc ? '' : M(E), ls: gc ? M(E) : '' }] : [],
  });
  const sq1 = r6(1 - a * a);
  return {
    type: 'nums', keys: { comma: true },
    html: `On sait que <b>${fg} x = ${M(a)}</b> et que <b>x ∈ ${I.l}</b>.<br>Calcule ${fa} x${approxMode ? ', <b>arrondi au millième</b>' : ''}.`,
    visual: vis(false), afterVisual: vis(true), replaceVisual: true,
    tpl: `${fa} x ${approxMode ? '≈' : '='} {0}`,
    check: chk(E, w => {
      if (near(w, -E)) return `Bonne valeur, mauvais signe : sur ${I.l}, ${fa} x est ${sgn > 0 ? 'positif' : 'négatif'} (regarde la partie colorée du cercle).`;
      if (near(w, r6(1 - a)) || near(w, -r6(1 - a))) return `⚠️ ${fa}<sup>2</sup> x = 1 − ${fg}<sup>2</sup> x : il faut les <b>carrés</b>.`;
      if (near(w, sq1) || near(w, -sq1)) return `${M(sq1)}, c'est ${fa}<sup>2</sup> x. Il reste à prendre la <b>racine carrée</b>.`;
      if (approxMode && Math.abs(Math.abs(w) - b) < 0.0015) return 'Presque : vérifie l\'arrondi au millième.';
      return '';
    }),
    value,
    hint: `cos<sup>2</sup> x + sin<sup>2</sup> x = 1, donc ${fa}<sup>2</sup> x = 1 − ${fg}<sup>2</sup> x. Puis le signe : sur ${I.l}, ${fa} x est-il positif ou négatif ?`,
    solution: `${fa}<sup>2</sup> x = 1 − ${fg}<sup>2</sup> x = 1 − ${a < 0 ? `(${M(a)})` : M(a)}<sup>2</sup> = 1 − ${M(r6(a * a))} = ${M(sq1)}.<br>Donc ${fa} x = ${R(M(sq1))} ou ${fa} x = −${R(M(sq1))}${approxMode ? ` (${R(M(sq1))} ≈ ${M(b)})` : ` (${R(M(sq1))} = ${M(b)})`}.<br>Sur ${I.l}, ${fa} x est ${sgn > 0 ? 'positif' : 'négatif'} : <b>${fa} x ${approxMode ? '≈' : '='} ${M(E)}</b>.`,
  };
}
function C8() {
  return `<h2>8. La relation cos² x + sin² x = 1</h2>
<p class="intro">Si tu connais le cosinus d'un réel, tu peux retrouver son sinus (et l'inverse) : c'est le théorème de Pythagore dans le cercle trigonométrique.</p>
<div class="def">Le point M(cos x ; sin x) est sur le cercle de rayon 1, donc (Pythagore) :<br><b>cos<sup>2</sup> x + sin<sup>2</sup> x = 1</b>.<br>Connaissant cos x, on trouve sin<sup>2</sup> x, donc sin x <b>au signe près</b> : le signe se lit avec l'intervalle où se trouve x.</div>
${meth(['Écris la relation : sin<sup>2</sup> x = 1 − cos<sup>2</sup> x (ou cos<sup>2</sup> x = 1 − sin<sup>2</sup> x).', 'Calcule le carré de la valeur donnée (un carré est toujours positif), puis la soustraction.', 'Prends la racine carrée : deux possibilités, une positive et une négative.', 'Choisis le signe grâce à l\'intervalle (partie colorée du cercle). Arrondis seulement à la fin si on le demande.'])}
<div class="cols"><div>
${exq('Exemple 1 : cos x = 0,6 et x ∈ ]−π ; 0[', 'sin<sup>2</sup> x = 1 − 0,6<sup>2</sup> = 1 − 0,36 = 0,64, donc sin x = 0,8 ou sin x = −0,8.<br>Sur ]−π ; 0[, le point est en bas : <b>sin x = −0,8</b>.')}
${exq(`Exemple 2 : sin x = −0,28 et x ∈ ${nw(`]−π ; −${H2}[`)}`, `cos<sup>2</sup> x = 1 − (−0,28)<sup>2</sup> = 1 − 0,0784 = 0,9216, donc cos x = ±0,96.<br>Sur ${nw(`]−π ; −${H2}[`)}, le point est à gauche : <b>cos x = −0,96</b>.`)}
${exq('Exemple 3 : cos x = 0,3, x ∈ ]0 ; π[, au millième', `sin<sup>2</sup> x = 1 − 0,09 = 0,91 ; en haut, sin x = ${R('0,91')} ≈ <b>0,954</b>.`)}
</div><div>${cercle({ arcs: [{ a: -PI, b: 0, c: '#f783ac' }], vline: { x: 0.6, l: 'cos x = 0,6' }, pts: [{ t: -0.9273, l: 'M', proj: true, ls: '−0,8' }] })}
${cercle({ arcs: [{ a: -PI, b: -PI / 2, c: '#f783ac' }], hline: { y: -0.28, l: 'sin x = −0,28' }, pts: [{ t: -PI + Math.asin(0.28), l: 'M', proj: true, lc: '−0,96' }] })}</div></div>
<div class="warn">⚠️ sin<sup>2</sup> x = 1 − cos<sup>2</sup> x, et non 1 − cos x : n'oublie pas le carré.<br>⚠️ N'oublie pas la racine carrée à la fin : 0,64 c'est sin<sup>2</sup> x, pas sin x.<br>⚠️ Deux points du cercle ont la même abscisse : c'est l'intervalle qui permet de choisir le signe.</div>
${ret('cos² x + sin² x = 1 donne la valeur au signe près ; l\'intervalle donne le signe.')}`;
}

/* =====================================================================
   9 et 10. Équations cos x = a, sin x = a dans ]−π ; π]
   ===================================================================== */
/** solutions dans ]−π ; π] (en douzièmes), par raisonnement sur le cercle */
function solK(fn, k) {
  if (k === null) return [];
  if (fn === 'cos') { const K0 = acosK(k); return K0 === 0 ? [0] : K0 === 12 ? [12] : [-K0, K0]; }
  const K1 = asinK(k);
  if (K1 === 6 || K1 === -6) return [K1];
  return K1 >= 0 ? [K1, 12 - K1] : [-12 - K1, K1];
}
const setLab = S => (S.length ? `S = { ${S.map(A).join(' ; ')} }` : 'Aucune solution');
function equation(fn, d) {
  const oth = fn === 'cos' ? 'sin' : 'cos';
  let k, html, imp = null;
  const pos = ['h', 'r2', 'r3'], negs = ['mh', 'mr2', 'mr3'], spec = ['0', '1', 'm1'];
  if (d < 1) k = pick(pos);
  else if (d < 2) k = chance(0.6) ? pick(spec) : pick(pos);
  else if (d < 3) k = pick(chance(0.7) ? negs : [...pos, ...spec]);
  else if (d < 4 || chance(0.7)) k = pick([...pos, ...negs]);
  else { k = null; imp = pick([1.5, -1.5, 1.2, -1.2]); }
  // écriture de l'équation
  if (k === null) {
    html = chance(0.5) ? `${fn} x = ${M(imp)}` : `${Math.abs(imp) === 1.5 ? 2 : 5} ${fn} x ${imp > 0 ? '−' : '+'} ${Math.abs(imp) === 1.5 ? 3 : 6} = 0`;
  } else if (d >= 3 && k !== '0' && k.replace('m', '') !== '1') {
    const c = { h: '1', r2: R(2), r3: R(3) }[k.replace('m', '')];
    html = chance(0.5) ? `2 ${fn} x ${k[0] === 'm' ? '+' : '−'} ${c} = 0` : `2 ${fn} x = ${k[0] === 'm' ? '−' : ''}${c}`;
  } else html = `${fn} x = ${lab(k)}`;
  const a = k === null ? imp : val(k);
  const S = solK(fn, k);
  // propositions : la bonne et des erreurs typiques
  const cands = [S];
  if (k !== null) {
    cands.push(solK(oth, k), solK(fn, neg(k)));
    if (conj(k)) cands.push(solK(fn, conj(k)));
    if (S.length === 2) cands.push([fn === 'cos' ? acosK(k) : asinK(k)]);
    if (k === '0') cands.push(fn === 'cos' ? [6] : [0]);
  } else cands.push(solK(fn, imp > 0 ? '1' : 'm1'), solK(fn, imp > 0 ? 'h' : 'mh'));
  if (d >= 4) cands.push([]);
  const seen = new Set(), opts0 = [];
  cands.forEach(C => { const s = [...C].sort((u, v) => u - v), key = s.join(','); if (!seen.has(key) && (s.length || d >= 4)) { seen.add(key); opts0.push(s); } });
  for (const f of shuffle(['h', 'r2', 'r3', 'mh', 'mr2', 'mr3'])) { if (opts0.length >= 4) break; const s = solK(fn, f), key = s.join(','); if (!seen.has(key)) { seen.add(key); opts0.push(s); } }
  const opts = shuffle(opts0.slice(0, 5)).map((s, i) => ({ v: 's' + i, l: setLab(s), s }));
  const good = opts.find(o => o.s.join(',') === [...S].sort((u, v) => u - v).join(','));
  const line = fn === 'cos' ? { vline: { x: a, l: `x = ${k === null ? M(imp) : txt(k)}` } } : { hline: { y: a, l: `y = ${k === null ? M(imp) : txt(k)}` } };
  const vis = after => cercle({ marks: true, ...line, pts: after ? S.map(K => ({ t: rad(K), l: At(K) })) : [] });
  const pre = html.startsWith('2') || html.startsWith('5') ? (k === null ? `${fn} x = ${M(imp)}` : `${fn} x = ${lab(k)}`) : '';
  return {
    type: 'choice', html: `Résous dans ]−π ; π] l'équation <b>${html}</b>.`,
    visual: vis(false), afterVisual: vis(true), replaceVisual: true,
    opts: opts.map(({ v, l }) => ({ v, l })),
    check: choiceCheck(good.v, {
      msg: c => {
        const s = opts.find(o => o.v === c).s;
        if (S.length === 2 && s.length === 1 && S.includes(s[0])) return `Il manque une solution : la droite coupe le cercle en <b>deux</b> points.`;
        if (k !== null && s.join(',') === solK(oth, k).join(',')) return `Ce sont les solutions de ${oth} x = ${lab(k)}. Pour ${fn}, on lit sur l'axe ${fn === 'cos' ? 'horizontal' : 'vertical'}.`;
        if (!S.length && s.length) return `${fn} x est toujours entre −1 et 1 : regarde la valeur de ${fn} x.`;
        if (S.length && !s.length) return `${M(a)} est entre −1 et 1 : il y a des solutions.`;
        return '';
      },
    }),
    verify: c => {
      const s = opts.find(o => o.v === c).s;
      // force brute sur les multiples de π/12 de ]−π ; π] avec Math.cos / Math.sin
      const brute = [];
      for (let j = -11; j <= 12; j++) if (Math.abs(Math[fn](j * PI / 12) - a) < 1e-9) brute.push(j);
      if (brute.join(',') !== s.join(',')) return false;
      // échantillonnage fin : pas d'autre solution entre les multiples de π/12
      for (let i = 1; i <= 4800; i++) { const x = -PI + 2 * PI * i / 4800; if (Math.abs(Math[fn](x) - a) < 1e-4 && !s.some(K => Math.abs(Math.atan2(Math.sin(x - rad(K)), Math.cos(x - rad(K)))) < 0.02)) return false; }
      return true;
    },
    hint: k === null ? `${fn} x est toujours compris entre −1 et 1.` : `${pre ? `Commence par isoler ${fn} x : ${pre}. ` : ''}Trace la droite ${fn === 'cos' ? 'verticale x' : 'horizontale y'} = ${txt(k)} : elle coupe le cercle en ${S.length === 1 ? 'un seul point' : 'deux points'}. ${fn === 'cos' ? 'Les deux solutions sont opposées.' : 'Les deux solutions sont x et π − x.'}`,
    solution: k === null ? `${pre}. Or ${fn} x est toujours entre −1 et 1 : <b>aucune solution</b>.`
      : `${pre ? pre + '.<br>' : ''}${fn}(${A(fn === 'cos' ? acosK(k) : asinK(k))}) = ${lab(k)}.<br>${S.length === 1 ? 'La droite touche le cercle en un seul point.' : fn === 'cos' ? `Le symétrique par rapport à l'axe horizontal a le même cosinus : ${A(-S[0])} et ${A(S[0])}.` : `Le symétrique par rapport à l'axe vertical (π − x) a le même sinus.`}<br>Dans ]−π ; π] : <b>${setLab(S)}</b>.`,
  };
}
const L9 = d => equation('cos', d);
const L10 = d => equation('sin', d);
function C9() {
  return `<h2>9. Équation cos x = a</h2>
<p class="intro">Résoudre cos x = a, c'est chercher tous les points du cercle d'abscisse a, puis lire leurs réels dans ]−π ; π].</p>
<div class="def">On trace la droite <b>verticale</b> d'abscisse a. Si −1 &lt; a &lt; 1, elle coupe le cercle en <b>deux points symétriques</b> par rapport à l'axe horizontal.<br>Si cos α = a avec α ∈ [0 ; π], les solutions dans ]−π ; π] sont <b>α et −α</b>.<br>Si a &gt; 1 ou a &lt; −1 : <b>aucune solution</b> (un cosinus est toujours entre −1 et 1).</div>
${meth(['Isole cos x si besoin : 2 cos x + ' + R(2) + ' = 0 donne cos x = −' + F(R(2), 2) + '.', 'Si a n\'est pas entre −1 et 1 : aucune solution, c\'est fini.', 'Trouve α ∈ [0 ; π] avec cos α = a (tableau + symétrie si a &lt; 0).', 'Écris S = { −α ; α }. Cas particuliers : a = 1 donne seulement 0, a = −1 seulement π.'])}
<div class="cols"><div>
${exq(`Exemple 1 : cos x = ${F(1, 2)}`, `cos ${F('π', 3)} = ${F(1, 2)}, donc <b>S = { −${F('π', 3)} ; ${F('π', 3)} }</b>.`)}
${exq(`Exemple 2 : 2 cos x + ${R(2)} = 0`, `cos x = −${F(R(2), 2)}. cos ${F('π', 4)} = ${F(R(2), 2)} ; à gauche, c'est π − ${F('π', 4)} = ${F('3π', 4)}.<br><b>S = { −${F('3π', 4)} ; ${F('3π', 4)} }</b>.`)}
${exq('Exemple 3 : 2 cos x − 3 = 0 et cos x = 0', 'cos x = 1,5 &gt; 1 : <b>aucune solution</b>.<br>cos x = 0 : S = { −' + H2 + ' ; ' + H2 + ' } (points du haut et du bas).')}
</div><div>${cercle({ marks: true, vline: { x: 0.5, l: 'x = 1/2' }, pts: [{ t: PI / 3, l: 'π/3' }, { t: -PI / 3, l: '−π/3' }] })}
${cercle({ marks: true, vline: { x: -Math.SQRT2 / 2, l: 'x = −√2/2' }, pts: [{ t: 3 * PI / 4, l: '3π/4' }, { t: -3 * PI / 4, l: '−3π/4' }] })}</div></div>
<div class="warn">⚠️ N'oublie pas la deuxième solution (la calculatrice n'en donne qu'une).<br>⚠️ Pour cos, les deux solutions sont <b>opposées</b> : ne confonds pas avec sin.<br>⚠️ cos x = 1 n'a qu'une solution dans ]−π ; π] : x = 0 ; cos x = −1 : x = π.</div>
${ret('cos x = cos α ⟺ x = α ou x = −α (dans ]−π ; π]).')}`;
}
function C10() {
  return `<h2>10. Équation sin x = a</h2>
<p class="intro">Même idée que pour le cosinus, mais on lit cette fois sur l'axe vertical : on cherche les points du cercle d'ordonnée a.</p>
<div class="def">On trace la droite <b>horizontale</b> d'ordonnée a. Si −1 &lt; a &lt; 1, elle coupe le cercle en deux points <b>symétriques par rapport à l'axe vertical</b>.<br>Si sin α = a avec α ∈ [−${H2} ; ${H2}], les solutions sont <b>α et π − α</b> (on revient dans ]−π ; π] si besoin, en retirant 2π).<br>Si a &gt; 1 ou a &lt; −1 : <b>aucune solution</b>.</div>
${meth(['Isole sin x si besoin : 2 sin x − ' + R(3) + ' = 0 donne sin x = ' + F(R(3), 2) + '.', 'Si a n\'est pas entre −1 et 1 : aucune solution.', `Trouve α entre −${H2} et ${H2} avec sin α = a (négatif si a &lt; 0).`, 'Deuxième solution : π − α ; si elle dépasse π, retire 2π. Cas particuliers : sin x = 1 donne seulement ' + H2 + ', sin x = −1 seulement −' + H2 + '.'])}
<div class="cols"><div>
${exq(`Exemple 1 : 2 sin x − ${R(3)} = 0`, `sin x = ${F(R(3), 2)} ; α = ${F('π', 3)} et π − α = ${F('2π', 3)}.<br><b>S = { ${F('π', 3)} ; ${F('2π', 3)} }</b>.`)}
${exq(`Exemple 2 : sin x = −${F(1, 2)}`, `α = −${F('π', 6)} et π − α = ${F('7π', 6)} &gt; π, donc ${F('7π', 6)} − 2π = −${F('5π', 6)}.<br><b>S = { −${F('5π', 6)} ; −${F('π', 6)} }</b>.`)}
</div><div>${cercle({ marks: true, hline: { y: Math.sqrt(3) / 2, l: 'y = √3/2' }, pts: [{ t: PI / 3, l: 'π/3' }, { t: 2 * PI / 3, l: '2π/3' }] })}
${cercle({ marks: true, hline: { y: -0.5, l: 'y = −1/2' }, pts: [{ t: -PI / 6, l: '−π/6' }, { t: -5 * PI / 6, l: '−5π/6' }] })}</div></div>
<div class="warn">⚠️ Pour le sinus, les solutions ne sont pas opposées : ce sont α et π − α.<br>⚠️ sin x = 0 a deux solutions dans ]−π ; π] : 0 et π.<br>⚠️ Ne réponds pas avec les solutions de cos x = a : lis bien sur l'axe vertical.</div>
${ret('sin x = sin α ⟺ x = α ou x = π − α (ramené dans ]−π ; π]).')}`;
}

/* =====================================================================
   11. Signes, inéquations sur le cercle
   ===================================================================== */
const SIGNS = [{ v: 'pp', l: 'cos x &gt; 0 et sin x &gt; 0' }, { v: 'pm', l: 'cos x &gt; 0 et sin x &lt; 0' }, { v: 'mp', l: 'cos x &lt; 0 et sin x &gt; 0' }, { v: 'mm', l: 'cos x &lt; 0 et sin x &lt; 0' }];
const I_ = (lo, lc, hi, hc) => ({ lo, lc, hi, hc });
/** ensemble solution de f(x) ≥ a (ge) ou ≤ a, large (cl) ou strict, sur D1 = ]−π ; π] ou D2 = [0 ; 2π[ ; douzièmes */
function ineqSet(fn, ge, cl, k, dom) {
  if (fn === 'cos') {
    const K0 = acosK(k);
    if (dom === 1) return ge ? [I_(-K0, cl, K0, cl)] : [I_(-12, false, -K0, cl), I_(K0, cl, 12, true)];
    return ge ? [I_(0, true, K0, cl), I_(24 - K0, cl, 24, false)] : [I_(K0, cl, 24 - K0, cl)];
  }
  const K1 = asinK(k);
  if (dom === 1) {
    if (K1 > 0) return ge ? [I_(K1, cl, 12 - K1, cl)] : [I_(-12, false, K1, cl), I_(12 - K1, cl, 12, true)];
    return ge ? [I_(-12, false, -12 - K1, cl), I_(K1, cl, 12, true)] : [I_(-12 - K1, cl, K1, cl)];
  }
  if (K1 > 0) return ge ? [I_(K1, cl, 12 - K1, cl)] : [I_(0, true, K1, cl), I_(12 - K1, cl, 24, false)];
  return ge ? [I_(0, true, 12 - K1, cl), I_(24 + K1, cl, 24, false)] : [I_(12 - K1, cl, 24 + K1, cl)];
}
const ivLab = S => S.map(I => `${I.lc ? '[' : ']'}${A(I.lo)} ; ${A(I.hi)}${I.hc ? ']' : '['}`).join(' ∪ ');
const inS = (S, x) => S.some(I => {
  const lo = rad(I.lo), hi = rad(I.hi);
  return (x > lo + 1e-9 || (I.lc && Math.abs(x - lo) < 1e-9)) && (x < hi - 1e-9 || (I.hc && Math.abs(x - hi) < 1e-9));
});
function L11(d) {
  if (d < 2) {
    const k = pick(REM.filter(k => k % 6)), K = d < 1 ? k : k + pick([-24, -24, 24]);
    // la réponse attendue est calculée par le quart de cercle (et non par Math.cos)
    const kk = md(K), E = kk < 6 ? 'pp' : kk < 12 ? 'mp' : kk < 18 ? 'mm' : 'pm';
    const vis = after => cercle({ marks: true, arc: { t: rad(K) }, pts: [{ t: rad(K), l: At(K), proj: after }] });
    return {
      type: 'choice', html: `Pour x = <b>${A(K)}</b>, quels sont les signes de cos x et de sin x ?`,
      visual: vis(false), afterVisual: vis(true), replaceVisual: true, opts: SIGNS,
      check: choiceCheck(E, { msg: c => (c[0] === E[0] ? 'Le signe du cosinus est bon ; le sinus se lit sur l\'axe vertical : le point est-il en haut ou en bas ?' : c[1] === E[1] ? 'Le signe du sinus est bon ; le cosinus se lit sur l\'axe horizontal : le point est-il à droite ou à gauche ?' : '') }),
      verify: c => (c[0] === 'p') === (Math.cos(K * PI / 12) > 0) && (c[1] === 'p') === (Math.sin(K * PI / 12) > 0),
      hint: 'Place le point. À droite de l\'axe vertical : cos x &gt; 0. Au-dessus de l\'axe horizontal : sin x &gt; 0.',
      solution: `${A(K)} est dans le ${kk < 6 ? 'premier' : kk < 12 ? 'deuxième' : kk < 18 ? 'troisième' : 'quatrième'} quart du cercle : le point est ${E[1] === 'p' ? 'en haut' : 'en bas'} à ${E[0] === 'p' ? 'droite' : 'gauche'}.<br>Donc <b>${SIGNS.find(s => s.v === E).l}</b>.`,
    };
  }
  const fn = d < 3 ? 'cos' : d < 4 ? 'sin' : pick(['cos', 'sin']);
  const dom = d < 4 ? 1 : d < 5 ? 2 : pick([1, 2]);
  const ge = chance(0.5), cl = d < 4 ? true : chance(0.5);
  const k = pick(['h', 'r2', 'r3', 'mh', 'mr2', 'mr3']);
  const S = ineqSet(fn, ge, cl, k, dom);
  const oth = fn === 'cos' ? 'sin' : 'cos';
  const cands = [S, ineqSet(fn, !ge, cl, k, dom), ineqSet(oth, ge, cl, k, dom), conj(k) ? ineqSet(fn, ge, cl, conj(k), dom) : ineqSet(fn, ge, cl, neg(k), dom)];
  if (d >= 4) cands.push(ineqSet(fn, ge, !cl, k, dom));
  const seen = new Set(), list = [];
  cands.forEach(C => { const l = ivLab(C); if (!seen.has(l)) { seen.add(l); list.push(C); } });
  const opts = shuffle(list.slice(0, 4)).map((s, i) => ({ v: 'i' + i, l: `S = ${ivLab(s)}`, s }));
  const good = opts.find(o => ivLab(o.s) === ivLab(S));
  const op = ge ? (cl ? '≥' : '&gt;') : (cl ? '≤' : '&lt;'), a = val(k);
  const D = dom === 1 ? ']−π ; π]' : '[0 ; 2π[';
  const line = fn === 'cos' ? { vline: { x: a, l: `x = ${txt(k)}` } } : { hline: { y: a, l: `y = ${txt(k)}` } };
  const ends = S.flatMap(I => [I.lo, I.hi].map((K, j) => ({ K, open: !(j ? I.hc : I.lc) }))).filter(e => md(e.K) !== (dom === 1 ? 12 : 0) || Math.abs(Math[fn](rad(e.K)) - a) < 1e-9);
  const vis = after => cercle({ marks: true, ...line, arcs: after ? S.map(I => ({ a: rad(I.lo), b: rad(I.hi) })) : [], ends: after ? ends.filter(e => Math.abs(Math[fn](rad(e.K)) - a) < 1e-9).map(e => ({ t: rad(e.K), open: e.open })) : [] });
  const pred = x => (dom === 1 ? x > -PI + 1e-9 && x <= PI + 1e-9 : x >= -1e-9 && x < 2 * PI - 1e-9) && (ge ? (cl ? Math[fn](x) >= a - 1e-9 : Math[fn](x) > a + 1e-9) : (cl ? Math[fn](x) <= a + 1e-9 : Math[fn](x) < a - 1e-9));
  return {
    type: 'choice', html: `Résous dans <b>${D}</b> l'inéquation <b>${fn} x ${op} ${lab(k)}</b>.`,
    visual: vis(false), afterVisual: vis(true), replaceVisual: true,
    opts: opts.map(({ v, l }) => ({ v, l })),
    check: choiceCheck(good.v, {
      msg: c => {
        const s = opts.find(o => o.v === c).s;
        if (ivLab(s) === ivLab(ineqSet(fn, !ge, cl, k, dom))) return `C'est l'ensemble où ${fn} x est ${ge ? 'plus petit' : 'plus grand'}. On cherche ${fn} x ${op} ${lab(k)}.`;
        if (ivLab(s) === ivLab(ineqSet(fn, ge, !cl, k, dom))) return 'Les bornes sont bonnes : vérifie les crochets (inégalité large ou stricte ?).';
        if (ivLab(s) === ivLab(ineqSet(oth, ge, cl, k, dom))) return `Ce serait pour ${oth} x. Pour ${fn} x, on lit sur l'axe ${fn === 'cos' ? 'horizontal' : 'vertical'}.`;
        return '';
      },
    }),
    verify: c => {
      const s = opts.find(o => o.v === c).s;
      for (let j = -24; j <= 48; j++) { const x = j * PI / 24; const inD = dom === 1 ? x > -PI + 1e-9 && x <= PI + 1e-9 : x >= -1e-9 && x < 2 * PI - 1e-9; if (inD && inS(s, x) !== pred(x)) return false; }
      return true;
    },
    hint: `Trace la droite ${fn === 'cos' ? 'verticale x' : 'horizontale y'} = ${txt(k)}. Les points du cercle où ${fn} x ${op} ${lab(k)} sont ${fn === 'cos' ? (ge ? 'à droite' : 'à gauche') : (ge ? 'au-dessus' : 'en dessous')} de cette droite. Puis lis l'arc correspondant en restant dans ${D}.`,
    solution: `${fn} x = ${lab(k)} pour x = ${solK(fn, k).map(K => (dom === 2 && K < 0 ? K + 24 : K)).sort((u, v) => u - v).map(A).join(' et x = ')} (dans ${D}).<br>Les points ${fn === 'cos' ? (ge ? 'à droite' : 'à gauche') : (ge ? 'au-dessus' : 'en dessous')} de la droite forment l'arc coloré${dom === 2 ? ', qu\'on lit dans [0 ; 2π[' : ''}.<br><b>S = ${ivLab(S)}</b>${cl ? ' (bornes comprises : inégalité large)' : ' (bornes exclues : inégalité stricte)'}.`,
  };
}
function C11() {
  return `<h2>11. Signes et inéquations sur le cercle</h2>
<p class="intro">Le cercle permet de voir d'un coup d'œil le signe de cos x et de sin x, et de résoudre des inéquations : on colorie l'arc des points qui conviennent.</p>
<div class="def"><b>cos x &gt; 0</b> quand le point est à <b>droite</b> de l'axe vertical, <b>sin x &gt; 0</b> quand il est <b>au-dessus</b> de l'axe horizontal.<br>Pour <b>cos x ≥ a</b> : on garde l'arc du cercle à droite de la droite verticale x = a (à gauche pour ≤). Pour <b>sin x ≥ a</b> : l'arc au-dessus de la droite y = a (en dessous pour ≤).</div>
<div class="cols">${exq('Exemple 1 : signes pour x = −' + F('3π', 4), `−${F('3π', 4)} : on tourne dans le sens des aiguilles d'une montre, le point est en bas à gauche.<br>Donc <b>cos x &lt; 0 et sin x &lt; 0</b>.<br>Sur la figure, chaque quart porte (signe de cos x ; signe de sin x).`)}
${cercle({ marks: true, noGrad: true, pts: [{ t: -3 * PI / 4, l: '−3π/4', proj: true }], tl: [{ t: PI / 4, l: '(+ ; +)', c: COL.sin }, { t: 3 * PI / 4, l: '(− ; +)', c: COL.sin }, { t: 5 * PI / 4, l: '(− ; −)', c: COL.sin }, { t: 7 * PI / 4, l: '(+ ; −)', c: COL.sin }] })}</div>
${meth(['Résous d\'abord l\'équation : trouve les deux réels où cos x (ou sin x) vaut exactement a.', 'Trace la droite (verticale pour cos, horizontale pour sin) et colorie l\'arc du bon côté.', 'Lis l\'arc dans le sens direct, en restant dans l\'intervalle demandé : ]−π ; π] ou [0 ; 2π[. S\'il passe par la borne de l\'intervalle, il se coupe en deux morceaux (∪).', 'Crochets : inégalité large (≤, ≥) → bornes comprises ; stricte (&lt;, &gt;) → bornes exclues.'])}
<div class="cols"><div>
${exq(`Exemple 2 : cos x ≥ ${F(1, 2)}`, `Dans ]−π ; π] : l'arc va de −${F('π', 3)} à ${F('π', 3)}, <b>${nw(`S = [−${F('π', 3)} ; ${F('π', 3)}]`)}</b>.<br>Dans [0 ; 2π[, le même arc se lit en deux morceaux : S = [0 ; ${F('π', 3)}] ∪ [${F('5π', 3)} ; 2π[.`)}
${exq(`Exemple 3 : ${nw(`sin x &lt; −${F(R(2), 2)}`)} dans [0 ; 2π[`, `sin x = −${F(R(2), 2)} pour ${F('5π', 4)} et ${F('7π', 4)}. On garde l'arc en dessous, bornes exclues : <b>${nw(`S = ]${F('5π', 4)} ; ${F('7π', 4)}[`)}</b>.`)}
</div><div>${cercle({ marks: true, vline: { x: 0.5, l: 'x = 1/2' }, arcs: [{ a: -PI / 3, b: PI / 3 }], ends: [{ t: -PI / 3 }, { t: PI / 3 }], tl: [{ t: PI / 3, l: 'π/3' }, { t: -PI / 3, l: '−π/3' }] })}
${cercle({ marks: true, hline: { y: -Math.SQRT2 / 2, l: 'y = −√2/2' }, arcs: [{ a: 5 * PI / 4, b: 7 * PI / 4 }], ends: [{ t: 5 * PI / 4, open: true }, { t: 7 * PI / 4, open: true }], tl: [{ t: 5 * PI / 4, l: '5π/4' }, { t: 7 * PI / 4, l: '7π/4' }] })}</div></div>
<div class="warn">⚠️ Inégalité stricte (&gt;, &lt;) : bornes exclues, crochets tournés vers l'extérieur.<br>⚠️ Ne prends pas l'arc du mauvais côté : relis le sens de l'inégalité.<br>⚠️ Lis l'arc dans l'intervalle demandé : ]−π ; π] et [0 ; 2π[ ne donnent pas la même écriture.</div>
${ret('on résout d\'abord l\'égalité, puis on lit l\'arc colorié dans le sens direct, avec les bons crochets.')}`;
}

/* =====================================================================
   12. Fonctions cosinus et sinus
   ===================================================================== */
const XL2 = [-4, -3, -2, -1, 1, 2, 3, 4].map(k => ({ x: k * PI / 2, l: piT(...red(k, 2)) }));
const COMPO = [
  { l: 'x<sup>2</sup> cos x', f: x => x * x * Math.cos(x), p: 'paire' },
  { l: 'x sin x', f: x => x * Math.sin(x), p: 'paire' },
  { l: 'cos x + x<sup>2</sup>', f: x => Math.cos(x) + x * x, p: 'paire' },
  { l: 'sin<sup>2</sup> x', f: x => Math.sin(x) ** 2, p: 'paire' },
  { l: 'x cos x', f: x => x * Math.cos(x), p: 'impaire' },
  { l: 'sin x cos x', f: x => Math.sin(x) * Math.cos(x), p: 'impaire' },
  { l: 'x<sup>3</sup> + sin x', f: x => x ** 3 + Math.sin(x), p: 'impaire' },
  { l: 'cos x + x', f: x => Math.cos(x) + x, p: 'ni' },
  { l: 'sin x + 1', f: x => Math.sin(x) + 1, p: 'ni' },
  { l: 'sin x + cos x', f: x => Math.sin(x) + Math.cos(x), p: 'ni' },
];
const PAR = [{ v: 'paire', l: 'paire : f(−x) = f(x)' }, { v: 'impaire', l: 'impaire : f(−x) = −f(x)' }, { v: 'ni', l: 'ni paire, ni impaire' }];
/** parité constatée numériquement */
const parity = f => { const xs = [0.3, 0.7, 1.1, 1.9, 2.6]; return xs.every(x => near(f(-x), f(x), 1e-9)) ? 'paire' : xs.every(x => near(f(-x), -f(x), 1e-9)) ? 'impaire' : 'ni'; };
function L12(d) {
  const kind = d < 1 ? 'par' : d < 2 ? 'lire' : d < 3 ? 'per' : d < 4 ? 'compo' : d < 5 ? 'nb' : pick(['quelle', 'nb', 'compo', 'per']);
  const fn = pick(['cos', 'sin']), f = Math[fn];
  if (kind === 'par' || kind === 'compo') {
    const C = kind === 'par' ? { l: `${fn} x`, f, p: fn === 'cos' ? 'paire' : 'impaire' } : pick(COMPO);
    const W = kind === 'par' ? 2 * PI : PI;
    let lo = 0, hi = 0; for (let i = 0; i <= 200; i++) { const y = C.f(-W + 2 * W * i / 200); lo = Math.min(lo, y); hi = Math.max(hi, y); }
    const yr = [Math.floor(Math.min(-1.5, lo - 0.5)), Math.ceil(Math.max(1.5, hi + 0.5))];
    return {
      type: 'choice', html: `La fonction <b>f(x) = ${C.l}</b> (définie sur ℝ) est :`,
      visual: courbe({ xr: [-W, W], yr, fs: [{ f: C.f, l: 'y = f(x)' }], xl: W === PI ? XL2.filter(g => Math.abs(g.x) <= PI + 1e-9) : undefined }),
      opts: PAR,
      check: choiceCheck(C.p, { msg: c => (c === 'paire' && C.p === 'impaire' ? 'Une fonction paire a une courbe symétrique par rapport à l\'axe vertical ; ici la symétrie est par rapport à l\'origine O.' : c === 'impaire' && C.p === 'paire' ? 'Une fonction impaire a une courbe symétrique par rapport à O ; ici la symétrie est par rapport à l\'axe vertical.' : '') }),
      verify: c => parity(C.f) === c,
      hint: kind === 'par' ? 'Sur le cercle : −x est le symétrique de x par rapport à l\'axe horizontal. Que deviennent cos et sin ?' : 'Calcule f(−x) avec cos(−x) = cos x, sin(−x) = −sin x et (−x)<sup>2</sup> = x<sup>2</sup>, puis compare à f(x).',
      solution: kind === 'par' ? (fn === 'cos' ? 'cos(−x) = cos x : la fonction cosinus est <b>paire</b> (courbe symétrique par rapport à l\'axe des ordonnées).' : 'sin(−x) = −sin x : la fonction sinus est <b>impaire</b> (courbe symétrique par rapport à l\'origine).')
        : `On calcule f(−x) avec cos(−x) = cos x et sin(−x) = −sin x. ${C.p === 'paire' ? 'On retrouve f(x) : f est <b>paire</b>.' : C.p === 'impaire' ? 'On trouve −f(x) : f est <b>impaire</b>.' : 'On ne retrouve ni f(x) ni −f(x) (essaie x = π/2) : f n\'est <b>ni paire ni impaire</b>.'}`,
    };
  }
  if (kind === 'lire' || kind === 'per') {
    const k = ri(-4, 4), n = kind === 'per' ? pick([1, -1]) * ri(2, 12) : 0;
    const K = 6 * k + 24 * n;          // multiples de π/2 : valeurs 0, 1 ou −1
    const Ek = KEYF[fn](K), E2 = Ek === 'm1' ? -1 : Ek === '1' ? 1 : 0;
    const vis = after => courbe({ xr: [-2 * PI, 2 * PI], fs: [{ f, l: `y = ${fn} x` }], xl: XL2, pts: after || kind === 'lire' ? [{ x: k * PI / 2, y: f(k * PI / 2) }] : [] });
    return {
      type: 'nums', keys: { comma: false },
      html: kind === 'lire' ? `Voici la courbe de la fonction ${fn}. Lis <b>${fn}(${A(K)})</b>.` : `La courbe de ${fn} est tracée sur [−2π ; 2π]. La fonction ${fn} est <b>2π-périodique</b>.<br>Que vaut <b>${fn}(${A(K)})</b> ?`,
      visual: vis(false), afterVisual: vis(true), replaceVisual: true,
      tpl: `${fn}(${A(K)}) = {0}`,
      check: chk(E2, v => (near(v, -E2) && E2 ? 'Attention au signe : regarde si la courbe est au-dessus ou en dessous de l\'axe.' : kind === 'per' ? `Enlève des périodes de 2π pour revenir à ${At(6 * k)}.` : '')),
      value: Math.round(f(K * PI / 12)),
      hint: kind === 'lire' ? `Repère ${At(K)} sur l'axe horizontal et lis la hauteur de la courbe.` : `${fn}(x + 2π) = ${fn}(x) : retire ${Math.abs(n)} fois 2π (${Math.abs(n)} tours) pour revenir dans [−2π ; 2π].`,
      solution: `${kind === 'per' ? `${At(K)} = ${At(6 * k)} ${n > 0 ? '+' : '−'} ${Math.abs(n)} × 2π, et ${fn} est 2π-périodique : ${fn}(${A(K)}) = ${fn}(${A(6 * k)}).<br>` : ''}Sur la courbe, au point d'abscisse ${At(6 * k)}, on lit <b>${M(E2)}</b>.`,
    };
  }
  if (kind === 'nb') {
    const a = pick([0.3, 0.4, 0.6, 0.8, -0.3, -0.5, -0.7]);
    const [lo, hi, ivl] = pick([[0, 2 * PI, '[0 ; 2π]'], [-PI, PI, '[−π ; π]'], [-2 * PI, 2 * PI, '[−2π ; 2π]'], [0, 3 * PI, '[0 ; 3π]'], [-PI, 2 * PI, '[−π ; 2π]']]);
    // comptage par raisonnement : solutions de base + multiples de 2π
    const base = fn === 'cos' ? [Math.acos(a), -Math.acos(a)] : [Math.asin(a), PI - Math.asin(a)];
    let E = 0; for (const b of base) for (let n = -4; n <= 4; n++) { const x = b + 2 * n * PI; if (x >= lo - 1e-9 && x <= hi + 1e-9) E++; }
    // vérification : changements de signe de f(x) − a sur une grille fine
    let cnt = 0, prev = f(lo) - a; for (let i = 1; i <= 20000; i++) { const cur = f(lo + (hi - lo) * i / 20000) - a; if (prev * cur < 0) cnt++; prev = cur; }
    return {
      type: 'nums', keys: { comma: false, neg: false },
      html: `Combien l'équation <b>${fn} x = ${M(a)}</b> a-t-elle de solutions dans <b>${ivl}</b> ?`,
      visual: courbe({ xr: [-2 * PI, 3 * PI], fs: [{ f, l: `y = ${fn} x` }], h: { y: a, l: `y = ${M(a)}` }, band: { x: [lo, hi], l: ivl }, xl: [-2, -1, 1, 2, 3].map(k => ({ x: k * PI, l: piT(k, 1) })) }),
      tpl: 'nombre de solutions : {0}',
      check: chk(E, v => (v === E + 1 || v === E - 1 ? 'Presque : vérifie les bords de l\'intervalle et compte chaque croisement une seule fois.' : '')),
      value: cnt,
      hint: `Compte les points où la droite y = ${M(a)} coupe la courbe, en ne gardant que les abscisses dans ${ivl}. Sur une période de 2π, il y en a 2.`,
      solution: `Sur chaque intervalle de longueur 2π, la droite coupe la courbe 2 fois. Dans ${ivl}, on compte <b>${E}</b> points d'intersection.`,
    };
  }
  // quelle fonction ?
  const CH = [{ v: 'c', l: 'y = cos x', f: x => Math.cos(x) }, { v: 's', l: 'y = sin x', f: x => Math.sin(x) }, { v: 'mc', l: 'y = −cos x', f: x => -Math.cos(x) }, { v: 'ms', l: 'y = −sin x', f: x => -Math.sin(x) }];
  const G = pick(CH);
  return {
    type: 'choice', html: 'Quelle fonction a pour courbe celle-ci ?',
    visual: courbe({ xr: [-2 * PI, 2 * PI], fs: [{ f: G.f }], xl: XL2 }),
    opts: CH.map(({ v, l }) => ({ v, l })),
    check: choiceCheck(G.v, { msg: () => 'Regarde la valeur en 0 : cos 0 = 1 et sin 0 = 0. Puis regarde si la courbe monte ou descend juste après 0.' }),
    verify: c => { const g = CH.find(o => o.v === c).f; return [0.4, 1.3, 2.2, -0.8, 3.7].every(x => near(g(x), G.f(x))); },
    hint: 'Lis f(0) : 1 pour cos, −1 pour −cos, 0 pour sin et −sin. Puis regarde le sens de variation juste après 0.',
    solution: `f(0) = ${M(r6(G.f(0)))}${G.v.endsWith('s') ? ` et la courbe ${G.v === 's' ? 'monte' : 'descend'} après 0` : ''} : c'est <b>${G.l}</b>.`,
  };
}
function C12() {
  return `<h2>12. Fonctions cosinus et sinus</h2>
<p class="intro">x ↦ cos x et x ↦ sin x sont des fonctions définies sur ℝ. Leurs courbes en « vagues » résument tout ce que tu as vu sur le cercle.</p>
<div class="def">cos et sin sont définies sur ℝ, à valeurs dans [−1 ; 1].<br>• <b>2π-périodiques</b> : cos(x + 2π) = cos x, sin(x + 2π) = sin x (la courbe se répète tous les 2π).<br>• cos est <b>paire</b> : cos(−x) = cos x (courbe symétrique par rapport à l'axe des ordonnées).<br>• sin est <b>impaire</b> : sin(−x) = −sin x (courbe symétrique par rapport à O).</div>
${meth(['Parité : calcule f(−x) avec cos(−x) = cos x, sin(−x) = −sin x, (−x)<sup>2</sup> = x<sup>2</sup> ; compare à f(x) et à −f(x).', 'Grand réel : retire des périodes de 2π pour revenir dans [−2π ; 2π], puis lis la courbe.', 'Reconnaître une courbe : lis f(0) (1 pour cos, 0 pour sin), puis regarde si elle monte ou descend juste après 0.', 'Nombre de solutions de cos x = a ou sin x = a : trace la droite y = a et compte les croisements dont l\'abscisse est dans l\'intervalle.'])}
<div class="cols">
${exq('Exemple 1 : périodicité', `${nw(`cos(${F('9π', 2)})`)} = cos(${H2} + 2 × 2π) = cos(${H2}) = <b>0</b>.<br>${nw(`sin(−${F('7π', 2)})`)} = sin(${H2} − 2 × 2π) = sin(${H2}) = <b>1</b>.`)}
${exq('Exemple 2 : parité', 'f(x) = x sin x : f(−x) = (−x) × (−sin x) = x sin x = f(x), donc f est <b>paire</b>.<br>g(x) = x cos x : g(−x) = (−x) cos x = −g(x), donc g est <b>impaire</b>.')}
</div>
${courbe({ xr: [-2 * PI, 2 * PI], fs: [{ f: Math.cos, l: 'y = cos x', c: COL.cos }, { f: Math.sin, l: 'y = sin x', c: COL.sin }], xl: XL2 })}
<div class="cols">${exq('Exemple 3 : cos x = 0,4 dans [0 ; 3π]', 'La droite y = 0,4 coupe la courbe de cos 2 fois sur [0 ; 2π], puis encore 1 fois entre 2π et 3π : <b>3 solutions</b>.')}
${courbe({ xr: [0, 3 * PI], fs: [{ f: Math.cos, l: 'y = cos x', c: COL.cos }], h: { y: 0.4, l: 'y = 0,4' }, pts: [Math.acos(0.4), 2 * PI - Math.acos(0.4), 2 * PI + Math.acos(0.4)].map(x => ({ x, y: 0.4, c: COL.A })) })}</div>
<div class="warn">⚠️ cos 0 = 1 et sin 0 = 0 : c'est le plus simple pour reconnaître les courbes.<br>⚠️ Paire : symétrie par rapport à l'axe des ordonnées ; impaire : symétrie par rapport à O. Ne les échange pas.<br>⚠️ Une période de 2π contient en général <b>deux</b> solutions de cos x = a (−1 &lt; a &lt; 1) : attention aux bords de l'intervalle.</div>
${ret('cos et sin sont 2π-périodiques ; cos est paire, sin est impaire.')}`;
}

/* ================= niveaux ================= */
const LEVELS_ = [
  { titre: 'Degrés → radians', generate: L1, cours: C1 },
  { titre: 'Radians → degrés', generate: L2, cours: C2 },
  { titre: 'Repérer un point du cercle', generate: L3, cours: C3 },
  { titre: 'Mesure principale', generate: L4, cours: C4 },
  { titre: 'cos et sin des angles remarquables', generate: L5, cours: C5 },
  { titre: 'Angles associés : −x, π − x, π + x', generate: L6, cours: C6 },
  { titre: 'Angles associés : π/2 − x, π/2 + x', generate: L7, cours: C7 },
  { titre: 'cos² x + sin² x = 1', generate: L8, cours: C8 },
  { titre: 'Équation cos x = a', generate: L9, cours: C9 },
  { titre: 'Équation sin x = a', generate: L10, cours: C10 },
  { titre: 'Signes et inéquations', generate: L11, cours: C11 },
  { titre: 'Fonctions cos et sin', generate: L12, cours: C12 },
];
export const LEVELS = LEVELS_.map(L => ({ classe: '1re', ...L }));
export const OPTIONS = { need: 4, keys: { comma: true } };
// exports pour les tests éventuels
export { cosKey, sinKey, solK, ineqSet };

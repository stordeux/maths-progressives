// Niveaux 5 et 6 : évolutions ; conversions d'unités.
import { ri, pick, shuffle, M, F, big, sup, ent, dec, gcd, niveau } from './outils.js';
import { r6 } from '../../engine/util/arith.js';

const pcl = x => `${dec(x)}&nbsp;%`;
const sg = t => (t === 0 ? '0&nbsp;%' : `${t < 0 ? '−' : '+'}${dec(Math.abs(t))}&nbsp;%`);
const eur = x => `${dec(x)}&nbsp;€`;
const OBJ = [['un article', 'coûte', 400], ['un manteau', 'coûte', 240], ['un forfait', 'coûte', 80], ['un livre', 'coûte', 60], ['une paire de baskets', 'coûte', 160], ['un abonnement', 'coûte', 60]];

/* =================== NIVEAU 5 : évolutions =================== */
const coefH = {
  id: 'ev-coef-h', dmin: 0, titre: 'coefficient multiplicateur d’une hausse',
  draw() { return { t: pick([5, 10, 15, 20, 25, 30, 40, 50, 12, 8, 3, 60, 75, 100]) }; },
  ex: { t: 20 },
  build({ t }) {
    const c = 1 + t / 100;
    return {
      html: `Augmenter une quantité de <b>${t}&nbsp;%</b> revient à la multiplier par :`,
      good: { l: dec(c), n: c },
      bads: [
        { l: dec(t / 100), n: t / 100, why: `Multiplier par ${dec(t / 100)} reviendrait à garder seulement ${t} % de la quantité : on la <b>diminue</b>. Pour une hausse, on part de 100 % et on ajoute.` },
        { l: dec(1 - t / 100), n: 1 - t / 100, why: 'Ce coefficient correspond à une <b>baisse</b> de ' + t + ' %.' },
        { l: dec(t), n: t, why: 'Tu as multiplié par le pourcentage lui-même : il faut le diviser par 100.' },
        t <= 30 ? { l: dec(1 + t / 10), n: 1 + t / 10, why: 'Décalage de virgule : ' + t + ' % = ' + dec(t / 100) + ', donc 1 + ' + dec(t / 100) + '.' } : { l: dec(1 + t / 1000), n: 1 + t / 1000, why: 'Décalage de virgule : ' + t + ' % = ' + dec(t / 100) + '.' },
        { l: dec(t + 1), n: t + 1, why: 'On ajoute ' + t + ' % = ' + dec(t / 100) + ' à 1 (et non ' + t + ' à 1).' },
      ],
      hint: `Une hausse de ${t} % : la quantité vaut maintenant 100 % + ${t} % = ${100 + t} % de l’ancienne. Écris ${100 + t} % en décimal.`,
      solution: `100 % + ${t} % = ${100 + t} % = ${dec(c)}. Le coefficient multiplicateur est ${dec(c)}.`,
      indep: () => (100 + t) / 100,
    };
  },
};
const coefB = {
  id: 'ev-coef-b', dmin: 0, titre: 'coefficient multiplicateur d’une baisse',
  draw() { return { t: pick([5, 10, 15, 20, 25, 30, 40, 50, 12, 8, 3, 60, 75]) }; },
  ex: { t: 30 },
  build({ t }) {
    const c = 1 - t / 100;
    return {
      html: `Diminuer une quantité de <b>${t}&nbsp;%</b> revient à la multiplier par :`,
      good: { l: dec(c), n: c },
      bads: [
        { l: dec(t / 100), n: t / 100, why: 'Multiplier par ' + dec(t / 100) + ' ne garde que ' + t + ' % de la quantité : il faut garder 100 % − ' + t + ' %.' },
        { l: dec(1 + t / 100), n: 1 + t / 100, why: 'Ce coefficient correspond à une <b>hausse</b> de ' + t + ' %.' },
        { l: dec(-t / 100), n: -t / 100, why: 'Un coefficient multiplicateur est positif : on garde ' + (100 - t) + ' % de la quantité.' },
        t <= 10 ? { l: dec(1 - t / 10), n: 1 - t / 10, why: 'Décalage de virgule : ' + t + ' % = ' + dec(t / 100) + '.' } : { l: dec(1 - t / 1000), n: 1 - t / 1000, why: 'Décalage de virgule : ' + t + ' % = ' + dec(t / 100) + '.' },
        { l: dec(100 - t), n: 100 - t, why: 'Il faut écrire ' + (100 - t) + ' % en décimal : ' + dec(c) + '.' },
      ],
      hint: `Une baisse de ${t} % : il reste 100 % − ${t} % = ${100 - t} % de l’ancienne valeur. Écris ${100 - t} % en décimal.`,
      solution: `100 % − ${t} % = ${100 - t} % = ${dec(c)}. Le coefficient multiplicateur est ${dec(c)}.`,
      indep: () => (100 - t) / 100,
    };
  },
};
const drawApp = d => {
  const t = pick(d < 3 ? [10, 20, 25, 50] : [10, 20, 25, 50, 15, 30, 40, 5]);
  const o = pick(OBJ), step = 100 / gcd(t, 100), p = step * ri(Math.ceil(20 / step), Math.floor(Math.min(o[2], 100 * step) / step));
  return { t, p, o };
};
const appliquer = hausse => ({
  id: hausse ? 'ev-app-h' : 'ev-app-b', dmin: 1, titre: hausse ? 'appliquer une hausse' : 'appliquer une baisse',
  draw: drawApp,
  ex: hausse ? { t: 20, p: 60, o: ['un manteau', 'coûte', 240] } : { t: 25, p: 80, o: ['un forfait', 'coûte', 80] },
  build({ t, p, o }) {
    const v = p * t / 100, g = hausse ? p + v : p - v;
    return {
      html: `${o[0][0].toUpperCase() + o[0].slice(1)} ${o[1]} ${eur(p)}. Son prix ${hausse ? 'augmente' : 'baisse'} de <b>${t}&nbsp;%</b>. Quel est son nouveau prix ?`,
      good: { l: eur(g), n: g },
      bads: [
        { l: eur(v), n: v, why: `Tu as calculé ${t} % de ${p} € (la variation), mais pas le nouveau prix.` },
        { l: eur(hausse ? p + t : p - t), n: hausse ? p + t : p - t, why: `${t} % n’est pas ${t} € : le pourcentage s’applique au prix.` },
        { l: eur(hausse ? p - v : p + v), n: hausse ? p - v : p + v, why: `Tu as ${hausse ? 'diminué' : 'augmenté'} au lieu de ${hausse ? 'augmenter' : 'diminuer'}.` },
        { l: eur(p * t / 10 + (hausse ? p : -p) * 0 + p), n: p * t / 10 + p, why: 'Décalage de virgule dans le calcul du pourcentage.' },
      ],
      hint: `Calcule ${t} % de ${p} € (la variation), puis ${hausse ? 'ajoute-la au' : 'retranche-la du'} prix de départ. Ou multiplie ${p} par ${dec(hausse ? 1 + t / 100 : 1 - t / 100)}.`,
      solution: `${t} % de ${p} € = ${eur(v)}. Nouveau prix : ${p} ${hausse ? '+' : '−'} ${dec(v)} = ${eur(g)} (ou ${p} × ${dec(hausse ? 1 + t / 100 : 1 - t / 100)} = ${dec(g)}).`,
      indep: () => p * (1 + (hausse ? 1 : -1) * t / 100),
    };
  },
});
const taux = {
  id: 'ev-taux', dmin: 2, titre: 'calculer un taux d’évolution',
  draw() {
    for (;;) {
      const t = pick([10, 20, 25, 30, 40, 50, 100, -10, -20, -25, -30, -40, -50]), step = 100 / gcd(Math.abs(t), 100);
      const o = pick(OBJ), a = step * ri(Math.ceil(20 / step), Math.floor(Math.min(o[2], 100 * step) / step)), b = a * (1 + t / 100);
      if (Number.isInteger(b) && b > 0) return { a, b, o };
    }
  },
  ex: { a: 40, b: 50, o: ['un livre', 'coûte', 60] },
  build({ a, b, o }) {
    const t = 100 * (b - a) / a;
    return {
      html: `${o[0][0].toUpperCase() + o[0].slice(1)} passe de ${eur(a)} à ${eur(b)}. Quel est le taux d’évolution de son prix ?`,
      good: { l: sg(t), n: t },
      bads: [
        { l: sg(b - a), n: b - a, why: 'Tu as pris la différence en euros (' + dec(b - a) + ') comme pourcentage : il faut la rapporter au prix de <b>départ</b>.' },
        { l: sg(100 * (b - a) / b), n: 100 * (b - a) / b, why: 'Tu as divisé par la valeur d’<b>arrivée</b> (' + b + ') : le taux se calcule par rapport à la valeur de départ (' + a + ').' },
        { l: sg(100 * b / a), n: 100 * b / a, why: 'Tu as calculé le coefficient multiplicateur en % (' + dec(100 * b / a) + ' %), pas le taux : taux = coefficient − 1.' },
        { l: sg(-t), n: -t, why: 'Le signe est à l’envers : le prix ' + (b > a ? 'augmente' : 'diminue') + '.' },
      ],
      hint: `Calcule la variation (${b} − ${a}), puis divise-la par la valeur de départ ${a}. Le signe indique hausse (+) ou baisse (−).`,
      solution: `Variation : ${b} − ${a} = ${dec(b - a)}. Taux = ${F(dec(b - a), a)} = ${dec((b - a) / a)} = ${sg(t)}.`,
      indep: () => (b / a - 1) * 100,
    };
  },
};
const succ = {
  id: 'ev-succ', dmin: 3, titre: 'deux évolutions successives',
  draw() {
    for (;;) {
      const t1 = pick([10, 20, 30, 50, 100, -10, -20, -50, 25, -25]), t2 = pick([10, 20, 30, 50, 100, -10, -20, -50, 25, -25]);
      const f = (100 + t1) * (100 + t2) / 100 - 100;
      if (t1 !== -t2 && Number.isInteger(f * 2) && f !== t1 + t2) return { t1, t2 };
    }
  },
  ex: { t1: 10, t2: 20 },
  build({ t1, t2 }) {
    const f = (100 + t1) * (100 + t2) / 100 - 100, w = t => t > 0 ? `hausse de ${t}&nbsp;%` : `baisse de ${-t}&nbsp;%`;
    return {
      html: `Un prix subit une ${w(t1)}, puis une ${w(t2)}. Quelle est l’évolution globale ?`,
      good: { l: sg(f), n: f },
      bads: [
        { l: sg(t1 + t2), n: t1 + t2, why: 'Les taux ne s’additionnent pas : on multiplie les coefficients multiplicateurs.' },
        { l: sg((t1 + t2) / 2), n: (t1 + t2) / 2, why: 'On ne fait pas la moyenne des taux : on multiplie les coefficients.' },
        { l: sg(f + 5), n: f + 5, why: 'Vérifie le produit des coefficients.' },
        { l: sg(-f), n: -f, why: 'Le signe est à l’envers.' },
        { l: sg(t1 * t2 / 100), n: t1 * t2 / 100, why: 'Il faut multiplier les <b>coefficients</b> (' + dec(1 + t1 / 100) + ' × ' + dec(1 + t2 / 100) + '), pas les taux.' },
      ],
      hint: `Pour ${w(t1)} puis ${w(t2)}, les coefficients sont ${dec(1 + t1 / 100)} et ${dec(1 + t2 / 100)} : multiplie-les, puis soustrais 1 pour revenir au taux.`,
      solution: `${dec(1 + t1 / 100)} × ${dec(1 + t2 / 100)} = ${dec((100 + f) / 100)}. Taux global : ${dec((100 + f) / 100)} − 1 = ${dec(f / 100)}, soit ${sg(f)}.`,
      indep: () => ((1 + t1 / 100) * (1 + t2 / 100) - 1) * 100,
    };
  },
};
const succInv = {
  id: 'ev-succ-inv', dmin: 3, titre: 'une hausse puis une baisse du même taux',
  draw() { return { t: pick([10, 20, 30, 40, 50]), h: pick([true, false]) }; },
  ex: { t: 20, h: true },
  build({ t, h }) {
    const f = -(t * t) / 100;
    const w = (x, up) => up ? `hausse de ${x}&nbsp;%` : `baisse de ${x}&nbsp;%`;
    const g = h ? f : f;
    return {
      html: `Un prix subit une ${w(t, h)}, puis une ${w(t, !h)}. Quelle est l’évolution globale ?`,
      good: { l: sg(g), n: g },
      bads: [
        { l: sg(0), n: 0, why: 'Une hausse puis une baisse du même taux ne s’annulent pas : le 2<sup>e</sup> pourcentage s’applique à un prix différent.' },
        { l: sg(-g), n: -g, why: 'Le signe est à l’envers : on est finalement en dessous du prix de départ.' },
        { l: sg(h ? -t : t), n: h ? -t : t, why: 'Tu n’as retenu que la 2<sup>e</sup> évolution.' },
        { l: sg(g * 2), n: g * 2, why: 'Calcule avec les coefficients : ' + dec(h ? 1 + t / 100 : 1 - t / 100) + ' × ' + dec(h ? 1 - t / 100 : 1 + t / 100) + '.' },
        { l: sg(g * 5), n: g * 5, why: 'Calcule avec les coefficients : ' + dec(h ? 1 + t / 100 : 1 - t / 100) + ' × ' + dec(h ? 1 - t / 100 : 1 + t / 100) + '.' },
      ],
      hint: `Hausse et baisse de ${t} % : multiplie les coefficients ${dec(h ? 1 + t / 100 : 1 - t / 100)} et ${dec(h ? 1 - t / 100 : 1 + t / 100)}. Le résultat est-il égal à 1 ?`,
      solution: `${dec(1 + t / 100)} × ${dec(1 - t / 100)} = ${dec(1 - t * t / 10000)}. Le taux global est ${dec(1 - t * t / 10000)} − 1 = ${dec(f / 100)} : ${sg(f)}.`,
      indep: () => ((1 + t / 100) * (1 - t / 100) - 1) * 100,
    };
  },
};
const recip = hausse => ({
  id: hausse ? 'ev-recip-h' : 'ev-recip-b', dmin: 4, titre: hausse ? 'évolution réciproque d’une hausse' : 'évolution réciproque d’une baisse',
  draw() { return { t: pick(hausse ? [25, 100, 150, 300, 400] : [20, 50, 75, 60, 80]) }; },
  ex: hausse ? { t: 25 } : { t: 20 },
  build({ t }) {
    const g = hausse ? 100 * t / (100 + t) : 100 * t / (100 - t);
    const lab = x => `${hausse ? 'baisse' : 'hausse'} de ${dec(x)}&nbsp;%`;
    const ok = x => x > 0 && (hausse ? x < 100 : true);
    const cand = (hausse ? [t, 100 - t, t / 2, 2 * t, t / 4, g + 10, g - 10] : [t, 100 - t, t / 2, 2 * t, g + 10, g - 10, t + 5]).filter(x => ok(x) && x !== g);
    return {
      html: hausse ? `Le prix d’un article augmente de <b>${t}&nbsp;%</b>. Quelle baisse permet de revenir au prix de départ ?` : `Le prix d’un article baisse de <b>${t}&nbsp;%</b>. Quelle hausse permet de revenir au prix de départ ?`,
      good: { l: lab(g), n: g },
      bads: cand.map(x => ({ l: lab(x), n: x, why: x === t ? 'Les pourcentages ne s’inversent pas aussi simplement : la 2<sup>e</sup> évolution s’applique à la nouvelle valeur.' : x === 100 - t ? 'Tu as pris le complément à 100.' : 'Cherche le coefficient réciproque : ' + dec(hausse ? 1 + t / 100 : 1 - t / 100) + ' × ? = 1.' })),
      hint: `${hausse ? 'Hausse' : 'Baisse'} de ${t} % : le coefficient est ${dec(hausse ? 1 + t / 100 : 1 - t / 100)} ; il faut un coefficient c tel que ${dec(hausse ? 1 + t / 100 : 1 - t / 100)} × c = 1. Calcule c = 1 ÷ ${dec(hausse ? 1 + t / 100 : 1 - t / 100)}, puis ${hausse ? '1 − c' : 'c − 1'}.`,
      solution: `Coefficient : ${dec(hausse ? 1 + t / 100 : 1 - t / 100)}. Réciproque : 1 ÷ ${dec(hausse ? 1 + t / 100 : 1 - t / 100)} = ${dec(r6(100 / (hausse ? 100 + t : 100 - t)))}. ${hausse ? 'Baisse de 1 − ' + dec(r6(100 / (100 + t))) : 'Hausse de ' + dec(r6(100 / (100 - t))) + ' − 1'} = ${dec(g / 100)}, soit ${lab(g)}.`,
      indep: () => (hausse ? 1 - 1 / (1 + t / 100) : 1 / (1 - t / 100) - 1) * 100,
    };
  },
});
const initial = hausse => ({
  id: hausse ? 'ev-init-h' : 'ev-init-b', dmin: 5, titre: hausse ? 'retrouver la valeur initiale après une hausse' : 'retrouver la valeur initiale après une baisse',
  draw() {
    const t = pick(hausse ? [10, 20, 25, 50] : [10, 20, 25, 50]), c = hausse ? 100 + t : 100 - t, g = c / gcd(c, 100);
    return { t, x: (100 / gcd(c, 100)) * ri(1, Math.floor(400 / (100 / gcd(c, 100)))) };
  },
  ex: hausse ? { t: 20, x: 50 } : { t: 25, x: 80 },
  build({ t, x }) {
    const f = hausse ? x * (100 + t) / 100 : x * (100 - t) / 100;
    return {
      html: `Après une ${hausse ? 'hausse' : 'baisse'} de <b>${t}&nbsp;%</b>, un prix vaut ${eur(f)}. Quel était le prix avant ${hausse ? 'la hausse' : 'la baisse'} ?`,
      good: { l: eur(x), n: x },
      bads: [
        { l: eur(hausse ? f * (1 - t / 100) : f * (1 + t / 100)), n: hausse ? f * (1 - t / 100) : f * (1 + t / 100), why: `Tu as ${hausse ? 'retiré' : 'ajouté'} ${t} % du prix <b>final</b> : le pourcentage porte sur le prix de départ.` },
        { l: eur(hausse ? f - t : f + t), n: hausse ? f - t : f + t, why: `${t} % n’est pas ${t} € : le pourcentage s’applique au prix.` },
        { l: eur(hausse ? f * (1 + t / 100) : f * (1 - t / 100)), n: hausse ? f * (1 + t / 100) : f * (1 - t / 100), why: `Tu as encore ${hausse ? 'augmenté' : 'diminué'} le prix final au lieu de revenir en arrière.` },
        { l: eur(f * t / 100), n: f * t / 100, why: `Tu as calculé ${t} % du prix final : ce n’est pas le prix de départ.` },
      ],
      hint: `Le prix final est le prix de départ multiplié par ${dec(hausse ? 1 + t / 100 : 1 - t / 100)}. Pour revenir en arrière, on <b>divise</b> ${dec(f)} par ${dec(hausse ? 1 + t / 100 : 1 - t / 100)}.`,
      solution: `Prix final = prix de départ × ${dec(hausse ? 1 + t / 100 : 1 - t / 100)}. Donc prix de départ = ${dec(f)} ÷ ${dec(hausse ? 1 + t / 100 : 1 - t / 100)} = ${dec(x)} €.`,
      indep: () => f / (hausse ? 1 + t / 100 : 1 - t / 100),
    };
  },
});
const flechesEv = () => `<svg viewBox="0 0 440 90" class="vis" role="img" aria-label="hausse de 20 pour cent : fois 1,2">
<rect x="20" y="30" width="110" height="34" rx="8" fill="var(--acc2)" stroke="var(--acc)" stroke-width="2"/><text x="75" y="53" text-anchor="middle" font-size="18" fill="#222">50 €</text>
<rect x="310" y="30" width="110" height="34" rx="8" fill="var(--acc2)" stroke="var(--acc)" stroke-width="2"/><text x="365" y="53" text-anchor="middle" font-size="18" fill="#222">60 €</text>
<path d="M135 47 H300" stroke="var(--acc)" stroke-width="3" fill="none"/><path d="M300 47 l-12 -7 v14 z" fill="var(--acc)"/>
<text x="220" y="36" text-anchor="middle" font-size="16" fill="var(--acc)" font-weight="700">× 1,2</text><text x="220" y="76" text-anchor="middle" font-size="13" fill="#555">hausse de 20 %</text></svg>`;
const LV5 = niveau('Évolutions : coefficient, taux, évolutions successives', [coefH, coefB, appliquer(true), appliquer(false), taux, succ, succInv, recip(true), recip(false), initial(true), initial(false)], {
  n: 5, classe: '2de – 1re',
  intro: 'Une évolution (hausse ou baisse) se traduit par un coefficient multiplicateur. C’est l’outil de tous les problèmes de prix, de population et de taux.',
  def: 'Une évolution de taux <b>t</b> (en %) multiplie la valeur par le <b>coefficient CM = 1 + t ÷ 100</b>. Hausse de 20 % : × 1,2 ; baisse de 30 % : × 0,7.<br>Taux d’évolution = (valeur finale − valeur initiale) ÷ valeur initiale.',
  visuel: flechesEv(),
  methode: ['Écris le <b>coefficient</b> : 1 + t/100 (hausse) ou 1 − t/100 (baisse).', 'Valeur finale = valeur initiale × CM ; valeur initiale = valeur finale ÷ CM.', 'Évolutions successives : on <b>multiplie</b> les coefficients, puis on revient au taux (CM − 1).', 'Évolution réciproque : on cherche le coefficient <b>inverse</b> (1 ÷ CM).'],
  warn: ['Une hausse de 20 % puis une baisse de 20 % ne redonnent pas le prix de départ (CM = 1,2 × 0,8 = 0,96 : baisse de 4 %).', 'Pour retrouver la valeur de départ, on divise par le coefficient (on ne retire pas le pourcentage du prix final).', 'Les taux ne s’additionnent pas : +10 % puis +20 % font +32 %, pas +30 %.'],
  retenir: 'CM = 1 + t/100 ; successives → produit des CM ; réciproque → inverse du CM.',
});

/* =================== NIVEAU 6 : conversions =================== */
const PAIRS_A = [['m²', 'cm²', 4], ['km²', 'm²', 6], ['m²', 'dm²', 2], ['cm²', 'mm²', 2], ['dm²', 'cm²', 2], ['ha', 'm²', 4], ['m²', 'mm²', 6], ['km²', 'ha', 2]];
const XS = [2, 3, 5, 4, 12, 0.5, 1.5, 7, 8, 6, 0.3, 2.5, 9];
const unit = (x, u) => `${dec(x)} ${u}`;
const aireD = {
  id: 'cv-aire-d', dmin: 0, titre: 'convertir une aire vers une plus petite unité',
  draw() { return { P: pick(PAIRS_A), x: pick(XS) }; },
  ex: { P: ['m²', 'cm²', 4], x: 3 },
  build({ P: [u, v, k], x }) {
    const g = x * Math.pow(10, k);
    return {
      html: `Convertis : <b>${unit(x, u)}</b> = ? ${v}`,
      good: { l: unit(g, v), n: g },
      bads: [
        { l: unit(x * Math.pow(10, k / 2), v), n: x * Math.pow(10, k / 2), why: `Tu as utilisé le facteur d’une <b>longueur</b> (× ${ent(Math.pow(10, k / 2))}) : pour une aire, on l’élève au carré (× ${ent(Math.pow(10, k))}).` },
        { l: unit(x / Math.pow(10, k), v), n: x / Math.pow(10, k), why: `Tu as converti dans le mauvais sens : ${v} est une plus petite unité, il y en a donc davantage.` },
        { l: unit(x * Math.pow(10, k - 1), v), n: x * Math.pow(10, k - 1), why: 'Il manque un zéro : compte bien les puissances de 10.' },
        { l: unit(x * Math.pow(10, k + 1), v), n: x * Math.pow(10, k + 1), why: 'Un zéro de trop : compte bien les puissances de 10.' },
      ],
      hint: `1 ${u} = ${ent(Math.pow(10, k))} ${v} (c’est le carré du facteur des longueurs, ${ent(Math.pow(10, k / 2))}). Multiplie donc ${dec(x)} par ${ent(Math.pow(10, k))}.`,
      solution: `1 ${u} = ${ent(Math.pow(10, k))} ${v}, donc ${unit(x, u)} = ${dec(x)} × ${ent(Math.pow(10, k))} = ${unit(g, v)}.`,
      indep: () => x * Math.pow(10, k),
    };
  },
};
const aireU = {
  id: 'cv-aire-u', dmin: 1, titre: 'convertir une aire vers une plus grande unité',
  draw() { return { P: pick(PAIRS_A), t: pick([2, 3, 5, 4, 12, 0.5, 1.5, 7, 0.25, 0.4, 2.5]) }; },
  ex: { P: ['m²', 'cm²', 4], t: 0.45 },
  build({ P: [u, v, k], t }) {
    const x = t * Math.pow(10, k);
    return {
      html: `Convertis : <b>${unit(x, v)}</b> = ? ${u}`,
      good: { l: unit(t, u), n: t },
      bads: [
        { l: unit(x / Math.pow(10, k / 2), u), n: x / Math.pow(10, k / 2), why: `Tu as utilisé le facteur d’une <b>longueur</b> (÷ ${ent(Math.pow(10, k / 2))}) : pour une aire, on divise par ${ent(Math.pow(10, k))}.` },
        { l: unit(x * Math.pow(10, k), u), n: x * Math.pow(10, k), why: `Tu as converti dans le mauvais sens : ${u} est une plus grande unité, le nombre doit diminuer.` },
        { l: unit(t * 10, u), n: t * 10, why: 'Un rang de décalage en moins : compte bien les puissances de 10.' },
        { l: unit(t / 10, u), n: t / 10, why: 'Un rang de décalage en trop : compte bien les puissances de 10.' },
      ],
      hint: `1 ${u} = ${ent(Math.pow(10, k))} ${v} : pour passer de ${v} à ${u}, on divise ${ent(x)} par ${ent(Math.pow(10, k))} (on décale la virgule de ${k} rangs).`,
      solution: `${unit(x, v)} = ${dec(x)} ÷ ${ent(Math.pow(10, k))} = ${unit(t, u)}.`,
      indep: () => x / Math.pow(10, k),
    };
  },
};
const PAIRS_V = [['m³', 'dm³', 3], ['dm³', 'cm³', 3], ['m³', 'cm³', 6], ['L', 'mL', 3], ['m³', 'L', 3], ['L', 'cm³', 3], ['cm³', 'mm³', 3]];
const volD = {
  id: 'cv-vol-d', dmin: 2, titre: 'convertir un volume vers une plus petite unité',
  draw() { return { P: pick(PAIRS_V), x: pick([2, 3, 5, 4, 12, 0.5, 1.5, 7, 8, 0.3, 2.5, 0.25]) }; },
  ex: { P: ['m³', 'L', 3], x: 2.5 },
  build({ P: [u, v, k], x }) {
    const g = x * Math.pow(10, k), a = Math.pow(10, 2 * k / 3), l = Math.pow(10, k / 3);
    return {
      html: `Convertis : <b>${unit(x, u)}</b> = ? ${v}`,
      good: { l: unit(g, v), n: g },
      bads: [
        { l: unit(x * l, v), n: x * l, why: `Tu as utilisé le facteur d’une <b>longueur</b> (× ${ent(l)}) : pour un volume, on l’élève au cube (× ${ent(Math.pow(10, k))}).` },
        { l: unit(x * a, v), n: x * a, why: `Tu as utilisé le facteur d’une <b>aire</b> (× ${ent(a)}) : pour un volume, c’est le cube (× ${ent(Math.pow(10, k))}).` },
        { l: unit(x / Math.pow(10, k), v), n: x / Math.pow(10, k), why: `Mauvais sens : ${v} est une plus petite unité, il y en a donc davantage.` },
        { l: unit(x * Math.pow(10, k + 1), v), n: x * Math.pow(10, k + 1), why: 'Un zéro de trop.' },
      ],
      hint: v === 'L' || u === 'L' || v === 'mL' ? `Rappel : 1 L = 1 dm³ = 1 000 cm³ = 1 000 mL. ${u === 'm³' ? '1 m³ = 1 000 dm³ = 1 000 L.' : ''} Multiplie ${dec(x)} par ${ent(Math.pow(10, k))}.` : `1 ${u} = ${ent(Math.pow(10, k))} ${v} (facteur des longueurs ${ent(l)} au cube). Multiplie ${dec(x)} par ${ent(Math.pow(10, k))}.`,
      solution: `1 ${u} = ${ent(Math.pow(10, k))} ${v}, donc ${unit(x, u)} = ${dec(x)} × ${ent(Math.pow(10, k))} = ${unit(g, v)}.`,
      indep: () => x * Math.pow(10, k),
    };
  },
};
const volU = {
  id: 'cv-vol-u', dmin: 2, titre: 'convertir un volume vers une plus grande unité',
  draw() { return { P: pick(PAIRS_V), t: pick([2, 3, 5, 4, 12, 0.5, 1.5, 7, 0.25, 0.4, 2.5]) }; },
  ex: { P: ['dm³', 'cm³', 3], t: 3.5 },
  build({ P: [u, v, k], t }) {
    const x = t * Math.pow(10, k), a = Math.pow(10, 2 * k / 3), l = Math.pow(10, k / 3);
    return {
      html: `Convertis : <b>${unit(x, v)}</b> = ? ${u}`,
      good: { l: unit(t, u), n: t },
      bads: [
        { l: unit(x / l, u), n: x / l, why: `Tu as divisé par le facteur d’une <b>longueur</b> (${ent(l)}) : pour un volume, on divise par ${ent(Math.pow(10, k))}.` },
        { l: unit(x / a, u), n: x / a, why: `Tu as divisé par le facteur d’une <b>aire</b> (${ent(a)}) : pour un volume, c’est ${ent(Math.pow(10, k))}.` },
        { l: unit(x * Math.pow(10, k), u), n: x * Math.pow(10, k), why: `Mauvais sens : ${u} est une plus grande unité, le nombre doit diminuer.` },
        { l: unit(t * 10, u), n: t * 10, why: 'Un rang de décalage en moins.' },
      ],
      hint: `1 ${u} = ${ent(Math.pow(10, k))} ${v} : divise ${ent(x)} par ${ent(Math.pow(10, k))} (décale la virgule de ${k} rangs vers la gauche).`,
      solution: `${unit(x, v)} = ${dec(x)} ÷ ${ent(Math.pow(10, k))} = ${unit(t, u)}.`,
      indep: () => x / Math.pow(10, k),
    };
  },
};
const hm = (h, m) => `${h}&nbsp;h ${m}&nbsp;min`;
const dureeDec = {
  id: 'cv-duree-dec', dmin: 3, titre: 'durée décimale en heures et minutes',
  draw() { return { h: ri(1, 5), f: pick([0.25, 0.5, 0.75, 0.1, 0.2, 0.3, 0.4, 0.6, 0.7, 0.8, 0.9]) }; },
  ex: { h: 2, f: 0.25 },
  build({ h, f }) {
    const m = Math.round(f * 60), digs = f === 0.25 || f === 0.75 ? f * 100 : f * 10;
    const cand = [[h, digs], [h, Math.round(f * 100)], [h, 60 - m], [h, m + 10], [h + 1, m], [h, Math.round(m / 2)], [h, m * 2 > 59 ? m - 10 : m * 2]].filter(c => c[1] !== m && c[1] > 0 && c[1] < 100);
    return {
      html: `Convertis : <b>${dec(h + f)}&nbsp;h</b> = ? h min`,
      good: { l: hm(h, m), n: h * 100 + m },
      bads: cand.map(c => ({ l: hm(c[0], c[1]), n: c[0] * 100 + c[1], why: c[1] === digs ? `Tu as lu les décimales comme des minutes : mais ${dec(f)} h n’est pas ${digs} min, car 1 h = 60 min (pas 100).` : c[0] !== h ? 'Vérifie : la partie entière ' + h + ' h ne change pas.' : 'Vérifie ta conversion : ' + dec(f) + ' h = ' + dec(f) + ' × 60 min.' })),
      hint: `La partie entière (${h} h) ne bouge pas. Convertis ${dec(f)} h en minutes : ${dec(f)} × 60.`,
      solution: `${dec(h + f)} h = ${h} h + ${dec(f)} h. Et ${dec(f)} h = ${dec(f)} × 60 = ${m} min. Donc ${hm(h, m)}.`,
      indep: () => h * 100 + Math.round((f * 60) * 1e6) / 1e6,
    };
  },
};
const dureeMin = {
  id: 'cv-duree-min', dmin: 3, titre: 'minutes en heures et minutes',
  draw() { for (;;) { const M_ = ri(70, 400); if (M_ % 60 && M_ % 10 === 0 || M_ % 60 && M_ % 5 === 0) return { M_ }; } },
  ex: { M_: 135 },
  build({ M_ }) {
    const h = Math.floor(M_ / 60), m = M_ % 60;
    const cand = [[Math.floor(M_ / 100), M_ % 100], [h, Math.round((M_ / 60 - h) * 100)], [h + 1, m], [h, m + 10], [h, m + 20]].filter(c => c[0] >= 0 && c[1] < 60 && (c[0] !== h || c[1] !== m));
    return {
      html: `Convertis : <b>${ent(M_)}&nbsp;min</b> = ? h min`,
      good: { l: hm(h, m), n: h * 100 + m },
      bads: cand.map((c, i) => ({ l: hm(c[0], c[1]), n: c[0] * 100 + c[1], why: i === 0 ? 'Tu as coupé le nombre de minutes en « heures » et « minutes » comme avec 100 : mais 1 h = 60 min.' : i === 1 ? 'Tu as pris la partie décimale de ' + dec(M_ / 60) + ' comme des minutes : ' + dec(M_ / 60 - h) + ' h = ' + m + ' min.' : 'Vérifie le reste de la division par 60.' })),
      hint: `Combien de fois 60 min dans ${ent(M_)} min ? Pour t’aider, ${h * 60} = ${h} × 60 ; calcule ce qu’il reste.`,
      solution: `${ent(M_)} = ${h} × 60 + ${m} : ${hm(h, m)}.`,
      indep: () => Math.floor(M_ / 60) * 100 + (M_ - 60 * Math.floor(M_ / 60)),
    };
  },
};
const vitKM = {
  id: 'cv-vit-kmh', dmin: 4, titre: 'vitesse : km/h en m/s',
  draw() { return { ms: pick([5, 10, 15, 20, 25, 30, 35, 40, 8, 12, 4]) }; },
  ex: { ms: 20 },
  build({ ms }) {
    const k = r6(ms * 3.6), r = x => dec(Math.round(x * 10) / 10);
    return {
      html: `Une vitesse de <b>${dec(k)}&nbsp;km/h</b> correspond à ? m/s`,
      good: { l: `${dec(ms)}&nbsp;m/s`, n: ms },
      bads: [
        { l: `${r(k * 3.6)}&nbsp;m/s`, n: Math.round(k * 3.6 * 10) / 10, why: 'Tu as multiplié par 3,6 : de km/h vers m/s, on <b>divise</b> par 3,6.' },
        { l: `${r(k / 60)}&nbsp;m/s`, n: Math.round(k / 60 * 10) / 10, why: 'Tu as divisé par 60 (conversion de durée) : il faut aussi convertir les km en m (× 1 000) puis les heures en s (÷ 3 600), soit ÷ 3,6.' },
        { l: `${r(k / 36)}&nbsp;m/s`, n: Math.round(k / 36 * 10) / 10, why: '÷ 3,6 (et non ÷ 36) : 1 000 ÷ 3 600 = 1 ÷ 3,6.' },
        { l: `${r(k * 1000)}&nbsp;m/s`, n: Math.round(k * 1000 * 10) / 10, why: 'Tu as converti les km en m mais pas les heures en secondes.' },
        { l: `${r(k - 3.6)}&nbsp;m/s`, n: Math.round((k - 3.6) * 10) / 10, why: 'La conversion est une division, pas une soustraction.' },
      ],
      hint: `1 km/h = 1 000 m ÷ 3 600 s = ${F(1, '3,6')} m/s : divise ${dec(k)} par 3,6 (ou calcule ${dec(k)} ÷ 36 puis × 10).`,
      solution: `${dec(k)} km/h = ${ent(k * 1000)} m ÷ 3 600 s = ${dec(k)} ÷ 3,6 = ${dec(ms)} m/s.`,
      indep: () => (k * 1000) / 3600,
    };
  },
};
const vitMK = {
  id: 'cv-vit-ms', dmin: 4, titre: 'vitesse : m/s en km/h',
  draw() { return { ms: pick([5, 10, 15, 20, 25, 30, 8, 12, 4, 2, 6, 40]) }; },
  ex: { ms: 15 },
  build({ ms }) {
    const k = r6(ms * 3.6), r = x => dec(Math.round(x * 10) / 10);
    return {
      html: `Une vitesse de <b>${dec(ms)}&nbsp;m/s</b> correspond à ? km/h`,
      good: { l: `${dec(k)}&nbsp;km/h`, n: k },
      bads: [
        { l: `${r(ms / 3.6)}&nbsp;km/h`, n: Math.round(ms / 3.6 * 10) / 10, why: 'Tu as divisé par 3,6 : de m/s vers km/h, on <b>multiplie</b> par 3,6.' },
        { l: `${r(ms * 60)}&nbsp;km/h`, n: ms * 60, why: 'Tu as multiplié par 60 : il faut convertir les secondes en heures (× 3 600) et les m en km (÷ 1 000), soit × 3,6.' },
        { l: `${r(ms * 36)}&nbsp;km/h`, n: ms * 36, why: '× 3,6 (et non × 36) : 3 600 ÷ 1 000 = 3,6.' },
        { l: `${r(ms + 3.6)}&nbsp;km/h`, n: Math.round((ms + 3.6) * 10) / 10, why: 'La conversion est une multiplication, pas une addition.' },
        { l: `${r(ms * 1.8)}&nbsp;km/h`, n: Math.round(ms * 18) / 10, why: '1 m/s = 3,6 km/h (pas 1,8).' },
      ],
      hint: `En 1 s on parcourt ${dec(ms)} m ; en 1 h (3 600 s) on parcourt ${dec(ms)} × 3 600 m. Divise ensuite par 1 000 pour avoir des km.`,
      solution: `${dec(ms)} m/s = ${dec(ms)} × 3 600 m/h = ${ent(ms * 3600)} m/h = ${dec(k)} km/h (on multiplie par 3,6).`,
      indep: () => (ms * 3600) / 1000,
    };
  },
};
const tablAire = () => { let s = `<svg viewBox="0 0 440 90" class="vis" role="img" aria-label="échelle des unités d’aire">`; ['km²', 'hm²', 'dam²', 'm²', 'dm²', 'cm²', 'mm²'].forEach((u, i) => { s += `<rect x="${8 + i * 62}" y="14" width="56" height="34" rx="6" fill="var(--acc2)" stroke="var(--acc)" stroke-width="2"/><text x="${36 + i * 62}" y="36" text-anchor="middle" font-size="15">${u}</text>`; if (i < 6) s += `<text x="${70 + i * 62}" y="70" text-anchor="middle" font-size="12" fill="var(--acc)" font-weight="700">× 100</text>`; }); return s + `</svg>`; };
const LV6 = niveau('Conversions d’unités : aires, volumes, durées, vitesses', [aireD, aireU, volD, volU, dureeDec, dureeMin, vitKM, vitMK], {
  n: 6, classe: '2de – 1re',
  intro: 'Les erreurs d’unités font perdre beaucoup de points. On retient les bons facteurs : 100 pour les aires, 1 000 pour les volumes, 60 pour les durées, 3,6 pour les vitesses.',
  def: '1 m = 100 cm → <b>1 m² = 100² = 10 000 cm²</b> et <b>1 m³ = 100³ = 1 000 000 cm³</b>. 1 L = 1 dm³. 1 h = 60 min = 3 600 s. <b>1 m/s = 3,6 km/h</b>.',
  visuel: tablAire(),
  methode: ['<b>Aires</b> : on élève le facteur des longueurs au carré (× 100 par unité).', '<b>Volumes</b> : on l’élève au cube (× 1 000 par unité) ; 1 L = 1 dm³, 1 mL = 1 cm³.', '<b>Durées</b> : on convertit avec 60, jamais avec 100 (0,5 h = 30 min ; 135 min = 2 h 15 min).', '<b>Vitesses</b> : km/h → m/s : ÷ 3,6 ; m/s → km/h : × 3,6.', 'Vers une plus petite unité, le nombre augmente ; vers une plus grande, il diminue.'],
  warn: ['1 m² n’est pas 100 cm² : c’est 10 000 cm².', '2,5 h n’est pas 2 h 5 min : c’est 2 h 30 min.', '72 km/h ne se convertit pas en divisant par 60 : 72 ÷ 3,6 = 20 m/s.'],
  retenir: 'aires × 100, volumes × 1 000 par unité ; 60 pour les durées ; 3,6 entre m/s et km/h.',
});

export { LV5, LV6 };

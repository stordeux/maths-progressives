// Réservoirs d'énoncés (ticket n° 7) : pour chaque module, chaque niveau et chaque difficulté d, combien d'énoncés
// différents le générateur produit, et la probabilité de revoir un énoncé parmi les 5 ou 10 derniers.
// Deux mesures : à d fixé (d = 0…5), et « ★ n » = ce que voit l'élève qui a n étoiles (le moteur tire d parmi deux
// valeurs voisines, voir difficulte() : c'est le réservoir réel).
// Usage : node tools/reservoirs.mjs [module] [--tout] [--n=1500]
//   sans --tout : seulement les niveaux à petit réservoir (moins de SEUIL énoncés à un nombre d'étoiles au moins).
// « distincts » est un comptage sur n tirages : exact pour les petits réservoirs, minorant sinon (noté « ≥ »).
import { setSeed } from '../engine/util/rand.js';
import { empreinte, sansRepetition } from '../engine/util/repet.js';
import { READY } from '../modules/registry.js';
import { difficulte, ETOILES } from '../engine/engine.js';
import { existsSync } from 'node:fs';
import { pathToFileURL } from 'node:url';

export const SEUIL = 20;
/**
 * Niveaux dont la notion n'a pas 20 énoncés aux premières étoiles : minimum garanti et raison.
 * Le garde-fou du moteur y fait tourner les énoncés (on revoit le plus ancien), sans pouvoir éviter toute répétition.
 */
export const EXCEPTIONS = {
  'calcul N2': { min: 9, raison: 'compléments à 10 : 9 calculs (1 + ? = 10 … 9 + ? = 10), à savoir par cœur' },
  'calcul N12': { min: 10, raison: 'carrés de 2 à 12 : 11 calculs, à savoir par cœur' },
  'puissances N5': { min: 10, raison: 'puissances de 10 : exposants 1 à 6 (7 chiffres au pavé), dans les deux sens' },
  'puissances N6': { min: 9, raison: 'puissances de 10 négatives : 3 décimales au plus au pavé (10⁻¹ à 10⁻³), plus la lecture des exposants' },
  'angles N3': { min: 15, raison: 'rapporteur lu de 10 en 10 entre 20° et 160° : 15 mesures' },
  'trigo N8': { min: 12, raison: 'cos² + sin² = 1 avec des valeurs exactes : seuls 3-4-5, 7-24-25 et 44-117-125 donnent des décimaux' },
};

/** mesure d'un générateur : n tirages bruts (sans garde-fou) */
export function mesurer(generate, d, n = 1500, graine = 1, mental = false) {
  if (d < 0) { const e = -d - 1; d = 0; const g = generate; generate = mental ? () => g(e) : () => g(difficulte(e, ETOILES)); } // d = −1−étoiles : mélange du moteur
  setSeed(graine);
  const vus = new Map(), suite = [];
  let r5 = 0, r10 = 0;
  for (let i = 0; i < n; i++) {
    const c = empreinte(generate(d));
    const k = suite.lastIndexOf(c, i - 1);
    if (k >= 0 && i - k <= 5) r5++;
    if (k >= 0 && i - k <= 10) r10++;
    suite.push(c); vus.set(c, (vus.get(c) || 0) + 1);
  }
  // un réservoir est « épuisé » (comptage exact) si chaque énoncé est sorti plusieurs fois
  const exact = [...vus.values()].every(v => v >= 3);
  return { distincts: vus.size, exact, p5: r5 / n, p10: r10 / n };
}
/** même mesure avec le garde-fou du moteur */
export function mesurerGarde(generate, d, n = 600, graine = 1, mental = false) {
  if (d < 0) { const e = -d - 1; d = 0; const g = generate; generate = mental ? () => g(e) : () => g(difficulte(e, ETOILES)); }
  setSeed(graine);
  const mem = [], suite = [];
  let r10 = 0;
  for (let i = 0; i < n; i++) {
    const q = sansRepetition(() => generate(d), mem), c = empreinte(q);
    const k = suite.lastIndexOf(c, i - 1);
    if (k >= 0 && i - k <= 10) r10++;
    suite.push(c);
  }
  return r10 / n;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const args = process.argv.slice(2), tout = args.includes('--tout');
  const n = +(args.find(a => a.startsWith('--n=')) || '--n=1500').slice(4);
  const seul = args.find(a => !a.startsWith('--'));
  const pc = x => (100 * x).toFixed(0).padStart(3) + ' %';
  for (const m of READY) {
    if (seul && m.id !== seul) continue;
    const url = new URL(`../modules/${m.id}/levels.js`, import.meta.url);
    if (!existsSync(url)) continue;
    const { LEVELS, OPTIONS } = await import(url);
    const mental = !!(OPTIONS && OPTIONS.mental); // calcul mental : generate(étoiles), pas de mélange
    LEVELS.forEach((L, i) => {
      const lignes = [];
      let petit = false;
      for (const d of [-1, -2, -3, -4, -5, 0, 1, 2, 3, 4, 5]) {
        const r = mesurer(L.generate, d, n, 1, mental);
        if (d < 0 && r.distincts < SEUIL) petit = true;
        lignes.push(`${d < 0 ? '★ ' + (-d - 1) : 'd=' + d} ${r.exact ? ' ' : '≥'}${String(r.distincts).padStart(5)}  5 derniers ${pc(r.p5)}  10 derniers ${pc(r.p10)}${r.distincts < SEUIL ? `  → avec garde-fou ${pc(mesurerGarde(L.generate, d, 600, 1, mental))}` : ''}`);
      }
      if (tout || petit) { console.log(`${m.id} N${i + 1} ${L.titre}${petit ? '   [PETIT]' : ''}`); lignes.forEach(l => console.log('   ' + l)); }
    });
  }
}

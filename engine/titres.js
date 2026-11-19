// Titre de l'élève (ticket n° 6, décision de S. Tordeux, 2026-11-19) : un seul titre par appareil, qui récompense
// toute la progression, tous modules confondus. Rien n'est stocké : le titre se recalcule à partir des progressions
// (« mp:<module> »), donc il suit l'export / import et revient à « Stagiaire » quand on réinitialise.
import * as store from './storage.js';
import { MODULES } from '../modules/registry.js';

export const ETOILES_PAR_NIVEAU = 5; // même valeur que ETOILES du moteur (vérifié par les tests)
export const NIVEAUX = 12;
/** position la plus haute d'un module : niveau 12 avec 5 étoiles = 11 × 5 + 5 = 60 */
export const POSITION_MAX = (NIVEAUX - 1) * ETOILES_PAR_NIVEAU + ETOILES_PAR_NIVEAU;

/**
 * Les 10 titres et le nombre d'étoiles qu'il faut en tout pour les obtenir.
 * Repère : un module terminé = 60 étoiles. Les premiers titres viennent vite (pour encourager), les suivants
 * demandent de plus en plus de modules : 1 module (Confirmé), 2 (Expérimenté), 4 (Expert), 7 (Maître), 10 (Grand maître),
 * 14 (Grandiose), 18 modules terminés ou l'équivalent (International).
 */
export const TITRES = [
  { nom: 'Stagiaire', seuil: 0 },
  { nom: 'Novice', seuil: 10 },
  { nom: 'Apprenti', seuil: 30 },
  { nom: 'Confirmé', seuil: 60 },
  { nom: 'Expérimenté', seuil: 120 },
  { nom: 'Expert', seuil: 240 },
  { nom: 'Maître', seuil: 420 },
  { nom: 'Grand maître', seuil: 600 },
  { nom: 'Grandiose', seuil: 840 },
  { nom: 'International', seuil: 1080 },
];

const entier = x => (Number.isFinite(+x) ? Math.floor(+x) : 0);

/** position d'un module : niveau × 5 + étoiles, de 0 à 60 (0 pour un module jamais ouvert ou sans niveaux) */
export function position(S) {
  if (!S || typeof S !== 'object') return 0;
  const niveau = Math.max(0, Math.min(NIVEAUX - 1, entier(S.level)));
  // anciennes progressions (avant les étoiles) : la série de réussites en cours tient lieu d'étoiles, comme dans bouger()
  const brut = S.stars === undefined ? Math.min(ETOILES_PAR_NIVEAU - 1, entier(S.streak)) : entier(S.stars);
  const etoiles = Math.max(0, Math.min(ETOILES_PAR_NIVEAU, brut));
  return Math.min(POSITION_MAX, niveau * ETOILES_PAR_NIVEAU + etoiles);
}

/** les modules qui comptent : ceux du registre qui sont prêts (la révision brevet n'a pas de niveaux : elle vaut 0) */
export const modulesComptes = () => MODULES.filter(m => m.etat !== 'bientot').map(m => m.id);

/**
 * Score global = somme des positions de tous les modules.
 * lire(id) renvoie la progression enregistrée d'un module (par défaut : storage.js) ; ids : les modules à compter.
 */
export function scoreGlobal(lire = id => store.load(id, {}), ids = modulesComptes()) {
  return ids.reduce((s, id) => s + position(lire(id)), 0);
}

/** score le plus haut possible aujourd'hui (tous les modules à niveaux terminés) */
export const scoreMax = (ids = modulesComptes()) => ids.filter(id => id !== 'revision').length * POSITION_MAX;

/**
 * Titre correspondant à un score : { rang (0 à 9), nom, score, seuil, suivant ({ nom, seuil } ou null),
 * manque (étoiles avant le titre suivant, 0 au dernier), pct (avancement vers le titre suivant, 0 à 100) }.
 */
export function titreDe(score) {
  const s = Math.max(0, entier(score));
  let rang = 0;
  TITRES.forEach((t, i) => { if (s >= t.seuil) rang = i; });
  const t = TITRES[rang], suivant = TITRES[rang + 1] || null;
  return {
    rang, nom: t.nom, score: s, seuil: t.seuil, suivant,
    manque: suivant ? suivant.seuil - s : 0,
    pct: suivant ? Math.floor(100 * (s - t.seuil) / (suivant.seuil - t.seuil)) : 100,
  };
}

/** le titre de l'élève sur cet appareil */
export const titreActuel = () => titreDe(scoreGlobal());

/**
 * Suivi du titre dans un module : renvoie une fonction à appeler après chaque enregistrement de la progression ;
 * elle rend le nouveau titre si l'élève vient d'en gagner un, null sinon (une descente ne s'annonce pas).
 */
export function suiviTitre(lire) {
  let rang = titreDe(scoreGlobal(lire)).rang;
  return () => {
    const t = titreDe(scoreGlobal(lire));
    const gagne = t.rang > rang;
    rang = t.rang;
    return gagne ? t : null;
  };
}

/** « 1 étoile », « 12 étoiles » */
export const nbEtoiles = n => `${n} étoile${n > 1 ? 's' : ''}`;

// Titre de l'élève (ticket n° 6) : score global = somme des positions « niveau × 5 + étoiles » de tous les modules, 10 titres.
import { test } from 'node:test';
import assert from 'node:assert/strict';

// faux localStorage (avant de charger storage.js, qui le lit à chaque appel)
const boite = new Map();
globalThis.localStorage = {
  getItem: k => (boite.has(k) ? boite.get(k) : null),
  setItem: (k, v) => { boite.set(k, String(v)); },
  removeItem: k => { boite.delete(k); },
  key: i => [...boite.keys()][i] ?? null,
  get length() { return boite.size; },
};
const store = await import('../../engine/storage.js');
const { bouger, ETOILES } = await import('../../engine/engine.js');
const { TITRES, ETOILES_PAR_NIVEAU, NIVEAUX, POSITION_MAX, position, scoreGlobal, scoreMax, modulesComptes, titreDe, titreActuel, suiviTitre, nbEtoiles } = await import('../../engine/titres.js');
const { READY } = await import('../../modules/registry.js');

test('les 10 titres, dans l\'ordre décidé, avec des seuils strictement croissants à partir de 0', () => {
  assert.deepEqual(TITRES.map(t => t.nom), ['Stagiaire', 'Novice', 'Apprenti', 'Confirmé', 'Expérimenté', 'Expert', 'Maître', 'Grand maître', 'Grandiose', 'International']);
  assert.equal(TITRES[0].seuil, 0);
  for (let i = 1; i < TITRES.length; i++) assert.ok(Number.isInteger(TITRES[i].seuil) && TITRES[i].seuil > TITRES[i - 1].seuil, TITRES[i].nom);
});

test('mêmes constantes que le moteur : 5 étoiles par niveau, 12 niveaux, 60 positions par module', async () => {
  assert.equal(ETOILES_PAR_NIVEAU, ETOILES);
  assert.equal(POSITION_MAX, 60);
  for (const m of READY.filter(m => m.id !== 'revision')) {
    const { LEVELS } = await import(`../../modules/${m.id}/levels.js`);
    assert.equal(LEVELS.length, NIVEAUX, m.id);
  }
});

test('position d\'un module = niveau × 5 + étoiles', () => {
  assert.equal(position({ level: 0, stars: 0 }), 0);
  assert.equal(position({ level: 2, stars: 3 }), 13);
  assert.equal(position({ level: 11, stars: 5 }), 60);
  // module jamais ouvert, données absentes ou abîmées, révision brevet (pas de niveaux) : 0
  for (const S of [undefined, null, {}, 'x', { sessions: 3, best: 80 }, { level: 'a', stars: null }, { level: -2, stars: -1 }]) assert.equal(position(S), 0);
  // bornes : jamais plus de 60, même avec des données hors limites
  assert.equal(position({ level: 40, stars: 99 }), 60);
  assert.equal(position({ level: 3, stars: 99 }), 20);
  // ancienne progression (avant les étoiles) : la série en cours, 4 au plus, comme bouger()
  assert.equal(position({ level: 3, streak: 2 }), 17);
  assert.equal(position({ level: 3, streak: 9 }), 19);
});

test('la position suit bouger() pas à pas, de 0 à 60', () => {
  const S = { level: 0, stars: 0 };
  for (let p = 1; p <= 60; p++) { bouger(S, 1, 12); assert.equal(position(S), p); }
  bouger(S, 1, 12); assert.equal(position(S), 60);
  bouger(S, -2, 12); assert.equal(position(S), 60); // étoiles gagnées : une faute ne fait pas redescendre le titre
});

test('le menu Niveaux ne fait pas monter le titre : seules les étoiles gagnées en jouant comptent', () => {
  const S = { level: 0, stars: 0 };
  bouger(S, 1, 12); bouger(S, 1, 12);
  assert.equal(position(S), 2);
  S.level = 11; S.stars = 0; // choix du niveau 12 dans le menu
  assert.equal(position(S), 2);
  bouger(S, 1, 12); // une réussite au niveau 12 : une étoile gagnée de plus, pas 56
  assert.equal(position(S), 3);
});

test('score global = somme sur tous les modules ; un module jamais ouvert compte 0', () => {
  const data = { fractions: { level: 2, stars: 3 }, calcul: { level: 0, stars: 4 }, relatifs: { level: 11, stars: 5 }, revision: { sessions: 4, best: 90 }, inconnu: { level: 5, stars: 0 } };
  assert.equal(scoreGlobal(id => data[id]), 13 + 4 + 60);
  assert.equal(scoreGlobal(() => undefined), 0);
  assert.equal(scoreGlobal(() => ({ level: 11, stars: 5 })), modulesComptes().length * 60);
  assert.equal(scoreGlobal(id => data[id], ['fractions', 'inconnu']), 13 + 25);
  assert.deepEqual(modulesComptes(), READY.map(m => m.id));
});

test('titre selon le score : chaque seuil, et juste en dessous', () => {
  assert.equal(titreDe(0).nom, 'Stagiaire');
  TITRES.forEach((t, i) => {
    assert.equal(titreDe(t.seuil).nom, t.nom);
    assert.equal(titreDe(t.seuil).rang, i);
    if (i) assert.equal(titreDe(t.seuil - 1).nom, TITRES[i - 1].nom);
  });
  assert.equal(titreDe(-5).nom, 'Stagiaire');
  assert.equal(titreDe(NaN).nom, 'Stagiaire');
  assert.equal(titreDe(1e6).nom, 'International');
});

test('avancement vers le titre suivant : étoiles manquantes et pourcentage', () => {
  const a = titreDe(0);
  assert.deepEqual([a.suivant.nom, a.manque, a.pct], ['Novice', TITRES[1].seuil, 0]);
  const b = titreDe(45); // Apprenti (30), Confirmé à 60
  assert.deepEqual([b.nom, b.suivant.nom, b.manque, b.pct], ['Apprenti', 'Confirmé', 15, 50]);
  const c = titreDe(59);
  assert.ok(c.pct < 100 && c.manque === 1);
  for (let s = 0; s <= TITRES[9].seuil + 50; s++) {
    const t = titreDe(s);
    assert.ok(t.pct >= 0 && t.pct <= 100 && t.manque >= 0);
    assert.equal(t.suivant ? t.score + t.manque : t.score, t.suivant ? t.suivant.seuil : s);
  }
  const z = titreDe(TITRES[9].seuil + 7);
  assert.deepEqual([z.nom, z.suivant, z.manque, z.pct], ['International', null, 0, 100]);
});

test('seuils réalistes : International est atteignable, mais seulement en maîtrisant une grande partie du site', () => {
  const max = scoreMax();
  assert.equal(max, READY.filter(m => m.id !== 'revision').length * 60);
  const dernier = TITRES[TITRES.length - 1].seuil;
  assert.ok(dernier <= 0.8 * max, `International (${dernier}) doit rester atteignable (max ${max})`);
  assert.ok(dernier >= 0.5 * max, `International (${dernier}) doit demander au moins la moitié du site (max ${max})`);
  assert.ok(TITRES[1].seuil <= 15, 'le deuxième titre doit venir vite');
  assert.ok(TITRES[3].seuil <= 60, 'un module terminé donne au moins « Confirmé »');
});

test('suivi dans un module : annonce une seule fois le titre gagné, jamais une descente', () => {
  const data = { fractions: { level: 1, stars: 4 } }; // 9 étoiles : Stagiaire
  const suivi = suiviTitre(id => data[id]);
  assert.equal(suivi(), null);
  data.fractions = { level: 2, stars: 0 }; // 10 : Novice
  assert.equal(suivi().nom, 'Novice');
  assert.equal(suivi(), null);
  data.fractions = { level: 1, stars: 3 }; // faute : retour à 8
  assert.equal(suivi(), null);
  data.fractions = { level: 11, stars: 5 }; data.calcul = { level: 11, stars: 5 }; // 120 d'un coup
  assert.equal(suivi().nom, 'Expérimenté');
});

test('avec le stockage : le titre se recalcule après export / import, et Réinitialiser le remet à Stagiaire', () => {
  boite.clear();
  assert.equal(titreActuel().nom, 'Stagiaire');
  store.save('fractions', { level: 11, stars: 5, good: 70, total: 80 });
  store.save('calcul', { level: 4, stars: 2 });
  store.save('relatifs', { level: 8, stars: 3 });
  store.settings.set({ grand: true });
  const score = 60 + 22 + 43;
  assert.equal(scoreGlobal(), score);
  assert.equal(titreActuel().nom, 'Expérimenté');
  const code = store.toCode(store.exportAll());
  assert.equal(store.resetAll(), 3);
  assert.equal(scoreGlobal(), 0);
  assert.equal(titreActuel().nom, 'Stagiaire');
  store.importAll(store.fromCode(code));
  assert.equal(scoreGlobal(), score);
  assert.equal(titreActuel().nom, 'Expérimenté');
  // aucune clé propre au titre : rien d'autre que les progressions et les réglages
  assert.deepEqual([...boite.keys()].sort(), ['mp:calcul', 'mp:fractions', 'mp:reglages', 'mp:relatifs']);
  boite.clear(); store.resetAll();
});

test('accord : « 1 étoile », « 12 étoiles »', () => {
  assert.equal(nbEtoiles(0), '0 étoile');
  assert.equal(nbEtoiles(1), '1 étoile');
  assert.equal(nbEtoiles(12), '12 étoiles');
});

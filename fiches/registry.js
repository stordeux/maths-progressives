// Fiches de synthèse : une page par grand thème, transversale aux modules.
// Chaque fiche est un fichier fiches/<id>.js qui exporte `contenu` (HTML) ; la page fiches/index.html?f=<id> l'affiche.
// liens : niveaux d'exercices à travailler, { module, niveau (1…12), texte }.
// etat: 'bientot' → carte grisée sur l'accueil, ignorée par les tests.
export const FICHES = [
  // ---
  { id: 'identites', titre: 'Identités remarquables', emoji: '🧩', classes: '3e – 2de', couleur: '#1864ab', couleur2: '#e7f5ff', resume: 'Les trois formules, les reconnaître dans un sens et dans l\'autre, et quand s\'en servir.' },
  // ---
  { id: 'cercle', titre: 'Le cercle', emoji: '⭕', classes: '6e – 1re', couleur: '#86198f', couleur2: '#fbeefc', resume: 'Vocabulaire, périmètre et aire, angles, tangente, cercle et triangle rectangle, cercle trigonométrique.' },
  // ---
  { id: 'triangle-rectangle', titre: 'Le triangle rectangle', emoji: '📐', classes: '4e – 2de', couleur: '#c2255c', couleur2: '#fff0f6', resume: 'Pythagore, trigonométrie, cercle circonscrit : quel outil choisir selon ce que l\'on connaît.' },
  // ---
];
/** fiches publiées */
export const FICHES_PRETES = FICHES.filter(f => f.etat !== 'bientot');

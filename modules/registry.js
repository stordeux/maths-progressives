// Liste des modules : utilisée par l'accueil, les pages de module, le mode révision et les tests.
// etat: 'bientot' → affiché grisé sur l'accueil, ignoré par les tests (module pas encore écrit).
// Une ligne de commentaire sépare chaque entrée pour que les modifications de deux modules ne se touchent pas.
export const MODULES = [
  // --- calcul
  { id: 'calcul', titre: 'Calcul mental', emoji: '⚡', classes: '6e – 3e', groupe: 'Calcul', couleur: '#c2410c', couleur2: '#fff0e6', resume: 'Tables, astuces, relatifs, pourcentages : en entraînement ou en défi de 60 s.' },
  // ---
  { id: 'fractions', titre: 'Fractions', emoji: '🍕', classes: '6e – 4e', groupe: 'Calcul', couleur: '#3b5bdb', couleur2: '#e7ecff', resume: 'Lire, simplifier, comparer, additionner, multiplier… jusqu\'aux racines carrées.' },
  // ---
  { id: 'relatifs', titre: 'Nombres relatifs', emoji: '🌡️', classes: '5e – 4e', groupe: 'Calcul', couleur: '#c92a2a', couleur2: '#fff5f5', resume: 'Droite graduée, additions et soustractions, règle des signes, calculs enchaînés.' },
  // ---
  { id: 'priorites', titre: 'Priorités opératoires', emoji: '🪜', classes: '5e – 4e', groupe: 'Calcul', couleur: '#9c36b5', couleur2: '#f8f0fc', resume: 'Calculer pas à pas, avec des parenthèses de plus en plus imbriquées.', css: true },
  // ---
  { id: 'puissances', titre: 'Puissances', emoji: '🚀', classes: '4e – 3e', groupe: 'Calcul', couleur: '#6741d9', couleur2: '#f3f0ff', resume: 'aⁿ, puissances de 10, écriture scientifique, règles de calcul et pièges.' },
  // ---
  { id: 'litteral', titre: 'Calcul littéral', emoji: '🔤', classes: '4e – 3e', groupe: 'Calcul', couleur: '#1864ab', couleur2: '#e7f5ff', resume: 'Réduire, développer, double distributivité, factoriser, identités remarquables.' },
  // ---
  { id: 'equations', titre: 'Équations', emoji: '⚖️', classes: '4e – 3e', groupe: 'Calcul', couleur: '#2b8a3e', couleur2: '#ebfbee', resume: 'De x + 3 = 7 à l\'équation produit nul, avec une balance qui reste en équilibre.' },
  // --- proportionnalité et données
  { id: 'proportionnalite', titre: 'Proportionnalité et pourcentages', emoji: '📊', classes: '6e – 3e', groupe: 'Proportionnalité et données', couleur: '#a14d00', couleur2: '#fff4e6', resume: 'Tableaux, produit en croix, échelles, vitesses, hausses et baisses en %.' },
  // ---
  { id: 'stats-probas', titre: 'Statistiques et probabilités', emoji: '🎲', classes: '5e – 3e', groupe: 'Proportionnalité et données', couleur: '#087f5b', couleur2: '#e6fcf5', resume: 'Moyenne, médiane, étendue ; dés, urnes et arbres.' },
  // --- géométrie
  { id: 'pythagore', titre: 'Théorème de Pythagore', emoji: '📐', classes: '4e', groupe: 'Géométrie', couleur: '#c2255c', couleur2: '#fff0f6', resume: 'Repérer l\'hypoténuse, calculer une longueur, la réciproque.' },
  // ---
  { id: 'thales-trigo', titre: 'Thalès et trigonométrie', emoji: '🔺', classes: '3e', groupe: 'Géométrie', couleur: '#364fc7', couleur2: '#edf2ff', resume: 'Configurations de Thalès, puis cosinus, sinus et tangente.' },
  // ---
  { id: 'aires-volumes', titre: 'Aires, périmètres, volumes', emoji: '🧊', classes: '6e – 3e', groupe: 'Géométrie', couleur: '#1971c2', couleur2: '#e7f5ff', resume: 'Des carreaux aux cônes et aux sphères, avec les conversions d\'unités.' },
  // ---
  { id: 'angles', titre: 'Angles', emoji: '📏', classes: '6e – 5e', groupe: 'Géométrie', couleur: '#9a3412', couleur2: '#fff7ed', resume: 'Rapporteur virtuel, somme des angles d\'un triangle, angles alternes-internes.', css: true },
  // --- vers le lycée
  { id: 'fonctions', titre: 'Fonctions', emoji: '〰️', classes: '3e – 2de', groupe: 'Vers le lycée', couleur: '#343a40', couleur2: '#f1f3f5', resume: 'Image et antécédent sur un graphique, fonctions linéaires et affines.' },
  // ---
  { id: 'inegalites', titre: 'Inégalités', emoji: '↔️', classes: '3e – 2de', groupe: 'Vers le lycée', couleur: '#0b7285', couleur2: '#e3fafc', resume: 'Intervalles, inéquations, valeur absolue, carrés, produits.' },
  // ---
  { id: 'poly2', titre: 'Second degré', emoji: '📈', classes: '2de – 1re', groupe: 'Vers le lycée', couleur: '#5f3dc4', couleur2: '#efe9ff', resume: 'Développer, forme canonique, sommet, racines, signe, discriminant.' },
  // ---
  { id: 'vecteurs', titre: 'Vecteurs et droites', emoji: '➡️', classes: '2de', groupe: 'Vers le lycée', couleur: '#1e40af', couleur2: '#e8eefc', resume: 'Coordonnées, somme de vecteurs, colinéarité, équations de droites.' },
  // --- lycée (1re – Tle)
  { id: 'suites', titre: 'Suites', emoji: '🔢', classes: '1re', groupe: 'Lycée (1re – Tle)', couleur: '#155e75', couleur2: '#e3f4f8', resume: 'Termes, récurrence, suites arithmétiques et géométriques, sommes, seuils.' },
  // ---
  { id: 'trigo', titre: 'Trigonométrie', emoji: '⭕', classes: '1re', groupe: 'Lycée (1re – Tle)', couleur: '#86198f', couleur2: '#fbeefc', resume: 'Radians, cercle trigonométrique, cosinus et sinus des angles associés, équations.' },
  // ---
  { id: 'probas-lycee', titre: 'Probabilités conditionnelles', emoji: '🌳', classes: '1re – Tle', groupe: 'Lycée (1re – Tle)', couleur: '#166534', couleur2: '#e9f7ee', resume: 'Arbres pondérés, probabilités totales, indépendance, loi binomiale.', etat: 'bientot' },
  // ---
  { id: 'exp-ln', titre: 'Exponentielle et logarithme', emoji: '🌱', classes: '1re – Tle', groupe: 'Lycée (1re – Tle)', couleur: '#9a3412', couleur2: '#fdf1e7', resume: 'Propriétés de eˣ et ln, équations, inéquations, croissance et décroissance exponentielles.', etat: 'bientot' },
  // ---
  { id: 'derivees', titre: 'Dérivées', emoji: '📉', classes: '1re', groupe: 'Lycée (1re – Tle)', couleur: '#0f5132', couleur2: '#e6f4ea', resume: 'Nombre dérivé, tangente, dérivées usuelles, produit et quotient, variations, extremums.' },
  // ---
  { id: 'integrales', titre: 'Intégrales', emoji: '∫', classes: 'Terminale', groupe: 'Lycée (1re – Tle)', couleur: '#7c2d12', couleur2: '#fdf0e6', resume: 'Primitives, aire sous une courbe, calcul d’intégrales, valeur moyenne.' },
  // --- transversal
  { id: 'revision', titre: 'Révision brevet', emoji: '🎓', classes: '3e', groupe: 'Transversal', couleur: '#a61e4d', couleur2: '#fff0f6', resume: 'Des exercices de tous les modules du collège, chronométrés, avec un bilan.' },
  // ---
];

export const GROUPES = ['Calcul', 'Proportionnalité et données', 'Géométrie', 'Vers le lycée', 'Lycée (1re – Tle)', 'Transversal'];
/** modules utilisables (écrits et testés) */
export const READY = MODULES.filter(m => m.etat !== 'bientot');

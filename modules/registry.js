// Liste des modules : utilisée par l'accueil, les pages de module, le mode révision et les tests.
// etat : 'pret' (en ligne) ; les modules absents de la liste n'existent pas encore.
export const MODULES = [
  { id: 'calcul', titre: 'Calcul mental', emoji: '⚡', classes: '6e – 3e', groupe: 'Calcul', couleur: '#c2410c', couleur2: '#fff0e6', resume: 'Tables, astuces, relatifs, pourcentages : en entraînement ou en défi de 60 s.' },
  { id: 'fractions', titre: 'Fractions', emoji: '🍕', classes: '6e – 4e', groupe: 'Calcul', couleur: '#3b5bdb', couleur2: '#e7ecff', resume: 'Lire, simplifier, comparer, additionner, multiplier… jusqu\'aux racines carrées.' },
  { id: 'poly2', titre: 'Second degré', emoji: '📈', classes: '2de – 1re', groupe: 'Lycée', couleur: '#5f3dc4', couleur2: '#efe9ff', resume: 'Développer, forme canonique, sommet, racines, signe, discriminant.' },
  { id: 'inegalites', titre: 'Inégalités', emoji: '⚖️', classes: '3e – 2de', groupe: 'Lycée', couleur: '#0b7285', couleur2: '#e3fafc', resume: 'Intervalles, inéquations, valeur absolue, carrés, produits.' },
];

export const GROUPES = ['Calcul', 'Proportionnalité et données', 'Géométrie', 'Lycée', 'Transversal'];

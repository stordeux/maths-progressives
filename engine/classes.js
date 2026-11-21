// Classes du collège et du lycée, et lecture du champ « classes » des modules (« 6e – 3e », « 1re », « Terminale »…).
export const CLASSES = ['6e', '5e', '4e', '3e', '2de', '1re', 'Tle'];
export const NOMS = { '6e': '6e', '5e': '5e', '4e': '4e', '3e': '3e', '2de': '2de', '1re': '1re', 'Tle': 'Terminale' };

const norm = c => (/^term/i.test(c) ? 'Tle' : c === '2nde' ? '2de' : c);

/** classes couvertes par un champ « classes » : « 4e – 3e » → ['4e', '3e'] */
export function classesDe(texte) {
  const [a, b] = String(texte).split(/\s*[–—-]\s*/).map(s => norm(s.trim()));
  const i = CLASSES.indexOf(a), j = CLASSES.indexOf(b ?? a);
  if (i < 0 || j < 0) return [];
  return CLASSES.slice(Math.min(i, j), Math.max(i, j) + 1);
}

/** le module (ou la fiche) concerne-t-il cette classe ? (classe vide : toutes) */
export const pourClasse = (m, classe) => !classe || classesDe(m.classes).includes(classe);

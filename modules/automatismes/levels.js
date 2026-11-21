// Automatismes (2de – 1re) : 12 niveaux de QCM à 4 réponses, sans calculatrice, qui préparent la partie
// « Automatismes » de l'épreuve anticipée de mathématiques de 1re (BO n° 14 du 2 avril 2026).
// Chaque niveau est assemblé à partir de « formes » d'exercices (voir outils.js) : le cours montre un exemple corrigé de
// chaque forme que le niveau peut tirer. Le niveau 12 (épreuve blanche) mélange les formes des niveaux 1 à 11.
import { pick, exemples } from './outils.js';
import { LV1, LV2 } from './f1.js';
import { LV3, LV4 } from './f2.js';
import { LV5, LV6 } from './f3.js';
import { LV7, LV8 } from './f4.js';
import { LV9, LV10 } from './f5.js';
import { LV11 } from './f6.js';

const PREMIERS = [LV1, LV2, LV3, LV4, LV5, LV6, LV7, LV8, LV9, LV10, LV11];

const LV12 = {
  titre: 'Épreuve blanche : tous les automatismes',
  classe: '1re',
  forms: PREMIERS.flatMap(L => L.forms),
  generate(d) { return pick(PREMIERS).generate(d); },
  cours() {
    return `<h2>12. Épreuve blanche : tous les automatismes</h2>
<p class="intro">Ce dernier niveau mélange les questions des onze niveaux précédents, comme dans la partie « automatismes » de l’épreuve de 1<sup>re</sup> : 2 h au total, <b>sans calculatrice</b>, QCM d’abord. Vise environ <b>1 minute par question</b> (le chronomètre est à toi).</p>
<div class="def">Une question d’automatisme se règle en quelques lignes de tête. Si le calcul devient long, c’est qu’un raccourci t’échappe : relis l’énoncé et teste les choix.</div>
<div class="methode"><b>Méthode pour un QCM</b><ol><li>Lis la question en entier, repère ce qu’on te demande (une valeur, un signe, une forme, un intervalle).</li><li>Calcule de tête <i>avant</i> de regarder les choix, puis cherche ton résultat.</li><li>Les mauvais choix sont des <b>erreurs classiques</b> : si ton résultat n’y est pas, ou si deux choix te tentent, refais le calcul autrement (valeur test, ordre de grandeur).</li><li>Fais d’abord les questions faciles ; ne reste pas bloqué.</li></ol></div>
<p class="note">Voici un exemple corrigé de <b>chaque forme de question</b> que cette épreuve peut te poser, rangés par thème (touche un thème pour le déplier).</p>
${PREMIERS.map((L, i) => `<details class="rappel"><summary><b>Niveau ${i + 1} : ${L.titre}</b></summary>${exemples(L.forms)}</details>`).join('\n')}
<div class="warn">⚠️ Le piège le plus fréquent est de choisir le premier résultat « qui ressemble » : vérifie le signe, l’unité, l’ordre de grandeur.<br>⚠️ Une probabilité est entre 0 et 1, un pourcentage de proportion entre 0 % et 100 % : élimine les choix impossibles.</div>
<div class="retenir">À retenir : calcule avant de regarder les choix, et utilise les distracteurs pour repérer les erreurs classiques.</div>`;
  },
};

export const LEVELS = [LV1, LV2, LV3, LV4, LV5, LV6, LV7, LV8, LV9, LV10, LV11, LV12];
export const OPTIONS = { need: 4, keys: { comma: true } };

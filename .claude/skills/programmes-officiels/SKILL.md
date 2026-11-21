---
name: programmes-officiels
description: Retrouver et lire les programmes officiels de mathématiques (BO, Eduscol : cycle 3, cycle 4, lycée) et les comparer aux modules de Maths progressives. À charger quand S. Tordeux demande ce qui manque par rapport au programme, quand un nouveau programme paraît, ou pour mettre à jour docs/PROGRAMMES-COLLEGE.md.
---

# Programmes officiels et couverture des modules

## Où sont les textes (état au 2026-11-19)
- **6e** : programme du cycle 3, BO n° 16 du 17 avril 2025 (arrêté MENE2504620A), en 6e à la rentrée 2026 :
  https://www.education.gouv.fr/sites/default/files/programme-de-math-matiques-pour-le-cycle-3-439827.pdf
- **5e, 4e, 3e** : programme du cycle 4, BO n° 10 du 5 mars 2026 (arrêté MENE2602912A, annexe 2) ; 5e en 2026,
  4e en 2027, 3e en 2028 (avant : programme du BO n° 31 du 30 juillet 2020) :
  https://www.education.gouv.fr/bo/2026/Hebdo10/MENE2602912A
- **Lycée** : BO n° 14 du 2 avril 2026 (arrêtés du 26-02-2026 : 2de MENE2602914A, maths intégrées 1re MENE2602916A,
  spécialité 1re MENE2602917A, spécialité Tle MENE2602919A, complémentaires MENE2902920A) ; 2de et 1re en 2026, Tle en 2027.
  Les pages HTML du BO renvoient 403 à WebFetch : prendre le PDF du BO entier (`curl -A "Mozilla/5.0"`), `pdftotext`,
  repérer les annexes par leur NOR, puis extraire les blocs « Contenus ». Bilan : `docs/PROGRAMMES-LYCEE.md`.
- Ressources d'accompagnement : eduscol.education.gouv.fr (« Ressources d'accompagnement du programme de mathématiques au cycle 3 / 4 »).
- Chercher : WebSearch avec `allowed_domains: ["education.gouv.fr", "eduscol.education.gouv.fr"]` ; vérifier qu'il
  s'agit du **texte publié au BO** et non d'un projet du CSP.

## Lire un PDF de programme
WebFetch ne sait pas lire ces PDF (flux compressés) mais **enregistre le fichier** (chemin indiqué dans sa réponse,
sous `tool-results/`). Le copier dans un dossier de travail, puis :
`pdftotext -enc UTF-8 programme.pdf p.txt` (sans `-enc UTF-8`, les accents sortent mal dans le terminal) ;
`grep -n -i "cinquième\|quatrième\|troisième\|Objectifs d’apprentissage\|Automatismes" p.txt` pour la structure,
puis lire les paragraphes « Objectifs d'apprentissage » et « Automatismes » de chaque partie et de chaque classe.
Ne pas recopier de longs passages dans les réponses (droits) : résumer notion par notion.
Les PDF de programmes ne vont pas dans git ; s'il faut les garder : skill `biblio-dropbox`.

## Comparer aux modules
1. Lister les modules (`modules/registry.js`) et, pour chacun, les titres des 12 niveaux.
2. Tableau notion → classe → ✅ / 🟡 / ❌ → module et niveau (ou ce qui manque), par grande partie du programme.
3. Mettre à jour `docs/PROGRAMMES-COLLEGE.md` (sources et dates en tête) et la tâche de `~/DESCRIPTION/A_FAIRE.md`
   (liste des modules manquants, par ordre d'utilité) ; créer les modules avec la skill `creer-module`.

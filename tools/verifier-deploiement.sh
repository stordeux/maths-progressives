#!/usr/bin/env bash
# Vérifie le dernier déploiement de Maths progressives (skill publier-maths-progressives).
# Usage : bash tools/verifier-deploiement.sh [module …]
#  1. attend la fin du dernier run « Tests et déploiement » ;
#  2. s'il échoue sur un incident d'artefact GitHub (« No artifacts » / « Multiple artifacts » / « artifact metadata »),
#     relance le run ENTIER une fois (jamais --failed) ;
#  3. sinon affiche les tests en échec ;
#  4. compare la version de sw.js en ligne à la version locale, et vérifie que chaque module demandé répond 200.
R=stordeux/maths-progressives
SITE=https://stordeux.github.io/maths-progressives
cd "$(dirname "$0")/.." || exit 1
id=$(gh run list -R $R -L 1 --json databaseId -q '.[0].databaseId')
echo "run $id"
gh run watch "$id" -R $R --exit-status >/dev/null 2>&1; e=$?
if [ $e != 0 ]; then
  log=$(gh run view "$id" -R $R --log-failed 2>&1)
  if echo "$log" | grep -q "artifact"; then
    echo "incident d'artefact GitHub : relance du run entier"
    gh run rerun "$id" -R $R; sleep 15
    gh run watch "$id" -R $R --exit-status >/dev/null 2>&1; e=$?
  else
    echo "ÉCHEC des tests :"; echo "$log" | grep -E "✘|not ok|Error:|›" | head -20; exit 1
  fi
fi
[ $e != 0 ] && { echo "ÉCHEC après relance (voir gh run view $id -R $R --log-failed)"; exit 1; }
echo "déploiement réussi"
sleep 20
loc=$(grep -o "VERSION = '[^']*'" sw.js | head -1)
enl=$(curl -s "$SITE/sw.js?t=$RANDOM" | grep -o "VERSION = '[^']*'" | head -1)
[ "$loc" = "$enl" ] && echo "sw.js en ligne = local ($loc)" || echo "ATTENTION sw.js en ligne ($enl) ≠ local ($loc) : cache de GitHub Pages, réessayer dans une minute"
for m in "$@"; do echo "$m : $(curl -s -o /dev/null -w '%{http_code}' "$SITE/modules/$m/")"; done

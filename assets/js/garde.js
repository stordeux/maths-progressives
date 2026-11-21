/* Garde de démarrage (script classique, ES5 seulement : il doit tourner sur les plus vieux navigateurs).
   Si le site n'a pas démarré au bout de 5 s (window.__mpPret posé par l'accueil, les fiches et le moteur),
   on affiche ce qui s'est passé au lieu d'une page blanche : l'erreur, le navigateur, et un bouton « Réparer »
   qui vide le cache hors ligne (service worker) puis recharge. */
(function () {
  var erreurs = [];
  window.addEventListener('error', function (e) {
    var t = e.target, src = t && t !== window && (t.src || t.href);
    if (src) { erreurs.push('fichier non chargé : ' + String(src).split('/').slice(-2).join('/')); return; }
    var f = e.filename ? String(e.filename).split('/').slice(-2).join('/') : '';
    erreurs.push((e.message || 'erreur') + (f ? ' (' + f + (e.lineno ? ':' + e.lineno : '') + ')' : ''));
  }, true);
  window.addEventListener('unhandledrejection', function (e) { erreurs.push('promesse : ' + (e.reason && e.reason.message || e.reason)); });
  function reparer() {
    var fin = function () { location.reload(); };
    try {
      var p = [];
      if (navigator.serviceWorker && navigator.serviceWorker.getRegistrations) p.push(navigator.serviceWorker.getRegistrations().then(function (rs) { return Promise.all(rs.map(function (r) { return r.unregister(); })); }));
      if (window.caches && caches.keys) p.push(caches.keys().then(function (ks) { return Promise.all(ks.map(function (k) { return caches.delete(k); })); }));
      Promise.all(p).then(fin, fin);
    } catch (x) { fin(); }
  }
  setTimeout(function () {
    if (window.__mpPret) return;
    var d = document.createElement('div');
    d.setAttribute('role', 'alert');
    d.style.cssText = 'position:fixed;left:12px;right:12px;top:12px;z-index:99999;background:#fff;color:#1b1f3b;border:3px solid #d9480f;border-radius:14px;padding:14px 16px;font:16px/1.5 system-ui,sans-serif;box-shadow:0 6px 24px rgba(0,0,0,.25)';
    d.innerHTML = '<b>Le site n’a pas pu démarrer sur cet appareil.</b><br>Essaie d’abord : <button type="button" id="mpReparer" style="font:inherit;font-weight:700;padding:8px 14px;border-radius:10px;border:0;background:#2b4acb;color:#fff;margin:6px 0">Réparer et recharger</button><br><small>Si ça ne suffit pas, envoie une photo de ce message à l’adulte qui s’occupe du site :</small><pre style="white-space:pre-wrap;font-size:12px;background:#f4f2ec;padding:8px;border-radius:8px;margin:6px 0 0"></pre>';
    d.querySelector('pre').textContent = (erreurs.length ? erreurs.slice(0, 4).join('\n') : 'aucune erreur reçue (démarrage trop lent ou script bloqué)') + '\n' + navigator.userAgent;
    (document.body || document.documentElement).appendChild(d);
    d.querySelector('#mpReparer').onclick = reparer;
  }, 5000);
})();

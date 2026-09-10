/* =========================================================
   PIGVS - Service Worker
   ---------------------------------------------------------
   Rôle :
   - rendre l'application installable (PWA)
   - servir une page de secours si le réseau est indisponible
   Stratégie :
   - "network-first" : on essaie TOUJOURS le réseau d'abord
     (pour avoir la dernière version + les JSON à jour),
     et on ne se rabat sur le cache qu'en cas de coupure.
   ⚠️ Pense à incrémenter CACHE_VERSION à chaque mise à jour
      importante pour forcer le rafraîchissement du cache.
   ========================================================= */

const CACHE_VERSION = "pigvs-v1";
const CACHE_NAME = CACHE_VERSION;

/* Fichiers "coquille" mis en cache à l'installation.
   ⚠️ Adapte cette liste aux fichiers réellement présents.
   On NE met PAS les .json de données ici (ils changent souvent). */
const ASSETS = [
  "index.html",
  "fdm.html",
  "photos.html",
  "photo.html",
  "materiel.html",
  "style.css",
  "manifest.json",
  "colisage-data.json",
  "colisage.html",
  "rex.html",
  "info.html",
  "icon-192.png",
  "icon-512.png",
  "pigvs-chantier.js",
   "chantiers.json", 
   "info-paluel4.json",
   "info-cattenom3.json"
];

/* --- Installation : pré-cache de la coquille --- */
self.addEventListener("install", event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache =>
      // addAll échoue si UN fichier manque : on tolère les absents
      Promise.allSettled(ASSETS.map(url => cache.add(url)))
    ).then(() => self.skipWaiting())
  );
});

/* --- Activation : nettoyage des anciens caches --- */
self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

/* --- Fetch : network-first, fallback cache --- */
self.addEventListener("fetch", event => {
  const req = event.request;

  // On ne gère que les requêtes GET (pas les POST de partage, etc.)
  if (req.method !== "GET") return;

  event.respondWith(
    fetch(req)
      .then(res => {
        // On met à jour le cache avec la version fraîche
        const copy = res.clone();
        caches.open(CACHE_NAME).then(cache => cache.put(req, copy)).catch(()=>{});
        return res;
      })
      .catch(() =>
        // Hors ligne : on tente le cache
        caches.match(req).then(cached => cached || caches.match("index.html"))
      )
  );
});

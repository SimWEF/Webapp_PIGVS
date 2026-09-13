
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
   "info-cattenom3.json",
   "pigvs-envoi.js",
   "pigvs-auth.js",
   "login.html",
   "detailSousEnsemble.html",
   "quizz.html",
   "quizz-questions.json"
];
/* ==========================================================
   PIGVS Service Worker
   Version : 3.0
   ========================================================== */

   const APP_CACHE = "pigvs-app-v3";
   const DATA_CACHE = "pigvs-data-v1";
   
   /* ==========================================================
      Fichiers statiques
      ========================================================== */
   
   const APP_FILES = [
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
   "info-cattenom3.json",
   "pigvs-envoi.js",
   "pigvs-auth.js",
   "login.html",
   "detailSousEnsemble.html",
   "quizz.html",
   ];
   
   /* ==========================================================
      Installation
      ========================================================== */
   
   self.addEventListener("install", event => {
   
     event.waitUntil(
   
       caches.open(APP_CACHE)
         .then(cache => cache.addAll(APP_FILES))
   
     );
   
     self.skipWaiting();
   
   });
   
   /* ==========================================================
      Activation
      ========================================================== */
   
   self.addEventListener("activate", event => {
   
     event.waitUntil(
   
       caches.keys()
         .then(keys =>
           Promise.all(
   
             keys.map(key => {
   
               if (
                 key !== APP_CACHE &&
                 key !== DATA_CACHE
               ) {
                 return caches.delete(key);
               }
   
             })
   
           )
         )
   
     );
   
     self.clients.claim();
   
   });
   
   /* ==========================================================
      Fetch
      ========================================================== */
   
   self.addEventListener("fetch", event => {
   
     if (event.request.method !== "GET") {
       return;
     }
   
     const url = new URL(event.request.url);
   
     /* ======================================================
        CAS 1 : index.json
        Toujours prioriser le réseau
        ====================================================== */
   
     if (
       url.pathname.endsWith("/Data-quizz/index.json")
       ||
       url.pathname.endsWith("Data-quizz/index.json")
     ) {
   
       event.respondWith(
   
         fetch(event.request)
   
           .then(response => {
   
             const copy = response.clone();
   
             caches.open(DATA_CACHE)
               .then(cache => cache.put(event.request, copy));
   
             return response;
   
           })
   
           .catch(() =>
             caches.match(event.request)
           )
   
       );
   
       return;
     }
   
     /* ======================================================
        CAS 2 : Fichiers Data-quizz
        Cache dynamique
        ====================================================== */
   
     if (
   
       url.pathname.includes("/Data-quizz/")
   
     ) {
   
       event.respondWith(
   
         caches.open(DATA_CACHE)
   
           .then(async cache => {
   
             try {
   
               const response =
                 await fetch(event.request);
   
               cache.put(
                 event.request,
                 response.clone()
               );
   
               return response;
   
             }
   
             catch {
   
               const cached =
                 await cache.match(event.request);
   
               if (cached) {
                 return cached;
               }
   
               throw new Error(
                 "Fichier non disponible hors ligne"
               );
   
             }
   
           })
   
       );
   
       return;
     }
   
     /* ======================================================
        CAS 3 : Application
        Cache First
        ====================================================== */
   
     event.respondWith(
   
       caches.match(event.request)
   
         .then(cached => {
   
           if (cached) {
             return cached;
           }
   
           return fetch(event.request)
             .then(response => {
   
               const copy = response.clone();
   
               caches.open(APP_CACHE)
                 .then(cache =>
                   cache.put(event.request, copy)
                 );
   
               return response;
   
             });
   
         })
   
     );
   
   });
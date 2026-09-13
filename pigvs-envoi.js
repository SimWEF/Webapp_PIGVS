/* =========================================================
   PIGVS — Module d'envoi HTTP vers Power Automate
   ---------------------------------------------------------
   ⚠️ VERSION DE TEST : sans couche login.
   Le code chantier est fixé en dur ci-dessous (CODE_TEST).

   À inclure dans les pages d'envoi :
     <script src="pigvs-envoi.js"></script>
   ========================================================= */
   window.PIGVS_ENVOI = (function () {

    /* 1️⃣ URL COMPLÈTE du flux "PIGVS - Reception"
          ⚠️ Elle doit contenir &sig=... à la fin ! */
    const URL_FLUX = "https://default516ec17ab92f438b8594e11b6f6bec.79.environment.api.powerplatform.com:443/powerautomate/automations/direct/cu/04/workflows/7ee4645413cd4d43aaf312a6fe97fbf4/triggers/manual/paths/invoke?api-version=1&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=-uzPwa9IbvsUrxX4D26HGUMER7LS0dT3-mr2dfwKITw";
  
  
    /* Le base64 gonfle le poids d'environ 33 % */
    const LIMITE_PHOTOS = 10 * 1024 * 1024;
  
    /* Délai max avant abandon (évite le blocage infini) */
    const TIMEOUT_MS = 90000;
  
    /* --- Convertit un File/Blob en base64 (sans le préfixe data:) --- */
    function versBase64(file) {
      return new Promise((resolve, reject) => {
        const r = new FileReader();
        r.onerror = () => reject("lecture impossible");
        r.onload = () => {
          const s = r.result;
          const i = s.indexOf(',');
          resolve(i >= 0 ? s.substring(i + 1) : s);
        };
        r.readAsDataURL(file);
      });
    }
  
    /* --- Envoi principal --- */
    async function envoyer(donnees) {
      if (URL_FLUX.indexOf("COLLER_ICI") === 0) {
        return { ok: false, msg: "URL du flux non renseignée dans pigvs-envoi.js." };
      }
  
      const type   = donnees.type || "INCONNU";
      const champs = donnees.champs || {};
      const photos = donnees.photos || [];
  
      const total = photos.reduce((s, p) => s + (p.file ? p.file.size : 0), 0);
      if (total > LIMITE_PHOTOS) {
        return { ok: false, msg: "Total photos > 10 Mo. Retire une photo." };
      }
  
      const listePhotos = [];
      for (const p of photos) {
        try {
          listePhotos.push({ nom: p.nom, contenu: await versBase64(p.file) });
        } catch (e) {
          return { ok: false, msg: "Impossible de lire une photo." };
        }
      }
  
      const code = (window.PIGVS_AUTH && PIGVS_AUTH.getCode)
             ? PIGVS_AUTH.getCode()
             : "";
  
      const payload = {
        type   : type,
        code   : code,
        path   : donnees.path || "",
        envoi  : new Date().toISOString(),
        champs : champs,
        photos : listePhotos
      };
  
      /* Trace utile pour le débogage (console F12) */
      console.log("PIGVS → envoi :", payload);
  
      try {
        const rep = await fetch(URL_FLUX, {
          method : "POST",
          /* ✅ application/json : indispensable quand le déclencheur
             a un schéma JSON. Avec text/plain, Power Automate renvoie 400. */
          headers: { "Content-Type": "application/json" },
          body   : JSON.stringify(payload),
          signal : AbortSignal.timeout(TIMEOUT_MS)
        });
  
        if (rep.ok) return { ok: true };
  
        /* On tente de lire le détail de l'erreur renvoyé par Power Automate */
        let detail = "";
        try { detail = (await rep.text()).substring(0, 300); } catch (e) {}
        console.error("PIGVS → réponse " + rep.status + " :", detail);
  
        if (rep.status === 400) return { ok: false, msg: "Requête refusée (400). Voir la console F12." };
        if (rep.status === 401) return { ok: false, msg: "Non autorisé (401) : URL incomplète ou flux non public." };
        if (rep.status === 403) return { ok: false, msg: "Accès refusé (code chantier invalide)." };
        if (rep.status === 413) return { ok: false, msg: "Envoi trop volumineux." };
        return { ok: false, msg: "Erreur serveur (" + rep.status + ")." };
  
      } catch (err) {
        console.error("PIGVS → échec réseau :", err);
        if (err && err.name === 'TimeoutError') {
          return { ok: false, msg: "Délai dépassé : le serveur n'a pas répondu." };
        }
        return { ok: false, msg: "Envoi impossible : connexion ou CORS." };
      }
    }
  
    return { envoyer, URL_FLUX, LIMITE_PHOTOS };
  })();
  
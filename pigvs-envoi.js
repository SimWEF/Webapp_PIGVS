/* =========================================================
   PIGVS — Module d'envoi HTTP vers Power Automate
   ---------------------------------------------------------
   ⚠️ VERSION DE TEST : sans couche login.
   Le code chantier est fixé en dur ci-dessous (CODE_TEST).
   Quand le login sera en place, il sera repris
   automatiquement depuis PIGVS_AUTH.

   À inclure dans les pages d'envoi :
     <script src="pigvs-envoi.js"></script>
   ========================================================= */
   window.PIGVS_ENVOI = (function () {

    /* 1️⃣ URL du flux "PIGVS - Reception" (trigger HTTP) */
    const URL_FLUX = "https://default516ec17ab92f438b8594e11b6f6bec.79.environment.api.powerplatform.com:443/powerautomate/automations/direct/cu/04/workflows/7ee4645413cd4d43aaf312a6fe97fbf4/triggers/manual/paths/invoke?api-version=1";
  
    /* 2️⃣ Code chantier utilisé tant que le login n'est pas actif.
          Doit correspondre à la condition de déclenchement du flux. */
    const CODE_TEST = "GV-BUG2-2026";
  
    /* Le base64 gonfle le poids d'environ 33 % :
       10 Mo de photos -> ~13,5 Mo de payload. */
    const LIMITE_PHOTOS = 10 * 1024 * 1024;
  
    /* --- Convertit un File/Blob en base64 (sans le préfixe data:) --- */
    function versBase64(file) {
      return new Promise((resolve, reject) => {
        const r = new FileReader();
        r.onerror = () => reject("lecture impossible");
        r.onload = () => {
          const s = r.result;                       // "data:image/jpeg;base64,XXXX"
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
  
      /* Contrôle de taille */
      const total = photos.reduce((s, p) => s + (p.file ? p.file.size : 0), 0);
      if (total > LIMITE_PHOTOS) {
        return { ok: false, msg: "Total photos > 10 Mo. Retire une photo." };
      }
  
      /* Encodage des photos */
      const listePhotos = [];
      for (const p of photos) {
        try {
          listePhotos.push({ nom: p.nom, contenu: await versBase64(p.file) });
        } catch (e) {
          return { ok: false, msg: "Impossible de lire une photo." };
        }
      }
  
      /* Code chantier : depuis le login s'il existe, sinon le code de test */
      const code = (window.PIGVS_AUTH && PIGVS_AUTH.getCode && PIGVS_AUTH.getCode())
                   ? PIGVS_AUTH.getCode()
                   : CODE_TEST;
  
      const payload = {
        type   : type,
        code   : code,
        path   : donnees.path || "",
        envoi  : new Date().toISOString(),
        champs : champs,
        photos : listePhotos
      };
  
      try {
        const rep = await fetch(URL_FLUX, {
          method : "POST",
          /* text/plain : évite le préflight CORS (OPTIONS) non géré par Power Automate */
          headers: { "Content-Type": "text/plain" },
          body   : JSON.stringify(payload)
        });
  
        if (rep.ok) return { ok: true };
  
        if (rep.status === 403) return { ok: false, msg: "Accès refusé (code chantier invalide)." };
        if (rep.status === 413) return { ok: false, msg: "Envoi trop volumineux." };
        return { ok: false, msg: "Erreur serveur (" + rep.status + ")." };
  
      } catch (err) {
        console.error(err);
        return { ok: false, msg: "Envoi impossible : vérifie ta connexion (ou CORS)." };
      }
    }
  
    return { envoyer, URL_FLUX, LIMITE_PHOTOS };
  })();
  
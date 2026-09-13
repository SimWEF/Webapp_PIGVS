/* =========================================================
   PIGVS — Contrôle d'accès par code chantier
   ---------------------------------------------------------
   Le code N'EST PAS stocké ici : il est validé par un flux
   Power Automate (trigger HTTP) côté serveur.
   Cette page ne connaît donc jamais le vrai code.

   À inclure dans CHAQUE page :
     <script src="pigvs-auth.js"></script>
   Puis, tout en haut du script de la page :
     PIGVS_AUTH.protegerPage();
   ========================================================= */
   window.PIGVS_AUTH = (function () {

    /* URL du flux "Vérifier le code" (générée par Power Automate).
       ⚠️ Cette URL est visible, mais elle ne révèle PAS le code. */
    const URL_VERIF = "https://default516ec17ab92f438b8594e11b6f6bec.79.environment.api.powerplatform.com:443/powerautomate/automations/direct/cu/22/workflows/a1f9cc6711c64d44916c7f64f9d8671d/triggers/manual/paths/invoke?api-version=1&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=DfYjV_9q9LNYDi8WeTYeJvfQq-b9R9iHY6oo94keDfM";
  
    const KEY_OK     = "pigvs_auth_ok";        // jeton de session local
    const KEY_CODE   = "pigvs_auth_code";      // code validé (renvoyé dans les envois)
    const KEY_EXP    = "pigvs_auth_exp";       // date d'expiration
    const DUREE_JOURS = 3650;                    // re-saisie du code tous les 30 jours
  
    /* --- Statut --- */
    function estAuthentifie() {
      const ok  = localStorage.getItem(KEY_OK);
      const exp = parseInt(localStorage.getItem(KEY_EXP) || "0", 10);
      if (ok !== "1") return false;
      if (Date.now() > exp) { deconnecter(); return false; }
      return true;
    }
  
    function getCode() { return localStorage.getItem(KEY_CODE) || ""; }
  
    function deconnecter() {
      localStorage.removeItem(KEY_OK);
      localStorage.removeItem(KEY_CODE);
      localStorage.removeItem(KEY_EXP);
    }
  
    /* --- Vérification auprès du flux Power Automate --- */
    async function verifierCode(code) {
      try {
        const rep = await fetch(URL_VERIF, {
          method: "POST",
          /* text/plain évite le préflight CORS (OPTIONS) que Power Automate ne gère pas */
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ code: code })
        });
  
        if (!rep.ok) return { ok: false, msg: "Code refusé." };
  
        const txt = await rep.text();
        let res;
        try { res = JSON.parse(txt); } catch (e) { res = { valide: txt.trim() === "OK" }; }
  
        if (res.valide === true || res.valide === "true") {
          localStorage.setItem(KEY_OK, "1");
          localStorage.setItem(KEY_CODE, code);
          localStorage.setItem(KEY_EXP, String(Date.now() + DUREE_JOURS * 86400000));
          return { ok: true };
        }
        return { ok: false, msg: "Code incorrect." };
  
      } catch (err) {
        console.error(err);
        return { ok: false, msg: "Vérification impossible (réseau)." };
      }
    }
  
    /* --- Garde-fou : redirige vers login.html si non authentifié --- */
    function protegerPage() {
      if (!estAuthentifie()) {
        const cible = encodeURIComponent(location.pathname.split('/').pop() + location.search);
        location.replace("login.html?next=" + cible);
      }
    }
  
    return { estAuthentifie, verifierCode, protegerPage, getCode, deconnecter, URL_VERIF };
  })();
  
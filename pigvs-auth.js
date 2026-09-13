window.PIGVS_AUTH = (function () {

  /* ==========================================
     Configuration
     ========================================== */

  const URL_VERIF = "https://default516ec17ab92f438b8594e11b6f6bec.79.environment.api.powerplatform.com:443/powerautomate/automations/direct/cu/22/workflows/a1f9cc6711c64d44916c7f64f9d8671d/triggers/manual/paths/invoke?api-version=1&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=DfYjV_9q9LNYDi8WeTYeJvfQq-b9R9iHY6oo94keDfM";

  const KEY_OK   = "pigvs_auth_ok";
  const KEY_CODE = "pigvs_auth_code";
  const KEY_EXP  = "pigvs_auth_exp";

  const DUREE_JOURS = 3650;

  const MAX_ERREURS_LOCAL = 5;
  const BLOCAGE_MINUTES   = 30;
  const DELAI_TENTATIVE   = 2000;

  const KEY_FAIL = "pigvs_auth_fail";
  const KEY_LOCK = "pigvs_auth_lock";

  /* ==========================================
     Utilitaires
     ========================================== */

  function attendre(ms){
      return new Promise(resolve => setTimeout(resolve, ms));
  }

  function estBloqueLocalement(){

      const lock = parseInt(
          localStorage.getItem(KEY_LOCK) || "0",
          10
      );

      return Date.now() < lock;
  }

  function tempsRestantBlocage(){

      const lock = parseInt(
          localStorage.getItem(KEY_LOCK) || "0",
          10
      );

      if (Date.now() >= lock){
          return 0;
      }

      return Math.ceil(
          (lock - Date.now()) / 60000
      );
  }

  /* ==========================================
     Session
     ========================================== */

  function estAuthentifie(){

      const ok =
          localStorage.getItem(KEY_OK);

      const exp =
          parseInt(
              localStorage.getItem(KEY_EXP) || "0",
              10
          );

      if (ok !== "1"){
          return false;
      }

      if (Date.now() > exp){

          deconnecter();

          return false;
      }

      return true;
  }

  function getCode(){

      return localStorage.getItem(KEY_CODE) || "";
  }

  function deconnecter(){

      localStorage.removeItem(KEY_OK);
      localStorage.removeItem(KEY_CODE);
      localStorage.removeItem(KEY_EXP);

      localStorage.removeItem(KEY_FAIL);
      localStorage.removeItem(KEY_LOCK);
  }

  /* ==========================================
     Vérification du code
     ========================================== */

  async function verifierCode(code){

      if(estBloqueLocalement()){

          return {
              ok:false,
              msg:
                  "Connexion bloquée "
                  + tempsRestantBlocage()
                  + " min."
          };
      }

      await attendre(DELAI_TENTATIVE);

      try{

          const rep = await fetch(
              URL_VERIF,
              {
                  method: "POST",
                  headers: {
                      "Content-Type": "application/json"
                  },
                  body: JSON.stringify({
                      code: code.trim()
                  })
              }
          );

          if(rep.ok){

              localStorage.setItem(
                  KEY_OK,
                  "1"
              );

              localStorage.setItem(
                  KEY_CODE,
                  code.trim()
              );

              localStorage.setItem(
                  KEY_EXP,
                  String(
                      Date.now()
                      +
                      DUREE_JOURS
                      *
                      86400000
                  )
              );

              localStorage.removeItem(KEY_FAIL);
              localStorage.removeItem(KEY_LOCK);

              return {
                  ok:true
              };
          }

          let nbEchecs =
              parseInt(
                  localStorage.getItem(KEY_FAIL) || "0",
                  10
              );

          nbEchecs++;

          localStorage.setItem(
              KEY_FAIL,
              nbEchecs
          );

          if(
              nbEchecs >= MAX_ERREURS_LOCAL
          ){

              localStorage.setItem(
                  KEY_LOCK,
                  String(
                      Date.now()
                      +
                      (
                          BLOCAGE_MINUTES
                          *
                          60
                          *
                          1000
                      )
                  )
              );

              return {
                  ok:false,
                  msg:
                      "Trop d'erreurs. "
                      + "Connexion bloquée "
                      + BLOCAGE_MINUTES
                      + " min."
              };
          }

          return {
              ok:false,
              msg:
                  "Code incorrect. "
                  +
                  (MAX_ERREURS_LOCAL - nbEchecs)
                  +
                  " tentative(s) restante(s)."
          };
      }
      catch(err){

          console.error(err);

          return {
              ok:false,
              msg:"Erreur réseau."
          };
      }
  }

  /* ==========================================
     Protection des pages
     ========================================== */

  function protegerPage(){

      if(!estAuthentifie()){

          const cible =
              encodeURIComponent(
                  location.pathname
                      .split("/")
                      .pop()
                  +
                  location.search
              );

          location.replace(
              "login.html?next="
              +
              cible
          );
      }
  }

  return {
      estAuthentifie,
      verifierCode,
      protegerPage,
      getCode,
      deconnecter,
      URL_VERIF
  };

})();
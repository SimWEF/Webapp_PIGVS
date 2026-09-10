/* =========================================================
   PIGVS — Gestion centralisée du chantier sélectionné
   ---------------------------------------------------------
   À inclure dans CHAQUE page :  <script src="pigvs-chantier.js"></script>
   Fournit :
     PIGVS.getChantier()        -> objet chantier courant (ou null)
     PIGVS.setChantier(id)      -> enregistre le choix
     PIGVS.loadChantiers()      -> Promise -> liste depuis chantiers.json
     PIGVS.prefillSite(inputEl) -> pré-remplit un champ Site (si vide)
     PIGVS.renderSelector(el, onChange) -> injecte un menu déroulant de chantiers
   Le choix est mémorisé dans localStorage (clé 'pigvs_chantier_id').
   ========================================================= */
window.PIGVS = (function () {
  const KEY = "pigvs_chantier_id";
  let _liste = [];

  function loadChantiers() {
    return fetch("chantiers.json")
      .then(r => r.json())
      .then(d => { _liste = (d.chantiers || []).filter(c => c.statut !== "archive"); return _liste; })
      .catch(() => { _liste = []; return _liste; });
  }

  function getListe() { return _liste; }

  function getChantierId() { return localStorage.getItem(KEY) || null; }

  function setChantier(id) {
    if (id) localStorage.setItem(KEY, id);
    else localStorage.removeItem(KEY);
  }

  function getChantier() {
    const id = getChantierId();
    return _liste.find(c => c.id === id) || null;
  }

  /* Pré-remplit un <input> Site avec le site du chantier courant,
     seulement s'il est vide (on laisse la possibilité de modifier). */
  function prefillSite(inputEl) {
    if (!inputEl) return;
    const c = getChantier();
    if (c && c.site && !inputEl.value.trim()) {
      inputEl.value = c.site;
    }
  }

  /* Injecte un menu déroulant de sélection dans un conteneur.
     onChange(chantier) est appelé quand l'utilisateur change de chantier. */
  function renderSelector(container, onChange) {
    if (!container) return;
    const courantId = getChantierId();
    let html = `<select class="pigvs-select">
        <option value="">— Choisir un chantier —</option>` +
      _liste.map(c => `<option value="${c.id}" ${c.id === courantId ? "selected" : ""}>${c.nom}</option>`).join("") +
      `</select>`;
    container.innerHTML = html;
    const sel = container.querySelector("select");
    sel.addEventListener("change", () => {
      setChantier(sel.value);
      if (onChange) onChange(getChantier());
    });
  }

  return { loadChantiers, getListe, getChantier, getChantierId, setChantier, prefillSite, renderSelector };
})();

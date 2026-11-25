// Le voyage de la foi : logique de la page.
// Les données viennent de data/donnees.js (généré depuis l'Excel)
// et le fond de carte de data/carte.js.

(function () {
  "use strict";

  const D = window.DONNEES;
  const CARTE = window.CARTE;
  const SVG = "http://www.w3.org/2000/svg";
  const $ = (id) => document.getElementById(id);

  const etat = { etape: 0, voyageur: 0, survol: null };
  const N = D.etapes.length;

  // ---------- Construction (une seule fois) ----------

  $("source").textContent = "Données : « " + D.source + " »";
  $("source-pied").textContent = D.source;
  $("fond").setAttribute("d", CARTE.base);

  const pays = D.etapes.map((e, k) => {
    const p = document.createElementNS(SVG, "path");
    p.setAttribute("d", CARTE[e.id] || "");
    p.setAttribute("class", "pays-etape");
    brancherSurvol(p, k);
    $("pays").appendChild(p);
    return p;
  });

  const villes = D.etapes.map((e, k) => {
    const c = document.createElementNS(SVG, "circle");
    c.setAttribute("cx", e.x);
    c.setAttribute("cy", e.y);
    c.setAttribute("class", "ville-point");
    brancherSurvol(c, k);
    const t = document.createElementNS(SVG, "text");
    t.setAttribute("class", "ville-nom");
    t.textContent = e.ville;
    $("villes").append(c, t);
    return { c, t };
  });

  const toutesLesVilles = D.etapes.map((e) => e.x + "," + e.y);
  $("route-tout").setAttribute("points", toutesLesVilles.join(" "));

  const onglets = D.etapes.map((e, k) => {
    const b = document.createElement("button");
    b.type = "button";
    b.className = "onglet";
    b.innerHTML = '<span class="num"></span><span class="pays"></span><span class="ville"></span>';
    b.querySelector(".num").textContent = "Étape " + (k + 1);
    b.querySelector(".pays").textContent = e.pays;
    b.querySelector(".ville").textContent = e.ville;
    b.addEventListener("click", () => allerA(k));
    $("onglets").appendChild(b);
    return b;
  });

  const boutonsVoyageur = D.voyageurs.map((v, p) => {
    const b = document.createElement("button");
    b.type = "button";
    b.textContent = v;
    b.addEventListener("click", () => { etat.voyageur = p; afficher(); });
    $("voyageurs").appendChild(b);
    return b;
  });

  const barres = D.themes.map((theme) => {
    const div = document.createElement("div");
    div.innerHTML =
      '<div class="barre-entete"><span class="barre-nom"></span>' +
      '<span class="barre-chiffres"><span class="ecart"></span><span class="valeur"></span></span></div>' +
      '<div class="piste"><div class="repere"></div><div class="remplissage"></div></div>';
    div.querySelector(".barre-nom").textContent = theme;
    $("barres").appendChild(div);
    return {
      ecart: div.querySelector(".ecart"),
      valeur: div.querySelector(".valeur"),
      remplissage: div.querySelector(".remplissage"),
      repere: div.querySelector(".repere"),
    };
  });

  if (D.hypotheses.length) {
    const h = $("hypotheses");
    const titre = document.createElement("strong");
    titre.textContent = "Hypothèses";
    h.appendChild(titre);
    D.hypotheses.forEach((txt) => {
      const p = document.createElement("p");
      p.textContent = txt.charAt(0).toUpperCase() + txt.slice(1) + ".";
      h.appendChild(p);
    });
  } else {
    $("hypotheses").hidden = true;
  }

  // Tableau d'évolution
  const tableau = $("tableau");
  const thead = tableau.createTHead().insertRow();
  const thTheme = document.createElement("th");
  thTheme.scope = "col";
  thTheme.textContent = "Thème";
  thead.appendChild(thTheme);
  D.etapes.forEach((e) => {
    const th = document.createElement("th");
    th.scope = "col";
    th.textContent = e.pays;
    thead.appendChild(th);
  });
  const corps = tableau.createTBody();
  const cases = D.themes.map((theme) => {
    const ligne = corps.insertRow();
    const th = document.createElement("th");
    th.scope = "row";
    th.textContent = theme;
    ligne.appendChild(th);
    return D.etapes.map((e, k) => {
      const td = ligne.insertCell();
      td.addEventListener("click", () => { if (k <= etat.etape) allerA(k); });
      return td;
    });
  });

  // ---------- Interactions ----------

  function brancherSurvol(el, k) {
    el.addEventListener("mouseenter", () => { etat.survol = k; afficherSurvol(); });
    el.addEventListener("mousemove", placerBulle);
    el.addEventListener("mouseleave", () => { etat.survol = null; afficherSurvol(); });
    el.addEventListener("click", () => allerA(k));
  }

  function placerBulle(ev) {
    const zone = $("carte").getBoundingClientRect();
    const bulle = $("bulle");
    let x = ev.clientX - zone.left;
    const y = ev.clientY - zone.top;
    if (x > zone.width - 220) x -= 220;
    bulle.style.left = x + "px";
    bulle.style.top = y + "px";
  }

  function allerA(k) {
    etat.etape = Math.max(0, Math.min(N - 1, k));
    afficher();
  }

  $("precedent").addEventListener("click", () => allerA(etat.etape - 1));
  $("suivant").addEventListener("click", () => allerA(etat.etape + 1));
  document.addEventListener("keydown", (ev) => {
    if (ev.target.closest("input, textarea")) return;
    if (ev.key === "ArrowRight") allerA(etat.etape + 1);
    if (ev.key === "ArrowLeft") allerA(etat.etape - 1);
  });

  // ---------- Affichage ----------

  const val = (k, t, p) => D.etapes[k].valeurs[t][p];

  function couleurCase(v) {
    const l = 95 - v * 0.55;
    return { fond: "hsl(203, 45%, " + l + "%)", texte: l < 62 ? "#fff" : "#1F2A33" };
  }

  function afficherSurvol() {
    const k = etat.survol;
    pays.forEach((p, i) => p.classList.toggle("survol", i === k && i !== etat.etape));
    const e = D.etapes[k === null ? etat.etape : k];
    $("encart-surtitre").textContent = k === null ? "Étape " + (etat.etape + 1) + " sur " + N : "Zone survolée";
    $("encart-titre").textContent = e.pays + " · " + e.ville;
    $("encart-epoque").textContent = e.epoque + ".";
    $("encart-religions").textContent = e.religions.length
      ? "Religions rencontrées : " + e.religions.join(", ").toLowerCase() + "."
      : "";
    const bulle = $("bulle");
    if (k === null) { bulle.hidden = true; return; }
    const p = etat.voyageur;
    const moyenne = Math.round(D.themes.reduce((s, _, t) => s + val(k, t, p), 0) / D.themes.length);
    bulle.textContent = e.pays + " · " + D.voyageurs[p] + " : moyenne " + moyenne + " %"
      + (k === etat.etape ? "" : " · cliquer pour y aller");
    bulle.hidden = false;
  }

  // Cadre la carte sur l'étape courante, quelle que soit la taille de la fenêtre.
  // Renvoie l'échelle utilisée (pour garder des points et des noms de taille constante).
  function cadrer() {
    const e = D.etapes[etat.etape];
    const svg = $("carte");
    const l = svg.clientWidth || 1000, h = svg.clientHeight || 481;
    svg.setAttribute("viewBox", "0 0 " + l + " " + h);
    const z = (l / 1000) * e.zoom;
    $("calque").style.transform = "translate(" + (l / 2 - e.x * z) + "px, " + (h / 2 - e.y * z) + "px) scale(" + z + ")";
    return z;
  }

  let minuterie;
  window.addEventListener("resize", () => { clearTimeout(minuterie); minuterie = setTimeout(afficher, 150); });

  function afficher() {
    const k = etat.etape, p = etat.voyageur, e = D.etapes[k];

    // Carte : déplacement et zoom sur l'étape
    const z = cadrer();
    pays.forEach((el, i) => {
      el.classList.toggle("actif", i === k);
      el.classList.toggle("visite", i < k);
    });
    villes.forEach(({ c, t }, i) => {
      const ex = D.etapes[i];
      c.setAttribute("r", (i === k ? 7 : 5) / z);
      c.classList.toggle("atteinte", i <= k);
      t.setAttribute("x", ex.x + 9 / z);
      t.setAttribute("y", ex.y - 8 / z);
      t.style.fontSize = 13 / z + "px";
      t.style.strokeWidth = 3 / z + "px";
      t.classList.toggle("actif", i === k);
    });
    $("route-faite").setAttribute("points", toutesLesVilles.slice(0, k + 1).join(" "));

    // Onglets et flèches
    onglets.forEach((b, i) => {
      b.classList.toggle("actif", i === k);
      b.classList.toggle("visite", i < k);
      if (i === k) b.setAttribute("aria-current", "step"); else b.removeAttribute("aria-current");
    });
    $("precedent").disabled = k === 0;
    $("suivant").disabled = k === N - 1;

    // Voyageurs
    boutonsVoyageur.forEach((b, i) => b.setAttribute("aria-pressed", i === p ? "true" : "false"));

    // Barres
    $("titre-panneau").textContent = e.pays + " · " + D.voyageurs[p];
    $("sous-titre-panneau").textContent = k === 0 ? "Situation initiale" : "par rapport à : " + D.etapes[k - 1].pays;
    barres.forEach((b, t) => {
      const v = val(k, t, p);
      const avant = k > 0 ? val(k - 1, t, p) : v;
      const d = v - avant;
      b.valeur.textContent = v + " %";
      b.remplissage.style.width = v + "%";
      b.repere.style.left = avant + "%";
      b.repere.style.display = k === 0 ? "none" : "block";
      b.ecart.className = "ecart" + (k > 0 && d < 0 ? " baisse" : k > 0 && d > 0 ? " hausse" : "");
      b.ecart.textContent = k === 0 ? "départ" : d > 0 ? "▲ +" + d : d < 0 ? "▼ " + d : "= 0";
    });

    // Tableau
    $("titre-evolution").textContent = "Évolution sur le voyage · " + D.voyageurs[p];
    cases.forEach((ligne, t) => ligne.forEach((td, i) => {
      td.className = "";
      if (i > k) {
        td.classList.add("avenir");
        td.textContent = "—";
        td.style.background = td.style.color = "";
        return;
      }
      const v = val(i, t, p), c = couleurCase(v);
      td.textContent = v + " %";
      td.style.background = c.fond;
      td.style.color = c.texte;
      td.classList.add("cliquable");
      if (i === k) td.classList.add("courante");
    }));

    afficherSurvol();
  }

  afficher();
})();

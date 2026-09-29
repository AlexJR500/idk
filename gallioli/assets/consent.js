/* Consentimiento de cookies y Google Analytics 4.
   La analítica solo se carga si la persona la acepta. Sin ID configurado no se carga nunca. */
(() => {
  const GA_ID = "G-XXXXXXXXXX"; // TODO: ID de medición de Google Analytics 4 (ver README.md)
  const KEY = "gallioli-consent-v1";
  const BASE = new URL("..", document.currentScript ? document.currentScript.src : location.href);
  const gaReady = /^G-[A-Z0-9]{4,}$/.test(GA_ID) && GA_ID !== "G-XXXXXXXXXX";

  const read = () => { try { return JSON.parse(localStorage.getItem(KEY)); } catch (e) { return null; } };
  const write = v => { try { localStorage.setItem(KEY, JSON.stringify(v)); } catch (e) {} };

  let loaded = false;
  function loadAnalytics() {
    if (!gaReady) return;
    window["ga-disable-" + GA_ID] = false;
    if (loaded) return;
    loaded = true;
    window.dataLayer = window.dataLayer || [];
    window.gtag = function () { window.dataLayer.push(arguments); };
    window.gtag("js", new Date());
    window.gtag("config", GA_ID, { anonymize_ip: true });
    const s = document.createElement("script");
    s.async = true;
    s.src = "https://www.googletagmanager.com/gtag/js?id=" + encodeURIComponent(GA_ID);
    document.head.appendChild(s);
  }
  function stopAnalytics() {
    if (!gaReady) return;
    window["ga-disable-" + GA_ID] = true;
    // Borra las cookies de Google Analytics de este dominio y del dominio padre
    const host = location.hostname, parts = host.split(".");
    const domains = ["", host, parts.length > 1 ? "." + parts.slice(-2).join(".") : host];
    document.cookie.split(";").map(c => c.split("=")[0].trim()).filter(n => /^_ga/.test(n)).forEach(n => {
      domains.forEach(d => { document.cookie = n + "=; Max-Age=0; path=/" + (d ? "; domain=" + d : ""); });
    });
  }
  // Eventos: solo se envían si la analítica está activa
  window.gallioliTrack = (name, params) => { if (loaded && window.gtag && !window["ga-disable-" + GA_ID]) window.gtag("event", name, params || {}); };

  function apply(choice) { if (choice && choice.analytics) loadAnalytics(); else stopAnalytics(); }

  let box;
  function build() {
    box = document.createElement("div");
    box.className = "cc";
    box.setAttribute("role", "dialog");
    box.setAttribute("aria-labelledby", "cc-t");
    box.setAttribute("aria-describedby", "cc-d");
    box.innerHTML =
      '<p class="cc-t" id="cc-t">Cookies</p>' +
      '<p id="cc-d">Guardamos tu elección en este navegador y, solo si lo aceptas, usamos cookies de analítica (Google Analytics) para saber qué partes de la web se visitan. ' +
      '<a href="' + new URL("privacidad.html#cookies", BASE).href + '">Más información</a></p>' +
      '<div class="cc-opts" hidden>' +
        '<label><input type="checkbox" checked disabled><span>Técnicas<small>Necesarias para recordar tu elección. Siempre activas.</small></span></label>' +
        '<label><input type="checkbox" id="cc-analytics"><span>Analítica<small>Google Analytics, con IP anonimizada. Nos ayuda a mejorar la web.</small></span></label>' +
      '</div>' +
      '<div class="cc-btns">' +
        '<button type="button" data-cc="reject">Rechazar</button>' +
        '<button type="button" data-cc="config">Configurar</button>' +
        '<button type="button" data-cc="accept">Aceptar</button>' +
      '</div>';
    document.body.appendChild(box);
    box.addEventListener("click", e => {
      const b = e.target.closest("button[data-cc]"); if (!b) return;
      const act = b.dataset.cc;
      if (act === "accept") save({ analytics: true });
      else if (act === "reject") save({ analytics: false });
      else if (act === "config") openConfig();
      else if (act === "save") save({ analytics: box.querySelector("#cc-analytics").checked });
    });
  }
  function openConfig() {
    box.querySelector(".cc-opts").hidden = false;
    const c = read(); box.querySelector("#cc-analytics").checked = !!(c && c.analytics);
    const b = box.querySelector('[data-cc="config"]'); b.dataset.cc = "save"; b.textContent = "Guardar selección";
  }
  function show(config) {
    if (!box) build();
    box.hidden = false;
    document.body.classList.add("cc-open");
    requestAnimationFrame(() => requestAnimationFrame(() => box.classList.add("show")));
    if (config) openConfig();
  }
  function hide() {
    if (!box) return;
    box.classList.remove("show");
    document.body.classList.remove("cc-open");
    setTimeout(() => { if (!box.classList.contains("show")) box.hidden = true; }, 600);
  }
  function save(choice) {
    write({ analytics: !!choice.analytics, date: new Date().toISOString() });
    apply(choice);
    hide();
    const b = box && box.querySelector('[data-cc="save"]');
    if (b) { b.dataset.cc = "config"; b.textContent = "Configurar"; box.querySelector(".cc-opts").hidden = true; }
  }
  window.openCookieSettings = () => show(true);

  function init() {
    const c = read();
    if (c) apply(c); else show(false);
    document.addEventListener("click", e => { if (e.target.closest("[data-cookie-settings]")) { e.preventDefault(); show(true); } });
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init); else init();
})();

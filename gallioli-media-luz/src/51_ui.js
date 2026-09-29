/* ===================== header: solid after 80px, active section ===================== */
const hdr = $("#cabecera");
let scrollQueued = false;
const onScrollHdr = () => { hdr.classList.toggle("is-scrolled", scrollY > 80); };
addEventListener("scroll", () => { if (!scrollQueued) { scrollQueued = true; requestAnimationFrame(() => { scrollQueued = false; onScrollHdr(); }); } }, { passive: true });
onScrollHdr();

(() => {
  const links = $$(".nav a");
  const byId = new Map(links.map(a => [a.getAttribute("href").slice(1), a]));
  const setCur = id => links.forEach(a => { if (a === byId.get(id)) a.setAttribute("aria-current", "true"); else a.removeAttribute("aria-current"); });
  if (!("IntersectionObserver" in window)) return;
  const secs = $$("main > section");
  /* Re-measure on every callback: entries can arrive before layout settles, so trust the geometry, not the entry. */
  const pick = () => { const y = innerHeight * .455; const s = secs.find(el => { const r = el.getBoundingClientRect(); return r.top <= y && r.bottom > y; }); setCur(s ? s.id : ""); };
  const io = IO(pick, { rootMargin: "-45% 0px -54% 0px" });
  secs.forEach(s => io.observe(s));
  addEventListener("load", pick);
})();

/* ===================== tracking of outbound actions ===================== */
document.addEventListener("click", e => {
  const a = e.target.closest ? e.target.closest("a") : null; if (!a) return;
  if (a.classList.contains("js-reserva")) track("reserva_click", { ubicacion: a.dataset.loc });
  else if (a.classList.contains("js-pedir")) track("pedido_click");
  else if (a.classList.contains("js-maps")) track("como_llegar_click");
});

/* ===================== toast + copy phone ===================== */
const toastEl = $("#toast");
let toastT = 0;
function toast(msg) {
  clearTimeout(toastT);
  toastEl.textContent = msg; toastEl.hidden = false;
  requestAnimationFrame(() => requestAnimationFrame(() => toastEl.classList.add("is-shown")));
  toastT = setTimeout(() => { toastEl.classList.remove("is-shown"); toastT = setTimeout(() => { toastEl.hidden = true; }, 320); }, 2600);
}
const PHONE = "932 22 77 38";
function selectPhoneNear(btn) {
  try {
    /* the nearest number that is actually rendered (the one in the closed menu is display:none) */
    const shown = box => $$(".tel", box).find(x => x.offsetParent !== null || x.getClientRects().length);
    let box = btn.parentElement, t = null;
    while (box && !(t = shown(box))) box = box.parentElement;
    if (!t) return;
    const r = document.createRange(); r.selectNodeContents(t);
    const sel = getSelection(); sel.removeAllRanges(); sel.addRange(r);
  } catch (e) {}
}
function legacyCopy(btn) {
  let ok = false;
  try {
    const ta = document.createElement("textarea");
    ta.value = PHONE; ta.setAttribute("readonly", ""); ta.setAttribute("aria-hidden", "true");
    ta.style.cssText = "position:fixed;top:0;left:0;width:1px;height:1px;opacity:0;pointer-events:none";
    document.body.appendChild(ta); ta.select(); ta.setSelectionRange(0, PHONE.length);
    ok = document.execCommand && document.execCommand("copy");
    ta.remove();
  } catch (e) { ok = false; }
  try { btn.focus({ preventScroll: true }); } catch (e) {}
  return !!ok;
}
function copied(ok, btn) {
  if (ok) { toast("Número copiado: " + PHONE); track("telefono_copiado"); }
  else { selectPhoneNear(btn); toast("Llámanos al " + PHONE); }
}
document.addEventListener("click", e => {
  const btn = e.target.closest ? e.target.closest(".js-copy") : null; if (!btn) return;
  e.preventDefault();
  let p = null;
  /* In a frame without clipboard permission the browser logs an error on every writeText: ask the policy first. */
  const pol = document.permissionsPolicy || document.featurePolicy;
  let allowed = true; try { if (pol && pol.allowsFeature) allowed = pol.allowsFeature("clipboard-write"); } catch (err) {}
  try { if (allowed && navigator.clipboard && navigator.clipboard.writeText) p = navigator.clipboard.writeText(PHONE); } catch (err) { p = null; }
  if (p && p.then) p.then(() => copied(true, btn), () => copied(legacyCopy(btn), btn));
  else copied(legacyCopy(btn), btn);
});

/* ===================== FAQ disclosures ===================== */
$$(".qa h3 button").forEach(b => b.addEventListener("click", () => {
  const qa = b.closest(".qa"), open = !qa.hasAttribute("data-open");
  qa.toggleAttribute("data-open", open); b.setAttribute("aria-expanded", String(open));
}));

/* ===================== carta: "calling" a row from El pase or Sobremesa ===================== */
function callRow(row) {
  if (!row) return;
  const smooth = !RM;
  row.scrollIntoView({ behavior: smooth ? "smooth" : "auto", block: "start" });
  let done = false, io = null;
  const fire = () => {
    if (done) return; done = true; if (io) io.disconnect();
    try { row.focus({ preventScroll: true }); } catch (e) {}
    row.classList.remove("is-called"); void row.offsetWidth; row.classList.add("is-called");
    setTimeout(() => row.classList.remove("is-called"), 1800);
  };
  if ("IntersectionObserver" in window) {
    io = IO(es => { if (es.some(x => x.intersectionRatio >= .5)) setTimeout(fire, smooth ? 120 : 0); }, { threshold: [.5, 1] });
    io.observe(row);
  }
  /* fallback when the observer stays silent: wait for the row itself (a slow frame can hold the smooth scroll back),
     and give up waiting after 3 s */
  const t0 = performance.now();
  const check = () => {
    if (done) return;
    const r = row.getBoundingClientRect(), seen = Math.min(r.bottom, innerHeight) - Math.max(r.top, 0);
    if (seen >= .5 * Math.min(r.height, innerHeight) || performance.now() - t0 > 3000) fire(); else setTimeout(check, 150);
  };
  setTimeout(check, 900);
}
document.addEventListener("click", e => {
  const a = e.target.closest ? e.target.closest('a[href^="#plato-"]') : null; if (!a) return;
  const row = document.getElementById(a.getAttribute("href").slice(1)); if (!row) return;
  e.preventDefault(); callRow(row);
});

/* ===================== formas: one row is always under the light ===================== */
(() => {
  const rows = $$(".formas .row"); if (!rows.length) return;
  let cur = rows.find(r => r.classList.contains("is-active")) || rows[0];
  const set = r => {
    if (r === cur) return;
    rows.forEach(x => { x.classList.toggle("is-active", x === r); if (x !== r) { const l = $(".row-lamp", x); if (l) l.classList.remove("enciende"); } });
    const lamp = $(".row-lamp", r);
    if (lamp && !RM) { lamp.classList.remove("enciende"); void lamp.getBoundingClientRect(); lamp.classList.add("enciende"); }
    cur = r;
  };
  rows.forEach(r => {
    r.addEventListener("mouseenter", () => { if (mqHover.matches) set(r); });
    r.addEventListener("focusin", () => set(r));
  });
  if ("IntersectionObserver" in window) {
    const io = IO(es => { if (mqHover.matches) return; es.forEach(e => { if (e.isIntersecting) set(e.target); }); }, { rootMargin: "-45% 0px -45% 0px" });
    rows.forEach(r => io.observe(r));
  }
})();

/* ===================== mobile menu ===================== */
const menu = $("#menu"), menuBtn = $(".menu-btn");
let menuOpen = false, menuT = 0;
const menuFocusables = () => [menuBtn, ...$$("a[href], button:not([disabled])", menu)];
function openMenu() {
  if (menuOpen) return; menuOpen = true; clearTimeout(menuT);
  menu.hidden = false; void menu.offsetWidth; menu.classList.add("is-open");
  root.classList.add("menu-open"); menuBtn.setAttribute("aria-expanded", "true"); menuBtn.textContent = "Cerrar";
  const first = $("a", menu); if (first) first.focus({ preventScroll: true });
  syncBar();
}
function closeMenu(returnFocus = true) {
  if (!menuOpen) return; menuOpen = false;
  menu.classList.remove("is-open"); root.classList.remove("menu-open");
  menuBtn.setAttribute("aria-expanded", "false"); menuBtn.textContent = "Menú";
  menuT = setTimeout(() => { if (!menuOpen) menu.hidden = true; }, RM ? 0 : 260);
  if (returnFocus) menuBtn.focus({ preventScroll: true });
  syncBar();
}
menuBtn.addEventListener("click", () => menuOpen ? closeMenu() : openMenu());
menu.addEventListener("click", e => { if (e.target.closest("a")) closeMenu(false); });
addEventListener("keydown", e => {
  if (!menuOpen) return;
  if (e.key === "Escape") { e.preventDefault(); closeMenu(); return; }
  if (e.key === "Tab") {
    const f = menuFocusables(), i = f.indexOf(document.activeElement);
    if (e.shiftKey && (i <= 0)) { e.preventDefault(); f[f.length - 1].focus(); }
    else if (!e.shiftKey && (i === f.length - 1 || i === -1)) { e.preventDefault(); f[0].focus(); }
  }
});
mqMobile.addEventListener && mqMobile.addEventListener("change", e => { if (!e.matches) closeMenu(false); });

/* ===================== sticky mobile booking bar ===================== */
const bar = $("#barra");
const barBlockers = new Set();
let sheetOpen = false;
function syncBar() {
  const show = barBlockers.size === 0 && !menuOpen && !sheetOpen && !document.body.classList.contains("cc-open");
  bar.classList.toggle("is-shown", show);
  if (show) bar.removeAttribute("inert"); else bar.setAttribute("inert", "");
}
if ("IntersectionObserver" in window) {
  const io = IO(es => { es.forEach(e => e.isIntersecting ? barBlockers.add(e.target) : barBlockers.delete(e.target)); syncBar(); });
  /* hidden over the hero, inside the two sticky scenes (their captions need the whole window), next to the other
     primary "Reservar mesa" buttons, Esta noche and the form */
  ["#inicio", ".pase-list", ".alli-list", "#formas .row .btn-luz", "#esta-noche", ".visita-actions", "#form"].forEach(s => { $$(s).forEach(el => { barBlockers.add(el); io.observe(el); }); });
} else barBlockers.add(document.body);
new MutationObserver(syncBar).observe(document.body, { attributes: true, attributeFilter: ["class"] });
syncBar();

/* ===================== legal sheet: inert page + focus trap while open (the kit itself is untouched) ===================== */
/* The kit is pasted after this script, so #sheet exists only once the document has been parsed. */
const initSheet = () => {
  const sheet = $("#sheet"); if (!sheet) return;
  const outside = () => [hdr, $("#contenido"), $("#pie"), bar, menu].filter(Boolean);
  let lastFocus = null;
  document.addEventListener("focusin", e => { if (!sheet.contains(e.target) && !(e.target.closest && e.target.closest(".cc"))) lastFocus = e.target; });
  const sync = () => {
    const open = !sheet.hidden && !sheet.classList.contains("closing");
    if (open === sheetOpen) return;
    sheetOpen = open;
    root.classList.toggle("sheet-open", open);
    outside().forEach(el => { if (open) el.setAttribute("inert", ""); else el.removeAttribute("inert"); });
    if (open && menuOpen) closeMenu(false);
    if (!open) {
      const a = document.activeElement;
      if ((!a || a === document.body || sheet.contains(a)) && lastFocus && lastFocus.focus) { try { lastFocus.focus({ preventScroll: true }); } catch (e) {} }
    }
    syncBar();
  };
  new MutationObserver(sync).observe(sheet, { attributes: true, attributeFilter: ["hidden", "class"] });
  addEventListener("keydown", e => {
    if (!sheetOpen || e.key !== "Tab") return;
    const cc = $(".cc.show");
    const f = [...$$('a[href], button:not([disabled]), input:not([disabled]), [tabindex]:not([tabindex="-1"])', sheet), ...(cc ? $$("a[href], button, input:not([disabled])", cc) : [])]
      .filter(el => el.offsetParent !== null || el === document.activeElement);
    if (!f.length) return;
    const i = f.indexOf(document.activeElement);
    if (e.shiftKey && i <= 0) { e.preventDefault(); f[f.length - 1].focus(); }
    else if (!e.shiftKey && (i === -1 || i === f.length - 1)) { e.preventDefault(); f[0].focus(); }
  });
  sync();
};
if (document.getElementById("sheet")) initSheet(); else document.addEventListener("DOMContentLoaded", initSheet);

/* ===================== demo toggle (footer) ===================== */
const demoBtn = $(".demo-btn");
function syncDemoBtn() {
  if (!demoBtn) return;
  const on = !!demo;
  demoBtn.setAttribute("aria-pressed", String(on));
  demoBtn.textContent = on ? "Volver a la hora real" : "Ver la sala abierta (demostración)";
}
if (demoBtn) demoBtn.addEventListener("click", () => {
  demo = demo ? null : { day: 5, min0: 1274, t0: Date.now() };
  syncDemoBtn(); tick();
});

/* ===================== group form: validation and antispam (rules and texts from option A) ===================== */
(() => {
  // Al publicar: añadir envío (Netlify o endpoint), ver README de la opción A.
  const FORM = { mode: "none" };
  const form = $("#form"); if (!form) return;
  const fStatus = $("#f-status");
  const loadedAt = Date.now();
  let lastSent = 0;
  const today = () => { const d = new Date(); d.setMinutes(d.getMinutes() - d.getTimezoneOffset()); return d.toISOString().slice(0, 10); };
  $("#f-fecha").min = today();
  const RULES = {
    nombre: v => v.trim().length < 2 ? "Escribe tu nombre." : "",
    email: v => !v.trim() ? "Escribe tu email." : !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim()) ? "Revisa el email: parece incompleto." : "",
    telefono: v => v.trim() && !/^[+]?[0-9 ()-]{9,20}$/.test(v.trim()) ? "Revisa el teléfono: usa solo números, con al menos 9 cifras." : "",
    fecha: v => !v ? "Elige una fecha." : v < today() ? "La fecha no puede ser anterior a hoy." : "",
    personas: v => !v ? "Indica cuántas personas seréis." : (+v < 1 || +v > 80 || !Number.isInteger(+v)) ? "Indica un número entre 1 y 80." : "",
    mensaje: v => v.trim().length < 10 ? "Cuéntanos un poco más (mínimo 10 caracteres)." : (v.match(/https?:\/\//gi) || []).length > 1 ? "Quita los enlaces del mensaje, por favor." : "",
    privacidad: (v, el) => !el.checked ? "Necesitamos que aceptes la política de privacidad para responderte." : ""
  };
  const ERR = { telefono: "tel", personas: "pax", mensaje: "msg", privacidad: "rgpd" };
  const touched = new Set();
  function check(el) {
    const rule = RULES[el.name]; if (!rule) return true;
    const msg = rule(el.value, el), err = document.getElementById("e-" + (ERR[el.name] || el.name));
    el.setAttribute("aria-invalid", msg ? "true" : "false");
    if (err) err.textContent = msg;
    return !msg;
  }
  const setStatus = (cls, msg) => { fStatus.className = "form-status" + (cls ? " " + cls : ""); fStatus.textContent = msg; };
  form.addEventListener("blur", e => { if (RULES[e.target.name]) { touched.add(e.target.name); check(e.target); } }, true);
  form.addEventListener("input", e => {
    if (e.target.name === "mensaje") $("#f-count").textContent = e.target.value.length + " / 1000";
    if (touched.has(e.target.name)) check(e.target);
  });
  form.addEventListener("change", e => { if (e.target.type === "checkbox") check(e.target); });
  form.addEventListener("submit", e => {
    e.preventDefault();
    setStatus("", "");
    const fields = Array.from(form.elements).filter(el => RULES[el.name]);
    fields.forEach(el => touched.add(el.name));
    const bad = fields.filter(el => !check(el));
    if (bad.length) { bad[0].focus(); setStatus("bad", bad.length === 1 ? "Revisa el campo marcado." : "Revisa los " + bad.length + " campos marcados."); return; }
    // Antispam: campo trampa, envío demasiado rápido y un envío por minuto
    const isBot = form.elements.web2.value !== "" || Date.now() - loadedAt < 3000;
    /* This preview sends nothing, so nobody is promised a reply: the antispam path answers exactly like the human one
       (the trap stays silent, and nothing says "Gracias, te responderemos"). */
    if (FORM.mode === "none") { setStatus("bad", "El formulario todavía no está conectado. Mientras tanto, llámanos al 932 22 77 38."); return; }
    if (Date.now() - lastSent < 60000) { setStatus("bad", "Ya hemos recibido una consulta hace un momento. Espera un minuto para enviar otra."); return; }
    if (isBot) { form.reset(); touched.clear(); $("#f-count").textContent = "0 / 1000"; setStatus("ok", "Gracias. Te responderemos lo antes posible."); return; }
  });
})();

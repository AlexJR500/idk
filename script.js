(() => {
  "use strict";

  /* =========================================================
     CONFIG Y DATOS
     ========================================================= */
  const PHONE = "34673650774";
  const TZ = "Europe/Madrid";
  // Horario por día (0 = domingo). Minutos desde medianoche; 24*60 = cierre a las 0:00.
  // Ajustar aquí si cambia el horario real del local.
  const HOURS = {
    0: [[13 * 60, 24 * 60]],
    1: [[13 * 60, 24 * 60]],
    2: [[13 * 60, 24 * 60]],
    3: [[13 * 60, 24 * 60]],
    4: [[13 * 60, 24 * 60]],
    5: [[13 * 60, 24 * 60]],
    6: [[13 * 60, 24 * 60]],
  };
  const DAY_NAMES = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];
  const LAST_BOOKING = 22 * 60 + 30;

  // Carta orientativa: sustituir por la carta real del local.
  const MENU = [
    { cat: "Para picar", name: "Croquetas de jamón ibérico", desc: "Cremosas por dentro, crujientes por fuera. 6 uds.", price: 9.5, tags: ["star"] },
    { cat: "Para picar", name: "Patatas bravas Marbar", desc: "Salsa brava de la casa y alioli suave.", price: 6.5, tags: ["veg", "gf", "star"] },
    { cat: "Para picar", name: "Pan de cristal con tomate", desc: "Tomate de colgar, AOVE y sal en escamas.", price: 4, tags: ["veg"] },
    { cat: "Para picar", name: "Jamón ibérico de bellota", desc: "Cortado a cuchillo, 80 g.", price: 18, tags: ["gf"] },
    { cat: "Del mar", name: "Calamares a la andaluza", desc: "Fritura ligera con limón y mayonesa de lima.", price: 13.5, tags: ["star"] },
    { cat: "Del mar", name: "Pulpo a la brasa", desc: "Sobre parmentier de patata y pimentón de la Vera.", price: 19, tags: ["gf", "star"] },
    { cat: "Del mar", name: "Tartar de atún rojo", desc: "Aguacate, sésamo tostado y soja cítrica.", price: 17.5, tags: [] },
    { cat: "Del mar", name: "Mejillones al vapor", desc: "Con vino blanco, ajo y perejil.", price: 11, tags: ["gf"] },
    { cat: "Arroces", name: "Arroz negro", desc: "Con sepia y alioli. Mín. 2 personas, precio por ración.", price: 17, tags: ["gf", "star"] },
    { cat: "Arroces", name: "Paella de marisco", desc: "Gamba, cigala y mejillón. Mín. 2 personas, precio por ración.", price: 19.5, tags: ["gf"] },
    { cat: "Arroces", name: "Arroz de verduras de temporada", desc: "Del huerto a la paella. Mín. 2 personas.", price: 15, tags: ["veg", "gf"] },
    { cat: "De la tierra", name: "Burger Marbar", desc: "Vaca madurada, cheddar, cebolla caramelizada y patatas.", price: 14.5, tags: ["star"] },
    { cat: "De la tierra", name: "Entraña a la brasa", desc: "Con chimichurri y verduras asadas.", price: 21, tags: ["gf"] },
    { cat: "De la tierra", name: "Burrata con tomate", desc: "Tomate rosa, pesto de albahaca y piñones.", price: 12.5, tags: ["veg", "gf"] },
    { cat: "Postres", name: "Tarta de queso", desc: "Horneada al momento, centro fundente.", price: 7, tags: ["veg", "star"] },
    { cat: "Postres", name: "Coulant de chocolate", desc: "Con helado de vainilla.", price: 7.5, tags: ["veg"] },
    { cat: "Postres", name: "Crema catalana", desc: "Quemada al momento, como manda la tradición.", price: 6, tags: ["veg", "gf"] },
    { cat: "Bebidas", name: "Vermut de la casa", desc: "Con naranja y oliva.", price: 4, tags: ["veg", "gf"] },
    { cat: "Bebidas", name: "Copa de vino", desc: "Selección de blancos, tintos y rosados.", price: 4.5, tags: ["veg", "gf"] },
    { cat: "Bebidas", name: "Caña", desc: "Bien tirada y bien fría.", price: 3, tags: ["veg"] },
  ];

  // Reseñas de ejemplo: sustituir por reseñas reales.
  const REVIEWS = [
    { name: "Laura M.", when: "Hace 2 semanas", text: "Servicio de diez y todo lo que pedimos estaba buenísimo. Las croquetas, de las mejores de Barcelona." },
    { name: "Jordi P.", when: "Hace 1 mes", text: "Calidad-precio inmejorable para la zona. El pulpo a la brasa, espectacular. Equipo súper atento." },
    { name: "Sofía R.", when: "Hace 3 semanas", text: "Celebramos un cumpleaños y nos trataron genial. Ambiente muy agradable y cocina hasta tarde." },
    { name: "Marc V.", when: "Hace 2 meses", text: "Pedimos a domicilio y llegó todo perfecto y calentito. Se nota el cariño en cada plato." },
    { name: "Elena G.", when: "Hace 1 semana", text: "Nuestro sitio de confianza en Sant Gervasi. El arroz negro es un must. Cinco estrellas merecidísimas." },
    { name: "David L.", when: "Hace 1 mes", text: "Fuimos por recomendación y superó expectativas. Raciones generosas, producto fresco y precio justo." },
  ];

  /* =========================================================
     UTILIDADES
     ========================================================= */
  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => [...el.querySelectorAll(s)];
  const euro = (n) => n.toLocaleString("es-ES", { style: "currency", currency: "EUR" });
  const pad = (n) => String(n).padStart(2, "0");
  const fmtMin = (m) => (m >= 24 * 60 ? "0:00" : `${Math.floor(m / 60)}:${pad(m % 60)}`);
  const icon = (id, cls = "ic") => `<svg class="${cls}" aria-hidden="true"><use href="#i-${id}"/></svg>`;

  const hasGsap = !!(window.gsap && window.ScrollTrigger && window.SplitText && window.Flip);
  const reduceMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const finePointer = matchMedia("(pointer: fine)").matches;
  const root = document.documentElement;
  if (!hasGsap) root.classList.add("no-gsap");
  if (hasGsap) gsap.registerPlugin(ScrollTrigger, SplitText, Flip);

  let toastTimer;
  function toast(msg) {
    const t = $("#toast");
    t.textContent = msg;
    t.classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => t.classList.remove("show"), 2400);
  }

  /* =========================================================
     HORARIO (hora de Barcelona)
     ========================================================= */
  function madridNow() {
    const parts = new Intl.DateTimeFormat("en-GB", {
      timeZone: TZ, weekday: "short", hour: "2-digit", minute: "2-digit", hour12: false,
      year: "numeric", month: "2-digit", day: "2-digit",
    }).formatToParts(new Date());
    const get = (t) => parts.find((p) => p.type === t).value;
    const wd = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].indexOf(get("weekday"));
    return { day: wd, minutes: (Number(get("hour")) % 24) * 60 + Number(get("minute")), iso: `${get("year")}-${get("month")}-${get("day")}` };
  }

  function openStatus() {
    const { day, minutes } = madridNow();
    const today = HOURS[day] || [];
    for (const [o, c] of today) {
      if (minutes >= o && minutes < c) return { open: true, text: `Abierto · Cierra a las ${fmtMin(c)}` };
    }
    const later = today.find(([o]) => o > minutes);
    if (later) return { open: false, text: `Cerrado · Abre a las ${fmtMin(later[0])}` };
    for (let i = 1; i <= 7; i++) {
      const d = (day + i) % 7;
      if (HOURS[d] && HOURS[d].length) {
        const when = i === 1 ? "mañana" : DAY_NAMES[d].toLowerCase();
        return { open: false, text: `Cerrado · Abre ${when} a las ${fmtMin(HOURS[d][0][0])}` };
      }
    }
    return { open: false, text: "Cerrado" };
  }

  function renderStatus() {
    const s = openStatus();
    $$("[data-status]").forEach((el) => {
      el.classList.toggle("open", s.open);
      el.classList.toggle("closed", !s.open);
      $("[data-status-text]", el).textContent = s.text;
    });
  }

  function renderHours() {
    const { day } = madridNow();
    $("#hoursList").innerHTML = [1, 2, 3, 4, 5, 6, 0].map((d) => {
      const ranges = HOURS[d] || [];
      const txt = ranges.length ? ranges.map(([o, c]) => `${fmtMin(o)} – ${fmtMin(c)}`).join(", ") : "Cerrado";
      return `<li class="${d === day ? "today" : ""}"><span>${DAY_NAMES[d]}${d === day ? " · hoy" : ""}</span><span>${txt}</span></li>`;
    }).join("");
  }

  /* =========================================================
     NAVEGACIÓN
     ========================================================= */
  const nav = $(".nav");
  const burger = $(".burger");
  function setMenu(open) {
    nav.classList.toggle("menu-open", open);
    burger.setAttribute("aria-expanded", open);
    burger.setAttribute("aria-label", open ? "Cerrar menú" : "Abrir menú");
  }
  burger.addEventListener("click", () => setMenu(!nav.classList.contains("menu-open")));
  addEventListener("keydown", (e) => { if (e.key === "Escape") setMenu(false); });

  // Scroll suave con compensación de la barra fija
  document.addEventListener("click", (e) => {
    const a = e.target.closest('a[href^="#"]');
    if (!a) return;
    const id = a.getAttribute("href");
    const target = id === "#top" ? document.body : $(id);
    if (!target) return;
    e.preventDefault();
    setMenu(false);
    const y = id === "#top" ? 0 : target.getBoundingClientRect().top + scrollY - 72;
    scrollTo({ top: y, behavior: reduceMotion ? "auto" : "smooth" });
    if (id !== "#top") history.replaceState(null, "", id);
  });

  const progress = $(".progress");
  const fab = $(".fab");
  let lastY = scrollY;
  function onScroll() {
    const y = scrollY;
    nav.classList.toggle("scrolled", y > 40);
    // Oculta la barra al bajar, la muestra al subir
    if (!nav.classList.contains("menu-open")) nav.classList.toggle("hide", y > 500 && y > lastY + 4);
    if (y < lastY - 4) nav.classList.remove("hide");
    lastY = y;
    const max = root.scrollHeight - innerHeight;
    progress.style.transform = `scaleX(${max > 0 ? y / max : 0})`;
    const r = $("#reservar").getBoundingClientRect();
    fab.classList.toggle("hidden", y < 300 || (r.top < innerHeight && r.bottom > 0));
  }
  addEventListener("scroll", onScroll, { passive: true });

  const spy = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (e.isIntersecting) $$(".nav-links a").forEach((a) => a.classList.toggle("active", a.getAttribute("href") === `#${e.target.id}`));
    });
  }, { rootMargin: "-45% 0px -50% 0px" });
  $$("section[id]").forEach((s) => spy.observe(s));

  /* =========================================================
     COLOR POR SECCIÓN: el body adopta el tema de la sección
     que ocupa el centro de la pantalla y se funde con transición CSS.
     ========================================================= */
  const themed = $$("main > [data-theme], .footer[data-theme]");
  root.classList.add("morph");
  const themeMeta = $('meta[name="theme-color"]');
  const setTheme = (t) => {
    if (document.body.dataset.theme === t) return;
    document.body.dataset.theme = t;
    themeMeta.content = getComputedStyle(document.body).getPropertyValue("--bg").trim() || themeMeta.content;
  };
  const themeIO = new IntersectionObserver((entries) => {
    entries.forEach((e) => { if (e.isIntersecting) setTheme(e.target.dataset.theme); });
  }, { rootMargin: "-50% 0px -50% 0px" });
  themed.forEach((s) => themeIO.observe(s));

  /* =========================================================
     CARTA INTERACTIVA
     ========================================================= */
  const cats = ["Todo", ...new Set(MENU.map((d) => d.cat))];
  let activeCat = "Todo";
  const activeFilters = new Set();
  const table = new Map(); // índice -> cantidad
  let guests = 2;
  const TAG_LABEL = { veg: `${icon("leaf")}Veggie`, gf: "Sin gluten", star: `${icon("star")}Favorito` };

  const tabs = $(".tabs");
  const pill = $(".tab-pill");
  tabs.insertAdjacentHTML("beforeend", cats.map((c, i) =>
    `<button class="tab" role="tab" id="tab-${i}" aria-selected="${c === activeCat}" tabindex="${c === activeCat ? 0 : -1}" data-cat="${c}">${c}</button>`).join(""));

  function movePill() {
    const sel = $('.tab[aria-selected="true"]', tabs);
    if (!sel) return;
    pill.style.width = sel.offsetWidth + "px";
    pill.style.height = sel.offsetHeight + "px";
    pill.style.transform = `translate(${sel.offsetLeft}px, ${sel.offsetTop}px)`;
  }
  function selectTab(b) {
    activeCat = b.dataset.cat;
    $$(".tab", tabs).forEach((t) => {
      t.setAttribute("aria-selected", t === b);
      t.tabIndex = t === b ? 0 : -1;
    });
    movePill();
    applyFilters();
  }
  tabs.addEventListener("click", (e) => { const b = e.target.closest(".tab"); if (b) selectTab(b); });
  tabs.addEventListener("keydown", (e) => {
    if (!["ArrowLeft", "ArrowRight"].includes(e.key)) return;
    const all = $$(".tab", tabs);
    const i = all.indexOf(document.activeElement);
    const next = all[(i + (e.key === "ArrowRight" ? 1 : -1) + all.length) % all.length];
    next.focus();
    selectTab(next);
  });
  addEventListener("resize", movePill);

  $$(".chip").forEach((chip) => chip.addEventListener("click", () => {
    const f = chip.dataset.filter;
    activeFilters.has(f) ? activeFilters.delete(f) : activeFilters.add(f);
    chip.setAttribute("aria-pressed", activeFilters.has(f));
    applyFilters();
  }));

  const grid = $("#menuGrid");
  grid.innerHTML = MENU.map((d, i) => `
    <button class="dish" data-i="${i}" aria-label="Añadir ${d.name}, ${euro(d.price)}, a tu mesa">
      <span class="add-ind" aria-hidden="true"></span>
      <div class="dish-top"><h3>${d.name}</h3><span class="price">${euro(d.price)}</span></div>
      <p>${d.desc}</p>
      <div class="tags">${d.tags.map((t) => `<span class="tag ${t === "star" ? "fav" : ""}">${TAG_LABEL[t]}</span>`).join("")}</div>
      <span class="dish-add">${icon("arrow")}Añadir a mi mesa</span>
    </button>`).join("") + `<p class="menu-empty" hidden>No hay platos con esos filtros. Prueba a quitar alguno.</p>`;
  const dishes = $$(".dish", grid);

  let refreshTimer;
  const refreshST = () => { if (hasGsap) { clearTimeout(refreshTimer); refreshTimer = setTimeout(() => ScrollTrigger.refresh(), 120); } };

  function applyFilters() {
    // Si la entrada de la carta sigue en marcha, la terminamos antes de medir para que Flip no herede transformaciones a medias
    if (hasGsap) gsap.getTweensOf(dishes).forEach((t) => t.progress(1).kill());
    const state = hasGsap && !reduceMotion ? Flip.getState(dishes) : null;
    let visible = 0;
    dishes.forEach((el) => {
      const d = MENU[el.dataset.i];
      const show = (activeCat === "Todo" || d.cat === activeCat) && [...activeFilters].every((f) => d.tags.includes(f));
      el.style.display = show ? "" : "none";
      if (show) visible++;
    });
    $(".menu-empty", grid).hidden = visible > 0;
    if (state) {
      Flip.from(state, {
        duration: 0.6, ease: "expo.out", absolute: true, scale: true, nested: true,
        onEnter: (els) => gsap.fromTo(els, { opacity: 0, scale: 0.85, y: 20 }, { opacity: 1, scale: 1, y: 0, duration: 0.5, stagger: 0.03, ease: "expo.out" }),
        onLeave: (els) => gsap.to(els, { opacity: 0, scale: 0.85, duration: 0.3 }),
        onComplete: refreshST,
      });
    } else refreshST();
  }

  function updateDish(i) {
    const el = dishes[i];
    const q = table.get(i) || 0;
    el.classList.toggle("added", q > 0);
    $(".add-ind", el).textContent = q ? "×" + q : "";
  }

  grid.addEventListener("click", (e) => {
    const b = e.target.closest(".dish");
    if (!b) return;
    const i = Number(b.dataset.i);
    table.set(i, (table.get(i) || 0) + 1);
    updateDish(i);
    const rect = b.getBoundingClientRect();
    const from = e.clientX ? { x: e.clientX, y: e.clientY } : { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
    flyToTable(from, () => renderTable(true));
    if (hasGsap && !reduceMotion) {
      gsap.fromTo($(".add-ind", b), { scale: 0.4 }, { scale: 1, duration: 0.6, ease: "elastic.out(1, .4)" });
    }
    toast(`${MENU[i].name} añadido a tu mesa`);
  });

  // Efecto spotlight + inclinación 3D en las tarjetas
  if (finePointer && hasGsap && !reduceMotion) {
    dishes.forEach((el) => {
      const rx = gsap.quickTo(el, "rotationX", { duration: 0.5, ease: "power3" });
      const ry = gsap.quickTo(el, "rotationY", { duration: 0.5, ease: "power3" });
      el.addEventListener("pointermove", (e) => {
        const r = el.getBoundingClientRect();
        const px = (e.clientX - r.left) / r.width;
        const py = (e.clientY - r.top) / r.height;
        el.style.setProperty("--mx", `${px * 100}%`);
        el.style.setProperty("--my", `${py * 100}%`);
        rx((0.5 - py) * 10);
        ry((px - 0.5) * 12);
      });
      el.addEventListener("pointerleave", () => { rx(0); ry(0); });
    });
  }

  const tableCard = $("#tableCard");
  const bubble = $("#tableBubble");
  let cardInView = false;
  new IntersectionObserver(([e]) => { cardInView = e.isIntersecting; syncBubble(); }, { threshold: 0.3 }).observe(tableCard);
  function syncBubble() { bubble.classList.toggle("show", table.size > 0 && !cardInView); }

  function flyToTable(from, done) {
    const target = cardInView ? tableCard : bubble.classList.contains("show") ? bubble : null;
    if (!hasGsap || reduceMotion || !target) { done(); return; }
    const t = target.getBoundingClientRect();
    const to = { x: t.left + (cardInView ? 60 : t.width / 2), y: t.top + (cardInView ? 40 : t.height / 2) };
    const dot = document.createElement("div");
    dot.className = "fly";
    document.body.appendChild(dot);
    gsap.set(dot, { x: from.x, y: from.y, scale: 0.4 });
    gsap.timeline({ onComplete: () => { dot.remove(); done(); } })
      .to(dot, { scale: 1.2, duration: 0.15 })
      .to(dot, { x: to.x, duration: 0.65, ease: "power1.inOut" }, 0)
      .to(dot, { y: to.y, duration: 0.65, ease: "back.in(1.6)" }, 0)
      .to(dot, { scale: 0.3, opacity: 0.4, duration: 0.2 }, 0.5);
  }

  function renderTable(bump = false) {
    const list = $("#tableList");
    if (!table.size) {
      list.innerHTML = `<li class="empty">Aún no has elegido nada. Toca un plato de la carta.</li>`;
    } else {
      list.innerHTML = [...table].map(([i, q]) => `
        <li>
          <span class="name">${MENU[i].name}</span>
          <span class="qty">
            <button data-act="dec" data-i="${i}" aria-label="Quitar una ración de ${MENU[i].name}">−</button><span>${q}</span><button data-act="inc" data-i="${i}" aria-label="Añadir una ración de ${MENU[i].name}">+</button>
          </span>
          <span class="sub">${euro(MENU[i].price * q)}</span>
        </li>`).join("");
    }
    const total = [...table].reduce((s, [i, q]) => s + MENU[i].price * q, 0);
    const count = [...table.values()].reduce((a, b) => a + b, 0);
    animateNumber($("#tableTotal"), total);
    animateNumber($("#perPerson"), total / guests);
    $("#guestCount").textContent = guests;
    $("#tableGuests").textContent = guests;
    $("#tbCount").textContent = count;
    $("#tbTotal").textContent = euro(total);
    syncBubble();
    if (bump) {
      const el = cardInView ? tableCard : bubble;
      el.classList.remove("bump");
      void el.offsetWidth;
      el.classList.add("bump");
      if (!cardInView && hasGsap && !reduceMotion) gsap.fromTo(bubble, { scale: 1.15 }, { scale: 1, duration: 0.6, ease: "elastic.out(1, .4)" });
    }
  }

  const numState = new WeakMap();
  function animateNumber(el, value) {
    const prev = numState.get(el) ?? 0;
    numState.set(el, value);
    if (!hasGsap || reduceMotion) { el.textContent = euro(value); return; }
    const o = { v: prev };
    gsap.to(o, { v: value, duration: 0.6, ease: "power2.out", onUpdate: () => (el.textContent = euro(o.v)) });
  }

  $("#tableList").addEventListener("click", (e) => {
    const b = e.target.closest("button[data-act]");
    if (!b) return;
    const i = Number(b.dataset.i);
    const q = (table.get(i) || 0) + (b.dataset.act === "inc" ? 1 : -1);
    q > 0 ? table.set(i, q) : table.delete(i);
    updateDish(i);
    renderTable();
  });
  $("#clearTable").addEventListener("click", () => {
    const keys = [...table.keys()];
    table.clear();
    keys.forEach(updateDish);
    renderTable();
  });
  $("#guestMinus").addEventListener("click", () => { guests = Math.max(1, guests - 1); renderTable(); syncParty(); });
  $("#guestPlus").addEventListener("click", () => { guests = Math.min(20, guests + 1); renderTable(); syncParty(); });

  /* =========================================================
     RESEÑAS (marquesina en dos filas)
     ========================================================= */
  const COLORS = ["#a4471f", "#173a4e", "#8c6a33", "#4e5b31", "#5a1e2a", "#0f1a22"];
  const stars = Array.from({ length: 5 }, () => icon("star")).join("");
  const reviewHTML = (r, i, dup) => `
    <article class="review" ${dup ? 'aria-hidden="true"' : ""}>
      <span class="stars" role="img" aria-label="5 estrellas">${stars}</span>
      <blockquote>“${r.text}”</blockquote>
      <div class="review-author">
        <span class="avatar" style="background:${COLORS[i % COLORS.length]}" aria-hidden="true">${r.name[0]}</span>
        <div><strong>${r.name}</strong><small>${r.when} · Google</small></div>
      </div>
    </article>`;
  const rows = $$(".t-row");
  const halves = [REVIEWS.slice(0, 3).concat(REVIEWS.slice(3, 4)), REVIEWS.slice(3).concat(REVIEWS.slice(0, 1))];
  rows.forEach((row, ri) => {
    const set = halves[ri];
    const off = ri * 3;
    const html = set.map((r, i) => reviewHTML(r, i + off, false)).join("") + set.map((r, i) => reviewHTML(r, i + off, true)).join("")
      + set.map((r, i) => reviewHTML(r, i + off, true)).join("") + set.map((r, i) => reviewHTML(r, i + off, true)).join("");
    $(".t-track", row).innerHTML = html;
  });

  const tweens = [];
  const pauseBtn = $("#tPause");
  let userPaused = reduceMotion;
  if (hasGsap && !reduceMotion) {
    rows.forEach((row) => {
      const track = $(".t-track", row);
      const dir = Number(row.dataset.dir);
      const tw = dir > 0
        ? gsap.fromTo(track, { xPercent: 0 }, { xPercent: -50, duration: 70, ease: "none", repeat: -1 })
        : gsap.fromTo(track, { xPercent: -50 }, { xPercent: 0, duration: 70, ease: "none", repeat: -1 });
      tweens.push(tw);
    });
    const slow = (to) => tweens.forEach((tw) => gsap.to(tw, { timeScale: to, duration: 0.6, overwrite: true }));
    const tWrap = $("#testimonials");
    tWrap.addEventListener("pointerenter", () => !userPaused && slow(0.1));
    tWrap.addEventListener("pointerleave", () => !userPaused && slow(1));
    pauseBtn.addEventListener("click", () => {
      userPaused = !userPaused;
      slow(userPaused ? 0 : 1);
      pauseBtn.setAttribute("aria-pressed", userPaused);
      pauseBtn.setAttribute("aria-label", userPaused ? "Reanudar reseñas" : "Pausar reseñas");
      pauseBtn.innerHTML = icon(userPaused ? "play" : "pause");
    });
  } else {
    pauseBtn.hidden = true;
  }

  /* =========================================================
     RESERVA
     ========================================================= */
  const dateInput = $("#bDate");
  const today = madridNow();
  dateInput.min = today.iso;
  dateInput.value = today.iso;
  let chosenSlot = null;

  function renderSlots() {
    const val = dateInput.value;
    const box = $("#slots");
    if (!val) { box.innerHTML = `<span class="none">Elige un día.</span>`; chosenSlot = null; return; }
    const d = new Date(val + "T12:00:00").getDay();
    const ranges = HOURS[d] || [];
    const now = madridNow();
    const isToday = val === now.iso;
    const slots = [];
    ranges.forEach(([o, c]) => { for (let m = o; m <= Math.min(c - 60, LAST_BOOKING); m += 30) slots.push(m); });
    if (!slots.length) { box.innerHTML = `<span class="none">Ese día estamos cerrados.</span>`; chosenSlot = null; return; }
    box.innerHTML = slots.map((m) => {
      const past = isToday && m <= now.minutes + 30;
      return `<button type="button" class="slot" role="radio" data-m="${m}" aria-checked="${m === chosenSlot}" ${past ? "disabled" : ""}>${fmtMin(m)}</button>`;
    }).join("");
    if (chosenSlot !== null && !$(`.slot[data-m="${chosenSlot}"]:not(:disabled)`, box)) chosenSlot = null;
    if (!$(".slot:not(:disabled)", box)) box.insertAdjacentHTML("beforeend", `<span class="none">Hoy ya no quedan horas: prueba otro día.</span>`);
    if (hasGsap && !reduceMotion) gsap.from($$(".slot", box), { opacity: 0, y: 8, duration: 0.3, stagger: 0.015, ease: "power1.out" });
    syncSteps();
  }
  dateInput.addEventListener("change", renderSlots);
  $("#slots").addEventListener("click", (e) => {
    const b = e.target.closest(".slot");
    if (!b || b.disabled) return;
    chosenSlot = Number(b.dataset.m);
    $$(".slot").forEach((s) => s.setAttribute("aria-checked", s === b));
    syncSteps();
  });

  const party = $("#party");
  party.innerHTML = [1, 2, 3, 4, 5, 6, 7, 8].map((n) =>
    `<button type="button" class="pp" role="radio" data-n="${n}" aria-checked="${n === guests}" aria-label="${n === 8 ? "8 o más" : n} ${n === 1 ? "persona" : "personas"}">${n === 8 ? "8+" : n}</button>`).join("");
  function syncParty() { $$(".pp").forEach((p) => p.setAttribute("aria-checked", Number(p.dataset.n) === Math.min(guests, 8))); }
  party.addEventListener("click", (e) => {
    const b = e.target.closest(".pp");
    if (!b) return;
    guests = Number(b.dataset.n);
    syncParty();
    renderTable();
    syncSteps();
  });

  function syncSteps() {
    const done = { date: !!dateInput.value, time: chosenSlot !== null, party: guests > 0 };
    $$(".step").forEach((s) => s.classList.toggle("done", done[s.dataset.step]));
    const n = Object.values(done).filter(Boolean).length;
    $(".steps-bar i").style.transform = `scaleX(${n / 3})`;
  }

  function fieldError(input, msg) {
    input.classList.toggle("invalid", !!msg);
    input.setAttribute("aria-invalid", !!msg);
    $("#" + input.getAttribute("aria-describedby")).textContent = msg || "";
  }

  const modal = $("#modal");
  let lastFocus = null;
  function openModal(text, url) {
    lastFocus = document.activeElement;
    $("#modalText").textContent = text;
    $("#modalWa").href = url;
    modal.hidden = false;
    requestAnimationFrame(() => modal.classList.add("open"));
    if (hasGsap && !reduceMotion) gsap.fromTo(".modal-card", { scale: 0.85, y: 30, opacity: 0 }, { scale: 1, y: 0, opacity: 1, duration: 0.6, ease: "back.out(1.6)" });
    $("#modalWa").focus();
  }
  function closeModal() {
    modal.classList.remove("open");
    modal.hidden = true;
    if (lastFocus) lastFocus.focus();
  }
  $("#modalClose").addEventListener("click", closeModal);
  $("#modalWa").addEventListener("click", () => setTimeout(closeModal, 300));
  modal.addEventListener("click", (e) => { if (e.target === modal) closeModal(); });
  modal.addEventListener("keydown", (e) => {
    if (e.key === "Escape") closeModal();
    if (e.key === "Tab") {
      const f = [$("#modalClose"), $("#modalWa")];
      if (e.shiftKey && document.activeElement === f[0]) { e.preventDefault(); f[1].focus(); }
      else if (!e.shiftKey && document.activeElement === f[1]) { e.preventDefault(); f[0].focus(); }
    }
  });

  $("#bookingForm").addEventListener("submit", (e) => {
    e.preventDefault();
    const nameI = $("#bName");
    const phoneI = $("#bPhone");
    const name = nameI.value.trim();
    const phone = phoneI.value.trim();
    const err = $("#formError");
    const phoneOk = phone.replace(/\D/g, "").length >= 9;
    fieldError(nameI, name ? "" : "Dinos tu nombre.");
    fieldError(phoneI, phoneOk ? "" : "Revisa el teléfono (mín. 9 dígitos).");
    let msg = "";
    if (!dateInput.value) msg = "Elige un día.";
    else if (chosenSlot === null) msg = "Elige una hora.";
    else if (!name || !phoneOk) msg = "Revisa los campos marcados.";
    err.textContent = msg;
    if (msg) {
      if (hasGsap && !reduceMotion) gsap.fromTo("#bookingForm", { x: -8 }, { x: 0, duration: 0.5, ease: "elastic.out(1, .3)" });
      if (chosenSlot === null && dateInput.value) $(".slot:not(:disabled)")?.focus();
      else if (!name) nameI.focus();
      else if (!phoneOk) phoneI.focus();
      return;
    }

    const dateTxt = new Date(dateInput.value + "T12:00:00").toLocaleDateString("es-ES", { weekday: "long", day: "numeric", month: "long" });
    const notes = $("#bNotes").value.trim();
    const people = guests >= 8 ? "8 o más" : guests;
    let wa = `¡Hola Marbar! Me gustaría reservar mesa:\n• Día: ${dateTxt}\n• Hora: ${fmtMin(chosenSlot)}\n• Personas: ${people}\n• Nombre: ${name}\n• Teléfono: ${phone}`;
    if (notes) wa += `\n• Comentarios: ${notes}`;
    if (table.size) wa += `\n\nNos apetece: ${[...table].map(([i, q]) => `${q}× ${MENU[i].name}`).join(", ")}`;
    openModal(`${dateTxt[0].toUpperCase() + dateTxt.slice(1)} a las ${fmtMin(chosenSlot)} · ${people} ${guests === 1 ? "persona" : "personas"}. Envía el mensaje por WhatsApp para confirmar.`,
      `https://wa.me/${PHONE}?text=${encodeURIComponent(wa)}`);
  });

  /* =========================================================
     COMPARTIR
     ========================================================= */
  $("#shareBtn").addEventListener("click", async () => {
    const data = { title: "Marbar", text: "Marbar · 4,9★ en la Bonanova, Barcelona", url: location.href };
    try {
      if (navigator.share) return await navigator.share(data);
      await navigator.clipboard.writeText(location.href);
      toast("Enlace copiado al portapapeles");
    } catch (_) { /* cancelado */ }
  });

  /* =========================================================
     ANIMACIONES (GSAP)
     ========================================================= */
  const loader = $(".loader");
  function endLoading() {
    document.body.classList.remove("is-loading");
    loader.classList.add("done");
  }

  function initMotion() {
    if (!hasGsap) { endLoading(); return; }

    const mm = gsap.matchMedia();

    mm.add("(prefers-reduced-motion: reduce)", () => { endLoading(); });

    mm.add("(prefers-reduced-motion: no-preference)", () => {
      /* --- Loader + entrada del hero --- */
      let seen = false;
      try { seen = sessionStorage.getItem("marbar-intro") === "1"; } catch (_) {}
      try { sessionStorage.setItem("marbar-intro", "1"); } catch (_) {}

      const heroSplit = SplitText.create(".hero-title .line", { type: "words,chars", mask: "words" });
      const intro = gsap.timeline({ paused: true })
        .fromTo(".arch-frame", { clipPath: "inset(100% 0% 0% 0% round 999px 999px 18px 18px)" }, { clipPath: "inset(0% 0% 0% 0% round 999px 999px 18px 18px)", duration: 1.5, ease: "expo.inOut", clearProps: "clipPath" }, 0)
        .from(".scene", { scale: 1.35, duration: 2.2, ease: "expo.out" }, 0.2)
        .from(".sun-g", { y: 140, duration: 2.4, ease: "expo.out" }, 0.3)
        .from(".stars-l circle", { opacity: 0, duration: 1, stagger: 0.08 }, 0.9)
        .from(heroSplit.chars, { yPercent: 110, rotateX: -60, opacity: 0, duration: 1, stagger: 0.02, ease: "expo.out" }, 0.25)
        .from(".hero-eyebrow", { y: 16, opacity: 0, duration: 0.6, ease: "power2.out" }, 0.3)
        .from(".hero-eyebrow .rule", { scaleX: 0, duration: 0.9, ease: "expo.out" }, 0.4)
        .from(".hero-lead", { y: 20, opacity: 0, duration: 0.8, ease: "power2.out" }, 0.7)
        .from(".hero-cta > *", { y: 20, opacity: 0, duration: 0.6, stagger: 0.08, ease: "back.out(1.7)" }, 0.85)
        .from(".hero-stats .stat", { y: 24, opacity: 0, duration: 0.8, stagger: 0.08, ease: "expo.out" }, 0.95)
        .add(() => $$(".hero-stats [data-count]").forEach(countUp), 1)
        .from(".badge", { scale: 0, rotate: -120, duration: 1.1, ease: "back.out(1.6)" }, 1.1)
        .from(".arch-caption", { opacity: 0, y: 20, duration: 0.8 }, 1.2)
        .from(".nav", { opacity: 0, duration: 0.7, ease: "power2.out", clearProps: "opacity" }, 0.3);

      if (seen) {
        endLoading();
        intro.play();
      } else {
        const lt = gsap.timeline({ onComplete: endLoading });
        const paths = $$(".loader-mark .l-ring, .loader-mark .l-wave");
        paths.forEach((p) => { const len = p.getTotalLength(); gsap.set(p, { strokeDasharray: len, strokeDashoffset: len }); });
        lt.to(paths, { strokeDashoffset: 0, duration: 0.9, stagger: 0.12, ease: "power2.inOut" })
          .from(".l-sun", { scale: 0, transformOrigin: "center", duration: 0.5, ease: "back.out(3)" }, 0.5)
          .from(".loader-word span", { yPercent: 110, duration: 0.7, stagger: 0.05, ease: "expo.out" }, 0.3)
          .from(".loader-sub", { opacity: 0, letterSpacing: "0.8em", duration: 0.9, ease: "expo.out" }, 0.6)
          // Cortinas con la paleta de la casa: suben y luego se retiran hacia arriba
          .to(".loader-curtains i", { scaleY: 1, duration: 0.6, stagger: 0.07, ease: "expo.inOut" }, "+=0.2")
          .set(".loader-inner", { opacity: 0 })
          .set(loader, { background: "transparent" })
          .set(".loader-curtains i", { transformOrigin: "top" })
          .to(".loader-curtains i", { scaleY: 0, duration: 0.7, stagger: 0.07, ease: "expo.inOut" })
          .add(() => intro.play(), "-=0.7");
        setTimeout(endLoading, 6000); // salvaguarda
      }

      /* --- Escena del arco: olas vivas y atardecer al hacer scroll --- */
      gsap.to(".wv1", { x: -40, duration: 5, ease: "sine.inOut", repeat: -1, yoyo: true });
      gsap.to(".wv2", { x: 40, duration: 6.5, ease: "sine.inOut", repeat: -1, yoyo: true });
      gsap.to(".glints rect", { opacity: 0.15, scaleX: 0.6, transformOrigin: "center", duration: 1.4, stagger: { each: 0.25, repeat: -1, yoyo: true }, ease: "sine.inOut" });
      gsap.to(".boat", { x: -60, y: 2, duration: 14, ease: "sine.inOut", repeat: -1, yoyo: true });
      gsap.timeline({ scrollTrigger: { trigger: ".hero", start: "top top", end: "bottom top", scrub: 0.8 } })
        .to(".sun-g", { y: 90 }, 0)
        .to(".sky", { opacity: 0.35 }, 0)
        .to(".hero-arch", { yPercent: -10 }, 0)
        .to(".hero-content", { yPercent: 14, opacity: 0.25 }, 0);

      /* --- Marquesina que reacciona a la dirección del scroll --- */
      const mq = gsap.to(".marquee-track", { xPercent: -50, duration: 28, ease: "none", repeat: -1 });
      ScrollTrigger.create({
        start: 0, end: "max",
        onUpdate: (self) => {
          const v = Math.min(Math.abs(self.getVelocity()) / 300, 5);
          gsap.to(mq, { timeScale: self.direction * (1 + v), duration: 0.3, overwrite: true });
          gsap.to(mq, { timeScale: self.direction, duration: 1.2, delay: 0.3, overwrite: false });
        },
      });
      gsap.to(".marquee", { skewY: -1.5, scrollTrigger: { trigger: ".marquee", start: "top bottom", end: "bottom top", scrub: true } });

      /* --- Frase que se "enciende" palabra a palabra --- */
      const st = SplitText.create("#statement", { type: "words", wordsClass: "word" });
      gsap.fromTo(st.words, { opacity: 0.12 }, {
        opacity: 1, stagger: 0.1, ease: "none",
        scrollTrigger: { trigger: ".statement", start: "top 70%", end: "bottom 60%", scrub: true },
      });

      /* --- Paleta de la casa: arcos que brotan en cascada --- */
      gsap.from(".palette span", {
        yPercent: 60, scaleY: 0.2, opacity: 0, transformOrigin: "bottom", duration: 1.1, stagger: 0.09, ease: "expo.out",
        scrollTrigger: { trigger: ".palette", start: "top 90%", once: true },
      });

      /* --- Líneas de los antetítulos --- */
      $$(".eyebrow .rule").forEach((r) => {
        if (r.closest(".hero")) return;
        gsap.from(r, { scaleX: 0, duration: 1, ease: "expo.out", scrollTrigger: { trigger: r, start: "top 92%", once: true } });
      });

      /* --- Titulares con máscara por líneas --- */
      $$(".split-heading").forEach((el) => {
        SplitText.create(el, {
          type: "lines", mask: "lines", linesClass: "split-line", autoSplit: true,
          onSplit: (self) => gsap.from(self.lines, {
            yPercent: 105, duration: 1, stagger: 0.1, ease: "expo.out",
            scrollTrigger: { trigger: el, start: "top 88%", once: true },
          }),
        });
      });

      $$(".fade-up").forEach((el) => gsap.from(el, {
        y: 24, opacity: 0, duration: 0.8, ease: "power2.out",
        scrollTrigger: { trigger: el, start: "top 90%", once: true },
      }));

      /* --- Contadores y barras --- */
      $$("#resenas [data-count]").forEach((el) => ScrollTrigger.create({ trigger: el, start: "top 85%", once: true, onEnter: () => countUp(el) }));
      gsap.from(".bar i", {
        scaleX: 0, duration: 1.4, stagger: 0.08, ease: "expo.out",
        scrollTrigger: { trigger: ".rating-bars", start: "top 85%", once: true },
      });
      gsap.from(".big-rating .stars .ic", {
        scale: 0, rotate: -90, duration: 0.6, stagger: 0.08, ease: "back.out(2.5)",
        scrollTrigger: { trigger: ".big-rating", start: "top 85%", once: true },
      });

      /* --- Carta --- */
      gsap.from(".dish", {
        y: 40, opacity: 0, duration: 0.7, stagger: { each: 0.04, from: "start" }, ease: "expo.out",
        scrollTrigger: { trigger: "#menuGrid", start: "top 85%", once: true },
      });
      gsap.from(".table-card", {
        y: 60, opacity: 0, duration: 1, ease: "expo.out",
        scrollTrigger: { trigger: ".menu-layout", start: "top 80%", once: true },
      });

      /* --- Reserva, visita y contacto --- */
      gsap.from(".booking", {
        y: 60, opacity: 0, duration: 1, ease: "expo.out",
        scrollTrigger: { trigger: ".booking", start: "top 85%", once: true },
      });
      gsap.from(".modes li", {
        y: 20, opacity: 0, duration: 0.5, stagger: 0.08, ease: "back.out(2)",
        scrollTrigger: { trigger: ".modes", start: "top 90%", once: true },
      });
      gsap.from(".contact-card", {
        y: 24, opacity: 0, duration: 0.6, stagger: 0.07, ease: "power2.out",
        scrollTrigger: { trigger: ".contact", start: "top 90%", once: true },
      });
      gsap.from(".map", {
        clipPath: "inset(15% 15% 15% 15% round 28px)", duration: 1.3, ease: "expo.inOut",
        scrollTrigger: { trigger: ".map", start: "top 85%", once: true },
      });

      /* --- Pie --- */
      gsap.from(".footer-word span", {
        yPercent: 100, opacity: 0, duration: 1, stagger: 0.06, ease: "expo.out",
        scrollTrigger: { trigger: ".footer", start: "top 80%", once: true },
      });

      return () => { heroSplit.revert(); st.revert(); };
    });

    /* --- Experiencia: scroll horizontal (escritorio) --- */
    mm.add("(min-width: 861px) and (prefers-reduced-motion: no-preference)", () => {
      const track = $(".exp-track");
      const dist = () => track.scrollWidth - innerWidth;
      const h = gsap.to(track, {
        x: () => -dist(), ease: "none",
        scrollTrigger: { trigger: ".experience", pin: true, scrub: 0.8, end: () => "+=" + dist(), invalidateOnRefresh: true },
      });
      $$(".exp-card").forEach((card) => {
        gsap.from(card, {
          rotate: 6, y: 80, scale: 0.9, ease: "none",
          scrollTrigger: { trigger: card, containerAnimation: h, start: "left 100%", end: "left 55%", scrub: true },
        });
        gsap.to($(".exp-num", card), {
          xPercent: 60, ease: "none",
          scrollTrigger: { trigger: card, containerAnimation: h, start: "left right", end: "right left", scrub: true },
        });
      });
      gsap.from(".exp-hint .ic", { x: -6, repeat: -1, yoyo: true, duration: 0.6, ease: "sine.inOut" });
    });

    mm.add("(max-width: 860px) and (prefers-reduced-motion: no-preference)", () => {
      $$(".exp-card").forEach((card) => gsap.from(card, {
        y: 60, scale: 0.94, opacity: 0, duration: 0.9, ease: "expo.out",
        scrollTrigger: { trigger: card, start: "top 90%", once: true },
      }));
    });

    /* --- Cursor personalizado y botones magnéticos --- */
    mm.add("(pointer: fine) and (prefers-reduced-motion: no-preference)", () => {
      root.classList.add("has-cursor");
      const cursor = $(".cursor");
      const dot = $(".cursor-dot");
      const label = $(".cursor-label");
      const cx = gsap.quickTo(cursor, "x", { duration: 0.45, ease: "power3" });
      const cy = gsap.quickTo(cursor, "y", { duration: 0.45, ease: "power3" });
      const dx = gsap.quickTo(dot, "x", { duration: 0.08 });
      const dy = gsap.quickTo(dot, "y", { duration: 0.08 });
      const move = (e) => { cx(e.clientX); cy(e.clientY); dx(e.clientX); dy(e.clientY); };
      const over = (e) => {
        const dish = e.target.closest(".dish");
        const inter = e.target.closest("a, button, input, textarea, [role=tab]");
        cursor.classList.toggle("is-label", !!dish);
        cursor.classList.toggle("is-hover", !dish && !!inter);
        label.textContent = dish ? "+ Añadir" : "";
      };
      addEventListener("pointermove", move);
      document.addEventListener("pointerover", over);

      // El arco del hero sigue al ratón en capas (sol, olas y marco a distinta profundidad)
      const hero = $(".hero");
      const layers = [[".sun-disc", 18], [".sun-glow", 12], [".hill", 8], [".stars-l", 5]].map(([sel, d]) => ({
        xTo: gsap.quickTo(sel, "x", { duration: 1.2, ease: "power3" }), d,
      }));
      const archRX = gsap.quickTo(".arch-frame", "rotationY", { duration: 1, ease: "power3" });
      const archRY = gsap.quickTo(".arch-frame", "rotationX", { duration: 1, ease: "power3" });
      gsap.set(".hero-arch", { perspective: 900 });
      const heroMove = (e) => {
        const nx = e.clientX / innerWidth - 0.5;
        const ny = e.clientY / innerHeight - 0.5;
        layers.forEach(({ xTo, d }) => xTo(nx * d));
        archRX(nx * 8);
        archRY(-ny * 6);
      };
      hero.addEventListener("pointermove", heroMove);

      const mags = $$(".magnetic").map((el) => {
        const xTo = gsap.quickTo(el, "x", { duration: 0.5, ease: "power3" });
        const yTo = gsap.quickTo(el, "y", { duration: 0.5, ease: "power3" });
        const mv = (e) => {
          const r = el.getBoundingClientRect();
          xTo((e.clientX - (r.left + r.width / 2)) * 0.3);
          yTo((e.clientY - (r.top + r.height / 2)) * 0.4);
        };
        const lv = () => gsap.to(el, { x: 0, y: 0, duration: 0.8, ease: "elastic.out(1, .4)" });
        el.addEventListener("pointermove", mv);
        el.addEventListener("pointerleave", lv);
        return { el, mv, lv };
      });

      return () => {
        root.classList.remove("has-cursor");
        removeEventListener("pointermove", move);
        hero.removeEventListener("pointermove", heroMove);
        document.removeEventListener("pointerover", over);
        mags.forEach(({ el, mv, lv }) => { el.removeEventListener("pointermove", mv); el.removeEventListener("pointerleave", lv); gsap.set(el, { x: 0, y: 0 }); });
      };
    });

    if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => { movePill(); ScrollTrigger.refresh(); });
    addEventListener("load", () => ScrollTrigger.refresh());
  }

  function countUp(el) {
    const target = parseFloat(el.dataset.count);
    const dec = Number(el.dataset.decimals || 0);
    const fmt = (v) => {
      const [int, frac] = v.toFixed(dec).split(".");
      return int.replace(/\B(?=(\d{3})+(?!\d))/g, ".") + (frac ? "," + frac : "");
    };
    if (!hasGsap || reduceMotion) { el.textContent = fmt(target); return; }
    const o = { v: 0 };
    gsap.to(o, { v: target, duration: 1.8, ease: "expo.out", onUpdate: () => (el.textContent = fmt(o.v)) });
  }

  /* =========================================================
     INICIO
     ========================================================= */
  $("#year").textContent = new Date().getFullYear();
  renderStatus();
  renderHours();
  renderTable();
  renderSlots();
  syncParty();
  syncSteps();
  movePill();
  onScroll();
  setInterval(renderStatus, 60000);
  try { initMotion(); } catch (err) { console.error(err); endLoading(); }
})();

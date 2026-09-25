(() => {
  "use strict";

  /* ---------- Config ---------- */
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

  const REVIEWS = [
    { name: "Laura M.", when: "Hace 2 semanas", text: "Servicio de diez y todo lo que pedimos estaba buenísimo. Las croquetas, de las mejores de Barcelona. Volveremos seguro." },
    { name: "Jordi P.", when: "Hace 1 mes", text: "Calidad-precio inmejorable para la zona. El pulpo a la brasa, espectacular. El equipo súper atento." },
    { name: "Sofía R.", when: "Hace 3 semanas", text: "Celebramos un cumpleaños y nos trataron genial. Ambiente muy agradable y cocina hasta tarde, perfecto." },
    { name: "Marc V.", when: "Hace 2 meses", text: "Pedimos a domicilio y llegó todo perfecto y calentito. Se nota el cariño en cada plato." },
    { name: "Elena G.", when: "Hace 1 semana", text: "Nuestro sitio de confianza en Sant Gervasi. El arroz negro es un must. Cinco estrellas merecidísimas." },
    { name: "David L.", when: "Hace 1 mes", text: "Fuimos por recomendación y superó expectativas. Raciones generosas, producto fresco y precio justo." },
  ];

  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => [...el.querySelectorAll(s)];
  const euro = (n) => n.toLocaleString("es-ES", { style: "currency", currency: "EUR" });
  const pad = (n) => String(n).padStart(2, "0");
  const fmtMin = (m) => (m >= 24 * 60 ? "0:00" : `${Math.floor(m / 60)}:${pad(m % 60)}`);

  /* ---------- Toast ---------- */
  let toastTimer;
  function toast(msg) {
    const t = $("#toast");
    t.textContent = msg;
    t.classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => t.classList.remove("show"), 2600);
  }

  /* ---------- Hora de Barcelona ---------- */
  function madridNow() {
    const parts = new Intl.DateTimeFormat("en-GB", {
      timeZone: TZ, weekday: "short", hour: "2-digit", minute: "2-digit", hour12: false,
      year: "numeric", month: "2-digit", day: "2-digit",
    }).formatToParts(new Date());
    const get = (t) => parts.find((p) => p.type === t).value;
    const wd = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].indexOf(get("weekday"));
    const h = Number(get("hour")) % 24;
    return { day: wd, minutes: h * 60 + Number(get("minute")), iso: `${get("year")}-${get("month")}-${get("day")}` };
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
    const order = [1, 2, 3, 4, 5, 6, 0];
    $("#hoursList").innerHTML = order.map((d) => {
      const ranges = HOURS[d] || [];
      const txt = ranges.length ? ranges.map(([o, c]) => `${fmtMin(o)} – ${fmtMin(c)}`).join(", ") : "Cerrado";
      return `<li class="${d === day ? "today" : ""}"><span>${DAY_NAMES[d]}</span><span>${txt}</span></li>`;
    }).join("");
  }

  /* ---------- Nav ---------- */
  const nav = $(".nav");
  const burger = $(".burger");
  burger.addEventListener("click", () => {
    const open = nav.classList.toggle("menu-open");
    burger.setAttribute("aria-expanded", open);
  });
  $$(".nav-links a").forEach((a) => a.addEventListener("click", () => {
    nav.classList.remove("menu-open");
    burger.setAttribute("aria-expanded", "false");
  }));

  const progress = $(".progress");
  const sun = $(".sun");
  const fab = $(".fab");
  function onScroll() {
    const y = window.scrollY;
    nav.classList.toggle("scrolled", y > 40);
    const max = document.documentElement.scrollHeight - innerHeight;
    progress.style.transform = `scaleX(${max > 0 ? y / max : 0})`;
    if (y < innerHeight) sun.style.setProperty("--sunY", `${y * 0.35}px`);
    const reserveTop = $("#reservar").getBoundingClientRect();
    fab.classList.toggle("hidden", y < 300 || (reserveTop.top < innerHeight && reserveTop.bottom > 0));
  }
  addEventListener("scroll", onScroll, { passive: true });

  // Sección activa en la navegación
  const sections = $$("section[id]");
  const spy = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (e.isIntersecting) {
        $$(".nav-links a").forEach((a) => a.classList.toggle("active", a.getAttribute("href") === `#${e.target.id}`));
      }
    });
  }, { rootMargin: "-45% 0px -50% 0px" });
  sections.forEach((s) => spy.observe(s));

  /* ---------- Reveal + contadores ---------- */
  const revealer = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (!e.isIntersecting) return;
      e.target.classList.add("visible");
      $$("[data-count]", e.target).forEach(countUp);
      revealer.unobserve(e.target);
    });
  }, { threshold: 0.15 });
  $$(".reveal").forEach((el) => revealer.observe(el));

  function countUp(el) {
    const target = parseFloat(el.dataset.count);
    const dec = Number(el.dataset.decimals || 0);
    const start = performance.now();
    const dur = 1600;
    const step = (now) => {
      const p = Math.min((now - start) / dur, 1);
      const v = target * (1 - Math.pow(1 - p, 3));
      el.textContent = v.toLocaleString("es-ES", { minimumFractionDigits: dec, maximumFractionDigits: dec });
      if (p < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }

  /* ---------- Carta interactiva ---------- */
  const cats = ["Todo", ...new Set(MENU.map((d) => d.cat))];
  let activeCat = "Todo";
  const activeFilters = new Set();
  const table = new Map(); // idx -> qty
  let guests = 2;

  const tabs = $(".tabs");
  tabs.innerHTML = cats.map((c) => `<button class="tab" role="tab" aria-selected="${c === activeCat}" data-cat="${c}">${c}</button>`).join("");
  tabs.addEventListener("click", (e) => {
    const b = e.target.closest(".tab");
    if (!b) return;
    activeCat = b.dataset.cat;
    $$(".tab", tabs).forEach((t) => t.setAttribute("aria-selected", t === b));
    renderMenu();
  });

  $$(".chip").forEach((chip) => chip.addEventListener("click", () => {
    const f = chip.dataset.filter;
    activeFilters.has(f) ? activeFilters.delete(f) : activeFilters.add(f);
    chip.setAttribute("aria-pressed", activeFilters.has(f));
    renderMenu();
  }));

  const TAG_LABEL = { veg: "🌱 Veggie", gf: "Sin gluten", star: "★ Favorito" };

  function renderMenu() {
    const grid = $("#menuGrid");
    const items = MENU.map((d, i) => ({ ...d, i }))
      .filter((d) => activeCat === "Todo" || d.cat === activeCat)
      .filter((d) => [...activeFilters].every((f) => d.tags.includes(f)));
    if (!items.length) {
      grid.innerHTML = `<p class="menu-empty">No hay platos con esos filtros. Prueba a quitar alguno.</p>`;
      return;
    }
    grid.innerHTML = items.map((d, n) => {
      const qty = table.get(d.i) || 0;
      return `
      <button class="dish ${qty ? "added" : ""}" data-i="${d.i}" style="animation-delay:${n * 40}ms" aria-label="Añadir ${d.name} a tu mesa">
        <span class="add-ind">${qty ? "×" + qty : ""}</span>
        <div class="dish-top"><h3>${d.name}</h3><span class="price">${euro(d.price)}</span></div>
        <p>${d.desc}</p>
        <div class="tags">${d.tags.map((t) => `<span class="tag ${t === "star" ? "fav" : ""}">${TAG_LABEL[t]}</span>`).join("")}</div>
        <span class="dish-add">+ Añadir a mi mesa</span>
      </button>`;
    }).join("");
  }

  $("#menuGrid").addEventListener("click", (e) => {
    const b = e.target.closest(".dish");
    if (!b) return;
    const i = Number(b.dataset.i);
    table.set(i, (table.get(i) || 0) + 1);
    const qty = table.get(i);
    b.classList.add("added");
    $(".add-ind", b).textContent = "×" + qty;
    renderTable();
    toast(`${MENU[i].name} añadido a tu mesa`);
  });

  function renderTable() {
    const list = $("#tableList");
    if (!table.size) {
      list.innerHTML = `<li class="empty">Aún no has elegido nada. Toca un plato ➜</li>`;
    } else {
      list.innerHTML = [...table].map(([i, q]) => `
        <li>
          <span class="name">${MENU[i].name}</span>
          <span class="qty">
            <button data-act="dec" data-i="${i}" aria-label="Quitar uno">−</button>${q}<button data-act="inc" data-i="${i}" aria-label="Añadir uno">+</button>
          </span>
          <span class="sub">${euro(MENU[i].price * q)}</span>
        </li>`).join("");
    }
    const total = [...table].reduce((s, [i, q]) => s + MENU[i].price * q, 0);
    $("#tableTotal").textContent = euro(total);
    $("#perPerson").textContent = euro(total / guests);
    $("#guestCount").textContent = guests;
    $("#tableGuests").textContent = guests;
  }

  $("#tableList").addEventListener("click", (e) => {
    const b = e.target.closest("button[data-act]");
    if (!b) return;
    const i = Number(b.dataset.i);
    const q = (table.get(i) || 0) + (b.dataset.act === "inc" ? 1 : -1);
    q > 0 ? table.set(i, q) : table.delete(i);
    renderTable();
    renderMenu();
  });
  $("#clearTable").addEventListener("click", () => { table.clear(); renderTable(); renderMenu(); });
  $("#guestMinus").addEventListener("click", () => { guests = Math.max(1, guests - 1); renderTable(); syncParty(); });
  $("#guestPlus").addEventListener("click", () => { guests = Math.min(20, guests + 1); renderTable(); syncParty(); });

  /* ---------- Reseñas ---------- */
  const COLORS = ["#e2694a", "#2f6f8f", "#c9a24a", "#5b8a72", "#8a5b8a", "#0f2a3d"];
  const track = $("#reviewTrack");
  track.innerHTML = REVIEWS.map((r, i) => `
    <article class="review">
      <div class="review-inner">
        <span class="star" aria-label="5 estrellas">★★★★★</span>
        <blockquote>“${r.text}”</blockquote>
        <div class="review-author">
          <span class="avatar" style="background:${COLORS[i % COLORS.length]}">${r.name[0]}</span>
          <div><strong>${r.name}</strong><small>${r.when} · Google</small></div>
        </div>
      </div>
    </article>`).join("");

  let slide = 0;
  const perView = () => (innerWidth <= 600 ? 1 : innerWidth <= 980 ? 2 : 3);
  const maxSlide = () => REVIEWS.length - perView();
  function renderDots() {
    const n = maxSlide() + 1;
    $("#reviewDots").innerHTML = Array.from({ length: n }, (_, i) =>
      `<button aria-label="Ir a la reseña ${i + 1}" class="${i === slide ? "active" : ""}" data-s="${i}"></button>`).join("");
  }
  function go(n) {
    const m = maxSlide();
    slide = n < 0 ? m : n > m ? 0 : n;
    track.style.transform = `translateX(-${slide * (100 / perView())}%)`;
    renderDots();
  }
  $(".car-btn.prev").addEventListener("click", () => { go(slide - 1); restart(); });
  $(".car-btn.next").addEventListener("click", () => { go(slide + 1); restart(); });
  $("#reviewDots").addEventListener("click", (e) => {
    const b = e.target.closest("button");
    if (b) { go(Number(b.dataset.s)); restart(); }
  });
  let auto;
  const restart = () => { clearInterval(auto); auto = setInterval(() => go(slide + 1), 5500); };
  let tx = null;
  track.addEventListener("touchstart", (e) => { tx = e.touches[0].clientX; }, { passive: true });
  track.addEventListener("touchend", (e) => {
    if (tx === null) return;
    const dx = e.changedTouches[0].clientX - tx;
    if (Math.abs(dx) > 40) { go(slide + (dx < 0 ? 1 : -1)); restart(); }
    tx = null;
  });
  addEventListener("resize", () => go(Math.min(slide, maxSlide())));

  /* ---------- Reserva ---------- */
  const dateInput = $("#bDate");
  const today = madridNow();
  dateInput.min = today.iso;
  dateInput.value = today.iso;
  let chosenSlot = null;

  function renderSlots() {
    const val = dateInput.value;
    const box = $("#slots");
    if (!val) { box.innerHTML = `<span class="none">Elige un día.</span>`; return; }
    const d = new Date(val + "T12:00:00").getDay();
    const ranges = HOURS[d] || [];
    const isToday = val === madridNow().iso;
    const now = madridNow().minutes;
    const slots = [];
    ranges.forEach(([o, c]) => {
      for (let m = o; m <= Math.min(c - 60, LAST_BOOKING); m += 30) slots.push(m);
    });
    if (!slots.length) { box.innerHTML = `<span class="none">Ese día estamos cerrados.</span>`; chosenSlot = null; return; }
    box.innerHTML = slots.map((m) => {
      const past = isToday && m <= now + 30;
      return `<button type="button" class="slot" role="radio" data-m="${m}" aria-checked="${m === chosenSlot}" ${past ? "disabled" : ""}>${fmtMin(m)}</button>`;
    }).join("");
    if (chosenSlot !== null && !$(`.slot[data-m="${chosenSlot}"]:not(:disabled)`, box)) chosenSlot = null;
    if (!$(".slot:not(:disabled)", box)) box.insertAdjacentHTML("beforeend", `<span class="none">Hoy ya no quedan horas: prueba otro día.</span>`);
  }
  dateInput.addEventListener("change", renderSlots);
  $("#slots").addEventListener("click", (e) => {
    const b = e.target.closest(".slot");
    if (!b || b.disabled) return;
    chosenSlot = Number(b.dataset.m);
    $$(".slot").forEach((s) => s.setAttribute("aria-checked", s === b));
  });

  const party = $("#party");
  party.innerHTML = [1, 2, 3, 4, 5, 6, 7, 8].map((n) =>
    `<button type="button" class="pp" role="radio" data-n="${n}" aria-checked="${n === guests}">${n === 8 ? "8+" : n}</button>`).join("");
  function syncParty() {
    $$(".pp").forEach((p) => p.setAttribute("aria-checked", Number(p.dataset.n) === Math.min(guests, 8)));
  }
  party.addEventListener("click", (e) => {
    const b = e.target.closest(".pp");
    if (!b) return;
    guests = Number(b.dataset.n);
    syncParty();
    renderTable();
  });

  $("#bookingForm").addEventListener("submit", (e) => {
    e.preventDefault();
    const name = $("#bName").value.trim();
    const phone = $("#bPhone").value.trim();
    const err = $("#formError");
    $("#bName").classList.toggle("invalid", !name);
    $("#bPhone").classList.toggle("invalid", phone.replace(/\D/g, "").length < 9);
    if (!dateInput.value) return (err.textContent = "Elige un día.");
    if (chosenSlot === null) return (err.textContent = "Elige una hora.");
    if (!name) return (err.textContent = "Dinos tu nombre.");
    if (phone.replace(/\D/g, "").length < 9) return (err.textContent = "Revisa el teléfono.");
    err.textContent = "";

    const dateTxt = new Date(dateInput.value + "T12:00:00").toLocaleDateString("es-ES", { weekday: "long", day: "numeric", month: "long" });
    const notes = $("#bNotes").value.trim();
    let msg = `¡Hola Marbar! Me gustaría reservar mesa:\n• Día: ${dateTxt}\n• Hora: ${fmtMin(chosenSlot)}\n• Personas: ${guests >= 8 ? "8 o más" : guests}\n• Nombre: ${name}\n• Teléfono: ${phone}`;
    if (notes) msg += `\n• Comentarios: ${notes}`;
    if (table.size) msg += `\n\nNos apetece: ${[...table].map(([i, q]) => `${q}× ${MENU[i].name}`).join(", ")}`;
    window.open(`https://wa.me/${PHONE}?text=${encodeURIComponent(msg)}`, "_blank", "noopener");
    toast("¡Solicitud lista! Envíala por WhatsApp para confirmar.");
  });

  /* ---------- Compartir ---------- */
  $("#shareBtn").addEventListener("click", async () => {
    const data = { title: "Marbar", text: "Marbar · 4,9★ en la Bonanova, Barcelona", url: location.href };
    try {
      if (navigator.share) return await navigator.share(data);
      await navigator.clipboard.writeText(location.href);
      toast("Enlace copiado al portapapeles");
    } catch (_) { /* cancelado */ }
  });

  /* ---------- Init ---------- */
  $("#year").textContent = new Date().getFullYear();
  renderStatus();
  renderHours();
  renderMenu();
  renderTable();
  renderSlots();
  go(0);
  restart();
  onScroll();
  setInterval(renderStatus, 60000);
})();

/* ===================== geometry: cones from each bulb to its pool ===================== */
const relTo = (el, host) => { const a = el.getBoundingClientRect(), b = host.getBoundingClientRect(); return { x: a.left - b.left, y: a.top - b.top, w: a.width, h: a.height }; };
const bulbOf = (lamp, host) => { const r = relTo(lamp, host); return [r.x + r.w / 2, r.y + r.h * 46.2 / 60]; };
const centreOf = (el, host) => { const r = relTo(el, host); return [r.x + r.w / 2, r.y + r.h / 2]; };
/* The base spans the pool as seen from the lamp: the visible ellipse's extent across the beam
   (support width along the beam normal), so an angled cone never overshoots its pool. */
function aimCone(cone, bulb, pc, pool, k) {
  const dx = pc[0] - bulb[0], dy = pc[1] - bulb[1], len = Math.max(1, Math.hypot(dx, dy)), ang = Math.atan2(-dx, dy);
  const a = pool.offsetWidth / 2 * (k || .72), b = pool.offsetHeight / 2 * (k || .72), nx = -dy / len, ny = dx / len;
  const width = Math.max(24, 2 * Math.sqrt(a * a * nx * nx + b * b * ny * ny));
  if (cone) Object.assign(cone.style, { left: (bulb[0] - width / 2).toFixed(1) + "px", top: bulb[1].toFixed(1) + "px", width: width.toFixed(1) + "px", height: len.toFixed(1) + "px", transform: `rotate(${ang.toFixed(4)}rad)` });
  return { bulb, dir: [dx / len, dy / len], len, poolWidth: width };
}
const GEO = { hero: null, noche: null };
function layout() {
  try {
    const hh = $(".hero-haze");
    GEO.hero = aimCone($(".hero-cone"), bulbOf($(".hero-lamp"), hh), centreOf($(".hero-pool"), hh), $(".hero-pool"));
    const nh = $(".noche-haze");
    GEO.noche = aimCone($(".noche-cone"), bulbOf($(".noche-lamp"), nh), centreOf($(".noche-pool"), nh), $(".noche-pool"));
    const ri = $(".rig-in");
    aimCone($(".rig-cone"), bulbOf($(".rig-lamp"), ri), centreOf($(".rig-pool"), ri), $(".rig-pool"));
  } catch (e) {}
  emitHaze();
}

/* ===================== haze (WebGL in gl.js; CSS cone is the fallback) ===================== */
const HZ = { host: "hero", light: 1, half: 20, density: 1 };
const N = { arrive: 1 };
function emitHaze() {
  const g = GEO[HZ.host]; if (!g) return;
  const host = HZ.host === "hero" ? $(".hero-haze") : $(".noche-haze");
  Object.assign(ML.state.haze, { host: HZ.host, el: host, canvas: $("#haze"), width: host.clientWidth, height: host.clientHeight,
    bulb: g.bulb, dir: g.dir, len: g.len, half: HZ.half * DEG, light: HZ.light, density: HZ.density, heat: ML.heat == null ? 1 : ML.heat, lampCol: ML.lampCol || "#FFF4E0" });
  ML.emit("haze", ML.state.haze);
}
function nocheLight() {
  const l = lerp(.4, .6 + .4 * (ML.heat == null ? 1 : ML.heat), N.arrive);
  const cone = $(".noche-cone"); if (cone) cone.style.opacity = l.toFixed(3);
  const pool = $(".noche-pool"); if (pool) pool.style.opacity = (.55 + .45 * l).toFixed(3);
  $(".noche-lamp").style.setProperty("--bulb", (.55 + .45 * l).toFixed(3));
  $(".noche-halo").style.setProperty("--bulb", (.55 + .45 * l).toFixed(3));
  if (HZ.host === "noche") { HZ.light = l; HZ.half = 20; HZ.density = 1; emitHaze(); }
}
function hazeHost() {
  const vh = innerHeight, hr = $("#inicio").getBoundingClientRect(), nr = $("#esta-noche").getBoundingClientRect();
  const heroIn = hr.bottom > 0 && hr.top < vh, near = nr.top < vh * 2 && nr.bottom > -vh;
  const want = (!heroIn && near) ? "noche" : "hero";
  if (want === HZ.host) return;
  HZ.host = want;
  const c = $("#haze"), host = want === "hero" ? $(".hero-haze") : $(".noche-haze");
  if (c && host && c.parentNode !== host) host.appendChild(c);
  ML.emit("haze:host", { host: want, el: host, canvas: c });
  if (want === "hero") renderHero(); else nocheLight();
}

/* ===================== hero: light state (intro + scroll-out) ===================== */
const H = { bulb: 1, light: 1, pool: 1, poolScale: 1, plate: 1, plateB: 1, out: 0 };
const HE = { lamp: $(".hero-lamp"), halo: $(".hero-halo"), cone: $(".hero-cone"), pool: $(".hero-pool"), poolWrap: $(".hero-pool-wrap"), box: $(".hero-plate-box"), plate: $("#hero-plate"), type: $(".hero-type") };
function renderHero() {
  const b = H.bulb.toFixed(3);
  HE.lamp.style.setProperty("--bulb", b); HE.halo.style.setProperty("--bulb", b);
  const light = H.light * (1 - .65 * H.out);
  HE.cone.style.opacity = light.toFixed(3);
  /* the masked pool only ever changes opacity; its scale lives on the unmasked wrap (origin at the pool's centre), so
     the compositor never draws the pool's texture before its mask */
  HE.pool.style.opacity = H.pool.toFixed(3);
  HE.poolWrap.style.transform = H.poolScale < .999 ? `scale(${H.poolScale.toFixed(3)})` : "";
  HE.poolWrap.style.opacity = (1 - .5 * H.out).toFixed(3);
  HE.box.style.opacity = H.plate.toFixed(3);
  const br = H.plateB * (1 - .4 * H.out), f = br < .999 ? `brightness(${br.toFixed(3)})` : "";
  HE.plate.style.filter = f; HE.type.style.filter = f;
  Object.assign(ML.state.hero, { bulb: H.bulb, light, plate: H.plate, plateBrightness: br, out: H.out });
  ML.emit("hero", ML.state.hero);
  if (HZ.host === "hero") { HZ.light = light; HZ.half = 20 - 7 * H.out; HZ.density = 1 + .4 * H.out; emitHaze(); }
}
function heroIntro() {
  /* GSAP that arrives after the CSS net (2.2 s) has lit the hero must not dim it again: the hero stays as it is */
  let netRan = false;
  try { netRan = root.classList.contains("pre") && getComputedStyle($(".hero-sub")).opacity === "1"; } catch (e) {}
  if (!MOTION || netRan) { root.classList.remove("pre"); renderHero(); ML.introDone = true; if (netRan) ML.emit("intro", {}); return; }
  const h1 = $(".h1-big"), name = $(".h1-name"), items = [".hero-sub", ".hero-status", ".hero-actions", ".hero-facts"].map(s => $(s));
  const lr = HE.lamp.getBoundingClientRect(), hr = h1.getBoundingClientRect();
  const mx = lr.left + lr.width / 2 - hr.left, my = lr.top + lr.height * 46.2 / 60 - hr.top;
  const far = Math.max(...[[0, 0], [hr.width, 0], [0, hr.height], [hr.width, hr.height]].map(([x, y]) => Math.hypot(x - mx, y - my))) + 240;
  const mask = `radial-gradient(circle at ${mx.toFixed(1)}px ${my.toFixed(1)}px, #000 calc(var(--r) - 240px), transparent var(--r))`;
  Object.assign(H, { bulb: 0, light: 0, pool: 0, poolScale: .85, plate: 0, plateB: .3 });
  gsap.set(hdr, { opacity: .35 });
  h1.style.setProperty("--r", "0px"); h1.style.webkitMaskImage = mask; h1.style.maskImage = mask; h1.style.willChange = "mask-image";
  gsap.set(name, { filter: `blur(${mqPhone.matches ? 4 : 8}px)`, scale: 1.015, transformOrigin: "0% 50%", willChange: "filter, transform" });
  gsap.set(items, { opacity: 0, y: 8 });
  renderHero();
  root.classList.remove("pre");      // same frame as the inline from-states: the CSS safety net can never fight GSAP
  root.classList.add("intro-net");   // a second CSS net (after the timeline's end) that needs no script if the thread stalls
  let done = false;
  const finish = () => {
    if (done) return; done = true;
    h1.style.webkitMaskImage = "none"; h1.style.maskImage = "none"; h1.style.removeProperty("--r"); h1.style.willChange = "";
    gsap.set(name, { clearProps: "filter,transform,willChange" });
    gsap.set(items, { clearProps: "opacity,transform" });
    gsap.set(hdr, { clearProps: "opacity" });
    Object.assign(H, { bulb: 1, light: 1, pool: 1, poolScale: 1, plate: 1, plateB: 1 }); renderHero();
    root.classList.remove("intro-net");
    off();
    ML.introDone = true; ML.emit("intro", {});   // the WebGL engines start their heavy work only now
  };
  const tl = gsap.timeline({ defaults: { ease: "power2.inOut" }, onUpdate: renderHero, onComplete: finish });
  tl.to(H, { bulb: .3, duration: .06, ease: "none" }, .15)
    .to(H, { bulb: 1, duration: .25, ease: "power2.out" }, .29)
    .to(H, { light: 1, pool: 1, poolScale: 1, plate: 1, plateB: 1, duration: .75 }, .35)
    .to(h1, { "--r": far.toFixed(0) + "px", duration: .9 }, .5)
    .to(name, { filter: "blur(0px)", scale: 1, duration: .9, ease: "expo.out" }, .5)
    .to(items, { opacity: 1, y: 0, duration: .5, ease: "power2.out", stagger: .06 }, 1.1)
    .to(hdr, { opacity: 1, duration: .3 }, 1.4);
  const skip = () => { if (!done) { tl.progress(1); finish(); } };
  const evs = ["wheel", "touchstart", "keydown", "pointerdown"];
  const off = () => evs.forEach(ev => removeEventListener(ev, skip, true));
  evs.forEach(ev => addEventListener(ev, skip, { capture: true, passive: true }));
  setTimeout(skip, 2200);
  ML.intro = tl;
}

/* ===================== reveals ("arming", only below the fold) ===================== */
let armedOnce = false;
function reveal(el) { el.classList.remove("is-armed"); setTimeout(() => el.style.setProperty("--d", "0ms"), 1500); }
function arm() {
  if (armedOnce) return; armedOnce = true;
  if (RM) return;
  const vh = innerHeight;
  const list = $$(".rv, .rv-lum, .rv-focus").filter(el => el.getBoundingClientRect().top > vh);
  list.forEach(el => { if (LOW && el.classList.contains("rv-focus")) { el.classList.remove("rv-focus"); el.classList.add("rv"); } el.classList.add("is-armed"); });
  /* An item is revealed when it enters the band, or when it is found already above it: a stalled frame can carry an
     item past the viewport between two observer callbacks. When scrolling stops, everything in view is revealed too,
     so nothing rests dimmed in the bottom 12% band. */
  if ("IntersectionObserver" in window) {
    const io = IO(es => es.forEach(e => {
      const top = e.rootBounds ? e.rootBounds.top : 0;
      if (e.isIntersecting || e.boundingClientRect.bottom <= top) { reveal(e.target); io.unobserve(e.target); }
    }), { rootMargin: "0px 0px -12% 0px" });
    list.forEach(el => io.observe(el));
  } else list.forEach(reveal);
  const sweep = () => { const h = innerHeight; list.forEach(el => { if (el.classList.contains("is-armed") && el.getBoundingClientRect().top < h) reveal(el); }); };
  let idle = 0;
  addEventListener("scroll", () => { clearTimeout(idle); idle = setTimeout(sweep, 250); }, { passive: true });
  if ("onscrollend" in window) addEventListener("scrollend", sweep);
  setTimeout(sweep, 3000);
  armScenes(vh);
}
/* safety for once-triggers: complete fn 3s after el is in view if it has not run */
function safety(el, isDone, complete) {
  if (!("IntersectionObserver" in window)) { setTimeout(() => { if (!isDone()) complete(); }, 3000); return; }
  const io = IO(es => { if (es.some(e => e.isIntersecting)) { io.disconnect(); setTimeout(() => { if (!isDone()) complete(); }, 3000); } });
  io.observe(el);
}
const lampOn = el => { if (!el) return; el.classList.remove("enciende"); void el.getBoundingClientRect(); el.classList.add("enciende"); };

function armScenes(vh) {
  if (!MOTION) return;
  /* La sala: three lamps light once, one after another */
  const sala = $("#sala");
  if (sala.getBoundingClientRect().top > vh) {
    const lts = $$(".sala-lt"), phr = $$(".sala .phr"), notes = $$(".sala .note");
    lts.forEach(lt => { gsap.set($(".sala-lamp", lt), { "--bulb": 0 }); gsap.set([$(".sala-cone", lt), $(".sala-pool", lt)], { opacity: 0 }); });
    gsap.set(phr, { color: "#A59E94" });
    notes.forEach(n => n.classList.add("rv-lum", "is-armed"));
    const tl = gsap.timeline({ paused: true, onComplete: () => { gsap.set(phr, { clearProps: "color" }); notes.forEach(reveal); } });
    lts.forEach((lt, i) => {
      const t = i * .35, lamp = $(".sala-lamp", lt);
      tl.to(lamp, { keyframes: [{ "--bulb": .3, duration: .063 }, { "--bulb": .3, duration: .081 }, { "--bulb": 1, duration: .306 }], ease: "none" }, t)
        .to($(".sala-cone", lt), { opacity: 1, duration: .6, ease: "sine.inOut" }, t + .08)
        .to($(".sala-pool", lt), { opacity: 1, duration: .8, ease: "sine.inOut" }, t + .12)
        .to(phr[i], { color: "#EBE5D9", duration: .8, ease: "sine.inOut" }, t + .12)
        .call(() => { if (notes[i]) reveal(notes[i]); }, null, t + .2);
    });
    ScrollTrigger.create({ trigger: sala, start: "top 70%", once: true, onEnter: () => tl.play() });
    safety(sala, () => tl.progress() > 0, () => tl.progress(1));
  }
  /* La carta: the lamp switches on and the pool settles on the plane */
  const carta = $("#carta");
  if (carta.getBoundingClientRect().top > vh) {
    const lamp = $(".carta-lamp"), pool = $(".carta-pool"), cone = $(".carta-cone");
    let ran = false;
    gsap.set(lamp, { "--bulb": 0 }); gsap.set(pool, { opacity: .35 }); gsap.set(cone, { opacity: 0 });
    const run = () => { if (ran) return; ran = true; lampOn(lamp); gsap.to(cone, { opacity: .85, duration: .6, delay: .15, ease: "sine.inOut" }); gsap.to(pool, { opacity: 1, duration: 1.2, delay: .1, ease: "sine.inOut" }); };
    ScrollTrigger.create({ trigger: carta, start: "top 75%", once: true, onEnter: run });
    safety(carta, () => ran, run);
  }
  /* Grupos: the form's pool fades up once */
  const plane = $(".form-plane");
  if (plane && plane.getBoundingClientRect().top > vh) {
    let ran = false; gsap.set(".form-pool, .grupos-pool", { opacity: 0 });
    const run = () => { if (ran) return; ran = true; gsap.to(".form-pool, .grupos-pool", { opacity: 1, duration: .8, ease: "sine.inOut" }); };
    ScrollTrigger.create({ trigger: ".grupos", start: "top 75%", once: true, onEnter: run });
    safety(plane, () => ran, run);
  }
  /* Esta noche: the headline is exposed from the lamp, once */
  const nh = $("#noche-h");
  if (nh.getBoundingClientRect().top > vh) {
    let ran = false;
    const setMask = () => {
      const lr = $(".noche-lamp").getBoundingClientRect(), hr = nh.getBoundingClientRect();
      const mx = lr.left + lr.width / 2 - hr.left, my = lr.top + lr.height * 46.2 / 60 - hr.top;
      const far = Math.max(...[[0, 0], [hr.width, 0], [0, hr.height], [hr.width, hr.height]].map(([x, y]) => Math.hypot(x - mx, y - my))) + 240;
      const m = `radial-gradient(circle at ${mx.toFixed(1)}px ${my.toFixed(1)}px, #000 calc(var(--r) - 240px), transparent var(--r))`;
      nh.style.webkitMaskImage = m; nh.style.maskImage = m; return far;
    };
    nh.style.setProperty("--r", "0px"); setMask();
    const clean = () => { nh.style.webkitMaskImage = "none"; nh.style.maskImage = "none"; nh.style.removeProperty("--r"); };
    const run = () => { if (ran) return; ran = true; const far = setMask(); gsap.to(nh, { "--r": far.toFixed(0) + "px", duration: 1, ease: "power2.inOut", onComplete: clean }); };
    ScrollTrigger.create({ trigger: "#esta-noche", start: "top 60%", once: true, onEnter: run });
    safety(nh, () => ran, run);
  }
  /* Visítanos: the service arcs switch on and the marker glides to now */
  const esf = $(".esfera");
  if (esf.getBoundingClientRect().top > vh) {
    let ran = false;
    $$(".dial-arc").forEach(a => { a.style.opacity = "0"; });
    dialGlide = true; setMarker(720);
    const run = () => {
      if (ran) return; ran = true;
      $$(".dial-arc").forEach((a, i) => { a.style.opacity = ""; a.style.animation = `encender .45s linear ${(i * .15).toFixed(2)}s both`; });
      const target = now().min;
      if (target < 720) { dialGlide = false; setMarker(target); return; }
      const pr = { m: 720 };
      gsap.to(pr, { m: target, duration: 1.2, ease: "power3.out", onUpdate: () => setMarker(pr.m), onComplete: () => { dialGlide = false; tick(); } });
    };
    ScrollTrigger.create({ trigger: esf, start: "top 70%", once: true, onEnter: run });
    safety(esf, () => ran, run);
  }
}

/* ===================== El pase: four dishes under the pass lamp ===================== */
const DISHES = ["Croquetas Gallitos", "Gallitos Fried Chicken", "Patatas de boniato", "Pollo al carbón"];
const PE = { stage: $(".pase-stage"), plates: $$(".pase-stage .plate-type"), steps: $$(".pase-step"), heads: $$(".pase-step .dish"), blocks: $$(".pase-step .step-in"), cap: $(".stage-cap"), lamp: $(".pase-lamp"), cone: $(".pase-cone"), pool: $(".pase-pool") };
/* The reading window under a stacked stage: from its lower edge to the bottom of the screen (or the booking bar). */
function readWin(stage) {
  const lo = stage.getBoundingClientRect().bottom, hi = bar && bar.classList.contains("is-shown") ? bar.getBoundingClientRect().top : innerHeight;
  return [lo, Math.max(lo + 1, hi)];
}
/* How much of a caption can be read in the window (1 = all of it, or as much as the window holds), and whether it
   is still arriving from the bottom (its centre below the window's). */
function capLight(el, lo, hi) {
  const r = el.getBoundingClientRect(); if (!(r.height > 0)) return 0;
  const v = clamp((Math.min(r.bottom, hi) - Math.max(r.top, lo)) / Math.max(1, Math.min(r.height, hi - lo)));
  /* arriving: lit as soon as its heading can be read; leaving: lit while most of it is still in the window */
  return (r.top + r.bottom) / 2 > (lo + hi) / 2 ? sstep(.08, .45, v) : sstep(.4, .85, v);
}
/* Scene progress P (0..1 over n steps) from the captions' geometry, so steps may differ in height.
   Side by side (desktop): the step box that crosses the centre line.
   Stacked, with caption blocks (El pase on phones): each caption owns the stretch between the midpoints of the empty
   gaps above and below it (the gaps are about 70% of the window, see the CSS), measured on a line at 58% of the
   window. The dish therefore changes while the window is mostly empty: the old caption is less than half in view and
   the new heading is not in yet. Its light follows how much of its caption can be read (renderPase).
   Stacked, headings only (allioli): each caption owns the window from the moment its heading enters at the bottom of
   the screen (p 0) until it reaches the stage's lower edge (p 1). */
function stepsP(steps, heads, stage, blocks) {
  const vh = innerHeight, n = steps.length;
  if (!mqStack.matches) {
    const y = vh * .5;
    if (y < steps[0].getBoundingClientRect().top) return 0;
    for (let k = 0; k < n; k++) { const r = steps[k].getBoundingClientRect(); if (y < r.bottom) return (k + clamp((y - r.top) / Math.max(1, r.height))) / n; }
    return 1;
  }
  if (blocks) {
    const [lo, hi] = readWin(stage), y = lo + .58 * (hi - lo), r = blocks.map(b => b.getBoundingClientRect());
    const gap = k => n > 1 ? Math.max(0, r[k + 1].top - r[k].bottom) : 0;
    const B = [r[0].top - gap(0) / 2];
    for (let k = 0; k < n - 1; k++) B.push((r[k].bottom + r[k + 1].top) / 2);
    B.push(r[n - 1].bottom + gap(n - 2) / 2);
    if (y < B[0]) return 0;
    for (let k = 0; k < n; k++) if (y < B[k + 1]) return (k + clamp((y - B[k]) / Math.max(1, B[k + 1] - B[k]))) / n;
    return 1;
  }
  const lo = stage.getBoundingClientRect().bottom + 8, span = Math.max(1, vh - lo);
  let k = -1, t = 0;
  for (let j = 0; j < n; j++) { const y = heads[j].getBoundingClientRect().top; if (y <= vh) { k = j; t = y; } }
  return k < 0 ? 0 : (k + clamp((vh - t) / span)) / n;
}
const PS = { P: 0, i: -1, hold: false, holdTimer: 0, rel: 0, raf: 0 };
function paseScene(i) {
  PS.i = i;
  PE.plates.forEach(p => p.classList.toggle("is-on", +p.dataset.dish === i));
  PE.cap.textContent = DISHES[i] + "\u00a0· grabado";
  ML.state.platos.i = i;
  const typo = !!(PE.plates[i] && PE.plates[i].classList.contains("is-typo"));
  PE.stage.classList.toggle("is-typo-scene", typo);
  ML.emit("platos:scene", { i, typo });
  if (ML.gl.platos && MOTION && !typo) {
    PS.hold = true; clearTimeout(PS.holdTimer);
    PS.holdTimer = setTimeout(paseRelease, 600);
  }
}
function paseRelease() { if (!PS.hold) return; PS.hold = false; PS.rel = performance.now(); paseLoop(); }
ML.on("baked", d => { if (d && d.stage === "platos" && d.i === PS.i) paseRelease(); });
ML.on("typo", d => { if (d && d.i === PS.i) { PE.stage.classList.toggle("is-typo-scene", d.on); if (d.on) paseRelease(); } });
function paseLoop() { if (PS.raf) return; const step = () => { PS.raf = 0; renderPase(PS.P); if (PS.rel || PS.hold) PS.raf = requestAnimationFrame(step); }; PS.raf = requestAnimationFrame(step); }
function applyPase(i, p, L, az, el, dolly) {
  const st = PE.stage.style;
  PE.pool.style.setProperty("--pool-o", (.25 + .75 * L).toFixed(3));
  PE.pool.style.setProperty("--px", (50 + 18 * Math.sin(az)).toFixed(2) + "%");
  PE.lamp.style.setProperty("--bulb", (.2 + .8 * L).toFixed(3));
  PE.cone.style.setProperty("--cone-o", L.toFixed(3));
  st.setProperty("--dolly", dolly.toFixed(4));
  const cur = PE.plates[i];
  if (cur) { cur.style.setProperty("--pl", L.toFixed(3)); cur.style.setProperty("--mx", (50 + 18 * Math.sin(az)).toFixed(2) + "%"); cur.style.setProperty("--lw", (1 + 1.1 * L).toFixed(2) + "px"); }
  PE.steps.forEach((s, k) => s.classList.toggle("is-lit", k === i && L > .3));
  Object.assign(ML.state.platos, { i, p, L, az, el, dolly, key: { az, el, L } });
  ML.emit("platos", ML.state.platos);
}
function renderPase(P) {
  PS.P = P;
  const i = Math.min(3, Math.floor(P * 4)), p = clamp(P * 4 - i);
  if (i !== PS.i) paseScene(i);
  /* each dish lights up and goes dark again; the last one stays lit, so the stage scrolls away lit, not with a ghost.
     Stacked (phones): the light follows how much of the dish's caption is in the reading window (capLight), so a
     readable caption is never under a dark stage and the stage is dark only while the window is nearly empty. */
  let L;
  if (i === 3 && p > .5) L = 1;
  else if (mqStack.matches) { const [lo, hi] = readWin(PE.stage); L = capLight(PE.blocks[i], lo + 12, hi); }
  else L = sstep(0, .18, p) * (1 - sstep(.82, 1, p));
  if (PS.hold) L = 0;
  else if (PS.rel) { const k = clamp((performance.now() - PS.rel) / 350); L = Math.min(L, k); if (k >= 1) PS.rel = 0; }
  const pollo = i === 3;
  const az = (pollo ? -55 + 80 * p : -40 + 80 * p) * DEG, el = (pollo ? 28 : 30 + 12 * p) * DEG;
  applyPase(i, p, L, az, el, 1.04 - .04 * p);
}

/* ===================== La salsa que liga (allioli) ===================== */
const AT = [
  [0, { grain: 1, film: 0, edge: -.3, spiral: 0, twist: 0, thick: 0, bind: 0, L: .55, az: -35, el: 40 }],
  [.25, { grain: 1, film: 0, edge: -.3, spiral: 0, twist: 0, thick: 0, bind: 0, L: .70, az: -30, el: 40 }],
  [.5, { grain: .5, film: 1, edge: 1.3, spiral: 0, twist: 0, thick: .2, bind: 0, L: .90, az: 10, el: 45 }],
  [.75, { grain: .1, film: 1, edge: 1.3, spiral: 1, twist: 3 * Math.PI, thick: .8, bind: 0, L: 1, az: 10, el: 50 }],
  [1, { grain: 0, film: 1, edge: 1.3, spiral: 1, twist: 4 * Math.PI, thick: 1, bind: 1, L: 1, az: 10, el: 55 }]
];
function alliParams(P) {
  /* the last segment is complete at P .88 (its caption centred), not at the very end of the list */
  const x = clamp(P) * 4, k = Math.min(3, Math.floor(x)), t = sstep(0, 1, k === 3 ? clamp((x - 3) / .52) : x - k), a = AT[k][1], b = AT[k + 1][1], o = {};
  for (const key in a) o[key] = lerp(a[key], b[key], t);
  return o;
}
const AE = { stage: $(".alli-stage"), sauce: $(".sauce"), type: $(".alli-type"), word: $(".alli-word"), steps: $$(".alli-step"), heads: $$(".alli-h3"), names: $$(".alli-names li") };
let alliWordMasked = false, alliQ = -1;
function renderAlli(P, stepOverride) {
  /* The CSS sauce (no WebGL) repaints full-stage masked layers: update it in 1/60 steps of P, not on every frame. */
  if (!ML.gl.allioli && stepOverride == null) { const q = Math.round(P * 60) / 60; if (q === alliQ) return; alliQ = P = q; } else alliQ = -1;
  const o = alliParams(P), cur = stepOverride != null ? stepOverride : Math.min(3, Math.floor(P * 4));
  const az = o.az * DEG, hx = 52 + 18 * Math.sin(az), hy = 55 - 18 * .6 * Math.cos(az);
  const s = AE.sauce.style;
  s.setProperty("--grain", o.grain.toFixed(3)); s.setProperty("--film", o.film.toFixed(3)); s.setProperty("--thick", o.thick.toFixed(3));
  s.setProperty("--bind", o.bind.toFixed(3)); s.setProperty("--spiral", o.spiral.toFixed(3)); s.setProperty("--L", o.L.toFixed(3));
  s.setProperty("--edge", (o.edge * 100).toFixed(1) + "%"); s.setProperty("--tw", (o.twist / DEG).toFixed(1) + "deg");
  s.setProperty("--hx", hx.toFixed(2) + "%"); s.setProperty("--hy", hy.toFixed(2) + "%");
  const st = AE.stage.style; st.setProperty("--hx", hx.toFixed(2) + "%"); st.setProperty("--hy", hy.toFixed(2) + "%");
  AE.type.style.setProperty("--L", o.L.toFixed(3)); AE.type.style.setProperty("--bind", o.bind.toFixed(3));
  AE.type.style.setProperty("--lw", (.9 + 1.6 * o.thick).toFixed(2) + "px"); AE.type.style.setProperty("--mx", hx.toFixed(1) + "%");
  /* the word sits halfway between the highlight and the mouth's centre, so it never reaches the rim */
  AE.word.style.left = ((52 + hx) / 2).toFixed(2) + "%"; AE.word.style.top = ((55 + hy) / 2).toFixed(2) + "%";
  if (MOTION) {
    /* exposed while the last caption is centred (P .76 -> .88), with a crisp edge: partial letters never smear */
    if (P <= .76) { AE.word.classList.add("is-hidden"); }
    else {
      AE.word.classList.remove("is-hidden");
      if (P >= .88) { if (alliWordMasked) { AE.word.style.webkitMaskImage = "none"; AE.word.style.maskImage = "none"; alliWordMasked = false; } }
      else {
        const w = AE.word.offsetWidth, h = AE.word.offsetHeight, full = Math.hypot(w, h) / 2 + 10, r = (P - .76) / .12 * full;
        const m = `radial-gradient(circle at 50% 50%, #000 ${Math.max(0, r - 10).toFixed(1)}px, transparent ${r.toFixed(1)}px)`;
        AE.word.style.webkitMaskImage = m; AE.word.style.maskImage = m; alliWordMasked = true;
      }
    }
  }
  AE.steps.forEach((x, k) => x.classList.toggle("is-current", k === cur));
  AE.names.forEach((x, k) => x.classList.toggle("is-current", k === cur));
  const hl = [hx / 100, hy / 100];
  Object.assign(ML.state.allioli, { P, step: cur, uGrain: o.grain, uFilm: o.film, uEdge: o.edge, uSpiral: o.spiral, uTwist: o.twist, uThick: o.thick, uBind: o.bind, uL: o.L, az, el: o.el * DEG, highlight: hl });
  ML.emit("allioli", ML.state.allioli);
}

/* ===================== scroll-driven scenes (GSAP) and their IntersectionObserver fallbacks ===================== */
function scenes() {
  if (MOTION) {
    gsap.registerPlugin(ScrollTrigger);
    ScrollTrigger.config({ ignoreMobileResize: true });

    /* hero scroll-out dim */
    gsap.to(H, { out: 1, ease: "none", onUpdate: renderHero, scrollTrigger: { trigger: "#inicio", start: "top top", end: "bottom top", scrub: .8 } });

    /* El pase */
    const ps = { P: 0 };
    const qP = gsap.quickTo(ps, "P", { duration: .8, ease: "power3", onUpdate: () => renderPase(ps.P) });
    const upP = () => qP(stepsP(PE.steps, PE.heads, PE.stage, PE.blocks));
    ScrollTrigger.create({ trigger: ".pase-list", start: "top bottom", end: "bottom top", onUpdate: upP, onRefresh: upP, onToggle: upP });
    renderPase(0);

    /* Allioli */
    const as = { P: 0 };
    const qA = gsap.quickTo(as, "P", { duration: .8, ease: "power3", onUpdate: () => renderAlli(as.P) });
    const upA = () => qA(stepsP(AE.steps, AE.heads, AE.stage));
    ScrollTrigger.create({ trigger: ".alli-list", start: "top bottom", end: "bottom top", onUpdate: upA, onRefresh: upA, onToggle: upA });
    renderAlli(0);

    /* gobo parallax (desktop) */
    gsap.matchMedia().add("(min-width: 961px)", () => {
      gsap.to(".gobo-near", { y: -28, ease: "none", scrollTrigger: { trigger: "#sala", start: "top bottom", end: "bottom top", scrub: .8 } });
      gsap.to(".gobo-far", { y: -12, ease: "none", scrollTrigger: { trigger: "#sala", start: "top bottom", end: "bottom top", scrub: .8 } });
    });

    /* Sobremesa: the lit quote follows the centre */
    $("#sobremesa").classList.add("live-q");
    $$(".q").forEach(q => ScrollTrigger.create({ trigger: q, start: "top 58%", end: "bottom 42%",
      onEnter: () => { q.classList.add("is-lit"); q.classList.remove("is-past"); },
      onLeave: () => { q.classList.remove("is-lit"); q.classList.add("is-past"); },
      onEnterBack: () => { q.classList.add("is-lit"); q.classList.remove("is-past"); },
      onLeaveBack: () => { q.classList.remove("is-lit", "is-past"); } }));

    /* Esta noche: vignette and the light arriving over the booking block */
    const vig = $("#vignette"), vmax = () => mqMobile.matches ? .6 : .7;
    gsap.timeline({ scrollTrigger: { trigger: "#esta-noche", start: "top 85%", end: "bottom 15%", scrub: .8, invalidateOnRefresh: true } })
      .fromTo(vig, { opacity: 0 }, { opacity: vmax, duration: .35, ease: "none" })
      .to(vig, { opacity: vmax, duration: .4, ease: "none" })
      .to(vig, { opacity: 0, duration: .25, ease: "none" });
    N.arrive = 0; nocheLight();
    gsap.to(N, { arrive: 1, ease: "none", onUpdate: nocheLight, scrollTrigger: { trigger: "#esta-noche", start: "top bottom", end: "top 25%", scrub: .8 } });

    /* footer: the night ends, the lamp goes out */
    const pl = $(".pie-lamp"), pb = { b: 1 };
    gsap.to(pb, { b: .15, ease: "none", onUpdate: () => { pl.style.setProperty("--bulb", pb.b.toFixed(3)); pl.classList.toggle("is-off", pb.b < .5); },
      scrollTrigger: { trigger: "#pie", start: "top bottom", end: "bottom bottom", scrub: .8 } });
  } else {
    renderHero();
    /* El pase: the same geometry as the scrubbed scene (stepsP), fully lit, one dish at a time; the stage changes only
       when the dish does */
    paseScene(0); applyPase(0, .5, 1, 0, 38 * DEG, 1);
    let pq = false;
    const upS = () => { pq = false; const i = Math.min(3, Math.floor(stepsP(PE.steps, PE.heads, PE.stage, PE.blocks) * 4)); if (i !== PS.i) { paseScene(i); applyPase(i, .5, 1, 0, 38 * DEG, 1); } };
    addEventListener("scroll", () => { if (!pq) { pq = true; requestAnimationFrame(upS); } }, { passive: true });
    onResize(upS); ML.on("fonts", upS); upS();
    /* Allioli: the final frame, all steps readable */
    renderAlli(1, 3);
    AE.steps.forEach(x => x.classList.remove("is-current"));
    /* Sobremesa without GSAP (motion allowed): IntersectionObserver */
    if (!RM && "IntersectionObserver" in window) {
      $("#sobremesa").classList.add("live-q");
      const io = IO(es => es.forEach(e => {
        e.target.classList.toggle("is-lit", e.isIntersecting);
        if (!e.isIntersecting) e.target.classList.toggle("is-past", e.boundingClientRect.top < 0);
        else e.target.classList.remove("is-past");
      }), { rootMargin: "-42% 0px -42% 0px" });
      $$(".q").forEach(q => io.observe(q));
    }
    N.arrive = 1; nocheLight();
  }
}

/* ===================== Sobremesa: overlap the conversation without letting text touch ===================== */
function declash() {
  const qs = $$(".q");
  qs.forEach(q => q.style.removeProperty("--qm"));
  if (!mqDesk.matches) return;
  const lines = q => { const r = document.createRange(); r.selectNodeContents(q); return Array.from(r.getClientRects()).filter(x => x.width > 2 && x.height > 2); };
  const want = Math.round(innerWidth * .04);
  for (let k = 1; k < qs.length; k++) {
    const prev = lines(qs[k - 1]);
    qs[k].style.setProperty("--qm", "0px");
    const next = lines(qs[k]);
    let m = 48;
    for (let t = -want; t <= 48; t += 2) {
      const ok = next.every(n => prev.every(p => n.right < p.left - 24 || n.left > p.right + 24 || n.top + t >= p.bottom + 24 || n.bottom + t <= p.top - 24));
      if (ok) { m = t; break; }
    }
    qs[k].style.setProperty("--qm", m + "px");
  }
}

/* ===================== visibility of the stages for the WebGL engines (pause off-screen) ===================== */
function watchStages() {
  if (!("IntersectionObserver" in window)) return;
  const map = new Map([[$("#inicio"), "hero"], [PE.stage, "platos"], [AE.stage, "allioli"], [$("#esta-noche"), "noche"]]);
  const io = IO(es => es.forEach(e => { const s = map.get(e.target); ML.state[s + "Visible"] = e.isIntersecting; ML.emit("visible", { stage: s, on: e.isIntersecting }); }), { rootMargin: "25% 0px 25% 0px" });
  map.forEach((_, el) => io.observe(el));
}

/* ===================== init ===================== */
Object.assign(ML.el, {
  hero: $("#inicio"), heroPlate: $("#hero-plate"), heroPlateBox: $(".hero-plate-box"),
  haze: $("#haze"), hazeHosts: { hero: $(".hero-haze"), noche: $(".noche-haze") },
  platosStage: PE.stage, platosHost: $('.stage-canvas[data-host="platos"]'), engrave: $("#engrave"),
  alliStage: AE.stage, alliHost: $('.stage-canvas[data-host="allioli"]'), alliWord: AE.word
});
/* With WebGL2 about, the hero's typographic plate waits (hidden) for the engraving instead of popping out under it;
   it shows if the engine fails or takes too long (the engraving then fades in over it later). */
if (window.WebGL2RenderingContext) { const h = $("#inicio"); h.classList.add("gl-wait"); setTimeout(() => h.classList.remove("gl-wait"), MOTION ? 3200 : 2000); }
makeTexture();
buildGobos();
buildSpiral();
syncDemoBtn();
tick(); setInterval(tick, 1000);
layout();
heroIntro();
scenes();
watchStages();
(() => { let q = false; addEventListener("scroll", () => { if (q) return; q = true; requestAnimationFrame(() => { q = false; hazeHost(); }); }, { passive: true }); hazeHost(); })();
const fontsReady = (document.fonts && document.fonts.ready) ? document.fonts.ready : Promise.resolve();
fontsReady.then(() => { layout(); declash(); arm(); ML.refresh(); ML.emit("fonts", {}); });
setTimeout(arm, 600);
onResize(() => { layout(); declash(); ML.emit("resize", {}); });
ML.ready = true;
ML.emit("ready", {});

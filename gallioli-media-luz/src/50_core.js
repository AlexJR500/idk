/* ===================== core ===================== */
const root = document.documentElement;
const $ = (s, c = document) => c.querySelector(s);
const $$ = (s, c = document) => Array.from(c.querySelectorAll(s));
const RM = matchMedia("(prefers-reduced-motion: reduce)").matches;
const HAS_GSAP = !!(window.gsap && window.ScrollTrigger);
const MOTION = HAS_GSAP && !RM;               // GSAP scrubs and timelines only when motion is allowed
const mqPhone = matchMedia("(max-width: 600px)");
const mqStack = matchMedia("(max-width: 760px)");
const mqMobile = matchMedia("(max-width: 960px)");
const mqDesk = matchMedia("(min-width: 961px)");
const mqHover = matchMedia("(hover: hover) and (pointer: fine)");
const LOW = (navigator.hardwareConcurrency || 8) <= 4 || (navigator.deviceMemory || 8) <= 4;
const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const lerp = (a, b, t) => a + (b - a) * t;
const sstep = (a, b, x) => { const t = clamp((x - a) / (b - a)); return t * t * (3 - 2 * t); };
const DEG = Math.PI / 180;
const track = (name, params) => { try { if (typeof window.gallioliTrack === "function") window.gallioliTrack(name, params); } catch (e) {} };
const onResize = (fn, ms = 150) => { let t = 0; addEventListener("resize", () => { clearTimeout(t); t = setTimeout(fn, ms); }); };
/* IntersectionObserver rooted on this document: with the implicit root, a page shown inside a
   cross-origin frame (as this preview is) gets its rootMargin ignored, so centre bands would not work. */
const IO = (cb, o) => { try { return new IntersectionObserver(cb, Object.assign({ root: document }, o)); } catch (e) { return new IntersectionObserver(cb, o); } };

if (RM) root.classList.add("reduced");
if (MOTION) root.classList.add("motion");
if (LOW) root.classList.add("low");

/* ===================== registry for the WebGL engines (src/60_gl.js, see GL_INTERFACE.md) =====================
   The main script owns layout, scroll and light values; gl.js only draws. */
const ML = window.mediaLuz = {
  version: 1,
  reduced: RM, motion: MOTION, phone: () => mqPhone.matches, stacked: () => mqStack.matches,
  el: {},
  state: { hero: {}, haze: {}, platos: {}, allioli: {} },
  gl: { hero: false, platos: false, allioli: false, haze: false },
  _l: {},
  on(type, fn) { (this._l[type] || (this._l[type] = [])).push(fn); return () => this.off(type, fn); },
  off(type, fn) { const a = this._l[type]; if (a) { const i = a.indexOf(fn); if (i >= 0) a.splice(i, 1); } },
  emit(type, detail) { const a = this._l[type]; if (!a) return; a.slice().forEach(fn => { try { fn(detail); } catch (e) { setTimeout(() => { throw e; }); } }); },
  /* gl.js calls ok(stage) when its canvas renders, fail(stage) on error or context loss. stage: hero | platos | allioli | haze */
  ok(stage) { setGL(stage, true); },
  fail(stage) { setGL(stage, false); },
  /* gl.js calls baked("platos", i) when the G-buffer for dish i is ready; the stage stays dark until then (max 600ms). */
  baked(stage, i) { this.emit("baked", { stage, i }); },
  /* A dish that fails the quality gate ships as its typographic plate while the engine keeps the others:
     typo("platos", i) shows plate i over the (cleared) canvas and drops the "· grabado" caption for it. */
  typo(stage, i, on = true) {
    if (stage !== "platos") return;
    const p = document.querySelector('.pase-stage .plate-type[data-dish="' + i + '"]');
    if (p) p.classList.toggle("is-typo", !!on);
    this.emit("typo", { stage, i, on: !!on });
  },
  /* Re-send the latest state of every scene (the page emits before gl.js has subscribed). */
  replay() { ["hero", "haze", "platos", "allioli"].forEach(k => { if (Object.keys(this.state[k]).length) this.emit(k, this.state[k]); }); },
  refresh() { if (MOTION) ScrollTrigger.refresh(); }
};
function setGL(stage, on) {
  ML.gl[stage] = !!on;
  if (stage === "hero") { const h = $("#inicio"); h.classList.toggle("is-gl-plate", !!on); h.classList.remove("gl-wait"); }
  else if (stage === "platos") $(".pase-stage").classList.toggle("is-gl", !!on);
  else if (stage === "allioli") $(".alli-stage").classList.toggle("is-gl", !!on);
  else if (stage === "haze") { $("#inicio").classList.toggle("is-haze", !!on); $("#esta-noche").classList.toggle("is-haze", !!on); }
  ML.emit("gl", { stage, on: !!on });
}

/* ===================== seeded noise ===================== */
function mulberry32(a) { return function () { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }

/* "Yeso y lino": a tileable lit heightmap, generated once, used by every pool. */
function makeTexture() {
  try {
    const N = 256, cv = document.createElement("canvas"); cv.width = cv.height = N;
    const g = cv.getContext("2d"); if (!g) return;
    const rnd = mulberry32(7);
    const lattice = (nx, ny) => { const a = new Float32Array(nx * ny); for (let i = 0; i < a.length; i++) a[i] = rnd(); return { nx, ny, a }; };
    const vn = (L, x, y) => {
      const fx = x / N * L.nx, fy = y / N * L.ny, x0 = Math.floor(fx), y0 = Math.floor(fy), tx = fx - x0, ty = fy - y0;
      const sx = tx * tx * (3 - 2 * tx), sy = ty * ty * (3 - 2 * ty);
      const at = (i, j) => L.a[((j % L.ny) + L.ny) % L.ny * L.nx + ((i % L.nx) + L.nx) % L.nx];
      const a = at(x0, y0), b = at(x0 + 1, y0), c = at(x0, y0 + 1), d = at(x0 + 1, y0 + 1);
      return a + (b - a) * sx + (c - a) * sy + (a - b - c + d) * sx * sy;
    };
    const oct = [[4, 4, .5], [8, 8, .25], [16, 16, .125], [32, 32, .0625]].map(([x, y, w]) => ({ L: lattice(x, y), w }));
    const fib = [[8, 48, .65], [16, 96, .35]].map(([x, y, w]) => ({ L: lattice(x, y), w }));
    const H = new Float32Array(N * N), F = new Float32Array(N * N);
    for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
      let h = 0, f = 0;
      for (const o of oct) h += o.w * vn(o.L, x, y);
      for (const o of fib) f += o.w * vn(o.L, x, y);
      H[y * N + x] = h; F[y * N + x] = f;
    }
    const Lx = -.5, Ly = .6, Lz = .62, ll = Math.hypot(Lx, Ly, Lz), k = 7;
    const img = g.createImageData(N, N), px = img.data;
    for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
      const hx = H[y * N + (x + 1) % N] - H[y * N + (x + N - 1) % N];
      const hy = H[((y + 1) % N) * N + x] - H[((y + N - 1) % N) * N + x];
      let nx = -hx * k, ny = -hy * k, nz = 1; const nl = Math.hypot(nx, ny, nz); nx /= nl; ny /= nl; nz /= nl;
      const shade = .5 + .5 * ((nx * Lx + ny * Ly + nz * Lz) / ll);
      let v = 104 + 48 * clamp(shade);
      v = v * .8 + (104 + 48 * clamp(F[y * N + x])) * .2;
      const i = (y * N + x) * 4; px[i] = px[i + 1] = px[i + 2] = v; px[i + 3] = 255;
    }
    g.putImageData(img, 0, 0);
    root.style.setProperty("--tex", "url(" + cv.toDataURL("image/png") + ")");
  } catch (e) {}
}

/* Plant cast shadows for La sala's pools (pothos, kentia, ficus). Never drawn as leaves, only as blurred shadows. */
function gobo(seed, kind) {
  const r = mulberry32(seed), R = (a, b) => a + (b - a) * r();
  const out = [];
  const bez = (p0, p1, p2, p3, t) => { const u = 1 - t; return [u * u * u * p0[0] + 3 * u * u * t * p1[0] + 3 * u * t * t * p2[0] + t * t * t * p3[0], u * u * u * p0[1] + 3 * u * u * t * p1[1] + 3 * u * t * t * p2[1] + t * t * t * p3[1]]; };
  const bezD = (p0, p1, p2, p3, t) => { const u = 1 - t; return [3 * u * u * (p1[0] - p0[0]) + 6 * u * t * (p2[0] - p1[0]) + 3 * t * t * (p3[0] - p2[0]), 3 * u * u * (p1[1] - p0[1]) + 6 * u * t * (p2[1] - p1[1]) + 3 * t * t * (p3[1] - p2[1])]; };
  const f = n => n.toFixed(1);
  if (kind === "pothos") {
    for (let v = 0; v < 2; v++) {
      const x0 = v ? R(360, 470) : R(90, 200);
      const p0 = [x0, -10], p1 = [x0 + R(-40, 60), R(70, 120)], p2 = [x0 + R(40, 140) * (v ? -1 : 1), R(140, 210)], p3 = [x0 + R(60, 180) * (v ? -1 : 1), R(230, 300)];
      out.push(`<path d="M${f(p0[0])} ${f(p0[1])}C${f(p1[0])} ${f(p1[1])} ${f(p2[0])} ${f(p2[1])} ${f(p3[0])} ${f(p3[1])}" fill="none" stroke="#0D0C0B" stroke-width="2"/>`);
      const n = 9 + Math.floor(r() * 5);
      for (let i = 0; i < n; i++) {
        const t = .08 + .9 * i / n + R(-.02, .02), p = bez(p0, p1, p2, p3, t), d = bezD(p0, p1, p2, p3, t);
        const ang = Math.atan2(d[1], d[0]) / DEG, side = i % 2 ? 1 : -1;
        const rot = ang - 90 + side * R(35, 60), s = R(30, 54) / 30;   /* hearts 30-60px across in a 30vw pool */
        out.push(`<path transform="translate(${f(p[0])} ${f(p[1])}) rotate(${f(rot)}) scale(${s.toFixed(2)})" d="M0 0C-10-6-18 6-10 16C-6 22 0 26 0 30C0 26 6 22 10 16C18 6 10-6 0 0Z"/>`);
      }
    }
  } else if (kind === "palm") {
    for (let fr = 0; fr < 2; fr++) {
      const left = fr === 0, sx = left ? -20 : 620, sy = R(40, 150) + fr * 40;
      const ex = left ? R(380, 520) : R(80, 220), ey = sy + R(60, 140), cx = (sx + ex) / 2, cy = Math.min(sy, ey) - R(60, 110);
      out.push(`<path d="M${f(sx)} ${f(sy)}Q${f(cx)} ${f(cy)} ${f(ex)} ${f(ey)}" fill="none" stroke="#0D0C0B" stroke-width="3"/>`);
      const n = 16;
      for (let i = 1; i < n; i++) {
        const t = i / n, u = 1 - t;
        const x = u * u * sx + 2 * u * t * cx + t * t * ex, y = u * u * sy + 2 * u * t * cy + t * t * ey;
        const dx = 2 * u * (cx - sx) + 2 * t * (ex - cx), dy = 2 * u * (cy - sy) + 2 * t * (ey - cy);
        const a = Math.atan2(dy, dx) / DEG;
        for (const side of [-1, 1]) {
          const len = lerp(76, 38, t) * R(.85, 1.1), w = R(9, 12) / 2;   /* leaflets wide enough to survive the blur */
          const rot = a + side * 55;
          out.push(`<path transform="translate(${f(x)} ${f(y)}) rotate(${f(rot)})" d="M0 0Q${f(len * .45)} ${f(-w * 1.6)} ${f(len)} 0Q${f(len * .45)} ${f(w * 1.6)} 0 0Z"/>`);
        }
      }
    }
  } else {
    const trunks = 3 + Math.floor(r() * 2);
    for (let b = 0; b < trunks; b++) {
      let x = R(60, 540), y = 310, a = -90 + R(-28, 28);
      const pts = [[x, y]];
      for (let s = 0; s < 5; s++) { a += R(-22, 22); x += Math.cos(a * DEG) * R(40, 70); y += Math.sin(a * DEG) * R(40, 70); pts.push([x, y]); }
      out.push(`<path d="M${pts.map(p => f(p[0]) + " " + f(p[1])).join("L")}" fill="none" stroke="#0D0C0B" stroke-width="2" stroke-linejoin="round"/>`);
      for (let s = 1; s < pts.length; s++) {
        const [px, py] = pts[s], m = 4 + Math.floor(r() * 3);
        for (let k = 0; k < m; k++) {
          const la = R(0, 360), dd = R(10, 26), lx = px + Math.cos(la * DEG) * dd, ly = py + Math.sin(la * DEG) * dd;
          out.push(`<path transform="translate(${f(lx)} ${f(ly)}) rotate(${f(la)}) scale(1.8)" d="M-9 0C-9-4 -3-4.5 2-3.6L11 0L2 3.6C-3 4.5-9 4-9 0Z"/>`);
        }
      }
    }
  }
  return `<svg viewBox="0 0 600 300" preserveAspectRatio="xMidYMid slice" aria-hidden="true" focusable="false"><g fill="#0D0C0B">${out.join("")}</g></svg>`;
}
function buildGobos() {
  $$(".sala-lt").forEach((lt, i) => {
    const kind = lt.dataset.gobo;
    const far = $(".gobo-far", lt), near = $(".gobo-near", lt);
    if (far) far.innerHTML = gobo(101 + i * 17, kind);
    if (near) near.innerHTML = gobo(7 + i * 31, kind);
  });
}

/* Spiral groove for the CSS sauce fallback. */
function buildSpiral() {
  const p = $(".s-spiral path"); if (!p) return;
  const pts = [], turns = 7, steps = 560;
  for (let i = 0; i <= steps; i++) { const t = i / steps, a = t * turns * Math.PI * 2, rr = 6 + 92 * t; pts.push((rr * Math.cos(a)).toFixed(1) + " " + (rr * Math.sin(a)).toFixed(1)); }
  p.setAttribute("d", "M" + pts.join("L"));
}

/* ===================== hours, live status, heat and demo (logic from option A, extended) ===================== */
const DAYS = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];
const L = [750, 960], D = [1200, 1380];
const HOURS = { 0: [L], 1: [], 2: [L], 3: [L, D], 4: [L, D], 5: [L, D], 6: [L, D] };
const hhmm = m => String(Math.floor(m / 60)).padStart(2, "0") + ":" + String(m % 60).padStart(2, "0");
let demo = null; // {day,min0,t0}: simulated clock for showing the lit state
let DTF = null;
try { DTF = new Intl.DateTimeFormat("en-GB", { timeZone: "Europe/Madrid", weekday: "short", hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false }); } catch (e) {}
function now() {
  if (demo) {
    const e = Math.floor((Date.now() - demo.t0) / 1000), t = demo.day * 86400 + demo.min0 * 60 + e;
    return { day: Math.floor(t / 86400) % 7, min: Math.floor(t % 86400 / 60), sec: t % 60 };
  }
  if (DTF) {
    const p = DTF.formatToParts(new Date()), g = t => p.find(x => x.type === t).value;
    return { day: ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].indexOf(g("weekday")), min: (+g("hour") % 24) * 60 + +g("minute"), sec: +g("second") };
  }
  const d = new Date(); return { day: d.getDay(), min: d.getHours() * 60 + d.getMinutes(), sec: d.getSeconds() };
}
function status(n = now()) {
  const { day, min, sec } = n;
  const cur = HOURS[day].find(([a, b]) => min >= a && min < b);
  /* no-break spaces keep "a las 12:30" and "las 23:00" together when a status line wraps */
  if (cur) return { open: true, text: "Abierto\u00a0· hasta las\u00a0" + hhmm(cur[1]), short: "Abierto hasta las\u00a0" + hhmm(cur[1]), left: (cur[1] - min) * 60 - sec, label: "para el cierre", day };
  for (let k = 0; k < 8; k++) {
    const d = (day + k) % 7, nx = HOURS[d].find(([a]) => k > 0 || a > min);
    if (nx) return { open: false, text: "Cerrado\u00a0· abre " + (k === 0 ? "hoy" : k === 1 ? "mañana" : "el " + DAYS[d].toLowerCase()) + " a\u00a0las\u00a0" + hhmm(nx[0]), short: "Abre " + (k === 0 ? "hoy" : k === 1 ? "mañana" : "el " + DAYS[d].toLowerCase()) + " a\u00a0las\u00a0" + hhmm(nx[0]), left: (k * 1440 + nx[0] - min) * 60 - sec, label: "para abrir", day };
  }
}
const heat = s => s.open ? 1 : 0.2 + 0.7 * (1 - Math.min(1, (s.left / 60) / 240));
function closingHead(n) {
  const t = HOURS[n.day];
  if (t.some(([a, b]) => a >= 1200 && n.min < b)) return "Tu mesa, esta noche.";
  if (t.some(([a, b]) => n.min < b)) return "Tu mesa, hoy.";
  for (let k = 1; k < 8; k++) { const d = (n.day + k) % 7; if (HOURS[d].length) return k === 1 ? "Tu mesa, mañana." : "Tu mesa, el " + DAYS[d].toLowerCase() + "."; }
}
const fmt = (s, sec) => { s = Math.max(0, s); const h = Math.floor(s / 3600), m = Math.floor(s % 3600 / 60), x = s % 60;
  /* no-break spaces keep each number with its unit ("23 h", "47 min") when the line wraps */
  return (h ? h + "\u00a0h " : "") + (h ? String(m).padStart(2, "0") : m) + "\u00a0min" + (sec ? " " + String(x).padStart(2, "0") + "\u00a0s" : ""); };
const hex = h => [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16));
const mixHex = (a, b, t) => { const A = hex(a), B = hex(b); return "#" + A.map((v, i) => Math.round(lerp(v, B[i], t)).toString(16).padStart(2, "0")).join(""); };

/* demo override: #luz=abierto / ?luz=cerrado, read once at load */
(() => { const q = (location.hash || "") + "&" + (location.search || "");
  if (/luz=abierto/.test(q)) demo = { day: 5, min0: 1274, t0: Date.now() };
  else if (/luz=cerrado/.test(q)) demo = { day: 1, min0: 600, t0: Date.now() }; })();
ML.setClock = (day, min) => { demo = (day == null) ? null : { day, min0: min, t0: Date.now() }; syncDemoBtn(); tick(); };
ML.now = now; ML.status = status; ML.closingHead = closingHead;

/* dial geometry: 12:00 at the left, 18:00 at the top, 24:00 at the right */
const DIAL = { cx: 160, cy: 168, r: 140 };
const dialPt = m => { const th = Math.PI - (clamp(m, 720, 1440) - 720) / 720 * Math.PI; return [DIAL.cx + DIAL.r * Math.cos(th), DIAL.cy - DIAL.r * Math.sin(th)]; };
const arcPath = (a, b) => { const p = dialPt(a), q = dialPt(b); return `M${p[0].toFixed(2)} ${p[1].toFixed(2)}A${DIAL.r} ${DIAL.r} 0 0 1 ${q[0].toFixed(2)} ${q[1].toFixed(2)}`; };
let dialDay = -1, dialGlide = false;
function setMarker(m) {
  const mk = $(".dial-marker"); if (!mk) return;
  const off = m < 720, [x, y] = dialPt(off ? 720 : m);
  mk.setAttribute("transform", `translate(${x.toFixed(2)} ${y.toFixed(2)})`);
  mk.classList.toggle("is-off", off);
}
function drawArcs(day) {
  const g = $(".dial-arcs"); if (!g) return;
  g.innerHTML = HOURS[day].map(([a, b]) => `<path class="dial-arc" d="${arcPath(a, b)}"/>`).join("");
}

let lastHead = "", lastDay = -1;
const statusLamps = $$(".lamp[data-status-lamp]");
function tick() {
  const n = now(), s = status(n), h = heat(s);
  ML.heat = h; ML.open = s.open; ML.lampCol = mixHex("#EAC9A0", "#FFF4E0", h);
  root.style.setProperty("--heat", h.toFixed(3));
  root.style.setProperty("--lamp-col", ML.lampCol);
  /* While the footer's demo clock runs, every status says so: a simulated "Abierto" must never pass for the real one. */
  const dm = demo ? " (demostración)" : "", word = (s.open ? "Abierto" : "Cerrado") + (demo ? " (demo)" : "");
  const text = s.text + dm, short = demo ? word : s.short;
  $$('[data-status="text"]').forEach(el => { if (el.textContent !== text) el.textContent = text; });
  $$('[data-status="short"]').forEach(el => { if (el.textContent !== short) el.textContent = short; });
  $$('[data-status="word"]').forEach(el => { if (el.textContent !== word) el.textContent = word; });
  const bulb = s.open ? 1 : 0.15 + 0.5 * (h - 0.2) / 0.7;
  statusLamps.forEach(l => { l.style.setProperty("--bulb", bulb.toFixed(3)); l.style.setProperty("--rim", s.open ? "var(--luz)" : "var(--ceniza)"); l.classList.toggle("is-open", s.open); });

  const head = closingHead(n), nh = $("#noche-h");
  if (nh && head !== lastHead) { lastHead = head; if (nh.textContent !== head) nh.textContent = head; }
  const live = $("[data-noche-live]");
  /* the countdown is one unbreakable unit ("faltan 18 h 56 min") */
  const left = (sec) => ((s.open ? "quedan " : "faltan ") + fmt(s.left, sec)).replace(/ /g, "\u00a0");
  if (live) {
    /* status and countdown in their own spans: on phones the countdown takes its own line and the dot between them goes */
    const a = s.text, c = left(false) + dm, st = $("[data-nl-st]", live), cn = $("[data-nl-cd]", live), sep = $(".nl-sep", live);
    if (st && cn && sep) { if (st.textContent !== a) st.textContent = a; if (cn.textContent !== c) cn.textContent = c; sep.hidden = false; }
    else live.textContent = a + "\u00a0· " + c;
  }
  const cd = $("[data-countdown]");
  if (cd) cd.textContent = left(true) + (s.open ? " para el cierre" : " para abrir");

  if (n.day !== lastDay) {
    lastDay = n.day;
    $$(".week li").forEach(li => {
      const today = +li.dataset.day === n.day; li.classList.toggle("is-today", today);
      const wd = $(".wd", li), tag = $(".hoy", li);
      if (today && !tag) wd.insertAdjacentHTML("beforeend", '<em class="hoy">hoy</em>');
      if (!today && tag) tag.remove();
    });
  }
  if (n.day !== dialDay) { dialDay = n.day; drawArcs(n.day); }
  if (!dialGlide) setMarker(n.min);
  ML.emit("status", { open: s.open, heat: h, lampCol: ML.lampCol, text: s.text });
}

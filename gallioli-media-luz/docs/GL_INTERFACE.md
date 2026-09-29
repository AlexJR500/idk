# GL interface: "A media luz" (option B)

Builder 1 made the page, the CSS light system, the non-WebGL motion and every fallback. Builder 2 adds the three WebGL engines from spec 5.1, 5.2 and 5.3, and puts them in **`src/60_gl.js` only**. `build.py` wraps that file in its own `<script>`. It runs after the main page script and before the legal kit.

The page is complete without it. If gl.js is missing, throws, or never calls `ok()`, readers get the typographic plates, the CSS sauce and the CSS cones.

## 1. The registry: `window.mediaLuz` (below, `ML`)

The main script creates `ML` and finishes before gl.js runs. So at gl.js start, `ML.ready === true` and the `"ready"` event has already fired. Subscribe first, then call `ML.replay()` to receive the current state once.

| Member | What it is |
|---|---|
| `ML.version` | `1` |
| `ML.reduced` | `prefers-reduced-motion: reduce` at load. Render **one static frame** per scene: no `uTime`, no rAF loops. |
| `ML.motion` | `true` when GSAP loaded and motion is allowed. When `false`, the page drives scenes statically (see 4). |
| `ML.phone()` / `ML.stacked()` | `≤600px` / `≤760px` (the stacked sticky-stage layout). Use `phone()` for `dprE` and march steps (48 on phones, pitch 3.0). |
| `ML.heat`, `ML.lampCol`, `ML.open` | Live heat 0..1, lamp colour hex (`mix(#EAC9A0,#FFF4E0,heat)`), open now. Updated every second. |
| `ML.state.hero`, `.haze`, `.platos`, `.allioli` | Latest payload of each event below. The objects are mutated in place. |
| `ML.state.heroVisible`, `platosVisible`, `allioliVisible`, `nocheVisible` | Visibility flags (viewport ±25%). |
| `ML.gl` | `{hero, platos, allioli, haze}`: booleans as set by `ok` and `fail`. |
| `ML.el` | Element refs (see 2). |
| `ML.on(type, fn)` → unsubscribe fn; `ML.off(type, fn)` | Events. A throwing handler is rethrown asynchronously and never breaks the page. |
| `ML.replay()` | Re-emits `hero`, `haze`, `platos` and `allioli` with their current state. |
| `ML.ok(stage)` | Call after the **first good frame** of a stage. `stage` is `"hero"`, `"platos"`, `"allioli"` or `"haze"`. It swaps the CSS fallback for your canvas. |
| `ML.fail(stage)` | Call on shader or compile error, a failed quality gate, or `webglcontextlost`. It restores the fallback. Call `ok` again after a successful restore. |
| `ML.baked("platos", i)` | Call when dish `i`'s G-buffer is ready. It releases the dark hold (see 3.2). |
| `ML.typo("platos", i, on = true)` | Dish `i` failed the quality gate (spec 5.1). The page shows that dish's typographic plate over your canvas and hides the "· grabado" caption. **Draw nothing (clear to transparent) for that dish.** |
| `ML.setClock(day, min)` / `ML.setClock(null)` | Test hook: simulated clock (day 0 = Sunday, min = minutes since 00:00). |

## 2. Canvases and hosts, per stage

| Stage | Element (`ML.el`) | Where | Size (CSS) | Hidden until | Fallback while hidden |
|---|---|---|---|---|---|
| **hero** (5.1 hero bake) | `<canvas id="hero-plate">` (`heroPlate`), 2D | inside `.hero-plate-box` (`heroPlateBox`) in `#inicio .hero-img` | 16:10 box, width `clamp(280px,26vw,460px)` on desktop, 224×140 at ≤600, 360×225 at 601–960; centred on the pool. Read `heroPlateBox.getBoundingClientRect()`. | `ML.ok("hero")` → `#inicio.is-gl-plate` | `.hero-type` "croquetas / y allioli" (typographic plate) |
| **platos** (5.1 live) | `<canvas id="engrave">` (`engrave`), WebGL2 | inside `.stage-canvas[data-host="platos"]` (`platosHost`) in `.pase-stage` (`platosStage`) | Host is 86% of the stage width, 16:10, centred at 58% of the stage height. The stage is sticky (100svh on desktop; 46svh under the 56px header on ≤760). The page scales the host with `--dolly` (1.04 → 1.0): **do not dolly again in the shader.** | `ML.ok("platos")` → `.pase-stage.is-gl` | four `.plate-type[data-dish]` (hatched Bodoni) |
| **allioli** (5.2) | empty host `.stage-canvas[data-host="allioli"]` (`alliHost`) | `.alli-stage` (`alliStage`) | fills the stage (`inset:0`), sticky 56% column on desktop, 46svh on ≤760 | `ML.ok("allioli")` → `.alli-stage.is-gl` | `.sauce` CSS layers plus `.alli-type` |
| **haze** (5.3) | `<canvas id="haze">` (`haze`), WebGL1 | re-parented by the page between `.hero-haze` and `.noche-haze` (`hazeHosts.hero` / `.noche`); both are `inset:0` in their section | host size = `ML.state.haze.width/height` | `ML.ok("haze")` → `.is-haze` on `#inicio` and `#esta-noche` | `.hero-cone` / `.noche-cone` (CSS) plus the bulb halo |

**One WebGL2 context** (5.1 + 5.2). Keep `#engrave` as the only WebGL2 canvas.
- The hero bake: detach `#engrave`, size it to the hero plate × DPR × 1.5, bake scene 0, `drawImage` it into `#hero-plate`, then put it back into `platosHost`.
- The allioli macro: move `#engrave` into `alliHost` while `allioliVisible && !platosVisible`, and back when El pase is visible again. A re-parented canvas keeps its context. Resize to the host on each move.
- The alternative is to render the macro offscreen and `drawImage` it into a 2D canvas you create inside `alliHost`.

**Layering.**
- The **plate canvas** (`#engrave` in El pase): background pixels must be transparent (premultiplied alpha). The DOM `.pool` and the `.contact` shadow sit under it.
- The **macro canvas** (Allioli) is opaque with the Carbón black level. Stack order in `.alli-stage`: your host (z auto) → `.alli-type` (z 1, hidden when `is-gl`) → `.alli-word` "Gallioli" overlay (z 2) → lamp and step names (z 3). The page places and masks the word at `--hx/--hy`.
- **`#haze`** already has `mix-blend-mode: screen`.

## 3. Values the page produces

All angles are in **radians**. All pixel values are **CSS px in the host's coordinate space**: origin at the host's top-left, y down.

### 3.1 `"hero"` → `ML.state.hero`
`{ bulb, light, plate, plateBrightness, out }`
- `bulb`, `light` and `plate` run 0 → 1 during the intro (7.1).
- `out` goes 0 → 1 as the hero scrolls out (scrub .8).
- The page already applies `filter: brightness(plateBrightness)` to `#hero-plate` and the opacity to its box. **Just draw the still.**

### 3.2 `"platos"` → `ML.state.platos`
`{ i, p, L, az, el, dolly, key: { az, el, L } }`
- `i` is the dish 0..3. `p` is progress inside that dish.
- `L` is the key light 0..1, with fade in over the first 18% and fade out over the last 18%. The spec's formulas are already applied:
  - az −40°→+40° and el 30°→42°;
  - pollo: az −55°→+25°, el 28°.
- Map `uLightAz = key.az`, `uLightEl = key.el`, `uL = key.L`.
- Fires on every scroll frame while the stage scrubs (quickTo smoother, .8s power3).

`"platos:scene"` → `{ i, typo }` fires when the dish changes, always while `L` is at 0 (dark switch).
- If `ML.gl.platos` is on and the dish is not typo, the page **holds L at 0** until `ML.baked("platos", i)` or 600ms, then ramps back over 350ms.
- Bake in 4 scissor bands over 4 frames, then call `baked`.

### 3.3 `"allioli"` → `ML.state.allioli`
`{ P, step, uGrain, uFilm, uEdge, uSpiral, uTwist, uThick, uBind, uL, az, el, highlight: [x, y] }`
- The table in 5.2 is already interpolated with a smoothstep inside each segment.
- `highlight` is `c + .18·(sin az, −cos az·.6)` in stage fractions (0..1). The page writes the same value to `--hx/--hy` for the word mask, so the two stay aligned.
- **Spec note (5.2 film mask):** as written, `f = smoothstep(uEdge−.12, uEdge+.12, x)` with uEdge sweeping −.3 → 1.3 while uFilm goes 0 → 1 gives `f ≈ 0` once uEdge = 1.3, so the film would never show. The CSS fallback treats the film as present **where x < edge**. Use `f = 1 − smoothstep(uEdge−.12, uEdge+.12, x)` so that the swept part is the filmed part.

### 3.4 `"haze"` → `ML.state.haze`
`{ host, el, canvas, width, height, bulb: [x, y], dir: [dx, dy], len, half, light, density, heat, lampCol }`
- Map `uBulb = bulb` (flip y for GL: `height − y`, times your DPR scale), `uDir = dir` (unit, flip y), `uLen = len`, `uHalf = half`, `uLight = light`, `uDensity = density`, `uRes = [width, height]·scale`.
- **Hero:** `light` follows the intro (0 → 1), then scrolls out 1 → .35; `half` 20° → 13°; `density` 1 → 1.4.
- **Esta noche:** `light = lerp(.4, .6 + .4·heat, arrive)`, with `half` 20° and `density` 1.
- `bulb`, `dir` and `len` are recomputed on resize, on font load and on every host change. They aim from the bulb to the pool centre; the CSS cone uses the same numbers.

`"haze:host"` → `{ host: "hero" | "noche", el, canvas }`. The page has **already moved** `#haze`, so resize it to `el` (half resolution: `0.5 × min(DPR, 2)`). A `"haze"` event with the new geometry follows.

### 3.5 Other events
| Event | Payload | Use |
|---|---|---|
| `"visible"` | `{ stage: "hero" \| "platos" \| "allioli" \| "noche", on }` | Pause or resume rAF (haze 30fps only while its host is visible). |
| `"status"` | `{ open, heat, lampCol, text }` (every second) | Warm the lamp core colour. |
| `"resize"` | `{}` (debounced 150ms, after layout) | Resize canvases; re-bake in the next dark window. |
| `"fonts"` | `{}` | Layout was re-measured after the webfonts. |
| `"gl"` | `{ stage, on }` | Echo of `ok` and `fail`. |
| `"baked"`, `"typo"` | `{ stage, i }`, `{ stage, i, on }` | Echo of your calls. |

## 4. Modes

| Mode | What the page does | What gl.js should do |
|---|---|---|
| Motion (GSAP present, not reduced) | Scrubbed scenes, the events above on every frame | Normal engines |
| **Reduced motion** (`ML.reduced`) | No intro. El pase shows each dish statically lit (`L = 1`, `az = 0`, `el = 38°`) and switches by IntersectionObserver. Allioli shows the final frame (`P = 1`). The haze is static. | One frame per scene or dish change, `uTime = 0`, no loops |
| No GSAP (`!ML.motion`, not reduced) | Same static switching as reduced, but quotes still light | Same as reduced |
| No WebGL2 / WebGL1 | — | Do not call `ok` (or call `fail`). The fallbacks are already on. |

## 5. Fallback toggles (all CSS; the page never needs gl.js)

- `ok("hero")` adds `#inicio.is-gl-plate`: `#hero-plate` becomes visible and `.hero-type` gets `display:none`. `fail("hero")` reverses it.
- `ok("platos")` adds `.pase-stage.is-gl`: `.stage-canvas` becomes visible and the plates without `.is-typo` get `display:none`. The "{dish} · grabado" caption shows only in GL mode, and never for a typo dish.
- `ok("allioli")` adds `.alli-stage.is-gl`: the host becomes visible, and `.sauce` and `.alli-type` are hidden. The "Gallioli" word overlay stays; it belongs to the page.
- `ok("haze")` adds `.is-haze` on `#inicio` and `#esta-noche`: `#haze` becomes visible and `.hero-cone` / `.noche-cone` are hidden. The bulb halos stay.

## 6. How to test

- **Build:** `python3 build.py` → `index.html` (artifact format) and `page.html` (wrapped by `wrap.py`).
- **Serve:**
  - `python3 -m http.server 8769 --bind 127.0.0.1 -d optb`
  - `python3 -m http.server 8766 --bind 127.0.0.1 -d host`
  - Open `http://localhost:8766/hostb.html`. It frames `http://127.0.0.1:8769/page.html` cross-origin with a sandbox, like the real viewer.
- **Playwright:** `NODE_PATH=$(npm root -g)`, chromium at `/opt/pw-browsers/chromium`. `tests/lib.js` routes Google Fonts and GSAP to local copies (`setup.js`). For WebGL, launch with `--use-angle=swiftshader --enable-unsafe-swiftshader`, i.e. `launch({ gl: true })`.
- **Tests:**
  - `tests/glhooks.js` checks this contract without an engine: `ok`/`fail`/`typo`, the bake hold, haze re-parenting and payloads. Run it after adding gl.js; it must stay green.
  - `tests/shots.js w h [mobile] [tag] [reduced|nogsap|nojs]` takes screenshots of every section into `shots/`. Use `ONLY=regex` to filter.
  - `tests/interact.js` clicks through every feature.
  - `tests/visible.js` checks that the page is readable at rest in normal, reduced, no-GSAP and no-JS modes.
- **Console:** keep it at zero errors. Guard `getContext` and shader compiles, and listen for `webglcontextlost` → `ML.fail(stage)`.
- **Quality gate** (5.1): screenshot each dish at 360 (DPR 1 and 2) and 1440. If a dish reads as a blob, call `ML.typo("platos", i)` for it.

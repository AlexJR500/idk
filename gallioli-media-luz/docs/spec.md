# Gallioli · Opción B · "A media luz" · build spec

- Option name: **A media luz**
- Page `<title>`: **`Gallioli a media luz`**
- Output file: `/tmp/claude-0/-home-user-idk/e66a5fec-10b5-5440-b284-3d75b49b7057/scratchpad/optb/index.html`
- Content source: `optb/content.md` (all Spanish copy comes from there unless this spec writes a new line; every new line is listed in the section it belongs to).
- Guardrails: `optb/avoid.md` (do-not-repeat sheet). If this spec and avoid.md ever seem to disagree, avoid.md wins; tell the orchestrator.
- Legal kit: `optb/legal_kit.html`, pasted verbatim near the end of the file and restyled (section 9).

This spec is based on the winning proposal "A media luz". The judges' mustFix items are applied. Grafts from "Claroscuro" and "Luz de brasa" were added only where they strengthen the idea. Section 13 lists every change from the proposal.

---

## 0. Deliverable format and stack

1. **One file in artifact format.** Copy the shape of `scratchpad/art5/index.html` (Option A's artifact): no `<!doctype>`, `<html>`, `<head>` or `<body>`. File order:
   1. `<title>Gallioli a media luz</title>`
   2. `<link rel="preconnect" href="https://fonts.googleapis.com">`, `<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>`, and the stylesheet link with the exact URL in 2.3.
   3. One `<style>` block.
   4. The inline boot `<script>` (3.1).
   5. The markup: skip link, header, menu, `<main id="contenido">`, footer, mobile bar, toast, vignette, SVG `<defs>` sprite.
   6. `<script src="https://cdnjs.cloudflare.com/ajax/libs/gsap/3.13.0/gsap.min.js"></script>` and `<script src="https://cdnjs.cloudflare.com/ajax/libs/gsap/3.13.0/ScrollTrigger.min.js"></script>`. SplitText and Flip are not used.
   7. The main `<script>`.
   8. The legal kit, verbatim.
2. **The viewer's skeleton** (`scratchpad/art/page.html`) sets `:root{color-scheme:light}` and `body{background:#faf9f5;color:#141413;font:14px system-ui}`, and adds `[hidden]{display:none!important}`. Override these explicitly:
   - `:root{color-scheme:dark}`
   - `html,body{background:#0D0C0B;color:#EBE5D9}`
   - `body{margin:0;font:400 17px/1.65 var(--f-body);overflow-x:clip}`

   Keep the skeleton's safe-area padding.
3. **Single theme.** The page is always dark, because it is a restaurant site mock-up with one art direction. No light-mode variant.
4. **Language.** The boot script sets `document.documentElement.lang = "es"`, because the skeleton's `<html>` has no lang. Use `hyphens: auto` on body copy only, never on headings.
5. **No other hosts.** No fetch, iframes, external images, analytics or maps. External links use `target="_blank" rel="noopener"` and contain `<span class="sr">(se abre en una pestaña nueva)</span>`.
6. **Links.**
   - Booking, "Pedir online" and "Cómo llegar" all use the Maps URL: `https://www.google.com/maps/search/?api=1&amp;query=Gallioli+Bistrot+Ronda+del+General+Mitre+220+Barcelona`
   - Instagram: `https://www.instagram.com/galliolibistrot/`
   - Every "Reservar mesa" link has class `js-reserva` and `data-loc` set to one of: `cabecera`, `menu`, `portada`, `en-el-local`, `esta-noche`, `visitanos`, `barra-movil`. On click call `window.gallioliTrack?.("reserva_click",{ubicacion:dataset.loc})`. It is a no-op here because GA never loads.
7. **Local testing.**
   - `python3 optb/wrap.py` wraps `optb/index.html` into `optb/page.html`.
   - `optb/setup.js` routes Google Fonts to the local cache (this exact URL is already cached as `scratchpad/fonts/css_53f7d1fc.css`) and routes GSAP to `/home/user/idk/vendor/`.
   - Chromium: `/opt/pw-browsers/chromium`. Headless WebGL2 works via SwiftShader, with `EXT_color_buffer_float` and 6 draw buffers. It is slow, but fine for screenshots.

---

## 1. Concept and mood

**One sentence:** Gallioli at 21:30, a warm near-black room lit by one pendant lamp, where the food is drawn live as white-on-black scratchboard engravings and the light moves across them.

- **Option A** sells the bistrot by day: loud, fern green, yellow allioli, condensed capitals, playful.
- **Option B** sells dinner tonight. The page behaves like the dining room after dark: there is always one visible light source (a lamp), and things are shown by light reaching them, not by objects flying in. The lamp is the brand mark, in place of A's "G":
  - it is the live open/closed glyph;
  - it switches on in the hero;
  - three lamps light La sala;
  - a bar lamp hangs over the pass where the dishes appear;
  - it lights the closing booking scene;
  - it switches off in the footer.
- **Imagery.** There are no photos. The dishes are scratchboard or wood-engraving still lifes rendered in the page: white lines cut out of black. That is literally light coming out of darkness, and it is an old menu-illustration craft.
- **Why it fits Gallioli.**
  - Dinner service runs 20:00–23:00 from Wednesday to Saturday.
  - The house dish is "pollo **al carbón**", and carbón gives the base colour.
  - The room is a "comedor pequeño y cálido", ideal for "una cena tranquila en pareja".
  - The allioli story becomes the sauce turning white and bright, so the house sauce is the brightest thing on the page.
- **Mood words:** nocturno, íntimo, cinematográfico, sobrio, cálido, pausado, grabado, claroscuro.
- **Voice.** Calmer and more adult than A: short declaratives, "tú", no exclamations, no rhetorical questions in headings, facts only. It stays concrete so it never reads as fine dining: "bistrot de barrio", dish names, "10–20 € por persona", para llevar and a domicilio are all visible above the fold.
- **Pitch line for Alex to use with the owner:** "La opción A es el Gallioli del mediodía; la B, el de la cena." Also: the art direction (black ground, one lamp) doubles as the brief for real photos later.
- **Flag for Alex.** The headline "Al carbón, a media luz." is mood copy. The owner should approve it. The fallback headline is "Pollo al carbón, a media luz."

---

## 2. Design tokens

### 2.1 Palette

The page is a strict monochrome ladder. Luz is the only colour that means "light". Tostado and the lamp tints live only inside imagery.

| Token | Hex | Role |
|---|---|---|
| `--carbon` | `#0D0C0B` | Page background everywhere. Also the black level of every canvas, clamped and dithered, so canvases have no visible edge. |
| `--humo` | `#1A1816` | Raised planes: mobile menu, legal sheet, cookie strip, toast, the carta plane, the mobile booking bar. |
| `--haze` | `#2A2622` | The brightest haze tone inside light cones. |
| `--pool` | `#2E2925` | The maximum brightness of any textured light pool behind text. Never exceed it. |
| `--ceniza` | `#3B3733` | Hairlines, dividers, unlit dial track and timeline tracks. Decoration only, never text or a UI boundary. |
| `--cordel` | `#766F66` | UI boundaries that must reach 3:1: form field underlines at rest, the checkbox border, text-link underlines, outlined cookie buttons at rest. |
| `--piedra` | `#A59E94` | Secondary text: descriptions, attributions, meta, nav at rest, unlit quotes, "dimmed" rows. |
| `--ajo` | `#EBE5D9` | Primary text, headlines, engraving line white. |
| `--luz` | `#FFF4E0` | The lit state: "Reservar mesa" fill (at hover; see buttons), lit bulbs, lit dial arcs, today's row, the lit quote, the current step, the open FAQ, focus rings. |
| `--luz-rest` | `#F5EBD8` | The "Reservar mesa" fill at rest. It turns up to `--luz` on hover. |
| `--tostado` | `#C79A6B` | Imagery only: crust line tint in engravings and a ≤10% warmth in haze and pools. Never text, UI chrome, fills or bands. |
| `--lamp-col` | computed | Bulb and cone tint: `mix(#EAC9A0, #FFF4E0, heat)`, because a dimmed incandescent bulb looks warmer. Imagery only. |

**Verified contrast** (WCAG 2.x, computed):

| Pair | Ratio | Use |
|---|---|---|
| Ajo on Carbón | 15.58 | body, headings |
| Ajo on Humo | 14.11 | menu, sheet, carta |
| Ajo on Pool `#2E2925` | 11.47 | text over light pools |
| Piedra on Carbón | 7.37 | secondary text |
| Piedra on Humo | 6.68 | secondary text on planes |
| Piedra on Pool | 5.42 | secondary text over pools |
| Luz on Carbón | 17.93 | lit text, focus ring |
| Carbón on Luz / Luz-rest | 17.93 / 16.53 | primary button label |
| Cordel on Carbón / Humo | 3.94 / 3.57 | field underline, checkbox, outlines (≥3:1, SC 1.4.11) |
| Ceniza on Carbón | 1.66 | decoration only |

**Colour rules:**
- **Dimming never uses opacity on text.** Ajo at 45% opacity is 3.85:1 and Piedra at 45% is 2.36:1, so both fail. "Dim" means a step down the ladder: Luz → Ajo → Piedra. Piedra is the floor for any text.
- **Armed start states.** The only exception is transient, one-shot reveal states. These may start at opacity .35 for at most 1.2 s.
- **No colour bands.** Every section sits on Carbón. Humo appears only as planes: the carta plane, dialogs, strips.
- **Lamp tint is not UI.** Nothing uses yellow, amber, red, green, navy or aubergine. The lamp tint `#EAC9A0` only ever colours a bulb or a cone.

### 2.2 Fonts

URL, verified to return CSS with 11 woff2 files:

```
https://fonts.googleapis.com/css2?family=Bodoni+Moda:ital,opsz,wght@0,6..96,400;0,6..96,500;1,6..96,400;1,6..96,500&family=Jost:wght@400;500&display=swap
```

- `--f-display: "Bodoni Moda", "Bodoni 72", Didot, Georgia, serif;`
  - Mixed case, never all caps.
  - Always `font-optical-sizing: auto`, so the optical-size axis follows the px size.
- `--f-body: "Jost", "Futura", "Century Gothic", system-ui, sans-serif;`

**Rules** (these apply the judges' legibility mustFix):
- **Bodoni is never set below 20px.**
  - 20–31px uses weight 500 (roman or italic), so hairlines hold on dark screens at DPR 1.
  - 32px and up uses weight 400.
- **Small text is Jost.** All labels, status, meta, attributions, tags under 20px, form labels, buttons and nav use Jost 500.
- **No monospace, no tracked uppercase, no eyebrows.** Small labels are sentence case.
- **Numbers.** All live numerals (status times, countdowns, dial labels, hours) use Jost with `font-variant-numeric: tabular-nums`. Verified: Jost has `tnum`.
- **Arrows are inline SVG.** Verified: neither Bodoni Moda nor Jost contains ↗ → ↓ (U+2197, U+2192, U+2193 are missing in every subset). Never type them. Use `<svg class="arr">`:
  - ↗ `viewBox="0 0 12 12"` `<path d="M3 9 9 3M4.5 3H9v4.5" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="square"/>`
  - ↓ `<path d="M6 2v8M2.5 6.5 6 10l3.5-3.5" …/>`
  - Size `.75em`, `vertical-align: -.05em`, margin-left `.35em`.
- `« » — – € · ñ ¿ ¡ …` are present in both families.

### 2.3 Type scale

| Token | Font | Size | Line-height / tracking | Use |
|---|---|---|---|---|
| `--t-hero` | Bodoni 400 | `clamp(2.9rem, 8.2vw, 8.5rem)` | .95 / −.01em | H1 big line |
| `--t-name` | Bodoni italic 500 | `clamp(1.375rem, 1.9vw, 1.75rem)` | 1.2 | H1 small line "Gallioli Bistrot" |
| `--t-h2` | Bodoni 400 | `clamp(2.5rem, 5.4vw, 5.2rem)` | 1.0 / −.01em | Section display headings |
| `--t-h2-small` | Bodoni italic 500 | `1.5rem` | 1.2 | Margin titles (La sala, La carta) |
| `--t-lead` | Bodoni 400 | `clamp(1.6rem, 2.8vw, 2.6rem)` | 1.25 | La sala paragraph |
| `--t-dish` | Bodoni 400 | `clamp(2.6rem, 4.6vw, 4.4rem)` | 1.0 | El pase dish names |
| `--t-quote` | Bodoni italic 400/500 | `clamp(1.4rem, 2.6vw, 2.3rem)` | 1.3 | Pull-quotes (500 below 32px) |
| `--t-item` | Bodoni 500 | `clamp(1.35rem, 1.9vw, 1.65rem)` | 1.3 | Carta items, FAQ questions, week day names |
| `--t-phrase` | Bodoni 400 | `clamp(2rem, 3.4vw, 3rem)` | 1.05 | Formas row phrases |
| `--t-body` | Jost 400 | `17px` | 1.65 | Body |
| `--t-small` | Jost 500 | `15px` | 1.5 / .01em | Buttons, nav (16px), status, attributions |
| `--t-meta` | Jost 500 | `14px` | 1.45 | Captions, dial ticks, cookie details |
| `--t-label` | Jost 500 | `13px` | 1.3 | Only the proposal label |

Headings use `text-wrap: balance`. Paragraphs use `text-wrap: pretty` and a max measure of 62ch.

### 2.4 Spacing, grid, radii, layers

- **Spacing** is a 4px base: `--s1 4, --s2 8, --s3 12, --s4 16, --s5 24, --s6 32, --s7 48, --s8 64, --s9 96, --s10 144` (px).
- **Section padding (block):** `clamp(96px, 13vw, 184px)`.
- **Gutter:** 16px up to 600px; `clamp(16px, 4vw, 56px)` above.
- **Grid:** 12 columns, 24px column gap, content max-width 1360px, centred.
  - 961–1179px keeps 12 columns.
  - 601–960 uses 6 columns.
  - 600 and below uses 4 columns with a 12px gap.
- **Breakpoints:**
  - phone ≤ 600
  - tablet 601–960 (mobile header and menu)
  - compact desktop 961–1179
  - desktop ≥ 1180
  - mobile booking bar ≤ 760
- **Radii:** 0 everywhere. The only exception is buttons at 2px. No pills, cards, glass or soft shadows.
- **z-index:**

| Layer | z-index |
|---|---|
| Content | 2 |
| Sticky stages | 3 |
| Vignette | 40 |
| Esta noche section | 45 |
| Menu | 49 |
| Header | 50 |
| Mobile bar | 60 |
| Toast | 70 |
| Cookie strip | 85 |
| Legal sheet | 92 |
| Skip link | 100 |

### 2.5 Motion tokens

| Token | Value | GSAP equivalent | Use |
|---|---|---|---|
| `--e-light` | `cubic-bezier(.45,0,.25,1)` | `power2.inOut` | light and exposure changes |
| `--e-out` | `cubic-bezier(.16,1,.3,1)` | `expo.out` | reveals |
| `--e-soft` | `cubic-bezier(.37,0,.63,1)` | `sine.inOut` | dimming, pools |
| n/a | n/a | `power3.out` | dial marker glide |
| n/a | n/a | `none` | scrubs (smoothing via `scrub: 0.8`) |

**Durations:**
- micro (hover) .2s
- lamp on .45s
- reveal .9s
- slow 1.2s
- intro 1.6s (hard stop 2.2s)

**Keyframes "encender"** (a lamp switching on, used everywhere a bulb lights):
```css
@keyframes encender { 0%{opacity:0} 14%{opacity:.3} 32%{opacity:.3} 100%{opacity:1} }
/* .45s linear, forwards. It runs once and never loops or flickers again. */
```

**Nothing bounces:** no `back` or `elastic` eases anywhere.

### 2.6 Components

**Primary button "Reservar mesa"** (`.btn-luz`):
- Jost 500 16px, +.02em, sentence case, Carbón text on `--luz-rest`, radius 2px, `padding: 14px 22px`, `min-height: 48px`, ↗ SVG.
- Hover or focus-visible: background → `--luz`, `box-shadow: 0 0 40px rgba(255,244,224,.25)`, .2s. The arrow does not move and there is no fill slide.
- Active: `box-shadow: none`.
- This is the only filled button on the page.

**Secondary button** (`.btn-line`):
- Transparent, 1px `--cordel` border, Ajo text, radius 2px, same size.
- Hover: border and text → Luz, plus the same halo at 12%.
- Used for "Enviar consulta" and the cookie buttons.

**Text link** (`.tlink`):
- Ajo text, `text-decoration: underline 1px var(--cordel)`, offset 5px.
- Hover: text and underline → Luz, plus `text-shadow: 0 0 18px rgba(255,244,224,.35)`.
- No wipe.

**Copy button** (`.copy`):
- Text button "Copiar", Jost 500 15px, with the same underline as the text link.
- `aria-label="Copiar el teléfono 932 22 77 38"`.
- Minimum 44×44 hit area, using padding.

**Focus:** `outline: 2px solid var(--luz); outline-offset: 3px`, on every focusable element. Never removed.

**Visually hidden:** `.sr` uses the standard clip pattern.

### 2.7 The lamp emblem (one SVG symbol, used everywhere)

Define once in a hidden sprite: `<svg width="0" height="0" style="position:absolute" aria-hidden="true"><defs>…</defs></svg>`. Draw it with care, because it appears in nine places.

- **`#lamp`**, `viewBox="0 0 48 60"` (enamel dome pendant):
  - Canopy and cord stub: `<rect x="22.5" y="0" width="3" height="18" fill="var(--piedra)"/>`, a 1.2px cord drawn as a thin rect so it survives scaling, plus a cap `<rect x="20.5" y="16" width="7" height="5" rx="1" fill="#57514B"/>`.
  - Dome: `<path d="M5 44 C5 32.5 12.5 23.5 24 22.5 C35.5 23.5 43 32.5 43 44 Z" fill="var(--humo)" stroke="var(--piedra)" stroke-width=".8"/>`.
  - Rim highlight on the upper-left of the dome: `<path d="M10.5 36 C12.5 30 16.5 26.5 22 25.6" fill="none" stroke="var(--ajo)" stroke-width=".8" opacity=".45"/>`.
  - Inner rim: `<ellipse cx="24" cy="44" rx="19" ry="2.6" fill="none" stroke="var(--rim, var(--ceniza))" stroke-width="1.1"/>`. The lit state sets `--rim: var(--luz)`.
  - Bulb: `<circle cx="24" cy="46.2" r="4" fill="var(--lamp-col)" style="opacity:var(--bulb,1)"/>`, plus an unlit outline `<circle cx="24" cy="46.2" r="4" fill="none" stroke="var(--piedra)" stroke-width=".8"/>` that shows when `--bulb` < .5.
  - Halo: `<circle cx="24" cy="47" r="15" fill="url(#halo)" style="opacity:calc(var(--bulb,1) * .7)"/>`, where `#halo` is a radialGradient from `--lamp-col` at .55 alpha to 0. This is a gradient, not `feGaussianBlur`, so it stays crisp at 16px.
- **`#lamp-mini`**, `viewBox="0 0 24 20"` (for 16–20px uses: header status, mobile bar, FAQ items, footer): the dome, rim and bulb only, simplified. Dome `M2 13 C2 7 6.5 3 12 3 C17.5 3 22 7 22 13 Z`, bulb `circle(12,14.4,2.4)`.
- **`#lamp-bar`**, `viewBox="0 0 320 40"` (the pass lamp): two cords at x=40 and 280 from y=0 to 22, a body `<rect x="10" y="22" width="300" height="10" fill="var(--humo)" stroke="var(--piedra)" stroke-width=".8"/>`, and an underside light strip `<rect x="18" y="31" width="284" height="2.5" fill="var(--lamp-col)" style="opacity:var(--bulb)"/>`.
- **Use:** `<svg class="lamp" style="--bulb:1"><use href="#lamp"/></svg>`. CSS custom properties inherit into `<use>`.
- **Long cords from the viewport or section top** are separate 1px Piedra lines, with an `<i class="cord">` element per lamp at 60% opacity.

---

## 3. Global build rules

### 3.1 Boot and "readable at rest"

1. **The CSS default is the final, fully lit, fully visible state for everything.** No JS, no GSAP or reduced motion means a complete static page.
2. **Inline boot script**, placed before the markup:
   ```js
   document.documentElement.lang="es";
   var R=matchMedia("(prefers-reduced-motion: reduce)").matches;
   document.documentElement.classList.add("js"); if(!R) document.documentElement.classList.add("pre");
   ```
   `.pre` puts only the hero and the header into their dark pre-intro state (7.1). Every element that has a pre-state carries the class `.intro-dark`: the header, the bulb and halo, the pool, `#hero-plate`, the H1, the sub, the status line, the actions and the fact line. The proposal label never does. There is a pure-CSS safety net:
   ```css
   .pre .intro-dark { animation: intro-safety 0s 2.2s forwards; }
   @keyframes intro-safety { to { opacity:1; filter:none; -webkit-mask-image:none; mask-image:none; } }
   ```
   The main script removes `.pre` in the same frame in which it `gsap.set`s the equivalent inline from-states, which removes the CSS animation so it can never override later GSAP styles. If GSAP is missing, it removes `.pre` immediately. The CSS safety net only matters if the main script never runs.
3. **Once-reveals** ("arming"):
   - The main script runs `arm()` once, after `document.fonts.ready` or after 600ms, whichever comes first.
   - It adds `.is-armed` only to `.rv`, `.rv-lum` and `.rv-focus` elements whose `getBoundingClientRect().top > innerHeight`.
   - An IntersectionObserver (`rootMargin: "0px 0px -12% 0px"`) removes `.is-armed` once, and CSS transitions do the reveal.
   - Stagger uses `style="--i:n"` → `transition-delay: calc(var(--i) * 60ms)`.
   - A safety pass at 3s after arming reveals any armed element whose top is < innerHeight.
   - Elements above the fold are never armed.
4. **Reveal classes** (the only three):
   - `.rv`: armed `opacity:.35` → 1, .9s `--e-out`.
   - `.rv-lum`: armed `color: var(--piedra); opacity:.5` → its own colour, opacity 1, .9s. Used for text that "comes into the light".
   - `.rv-focus`: armed `opacity:.3; filter: blur(6px); transform: scale(1.015)` → none, 1.1s `--e-out`.
     - Phones (≤600): blur 4px.
     - Skip the blur entirely when `navigator.hardwareConcurrency <= 4` or `navigator.deviceMemory <= 4`, and use `.rv` instead.
     - Allowed only on the H1 name line, section H2s at display size and El pase dish names. The Esta noche headline uses the mask exposure (5.5) instead.
     - Everything else (body, carta items, quotes, FAQ answers, form fields) uses `.rv` or `.rv-lum`.
   - `will-change` is set only while armed.
5. **Masks and filters always end clean.** Every mask or filter used by an animation ends as `mask-image: none; -webkit-mask-image: none; filter: none` (set inline at timeline end). Always write both `-webkit-mask-image` and `mask-image`.
6. **GSAP is optional at runtime.** Wrap all GSAP work in `if (window.gsap && window.ScrollTrigger)`. Without GSAP, the following still work, using IntersectionObserver:
   - status, menu, FAQ, form, copy and carta calls;
   - static engravings;
   - sticky-stage scene switching.

### 3.2 Reduced motion (`prefers-reduced-motion: reduce`)

- No `.pre`: no intro, no vignette, no scrubs, no blur, no masks, no lamp keyframes, no gobo parallax.
- `html{scroll-behavior:auto}`, and all CSS transitions are ≤ .01s.
- Shaders render one designed static frame per scene. The haze gets one frame.
- Sticky stages still switch scenes when a caption crosses the centre (IntersectionObserver), instantly and fully lit.
- The live status, countdowns and dial still update every second, because they are information, not decoration. The dial marker jumps rather than glides.

### 3.3 Performance

- **At most two live WebGL contexts:**
  - `haze`: WebGL1, hero, re-parented to Esta noche.
  - `engrave`: WebGL2, re-parented between the Platos and Allioli stages; it also bakes the hero plate.
- **Render on demand.** Canvases render only when a uniform changes, through one rAF loop per context with a dirty flag.
- **Pause** on `document.hidden` and when the host is off-screen (IntersectionObserver with `rootMargin: 25%`).
- **Handle `webglcontextlost`:** call `preventDefault()`, show the fallbacks (5.6), and rebuild on `webglcontextrestored`.
- **ScrollTrigger:** `ScrollTrigger.config({ ignoreMobileResize: true })`, and call `ScrollTrigger.refresh()` after `document.fonts.ready` and after the engraving init. Never use `normalizeScroll`.
- **Sticky, not pinned.** Sticky stages use CSS `position: sticky`, with no GSAP pin. Never put `overflow: hidden` on an ancestor of a sticky element; use `overflow: clip` for cone and pool containment.
- **Filters** apply only to headings and small SVGs. No `backdrop-filter` anywhere.
- **Budget:** CSS + JS + markup + legal kit together stay under 300KB.

---

## 4. The light system

### 4.1 Hours, live status, heat and demo

Copy Option A's logic exactly (`/home/user/idk/gallioli/index.html` lines 1060–1080) and extend it:

```js
const DAYS=["Domingo","Lunes","Martes","Miércoles","Jueves","Viernes","Sábado"];
const L=[750,960], D=[1200,1380];
const HOURS={0:[L],1:[],2:[L],3:[L,D],4:[L,D],5:[L,D],6:[L,D]};
let demo=null; // {day,min0,t0}: simulated clock for showing the lit state
function now(){ if(demo){ const e=Math.floor((Date.now()-demo.t0)/1000), t=demo.day*86400+demo.min0*60+e;
  return {day:Math.floor(t/86400)%7, min:Math.floor(t%86400/60), sec:t%60}; }
  /* else A's Intl.DateTimeFormat("en-GB",{timeZone:"Europe/Madrid",…}) code, including %24 on the hour */ }
function status(){ /* A's code verbatim: {open,text,short,left,label,day} */ }
const heat=s=> s.open?1:0.2+0.7*(1-Math.min(1,(s.left/60)/240));   // graft from Luz de brasa
function closingHead(n){ const t=HOURS[n.day];
  if(t.some(([a,b])=>a>=1200&&n.min<b)) return "Tu mesa, esta noche.";
  if(t.some(([a,b])=>n.min<b)) return "Tu mesa, hoy.";
  for(let k=1;k<8;k++){ const d=(n.day+k)%7; if(HOURS[d].length) return k===1?"Tu mesa, mañana.":"Tu mesa, el "+DAYS[d].toLowerCase()+"."; } }
const fmt=(s,sec)=>{const h=Math.floor(s/3600),m=Math.floor(s%3600/60),x=s%60;
  return (h?h+" h ":"")+(h?String(m).padStart(2,"0"):m)+" min"+(sec?" "+String(x).padStart(2,"0")+" s":"");};
```

**`tick()` runs every 1s** and sets:
- `:root` `--heat` and `--lamp-col`, where `--lamp-col` = the hex mix from 2.1.
- Every `[data-status="text"]` → `s.text`. Every `[data-status="short"]` → `s.short`. Every `[data-status="word"]` → "Abierto" or "Cerrado".
- Every `.lamp[data-status-lamp]`:
  - `--bulb` = `s.open ? 1 : 0.15 + 0.5*(heat-0.2)/0.7`;
  - `--rim` = Luz when open, Ceniza when closed;
  - a `.is-open` class.

  The change between states is a .6s CSS transition on opacity and stroke. There is no pulse or ping.
- Hours that are marked to verify stay as they are. A's README says to verify them; that is a note for Alex, not a UI change.

**Demo override** (graft from Claroscuro):
- At load, read `location.hash` or `location.search` for `luz=abierto`, which sets `demo={day:5,min0:1274,t0:Date.now()}` (Friday 21:14), or `luz=cerrado`, which sets `{day:1,min0:600,…}` (Monday 10:00).
- The footer has a text button (section 6.12) that toggles the "abierto" demo on and off, because a hash cannot be typed inside the Artifact viewer.
- The hash is read once and not kept in sync, so anchor links do not break it. The legal kit ignores `luz=…` hashes because they are not in its map.

### 4.2 Pools, cones and texture (light must always land on a surface)

**Texture** ("yeso y lino"), generated once at boot in JS, with no SVG filters:
- A 256×256 canvas holding a tileable 4-octave value-noise heightmap. Wrap coordinates with modulo, and use seed 7.
- Normals come from central differences. Shade with Lambert: `shade = .5 + .5*dot(n, normalize(-.5,.6,.62))`.
- Map to grey 104–152, add a 1px fibre streak layer (2 extra octaves stretched 6:1 in x at 20% weight), and output `toDataURL("image/png")`.
- Set it as `--tex: url(...)` on `:root`.
- Before generation, and without JS, pools use a flat colour.

**Pool** (`.pool`, an absolutely positioned element):
```css
.pool{ background-color:#2E2925; background-image:var(--tex),
       radial-gradient(ellipse at 50% 50%, rgba(199,154,107,.08), transparent 70%);
       background-size:256px 256px, 100% 100%; background-blend-mode:soft-light, normal;
       -webkit-mask-image:radial-gradient(ellipse 50% 50% at var(--px,50%) 50%, #000 0 42%, rgba(0,0,0,.55) 60%, transparent 71%);
       mask-image:(same); opacity:var(--pool-o,1); }
```
- A pool is always elliptical, with a width:height of about 3.2:1 on a floor or table and 1.4:1 on a wall.
- A pool is always directly under a drawn lamp, with a cone connecting them.
- Its peak brightness never exceeds `--pool`.
- It never breathes, pulses or loops.

**Cone** (`.cone`, CSS):
```css
.cone{ clip-path:polygon(46% 0,54% 0,100% 100%,0 100%);
       background:linear-gradient(to bottom, color-mix(in srgb, var(--lamp-col) 12%, transparent), color-mix(in srgb, var(--lamp-col) 3%, transparent));
       -webkit-mask-image:linear-gradient(to bottom,#000 55%,transparent); mask-image:(same);
       opacity:var(--cone-o,1); }
```
- Fallback without `color-mix`: `rgba(255,244,224,.10)` → `.03`.
- The apex sits at the bulb, and the base spans the pool width.
- Rotate the cone with `transform: rotate()` around its top centre when the pool is not directly below the lamp.
- The hero and Esta noche use the WebGL haze instead, with the CSS cone as its fallback.

### 4.3 Plant cast shadows (La sala only; graft from Claroscuro)

The room's defining feature (the "hermosas plantas naturales" in the reviews) appears only as shadows inside the lamp pools. It is never drawn as leaves.

- **Generation.** `gobo(seed, kind)` builds an inline SVG (`viewBox 0 0 600 300`, fill Carbón) with a seeded PRNG (mulberry32):
  - **Pothos:** a cubic Bézier vine drooping from the top edge. At 9–13 points along it, add a heart-shaped leaf of 18–34px, rotated alternately ±(35–60°) from the stem normal. Heart path, pointing down: `M0 0C-10-6-18 6-10 16C-6 22 0 26 0 30C0 26 6 22 10 16C18 6 10-6 0 0Z`. The stem is a 2px stroke.
  - **Kentia palm:** an arched quadratic rachis entering from one side. Leaflets are tapered ellipses 40–70px long and 5–7px wide, alternating on both sides at 55° to the rachis, getting shorter toward the tip.
  - **Ficus:** 3–4 thin branching strokes, with clusters of 4–6 small pointed ovate leaves (`rx 9, ry 4`, plus a tip point).
  - **Never a monstera** (that is Option A's leaf) and never outlines.
- **Layers.** Each pool gets two layers:
  - far: blur 10px, opacity .45, scale 1.1;
  - near: blur 7px, opacity .55.

  Both use `mix-blend-mode: multiply`, sit inside the pool element, and are clipped by the pool's mask.
- **Assignment:** lamp 1 = pothos, lamp 2 = palm, lamp 3 = ficus.
- **Parallax** is desktop only and scrubbed across the section: near layer y 0 → −28px, far layer 0 → −12px. It is off under reduced motion.

---

## 5. Imagery system (no photos)

Four techniques, one light logic.

### 5.1 The engraving engine ("esgrafiado"), WebGL2, one context

**Architecture: G-buffer bake plus a cheap shading pass.**
- The geometry is static per dish, so raymarch it once per dish into a G-buffer. Each scroll frame then runs only a per-pixel shading and hatching pass.
- Scenes switch only in darkness, so the bake happens while the stage is black.
- Result: scrubbing costs one texture read per pixel, and the heavy pass runs about 5 times per visit.

**Pass A: raymarch into the G-buffer.**
- Target: MRT with 3 × `RGBA8` textures. These are always renderable in WebGL2 and need no float extension.
  - `T0` = normal.xyz × .5 + .5, material id / 7.
  - `T1` = world x and y packed as 16-bit.
  - `T2` = world z as 16-bit, AO, and coverage (1 = object or plate, 0 = background).
- Pack a value `v∈[0,1]` (world coordinate `(p+2)/4`) as `hi=floor(v*65535/256)/255`, `lo=mod(floor(v*65535),256)/255`, and unpack the same way.
- **Render in 4 horizontal scissor bands on 4 consecutive frames**, so no single frame hitches.
- Resolution: the canvas CSS size × `dprE`:
  - `dprE = min(devicePixelRatio, 1.5)` on desktop and `min(devicePixelRatio, 2)` on phones, per the mustFix for crisp lines on phones;
  - step down adaptively (below).
- March settings: 64 steps (48 on phones), epsilon .0008 × t, max distance 9. Early-out when the ray misses the bounding sphere (centre `(0,.22,0)`, r 1.28): coverage 0, and the background writes nothing.
- **AO:** 3 taps along the normal at .04, .09, .15, `ao = clamp(1 - Σ(dᵢ - sdf(p + n·dᵢ))·(1/2^i)·6, 0, 1)`.
- **Camera:**
  - target `(0,.18,0)`, elevation 35°, azimuth 0 (camera on +z), vertical FOV 30°;
  - distance chosen so the plate diameter (2.0) spans 82% of the canvas width: `dist = (2.0/0.82) / (2*tan(fov/2)*aspect)`, clamped to at least 3.2;
  - never top-down.

**Pass B: shading and hatching** (per frame, to the canvas, with premultiplied alpha):
- **Uniforms:** `uLightAz`, `uLightEl`, `uL` (0..1), `uDensity`, `uCam`, `uTarget`.
  - The key light is a spot at distance 3.2 from the target along (az, el), aimed at the target.
  - `spot = smoothstep(cos(34°), cos(18°), dot(normalize(p - Ls), axis))`.
  - `att = 1/(1 + .15·d²)`.
- **Diffuse** is `max(dot(N,Ld),0)`. For sauce use wrap diffuse `(dot + .3)/1.3`.
- **Specular** is Blinn `pow(max(dot(N,H),0), shin) · ks`, per material (table below).
- **Rim** is pollo only: `.25 · pow(1 - dot(N,V), 3) · uL`.
- **Intensity:** `I = uL·1.25·spot·att·(diff·albedo·mix(.55,1,ao) + spec) + .015`.
- **Line density:** `uDensity = (canvasCssHeight / (2·dist·tan(fov/2))) / pitchCss`, where `pitchCss` is **3.5 on desktop and 3.0 on phones**. Pitch is fixed in CSS px and is independent of DPR.
- **Line phase by material:**
  - PLATE: `length(p.xz) * uDensity` (concentric engraved rings);
  - food: `dot(p, normalize(vec3(.25,1.,.3))) * uDensity + .35*vnoise(p*3.)` (contours that bend over the form, like a burin);
  - SAUCE: `dot(p, normalize(vec3(0.,1.,.6))) * uDensity * 1.2`;
  - cross-hatch (all): `dot(p, normalize(vec3(1.,.15,-.6))) * uDensity * .9`.
- **Hatch function:**
  ```glsl
  float hatch(float ph, float w){ float tri=abs(fract(ph)-.5)*2.;            // 1 on the line centre
    float aa=clamp(fwidth(ph)*2.,.001,.5); return w<.01?0.:smoothstep(1.-w-aa,1.-w+aa,tri); }
  float w1=clamp(pow(I,.8),0.,1.)*.92, w2=clamp((I-.55)/.45,0.,1.)*.85;
  float ink=max(hatch(ph1,w1), hatch(ph2,w2));   // SAUCE: if(I>.9) ink=mix(ink,1.,smoothstep(.9,1.1,I));
  ```
- **Line colour by material:**
  - PLATE: `mix(Piedra, Ajo, I)`;
  - CRUST, BONIATO, SKIN: `mix(Tostado, Ajo, smoothstep(.55,1.,I))`. Mid-tones read toasted and highlights read white, per the "appetite" mustFix;
  - SAUCE: Luz;
  - BONE: Ajo.
- **Output:**
  - `col = mix(Carbón, lineCol, ink)`, clamped so it is never darker than Carbón;
  - dither: `+ (hash(gl_FragCoord.xy) - .5)/255.`;
  - `alpha = coverage`, premultiplied.

  Background pixels are transparent, so the DOM pool under the canvas shows through. There is no table plane in the shader.

**Materials:**

| id | Material | albedo | ks / shin | Notes |
|---|---|---|---|---|
| 1 | PLATE | .6 | .4 / 64 | cylinder and rim torus |
| 2 | CRUST | .78 + .22·fbm(p·9) | .25 / 24 | croquetas, chicken |
| 3 | BONIATO | .85 | .15 / 16 | salt specks: `I += .5` where `hash3(floor(p*90)) > .985 && N.y > .5` |
| 4 | SKIN | .55 × char bands | .6 / 48 | pollo, lacquered |
| 5 | SAUCE | .95 | 1.0 / 96 | allioli dollop: the only sharp specular |
| 6 | BONE | .9 | .3 / 32 | knobs |

**SDF primitives:** the standard IQ set (`sdCappedCylinder`, `sdTorus`, `sdCapsule`, `sdRoundBox`, `sdEllipsoid`, polynomial `smin`), plus `vnoise` / `fbm3` (3D value noise).
- Plate: `sdCappedCylinder(p-(0,.03,0), 1.0, .03)` ∪ `sdTorus(p-(0,.075,0), (.93,.035))`.
- The plate top is at y≈.06.

**Scenes** (world units, y up; tweak for no interpenetration and check screenshots):

| # | Scene | Geometry |
|---|---|---|
| 0 | Hero plate (baked once) | Scene 1 with the dollop moved to (.36, *, −.10), so the sauce sits near the centre-right. |
| 1 | Croquetas Gallitos | 3 capsules, half-length .24, r .155, y scaled ÷.92 (flattened). Centres and yaws: (−.30,.215,.10) yaw 18°; (.08,.215,−.16) yaw −32°; (.30,.215,.28) yaw 75°. Crust `d -= .010*fbm3(p*24)`. Allioli dollop: spheres (.50,.15,−.34) r .12, (.49,.25,−.33) r .085, (.47,.32,−.32) r .045, smin k .07. |
| 2 | Gallitos Fried Chicken | 3 pieces, each an smin (k .12) of 4 spheres, r .12–.24, around (−.28,.23,.05), (.25,.22,−.20) and a drumstick at (.18,.20,.32): capsule r .15 plus a BONE capsule r .035 and a knob r .05. Crags: `d -= .03*ridge(p*6.5) + .008*vnoise(p*28)`, where `ridge = (1-abs(2n-1))²` fbm3. Multiply the march step by .65 for this scene. |
| 3 | Patatas de boniato | 7 `sdRoundBox` half (.06,.055,.40) r .022 in a loose pile. Centre and yaw/pitch: (−.20,.12,0) 12°; (.02,.12,.10) −20°; (.18,.12,−.12) 40°; (−.05,.23,−.05) −55°/6°; (.10,.24,.05) 75°/−5°; (−.30,.12,−.30) 80°; (.30,.12,.30) −70°. |
| 4 | Pollo al carbón | Body ellipsoid (.50,.30,.38) at (−.05,.33,0), yaw 25°. Legs: capsules (.25,.28,.18)→(.52,.18,.36) r .11 and (.20,.26,−.20)→(.46,.17,−.34) r .10, smin k .12, with BONE knobs r .055. Wing ellipsoid (.14,.06,.20) at (−.30,.36,.30). Two potato wedges (roundBox (.09,.05,.22) r .03). Skin `d -= .005*vnoise(p*16)`. Char bands: `g=fract((p.x*.866+p.z*.5)*6.5); albedo *= mix(.25,1.,smoothstep(.08,.2,g))`. **Keep it half in shadow:** its key light runs at elevation 28°, azimuth −55°→+25°, and the rim, the specular and the grill bands carry the form. |

**Quality gate (mustFix).**
- Screenshot every dish at 360px (DPR 1 and 2) and at 1440px.
- If a dish reads as a blob or clay, simplify the geometry, raise the line density contrast, and keep it more in shadow.
- If it still fails, ship that dish's typographic plate (5.6) instead.
- Never ship an unconvincing engraving.

**Adaptive quality.**
- While a stage is scrubbing, measure the mean of 10 consecutive rAF intervals.
- If it is over 24ms, step `dprE` down (2 → 1.5 → 1) and re-bake the G-buffer during the next dark window.
- If it is still over 24ms at DPR 1, switch to **stills mode**:
  - from the current G-buffer, pre-shade 3 frames at az −40°, 0° and +40° with L=1 into three 2D canvases, with `drawImage` called right after the draw;
  - crossfade them by az weight;
  - apply L as CSS opacity on the stack.

**Hero bake.**
- At boot, size the engrave canvas (detached from the DOM) to the hero plate's CSS size × DPR × 1.5.
- Bake scene 0 and shade it at az −15°, el 62°, L 1.
- Immediately `drawImage` it, downscaled, into the 2D canvas `#hero-plate`. The downscale gives anti-aliasing.
- Then free the canvas for the stages.

### 5.2 Allioli macro (same context, second program, no raymarch)

A 2D heightfield shader fills the Allioli stage. It shows the sauce surface filling the frame, with only a hint of the bowl rim at the top. There is no mortar, pestle, drops or equation.

- **Coordinates:** `uv ∈ [0,1]²`, aspect-corrected. Centre `c=(.52,.58)`, `r=length(uv-c)`, `θ=atan(uv-c)`.
- **Height:**
  - `h = -.25*r²`
  - `+ uGrain*.018*(pow(vnoise(uv*48),3.)*.9 + fbm(uv*14)*.3)`
  - film mask `f = smoothstep(uEdge-.12, uEdge+.12, uv.x*.8+uv.y*.2)`, then `h = mix(h, h*.25 + (-.25*r²)*.75, f*uFilm)`
  - `+ uSpiral*.012*smoothstep(.2,1.,sin(26.*r + θ - uTwist))*smoothstep(.62,.1,r)`
- **Normal** from finite differences (eps = 1/canvasHeight, gain 60).
- **Light:**
  - `diff = max(dot(n,Ld),0)`
  - `gloss = mix(10,140,uFilm)`
  - `spec = pow(max(dot(n,H),0), gloss)*mix(.15,1.2,uFilm)`
  - `I = uL*(.55*diff + spec)*(1 - smoothstep(.55,.75,r)) + uBind*.9*(1 - smoothstep(.5,.7,r))`
- **Lines:**
  - `ph1 = (uv.y*aspect + h*9.)*uDensity`
  - `ph2 = (uv.x + uv.y*.3 - h*6.)*uDensity*.9`
  - `w1 = pow(I, mix(.85,.55,uThick))`
  - line colour `mix(Ajo, Luz, uFilm)`
- **Rim hint:** a Piedra ring of lines at r≈.66, visible only for `uv.y > .8`.
- **Output** is opaque, with the Carbón black level and dither.
- **Highlight position for the word mask:** computed on the CPU as `c + .18*(sin(az), -cos(az)*.6)`, in stage percent. It is written to `--hx` and `--hy`.

**Step parameters.** Section progress P goes from 0 to 1 over the four steps. Interpolate between the rows with smoothstep inside each segment:

| P | Step | uGrain | uFilm | uEdge | uSpiral | uTwist | uThick | uBind | uL | az / el |
|---|---|---|---|---|---|---|---|---|---|---|
| 0.00 | Ajo | 1 | 0 | −.3 | 0 | 0 | 0 | 0 | .55 | −35° / 40° |
| 0.25 | Ajo → Aceite | 1 | 0 | −.3 | 0 | 0 | 0 | 0 | .70 | −30° / 40° |
| 0.50 | Aceite → Paciencia | .5 | 1 | 1.3 | 0 | 0 | .2 | 0 | .90 | +10° / 45° |
| 0.75 | Paciencia → Final | .1 | 1 | 1.3 | 1 | 3π | .8 | 0 | 1 | +10° / 50° |
| 1.00 | Final | 0 | 1 | 1.3 | 1 | 4π | 1 | 1 | 1 | +10° / 55° |

Between .25 and .5 the film edge sweeps across the frame and the highlight slides. `uTwist` increases with P only, so it turns one way as you read forward. At the final step the lines merge into near-solid Luz: the brightest render on the site.

### 5.3 Haze shader (hero, re-parented to Esta noche), WebGL1

- **Uniforms:** `uRes`, `uBulb` (px), `uDir` (unit vector), `uHalf` (half-angle, rad), `uLen` (px to the pool centre), `uLight`, `uDensity`, `uTime`.
- **Fragment:**
  - `v = frag - uBulb`
  - `a = dot(v,uDir)`
  - `ang = atan(length(v - a*uDir), a)`
  - `cone = step(0.,a)*smoothstep(uHalf, uHalf*.55, ang)*smoothstep(uLen*1.15, uLen*.7, a)*smoothstep(0.,40.,a)`
  - `n = fbm4(frag/uRes.y*3. + vec2(0., -uTime*.02))`
  - `haze = cone*(.35 + .65*n)*uLight*uDensity/(1. + a/uLen)`
  - colour `= mix(vec3(.165,.149,.133), tostado, .10)*haze*1.6`, capped at `--haze` brightness
  - bulb core: `+ lampCol*exp(-dot(v,v)/(2.*18.*18.))*uLight`
  - dither
- **Canvas:** `mix-blend-mode: screen`, half resolution, 30fps cap. It moves only through `uTime`, and only while in view.
- **Reduced motion:** one frame at `uTime = 0`.
- **Fallback:** a CSS `.cone` element plus a bulb halo.

### 5.4 Contact shadow

Under each baked or live plate, a dark ellipse (`radial-gradient(ellipse, rgba(0,0,0,.7), transparent 70%)`, 80% of the plate width, 12% of its height) sits between the pool and the canvas. It is a shadow, not a glow.

### 5.5 Type as image

Large Bodoni set pieces are exposed by a radial mask centred on a visible lamp:

```css
-webkit-mask-image: radial-gradient(circle at var(--mx) var(--my), #000 calc(var(--r) - 240px), transparent var(--r));
mask-image: (same);
```

- JS computes `--mx` and `--my` in px, relative to the element, from the bulb's bounding box.
- It tweens `--r` from 0 to (the distance to the farthest corner + 240px).
- At the end it removes both masks.
- Used on: the H1 (intro), the "Gallioli" headword (Allioli final step, scrubbed) and the Esta noche headline (once).

### 5.6 Fallbacks

**Typographic plate** (from A media luz). Used when there is no WebGL2, the context is lost, a dish fails the quality gate, or a stage runs without JS:
- a `.plate-type` block in the stage showing the dish name (or "allioli") in Bodoni italic 400 `clamp(3rem,7vw,7rem)`, Ajo;
- lit by `mask-image: radial-gradient(ellipse 60% 55% at 50% 18%, #000 40%, rgba(0,0,0,.35) 78%)` under the lamp;
- `opacity` follows L.

It is also shown in the hero pool if the hero bake fails, reading "croquetas y allioli".

---

## 6. Sections, in order

Each section below lists: id · content · desktop layout · 360px layout · motion · state at rest.

"At rest" always means fully visible and lit. The motion described is the enhancement.

### 6.0 `cabecera` (header, fixed)

- **Content:**
  - skip link "Saltar al contenido" (→ `#contenido`);
  - wordmark "Gallioli" in Bodoni italic 500 24px, `aria-label="Gallioli Bistrot, inicio"`, linking to `#inicio`;
  - nav in Jost 500 16px Piedra: La sala (`#sala`) · Platos (`#platos`) · Carta (`#carta`) · Reseñas (`#sobremesa`) · Visítanos (`#visita`);
  - status: `#lamp-mini` (18px, `data-status-lamp`) plus `data-status="text"` in Jost 500 14px Ajo;
  - `.btn-luz` "Reservar mesa ↗" in a compact size (padding 10px 16px, min-height 40px), `data-loc="cabecera"`.
- **Layout:**
  - 64px tall; at 961–1179 the status shows only `data-status="word"`.
  - At the top of the page the background is transparent.
  - After 80px of scroll: background `rgba(13,12,11,.94)` plus a 1px Ceniza bottom hairline, .35s fade. There is no blur, and the header never hides.
- **≤960px:**
  - 56px tall: wordmark, the lamp-mini plus `data-status="word"`, and a text button "Menú" / "Cerrar" (Jost 500 15px, min 44×44, `aria-expanded`, `aria-controls="menu"`).
  - No burger icon and no round button.
- **Motion:** during the intro the header sits at opacity .35 and ends at 1. The status lamp crossfades lit and unlit.
- **Interaction:**
  - nav hover and focus: Piedra → Luz, with `text-shadow: 0 0 18px rgba(255,244,224,.35)`, .2s, no underline;
  - the active section's nav item is Ajo (IntersectionObserver on sections).

### 6.1 `inicio` (hero): "Al carbón, a media luz."

**Content, in DOM order:**
1. Proposal label: `<p class="proposal">Propuesta de diseño · No es la web oficial</p>`. Jost 500 13px Ajo, 1px Cordel border, padding 5px 10px, radius 0.
2. `<h1>`:
   - `<span class="h1-name">Gallioli Bistrot</span>` (`--t-name`);
   - `<span class="h1-big">Al carbón,<br>a media luz.</span>` (`--t-hero`, Ajo).
3. `<p class="hero-sub">`, Jost 400 18px Ajo, max 34ch: "Bistrot de barrio en Sant Gervasi. Pollo al carbón, croquetas y el allioli de la casa: en la sala, para recoger o a domicilio." This is a new line; every fact in it comes from A.
4. Status line: the `#lamp-mini` glyph (20px, `data-status-lamp`) plus `data-status="text"` (Jost 500 15px Ajo, tabular-nums).
5. Actions: `.btn-luz` "Reservar mesa ↗" (`data-loc="portada"`) and a text link "Ver la carta ↓" (`#carta`, SVG down arrow).
6. Fact line (Jost 500 15px Piedra, one line, no strip or dividers): "4,8 en Google · 745 reseñas · 10–20 € por persona · Ronda del General Mitre, 220".
7. Imagery layers (aria-hidden), back to front:
   - `.pool` (hero)
   - contact shadow
   - `<canvas id="hero-plate">`
   - `<canvas id="haze">`
   - the lamp and cord SVG

**Desktop layout** (100svh, min-height 640px, `overflow: clip`):
- **Lamp:**
  - cord from the section top (under the header) at x = 70%;
  - dome width `clamp(120px, 10vw, 170px)`;
  - bulb at about 26% of the height.
- **Pool:** centre (70%, 78%), size 44vw × 13vw.
- **Hero plate canvas:** width `clamp(280px, 26vw, 460px)`, aspect 16:10, centre (70%, 74%).
- **Text block:**
  - bottom-left, starting at the left gutter, bottom padding 9svh, max-width 50vw;
  - order: proposal label, H1, sub, status, actions;
  - the fact line runs along the bottom edge at 3svh, left-aligned.
- **Text-safe rule:** the plate's left edge must sit ≥ 32px to the right of the H1's right edge at 1024, 1280, 1440 and 1920px widths. Verify with `getBoundingClientRect` in tests. If it fails, move the lamp, pool and plate right, up to x = 74%.
- **Haze:** cone from the bulb to the pool centre, `uHalf` 20°.

**360×640 layout** (mustFix: the CTA must be visible without scrolling):

| Element | Position |
|---|---|
| Header | 56px |
| Proposal label | top 68px, left gutter |
| Lamp | x 78%, cord from 56px, dome 76px wide, bulb at y ≈ 150px |
| Pool | centre (60%, 222px), 300 × 72px |
| Plate canvas | 224 × 140px, centred on (60%, 206px) |
| Text | starts at y ≈ 262 |
| Name line | 22px |
| H1 big | 2 lines at 46px |
| Sub | Jost 16px, 3 lines |
| Status | one line |
| CTA | full width, 48px |
| "Ver la carta ↓" | below the CTA |
| Fact line | may fall below the fold; its facts are also in the sub and the status |

- **Acceptance:** at 360×640 the bottom of "Reservar mesa" is ≤ 600px, and nothing overflows horizontally.
- **Tablet:** as the phone layout, with a larger lamp and plate.

**Motion:** signature moment 1, "Se enciende la sala" (7.1). Scroll-out dim (scrubbed):
- ScrollTrigger on `#inicio`, `start: "top top"`, `end: "bottom top"`, `scrub: 0.8`;
- haze `uLight` 1 → .35, `uHalf` 20° → 13°, `uDensity` 1 → 1.4 (the smoke thickens, a graft from Luz de brasa);
- pool opacity 1 → .5;
- plate `filter: brightness(1 → .6)`, on the canvas only;
- content does not move or fade (no parallax).

**At rest:** fully lit, as described.

### 6.2 `sala`: "La sala"

**Content:**
- `<h2>` "La sala" (`--t-h2-small`, Bodoni italic 500, in the left margin, cols 1–2).
- Lead paragraph (`--t-lead`, cols 2–9), split into three `<span class="phr">`, one per lamp:
  1. "Un comedor pequeño y cálido,"
  2. "con una decoración cuidada y plantas naturales."
  3. "Funciona igual de bien para una cena tranquila en pareja que para una mesa larga con amigos."
- Marginal notes (cols 10–12), each a `<p>` with an italic Bodoni head (20px, 500) and Jost 15px Piedra text, set level with the word it annotates. Markers are `<sup>` in Jost 500 13px after the words "carbón", "km 0" and "llevar" in a second, shorter Jost 17px Ajo line under the lead: "Cocina al carbón,ᵃ producto km 0ᵇ y pedidos para llevar.ᶜ" (a new line; the facts are A's pillars).
  - a. **Al carbón:** "Pollo asado a la brasa, entero o para compartir, con sus patatas."
  - b. **Producto km 0:** "Producto fresco y de proximidad, cocina de temporada."
  - c. **Para llevar:** "Encarga por teléfono y recoge en unos minutos, o pídelo a domicilio."

**Desktop layout:**
- Three `#lamp` instances (80px wide) hang from the section top over columns 2, 6 and 10, with cord drops of 90, 150 and 120px.
- Each has a CSS `.cone` down to a wall pool (1.4:1, 26vw wide) behind the lead, with plant gobos inside (4.3).
- The pools must stay at or below `--pool` brightness behind the text.
- Section min-height 110svh.

**360px:**
- One lamp (lamp 2) centred-right, with its pool and palm gobo behind the lead.
- H2 above the lead.
- Lead at 1.6rem.
- Notes as a list (head in italic, then text) below the Jost line.

**Motion: "Las lámparas".** Triggered once, not scrubbed, to avoid the A/Marbar scroll-light-up tic.
- `ScrollTrigger.create({trigger:"#sala", start:"top 70%", once:true, onEnter:()=>tl.play()})`.
- `tl` runs lamp i at `i*0.35s`:
  - bulb `encender` (.45s);
  - `--cone-o` 0 → 1 (.6s sine.inOut);
  - pool opacity 0 → 1 (.8s);
  - `.phr[i]` colour Piedra → Ajo (.8s);
  - note i `.rv-lum`.
- Armed (lamps off, phrases Piedra) only if `#sala`'s top is > innerHeight at arm time. A safety timer completes `tl` 3s after arming if it has not started while in view.
- Gobo parallax is scrubbed (desktop).

**At rest:** three lamps lit, Ajo text, gobos visible.

### 6.3 `platos`: "Del pase, a la mesa." (signature moment 2, "El pase")

**Content:**
- H2 "Del pase, a la mesa." (`.rv-focus`) and the intro (Jost 18px Piedra): "Cuatro platos de la casa, uno a uno." (a new line).
- Four captions, `<article class="pase-step" data-dish="0..3">`, each with:
  - `<h3>` dish name (`--t-dish`, `.rv-focus`-style focus tied to light; see 7.2);
  - A's serif line in Bodoni italic 500 `clamp(1.3rem,1.7vw,1.6rem)` Ajo;
  - a fact line in Jost 500 15px Piedra;
  - a text link "Ver en la carta" that goes to the row and calls it (6.4).

| # | Dish | A's line (verbatim) | Fact line (from the carta) | Link → |
|---|---|---|---|---|
| 0 | Croquetas Gallitos | Cremosas por dentro, doradas por fuera. Las más nombradas de la casa. | Para picar · popular | `#plato-croquetas` |
| 1 | Gallitos Fried Chicken | El pollo frito de la casa, crujiente y jugoso, con una salsa que la gente recuerda. | Del pollo · popular | `#plato-fried` |
| 2 | Patatas de boniato | «Riquísimas», dicen. Dulces, crujientes y perfectas para acompañar. | Para picar | `#plato-boniato` |
| 3 | Pollo al carbón | A la brasa, con patatas. Listo en unos minutos si lo encargas para llevar. | Del pollo · también para llevar | `#plato-pollo` |

- The stage (aria-hidden) contains:
  - the `#lamp-bar` pass lamp at the top centre (60% of the stage width);
  - a `.pool` (3.2:1) on the "pass" at 62% of the stage height;
  - a contact shadow;
  - the engrave `<canvas>`;
  - four `.plate-type` fallbacks;
  - a caption under the pool, Jost 500 14px Piedra: "{dish name} · grabado". The word "grabado" states honestly that this is an illustration.
- A text-only equivalent is not needed, because the captions carry all the information.

**Desktop layout:**
- Grid: left 44% (steps), right 56% (stage).
- Stage: `position: sticky; top: 0; height: 100svh`.
- Intro block: about 50svh.
- `.pase-list` holds four steps, each `min-height: 110svh`, content vertically centred, max-width 30rem.
- After the last step, a text link "Ver la carta completa ↓" (`#carta`).
- No indices, counts, horizontal track or pin.

**360px:**
- The stage becomes `position: sticky; top: 56px; height: 46svh; z-index: 3; background: var(--carbon)`, with a 40px Carbón→transparent fade on its bottom edge.
- Steps are `min-height: 90svh`, content bottom-aligned with `padding-bottom: 8svh`, so each caption sits in the lower 54% while it is lit.
- Captions pass under the stage as they scroll up.
- **iOS test:** if sticky jitters in iOS Safari, fall back to stacked blocks: a baked still (lit, az 0) above each caption.

**Motion:** see 7.2. At rest (no JS, or reduced motion) the stage shows dish 0 statically lit, and each caption switches its dish via IntersectionObserver.

### 6.4 `carta`: "La carta"

The one deliberately centred moment: a printed carte lying in a lamp's pool.

**Content:**
- `<h2>` "La carta" (`--t-h2-small` enlarged to `clamp(2rem,3vw,2.6rem)`, Bodoni italic 400).
- Line (Jost 18px Ajo): "Todo se comparte en el centro de la mesa. Entre 10 y 20 € por persona." (a new line; the facts are A's "Platos pensados para poner en el centro de la mesa" and the price range).
- **Para picar:** Croquetas Gallitos *popular* · Patatas bravas · Patatas de boniato · Burrata · Arancini · Patatas fritas.
- **Del pollo:** Gallitos Fried Chicken *popular*, with "Pollo frito crujiente con la salsa de la casa." · Pollo al carbón, with "A la brasa, con patatas. También para llevar." · Alitas picantes *picante*.
- **Principales y postre:** Hamburguesa · Canelón · Pastel de queso.
- Footnote (Jost 15px Piedra): "Carta orientativa: puede cambiar según la temporada o la disponibilidad del producto. Los precios válidos son los de la carta del local, con el IVA incluido." (from terminos).
- Row ids: `plato-croquetas`, `plato-bravas`, `plato-boniato`, `plato-burrata`, `plato-arancini`, `plato-fritas`, `plato-fried`, `plato-pollo`, `plato-alitas`, `plato-hamburguesa`, `plato-canelon`, `plato-pastel`.

**Item format:**
- The name is `--t-item` Ajo.
- An em space follows, then the tag in Bodoni italic 500 20px Piedra ("popular", "picante", lowercase).
- An em space follows, then the price "— €" in Bodoni italic 500 20px Piedra.
- Descriptions are on the next line, Jost 15px Piedra.
- No leaders, cards, tabs or chips.
- Category titles are Bodoni italic 500 `clamp(1.5rem,2vw,1.9rem)` Ajo, with a 1px Ceniza rule under them.
- `scroll-margin-top: 96px` on rows.

**Desktop layout:**
- A `#lamp` hangs over the centre of the section top (cord 110px).
- Its cone falls onto a Humo plane: max-width 1120px, centred, square corners, padding 64px 72px.
- The plane has a textured pool on it: a pool element sized 90% × 70%, centred on the upper half, peaking at `--pool`.
- Heading and line are centred; the three columns are left-aligned inside, `gap: 56px`.

**360px:**
- The plane goes full-bleed with 20px padding; one column.
- Each category title is `position: sticky; top: 56px; background: var(--humo); z-index: 2`, with a Ceniza bottom hairline, while you scroll its items (graft).

**Motion:**
- On enter (`top 75%`, once): lamp `encender`, and the plane pool opacity .35 → 1 (1.2s sine.inOut). It "settles under the lamp", with no rotation or movement.
- Items are `.rv-lum`: columns stagger 150ms apart, items 40ms apart within a column.
- Title is `.rv-focus`.

**Interaction:**
- Desktop hover or focus-within on an item: name → Luz (.2s).
- **"Called" row:** a link to `#plato-*` (from El pase or Sobremesa) scrolls smoothly (auto under reduced motion). When the row is ≥50% in view (IntersectionObserver, or a 900ms timeout), add `.is-called` for 1.8s: name and price → Luz, plus a 1px Luz hairline under the row that fades in .3s and out .8s. Focus moves to the row (`tabindex="-1"`) without scrolling.

**At rest:** plane lit, all items Ajo.

### 6.5 `allioli`: "Gallioli, en dos palabras" (signature moment 3, "La salsa que liga")

**Content:**
- H2 "Gallioli, en dos palabras".
- Four steps (`<ol>` in the DOM), with A's text verbatim:
  1. **Ajo:** "Todo empieza con unos dientes de ajo y una pizca de sal, en el mortero."
  2. **Aceite:** "Después, aceite de oliva, gota a gota. Sin prisa: si corres, la salsa se corta."
  3. **Paciencia:** "La mano de mortero gira siempre en el mismo sentido, hasta que la salsa liga, blanca y espesa."
  4. **Gallioli:** "Gall es gallo en catalán. Súmale allioli y tienes el nombre de la casa."
- Step heads are Bodoni italic 500 `clamp(1.6rem,2.4vw,2.2rem)`; texts are Bodoni 400 `clamp(1.3rem,1.8vw,1.7rem)` Ajo.
- Stage overlay (aria-hidden): the word "Gallioli" in Bodoni italic 400 `clamp(3.4rem, 9vw, 9rem)`, solid Carbón on the near-solid white sauce (Carbón on Luz, 17.9:1). It is centred on the highlight. At rest it shows only in the final frame.
- Desktop step-name list (a 4-item vertical list at the bottom-left inside the stage; Bodoni italic 500 20px): the current step is Luz, the others Piedra. No numbers or segmented bar. Hidden on phones.
- The bottom half of a `#lamp` dome is cropped by the stage's top edge (centre-right), so the key light has a visible source.

**Desktop layout:** mirrored from El pase. Stage sticky on the left 56% (100svh); steps on the right 44%, each `min-height: 100svh`, text vertically centred.

**360px:** the same sticky-top pattern as El pase (46svh stage, 90svh steps).

**Motion:**
- One ScrollTrigger over `.alli-list`:
  - desktop: `start: "top center"`, `end: "bottom center"`;
  - phone: `"top 75%"` / `"bottom 75%"`.
- `onUpdate` feeds P through a `gsap.quickTo` smoother (.8s, "power3").
- Shader uniforms follow the table in 5.2.
- The current step (`floor(P*4)`) gets `.is-current`: head Luz, text Ajo; other steps Piedra.
- For P > .85, the word overlay's `--r` is scrubbed from 0 to full, centred on `--hx` and `--hy`. The mask is removed at P = 1.

**At rest** (no JS, reduced motion, no WebGL2):
- the final frame (dense Luz sauce plus "Gallioli" visible) as a static render, or the typographic plate "allioli";
- all four steps Ajo and readable.

### 6.6 `formas`: "Aquí o en casa."

**Content:**
- H2 "Aquí o en casa." (a new heading).
- Three rows, each `<div class="row">` with:
  - a `#lamp-mini` (22px) at the far left;
  - an `<h3>` phrase (`--t-phrase`);
  - A's copy (Jost 17px);
  - an action on the right.

| Phrase (h3) | Copy (A, verbatim) | Action |
|---|---|---|
| En la sala | Un comedor acogedor para una cena en pareja o una mesa larga con amigos. | `.btn-luz` "Reservar mesa ↗" (`data-loc="en-el-local"`) |
| Para recoger | Llama, haz tu pedido y pasa a buscarlo. Una clienta lo tuvo listo en 15 minutos. | the phone as text "932 22 77 38" (Jost 500 18px, tabular) plus `.copy` "Copiar" |
| En tu casa | Pollo al carbón, croquetas y boniato, directos a tu sofá. | `.tlink` "Pedir online ↗" (class `js-pedir`) |

**Desktop layout:**
- Rows are full width, `grid-template-columns: 44px 1.1fr 1.3fr auto`, separated by 1px Ceniza hairlines, padding 40px 0.
- A textured `.pool` band (3.2:1 ellipse, about 70% of the row width) sits behind the **active** row, under its lamp.

**360px:**
- Rows stack: lamp and phrase on one line, then copy, then the action at full width.
- The active row is the one crossing the viewport centre.

**Motion and interaction:**
- One row is always "under the light". Default: row 1.
  - Desktop: `mouseenter` or `focusin` sets it active.
  - Touch or `(hover: none)`: an IntersectionObserver with `rootMargin: "-45% 0px -45% 0px"`.
- Active row: its lamp runs `encender` (.45s), its pool fades in (opacity .5s sine.inOut), phrase Luz, copy Ajo.
- Other rows: lamp unlit (outline), phrase Piedra, copy Piedra.

  This dims by luminance steps, not opacity, so contrast stays ≥ 6.7:1. The action buttons are never dimmed.
- Rows use `.rv-lum` once on first entry.
- Copy shows the toast (8.3).

**At rest:** all rows readable. Row 1 is lit.

### 6.7 `sobremesa`: "De sobremesa" (reviews)

**Content:**
- Head row: the H2 "De sobremesa" on the left; on the right, one plain sentence in Jost 18px Ajo: "4,8 de 5 en Google, con 745 reseñas." There is no big number, stars, bars or count-up.
- Five quotes as `<figure><blockquote>` in Bodoni italic (`--t-quote`, «»), each with a `<figcaption>` in Jost 500 15px Piedra:
  1. «Una experiencia deliciosa de principio a fin. Un ambiente encantador y acogedor, con una decoración impecable y hermosas plantas naturales.» Anna S. · Local Guide · hace 5 meses
  2. «Os recomiendo las croquetas y las bravas, y si os va el picante, las alitas.» Resumen de reseñas · Google Maps
  3. «Hemos ido a encargar cena para llevar y en 15 minutos ya teníamos todo preparado y listo para recoger.» Laura Ferrer · Local Guide · hace 9 meses
  4. «Muy rico todo, las patatas de boniato riquísimas y la hamburguesa espectacular.» Resumen de reseñas · Google Maps
  5. «La comida es buenísima, la salsa del pollo frito es muy rica.» Resumen de reseñas · Google Maps
- Closing sentence (Jost 18px Ajo): "Lo más nombrado: las croquetas, el boniato, el fried chicken y el canelón." Each dish name is a `.tlink` to its carta row (`#plato-croquetas`, `#plato-boniato`, `#plato-fried`, `#plato-canelon`), which calls the row (6.4).
- Link: `.tlink` "Ver reseñas en Google ↗" (the Maps URL).
- Small print (Jost 14px Piedra): "Opiniones tomadas de reseñas públicas en Google." (from terminos).

**Desktop layout:**
- Quotes form an overheard conversation: odd quotes in cols 1–7, even quotes in cols 6–12.
- Vertical overlap: each quote after the first gets `margin-top: -4vw`, and the layout keeps at least 24px of clear space between text boxes.
- **Lamp rig:** a `.rig` block (`position: sticky; top: 0; height: 100svh; margin-bottom: -100svh; pointer-events: none; z-index: 0`) holds:
  - a `#lamp` at x 86% hanging 72px below the header;
  - a `.cone` angled down-left;
  - a textured `.pool` (1.4:1, 38vw) centred at (40%, 56%) of the viewport.

  The conversation scrolls through the lit pool while the lamp stays over the table.

**360px:**
- One column; quotes alternate `padding-left: 0 / 12%`.
- The lamp rig stays sticky: lamp at x 80%, pool 90vw centred at (50%, 55%).

**Motion:**
- Each quote gets `ScrollTrigger({trigger: fig, start: "top 58%", end: "bottom 42%", toggleClass: "is-lit"})`. Without GSAP, use an IntersectionObserver with `rootMargin: "-42% 0px -42% 0px"`.
- Lit quote: Luz plus `text-shadow: 0 0 24px rgba(255,244,224,.18)`. Other quotes: Ajo if already passed, Piedra if not yet reached. All stay ≥ 7:1.
- Transition .6s `--e-soft`.
- The first entry of each quote is `.rv`.
- No autoplay, counter or carousel.

**At rest** (reduced motion): all quotes Ajo, lamp and pool static.

### 6.8 `preguntas`: "Lo que conviene saber"

**Content:**
- Left, sticky on desktop (`top: 96px`):
  - H2 "Lo que conviene saber";
  - "Si tienes otra duda, llámanos al 932 22 77 38 o escríbenos por Instagram." (Jost 17px Ajo, with the number unbroken);
  - `.copy` "Copiar teléfono";
  - `.tlink` "@galliolibistrot ↗".

  A `#lamp` (64px) hangs above the H2, with a textured wall pool (1.4:1) behind the H2 and text.
- Right: the six Q&As from A, verbatim (content.md 3.10).

**Disclosure markup:**

```html
<div class="qa" data-open>
  <h3><button aria-expanded="true" aria-controls="qa1" id="qb1">
    <span>¿Hace falta reservar?</span>
    <svg class="lamp-sm"><use href="#lamp-mini"/></svg>
  </button></h3>
  <div class="qa-p" id="qa1" role="region" aria-labelledby="qb1">
    <div><p>…</p></div>
  </div>
</div>
```

- Questions: Bodoni 500 `--t-item`, Piedra when closed, Luz when open.
- Answers: Jost 17px Ajo.
- The first item is open by default. Several may be open at once.

**Layout:**
- Desktop: cols 1–4 and 6–12.
- Items separated by Ceniza hairlines, each with a 2px left edge that is Ceniza when closed and brightens to Luz when open (.5s).
- The lamp-mini on the right replaces +/×: its bulb is off (outline) when closed and lit (`encender`) when open.
- **360px:** a single column; the left block (not sticky) comes first.

**Motion:**
```css
.qa-p{ display:grid; grid-template-rows:0fr; visibility:hidden;
       transition:grid-template-rows .5s var(--e-light), visibility 0s .5s; }
.qa[data-open] .qa-p{ grid-template-rows:1fr; visibility:visible; transition-delay:0s; }
.qa-p>div{ min-height:0; overflow:hidden; }
```
The answer fades opacity 0 → 1 over .4s, with a .1s delay. There is no blur.

**Interaction:** button click, Enter or Space (native); toggles `data-open` and `aria-expanded`.

**At rest:** item 1 open, the others closed but reachable.

### 6.9 `esta-noche`: closing booking scene (signature moment 4, "Última luz")

**Content:**
- `<h2 id="noche-h">` dynamic from `closingHead(now())`: "Tu mesa, esta noche." / "Tu mesa, hoy." / "Tu mesa, mañana." / "Tu mesa, el {día}." (Bodoni 400 `--t-h2` enlarged to `clamp(2.8rem, 7vw, 6.5rem)`).
  - Set in HTML to "Tu mesa, esta noche." as the no-JS default.
  - Swap the text only when it changes.
  - The wording never promises availability; the next line is an invitation.
- Live line (Jost 500 16px Ajo, tabular): `s.text + " · " + (s.open ? "quedan " : "faltan ") + fmt(s.left,false)`, e.g. "Cerrado · abre hoy a las 20:00 · faltan 3 h 12 min". Updated every second; `aria-live="off"`, because it changes too often to announce.
- `.btn-luz` "Reservar mesa ↗" (`data-loc="esta-noche"`).
- "o llama al 932 22 77 38" plus `.copy`.

**Desktop layout:**
- `min-height: 100svh`; `position: relative; z-index: 45`.
- A `#lamp` at the top, x 62% (cord from the section top, 22svh).
- Pool (3.2:1, 50vw) centred at (32%, 70%).
- Content block left-aligned inside the pool area (cols 2–7), vertically at 55–85%.
- The haze canvas is re-parented here (5.3) with a cone from the bulb toward the pool centre. Its CSS fallback is the cone element.

**360px:** lamp at x 76%; pool 110vw centred behind the content; content left-aligned at full width; full-width CTA.

**Motion:** see 7.4.

**At rest:** lamp lit, pool lit, headline visible.

### 6.10 `visita`: "Ronda del General Mitre, 220"

**Content:**
- The address is the H2: "Ronda del General Mitre, 220" (Bodoni 400 `clamp(2.2rem,4.6vw,4.4rem)`).
- **Left column, "La esfera".** An SVG half-dial (`viewBox 0 0 320 180`, aria-hidden, max-width 420px):
  - centre (160,168), radius 140;
  - angle for minute m: `θ = π − (m − 720)/720 · π` (12:00 at the left, 18:00 at the top, 24:00 at the right);
  - track: 1.5px Ceniza arc;
  - today's service spans (e.g. 12:30–16:00, 20:00–23:00) as 3px Luz arcs (`stroke-linecap: butt`);
  - ticks at 12, 16, 20 and 24 with labels in Jost 500 14px Piedra;
  - marker: a Luz dot (r 5) with a 14px halo gradient at the current Madrid minute, clamped to [720, 1440]. Before 12:00 it rests at 12:00 as an unlit outline.
- Beside the dial:
  - `data-status="text"` in Bodoni italic 500 24px Ajo;
  - the countdown in Jost 500 16px tabular: `(s.open ? "quedan " : "faltan ") + fmt(s.left, true) + (s.open ? " para el cierre" : " para abrir")`.
- **"La semana":** `<ul>`, order Martes → Lunes (`[2,3,4,5,6,0,1]`). Each `<li>` has:
  - the day in Bodoni italic 500 20px;
  - a track (a 1px Ceniza line spanning 12:00–24:00, relative positioning, with lit 3px Ajo segments at 75% opacity; segments are decorative, `aria-hidden`);
  - the hours as text in Jost 500 15px tabular: "12:30–16:00 · 20:00–23:00" or "Cerrado".

  Today's row: day name and hours Luz, segments Luz at 100%, and an italic Bodoni 500 20px "hoy" after the day name. No box.
- **Right column:**
  - "08006 Barcelona · Sarrià-Sant Gervasi · C44W+6P Barcelona" (Jost 17px Piedra);
  - actions: `.btn-luz` "Reservar mesa ↗" (`data-loc="visitanos"`) and `.tlink` "Cómo llegar ↗" (the Maps URL, class `js-maps`);
  - contact: "Teléfono 932 22 77 38" plus `.copy`; "Instagram @galliolibistrot ↗";
  - services sentence: "Comer en la sala, recogida sin entrar y a domicilio. LGBTQ+ friendly."
  - The action block has class `.visita-actions`, used by the mobile bar.

**Desktop layout:** 2 columns (cols 1–7 dial and week, cols 9–12 details). Section padding standard.

**360px:** H2 (wraps to 2–3 lines); dial at full width (max 320px); status and countdown; week (day label 56px wide, track flexible, hours text under each track at 15px); then details and actions at full width.

**Motion:**
- On enter (`top 70%`, once): arcs run `encender` (.45s, staggered .15s); the marker glides from minute 720 to now (tween a proxy `{m:720}` → nowMin, 1.2s power3.out, repositioning each update); then it ticks live every second.
- Week rows: `.rv-lum`, stagger 60ms.
- Reduced motion: final state, and the marker jumps.

**At rest:** all lit, with the marker at now.

### 6.11 `grupos` (inside `#visita`, below a Ceniza hairline): "Mesas largas y celebraciones"

**Content:**
- Left (cols 1–4):
  - a `#lamp` (56px) above an H3 "Mesas largas y celebraciones" (Bodoni 400 `clamp(1.8rem,2.8vw,2.6rem)`), with a small wall pool behind the H3;
  - A's copy: "Cumpleaños, cenas de empresa o cualquier duda: escríbenos y te respondemos. Para una mesa normal, usa el botón de reserva."
- Right (cols 6–12): the form. It sits on a Humo plane (padding 40px) with a textured pool across its top edge from the lamp at left, so the form is lit, not flat.

**Form:**
- `<form id="form" name="consultas" novalidate>` with fields exactly as in A (content.md 3.13):
  - honeypot `empresa` (off-screen, `aria-hidden`, `tabindex="-1"`, label "No rellenes este campo");
  - nombre;
  - email;
  - telefono "Teléfono (opcional)";
  - fecha (`min` = today);
  - personas (1–80);
  - mensaje (maxlength 1000, counter "0 / 1000");
  - privacidad checkbox with the link to `privacidad.html` (the kit intercepts it).
- **Field style:** underline only, no box or fill.
  - `border-bottom: 1px solid var(--cordel)` (3.94:1), radius 0.
  - Input text: Bodoni 500 20px Ajo (graft: written as in a register). Phone and date inputs use Jost 17px for clean numerals.
  - Labels above: Jost 500 15px Piedra.
  - Min height 48px; font-size ≥ 16px everywhere, so iOS does not zoom.
  - Two columns on desktop (nombre | email, teléfono | fecha, personas | —; mensaje and privacidad full width); one column on phone.
- **Focus:** the underline turns Luz and 2px (with `box-shadow: 0 1px 0 var(--luz)`), the label turns Luz, and a faint glow appears (`box-shadow: 0 6px 16px -10px rgba(255,244,224,.4)`).
- **Checkbox:** 18px square, 1px Cordel border, radius 0. Checked: Luz fill with a Carbón tick SVG.
- **Submit:** `.btn-line` "Enviar consulta" (secondary, so "Reservar mesa" remains the only filled button).
- **Validation:** A's RULES, error texts, `touched` set, blur, input and change handlers, summary messages and counter, copied verbatim (A lines 998–1043).
  - Errors are `<p class="err" id="e-…">` in Bodoni italic 500 20px Ajo, preceded by "— ", and the field underline becomes 2px Luz dashed (`border-bottom-style: dashed`). State is never shown by colour alone.
  - `aria-invalid` and `aria-describedby` point to the error.
  - The status paragraph `#f-status` has `role="status"`.
- **Antispam:** the honeypot, the 3s minimum since load, 1 send per 60s, and at most 1 link.
- **Send mode:** `const FORM = { mode: "none" }` and only the "none" branch exists in this build. Submitting valid data shows: "El formulario todavía no está conectado. Mientras tanto, llámanos al 932 22 77 38." No fetch code is included. Add the comment `// Al publicar: añadir envío (Netlify o endpoint), ver README de la opción A.`
- **Legal line** under the form (Jost 14px Piedra): "**Formulario de demostración: no envía ningún dato.** Responsable: [RAZÓN SOCIAL]. Finalidad: responder a tu consulta. Base legal: tu consentimiento. No cedemos tus datos a terceros salvo obligación legal. Puedes ejercer tus derechos de acceso, rectificación y supresión, entre otros, como explica la política de privacidad." The last three words link to `privacidad.html`.

**Motion:** the plane pool fades up once (.8s); fields are `.rv` with a 40ms stagger. Focus changes luminance only; there is no sweep.

### 6.12 `pie` (footer)

**Content:**
- A `#lamp` (48px) plus "Gallioli Bistrot" in Bodoni italic 400 40px, and "Bistrot de barrio en Sant Gervasi." (Jost 17px Piedra).
- One row (Jost 500 15px):
  - "Ronda del General Mitre, 220 · Barcelona";
  - "932 22 77 38";
  - `.tlink` "@galliolibistrot ↗".
- Legal nav: `<a href="terminos.html">Aviso legal</a> · <a href="privacidad.html">Privacidad</a> · <a href="privacidad.html#cookies">Cookies</a> · <button type="button" data-cookie-settings>Preferencias de cookies</button>`. The kit intercepts these.
- Proposal line (Jost 500 14px Piedra): "Propuesta de diseño para Gallioli Bistrot (opción B). No es la web oficial del restaurante."
- Demo toggle (`.tlink` button, `aria-pressed`): "Ver la sala abierta (demostración)" ↔ "Volver a la hora real". It sets or clears `demo` (4.1) and calls `tick()` immediately.
- No giant wordmark.

**Layout:** left-aligned, padding-block 96px 48px plus the safe area, with a Ceniza hairline on top. On phone it stacks, and the bottom padding leaves room for the mobile bar (72px plus the safe area).

**Motion:** "the night ends".
- ScrollTrigger on `#pie`, `start: "top bottom"`, `end: "bottom bottom"`, `scrub: 0.8`.
- The footer lamp's `--bulb` goes 1 → 0.15 and its halo fades with it (the halo opacity is already tied to `--bulb`).
- A class `.is-off` is toggled when `--bulb` < .5; it switches `--rim` from Luz to Ceniza with a .4s transition.
- Reversible.

### 6.13 `menu` (mobile menu, ≤960px)

- **Structure:** `<div id="menu" hidden>`, a fixed overlay with `inset: 56px 0 0 0` (below the header, so "Cerrar" stays visible), z-index 49, `background: linear-gradient(var(--humo), var(--carbon) 70%)`.
- **Contents:**
  - links in Bodoni 400 44px Ajo, left-aligned: La sala · Platos · Carta · Reseñas · Preguntas · Visítanos;
  - at the bottom: `data-status="text"` with lamp-mini, `.btn-luz` "Reservar mesa ↗" (`data-loc="menu"`) at full width, and "932 22 77 38 · Ronda del General Mitre, 220" (Jost 15px Piedra).
- **Open:**
  - remove `hidden`; the overlay opacity goes 0 → 1 over 350ms (sine.inOut), like the page fading to black;
  - links go from Piedra at opacity .4 to Ajo at opacity 1, 60ms stagger, .5s. No blur, circle clip or icon morph;
  - `html.menu-open{overflow:hidden}` (the menu is not an ancestor of sticky elements).
- **Close:** reverse, 250ms. Also closes on link click, Esc and resize above 960px.
- **Accessibility:**
  - focus moves to the first link;
  - focus is trapped within [the Menú button and the menu's focusables];
  - `aria-expanded` is kept in sync;
  - on close, focus returns to the button.

### 6.14 `barra` (sticky mobile booking bar, ≤760px)

- **Look:** `position: fixed; bottom: 0`, full width, height `56px + env(safe-area-inset-bottom)`, Humo background, with a 1px top edge `rgba(255,244,224,.6)` ("light under the door").
  - Left: lamp-mini plus `data-status="short"` (Jost 500 14px Ajo).
  - Right: `.btn-luz` "Reservar mesa ↗" (`data-loc="barra-movil"`), 44px high.
  - Square corners, no blur.
- **Visibility:** shown (`translateY(0)`, opacity 1, .35s) when the hero is out of view, and hidden when any of these is in view: `#inicio`, `#esta-noche`, `.visita-actions`, `#form`. Also hidden while `html.menu-open`, `body.cc-open` (kit class) or the legal sheet is open. Use one IntersectionObserver plus class checks.
- **No overlap:** `body` gets `padding-bottom: 72px` at ≤760px, so the footer is never covered.

---

## 7. Signature moments

### 7.1 "Se enciende la sala" (hero intro, ≈1.6s, runs once per load)

**Pre-state** (only when `.pre` is on `<html>` and not reduced motion; see 3.1):
- header opacity .35;
- lamp dome visible, bulb `--bulb: 0`, halo 0;
- haze `uLight` 0;
- pool opacity 0;
- `#hero-plate` opacity 0;
- the H1 masked with `--r: 0`;
- `.h1-name`: `filter: blur(8px)` (4px on phone), scale 1.015;
- sub, status, actions and fact line: opacity 0, y 8px.
- The proposal label is never hidden: it is visible from the first paint.

Everything is text in the DOM, so screen readers get it immediately.

**GSAP timeline** (`gsap.timeline({defaults:{ease:"power2.inOut"}})`, times in seconds):

| t | What |
|---|---|
| 0.15 | Bulb: `--bulb` 0 → .3 (.06, `none`), hold .08, → 1 (.25, `power2.out`). This is the incandescent warm-up. It happens once and never flickers again. |
| 0.35–1.10 | Haze `uLight` 0 → 1. Pool opacity 0 → 1 and `transform: scale(.85 → 1)` from its centre. `#hero-plate` opacity 0 → 1 with `filter: brightness(.3 → 1)`. The food appears as the light lands on it. |
| 0.50–1.40 | H1 exposure: `--r` 0 → the distance from the bulb to the farthest H1 corner + 240px, with `--mx`/`--my` = the bulb centre relative to the H1 box. `.h1-name` blur → 0 and scale → 1 (.9s, `expo.out`). |
| 1.10–1.60 | Sub, status, actions and fact line: opacity 1, y 0 (.5s each, `power2.out`, stagger .06). |
| 1.40–1.70 | Header opacity → 1 (.3s). |
| end | Set the H1 masks and filters to `none` and clear `will-change`. |

- **Skip:** the first `wheel`, `touchstart`, `keydown` or `pointerdown` calls `tl.progress(1)`.
- **Hard stop:** `setTimeout(() => tl.progress(1), 2200)`. The CSS `intro-safety` also covers the case where GSAP never arrives.
- Remove `.pre` right after the timeline has `gsap.set` its from-states. This happens in the same frame, so nothing flashes.
- **No WebGL:** the same timeline drives the CSS cone and halo opacities instead of `uLight`.
- **Reduced motion or no JS:** everything starts lit, with one static haze frame.
- **Scroll-out dim:** see 6.1.

### 7.2 "El pase" (four dishes on the sticky stage)

**Driver:** `ScrollTrigger.create({trigger: ".pase-list", start: "top center", end: "bottom center", onUpdate: s => setP(s.progress)})`. On phones use `"top 75%"` / `"bottom 75%"`. `setP` feeds a `gsap.quickTo(state, "P", {duration: .8, ease: "power3"})` smoother. The render reads `state.P`.

**Per frame:**
- `i = min(3, floor(P*4))`, `p = P*4 - i`.
- `L = smoothstep(0,.18,p) * (1 - smoothstep(.82,1,p))`.
- Key light:
  - dishes 0–2: `az = -40° + 80°·p`, `el = 30° + 12°·p`;
  - pollo: `az = -55° + 80°·p`, `el = 28°`.

  The engraving re-cuts live as the light passes over the plate: highlights glint on the crust and the line widths follow the light.
- **Dolly** (replaces the 18° yaw, so the G-buffer stays valid): the stage canvas gets `transform: scale(1.04 - .04·p)` from its centre.
- **Pool under the pass:** `--pool-o = .25 + .75·L`, and `--px = 50% + 18%·sin(az)`, so the pool drifts with the light.
- **Pass lamp:** `--bulb = .2 + .8·L`.

**Scene switching:**
- The scene is keyed to the caption index `i`, per the mustFix, so a fast flick never lights the wrong dish.
- When `i` changes:
  - force the displayed L to 0 (hold the stage black);
  - bake the new G-buffer over the next 4 frames;
  - then release L to follow scroll through the smoother, so it rises from 0.
- At a normal scroll speed, the change happens at p≈0, where L is already ≈0. **There is never a cross-dissolve between two lit dishes.**

**Captions:**
- Caption i gets `.is-lit` while `L > .3` and it is the current dish.
- On gaining `.is-lit`, the dish name runs a one-shot focus pull: `@keyframes pull{from{filter:blur(6px)}to{filter:none}}`, .9s `--e-out` (4px on phone; skipped on low-end devices), while its colour goes Piedra → Luz (.9s). It is a class transition, not a per-frame blur scrub.
- The serif line goes Piedra → Ajo.
- On losing `.is-lit`, the colours settle back to Piedra (.6s), with no blur.
- Captions are always at opacity 1 and never below Piedra, so every caption is readable at every moment.

**Fallbacks:**
- Reduced motion or no GSAP: an IntersectionObserver switches the dish when its caption crosses the centre (`rootMargin: "-45% 0px -45% 0px"`). Each dish is rendered once at az 0°, el 38°, L 1, with no dolly.
- No WebGL2 or context lost: typographic plates with the same light logic (opacity = L; the mask centre drifts with az).
- Stills mode: see 5.1.

### 7.3 "La salsa que liga" (allioli macro)

- **Driver:** as in 7.2, with parameters from the table in 5.2.
- **Ajo:** a dim, grainy paste (sparse granular bumps, low gloss, thin dim lines).
- **Aceite:** a smooth, highly glossy film spreads in from the left edge (`uEdge` −.3 → 1.3), and its specular highlight slides across (az −30° → +10°).
- **Paciencia:** an engraved spiral groove appears and turns (`uTwist` 0 → 3π) while the lines thicken (`uThick`). It turns one way as you read forward, echoing "siempre en el mismo sentido".
- **Final:** the lines merge into near-solid Luz (`uBind` → 1), the brightest render on the site. For P > .85 the word "Gallioli" is exposed through a radial mask centred on the highlight (`--hx`, `--hy`, `--r` scrubbed), in Carbón on white. At P = 1 the mask is removed.
- The step list and captions follow `.is-current`.
- **Reduced motion or no WebGL2:** the static final frame (or the "allioli" typographic plate), the word visible, all steps visible.

### 7.4 "Última luz" (closing booking scene)

**Vignette:**
- `<div id="vignette">`: `position: fixed; inset: 0; pointer-events: none; z-index: 40; background: radial-gradient(ellipse 70% 60% at 50% 60%, rgba(13,12,11,.55), rgba(13,12,11,.92))`, opacity 0.
- `#esta-noche` sits above it (z 45) and the header sits above it (z 50). The header is deliberately not dimmed, so its text keeps its contrast.
- Scrub: one timeline on `#esta-noche`, `start: "top 85%"`, `end: "bottom 15%"`, `scrub: 0.8`. Opacity 0 → .7 over the first 35%, holds, then .7 → 0 over the last 25%.

**Haze:**
- When `#esta-noche` is within 1 viewport and `#inicio` is out of view, move the haze canvas into `.noche-haze`.
- Recompute `uBulb`, `uDir` and `uLen` from this section's lamp and pool.
- `uLight` is scrubbed from .4 to `(.6 + .4·heat)` as the section arrives: the lamp brightens over the booking block and is warmer or dimmer by the live heat.
- Move the canvas back to the hero when the hero re-enters.

**Headline:** on enter (`top 60%`, once), the radial mask from the lamp (5.5) runs over 1.0s `power2.inOut`, then `mask: none`. The live line and CTA are `.rv` (.6s, after .5s).

**Mobile:** the same, with the vignette at .6 maximum. The booking bar is hidden here.

**Reduced motion:** no vignette, no mask, statically lit, haze at one frame.

---

## 8. Interactive features (behaviour)

1. **Live open status** (Europe/Madrid, every 1s; 4.1):
   - header lamp and text;
   - hero status;
   - mobile bar;
   - menu;
   - Esta noche headline and line;
   - Visítanos dial, marker, countdown and today's row;
   - lamp heat everywhere (`--heat`, `--lamp-col`).

   Plus the demo override (hash or footer toggle).
2. **Menu (carta):**
   - hover or focus lights an item to Luz;
   - dish links from El pase and Sobremesa scroll to and "call" a row (6.4);
   - sticky category titles on phones.
3. **Reviews:** five real quotes; the lit quote follows the scroll centre; dish links go to the carta; a link to Google (new tab). No carousel, counter or stars.
4. **FAQ:** six accessible disclosures, with the first open (6.8).
5. **Mobile menu:** 6.13.
6. **Sticky mobile booking bar:** 6.14.
7. **Group enquiry form:** validation, honeypot, 3s minimum, rate limit, link limit and counter. It is a demo and sends nothing (6.11).
8. **Copy phone** (four places: Formas, Preguntas, Esta noche, Visítanos):
   - `navigator.clipboard.writeText("932 22 77 38")` inside try/catch;
   - fallback: a hidden textarea plus `document.execCommand("copy")`;
   - toast "Número copiado: 932 22 77 38", or "Llámanos al 932 22 77 38" on failure;
   - then call `gallioliTrack?.("telefono_copiado")`.
9. **External links:** booking, ordering (`pedido_click`), directions (`como_llegar_click`), Instagram and Google all open in a new tab.
10. **Footer legal links and cookie preferences:** handled by the legal kit (section 9).
11. **Active nav:** an IntersectionObserver sets `aria-current="true"` and Ajo on the current section's nav link.
12. **Smooth anchors:** `html{scroll-behavior:smooth; scroll-padding-top:72px}` (auto under reduced motion).

---

## 9. Required page furniture

### 9.1 "Not the official site" labels

- **Hero:** `<p class="proposal">Propuesta de diseño · No es la web oficial</p>`. It is visible at every width, above the H1 on desktop, and at the top-left under the header on phone.
- **Footer:** "Propuesta de diseño para Gallioli Bistrot (opción B). No es la web oficial del restaurante."
- **Form:** "Formulario de demostración: no envía ningún dato."

### 9.2 Legal kit: paste verbatim, restyle with CSS only

Paste the full contents of `optb/legal_kit.html` near the end of the file. It provides:
- `#sheet` (the legal panel host, `role="dialog"`);
- templates `tpl-privacidad`, `tpl-terminos` and `tpl-404`;
- the consent script (builds `.cc`, toggles `body.cc-open`, key `gallioli-consent-v1`, try/catch storage, never loads GA because `GA_ID` is a placeholder);
- the panel router, which intercepts links to `privacidad.html` and `terminos.html`, handles Esc, and reads the hashes `#privacidad`, `#cookies`, `#terminos`, `#aviso-legal` and `#404`.

Do not edit the kit. Our section ids must not be `privacidad`, `cookies`, `terminos`, `aviso-legal` or `404`.

**`#sheet` styling (right-side Humo panel):**

```css
#sheet{ position:fixed; inset:0 0 0 auto; width:min(880px,100%); z-index:92; overflow-y:auto; overscroll-behavior:contain;
  background:var(--humo); color:var(--ajo); outline:none; box-shadow:0 0 0 100vmax rgba(8,7,6,.72);
  transform:translateX(100%); transition:transform .6s cubic-bezier(.2,.7,.1,1); }
#sheet.open{ transform:none; } #sheet.closing{ transform:translateX(100%); }
@media (max-width:900px){ #sheet{ width:100%; box-shadow:none; } }
@media (prefers-reduced-motion:reduce){ #sheet{ transition:none; } }
```

The kit's close timer is 800ms, and the transition must be ≤ 800ms.

**Classes to style:**
- `.lx-legal`: Jost 17px/1.65, Ajo on Humo.
- `.lx-lhead`: sticky top, Humo, 1px Ceniza bottom.
- `.lx-logo`: Bodoni italic 500 24px.
- `.lx-g`: `color: inherit`. Never yellow.
- `.lx-btn`: `.btn-luz`. `.lx-btn.lx-ghost`: `.btn-line`. The "Volver a la web" link closes the sheet (kit behaviour).
- `.lx-lhero`: padding 48–80px; its background is Humo plus a textured `.pool`-like `background-image: var(--tex)` at a soft-light top-right, plus a small `#lamp` drawn with CSS `::before` as an inline SVG data URI at top-right.
- `.lx-eyebrow`: Jost 500 15px Piedra, no uppercase.
- `.lx-lhero h1`: Bodoni 400 `clamp(2.4rem,5vw,4rem)`.
- `.lx-sub`: Piedra. `.lx-upd`: Jost 500 14px Piedra.
- `.lx-lbody`: grid 200px 1fr (≥ 901px viewport).
- `.lx-toc`:
  - sticky `top: 88px`;
  - `p` in Jost 500 14px Piedra;
  - links in Jost 15px Piedra with a 2px Ceniza left edge; `.lx-on` or hover → Luz with a Luz edge;
  - ≤ 900px: an inline wrapped list separated by " · ".
- `.lx-prose h2`: Bodoni 500 `clamp(1.5rem,2.4vw,1.9rem)`. Sections are separated by 1px Ceniza lines, with `scroll-margin-top: 88px`.
- `.lx-tbl table`: 1px Ceniza lines, `th` in Jost 500 Piedra, with horizontal scroll inside `.lx-tbl` on phones.
- `.lx-ph`: italic, with a Cordel dashed underline.
- `.lx-lfoot`: Jost 14px Piedra, 1px Ceniza top.
- `.lx-cc-link` and `[data-cookie-settings]`: styled as `.tlink`.
- `:focus-visible` inside the sheet: 2px Luz outline.
- **404** (`#404` hash only): `.lx-e404` on Carbón, with `.lx-code` in Bodoni 400 `clamp(6rem,20vw,14rem)`. Hide `.lx-plate` (it is a top-down plate, which is banned) and put an unlit lamp between the two 4s with `.lx-code span:first-child::after{content:""; display:inline-block; width:.55em; height:.7em; background:url("data:image/svg+xml,…#lamp unlit…") center/contain no-repeat; margin-inline:.1em}`. The h1 "Aquí no queda ni una croqueta." is set in Bodoni 400.

**Enhancements the builder adds in our script** (without touching the kit):
- A `MutationObserver` on `#sheet` (attribute `hidden` and class). While it is open, set `inert` on the header, `#contenido`, the footer and the mobile bar, trap Tab inside `#sheet`, and hide the mobile bar. Remove all of this on close.

**Cookie strip (`.cc`, built by the kit):**

```css
.cc{ position:fixed; left:0; right:0; bottom:0; z-index:85; background:var(--humo); border-top:1px solid var(--ceniza);
  padding:20px var(--gutter) calc(20px + env(safe-area-inset-bottom)); display:grid; grid-template-columns:1fr auto; gap:12px 32px; align-items:center;
  transform:translateY(100%); opacity:0; transition:transform .5s var(--e-out), opacity .5s; font:400 15px/1.5 var(--f-body); color:var(--ajo); }
.cc.show{ transform:none; opacity:1; }
```

- `.cc-t` "Cookies": Bodoni italic 500 22px.
- `.cc a`: `.tlink`.
- `.cc-opts`: grid; labels in Jost 15px; `small` in Piedra 14px; `accent-color: var(--luz)`.
- `.cc-btns`: flex. Button order via CSS `order`: reject 1, accept 2 (two equal `.btn-line` rectangles with the same width and weight), config 3 (a text link, "Configurar" or "Guardar selección"; when it reads "save" it becomes a `.btn-line`).
- ≤ 600px: a single column; Rechazar and Aceptar at 50/50; Configurar below.
- The mobile bar is hidden while `body.cc-open` is set.

### 9.3 Toast

- `<div id="toast" role="status" aria-live="polite" class="toast" hidden>`.
- Fixed `top: 72px` (64 on phone) at the left gutter, Humo background, 1px Luz top hairline, padding 12px 16px, Jost 500 15px Ajo.
- Fade in .3s, hide after 2.6s.

---

## 10. Accessibility and performance rules (checklist)

- **Contrast:** every text pair ≥ 4.5:1 (see 2.1), and every UI boundary ≥ 3:1 (Cordel). No text colour is ever produced by lowering opacity, except transient armed states ≤ 1.2s.
- **Focus:** a visible 2px Luz outline everywhere, including inside the sheet, menu and cookie strip. The skip link is the first focusable element.
- **Keyboard:** everything works by keyboard, including FAQ, menu (Esc, trap), sheet (Esc, trap), copy buttons, the demo toggle and the form.
- **Semantics:**
  - `header`, `nav[aria-label="Principal"]`, `main#contenido`, `section[aria-labelledby]`, `footer`;
  - a single `h1`; h2 per section; h3 for dishes, rows, FAQ questions and grupos;
  - decorative SVG and canvas are `aria-hidden="true"`;
  - the dial is `aria-hidden` and the week list is real text.
- **Touch targets:** ≥ 44×44. Nothing depends on hover (hover effects are desktop enhancements inside `@media (hover:hover)`).
- **360px:**
  - 16px gutters;
  - `html, body { overflow-x: clip }`;
  - lamp cones and pools contained by `overflow: clip` on their sections;
  - no element wider than the viewport. Test `document.documentElement.scrollWidth === innerWidth` at 360, 390, 768, 1024, 1440 and 1920.
- **Reduced motion:** 3.2.
- **Readable at rest:** 3.1. Test with JS disabled and with GSAP blocked. The page must be complete and lit in both.
- **Canvas:**
  - DPR caps: engrave desktop 1.5, phone 2 (adaptive down); haze 0.5 × min(DPR, 2), 30fps;
  - render on demand;
  - pause off-screen and on `visibilitychange`;
  - handle `webglcontextlost` and `webglcontextrestored`;
  - canvases have `width` and `height` set from `getBoundingClientRect() × dpr`, recomputed on `ResizeObserver` (debounced 150ms). A G-buffer re-bake happens only on size change, and only while dark or idle.
- **`will-change`** only while a tween runs.
- **Fonts:** `display=swap`; call `ScrollTrigger.refresh()` after `document.fonts.ready`.
- **No layout shift from the status:** the status text containers have `min-width` in `ch` with tabular numerals.
- **Storage:** only the kit uses it (try/catch). The page itself stores nothing.
- **Console:** zero errors on load and while scrolling at 360 and 1440, with and without WebGL (test by forcing `getContext` to return null).

---

## 11. QA acceptance (screens the builder must check before handing over)

1. **Hero:**
   - 1440×900 and 360×640, at t = 0.2s, 0.8s and 2.5s: the intro plays, the plate appears with the light, the H1 is fully legible at the end, and there is no leftover mask;
   - at 360×640 the "Reservar mesa" bottom is ≤ 600px;
   - the text-safe rule holds at 1024, 1280, 1440 and 1920.
2. **El pase:** each dish at p = .5 at 1440 and at 360 (DPR 1 and 2). The dish is recognisable, the lines are crisp with no moiré, and the crust reads warm. A fast flick from dish 0 to 3 never shows the wrong dish lit.
3. **Allioli:** P = 0, .4, .65 and 1. The final frame shows "Gallioli" in Carbón on near-solid white, with no mask left at P = 1.
4. **La sala:** the lamps lit, the plant shadows readable as real shadows (not clip-art), and text contrast over the pools OK.
5. **Carta:** desktop lamp pool on the Humo plane; phone sticky category titles; a "called" row from El pase and from Sobremesa.
6. **Formas:** hover on desktop and centre detection on phone. Dimmed rows are still readable (Piedra).
7. **Sobremesa:** the lit quote follows the centre, and the sticky lamp rig does not cover text or block clicks.
8. **Esta noche:** vignette on approach, the header not dimmed, haze re-parented, and the headline correct for four clocks:
   - Wednesday 18:00 → "Tu mesa, esta noche." (dinner today not ended);
   - Tuesday 10:00 → "Tu mesa, hoy." (lunch only, not ended);
   - Sunday 17:00 → "Tu mesa, el martes." (Monday is closed, so the next opening day is Tuesday, k = 2);
   - Monday 10:00 → "Tu mesa, mañana."

   Check each with the demo clock or by stubbing `now()`.
9. **Visítanos:** the dial marker at now, today's row, the countdown ticking, the mobile layout.
10. **Form:** empty submit (summary and focus on the first error); invalid email; a date in the past; two links; valid data → the "no está conectado" message; the honeypot silently "succeeds".
11. **Mobile menu, mobile bar** (hidden over the hero, Esta noche, the Visítanos actions and the form; hidden with the menu, cookies or sheet open), **cookie strip, legal sheet** (privacidad, terminos, #cookies, #404, Esc, focus return).
12. **Reduced motion** (emulate): the whole page static, lit and complete.
13. **JS disabled:** the whole page readable. The canvases are empty; the typographic plates are visible because they are the no-JS default; the lamps are lit.

---

## 12. Copy deck (new lines written for B; everything else is verbatim from content.md)

| Where | Text |
|---|---|
| title | Gallioli a media luz |
| Hero H1 | Gallioli Bistrot / Al carbón, a media luz. |
| Hero sub | Bistrot de barrio en Sant Gervasi. Pollo al carbón, croquetas y el allioli de la casa: en la sala, para recoger o a domicilio. |
| Hero fact line | 4,8 en Google · 745 reseñas · 10–20 € por persona · Ronda del General Mitre, 220 |
| La sala Jost line | Cocina al carbón, producto km 0 y pedidos para llevar. |
| Platos H2 / intro | Del pase, a la mesa. / Cuatro platos de la casa, uno a uno. |
| Platos link | Ver en la carta · Ver la carta completa |
| Carta line | Todo se comparte en el centro de la mesa. Entre 10 y 20 € por persona. |
| Allioli H2 | Gallioli, en dos palabras |
| Formas H2 / rows | Aquí o en casa. / En la sala · Para recoger · En tu casa |
| Sobremesa H2 / head / closer | De sobremesa / 4,8 de 5 en Google, con 745 reseñas. / Lo más nombrado: las croquetas, el boniato, el fried chicken y el canelón. |
| Preguntas H2 | Lo que conviene saber |
| Esta noche H2 | Tu mesa, esta noche. · Tu mesa, hoy. · Tu mesa, mañana. · Tu mesa, el {día}. |
| Esta noche phone | o llama al 932 22 77 38 |
| Grupos H3 | Mesas largas y celebraciones |
| Footer | Bistrot de barrio en Sant Gervasi. · Propuesta de diseño para Gallioli Bistrot (opción B). No es la web oficial del restaurante. · Ver la sala abierta (demostración) / Volver a la hora real |
| Stage captions | {Plato} · grabado |

Nothing in B invents a fact: no chef, year, award, supplier, price or availability promise.

---

## 13. Changes from the winning proposal (and why)

1. **Food in the first screen** (mustFix): the hero cone lands on a baked engraving of croquetas and allioli in a textured pool.
2. **Pools are always textured and tied to a visible lamp**, so none is a glow blob (mustFix). La sala's pools carry plant cast shadows (graft from Claroscuro; pothos, kentia and ficus, never monstera).
3. **Blur is cut back** to the H1 name line, display H2s, El pase dish names and the Esta noche headline. Phones get 4px. Everything else uses luminance or opacity (mustFix).
4. **Bodoni is 20px or larger only**, with weight 500 below 32px. All small text is in Jost (mustFix).
5. **Arrows are inline SVG.** Testing showed that neither font has ↗ → ↓. The judges' claim that Bodoni's symbol subset covers them is wrong.
6. **Mobile bar:** Humo with a Luz button and a Luz top edge, instead of a full Luz bar (mustFix).
7. **The engraving engine is now G-buffer plus shading pass:**
   - pitch is fixed in CSS px;
   - phone DPR goes up to 2 (mustFix: crisp lines);
   - scene switches are keyed to the caption index and happen in darkness;
   - the 18° yaw is replaced by a CSS dolly, so the G-buffer stays valid.
8. **Crust lines are warmer** (Tostado→Ajo ramp), for appetite (mustFix). Allioli stays pure Luz.
9. **Formas hover dims by luminance steps, not 45% opacity**, because opacity failed contrast (Ajo would drop to 3.85:1).
10. **The closing vignette excludes the header** (header text would drop to 1.65:1) and peaks at .7.
11. **La sala's lamps light once, not scrubbed.** A scrubbed light-up would repeat the A/Marbar scroll tic.
12. **Status heat ramp** (graft from Luz de brasa) plus a **demo override** (graft from Claroscuro): a hash plus a footer toggle, because a hash cannot be typed inside the Artifact viewer.
13. **Nav reads "Reseñas"** instead of "Sobremesa", for clarity. The section keeps the title "De sobremesa".
14. **New `--cordel` token**, so field underlines, the checkbox and outlines reach 3:1.
15. **Rejected grafts:**
   - The Ajo paper-sheet carta (from Claroscuro): Alex disliked a dark-on-light section. The carta stays a lit Humo plane under a lamp.
   - The book-plate mount: it conflicts with the physical pass scene. Only the honest "grabado" caption is kept.
   - The dictionary-entry name story: A's line already carries it.
16. **Formas H2 is "Aquí o en casa."**, to avoid echoing A's "Aquí, para llevar o en tu casa".
17. **Esta noche headline** adds "Tu mesa, hoy." (open at lunch with no dinner) and "Tu mesa, mañana.", so the words match the real hours.

# Gallioli Bistrot: content inventory from Option A

Source: `/home/user/idk/gallioli/index.html` (1352 lines, read in full), plus `privacidad.html`, `terminos.html`, `404.html`, `assets/consent.js`, `README.md`.
All Spanish copy below is verbatim from Option A. Nothing here is invented; where a fact does not exist in the files it says so.

---

## 1. Identity

| Field | Value (verbatim) |
| --- | --- |
| Name | Gallioli Bistrot (logo renders as "**G**allioli", the G in allioli yellow) |
| `<title>` | Gallioli Bistrot \| Pollo a la brasa y croquetas en Sant Gervasi, Barcelona |
| Meta description | Bistrot en Sant Gervasi, Barcelona: pollo al carbón, Gallitos Fried Chicken, croquetas y allioli. 4,8 ★ en Google. Reserva mesa, recoge o pide a domicilio. |
| OG title | Gallioli Bistrot · Pollo a la brasa, croquetas y allioli |
| OG description | Bistrot de barrio en Sant Gervasi, Barcelona. Pollo al carbón, croquetas y el allioli de la casa. Reserva mesa, recoge o pide a domicilio. |
| Twitter description | Bistrot de barrio en Sant Gervasi, Barcelona. Reserva mesa, recoge o pide a domicilio. |
| OG image alt | Gallioli Bistrot, pollo a la brasa y croquetas en Sant Gervasi, Barcelona |
| Hero tagline | Pollo a la brasa, croquetas y *el allioli de la casa.* (the italic part is `<em>`, yellow) |
| Hero eyebrow | Bistrot · Sant Gervasi · Barcelona |
| Rotating badge text | Al carbón · Producto km 0 · Sant Gervasi · (core letter: G) |
| Neighbourhood | Sant Gervasi; full form "Sarrià-Sant Gervasi" |
| Address | Ronda del General Mitre, 220 · 08006 Barcelona |
| Plus code | C44W+6P Barcelona |
| Phone | 932 22 77 38 (JSON-LD: +34 932 22 77 38) |
| Instagram | @galliolibistrot · https://www.instagram.com/galliolibistrot/ |
| Google rating | 4,8 (starbar filled to 96 %) |
| Google review count | 745 reseñas |
| Price | 10–20 € por persona (JSON-LD priceRange "10-20 €") |
| Cuisine (JSON-LD) | "Pollo a la brasa", "Tapas", "Mediterránea"; acceptsReservations: true |
| Founding / "since" facts | **None.** No founding year, "desde" or history exists anywhere in the site or git history. Do not add one. |
| Canonical / domain | https://www.tudominio.com/ (placeholder) |
| Theme colour / manifest | #0F2A1E; manifest name "Gallioli Bistrot", short_name "Gallioli" |

### URLs used
Every booking, ordering and directions link is the same Google Maps search URL. Exact value in the HTML (`&amp;` is the HTML-escaped `&`):

```
https://www.google.com/maps/search/?api=1&amp;query=Gallioli+Bistrot+Ronda+del+General+Mitre+220+Barcelona
```
Unescaped: `https://www.google.com/maps/search/?api=1&query=Gallioli+Bistrot+Ronda+del+General+Mitre+220+Barcelona`

Where it's used, by class:
- `.js-reserva` "Reservar mesa", with `data-loc` = `cabecera`, `menu`, `portada`, `en-el-local`, `esta-noche`, `visitanos`, `barra-movil`
- `.js-pedir` "Pedir online →" (delivery card)
- `#maps` "Cómo llegar"
- All open in a new tab (`target="_blank" rel="noopener"`).
- README: "ahora todos los botones «Reservar mesa» y «Pedir online» llevan a la ficha de Google Maps. Sustituye esa URL por el enlace directo de last.app y de la plataforma de pedidos." (v1 had `// TODO: enlace directo de last.app`.) The booking platform is therefore last.app, but no real last.app URL exists yet.

Other links: `privacidad.html`, `privacidad.html#cookies`, `terminos.html`, anchors `#inicio #casa #estrella #carta #resenas #faq #visita #grupos #contenido`.

---

## 2. Opening hours

### JS (source of truth for the live status)
```js
const DAYS = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];
const L = [750, 960], D = [1200, 1380];
const HOURS = { 0: [L], 1: [], 2: [L], 3: [L, D], 4: [L, D], 5: [L, D], 6: [L, D] };
```
Minutes since midnight. L = 12:30–16:00 (lunch), D = 20:00–23:00 (dinner).

| Day | Hours |
| --- | --- |
| Lunes | Cerrado |
| Martes | 12:30–16:00 |
| Miércoles | 12:30–16:00 · 20:00–23:00 |
| Jueves | 12:30–16:00 · 20:00–23:00 |
| Viernes | 12:30–16:00 · 20:00–23:00 |
| Sábado | 12:30–16:00 · 20:00–23:00 |
| Domingo | 12:30–16:00 |

The week list renders in order Martes → Lunes (`[2, 3, 4, 5, 6, 0, 1]`), each row `<span>Día</span><span>hh:mm–hh:mm  ·  hh:mm–hh:mm</span>` or "Cerrado". Today's row gets class `today` plus a "hoy" tag.

### JSON-LD (matches the JS)
```json
"openingHoursSpecification": [
  { "@type": "OpeningHoursSpecification", "dayOfWeek": ["Tuesday", "Sunday"], "opens": "12:30", "closes": "16:00" },
  { "@type": "OpeningHoursSpecification", "dayOfWeek": ["Wednesday", "Thursday", "Friday", "Saturday"], "opens": "12:30", "closes": "16:00" },
  { "@type": "OpeningHoursSpecification", "dayOfWeek": ["Wednesday", "Thursday", "Friday", "Saturday"], "opens": "20:00", "closes": "23:00" }
]
```

### How the live status is computed
- `now()` reads the current time in **Europe/Madrid**: `Intl.DateTimeFormat("en-GB", { timeZone: "Europe/Madrid", weekday: "short", hour, minute, second, hour12: false })`. It returns the day index 0–6 (Sun=0), the minute of the day and the second.
- `status()`: if the current minute falls inside a slot `[a, b)` for today, the place is open, and it returns:
  - `text`: "Abierto · hasta las HH:MM"
  - `short`: "Abierto hasta las HH:MM"
  - `left`: the seconds until closing
  - `label`: "para el cierre"
- Otherwise it scans the next 8 days (k = 0..7) for the next opening. It returns `text` "Cerrado · abre {hoy | mañana | el <día en minúscula>} a las HH:MM", `short` "Abre {…} a las HH:MM", `left` the seconds until opening, and `label` "para abrir".
- `tick()` runs every 1 s and updates the following:
  - Header pill `#pill-text` gets `text`. Class `is-open` turns the dot green and pinging; when closed the dot is chili red.
  - Mobile bar pill `#mcta-text` gets `short`.
  - `#now-state` shows "Abierto ahora" (green #7FD69B) or "Ahora cerrado" (allioli yellow).
  - `#now-count` shows a countdown in the form `"{h} h "` (only if h > 0) + `"MM min SS s "` + label, e.g. "1 h 05 min 09 s para abrir".
  - The week row for today is highlighted.
  - Closing band headline: "¿Cenamos esta noche?" if today has a dinner slot (start ≥ 20:00) that has not ended yet, otherwise "¿Cenamos pronto?".
  - Closing band status line `#tonight-st` = `text + " · " + countdown`.
- Initial placeholder text before JS runs: "Horario".
- Hero fact: "20:00 · abrimos para cenar".

---

## 3. Sections of Option A, in order

### 3.0 Header (fixed)
- Skip link: "Saltar al contenido"
- Logo "Gallioli" (aria-label "Gallioli Bistrot, inicio")
- Nav: La casa · Platos · Carta · Reseñas · Visítanos
- Live status pill (default "Horario")
- Button: "Reservar mesa" (data-loc cabecera)
- Hamburger (aria "Abrir menú" / "Cerrar menú")
- **Mobile menu** links: La casa · Platos · Carta · Reseñas · Preguntas · Visítanos. Footer of the menu: "Reservar mesa →" plus "932 22 77 38 · Ronda del General Mitre, 220"

### 3.1 Hero (`.hero`, aria "Presentación")
- Eyebrow: Bistrot · Sant Gervasi · Barcelona
- H1 wordmark: GALLIOLI (aria "Gallioli Bistrot"), with an animated allioli "drizzle" SVG line under it
- Tagline: "Pollo a la brasa, croquetas y *el allioli de la casa.*"
- Side copy: "Un bistrot de barrio lleno de plantas en la Ronda del General Mitre. Para cenar en pareja, con amigos, o para llevarte la cena a casa."
- CTAs: "Reservar mesa →" (portada) · "Ver la carta" (#carta)
- Facts row:
  - **4,8 ★** · 745 reseñas en Google
  - **10–20 €** · por persona
  - **20:00** · abrimos para cenar
  - **3** · formas: en el local, recoger o a domicilio
- Rotating circular badge: "Al carbón · Producto km 0 · Sant Gervasi ·" around a yellow "G"

### 3.2 Marquee (yellow band, aria-hidden)
Gallitos Fried Chicken · Croquetas Gallitos · Pollo al carbón · Patatas de boniato · Bravas · Alitas picantes · Canelón · Burrata · Pastel de queso (red dots as separators)

### 3.3 Manifesto (`.manifesto`, aria "La idea")
- Eyebrow: La idea
- Ghost outline background text: "Gallioli · Gallioli"
- Big serif paragraph (with inline mini-illustration pills after certain words: ember dots, croquetas, allioli drizzle, leaf):
  > Aquí el pollo se hace *al carbón* [brasas], las croquetas [croquetas] salen de la cocina sin parar y el ==allioli== [allioli] manda en la mesa. Producto de proximidad, platos para compartir y ==plantas por todas partes== [hoja].

  (*…* = `<em>` in chili red; ==…== = `<mark>` with an allioli highlighter.)
- Signature: "Gallioli Bistrot · Sant Gervasi"
- Decorative leaves (two SVG monstera-style leaves)

### 3.4 La casa (`#casa`)
- Eyebrow: La casa
- H2 (3 lines): "Brasa," / "plantas" / "y buena mesa"
- Lead: "Un comedor pequeño y cálido, con una decoración cuidada y plantas naturales. Funciona igual de bien para una cena tranquila en pareja que para una mesa larga con amigos."
- Pillars (line icon + title + text):
  1. **Al carbón**: "Pollo asado a la brasa, entero o para compartir, con sus patatas." (flame icon)
  2. **Producto km 0**: "Producto fresco y de proximidad, cocina de temporada." (sprout icon)
  3. **Para llevar**: "Encarga por teléfono y recoge en unos minutos, o pídelo a domicilio." (bag icon)
- Gallery (aria "Galería (fotos pendientes)"): three gradient placeholders with captions "Foto · El comedor" (wide, with swaying leaves), "Foto · Pollo al carbón" (ember gradient), "Foto · Croquetas" (allioli gradient). **No real photos exist.**

### 3.5 Signature dishes (`#estrella`)
- Eyebrow: Los imprescindibles
- H2: "Lo que" / "vuelve a pedirse"
- Intro: "Cuatro platos que salen una y otra vez en las reseñas de quienes ya han venido."
- Four panels, each with an index, title, serif line, stat, and an illustrated plate SVG with a sauce stroke:

| # | Dish | Serif line | Stat |
| --- | --- | --- | --- |
| 01 / 04 | Croquetas Gallitos | Cremosas por dentro, doradas por fuera. Las más nombradas de la casa. | **48** · reseñas hablan de las croquetas |
| 02 / 04 | Gallitos Fried Chicken | El pollo frito de la casa, crujiente y jugoso, con una salsa que la gente recuerda. | **33** · reseñas mencionan el fried chicken |
| 03 / 04 | Patatas de boniato | «Riquísimas», dicen. Dulces, crujientes y perfectas para acompañar. | **33** · reseñas recomiendan el boniato |
| 04 / 04 | Pollo al carbón | A la brasa, con patatas. Listo en unos minutos si lo encargas para llevar. | **15** · minutos tardó un encargo para llevar, según una reseña |

Plate art: croquetas are 3 brown ellipses with an allioli drizzle; fried chicken is 3 golden pieces with allioli; boniato is 4 orange fries with allioli; pollo is a brown chicken with 2 fries and a **red** (chili) sauce.

### 3.6 The allioli story (`#allioli`, aria "De dónde viene el nombre")
- Eyebrow: De dónde viene el nombre
- Equation (aria "Gall más allioli: Gallioli"): **GALL + ALLIOLI**. ALLIOLI is chili red, and its first "ALL" letters are marked `.dup` so they collapse away to form **GALLIOLI**.
- Mortar SVG illustration: green mortar, cream, garlic cloves, oil drops, wooden pestle, gloss
- Four steps:
  1. `01 / 04` **Ajo**: "Todo empieza con unos dientes de ajo y una pizca de sal, en el mortero."
  2. `02 / 04` **Aceite**: "Después, aceite de oliva, gota a gota. Sin prisa: si corres, la salsa se corta."
  3. `03 / 04` **Paciencia**: "La mano de mortero gira siempre en el mismo sentido, hasta que la salsa liga, blanca y espesa."
  4. `04 / 04` **Gall + allioli**: "Gall es gallo en catalán. Súmale allioli y tienes el nombre de la casa."
- Progress bar with 4 segments

### 3.7 Carta (`#carta`)
- Eyebrow: La carta
- H2: "Para compartir"
- Intro: "Platos pensados para poner en el centro de la mesa. De 10 a 20 € por persona."
- Every price is the literal placeholder **`— €`** (em dash, space, euro sign). Leader dots join each name to its price.

**Para picar** `06`
| Item | Tag | Price | Description |
| --- | --- | --- | --- |
| Croquetas Gallitos | Popular | — € | none |
| Patatas bravas | | — € | none |
| Patatas de boniato | | — € | none |
| Burrata | | — € | none |
| Arancini | | — € | none |
| Patatas fritas | | — € | none |

**Del pollo** `03`
| Item | Tag | Price | Description |
| --- | --- | --- | --- |
| Gallitos Fried Chicken | Popular | — € | Pollo frito crujiente con la salsa de la casa. |
| Pollo al carbón | | — € | A la brasa, con patatas. También para llevar. |
| Alitas picantes | Picante (red tag) | — € | none |

**Principales y postre** `03`
| Item | Tag | Price | Description |
| --- | --- | --- | --- |
| Hamburguesa | | — € | none |
| Canelón | | — € | none |
| Pastel de queso | | — € | none |

The layout has 2 columns: column 1 is "Para picar"; column 2 is "Del pollo" with "Principales y postre" stacked below it. There are 12 items in total.
Legal note (terminos.html): "La carta de esta web es orientativa y puede cambiar según la temporada o la disponibilidad del producto. Los precios válidos son los de la carta del local, con el IVA incluido."

### 3.8 Ordering modes (`#modos`)
- Eyebrow: Como prefieras
- H2: "Aquí, para llevar" / "o en tu casa"
- Intro: "Siéntate en el comedor, pasa a recoger tu pedido o recíbelo en casa."
- Three cards (animated line icons: table and chairs, bag, delivery scooter):

| Tag | Title | Text | Action |
| --- | --- | --- | --- |
| En el local | Mesa entre plantas | Un comedor acogedor para una cena en pareja o una mesa larga con amigos. | "Reservar mesa →" (Maps URL, data-loc en-el-local) |
| Recogida sin entrar | Encarga y recoge | Llama, haz tu pedido y pasa a buscarlo. Una clienta lo tuvo listo en 15 minutos. | "Copiar teléfono →" (copies the number) |
| A domicilio | La cena, en casa | Pollo al carbón, croquetas y boniato, directos a tu sofá. | "Pedir online →" (Maps URL, `.js-pedir`) |

### 3.9 Reviews (`#resenas`)
- Eyebrow: Reseñas en Google
- Score: **4,8** · starbar ★★★★★ at 96 % fill (aria "4,8 de 5 estrellas") · "745 reseñas"
- Bars, "Lo más mencionado":

| Label | Bar width | Value |
| --- | --- | --- |
| Croquetas | 100% | 48 |
| Boniato | 68.75% | 33 |
| Fried chicken | 68.75% | 33 |
| Canelón | 60.4% | 29 |

- Quotes carousel (5 quotes; avatar letter, author, meta):
  1. «Una experiencia deliciosa de principio a fin. Un ambiente encantador y acogedor, con una decoración impecable y hermosas plantas naturales.» by **Anna S.** (avatar A), "Local Guide · hace 5 meses"
  2. «Os recomiendo las croquetas y las bravas, y si os va el picante, las alitas.» from **Resumen de reseñas** (avatar G), "Google Maps"
  3. «Hemos ido a encargar cena para llevar y en 15 minutos ya teníamos todo preparado y listo para recoger.» by **Laura Ferrer** (avatar L), "Local Guide · hace 9 meses"
  4. «Muy rico todo, las patatas de boniato riquísimas y la hamburguesa espectacular.» from **Resumen de reseñas** (avatar G), "Google Maps"
  5. «La comida es buenísima, la salsa del pollo frito es muy rica.» from **Resumen de reseñas** (avatar G), "Google Maps"
- Individual star ratings per quote: **none given.**
- Controls: counter "01 / 05", 7 s progress bar, ← "Reseña anterior", → "Reseña siguiente"
- Legal note (terminos): "Las opiniones de clientes que citamos proceden de reseñas públicas en Google."

### 3.10 FAQ (`#faq`)
- Eyebrow: Antes de venir
- H2: "Lo que" / "nos preguntan"
- Side copy: "Si tienes otra duda, llámanos al 932 22 77 38 o escríbenos por Instagram."
- Button: "Copiar teléfono →"
- Q&A (the first is open by default):
  1. **¿Hace falta reservar?** Te lo recomendamos, sobre todo el fin de semana. Puedes reservar online o por teléfono.
  2. **¿Puedo encargar para llevar?** Sí. Llama, haz tu pedido y pasa a recogerlo sin entrar. El pollo al carbón con patatas y las croquetas son de lo más pedido para llevar.
  3. **¿Hacéis entrega a domicilio?** Sí, también puedes pedir a domicilio desde el botón de pedido online.
  4. **¿Cuánto cuesta cenar?** Entre 10 y 20 € por persona, según los propios clientes en Google.
  5. **¿Tenéis platos picantes?** Sí: si te va el picante, pide las alitas. Las bravas también llevan su punto.
  6. **¿Es un sitio LGBTQ+ friendly?** Sí. Aquí todo el mundo es bienvenido.

### 3.11 Closing CTA (`.tonight`, chili-red band, aria "Reserva")
- Background outline word: "Reserva · Reserva · Reserva"
- Eyebrow: Gallioli · Sant Gervasi
- H2 (dynamic): "¿Cenamos esta noche?" or "¿Cenamos pronto?"
- Live line: status text + " · " + countdown (e.g. "Cerrado · abre mañana a las 12:30 · 14 h 03 min 22 s para abrir")
- CTAs: "Reservar mesa →" (esta-noche) · button "932 22 77 38" (copies the number)

### 3.12 Visítanos (`#visita`)
- Eyebrow: Visítanos
- H2: "Te guardamos" / "sitio" ("sitio" in yellow)
- Left column: live state ("Abierto ahora" / "Ahora cerrado") + countdown; week list (see §2)
- Right column:
  - Address: "Ronda del General Mitre, 220"
  - Sub: "08006 Barcelona · Sarrià-Sant Gervasi"
  - Code: "C44W+6P Barcelona"
  - CTAs: "Reservar mesa →" (visitanos) · "Cómo llegar" (#maps)
  - Contact rows:
    - Teléfono / 932 22 77 38 / "Copiar número"
    - Instagram / @galliolibistrot / "Ver perfil"
  - Services (✓): Comer en el local · Recogida sin entrar · A domicilio · LGBTQ+ friendly

### 3.13 Group booking form (`#grupos`, inside Visítanos)
- Eyebrow: Grupos y consultas
- H3: "¿Sois un grupo grande?"
- Copy: "Cumpleaños, cenas de empresa o cualquier duda: escríbenos y te respondemos. Para una mesa normal, usa el botón de reserva."
- Form `name="consultas"`, `method="POST" action="/"`, `data-netlify="true"`, `netlify-honeypot="empresa"`, `novalidate`. Hidden `form-name=consultas`.

| Field | name | Type / limits | Required | Label |
| --- | --- | --- | --- | --- |
| Honeypot | empresa | text, off-screen | no | "No rellenes este campo" |
| Nombre | nombre | text, maxlength 80, autocomplete name | yes | Nombre |
| Email | email | email, maxlength 120 | yes | Email |
| Teléfono | telefono | tel, maxlength 20 | no | Teléfono (opcional) |
| Fecha | fecha | date, min = today | yes | Fecha |
| Personas | personas | number, 1–80 | yes | Personas |
| Mensaje | mensaje | textarea, 4 rows, maxlength 1000, live counter "0 / 1000" | yes | Mensaje |
| Privacidad | privacidad | checkbox | yes | He leído y acepto la política de privacidad. (link privacidad.html) |

- Submit: "Enviar consulta" (while sending: "Enviando…")
- Validation messages (verbatim):
  - nombre: "Escribe tu nombre."
  - email: "Escribe tu email." / "Revisa el email: parece incompleto."
  - telefono: "Revisa el teléfono: usa solo números, con al menos 9 cifras."
  - fecha: "Elige una fecha." / "La fecha no puede ser anterior a hoy."
  - personas: "Indica cuántas personas seréis." / "Indica un número entre 1 y 80."
  - mensaje: "Cuéntanos un poco más (mínimo 10 caracteres)." / "Quita los enlaces del mensaje, por favor."
  - privacidad: "Necesitamos que aceptes la política de privacidad para responderte."
  - Summary: "Revisa el campo marcado." / "Revisa los N campos marcados."
- Status messages:
  - Rate limit: "Ya hemos recibido una consulta hace un momento. Espera un minuto para enviar otra."
  - Bot, silently "succeeds": "Gracias. Te responderemos lo antes posible."
  - Not connected: "El formulario todavía no está conectado. Mientras tanto, llámanos al 932 22 77 38."
  - Success: "Consulta enviada. Te responderemos lo antes posible."
  - Error: "No se ha podido enviar. Inténtalo de nuevo o llámanos al 932 22 77 38."
- Legal text under the form: "Responsable: [RAZÓN SOCIAL]. Finalidad: responder a tu consulta. Base legal: tu consentimiento. No cedemos tus datos a terceros salvo obligación legal. Puedes ejercer tus derechos de acceso, rectificación y supresión, entre otros, como explica la política de privacidad."
- Send modes: `const FORM = { mode: "none", endpoint: "" }; // TODO` where the mode is `"none"`, `"netlify"` or `"endpoint"` (Formspree etc.).
- Antispam:
  - honeypot `empresa`
  - submission within 3 s of load is treated as a bot
  - 1 submission per 60 s
  - more than 1 link in the message is rejected

### 3.14 Footer
- Giant wordmark "GALLIOLI" (G in yellow)
- Row:
  - "Gallioli Bistrot · Ronda del General Mitre, 220 · Barcelona"
  - "932 22 77 38 · @galliolibistrot" (Instagram link)
  - Legal nav: Aviso legal (terminos.html) · Privacidad (privacidad.html) · Cookies (privacidad.html#cookies) · button "Preferencias de cookies" (`data-cookie-settings`)

### 3.15 Mobile sticky bar (`#mcta`, ≤760px)
- Live status pill (short text) + "Reservar mesa" (barra-movil)

### 3.16 Toast
- "Número copiado: 932 22 77 38". If the clipboard fails: "Llámanos al 932 22 77 38"

### 3.17 Other pages (exist; reuse as-is or restyle)
- `privacidad.html`: "Privacidad y cookies". Sections: Responsable, Qué datos tratamos, Finalidades y base legal, Conservación, Destinatarios, Tus derechos, Seguridad, Cookies, Cambios. Última actualización: 27 de septiembre de 2026.
- `terminos.html`: "Aviso legal y condiciones". Sections: Titular, Uso de la web, Reservas y pedidos, Carta y precios, Alérgenos, Propiedad intelectual, Responsabilidad, Protección de datos, Ley aplicable. Same date.
- `404.html`: "Aquí no queda ni una croqueta." / "La página que buscas no existe o ha cambiado de sitio. Vuelve al inicio para ver la carta, el horario o reservar mesa." / "Volver al inicio" · "Ver la carta" (4-plate-4 illustration)
- Cookie banner (`assets/consent.js`):
  - Title: "Cookies"
  - Text: "Guardamos tu elección en este navegador y, solo si lo aceptas, usamos cookies de analítica (Google Analytics) para saber qué partes de la web se visitan. Más información"
  - Options:
    - Técnicas: "Necesarias para recordar tu elección. Siempre activas."
    - Analítica: "Google Analytics, con IP anonimizada. Nos ayuda a mejorar la web."
  - Buttons: Rechazar / Configurar (becomes "Guardar selección") / Aceptar
  - localStorage key: `gallioli-consent-v1`
- Shared files: `assets/consent.css`, `assets/legal.css`, favicon.svg/.ico, apple-touch-icon.png, icon-192/512.png, site.webmanifest, og-image.jpg (1200×630), sitemap.xml, robots.txt, .htaccess, netlify.toml.

---

## 4. Interactive features and animations in Option A
The new site should keep an equivalent of each, in a different form.

**Stack:** GSAP 3.13.0 + ScrollTrigger (cdnjs), vanilla JS, one canvas, inline SVG illustrations. Fonts: Big Shoulders Display (condensed display), Newsreader (italic serif), Hanken Grotesk (body), Martian Mono (labels). Palette:
- fern green #0F2A1E / #163726 / #22503A
- bone #ECEDE6 / #E0E3D8
- allioli yellow #F1D27A
- ember #E8893A
- chili #C9432B
- muted #56665C / #A7B6AC

Option B should look clearly different from all of this.

### Page-level
1. **Intro curtain.** A fern-green full-screen layer with a yellow "G" that scales in with back-ease, then lifts and fades. The curtain wipes up via `clipPath inset(0 0 100% 0)`. Then:
   - the GALLIOLI wordmark rises letter by letter (yPercent 105, rotate 6, stagger .055)
   - the allioli drizzle SVG line draws in
   - the hero texts fade up in a stagger
   - the badge spins in from scale 0
   - a 6 s fallback forces the intro to finish
2. **Header** hides on scroll down (after 300px) and returns on scroll up. Nav links get a hover underline that sweeps left to right.
3. **Live open/closed pill** with a pinging green dot (red when closed), updated every second.
4. **Button hover:** the fill slides up from below, the arrow nudges right.
5. **Headline line-mask reveals** (`.js-lines`, yPercent 110 stagger) and **block rise-ins** (`.js-up`) on every section.
6. **Animated number counters** (`.js-count`): 4,8 · 745 · 48 · 33 · 33 · 15, with Spanish decimal comma.
7. **Green sections open from a framed rounded card to full-bleed** on scroll: `clipPath inset(4% 3% 0 3% round 28px)` becomes full. Applies to stars, modos and visita.
8. **Smooth anchor scrolling**; skip link; focus rings.
9. **prefers-reduced-motion:** all animation off, the carousel doesn't autoplay, everything is visible.

### Hero
10. **Canvas ember particles** rising from the bottom (70 particles, 34 on narrow screens) in yellow/orange/red with additive blending. They pause when off-screen.
11. **Breathing radial glow** (ember/chili).
12. **Rotating circular text badge** (continuous 22 s spin + scroll-scrubbed extra rotation).
13. **Hero parallax** on scroll-out (content drifts down and fades to .35).

### Sections
14. **Marquee** of dish names with scroll-velocity inertia: it speeds up or reverses with scroll, then eases back.
15. **Manifesto:**
    - Scroll-scrubbed word-by-word "light-up" from opacity .15 to 1.
    - Inline illustration pills pop in with scale and rotate.
    - Yellow highlighter `<mark>` fills left to right in sync.
    - Ghost outline text slides horizontally (parallax).
    - Leaves drift and rotate.
    - Signature slides in.
16. **La casa:** pillar icons draw their strokes on. Photo placeholders reveal with a clip-path curtain from the bottom plus an inner parallax/zoom. Leaves sway continuously.
17. **Signature dishes:**
    - Desktop (≥901px): the section is **pinned and scrolls horizontally** through 4 panels.
    - Each plate spins in (rotate -50 → 0, scale .82), its sauce stroke draws, and its title rises.
    - Plates keep rotating as they pass.
    - Mobile: stacked vertically, same entry animations.
18. **Allioli mortar story** (viewport height ≥600px): the section is **pinned for 320 % of scroll** and scrubbed. It plays in order:
    1. Garlic cloves bounce into the mortar.
    2. Oil drops fall twice while the cream grows.
    3. The pestle drops in and grinds side to side, cloves squash away, and the cream turns glossy.
    4. The pestle flies out, and the "GALL + ALLIOLI" equation collapses into "GALLIOLI": the plus and the duplicate "ALL" shrink away and the red turns green.

    Step captions cross-fade, and a 4-segment progress bar fills.
19. **Carta:** category titles and rows stagger up; dotted leader lines draw from left.
20. **Ordering modes:**
    - Cards rise with a 3D tilt (rotateX -16) and their icons draw on.
    - On hover: the card lifts, a yellow underline bar sweeps, the chairs slide apart, the bag handle lifts, the scooter wheels spin and speed lines appear.
21. **Reviews:**
    - The 4,8 starbar fills.
    - "Most mentioned" bars grow.
    - An **auto-advancing quote carousel** (7 s timed progress line) with word-by-word quote entry, footer fade, a prev/next buttons and a "01 / 05" counter. It starts when scrolled into view.
22. **FAQ accordion:** smooth height via grid-rows; the +/– icon rotates and fills; the question text nudges on hover; rows stagger in. The first item is open by default.
23. **Closing CTA band:** dynamic headline (esta noche / pronto), live status + second-by-second countdown, pulsing radial glow, outline "Reserva" word parallax.
24. **Visítanos:** live state + countdown; week list with today highlighted "hoy"; rows slide in.
25. **Copy-phone buttons** (4 of them) copy to the clipboard and show a toast.
26. **Group form:**
    - Live validation on blur and input, aria-invalid, and a character counter.
    - Antispam (see §3.13).
    - Three send modes.
    - Netlify-ready.
27. **Footer:** giant GALLIOLI rises letter by letter.

### Mobile
28. **Mobile menu:** a full-screen circular clip-path reveal expanding from the hamburger. Links stagger in. The hamburger morphs to an X. Esc closes the menu, and it auto-closes on resize above 960px.
29. **Mobile sticky booking bar:** it slides up after the hero. It hides again when the hero, the Visítanos CTAs, the group form or the closing CTA are in view, or when the menu or cookie banner is open.

### Plugins / integrations
30. **Cookie consent + GA4** (`assets/consent.js`): GA loads only after "Aceptar" or config; its cookies are deleted on withdrawal. Analytics events:
    - `reserva_click` {ubicacion: data-loc}
    - `pedido_click`
    - `como_llegar_click`
    - `telefono_copiado`
    - `consulta_enviada`
31. **SEO:** JSON-LD Restaurant, OG/Twitter cards, canonical, sitemap, robots, manifest, icons. **Hosting:** .htaccess (HTTPS, 404, security headers) and netlify.toml.

---

## 5. Placeholders and TODOs
- **Domain:** `https://www.tudominio.com` in canonical, og:url, og:image, twitter:image, JSON-LD url/image, sitemap.xml, robots.txt, netlify.toml and the legal pages.
- **Booking link:** every "Reservar mesa" goes to the Google Maps search URL. It should become the direct **last.app** link (README). No real URL is known.
- **Online ordering link:** "Pedir online" goes to the same Maps URL. The delivery platform is **unknown**.
- **Carta prices:** all 12 are `— €`. Only 2 items have descriptions.
- **Photos:** none exist. The gallery is labelled "Galería (fotos pendientes)" with captions "Foto · El comedor", "Foto · Pollo al carbón", "Foto · Croquetas". The plates are SVG illustrations. og-image.jpg exists (1200×630).
- **Form:** `const FORM = { mode: "none", endpoint: "" }; // TODO: configurar al publicar (ver README.md)`
- **Google Analytics:** `const GA_ID = "G-XXXXXXXXXX"; // TODO` in assets/consent.js
- **Legal holder:**
  - `[RAZÓN SOCIAL]` in the index.html form legal text.
  - In privacidad/terminos: `[RAZÓN SOCIAL O NOMBRE DEL TITULAR]`, `[NIF]`, `[DOMICILIO SOCIAL]`, `[EMAIL DE CONTACTO]`, `[REGISTRO MERCANTIL, TOMO, FOLIO Y HOJA, si es una sociedad]`, `[PROVEEDOR DE HOSTING]`, `[PROVEEDOR DEL FORMULARIO, p. ej. Netlify o Formspree]`.
- **README step 6:** "Horario, precios de la carta y fotos: revisar y completar." The hours are therefore also marked as to-verify.
- **No email address** for the restaurant exists (only `[EMAIL DE CONTACTO]`).
- **No founding year / "since"**, no chef name, no owner name, no allergen list, no menu prices anywhere.

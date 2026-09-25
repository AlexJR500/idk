# Marbar · Web

Web de una sola página para **Marbar** (Pg. de la Bonanova, 77 · Sarrià-Sant Gervasi, Barcelona).

Abre `index.html` en el navegador; no necesita build. GSAP (ScrollTrigger, SplitText, Flip) va incluido en `vendor/`.

## Dirección de diseño
Estilo editorial mediterráneo: Cormorant Garamond para los titulares y Manrope para el texto, arcos como forma de la casa y una paleta propia en la que cada sección tiene su color:

| Sección | Tema | Color |
|---|---|---|
| Portada y pie | Tinta | `#0f1a22` + latón `#c8a165` |
| La casa | Hueso | `#f3ede2` + terracota |
| Experiencia | Oliva | `#2a321e` |
| Carta | Vino | `#3d1520` |
| Reseñas | Lino | `#e9dfcf` |
| Reserva | Terracota | `#a4471f` |
| Visítanos | Mar | `#173a4e` |

Los colores se definen como tokens en `:root` y cada sección declara el suyo con `data-theme` (ver el principio de `styles.css`).

## Animaciones e interacción
- Pantalla de carga con el logo dibujándose y cinco cortinas con la paleta de la casa (solo la primera visita de la sesión).
- Portada con ventana en arco que se abre, atardecer animado (sol, olas, barco y reflejos), sello giratorio con la nota y titular letra a letra.
- El arco sigue al ratón en capas y, al bajar, el sol se pone.
- El fondo de toda la página se funde de un color a otro según la sección que tienes delante; la barra de navegación y el cursor se adaptan.
- Marquesina que acelera y cambia de sentido con el scroll.
- Frase de "La casa" que se enciende palabra a palabra y muestrario de colores en arcos.
- "Experiencia" con scroll horizontal fijado (escritorio) y tarjetas en arco.
- Carta como una carta impresa (puntos guía y precios), pestañas con píldora deslizante, filtros animados (Flip) y el plato "vuela" hasta tu mesa, que calcula el precio por persona.
- Reseñas en dos marquesinas infinitas (se frenan al pasar el ratón y tienen botón de pausa).
- Reserva con barra de progreso, validación por campo y modal con check animado que abre WhatsApp.
- Letras del pie que se colorean al pasar el ratón, cursor personalizado y botones magnéticos en escritorio.
- Respeta `prefers-reduced-motion`: sin parallax, pin ni pantalla de carga.

## Antes de publicar
Los platos, precios, reseñas y el horario de apertura (13:00) son **orientativos**. Edita los datos reales en `script.js`:
`MENU`, `REVIEWS` y `HOURS`.

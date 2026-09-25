# Marbar · Web

Web de una sola página para **Marbar** (Pg. de la Bonanova, 77 · Sarrià-Sant Gervasi, Barcelona).

Abre `index.html` en el navegador; no necesita build. GSAP (ScrollTrigger, SplitText, Flip) va incluido en `vendor/`.

## Animaciones e interacción
- Pantalla de carga con el logo dibujándose y cortina de salida (solo la primera visita de la sesión).
- Titular del hero letra a letra, sol y olas con parallax, burbujas y grano animado.
- Marquesina que acelera y cambia de sentido según el scroll.
- Frase de filosofía que se "enciende" palabra a palabra al hacer scroll.
- Sección "Experiencia" con scroll horizontal fijado (escritorio) y tarjetas que rotan al entrar.
- Carta con pestañas de píldora deslizante, filtros animados (Flip), tarjetas con foco de luz e inclinación 3D, y el plato "vuela" hasta tu mesa.
- Reseñas en dos marquesinas infinitas (se frenan al pasar el ratón y tienen botón de pausa).
- Reserva con barra de progreso, validación por campo y modal con check animado que abre WhatsApp.
- Cursor personalizado y botones magnéticos en escritorio.
- Respeta `prefers-reduced-motion`: sin parallax, pin ni pantalla de carga.

Dirección de diseño basada en UI UX Pro Max (restaurante: estilo "motion-driven", colores cálidos, Playfair Display + Karla, iconos SVG Lucide, contraste AA en CTAs).

## Antes de publicar
Los platos, precios, reseñas y el horario de apertura (13:00) son **orientativos**. Edita los datos reales en `script.js`:
`MENU`, `REVIEWS` y `HOURS`.

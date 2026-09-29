# Gallioli Bistrot · opción B «A media luz»

Segunda propuesta de diseño para Gallioli Bistrot, pensada para enseñarla junto a la web de `gallioli/` (opción A).

- Concepto: la cena a las 21:30. Fondo carbón, una lámpara como marca y los platos dibujados como grabados blancos que la luz recorre al hacer scroll.
- Tipografías: Bodoni Moda y Jost (Google Fonts). Animaciones con GSAP 3.13 y ScrollTrigger (cdnjs). Los grabados y la luz son WebGL, con alternativa tipográfica si el navegador no lo soporta.
- Contenido: el mismo que la opción A (dirección, horario, teléfono, carta con precios pendientes, reseñas, preguntas).

## Archivos

| Ruta | Qué es |
| --- | --- |
| `index.html` | La página generada, en formato de vista previa (sin `<!doctype>`/`<head>`: el visor añade el esqueleto). Incluye la etiqueta «Propuesta de diseño · No es la web oficial». |
| `src/` | Las piezas que se editan: CSS, HTML por sección y JS (`60_gl.js` son los grabados y la luz). |
| `build.py` | Une `src/` y `legal_kit.html` en `index.html`: `python3 build.py`. |
| `legal_kit.html` | Privacidad, aviso legal, 404 y banner de cookies como paneles dentro de la página (el mismo texto que la opción A). |
| `docs/` | Especificación de diseño, inventario de contenido e interfaz de los grabados. |

## Si el restaurante elige esta opción

Para publicarla en su dominio hay que añadir la cabecera HTML completa (metadatos, favicon, datos estructurados), quitar la etiqueta de propuesta y reutilizar las páginas legales, `sitemap.xml`, `robots.txt`, `.htaccess` y `netlify.toml` de `gallioli/`, adaptando sus estilos a esta paleta. Los datos pendientes son los mismos que en `gallioli/README.md`.

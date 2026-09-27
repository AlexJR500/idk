# Gallioli Bistrot · web

Web estática lista para subir a cualquier hosting. El contenido de esta carpeta es la raíz del sitio.

| Archivo | Para qué sirve |
| --- | --- |
| `index.html` | Página principal |
| `privacidad.html` | Política de privacidad y cookies |
| `terminos.html` | Aviso legal y condiciones de uso |
| `404.html` | Página de error para direcciones que no existen |
| `assets/consent.js`, `assets/consent.css` | Banner de cookies y carga de Google Analytics tras el consentimiento |
| `assets/legal.css` | Estilos de las páginas legales |
| `favicon.svg`, `favicon.ico`, `apple-touch-icon.png`, `icon-192.png`, `icon-512.png`, `site.webmanifest` | Iconos |
| `og-image.jpg` | Imagen de vista previa al compartir en redes y WhatsApp (1200 × 630) |
| `sitemap.xml`, `robots.txt` | Indexación en buscadores |
| `.htaccess` | Hosting Apache: fuerza HTTPS, usa la 404 propia y añade cabeceras de seguridad |
| `netlify.toml` | Lo mismo para Netlify |

## Antes de publicar

Busca y sustituye en todos los archivos:

1. `https://www.tudominio.com` → el dominio real (en `index.html`, `privacidad.html`, `terminos.html`, `sitemap.xml`, `robots.txt` y `netlify.toml`).
2. `[RAZÓN SOCIAL O NOMBRE DEL TITULAR]`, `[NIF]`, `[DOMICILIO SOCIAL]`, `[EMAIL DE CONTACTO]`, `[REGISTRO MERCANTIL…]`, `[PROVEEDOR DE HOSTING]`, `[PROVEEDOR DEL FORMULARIO…]` en `privacidad.html` y `terminos.html`, y `[RAZÓN SOCIAL]` en el texto bajo el formulario de `index.html`.
3. Enlace de reservas y de pedidos: ahora todos los botones «Reservar mesa» y «Pedir online» llevan a la ficha de Google Maps. Sustituye esa URL por el enlace directo de last.app y de la plataforma de pedidos.
4. Google Analytics: en `assets/consent.js`, cambia `G-XXXXXXXXXX` por el ID de medición de GA4. Mientras siga el valor de ejemplo, la analítica no se carga.
5. Formulario de grupos: en `index.html`, busca `const FORM =` y elige:
   - `mode: "netlify"` si la web está en Netlify (el formulario ya lleva los atributos de Netlify Forms y su campo trampa).
   - `mode: "endpoint"` con `endpoint: "https://formspree.io/f/…"` (u otro servicio) en cualquier otro hosting.
   - Con `mode: "none"`, el formulario valida los datos pero avisa de que no está conectado y da el teléfono.
6. Horario, precios de la carta y fotos: revisar y completar.

## Qué hace cada cosa

- **HTTPS forzado**: `.htaccess` redirige HTTP a HTTPS; en Netlify, GitHub Pages o Vercel es automático. Además, cada página pide al navegador que actualice cualquier recurso HTTP a HTTPS.
- **Cookies**: la analítica solo se activa si la persona pulsa «Aceptar» o la activa en «Configurar». «Rechazar» tiene el mismo peso que «Aceptar». El enlace «Preferencias de cookies» del pie permite cambiar la elección y borra las cookies de Google Analytics al retirarla.
- **Eventos de analítica**: `reserva_click` (con la sección desde la que se pulsa), `pedido_click`, `como_llegar_click`, `telefono_copiado` y `consulta_enviada`.
- **Antispam del formulario**: campo trampa oculto, bloqueo de envíos en menos de 3 segundos, un envío por minuto y rechazo de mensajes con varios enlaces. Si llega spam igualmente, se puede añadir Cloudflare Turnstile.
- **Llamada a la acción**: «Reservar mesa» es el único botón principal en toda la web; en móvil aparece además una barra fija al dejar la portada.

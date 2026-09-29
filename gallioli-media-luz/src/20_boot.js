/* Arranque: idioma, clase js y estado previo a la intro (solo si se permite el movimiento). */
document.documentElement.lang = "es";
var R = matchMedia("(prefers-reduced-motion: reduce)").matches;
document.documentElement.classList.add("js"); if (!R) document.documentElement.classList.add("pre");

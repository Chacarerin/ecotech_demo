// Aplica el tema guardado antes de que se pinte la página, para que no parpadee en claro.
// Es un archivo y no un <script> en línea porque la CSP del sitio no admite scripts en línea.
// El claro es el de omisión (CLAUDE.md §7): solo se oscurece si el usuario lo eligió.
try {
  if (localStorage.getItem('ecotech-tema') === 'oscuro') document.documentElement.classList.add('dark')
} catch (e) {
  /* sin almacenamiento, queda el tema claro */
}

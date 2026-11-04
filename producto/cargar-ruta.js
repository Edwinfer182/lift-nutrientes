/* Cada ruta de GitHub Pages carga la plantilla común sin cambiar la dirección. */
(async function () {
  'use strict';
  try {
    const response = await fetch('/producto/index.html', { cache: 'default' });
    if (!response.ok) throw new Error('No se pudo cargar la plantilla.');
    const template = await response.text();
    if (!template.includes('id="ficha-plantilla"')) throw new Error('La plantilla no está disponible.');
    document.open();
    document.write(template);
    document.close();
  } catch (error) {
    document.body.textContent = 'No se pudo abrir el producto. Recarga la página para volver a intentar.';
  }
})();

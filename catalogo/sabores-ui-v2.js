(() => {
  'use strict';

  function loadScript(src) {
    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = src;
      script.async = false;
      script.onload = resolve;
      script.onerror = reject;
      document.head.appendChild(script);
    });
  }

  (async () => {
    try {
      await loadScript('sabores-ui-v2-original.js?v=20260907');
      await loadScript('cupones-ui.js?v=20260907');
      await loadScript('catalogo-mejoras-ui.js?v=20260907b');
      await loadScript('catalogo-correcciones-marcas.js?v=20260907c');
      await loadScript('carrito-descuentos-ui.js?v=20260907d');
      await loadScript('filtro-seleccion-lift.js?v=20260907e');
      await loadScript('imagenes-tarjetas-ui.js?v=20260907f');
      await loadScript('compartir-carrito-ui.js?v=20260907g');
      await loadScript('logo-ui.js?v=20260907h');
      await loadScript('checkout-whatsapp-ui.js?v=20260907i');
    } catch (error) {
      console.error('Lift: no se pudieron cargar los módulos del catálogo', error);
    }
  })();
})();
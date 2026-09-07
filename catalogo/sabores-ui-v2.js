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
    } catch (error) {
      console.error('Lift: no se pudieron cargar los módulos del catálogo', error);
    }
  })();
})();

(() => {
  'use strict';

  const DRIVE = 'https://drive.google.com/thumbnail?id=';
  const SPECS = [
    {id:'insane-psychotic-black-60',name:'Psychotic Black',presentation:'60 Serv',brand:'Insane Labz',category:'Pre Entreno',price:165000,file:'1d6EpnMoclTqlZug_2XPEWpdNRCC3tQVQ'},
    {id:'insane-psychotic-gold-60',name:'Psychotic Gold',presentation:'60 Serv',brand:'Insane Labz',category:'Pre Entreno',price:195000,file:'1TUVGfgkV2URDzwNH18hzdebNVha6WKL9'},
    {id:'insane-psychotic-rojo-60',name:'Psychotic Rojo',presentation:'60 Serv',brand:'Insane Labz',category:'Pre Entreno',price:199000,image:'https://musclestmx.com/cdn/shop/files/Psychoticwatermelon60s_480x480_8b7fdfcb-6e7b-4887-9d79-bb393a46297c.webp?v=1695672329'},
    {id:'insane-psychotic-xtreme-30',name:'Psychotic Xtreme',presentation:'30 Serv',brand:'Insane Labz',category:'Pre Entreno',price:155000,file:'1yThfnm6QS1sQlC1ZVTf1Ek2uYa3xYFai'},
    {id:'insane-psychopath-30',name:'Psychopath',presentation:'30 Serv',brand:'Insane Labz',category:'Pre Entreno',price:150000,file:'1a3Rn_rUNed_-HXh8m7Il8t-w1LUDWonk'}
  ];

  const norm = s => String(s || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g,'')
    .replace(/[^a-z0-9]+/g,' ')
    .replace(/\s+/g,' ')
    .trim();

  function getList() {
    const windowLists = [window.PRODUCTS, window.products, window.catalogProducts, window.CATALOG_PRODUCTS].filter(Array.isArray);
    if (windowLists.length) return windowLists[0];

    // catalogo-base.html usa scripts clásicos. Las variables declaradas con
    // const/let no siempre aparecen en window, pero sí son accesibles desde
    // otro script clásico cargado en el mismo documento.
    try { if (typeof products !== 'undefined' && Array.isArray(products)) return products; } catch (_) {}
    try { if (typeof PRODUCTS !== 'undefined' && Array.isArray(PRODUCTS)) return PRODUCTS; } catch (_) {}
    try { if (typeof catalogProducts !== 'undefined' && Array.isArray(catalogProducts)) return catalogProducts; } catch (_) {}
    try { if (typeof CATALOG_PRODUCTS !== 'undefined' && Array.isArray(CATALOG_PRODUCTS)) return CATALOG_PRODUCTS; } catch (_) {}
    try { if (typeof productos !== 'undefined' && Array.isArray(productos)) return productos; } catch (_) {}
    return null;
  }

  function upsert(list) {
    let changed = false;
    for (const s of SPECS) {
      const name = norm(s.name);
      const presentation = norm(s.presentation);
      let p = list.find(x => {
        const brand = norm(x.brand || x.marca || '');
        const text = norm(`${x.name || x.nombre || ''} ${x.presentation || x.presentacion || ''}`);
        return brand.includes('insane labz') && text.includes(name) && text.includes(presentation);
      });

      const image = s.image || `${DRIVE}${s.file}&sz=w800`;
      if (!p) {
        p = {};
        list.push(p);
        changed = true;
      }

      const next = {
        id:s.id,
        name:s.name,
        nombre:s.name,
        presentation:s.presentation,
        presentacion:s.presentation,
        brand:s.brand,
        marca:s.brand,
        category:s.category,
        categoria:s.category,
        price:s.price,
        precio:s.price,
        image,
        imagen:image
      };

      for (const [key,value] of Object.entries(next)) {
        if (p[key] !== value) {
          p[key] = value;
          changed = true;
        }
      }
    }
    return changed;
  }

  function forceRender(list) {
    // Primero usamos el mismo flujo de filtros del catálogo. Esto evita crear
    // tarjetas paralelas que luego no funcionan con carrito/búsqueda.
    const controls = document.querySelectorAll(
      'input[type="search"], input[type="text"], select, [data-filter], [data-category], [data-brand]'
    );
    controls.forEach(el => {
      try { el.dispatchEvent(new Event('input', {bubbles:true})); } catch (_) {}
      try { el.dispatchEvent(new Event('change', {bubbles:true})); } catch (_) {}
    });

    // Compatibilidad con los nombres habituales de render usado en versiones
    // anteriores del catálogo. Se ejecuta solo el primero que exista.
    const renderers = [];
    try { if (typeof renderProducts === 'function') renderers.push(renderProducts); } catch (_) {}
    try { if (typeof renderCatalog === 'function') renderers.push(renderCatalog); } catch (_) {}
    try { if (typeof displayProducts === 'function') renderers.push(displayProducts); } catch (_) {}
    try { if (typeof mostrarProductos === 'function') renderers.push(mostrarProductos); } catch (_) {}
    try { if (typeof renderProductos === 'function') renderers.push(renderProductos); } catch (_) {}
    try { if (typeof applyFilters === 'function') renderers.push(applyFilters); } catch (_) {}
    try { if (typeof filtrarProductos === 'function') renderers.push(filtrarProductos); } catch (_) {}

    if (renderers.length) {
      const fn = renderers[0];
      try {
        if (fn.length > 0) fn(list);
        else fn();
      } catch (_) {
        try { fn(); } catch (__) {}
      }
    }
  }

  let attempts = 0;
  const boot = () => {
    attempts += 1;
    const list = getList();
    if (!list) {
      if (attempts < 40) setTimeout(boot, 100);
      else document.documentElement.dataset.liftInsaneLite = 'list-not-found';
      return;
    }

    const changed = upsert(list);
    forceRender(list);
    document.documentElement.dataset.liftInsaneLite = 'ready';
    console.info(`[Lift] Insane Labz listo: ${SPECS.length} productos. Cambios: ${changed ? 'sí' : 'no'}.`);
  };

  boot();
})();

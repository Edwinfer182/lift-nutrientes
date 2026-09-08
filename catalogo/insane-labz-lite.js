(() => {
  'use strict';

  const DRIVE = 'https://drive.google.com/thumbnail?id=';
  const SPECS = [
    {id:'insane-psychotic-black-60',name:'Psychotic Black',presentation:'60 Serv',brand:'Insane Labz',category:'Pre Entreno',price:165000,file:'1d6EpnMoclTqlZug_2XPEWpdNRCC3tQVQ'},
    {id:'insane-psychotic-gold-60',name:'Psychotic Gold',presentation:'60 Serv',brand:'Insane Labz',category:'Pre Entreno',price:195000,file:'1TUVGfgkV2URDzwNH18hzdebNVha6WKL9'},
    {id:'insane-psychotic-rojo-60',name:'Psychotic Rojo',presentation:'60 Serv',brand:'Insane Labz',category:'Pre Entreno',price:160000,image:'https://insanelabz.com/cdn/shop/files/Psychotic-60-Serving-Watermelon-Front.png?v=1774454161&width=1946'},
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

  const list = [window.PRODUCTS, window.products, window.catalogProducts, window.CATALOG_PRODUCTS].find(Array.isArray);
  if (!list) return;

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

  document.documentElement.dataset.liftInsaneLite = 'ready';
  if (changed) console.info('[Lift] Productos Insane Labz cargados.');
})();

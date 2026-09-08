(() => {
  'use strict';

  const DRIVE = 'https://drive.google.com/thumbnail?id=';
  const PRODUCTS = [
    { name:'Psychotic Black', presentation:'35 Serv', brand:'Insane Labz', category:'Pre Entreno', price:130000, id:'1ACva2ZaAdxgkiS9ZEd0MUUSkG5h5BT9e' },
    { name:'Psychotic Black', presentation:'60 Serv', brand:'Insane Labz', category:'Pre Entreno', price:165000, id:'1d6EpnMoclTqlZug_2XPEWpdNRCC3tQVQ' },
    { name:'Psychotic Gold', presentation:'35 Serv', brand:'Insane Labz', category:'Pre Entreno', price:160000, id:'15K-BQ8e0W3DTxh6ifeCEEXdoHmFszT7x' },
    { name:'Psychotic Gold', presentation:'60 Serv', brand:'Insane Labz', category:'Pre Entreno', price:195000, id:'1TUVGfgkV2URDzwNH18hzdebNVha6WKL9' },
    { name:'Psychotic Rojo', presentation:'35 Serv', brand:'Insane Labz', category:'Pre Entreno', price:160000, id:'1Dn5XYdDLLt23lWt8joqb82S_24Soao2d' },
    { name:'Psychotic Rojo', presentation:'60 Serv', brand:'Insane Labz', category:'Pre Entreno', price:199000, id:'1wShnIid5p0V1Yx9PSSv6MgNFOUVmP6tS' },
    { name:'Psychotic Saw', presentation:'30 Serv', brand:'Insane Labz', category:'Pre Entreno', price:166000, id:'1Qv2fYGpGEfUysMI_htcrCnD6Nb3EM8xV' },
    { name:'Psychotic Xtreme', presentation:'30 Serv', brand:'Insane Labz', category:'Pre Entreno', price:155000, id:'1yThfnm6QS1sQlC1ZVTf1Ek2uYa3xYFai' },
    { name:'Psychopath', presentation:'30 Serv', brand:'Insane Labz', category:'Pre Entreno', price:150000, id:'1a3Rn_rUNed_-HXh8m7Il8t-w1LUDWonk' }
  ];

  const norm = s => String(s || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9]+/g,' ').replace(/\s+/g,' ').trim();
  const money = n => '$' + Number(n).toLocaleString('es-CO');
  const imgUrl = id => DRIVE + id + '&sz=w800';
  const key = p => norm(`${p.name} ${p.presentation}`);

  function cards(){
    return [...document.querySelectorAll('.card,[class*="product-card"],article')];
  }

  function findCard(p){
    const k = key(p);
    return cards().find(c => norm(c.innerText || c.textContent || '').includes(k)) || null;
  }

  function patchCard(card,p){
    card.dataset.brand = p.brand;
    card.dataset.category = p.category;
    card.dataset.name = p.name;
    card.dataset.presentation = p.presentation;
    card.dataset.price = String(p.price);
    card.dataset.liftManualInsane = '1';

    const img = card.querySelector('.pic img,img');
    if(img){
      img.src = imgUrl(p.id);
      img.alt = `${p.name} ${p.presentation} ${p.brand}`;
      img.loading = 'lazy';
      img.decoding = 'async';
      img.referrerPolicy = 'no-referrer';
      img.style.objectFit = 'contain';
    }

    const leaves = [...card.querySelectorAll('*')].filter(el => el.children.length === 0);
    const title = leaves.find(el => /psychotic|psychopath/i.test(el.textContent || ''));
    if(title) title.textContent = `${p.name} ${p.presentation}`;

    const cat = leaves.find(el => /pre\s*entreno/i.test(el.textContent || ''));
    if(cat) cat.textContent = 'PRE ENTRENO';

    const price = leaves.find(el => /^\$\s?[\d.]+$/.test((el.textContent || '').trim()));
    if(price) price.textContent = money(p.price);

    card.querySelectorAll('[data-name],[data-product],[data-product-name]').forEach(el => {
      if(el.hasAttribute('data-name')) el.setAttribute('data-name',p.name);
      if(el.hasAttribute('data-product')) el.setAttribute('data-product',`${p.name} ${p.presentation}`);
      if(el.hasAttribute('data-product-name')) el.setAttribute('data-product-name',`${p.name} ${p.presentation}`);
    });
  }

  function getInsaneTemplate(){
    return cards().find(c => /psychotic|psychopath/i.test(c.innerText || c.textContent || '')) || null;
  }

  function run(){
    PRODUCTS.forEach(p => {
      const existing = findCard(p);
      if(existing) patchCard(existing,p);
    });

    const template = getInsaneTemplate();
    if(!template || !template.parentElement) return;
    const grid = template.parentElement;

    PRODUCTS.forEach(p => {
      if(findCard(p)) return;
      const clone = template.cloneNode(true);
      clone.removeAttribute('id');
      patchCard(clone,p);
      grid.appendChild(clone);
    });
  }

  let busy = false;
  const queue = () => {
    if(busy) return;
    busy = true;
    requestAnimationFrame(() => {
      busy = false;
      run();
    });
  };

  run();
  new MutationObserver(queue).observe(document.documentElement,{childList:true,subtree:true});
  document.addEventListener('click',()=>setTimeout(run,80),true);
  window.addEventListener('hashchange',()=>setTimeout(run,80));
})();
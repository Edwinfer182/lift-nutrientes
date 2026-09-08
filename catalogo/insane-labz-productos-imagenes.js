(() => {
  'use strict';

  const DRIVE = 'https://drive.google.com/thumbnail?id=';
  const PRODUCTS = [
    { name:'Psychotic Black', presentation:'35 Serv', brand:'Insane Labz', category:'Pre Entreno', price:130000, id:'1ACva2ZaAdxgkiS9ZEd0MUUSkG5h5BT9e', aliases:['psychotic black 35 serv','psychotic black 35'] },
    { name:'Psychotic Black', presentation:'60 Serv', brand:'Insane Labz', category:'Pre Entreno', price:165000, id:'1d6EpnMoclTqlZug_2XPEWpdNRCC3tQVQ', aliases:['psychotic black 60 serv','psychotic black 60'] },
    { name:'Psychotic Gold', presentation:'35 Serv', brand:'Insane Labz', category:'Pre Entreno', price:160000, id:'15K-BQ8e0W3DTxh6ifeCEEXdoHmFszT7x', aliases:['psychotic gold 35 serv','psychotic gold 35'] },
    { name:'Psychotic Gold', presentation:'60 Serv', brand:'Insane Labz', category:'Pre Entreno', price:195000, id:'1TUVGfgkV2URDzwNH18hzdebNVha6WKL9', aliases:['psychotic gold 60 serv','psychotic gold 60'] },
    { name:'Psychotic Rojo', presentation:'35 Serv', brand:'Insane Labz', category:'Pre Entreno', price:160000, id:'1Dn5XYdDLLt23lWt8joqb82S_24Soao2d', aliases:['psychotic rojo 35 serv','psychotic rojo 35'] },
    { name:'Psychotic Rojo', presentation:'60 Serv', brand:'Insane Labz', category:'Pre Entreno', price:199000, id:'1wShnIid5p0V1Yx9PSSv6MgNFOUVmP6tS', aliases:['psychotic rojo 60 serv','psychotic rojo 60','psycho rojo 60 serv'] },
    { name:'Psychotic Saw', presentation:'30 Serv', brand:'Insane Labz', category:'Pre Entreno', price:166000, id:'1Qv2fYGpGEfUysMI_htcrCnD6Nb3EM8xV', aliases:['psychotic saw 30 serv','psychotic saw 30','psychotic saw 35 serv'] },
    { name:'Psychotic Xtreme', presentation:'30 Serv', brand:'Insane Labz', category:'Pre Entreno', price:155000, id:'1yThfnm6QS1sQlC1ZVTf1Ek2uYa3xYFai', aliases:['psychotic xtreme 30 serv','psychotic xtreme 30','psychotic extreme 30 serv'] },
    { name:'Psychopath', presentation:'30 Serv', brand:'Insane Labz', category:'Pre Entreno', price:150000, id:'1a3Rn_rUNed_-HXh8m7Il8t-w1LUDWonk', aliases:['psychopath 30 serv','psychopath 30'] }
  ];

  const norm = s => String(s || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9]+/g,' ').replace(/\s+/g,' ').trim();
  const money = n => '$' + Number(n || 0).toLocaleString('es-CO');
  const imageUrl = p => DRIVE + p.id + '&sz=w800';

  function findExistingCard(p){
    const aliases = p.aliases.map(norm);
    return [...document.querySelectorAll('.card, [class*="product-card"], article')].find(card => {
      const t = norm(card.innerText || card.textContent || '');
      return aliases.some(a => t.includes(a));
    }) || null;
  }

  function applyImagesAndPrices(){
    PRODUCTS.forEach(p => {
      const card = findExistingCard(p);
      if (!card) return;
      const img = card.querySelector('.pic img, img');
      if (img) {
        img.src = imageUrl(p);
        img.loading='lazy';
        img.decoding='async';
        img.referrerPolicy='no-referrer';
        img.style.objectFit='contain';
      }
      const textNodes = [...card.querySelectorAll('*')];
      const priceNode = textNodes.find(el => /^\$\s?[\d.]+$/.test((el.textContent || '').trim()));
      if (priceNode) priceNode.textContent = money(p.price);
    });
  }

  function createMissingCards(){
    const template = document.querySelector('.card, [class*="product-card"], article');
    const grid = template && template.parentElement;
    if (!template || !grid) return;

    PRODUCTS.forEach(p => {
      if (findExistingCard(p)) return;
      const card = template.cloneNode(true);
      card.removeAttribute('data-id');
      card.dataset.liftManualInsane = '1';

      const img = card.querySelector('.pic img, img');
      if (img) {
        img.src = imageUrl(p);
        img.alt = `${p.name} ${p.presentation} ${p.brand}`;
        img.loading='lazy';
        img.decoding='async';
        img.referrerPolicy='no-referrer';
        img.style.objectFit='contain';
      }

      const all = [...card.querySelectorAll('*')];
      const titleNode = all.find(el => /psychotic|creatina|pre|protein|caps|serv/i.test(el.textContent || '') && el.children.length===0);
      if (titleNode) titleNode.textContent = `${p.name} ${p.presentation}`;

      const priceNode = all.find(el => /^\$\s?[\d.]+$/.test((el.textContent || '').trim()));
      if (priceNode) priceNode.textContent = money(p.price);

      card.setAttribute('data-brand', p.brand);
      card.setAttribute('data-category', p.category);
      card.setAttribute('data-name', p.name);
      card.setAttribute('data-presentation', p.presentation);
      card.setAttribute('data-price', String(p.price));
      grid.appendChild(card);
    });
  }

  function run(){
    applyImagesAndPrices();
    createMissingCards();
    applyImagesAndPrices();
  }

  let queued=false;
  const queue=()=>{ if(queued) return; queued=true; requestAnimationFrame(()=>{queued=false;run();}); };
  run();
  new MutationObserver(queue).observe(document.documentElement,{childList:true,subtree:true});
  window.addEventListener('hashchange',queue);
})();

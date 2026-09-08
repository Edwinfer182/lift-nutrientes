(() => {
  'use strict';

  const DRIVE='https://drive.google.com/thumbnail?id=';
  const BRAND='hyper';
  const images=[
    {aliases:['just a whey 30 serv vainilla','just a whey 30serv sabor vainilla','ust a whey 30serv sabor vainilla'],id:'1_LwhKGRU1SBA8PUQmnRRZwSyYP9TLc_k'},
    {aliases:['phatom toronja 30 serv','phatom sabor toronja 30serv','phatom 30 serv'],id:'1LZRLp-AUxn_jpdtxwRvgbk_HqJS5svMA'},
    {aliases:['creatine hcl acid grape y panelada 30 serv','crtne hcl acid grape y panelada 30serv','creatina hcl acid grape y panelada 30 serv'],id:'1URwTHOTWQzl15JqyoaCongakFR91no-f'},
    {aliases:['the builder'],id:'15cmnQjdeMLTDy7YZjLf3jYQbBRJBLXsz'},
    {aliases:['factor lemon lychee 30 serv','factor sabor lemon lychee 30serv','factor sabor lemon lychee 30 serv bcaa'],id:'1rI8ACl8oUQ-4RrmImEhWdCwwHDZj3O_C'}
  ];

  const norm=s=>String(s||'').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9]+/g,' ').replace(/\s+/g,' ').trim();
  const hasPhrase=(text,phrase)=>` ${norm(text)} `.includes(` ${norm(phrase)} `);

  function getProductFromCard(card){
    if(!Array.isArray(window.PRODUCTS)||!window.PRODUCTS.length) return null;
    const id=String(card.dataset?.id||card.dataset?.productId||'');
    if(id){
      const byId=window.PRODUCTS.find(p=>String(p.id)===id);
      if(byId) return byId;
    }
    const text=norm(card.innerText||card.textContent||'');
    let best=null,bestLen=0;
    for(const p of window.PRODUCTS){
      if(norm(p.brand)!==BRAND) continue;
      const n=norm(p.name);
      if(!n) continue;
      if(hasPhrase(text,n) && n.length>bestLen){best=p;bestLen=n.length;}
    }
    return best;
  }

  function findImage(product,card){
    const source=norm((product?.name||'')+' '+(card.innerText||card.textContent||''));
    let best=null,bestLen=0;
    for(const item of images){
      for(const alias of item.aliases){
        const a=norm(alias);
        if(a&&hasPhrase(source,a)&&a.length>bestLen){best=item;bestLen=a.length;}
      }
    }
    return best;
  }

  function apply(){
    document.querySelectorAll('.card,[class*="product-card"],article').forEach(card=>{
      if(card.closest('#liftProductOffcanvas')) return;
      const product=getProductFromCard(card);
      if(!product||norm(product.brand)!==BRAND) return;
      card.dataset.brand=product.brand||'Hyper';
      card.dataset.marca=product.brand||'Hyper';
      const match=findImage(product,card);
      if(!match) return;
      const img=card.querySelector('.pic img,img');
      if(!img||img.dataset.liftHyperDriveId===match.id) return;
      img.dataset.liftHyperDriveId=match.id;
      img.loading='lazy';
      img.decoding='async';
      img.referrerPolicy='no-referrer';
      img.src=DRIVE+match.id+'&sz=w800';
      img.style.width='auto';
      img.style.height='auto';
      img.style.maxWidth='100%';
      img.style.maxHeight='100%';
      img.style.objectFit='contain';
      img.style.objectPosition='center';
    });
  }

  let queued=false;
  const queueApply=()=>{if(queued)return;queued=true;requestAnimationFrame(()=>{queued=false;apply();});};
  apply();
  new MutationObserver(queueApply).observe(document.documentElement,{childList:true,subtree:true,attributes:true,attributeFilter:['data-brand','data-marca']});
  window.addEventListener('hashchange',queueApply);
})();
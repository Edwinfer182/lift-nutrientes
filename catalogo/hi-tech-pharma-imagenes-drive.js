(() => {
  'use strict';

  const DRIVE='https://drive.google.com/thumbnail?id=';
  const BRAND_ALIASES=['hi tech pharma','hi-tech pharma','hi tech pharmaceuticals','hitech pharma'];
  const images=[
    {aliases:['lipodrene hardcore'],id:'1Z37dxhu_f02ydYD2yAlV5yD6azIsImpU'},
    {aliases:['lipodrene xtreme'],id:'1I5wyjmNF_WL2zzj6uL10N2hCUsGlH2lO'},
    {aliases:['lipodrene'],id:'1xyWPMwGOBhWCdXCUF_lcZBucyRWjLW5N'},
    {aliases:['creatina hi tech 400 gr 80 serv','creatina hitech 400 gr 80 serv','creatina hi tech 400 g 80 serv','creatina hitech 400 g 80 serv'],id:'1VZ0zmLXIGCB6yZgc7-UWfABCAcpRvH0X'},
    {aliases:['cafeina 100 caps'],id:'1KWBwdsuVk_LUyB81_HqETJW3HoymVtEI'},
    {aliases:['magnesium glycinate 120 caps 500 mg'],id:'1VQS3qtHNgtyBHYFeODJjRsC-vvuILUfL'},
    {aliases:['resveratrol 90 caps 500 mg'],id:'12A_H86wFkWU8_8xZTwSyilQdL8Ap8HCO'},
    {aliases:['nac 100 serv 600 mg','nac 100 servings 600 mg','nac protector hepatico 100 porciones 600 mg','noc protector hepatico 100 porciones 600 mg'],id:'16vuDT1cGZQH4kfhPg7izQ6cLHUdI7wzK'}
  ];

  const norm=s=>String(s||'').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9]+/g,' ').replace(/\s+/g,' ').trim();
  const hasPhrase=(text,phrase)=>` ${norm(text)} `.includes(` ${norm(phrase)} `);
  const isBrand=brand=>BRAND_ALIASES.some(b=>norm(brand)===norm(b));

  function getCardId(card){
    const ds=card?.dataset||{};
    if(ds.id||ds.productId) return String(ds.id||ds.productId);
    const html=card?.innerHTML||'';
    const m=html.match(/(?:buyProduct|add|openProduct)\s*\(\s*['\"]?(\d+)/i);
    return m?String(m[1]):'';
  }

  function titleText(card){
    const selectors=['.name','.product-name','.productName','.title','.card-title','h2','h3','h4'];
    for(const selector of selectors){
      const el=card.querySelector(selector);
      if(el && norm(el.textContent)) return norm(el.textContent);
    }
    return '';
  }

  function productFor(card){
    if(!Array.isArray(window.PRODUCTS)||!window.PRODUCTS.length) return null;

    const id=getCardId(card);
    if(id){
      const p=window.PRODUCTS.find(x=>String(x.id)===id);
      if(p && isBrand(p.brand)) return p;
    }

    const title=titleText(card);
    const text=norm(card.innerText||card.textContent||'');
    const candidates=window.PRODUCTS.filter(p=>isBrand(p.brand));

    if(title){
      const exact=candidates.find(p=>norm(p.name)===title);
      if(exact) return exact;

      let best=null,bestLen=0;
      for(const p of candidates){
        const n=norm(p.name);
        if(!n) continue;
        if((hasPhrase(title,n)||hasPhrase(n,title)) && Math.min(n.length,title.length)>bestLen){
          best=p;bestLen=Math.min(n.length,title.length);
        }
      }
      if(best) return best;
    }

    let best=null,bestLen=0;
    for(const p of candidates){
      const n=norm(p.name);
      if(!n) continue;
      if(hasPhrase(text,n) && n.length>bestLen){best=p;bestLen=n.length;}
    }
    return best;
  }

  function imageFor(product){
    const name=norm(product?.name||'');
    let best=null,bestLen=0;
    for(const item of images){
      for(const alias of item.aliases){
        const a=norm(alias);
        const ok=name===a || name.startsWith(a+' ') || hasPhrase(name,a) || hasPhrase(a,name);
        if(ok && a.length>bestLen){best=item;bestLen=a.length;}
      }
    }
    return best;
  }

  function apply(){
    document.querySelectorAll('.card,[class*="product-card"],article').forEach(card=>{
      if(card.closest('#liftProductOffcanvas')) return;
      const product=productFor(card);
      if(!product || !isBrand(product.brand)) return;

      const match=imageFor(product);
      if(!match) return;

      card.dataset.brand=product.brand;
      card.dataset.marca=product.brand;
      card.dataset.productId=String(product.id||card.dataset.productId||'');

      const img=card.querySelector('.pic img,img');
      if(!img) return;
      const src=DRIVE+match.id+'&sz=w800';
      if(img.dataset.liftHiTechDriveId===match.id && img.src===src) return;

      img.dataset.liftHiTechDriveId=match.id;
      img.loading='lazy';
      img.decoding='async';
      img.referrerPolicy='no-referrer';
      img.src=src;
      img.style.width='auto';
      img.style.height='auto';
      img.style.maxWidth='100%';
      img.style.maxHeight='100%';
      img.style.objectFit='contain';
      img.style.objectPosition='center';
    });
  }

  let queued=false;
  const queueApply=()=>{
    if(queued) return;
    queued=true;
    requestAnimationFrame(()=>{queued=false;apply();});
  };

  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',queueApply); else queueApply();
  new MutationObserver(queueApply).observe(document.documentElement,{childList:true,subtree:true});
  window.addEventListener('hashchange',queueApply);
  window.addEventListener('load',queueApply);
  setTimeout(queueApply,250);
  setTimeout(queueApply,900);
  setTimeout(queueApply,1800);
})();
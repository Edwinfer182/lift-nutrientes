(() => {
  'use strict';

  const norm = s => String(s || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g,'')
    .replace(/[^a-z0-9]+/g,' ')
    .replace(/\s+/g,' ')
    .trim();

  function injectStyles(){
    if(document.getElementById('liftBrandCardStyles')) return;
    const style=document.createElement('style');
    style.id='liftBrandCardStyles';
    style.textContent=`
      .liftCardBrand{display:inline-flex!important;align-items:center;width:max-content;max-width:100%;margin:6px 0 2px;padding:4px 8px;border-radius:999px;background:#111;color:#fff!important;font-size:10px;line-height:1;font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;visibility:visible!important;opacity:1!important}
      @media(max-width:760px){.liftCardBrand{font-size:9px;padding:4px 7px;margin-top:5px}}
    `;
    document.head.appendChild(style);
  }

  function getId(card){
    const ds=card?.dataset||{};
    if(ds.id||ds.productId) return String(ds.id||ds.productId);
    const html=card?.innerHTML||'';
    const m=html.match(/(?:buyProduct|add|openProduct)\s*\(\s*['\"]?(\d+)/i);
    return m?String(m[1]):'';
  }

  function productFor(card){
    if(!Array.isArray(window.PRODUCTS) || !window.PRODUCTS.length) return null;

    const id=getId(card);
    if(id){
      const byId=window.PRODUCTS.find(p=>String(p.id)===id);
      if(byId) return byId;
    }

    const cardText=norm(card.innerText||card.textContent||'');
    if(!cardText) return null;

    const titleSelectors=['.name','.product-name','.productName','.title','.card-title','h2','h3','h4'];
    let title='';
    for(const selector of titleSelectors){
      const el=card.querySelector(selector);
      if(el && norm(el.textContent)){ title=norm(el.textContent); break; }
    }

    if(title){
      const exact=window.PRODUCTS.filter(p=>norm(p.name)===title);
      if(exact.length===1) return exact[0];
      if(exact.length>1){
        const branded=exact.find(p=>p.brand && cardText.includes(norm(p.brand)));
        if(branded) return branded;
        return exact[0];
      }
    }

    // Respaldo para las tarjetas actuales, cuyo HTML no siempre expone id ni clase .name.
    // Busca el nombre de producto más largo contenido en el texto visible de la tarjeta.
    let best=null;
    let bestLen=0;
    for(const p of window.PRODUCTS){
      const n=norm(p?.name);
      if(!n || n.length<4) continue;
      const paddedCard=` ${cardText} `;
      const paddedName=` ${n} `;
      if(paddedCard.includes(paddedName) && n.length>bestLen){
        best=p;
        bestLen=n.length;
      }
    }
    return best;
  }

  function insertBadge(card,badge){
    const name=card.querySelector('.name,.product-name,.productName,.title,.card-title,h2,h3,h4');
    if(name){
      name.insertAdjacentElement('afterend',badge);
      return;
    }
    const body=card.querySelector('.body,.card-body,.content,[class*="body"]');
    if(body){
      body.prepend(badge);
      return;
    }
    const pic=card.querySelector('.pic,[class*="image"],img');
    if(pic){
      const target=pic.closest('.pic,[class*="image"]') || pic;
      target.insertAdjacentElement('afterend',badge);
      return;
    }
    card.prepend(badge);
  }

  function decorate(){
    if(!Array.isArray(window.PRODUCTS) || !window.PRODUCTS.length) return;
    document.querySelectorAll('.card,[class*="product-card"],article').forEach(card=>{
      if(card.closest('#liftProductOffcanvas')) return;
      const p=productFor(card);
      if(!p) return;
      const brand=String(p.brand||'Sin marca').trim()||'Sin marca';
      card.dataset.brand=brand;
      card.dataset.marca=brand;
      let badge=card.querySelector(':scope > .liftCardBrand, .liftCardBrand');
      if(!badge){
        badge=document.createElement('div');
        badge.className='liftCardBrand';
        insertBadge(card,badge);
      }
      badge.textContent=brand;
      badge.title=`Marca: ${brand}`;
    });
  }

  function run(){injectStyles();decorate();}
  let timer;
  new MutationObserver(()=>{clearTimeout(timer);timer=setTimeout(run,50);}).observe(document.documentElement,{childList:true,subtree:true});
  window.addEventListener('hashchange',run);
  window.addEventListener('load',run);
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',run); else run();
  setTimeout(run,250);
  setTimeout(run,900);
})();
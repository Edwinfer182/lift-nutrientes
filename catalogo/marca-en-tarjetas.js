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
      .liftCardBrand{display:inline-flex;align-items:center;width:max-content;max-width:100%;margin-top:6px;padding:4px 8px;border-radius:999px;background:#111;color:#fff;font-size:10px;line-height:1;font-weight:500;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
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
    if(!Array.isArray(window.PRODUCTS)) return null;
    const id=getId(card);
    if(id){
      const byId=window.PRODUCTS.find(p=>String(p.id)===id);
      if(byId) return byId;
    }
    const name=norm(card.querySelector('.name')?.textContent||'');
    if(!name) return null;
    const matches=window.PRODUCTS.filter(p=>norm(p.name)===name);
    if(matches.length===1) return matches[0];
    const cardText=norm(card.innerText||card.textContent||'');
    return matches.find(p=>p.brand&&cardText.includes(norm(p.brand))) || matches[0] || null;
  }

  function decorate(){
    document.querySelectorAll('.card').forEach(card=>{
      if(card.closest('#liftProductOffcanvas')) return;
      const p=productFor(card);
      if(!p) return;
      const brand=String(p.brand||'Sin marca').trim()||'Sin marca';
      card.dataset.brand=brand;
      card.dataset.marca=brand;
      let badge=card.querySelector('.liftCardBrand');
      if(!badge){
        badge=document.createElement('div');
        badge.className='liftCardBrand';
        const name=card.querySelector('.name');
        if(name) name.insertAdjacentElement('afterend',badge);
        else card.querySelector('.body')?.prepend(badge);
      }
      if(badge) badge.textContent=brand;
    });
  }

  function run(){injectStyles();decorate();}
  let timer;
  new MutationObserver(()=>{clearTimeout(timer);timer=setTimeout(run,40);}).observe(document.documentElement,{childList:true,subtree:true});
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',run); else run();
})();

(function(){
  function productById(id){try{return (window.PRODUCTS||PRODUCTS||[]).find(p=>String(p.id)===String(id))||null}catch(e){return null}}
  function giftLabel(o){
    if(!o||!o.gift||o.giftProductId==null)return '';
    if(typeof window.liftOfferGiftLabel==='function')return String(window.liftOfferGiftLabel(o)||'').trim();
    const gp=productById(o.giftProductId); return gp?(gp.name||'Producto de regalo'):'';
  }
  function offerFor(p){try{return typeof offerOf==='function'?offerOf(p):null}catch(e){return null}}
  function enhanceClassicModal(id){
    setTimeout(()=>{
      const p=productById(id),o=p&&offerFor(p),label=giftLabel(o),box=document.getElementById('modalContent');
      if(!box)return;
      box.querySelector('.liftClassicGiftDetail')?.remove();
      if(!label)return;
      const gp=productById(o.giftProductId),d=document.createElement('div');
      d.className='liftClassicGiftDetail liftGiftDetail';
      d.innerHTML=`${gp?.image?`<img src="${String(gp.image).replace(/"/g,'&quot;')}" alt="">`:''}<div><div class="liftGiftDetailTitle">🎁 REGALO INCLUIDO</div><div class="liftGiftDetailName">${label.replace(/[&<>]/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;'}[m]))}</div><div class="liftGiftDetailMeta">Cantidad: ${Math.max(1,Number(o.giftQty||1))}</div></div>`;
      const btn=box.querySelector('.add'); if(btn)box.insertBefore(d,btn); else box.appendChild(d);
    },0);
  }
  const oldView=window.viewProduct;
  if(typeof oldView==='function')window.viewProduct=function(id){const r=oldView.apply(this,arguments);enhanceClassicModal(id);return r};
  window.liftRefreshOfferSurfaces=function(){
    try{if(typeof render==='function')render()}catch(e){}
    try{if(typeof renderCart==='function')renderCart()}catch(e){}
    try{if(typeof window.lafRenderOffers==='function')window.lafRenderOffers()}catch(e){}
    try{if(typeof window.liftRenderGiftInDetail==='function')window.liftRenderGiftInDetail()}catch(e){}
  };
  window.addEventListener('pageshow',()=>setTimeout(window.liftRefreshOfferSurfaces,250));
})();

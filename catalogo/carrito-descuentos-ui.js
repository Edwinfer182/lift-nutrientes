(() => {
  'use strict';

  function injectStyles(){
    if(document.getElementById('liftCartDiscountStyles')) return;
    const style=document.createElement('style');
    style.id='liftCartDiscountStyles';
    style.textContent=`
      .liftOfferBadge{display:inline-block;margin-top:5px;background:#16a34a;color:#fff;border-radius:999px;padding:3px 7px;font-size:9px;font-weight:500;letter-spacing:.03em}
      .liftCartOldPrice{text-decoration:line-through;color:#999;font-size:11px;margin-right:6px;font-weight:300}
      .liftCartNewPrice{font-weight:600;color:#111}
      #checkoutItems{font-weight:600}
      #checkoutItems .checkoutFlavorMsg{font-weight:300}
    `;
    document.head.appendChild(style);
  }

  function effectivePrice(p){
    try{return typeof priceOf==='function'?Number(priceOf(p)||0):Number(p?.price||0)}
    catch{return Number(p?.price||0)}
  }

  function install(){
    if(typeof renderCart!=='function' || typeof items!=='function') return false;
    if(renderCart.__liftDiscountInstalled) return true;

    renderCart=function(){
      const cartItems=items();
      const body=document.getElementById('cartBody');
      if(!body) return;

      if(!cartItems.length){
        body.innerHTML='<div class="empty">Tu carrito está vacío.</div>';
      }else{
        body.innerHTML=cartItems.map(({key,p,q,flavor})=>{
          const current=effectivePrice(p);
          const regular=Number(p.price||0);
          const discounted=current>0 && regular>current;
          const total=current*q;
          const oldTotal=regular*q;
          return `
            <div class="cartline">
              <img src="${p.image}" alt="${esc(p.name)}">
              <div>
                <div class="cartname">${esc(p.name)} · ${esc(p.brand||'')}</div>
                <div class="liftCartMeta">${esc(p.brand||'Sin marca')} · ${esc(p.category||'Sin categoría')}</div>
                ${flavor?`<div class="cartFlavor">Sabor: ${esc(flavor)}</div>`:''}
                ${discounted?`<div class="liftOfferBadge">OFERTA</div>`:''}
                <div class="cartprice">${discounted?`<span class="liftCartOldPrice">${fmt(oldTotal)}</span>`:''}<span class="liftCartNewPrice">${fmt(total)}</span></div>
                <div class="qty">
                  <button type="button" data-cart-key="${key}" data-delta="-1">−</button>
                  <b>${q}</b>
                  <button type="button" data-cart-key="${key}" data-delta="1">+</button>
                </div>
              </div>
              <button type="button" class="trash" data-remove-key="${key}">×</button>
            </div>`;
        }).join('');

        body.querySelectorAll('[data-cart-key]').forEach(btn=>btn.addEventListener('click',()=>change(btn.dataset.cartKey,Number(btn.dataset.delta||0))));
        body.querySelectorAll('[data-remove-key]').forEach(btn=>btn.addEventListener('click',()=>removeItem(btn.dataset.removeKey)));
      }

      const subtotal=cartItems.reduce((sum,row)=>sum+effectivePrice(row.p)*row.q,0);
      const subtotalEl=document.getElementById('subtotal');
      if(subtotalEl) subtotalEl.textContent=fmt(subtotal);
      const checkoutButton=document.getElementById('cartBuyBtn');
      if(checkoutButton) checkoutButton.disabled=!cartItems.length;
      if(typeof updateCount==='function') updateCount();
    };
    renderCart.__liftDiscountInstalled=true;

    if(typeof renderCheckoutSummary==='function' && !renderCheckoutSummary.__liftBoldInstalled){
      const originalRenderCheckoutSummary=renderCheckoutSummary;
      renderCheckoutSummary=function(){
        originalRenderCheckoutSummary();
        const el=document.getElementById('checkoutItems');
        if(el) el.style.fontWeight='600';
        const flavor=el?.querySelector('.checkoutFlavorMsg');
        if(flavor) flavor.style.fontWeight='300';
      };
      renderCheckoutSummary.__liftBoldInstalled=true;
    }

    injectStyles();
    renderCart();
    if(document.getElementById('checkoutModal')?.classList.contains('open') && typeof renderCheckoutSummary==='function') renderCheckoutSummary();
    return true;
  }

  function wait(attempt=0){
    const flavorReady=typeof renderCart==='function' && String(renderCart).includes('cartFlavor');
    const couponReady=typeof renderCheckoutSummary==='function' && String(renderCheckoutSummary).includes('appliedCoupon');
    if(flavorReady && couponReady){ install(); return; }
    if(attempt<120){ setTimeout(()=>wait(attempt+1),50); return; }
    install();
  }

  wait();
})();

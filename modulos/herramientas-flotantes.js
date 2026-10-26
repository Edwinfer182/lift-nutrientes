/* Lift: todas las herramientas administrativas dentro de Finalizar compra. */
(() => {
  if (window.__liftCheckoutAdminToolsV1) return;
  window.__liftCheckoutAdminToolsV1 = true;
  const css = document.createElement('style');
  css.textContent = `
    #lift-checkout-admin-tools{position:relative!important;inset:auto!important;transform:none!important;z-index:1!important;display:block!important;width:100%!important;margin:18px 0!important;box-sizing:border-box!important;background:#f8f8f8!important;border:1px solid #dedede!important;border-radius:14px!important;padding:10px!important;color:#111!important;font:14px Poppins,Arial,sans-serif!important}
    #lift-checkout-admin-tools summary{cursor:pointer;padding:10px;font-weight:600;list-style:none;display:flex;align-items:center;gap:8px;min-height:34px}
    #lift-checkout-admin-tools summary::-webkit-details-marker{display:none}
    #lift-checkout-admin-tools summary:after{content:'⌄';margin-left:auto}
    #lift-checkout-admin-tools[open] summary:after{content:'⌃'}
    #lift-checkout-admin-content{display:flex;flex-direction:column;gap:8px;padding:10px 2px 3px;max-height:48dvh;overflow-y:auto;overflow-x:hidden;overscroll-behavior:contain}
    #lift-checkout-admin-content .liftAdminToolsRow{position:static!important;inset:auto!important;transform:none!important;display:flex!important;flex-direction:column!important;gap:8px!important;width:100%!important;height:auto!important;max-height:none!important;overflow:visible!important;margin:0!important;padding:0!important;background:transparent!important;box-shadow:none!important}
    #lift-checkout-admin-content button,#lift-checkout-admin-content a{position:static!important;inset:auto!important;transform:none!important;float:none!important;display:flex!important;align-items:center!important;justify-content:center!important;width:100%!important;max-width:100%!important;height:auto!important;min-height:44px!important;margin:0!important;padding:10px!important;white-space:normal!important;box-sizing:border-box!important;visibility:visible!important;pointer-events:auto!important}
    #lift-tools-dock{display:none!important}
    body.liftAdminUnlocked #lift-checkout-admin-tools{display:block!important}
  `;
  document.head.appendChild(css);
  const details=document.createElement('details');
  details.id='lift-checkout-admin-tools';
  details.innerHTML='<summary>⚙ Herramientas administrativas</summary><div id="lift-checkout-admin-content"></div>';
  const content=details.querySelector('#lift-checkout-admin-content');
  const labels=/^(instagram(?: seo)?|wp herramientas|herramientas wp|herramientas seo|seo|envío|envio|atención|atencion|pedidos|cartera|cartera proveedores|crm.*|pagos|calculadora|carritos abandonados|pdf|inst.*)$/i;
  let queued=false;
  function update(){
    queued=false;
    const checkout=document.getElementById('checkoutModal');
    if(!checkout||!document.body?.classList.contains('liftAdminUnlocked')){
      details.remove();return;
    }
    if(!checkout.contains(details)){
      const target=checkout.querySelector('.modal-body,.checkout-body,.offcanvas-body,[class*="modalContent"],[class*="modal-content"]')||checkout;
      target.appendChild(details);
    }
    for(const row of [...document.querySelectorAll('.liftAdminToolsRow')]){
      if(!content.contains(row))content.appendChild(row);
    }
    for(const el of [...document.querySelectorAll('button,a')]){
      if(content.contains(el)||details.contains(el)||el.closest('#checkoutModal'))continue;
      const label=(el.textContent||'').replace(/[^\\p{L}\\p{N} .·-]/gu,' ').trim().replace(/\\s+/g,' ');
      if(!labels.test(label))continue;
      let parent=el,globalFloating=false,steps=0;
      while(parent&&steps++<6&&!globalFloating){
        if(getComputedStyle(parent).position==='fixed')globalFloating=true;
        parent=parent.parentElement;
      }
      if(globalFloating||el.id==='lift-ig-seo-launcher')content.appendChild(el);
    }
    // No dejar el viejo lanzador flotante duplicado.
    for(const old of document.querySelectorAll('#lift-tools-dock')){
      if(old!==details)old.style.setProperty('display','none','important');
    }
    details.hidden=content.querySelectorAll('button,a').length===0;
  }
  function schedule(){if(!queued){queued=true;requestAnimationFrame(update)}}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',schedule);else schedule();
  new MutationObserver(schedule).observe(document.documentElement,{childList:true,subtree:true,attributes:true,attributeFilter:['class']});
})();

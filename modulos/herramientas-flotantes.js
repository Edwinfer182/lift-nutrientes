/* Lift admin tools: checkout only. No global floating menu. */
(() => {
  if (window.__liftCheckoutToolsFixed) return;
  window.__liftCheckoutToolsFixed = true;
  const style=document.createElement('style');
  style.textContent=`
    #lift-tools-dock{display:none!important}
    #lift-checkout-admin-tools{position:relative!important;inset:auto!important;z-index:1!important;display:block!important;width:100%!important;max-width:100%!important;margin:14px 0!important;padding:10px!important;box-sizing:border-box!important;background:#f8f8f8!important;border:1px solid #dedede!important;border-radius:14px!important}
    #lift-checkout-admin-tools summary{cursor:pointer;list-style:none;padding:9px 6px;font:600 14px Poppins,Arial,sans-serif;color:#111}
    #lift-checkout-admin-tools summary::-webkit-details-marker{display:none}
    #lift-checkout-admin-content{display:flex;flex-direction:column;gap:8px;max-height:48dvh;overflow-y:auto;overscroll-behavior:contain;padding:8px 0}
    #lift-checkout-admin-content .liftAdminToolsRow{position:static!important;inset:auto!important;transform:none!important;display:flex!important;flex-direction:column!important;width:100%!important;height:auto!important;gap:8px!important;background:transparent!important;box-shadow:none!important;overflow:visible!important;margin:0!important;padding:0!important}
    #lift-checkout-admin-content button,#lift-checkout-admin-content a{position:static!important;inset:auto!important;transform:none!important;display:flex!important;width:100%!important;min-height:42px!important;height:auto!important;justify-content:center!important;align-items:center!important;margin:0!important;padding:8px!important;box-sizing:border-box!important;white-space:normal!important}
  `;
  document.head.appendChild(style);
  const details=document.createElement('details');
  details.id='lift-checkout-admin-tools';
  details.innerHTML='<summary>⚙ Herramientas administrativas</summary><div id="lift-checkout-admin-content"></div>';
  const contents=details.querySelector('#lift-checkout-admin-content');
  let scheduled=false;
  function install(){
    scheduled=false;
    const checkout=document.getElementById('checkoutModal');
    if(!checkout || !document.body.classList.contains('liftAdminUnlocked')) {
      if(details.isConnected)details.remove();
      return;
    }
    const row=document.querySelector('#checkoutModal .liftAdminToolsRow') ||
              document.querySelector('body > .liftAdminToolsRow') ||
              [...document.querySelectorAll('.liftAdminToolsRow')].find(x=>!contents.contains(x));
    if(!row && !contents.querySelector('button,a'))return;
    if(!checkout.contains(details)) {
      const target=checkout.querySelector('.modal-body,.checkout-body,.offcanvas-body,[class*="modal-content"]')||checkout;
      target.appendChild(details);
    }
    if(row && !contents.contains(row))contents.appendChild(row);
    // Only relocate the known Instagram launcher if it was independently mounted.
    const ig=document.getElementById('lift-ig-seo-launcher');
    if(ig && !contents.contains(ig))contents.appendChild(ig);
  }
  function schedule(){
    if(!scheduled){scheduled=true;requestAnimationFrame(install)}
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',schedule);
  else schedule();
  new MutationObserver(schedule).observe(document.documentElement,{childList:true,subtree:true,attributes:true,attributeFilter:['class']});
})();

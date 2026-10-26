/* Solo tres accesos en la fila administrativa original del checkout. */
(() => {
  if (window.__liftThreeToolsInCheckout) return;
  window.__liftThreeToolsInCheckout=true;
  const style=document.createElement('style');
  style.textContent=`
    #lift-tools-dock,#lift-checkout-admin-tools{display:none!important}
    #checkoutModal .liftAdminToolsRow #lift-trainer-admin-open,
    #checkoutModal .liftAdminToolsRow #lift-ig-seo-launcher,
    #checkoutModal .liftAdminToolsRow .lift-moved-seo-button{
      position:static!important;top:auto!important;bottom:auto!important;left:auto!important;right:auto!important;
      transform:none!important;float:none!important;z-index:auto!important;
      width:auto!important;max-width:100%!important;height:auto!important;min-height:40px!important;
      margin:4px!important;box-shadow:none!important;
    }
  `;
  document.head.appendChild(style);
  let scheduled=false;
  function move(){
    scheduled=false;
    if(!document.body?.classList.contains('liftAdminUnlocked'))return;
    const row=document.querySelector('#checkoutModal .liftAdminToolsRow');
    if(!row)return;
    const trainer=document.getElementById('lift-trainer-admin-open');
    if(trainer && !row.contains(trainer)){trainer.removeAttribute('style');row.appendChild(trainer)}
    const ig=document.getElementById('lift-ig-seo-launcher');
    if(ig && !row.contains(ig))row.appendChild(ig);
    const seo=[...document.querySelectorAll('button,a')].find(el=>{
      if(row.contains(el)||el.closest('#checkoutModal')||el.id==='lift-tools-toggle')return false;
      const t=(el.textContent||'').trim().replace(/\\s+/g,' ');
      return /^(?:seo|seo productos|seo web|seo administrador)$/i.test(t) && 
        (getComputedStyle(el).position==='fixed'||getComputedStyle(el.parentElement||el).position==='fixed');
    });
    if(seo){seo.removeAttribute('style');seo.classList.add('lift-moved-seo-button');row.appendChild(seo)}
  }
  function schedule(){if(!scheduled){scheduled=true;requestAnimationFrame(move)}}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',schedule);
  else schedule();
  new MutationObserver(schedule).observe(document.documentElement,{childList:true,subtree:true,attributes:true,attributeFilter:['class']});
})();

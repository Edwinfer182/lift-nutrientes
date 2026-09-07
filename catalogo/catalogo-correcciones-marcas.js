(() => {
  'use strict';

  const norm = (s='') => String(s).normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().trim();

  function fixSupremacyBrand(){
    if(!Array.isArray(window.PRODUCTS)) return;
    let changed = false;
    window.PRODUCTS.forEach(p => {
      if(norm(p.category)==='supremacy' && norm(p.brand)!=='supremacy'){
        p.brand = 'Supremacy';
        changed = true;
      }
    });
    if(changed) refreshVisibleMeta();
  }

  function productFromCard(card){
    const name = norm(card?.querySelector('.name')?.textContent || '');
    if(!name || !Array.isArray(window.PRODUCTS)) return null;
    return window.PRODUCTS.find(p => norm(p.name)===name) || null;
  }

  function refreshVisibleMeta(){
    document.querySelectorAll('.card').forEach(card => {
      const p = productFromCard(card);
      if(!p) return;
      const brand = card.querySelector('.liftProductMeta .liftBrand');
      if(brand) brand.textContent = p.brand || 'Sin marca';
    });
    document.querySelectorAll('#cartBody .cartline').forEach(line => {
      const title = line.querySelector('.cartname');
      if(!title || !Array.isArray(window.PRODUCTS)) return;
      const txt = norm(title.textContent);
      const p = window.PRODUCTS.find(x => txt.includes(norm(x.name)));
      if(!p) return;
      const meta = line.querySelector('.liftCartMeta');
      if(meta) meta.textContent = `${p.brand || 'Sin marca'} · ${p.category || 'Sin categoría'}`;
    });
  }

  function run(){
    fixSupremacyBrand();
    refreshVisibleMeta();
  }

  const observer = new MutationObserver(() => {
    clearTimeout(window.__liftBrandFixTimer);
    window.__liftBrandFixTimer = setTimeout(run, 60);
  });
  observer.observe(document.documentElement,{childList:true,subtree:true});

  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',run); else run();
})();

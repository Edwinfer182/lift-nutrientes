(() => {
  'use strict';

  const norm = (s='') => String(s)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g,'')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g,' ')
    .replace(/\s+/g,' ')
    .trim();

  const isHealthySports = p => norm(p?.brand) === 'healthy sports';

  function dedupeProducts(){
    if(!Array.isArray(window.PRODUCTS)) return;
    const seen = new Set();
    window.PRODUCTS = window.PRODUCTS.filter(p => {
      if(!isHealthySports(p)) return true;
      const key = norm(p.name);
      if(!key) return true;
      if(seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }

  function cardName(card){
    return norm(card.querySelector('.name,.title,.product-name,h3,h4')?.textContent || '');
  }

  function cardIsHealthy(card){
    const text = norm(card.innerText || card.textContent || '');
    if(text.includes('healthy sports')) return true;
    const name = cardName(card);
    if(!name || !Array.isArray(window.PRODUCTS)) return false;
    return window.PRODUCTS.some(p => isHealthySports(p) && norm(p.name) === name);
  }

  function dedupeCards(){
    const seen = new Set();
    document.querySelectorAll('.card,[class*="product-card"]').forEach(card => {
      if(card.closest('#liftProductOffcanvas')) return;
      if(!cardIsHealthy(card)) return;
      const key = cardName(card);
      if(!key) return;
      if(seen.has(key)) card.remove();
      else seen.add(key);
    });
  }

  function run(){
    dedupeProducts();
    dedupeCards();
  }

  let timer;
  const observer = new MutationObserver(() => {
    clearTimeout(timer);
    timer = setTimeout(run, 80);
  });
  observer.observe(document.documentElement,{childList:true,subtree:true});

  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded',run,{once:true});
  else run();
})();
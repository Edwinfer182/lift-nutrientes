(() => {
  'use strict';

  const norm = (s='') => String(s).normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().trim();

  function isSeleccionLiftText(text){
    const t = norm(text);
    return t.includes('seleccion lift');
  }

  function findResultRow(node, searchWrap){
    let el = node?.nodeType === 1 ? node : node?.parentElement;
    while(el && el !== searchWrap){
      const buttons = [...el.querySelectorAll('button')].map(b => norm(b.textContent));
      const hasAdd = buttons.some(t => t === 'agregar');
      const hasBuy = buttons.some(t => t === 'comprar');
      if(hasAdd && hasBuy) return el;
      el = el.parentElement;
    }
    return null;
  }

  function hideSeleccionLiftRows(){
    const searchWrap = document.querySelector('.search');
    if(!searchWrap) return;

    const walker = document.createTreeWalker(searchWrap, NodeFilter.SHOW_TEXT);
    const matches = [];
    let n;
    while((n = walker.nextNode())){
      if(isSeleccionLiftText(n.nodeValue || '')) matches.push(n);
    }

    matches.forEach(textNode => {
      const row = findResultRow(textNode, searchWrap);
      if(row && !row.closest('#liftSearchKinds')){
        row.style.display = 'none';
        row.dataset.liftHiddenSeleccion = '1';
      }
    });

    document.querySelectorAll('#liftSearchKinds .liftSearchKind').forEach(btn => {
      if(isSeleccionLiftText(btn.textContent || '')) btn.style.display = 'none';
    });
  }

  function install(){
    const searchWrap = document.querySelector('.search');
    if(!searchWrap) return false;

    hideSeleccionLiftRows();

    const observer = new MutationObserver(() => {
      clearTimeout(window.__liftSeleccionFilterTimer);
      window.__liftSeleccionFilterTimer = setTimeout(hideSeleccionLiftRows, 20);
    });
    observer.observe(searchWrap,{childList:true,subtree:true,characterData:true});

    const input = searchWrap.querySelector('input');
    if(input){
      input.addEventListener('input', () => setTimeout(hideSeleccionLiftRows, 0));
      input.addEventListener('focus', () => setTimeout(hideSeleccionLiftRows, 0));
    }
    return true;
  }

  function wait(attempt=0){
    if(install()) return;
    if(attempt < 80) setTimeout(() => wait(attempt+1), 50);
  }

  wait();
})();

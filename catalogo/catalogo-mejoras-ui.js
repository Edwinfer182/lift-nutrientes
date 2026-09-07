(() => {
  'use strict';

  const norm = (s='') => String(s).normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().trim();
  const esc = (s='') => String(s).replace(/[&<>"']/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));

  function productIdFromCard(card){
    const html = card?.innerHTML || '';
    const m = html.match(/(?:buyProduct|add|openProduct)\s*\(\s*['"]?(\d+)/i);
    if(m) return String(m[1]);
    const ds = card?.dataset || {};
    return String(ds.id || ds.productId || '');
  }

  function productFromCard(card){
    const id = productIdFromCard(card);
    if(id && Array.isArray(window.PRODUCTS)){
      const p = window.PRODUCTS.find(x => String(x.id) === id);
      if(p) return p;
    }
    const name = norm(card?.querySelector('.name')?.textContent || '');
    if(name && Array.isArray(window.PRODUCTS)) return window.PRODUCTS.find(x => norm(x.name) === name) || null;
    return null;
  }

  function injectStyles(){
    if(document.getElementById('liftCatalogMetaStyles')) return;
    const style = document.createElement('style');
    style.id = 'liftCatalogMetaStyles';
    style.textContent = `
      .liftProductMeta{display:flex;gap:5px;flex-wrap:wrap;margin-top:1px}
      .liftProductMeta span{font-size:9px;font-weight:400;background:#f2f2f2;border:1px solid #e6e6e6;border-radius:999px;padding:4px 7px;color:#555;line-height:1.1}
      .liftProductMeta .liftBrand{background:#111;color:#fff;border-color:#111}
      .liftCartMeta{font-size:11px;color:#777;margin-top:3px;line-height:1.3}
      .liftSearchKinds{display:none;position:absolute;left:0;right:0;top:calc(100% + 6px);z-index:700;background:#fff;border:1px solid #ddd;border-radius:12px;box-shadow:0 12px 30px rgba(0,0,0,.14);padding:7px;max-height:310px;overflow:auto}
      .liftSearchKinds.show{display:block}
      .liftSearchHeading{font-size:10px;color:#888;text-transform:uppercase;letter-spacing:.08em;padding:7px 8px 4px;font-weight:400}
      .liftSearchKind{width:100%;border:0;background:#fff;border-radius:9px;padding:9px 10px;display:flex;align-items:center;justify-content:space-between;gap:10px;cursor:pointer;text-align:left;color:#111}
      .liftSearchKind:hover{background:#f4f4f4}
      .liftSearchKind b{font-size:13px;font-weight:400}.liftSearchKind small{font-size:10px;color:#777}
      @media(max-width:760px){.liftSearchKinds{top:calc(100% + 6px);max-height:min(55vh,430px)}}
    `;
    document.head.appendChild(style);
  }

  function decorateCards(){
    document.querySelectorAll('.card').forEach(card => {
      if(card.dataset.liftMetaDone === '1') return;
      const p = productFromCard(card);
      if(!p) return;
      const body = card.querySelector('.body');
      const name = card.querySelector('.name');
      if(!body || !name) return;
      const meta = document.createElement('div');
      meta.className = 'liftProductMeta';
      meta.innerHTML = `<span class="liftBrand">${esc(p.brand || 'Sin marca')}</span><span>${esc(p.category || 'Sin categoría')}</span>`;
      name.insertAdjacentElement('afterend', meta);
      card.dataset.liftMetaDone = '1';
    });
  }

  function decorateCart(){
    document.querySelectorAll('#cartBody .cartline').forEach(line => {
      if(line.dataset.liftMetaDone === '1') return;
      const title = line.querySelector('.cartname');
      if(!title) return;
      const text = norm(title.textContent);
      let p = null;
      if(Array.isArray(window.PRODUCTS)){
        p = window.PRODUCTS.find(x => text.includes(norm(x.name)) && (!x.brand || text.includes(norm(x.brand))))
          || window.PRODUCTS.find(x => text.includes(norm(x.name)));
      }
      if(!p) return;
      // Asegura que la marca siempre viaje al carrito, y añade también la categoría como referencia visual.
      if(p.brand && !norm(title.textContent).includes(norm(p.brand))) title.textContent = `${title.textContent} · ${p.brand}`;
      const meta = document.createElement('div');
      meta.className = 'liftCartMeta';
      meta.textContent = `${p.brand || 'Sin marca'} · ${p.category || 'Sin categoría'}`;
      title.insertAdjacentElement('afterend', meta);
      line.dataset.liftMetaDone = '1';
    });
  }

  function categoriesAndBrands(query){
    if(!Array.isArray(window.PRODUCTS)) return {brands:[],categories:[]};
    const q = norm(query);
    if(!q) return {brands:[],categories:[]};
    const brands = [...new Set(window.PRODUCTS.map(p => p.brand).filter(Boolean))]
      .filter(x => norm(x).includes(q)).sort((a,b)=>a.localeCompare(b,'es')).slice(0,5);
    const categories = [...new Set(window.PRODUCTS.map(p => p.category).filter(Boolean))]
      .filter(x => norm(x).includes(q)).sort((a,b)=>a.localeCompare(b,'es')).slice(0,5);
    return {brands,categories};
  }

  function clickExistingFilter(label){
    const wanted = norm(label);
    const candidates = [...document.querySelectorAll('.filterItem, .chip, [data-filter], .checkItem')];
    const target = candidates.find(el => {
      const txt = norm((el.textContent || '').replace(/\d+\s*$/,''));
      return txt === wanted || txt.startsWith(wanted + ' ');
    });
    if(target){ target.click(); return true; }
    return false;
  }

  function setupSearchKinds(){
    const searchWrap = document.querySelector('.search');
    const input = searchWrap?.querySelector('input');
    if(!searchWrap || !input || document.getElementById('liftSearchKinds')) return;

    const panel = document.createElement('div');
    panel.id = 'liftSearchKinds';
    panel.className = 'liftSearchKinds';
    searchWrap.appendChild(panel);

    function render(){
      const q = input.value.trim();
      const {brands,categories} = categoriesAndBrands(q);
      if(!q || (!brands.length && !categories.length)){ panel.classList.remove('show'); panel.innerHTML=''; return; }
      let html='';
      if(categories.length){
        html += '<div class="liftSearchHeading">Categorías</div>' + categories.map(x => `<button type="button" class="liftSearchKind" data-kind="category" data-value="${esc(x)}"><b>${esc(x)}</b><small>Categoría</small></button>`).join('');
      }
      if(brands.length){
        html += '<div class="liftSearchHeading">Marcas</div>' + brands.map(x => `<button type="button" class="liftSearchKind" data-kind="brand" data-value="${esc(x)}"><b>${esc(x)}</b><small>Marca</small></button>`).join('');
      }
      panel.innerHTML=html;
      panel.classList.add('show');
    }

    input.addEventListener('input', render, true);
    input.addEventListener('focus', render);
    panel.addEventListener('mousedown', e => e.preventDefault());
    panel.addEventListener('click', e => {
      const btn = e.target.closest('.liftSearchKind');
      if(!btn) return;
      const value = btn.dataset.value || '';
      panel.classList.remove('show');
      input.value='';
      input.dispatchEvent(new Event('input',{bubbles:true}));
      if(!clickExistingFilter(value)){
        input.value=value;
        input.dispatchEvent(new Event('input',{bubbles:true}));
        input.dispatchEvent(new KeyboardEvent('keydown',{key:'Enter',bubbles:true}));
      }
    });
    document.addEventListener('click', e => { if(!searchWrap.contains(e.target)) panel.classList.remove('show'); });
  }

  function run(){
    injectStyles();
    setupSearchKinds();
    decorateCards();
    decorateCart();
  }

  const observer = new MutationObserver(() => {
    clearTimeout(window.__liftMetaTimer);
    window.__liftMetaTimer = setTimeout(run, 40);
  });
  observer.observe(document.documentElement,{childList:true,subtree:true});
  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded',run); else run();
})();

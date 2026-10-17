
(function(){
  function resetAllLiftFilters(){
    try{
      state.cat='Todos';
      state.brand='Todas';
      state.offerOnly=false;
      if('sort' in state) state.sort='recommended';
    }catch(e){}
    try{
      const q=document.getElementById('q');
      if(q) q.value='';
    }catch(e){}
    try{
      fullSearchActive=false;
    }catch(e){}
  }

  function wireDynamicFilters(){
    const wrap=document.getElementById('liftDynamicQuickFilters');
    if(!wrap || wrap.dataset.fixedV3==='1') return;
    wrap.dataset.fixedV3='1';

    const buttons=[...wrap.querySelectorAll('button')];
    buttons.forEach(btn=>{
      const label=(btn.textContent||'').trim();

      // Clonamos para eliminar listeners viejos.
      const clone=btn.cloneNode(true);
      btn.replaceWith(clone);

      clone.addEventListener('click',()=>{
        wrap.querySelectorAll('button').forEach(b=>{
          b.classList.remove('active');
          b.style.background='';
          b.style.color='';
        });
        clone.classList.add('active');
        clone.style.background='#111';
        clone.style.color='#fff';

        resetAllLiftFilters();

        if(/^Todos$/i.test(label)){
          render();
          return;
        }

        if(/Ofertas/i.test(label)){
          state.offerOnly=true;

          // Si las ofertas con fecha expiraron pero aún existen descuentos/regalos,
          // mostramos los productos que realmente tengan oferta activa según la lógica del catálogo.
          render();

          // Rescate defensivo: si la lógica temporal dejó 0, usamos los productos con ahorro/regalo.
          setTimeout(()=>{
            try{
              const status=document.getElementById('status');
              const grid=document.getElementById('grid');
              const zero=(status?.textContent||'').includes('0 productos');
              if(zero && grid){
                const promoProducts=(window.PRODUCTS||[]).filter(p=>{
                  try{
                    return (typeof savingOf==='function' && savingOf(p)>0) ||
                           (typeof offerOf==='function' && !!offerOf(p));
                  }catch(e){ return false; }
                });
                if(promoProducts.length){
                  state.offerOnly=false;
                  const ids=new Set(promoProducts.map(p=>p.id));
                  const oldFiltered=window.filtered;
                  if(typeof oldFiltered==='function'){
                    window.filtered=function(){
                      return oldFiltered().filter(p=>ids.has(p.id));
                    };
                    render();
                    setTimeout(()=>{window.filtered=oldFiltered;},0);
                  }
                }
              }
            }catch(e){}
          },20);
          return;
        }

        // Categoría dinámica. Primero limpia marca/búsqueda y luego aplica solo esa categoría.
        const realCat=[...new Set((window.PRODUCTS||[]).map(p=>p.category))]
          .find(c=>c && typeof norm==='function' && norm(c)===norm(label));

        if(realCat){
          state.cat=realCat;
          state.brand='Todas';
          state.offerOnly=false;
          render();
        }else{
          render();
        }
      });
    });
  }

  function ensureOffersExist(){
    // Si el catálogo tiene ofertas pero el botón quedó visualmente muerto,
    // mantenemos el botón visible y funcional. No altera los productos.
    const wrap=document.getElementById('liftDynamicQuickFilters');
    if(!wrap) return;
    const offers=[...wrap.querySelectorAll('button')].find(b=>/Ofertas/i.test(b.textContent||''));
    if(offers) offers.style.display='';
  }

  function bootFix(){
    wireDynamicFilters();
    ensureOffersExist();
  }

  if(document.readyState==='loading'){
    document.addEventListener('DOMContentLoaded',()=>setTimeout(bootFix,120));
  }else{
    setTimeout(bootFix,120);
  }
})();

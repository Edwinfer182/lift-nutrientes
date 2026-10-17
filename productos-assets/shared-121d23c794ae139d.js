
(function(){
  function rebuildCategoryOnlyFilters(){
    const wrap=document.getElementById('liftDynamicQuickFilters');
    if(!wrap || wrap.dataset.categoriesOnlyV4==='1') return;
    wrap.dataset.categoriesOnlyV4='1';

    const counts=new Map();
    (window.PRODUCTS||[]).forEach(p=>{
      const c=(p.category||'').trim();
      if(c) counts.set(c,(counts.get(c)||0)+1);
    });

    const cats=[...counts.entries()]
      .filter(([c,n])=>n>0 && !/destacados|selecci[oó]n lift|varias marcas/i.test(c))
      .map(([name,count])=>({name,count}));

    function shuffle(a){
      a=[...a];
      for(let i=a.length-1;i>0;i--){
        const j=Math.floor(Math.random()*(i+1));
        [a[i],a[j]]=[a[j],a[i]];
      }
      return a;
    }

    // Siete entradas reales para aprovechar el espacio que ocupaban Todos y Ofertas.
    let selected=shuffle(cats).slice(0,7);

    wrap.innerHTML='';
    selected.forEach(c=>{
      const b=document.createElement('button');
      b.type='button';
      b.className='quickFilterBtn';
      b.textContent=c.name;
      b.title=`Ver ${c.count} productos`;
      b.addEventListener('click',()=>{
        wrap.querySelectorAll('.quickFilterBtn').forEach(x=>x.classList.remove('active'));

        // Si se pulsa el mismo filtro activo, vuelve a catálogo completo.
        if(state.cat===c.name && state.brand==='Todas' && !state.offerOnly){
          state.cat='Todos';
          state.brand='Todas';
          state.offerOnly=false;
          const q=document.getElementById('q'); if(q) q.value='';
          try{fullSearchActive=false}catch(e){}
          render();
          return;
        }

        b.classList.add('active');
        state.cat='Todos';
        state.brand='Todas';
        state.offerOnly=false;
        const q=document.getElementById('q'); if(q) q.value='';
        try{fullSearchActive=false}catch(e){}
        state.cat=c.name;
        render();
      });
      wrap.appendChild(b);
    });
  }

  if(document.readyState==='loading'){
    document.addEventListener('DOMContentLoaded',()=>setTimeout(rebuildCategoryOnlyFilters,180));
  }else{
    setTimeout(rebuildCategoryOnlyFilters,180);
  }
})();

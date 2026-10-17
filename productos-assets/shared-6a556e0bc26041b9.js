
(function(){
  function categoryPanels(){
    return [...document.querySelectorAll('.filterPanel')].filter(panel=>{
      return panel.querySelector('.liftCatAdminRow');
    });
  }

  function ensureSearch(){
    categoryPanels().forEach(panel=>{
      if(panel.querySelector('.liftCategorySearch')) return;
      const wrap=document.createElement('div');
      wrap.className='liftCategorySearchWrap';
      wrap.innerHTML='<input type="search" class="liftCategorySearch" autocomplete="off" placeholder="Buscar categoría...">';
      panel.prepend(wrap);
    });
  }

  function filterCategories(value){
    const q=(typeof norm==='function' ? norm(value) : String(value||'').toLowerCase()).trim();
    categoryPanels().forEach(panel=>{
      let visible=0;
      panel.querySelectorAll('.liftCatAdminRow').forEach(row=>{
        const name=row.querySelector('.filterItem span')?.textContent||'';
        const hay=typeof norm==='function' ? norm(name) : name.toLowerCase();
        const show=!q || hay.includes(q);
        row.style.display=show?'':'none';
        if(show) visible++;
      });
      let empty=panel.querySelector('.liftCategoryEmpty');
      if(!visible && q){
        if(!empty){
          empty=document.createElement('div');
          empty.className='liftCategoryEmpty';
          empty.textContent='No encontré esa categoría.';
          panel.appendChild(empty);
        }
      }else empty?.remove();
    });
  }

  document.addEventListener('input',e=>{
    if(!e.target.matches('.liftCategorySearch'))return;
    const value=e.target.value||'';
    document.querySelectorAll('.liftCategorySearch').forEach(x=>{
      if(x!==e.target)x.value=value;
    });
    filterCategories(value);
  },true);

  /* setCat ya cierra el offcanvas móvil en el index. Conservamos esa lógica. */
  new MutationObserver(()=>requestAnimationFrame(ensureSearch))
    .observe(document.body,{childList:true,subtree:true});

  if(document.readyState==='loading'){
    document.addEventListener('DOMContentLoaded',ensureSearch);
  }else ensureSearch();
})();

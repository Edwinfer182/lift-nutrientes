
(function(){
  // El buscador filtra las tarjetas usando la función visual ya existente.
  document.addEventListener('input',function(e){
    if(!e.target.matches('.labVisualSearch'))return;
    const value=e.target.value||'';
    document.querySelectorAll('.labVisualSearch').forEach(x=>{if(x!==e.target)x.value=value});
    if(typeof window.renderLaboratoryVisualGrid==='function')window.renderLaboratoryVisualGrid(value);
  },true);

  // Mejora la selección existente: filtra, cierra panel móvil y lleva al catálogo.
  const original=window.selectLaboratoryVisual;
  window.selectLaboratoryVisual=function(name){
    if(typeof original==='function') original(name);
    else if(typeof window.setBrand==='function') window.setBrand(name);
    if(innerWidth<=760 && typeof window.closeOff==='function') window.closeOff();
    requestAnimationFrame(()=>document.getElementById('grid')?.scrollIntoView({behavior:'auto',block:'start'}));
  };

  // Si renderFilters reconstruye el panel, reinyecta el buscador donde haga falta.
  function ensureSearch(){
    document.querySelectorAll('.labVisualWrap').forEach(w=>{
      if(w.querySelector('.labVisualSearch'))return;
      const d=document.createElement('div');
      d.className='labVisualSearchWrap';
      d.innerHTML='<input class="labVisualSearch" type="search" autocomplete="off" placeholder="Buscar laboratorio...">';
      w.prepend(d);
    });
  }
  new MutationObserver(()=>requestAnimationFrame(ensureSearch)).observe(document.body,{childList:true,subtree:true});
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',ensureSearch);else ensureSearch();
})();

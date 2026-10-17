
(function(){
  function refreshLabsSoon(){
    setTimeout(()=>{
      try{
        const grid=document.getElementById('labVisualGrid');
        if(grid && typeof window.renderLaboratoryVisualGrid==='function'){
          const input=document.getElementById('labVisualSearch');
          window.renderLaboratoryVisualGrid(input ? input.value : '');
        }
      }catch(e){}
    },30);
  }

  // El panel de filtros se vuelve a crear varias veces al renderizar.
  // Si aparece un nuevo labVisualGrid, lo rellenamos de inmediato.
  const obs = new MutationObserver(mutations=>{
    for(const m of mutations){
      for(const node of m.addedNodes||[]){
        if(!(node instanceof HTMLElement)) continue;
        if(node.id==='labVisualGrid' || node.querySelector?.('#labVisualGrid')){
          refreshLabsSoon();
          return;
        }
      }
    }
  });

  function boot(){
    obs.observe(document.body,{childList:true,subtree:true});
    refreshLabsSoon();

    // En móvil, tocar la pestaña Laboratorios debe forzar el repintado
    // después de que el panel haya cambiado de contenido.
    document.addEventListener('click',e=>{
      const tab=e.target.closest('button');
      if(tab && /Laboratorios/i.test(tab.textContent||'')){
        refreshLabsSoon();
        setTimeout(refreshLabsSoon,120);
      }
    },true);

    window.addEventListener('resize',refreshLabsSoon);
    window.addEventListener('orientationchange',()=>setTimeout(refreshLabsSoon,150));
  }

  if(document.readyState==='loading'){
    document.addEventListener('DOMContentLoaded',boot);
  }else{
    boot();
  }
})();

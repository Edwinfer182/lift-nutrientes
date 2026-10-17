
(function(){
  'use strict';

  // ÚNICA fuente de imágenes de laboratorios: lift_catalog_config.laboratories_v1
  window.LIFT_LABORATORIES_SUPABASE = {};

  window.liftLabLogo = function(name){
    const key=String(name||'').trim();
    const direct=window.LIFT_LABORATORIES_SUPABASE?.[key];
    if(direct?.active===false) return '';
    if(direct?.image) return String(direct.image).trim();

    // tolerancia solo para mayúsculas/tildes; nunca usa mapas embebidos
    const nk=typeof norm==='function'?norm(key):key.toLowerCase();
    const found=Object.entries(window.LIFT_LABORATORIES_SUPABASE||{})
      .find(([k,v])=>(typeof norm==='function'?norm(k):k.toLowerCase())===nk && v?.active!==false);
    return found?.[1]?.image ? String(found[1].image).trim() : '';
  };

  function labsFromProducts(){
    const counts=new Map();
    (window.PRODUCTS||PRODUCTS||[]).forEach(p=>{
      const b=String(p?.brand||'').trim();
      if(!b) return;
      counts.set(b,(counts.get(b)||0)+1);
    });
    return liftSortBySupabaseOrder(
      [...counts.entries()].map(([name,count])=>({name,count})),
      window.LIFT_LABORATORIES_SUPABASE||{},
      x=>x.name
    );
  }

  window.renderLaboratoryVisualGrid=function(query=''){
    const q=String(query||'').trim().toLowerCase();
    const labs=labsFromProducts().filter(l=>!q||l.name.toLowerCase().includes(q));
    document.querySelectorAll('#labVisualGrid').forEach(grid=>{
      if(!labs.length){
        grid.innerHTML='<div class="labVisualEmpty">No encontré ese laboratorio.</div>';
        return;
      }
      grid.innerHTML=labs.map(l=>{
        const logo=window.liftLabLogo(l.name);
        const visual=logo
          ? `<img loading="lazy" decoding="async" src="${logo}" alt="Logo ${esc(l.name)}">`
          : `<span class="labVisualInitial">${esc(l.name.charAt(0))}</span>`;
        const active=state.brand===l.name?' on':'';
        return `<button type="button" class="labVisualCard${active}" onclick='selectLaboratoryVisual(${JSON.stringify(l.name)})'>
          <span class="labVisualLogoBox">${visual}</span>
          <span class="labVisualName">${esc(l.name)}</span>
          <span class="labVisualCount">${l.count} producto${l.count===1?'':'s'}</span>
        </button>`;
      }).join('');
    });
  };
})();

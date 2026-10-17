
(function(){
  const genericLabs = new Set(["Destacados Lift","Selección Lift"]);

  function allLabs(){
    const counts=new Map();
    (window.PRODUCTS||[]).forEach(p=>{
      const b=(p.brand||'').trim();
      if(!b || genericLabs.has(b)) return;
      counts.set(b,(counts.get(b)||0)+1);
    });
    return liftSortBySupabaseOrder(
      [...counts.entries()].map(([name,count])=>({name,count})),
      window.LIFT_LABORATORIES_SUPABASE||{},
      x=>x.name
    );
  }

  function labLogo(name){
    if(typeof window.liftLabLogo==='function') return window.liftLabLogo(name);
    const id=window.LIFT_BRAND_LOGOS?.[name];
    return id ? `https://drive.google.com/thumbnail?id=${id}&sz=w260` : '';
  }

  // Hay dos paneles simultáneos en el HTML: desktop y móvil.
  // Por eso no usamos getElementById: pintamos TODOS los grids existentes.
  window.renderLaboratoryVisualGrid=function(query=''){
    const q=(query||'').trim().toLowerCase();
    const labs=allLabs().filter(l=>!q || l.name.toLowerCase().includes(q));
    const grids=[...document.querySelectorAll('#labVisualGrid')];

    grids.forEach(grid=>{
      if(!labs.length){
        grid.innerHTML='<div class="labVisualEmpty">No encontré ese laboratorio.</div>';
        return;
      }
      grid.innerHTML=labs.map(l=>{
        const logo=labLogo(l.name);
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

  // Los dos buscadores también comparten id en desktop/móvil.
  document.addEventListener('input',e=>{
    if(e.target && e.target.matches('#labVisualSearch')){
      document.querySelectorAll('#labVisualSearch').forEach(input=>{
        if(input!==e.target) input.value=e.target.value;
      });
      window.renderLaboratoryVisualGrid(e.target.value);
    }
  },true);

  function paint(){
    if(typeof window.renderLaboratoryVisualGrid==='function'){
      const visibleInput=[...document.querySelectorAll('#labVisualSearch')]
        .find(x=>x.offsetParent!==null);
      window.renderLaboratoryVisualGrid(visibleInput?.value||'');
    }
  }

  // Cada renderFilters reemplaza ambos paneles, así que observamos ambos contenedores.
  const observer=new MutationObserver(muts=>{
    if(muts.some(m=>[...m.addedNodes].some(n=>
      n.nodeType===1 && (n.matches?.('#labVisualGrid,.labVisualWrap') || n.querySelector?.('#labVisualGrid'))
    ))){
      requestAnimationFrame(paint);
    }
  });

  function boot(){
    const desktop=document.getElementById('desktopFilters');
    const mobile=document.getElementById('mobileFilters');
    if(desktop) observer.observe(desktop,{childList:true,subtree:true});
    if(mobile) observer.observe(mobile,{childList:true,subtree:true});
    paint();

    document.addEventListener('click',e=>{
      const tab=e.target.closest('.filterTab');
      if(tab && /Laboratorios/i.test(tab.textContent||'')){
        requestAnimationFrame(()=>requestAnimationFrame(paint));
      }
    },true);
  }

  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',boot);
  else boot();
})();

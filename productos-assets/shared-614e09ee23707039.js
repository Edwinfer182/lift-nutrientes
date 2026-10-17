
(function(){
  function shuffle(arr){
    const a=[...arr];
    for(let i=a.length-1;i>0;i--){
      const j=Math.floor(Math.random()*(i+1));
      [a[i],a[j]]=[a[j],a[i]];
    }
    return a;
  }

  function getUsableCategories(){
    const counts=new Map();
    (window.PRODUCTS||[]).forEach(p=>{
      const c=(p.category||'').trim();
      if(!c) return;
      counts.set(c,(counts.get(c)||0)+1);
    });

    return [...counts.entries()]
      .filter(([name,count])=>count>0 && !/destacados|selecci[oó]n lift|varias marcas/i.test(name))
      .map(([name,count])=>({name,count}));
  }

  function findToolbar(){
    // Busca el contenedor actual de filtros rápidos por los botones existentes.
    const candidates=[...document.querySelectorAll('button')];
    const allBtn=candidates.find(b=>/^\s*Todos\s*$/i.test(b.textContent||''));
    if(!allBtn) return null;
    const parent=allBtn.parentElement;
    if(!parent) return null;
    const txt=parent.textContent||'';
    if(!/Prote[ií]na|Creatina|Pre entreno|Ofertas/i.test(txt)) return null;
    return parent;
  }

  function activateButton(container,btn){
    container.querySelectorAll('.quickFilterBtn').forEach(b=>{
      b.classList.remove('active');
      b.style.background='';
      b.style.color='';
    });
    btn.classList.add('active');
    btn.style.background='#111';
    btn.style.color='#fff';
  }

  function build(){
    const old=findToolbar();
    if(!old || old.dataset.dynamicLift==='1') return;

    const cats=getUsableCategories();
    if(!cats.length) return;

    // Intercala una selección distinta por sesión/carga, siempre usando categorías existentes.
    const preferred = ['Proteína Whey','Creatina','Pre Entreno','Vitaminas y Minerales','Aminoácidos','Omega 3','Colágeno','Bienestar','Salud','Ganadores de Peso'];
    const preferredExisting = preferred
      .map(n=>cats.find(c=>norm(c.name)===norm(n)))
      .filter(Boolean);

    const rest = cats.filter(c=>!preferredExisting.some(x=>x.name===c.name));
    let chosen = shuffle(preferredExisting).slice(0,3)
      .concat(shuffle(rest).slice(0,2));

    // Si hay pocas preferidas, completa con cualquier categoría real.
    const chosenNames=new Set(chosen.map(x=>x.name));
    if(chosen.length<5){
      for(const c of shuffle(cats)){
        if(!chosenNames.has(c.name)){
          chosen.push(c); chosenNames.add(c.name);
          if(chosen.length===5) break;
        }
      }
    }

    // Mezcla la posición para que no sean siempre las mismas ni en el mismo orden.
    chosen=shuffle(chosen).slice(0,5);

    const wrap=document.createElement('div');
    wrap.id='liftDynamicQuickFilters';
    wrap.dataset.dynamicLift='1';
    wrap.className=old.className;

    const makeBtn=(label,handler,extra='')=>{
      const b=document.createElement('button');
      b.type='button';
      b.className='quickFilterBtn '+extra;
      b.textContent=label;
      b.addEventListener('click',()=>{
        activateButton(wrap,b);
        handler();
      });
      return b;
    };

    const all=makeBtn('Todos',()=>{
      state.offerOnly=false;
      state.cat='Todos';
      state.brand='Todas';
      render();
    },'active');
    all.style.background='#111';
    all.style.color='#fff';
    wrap.appendChild(all);

    chosen.forEach(c=>{
      wrap.appendChild(makeBtn(c.name,()=>{
        state.offerOnly=false;
        setCat(c.name);
      }));
    });

    wrap.appendChild(makeBtn('🔥 Ofertas',()=>{
      state.offerOnly=true;
      state.cat='Todos';
      state.brand='Todas';
      render();
    }));

    old.replaceWith(wrap);
  }

  if(document.readyState==='loading'){
    document.addEventListener('DOMContentLoaded',()=>setTimeout(build,50));
  }else{
    setTimeout(build,50);
  }
})();

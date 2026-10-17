
(function(){
  function clean(v){
    return String(v||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').trim().toLowerCase();
  }
  function findCategory(raw){
    const q=clean(raw);
    const aliases={
      'creatina':'Creatina','creatine':'Creatina',
      'proteina':'Proteína','protein':'Proteína',
      'preentreno':'Pre entreno','pre entreno':'Pre entreno','pre-workout':'Pre entreno',
      'vitaminas':'Vitaminas','vitamina':'Vitaminas',
      'bienestar':'Bienestar'
    };
    if(aliases[q]) return aliases[q];
    const list=(window.cats||[]);
    return list.find(x=>clean(x)===q)||raw;
  }
  function runDeepLink(){
    const q=new URLSearchParams(location.search);
    if(q.get('pedido')) return; // Mi pedido conserva su flujo propio.

    const category=q.get('categoria');
    const brand=q.get('marca');
    const offers=q.get('ofertas');
    const product=q.get('producto');

    if(category && typeof window.liftViewCategory==='function'){
      window.liftViewCategory(findCategory(category));
      return true;
    }
    if(brand && typeof window.liftViewBrand==='function'){
      const wanted=clean(brand);
      const brands=(window.PRODUCTS||[]).map(p=>p.brand).filter(Boolean);
      const exact=brands.find(b=>clean(b)===wanted);
      window.liftViewBrand(exact||brand);
      return true;
    }
    if(offers==='1' && typeof window.showOffers==='function'){
      if(!window.state?.offerOnly) window.showOffers();
      document.getElementById('grid')?.scrollIntoView({behavior:'auto',block:'start'});
      return true;
    }
    // El producto por URL ya lo abre el detalle nuevo (openLiftProductById).
    // No abrir viewProduct(): era la ficha clásica y provocaba dos capas simultáneas.
    if(product){
      return true;
    }
    return false;
  }

  function boot(){
    let tries=0;
    const timer=setInterval(()=>{
      tries++;
      if(runDeepLink() || tries>30) clearInterval(timer);
    },200);
  }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',boot,{once:true});
  else boot();
})();

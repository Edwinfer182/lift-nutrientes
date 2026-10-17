
(function(){
  function norm(v){
    return String(v||'')
      .normalize('NFD').replace(/[\u0300-\u036f]/g,'')
      .toLowerCase().replace(/[^a-z0-9]+/g,' ').trim();
  }
  function imageKey(url){
    const s=String(url||'');
    const m=s.match(/[?&]id=([^&]+)/i);
    if(m) return m[1];
    const m2=s.match(/\/d\/([^/]+)/i);
    if(m2) return m2[1];
    return s.replace(/&sz=w\d+/ig,'').replace(/[?&]sz=w\d+/ig,'');
  }
  function staticRows(){
    return Array.isArray(window.LIFT_PRODUCTOS) ? window.LIFT_PRODUCTOS : [];
  }
  window.liftStaticProductRow=function(p){
    if(!p || p.__private) return null;
    const rows=staticRows();
    if(!rows.length) return null;

    const ik=imageKey(p.image);
    if(ik){
      const byImage=rows.find(x=>imageKey(x.image)===ik);
      if(byImage) return byImage;
    }

    const nn=norm(p.name);
    if(nn){
      const byName=rows.find(x=>norm(x.name)===nn);
      if(byName) return byName;
    }

    const byId=rows.find(x=>String(x.id)===String(p.id));
    if(byId && (!nn || norm(byId.name)===nn || norm(byId.name).includes(nn) || nn.includes(norm(byId.name)))) return byId;

    // Last safe fallback for titles we shortened during the compliance cleanup.
    if(nn){
      const candidates=rows.filter(x=>{
        const n=norm(x.name);
        return n && (n.startsWith(nn+' ') || nn.startsWith(n+' '));
      });
      if(candidates.length===1) return candidates[0];
    }
    return null;
  };

  // Las marcas autorizadas se leen de Supabase. En caso de error, no se inventan enlaces.
  const SEO_SB='https://vdxkknftyssjyfbdieqa.supabase.co';
  const SEO_KEY='sb_publishable_ECuhXuKIb85kj9fgdEjrAw_O7uNpZsh';
  let allowedBrands=null;
  const normBrand=v=>String(v||'SIN MARCA').trim().toLocaleLowerCase('es');
  const seoSlug=v=>String(v||'producto').normalize('NFKD').replace(/[\u0300-\u036f]/g,'').replace(/[^\x00-\x7F]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-+|-+$/g,'').slice(0,110)||'producto';
  window.liftSeoBrandsReady=fetch(SEO_SB+'/rest/v1/lift_seo_marcas?select=marca,habilitada&limit=500',{
    headers:{apikey:SEO_KEY,Authorization:'Bearer '+SEO_KEY}
  }).then(r=>{if(!r.ok)throw Error('SEO brands '+r.status);return r.json()}).then(rows=>{
    allowedBrands=new Set(rows.filter(x=>x.habilitada===true).map(x=>normBrand(x.marca)));
    return allowedBrands;
  }).catch(err=>{console.warn('No se pudo consultar marcas SEO',err);return null});
  window.liftSeoBrandAllowed=p=>!!p&&!!allowedBrands&&allowedBrands.has(normBrand(p.brand||p.marca));
  window.liftStaticProductUrl=function(p){
    if(!p || p.__private || p.hidden || p.oculto || !window.liftSeoBrandAllowed(p))return '';
    // El generador usa nombre normalizado + ID real de Supabase.
    return '/productos/'+seoSlug(p.name||p.nombre)+'-'+encodeURIComponent(String(p.id))+'.html';
  };
  window.goLiftStaticProduct=function(id){
    const p=(window.PRODUCTS||[]).find(x=>String(x.id)===String(id));
    if(!p || p.__private)return;
    const url=window.liftStaticProductUrl(p);
    if(url){location.href=url;return;}
    // Marca excluida, datos SEO sin cargar o sin página: conserva la ficha habitual.
    if(typeof window.openLiftProductById==='function')window.openLiftProductById(p.id);
  };
})();

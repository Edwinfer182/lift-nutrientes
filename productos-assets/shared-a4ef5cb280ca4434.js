
(function(){
  'use strict';
  const SB='https://vdxkknftyssjyfbdieqa.supabase.co';
  const KEY='sb_publishable_ECuhXuKIb85kj9fgdEjrAw_O7uNpZsh';
  const $=id=>document.getElementById(id);
  let requested=0, loadedId=null, loadedRecord=null;
  const setStatus=(message)=>{if($('liftSeoOverall'))$('liftSeoOverall').textContent=message;};
  const read=()=>({title:$('liftSeoTitle')?.value.trim()||'',meta:$('liftSeoMeta')?.value.trim()||'',html:$('liftSeoHtml')?.value.trim()||'',image:$('liftSeoImage')?.value.trim()||'',...(window.liftYoastReadFields?.()||{})});
  window.liftSeoRead=read;
  window.liftSeoLoad=(data={})=>{
    $('liftSeoTitle').value=data.title||'';
    $('liftSeoMeta').value=data.meta||'';
    $('liftSeoHtml').value=data.html||'';
    $('liftSeoImage').value=data.image||'';
  };
  window.liftSeoClear=()=>{requested++;loadedId=null;loadedRecord=null;window.liftSeoLoad({});$('liftSeoProductId').textContent='—';$('liftSeoUpdated').textContent='—';setStatus('Sin consultar');$('liftSeoSignals').textContent='';};
  window.liftSeoLoadForProduct=async(id)=>{
    const ticket=++requested;loadedId=null;loadedRecord=null;window.liftSeoLoad({});
    $('liftSeoProductId').textContent=String(id);$('liftSeoUpdated').textContent='—';setStatus('Consultando…');
    try{
      const url=SB+'/rest/v1/lift_producto_seo?select=producto_id,titulo_seo,meta_descripcion,descripcion_larga_html,imagen_seo,actualizado_en&producto_id=eq.'+encodeURIComponent(id)+'&limit=1';
      const res=await fetch(url,{headers:{apikey:KEY},cache:'no-store'});
      if(!res.ok)throw new Error('HTTP '+res.status+' al consultar SEO');
      const rows=await res.json();if(ticket!==requested)return;
      loadedId=String(id);loadedRecord=rows[0]||null;
      if(loadedRecord){window.liftSeoLoad({title:loadedRecord.titulo_seo,meta:loadedRecord.meta_descripcion,html:loadedRecord.descripcion_larga_html,image:loadedRecord.imagen_seo});$('liftSeoUpdated').textContent=loadedRecord.actualizado_en?new Date(loadedRecord.actualizado_en).toLocaleString('es-CO'):'—';setStatus('✓ Cargado de Supabase');}
      else{setStatus('Sin registro SEO');$('liftSeoSignals').textContent='Puedes crear la información SEO y guardarla junto al producto.';}
    }catch(e){if(ticket!==requested)return;setStatus('Error de lectura');$('liftSeoSignals').textContent='No se pudo consultar la tabla SEO: '+e.message;}
  };
  window.liftSeoSaveForProduct=async(p)=>{
    if(!p?.id)throw new Error('Falta el ID del producto para guardar SEO');
    if(String(loadedId)!==String(p.id) && document.getElementById('lafEditId')?.value)throw new Error('El SEO aún no se cargó desde Supabase. Abre de nuevo el producto antes de guardar.');
    if(typeof window.liftCatalogAdminCall!=='function')throw new Error('Inicia sesión administrativa para guardar SEO');
    const seo={...(p.seo&&typeof p.seo==='object'?p.seo:{}),...read()};
    setStatus('Guardando en Supabase…');
    // El backend de catálogo guarda product.seo; un trigger en Supabase
    // sincroniza los cuatro campos con lift_producto_seo.
    await window.liftCatalogAdminCall({action:'save',product:{...p,seo}});
    // Verificar los campos Yoast en el JSON real almacenado en lift_productos.
    const verifyUrl=SB+'/rest/v1/lift_productos?select=product&id=eq.'+encodeURIComponent(p.id)+'&limit=1';
    const verifyRes=await fetch(verifyUrl,{headers:{apikey:KEY},cache:'no-store'});
    if(!verifyRes.ok)throw new Error('No se pudo verificar los campos Yoast en Supabase (HTTP '+verifyRes.status+')');
    const verifyRows=await verifyRes.json();
    const stored=verifyRows[0]?.product?.seo;
    if(!stored||['focus','slug','lsi','alt1','alt2'].some(k=>JSON.stringify(stored[k]??'')!==JSON.stringify(seo[k]??'')))throw new Error('Supabase no confirmó todos los campos Yoast. Revisa los permisos o el guardado del catálogo.');
    p.seo={...seo};
    await window.liftSeoLoadForProduct(p.id);
    if(String(loadedId)!==String(p.id))throw new Error('No se pudo verificar el SEO guardado');
    const expected=[seo.title,seo.meta,seo.html,seo.image];
    const actual=[loadedRecord?.titulo_seo||'',loadedRecord?.meta_descripcion||'',loadedRecord?.descripcion_larga_html||'',loadedRecord?.imagen_seo||''];
    if(expected.some((v,i)=>v!==actual[i]))throw new Error('Supabase no confirmó los cambios SEO; revisa la conexión antes de continuar');
    setStatus('✓ Guardado y verificado');
  };
})();

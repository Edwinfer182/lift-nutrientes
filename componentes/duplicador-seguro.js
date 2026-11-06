/* SUPGO · duplicación atómica y segura.
 * La marca/categoría/imágenes provienen del original; slug + SEO se crean
 * en una sola transacción PostgreSQL, con borrador no publicado. */
(function(){
 'use strict';
 if(typeof window.liftCardAdminDuplicate!=='function')return;
 const SB='https://vdxkknftyssjyfbdieqa.supabase.co';
 const KEY='sb_publishable_ECuhXuKIb85kj9fgdEjrAw_O7uNpZsh';
 let duplicating=false;
 const draftIds=new Set();
 function installDraftGuard(){
   const originalSave=window.liftCloudSaveProduct;
   if(typeof originalSave!=='function')return false;
   if(originalSave.__supgoDraftProtected)return true;
   const guarded=async function(p){
     if(!draftIds.has(String(p?.id)))return originalSave.apply(this,arguments);
     const pw=(()=>{try{return sessionStorage.getItem('liftAdminCloudPasswordV1')||''}catch(e){return ''}})();
     const extra={...p};
     ['id','name','brand','category','price','image','description','presentation','flavor','slug'].forEach(k=>delete extra[k]);
     const payload={
       id:p.id,nombre:p.name,slug:p.slug,marca:p.brand,categoria:p.category,
       precio:p.price,imagen:p.image,descripcion:p.description||'',
       presentacion:p.presentation||'',sabor:p.flavor||'',
       activo:false,indexable:false,titulo_seo:'',meta_descripcion:'',
       descripcion_larga_html:'',imagen_seo:'',palabra_clave:'',
       datos_estructurados:null,product_extra:extra
     };
     const r=await fetch(SB+'/rest/v1/rpc/lift_editor_admin',{
       method:'POST',
       headers:{apikey:KEY,Accept:'application/json','Content-Type':'application/json'},
       body:JSON.stringify({p_password:pw,p_action:'save_product',p_payload:payload})
     });
     const j=await r.json().catch(()=>({}));
     if(!r.ok||!j?.ok)throw Error(j.message||('No se pudo guardar el borrador: '+r.status));
     return {ok:true,product:p};
   };
   guarded.__supgoDraftProtected=true;
   window.liftCloudSaveProduct=guarded;
   return true;
 }
 // El administrador antiguo instala el guardado con un pequeño retraso.
 // Reinstalar la protección cuando aparezca evita que vuelva a activar borradores.
 const guardCheck=window.setInterval(installDraftGuard,500);
 window.setTimeout(()=>window.clearInterval(guardCheck),15000);
 installDraftGuard();

 window.liftCardAdminDuplicate=async function(id){
   if(!document.body.classList.contains('liftAdminUnlocked'))return;
   if(duplicating)return;
   const pw=(()=>{try{return sessionStorage.getItem('liftAdminCloudPasswordV1')||''}catch(e){return ''}})();
   if(!pw){alert('Inicia sesión como administrador para duplicar productos.');return}
   const original=typeof PRODUCTS!=='undefined'&&Array.isArray(PRODUCTS)
       ?PRODUCTS.find(p=>String(p.id)===String(id)):null;
   if(!original){alert('No encontré el producto original en el catálogo.');return}
   duplicating=true;
   try{
     const res=await fetch(SB+'/rest/v1/rpc/lift_duplicar_producto_admin',{
       method:'POST',
       headers:{apikey:KEY,Accept:'application/json','Content-Type':'application/json'},
       body:JSON.stringify({p_password:pw,p_producto_id:Number(id)})
     });
     const data=await res.json().catch(()=>({}));
     if(!res.ok||!data?.ok)throw Error(data.message||('Error al duplicar: '+res.status));
     if(!data.id||!data.slug||!data.product)throw Error('La copia se guardó, pero la respuesta está incompleta. Revisa el editor de Supabase.');
     const copy=data.product;
     copy.id=data.id;
     copy.slug=data.slug;
     draftIds.add(String(data.id));
     if(!PRODUCTS.some(p=>String(p.id)===String(copy.id)))PRODUCTS.push(copy);
     if(!installDraftGuard())throw Error('La copia se guardó en Supabase, pero el editor clásico no está listo; ábrela desde el Editor Supabase.');
     if(typeof render==='function')render();
     if(typeof renderCart==='function')renderCart();
     if(typeof lafRenderProducts==='function')lafRenderProducts();
     if(typeof window.renderLaboratoryVisualGrid==='function')window.renderLaboratoryVisualGrid('');
     if(typeof window.openLiftAdminFull==='function')window.openLiftAdminFull();
     window.setTimeout(()=>{
       if(typeof window.lafEdit==='function')window.lafEdit(data.id);
     },80);
     alert('Copia creada en el mismo laboratorio y categoría. ID '+data.id+
       '\nSlug: '+data.slug+
       '\nEstado: BORRADOR (inactivo y no indexable).'+
       '\nCompleta el nombre, SEO y revisa la ficha antes de publicarla.');
   }catch(e){
     alert('No se pudo completar la duplicación: '+(e.message||e)+
       '\nComprueba en el editor si el producto ya quedó guardado antes de intentar duplicarlo otra vez.');
   }finally{duplicating=false}
 };
 window.liftCardAdminDuplicate.__supgoSeguro=true;
})();
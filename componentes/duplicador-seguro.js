/* SUPGO · duplicación atómica y segura.
 * La marca/categoría/imágenes provienen del original; slug + SEO se crean
 * en una sola transacción PostgreSQL, con borrador no publicado. */
(function(){
 'use strict';
 if(typeof window.liftCardAdminDuplicate!=='function')return;
 const SB='https://vdxkknftyssjyfbdieqa.supabase.co';
 const KEY='sb_publishable_ECuhXuKIb85kj9fgdEjrAw_O7uNpZsh';
 let duplicating=false;
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
     if(!data.id||!data.slug||!data.product)throw Error('La copia no devolvió los datos esperados');
     const copy=data.product;
     copy.id=data.id;
     copy.slug=data.slug;
     if(!PRODUCTS.some(p=>String(p.id)===String(copy.id)))PRODUCTS.push(copy);
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
     // No se añade una copia local cuando falla Supabase.
     alert('No se creó el duplicado: '+(e.message||e));
   }finally{duplicating=false}
 };
 window.liftCardAdminDuplicate.__supgoSeguro=true;
})();
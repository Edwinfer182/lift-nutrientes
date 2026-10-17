
(function(){
 const DELETE_KEY='liftAdminDeletedProductsV1';
 function deleted(){try{return JSON.parse(localStorage.getItem(DELETE_KEY)||'[]')}catch(e){return []}}
 function saveDeleted(a){localStorage.setItem(DELETE_KEY,JSON.stringify([...new Set(a.map(String))]))}
 function purgeDeleted(){
   const ids=new Set(deleted().map(String)); if(!ids.size)return;
   for(let i=PRODUCTS.length-1;i>=0;i--) if(ids.has(String(PRODUCTS[i].id))) PRODUCTS.splice(i,1);
 }
 window.liftCardAdminEdit=function(id){
   if(!document.body.classList.contains('liftAdminUnlocked'))return;
   if(typeof window.openLiftAdminFull==='function') window.openLiftAdminFull();
   setTimeout(()=>{if(typeof window.lafEdit==='function') window.lafEdit(id)},20);
 };
 window.liftCardAdminDuplicate=async function(id){
   if(!document.body.classList.contains('liftAdminUnlocked'))return;
   const original=PRODUCTS.find(x=>String(x.id)===String(id)); if(!original)return;
   const numericIds=PRODUCTS.map(x=>Number(x.id)).filter(Number.isFinite);
   const newId=(numericIds.length?Math.max(...numericIds):0)+1;
   let copy;
   try{copy=structuredClone(original)}catch(e){copy=JSON.parse(JSON.stringify(original))}
   copy.id=newId;
   copy.name=String(original.name||'Producto')+' - Copia';
   delete copy.slug;
   delete copy.__private;
   PRODUCTS.push(copy);

   try{
     const o=JSON.parse(localStorage.getItem('liftAdminDetalV1')||'{}');
     o[String(newId)]={name:copy.name,brand:copy.brand||'',category:copy.category||'',price:Number(copy.price)||0,image:copy.image||''};
     localStorage.setItem('liftAdminDetalV1',JSON.stringify(o));
   }catch(e){}

   try{
     if(typeof window.liftCloudSaveProduct==='function') await window.liftCloudSaveProduct(copy);
   }catch(e){
     alert('El producto se duplicó en pantalla, pero no pudo guardarse en Supabase: '+e.message);
   }

   if(typeof render==='function')render();
   if(typeof renderCart==='function')renderCart();
   if(typeof lafRenderProducts==='function')lafRenderProducts();if(typeof window.renderLaboratoryVisualGrid==='function')window.renderLaboratoryVisualGrid('');

   if(typeof window.openLiftAdminFull==='function')window.openLiftAdminFull();
   setTimeout(()=>{if(typeof window.lafEdit==='function')window.lafEdit(newId)},30);
 }; 
 window.liftCardAdminDelete=function(id){
   if(!document.body.classList.contains('liftAdminUnlocked'))return;
   const p=PRODUCTS.find(x=>String(x.id)===String(id)); if(!p)return;
   if(!confirm('¿Eliminar este producto del catálogo?'))return;
   const ids=deleted(); ids.push(String(id)); saveDeleted(ids);
   const i=PRODUCTS.findIndex(x=>String(x.id)===String(id)); if(i>=0)PRODUCTS.splice(i,1);
   try{const o=JSON.parse(localStorage.getItem('liftAdminDetalV1')||'{}');delete o[String(id)];localStorage.setItem('liftAdminDetalV1',JSON.stringify(o))}catch(e){}
   try{const m=JSON.parse(localStorage.getItem('liftAdminFullMetaV2')||'{}');if(m.out)delete m.out[String(id)];localStorage.setItem('liftAdminFullMetaV2',JSON.stringify(m))}catch(e){}
   if(typeof render==='function')render(); if(typeof renderCart==='function')renderCart(); if(typeof lafRenderProducts==='function')lafRenderProducts();
 };
 purgeDeleted();
 if(typeof render==='function')render();
})();

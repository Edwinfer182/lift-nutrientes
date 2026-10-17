
(function(){
 const clean=s=>String(s||'').trim();
 window.liftToggleManualProduct=function(force){const f=document.getElementById('liftManualProductForm');if(!f)return;f.hidden=typeof force==='boolean'?!force:!f.hidden;if(!f.hidden)setTimeout(()=>document.getElementById('liftManualName')?.focus(),30)};
 function nextId(){return Math.max(0,...PRODUCTS.map(p=>Number(p.id)).filter(Number.isFinite))+1}
 function addDirect(p){
   if(!PRODUCTS.some(x=>String(x.id)===String(p.id)))PRODUCTS.push(p);
   checkoutMode='cart';checkoutSingleId=null;
   const key=String(p.id);cart[key]=(cart[key]||0)+1;saveCart();renderCart();renderCheckoutSummary();
 }
 window.liftRemoveManualCheckoutItem=function(key){key=String(key);delete cart[key];if(typeof cartMeta!=='undefined')delete cartMeta[key];saveCart();renderCart();renderCheckoutSummary()};
 window.liftCreateManualProduct=async function(){
   if(!document.body.classList.contains('liftAdminUnlocked'))return;
   const status=document.getElementById('liftManualStatus'),name=clean(document.getElementById('liftManualName')?.value),brand=clean(document.getElementById('liftManualBrand')?.value)||'Sin marca',presentation=clean(document.getElementById('liftManualPresentation')?.value),price=Math.max(0,Number(document.getElementById('liftManualPrice')?.value||0)),image=clean(document.getElementById('liftManualImage')?.value),visibility=document.getElementById('liftManualVisibility')?.value||'admin';
   if(!name){status.textContent='Escribe el nombre del producto.';return}if(!price){status.textContent='Escribe el precio del producto.';return}
   const fullName=presentation&&!name.toLowerCase().includes(presentation.toLowerCase())?name+' '+presentation:name;
   const p={id:visibility==='order'?'manual-'+Date.now():nextId(),name:fullName,brand,category:'Otros',price,image:image||'https://placehold.co/600x600?text=Producto',presentation,_manualProduct:true,adminOnly:visibility!=='public',__private:visibility==='admin',visibility:visibility==='admin'?'admin':visibility,_checkoutOnly:visibility==='order'};
   status.textContent=visibility==='order'?'Agregando al pedido…':'Guardando en Supabase…';
   try{
     if(visibility!=='order'){
       if(typeof window.liftCloudSaveProduct!=='function')throw new Error('No encontré la conexión de productos con Supabase.');
       await window.liftCloudSaveProduct(p);
     }
     addDirect(p);
     status.textContent=visibility==='order'?'✓ Agregado solo a este pedido':visibility==='public'?'✓ Guardado como público y agregado':'✓ Guardado solo para administrador y agregado';
     ['liftManualName','liftManualBrand','liftManualPresentation','liftManualPrice','liftManualImage'].forEach(id=>{const e=document.getElementById(id);if(e)e.value=''});
     setTimeout(()=>liftToggleManualProduct(false),900);
     if(typeof render==='function')render();
   }catch(e){status.textContent='No pude guardar: '+(e.message||e)}
 };
 // Asegura que productos privados cargados desde Supabase desaparezcan del catálogo al salir de Admin.
 const oldLock=window.lockLiftAdmin;if(typeof oldLock==='function'&&!oldLock.__manualVisibility){const f=function(){const r=oldLock.apply(this,arguments);if(typeof render==='function')render();return r};f.__manualVisibility=true;window.lockLiftAdmin=f}
})();

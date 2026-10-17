
(function(){
 let currentProduct=null,currentGroup=null,currentRows=[];
 const $=id=>document.getElementById(id);
 const esc=s=>String(s??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
 const num=v=>window.liftVariantMoney(v);
 const fmt=v=>Number(v||0).toLocaleString('es-CO');
 const products=()=>window.PRODUCTS||[];
 const product=id=>products().find(p=>String(p.id)===String(id));
 function publicGroup(id){return (window.LIFT_PUBLIC_VARIANT_GROUPS||[]).find(g=>(g.lift_producto_variantes||[]).some(v=>String(v.producto_id)===String(id)))||null}
 async function adminGroup(id){
   let groups=window.LIFT_VARIANT_GROUP_ADMIN_CACHE||[];
   let g=groups.find(x=>(x.lift_producto_variantes||[]).some(v=>String(v.producto_id)===String(id)));
   if(g)return g;
   if(typeof window.liftCatalogAdminCall!=='function')return null;
   try{const r=await window.liftCatalogAdminCall({action:'variant-groups'});groups=Array.isArray(r.grupos)?r.grupos:[];window.LIFT_VARIANT_GROUP_ADMIN_CACHE=groups;return groups.find(x=>(x.lift_producto_variantes||[]).some(v=>String(v.producto_id)===String(id)))||null}catch(e){return null}
 }
 function rowData(v,isBase=false){const p=v?.producto_id?product(v.producto_id):null;return {producto_id:v?.producto_id?Number(v.producto_id):null,sabor:String(v?.sabor||p?.flavor||''),imagen:String(v?.imagen||p?.image||''),precio:Number(v?.precio??p?.price??currentProduct?.price??0)||0,isBase}}
 function renderRows(){
   $('lcvRows').innerHTML=currentRows.map((r,i)=>`<div class="lcvRow" data-i="${i}"><div><input class="lcvFlavor" placeholder="Sabor, ej. Fruit Punch" value="${esc(r.sabor)}"><div class="lcvExisting">${r.producto_id?'Producto ID '+esc(r.producto_id)+(r.isBase?' · producto actual':''):'Nuevo sabor'}</div></div><input class="lcvImage" placeholder="URL imagen del sabor (opcional)" value="${esc(r.imagen)}"><input class="lcvPrice" inputmode="numeric" placeholder="Precio" value="${r.precio?fmt(r.precio):''}"><button class="lcvRemove" type="button" title="Quitar" ${r.isBase&&!currentGroup?'disabled':''} onclick="liftCardVariantRemoveRow(${i})">×</button></div>`).join('');
 }
 function syncRows(){currentRows=[...$('lcvRows').querySelectorAll('.lcvRow')].map((el,i)=>{const old=currentRows[Number(el.dataset.i)]||{};return {...old,sabor:el.querySelector('.lcvFlavor').value.trim(),imagen:el.querySelector('.lcvImage').value.trim(),precio:num(el.querySelector('.lcvPrice').value)||Number(currentProduct?.price||0),orden:i}})}
 window.liftCardVariantAddRow=function(){syncRows();currentRows.push({producto_id:null,sabor:'',imagen:'',precio:Number(currentGroup?.precio||currentProduct?.price||0),isBase:false});renderRows();setTimeout(()=>{const a=$('lcvRows').querySelectorAll('.lcvFlavor');a[a.length-1]?.focus()},0)};
 window.liftCardVariantRemoveRow=function(i){syncRows();if(currentRows[i]?.isBase&&!currentGroup)return;currentRows.splice(i,1);renderRows()};
 window.liftCloseCardVariantEditor=function(){$('liftCardVariantBackdrop')?.classList.remove('show');$('liftCardVariantModal')?.classList.remove('show')};
 window.liftCardEditVariants=async function(id){
   if(!document.body.classList.contains('liftAdminUnlocked'))return;
   currentProduct=product(id);if(!currentProduct)return;
   $('lcvStatus').textContent='Consultando variaciones en Supabase…';$('lcvProduct').innerHTML=`<div class="lcvProduct"><img src="${esc(currentProduct.image||'')}" onerror="this.style.visibility='hidden'"><div><b>${esc(currentProduct.name||'Producto')}</b><span>${esc(currentProduct.brand||'')} · ${esc(currentProduct.presentation||'')} · ID ${esc(currentProduct.id)}</span></div></div>`;
   $('liftCardVariantBackdrop').classList.add('show');$('liftCardVariantModal').classList.add('show');
   currentGroup=await adminGroup(id);
   if(currentGroup && typeof window.lafOpenVariantGroupEditor==='function'){
     window.liftCloseCardVariantEditor();
     window.lafOpenVariantGroupEditor(currentGroup.id);
     return;
   }
   if(currentGroup){
     const vv=Array.isArray(currentGroup.lift_producto_variantes)?currentGroup.lift_producto_variantes:[];
     currentRows=vv.sort((a,b)=>Number(a.orden||0)-Number(b.orden||0)).map(v=>rowData(v,false));
     $('lcvSubtitle').textContent=`Editando grupo ${currentGroup.id} · ${currentRows.length} variaciones`;
   }else{
     const pg=publicGroup(id); const pv=pg?.lift_producto_variantes?.find(v=>String(v.producto_id)===String(id));
     currentRows=[rowData(pv||{producto_id:Number(id),sabor:currentProduct.flavor||''},true),{producto_id:null,sabor:'',imagen:'',precio:Number(currentProduct.price||0),isBase:false}];
     $('lcvSubtitle').textContent='Este producto aún no tiene grupo · se conservará su ID actual';
   }
   renderRows();$('lcvStatus').textContent='';
 };
 function nextId(){const ids=products().map(p=>Number(p.id)).filter(Number.isFinite);return (ids.length?Math.max(...ids):0)+1}
 window.liftSaveCardVariants=async function(){
   if(!currentProduct||typeof window.liftCatalogAdminCall!=='function')return $('lcvStatus').textContent='No encontré la conexión administrativa con Supabase.';
   syncRows();const rows=currentRows.filter(r=>r.sabor);
   if(rows.length<2)return $('lcvStatus').textContent='Debes dejar mínimo 2 sabores/variaciones.';
   const keys=new Set();for(const r of rows){const k=r.sabor.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();if(keys.has(k))return $('lcvStatus').textContent='Hay sabores repetidos. Corrige los nombres antes de guardar.';keys.add(k)}
   const btn=$('lcvSave');btn.disabled=true;$('lcvStatus').textContent='Guardando variaciones en Supabase…';
   const groupBase=currentGroup?{nombre:currentGroup.nombre||currentProduct.name,marca:currentGroup.marca||currentProduct.brand,categoria:currentGroup.categoria||currentProduct.category,presentacion:currentGroup.presentacion||currentProduct.presentation,precio:Number(currentGroup.precio||currentProduct.price||0),imagen:currentGroup.imagen||currentProduct.image||'',visible_publico:currentGroup.visible_publico!==false}:{nombre:currentProduct.name||'',marca:currentProduct.brand||'',categoria:currentProduct.category||'',presentacion:currentProduct.presentation||'',precio:Number(currentProduct.price||0),imagen:currentProduct.image||'',visible_publico:true};
   try{
     let nid=nextId();const final=[];
     for(const r of rows){
       if(r.producto_id){
         const p=product(r.producto_id);if(p){p.flavor=r.sabor;p.flavors=[r.sabor];if(r.imagen)p.image=r.imagen;p.price=Number(groupBase.precio||currentProduct.price||0);await window.liftCatalogAdminCall({action:'save',product:p})}
         final.push({...r,producto_id:Number(r.producto_id)});
       }else{
         while(products().some(p=>Number(p.id)===Number(nid)))nid++;
         const np={id:nid++,name:groupBase.nombre,brand:groupBase.marca,category:groupBase.categoria,presentation:groupBase.presentacion,price:groupBase.precio,trainerPrice:currentProduct.trainerPrice||null,image:r.imagen||groupBase.imagen,description:currentProduct.description||'',flavor:r.sabor,flavors:[r.sabor]};
         await window.liftCatalogAdminCall({action:'save',product:np});products().push(np);final.push({...r,producto_id:Number(np.id)});
       }
     }
     if(currentGroup)await window.liftCatalogAdminCall({action:'delete-variant-group',id:Number(currentGroup.id)});
     const res=await window.liftCatalogAdminCall({action:'merge-variants',product_ids:final.map(r=>r.producto_id),group:groupBase,variants:final.map((r,i)=>({producto_id:r.producto_id,sabor:r.sabor,imagen:r.imagen||'',precio:groupBase.precio,orden:i}))});
     if(typeof window.liftReloadVariantGroups==='function')await window.liftReloadVariantGroups();
     if(typeof window.lafLoadVariantGroups==='function')await window.lafLoadVariantGroups().catch(()=>{});
     if(typeof render==='function')render();
     $('lcvStatus').textContent=`✓ Guardado. ${final.length} variaciones · grupo ${res.grupo_id||currentGroup?.id||''}.`;
     setTimeout(()=>liftCloseCardVariantEditor(),700);
   }catch(e){$('lcvStatus').textContent='No se pudo completar: '+(e.message||e)}finally{btn.disabled=false}
 };
})();

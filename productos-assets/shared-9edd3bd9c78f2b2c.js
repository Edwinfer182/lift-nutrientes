
(function(){
 const KEY='liftAdminDetalV1', META='liftAdminFullMetaV2'; let pending={products:[],offers:[],combos:[]};
 const $=id=>document.getElementById(id), norm=v=>String(v??'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().trim();
 const num=v=>Number(String(v??'').replace(/[^0-9]/g,''))||0, fmt=n=>Number(n||0).toLocaleString('es-CO');
 function esc(v){return String(v??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]))}
 function store(){try{return JSON.parse(localStorage.getItem(KEY)||'{}')}catch(e){return {}}} function saveStore(o){localStorage.setItem(KEY,JSON.stringify(o))}
 function meta(){try{return JSON.parse(localStorage.getItem(META)||'{"out":{}}')}catch(e){return {out:{}}}} function saveMeta(o){localStorage.setItem(META,JSON.stringify(o))}
 function refresh(){try{render()}catch(e){} try{renderCart()}catch(e){} try{renderQuickSearch()}catch(e){} try{renderFilters()}catch(e){} lafRenderProducts(); lafFillLists();}
 function patch(p){const o=store();o[String(p.id)]={...(o[String(p.id)]||{}),name:p.name,brand:p.brand,category:p.category,price:p.price,trainerPrice:p.trainerPrice||null,image:p.image,description:p.description||'',flavors:p.flavors||[]};saveStore(o)}
 function nextId(){return Math.max(0,...PRODUCTS.map(p=>Number(p.id)||0))+1}
 window.openLiftAdminFull=function(){ $('lafBackdrop').classList.add('show');$('lafPanel').classList.add('open');lafRenderProducts();lafFillLists();lafRenderOffers();lafRenderCombos();lafRenderCategories()};
 window.closeLiftAdminFull=function(){$('lafBackdrop').classList.remove('show');$('lafPanel').classList.remove('open')};
 window.lafTab=function(name,btn){document.querySelectorAll('.lafPane').forEach(x=>x.classList.remove('on'));document.querySelectorAll('.lafTab').forEach(x=>x.classList.remove('on'));$('laf-'+name).classList.add('on');btn?.classList.add('on');if(name==='offers')lafRenderOffers();if(name==='combos')lafRenderCombos();if(name==='categories')lafRenderCategories();if(name==='variants'){lafRenderVariantBuilder();lafLoadVariantGroups()}if(name==='create')lafFillLists();if(name==='audit')lafRenderAudit()};
 window.lafFillLists=function(){const bs=liftSortBySupabaseOrder([...new Set(PRODUCTS.map(p=>p.brand).filter(Boolean))],window.LIFT_LABORATORIES_SUPABASE||{},x=>x);const cs=liftSortBySupabaseOrder([...new Set(PRODUCTS.map(p=>p.category).filter(Boolean))],LIFT_CATEGORY_CONFIG,x=>x);$('lafBrands').innerHTML=bs.map(x=>`<option value="${esc(x)}">`).join('');$('lafCategories').innerHTML=cs.map(x=>`<option value="${esc(x)}">`).join('')};
 window.LIFT_BULK_SELECTED=window.LIFT_BULK_SELECTED||new Set();
 window.lafBulkDestinations=function(){
   const field=String($('lafBulkField')?.value||'category');
   let arr=[];
   if(field==='brand'){
     const cfg=window.LIFT_LABORATORIES_SUPABASE||{};
     arr=[...new Set([...Object.keys(cfg).filter(k=>cfg[k]?.active!==false&&!cfg[k]?.__deleted),...PRODUCTS.map(p=>String(p.brand||'').trim()).filter(Boolean)])];
     arr=liftSortBySupabaseOrder(arr,cfg,x=>x);
   }else{
     if(typeof rebuildLiftCategories==='function')rebuildLiftCategories();
     arr=(typeof cats!=='undefined'?cats:[...new Set(PRODUCTS.map(p=>p.category).filter(Boolean))]).filter(c=>c&&c!=='Todos');
     arr=liftSortBySupabaseOrder(arr,typeof LIFT_CATEGORY_CONFIG!=='undefined'?LIFT_CATEGORY_CONFIG:{},x=>x);
   }
   const sel=$('lafBulkTarget');if(!sel)return;
   const old=sel.value;
   sel.innerHTML=arr.map(c=>`<option value="${esc(c)}">${esc(c)}</option>`).join('');
   if(arr.includes(old))sel.value=old;
 };
 window.lafBulkCategories=window.lafBulkDestinations;
 window.lafBulkUpdate=function(){
   const set=window.LIFT_BULK_SELECTED;
   const el=$('lafBulkCount');if(el)el.textContent=`${set.size} seleccionado${set.size===1?'':'s'}`;
   document.querySelectorAll('#lafProductList .lafBulkCheck').forEach(ch=>ch.checked=set.has(String(ch.value)));
   const all=$('lafBulkAll');
   if(all){
     const visible=[...document.querySelectorAll('#lafProductList .lafBulkCheck')];
     all.checked=visible.length>0&&visible.every(ch=>set.has(String(ch.value)));
     all.indeterminate=visible.some(ch=>set.has(String(ch.value)))&&!all.checked;
   }
   lafBulkDestinations();
 };
 window.lafBulkToggle=function(id,checked){checked?window.LIFT_BULK_SELECTED.add(String(id)):window.LIFT_BULK_SELECTED.delete(String(id));lafBulkUpdate()};
 window.lafBulkToggleVisible=function(checked){
   document.querySelectorAll('#lafProductList .lafBulkCheck').forEach(ch=>{checked?window.LIFT_BULK_SELECTED.add(String(ch.value)):window.LIFT_BULK_SELECTED.delete(String(ch.value))});
   lafBulkUpdate();
 };
 window.lafBulkClear=function(){window.LIFT_BULK_SELECTED.clear();lafBulkUpdate();const st=$('lafBulkStatus');if(st)st.textContent=''};
 window.lafRenderProducts=function(){
   const q=norm($('lafSearch').value),f=$('lafStatusFilter').value,m=meta();
   let a=PRODUCTS.filter(p=>!q||norm([p.name,p.brand,p.category].join(' ')).includes(q));
   if(f==='out')a=a.filter(p=>m.out?.[p.id]);
   if(f==='offer')a=a.filter(p=>typeof WEEKLY_OFFERS!=='undefined'&&WEEKLY_OFFERS[p.id]);
   if(f==='available')a=a.filter(p=>!m.out?.[p.id]);
   $('lafCount').textContent=`${a.length} productos · ${PRODUCTS.length} en total`;
   $('lafProductList').innerHTML=a.slice(0,350).map(p=>`<div class="lafRow lafBulkRow">
     <label class="lafBulkCheckWrap" title="Seleccionar"><input class="lafBulkCheck" type="checkbox" value="${esc(p.id)}" ${window.LIFT_BULK_SELECTED.has(String(p.id))?'checked':''} onchange="lafBulkToggle(this.value,this.checked)"></label>
     <img src="${esc(p.image||'')}" onerror="this.style.visibility='hidden'">
     <div><div class="lafName">${esc(p.name)}</div><div class="lafMeta">${esc(p.brand||'')} · ${esc(p.category||'')} ${m.out?.[p.id]?'· AGOTADO':''}</div></div>
     <div class="liftInlineFields">
      <input class="lafPrice" id="lafp_${p.id}" value="${fmt(p.price)}" title="Precio">
      <input class="liftUrlInput" id="liftMainUrl_${p.id}" value="${esc(p.image||'')}" placeholder="URL principal" title="Imagen principal" type="url">
      <input class="liftUrlInput" id="liftSecondUrl_${p.id}" data-lift-secondary="${esc(p.id)}" placeholder="URL secundaria / tabla" title="Primera imagen secundaria" type="url">
    </div>
     <div class="lafActions"><button class="lafIcon" title="Guardar precio e imágenes" onclick="liftSaveInlineImages(${JSON.stringify(p.id)},this)">✓</button><button class="lafIcon" title="Duplicar" onclick="liftCardAdminDuplicate(${JSON.stringify(p.id)})">⧉</button><button class="lafIcon" title="Editar" onclick="lafEdit(${JSON.stringify(p.id)})">✎</button></div>
   </div>`).join('')||'<div class="lafNote">No hay resultados.</div>';
   lafBulkUpdate();
 };
 window.lafBulkMoveSelected=async function(){
   const ids=[...window.LIFT_BULK_SELECTED],field=String($('lafBulkField')?.value||'category'),target=String($('lafBulkTarget')?.value||'').trim(),status=$('lafBulkStatus');
   const isBrand=field==='brand',label=isBrand?'laboratorio':'categoría';
   if(!ids.length){status.textContent='Selecciona al menos un producto.';return}
   if(!target){status.textContent=`Selecciona el ${label} destino.`;return}
   const arr=PRODUCTS.filter(p=>ids.includes(String(p.id)));
   const backup=arr.map(p=>({p,value:isBrand?p.brand:p.category}));
   const previousLabConfig=isBrand?JSON.parse(JSON.stringify(window.LIFT_LABORATORIES_SUPABASE||{})):null;
   const previousCatConfig=!isBrand&&typeof LIFT_CATEGORY_CONFIG!=='undefined'?JSON.parse(JSON.stringify(LIFT_CATEGORY_CONFIG||{})):null;
   const btn=document.querySelector('#laf-products .lafBulkTools .primary');
   if(btn)btn.disabled=true;
   try{
     let done=0;status.textContent=`Moviendo 0 de ${arr.length} a ${target}…`;
     const queue=[...arr];
     const workers=Array.from({length:Math.min(4,queue.length)},async()=>{
       while(queue.length){
         const p=queue.shift();
         if(isBrand)p.brand=target;else p.category=target;
         await window.liftCloudSaveProduct(p);
         done++;status.textContent=`Guardando en Supabase: ${done} de ${arr.length}…`;
       }
     });
     await Promise.all(workers);
     if(isBrand){
       const cfg=JSON.parse(JSON.stringify(window.LIFT_LABORATORIES_SUPABASE||{}));
       cfg[target]={...(cfg[target]||{}),active:true};
       await window.liftCloudSaveConfig('laboratories_v1',cfg);
       window.LIFT_LABORATORIES_SUPABASE=cfg;
     }else if(typeof LIFT_CATEGORY_CONFIG!=='undefined'){
       LIFT_CATEGORY_CONFIG[target]={...(LIFT_CATEGORY_CONFIG[target]||{}),active:true};
       await window.liftCloudSaveConfig('categories_v1',LIFT_CATEGORY_CONFIG);
       if(typeof rebuildLiftCategories==='function')rebuildLiftCategories();
     }
     window.LIFT_BULK_SELECTED.clear();
     status.textContent=`✓ ${arr.length} producto${arr.length===1?'':'s'} movido${arr.length===1?'':'s'} al ${label} ${target}.`;
     if(isBrand&&window.state?.brand&&arr.some(p=>backup.some(b=>b.p===p&&b.value===window.state.brand)))window.state.brand='Todas';
     if(typeof render==='function')render();
     lafRenderProducts();lafFillLists();
     if(typeof renderFilters==='function')renderFilters();
     if(isBrand&&typeof window.renderLaboratoryVisualGrid==='function')window.renderLaboratoryVisualGrid('');
   }catch(e){
     backup.forEach(x=>{if(isBrand)x.p.brand=x.value;else x.p.category=x.value});
     if(isBrand&&previousLabConfig)window.LIFT_LABORATORIES_SUPABASE=previousLabConfig;
     if(!isBrand&&previousCatConfig)window.LIFT_CATEGORY_CONFIG=LIFT_CATEGORY_CONFIG=previousCatConfig;
     status.textContent='Error: '+(e.message||e);
     alert('No se completó el movimiento masivo en Supabase: '+(e.message||e));
   }finally{if(btn)btn.disabled=false}
 };

 window.lafOpenVariantBuilder=function(){
   if(window.LIFT_BULK_SELECTED.size<2){const st=$('lafBulkStatus');if(st)st.textContent='Selecciona mínimo 2 productos para agrupar.';return}
   lafTab('variants',document.querySelector('.lafTab[data-pane="variants"]'));
   lafRenderVariantBuilder(true);
 };
 function lafGuessFlavor(p){
   const direct=String(p.flavor||p.sabor||'').trim();
   if(direct)return direct;
   const name=String(p.name||'').trim();
   const pres=String(p.presentation||'').trim();
   let base=name;
   if(pres)base=base.replace(new RegExp(pres.replace(/[.*+?^${}()|[\]\\]/g,'\\$&'),'ig'),'').trim();
   return base||'Variación';
 }
 window.lafRenderVariantBuilder=function(force){
   const ids=[...window.LIFT_BULK_SELECTED];
   const arr=PRODUCTS.filter(p=>ids.includes(String(p.id)));
   const empty=$('lafVariantBuilderEmpty'),box=$('lafVariantBuilder');
   if(arr.length<2){empty.style.display='block';box.style.display='none';return}
   empty.style.display='none';box.style.display='block';
   const first=arr[0];
   if(force||!$('lafGroupName').value){
     $('lafGroupName').value=first.name||'';
     $('lafGroupBrand').value=first.brand||'';
     $('lafGroupCategory').value=first.category||'';
     $('lafGroupPresentation').value=first.presentation||'';
     $('lafGroupPrice').value=fmt(first.price||0);
     $('lafGroupImage').value=first.image||'';
   }
   $('lafVariantRows').innerHTML=arr.map((p,i)=>`<div class="lafVariantRow" data-product-id="${esc(p.id)}">
     <img src="${esc(p.image||'')}" onerror="this.style.visibility='hidden'">
     <div><div class="lafName">${esc(p.name)}</div><div class="lafMeta">ID ${esc(p.id)} · ${esc(p.brand||'')} · ${esc(p.presentation||'')}</div></div>
     <div class="lafVariantInputs">
       <input class="lafVariantFlavor" value="${esc(lafGuessFlavor(p))}" placeholder="Sabor / variante">
       <input class="lafVariantImage" value="${esc(p.image||'')}" placeholder="URL imagen de esta variante">
     </div>
   </div>`).join('');
   $('lafVariantStatus').textContent=`${arr.length} productos listos para revisar antes de agrupar.`;
 };
 window.lafCancelVariantBuilder=function(){
   window.LIFT_BULK_SELECTED.clear();
   ['lafGroupName','lafGroupBrand','lafGroupCategory','lafGroupPresentation','lafGroupPrice','lafGroupImage'].forEach(id=>{if($(id))$(id).value=''});
   lafRenderVariantBuilder();lafBulkUpdate();
 };
 window.lafSaveVariantGroup=async function(){
   const rows=[...document.querySelectorAll('#lafVariantRows .lafVariantRow')];
   const status=$('lafVariantStatus');
   if(rows.length<2){status.textContent='Necesitas mínimo 2 variantes.';return}
   const group={
     nombre:$('lafGroupName').value.trim(),
     marca:$('lafGroupBrand').value.trim(),
     categoria:$('lafGroupCategory').value.trim(),
     presentacion:$('lafGroupPresentation').value.trim(),
     precio:window.liftVariantMoney($('lafGroupPrice').value),
     imagen:$('lafGroupImage').value.trim(),
     visible_publico:true
   };
   if(!group.nombre){status.textContent='Pon un nombre para el producto principal.';return}
   const variants=rows.map((row,i)=>{
     const id=Number(row.dataset.productId);
     const p=PRODUCTS.find(x=>Number(x.id)===id);
     return {
       producto_id:id,
       sabor:row.querySelector('.lafVariantFlavor').value.trim()||`Variación ${i+1}`,
       imagen:row.querySelector('.lafVariantImage').value.trim(),
       precio:p?.price??null,
       orden:i
     };
   });
   const dup=new Set();const repeated=variants.find(v=>{const k=norm(v.sabor);if(dup.has(k))return true;dup.add(k);return false});
   if(repeated&&!confirm('Hay nombres de variantes repetidos. ¿Crear el grupo de todas formas?'))return;
   if(!window.liftCatalogAdminCall){status.textContent='No encontré la conexión administrativa con Supabase.';return}
   const btn=document.querySelector('#lafVariantBuilder .lafBtn.primary');if(btn)btn.disabled=true;
   status.textContent='Creando grupo y relacionando variantes en Supabase…';
   try{
     const res=await window.liftCatalogAdminCall({action:'merge-variants',product_ids:variants.map(v=>v.producto_id),group,variants});
     status.textContent=`✓ Grupo creado correctamente · ID ${res.grupo_id}. Los productos originales siguen intactos.`;
     window.LIFT_BULK_SELECTED.clear();lafBulkUpdate();
     await lafLoadVariantGroups();
     setTimeout(()=>lafRenderVariantBuilder(),500);
   }catch(e){status.textContent='Error: '+(e.message||e)}
   finally{if(btn)btn.disabled=false}
 };
 window.lafLoadVariantGroups=async function(){
   const el=$('lafVariantGroups');if(!el)return;
   if(!window.liftCatalogAdminCall){el.innerHTML='<div class="lafNote">Abre la sesión Admin para consultar los grupos.</div>';return}
   el.innerHTML='<div class="lafNote">Consultando Supabase…</div>';
   try{
     const res=await window.liftCatalogAdminCall({action:'variant-groups'});
     const groups=Array.isArray(res.grupos)?res.grupos:[];
     if(!groups.length){el.innerHTML='<div class="lafNote">Todavía no hay grupos. Selecciona productos y usa “Agrupar como variaciones”.</div>';return}
     el.innerHTML=groups.map(g=>{
       const vv=Array.isArray(g.lift_producto_variantes)?g.lift_producto_variantes:[];
       return `<div class="lafGroupCard">
         <div class="lafGroupTop"><img src="${esc(g.imagen||'')}" onerror="this.style.visibility='hidden'"><div><strong>${esc(g.nombre||'Producto')}</strong><div class="lafGroupMeta">${esc(g.marca||'')} · ${esc(g.presentacion||'')} · ${vv.length} variante${vv.length===1?'':'s'} · ID grupo ${g.id}</div></div></div>
         <div class="lafGroupFlavors">${vv.map(v=>esc(v.sabor||'Variación')).join(' · ')}</div>
         <div class="lafGroupActions"><button class="lafBtn danger" type="button" onclick="lafDeleteVariantGroup(${Number(g.id)})">Desagrupar</button></div>
       </div>`;
     }).join('');
   }catch(e){el.innerHTML=`<div class="lafNote">No se pudieron cargar los grupos: ${esc(e.message||e)}</div>`}
 };
 window.lafDeleteVariantGroup=async function(id){
   if(!confirm('¿Desagrupar este producto? Los productos originales no se borrarán.'))return;
   try{await window.liftCatalogAdminCall({action:'delete-variant-group',id});await lafLoadVariantGroups()}
   catch(e){alert('No se pudo desagrupar: '+(e.message||e))}
 };

 window.lafRenderProducts();
 window.lafQuickPrice=function(id){const p=PRODUCTS.find(x=>String(x.id)===String(id));if(!p)return;p.price=num($('lafp_'+id).value);patch(p);$('lafp_'+id).value=fmt(p.price);refresh()};
 window.lafToggleCreateVariants=function(){
   const yes=$('lafHasVariants')?.value==='yes';
   if($('lafCreateVariantsBox'))$('lafCreateVariantsBox').style.display=yes?'block':'none';
   if($('lafLegacyFlavorsField'))$('lafLegacyFlavorsField').style.display=yes?'none':'grid';
   if(yes&&!$('lafCreateVariantRows')?.children.length)lafAddCreateVariant();
 };
 window.lafAddCreateVariant=function(data={}){
   const host=$('lafCreateVariantRows');if(!host)return;
   const row=document.createElement('div');row.className='lafCreateVariantNew';
   row.innerHTML=`<div class="lafCreateVariantFields">
    <input class="lafNewVariantFlavor" value="${esc(data.sabor||'')}" placeholder="Sabor, ej. Fruit Punch">
    <input class="lafNewVariantImage" value="${esc(data.imagen||'')}" placeholder="URL imagen del sabor (opcional)">
    <input class="lafNewVariantPrice" value="${data.precio?fmt(data.precio):''}" inputmode="numeric" placeholder="Precio distinto (opcional)">
   </div><button type="button" class="lafVariantRemove" title="Quitar" onclick="this.parentElement.remove()">×</button>`;
   host.appendChild(row);
 };
 function lafReadNewVariants(){
   return [...document.querySelectorAll('#lafCreateVariantRows .lafCreateVariantNew')].map((row,i)=>({
     sabor:row.querySelector('.lafNewVariantFlavor').value.trim(),
     imagen:row.querySelector('.lafNewVariantImage').value.trim(),
     precio:num(row.querySelector('.lafNewVariantPrice').value)||null,
     orden:i
   })).filter(v=>v.sabor);
 }
 window.lafClearForm=function(){window.liftSeoClear?.();['lafEditId','lafName','lafBrand','lafCategory','lafPresentation','lafPrice','lafTrainerPrice','lafImage','lafSecondaryImages','lafDescription','lafFlavors'].forEach(id=>$(id).value='');$('lafStatus').value='';if($('lafHasVariants'))$('lafHasVariants').value='no';if($('lafCreateVariantRows'))$('lafCreateVariantRows').innerHTML='';lafToggleCreateVariants();$('lafFormTitle').textContent='Crear producto';$('lafDeleteBtn').style.display='none';$('lafFormResult').textContent=''};
 window.lafEdit=function(id){const p=PRODUCTS.find(x=>String(x.id)===String(id));if(!p)return;window.liftSeoLoadForProduct?.(p.id);lafTab('create',document.querySelector('.lafTab[data-pane="create"]'));$('lafEditId').value=p.id;$('lafName').value=p.name||'';$('lafBrand').value=p.brand||'';$('lafCategory').value=p.category||'';$('lafPresentation').value=p.presentation||'';$('lafPrice').value=fmt(p.price);$('lafTrainerPrice').value=p.trainerPrice?fmt(p.trainerPrice):'';$('lafImage').value=p.image||'';$('lafDescription').value=p.description||'';$('lafFlavors').value=Array.isArray(p.flavors)?p.flavors.join('\n'):'';$('lafStatus').value=meta().out?.[p.id]?'out':'';$('lafFormTitle').textContent='Editar producto';$('lafDeleteBtn').style.display='inline-flex';if($('lafHasVariants'))$('lafHasVariants').value='no';if($('lafCreateVariantRows'))$('lafCreateVariantRows').innerHTML='';lafToggleCreateVariants();liftSecondaryEditorLoad(p.id)};
 window.lafSaveProduct=async function(){
 const editId=$('lafEditId').value;
 const wantsVariants=!editId && $('lafHasVariants')?.value==='yes';
 const name=$('lafName').value.trim(),brand=$('lafBrand').value.trim(),category=$('lafCategory').value.trim(),presentation=$('lafPresentation').value.trim();
 const price=num($('lafPrice').value),trainerPrice=num($('lafTrainerPrice').value)||null,image=$('lafImage').value.trim(),description=$('lafDescription').value.trim();
 if(!name||!price){$('lafFormResult').textContent='Nombre y precio son obligatorios.';return}
 if(wantsVariants){
   const variants=lafReadNewVariants();
   if(variants.length<2){$('lafFormResult').textContent='Agrega mínimo 2 sabores para crear un producto con variaciones.';return}
   if(!window.liftCatalogAdminCall){$('lafFormResult').textContent='No encontré la conexión administrativa con Supabase.';return}
   $('lafFormResult').textContent=`Creando ${variants.length} sabores y el grupo principal…`;
   const created=[];
   try{
     let id=nextId();
     for(const v of variants){
       while(PRODUCTS.some(p=>Number(p.id)===Number(id)))id++;
       const vp={id:id++,name,brand,category,presentation,price:v.precio||price,trainerPrice,image:v.imagen||image,description,flavor:v.sabor,flavors:[v.sabor],seo:window.liftSeoRead?.()||{}};
       await window.liftCatalogAdminCall({action:'save',product:vp});
       created.push({...vp,_variantImage:v.imagen,_variantOverridePrice:v.precio});
     }
     const res=await window.liftCatalogAdminCall({
       action:'merge-variants',
       product_ids:created.map(p=>p.id),
       group:{nombre:name,marca:brand,categoria:category,presentacion:presentation,precio:price,imagen:image,visible_publico:true},
       variants:created.map((p,i)=>({producto_id:p.id,sabor:p.flavor,imagen:p._variantImage||'',precio:p._variantOverridePrice,orden:i}))
     });
     PRODUCTS.push(...created);
     const m=meta();m.out=m.out||{};
     if($('lafStatus').value==='out')created.forEach(p=>m.out[p.id]=true);
     saveMeta(m);
     window.LIFT_VARIANT_GROUP_ADMIN_CACHE=[];
     if(typeof window.liftReloadVariantGroups==='function')await window.liftReloadVariantGroups();
     $('lafFormResult').textContent=`✓ Producto creado con ${created.length} sabores · grupo ${res.grupo_id}.`;
     refresh();
     setTimeout(()=>lafClearForm(),900);
   }catch(e){
     $('lafFormResult').textContent='Error creando las variaciones: '+(e.message||e);
   }
   return;
 }
 const id=editId;
 let p=id?PRODUCTS.find(x=>String(x.id)===String(id)):null;
 if(!p){p={id:nextId()};PRODUCTS.push(p)}
 p.name=name;p.brand=brand;p.category=category;p.presentation=presentation;p.price=price;p.trainerPrice=trainerPrice;p.image=image;p.description=description;p.seo=window.liftSeoRead?.()||{};
 p.flavors=$('lafFlavors').value.split(/[\n,;]+/).map(x=>x.trim()).filter(Boolean);
 const secondaryText=$('lafSecondaryImages').value;
 const m=meta();m.out=m.out||{};if($('lafStatus').value==='out')m.out[p.id]=true;else delete m.out[p.id];saveMeta(m);patch(p);
 $('lafFormResult').textContent='Guardando producto e imágenes...';
 try{
   /* Si esta ficha pertenece a un grupo, editar desde la tarjeta actualiza ESE grupo existente. */
   if(editId && typeof window.liftCatalogAdminCall==='function'){
     const vg=await window.liftCatalogAdminCall({action:'variant-groups'});
     const groups=Array.isArray(vg?.grupos)?vg.grupos:[];
     const matches=groups.filter(g=>(Array.isArray(g.lift_producto_variantes)?g.lift_producto_variantes:[]).some(v=>String(v.producto_id)===String(p.id)));
     for(const g of matches){
       await window.liftCatalogAdminCall({action:'update-variant-group',id:Number(g.id),group:{nombre:name,marca:brand,categoria:category,presentacion:presentation,precio:price,imagen:image,visible_publico:g.visible_publico!==false}});
     }
     if(matches.length && typeof window.liftReloadVariantGroups==='function')await window.liftReloadVariantGroups();
     if(matches.length && typeof window.lafLoadVariantGroups==='function')await window.lafLoadVariantGroups().catch(()=>{});
   }
   if(typeof window.liftSeoSaveForProduct==='function') await window.liftSeoSaveForProduct(p);
   await liftSecondarySaveUrls(p.id,secondaryText);
   $('lafFormResult').textContent='Producto e imágenes guardados.';refresh();setTimeout(()=>lafClearForm(),650)
 }
 catch(e){$('lafFormResult').textContent='Producto guardado, pero la actualización relacionada falló: '+e.message;refresh()}
};
 window.lafDeleteCurrent=function(){const id=$('lafEditId').value;if(!id)return;if(!confirm('¿Eliminar este producto del catálogo?'))return;const i=PRODUCTS.findIndex(x=>String(x.id)===String(id));if(i>=0)PRODUCTS.splice(i,1);const o=store();delete o[String(id)];saveStore(o);const m=meta();if(m.out)delete m.out[id];saveMeta(m);lafClearForm();refresh()};
 window.lafNewCombo=function(){lafClearForm();lafTab('create',document.querySelector('.lafTab[data-pane="create"]'));$('lafCategory').value='Combos';$('lafBrand').value='COMBOS';$('lafFormTitle').textContent='Crear combo'};
 window.lafRenderCombos=function(){const a=PRODUCTS.filter(p=>norm(p.category)==='combos'||norm(p.brand)==='combos');$('lafComboList').innerHTML=a.map(p=>`<div class="lafRow"><img src="${esc(p.image||'')}"><div><div class="lafName">${esc(p.name)}</div><div class="lafMeta">${esc(p.description||'Combo')}</div></div><div>$${fmt(p.price)}</div><button class="lafIcon" onclick="lafEdit(${JSON.stringify(p.id)})">✎</button></div>`).join('')||'<div class="lafNote">No hay combos.</div>'};
 window.lafRenderCategories=function(){
  const fromProducts=[...new Set(PRODUCTS.map(p=>p.category).filter(Boolean))];
  const fromConfig=Object.entries(LIFT_CATEGORY_CONFIG||{})
    .filter(([name,cfg])=>name&&name!=='Todos'&&cfg?.active!==false&&!cfg?.__deleted)
    .map(([name])=>name);
  const cs=liftSortBySupabaseOrder([...new Set([...fromProducts,...fromConfig])],LIFT_CATEGORY_CONFIG,x=>x);
  $('lafCategoryList').innerHTML=cs.map(c=>{
    const count=PRODUCTS.filter(p=>p.category===c).length;
    return `<div class="liftCatPanelCard">
      <div class="liftCatPanelActions">
        <button type="button" title="Duplicar categoría" onclick='event.stopPropagation();liftCategoryDuplicate(${JSON.stringify(c)})'>⧉</button>
        <button type="button" title="Editar categoría" onclick='event.stopPropagation();liftCategoryRename(${JSON.stringify(c)})'>✎</button>
        <button type="button" title="Eliminar categoría" onclick='event.stopPropagation();liftCategoryDelete(${JSON.stringify(c)})'>⌫</button>
      </div>
      <div class="liftCatPanelIcon">C</div>
      <div class="liftCatPanelName">${esc(c)}</div>
      <div class="liftCatPanelMeta">${count} producto${count===1?'':'s'}</div>
    </div>`;
  }).join('')||'<div class="lafNote">No hay categorías.</div>';
};
 window.lafRenameCategory=function(old,id){const n=$(id).value.trim();if(!n||n===old)return;PRODUCTS.filter(p=>p.category===old).forEach(p=>{p.category=n;patch(p)});refresh();lafRenderCategories()};
 window.lafRenderOffers=function(){const q=norm($('lafOfferSearch').value);const a=PRODUCTS.filter(p=>(!q||norm([p.name,p.brand].join(' ')).includes(q))&&(typeof WEEKLY_OFFERS!=='undefined'&&WEEKLY_OFFERS[p.id])).concat(PRODUCTS.filter(p=>!q||norm([p.name,p.brand].join(' ')).includes(q)).filter(p=>!(typeof WEEKLY_OFFERS!=='undefined'&&WEEKLY_OFFERS[p.id])).slice(0,40));$('lafOfferList').innerHTML=a.slice(0,150).map(p=>{const o=typeof WEEKLY_OFFERS!=='undefined'?WEEKLY_OFFERS[p.id]:null;const date=o?.promoUntil?String(o.promoUntil).slice(0,10):'';return `<div class="lafOfferRow"><div><b style="font-size:11px">${esc(p.name)}</b><div class="lafMeta">Detal $${fmt(p.price)}</div></div><input class="lafPrice" id="lafo_${p.id}" placeholder="Precio oferta" value="${o?fmt(o.price):''}"><input class="lafPrice" type="date" id="lafod_${p.id}" value="${date}"><button class="lafBtn ${o?'danger':'primary'}" onclick="lafToggleOffer(${JSON.stringify(p.id)})">${o?'Quitar':'Guardar'}</button></div>`}).join('')};
 window.lafToggleOffer=function(id){if(typeof window.liftOpenGiftOfferEditor==='function')return window.liftOpenGiftOfferEditor(id);console.warn('Editor de ofertas aún no disponible.');};
 function loadSavedOffers(){/* Sin localStorage: las ofertas llegan exclusivamente desde Supabase. */}
 function ensureXLSX(cb){if(window.XLSX)return cb();let sc=document.createElement('script');sc.src='https://cdn.jsdelivr.net/npm/xlsx@0.18.5/dist/xlsx.full.min.js';sc.onload=cb;sc.onerror=()=>alert('No se pudo cargar el lector de Excel. Revisa la conexión.');document.head.appendChild(sc)}
 function productRows(list=PRODUCTS){const m=meta();return list.map(p=>({ID:p.id,Producto:p.name,Marca:p.brand||'',Categoria:p.category||'',Presentacion:p.presentation||'',Precio_detal:Number(p.price)||0,Estado:m.out?.[p.id]?'Agotado':'Disponible',Imagen:p.image||'',Descripcion:p.description||'',Sabores:Array.isArray(p.flavors)?p.flavors.join(' | '):''}))}
 function offerRows(){if(typeof WEEKLY_OFFERS==='undefined')return[];return Object.entries(WEEKLY_OFFERS).map(([id,o])=>{const p=PRODUCTS.find(x=>String(x.id)===String(id));return {ID:Number(id),Producto:p?.name||'',Precio_normal:p?.price||0,Precio_oferta:o.price||0,Fecha_fin:o.promoUntil||'',Regalo:o.gift?'SI':'NO'}})}
 function comboRows(){return productRows(PRODUCTS.filter(p=>norm(p.category)==='combos'||norm(p.brand)==='combos'))}
 window.lafExportXLSX=function(){ensureXLSX(()=>{const wb=XLSX.utils.book_new();XLSX.utils.book_append_sheet(wb,XLSX.utils.json_to_sheet(productRows()),'Productos');XLSX.utils.book_append_sheet(wb,XLSX.utils.json_to_sheet(offerRows()),'Ofertas');XLSX.utils.book_append_sheet(wb,XLSX.utils.json_to_sheet(comboRows()),'Combos');XLSX.writeFile(wb,'LIFT_catalogo_administrativo.xlsx');$('lafExportResult').textContent='Excel generado con Productos, Ofertas y Combos.'})};
 function dl(name,text,type){const b=new Blob([text],{type});const a=document.createElement('a');a.href=URL.createObjectURL(b);a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(a.href),1000)}
 window.lafExportCSV=function(){const rows=productRows(),keys=Object.keys(rows[0]||{});const csv=[keys.join(','),...rows.map(r=>keys.map(k=>'"'+String(r[k]??'').replace(/"/g,'""')+'"').join(','))].join('\n');dl('LIFT_productos.csv','\ufeff'+csv,'text/csv;charset=utf-8')};
 window.lafExportJSON=function(){dl('LIFT_respaldo_catalogo.json',JSON.stringify({products:productRows(),offers:offerRows(),combos:comboRows()},null,2),'application/json')};
 function rowVal(r,names){for(const k of Object.keys(r||{}))if(names.includes(norm(k).replace(/\s+/g,'_')))return r[k];return ''}
 function normalizeRow(r){return {id:num(rowVal(r,['id','codigo','sku']))||null,name:String(rowVal(r,['producto','nombre','name'])||'').trim(),brand:String(rowVal(r,['marca','brand'])||'').trim(),category:String(rowVal(r,['categoria','category'])||'').trim(),presentation:String(rowVal(r,['presentacion','presentation'])||'').trim(),price:num(rowVal(r,['precio_detal','precio','price','precio_publico'])),status:norm(rowVal(r,['estado','status'])),image:String(rowVal(r,['imagen','image','url_imagen'])||'').trim(),description:String(rowVal(r,['descripcion','description'])||'').trim(),flavors:String(rowVal(r,['sabores','sabor','flavors'])||'').split(/[|,;]+/).map(x=>x.trim()).filter(Boolean)}}
 function previewTable(rows){if(!rows.length)return '<div class="lafNote">Sin filas.</div>';const ks=Object.keys(rows[0]);return '<table><thead><tr>'+ks.map(k=>`<th>${esc(k)}</th>`).join('')+'</tr></thead><tbody>'+rows.slice(0,30).map(r=>'<tr>'+ks.map(k=>`<td>${esc(r[k])}</td>`).join('')+'</tr>').join('')+'</tbody></table>'}
 window.lafPreviewImport=function(){const f=$('lafImportFile').files[0];if(!f)return alert('Selecciona un archivo.');const ext=f.name.split('.').pop().toLowerCase();const done=data=>{pending=data;$('lafImportPreview').style.display='block';$('lafImportPreview').innerHTML=previewTable(data.products);$('lafImportResult').textContent=`Listo: ${data.products.length} productos, ${data.offers.length} ofertas, ${data.combos.length} combos.`;$('lafApplyImport').disabled=false};if(ext==='json'){const rd=new FileReader();rd.onload=()=>{try{const j=JSON.parse(rd.result);done({products:(j.products||j.Productos||[]).map(normalizeRow),offers:j.offers||j.Ofertas||[],combos:(j.combos||j.Combos||[]).map(normalizeRow)})}catch(e){alert('JSON inválido')}};rd.readAsText(f);return}ensureXLSX(()=>{const rd=new FileReader();rd.onload=()=>{const wb=XLSX.read(rd.result,{type:'array'});const get=n=>{const sh=wb.Sheets[wb.SheetNames.find(x=>norm(x)===norm(n))||wb.SheetNames[0]];return sh?XLSX.utils.sheet_to_json(sh,{defval:''}):[]};const products=get('Productos').map(normalizeRow);let offers=[];const os=wb.Sheets[wb.SheetNames.find(x=>norm(x)==='ofertas')];if(os)offers=XLSX.utils.sheet_to_json(os,{defval:''});let combos=[];const cs=wb.Sheets[wb.SheetNames.find(x=>norm(x)==='combos')];if(cs)combos=XLSX.utils.sheet_to_json(cs,{defval:''}).map(normalizeRow);done({products,offers,combos})};rd.readAsArrayBuffer(f)})};
 window.lafApplyImport=function(){const mode=$('lafImportMode').value;let added=0,updated=0;if(mode==='replace'){PRODUCTS.splice(0,PRODUCTS.length);localStorage.removeItem(KEY)}const all=[...pending.products,...pending.combos];for(const r of all){if(!r.name)continue;let p=r.id?PRODUCTS.find(x=>String(x.id)===String(r.id)):PRODUCTS.find(x=>norm(x.name)===norm(r.name)&&norm(x.brand)===norm(r.brand));if(p){if(mode==='add')continue;Object.assign(p,{name:r.name||p.name,brand:r.brand||p.brand,category:r.category||p.category,presentation:r.presentation||p.presentation,price:r.price||p.price,image:r.image||p.image,description:r.description||p.description,flavors:r.flavors?.length?r.flavors:p.flavors});patch(p);updated++}else{if(mode==='update')continue;p={id:r.id||nextId(),name:r.name,brand:r.brand,category:r.category,presentation:r.presentation,price:r.price,image:r.image,description:r.description,flavors:r.flavors};PRODUCTS.push(p);patch(p);added++}const m=meta();m.out=m.out||{};if(r.status.includes('agot'))m.out[p.id]=true;else delete m.out[p.id];saveMeta(m)}/* PROTECCIÓN SUPABASE: la importación de productos NO modifica weekly_offers. Las ofertas se administran únicamente desde el editor de ofertas. */$('lafImportResult').textContent=`Importación terminada: ${added} nuevos, ${updated} actualizados.`;if(typeof rebuildLiftExcelFilters==='function')rebuildLiftExcelFilters();refresh();if(typeof syncLiftCategoryUI==='function')syncLiftCategoryUI();lafFillLists();lafRenderProducts();lafRenderOffers();lafRenderCombos();lafRenderCategories()};
 function addButton(){const bar=document.querySelector('.top .bar');if(!bar||$('liftAdminFullBtn'))return;const b=document.createElement('button');b.id='liftAdminFullBtn';b.textContent='⚙ Administrar';b.onclick=openLiftAdminFull;const cart=bar.querySelector('.cartDesktop');bar.insertBefore(b,cart||null)}
 loadSavedOffers();if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',addButton);else addButton();
})();

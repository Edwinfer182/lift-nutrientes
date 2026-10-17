
(function(){
 let editGroup=null, editVariants=[];
 const $=id=>document.getElementById(id);
 const esc2=s=>String(s??'').replace(/[&<>\"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',"'":'&#39;'}[m]));
 const norm2=s=>String(s||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().trim();
 const num2=v=>window.liftVariantMoney(v);
 const money2=v=>Number(v||0).toLocaleString('es-CO');
 function productById(id){return (window.PRODUCTS||PRODUCTS||[]).find(p=>String(p.id)===String(id))}
 function snapshotVariant(v,i){const p=productById(v.producto_id);return {id:v.id||null,producto_id:Number(v.producto_id),sabor:String(v.sabor||p?.flavor||'Variación'),imagen:String(v.imagen||p?.image||''),precio:v.precio!=null?Number(v.precio):Number(p?.price||0),orden:i,product:p}}
 function renderEditVariants(){
   const host=$('lvgVariants'); if(!host)return;
   $('lvgCount').textContent=editVariants.length+' producto'+(editVariants.length===1?'':'s');
   host.innerHTML=editVariants.map((v,i)=>{const p=productById(v.producto_id)||v.product||{};return `<div class="lvgVariant" data-id="${esc2(v.producto_id)}"><img src="${esc2(v.imagen||p.image||'')}" onerror="this.style.visibility='hidden'"><div><div style="font-size:10px;font-weight:600;margin-bottom:5px">${esc2(p.name||('Producto ID '+v.producto_id))} <span style="color:#999;font-weight:400">· ID ${esc2(v.producto_id)}</span></div><div class="lvgVariantFields"><input class="lvgFlavor" value="${esc2(v.sabor||'')}" placeholder="Sabor / variación"><input class="lvgVariantImage" value="${esc2(v.imagen||p.image||'')}" placeholder="URL imagen"></div></div><button class="lvgRemove" type="button" title="Sacar del grupo" onclick="lafRemoveVariantFromEditor(${Number(v.producto_id)})">×</button></div>`}).join('');
 }
 window.lafOpenVariantGroupEditor=function(id){
   const g=(window.LIFT_VARIANT_GROUP_ADMIN_CACHE||[]).find(x=>String(x.id)===String(id)); if(!g)return alert('No encontré el grupo. Recarga Variaciones.');
   editGroup=JSON.parse(JSON.stringify(g)); const vv=Array.isArray(g.lift_producto_variantes)?g.lift_producto_variantes:[]; editVariants=vv.map(snapshotVariant);
   $('lvgName').value=g.nombre||'';$('lvgBrand').value=g.marca||'';$('lvgCategory').value=g.categoria||'';$('lvgPresentation').value=g.presentacion||'';$('lvgPrice').value=money2(g.precio||0);$('lvgImage').value=g.imagen||'';
   $('lvgSubtitle').textContent='Grupo ID '+g.id+' · los productos originales siguen intactos';$('lvgStatus').textContent='';$('lvgProductSearch').value='';$('lvgSearchResults').innerHTML='';renderEditVariants();
   $('lafVariantEditBackdrop').classList.add('show');$('lafVariantEditModal').classList.add('show');document.body.style.overflow='hidden';
 };
 window.lafCloseVariantGroupEditor=function(){$('lafVariantEditBackdrop')?.classList.remove('show');$('lafVariantEditModal')?.classList.remove('show');document.body.style.overflow='';editGroup=null;editVariants=[]};
 window.lafRemoveVariantFromEditor=function(productId){if(editVariants.length<=2){$('lvgStatus').textContent='Un grupo necesita mínimo 2 productos. Para dejar uno solo, desagrupa el grupo.';return}const p=productById(productId);if(!confirm('¿Sacar '+(p?.name||'este producto')+' del grupo? No se eliminará de Supabase.'))return;editVariants=editVariants.filter(v=>String(v.producto_id)!==String(productId));renderEditVariants();lafVariantEditorSearch()};
 window.lafVariantEditorSearch=function(){const q=norm2($('lvgProductSearch')?.value||'');const host=$('lvgSearchResults');if(!host)return;if(!q){host.innerHTML='';return}const used=new Set(editVariants.map(v=>String(v.producto_id)));const arr=(window.PRODUCTS||PRODUCTS||[]).filter(p=>!used.has(String(p.id))&&norm2([p.id,p.name,p.brand,p.category,p.presentation,p.flavor].join(' ')).includes(q)).slice(0,30);host.innerHTML=arr.length?arr.map(p=>`<div class="lvgResult"><img src="${esc2(p.image||'')}" onerror="this.style.visibility='hidden'"><div><b>${esc2(p.name)}</b><small>ID ${esc2(p.id)} · ${esc2(p.brand||'')} · ${esc2(p.presentation||'')}</small></div><button type="button" onclick="lafAddProductToVariantEditor(${Number(p.id)})">Añadir</button></div>`).join(''):'<div style="font-size:10px;color:#777;padding:7px">No encontré productos.</div>'};
 window.lafAddProductToVariantEditor=function(id){if(editVariants.some(v=>String(v.producto_id)===String(id)))return;const p=productById(id);if(!p)return;const guess=typeof lafGuessFlavor==='function'?lafGuessFlavor(p):(p.flavor||p.name||'Variación');editVariants.push({id:null,producto_id:Number(p.id),sabor:guess,imagen:p.image||'',precio:Number(p.price||0),orden:editVariants.length,product:p});renderEditVariants();$('lvgProductSearch').value='';$('lvgSearchResults').innerHTML='';$('lvgStatus').textContent='Producto añadido al borrador. Guarda los cambios para aplicarlo.'};
 function readRows(){return [...document.querySelectorAll('#lvgVariants .lvgVariant')].map((row,i)=>{const id=Number(row.dataset.id),p=productById(id);return {producto_id:id,sabor:row.querySelector('.lvgFlavor').value.trim()||('Variación '+(i+1)),imagen:row.querySelector('.lvgVariantImage').value.trim(),precio:Number(editVariants.find(v=>String(v.producto_id)===String(id))?.precio??p?.price??0),orden:i}})}
 window.lafSaveVariantGroupEdit=async function(){
   if(!editGroup)return;const status=$('lvgStatus'),btn=$('lvgSave');const variants=readRows();if(variants.length<2){status.textContent='Necesitas mínimo 2 productos en el grupo.';return}
   const group={nombre:$('lvgName').value.trim(),marca:$('lvgBrand').value.trim(),categoria:$('lvgCategory').value.trim(),presentacion:$('lvgPresentation').value.trim(),precio:window.liftVariantMoney($('lvgPrice').value),imagen:$('lvgImage').value.trim(),visible_publico:editGroup.visible_publico!==false};if(!group.nombre){status.textContent='El nombre principal no puede quedar vacío.';return}
   const seen=new Set(),dup=variants.find(v=>{const k=norm2(v.sabor);if(seen.has(k))return true;seen.add(k);return false});if(dup&&!confirm('Hay sabores/variaciones con el mismo nombre. ¿Guardar así?'))return;
   if(!window.liftCatalogAdminCall){status.textContent='No encontré la conexión administrativa con Supabase.';return}
   if(!confirm('¿Guardar los cambios del grupo? Los productos que saques seguirán existiendo como productos independientes.'))return;
   btn.disabled=true;status.textContent='Actualizando grupo en Supabase…';const oldId=Number(editGroup.id);
   try{
     /* Reutiliza las acciones ya existentes: desagrupa y reconstruye el grupo con la composición editada. */
     await window.liftCatalogAdminCall({action:'delete-variant-group',id:oldId});
     const res=await window.liftCatalogAdminCall({action:'merge-variants',product_ids:variants.map(v=>v.producto_id),group,variants});
     status.textContent='✓ Grupo actualizado correctamente · ID '+(res.grupo_id||'nuevo')+'.';
     if(typeof window.loadLiftPublicVariantGroups==='function')await window.loadLiftPublicVariantGroups().catch(()=>{});
     await window.lafLoadVariantGroups();if(typeof render==='function')render();setTimeout(()=>lafCloseVariantGroupEditor(),650);
   }catch(e){status.textContent='No se completó la edición: '+(e.message||e)+'. Los productos originales no se eliminan.';try{await window.lafLoadVariantGroups()}catch(_){}}
   finally{btn.disabled=false}
 };
 const baseLoad=window.lafLoadVariantGroups;
 window.lafLoadVariantGroups=async function(){
   const el=$('lafVariantGroups');if(!el)return;if(!window.liftCatalogAdminCall){el.innerHTML='<div class="lafNote">Abre la sesión Admin para consultar los grupos.</div>';return}el.innerHTML='<div class="lafNote">Consultando Supabase…</div>';
   try{const res=await window.liftCatalogAdminCall({action:'variant-groups'});const groups=Array.isArray(res.grupos)?res.grupos:[];window.LIFT_VARIANT_GROUP_ADMIN_CACHE=groups;if(!groups.length){el.innerHTML='<div class="lafNote">Todavía no hay grupos. Selecciona productos y usa “Agrupar como variaciones”.</div>';return}el.innerHTML=groups.map(g=>{const vv=Array.isArray(g.lift_producto_variantes)?g.lift_producto_variantes:[];return `<div class="lafGroupCard"><div class="lafGroupTop"><img src="${esc2(g.imagen||'')}" onerror="this.style.visibility='hidden'"><div><strong>${esc2(g.nombre||'Producto')}</strong><div class="lafGroupMeta">${esc2(g.marca||'')} · ${esc2(g.presentacion||'')} · ${vv.length} variante${vv.length===1?'':'s'} · ID grupo ${g.id}</div></div></div><div class="lafGroupFlavors">${vv.map(v=>esc2(v.sabor||'Variación')).join(' · ')}</div><div class="lafGroupActions"><button class="lafBtn primary" type="button" onclick="lafOpenVariantGroupEditor(${Number(g.id)})">Editar grupo</button><button class="lafBtn danger" type="button" onclick="lafDeleteVariantGroup(${Number(g.id)})">Desagrupar</button></div></div>`}).join('')}
   catch(e){el.innerHTML='<div class="lafNote">No se pudieron cargar los grupos: '+esc2(e.message||e)+'</div>'}
 };
})();

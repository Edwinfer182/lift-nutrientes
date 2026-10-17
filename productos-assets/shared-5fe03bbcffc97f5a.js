
(function(){
 const SB_URL='https://vdxkknftyssjyfbdieqa.supabase.co';
 const SB_KEY='sb_publishable_ECuhXuKIb85kj9fgdEjrAw_O7uNpZsh';
 const FN=SB_URL+'/functions/v1/lift-catalog-admin';
 const PASS_KEY='liftAdminCloudPasswordV1';
 const CACHE_KEY='liftCatalogSupabaseCacheV3';
 const CACHE_TTL=3*60*1000; // 3 minutos; Supabase sigue siendo la fuente
 const headers=()=>({'apikey':SB_KEY,'Content-Type':'application/json'});
 async function fetchAllProducts(){
   const all=[];
   const batch=1000;
   for(let offset=0;;offset+=batch){
     const r=await fetch(SB_URL+'/rest/v1/lift_productos?select=id,product,activo&order=id.asc&limit='+batch+'&offset='+offset,{headers:headers(),cache:'no-store'});
     if(!r.ok)throw new Error('No se pudo leer productos de Supabase');
     const page=await r.json();
     if(!Array.isArray(page))throw new Error('Respuesta inválida de productos');
     all.push(...page);
     if(page.length<batch)break;
   }
   return all;
 }
 function readCatalogCache(){
   try{
     const c=JSON.parse(localStorage.getItem(CACHE_KEY)||'null');
     if(!c||!Array.isArray(c.rows)||!Array.isArray(c.cfg)||!c.savedAt)return null;
     if(Date.now()-Number(c.savedAt)>CACHE_TTL)return null;
     return c;
   }catch(e){return null}
 }
 function writeCatalogCache(rows,cfg){
   try{localStorage.setItem(CACHE_KEY,JSON.stringify({savedAt:Date.now(),rows,cfg}))}catch(e){}
 }
 function clearCatalogCache(){
   try{localStorage.removeItem(CACHE_KEY)}catch(e){}
 }
 const getPass=()=>{try{return sessionStorage.getItem(PASS_KEY)||''}catch(e){return ''}};
 function state(msg,kind=''){
   let e=document.getElementById('liftCloudState');
   if(!e){e=document.createElement('span');e.id='liftCloudState';const b=document.getElementById('liftAdminLoginBtn');if(b)b.insertAdjacentElement('afterend',e)}
   if(e){e.textContent=msg;e.className=kind}
 }
 async function adminCall(payload){
   const password=getPass();
   if(!password) throw new Error('Vuelve a ingresar a Admin para guardar en la nube.');
   state('☁ guardando…');
   const r=await fetch(FN,{method:'POST',headers:headers(),body:JSON.stringify({...payload,password})});
   const j=await r.json().catch(()=>({}));
   if(!r.ok)throw new Error(j.error||'No se pudo guardar en Supabase');
   clearCatalogCache();
   state('☁ guardado','ok');setTimeout(()=>state(''),1800);return j;
 }
 window.liftCatalogAdminCall=adminCall;
 const PRIVATE_IDS=window.LIFT_PRIVATE_IDS instanceof Set?window.LIFT_PRIVATE_IDS:(window.LIFT_PRIVATE_IDS=new Set());
 function removePrivateProducts(){
   for(let i=PRODUCTS.length-1;i>=0;i--)if(PRODUCTS[i]?.__private)PRODUCTS.splice(i,1);
   PRIVATE_IDS.clear();
 }
 async function loadPrivateProducts(){
   if(!document.body.classList.contains('liftAdminUnlocked'))return;
   const j=await adminCall({action:'list-private'});
   const rows=Array.isArray(j.products)?j.products:[];
   removePrivateProducts();
   rows.forEach(r=>{
     if(!r?.activo||!r?.product)return;
     const p={...r.product,id:r.id,__private:true,adminOnly:true};
     PRODUCTS.push(p);
     PRIVATE_IDS.add(String(r.id));
   });
   if(typeof rebuildLiftExcelFilters==='function')rebuildLiftExcelFilters();
   if(typeof render==='function')render();
   if(typeof renderCart==='function')renderCart();
   if(typeof renderFilters==='function')renderFilters();
   if(typeof lafFillLists==='function')lafFillLists();
   if(typeof lafRenderProducts==='function')lafRenderProducts();
   state('🔒 '+rows.length+' privados cargados','ok');setTimeout(()=>state(''),1800);
 }
 window.liftLoadPrivateProducts=loadPrivateProducts;
 window.liftCloudSaveProduct=async p=>adminCall({action:p?.__private?'save-private':'save',product:p});
 window.liftCloudDeleteProduct=async id=>{
   const key=String(id),isPrivate=PRIVATE_IDS.has(key);
   const out=await adminCall({action:isPrivate?'delete-private':'delete',id});
   if(isPrivate)PRIVATE_IDS.delete(key);
   return out;
 };
 window.liftCloudSaveConfig=async(clave,valor)=>adminCall({action:'save-config',clave,valor});
 async function loadCloud(){
   try{
     const cached=readCatalogCache();
     let rows,cfg,fromCache=false;
     // La configuración, especialmente weekly_offers, SIEMPRE se consulta fresca en Supabase.
     // El navegador puede cachear productos por rendimiento, pero nunca es fuente de ofertas.
     state(cached?'⚡ catálogo en caché · sincronizando configuración…':'☁ sincronizando…');
     const rcPromise=fetch(SB_URL+'/rest/v1/lift_catalog_config?select=clave,valor',{headers:headers(),cache:'no-store'});
     if(cached){
       rows=cached.rows;
       fromCache=true;
     }else{
       rows=await fetchAllProducts();
     }
     const rc=await rcPromise;
     if(!rc.ok)throw new Error('No se pudo leer configuración de Supabase');
     cfg=await rc.json();
     if(!cached)writeCatalogCache(rows,cfg);
     // FUENTE ÚNICA: nada de cachés, RPC antiguos ni productos incrustados.
     PRODUCTS.splice(0,PRODUCTS.length);
     rows.forEach(r=>{
       const i=PRODUCTS.findIndex(p=>String(p.id)===String(r.id));
       if(!r.activo||r.product?.__deleted){if(i>=0)PRODUCTS.splice(i,1);return}
       if(i>=0)PRODUCTS[i]={...PRODUCTS[i],...r.product,id:r.id};else PRODUCTS.push({...r.product,id:r.id});
     });
     const meta=cfg.find(x=>x.clave==='admin_meta')?.valor;
     if(meta)try{localStorage.setItem('liftAdminFullMetaV2',JSON.stringify(meta))}catch(e){}
     const offers=cfg.find(x=>x.clave==='weekly_offers')?.valor;
     if(offers&&typeof WEEKLY_OFFERS!=='undefined'){
       Object.keys(WEEKLY_OFFERS).forEach(k=>delete WEEKLY_OFFERS[k]);Object.assign(WEEKLY_OFFERS,offers);
     }
     const featuredCfg=cfg.find(x=>x.clave==='featured_config')?.valor;
     if(featuredCfg&&typeof featuredCfg==='object')LIFT_FEATURED_CONFIG={...LIFT_FEATURED_CONFIG,...featuredCfg};
     LIFT_FEATURED_IDS=new Set();
     if(LIFT_FEATURED_CONFIG.enabled!==false)rebuildLiftFeatured();
     const categoryCfg=cfg.find(x=>x.clave==='categories_v1')?.valor;
     LIFT_CATEGORY_CONFIG=(categoryCfg && typeof categoryCfg==='object')?categoryCfg:{};
     if(typeof rebuildLiftExcelFilters==='function') rebuildLiftExcelFilters();
     const labCfg=cfg.find(x=>x.clave==='laboratories_v1')?.valor;
     window.LIFT_LABORATORIES_SUPABASE=(labCfg && typeof labCfg==='object')?labCfg:{};
     if(typeof rebuildLiftExcelFilters==='function') rebuildLiftExcelFilters();
     const liftUrlProductId=liftApplyUrlFilter();
     if(typeof render==='function')render();if(typeof renderCart==='function')renderCart();
     liftOpenUrlProduct(liftUrlProductId);if(typeof renderFilters==='function')renderFilters();if(typeof lafRenderProducts==='function')lafRenderProducts();
     // Si Admin ya estaba iniciado al recargar, primero termina el catálogo público y después reincorpora los privados.
     if(document.body.classList.contains('liftAdminUnlocked')&&getPass()){
       try{await loadPrivateProducts()}catch(e){console.error('Productos privados tras recarga:',e);state('🔒 no se pudieron cargar privados','err')}
     }
     console.info(`Lift catálogo: ${rows.length} filas, ${PRODUCTS.length} productos activos · fuente: ${fromCache?'caché local':'Supabase'}.`);
     state(`${fromCache?'⚡ caché':'☁ conectado'} · ${PRODUCTS.length} productos`,'ok');setTimeout(()=>state(''),2200);
   }catch(e){console.error(e);state('☁ sin conexión · catálogo no disponible','err');try{const g=document.getElementById('grid');if(g&&!PRODUCTS.length)g.innerHTML='<div style="padding:28px;text-align:center;color:#666">No se pudieron cargar los productos desde Supabase.</div>'}catch(_){} }
 }
 function install(){
   const oldOpenFull=window.openLiftAdminFull;
   if(typeof oldOpenFull==='function')window.openLiftAdminFull=function(){
     const r=oldOpenFull.apply(this,arguments);
     setTimeout(()=>{
       if(document.body.classList.contains('liftAdminUnlocked')&&getPass()){
         loadPrivateProducts().catch(e=>{
           console.error('Productos privados:',e);
           state('🔒 no se pudieron cargar privados','err');
         });
       }
     },0);
     return r;
   };
   const oldUnlock=window.unlockLiftAdmin;
   if(typeof oldUnlock==='function')window.unlockLiftAdmin=function(){
     const inp=document.getElementById('liftAdminAccessPassword'),v=inp?.value||'';oldUnlock.apply(this,arguments);
     setTimeout(async()=>{
       if(!document.body.classList.contains('liftAdminUnlocked'))return;
       try{
         sessionStorage.setItem(PASS_KEY,v);
         await loadPrivateProducts();
       }catch(e){
         console.error('Productos privados:',e);
         state('🔒 no se pudieron cargar privados','err');
       }
     },0);
   };
   const oldLock=window.lockLiftAdmin;
   if(typeof oldLock==='function')window.lockLiftAdmin=function(){
     try{sessionStorage.removeItem(PASS_KEY)}catch(e){}
     removePrivateProducts();
     const r=oldLock.apply(this,arguments);
     if(typeof render==='function')render();
     if(typeof renderCart==='function')renderCart();
     if(typeof renderFilters==='function')renderFilters();
     return r;
   };
   if(document.body.classList.contains('liftAdminUnlocked')&&getPass()){
     setTimeout(()=>loadPrivateProducts().catch(e=>{
       console.error('Productos privados:',e);
       state('🔒 no se pudieron cargar privados','err');
     }),180);
   }
   const oldSave=window.lafSaveProduct;
   if(typeof oldSave==='function')window.lafSaveProduct=function(){
     const editId=document.getElementById('lafEditId')?.value;oldSave.apply(this,arguments);
     setTimeout(async()=>{try{
       let p=editId?PRODUCTS.find(x=>String(x.id)===String(editId)):PRODUCTS[PRODUCTS.length-1];
       if(p){await window.liftCloudSaveProduct(p);const m=JSON.parse(localStorage.getItem('liftAdminFullMetaV2')||'{}');await window.liftCloudSaveConfig('admin_meta',m)}
     }catch(e){alert(e.message)}},0);
   };
   // PERSISTENCIA UNIFICADA: cualquier editor y la importación Excel deben terminar en Supabase.
   const oldLegacySave=window.saveLiftAdminProduct;
   if(typeof oldLegacySave==='function')window.saveLiftAdminProduct=function(id){
     const beforeIds=new Set(PRODUCTS.map(p=>String(p.id)));
     const r=oldLegacySave.apply(this,arguments);
     setTimeout(async()=>{try{
       let p=id!=null?PRODUCTS.find(x=>String(x.id)===String(id)):PRODUCTS.find(x=>!beforeIds.has(String(x.id)));
       if(p){
         await window.liftCloudSaveProduct(p);
         const m=JSON.parse(localStorage.getItem('liftAdminFullMetaV2')||'{}');
         await window.liftCloudSaveConfig('admin_meta',m);
       }
     }catch(e){alert('El cambio se vio en pantalla, pero no pudo guardarse en Supabase: '+e.message)}},0);
     return r;
   };

   async function cloudSaveMany(list,concurrency=5){
     let cursor=0,done=0;
     async function worker(){
       while(cursor<list.length){
         const p=list[cursor++];
         await window.liftCloudSaveProduct(p);
         done++;
         state(`☁ guardando ${done}/${list.length}…`);
       }
     }
     await Promise.all(Array.from({length:Math.min(concurrency,Math.max(1,list.length))},worker));
   }

   const oldImport=window.lafApplyImport;
   if(typeof oldImport==='function')window.lafApplyImport=async function(){
     const btn=document.getElementById('lafApplyImport');
     const result=document.getElementById('lafImportResult');
     const before=new Map(PRODUCTS.map(p=>[String(p.id),JSON.stringify(p)]));
     const beforeIds=new Set(before.keys());
     if(btn){btn.disabled=true;btn.textContent='Importando…'}
     try{
       oldImport.apply(this,arguments);
       const afterIds=new Set(PRODUCTS.map(p=>String(p.id)));
       const changed=PRODUCTS.filter(p=>!before.has(String(p.id))||before.get(String(p.id))!==JSON.stringify(p));
       const removed=[...beforeIds].filter(id=>!afterIds.has(id));
       if(result)result.textContent=`Guardando ${changed.length} cambios en Supabase…`;
       if(changed.length)await cloudSaveMany(changed,5);
       for(const id of removed)await window.liftCloudDeleteProduct(id);
       const m=JSON.parse(localStorage.getItem('liftAdminFullMetaV2')||'{}');
       await window.liftCloudSaveConfig('admin_meta',m);
       if(result)result.textContent=(result.textContent.includes('Importación terminada')?result.textContent+' ':'')+`✓ Nube sincronizada: ${changed.length} guardados${removed.length?`, ${removed.length} eliminados`:''}.`;
       if(typeof rebuildLiftExcelFilters==='function')rebuildLiftExcelFilters();
       if(typeof syncLiftCategoryUI==='function')syncLiftCategoryUI();
       if(typeof lafFillLists==='function')lafFillLists();
       if(typeof lafRenderProducts==='function')lafRenderProducts();
       state('☁ importación guardada','ok');setTimeout(()=>state(''),2200);
     }catch(e){
       console.error(e);
       if(result)result.textContent='⚠ La importación cambió la vista, pero falló el guardado en Supabase: '+(e.message||e);
       state('☁ error al guardar','err');
       alert('No se terminó de guardar la importación en Supabase. No recargues todavía. '+(e.message||e));
     }finally{
       if(btn){btn.disabled=false;btn.textContent='Importar'}
     }
   };

   const oldQuick=window.lafQuickPrice;
   if(typeof oldQuick==='function')window.lafQuickPrice=function(id){oldQuick.apply(this,arguments);const p=PRODUCTS.find(x=>String(x.id)===String(id));if(p)window.liftCloudSaveProduct(p).catch(e=>alert(e.message))};
   const oldDelete=window.lafDeleteCurrent;
   if(typeof oldDelete==='function')window.lafDeleteCurrent=function(){const id=document.getElementById('lafEditId')?.value;oldDelete.apply(this,arguments);if(id&&!PRODUCTS.some(x=>String(x.id)===String(id)))window.liftCloudDeleteProduct(id).catch(e=>alert(e.message))};
   const oldCardDelete=window.liftCardAdminDelete;
   if(typeof oldCardDelete==='function')window.liftCardAdminDelete=function(id){const existed=PRODUCTS.some(x=>String(x.id)===String(id));oldCardDelete.apply(this,arguments);if(existed&&!PRODUCTS.some(x=>String(x.id)===String(id)))window.liftCloudDeleteProduct(id).catch(e=>alert(e.message))};
   const oldRename=window.lafRenameCategory;
   if(typeof oldRename==='function')window.lafRenameCategory=function(oldName,inputId){const ids=PRODUCTS.filter(p=>p.category===oldName).map(p=>p.id);oldRename.apply(this,arguments);ids.forEach(id=>{const p=PRODUCTS.find(x=>String(x.id)===String(id));if(p)window.liftCloudSaveProduct(p).catch(console.error)})};
   loadCloud();
 }
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(install,80));else setTimeout(install,80);
})();

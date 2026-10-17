
(function(){
 const clean=v=>String(v||'').trim();
 const byCat=name=>PRODUCTS.filter(p=>clean(p.category)===name);
 function names(exclude=''){
   if(typeof rebuildLiftCategories==='function')rebuildLiftCategories();
   return cats.filter(c=>c!=='Todos'&&c!==exclude);
 }
 async function saveConfig(){
   if(typeof window.liftCloudSaveConfig!=='function')throw new Error('No está disponible el guardado de configuración en Supabase.');
   await window.liftCloudSaveConfig('categories_v1',LIFT_CATEGORY_CONFIG);
 }
 async function saveProducts(list){
   if(typeof window.liftCloudSaveProduct!=='function')throw new Error('No está disponible el guardado de productos en Supabase.');
   for(const p of list)await window.liftCloudSaveProduct(p);
 }
 function repaint(){
   rebuildLiftCategories();
   if(state.cat!=='Todos'&&!cats.includes(state.cat))state.cat='Todos';
   render();
   if(typeof lafRenderProducts==='function')lafRenderProducts();
 }
 function open(mode,oldName='',productId=''){
   const modal=document.getElementById('liftCategoryModal'), title=document.getElementById('liftCategoryTitle');
   const text=document.getElementById('liftCategoryText'), nw=document.getElementById('liftCategoryNameWrap');
   const tw=document.getElementById('liftCategoryTargetWrap'), confirm=document.getElementById('liftCategoryConfirm');
   document.getElementById('liftCategoryMode').value=mode;
   document.getElementById('liftCategoryOld').value=oldName;
   document.getElementById('liftCategoryProductId').value=productId;
   nw.style.display='block';tw.style.display='none';confirm.className='primary';confirm.textContent='Guardar';text.textContent='';
   if(mode==='create'){title.textContent='Crear categoría';document.getElementById('liftCategoryName').value=''}
   if(mode==='rename'){title.textContent='Renombrar categoría';document.getElementById('liftCategoryName').value=oldName;text.textContent=`Se actualizarán también los ${byCat(oldName).length} productos de esta categoría.`}
   if(mode==='duplicate'){title.textContent='Duplicar categoría';document.getElementById('liftCategoryName').value=oldName+' Copia';text.textContent='Se crea la categoría nueva vacía. Los productos no se duplican.'}
   if(mode==='delete'){
     title.textContent='Eliminar categoría';nw.style.display='none';tw.style.display=byCat(oldName).length?'block':'none';
     text.textContent=byCat(oldName).length?`"${oldName}" tiene ${byCat(oldName).length} producto(s). Elige dónde moverlos antes de eliminarla.`:`"${oldName}" está vacía y se eliminará.`;
     document.getElementById('liftCategoryTarget').innerHTML=names(oldName).concat(['Sin categoría']).filter((v,i,a)=>a.indexOf(v)===i).map(c=>`<option>${esc(c)}</option>`).join('');
     confirm.className='danger';confirm.textContent='Eliminar';
   }
   if(mode==='move'){
     const p=PRODUCTS.find(x=>String(x.id)===String(productId));if(!p)return;
     title.textContent='Mover producto';nw.style.display='none';tw.style.display='block';
     text.textContent=p.name||'Producto';
     document.getElementById('liftCategoryTarget').innerHTML=names().map(c=>`<option ${c===p.category?'selected':''}>${esc(c)}</option>`).join('');
     confirm.textContent='Mover';
   }
   modal.classList.add('open');
 }
 window.liftCategoryClose=()=>document.getElementById('liftCategoryModal').classList.remove('open');
 window.liftCategoryCreate=()=>open('create');
 window.liftCategoryRename=n=>open('rename',n);
 window.liftCategoryDuplicate=n=>open('duplicate',n);
 window.liftCategoryDelete=n=>open('delete',n);
 window.liftCategoryMoveProduct=id=>open('move','',id);

 window.liftCategoryConfirm=async function(){
   const mode=document.getElementById('liftCategoryMode').value;
   const oldName=clean(document.getElementById('liftCategoryOld').value);
   const newName=clean(document.getElementById('liftCategoryName').value);
   const target=clean(document.getElementById('liftCategoryTarget').value);
   const productId=document.getElementById('liftCategoryProductId').value;
   const backupCfg=JSON.parse(JSON.stringify(LIFT_CATEGORY_CONFIG||{}));
   const changed=[];
   try{
     if(mode==='create'||mode==='duplicate'){
       if(!newName||newName==='Todos')throw new Error('Escribe un nombre válido.');
       if(names().includes(newName))throw new Error('Esa categoría ya existe.');
       LIFT_CATEGORY_CONFIG[newName]={...(LIFT_CATEGORY_CONFIG[newName]||{}),active:true};
       await saveConfig();
     }
     if(mode==='rename'){
       if(!newName||newName==='Todos')throw new Error('Escribe un nombre válido.');
       if(newName!==oldName&&names(oldName).includes(newName))throw new Error('Ya existe una categoría con ese nombre.');
       const arr=byCat(oldName);changed.push(...arr.map(p=>({p,old:p.category})));
       arr.forEach(p=>p.category=newName);
       delete LIFT_CATEGORY_CONFIG[oldName];
       LIFT_CATEGORY_CONFIG[newName]={...(LIFT_CATEGORY_CONFIG[newName]||{}),active:true};
       await saveProducts(arr);
       await saveConfig();
       if(state.cat===oldName)state.cat=newName;
     }
     if(mode==='delete'){
       const arr=byCat(oldName);changed.push(...arr.map(p=>({p,old:p.category})));
       if(arr.length&&!target)throw new Error('Selecciona una categoría destino.');
       arr.forEach(p=>p.category=target);
       if(arr.length)await saveProducts(arr);
       LIFT_CATEGORY_CONFIG[oldName]={active:false,__deleted:true};
       if(target)LIFT_CATEGORY_CONFIG[target]={...(LIFT_CATEGORY_CONFIG[target]||{}),active:true};
       await saveConfig();
       if(state.cat===oldName)state.cat='Todos';
     }
     if(mode==='move'){
       const p=PRODUCTS.find(x=>String(x.id)===String(productId));if(!p)throw new Error('No encontré el producto.');
       if(!target)throw new Error('Selecciona una categoría.');
       changed.push({p,old:p.category});p.category=target;
       // Mover un producto solo cambia su categoría en lift_productos.
       // NO reescribir categories_v1: así se conserva active/order en Supabase.
       await window.liftCloudSaveProduct(p);
     }
     liftCategoryClose();repaint();
   }catch(e){
     changed.forEach(x=>x.p.category=x.old);
     LIFT_CATEGORY_CONFIG=backupCfg;
     alert('No se pudo completar el cambio: '+(e.message||e));
   }
 };
})();

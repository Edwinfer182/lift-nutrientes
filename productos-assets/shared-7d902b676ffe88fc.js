
(function(){
 let productId=null;
 const modal=()=>document.getElementById('liftMoveTypeModal');
 function labs(){
   const a=new Set((window.PRODUCTS||PRODUCTS||[]).map(p=>String(p.brand||'').trim()).filter(Boolean));
   const cfg=window.LIFT_LABORATORIES_SUPABASE||{};
   Object.keys(cfg).forEach(x=>x&&a.add(x));
   return [...a].sort((a,b)=>a.localeCompare(b,'es',{sensitivity:'base'}));
 }
 window.liftMoveProductMenu=function(id){
   if(!document.body.classList.contains('liftAdminUnlocked'))return;
   productId=id; document.getElementById('liftMoveChoose').style.display='';
   document.getElementById('liftMoveBrandPane').style.display='none'; modal().classList.add('open');
 };
 window.liftMoveTypeClose=function(){modal().classList.remove('open')};
 window.liftMoveBack=function(){document.getElementById('liftMoveChoose').style.display='';document.getElementById('liftMoveBrandPane').style.display='none'};
 window.liftMoveChooseCategory=function(){liftMoveTypeClose(); if(typeof liftCategoryMoveProduct==='function')liftCategoryMoveProduct(productId)};
 window.liftMoveChooseBrand=function(){
   const p=PRODUCTS.find(x=>String(x.id)===String(productId));if(!p)return;
   document.getElementById('liftMoveChoose').style.display='none';document.getElementById('liftMoveBrandPane').style.display='';
   document.getElementById('liftMoveBrandProduct').textContent=(p.name||'Producto')+' · actual: '+(p.brand||'Sin laboratorio');
   document.getElementById('liftMoveBrandTarget').innerHTML=labs().map(x=>`<option value="${String(x).replace(/"/g,'&quot;')}" ${x===p.brand?'selected':''}>${x}</option>`).join('');
   document.getElementById('liftMoveBrandStatus').textContent='';
 };
 window.liftMoveBrandConfirm=async function(){
   const p=PRODUCTS.find(x=>String(x.id)===String(productId));if(!p)return;
   const target=String(document.getElementById('liftMoveBrandTarget').value||'').trim(),st=document.getElementById('liftMoveBrandStatus');
   if(!target){st.textContent='Selecciona un laboratorio.';return}
   const old=p.brand; st.textContent='Moviendo…';
   try{
     p.brand=target;
     if(typeof window.liftCloudSaveProduct!=='function')throw new Error('No está disponible el guardado en Supabase.');
     await window.liftCloudSaveProduct(p);
     if(typeof render==='function')render();
     if(typeof lafRenderProducts==='function')lafRenderProducts();
     st.textContent='✓ Movido a '+target;
     setTimeout(liftMoveTypeClose,450);
   }catch(e){p.brand=old;st.textContent='Error: '+(e.message||e)}
 };
})();

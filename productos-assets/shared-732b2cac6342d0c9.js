
(function(){
 const original=window.lafRenderProducts;
 if(typeof original!=='function')return;
 window.lafRenderProducts=function(){
   original.apply(this,arguments);
   document.querySelectorAll('#lafProductList [data-lift-secondary]').forEach(async input=>{
     const id=input.dataset.liftSecondary;
     try{const rows=await liftSecondaryGet(id);if(input.isConnected&&!input.dataset.edited)input.value=(rows[0]&&rows[0].imagen_url)||''}
     catch(e){input.title='No se pudo cargar imagen secundaria: '+e.message}
   });
 };
 document.addEventListener('input',e=>{if(e.target.matches('#lafProductList [data-lift-secondary]'))e.target.dataset.edited='1'});
 window.liftSaveInlineImages=async function(id,button){
   const p=PRODUCTS.find(x=>String(x.id)===String(id));if(!p)return;
   const price=document.getElementById('lafp_'+id),main=document.getElementById('liftMainUrl_'+id),secondary=document.getElementById('liftSecondUrl_'+id);
   if(!price||!main||!secondary)return;
   const mainUrl=main.value.trim(),secondUrl=secondary.value.trim();
   for(const url of [mainUrl,secondUrl])if(url&&!/^https?:\/\//i.test(url)){alert('Utiliza una URL que comience por https://');return}
   const old={price:p.price,image:p.image};const oldLabel=button.textContent;
   button.disabled=true;button.textContent='…';
   try{
     const rows=await liftSecondaryGet(id,true);
     const remaining=rows.map(r=>r.imagen_url).filter(Boolean).filter(u=>u!==secondUrl);
     const urls=secondUrl?[secondUrl,...remaining.slice(1).filter(u=>u!==secondUrl)]:remaining.slice(1);
     // Mantener las demás imágenes secundarias, reemplazando únicamente la primera.
     p.price=Number(String(price.value).replace(/[^0-9]/g,''))||0;p.image=mainUrl;
     await window.liftCloudSaveProduct(p);
     await liftSecondarySaveUrls(id,urls.join('\n'));
     button.textContent='✓';button.title='Guardado en Supabase';
     if(typeof render==='function')render();
   }catch(e){p.price=old.price;p.image=old.image;button.textContent='!';alert('No se pudieron guardar las imágenes: '+e.message)}
   finally{button.disabled=false;setTimeout(()=>{if(button.isConnected)button.textContent=oldLabel},1400)}
 };
 window.lafRenderProducts();
})();


(function(){
 const cache=new Map();
 const supported=window.matchMedia('(hover:hover) and (pointer:fine)');
 function nutritionCandidate(rows){
   const list=(rows||[]).filter(r=>r&&r.imagen_url);
   // La primera imagen secundaria es la tabla/reverso cuando así se ordenó en Supabase.
   return list.length?String(list[0].imagen_url):'';
 }
 async function preview(pic){
   const main=pic.querySelector('img[data-lift-card-main]');
   if(!main||!supported.matches)return;
   const id=main.dataset.liftCardMain;
   if(!id)return;
   const request=Symbol();pic._liftNutritionRequest=request;
   try{
     if(!cache.has(id))cache.set(id,Promise.resolve(liftSecondaryGet(id)).then(nutritionCandidate).catch(()=>''));
     const url=await cache.get(id);
     if(!url||pic._liftNutritionRequest!==request||!pic.matches(':hover')||!pic.isConnected)return;
     let second=pic.querySelector('.liftNutritionHoverImage');
     if(!second){second=document.createElement('img');second.className='liftNutritionHoverImage';second.alt='Imagen secundaria del producto';second.decoding='async';pic.appendChild(second)}
     if(second.dataset.url!==url){
       second.dataset.url=url;
       second.src=url;
       if(!second.complete)await new Promise(resolve=>{second.onload=resolve;second.onerror=resolve});
     }
     if(second.naturalWidth&&pic._liftNutritionRequest===request&&pic.matches(':hover'))pic.classList.add('liftNutritionPreview');
   }catch(e){console.debug('Vista secundaria no disponible',e)}
 }
 document.addEventListener('pointerover',e=>{
   if(!supported.matches||e.pointerType==='touch')return;
   const pic=e.target.closest?.('.liftVitanessCard .pic');
   if(pic&&!pic.contains(e.relatedTarget))preview(pic);
 });
 document.addEventListener('pointerout',e=>{
   const pic=e.target.closest?.('.liftVitanessCard .pic');
   if(pic&&!pic.contains(e.relatedTarget)){
     pic._liftNutritionRequest=null;
     pic.classList.remove('liftNutritionPreview');
   }
 });
})();

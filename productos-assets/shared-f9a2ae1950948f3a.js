
const LIFT_SECONDARY_BASE='https://vdxkknftyssjyfbdieqa.supabase.co';
const LIFT_SECONDARY_KEY='sb_publishable_ECuhXuKIb85kj9fgdEjrAw_O7uNpZsh';
const liftSecondaryCache=new Map();

async function liftSecondaryGet(productId, force=false){
 const k=String(productId||'');
 if(!k)return [];
 if(!force && liftSecondaryCache.has(k))return liftSecondaryCache.get(k);
 const u=LIFT_SECONDARY_BASE+'/rest/v1/lift_producto_imagenes?select=id,producto_id,imagen_url,orden&producto_id=eq.'+
   encodeURIComponent(k)+'&order=orden.asc,id.asc';
 const r=await fetch(u,{headers:{apikey:LIFT_SECONDARY_KEY,Authorization:'Bearer '+LIFT_SECONDARY_KEY}});
 if(!r.ok)throw new Error('No se pudieron consultar las imágenes secundarias.');
 const rows=await r.json();
 liftSecondaryCache.set(k,rows);
 return rows;
}
async function liftSecondaryEditorLoad(productId){
 const f=document.getElementById('lafSecondaryImages');
 if(!f)return;
 f.disabled=true;f.value='';
 try{
   const rows=await liftSecondaryGet(productId,true);
   f.value=rows.map(x=>x.imagen_url).filter(Boolean).join('\n');
 }catch(e){console.error(e)}
 finally{f.disabled=false}
}
async function liftSecondarySaveUrls(productId,text){
 const urls=[...new Set(String(text||'').split(/\n+/).map(x=>x.trim()).filter(Boolean))];
 // Guardado protegido con la clave de administración (función lift_producto_imagenes_guardar).
 const r=await fetch(LIFT_SECONDARY_BASE+'/rest/v1/rpc/lift_producto_imagenes_guardar',{
   method:'POST',
   headers:{apikey:LIFT_SECONDARY_KEY,'Content-Type':'application/json'},
   body:JSON.stringify({p_password:sessionStorage.getItem('liftAdminCloudPasswordV1')||'',p_producto_id:Number(productId),p_urls:urls})
 });
 if(!r.ok){const j=await r.json().catch(()=>({}));throw new Error(j.message||'No se pudieron guardar las imágenes secundarias.')}
 liftSecondaryCache.delete(String(productId));
 return urls;
}
async function liftSecondaryRender(product){
 const area=document.getElementById('liftMonoZoomArea');
 const main=document.getElementById('liftMonoMainImg');
 if(!area||!main||!product)return;
 area.querySelector('.liftSecondaryRail')?.remove();
 area.classList.remove('hasSecondaryGallery');
 area.querySelector('.liftPhotoCount')?.remove();
 let rows=[];
 try{rows=await liftSecondaryGet(product.id,true)}catch(e){console.error(e);return}
 // Evita que una consulta anterior cambie la galería de otro producto.
 if(!area.isConnected || area!==document.getElementById('liftMonoZoomArea') ||
    String(window.currentProductId)!==String(product.id))return;
 if(!rows.length)return;
 const images=[{url:product.image||'',main:true},...rows.map(x=>({url:x.imagen_url,main:false}))].filter(x=>x.url);
 if(images.length<2)return;
 const rail=document.createElement('div');
 rail.className='liftSecondaryRail';
 rail.setAttribute('aria-label','Imágenes del producto');
 rail.innerHTML=images.map((x,i)=>`<button type="button" class="liftSecondaryThumb${i===0?' active':''}" data-index="${i}" aria-label="${i===0?'Imagen principal':'Imagen adicional '+i}" aria-pressed="${i===0?'true':'false'}" title="${i===0?'Imagen principal':'Imagen adicional '+i}"><img loading="lazy" src="${String(x.url).replace(/"/g,'&quot;')}" alt=""></button>`).join('');
 area.prepend(rail);
 area.classList.add('hasSecondaryGallery');
 const buttons=[...rail.querySelectorAll('.liftSecondaryThumb')];
 const select=(i)=>{
   if(!images[i])return;
   if(main.getAttribute('src')!==images[i].url)main.src=images[i].url;
   buttons.forEach((b,j)=>{b.classList.toggle('active',i===j);b.setAttribute('aria-pressed',String(i===j));});
 };
 buttons.forEach((b,i)=>{
   // Al pasar el mouse se selecciona; al salir se conserva la última selección.
   b.addEventListener('pointerenter',e=>{if(e.pointerType==='mouse'||e.pointerType==='pen')select(i)});
   b.addEventListener('focus',()=>select(i));
   b.addEventListener('click',e=>{e.preventDefault();e.stopPropagation();select(i)});
 });
 rail.addEventListener('click',e=>e.stopPropagation());
 rail.addEventListener('dblclick',e=>e.stopPropagation());
 rail.addEventListener('wheel',e=>e.stopPropagation(),{passive:true});
}


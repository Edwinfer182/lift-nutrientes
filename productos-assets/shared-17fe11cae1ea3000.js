
(function(){
let pending=null;
function admin(){return document.body.classList.contains('liftAdminUnlocked')}
function toast(t){if(typeof liftShareToast==='function')liftShareToast(t);else alert(t)}
function copyText(t){return navigator.clipboard?.writeText(t).catch(()=>{const el=document.getElementById('liftProviderShareText');el.select();document.execCommand('copy')})||Promise.resolve()}
window.liftCloseProviderShare=()=>{document.getElementById('liftProviderShareModal').classList.remove('open')};
window.liftCopyProviderText=async()=>{await copyText(document.getElementById('liftProviderShareText').value);toast('Mensaje copiado')};
window.liftSaveProviderImage=()=>{if(!pending){toast('La imagen todavía no está disponible');return;}const url=URL.createObjectURL(pending.blob);const a=document.createElement('a');a.href=url;a.download=pending.file.name;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),2000)};
window.liftSendProviderImage=async()=>{if(!pending){toast('La imagen todavía no está disponible. Puedes copiar el mensaje.');return;}const message=document.getElementById('liftProviderShareText').value;
try{if(navigator.share&&(!navigator.canShare||navigator.canShare({files:[pending.file]}))){await navigator.share({files:[pending.file],text:message,title:'Consulta de disponibilidad'});return}}catch(e){if(e.name==='AbortError')return;console.warn(e)}
await copyText(message);liftSaveProviderImage();toast('Mensaje copiado e imagen descargada para compartir');};
window.liftMakeProviderImage=async function(id){
 const rawProduct=(typeof PRODUCTS!=='undefined'?PRODUCTS:window.PRODUCTS||[]).find(x=>Number(x.id)===Number(id));if(!rawProduct)throw new Error('Producto no encontrado');
 const grouped=typeof liftGroupByProductId==='function'?liftGroupByProductId(rawProduct.id):null;
 const selectedVariant=grouped&&typeof liftGroupVariants==='function'
   ? liftGroupVariants(grouped).find(v=>String(v.id)===String(window.LIFT_SELECTED_GROUP_VARIANT?.[String(grouped.id)]))
   : null;
 const p=grouped?{...rawProduct,
   name:String(grouped.nombre||rawProduct.name||''),
   brand:String(grouped.marca||rawProduct.brand||''),
   category:String(grouped.categoria||rawProduct.category||''),
   presentation:String(grouped.presentacion||rawProduct.presentation||''),
   price:(selectedVariant?.precio!=null&&Number(selectedVariant.precio)>0)?Number(selectedVariant.precio):(Number(grouped.precio||0)>0?Number(grouped.precio):rawProduct.price),
   image:String(selectedVariant?.imagen||rawProduct.image||grouped.imagen||''),
   flavor:String(selectedVariant?.sabor||rawProduct.flavor||''),
   _variantGroupId:Number(grouped.id)
 }:rawProduct;

 try{
  const c=document.createElement('canvas');c.width=1080;c.height=1900;
  const ctx=c.getContext('2d');
  ctx.fillStyle='#fff';ctx.fillRect(0,0,c.width,c.height);

  // Encabezado más fino
  ctx.fillStyle='#0b0b0b';ctx.fillRect(0,0,1080,92);
  ctx.fillStyle='#fff';ctx.font='700 34px Poppins,Arial';
  ctx.fillText('LIFT NUTRIENTES',58,59);

  // Si se comparte desde el detalle, usa exactamente la imagen visible:
  // principal, tabla nutricional, ingredientes, reverso, etc.
  const visibleMain=(String(window.currentProductId||'')===String(p.id))
    ? document.getElementById('liftMonoMainImg')?.src
    : '';
  const shareSource=(p._variantGroupId && p.image) ? p.image : (visibleMain||p.image);
  const img=await liftLoadShareImage(shareSource);
  if(!img)throw new Error('No se pudo cargar la imagen del producto para compartir');

  // Recupera una segunda fotografía real desde la galería de Supabase.
  // Si no existe o falla su carga, conserva el diseño de una sola imagen.
  let secondImg=null;
  try{
    // La información nutricional puede ser de otro sabor del mismo grupo.
    // Priorizar imágenes de la variante y luego la galería del producto padre.
    const ids=[p.id,p._variantGroupId,rawProduct.id,grouped?.id].filter(v=>v!=null&&String(v).trim());
    for(const productId of [...new Set(ids.map(String))]){
      if(typeof liftSecondaryGet!=='function')break;
      const gallery=await liftSecondaryGet(productId);
      const candidate=(gallery||[]).find(item=>{
        const url=String(item.imagen_url||'').trim();
        return url && url!==shareSource && url!==p.image;
      });
      if(candidate){secondImg=await liftLoadShareImage(candidate.imagen_url);if(secondImg)break;}
    }
  }catch(err){console.warn('Imagen secundaria no disponible para compartir',err);}

  function drawContained(photo,box){
    const scale=Math.min(box.w/photo.width,box.h/photo.height);
    const w=photo.width*scale,h=photo.height*scale;
    ctx.drawImage(photo,box.x+(box.w-w)/2,box.y+(box.h-h)/2,w,h);
  }
  if(secondImg){
    drawContained(img,{x:58,y:135,w:468,h:585});
    drawContained(secondImg,{x:554,y:135,w:468,h:585});
  }else{
    drawContained(img,{x:105,y:128,w:870,h:650});
  }

  // Separador sutil
  ctx.fillStyle='#ededed';ctx.fillRect(58,815,964,2);

  // Laboratorio
  ctx.fillStyle='#7d7d7d';ctx.font='500 25px Poppins,Arial';
  ctx.fillText(String(p.brand||'').toUpperCase(),58,865);

  // Nombre máximo dos líneas
  ctx.fillStyle='#111';ctx.font='600 39px Poppins,Arial';
  const words=String(p.name||'').split(/\s+/).filter(Boolean);
  const lines=[];let line='';
  for(const word of words){
    const test=line?line+' '+word:word;
    if(ctx.measureText(test).width>950&&line){
      lines.push(line);line=word;
      if(lines.length===1)break;
    }else line=test;
  }
  if(line&&lines.length<2)lines.push(line);
  lines.forEach((ln,i)=>ctx.fillText(ln,58,925+i*49));

  let infoY=925+lines.length*49+4;

  // Presentación / sabor si existen
  const meta=[];
  if(p.presentation)meta.push(String(p.presentation));
  const selected=(typeof ISO100_SELECTED!=='undefined'&&ISO100_SELECTED[String(p.id)])||null;
  const selectedFlavor=p._variantGroupId?p.flavor:(selected?.name||p.flavor||'');
  if(selectedFlavor)meta.push('Sabor: '+selectedFlavor);
  if(meta.length){
    ctx.fillStyle='#777';ctx.font='400 23px Poppins,Arial';
    ctx.fillText(meta.join('  ·  '),58,infoY);
    infoY+=40;
  }

  // Variaciones disponibles: al compartir desde la tarjeta principal mostramos
  // también los sabores/variaciones del producto, no solo la variante seleccionada.
  const variationNames=[];
  const addVariation=v=>{v=String(v||'').trim();if(v&&!variationNames.some(x=>x.toLowerCase()===v.toLowerCase()))variationNames.push(v)};
  if(grouped&&typeof liftGroupVariants==='function'){
    liftGroupVariants(grouped).forEach(v=>addVariation(v?.sabor||v?.nombre||''));
  }
  if(Array.isArray(rawProduct.pdfFlavors)) rawProduct.pdfFlavors.forEach(v=>addVariation(typeof v==='string'?v:(v?.name||v?.sabor||'')));
  if(typeof flavorsFor==='function') flavorsFor(rawProduct.id).forEach(addVariation);
  if(typeof ISO100_FLAVOR_IMAGES!=='undefined'&&Array.isArray(ISO100_FLAVOR_IMAGES[String(rawProduct.id)])){
    ISO100_FLAVOR_IMAGES[String(rawProduct.id)].forEach(v=>addVariation(v?.name||v?.sabor||''));
  }
  if(variationNames.length){
    ctx.fillStyle='#555';ctx.font='500 20px Poppins,Arial';
    const label='Sabores: '+variationNames.join(' · ');
    const vWords=label.split(/\s+/);const vLines=[];let vLine='';
    for(const word of vWords){
      const test=vLine?vLine+' '+word:word;
      if(ctx.measureText(test).width>950&&vLine){vLines.push(vLine);vLine=word}else vLine=test;
    }
    if(vLine)vLines.push(vLine);
    vLines.slice(0,3).forEach((ln,i)=>ctx.fillText(ln,58,infoY+i*28));
    infoY+=Math.min(vLines.length,3)*28+10;
  }

  // Imagen exclusiva para proveedores: sin precio, ofertas, regalos ni pagos.
  const footerY=Math.max(1160,Math.ceil((infoY+40)/10)*10);
  const out=document.createElement('canvas');out.width=1080;out.height=footerY+90;
  const outCtx=out.getContext('2d');
  outCtx.fillStyle='#fff';outCtx.fillRect(0,0,out.width,out.height);
  outCtx.drawImage(c,0,0,1080,footerY,0,0,1080,footerY);
  outCtx.fillStyle='#0b0b0b';outCtx.fillRect(0,footerY,1080,90);
  outCtx.fillStyle='#fff';outCtx.font='600 28px Poppins,Arial';
  outCtx.fillText('CONSULTA DE DISPONIBILIDAD',58,footerY+56);
  const blob=await new Promise(res=>out.toBlob(res,'image/png',.95));
  if(!blob)throw new Error('blob');
  const file=new File([blob],`lift-${String(p.name||'producto').replace(/[^a-z0-9]+/gi,'-').toLowerCase()}.png`,{type:'image/png'});
  return {blob,file,name:p.name,flavor:selectedFlavor||'',presentation:p.presentation||''};
 }catch(e){
  console.error(e);
  alert('No se pudo generar la imagen para el proveedor');
 }
};
window.liftOpenProviderShare=async function(id){
 if(!admin()){toast('Activa la sesión de administrador para consultar al proveedor');return;}
 const modal=document.getElementById('liftProviderShareModal');
 const field=document.getElementById('liftProviderShareText');
 const raw=typeof PRODUCTS!=='undefined'?PRODUCTS.find(x=>String(x.id)===String(id)):null;
 pending=null;
 field.value='Hola, ¿me confirmas porfa si tienes disponible '+String(raw?.name||'este producto')+(raw?.flavor?' sabor '+raw.flavor:'')+'? Gracias.';
 modal.classList.add('open');
 const buttons=modal.querySelectorAll('.liftProviderShareActions button');
 const imageButtons=[buttons[1],buttons[2]];
 imageButtons.forEach(b=>{if(b){b.disabled=true;b.title='Preparando imagen';}});
 try{
   const data=await liftMakeProviderImage(id);
   if(!modal.classList.contains('open'))return;
   if(!data){toast('No se pudo generar la imagen. Puedes copiar el mensaje.');return;}
   pending=data;
   field.value='Hola, ¿me confirmas porfa si tienes disponible '+data.name+(data.flavor?' sabor '+data.flavor:'')+(data.presentation?' '+data.presentation:'')+'? Gracias.';
   imageButtons.forEach(b=>{if(b){b.disabled=false;b.title='';}});
 }catch(e){console.error('Consulta proveedor:',e);toast('No se pudo generar la imagen. Puedes copiar el mensaje.');}
};
function inject(){document.querySelectorAll('.cardShareImageBtn:not(.detailShareImageBtn):not([data-provider-share-ready])').forEach(b=>{b.dataset.providerShareReady='1';const match=(b.getAttribute('onclick')||'').match(/shareLiftProductImage\((\d+)\)/);if(!match)return;const btn=document.createElement('button');btn.type='button';btn.className='liftProviderShareBtn';btn.setAttribute('aria-label','Consultar proveedor');btn.title='Consultar proveedor';btn.innerHTML='<svg xmlns="http://www.w3.org/2000/svg" width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 5h16v12H7l-3 3V5z"/><path d="M8 10h8"/><path d="M8 13h5"/></svg>';btn.onclick=e=>{e.preventDefault();e.stopPropagation();const current=b.getAttribute('onclick')||'';const fresh=current.match(/shareLiftProductImage\((\d+)\)/);const id=b.classList.contains('detailShareImageBtn')?Number(window.currentProductId||fresh?.[1]||match[1]):Number(fresh?.[1]||match[1]);if(!id){toast('No se encontró el producto seleccionado');return;}window.liftOpenProviderShare(id)};b.insertAdjacentElement('afterend',btn)});}

const observer=new MutationObserver(()=>{if(!document.hidden)inject()});
document.addEventListener('DOMContentLoaded',()=>{inject();observer.observe(document.body,{childList:true,subtree:true})});
})();

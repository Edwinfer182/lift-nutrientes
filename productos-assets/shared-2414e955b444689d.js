
const liftFavorites=new Set(JSON.parse(localStorage.getItem('liftFavoritesV1')||'[]').map(Number));
function toggleLiftFavorite(id,btn){id=Number(id);liftFavorites.has(id)?liftFavorites.delete(id):liftFavorites.add(id);localStorage.setItem('liftFavoritesV1',JSON.stringify([...liftFavorites]));btn?.classList.toggle('active',liftFavorites.has(id));}
function liftShareToast(msg){let el=document.getElementById('productShareToast');if(!el){el=document.createElement('div');el.id='productShareToast';el.className='productShareToast';document.body.appendChild(el)}el.textContent=msg;el.classList.add('show');clearTimeout(el._t);el._t=setTimeout(()=>el.classList.remove('show'),2200)}
async function liftLoadShareImage(url){
 const raw=String(url||'').trim();
 if(!raw)return null;
 const candidates=[];
 const add=u=>{if(u&&!candidates.includes(u))candidates.push(u)};
 const driveId=(()=>{let m=raw.match(/[?&]id=([^&]+)/i);if(m)return m[1];m=raw.match(/\/d\/([^/]+)/i);return m?m[1]:''})();
 // Primero probamos la URL original/Drive. Si el servidor permite verla pero bloquea
 // el canvas por CORS, el último candidato pasa por nuestra Edge Function de Supabase.
 if(driveId){
   add(`https://lh3.googleusercontent.com/d/${driveId}=w1600`);
   add(`https://drive.google.com/thumbnail?id=${driveId}&sz=w1600`);
 }
 add(raw.replace(/([?&]sz=)w\d+/i,'$1w1600'));
 add(raw);
 const proxyBase='https://vdxkknftyssjyfbdieqa.supabase.co/functions/v1/share-product-image';
 add(proxyBase+'?url='+encodeURIComponent(raw));
 for(const u of candidates){
   try{
     const img=new Image();
     img.crossOrigin='anonymous';
     img.referrerPolicy='no-referrer';
     await new Promise((res,rej)=>{const t=setTimeout(()=>rej(new Error('timeout')),12000);img.onload=()=>{clearTimeout(t);res()};img.onerror=()=>{clearTimeout(t);rej(new Error('image'))};img.src=u});
     if(img.naturalWidth>0&&img.naturalHeight>0){
       // Fuerza una lectura mínima. Una imagen puede cargar visualmente y aun así
       // contaminar el canvas; en ese caso seguimos al proxy.
       try{
         const test=document.createElement('canvas');test.width=1;test.height=1;
         const tx=test.getContext('2d');tx.drawImage(img,0,0,1,1);tx.getImageData(0,0,1,1);
         return img;
       }catch(e){continue}
     }
   }catch(e){}
 }
 return null;
}
window.shareLiftProductImage=async function(id){
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
 liftShareToast('Creando imagen…');
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
  const shareSource=visibleMain||p.image;
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

  // Vigencia de la promoción en la imagen compartida.
  const offerProduct=selectedVariant&&typeof liftVariantProduct==='function'?(liftVariantProduct(selectedVariant)||rawProduct):rawProduct;
  const sharedPromoDate=typeof offerUntilText==='function'?offerUntilText(offerProduct):'';
  if(sharedPromoDate){ctx.fillStyle='#555';ctx.font='600 20px Poppins,Arial';ctx.fillText('OFERTA HASTA '+sharedPromoDate,58,infoY+18);infoY+=34;}

  // Precio normal visible y tachado + precio promo verde.
  const shareOfferProduct=offerProduct;
  const shareHasPromo=typeof savingOf==='function'&&savingOf(shareOfferProduct)>0;
  let priceBaseY=infoY+38;
  if(shareHasPromo){
    const oldText=typeof fmt==='function'?fmt(compareAtOf(shareOfferProduct)):'$ '+Number(compareAtOf(shareOfferProduct)||0).toLocaleString('es-CO');
    ctx.fillStyle='#8a8a8a';ctx.font='500 27px Poppins,Arial';ctx.fillText(oldText,58,priceBaseY-10);
    const ow=ctx.measureText(oldText).width;ctx.strokeStyle='#8a8a8a';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(58,priceBaseY-20);ctx.lineTo(58+ow,priceBaseY-20);ctx.stroke();
    priceBaseY+=42;
  }
  ctx.fillStyle=shareHasPromo?'#168451':'#111';ctx.font='700 52px Poppins,Arial';
  const priceText=typeof fmt==='function'?fmt(priceOf(shareOfferProduct)):'$ '+Number(shareOfferProduct.price||0).toLocaleString('es-CO');
  ctx.fillText(priceText,58,priceBaseY);

  // Regalo incluido: misma fuente de verdad que tarjeta/off-canvas (weekly_offers).
  // Se dibuja en la imagen compartida para que la oferta no pierda información.
  const shareOffer=typeof offerOf==='function'?offerOf(shareOfferProduct):null;
  const shareGiftLabel=(shareOffer&&shareOffer.gift&&typeof window.liftOfferGiftLabel==='function')
    ? String(window.liftOfferGiftLabel(shareOffer)||'').trim()
    : '';
  if(shareGiftLabel){
    const giftY=priceBaseY+38;
    ctx.fillStyle='#fff8df';ctx.fillRect(58,giftY,964,58);
    ctx.strokeStyle='#ead38b';ctx.lineWidth=1;ctx.strokeRect(58,giftY,964,58);
    ctx.fillStyle='#168451';ctx.font='700 21px Poppins,Arial';
    const giftText='REGALO: '+shareGiftLabel;
    let gt=giftText;
    while(ctx.measureText(gt).width>920&&gt.length>12)gt=gt.slice(0,-2);
    if(gt!==giftText)gt=gt.trim()+'…';
    ctx.fillText(gt,78,giftY+37);
    priceBaseY+=68;
  }

  // Disponibilidad más cerca del precio/regalo
  ctx.fillStyle='#16833b';
  ctx.beginPath();ctx.arc(67,priceBaseY+40,7,0,Math.PI*2);ctx.fill();
  ctx.fillStyle='#333';ctx.font='500 22px Poppins,Arial';
  ctx.fillText('Disponible',86,priceBaseY+48);

  // Pie comercial con medios de pago. Las imágenes se alojan en Wix.
  const contentBottom=priceBaseY+75;
  const footerY=Math.max(1210,Math.ceil((contentBottom+26)/10)*10);
  const footerHeight=158;
  const out=document.createElement('canvas');out.width=1080;out.height=footerY+footerHeight;
  const outCtx=out.getContext('2d');
  outCtx.fillStyle='#fff';outCtx.fillRect(0,0,out.width,out.height);
  outCtx.drawImage(c,0,0,1080,footerY,0,0,1080,footerY);
  outCtx.fillStyle='#0b0b0b';outCtx.fillRect(0,footerY,1080,footerHeight);
  outCtx.fillStyle='#fff';outCtx.font='700 23px Poppins,Arial';
  outCtx.fillText('MEDIOS DE PAGO',58,footerY+37);
  outCtx.font='400 16px Poppins,Arial';
  outCtx.fillStyle='#dedede';outCtx.fillText('Transferencia, Bre-B y tarjeta con Bold',58,footerY+67);
  const paymentLogos=[
    {url:'https://static.wixstatic.com/media/251da0_059f710a3ef941aa902cb0b5b15a758f~mv2.png',x:630,w:125},
    {url:'https://static.wixstatic.com/media/251da0_e8038c896294432097472dcdedb54889~mv2.png',x:775,w:88},
    {url:'https://static.wixstatic.com/media/251da0_3e18c7ef59f44fd7b2d5870cee2b7206~mv2.png',x:882,w:145}
  ];
  for(const logo of paymentLogos){
    try{
      const photo=await liftLoadShareImage(logo.url);
      if(!photo)continue;
      const h=72,scale=Math.min(logo.w/photo.width,h/photo.height);
      const w=photo.width*scale,ih=photo.height*scale;
      outCtx.fillStyle='#fff';outCtx.beginPath();outCtx.roundRect(logo.x-5,footerY+20,logo.w+10,90,10);outCtx.fill();
      outCtx.drawImage(photo,logo.x+(logo.w-w)/2,footerY+65-ih/2,w,ih);
    }catch(err){console.warn('Logo de pago no disponible',err);}
  }
  outCtx.fillStyle='#fff';outCtx.font='600 20px Poppins,Arial';
  outCtx.fillText('PIDE EL TUYO HOY',58,footerY+116);
  outCtx.fillStyle='#d7d7d7';outCtx.font='400 15px Poppins,Arial';
  outCtx.fillText('Envíos a toda Colombia · Atención por WhatsApp',58,footerY+141);

  const blob=await new Promise(res=>out.toBlob(res,'image/png',.95));
  if(!blob)throw new Error('blob');
  const file=new File([blob],`lift-${String(p.name||'producto').replace(/[^a-z0-9]+/gi,'-').toLowerCase()}.png`,{type:'image/png'});
  await window.liftShareGeneratedImage(blob,file,p.name);
 }catch(e){
  console.error(e);
  liftShareToast('No se pudo generar la imagen');
 }
};

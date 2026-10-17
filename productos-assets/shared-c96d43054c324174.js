
(function(){
 const SB_URL='https://vdxkknftyssjyfbdieqa.supabase.co',SB_KEY='sb_publishable_ECuhXuKIb85kj9fgdEjrAw_O7uNpZsh',FN=SB_URL+'/functions/v1/lift-clientes',PASS_KEY='liftAdminCloudPasswordV1';
 const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const pass=()=>{try{return sessionStorage.getItem(PASS_KEY)||''}catch(e){return ''}};
 const money=v=>typeof fmt==='function'?fmt(Number(v||0)):'$ '+Number(v||0).toLocaleString('es-CO');
 async function call(payload){const r=await fetch(FN,{method:'POST',headers:{apikey:SB_KEY,'Content-Type':'application/json'},body:JSON.stringify({...payload,password:pass()})});const j=await r.json().catch(()=>({}));if(!r.ok)throw new Error(j.error||'No se pudo guardar la cotización');return j}
 function delivery(city){const n=String(city||'').toLowerCase();const local=['medellín','medellin','bello','itagüí','itagui','envigado','sabaneta','la estrella'].some(x=>n.includes(x));return local?'Ruta local: mismo día para pedidos confirmados antes de las 2:00 p. m., sujeto a disponibilidad.':'Envío nacional: 1 a 3 días hábiles después de generada la guía.'}
 function isLocalPaymentZone(city){const n=String(city||'').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'');return ['medellin','bello','itagui','envigado','sabaneta','la estrella'].some(x=>n.includes(x));}
 function paymentLines(city){const local=isLocalPaymentZone(city);return [
  'Transferencia antes del envío:',
  'Llave Bre-B: @edwin4518',
  'Tarjeta de crédito: link de pago Bold + costo de pasarela',
  'El pedido se despacha después de confirmar el pago.',
  'IMPORTANTE: No nos hacemos responsables por pagos enviados a cuentas o números no suministrados. No manejamos Addi ni Sistecrédito.'
 ];}
 function payments(city){return paymentLines(city).join('\n');}
 function quoteData(){const nombre=document.getElementById('coName')?.value.trim()||'',celular=document.getElementById('coPhone')?.value.trim()||'',whatsapp_usuario=document.getElementById('coWhatsappUser')?.value.trim()||'',direccion=document.getElementById('coAddress')?.value.trim()||'',notas=document.getElementById('coNotes')?.value.trim()||'';if(!nombre)throw new Error('Escribe el nombre del cliente.');if(!celular&&!whatsapp_usuario)throw new Error('Escribe el celular o @usuario de WhatsApp para guardar el prospecto.');if(typeof selectedCity==='undefined'||!selectedCity)throw new Error('Selecciona la ciudad / municipio para calcular la cotización.');const its=checkoutItemsList();if(!its.length)throw new Error('El pedido no tiene productos.');const subtotal=checkoutPublicSubtotal(its),effective=checkoutEffectiveSubtotal(its),envio=shippingFor(selectedCity.name,checkoutQty())||0,descuento=checkoutCouponDiscount(its),total=Math.max(0,effective-(trainerCouponActive()?0:descuento))+envio;const items=its.map(({p,q})=>({producto_id:Number.isFinite(Number(p.id))?Number(p.id):null,nombre:p.name+(p._cartFlavor?' · Sabor: '+p._cartFlavor:''),marca:p.brand||'',cantidad:q,precio_unitario:checkoutUnitPrice(p),total_linea:checkoutUnitPrice(p)*q,image:p.image||'',promo_hasta:(typeof offerUntilText==='function'?offerUntilText(p):''),precio_normal:(typeof savingOf==='function'&&savingOf(p)>0?compareAtOf(p):checkoutUnitPrice(p)),en_promo:(typeof savingOf==='function'&&savingOf(p)>0)}));return{nombre,celular,whatsapp_usuario,direccion,notas,ciudad:selectedCity.name||'',departamento:selectedCity.department||'',subtotal,envio,descuento:trainerCouponActive()?0:descuento,total,items,tiempo_entrega:delivery(selectedCity.name),medios_pago:payments(selectedCity.name)}}
 window.liftToggleQuote=function(force){const f=document.getElementById('liftQuoteForm');if(!f)return;f.hidden=typeof force==='boolean'?!force:!f.hidden};
 function followISO(v){if(!v)return null;const d=new Date(v+'T12:00:00');return isNaN(d)?null:d.toISOString()}
 window.liftGenerateQuote=async function(){
 const st=document.getElementById('liftQuoteStatus'),btn=document.getElementById('liftQuoteMainBtn');
 if(btn?.dataset.saving==='1')return;
 try{
   if(btn){btn.dataset.saving='1';btn.disabled=true;btn.textContent='Guardando…'}
   const d=quoteData(),ref='COT-'+new Date().toISOString().slice(0,10).replace(/-/g,'')+'-'+String(Date.now()).slice(-4);
   if(st)st.textContent='Guardando cliente, cotización y seguimiento en Supabase…';
   const saved=await call({action:'save-quote',...d,referencia:ref,estado:'Cotizada',seguimiento_at:null,nota_interna:''});
   if(!saved?.ok||!saved?.cotizacion_id)throw new Error('Supabase no confirmó el guardado de la cotización.');
   if(st)st.textContent='✓ Guardada en Supabase. Generando imagen…';
   try{await makeImage(d,saved.referencia||ref,saved.fecha||new Date().toISOString())}
   catch(imgErr){if(st)st.textContent='✓ Cotización guardada en Supabase. La imagen no pudo generarse: '+(imgErr.message||imgErr);return}
   if(typeof window.liftCrmReload==='function')await window.liftCrmReload();
   if(st)st.textContent='✓ Cotización guardada. Ya aparece en Seguimiento clientes → Cotizados.';
 }catch(e){
   if(st)st.textContent='✕ No se guardó: '+(e.message||e);
   alert('No se guardó la cotización: '+(e.message||e));
 }finally{
   if(btn){btn.dataset.saving='0';btn.disabled=false;btn.textContent='📄 Cotizar'}
 }
};
 function wrap(ctx,text,max){const words=String(text||'').split(/\s+/),lines=[];let line='';for(const w of words){const t=line?line+' '+w:w;if(ctx.measureText(t).width>max&&line){lines.push(line);line=w}else line=t}if(line)lines.push(line);return lines}
 async function liftQuoteLoadImage(src){
  if(!src)return null;
  try{
    if(typeof liftLoadShareImage==='function'){
      const shared=await liftLoadShareImage(src);
      if(shared)return shared;
    }
  }catch(e){}
  const raw=String(src||'').trim(), candidates=[];
  const add=u=>{if(u&&!candidates.includes(u))candidates.push(u)};
  let m=raw.match(/[?&]id=([^&]+)/i);
  if(!m)m=raw.match(/\/d\/([^/]+)/i);
  const driveId=m?m[1]:'';
  if(driveId){
    add('https://lh3.googleusercontent.com/d/'+driveId+'=w1200');
    add('https://drive.google.com/thumbnail?id='+driveId+'&sz=w1200');
  }
  add(raw);
  for(const u of candidates){
    try{
      const img=new Image();
      img.crossOrigin='anonymous';
      img.referrerPolicy='no-referrer';
      await new Promise((ok,fail)=>{
        const timer=setTimeout(()=>fail(new Error('timeout')),8000);
        img.onload=()=>{clearTimeout(timer);ok()};
        img.onerror=()=>{clearTimeout(timer);fail(new Error('image'))};
        img.src=u;
      });
      if(img.naturalWidth>0&&img.naturalHeight>0)return img;
    }catch(e){}
  }
  return null;
}
 async function makeImage(d,ref,fecha){
  const W=1080,pad=70,thumb=112,rowH=142;let H=940+d.items.length*rowH;
  const c=document.createElement('canvas');c.width=W;c.height=H;const x=c.getContext('2d');
  x.fillStyle='#fff';x.fillRect(0,0,W,H);x.fillStyle='#111';x.fillRect(0,0,W,135);x.fillStyle='#fff';x.font='700 42px Poppins,Arial';x.fillText('LIFT NUTRIENTES',pad,62);x.font='500 22px Poppins,Arial';x.fillText('Cotización '+ref,pad,101);
  let y=190;x.fillStyle='#111';x.font='700 27px Poppins,Arial';x.fillText(d.ciudad+(d.departamento?' · '+d.departamento:''),pad,y);y+=55;x.strokeStyle='#ddd';x.beginPath();x.moveTo(pad,y);x.lineTo(W-pad,y);x.stroke();y+=42;x.fillStyle='#111';x.font='700 23px Poppins,Arial';x.fillText('PRODUCTOS',pad,y);y+=38;
  for(const it of d.items){
   const img=await liftQuoteLoadImage(it.image);const iy=y-20;
   x.fillStyle='#f6f6f6';x.fillRect(pad,iy,thumb,thumb);
   if(img){const r=Math.min(thumb/img.width,thumb/img.height),dw=img.width*r,dh=img.height*r;x.drawImage(img,pad+(thumb-dw)/2,iy+(thumb-dh)/2,dw,dh)}
   const tx=pad+thumb+28;x.font='600 21px Poppins,Arial';x.fillStyle='#111';const lines=wrap(x,it.cantidad+' × '+it.nombre,570).slice(0,3);lines.forEach((ln,i)=>x.fillText(ln,tx,y+i*27));
   if(it.marca){x.font='500 17px Poppins,Arial';x.fillStyle='#777';x.fillText(it.marca,tx,y+lines.length*27+8)}if(it.promo_hasta){x.font='600 15px Poppins,Arial';x.fillStyle='#555';x.fillText('Oferta hasta '+it.promo_hasta,tx,y+lines.length*27+32)}
   x.textAlign='right';if(it.en_promo&&Number(it.precio_normal)>Number(it.precio_unitario)){const old=money(Number(it.precio_normal)*Number(it.cantidad||1));x.font='500 15px Poppins,Arial';x.fillStyle='#8a8a8a';x.fillText(old,W-pad,y-20);const ow=x.measureText(old).width;x.strokeStyle='#8a8a8a';x.beginPath();x.moveTo(W-pad-ow,y-26);x.lineTo(W-pad,y-26);x.stroke();x.font='700 21px Poppins,Arial';x.fillStyle='#168451';x.fillText(money(it.total_linea),W-pad,y+8)}else{x.font='600 21px Poppins,Arial';x.fillStyle='#111';x.fillText(money(it.total_linea),W-pad,y)}x.textAlign='left';y+=rowH;
  }
  x.strokeStyle='#ddd';x.beginPath();x.moveTo(pad,y);x.lineTo(W-pad,y);x.stroke();y+=38;x.font='500 20px Poppins,Arial';x.fillStyle='#111';x.fillText('Subtotal',pad,y);x.textAlign='right';x.fillText(money(d.subtotal),W-pad,y);x.textAlign='left';y+=34;x.fillText('Envío',pad,y);x.textAlign='right';x.fillText(money(d.envio),W-pad,y);x.textAlign='left';y+=42;x.font='700 29px Poppins,Arial';x.fillText('TOTAL',pad,y);x.textAlign='right';x.fillText(money(d.total),W-pad,y);x.textAlign='left';y+=58;
  x.font='700 20px Poppins,Arial';x.fillText('ENTREGA ESTIMADA',pad,y);y+=29;x.font='500 18px Poppins,Arial';x.fillStyle='#555';for(const ln of wrap(x,d.tiempo_entrega,W-pad*2)){x.fillText(ln,pad,y);y+=25}y+=18;
  x.fillStyle='#111';x.font='700 20px Poppins,Arial';x.fillText('MEDIOS DE PAGO',pad,y);y+=31;
  const payLines=paymentLines(d.ciudad);
  for(let i=0;i<payLines.length;i++){
   const important=i===payLines.length-1;
   x.font=(important?'700':'500')+' 18px Poppins,Arial';x.fillStyle=important?'#111':'#555';
   const wrapped=wrap(x,payLines[i],W-pad*2);for(const ln of wrapped){x.fillText(ln,pad,y);y+=25}y+=8;
  }
  x.fillStyle='#888';x.font='500 16px Poppins,Arial';x.fillText('Generada '+new Intl.DateTimeFormat('es-CO',{dateStyle:'medium'}).format(new Date(fecha||Date.now())),pad,H-45);
  const blob=await new Promise(r=>c.toBlob(r,'image/png',0.95));if(!blob)throw new Error('No se pudo generar la imagen de la cotización.');const file=new File([blob],ref+'.png',{type:'image/png'});
  await window.liftShareGeneratedImage(blob,file,'Cotización '+ref)
 }
 window.liftLoadDueQuotes=async function(){const box=document.getElementById('liftFollowPanel'),badge=document.getElementById('liftFollowBadge');if(!box||!document.body.classList.contains('liftAdminUnlocked'))return;box.innerHTML='<div class="liftClientEmpty">Cargando seguimientos…</div>';try{const j=await call({action:'quotes',due:true}),qs=j.cotizaciones||[];if(badge)badge.textContent=qs.length;if(!qs.length){box.innerHTML='<div class="liftClientEmpty">No tienes seguimientos pendientes para hoy.</div>';return}box.innerHTML=qs.map(q=>`<div class="liftFollowCard"><div class="liftFollowHead"><b>${esc(q.nombre)}</b><span>${esc(q.referencia||'')}</span></div><div>${esc(q.celular||q.whatsapp_usuario||'Sin celular')} · ${esc(q.ciudad)}</div><div class="liftFollowTotal">${money(q.total)} · ${esc(q.estado)}</div>${q.nota_interna?`<div style="margin-top:4px;color:#666">${esc(q.nota_interna)}</div>`:''}<div class="liftFollowActions"><button onclick="liftQuoteWhatsApp('${esc(q.celular)}','${esc(q.nombre)}','${esc(q.whatsapp_usuario||'')}')">WhatsApp</button><button onclick="liftQuoteDone(${q.id},'Ganada')">Ganada</button><button onclick="liftQuoteDone(${q.id},'No compró')">No compró</button></div></div>`).join('')}catch(e){box.innerHTML='<div class="liftClientEmpty">'+esc(e.message)+'</div>'}};
 window.liftQuoteWhatsApp=function(phone,name,user){const p=String(phone||'').replace(/\D/g,'');if(!p){alert('Este cliente está guardado como '+(user||'usuario de WhatsApp')+'. WhatsApp no permite abrir un chat por nickname desde un enlace. Búscalo por su usuario en WhatsApp.');return}const cc=p.length===10?'57'+p:p;window.open('https://wa.me/'+cc+'?text='+encodeURIComponent('Hola '+name+', ¿cómo estás? Te escribo para hacer seguimiento a la cotización que te envié.'),'_blank')};
 window.liftQuoteDone=async function(id,estado){await call({action:'update-quote',id,estado,seguimiento_at:null});liftLoadDueQuotes()};
 function inject(){const manual=document.getElementById('liftManualProductBox');if(manual&&!document.getElementById('liftQuoteBox')){const box=document.createElement('div');box.id='liftQuoteBox';box.className='liftQuoteBox';box.innerHTML=`<button type="button" id="liftQuoteMainBtn" class="liftQuoteBtn" onclick="liftGenerateQuote()">📄 Cotizar</button><div id="liftQuoteForm" class="liftQuoteForm"><div style="font-size:10px;color:#777;line-height:1.45">Al tocar Cotizar se guarda automáticamente el prospecto, productos, total y estado Cotizado en Supabase.</div><div id="liftQuoteStatus" class="liftQuoteStatus"></div></div>`;manual.insertAdjacentElement('afterend',box)}}
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',inject);else inject();
})();

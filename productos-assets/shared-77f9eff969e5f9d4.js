
(function(){
 const FN='https://vdxkknftyssjyfbdieqa.supabase.co/functions/v1/lift-clientes',KEY='sb_publishable_ECuhXuKIb85kj9fgdEjrAw_O7uNpZsh',PASS='liftAdminCloudPasswordV1';
 const $=id=>document.getElementById(id),esc=v=>String(v??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
 const money=n=>'$ '+Number(n||0).toLocaleString('es-CO'),state=s=>({verificando_disponibilidad:'Verificando disponibilidad',pendiente_pago:'Pago habilitado',preparando:'Preparando',programado:'Programado',en_ruta:'En ruta',entregado:'Entregado',cancelado:'Cancelado'})[s]||s||'Pedido';
 async function api(data){const r=await fetch(FN,{method:'POST',headers:{apikey:KEY,'Content-Type':'application/json'},body:JSON.stringify(data),cache:'no-store'}),j=await r.json().catch(()=>({}));if(!r.ok||j.error)throw new Error(j.error||j.message||('Error '+r.status));return j}
 async function copy(t){try{if(navigator.clipboard&&window.isSecureContext){await navigator.clipboard.writeText(t);return true}}catch(e){}const x=document.createElement('textarea');x.value=t;x.style.position='fixed';x.style.opacity='0';document.body.appendChild(x);x.select();let ok=false;try{ok=document.execCommand('copy')}catch(e){}x.remove();return ok}
 function base(){return (location.protocol==='http:'||location.protocol==='https:')?location.origin+location.pathname:'https://supgo.co/'}
 function payInfo(p){
   const ps=String(p.pago_estado||''),fm=String(p.forma_pago||''),medio=String(p.medio_pago_cliente||'');
   const due=Math.max(0,Number(p.saldo_pendiente||0)>0?Number(p.saldo_pendiente):Number(p.total||0)-Number(p.abono_inicial||0));
   if(ps==='aprobado'||fm==='pagado')return {kind:'paid',title:'NO COBRAR',detail:'Pedido pagado',amount:0};
   if(fm==='credito')return {kind:'paid',title:'NO COBRAR',detail:'Venta a crédito',amount:0};
   if(ps==='por_verificar')return {kind:'verify',title:'PAGO POR VERIFICAR',detail:'Ya hay comprobante cargado. No cobrar de nuevo.',amount:0};
   if(ps==='contraentrega'||medio==='efectivo')return {kind:'collect',title:'COBRAR EN EFECTIVO',detail:'Cobrar al momento de entregar',amount:due||Number(p.total||0)};
   if(medio==='transferencia')return {kind:'collect',title:'TRANSFERENCIA',detail:'El cliente puede transferir al momento de la entrega',amount:due||Number(p.total||0),transfer:true};
   return {kind:'collect',title:'PAGO PENDIENTE',detail:'Confirma el pago antes de cerrar la entrega',amount:due||Number(p.total||0),transfer:true};
 }
 // Exclusivo del portal del mensajero. No modifica la lógica ni las tarjetas del panel administrativo.
 function courierPayInfo(p){
   const norm=v=>String(v??'').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[_-]+/g,' ').trim();
   const values=[p.no_cobrar,p.cobrar,p.pago_estado,p.forma_pago,p.medio_pago_cliente,p.estado_pago,p.tipo_pago,p.instruccion_cobro,p.cobro_mensajero].map(norm);
   const explicitNoCharge = p.no_cobrar===true || p.cobrar===false || values.some(v=>['no cobrar','nocobrar','pagado','pago aprobado','aprobado','credito','venta a credito'].includes(v));
   if(explicitNoCharge) return {kind:'paid',title:'NO COBRAR',detail:'No recibir dinero en esta entrega.',amount:0};
   return payInfo(p);
 }
 window.liftAdminCourierAccess=async function(id){try{const password=sessionStorage.getItem(PASS)||'';if(!password)throw new Error('Vuelve a entrar al administrador.');const j=await api({action:'courier-link',password,pedido_id:Number(id)}),u=j.url_corta||(base()+'?entrega='+encodeURIComponent(j.token));if(await copy(u))alert('✓ Link del proveedor/mensajero copiado');else window.prompt('Copia el enlace:',u)}catch(e){alert('Mensajero: '+e.message)}};

 // Estado de pago visible en cada tarjeta administrativa.
 async function loadAdminDispatch(){
   if(!document.body.classList.contains('liftAdminUnlocked'))return;
   let password='';try{password=sessionStorage.getItem(PASS)||''}catch(e){}if(!password)return;
   try{const j=await api({action:'admin-dispatch-list',password});window.__liftDispatchMap=new Map((j.pedidos||[]).map(p=>[String(p.id),p]));decorateAdmin()}catch(e){}
 }
 function decorateAdmin(){
   const map=window.__liftDispatchMap;if(!map)return;
   document.querySelectorAll('.liftOpsCard').forEach(card=>{
     const m=(card.textContent||'').match(/Pedido\s*#(\d+)/i);if(!m)return;const p=map.get(m[1]);if(!p)return;
     if(!card.querySelector('.liftFlowControls')){
       const controls=document.createElement('div');controls.className='liftFlowControls';
       controls.innerHTML=`<div class="liftFlowTitle">PAGO DEL PEDIDO</div><div class="liftFlowPay"><button data-pay="pagado">✓ PAGADO</button><button data-pay="efectivo">💵 EFECTIVO</button><button data-pay="transferencia">🏦 TRANSFERENCIA</button><button data-pay="credito">◷ CRÉDITO</button></div><div class="liftFlowProvider"><select>${LIFT_PROVIDERS.map(x=>`<option value="${esc(x.name)}">${esc(x.name)}</option>`).join('')}</select><button class="ask">💬 CONSULTAR ESTADO</button></div>`;
       controls.querySelectorAll('[data-pay]').forEach(btn=>btn.onclick=async()=>{try{await api({action:'admin-set-payment',password:sessionStorage.getItem(PASS)||'',pedido_id:Number(m[1]),medio:btn.dataset.pay});controls.querySelectorAll('[data-pay]').forEach(x=>x.classList.remove('on'));btn.classList.add('on');refreshDispatchSoon(250)}catch(e){alert(e.message)}});
       controls.querySelector('.ask').onclick=()=>{try{const proveedorNombre=controls.querySelector('select').value;const proveedor=LIFT_PROVIDERS.find(x=>x.name===proveedorNombre);if(!proveedor?.phone)throw new Error('Este proveedor no tiene número de WhatsApp configurado.');const tituloPedido=String(card.querySelector('.liftOpsTop b')?.textContent||'');const nombreDesdeTarjeta=(tituloPedido.split('·').slice(1).join('·').trim());const nombreCompleto=String(p.nombre||p.cliente_nombre||p.nombre_cliente||nombreDesdeTarjeta||'').trim();const primerNombre=nombreCompleto.split(/\s+/)[0]||'cliente';const mensaje=`Hola, ¿cómo estás? ¿Me puedes actualizar sobre el estado del pedido de ${primerNombre}?`;let numero=String(proveedor.phone||'').replace(/\D/g,'');if(!numero)throw new Error('Este proveedor no tiene número de WhatsApp configurado.');if(numero.length===10)numero='57'+numero;window.open('https://wa.me/'+numero+'?text='+encodeURIComponent(mensaje),'_blank')}catch(e){alert(e.message)}};
       const at=card.querySelector('.liftOpsItems')||card.querySelector('.liftOpsTop');at?.insertAdjacentElement('afterend',controls);
     }
     let box=card.querySelector('.liftDispatchBadge');if(!box){box=document.createElement('div');box.className='liftDispatchBadge';const items=card.querySelector('.liftOpsItems');(items||card.querySelector('.liftOpsTop'))?.insertAdjacentElement('afterend',box)}
     const info=payInfo(p),proof=Boolean(p.comprobante_path||p.pago_mensajero_path),delivery=Boolean(p.entrega_foto_path);
     box.innerHTML=`<span class="${info.kind}">${info.kind==='paid'?'✓ ':info.kind==='verify'?'⏳ ':'💵 '}${esc(info.title)}${info.amount?' · '+money(info.amount):''}</span>${proof?'<span class="proof">📎 Comprobante</span>':''}${delivery?'<span class="proof">📷 Evidencia entrega</span>':''}${p.entrega_tipo==='porteria'?'<span class="proof">📦 Portería</span>':''}`;
   })
 }
 // Sin observadores globales ni consultas periódicas: evita consumo continuo de CPU.
 let liftDispatchTimer=0;
 function refreshDispatchSoon(delay=450){
   clearTimeout(liftDispatchTimer);
   liftDispatchTimer=setTimeout(loadAdminDispatch,delay);
 }
 setTimeout(loadAdminDispatch,900);
 window.addEventListener('focus',()=>refreshDispatchSoon(250),{passive:true});
 document.addEventListener('visibilitychange',()=>{if(!document.hidden)refreshDispatchSoon(250)},{passive:true});
 document.addEventListener('click',e=>{
   if(e.target.closest?.('.liftOpsCard button,.liftOpsCard select'))refreshDispatchSoon(900);
 },{passive:true});

 const courierToken=new URL(location.href).searchParams.get('entrega')||'';
 async function loadCourier(){
   if(!courierToken)return;$('liftCourierApp').classList.add('open');document.body.style.overflow='hidden';
   try{
    const j=await api({action:'courier-view',token:courierToken}),p=j.pedido,c=p.cliente||{},pi={kind:'paid',title:'NO COBRAR AL CLIENTE',detail:'El pago se gestiona directamente con Lift Nutrientes.',amount:0},done=p.estado==='entregado',route=p.estado==='en_ruta';
    $('lcRef').textContent=p.referencia||('#'+p.id);

    const decisionKey='liftCourierDecision:'+courierToken;
    let decision='';try{decision=localStorage.getItem(decisionKey)||''}catch(_){}
    if(route||done)decision='accepted';
    const alreadyTaken=decision==='accepted';

    const addressParts=[p.direccion,p.barrio,p.sector,p.ciudad,p.departamento].filter((v,i,a)=>v&&a.indexOf(v)===i);
    const fullAddress=addressParts.join(' · ');
    const extraAddress=p.referencia_direccion||p.complemento_direccion||p.indicaciones_direccion||'';
    const payClass=pi.kind||'collect';
    const payMain=pi.kind==='paid'
      ? `<div class="lcInstructionPay paid">💳 <b>PEDIDO PAGADO / NO COBRAR</b><strong>$ 0</strong><span>${esc(pi.detail||'No recibir dinero del cliente.')}</span></div>`
      : `<div class="lcInstructionPay ${esc(payClass)}">${pi.kind==='verify'?'⏳':'💵'} <b>${esc(pi.title)}</b>${pi.amount?`<strong>${money(pi.amount)}</strong>`:''}<span>${esc(pi.detail||'')}</span></div>`;

    const phones=[c.celular||p.celular||'',p.notas||'']
      .flatMap(v=>String(v||'').match(/(?:\+?57\s*)?3\d{9}/g)||[])
      .map(v=>String(v).replace(/\D/g,'').replace(/^57(?=3\d{9}$)/,''))
      .filter((v,i,a)=>v&&a.indexOf(v)===i);
    const itemText=(p.items||[]).map(x=>{
      const brand=String(x.marca||x.brand||'').trim();
      const detail=[x.presentacion,x.sabor].filter(Boolean).join(' · ');
      return `${brand?brand+' · ':''}${x.nombre||'Producto'}${detail?' · '+detail:''}${Number(x.cantidad||1)>1?' · x'+Number(x.cantidad||1):''}`;
    }).join('\n');
    const paymentText=pi.kind==='paid'
      ? 'Ya está pago. NO COBRAR.'
      : `${pi.title||'Cobro pendiente'}${pi.amount?' · '+money(pi.amount):''}${pi.detail?' · '+pi.detail:''}`;
    const copyOrderText=[
      `Nombre: ${c.nombre||p.nombre||''}`,
      `Celular: ${phones.length?phones.join(' o '):(c.celular||p.celular||'')}`,
      `Dirección: ${p.direccion||''}`,
      `Ciudad: ${[p.ciudad,p.departamento].filter(Boolean).join(' · ')}`,
      `Notas: ${p.notas||''}`,
      '',
      'Pedido:',
      itemText,
      '',
      paymentText
    ].join('\n');

    $('lcBody').innerHTML=`
      <div class="lcCard lcCompact">
        <div class="lcCompactTitle">DATOS DEL CLIENTE</div>
        <div class="lcCompactGrid">
          <div><div><b>Cliente:</b> ${esc(c.nombre||p.nombre||'')}</div><div><b>Celular:</b> <a href="tel:${String(c.celular||p.celular||'').replace(/\D/g,'')}">${esc(c.celular||p.celular||'')}</a></div><div><b>Correo:</b> ${esc(c.email||p.email||'No registrado')}</div></div>
          <div><div><b>Ciudad:</b> ${esc(p.ciudad||'')}</div><div><b>Dirección:</b> ${esc(fullAddress||p.direccion||'')}</div><div><b>Indicaciones:</b> ${esc(p.notas||extraAddress||'Sin indicaciones')}</div></div>
        </div>
        <div class="lcCompactActions"><button id="lcCopyOrder" type="button">📋 COPIAR DATOS Y PEDIDO</button><a target="_blank" rel="noopener" href="https://www.google.com/maps/search/?api=1&query=${encodeURIComponent([p.direccion,p.barrio,p.ciudad,p.departamento].filter(Boolean).join(', '))}">📍 MAPS ↗</a></div>
        <div class="lcCompactTitle lcCompactDivider">PRODUCTOS DEL PEDIDO</div>
        ${alreadyTaken?`<div class="lcTakenProducts">${(p.items||[]).map(x=>`<div class="lcCompactProduct"><div class="lcCompactImg">${x.imagen?`<img src="${esc(x.imagen)}" alt="" loading="lazy">`:'📦'}</div><div class="lcCompactProductInfo"><b>${esc(x.nombre||'Producto')}</b><small>${esc([x.marca,x.presentacion,x.sabor].filter(Boolean).join(' · '))}</small><small>Cantidad: ${Number(x.cantidad||1)}</small></div></div>`).join('')}</div>`:`
        <div class="lcAvailability" id="lcAvailability">
          <div class="lcAvailabilityHead"><span>Producto</span><span>Disponible</span><span>Agotado</span><span>Precio unitario</span></div>
          <div class="lcCompactProducts">${(p.items||[]).map((x,i)=>`<div class="lcCompactProduct lcAvailabilityIntegrated"><div class="lcCompactImg">${(x.imagen||x.imagen_url||x.image)?`<img src="${esc(x.imagen||x.imagen_url||x.image)}" alt="" loading="lazy" onerror="this.style.display='none'">`:'📦'}</div><div class="lcCompactProductInfo"><b>${esc(x.nombre||'Producto')}</b><small>${esc([x.marca,x.presentacion,x.sabor].filter(Boolean).join(' · '))}</small><small>Cantidad: ${Number(x.cantidad||1)}</small></div><button type="button" class="lcAvailabilityPick" data-item="${i}" data-value="disponible" data-checked="false" aria-label="Disponible: ${esc(x.nombre||'Producto')}">✓</button><button type="button" class="lcAvailabilityPick" data-item="${i}" data-value="agotado" data-checked="false" aria-label="Agotado: ${esc(x.nombre||'Producto')}">✕</button><input class="lcCostInput" type="number" min="0" step="1" inputmode="numeric" data-lc-cost="${i}" placeholder="$ Costo"></div>`).join('')}</div>
          <div class="lcCostExtras" id="lcCostCard"><label class="lcCostLine"><span>Domicilio proveedor</span><input id="lcCostDelivery" type="number" min="0" step="1" inputmode="numeric" placeholder="Valor domicilio"></label><label class="lcCostLine"><span>Datos bancarios completos</span><textarea id="lcCostBankDetails" maxlength="1200" placeholder="Banco, tipo de cuenta, número, titular, cédula o llave. Puedes pegar todos los datos juntos."></textarea></label><div class="lcCostTotal">TOTAL A TRANSFERIR <strong id="lcCostTotal">$0</strong></div><small id="lcCostNotice">Al tomar el pedido se enviarán estos datos al administrador por correo.</small></div>
          <button type="button" class="lcAvailabilitySubmit" id="lcAvailabilitySubmit" disabled>MARCA TODOS LOS PRODUCTOS</button>
          <div class="lcAvailabilityHelp" id="lcAvailabilityHelp">Marca cada producto y completa los valores y datos bancarios.</div>
        </div>`}
        <div class="lcCompactPayment ${pi.kind==='paid'?'lcPaid':''}" ${!alreadyTaken?'style="display:none"':''}><b>${esc(pi.title)}</b>${pi.amount?`<strong>${money(pi.amount)}</strong>`:''}<small>${esc(pi.detail||'')}</small></div>

        <div class="lcCompactStatus" ${!alreadyTaken?'style="display:none"':''}><button id="lcRoute" type="button" ${route||done?'disabled':''}>🚚 ${route||done?'EN RUTA ✓':'EN RUTA'}</button><button id="lcDone" type="button" ${!route||done?'disabled':''}>✓ ${done?'ENTREGADO ✓':'ENTREGADO'}</button></div>
        ${!route&&!done?'<small class="lcCompactHint">Primero marca «En ruta». Al entregar, sube la foto de evidencia.</small>':''}
        ${route&&!done?`<div class="lcCompactEvidence"><button id="lcPhotoBtn" type="button">📷 ${p.tiene_foto?'CAMBIAR FOTO DE ENTREGA':'TOMAR FOTO DE ENTREGA'}</button>${p.tiene_foto?'<small>✓ Evidencia guardada en Supabase</small>':'<small>Foto obligatoria antes de marcar «Entregado»</small>'}</div>`:''}
        ${p.tiene_foto?'<button id="lcViewEvidence" type="button" class="lcCompactView">Ver evidencia guardada</button><div id="lcEvidenceViewer" class="liftProofViewer"></div>':''}
        <div id="lcFinalReview" class="lcFinalReview" style="display:none"><b>CONFIRMAR ENTREGA</b><small>¿Confirmas que entregaste el pedido y guardaste la fotografía como evidencia?</small><div class="lcFinalActions"><button id="lcFinalConfirm" class="lcFinalConfirm">✓ CONFIRMAR ENTREGADO</button><button id="lcFinalBack" class="lcFinalBack">CANCELAR</button></div></div>
        <input id="lcPhoto" type="file" accept="image/*" capture="environment" hidden><div id="lcMsg"></div>
      </div>`;

    // Confirmación de disponibilidad en el mismo portal de mensajero.
    // El servidor debe validar el token, persistir la respuesta y enviar el correo.
    const costInputs=[...document.querySelectorAll('[data-lc-cost]')];
    const costMoney=n=>'$'+Math.round(Number(n)||0).toLocaleString('es-CO');
    function costData(){const prices=costInputs.map((el,i)=>({nombre:String(p.items[i]?.nombre||'Producto'),cantidad:Number(p.items[i]?.cantidad||1),estado:availabilityMarks[i],precio_unitario:Number(el.value||0)}));const domicilio=Number($('lcCostDelivery')?.value||0);return {precios:prices,domicilio,datos_bancarios:$('lcCostBankDetails')?.value.trim()||'',total:prices.reduce((a,x)=>a+(x.estado==='disponible'?x.cantidad*x.precio_unitario:0),0)+domicilio};}
    function updateCost(){if($('lcCostTotal'))$('lcCostTotal').textContent=costMoney(costData().total)}
    document.querySelectorAll('#lcAvailability input,#lcAvailability textarea').forEach(el=>el.addEventListener('input',()=>{updateCost();updateAvailability()}));
    const availabilityMarks={};
    const availabilityRoot=$('lcAvailability');
    const availabilitySubmit=$('lcAvailabilitySubmit');
    const availabilityHelp=$('lcAvailabilityHelp');
    function updateAvailability(){
      if(!availabilitySubmit)return;
      const n=(p.items||[]).length;
      const ready=n>0&&Object.keys(availabilityMarks).length===n;
      const any=Object.values(availabilityMarks).includes('disponible');
      const cost=costData();
      const valid=ready&&(!any||(costInputs.every((el,i)=>availabilityMarks[i]!=='disponible'||(el.value.trim()!==''&&Number(el.value)>0))))&&(!any||($('lcCostDelivery')?.value.trim()!==''&&cost.domicilio>=0&&cost.datos_bancarios.length>=12));
      availabilitySubmit.disabled=!valid;
      availabilitySubmit.textContent=!ready?'MARCA TODOS LOS PRODUCTOS':!any?'✕ NO TOMAR PEDIDO':valid?'✓ TOMAR PEDIDO':'COMPLETA VALORES Y DATOS BANCARIOS';
    }
    availabilityRoot?.querySelectorAll('.lcAvailabilityPick').forEach(btn=>btn.addEventListener('click',()=>{
      const i=Number(btn.dataset.item);availabilityMarks[i]=btn.dataset.value;
      availabilityRoot.querySelectorAll('.lcAvailabilityPick[data-item="'+i+'"]')?.forEach(b=>b.dataset.checked=String(b===btn));
      const price=costInputs[i];if(price){price.disabled=btn.dataset.value==='agotado';if(price.disabled)price.value='';}
      updateCost();updateAvailability();
    }));
    if(availabilitySubmit)availabilitySubmit.onclick=async()=>{
      const items=(p.items||[]).map((x,i)=>({indice:i,nombre:String(x.nombre||'Producto'),cantidad:Number(x.cantidad||1),estado:availabilityMarks[i]}));
      if(items.some(x=>!['disponible','agotado'].includes(x.estado)))return;
      const decision=items.some(x=>x.estado==='disponible')?'tomar':'no_tomar';
      const cost=costData();
      if(decision==='tomar'&&(costInputs.some((el,i)=>availabilityMarks[i]==='disponible'&&(!el.value.trim()||Number(el.value)<=0))||$('lcCostDelivery')?.value.trim()===''||cost.domicilio<0||cost.datos_bancarios.length<12)){alert('Completa los costos de los productos disponibles, domicilio y datos bancarios.');return;}
      if(!confirm('¿Confirmas '+(decision==='tomar'?'TOMAR':'NO TOMAR')+' el pedido?'))return;
      availabilitySubmit.disabled=true;availabilityHelp.textContent='Guardando confirmación y enviando correo…';
      try{
        const response=await api({action:'courier-availability-confirm',token:courierToken,decision,items,costos:decision==='tomar'?cost:null});
        availabilityHelp.textContent=response.email_sent===false?'✓ Respuesta guardada. No se pudo confirmar el envío del correo.':'✓ Confirmación registrada.';
        if(decision==='tomar')try{localStorage.setItem(decisionKey,'accepted')}catch(_){}
        await loadCourier();
      }catch(e){availabilityHelp.textContent='No se guardó la respuesta: '+(e.message||e);updateAvailability();}
    };
    if($('lcCopyOrder'))$('lcCopyOrder').onclick=async()=>{
      const ok=await copy(copyOrderText);
      const b=$('lcCopyOrder');if(b){const old=b.textContent;b.textContent=ok?'✓ PEDIDO COPIADO':'COPIA MANUALMENTE';setTimeout(()=>b.textContent=old,1400)}
    };
    if($('lcRoute'))$('lcRoute').onclick=()=>{
      if(confirm('VALIDA UNA SEGUNDA VEZ\n\n¿Ya revisaste cliente, dirección, productos y cobro?\n\nAl confirmar, el pedido quedará EN RUTA.')) setStatus('en_ruta');
    };
    if($('lcPhotoBtn'))$('lcPhotoBtn').onclick=()=>$('lcPhoto').click();
    if($('lcPhoto'))$('lcPhoto').onchange=e=>upload(e,'courier-photo');
    if($('lcDone'))$('lcDone').onclick=()=>{if(!p.tiene_foto){alert('Debes tomar y guardar la foto de entrega antes de finalizar.');$('lcPhoto')?.click();return}const box=$('lcFinalReview');if(box){box.style.display='block';box.scrollIntoView({behavior:'smooth',block:'center'})}};
    if($('lcViewEvidence'))$('lcViewEvidence').onclick=async()=>{
      const box=$('lcEvidenceViewer'),btn=$('lcViewEvidence');if(!box)return;
      if(box.classList.contains('open')){box.classList.remove('open');box.innerHTML='';btn.textContent='📷 VER FOTO';return}
      box.classList.add('open');box.innerHTML='<div class="liftProofViewerMsg">Cargando evidencia…</div>';btn.disabled=true;
      try{
        const z=await api({action:'courier-delivery-evidence-url',token:courierToken});
        if(!z.url)throw new Error('La evidencia todavía no está disponible.');
        box.innerHTML=`<img src="${esc(z.url)}" alt="Evidencia de entrega">`;btn.textContent='OCULTAR FOTO';
      }catch(e){box.innerHTML='<div class="liftProofViewerMsg">'+esc(e.message||'No se pudo abrir la evidencia.')+'</div>'}
      finally{btn.disabled=false}
    };

    if($('lcFinalConfirm'))$('lcFinalConfirm').onclick=()=>{if(!p.tiene_foto)return alert('Falta la foto de entrega.');setStatus('entregado')};
    if($('lcFinalBack'))$('lcFinalBack').onclick=()=>{$('lcFinalReview').style.display='none'};
    if($('lcPayProofBtn')){$('lcPayProofBtn').onclick=()=>$('lcPayProof').click();$('lcPayProof').onchange=e=>upload(e,'courier-payment-proof')}
   }catch(e){$('lcBody').innerHTML='<div class="lcCard"><b>No se pudo abrir la entrega.</b><div class="lcMsg">'+esc(e.message)+'</div></div>'}
 }
 async function setStatus(s){const m=$('lcMsg');if(m)m.innerHTML='<div class="lcMsg">Guardando…</div>';try{const extra=s==='entregado'?{entrega_tipo:$('lcDeliveryType')?.value||'directa',recibido_por:$('lcReceiver')?.value||'',entrega_nota:$('lcDeliveryNote')?.value||''}:{};await api({action:'courier-status',token:courierToken,estado:s,...extra});if(m)m.innerHTML='<div class="lcMsg">✓ Estado actualizado.</div>';setTimeout(loadCourier,450)}catch(e){if(m)m.innerHTML='<div class="lcMsg">'+esc(e.message)+'</div>'}}
 async function resize(f){const im=await new Promise((ok,no)=>{const i=new Image;i.onload=()=>ok(i);i.onerror=no;i.src=URL.createObjectURL(f)}),k=Math.min(1,1200/Math.max(im.width,im.height)),c=document.createElement('canvas');c.width=Math.round(im.width*k);c.height=Math.round(im.height*k);c.getContext('2d').drawImage(im,0,0,c.width,c.height);return c.toDataURL('image/jpeg',.72)}
 async function upload(e,action){const f=e.target.files?.[0];if(!f)return;const m=$('lcMsg');if(m)m.innerHTML='<div class="lcMsg">Subiendo evidencia…</div>';try{await api({action,token:courierToken,image_base64:await resize(f),mime:'image/jpeg'});if(m)m.innerHTML='<div class="lcMsg">✓ Evidencia guardada en Supabase.</div>';setTimeout(loadCourier,450)}catch(err){if(m)m.innerHTML='<div class="lcMsg">'+esc(err.message)+'</div>'}}
 if(courierToken)loadCourier()
})();

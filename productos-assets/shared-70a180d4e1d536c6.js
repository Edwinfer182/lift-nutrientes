
(function(){
 const RPC='https://vdxkknftyssjyfbdieqa.supabase.co/rest/v1/rpc/lift_pedidos_admin',EMAIL_FN='https://vdxkknftyssjyfbdieqa.supabase.co/functions/v1/lift-clientes',KEY='sb_publishable_ECuhXuKIb85kj9fgdEjrAw_O7uNpZsh',PASS='liftAdminCloudPasswordV1';
 const $=id=>document.getElementById(id),esc=v=>String(v??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m])),money=n=>typeof fmt==='function'?fmt(Number(n||0)):'$'+Number(n||0).toLocaleString('es-CO');
 let rows=[],quick='pendientes';
 const pass=()=>{try{return sessionStorage.getItem(PASS)||''}catch(e){return ''}};
 async function rpc(action,payload={}){const r=await fetch(RPC,{method:'POST',headers:{apikey:KEY,'Content-Type':'application/json'},body:JSON.stringify({p_password:pass(),p_action:action,p_payload:payload})});const j=await r.json().catch(()=>null);if(!r.ok)throw new Error(j?.message||j?.error||'No se pudo consultar pedidos');return j}
 function inject(){const tabs=document.querySelector('.liftOrdersTabs');if(!tabs||$('liftOrdersTabAll'))return;const b=document.createElement('button');b.id='liftOrdersTabAll';b.textContent='Todos';b.onclick=()=>liftOrdersTab('all');tabs.insertBefore(b,tabs.firstChild);const pay=document.createElement('button');pay.id='liftOrdersTabPayments';pay.type='button';pay.textContent='💳 Pagos';pay.onclick=()=>window.liftOpenPaymentsAdmin?.();tabs.appendChild(pay);const hist=$('liftOrdersHistory');if(!hist)return;const v=document.createElement('div');v.id='liftOrdersAll';v.className='liftOrdersView';v.innerHTML=`<div class="liftOpsToolbar"><input id="liftOpsSearch" placeholder="Buscar pedido, cliente, celular, producto o dirección" oninput="liftRenderAllOrders()"><select id="liftOpsStatusFilter" onchange="liftRenderAllOrders()"><option value="">Todos los estados</option><option value="nuevo">Nuevo</option><option value="programado">Programado</option><option value="en_ruta">En ruta</option><option value="entregado">Entregado</option><option value="cancelado">Cancelado</option></select></div><div class="liftOpsQuick"><button data-q="pendientes" onclick="liftOpsQuick('pendientes')">Pendientes</button><button data-q="hoy" onclick="liftOpsQuick('hoy')">Hoy</button><button data-q="ruta" onclick="liftOpsQuick('ruta')">En ruta</button><button data-q="seguimiento" onclick="liftOpsQuick('seguimiento')">Seguimientos</button><button data-q="todos" onclick="liftOpsQuick('todos')">Todos</button></div><div id="liftOpsStats" class="liftOpsStats"></div><div id="liftOpsList"><div class="liftOpsEmpty">Cargando pedidos…</div></div>`;hist.parentNode.insertBefore(v,hist);}
 const oldTab=window.liftOrdersTab;window.liftOrdersTab=function(tab){inject();['All','History','Old'].forEach(x=>$('liftOrders'+x)?.classList.remove('active'));['All','History','Old'].forEach(x=>$('liftOrdersTab'+x)?.classList.remove('active'));if(tab==='all'){$('liftOrdersAll')?.classList.add('active');$('liftOrdersTabAll')?.classList.add('active');liftLoadAllOrders();return}if(typeof oldTab==='function')return oldTab(tab)};
 const oldOpen=window.liftOpenOrders;window.liftOpenOrders=function(){const r=typeof oldOpen==='function'?oldOpen.apply(this,arguments):($('liftOrdersModal')?.classList.add('open'));setTimeout(()=>liftOrdersTab('all'),0);return r};
 window.liftLoadAllOrders=async function(){inject();const box=$('liftOpsList');if(box)box.innerHTML='<div class="liftOpsEmpty">Cargando pedidos…</div>';try{const j=await rpc('list');rows=Array.isArray(j)?j:[];
const payBtn=$('liftOrdersTabPayments');
if(payBtn){
 const n=rows.filter(p=>p.comprobante_subido||['por_verificar','rechazado'].includes(String(p.pago_estado||''))).length;
 payBtn.textContent=n?`💳 Pagos (${n})`:'💳 Pagos';
 payBtn.classList.toggle('hasPending',n>0);
}
liftRenderAllOrders()}catch(e){if(box)box.innerHTML='<div class="liftOpsEmpty">'+esc(e.message)+'</div>'}};
 const day=v=>{if(!v)return'';try{return new Date(v).toLocaleDateString('sv-SE',{timeZone:'America/Bogota'})}catch(e){return String(v).slice(0,10)}};
 const today=()=>new Intl.DateTimeFormat('sv-SE',{timeZone:'America/Bogota',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());
 function followDue(p){if(p.estado_operativo!=='entregado'||p.seguimiento_realizado||!p.fecha_entregado)return false;const d=new Date(p.fecha_entregado);d.setDate(d.getDate()+1);return day(d)<=today()}
 window.liftOpsQuick=function(q){quick=q;document.querySelectorAll('.liftOpsQuick button').forEach(b=>b.classList.toggle('on',b.dataset.q===q));liftRenderAllOrders()};
 window.liftRenderAllOrders=function(){const box=$('liftOpsList');if(!box)return;const q=($('liftOpsSearch')?.value||'').toLowerCase().trim(),st=$('liftOpsStatusFilter')?.value||'',td=today();let a=rows.slice();if(st)a=a.filter(p=>p.estado_operativo===st);if(q)a=a.filter(p=>{const items=(p.items||[]).map(x=>(x.nombre||'')+' '+(x.marca||'')).join(' ');return (`${p.id} ${p.nombre||''} ${p.celular||''} ${p.direccion||''} ${p.ciudad||''} ${items}`).toLowerCase().includes(q)});if(quick==='pendientes')a=a.filter(p=>!['entregado','cancelado'].includes(p.estado_operativo));else if(quick==='hoy')a=a.filter(p=>day(p.fecha)===td);else if(quick==='ruta')a=a.filter(p=>p.estado_operativo==='en_ruta');else if(quick==='seguimiento')a=a.filter(followDue);
 const pend=rows.filter(p=>!['entregado','cancelado'].includes(p.estado_operativo)).length,ruta=rows.filter(p=>p.estado_operativo==='en_ruta').length,ent=rows.filter(p=>p.estado_operativo==='entregado'&&day(p.fecha_entregado)===td).length,seg=rows.filter(followDue).length;$('liftOpsStats').innerHTML=`<div class="liftOpsStat"><small>Pendientes</small><b>${pend}</b></div><div class="liftOpsStat"><small>En ruta</small><b>${ruta}</b></div><div class="liftOpsStat"><small>Entregados hoy</small><b>${ent}</b></div><div class="liftOpsStat"><small>Seguimientos</small><b>${seg}</b></div>`;document.querySelectorAll('.liftOpsQuick button').forEach(b=>b.classList.toggle('on',b.dataset.q===quick));if(!a.length){box.innerHTML='<div class="liftOpsEmpty">No hay pedidos para este filtro.</div>';return}box.innerHTML=a.map(p=>card(p)).join('')};
 window.liftAdminCopyAccess=async function(id){
 const p=rows.find(x=>Number(x.id)===Number(id));if(!p)return alert('No encontré el pedido.');
 const token=String(p.token||p.token_publico||'').trim();if(!token)return alert('Este pedido no tiene token disponible.');
 return window.liftCopyText((window.liftBuildOrderUrl?window.liftBuildOrderUrl(p.id,token):('https://supgo.co/?pedido='+encodeURIComponent(p.id)+'&token='+encodeURIComponent(token))),'Enlace del pedido copiado.');
};
 window.liftAdminShareAccess=function(id){
  const p=rows.find(x=>Number(x.id)===Number(id));
  if(!p)return alert('No encontré el pedido.');
  const token=String(p.token||p.token_publico||'').trim();
  if(!token)return alert('Este pedido no devolvió token. Recarga Pedidos para consultar el dato actualizado de Supabase.');
  const phone=String(p.celular||'').replace(/\D/g,'');
  const num=phone?(phone.length===10?'57'+phone:phone):'';
  const url=orderUrl(p.id,token);
  const msg=`Hola ${p.nombre||''} 👋\n\nTu pedido #${p.id} está listo para continuar.\n\nPuedes consultar tu pedido y continuar con el pago aquí:\n${url}`;
  if(num) window.open(`https://wa.me/${num}?text=${encodeURIComponent(msg)}`,'_blank');
  else window.open('https://wa.me/?text='+encodeURIComponent(msg),'_blank');
};
 function card(p){const items=Array.isArray(p.items)?p.items:[],due=followDue(p),status=String(p.estado_operativo||'nuevo'),label={nuevo:'Nuevo',verificando_disponibilidad:'Verificando disponibilidad',pendiente_pago:'Pago habilitado',sin_disponibilidad:'Falta producto',preparando:'Preparando',programado:'Programado',en_ruta:'En ruta',entregado:'Entregado',cancelado:'Cancelado'}[status]||status,availability=status==='verificando_disponibilidad'?`<div class="liftOpsAvailability"><div><b>Confirmar disponibilidad</b><small>Al aprobar, el cliente podrá elegir su medio de pago.</small></div><div class="liftOpsAvailabilityBtns"><button class="ok" onclick="liftAdminAvailability(${p.id},true,this)">✓ TODO DISPONIBLE</button><button class="no" onclick="liftAdminAvailability(${p.id},false,this)">✕ FALTA PRODUCTO</button></div></div>`:status==='pendiente_pago'?`<div class="liftOpsPaymentReady">✓ Pago habilitado para el cliente</div>`:status==='sin_disponibilidad'?`<div class="liftOpsPaymentBlocked">Pago bloqueado · falta disponibilidad</div>`:'';return `<article class="liftOpsCard"><div class="liftOpsTop"><div><b>Pedido #${p.id} · ${esc(p.nombre||'')}</b><small>${esc(p.celular||'')} · ${esc(p.ciudad||'')} · ${new Date(p.fecha).toLocaleDateString('es-CO')}</small><span class="liftOpsStatus ${status}">${label}</span></div><div class="liftOpsMoney">${money(p.total)}</div></div><div class="liftOpsItems">${items.map(x=>`${Number(x.cantidad||1)} × ${esc(x.nombre||'Producto')}${x.marca?' · '+esc(x.marca):''}`).join('<br>')||'Sin detalle'}${p.direccion?'<br>📍 '+esc(p.direccion):''}${Number(p.envio||0)>0?'<br>Envío: '+money(p.envio):''}</div>${availability}${p.despacho_tipo==='guia'?`<div class="liftOpsFollow">🚚 ${esc(p.despacho_transportadora||'')} · Guía: ${esc(p.despacho_guia||'')} <button type="button" data-guia="${esc(p.despacho_guia||'')}" onclick="navigator.clipboard.writeText(this.dataset.guia)">Copiar</button></div>`:p.despacho_tipo==='local'?`<div class="liftOpsFollow">🛵 Salió a ruta en la ciudad. Sin hora prometida de entrega.</div>`:''}${status==='entregado'?`<div class="liftOpsFollow ${p.seguimiento_realizado?'done':''}">${p.seguimiento_realizado?'✓ Seguimiento realizado'+(p.fecha_seguimiento?' · '+new Date(p.fecha_seguimiento).toLocaleDateString('es-CO'):''):due?'Seguimiento pendiente: preguntar cómo le fue con el pedido.':'Seguimiento programado para el día siguiente a la entrega.'}</div>`:''}<div class="liftOpsActions"><button type="button" class="liftOrderPencil" title="Editar pedido" aria-label="Editar pedido ${p.id}" onclick="liftEditOrderCheckout(${p.id})">✎ Editar</button><select onchange="liftChooseOrderStatus(${p.id},this.value)" aria-label="Estado del pedido"><option value="verificando_disponibilidad" ${status==='verificando_disponibilidad'?'selected':''}>Verificando disponibilidad</option><option value="pendiente_pago" ${status==='pendiente_pago'?'selected':''}>Pago habilitado</option><option value="preparando" ${status==='preparando'?'selected':''}>Preparando</option><option value="programado" ${status==='programado'?'selected':''}>Programado</option><option value="en_ruta" ${status==='en_ruta'?'selected':''}>En ruta</option><option value="entregado" ${status==='entregado'?'selected':''}>Entregado</option><option value="cancelado" ${status==='cancelado'?'selected':''}>Cancelado</option></select><button onclick="liftAdminClientAccess(${p.id})" class="wa">👤 Cliente</button><button onclick="liftAdminCourierAccess(${p.id})" class="liftCourierAdminBtn">🛵 Enlace mensajero</button><button onclick="liftOpsWhatsApp(${p.id},false)" class="wa">WhatsApp</button>${status==='entregado'&&!p.seguimiento_realizado?`<button onclick="liftOpsWhatsApp(${p.id},true)" class="wa">Preguntar cómo le fue</button><button onclick="liftMarkFollowup(${p.id})">✓ Marcar seguimiento</button>`:''}</div></article>`}
 window.liftChooseOrderStatus=function(id,estado){
 if(estado!=='en_ruta'){window.liftSetOrderStatus(id,estado);return}
 const p=rows.find(x=>Number(x.id)===Number(id));if(!p)return;
 const old=document.getElementById('liftDispatchDialog');if(old)old.remove();
 const modal=document.createElement('div');modal.id='liftDispatchDialog';
 modal.style.cssText='position:fixed;inset:0;background:#0009;z-index:99999;display:grid;place-items:center;padding:15px';
 modal.innerHTML=`<div style="background:#fff;width:min(94vw,440px);border-radius:16px;padding:20px;box-shadow:0 18px 60px #0003;font:13px Poppins,sans-serif"><h3 style="margin:0 0 13px">Registrar despacho · Pedido #${id}</h3><label style="display:block;margin-bottom:10px"><input type="radio" name="liftDispatchType" value="local" checked> Salió a ruta en la ciudad</label><label style="display:block;margin-bottom:12px"><input type="radio" name="liftDispatchType" value="guia"> Enviado por transportadora</label><div id="liftDispatchFields" style="display:none"><select id="liftDispatchCarrier" style="width:100%;padding:10px;border:1px solid #ddd;border-radius:8px;margin-bottom:9px"><option>Coordinadora</option><option>Inter Rapidísimo</option><option>Envía</option><option>Otra</option></select><input id="liftDispatchGuide" placeholder="Número de guía" maxlength="100" style="width:100%;padding:10px;border:1px solid #ddd;border-radius:8px"></div><p style="font-size:11px;color:#666">En ruta local no se promete una hora de entrega.</p><div style="display:flex;gap:9px"><button type="button" id="liftDispatchCancel" style="flex:1;padding:12px;border:1px solid #ddd;border-radius:9px;background:white">Cancelar</button><button type="button" id="liftDispatchSave" style="flex:1;padding:12px;border:0;border-radius:9px;background:#111;color:white">Guardar despacho</button></div></div>`;
 document.body.appendChild(modal);
 const fields=modal.querySelector('#liftDispatchFields');
 modal.querySelectorAll('[name=liftDispatchType]').forEach(el=>el.onchange=()=>{fields.style.display=modal.querySelector('[name=liftDispatchType]:checked').value==='guia'?'block':'none'});
 modal.querySelector('#liftDispatchCancel').onclick=()=>{modal.remove();liftRenderAllOrders()};
 modal.querySelector('#liftDispatchSave').onclick=async()=>{
  const btn=modal.querySelector('#liftDispatchSave'),tipo=modal.querySelector('[name=liftDispatchType]:checked').value;
  const transportadora=modal.querySelector('#liftDispatchCarrier').value,guia=modal.querySelector('#liftDispatchGuide').value.trim();
  if(tipo==='guia'&&guia.length<3){alert('Ingresa un número de guía válido.');return}
  btn.disabled=true;btn.textContent='Guardando…';
  try{
   await rpc('despacho',{pedido_id:id,tipo,transportadora,guia});
   modal.remove();await liftLoadAllOrders();
   try{await fetch(EMAIL_FN,{method:'POST',headers:{apikey:KEY,'Content-Type':'application/json'},body:JSON.stringify({action:'notify-order-status',password:pass(),pedido_id:id,estado:'en_ruta'})})}catch(e){console.warn('Notificación pendiente',e)}
  }catch(e){alert('No se pudo guardar el despacho: '+e.message);btn.disabled=false;btn.textContent='Guardar despacho'}
 };
};
window.liftSetOrderStatus=async function(id,estado){try{await rpc('estado',{pedido_id:id,estado});const p=rows.find(x=>Number(x.id)===Number(id));if(p){p.estado_operativo=estado;const now=new Date().toISOString();if(estado==='programado'&&!p.fecha_programado)p.fecha_programado=now;if(estado==='en_ruta'&&!p.fecha_en_ruta)p.fecha_en_ruta=now;if(estado==='entregado'&&!p.fecha_entregado)p.fecha_entregado=now}if(['programado','en_ruta'].includes(estado)){try{const er=await fetch(EMAIL_FN,{method:'POST',headers:{apikey:KEY,'Content-Type':'application/json'},body:JSON.stringify({action:'notify-order-status',password:pass(),pedido_id:id,estado})});const ej=await er.json().catch(()=>({}));if(!er.ok)console.warn('Correo de estado no enviado:',ej.error||er.status)}catch(mailErr){console.warn('Correo de estado no enviado:',mailErr)}}liftRenderAllOrders()}catch(e){alert('No pude cambiar el estado: '+e.message);await liftLoadAllOrders()}};
 window.liftMarkFollowup=async function(id){try{await rpc('seguimiento',{pedido_id:id,realizado:true});const p=rows.find(x=>Number(x.id)===Number(id));if(p){p.seguimiento_realizado=true;p.fecha_seguimiento=new Date().toISOString()}liftRenderAllOrders()}catch(e){alert('No pude guardar el seguimiento: '+e.message)}};
 window.liftOpsWhatsApp=function(id,follow){
  const p=rows.find(x=>Number(x.id)===Number(id));if(!p)return;
  const phone=String(p.celular||'').replace(/\D/g,'');if(!phone){alert('Este pedido no tiene celular.');return}
  const token=String(p.token||p.token_publico||'').trim();
  if(!token){alert('Este pedido no tiene token de consulta. Recarga Pedidos e inténtalo de nuevo.');return}
  const url=window.liftBuildOrderUrl?window.liftBuildOrderUrl(p.id,token):('https://supgo.co/?pedido='+encodeURIComponent(p.id)+'&token='+encodeURIComponent(token));
  const name=String(p.nombre||'').trim().split(/\s+/)[0]||'cliente';
  const estado=String(p.estado_operativo||'nuevo');
  const messages={
   nuevo:'Recibimos tu pedido y estamos verificando la disponibilidad de los productos.',
   verificando_disponibilidad:'Recibimos tu pedido. Estamos verificando la disponibilidad de los productos para habilitar el pago.',
   sin_disponibilidad:'Uno o más productos de tu pedido no están disponibles. No realices el pago todavía; te contactaremos para revisar las opciones.',
   pendiente_pago:'Ya confirmamos la disponibilidad de tu pedido y tienes habilitados los medios de pago. Puedes continuar desde el enlace.',
   preparando:'Tu pago fue confirmado y estamos preparando tu pedido.',
   programado:'Tu pedido ya está programado para despacho. Te avisaremos cuando salga a ruta.',
   en_ruta:p.despacho_tipo==='guia'?'Tu pedido ya fue despachado por '+(p.despacho_transportadora||'transportadora')+(p.despacho_guia?'. Número de guía: '+p.despacho_guia:'')+'. Puedes consultar el seguimiento en el enlace.':'Tu pedido ya salió a ruta. No podemos confirmar una hora exacta de entrega.',
   entregado:'Tu pedido figura como entregado. Gracias por comprar en Lift Nutrientes.',
   cancelado:'Tu pedido figura como cancelado. Puedes consultar el estado desde el enlace.'
  };
  const first=(p.items||[])[0]?.nombre||'tu pedido';
  const message=follow?`¿Cómo te fue con tu pedido de ${first}? Quería confirmar que lo recibiste todo bien.`:(messages[estado]||'Puedes consultar el estado actualizado de tu pedido.');
  const text=`Hola ${name}, ${message}\n\nConsulta tu pedido #${p.id} aquí:\n${url}`;
  const num=phone.length===10?'57'+phone:phone;
  window.open(`https://wa.me/${num}?text=${encodeURIComponent(text)}`,'_blank');
 };
 function boot(){inject();}
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot);else boot();
})();

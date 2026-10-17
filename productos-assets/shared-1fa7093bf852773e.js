
(function(){
 const SB='https://vdxkknftyssjyfbdieqa.supabase.co',KEY='sb_publishable_ECuhXuKIb85kj9fgdEjrAw_O7uNpZsh',FN=SB+'/functions/v1/lift-clientes',PASS='liftAdminCloudPasswordV1';
 const $=id=>document.getElementById(id),esc=s=>String(s??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m])),money=n=>typeof fmt==='function'?fmt(Number(n||0)):'$'+Number(n||0).toLocaleString('es-CO');
 const password=()=>{try{return sessionStorage.getItem(PASS)||''}catch(e){return ''}};
 async function call(payload){const r=await fetch(FN,{method:'POST',headers:{apikey:KEY,'Content-Type':'application/json'},body:JSON.stringify({...payload,password:password()})});const j=await r.json().catch(()=>({}));if(!r.ok)throw new Error(j.error||'No se pudo completar la operación');return j}
 function install(){const row=document.querySelector('.liftAdminToolsRow');if(!row||$('liftOrdersOpenBtn'))return;const b=document.createElement('button');b.id='liftOrdersOpenBtn';b.className='liftOrdersBtn';b.type='button';b.textContent='📦 Pedidos';b.onclick=liftOpenOrders;row.insertBefore(b,$('liftCarteraOpenBtn')||null)}
 window.liftOpenOrders=function(){$('liftOrdersModal')?.classList.add('open');if($('liftOldDate')&&!$('liftOldDate').value)$('liftOldDate').value=new Date().toISOString().slice(0,10)};window.liftCloseOrders=()=>$('liftOrdersModal')?.classList.remove('open');
 window.liftOrdersTab=function(tab){$('liftOrdersTabHistory').classList.toggle('active',tab==='history');$('liftOrdersTabOld').classList.toggle('active',tab==='old');$('liftOrdersHistory').classList.toggle('active',tab==='history');$('liftOrdersOld').classList.toggle('active',tab==='old')};
 window.liftSearchOrderClients=async function(){const q=$('liftOrderClientSearch').value.trim(),box=$('liftOrderResults');if(q.length<2){box.innerHTML='<div class="liftOrdersEmpty">Escribe al menos 2 caracteres.</div>';return}box.innerHTML='<div class="liftOrdersEmpty">Buscando…</div>';try{const j=await call({action:'find',q}),cs=j.clientes||[];box.innerHTML=cs.length?cs.map(c=>`<div class="liftOrderClient" onclick="liftLoadClientOrders(${Number(c.id)},'${esc(String(c.nombre||'').replace(/'/g,"\\'"))}')"><b>${esc(c.nombre)}</b><small>${esc(c.celular)}</small></div>`).join(''):'<div class="liftOrdersEmpty">No encontré ese cliente.</div>'}catch(e){box.innerHTML='<div class="liftOrdersEmpty">'+esc(e.message)+'</div>'}};
 window.liftLoadClientOrders=async function(id,name){const box=$('liftOrderResults');box.innerHTML='<div class="liftOrdersEmpty">Cargando pedidos de '+esc(name)+'…</div>';try{const j=await call({action:'history',cliente_id:id}),ps=j.pedidos||[];box.innerHTML=ps.length?ps.map(p=>`<article class="liftOrderCard"><div class="liftOrderTop"><div><b>Pedido #${p.id}</b><br><small>${new Date(p.fecha).toLocaleDateString('es-CO')} · ${esc(p.ciudad||'')}</small><br><span class="liftOrderBadge">${esc(p.origen||'checkout')}</span></div><div class="liftOrderTotal">${money(p.total)}</div></div><div class="liftOrderItems">${(p.lift_pedido_productos||[]).map(x=>`${Number(x.cantidad||1)} × ${esc(x.nombre)} · ${money(x.total_linea)}`).join('<br>')||'Sin detalle de productos'}${Number(p.envio||0)>0?'<br>Envío: '+money(p.envio):''}${p.notas?'<br>Nota: '+esc(p.notas):''}</div></article>`).join(''):'<div class="liftOrdersEmpty">Este cliente todavía no tiene pedidos guardados.</div>'}catch(e){box.innerHTML='<div class="liftOrdersEmpty">'+esc(e.message)+'</div>'}};
 let liftOldClientTimer=null,liftOldDepartment='';
 async function liftOldFindClients(){
   const q=$('liftOldClientSearch')?.value.trim()||'', box=$('liftOldClientResults');
   if(!box)return;
   if(q.length<2){box.classList.remove('open');box.innerHTML='';return}
   box.classList.add('open');box.innerHTML='<div class="liftOrdersEmpty">Buscando…</div>';
   try{
     const j=await call({action:'find',q}), cs=j.clientes||[];
     const rows=[];
     cs.forEach(c=>{
       const dirs=(c.lift_direcciones_cliente||[]).slice().sort((a,b)=>Number(b.predeterminada)-Number(a.predeterminada));
       if(dirs.length) dirs.forEach(d=>rows.push({cliente_id:c.id,nombre:c.nombre||'',celular:c.celular||'',direccion:d.direccion||'',ciudad:d.ciudad||'',departamento:d.departamento||'',etiqueta:d.etiqueta||'Dirección',predeterminada:!!d.predeterminada,notas:d.notas||''}));
       else rows.push({cliente_id:c.id,nombre:c.nombre||'',celular:c.celular||'',direccion:'',ciudad:'',departamento:'',etiqueta:'Sin dirección guardada',predeterminada:false,notas:''});
     });
     box.innerHTML=rows.length?rows.map((d,i)=>`<button type="button" class="liftOldClientHit" data-old-client="${esc(JSON.stringify(d))}"><b>${d.predeterminada?'★ ':''}${esc(d.nombre)} · ${esc(d.celular)}</b><small class="addr">${esc(d.etiqueta)}${d.direccion?' · '+esc(d.direccion):''}${d.ciudad?' · '+esc(d.ciudad):''}</small></button>`).join(''):'<div class="liftOrdersEmpty">No encontré ese cliente.</div>';
     box.querySelectorAll('[data-old-client]').forEach(b=>b.onclick=()=>{
       const d=JSON.parse(b.dataset.oldClient);
       $('liftOldName').value=d.nombre||'';$('liftOldPhone').value=d.celular||'';$('liftOldAddress').value=d.direccion||'';$('liftOldCity').value=d.ciudad||'';liftOldDepartment=d.departamento||'';
       if($('liftOldNotes')&&!$('liftOldNotes').value&&d.notas)$('liftOldNotes').value=d.notas;
       $('liftOldClientSearch').value=d.nombre||'';box.classList.remove('open');box.innerHTML='';
     });
   }catch(e){box.innerHTML='<div class="liftOrdersEmpty">'+esc(e.message)+'</div>'}
 }
 window.liftOldFindClients=liftOldFindClients;
 window.liftOldPaySync=function(){const v=$('liftOldPay').value,show=v!=='pagado';$('liftOldAbonoLabel').style.display=show?'grid':'none';$('liftOldDueLabel').style.display=show?'grid':'none';if(!show)$('liftOldAbono').value=0};
 let liftOldLastShip=0;
 window.liftOldShippingIntoTotal=function(){
   const shipEl=$('liftOldShip'), totalEl=$('liftOldTotal');
   if(!shipEl||!totalEl)return;
   const nextShip=$('liftOldShipMode')?.value==='gratis'?0:Math.max(0,Number(shipEl.value||0));
   const currentTotal=Math.max(0,Number(totalEl.value||0));
   // El total mostrado ya incluye el envío anterior. Sustituimos solo ese componente,
   // evitando sumar el domicilio varias veces mientras el usuario escribe.
   totalEl.value=Math.max(0,currentTotal-liftOldLastShip+nextShip);
   liftOldLastShip=nextShip;
 };
 window.liftOldShipSync=function(){
   const ship=$('liftOldShip'), mode=$('liftOldShipMode');if(!ship||!mode)return;
   if(mode.value==='gratis'){
     const currentTotal=Math.max(0,Number($('liftOldTotal')?.value||0));
     if($('liftOldTotal'))$('liftOldTotal').value=Math.max(0,currentTotal-liftOldLastShip);
     ship.value=0;ship.disabled=true;liftOldLastShip=0;
   }else{
     ship.disabled=false;
     liftOldLastShip=Math.max(0,Number(ship.value||0));
   }
 };
 window.liftSaveOldOrder=async function(){const fecha=$('liftOldDate').value,nombre=$('liftOldName').value.trim(),celular=$('liftOldPhone').value.trim(),producto=$('liftOldProduct').value.trim(),cantidad=Math.max(1,Number($('liftOldQty').value||1)),total=Math.max(0,Number($('liftOldTotal').value||0)),envio=$('liftOldShipMode').value==='gratis'?0:Math.max(0,Number($('liftOldShip').value||0)),forma=$('liftOldPay').value,abono=forma==='pagado'?total:Math.min(total,Math.max(0,Number($('liftOldAbono').value||0))),vence=forma==='pagado'?'':$('liftOldDue').value;
  if(!fecha||!nombre||!celular||!producto||total<=0){alert('Completa fecha, cliente, celular, producto y total.');return}
  const subtotal=Math.max(0,total-envio),unit=Math.round(subtotal/cantidad);
  const orderOrigin=['admin','forma='+encodeURIComponent(forma),'abono='+Math.round(abono),'vence='+(vence||''),'envio='+encodeURIComponent($('liftOldShipMode').value),'fecha='+fecha].join('|');
  try{const existing=await call({action:'find',q:celular});const same=(existing.clientes||[]).find(c=>String(c.celular||'').replace(/\D/g,'')===String(celular).replace(/\D/g,''));if(!same){await call({action:'save',nombre,celular,direccion:$('liftOldAddress').value.trim()||'Sin dirección',ciudad:$('liftOldCity').value.trim()||'Sin ciudad',departamento:liftOldDepartment||'',notas:$('liftOldNotes').value.trim(),etiqueta:'Casa'});}const j=await call({action:'save-order',nombre,celular,direccion:$('liftOldAddress').value.trim()||'Sin dirección',ciudad:$('liftOldCity').value.trim()||'Sin ciudad',departamento:liftOldDepartment||'',notas:$('liftOldNotes').value.trim(),subtotal,envio,descuento:0,total,origen:orderOrigin,items:[{producto_id:null,nombre:producto,marca:'',cantidad,precio_unitario:unit,total_linea:subtotal}]});alert('Pedido anterior #'+j.pedido_id+' guardado'+(forma!=='pagado'?'. Saldo: '+money(Math.max(0,total-abono)):'.'));['liftOldName','liftOldPhone','liftOldProduct','liftOldTotal','liftOldShip','liftOldAbono','liftOldDue','liftOldCity','liftOldAddress','liftOldNotes'].forEach(id=>{if($(id))$(id).value=id==='liftOldShip'||id==='liftOldAbono'?'0':''});$('liftOldQty').value=1;liftOldDepartment='';if($('liftOldClientSearch'))$('liftOldClientSearch').value='';$('liftOldPay').value='pagado';liftOldPaySync();$('liftOldShipMode').value='manual';liftOldLastShip=0;liftOldShipSync()}catch(e){alert('No pude guardar el pedido: '+e.message)}};
 document.addEventListener('keydown',e=>{if(e.key==='Enter'&&document.activeElement===$('liftOrderClientSearch')){e.preventDefault();liftSearchOrderClients()}});
 const bindOldClientSearch=()=>{const inp=$('liftOldClientSearch');if(!inp||inp.dataset.bound)return;inp.dataset.bound='1';inp.addEventListener('input',()=>{clearTimeout(liftOldClientTimer);liftOldClientTimer=setTimeout(liftOldFindClients,220)});inp.addEventListener('keydown',e=>{if(e.key==='Enter'){e.preventDefault();clearTimeout(liftOldClientTimer);liftOldFindClients()}})};
 const obs=new MutationObserver(()=>{install();bindOldClientSearch()});obs.observe(document.body,{childList:true,subtree:true});if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(()=>{install();bindOldClientSearch()},120));else setTimeout(()=>{install();bindOldClientSearch()},120);
})();

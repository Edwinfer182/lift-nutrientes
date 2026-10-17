
(function(){
 const SB_URL='https://vdxkknftyssjyfbdieqa.supabase.co', SB_KEY='sb_publishable_ECuhXuKIb85kj9fgdEjrAw_O7uNpZsh', FN=SB_URL+'/functions/v1/lift-clientes', PASS_KEY='liftAdminCloudPasswordV1';
 const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const pass=()=>{try{return sessionStorage.getItem(PASS_KEY)||''}catch(e){return ''}};
 async function call(payload){const r=await fetch(FN,{method:'POST',headers:{apikey:SB_KEY,'Content-Type':'application/json'},body:JSON.stringify({...payload,password:pass()})});const j=await r.json().catch(()=>({}));if(!r.ok)throw new Error(j.error||'No se pudo consultar el historial');return j}
 let activeClientId=null, historyCache={};
 const money=v=>typeof fmt==='function'?fmt(Number(v||0)):'$ '+Number(v||0).toLocaleString('es-CO');
 const date=v=>{try{return new Intl.DateTimeFormat('es-CO',{day:'2-digit',month:'short',year:'numeric'}).format(new Date(v))}catch(e){return v||''}};
 window.liftLoadHistory=async function(clientId, targetId){
   activeClientId=Number(clientId); const box=document.getElementById(targetId||('liftHistory-'+clientId)); if(!box)return;
   box.innerHTML='<div class="liftHistoryEmpty">Cargando pedidos…</div>';
   try{const j=await call({action:'history',cliente_id:activeClientId});const ps=j.pedidos||[];historyCache[activeClientId]=ps;if(!ps.length){box.innerHTML='<div class="liftHistoryEmpty">Este cliente todavía no tiene pedidos guardados.</div>';return}
     box.innerHTML='<div class="liftHistoryTitle">Último pedido</div>'+ps.slice(0,1).map(p=>historyCard(p,activeClientId)).join('')+(ps.length>1?`<details style="margin-top:7px"><summary style="font-size:10px;cursor:pointer">Ver historial (${ps.length})</summary><div class="liftOrderHistory">${ps.slice(1).map(p=>historyCard(p,activeClientId)).join('')}</div></details>`:'');
   }catch(e){box.innerHTML='<div class="liftHistoryEmpty">'+esc(e.message)+'</div>'}
 };
 function historyCard(p,cid){const items=p.lift_pedido_productos||[];return `<div class="liftHistoryCard"><div class="liftHistoryHead"><b>Pedido #${p.id}</b><span>${date(p.fecha)}</span></div><div class="liftHistoryItems">${items.map(x=>`${x.cantidad} × ${esc(x.nombre)}${x.marca?' · '+esc(x.marca):''}`).join('<br>')}</div><div class="liftHistoryTotal">Total: ${money(p.total)}</div><button type="button" class="liftRepeatOrder" onclick="liftRepeatOrder(${cid},${p.id})">↻ Repetir pedido</button></div>`}
 window.liftRepeatOrder=function(cid,pid){const p=(historyCache[cid]||[]).find(x=>Number(x.id)===Number(pid));if(!p)return;let added=0,missing=[];(p.lift_pedido_productos||[]).forEach(x=>{const current=(window.PRODUCTS||[]).find(z=>String(z.id)===String(x.producto_id));if(!current){missing.push(x.nombre);return}for(let i=0;i<Number(x.cantidad||1);i++){if(typeof add==='function')add(current.id);added++}});if(added&&typeof renderCheckoutSummary==='function')renderCheckoutSummary();if(missing.length)alert('Se agregaron los productos disponibles. Ya no encontré en el catálogo: '+missing.join(', '));};
 // Mejora la búsqueda de clientes: cada cliente muestra direcciones + último pedido/historial.
 window.liftFindClient=async function(){
   if(!document.body.classList.contains('liftAdminUnlocked'))return;
   const q=document.getElementById('liftClientSearch')?.value.trim()||'', box=document.getElementById('liftClientResults');if(!box)return;if(q.length<2){box.innerHTML='<div class="liftClientEmpty">Escribe un nombre o celular.</div>';return}box.innerHTML='<div class="liftClientEmpty">Buscando…</div>';
   try{const j=await call({action:'find',q});const cs=j.clientes||[];if(!cs.length){box.innerHTML='<div class="liftClientEmpty">No encontré ese cliente.</div>';return}
     box.innerHTML=cs.map(c=>`<div class="liftClientResult"><div class="liftClientResultHead"><b>${esc(c.nombre)}</b><span>${esc(c.celular)}</span></div>${(c.lift_direcciones_cliente||[]).sort((a,b)=>Number(b.predeterminada)-Number(a.predeterminada)).map(d=>`<button type="button" class="liftClientAddress" data-client='${esc(JSON.stringify({cliente_id:c.id,nombre:c.nombre,celular:c.celular,...d}))}'>${d.predeterminada?'★ ':''}${esc(d.etiqueta||'Dirección')}: ${esc(d.direccion)} · ${esc(d.ciudad)}${d.departamento?' · '+esc(d.departamento):''}</button>`).join('')}<button type="button" class="liftHistoryBtn" onclick="liftLoadHistory(${c.id},'liftHistory-${c.id}')">🧾 Último pedido / historial</button><div id="liftHistory-${c.id}" class="liftOrderHistory"></div></div>`).join('');
     box.querySelectorAll('.liftClientAddress').forEach(b=>b.onclick=()=>{const d=JSON.parse(b.dataset.client);activeClientId=Number(d.cliente_id);document.getElementById('coName').value=d.nombre||'';document.getElementById('coPhone').value=d.celular||'';document.getElementById('coAddress').value=d.direccion||'';if(document.getElementById('coNotes')&&!document.getElementById('coNotes').value)document.getElementById('coNotes').value=d.notas||'';const city=document.getElementById('coCity');if(city)city.value=d.ciudad+(d.departamento?' · '+d.departamento:'');if(typeof selectedCity!=='undefined')selectedCity={name:d.ciudad,department:d.departamento||''};if(typeof renderCheckoutSummary==='function')renderCheckoutSummary();liftLoadHistory(activeClientId,'liftHistory-'+activeClientId);});
   }catch(e){box.innerHTML='<div class="liftClientEmpty">'+esc(e.message)+'</div>'}
 };
 window.liftSaveOrderHistory=async function(){
   if(!document.body.classList.contains('liftAdminUnlocked'))return true;
   const nombre=document.getElementById('coName')?.value.trim()||'',celular=document.getElementById('coPhone')?.value.trim()||'',whatsapp_usuario=document.getElementById('coWhatsappUser')?.value.trim()||'',direccion=document.getElementById('coAddress')?.value.trim()||'',notas=document.getElementById('coNotes')?.value.trim()||'';if(!nombre||!celular||!direccion||typeof selectedCity==='undefined'||!selectedCity)return true;
   const its=typeof checkoutItemsList==='function'?checkoutItemsList():[];if(!its.length)return true;const subtotal=checkoutPublicSubtotal(its),effective=checkoutEffectiveSubtotal(its),envio=shippingFor(selectedCity.name,checkoutQty()),descuento=checkoutCouponDiscount(its),total=Math.max(0,effective-(trainerCouponActive()?0:descuento))+(envio||0);
   const items=its.map(({p,q})=>({producto_id:p.id,nombre:p.name+(p._cartFlavor?' · Sabor: '+p._cartFlavor:''),marca:p.brand||'',cantidad:q,precio_unitario:checkoutUnitPrice(p),total_linea:checkoutUnitPrice(p)*q}));
   try{await call({action:'save-order',nombre,celular,direccion,ciudad:selectedCity.name||'',departamento:selectedCity.department||'',notas,subtotal,envio:envio||0,descuento:trainerCouponActive()?0:descuento,total,origen:'proveedor',items});return true}catch(e){console.error('Historial pedido:',e);alert('El pedido se copió, pero no pude guardar el historial: '+e.message);return false}
 };
 const install=()=>{}; // guardado automático eliminado
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install);else install();
})();

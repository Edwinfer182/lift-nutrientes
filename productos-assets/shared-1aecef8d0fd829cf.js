
(function(){
 const FN='https://vdxkknftyssjyfbdieqa.supabase.co/functions/v1/lift-clientes',KEY='sb_publishable_ECuhXuKIb85kj9fgdEjrAw_O7uNpZsh',PASS='liftAdminCloudPasswordV1';
 const $=id=>document.getElementById(id), esc=v=>String(v??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m])), money=n=>typeof fmt==='function'?fmt(Number(n||0)):'$'+Number(n||0).toLocaleString('es-CO');
 const pass=()=>{try{return sessionStorage.getItem(PASS)||''}catch(e){return ''}};
 let cache={};
 async function call(payload){const r=await fetch(FN,{method:'POST',headers:{apikey:KEY,'Content-Type':'application/json'},body:JSON.stringify({...payload,password:pass()})});const j=await r.json().catch(()=>({}));if(!r.ok)throw new Error(j.error||'No se pudo consultar el historial');return j}
 const d=v=>{try{return new Date(v).toLocaleDateString('es-CO',{day:'2-digit',month:'short',year:'numeric'})}catch(e){return String(v||'')}};
 function pay(p){const o=decodeURIComponent(String(p.origen||''));const m=o.match(/forma=([^|]+)/);return m?({pagado:'Pagado',credito:'Crédito',abono:'Abono + saldo'}[m[1]]||m[1]):'Pedido'}
 function status(p){const x=String(p.estado_operativo||'');return ({nuevo:'Nuevo',programado:'Programado',en_ruta:'En ruta',entregado:'Entregado',cancelado:'Cancelado'}[x]||'')}
 function phoneUrl(phone,text){let n=String(phone||'').replace(/\D/g,'');if(!n)return'';if(n.length===10)n='57'+n;return 'https://wa.me/'+n+'?text='+encodeURIComponent(text)}
 window.liftHistoryClientWhatsApp=function(id){const x=cache[id];if(!x)return;const u=phoneUrl(x.client.celular,`Hola ${x.client.nombre||''}, te escribo de Lift Nutrientes.`);if(u)window.open(u,'_blank')};
 window.liftHistoryOrderWhatsApp=function(cid,pid){const x=cache[cid],p=x?.orders.find(z=>Number(z.id)===Number(pid));if(!x||!p)return;const u=phoneUrl(x.client.celular,`Hola ${x.client.nombre||''}, te escribo por tu pedido #${p.id}.`);if(u)window.open(u,'_blank')};
 window.liftHistoryRepeat=function(cid,pid){const x=cache[cid],p=x?.orders.find(z=>Number(z.id)===Number(pid));if(!p)return;let added=0,missing=[];(p.lift_pedido_productos||[]).forEach(it=>{const current=(window.PRODUCTS||[]).find(z=>String(z.id)===String(it.producto_id));if(!current){missing.push(it.nombre);return}for(let i=0;i<Math.max(1,Number(it.cantidad||1));i++){if(typeof add==='function')add(current.id);added++}});if(added&&typeof renderCheckoutSummary==='function')renderCheckoutSummary();if(added&&typeof openCheckout==='function')openCheckout();if(missing.length)alert('Cargué los productos disponibles. Ya no encontré: '+missing.join(', '))};
 window.liftLoadClientOrders=async function(id,name){
   const box=$('liftOrderResults');if(!box)return;box.innerHTML='<div class="liftOrdersEmpty">Cargando historial de '+esc(name)+'…</div>';
   try{
     const [hj,fj]=await Promise.all([call({action:'history',cliente_id:id}),call({action:'find',q:name})]);
     const ps=(hj.pedidos||[]).slice().sort((a,b)=>new Date(b.fecha)-new Date(a.fecha));
     const found=(fj.clientes||[]).find(c=>Number(c.id)===Number(id))||(fj.clientes||[])[0]||{};
     const client={id:Number(id),nombre:found.nombre||name||'',celular:found.celular||'',dirs:found.lift_direcciones_cliente||[]};cache[id]={client,orders:ps};
     if(!ps.length){box.innerHTML='<button class="liftHistBack" onclick="liftSearchOrderClients()">← Volver</button><div class="liftOrdersEmpty">Este cliente todavía no tiene pedidos guardados.</div>';return}
     const total=ps.reduce((s,p)=>s+Number(p.total||0),0), avg=total/ps.length, oldest=ps[ps.length-1], newest=ps[0];
     const freq=new Map();ps.forEach(p=>(p.lift_pedido_productos||[]).forEach(it=>{const key=(it.nombre||'Producto')+'|||'+(it.marca||'');const cur=freq.get(key)||{name:it.nombre||'Producto',brand:it.marca||'',qty:0,orders:0};cur.qty+=Number(it.cantidad||1);cur.orders+=1;freq.set(key,cur)}));
     const top=[...freq.values()].sort((a,b)=>b.orders-a.orders||b.qty-a.qty).slice(0,6);
     const addr=(client.dirs||[]).slice().sort((a,b)=>Number(b.predeterminada)-Number(a.predeterminada))[0];
     box.innerHTML=`<button class="liftHistBack" onclick="liftSearchOrderClients()">← Volver a clientes</button>
       <section class="liftHistProfile"><div class="liftHistProfileTop"><div><h3>${esc(client.nombre)}</h3><div class="phone">${esc(client.celular)}${addr?' · '+esc(addr.ciudad||'')+' · '+esc(addr.direccion||''):''}</div></div><button class="liftHistWa" onclick="liftHistoryClientWhatsApp(${id})">WhatsApp</button></div><div class="liftHistStats"><div class="liftHistStat"><small>Pedidos</small><b>${ps.length}</b></div><div class="liftHistStat"><small>Total comprado</small><b>${money(total)}</b></div><div class="liftHistStat"><small>Ticket promedio</small><b>${money(Math.round(avg))}</b></div><div class="liftHistStat"><small>Última compra</small><b>${d(newest.fecha)}</b></div></div></section>
       <section class="liftHistSection"><div class="liftHistSectionTitle">Productos que compra</div>${top.length?top.map(x=>`<div class="liftHistFav"><span>${esc(x.name)}${x.brand?' · '+esc(x.brand):''}</span><span>${x.orders} pedido${x.orders===1?'':'s'} · ${x.qty} und.</span></div>`).join(''):'<div class="liftOrdersEmpty">Sin productos registrados.</div>'}<div style="font-size:8px;color:#888;margin-top:8px">Primera compra: ${d(oldest.fecha)}</div></section>
       <div class="liftHistSectionTitle" style="margin:12px 2px 8px">Cronología de pedidos</div><div class="liftHistTimeline">${ps.map(p=>orderCard(p,id)).join('')}</div>`;
   }catch(e){box.innerHTML='<div class="liftOrdersEmpty">'+esc(e.message)+'</div>'}
 };
 function orderCard(p,cid){const items=p.lift_pedido_productos||[],st=status(p);return `<article class="liftHistOrder"><div class="liftHistOrderTop"><div><b>Pedido #${p.id}</b><small>${d(p.fecha)}${p.ciudad?' · '+esc(p.ciudad):''}</small></div><div class="liftHistOrderTotal">${money(p.total)}</div></div><div class="liftHistMeta"><span class="liftHistPill">${esc(pay(p))}</span>${st?`<span class="liftHistPill">${esc(st)}</span>`:''}${p.seguimiento_realizado?'<span class="liftHistPill">✓ Seguimiento</span>':''}</div><div class="liftHistProducts">${items.map(x=>`${Number(x.cantidad||1)} × ${esc(x.nombre||'Producto')}${x.marca?' · '+esc(x.marca):''}${Number(x.total_linea||0)>0?' · '+money(x.total_linea):''}`).join('<br>')||'Sin detalle de productos'}${Number(p.envio||0)>0?'<br>Envío: '+money(p.envio):''}${p.direccion?'<br>📍 '+esc(p.direccion):''}${p.notas?'<br>Nota: '+esc(p.notas):''}</div><div class="liftHistOrderActions"><button class="primary" onclick="liftHistoryRepeat(${cid},${p.id})">↻ Repetir pedido</button><button onclick="liftHistoryOrderWhatsApp(${cid},${p.id})">WhatsApp</button></div></article>`}
})();


(function(){
 const SB='https://vdxkknftyssjyfbdieqa.supabase.co', KEY='sb_publishable_ECuhXuKIb85kj9fgdEjrAw_O7uNpZsh', PASS='liftAdminCloudPasswordV1';
 let S={clients:[],followups:[],orders:[],quotes:[],filter:'todos',current:null,recs:new Map()};
 const $=id=>document.getElementById(id), esc=v=>String(v??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
 const day=86400000, now=()=>new Date(), start=d=>{const x=new Date(d);x.setHours(0,0,0,0);return x}, add=(d,n)=>new Date(new Date(d).getTime()+n*day);
 const fmt=d=>d?new Date(d).toLocaleDateString('es-CO',{day:'2-digit',month:'short'}):'';
 const money=n=>'$ '+Number(n||0).toLocaleString('es-CO');
 const norm=v=>String(v||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
 async function call(payload){const r=await fetch(SB+'/functions/v1/lift-clientes',{method:'POST',headers:{apikey:KEY,'Content-Type':'application/json'},body:JSON.stringify({...payload,password:sessionStorage.getItem(PASS)||''}),cache:'no-store'});const j=await r.json().catch(()=>({}));if(!r.ok||j?.error)throw new Error(j?.error||'No se pudo cargar CRM');return j}
 function latestFollow(id){return S.followups.filter(x=>+x.cliente_id===+id).sort((a,b)=>new Date(b.fecha)-new Date(a.fecha))[0]||null}
 function clientOrders(id){return S.orders.filter(x=>+x.cliente_id===+id).sort((a,b)=>new Date(b.fecha)-new Date(a.fecha))}
 function clientQuotes(id){return S.quotes.filter(x=>+x.cliente_id===+id).sort((a,b)=>new Date(b.fecha)-new Date(a.fecha))}
 function servings(name){const n=norm(name),m=n.match(/(\d{1,3})\s*(serv|servicios|porciones)/);if(m)return +m[1];const caps=n.match(/(\d{2,3})\s*(caps|capsulas|softgels|gomitas)/);if(caps)return +caps[1];const g=n.match(/(\d{2,4})\s*(g|gr|gramos)\b/);if(g&&n.includes('creatin'))return Math.max(1,Math.round(+g[1]/5));const lb=n.match(/([123456])\s*(lb|lbs|libras?)/);if(lb&&(n.includes('whey')||n.includes('protein')||n.includes('iso')||n.includes('bipro')||n.includes('nitro')))return +lb[1]*14;return 0}
 function useDays(item){const n=norm(item?.nombre),sv=servings(n);if(n.includes('pre entren')||n.includes('pre-work')||n.includes('prework'))return sv?Math.round(sv/4*7):35;if(n.includes('creatin'))return sv||60;if(n.includes('protein')||n.includes('whey')||n.includes('isolate')||n.includes('iso100')||n.includes('iso xp')||n.includes('bipro'))return sv||30;if(n.includes('omega')||n.includes('multivit')||n.includes('magnes')||n.includes('zinc')||n.includes('ashwag')||n.includes('probio')||n.includes('melatonin'))return sv||60;return sv||30}
 function productName(order){return order?.lift_pedido_productos?.[0]?.nombre||'tu último pedido'}
 function recommendation(c){
   const f=latestFollow(c.id), os=clientOrders(c.id), qs=clientQuotes(c.id), o=os[0], q=qs.find(x=>!['Ganada','No compró'].includes(String(x.estado||'')))||null, today=start(now());
   const debt=os.find(x=>Number(x.saldo_pendiente||0)>0 && x.fecha_vencimiento);
   let due=null,reason='',type='sin_contacto',product=o?productName(o):(f?.interes||'');
   if(debt && start(debt.fecha_vencimiento)<=today){due=today;reason='Cartera vencida · saldo '+money(debt.saldo_pendiente);type='cartera'}
   else if(f?.proximo_seguimiento && !['compro','no_interesado'].includes(f.estado)){due=new Date(f.proximo_seguimiento);reason='Seguimiento programado';type=f.estado||'seguimiento';product=f.interes||product}
   else if(q){due=q.seguimiento_at?new Date(q.seguimiento_at):add(q.fecha,1);reason='Cotización pendiente'+(q.referencia?' · '+q.referencia:'');type='cotizado';product=q.lift_cotizacion_productos?.[0]?.nombre||f?.interes||product}
   else if(o){
     const age=Math.floor((today-start(o.fecha))/day);
     if(age<=3){due=add(o.fecha,2);reason='Postventa · confirmar recepción y experiencia';type='postventa'}
     else {const items=o.lift_pedido_productos||[], estimates=items.map(it=>({it,days:useDays(it)})).sort((a,b)=>a.days-b.days), e=estimates[0]||{it:{nombre:product},days:30};due=add(o.fecha,Math.max(7,e.days-5));product=e.it.nombre||product;reason='Recompra estimada · '+e.days+' días de uso aprox.';type='recompra'}
   } else if(f){due=f.fecha?add(f.fecha,3):today;reason='Retomar conversación';type=f.estado||'seguimiento';product=f.interes||product}
   else {due=today;reason='Cliente sin gestión comercial registrada';type='sin_contacto'}
   const diff=Math.floor((start(due)-today)/day);return {due,reason,type,product,diff,overdue:diff<0,today:diff===0};
 }
 function message(c,r){const name=String(c.nombre||'').trim().split(/\s+/)[0]||'';const p=r.product||'tu producto';if(r.type==='cartera')return `Hola ${name}, ¿cómo estás? Te escribo de Lift Nutrientes para recordarte el saldo pendiente de tu pedido. Si ya realizaste el pago, me compartes el comprobante para actualizarlo. Gracias.`;if(r.type==='cotizado')return `Hola ${name}, ¿cómo estás? Te escribo por la cotización que te envié de ${p}. Quería saber si todavía lo estás buscando o si te ayudo a revisar disponibilidad y entrega.`;if(r.type==='postventa')return `Hola ${name}, ¿cómo te fue con tu pedido de ${p}? Quería confirmar que lo recibiste todo bien y que quedaste conforme con el producto.`;if(r.type==='recompra')return `Hola ${name}, ¿cómo estás? Por la fecha de tu último pedido de ${p}, es posible que ya estés cerca de terminarlo. Te escribo para revisar si necesitas reposición y confirmarte disponibilidad.`;if(r.type==='no_respondio')return `Hola ${name}, paso por acá porque habíamos hablado de ${p}. Si todavía lo estás buscando, te confirmo disponibilidad y entrega. Si ya lo resolviste, tranquilo.`;return `Hola ${name}, ¿cómo estás? Te escribo de Lift Nutrientes${p?' por '+p:''}. Quería saber si todavía lo estás buscando y si te puedo ayudar con disponibilidad o entrega.`}
 function wa(phone,text){let n=String(phone||'').replace(/\D/g,'');if(!n)return '#';if(n.length===10)n='57'+n;return 'https://wa.me/'+n+'?text='+encodeURIComponent(text)}
 async function load(){const j=await call({action:'crm-list'});S.clients=Array.isArray(j.clientes)?j.clientes:[];S.followups=Array.isArray(j.seguimientos)?j.seguimientos:[];S.orders=Array.isArray(j.pedidos)?j.pedidos:[];S.quotes=Array.isArray(j.cotizaciones)?j.cotizaciones:[];S.recs=new Map(S.clients.map(c=>[+c.id,recommendation(c)]));if(!S.clients.length&&S.orders.length)throw new Error('Supabase devolvió pedidos pero no clientes. Recarga el CRM.')}
 function ensureStats(){const browse=$('crmBrowse');if(!browse)return;if(!$('crmSmartStats')){const d=document.createElement('div');d.id='crmSmartStats';d.className='crmSmartStats';browse.insertBefore(d,browse.firstChild)}}
 function counts(){const rs=[...S.recs.values()],today=rs.filter(r=>r.today).length,late=rs.filter(r=>r.overdue).length,rep=rs.filter(r=>r.type==='recompra'&&r.diff<=7).length,quotes=rs.filter(r=>r.type==='cotizado'&&r.diff<=7).length;return {today,late,rep,quotes,clients:S.clients.length,orders:S.orders.length}}
 function render(){ensureStats();const C=counts();$('crmSmartStats').innerHTML=`<div class="crmSmartStat"><b>${C.clients}</b><span>Clientes sincronizados</span></div><div class="crmSmartStat"><b>${C.orders}</b><span>Pedidos sincronizados</span></div><div class="crmSmartStat"><b>${C.today}</b><span>Contactar hoy</span></div><div class="crmSmartStat"><b>${C.late}</b><span>Atrasados</span></div><div class="crmSmartStat"><b>${C.rep}</b><span>Recompra próxima</span></div><div class="crmSmartStat"><b>${C.quotes}</b><span>Cotizaciones activas</span></div>`;
   const tabs=[['hoy','Hoy'],['atrasados','Atrasados'],['recompra','Recompra'],['cotizado','Cotizados'],['cartera','Cartera'],['sin_contacto','Sin gestión'],['todos','Todos']];$('crmTabs').innerHTML=tabs.map(([k,t])=>`<button class="${S.filter===k?'active':''}" onclick="liftCrmSetFilter('${k}')">${t}</button>`).join('');
   const q=norm($('crmSearch')?.value||'');let rows=S.clients.map(c=>({c,r:S.recs.get(+c.id)})).filter(({c,r})=>{if(q&&!norm((c.nombre||'')+' '+(c.celular||'')).includes(q))return false;if(S.filter==='todos')return true;if(S.filter==='hoy')return r.today;if(S.filter==='atrasados')return r.overdue;if(S.filter==='recompra')return r.type==='recompra'&&r.diff<=7;if(S.filter==='cotizado')return r.type==='cotizado';if(S.filter==='cartera')return r.type==='cartera';if(S.filter==='sin_contacto')return r.type==='sin_contacto';return true}).sort((a,b)=>a.r.due-b.r.due);
   $('crmList').innerHTML=rows.map(({c,r})=>{const due=r.overdue?`Atrasado ${Math.abs(r.diff)} d`:r.today?'Contactar hoy':r.diff===1?'Mañana':`En ${r.diff} d`,os=clientOrders(c.id),last=os[0],orderInfo=os.length?`${os.length} pedido${os.length===1?'':'s'} · Último ${fmt(last.fecha)}`:'Sin pedidos guardados';return `<div class="crmCard ${r.overdue?'crmHot':r.today?'crmToday':''}" onclick="liftCrmClient(${c.id})"><div><b>${esc(c.nombre||'Sin nombre')}</b><div class="crmMeta">${esc(c.celular||'')}</div><div class="crmOrderSync">🛒 ${esc(orderInfo)}${last?' · '+esc(productName(last)):''}</div><div class="crmReason">${esc(r.reason)}</div><div class="crmDue ${r.overdue?'overdue':r.today?'today':'future'}">${due} · ${fmt(r.due)}</div></div><span class="crmState smart">${esc(r.type.replace('_',' '))}</span></div>`}).join('')||'<div class="crmStatus">No hay clientes en esta vista.</div>';
 }
 function ensureSmartBox(){if($('crmSmartBox'))return;const fields=$('crmForm')?.querySelector('.crmFields');if(!fields)return;const box=document.createElement('div');box.id='crmSmartBox';box.className='crmSmartBox';fields.insertAdjacentElement('beforebegin',box)}
 function client(id){S.current=S.clients.find(x=>+x.id===+id);if(!S.current)return;const r=S.recs.get(+id),f=latestFollow(id),os=clientOrders(id),last=os[0];$('crmBrowse').style.display='none';$('crmForm').classList.add('open');$('crmClientTitle').textContent=S.current.nombre+' · '+S.current.celular;$('crmEstado').value=f?.estado||'seguimiento';$('crmInteres').value=f?.interes||r.product||'';$('crmValor').value=f?.valor_cotizado||'';$('crmNota').value='';$('crmProximo').value=f?.proximo_seguimiento?(()=>{const d=new Date(f.proximo_seguimiento),pad=n=>String(n).padStart(2,'0');return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`})():'';ensureSmartBox();const msg=message(S.current,r);$('crmSmartBox').innerHTML=`<h4>Próximo contacto recomendado: ${r.overdue?'AHORA':r.today?'HOY':fmt(r.due)}</h4><p><b>Motivo:</b> ${esc(r.reason)}</p><p><b>Producto:</b> ${esc(r.product||'Sin producto identificado')}</p><p><b>Pedidos sincronizados:</b> ${os.length}${last?' · Último '+fmt(last.fecha)+' · '+esc(productName(last)):''}</p><div class="crmQuick"><button onclick="liftCrmQuickDate(1)">+1 día</button><button onclick="liftCrmQuickDate(3)">+3 días</button><button onclick="liftCrmQuickDate(7)">+7 días</button><button onclick="liftCrmQuickDate(30)">+30 días</button></div><textarea id="crmSmartMessage" class="crmMessage">${esc(msg)}</textarea><div class="crmSmartActions"><button class="crmCopyMsg" onclick="liftCrmCopyMessage()">Copiar mensaje</button><a id="crmSmartWa" class="crmWaMsg" target="_blank" href="${wa(S.current.celular,msg)}">Abrir WhatsApp</a></div><div class="crmMini">La fecha de recompra es una estimación según el producto y la presentación. El seguimiento manual siempre tiene prioridad.</div>`;
   const hs=S.followups.filter(x=>+x.cliente_id===+id).sort((a,b)=>new Date(b.fecha)-new Date(a.fecha));$('crmHistory').innerHTML=hs.map(x=>`<div class="crmHistoryRow"><b>${esc(x.estado||'Seguimiento')} · ${new Date(x.fecha).toLocaleString('es-CO')}</b><br>${x.interes?esc(x.interes)+' · ':''}${x.valor_cotizado?money(x.valor_cotizado)+' · ':''}${esc(x.nota||'')}${x.proximo_seguimiento?'<br>Próximo: '+new Date(x.proximo_seguimiento).toLocaleString('es-CO'):''}</div>`).join('')||'<div class="crmHistoryRow">Sin seguimientos todavía.</div>';
 }
 window.liftCrmQuickDate=n=>{const d=add(now(),Number(n));d.setHours(10,0,0,0);const pad=x=>String(x).padStart(2,'0');$('crmProximo').value=`${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`};
 window.liftCrmCopyMessage=async()=>{const t=$('crmSmartMessage')?.value||'';try{await navigator.clipboard.writeText(t)}catch(e){}const a=$('crmSmartWa');if(a&&S.current)a.href=wa(S.current.celular,t);const b=document.querySelector('.crmCopyMsg');if(b){const old=b.textContent;b.textContent='✓ Copiado';setTimeout(()=>b.textContent=old,1200)}};
 window.liftCrmSetFilter=f=>{S.filter=f;render()};window.liftCrmRender=render;window.liftCrmClient=client;
 window.liftCrmBack=function(){$('crmBrowse').style.display='';$('crmForm').classList.remove('open');render()};
 window.liftCrmOpen=async function(){if(!document.body.classList.contains('liftAdminUnlocked'))return;$('liftCrmModal').classList.add('open');$('crmBrowse').style.display='';$('crmForm').classList.remove('open');ensureStats();$('crmSmartStats').innerHTML='<div class="crmSmartStat"><b>…</b><span>Sincronizando Supabase</span></div>';$('crmList').innerHTML='<div class="crmStatus">Cargando clientes, pedidos y seguimientos desde Supabase…</div>';try{await load();S.filter='todos';render()}catch(e){$('crmSmartStats').innerHTML='<div class="crmSmartStat"><b>!</b><span>Error de sincronización</span></div>';$('crmList').innerHTML='<div class="crmStatus">No se pudo sincronizar: '+esc(e.message)+'</div>'}};
 window.liftCrmReload=async function(){await load();if($('liftCrmModal')?.classList.contains('open'))render();return true};
 window.liftCrmSave=async function(){
   if(!S.current){const st=$('crmStatus');if(st)st.textContent='✕ Selecciona un cliente antes de guardar.';return}
   const st=$('crmStatus'),btn=document.querySelector('#crmForm .crmActions .primary');
   if(btn?.dataset.saving==='1')return;
   const raw=$('crmProximo')?.value||'';
   const row={
     cliente_id:S.current.id,
     celular:S.current.celular||'',
     nombre:S.current.nombre||'',
     estado:$('crmEstado')?.value||'seguimiento',
     interes:($('crmInteres')?.value||'').trim(),
     valor_cotizado:Math.max(0,Math.round(Number($('crmValor')?.value||0))),
     nota:($('crmNota')?.value||'').trim(),
     proximo_seguimiento:raw?new Date(raw).toISOString():null
   };
   try{
     if(btn){btn.dataset.saving='1';btn.disabled=true;btn.textContent='Guardando…'}
     if(st)st.textContent='Guardando seguimiento en Supabase…';
     const r=await fetch(SB+'/rest/v1/lift_seguimientos_clientes',{
       method:'POST',
       headers:{apikey:KEY,Authorization:'Bearer '+KEY,'Content-Type':'application/json',Prefer:'return=representation'},
       body:JSON.stringify(row),cache:'no-store'
     });
     const j=await r.json().catch(()=>[]);
     if(!r.ok)throw new Error(j?.message||j?.error||'Supabase rechazó el seguimiento');
     const savedId=Array.isArray(j)?j[0]?.id:null;
     if(!savedId)throw new Error('Supabase no confirmó el seguimiento guardado.');
     await load();
     const saved=S.followups.find(x=>+x.id===+savedId);
     if(!saved)throw new Error('Se guardó el registro, pero crm-list no lo está devolviendo. Revisa la Edge Function lift-clientes.');
     client(S.current.id);
     if(st)st.textContent='✓ Seguimiento guardado en Supabase y cargado en el historial.';
   }catch(e){if(st)st.textContent='✕ No se guardó: '+(e?.message||e);console.error('LIFT CRM save',e)}
   finally{if(btn){btn.dataset.saving='0';btn.disabled=false;btn.textContent='Guardar seguimiento'}}
 };
})();

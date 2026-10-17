
(function(){
 let GROUPS={};
 let active='';
 let liftAttResponsesLoaded=false;
 async function loadAttentionResponses(force=false){
   if(liftAttResponsesLoaded && !force)return true;
   const tabs=$('liftAttTabs'), replies=$('liftAttReplies');
   if(tabs)tabs.innerHTML='<span style="font-size:10px;color:#777">Cargando respuestas…</span>';
   if(replies)replies.innerHTML='';
   try{
     const url='https://vdxkknftyssjyfbdieqa.supabase.co/rest/v1/lift_respuestas_rapidas?select=categoria,mensaje,orden,categoria_orden&activo=eq.true&order=categoria_orden.asc,orden.asc,id.asc';
     const r=await fetch(url,{
       headers:{apikey:'sb_publishable_ECuhXuKIb85kj9fgdEjrAw_O7uNpZsh'},
       cache:'no-store'
     });
     const rows=await r.json().catch(()=>[]);
     if(!r.ok)throw new Error(rows?.message||'No se pudieron cargar las respuestas');
     const next={};
     (Array.isArray(rows)?rows:[]).forEach(row=>{
       const cat=String(row.categoria||'').trim();
       const msg=String(row.mensaje||'').trim();
       if(!cat||!msg)return;
       (next[cat]||(next[cat]=[])).push(msg);
     });
     GROUPS=next;
     const cats=Object.keys(GROUPS);
     if(!cats.length)throw new Error('No hay respuestas activas');
     if(!GROUPS[active])active=cats[0];
     liftAttResponsesLoaded=true;
     render();
     return true;
   }catch(e){
     if(tabs)tabs.innerHTML='<span style="font-size:10px;color:#b42318">No pude cargar las respuestas de Supabase</span>';
     if(replies)replies.innerHTML='';
     return false;
   }
 }
 const $=id=>document.getElementById(id);
 const esc=v=>String(v??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
 const first=()=>String($('liftAttManualName')?.value||'').trim().split(/\s+/)[0]||'';
 let liftAttClientsLoaded=false;
 async function loadClients(){
   const sel=$('liftAttClientSelect'), status=$('liftAttClientStatus');
   if(!sel||liftAttClientsLoaded)return;
   status.textContent='Cargando clientes guardados…';
   try{
     const password=sessionStorage.getItem('liftAdminCloudPasswordV1')||'';
     // crm-list es la misma fuente que usa la agenda A → Z del administrador.
     // A diferencia de "find", no se queda en el pequeño lote de resultados de búsqueda.
     const r=await fetch('https://vdxkknftyssjyfbdieqa.supabase.co/functions/v1/lift-clientes',{
       method:'POST',
       headers:{apikey:'sb_publishable_ECuhXuKIb85kj9fgdEjrAw_O7uNpZsh','Content-Type':'application/json'},
       body:JSON.stringify({action:'crm-list',password}),
       cache:'no-store'
     });
     const j=await r.json().catch(()=>({}));
     if(!r.ok)throw new Error(j.error||'No se pudieron cargar los clientes');
     let clients=Array.isArray(j.clientes)?j.clientes:[];
     clients=clients.filter(c=>String(c.nombre||'').trim()).sort((a,b)=>String(a.nombre).localeCompare(String(b.nombre),'es',{sensitivity:'base'}));
     sel.innerHTML='<option value="">Seleccionar cliente guardado</option>'+clients.map((c,i)=>`<option value="${i}">${esc(c.nombre)}${c.celular?' · '+esc(c.celular):''}</option>`).join('');
     sel._liftClients=clients; liftAttClientsLoaded=true;
     status.textContent=clients.length?clients.length+' clientes disponibles · si no aparece escribe el nombre':'No encontré clientes guardados · puedes escribir el nombre';
   }catch(e){
     status.textContent='No pude cargar clientes · puedes escribir el nombre';
   }
 }
 window.liftAttentionClientSelected=function(v){
   const sel=$('liftAttClientSelect'), list=sel?._liftClients||[], c=list[Number(v)];
   if(c){$('liftAttManualName').value=String(c.nombre||'').trim().split(/\s+/)[0]||''}
   else if(v==='') $('liftAttManualName').value='';
   window.liftAttentionNameChanged();
 };

 function ensure(){
   if($('liftAttentionCheckout'))return $('liftAttentionCheckout');
   const tools=$('liftAdminCheckoutTools'); if(!tools)return null;
   const box=document.createElement('div');box.id='liftAttentionCheckout';
   box.innerHTML=`<div class="liftAttTitle"><div><b>💬 Atención rápida</b><small id="liftAttNameHint"></small></div><small>toca una respuesta y copia</small></div>
<div class="liftAttClientPick">
<label>Cliente</label>
<div class="liftAttClientRow">
<select id="liftAttClientSelect" onchange="liftAttentionClientSelected(this.value)"><option value="">Seleccionar cliente guardado</option></select>
<input id="liftAttManualName" autocomplete="off" placeholder="O escribe el nombre" oninput="liftAttentionNameChanged()">
</div>
<small id="liftAttClientStatus">Puedes seleccionar un cliente viejo o escribir un nombre si no aparece</small>
</div>
<div class="liftAttResult"><textarea id="liftAttText" placeholder="Selecciona una respuesta"></textarea><button id="liftAttCopy" type="button" onclick="liftCopyAttentionText()">Copiar mensaje</button></div><div class="liftAttSearchWrap"><input id="liftAttSearch" type="search" placeholder="🔎 Buscar respuestas: envío, pago, gracias..." aria-label="Buscar respuestas rápidas" oninput="liftAttentionSearchChanged(this.value)"><span id="liftAttSearchCount" aria-live="polite"></span></div><div id="liftAttTabs" class="liftAttTabs"></div><div id="liftAttReplies" class="liftAttReplies"></div>`;
   tools.insertAdjacentElement('afterend',box);return box;
 }
 function normalizeAtt(v){return String(v||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLocaleLowerCase('es').trim()}
 let attQuery='';
 let selectedAttentionTemplate=null;
 function attentionMessage(template){
   const n=first();
   let msg=String(template||'').replace(/\{(?:name|nombre)\}/gi,n).replace(/\s+/g,' ').trim();
   if(n && !/\{(?:name|nombre)\}/i.test(template)){
     const casual=/^(hola|qué más|que más|buenos días|buenas tardes|buenas noches)/i.test(msg);
     msg=casual?msg.replace(/^((?:hola|qué más|que más|buenos días|buenas tardes|buenas noches)\b)/i,'$1 '+n):n+' '+msg.charAt(0).toLowerCase()+msg.slice(1);
   }
   return msg;
 }
 window.liftAttentionSearchChanged=function(v){attQuery=String(v||'').trim();render()};
 function render(){
   const box=ensure();if(!box)return;
   $('liftAttNameHint').textContent=first()?' · '+first():' · escribe el nombre arriba';
   const cats=Object.keys(GROUPS), searching=!!attQuery, q=normalizeAtt(attQuery);
   $('liftAttTabs').innerHTML=cats.length?cats.map(k=>`<button type="button" data-lat="${esc(k)}" class="${k===active?'on':''}">${esc(k)}</button>`).join(''):'<span>Cargando respuestas…</span>';
   const matches=searching?cats.flatMap(cat=>(GROUPS[cat]||[]).map((t,i)=>({t,i,cat})).filter(x=>normalizeAtt(x.t+' '+cat).includes(q))):(GROUPS[active]||[]).map((t,i)=>({t,i,cat:active}));
   $('liftAttReplies').innerHTML=matches.length?matches.map(x=>`<button type="button" class="liftAttReply" data-lar="${x.i}" data-lar-cat="${esc(x.cat)}">${searching?`<span class="liftAttReplyCategory">${esc(x.cat)}</span>`:''}${esc(x.t.replace(/\{(?:name|nombre)\}/gi,'nombre'))}</button>`).join(''):'<div class="liftAttNoResults">No encontré respuestas con esa búsqueda.</div>';
   const count=$('liftAttSearchCount');if(count)count.textContent=searching?matches.length+' resultado'+(matches.length===1?'':'s'):'';
 }
 window.liftToggleAttentionCheckout=function(btn){
   if(!document.body.classList.contains('liftAdminUnlocked'))return;
   const box=ensure();if(!box)return;
   const opening=!box.classList.contains('open');
   document.querySelectorAll('.liftAdminToolsRow button').forEach(x=>x.classList.remove('on'));
   document.getElementById('liftRecurringClientBox')?.classList.remove('liftClientBoxOpen');
   const order=$('liftOrderFold'),shipping=$('liftShippingFold');if(order)order.hidden=true;if(shipping)shipping.hidden=true;
   box.classList.toggle('open',opening);if(opening){btn?.classList.add('on');render();loadClients();loadAttentionResponses(true)}
 };
 window.liftCopyAttentionText=async function(){
   const t=$('liftAttText')?.value.trim()||'';if(!t)return alert('Primero elige una respuesta.');
   try{await navigator.clipboard.writeText(t);const b=$('liftAttCopy');b.textContent='✓ Copiado';b.classList.add('copied');setTimeout(()=>{b.textContent='Copiar mensaje';b.classList.remove('copied')},1200)}
   catch(e){window.prompt('Copia el mensaje:',t)}
 };
 document.addEventListener('click',e=>{
   const tab=e.target.closest?.('[data-lat]');if(tab){active=tab.dataset.lat;render();return}
   const rep=e.target.closest?.('[data-lar]');if(rep){
     const template=(GROUPS[rep.dataset.larCat||active]||[])[Number(rep.dataset.lar)]||'';
     selectedAttentionTemplate=template;
     const msg=attentionMessage(template);
     $('liftAttText').value=msg;
     document.querySelectorAll('.liftAttReply').forEach(x=>x.classList.remove('on'));rep.classList.add('on');
   }
 });
 window.liftAttentionNameChanged=function(){
   const input=$('liftAttManualName'),sel=$('liftAttClientSelect');
   if(input && sel && input.value.trim()){
     const chosen=(sel._liftClients||[])[Number(sel.value)];
     if(sel.value!=='' && (!chosen || chosen.nombre.trim().split(/\s+/)[0].toLocaleLowerCase('es')!==first().toLocaleLowerCase('es')))sel.value='';
   }
   render();
   if(selectedAttentionTemplate!==null)$('liftAttText').value=attentionMessage(selectedAttentionTemplate);
 };
})();

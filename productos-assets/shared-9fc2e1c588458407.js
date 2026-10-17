
(function(){
 const SB_URL='https://vdxkknftyssjyfbdieqa.supabase.co';
 const SB_KEY='sb_publishable_ECuhXuKIb85kj9fgdEjrAw_O7uNpZsh';
 const FN=SB_URL+'/functions/v1/lift-clientes';
 const PASS_KEY='liftAdminCloudPasswordV1';
 const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const pass=()=>{try{return sessionStorage.getItem(PASS_KEY)||''}catch(e){return ''}};
 async function call(payload){const r=await fetch(FN,{method:'POST',headers:{'apikey':SB_KEY,'Content-Type':'application/json'},body:JSON.stringify({...payload,password:pass()})});const j=await r.json().catch(()=>({}));if(!r.ok)throw new Error(j.error||'No se pudo consultar clientes');return j}
 window.liftFindClient=async function(){
   if(!document.body.classList.contains('liftAdminUnlocked'))return;
   const q=document.getElementById('liftClientSearch')?.value.trim()||'', box=document.getElementById('liftClientResults');if(!box)return;
   if(q.length<2){box.innerHTML='<div class="liftClientEmpty">Escribe un nombre o celular.</div>';return}
   box.innerHTML='<div class="liftClientEmpty">Buscando…</div>';
   try{const j=await call({action:'find',q});const cs=j.clientes||[];if(!cs.length){box.innerHTML='<div class="liftClientEmpty">No encontré ese cliente.</div>';return}
     box.innerHTML=cs.map(c=>`<div class="liftClientResult"><div class="liftClientResultHead"><b>${esc(c.nombre)}</b><span>${esc(c.celular)}</span></div>${(c.lift_direcciones_cliente||[]).sort((a,b)=>Number(b.predeterminada)-Number(a.predeterminada)).map(d=>`<button type="button" class="liftClientAddress" data-client='${esc(JSON.stringify({nombre:c.nombre,celular:c.celular,...d}))}'>${d.predeterminada?'★ ':''}${esc(d.etiqueta||'Dirección')}: ${esc(d.direccion)} · ${esc(d.ciudad)}${d.departamento?' · '+esc(d.departamento):''}</button>`).join('')}</div>`).join('');
     box.querySelectorAll('.liftClientAddress').forEach(b=>b.onclick=()=>{const d=JSON.parse(b.dataset.client);document.getElementById('coName').value=d.nombre||'';document.getElementById('coPhone').value=d.celular||'';document.getElementById('coAddress').value=d.direccion||'';if(document.getElementById('coNotes')&&!document.getElementById('coNotes').value)document.getElementById('coNotes').value=d.notas||'';const city=document.getElementById('coCity');if(city){city.value=d.ciudad+(d.departamento?' · '+d.departamento:'');}if(typeof selectedCity!=='undefined'){selectedCity={name:d.ciudad,department:d.departamento||''};}if(typeof renderCheckoutSummary==='function')renderCheckoutSummary();box.innerHTML='<div class="liftClientEmpty">✓ Datos cargados</div>';});
   }catch(e){box.innerHTML='<div class="liftClientEmpty">'+esc(e.message)+'</div>'}
 };
 window.liftSaveRecurringClient=async function(){
   if(!document.body.classList.contains('liftAdminUnlocked'))return true;
   const nombre=document.getElementById('coName')?.value.trim()||'',celular=document.getElementById('coPhone')?.value.trim()||'',whatsapp_usuario=document.getElementById('coWhatsappUser')?.value.trim()||'',direccion=document.getElementById('coAddress')?.value.trim()||'',notas=document.getElementById('coNotes')?.value.trim()||'';
   if(!nombre||!celular||!direccion||typeof selectedCity==='undefined'||!selectedCity)return true;
   try{await call({action:'save',nombre,celular,direccion,ciudad:selectedCity.name||'',departamento:selectedCity.department||'',notas});return true}catch(e){console.error('Cliente recurrente:',e);return true}
 };
 document.addEventListener('DOMContentLoaded',()=>{const i=document.getElementById('liftClientSearch');if(i)i.addEventListener('keydown',e=>{if(e.key==='Enter'){e.preventDefault();liftFindClient()}})});
 // Guarda/actualiza el cliente al ejecutar cualquiera de las dos acciones de checkout administrativo.
 const install=()=>{
   const wp=window.finishCheckout;if(typeof wp==='function'&&!wp.__liftClientWrapped){const f=async function(){if(document.body.classList.contains('liftAdminUnlocked'))await window.liftSaveRecurringClient();return wp.apply(this,arguments)};f.__liftClientWrapped=true;window.finishCheckout=f}
   const pr=window.finishProviderCheckout;if(typeof pr==='function'&&!pr.__liftClientWrapped){const f=async function(){await window.liftSaveRecurringClient();return pr.apply(this,arguments)};f.__liftClientWrapped=true;window.finishProviderCheckout=f}
 };
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install);else install();
})();

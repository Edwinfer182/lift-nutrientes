
(function(){
 const SB='https://vdxkknftyssjyfbdieqa.supabase.co', KEY='sb_publishable_ECuhXuKIb85kj9fgdEjrAw_O7uNpZsh';
 const H={apikey:KEY,Authorization:'Bearer '+KEY,'Content-Type':'application/json',Prefer:'return=representation'};
 let clients=[],followups=[],filter='todos',current=null;
 const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const money=v=>'$ '+Number(v||0).toLocaleString('es-CO');
 async function api(path,opt={}){const r=await fetch(SB+'/rest/v1/'+path,{...opt,headers:{...H,...(opt.headers||{})},cache:'no-store'});const j=await r.json().catch(()=>[]);if(!r.ok)throw new Error(j.message||j.error||'Error Supabase');return j}
 function latest(id){return followups.filter(x=>Number(x.cliente_id)===Number(id)).sort((a,b)=>new Date(b.fecha)-new Date(a.fecha))[0]||null}
 function today(d){if(!d)return false;const x=new Date(d),n=new Date();return x.getFullYear()===n.getFullYear()&&x.getMonth()===n.getMonth()&&x.getDate()===n.getDate()}
 function label(s){return ({nuevo:'Nuevo',pregunto:'Preguntó',cotizado:'Cotizado',seguimiento:'Seguimiento',compro:'Compró',no_respondio:'No respondió',no_interesado:'No interesado',recompra:'Recompra'})[s]||'Nuevo'}
 async function load(){
   const password=sessionStorage.getItem('liftAdminCloudPasswordV1')||'';
   const r=await fetch(SB+'/functions/v1/lift-clientes',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action:'crm-list',password})});
   const j=await r.json().catch(()=>({}));
   if(!r.ok||!j.ok)throw new Error(j.error||'No se pudo cargar seguimiento');
   clients=Array.isArray(j.clientes)?j.clientes:[];
   followups=Array.isArray(j.seguimientos)?j.seguimientos:[];
 }
 window.liftCrmReload=async function(){await load();if(document.getElementById('liftCrmModal')?.classList.contains('open'))liftCrmRender();return true};
 window.liftCrmOpen=async function(){if(!document.body.classList.contains('liftAdminUnlocked'))return;document.getElementById('liftCrmModal').classList.add('open');document.getElementById('crmBrowse').style.display='';document.getElementById('crmForm').classList.remove('open');try{await load();liftCrmRender()}catch(e){document.getElementById('crmList').innerHTML='<div class="crmStatus">'+esc(e.message)+'</div>'}};
 window.liftCrmClose=()=>document.getElementById('liftCrmModal').classList.remove('open');
 window.liftCrmBack=function(){document.getElementById('crmBrowse').style.display='';document.getElementById('crmForm').classList.remove('open');liftCrmRender()};
 window.liftCrmSetFilter=function(f){filter=f;liftCrmRender()};
 window.liftCrmRender=function(){
   const tabs=[['hoy','Hoy'],['pendientes','Pendientes'],['cotizado','Cotizados'],['no_respondio','No respondieron'],['recompra','Recompra'],['todos','Todos']];
   document.getElementById('crmTabs').innerHTML=tabs.map(([k,t])=>`<button class="${filter===k?'active':''}" onclick="liftCrmSetFilter('${k}')">${t}</button>`).join('');
   const q=(document.getElementById('crmSearch')?.value||'').toLowerCase().trim(), now=new Date();
   let rows=clients.map(c=>({c,s:latest(c.id)})).filter(({c,s})=>{
     if(q&&!((c.nombre||'').toLowerCase().includes(q)||(c.celular||'').includes(q)))return false;
     if(filter==='todos')return true;
     if(filter==='hoy')return s&&s.proximo_seguimiento&&new Date(s.proximo_seguimiento)<=new Date(new Date().setHours(23,59,59,999))&&!['compro','no_interesado'].includes(s.estado);
     if(filter==='pendientes')return s&&s.proximo_seguimiento&&new Date(s.proximo_seguimiento)<=now&&!['compro','no_interesado'].includes(s.estado);
     return s&&s.estado===filter;
   });
   document.getElementById('crmList').innerHTML=rows.map(({c,s})=>`<div class="crmCard" onclick="liftCrmClient(${c.id})"><div><b>${esc(c.nombre)}</b><div class="crmMeta">${esc(c.celular)}${s?.interes?' · '+esc(s.interes):''}${s?.proximo_seguimiento?' · Próx. '+new Date(s.proximo_seguimiento).toLocaleString('es-CO',{dateStyle:'short',timeStyle:'short'}):''}</div></div><span class="crmState">${label(s?.estado)}</span></div>`).join('')||'<div class="crmStatus">No hay clientes en esta vista.</div>';
 };
 window.liftCrmClient=function(id){
   current=clients.find(x=>Number(x.id)===Number(id));if(!current)return;const s=latest(id);
   document.getElementById('crmBrowse').style.display='none';document.getElementById('crmForm').classList.add('open');document.getElementById('crmClientTitle').textContent=current.nombre+' · '+current.celular;
   document.getElementById('crmEstado').value=s?.estado||'nuevo';document.getElementById('crmInteres').value=s?.interes||'';document.getElementById('crmValor').value=s?.valor_cotizado||'';document.getElementById('crmNota').value='';document.getElementById('crmProximo').value=s?.proximo_seguimiento?(()=>{const d=new Date(s.proximo_seguimiento),z=n=>String(n).padStart(2,'0');return d.getFullYear()+'-'+z(d.getMonth()+1)+'-'+z(d.getDate())+'T'+z(d.getHours())+':'+z(d.getMinutes())})():'';
   {let n=String(current.celular||'').replace(/\D/g,'');if(n.length===10)n='57'+n;document.getElementById('crmWhatsapp').href=n?'https://wa.me/'+n:'#';}
   const hs=followups.filter(x=>Number(x.cliente_id)===Number(id)).sort((a,b)=>new Date(b.fecha)-new Date(a.fecha));
   document.getElementById('crmHistory').innerHTML=hs.map(x=>`<div class="crmHistoryRow"><b>${label(x.estado)} · ${new Date(x.fecha).toLocaleString('es-CO')}</b><br>${x.interes?esc(x.interes)+' · ':''}${x.valor_cotizado?money(x.valor_cotizado)+' · ':''}${esc(x.nota||'')}${x.proximo_seguimiento?'<br>Próximo: '+new Date(x.proximo_seguimiento).toLocaleString('es-CO'):''}</div>`).join('')||'<div class="crmHistoryRow">Sin seguimientos todavía.</div>';
 };
 window.liftCrmSave=async function(){
   if(!current)return;
   const st=document.getElementById('crmStatus'),btn=document.querySelector('#crmForm .crmActions .primary');
   if(btn?.dataset.saving==='1')return;
   const raw=document.getElementById('crmProximo').value;
   const row={cliente_id:current.id,celular:current.celular||'',nombre:current.nombre||'',estado:document.getElementById('crmEstado').value,interes:document.getElementById('crmInteres').value.trim(),valor_cotizado:Math.max(0,Math.round(Number(document.getElementById('crmValor').value||0))),nota:document.getElementById('crmNota').value.trim(),proximo_seguimiento:raw?new Date(raw).toISOString():null};
   try{
     if(btn){btn.dataset.saving='1';btn.disabled=true;btn.textContent='Guardando…'}
     st.textContent='Guardando en Supabase…';
     const j=await (async()=>{const r=await fetch('https://vdxkknftyssjyfbdieqa.supabase.co/functions/v1/lift-clientes',{method:'POST',headers:{apikey:'sb_publishable_ECuhXuKIb85kj9fgdEjrAw_O7uNpZsh','Content-Type':'application/json'},body:JSON.stringify({action:'crm-save',password:sessionStorage.getItem('liftAdminCloudPasswordV1')||'',cliente_id:row.cliente_id,estado:row.estado,interes:row.interes,valor_cotizado:row.valor_cotizado,nota:row.nota,proximo_seguimiento:row.proximo_seguimiento}),cache:'no-store'});const x=await r.json().catch(()=>({}));if(!r.ok||!x.ok)throw new Error(x.error||x.message||'Supabase rechazó el seguimiento');return [x.seguimiento]})();
     if(!Array.isArray(j)||!j[0]?.id)throw new Error('Supabase no confirmó el seguimiento.');
     await load();
     const saved=followups.find(x=>Number(x.id)===Number(j[0].id));
     if(!saved)throw new Error('Se recibió respuesta, pero el seguimiento no apareció al volver a consultar Supabase.');
     liftCrmClient(current.id);
     st.textContent='✓ Seguimiento guardado en Supabase y visible en el historial.';
   }catch(e){st.textContent='✕ No se guardó: '+(e.message||e)}
   finally{if(btn){btn.dataset.saving='0';btn.disabled=false;btn.textContent='Guardar seguimiento'}}
 };
 function inject(){
   let b=document.getElementById('liftCrmBtn');
   if(!b){
     const row=document.querySelector('.liftAdminToolsRow');
     if(row){b=document.createElement('button');b.id='liftCrmBtn';b.type='button';b.textContent='CRM · Seguimiento clientes';b.onclick=()=>window.liftCrmOpen();row.appendChild(b);}
   }
   if(!document.getElementById('liftCrmFloatingBtn')){
     const f=document.createElement('button');f.id='liftCrmFloatingBtn';f.type='button';f.textContent='CRM · Clientes';f.onclick=()=>window.liftCrmOpen();document.body.appendChild(f);
   }
 }
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(inject,800));else setTimeout(inject,800);new MutationObserver(inject).observe(document.body,{childList:true,subtree:true});
})();

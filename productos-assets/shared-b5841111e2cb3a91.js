
(function(){
 const FN='https://vdxkknftyssjyfbdieqa.supabase.co/functions/v1/lift-clientes',KEY='sb_publishable_ECuhXuKIb85kj9fgdEjrAw_O7uNpZsh',PASS='liftAdminCloudPasswordV1';
 const $=id=>document.getElementById(id),esc=v=>String(v??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
 const pass=()=>{try{return sessionStorage.getItem(PASS)||''}catch(e){return ''}};
 const norm=v=>String(v||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
 async function api(payload){const r=await fetch(FN,{method:'POST',headers:{apikey:KEY,'Content-Type':'application/json'},body:JSON.stringify({...payload,password:pass()})});const j=await r.json().catch(()=>({}));if(!r.ok)throw new Error(j.error||'No se pudieron cargar los clientes');return j}
 function addButtons(){
   const search=document.querySelector('#liftOrdersHistory .liftOrderSearch');
   if(search&&!search.querySelector('.liftOrdersNewClientBtn')){const b=document.createElement('button');b.type='button';b.className='liftOrdersNewClientBtn';b.textContent='+ Nuevo cliente';b.onclick=()=>window.liftOpenNewClientDirectory?.();search.appendChild(b)}
   const lookup=document.querySelector('#liftOrdersOld .liftOldClientLookup');
   if(lookup&&!lookup.querySelector('.liftOldClientActions')){const w=document.createElement('div');w.className='liftOldClientActions';w.innerHTML='<button type="button" class="liftOldNewClientBtn">+ Nuevo cliente</button>';w.querySelector('button').onclick=()=>window.liftOpenNewClientDirectory?.();lookup.appendChild(w)}
 }
 window.liftLoadAlphabeticalClients=async function(){
   const box=$('liftOrderResults');if(!box)return;
   const q=norm($('liftOrderClientSearch')?.value||'');
   box.innerHTML='<div class="liftAlphaEmpty">Cargando clientes…</div>';
   try{
     const j=await api({action:'crm-list'});let clients=Array.isArray(j.clientes)?j.clientes:[];
     clients=clients.filter(c=>{const ds=(c.lift_direcciones_cliente||[]).map(d=>[d.direccion,d.ciudad,d.departamento,d.etiqueta].join(' ')).join(' ');return !q||norm([c.nombre,c.celular,ds].join(' ')).includes(q)}).sort((a,b)=>String(a.nombre||'').localeCompare(String(b.nombre||''),'es',{sensitivity:'base'}));
     if(!clients.length){box.innerHTML='<div class="liftAlphaEmpty">No encontré clientes.</div>';return}
     box.innerHTML='<div class="liftAlphaHead"><b>Clientes A → Z</b><small>'+clients.length+' cliente'+(clients.length===1?'':'s')+'</small></div><div class="liftAlphaClients">'+clients.map(c=>{const ds=Array.isArray(c.lift_direcciones_cliente)?c.lift_direcciones_cliente:[],ad=ds.slice().sort((a,b)=>Number(b.predeterminada)-Number(a.predeterminada))[0]||{};return '<button type="button" class="liftAlphaClient" data-client-id="'+Number(c.id)+'" data-client-name="'+esc(c.nombre||'')+'"><span><span class="liftAlphaClientName">'+esc(c.nombre||'Sin nombre')+'</span><span class="liftAlphaClientMeta">'+esc(c.celular||'Sin celular')+(ad.ciudad?' · '+esc(ad.ciudad):'')+'</span></span><span class="liftAlphaArrow">›</span></button>'}).join('')+'</div>';
     box.querySelectorAll('.liftAlphaClient').forEach(b=>b.addEventListener('click',()=>window.liftLoadClientOrders?.(Number(b.dataset.clientId),b.dataset.clientName||'')));
   }catch(e){box.innerHTML='<div class="liftAlphaEmpty">'+esc(e.message)+'</div>'}
 };
 window.liftSearchOrderClients=window.liftLoadAlphabeticalClients;
 function bind(){addButtons();const inp=$('liftOrderClientSearch');if(inp&&!inp.dataset.unifiedClientSearch){inp.dataset.unifiedClientSearch='1';let t;inp.addEventListener('input',()=>{clearTimeout(t);t=setTimeout(window.liftLoadAlphabeticalClients,180)});inp.addEventListener('keydown',e=>{if(e.key==='Enter'){e.preventDefault();window.liftLoadAlphabeticalClients()}})}}
 const oldTab=window.liftOrdersTab;window.liftOrdersTab=function(tab){const r=typeof oldTab==='function'?oldTab.apply(this,arguments):undefined;bind();if(tab==='history')setTimeout(window.liftLoadAlphabeticalClients,0);return r};
 const oldOpen=window.liftOpenOrders;window.liftOpenOrders=function(){const r=typeof oldOpen==='function'?oldOpen.apply(this,arguments):undefined;bind();setTimeout(window.liftLoadAlphabeticalClients,0);return r};
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',bind);else bind();
})();

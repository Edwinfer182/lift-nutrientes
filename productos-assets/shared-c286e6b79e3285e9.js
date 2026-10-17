
(function(){
 const FN='https://vdxkknftyssjyfbdieqa.supabase.co/functions/v1/lift-clientes',KEY='sb_publishable_ECuhXuKIb85kj9fgdEjrAw_O7uNpZsh',PASS='liftAdminCloudPasswordV1';
 const $=id=>document.getElementById(id),esc=v=>String(v??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
 const pass=()=>{try{return sessionStorage.getItem(PASS)||''}catch(e){return ''}};
 async function call(payload){const r=await fetch(FN,{method:'POST',headers:{apikey:KEY,'Content-Type':'application/json'},body:JSON.stringify({...payload,password:pass()})});const j=await r.json().catch(()=>({}));if(!r.ok)throw new Error(j.error||'No se pudieron cargar los clientes');return j}
 function normalize(v){return String(v||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLocaleLowerCase('es')}
 window.liftLoadAlphabeticalClients=async function(){
   const box=$('liftOrderResults'); if(!box)return;
   box.innerHTML='<div class="liftAlphaEmpty">Cargando clientes…</div>';
   try{
     const j=await call({action:'crm-list'});
     let clients=Array.isArray(j.clientes)?j.clientes:[];
     clients.sort((a,b)=>normalize(a.nombre).localeCompare(normalize(b.nombre),'es',{sensitivity:'base'}));
     if(!clients.length){box.innerHTML='<div class="liftAlphaEmpty">No hay clientes guardados.</div>';return}
     box.innerHTML='<div class="liftAlphaHead"><b>Clientes A → Z</b><small>'+clients.length+' clientes</small></div><div class="liftAlphaClients">'+clients.map(c=>{const ds=Array.isArray(c.lift_direcciones_cliente)?c.lift_direcciones_cliente:[];const ad=ds.slice().sort((a,b)=>Number(b.predeterminada)-Number(a.predeterminada))[0];return '<button class="liftAlphaClient" onclick="liftLoadClientOrders('+Number(c.id)+','+JSON.stringify(String(c.nombre||'')).replace(/</g,'\\u003c')+')"><span><span class="liftAlphaClientName">'+esc(c.nombre||'Sin nombre')+'</span><span class="liftAlphaClientMeta">'+esc(c.celular||'Sin celular')+(ad&&ad.ciudad?' · '+esc(ad.ciudad):'')+'</span></span><span class="liftAlphaArrow">›</span></button>'}).join('')+'</div>';
   }catch(e){box.innerHTML='<div class="liftAlphaEmpty">'+esc(e.message)+'</div>'}
 };
 window.liftSearchOrderClients=function(){return window.liftLoadAlphabeticalClients()};
 const prevTab=window.liftOrdersTab;
 window.liftOrdersTab=function(tab){const r=typeof prevTab==='function'?prevTab.apply(this,arguments):undefined;if(tab==='history')setTimeout(window.liftLoadAlphabeticalClients,0);return r};
 const prevOpen=window.liftOpenOrders;
 window.liftOpenOrders=function(){const r=typeof prevOpen==='function'?prevOpen.apply(this,arguments):undefined;return r};
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(()=>{if($('liftOrdersHistory')?.classList.contains('active'))window.liftLoadAlphabeticalClients()},0));
})();

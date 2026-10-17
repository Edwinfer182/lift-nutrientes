
(function(){
 const SB='https://vdxkknftyssjyfbdieqa.supabase.co';
 const KEY='sb_publishable_ECuhXuKIb85kj9fgdEjrAw_O7uNpZsh';
 const FN=SB+'/functions/v1/lift-proveedores', PASS_KEY='liftAdminCloudPasswordV1';
 const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const money=v=>'$ '+Math.abs(Number(v||0)).toLocaleString('es-CO');
 const pass=()=>{try{return sessionStorage.getItem(PASS_KEY)||''}catch(e){return ''}};
 async function call(payload){
   const r=await fetch(FN,{method:'POST',headers:{apikey:KEY,'Content-Type':'application/json'},body:JSON.stringify({...payload,password:pass()})});
   const j=await r.json().catch(()=>({}));
   if(!r.ok)throw new Error(j.error||'No se pudo consultar proveedores');
   return j;
 }
 let cache={proveedores:[],movimientos:[]};
 function signed(m){
   const v=Number(m.valor||0);
   if(m.tipo==='compra_credito'||m.tipo==='ajuste_deuda')return v;
   if(m.tipo==='pago_proveedor'||m.tipo==='ajuste_favor')return -v;
   if(m.tipo==='efectivo_cobrado')return Number(m.costo_proveedor||0)-Number(m.valor_cobrado||0);
   return 0;
 }
 function renderOverview(){
   const root=document.getElementById('lpwOverview');if(!root)return;
   const providers=cache.proveedores||[],movements=cache.movimientos||[];
   const items=providers.map(p=>{
     const ms=movements.filter(m=>Number(m.proveedor_id)===Number(p.id));
     const balance=Number(p.balance??ms.reduce((sum,m)=>sum+signed(m),0));
     return {...p,balance:Number.isFinite(balance)?balance:0};
   });
   const owed=items.reduce((sum,p)=>sum+Math.max(0,p.balance),0);
   const favor=items.reduce((sum,p)=>sum+Math.max(0,-p.balance),0);
   const current=Number(document.getElementById('lpwProvider')?.value||0);
   root.innerHTML=`<div class="lpwOverviewTotals"><div class="lpwStat"><small>Total global que debes</small><strong>${money(owed)}</strong></div><div class="lpwStat"><small>Total a favor</small><strong>${money(favor)}</strong></div><div class="lpwStat"><small>Saldo neto global</small><strong>${owed>=favor?'':'−'}${money(Math.abs(owed-favor))}</strong></div></div><div style="font-size:12px;font-weight:600">Saldo por proveedor</div><div class="lpwProviderSummary">${items.map(p=>`<button type="button" class="lpwProviderTile ${Number(p.id)===current?'active':''}" data-provider-id="${Number(p.id)}"><span>${esc(p.nombre)}</span><b>${money(p.balance)}</b><small>${p.balance>0?'Debes':p.balance<0?'A favor':'Cuenta en cero'}</small></button>`).join('')||'<span style="font-size:11px;color:#777">No hay proveedores registrados.</span>'}</div>`;
   root.querySelectorAll('[data-provider-id]').forEach(btn=>btn.addEventListener('click',()=>{document.getElementById('lpwProvider').value=btn.dataset.providerId;renderProvider()}));
 }
 function renderProvider(){
   renderOverview();
   const id=Number(document.getElementById('lpwProvider')?.value||0);
   const p=cache.proveedores.find(x=>Number(x.id)===id);
   const ms=cache.movimientos.filter(x=>Number(x.proveedor_id)===id);
   const balance=Number(p?.balance ?? ms.reduce((a,m)=>a+signed(m),0));
   const b=document.getElementById('lpwBalance');
   b.innerHTML=balance>0?`<small>Debes al proveedor</small>${money(balance)}`:balance<0?`<small>Saldo a favor</small>${money(balance)}`:`<small>Saldo</small>$ 0`;
   document.getElementById('lpwList').innerHTML=ms.map(m=>{
     const s=signed(m), label=m.tipo==='compra_credito'?'Deuda':m.tipo==='pago_proveedor'?'Pago':m.tipo==='ajuste_favor'?'Saldo a favor':m.tipo==='ajuste_deuda'?'Ajuste deuda':'Efectivo cobrado';
     return `<div class="lpwRow"><div><b>${esc(label)}</b><br>${esc((m.referencia||'')+(m.nota?' · '+m.nota:''))}</div><div>${s>0?'+':'−'} ${money(Math.abs(s||m.valor||0))}</div></div>`
   }).join('')||'<div class="lpwRow">Sin movimientos.</div>';
 }
 async function refresh(keep=true){
   const sel=document.getElementById('lpwProvider'), previous=keep?sel.value:'';
   const j=await call({action:'providers'});cache=j;
   sel.innerHTML=(j.proveedores||[]).map(p=>`<option value="${p.id}">${esc(p.nombre)}</option>`).join('');
   if(previous&&[...sel.options].some(o=>o.value===previous))sel.value=previous;
   renderProvider();
 }
 window.liftProviderWalletOpen=async function(){
   if(!document.body.classList.contains('liftAdminUnlocked'))return;
   document.getElementById('liftProviderWalletModal').classList.add('open');
   const st=document.getElementById('lpwStatus');st.textContent='Cargando proveedores…';
   try{await refresh(false);st.textContent=''}catch(e){st.textContent=e.message}
 };
 window.liftProviderWalletClose=()=>document.getElementById('liftProviderWalletModal').classList.remove('open');
 window.liftProviderWalletLoad=renderProvider;
 window.liftProviderWalletShowFavor=function(show){
   const panel=document.getElementById('lpwFavorPanel');
   panel.hidden=show===undefined?!panel.hidden:!show;
   if(!panel.hidden){document.getElementById('lpwFavorCost').focus();window.liftProviderWalletFavorCalc()}
 };
 window.liftProviderWalletFavorCalc=function(){
   const a=Number(document.getElementById('lpwFavorCost').value||0);
   const b=Number(document.getElementById('lpwFavorCash').value||0);
   const result=document.getElementById('lpwFavorResult');
   const saldo=b-a;
   result.textContent='Saldo a favor: '+money(Math.max(0,saldo));
   result.style.color=saldo>0?'#168451':'#111';
 };
 window.liftProviderWalletFavorSave=async function(){
   const proveedor_id=Number(document.getElementById('lpwProvider').value);
   const costEl=document.getElementById('lpwFavorCost'),cashEl=document.getElementById('lpwFavorCash');
   const a=Number(costEl.value),b=Number(cashEl.value);
   const st=document.getElementById('lpwStatus');
   if(!proveedor_id){st.textContent='Selecciona un proveedor.';return}
   if(costEl.value===''||cashEl.value===''||!Number.isFinite(a)||!Number.isFinite(b)||a<0||b<0){st.textContent='Revisa los dos valores.';return}
   const valor=Math.round(b-a);
   if(valor<=0){st.textContent='El efectivo pagado por el cliente debe ser mayor que lo que cobra el proveedor para generar saldo a favor.';return}
   const referencia=document.getElementById('lpwReference').value.trim(),nota=document.getElementById('lpwNote').value.trim();
   st.textContent='Guardando saldo a favor…';
   try{
     await call({action:'provider-movement',proveedor_id,tipo:'ajuste_favor',valor,referencia,nota});
     costEl.value='';cashEl.value='';document.getElementById('lpwReference').value='';document.getElementById('lpwNote').value='';
     window.liftProviderWalletShowFavor(false);
     await refresh(true);
     st.textContent='✓ Saldo a favor registrado: '+money(valor)+'.';
   }catch(e){st.textContent='No se pudo registrar: '+e.message}
 };
 window.liftProviderWalletAdd=async function(kind){
   const proveedor_id=Number(document.getElementById('lpwProvider').value);
   const valueEl=document.getElementById('lpwValue');
   let valor=Math.round(Number(valueEl.value||0));
   const referencia=document.getElementById('lpwReference').value.trim(),nota=document.getElementById('lpwNote').value.trim(),st=document.getElementById('lpwStatus');
   if(!proveedor_id){st.textContent='Selecciona un proveedor.';return}
   const tipo=kind==='compra_credito'?'compra_credito':kind==='saldo_favor'?'ajuste_favor':'pago_proveedor';
   const label=kind==='compra_credito'?'deuda':kind==='saldo_favor'?'saldo a favor':'pago';
   if(valor<=0){
     const asked=prompt('Valor del '+label+':','');
     if(asked===null)return;
     valor=Math.round(Number(String(asked).replace(/[^0-9]/g,''))||0);
     if(valor<=0){st.textContent='Escribe un valor válido para '+label+'.';valueEl.focus();return}
     valueEl.value=valor;
   }
   st.textContent='Guardando '+label+'…';
   try{
     const res=await call({action:'provider-movement',proveedor_id,tipo,valor,referencia,nota});
     valueEl.value='';document.getElementById('lpwReference').value='';document.getElementById('lpwNote').value='';
     await refresh(true);
     st.textContent='✓ '+(kind==='compra_credito'?'Deuda':kind==='saldo_favor'?'Saldo a favor':'Pago')+' registrado: '+money(valor)+'.';
   }catch(e){st.textContent='No se pudo registrar: '+e.message}
 };
 window.liftProviderWalletPayoff=async function(){
   const proveedor_id=Number(document.getElementById('lpwProvider').value),st=document.getElementById('lpwStatus');
   if(!proveedor_id)return;
   st.textContent='Saldando cuenta…';
   try{
     await call({action:'provider-payoff',proveedor_id,referencia:document.getElementById('lpwReference').value.trim(),nota:document.getElementById('lpwNote').value.trim()});
     await refresh(true);st.textContent='✓ Cuenta en cero.';
   }catch(e){st.textContent=e.message}
 };
 function inject(){
   let b=document.getElementById('liftProviderWalletBtn');
   const row=document.querySelector('#checkoutModal .liftAdminToolsRow')||document.querySelector('.liftAdminToolsRow');
   if(!row)return;
   if(!b){
     b=document.createElement('button');
     b.id='liftProviderWalletBtn';
     b.type='button';
     b.className='liftProviderWalletBtn';
     b.innerHTML='💼 Cartera proveedores';
     b.onclick=()=>window.liftProviderWalletOpen();
   }
   if(b.parentElement!==row)row.appendChild(b);
 }
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(inject,700));else setTimeout(inject,700);
 new MutationObserver(inject).observe(document.body,{childList:true,subtree:true});
})();

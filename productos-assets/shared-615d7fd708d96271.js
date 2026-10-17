
window.liftAdminAvailability=async function(id,available,btn){
 const card=btn?.closest('.liftOpsCard');
 const buttons=card?.querySelectorAll('.liftOpsAvailabilityBtns button')||[];
 buttons.forEach(b=>b.disabled=true);
 const old=btn?.textContent||'';
 if(btn)btn.textContent=available?'Habilitando pago…':'Guardando…';
 try{
   const password=sessionStorage.getItem('liftAdminCloudPasswordV1')||'';
   if(!password)throw new Error('La sesión administrativa no está activa.');
   const r=await fetch('https://vdxkknftyssjyfbdieqa.supabase.co/functions/v1/lift-clientes',{
     method:'POST',
     headers:{apikey:'sb_publishable_ECuhXuKIb85kj9fgdEjrAw_O7uNpZsh','Content-Type':'application/json'},
     body:JSON.stringify({action:'set-availability',pedido_id:Number(id),disponible:!!available,password})
   });
   const j=await r.json().catch(()=>({}));
   if(!r.ok)throw new Error(j.error||'No se pudo actualizar la disponibilidad.');
   if(card){
     const box=card.querySelector('.liftOpsAvailability');
     if(box)box.outerHTML=available
       ?'<div class="liftOpsPaymentReady">✓ Disponibilidad confirmada. Pago habilitado para el cliente.</div>'
       :'<div class="liftOpsPaymentBlocked">✕ Falta producto. El pago sigue bloqueado.</div>';
   }
   if(typeof window.liftLoadAllOrders==='function')await window.liftLoadAllOrders();
 }catch(e){
   alert('No pude actualizar el pedido: '+e.message);
   buttons.forEach(b=>b.disabled=false);
   if(btn)btn.textContent=old;
 }
};

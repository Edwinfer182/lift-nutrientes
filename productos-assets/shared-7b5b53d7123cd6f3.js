
(function(){
 const oldTrack=window.liftTrackOrder;
 if(typeof oldTrack!=='function') return;

 function setFlow(title,text,now,next){
   const box=document.getElementById('liftTrackResult');
   if(!box)return;
   const card=box.querySelector('.liftNextCard');
   if(!card)return;
   const t=card.querySelector('.liftNextTitle'),tx=card.querySelector('.liftNextText');
   if(t)t.textContent=title;
   if(tx)tx.innerHTML=text;
   const flow=card.querySelector('.liftNextFlow');
   if(flow){
     flow.innerHTML=`<div><small>ESTÁ PASANDO</small><b>${now}</b></div><div class="liftNextArrow">→</div><div><small>${next?'DESPUÉS':'ESTADO'}</small><b>${next||'Pedido completado'}</b></div>`;
   }
 }
 function current(){
   const box=document.getElementById('liftTrackResult');
   if(!box)return -1;
   return [...box.querySelectorAll('.liftJourneyStep')].findIndex(x=>x.classList.contains('current'));
 }
 function has(txt){return (document.getElementById('liftTrackResult')?.innerText||'').toLowerCase().includes(txt.toLowerCase())}

 window.liftTrackOrder=async function(){
   const r=await oldTrack.apply(this,arguments);
   const i=current();

   if(has('sin disponibilidad') || has('no disponible')){
     setFlow(
       'Hay un producto sin disponibilidad',
       'Encontramos un producto que no está disponible actualmente. <b>No realices ningún pago todavía.</b> Puedes esperar reposición, cambiarlo por otra opción o retirarlo del pedido. Te ayudaremos a continuar sin cancelar necesariamente toda la compra.',
       'Resolviendo disponibilidad','Continuar con el pedido'
     );
     return r;
   }

   if(i===0 || i===1){
     setFlow(
       'Pedido recibido ✓',
       'Recibimos tu pedido correctamente. Estamos verificando la disponibilidad de los productos para habilitar tus medios de pago. <b>No necesitas hacer nada por ahora.</b> Te enviaremos un mensaje por WhatsApp cuando puedas continuar.',
       'Verificando disponibilidad','Elegir medio de pago'
     );
   }else if(i===2){
     if(has('comprobante recibido') || has('por verificar')){
       setFlow(
         'Comprobante recibido ✓',
         'Recibimos tu comprobante. Estamos verificando el pago. <b>No necesitas hacer nada por ahora.</b> Cuando sea aprobado comenzaremos a preparar tu pedido.',
         'Verificando pago','Preparar pedido'
       );
     }else if(has('contraentrega')){
       setFlow(
         'Medio de pago confirmado ✓',
         'Elegiste pagar contraentrega. Tu pedido continuará a preparación y pagarás al momento de recibirlo.',
         'Confirmando pedido','Preparar pedido'
       );
     }else{
       setFlow(
         'Disponibilidad confirmada ✓',
         'Todos los productos de tu pedido están disponibles. <b>Ahora puedes elegir tu medio de pago</b> para continuar con el pedido.',
         'Esperando tu pago','Preparar pedido'
       );
     }
   }else if(i===3){
     setFlow(
       'Pago confirmado ✓',
       'Estamos preparando y organizando tus productos para el despacho. <b>No necesitas hacer nada por ahora.</b> Te avisaremos cuando tu pedido salga.',
       'Preparando pedido','En ruta'
     );
   }else if(i===4){
     setFlow(
       'Tu pedido ya salió 🚚',
       'Tu pedido está en camino a la dirección registrada. Te avisaremos cuando la entrega quede completada.',
       'En camino','Entregado'
     );
   }else if(i===5){
     setFlow(
       'Pedido entregado ✓',
       'Tu compra ha sido completada. Esperamos que disfrutes tus productos. Gracias por comprar en LIFT Nutrientes.',
       'Pedido completado',''
     );
   }
   return r;
 };
})();

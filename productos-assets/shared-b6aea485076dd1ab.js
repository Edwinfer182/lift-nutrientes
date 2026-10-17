
(function(){
 const old=window.liftTrackOrder;
 if(typeof old!=='function')return;
 const stages=['Pedido','Disponible','Pago','Preparación','En ruta','Entregado'];
 function currentIndex(){
   const nodes=[...document.querySelectorAll('#liftTrackResult .liftJourneyStep')];
   return Math.max(0,nodes.findIndex(n=>n.classList.contains('current')));
 }
 window.liftTrackOrder=async function(){
   const r=await old.apply(this,arguments);
   const box=document.getElementById('liftTrackResult');
   if(!box)return r;
   const idx=currentIndex(), card=box.querySelector('.liftNextCard');
   if(card && !card.querySelector('.liftNextFlow')){
     const current=stages[idx]||'Pedido', next=stages[idx+1]||'Completado';
     const flow=document.createElement('div');
     flow.className='liftNextFlow';
     flow.innerHTML=`<div><small>ESTÁ PASANDO</small><b>${current}</b></div><div class="liftNextArrow">→</div><div><small>DESPUÉS</small><b>${next}</b></div>`;
     card.appendChild(flow);
   }
   return r;
 };
})();

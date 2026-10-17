
(function(){
  const $=id=>document.getElementById(id);
  let publicFinish=null;

  function admin(){return document.body.classList.contains('liftAdminUnlocked')}

  function placePaymentBlock(){
    if(!admin())return;
    const action=document.querySelector('#checkoutModal .liftCheckoutActionArea');
    const send=action?.querySelector('.checkoutSend');
    const order=$('liftOrderFold');
    if(!action||!send||!order)return;

    order.hidden=false;
    if(order.parentElement!==action || order.nextElementSibling!==send){
      action.insertBefore(order,send);
    }

    /* Oculta únicamente el botón viejo "Pedido" de las herramientas. */
    document.querySelectorAll('#checkoutModal .liftAdminToolsRow button').forEach(b=>{
      if(/pedido/i.test(b.textContent||'')){
        b.dataset.liftOrderToolHidden='1';
        b.style.display='none';
      }
    });

    const sendText=send.querySelector('span');
    if(sendText){if(sendText.textContent!=='GENERAR PEDIDO')sendText.textContent='GENERAR PEDIDO';}
    else if(send.textContent!=='GENERAR PEDIDO')send.textContent='GENERAR PEDIDO';

    if(typeof window.liftPaymentChanged==='function')window.liftPaymentChanged();
  }

  function installUnifiedFinish(){
    if(!publicFinish && typeof window.finishCheckout==='function') publicFinish=window.finishCheckout;
    if(!publicFinish || window.finishCheckout?.__liftUnifiedPayment)return;

    const unified=async function(){
      if(!admin()) return publicFinish.apply(this,arguments);
      if(typeof window.liftSaveCurrentOrderV2!=='function'){
        console.error('LIFT: no está disponible liftSaveCurrentOrderV2');
        alert('No se pudo iniciar el pedido. Recarga la página e inténtalo de nuevo.');
        return;
      }
      const result=await window.liftSaveCurrentOrderV2({fromGenerate:true});
      if(result?.ok===false){const msg=result.error||'Revisa los datos del pedido e inténtalo nuevamente.';const status=document.getElementById('liftSaveOrderStatusV2');if(status){status.textContent='No se pudo generar el pedido: '+msg;status.classList.add('show','err');status.scrollIntoView({behavior:'smooth',block:'nearest'});}else alert(msg);}
      return result;
    };
    unified.__liftUnifiedPayment=true;
    window.finishCheckout=unified;
  }

  function fix(){
    installUnifiedFinish();
    placePaymentBlock();
  }

  document.addEventListener('DOMContentLoaded',()=>setTimeout(fix,0));
  document.addEventListener('click',e=>{
    if(e.target.closest?.('[onclick*="openCheckout"],.cartBuy,.buyNow')) setTimeout(fix,30);
  });

  /* Los parches viejos vuelven a ocultar/reubicar el bloque al abrir el checkout.
     Este observador solo vigila el modal y corrige esa ubicación, no toda la página. */
  const start=()=>{
    const modal=$('checkoutModal');
    if(!modal)return;
    new MutationObserver(()=>{
      if(modal.classList.contains('open')) requestAnimationFrame(fix);
    }).observe(modal,{attributes:true,attributeFilter:['class']});
    fix();
  };
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start);else start();
})();

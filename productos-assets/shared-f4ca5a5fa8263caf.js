
(function(){
 let shipMode='automatico', manualShip=0, oldOrder=false;
 const $=id=>document.getElementById(id);
 const num=v=>Math.max(0,Math.round(Number(v||0)));
 function admin(){return document.body.classList.contains('liftAdminUnlocked')}
 function inject(){
  const price=$('liftAdminPriceMode'); if(!price||$('liftAdminCheckoutTools'))return;
  const box=document.createElement('div');box.id='liftAdminCheckoutTools';box.className='liftAdminCheckoutTools';
  box.innerHTML=`<div class="liftAdminToolsRow"><button type="button" onclick="liftToggleCheckoutTool('client',this)">👤 Cliente</button><button type="button" onclick="liftToggleCheckoutTool('order',this)">🧾 Pedido</button><button type="button" onclick="liftToggleCheckoutTool('shipping',this)">🚚 Envío</button><button type="button" onclick="liftToggleAttentionCheckout(this)">💬 Atención</button></div>
  <div id="liftOrderFold" class="liftAdminFold" hidden><div class="liftOrderAdminGrid">
   <label>Fecha del pedido<input id="liftOrderDate" type="date"></label>
   <label>Forma de pago<select id="liftPaymentType" onchange="liftPaymentChanged()"><option value="pagado">Pagado</option><option value="credito">Crédito</option><option value="abono">Abono + saldo</option></select></label>
   <label id="liftInitialPaymentWrap" hidden>Abono inicial<input id="liftInitialPayment" type="number" min="0" step="1000" value="0" oninput="liftRefreshCreditSummary()"></label>
   <label id="liftDueDateWrap" hidden>Fecha de vencimiento<input id="liftDueDate" type="date"></label>
   <label id="liftPaymentMethodWrap" hidden class="full">Medio del abono<input id="liftPaymentMethod" placeholder="Nequi, Bancolombia, efectivo..."></label>
  </div><div id="liftCreditSummary" class="liftCreditSummary"></div><div class="liftCreditHint">Puedes cambiar la fecha para registrar pedidos anteriores. Si queda saldo, se registra como cartera.</div></div>
  <div id="liftShippingFold" class="liftAdminFold" hidden><div class="liftShippingAdmin"><button type="button" class="on" data-ship="automatico" onclick="liftSetShippingMode('automatico',this)">Automático</button><button type="button" data-ship="gratis" onclick="liftSetShippingMode('gratis',this)">Gratis</button><button type="button" data-ship="manual" onclick="liftSetShippingMode('manual',this)">Valor manual</button><button type="button" data-ship="automatico" onclick="liftSetShippingMode('automatico',this)">Restablecer</button></div><div id="liftManualShipping" class="liftManualShipping"><input id="liftManualShippingValue" type="number" min="0" step="1000" placeholder="Valor del envío" oninput="manualShip=num(this.value);renderCheckoutSummary()"></div></div>`;
  price.insertAdjacentElement('afterend',box);
  const d=$('liftOrderDate');if(d)d.value=new Date().toISOString().slice(0,10);
 }
 window.liftToggleCheckoutTool=function(which,btn){if(!admin())return;document.querySelectorAll('.liftAdminToolsRow button').forEach(x=>x.classList.remove('on'));const client=$('liftRecurringClientBox'),order=$('liftOrderFold'),shipping=$('liftShippingFold');client?.classList.remove('liftClientBoxOpen');if(order)order.hidden=true;if(shipping)shipping.hidden=true;if(which==='client'){client?.classList.add('liftClientBoxOpen');btn?.classList.add('on')}if(which==='order'){if(order)order.hidden=false;btn?.classList.add('on')}if(which==='shipping'){if(shipping)shipping.hidden=false;btn?.classList.add('on')}};
 window.liftSetShippingMode=function(mode,btn){shipMode=mode;document.querySelectorAll('[data-ship]').forEach(x=>x.classList.remove('on'));btn?.classList.add('on');$('liftManualShipping')?.classList.toggle('show',mode==='manual');renderCheckoutSummary()};
 window.liftAdminShippingValue=function(auto){if(!admin())return auto;if(shipMode==='gratis')return 0;if(shipMode==='manual')return num($('liftManualShippingValue')?.value);return auto};
 window.liftPaymentChanged=function(){const t=$('liftPaymentType')?.value||'pagado', credit=t!=='pagado';if($('liftInitialPaymentWrap'))$('liftInitialPaymentWrap').hidden=t!=='abono';if($('liftDueDateWrap'))$('liftDueDateWrap').hidden=!credit;if($('liftPaymentMethodWrap'))$('liftPaymentMethodWrap').hidden=t!=='abono';liftRefreshCreditSummary()};
 window.liftRefreshCreditSummary=function(){const el=$('liftCreditSummary');if(!el)return;const t=$('liftPaymentType')?.value||'pagado';if(t==='pagado'){el.classList.remove('show');return}const total=num(($('coTotal')?.textContent||'').replace(/\D/g,'')),ab=t==='abono'?Math.min(total,num($('liftInitialPayment')?.value)):0;el.innerHTML=`Total: <b>${typeof fmt==='function'?fmt(total):total}</b> · Abono: <b>${typeof fmt==='function'?fmt(ab):ab}</b> · Saldo: <b>${typeof fmt==='function'?fmt(total-ab):total-ab}</b>`;el.classList.add('show')};
 window.liftCreditOrderMeta=function(){const t=$('liftPaymentType')?.value||'pagado';return {forma_pago:t,abono_inicial:t==='abono'?num($('liftInitialPayment')?.value):0,fecha_vencimiento:t==='pagado'?null:($('liftDueDate')?.value||null),medio_abono:$('liftPaymentMethod')?.value?.trim()||'',fecha:$('liftOrderDate')?.value||new Date().toISOString().slice(0,10),envio_modo:shipMode}};
 window.liftSendCheckoutToCredit=async function(){
   if(!admin())return;
   inject();
   const btn=$('liftDirectCreditBtn');
   if(btn?.dataset.busy==='1')return;
   if($('liftPaymentType'))$('liftPaymentType').value='credito';
   liftPaymentChanged();
   try{
     if(btn){btn.dataset.busy='1';btn.disabled=true;btn.textContent='Enviando a cartera…'}
     if(typeof window.liftSaveCurrentOrderV2!=='function')throw new Error('No está disponible la función para guardar el pedido.');
     const result=await window.liftSaveCurrentOrderV2({creditAction:true});
     if(!result?.ok||result?.cartera!==true)throw new Error(result?.error||'El pedido se guardó, pero Supabase no confirmó su registro en cartera.');
     if(btn){btn.textContent='✓ Pedido #'+result.pedido_id+' enviado a cartera';btn.classList.add('saved')}
   }catch(e){console.error('Enviar checkout a crédito:',e);if(btn){btn.classList.remove('saved');btn.textContent='↻ Reintentar enviar a crédito'}}
   finally{if(btn){btn.dataset.busy='0';btn.disabled=false}}
  };

  // Recalcula envío sin duplicar la función base.
 const oldRender=window.renderCheckoutSummary;
 if(typeof oldRender==='function')window.renderCheckoutSummary=function(){const r=oldRender.apply(this,arguments);if(admin()){const auto=adminTrainerMode()?11000:shippingFor(selectedCity?.name||'',checkoutQty());const ship=window.liftAdminShippingValue(auto);const its=checkoutItemsList(),sub=checkoutPublicSubtotal(its),effective=checkoutEffectiveSubtotal(its),discount=checkoutCouponDiscount(its),total=Math.max(0,effective-((adminTrainerMode()||trainerCouponActive())?0:discount))+(ship||0);if($('coShipping'))$('coShipping').textContent=ship===0?'GRATIS':(ship==null?'Selecciona ciudad':fmt(ship));if($('coTotal'))$('coTotal').textContent=fmt(total);liftRefreshCreditSummary()}return r};
 const oldOpen=window.openCheckout;if(typeof oldOpen==='function')window.openCheckout=function(){const r=oldOpen.apply(this,arguments);shipMode='automatico';manualShip=0;setTimeout(()=>{inject();if($('liftOrderDate'))$('liftOrderDate').value=new Date().toISOString().slice(0,10);$('liftRecurringClientBox')?.classList.remove('liftClientBoxOpen');if($('liftOrderFold'))$('liftOrderFold').hidden=true;if($('liftShippingFold'))$('liftShippingFold').hidden=true;document.querySelectorAll('.liftAdminToolsRow button').forEach(x=>x.classList.remove('on'))},0);return r};
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',inject);else inject();
})();

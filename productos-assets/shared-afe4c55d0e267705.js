
(function(){
 const FN='https://vdxkknftyssjyfbdieqa.supabase.co/functions/v1/lift-clientes';
 const KEY='sb_publishable_ECuhXuKIb85kj9fgdEjrAw_O7uNpZsh';
 const PASS='liftAdminCloudPasswordV1';
 const $=id=>document.getElementById(id);
 const password=()=>{try{return sessionStorage.getItem(PASS)||''}catch(e){return ''}};
 async function api(payload){
   const r=await fetch(FN,{method:'POST',headers:{apikey:KEY,'Content-Type':'application/json'},body:JSON.stringify({...payload,password:password()})});
   const j=await r.json().catch(()=>({}));
   if(!r.ok)throw new Error(j.error||j.message||('Error '+r.status));
   return j;
 }
 function status(msg,type){const el=$('liftSaveOrderStatusV2');if(!el)return;el.textContent=msg;el.className='liftSaveOrderStatusV2 show '+(type||'')}
 function digits(v){return String(v||'').replace(/\D/g,'')}
 window.liftSaveCurrentOrderV2=async function(options={}){
   if(!document.body.classList.contains('liftAdminUnlocked'))return;
   const btn=$('liftSaveOrderBtnV2');
   if(btn?.dataset.busy==='1')return;
   const nombre=$('coName')?.value.trim()||'', celular=$('coPhone')?.value.trim()||'', direccion=$('coAddress')?.value.trim()||'', notas=$('coNotes')?.value.trim()||'';
   if(!nombre){status('Falta el nombre del cliente.','err');$('coName')?.focus();return}
   if(!celular){status('Falta el celular del cliente.','err');$('coPhone')?.focus();return}
   if(!direccion){status('Falta la dirección del cliente.','err');$('coAddress')?.focus();return}
   if(typeof selectedCity==='undefined'||!selectedCity?.name){status('Selecciona una ciudad válida.','err');$('coCity')?.focus();return}
   const its=typeof checkoutItemsList==='function'?checkoutItemsList():[];
   if(!its.length){status('El pedido no tiene productos.','err');return}
   const subtotal=typeof checkoutPublicSubtotal==='function'?checkoutPublicSubtotal(its):its.reduce((a,x)=>a+(Number(x.p?.price||0)*Number(x.q||1)),0);
   const effective=typeof checkoutEffectiveSubtotal==='function'?checkoutEffectiveSubtotal(its):subtotal;
   const descuento=typeof checkoutCouponDiscount==='function'?checkoutCouponDiscount(its):0;
   const trainerShipping=(typeof adminTrainerMode==='function'&&adminTrainerMode())||(typeof trainerCouponActive==='function'&&trainerCouponActive());
   const autoShip=trainerShipping?11000:(typeof shippingFor==='function'?shippingFor(selectedCity.name,typeof checkoutQty==='function'?checkoutQty():its.reduce((a,x)=>a+Number(x.q||1),0)):0);
   const envio=typeof window.liftAdminShippingValue==='function'?window.liftAdminShippingValue(autoShip):(autoShip||0);
   const noDiscount=(typeof adminTrainerMode==='function'&&adminTrainerMode())||(typeof trainerCouponActive==='function'&&trainerCouponActive());
   const total=Math.max(0,effective-(noDiscount?0:descuento))+(Number(envio)||0);
   const meta=typeof window.liftCreditOrderMeta==='function'?window.liftCreditOrderMeta():{forma_pago:'pagado',abono_inicial:0,fecha_vencimiento:null,fecha:new Date().toISOString().slice(0,10),envio_modo:'automatico'};
   const origen=['admin','forma='+encodeURIComponent(meta.forma_pago||'pagado'),'abono='+Math.round(Number(meta.abono_inicial||0)),'vence='+(meta.fecha_vencimiento||''),'envio='+encodeURIComponent(meta.envio_modo||'automatico'),'fecha='+(meta.fecha||new Date().toISOString().slice(0,10))].join('|');
   const items=its.map(({p,q})=>{const unit=typeof checkoutUnitPrice==='function'?checkoutUnitPrice(p):Number(p.price||0);return {producto_id:p.id||null,nombre:String(p.name||'Producto')+(p._cartFlavor?' · Sabor: '+p._cartFlavor:''),marca:p.brand||'',cantidad:Number(q||1),precio_unitario:unit,total_linea:unit*Number(q||1)}});
   try{
     if(btn){btn.dataset.busy='1';btn.disabled=true;btn.classList.remove('saved');btn.textContent='Guardando en Supabase…'}
     status('Enviando pedido a Supabase…','');
     const saved=await api({action:'save-order',nombre,celular,direccion,ciudad:selectedCity.name,departamento:selectedCity.department||'',notas,subtotal,envio:Number(envio)||0,descuento:noDiscount?0:descuento,total,origen,items});
     const pedidoId=Number(saved?.pedido_id||0);
     if(!pedidoId)throw new Error('Supabase no devolvió el ID del pedido.');
     status('Pedido #'+pedidoId+' recibido. Verificando que quedó guardado…','');
     const found=await api({action:'find',q:celular});
     const client=(found.clientes||[]).find(c=>digits(c.celular)===digits(celular))||(found.clientes||[])[0];
     if(!client?.id)throw new Error('El pedido respondió con ID, pero no pude localizar al cliente para verificarlo.');
     const history=await api({action:'history',cliente_id:client.id});
     const verified=(history.pedidos||[]).some(p=>Number(p.id)===pedidoId);
     if(!verified)throw new Error('Supabase devolvió el pedido #'+pedidoId+', pero no apareció al consultar el historial.');
     if(btn){btn.classList.add('saved');btn.textContent='✓ Pedido #'+pedidoId+' guardado'}
     status('✓ Guardado y verificado en Supabase. Ya aparece en el historial del cliente.','ok');
     if(typeof window.liftCrmRefresh==='function')window.liftCrmRefresh().catch(()=>{});
     return {ok:true,pedido_id:pedidoId,forma_pago:meta.forma_pago,total};
   }catch(e){
     console.error('Guardar pedido V2:',e);
     if(btn){btn.classList.remove('saved');btn.textContent='↻ Reintentar guardar pedido'}
     status('No se guardó: '+e.message,'err');
     return {ok:false,error:e.message};
   }finally{if(btn){btn.dataset.busy='0';btn.disabled=false}}
 };
})();


(function(){
  const PUBLIC_CATALOG='https://supgo.co/';
  window.liftPublicOrderUrl=function(id){
    return PUBLIC_CATALOG+'?pedido='+encodeURIComponent(String(id||'').replace(/[^0-9]/g,''));
  };

  // Patch payment approval/rejection WhatsApp messages: public URL, no token.
  window.liftApprovePayment=async function(id,ok){
    try{
      const apiFn = (typeof api==='function') ? api : async function(payload){
        const password=sessionStorage.getItem('liftAdminCloudPasswordV1')||'';
        const r=await fetch('https://vdxkknftyssjyfbdieqa.supabase.co/functions/v1/lift-clientes',{
          method:'POST',
          headers:{apikey:'sb_publishable_ECuhXuKIb85kj9fgdEjrAw_O7uNpZsh','Content-Type':'application/json'},
          body:JSON.stringify({...payload,password})
        });
        const j=await r.json().catch(()=>({}));
        if(!r.ok)throw new Error(j.error||'No se pudo actualizar el pago');
        return j;
      };
      const r=await apiFn({action:'approve-payment',pedido_id:id,aprobado:ok});
      const c=r.cliente||{};
      const u=window.liftPublicOrderUrl(id);
      const msg=ok
        ? `✅ Pago confirmado\nPedido #${id}\nYa estamos preparando tu pedido.\n${u}`
        : `El comprobante del pedido #${id} no fue aprobado.\nPuedes revisar y subir otro comprobante aquí:\n${u}`;
      const digits=String(c.celular||'').replace(/\D/g,'');
      const phone=digits.length===10?'57'+digits:digits;
      if(typeof window.liftOpenPaymentsAdmin==='function')await window.liftOpenPaymentsAdmin();
      if(phone)window.open('https://wa.me/'+phone+'?text='+encodeURIComponent(msg),'_blank');
    }catch(e){alert(e.message)}
  };

  // If a public ?pedido=137 link is opened, open Mi pedido and prefill the number.
  // Phone remains required by the existing public tracker, so the URL alone reveals no order data.
  function openPublicOrderFromUrl(){
    const q=new URLSearchParams(location.search);
    const id=String(q.get('pedido')||'').replace(/\D/g,'');
    if(!id)return;
    setTimeout(()=>{
      try{
        if(typeof window.liftOpenTrack==='function')window.liftOpenTrack();
        const ref=document.getElementById('liftTrackRef');
        if(ref)ref.value=id;
        const phone=document.getElementById('liftTrackPhone');
        if(phone && !phone.value){
          phone.focus();
          phone.setAttribute('placeholder','Ingresa el celular del pedido');
        }
        const result=document.getElementById('liftTrackResult');
        if(result)result.innerHTML='<div style="padding:12px 0;font-size:11px;color:#666">Pedido #'+id+'. Ingresa el celular usado en la compra para consultar el estado.</div>';
      }catch(e){}
    },350);
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',openPublicOrderFromUrl,{once:true});
  else openPublicOrderFromUrl();
})();

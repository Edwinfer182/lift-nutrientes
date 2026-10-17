
(function(){
 async function openOrderFromUrl(){
  try{
   const u=new URL(location.href);
   const ref=String(u.searchParams.get('pedido')||'').trim();
   const token=String(u.searchParams.get('token')||'').trim();
   if(!ref) return;
   const modal=document.getElementById('liftTrackModal');
   const refEl=document.getElementById('liftTrackRef');
   const phoneEl=document.getElementById('liftTrackPhone');
   if(!modal||!refEl||typeof window.liftTrackOrder!=='function') return;
   refEl.value=ref;
   if(token && phoneEl) phoneEl.value='';
   modal.classList.add('open');
   modal.setAttribute('aria-hidden','false');
   const out=document.getElementById('liftTrackResult');
   if(out) out.innerHTML='<div style="font-size:11px;color:#777;padding:12px 0">Cargando pedido…</div>';
   await window.liftTrackOrder(token||undefined);
  }catch(e){console.warn('LIFT order URL:',e)}
 }
 if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',()=>setTimeout(openOrderFromUrl,350));
 else setTimeout(openOrderFromUrl,350);
 window.addEventListener('pageshow',()=>setTimeout(openOrderFromUrl,250));
})();

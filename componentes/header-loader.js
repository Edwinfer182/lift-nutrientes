/* SUPGO: monta el mismo /componentes/header.html en cualquier página que importe este cargador.
   Nunca copia el HTML al generador ni modifica el index. */
(function(){
  'use strict';
  if(window.__supgoHeaderMountPromise)return;
  const path='/componentes/';
  function loadScript(src){
    return new Promise(function(resolve,reject){
      var script=document.createElement('script');
      script.src=src;script.onload=resolve;script.onerror=reject;
      document.body.appendChild(script);
    });
  }
  function attachOrderButtonToExistingHeader(){
    const bar=document.querySelector('header.top .bar');
    if(!bar)return;
    let btn=bar.querySelector('.myOrder');
    if(!btn){
      btn=document.createElement('button');
      btn.type='button';
      btn.className='iconbtn myOrder';
      btn.innerHTML='▤ <span class="txt">Mi pedido</span>';
      btn.setAttribute('aria-label','Mi pedido');
      const cart=bar.querySelector('.cartDesktop');
      if(cart)cart.before(btn);else bar.append(btn);
    }
    btn.removeAttribute('hidden');
    btn.style.cssText='display:inline-flex!important;align-items:center;justify-content:center;gap:5px;flex-shrink:0;padding:10px 12px;background:#1c1d20;color:#fff;border:1px solid #424348;border-radius:11px;font:500 12px Poppins,Arial,sans-serif;cursor:pointer';
    btn.onclick=function(e){e.preventDefault();window.supgoOpenPedidoCompartido?.()};
  }
  async function mount(){
    // Un index con header propio nunca debe recibir uno duplicado.
    if(document.querySelector('header.top,#supgo-global-header')){attachOrderButtonToExistingHeader();return;}
    const response=await fetch(path+'header.html?v=20261022-pedido-local3',{credentials:'same-origin'});
    if(!response.ok)throw new Error('No se encontró el header compartido: '+response.status);
    const html=await response.text();
    if(document.querySelector('header.top,#supgo-global-header')){attachOrderButtonToExistingHeader();return;}
    let styles=document.querySelector('link[data-supgo-header-style]');
    if(!styles){
      styles=document.createElement('link');
      styles.rel='stylesheet';styles.dataset.supgoHeaderStyle='1';document.head.appendChild(styles);
    }
    // Reemplazar también la URL de un link previamente insertado en caché.
    const cssUrl=path+'header-public.css?v=20261022-pedido-local3';
    if(styles.getAttribute('href')!==cssUrl)styles.href=cssUrl;
    await new Promise(resolve=>{if(styles.sheet){resolve();return;}styles.addEventListener('load',resolve,{once:true});styles.addEventListener('error',resolve,{once:true});});
    const host=document.createElement('div');
    host.id='supgo-global-header';
    host.innerHTML=html;
    document.body.insertBefore(host,document.body.firstChild);
    try{
      await loadScript(path+'header.js?v=20261022-pedido-local3');
      // Refuerzo para fichas que conservan en caché el marcado antiguo.
      function ensureCheckoutButton(){
        const drawer=document.querySelector('.supgo-cart-drawer');
        const footer=drawer?.querySelector('.supgo-cart-bottom');
        if(!footer||footer.querySelector('#supgoGoCheckout'))return;
        const button=document.createElement('button');
        button.type='button';button.id='supgoGoCheckout';button.textContent='Continuar pedido';
        button.style.cssText='display:block!important;width:100%;min-height:48px;background:#111;color:#fff;border:0;border-radius:8px;font:600 15px Poppins,Arial,sans-serif;margin:0 0 12px';
        footer.prepend(button);
        button.onclick=()=>{const cart=document.querySelector('.supgo-cart-drawer');const trigger=cart?.querySelector('#supgoGoCheckout');if(trigger&&trigger!==button)trigger.click();else if(typeof window.supgoOpenSeoCheckout==='function')window.supgoOpenSeoCheckout();};
      }
      // Garantiza el acceso visible en cada página que carga el header compartido.
      const headerBar=host.querySelector('.bar');
      const cart=headerBar?.querySelector('.cartDesktop');
      let order=headerBar?.querySelector('.myOrder');
      if(headerBar && !order){
        order=document.createElement('button');
        order.type='button';order.className='iconbtn myOrder';
        order.innerHTML='▤ <span class="txt">Mi pedido</span>';
        order.setAttribute('aria-label','Mi pedido');
        (cart||null) ? cart.before(order) : headerBar.append(order);
      }
      if(order){
        order.hidden=false;
        order.style.setProperty('display','inline-flex','important');
        order.style.setProperty('align-items','center','important');
        order.style.setProperty('flex-shrink','0','important');
        order.onclick=()=>window.supgoOpenPedidoCompartido?.();
      }
      ensureCheckoutButton();
      document.querySelector('.cartDesktop')?.addEventListener('click',()=>queueMicrotask(ensureCheckoutButton));

      attachOrderButtonToExistingHeader();
      document.dispatchEvent(new CustomEvent('supgo:header-ready',{detail:{host:host}}));
    }catch(error){host.remove();throw error;}
  }
  window.__supgoHeaderMountPromise=new Promise(function(resolve){
    function start(){mount().catch(function(error){console.error('[SUPGO] No se pudo montar /componentes/header.html',error);}).finally(resolve);}
    if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
  });
})();

/* Mi pedido: consulta en la misma página, sin navegación. */
(function(){
 if(window.supgoOpenPedidoCompartido)return;
 const endpoint='https://vdxkknftyssjyfbdieqa.supabase.co/functions/v1/lift-clientes';
 const key='sb_publishable_ECuhXuKIb85kj9fgdEjrAw_O7uNpZsh';
 const escapeHtml=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;','\'':'&quot;'}[c]));
 function init(){
  if(document.getElementById('supgoPedidoCompartido'))return;
  const style=document.createElement('style');
  style.textContent='#supgoPedidoCompartido{position:fixed;inset:0;z-index:999999;display:none;align-items:stretch;justify-content:flex-end;background:#0009;padding:0;font-family:Poppins,Arial,sans-serif}#supgoPedidoCompartido.open{display:flex}#supgoPedidoCompartido .pedido-card{background:#fff;color:#151515;border-radius:18px 0 0 18px;width:min(100%,540px);height:100dvh;max-height:100dvh;overflow:auto;padding:22px;box-shadow:0 16px 60px #0004}#supgoPedidoCompartido .pedido-top{display:flex;align-items:center;justify-content:space-between}#supgoPedidoCompartido .pedido-top button{background:#eee;border:0;border-radius:50%;width:34px;height:34px;font-size:23px;cursor:pointer}#supgoPedidoCompartido input{box-sizing:border-box;width:100%;padding:13px;border:1px solid #ddd;border-radius:8px;margin:6px 0;font:inherit;font-size:14px}#supgoPedidoCompartido .pedido-submit{background:#111;color:#fff;border:0;border-radius:8px;width:100%;padding:13px;cursor:pointer;margin:8px 0;font:inherit}#supgoPedidoCompartido .pedido-line{padding:12px 0;border-bottom:1px solid #eee}#supgoPedidoCompartido .pedido-steps{display:flex;flex-wrap:wrap;gap:5px;margin:14px 0}#supgoPedidoCompartido .pedido-steps span{padding:7px;border-radius:6px;background:#eee;font-size:11px}#supgoPedidoCompartido .pedido-steps span.on{background:#111;color:#fff}';
  document.head.append(style);
  const modal=document.createElement('div');modal.id='supgoPedidoCompartido';modal.innerHTML='<div class="pedido-card" role="dialog" aria-modal="true" aria-label="Mi pedido"><div class="pedido-top"><h2>Mi pedido</h2><button type="button" data-close aria-label="Cerrar">×</button></div><p>Consulta con el número de pedido y el celular usado en la compra.</p><input id="supgoPedidoNumero" placeholder="Número de pedido"><input id="supgoPedidoCelular" placeholder="Celular" inputmode="tel"><button type="button" class="pedido-submit">Consultar pedido</button><div id="supgoPedidoResultado" aria-live="polite"></div></div>';
  document.body.append(modal);
  const close=()=>{modal.classList.remove('open');document.body.style.removeProperty('overflow')};
  modal.querySelector('[data-close]').onclick=close;
  modal.addEventListener('click',e=>{if(e.target===modal)close()});
  modal.querySelector('.pedido-submit').onclick=async()=>{
   const ref=modal.querySelector('#supgoPedidoNumero').value.trim(),celular=modal.querySelector('#supgoPedidoCelular').value.trim(),out=modal.querySelector('#supgoPedidoResultado');const token=modal.dataset.token||'';
   if(!ref||(!celular&&!token)){out.textContent='Escribe número de pedido y celular.';return}
   out.textContent='Consultando…';
   try{
    const res=await fetch(endpoint,{method:'POST',headers:{'Content-Type':'application/json',apikey:key},body:JSON.stringify({action:'public-track-order',referencia:ref,celular,token})});
    const data=await res.json();if(!res.ok||!data.pedido)throw Error(data.error||'No se encontró el pedido.');
    const p=data.pedido;const labels=['Recibido','Preparando','En ruta','Entregado'];const states=['nuevo','programado','en_ruta','entregado'];const ix=Math.max(0,states.indexOf(p.estado));
    const money=n=>new Intl.NumberFormat('es-CO',{style:'currency',currency:'COP',maximumFractionDigits:0}).format(Number(n)||0);
    out.innerHTML='<div class="pedido-line"><b>PEDIDO '+escapeHtml(p.referencia||ref)+'</b><p>'+escapeHtml(p.nombre||'')+'</p><small>'+escapeHtml(p.direccion||p.ciudad||'')+'</small></div><div class="pedido-steps">'+labels.map((s,i)=>'<span class="'+(i<=ix?'on':'')+'">'+s+'</span>').join('')+'</div>'+(p.items||[]).map(i=>'<div class="pedido-line"><b>'+escapeHtml(i.nombre||'Producto')+'</b><div>Cantidad: '+Number(i.cantidad||1)+'</div><small>'+money(i.total_linea||Number(i.precio_unitario||0)*Number(i.cantidad||1))+'</small></div>').join('')+'<div class="pedido-line"><b>Total: '+money(p.total)+'</b></div>';
   }catch(e){out.textContent=e.message||'Error consultando el pedido'}
  };
 }
 window.supgoOpenPedidoCompartido=(orderData)=>{if(typeof window.liftOpenTrack==='function'&&document.getElementById('liftTrackModal')){window.liftOpenTrack();const last=JSON.parse(localStorage.getItem('liftLastPublicOrder')||'{}');const ref=document.getElementById('liftTrackRef'),phone=document.getElementById('liftTrackPhone');if(ref)ref.value=orderData?.ref||orderData?.referencia||last.ref||'';if(phone)phone.value=orderData?.phone||orderData?.celular||last.phone||'';if(ref?.value&&(phone?.value||orderData?.token||last.token)&&typeof window.liftTrackOrder==='function')Promise.resolve(window.liftTrackOrder(orderData?.token||last.token||undefined)).catch(console.error);return}init();const m=document.getElementById('supgoPedidoCompartido');try{const last=JSON.parse(localStorage.getItem('liftLastPublicOrder')||'{}');m.querySelector('#supgoPedidoNumero').value=orderData?.ref||orderData?.referencia||last.ref||'';m.querySelector('#supgoPedidoCelular').value=orderData?.phone||orderData?.celular||last.phone||'';m.dataset.token=orderData?.token||last.token||''}catch(e){}m.classList.add('open');document.body.style.overflow='hidden';if(m.querySelector('#supgoPedidoNumero').value&&(m.querySelector('#supgoPedidoCelular').value||m.dataset.token))m.querySelector('.pedido-submit').click()};
})();

/* Permite al checkout abrir el seguimiento en la misma URL tras crear el pedido. */
window.addEventListener('supgo:pedido-generado',function(e){if(typeof window.supgoOpenPedidoCompartido==='function')window.supgoOpenPedidoCompartido(e.detail||{});});

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
    // Un solo acceso: retirar duplicados insertados por otros módulos.
    bar.querySelectorAll('.myOrder').forEach(function(other){if(other!==btn)other.remove();});
    // Si hay un botón de seguimiento propio, conservarlo y no crear otro.
    const nativeOrder=Array.from(bar.querySelectorAll('button')).find(function(b){return b!==btn && /mi pedido/i.test(b.textContent||'') && !b.classList.contains('cartDesktop');});
    if(nativeOrder){if(btn)btn.remove();return;}
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
    btn.onclick=function(e){e.preventDefault();if(typeof window.supgoOpenPedidoCompartido==='function')window.supgoOpenPedidoCompartido();else location.assign('/?mi-pedido=1&volver='+encodeURIComponent(location.pathname+location.search+location.hash));};
  }
  async function mount(){
    // Un index con header propio nunca debe recibir uno duplicado.
    if(document.querySelector('header.top,#supgo-global-header')){attachOrderButtonToExistingHeader();return;}
    const response=await fetch(path+'header.html?v=20261027-pedido-return-v2',{credentials:'same-origin',cache:'no-store'});
    if(!response.ok)throw new Error('No se encontró el header compartido: '+response.status);
    const html=await response.text();
    if(document.querySelector('header.top,#supgo-global-header')){attachOrderButtonToExistingHeader();return;}
    let styles=document.querySelector('link[data-supgo-header-style]');
    if(!styles){
      styles=document.createElement('link');
      styles.rel='stylesheet';styles.dataset.supgoHeaderStyle='1';document.head.appendChild(styles);
    }
    // Reemplazar también la URL de un link previamente insertado en caché.
    const cssUrl=path+'header-public.css?v=20261027-pedido-return-v2';
    if(styles.getAttribute('href')!==cssUrl)styles.href=cssUrl;
    await new Promise(resolve=>{if(styles.sheet){resolve();return;}styles.addEventListener('load',resolve,{once:true});styles.addEventListener('error',resolve,{once:true});});
    const host=document.createElement('div');
    host.id='supgo-global-header';
    host.innerHTML=html;
    document.body.insertBefore(host,document.body.firstChild);
    try{
      await loadScript(path+'header.js?v=20261027-pedido-return-v2');
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

      // El botón del header recién montado ya existe y usa el seguimiento compartido.
      document.dispatchEvent(new CustomEvent('supgo:header-ready',{detail:{host:host}}));
    }catch(error){host.remove();throw error;}
  }
  window.__supgoHeaderMountPromise=new Promise(function(resolve){
    function start(){mount().catch(function(error){console.error('[SUPGO] No se pudo montar /componentes/header.html',error);}).finally(resolve);}
    if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
  });
})();

/* El seguimiento se implementa exclusivamente en header.js (interfaz nativa del checkout).
   Eliminada la consulta simplificada que se registraba antes del componente. */

/* Permite al checkout abrir el seguimiento en la misma URL tras crear el pedido. */
window.addEventListener('supgo:pedido-generado',function(e){location.assign('/?mi-pedido=1');});

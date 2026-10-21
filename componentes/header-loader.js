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
  async function mount(){
    // Un index con header propio nunca debe recibir uno duplicado.
    if(document.querySelector('header.top,#supgo-global-header'))return;
    const response=await fetch(path+'header.html?v=20261020-filter-layout12',{credentials:'same-origin'});
    if(!response.ok)throw new Error('No se encontró el header compartido: '+response.status);
    const html=await response.text();
    if(document.querySelector('header.top,#supgo-global-header'))return;
    let styles=document.querySelector('link[data-supgo-header-style]');
    if(!styles){
      styles=document.createElement('link');
      styles.rel='stylesheet';styles.dataset.supgoHeaderStyle='1';document.head.appendChild(styles);
    }
    // Reemplazar también la URL de un link previamente insertado en caché.
    const cssUrl=path+'header-public.css?v=20261020-filter-layout12';
    if(styles.getAttribute('href')!==cssUrl)styles.href=cssUrl;
    await new Promise(resolve=>{if(styles.sheet){resolve();return;}styles.addEventListener('load',resolve,{once:true});styles.addEventListener('error',resolve,{once:true});});
    const host=document.createElement('div');
    host.id='supgo-global-header';
    host.innerHTML=html;
    document.body.insertBefore(host,document.body.firstChild);
    try{
      await loadScript(path+'header.js?v=20261020-filter-layout12');
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
      ensureCheckoutButton();
      document.querySelector('.cartDesktop')?.addEventListener('click',()=>queueMicrotask(ensureCheckoutButton));

      document.dispatchEvent(new CustomEvent('supgo:header-ready',{detail:{host:host}}));
    }catch(error){host.remove();throw error;}
  }
  window.__supgoHeaderMountPromise=new Promise(function(resolve){
    function start(){mount().catch(function(error){console.error('[SUPGO] No se pudo montar /componentes/header.html',error);}).finally(resolve);}
    if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
  });
})();

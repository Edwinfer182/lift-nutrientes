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
    const response=await fetch(path+'header.html?v=20261020-cart-button6',{credentials:'same-origin'});
    if(!response.ok)throw new Error('No se encontró el header compartido: '+response.status);
    const html=await response.text();
    if(document.querySelector('header.top,#supgo-global-header'))return;
    let styles=document.querySelector('link[data-supgo-header-style]');
    if(!styles){
      styles=document.createElement('link');
      styles.rel='stylesheet';styles.href=path+'header-public.css?v=20261020-cart-button6';
      styles.dataset.supgoHeaderStyle='1';document.head.appendChild(styles);
    }
    const host=document.createElement('div');
    host.id='supgo-global-header';
    host.innerHTML=html;
    document.body.insertBefore(host,document.body.firstChild);
    try{
      await loadScript(path+'header.js?v=20261020-cart-button6');
      document.dispatchEvent(new CustomEvent('supgo:header-ready',{detail:{host:host}}));
    }catch(error){host.remove();throw error;}
  }
  window.__supgoHeaderMountPromise=new Promise(function(resolve){
    function start(){mount().catch(function(error){console.error('[SUPGO] No se pudo montar /componentes/header.html',error);}).finally(resolve);}
    if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
  });
})();

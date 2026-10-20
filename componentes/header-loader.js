/* Carga UN único componente HTML compartido. No genera otro header. */
(function(){
  'use strict';
  if (window.__supgoSharedHeaderLoaded) return;
  window.__supgoSharedHeaderLoaded = true;
  async function mount(){
    if(document.querySelector('header.top,#supgo-global-header')) return;
    const container=document.createElement('div');
    container.id='supgo-global-header';
    try{
      const response=await fetch('/componentes/header.html',{credentials:'same-origin'});
      if(!response.ok)throw new Error('HTTP '+response.status);
      const markup=await response.text();
      if(document.querySelector('header.top'))return;
      const css=document.createElement('link');
      css.rel='stylesheet';
      css.href='/componentes/header-public.css';
      document.head.appendChild(css);
      container.innerHTML=markup;
      document.body.insertBefore(container,document.body.firstChild);
      const script=document.createElement('script');
      script.src='/componentes/header.js';
      document.body.appendChild(script);
    }catch(error){console.error('No se pudo cargar /componentes/header.html',error);}
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',mount,{once:true});
  else mount();
})();

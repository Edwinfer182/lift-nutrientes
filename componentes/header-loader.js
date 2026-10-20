/* SUPGO reusable header loader. One instance per document. */
(function(){
  'use strict';
  if(window.__supgoHeaderLoader)return;
  window.__supgoHeaderLoader=true;
  function init(){
    // Index already owns the genuine header and its original handlers.
    if(document.querySelector('header.top, #supgo-global-header, .seo-site-header'))return;
    var host=document.createElement('div');
    host.id='supgo-global-header';
    document.body.insertBefore(host,document.body.firstChild);
    var css=document.createElement('link');
    css.rel='stylesheet';css.href='/componentes/header-public.css';
    document.head.appendChild(css);
    fetch('/componentes/header.html',{credentials:'same-origin'})
      .then(function(response){if(!response.ok)throw Error('Header HTTP '+response.status);return response.text();})
      .then(function(markup){
        if(document.querySelector('header.top')){host.remove();return;}
        host.innerHTML=markup;
        var script=document.createElement('script');
        script.src='/componentes/header.js';script.defer=true;
        document.body.appendChild(script);
      })
      .catch(function(error){host.remove();console.error('SUPGO header:',error);});
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});
  else init();
})();

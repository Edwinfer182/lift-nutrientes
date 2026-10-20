/* SUPGO shared header: public pages. The homepage keeps its original handlers. */
(function(){
  const ROOT='https://supgo.co/';
  function go(params){location.assign(ROOT+(params?'?'+params:''));}
  function navigate(kind,value){
    const q=new URLSearchParams();
    if(kind==='ofertas')q.set('ofertas','1');
    if(kind==='buscar')q.set('q',value);
    if(kind==='categoria')q.set('categoria',value);
    if(kind==='laboratorio')q.set('laboratorio',value);
    go(q.toString());
  }
  window.SupgoHeader={navigate:navigate,root:ROOT};
  if(document.documentElement.dataset.supgoHome==='1')return;
  window.showOffers=function(){navigate('ofertas');};
  window.openOff=function(which){if(which==='filters')go('menu=1');if(which==='cart')go('carrito=1');};
  window.liftCopyFilterLink=function(){navigator.clipboard?.writeText(ROOT+'?ofertas=1');};
  function init(){
    const q=document.querySelector('#supgo-global-header #q');
    if(q){q.addEventListener('keydown',e=>{if(e.key==='Enter'){e.preventDefault();navigate('buscar',q.value.trim());}});}
    const brand=document.querySelector('#supgo-global-header .brand');
    if(brand){brand.style.cursor='pointer';brand.addEventListener('click',()=>go(''));}
    const search=document.querySelector('#supgo-global-header #searchResults');
    if(search)search.remove();
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();

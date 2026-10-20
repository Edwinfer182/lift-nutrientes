/* SUPGO: navegación pública compartida en fichas SEO. */
(function(){
 const ROOT='https://supgo.co/';
 const go=(params='')=>location.assign(ROOT+(params?'?'+params:''));
 const navigate=(kind,value='')=>{
  const q=new URLSearchParams();
  if(kind==='ofertas')q.set('ofertas','1');
  if(kind==='buscar')q.set('q',value);
  if(kind==='categoria')q.set('categoria',value);
  if(kind==='laboratorio')q.set('laboratorio',value);
  go(q.toString());
 };
 window.SupgoHeader={navigate,root:ROOT};
 if(document.documentElement.dataset.supgoHome==='1')return;
 window.showOffers=()=>navigate('ofertas');
 window.openOff=which=>{if(which==='filters')go('menu=1');else if(which==='cart')go('carrito=1');};
 window.liftCopyFilterLink=(kind,value)=>{
  const q=new URLSearchParams();
  q.set(kind==='ofertas'?'ofertas':kind==='categoria'?'categoria':'laboratorio',String(value||'1'));
  navigator.clipboard?.writeText(ROOT+'?'+q.toString());
 };
 function init(){
  const container=document.getElementById('supgo-global-header');
  if(!container)return;
  const input=container.querySelector('#q');
  if(input){
   input.addEventListener('keydown',e=>{if(e.key==='Enter'){e.preventDefault();navigate('buscar',input.value.trim());}});
   const form=input.closest('form');
   if(form)form.addEventListener('submit',e=>{e.preventDefault();navigate('buscar',input.value.trim());});
  }
  const brand=container.querySelector('.brand');
  if(brand&&!brand.matches('a[href]'))brand.addEventListener('click',()=>go());
  const results=container.querySelector('#searchResults');
  if(results)results.remove();
 }
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();

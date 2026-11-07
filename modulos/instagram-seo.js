/* SUPGO · "Instagram SEO" clásico unificado en el Estudio de redes (/control/redes/).
   Este archivo se conserva solo para que los botones antiguos del panel y de admin.html
   sigan funcionando: ahora abren el Estudio de redes con todas las funciones
   (productos, educación/calendario, TikTok y SEO por marca). */
(function(){
'use strict';
function go(qs){
 const url='/control/redes/'+(qs?'?'+qs:'');
 // Dentro de SUPGO CONTROL: cambiar a la herramienta en el mismo espacio de trabajo.
 try{
  if(window.top!==window&&window.top.location.pathname.startsWith('/control')){
   if(!qs){window.top.location.hash='redes';return}
  }
 }catch(e){}
 if(window.top!==window){try{window.top.location.href=url;return}catch(e){}}
 window.location.href=url;
}
function open(raw){
 raw=raw||{};const id=raw.id||raw.product?.id,name=raw.nombre||raw.name||raw.product?.name||'';
 go(id?'producto='+encodeURIComponent(id):name?'q='+encodeURIComponent(name):'');
}
function openSelector(tab){go(tab?'tab='+encodeURIComponent(tab):'')}
window.LiftInstagramSEO={open,openSelector,generate(){throw Error('Usa el Estudio de redes en /control/redes/')}};
})();

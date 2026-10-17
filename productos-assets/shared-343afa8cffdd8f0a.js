
(function(){
 const oldToggle=window.liftToggleOrderDetails;
 window.liftToggleOrderDetails=function(){
   if(typeof oldToggle==='function') oldToggle();
   const d=document.getElementById('liftCompactDetails');
   const b=document.querySelector('#liftTrackResult .liftCompactToggle');
   if(b&&d)b.textContent=d.classList.contains('open')?'Ocultar detalles ▴':'Ver detalles ▾';
 };
})();


(function(){
  /* El tracker moderno ya quedó como window.liftTrackOrder.
     El tracker viejo se conserva solo con nombre LegacyOld para no romper otras referencias. */
  const modern=window.liftTrackOrder;
  document.addEventListener('click',function(e){
    const b=e.target.closest && e.target.closest('#liftTrackModal button[onclick="liftTrackOrder()"]');
    if(!b || typeof modern!=='function') return;
    e.preventDefault();
    e.stopImmediatePropagation();
    modern();
  },true);
})();

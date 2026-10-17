
(function(){
  function syncFloatingCart(){
    var cart=document.getElementById('cart');
    var button=document.querySelector('button.floating');
    var open=!!cart && cart.classList.contains('open');
    document.body.classList.toggle('liftFloatingCartOpen',open);
    if(button){
      button.setAttribute('aria-expanded',String(open));
      button.setAttribute('aria-label',open?'Cerrar carrito':'Abrir carrito');
    }
  }
  window.liftToggleFloatingCart=function(){
    var cart=document.getElementById('cart');
    if(!cart)return;
    if(cart.classList.contains('open')){
      if(typeof window.closeOff==='function')window.closeOff();
    }else if(typeof window.openOff==='function')window.openOff('cart');
    syncFloatingCart();
  };
  function init(){
    var cart=document.getElementById('cart');
    if(cart && typeof MutationObserver!=='undefined'){
      new MutationObserver(syncFloatingCart).observe(cart,{attributes:true,attributeFilter:['class']});
    }
    syncFloatingCart();
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);
  else init();
})();

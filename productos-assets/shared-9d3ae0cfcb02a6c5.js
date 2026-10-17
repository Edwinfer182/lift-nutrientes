
(function(){
  function hideDuplicateCart(){
    if(innerWidth>760)return;
    const header=document.querySelector('header');
    if(!header)return;
    const headerCart=header.querySelector('.cartBtn,[aria-label*="carrito" i],[title*="carrito" i]');
    if(!headerCart)return;

    document.querySelectorAll('button,a').forEach(el=>{
      if(header.contains(el))return;
      const label=((el.getAttribute('aria-label')||'')+' '+(el.getAttribute('title')||'')+' '+(el.className||'')).toLowerCase();
      const fixed=getComputedStyle(el).position==='fixed';
      if(fixed && /cart|carrito/.test(label)){
        el.style.setProperty('display','none','important');
      }
    });
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',hideDuplicateCart);
  else hideDuplicateCart();
  addEventListener('resize',hideDuplicateCart);
})();

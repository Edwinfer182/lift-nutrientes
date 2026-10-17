
(function(){
  function refine(){
    const q=document.getElementById('q');
    if(q){
      q.placeholder='Buscar productos, marcas...';
      /* Añade lupa incluso si el HTML original no tiene wrapper específico */
      const p=q.parentElement;
      if(p && !p.classList.contains('liftSearchEnhanced')){
        p.classList.add('liftSearchEnhanced');
      }
    }
    const offer=document.querySelector('#offersBtn,.offersBtn,.offerBtn');
    if(offer && !offer.querySelector('.offerText')){
      [...offer.childNodes].forEach(n=>{
        if(n.nodeType===3 && /ofertas/i.test(n.textContent||'')){
          const sp=document.createElement('span');
          sp.className='offerText';
          sp.textContent=n.textContent.trim();
          n.replaceWith(sp);
        }
      });
    }
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',refine);
  else refine();
})();

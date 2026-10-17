
window.addEventListener('load',()=>{
  try{
    const qs=new URLSearchParams(location.search);
    const id=qs.get('producto');
    const buscar=qs.get('buscar');
    const ofertas=qs.get('ofertas');
    const cart=qs.get('cart');

    if(buscar){
      const q=document.getElementById('q');
      if(q){
        q.value=buscar;
        setTimeout(()=>{ if(typeof showAllSearchResults==='function') showAllSearchResults(buscar); },160);
      }
    }
    if(ofertas==='1'){
      setTimeout(()=>{ if(typeof showOffers==='function' && !state.offerOnly) showOffers(); },180);
    }
    if(cart==='1'){
      setTimeout(()=>{ if(typeof openOff==='function') openOff('cart'); },180);
    }
    if(id){
      setTimeout(()=>{ if(typeof openLiftProductById==='function') openLiftProductById(liftProductIdFromParam(id)); },180);
    }
  }catch(e){}
});

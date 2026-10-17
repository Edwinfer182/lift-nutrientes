
(function(){
  // OFERTAS: weekly_offers es la única fuente operativa. admin_meta no decide precio/regalo.
  function repaintGift(){
    try{
      if(document.querySelector('#liftMonoOff.open') && typeof window.liftRenderGiftInDetail==='function'){
        window.liftRenderGiftInDetail();
      }
    }catch(e){console.warn('LIFT regalo detalle:',e)}
  }
  const detail=document.getElementById('liftMonoOff');
  if(detail){
    new MutationObserver(repaintGift).observe(detail,{attributes:true,attributeFilter:['class'],childList:true,subtree:true});
  }
  document.addEventListener('click',function(e){
    if(e.target.closest('.card,.searchResult,.liftVariantChip,.pdfFlavorChip,.isoFlavorChip')) setTimeout(repaintGift,0);
  },true);
  window.addEventListener('pageshow',()=>setTimeout(repaintGift,0));
})();

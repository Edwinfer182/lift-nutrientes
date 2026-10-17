
(function(){
  /* La función existente inyecta Compartir como primer hijo. Lo movemos al final sin duplicarlo. */
  function reorder(){
    const foot=document.querySelector('#cart .cartfoot');
    const share=foot?.querySelector('.liftCartShareWrap');
    if(foot&&share&&foot.lastElementChild!==share)foot.appendChild(share);
  }
  const mo=new MutationObserver(()=>requestAnimationFrame(reorder));
  if(document.readyState==='loading'){
    document.addEventListener('DOMContentLoaded',()=>{
      const foot=document.querySelector('#cart .cartfoot');
      if(foot)mo.observe(foot,{childList:true});
      reorder();
    });
  }else{
    const foot=document.querySelector('#cart .cartfoot');
    if(foot)mo.observe(foot,{childList:true});
    reorder();
  }
})();

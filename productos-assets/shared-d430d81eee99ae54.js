
(function(){
  window.selectLaboratoryVisual = function(name){
    const mobileBody = document.querySelector('#filters .offbody');
    const desktopSidebar = document.querySelector('.sidebar');

    const mobileScroll = mobileBody ? mobileBody.scrollTop : 0;
    const desktopScroll = desktopSidebar ? desktopSidebar.scrollTop : 0;

    state.offerOnly = false;
    state.cat = 'Todos';
    state.brand = name;

    try{
      const q = document.getElementById('q');
      if(q) q.value = '';
      fullSearchActive = false;
    }catch(e){}

    render();

    const restore = ()=>{
      try{
        if(mobileBody) mobileBody.scrollTop = mobileScroll;
        if(desktopSidebar) desktopSidebar.scrollTop = desktopScroll;

        const visibleInput = [...document.querySelectorAll('#labVisualSearch')]
          .find(x => x.offsetParent !== null);

        if(typeof window.renderLaboratoryVisualGrid === 'function'){
          window.renderLaboratoryVisualGrid(visibleInput?.value || '');
        }

        if(mobileBody) mobileBody.scrollTop = mobileScroll;
        if(desktopSidebar) desktopSidebar.scrollTop = desktopScroll;
      }catch(e){}
    };

    requestAnimationFrame(()=>{
      restore();
      requestAnimationFrame(restore);
      setTimeout(restore,80);
    });
  };
})();

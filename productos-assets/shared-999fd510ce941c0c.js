
(function(){
  function isMobile(){
    return window.matchMedia('(max-width:760px)').matches;
  }

  function goToProductsArea(){
    if(!isMobile()) return;

    // Priorizamos la franja justo debajo del banner.
    const target =
      document.getElementById('liftDynamicQuickFilters') ||
      document.getElementById('status') ||
      document.getElementById('grid');

    if(!target) return;

    const top = target.getBoundingClientRect().top + window.pageYOffset - 10;
    window.scrollTo({
      top: Math.max(0, top),
      behavior: 'smooth'
    });
  }

  function afterFilter(){
    // Espera a que cierre el offcanvas y termine el render.
    setTimeout(goToProductsArea, 180);
    setTimeout(goToProductsArea, 360);
  }

  // Laboratorios
  const prevLabSelect = window.selectLaboratoryVisual;
  if(typeof prevLabSelect === 'function'){
    window.selectLaboratoryVisual = function(name){
      const result = prevLabSelect(name);
      if(isMobile()) afterFilter();
      return result;
    };
  }

  // Categorías
  document.addEventListener('click', e=>{
    if(!isMobile()) return;

    const btn = e.target.closest('.filterItem');
    if(!btn) return;

    const categoryTab = [...document.querySelectorAll('.filterTab')]
      .find(t => /Categorías/i.test(t.textContent || ''));

    if(categoryTab && categoryTab.classList.contains('on')){
      afterFilter();
    }
  }, true);
})();

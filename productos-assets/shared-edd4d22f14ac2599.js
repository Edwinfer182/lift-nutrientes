
(function(){
  function closeMobileFiltersIfOpen(){
    try{
      const off = document.getElementById('filters');
      if(!off) return;

      // Compatibilidad con las distintas implementaciones del catálogo.
      if(typeof window.closeOff === 'function'){
        window.closeOff();
        return;
      }

      off.classList.remove('open','show','active');
      off.setAttribute('aria-hidden','true');
      document.body.style.overflow='';
    }catch(e){}
  }

  // Conserva la función actual y añade cierre móvil.
  const prevLabSelect = window.selectLaboratoryVisual;
  if(typeof prevLabSelect === 'function'){
    window.selectLaboratoryVisual = function(name){
      const result = prevLabSelect(name);
      if(window.matchMedia('(max-width:760px)').matches){
        setTimeout(closeMobileFiltersIfOpen,30);
      }
      return result;
    };
  }

  // Intercepta selección de categorías en móvil.
  document.addEventListener('click',e=>{
    const btn = e.target.closest('.filterItem');
    if(!btn) return;

    const panel = btn.closest('.filterPanel');
    const tabs = document.querySelectorAll('.filterTab');
    const categoryTab = [...tabs].find(t=>/Categorías/i.test(t.textContent||''));

    // Si estamos en el panel de categorías y se selecciona una categoría, cerrar.
    if(
      window.matchMedia('(max-width:760px)').matches &&
      categoryTab &&
      categoryTab.classList.contains('on')
    ){
      setTimeout(closeMobileFiltersIfOpen,30);
    }
  },true);
})();

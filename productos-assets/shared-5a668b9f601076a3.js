
(function(){
  const oldToggle=window.liftToggleAdminMenu;
  window.liftToggleAdminMenu=function(btn){
    const wrap=btn?.parentElement;
    const menu=wrap?.querySelector('.liftAdminDropdown');
    if(!menu)return;
    const card=btn.closest('.labVisualCard,.grid .card');
    const willOpen=!menu.classList.contains('open');

    document.querySelectorAll('.liftMenuOpen').forEach(el=>el.classList.remove('liftMenuOpen'));
    if(typeof window.liftCloseAdminMenus==='function') window.liftCloseAdminMenus(menu);

    menu.classList.toggle('open',willOpen);
    btn.setAttribute('aria-expanded',willOpen?'true':'false');
    if(card && willOpen) card.classList.add('liftMenuOpen');
  };

  const oldClose=window.liftCloseAdminMenus;
  window.liftCloseAdminMenus=function(except){
    document.querySelectorAll('.liftAdminDropdown.open').forEach(menu=>{
      if(menu!==except) menu.classList.remove('open');
    });
    document.querySelectorAll('.liftAdminMenuToggle[aria-expanded="true"]').forEach(btn=>{
      const menu=btn.parentElement?.querySelector('.liftAdminDropdown');
      if(menu!==except) btn.setAttribute('aria-expanded','false');
    });
    document.querySelectorAll('.liftMenuOpen').forEach(card=>{
      const openMenu=card.querySelector('.liftAdminDropdown.open');
      if(!openMenu || openMenu!==except) card.classList.remove('liftMenuOpen');
    });
  };
})();


(function(){
  window.liftCloseAdminMenus=function(except){
    document.querySelectorAll('.liftAdminDropdown.open').forEach(menu=>{
      if(menu!==except) menu.classList.remove('open');
    });
    document.querySelectorAll('.liftAdminMenuToggle[aria-expanded="true"]').forEach(btn=>{
      const menu=btn.parentElement?.querySelector('.liftAdminDropdown');
      if(menu!==except) btn.setAttribute('aria-expanded','false');
    });
  };
  window.liftToggleAdminMenu=function(btn){
    const wrap=btn?.parentElement;
    const menu=wrap?.querySelector('.liftAdminDropdown');
    if(!menu)return;
    const willOpen=!menu.classList.contains('open');
    window.liftCloseAdminMenus(menu);
    menu.classList.toggle('open',willOpen);
    btn.setAttribute('aria-expanded',willOpen?'true':'false');
  };
  document.addEventListener('click',e=>{
    if(!e.target.closest('.liftCardAdminMenuWrap,.liftLabAdminMenuWrap')) window.liftCloseAdminMenus();
  });
  document.addEventListener('keydown',e=>{
    if(e.key==='Escape') window.liftCloseAdminMenus();
  });
})();


(function(){
  let active=null;
  function close(){
    if(!active)return;
    const {menu,wrap,button,card}=active;
    menu.classList.remove('open','liftAdminPortal');
    menu.style.removeProperty('left');menu.style.removeProperty('top');
    if(wrap.isConnected)wrap.appendChild(menu);else menu.remove();
    button.setAttribute('aria-expanded','false');
    card?.classList.remove('liftMenuOpen');
    active=null;
  }
  function place(){
    if(!active)return;
    const {menu,button}=active;
    if(!button.isConnected){close();return;}
    const rect=button.getBoundingClientRect();
    const w=menu.offsetWidth,h=menu.offsetHeight,pad=8;
    const left=Math.max(pad,Math.min(rect.right-w,window.innerWidth-w-pad));
    const above=rect.top-h-7;
    const below=rect.bottom+7;
    const top=above>=pad?above:(below+h<=window.innerHeight-pad?below:Math.max(pad,Math.min(below,window.innerHeight-h-pad)));
    menu.style.setProperty('left',left+'px','important');
    menu.style.setProperty('top',top+'px','important');
  }
  window.liftCloseAdminMenus=function(except){
    if(active && active.menu!==except)close();
  };
  window.liftToggleAdminMenu=function(button){
    if(active?.button===button){close();return;}
    close();
    const wrap=button?.closest('.liftCardAdminMenuWrap,.liftLabAdminMenuWrap');
    const menu=wrap?.querySelector('.liftAdminDropdown');
    if(!menu)return;
    const card=button.closest('.labVisualCard,.grid .card');
    active={menu,wrap,button,card};
    document.body.appendChild(menu);
    menu.classList.add('liftAdminPortal','open');
    button.setAttribute('aria-expanded','true');
    place();
  };
  document.addEventListener('click',e=>{
    if(active && !active.menu.contains(e.target) && !active.button.contains(e.target))close();
  },true);
  document.addEventListener('keydown',e=>{if(e.key==='Escape')close();},true);
  window.addEventListener('resize',place,{passive:true});
  window.addEventListener('scroll',()=>{if(active)close();},{capture:true,passive:true});
})();

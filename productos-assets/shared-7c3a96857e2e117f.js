
(function(){
 const ADMIN_PASSWORD='Thomas2026fer';
 const SESSION_KEY='liftAdminUnlockedV1';
 const $=id=>document.getElementById(id);
 function unlocked(){try{return sessionStorage.getItem(SESSION_KEY)==='1'}catch(e){return false}}
 function sync(){document.body.classList.toggle('liftAdminUnlocked',unlocked())}
 window.openLiftAdminAccess=function(){if(unlocked()){if(typeof window.openLiftAdminFull==='function')window.openLiftAdminFull();return}const m=$('liftAdminAccessModal');if(m)m.classList.add('open');const i=$('liftAdminAccessPassword');if(i){i.value='';setTimeout(()=>i.focus(),40)}const e=$('liftAdminAccessError');if(e)e.textContent=''};
 window.closeLiftAdminAccess=function(){const m=$('liftAdminAccessModal');if(m)m.classList.remove('open')};
 window.unlockLiftAdmin=function(){const i=$('liftAdminAccessPassword'),e=$('liftAdminAccessError');if(!i)return;if(i.value===ADMIN_PASSWORD){try{sessionStorage.setItem(SESSION_KEY,'1');sessionStorage.setItem('liftAdminCloudPasswordV1',ADMIN_PASSWORD)}catch(x){}sync();closeLiftAdminAccess();if(typeof window.openLiftAdminFull==='function')window.openLiftAdminFull()}else{if(e)e.textContent='Clave incorrecta.';i.select()}};
 window.lockLiftAdmin=function(){try{sessionStorage.removeItem(SESSION_KEY);sessionStorage.removeItem('liftAdminCloudPasswordV1')}catch(e){}sync();if(typeof window.closeLiftAdminFull==='function')window.closeLiftAdminFull();try{const u=new URL(location.href);u.searchParams.delete('admin');u.searchParams.delete('fer');history.replaceState(null,'',u.pathname+u.search+u.hash)}catch(e){}};
 function initPrivateAdmin(){
  const params=new URLSearchParams(location.search);
  const ferRoute=params.has('fer') || (params.get('admin')||'').toLowerCase()==='fer';
  const adminRoute=(params.get('admin')||'').toLowerCase()==='lift';
  if(ferRoute){
    try{
      sessionStorage.setItem(SESSION_KEY,'1');
      sessionStorage.setItem('liftAdminCloudPasswordV1',ADMIN_PASSWORD);
    }catch(e){}
  }
  sync();
  if(ferRoute){
    if(typeof window.openLiftAdminFull==='function')setTimeout(()=>window.openLiftAdminFull(),120);
  }else if(adminRoute){
    if(unlocked()){if(typeof window.openLiftAdminFull==='function')setTimeout(()=>window.openLiftAdminFull(),80);}
    else setTimeout(()=>window.openLiftAdminAccess(),80);
  }
 }
 const originalOpen=window.openLiftAdminFull;
 if(typeof originalOpen==='function')window.openLiftAdminFull=function(){if(!unlocked()){openLiftAdminAccess();return}return originalOpen.apply(this,arguments)};
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',initPrivateAdmin);else initPrivateAdmin();
})();


(function(){
 const SESSION_KEY='liftAdminUnlockedV1';
 // La clave NO vive en el código: Supabase la verifica (lift_admin_login).
 const LOGIN_RPC='https://vdxkknftyssjyfbdieqa.supabase.co/rest/v1/rpc/lift_admin_login';
 const LOGIN_KEY='sb_publishable_ECuhXuKIb85kj9fgdEjrAw_O7uNpZsh';
 async function verifyAdmin(p){const r=await fetch(LOGIN_RPC,{method:'POST',headers:{apikey:LOGIN_KEY,'Content-Type':'application/json'},body:JSON.stringify({p_password:String(p||'')})});if(!r.ok)throw Error('No se pudo verificar la clave. Revisa tu conexión.');return (await r.json())===true}
 const $=id=>document.getElementById(id);
 function unlocked(){try{return sessionStorage.getItem(SESSION_KEY)==='1'}catch(e){return false}}
 function sync(){document.body.classList.toggle('liftAdminUnlocked',unlocked())}
 window.openLiftAdminAccess=function(){if(unlocked()){if(typeof window.openLiftAdminFull==='function')window.openLiftAdminFull();return}const m=$('liftAdminAccessModal');if(m)m.classList.add('open');const i=$('liftAdminAccessPassword');if(i){i.value='';setTimeout(()=>i.focus(),40)}const e=$('liftAdminAccessError');if(e)e.textContent=''};
 window.closeLiftAdminAccess=function(){const m=$('liftAdminAccessModal');if(m)m.classList.remove('open')};
 window.unlockLiftAdmin=async function(){const i=$('liftAdminAccessPassword'),e=$('liftAdminAccessError');if(!i)return;const pass=i.value;if(e)e.textContent='Verificando…';let ok=false;try{ok=await verifyAdmin(pass)}catch(x){if(e)e.textContent=x.message;return}if(ok){try{sessionStorage.setItem(SESSION_KEY,'1');sessionStorage.setItem('liftAdminCloudPasswordV1',pass)}catch(x){}if(e)e.textContent='';sync();closeLiftAdminAccess();if(typeof window.openLiftAdminFull==='function')window.openLiftAdminFull()}else{if(e)e.textContent='Clave incorrecta.';i.select()}};
 window.lockLiftAdmin=function(){try{sessionStorage.removeItem(SESSION_KEY);sessionStorage.removeItem('liftAdminCloudPasswordV1')}catch(e){}sync();if(typeof window.closeLiftAdminFull==='function')window.closeLiftAdminFull();try{const u=new URL(location.href);u.searchParams.delete('admin');u.searchParams.delete('fer');history.replaceState(null,'',u.pathname+u.search+u.hash)}catch(e){}};
 function initPrivateAdmin(){
  const params=new URLSearchParams(location.search);
  const ferRoute=params.has('fer') || (params.get('admin')||'').toLowerCase()==='fer';
  const adminRoute=(params.get('admin')||'').toLowerCase()==='lift';
  sync();
  // ?fer ya no inicia sesión sin clave: se comporta igual que ?admin=lift.
  if(ferRoute||adminRoute){
    if(unlocked()){if(typeof window.openLiftAdminFull==='function')setTimeout(()=>window.openLiftAdminFull(),80);}
    else setTimeout(()=>window.openLiftAdminAccess(),80);
  }
 }
 const originalOpen=window.openLiftAdminFull;
 if(typeof originalOpen==='function')window.openLiftAdminFull=function(){if(!unlocked()){openLiftAdminAccess();return}return originalOpen.apply(this,arguments)};
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',initPrivateAdmin);else initPrivateAdmin();
})();

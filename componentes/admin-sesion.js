/* SUPGO · Sesión del administrador recordada en este dispositivo.
   - Tras entrar (con clave o con Google) se pide un token de dispositivo a lift-admin-google
     y se guarda en localStorage. El token no es la clave y se puede revocar.
   - En cada página del administrador, si la pestaña no tiene sesión, se recupera con el token
     ANTES de que corra el resto del código, así todo funciona como si se hubiera escrito la clave.
   - «Salir» borra el token de este dispositivo. */
(function(){
 var FN='https://vdxkknftyssjyfbdieqa.supabase.co/functions/v1/lift-admin-google';
 var KEY='sb_publishable_ECuhXuKIb85kj9fgdEjrAw_O7uNpZsh';
 var T='liftAdminDeviceV1',P='liftAdminCloudPasswordV1',U='liftAdminUnlockedV1',S='liftAdminSalidaV1',D='liftAdminDesdeV1';
 function ss(k,v){try{if(v===undefined)return sessionStorage.getItem(k);sessionStorage.setItem(k,v)}catch(e){return null}}
 function ls(k,v){try{if(v===undefined)return localStorage.getItem(k);if(v===null)localStorage.removeItem(k);else localStorage.setItem(k,v)}catch(e){return null}}
 function post(body,sync,cb){
  try{var x=new XMLHttpRequest();x.open('POST',FN,!sync);x.setRequestHeader('Content-Type','application/json');x.setRequestHeader('apikey',KEY);
   if(!sync)x.onloadend=function(){if(cb)cb(x)};x.send(JSON.stringify(body));return x}catch(e){return null}
 }
 function json(x){try{return JSON.parse(x.responseText)}catch(e){return {}}}

 // 1) Recuperar la sesión (bloquea un instante solo si esta pestaña aún no tiene sesión)
 var tok=ls(T);
 if(tok&&!ss(P)){
  var x=post({action:'resume',token:tok},true);
  if(x&&x.status===200){var j=json(x);if(j.password){ss(P,j.password);ss(U,'1');ss(D,String(Date.now()))}}
  else if(x&&x.status===401)ls(T,null);
 }

 // 2) Crear el token cuando se entra, y 3) revocarlo al salir
 var had=!!ss(P),pidiendo=false;
 function revisar(){
  var p=ss(P),t=ls(T);
  // Salió en otra pestaña de este dispositivo: cerrar también aquí
  if(p&&Number(ls(S)||0)>Number(ss(D)||0)){had=false;try{sessionStorage.removeItem(P);sessionStorage.removeItem(U)}catch(e){}if(typeof window.lockLiftAdmin==='function')try{window.lockLiftAdmin()}catch(e){}else location.reload();return}
  if(p&&!had)ss(D,String(Date.now()));
  if(p&&ss(U)==='1'&&!t&&!pidiendo){
   pidiendo=true;
   post({action:'device',password:p,etiqueta:navigator.userAgent},false,function(r){pidiendo=false;if(r.status===200){var j=json(r);if(j.token)ls(T,j.token)}});
  }
  if(had&&!p){ls(S,String(Date.now()));if(t){ls(T,null);post({action:'revoke',token:t},false)}}
  had=!!p;
 }
 setInterval(revisar,1500);
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',revisar);else revisar();
 window.addEventListener('pagehide',revisar);
})();

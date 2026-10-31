/* SUPGO · Cuenta del cliente (compartido).
   - window.SupgoCuenta: sesión guardada en este navegador + llamadas a la función lift-cuenta.
   - Ícono "Mi cuenta" en el header.
   - Favoritos sincronizados con la cuenta (liftFavoritesV1 sigue siendo la fuente local).
   - Código de referido (?ref=CODIGO) guardado para aplicarlo en el checkout. */
(function(){
'use strict';
if(window.SupgoCuenta)return;
var FN='https://vdxkknftyssjyfbdieqa.supabase.co/functions/v1/lift-cuenta';
var KEY='sb_publishable_ECuhXuKIb85kj9fgdEjrAw_O7uNpZsh';
var SESSION='supgoCuentaV1',FAV='liftFavoritesV1',FAV_MARK='supgoFavSyncV1',REF='supgoRefCodeV1';
var rawSet=Storage.prototype.setItem;

function read(k){try{return JSON.parse(localStorage.getItem(k)||'null')}catch(e){return null}}
function write(k,v){try{rawSet.call(localStorage,k,JSON.stringify(v))}catch(e){}}
function del(k){try{localStorage.removeItem(k)}catch(e){}}
function get(){var s=read(SESSION);return s&&typeof s.token==='string'&&/^[0-9a-f]{64}$/.test(s.token)?s:null}
function setSession(s){write(SESSION,s);emit()}
function emit(){try{window.dispatchEvent(new Event('supgo-cuenta-change'))}catch(e){}}

function api(action,data){
  var s=get(),body=Object.assign({action:action},data||{});
  if(s&&!body.token&&action!=='send-code'&&action!=='verify-code')body.token=s.token;
  return fetch(FN,{method:'POST',headers:{apikey:KEY,'Content-Type':'application/json'},body:JSON.stringify(body),keepalive:action==='address-save'||action==='favorites-set'||action==='profile'})
    .then(function(r){return r.json().catch(function(){return {}}).then(function(j){
      if(r.status===401&&action!=='verify-code'){del(SESSION);del(FAV_MARK);emit()}
      if(!r.ok||!j.ok){var e=new Error(j.error||'No pudimos conectar. Inténtalo de nuevo.');e.status=r.status;throw e}
      return j})});
}
function logout(){var s=get();if(s)api('logout').catch(function(){});del(SESSION);del(FAV_MARK);emit()}

/* ---------- Favoritos ---------- */
function localFavs(){var x=read(FAV);return (Array.isArray(x)?x:[]).map(Number).filter(function(n){return Number.isInteger(n)&&n>0})}
var pushTimer,syncing=false;
function pushFavs(list){var s=get();if(!s||syncing)return;clearTimeout(pushTimer);pushTimer=setTimeout(function(){api('favorites-set',{productos:list}).catch(function(){})},600)}
try{
  Storage.prototype.setItem=function(k,v){
    rawSet.apply(this,arguments);
    if(this===window.localStorage&&k===FAV&&get()&&!syncing){try{pushFavs(localFavs())}catch(e){}}
  };
}catch(e){}
function syncFavs(){
  var s=get();if(!s)return Promise.resolve();
  return api('favorites-get').then(function(j){
    var server=(j.favoritos||[]).map(Number),local=localFavs(),mark=read(FAV_MARK);
    var same=server.length===local.length&&server.every(function(x){return local.indexOf(x)>=0});
    syncing=true;
    try{
      if(mark===s.email){if(!same){write(FAV,server);window.dispatchEvent(new Event('supgo-favorites-change'))}}
      else{
        var all=server.slice();local.forEach(function(x){if(all.indexOf(x)<0)all.push(x)});
        write(FAV,all);write(FAV_MARK,s.email);
        if(all.length!==server.length)api('favorites-set',{productos:all}).catch(function(){});
        if(all.length!==local.length)window.dispatchEvent(new Event('supgo-favorites-change'));
      }
    }finally{syncing=false}
  }).catch(function(){});
}

/* ---------- Referidos ---------- */
function captureRef(){
  try{
    var q=new URLSearchParams(location.search),r=(q.get('ref')||'').trim().toUpperCase().replace(/[^A-Z0-9]/g,'').slice(0,20);
    if(r.length>=4){write(REF,{codigo:r,t:Date.now()});toast('Tienes un descuento de bienvenida: usa el código '+r+' al finalizar tu compra.')}
  }catch(e){}
}
function refCode(){var r=read(REF);if(!r||!r.codigo)return '';if(Date.now()-Number(r.t||0)>30*864e5){del(REF);return ''}return r.codigo}

function toast(msg){
  function show(){var t=document.createElement('div');t.textContent=msg;t.setAttribute('role','status');
    t.style.cssText='position:fixed;left:50%;bottom:22px;transform:translateX(-50%);z-index:2147483000;background:#111;color:#fff;font:500 13px Poppins,Arial,sans-serif;padding:12px 16px;border-radius:12px;box-shadow:0 10px 30px rgba(0,0,0,.25);max-width:min(92vw,420px);text-align:center';
    document.body.appendChild(t);setTimeout(function(){t.style.transition='opacity .4s';t.style.opacity='0';setTimeout(function(){t.remove()},450)},5200)}
  if(document.body)show();else document.addEventListener('DOMContentLoaded',show);
}

/* ---------- Ícono en el header ---------- */
var ICON='<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="8" r="4"/><path d="M4 21c1.5-4 4.5-6 8-6s6.5 2 8 6"/></svg>';
function paintLink(a){var s=get();a.title=s?'Mi cuenta':'Entrar o crear cuenta';a.setAttribute('aria-label',a.title);a.classList.toggle('on',!!s)}
function mountIcon(){
  var bar=document.querySelector('#supgo-global-header .bar, header.top .bar');if(!bar)return false;
  if(bar.querySelector('.supgo-account-link'))return true;
  var a=document.createElement('a');a.href='/cuenta/';a.className='iconbtn supgo-account-link';a.innerHTML=ICON;
  a.style.cssText='display:inline-flex;align-items:center;justify-content:center;position:relative';
  var fav=bar.querySelector('.supgo-fav-link'),cart=bar.querySelector('.cartDesktop');
  if(fav)fav.before(a);else if(cart)cart.before(a);else bar.appendChild(a);
  paintLink(a);window.addEventListener('supgo-cuenta-change',function(){paintLink(a)});
  if(!document.getElementById('supgo-account-css')){var st=document.createElement('style');st.id='supgo-account-css';st.textContent='.supgo-account-link.on::after{content:"";position:absolute;top:6px;right:6px;width:8px;height:8px;border-radius:50%;background:#c8f34b;box-shadow:0 0 0 2px #111}';document.head.appendChild(st)}
  return true;
}
function waitHeader(){
  if(mountIcon())return;
  var n=0,iv=setInterval(function(){if(mountIcon()||++n>40)clearInterval(iv)},250);
}

window.SupgoCuenta={get:get,set:setSession,api:api,logout:logout,syncFavs:syncFavs,refCode:refCode,clearRef:function(){del(REF)},toast:toast};
captureRef();
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',function(){waitHeader();syncFavs()});else{waitHeader();syncFavs()}
})();

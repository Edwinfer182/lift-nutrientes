/* SUPGO · Privacidad y avisos legales (compartido en todo el sitio).
   - Aviso de cookies: Google Analytics solo se carga si la persona acepta (Ley 1581 de 2012:
     autorización previa, expresa e informada). Rechazar es tan fácil como aceptar.
   - La elección se guarda en este navegador y se registra (fecha, versión y elección) como prueba.
   - Pie con enlaces a la política de datos y a las preferencias de cookies.
   window.SupgoCookies.open() vuelve a mostrar el aviso. */
(function(){
'use strict';
if(window.SupgoCookies)return;
var KEY='supgoCookiesV1',VERSION='2026-11-01',GA_ID='G-GZL00MPW16';
var LOG='https://vdxkknftyssjyfbdieqa.supabase.co/functions/v1/lift-privacidad';
var APIKEY='sb_publishable_ECuhXuKIb85kj9fgdEjrAw_O7uNpZsh';
var IDENT={marca:'SUPGO',ciudad:'Medellín, Colombia',whatsapp:'313 738 0766',wa:'573137380766'};

function read(){try{var c=JSON.parse(localStorage.getItem(KEY)||'null');return c&&c.v===VERSION?c:null}catch(e){return null}}
function gtagq(){window.dataLayer=window.dataLayer||[];window.dataLayer.push(arguments)}
function killGa(){
  try{document.cookie.split(';').forEach(function(x){var n=x.split('=')[0].trim();if(/^_ga|^_gid|^_gat/.test(n)){['','.supgo.co','supgo.co','.'+location.hostname].forEach(function(d){document.cookie=n+'=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/'+(d?';domain='+d:'')})}})}catch(e){}
}
var gaLoaded=false;
function loadGa(){
  if(gaLoaded)return;gaLoaded=true;
  gtagq('consent','update',{analytics_storage:'granted'});
  // Solo páginas que ya usaban Analytics (definen gtag y su configuración).
  var s=document.createElement('script');s.async=true;s.src='https://www.googletagmanager.com/gtag/js?id='+GA_ID;document.head.appendChild(s);
}
function apply(c){
  if(c&&c.a){if(window.SUPGO_GA)loadGa()}
  else{gtagq('consent','update',{analytics_storage:'denied',ad_storage:'denied',ad_user_data:'denied',ad_personalization:'denied'});killGa()}
}
function rid(){try{return crypto.randomUUID()}catch(e){return String(Date.now())+Math.random().toString(16).slice(2)}}
function save(a){
  var c={a:!!a,t:new Date().toISOString(),v:VERSION,id:(read()||{}).id||rid()};
  try{localStorage.setItem(KEY,JSON.stringify(c))}catch(e){}
  try{fetch(LOG,{method:'POST',keepalive:true,headers:{apikey:APIKEY,'Content-Type':'application/json'},body:JSON.stringify({action:'consent',id:c.id,analitica:c.a,version:VERSION,pagina:location.pathname.slice(0,120)})}).catch(function(){})}catch(e){}
  if(!a&&gaLoaded){apply(c);location.reload();return}
  apply(c);close();
}

/* ---------- Aviso ---------- */
var box;
function css(){
  if(document.getElementById('supgo-priv-css'))return;
  var st=document.createElement('style');st.id='supgo-priv-css';
  st.textContent='#supgo-cookies{position:fixed;left:12px;right:12px;bottom:12px;z-index:2147483300;max-width:560px;margin:0 auto;background:#fff;color:#111;border:1px solid #e5e5e5;border-radius:16px;box-shadow:0 14px 40px rgba(0,0,0,.18);padding:16px 16px 14px;font:400 13px/1.5 Poppins,system-ui,-apple-system,"Segoe UI",Arial,sans-serif}'
  +'#supgo-cookies b{display:block;font-size:14px;margin-bottom:4px}#supgo-cookies p{margin:0 0 12px;color:#333}#supgo-cookies a{color:#111;font-weight:600}'
  +'#supgo-cookies .row{display:flex;gap:8px}#supgo-cookies button{flex:1;height:42px;border-radius:10px;font:600 14px Poppins,Arial,sans-serif;cursor:pointer;border:1px solid #111}'
  +'#supgo-cookies .no{background:#fff;color:#111}#supgo-cookies .yes{background:#111;color:#fff}'
  +'.supgo-legal{margin:28px auto 0;padding:18px 16px calc(18px + env(safe-area-inset-bottom,0px));border-top:1px solid #e6e6e6;color:#666;font:400 12px/1.7 Poppins,system-ui,Arial,sans-serif;text-align:center;background:transparent}'
  +'.supgo-legal nav{display:flex;flex-wrap:wrap;justify-content:center;gap:4px 14px;margin-bottom:6px}.supgo-legal a,.supgo-legal button{color:#444;text-decoration:underline;background:none;border:0;padding:0;font:inherit;cursor:pointer}';
  document.head.appendChild(st);
}
function open(){
  css();if(box){box.hidden=false;return}
  box=document.createElement('div');box.id='supgo-cookies';box.setAttribute('role','dialog');box.setAttribute('aria-label','Aviso de cookies');
  box.innerHTML='<b>Tu privacidad</b><p>Usamos almacenamiento propio necesario para que la tienda funcione (carrito, favoritos y sesión). Si aceptas, también usamos cookies de Google Analytics para medir visitas y mejorar la tienda. Puedes cambiar tu elección cuando quieras. <a href="/tratamiento-de-datos/#cookies">Más información</a></p><div class="row"><button type="button" class="no">Rechazar</button><button type="button" class="yes">Aceptar</button></div>';
  box.querySelector('.no').onclick=function(){save(false)};
  box.querySelector('.yes').onclick=function(){save(true)};
  (document.body||document.documentElement).appendChild(box);
}
function close(){if(box)box.hidden=true}

/* ---------- Pie legal ---------- */
function footer(){
  if(document.querySelector('.supgo-legal')||document.documentElement.hasAttribute('data-sin-pie-legal'))return;
  css();
  var f=document.createElement('footer');f.className='supgo-legal';
  f.innerHTML='<nav aria-label="Privacidad"><a href="/tratamiento-de-datos/">Tratamiento de datos personales</a><a href="/tratamiento-de-datos/#cookies">Cookies</a><button type="button" class="pc">Preferencias de cookies</button></nav>'
   +'<div>'+IDENT.marca+' · '+IDENT.ciudad+' · WhatsApp <a href="https://wa.me/'+IDENT.wa+'" rel="noopener">'+IDENT.whatsapp+'</a></div>';
  f.querySelector('.pc').onclick=open;
  document.body.appendChild(f);
}

window.SupgoCookies={open:open,get:read,accept:function(){save(true)},reject:function(){save(false)}};
var c=read();apply(c);
function boot(){footer();if(!c)open()}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot);else boot();
})();

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
  +'.supgo-legal{margin:36px 0 0;padding:30px 18px calc(22px + env(safe-area-inset-bottom,0px));background:#111315;color:#cfd2d6;font:400 13px/1.6 Poppins,system-ui,Arial,sans-serif;text-align:left}'
  +'.supgo-legal .sl-in{max-width:1160px;margin:0 auto;display:grid;grid-template-columns:1.4fr repeat(3,1fr);gap:22px}'
  +'.supgo-legal .sl-brand b{display:block;color:#fff;font-size:18px;letter-spacing:.12em;margin-bottom:6px}.supgo-legal .sl-brand span{color:#9aa0a6;font-size:12.5px;max-width:280px;display:block}'
  +'.supgo-legal .sl-col{display:flex;flex-direction:column;gap:6px}.supgo-legal .sl-col b{color:#fff;font-size:12px;letter-spacing:.08em;text-transform:uppercase;margin-bottom:2px}'
  +'.supgo-legal a,.supgo-legal button{color:#cfd2d6;text-decoration:none;background:none;border:0;padding:0;font:inherit;cursor:pointer;text-align:left;width:fit-content}.supgo-legal a:hover,.supgo-legal button:hover{color:#c8f34b}'
  +'.supgo-legal .sl-bottom{max-width:1160px;margin:22px auto 0;padding-top:14px;border-top:1px solid #2a2d31;color:#80868b;font-size:12px}'
  +'@media(max-width:760px){.supgo-legal .sl-in{grid-template-columns:1fr 1fr;gap:20px 16px}.supgo-legal .sl-brand{grid-column:1/-1}}'
  +'#supgo-wa-btn{position:fixed;right:16px;bottom:calc(18px + env(safe-area-inset-bottom,0px));z-index:9000;display:grid;place-items:center;width:50px;height:50px;border-radius:50%;background:#25d366;color:#fff;box-shadow:0 6px 18px rgba(0,0,0,.22);transition:transform .2s,opacity .2s}'
  +'#supgo-wa-btn svg{width:27px;height:27px}#supgo-wa-btn.sw-hide{opacity:0;transform:scale(.6);pointer-events:none}'
  +'@media(max-width:760px){#supgo-wa-btn{width:46px;height:46px;right:12px}}';
  document.head.appendChild(st);
}
function open(){
  css();if(box){box.hidden=false;try{waQueue()}catch(e){}return}
  box=document.createElement('div');box.id='supgo-cookies';box.setAttribute('role','dialog');box.setAttribute('aria-label','Aviso de cookies');
  box.innerHTML='<b>Tu privacidad</b><p>Usamos almacenamiento propio necesario para que la tienda funcione (carrito, favoritos y sesión). Si aceptas, también usamos cookies de Google Analytics para medir visitas y mejorar la tienda. Puedes cambiar tu elección cuando quieras. <a href="/tratamiento-de-datos/#cookies">Más información</a></p><div class="row"><button type="button" class="no">Rechazar</button><button type="button" class="yes">Aceptar</button></div>';
  box.querySelector('.no').onclick=function(){save(false)};
  box.querySelector('.yes').onclick=function(){save(true)};
  (document.body||document.documentElement).appendChild(box);
  try{waQueue()}catch(e){}
}
function close(){if(box)box.hidden=true;try{waQueue()}catch(e){}}

/* ---------- Pie de página ---------- */
var WA_ICON='<svg viewBox="0 0 32 32" width="22" height="22" aria-hidden="true" fill="currentColor"><path d="M16 3C8.8 3 3 8.7 3 15.8c0 2.5.7 4.9 2 7L3 29l6.4-2c2 1.1 4.3 1.7 6.6 1.7 7.2 0 13-5.7 13-12.8S23.2 3 16 3zm0 23.4c-2.1 0-4.1-.6-5.9-1.7l-.4-.3-3.8 1.2 1.2-3.7-.3-.4c-1.2-1.8-1.8-3.8-1.8-5.9C5 9.9 9.9 5.2 16 5.2s11 4.7 11 10.6-4.9 10.6-11 10.6zm6-7.9c-.3-.2-1.9-.9-2.2-1s-.5-.2-.7.2-.8 1-1 1.2-.4.2-.7.1c-.3-.2-1.4-.5-2.6-1.6-1-.9-1.6-1.9-1.8-2.2s0-.5.1-.7l.5-.6c.2-.2.2-.4.3-.6s0-.4 0-.6l-1-2.4c-.3-.6-.5-.5-.7-.5h-.6c-.2 0-.6.1-.9.4s-1.2 1.1-1.2 2.7 1.2 3.1 1.4 3.4c.2.2 2.3 3.5 5.6 4.9.8.3 1.4.5 1.9.7.8.2 1.5.2 2.1.1.6-.1 1.9-.8 2.2-1.5s.3-1.3.2-1.5c-.1-.1-.3-.2-.6-.3z"/></svg>';
function waLink(){return 'https://wa.me/'+IDENT.wa+'?text='+encodeURIComponent('Hola SUPGO, quiero asesoría sobre suplementos.\n'+location.href)}
function footer(){
  if(document.querySelector('.supgo-legal')||document.documentElement.hasAttribute('data-sin-pie-legal'))return;
  css();
  var f=document.createElement('footer');f.className='supgo-legal';
  f.innerHTML='<div class="sl-in">'
   +'<div class="sl-brand"><b>SUPGO</b><span>Suplementos deportivos con entrega en Medellín y envíos a toda Colombia.</span></div>'
   +'<nav class="sl-col" aria-label="Tienda"><b>Tienda</b><a href="/categorias/">Categorías</a><a href="/laboratorios/">Marcas</a><a href="/ofertas/">Ofertas</a><a href="/guias/">Guías de compra</a></nav>'
   +'<nav class="sl-col" aria-label="Ayuda"><b>Ayuda</b><a href="/mi-pedido/">Mi pedido</a><a href="/cuenta/">Mi cuenta</a><a href="/politica-de-devoluciones/">Devoluciones y garantías</a><a class="sl-wa" href="'+waLink()+'" target="_blank" rel="noopener">Escríbenos</a></nav>'
   +'<nav class="sl-col" aria-label="Privacidad"><b>Privacidad</b><a href="/tratamiento-de-datos/">Datos personales</a><a href="/tratamiento-de-datos/#cookies">Cookies</a><button type="button" class="pc">Preferencias de cookies</button></nav>'
   +'</div><div class="sl-bottom">© '+new Date().getFullYear()+' SUPGO · Medellín, Colombia</div>';
  f.querySelector('.pc').onclick=open;
  f.querySelector('.sl-wa').addEventListener('click',function(){this.href=waLink()});
  document.body.appendChild(f);
  // Si la página tiene una barra fija abajo (ficha o checkout), dejar espacio para que no tape el pie.
  try{var bar=document.querySelector('.product-page .product-info .actions,.stickyBar');if(bar&&getComputedStyle(bar).position==='fixed')f.style.paddingBottom='calc('+(bar.offsetHeight+18)+'px + env(safe-area-inset-bottom,0px))'}catch(e){}
}

/* ---------- Botón flotante de WhatsApp ----------
   No aparece donde ya hay uno (fichas) ni en el checkout. Se esconde cuando tapa un botón
   de «Agregar», el aviso de cookies o una barra fija de compra. */
var wa;
function waSkip(){
  var p=location.pathname;
  return /^\/(checkout|panel|e|disponible|baja|resena)\//.test(p)||document.getElementById('seo-wa-float')||document.getElementById('supgo-wa-general')||document.querySelector('.product-page .product-info .actions');
}
function buyButtons(){
  var out=[];document.querySelectorAll('button,a.buy,a.add').forEach(function(b){
    if(b===wa||b.closest('#supgo-wa-btn,#supgo-cookies,.supgo-legal,.supgo-cart-drawer,.supgo-menu'))return;
    var t=(b.textContent||'')+' '+(b.getAttribute('aria-label')||'');
    if(/agregar|comprar|añadir|hacer pedido/i.test(t)||b.matches('.buy,.add,.rel-add,.cta'))out.push(b);
  });return out;
}
function overlap(a,b){return !(a.right<b.left-6||a.left>b.right+6||a.bottom<b.top-6||a.top>b.bottom+6)}
var waTick=false;
function waCheck(){
  waTick=false;if(!wa)return;
  var r=wa.getBoundingClientRect(),hide=false;
  var ck=document.getElementById('supgo-cookies');if(ck&&!ck.hidden)hide=true;
  if(!hide){var bs=buyButtons();for(var i=0;i<bs.length;i++){var br=bs[i].getBoundingClientRect();if(br.height&&br.bottom>0&&br.top<innerHeight&&overlap(r,br)){hide=true;break}}}
  if(!hide){var el=document.elementFromPoint(r.left+r.width/2,r.top-8);if(el&&el.closest&&el.closest('.stickyBar,[class*="sticky"],[class*="bottom-bar"]'))hide=true}
  wa.classList.toggle('sw-hide',hide);
}
function waQueue(){if(!waTick){waTick=true;requestAnimationFrame(waCheck)}}
function waMount(){
  if(wa||waSkip())return;
  css();
  wa=document.createElement('a');wa.id='supgo-wa-btn';wa.href=waLink();wa.target='_blank';wa.rel='noopener';
  wa.setAttribute('aria-label','Escríbenos por WhatsApp');wa.title='Escríbenos por WhatsApp';wa.innerHTML=WA_ICON;
  wa.addEventListener('click',function(){wa.href=waLink()});
  document.body.appendChild(wa);
  addEventListener('scroll',waQueue,{passive:true});addEventListener('resize',waQueue);
  try{new MutationObserver(waQueue).observe(document.body,{childList:true,subtree:true,attributes:true,attributeFilter:['hidden','class']})}catch(e){}
  waQueue();setTimeout(waQueue,800);
}

/* ---------- Diagnóstico temporal (?diag=1): qué alarga la página en iPhone ---------- */
function diag(){
  if(!/[?&]diag=1/.test(location.search))return;
  var d=document.createElement('pre');
  d.style.cssText='position:fixed;left:6px;right:6px;top:60px;z-index:2147483647;max-height:60vh;overflow:auto;background:#000d;color:#7CFC00;font:11px/1.35 monospace;padding:8px;border-radius:8px;white-space:pre-wrap;margin:0';
  function run(){
    var H=Math.max(document.documentElement.scrollHeight,document.body.scrollHeight),f=document.querySelector('.supgo-legal');
    var fb=f?Math.round(f.getBoundingClientRect().bottom+scrollY):0,rows=[];
    document.querySelectorAll('body *').forEach(function(e){
      if(e===d)return;var r=e.getBoundingClientRect();if(!r.width&&!r.height)return;
      var bot=Math.round(r.bottom+scrollY),cs=getComputedStyle(e);
      if(bot>fb+4&&cs.position!=='fixed')rows.push(bot+' '+e.tagName.toLowerCase()+(e.id?'#'+e.id:'')+(typeof e.className==='string'&&e.className?'.'+e.className.trim().split(/\s+/).slice(0,2).join('.'):'')+' pos='+cs.position+' h='+Math.round(r.height)+(cs.transform!=='none'?' tf':'')+(cs.display==='none'?' none':''));
    });
    rows.sort(function(a,b){return parseInt(b)-parseInt(a)});
    d.textContent='scrollHeight='+H+'  fin pie='+fb+'  vista='+innerHeight+'  html='+document.documentElement.scrollHeight+' body='+document.body.scrollHeight+'\nui='+navigator.userAgent.slice(0,90)+'\nElementos bajo el pie: '+rows.length+'\n'+rows.slice(0,25).join('\n');
  }
  document.body.appendChild(d);run();setTimeout(run,1500);setTimeout(run,4000);addEventListener('scroll',function(){clearTimeout(d._t);d._t=setTimeout(run,300)},{passive:true});
}

window.SupgoCookies={open:open,get:read,accept:function(){save(true)},reject:function(){save(false)}};
var c=read();apply(c);
function boot(){footer();waMount();if(!c)open();try{diag()}catch(e){}}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot);else boot();
})();

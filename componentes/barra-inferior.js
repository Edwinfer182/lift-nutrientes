/* SUPGO · Barra de navegación inferior en celular (estilo Instagram).
   Inicio · Ofertas · Buscar · Carrito · Cuenta. Solo en pantallas de hasta 760 px.
   La cargan header-loader.js en todas las páginas públicas. */
(function(){
'use strict';
if(window.__supgoBarraInferior)return;window.__supgoBarraInferior=true;
var P=location.pathname;
// No se muestra en el pago ni en herramientas internas.
if(/^\/(checkout|control|panel|editor|admin|dashboard|productividad|atencion|e|baja|resena)(\/|\.html|$)/.test(P)||/admin\.html$/.test(P))return;

var ICON={
 inicio:'<path d="M3 10.5 12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-6h-6v6H4a1 1 0 0 1-1-1z"/>',
 ofertas:'<path d="M12 22c4.4 0 7-2.9 7-6.6 0-3.1-1.9-5.4-3.6-7.2-.3 1.6-1.1 2.8-2.3 3.4.2-3.4-1.3-6.3-4.1-8.6.1 3-1.4 5-3 6.9C4.9 11.2 5 12.6 5 15.4 5 19.1 7.6 22 12 22z"/><path d="M12 22c-1.7 0-3-1.3-3-3.1 0-1.6 1.2-2.6 2.1-3.6.2 1 .8 1.6 1.6 1.9.1-1 .6-1.8 1.3-2.4.6 1.3 1 2.2 1 3.9 0 1.9-1.3 3.3-3 3.3z"/>',
 buscar:'<circle cx="11" cy="11" r="7"/><path d="m20 20-3.6-3.6"/>',
 carrito:'<path d="M3 4h2.2l2.4 11.2a1 1 0 0 0 1 .8h9.1a1 1 0 0 0 1-.8L20.5 8H6.1"/><circle cx="9.5" cy="19.5" r="1.4"/><circle cx="17" cy="19.5" r="1.4"/>',
 cuenta:'<circle cx="12" cy="8" r="4"/><path d="M4 21c1.2-4 4.3-6 8-6s6.8 2 8 6"/>'
};
var ITEMS=[
 ['inicio','Inicio','/'],
 ['ofertas','Ofertas','/ofertas/'],
 ['buscar','Buscar','/buscar/'],
 ['carrito','Carrito','/carrito/'],
 ['cuenta','Cuenta','/cuenta/']
];
function activo(){
 if(P==='/'||/^\/home\/?$/.test(P))return 'inicio';
 if(/^\/ofertas/.test(P))return 'ofertas';
 if(/^\/buscar/.test(P))return 'buscar';
 if(/^\/carrito/.test(P))return 'carrito';
 if(/^\/(cuenta|favoritos|mi-pedido)/.test(P))return 'cuenta';
 return '';
}
var css=''
+'#supgo-tabbar{display:none}'
+'@media(max-width:760px){'
+'#supgo-tabbar{display:flex;position:fixed;left:12px;right:12px;bottom:calc(10px + env(safe-area-inset-bottom,0px));z-index:9500;height:62px;padding:0 6px;align-items:center;justify-content:space-between;'
+'background:rgba(255,255,255,.86);-webkit-backdrop-filter:saturate(180%) blur(18px);backdrop-filter:saturate(180%) blur(18px);border:1px solid rgba(0,0,0,.08);border-radius:999px;box-shadow:0 8px 28px rgba(0,0,0,.16);'
+'transition:transform .25s ease,opacity .25s ease;font-family:Poppins,Arial,sans-serif}'
+'#supgo-tabbar.oculta{transform:translateY(120%);opacity:0;pointer-events:none}'
+'#supgo-tabbar a{position:relative;flex:1;height:50px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:1px;color:#111;text-decoration:none;border-radius:999px;-webkit-tap-highlight-color:transparent;transition:background .15s}'
+'#supgo-tabbar a:active{transform:scale(.94)}'
+'#supgo-tabbar a.on{background:rgba(0,0,0,.07)}'
+'#supgo-tabbar svg{width:25px;height:25px;fill:none;stroke:currentColor;stroke-width:1.9;stroke-linecap:round;stroke-linejoin:round}'
+'#supgo-tabbar a.on svg{stroke-width:2.4}#supgo-tabbar a.on[data-k=inicio] svg path{fill:#111}'
+'#supgo-tabbar a[data-k=ofertas] svg{color:#e0262f}'
+'#supgo-tabbar small{font-size:9.5px;font-weight:600;line-height:1;color:#333}'
+'#supgo-tabbar .tb-badge{position:absolute;top:3px;left:calc(50% + 6px);min-width:17px;height:17px;padding:0 4px;border-radius:999px;background:#e0262f;color:#fff;font:700 10px/17px Poppins,Arial,sans-serif;text-align:center;box-shadow:0 0 0 2px #fff}'
+'#supgo-tabbar .tb-badge[hidden]{display:none}'
+'#supgo-tabbar .tb-ico{display:flex;align-items:center;justify-content:center;height:25px}'
+'#supgo-tabbar .tb-avatar{width:25px;height:25px;border-radius:50%;object-fit:cover;background:#111;border:2px solid #c8f34b}'
// Espacio para que el contenido final no quede tapado
+'body.supgo-tabbar-on{padding-bottom:calc(84px + env(safe-area-inset-bottom,0px))!important}'
// Botones flotantes de WhatsApp y avisos: por encima de la barra
+'body.supgo-tabbar-on #supgo-cookies{bottom:calc(84px + env(safe-area-inset-bottom,0px))!important}'
+'body.supgo-tabbar-on #supgo-wa-btn{bottom:calc(84px + env(safe-area-inset-bottom,0px))!important}'
+'body.supgo-tabbar-on #supgo-wa-general{bottom:calc(88px + env(safe-area-inset-bottom,0px))!important}'
+'body.supgo-tabbar-on #seo-wa-float{bottom:calc(158px + env(safe-area-inset-bottom,0px))!important}'
+'body.supgo-tabbar-on .pi-toast,body.supgo-tabbar-on .toast,body.supgo-tabbar-on .fav-toast{bottom:calc(88px + env(safe-area-inset-bottom,0px))!important}'
// Ficha de producto: la barra "Agregar" queda encima de la navegación
+'body.supgo-tabbar-on .product-page .product-info .actions{bottom:calc(78px + env(safe-area-inset-bottom,0px))!important;left:10px!important;right:10px!important;width:auto!important;border:1px solid #e8e8e8!important;border-radius:16px!important;padding:8px 10px!important}'
// Encabezado en celular: sin cuenta ni carrito (ya están abajo) y se esconde al bajar.
+'body.supgo-tabbar-on #supgo-global-header .supgo-v2 .bar>.supgo-account-link,body.supgo-tabbar-on #supgo-global-header .supgo-v2 .bar>.cartDesktop{display:none!important}'
+'body.supgo-tabbar-on #supgo-global-header .supgo-v2 .bar{grid-template-columns:auto auto 1fr auto!important;grid-template-areas:"menu logo . fav" "search search search search"!important}'
+'body.supgo-tabbar-on #supgo-global-header{transition:transform .28s ease,box-shadow .28s ease;will-change:transform}'
+'body.supgo-tabbar-on.supgo-head-oculto #supgo-global-header{transform:translateY(-100%)}'
+'body.supgo-tabbar-on #supgo-global-header.con-sombra{box-shadow:0 6px 18px rgba(0,0,0,.18)}'
+'body.supgo-tabbar-on.supgo-tabbar-ficha{padding-bottom:calc(150px + env(safe-area-inset-bottom,0px))!important}'
+'}';

function svg(k){return '<svg viewBox="0 0 24 24" aria-hidden="true">'+ICON[k]+'</svg>'}
function cantidadCarrito(){
 var c=document.querySelector('#supgo-global-header #count,header.top #count,.cartDesktop .badge');
 var n=c?parseInt(String(c.textContent||'').replace(/\D/g,''),10):NaN;
 if(isFinite(n))return n;
 try{var cart=JSON.parse(localStorage.getItem('liftCartV2')||'[]');var arr=Array.isArray(cart)?cart:Object.values(cart||{});return arr.reduce(function(s,x){return s+(Number(x&&(x.qty||x.cantidad||x.quantity))||1)},0)}catch(e){return 0}
}
function montar(){
 if(document.getElementById('supgo-tabbar'))return;
 var st=document.createElement('style');st.id='supgo-tabbar-css';st.textContent=css;document.head.appendChild(st);
 var nav=document.createElement('nav');nav.id='supgo-tabbar';nav.setAttribute('aria-label','Navegación principal');
 var on=activo();
 nav.innerHTML=ITEMS.map(function(it){
  var inner=it[0]==='cuenta'?'<span class="tb-ico">'+svg('cuenta')+'</span>':svg(it[0]);
  return '<a href="'+it[2]+'" data-k="'+it[0]+'" class="'+(it[0]===on?'on':'')+'"'+(it[0]===on?' aria-current="page"':'')+'>'+inner+'<small>'+it[1]+'</small>'+(it[0]==='carrito'?'<span class="tb-badge" hidden></span>':'')+'</a>';
 }).join('');
 document.body.appendChild(nav);
 document.body.classList.add('supgo-tabbar-on');
 if(/^\/producto\//.test(P))document.body.classList.add('supgo-tabbar-ficha');

 // Buscar: usa el buscador del encabezado si existe.
 nav.querySelector('[data-k=buscar]').addEventListener('click',function(e){
  var input=document.querySelector('#supgo-global-header .search input,header.top .search input');
  if(input){e.preventDefault();window.scrollTo({top:0,behavior:'smooth'});setTimeout(function(){input.focus()},250)}
 });
 // Carrito: abre el panel lateral del carrito si la página lo tiene.
 nav.querySelector('[data-k=carrito]').addEventListener('click',function(e){
  var btn=document.querySelector('#supgo-global-header .cartDesktop,header.top .cartDesktop');
  if(btn&&!/^\/carrito/.test(P)){e.preventDefault();btn.click()}
 });
 // Inicio: si ya estás en el inicio, sube al principio (como Instagram).
 nav.querySelector('[data-k=inicio]').addEventListener('click',function(e){if(on==='inicio'){e.preventDefault();window.scrollTo({top:0,behavior:'smooth'})}});

 var badge=nav.querySelector('.tb-badge');
 function pintarCarrito(){var n=cantidadCarrito();badge.textContent=n>99?'99+':String(n);badge.hidden=!(n>0)}
 pintarCarrito();
 window.addEventListener('storage',pintarCarrito);
 document.addEventListener('supgo:header-ready',function(){pintarCarrito();vigilarContador()});
 function vigilarContador(){var c=document.querySelector('#supgo-global-header #count,header.top #count');if(c&&!c.__tb){c.__tb=1;new MutationObserver(pintarCarrito).observe(c,{childList:true,characterData:true,subtree:true})}}
 vigilarContador();setInterval(pintarCarrito,4000);

 // Cuenta: con sesión iniciada se muestra el logo como foto de perfil.
 function pintarCuenta(){try{if(window.SupgoCuenta&&window.SupgoCuenta.get()){var ico=nav.querySelector('[data-k=cuenta] .tb-ico');if(ico&&!ico.querySelector('img'))ico.innerHTML='<img class="tb-avatar" src="/favicon.png" alt="">'}}catch(e){}}
 pintarCuenta();setTimeout(pintarCuenta,1500);setTimeout(pintarCuenta,4000);

 // Se oculta mientras escribes (teclado abierto) o con el carrito / menú lateral abiertos.
 function revisar(){
  var a=document.activeElement,escribiendo=a&&(/^(INPUT|TEXTAREA|SELECT)$/.test(a.tagName)||a.isContentEditable)&&a.type!=='checkbox'&&a.type!=='radio';
  var abierto=document.body.classList.contains('supgo-cart-open')||document.body.classList.contains('supgo-side-open')||document.body.classList.contains('menu-open');
  nav.classList.toggle('oculta',!!(escribiendo||abierto));
 }
 // Encabezado tipo Instagram: se esconde al bajar y vuelve al subir un poco.
 var ultimoY=window.scrollY,acum=0,pendiente=false;
 function header(){return document.getElementById('supgo-global-header')}
 function puedeOcultar(){
  var h=header();if(!h||!window.matchMedia('(max-width:760px)').matches)return false;
  var a=document.activeElement;if(a&&h.contains(a))return false; // escribiendo en el buscador
  var res=h.querySelector('.searchResults');if(res&&res.offsetParent!==null&&res.childElementCount)return false;
  var b=document.body.classList;return !(b.contains('supgo-cart-open')||b.contains('supgo-side-open'));
 }
 function alDesplazar(){
  pendiente=false;var y=Math.max(0,window.scrollY),d=y-ultimoY;ultimoY=y;var h=header();if(!h)return;
  var alto=h.offsetHeight||130;
  if(y<=alto){document.body.classList.remove('supgo-head-oculto');h.classList.remove('con-sombra');acum=0;return}
  acum=(d>0)===(acum>0)?acum+d:d; // distancia acumulada en la misma dirección
  if(acum>24&&puedeOcultar())document.body.classList.add('supgo-head-oculto');
  else if(acum<-36){document.body.classList.remove('supgo-head-oculto');h.classList.add('con-sombra')}
 }
 window.addEventListener('scroll',function(){if(!pendiente){pendiente=true;requestAnimationFrame(alDesplazar)}},{passive:true});
 // Al tocar Buscar, el encabezado aparece de inmediato.
 nav.querySelector('[data-k=buscar]').addEventListener('click',function(){document.body.classList.remove('supgo-head-oculto')});
 document.addEventListener('focusin',revisar);document.addEventListener('focusout',function(){setTimeout(revisar,50)});
 new MutationObserver(revisar).observe(document.body,{attributes:true,attributeFilter:['class']});
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',montar,{once:true});else montar();
})();

/* SUPGO · Header: sección activa, animación al tocar y animación de favoritos.
   - Marca en verde lima el botón de la sección donde está la persona (inicio, ofertas,
     categorías, laboratorios, mi pedido, cuenta, favoritos, carrito, búsqueda).
   - Los botones del header se hunden al tocarlos y dejan una onda.
   - Al agregar a favoritos el corazón late, suelta corazoncitos y el ícono del header salta. */
(function(){
'use strict';
if(window.__supgoHeaderEstado)return;window.__supgoHeaderEstado=true;

var LIME='#c8f34b';
function css(){
  if(document.getElementById('supgo-he-css'))return;
  var s=document.createElement('style');s.id='supgo-he-css';
  s.textContent=[
  /* Activo */
  '#supgo-global-header .supgo-on{position:relative}',
  '#supgo-global-header a.supgo-on,#supgo-global-header button.supgo-on{background:'+LIME+'!important;color:#111!important;border-color:'+LIME+'!important;box-shadow:0 0 0 3px rgba(200,243,75,.22)!important}',
  '#supgo-global-header .supgo-on svg{stroke:#111!important;color:#111!important}',
  '#supgo-global-header .supgo-on .txt,#supgo-global-header .supgo-on span{color:#111!important}',
  '#supgo-global-header .offersBtn.supgo-on{background:'+LIME+'!important}',
  '#supgo-global-header .brand.supgo-on a{border-radius:12px;box-shadow:0 0 0 2px '+LIME+',0 0 14px rgba(200,243,75,.45)}',
  '#supgo-global-header .search.supgo-on input{border-color:'+LIME+'!important;box-shadow:0 0 0 3px rgba(200,243,75,.22)!important}',
  '#supgo-global-header .supgo-on::after{content:"";position:absolute;left:50%;bottom:-7px;width:6px;height:6px;margin-left:-3px;border-radius:50%;background:'+LIME+';animation:supgoHeDot .45s ease-out both}',
  '#supgo-global-header .brand.supgo-on::after,#supgo-global-header .search.supgo-on::after{display:none}',
  '@keyframes supgoHeDot{from{transform:scale(0);opacity:0}to{transform:scale(1);opacity:1}}',
  '#supgo-global-header .supgo-on{animation:supgoHeIn .5s cubic-bezier(.2,.9,.3,1.3) both}',
  '@keyframes supgoHeIn{0%{transform:scale(.92)}60%{transform:scale(1.04)}100%{transform:scale(1)}}',
  /* Toque */
  '#supgo-global-header .bar a,#supgo-global-header .bar button{transition:transform .12s ease,background-color .2s,box-shadow .2s;-webkit-tap-highlight-color:transparent}',
  '#supgo-global-header .bar .supgo-press{transform:scale(.92)!important}',
  '.supgo-ripple-wrap{position:absolute;inset:0;overflow:hidden;border-radius:inherit;pointer-events:none;z-index:0}.supgo-ripple{position:absolute;border-radius:50%;pointer-events:none;background:rgba(200,243,75,.55);transform:scale(0);animation:supgoRipple .55s ease-out forwards;z-index:0}',
  '@keyframes supgoRipple{to{transform:scale(2.6);opacity:0}}',
  /* Favoritos */
  '.supgo-heart-pop{animation:supgoHeart .6s cubic-bezier(.2,.9,.3,1.4)}',
  '@keyframes supgoHeart{0%{transform:scale(1)}25%{transform:scale(1.35)}45%{transform:scale(.9)}70%{transform:scale(1.12)}100%{transform:scale(1)}}',
  '.supgo-heart-off{animation:supgoHeartOff .35s ease}',
  '@keyframes supgoHeartOff{0%{transform:scale(1)}40%{transform:scale(.78)}100%{transform:scale(1)}}',
  '.supgo-mini-heart{position:fixed;z-index:2147483200;pointer-events:none;font-size:14px;line-height:1;color:#e11d48;animation:supgoFly .8s ease-out forwards}',
  '@keyframes supgoFly{0%{transform:translate(0,0) scale(.6);opacity:1}100%{transform:translate(var(--dx),var(--dy)) scale(1.1);opacity:0}}',
  '#supgo-global-header .supgo-fav-link.supgo-bump{animation:supgoBump .7s cubic-bezier(.2,.9,.3,1.4)}',
  '@keyframes supgoBump{0%{transform:scale(1)}30%{transform:scale(1.3) rotate(-8deg)}55%{transform:scale(.92) rotate(4deg)}100%{transform:scale(1) rotate(0)}}',
  '#supgo-global-header .supgo-fav-link.supgo-bump svg{stroke:#ff4d6d!important;fill:rgba(255,77,109,.35)}',
  '@media (prefers-reduced-motion:reduce){#supgo-global-header *,.supgo-heart-pop,.supgo-heart-off,.supgo-mini-heart{animation:none!important;transition:none!important}}'
  ].join('');
  document.head.appendChild(s);
}

/* ---------- Sección activa ---------- */
function section(){
  var p=location.pathname.replace(/\/index\.html$/,'/');
  if(p==='/'||p.indexOf('/home/')===0)return 'home';
  if(p.indexOf('/ofertas/')===0)return 'ofertas';
  if(p.indexOf('/categorias/')===0)return 'categorias';
  if(p.indexOf('/laboratorios/')===0)return 'laboratorios';
  if(p.indexOf('/mi-pedido/')===0||p.indexOf('/mis-pedidos/')===0)return 'pedido';
  if(p.indexOf('/cuenta/')===0)return 'cuenta';
  if(p.indexOf('/favoritos/')===0)return 'favoritos';
  if(p.indexOf('/carrito/')===0)return 'carrito';
  if(p.indexOf('/buscar/')===0)return 'buscar';
  return '';
}
function target(bar,sec){
  switch(sec){
    case 'home':return bar.querySelector('.brand');
    case 'ofertas':return bar.querySelector('.offersBtn');
    case 'categorias':return bar.querySelector('.supgo-section-links a[href^="/categorias"]');
    case 'laboratorios':return bar.querySelector('.supgo-section-links a[href^="/laboratorios"]');
    case 'pedido':return bar.querySelector('.myOrder');
    case 'cuenta':return bar.querySelector('.supgo-account-link');
    case 'favoritos':return bar.querySelector('.supgo-fav-link');
    case 'carrito':return bar.querySelector('.cartDesktop');
    case 'buscar':return bar.querySelector('.search');
  }
  return null;
}
function markActive(){
  var bar=document.querySelector('#supgo-global-header .bar');if(!bar)return false;
  var el=target(bar,section());
  if(el&&!el.classList.contains('supgo-on')){
    bar.querySelectorAll('.supgo-on').forEach(function(x){x.classList.remove('supgo-on')});
    el.classList.add('supgo-on');el.setAttribute('aria-current','page');
  }
  return !!el||!section();
}

/* ---------- Toque en el header ---------- */
function press(e){
  var b=e.target.closest&&e.target.closest('#supgo-global-header .bar a,#supgo-global-header .bar button');if(!b)return;
  b.classList.add('supgo-press');
  var r=b.getBoundingClientRect(),size=Math.max(r.width,r.height),x=(e.clientX||r.left+r.width/2)-r.left-size/2,y=(e.clientY||r.top+r.height/2)-r.top-size/2;
  var cs=getComputedStyle(b);if(cs.position==='static')b.style.position='relative';
  var w=document.createElement('span');w.className='supgo-ripple';w.style.cssText='width:'+size+'px;height:'+size+'px;left:'+x+'px;top:'+y+'px';
  var wrap=document.createElement('span');wrap.className='supgo-ripple-wrap';wrap.appendChild(w);
  b.appendChild(wrap);setTimeout(function(){wrap.remove()},600);
}
function release(){document.querySelectorAll('#supgo-global-header .supgo-press').forEach(function(b){b.classList.remove('supgo-press')})}

/* ---------- Favoritos ---------- */
function favCount(){try{var x=JSON.parse(localStorage.getItem('liftFavoritesV1')||'[]');return Array.isArray(x)?x.length:0}catch(e){return 0}}
function burst(btn){
  var r=btn.getBoundingClientRect(),cx=r.left+r.width/2,cy=r.top+r.height/2;
  for(var i=0;i<6;i++){
    var h=document.createElement('span');h.className='supgo-mini-heart';h.textContent='❤';
    var a=(Math.PI*2/6)*i-Math.PI/2,d=26+Math.random()*14;
    h.style.left=(cx-7)+'px';h.style.top=(cy-7)+'px';h.style.setProperty('--dx',Math.cos(a)*d+'px');h.style.setProperty('--dy',Math.sin(a)*d+'px');
    document.body.appendChild(h);setTimeout(function(n){return function(){n.remove()}}(h),850);
  }
}
function bumpHeader(){
  var f=document.querySelector('#supgo-global-header .supgo-fav-link');if(!f)return;
  f.classList.remove('supgo-bump');void f.offsetWidth;f.classList.add('supgo-bump');
  setTimeout(function(){f.classList.remove('supgo-bump')},750);
}
function onFavClick(e){
  var b=e.target.closest&&e.target.closest('button.fav,#fav');if(!b)return;
  var before=favCount();
  setTimeout(function(){
    var after=favCount(),added=after>before;
    b.classList.remove('supgo-heart-pop','supgo-heart-off');void b.offsetWidth;
    b.classList.add(added?'supgo-heart-pop':'supgo-heart-off');
    setTimeout(function(){b.classList.remove('supgo-heart-pop','supgo-heart-off')},650);
    if(added){burst(b);bumpHeader()}
  },60);
}

function start(){
  css();
  // El ícono de cuenta y el de favoritos se montan después: reintentar unos segundos.
  var n=0;(function again(){markActive();if(++n<16)setTimeout(again,250)})();
  document.addEventListener('pointerdown',press,{passive:true});
  ['pointerup','pointercancel','pointerleave','blur'].forEach(function(t){addEventListener(t,release,{passive:true})});
  document.addEventListener('click',onFavClick,true);
}
if(document.querySelector('#supgo-global-header .bar'))start();
else document.addEventListener('supgo:header-ready',start,{once:true});
})();

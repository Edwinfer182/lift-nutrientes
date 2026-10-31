/* SUPGO · Distintivo "⚡ Disponible ya" para productos con pago directo
   (no requieren confirmar disponibilidad: el cliente paga al hacer el pedido).
   Funciona en el inicio, listados, búsqueda, favoritos y fichas de producto. */
(function(){
'use strict';
if(window.__supgoPagoDirecto)return;window.__supgoPagoDirecto=true;
var SB='https://vdxkknftyssjyfbdieqa.supabase.co',KEY='sb_publishable_ECuhXuKIb85kj9fgdEjrAw_O7uNpZsh',CACHE='supgoPagoDirectoV1',TTL=30*60*1000;
var ids=null;

function cached(){try{var c=JSON.parse(localStorage.getItem(CACHE)||'null');if(c&&Array.isArray(c.ids)&&Date.now()-c.t<TTL)return new Set(c.ids.map(String))}catch(e){}return null}
function load(){
  var c=cached();if(c)return Promise.resolve(c);
  return fetch(SB+'/rest/v1/lift_productos?select=id&pago_directo=eq.true&activo=eq.true&limit=2000',{headers:{apikey:KEY}})
    .then(function(r){return r.ok?r.json():[]}).then(function(rows){var a=(rows||[]).map(function(x){return String(x.id)});try{localStorage.setItem(CACHE,JSON.stringify({t:Date.now(),ids:a}))}catch(e){}return new Set(a)})
    .catch(function(){return new Set()});
}
function css(){
  if(document.getElementById('supgo-pd-css'))return;
  var s=document.createElement('style');s.id='supgo-pd-css';
  s.textContent='.supgo-pd{position:absolute;left:8px;bottom:8px;z-index:2;display:inline-flex;align-items:center;gap:3px;background:#c8f34b;color:#111;font:600 10px/1 Poppins,Arial,sans-serif;padding:5px 8px;border-radius:999px;box-shadow:0 2px 8px rgba(0,0,0,.12);pointer-events:none;letter-spacing:.01em}'
   +'.supgo-pd-note{display:flex;gap:10px;align-items:flex-start;margin:12px 0 0;padding:12px 14px;border-radius:12px;background:#f3fbe3;border:1px solid #cfe9a0;font:13px/1.45 Poppins,Arial,sans-serif;color:#1f2d06}'
   +'.supgo-pd-note b{display:block;font-size:13px;margin-bottom:2px}';
  document.head.appendChild(s);
}
function badgeCards(root){
  if(!ids||!ids.size)return;
  (root||document).querySelectorAll('.buy[data-id]').forEach(function(b){
    if(!ids.has(String(b.dataset.id)))return;
    var card=b.closest('article,.pcard,.product');if(!card)return;
    var media=card.querySelector('.product-media')||card.querySelector('.product-photo');if(!media||media.querySelector('.supgo-pd'))return;
    if(getComputedStyle(media).position==='static')media.style.position='relative';
    var t=document.createElement('span');t.className='supgo-pd';t.textContent='⚡ Disponible ya';t.title='Disponible para pago inmediato';media.appendChild(t);
  });
}
function productPageId(){
  var add=document.getElementById('add');if(!add)return '';
  var scripts=document.querySelectorAll('script:not([src])');
  for(var i=0;i<scripts.length;i++){var m=/const p=\{"id":\s*"?(\d+)"?/.exec(scripts[i].textContent||'');if(m)return m[1]}
  return '';
}
function productNote(){
  var id=productPageId();if(!id||!ids.has(id)||document.querySelector('.supgo-pd-note'))return;
  var actions=document.getElementById('add').closest('.actions')||document.getElementById('add').parentNode;
  var n=document.createElement('div');n.className='supgo-pd-note';
  n.innerHTML='<span style="font-size:18px">⚡</span><div><b>Disponible ya</b>Pagas al hacer el pedido, sin esperar confirmación, y lo despachamos más rápido.</div>';
  actions.parentNode.insertBefore(n,actions.nextSibling);
}
function run(){
  load().then(function(s){
    ids=s;if(!ids.size)return;css();badgeCards();productNote();
    var pending=false;
    new MutationObserver(function(){if(pending)return;pending=true;requestAnimationFrame(function(){pending=false;badgeCards()})}).observe(document.body,{childList:true,subtree:true});
  });
}
window.SupgoPagoDirecto={load:load};
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',run);else run();
})();

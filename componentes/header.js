/* SUPGO: navegación autónoma para fichas SEO. No redirige al inicio al abrir menú o carrito. */
(function(){
 const ROOT='https://supgo.co/';
 if(document.documentElement.dataset.supgoHome==='1')return;
 const norm=s=>(s||'').toString().normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().trim();
 let products=[],loaded=false,pending=null;
 const go=(kind,value)=>{
  const q=new URLSearchParams();
  if(kind==='ofertas')q.set('ofertas','1');
  if(kind==='categoria')q.set('categoria',value);
  if(kind==='laboratorio')q.set('laboratorio',value);
  if(kind==='buscar')q.set('q',value);
  location.href=ROOT+'?'+q.toString();
 };
 window.SupgoHeader={navigate:go,root:ROOT};
 const escape=s=>String(s||'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 function load(){
  if(pending)return pending;
  pending=fetch('/componentes/seo-productos.json',{cache:'no-cache'}).then(r=>{if(!r.ok)throw Error('Índice no publicado');return r.json()}).then(a=>{products=Array.isArray(a)?a:[];loaded=true;return products}).catch(()=>{loaded=false;return []});
  return pending;
 }
 function panel(){
  let p=document.getElementById('supgo-seo-panel');
  if(!p){
   p=document.createElement('section');p.id='supgo-seo-panel';p.setAttribute('aria-label','Navegación SUPGO');p.hidden=true;
   document.getElementById('supgo-global-header')?.appendChild(p);
  }
  return p;
 }
 function show(html){
  const p=panel();p.innerHTML='<button type="button" class="seo-panel-close" aria-label="Cerrar">×</button>'+html;p.hidden=false;
  p.querySelector('.seo-panel-close').onclick=()=>p.hidden=true;
 }
 function menu(){
  show('<p class="seo-panel-status">Cargando categorías y laboratorios…</p>');
  load().then(()=>{
   if(!loaded){show('<p>No se ha publicado el índice del catálogo todavía.</p>');return}
   const categories=[...new Set(products.map(p=>p.category).filter(Boolean))].sort((a,b)=>a.localeCompare(b,'es'));
   const brands=[...new Set(products.map(p=>p.brand).filter(Boolean))].sort((a,b)=>a.localeCompare(b,'es'));
   const group=(title,kind,items)=>'<div class="seo-panel-group"><h3>'+title+'</h3><div class="seo-panel-links">'+items.map(x=>'<button type="button" data-kind="'+kind+'" data-value="'+escape(x)+'">'+escape(x)+'</button>').join('')+'</div></div>';
   show('<div class="seo-panel-menu">'+group('Categorías','categoria',categories)+group('Laboratorios','laboratorio',brands)+'</div>');
   panel().querySelectorAll('[data-kind]').forEach(b=>b.onclick=()=>go(b.dataset.kind,b.dataset.value));
  });
 }
 function cart(){
  let items=[];try{items=JSON.parse(localStorage.getItem('supgo_seo_cart')||'[]')}catch(e){}
  if(!Array.isArray(items))items=[];
  const list=items.map(p=>'<div class="seo-cart-item"><span>'+escape(p.name)+' × '+(Number(p.quantity)||1)+'</span><a href="'+escape(p.url||ROOT)+'">Ver ficha</a></div>').join('');
  show('<h3>Carrito de fichas SEO</h3>'+(list||'<p>Tu carrito está vacío.</p>')+'<p class="seo-cart-note">Los productos guardados aquí todavía no están sincronizados con el checkout principal.</p>');
 }
 window.openOff=which=>{if(which==='filters')menu();else if(which==='cart')cart();};
 window.showOffers=()=>go('ofertas');
 window.liftCopyFilterLink=()=>navigator.clipboard?.writeText(ROOT+'?ofertas=1');
 function results(term){
  const p=document.querySelector('#supgo-global-header #searchResults');if(!p)return;
  if(!term.trim()){p.innerHTML='';p.hidden=true;return}
  const q=norm(term);const matches=products.filter(x=>norm(x.name+' '+x.brand+' '+x.category).includes(q)).slice(0,9);
  p.innerHTML=matches.length?matches.map(x=>'<a class="seo-search-hit" href="'+escape(x.url)+'">'+(x.image?'<img src="'+escape(x.image)+'" loading="lazy" alt="">':'')+'<span>'+escape(x.name)+'<small>'+escape(x.brand)+'</small></span></a>').join(''):'<p class="seo-search-empty">Sin coincidencias</p>';
  p.hidden=false;
 }
 function init(){
  const h=document.getElementById('supgo-global-header');if(!h)return;
  const q=h.querySelector('#q');const brand=h.querySelector('.brand');
  if(brand){brand.style.cursor='pointer';brand.addEventListener('click',()=>location.assign(ROOT));}
  if(q){
   q.addEventListener('input',()=>load().then(()=>results(q.value)));
   q.addEventListener('focus',()=>{if(q.value.trim())load().then(()=>results(q.value))});
   q.addEventListener('keydown',e=>{if(e.key==='Enter'){e.preventDefault();const first=h.querySelector('.seo-search-hit');if(first)location.href=first.href;else go('buscar',q.value.trim());}if(e.key==='Escape'){h.querySelector('#searchResults').hidden=true;}});
  }
  document.addEventListener('click',e=>{if(!h.contains(e.target)){const p=h.querySelector('#searchResults');if(p)p.hidden=true;}});
 }
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();

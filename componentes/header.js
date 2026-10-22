/* SUPGO component controller: keeps the same header markup on every SEO page.
   Do not install on index pages, which already mount their own header and application. */
(function(){
'use strict';
const host=document.getElementById('supgo-global-header');
if(!host || host.dataset.controllerReady==='1')return;
host.dataset.controllerReady='1';
const ROOT=new URL('https://supgo.co/');
const STORAGE={cart:'liftCartV2',meta:'liftCartMetaV1'};
const escText=x=>String(x==null?'':x);
const money=x=>new Intl.NumberFormat('es-CO',{style:'currency',currency:'COP',maximumFractionDigits:0}).format(Number(x)||0);
function json(key,otherwise){try{const raw=localStorage.getItem(key);return raw?JSON.parse(raw):otherwise;}catch{return otherwise;}}
function seoSlug(value){return String(value||'').normalize('NFKD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'').slice(0,110);}
function go(key,value){
 if(key==='buscar'){location.assign('/buscar/?q='+encodeURIComponent(value||''));return;}
 if(key==='categoria'||key==='marca'){location.assign('/'+(key==='categoria'?'categorias':'laboratorios')+'/'+seoSlug(value)+'/');return;}
 const u=new URL(ROOT);if(key)u.searchParams.set(key,value);location.href=u.href;
}
function getCart(){const data=json(STORAGE.cart,{});return data&&typeof data==='object'&&!Array.isArray(data)?data:{};}
function saveCart(data){localStorage.setItem(STORAGE.cart,JSON.stringify(data));window.dispatchEvent(new Event('supgo-cart-change'));updateCount();}
const bar=host.querySelector('.bar');
const menuButton=host.querySelector('.filterMobile'),offerButton=host.querySelector('#offersButton');
const search=host.querySelector('#q'),results=host.querySelector('#searchResults'),clearSearch=host.querySelector('#clearSearch');
const cartButton=host.querySelector('.cartDesktop'),count=host.querySelector('#count');
const favoriteLink=document.createElement('a');favoriteLink.href='/favoritos/';favoriteLink.className='iconbtn supgo-fav-link';favoriteLink.innerHTML='<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8L12 21l8.8-8.6a5.5 5.5 0 0 0 0-7.8Z"/></svg>';favoriteLink.setAttribute('aria-label','Favoritos');favoriteLink.title='Favoritos';favoriteLink.style.cssText='display:inline-flex;align-items:center;justify-content:center;text-decoration:none;width:44px;height:44px;padding:0';
if(cartButton)cartButton.before(favoriteLink);else bar?.append(favoriteLink);
if(offerButton)offerButton.onclick=()=>location.assign('/ofertas/');
const brand=host.querySelector('.brand');if(brand&&!brand.matches('a[href]')){brand.style.cursor='pointer';brand.onclick=()=>go();}
host.querySelectorAll('.liftFilterLink').forEach(el=>el.onclick=()=>navigator.clipboard?.writeText(ROOT.href+'?ofertas=1'));
function updateCount(){let total=0;Object.values(getCart()).forEach(v=>{const n=typeof v==='number'?v:Number(v?.quantity??v?.qty??v);if(Number.isFinite(n)&&n>0)total+=n;});if(count)count.textContent=total;return total;}
const popup=document.createElement('div');popup.className='supgo-menu';popup.hidden=true;
popup.setAttribute('role','dialog');popup.setAttribute('aria-modal','true');popup.setAttribute('aria-label','Marcas y categorías');
popup.innerHTML='<div class="supgo-menu-head"><strong>Marcas / categorías</strong><button type="button" class="supgo-menu-close" aria-label="Cerrar">×</button></div><div class="supgo-menu-inner"><div class="supgo-tabs"><button type="button" data-tab="brands" class="active">Laboratorios</button><button type="button" data-tab="categories">Categorías</button></div><div class="supgo-menu-search"><span aria-hidden="true">⌕</span><input type="search" placeholder="Buscar laboratorio..." aria-label="Buscar laboratorio"></div><div class="supgo-links"></div></div>';
const menuShade=document.createElement('div');menuShade.className='supgo-menu-shade';menuShade.hidden=true;
document.body.append(menuShade,popup);
const menuSearch=popup.querySelector('.supgo-menu-search input');
let catalog=[];
const field=(p,...names)=>{for(const n of names){if(p&&p[n]!=null&&p[n]!=='')return p[n];}return '';};
function closeMenu(){popup.hidden=true;menuShade.hidden=true;document.body.classList.remove('supgo-menu-open');}
function openMenu(){popup.hidden=false;menuShade.hidden=false;document.body.classList.add('supgo-menu-open');draw(popup.querySelector('[data-tab].active').dataset.tab);menuSearch.value='';}
function draw(tab){
 const categories=tab==='categories',key=categories?'categoria':'marca',names=categories?['category','categoria']:['brand','marca'];
 const counts=new Map();
 const preset=window.__supgoSeoFilters;
 const provided=preset && (categories?preset.categories:preset.brands);
 if(Array.isArray(provided)&&provided.length){provided.forEach(entry=>{if(entry&&entry[0])counts.set(String(entry[0]),Number(entry[1])||0);});}
 else catalog.forEach(item=>{const v=escText(field(item.product,...names)).trim();if(v)counts.set(v,(counts.get(v)||0)+1);});
 const term=menuSearch.value.trim().toLocaleLowerCase('es');
 const values=[...counts.keys()].sort((a,b)=>a.localeCompare(b,'es')).filter(v=>v.toLocaleLowerCase('es').includes(term));
 const links=popup.querySelector('.supgo-links');links.replaceChildren();links.classList.toggle('is-brands',!categories);
 if(categories&&!term){const all=document.createElement('a');all.href='/categorias/';all.className='supgo-category-link';all.innerHTML='<span>Todos</span><small>'+(preset?.total||catalog.length)+'</small>';links.append(all);}
 for(const v of values){
  const a=document.createElement('a');a.href='/'+(categories?'categorias':'laboratorios')+'/'+seoSlug(v)+'/';
  if(categories){a.className='supgo-category-link';const name=document.createElement('span');name.textContent=v;const qty=document.createElement('small');qty.textContent=counts.get(v);a.append(name,qty);}
  else{a.className='supgo-brand-card';const record=Array.isArray(provided)?provided.find(x=>String(x?.[0])===v):null;const logo=record?.[2];if(typeof logo==='string'&&(/^(https?:\/\/|\/productos-assets\/logos\/)/i.test(logo))){const img=document.createElement('img');img.className='supgo-brand-logo';img.alt='';img.loading='eager';img.decoding='async';img.onerror=()=>{img.remove();};img.src=new URL(logo,ROOT).href;a.append(img);}const name=document.createElement('b');name.textContent=v;const qty=document.createElement('small');qty.textContent=counts.get(v)+' productos';a.append(name,qty);}
  links.append(a);
 }
 if(!links.childElementCount){const msg=document.createElement('p');msg.textContent=(catalog.length||provided?.length)?'No se encontraron resultados.':'No hay filtros disponibles.';links.append(msg);}
 menuSearch.placeholder=categories?'Buscar categoría...':'Buscar laboratorio...';
}
if(menuButton){menuButton.removeAttribute('onclick');menuButton.onclick=()=>popup.hidden?openMenu():closeMenu();}
popup.querySelector('.supgo-menu-close').onclick=closeMenu;menuShade.onclick=closeMenu;
popup.querySelectorAll('[data-tab]').forEach(btn=>btn.onclick=()=>{popup.querySelectorAll('[data-tab]').forEach(x=>x.classList.toggle('active',x===btn));menuSearch.value='';draw(btn.dataset.tab);});
menuSearch.addEventListener('input',()=>draw(popup.querySelector('[data-tab].active').dataset.tab));
if(search){search.setAttribute('enterkeyhint','search');search.addEventListener('keydown',e=>{if(e.key==='Enter'){e.preventDefault();const term=search.value.trim();if(term)go('buscar',term);}});}
if(results){results.hidden=true;}
function suggest(){
if(!search||!results)return;
const term=search.value.trim().toLocaleLowerCase('es');results.replaceChildren();
if(term.length<2){results.hidden=true;return;}
for(const item of catalog.filter(x=>escText(field(x.product,'name','nombre')).toLocaleLowerCase('es').includes(term)).slice(0,7)){
const p=item.product||{},a=document.createElement('a');
a.className='supgo-search-item';
a.href='/productos/'+seoSlug(field(p,'name','nombre'))+'-'+item.id+'.html';
const picture=field(p,'image','imagen','image_url','imagen_url','foto','url_imagen');
let src=typeof picture==='string'?picture.trim():'';
if(!src&&Array.isArray(p.images)&&p.images.length)src=typeof p.images[0]==='string'?p.images[0]:(p.images[0]?.url||'');
const photo=document.createElement('img');photo.className='supgo-search-photo';photo.alt='';photo.loading='lazy';photo.decoding='async';
if(/^https?:\/\//i.test(src)){photo.src=src;photo.onerror=()=>{photo.hidden=true;};}else photo.hidden=true;
const title=document.createElement('span');title.className='supgo-search-title';title.textContent=field(p,'name','nombre');
a.append(photo,title);results.append(a);
}
results.hidden=!results.childElementCount;
}
// Botón flotante sobre el input, visible incluso si CSS antiguo oculta botones del header.
const clearButton=clearSearch||(search?document.createElement('button'):null);
if(clearButton&&search){
 if(!clearSearch){clearButton.id='clearSearch';clearButton.className='supgo-clear-search';clearButton.type='button';clearButton.setAttribute('aria-label','Borrar búsqueda');clearButton.textContent='×';search.parentElement.append(clearButton);}
 search.parentElement.style.setProperty('position','relative');
 clearButton.style.cssText='position:absolute!important;right:12px!important;top:22px!important;transform:translateY(-50%)!important;z-index:1007!important;width:30px!important;height:30px!important;padding:0!important;border:0!important;border-radius:50%!important;background:#393b40!important;color:#fff!important;font:24px/30px Arial,sans-serif!important;text-align:center!important;cursor:pointer!important;pointer-events:auto!important;';
 const updateClearSearch=()=>{const show=search.value.length>0;clearButton.hidden=!show;clearButton.style.setProperty('display',show?'block':'none','important');};
 search.addEventListener('input',()=>{updateClearSearch();suggest();});
 clearButton.addEventListener('click',e=>{e.preventDefault();search.value='';if(results){results.replaceChildren();results.hidden=true;}updateClearSearch();search.focus();});
 updateClearSearch();
}
// Carrito único compartido entre fichas SEO (misma clave que el catálogo).
const backdrop=document.createElement('div');backdrop.className='supgo-cart-overlay';backdrop.hidden=true;
const drawer=document.createElement('aside');drawer.className='supgo-cart-drawer';drawer.hidden=true;
drawer.setAttribute('aria-label','Carrito de compra');
drawer.innerHTML='<div class="supgo-cart-top"><strong>Tu carrito</strong><button type="button" aria-label="Cerrar carrito">×</button></div><div class="supgo-cart-items"></div><div class="supgo-cart-bottom"><button type="button" id="supgoGoCheckout">Continuar pedido</button><div class="supgo-cart-total"><span>Subtotal</span><strong></strong></div></div>';
// El pie pertenece al drawer en body, no al nodo del encabezado.
// Estilos locales resistentes a las reglas de las fichas SEO y Safari móvil.
const checkoutFooter=drawer.querySelector('.supgo-cart-bottom');
const checkoutButton=drawer.querySelector('#supgoGoCheckout');
checkoutFooter.style.cssText='display:flex!important;flex-direction:column!important;flex-shrink:0!important;position:absolute!important;left:0!important;right:0!important;bottom:0!important;z-index:10!important;background:#fff!important;padding:12px 16px calc(16px + env(safe-area-inset-bottom))!important;box-shadow:0 -5px 20px #00000012!important';
checkoutButton.style.cssText='display:block!important;visibility:visible!important;opacity:1!important;position:relative!important;width:100%!important;min-height:48px!important;flex-shrink:0!important;padding:12px 16px!important;border:0!important;border-radius:8px!important;background:#111!important;color:#fff!important;font:600 15px Poppins,Arial,sans-serif!important;cursor:pointer!important';
drawer.querySelector('.supgo-cart-total').style.order='-1';
document.body.append(backdrop,drawer);
// La lista nunca puede tapar la zona fija del checkout.
drawer.style.setProperty('position','fixed','important');
drawer.style.setProperty('height','100dvh','important');
drawer.style.setProperty('overflow','hidden','important');
drawer.querySelector('.supgo-cart-items').style.cssText='overflow-y:auto!important;min-height:0!important;flex:1 1 auto!important;padding-bottom:155px!important';
const cartList=drawer.querySelector('.supgo-cart-items');
function closeCart(){drawer.hidden=true;backdrop.hidden=true;document.body.classList.remove('supgo-cart-open');}
function openCart(){drawer.hidden=false;backdrop.hidden=false;document.body.classList.add('supgo-cart-open');renderCart();const button=drawer.querySelector('#supgoGoCheckout');if(button)button.hidden=false;}
drawer.querySelector('.supgo-cart-top button').onclick=closeCart;
backdrop.onclick=closeCart;
if(cartButton){cartButton.removeAttribute('onclick');cartButton.addEventListener('click',event=>{event.preventDefault();event.stopImmediatePropagation();location.assign('/carrito/');},true);}
function renderCart(){
 const saved=getCart(),meta=json(STORAGE.meta,{});
 cartList.replaceChildren();let subtotal=0,priced=true;
 for(const [key,entry] of Object.entries(saved)){
   const qty=Number(typeof entry==='object'?(entry.quantity??entry.qty):entry)||0;
   if(qty<=0)continue;
   const id=key.split('::')[0],product=catalog.find(x=>String(x.id)===id)?.product||{},fallback=meta[key]||{};
   const name=field(product,'name','nombre')||field(fallback,'name','nombre')||('Producto '+id);
   const promoActive=fallback.on_offer===true&&(!fallback.promoUntil||Date.parse(fallback.promoUntil)>Date.now());
   const rawPrice=promoActive?field(fallback,'price','precio'):(field(product,'price','precio')||field(fallback,'price','precio'));
   const price=Number(rawPrice);if(!Number.isFinite(price)||price<=0)priced=false;else subtotal+=price*qty;
   const line=document.createElement('div');line.className='supgo-cart-row';
   const img=document.createElement('img');img.alt='';img.loading='lazy';
   const src=field(product,'image','imagen','image_url')||field(fallback,'image','imagen');
   if(typeof src==='string'&&/^https?:\/\//.test(src))img.src=src;else img.hidden=true;
   const info=document.createElement('div');info.className='supgo-cart-info';
   const label=document.createElement('b');label.textContent=name;
   const each=document.createElement('small');each.textContent=price>0?'Unitario: '+money(price):'Precio por confirmar';
   const lineTotal=document.createElement('span');lineTotal.textContent=price>0?'Total: '+money(price*qty):'Total por confirmar';
   info.append(label,each,lineTotal);
   const actions=document.createElement('div');actions.className='supgo-cart-qty';
   const minus=document.createElement('button');minus.type='button';minus.textContent='−';minus.setAttribute('aria-label','Quitar una unidad');
   const number=document.createElement('span');number.textContent=String(qty);
   const plus=document.createElement('button');plus.type='button';plus.textContent='+';plus.setAttribute('aria-label','Agregar una unidad');
   const remove=document.createElement('button');remove.type='button';remove.textContent='Eliminar';remove.setAttribute('aria-label','Eliminar producto');
   function adjust(value){const updated=getCart();if(value<=0){delete updated[key];const m=json(STORAGE.meta,{});delete m[key];localStorage.setItem(STORAGE.meta,JSON.stringify(m));}else{const old=updated[key];updated[key]=typeof old==='object'?{...old,quantity:value}:value;}saveCart(updated);renderCart();}
   minus.onclick=()=>adjust(qty-1);plus.onclick=()=>adjust(qty+1);remove.onclick=()=>adjust(0);
   actions.append(minus,number,plus,remove);line.append(img,info,actions);cartList.append(line);
 }
 if(!cartList.children.length)cartList.textContent='Tu carrito está vacío.';
 drawer.querySelector('.supgo-cart-total strong').textContent=priced?money(subtotal):'Por confirmar';

}
// Checkout en la ficha SEO: misma aplicación principal, sin salir de esta página.
const checkoutLayer=document.createElement('section');
checkoutLayer.hidden=true;
checkoutLayer.setAttribute('aria-label','Finalizar pedido');
checkoutLayer.style.cssText='position:fixed;inset:0;z-index:2147483647;background:#fff;display:none;flex-direction:column;font-family:Poppins,Arial,sans-serif';
checkoutLayer.innerHTML='<div style="display:flex;align-items:center;justify-content:space-between;padding:10px 16px;border-bottom:1px solid #ddd"><strong>Finalizar pedido</strong><button type="button" data-close-checkout style="border:0;background:#171717;color:#fff;padding:10px 14px;cursor:pointer">Cerrar ×</button></div><div class="supgo-checkout-status" style="padding:12px 16px;font-size:13px">Cargando checkout…</div><iframe title="Checkout de SUPGO" style="border:0;width:100%;flex:1;min-height:0"></iframe>';
document.body.appendChild(checkoutLayer);
const checkoutFrame=checkoutLayer.querySelector('iframe'),checkoutStatus=checkoutLayer.querySelector('.supgo-checkout-status');
checkoutLayer.querySelector('[data-close-checkout]').onclick=()=>{checkoutLayer.hidden=true;checkoutLayer.style.display='none';checkoutFrame.removeAttribute('src');};
function findCheckout(openNativeCart){
 const w=checkoutFrame.contentWindow,d=checkoutFrame.contentDocument;
 if(!w||!d)return false;
 // Abrir el carrito nativo antes de continuar al formulario.
 if(openNativeCart&&typeof w.openOff==='function')try{w.openOff('cart');}catch(_){}
 const candidates=[...d.querySelectorAll('button,a,[role="button"],input[type="button"]')];
 const button=candidates.find(el=>/continuar pedido|finalizar pedido|proceder al pago|ir al checkout/i.test((el.textContent||el.value||'').trim()) && el.getClientRects().length);
 if(button){button.click();return true;}
 return false;
}
checkoutFrame.addEventListener('load',()=>{
 let attempt=0;
 const next=()=>{
  if(checkoutLayer.hidden)return;
  attempt++;
  try{if(findCheckout(attempt===1)){checkoutStatus.style.display='none';return;}}catch(e){console.warn('Checkout SEO:',e);}
  if(attempt<24)setTimeout(next,300);
  else checkoutStatus.textContent='Abre el carrito dentro del catálogo y pulsa Continuar pedido para completar la compra.';
 };
 next();
});
window.supgoOpenSeoCheckout=()=>{
 if(!Object.values(getCart()).some(v=>Number(typeof v==='object'?(v.quantity??v.qty):v)>0))return;
 closeCart();
 checkoutLayer.hidden=false;checkoutLayer.style.display='flex';checkoutStatus.style.display='block';checkoutStatus.textContent='Cargando checkout…';
 checkoutFrame.src='/';
};
drawer.querySelector('#supgoGoCheckout').onclick=()=>location.assign('/checkout/');
document.addEventListener('keydown',e=>{if(e.key==='Escape'){closeCart();closeMenu();}});
document.addEventListener('click',e=>{if(!popup.contains(e.target)&&!menuButton?.contains(e.target))closeMenu();});
window.addEventListener('storage',e=>{if(e.key===STORAGE.cart||e.key===STORAGE.meta){updateCount();if(!drawer.hidden)renderCart();}});
window.addEventListener('supgo-cart-change',()=>{updateCount();if(!drawer.hidden)renderCart();});
updateCount();
// Seguimiento compartido: utiliza el mismo renderer real del checkout/index,
// no una segunda plantilla que se desactualice.
(function sharedOrderDrawer(){
 const btn=host.querySelector('.myOrder');
 const shade=document.createElement('div');
 const panel=document.createElement('aside');
 shade.hidden=true;panel.hidden=true;
 shade.style.cssText='position:fixed;inset:0;z-index:2147483600;background:#0007';
 panel.style.cssText='position:fixed;top:0;right:0;width:min(100vw,650px);height:100dvh;z-index:2147483601;background:white;box-shadow:-10px 0 30px #0003;display:flex;flex-direction:column';
 panel.setAttribute('aria-label','Consultar mi pedido');
 panel.innerHTML='<div style="display:flex;align-items:center;justify-content:space-between;padding:12px 18px;border-bottom:1px solid #eee;font:600 15px Poppins,Arial,sans-serif"><span>Mi pedido</span><button type="button" aria-label="Cerrar seguimiento" style="border:0;background:#eee;border-radius:50%;width:34px;height:34px;font-size:22px;cursor:pointer">×</button></div><iframe title="Seguimiento de pedido SUPGO" style="width:100%;flex:1;border:0;min-height:0" loading="lazy"></iframe>';
 document.body.append(shade,panel);
 const frame=panel.querySelector('iframe');
 function close(){panel.hidden=true;shade.hidden=true;panel.style.setProperty('display','none','important');shade.style.setProperty('display','none','important');frame.removeAttribute('src');document.body.style.removeProperty('overflow');}
 function syncOpen(){panel.style.removeProperty('display');shade.style.removeProperty('display');panel.style.setProperty('display','flex');shade.style.setProperty('display','block');}
 function open(){shade.hidden=false;panel.hidden=false;syncOpen();if(!frame.getAttribute('src'))frame.src='/checkout/?seguimiento=1';}
 panel.querySelector('button').onclick=close;shade.onclick=close;
 if(btn){btn.removeAttribute('onclick');btn.addEventListener('click',e=>{e.preventDefault();e.stopImmediatePropagation();open();},true);}
 window.supgoOpenPedidoCompartido=open;
 window.addEventListener('supgo:pedido-generado',open);
 document.addEventListener('keydown',e=>{if(e.key==='Escape'&&!panel.hidden)close();});
})();
// Integración con las fichas HTML: las acciones de producto alimentan el
// mismo estado del index (liftCartV2 / liftCartMetaV1 / liftFavoritesV1).
// No se borra el almacenamiento SEO anterior ni se duplican encabezados.
(function connectProductPage(){
  const add=document.getElementById('add');
  const fav=document.getElementById('fav');
  if(!add&&!fav)return;
  const pageProduct=()=>{
    // Cada ficha incorpora su propio objeto JSON de producto.
    for(const script of document.querySelectorAll('script:not([src])')){
      const match=script.textContent.match(/const p=(\{[^;]+\});const f=document\.getElementById\('fav'\)/);
      if(match){try{return JSON.parse(match[1]);}catch(e){}}
    }
    return null;
  };
  const productFromPage=()=>{
    const p=pageProduct();
    if(!p||p.id==null)return null;
    const seo=json('supgo_seo_cart',[]);
    const entry=Array.isArray(seo)?seo.find(x=>x&&String(x.id)===String(p.id)):null;
    return entry||p;
  };
  if(add)add.addEventListener('click',event=>{
    const p=productFromPage();if(!p||p.id==null)return;
    event.preventDefault();event.stopImmediatePropagation();
    const key=String(p.id),cart=getCart(),old=cart[key];
    const selected=Number(document.getElementById('qtyValue')?.textContent?.trim()||1);const amount=Number.isFinite(selected)?Math.max(1,Math.min(99,Math.floor(selected))):1;cart[key]=(Number(typeof old==='object'?(old.quantity??old.qty):old)||0)+amount;
    const meta=json(STORAGE.meta,{});
    meta[key]={...(meta[key]||{}),name:p.name||p.nombre||'',image:p.image||p.imagen||'',price:p.price??p.precio??0,on_offer:p.on_offer===true,promoUntil:p.promoUntil||null};
    localStorage.setItem(STORAGE.meta,JSON.stringify(meta));saveCart(cart);openCart();
  },true);
  if(fav){
    const p=pageProduct();
    const saved=json('liftFavoritesV1',[]);
    if(p&&Array.isArray(saved)&&saved.some(id=>String(id)===String(p.id))){
      fav.textContent='♥';
    }
    fav.addEventListener('click',()=>{
      const product=pageProduct();
      if(!product||product.id==null)return;
      const entries=json('supgo_seo_favorites',[]);
      const selected=Array.isArray(entries)&&entries.some(x=>x&&String(x.id)===String(product.id));
      const all=new Set((json('liftFavoritesV1',[])||[]).map(Number).filter(Number.isFinite));
      const id=Number(product.id);
      if(!Number.isFinite(id))return;
      if(selected)all.add(id);else all.delete(id);
      localStorage.setItem('liftFavoritesV1',JSON.stringify([...all]));
      fav.textContent=selected?'♥':'♡';
    });
  }
})();
const url='https://vdxkknftyssjyfbdieqa.supabase.co/rest/v1/lift_productos';
const apiKey='sb_publishable_ECuhXuKIb85kj9fgdEjrAw_O7uNpZsh';
async function load(){
for(let offset=0;offset<5000;offset+=500){
const u=new URL(url);u.searchParams.set('select','id,product,activo');u.searchParams.set('activo','eq.true');u.searchParams.set('limit','500');u.searchParams.set('offset',String(offset));
const res=await fetch(u.href,{headers:{apikey:apiKey}});if(!res.ok)throw Error('Supabase '+res.status);
const rows=await res.json();catalog.push(...rows);if(rows.length<500)break;
}
if(!popup.hidden)draw(popup.querySelector('[data-tab].active').dataset.tab);

}
load().catch(err=>console.warn('SUPGO componentes: no se pudo cargar el catálogo',err));
})();
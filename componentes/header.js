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
const normalizeSearch=v=>escText(v).normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLocaleLowerCase('es').trim();
let selectedSuggestion=-1;
function suggestions(){return results?[...results.querySelectorAll('a.supgo-search-item')]:[];}
function selectSuggestion(i){const items=suggestions();selectedSuggestion=i;items.forEach((a,n)=>{a.classList.toggle('is-selected',n===i);a.setAttribute('aria-selected',String(n===i));});if(i>=0&&items[i])items[i].scrollIntoView({block:'nearest'});}
if(search){search.setAttribute('enterkeyhint','search');search.setAttribute('role','combobox');search.setAttribute('aria-autocomplete','list');search.setAttribute('aria-expanded','false');search.addEventListener('keydown',e=>{
 const items=suggestions();if((e.key==='ArrowDown'||e.key==='ArrowUp')&&items.length&&!results.hidden){e.preventDefault();selectSuggestion(e.key==='ArrowDown'?(selectedSuggestion+1)%items.length:(selectedSuggestion-1+items.length)%items.length);return;}
 if(e.key==='Escape'){results.hidden=true;search.setAttribute('aria-expanded','false');selectedSuggestion=-1;return;}
 if(e.key==='Enter'){e.preventDefault();if(selectedSuggestion>=0&&items[selectedSuggestion])location.assign(items[selectedSuggestion].href);else{const term=search.value.trim();if(term)go('buscar',term);}}
});}
if(results){results.hidden=true;results.setAttribute('role','listbox');}
/* Búsqueda: sin tildes, plural/singular, sinónimos comunes y orden por relevancia. */
const SEARCH_SYN={proteina:['whey','isolate','iso'],whey:['proteina'],creatina:['creatine','crea'],creatine:['creatina'],preentreno:['pre','pre-workout','preworkout','pre entreno'],pre:['preentreno'],quemador:['quemadores','fat','burner','lipo'],ganador:['gainer','mass','masa'],gainer:['ganador','masa'],masa:['mass','gainer'],vitamina:['vitamin','multivitaminico'],colageno:['collagen'],aminoacido:['bcaa','eaa','amino'],glutamina:['glutamine'],cafeina:['caffeine'],omega:['omega 3']};
const stem=w=>w.length>4&&w.endsWith('es')&&!w.endsWith('ces')?w.slice(0,-2):w.length>3&&w.endsWith('s')?w.slice(0,-1):w;
function searchTokens(term){return normalizeSearch(term).replace(/[^a-z0-9]+/g,' ').split(' ').filter(Boolean).map(stem)}
function matchScore(text,tokens,full){
 const n=normalizeSearch(text);if(!n)return -1;
 const words=n.replace(/[^a-z0-9]+/g,' ').split(' ').filter(Boolean).map(stem);
 let score=0;
 for(const t of tokens){
  const alts=[t,...(SEARCH_SYN[t]||[]).map(stem)];
  let best=0;
  for(const a of alts){const w=alts.indexOf(a)?0.7:1;
   if(words.includes(a))best=Math.max(best,3*w);
   else if(words.some(x=>x.startsWith(a)))best=Math.max(best,2*w);
   else if(a.length>=3&&n.includes(a))best=Math.max(best,1*w);}
  if(!best)return -1;score+=best;
 }
 if(n.startsWith(full))score+=3;if(n===full)score+=5;
 return score;
}
function isPublicItem(item){const p=item?.product||{};return item&&item.activo!==false&&!p.__deleted&&!p.__private&&!p.adminOnly&&!p.hidden&&!p.oculto&&p.visibility!=='admin'&&!!field(p,'name','nombre')&&seoSlug(field(p,'brand','marca'))!=='venom-pharma'}
function searchCatalog(raw,limit){
 const tokens=searchTokens(raw),full=normalizeSearch(raw);if(!tokens.length)return{products:[],groups:[],total:0};
 const products=[],brands=new Map(),cats=new Map();
 for(const item of catalog){if(!isPublicItem(item))continue;const p=item.product||{};
  const name=escText(field(p,'name','nombre')),brand=escText(field(p,'brand','marca')).trim(),cat=escText(field(p,'category','categoria')).trim();
  if(brand)brands.set(brand,(brands.get(brand)||0)+1);if(cat)cats.set(cat,(cats.get(cat)||0)+1);
  const sName=matchScore(name+' '+brand,tokens,full);
  const sAll=sName>=0?sName:matchScore(name+' '+brand+' '+cat,tokens,full);
  if(sAll>=0)products.push({item,name,score:sAll+(sName>=0?1:0)+(Number(field(p,'price','precio'))>0?0.5:0)+(field(p,'image','imagen')?0.3:0)});
 }
 products.sort((a,b)=>b.score-a.score||a.name.localeCompare(b.name,'es'));
 const groups=[];
 for(const [label,count] of brands){const sc=matchScore(label,tokens,full);if(sc>=0)groups.push({label,count,type:'Laboratorio',href:'/laboratorios/'+seoSlug(label)+'/',score:sc+2})}
 for(const [label,count] of cats){const sc=matchScore(label,tokens,full);if(sc>=0)groups.push({label,count,type:'Categoría',href:'/categorias/'+seoSlug(label)+'/',score:sc+2})}
 groups.sort((a,b)=>b.score-a.score||b.count-a.count);
 return{products:products.slice(0,limit),groups:groups.slice(0,3),total:products.length};
}
window.supgoSearch=searchCatalog;
function suggest(){
 if(!search||!results)return;
 const raw=search.value.trim(),term=normalizeSearch(raw);results.replaceChildren();selectedSuggestion=-1;
 if(term.length<2){results.hidden=true;search.setAttribute('aria-expanded','false');return;}
 ensureCatalog();
 const note=(text,cls)=>{const d=document.createElement('div');d.className='supgo-search-note '+(cls||'');d.textContent=text;results.append(d);return d};
 if(!catalogReady&&!catalog.length){note('Buscando…','is-loading');results.hidden=false;results.style.setProperty('--supgo-sr-top',Math.round(search.getBoundingClientRect().bottom+6)+'px');search.setAttribute('aria-expanded','true');return;}
 const {products,groups,total}=searchCatalog(raw,6);
 for(const g of groups){const a=document.createElement('a');a.className='supgo-search-item supgo-search-group';a.href=g.href;a.setAttribute('role','option');const ic=document.createElement('span');ic.className='supgo-search-icon';ic.textContent=g.type==='Laboratorio'?'🏷️':'📂';const c=document.createElement('span');c.className='supgo-search-content';const t=document.createElement('span');t.className='supgo-search-title';t.textContent=g.label;const sm=document.createElement('small');sm.className='supgo-search-type';sm.textContent=g.type+' · '+g.count+' productos';c.append(t,sm);a.append(ic,c);results.append(a)}
 for(const {item,name} of products){
  const p=item.product||{};const a=document.createElement('a');a.className='supgo-search-item';a.href='/productos/'+seoSlug(name)+'-'+item.id+'.html';a.setAttribute('role','option');
  const src=field(p,'image','imagen','image_url','imagen_url','foto','url_imagen');const photo=document.createElement('img');photo.className='supgo-search-photo';photo.alt='';photo.loading='lazy';if(typeof src==='string'&&/^https?:\/\//i.test(src))photo.src=src;else photo.style.visibility='hidden';photo.onerror=()=>{photo.style.visibility='hidden'};a.append(photo);
  const content=document.createElement('span');content.className='supgo-search-content';
  const title=document.createElement('span');title.className='supgo-search-title';title.textContent=name;content.append(title);
  const brand=escText(field(p,'brand','marca')).trim();
  const regular=Number(field(p,'price','precio'))||0;const offer=activeSearchOffers[String(item.id)];const sale=Number(offer?.price);const expiry=offer?.promoUntil?Date.parse(offer.promoUntil):NaN;const active=regular>0&&sale>0&&sale<regular&&(!Number.isFinite(expiry)||Date.now()<=expiry);
  const price=document.createElement('span');price.className='supgo-search-price';
  if(brand){const b=document.createElement('small');b.className='supgo-search-type';b.textContent=brand;price.append(b)}
  if(active){const now=document.createElement('strong');now.textContent=money(sale);const old=document.createElement('del');old.textContent=money(regular);const off=document.createElement('em');off.className='supgo-search-off';off.textContent='-'+Math.round((1-sale/regular)*100)+'%';price.append(now,old,off)}
  else if(regular>0){const now=document.createElement('strong');now.className='is-regular';now.textContent=money(regular);price.append(now)}
  content.append(price);a.append(content);results.append(a);
 }
 if(total){const all=document.createElement('a');all.className='supgo-search-item supgo-search-all';all.href='/buscar/?q='+encodeURIComponent(raw);all.setAttribute('role','option');all.textContent=total>products.length?'Ver los '+total+' resultados para “'+raw+'” →':'Ver resultados para “'+raw+'” →';results.append(all)}
 else if(!groups.length){const d=note('No encontramos “'+raw+'”.','is-empty');const wa=document.createElement('a');wa.className='supgo-search-wa';wa.href='https://wa.me/573137380766?text='+encodeURIComponent('Hola, ¿tienen '+raw+'?');wa.target='_blank';wa.rel='noopener';wa.textContent='Pregúntanos por WhatsApp';d.append(document.createElement('br'),wa)}
 results.hidden=!results.childElementCount;search.setAttribute('aria-expanded',String(!results.hidden));
 if(!results.hidden)results.style.setProperty('--supgo-sr-top',Math.round(search.getBoundingClientRect().bottom+6)+'px');
}
let activeSearchOffers={};
async function loadSearchOffers(){try{const u=new URL('https://vdxkknftyssjyfbdieqa.supabase.co/rest/v1/lift_catalog_config');u.searchParams.set('select','valor');u.searchParams.set('clave','eq.weekly_offers');u.searchParams.set('limit','1');const response=await fetch(u,{headers:{apikey:'sb_publishable_ECuhXuKIb85kj9fgdEjrAw_O7uNpZsh'}});if(!response.ok)return;const rows=await response.json();let value=rows[0]?.valor||{};if(typeof value==='string')value=JSON.parse(value);activeSearchOffers=value&&typeof value==='object'?value:{};if(search?.value.trim().length>=2)suggest();}catch(error){console.warn('Ofertas no disponibles en el buscador',error);}}
loadSearchOffers();
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
// Mi pedido se consulta exclusivamente en el index principal.
// No montar offcanvas ni iframe en las páginas independientes.
window.supgoOpenPedidoCompartido=function(){const origin=location.pathname+location.search+location.hash;try{sessionStorage.setItem('supgoPedidoReturnUrl',location.href)}catch(e){}location.assign('/mi-pedido/')};

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
/* Índice liviano: solo los campos que usa el header (antes descargaba todo el catálogo con SEO). */
const INDEX_KEY='supgoSearchIndexV1',INDEX_TTL=30*60*1000;
const LIGHT='id,activo,name:product->>name,brand:product->>brand,category:product->>category,price:product->>price,image:product->>image,del:product->>__deleted,priv:product->>__private,adm:product->>adminOnly,hid:product->>hidden,vis:product->>visibility';
const lightRow=r=>({id:r.id,activo:r.activo,product:{name:r.name,brand:r.brand,category:r.category,price:Number(r.price)||0,image:r.image,__deleted:r.del==='true',__private:r.priv==='true',adminOnly:r.adm==='true',hidden:r.hid==='true',visibility:r.vis}});
let catalogReady=false,catalogPromise=null;
function setCatalog(rows){catalog.length=0;catalog.push(...rows.filter(isPublicItem));catalogReady=true;if(!popup.hidden)draw(popup.querySelector('[data-tab].active').dataset.tab);if(search&&document.activeElement===search&&search.value.trim().length>=2)suggest();}
function ensureCatalog(){
 if(catalogPromise)return catalogPromise;
 try{const c=JSON.parse(localStorage.getItem(INDEX_KEY)||'null');if(c&&Array.isArray(c.rows)&&Date.now()-c.t<INDEX_TTL){setCatalog(c.rows);return catalogPromise=Promise.resolve()}}catch{}
 try{const full=JSON.parse(localStorage.getItem('supgoCatalogV1')||'null');if(full&&Array.isArray(full.rows)&&full.rows.length)setCatalog(full.rows)}catch{}
 const page=offset=>{const u=new URL(url);u.searchParams.set('select',LIGHT);u.searchParams.set('activo','eq.true');u.searchParams.set('order','id.asc');u.searchParams.set('limit','1000');u.searchParams.set('offset',String(offset));return fetch(u.href,{headers:{apikey:apiKey}}).then(r=>{if(!r.ok)throw Error('Supabase '+r.status);return r.json()})};
 return catalogPromise=(async()=>{const first=await Promise.all([0,1000,2000].map(page));const rows=first.flat();if(first[2].length===1000){for(let o=3000;o<8000;o+=1000){const more=await page(o);rows.push(...more);if(more.length<1000)break}}
  const light=rows.map(lightRow);setCatalog(light);try{localStorage.setItem(INDEX_KEY,JSON.stringify({t:Date.now(),rows:light}))}catch{}})().catch(err=>{catalogPromise=null;catalogReady=true;console.warn('SUPGO componentes: no se pudo cargar el catálogo',err)});
}
if(search)search.addEventListener('focus',()=>ensureCatalog(),{once:true});
(window.requestIdleCallback||(f=>setTimeout(f,1500)))(()=>ensureCatalog());
})();
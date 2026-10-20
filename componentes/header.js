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
function go(key,value){const u=new URL(ROOT);if(key)u.searchParams.set(key,value);location.href=u.href;}
function getCart(){const data=json(STORAGE.cart,{});return data&&typeof data==='object'&&!Array.isArray(data)?data:{};}
function saveCart(data){localStorage.setItem(STORAGE.cart,JSON.stringify(data));window.dispatchEvent(new Event('supgo-cart-change'));updateCount();}
const bar=host.querySelector('.bar');
const menuButton=host.querySelector('.filterMobile'),offerButton=host.querySelector('#offersButton');
const search=host.querySelector('#q'),results=host.querySelector('#searchResults');
const cartButton=host.querySelector('.cartDesktop'),count=host.querySelector('#count');
if(offerButton)offerButton.onclick=()=>go('ofertas','1');
const brand=host.querySelector('.brand');if(brand&&!brand.matches('a[href]')){brand.style.cursor='pointer';brand.onclick=()=>go();}
host.querySelectorAll('.liftFilterLink').forEach(el=>el.onclick=()=>navigator.clipboard?.writeText(ROOT.href+'?ofertas=1'));
function updateCount(){let total=0;Object.values(getCart()).forEach(v=>{const n=typeof v==='number'?v:Number(v?.quantity??v?.qty??v);if(Number.isFinite(n)&&n>0)total+=n;});if(count)count.textContent=total;return total;}
const popup=document.createElement('div');popup.className='supgo-menu';popup.hidden=true;
popup.innerHTML='<div class="supgo-tabs"><button type="button" data-tab="brands" class="active">Laboratorios</button><button type="button" data-tab="categories">Categorías</button></div><div class="supgo-links"></div>';
host.append(popup);
let catalog=[];
const field=(p,...names)=>{for(const n of names){if(p&&p[n]!=null&&p[n]!=='')return p[n];}return '';};
function draw(tab){
const key=tab==='categories'?'categoria':'marca',names=tab==='categories'?['category','categoria']:['brand','marca'];
const values=[...new Set(catalog.map(item=>escText(field(item.product,...names)).trim()).filter(Boolean))].sort((a,b)=>a.localeCompare(b,'es'));
const links=popup.querySelector('.supgo-links');links.replaceChildren();
for(const v of values){const a=document.createElement('a'),u=new URL(ROOT);u.searchParams.set(key,v);a.href=u.href;a.textContent=v;links.append(a);}
if(!values.length)links.textContent='No se pudieron cargar los filtros.';
}
if(menuButton){menuButton.removeAttribute('onclick');menuButton.onclick=()=>{popup.hidden=!popup.hidden;if(!popup.hidden)draw(popup.querySelector('[data-tab].active').dataset.tab);};}
popup.querySelectorAll('[data-tab]').forEach(b=>b.onclick=()=>{popup.querySelectorAll('[data-tab]').forEach(x=>x.classList.toggle('active',x===b));draw(b.dataset.tab);});
if(search){search.setAttribute('enterkeyhint','search');search.addEventListener('keydown',e=>{if(e.key==='Enter'){e.preventDefault();const term=search.value.trim();if(term)go('buscar',term);}});}
if(results){results.hidden=true;}
function suggest(){
if(!search||!results)return;
const term=search.value.trim().toLocaleLowerCase('es');results.replaceChildren();
if(term.length<2){results.hidden=true;return;}
for(const item of catalog.filter(x=>escText(field(x.product,'name','nombre')).toLocaleLowerCase('es').includes(term)).slice(0,7)){
const p=item.product||{},a=document.createElement('a');
a.className='supgo-search-item';
const u=new URL(ROOT);u.searchParams.set('producto',item.id);a.href=u.href;
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
if(search)search.addEventListener('input',suggest);
// Carrito único compartido entre fichas SEO (misma clave que el catálogo).
const backdrop=document.createElement('div');backdrop.className='supgo-cart-overlay';backdrop.hidden=true;
const drawer=document.createElement('aside');drawer.className='supgo-cart-drawer';drawer.hidden=true;
drawer.setAttribute('aria-label','Carrito de compra');
drawer.innerHTML='<div class="supgo-cart-top"><strong>Tu carrito</strong><button type="button" aria-label="Cerrar carrito">×</button></div><div class="supgo-cart-items"></div><div class="supgo-cart-bottom"><button type="button" id="supgoGoCheckout">Continuar pedido</button><div class="supgo-cart-total"><span>Subtotal</span><strong></strong></div></div>';
document.body.append(backdrop,drawer);
const cartList=drawer.querySelector('.supgo-cart-items');
function closeCart(){drawer.hidden=true;backdrop.hidden=true;document.body.classList.remove('supgo-cart-open');}
function openCart(){drawer.hidden=false;backdrop.hidden=false;document.body.classList.add('supgo-cart-open');renderCart();const button=drawer.querySelector('#supgoGoCheckout');if(button)button.hidden=false;}
drawer.querySelector('.supgo-cart-top button').onclick=closeCart;
backdrop.onclick=closeCart;
if(cartButton){cartButton.removeAttribute('onclick');cartButton.addEventListener('click',event=>{event.preventDefault();event.stopImmediatePropagation();openCart();},true);}
function renderCart(){
 const saved=getCart(),meta=json(STORAGE.meta,{});
 cartList.replaceChildren();let subtotal=0,priced=true;
 for(const [key,entry] of Object.entries(saved)){
   const qty=Number(typeof entry==='object'?(entry.quantity??entry.qty):entry)||0;
   if(qty<=0)continue;
   const id=key.split('::')[0],product=catalog.find(x=>String(x.id)===id)?.product||{},fallback=meta[key]||{};
   const name=field(product,'name','nombre')||field(fallback,'name','nombre')||('Producto '+id);
   const rawPrice=field(product,'price','precio')||field(fallback,'price','precio');
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
drawer.querySelector('#supgoGoCheckout').onclick=window.supgoOpenSeoCheckout;
const orderButton=document.createElement('button');orderButton.type='button';orderButton.className='myOrder';orderButton.textContent='📦 Mi pedido';
if(cartButton)cartButton.before(orderButton);else bar?.append(orderButton);
orderButton.onclick=()=>go('mi-pedido','1');
document.addEventListener('keydown',e=>{if(e.key==='Escape'){closeCart();popup.hidden=true;}});
document.addEventListener('click',e=>{if(!popup.contains(e.target)&&!menuButton?.contains(e.target))popup.hidden=true;});
window.addEventListener('storage',e=>{if(e.key===STORAGE.cart||e.key===STORAGE.meta){updateCount();if(!drawer.hidden)renderCart();}});
window.addEventListener('supgo-cart-change',()=>{updateCount();if(!drawer.hidden)renderCart();});
updateCount();
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
    cart[key]=(Number(typeof old==='object'?(old.quantity??old.qty):old)||0)+1;
    const meta=json(STORAGE.meta,{});
    meta[key]={...(meta[key]||{}),name:p.name||p.nombre||'',image:p.image||p.imagen||'',price:p.price??p.precio??0};
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
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
if(menuButton)menuButton.onclick=()=>{popup.hidden=!popup.hidden;if(!popup.hidden)draw(popup.querySelector('[data-tab].active').dataset.tab);};
popup.querySelectorAll('[data-tab]').forEach(b=>b.onclick=()=>{popup.querySelectorAll('[data-tab]').forEach(x=>x.classList.toggle('active',x===b));draw(b.dataset.tab);});
if(search){search.setAttribute('enterkeyhint','search');search.addEventListener('keydown',e=>{if(e.key==='Enter'){e.preventDefault();const term=search.value.trim();if(term)go('buscar',term);}});}
if(results){results.hidden=true;}
function suggest(){
if(!search||!results)return;
const term=search.value.trim().toLocaleLowerCase('es');results.replaceChildren();
if(term.length<2){results.hidden=true;return;}
for(const item of catalog.filter(x=>escText(field(x.product,'name','nombre')).toLocaleLowerCase('es').includes(term)).slice(0,7)){
const a=document.createElement('a');a.textContent=field(item.product,'name','nombre');
const u=new URL(ROOT);u.searchParams.set('producto',item.id);a.href=u.href;results.append(a);
}
results.hidden=!results.childElementCount;
}
if(search)search.addEventListener('input',suggest);
const overlay=document.createElement('div');overlay.className='supgo-cart-overlay';overlay.hidden=true;
const drawer=document.createElement('aside');drawer.className='supgo-cart-drawer';drawer.hidden=true;
drawer.setAttribute('aria-label','Carrito de SUPGO');drawer.innerHTML='<div class="supgo-cart-top"><strong>Tu carrito</strong><button type="button" aria-label="Cerrar carrito">×</button></div><div class="supgo-cart-items"></div><div class="supgo-cart-bottom"><div class="supgo-cart-total"><span>Subtotal estimado</span><strong></strong></div><button type="button" id="supgoGoCheckout">Continuar pedido</button></div>';
host.append(overlay,drawer);
function closeCart(){overlay.hidden=true;drawer.hidden=true;document.body.classList.remove('supgo-cart-open');}
const close=drawer.querySelector('.supgo-cart-top button');close.onclick=closeCart;overlay.onclick=closeCart;
drawer.querySelector('#supgoGoCheckout').onclick=()=>go('carrito','1');
function renderCart(){
const list=drawer.querySelector('.supgo-cart-items'),cart=getCart(),meta=json(STORAGE.meta,{});
list.replaceChildren();let total=0;
const entries=Object.entries(cart).filter(([k,v])=>Number(typeof v==='object'?(v.quantity??v.qty):v)>0);
if(!entries.length){list.textContent='Tu carrito está vacío.';}
for(const [key,value] of entries){
const id=key.split('::')[0],p=catalog.find(x=>String(x.id)===id)?.product||{},m=meta[key]||{},qty=Number(typeof value==='object'?(value.quantity??value.qty):value)||1;
const price=Number(field(m,'price','precio')||field(p,'price','precio')||0);total+=price*qty;
const row=document.createElement('div');row.className='supgo-cart-row';
const img=document.createElement('img');img.loading='lazy';img.alt='';const image=field(m,'image','imagen')||field(p,'image','imagen');if(typeof image==='string'&&/^https?:\/\//.test(image))img.src=image;
const info=document.createElement('div');info.className='supgo-cart-info';const title=document.createElement('b');title.textContent=field(p,'name','nombre')||field(m,'name','nombre')||'Producto '+id;const amount=document.createElement('span');amount.textContent=price?money(price*qty):'Precio por confirmar';info.append(title,amount);
const controls=document.createElement('div');controls.className='supgo-cart-qty';
const decrement=document.createElement('button');decrement.type='button';decrement.textContent='−';
const num=document.createElement('span');num.textContent=qty;
const increment=document.createElement('button');increment.type='button';increment.textContent='+';
function change(delta){const updated=getCart(),current=Number(typeof updated[key]==='object'?(updated[key].quantity??updated[key].qty):updated[key])||0,amount=current+delta;if(amount<=0)delete updated[key];else if(typeof updated[key]==='object')updated[key]={...updated[key],quantity:amount};else updated[key]=amount;saveCart(updated);renderCart();}
decrement.onclick=()=>change(-1);increment.onclick=()=>change(1);
controls.append(decrement,num,increment);row.append(img,info,controls);list.append(row);
}
drawer.querySelector('.supgo-cart-total strong').textContent=money(total);updateCount();
}
if(cartButton)cartButton.onclick=()=>{overlay.hidden=false;drawer.hidden=false;document.body.classList.add('supgo-cart-open');renderCart();};
const orderButton=document.createElement('button');orderButton.type='button';orderButton.className='myOrder';orderButton.textContent='📦 Mi pedido';
if(cartButton)cartButton.before(orderButton);else bar?.append(orderButton);
orderButton.onclick=()=>go('mi-pedido','1');
document.addEventListener('keydown',e=>{if(e.key==='Escape'){closeCart();popup.hidden=true;}});
document.addEventListener('click',e=>{if(!popup.contains(e.target)&&!menuButton?.contains(e.target))popup.hidden=true;});
window.addEventListener('storage',e=>{if(e.key===STORAGE.cart||e.key===STORAGE.meta){updateCount();if(!drawer.hidden)renderCart();}});
window.addEventListener('supgo-cart-change',()=>{updateCount();if(!drawer.hidden)renderCart();});
updateCount();
const url='https://vdxkknftyssjyfbdieqa.supabase.co/rest/v1/lift_productos';
const apiKey='sb_publishable_ECuhXuKIb85kj9fgdEjrAw_O7uNpZsh';
async function load(){
for(let offset=0;offset<5000;offset+=500){
const u=new URL(url);u.searchParams.set('select','id,product,activo');u.searchParams.set('activo','eq.true');u.searchParams.set('limit','500');u.searchParams.set('offset',String(offset));
const res=await fetch(u.href,{headers:{apikey:apiKey}});if(!res.ok)throw Error('Supabase '+res.status);
const rows=await res.json();catalog.push(...rows);if(rows.length<500)break;
}
if(!popup.hidden)draw(popup.querySelector('[data-tab].active').dataset.tab);
if(!drawer.hidden)renderCart();
}
load().catch(err=>console.warn('SUPGO componentes: no se pudo cargar el catálogo',err));
})();
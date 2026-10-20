/* SUPGO header for SEO pages. Shares the index's cart through localStorage. */
(function(){
 'use strict';
 const host=document.getElementById('supgo-global-header');if(!host)return;
 const root='https://supgo.co/';
 const api='https://vdxkknftyssjyfbdieqa.supabase.co/rest/v1/lift_productos';
 const key='sb_publishable_ECuhXuKIb85kj9fgdEjrAw_O7uNpZsh';
 const getJson=k=>{try{return JSON.parse(localStorage.getItem(k)||'{}')}catch{return {}}};
 const route=(name,value)=>{const u=new URL(root);if(name)u.searchParams.set(name,value);location.assign(u.href);};
 const bar=host.querySelector('.bar');
 // Drop inline index-only handlers; these actions are handled here.
 const menuButton=host.querySelector('.filterMobile'),offers=host.querySelector('#offersButton'),cartButton=host.querySelector('.cartDesktop');
 const badge=host.querySelector('#count'),query=host.querySelector('#q');
 const menu=document.createElement('section');menu.className='supgo-menu';menu.hidden=true;
 menu.innerHTML='<div class="supgo-tabs"><button class="active" type="button" data-tab="brands">Laboratorios</button><button type="button" data-tab="categories">Categorías</button></div><div class="supgo-links"></div>';
 host.append(menu);
 const orderButton=document.createElement('button');orderButton.className='myOrder';orderButton.type='button';orderButton.textContent='📦 Mi pedido';if(cartButton)cartButton.before(orderButton);else bar.append(orderButton);
 const overlay=document.createElement('div');overlay.className='supgo-cart-overlay';overlay.hidden=true;
 const drawer=document.createElement('aside');drawer.className='supgo-cart-drawer';drawer.hidden=true;
 drawer.innerHTML='<div class="supgo-cart-top"><strong>Tu carrito</strong><button type="button" aria-label="Cerrar carrito" id="supgoCartClose">×</button></div><div class="supgo-cart-items"></div><div class="supgo-cart-bottom"><div class="supgo-cart-total"><span>Subtotal</span><strong>$ 0</strong></div><button type="button" id="supgoGoCheckout">Continuar pedido en SUPGO</button></div>';
 host.append(overlay,drawer);
 const order=document.createElement('dialog');order.className='supgo-order-dialog';order.innerHTML='<form><strong>Consultar mi pedido</strong><p>Escribe el número de pedido para consultar su estado.</p><input inputmode="numeric" required pattern="[0-9]+" placeholder="Número de pedido"><div class="supgo-order-actions"><button type="button">Cancelar</button><button type="submit">Consultar</button></div></form>';host.append(order);
 const products=new Map();let brands=[],categories=[],searchProducts=[],loaded=false;
 function count(){const cart=getJson('liftCartV2');const n=Object.values(cart).reduce((sum,v)=>sum+(Number(v)||0),0);if(badge)badge.textContent=n;return n;}
 const money=n=>new Intl.NumberFormat('es-CO',{style:'currency',currency:'COP',maximumFractionDigits:0}).format(Number(n)||0);
 async function request(url){const response=await fetch(url,{headers:{apikey:key,Authorization:'Bearer '+key}});if(!response.ok)throw Error('Supabase '+response.status);return response.json();}
 async function loadCart(){
  const entries=Object.entries(getJson('liftCartV2')).filter(([k,q])=>Number(q)>0);
  const ids=[...new Set(entries.map(([k])=>k.split('::')[0]).filter(x=>/^\d+$/.test(x)))];
  const missing=ids.filter(id=>!products.has(String(id)));
  if(missing.length){try{const rows=await request(api+'?select=id,product&' + new URLSearchParams({id:'in.('+missing.join(',')+')'}));rows.forEach(x=>products.set(String(x.id),x.product||{}));}catch(e){console.warn('SUPGO cart details',e);}}
  return entries;
 }
 function closeCart(){drawer.hidden=true;overlay.hidden=true;document.body.classList.remove('supgo-cart-open');}
 async function renderCart(){
  count();const entries=await loadCart();const meta=getJson('liftCartMetaV1'),list=drawer.querySelector('.supgo-cart-items');list.replaceChildren();let total=0;
  if(!entries.length){list.textContent='Tu carrito está vacío.';}
  entries.forEach(([cartKey,quantity])=>{
    const id=cartKey.split('::')[0],p=products.get(id)||{},m=meta[cartKey]||{};
    const qty=Math.max(1,Number(quantity)||1);
    const price=Number(m.price||p.price||p.precio||0);
    total+=price*qty;
    const name=p.name||p.nombre||('Producto '+id),flavor=m.flavor||cartKey.split('::').slice(1).join('::');
    const item=document.createElement('div');item.className='supgo-cart-row';
    const img=document.createElement('img');img.alt=name;img.loading='lazy';img.src=m.image||p.image||p.imagen||'';
    const info=document.createElement('div');info.className='supgo-cart-info';
    const title=document.createElement('b');title.textContent=name;info.append(title);
    if(flavor){const small=document.createElement('small');small.textContent='Sabor: '+flavor;info.append(small);}
    const cost=document.createElement('span');cost.textContent=price?money(price*qty):'Precio a consultar';info.append(cost);
    const controls=document.createElement('div');controls.className='supgo-cart-qty';
    for(const [label,delta] of [['−',-1],['+',1]]){const b=document.createElement('button');b.type='button';b.textContent=label;b.addEventListener('click',()=>change(cartKey,delta));controls.append(b);if(delta===-1){const v=document.createElement('span');v.textContent=qty;controls.append(v);}}
    const del=document.createElement('button');del.type='button';del.className='supgo-cart-remove';del.textContent='×';del.setAttribute('aria-label','Eliminar');del.addEventListener('click',()=>change(cartKey,-qty));
    item.append(img,info,controls,del);list.append(item);
  });
  drawer.querySelector('.supgo-cart-total strong').textContent=money(total);
 }
 function change(k,delta){
   const cart=getJson('liftCartV2'),meta=getJson('liftCartMetaV1'),next=(Number(cart[k])||0)+delta;
   if(next<=0){delete cart[k];delete meta[k]}else cart[k]=next;
   localStorage.setItem('liftCartV2',JSON.stringify(cart));localStorage.setItem('liftCartMetaV1',JSON.stringify(meta));renderCart();
 }
 if(cartButton)cartButton.onclick=()=>{overlay.hidden=false;drawer.hidden=false;document.body.classList.add('supgo-cart-open');renderCart();};
 drawer.querySelector('#supgoCartClose').onclick=closeCart;overlay.onclick=closeCart;
 drawer.querySelector('#supgoGoCheckout').onclick=()=>route('carrito','1');
 orderButton.onclick=()=>order.showModal();
 order.querySelector('button[type=button]').onclick=()=>order.close();
 order.querySelector('form').onsubmit=e=>{e.preventDefault();const id=order.querySelector('input').value.replace(/\D/g,'');if(id)route('pedido',id);};
 if(offers)offers.onclick=()=>route('ofertas','1');
 const logo=host.querySelector('.brand');if(logo&&logo.tagName!=='A')logo.onclick=()=>route();
 function draw(tab){
  const values=tab==='brands'?brands:categories,param=tab==='brands'?'marca':'categoria',list=menu.querySelector('.supgo-links');list.replaceChildren();
  values.forEach(name=>{const link=document.createElement('a');link.textContent=name;const u=new URL(root);u.searchParams.set(param,name);link.href=u.href;list.append(link);});
 }
 if(menuButton)menuButton.onclick=()=>{menu.hidden=!menu.hidden;if(!menu.hidden)draw(menu.querySelector('[data-tab].active').dataset.tab);};
 menu.querySelectorAll('[data-tab]').forEach(button=>button.onclick=()=>{menu.querySelectorAll('[data-tab]').forEach(x=>x.classList.toggle('active',x===button));draw(button.dataset.tab);});
 document.addEventListener('click',e=>{if(!menu.contains(e.target)&&!menuButton?.contains(e.target))menu.hidden=true;});
 document.addEventListener('keydown',e=>{if(e.key==='Escape')closeCart();});
 const result=host.querySelector('#searchResults');if(result)result.hidden=true;
 if(query){
  query.setAttribute('enterkeyhint','search');
  query.onkeydown=e=>{if(e.key==='Enter'){e.preventDefault();const term=query.value.trim();if(term)route('buscar',term);}};
  query.oninput=()=>{if(!result)return;const term=query.value.trim().toLocaleLowerCase('es');result.replaceChildren();if(term.length<2){result.hidden=true;return;}searchProducts.filter(p=>p.name.toLocaleLowerCase('es').includes(term)).slice(0,7).forEach(p=>{const a=document.createElement('a');a.textContent=p.name;const u=new URL(root);u.searchParams.set('producto',p.id);a.href=u.href;result.append(a);});result.hidden=!result.children.length;};
 }
 async function loadCatalog(){
  const rows=[];for(let offset=0;offset<5000;offset+=500){const chunk=await request(api+'?select=id,product,activo&activo=eq.true&order=id.asc&limit=500&offset='+offset);rows.push(...chunk);if(chunk.length<500)break;}
  const visible=rows.filter(r=>r.product&&!r.product.__private&&!r.product.adminOnly&&!r.product.hidden&&!r.product.oculto);
  const unique=key=>[...new Set(visible.map(r=>String(r.product[key]||r.product[key==='brand'?'marca':'categoria']||'').trim()).filter(Boolean))].sort((a,b)=>a.localeCompare(b,'es'));
  brands=unique('brand');categories=unique('category');
  searchProducts=visible.map(r=>({id:r.id,name:String(r.product.name||r.product.nombre||'')})).filter(r=>r.name);
  visible.forEach(r=>products.set(String(r.id),r.product));
  loaded=true;if(!menu.hidden)draw('brands');if(!drawer.hidden)renderCart();
 }
 count();loadCatalog().catch(e=>console.warn('SUPGO header catalog',e));
 window.addEventListener('storage',e=>{if(e.key==='liftCartV2'||e.key==='liftCartMetaV1'){count();if(!drawer.hidden)renderCart();}});
})();

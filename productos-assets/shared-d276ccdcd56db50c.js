
(function(){
 const $=id=>document.getElementById(id);
 const esc2=s=>String(s??'').replace(/[&<>\"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',"'":'&#39;'}[c]));
 const norm2=s=>String(s??'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().trim();
 function products(){try{return Array.isArray(window.PRODUCTS)?window.PRODUCTS:(Array.isArray(PRODUCTS)?PRODUCTS:[])}catch(e){return []}}
 function admin(){return document.body.classList.contains('liftAdminUnlocked')}
 function ensureHeaderButton(){
   if($('liftDirectCheckoutBtn'))return;
   const bar=document.querySelector('.top .bar'); if(!bar)return;
   const b=document.createElement('button');b.id='liftDirectCheckoutBtn';b.type='button';b.className='iconbtn';b.title='Abrir checkout directo';
   b.innerHTML='<span style="font-size:18px">▣</span><span class="txt">Checkout</span>';
   b.onclick=function(){window.liftOpenDirectCheckout()};
   const cart=bar.querySelector('.cartDesktop'); cart?bar.insertBefore(b,cart):bar.appendChild(b);
 }
 function ensureSearch(){
   const modal=$('checkoutModal'); if(!modal||$('liftCheckoutCatalogSearch'))return;
   const body=modal.querySelector('.checkoutBody'); if(!body)return;
   const productListHost=modal.querySelector('#checkoutItems'); if(!productListHost)return;
   const box=document.createElement('div');box.id='liftCheckoutCatalogSearch';box.className='liftCheckoutCatalogSearch';
   box.innerHTML='<label>Agregar productos al pedido</label><div class="liftCheckoutCatalogSearchRow"><input id="liftCheckoutCatalogInput" autocomplete="off" placeholder="Buscar producto, marca o sabor..."></div><div id="liftCheckoutCatalogResults" class="liftCheckoutCatalogResults"></div>';
   // El buscador administrativo queda justo encima de los productos agregados al pedido.
   productListHost.parentNode.insertBefore(box,productListHost);
   const inp=$('liftCheckoutCatalogInput');
   inp.addEventListener('input',()=>renderResults(inp.value));
   inp.addEventListener('focus',()=>{if(inp.value.trim())renderResults(inp.value)});
   document.addEventListener('click',e=>{if(!box.contains(e.target))$('liftCheckoutCatalogResults')?.classList.remove('show')});
 }
 function resultLabel(p){return [p.brand||p.marca||'',p.presentation||'',p.flavor||p.sabor||''].filter(Boolean).join(' · ')}
 function renderResults(q){
   const box=$('liftCheckoutCatalogResults');if(!box)return;const nq=norm2(q);
   if(!nq){box.classList.remove('show');box.innerHTML='';return}
   const rows=products().filter(p=>{
     if(p?.visible_publico===false&&!admin())return false;
     return norm2([p.name,p.nombre,p.brand,p.marca,p.presentation,p.presentacion,p.flavor,p.sabor].join(' ')).includes(nq)
   }).slice(0,30);
   box.innerHTML=rows.length?rows.map(p=>`<div class="liftCheckoutCatalogResult"><img src="${esc2(p.image||p.imagen||'')}" onerror="this.style.visibility='hidden'"><div><b>${esc2(p.name||p.nombre||'Producto')}</b><small>${esc2(resultLabel(p))}</small></div><button type="button" class="liftCheckoutCatalogAdd" onclick="liftCheckoutAddCatalogProduct(${Number(p.id)})">+ Agregar</button></div>`).join(''):'<div class="liftCheckoutCatalogEmpty">No encontré productos.</div>';
   box.classList.add('show');
 }
 window.liftCheckoutAddCatalogProduct=function(id){
   const p=products().find(x=>String(x.id)===String(id));if(!p)return;
   try{
     checkoutMode='cart';checkoutSingleId=null;
     const flavor=String(p.flavor||p.sabor||'').trim();
     if(flavor&&typeof addVariant==='function') addVariant(p.id,flavor,p.image||p.imagen||'',{});
     else if(typeof add==='function') add(p.id);
     else {cart[String(p.id)]=(Number(cart[String(p.id)])||0)+1;saveCart();renderCart()}
     renderCheckoutSummary();
     const inp=$('liftCheckoutCatalogInput');if(inp){inp.value='';inp.focus()}
     $('liftCheckoutCatalogResults')?.classList.remove('show');
   }catch(e){console.error(e);alert('No pude agregar el producto al checkout: '+(e.message||e))}
 };
 window.liftOpenDirectCheckout=function(){
   if(!admin())return;
   checkoutMode='cart';checkoutSingleId=null;
   if(typeof saveCart==='function')saveCart();
   if(typeof openCheckout==='function')openCheckout();
   setTimeout(()=>{$('liftCheckoutCatalogInput')?.focus()},80);
 };
 function install(){ensureHeaderButton();ensureSearch()}
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install);else install();
 const mo=new MutationObserver(()=>{ensureHeaderButton();ensureSearch()});mo.observe(document.documentElement,{childList:true,subtree:true});
})();

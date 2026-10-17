
(function(){
 const escAttr=s=>String(s??'').replace(/&/g,'&amp;').replace(/"/g,'&quot;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
 function checkoutRows(){try{return typeof checkoutItemsList==='function'?checkoutItemsList():[]}catch(e){return []}}
 function rerender(){try{renderCheckoutSummary()}catch(e){}try{renderCart()}catch(e){}try{saveCart()}catch(e){}}
 window.liftCheckoutQtyChange=function(encodedKey,d){
   const key=decodeURIComponent(encodedKey);if(typeof cart==='undefined'||!cart[key])return;
   cart[key]=Math.max(0,Number(cart[key]||0)+Number(d||0));
   if(cart[key]<=0){delete cart[key];try{delete cartMeta[key]}catch(e){}}
   rerender();
 };
 window.liftCheckoutRemoveItem=function(encodedKey){
   const key=decodeURIComponent(encodedKey);if(typeof cart==='undefined')return;
   delete cart[key];try{delete cartMeta[key]}catch(e){}rerender();
 };
 window.liftCheckoutOpenItem=function(id){
   if(typeof openLiftProductById==='function')openLiftProductById(Number(id));
 };
 window.liftCheckoutEditVariant=function(encodedKey,id){
   window.LIFT_CHECKOUT_EDIT_KEY=decodeURIComponent(encodedKey);
   if(typeof openLiftProductById==='function')openLiftProductById(Number(id));
 };
 function hasVariants(p){
   try{if(p?._variantGroupId)return true;if(typeof liftGroupByProductId==='function'&&liftGroupByProductId(p?.id))return true;if(typeof flavorsFor==='function'&&flavorsFor(p?.id)?.length)return true;return Array.isArray(p?.flavors)&&p.flavors.length>1}catch(e){return false}
 }
 function decorate(){
   const host=document.getElementById('checkoutItems');if(!host)return;
   const rows=checkoutRows(),cards=[...host.querySelectorAll('.checkoutProduct')];
   cards.forEach((card,i)=>{
     const x=rows[i];if(!x||!x.key)return;const key=String(x.key),enc=encodeURIComponent(key),pid=Number(x.p?.id||String(key).split('::')[0]);
     const img=card.querySelector('.checkoutProductImg'),name=card.querySelector('.checkoutProductName');
     [img,name].forEach(el=>{if(el){el.title='Abrir producto';el.onclick=e=>{e.stopPropagation();liftCheckoutOpenItem(pid)}}});
     const info=card.querySelector('.checkoutProductInfo');if(!info)return;
     info.querySelector('.liftCheckoutItemTools')?.remove();
     const tools=document.createElement('div');tools.className='liftCheckoutItemTools';
     tools.innerHTML=`<button type="button" class="liftCheckoutItemBtn remove" onclick="event.stopPropagation();liftCheckoutRemoveItem('${enc}')">Quitar</button>`;
     info.appendChild(tools);
   });
 }
 const baseRender=window.renderCheckoutSummary;
 if(typeof baseRender==='function')window.renderCheckoutSummary=function(){const r=baseRender.apply(this,arguments);setTimeout(decorate,0);return r};
 // Cuando se está editando un sabor desde checkout, el siguiente sabor agregado reemplaza la línea anterior.
 const baseAddVariant=window.addVariant;
 if(typeof baseAddVariant==='function')window.addVariant=function(id,flavor,image,variantMeta){
   const old=window.LIFT_CHECKOUT_EDIT_KEY;
   if(old&&typeof cart!=='undefined'){delete cart[old];try{delete cartMeta[old]}catch(e){}window.LIFT_CHECKOUT_EDIT_KEY=null}
   const r=baseAddVariant.apply(this,arguments);setTimeout(()=>{try{closeOff()}catch(e){}try{document.getElementById('checkoutModal')?.classList.add('open');document.body.style.overflow='hidden'}catch(e){}rerender()},0);return r;
 };
 // Agregar desde el buscador del checkout sin mandarte al carrito.
 window.liftCheckoutAddCatalogProduct=function(id){
   const ps=(()=>{try{return Array.isArray(window.PRODUCTS)?window.PRODUCTS:PRODUCTS}catch(e){return []}})();const p=ps.find(x=>String(x.id)===String(id));if(!p)return;
   try{
     checkoutMode='cart';checkoutSingleId=null;
     const g=typeof liftGroupByProductId==='function'?liftGroupByProductId(p.id):null;
     if(g&&typeof openLiftProductById==='function'){
       openLiftProductById(p.id);
     }else{
       const flavor=String(p.flavor||p.sabor||'').trim(),key=flavor?`${p.id}::${flavor}`:String(p.id);
       cart[key]=(Number(cart[key])||0)+1;
       if(flavor){cartMeta[key]={...(cartMeta[key]||{}),flavor,image:p.image||p.imagen||''};window.LIFT_CART_META=cartMeta}
       saveCart();renderCart();renderCheckoutSummary();
     }
     const inp=document.getElementById('liftCheckoutCatalogInput');if(inp){inp.value='';inp.focus()}
     document.getElementById('liftCheckoutCatalogResults')?.classList.remove('show');
   }catch(e){console.error(e);alert('No pude agregar el producto al checkout: '+(e.message||e))}
 };
 setTimeout(()=>{try{decorate()}catch(e){}},500);
})();

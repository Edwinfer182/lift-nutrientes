/* SUPGO public header controller for product pages; index keeps its native controller. */
(function(){
 'use strict';
 const host=document.getElementById('supgo-global-header');
 if(!host)return;
 const ROOT='https://supgo.co/';
 const q=host.querySelector('#q');
 const menu=document.createElement('div');
 menu.className='supgo-menu';menu.hidden=true;
 menu.innerHTML='<div class="supgo-tabs"><button type="button" class="active" data-tab="brands">Laboratorios</button><button type="button" data-tab="categories">Categorías</button></div><div class="supgo-links"></div>';
 host.appendChild(menu);
 const links=menu.querySelector('.supgo-links');
 let brands=[],categories=[],products=[];
 function go(param,value){
   const url=new URL(ROOT);
   if(param)url.searchParams.set(param,value);
   location.assign(url.toString());
 }
 function draw(which){
   const values=which==='brands'?brands:categories;
   const param=which==='brands'?'marca':'categoria';
   links.replaceChildren();
   values.forEach(function(value){
     const a=document.createElement('a');
     const u=new URL(ROOT);u.searchParams.set(param,value);
     a.href=u.toString();a.textContent=value;links.appendChild(a);
   });
 }
 host.querySelectorAll('.filterMobile').forEach(function(b){
   b.onclick=function(){menu.hidden=!menu.hidden;if(!menu.hidden)draw('brands');};
 });
 menu.querySelectorAll('[data-tab]').forEach(function(button){
   button.addEventListener('click',function(){
     menu.querySelectorAll('[data-tab]').forEach(b=>b.classList.toggle('active',b===button));
     draw(button.dataset.tab);
   });
 });
 const offers=host.querySelector('#offersButton');
 if(offers)offers.onclick=()=>go('ofertas','1');
 const brand=host.querySelector('.brand');
 if(brand&&brand.tagName!=='A')brand.addEventListener('click',()=>go());
 const cart=host.querySelector('.cartDesktop');
 if(cart)cart.onclick=()=>go('carrito','1');
 const myOrder=document.createElement('button');
 myOrder.type='button';myOrder.className='myOrder';myOrder.textContent='📦 Mi pedido';
 if(cart)cart.before(myOrder);else host.querySelector('.bar').appendChild(myOrder);
 myOrder.onclick=()=>go('mi-pedido','1');
 const result=host.querySelector('#searchResults');
 if(result)result.hidden=true;
 if(q){
   q.setAttribute('enterkeyhint','search');
   q.addEventListener('keydown',function(e){
     if(e.key==='Enter'){e.preventDefault();const term=q.value.trim();if(term)go('buscar',term);}
   });
   q.addEventListener('input',function(){
     if(!result)return;
     const term=q.value.trim().toLocaleLowerCase();
     result.replaceChildren();
     if(term.length<2){result.hidden=true;return;}
     products.filter(p=>p.name.toLocaleLowerCase().includes(term)).slice(0,6).forEach(function(p){
       const a=document.createElement('a');a.textContent=p.name;
       const url=new URL(ROOT);url.searchParams.set('producto',String(p.id));
       a.href=url.toString();result.appendChild(a);
     });
     result.hidden=!result.childElementCount;
   });
 }
 document.addEventListener('click',function(e){if(!host.contains(e.target))menu.hidden=true;});
 // Reads the same public Supabase rows as the catalog, no private credentials.
 const url='https://vdxkknftyssjyfbdieqa.supabase.co/rest/v1/lift_productos?select=id,product,activo&activo=eq.true&limit=1000';
 fetch(url,{headers:{apikey:'sb_publishable_ECuhXuKIb85kj9fgdEjrAw_O7uNpZsh'}})
 .then(r=>{if(!r.ok)throw Error('Supabase '+r.status);return r.json();})
 .then(rows=>{
   const unique=values=>[...new Set(values.filter(Boolean))].sort((a,b)=>a.localeCompare(b,'es'));
   const publicRows=rows.filter(x=>x.product&&!x.product.__private&&!x.product.hidden&&!x.product.adminOnly);
   brands=unique(publicRows.map(x=>String(x.product.brand||x.product.marca||'').trim()));
   categories=unique(publicRows.map(x=>String(x.product.category||x.product.categoria||'').trim()));
   products=publicRows.map(x=>({id:x.id,name:String(x.product.name||x.product.nombre||'')})).filter(x=>x.name);
   if(!menu.hidden)draw('brands');
 }).catch(error=>console.warn('SUPGO header menu unavailable',error));
})();

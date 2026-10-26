(function(){
"use strict";
const root=document.querySelector("[data-product-root]");if(!root)return;
const money=n=>new Intl.NumberFormat("es-CO",{style:"currency",currency:"COP",maximumFractionDigits:0}).format(n);
const parseMoney=v=>Number(String(v||"").replace(/[^0-9]/g,""))||0;
const current=()=>({id:root.dataset.id||"",name:document.querySelector(".productTitle")?.textContent?.trim()||document.title.split("|")[0].trim(),price:parseMoney(document.querySelector(".productPrice")?.textContent),image:document.querySelector("#mainImg")?.src||root.dataset.image||"",flavor:root.dataset.flavor||document.querySelector("#selectedFlavor")?.textContent||""});
const storageKey="lift_cart";
const getCart=()=>{try{let v=JSON.parse(localStorage.getItem(storageKey)||"[]");return Array.isArray(v)?v:[]}catch{return []}};
const saveCart=items=>{localStorage.setItem(storageKey,JSON.stringify(items));renderCart()};
function renderCart(){const cart=getCart(),count=cart.reduce((n,i)=>n+(Number(i.quantity)||0),0),total=cart.reduce((n,i)=>n+(Number(i.price)||0)*(Number(i.quantity)||0),0);document.querySelectorAll("[data-cart-count]").forEach(el=>el.textContent=String(count));const body=document.getElementById("cartBody");if(body)body.innerHTML=cart.length?cart.map((i,idx)=>'<div style="display:flex;gap:10px;padding:10px 0;border-bottom:1px solid #eee"><img style="width:55px;height:65px;object-fit:contain" src="'+escapeHtml(i.image)+'" alt=""><div style="flex:1"><strong>'+escapeHtml(i.name)+'</strong><div>'+escapeHtml(i.flavor||"")+'</div><span>'+money(i.price)+' × '+i.quantity+'</span><div><button type="button" data-cart-remove="'+idx+'">Quitar</button></div></div></div>').join(""):"Tu carrito está vacío";const subtotal=document.getElementById("cartSubtotal");if(subtotal)subtotal.textContent=money(total)}
function escapeHtml(s){return String(s||"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]))}
function add(){let item=current(),items=getCart(),same=items.find(i=>String(i.id)===String(item.id)&&i.flavor===item.flavor);if(same)same.quantity++;else items.push({...item,quantity:1});saveCart(items);toast("Producto agregado al carrito")}
function toast(message){let e=document.getElementById("toast");if(!e)return;e.textContent=message;e.style.cssText="position:fixed;bottom:90px;left:50%;transform:translateX(-50%);background:#111;color:#fff;padding:10px 16px;border-radius:20px;z-index:110";setTimeout(()=>{e.textContent="";e.removeAttribute("style")},2200)}
window.addCurrentProduct=add;
window.openPageCart=function(){renderCart();document.getElementById("overlay")?.classList.add("open");document.getElementById("cartPanel")?.classList.add("open")};
window.closePageCart=function(){document.getElementById("overlay")?.classList.remove("open");document.getElementById("cartPanel")?.classList.remove("open")};
window.buyCurrentProduct=function(){add();window.openPageCart()};
window.buyPageCart=function(){const cart=getCart();if(!cart.length){toast("Agrega un producto primero");return}const summary=cart.map(i=>i.quantity+" × "+i.name+(i.flavor?" - "+i.flavor:"")+" ("+money(i.price*i.quantity)+")").join("\n");const total=cart.reduce((n,i)=>n+i.price*i.quantity,0);const message="Hola, quiero hacer este pedido:\n"+summary+"\nTotal: "+money(total);window.open("https://wa.me/?text="+encodeURIComponent(message),"_blank","noopener")};
window.selectFlavor=function(btn){document.querySelectorAll("[data-flavor-btn]").forEach(b=>b.classList.toggle("active",b===btn));root.dataset.flavor=btn.dataset.name||btn.textContent.trim();const selected=document.getElementById("selectedFlavor");if(selected)selected.textContent=root.dataset.flavor};
window.toggleZoom=function(){const img=document.getElementById("mainImg");if(!img)return;img.classList.toggle("zoomed");img.style.transform=img.classList.contains("zoomed")?"scale(1.6)":"";img.style.cursor=img.classList.contains("zoomed")?"zoom-out":"zoom-in"};
document.addEventListener("click",e=>{const b=e.target.closest("[data-cart-remove]");if(!b)return;const cart=getCart();cart.splice(Number(b.dataset.cartRemove),1);saveCart(cart)});
const search=document.getElementById("q");if(search){search.addEventListener("keydown",e=>{if(e.key==="Enter"&&search.value.trim())location.href="/?q="+encodeURIComponent(search.value.trim())})}
renderCart();
})();
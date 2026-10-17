
(()=>{
 const $=id=>document.getElementById(id);
 const API='https://vdxkknftyssjyfbdieqa.supabase.co/functions/v1/lift-catalog-admin';
 const KEY='sb_publishable_ECuhXuKIb85kj9fgdEjrAw_O7uNpZsh';
 const PASS='liftAdminCloudPasswordV1';
 const money=n=>new Intl.NumberFormat('es-CO',{style:'currency',currency:'COP',maximumFractionDigits:0}).format(Number(n)||0);
 const escapeHTML=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const date=s=>{const d=new Date(s);return Number.isNaN(d.getTime())?'Sin fecha':d.toLocaleString('es-CO',{dateStyle:'medium',timeStyle:'short'});};
 const age=s=>{const mins=Math.max(0,Math.floor((Date.now()-new Date(s).getTime())/60000));return mins<60?`${mins} min`:mins<1440?`${Math.floor(mins/60)} h ${mins%60} min`:`${Math.floor(mins/1440)} días`;};
 const safeProducts=v=>Array.isArray(v)?v:[];
 window.liftCloseAbandonedCarts=()=>{$('liftAbandonModal')?.classList.remove('open');$('liftAbandonModal')?.setAttribute('aria-hidden','true')};
 async function load(){
   const el=$('liftAbandonData');if(!el)return;
   el.textContent='Consultando carritos abandonados…';
   const password=sessionStorage.getItem(PASS)||'';
   if(!password){el.textContent='Inicia sesión nuevamente como administrador para consultar los carritos.';return;}
   try{
     const r=await fetch(API,{method:'POST',headers:{apikey:KEY,'Content-Type':'application/json'},body:JSON.stringify({action:'abandoned-carts',password}),cache:'no-store'});
     const data=await r.json().catch(()=>({}));
     if(!r.ok||!data.ok)throw new Error(data.error||`Error HTTP ${r.status}`);
     const carts=Array.isArray(data.carts)?data.carts:[];
     const total=carts.reduce((sum,c)=>sum+(Number(c.total)||0),0);
     el.replaceChildren();
     const stats=document.createElement('div');stats.className='liftAbandonStats';
     const a=document.createElement('div');a.innerHTML='<small>Carritos abandonados</small><strong>'+carts.length+'</strong>';
     const b=document.createElement('div');b.innerHTML='<small>Valor potencial</small><strong>'+money(total)+'</strong>';
     stats.append(a,b);el.append(stats);
     const note=document.createElement('p');note.className='liftAbandonNote';note.textContent='Carritos con productos, sin actividad durante más de 30 minutos y sin pedido convertido. No son ventas confirmadas.';el.append(note);
     if(!carts.length){const empty=document.createElement('p');empty.textContent='Todavía no hay carritos abandonados registrados.';el.append(empty);return;}
     for(const cart of carts){
       const section=document.createElement('section');section.className='liftAbandonEntry';
       const head=document.createElement('div');head.className='liftAbandonEntryHead';
       const title=document.createElement('strong');title.textContent=money(cart.total);
       const meta=document.createElement('span');meta.textContent=`${Number(cart.cantidad)||0} unidades · Hace ${age(cart.actualizado_en)}`;
       head.append(title,meta);section.append(head);
       const customer=document.createElement('div');
       customer.style.cssText='font-size:12px;line-height:1.6;margin-top:8px;color:#444';
       if(cart.contacto_autorizado && cart.cliente_celular){
         const n=document.createElement('strong');n.textContent='Cliente: '+(cart.cliente_nombre||'Sin nombre');
         const phone=document.createElement('div');phone.textContent='Celular proporcionado: '+cart.cliente_celular;
         const status=document.createElement('small');status.textContent='Autorizó contacto para recuperar esta compra. Número no verificado.';
         customer.append(n,phone,status);
       }else{customer.textContent='Cliente anónimo · Sin autorización de contacto para recuperar el carrito';}
       section.append(customer);
       const ul=document.createElement('ul');ul.className='liftAbandonItems';
       for(const product of safeProducts(cart.productos)){
         const li=document.createElement('li');
         const name=document.createElement('span');name.textContent=`${product.nombre||'Producto'}${product.sabor?' · '+product.sabor:''}`;
         const value=document.createElement('b');value.textContent=`${Number(product.cantidad)||0} × ${money(product.precio)}`;
         li.append(name,value);ul.append(li);
       }
       section.append(ul);
       const foot=document.createElement('small');foot.textContent='Última actividad: '+date(cart.actualizado_en);section.append(foot);el.append(section);
     }
   }catch(e){el.replaceChildren();const msg=document.createElement('p');msg.textContent='No se pudieron cargar los carritos: '+(e?.message||String(e));el.append(msg);}
 }
 window.liftOpenAbandonedCarts=()=>{if(!document.body.classList.contains('liftAdminUnlocked'))return;$('liftAbandonModal')?.classList.add('open');$('liftAbandonModal')?.setAttribute('aria-hidden','false');load();};
 function inject(){const row=document.querySelector('#checkoutModal .liftAdminToolsRow')||document.querySelector('.liftAdminToolsRow');if(!row||$('liftAbandonOpenBtn'))return;const b=document.createElement('button');b.type='button';b.id='liftAbandonOpenBtn';b.textContent='🛒 Carritos abandonados';b.onclick=window.liftOpenAbandonedCarts;row.appendChild(b)}
 document.addEventListener('DOMContentLoaded',()=>{inject();new MutationObserver(inject).observe(document.body,{childList:true,subtree:true})});
})();

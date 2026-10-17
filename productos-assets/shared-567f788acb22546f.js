
(()=>{
 const URL='https://vdxkknftyssjyfbdieqa.supabase.co/rest/v1/rpc/lift_registrar_carrito_identificado';
 const KEY='sb_publishable_ECuhXuKIb85kj9fgdEjrAw_O7uNpZsh';
 const SESSION_KEY='liftCartTrackingSessionV2';
 let session;try{session=localStorage.getItem(SESSION_KEY);if(!session||!/^[0-9a-f-]{36}$/i.test(session)){session=crypto.randomUUID();localStorage.setItem(SESSION_KEY,session)}}catch(e){session=crypto.randomUUID()}
 let last='', timer, converted=false;
 function products(){try{if(typeof items!=='function')return [];return items().slice(0,40).map(({p,q})=>({nombre:String(p.name||'Producto').slice(0,120),marca:String(p.brand||'').slice(0,70),sabor:String(p._cartFlavor||'').slice(0,70),cantidad:Math.max(0,Math.min(1000,Number(q)||0)),precio:Math.max(0,Number(priceOf(p))||0)}))}catch(e){return []}}
 async function record(state){const rows=products();if(!rows.length&&state==='activo')return;const total=rows.reduce((n,p)=>n+p.cantidad*p.precio,0),count=rows.reduce((n,p)=>n+p.cantidad,0);
  const consent=Boolean(document.getElementById('coCartRecoveryConsent')?.checked);
  const name=consent?String(document.getElementById('coName')?.value||'').trim().slice(0,100):'';
  const phone=consent?String(document.getElementById('coPhone')?.value||'').trim().slice(0,20):'';
  const data={p_sesion:session,p_productos:rows,p_total:total,p_cantidad:count,p_estado:state,p_nombre:name,p_celular:phone,p_autorizado:consent};
  const res=await fetch(URL,{method:'POST',headers:{'Content-Type':'application/json','apikey':KEY},body:JSON.stringify(data),keepalive:true});if(!res.ok)throw new Error('No se registró el carrito');
 }
 function check(){if(converted)return;const rows=products(),current=JSON.stringify({rows,consent:!!document.getElementById('coCartRecoveryConsent')?.checked,name:document.getElementById('coCartRecoveryConsent')?.checked?document.getElementById('coName')?.value:'',phone:document.getElementById('coCartRecoveryConsent')?.checked?document.getElementById('coPhone')?.value:''});if(current!==last){last=current;clearTimeout(timer);timer=setTimeout(()=>record('activo').catch(()=>{}),850);}}
 document.addEventListener('DOMContentLoaded',()=>{check();setInterval(check,2000)});
 window.liftTrackOrderCreated=async()=>{if(converted)return;await record('convertido');converted=true;try{localStorage.removeItem(SESSION_KEY)}catch(e){};
  if(typeof gtag==='function')gtag('event','purchase',{transaction_id:'pedido-'+session,currency:'COP',value:products().reduce((n,p)=>n+p.cantidad*p.precio,0),items:products().map((p,i)=>({item_id:String(i),item_name:p.nombre,quantity:p.cantidad,price:p.precio}))});
 };
 window.liftTrackCartCheckout=()=>{if(typeof gtag==='function')gtag('event','begin_checkout',{currency:'COP',value:products().reduce((n,p)=>n+p.cantidad*p.precio,0)});};
})();

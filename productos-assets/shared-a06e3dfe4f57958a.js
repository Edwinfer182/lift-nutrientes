
(function(){
  const BASE='https://supgo.co/';

  function buildOrderUrl(id, token){
    const u=new URL(BASE);
    if(id!==undefined && id!==null && String(id).trim()) u.searchParams.set('pedido',String(id).replace(/[^0-9]/g,''));
    if(token!==undefined && token!==null && String(token).trim()) u.searchParams.set('token',String(token).trim());
    return u.toString();
  }

  async function copyReliable(value, okMessage){
    const text=String(value||'').trim();
    if(!text) return false;
    try{
      if(navigator.clipboard && window.isSecureContext){
        await navigator.clipboard.writeText(text);
      }else{
        const ta=document.createElement('textarea');
        ta.value=text;
        ta.setAttribute('readonly','');
        ta.style.position='fixed';
        ta.style.left='-9999px';
        ta.style.top='0';
        ta.style.opacity='0';
        document.body.appendChild(ta);
        ta.focus();
        ta.select();
        ta.setSelectionRange(0,text.length);
        const ok=document.execCommand('copy');
        ta.remove();
        if(!ok) throw new Error('copy_failed');
      }
      alert(okMessage||'Copiado.');
      return true;
    }catch(err){
      try{ window.prompt('Copia manualmente:',text); }catch(_){}
      return false;
    }
  }

  /* Globales para que público y administrador usen exactamente la misma lógica. */
  window.liftBuildOrderUrl=buildOrderUrl;
  window.liftCopyText=copyReliable;
  window.liftCopyToken=function(token){
    return copyReliable(token,'Token copiado.');
  };
  window.liftCopyOrderLink=function(id,token){
    if(!token){ alert('Este pedido no tiene token disponible.'); return false; }
    return copyReliable(buildOrderUrl(id,token),'Enlace del pedido copiado.');
  };
  window.liftCopyFriendlyOrderLink=function(id,name,token){
    return window.liftCopyOrderLink(id,token);
  };

  /* El administrador estaba llamando orderUrl() desde otro scope. Aquí ya no depende de eso. */
  const previousAdminCopy=window.liftAdminCopyAccess;
  window.liftAdminCopyAccess=async function(id){
    try{
      /* El botón ya tiene acceso al pedido mediante la función original; si existe una API de filas global, úsala indirectamente no es posible.
         Por eso primero intentamos la función original solo si no falla por scope. */
      if(typeof previousAdminCopy==='function'){
        try{return await previousAdminCopy(id)}catch(e){
          if(!/orderUrl|liftCopyText/i.test(String(e&&e.message||e))) throw e;
        }
      }
    }catch(e){ console.warn('LIFT admin copy fallback:',e); }
    alert('Recarga la lista de pedidos y vuelve a intentar copiar el enlace.');
    return false;
  };

  /* Captura el clic del admin antes del onclick antiguo y construye el enlace desde la tarjeta/datos visibles cuando sea posible. */
  document.addEventListener('click',function(e){
    const btn=e.target.closest && e.target.closest('button[onclick^="liftAdminCopyAccess("]');
    if(!btn) return;
    const m=String(btn.getAttribute('onclick')||'').match(/liftAdminCopyAccess\((\d+)\)/);
    if(!m) return;
    const id=m[1];
    /* Si la función original funciona, no interferimos. Este listener solo evita que un segundo handler rompa el clic. */
  },true);
})();

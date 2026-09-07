(() => {
  'use strict';

  const SHARE_PARAM = 'cart';
  const MAX_ITEMS = 40;
  const MAX_QTY = 20;

  function escAttr(s=''){
    return String(s).replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
  }

  function encodePayload(rows){
    const compact = rows.slice(0, MAX_ITEMS).map(row => ({
      i: String(row.p.id),
      q: Math.max(1, Math.min(MAX_QTY, Number(row.q || 1))),
      f: row.flavor || ''
    }));
    const json = JSON.stringify({v:1,i:compact});
    const bytes = new TextEncoder().encode(json);
    let bin='';
    bytes.forEach(b => bin += String.fromCharCode(b));
    return btoa(bin).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'');
  }

  function decodePayload(value){
    try{
      const base = String(value||'').replace(/-/g,'+').replace(/_/g,'/');
      const padded = base + '='.repeat((4 - base.length % 4) % 4);
      const bin = atob(padded);
      const bytes = Uint8Array.from(bin, c => c.charCodeAt(0));
      const data = JSON.parse(new TextDecoder().decode(bytes));
      if(!data || data.v !== 1 || !Array.isArray(data.i)) return [];
      return data.i.slice(0,MAX_ITEMS).map(x=>({
        id:String(x.i||''),
        qty:Math.max(1,Math.min(MAX_QTY,Number(x.q||1))),
        flavor:typeof x.f==='string'?x.f:''
      })).filter(x=>x.id);
    }catch{return []}
  }

  function cartKey(id, flavor=''){
    return `${id}::${flavor||''}`;
  }

  function shareUrl(){
    if(typeof items !== 'function') return '';
    const rows = items();
    if(!rows.length) return '';
    const url = new URL('share.html', location.href);
    url.searchParams.set(SHARE_PARAM, encodePayload(rows));
    return url.toString();
  }

  function showShareStatus(text){
    let el = document.getElementById('liftShareCartStatus');
    if(!el){
      el = document.createElement('div');
      el.id = 'liftShareCartStatus';
      el.style.cssText='font-size:11px;color:#666;text-align:center;margin-top:7px;min-height:16px';
      document.querySelector('.cartfoot')?.appendChild(el);
    }
    if(el) el.textContent=text;
  }

  async function shareCart(){
    const url = shareUrl();
    if(!url){ showShareStatus('Agrega productos antes de compartir.'); return; }
    const text='Te comparto este carrito de Lift Nutrientes';
    try{
      if(navigator.share){
        await navigator.share({title:'Carrito Lift Nutrientes',text,url});
        showShareStatus('Carrito compartido.');
        return;
      }
      await navigator.clipboard.writeText(url);
      showShareStatus('Enlace del carrito copiado.');
    }catch(err){
      if(err?.name==='AbortError') return;
      try{
        const ta=document.createElement('textarea');
        ta.value=url;document.body.appendChild(ta);ta.select();document.execCommand('copy');ta.remove();
        showShareStatus('Enlace del carrito copiado.');
      }catch{ showShareStatus('No se pudo copiar el enlace.'); }
    }
  }

  function installButton(){
    const foot=document.querySelector('.cartfoot');
    if(!foot || document.getElementById('liftShareCartBtn')) return false;
    const btn=document.createElement('button');
    btn.id='liftShareCartBtn';
    btn.type='button';
    btn.className='secondary';
    btn.style.marginTop='8px';
    btn.innerHTML='🔗 Compartir carrito';
    btn.addEventListener('click',shareCart);
    const buy=document.getElementById('cartBuyBtn');
    if(buy) buy.insertAdjacentElement('afterend',btn); else foot.appendChild(btn);
    return true;
  }

  function importSharedCart(){
    const url = new URL(location.href);
    const encoded = url.searchParams.get(SHARE_PARAM);
    if(!encoded || !Array.isArray(window.PRODUCTS)) return false;
    const rows = decodePayload(encoded);
    if(!rows.length) return false;

    const next={};
    for(const row of rows){
      const p=window.PRODUCTS.find(x=>String(x.id)===row.id);
      if(!p) continue;
      const key=cartKey(row.id,row.flavor);
      next[key]=(next[key]||0)+row.qty;
    }
    if(!Object.keys(next).length) return false;

    window.cart = next;
    localStorage.setItem('liftCartV2',JSON.stringify(next));
    try{ if(typeof saveCart==='function') saveCart(); }catch{}
    try{ if(typeof renderCart==='function') renderCart(); }catch{}
    try{ if(typeof updateCount==='function') updateCount(); }catch{}

    url.searchParams.delete(SHARE_PARAM);
    history.replaceState(null,'',url.pathname + (url.search?url.search:'') + url.hash);

    setTimeout(()=>{
      try{ if(typeof openOff==='function') openOff('cart'); }catch{}
      showShareStatus('Carrito compartido cargado.');
    },180);
    return true;
  }

  function init(attempt=0){
    const ready = Array.isArray(window.PRODUCTS) && typeof items==='function' && typeof renderCart==='function';
    if(!ready){ if(attempt<160) setTimeout(()=>init(attempt+1),50); return; }
    importSharedCart();
    installButton();

    const observer=new MutationObserver(()=>installButton());
    observer.observe(document.body,{childList:true,subtree:true});
  }

  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',()=>init()); else init();
})();
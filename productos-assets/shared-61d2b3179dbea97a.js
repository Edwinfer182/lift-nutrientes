
(()=>{
  const cats=[['Todos','Todos'],['Proteína','Proteína'],['Creatina','Creatina'],['Pre entreno','Pre entreno'],['Vitaminas','Vitaminas'],['Bienestar','Bienestar']];
  function installDiscovery(){
    if(document.getElementById('liftDiscovery')) return;
    const status=document.getElementById('status'); if(!status) return;
    const bar=document.createElement('div'); bar.id='liftDiscovery'; bar.className='liftDiscovery';
    bar.innerHTML=`<div class="liftDiscoveryInner"><select id="liftSort" class="liftSort" aria-label="Ordenar productos"><option value="recommended">Recomendados</option><option value="nameAsc">Nombre A → Z</option><option value="nameDesc">Nombre Z → A</option><option value="priceAsc">Menor precio</option><option value="priceDesc">Mayor precio</option><option value="offers">Ofertas primero</option></select></div>`;
    status.parentNode.insertBefore(bar,status);
    bar.querySelector('#liftSort').onchange=e=>{state.sort=e.target.value;render();syncDiscovery()};
    syncDiscovery();
  }
  function syncDiscovery(){
    const bar=document.getElementById('liftDiscovery'); if(!bar)return;
    const sel=bar.querySelector('#liftSort'); if(sel)sel.value=state.sort||'recommended';
  }
  window.liftToast=function(msg){
    let t=document.getElementById('liftToast'); if(!t){t=document.createElement('div');t.id='liftToast';t.className='liftToast';document.body.appendChild(t)}
    t.textContent=msg;t.classList.remove('show');void t.offsetWidth;t.classList.add('show');clearTimeout(window.__liftToastTimer);window.__liftToastTimer=setTimeout(()=>t.classList.remove('show'),2600);
  };
  function wrapActions(){
    if(window.__liftUxWrapped)return; window.__liftUxWrapped=true;
    const oldAdd=window.add; if(typeof oldAdd==='function') window.add=function(...a){const r=oldAdd.apply(this,a);liftToast('✓ Producto agregado al carrito');return r};
    const oldVar=window.addVariant; if(typeof oldVar==='function') window.addVariant=function(id,flavor,image,...rest){const r=oldVar.call(this,id,flavor,image,...rest);liftToast(`✓ ${flavor} agregado al carrito`);return r};
  }
  const oldRender=window.render; if(typeof oldRender==='function') window.render=function(...a){const r=oldRender.apply(this,a);requestAnimationFrame(syncDiscovery);return r};
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>{installDiscovery();wrapActions()},{once:true});else{installDiscovery();wrapActions()}
})();

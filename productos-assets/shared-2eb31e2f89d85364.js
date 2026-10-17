
(function(){
  const KEY='liftRememberCustomerDataV1';
  const $=id=>document.getElementById(id);
  function read(){try{return JSON.parse(localStorage.getItem(KEY)||'null')}catch(e){return null}}
  function clean(v){return String(v||'').trim()}
  function showState(data){
    const hello=$('liftRememberHello'), forget=$('liftForgetData'), check=$('liftRememberData');
    if(!hello||!forget||!check)return;
    if(data&&data.nombre){
      hello.style.display='block';
      hello.innerHTML='<b style="font-weight:600">👋 Hola, '+data.nombre.replace(/[&<>\"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',"'":'&#39;'}[c]))+'</b><br><span style="color:#777">Usamos los datos de tu última compra. Puedes cambiarlos antes de pedir.</span>';
      forget.style.display='inline-block'; check.checked=true;
    }else{hello.style.display='none';hello.textContent='';forget.style.display='none';check.checked=false}
  }
  function fill(data){
    if(!data)return;
    if($('coName'))$('coName').value=data.nombre||'';
    if($('coPhone'))$('coPhone').value=data.celular||'';
    if($('coAddress'))$('coAddress').value=data.direccion||'';
    if($('coEmail'))$('coEmail').value=data.email||'';
    if($('coEmailNotify'))$('coEmailNotify').checked=!!data.email_notificaciones;
    if($('coCity')&&data.ciudad){$('coCity').value=data.ciudad+(data.departamento?' · '+data.departamento:''); try{selectedCity={name:data.ciudad,department:data.departamento||''}}catch(e){}}
    if(typeof renderCheckoutSummary==='function')try{renderCheckoutSummary()}catch(e){}
  }
  window.liftSaveRememberedCustomer=function(d){
    const check=$('liftRememberData'); if(!check?.checked)return;
    const data={nombre:clean(d?.nombre||$('coName')?.value),celular:clean(d?.celular||$('coPhone')?.value),direccion:clean(d?.direccion||$('coAddress')?.value),email:clean(d?.email||$('coEmail')?.value),email_notificaciones:Boolean(d?.email_notificaciones??$('coEmailNotify')?.checked),ciudad:clean(d?.ciudad||(typeof selectedCity!=='undefined'&&selectedCity?.name)),departamento:clean(d?.departamento||(typeof selectedCity!=='undefined'&&selectedCity?.department))};
    if(!data.nombre||!data.celular||!data.direccion||!data.ciudad)return;
    try{localStorage.setItem(KEY,JSON.stringify(data));showState(data)}catch(e){}
  };
  function init(){
    const data=read(); if(data){fill(data);showState(data)}else showState(null);
    $('liftForgetData')?.addEventListener('click',function(){try{localStorage.removeItem(KEY)}catch(e){} showState(null)});
    $('liftRememberData')?.addEventListener('change',function(){if(!this.checked){try{localStorage.removeItem(KEY)}catch(e){} showState(null)}});
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
  // Guardar solo después de que el pedido público se haya creado correctamente.
  const install=()=>{const old=window.finishCheckout;if(typeof old==='function'&&!old.__liftRememberWrapped){const f=async function(){let before=null;try{before={nombre:$('coName')?.value.trim()||'',celular:$('coPhone')?.value.trim()||'',direccion:$('coAddress')?.value.trim()||'',email:$('coEmail')?.value.trim()||'',email_notificaciones:!!$('coEmailNotify')?.checked,ciudad:(typeof selectedCity!=='undefined'&&selectedCity?.name)||'',departamento:(typeof selectedCity!=='undefined'&&selectedCity?.department)||''}}catch(e){};const out=await old.apply(this,arguments);if(before&&$('liftRememberData')?.checked){setTimeout(()=>window.liftSaveRememberedCustomer(before),0)}return out};f.__liftRememberWrapped=true;window.finishCheckout=f}};
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(install,0));else setTimeout(install,0);
})();

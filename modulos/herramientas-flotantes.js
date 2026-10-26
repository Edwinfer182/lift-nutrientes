/* Lift admin: un solo acceso flotante global; reutiliza botones y eventos originales. */
(() => {
  if (window.__liftAdminToolsDockV2) return;
  window.__liftAdminToolsDockV2 = true;
  const style=document.createElement('style');
  style.textContent=`
    #lift-tools-dock{position:fixed!important;right:12px!important;bottom:calc(18px + env(safe-area-inset-bottom,0px))!important;left:auto!important;top:auto!important;z-index:2147483000;font-family:Poppins,Arial,sans-serif}
    #lift-tools-toggle{display:flex!important;align-items:center;justify-content:center;gap:7px;min-height:46px;border:0;border-radius:24px;padding:0 17px;background:#111;color:white;font:600 13px Poppins,Arial,sans-serif;box-shadow:0 4px 16px #0004}
    #lift-tools-panel{display:none;position:absolute!important;right:0!important;left:auto!important;bottom:calc(100% + 9px)!important;top:auto!important;transform:none!important;width:min(340px,calc(100vw - 24px))!important;max-height:min(68dvh,540px)!important;overflow-y:auto!important;overflow-x:hidden!important;overscroll-behavior:contain;background:#fff;border:1px solid #ddd;border-radius:17px;padding:10px;box-sizing:border-box;box-shadow:0 8px 30px #0004}
    #lift-tools-dock[data-open="true"] #lift-tools-panel{display:flex!important;flex-direction:column;gap:8px}
    #lift-tools-panel .liftAdminToolsRow,#lift-tools-panel .lift-admin-floating-group{position:static!important;inset:auto!important;transform:none!important;display:flex!important;flex-direction:column!important;gap:8px!important;width:100%!important;max-width:100%!important;height:auto!important;max-height:none!important;overflow:visible!important;box-shadow:none!important;padding:0!important;margin:0!important;background:transparent!important;border:0!important}
    #lift-tools-panel button:not(#lift-tools-toggle),#lift-tools-panel a{position:static!important;inset:auto!important;transform:none!important;float:none!important;display:flex!important;align-items:center!important;justify-content:center!important;width:100%!important;max-width:100%!important;min-height:42px!important;height:auto!important;margin:0!important;white-space:normal!important;visibility:visible!important;opacity:1!important;pointer-events:auto!important;box-sizing:border-box!important}
    #lift-tools-panel .lift-legacy-tools-toggle{display:none!important}
    body.lift-checkout-tools-hidden #lift-tools-dock{display:none!important}
  `;
  document.head.appendChild(style);
  const dock=document.createElement('div');
  dock.id='lift-tools-dock';dock.dataset.open='false';
  dock.innerHTML='<div id="lift-tools-panel"></div><button id="lift-tools-toggle" type="button" aria-expanded="false" aria-controls="lift-tools-panel">⚙ Herramientas</button>';
  const panel=dock.querySelector('#lift-tools-panel'),toggle=dock.querySelector('#lift-tools-toggle');
  function open(v){dock.dataset.open=String(v);toggle.setAttribute('aria-expanded',String(v));}
  toggle.addEventListener('click',()=>open(dock.dataset.open!=='true'));
  document.addEventListener('pointerdown',e=>{if(!dock.contains(e.target))open(false)},true);
  document.addEventListener('keydown',e=>{if(e.key==='Escape')open(false)});
  const key=/^(instagram(?: seo)?|wp herramientas|herramientas wp|herramientas seo|seo|envío|envio|atención|atencion|pedidos|cartera|cartera proveedores|crm[^]*|pagos|calculadora|carritos abandonados|pdf|instagram seo|herramientas)$/i;
  let queued=false;
  function update(){
    queued=false;
    if(!document.body||!document.body.classList.contains('liftAdminUnlocked')){dock.remove();return}
    if(!dock.isConnected)document.body.appendChild(dock);
    // Conservar los botones originales y sus controladores. Nunca clonar.
    for(const row of [...document.querySelectorAll('.liftAdminToolsRow')]){
      if(!panel.contains(row))panel.appendChild(row);
    }
    const candidates=[...document.querySelectorAll('button,a')];
    for(const el of candidates){
      if(dock.contains(el)||el.closest('#checkoutModal')||el.closest('[role="dialog"]'))continue;
      const label=(el.textContent||'').trim().replace(/\\s+/g,' ');
      if(!key.test(label))continue;
      const css=getComputedStyle(el);
      let fixed=css.position==='fixed';
      let anc=el.parentElement,steps=0;
      while(anc&&steps++<5&&!fixed){
        if(anc.id==='checkoutModal')break;
        const cs=getComputedStyle(anc);
        if(cs.position==='fixed') fixed=true;
        anc=anc.parentElement;
      }
      if(!fixed && el.id!=='lift-ig-seo-launcher')continue;
      if(/^herramientas$/i.test(label)){el.classList.add('lift-legacy-tools-toggle');continue}
      panel.appendChild(el);
    }
    dock.hidden=panel.querySelectorAll('button:not(.lift-legacy-tools-toggle),a').length===0;
  }
  function schedule(){if(!queued){queued=true;requestAnimationFrame(update)}}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',schedule);
  else schedule();
  new MutationObserver(schedule).observe(document.documentElement,{childList:true,subtree:true,attributes:true,attributeFilter:['class']});
})();

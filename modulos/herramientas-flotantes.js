/* LIFT GLOBAL ADMIN TOOLS: un unico menu, sin botones flotantes superpuestos. */
(() => {
  if (window.__liftAdminToolsDockV1) return;
  window.__liftAdminToolsDockV1 = true;
  const names = /^(instagram seo|wp herramientas|seo|herramientas wp|herramientas seo)$/i;
  const css = document.createElement('style');
  css.textContent = `
    #lift-tools-dock{position:fixed;right:12px;bottom:calc(16px + env(safe-area-inset-bottom,0px));z-index:8990;font-family:Poppins,Arial,sans-serif}
    #lift-tools-toggle{display:flex;align-items:center;justify-content:center;min-height:44px;padding:0 14px;border:0;border-radius:24px;background:#111;color:#fff;font:600 13px Poppins,Arial,sans-serif;box-shadow:0 4px 18px #0003;cursor:pointer}
    #lift-tools-panel{display:none;position:absolute;right:0;bottom:calc(100% + 8px);width:min(300px,calc(100vw - 24px));max-height:min(65dvh,480px);overflow:auto;overscroll-behavior:contain;background:white;color:#111;border:1px solid #e5e5e5;border-radius:16px;padding:10px;box-shadow:0 8px 35px #0003}
    #lift-tools-dock[data-open="true"] #lift-tools-panel{display:flex;flex-direction:column;gap:8px}
    #lift-tools-panel .liftAdminToolsRow{position:static!important;inset:auto!important;transform:none!important;display:flex!important;flex-direction:column!important;gap:8px!important;width:100%!important;height:auto!important;max-height:none!important;overflow:visible!important;visibility:visible!important;pointer-events:auto!important}
    #lift-tools-panel button,#lift-tools-panel a{position:static!important;inset:auto!important;transform:none!important;float:none!important;display:flex!important;align-items:center!important;justify-content:center!important;width:100%!important;min-height:40px!important;height:auto!important;max-width:none!important;margin:0!important;white-space:normal!important;text-align:center!important;visibility:visible!important;pointer-events:auto!important}
    body.lift-checkout-tools-hidden #lift-tools-dock{display:none!important}
  `;
  document.head.appendChild(css);
  const dock = document.createElement('div');
  dock.id='lift-tools-dock';dock.dataset.open='false';
  dock.innerHTML='<div id="lift-tools-panel"></div><button type="button" id="lift-tools-toggle" aria-expanded="false" aria-controls="lift-tools-panel">Herramientas</button>';
  const panel=dock.querySelector('#lift-tools-panel');
  const toggle=dock.querySelector('#lift-tools-toggle');
  toggle.addEventListener('click',()=>{
    dock.dataset.open=dock.dataset.open==='true'?'false':'true';
    toggle.setAttribute('aria-expanded',String(dock.dataset.open==='true'));
  });
  document.addEventListener('pointerdown',e=>{
    if(!dock.contains(e.target)) {dock.dataset.open='false';toggle.setAttribute('aria-expanded','false');}
  });
  let busy=false;
  function organize(){
    busy=false;
    if(!document.body||!document.body.classList.contains('liftAdminUnlocked')){
      dock.remove();return;
    }
    if(!dock.isConnected)document.body.appendChild(dock);
    const row=[...document.querySelectorAll('.liftAdminToolsRow')].find(el=>!panel.contains(el));
    if(row)panel.appendChild(row);
    for(const el of document.querySelectorAll('button,a')){
      if(dock.contains(el)||el===toggle)continue;
      const label=(el.textContent||'').trim().replace(/\s+/g,' ');
      if(!names.test(label))continue;
      if(el.closest('.liftAdminToolsRow'))continue;
      const style=getComputedStyle(el);
      const parent=el.parentElement?getComputedStyle(el.parentElement):null;
      if(style.position==='fixed'||(parent&&parent.position==='fixed')||el.id==='lift-ig-seo-launcher')panel.appendChild(el);
    }
    dock.hidden=panel.querySelectorAll('button,a').length===0;
  }
  function schedule(){if(!busy){busy=true;requestAnimationFrame(organize);}}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',schedule);
  else schedule();
  new MutationObserver(schedule).observe(document.documentElement,{childList:true,subtree:true,attributes:true,attributeFilter:['class']});
})();

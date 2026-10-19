
(function(){
 'use strict';
 const el=id=>document.getElementById(id);
 const cleanUrl=v=>{try{const u=new URL(String(v||''),location.href);return /^https?:$/.test(u.protocol)?u.href:'';}catch{return '';}};
 function image(url,label){const src=cleanUrl(url);if(!src)return;const wrap=document.createElement('div');wrap.style.cssText='width:112px;min-width:90px';const img=document.createElement('img');img.src=src;img.alt=label;img.loading='lazy';img.style.cssText='width:112px;height:112px;max-width:100%;object-fit:contain;border:1px solid #ddd;border-radius:8px;background:white';img.onerror=()=>{wrap.style.display='none'};const cap=document.createElement('small');cap.textContent=label;cap.style.cssText='display:block;color:#666;font-size:10px';wrap.append(img,cap);el('liftAdminImageGallery')?.append(wrap);}
 let ticket=0;
 async function refresh(){
   const t=++ticket,id=el('lafEditId')?.value;
   const gallery=el('liftAdminImageGallery'),input=el('liftAdminPublicUrl'),link=el('liftAdminOpenProductUrl'),note=el('liftAdminProductUrlNote');
   if(!gallery||!input)return;
   gallery.replaceChildren();input.value='';link.style.display='none';
   image(el('lafImage')?.value,'Imagen principal');
   const urls=(el('lafSecondaryImages')?.value||'').split(/\n+/).map(x=>x.trim()).filter(Boolean);
   urls.forEach((u,i)=>image(u,'Imagen secundaria '+(i+1)));
   if(!id){note.textContent='Guarda primero el producto para obtener su enlace individual.';return;}
   const p=(window.PRODUCTS||[]).find(x=>String(x.id)===String(id));
   const path=p&&typeof window.liftStaticProductUrl==='function'?window.liftStaticProductUrl(p):'';
   if(!path){note.textContent='Este producto no tiene una URL individual habilitada por el generador SEO.';return;}
   const url=cleanUrl(path);input.value=url;link.href=url;link.style.display='inline-flex';
   note.textContent='Comprueba que la página abra correctamente antes de enviarla a Google Search Console.';
   try{const r=await fetch(url,{method:'HEAD',cache:'no-store'});if(t!==ticket)return;if(!r.ok){note.textContent='Atención: la URL está calculada, pero la página no respondió correctamente (HTTP '+r.status+'). No la envíes a Google todavía.';link.style.display='none';}else note.textContent='Página individual accesible (HTTP '+r.status+'). Puedes copiarla para Search Console.';}catch{if(t===ticket)note.textContent='No se pudo verificar si la página está publicada. Comprueba el enlace antes de enviarlo a Google.';}
 }
 const oldEdit=window.lafEdit;
 if(typeof oldEdit==='function')window.lafEdit=function(...args){const r=oldEdit.apply(this,args);refresh();return r;};
 const oldClear=window.lafClearForm;
 if(typeof oldClear==='function')window.lafClearForm=function(...args){const r=oldClear.apply(this,args);refresh();return r;};
 const init=()=>{
  el('lafImage')?.addEventListener('input',refresh);
  el('lafSecondaryImages')?.addEventListener('input',refresh);
  el('liftAdminCopyProductUrl')?.addEventListener('click',async()=>{const u=el('liftAdminPublicUrl')?.value;if(!u){alert('Este producto no tiene URL individual disponible.');return;}try{await navigator.clipboard.writeText(u);}catch{const i=el('liftAdminPublicUrl');i.select();document.execCommand('copy');}el('liftAdminProductUrlNote').textContent='URL copiada. Puedes pegarla en Inspección de URLs de Google Search Console.';});
  const secondary=el('lafSecondaryImages');if(secondary&&typeof MutationObserver!=='undefined')new MutationObserver(refresh).observe(secondary,{attributes:true,attributeFilter:['disabled']});
 };
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();

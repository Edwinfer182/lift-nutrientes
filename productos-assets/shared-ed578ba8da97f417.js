
(function(){
 const $=id=>document.getElementById(id);
 const esc=v=>String(v||'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 function current(){
   const id=String($('lafEditId')?.value||'').trim();
   const arr=[...(window.products||[]),...(window.liftProducts||[]),...(window.allProducts||[])];
   return arr.find(p=>String(p?.id)===id)|| (id?{id,name:$('lafName')?.value||'',brand:$('lafBrand')?.value||''}:null);
 }
 function urlFor(p){
   if(!p?.id)return '';
   let rel='';
   try{if(typeof window.liftStaticProductUrl==='function')rel=window.liftStaticProductUrl(p)||'';}catch(e){}
   if(!rel){
     const slug=String(p.name||$('lafName')?.value||'producto').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'');
     rel='/productos/'+slug+'-'+encodeURIComponent(String(p.id))+'.html';
   }
   try{const u=new URL(rel,'https://supgo.co');return u.origin==='https://supgo.co'&&u.pathname.startsWith('/productos/')?u.href:'';}catch(e){return '';}
 }
 function render(){
   if(!$('liftSeoImagePreviews'))return;
   const main=($('lafImage')?.value||'').trim();
   const seo=($('liftSeoImage')?.value||'').trim();
   const extras=($('lafSecondaryImages')?.value||'').split(/[\n\r]+/).map(x=>x.trim()).filter(Boolean);
   const images=[['Imagen principal',main],['Imagen SEO',seo],...extras.slice(0,12).map((x,i)=>['Imagen secundaria '+(i+1),x])];
   $('liftSeoImagePreviews').innerHTML=images.map(([name,src])=>{
     let safe='';try{const u=new URL(src);if(['https:','http:'].includes(u.protocol))safe=u.href;}catch(e){}
     return '<div style="width:120px;max-width:46%;font-size:10px;color:#555"><div style="height:110px;background:white;border:1px solid #ddd;border-radius:8px;display:grid;place-items:center;overflow:hidden">'+(safe?'<img loading="lazy" src="'+esc(safe)+'" alt="'+esc(name)+'" style="max-width:100%;max-height:100%;object-fit:contain" onerror="this.style.display=\'none\';this.parentNode.textContent=\'Imagen no disponible\'">':'Sin imagen')+'</div><b>'+esc(name)+'</b></div>';
   }).join('');
   const p=current(),url=urlFor(p);
   $('liftSeoPublicUrl').value=url;
   $('liftSeoOpenPublicUrl').href=url||'#';
   $('liftSeoGoogleTest').href=url?'https://search.google.com/test/rich-results?url='+encodeURIComponent(url):'https://search.google.com/test/rich-results';
   $('liftSeoUrlStatus').textContent=url?'Comprueba que la página esté publicada antes de enviarla a Google.':'Guarda el producto para obtener una URL con su ID.';
 }
 function init(){
   if(!$('liftSeoImagePreviews'))return;
   ['lafImage','liftSeoImage','lafSecondaryImages','lafEditId','lafName'].forEach(id=>$(id)?.addEventListener('input',render));
   $('liftSeoCopyPublicUrl')?.addEventListener('click',async()=>{const v=$('liftSeoPublicUrl')?.value;if(!v)return;try{await navigator.clipboard.writeText(v);$('liftSeoUrlStatus').textContent='URL copiada.';}catch(e){$('liftSeoPublicUrl').select();document.execCommand('copy');$('liftSeoUrlStatus').textContent='URL seleccionada para copiar.';}});
   const form=$('liftSeoEditor');if(form)new MutationObserver(()=>render()).observe($('lafEditId'),{attributes:true,attributeFilter:['value']});
   let old='';setInterval(()=>{const id=$('lafEditId')?.value||'';if(id!==old){old=id;render();}},700);
   render();
 }
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();


(function(){
 const BASE='https://supgo.co/';
 const isAdmin=()=>new URLSearchParams(location.search).has('fer') || document.body.classList.contains('admin-mode') || !!document.getElementById('adminPanel');
 const share=async(type,name)=>{
   const url=BASE+'?'+type+'='+encodeURIComponent(String(name||'').trim());
   const data={title:'LIFT · '+name,text:'Mira '+name+' en LIFT Nutrientes',url};
   try{
     if(navigator.share){await navigator.share(data);return}
     await navigator.clipboard.writeText(url);alert('Link copiado: '+url)
   }catch(e){
     if(e?.name==='AbortError')return;
     try{await navigator.clipboard.writeText(url);alert('Link copiado: '+url)}catch(_){prompt('Copia este link:',url)}
   }
 };
 window.liftShareBrand=name=>share('marca',name);

 function syncAdminOnly(){
   document.querySelectorAll('.lift-cat-share,.lift-brand-share').forEach(b=>b.style.display=isAdmin()?'inline-flex':'none');
 }
 function addBrandButtons(){
   if(!isAdmin()){syncAdminOnly();return}
   document.querySelectorAll('[onclick*="liftViewBrand"]').forEach(el=>{
     if(el.parentElement?.querySelector(':scope > .lift-brand-share'))return;
     const m=(el.getAttribute('onclick')||'').match(/liftViewBrand\((['"])(.*?)\1\)/);
     if(!m)return;
     const brand=m[2];
     const b=document.createElement('button');
     b.type='button';b.className='lift-brand-share';b.title='Compartir '+brand;
     b.setAttribute('aria-label','Compartir '+brand);b.innerHTML='↗';
     b.onclick=ev=>{ev.preventDefault();ev.stopPropagation();share('marca',brand)};
     el.insertAdjacentElement('afterend',b);
   });
   syncAdminOnly();
 }
 let n=0,t=setInterval(()=>{addBrandButtons();syncAdminOnly();if(++n>35)clearInterval(t)},250);
 document.addEventListener('click',()=>setTimeout(()=>{addBrandButtons();syncAdminOnly()},100),true);
})();


(function(){
 const BASE='https://supgo.co/';
 const clean=v=>String(v||'').trim();

 async function shareCategory(cat){
   const name=clean(cat);
   const url=BASE+'?categoria='+encodeURIComponent(name.toLowerCase());
   const data={title:'LIFT · '+name,text:'Mira '+name+' disponibles en LIFT Nutrientes',url};
   try{
     if(navigator.share){await navigator.share(data);return}
     await navigator.clipboard.writeText(url);
     alert('Link copiado: '+url);
   }catch(e){
     if(e && e.name==='AbortError')return;
     try{await navigator.clipboard.writeText(url);alert('Link copiado: '+url)}catch(_){prompt('Copia este link:',url)}
   }
 }
 window.liftShareCategory=shareCategory;

 function addButtons(){
   document.querySelectorAll('[onclick*="liftViewCategory"]').forEach(el=>{
     if(el.parentElement?.querySelector(':scope > .lift-cat-share'))return;
     const m=(el.getAttribute('onclick')||'').match(/liftViewCategory\((['"])(.*?)\1\)/);
     if(!m)return;
     const cat=m[2];
     const b=document.createElement('button');
     b.type='button';
     b.className='lift-cat-share';
     b.title='Compartir '+cat;
     b.setAttribute('aria-label','Compartir '+cat);
     b.innerHTML='↗';
     b.onclick=function(ev){ev.preventDefault();ev.stopPropagation();shareCategory(cat)};
     el.insertAdjacentElement('afterend',b);
   });
 }
 let n=0,t=setInterval(()=>{addButtons();if(++n>30)clearInterval(t)},250);
 document.addEventListener('click',()=>setTimeout(addButtons,80),true);
})();


document.addEventListener('click',function(e){
 const btn=e.target.closest('#liftMonoOff .liftDetailFilter');
 if(!btn)return;
 e.preventDefault();e.stopPropagation();
 const value=btn.textContent.trim();if(!value)return;
 document.getElementById('liftMonoClose')?.click();
 if(btn.dataset.filter==='brand' && typeof setBrand==='function')setBrand(value);
 if(btn.dataset.filter==='category' && typeof setCat==='function')setCat(value);
 document.getElementById('grid')?.scrollIntoView({behavior:'smooth',block:'start'});
});

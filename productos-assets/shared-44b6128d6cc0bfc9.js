
(function(){
  let last=document.body.classList.contains('liftAdminUnlocked');
  new MutationObserver(function(){
    const now=document.body.classList.contains('liftAdminUnlocked');
    if(now===last)return;
    last=now;
    if(typeof render==='function')render();
    const q=document.getElementById('q');
    if(q && q.value.trim() && typeof renderQuickSearch==='function')renderQuickSearch(q.value);
  }).observe(document.body,{attributes:true,attributeFilter:['class']});
})();

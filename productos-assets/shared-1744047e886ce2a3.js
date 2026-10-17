
(function(){
  function cleanLiftSearch(){
    const q=document.getElementById('q');
    if(!q) return;
    if(/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(String(q.value||'').trim())) q.value='';
    q.removeAttribute('readonly');
  }
  document.addEventListener('DOMContentLoaded',cleanLiftSearch);
  window.addEventListener('pageshow',cleanLiftSearch);
})();

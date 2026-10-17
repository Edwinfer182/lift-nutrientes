
(function(){
  window.liftProductSlug = window.liftProductSlug || function(text){
    return String(text||'producto')
      .normalize('NFD').replace(/[\u0300-\u036f]/g,'')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g,'-')
      .replace(/^-+|-+$/g,'')
      .slice(0,80) || 'producto';
  };
  window.liftPublicProductUrl = window.liftPublicProductUrl || function(p){
    if(!p || p.__private) return '';
    const base=(location.pathname||'/');
    return `${base}?producto=${encodeURIComponent(String(p.id)+'-'+window.liftProductSlug(p.name))}`;
  };
})();

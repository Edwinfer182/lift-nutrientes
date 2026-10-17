
(function(){
const fields=['Keyword','Related','Title','Slug','Meta','Html','Alt1','Alt2','Sku','Gtin','Manufacturer'];
const field=k=>document.getElementById('liftSeo'+k);
window.liftSeoRead=function(){
  const seo={};
  for(const k of fields) seo[k.toLowerCase()]=(field(k)?.value||'').trim();
  seo.related=seo.related.split(/\r?\n/).map(x=>x.trim()).filter(Boolean).slice(0,4);
  return seo;
};
window.liftSeoLoad=function(seo){
  seo=seo||{};
  for(const k of fields){
    const el=field(k);if(!el)continue;
    const v=seo[k.toLowerCase()];
    el.value=k==='Related'?(Array.isArray(v)?v.join('\n'):(v||'')):(v||'');
  }
};
window.liftSeoClear=function(){window.liftSeoLoad({});};
})();

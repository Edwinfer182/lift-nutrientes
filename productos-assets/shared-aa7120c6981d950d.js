
(function(){
  // Protección definitiva: admin_meta jamás puede volver a guardar una copia de ofertas.
  function stripOffers(v){
    if(!v || typeof v!=='object' || Array.isArray(v)) return v;
    const clean={...v};
    delete clean.offers;
    return clean;
  }
  function installGuard(){
    if(typeof window.liftCloudSaveConfig!=='function'){setTimeout(installGuard,50);return}
    if(window.liftCloudSaveConfig.__liftProtected)return;
    const raw=window.liftCloudSaveConfig;
    const safe=async function(clave,valor){
      if(clave==='admin_meta') valor=stripOffers(valor);
      return raw(clave,valor);
    };
    safe.__liftProtected=true;
    window.liftCloudSaveConfig=safe;
  }
  // localStorage puede conservar estado visual, pero nunca una copia autoritativa de ofertas.
  try{
    const k='liftAdminFullMetaV2';
    const m=JSON.parse(localStorage.getItem(k)||'{}');
    if(m && typeof m==='object' && 'offers' in m){delete m.offers;localStorage.setItem(k,JSON.stringify(m))}
  }catch(e){}
  installGuard();
})();

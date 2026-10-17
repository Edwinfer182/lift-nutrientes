
(function(){
 const KEY='liftDataConsentAuditV1',$=id=>document.getElementById(id);
 window.liftOpenDataPolicy=function(){const m=$('liftDataPolicyModal');if(m){m.classList.add('open');m.setAttribute('aria-hidden','false')}};
 window.liftCloseDataPolicy=function(){const m=$('liftDataPolicyModal');if(m){m.classList.remove('open');m.setAttribute('aria-hidden','true')}};
 document.addEventListener('click',e=>{if(e.target?.id==='liftDataPolicyModal')liftCloseDataPolicy()});
 window.liftSaveConsentAudit=function(d,r){if(!d?.tratamiento_datos)return;try{const a=JSON.parse(localStorage.getItem(KEY)||'[]');a.push({pedido_id:r?.pedido_id||r?.referencia||null,celular:d.celular||'',aceptado:true,fecha:d.tratamiento_datos_fecha||new Date().toISOString(),version:d.tratamiento_datos_version||'LIFT-DATOS-2026-10-06-v1',marketing:!!d.marketing_autorizado});localStorage.setItem(KEY,JSON.stringify(a.slice(-30)))}catch(e){}}
})();

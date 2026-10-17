
(function(){
 const local=new Set(['medellin','bello','itagui','envigado','sabaneta','la estrella']);
 const norm=s=>String(s||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().trim();
 window.liftRequiresDocument=function(){try{return !!(selectedCity&&selectedCity.name&&!local.has(norm(selectedCity.name)))}catch(e){return false}};
 window.liftUpdateDocumentField=function(){const field=document.getElementById('liftDocumentField'),input=document.getElementById('coDocument');if(!field||!input)return;const required=window.liftRequiresDocument();field.hidden=!required;input.required=required;};
 document.addEventListener('DOMContentLoaded',function(){const city=document.getElementById('coCity');if(city){city.addEventListener('input',()=>{document.getElementById('liftDocumentField').hidden=true;document.getElementById('coDocument').required=false});city.addEventListener('change',()=>setTimeout(window.liftUpdateDocumentField,0));}const modal=document.getElementById('checkoutModal');if(modal)new MutationObserver(window.liftUpdateDocumentField).observe(modal,{attributes:true,attributeFilter:['class']});window.liftUpdateDocumentField();});
})();

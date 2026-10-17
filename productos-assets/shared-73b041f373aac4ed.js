
(function(){
 const $=id=>document.getElementById(id);
 function decorate(){
   const view=$('liftOrdersHistory'); if(!view)return;
   if(!view.querySelector('.liftHistoryHero')){
     const hero=document.createElement('div'); hero.className='liftHistoryHero';
     hero.innerHTML='<h3>Historial de clientes</h3><p>Busca por nombre o celular para ver compras, total comprado, ticket promedio, productos frecuentes y cronología de pedidos.</p>';
     view.insertBefore(hero,view.firstChild);
   }
   const inp=$('liftOrderClientSearch'); if(inp){inp.placeholder='Buscar cliente por nombre o celular'; inp.setAttribute('autocomplete','off');}
 }
 const previousTab=window.liftOrdersTab;
 window.liftOrdersTab=function(tab){
   const r=typeof previousTab==='function'?previousTab.apply(this,arguments):undefined;
   if(tab==='history')setTimeout(decorate,0);
   return r;
 };
 const previousOpen=window.liftOpenOrders;
 window.liftOpenOrders=function(){const r=typeof previousOpen==='function'?previousOpen.apply(this,arguments):undefined;setTimeout(decorate,0);return r};
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',decorate);else decorate();
})();

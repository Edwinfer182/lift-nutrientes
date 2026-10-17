
function liftPlaceServiceNotices(){
 const root=document.querySelector('#liftMonoBody .liftMonoBody');
 if(!root)return;
 const service=root.querySelector('.liftMonoServiceWide.liftDeliveryAccordion');
 const info=root.querySelector('.liftMonoInfo');
 const payments=info?.querySelector('.liftMonoPaymentMethods');
 if(!service||!info||!payments)return;
 if(window.matchMedia('(max-width:760px)').matches){
   if(service.parentElement!==root||service!==root.lastElementChild)root.appendChild(service);
 }else if(service.parentElement!==info||service.previousElementSibling!==payments){
   payments.insertAdjacentElement('afterend',service);
 }
}
window.addEventListener('resize',liftPlaceServiceNotices,{passive:true});


(()=>{
  const $=id=>document.getElementById(id);
  function capture(){
    const modal=$("checkoutModal"); if(!modal)return null;
    const fields=[];
    modal.querySelectorAll('input,textarea,select').forEach((el,i)=>fields.push({id:el.id||'',name:el.name||'',i,value:el.value,checked:'checked' in el?!!el.checked:null}));
    return {fields,city:(typeof selectedCity!=="undefined"&&selectedCity)?{...selectedCity}:null,coupon:(typeof appliedCoupon!=="undefined"&&appliedCoupon)?{...appliedCoupon}:null,scroll:modal.querySelector('.checkoutCard')?.scrollTop||0};
  }
  function restore(d){
    if(!d)return; const modal=$("checkoutModal"); if(!modal)return;
    d.fields.forEach(v=>{const el=(v.id&&$(v.id))||(v.name&&modal.querySelector(`[name="${CSS.escape(v.name)}"]`))||modal.querySelectorAll('input,textarea,select')[v.i];if(!el)return;el.value=v.value??'';if(v.checked!==null&&'checked' in el)el.checked=v.checked;});
    if(d.city&&typeof selectedCity!=="undefined")selectedCity={...d.city};
    if(d.coupon&&typeof appliedCoupon!=="undefined")appliedCoupon={...d.coupon};
    const card=modal.querySelector('.checkoutCard'); if(card)card.scrollTop=Number(d.scroll||0);
  }
  function install(){
    const original=window.shareLiftCheckoutImage;
    if(typeof original!=="function"||original.__liftStateGuardLight)return;
    const wrapped=async function(){
      const draft=capture();
      try{return await original.apply(this,arguments)}
      finally{restore(draft)}
    };
    wrapped.__liftStateGuardLight=true; window.shareLiftCheckoutImage=wrapped;
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install,{once:true});else install();
})();

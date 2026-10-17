
window.liftToggleCouponBox=function(btn){
  const box=document.getElementById('liftCouponBox');if(!box)return;
  const closed=box.classList.toggle('liftCouponCollapsed');
  if(btn)btn.setAttribute('aria-expanded',closed?'false':'true');
  if(!closed)setTimeout(()=>document.getElementById('coCoupon')?.focus(),60);
};

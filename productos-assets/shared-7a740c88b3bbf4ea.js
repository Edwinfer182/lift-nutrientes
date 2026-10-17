
(function(){
 const cleanOrderNumber=v=>{
   const digits=String(v||'').replace(/\D/g,'');
   const n=parseInt(digits,10);
   return Number.isFinite(n)?String(n):digits;
 };
 const oldTrack=window.liftTrackOrder;
 if(typeof oldTrack==='function'){
   window.liftTrackOrder=async function(){
     const r=await oldTrack.apply(this,arguments);
     const box=document.getElementById('liftTrackResult');
     if(box){
       const ref=box.querySelector('.liftOrderRef b');
       if(ref) ref.textContent='#'+cleanOrderNumber(ref.textContent);
     }
     return r;
   };
 }
})();

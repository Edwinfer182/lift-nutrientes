
(function(){
 let startY=0,startX=0,dragging=false,eligible=false;
 function install(){
  const panel=document.getElementById('liftMonoOff');if(!panel||panel.dataset.liftSwipeInstalled)return;
  panel.dataset.liftSwipeInstalled='1';
  const handle=document.createElement('span');handle.className='liftSwipeHandle';handle.setAttribute('aria-hidden','true');panel.prepend(handle);
  panel.addEventListener('touchstart',e=>{
   eligible=false;dragging=false;
   if(innerWidth>760||!panel.classList.contains('open')||e.touches.length!==1)return;
   if(e.target.closest('button,a,input,select,textarea,.isoFlavorStrip,.pdfFlavorStrip'))return;
   const body=document.getElementById('liftMonoBody');
   const atTop=!body||body.scrollTop<=2;
   const topArea=e.touches[0].clientY-panel.getBoundingClientRect().top<110;
   if(!atTop&&!topArea)return;
   eligible=true;startY=e.touches[0].clientY;startX=e.touches[0].clientX;
  },{passive:true});
  panel.addEventListener('touchmove',e=>{
   if(!eligible||e.touches.length!==1)return;
   const dy=e.touches[0].clientY-startY,dx=e.touches[0].clientX-startX;
   if(dy<12||Math.abs(dx)>Math.abs(dy)*.8)return;
   dragging=true;panel.classList.add('lift-swipe-dragging');
   panel.style.setProperty('transform','translateY('+Math.min(dy,innerHeight)+'px)','important');
   if(e.cancelable)e.preventDefault();
  },{passive:false});
  function finish(e){
   if(!eligible)return;
   const dy=e.changedTouches?.[0]?.clientY-startY||0;
   eligible=false;
   panel.classList.remove('lift-swipe-dragging');
   panel.style.removeProperty('transform');
   if(dragging&&dy>110){document.getElementById('liftMonoClose')?.click();}
   dragging=false;
  }
  panel.addEventListener('touchend',finish,{passive:true});
  panel.addEventListener('touchcancel',()=>{eligible=false;dragging=false;panel.classList.remove('lift-swipe-dragging');panel.style.removeProperty('transform')},{passive:true});
 }
 const observer=new MutationObserver(()=>{if(document.getElementById('liftMonoOff')){install();observer.disconnect()}});
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>{install();observer.observe(document.body,{childList:true,subtree:true})},{once:true});
 else{install();observer.observe(document.body,{childList:true,subtree:true})}
})();

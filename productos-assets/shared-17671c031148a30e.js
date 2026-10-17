
/* El feedback táctil no sustituye ni intercepta los manejadores existentes. */
(()=>{
 const selector='button:not(:disabled),[role="button"]:not([aria-disabled="true"]),input[type="button"]:not(:disabled),input[type="submit"]:not(:disabled)';
 document.addEventListener('pointerdown',e=>{
   const el=e.target.closest?.(selector);
   if(!el)return;
   el.classList.add('lift-control-pressed');
   const release=()=>el.classList.remove('lift-control-pressed');
   el.addEventListener('pointerup',release,{once:true});
   el.addEventListener('pointercancel',release,{once:true});
   el.addEventListener('pointerleave',release,{once:true});
 },{passive:true});
})();

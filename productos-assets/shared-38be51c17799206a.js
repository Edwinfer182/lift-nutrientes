
(()=>{
 const dock=document.getElementById('liftAdminToolsDock'),menu=document.getElementById('liftAdminToolsMenu'),btn=document.getElementById('liftAdminToolsMain');
 function moveButtons(){['liftCrmFloatingBtn','liftPaymentsAdminBtn','liftCalcToggle'].forEach(id=>{const el=document.getElementById(id);if(el&&el.parentElement!==menu)menu.appendChild(el)})}
 moveButtons();document.addEventListener('DOMContentLoaded',moveButtons);
 const observer=new MutationObserver(()=>{if(document.body.classList.contains('liftAdminUnlocked'))moveButtons()});observer.observe(document.body,{attributes:true,attributeFilter:['class']});
 btn.addEventListener('click',()=>{const open=dock.classList.toggle('open');btn.setAttribute('aria-expanded',String(open))});
 menu.addEventListener('click',e=>{if(e.target.closest('button')){dock.classList.remove('open');btn.setAttribute('aria-expanded','false')}});
 document.addEventListener('keydown',e=>{if(e.key==='Escape'){dock.classList.remove('open');btn.setAttribute('aria-expanded','false')}});
})();

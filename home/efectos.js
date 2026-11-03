/* SUPGO portada: aparición suave al hacer scroll. Solo presentación. */
(()=>{'use strict';
if(!('IntersectionObserver' in window))return;
if(matchMedia('(prefers-reduced-motion: reduce)').matches)return;
document.documentElement.classList.add('js-rv');
const SEL='.section-head,.brands-wrap,.category,.product,.trust>div,.seo-explora';
const io=new IntersectionObserver(es=>{for(const e of es){if(e.isIntersecting){e.target.classList.add('in');io.unobserve(e.target)}}},{rootMargin:'0px 0px -6% 0px',threshold:.08});
const fold=()=>innerHeight||document.documentElement.clientHeight;
function mark(el,fresh){
  if(el.classList.contains('rv')||el.closest('[aria-hidden="true"]'))return;
  // Lo que ya está visible al cargar no se oculta (evita parpadeo), salvo tarjetas recién creadas.
  if(!fresh&&el.getBoundingClientRect().top<fold())return;
  const sibs=[...el.parentElement.children].filter(x=>x.matches(SEL));
  el.style.setProperty('--d',Math.min(sibs.indexOf(el),6)*70+'ms');
  el.classList.add('rv');io.observe(el);
}
function scan(root,fresh){root.querySelectorAll(SEL).forEach(el=>mark(el,fresh))}
const main=document.querySelector('main');if(!main)return;
scan(main,false);
new MutationObserver(ms=>{for(const m of ms)for(const n of m.addedNodes){if(n.nodeType!==1)continue;if(n.matches(SEL))mark(n,true);scan(n,true)}}).observe(main,{childList:true,subtree:true});
// Seguridad: nada queda oculto si el observador no responde.
setTimeout(()=>document.querySelectorAll('.rv:not(.in)').forEach(el=>{const r=el.getBoundingClientRect();if(r.top<fold()&&r.bottom>0)el.classList.add('in')}),2500);
})();

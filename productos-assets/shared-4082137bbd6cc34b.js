
(() => {
  const BANNERS = [
    {
      name:'Ofertas de la semana',
      desktop:'https://drive.google.com/thumbnail?id=1wc7UJfLCsnVtZBipTmmnfZjGb-zfN6Zg&sz=w1920',
      mobile:'https://drive.google.com/thumbnail?id=1ROs6zmz1bGQLqVivOwvJ-uct8SKWMQWJ&sz=w1200',
      action:'offers'
    },
    {
      name:'Encuentra tu proteína ideal',
      desktop:'https://drive.google.com/thumbnail?id=1hOxO1L2jzFfxFjF0ddRhtj-G71J2eTOu&sz=w1920',
      mobile:'https://drive.google.com/thumbnail?id=1W_065duG_YKiSFrGcoF5FccQreXwbGiG&sz=w1200',
      action:'proteins'
    },
    {
      name:'Todo lo que necesitas',
      desktop:'https://drive.google.com/thumbnail?id=1UH2MrBWOEndtiiV4grmDBXRlzqIviQ-P&sz=w1920',
      mobile:'https://drive.google.com/thumbnail?id=1bM8sFgRNxHBOv4OnZC47KBoTnXkdAC9d&sz=w1200',
      action:'catalog'
    },
    {
      name:'Recibe tu pedido donde estés',
      desktop:'https://drive.google.com/thumbnail?id=1Y8r0quBCKawlh6BRp0HgdbDjROKfeMNR&sz=w1920',
      mobile:'https://drive.google.com/thumbnail?id=1jKvUlmlyCe5STuFe2coO5yBryhgfrxdj&sz=w1200'
    }
  ];
  const DISPLAY_MS = 7000;
  const viewport = document.getElementById('liftBannerViewport');
  const track = document.getElementById('liftBannerTrack');
  const dots = document.getElementById('liftBannerDots');
  const progress = document.getElementById('liftBannerProgressBar');
  if(!viewport || !track || !dots || !BANNERS.length) return;

  track.innerHTML = BANNERS.map((b,i)=>`<div class="liftBannerSlide${i===0?' active':''}" data-index="${i}" ${b.action?`data-action="${b.action}" role="button" tabindex="0"`:''} aria-label="${b.name}"><picture><source media="(max-width:760px)" srcset="${b.mobile}"><img src="${b.desktop}" alt="${b.name}" ${i===0?'fetchpriority="high"':'loading="lazy" fetchpriority="low"'} decoding="async"></picture></div>`).join('');
  dots.innerHTML = BANNERS.map((b,i)=>`<button type="button" class="liftBannerDot${i===0?' active':''}" aria-label="Mostrar banner ${i+1}: ${b.name}" onclick="liftBannerGo(${i},true)"></button>`).join('');

  let current=0, timer=null, paused=false, touchX=0, touchY=0;
  const slides=[...track.querySelectorAll('.liftBannerSlide')];
  const dotEls=[...dots.querySelectorAll('.liftBannerDot')];

  function restartProgress(){
    if(!progress) return;
    progress.classList.remove('running');
    progress.style.width='0';
    void progress.offsetWidth;
    if(!paused && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) progress.classList.add('running');
  }
  function schedule(){
    clearTimeout(timer);
    restartProgress();
    if(!paused) timer=setTimeout(()=>go(current+1,false),DISPLAY_MS);
  }
  function go(index,userInitiated=false){
    const next=(index+BANNERS.length)%BANNERS.length;
    if(next===current){ if(userInitiated)schedule(); return; }
    const old=slides[current], incoming=slides[next];
    old.classList.remove('active'); old.classList.add('leaving');
    incoming.classList.remove('leaving'); incoming.classList.add('active');
    dotEls[current]?.classList.remove('active'); dotEls[next]?.classList.add('active');
    setTimeout(()=>old.classList.remove('leaving'),760);
    current=next;
    schedule();
  }
  window.liftBannerGo=go;
  window.liftBannerPrev=()=>go(current-1,true);
  window.liftBannerNext=()=>go(current+1,true);

  function runAction(action){
    if(action==='offers' && typeof showOffers==='function'){
      if(!state.offerOnly) showOffers(); else document.getElementById('grid')?.scrollIntoView({behavior:'auto',block:'start'});
    } else if(action==='proteins' && typeof setCat==='function'){
      setCat('Proteína'); document.getElementById('grid')?.scrollIntoView({behavior:'auto',block:'start'});
    } else if(action==='catalog' && typeof setCat==='function'){
      setCat('Todos'); document.getElementById('grid')?.scrollIntoView({behavior:'auto',block:'start'});
    }
  }
  slides.forEach(slide=>{
    slide.addEventListener('click',()=>runAction(slide.dataset.action));
    slide.addEventListener('keydown',e=>{if((e.key==='Enter'||e.key===' ')&&slide.dataset.action){e.preventDefault();runAction(slide.dataset.action)}});
  });

  const pause=()=>{paused=true;clearTimeout(timer);progress?.classList.remove('running')};
  const resume=()=>{paused=false;schedule()};
  viewport.addEventListener('mouseenter',pause);
  viewport.addEventListener('mouseleave',resume);
  viewport.addEventListener('focusin',pause);
  viewport.addEventListener('focusout',resume);
  document.addEventListener('visibilitychange',()=>document.hidden?pause():resume());
  viewport.addEventListener('touchstart',e=>{const t=e.changedTouches[0];touchX=t.clientX;touchY=t.clientY;pause()},{passive:true});
  viewport.addEventListener('touchend',e=>{const t=e.changedTouches[0],dx=t.clientX-touchX,dy=t.clientY-touchY;if(Math.abs(dx)>48&&Math.abs(dx)>Math.abs(dy)*1.2)go(current+(dx<0?1:-1),true);else resume()},{passive:true});
  schedule();
})();

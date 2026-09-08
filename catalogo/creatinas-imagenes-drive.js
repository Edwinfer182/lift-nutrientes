(() => {
  'use strict';

  const DRIVE = 'https://drive.google.com/thumbnail?id=';
  const images = [
    { keys:['cell tech','3 lb','3lbs'], id:'1Ltfp2lD4vRKKwD_R_ERmfqUm1JOljMpb' },
    { keys:['cell tech','6 lb','6lbs'], id:'12zfD4aDhk5nH78rMWrNo9-RFBeu1phUb' },
    { keys:['creactor'], id:'1WfJJSzeLMAAc-GZOqDH_HpvSe8h_abAQ' },
    { keys:['crea stack'], id:'1vwCWMGdlcATLB3ZeYG_lgtuyxdeKBtYQ' },
    { keys:['creatina chews'], id:'1U73goE-Ej9Sou1Pfqc5iSBLuER1NGqF2' },
    { keys:['dymatize','creatina'], id:'1unY0XVVrUOgxhlEOJPduO-W0yBggMNc9' },
    { keys:['iron','creatina'], id:'1WgTsfF74d80FErFRBZ_qsN_pDnB08hD_' },
    { keys:['optimum nutrition','240'], id:'15Se4597oGm8jWGpKMDkYOgx45h4P68ff' },
    { keys:['platinum','90'], id:'1jEUIurIkIP0eNAxAxd28hWtLspMezTFn' },
    { keys:['simply','300'], id:'1SOvlTG1-OG2DBtersnefTbk-NHAwuww8' },
    { keys:['creatine basic'], id:'1DbWHPWzi2DgEbvkkPl9Rhjn1pAJ-1vwR' },
    { keys:['simply','1 kg'], id:'1LHbMA2OJ8SO7kQWNAeecfJyNyEV8z7i-' },
    { keys:['legacy','50'], id:'1CtXgrkeOHQCrXNjnbOQJLAcOip_WvGTP' }
  ];

  const norm = s => String(s || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9]+/g,' ').trim();

  function score(text, keys){
    const t=norm(text);
    return keys.reduce((n,k)=>n+(t.includes(norm(k))?1:0),0);
  }

  function apply(){
    document.querySelectorAll('.card, [class*="product"], article').forEach(card => {
      const text=card.innerText || card.textContent || '';
      if(!/creat|cell tech|creactor|legacy|crea stack/i.test(text)) return;
      let best=null, bestScore=0;
      images.forEach(item=>{
        const s=score(text,item.keys);
        if(s>bestScore){best=item;bestScore=s;}
      });
      if(!best || bestScore<Math.min(2,best.keys.length)) return;
      const img=card.querySelector('.pic img, img');
      if(!img) return;
      const url=DRIVE+best.id+'&sz=w800';
      if(img.dataset.liftDriveId===best.id) return;
      img.dataset.liftDriveId=best.id;
      img.loading='lazy';
      img.decoding='async';
      img.referrerPolicy='no-referrer';
      img.src=url;
    });
  }

  apply();
  const observer=new MutationObserver(()=>requestAnimationFrame(apply));
  observer.observe(document.documentElement,{childList:true,subtree:true});
  window.addEventListener('hashchange',apply);
})();

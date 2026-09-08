(() => {
  'use strict';

  const DRIVE = 'https://drive.google.com/thumbnail?id=';
  const images = [
    { aliases:['cell tech 3 lb','cell tech 3lbs','cell tech 3 libras'], id:'1Ltfp2lD4vRKKwD_R_ERmfqUm1JOljMpb' },
    { aliases:['cell tech 6 lb','cell tech 6lbs','cell tech 6 libras'], id:'12zfD4aDhk5nH78rMWrNo9-RFBeu1phUb' },
    { aliases:['cell tech creactor','creactor 120','creactor'], id:'1WfJJSzeLMAAc-GZOqDH_HpvSe8h_abAQ' },
    { aliases:['crea stack','creastack'], id:'1vwCWMGdlcATLB3ZeYG_lgtuyxdeKBtYQ' },
    { aliases:['creatina chews','creatine chews','chews 90'], id:'1U73goE-Ej9Sou1Pfqc5iSBLuER1NGqF2' },
    { aliases:['creatina dymatize','creatine dymatize','dymatize 300'], id:'1unY0XVVrUOgxhlEOJPduO-W0yBggMNc9' },
    { aliases:['creatina iron','creatine iron','iron 100 serv'], id:'1WgTsfF74d80FErFRBZ_qsN_pDnB08hD_' },
    { aliases:['creatina on 240','creatine on 240','optimum nutrition 240','creatina optimum 240'], id:'15Se4597oGm8jWGpKMDkYOgx45h4P68ff' },
    { aliases:['creatina platinum 90','creatine platinum 90','platinum 90 serv'], id:'1jEUIurIkIP0eNAxAxd28hWtLspMezTFn' },
    { aliases:['creatina simply 300','creatine simply 300','simply 300'], id:'1SOvlTG1-OG2DBtersnefTbk-NHAwuww8' },
    { aliases:['creatine basic 300','creatina basic 300','basic 300'], id:'1DbWHPWzi2DgEbvkkPl9Rhjn1pAJ-1vwR' },
    { aliases:['creatine simply 1 kg','creatina simply 1 kg','simply 1 kg','simply 1000'], id:'1LHbMA2OJ8SO7kQWNAeecfJyNyEV8z7i-' },
    { aliases:['legacy 50','legacy creatine','creatina legacy'], id:'1CtXgrkeOHQCrXNjnbOQJLAcOip_WvGTP' }
  ];

  const norm = s => String(s || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9]+/g,' ').replace(/\s+/g,' ').trim();

  function findImage(text){
    const t = norm(text);
    let best = null;
    let bestLen = 0;
    for (const item of images) {
      for (const alias of item.aliases) {
        const a = norm(alias);
        if (a && t.includes(a) && a.length > bestLen) {
          best = item;
          bestLen = a.length;
        }
      }
    }
    return best;
  }

  function apply(){
    document.querySelectorAll('.card, [class*="product"], article').forEach(card => {
      const text = card.innerText || card.textContent || '';
      const match = findImage(text);
      if (!match) return;
      const img = card.querySelector('.pic img, img');
      if (!img || img.dataset.liftDriveId === match.id) return;
      img.dataset.liftDriveId = match.id;
      img.loading = 'lazy';
      img.decoding = 'async';
      img.referrerPolicy = 'no-referrer';
      img.src = DRIVE + match.id + '&sz=w800';
    });
  }

  let queued = false;
  const queueApply = () => {
    if (queued) return;
    queued = true;
    requestAnimationFrame(() => { queued = false; apply(); });
  };

  apply();
  new MutationObserver(queueApply).observe(document.documentElement,{childList:true,subtree:true});
  window.addEventListener('hashchange',queueApply);
})();

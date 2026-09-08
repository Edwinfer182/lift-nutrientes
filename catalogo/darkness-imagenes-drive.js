(() => {
  'use strict';

  const DRIVE = 'https://drive.google.com/thumbnail?id=';
  const images = [
    { aliases:['evora pw pre entreno 30 serv','evora pw 30 serv'], id:'1IDRqIdZV48ctD2F_vHA1a7Nl3Y1_u8Su' },
    { aliases:['creatina creapure 3g 66 serv','creatina creapure 66 serv'], id:'1p_mvE_LmEMG89Y_y12Xmg1o62PQr_o5Q' },
    { aliases:['vasculor pre entreno vasodilatador 300 gr','vasculor 300 gr','vasculor'], id:'1YuBPsFS6BlcHpLi3blC1ULowX7Hc8XT7' },
    { aliases:['evora xt 60 serv','evora xt'], id:'1cjtmBiFrOIHblZTO0ZQ1ETqzx4ucVlin' },
    { aliases:['whey concentrada 30g proteina 2 lb','whey concentrada 30g proteína 2lb','whey concentrada 2 lb'], id:'18fIT6Un1ZTRxM36g6i3PgtocBBCfLxce' },
    { aliases:['dark bar x8','dark bar darkness nation x 8 und','dark bar darkness nation'], id:'1E_BAjdlx63HCr8lp3yekgXOOz2h-lpU9' }
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
    document.querySelectorAll('.card, [class*="product-card"], [class*="product"], article').forEach(card => {
      const text = card.innerText || card.textContent || '';
      const match = findImage(text);
      if (!match) return;
      const img = card.querySelector('.pic img, img');
      if (!img || img.dataset.liftDarknessDriveId === match.id) return;
      img.dataset.liftDarknessDriveId = match.id;
      img.loading = 'lazy';
      img.decoding = 'async';
      img.referrerPolicy = 'no-referrer';
      img.src = DRIVE + match.id + '&sz=w800';
      img.style.width = 'auto';
      img.style.height = 'auto';
      img.style.maxWidth = '100%';
      img.style.maxHeight = '100%';
      img.style.objectFit = 'contain';
      img.style.objectPosition = 'center';
    });
  }

  let queued = false;
  const queueApply = () => {
    if (queued) return;
    queued = true;
    requestAnimationFrame(() => {
      queued = false;
      apply();
    });
  };

  apply();
  new MutationObserver(queueApply).observe(document.documentElement,{childList:true,subtree:true});
  window.addEventListener('hashchange',queueApply);
})();
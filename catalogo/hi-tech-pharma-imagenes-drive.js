(() => {
  'use strict';

  const DRIVE = 'https://drive.google.com/thumbnail?id=';
  const images = [
    { aliases:['lipodrene hardcore'], id:'1Z37dxhu_f02ydYD2yAlV5yD6azIsImpU' },
    { aliases:['lipodrene xtreme'], id:'1I5wyjmNF_WL2zzj6uL10N2hCUsGlH2lO' },
    { aliases:['lipodrene'], id:'1xyWPMwGOBhWCdXCUF_lcZBucyRWjLW5N' },
    { aliases:['creatina hi tech 400 gr 80 serv'], id:'1VZ0zmLXIGCB6yZgc7-UWfABCAcpRvH0X' },
    { aliases:['cafeina 100 caps'], id:'1KWBwdsuVk_LUyB81_HqETJW3HoymVtEI' },
    { aliases:['magnesium glycinate 120 caps 500 mg'], id:'1VQS3qtHNgtyBHYFeODJjRsC-vvuILUfL' },
    { aliases:['resveratrol 90 caps 500 mg'], id:'12A_H86wFkWU8_8xZTwSyilQdL8Ap8HCO' },
    { aliases:['nac 100 serv 600 mg'], id:'16vuDT1cGZQH4kfhPg7izQ6cLHUdI7wzK' }
  ];

  const norm = s => String(s || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g,'')
    .replace(/[^a-z0-9]+/g,' ')
    .replace(/\s+/g,' ')
    .trim();

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
      if (!img || img.dataset.liftHiTechDriveId === match.id) return;
      img.dataset.liftHiTechDriveId = match.id;
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
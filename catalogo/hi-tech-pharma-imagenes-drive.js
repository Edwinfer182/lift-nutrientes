(() => {
  'use strict';

  const DRIVE = 'https://drive.google.com/thumbnail?id=';
  const images = [
    { aliases:['lipodrene hardcore'], id:'1Z37dxhu_f02ydYD2yAlV5yD6azIsImpU' },
    { aliases:['lipodrene xtreme'], id:'1I5wyjmNF_WL2zzj6uL10N2hCUsGlH2lO' },
    { aliases:['lipodrene'], id:'1xyWPMwGOBhWCdXCUF_lcZBucyRWjLW5N' },
    { aliases:['creatina hitech 400 g 80 serv','creatina hitech 400 gr 80 serv','creatina hi tech 400 gr 80 serv'], id:'1VZ0zmLXIGCB6yZgc7-UWfABCAcpRvH0X' },
    { aliases:['100 caps cafeina','cafeina 100 caps'], id:'1KWBwdsuVk_LUyB81_HqETJW3HoymVtEI' },
    { aliases:['magnesium glycinate 120 caps 500mg','magnesium glycinate 120 caps 500 mg'], id:'1VQS3qtHNgtyBHYFeODJjRsC-vvuILUfL' },
    { aliases:['resveratrol x 90 caps 500 mg','resveratrol 90 caps 500 mg'], id:'12A_H86wFkWU8_8xZTwSyilQdL8Ap8HCO' },
    { aliases:['nac protector hepatico 100 porciones 600 mg','nac 100 serv 600 mg'], id:'16vuDT1cGZQH4kfhPg7izQ6cLHUdI7wzK' }
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
      if (!img) return;

      const wanted = DRIVE + match.id + '&sz=w800';
      if (!String(img.src || '').includes(match.id)) {
        img.src = wanted;
      }

      img.dataset.liftHiTechDriveId = match.id;
      img.loading = 'lazy';
      img.decoding = 'async';
      img.referrerPolicy = 'no-referrer';
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
  new MutationObserver(queueApply).observe(document.documentElement,{childList:true,subtree:true,attributes:true,attributeFilter:['src']});
  window.addEventListener('hashchange',queueApply);
  window.addEventListener('load',queueApply);
  setTimeout(apply,300);
  setTimeout(apply,1000);
})();
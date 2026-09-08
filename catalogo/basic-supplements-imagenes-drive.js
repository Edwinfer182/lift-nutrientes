(() => {
  'use strict';

  const DRIVE = 'https://drive.google.com/thumbnail?id=';
  const images = [
    { aliases:['basic whey 5 servicios','basic whey 5 serv'], id:'1ElqN-lMqqMrgwhRpuMlY5sSJslQEMzd3' },
    { aliases:['basic whey 2 lbs','basic whey 2 lb'], id:'1ZITSnP69Aav4v5wqgmkJCnLRbk5xbEVY' },
    { aliases:['basic whey 5 lbs','basic whey 5 lb'], id:'1rKHLt25Ifw2oLdWhRcJI6yuQaNi0GdC2' },
    { aliases:['basic isolate 2 lbs','basic isolate 2 lb'], id:'1dELhRARMFAm-CxHzadUP4buuvriPD_dk' },
    { aliases:['basic isolate 5 lbs','basic isolate 5 lb'], id:'1uOhLzMQ3Ar72p_2HVwA1lJiVlDYKvU9h' },
    { aliases:['basic mass gainer 6 lbs','basic mass gainer 6 lb','basic mass 6 lbs'], id:'1Z7r_uOpEchdKkPGdPah-BoYDxuFDmf98' },
    { aliases:['basic eaa 30 ser','basic eaa 30 serv'], id:'1VHoyRp46prnbURLRlEyM8-r3c4zAqhpe' },
    { aliases:['basic creatina 300 gr','basic creatina 300gr','basic creatina 300 gr 60 serv'], id:'1PMh8XsVviqmTb2gW2Hs0pRujkzWBCxQ3' },
    { aliases:['basic glutamina 300 gr','basic glutamina 300gr','basic glutamina 300 gr 60 serv'], id:'1tnzo1YGFMMhB9uqvc_8hNjXFo0PiIFBn' },
    { aliases:['basic pre 30 serv','basic pre 30serv'], id:'1fI72R-mfsfwFZZ89LX8gexI7Ej5Om__8' },
    { aliases:['basic burn 45 serv','basic burn 45serv'], id:'17qRVvdLuhgZPbA1OdB09VcvVWfzjRcSk' },
    { aliases:['basic hydration 20 sachet','basic hydration 20 sachets'], id:'1UE-4QAS4KG6_pM1xBsFHC8XjZm3oVsHo' }
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
    document.querySelectorAll('.card, [class*="product"], article').forEach(card => {
      const text = card.innerText || card.textContent || '';
      const match = findImage(text);
      if (!match) return;
      const img = card.querySelector('.pic img, img');
      if (!img || img.dataset.liftBasicDriveId === match.id) return;
      img.dataset.liftBasicDriveId = match.id;
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
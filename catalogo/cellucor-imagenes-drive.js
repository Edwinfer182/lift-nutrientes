(() => {
  'use strict';

  const DRIVE = 'https://drive.google.com/thumbnail?id=';
  const images = [
    { aliases:['c4 original 30 serv'], id:'1YXOZRYzCGGE5PJHWhn-lP_z_2txNikj4' },
    { aliases:['c4 original 50 serv'], id:'1PSYV7N_p3tTLhm6wWybRr_6oaMRZOLjE' },
    { aliases:['c4 original energy 1 lata','c4 original energy','c4 energy 1 lata'], id:'1k5NPyqykx_zraCKqgS9C1F0u1BQAaxcH' },
    { aliases:['c4 energy drink pack x12 latas','c4 energy drink pack x12','c4 energy pack x12'], id:'1OWVAwa0EGcZa55PyqoLaQyNAsk6Opobq' }
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
      if (!img || img.dataset.liftCellucorDriveId === match.id) return;
      img.dataset.liftCellucorDriveId = match.id;
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
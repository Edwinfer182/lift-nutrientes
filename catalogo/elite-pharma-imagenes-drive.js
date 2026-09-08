(() => {
  'use strict';

  const DRIVE = 'https://drive.google.com/thumbnail?id=';
  const images = [
    { aliases:['survivor pack 30 packs','survivor pack'], id:'1gZsrU7pDRCzm7D_kyP2zRR1onsCLPLzX' },
    { aliases:['lipocore advance 90 caps','lipocore advance'], id:'1G1QmS5BaZVPW0RLTljQPUxgxJDsV8quA' },
    { aliases:['organ defender'], id:'1TDYO73zON7KwLbzzvBUFkLeQMpBUVruP' },
    { aliases:['testabolic xtreme 120 caps','testabolic xtreme'], id:'1pVC2r9y19dg8W-ZxH9nq9OicJX6qgxqs' }
  ];

  const norm = s => String(s || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9]+/g,' ').replace(/\s+/g,' ').trim();

  function findImage(text){
    const t = norm(text); let best = null; let bestLen = 0;
    for (const item of images) for (const alias of item.aliases) {
      const a = norm(alias);
      if (a && t.includes(a) && a.length > bestLen) { best = item; bestLen = a.length; }
    }
    return best;
  }

  function apply(){
    document.querySelectorAll('.card, [class*="product-card"], [class*="product"], article').forEach(card => {
      const match = findImage(card.innerText || card.textContent || '');
      if (!match) return;
      const img = card.querySelector('.pic img, img');
      if (!img || img.dataset.liftElitePharmaImage === match.id) return;
      img.dataset.liftElitePharmaImage = match.id;
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
    requestAnimationFrame(() => { queued = false; apply(); });
  };

  apply();
  new MutationObserver(queueApply).observe(document.documentElement,{childList:true,subtree:true});
  window.addEventListener('hashchange',queueApply);
})();
(() => {
  'use strict';

  const DRIVE = 'https://drive.google.com/thumbnail?id=';
  const images = [
    { aliases:['syntha 6 10 lbs','syntha 6 10 lb'], id:'1ICGqpvXh3HYqoyQqzQ3pUUHT9gX4xGFp' },
    { aliases:['syntha 6 5 lbs','syntha 6 5 lb'], id:'13AH4sX3CA-nhu3kVhUpnwkn02-X-Qa1x' },
    { aliases:['amino x 30 serv','amino x 30 servicios'], id:'1JT3c3GTCJb0JRwO1tc4FnQ248-QwP9kM' },
    { aliases:['amino x 70 serv','amino x 70 servicios'], id:'187Lk4ELQR11BiAGEbmyV-p0PuuJn9Sax' },
    { aliases:['no-xplode 30 serv','no xplode 30 serv','noxplode 30 serv'], id:'1Jjz5ps90vldNUPf8vzSUMevLMvhsczYY' },
    { aliases:['no-xplode 60 serv','no xplode 60 serv','noxplode 60 serv'], id:'1r3QRCzPmEp-9fIFrvPdXaI1EeCavKkUk' },
    { aliases:['protein crisp barra','bsn protein crisp bar','protein crisp bar','protein crisp'], id:'1pTQboDBRwohjtvucpK8m56U5OsVDoWmG' }
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
      const key = match.id || match.url;
      if (!img || img.dataset.liftBsnImage === key) return;
      img.dataset.liftBsnImage = key;
      img.loading = 'lazy'; img.decoding = 'async'; img.referrerPolicy = 'no-referrer';
      img.src = match.url || (DRIVE + match.id + '&sz=w800');
      img.style.width = 'auto'; img.style.height = 'auto'; img.style.maxWidth = '100%'; img.style.maxHeight = '100%'; img.style.objectFit = 'contain'; img.style.objectPosition = 'center';
    });
  }

  let queued = false;
  const queueApply = () => { if (queued) return; queued = true; requestAnimationFrame(() => { queued = false; apply(); }); };
  apply();
  new MutationObserver(queueApply).observe(document.documentElement,{childList:true,subtree:true});
  window.addEventListener('hashchange',queueApply);
})();
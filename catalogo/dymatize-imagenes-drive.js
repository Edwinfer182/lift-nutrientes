(() => {
  'use strict';

  const DRIVE = 'https://drive.google.com/thumbnail?id=';
  const images = [
    { aliases:['iso 100 1.3 lbs','iso100 1.3 lb','iso100 1.3 lbs'], id:'1HkTDmvSZ51yciulklQY_me0rrj2-RYAN' },
    { aliases:['iso 100 3 lbs','iso100 3 lb','iso100 3 lbs'], id:'1K-cwmTzwoHm9W94hLxlmzvjPYngc6pAf' },
    { aliases:['iso 100 5 lbs','iso100 5 lb','iso100 5 lbs'], id:'1Dc0hXGskYfHD37xr93JsGfLuz1EXMgpB' },
    { aliases:['super mass gainer 6 lbs','super mass 6 lbs'], id:'1IA5MMLsIGl8CuSUbYT-kKf39lxmzAMg5' },
    { aliases:['super mass gainer 12 lbs','super mass 12 lbs'], id:'135QeLTYS4QyGpxf9dUPFc7PR4FD4Eudk' },
    { aliases:['elite whey 2 lbs','whey elite 2 lbs'], id:'1uy1E8XoiIPAc9T97Ys8cC8QFBRj1NXT_' },
    { aliases:['elite whey 5 lbs','whey elite 5 lbs','whey elite 100%'], id:'1SqKAg0VHMqbb5Vku0ocUNj6D878v_oyr' },
    { aliases:['creatina dymatize 300 gr 88 serv 3 gr','creatina 300 gr 88 serv 3 gr'], id:'1wqXm26uMqFL4odl3EtSp0FE7nYC_iMxf' },
    { aliases:['creatina dymatize 500 gr 147 serv 3 gr','creatina 500 gr 147 serv 3 gr'], id:'1EheZUWD7-eks3btcS-ldzXmlhyLwrrHx' },
    { aliases:['creatina dymatize 300 gr 60 serv','creatina 300 gr 60 serv','creatina dymatize 60 serv'], id:'13-ANgE3a10jy0nZ7IJpQ1cSRNNTr1zfX' },
    { aliases:['dymatize protein shake','protein shake'], id:'15KDUdpx3CgUZVaIg61IvxXhzNSz3xPS3' }
  ];

  const norm = s => String(s || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g,'')
    .replace(/[^a-z0-9.%]+/g,' ')
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
      if (!img || img.dataset.liftDymatizeDriveId === match.id) return;
      img.dataset.liftDymatizeDriveId = match.id;
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
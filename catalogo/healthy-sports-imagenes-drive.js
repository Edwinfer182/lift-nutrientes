(() => {
  'use strict';

  const DRIVE = 'https://drive.google.com/thumbnail?id=';
  const images = [
    { aliases:['creatina healthy sports 300 gr','creatina healthy sports 300 gramos','healthy sports creatina 300 gr'], id:'12MsRLrhi30BiHmuxtFEo9PmN7e5_1AK8' },
    { aliases:['creatina healthy sports 150 gr','creatina healthy sports 150 gramos','healthy sports creatina 150 gr'], id:'1qczaRDiGW4FIeWtBK_c-UZ_Cda1CcGLT' },
    { aliases:['vegan protein 2 lb','vegan protein','healthy sports vegan protein'], id:'1FRzZhDFbXc1lHHGdIqI3JKaXyOy90E8p' },
    { aliases:['turmeric 60 gomas','tumeric 60 gomas'], id:'1UDrn_ltFF-4BSno6X9NLEmEB42UYpYeu' },
    { aliases:['citrato de magnesio gomitas 30 serv','citrato de magnesio en gomas 30 serv','citrato de magnesio'], id:'1LnuXSNCv2sE8OeZSGs2cY-pOPn_MPyac' },
    { aliases:['complejo b gomitas 30 serv','complejo b gomas 30 serv','complejo b'], id:'1oFtujnApUojGJHKaiKJJY2tnKJPLMzrj' }
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
    document.querySelectorAll('.card, [class*="product-card"], article').forEach(card => {
      if (card.closest('#liftProductOffcanvas')) return;
      const text = card.innerText || card.textContent || '';
      const match = findImage(text);
      if (!match) return;
      const img = card.querySelector('.pic img, img');
      if (!img || img.dataset.liftHealthySportsDriveId === match.id) return;
      img.dataset.liftHealthySportsDriveId = match.id;
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
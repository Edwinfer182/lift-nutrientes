(() => {
  'use strict';
  const DRIVE='https://drive.google.com/thumbnail?id=';
  const images=[
    {aliases:['synephrine'],id:'1QXq2EkDLay-wG7DvauRmPbUvOLUan39V'},
    {aliases:['citrulina'],id:'1z0_qDetPfcSAIIGW5_7m5k81wNAQHsRj'},
    {aliases:['multi-core','multi core'],id:'18IYr5bKHLIUfw9fnQw3FoEHF4hdLNlQ4'},
    {aliases:['neuro freak'],id:'1v7pVvkIe8Z9cqO2B30eWUcWdLpcfoWOa'},
    {aliases:['cafeina'],id:'1FUCLLkAKZCp_y-hZI87QS3wk0oYHF1yX'},
    {aliases:['zma'],id:'1d8C4JD9ObMkIkZB2rPNiK-lHHwx3jr3_'},
    {aliases:['nac'],id:'1odM8jz3GNAjMF0QRzGKUfTZdrNjG7fUf'},
    {aliases:['magnesium glycinate','magnesio glycinate'],id:'1GUkZPgVgzMnzC3qApw-sj9DkjfdBQKHP'},
    {aliases:['crea 166 serv'],id:'1WFr1tJPyqLto9DM2kWM1SHcdYW49L0F_'},
    {aliases:['yohimbina'],id:'1Ac6nPsFqTvp-oTEsfw9_yv3tSKsndwO-'},
    {aliases:['gluta'],id:'19jTBrWRUnJG6q1_mhvulPQ43e3GuilUe'},
    {aliases:['biozyme enzimas'],id:'1HPIY3P-rKcJvQhXuD-8A7YOhnEQnGrmP'},
    {aliases:['hmb'],id:'1WPzPJCUyxYJswNzQr9HoqTGRD0Larn5e'},
    {aliases:['testo rage'],id:'1L4j8C_uV-DRHM-gprqadakivX9oaU-SX'},
    {aliases:['ashwagandha'],id:'1y1iWQ4KUITPv2bV9GVZmV7uOjitCtl8Y'},
    {aliases:['arginina'],id:'10FUQFkttsrHl2du0csBC3V5JErFAtTz3'},
    {aliases:['beta-alanina','beta alanina'],id:'1acqPc-NO8K9pRsmHykv7WS8CTxZWxAMn'}
  ];
  const norm=s=>String(s||'').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9]+/g,' ').replace(/\s+/g,' ').trim();
  const hasPhrase=(text,phrase)=>` ${norm(text)} `.includes(` ${norm(phrase)} `);
  function isHardSupps(card){
    const brand=[card.getAttribute('data-brand'),card.getAttribute('data-marca'),card.dataset?.brand,card.dataset?.marca].filter(Boolean).join(' ');
    if(/hard\s*supps/i.test(norm(brand))) return true;
    const brandNode=card.querySelector('.brand,.marca,[class*="brand"],[class*="marca"],[data-brand],[data-marca]');
    if(brandNode && /hard\s*supps/i.test(norm(brandNode.textContent||brandNode.getAttribute('data-brand')||brandNode.getAttribute('data-marca')||''))) return true;
    const text=norm(card.innerText||card.textContent||'');
    return hasPhrase(text,'hard supps') || hasPhrase(text,'hardsupps');
  }
  function findImage(text){let best=null,bestLen=0;for(const item of images)for(const alias of item.aliases){const a=norm(alias);if(a&&hasPhrase(text,alias)&&a.length>bestLen){best=item;bestLen=a.length}}return best;}
  function apply(){
    document.querySelectorAll('.card,[class*="product-card"],article').forEach(card=>{
      if(card.closest('#liftProductOffcanvas')||!isHardSupps(card)) return;
      const match=findImage(card.innerText||card.textContent||'');
      if(!match) return;
      const img=card.querySelector('.pic img,img');
      if(!img||img.dataset.liftHardSuppsDriveId===match.id) return;
      img.dataset.liftHardSuppsDriveId=match.id;
      img.loading='lazy';img.decoding='async';img.referrerPolicy='no-referrer';
      img.src=DRIVE+match.id+'&sz=w800';
      img.style.width='auto';img.style.height='auto';img.style.maxWidth='100%';img.style.maxHeight='100%';img.style.objectFit='contain';img.style.objectPosition='center';
    });
  }
  let queued=false;const queueApply=()=>{if(queued)return;queued=true;requestAnimationFrame(()=>{queued=false;apply();});};
  apply();new MutationObserver(queueApply).observe(document.documentElement,{childList:true,subtree:true});window.addEventListener('hashchange',queueApply);
})();
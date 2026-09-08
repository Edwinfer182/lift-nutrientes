(() => {
  'use strict';

  const DRIVE = 'https://drive.google.com/thumbnail?id=';
  const images = [
    { aliases:['iso xp 4lb','iso xp 4 lb'], id:'1jdppAiKKTQnLLJPJHSlq8kx3QQK7Qt6A' },
    { aliases:['iso xp 2lb','iso xp 2 lb'], id:'1j_4Kop2-VdRpCYSEAFn0pX5tKY5tr7RG' },
    { aliases:['protein crunch barra','protein crunch'], id:'15ZnZJzqrrqnc_Xsf2NF6UNnM5ant6z1K' },
    { aliases:['abe pump shot'], id:'1sKTJETT7aWuFNBaIJDzoVMxfG_f61me_' },
    { aliases:['abe all black everything 30serv','abe all black everything 30 serv','abe all black everything'], id:'1qHOpUobMsReVYQ1vhbJsBMTCO6rHy7Sm' },
    { aliases:['berberine 1000mg control de glucosa','berberine 1000 mg','berberine 1000mg'], id:'1KizWWgOrukNTtCDqYqZndhCmNBeWjnDl' },
    { aliases:['creatine 3000 30serv caps capsulas','creatine 3000 30serv caps','creatine 3000 30 serv caps'], id:'1HSzpa9mhUhDZWLc73DdeSDQvScji2UQt' },
    { aliases:['creatine monohydrate micronized 50serv','creatine monohydrate micronized 50 serv'], id:'16au9YOQBP6crGCz4xxLB2JA4-PtgYu4q' },
    { aliases:['beef xp clear 4lb','beef xp clear 4 lb'], id:'1saSZPU-Tj8TkseyclO_Q28QfA1jAMuWo' },
    { aliases:['gel endure naranja'], id:'1DgYrk0mT0h39WXRB7fN9vzXA5LoIb8Xw' },
    { aliases:['critical mass 12lb','critical mass 12 lb'], id:'1IpKtj-SJZ2aQgJXHbqOlmsmXbojkKHNA' },
    { aliases:['probiotic'], id:'1f7WroWPE5196eOwNhXmr_RCNzsM82ymr' },
    { aliases:['creatine + hydration','creatine hydration'], id:'1uDvwwZV5BVp-rXDdLwAHMet9brs_0PYT' },
    { aliases:['abe lata preentreno','abe lata de preentreno'], id:'1veJNyGCRt-oRPFXcJzU_WKxVKnQdwz4F' },
    { aliases:['critical whey 2lb','critical whey 2 lb'], id:'1tYhS_HCzQrtggvxdXMWgS7kOb_JskecC' },
    { aliases:['critical whey 4lb','critical whey 4 lb'], id:'1pG2iHSjmHcGCHrYLF5Lu8HlZcXxal84Z' }
  ];

  const norm = s => String(s || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g,'')
    .replace(/[^a-z0-9+]+/g,' ')
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
      if (!img || img.dataset.liftAppliedDriveId === match.id) return;
      img.dataset.liftAppliedDriveId = match.id;
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

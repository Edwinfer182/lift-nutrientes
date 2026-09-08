(() => {
  'use strict';

  const DRIVE = 'https://drive.google.com/thumbnail?id=';
  const images = [
    { name:'Applied Nutrition ISO XP 4 Lb', id:'1jdppAiKKTQnLLJPJHSlq8kx3QQK7Qt6A' },
    { name:'Applied Nutrition ISO XP 2 Lb', id:'1j_4Kop2-VdRpCYSEAFn0pX5tKY5tr7RG' },
    { name:'Applied Nutrition Protein Crunch', id:'15ZnZJzqrrqnc_Xsf2NF6UNnM5ant6z1K' },
    { name:'Applied Nutrition ABE Pump Shot', id:'1sKTJETT7aWuFNBaIJDzoVMxfG_f61me_' },
    { name:'Applied Nutrition ABE All Black Everything 30 Serv', id:'1qHOpUobMsReVYQ1vhbJsBMTCO6rHy7Sm' },
    { name:'Applied Nutrition Berberine 1000 Mg', id:'1KizWWgOrukNTtCDqYqZndhCmNBeWjnDl' },
    { name:'Applied Nutrition Creatine 3000 30 Serv Caps', id:'1HSzpa9mhUhDZWLc73DdeSDQvScji2UQt' },
    { name:'Applied Nutrition Creatine Monohydrate Micronized 50 Serv', id:'16au9YOQBP6crGCz4xxLB2JA4-PtgYu4q' },
    { name:'Applied Nutrition Beef XP Clear 4 Lb', id:'1saSZPU-Tj8TkseyclO_Q28QfA1jAMuWo' },
    { name:'Applied Nutrition Gel Endure Naranja', id:'1DgYrk0mT0h39WXRB7fN9vzXA5LoIb8Xw' },
    { name:'Applied Nutrition Critical Mass 12 Lb', id:'1IpKtj-SJZ2aQgJXHbqOlmsmXbojkKHNA' },
    { name:'Applied Nutrition Probiotic', id:'1f7WroWPE5196eOwNhXmr_RCNzsM82ymr' },
    { name:'Applied Nutrition Creatine + Hydration', id:'1uDvwwZV5BVp-rXDdLwAHMet9brs_0PYT' },
    { name:'Applied Nutrition ABE Lata Preentreno', id:'1veJNyGCRt-oRPFXcJzU_WKxVKnQdwz4F' },
    { name:'Applied Nutrition Critical Whey 2 Lb', id:'1tYhS_HCzQrtggvxdXMWgS7kOb_JskecC' },
    { name:'Applied Nutrition Critical Whey 4 Lb', id:'1pG2iHSjmHcGCHrYLF5Lu8HlZcXxal84Z' }
  ];

  const norm = s => String(s || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g,'')
    .replace(/[^a-z0-9+]+/g,' ')
    .replace(/\s+/g,' ')
    .trim();

  const entries = images.map(item => ({ ...item, key: norm(item.name) }));

  function findImage(text){
    const t = norm(text);
    let best = null;
    let bestLen = 0;
    for (const item of entries) {
      if (t.includes(item.key) && item.key.length > bestLen) {
        best = item;
        bestLen = item.key.length;
      }
    }
    return best;
  }

  function apply(){
    document.querySelectorAll('.card, [class*="product"], article').forEach(card => {
      const text = card.innerText || card.textContent || '';
      if (!norm(text).includes('applied nutrition')) return;
      const match = findImage(text);
      if (!match) return;
      const img = card.querySelector('.pic img, img');
      if (!img || img.dataset.liftAppliedDriveId === match.id) return;
      img.dataset.liftAppliedDriveId = match.id;
      img.loading = 'lazy';
      img.decoding = 'async';
      img.referrerPolicy = 'no-referrer';
      img.src = DRIVE + match.id + '&sz=w800';
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

(() => {
  'use strict';

  const DRIVE = 'https://drive.google.com/thumbnail?id=';
  const images = [
    { aliases:['blue ox pct 150 caps','enhanced athlete blue ox pct 150 caps'], id:'1I2lcOVpaFUJc_hw4kZhtgJ81aYpOq_8H' },
    { aliases:['black ox 240 caps','enhanced athlete black ox 240 caps'], id:'1oDvZTrvYCTZQsHArxo_r59-JM2BX3KM8' },
    { aliases:['phytoturk 60 caps 500 mg','enhanced athlete phytoturk 60 caps 500 mg'], id:'16I2hFRr6xckNotPVVnITc7XQTHIFpYD0' },
    { aliases:['arachidonic acid 120 caps','enhanced athlete arachidonic acid 120 caps'], id:'1H2eMzbAcgk8xprC3-8-5GCL5Ezkvba0T' },
    { aliases:['shred xt 60 caps','enhanced athlete shred xt 60 caps'], id:'1dp-xmkdL0E3HXcMzLahMFiz8PsmIIKZ9' },
    { aliases:['slin 120 caps','enhanced athlete slin 120 caps'], id:'1Jg6qabR7BqKyDlDArlGXmMf_L5aS_mxP' },
    { aliases:['cardarine gw501516 10 mg 60 caps','cardarine gw501516 10mg 60 caps','enhanced athlete cardarine gw501516 10 mg 60 caps'], id:'1rH3P_aLFJ4vbNONP2pDUdId963AXk6_Y' },
    { aliases:['growth hormone mk677 10 mg 60 caps','growth hormone mk677 10mg 60 caps','enhanced athlete growth hormone mk677 10 mg 60 caps'], id:'1yadXKg4ELBPM6H1-HdzFKBwMU1hhdDbk' },
    { aliases:['ligandrol lgd4033 5 mg 60 caps','ligandrol lgd4033 5mg 60 caps','enhanced athlete ligandrol lgd4033 5 mg 60 caps'], id:'1qbHyw5sjJ4-Zufwx_sdIsBwdT-La09D6' },
    { aliases:['ostamuscle mk2866 10 mg 60 caps','ostamuscle mk2866 10mg 60 caps','enhanced athlete ostamuscle mk2866 10 mg 60 caps'], id:'1_Auz2m2i6IWaZt_c0D3VtU4dsqlubKVj' },
    { aliases:['testolone rad140 10 mg 60 caps','testolone rad140 10mg 60 caps','enhanced athlete testolone rad140 10 mg 60 caps'], id:'1AtL-0IH3CXT-0ekIPo7rsjr0Le8Gq-KQ' },
    { aliases:['mutant yk11 60 caps 5 mg','mutant yk11 60 caps x 5mg','enhanced athlete mutant yk11 60 caps 5 mg'], id:'1vcne2T12m4Ozjuh_izbQe_tiiDpc8KJJ' },
    { aliases:['dark horse 60 caps','enhanced athlete dark horse 60 caps'], id:'1e4tawt7xwMbqMwhliW6Qd3WS0bO8LmYA' },
    { aliases:['superbeast 60 caps','enhanced athlete superbeast 60 caps'], id:'1uUSBoSEkbT9EseJmqCP_JBk5XEWFdfPI' },
    { aliases:['centaurus 60 caps','enhanced athlete centaurus 60 caps'], id:'1zNqmGlUouB3p9KCbU_jfK57fM07Eq5ae' },
    { aliases:['ostadrol 60 caps','enhanced athlete ostadrol 60 caps'], id:'1nRHp1MeqOjdoSlLHZR4W8lzxo28j_h7G' },
    { aliases:['tadalafil 10 mg 60 caps','enhanced tadalafil 10mg x 60 caps','enhanced athlete tadalafil 10 mg 60 caps'], id:'1bck561Fv47w14ppRWiIP527zhM9yepkx' }
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
      if (!img || img.dataset.liftEnhancedDriveId === match.id) return;
      img.dataset.liftEnhancedDriveId = match.id;
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
(() => {
  'use strict';

  const DRIVE='https://drive.google.com/thumbnail?id=';
  const BRAND='hi tech pharma';
  const images=[
    {aliases:['lipodrene'],id:'1xyWPMwGOBhWCdXCUF_lcZBucyRWjLW5N'},
    {aliases:['lipodrene xtreme'],id:'1I5wyjmNF_WL2zzj6uL10N2hCUsGlH2lO'},
    {aliases:['lipodrene hardcore'],id:'1Z37dxhu_f02ydYD2yAlV5yD6azIsImpU'},
    {aliases:['creatina hitech 400 g 80 serv','creatina hi tech 400 gr 80 serv','creatina hitech 400 gr 80 serv'],id:'1VZ0zmLXIGCB6yZgc7-UWfABCAcpRvH0X'},
    {aliases:['cafeina 100 caps','cafeína 100 caps'],id:'1KWBwdsuVk_LUyB81_HqETJW3HoymVtEI'},
    {aliases:['magnesium glycinate 120 caps 500 mg'],id:'1VQS3qtHNgtyBHYFeODJjRsC-vvuILUfL'},
    {aliases:['resveratrol 90 caps 500 mg'],id:'12A_H86wFkWU8_8xZTwSyilQdL8Ap8HCO'},
    {aliases:['nac 100 serv 600 mg','nac protector hepatico 100 porciones 600 mg'],id:'16vuDT1cGZQH4kfhPg7izQ6cLHUdI7wzK'}
  ];

  const norm=s=>String(s||'').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9]+/g,' ').replace(/\s+/g,' ').trim();
  const hasPhrase=(text,phrase)=>` ${norm(text)} `.includes(` ${norm(phrase)} `);

  function isHiTech(card){
    const brand=norm(card.dataset?.brand||card.dataset?.marca||'');
    return brand===BRAND;
  }

  function findImage(card){
    const name=norm(card.querySelector('.name')?.textContent||card.querySelector('[class*="name"]')?.textContent||'');
    const text=norm(card.innerText||card.textContent||'');
    let best=null,bestLen=0;
    for(const item of images){
      for(const alias of item.aliases){
        const a=norm(alias);
        const ok=name ? (name===a || name.startsWith(a+' ') || hasPhrase(name,a)) : hasPhrase(text,a);
        if(ok && a.length>bestLen){best=item;bestLen=a.length;}
      }
    }
    return best;
  }

  function apply(){
    document.querySelectorAll('.card,[class*="product-card"],article').forEach(card=>{
      if(card.closest('#liftProductOffcanvas')||!isHiTech(card)) return;
      const match=findImage(card);
      if(!match) return;
      const img=card.querySelector('.pic img,img');
      if(!img||img.dataset.liftHiTechDriveId===match.id) return;
      img.dataset.liftHiTechDriveId=match.id;
      img.loading='lazy';
      img.decoding='async';
      img.referrerPolicy='no-referrer';
      img.src=DRIVE+match.id+'&sz=w800';
      img.style.width='auto';
      img.style.height='auto';
      img.style.maxWidth='100%';
      img.style.maxHeight='100%';
      img.style.objectFit='contain';
      img.style.objectPosition='center';
    });
  }

  let queued=false;
  const queueApply=()=>{if(queued)return;queued=true;requestAnimationFrame(()=>{queued=false;apply();});};
  apply();
  new MutationObserver(queueApply).observe(document.documentElement,{childList:true,subtree:true,attributes:true,attributeFilter:['data-brand','data-marca']});
  window.addEventListener('hashchange',queueApply);
})();
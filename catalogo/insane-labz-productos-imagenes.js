(() => {
  'use strict';

  const DRIVE='https://drive.google.com/thumbnail?id=';
  const PRODUCTS=[
    {name:'Psychotic Black',presentation:'35 Serv',price:130000,id:'1ACva2ZaAdxgkiS9ZEd0MUUSkG5h5BT9e'},
    {name:'Psychotic Black',presentation:'60 Serv',price:165000,id:'1d6EpnMoclTqlZug_2XPEWpdNRCC3tQVQ'},
    {name:'Psychotic Gold',presentation:'35 Serv',price:160000,id:'15K-BQ8e0W3DTxh6ifeCEEXdoHmFszT7x'},
    {name:'Psychotic Gold',presentation:'60 Serv',price:195000,id:'1TUVGfgkV2URDzwNH18hzdebNVha6WKL9'},
    {name:'Psychotic Rojo',presentation:'35 Serv',price:160000,id:'1Dn5XYdDLLt23lWt8joqb82S_24Soao2d'},
    {name:'Psychotic Rojo',presentation:'60 Serv',price:199000,id:'1wShnIid5p0V1Yx9PSSv6MgNFOUVmP6tS'},
    {name:'Psychotic Saw',presentation:'30 Serv',price:166000,id:'1Qv2fYGpGEfUysMI_htcrCnD6Nb3EM8xV'},
    {name:'Psychotic Xtreme',presentation:'30 Serv',price:155000,id:'1yThfnm6QS1sQlC1ZVTf1Ek2uYa3xYFai'},
    {name:'Psychopath',presentation:'30 Serv',price:150000,id:'1a3Rn_rUNed_-HXh8m7Il8t-w1LUDWonk'}
  ];

  const norm=s=>String(s||'').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9]+/g,' ').replace(/\s+/g,' ').trim();
  const productKey=p=>norm(`${p.name} ${p.presentation}`);
  const image=id=>`${DRIVE}${id}&sz=w800`;
  const money=n=>'$'+Number(n).toLocaleString('es-CO');

  function allProductLike(){
    return [...document.querySelectorAll('body *')].filter(el=>{
      if(!el.querySelector('img')) return false;
      const t=norm(el.innerText||el.textContent||'');
      return (t.includes('psychotic')||t.includes('psychopath')) && /\$\s?[\d.]+/.test(el.innerText||el.textContent||'');
    });
  }

  function smallestCardForText(text){
    const target=norm(text);
    const hits=allProductLike().filter(el=>norm(el.innerText||el.textContent||'').includes(target));
    if(!hits.length) return null;
    hits.sort((a,b)=>(a.innerText||a.textContent||'').length-(b.innerText||b.textContent||'').length);
    return hits[0];
  }

  function findCard(p){
    return smallestCardForText(`${p.name} ${p.presentation}`);
  }

  function patch(card,p,manual=false){
    card.dataset.brand='Insane Labz';
    card.dataset.category='Pre Entreno';
    card.dataset.name=p.name;
    card.dataset.presentation=p.presentation;
    card.dataset.price=String(p.price);
    if(manual) card.dataset.liftManualInsane='1';

    const img=card.querySelector('img');
    if(img){
      img.src=image(p.id);
      img.alt=`${p.name} ${p.presentation} Insane Labz`;
      img.loading='lazy';
      img.decoding='async';
      img.referrerPolicy='no-referrer';
      img.style.objectFit='contain';
    }

    const leaves=[...card.querySelectorAll('*')].filter(x=>x.children.length===0);
    const title=leaves.find(x=>/psychotic|psychopath/i.test(x.textContent||''));
    if(title) title.textContent=`${p.name} ${p.presentation}`;
    const cat=leaves.find(x=>/pre\s*entreno/i.test(x.textContent||''));
    if(cat) cat.textContent='PRE ENTRENO';
    const price=leaves.find(x=>/^\s*\$\s?[\d.]+\s*$/.test(x.textContent||''));
    if(price) price.textContent=money(p.price);

    card.querySelectorAll('[data-name],[data-product],[data-product-name],[data-price]').forEach(x=>{
      if(x.hasAttribute('data-name')) x.setAttribute('data-name',p.name);
      if(x.hasAttribute('data-product')) x.setAttribute('data-product',`${p.name} ${p.presentation}`);
      if(x.hasAttribute('data-product-name')) x.setAttribute('data-product-name',`${p.name} ${p.presentation}`);
      if(x.hasAttribute('data-price')) x.setAttribute('data-price',String(p.price));
    });
  }

  function visibleOriginal(){
    return allProductLike().find(el=>!el.dataset.liftManualInsane && getComputedStyle(el).display!=='none' && el.getClientRects().length>0) || null;
  }

  function template(){
    const current=visibleOriginal();
    if(current) return current;
    const list=allProductLike().filter(el=>!el.dataset.liftManualInsane);
    list.sort((a,b)=>(a.innerText||'').length-(b.innerText||'').length);
    return list[0]||null;
  }

  function ensure(){
    const base=template();
    if(!base||!base.parentElement) return;
    const grid=base.parentElement;

    PRODUCTS.forEach(p=>{
      const existing=findCard(p);
      if(existing){ patch(existing,p,existing.dataset.liftManualInsane==='1'); return; }
      const clone=base.cloneNode(true);
      clone.removeAttribute('id');
      patch(clone,p,true);
      clone.style.removeProperty('display');
      clone.style.removeProperty('visibility');
      grid.appendChild(clone);
    });

    const insaneIsVisible=!!visibleOriginal();
    document.querySelectorAll('[data-lift-manual-insane="1"]').forEach(card=>{
      if(insaneIsVisible){
        card.style.setProperty('display','', 'important');
        card.style.setProperty('visibility','visible','important');
        card.style.setProperty('opacity','1','important');
      }else{
        card.style.setProperty('display','none','important');
      }
    });
  }

  let queued=false;
  const queue=()=>{
    if(queued) return;
    queued=true;
    requestAnimationFrame(()=>{queued=false;ensure();});
  };

  ensure();
  new MutationObserver(queue).observe(document.documentElement,{childList:true,subtree:true,attributes:true,attributeFilter:['style','class']});
  document.addEventListener('click',()=>setTimeout(ensure,120),true);
  document.addEventListener('input',()=>setTimeout(ensure,120),true);
  window.addEventListener('hashchange',()=>setTimeout(ensure,120));
  setInterval(ensure,700);
})();
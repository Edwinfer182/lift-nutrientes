(() => {
  'use strict';
  const DRIVE='https://drive.google.com/thumbnail?id=';
  const SPECS=[
    {id:'insane-psychotic-black-35',name:'Psychotic Black',presentation:'35 Serv',brand:'Insane Labz',category:'Pre Entreno',price:130000,file:'1ACva2ZaAdxgkiS9ZEd0MUUSkG5h5BT9e'},
    {id:'insane-psychotic-black-60',name:'Psychotic Black',presentation:'60 Serv',brand:'Insane Labz',category:'Pre Entreno',price:165000,file:'1d6EpnMoclTqlZug_2XPEWpdNRCC3tQVQ'},
    {id:'insane-psychotic-gold-35',name:'Psychotic Gold',presentation:'35 Serv',brand:'Insane Labz',category:'Pre Entreno',price:160000,file:'15K-BQ8e0W3DTxh6ifeCEEXdoHmFszT7x'},
    {id:'insane-psychotic-gold-60',name:'Psychotic Gold',presentation:'60 Serv',brand:'Insane Labz',category:'Pre Entreno',price:195000,file:'1TUVGfgkV2URDzwNH18hzdebNVha6WKL9'},
    {id:'insane-psychotic-rojo-35',name:'Psychotic Rojo',presentation:'35 Serv',brand:'Insane Labz',category:'Pre Entreno',price:160000,file:'1Dn5XYdDLLt23lWt8joqb82S_24Soao2d'},
    {id:'insane-psychotic-rojo-60',name:'Psychotic Rojo',presentation:'60 Serv',brand:'Insane Labz',category:'Pre Entreno',price:199000,file:'1wShnIid5p0V1Yx9PSSv6MgNFOUVmP6tS'},
    {id:'insane-psychotic-saw-35',name:'Psychotic Saw',presentation:'35 Serv',brand:'Insane Labz',category:'Pre Entreno',price:166000,file:'1Qv2fYGpGEfUysMI_htcrCnD6Nb3EM8xV'},
    {id:'insane-psychotic-xtreme-30',name:'Psychotic Xtreme',presentation:'30 Serv',brand:'Insane Labz',category:'Pre Entreno',price:155000,file:'1yThfnm6QS1sQlC1ZVTf1Ek2uYa3xYFai'},
    {id:'insane-psychopath-30',name:'Psychopath',presentation:'30 Serv',brand:'Insane Labz',category:'Pre Entreno',price:150000,file:'1a3Rn_rUNed_-HXh8m7Il8t-w1LUDWonk'}
  ];
  const norm=s=>String(s||'').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9]+/g,' ').replace(/\s+/g,' ').trim();
  const list=[window.PRODUCTS,window.products,window.catalogProducts,window.CATALOG_PRODUCTS].find(Array.isArray);
  if(list){
    for(const s of SPECS){
      const key=norm(`${s.name} ${s.presentation}`);
      let p=list.find(x=>norm(`${x.name||x.nombre||''} ${x.presentation||x.presentacion||''}`).includes(key) && norm(x.brand||x.marca||'').includes('insane labz'));
      if(!p){
        p=list.find(x=>norm(`${x.name||x.nombre||''} ${x.presentation||x.presentacion||''}`).includes(norm(s.name)) && norm(x.brand||x.marca||'').includes('insane labz') && norm(`${x.name||x.nombre||''} ${x.presentation||x.presentacion||''}`).includes(norm(s.presentation)));
      }
      const image=DRIVE+s.file+'&sz=w800';
      if(p){
        p.name=s.name; p.nombre=s.name;
        p.presentation=s.presentation; p.presentacion=s.presentation;
        p.brand=s.brand; p.marca=s.brand;
        p.category=s.category; p.categoria=s.category;
        p.price=s.price; p.precio=s.price;
        p.image=image; p.imagen=image;
      } else {
        list.push({...s,image,imagen:image,precio:s.price,marca:s.brand,categoria:s.category,presentacion:s.presentation});
      }
    }
  }
  function patchVisible(){
    const cards=[...document.querySelectorAll('.card,[class*="product-card"],article')];
    for(const s of SPECS){
      const key=norm(`${s.name} ${s.presentation}`);
      const card=cards.find(c=>norm(c.innerText||c.textContent||'').includes(key));
      if(!card) continue;
      const img=card.querySelector('.pic img,img');
      if(img){img.src=DRIVE+s.file+'&sz=w800';img.loading='lazy';img.decoding='async';img.referrerPolicy='no-referrer';img.style.objectFit='contain';}
      const els=[...card.querySelectorAll('*')];
      const price=els.find(x=>/^\$\s?[\d.]+$/.test((x.textContent||'').trim()));
      if(price) price.textContent='$ '+s.price.toLocaleString('es-CO');
    }
    [...document.querySelectorAll('*')].forEach(x=>{
      const t=norm(x.textContent||'');
      if(t==='insane labz 5'||t==='insane labz 9'){
        const nums=[...x.querySelectorAll('*')].filter(y=>/^\d+$/.test((y.textContent||'').trim()));
        if(nums.length) nums[nums.length-1].textContent='9';
      }
    });
  }
  patchVisible();
  document.addEventListener('click',()=>setTimeout(patchVisible,120),true);
  new MutationObserver(()=>requestAnimationFrame(patchVisible)).observe(document.documentElement,{childList:true,subtree:true});
})();
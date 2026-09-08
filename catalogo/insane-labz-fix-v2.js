(() => {
  const D='https://drive.google.com/thumbnail?id=';
  const P=[
    ['Psychotic Black','35 Serv',130000,'1ACva2ZaAdxgkiS9ZEd0MUUSkG5h5BT9e'],
    ['Psychotic Black','60 Serv',165000,'1d6EpnMoclTqlZug_2XPEWpdNRCC3tQVQ'],
    ['Psychotic Gold','35 Serv',160000,'15K-BQ8e0W3DTxh6ifeCEEXdoHmFszT7x'],
    ['Psychotic Gold','60 Serv',195000,'1TUVGfgkV2URDzwNH18hzdebNVha6WKL9'],
    ['Psychotic Rojo','35 Serv',160000,'1Dn5XYdDLLt23lWt8joqb82S_24Soao2d'],
    ['Psychotic Rojo','60 Serv',199000,'1wShnIid5p0V1Yx9PSSv6MgNFOUVmP6tS'],
    ['Psychotic Saw','30 Serv',166000,'1Qv2fYGpGEfUysMI_htcrCnD6Nb3EM8xV'],
    ['Psychotic Xtreme','30 Serv',155000,'1yThfnm6QS1sQlC1ZVTf1Ek2uYa3xYFai'],
    ['Psychopath','30 Serv',150000,'1a3Rn_rUNed_-HXh8m7Il8t-w1LUDWonk']
  ];
  const n=s=>String(s||'').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9]+/g,' ').trim();
  const cards=()=>[...document.querySelectorAll('.card,[class*="product-card"],article')].filter(x=>x.querySelector('img'));
  const find=p=>cards().find(c=>n(c.innerText).includes(n(p[0]))&&n(c.innerText).includes(n(p[1])))||null;
  const patch=(c,p)=>{if(!c)return;const i=c.querySelector('img');if(i)i.src=D+p[3]+'&sz=w800';[...c.querySelectorAll('*')].forEach(x=>{const t=(x.textContent||'').trim();if(x.children.length===0&&/psychotic|psychopath/i.test(t))x.textContent=p[0]+' '+p[1];if(/^\$\s?[\d.]+$/.test(t))x.textContent='$ '+p[2].toLocaleString('es-CO');});};
  function active(){const v=cards().filter(c=>getComputedStyle(c).display!=='none');return v.length>=3&&v.every(c=>/psychotic|psychopath/i.test(c.innerText||''));}
  function run(){P.forEach(p=>patch(find(p),p));[...document.querySelectorAll('*')].forEach(x=>{if(n(x.textContent).startsWith('insane labz')){const z=[...x.querySelectorAll('*')].find(y=>/^\d+$/.test((y.textContent||'').trim()));if(z)z.textContent='9';}});if(!active())return;const v=cards().filter(c=>getComputedStyle(c).display!=='none');const t=v[0],g=t&&t.parentElement;if(!t||!g)return;P.forEach(p=>{if(find(p))return;const c=t.cloneNode(true);[...c.querySelectorAll('*')].forEach(x=>{const s=(x.textContent||'').trim();if(x.children.length===0&&/psychotic|psychopath/i.test(s))x.textContent=p[0]+' '+p[1];if(/^\$\s?[\d.]+$/.test(s))x.textContent='$ '+p[2].toLocaleString('es-CO');});const i=c.querySelector('img');if(i)i.src=D+p[3]+'&sz=w800';g.appendChild(c);});const k=[...document.querySelectorAll('*')].find(x=>/^\d+ productos encontrados$/i.test((x.textContent||'').trim()));if(k)k.textContent='9 productos encontrados';}
  document.addEventListener('click',()=>setTimeout(run,80),true);new MutationObserver(run).observe(document.documentElement,{childList:true,subtree:true});run();
})();
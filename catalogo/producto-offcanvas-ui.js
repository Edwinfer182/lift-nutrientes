(() => {
  'use strict';
  if (document.getElementById('liftProductOffcanvasStyles')) return;

  const style=document.createElement('style');
  style.id='liftProductOffcanvasStyles';
  style.textContent=`
    .card,[class*="product-card"]{transition:transform .22s ease,box-shadow .22s ease!important;cursor:pointer;will-change:transform}
    .card:hover,[class*="product-card"]:hover{transform:translateY(-5px) scale(1.015);box-shadow:0 12px 28px rgba(0,0,0,.14)!important;z-index:2}
    .card .pic img,[class*="product-card"] img{transition:transform .28s ease!important}
    .card:hover .pic img,[class*="product-card"]:hover img{transform:scale(1.045)}
    #liftProductBackdrop{position:fixed;inset:0;background:rgba(0,0,0,.48);opacity:0;visibility:hidden;transition:.25s;z-index:9998;backdrop-filter:blur(3px)}
    #liftProductBackdrop.open{opacity:1;visibility:visible}
    #liftProductOffcanvas{position:fixed;left:50%;top:50%;width:min(1120px,92vw);max-height:90dvh;background:#fff;border-radius:20px;transform:translate(-50%,-46%) scale(.96);opacity:0;visibility:hidden;transition:transform .28s cubic-bezier(.2,.8,.2,1),opacity .22s;z-index:9999;box-shadow:0 28px 80px rgba(0,0,0,.28);overflow:hidden;display:flex;flex-direction:column}
    #liftProductOffcanvas.open{transform:translate(-50%,-50%) scale(1);opacity:1;visibility:visible}
    .lift-product-panel-head{position:absolute;top:12px;right:14px;z-index:8}.lift-product-panel-head strong{display:none}
    #liftProductClose{width:42px;height:42px;border-radius:50%;border:1px solid #e2e2e2;background:#fff;font-size:26px;cursor:pointer;display:flex;align-items:center;justify-content:center;box-shadow:0 4px 14px rgba(0,0,0,.09)}
    #liftProductPanelBody{padding:32px;overflow:auto}
    .lift-product-layout{display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1fr);gap:42px;align-items:center}
    .lift-image-area{position:relative;min-width:0}
    .lift-preview-image{height:520px;display:flex;align-items:center;justify-content:center;background:#fff;overflow:hidden;padding:18px;box-sizing:border-box;cursor:zoom-in;position:relative}
    .lift-preview-image>img{max-width:100%;max-height:100%;width:auto;height:auto;object-fit:contain;display:block}
    .lift-zoom-hint{position:absolute;bottom:10px;left:50%;transform:translateX(-50%);background:rgba(17,17,17,.76);color:#fff;border-radius:18px;padding:7px 12px;font-size:12px;pointer-events:none;opacity:0;transition:opacity .2s}.lift-preview-image:hover .lift-zoom-hint{opacity:1}
    .lift-zoom-pane{position:absolute;inset:10px;z-index:5;background:#fff no-repeat;border:1px solid #eee;border-radius:12px;box-shadow:0 10px 30px rgba(0,0,0,.14);opacity:0;visibility:hidden;pointer-events:none;transition:opacity .12s;background-size:220%}.lift-zoom-pane.active{opacity:1;visibility:visible}
    .lift-preview-info{min-width:0;padding:18px 10px 18px 0}.lift-preview-brand{font-size:13px;letter-spacing:.12em;text-transform:uppercase;color:#888;margin-bottom:9px;font-weight:700}.lift-preview-title{font-size:clamp(28px,3vw,43px);line-height:1.06;font-weight:750;margin:0 0 13px;color:#151515}.lift-preview-presentation{font-size:15px;color:#666;margin:-3px 0 16px}.lift-preview-price{font-size:30px;font-weight:800;margin:0 0 13px}.lift-stock{display:inline-flex;align-items:center;gap:7px;font-size:14px;font-weight:700;margin-bottom:18px}.lift-stock-dot{width:8px;height:8px;border-radius:50%;background:#1d9b55}.lift-preview-divider{height:1px;background:#e8e8e8;margin:4px 0 20px}.lift-preview-actions{margin:0 0 20px}.lift-preview-actions button,.lift-preview-actions a{width:100%!important;min-height:54px;border-radius:28px!important;font-size:16px!important;font-weight:700!important;display:flex!important;align-items:center;justify-content:center;text-decoration:none}.lift-info-block{border-top:1px solid #e8e8e8;padding:17px 0;font-size:14px;line-height:1.55;color:#555}.lift-info-row{display:flex;gap:10px;margin:6px 0}.lift-info-icon{width:22px;flex:0 0 22px;font-size:17px}.lift-info-label{font-weight:700;color:#222}.lift-category{display:inline-block;background:#f4f4f4;border-radius:18px;padding:7px 12px;color:#333;font-weight:650}.lift-shipping-note{font-size:13px;color:#777;margin-top:8px}body.lift-offcanvas-open{overflow:hidden!important}
    @media(max-width:760px){.card:hover,[class*="product-card"]:hover{transform:none;box-shadow:inherit!important}#liftProductOffcanvas{width:94vw;max-height:94dvh;border-radius:16px}#liftProductPanelBody{padding:22px 18px 24px}.lift-product-layout{grid-template-columns:1fr;gap:8px}.lift-preview-image{height:300px;padding:8px;cursor:zoom-in}.lift-preview-title{font-size:27px}.lift-preview-price{font-size:25px}.lift-preview-info{padding:0}.lift-zoom-hint{opacity:1}.lift-zoom-pane{inset:0;background-size:240%}}
    @media(prefers-reduced-motion:reduce){.card,[class*="product-card"],#liftProductBackdrop,#liftProductOffcanvas{transition:none!important}}
  `;
  document.head.appendChild(style);

  const backdrop=document.createElement('div');backdrop.id='liftProductBackdrop';
  const panel=document.createElement('aside');panel.id='liftProductOffcanvas';panel.setAttribute('aria-hidden','true');panel.innerHTML=`<div class="lift-product-panel-head"><strong>Detalle</strong><button id="liftProductClose" type="button" aria-label="Cerrar">×</button></div><div id="liftProductPanelBody"></div>`;
  document.body.append(backdrop,panel);
  const body=panel.querySelector('#liftProductPanelBody'),closeBtn=panel.querySelector('#liftProductClose');
  const isInteractive=el=>!!el.closest('button,a,input,select,textarea,label,[role="button"]');
  const getCard=target=>target.closest('.card,[class*="product-card"]');
  const firstText=(card,selectors)=>{for(const s of selectors){const t=card.querySelector(s)?.textContent?.trim();if(t)return t}return''};
  const esc=s=>String(s||'').replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));

  function inferCategory(card){
    const explicit=firstText(card,['.category','.categoria','[class*="category"]','[data-category]']);
    if(explicit)return explicit;
    const text=(card.textContent||'').toLowerCase();
    const rules=[['Creatina',['creatina','creatine','creapure']],['Proteína aislada / limpia',['iso xp','iso100','isolate','isopure','aislada']],['Proteína Whey',['whey','protein']],['Ganador de masa',['mass','gainer','ganador']],['Pre entreno',['pre entreno','preentreno','pre-workout','pre workout']],['Aminoácidos',['bcaa','amino']],['EAA',['eaa']],['Glutamina',['glutamina','glutamine']],['Omega 3',['omega 3','fish oil']],['Colágeno',['colageno','collagen']],['Magnesio',['magnesio','magnesium']]];
    for(const [cat,terms] of rules)if(terms.some(x=>text.includes(x)))return cat;
    return 'Suplementos';
  }

  function inferPresentation(title){
    const matches=String(title||'').match(/\b(?:\d+(?:[.,]\d+)?\s?(?:kg|g|gr|lb|lbs|ml)|\d+\s?(?:serv|servicios|caps|capsulas|cápsulas|tabletas))\b/gi);
    return matches?[...new Set(matches)].join(' · '):'';
  }

  function setupZoom(wrap,img){
    const zoom=document.createElement('div');zoom.className='lift-zoom-pane';zoom.style.backgroundImage=`url("${img.src.replace(/"/g,'%22')}")`;wrap.appendChild(zoom);
    const hint=document.createElement('div');hint.className='lift-zoom-hint';hint.textContent=matchMedia('(hover:hover)').matches?'Mueve el cursor para ampliar':'Toca para ampliar';wrap.appendChild(hint);
    const move=e=>{const r=wrap.getBoundingClientRect();const p=e.touches?e.touches[0]:e;let x=(p.clientX-r.left)/r.width*100,y=(p.clientY-r.top)/r.height*100;x=Math.max(0,Math.min(100,x));y=Math.max(0,Math.min(100,y));zoom.style.backgroundPosition=`${x}% ${y}%`};
    if(matchMedia('(hover:hover)').matches){wrap.addEventListener('mouseenter',()=>zoom.classList.add('active'));wrap.addEventListener('mousemove',move);wrap.addEventListener('mouseleave',()=>zoom.classList.remove('active'))}
    else{wrap.addEventListener('click',e=>{e.stopPropagation();zoom.classList.toggle('active');move(e)});wrap.addEventListener('touchmove',e=>{if(zoom.classList.contains('active'))move(e)},{passive:true})}
  }

  function openCard(card){
    if(!card)return;
    const sourceImg=card.querySelector('.pic img,img');
    const title=firstText(card,['.name','.title','.product-name','h3','h4'])||'Producto';
    const price=firstText(card,['.price','.precio','[class*="price"]']);
    const brand=firstText(card,['.brand','.marca','[class*="brand"]']);
    const category=inferCategory(card);
    const presentation=inferPresentation(title);
    const actionSource=[...card.querySelectorAll('button,a')].find(el=>/comprar|agregar|carrito/i.test(el.textContent||''));
    body.innerHTML='';
    const layout=document.createElement('div');layout.className='lift-product-layout';
    const imageArea=document.createElement('div');imageArea.className='lift-image-area';
    const imageWrap=document.createElement('div');imageWrap.className='lift-preview-image';
    if(sourceImg?.src){const img=document.createElement('img');img.src=sourceImg.src;img.alt=sourceImg.alt||title;img.loading='eager';img.decoding='async';imageWrap.appendChild(img);img.addEventListener('load',()=>setupZoom(imageWrap,img),{once:true});if(img.complete)setupZoom(imageWrap,img)}
    imageArea.appendChild(imageWrap);
    const info=document.createElement('div');info.className='lift-preview-info';
    info.innerHTML=`<div class="lift-preview-brand">${esc(brand)}</div><h2 class="lift-preview-title">${esc(title)}</h2>${presentation?`<div class="lift-preview-presentation">${esc(presentation)}</div>`:''}<div class="lift-preview-price">${esc(price)}</div><div class="lift-stock"><span class="lift-stock-dot"></span>Disponible</div><div class="lift-preview-divider"></div><div class="lift-preview-actions"></div><div class="lift-info-block"><div class="lift-info-row"><span class="lift-info-icon">🚚</span><div><span class="lift-info-label">Entrega</span><br>Medellín: mismo día para pedidos confirmados antes de las 2:00 p. m.<br>Nacional: 1–3 días hábiles.</div></div><div class="lift-shipping-note">El valor del envío se calcula según la cantidad de productos y la ciudad.</div></div><div class="lift-info-block"><span class="lift-info-label">Categoría:</span> <span class="lift-category">${esc(category)}</span></div>`;
    const actions=info.querySelector('.lift-preview-actions');
    if(actionSource){const action=actionSource.cloneNode(true);action.addEventListener('click',e=>{e.preventDefault();e.stopPropagation();actionSource.click();closePanel()});actions.appendChild(action)}
    layout.append(imageArea,info);body.appendChild(layout);
    panel.classList.add('open');backdrop.classList.add('open');panel.setAttribute('aria-hidden','false');document.body.classList.add('lift-offcanvas-open');
  }
  function closePanel(){panel.classList.remove('open');backdrop.classList.remove('open');panel.setAttribute('aria-hidden','true');document.body.classList.remove('lift-offcanvas-open')}
  document.addEventListener('click',e=>{if(panel.contains(e.target))return;const card=getCard(e.target);if(!card||isInteractive(e.target))return;openCard(card)});
  closeBtn.addEventListener('click',closePanel);backdrop.addEventListener('click',closePanel);document.addEventListener('keydown',e=>{if(e.key==='Escape'&&panel.classList.contains('open'))closePanel()});
})();
(() => {
  'use strict';

  if (document.getElementById('liftProductOffcanvasStyles')) return;

  const style = document.createElement('style');
  style.id = 'liftProductOffcanvasStyles';
  style.textContent = `
    .card, [class*="product-card"]{
      transition: transform .22s ease, box-shadow .22s ease, border-color .22s ease !important;
      cursor: pointer;
      will-change: transform;
    }
    .card:hover, [class*="product-card"]:hover{
      transform: translateY(-5px) scale(1.015);
      box-shadow: 0 12px 28px rgba(0,0,0,.14) !important;
      z-index: 2;
    }
    .card .pic img, [class*="product-card"] img{
      transition: transform .28s ease !important;
    }
    .card:hover .pic img, [class*="product-card"]:hover img{
      transform: scale(1.045);
    }
    #liftProductBackdrop{
      position:fixed;
      inset:0;
      background:rgba(0,0,0,.48);
      opacity:0;
      visibility:hidden;
      transition:opacity .25s ease, visibility .25s ease;
      z-index:9998;
      backdrop-filter:blur(3px);
    }
    #liftProductBackdrop.open{opacity:1;visibility:visible;}
    #liftProductOffcanvas{
      position:fixed;
      left:50%;
      top:50%;
      width:min(1120px,92vw);
      max-height:88dvh;
      background:#fff;
      border-radius:20px;
      transform:translate(-50%,-46%) scale(.96);
      opacity:0;
      visibility:hidden;
      transition:transform .28s cubic-bezier(.2,.8,.2,1), opacity .22s ease, visibility .22s ease;
      z-index:9999;
      box-shadow:0 28px 80px rgba(0,0,0,.28);
      overflow:hidden;
      display:flex;
      flex-direction:column;
    }
    #liftProductOffcanvas.open{
      transform:translate(-50%,-50%) scale(1);
      opacity:1;
      visibility:visible;
    }
    .lift-product-panel-head{
      display:flex;
      align-items:center;
      justify-content:flex-end;
      padding:12px 14px 0;
      flex:0 0 auto;
      position:absolute;
      top:0;
      right:0;
      z-index:3;
    }
    .lift-product-panel-head strong{display:none;}
    #liftProductClose{
      width:42px;
      height:42px;
      border-radius:50%;
      border:1px solid #e2e2e2;
      background:#fff;
      font-size:26px;
      line-height:1;
      cursor:pointer;
      display:flex;
      align-items:center;
      justify-content:center;
      box-shadow:0 4px 14px rgba(0,0,0,.09);
    }
    #liftProductPanelBody{
      padding:32px;
      overflow:auto;
      flex:1 1 auto;
    }
    .lift-product-layout{
      display:grid;
      grid-template-columns:minmax(0,1fr) minmax(0,1fr);
      gap:42px;
      align-items:center;
    }
    #liftProductPanelBody .lift-preview-image{
      min-height:480px;
      display:flex;
      align-items:center;
      justify-content:center;
      border-radius:16px;
      background:#fff;
      overflow:hidden;
      padding:20px;
      box-sizing:border-box;
    }
    #liftProductPanelBody .lift-preview-image img{
      max-width:100%;
      max-height:520px;
      width:auto;
      height:auto;
      object-fit:contain;
      display:block;
    }
    .lift-preview-info{
      min-width:0;
      padding:18px 10px 18px 0;
    }
    .lift-preview-brand{
      font-size:13px;
      letter-spacing:.12em;
      text-transform:uppercase;
      color:#8c8c8c;
      margin-bottom:10px;
      min-height:18px;
    }
    .lift-preview-title{
      font-size:clamp(28px,3vw,44px);
      line-height:1.05;
      font-weight:700;
      margin:0 0 18px;
      color:#151515;
    }
    .lift-preview-price{
      font-size:30px;
      line-height:1;
      font-weight:800;
      margin:0 0 24px;
      color:#111;
    }
    .lift-preview-divider{
      height:1px;
      background:#e8e8e8;
      margin:18px 0 24px;
    }
    .lift-preview-description{
      font-size:16px;
      line-height:1.6;
      color:#555;
      margin-bottom:24px;
    }
    .lift-preview-actions{
      margin-top:26px;
    }
    .lift-preview-actions button,
    .lift-preview-actions a{
      width:100% !important;
      min-height:54px;
      border-radius:28px !important;
      font-size:16px !important;
      font-weight:700 !important;
      display:flex !important;
      align-items:center;
      justify-content:center;
      text-decoration:none;
    }
    .lift-preview-meta{
      margin-top:22px;
      padding-top:18px;
      border-top:1px solid #e8e8e8;
      font-size:14px;
      color:#666;
      line-height:1.55;
    }
    body.lift-offcanvas-open{overflow:hidden !important;}
    @media(max-width:760px){
      .card:hover, [class*="product-card"]:hover{
        transform:none;
        box-shadow:inherit !important;
      }
      #liftProductOffcanvas{
        width:94vw;
        max-height:92dvh;
        border-radius:16px;
      }
      #liftProductPanelBody{padding:22px 18px 24px;}
      .lift-product-layout{grid-template-columns:1fr;gap:14px;}
      #liftProductPanelBody .lift-preview-image{min-height:270px;padding:8px;}
      #liftProductPanelBody .lift-preview-image img{max-height:300px;}
      .lift-preview-info{padding:0;}
      .lift-preview-title{font-size:28px;margin-bottom:12px;}
      .lift-preview-price{font-size:25px;margin-bottom:16px;}
    }
    @media (prefers-reduced-motion: reduce){
      .card, [class*="product-card"], .card .pic img, [class*="product-card"] img,
      #liftProductBackdrop, #liftProductOffcanvas{transition:none !important;}
    }
  `;
  document.head.appendChild(style);

  const backdrop = document.createElement('div');
  backdrop.id = 'liftProductBackdrop';

  const panel = document.createElement('aside');
  panel.id = 'liftProductOffcanvas';
  panel.setAttribute('aria-hidden', 'true');
  panel.innerHTML = `
    <div class="lift-product-panel-head">
      <strong>Detalle del producto</strong>
      <button id="liftProductClose" type="button" aria-label="Cerrar">×</button>
    </div>
    <div id="liftProductPanelBody"></div>
  `;

  document.body.append(backdrop, panel);

  const body = panel.querySelector('#liftProductPanelBody');
  const closeBtn = panel.querySelector('#liftProductClose');
  const isInteractive = el => !!el.closest('button, a, input, select, textarea, label, [role="button"]');

  function getCard(target){
    return target.closest('.card, [class*="product-card"]');
  }

  function firstText(card, selectors){
    for (const selector of selectors){
      const el = card.querySelector(selector);
      const text = el?.textContent?.trim();
      if (text) return text;
    }
    return '';
  }

  function openCard(card){
    if (!card) return;

    const sourceImg = card.querySelector('.pic img, img');
    const title = firstText(card, ['.name','.title','.product-name','h3','h4']);
    const price = firstText(card, ['.price','.precio','[class*="price"]']);
    const brand = firstText(card, ['.brand','.marca','[class*="brand"]']);
    const description = firstText(card, ['.description','.descripcion','[class*="description"]']);
    const actionSource = [...card.querySelectorAll('button,a')].find(el => /comprar|agregar|carrito/i.test(el.textContent || ''));

    body.innerHTML = '';
    const layout = document.createElement('div');
    layout.className = 'lift-product-layout';

    const imageWrap = document.createElement('div');
    imageWrap.className = 'lift-preview-image';
    if (sourceImg?.src) {
      const img = document.createElement('img');
      img.src = sourceImg.src;
      img.alt = sourceImg.alt || title || '';
      img.loading = 'eager';
      img.decoding = 'async';
      imageWrap.appendChild(img);
    }

    const info = document.createElement('div');
    info.className = 'lift-preview-info';
    info.innerHTML = `
      <div class="lift-preview-brand">${brand || ''}</div>
      <h2 class="lift-preview-title">${title || 'Producto'}</h2>
      <div class="lift-preview-price">${price || ''}</div>
      <div class="lift-preview-divider"></div>
      ${description ? `<div class="lift-preview-description">${description}</div>` : ''}
      <div class="lift-preview-actions"></div>
      <div class="lift-preview-meta">Producto disponible en el catálogo Lift Nutrientes.</div>
    `;

    const actions = info.querySelector('.lift-preview-actions');
    if (actionSource) {
      const action = actionSource.cloneNode(true);
      action.addEventListener('click', e => {
        e.preventDefault();
        e.stopPropagation();
        actionSource.click();
        closePanel();
      });
      actions.appendChild(action);
    }

    layout.append(imageWrap, info);
    body.appendChild(layout);

    panel.classList.add('open');
    backdrop.classList.add('open');
    panel.setAttribute('aria-hidden', 'false');
    document.body.classList.add('lift-offcanvas-open');
  }

  function closePanel(){
    panel.classList.remove('open');
    backdrop.classList.remove('open');
    panel.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('lift-offcanvas-open');
  }

  document.addEventListener('click', e => {
    if (panel.contains(e.target)) return;
    const card = getCard(e.target);
    if (!card || isInteractive(e.target)) return;
    openCard(card);
  });

  closeBtn.addEventListener('click', closePanel);
  backdrop.addEventListener('click', closePanel);
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && panel.classList.contains('open')) closePanel();
  });
})();

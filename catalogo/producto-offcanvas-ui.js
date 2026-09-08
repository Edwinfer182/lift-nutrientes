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
      position: fixed;
      inset: 0;
      background: rgba(0,0,0,.38);
      opacity: 0;
      visibility: hidden;
      transition: opacity .25s ease, visibility .25s ease;
      z-index: 9998;
      backdrop-filter: blur(2px);
    }
    #liftProductBackdrop.open{
      opacity: 1;
      visibility: visible;
    }
    #liftProductOffcanvas{
      position: fixed;
      top: 0;
      right: 0;
      width: min(440px, 92vw);
      height: 100dvh;
      background: #fff;
      transform: translateX(105%);
      transition: transform .3s cubic-bezier(.2,.8,.2,1);
      z-index: 9999;
      box-shadow: -14px 0 35px rgba(0,0,0,.18);
      display: flex;
      flex-direction: column;
      overflow: hidden;
    }
    #liftProductOffcanvas.open{
      transform: translateX(0);
    }
    .lift-product-panel-head{
      display:flex;
      align-items:center;
      justify-content:space-between;
      padding:16px 18px;
      border-bottom:1px solid #e9e9e9;
      flex:0 0 auto;
    }
    .lift-product-panel-head strong{
      font-size:16px;
    }
    #liftProductClose{
      width:38px;
      height:38px;
      border-radius:50%;
      border:1px solid #ddd;
      background:#fff;
      font-size:24px;
      line-height:1;
      cursor:pointer;
      display:flex;
      align-items:center;
      justify-content:center;
    }
    #liftProductPanelBody{
      padding:18px;
      overflow:auto;
      flex:1 1 auto;
    }
    #liftProductPanelBody .lift-preview-image{
      height:300px;
      display:flex;
      align-items:center;
      justify-content:center;
      margin-bottom:18px;
      border-radius:14px;
      background:#fafafa;
      overflow:hidden;
    }
    #liftProductPanelBody .lift-preview-image img{
      max-width:100%;
      max-height:100%;
      width:auto;
      height:auto;
      object-fit:contain;
      display:block;
    }
    #liftProductPanelBody .lift-preview-content{
      font-size:15px;
      line-height:1.45;
    }
    #liftProductPanelBody .lift-preview-content button,
    #liftProductPanelBody .lift-preview-content a{
      cursor:pointer;
    }
    body.lift-offcanvas-open{
      overflow:hidden !important;
    }
    @media(max-width:760px){
      .card:hover, [class*="product-card"]:hover{
        transform:none;
        box-shadow:inherit !important;
      }
      #liftProductOffcanvas{
        width:100vw;
      }
      #liftProductPanelBody .lift-preview-image{
        height:260px;
      }
    }
    @media (prefers-reduced-motion: reduce){
      .card, [class*="product-card"], .card .pic img, [class*="product-card"] img,
      #liftProductBackdrop, #liftProductOffcanvas{
        transition:none !important;
      }
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

  function openCard(card){
    if (!card) return;

    const sourceImg = card.querySelector('.pic img, img');
    const clone = card.cloneNode(true);
    clone.querySelectorAll('.pic').forEach(el => el.remove());
    clone.querySelectorAll('img').forEach(el => el.remove());

    body.innerHTML = '';

    if (sourceImg?.src) {
      const imageWrap = document.createElement('div');
      imageWrap.className = 'lift-preview-image';
      const img = document.createElement('img');
      img.src = sourceImg.src;
      img.alt = sourceImg.alt || '';
      img.loading = 'eager';
      img.decoding = 'async';
      imageWrap.appendChild(img);
      body.appendChild(imageWrap);
    }

    const content = document.createElement('div');
    content.className = 'lift-preview-content';
    content.appendChild(clone);
    body.appendChild(content);

    clone.style.transform = 'none';
    clone.style.boxShadow = 'none';
    clone.style.cursor = 'default';
    clone.style.width = '100%';
    clone.style.maxWidth = '100%';

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

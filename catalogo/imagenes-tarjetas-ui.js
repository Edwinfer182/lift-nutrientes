(() => {
  'use strict';
  if(document.getElementById('liftCardImageSizeStyles')) return;
  const style=document.createElement('style');
  style.id='liftCardImageSizeStyles';
  style.textContent=`
    .pic{
      height:210px !important;
      padding:10px !important;
      overflow:hidden !important;
      display:flex !important;
      align-items:center !important;
      justify-content:center !important;
      box-sizing:border-box !important;
    }
    .pic img{
      display:block !important;
      width:auto !important;
      height:auto !important;
      max-width:100% !important;
      max-height:100% !important;
      object-fit:contain !important;
      object-position:center !important;
    }
    @media(max-width:760px){
      .pic{
        height:165px !important;
        padding:8px !important;
      }
    }
    @media(max-width:390px){
      .pic{
        height:155px !important;
      }
    }
  `;
  document.head.appendChild(style);
})();

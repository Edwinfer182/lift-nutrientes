(() => {
  'use strict';
  if(document.getElementById('liftCardImageSizeStyles')) return;
  const style=document.createElement('style');
  style.id='liftCardImageSizeStyles';
  style.textContent=`
    .pic{
      height:210px !important;
      padding:10px 10px !important;
    }
    .pic img{
      max-width:94% !important;
      max-height:94% !important;
    }
    @media(max-width:760px){
      .pic{
        height:165px !important;
        padding:8px 8px !important;
      }
      .pic img{
        max-width:96% !important;
        max-height:96% !important;
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

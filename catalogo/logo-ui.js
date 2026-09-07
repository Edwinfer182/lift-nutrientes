(() => {
  'use strict';
  const LOGO = 'logo-lift.png.png';

  function upsertLink(rel, href) {
    let el = document.querySelector(`link[rel="${rel}"]`);
    if (!el) {
      el = document.createElement('link');
      el.rel = rel;
      document.head.appendChild(el);
    }
    el.href = href;
  }
  upsertLink('icon', LOGO);
  upsertLink('shortcut icon', LOGO);
  upsertLink('apple-touch-icon', LOGO);

  function installBrand() {
    if (!document.getElementById('lift-brand-style')) {
      const style=document.createElement('style');
      style.id='lift-brand-style';
      style.textContent=`
        .lift-brand-complete{display:flex!important;align-items:center!important;gap:8px!important;white-space:nowrap;flex:0 0 auto!important;min-width:max-content!important;visibility:visible!important;opacity:1!important}
        .lift-brand-symbol{display:block!important;width:42px;height:42px;object-fit:contain;flex:0 0 42px}
        .lift-brand-copy{display:flex!important;flex-direction:column;justify-content:center;align-items:stretch;width:104px;line-height:1;transform:translateY(1px);visibility:visible!important;opacity:1!important}
        .lift-brand-word{display:block!important;width:100%;font-family:Arial Black,Impact,Arial,sans-serif;font-size:20px;font-weight:900;font-style:italic;letter-spacing:-1.2px;color:#e30613;line-height:.9;text-transform:uppercase;transform:scaleX(1.18);transform-origin:left center;visibility:visible!important;opacity:1!important}
        .lift-brand-sub{display:flex!important;width:100%;justify-content:space-between;font-family:Arial,Helvetica,sans-serif;font-size:7.3px;font-weight:800;letter-spacing:0;color:#111;line-height:1.15;margin-top:4px;text-transform:uppercase;visibility:visible!important;opacity:1!important}
        .lift-brand-sub span{display:inline-block}
        @media(max-width:700px){
          .lift-brand-complete{display:flex!important;gap:5px!important;min-width:130px!important;max-width:142px!important;overflow:visible!important}
          .lift-brand-symbol{display:block!important;width:34px;height:34px;flex-basis:34px}
          .lift-brand-copy{display:flex!important;width:88px!important;min-width:88px!important}
          .lift-brand-word{display:block!important;font-size:16px!important;letter-spacing:-1px!important;transform:scaleX(1.15)!important}
          .lift-brand-sub{display:flex!important;font-size:6.2px!important;margin-top:3px!important}
        }
      `;
      document.head.appendChild(style);
    }

    if(document.querySelector('.lift-brand-complete')) return true;
    const candidates=[...document.querySelectorAll('header *, .topbar *, .header *, nav *')];
    const lBox=candidates.find(el=>{
      const t=(el.textContent||'').trim();
      if(t!=='L') return false;
      const r=el.getBoundingClientRect();
      return r.width>=24&&r.width<=70&&r.height>=24&&r.height<=70;
    });
    if(!lBox||!lBox.parentElement) return false;

    const parent=lBox.parentElement;
    const oldText=[...parent.children].find(el=>el!==lBox&&(el.textContent||'').trim().toUpperCase().includes('NUTRIENTES'));

    const brand=document.createElement('span');
    brand.className='lift-brand-complete';

    const symbol=document.createElement('img');
    symbol.src=LOGO;
    symbol.alt='Lift';
    symbol.className='lift-brand-symbol';

    const copy=document.createElement('span');
    copy.className='lift-brand-copy';
    const word=document.createElement('span');
    word.className='lift-brand-word';
    word.textContent='LIFT';
    const sub=document.createElement('span');
    sub.className='lift-brand-sub';
    'NUTRIENTES'.split('').forEach(ch=>{
      const s=document.createElement('span');
      s.textContent=ch;
      sub.appendChild(s);
    });
    copy.append(word,sub);
    brand.append(symbol,copy);

    lBox.replaceWith(brand);
    if(oldText) oldText.style.display='none';
    return true;
  }

  if(!installBrand()){
    let tries=0;
    const timer=setInterval(()=>{
      tries++;
      if(installBrand()||tries>30)clearInterval(timer);
    },250);
  }
})();
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
        .lift-brand-complete{display:flex!important;align-items:center!important;gap:8px!important;white-space:nowrap}
        .lift-brand-symbol{display:block;width:42px;height:42px;object-fit:contain}
        .lift-brand-copy{display:flex;flex-direction:column;justify-content:center;line-height:1;transform:translateY(1px)}
        .lift-brand-word{font-family:Arial Black,Impact,Arial,sans-serif;font-size:20px;font-weight:900;font-style:italic;letter-spacing:-1.1px;color:#e30613;line-height:.9;text-transform:uppercase}
        .lift-brand-sub{font-family:Arial,Helvetica,sans-serif;font-size:8px;font-weight:800;letter-spacing:2.15px;color:#111;line-height:1.15;margin-top:4px;text-transform:uppercase}
        @media(max-width:700px){
          .lift-brand-complete{gap:6px!important}
          .lift-brand-symbol{width:36px;height:36px}
          .lift-brand-word{font-size:17px}
          .lift-brand-sub{font-size:6.5px;letter-spacing:1.7px;margin-top:3px}
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
    sub.textContent='NUTRIENTES';
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
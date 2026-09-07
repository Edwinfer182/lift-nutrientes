(() => {
  'use strict';
  const FAVICON = 'logo-lift.png.png';
  const LETTERS = 'letras-lift-logo.png';

  function upsertLink(rel, href) {
    let el = document.querySelector(`link[rel="${rel}"]`);
    if (!el) {
      el = document.createElement('link');
      el.rel = rel;
      document.head.appendChild(el);
    }
    el.href = href;
  }

  upsertLink('icon', FAVICON);
  upsertLink('shortcut icon', FAVICON);
  upsertLink('apple-touch-icon', FAVICON);

  function setMeta(selector, attr, name, value) {
    let el = document.querySelector(selector);
    if (!el) {
      el = document.createElement('meta');
      el.setAttribute(attr, name);
      document.head.appendChild(el);
    }
    el.content = value;
  }
  const absoluteLogo = new URL(FAVICON, location.href).href;
  setMeta('meta[property="og:image"]','property','og:image',absoluteLogo);
  setMeta('meta[name="twitter:image"]','name','twitter:image',absoluteLogo);

  function installHeaderLetters() {
    if (!document.getElementById('lift-brand-style')) {
      const style = document.createElement('style');
      style.id='lift-brand-style';
      style.textContent = `
        .lift-brand-letters{display:block;height:31px;width:auto;max-width:145px;object-fit:contain;object-position:left center;margin-left:7px}
        @media(max-width:700px){.lift-brand-letters{height:25px;max-width:112px;margin-left:5px}}
      `;
      document.head.appendChild(style);
    }

    if (document.querySelector('.lift-brand-letters')) return true;

    const candidates=[...document.querySelectorAll('header *, .topbar *, .header *, nav *')];
    const lBox=candidates.find(el=>{
      const t=(el.textContent||'').trim();
      if(t!=='L') return false;
      const r=el.getBoundingClientRect();
      return r.width>=24 && r.width<=70 && r.height>=24 && r.height<=70;
    });
    if(!lBox) return false;

    const img=document.createElement('img');
    img.src=LETTERS;
    img.alt='Lift Nutrientes';
    img.className='lift-brand-letters';

    const parent=lBox.parentElement;
    if(!parent) return false;
    parent.style.display='flex';
    parent.style.alignItems='center';

    let oldText=[...parent.children].find(el=>el!==lBox && (el.textContent||'').trim().toUpperCase().includes('NUTRIENTES'));
    if(oldText) oldText.style.display='none';
    lBox.insertAdjacentElement('afterend',img);
    return true;
  }

  if (!installHeaderLetters()) {
    let tries=0;
    const timer=setInterval(()=>{
      tries++;
      if(installHeaderLetters() || tries>30) clearInterval(timer);
    },250);
  }
})();
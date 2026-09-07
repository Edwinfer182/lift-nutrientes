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

  function setMeta(selector, attr, name, value) {
    let el = document.querySelector(selector);
    if (!el) {
      el = document.createElement('meta');
      el.setAttribute(attr, name);
      document.head.appendChild(el);
    }
    el.content = value;
  }
  const absoluteLogo = new URL(LOGO, location.href).href;
  setMeta('meta[property="og:image"]','property','og:image',absoluteLogo);
  setMeta('meta[name="twitter:image"]','name','twitter:image',absoluteLogo);

  function installHeaderLogo() {
    const style = document.createElement('style');
    style.textContent = `
      .lift-header-brand-logo{display:block;width:160px;max-width:22vw;height:44px;object-fit:contain;object-position:left center}
      @media(max-width:700px){.lift-header-brand-logo{width:108px;max-width:30vw;height:38px}}
    `;
    document.head.appendChild(style);

    const candidates = [...document.querySelectorAll('header *, .topbar *, .header *, nav *')];
    const brandText = candidates.find(el => {
      const t=(el.textContent||'').trim().replace(/\s+/g,' ').toUpperCase();
      return t==='LIFT NUTRIENTES' || t==='L NUTRIENTES';
    });
    if (!brandText) return false;

    let host = brandText;
    const parentText=(brandText.parentElement?.textContent||'').trim().replace(/\s+/g,' ').toUpperCase();
    if (brandText.parentElement && (parentText==='LIFT NUTRIENTES' || parentText==='L NUTRIENTES')) host=brandText.parentElement;

    if (host.querySelector?.('.lift-header-brand-logo')) return true;
    host.innerHTML='';
    const img=document.createElement('img');
    img.src=LOGO;
    img.alt='Lift Nutrientes';
    img.className='lift-header-brand-logo';
    host.appendChild(img);
    return true;
  }

  if (!installHeaderLogo()) {
    let tries=0;
    const timer=setInterval(()=>{
      tries++;
      if (installHeaderLogo() || tries>30) clearInterval(timer);
    },250);
  }
})();
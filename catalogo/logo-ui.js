(() => {
  'use strict';
  const LOGO = 'logo-lift.png.png';

  function upsertLink(rel, href, sizes) {
    let el = document.querySelector(`link[rel="${rel}"]`);
    if (!el) {
      el = document.createElement('link');
      el.rel = rel;
      document.head.appendChild(el);
    }
    el.href = href;
    if (sizes) el.sizes = sizes;
  }

  upsertLink('icon', LOGO);
  upsertLink('shortcut icon', LOGO);
  upsertLink('apple-touch-icon', LOGO);

  let og = document.querySelector('meta[property="og:image"]');
  if (!og) {
    og = document.createElement('meta');
    og.setAttribute('property', 'og:image');
    document.head.appendChild(og);
  }
  og.content = new URL(LOGO, location.href).href;

  let twitter = document.querySelector('meta[name="twitter:image"]');
  if (!twitter) {
    twitter = document.createElement('meta');
    twitter.name = 'twitter:image';
    document.head.appendChild(twitter);
  }
  twitter.content = new URL(LOGO, location.href).href;
})();
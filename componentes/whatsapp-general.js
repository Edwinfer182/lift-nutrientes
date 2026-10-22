/* SUPGO: Atención general por WhatsApp. Incluir con:
   <script defer src="/componentes/whatsapp-general.js"></script>
   Solo en la portada principal, no en fichas SEO. */
(() => {
  'use strict';
  if (window.__supgoWhatsAppGeneralReady) return;
  window.__supgoWhatsAppGeneralReady = true;
  const PHONE = '573137380766';
  const DEFAULT_TEXT = 'Hola, quiero recibir asesoría sobre los suplementos disponibles en SUPGO.';
  const start = () => {
    if (document.getElementById('supgo-wa-general')) return;
    const css = document.createElement('style');
    css.id = 'supgo-wa-general-style';
    css.textContent = `
#supgo-wa-general{position:fixed;right:18px;bottom:calc(22px + env(safe-area-inset-bottom,0px));z-index:9000;font-family:Poppins,Arial,sans-serif}
#supgo-wa-general *{box-sizing:border-box}
#supgo-wa-general .wa-toggle{display:grid;place-items:center;width:56px;height:56px;border:0;border-radius:50%;color:white;background:#20c767;box-shadow:0 5px 18px #0003;cursor:pointer;margin-left:auto;padding:0}
#supgo-wa-general .wa-toggle svg{display:block;width:29px;height:29px}
#supgo-wa-general .wa-panel{position:absolute;bottom:70px;right:0;width:min(330px,calc(100vw - 32px));padding:16px;background:#fff;border:1px solid #e5e5e5;border-radius:15px;box-shadow:0 10px 30px #0002;color:#151515}
#supgo-wa-general .wa-panel[hidden]{display:none}
#supgo-wa-general .wa-heading{display:flex;align-items:center;justify-content:space-between;gap:10px;margin-bottom:7px}
#supgo-wa-general .wa-heading strong{font-size:15px;font-weight:650}
#supgo-wa-general .wa-close{width:28px;height:28px;border:0;background:transparent;color:#555;font-size:21px;cursor:pointer}
#supgo-wa-general .wa-sub{font-size:12px;line-height:1.4;color:#666;margin:0 0 12px}
#supgo-wa-general textarea{width:100%;min-height:85px;padding:11px;border:1px solid #dedede;border-radius:9px;font:13px/1.45 Poppins,Arial,sans-serif;color:#161616;resize:vertical;background:#fff}
#supgo-wa-general .wa-send{display:block;width:100%;margin-top:10px;border:0;border-radius:9px;padding:11px 12px;background:#1eae5b;color:#fff;font:600 13px Poppins,Arial,sans-serif;cursor:pointer}
@media(max-width:600px){#supgo-wa-general{right:15px;bottom:calc(90px + env(safe-area-inset-bottom,0px))}#supgo-wa-general .wa-toggle{width:52px;height:52px}}
`;
    document.head.appendChild(css);
    const wrap = document.createElement('div');
    wrap.id = 'supgo-wa-general';
    wrap.innerHTML = `<section class="wa-panel" id="supgo-wa-general-panel" hidden aria-label="Atención por WhatsApp">
      <div class="wa-heading"><strong>Atención SUPGO</strong><button class="wa-close" type="button" aria-label="Cerrar">×</button></div>
      <p class="wa-sub">¿Necesitas ayuda con un producto o con tu pedido? Escríbenos.</p>
      <textarea aria-label="Tu mensaje de WhatsApp"></textarea>
      <button class="wa-send" type="button">Enviar por WhatsApp</button>
    </section>
    <button class="wa-toggle" type="button" aria-label="Abrir atención por WhatsApp" aria-expanded="false" aria-controls="supgo-wa-general-panel">
      <svg viewBox="0 0 32 32" fill="currentColor" aria-hidden="true"><path d="M16 2.7A13.2 13.2 0 0 0 4.7 22.8L3 29l6.4-1.7A13.3 13.3 0 1 0 16 2.7Zm0 24.1a10.8 10.8 0 0 1-5.5-1.5l-.4-.2-3.8 1 1-3.7-.2-.4a10.9 10.9 0 1 1 8.9 4.8Zm6-8.2c-.3-.1-1.9-.9-2.2-1s-.5-.1-.7.2-.8 1-1 1.2-.4.2-.7.1a8.9 8.9 0 0 1-4.4-3.9c-.3-.5.3-.5.9-1.7a.6.6 0 0 0 0-.6l-1-2.4c-.3-.6-.5-.5-.7-.5h-.6c-.2 0-.6.1-.9.5s-1.2 1.2-1.2 2.9 1.2 3.4 1.3 3.7a12.2 12.2 0 0 0 4.7 4.5 4.5 0 0 0 2.7.9c1.1 0 2.5-.5 2.9-1.7.4-1.1.4-2.1.3-2.3s-.3-.2-.6-.3Z"/></svg>
    </button>`;
    document.body.appendChild(wrap);
    const toggle = wrap.querySelector('.wa-toggle');
    const panel = wrap.querySelector('.wa-panel');
    const field = wrap.querySelector('textarea');
    field.value = DEFAULT_TEXT;
    const setOpen = open => {panel.hidden = !open; toggle.setAttribute('aria-expanded', String(open));};
    toggle.addEventListener('click', () => setOpen(panel.hidden));
    wrap.querySelector('.wa-close').addEventListener('click', () => setOpen(false));
    wrap.querySelector('.wa-send').addEventListener('click', () => {
      const message = field.value.trim() || DEFAULT_TEXT;
      window.location.href = 'https://api.whatsapp.com/send?phone=' + PHONE + '&text=' + encodeURIComponent(message);
    });
    document.addEventListener('keydown', event => {if(event.key === 'Escape') setOpen(false);});
  };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start, {once:true});
  else start();
})();

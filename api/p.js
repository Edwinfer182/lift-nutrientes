/* Enlace corto de pedido: supgo.co/p/CODIGO
   Devuelve una página mínima con su propia vista previa (WhatsApp/redes) y lleva al cliente a su pedido. */
const SB = 'https://vdxkknftyssjyfbdieqa.supabase.co/rest/v1/';
const KEY = 'sb_publishable_ECuhXuKIb85kj9fgdEjrAw_O7uNpZsh';
const esc = v => String(v == null ? '' : v).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const money = n => '$' + Math.round(Number(n) || 0).toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');

module.exports = async function p(req, res) {
  const code = typeof req.query.c === 'string' ? req.query.c : '';
  let o = null;
  if (/^[A-Za-z0-9]{8}$/.test(code)) {
    try {
      const r = await fetch(SB + 'rpc/lift_pedido_resolver_codigo', {
        method: 'POST',
        headers: { apikey: KEY, 'Content-Type': 'application/json' },
        body: JSON.stringify({ p_codigo: code })
      });
      if (r.ok) o = await r.json();
    } catch (e) { o = null; }
  }
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.setHeader('X-Robots-Tag', 'noindex, nofollow');
  res.setHeader('Cache-Control', 'private, no-store');
  if (!o || !o.id || !o.token) {
    res.statusCode = 404;
    res.end('<!doctype html><html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Pedido no encontrado | SUPGO</title><meta name="robots" content="noindex"><meta http-equiv="refresh" content="0;url=/mi-pedido/"></head><body><p><a href="/mi-pedido/">Consultar mi pedido</a></p></body></html>');
    return;
  }
  const dest = '/mi-pedido/?pedido=' + encodeURIComponent(o.id) + '&token=' + encodeURIComponent(o.token);
  const porPagar = o.estado === 'pendiente_pago' && o.pago_estado !== 'aprobado';
  const title = 'Pedido #' + o.id + ' · SUPGO';
  const desc = porPagar
    ? 'Total ' + money(o.total) + '. Toca para ver tu pedido y pagarlo de forma segura.'
    : 'Toca para ver el estado de tu pedido.';
  const img = /^https:\/\//.test(String(o.imagen || '')) ? o.imagen : 'https://supgo.co/favicon.png';
  res.statusCode = 200;
  res.end('<!doctype html><html lang="es"><head><meta charset="utf-8">' +
    '<meta name="viewport" content="width=device-width,initial-scale=1">' +
    '<title>' + esc(title) + '</title><meta name="robots" content="noindex, nofollow">' +
    '<meta name="description" content="' + esc(desc) + '">' +
    '<meta property="og:type" content="website"><meta property="og:site_name" content="SUPGO">' +
    '<meta property="og:title" content="' + esc(title) + '"><meta property="og:description" content="' + esc(desc) + '">' +
    '<meta property="og:image" content="' + esc(img) + '"><meta name="twitter:card" content="summary">' +
    '<meta http-equiv="refresh" content="0;url=' + esc(dest) + '">' +
    '<script>location.replace(' + JSON.stringify(dest) + ')</script>' +
    '</head><body style="font-family:system-ui;padding:24px"><a href="' + esc(dest) + '">Ver mi pedido #' + esc(o.id) + '</a></body></html>');
};

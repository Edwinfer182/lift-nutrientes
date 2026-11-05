/* SUPGO: server-rendered product route for Vercel; browser template remains unchanged. */
const fs = require('node:fs');
const path = require('node:path');

const escapeHtml = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const text = value => String(value ?? '').trim();
const clean = value => text(value).replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();

module.exports = async function handler(req, res) {
  const slug = typeof req.query.slug === 'string' ? req.query.slug : '';
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) return res.status(404).send('Producto no encontrado');
  try {
    const template = fs.readFileSync(path.join(process.cwd(), 'producto', 'index.html'), 'utf8');
    const match = template.match(/<script type="application\/json" id="ficha-plantilla">([\s\S]*?)<\/script>/);
    if (!match) throw new Error('Configuración de la plantilla ausente');
    const cfg = JSON.parse(match[1]);
    const headers = { apikey: cfg.key, Accept: 'application/json' };
    const endpoint = cfg.supabase + '/rest/v1/';
    const fetchRows = async (query) => {
      const r = await fetch(endpoint + query, { headers, signal: AbortSignal.timeout(9000) });
      if (!r.ok) throw new Error('Supabase HTTP ' + r.status);
      return r.json();
    };
    const rows = await fetchRows('lift_productos?select=id,activo,slug,product&slug=eq.' + encodeURIComponent(slug) + '&limit=2');
    if (rows.length !== 1) return res.status(404).send('Producto no encontrado o slug duplicado');
    const row = rows[0], p = row.product || {};
    const name = text(p.name || p.nombre);
    if (!name || row.activo === false || p.__deleted || p.__private || p.adminOnly || p.hidden || p.oculto) {
      return res.status(404).send('Producto no disponible');
    }
    const brand = text(p.brand || p.marca);
    const canonical = 'https://supgo.co/producto/' + slug + '/';
    const description = clean(p.seo?.meta_description || p.seo?.description || p.description || p.descripcion || ('Compra ' + name + ' en SUPGO Medellín. Envíos a Colombia.')).slice(0, 160);
    const title = (name + ' | SUPGO').slice(0, 100);
    const image = text(p.image || p.imagen);
    // Sharing crawlers read the initial HTML without executing the browser template.
    const social = [
      ['property', 'og:type', 'product'],
      ['property', 'og:site_name', 'SUPGO'],
      ['property', 'og:locale', 'es_CO'],
      ['property', 'og:title', title],
      ['property', 'og:description', description],
      ['property', 'og:url', canonical],
      ['name', 'twitter:card', /^https:\/\//.test(image) ? 'summary_large_image' : 'summary'],
      ['name', 'twitter:title', title],
      ['name', 'twitter:description', description]
    ];
    if (/^https:\/\//.test(image)) social.push(
      ['property', 'og:image', image],
      ['property', 'og:image:secure_url', image],
      ['property', 'og:image:alt', name],
      ['name', 'twitter:image', image],
      ['name', 'twitter:image:alt', name]
    );
    const socialHtml = social.map(([attribute, key, value]) =>
      '<meta ' + attribute + '="' + key + '" content="' + escapeHtml(value) + '">'
    ).join('\n');
    const price = Number(p.price ?? p.precio ?? 0);
    const schema = { '@context':'https://schema.org', '@type':'Product', name, description, url:canonical, brand:{'@type':'Brand',name:brand} };
    if (/^https:\/\//.test(image)) schema.image = [image];
    if (price > 0) schema.offers = {'@type':'Offer',priceCurrency:'COP',price, url:canonical};
    const initial = '<h1>' + escapeHtml(name) + '</h1>' +
      (image.startsWith('https://') ? '<img src="' + escapeHtml(image) + '" alt="' + escapeHtml(name) + '" loading="eager">' : '') +
      '<p>' + escapeHtml(description) + '</p>' +
      (price > 0 ? '<p>$' + escapeHtml(price.toLocaleString('es-CO')) + ' COP</p>' : '');
    let html = template
      .replace(/<meta\b[^>]*(?:property|name)\s*=\s*["'](?:og:|twitter:)[^"']*["'][^>]*>\s*/gi, '')
      .replace(/<title>[\s\S]*?<\/title>/i, '<title>' + escapeHtml(title) + '</title>')
      .replace(/<meta name="description"[^>]*>/i, '<meta name="description" content="' + escapeHtml(description) + '">')
      .replace(/<meta name="robots"[^>]*>/i, '<meta name="robots" content="index, follow">')
      .replace('</head>', socialHtml + '<style id="supgo-ssr-no-flash">#supgo-ficha:not(:has(.product-card)){visibility:hidden}</style><link rel="canonical" href="' + escapeHtml(canonical) + '"><script type="application/ld+json">' + JSON.stringify(schema).replace(/</g, '\\u003c') + '</script></head>')
      .replace(/<div class="fd-cargando" role="status">[\s\S]*?<\/div><\/div>/, initial);
    res.setHeader('Content-Type','text/html; charset=utf-8');
    res.setHeader('Cache-Control','public, s-maxage=300, stale-while-revalidate=600');
    return res.status(200).send(html);
  } catch (err) {
    console.error('SUPGO product SSR error:', err.message);
    return res.status(503).send('No se pudo cargar el producto. Intenta nuevamente.');
  }
};

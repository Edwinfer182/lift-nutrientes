/* SUPGO: server-rendered product route for Vercel; browser template remains unchanged. */
const fs = require('node:fs');
const path = require('node:path');
const { construirSeo } = require('./_seo-producto');

const escapeHtml = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const text = value => String(value ?? '').trim();
// Mismo filtro que aplica la ficha en el navegador a la descripción larga.
const sanitize = html => text(html)
  .replace(/<(script|iframe|object|embed|form|style|svg)\b[^>]*>[\s\S]*?<\/\1\s*>/gi, '').replace(/<(script|iframe|object|embed|form|style|svg)\b[^>]*\/?>/gi, '')
  .replace(/\s+on[a-z]+\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]+)/gi, '').replace(/javascript\s*:/gi, '');
const clean = value => text(value).replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();

// URLs antiguas /productos/<nombre>-<id>.html (guías, enlaces externos, Google): 301 a /producto/<slug>/.
let HEREDADAS = {};
try { HEREDADAS = require('../scripts/fichas_heredadas.json'); } catch (e) {}
async function legado(req, res, fetchRows) {
  let viejo = String(req.query.legado || '').replace(/\.html$/i, '');
  for (let i = 0; i < 2; i++) { // el mapa puede apuntar a otra URL antigua /productos/...
    const destino = HEREDADAS[viejo + '.html'];
    if (!destino) break;
    if (!destino.startsWith('/productos/')) { res.setHeader('Cache-Control', 'public, s-maxage=86400'); return res.redirect(301, destino); }
    viejo = destino.slice('/productos/'.length).replace(/\.html$/i, '');
  }
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(viejo)) return res.status(404).send('Producto no encontrado');
  let rows = await fetchRows('lift_productos?select=id,slug,activo&slug=eq.' + encodeURIComponent(viejo) + '&limit=2');
  const m = /-(\d+)$/.exec(viejo);
  if (rows.length !== 1 && m) rows = await fetchRows('lift_productos?select=id,slug,activo&id=eq.' + m[1] + '&limit=1');
  if (rows.length !== 1 && m) rows = await fetchRows('lift_productos?select=id,slug,activo&slug=eq.' + encodeURIComponent(viejo.slice(0, m.index)) + '&limit=2');
  if (rows.length === 1 && rows[0].slug && rows[0].activo !== false) {
    res.setHeader('Cache-Control', 'public, s-maxage=86400');
    return res.redirect(301, '/producto/' + rows[0].slug + '/');
  }
  res.setHeader('Cache-Control', 'public, s-maxage=3600');
  return res.status(404).send('Producto no encontrado');
}

/* HTML inicial (SSR) de la ficha: título, metas, datos estructurados y la ficha básica. */
function render(res, template, o) {
  const canonical = 'https://supgo.co/producto/' + o.slug + '/';
  const { name, brand, title, description, image } = o;
  const robots = o.canIndex ? 'index, follow' : 'noindex, follow';
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
  const schema = { '@context':'https://schema.org', '@type':'Product', name: o.h1 || name, description, url:canonical, brand:{'@type':'Brand',name:brand} };
  if (o.extraSchema && typeof o.extraSchema === 'object' && !Array.isArray(o.extraSchema)) Object.assign(schema, o.extraSchema);
  if (/^https:\/\//.test(image)) schema.image = [image];
  if (o.minPrice > 0) schema.offers = o.maxPrice > o.minPrice
    ? {'@type':'AggregateOffer',priceCurrency:'COP',lowPrice:o.minPrice,highPrice:o.maxPrice,offerCount:o.offerCount||2,url:canonical}
    : {'@type':'Offer',priceCurrency:'COP',price:o.minPrice,url:canonical};
  const cop = n => '$' + escapeHtml(Number(n).toLocaleString('es-CO'));
  const priceHtml = o.minPrice > 0 ? '<p class="price">' + (o.maxPrice > o.minPrice ? 'Desde ' : '') + cop(o.minPrice) + '</p>' : '<p class="price">Consultar precio</p>';
  // El HTML inicial ya usa la distribución responsive de la ficha definitiva.
  // Evita el salto visual de una imagen sin tamaño antes de que cargue el JS.
  const initial = '<article class="product-card supgo-ssr-product">' +
    '<section class="product-gallery"><div class="product-media">' +
    (image.startsWith('https://') ? '<img src="' + escapeHtml(image) + '" alt="' + escapeHtml(name) + '" width="600" height="600" loading="eager" decoding="async" style="display:block;width:100%;height:100%;max-width:100%;max-height:100%;object-fit:contain">' : '') +
    '</div></section>' +
    '<section class="product-info">' +
    (brand ? '<span class="product-brand">' + escapeHtml(brand) + '</span>' : '') +
    '<h1>' + escapeHtml(o.h1 || name) + '</h1>' +
    '<div class="product-price">' + priceHtml + '</div>' +
    (o.opcionesHtml || '') +
    '<details class="seo-description"><summary>Descripción</summary><div class="product-description"><p>' + escapeHtml(description) + '</p></div></details>' +
    '</section></article>' +
    '<section class="seo-ssr-descripcion">' + sanitize(o.seo.descripcion_larga_html) + '</section>';
  // Mostrar juntos el encabezado y la ficha completa; no pintar etapas intermedias.
  // El HTML SSR permanece accesible para rastreadores y como respaldo si falla JS.
  const atomicLoad = '<style id="supgo-ssr-ficha">#supgo-ficha .supgo-ssr-product{animation:supgoSsrIn .18s ease-out}@keyframes supgoSsrIn{from{opacity:.4}to{opacity:1}}</style>';
  // Reutilizar en el navegador la misma fila ya consultada por Vercel: evita
  // repetir dos peticiones a Supabase antes de mostrar variantes y botones.
  const boot = { slug: o.slug, row: o.row, seo: o.seo };
  if (o.grupo) { boot.grupo = o.grupo; boot.miembros = o.miembros; }
  const bootstrap = '<script type="application/json" id="supgo-product-bootstrap">' +
    JSON.stringify(boot).replace(/</g, '\\u003c').replace(/>/g, '\\u003e').replace(/&/g, '\\u0026') +
    '</script>';
  const html = template
    .replace(/<meta\b[^>]*(?:property|name)\s*=\s*["'](?:og:|twitter:)[^"']*["'][^>]*>\s*/gi, '')
    .replace(/<title>[\s\S]*?<\/title>/i, '<title>' + escapeHtml(title) + '</title>')
    .replace(/<meta name="description"[^>]*>/i, '<meta name="description" content="' + escapeHtml(description) + '">')
    .replace(/<meta name="robots"[^>]*>/i, '<meta name="robots" content="' + robots + '">')
    .replace('</head>', atomicLoad + socialHtml + '<link rel="canonical" href="' + escapeHtml(canonical) + '"><script type="application/ld+json">' + JSON.stringify(schema).replace(/</g, '\\u003c') + '</script></head>')
    .replace(/<div class="fd-cargando" role="status">[\s\S]*?<\/div><\/div>/, initial)
    .replace('<script type="application/json" id="ficha-plantilla">', bootstrap + '<script type="application/json" id="ficha-plantilla">');
  res.setHeader('Content-Type','text/html; charset=utf-8');
  // Respuesta inmediata desde la CDN; se renueva en segundo plano. El navegador refresca precio y oferta.
  res.setHeader('Cache-Control','public, s-maxage=300, stale-while-revalidate=86400');
  return res.status(200).send(html);
}

/* Ficha de un producto variable: una URL para todos sus sabores y tamaños. */
async function padre(req, res, template, fetchRows, slug, fam, marcasTodas, bloqueosTodos) {
  const ids = [...new Set(fam.map(f => f.producto_id))];
  const [prods, grupos] = await Promise.all([
    fetchRows('lift_productos?select=id,activo,slug,product&activo=eq.true&id=in.(' + ids.join(',') + ')'),
    fetchRows('lift_producto_grupos?select=id,nombre,slug,marca,categoria,imagen,descripcion,titulo_seo,meta_descripcion,principal_id&id=eq.' + fam[0].grupo_id + '&limit=1')
  ]);
  const g = grupos[0];
  const ok = r => { const p = r.product || {}; return r.activo !== false && text(p.name || p.nombre) && !p.__deleted && !p.__private && !p.adminOnly && !p.hidden && !p.oculto; };
  const byId = new Map(prods.filter(ok).map(r => [String(r.id), r]));
  const miembros = fam.filter(f => byId.has(String(f.producto_id))).sort((a, b) => a.orden - b.orden)
    .map(f => Object.assign({}, byId.get(String(f.producto_id)), { sabor: f.sabor, tamano: f.tamano, orden: f.orden }));
  if (!g || !miembros.length) return res.status(404).send('Producto no disponible');
  const precio = m => Number((m.product || {}).price ?? (m.product || {}).precio ?? 0);
  const pedido = String(req.query.v || '');
  const actual = miembros.find(m => String(m.id) === pedido) || miembros.find(m => String(m.id) === String(g.principal_id)) || miembros.find(m => precio(m) > 0) || miembros[0];
  const precios = miembros.map(precio).filter(n => n > 0);
  const p = actual.product || {};
  const brand = text(g.marca || p.brand || p.marca);
  const tamanos = [...new Set(miembros.map(m => text(m.tamano)).filter(Boolean))];
  const sabores = [...new Set(miembros.map(m => text(m.sabor)).filter(Boolean))];
  // Textos SEO del producto (no de un sabor): nombre del padre, tamaños disponibles y precio desde.
  const base = { id: actual.id, slug, product: Object.assign({}, p, { name: g.nombre, brand, flavor: '', presentation: tamanos.join(' · ') || text(p.presentation || p.presentacion),
    price: precios.length ? Math.min(...precios) : 0, description: text(g.descripcion) || p.description || p.descripcion, category: text(g.categoria) || p.category || p.categoria }) };
  const gen = construirSeo(base, { titulo_seo: g.titulo_seo, meta_descripcion: g.meta_descripcion });
  let html = gen.html;
  const listas = [];
  if (tamanos.length > 1) listas.push('<li><strong>Tamaños:</strong> ' + tamanos.map(escapeHtml).join(', ') + '</li>');
  if (sabores.length) listas.push('<li><strong>Sabores:</strong> ' + sabores.map(escapeHtml).join(', ') + '</li>');
  if (listas.length) html += '<h3>Opciones disponibles</h3><ul>' + listas.join('') + '</ul>';
  const lowerBrand = brand.toLowerCase();
  const reglas = (marcasTodas || []).filter(m => String(m.marca || '').trim().toLowerCase() === lowerBrand);
  const bloqueados = new Set((bloqueosTodos || []).map(b => String(b.producto_id)));
  const canIndex = reglas.length === 1 && reglas[0].habilitada === true && miembros.some(m => !bloqueados.has(String(m.id)));
  const seo = { titulo_seo: gen.titulo, meta_descripcion: gen.meta, descripcion_larga_html: html, nombre_visible: g.nombre, indexable: canIndex };
  const opciones = (tamanos.length > 1 ? '<p class="pv-ssr"><strong>Tamaños:</strong> ' + tamanos.map(escapeHtml).join(' · ') + '</p>' : '') +
    (sabores.length > 1 ? '<p class="pv-ssr"><strong>Sabores:</strong> ' + sabores.map(escapeHtml).join(' · ') + '</p>' : '');
  return render(res, template, {
    slug, row: { id: actual.id, activo: true, slug: actual.slug, product: actual.product }, seo, name: g.nombre, brand, h1: g.nombre,
    title: gen.titulo, description: gen.meta, canIndex, image: text(g.imagen || p.image || p.imagen),
    minPrice: precios.length ? Math.min(...precios) : 0, maxPrice: precios.length ? Math.max(...precios) : 0, offerCount: miembros.length, opcionesHtml: opciones,
    grupo: { id: g.id, slug, nombre: g.nombre, marca: brand, imagen: text(g.imagen), principal_id: g.principal_id, tamanos, sabores },
    miembros: miembros.map(m => ({ id: m.id, slug: m.slug, activo: true, product: m.product, sabor: m.sabor, tamano: m.tamano }))
  });
}

module.exports = async function handler(req, res) {
  if (typeof req.query.legado === 'string') {
    try {
      const cfgText = fs.readFileSync(path.join(process.cwd(), 'producto', 'index.html'), 'utf8').match(/<script type="application\/json" id="ficha-plantilla">([\s\S]*?)<\/script>/);
      const cfg = JSON.parse(cfgText[1]);
      const fetchRows = async q => { const r = await fetch(cfg.supabase + '/rest/v1/' + q, { headers: { apikey: cfg.key, Accept: 'application/json' }, signal: AbortSignal.timeout(9000) }); if (!r.ok) throw new Error('Supabase HTTP ' + r.status); return r.json(); };
      return await legado(req, res, fetchRows);
    } catch (err) {
      console.error('SUPGO legado:', err.message);
      return res.status(503).send('No se pudo cargar el producto.');
    }
  }
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
    // Una sola ida a Supabase en el caso normal: producto, su SEO (por canonical), marcas y bloqueos en paralelo.
    const canonicalUrl = 'https://supgo.co/producto/' + slug + '/';
    const SEO_COLS = 'producto_id,titulo_seo,meta_descripcion,descripcion_larga_html,imagen_seo,canonical_url,indexable,datos_estructurados';
    const [rows, seoPorUrl, marcasTodas, bloqueosTodos, familia] = await Promise.all([
      fetchRows('lift_productos?select=id,activo,slug,product&slug=eq.' + encodeURIComponent(slug) + '&limit=2'),
      fetchRows('lift_producto_seo?select=' + SEO_COLS + '&canonical_url=eq.' + encodeURIComponent(canonicalUrl) + '&limit=2').catch(() => null),
      fetchRows('lift_seo_marcas?select=marca,habilitada&limit=5000').catch(() => null),
      fetchRows('lift_seo_bloqueos?select=producto_id&limit=5000').catch(() => null),
      // Producto variable: ¿este slug es un producto padre o una variación de uno?
      fetchRows('lift_familias_publicas?select=producto_id,producto_slug,grupo_id,slug,principal_id,tamano,sabor,orden&or=(slug.eq.' + slug + ',producto_slug.eq.' + slug + ')&limit=200').catch(() => [])
    ]);
    const delPadre = familia.filter(f => f.slug === slug);
    if (delPadre.length) return await padre(req, res, template, fetchRows, slug, delPadre, marcasTodas, bloqueosTodos);
    const comoVariacion = familia.find(f => f.producto_slug === slug && f.slug !== slug);
    if (comoVariacion) {
      // Las variaciones ya no tienen página propia: su URL vieja se da por eliminada (410)
      // para que Google la retire. La variación sigue existiendo dentro de la ficha del producto.
      res.setHeader('Cache-Control', 'public, s-maxage=3600');
      res.setHeader('X-Robots-Tag', 'noindex');
      res.setHeader('Content-Type', 'text/html; charset=utf-8');
      const destino = '/producto/' + comoVariacion.slug + '/?v=' + comoVariacion.producto_id;
      return res.status(410).send('<!doctype html><html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex"><title>Esta página ya no existe | SUPGO</title>' +
        '<style>body{font-family:system-ui,Arial,sans-serif;display:grid;place-items:center;min-height:90vh;margin:0;padding:20px;text-align:center;color:#111}a{display:inline-block;margin-top:14px;background:#111;color:#fff;padding:12px 20px;border-radius:12px;text-decoration:none;font-weight:600}</style></head>' +
        '<body><div><h1>Esta página ya no existe</h1><p>Ahora este sabor y tamaño están dentro de la ficha del producto.</p><a href="' + destino + '" rel="nofollow">Ver el producto</a></div></body></html>');
    }
    if (rows.length > 1) return res.status(404).send('Producto no encontrado o slug duplicado');
    if (!rows.length) {
      // Slug viejo: slug personalizado del panel (product.seo.slug) o ID al final → 301 a la URL vigente.
      let otro = await fetchRows('lift_productos?select=id,activo,slug&product->seo->>slug=eq.' + encodeURIComponent(slug) + '&limit=2');
      const m = /(?:^|-)(\d+)$/.exec(slug);
      if (otro.length !== 1 && m) otro = await fetchRows('lift_productos?select=id,activo,slug&id=eq.' + m[1] + '&limit=1');
      if (otro.length === 1 && otro[0].activo !== false && otro[0].slug && otro[0].slug !== slug) {
        res.setHeader('Cache-Control', 'public, s-maxage=3600');
        return res.redirect(301, '/producto/' + otro[0].slug + '/');
      }
      return res.status(404).send('Producto no encontrado');
    }
    const row = rows[0], p = row.product || {};
    const name = text(p.name || p.nombre);
    if (!name || row.activo === false || p.__deleted || p.__private || p.adminOnly || p.hidden || p.oculto) {
      return res.status(404).send('Producto no disponible');
    }
    const brand = text(p.brand || p.marca);
    // Estas consultas se ejecutan en paralelo después de encontrar el producto.
    // Solo si alguna de las consultas anticipadas no sirvió se hace una segunda ida.
    const seoOk = Array.isArray(seoPorUrl) && seoPorUrl.length === 1 && String(seoPorUrl[0].producto_id) === String(row.id);
    const lowerBrand = brand.toLowerCase();
    const [seoRows, brandRules, seoBlocks] = await Promise.all([
      seoOk ? seoPorUrl : fetchRows('lift_producto_seo?select=' + SEO_COLS + '&producto_id=eq.' + row.id + '&limit=2'),
      !brand ? Promise.resolve([]) : marcasTodas ? Promise.resolve(marcasTodas.filter(m => String(m.marca || '').trim().toLowerCase() === lowerBrand)) : fetchRows('lift_seo_marcas?select=habilitada&marca=ilike.' + encodeURIComponent(brand) + '&limit=2'),
      bloqueosTodos ? Promise.resolve(bloqueosTodos.filter(b => String(b.producto_id) === String(row.id))) : fetchRows('lift_seo_bloqueos?select=producto_id&producto_id=eq.' + row.id + '&limit=1')
    ]);
    if (seoRows.length > 1) throw new Error('SEO duplicado para producto: ' + row.id);
    const gen = construirSeo(row, seoRows[0] || {});
    if (gen.copia) {
      // Ficha duplicada ("- Copia"): enviar a la original si existe con el mismo nombre.
      const originales = await fetchRows('lift_productos?select=id,slug&activo=eq.true&nombre=eq.' + encodeURIComponent(gen.nombre) + '&id=neq.' + row.id + '&limit=2');
      if (originales.length === 1 && originales[0].slug) {
        res.setHeader('Cache-Control', 'public, s-maxage=3600');
        return res.redirect(301, '/producto/' + originales[0].slug + '/');
      }
    }
    // El navegador recibe estos mismos textos en el bootstrap, así la ficha final coincide con el HTML inicial.
    const seo = Object.assign({}, seoRows[0] || {}, { titulo_seo: gen.titulo, meta_descripcion: gen.meta, descripcion_larga_html: gen.html, nombre_visible: gen.nombreCompleto });
    const canIndex = !gen.copia && seo.indexable !== false && brandRules.length === 1 && brandRules[0].habilitada === true && seoBlocks.length === 0;
    const price = Number(p.price ?? p.precio ?? 0);
    return render(res, template, {
      slug, row, seo, name, brand, h1: gen.nombreCompleto || name, title: gen.titulo, description: gen.meta, canIndex,
      image: text(seo.imagen_seo || p.image || p.imagen), minPrice: price, maxPrice: price, extraSchema: seo.datos_estructurados
    });
  } catch (err) {
    console.error('SUPGO product SSR error:', err.message);
    return res.status(503).send('No se pudo cargar el producto. Intenta nuevamente.');
  }
};

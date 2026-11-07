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
    const rows = await fetchRows('lift_productos?select=id,activo,slug,product&slug=eq.' + encodeURIComponent(slug) + '&limit=2');
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
    const [seoRows, brandRules, seoBlocks] = await Promise.all([
      fetchRows('lift_producto_seo?select=producto_id,titulo_seo,meta_descripcion,descripcion_larga_html,imagen_seo,canonical_url,indexable,datos_estructurados&producto_id=eq.' + row.id + '&limit=2'),
      brand ? fetchRows('lift_seo_marcas?select=habilitada&marca=ilike.' + encodeURIComponent(brand) + '&limit=2') : Promise.resolve([]),
      fetchRows('lift_seo_bloqueos?select=producto_id&producto_id=eq.' + row.id + '&limit=1')
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
    const title = gen.titulo;
    const description = gen.meta;
    const canIndex = !gen.copia && seo.indexable !== false && brandRules.length === 1 && brandRules[0].habilitada === true && seoBlocks.length === 0;
    // La URL principal se calcula con el slug vigente; el SEO puede estar desactualizado.
    const canonical = 'https://supgo.co/producto/' + slug + '/';
    const image = text(seo.imagen_seo || p.image || p.imagen);
    const robots = canIndex ? 'index, follow' : 'noindex, follow';
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
    if (seo.datos_estructurados && typeof seo.datos_estructurados === 'object' && !Array.isArray(seo.datos_estructurados)) Object.assign(schema, seo.datos_estructurados);
    if (/^https:\/\//.test(image)) schema.image = [image];
    if (price > 0) schema.offers = {'@type':'Offer',priceCurrency:'COP',price, url:canonical};
    // El HTML inicial ya usa la distribución responsive de la ficha definitiva.
    // Evita el salto visual de una imagen sin tamaño antes de que cargue el JS.
    const initial = '<article class="product-card supgo-ssr-product">' +
      '<section class="product-gallery"><div class="product-media">' +
      (image.startsWith('https://') ? '<img src="' + escapeHtml(image) + '" alt="' + escapeHtml(name) + '" width="600" height="600" loading="eager" decoding="async" style="display:block;width:100%;height:100%;max-width:100%;max-height:100%;object-fit:contain">' : '') +
      '</div></section>' +
      '<section class="product-info">' +
      (brand ? '<span class="product-brand">' + escapeHtml(brand) + '</span>' : '') +
      '<h1>' + escapeHtml(gen.nombreCompleto || name) + '</h1>' +
      '<div class="product-price">' + (price > 0 ? '<p class="price">$' + escapeHtml(price.toLocaleString('es-CO')) + '</p>' : '<p class="price">Consultar precio</p>') + '</div>' +
      '<details class="seo-description" open><summary>Descripción</summary><div class="product-description"><p>' + escapeHtml(description) + '</p></div></details>' +
      '</section></article>' +
      '<section class="seo-ssr-descripcion">' + sanitize(seo.descripcion_larga_html) + '</section>';
    // Mostrar juntos el encabezado y la ficha completa; no pintar etapas intermedias.
    // El HTML SSR permanece accesible para rastreadores y como respaldo si falla JS.
    const atomicLoad = `<style id="supgo-atomic-style">
      html.supgo-atomic-loading body::before{
        content:"";position:fixed;inset:0;z-index:2147483646;background:#fff;
      }
      html.supgo-atomic-loading body::after{
        content:"Cargando producto…";position:fixed;top:50%;left:50%;
        transform:translate(-50%,-50%);z-index:2147483647;
        color:#555;font:500 14px/1.5 Arial,sans-serif;white-space:nowrap;
      }
    </style><script>
    (function(){
      document.documentElement.classList.add('supgo-atomic-loading');
      var productReady=false,headerReady=false,finished=false;
      function reveal(){
        if(finished)return;finished=true;
        document.documentElement.classList.remove('supgo-atomic-loading');
      }
      function check(){if(productReady&&headerReady)requestAnimationFrame(function(){requestAnimationFrame(reveal);});}
      document.addEventListener('supgo-ficha-lista',function(){productReady=true;check();},{once:true});
      document.addEventListener('supgo:ficha-error',function(){productReady=true;check();},{once:true});
      document.addEventListener('supgo:header-ready',function(){headerReady=true;check();},{once:true});
      window.addEventListener('load',function(){
        if(document.querySelector('#supgo-global-header'))headerReady=true;
        if(document.querySelector('#supgo-ficha .product-card:not(.supgo-ssr-product),#supgo-ficha .fd-error'))productReady=true;
        check();
      },{once:true});
      // Si hay error o lentitud de red, nunca mantener la pantalla tapada.
      setTimeout(reveal,2500);
    })();
    <\/script>`;
    // Reutilizar en el navegador la misma fila ya consultada por Vercel: evita
    // repetir dos peticiones a Supabase antes de mostrar variantes y botones.
    const bootstrap = '<script type="application/json" id="supgo-product-bootstrap">' +
      JSON.stringify({ slug, row, seo }).replace(/</g, '\\u003c').replace(/>/g, '\\u003e').replace(/&/g, '\\u0026') +
      '</script>';
    let html = template
      .replace(/<meta\b[^>]*(?:property|name)\s*=\s*["'](?:og:|twitter:)[^"']*["'][^>]*>\s*/gi, '')
      .replace(/<title>[\s\S]*?<\/title>/i, '<title>' + escapeHtml(title) + '</title>')
      .replace(/<meta name="description"[^>]*>/i, '<meta name="description" content="' + escapeHtml(description) + '">')
      .replace(/<meta name="robots"[^>]*>/i, '<meta name="robots" content="' + robots + '">')
      .replace('</head>', atomicLoad + socialHtml + '<link rel="canonical" href="' + escapeHtml(canonical) + '"><script type="application/ld+json">' + JSON.stringify(schema).replace(/</g, '\\u003c') + '</script></head>')
      .replace(/<div class="fd-cargando" role="status">[\s\S]*?<\/div><\/div>/, initial)
      .replace('<script type="application/json" id="ficha-plantilla">', bootstrap + '<script type="application/json" id="ficha-plantilla">');
    res.setHeader('Content-Type','text/html; charset=utf-8');
    res.setHeader('Cache-Control','public, s-maxage=300, stale-while-revalidate=600');
    return res.status(200).send(html);
  } catch (err) {
    console.error('SUPGO product SSR error:', err.message);
    return res.status(503).send('No se pudo cargar el producto. Intenta nuevamente.');
  }
};

/* SEO de páginas editoriales: Supabase es la fuente de los metadatos. */
const fs = require('node:fs');
const path = require('node:path');
const SB = 'https://vdxkknftyssjyfbdieqa.supabase.co/rest/v1/';
const KEY = 'sb_publishable_ECuhXuKIb85kj9fgdEjrAw_O7uNpZsh';
const GENERAL = new Set(['home','categorias','laboratorios','ofertas','guias','politica-de-devoluciones','tratamiento-de-datos']);
const esc = value => String(value == null ? '' : value).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const str = value => String(value == null ? '' : value).trim();

function sourceFor(ruta) {
  if (GENERAL.has(ruta)) return ruta + '/index.html';
  if (/^guias\/[a-z0-9]+(?:-[a-z0-9]+)*$/.test(ruta)) return ruta + '.html';
  return null;
}
function expectedUrl(ruta) {
  return 'https://supgo.co/' + ruta + (GENERAL.has(ruta) ? '/' : '.html');
}
module.exports = async function pagina(req, res) {
  const ruta = typeof req.query.ruta === 'string' ? req.query.ruta : '';
  const source = sourceFor(ruta);
  if (!source) return res.status(404).send('Página no encontrada');
  try {
    const file = path.join(process.cwd(), source);
    if (!fs.existsSync(file)) return res.status(404).send('Página no encontrada');
    const html = fs.readFileSync(file,'utf8');
    const query = new URLSearchParams({select:'ruta,titulo_seo,meta_descripcion,canonical_url,indexable,og_titulo,og_descripcion,og_imagen,datos_estructurados',ruta:'eq.' + ruta,limit:'2'});
    const response = await fetch(SB + 'lift_pagina_seo?' + query, {headers:{apikey:KEY,Accept:'application/json'},signal:AbortSignal.timeout(9000)});
    if (!response.ok) throw Error('Supabase SEO HTTP ' + response.status);
    const rows = await response.json();
    if (rows.length !== 1) throw Error('SEO de página ausente o duplicado: ' + ruta);
    const seo = rows[0];
    if (!str(seo.titulo_seo) || !str(seo.meta_descripcion) || seo.canonical_url !== expectedUrl(ruta)) {
      throw Error('Metadatos de página incompletos o canonical incorrecto: ' + ruta);
    }
    const headEnd = html.search(/<\/head\s*>/i);
    if (headEnd < 0) throw Error('Plantilla sin head: ' + ruta);
    let head = html.slice(0, headEnd);
    const rest = html.slice(headEnd);
    head = head.replace(/<title\b[^>]*>[\s\S]*?<\/title\s*>/gi, '');
    head = head.replace(/<meta\b(?=[^>]*\b(?:name|property)\s*=\s*["'](?:description|robots|og:[^"']+|twitter:[^"']+)["'])[^>]*>/gi, '');
    head = head.replace(/<link\b(?=[^>]*\brel\s*=\s*["']canonical["'])[^>]*>/gi, '');
    const title = str(seo.titulo_seo);
    const meta = str(seo.meta_descripcion);
    const canonical = str(seo.canonical_url);
    const ogTitle = str(seo.og_titulo) || title;
    const ogMeta = str(seo.og_descripcion) || meta;
    const image = str(seo.og_imagen);
    const tags = [
      '<title>' + esc(title) + '</title>',
      '<meta name="description" content="' + esc(meta) + '">',
      '<meta name="robots" content="' + (seo.indexable === false ? 'noindex, follow' : 'index, follow') + '">',
      '<link rel="canonical" href="' + esc(canonical) + '">',
      '<meta property="og:type" content="' + (ruta.startsWith('guias/') ? 'article' : 'website') + '">',
      '<meta property="og:site_name" content="SUPGO">',
      '<meta property="og:locale" content="es_CO">',
      '<meta property="og:title" content="' + esc(ogTitle) + '">',
      '<meta property="og:description" content="' + esc(ogMeta) + '">',
      '<meta property="og:url" content="' + esc(canonical) + '">',
      '<meta name="twitter:card" content="' + (image ? 'summary_large_image' : 'summary') + '">',
      '<meta name="twitter:title" content="' + esc(ogTitle) + '">',
      '<meta name="twitter:description" content="' + esc(ogMeta) + '">'
    ];
    if (/^https:\/\//.test(image)) {
      tags.push('<meta property="og:image" content="' + esc(image) + '">');
      tags.push('<meta name="twitter:image" content="' + esc(image) + '">');
    }
    // El JSON-LD heredado del HTML no se publica: la fuente es Supabase.
    head = head.replace(/<script\b(?=[^>]*\btype=["']application\/ld\+json["'])[^>]*>[\s\S]*?<\/script\s*>/gi, '');
    if (seo.datos_estructurados && typeof seo.datos_estructurados === 'object') {
      tags.push('<script type="application/ld+json">' + JSON.stringify(seo.datos_estructurados).replace(/</g,'\\u003c') + '</script>');
    }
    res.setHeader('Content-Type','text/html; charset=utf-8');
    res.setHeader('Cache-Control','public, s-maxage=300, stale-while-revalidate=600');
    return res.status(200).send(head + tags.join('\n') + rest);
  } catch(error) {
    console.error('SUPGO pagina SEO:', error.message);
    return res.status(503).send('No se pudo cargar la página.');
  }
};

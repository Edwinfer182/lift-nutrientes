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
  if (ruta === 'home') return 'https://supgo.co/';
  return 'https://supgo.co/' + ruta + (GENERAL.has(ruta) ? '/' : '.html');
}
// La tienda vive en la raíz. En Supabase la fila 'home' puede seguir con /home/: se acepta y se publica "/".
const canonicalOk = (ruta, url) => url === expectedUrl(ruta) || (ruta === 'home' && url === 'https://supgo.co/home/');
// Parámetros que la página principal atiende por sí misma o que solo son de medición.
const PARAMS_HOME = /^(utm_.*|fbclid|gclid|gbraid|wbraid|msclkid|ttclid|igshid|_ga|ref|diag)$/i;
// Enlaces antiguos a la raíz con consultas (?admin=lift, ?pedido=, ?producto=...): mismo destino que antes.
const ENRUTADOR_RAIZ = "<script>(function(){var q=new URLSearchParams(location.search);" +
  "if((q.get('admin')||'').toLowerCase()==='lift'){location.replace('/admin.html?admin=lift');return;}" +
  "if(q.has('pedido')||q.has('mi-pedido')){location.replace('/mi-pedido/'+location.search+location.hash);return;}" +
  "if(Array.from(q.keys()).some(function(k){return !" + PARAMS_HOME.toString() + ".test(k);})){location.replace('/admin.html'+location.search+location.hash);}" +
  "})();</script>";
module.exports = async function pagina(req, res) {
  const ruta = typeof req.query.ruta === 'string' ? req.query.ruta : '';
  if (ruta === 'home' && req.query.desde === 'home') {
    // /home/ → / (301) conservando ?ref=, utm_ y demás parámetros.
    const q = new URLSearchParams();
    for (const [k, v] of Object.entries(req.query)) {
      if (k === 'ruta' || k === 'desde') continue;
      for (const x of [].concat(v)) q.append(k, x);
    }
    const qs = q.toString();
    res.setHeader('Cache-Control', 'public, s-maxage=86400');
    return res.redirect(301, '/' + (qs ? '?' + qs : ''));
  }
  const source = sourceFor(ruta);
  if (!source) return res.status(404).send('Página no encontrada');
  try {
    const file = path.join(process.cwd(), source);
    if (!fs.existsSync(file)) return res.status(404).send('Página no encontrada');
    const html = fs.readFileSync(file,'utf8');
    const query = new URLSearchParams({select:'ruta,titulo_seo,meta_descripcion,canonical_url,indexable,og_titulo,og_descripcion,og_imagen,datos_estructurados,contenido_seo_html',ruta:'eq.' + ruta,limit:'2'});
    const response = await fetch(SB + 'lift_pagina_seo?' + query, {headers:{apikey:KEY,Accept:'application/json'},signal:AbortSignal.timeout(9000)});
    if (!response.ok) throw Error('Supabase SEO HTTP ' + response.status);
    const rows = await response.json();
    if (rows.length !== 1) throw Error('SEO de página ausente o duplicado: ' + ruta);
    const seo = rows[0];
    if (!str(seo.titulo_seo) || !str(seo.meta_descripcion) || !canonicalOk(ruta, seo.canonical_url)) {
      throw Error('Metadatos de página incompletos o canonical incorrecto: ' + ruta);
    }
    const headEnd = html.search(/<\/head\s*>/i);
    if (headEnd < 0) throw Error('Plantilla sin head: ' + ruta);
    let head = html.slice(0, headEnd);
    if (ruta === 'home') head = head.replace(/<head\b[^>]*>/i, m => m + ENRUTADOR_RAIZ);
    let rest = html.slice(headEnd);
    if (ruta.startsWith('guias/')) {
      const body = str(seo.contenido_seo_html);
      if (!/^<main\b[^>]*>[\s\S]*<\/main>$/i.test(body)) throw Error('Contenido HTML de guía ausente o incompleto en Supabase: '+ruta);
      if (!/<main\b[^>]*>[\s\S]*?<\/main>/i.test(rest)) throw Error('Plantilla de guía sin <main>: '+ruta);
      rest = rest.replace(/<main\b[^>]*>[\s\S]*?<\/main>/i, body);
    }
    head = head.replace(/<title\b[^>]*>[\s\S]*?<\/title\s*>/gi, '');
    head = head.replace(/<meta\b(?=[^>]*\b(?:name|property)\s*=\s*["'](?:description|robots|og:[^"']+|twitter:[^"']+)["'])[^>]*>/gi, '');
    head = head.replace(/<link\b(?=[^>]*\brel\s*=\s*["']canonical["'])[^>]*>/gi, '');
    const title = str(seo.titulo_seo);
    const meta = str(seo.meta_descripcion);
    const canonical = expectedUrl(ruta);
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

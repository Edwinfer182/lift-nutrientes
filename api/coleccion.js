/* SUPGO: página dinámica compartida para todas las categorías y laboratorios.
   Mantiene HTML inicial indexable y deja las tarjetas interactivas a supgo-pages.js.
   Los textos editados en Supabase (lift_coleccion_seo) mandan; cuando son la plantilla
   genérica, se reemplazan por textos calculados con los productos reales de la colección. */
const fs = require('node:fs');
const path = require('node:path');
const { contextoCategoria } = require('./_seo-producto');
const SB = 'https://vdxkknftyssjyfbdieqa.supabase.co/rest/v1/';
const API_KEY = 'sb_publishable_ECuhXuKIb85kj9fgdEjrAw_O7uNpZsh';
const BASE = 'https://supgo.co';
const str = v => String(v == null ? '' : v).trim();
const esc = v => str(v).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const slugify = v => str(v).normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
const isTrue = v => v === true || v === 'true';
const cop = n => '$' + Math.round(n).toLocaleString('es-CO');
const cleanName = n => str(n).replace(/\s*-\s*copia\s*$/i, '').replace(/\s*[-–|·]\s*$/, '').replace(/\s{2,}/g, ' ');
const lista = arr => arr.length <= 1 ? arr.join('') : arr.slice(0, -1).join(', ') + ' y ' + arr[arr.length - 1];

// Categorías fusionadas (los productos ya se movieron en Supabase): 301 a la categoría nueva.
const FUSIONADAS = {
  'precursor-de-testoterona': '/categorias/precursores-de-testosterona/',
  'vitaminas': '/categorias/vitaminas-y-minerales/',
  'esenciales': '/categorias/vitaminas-y-minerales/',
  'aminoacidos': '/categorias/aminoacidos-y-recuperacion/',
  'melatoninas-y-nootropicos': '/categorias/sueno/'
};
// Con menos productos que esto, la página no se indexa (contenido demasiado escaso).
const MINIMO_INDEXABLE = 3;

let GUIAS = [];
try { GUIAS = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'guias', 'guias.json'), 'utf8')); } catch (e) {}

async function loadPage(offset) {
  const query = new URLSearchParams({
    select: 'id,slug,nombre,marca,categoria,activo,precio:product->>price,pres:product->>presentation,sabor:product->>flavor,del:product->>__deleted,priv:product->>__private,adm:product->>adminOnly,hid:product->>hidden,oculto:product->>oculto,vis:product->>visibility',
    activo: 'eq.true', order: 'id.asc', limit: '1000', offset: String(offset)
  });
  const resp = await fetch(SB + 'lift_productos?' + query, {
    headers: {apikey: API_KEY, Accept: 'application/json'}, signal: AbortSignal.timeout(12000)
  });
  if (!resp.ok) throw Error('Supabase HTTP ' + resp.status);
  return resp.json();
}
function publicRow(r) {
  return r && r.activo !== false && /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(str(r.slug))
    && str(r.nombre) && !isTrue(r.del) && !isTrue(r.priv)
    && !isTrue(r.adm) && !isTrue(r.hid) && !isTrue(r.oculto)
    && r.vis !== 'admin' && !['venom-pharma','lift-nutrientes'].includes(slugify(r.marca));
}
function servicios(r) {
  const m = (str(r.nombre) + ' ' + str(r.pres)).match(/(\d+)\s*(servicios|serv|srv|porciones|servings)\b/i);
  return m ? Number(m[1]) : 0;
}
// Cuenta valores (marca o categoría) y devuelve los más frecuentes.
function top(rows, campo, n) {
  const c = new Map();
  for (const r of rows) { const v = str(r[campo]); if (v && !/^varias marcas$|^sin laboratorio$/i.test(v)) c.set(v, (c.get(v) || 0) + 1); }
  return [...c].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0], 'es')).slice(0, n);
}

const GENERICA = /^explora .+ en supgo medell[ií]n\b/i;

function textos(tipo, label, rows, seo) {
  const precios = rows.map(r => Number(r.precio) || 0).filter(n => n > 0);
  const min = precios.length ? Math.min(...precios) : 0, max = precios.length ? Math.max(...precios) : 0;
  const rango = min ? (min === max ? ' a ' + cop(min) : ' desde ' + cop(min) + ' hasta ' + cop(max)) : '';
  const marcas = top(rows, 'marca', 4).map(x => x[0]);
  const cats = top(rows, 'categoria', 3).map(x => x[0].toLowerCase());
  let h1 = str(seo.h1), intro = str(seo.introduccion), title = str(seo.titulo_seo), meta = str(seo.meta_descripcion);
  if (tipo === 'laboratorio') {
    if (!h1 || h1.toLowerCase() === label.toLowerCase()) h1 = 'Suplementos ' + label + ' en Medellín';
    if (!intro || GENERICA.test(intro)) intro = 'Productos ' + label + ' en SUPGO' +
      (cats.length ? ', sobre todo ' + lista(cats) : '') + '. Precios' + (rango || ' por consultar') + ', con envío en Medellín y a toda Colombia.';
    if (/^[^|]+ en medell[ií]n \| supgo$/i.test(title)) title = 'Suplementos ' + label + ' en Medellín: precios | SUPGO';
    if (!meta || GENERICA.test(meta)) meta = 'Compra suplementos ' + label + ' en SUPGO: ' + rows.length + ' productos' + (cats.length ? ' de ' + lista(cats) : '') + '. Precios' + rango + ', envíos a toda Colombia.';
  } else {
    if (!intro || GENERICA.test(intro)) intro = label + (marcas.length ? ': marcas como ' + lista(marcas) : ' en SUPGO') +
      '. Precios' + (rango || ' por consultar') + ', con envío en Medellín y a toda Colombia.';
    if (!meta || GENERICA.test(meta)) meta = label + ' en SUPGO Medellín: ' + rows.length + ' productos' + (marcas.length ? ' de ' + lista(marcas.slice(0, 3)) : '') + '. Precios' + rango + ', envíos a toda Colombia.';
  }
  return { h1, intro, title, meta, min, max, marcas, cats };
}

function contenidoInferior(tipo, label, rows, t, slug) {
  const partes = [];
  const otro = tipo === 'categoria' ? 'marca' : 'categoria';
  const destino = tipo === 'categoria' ? 'laboratorios' : 'categorias';
  const grupos = top(rows, otro, 8);
  // Precio por servicio: solo con datos de servicios en el nombre o la presentación.
  const conServ = rows.map(r => ({ r, s: servicios(r), p: Number(r.precio) || 0 })).filter(x => x.s > 1 && x.p > 0)
    .map(x => ({ ...x, ps: x.p / x.s })).sort((a, b) => a.ps - b.ps);
  const resumen = [];
  resumen.push('<li><strong>Presentaciones disponibles (incluye sabores):</strong> ' + rows.length + '</li>');
  if (t.min) resumen.push('<li><strong>Rango de precios:</strong> ' + (t.min === t.max ? cop(t.min) : cop(t.min) + ' a ' + cop(t.max)) + '</li>');
  if (grupos.length) resumen.push('<li><strong>' + (tipo === 'categoria' ? 'Marcas' : 'Categorías') + ' con más referencias:</strong> ' +
    grupos.slice(0, 4).map(([v, n]) => '<a href="/' + destino + '/' + esc(slugify(v)) + '/">' + esc(v) + '</a> (' + n + ')').join(', ') + '</li>');
  if (conServ.length >= 3) resumen.push('<li><strong>Menor precio por servicio:</strong> <a href="/producto/' + esc(conServ[0].r.slug) + '/">' + esc(cleanName(conServ[0].r.nombre)) + '</a>, unos ' + cop(conServ[0].ps) + ' por servicio</li>');
  partes.push('<h2>' + esc(label) + ' en SUPGO</h2><ul>' + resumen.join('') + '</ul>');

  const ctx = tipo === 'categoria' ? contextoCategoria(label) : contextoCategoria(t.cats.join(' '));
  if (ctx) partes.push('<h3>Cómo elegir</h3><p>' + esc(ctx) + '</p>');

  const guias = GUIAS.filter(g => tipo === 'categoria' ? (g.categorias || []).includes(slug) : (g.marcas || []).includes(slug)).slice(0, 4);
  if (guias.length) partes.push('<h3>Guías de compra</h3><ul>' + guias.map(g => '<li><a href="' + esc(g.url) + '">' + esc(g.titulo) + '</a>' + (g.resumen ? ' — ' + esc(g.resumen) : '') + '</li>').join('') + '</ul>');

  const faq = [];
  if (t.min) faq.push(['¿Cuánto cuestan los productos de ' + (tipo === 'categoria' ? label.toLowerCase() : label) + ' en SUPGO?',
    'Hoy los precios van ' + (t.min === t.max ? 'en ' + cop(t.min) : 'de ' + cop(t.min) + ' a ' + cop(t.max)) + ', según presentación y tamaño. Las ofertas vigentes aparecen marcadas en cada producto.']);
  faq.push(['¿Hacen envíos fuera de Medellín?', 'Sí. En Medellín y el área metropolitana, los pedidos confirmados antes de las 2:00 p. m. pueden salir el mismo día según cobertura. A otras ciudades de Colombia la entrega estimada es de 1 a 3 días hábiles después de generar la guía.']);
  faq.push(['¿Cómo puedo pagar?', 'Por transferencia Bre-B, por corresponsal bancario o con tarjeta a través de Bold cuando esté disponible en el checkout. El pedido se prepara cuando se confirma el pago.']);
  partes.push('<h3>Preguntas frecuentes</h3>' + faq.map(([q, a]) => '<h4>' + esc(q) + '</h4><p>' + esc(a) + '</p>').join(''));
  return '<section class="coleccion-info" aria-label="Información de ' + esc(label) + '">' + partes.join('') + '</section>';
}

module.exports = async function handler(req, res) {
  const tipo = req.query.tipo === 'categoria' ? 'categoria' : req.query.tipo === 'laboratorio' ? 'laboratorio' : '';
  const requested = typeof req.query.slug === 'string' ? req.query.slug : '';
  if (!tipo || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(requested)) return res.status(404).send('Página no encontrada');
  try {
    const templateName = tipo === 'categoria' ? 'categorias/plantilla.html' : 'laboratorios/plantilla.html';
    const template = fs.readFileSync(path.join(process.cwd(), templateName), 'utf8');
    const [one, two, familias, meds] = await Promise.all([loadPage(0), loadPage(1000),
      fetch(SB + 'lift_familias_publicas?select=producto_id,slug,nombre&limit=5000', { headers: {apikey: API_KEY, Accept: 'application/json'}, signal: AbortSignal.timeout(9000) }).then(r => r.ok ? r.json() : []).catch(() => []),
      fetch(SB + 'lift_seo_bloqueos?select=producto_id&grupo=eq.medicamento', {
      headers: {apikey: API_KEY, Accept: 'application/json'}, signal: AbortSignal.timeout(9000)
    }).then(r => r.ok ? r.json() : []).catch(() => [])]);
    // Medicamentos con fórmula médica: no se enlazan ni se listan en el HTML que lee Google.
    const medicamentos = new Set(meds.map(m => String(m.producto_id)));
    const records = one.concat(two).filter(publicRow).filter(r => !medicamentos.has(String(r.id)));
    const field = tipo === 'categoria' ? 'categoria' : 'marca';
    const rows = records.filter(r => slugify(r[field]) === requested);
    if (tipo === 'categoria') {
      let destino = FUSIONADAS[requested];
      // Categoría que en realidad es una marca (todos sus productos son de esa marca): ir a la página de la marca.
      if (!destino && rows.length && rows.every(r => slugify(r.marca) === requested)) destino = '/laboratorios/' + requested + '/';
      if (destino) { res.setHeader('Cache-Control', 'public, s-maxage=86400'); return res.redirect(301, destino); }
    }
    if (!rows.length) return res.status(404).send('Página no encontrada');
    rows.sort((a, b) => str(a.nombre).localeCompare(str(b.nombre), 'es'));
    const label = str(rows[0][field]);
    const isCategory = tipo === 'categoria';
    const base = isCategory ? 'categorias' : 'laboratorios';
    const canonical = BASE + '/' + base + '/' + requested + '/';
    const seoQuery = new URLSearchParams({select:'tipo,slug,titulo_seo,meta_descripcion,h1,introduccion,canonical_url,indexable,datos_estructurados',tipo:'eq.'+tipo,slug:'eq.'+requested,limit:'2'});
    const seoResp = await fetch(SB + 'lift_coleccion_seo?' + seoQuery, {
      headers:{apikey:API_KEY,Accept:'application/json'}, signal:AbortSignal.timeout(9000)
    });
    if (!seoResp.ok) throw Error('Supabase SEO HTTP ' + seoResp.status);
    const seoRows = await seoResp.json();
    if (seoRows.length > 1) throw Error('SEO de colección duplicado: '+tipo+'/'+requested);
    const seo = seoRows[0] || {};
    if (seoRows.length && seo.canonical_url !== canonical) throw Error('Canonical de colección incorrecto: '+tipo+'/'+requested);
    const t = textos(tipo, label, rows, seo);
    if (!t.title) t.title = (isCategory ? label : 'Suplementos ' + label) + ' en Medellín | SUPGO';
    if (!t.h1) t.h1 = label;
    const indexable = seoRows.length === 1 && seo.indexable !== false && rows.length >= MINIMO_INDEXABLE;

    // Productos variables: un solo enlace al producto padre en vez de uno por sabor o tamaño.
    const famById = new Map(familias.map(f => [String(f.producto_id), f]));
    const enlaces = [], vistos = new Set();
    for (const r of rows) {
      const f = famById.get(String(r.id)), url = f ? f.slug : r.slug;
      if (vistos.has(url)) continue; vistos.add(url);
      enlaces.push({ slug: url, nombre: f ? f.nombre : cleanName(r.nombre) });
    }
    const initial = '<ul class="seo-productos">' + enlaces.map(r =>
      '<li><a href="/producto/' + esc(r.slug) + '/">' + esc(r.nombre) + '</a></li>'
    ).join('') + '</ul>';
    const crumbs = [['Inicio', BASE + '/'], [isCategory ? 'Categorías' : 'Marcas', BASE + '/' + base + '/'], [label, canonical]];
    const breadcrumb = '<nav class="migas" aria-label="Ruta de navegación">' + crumbs.map(([n, u], i) =>
      i === crumbs.length - 1 ? '<span aria-current="page">' + esc(n) + '</span>' : '<a href="' + esc(u.replace(BASE, '') || '/') + '">' + esc(n) + '</a>'
    ).join('<span aria-hidden="true">›</span>') + '</nav>';
    const schema = [{'@context':'https://schema.org','@type':'CollectionPage',name:t.h1,url:canonical,description:t.meta,
      mainEntity:{'@type':'ItemList',numberOfItems:enlaces.length,itemListElement:enlaces.map((r,i)=>({
        '@type':'ListItem',position:i+1,name:r.nombre,url:BASE+'/producto/'+r.slug+'/'
      }))}},
      {'@context':'https://schema.org','@type':'BreadcrumbList',itemListElement:crumbs.map(([n,u],i)=>({'@type':'ListItem',position:i+1,name:n,item:u}))}];
    if (seo.datos_estructurados && typeof seo.datos_estructurados === 'object' && !Array.isArray(seo.datos_estructurados)) Object.assign(schema[0],seo.datos_estructurados);
    let html = template.replace('<meta name="robots" content="noindex, follow">', '<meta name="robots" content="' + (indexable ? 'index, follow' : 'noindex, follow') + '">');
    const replacements = {
      '@@TITLE@@':esc(t.title), '@@DESCRIPTION@@':esc(t.meta), '@@CANONICAL@@':esc(canonical),
      '@@HEADING@@':esc(t.h1), '@@INTRO@@':esc(t.intro), '@@SLUG@@':esc(requested),
      '@@BREADCRUMB@@':breadcrumb, '@@COUNT@@':rows.length + (rows.length === 1 ? ' producto' : ' productos'),
      '@@BOTTOM@@':contenidoInferior(tipo, label, rows, t, requested),
      '@@INITIAL_PRODUCTS@@':initial, '@@STRUCTURED_DATA@@':JSON.stringify(schema).replace(/</g,'\\u003c')
    };
    for (const [token,value] of Object.entries(replacements)) html = html.replaceAll(token,value);
    res.setHeader('Content-Type','text/html; charset=utf-8');
    res.setHeader('Cache-Control','public, s-maxage=300, stale-while-revalidate=600');
    return res.status(200).send(html);
  } catch (error) {
    console.error('SUPGO colección dinámica:', error.message);
    return res.status(503).send('No fue posible cargar la colección. Intenta de nuevo.');
  }
};

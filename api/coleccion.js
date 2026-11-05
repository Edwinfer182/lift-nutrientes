/* SUPGO: página dinámica compartida para todas las categorías y laboratorios.
   Mantiene HTML inicial indexable y deja las tarjetas interactivas a supgo-pages.js. */
const fs = require('node:fs');
const path = require('node:path');
const SEO = require('./colecciones-seo.json');
const SB = 'https://vdxkknftyssjyfbdieqa.supabase.co/rest/v1/';
const API_KEY = 'sb_publishable_ECuhXuKIb85kj9fgdEjrAw_O7uNpZsh';
const str = v => String(v == null ? '' : v).trim();
const esc = v => str(v).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const slugify = v => str(v).normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
const isTrue = v => v === true || v === 'true';
async function loadPage(offset) {
  const query = new URLSearchParams({
    select: 'id,slug,nombre,marca,categoria,activo,del:product->>__deleted,priv:product->>__private,adm:product->>adminOnly,hid:product->>hidden,oculto:product->>oculto,vis:product->>visibility',
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
module.exports = async function handler(req, res) {
  const tipo = req.query.tipo === 'categoria' ? 'categoria' : req.query.tipo === 'laboratorio' ? 'laboratorio' : '';
  const requested = typeof req.query.slug === 'string' ? req.query.slug : '';
  if (!tipo || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(requested)) return res.status(404).send('Página no encontrada');
  try {
    const templateName = tipo === 'categoria' ? 'categorias/plantilla.html' : 'laboratorios/plantilla.html';
    const template = fs.readFileSync(path.join(process.cwd(), templateName), 'utf8');
    const [one, two] = await Promise.all([loadPage(0), loadPage(1000)]);
    const records = one.concat(two).filter(publicRow);
    const field = tipo === 'categoria' ? 'categoria' : 'marca';
    const rows = records.filter(r => slugify(r[field]) === requested);
    if (!rows.length) return res.status(404).send('Página no encontrada');
    rows.sort((a, b) => str(a.nombre).localeCompare(str(b.nombre), 'es'));
    const label = str(rows[0][field]);
    const isCategory = tipo === 'categoria';
    const base = isCategory ? 'categorias' : 'laboratorios';
    const canonical = 'https://supgo.co/' + base + '/' + requested + '/';
    const custom = SEO[tipo + '/' + requested] || {};
    const title = str(custom.title || (isCategory ? label + ' en Medellín | SUPGO' : 'Suplementos ' + label + ' en Medellín | SUPGO')).slice(0, 100);
    const desc = str(custom.meta || ((isCategory ? 'Encuentra ' + label + ' en SUPGO: ' : 'Compra productos de ' + label + ' en SUPGO: ')
      + rows.length + ' referencias disponibles. Consulta precios y presentaciones con envíos desde Medellín a Colombia.'));
    const heading = str(custom.h1 || label);
    const intro = str(custom.intro || desc);
    const initial = '<ul class="seo-productos">' + rows.slice(0, 80).map(r =>
      '<li><a href="/producto/' + esc(r.slug) + '/">' + esc(r.nombre) + '</a></li>'
    ).join('') + '</ul>';
    const schema = {'@context':'https://schema.org','@type':'CollectionPage',name:label,url:canonical,description:desc,
      mainEntity:{'@type':'ItemList',numberOfItems:rows.length,itemListElement:rows.slice(0,50).map((r,i)=>({
        '@type':'ListItem',position:i+1,name:str(r.nombre),url:'https://supgo.co/producto/'+r.slug+'/'
      }))}};
    let html = template.replace('<meta name="robots" content="noindex, follow">', '<meta name="robots" content="index, follow">');
    const replacements = {
      '@@TITLE@@':esc(title), '@@DESCRIPTION@@':esc(desc), '@@CANONICAL@@':esc(canonical),
      '@@HEADING@@':esc(heading), '@@INTRO@@':esc(intro), '@@SLUG@@':esc(requested),
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

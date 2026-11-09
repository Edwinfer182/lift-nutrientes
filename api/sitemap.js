/* SUPGO · XML sitemaps basados exclusivamente en datos actuales de Supabase.
 * No crea páginas ni edita metadatos. Fallos de lectura producen 503, nunca un sitemap vacío. */
'use strict';
const API = 'https://vdxkknftyssjyfbdieqa.supabase.co/rest/v1/';
const KEY = 'sb_publishable_ECuhXuKIb85kj9fgdEjrAw_O7uNpZsh';
const BASE = 'https://supgo.co';
const VALID = new Set(['index','productos','categorias','laboratorios','paginas','guias']);
const EDITORIAL = new Set(['home','categorias','laboratorios','ofertas','guias','politica-de-devoluciones','tratamiento-de-datos']);
const goodSlug = s => /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(String(s || ''));
const norm = s => String(s || '').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'');
const yes = value => value === true || value === 'true';
const esc = s => String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&apos;'}[c]));
const day = value => {
  if (!value) return null;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d.toISOString().slice(0,10);
};
const headers = {apikey:KEY, Accept:'application/json'};
async function request(table, query) {
  const url = API + table + '?' + new URLSearchParams(query).toString();
  const r = await fetch(url,{headers,signal:AbortSignal.timeout(14000)});
  if (!r.ok) throw new Error(table+' HTTP '+r.status);
  const json = await r.json();
  if (!Array.isArray(json)) throw new Error('Respuesta inválida de '+table);
  return json;
}
async function all(table, select, extra) {
  const out = [];
  for (let offset=0;offset<20000;offset+=800) {
    const batch = await request(table,{select,...extra,limit:'800',offset:String(offset)});
    out.push(...batch);
    if (batch.length<800) return out;
  }
  throw new Error('Límite de paginación excedido: '+table);
}
function publicProduct(p) {
  // Fichas duplicadas ("… - Copia") no se publican: redirigen a la original o quedan noindex.
  return p.activo === true && goodSlug(p.slug) && String(p.nombre||'').trim() &&
    !/\s-\s*copia\s*$/i.test(String(p.nombre||'')) && !/-copia(?:-\d+)?$/.test(p.slug) &&
    !yes(p.del) && !yes(p.priv) && !yes(p.adm) && !yes(p.hid) &&
    !yes(p.oculto) && p.vis !== 'admin' &&
    !['venom-pharma','lift-nutrientes'].includes(norm(p.marca));
}
function entry(url, modified) {
  return '<url><loc>'+esc(url)+'</loc>'+(day(modified)?'<lastmod>'+day(modified)+'</lastmod>':'')+'</url>';
}
function document(entries) {
  return '<?xml version="1.0" encoding="UTF-8"?>\n'+
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'+
    entries.join('\n')+'\n</urlset>\n';
}
const index = () => '<?xml version="1.0" encoding="UTF-8"?>\n'+
  '<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'+
  ['productos','categorias','laboratorios','paginas','guias'].map(t=>
    '<sitemap><loc>'+BASE+'/sitemap-'+t+'.xml</loc></sitemap>').join('\n')+
  '\n</sitemapindex>\n';
function expectPageUrl(route) {
  if (EDITORIAL.has(route)) return BASE+'/'+route+'/';
  if (/^guias\/[a-z0-9]+(?:-[a-z0-9]+)*$/.test(route)) return BASE+'/'+route+'.html';
  return null;
}
async function productItems() {
  const [products,seo,brands,blocks,familias] = await Promise.all([
    all('lift_productos','id,slug,nombre,marca,activo,updated_at,del:product->>__deleted,priv:product->>__private,adm:product->>adminOnly,hid:product->>hidden,oculto:product->>oculto,vis:product->>visibility',{activo:'eq.true',order:'id.asc'}),
    all('lift_producto_seo','producto_id,titulo_seo,meta_descripcion,canonical_url,indexable,actualizado_en',{order:'producto_id.asc'}),
    all('lift_seo_marcas','marca,habilitada',{}),
    all('lift_seo_bloqueos','producto_id',{}),
    all('lift_familias_publicas','producto_id,slug',{})
  ]);
  // Productos variables: sus sabores y tamaños no tienen URL propia; se publica la del producto padre.
  const famById = new Map(familias.map(f=>[String(f.producto_id),f.slug]));
  const padres = new Map();
  const seoById = new Map(seo.map(s=>[String(s.producto_id),s]));
  const validBrands = new Map();
  for (const b of brands) {
    const name = String(b.marca||'').trim().toLocaleLowerCase('es');
    if (validBrands.has(name)) validBrands.set(name,false); // Marca duplicada: no afirmar que es indexable.
    else validBrands.set(name,b.habilitada === true);
  }
  const blocked = new Set(blocks.map(b=>String(b.producto_id)));
  const grouped = new Map();
  for(const p of products) {
    if(!publicProduct(p)) continue;
    const fam = famById.get(String(p.id));
    if (fam) {
      if (blocked.has(String(p.id)) || validBrands.get(String(p.marca||'').trim().toLocaleLowerCase('es')) !== true) continue;
      const prev = padres.get(fam);
      if (!prev || day(p.updated_at) > day(prev.lastmod)) padres.set(fam, {url:BASE+'/producto/'+fam+'/',lastmod:p.updated_at});
      continue;
    }
    const s = seoById.get(String(p.id));
    const canonical = BASE+'/producto/'+p.slug+'/';
    if(!s || s.indexable === false || blocked.has(String(p.id)) ||
       validBrands.get(String(p.marca||'').trim().toLocaleLowerCase('es')) !== true ||
       !String(s.titulo_seo||'').trim() || !String(s.meta_descripcion||'').trim() ||
       s.canonical_url !== canonical) continue;
    const item = {url:canonical,lastmod:day(p.updated_at)>day(s.actualizado_en)?p.updated_at:s.actualizado_en};
    if(!grouped.has(p.slug)) grouped.set(p.slug,[]);
    grouped.get(p.slug).push(item);
  }
  for (const [slug,item] of padres) if (!grouped.has(slug)) grouped.set(slug,[item]);
  return [...grouped.values()].filter(arr=>arr.length===1).map(arr=>arr[0]);
}
async function collectionItems(type) {
  const [groups,products] = await Promise.all([
    all('lift_coleccion_seo','tipo,slug,canonical_url,titulo_seo,meta_descripcion,h1,indexable,actualizado_en',{tipo:'eq.'+type}),
    all('lift_productos','slug,nombre,marca,categoria,activo,del:product->>__deleted,priv:product->>__private,adm:product->>adminOnly,hid:product->>hidden,oculto:product->>oculto,vis:product->>visibility',{activo:'eq.true'})
  ]);
  const key = type==='categoria'?'categoria':'marca';
  // Igual que api/coleccion.js: menos de 3 productos = noindex; categoría que es solo una marca = 301.
  const counts = new Map(), brandsOf = new Map();
  for (const p of products.filter(publicProduct)) {
    const k = norm(p[key]); counts.set(k,(counts.get(k)||0)+1);
    if(!brandsOf.has(k)) brandsOf.set(k,new Set()); brandsOf.get(k).add(norm(p.marca));
  }
  const existing = new Set([...counts].filter(([k,n])=>n>=3 && !(type==='categoria' && brandsOf.get(k).size===1 && brandsOf.get(k).has(k))).map(([k])=>k));
  const base = type==='categoria'?'categorias':'laboratorios';
  return groups.filter(s=>goodSlug(s.slug) && s.indexable !== false &&
    existing.has(s.slug) && String(s.titulo_seo||'').trim() &&
    String(s.meta_descripcion||'').trim() && String(s.h1||'').trim() &&
    s.canonical_url === BASE+'/'+base+'/'+s.slug+'/')
    .map(s=>({url:s.canonical_url,lastmod:s.actualizado_en}));
}
async function editorialItems(guide) {
  const pages = await all('lift_pagina_seo','ruta,titulo_seo,meta_descripcion,canonical_url,indexable,actualizado_en',{});
  // La tienda se publica en la raíz (/); /home/ redirige allí.
  const url = p => p.ruta === 'home' ? BASE + '/' : expectPageUrl(p.ruta);
  const okCanonical = p => p.canonical_url === url(p) || (p.ruta === 'home' && p.canonical_url === BASE + '/home/');
  return pages.filter(p=>!!(guide?/^guias\/[a-z0-9]+(?:-[a-z0-9]+)*$/.test(p.ruta):EDITORIAL.has(p.ruta)) &&
    p.indexable !== false && String(p.titulo_seo||'').trim() &&
    String(p.meta_descripcion||'').trim() && okCanonical(p))
    .map(p=>({url:url(p),lastmod:p.actualizado_en}));
}
module.exports = async function handler(req,res) {
  const type = typeof req.query.tipo === 'string' ? req.query.tipo : '';
  if (req.method !== 'GET' && req.method !== 'HEAD') return res.status(405).send('Method Not Allowed');
  if(!VALID.has(type)) return res.status(404).send('Sitemap no encontrado');
  try {
    let xml;
    if(type==='index') xml=index();
    else {
      const rows = type==='productos' ? await productItems() :
        type==='categorias' ? await collectionItems('categoria') :
        type==='laboratorios' ? await collectionItems('laboratorio') :
        await editorialItems(type==='guias');
      if(!rows.length) throw new Error('Cero URLs válidas en '+type);
      rows.sort((a,b)=>a.url.localeCompare(b.url));
      xml=document(rows.map(r=>entry(r.url,r.lastmod)));
    }
    res.setHeader('Content-Type','application/xml; charset=utf-8');
    res.setHeader('Cache-Control','public, s-maxage=300, stale-while-revalidate=600');
    res.setHeader('X-Content-Type-Options','nosniff');
    return res.status(200).send(req.method==='HEAD'?'':xml);
  } catch(error) {
    console.error('SUPGO sitemap dinámico:',type,error.message);
    res.setHeader('Cache-Control','no-store');
    return res.status(503).send('Sitemap temporalmente no disponible');
  }
};

/* SUPGO · Ficha de producto dinámica (producto/index.html?slug=...).
   Carga el producto desde Supabase por su slug y dibuja la MISMA ficha que genera
   scripts/generar_paginas_seo.py (misma estructura, textos, datos estructurados y scripts).
   Cada función lleva el nombre de su equivalente en Python para mantenerlas iguales. */
(function () {
  'use strict';
  var D = JSON.parse(document.getElementById('ficha-plantilla').textContent);
  var BASE = D.base, SB = D.supabase, KEY = D.key, P = D.piezas, CT = D.contenido;
  var LABS = new Set(D.laboratorios), CATS = new Set(D.categorias);
  var root = document.getElementById('supgo-ficha');
  var MESES = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
  var ICON_CART = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.7 13.4a2 2 0 0 0 2 1.6h9.7a2 2 0 0 0 2-1.6L23 6H6"/></svg>';

  /* ---------- Equivalentes de Python ---------- */
  function T(v) { return !(v === null || v === undefined || v === false || v === 0 || v === '' || (Array.isArray(v) && !v.length) || (typeof v === 'object' && !Array.isArray(v) && !Object.keys(v).length)); }
  function or() { for (var i = 0; i < arguments.length; i++) if (T(arguments[i])) return arguments[i]; return arguments[arguments.length - 1]; }
  function str(v) { return v === null || v === undefined ? 'None' : v === true ? 'True' : v === false ? 'False' : String(v); }
  function esc(v) { return (T(v) ? String(v) : '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#x27;'); }
  function slug(s) {
    s = String(T(s) ? s : '').normalize('NFKD').replace(/[^\x00-\x7f]/g, '').toLowerCase();
    return s.replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '').slice(0, 110);
  }
  function unescapeHtml(s) { var t = document.createElement('textarea'); t.innerHTML = s; return t.value; }
  function plain(v) { return unescapeHtml(String(T(v) ? v : '').replace(/<[^>]*>/g, ' ')).replace(/\s+/g, ' ').trim(); }
  function fl(v) { /* float() de Python: NaN si no es convertible */
    if (v === null || v === undefined || typeof v === 'object') return NaN;
    if (typeof v === 'boolean') return v ? 1 : 0;
    var s = String(v).trim(); if (!s) return NaN;
    var n = Number(s.replace(/_/g, '')); return n;
  }
  function roundEven(x) { var f = Math.floor(x), d = x - f; if (d === 0.5) return f % 2 === 0 ? f : f + 1; return Math.round(x); }
  function fmt1(x) { /* f"{x:.1f}": redondeo al par en empates exactos */
    var y = x * 10;
    if (Number.isInteger(x * 4) && Math.abs(y - Math.trunc(y)) === 0.5) return (roundEven(y) / 10).toFixed(1);
    return x.toFixed(1);
  }
  function cop(n) { var v = roundEven(fl(T(n) ? n : 0) || 0); return '$ ' + String(Math.abs(v)).replace(/\B(?=(\d{3})+(?!\d))/g, '.').replace(/^/, v < 0 ? '-' : ''); }
  function g6(x) { /* f"{x:g}" */
    var s = Number(x).toPrecision(6);
    if (s.indexOf('e') >= 0) { var m = s.split('e'), e = +m[1]; return m[0].replace(/\.?0+$/, '') + 'e' + (e < 0 ? '-' : '+') + (Math.abs(e) < 10 ? '0' : '') + Math.abs(e); }
    return s.indexOf('.') >= 0 ? s.replace(/\.?0+$/, '') : s;
  }
  function quote(s) { return encodeURIComponent(s).replace(/[!'()*]/g, function (c) { return '%' + c.charCodeAt(0).toString(16).toUpperCase(); }).replace(/%2F/g, '/'); }
  function lower(s) { return String(s).toLowerCase(); }
  function cmp(a, b) { return a < b ? -1 : a > b ? 1 : 0; }
  function jsonLd(o) { return JSON.stringify(o).replace(/</g, '\\u003c'); }
  function parseIso(s) { /* datetime.fromisoformat; sin zona = UTC */
    s = String(s).trim().replace('Z', '+00:00').replace(' ', 'T');
    if (/^\d{4}-\d{2}-\d{2}$/.test(s)) s += 'T00:00:00';
    if (!/[+-]\d{2}:?\d{2}$/.test(s)) s += '+00:00';
    return Date.parse(s);
  }
  async function sha256hex(text) {
    var buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));
    return Array.from(new Uint8Array(buf)).map(function (b) { return b.toString(16).padStart(2, '0'); }).join('');
  }

  /* ---------- Supabase ---------- */
  var H = { apikey: KEY, Authorization: 'Bearer ' + KEY, Accept: 'application/json' };
  async function get(path) {
    var r = await fetch(SB + '/rest/v1/' + path, { headers: H });
    if (!r.ok) throw new Error('Supabase ' + r.status + ' en ' + path.split('?')[0]);
    return r.json();
  }
  async function all(path) {
    var out = [];
    for (var off = 0; ; off += 1000) {
      var page = await get(path + '&limit=1000&offset=' + off);
      out = out.concat(page); if (page.length < 1000) return out;
    }
  }
  var CAMPOS = ['name', 'nombre', 'brand', 'marca', 'category', 'categoria', 'flavor', 'sabor', 'presentation', 'presentacion', 'price', 'precio', 'image', 'imagen',
    'parent_id', 'producto_padre_id', 'id_padre_sabor', '__deleted', '__private', 'adminOnly', 'hidden', 'oculto'];
  async function catalogo() {
    var sel = 'id,activo,slug,' + CAMPOS.map(function (c) { return 'f' + CAMPOS.indexOf(c) + ':product->' + c; }).join(',');
    var rows = await all('lift_productos?select=' + sel + '&order=id.asc');
    return rows.map(function (r) {
      var p = {}; CAMPOS.forEach(function (c, i) { var v = r['f' + i]; if (v !== null && v !== undefined) p[c] = v; });
      return { id: r.id, activo: r.activo, slug: r.slug, product: p };
    });
  }
  async function config(clave) {
    var rows = await get('lift_catalog_config?select=valor&clave=eq.' + encodeURIComponent(clave) + '&limit=1');
    var v = rows[0] ? rows[0].valor : {}; if (typeof v === 'string') try { v = JSON.parse(v); } catch (e) { v = {}; }
    return v && typeof v === 'object' && !Array.isArray(v) ? v : {};
  }
  async function resenas() {
    try {
      var r = await fetch(SB + '/rest/v1/rpc/lift_resenas_publicas', { method: 'POST', headers: Object.assign({ 'Content-Type': 'application/json' }, H), body: '{}' });
      if (!r.ok) return {};
      var out = {};
      (await r.json() || []).forEach(function (x) {
        var stars = parseInt(x.estrellas || 0, 10);
        if (x.producto_id === null || x.producto_id === undefined || !(stars >= 1 && stars <= 5)) return;
        (out[String(x.producto_id)] = out[String(x.producto_id)] || []).push({ estrellas: stars, comentario: String(x.comentario || '').trim(), sabor: String(x.sabor || '').trim(),
          nombre: String(x.nombre_publico || 'Cliente').trim(), ciudad: String(x.ciudad || '').trim(), fecha: String(x.fecha || '').slice(0, 10) });
      });
      return out;
    } catch (e) { return {}; }
  }

  /* ---------- Reglas del generador ---------- */
  function allowed(row) {
    var p = row.product;
    if (!p || typeof p !== 'object' || !T(or(p.name, p.nombre))) return false;
    if (row.activo === false || T(p.__deleted) || T(p.__private) || T(p.adminOnly) || T(p.hidden) || T(p.oculto)) return false;
    return true;
  }
  function active_offer(row) {
    var o = row._offer; if (!o || typeof o !== 'object' || Array.isArray(o)) return null;
    var until = o.promoUntil;
    if (T(until)) { var t = parseIso(until); if (isFinite(t) && Date.now() > t) return null; }
    var catalog = fl(or(row.product.price, row.product.precio, 0)), sale = fl(o.price);
    if (!isFinite(catalog) || !isFinite(sale) || catalog <= 0 || sale <= 0 || sale >= catalog) return null;
    return [catalog, sale];
  }
  function offer_deadline(row) {
    var until = (row._offer || {}).promoUntil; if (!T(until)) return null;
    var t = parseIso(until); if (!isFinite(t)) return null;
    var b = new Date(t - 5 * 3600000), now = new Date(Date.now() - 5 * 3600000);
    if (b.getUTCFullYear() > now.getUTCFullYear() + 2) return null;
    return { year: b.getUTCFullYear(), month: b.getUTCMonth() + 1, day: b.getUTCDate() };
  }
  function seo_availability(row) {
    var p = row.product || {}, stock = p.stock;
    if (stock === true || (typeof stock === 'number' && stock > 0)) return 'https://schema.org/InStock';
    if (stock === false || (typeof stock === 'number' && stock <= 0)) return 'https://schema.org/OutOfStock';
    var state = lower(String(or(p.availability, p.status, p.estado, '')).trim());
    if (['instock', 'in_stock', 'disponible', 'available', 'en stock'].indexOf(state) >= 0) return 'https://schema.org/InStock';
    if (['outofstock', 'out_of_stock', 'agotado', 'sin stock', 'unavailable'].indexOf(state) >= 0) return 'https://schema.org/OutOfStock';
    if (row.activo === true) return 'https://schema.org/InStock';
    if (row.activo === false) return 'https://schema.org/OutOfStock';
    return null;
  }
  function merchant_policy(offer, settings) {
    var shipping = settings.shipping;
    if (Array.isArray(shipping)) {
      var details = [];
      shipping.forEach(function (entry) {
        if (!entry || typeof entry !== 'object') return;
        var country = String(or(entry.country, '')).trim(), currency = String(or(entry.currency, 'COP')).trim(), cost = entry.cost;
        if (!country || !currency || cost === null || cost === undefined) return;
        cost = fl(cost); if (!isFinite(cost) || cost < 0) return;
        var d = { '@type': 'OfferShippingDetails', shippingRate: { '@type': 'MonetaryAmount', value: cost, currency: currency }, shippingDestination: { '@type': 'DefinedRegion', addressCountry: country } };
        if (T(entry.region)) d.shippingDestination.addressRegion = entry.region;
        function rng(v) { return Array.isArray(v) && v.length === 2 && v.every(function (n) { return Number.isInteger(n) && n >= 0; }); }
        if (rng(entry.handling_days)) { d.deliveryTime = d.deliveryTime || { '@type': 'ShippingDeliveryTime' }; d.deliveryTime.handlingTime = { '@type': 'QuantitativeValue', minValue: entry.handling_days[0], maxValue: entry.handling_days[1], unitCode: 'DAY' }; }
        if (rng(entry.transit_days)) { d.deliveryTime = d.deliveryTime || { '@type': 'ShippingDeliveryTime' }; d.deliveryTime.transitTime = { '@type': 'QuantitativeValue', minValue: entry.transit_days[0], maxValue: entry.transit_days[1], unitCode: 'DAY' }; }
        details.push(d);
      });
      if (details.length) offer.shippingDetails = details;
    }
    var ret = settings.returns;
    if (ret && typeof ret === 'object' && T(ret.country) && T(ret.category)) {
      var ok = ['https://schema.org/MerchantReturnFiniteReturnWindow', 'https://schema.org/MerchantReturnNotPermitted', 'https://schema.org/MerchantReturnUnlimitedWindow'];
      if (ok.indexOf(ret.category) >= 0) {
        var pol = { '@type': 'MerchantReturnPolicy', applicableCountry: ret.country, returnPolicyCategory: ret.category };
        if (/FiniteReturnWindow$/.test(ret.category) && Number.isInteger(ret.days) && ret.days >= 0) pol.merchantReturnDays = ret.days;
        if (['https://schema.org/ReturnByMail', 'https://schema.org/ReturnInStore', 'https://schema.org/ReturnAtKiosk'].indexOf(ret.method) >= 0) pol.returnMethod = ret.method;
        if (['https://schema.org/FreeReturn', 'https://schema.org/ReturnFeesCustomerResponsibility', 'https://schema.org/ReturnShippingFees'].indexOf(ret.fees) >= 0) pol.returnFees = ret.fees;
        if (ret.category !== 'https://schema.org/MerchantReturnFiniteReturnWindow' || 'merchantReturnDays' in pol) offer.hasMerchantReturnPolicy = pol;
      }
    }
  }
  function info(item) {
    var p = item.product, name = String(or(p.name, p.nombre, ''));
    var promo = active_offer(item), regular = fl(or(p.price, p.precio, 0)); if (!isFinite(regular)) regular = 0;
    return { price: regular, sale: promo ? promo[1] : null, pct: promo ? roundEven((1 - promo[1] / promo[0]) * 100) : 0, until: promo ? (item._offer || {}).promoUntil : null,
      id: item.id, name: name, brand: String(or(p.brand, p.marca, '')), image: String(or(p.image, p.imagen, '')),
      url: BASE + '/productos/' + (slug(name) || 'producto') + '-' + item.id + '.html',
      label: String(or(p.flavor, p.sabor, p.presentation, p.presentacion, name)), on_offer: promo !== null };
  }
  function family_key(item) {
    var p = item.product, brand = slug(or(p.brand, p.marca, ''));
    var parent = String(or(p.parent_id, p.producto_padre_id, p.id_padre_sabor, '')).trim();
    if (parent) return ['parent', brand, parent];
    var name = slug(or(p.name, p.nombre, '')), flavor = slug(or(p.flavor, p.sabor, ''));
    if (flavor) {
      if (name.endsWith('-' + flavor)) name = name.slice(0, -(flavor.length + 1));
      else {
        var words = flavor.split('-');
        for (var c = words.length - 1; c > 0; c--) { var short = words.slice(0, c).join('-'); if (name.endsWith('-' + short)) { name = name.slice(0, -(short.length + 1)); break; } }
      }
    }
    return ['name', brand, name];
  }
  /* Familias de sabores (misma lógica y orden que main() del generador). */
  function familias(entries) {
    var fams = new Map(), keys = new Map();
    function k(key) { var s = JSON.stringify(key); if (!keys.has(s)) keys.set(s, key); return s; }
    entries.forEach(function (e) { var s = k(family_key(e.item)); if (!fams.has(s)) fams.set(s, []); fams.get(s).push(e.d); });
    entries.forEach(function (e) {
      var s = k(family_key(e.item)), key = keys.get(s);
      if (key[0] !== 'name' || fams.get(s).length !== 1) return;
      var ns = slug(e.d.name), possible = [];
      fams.forEach(function (v, ks) { var kk = keys.get(ks); if (ks !== s && kk[0] === 'name' && kk[1] === key[1] && v.length >= 2 && ns.startsWith(kk[2] + '-')) possible.push(ks); });
      if (possible.length) {
        var target = possible.reduce(function (a, b) { return keys.get(b)[2].length > keys.get(a)[2].length ? b : a; });
        fams.get(target).push(e.d); var arr = fams.get(s); arr.splice(arr.indexOf(e.d), 1);
      }
    });
    var byId = new Map(), keyOf = new Map();
    fams.forEach(function (v, s) { v.forEach(function (d) { byId.set(String(d.id), v); keyOf.set(v, keys.get(s)); }); });
    return { byId: byId, keyOf: keyOf };
  }
  async function _elegir(opciones, clave) { var h = await sha256hex(String(clave)); return opciones[Number(BigInt('0x' + h) % BigInt(opciones.length))]; }
  async function seleccionar(cands, clave, n) {
    var keyed = await Promise.all(cands.map(async function (c) { return [await sha256hex(clave + '-' + c.id), c]; }));
    keyed.sort(function (a, b) { return cmp(a[0], b[0]); });
    return keyed.slice(0, n).map(function (x) { return x[1]; });
  }

  /* ---------- seo_contenido.py ---------- */
  function grupo_de(categoria) { var c = slug(categoria); for (var g in CT.grupos) if (CT.grupos[g].indexOf(c) >= 0) return g; return 'capsulas'; }
  function es_delgada(texto, nombre) {
    texto = plain(texto); if (!texto) return true;
    if (/Encuentra .{3,200}? en Supgo\./i.test(texto)) return true;
    if (texto.indexOf('La ficha corresponde específicamente a') >= 0) return true;
    var words = texto.split(/\s+/).filter(Boolean).length;
    if (texto.indexOf('Revisa la presentación, ingredientes e instrucciones del fabricante antes de comprar') >= 0 && words < 150) return true;
    return words < 120;
  }
  function titulo_no_corresponde(titulo, nombre) {
    if (!titulo || !nombre) return false;
    var pal = slug(nombre).split('-').filter(function (w) { return w.length >= 3 && !/\d/.test(w); });
    if (!pal.length) return false;
    return slug(titulo).indexOf(pal[0]) < 0;
  }
  function titulo_seo(nombre, marca) {
    var base = nombre.trim();
    if (marca && slug(base).indexOf(slug(marca)) < 0) { var cm = base + ' ' + marca.trim(); if (cm.length + 8 <= 65) base = cm; }
    var t = base + ' | SUPGO';
    if (t.length > 70) t = base.slice(0, 62).replace(/[ \-|·]+$/, '') + ' | SUPGO';
    return t;
  }
  function meta_descripcion(nombre, marca, sabor, presentacion) {
    var et = !marca || slug(nombre).indexOf(slug(marca)) >= 0 ? nombre : nombre + ' de ' + marca;
    var extra = sabor && slug(nombre).indexOf(slug(sabor)) < 0 ? ' sabor ' + sabor : '';
    var opts = ['Compra ' + et + extra + ' en SUPGO Medellín. Consulta precio, presentaciones y disponibilidad. Envíos a Bogotá, Cali y toda Colombia.',
      'Compra ' + et + extra + ' en SUPGO Medellín. Precio actualizado y envíos a toda Colombia.', 'Compra ' + et + ' en SUPGO. Envíos a toda Colombia.'];
    for (var i = 0; i < opts.length; i++) if (opts[i].length <= 160) return opts[i];
    return ('Compra ' + et).slice(0, 120).trimEnd() + ' en SUPGO. Envíos a Colombia.';
  }
  var UNIDAD = { lb: 'lb', lbs: 'lb', libra: 'lb', libras: 'lb', kg: 'kg', kilo: 'kg', kilos: 'kg', g: 'g', gr: 'g', grs: 'g', grm: 'g', gramo: 'g', gramos: 'g', oz: 'oz' };
  function datos_presentacion(nombre, presentacion) {
    var texto = nombre + ' ' + (T(presentacion) ? presentacion : ''), d = {}, m;
    var B = '(?![A-Za-z0-9_À-ɏ])';
    if ((m = new RegExp('(\\d+(?:[.,]\\d+)?)\\s*(lbs?|libras?|kg|kilos?|grm|gramos?|grs?|g|oz)' + B, 'i').exec(texto))) d.contenido = m[1].replace('.', ',') + ' ' + (UNIDAD[m[2].toLowerCase()] || m[2].toLowerCase());
    if ((m = new RegExp('(\\d+)\\s*(servicios|servings?|serv|srv|ser|porciones?)' + B, 'i').exec(texto))) d.porciones = m[1];
    if ((m = new RegExp('(\\d+)\\s*(c[aá]psulas?|capsules?|caps?|cap|tabletas?|tablets?|tabs?|softgels?|gomitas?|gummies|sachets?|sobres?|unidades?|und|veg\\s*caps)' + B, 'i').exec(texto))) {
      var t = m[2].toLowerCase();
      t = /^(c|veg)/.test(t) ? 'cápsulas' : /^t/.test(t) ? 'tabletas' : /^soft/.test(t) ? 'cápsulas blandas' : /^(gom|gum)/.test(t) ? 'gomitas' : /^(sach|sob)/.test(t) ? 'sobres' : 'unidades';
      d.unidades = m[1] + ' ' + t;
    }
    return d;
  }
  function _lista_enlaces(items) { return '<ul>' + items.map(function (i) { return '<li><a href="' + esc(i.url) + '">' + esc(i.name) + '</a></li>'; }).join('') + '</ul>'; }
  async function descripcion_html(o) {
    var grupo = grupo_de(o.categoria), marca_txt = o.marca || 'su fabricante', cat_txt = o.categoria || 'suplementos', partes = [];
    var intro = (await _elegir(CT.intro[grupo], o.pid)).replace(/\{nombre\}/g, esc(o.nombre)).replace(/\{marca\}/g, esc(marca_txt)).replace(/\{categoria\}/g, esc(cat_txt.toLowerCase()));
    partes.push('<h2>' + esc(o.nombre) + '</h2><p>' + intro + ' Aquí puedes consultar el precio vigente, las presentaciones y los sabores disponibles antes de hacer tu pedido.</p>');
    var datos = datos_presentacion(o.nombre, o.presentacion), filas = [];
    if (o.marca) filas.push(['Marca', o.url_marca ? '<a href="' + esc(o.url_marca) + '">' + esc(o.marca) + '</a>' : esc(o.marca)]);
    if (o.categoria) filas.push(['Categoría', o.url_categoria ? '<a href="' + esc(o.url_categoria) + '">' + esc(o.categoria) + '</a>' : esc(o.categoria)]);
    if (T(o.presentacion) && String(o.presentacion).trim()) filas.push(['Presentación', esc(String(o.presentacion).trim())]);
    else if (datos.contenido) filas.push(['Contenido', esc(datos.contenido)]);
    if (datos.porciones) filas.push(['Porciones', esc(datos.porciones) + ' (según el nombre de la presentación)']);
    if (datos.unidades) filas.push(['Unidades', esc(datos.unidades)]);
    if (o.sabor && slug(o.sabor) !== slug(o.nombre)) filas.push(['Sabor', esc(o.sabor)]);
    if (filas.length) partes.push('<h3>Datos de esta presentación</h3><ul>' + filas.map(function (f) { return '<li><strong>' + f[0] + ':</strong> ' + f[1] + '</li>'; }).join('') + '</ul>');
    partes.push('<h3>Qué revisar antes de comprar</h3><ul>' + CT.revisar[grupo].map(function (x) { return '<li>' + esc(x) + '</li>'; }).join('') + '</ul>');
    var otros = o.variantes.filter(function (v) { return String(v.id) !== String(o.pid); });
    if (otros.length) partes.push('<h3>Otros sabores de esta presentación</h3>' + _lista_enlaces(otros.slice(0, 8)));
    if (o.mas_marca.length) {
      var cola = o.url_marca ? ' <a href="' + esc(o.url_marca) + '">Ver todos los productos ' + esc(o.marca) + '</a>.' : '';
      partes.push('<h3>Más productos ' + esc(o.marca) + '</h3>' + _lista_enlaces(o.mas_marca.slice(0, 4)) + (cola ? '<p>' + cola.trim() + '</p>' : ''));
    }
    if (o.alternativas.length) {
      var cola2 = o.url_categoria ? '<p><a href="' + esc(o.url_categoria) + '">Ver toda la categoría ' + esc(o.categoria) + '</a>.</p>' : '';
      partes.push('<h3>Otras opciones en ' + esc(cat_txt) + '</h3>' + _lista_enlaces(o.alternativas.slice(0, 4)) + cola2);
    }
    partes.push('<h3>Compra en Medellín y envíos a Colombia</h3><p>' + esc(await _elegir(CT.cierre, o.pid + '-cierre')) + '</p>');
    if (grupo !== 'accesorio' && grupo !== 'snack') partes.push('<p class="seo-leyenda"><small>' + esc(CT.leyenda) + '</small></p>');
    return '<div class="seo-auto" data-contenido="' + CT.version + '">' + partes.join('') + '</div>';
  }

  /* ---------- Bloques HTML del generador ---------- */
  function stars_html(n, size) { size = size || 16; return '<span role="img" aria-label="' + n + ' de 5 estrellas" style="color:#f5b301;font-size:' + size + 'px;letter-spacing:1px">' + '★'.repeat(n) + '<span style="color:#d9d9d9">' + '★'.repeat(5 - n) + '</span></span>'; }
  function review_date(d) { var m = /^(\d+)-(\d+)-(\d+)$/.exec(d || ''); if (!m || +m[2] < 1 || +m[2] > 12) return ''; return (+m[3]) + ' de ' + MESES[+m[2] - 1] + ' de ' + (+m[1]); }
  function reviews_html(items) {
    if (!items.length) return '';
    var avg = items.reduce(function (a, r) { return a + r.estrellas; }, 0) / items.length, shown = items.slice(0, 6);
    var cards = shown.map(function (r) {
      return '<li style="list-style:none;border:1px solid #ececec;border-radius:14px;padding:12px 14px">' + stars_html(r.estrellas, 15) + (r.comentario ? '<p style="margin:6px 0 4px;line-height:1.45">' + esc(r.comentario) + '</p>' : '') +
        '<small style="color:#6b7280;font-size:12px;display:block;margin-top:4px">' + esc(r.nombre) + (r.ciudad ? ' · ' + esc(r.ciudad) : '') + (r.sabor ? ' · Sabor: ' + esc(r.sabor) : '') + (review_date(r.fecha) ? ' · ' + review_date(r.fecha) : '') + ' · Compra verificada</small></li>';
    }).join('');
    var more = items.length > shown.length ? '<p style="color:#6b7280;font-size:13px;margin:10px 0 0">Mostramos las ' + shown.length + ' más recientes de ' + items.length + ' opiniones.</p>' : '';
    return '<section class="pi-reviews" id="opiniones" aria-label="Opiniones de clientes" style="margin:26px 0 0;padding-top:18px;border-top:1px solid #ececec">' +
      '<h2 style="margin:0 0 6px;font:600 19px/1.3 Poppins,Arial,sans-serif">Opiniones de clientes</h2>' +
      '<div style="display:flex;align-items:center;gap:10px;flex-wrap:wrap;margin:0 0 12px"><b style="font-size:28px;line-height:1">' + fmt1(avg).replace('.', ',') + '</b>' + stars_html(roundEven(avg), 20) + '<span style="color:#6b7280;font-size:13px">' + items.length + (items.length === 1 ? ' opinión' : ' opiniones') + ' de clientes que compraron en SUPGO</span></div>' +
      '<ul style="display:grid;gap:10px;margin:0;padding:0;grid-template-columns:repeat(auto-fill,minmax(260px,1fr))">' + cards + '</ul>' + more +
      '<p style="color:#9ca3af;font-size:11.5px;margin:10px 0 0">Opiniones de clientes con compra verificada, revisadas antes de publicarse. Reflejan experiencias de compra (sabor, presentación, envío); no son indicaciones de uso.</p></section>';
  }
  function rating_line(items) {
    if (!items.length) return '';
    var avg = items.reduce(function (a, r) { return a + r.estrellas; }, 0) / items.length;
    return '<a class="pi-rating" href="#opiniones" style="display:inline-flex;align-items:center;gap:6px;text-decoration:none;color:#374151;font-size:13px;margin:0 0 6px">' + stars_html(roundEven(avg), 15) + '<span>' + fmt1(avg).replace('.', ',') + ' · ' + items.length + (items.length === 1 ? ' opinión' : ' opiniones') + '</span></a>';
  }
  function related_card(v) {
    var regular = fl(T(v.price) ? v.price : 0) || 0, sale = v.sale;
    var photo = T(v.image) ? '<img src="' + esc(v.image) + '" alt="' + esc(v.name) + '" loading="lazy" decoding="async" width="160" height="160">' : '';
    var badge = T(sale) ? '<span class="rel-badge">-' + v.pct + '%</span>' : '', price, button;
    if (T(sale)) price = '<strong>' + cop(sale) + '</strong><del>' + cop(regular) + '</del>';
    else if (regular > 0) price = '<strong>' + cop(regular) + '</strong>';
    else price = '<strong class="rel-ask">Consultar precio</strong>';
    if (regular > 0) button = '<button type="button" class="rel-add" data-id="' + esc(v.id) + '" data-name="' + esc(v.name) + '" data-image="' + esc(v.image || '') + '" data-regular="' + Math.trunc(regular) + '"' +
      (T(sale) ? ' data-sale="' + Math.trunc(sale) + '" data-until="' + esc(v.until || '') + '"' : '') + '>' + ICON_CART + '<span>Agregar</span></button>';
    else button = '<a class="rel-add rel-ask-btn" href="https://wa.me/573137380766?text=' + esc(quote('Hola, quiero saber el precio de ' + v.name)) + '" target="_blank" rel="noopener">Consultar</a>';
    return '<article class="rel-card"><a class="rel-photo" href="' + esc(v.url) + '" tabindex="-1" aria-hidden="true">' + photo + badge + '</a>' +
      (T(v.brand) ? '<small class="rel-brand">' + esc(v.brand) + '</small>' : '') + '<a class="rel-name" href="' + esc(v.url) + '" title="' + esc(v.name) + '">' + esc(v.name) + '</a><div class="rel-price">' + price + '</div>' + button + '</article>';
  }
  function guides_html(pid, category) {
    var cat = slug(category), own = D.guias.filter(function (g) { return (g.productos || []).some(function (x) { return Number(x) === Number(pid); }); });
    D.guias.forEach(function (g) { if (cat && (g.categorias || []).indexOf(cat) >= 0 && own.indexOf(g) < 0) own.push(g); });
    if (!own.length) return '';
    return '<section class="pi-guides" aria-label="Guías de compra" style="margin:22px 0 0;padding-top:16px;border-top:1px solid #ececec"><h2 style="margin:0 0 10px;font:600 17px/1.3 Poppins,Arial,sans-serif">Guías de compra</h2><nav style="display:flex;flex-wrap:wrap;gap:8px">' +
      own.slice(0, 3).map(function (g) { return '<a href="' + esc(g.url) + '" style="border:1px solid #e2e2e2;border-radius:30px;padding:7px 13px;font-size:13px;text-decoration:none;color:inherit">' + esc(g.titulo) + '</a>'; }).join('') + '</nav></section>';
  }
  function local_seo(kind, name, description, links) {
    var clean = plain(description), a = function (l) { return '<a href="' + esc(l[0]) + '">' + esc(l[1]) + '</a>'; };
    var detail = clean ? '<p>' + esc(clean.slice(0, 650)) + '</p>' : '';
    if (kind === 'applied') {
      var cities = 'Medellín, Envigado, Itagüí, Bello, Sabaneta, Bogotá, Cali, Barranquilla, Cartagena y Bucaramanga';
      return '<section class="seo-local-applied"><h2>' + esc(name) + ' en Medellín y Colombia</h2>' +
        '<p>¿Buscas ' + esc(name) + ' de Applied Nutrition en Medellín? En SUPGO puedes consultar la presentación disponible, el precio vigente y las opciones de compra. Este producto forma parte del catálogo de la marca y su ficha muestra los datos publicados para ayudarte a comparar alternativas antes de realizar un pedido.</p>' +
        detail + '<h3>Comprar Applied Nutrition en Medellín</h3><p>Atendemos consultas de clientes de ' + esc(cities) + '. La disponibilidad, el costo del envío y los tiempos de entrega se confirman según el destino y el pedido. Para elegir correctamente, revisa el nombre, el tamaño, el sabor cuando aplique y las características que aparecen en la etiqueta del fabricante. No todas las presentaciones son equivalentes.</p>' +
        '<h3>Cómo elegir tu presentación</h3><p>Antes de comprar, compara el contenido neto, las porciones indicadas, los ingredientes y las recomendaciones de uso que figuren en el envase. Si buscas proteínas, creatina, snacks o productos para el entrenamiento, comprueba que la referencia sea la adecuada para tus preferencias y objetivos. Evita asumir que dos versiones de una misma línea tienen exactamente la misma composición.</p>' +
        '<h3>Más opciones de Applied Nutrition</h3><p>Consulta el ' + a(links[0]) + ', y compara también ' + a(links[1]) + ', ' + a(links[2]) + ' y ' + a(links[3]) + '. Estos enlaces permiten navegar entre fichas de productos reales de la marca y revisar sus precios y presentaciones sin depender de búsquedas externas.</p>' +
        '<h3>Pedidos desde otras ciudades</h3><p>Además de Medellín y el área metropolitana, recibimos consultas de Bogotá, Cali, Barranquilla, Cartagena y Bucaramanga, así como de otras ciudades de Colombia. Confirma los datos de entrega y el medio de pago disponible antes de finalizar tu compra. Los precios y existencias pueden cambiar, por lo que siempre conviene comprobar la información actualizada en el catálogo.</p></section>';
    }
    return '<section class="seo-local-bsn"><h2>' + esc(name) + ' en Medellín y Colombia</h2>' +
      '<p>Conoce ' + esc(name) + ' de BSN en Medellín. Consulta presentación, disponibilidad y precio actualizado antes de comprar. Compara sus características con las opciones de la marca y revisa siempre la información del fabricante.</p>' +
      detail + '<h3>BSN en Medellín y el área metropolitana</h3><p>Atendemos consultas y pedidos de Medellín, Envigado, Itagüí, Bello y Sabaneta. La disponibilidad, los tiempos y las condiciones de entrega dependen de la dirección y la confirmación del pedido.</p>' +
      '<h3>Cómo elegir tu producto BSN</h3><p>Antes de comprar, revisa el tamaño de la presentación, la cantidad de servicios, el sabor y las instrucciones de uso que figuran en la etiqueta. Según el producto, puedes comparar proteínas, aminoácidos y fórmulas de preentrenamiento sin asumir que todos cumplen la misma función.</p>' +
      '<h3>Productos relacionados de BSN</h3><p>Explora el ' + a(links[0]) + ', compara ' + a(links[1]) + ', ' + a(links[2]) + ' y ' + a(links[3]) + '. Estos enlaces permiten descubrir otras referencias de la misma marca y encontrar la presentación que buscas.</p>' +
      '<h3>Envíos de BSN a Colombia</h3><p>También puedes consultar pedidos desde Bogotá, Cali, Barranquilla, Cartagena, Bucaramanga y otras ciudades de Colombia. Confirma cobertura, costo de envío, medios de pago y disponibilidad antes de finalizar tu compra. Cada ficha incluye los detalles publicados del producto para ayudarte a tomar una decisión informada.</p></section>';
  }
  function absUrl(u) { u = String(T(u) ? u : '').trim(); if (u.indexOf('//') === 0) return 'https:' + u; if (u.indexOf('/') === 0) return BASE + u; return /^https?:\/\//.test(u) ? u : ''; }
  function filtros(rows) {
    var brands = new Map(), cats = new Map(), total = 0;
    rows.forEach(function (r) {
      if (r.activo !== true) return; var p = r.product || {}; total++;
      [[brands, or(p.brand, p.marca)], [cats, or(p.category, p.categoria)]].forEach(function (x) { var n = String(T(x[1]) ? x[1] : '').trim(); if (n) x[0].set(n, (x[0].get(n) || 0) + 1); });
    });
    var sort = function (a, b) { return cmp(lower(a[0]), lower(b[0])); };
    return { brands: Array.from(brands).sort(sort).map(function (e) { return [e[0], e[1], D.logos[lower(e[0])] || '']; }), categories: Array.from(cats).sort(sort), total: total };
  }

  /* ---------- Página ---------- */
  function slugPedido() {
    var q = new URLSearchParams(location.search), s = q.get('slug') || q.get('s') || q.get('producto') || '';
    var path = location.pathname.match(/^\/producto\/([a-z0-9-]+)\/?$/);
    if (!s && path) s = path[1];
    return s.replace(/\.html$/, '').trim();
  }
  function mostrarError(titulo, texto) {
    document.title = titulo + ' | SUPGO';
    root.innerHTML = '<div class="fd-error"><h1>' + esc(titulo) + '</h1><p>' + esc(texto) + '</p><a href="/">Ver el catálogo</a></div>';
  }
  async function cargar() {
    var pedido = slugPedido();
    if (!pedido) return mostrarError('Producto no encontrado', 'El enlace no indica qué producto mostrar.');
    var datos = await Promise.all([
      get('lift_productos?select=id,activo,slug,product&slug=eq.' + encodeURIComponent(pedido)),
      catalogo(), config('weekly_offers'), config('seo_merchant_settings'), resenas(),
      get('lift_seo_marcas?select=marca,habilitada&limit=5000').catch(function () { return []; }),
      get('lift_seo_bloqueos?select=producto_id&limit=5000').catch(function () { return []; })
    ]);
    var encontrado = datos[0][0], rows = datos[1], offers = datos[2], settings = datos[3], REVIEWS = datos[4];
    window.__supgoSeoFilters = filtros(rows);
    if (!encontrado) {
      /* Slug viejo (cambió el nombre): buscar por el ID del final y corregir la dirección. */
      /* Slug personalizado del panel SEO (product.seo.slug) o slug viejo: buscar por el ID del final. */
      var porSeo = await get('lift_productos?select=id,activo,slug,product&product->seo->>slug=eq.' + encodeURIComponent(pedido) + '&limit=1').catch(function () { return []; });
      encontrado = porSeo[0];
      var m = /(?:^|-)(\d+)$/.exec(pedido);
      if (!encontrado && m) { var porId = await get('lift_productos?select=id,activo,slug,product&id=eq.' + m[1]); encontrado = porId[0]; }
      if (!encontrado) return mostrarError('Producto no encontrado', 'Puede que el enlace esté incompleto o que el producto ya no exista.');
      history.replaceState(null, '', location.pathname + '?slug=' + encodeURIComponent(encontrado.slug) + location.hash);
    }
    if (!allowed(encontrado)) return mostrarError('Producto no disponible', 'Este producto no está disponible en este momento.');
    var marcasOk = new Set(datos[5].filter(function (x) { return x.habilitada === true; }).map(function (x) { return lower(String(x.marca).trim()); }));
    var bloqueados = new Set(datos[6].map(function (x) { return String(x.producto_id); }));
    var productsById = {};
    rows.forEach(function (r) { productsById[String(r.id)] = r.product; r._offer = offers[String(r.id)]; });
    var valid = rows.filter(allowed);
    valid.forEach(function (r) { r._indexable = marcasOk.has(lower(String(or(r.product.brand, r.product.marca, 'SIN MARCA')).trim())) && !bloqueados.has(String(r.id)); });
    /* La fila completa del producto (con descripción y SEO) reemplaza a la liviana. */
    var row = { id: encontrado.id, activo: encontrado.activo, slug: encontrado.slug, product: encontrado.product || {}, _offer: offers[String(encontrado.id)], _merchant_settings: settings };
    var vi = valid.findIndex(function (r) { return r.id === row.id; });
    row._indexable = vi >= 0 ? valid[vi]._indexable : false;
    if (vi >= 0) valid[vi] = Object.assign(valid[vi], { product: row.product }); else valid.push(row);
    var entries = valid.map(function (item) { return { item: item, d: info(item) }; });
    var fam = familias(entries);
    var me = entries.find(function (e) { return e.item.id === row.id; });
    var variants = fam.byId.get(String(row.id));
    /* Si el nombre trae un sabor distinto al guardado, mostrar el del nombre. */
    if (variants.length > 1) {
      var gk = fam.keyOf.get(variants);
      if (gk && gk[0] === 'name') {
        var count = gk[2].split('-').length;
        variants.forEach(function (v) { if (slug(v.name).startsWith(gk[2] + '-')) { var suf = v.name.split(/\s+/).filter(Boolean).slice(count).join(' ').trim(); if (suf) v.label = suf; } });
      }
    }
    row._variants = variants.slice(0, 24);
    /* Imágenes secundarias: propias + las de los otros sabores (mismo orden que el generador). */
    var ids = variants.map(function (v) { return v.id; });
    var imgRows = await get('lift_producto_imagenes?select=producto_id,imagen_url,orden&producto_id=in.(' + ids.join(',') + ')&order=orden.asc').catch(function () { return []; });
    var imgs = {};
    imgRows.forEach(function (x) { var u = absUrl(x.imagen_url); if (u) (imgs[String(x.producto_id)] = imgs[String(x.producto_id)] || []).push(u); });
    var procesadas = {}, orden = entries.filter(function (e) { return ids.indexOf(e.item.id) >= 0; });
    for (var i = 0; i < orden.length; i++) {
      var it = orden[i].item, shared = [];
      variants.forEach(function (s) { (procesadas[String(s.id)] || imgs[String(s.id)] || []).forEach(function (u) { if (u && shared.indexOf(u) < 0) shared.push(u); }); });
      var prim = String(or(it.product.image, it.product.imagen, ''));
      procesadas[String(it.id)] = Array.from(new Set((imgs[String(it.id)] || []).concat(shared).filter(function (u) { return u && u !== prim; })));
      if (it.id === row.id) break;
    }
    row._images = procesadas[String(row.id)] || [];
    var excluded = new Set(ids.map(String)), p = row.product;
    var cat = lower(String(or(p.category, p.categoria, ''))), brandL = lower(me.d.brand);
    row._related = entries.filter(function (e) { return !excluded.has(String(e.d.id)) && cat && lower(String(or(e.item.product.category, e.item.product.categoria, ''))) === cat; }).map(function (e) { return e.d; }).slice(0, 12);
    function firsts(c) { var seen = new Set(), out = []; c.forEach(function (e) { var f = fam.byId.get(String(e.d.id)); if (seen.has(f)) return; seen.add(f); out.push(e.d); }); return out; }
    var pool = entries.filter(function (e) { return !excluded.has(String(e.d.id)) && e.item._indexable !== false && e.d.price > 0; });
    row._mas_marca = await seleccionar(firsts(pool.filter(function (e) { return brandL && lower(e.d.brand) === brandL; })), String(row.id), 4);
    row._alternativas = await seleccionar(firsts(pool.filter(function (e) { return cat && lower(e.d.brand) !== brandL && lower(String(or(e.item.product.category, e.item.product.categoria, ''))) === cat; })), String(row.id), 4);
    ['applied nutrition', 'bsn'].forEach(function (b) {
      if (lower(String(or(p.brand, p.marca, '')).trim()) !== b) return;
      var mine = slug(or(p.name, p.nombre)), choices = valid.filter(function (r) { return lower(String(or(r.product.brand, r.product.marca, '')).trim()) === b && r.id !== row.id; });
      choices.sort(function (x, y) { var a = slug(or(x.product.name, x.product.nombre)) === mine ? 1 : 0, c = slug(or(y.product.name, y.product.nombre)) === mine ? 1 : 0; return a - c || cmp(String(x.id), String(y.id)); });
      row[b === 'bsn' ? '_bsn_links' : '_applied_links'] = choices.slice(0, 3).map(function (r) { var n = String(or(r.product.name, r.product.nombre)); return { name: n, url: BASE + '/productos/' + (slug(n) || 'producto') + '-' + r.id + '.html' }; });
    });
    var seoRows = await get('lift_producto_seo?select=producto_id,titulo_seo,meta_descripcion,descripcion_larga_html,imagen_seo&producto_id=eq.' + row.id).catch(function () { return []; });
    row._seo = seoRows[0] || {};
    var ids2 = [String(row.id)].concat(row._variants.map(function (v) { return String(v.id); }).filter(function (x) { return x !== String(row.id); }));
    var revs = []; Array.from(new Set(ids2)).forEach(function (x) { revs = revs.concat(REVIEWS[x] || []); });
    revs.sort(function (a, b) { return cmp(b.fecha, a.fecha); });
    await dibujar(row, revs, productsById);
  }

  async function dibujar(row, reviews, productsById) {
    var p = row.product, seo = row._seo || {}, name = String(or(p.name, p.nombre)), pid = row.id;
    var key = slug(name) || 'producto', canonical = BASE + '/productos/' + key + '-' + pid + '.html';
    var embedded = p.seo && typeof p.seo === 'object' && !Array.isArray(p.seo) ? p.seo : {};
    var brand = String(or(p.brand, p.marca, '')), description = String(or(p.description, p.descripcion, '')).trim();
    var image = String(or(embedded.image, seo.imagen_seo, p.image, p.imagen, '')).trim();
    if (image.indexOf('//') === 0) image = 'https:' + image; else if (image.indexOf('/') === 0) image = BASE + image; else if (image && !/^https?:\/\//.test(image)) image = '';
    var price = 'price' in p ? p.price : p.precio, promotion = active_offer(row), amount = fl(price), valid_price = isFinite(amount) && amount > 0;
    if (!isFinite(amount)) amount = 0;
    var category = String(or(p.category, p.categoria, '')).trim(), presentation = or(p.presentation, p.presentacion);
    var flavor = String(or(p.flavor, p.sabor, '')).trim(), variants = row._variants || [];
    var cur = variants.find(function (v) { return String(v.id) === String(pid); });
    if (!flavor && variants.length > 1) flavor = cur ? cur.label : '';
    var stored_title = String(or(seo.titulo_seo, embedded.title, '')).trim();
    var wrong = titulo_no_corresponde(stored_title, name);
    if (wrong) { seo = { producto_id: seo.producto_id, imagen_seo: seo.imagen_seo }; stored_title = ''; }
    var stored_long = String(or(embedded.html, seo.descripcion_larga_html, '')).trim();
    var auto_content = es_delgada(stored_long, name) && ['applied nutrition', 'bsn'].indexOf(lower(brand.trim())) < 0;
    var auto_title = !stored_title || new RegExp('^\\s*' + name.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '\\s*\\|\\s*supgo\\s*$', 'i').test(stored_title);
    var title = (auto_title ? titulo_seo(name, brand) : stored_title).slice(0, 140);
    var auto_html = '';
    if (auto_content) {
      var lab = slug(brand), cs = slug(category);
      auto_html = await descripcion_html({ pid: pid, nombre: name, marca: brand, categoria: category, sabor: flavor, presentacion: presentation, variantes: variants,
        mas_marca: row._mas_marca || [], alternativas: row._alternativas || [], url_marca: brand && LABS.has(lab) ? '/laboratorios/' + lab + '/' : '', url_categoria: category && CATS.has(cs) ? '/categorias/' + cs + '/' : '' });
    }
    var seo_description = plain(auto_html || seo.descripcion_larga_html || embedded.html);
    var stored_meta = String(or(seo.meta_descripcion, '')).trim();
    var meta = stored_meta && stored_meta.indexOf('Compra ') !== 0 && stored_meta.length >= 50 && stored_meta.length <= 170 ? stored_meta : meta_descripcion(name, brand, flavor, presentation);
    /* Datos estructurados (Product + BreadcrumbList) */
    var schema = { '@context': 'https://schema.org', '@type': 'Product', name: name, url: canonical, sku: String(or(embedded.sku, p.sku, pid)) };
    ['gtin', 'gtin8', 'color', 'material', 'size'].forEach(function (k) { var v = p[k]; if ((typeof v === 'string' || typeof v === 'number') && String(v).trim()) schema[k] = String(v).trim(); });
    presentation = or(p.presentation, p.presentacion);
    if (T(presentation) && !T(schema.size)) schema.size = String(presentation);
    if (T(p.flavor)) schema.additionalProperty = [{ '@type': 'PropertyValue', name: 'Sabor', value: String(p.flavor) }];
    var settings = row._merchant_settings || {};
    if (settings.item_condition === 'https://schema.org/NewCondition') schema.itemCondition = settings.item_condition;
    if (brand) schema.brand = { '@type': 'Brand', name: brand };
    if (T(embedded.gtin)) schema.gtin = String(embedded.gtin);
    if (T(embedded.manufacturer)) schema.manufacturer = /^https?:\/\//.test(String(embedded.manufacturer)) ? { '@type': 'Organization', name: brand, url: String(embedded.manufacturer) } : { '@type': 'Organization', name: String(embedded.manufacturer) };
    if (image) schema.image = Array.from(new Set([image].concat((row._images || []).filter(Boolean)))).slice(0, 6);
    if (category) schema.category = category;
    schema.description = (seo_description || description || meta).slice(0, 5000);
    if (auto_html) { var fp = /<p>([\s\S]*?)<\/p>/.exec(auto_html); if (fp) schema.description = plain(fp[1]); }
    if (['applied nutrition', 'bsn'].indexOf(lower(brand.trim())) >= 0) schema.description = meta;
    ['gtin13', 'gtin12', 'gtin14', 'mpn'].forEach(function (k) { if (T(p[k])) schema[k] = String(p[k]).trim(); });
    if (promotion) amount = promotion[1];
    if (valid_price) {
      var offer = { '@type': 'Offer', url: canonical, priceCurrency: 'COP', price: amount, seller: { '@type': 'Organization', name: 'SUPGO', url: BASE } };
      var av = seo_availability(row); if (av) offer.availability = av;
      if (promotion) {
        offer.priceSpecification = { '@type': 'UnitPriceSpecification', price: promotion[0], priceCurrency: 'COP', priceType: 'https://schema.org/StrikethroughPrice' };
        var dl = offer_deadline(row); if (dl) offer.priceValidUntil = dl.year + '-' + String(dl.month).padStart(2, '0') + '-' + String(dl.day).padStart(2, '0');
      }
      merchant_policy(offer, settings);
      schema.offers = offer;
    }
    var breadcrumb = { '@context': 'https://schema.org', '@type': 'BreadcrumbList', itemListElement: [{ '@type': 'ListItem', position: 1, name: 'SUPGO', item: BASE + '/' }, { '@type': 'ListItem', position: 2, name: 'Productos', item: BASE + '/productos/' }, { '@type': 'ListItem', position: 3, name: name, item: canonical }] };
    if (reviews.length) {
      var avg = reviews.reduce(function (a, r) { return a + r.estrellas; }, 0) / reviews.length;
      schema.aggregateRating = { '@type': 'AggregateRating', ratingValue: Number(fmt1(avg)), reviewCount: reviews.length, bestRating: 5, worstRating: 1 };
      schema.review = reviews.slice(0, 5).map(function (r) { var o = { '@type': 'Review', author: { '@type': 'Person', name: r.nombre } }; if (r.fecha) o.datePublished = r.fecha; o.reviewRating = { '@type': 'Rating', ratingValue: r.estrellas, bestRating: 5, worstRating: 1 }; if (r.comentario) o.reviewBody = r.comentario; return o; });
    }
    /* Precio, oferta y regalo */
    var img = image ? '<img src="' + esc(image) + '" alt="' + esc(or(embedded.alt1, name)) + '" loading="eager" fetchpriority="high" decoding="async" width="600" height="600">' : '';
    var price_html = valid_price ? '<p class="price">' + cop(amount) + '</p>' : '<p class="price price-ask">Consultar precio</p>', extra = '';
    if (promotion) {
      var pct = roundEven((1 - promotion[1] / promotion[0]) * 100);
      price_html = '<div class="seo-offer-price"><span class="seo-offer-label">-' + pct + '%</span><strong>' + cop(promotion[1]) + '</strong><del aria-label="Precio anterior ' + cop(promotion[0]) + '">' + cop(promotion[0]) + '</del></div>';
      var bits = '<span class="seo-offer-saving">Ahorras ' + cop(Math.max(0, promotion[0] - promotion[1])) + '</span>', dl2 = offer_deadline(row);
      if (dl2) bits += '<span class="seo-offer-until">Oferta válida hasta el ' + dl2.day + ' de ' + MESES[dl2.month - 1] + '</span>';
      price_html += '<div class="pi-offer-meta">' + bits + '</div>';
      var od = row._offer || {};
      if (T(od.gift)) {
        var gid = String(or(od.giftProductId, '')).trim(), gp = productsById[gid] || {};
        var gname = String(or(od.giftName, gp.name, gp.nombre, '')).trim(), gimg = absUrl(or(gp.image, gp.imagen, ''));
        var gqty = parseInt(or(od.giftQty, 1), 10); if (!isFinite(gqty)) gqty = 1; gqty = Math.max(1, gqty);
        if (gname) extra += '<div class="seo-offer-gift">' + (gimg ? '<img src="' + esc(gimg) + '" alt="' + esc(gname) + '" loading="lazy" width="54" height="54">' : '') + '<div><span class="seo-gift-tag">REGALO INCLUIDO</span><strong>' + gqty + ' × ' + esc(gname) + '</strong></div></div>';
      }
    }
    if (extra) extra = '<div class="seo-offer-extras">' + extra + '</div>';
    /* Descripción larga sin scripts ni eventos */
    var long_html = auto_html || String(or(embedded.html, seo.descripcion_larga_html, '')).trim();
    long_html = long_html.replace(/<(script|iframe|object|embed|form|style|svg)\b[^>]*>[\s\S]*?<\/\1\s*>/gi, '').replace(/<(script|iframe|object|embed|form|style|svg)\b[^>]*\/?>/gi, '')
      .replace(/\s+on[a-z]+\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]+)/gi, '').replace(/javascript\s*:/gi, '').replace(/<\s*\/?details\b[^>]*>/gi, '').replace(/<\s*\/?summary\b[^>]*>/gi, '');
    var body = long_html ? long_html : '<p>' + esc(description || 'Consulta presentaciones, sabores y disponibilidad de este producto.') + '</p>';
    var lb = lower(brand.trim());
    if (lb === 'applied nutrition' && (row._applied_links || []).length === 3) body = local_seo('applied', name, description, [['/laboratorios/applied-nutrition/', 'catálogo Applied Nutrition']].concat(row._applied_links.map(function (x) { return [x.url, x.name]; })));
    if (lb === 'bsn' && (row._bsn_links || []).length === 3) body = local_seo('bsn', name, description, [['/laboratorios/bsn/', 'catálogo BSN']].concat(row._bsn_links.map(function (x) { return [x.url, x.name]; })));
    /* Galería, sabores, relacionados, marca y etiquetas */
    var gallery = []; [image].concat(row._images || []).forEach(function (u) { if (u && gallery.indexOf(u) < 0) gallery.push(u); });
    var gallery_html = gallery.map(function (u, i) { return '<button type="button" class="gallery-thumb' + (i === 0 ? ' active' : '') + '" data-index="' + i + '" aria-label="Ver imagen ' + (i + 1) + '"><img src="' + esc(u) + '" alt="' + esc(name) + ' - imagen ' + (i + 1) + '" loading="lazy" width="48" height="48"></button>'; }).join('');
    var variants_html = variants.map(function (v) {
      return '<a class="option' + (String(v.id) === String(pid) ? ' selected' : '') + '" href="' + esc(v.url) + '" title="' + esc(v.label) + '">' + (T(v.image) ? '<span class="option-photo"><img src="' + esc(v.image) + '" alt="' + esc(v.label) + '" loading="lazy" width="90" height="90"></span>' : '<span class="option-photo option-empty">Sin foto</span>') +
        '<span class="option-label">' + esc(v.label) + '</span>' + (v.on_offer ? '<span class="option-offer">Oferta</span>' : '') + '</a>';
    }).join('');
    var related_html = (row._related || []).map(related_card).join('');
    var bs = slug(brand), brand_html = brand && LABS.has(bs) ? '<a class="pi-brand" href="/laboratorios/' + esc(bs) + '/">' + esc(brand) + '</a>' : brand ? '<span class="pi-brand">' + esc(brand) + '</span>' : '';
    flavor = String(or(p.flavor, p.sabor, '')).trim(); if (!flavor && variants.length > 1) flavor = cur ? cur.label : '';
    var tags = [];
    if (T(presentation) && String(presentation).trim()) tags.push('<li class="pi-tag"><b>Presentación</b> ' + esc(String(presentation).trim()) + '</li>');
    if (flavor && lower(flavor) !== lower(name)) tags.push('<li class="pi-tag"><b>Sabor</b> ' + esc(flavor) + '</li>');
    if (category) { var cs2 = slug(category); tags.push(CATS.has(cs2) ? '<li><a class="pi-tag" href="/categorias/' + esc(cs2) + '/"><b>Categoría</b> ' + esc(category) + '</a></li>' : '<li class="pi-tag"><b>Categoría</b> ' + esc(category) + '</li>'); }
    var tags_html = tags.length ? '<ul class="pi-tags">' + tags.join('') + '</ul>' : '';
    var regular = valid_price ? fl(or(p.price, p.precio, 0)) : 0; if (!isFinite(regular)) regular = 0;
    window.__supgoGallery = gallery;
    window.__supgoFicha = { id: String(pid), name: name, image: image, price: amount, regular: regular, url: canonical, on_offer: !!promotion, promoUntil: promotion ? (row._offer || {}).promoUntil : null };

    /* Encabezado de la página */
    document.title = title;
    ['meta[name="description"]', 'meta[name="robots"]'].forEach(function (s) { var e = document.querySelector(s); if (e) e.remove(); });
    var head = '<meta name="description" content="' + esc(meta) + '">\n<meta name="robots" content="' + (row._indexable !== false ? 'index, follow' : 'noindex, follow') + '">' +
      '<link rel="canonical" href="' + esc(canonical) + '"><meta property="og:type" content="product"><meta property="og:title" content="' + esc(name) + '"><meta property="og:description" content="' + esc(meta) + '">' +
      '<meta property="og:url" content="' + esc(canonical) + '"><meta property="og:site_name" content="SUPGO"><meta property="og:locale" content="es_CO">' +
      (image ? '<meta property="og:image" content="' + esc(image) + '"><meta property="og:image:alt" content="' + esc(name) + '"><meta name="twitter:card" content="summary_large_image"><meta name="twitter:image" content="' + esc(image) + '">' : '<meta name="twitter:card" content="summary">') +
      '<meta name="twitter:title" content="' + esc(name) + '"><meta name="twitter:description" content="' + esc(meta) + '">' +
      (valid_price ? '<meta property="product:price:amount" content="' + g6(amount) + '"><meta property="product:price:currency" content="COP">' : '') +
      '<script type="application/ld+json">' + jsonLd(schema) + '</script><script type="application/ld+json">' + jsonLd(breadcrumb) + '</script>';
    document.querySelector('title').insertAdjacentHTML('afterend', head);

    /* Contenido (misma estructura que la ficha estática) */
    var curLabel = cur ? cur.label : '';
    root.innerHTML = '\n<nav class="seo-breadcrumb" aria-label="Ruta de navegación"><a href="/">SUPGO</a><span aria-hidden="true">›</span><a href="/productos/">Productos</a>' + (brand ? '<span aria-hidden="true">›</span><a class="seo-breadcrumb-brand" href="/laboratorios/' + slug(brand) + '/">' + esc(brand) + '</a>' : '') + '<span aria-hidden="true">›</span><span class="seo-breadcrumb-current" aria-current="page">' + esc(name) + '</span></nav>\n' +
      '<article class="product-card">\n<section class="product-gallery">' + (gallery.length > 1 ? '<div class="gallery-thumbs">' + gallery_html + '</div>' : '') + '<div class="product-media"><button type="button" id="openZoom" class="zoom-image" aria-label="Ampliar imagen del producto">' + img + '<span class="zoom-hint">⌕ Ampliar</span></button></div></section>\n' +
      '<section class="product-info">\n' + brand_html + '<h1>' + esc(name) + '</h1>' + tags_html + '\n<!--precio-->' + rating_line(reviews) + '<div class="product-price">' + price_html + '</div>' + extra + '<!--/precio-->\n' + P.envio + '\n' +
      (variants.length > 1 ? '<div class="variant-panel"><h3>Sabor: ' + esc(curLabel) + '</h3><div class="variant-grid">' + variants_html + '</div></div>' : '') + '\n' +
      P.acciones + '\n' + P.pagos + '\n<details class="seo-description" open><summary>Descripción <span class="seo-chevron" aria-hidden="true"></span></summary><div class="product-description">' + body + '</div></details>\n' + P.garantias + '\n</section></article>\n' +
      '<!--relacionados-->' + reviews_html(reviews) + (related_html ? '<section class="related pi-related" aria-label="Más de esta categoría"><div class="related-heading"><h2>Más de esta categoría</h2><div class="related-controls"><button type="button" class="related-prev" aria-label="Anteriores">‹</button><button type="button" class="related-next" aria-label="Siguientes">›</button></div></div><div class="pi-rel-track">' + related_html + '</div></section>' : '') +
      guides_html(pid, or(p.category, p.categoria, '')) + '<!--/relacionados-->\n';
    window.__supgoFichaHtml = root.innerHTML; /* copia antes de los scripts, para pruebas */
    var zp = document.getElementById('zoomPhoto'); if (zp) zp.alt = name;
    /* Scripts de la ficha (zoom, compra/favoritos, WhatsApp): los mismos de las fichas estáticas. */
    ['ficha-js-zoom', 'ficha-js-compra', 'ficha-js-whatsapp'].forEach(function (id) {
      var src = document.getElementById(id); if (!src) return;
      var s = document.createElement('script'); s.textContent = src.textContent; document.body.appendChild(s);
    });
    document.dispatchEvent(new CustomEvent('supgo-ficha-lista', { detail: { id: pid, slug: row.slug } }));
  }

  cargar().catch(function (e) {
    console.error('Ficha dinámica:', e);
    mostrarError('No pudimos cargar el producto', 'Revisa tu conexión e intenta de nuevo en unos segundos.');
  });
})();

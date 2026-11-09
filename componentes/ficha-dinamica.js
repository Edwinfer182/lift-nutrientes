/* SUPGO · Ficha de producto dinámica (producto/index.html?slug=...).
   Carga el producto desde Supabase por su slug y dibuja la MISMA ficha que genera
   scripts/generar_paginas_seo.py (misma estructura, textos, datos estructurados y scripts).
   Cada función lleva el nombre de su equivalente en Python para mantenerlas iguales. */
(function () {
  'use strict';
  var D = JSON.parse(document.getElementById('ficha-plantilla').textContent);
  var BASE = D.base, SB = D.supabase, KEY = D.key, P = D.piezas;
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
  async function get(path, ttl) {
    var cacheKey = 'supgoFicha:' + path;
    if (ttl) try {
      var cached = JSON.parse(sessionStorage.getItem(cacheKey));
      if (cached && Date.now() - cached.time < ttl) return cached.data;
    } catch (e) { /* El almacenamiento puede estar deshabilitado. */ }
    var r = await fetch(SB + '/rest/v1/' + path, { headers: H });
    if (!r.ok) throw new Error('Supabase ' + r.status + ' en ' + path.split('?')[0]);
    var data = await r.json();
    if (ttl) try { sessionStorage.setItem(cacheKey, JSON.stringify({ time: Date.now(), data: data })); } catch (e) {}
    return data;
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
  async function catalogoCercano(row) {
    var sel = 'id,activo,slug,' + CAMPOS.map(function (c) { return 'f' + CAMPOS.indexOf(c) + ':product->' + c; }).join(',');
    var p = row.product || {}, conditions = [];
    function match(fields, value) {
      if (!value) return;
      var quoted = JSON.stringify(String(value).replace(/[%_]/g, '\\$&'));
      fields.forEach(function (field) { conditions.push('product->>' + field + '.ilike.' + quoted); });
    }
    match(['brand', 'marca'], or(p.brand, p.marca));
    match(['category', 'categoria'], or(p.category, p.categoria));
    conditions.push('id.eq.' + row.id);
    var rows = await all('lift_productos?select=' + sel + '&activo=eq.true&or=' + encodeURIComponent('(' + conditions.join(',') + ')') + '&order=id.asc');
    return rows.map(function (r) {
      var p = {}; CAMPOS.forEach(function (c, i) { var v = r['f' + i]; if (v !== null && v !== undefined) p[c] = v; });
      return { id: r.id, activo: r.activo, slug: r.slug, product: p };
    });
  }
  async function config(clave) {
    var rows = await get('lift_catalog_config?select=valor&clave=eq.' + encodeURIComponent(clave) + '&limit=1', 60000);
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
      url: BASE + '/producto/' + item.slug + '/',
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
  /* Productos variables: un solo card por producto padre, con su URL, nombre y precio "Desde". */
  function agruparPublicos(list, famPub, propio) {
    var out = [], idx = new Map();
    list.forEach(function (e) {
      var f = famPub.get(String(e.d.id));
      if (!f) { out.push(e.d); return; }
      if (propio && f.slug === propio) return;
      var c = idx.get(f.slug), precio = T(e.d.sale) ? e.d.sale : e.d.price;
      if (!c) { c = Object.assign({}, e.d, { name: String(f.nombre || e.d.name), url: BASE + '/producto/' + f.slug + '/', n: 0, min: 0, max: 0, oferta: false }); idx.set(f.slug, c); out.push(c); }
      if (String(f.principal_id) === String(e.d.id) && T(e.d.image)) c.image = e.d.image;
      c.n++; c.oferta = c.oferta || T(e.d.sale);
      if (precio > 0) { c.min = c.min ? Math.min(c.min, precio) : precio; c.max = Math.max(c.max, precio); }
      if (c.n > 1) c.url = BASE + '/producto/' + f.slug + '/';
      else c.url = BASE + '/producto/' + f.slug + '/?v=' + e.d.id;
    });
    return out;
  }
  function related_card(v) {
    if (v.n > 1) {
      var desde = v.min > 0 ? (v.min < v.max ? '<span class="rel-from">Desde</span>' : '') + '<strong>' + cop(v.min) + '</strong>' : '<strong class="rel-ask">Consultar precio</strong>';
      return '<article class="rel-card"><a class="rel-photo" href="' + esc(v.url) + '" tabindex="-1" aria-hidden="true">' + (T(v.image) ? '<img src="' + esc(v.image) + '" alt="' + esc(v.name) + '" loading="lazy" decoding="async" width="160" height="160">' : '') +
        (v.oferta ? '<span class="rel-badge">Oferta</span>' : '') + '</a>' + (T(v.brand) ? '<small class="rel-brand">' + esc(v.brand) + '</small>' : '') +
        '<a class="rel-name" href="' + esc(v.url) + '" title="' + esc(v.name) + '">' + esc(v.name) + '</a><span class="rel-opts">' + v.n + ' opciones</span><div class="rel-price">' + desde + '</div>' +
        '<a class="rel-add rel-ver" href="' + esc(v.url) + '">Ver opciones</a></article>';
    }
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
    document.dispatchEvent(new CustomEvent('supgo:ficha-error'));
  }
  async function cargar() {
    var pedido = slugPedido();
    if (!pedido) return mostrarError('Producto no encontrado', 'El enlace no indica qué producto mostrar.');
    // Configuración compartida en paralelo; la ficha nunca descarga todo el catálogo.
    var sharedPromise = Promise.all([
      config('weekly_offers'), config('seo_merchant_settings'), resenas(),
      get('lift_seo_marcas?select=marca,habilitada&limit=5000', 60000).catch(function () { return []; }),
      get('lift_seo_bloqueos?select=producto_id&limit=5000', 60000).catch(function () { return []; })
    ]);
    sharedPromise.catch(function () {});
    // Vercel ya consultó este registro. Reutilizarlo evita otra ida a Supabase.
    var bootNode = document.getElementById('supgo-product-bootstrap'), boot = null;
    if (bootNode) try { boot = JSON.parse(bootNode.textContent); } catch (e) {}
    /* Producto variable: la URL es la del padre y la fila es la variación elegida (?v=). */
    var grupo = boot && boot.grupo && boot.slug === pedido && boot.row && Array.isArray(boot.miembros) ? boot : null;
    if (grupo) { var vq = new URLSearchParams(location.search).get('v'); var elegido = vq && grupo.miembros.find(function (m) { return String(m.id) === vq; }); if (elegido) boot.row = { id: elegido.id, activo: true, slug: elegido.slug, product: elegido.product }; }
    var bootOk = grupo || (boot && boot.slug === pedido && boot.row &&
      boot.row.slug === pedido && boot.row.activo === true);
    var found = bootOk ? [boot.row] :
      await get('lift_productos?select=id,activo,slug,product&slug=eq.' + encodeURIComponent(pedido) + '&limit=2');
    if (found.length > 1) return mostrarError('Slug duplicado', 'Hay varios productos con esta dirección. Debe corregirse el slug en el catálogo.');
    var encontrado = found[0];
    window.__supgoSeoFilters = D.filtros || window.__supgoSeoFilters;
    if (!encontrado) {
      /* Slug viejo (cambió el nombre): buscar por el ID del final y corregir la dirección. */
      /* Slug personalizado del panel SEO (product.seo.slug) o slug viejo: buscar por el ID del final. */
      var porSeo = await get('lift_productos?select=id,activo,slug,product&product->seo->>slug=eq.' + encodeURIComponent(pedido) + '&limit=2').catch(function () { return []; });
      if (porSeo.length > 1) return mostrarError('Slug duplicado', 'Hay varios productos con esta dirección. Debe corregirse el slug en el catálogo.');
      encontrado = porSeo[0];
      var m = /(?:^|-)(\d+)$/.exec(pedido);
      if (!encontrado && m) { var porId = await get('lift_productos?select=id,activo,slug,product&id=eq.' + m[1]); encontrado = porId[0]; }
      if (!encontrado) return mostrarError('Producto no encontrado', 'Puede que el enlace esté incompleto o que el producto ya no exista.');
      // Un slug personalizado guardado por el panel debe conservarse en la URL.
      if (!porSeo.length) history.replaceState(null, '', '/producto/' + encodeURIComponent(encontrado.slug) + '/' + location.hash);
    }
    if (!allowed(encontrado)) return mostrarError('Producto no disponible', 'Este producto no está disponible en este momento.');
    if (location.search && !grupo) {
      var seoSlug = (encontrado.product.seo || {}).slug;
      var cleanSlug = pedido === encontrado.slug || pedido === seoSlug ? pedido : encontrado.slug;
      history.replaceState(null, '', '/producto/' + encodeURIComponent(cleanSlug) + '/' + location.hash);
    }
    // SEO y productos relacionados se consultan simultáneamente tras identificar la ficha.
    var loaded = await Promise.all([
      catalogoCercano(encontrado), sharedPromise,
      grupo ? get('lift_productos?select=id,activo,slug,product&id=in.(' + grupo.miembros.map(function (m) { return m.id; }).join(',') + ')').catch(function () { return []; }) : Promise.resolve(null),
      bootOk && boot.row.id === encontrado.id ? Promise.resolve(boot.seo ? [boot.seo] : []) :
        get('lift_producto_seo?select=producto_id,titulo_seo,meta_descripcion,descripcion_larga_html,imagen_seo,canonical_url,indexable,datos_estructurados&producto_id=eq.' + encontrado.id).catch(function () { return []; }),
      get('lift_familias_publicas?select=producto_id,slug,nombre,principal_id&limit=5000', 60000).catch(function () { return []; })
    ]);
    var rows = loaded[0], datos = loaded[1], frescos = loaded[2], seoRows = loaded[3];
    var famPub = new Map(); (loaded[4] || []).forEach(function (f) { famPub.set(String(f.producto_id), f); });
    /* La página puede venir de la caché de la CDN: precio, foto y nombre se toman de la consulta fresca. */
    var fresco = rows.find(function (r) { return r.id === encontrado.id; });
    if (fresco && fresco.product) encontrado = Object.assign({}, encontrado, { activo: fresco.activo, product: Object.assign({}, encontrado.product, fresco.product) });
    if (fresco && fresco.activo === false) return mostrarError('Producto no disponible', 'Este producto no está disponible en este momento.');
    var offers = datos[0], settings = datos[1], REVIEWS = datos[2];
    var marcasOk = new Set(datos[3].filter(function (x) { return x.habilitada === true; }).map(function (x) { return lower(String(x.marca).trim()); }));
    var bloqueados = new Set(datos[4].map(function (x) { return String(x.producto_id); }));
    var productsById = {};
    rows.forEach(function (r) { productsById[String(r.id)] = r.product; r._offer = offers[String(r.id)]; });
    // Un obsequio puede pertenecer a otra marca/categoría: traer solo ese registro.
    var currentOffer = offers[String(encontrado.id)] || {};
    var giftId = String(currentOffer.giftProductId || '');
    if (currentOffer.gift && /^\d+$/.test(giftId) && !productsById[giftId]) {
      var giftRows = await get('lift_productos?select=id,product&id=eq.' + giftId + '&limit=1').catch(function () { return []; });
      if (giftRows[0]) productsById[giftId] = giftRows[0].product;
    }
    var valid = rows.filter(allowed);
    valid.forEach(function (r) { r._indexable = marcasOk.has(lower(String(or(r.product.brand, r.product.marca, 'SIN MARCA')).trim())) && !bloqueados.has(String(r.id)); });
    /* La fila completa del producto (con descripción y SEO) reemplaza a la liviana. */
    var row = { id: encontrado.id, activo: encontrado.activo, slug: encontrado.slug, product: encontrado.product || {}, _offer: offers[String(encontrado.id)], _merchant_settings: settings };
    var vi = valid.findIndex(function (r) { return r.id === row.id; });
    row._indexable = vi >= 0 ? valid[vi]._indexable : false;
    if (vi >= 0) valid[vi] = Object.assign(valid[vi], { product: row.product }); else valid.push(row);
    var entries = valid.map(function (item) { return { item: item, d: info(item) }; });
    var fam = familias(entries);
    var me = entries.find(function (e) { return e.item.id === row.id; }) || { item: row, d: info(row) };
    var variants = fam.byId.get(String(row.id));
    if (grupo) {
      /* Variaciones del producto padre (precio y oferta frescos). */
      var fr = {}; (frescos || []).forEach(function (r) { fr[String(r.id)] = r; });
      var miembros = grupo.miembros.map(function (m) {
        var f = fr[String(m.id)], it = { id: m.id, activo: f ? f.activo : true, slug: m.slug, product: f && f.product ? f.product : m.product, _offer: offers[String(m.id)] };
        if (String(m.id) === String(row.id)) { it.product = row.product; }
        return { item: it, d: info(it), sabor: String(m.sabor || '').trim(), tamano: String(m.tamano || '').trim() };
      }).filter(function (m) { return allowed(m.item); });
      if (!miembros.some(function (m) { return String(m.item.id) === String(row.id); }) && miembros.length) {
        var m0 = miembros[0].item; row = Object.assign(row, { id: m0.id, slug: m0.slug, product: m0.product, _offer: m0._offer });
      }
      miembros.forEach(function (m) { m.d.label = [m.tamano, m.sabor].filter(Boolean).join(' · ') || m.d.name; });
      variants = miembros.map(function (m) { return m.d; });
      row._grupo = { slug: grupo.slug, nombre: grupo.grupo.nombre, imagen: grupo.grupo.imagen, miembros: miembros, productsById: productsById };
      me = { item: row, d: info(row) };
    }
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
    if (row._grupo) {
      /* Galería del producto variable: fotos de todas sus variaciones, sin repetir. */
      var todas = [];
      row._grupo.miembros.forEach(function (m) { [absUrl(or(m.item.product.image, m.item.product.imagen, ''))].concat(imgs[String(m.item.id)] || []).forEach(function (u) { if (u && todas.indexOf(u) < 0) todas.push(u); }); });
      var prim0 = absUrl(or(row.product.image, row.product.imagen, ''));
      row._images = todas.filter(function (u) { return u !== prim0; });
    }
    var excluded = new Set(ids.map(String)), p = row.product;
    var cat = lower(String(or(p.category, p.categoria, ''))), brandL = lower(me.d.brand);
    row._related = agruparPublicos(entries.filter(function (e) { return !excluded.has(String(e.d.id)) && cat && lower(String(or(e.item.product.category, e.item.product.categoria, ''))) === cat; }), famPub, row._grupo ? row._grupo.slug : '').slice(0, 12);
    function firsts(c) { var seen = new Set(), out = []; c.forEach(function (e) { var f = fam.byId.get(String(e.d.id)); if (seen.has(f)) return; seen.add(f); out.push(e.d); }); return out; }
    var pool = entries.filter(function (e) { return !excluded.has(String(e.d.id)) && e.item._indexable !== false && e.d.price > 0; });
    row._mas_marca = await seleccionar(firsts(pool.filter(function (e) { return brandL && lower(e.d.brand) === brandL; })), String(row.id), 4);
    row._alternativas = await seleccionar(firsts(pool.filter(function (e) { return cat && lower(e.d.brand) !== brandL && lower(String(or(e.item.product.category, e.item.product.categoria, ''))) === cat; })), String(row.id), 4);
    ['applied nutrition', 'bsn'].forEach(function (b) {
      if (lower(String(or(p.brand, p.marca, '')).trim()) !== b) return;
      var mine = slug(or(p.name, p.nombre)), choices = valid.filter(function (r) { return lower(String(or(r.product.brand, r.product.marca, '')).trim()) === b && r.id !== row.id; });
      choices.sort(function (x, y) { var a = slug(or(x.product.name, x.product.nombre)) === mine ? 1 : 0, c = slug(or(y.product.name, y.product.nombre)) === mine ? 1 : 0; return a - c || cmp(String(x.id), String(y.id)); });
      row[b === 'bsn' ? '_bsn_links' : '_applied_links'] = choices.slice(0, 3).map(function (r) { var n = String(or(r.product.name, r.product.nombre)); return { name: n, url: BASE + '/producto/' + r.slug + '/' }; });
    });
    row._seo = seoRows[0] || {};
    var ids2 = [String(row.id)].concat(row._variants.map(function (v) { return String(v.id); }).filter(function (x) { return x !== String(row.id); }));
    var revs = []; Array.from(new Set(ids2)).forEach(function (x) { revs = revs.concat(REVIEWS[x] || []); });
    revs.sort(function (a, b) { return cmp(b.fecha, a.fecha); });
    await dibujar(row, revs, productsById);
  }

  /* Precio, oferta y regalo de una variación (también se usa al cambiar de sabor o tamaño). */
  function precioBloque(row, productsById) {
    var p = row.product, price = 'price' in p ? p.price : p.precio, promotion = active_offer(row), amount = fl(price), valid_price = isFinite(amount) && amount > 0;
    if (!isFinite(amount)) amount = 0;
    if (promotion) amount = promotion[1];
    var price_html = valid_price ? '<p class="price">' + cop(amount) + '</p>' : '<p class="price price-ask">Consultar precio</p>', extra = '';
    if (promotion) {
      var pct = roundEven((1 - promotion[1] / promotion[0]) * 100);
      price_html = '<div class="seo-offer-price"><span class="seo-offer-label">-' + pct + '%</span><strong>' + cop(promotion[1]) + '</strong><del aria-label="Precio anterior ' + cop(promotion[0]) + '">' + cop(promotion[0]) + '</del></div>';
      var bits = '<span class="seo-offer-saving">Ahorras ' + cop(Math.max(0, promotion[0] - promotion[1])) + '</span>', dl2 = offer_deadline(row);
      if (dl2) bits += '<span class="seo-offer-until">Oferta válida hasta el ' + dl2.day + ' de ' + MESES[dl2.month - 1] + '</span>';
      price_html += '<div class="pi-offer-meta">' + bits + '</div>';
      var od = row._offer || {};
      if (T(od.gift)) {
        var gid = String(or(od.giftProductId, '')).trim(), gp = (productsById || {})[gid] || {};
        var gname = String(or(od.giftName, gp.name, gp.nombre, '')).trim(), gimg = absUrl(or(gp.image, gp.imagen, ''));
        var gqty = parseInt(or(od.giftQty, 1), 10); if (!isFinite(gqty)) gqty = 1; gqty = Math.max(1, gqty);
        if (gname) extra += '<div class="seo-offer-gift">' + (gimg ? '<img src="' + esc(gimg) + '" alt="' + esc(gname) + '" loading="lazy" width="54" height="54">' : '') + '<div><span class="seo-gift-tag">REGALO INCLUIDO</span><strong>' + gqty + ' × ' + esc(gname) + '</strong></div></div>';
      }
    }
    if (extra) extra = '<div class="seo-offer-extras">' + extra + '</div>';
    return { html: price_html, extra: extra, amount: amount, valid: valid_price, promotion: promotion };
  }

  /* ---------- Producto variable: elegir tamaño y sabor sin cambiar de página ---------- */
  /* Descuento por cantidad (mismo cálculo que carrito y checkout). */
  function volStrip() {
    if (!document.getElementById('vol-css')) {
      var st = document.createElement('style'); st.id = 'vol-css';
      st.textContent = '.pi-vol{display:flex;align-items:center;gap:10px;margin:10px 0 4px;padding:10px 12px;border:1px dashed #a3c94a;border-radius:12px;background:#fbfef3;font-family:Poppins,Arial,sans-serif}.pi-vol-ico{width:34px;height:34px;flex:none;display:grid;place-items:center;border-radius:10px;background:#c6f432;font-size:16px}.pi-vol-t{flex:1;min-width:0;font-size:12.5px;line-height:1.35;color:#374151}.pi-vol-t b{color:#111}.pi-vol-tiers{display:flex;gap:6px;flex:none}.pi-vol-tiers span{display:grid;text-align:center;border-radius:9px;background:#fff;border:1px solid #e3eccb;padding:4px 8px;font-size:10.5px;color:#4b5563;line-height:1.2}.pi-vol-tiers span b{font-size:15px;color:#111}.pi-vol-tiers span.hot{background:#111;border-color:#111;color:#d9dcd9}.pi-vol-tiers span.hot b{color:#c6f432}@media(max-width:420px){.pi-vol{flex-wrap:wrap}.pi-vol-tiers{width:100%}.pi-vol-tiers span{flex:1}}';
      document.head.appendChild(st);
    }
    return '<div class="pi-vol" role="note"><span class="pi-vol-ico" aria-hidden="true">🛒</span><div class="pi-vol-t"><b>Lleva más y ahorra</b><br>Mezcla los productos que quieras. El descuento se aplica solo en el carrito.</div><div class="pi-vol-tiers"><span><b>3%</b>3 productos</span><span class="hot"><b>7%</b>6 productos</span></div></div>';
  }
  /* Compra, envíos y pagos (reemplaza la pieza estática con emojis). */
  var ICO = {
    ok: '<path d="M12 3 4.5 6v5.5c0 4.6 3.2 8.3 7.5 9.5 4.3-1.2 7.5-4.9 7.5-9.5V6L12 3Z"/><path d="m8.8 12.2 2.2 2.2 4.3-4.6"/>',
    envio: '<path d="M3 6.5h11v9H3z"/><path d="M14 9.5h3.6l3.4 3.3v2.7h-7"/><circle cx="7" cy="17.5" r="1.8"/><circle cx="17" cy="17.5" r="1.8"/>',
    pago: '<rect x="3" y="5.5" width="18" height="13" rx="2.5"/><path d="M3 10h18M7 15h4"/>'
  };
  function garantiasHtml(nombre) {
    var g = String(P.garantias || '');
    var tabla = (/<div class="seo-shipping-table-wrap">[\s\S]*?<\/table><\/div>/.exec(g) || [''])[0];
    var nota = (/<\/table><\/div><p>([\s\S]*?)<\/p>/.exec(g) || ['', ''])[1];
    var wa = 'https://wa.me/573137380766?text=' + quote('Hola, quiero confirmar disponibilidad de ' + (nombre || 'un producto'));
    function item(ic, titulo, sub, body, open) {
      return '<details class="sg-fold"' + (open ? ' open' : '') + '><summary><span class="sg-ico"><svg viewBox="0 0 24 24" aria-hidden="true">' + ICO[ic] + '</svg></span><span class="sg-txt"><strong>' + titulo + '</strong><small>' + sub + '</small></span>' +
        '<svg class="sg-chev" viewBox="0 0 24 24" aria-hidden="true"><path d="m6 9 6 6 6-6"/></svg></summary><div class="sg-body">' + body + '</div></details>';
    }
    sgCss();
    return '<section class="sg-info" aria-label="Compra, envíos y pagos">' +
      item('ok', 'Compra con confianza', 'Te confirmamos disponibilidad antes de pagar',
        '<ul class="sg-list"><li>Escríbenos y te confirmamos sabor, tamaño y existencias.</li><li>Te asesoramos para elegir según tu objetivo.</li><li>Recibes la confirmación de tu pedido y el seguimiento del envío.</li></ul><a class="sg-wa" href="' + esc(wa) + '" target="_blank" rel="noopener">Escribir por WhatsApp</a>') +
      item('envio', 'Envíos en Medellín y Colombia', 'Gratis en Medellín desde 3 unidades',
        '<p>El costo depende de las unidades del pedido.</p>' + (tabla || '') + (nota ? '<p class="sg-note">' + nota + '</p>' : '')) +
      item('pago', 'Pagos seguros', 'Bold, PSE, Nequi, transferencia o contraentrega',
        '<div class="sg-pays"><div><b>Pago en línea con Bold</b><span>Tarjeta, PSE, Nequi, Bancolombia y Bre-B</span></div><div><b>Transferencia</b><span>Llave Bre-B o cuenta Bancolombia</span></div><div><b>Efectivo contraentrega</b><span>Solo en Medellín</span></div></div>' +
        '<div class="sg-chips"><span>Tarjetas</span><span>PSE</span><span>Nequi</span><span>Bancolombia</span><span>Bre-B</span><span>Apple Pay</span></div>') +
      '</section>';
  }
  function sgCss() {
    if (document.getElementById('sg-css')) return;
    var st = document.createElement('style'); st.id = 'sg-css';
    st.textContent = '.sg-info{margin:18px 0 20px;border:1px solid #e8eaed;border-radius:16px;background:#fff;font-family:Poppins,Arial,sans-serif;color:#15171a;overflow:hidden}' +
      '.sg-fold+.sg-fold{border-top:1px solid #eef0f2}.sg-fold summary{display:flex;align-items:center;gap:12px;padding:13px 14px;cursor:pointer;list-style:none}.sg-fold summary::-webkit-details-marker{display:none}' +
      '.sg-ico{width:38px;height:38px;flex:none;display:grid;place-items:center;border-radius:11px;background:#f1f8df;color:#3f6212}.sg-ico svg{width:20px;height:20px;fill:none;stroke:currentColor;stroke-width:1.8;stroke-linecap:round;stroke-linejoin:round}' +
      '.sg-txt{flex:1;min-width:0;display:grid;gap:1px}.sg-txt strong{font-size:14px;font-weight:600;line-height:1.3}.sg-txt small{font-size:12px;color:#6b7280;line-height:1.35}' +
      '.sg-chev{width:18px;height:18px;flex:none;fill:none;stroke:#9ca3af;stroke-width:2;stroke-linecap:round;stroke-linejoin:round;transition:transform .2s}.sg-fold[open] .sg-chev{transform:rotate(180deg)}' +
      '.sg-body{padding:0 14px 15px 64px;font-size:13px;line-height:1.55;color:#374151}.sg-body p{margin:0 0 8px}.sg-note{font-size:12px;color:#6b7280;margin-top:8px!important}' +
      '.sg-list{margin:0 0 12px;padding:0;list-style:none;display:grid;gap:6px}.sg-list li{position:relative;padding-left:20px}.sg-list li:before{content:"";position:absolute;left:2px;top:7px;width:8px;height:8px;border-radius:50%;background:#84cc16}' +
      '.sg-wa{display:inline-flex;align-items:center;justify-content:center;height:38px;padding:0 16px;border-radius:10px;background:#25d366;color:#fff;font-weight:600;font-size:13px;text-decoration:none}' +
      '.sg-body .seo-shipping-table-wrap{overflow-x:auto;border:1px solid #eceef0;border-radius:12px}.sg-body .seo-shipping-table{width:100%;border-collapse:collapse;font-size:12.5px}.sg-body .seo-shipping-table th,.sg-body .seo-shipping-table td{padding:8px 10px;text-align:left;border-bottom:1px solid #f0f1f3}.sg-body .seo-shipping-table th{background:#f7f8f9;font-weight:600;color:#111}.sg-body .seo-shipping-table tr:last-child td{border-bottom:0}' +
      '.sg-pays{display:grid;gap:8px;margin-bottom:12px}.sg-pays div{display:grid;gap:1px;padding:9px 12px;border:1px solid #eceef0;border-radius:11px}.sg-pays b{font-size:13px;font-weight:600;color:#111}.sg-pays span{font-size:12px;color:#6b7280}' +
      '.sg-chips{display:flex;flex-wrap:wrap;gap:6px}.sg-chips span{font-size:11.5px;font-weight:600;padding:5px 9px;border-radius:999px;background:#f3f4f6;color:#374151}' +
      '@media(max-width:520px){.sg-body{padding-left:14px}}' +
      '.rel-brand{text-transform:none!important;letter-spacing:0!important;font-size:11.5px!important}.rel-opts{display:block;font-size:11.5px;color:#4d7c0f;font-weight:600;margin:2px 0 4px}.rel-from{font-size:11.5px;color:#6b7280;font-weight:500}.rel-ver{background:#fff!important;color:#111!important;border:1.5px solid #111!important}';
    document.head.appendChild(st);
  }
  function pvCss() {
    if (document.getElementById('pv-css')) return;
    var st = document.createElement('style'); st.id = 'pv-css';
    st.textContent = '.pv-opts{margin:14px 0 6px;display:grid;gap:12px}.pv-h{font-size:13.5px;color:#555;margin:0 0 7px}.pv-h b{color:#111}' +
      '.pv-chips{display:flex;flex-wrap:wrap;gap:7px}.pv-chip{position:relative;border:1.5px solid #d9d9d9;background:#fff;color:#111;border-radius:10px;min-height:40px;padding:8px 13px;font:600 13px/1.2 Poppins,Arial,sans-serif;cursor:pointer;transition:border-color .15s,box-shadow .15s}' +
      '.pv-chip:hover{border-color:#111}.pv-chip.on{border-color:#111;box-shadow:inset 0 0 0 1px #111;background:#f6f6f4}.pv-chip.off{color:#aaa;border-style:dashed;background:#fafafa}.pv-chip.off:hover{border-color:#bbb}' +
      '.pv-chip i{position:absolute;top:-6px;right:-6px;background:#c6f432;color:#111;font:700 9px/1 Poppins,Arial,sans-serif;font-style:normal;padding:3px 5px;border-radius:6px}' +
      '.pv-chip small{display:block;font-weight:500;font-size:11px;color:#777;margin-top:2px}';
    document.head.appendChild(st);
  }
  function pvDims(G) {
    var T = [], S = [];
    G.miembros.forEach(function (m) { if (m.tamano && T.indexOf(m.tamano) < 0) T.push(m.tamano); if (m.sabor && S.indexOf(m.sabor) < 0) S.push(m.sabor); });
    return { T: T, S: S };
  }
  function opcionesHtml(G, pid) {
    pvCss();
    var D2 = pvDims(G), cur = G.miembros.find(function (m) { return String(m.item.id) === String(pid); }) || G.miembros[0], out = '';
    var price = function (m) { return m.d.sale || m.d.price; };
    function chip(k, val, on, off, oferta, sub) { return '<button type="button" class="pv-chip' + (on ? ' on' : '') + (off ? ' off' : '') + '" data-k="' + k + '" data-val="' + esc(val) + '" aria-pressed="' + on + '"' + (off ? ' title="No disponible en este tamaño"' : '') + '>' + esc(val) + (sub ? '<small>' + sub + '</small>' : '') + (oferta ? '<i>OFERTA</i>' : '') + '</button>'; }
    if (D2.T.length > 1) {
      out += '<div class="pv-row"><p class="pv-h">Tamaño: <b>' + esc(cur.tamano) + '</b></p><div class="pv-chips">' + D2.T.map(function (t) {
        var ms = G.miembros.filter(function (m) { return m.tamano === t; }), min = Math.min.apply(null, ms.map(price).filter(function (n) { return n > 0; }).concat([Infinity]));
        return chip('tamano', t, cur.tamano === t, false, ms.some(function (m) { return m.d.on_offer; }), isFinite(min) ? cop(min) : '');
      }).join('') + '</div></div>';
    } else if (D2.T.length === 1) out += '<div class="pv-row"><p class="pv-h">Tamaño: <b>' + esc(D2.T[0]) + '</b></p></div>';
    if (D2.S.length > 1 || (D2.S.length === 1 && D2.T.length < 2 && G.miembros.length > 1)) {
      var mismos = D2.T.length > 1 ? G.miembros.filter(function (m) { return m.tamano === cur.tamano; }) : G.miembros;
      out += '<div class="pv-row"><p class="pv-h">Sabor: <b>' + esc(cur.sabor || '—') + '</b></p><div class="pv-chips">' + D2.S.map(function (sv) {
        var m = mismos.find(function (x) { return x.sabor === sv; });
        return chip('sabor', sv, cur.sabor === sv, !m, m && m.d.on_offer);
      }).join('') + '</div></div>';
    } else if (D2.S.length === 1) out += '<div class="pv-row"><p class="pv-h">Sabor: <b>' + esc(D2.S[0]) + '</b></p></div>';
    if (!D2.T.length && !D2.S.length && G.miembros.length > 1) {
      out += '<div class="pv-row"><p class="pv-h">Opción: <b>' + esc(cur.d.name) + '</b></p><div class="pv-chips">' + G.miembros.map(function (m) { return chip('id', m.d.name, m === cur, false, m.d.on_offer).replace('data-val="', 'data-id="' + esc(m.item.id) + '" data-val="'); }).join('') + '</div></div>';
    }
    return out ? '<div class="pv-opts" id="pv-opts">' + out + '</div>' : '';
  }
  function activarOpciones(G, pid) {
    var box = document.getElementById('pv-opts'); if (!box) return;
    box.addEventListener('click', function (e) {
      var b = e.target.closest('.pv-chip'); if (!b) return;
      var cur = G.miembros.find(function (m) { return String(m.item.id) === String(window.__supgoFicha && window.__supgoFicha.id); }) || G.miembros[0], k = b.dataset.k, val = b.dataset.val, next = null;
      var precio = function (m) { return m.d.sale || m.d.price || 0; };
      if (k === 'id') next = G.miembros.find(function (m) { return String(m.item.id) === b.dataset.id; });
      else if (k === 'tamano') { var ms = G.miembros.filter(function (m) { return m.tamano === val; }); next = ms.find(function (m) { return m.sabor === cur.sabor; }) || ms.find(function (m) { return precio(m) > 0; }) || ms[0]; }
      else if (k === 'sabor') { next = G.miembros.find(function (m) { return m.sabor === val && m.tamano === cur.tamano; }) || G.miembros.find(function (m) { return m.sabor === val; }); }
      if (next && next !== cur) elegirVariacion(G, next);
    });
  }
  function elegirVariacion(G, m) {
    var it = m.item, p = it.product, pb = precioBloque(it, G.productsById);
    var box = document.querySelector('#supgo-ficha .product-price'); if (box) box.innerHTML = pb.html;
    document.querySelectorAll('#supgo-ficha .seo-offer-extras').forEach(function (e) { e.remove(); });
    if (pb.extra && box) box.insertAdjacentHTML('afterend', pb.extra);
    var u = absUrl(or(p.image, p.imagen, ''));
    if (u) {
      var gal = window.__supgoGallery || [], ix = gal.indexOf(u), th = ix >= 0 && document.querySelector('.gallery-thumb[data-index="' + ix + '"]');
      if (th) th.click(); else { var im = document.querySelector('#openZoom img'); if (im) { im.src = u; im.removeAttribute('srcset'); } }
    }
    var tags = document.querySelector('#supgo-ficha .pi-tags');
    function setTag(label, value) {
      if (!tags) return; var li = Array.prototype.find.call(tags.querySelectorAll('.pi-tag'), function (x) { var bb = x.querySelector('b'); return bb && bb.textContent === label; });
      if (!value) { if (li) (li.closest('li') || li).remove(); return; }
      if (!li) { tags.insertAdjacentHTML('afterbegin', '<li class="pi-tag"><b>' + esc(label) + '</b> ' + esc(value) + '</li>'); return; }
      li.innerHTML = '<b>' + esc(label) + '</b> ' + esc(value);
    }
    setTag('Sabor', m.sabor); setTag('Presentación', m.tamano || String(or(p.presentation, p.presentacion, '')).trim());
    var regular = fl(or(p.price, p.precio, 0)); if (!isFinite(regular)) regular = 0;
    Object.assign(window.__supgoFicha || (window.__supgoFicha = {}), { id: String(it.id), name: String(or(p.name, p.nombre, G.nombre)), image: u || (window.__supgoFicha || {}).image, price: pb.amount, regular: regular,
      on_offer: !!pb.promotion, promoUntil: pb.promotion ? (it._offer || {}).promoUntil : null });
    var ob = document.getElementById('pv-opts'); if (ob) { ob.outerHTML = opcionesHtml(G, it.id); activarOpciones(G, it.id); }
    try { history.replaceState(null, '', '/producto/' + G.slug + '/?v=' + encodeURIComponent(it.id) + location.hash); } catch (e) {}
    window.dispatchEvent(new Event('supgo-favorites-change'));
    document.dispatchEvent(new CustomEvent('supgo-variacion', { detail: { id: it.id, slug: G.slug } }));
  }

  async function dibujar(row, reviews, productsById) {
    var p = row.product, seo = row._seo || {}, name = String(or(p.name, p.nombre)), pid = row.id;
    var G = row._grupo || null;
    var key = G ? G.slug : row.slug, canonical = BASE + '/producto/' + key + '/';
    var cartName = name; if (G) name = G.nombre;
    var embedded = p.seo && typeof p.seo === 'object' && !Array.isArray(p.seo) ? p.seo : {};
    var brand = String(or(p.brand, p.marca, '')), description = String(or(p.description, p.descripcion, '')).trim();
    var image = String(or(seo.imagen_seo, p.image, p.imagen, '')).trim();
    if (image.indexOf('//') === 0) image = 'https:' + image; else if (image.indexOf('/') === 0) image = BASE + image; else if (image && !/^https?:\/\//.test(image)) image = '';
    var price = 'price' in p ? p.price : p.precio, promotion = active_offer(row), amount = fl(price), valid_price = isFinite(amount) && amount > 0;
    if (!isFinite(amount)) amount = 0;
    var category = String(or(p.category, p.categoria, '')).trim(), presentation = or(p.presentation, p.presentacion);
    var flavor = String(or(p.flavor, p.sabor, '')).trim(), variants = row._variants || [];
    var cur = variants.find(function (v) { return String(v.id) === String(pid); });
    if (!flavor && variants.length > 1) flavor = cur ? cur.label : '';
    var title = String(seo.titulo_seo || '').trim() || name + ' | SUPGO';
    var meta = plain(seo.meta_descripcion || '') || plain(description) || ('Consulta ' + name + ' en SUPGO Medellín. Disponibilidad, precios y envíos a Colombia.');
    var seo_description = plain(seo.descripcion_larga_html || '');
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
    schema.description = (seo_description || meta).slice(0, 5000);
    if (seo.datos_estructurados && typeof seo.datos_estructurados === 'object' && !Array.isArray(seo.datos_estructurados)) Object.assign(schema, seo.datos_estructurados);
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
    var breadcrumb = { '@context': 'https://schema.org', '@type': 'BreadcrumbList', itemListElement: [{ '@type': 'ListItem', position: 1, name: 'SUPGO', item: BASE + '/' }, { '@type': 'ListItem', position: 2, name: 'Categorías', item: BASE + '/categorias/' }, { '@type': 'ListItem', position: 3, name: name, item: canonical }] };
    if (reviews.length) {
      var avg = reviews.reduce(function (a, r) { return a + r.estrellas; }, 0) / reviews.length;
      schema.aggregateRating = { '@type': 'AggregateRating', ratingValue: Number(fmt1(avg)), reviewCount: reviews.length, bestRating: 5, worstRating: 1 };
      schema.review = reviews.slice(0, 5).map(function (r) { var o = { '@type': 'Review', author: { '@type': 'Person', name: r.nombre } }; if (r.fecha) o.datePublished = r.fecha; o.reviewRating = { '@type': 'Rating', ratingValue: r.estrellas, bestRating: 5, worstRating: 1 }; if (r.comentario) o.reviewBody = r.comentario; return o; });
    }
    /* Precio, oferta y regalo */
    var img = image ? '<img src="' + esc(image) + '" alt="' + esc(or(embedded.alt1, name)) + '" loading="eager" fetchpriority="high" decoding="async" width="600" height="600">' : '';
    var pb = precioBloque(row, productsById), price_html = pb.html, extra = pb.extra;
    /* Descripción larga sin scripts ni eventos */
    var long_html = String(seo.descripcion_larga_html || '').trim();
    long_html = long_html.replace(/<(script|iframe|object|embed|form|style|svg)\b[^>]*>[\s\S]*?<\/\1\s*>/gi, '').replace(/<(script|iframe|object|embed|form|style|svg)\b[^>]*\/?>/gi, '')
      .replace(/\s+on[a-z]+\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]+)/gi, '').replace(/javascript\s*:/gi, '').replace(/<\s*\/?details\b[^>]*>/gi, '').replace(/<\s*\/?summary\b[^>]*>/gi, '');
    var body = long_html ? long_html : '<p>' + esc(description || meta) + '</p>';
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
    var gm = G ? G.miembros.find(function (m) { return String(m.item.id) === String(pid); }) : null;
    if (G) { flavor = gm ? gm.sabor : ''; if (gm && gm.tamano) presentation = gm.tamano; cartName = String(or(p.name, p.nombre)); }
    var tags = [];
    if (T(presentation) && String(presentation).trim()) tags.push('<li class="pi-tag"><b>Presentación</b> ' + esc(String(presentation).trim()) + '</li>');
    if (flavor && lower(flavor) !== lower(name)) tags.push('<li class="pi-tag"><b>Sabor</b> ' + esc(flavor) + '</li>');
    if (category) { var cs2 = slug(category); tags.push(CATS.has(cs2) ? '<li><a class="pi-tag" href="/categorias/' + esc(cs2) + '/"><b>Categoría</b> ' + esc(category) + '</a></li>' : '<li class="pi-tag"><b>Categoría</b> ' + esc(category) + '</li>'); }
    var tags_html = tags.length ? '<ul class="pi-tags">' + tags.join('') + '</ul>' : '';
    var regular = valid_price ? fl(or(p.price, p.precio, 0)) : 0; if (!isFinite(regular)) regular = 0;
    window.__supgoGallery = gallery;
    window.__supgoFicha = { id: String(pid), name: cartName, image: image, price: amount, regular: regular, url: canonical, on_offer: !!promotion, promoUntil: promotion ? (row._offer || {}).promoUntil : null };

    /* Encabezado de la página */
    document.title = title;
    ['meta[name="description"]', 'meta[name="robots"]', 'link[rel="canonical"]', 'meta[property^="og:"]', 'meta[name^="twitter:"]', 'script[type="application/ld+json"]'].forEach(function (s) { var e = document.querySelector(s); if (e) e.remove(); });
    var head = '<meta name="description" content="' + esc(meta) + '">\n<meta name="robots" content="' + (row._indexable !== false && seo.indexable !== false ? 'index, follow' : 'noindex, follow') + '">' +
      '<link rel="canonical" href="' + esc(canonical) + '"><meta property="og:type" content="product"><meta property="og:title" content="' + esc(title) + '"><meta property="og:description" content="' + esc(meta) + '">' +
      '<meta property="og:url" content="' + esc(canonical) + '"><meta property="og:site_name" content="SUPGO"><meta property="og:locale" content="es_CO">' +
      (image ? '<meta property="og:image" content="' + esc(image) + '"><meta property="og:image:alt" content="' + esc(name) + '"><meta name="twitter:card" content="summary_large_image"><meta name="twitter:image" content="' + esc(image) + '">' : '<meta name="twitter:card" content="summary">') +
      '<meta name="twitter:title" content="' + esc(title) + '"><meta name="twitter:description" content="' + esc(meta) + '">' +
      (valid_price ? '<meta property="product:price:amount" content="' + g6(amount) + '"><meta property="product:price:currency" content="COP">' : '') +
      '<script type="application/ld+json">' + jsonLd(schema) + '</script><script type="application/ld+json">' + jsonLd(breadcrumb) + '</script>';
    document.querySelector('title').insertAdjacentHTML('afterend', head);

    /* Contenido (misma estructura que la ficha estática) */
    var curLabel = cur ? cur.label : '';
    root.innerHTML = '\n<nav class="seo-breadcrumb" aria-label="Ruta de navegación"><a href="/">SUPGO</a><span aria-hidden="true">›</span><a href="/categorias/">Categorías</a>' + (brand ? '<span aria-hidden="true">›</span><a class="seo-breadcrumb-brand" href="/laboratorios/' + slug(brand) + '/">' + esc(brand) + '</a>' : '') + '<span aria-hidden="true">›</span><span class="seo-breadcrumb-current" aria-current="page">' + esc(name) + '</span></nav>\n' +
      '<article class="product-card">\n<section class="product-gallery">' + (gallery.length > 1 ? '<div class="gallery-thumbs">' + gallery_html + '</div>' : '') + '<div class="product-media"><button type="button" id="openZoom" class="zoom-image" aria-label="Ampliar imagen del producto">' + img + '<span class="zoom-hint">⌕ Ampliar</span></button></div><button type="button" id="shareProduct" class="product-share-btn" aria-label="Compartir producto" title="Compartir producto"><svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="18" cy="5" r="2.5"/><circle cx="6" cy="12" r="2.5"/><circle cx="18" cy="19" r="2.5"/><path d="M8.2 10.8 15.8 6.3M8.2 13.2l7.6 4.5"/></svg> Compartir</button></section>\n' +
      '<section class="product-info">\n' + brand_html + '<h1>' + esc(seo.nombre_visible || name) + '</h1>' + tags_html + '\n<!--precio-->' + rating_line(reviews) + '<div class="product-price">' + price_html + '</div>' + extra + '<!--/precio-->\n' + P.envio + volStrip() + '\n' +
      (G ? opcionesHtml(G, pid) : variants.length > 1 ? '<div class="variant-panel"><h3>Sabor: ' + esc(curLabel) + '</h3><div class="variant-grid">' + variants_html + '</div></div>' : '') + '\n' +
      P.acciones + '\n' + P.pagos + '\n<details class="seo-description"><summary>Descripción <span class="seo-chevron" aria-hidden="true"></span></summary><div class="product-description">' + body + '</div></details>\n' + garantiasHtml(G ? G.nombre : name) + '\n</section></article>\n' +
      '<!--relacionados-->' + reviews_html(reviews) + (related_html ? '<section class="related pi-related" aria-label="Más de esta categoría"><div class="related-heading"><h2>Más de esta categoría</h2><div class="related-controls"><button type="button" class="related-prev" aria-label="Anteriores">‹</button><button type="button" class="related-next" aria-label="Siguientes">›</button></div></div><div class="pi-rel-track">' + related_html + '</div></section>' : '') +
      guides_html(pid, or(p.category, p.categoria, '')) + '<!--/relacionados-->\n';
    var shareButton = document.getElementById('shareProduct');
    if (shareButton) shareButton.addEventListener('click', async function () {
      var url = canonical;
      var payload = { title: name + ' | SUPGO', text: name, url: url };
      if (typeof navigator.share === 'function') {
        try { await navigator.share(payload); return; }
        catch (e) { if (e && e.name === 'AbortError') return; }
      }
      var copied = false;
      try {
        if (navigator.clipboard && navigator.clipboard.writeText) {
          await navigator.clipboard.writeText(url); copied = true;
        }
      } catch (e) {}
      if (!copied) {
        var input = document.createElement('textarea');
        input.value = url; input.style.cssText = 'position:fixed;opacity:0;pointer-events:none';
        document.body.appendChild(input); input.select();
        try { copied = document.execCommand('copy'); } catch (e) {}
        input.remove();
      }
      var label = shareButton.innerHTML;
      if (copied) {
        shareButton.textContent = '✓ Enlace copiado';
        setTimeout(function () { if (shareButton.isConnected) shareButton.innerHTML = label; }, 2200);
      } else {
        window.prompt('Copia el enlace para compartirlo:', url);
      }
    });
    window.__supgoFichaHtml = root.innerHTML; /* copia antes de los scripts, para pruebas */
    var zp = document.getElementById('zoomPhoto'); if (zp) zp.alt = name;
    /* Scripts de la ficha (zoom, compra/favoritos, WhatsApp): los mismos de las fichas estáticas. */
    ['ficha-js-zoom', 'ficha-js-compra', 'ficha-js-whatsapp'].forEach(function (id) {
      var src = document.getElementById(id); if (!src) return;
      var s = document.createElement('script'); s.textContent = src.textContent; document.body.appendChild(s);
    });
    if (G) activarOpciones(G, pid);
    document.dispatchEvent(new CustomEvent('supgo-ficha-lista', { detail: { id: pid, slug: key } }));
  }

  cargar().catch(function (e) {
    console.error('Ficha dinámica:', e);
    mostrarError('No pudimos cargar el producto', 'Revisa tu conexión e intenta de nuevo en unos segundos.');
  });
})();

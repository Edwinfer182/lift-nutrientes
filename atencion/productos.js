/* SUPGO · Centro de atención → "Enviar productos".
   Buscas, marcas los productos que quieras (en orden) y se genera una imagen
   con foto, nombre, presentación y precio, más el texto con los links. */
(function () {
  'use strict';
  var SB = 'https://vdxkknftyssjyfbdieqa.supabase.co/rest/v1/';
  var KEY = 'sb_publishable_ECuhXuKIb85kj9fgdEjrAw_O7uNpZsh';
  var SITE = 'https://supgo.co';
  var WA = '313 738 0766';
  var MAX = 9;
  var $ = function (id) { return document.getElementById(id); };
  var esc = function (s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); };
  var norm = function (s) { return String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase(); };
  var cop = function (n) { return '$ ' + Math.round(n).toLocaleString('es-CO'); };
  var yes = function (v) { return v === true || v === 'true' || v === 1 || v === '1'; };

  var ITEMS = [], CATS = [], sel = [], cat = '', q = '', shown = 60, loading = null, picking = null;

  /* ---------- Estilos ---------- */
  var css = document.createElement('style');
  css.textContent =
    '.ep-open{display:flex;align-items:center;justify-content:center;gap:8px;width:100%;margin:9px 0 2px;height:46px;border:0;border-radius:11px;background:#111;color:#fff;font-size:14px;font-weight:700;cursor:pointer}.ep-open i{font-style:normal;background:#c6f432;color:#111;border-radius:6px;padding:2px 6px;font-size:11px}' +
    '.ep{position:fixed;inset:0;z-index:50;background:#f8f9fb;display:flex;flex-direction:column}.ep[hidden]{display:none}' +
    '.ep-top{display:flex;align-items:center;gap:8px;padding:10px 12px;background:#fff;border-bottom:1px solid #e6e9ed}.ep-top h2{flex:1;margin:0;font-size:16px}.ep-x{width:38px;height:38px;border:1px solid #dce2e8;border-radius:10px;background:#fff;font-size:18px;cursor:pointer}' +
    '.ep-bar{padding:10px 12px 0;max-width:1100px;width:100%;margin:0 auto}.ep-bar input{height:44px}' +
    '.ep-cats{display:flex;gap:6px;overflow-x:auto;scrollbar-width:none;padding:9px 0 4px}.ep-cats::-webkit-scrollbar{display:none}.ep-cats button{flex:0 0 auto;border:1px solid #e0e5ec;background:#fff;border-radius:20px;padding:7px 11px;font-size:12px;font-weight:600;color:#34414a;cursor:pointer}.ep-cats button.on{background:#192128;color:#fff;border-color:#192128}' +
    '.ep-body{flex:1;overflow-y:auto;padding:6px 12px 130px}.ep-grid{max-width:1100px;margin:0 auto;display:grid;grid-template-columns:repeat(auto-fill,minmax(150px,1fr));gap:9px}' +
    '.ep-card{position:relative;text-align:left;border:1.5px solid #e3e7ec;background:#fff;border-radius:13px;padding:8px;cursor:pointer;display:flex;flex-direction:column;gap:3px;font:inherit;color:inherit}.ep-card.on{border-color:#111;box-shadow:inset 0 0 0 1.5px #111}' +
    '.ep-card img,.ep-card .ep-ph{width:100%;aspect-ratio:1;object-fit:contain;border-radius:9px;background:#f4f5f7}.ep-card small{font-size:10.5px;color:#6b7480}.ep-card b{font-size:12.5px;line-height:1.25;font-weight:650;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}.ep-card em{font-style:normal;font-size:13px;font-weight:700}.ep-card u{text-decoration:none;font-size:11px;color:#4d7c0f;font-weight:600}' +
    '.ep-n{position:absolute;top:6px;left:6px;min-width:24px;height:24px;border-radius:12px;background:#111;color:#c6f432;font-size:12px;font-weight:800;display:grid;place-items:center;padding:0 6px}' +
    '.ep-more{display:block;margin:12px auto;border:1px solid #dce2e8;background:#fff;border-radius:10px;padding:10px 16px;font-weight:650;cursor:pointer}.ep-empty{text-align:center;color:#6b7480;padding:30px 10px;font-size:13px}' +
    '.ep-tray{position:fixed;left:0;right:0;bottom:0;z-index:51;background:#fff;border-top:1px solid #e3e7ec;padding:9px 12px calc(9px + env(safe-area-inset-bottom));box-shadow:0 -6px 20px rgba(0,0,0,.06)}.ep-tray[hidden]{display:none}.ep-tin{max-width:1100px;margin:0 auto;display:flex;align-items:center;gap:9px}' +
    '.ep-thumbs{flex:1;min-width:0;display:flex;gap:6px;overflow-x:auto;scrollbar-width:none}.ep-thumbs::-webkit-scrollbar{display:none}.ep-th{position:relative;flex:0 0 auto;width:46px;height:46px;border:1px solid #e3e7ec;border-radius:9px;background:#f4f5f7 center/contain no-repeat;cursor:pointer}.ep-th span{position:absolute;top:-5px;right:-5px;width:18px;height:18px;border-radius:9px;background:#111;color:#fff;font-size:11px;line-height:18px;text-align:center}' +
    '.ep-go{flex:none;height:46px;border:0;border-radius:11px;background:#159447;color:#fff;font-weight:700;font-size:14px;padding:0 16px;cursor:pointer}' +
    '.ep-sheet{position:fixed;inset:0;z-index:60;background:rgba(17,20,24,.45);display:flex;align-items:flex-end;justify-content:center}.ep-sheet[hidden]{display:none}.ep-sh{background:#fff;width:100%;max-width:520px;max-height:82vh;overflow-y:auto;border-radius:18px 18px 0 0;padding:14px 14px calc(16px + env(safe-area-inset-bottom))}.ep-sh h3{margin:0 0 4px;font-size:15px}.ep-sh p{margin:0 0 10px;font-size:12px;color:#6b7480}' +
    '.ep-var{display:flex;align-items:center;gap:10px;width:100%;text-align:left;border:1.5px solid #e3e7ec;background:#fff;border-radius:11px;padding:8px;margin-bottom:7px;cursor:pointer;font:inherit}.ep-var.on{border-color:#111;background:#f6f7f4}.ep-var img{width:44px;height:44px;object-fit:contain;border-radius:8px;background:#f4f5f7}.ep-var span{flex:1;font-size:13px;font-weight:600}.ep-var em{font-style:normal;font-weight:700;font-size:13px}' +
    '.ep-res{max-width:560px;margin:0 auto;padding:12px 12px 30px}.ep-res canvas{width:100%;height:auto;border-radius:12px;box-shadow:0 4px 20px rgba(0,0,0,.08);background:#fff}.ep-res label{display:block;font-size:11px;color:#66727c;font-weight:650;margin:10px 0 5px}' +
    '.ep-acts{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:10px}.ep-acts button{height:44px;border:1px solid #dbe1e7;background:#fff;border-radius:10px;font-weight:650;font-size:13px;cursor:pointer;color:#263139}.ep-acts .pri{grid-column:1/-1;background:#159447;border:0;color:#fff;font-size:15px}.ep-msg{font-size:12px;color:#159447;min-height:16px;margin:8px 0 0;text-align:center}';
  document.head.appendChild(css);

  /* ---------- Interfaz ---------- */
  var openBtn = document.createElement('button');
  openBtn.type = 'button'; openBtn.className = 'ep-open'; openBtn.innerHTML = '🛍️ Enviar productos con imagen <i>Nuevo</i>';
  var anchor = document.querySelector('.identity');
  if (anchor) anchor.insertAdjacentElement('afterend', openBtn); else document.querySelector('main').prepend(openBtn);

  var root = document.createElement('div');
  root.className = 'ep'; root.hidden = true;
  root.innerHTML =
    '<div class="ep-top"><button type="button" class="ep-x" id="epBack" aria-label="Volver">←</button><h2 id="epTitle">Enviar productos</h2><button type="button" class="ep-x" id="epClose" aria-label="Cerrar">×</button></div>' +
    '<div id="epPick" style="display:flex;flex-direction:column;flex:1;min-height:0"><div class="ep-bar"><input id="epQ" type="search" placeholder="Buscar: creatina, omega, ISO 100…" autocomplete="off" aria-label="Buscar producto"><div class="ep-cats" id="epCats"></div></div>' +
    '<div class="ep-body" id="epBody"><div class="ep-grid" id="epGrid"></div><div id="epFoot"></div></div></div>' +
    '<div class="ep-body" id="epRes" hidden><div class="ep-res"><label for="epTit">Título de la imagen (opcional)</label><input id="epTit" maxlength="48" placeholder="Ej: Opciones de creatina · Tu kit para subir masa">' +
    '<label>Vista previa</label><canvas id="epCanvas" width="1080" height="1350"></canvas>' +
    '<div class="ep-acts"><button type="button" class="pri" id="epShare">Compartir a WhatsApp</button><button type="button" id="epCopyImg">Copiar imagen</button><button type="button" id="epDown">Descargar</button><button type="button" id="epCopyTxt">Copiar texto</button><button type="button" id="epWaTxt">Texto por WhatsApp ↗</button></div>' +
    '<p class="ep-msg" id="epMsg" role="status"></p><label for="epTxt">Texto con los links</label><textarea id="epTxt" rows="9"></textarea></div></div>';
  document.body.appendChild(root);
  var tray = document.createElement('div');
  tray.className = 'ep-tray'; tray.hidden = true;
  tray.innerHTML = '<div class="ep-tin"><div class="ep-thumbs" id="epThumbs"></div><button type="button" class="ep-go" id="epGo">Crear imagen</button></div>';
  document.body.appendChild(tray);
  var sheet = document.createElement('div');
  sheet.className = 'ep-sheet'; sheet.hidden = true;
  sheet.innerHTML = '<div class="ep-sh" id="epSh"></div>';
  document.body.appendChild(sheet);
  sheet.addEventListener('click', function (e) { if (e.target === sheet) sheet.hidden = true; });

  /* ---------- Datos ---------- */
  function get(path) {
    return fetch(SB + path, { headers: { apikey: KEY, Authorization: 'Bearer ' + KEY } }).then(function (r) { if (!r.ok) throw new Error('HTTP ' + r.status); return r.json(); });
  }
  async function all(path) {
    var out = [];
    for (var off = 0; off < 20000; off += 1000) {
      var rows = await get(path + '&limit=1000&offset=' + off);
      out = out.concat(rows); if (rows.length < 1000) break;
    }
    return out;
  }
  function load() {
    if (loading) return loading;
    loading = Promise.all([
      all('lift_productos?select=id,slug,nombre,marca,categoria,precio,imagen,fl:product->>flavor,sab:product->>sabor,pres:product->>presentation,pres2:product->>presentacion,del:product->>__deleted,priv:product->>__private,adm:product->>adminOnly,hid:product->>hidden,oc:product->>oculto&activo=eq.true&order=id.asc'),
      get('lift_familias_publicas?select=producto_id,slug,nombre,principal_id,tamano,sabor,orden&limit=5000').catch(function () { return []; }),
      get('lift_catalog_config?select=valor&clave=eq.weekly_offers&limit=1').catch(function () { return []; })
    ]).then(function (res) {
      var offers = (res[2][0] || {}).valor || {}; if (typeof offers === 'string') try { offers = JSON.parse(offers); } catch (e) { offers = {}; }
      var fam = new Map(); res[1].forEach(function (f) { fam.set(String(f.producto_id), f); });
      var groups = new Map(), counts = new Map();
      res[0].forEach(function (r) {
        if (!r.nombre || yes(r.del) || / - ?copia\s*$/i.test(r.nombre)) return;
        var privado = yes(r.priv) || yes(r.adm) || yes(r.hid) || yes(r.oc);
        var f = fam.get(String(r.id)), key = f ? 'g:' + f.slug : 'p:' + r.id;
        var price = Number(r.precio) || 0, o = offers[String(r.id)], sale = 0;
        if (o && Number(o.price) > 0 && Number(o.price) < price && !(o.promoUntil && Date.parse(o.promoUntil) < Date.now())) sale = Number(o.price);
        var label = f ? [f.tamano, f.sabor].filter(Boolean).join(' · ') : [r.pres || r.pres2, r.fl || r.sab].filter(Boolean).join(' · ');
        var m = { id: r.id, privado: privado, label: label, price: price, sale: sale, image: r.imagen || '', orden: f ? Number(f.orden) || 0 : 0,
          url: privado ? '' : f ? SITE + '/producto/' + f.slug + '/?v=' + r.id : SITE + '/producto/' + r.slug + '/' };
        var it = groups.get(key);
        if (!it) {
          it = { key: key, name: f ? (f.nombre || r.nombre) : r.nombre, brand: r.marca || '', cat: (r.categoria || '').trim(), image: r.imagen || '', members: [], principal: f ? String(f.principal_id) : '' };
          groups.set(key, it);
        }
        if (it.principal === String(r.id) && r.imagen) it.image = r.imagen;
        if (!it.image && r.imagen) it.image = r.imagen;
        it.members.push(m); if (privado) it.privado = true;
      });
      ITEMS = Array.from(groups.values());
      ITEMS.forEach(function (it) {
        it.members.sort(function (a, b) { return a.orden - b.orden || (a.sale || a.price) - (b.sale || b.price); });
        var ps = it.members.map(function (m) { return m.sale || m.price; }).filter(function (x) { return x > 0; });
        it.min = ps.length ? Math.min.apply(null, ps) : 0; it.max = ps.length ? Math.max.apply(null, ps) : 0;
        it.search = norm([it.name, it.brand, it.cat].concat(it.members.map(function (m) { return m.label; })).join(' '));
        if (it.cat) counts.set(it.cat, (counts.get(it.cat) || 0) + 1);
      });
      ITEMS.sort(function (a, b) { return a.name.localeCompare(b.name, 'es'); });
      CATS = Array.from(counts.entries()).sort(function (a, b) { return b[1] - a[1]; }).map(function (x) { return x[0]; });
    });
    return loading;
  }

  /* ---------- Selección ---------- */
  function selIndex(it, m) { return sel.findIndex(function (s) { return s.it === it && (!m || s.m === m); }); }
  function toggle(it, m) {
    var i = selIndex(it, m);
    if (i >= 0) sel.splice(i, 1);
    else { if (sel.length >= MAX) return flash('Máximo ' + MAX + ' productos por imagen'); sel.push({ it: it, m: m }); }
    drawGrid(); drawTray();
  }
  function flash(t) { var b = $('epFoot'); if (!b) return; var p = document.createElement('p'); p.className = 'ep-empty'; p.textContent = t; b.prepend(p); setTimeout(function () { p.remove(); }, 2200); }
  function pickVariant(it) {
    picking = it;
    var h = '<h3>' + esc(it.name) + '</h3><p>Elige la presentación o sabor. Puedes marcar varias.</p>' + it.members.map(function (m, i) {
      var on = selIndex(it, m) >= 0;
      return '<button type="button" class="ep-var' + (on ? ' on' : '') + '" data-v="' + i + '"><img src="' + esc(m.image || it.image) + '" alt="" loading="lazy"><span>' + esc(m.label || 'Única presentación') + '</span><em>' + (m.price ? cop(m.sale || m.price) : 'Consultar') + '</em></button>';
    }).join('') + '<button type="button" class="ep-go" style="width:100%;margin-top:4px" id="epVarOk">Listo</button>';
    $('epSh').innerHTML = h; sheet.hidden = false;
    $('epSh').querySelectorAll('[data-v]').forEach(function (b) { b.onclick = function () { toggle(it, it.members[+b.dataset.v]); b.classList.toggle('on', selIndex(it, it.members[+b.dataset.v]) >= 0); }; });
    $('epVarOk').onclick = function () { sheet.hidden = true; };
  }

  /* ---------- Listado ---------- */
  function filtered() {
    var t = norm(q).split(/\s+/).filter(Boolean);
    return ITEMS.filter(function (it) { return (!cat || it.cat === cat) && t.every(function (w) { return it.search.indexOf(w) >= 0; }); });
  }
  function drawCats() {
    $('epCats').innerHTML = ['<button type="button" data-c="" class="' + (cat ? '' : 'on') + '">Todas</button>'].concat(CATS.map(function (c) { return '<button type="button" data-c="' + esc(c) + '" class="' + (c === cat ? 'on' : '') + '">' + esc(c) + '</button>'; })).join('');
    $('epCats').querySelectorAll('[data-c]').forEach(function (b) { b.onclick = function () { cat = b.dataset.c; shown = 60; drawCats(); drawGrid(); $('epBody').scrollTop = 0; }; });
  }
  function drawGrid() {
    var list = filtered();
    $('epGrid').innerHTML = list.slice(0, shown).map(function (it, i) {
      var nums = sel.map(function (s, k) { return s.it === it ? k + 1 : 0; }).filter(Boolean);
      var price = it.min ? (it.min < it.max ? 'Desde ' : '') + cop(it.min) : 'Consultar';
      return '<button type="button" class="ep-card' + (nums.length ? ' on' : '') + '" data-k="' + i + '">' + (nums.length ? '<span class="ep-n">' + nums.join(',') + '</span>' : '') +
        (it.image ? '<img src="' + esc(it.image) + '" alt="" loading="lazy" onerror="this.outerHTML=\'<div class=ep-ph></div>\'">' : '<div class="ep-ph"></div>') + '<small>' + esc(it.brand) + (it.privado ? ' · <span style="color:#b45309;font-weight:700">Privado</span>' : '') + '</small><b>' + esc(it.name) + '</b>' +
        (it.members.length > 1 ? '<u>' + it.members.length + ' opciones</u>' : (it.members[0].label ? '<small>' + esc(it.members[0].label) + '</small>' : '')) + '<em>' + price + '</em></button>';
    }).join('');
    $('epGrid').querySelectorAll('[data-k]').forEach(function (b) {
      b.onclick = function () { var it = list[+b.dataset.k]; if (it.members.length > 1) pickVariant(it); else toggle(it, it.members[0]); };
    });
    $('epFoot').innerHTML = !list.length ? '<p class="ep-empty">No encontré productos con esa búsqueda.</p>' :
      list.length > shown ? '<button type="button" class="ep-more" id="epMore">Ver más (' + (list.length - shown) + ')</button>' : '';
    if ($('epMore')) $('epMore').onclick = function () { shown += 60; drawGrid(); };
  }
  function drawTray() {
    tray.hidden = !sel.length || !$('epRes').hidden || root.hidden;
    $('epThumbs').innerHTML = sel.map(function (s, k) { return '<div class="ep-th" data-r="' + k + '" title="Quitar" style="background-image:url(&quot;' + esc(s.m.image || s.it.image) + '&quot;)"><span>×</span></div>'; }).join('');
    $('epThumbs').querySelectorAll('[data-r]').forEach(function (d) { d.onclick = function () { sel.splice(+d.dataset.r, 1); drawGrid(); drawTray(); }; });
    $('epGo').textContent = 'Crear imagen (' + sel.length + ')';
  }

  /* ---------- Imagen ---------- */
  function loadImg(url) {
    return new Promise(function (ok) {
      if (!url) return ok(null);
      var u = String(url);
      try { var p = new URL(u, location.href); if (/(^|\.)supgo\.co$/.test(p.hostname) || p.origin === location.origin) u = location.origin + p.pathname + p.search; } catch (e) {}
      var img = new Image();
      if (!/^data:/.test(u) && u.indexOf(location.origin) !== 0) img.crossOrigin = 'anonymous';
      img.onload = function () { ok(img); }; img.onerror = function () { ok(null); };
      img.src = u;
      setTimeout(function () { ok(null); }, 9000);
    });
  }
  function rr(c, x, y, w, h, r) { c.beginPath(); c.moveTo(x + r, y); c.arcTo(x + w, y, x + w, y + h, r); c.arcTo(x + w, y + h, x, y + h, r); c.arcTo(x, y + h, x, y, r); c.arcTo(x, y, x + w, y, r); c.closePath(); }
  function lines(c, text, maxW, max) {
    var words = String(text).split(/\s+/), out = [], cur = '';
    words.forEach(function (w) { var t = cur ? cur + ' ' + w : w; if (c.measureText(t).width <= maxW || !cur) cur = t; else { out.push(cur); cur = w; } });
    if (cur) out.push(cur);
    if (out.length > max) { out = out.slice(0, max); var l = out[max - 1]; while (l.length > 1 && c.measureText(l + '…').width > maxW) l = l.slice(0, -1); out[max - 1] = l + '…'; }
    return out;
  }
  var FONT = 'Poppins, "Segoe UI", Arial, sans-serif';
  async function render() {
    var cv = $('epCanvas'), c = cv.getContext('2d'), W = 1080, H = 1350, n = sel.length;
    var imgs = await Promise.all(sel.map(function (s) { return loadImg(s.m.image || s.it.image); }));
    var logo = await loadImg('/favicon.png');
    c.clearRect(0, 0, W, H); c.fillStyle = '#f3f4f1'; c.fillRect(0, 0, W, H);
    // Encabezado
    c.fillStyle = '#111'; c.fillRect(0, 0, W, 150);
    if (logo) c.drawImage(logo, 48, 33, 84, 84);
    c.fillStyle = '#fff'; c.font = '800 46px ' + FONT; c.textBaseline = 'middle'; c.fillText('SUPGO', logo ? 150 : 48, 64);
    c.fillStyle = '#c6f432'; c.font = '600 24px ' + FONT; c.fillText('Suplementos en Medellín y Colombia', logo ? 150 : 48, 106);
    var title = $('epTit').value.trim(), top = 182;
    if (title) { c.fillStyle = '#111'; c.font = '800 48px ' + FONT; c.textBaseline = 'top'; lines(c, title, W - 96, 1).forEach(function (l) { c.fillText(l, 48, 180); }); top = 258; }
    // Cuadrícula
    var cols = n <= 1 ? 1 : n <= 4 ? 2 : 3, rows = Math.ceil(n / cols), pad = 48, gap = 22, foot = 112;
    var gw = W - pad * 2, gh = H - top - foot - 26;
    var cw = (gw - gap * (cols - 1)) / cols, ch = Math.min((gh - gap * (rows - 1)) / rows, cols === 1 ? 960 : 9999);
    var k = cols === 3 ? (rows === 3 ? .72 : .82) : rows === 1 && cols === 1 ? 1.25 : 1;
    sel.forEach(function (s, i) {
      var r = Math.floor(i / cols), col = i % cols, inRow = Math.min(cols, n - r * cols);
      var x = pad + col * (cw + gap) + (cols - inRow) * (cw + gap) / 2, y = top + r * (ch + gap);
      c.save(); c.shadowColor = 'rgba(0,0,0,.06)'; c.shadowBlur = 18; c.shadowOffsetY = 6; c.fillStyle = '#fff'; rr(c, x, y, cw, ch, 26); c.fill(); c.restore();
      var tH = Math.round(150 * k) + (s.m.label ? Math.round(30 * k) : 0), ip = 18 * k, ibox = { x: x + ip, y: y + ip, w: cw - ip * 2, h: ch - tH - ip * 1.5 };
      var im = imgs[i];
      if (im) { var sc = Math.min(ibox.w / im.width, ibox.h / im.height); var iw = im.width * sc, ih = im.height * sc; c.drawImage(im, ibox.x + (ibox.w - iw) / 2, ibox.y + (ibox.h - ih) / 2, iw, ih); }
      else { c.fillStyle = '#f1f2f4'; rr(c, ibox.x, ibox.y, ibox.w, ibox.h, 18); c.fill(); c.fillStyle = '#9aa1a9'; c.font = '700 ' + Math.round(30 * k) + 'px ' + FONT; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText(s.it.brand || 'SUPGO', ibox.x + ibox.w / 2, ibox.y + ibox.h / 2); c.textAlign = 'left'; }
      // Número
      var bR = 24 * k; c.fillStyle = '#111'; c.beginPath(); c.arc(x + 20 * k + bR, y + 20 * k + bR, bR, 0, Math.PI * 2); c.fill();
      c.fillStyle = '#c6f432'; c.font = '800 ' + Math.round(28 * k) + 'px ' + FONT; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText(String(i + 1), x + 20 * k + bR, y + 20 * k + bR + 1); c.textAlign = 'left';
      // Textos
      var tx = x + 22 * k, tw = cw - 44 * k, ty = y + ch - tH;
      c.textBaseline = 'top'; c.fillStyle = '#6b7280'; c.font = '600 ' + Math.round(22 * k) + 'px ' + FONT; c.fillText(lines(c, s.it.brand, tw, 1)[0] || '', tx, ty);
      ty += 30 * k; c.fillStyle = '#111'; c.font = '700 ' + Math.round(27 * k) + 'px ' + FONT;
      var nl = lines(c, s.it.name, tw, 2); nl.forEach(function (l, j) { c.fillText(l, tx, ty + j * 33 * k); }); ty += Math.max(nl.length, 1) * 33 * k + 2;
      if (s.m.label) { c.fillStyle = '#4b5563'; c.font = '500 ' + Math.round(22 * k) + 'px ' + FONT; c.fillText(lines(c, s.m.label, tw, 1)[0], tx, ty); ty += 30 * k; }
      var py = y + ch - 52 * k;
      if (s.m.price) {
        c.fillStyle = s.m.sale ? '#b91c1c' : '#111'; c.font = '800 ' + Math.round(34 * k) + 'px ' + FONT; c.fillText(cop(s.m.sale || s.m.price), tx, py);
        if (s.m.sale) { var pw = c.measureText(cop(s.m.sale)).width + 12; c.fillStyle = '#9ca3af'; c.font = '500 ' + Math.round(21 * k) + 'px ' + FONT; var t0 = cop(s.m.price); c.fillText(t0, tx + pw, py + 10 * k); var tw0 = c.measureText(t0).width; c.fillRect(tx + pw, py + 22 * k, tw0, 2); }
      } else { c.fillStyle = '#111'; c.font = '700 ' + Math.round(26 * k) + 'px ' + FONT; c.fillText('Consultar precio', tx, py); }
    });
    // Pie
    c.fillStyle = '#c6f432'; c.fillRect(0, H - foot, W, foot);
    c.fillStyle = '#111'; c.textBaseline = 'middle'; c.font = '800 34px ' + FONT; c.fillText('Pide por WhatsApp ' + WA, 48, H - foot / 2);
    c.font = '700 28px ' + FONT; c.textAlign = 'right'; c.fillText('supgo.co', W - 48, H - foot / 2); c.textAlign = 'left';
  }
  function texto() {
    var nombre = (($('name') || {}).value || '').trim().split(/\s+/)[0];
    var t = (nombre ? 'Hola ' + nombre + ', te' : 'Te') + ' comparto estas opciones:\n';
    sel.forEach(function (s, i) {
      t += '\n' + (i + 1) + '. ' + s.it.name + (s.m.label ? ' · ' + s.m.label : '') + '\n' + (s.m.price ? cop(s.m.sale || s.m.price) : 'Consultar precio') + '\n' + (s.m.url ? s.m.url + '\n' : '');
    });
    return t + '\n¿Cuál te gusta más?';
  }
  function blob() { return new Promise(function (ok) { $('epCanvas').toBlob(function (b) { ok(b); }, 'image/jpeg', 0.92); }); }
  function msg(t) { $('epMsg').textContent = t; }
  function fileName() { return 'supgo-opciones-' + new Date().toISOString().slice(0, 10) + '.jpg'; }

  /* ---------- Navegación ---------- */
  function showPick() { $('epPick').style.display = 'flex'; $('epRes').hidden = true; $('epTitle').textContent = 'Enviar productos'; drawTray(); }
  async function showRes() {
    if (!sel.length) return;
    $('epPick').style.display = 'none'; $('epRes').hidden = false; $('epTitle').textContent = 'Imagen lista'; drawTray();
    var cats = Array.from(new Set(sel.map(function (s) { return s.it.cat; })));
    if (!$('epTit').dataset.touched) $('epTit').value = cats.length === 1 && cats[0] ? 'Opciones de ' + cats[0].toLowerCase() : '';
    $('epTxt').value = texto(); msg('Generando imagen…');
    await render(); msg('');
  }
  openBtn.onclick = async function () {
    root.hidden = false; document.body.style.overflow = 'hidden'; showPick();
    if (!ITEMS.length) { $('epGrid').innerHTML = ''; $('epFoot').innerHTML = '<p class="ep-empty">Cargando productos…</p>'; try { await load(); } catch (e) { loading = null; $('epFoot').innerHTML = '<p class="ep-empty">No se pudieron cargar los productos. Revisa la conexión e intenta de nuevo.</p>'; return; } }
    drawCats(); drawGrid(); setTimeout(function () { $('epQ').focus(); }, 50);
  };
  function close() { root.hidden = true; tray.hidden = true; sheet.hidden = true; document.body.style.overflow = ''; }
  $('epClose').onclick = close;
  $('epBack').onclick = function () { if (!$('epRes').hidden) showPick(); else close(); };
  var tq; $('epQ').addEventListener('input', function () { clearTimeout(tq); tq = setTimeout(function () { q = $('epQ').value; shown = 60; drawGrid(); $('epBody').scrollTop = 0; }, 120); });
  $('epGo').onclick = showRes;
  var tt; $('epTit').addEventListener('input', function () { $('epTit').dataset.touched = '1'; clearTimeout(tt); tt = setTimeout(render, 250); });

  /* ---------- Acciones ---------- */
  $('epShare').onclick = async function () {
    var b = await blob(), f = new File([b], fileName(), { type: 'image/jpeg' }), text = $('epTxt').value;
    if (navigator.canShare && navigator.canShare({ files: [f] })) {
      try { await navigator.share({ files: [f], text: text }); msg('Listo. Si el texto no aparece, usa "Copiar texto" y pégalo.'); } catch (e) { if (e && e.name !== 'AbortError') msg('No se pudo compartir. Usa "Descargar" o "Copiar imagen".'); }
    } else msg('Este navegador no comparte imágenes. Usa "Copiar imagen" y pégala en WhatsApp Web (Ctrl+V).');
  };
  $('epCopyImg').onclick = async function () {
    try {
      var png = await new Promise(function (ok) { $('epCanvas').toBlob(ok, 'image/png'); });
      await navigator.clipboard.write([new ClipboardItem({ 'image/png': png })]);
      msg('Imagen copiada. Pégala en el chat de WhatsApp con Ctrl+V.');
    } catch (e) { msg('Este navegador no deja copiar imágenes. Usa "Descargar" o "Compartir".'); }
  };
  $('epDown').onclick = async function () {
    var b = await blob(), a = document.createElement('a'); a.href = URL.createObjectURL(b); a.download = fileName(); document.body.appendChild(a); a.click(); setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 1500); msg('Imagen descargada');
  };
  $('epCopyTxt').onclick = async function () { try { await navigator.clipboard.writeText($('epTxt').value); msg('Texto copiado'); } catch (e) { $('epTxt').select(); msg('Selecciona el texto y cópialo'); } };
  $('epWaTxt').onclick = function () {
    var d = (($('phone') || {}).value || '').replace(/\D/g, ''), t = encodeURIComponent($('epTxt').value);
    if (d.length >= 10 && d.length <= 15) window.open('https://wa.me/' + (d.length === 10 ? '57' + d : d) + '?text=' + t, '_blank');
    else window.open('https://wa.me/?text=' + t, '_blank');
  };
  window.supgoEnviarProductos = { sel: sel, load: load, render: render };
})();

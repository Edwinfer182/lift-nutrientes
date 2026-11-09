/* SUPGO · Centro de atención: saludos más rápidos.
   - Elige solo el saludo según la hora (días / tardes / noches).
   - Nombre con mayúscula inicial y frases limpias cuando no hay nombre.
   - Complementos de un toque para la segunda frase del saludo.
   - Clientes recientes para no volver a escribir nombre y celular.
   Usa las variables y funciones globales del script principal de la página. */
(function () {
  'use strict';
  var $ = function (id) { return document.getElementById(id); };
  var RECENT_KEY = 'lift-atencion-recientes-v1';

  /* ---------- Nombre y limpieza del texto ---------- */
  window.firstName = function () {
    var n = ($('name').value || '').trim().split(/\s+/)[0] || '';
    return n ? n.charAt(0).toLocaleUpperCase('es') + n.slice(1).toLocaleLowerCase('es') : '';
  };
  function limpiar(t) {
    return t.replace(/\s+([,.])/g, '$1').replace(/,\s*,/g, ',').replace(/^\s*,\s*/, '').replace(/(Hola|Buenos días|Buenas tardes|Buenas noches|Qué más|Gracias por todo|Listo|Bueno|Excelente|Cordial saludo),\s*\./g, '$1.')
      .replace(/ {2,}/g, ' ').replace(/^\s+|\s+$/g, '').replace(/^([a-záéíóúñ¿])/, function (c) { return c.toLocaleUpperCase('es'); });
  }
  window.generated = function () {
    var row = source()[category] && source()[category][active];
    return limpiar(String(row ? row[1] : '').replaceAll('{nombre}', firstName()));
  };

  /* ---------- Saludo según la hora ---------- */
  function franja() { var h = new Date().getHours(); return h < 12 ? /d[ií]as|amaneci/i : h < 19 ? /tardes/i : /noches/i; }
  function elegirPorHora() {
    var list = source()[category] || [];
    if (!/^salud/i.test(category)) return false;
    var re = franja(), i = list.findIndex(function (r) { return re.test(r[0]); });
    if (i < 0) return false;
    active = i; page = Math.floor(i / 8); render(); refresh(true); return true;
  }

  /* ---------- Complementos (segunda frase) ---------- */
  var EXTRA = {
    regular: [['¿En qué te ayudo?', 'En qué te puedo ayudar'], ['¿Qué buscas?', 'Cuéntame qué estás buscando'], ['Gracias por escribir', 'Gracias por escribirnos'], ['¿Cómo te fue?', 'Cómo te fue con el producto'], ['Te muestro opciones', 'Ya te muestro algunas opciones'], ['Ya te reviso', 'Dame un momento y te reviso']],
    formal: [['¿En qué le ayudo?', '¿En qué le puedo ayudar?'], ['¿Qué busca?', 'Cuénteme qué producto está buscando'], ['Gracias por escribir', 'Gracias por comunicarse con SUPGO'], ['Le reviso', 'Deme un momento y le reviso']],
    provider: [['¿Cómo está la disponibilidad?', 'Cómo está la disponibilidad hoy'], ['¿Me ayudas con un pedido?', 'Me ayudas con un pedido'], ['¿Lista de precios?', 'Me compartes la lista de precios actualizada']]
  };
  var bar = document.createElement('div');
  bar.id = 'extraBar';
  bar.innerHTML = '<span class="label" style="margin:2px 0 5px">Agregar al saludo</span><div class="sx-chips"></div>';
  var css = document.createElement('style');
  css.textContent = '#extraBar{margin:0 0 9px}#extraBar[hidden]{display:none}.sx-chips{display:flex;flex-wrap:wrap;gap:6px}.sx-chips button{border:1px dashed #b9c3cc;background:#fff;border-radius:20px;padding:7px 11px;font-size:12px;font-weight:600;color:#34414a;cursor:pointer}.sx-chips button.on{border-style:solid;border-color:#68ad86;background:#e2f3e9;color:#086f39}' +
    '#recent{display:flex;gap:6px;overflow-x:auto;scrollbar-width:none;margin:8px 0 0}#recent::-webkit-scrollbar{display:none}#recent[hidden]{display:none}#recent button{flex:0 0 auto;border:1px solid #e0e5ec;background:#fff;border-radius:20px;padding:6px 10px;font-size:12px;color:#34414a;cursor:pointer}#recent button b{font-weight:650;text-transform:capitalize}#recent small{color:#8a949e;margin-left:4px}#recent .rx{border:0;background:none;color:#8a949e;padding:6px 4px}';
  document.head.appendChild(css);
  var chips = $('chips'); if (chips) chips.insertAdjacentElement('afterend', bar);
  var extras = [];
  function drawExtras() {
    bar.hidden = !/^salud/i.test(category);
    var list = EXTRA[mode] || EXTRA.regular;
    bar.querySelector('.sx-chips').innerHTML = list.map(function (e, i) { return '<button type="button" data-x="' + i + '" class="' + (extras.indexOf(e[1]) >= 0 ? 'on' : '') + '">+ ' + e[0] + '</button>'; }).join('');
    bar.querySelectorAll('[data-x]').forEach(function (b) {
      b.onclick = function () {
        var e = list[+b.dataset.x][1], k = extras.indexOf(e);
        if (k >= 0) extras.splice(k, 1); else extras.push(e);
        aplicarExtras(); drawExtras();
      };
    });
  }
  function frase(e) { return /^[¿¡]/.test(e) ? e : (/\?$/.test(e) || /^(En qué|Cómo|Me ayudas|Me compartes)/.test(e) ? '¿' + e.replace(/\?$/, '') + '?' : e + '.'); }
  function aplicarExtras() {
    var base = generated(), t = base;
    if (extras.length) t = base.replace(/[.\s]*$/, '') + (/[?!]$/.test(base) ? ' ' : '. ') + extras.map(frase).join(' ');
    $('message').value = t; lastGenerated = t;
  }

  /* ---------- Clientes recientes ---------- */
  function recientes() { try { return JSON.parse(localStorage.getItem(RECENT_KEY) || '[]') || []; } catch (e) { return []; } }
  function guardarReciente() {
    var n = ($('name').value || '').trim(), d = ($('phone').value || '').replace(/\D/g, '');
    if (d.length < 10) return;
    var list = recientes().filter(function (r) { return r.d !== d; });
    list.unshift({ n: n, d: d, t: Date.now() });
    try { localStorage.setItem(RECENT_KEY, JSON.stringify(list.slice(0, 12))); } catch (e) {}
    drawRecent();
  }
  var rec = document.createElement('div'); rec.id = 'recent';
  var ident = document.querySelector('.identity'); if (ident) ident.insertAdjacentElement('afterend', rec);
  function drawRecent() {
    var list = recientes();
    rec.hidden = !list.length;
    rec.innerHTML = list.map(function (r, i) { return '<button type="button" data-r="' + i + '"><b>' + (r.n ? r.n.replace(/[<>&"]/g, '') : 'Sin nombre') + '</b><small>' + r.d.slice(-4) + '</small></button>'; }).join('') + (list.length ? '<button type="button" class="rx" id="recClear" title="Borrar recientes">Limpiar</button>' : '');
    rec.querySelectorAll('[data-r]').forEach(function (b) {
      b.onclick = function () { var r = recientes()[+b.dataset.r]; $('name').value = r.n; $('phone').value = r.d; if (extras.length) aplicarExtras(); else refresh(true); };
    });
    var c = $('recClear'); if (c) c.onclick = function () { if (confirm('¿Borrar la lista de clientes recientes de este navegador?')) { localStorage.removeItem(RECENT_KEY); drawRecent(); } };
  }

  /* ---------- Enganches con la página ---------- */
  var origRender = window.render;
  window.render = function () { origRender(); drawExtras(); };
  document.addEventListener('click', function (e) {
    var t = e.target.closest && e.target.closest('[data-cat],[data-mode],[data-i],#prev,#next');
    if (!t) return;
    extras = [];
    setTimeout(function () { if (t.matches('[data-cat],[data-mode]')) elegirPorHora(); drawExtras(); }, 0);
  });
  $('name').addEventListener('input', function () { if (extras.length) aplicarExtras(); });
  $('phone').addEventListener('paste', function () { setTimeout(function () { var d = $('phone').value.replace(/\D/g, ''); if (d.length === 12 && d.indexOf('57') === 0) d = d.slice(2); $('phone').value = d; }, 0); });
  var send = $('send'); if (send) send.addEventListener('click', guardarReciente, true);
  var copy = $('copy'); if (copy) copy.addEventListener('click', function () { if (($('phone').value || '').replace(/\D/g, '').length >= 10) guardarReciente(); }, true);
  drawRecent();
  if (!elegirPorHora()) { render(); refresh(true); }
})();

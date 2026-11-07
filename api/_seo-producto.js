/* SUPGO · Textos SEO de la ficha de producto calculados con los datos actuales del producto.
 * Los textos guardados en lift_producto_seo se usan solo si describen a ESTE producto y no son
 * la plantilla genérica; si no, se construyen con nombre, sabor, marca, categoría, tamaño,
 * servicios y precio. Así cada ficha tiene título, descripción y contenido propios. */
'use strict';

const esc = v => String(v == null ? '' : v).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const str = v => String(v == null ? '' : v).trim();
const plain = v => str(v).replace(/<[^>]*>/g, ' ').replace(/&nbsp;/g, ' ').replace(/\s+/g, ' ').trim();
const norm = s => String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
const words = s => norm(s).split('-').filter(w => w.length > 2);
const cop = n => '$' + Math.round(n).toLocaleString('es-CO');

const COPIA = /\s*-\s*copia\s*$/i;
const esCopia = (name, slug) => COPIA.test(str(name)) || /-copia(?:-\d+)?$/.test(str(slug));
const limpiarNombre = name => str(name).replace(COPIA, '').replace(/\s*[-–|·]\s*$/, '').replace(/\s{2,}/g, ' ').trim();

/* Plantillas genéricas detectadas en lift_producto_seo (iguales en ~1.060 fichas). */
const GENERICOS = [
  /consulta el precio actualizado, la disponibilidad y las opciones de env[ií]o/i,
  /^(compra|consulta)\s.+\sen supgo(\smedell[ií]n)?\.\s*(consulta )?precio y disponibilidad/i
];
const esGenerico = t => GENERICOS.some(r => r.test(plain(t)));

/* ¿El texto habla de este producto? Debe contener la mayoría de palabras del nombre. */
function hablaDe(texto, nombre) {
  const t = '-' + norm(texto) + '-', w = words(nombre).filter(x => !/^\d+$/.test(x));
  if (!w.length) return false;
  return w.filter(x => t.includes('-' + x + '-') || t.includes(x)).length / w.length >= 0.7;
}

/* Sabor o variante: palabras del slug que no están en el nombre ni en la marca. */
function variante(nombre, marca, slug, id) {
  const usadas = new Set([...norm(nombre).split('-'), ...norm(marca).split('-')]);
  const extra = norm(slug).split('-').filter(w => w && !usadas.has(w) && w !== String(id) && w !== 'copia');
  if (!extra.length || extra.length > 6) return '';
  return extra.map(w => /^\d/.test(w) ? w : w[0].toUpperCase() + w.slice(1)).join(' ');
}

const UNIDADES = [
  [/(\d+(?:[.,]\d+)?)\s*(lbs?|libras?)\b/i, (n) => n + ' lb'],
  [/(\d+(?:[.,]\d+)?)\s*(kg|kilos?)\b/i, (n) => n + ' kg'],
  [/(\d+(?:[.,]\d+)?)\s*(g|gr|grs|grm|gramos)\b/i, (n) => n + ' g'],
  [/(\d+(?:[.,]\d+)?)\s*(ml)\b/i, (n) => n + ' ml'],
  [/(\d+(?:[.,]\d+)?)\s*(oz)\b/i, (n) => n + ' oz']
];
function datosDe(texto) {
  const t = str(texto), out = {};
  for (const [re, f] of UNIDADES) { const m = t.match(re); if (m) { out.contenido = f(m[1].replace(',', '.')); break; } }
  const s = t.match(/(\d+)\s*(servicios|serv|srv|porciones|servings|scoops)\b/i);
  if (s) out.servicios = Number(s[1]);
  const u = t.match(/(\d+)\s*(c[aá]psulas|caps?|capsules|tabletas|tabs?|tablets|softgels|gomitas|gummies|sachets?|unidades|und|barras|sobres)\b/i);
  if (u) out.unidades = u[1] + ' ' + u[2].toLowerCase().replace(/^caps?$/, 'cápsulas').replace(/^tabs?$/, 'tabletas').replace(/^und$/, 'unidades');
  return out;
}

/* Contexto general por tipo de producto. Sin promesas de salud: solo qué es y qué comparar. */
const CATEGORIAS = [
  [/whey|iso|prote[ií]na|carne|vegan/i, 'Las proteínas en polvo se usan para completar la ingesta diaria de proteína cuando la alimentación no alcanza. Al compararlas, mira los gramos de proteína por servicio, el tipo (concentrada, aislada, hidrolizada, de carne o vegetal), los azúcares y el precio por servicio.'],
  [/creatin/i, 'La creatina es uno de los suplementos deportivos más estudiados. Las presentaciones cambian sobre todo en el tipo (monohidrato, HCl o mezclas), el tamaño del envase y si viene sin sabor, saborizada, en cápsulas o masticable.'],
  [/pre ?entreno|pre-?workout/i, 'Los preentrenos combinan ingredientes como cafeína, citrulina o beta alanina para tomar antes de entrenar. Revisa la cantidad de cafeína por servicio y las advertencias del fabricante, sobre todo si eres sensible a los estimulantes.'],
  [/ganador|gainer|masa/i, 'Los ganadores de masa aportan calorías, carbohidratos y proteína en un solo batido. Compara las calorías y la proporción de carbohidratos y proteína por servicio según tu objetivo.'],
  [/quemador|carnitina|yohimbina|cafe[ií]na/i, 'Los productos de esta categoría suelen contener estimulantes o compuestos como L-carnitina. Lee la etiqueta completa y respeta la porción indicada por el fabricante.'],
  [/amino|bcaa|eaa|glutamina|recuperaci/i, 'Los aminoácidos (BCAA, EAA o glutamina) se toman durante o después del entrenamiento. Compara los gramos de aminoácidos por servicio y si incluye electrolitos u otros ingredientes.'],
  [/hidrataci|electrolit/i, 'Los productos de hidratación aportan electrolitos como sodio, potasio y magnesio. Compara el contenido por servicio y si contienen azúcar o carbohidratos.'],
  [/vitamina|mineral|magnesio|omega|multivit|col[aá]geno|antioxidante|esencial|greens|cabello|articulaci|digesti|probi[oó]tico|hep[aá]tico|ashwagandha|ginkgo|inositol|sue[nñ]o|melatonina|nootr[oó]pico|salud|hormonal|testosterona/i, 'En los suplementos de bienestar conviene revisar la dosis por porción, la forma del ingrediente y la cantidad de cápsulas o tabletas del envase. Si tomas medicamentos o tienes una condición de salud, consulta a un profesional antes de usarlos.'],
  [/snack|bebida|barra/i, 'Los snacks y bebidas proteicas son una opción práctica para llevar. Compara la proteína, las calorías y los azúcares por unidad.']
];
const contextoCategoria = cat => (CATEGORIAS.find(([re]) => re.test(cat || '')) || [null, ''])[1];

/**
 * @param {{id:number, slug:string, product:object}} row  fila de lift_productos
 * @param {object} seo  fila de lift_producto_seo (puede venir vacía)
 * @returns {{nombre, nombreCompleto, titulo, meta, html, copia}}
 */
function construirSeo(row, seo) {
  const p = row.product || {};
  seo = seo || {};
  const nombre = limpiarNombre(p.name || p.nombre);
  const marca = str(p.brand || p.marca);
  const categoria = str(p.category || p.categoria);
  const presentacion = str(p.presentation || p.presentacion);
  const saborGuardado = str(p.flavor || p.sabor);
  const extra = variante(nombre, marca, row.slug, row.id);
  const sabor = saborGuardado && !norm(nombre).includes(norm(saborGuardado)) ? saborGuardado : extra;
  const nombreCompleto = sabor && !norm(nombre).includes(norm(sabor)) ? nombre + ' ' + sabor : nombre;
  const precio = Number(p.price ?? p.precio ?? 0);
  const d = datosDe([nombreCompleto, presentacion].join(' '));
  const conMarca = marca && !norm(nombreCompleto).includes(norm(marca)) && !/^varias marcas$/i.test(marca);

  // Título: el guardado solo si es de este producto e incluye la variante.
  let titulo = str(seo.titulo_seo);
  const tituloOk = titulo && hablaDe(titulo, nombre) && (!sabor || norm(titulo).includes(norm(sabor))) && !/\s-\s*\|/.test(titulo);
  if (!tituloOk) {
    titulo = nombreCompleto + (conMarca ? ' ' + marca : '') + ' | SUPGO';
    if (titulo.length > 70 && conMarca) titulo = nombreCompleto + ' | SUPGO';
  }

  // Meta descripción: la guardada solo si no es la plantilla y habla de este producto.
  let meta = plain(seo.meta_descripcion);
  if (!meta || esGenerico(meta) || !hablaDe(meta, nombre)) {
    const detalle = [d.contenido, d.servicios ? d.servicios + ' servicios' : '', d.unidades].filter(Boolean).join(', ');
    meta = nombreCompleto + (conMarca ? ' de ' + marca : '') + ' en SUPGO' +
      (detalle ? ' (' + detalle + ')' : '') + (precio > 0 ? ' a ' + cop(precio) : '') +
      '. ' + (categoria ? categoria + ' con envío' : 'Envío') + ' en Medellín y a toda Colombia.';
  }

  // Contenido largo: el texto guardado se conserva solo si es propio de este producto;
  // en todos los casos se agrega la ficha con los datos actuales.
  const guardado = str(seo.descripcion_larga_html);
  const propio = guardado && !esGenerico(guardado) && hablaDe(guardado, nombre);
  let desc = plain(p.description || p.descripcion);
  if (desc.length < 40 || /^https?:\/\/\S+$/.test(desc)) desc = ''; // a veces guarda solo la URL de la tabla nutricional
  const fichas = [];
  if (marca) fichas.push(['Marca', marca]);
  if (categoria) fichas.push(['Categoría', categoria]);
  if (presentacion) fichas.push(['Presentación', presentacion]);
  else if (d.contenido || d.unidades) fichas.push(['Contenido', [d.contenido, d.unidades].filter(Boolean).join(' · ')]);
  if (d.servicios) fichas.push(['Servicios por envase', String(d.servicios)]);
  if (sabor) fichas.push(['Sabor o variante', sabor]);
  if (precio > 0) fichas.push(['Precio', cop(precio) + ' COP']);
  if (precio > 0 && d.servicios > 1) fichas.push(['Precio por servicio', 'aprox. ' + cop(precio / d.servicios)]);
  const lista = fichas.length ? '<h3>Ficha del producto</h3><ul>' + fichas.map(([k, v]) => '<li><strong>' + esc(k) + ':</strong> ' + esc(v) + '</li>').join('') + '</ul>' : '';
  let html;
  if (propio) {
    html = guardado + lista;
  } else {
    const frase = nombreCompleto + ' es ' + (categoria ? 'un producto de la categoría ' + categoria : 'un suplemento') +
      (conMarca ? ' de la marca ' + marca : '') +
      ((d.contenido || d.unidades) ? ', en presentación de ' + [d.contenido, d.unidades].filter(Boolean).join(' / ') : '') +
      (d.servicios ? ' con ' + d.servicios + ' servicios' : '') + '.' +
      (precio > 0 ? ' En SUPGO cuesta ' + cop(precio) + (d.servicios > 1 ? ', unos ' + cop(precio / d.servicios) + ' por servicio' : '') + '.' : '');
    const ctx = contextoCategoria(categoria + ' ' + nombre);
    html = '<h2>' + esc(nombreCompleto) + (conMarca ? ' · ' + esc(marca) : '') + '</h2>' +
      (desc ? '<p>' + esc(desc) + '</p>' : '') +
      '<p>' + esc(frase) + '</p>' + lista +
      (ctx ? '<h3>Qué tener en cuenta</h3><p>' + esc(ctx) + '</p>' : '') +
      '<h3>Compra y envío</h3><p>Puedes pagar ' + esc(nombreCompleto) + ' por transferencia Bre-B, por corresponsal bancario o con tarjeta a través de Bold cuando esté disponible en el checkout. ' +
      'En Medellín y el área metropolitana, los pedidos confirmados antes de las 2:00 p. m. pueden salir el mismo día según cobertura; a otras ciudades de Colombia la entrega estimada es de 1 a 3 días hábiles. ' +
      'Antes de usarlo, sigue la porción y las advertencias de la etiqueta del fabricante.</p>';
  }
  return { nombre, nombreCompleto, titulo, meta, html, copia: esCopia(p.name || p.nombre, row.slug) };
}

module.exports = { construirSeo, esCopia, limpiarNombre, esGenerico, hablaDe };

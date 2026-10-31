"""Textos SEO propios de categorías y marcas de SUPGO.

Los usa scripts/generar_listados_seo.py. Regla legal (Decreto 3249 de 2006, art. 24 y 25):
solo se describen presentaciones, formatos, sabores, datos de etiqueta, cómo comparar,
envíos y pagos. Nunca efectos, beneficios, usos preventivos o terapéuticos, ni comparaciones
que desmeriten un producto. El generador revisa PALABRAS_PROHIBIDAS antes de publicar.

Cada entrada: title (≤60 aprox.), meta (≤155), h1, intro (1–2 frases, arriba de los
productos), secciones [(h2, html)] y faq [(pregunta, respuesta)] (debajo de los productos).
"""

ENVIO = ("Hacemos envíos desde Medellín. En Medellín y el área metropolitana los pedidos hechos antes de las "
         "2 p. m. en días hábiles suelen llegar el mismo día; al resto de Colombia, entre 1 y 3 días hábiles según el destino. "
         "El valor del envío se calcula al finalizar la compra.")
PAGO = ("Puedes pagar con tarjeta, PSE, Nequi, Bancolombia, Bre-B o Apple Pay. En Medellín también "
        "está disponible el pago contraentrega en efectivo.")

TEXTOS = {
    # ───────────────────────────── Categorías ─────────────────────────────
    ("categoria", "proteinas-iso"): {
        "title": "Proteína ISO (aislada) en Medellín y Colombia | SUPGO",
        "meta": "Proteína ISO aislada de suero en Medellín: ISO 100, Gold Standard Isolate y más. Compara tamaños, sabores y precios. Envíos a toda Colombia.",
        "h1": "Proteínas ISO (aislado de suero)",
        "intro": "Proteínas de suero aislado de varias marcas, en presentaciones de 1 a 6 libras. Compara tamaño, sabor y precio por servicio antes de elegir.",
        "secciones": [
            ("Qué es una proteína ISO", "<p>«ISO» viene de <em>isolate</em>: proteína de suero de leche que pasó por un filtrado adicional, de modo que la etiqueta declara una mayor proporción de proteína por gramo de polvo y menos grasa, carbohidratos y lactosa que un concentrado. Algunas fórmulas combinan aislado con aislado hidrolizado; el primer ingrediente de la lista te dice cuál predomina.</p>"),
            ("Cómo comparar antes de comprar", "<ul><li><strong>Gramos de proteína por servicio</strong> y tamaño del servicio, tal como aparecen en la tabla nutricional.</li><li><strong>Precio por libra o por servicio</strong>: los envases grandes suelen salir más económicos por servicio.</li><li><strong>Sabor</strong>: si es tu primera vez con una marca, un envase pequeño te deja probarlo.</li><li><strong>Alérgenos</strong>: contienen leche y algunas, soya. Revisa el rótulo.</li></ul>"),
            ("Presentaciones disponibles", "<p>Encontrarás envases desde 0,9 hasta 6 libras y sabores clásicos como chocolate, vainilla y fresa, además de opciones de temporada según la marca. Si buscas una comparación directa entre las dos más pedidas, revisa la guía <a href=\"/guias/iso-100-vs-gold-standard.html\">ISO 100 vs Gold Standard</a>.</p>"),
        ],
        "faq": [
            ("¿Cuál es la diferencia entre proteína ISO y whey?", "La whey (concentrado) y la ISO (aislado) vienen del suero de leche; el aislado tiene un filtrado adicional, por eso su etiqueta declara más proteína y menos lactosa, grasa y carbohidratos por gramo. Revisa la tabla nutricional de cada producto para comparar."),
            ("¿Qué tamaño me conviene?", "Depende de cuántos servicios quieras: un envase de 5 libras trae aproximadamente el doble de servicios que uno de 2 libras y normalmente un menor precio por servicio. El número de servicios aparece en cada ficha y en la etiqueta."),
            ("¿Cuánto tarda el envío?", ENVIO),
            ("¿Cómo puedo pagar?", PAGO),
        ],
    },
    ("categoria", "proteinas-whey"): {
        "title": "Proteína Whey en Medellín y Colombia: precios | SUPGO",
        "meta": "Proteína whey en Medellín: Gold Standard, Bi-Pro, Best Protein, Syntha-6 y más. Compara tamaños de 2 a 10 lb, sabores y precios. Envíos a Colombia.",
        "h1": "Proteínas Whey",
        "intro": "Proteínas de suero de leche (concentrado y mezclas) de las marcas más pedidas, en envases de 2 a 10 libras y muchos sabores.",
        "secciones": [
            ("Qué encontrarás en esta categoría", "<p>Proteínas en polvo cuya base es el suero de leche: concentrados, mezclas de concentrado y aislado, y fórmulas con varias fuentes de proteína. La lista de ingredientes indica el orden y el tipo de proteína de cada producto.</p>"),
            ("Cómo elegir entre tantas opciones", "<ul><li><strong>Tipo de proteína</strong>: concentrado, mezcla o aislado; el primer ingrediente manda.</li><li><strong>Proteína por servicio</strong> y número de servicios del envase.</li><li><strong>Precio por servicio</strong>: divide el precio entre los servicios declarados.</li><li><strong>Sabor y tamaño</strong>: chocolate, vainilla, cookies &amp; cream, fresa y más, en envases de 2, 4, 5 y 10 libras.</li></ul><p>Si es tu primera proteína, revisa la guía <a href=\"/guias/proteina-para-principiantes.html\">Proteína para principiantes</a> y la tabla de <a href=\"/guias/precio-proteina-colombia.html\">precios de la proteína whey</a>.</p>"),
        ],
        "faq": [
            ("¿Qué significa whey?", "Whey es la palabra en inglés para el suero de leche. Una proteína whey es un polvo elaborado a partir de ese suero; puede ser concentrado, aislado o una mezcla."),
            ("¿Contienen lactosa?", "Las proteínas de suero vienen de la leche. La cantidad de lactosa depende del tipo (el aislado suele declarar menos) y aparece en la etiqueta junto con los alérgenos."),
            ("¿Cuánto tarda el envío?", ENVIO),
            ("¿Cómo puedo pagar?", PAGO),
        ],
    },
    ("categoria", "creatinas"): {
        "title": "Creatina en Medellín y Colombia: precios 2026 | SUPGO",
        "meta": "Creatina monohidratada y otras presentaciones en Medellín: polvo, cápsulas y masticables de más de 30 marcas. Compara tamaños y precios. Envíos a Colombia.",
        "h1": "Creatinas",
        "intro": "Creatina en polvo, cápsulas y masticables de más de 30 marcas. Compara tipo, tamaño del envase y servicios antes de comprar.",
        "secciones": [
            ("Tipos de creatina en el catálogo", "<p>La más común es la <strong>creatina monohidratada</strong>, que algunas marcas identifican con sellos como Creapure®. También encontrarás mezclas con otros ingredientes, creatina en cápsulas y presentaciones masticables. El tipo exacto está en la lista de ingredientes de cada ficha.</p>"),
            ("Cómo comparar", "<ul><li><strong>Gramos por servicio</strong> (lo habitual son 3 a 5 g) y número de servicios del envase.</li><li><strong>Formato</strong>: polvo sin sabor, polvo saborizado, cápsulas o masticables.</li><li><strong>Precio por servicio</strong>: un envase de 300 g de 5 g por servicio trae unos 60 servicios.</li></ul><p>Amplía la información en <a href=\"/guias/que-creatina-comprar-colombia.html\">Qué creatina comprar en Colombia</a> y consulta la tabla de <a href=\"/guias/precio-creatina-colombia.html\">precios de la creatina</a>.</p>"),
        ],
        "faq": [
            ("¿Qué es la creatina monohidratada?", "Es la forma de creatina más usada en los suplementos: creatina unida a una molécula de agua. Aparece así en la lista de ingredientes."),
            ("¿Cuántos servicios trae un envase?", "Depende del tamaño y de la porción declarada. Con porciones de 5 g, 300 g rinden unos 60 servicios y 1 kg unos 200. Cada ficha y etiqueta indica el número exacto."),
            ("¿Cuánto tarda el envío?", ENVIO),
            ("¿Cómo puedo pagar?", PAGO),
        ],
    },
    ("categoria", "precursores-de-testosterona"): {
        "title": "Precursores de testosterona en Medellín | SUPGO",
        "meta": "Productos que sus fabricantes clasifican como precursores de testosterona, en cápsulas y tabletas. Consulta ingredientes y precio. Envíos a Colombia.",
        "h1": "Precursores de testosterona",
        "intro": "Productos que sus fabricantes ubican en esta categoría, en cápsulas y tabletas. En SUPGO describimos presentación, ingredientes declarados y precio.",
        "secciones": [
            ("Qué encontrarás aquí", "<p>Fórmulas en cápsulas o tabletas que combinan ingredientes como zinc, magnesio, vitamina D, extractos de plantas (por ejemplo tribulus, fenogreco o ashwagandha) u otros, según cada fabricante. El nombre de la categoría corresponde a cómo la marca clasifica el producto; la composición exacta y la cantidad por servicio están en la etiqueta.</p>"),
            ("Antes de comprar", "<ul><li>Lee la <strong>lista de ingredientes</strong> y la cantidad por servicio.</li><li>Revisa las <strong>advertencias del rótulo</strong> y el número de servicios del envase.</li><li>Si tomas medicamentos o tienes una condición de salud, consulta a un profesional de la salud antes de usar cualquier suplemento.</li></ul>"),
        ],
        "faq": [
            ("¿Qué presentaciones hay?", "Principalmente cápsulas y tabletas, en envases de 30 a 120 unidades o más según el producto. Cada ficha muestra la presentación y los servicios."),
            ("¿Dónde veo los ingredientes?", "En la ficha de cada producto y en la etiqueta del envase, junto con la cantidad por servicio y las advertencias del fabricante."),
            ("¿Cuánto tarda el envío?", ENVIO),
            ("¿Cómo puedo pagar?", PAGO),
        ],
    },
    ("categoria", "hidratacion-y-electrolitos"): {
        "title": "Electrolitos e hidratación en Medellín | SUPGO",
        "meta": "Electrolitos en polvo, sobres y bebidas para preparar en Medellín. Compara sabores, presentaciones y contenido por servicio. Envíos a toda Colombia.",
        "h1": "Hidratación y electrolitos",
        "intro": "Electrolitos en polvo, sobres individuales y mezclas para preparar, de varias marcas y sabores.",
        "secciones": [
            ("Qué contiene esta categoría", "<p>Bebidas en polvo que declaran minerales como sodio, potasio, magnesio y cloruro, a veces con carbohidratos o vitaminas. Vienen en tarros de varios servicios o en sobres individuales fáciles de llevar.</p>"),
            ("Cómo comparar", "<ul><li><strong>Contenido por servicio</strong> de cada mineral, según la tabla nutricional.</li><li><strong>Carbohidratos y azúcares</strong>: hay versiones con y sin azúcar.</li><li><strong>Formato</strong>: tarro o sobres; y número de servicios.</li><li><strong>Sabor</strong>: limón, frutos rojos, maracuyá y más, según la marca.</li></ul>"),
        ],
        "faq": [
            ("¿Tarro o sobres?", "El tarro suele salir más económico por servicio; los sobres individuales son prácticos para llevar en el bolso o la maleta del gimnasio."),
            ("¿Tienen azúcar?", "Depende del producto: algunos declaran carbohidratos y otros son sin azúcar. Revisa la tabla nutricional de cada ficha."),
            ("¿Cuánto tarda el envío?", ENVIO),
            ("¿Cómo puedo pagar?", PAGO),
        ],
    },
    ("categoria", "quemadores"): {
        "title": "Quemadores en Medellín: cápsulas y polvo | SUPGO",
        "meta": "Productos de la categoría quemadores en cápsulas y polvo de más de 20 marcas. Consulta ingredientes, contenido de cafeína y precio. Envíos desde Medellín.",
        "h1": "Quemadores",
        "intro": "Productos que sus fabricantes clasifican en esta categoría, en cápsulas, polvo y sobres. Te mostramos presentación, ingredientes declarados y precio.",
        "secciones": [
            ("Qué encontrarás aquí", "<p>Fórmulas en cápsulas o en polvo para preparar, de más de 20 marcas. Muchas incluyen cafeína u otros estimulantes y extractos de plantas; otras son sin estimulantes. El nombre de la categoría corresponde a cómo cada marca clasifica su producto.</p>"),
            ("Antes de comprar", "<ul><li>Revisa los <strong>mg de cafeína por servicio</strong> declarados y suma la que consumes en café o bebidas energéticas.</li><li>Lee la <strong>lista de ingredientes</strong> y las <strong>advertencias del rótulo</strong>.</li><li>Compara el <strong>número de servicios</strong> y el precio por servicio.</li><li>Si tomas medicamentos, estás en embarazo o tienes una condición de salud, consulta a un profesional antes de usarlos.</li></ul>"),
        ],
        "faq": [
            ("¿Hay opciones sin estimulantes?", "Sí. En la ficha y la etiqueta de cada producto se indica si contiene cafeína u otros estimulantes y en qué cantidad."),
            ("¿Qué presentaciones hay?", "Cápsulas (30 a 180 unidades según el producto), polvo para preparar y sobres individuales."),
            ("¿Cuánto tarda el envío?", ENVIO),
            ("¿Cómo puedo pagar?", PAGO),
        ],
    },
    ("categoria", "pre-entrenos"): {
        "title": "Pre entrenos en Medellín y Colombia | SUPGO",
        "meta": "Pre entrenos en Medellín de más de 25 marcas: con y sin estimulantes, de 20 a 60 servicios. Compara cafeína, sabores y precio. Envíos a toda Colombia.",
        "h1": "Pre entrenos",
        "intro": "Pre entrenos en polvo de más de 25 marcas, con y sin estimulantes, de 20 a 60 servicios.",
        "secciones": [
            ("Cómo leer la etiqueta de un pre entreno", "<p>Los pre entrenos combinan ingredientes como cafeína, beta-alanina, citrulina, arginina o taurina, en cantidades que varían mucho entre marcas. Algunas fórmulas usan «mezclas patentadas» que no detallan la cantidad de cada ingrediente; otras la declaran completa.</p>"),
            ("Cómo comparar", "<ul><li><strong>Cafeína por servicio</strong> (mg) o versión <strong>sin estimulantes</strong>.</li><li><strong>Ingredientes y cantidades</strong> declaradas.</li><li><strong>Servicios por envase</strong>: 20, 30, 40 o 60.</li><li><strong>Sabor</strong>: frutas, blue raspberry, sandía, limonada y más.</li></ul><p>Consulta también la guía <a href=\"/guias/preentrenos-medellin.html\">Pre entrenos en Medellín</a>.</p>"),
        ],
        "faq": [
            ("¿Cuánta cafeína tienen?", "Varía según el producto; la cantidad en mg por servicio aparece en la etiqueta y en la ficha. Ten en cuenta la cafeína que consumes en otras bebidas y sigue las advertencias del fabricante."),
            ("¿Hay pre entrenos sin estimulantes?", "Sí, varias marcas tienen versiones sin cafeína; en el nombre o la presentación aparecen como «sin estimulantes»."),
            ("¿Cuánto tarda el envío?", ENVIO),
            ("¿Cómo puedo pagar?", PAGO),
        ],
    },
    ("categoria", "ganadores-de-masa"): {
        "title": "Ganadores de masa (gainers) en Medellín | SUPGO",
        "meta": "Ganadores de masa en Medellín de 3 a 13 libras: Mass Gainer, Serious Mass, Mass Evolution y más. Compara calorías, proteína y precio. Envíos a Colombia.",
        "h1": "Ganadores de masa",
        "intro": "Mezclas en polvo de proteína y carbohidratos (gainers) en envases de 3 a 13 libras.",
        "secciones": [
            ("Qué es un ganador de masa", "<p>Es un polvo para preparar que combina proteína, carbohidratos y, en algunos casos, grasas, vitaminas y minerales. Por eso su porción declara más calorías que una proteína en polvo. La proporción entre proteína y carbohidratos cambia bastante entre marcas.</p>"),
            ("Cómo comparar", "<ul><li><strong>Calorías, proteína y carbohidratos por servicio</strong>, según la tabla nutricional.</li><li><strong>Tamaño del servicio</strong>: algunos se preparan con varias medidas.</li><li><strong>Servicios por envase y precio por servicio</strong>.</li><li><strong>Sabor</strong> y tamaño: 3, 6, 10, 12 o 13 libras.</li></ul><p>Más información en la guía <a href=\"/guias/ganadores-masa-colombia.html\">Ganadores de masa en Colombia</a>.</p>"),
        ],
        "faq": [
            ("¿En qué se diferencia de una proteína en polvo?", "Un ganador de masa declara más carbohidratos y calorías por servicio que una proteína whey o ISO, cuya base es casi solo proteína. Compara las tablas nutricionales."),
            ("¿Por qué los envases son tan grandes?", "Porque cada servicio pesa más (a menudo de 100 a 330 g). Revisa cuántos servicios trae el envase."),
            ("¿Cuánto tarda el envío?", ENVIO),
            ("¿Cómo puedo pagar?", PAGO),
        ],
    },
    ("categoria", "eaa"): {
        "title": "EAA (aminoácidos esenciales) en Medellín | SUPGO",
        "meta": "EAA en polvo en Medellín: aminoácidos esenciales de Nutricost, MuscleTech, ProScience y más. Compara gramos por servicio, sabores y precio.",
        "h1": "EAA – aminoácidos esenciales",
        "intro": "Aminoácidos esenciales en polvo de varias marcas, en envases de unos 30 servicios y distintos sabores.",
        "secciones": [
            ("Qué son los EAA", "<p>EAA son las siglas en inglés de <em>essential amino acids</em>: los nueve aminoácidos que la etiqueta clasifica como esenciales (entre ellos leucina, isoleucina y valina, los tres BCAA). Algunas fórmulas agregan electrolitos u otros ingredientes.</p>"),
            ("Cómo comparar", "<ul><li><strong>Gramos de EAA por servicio</strong> y cuánto corresponde a cada aminoácido.</li><li><strong>Ingredientes adicionales</strong>, como electrolitos o cafeína.</li><li><strong>Servicios y sabor</strong>.</li></ul>"),
        ],
        "faq": [
            ("¿Cuál es la diferencia entre EAA y BCAA?", "Los BCAA son tres aminoácidos (leucina, isoleucina y valina). Los EAA incluyen esos tres y los otros seis aminoácidos esenciales. La etiqueta indica la cantidad de cada uno."),
            ("¿Cuánto tarda el envío?", ENVIO),
            ("¿Cómo puedo pagar?", PAGO),
        ],
    },
    ("categoria", "bcaa"): {
        "title": "BCAA en Medellín: Amino X, Amino Build y más | SUPGO",
        "meta": "BCAA en polvo en Medellín: Amino X, Amino Build y más marcas. Compara proporción 2:1:1, gramos por servicio, sabores y precio. Envíos a Colombia.",
        "h1": "BCAA – aminoácidos de cadena ramificada",
        "intro": "BCAA en polvo de varias marcas, en envases de 30 a 70 servicios y sabores frutales.",
        "secciones": [
            ("Qué son los BCAA", "<p>BCAA son las siglas en inglés de <em>branched-chain amino acids</em>: leucina, isoleucina y valina. Las etiquetas suelen expresar la proporción entre ellos, por ejemplo 2:1:1 (dos partes de leucina por una de cada uno de los otros dos).</p>"),
            ("Cómo comparar", "<ul><li><strong>Gramos de BCAA por servicio</strong> y <strong>proporción</strong> declarada.</li><li><strong>Ingredientes adicionales</strong> como electrolitos.</li><li><strong>Servicios por envase</strong> (30, 40 o 70) y <strong>sabor</strong>.</li></ul>"),
        ],
        "faq": [
            ("¿Qué significa 2:1:1?", "Es la proporción de leucina, isoleucina y valina en el producto: dos partes de leucina por una de isoleucina y una de valina."),
            ("¿Cuánto tarda el envío?", ENVIO),
            ("¿Cómo puedo pagar?", PAGO),
        ],
    },
    ("categoria", "colageno"): {
        "title": "Colágeno hidrolizado en Medellín y Colombia | SUPGO",
        "meta": "Colágeno hidrolizado en polvo, cápsulas y sobres en Medellín, de más de 10 marcas. Compara gramos por servicio, sabores y precio. Envíos a Colombia.",
        "h1": "Colágeno",
        "intro": "Colágeno hidrolizado en polvo, cápsulas y sobres de más de 10 marcas.",
        "secciones": [
            ("Qué encontrarás aquí", "<p>Colágeno hidrolizado (péptidos de colágeno) solo o combinado con otros ingredientes como vitamina C, ácido hialurónico o biotina, según la fórmula. Hay versiones sin sabor para mezclar con cualquier bebida y versiones saborizadas.</p>"),
            ("Cómo comparar", "<ul><li><strong>Gramos de colágeno por servicio</strong> y fuente declarada (bovino, marino u otra).</li><li><strong>Ingredientes adicionales</strong>.</li><li><strong>Formato</strong>: polvo, cápsulas o sobres individuales.</li><li><strong>Servicios y precio por servicio</strong>.</li></ul><p>Consulta también la guía <a href=\"/guias/colageno-medellin.html\">Colágeno en Medellín</a>.</p>"),
        ],
        "faq": [
            ("¿Qué significa hidrolizado?", "Que el colágeno pasó por un proceso que lo divide en fragmentos más pequeños (péptidos), lo que facilita que se disuelva en líquidos."),
            ("¿Cuánto tarda el envío?", ENVIO),
            ("¿Cómo puedo pagar?", PAGO),
        ],
    },

    # ───────────────────────────── Marcas ─────────────────────────────
    ("laboratorio", "nutramerican-pharma"): {
        "title": "Nutramerican Pharma en Medellín: Bi-Pro y más | SUPGO",
        "meta": "Nutramerican Pharma en Medellín: Bi-Pro, Megaplex, creatinas, pre entrenos y más. Compara presentaciones, sabores y precios. Envíos a toda Colombia.",
        "h1": "Suplementos Nutramerican Pharma en Medellín",
        "intro": "Marca colombiana con líneas como Bi-Pro y Megaplex. Aquí encuentras sus proteínas, ganadores de masa, creatinas, pre entrenos y más.",
        "secciones": [
            ("Líneas de Nutramerican Pharma", "<p>La línea más conocida de la marca es <strong>Bi-Pro</strong>, con versiones como Classic, Complex, Lite y Ripped en distintos tamaños y sabores. También tiene ganadores de masa, creatinas, pre entrenos, colágeno, electrolitos y productos listos para consumir. Cada ficha muestra la presentación y los sabores publicados.</p>"),
            ("Cómo elegir dentro de la marca", "<ul><li>Compara la <strong>proteína por servicio</strong> entre las versiones de Bi-Pro.</li><li>Revisa el <strong>tamaño</strong> (de 0,9 a 3 libras o más) y el <strong>precio por servicio</strong>.</li><li>Elige el <strong>sabor</strong>: vainilla, chocolate, cookies &amp; cream y natural, según disponibilidad.</li></ul>"),
            ("Encuentra lo que buscas", "<p>Explora <a href=\"/categorias/proteinas-whey/\">proteínas whey</a>, <a href=\"/categorias/proteinas-iso/\">proteínas ISO</a>, <a href=\"/categorias/creatinas/\">creatinas</a> u <a href=\"/laboratorios/\">otras marcas</a>, o usa el <a href=\"/buscar/\">buscador</a>.</p>"),
        ],
        "faq": [
            ("¿Qué productos de Nutramerican Pharma tienen?", "Proteínas Bi-Pro, ganadores de masa, creatinas, pre entrenos, colágeno, electrolitos y snacks. La lista de abajo muestra las referencias publicadas; la disponibilidad se confirma al hacer el pedido."),
            ("¿Cuánto tarda el envío?", ENVIO),
            ("¿Cómo puedo pagar?", PAGO),
        ],
    },
    ("laboratorio", "proscience"): {
        "title": "ProScience en Medellín: Best Protein y más | SUPGO",
        "meta": "ProScience en Medellín: Best Protein, Best Vegan, Army EAA's, pre entrenos, vitaminas y más. Compara presentaciones, sabores y precios. Envíos a Colombia.",
        "h1": "Suplementos ProScience en Medellín",
        "intro": "Proteínas Best Protein y Best Vegan, aminoácidos Army EAA's, pre entrenos, creatinas, vitaminas y más de ProScience.",
        "secciones": [
            ("Líneas de ProScience", "<p>La marca tiene proteínas de suero (<strong>Best Protein</strong>) y vegetales (<strong>Best Vegan</strong>) en envases de 1 a 4 libras, aminoácidos <strong>Army EAA's</strong> en varios sabores, pre entrenos, creatinas, electrolitos, ganadores de masa, omega 3, multivitamínicos y snacks.</p>"),
            ("Cómo elegir dentro de la marca", "<ul><li>Para proteínas, compara <strong>fuente</strong> (suero o vegetal), <strong>proteína por servicio</strong> y tamaño.</li><li>Para aminoácidos y pre entrenos, revisa <strong>gramos por servicio</strong>, cafeína si aplica y sabor.</li><li>Calcula el <strong>precio por servicio</strong> para comparar tamaños.</li></ul>"),
            ("Encuentra lo que buscas", "<p>Explora <a href=\"/categorias/proteinas-whey/\">proteínas whey</a>, <a href=\"/categorias/eaa/\">EAA</a>, <a href=\"/categorias/pre-entrenos/\">pre entrenos</a> u <a href=\"/laboratorios/\">otras marcas</a>.</p>"),
        ],
        "faq": [
            ("¿ProScience tiene proteína vegana?", "Sí, la línea Best Vegan, en presentación de 2 libras y sabores como chocolate y vainilla, según disponibilidad."),
            ("¿Cuánto tarda el envío?", ENVIO),
            ("¿Cómo puedo pagar?", PAGO),
        ],
    },
    ("laboratorio", "nutricost"): {
        "title": "Nutricost en Colombia: vitaminas, creatina y más | SUPGO",
        "meta": "Nutricost en Medellín: más de 100 referencias en cápsulas y polvo — creatina, magnesio, vitaminas, aminoácidos y más. Envíos a toda Colombia.",
        "h1": "Suplementos Nutricost en Medellín",
        "intro": "Marca estadounidense con más de 100 referencias en cápsulas, tabletas y polvo: creatina, minerales, vitaminas, aminoácidos y extractos de plantas.",
        "secciones": [
            ("Qué encontrarás de Nutricost", "<p>Nutricost tiene uno de los catálogos más amplios de la tienda: creatina, magnesio en varias formas, vitaminas individuales y multivitamínicos, aminoácidos como glutamina, beta-alanina o citrulina, colágeno, probióticos y extractos como ashwagandha o cúrcuma. La mayoría vienen en cápsulas con muchos servicios por frasco.</p>"),
            ("Cómo comparar", "<ul><li><strong>Miligramos por cápsula</strong> o gramos por servicio, según la etiqueta.</li><li><strong>Número de cápsulas y servicios</strong> del frasco.</li><li><strong>Forma del ingrediente</strong> (por ejemplo, el tipo de magnesio) declarada en el rótulo.</li></ul>"),
            ("Encuentra lo que buscas", "<p>Usa el <a href=\"/buscar/\">buscador</a> con el nombre del ingrediente o explora <a href=\"/categorias/magnesio/\">magnesio</a>, <a href=\"/categorias/creatinas/\">creatinas</a> y <a href=\"/categorias/vitaminas/\">vitaminas</a>.</p>"),
        ],
        "faq": [
            ("¿Cómo encuentro un ingrediente específico de Nutricost?", "Escribe el nombre del ingrediente en el buscador o usa Ctrl+F en esta página: la lista de abajo incluye todas las referencias publicadas de la marca."),
            ("¿Cuánto tarda el envío?", ENVIO),
            ("¿Cómo puedo pagar?", PAGO),
        ],
    },
    ("laboratorio", "dymatize"): {
        "title": "Dymatize en Medellín: ISO 100 y Elite Whey | SUPGO",
        "meta": "Dymatize en Medellín: ISO 100, Elite Whey, creatina y Super Mass Gainer. Compara tamaños, sabores y precios. Envíos a toda Colombia.",
        "h1": "Suplementos Dymatize en Medellín",
        "intro": "Marca estadounidense conocida por su proteína ISO 100. También tiene Elite Whey, creatina y ganadores de masa.",
        "secciones": [
            ("Líneas de Dymatize", "<ul><li><strong>ISO 100</strong>: proteína de suero aislado hidrolizado y aislado, en 1,3, 3 y 5 libras y muchos sabores.</li><li><strong>Elite Whey</strong>: mezcla de proteínas de suero, en 2 y 5 libras.</li><li><strong>Creatina</strong> monohidratada, incluida la versión con sello Creapure®.</li><li><strong>Super Mass Gainer</strong> en 6 y 12 libras, y bebidas listas.</li></ul>"),
            ("Cómo elegir", "<p>Compara el tipo de proteína declarado, la proteína por servicio, el tamaño y el sabor. Si dudas entre ISO 100 y otra proteína aislada muy pedida, revisa la guía <a href=\"/guias/iso-100-vs-gold-standard.html\">ISO 100 vs Gold Standard</a> y la página de <a href=\"/guias/proteina-iso100-medellin.html\">ISO 100 en Medellín</a>.</p>"),
        ],
        "faq": [
            ("¿Qué tamaños de ISO 100 tienen?", "ISO 100 se publica en 1,3, 3 y 5 libras; los sabores disponibles aparecen en cada ficha."),
            ("¿Cuánto tarda el envío?", ENVIO),
            ("¿Cómo puedo pagar?", PAGO),
        ],
    },
    ("laboratorio", "smart-nutrition"): {
        "title": "Smart Nutrition en Medellín: Mass Evolution y más | SUPGO",
        "meta": "Smart Nutrition en Medellín: Mass Evolution, CRE4, Nitrox, Pump Nox y más. Compara presentaciones, sabores y precios. Envíos a toda Colombia.",
        "h1": "Suplementos Smart Nutrition en Medellín",
        "intro": "Ganadores de masa Mass Evolution, creatinas CRE4, pre entrenos Nitrox y Pump Nox, proteínas y más de Smart Nutrition.",
        "secciones": [
            ("Líneas de Smart Nutrition", "<ul><li><strong>Mass Evolution</strong>: ganador de masa en 2, 4, 7 y 10 libras.</li><li><strong>CRE4</strong> y otras creatinas.</li><li>Pre entrenos <strong>Nitrox</strong>, <strong>Nitrox Ignite</strong> y <strong>Pump Nox Edge</strong>.</li><li>Beta-alanina, electrolitos GL Smart y productos de la categoría quemadores.</li></ul>"),
            ("Cómo elegir", "<p>Compara el contenido por servicio, el número de servicios y el sabor. Para ganadores de masa, revisa calorías, proteína y carbohidratos en la tabla nutricional.</p>"),
        ],
        "faq": [
            ("¿Qué tamaños tiene Mass Evolution?", "Se publica en 2, 4, 7 y 10 libras; los sabores disponibles aparecen en cada ficha."),
            ("¿Cuánto tarda el envío?", ENVIO),
            ("¿Cómo puedo pagar?", PAGO),
        ],
    },
    ("laboratorio", "muscletech"): {
        "title": "MuscleTech en Medellín: Creatina Platinum y más | SUPGO",
        "meta": "MuscleTech en Medellín: Creatina Platinum, Cell Tech, Nitro-Tech, Amino Build y más. Compara presentaciones, sabores y precios. Envíos a Colombia.",
        "h1": "Suplementos MuscleTech en Medellín",
        "intro": "Creatinas Platinum y Cell Tech, proteínas, aminoácidos Amino Build, pre entrenos y más de MuscleTech.",
        "secciones": [
            ("Líneas de MuscleTech", "<ul><li><strong>Creatina Platinum</strong> en polvo y cápsulas, y <strong>Creatina Chews</strong> masticables.</li><li><strong>Cell Tech</strong>: fórmula de creatina con carbohidratos, en 3 y 6 libras.</li><li><strong>Nitro-Tech</strong>: proteína en 2, 4 y 5 libras (incluida la versión Whey Gold).</li><li><strong>Amino Build</strong>, Amino 100% EAA y glutamina Platinum.</li><li>Pre entrenos y productos de la categoría quemadores.</li></ul>"),
            ("Cómo elegir", "<p>Compara formato (polvo, cápsulas o masticables), gramos por servicio y número de servicios. Más sobre creatinas en <a href=\"/guias/que-creatina-comprar-colombia.html\">Qué creatina comprar en Colombia</a>.</p>"),
        ],
        "faq": [
            ("¿Qué formatos de creatina tiene MuscleTech?", "Polvo (Creatina Platinum), cápsulas, tabletas masticables (Creatina Chews) y fórmulas con carbohidratos como Cell Tech."),
            ("¿Cuánto tarda el envío?", ENVIO),
            ("¿Cómo puedo pagar?", PAGO),
        ],
    },
    ("laboratorio", "bsn"): {
        "title": "BSN en Medellín: Syntha-6, Amino X y NO-Xplode | SUPGO",
        "meta": "BSN en Medellín: proteína Syntha-6, Amino X y NO-Xplode. Compara tamaños, servicios, sabores y precios. Envíos a toda Colombia.",
        "h1": "Suplementos BSN en Medellín",
        "intro": "Proteína Syntha-6, aminoácidos Amino X, pre entreno NO-Xplode y barras de BSN.",
        "secciones": [
            ("Líneas de BSN", "<ul><li><strong>Syntha-6</strong>: mezcla de varias fuentes de proteína, en 5 y 10 libras.</li><li><strong>Amino X</strong>: aminoácidos en polvo, en 30 y 70 servicios.</li><li><strong>NO-Xplode</strong>: pre entreno en 30 y 60 servicios.</li><li>Barras Protein Crisp.</li></ul>"),
            ("Cómo elegir", "<p>Revisa las fuentes de proteína declaradas en Syntha-6, los gramos por servicio de Amino X y la cafeína por servicio de NO-Xplode, además del sabor y el número de servicios.</p>"),
        ],
        "faq": [
            ("¿Qué es Syntha-6?", "Es la proteína en polvo de BSN que combina varias fuentes de proteína (como suero y caseína) según su etiqueta. Se publica en 5 y 10 libras."),
            ("¿Cuánto tarda el envío?", ENVIO),
            ("¿Cómo puedo pagar?", PAGO),
        ],
    },
    ("laboratorio", "basic-supplements"): {
        "title": "Basic Supplements en Medellín: whey e isolate | SUPGO",
        "meta": "Basic Supplements en Medellín: Basic Whey, Basic Isolate, creatina, EAA, pre entreno y más, con sabores para elegir. Compara precios. Envíos a Colombia.",
        "h1": "Suplementos Basic Supplements en Medellín",
        "intro": "Basic Whey, Basic Isolate, Basic Mass Gainer, creatina, EAA, glutamina y pre entreno, con una variedad amplia de sabores.",
        "secciones": [
            ("Líneas de Basic Supplements", "<ul><li><strong>Basic Whey</strong> (2 lb) y <strong>Basic Isolate</strong> (5 lb), con sabores como chocolate, baklava, boston cream o peanut butter cookie.</li><li><strong>Basic Mass Gainer</strong> en 6 libras.</li><li>Creatina en 300 g y 1 kg, EAA, glutamina, electrolitos y pre entreno.</li></ul>"),
            ("Cómo elegir", "<p>Compara el tipo de proteína (concentrado o aislado), la proteína por servicio, el tamaño y el sabor. Calcula el precio por servicio para elegir entre envases.</p>"),
        ],
        "faq": [
            ("¿Qué sabores tiene Basic Whey?", "La marca maneja muchos sabores; los publicados aparecen en la lista de abajo y en cada ficha."),
            ("¿Cuánto tarda el envío?", ENVIO),
            ("¿Cómo puedo pagar?", PAGO),
        ],
    },
    ("laboratorio", "optimum-nutrition"): {
        "title": "Optimum Nutrition en Medellín: Gold Standard | SUPGO",
        "meta": "Optimum Nutrition en Medellín: 100% Whey Gold Standard, Gold Standard Isolate, Serious Mass y creatina. Compara tamaños, sabores y precios.",
        "h1": "Suplementos Optimum Nutrition en Medellín",
        "intro": "Marca estadounidense de la línea Gold Standard: 100% Whey, Gold Standard Isolate, Serious Mass, creatina y más.",
        "secciones": [
            ("Líneas de Optimum Nutrition", "<ul><li><strong>100% Whey Gold Standard</strong>: mezcla de proteínas de suero, en 2, 4, 5 y 10 libras y muchos sabores.</li><li><strong>Gold Standard 100% Isolate</strong>: proteína de suero aislado, en 3 y 5 libras.</li><li><strong>Serious Mass</strong>: ganador de masa en 3, 6 y 12 libras.</li><li>Creatina micronizada (300 g a 1,2 kg), Amino Energy y multivitamínicos Opti-Men y Opti-Women.</li></ul>"),
            ("Cómo elegir", "<p>Compara el tipo de proteína, la proteína por servicio, el tamaño y el sabor. Si dudas entre Gold Standard y otra proteína muy pedida, revisa <a href=\"/guias/iso-100-vs-gold-standard.html\">ISO 100 vs Gold Standard</a>.</p>"),
        ],
        "faq": [
            ("¿Qué diferencia hay entre Gold Standard Whey e Isolate?", "100% Whey Gold Standard es una mezcla en la que el aislado es el primer ingrediente; Gold Standard 100% Isolate declara solo proteína de suero aislado. Compara sus tablas nutricionales en cada ficha."),
            ("¿Cuánto tarda el envío?", ENVIO),
            ("¿Cómo puedo pagar?", PAGO),
        ],
    },
}

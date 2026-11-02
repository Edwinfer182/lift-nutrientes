#!/usr/bin/env python3
"""SUPGO · Contenido SEO automático para fichas con descripción delgada.

Lo usa scripts/generar_paginas_seo.py. Reglas:
  - Solo reemplaza textos genéricos ("Encuentra X en Supgo...") o vacíos.
    Las descripciones escritas a mano (largas) se respetan.
  - Sin afirmaciones de salud ni de resultados (fuerza, energía, rendimiento,
    pérdida de peso, recuperación, etc.). Solo datos verificables del catálogo
    y orientación de compra: qué revisar en la etiqueta y cómo comparar.
  - Enlaces internos reales: otros sabores, más productos de la marca,
    alternativas de la categoría, página de la marca y de la categoría.
"""
import hashlib
import html
import re
import unicodedata

# Cambiar esta versión obliga a reescribir las fichas con contenido automático.
CONTENIDO_VERSION = "c1-20261102"

# Palabras que el texto automático nunca debe usar (se verifica en las pruebas).
PALABRAS_PROHIBIDAS = (
    "fuerza", "energía", "energia", "rendimiento", "resistencia", "potencia", "quema", "quemar",
    "adelgaz", "pérdida de peso", "perdida de peso", "bajar de peso", "masa muscular", "músculo",
    "musculo", "muscular", "recuperación", "recuperacion", "testosterona", "beneficio", "cura",
    "previene", "prevenir", "tratamiento", "mejora", "mejorar", "aumenta", "aumentar", "garantiza",
    "definición", "definicion", "anabólic", "anabolic", "inmun", "milagro",
)

LEYENDA_SUPLEMENTO = ("Este producto es un suplemento dietario, no es un medicamento y no suple una "
                      "alimentación equilibrada. Sigue las indicaciones de uso del fabricante y, si tienes "
                      "una condición de salud, estás en embarazo o lactancia o tomas medicamentos, consulta "
                      "a un profesional antes de consumirlo.")


def slug(value):
    value = unicodedata.normalize("NFKD", str(value or "")).encode("ascii", "ignore").decode().lower()
    return re.sub(r"(^-|-$)", "", re.sub(r"[^a-z0-9]+", "-", value))[:110]


def esc(value):
    return html.escape(str(value or ""), quote=True)


def plain(value):
    return re.sub(r"\s+", " ", html.unescape(re.sub(r"<[^>]*>", " ", str(value or "")))).strip()


def es_delgada(texto_html, nombre=""):
    """True si la descripción es la plantilla genérica, está vacía o es muy corta."""
    texto = plain(texto_html)
    if not texto:
        return True
    if re.search(r"Encuentra .{3,200}? en Supgo\.", texto, re.I):
        return True
    # Plantilla genérica anterior ("La ficha corresponde específicamente a ..."), sin datos propios.
    if "La ficha corresponde específicamente a" in texto:
        return True
    if "Revisa la presentación, ingredientes e instrucciones del fabricante antes de comprar" in texto and len(texto.split()) < 150:
        return True
    return len(texto.split()) < 120


def titulo_no_corresponde(titulo, nombre):
    """Detecta títulos SEO copiados de otro producto (p. ej. Casein con título de Isolate)."""
    if not titulo or not nombre:
        return False
    # Primera palabra distintiva del nombre (sin cifras iniciales como "100%").
    palabras = [w for w in slug(nombre).split("-") if len(w) >= 3 and not re.search(r"\d", w)]
    if not palabras:
        return False
    return palabras[0] not in slug(titulo)


# --------------------------------------------------------------------------
# Datos de la presentación a partir del nombre del catálogo
# --------------------------------------------------------------------------
_PESO = re.compile(r"(\d+(?:[.,]\d+)?)\s*(lbs?|libras?|kg|kilos?|grm|gramos?|grs?|g|oz)\b", re.I)
_PORCIONES = re.compile(r"(\d+)\s*(servicios|servings?|serv|srv|ser|porciones?)\b", re.I)
_UNIDADES = re.compile(r"(\d+)\s*(c[aá]psulas?|capsules?|caps?|cap|tabletas?|tablets?|tabs?|softgels?|gomitas?|gummies|sachets?|sobres?|unidades?|und|veg\s*caps)\b", re.I)
_DOSIS = re.compile(r"(\d+(?:[.,]\d+)?)\s*(mg|mcg|ui|iu)\b", re.I)

_UNIDAD_NOMBRE = {
    "lb": "lb", "lbs": "lb", "libra": "lb", "libras": "lb", "kg": "kg", "kilo": "kg", "kilos": "kg",
    "g": "g", "gr": "g", "grs": "g", "grm": "g", "gramo": "g", "gramos": "g", "oz": "oz",
}


def datos_presentacion(nombre, presentacion=""):
    texto = f"{nombre} {presentacion or ''}"
    datos = {}
    m = _PESO.search(texto)
    if m:
        datos["contenido"] = f"{m.group(1).replace('.', ',')} {_UNIDAD_NOMBRE.get(m.group(2).lower(), m.group(2).lower())}"
    m = _PORCIONES.search(texto)
    if m:
        datos["porciones"] = m.group(1)
    m = _UNIDADES.search(texto)
    if m:
        tipo = m.group(2).lower()
        if tipo.startswith(("c", "veg")):
            tipo = "cápsulas"
        elif tipo.startswith("t"):
            tipo = "tabletas"
        elif tipo.startswith("soft"):
            tipo = "cápsulas blandas"
        elif tipo.startswith(("gom", "gum")):
            tipo = "gomitas"
        elif tipo.startswith(("sach", "sob")):
            tipo = "sobres"
        else:
            tipo = "unidades"
        datos["unidades"] = f"{m.group(1)} {tipo}"
    m = _DOSIS.search(texto)
    if m:
        datos["dosis"] = f"{m.group(1)} {m.group(2).lower().replace('iu', 'UI').replace('ui', 'UI')}"
    return datos


# --------------------------------------------------------------------------
# Texto por tipo de producto (orientación de compra, sin promesas)
# --------------------------------------------------------------------------
GRUPOS = {
    "proteina": ("proteinas-whey", "proteinas-iso", "proteinas", "proteinas-de-carne", "proteinas-veganas", "proteinas-de-otras-fuentes"),
    "creatina": ("creatinas",),
    "preentreno": ("pre-entrenos", "cafeina"),
    "ganador": ("ganadores-de-masa",),
    "snack": ("snacks-y-bebidas",),
    "amino": ("aminoacidos-y-recuperacion", "bcaa", "eaa", "glutamina", "aminoacidos"),
    "hidratacion": ("hidratacion-y-electrolitos",),
    "termogenico": ("quemadores", "l-carnitina"),
    "accesorio": ("accesorios", "obsequios"),
}


def grupo_de(categoria):
    c = slug(categoria)
    for grupo, slugs in GRUPOS.items():
        if c in slugs:
            return grupo
    return "capsulas"


INTRO = {
    "proteina": (
        "{nombre} es una proteína en polvo de {marca} que puedes comprar en SUPGO.",
        "En esta ficha encuentras {nombre}, una proteína en polvo de {marca} disponible en SUPGO.",
    ),
    "creatina": (
        "{nombre} es una creatina de {marca} que puedes comprar en SUPGO.",
        "En esta ficha encuentras {nombre}, una referencia de creatina de {marca} disponible en SUPGO.",
    ),
    "preentreno": (
        "{nombre} es un preentreno de {marca} que puedes comprar en SUPGO.",
        "En esta ficha encuentras {nombre}, una fórmula preentreno de {marca} disponible en SUPGO.",
    ),
    "ganador": (
        "{nombre} es un ganador de peso en polvo de {marca} que puedes comprar en SUPGO.",
        "En esta ficha encuentras {nombre}, una fórmula en polvo de {marca} que combina carbohidratos y proteína, disponible en SUPGO.",
    ),
    "snack": (
        "{nombre} es un producto de {marca} de la sección de snacks y bebidas de SUPGO.",
        "En esta ficha encuentras {nombre}, de {marca}, en la sección de snacks y bebidas de SUPGO.",
    ),
    "amino": (
        "{nombre} es un suplemento de aminoácidos de {marca} que puedes comprar en SUPGO.",
        "En esta ficha encuentras {nombre}, una fórmula de aminoácidos de {marca} disponible en SUPGO.",
    ),
    "hidratacion": (
        "{nombre} es una bebida en polvo con electrolitos de {marca} que puedes comprar en SUPGO.",
        "En esta ficha encuentras {nombre}, una fórmula con electrolitos de {marca} disponible en SUPGO.",
    ),
    "termogenico": (
        "{nombre} es un suplemento de {marca} de la categoría {categoria} de SUPGO.",
        "En esta ficha encuentras {nombre}, de {marca}, dentro de la categoría {categoria} de SUPGO.",
    ),
    "accesorio": (
        "{nombre} es un accesorio de {marca} que puedes comprar en SUPGO.",
        "En esta ficha encuentras {nombre}, de {marca}, disponible en SUPGO.",
    ),
    "capsulas": (
        "{nombre} es un suplemento de {marca} de la categoría {categoria} que puedes comprar en SUPGO.",
        "En esta ficha encuentras {nombre}, de {marca}, dentro de la categoría {categoria} de SUPGO.",
    ),
}

REVISAR = {
    "proteina": [
        "La cantidad de proteína por porción y el tamaño de la porción que declara la etiqueta.",
        "El tipo de proteína (concentrado, aislado, hidrolizado, de carne o vegetal) y la lista de ingredientes.",
        "Alérgenos como leche, soya o gluten, y los endulzantes que contiene.",
        "El número de porciones del envase, para comparar el precio por porción entre tamaños.",
    ],
    "creatina": [
        "La forma de creatina (por ejemplo, monohidrato) y los gramos por porción indicados en la etiqueta.",
        "Si es sin sabor o saborizada, y si incluye otros ingredientes además de creatina.",
        "El número de porciones del envase, para comparar el precio por porción entre presentaciones.",
    ],
    "preentreno": [
        "La cantidad de cafeína y de otros estimulantes por porción que declara la etiqueta.",
        "La porción recomendada por el fabricante y el número de porciones del envase.",
        "La lista completa de ingredientes, sobre todo si eres sensible a la cafeína.",
    ],
    "ganador": [
        "Las calorías, los carbohidratos y la proteína por porción, y el tamaño de la porción.",
        "La lista de ingredientes y alérgenos como leche, soya o gluten.",
        "El número de porciones del envase, para comparar el precio por porción.",
    ],
    "snack": [
        "El contenido neto, el número de unidades y la información nutricional de la etiqueta.",
        "Alérgenos e ingredientes, y la fecha de vencimiento al recibir el producto.",
    ],
    "amino": [
        "Qué aminoácidos contiene y en qué cantidad por porción, según la etiqueta.",
        "Si es en polvo o en cápsulas, el sabor y los endulzantes que usa.",
        "El número de porciones del envase, para comparar el precio por porción.",
    ],
    "hidratacion": [
        "El contenido de sodio, potasio y otros minerales por porción que declara la etiqueta.",
        "Si contiene azúcar, endulzantes o cafeína, y el sabor.",
        "El número de porciones del envase.",
    ],
    "termogenico": [
        "La lista de ingredientes y la cantidad de cada uno por porción, incluida la cafeína si la contiene.",
        "La porción recomendada por el fabricante y las advertencias de la etiqueta.",
        "Si tienes una condición de salud o tomas medicamentos, consulta a un profesional antes de usarlo.",
    ],
    "accesorio": [
        "Las medidas, la capacidad o la talla, según corresponda.",
        "El material y las indicaciones de cuidado del fabricante.",
    ],
    "capsulas": [
        "Los ingredientes y la cantidad de cada uno por porción que declara la etiqueta.",
        "El número de cápsulas o tabletas por porción y cuántas porciones trae el envase.",
        "La forma del ingrediente principal y los excipientes o alérgenos que contiene.",
    ],
}

CIERRE = (
    "Los precios y la disponibilidad se actualizan en el catálogo. Despachamos desde Medellín, con envíos al área metropolitana (Envigado, Itagüí, Bello, Sabaneta) y a ciudades como Bogotá, Cali, Barranquilla y Bucaramanga.",
    "El precio que ves en esta ficha es el vigente en el catálogo. Hacemos envíos desde Medellín a toda Colombia, incluidas Bogotá, Cali, Barranquilla, Cartagena y Bucaramanga.",
    "Compra en línea o escríbenos por WhatsApp para confirmar la presentación. Despachamos desde Medellín al área metropolitana y al resto de Colombia.",
)


def _elegir(opciones, clave):
    n = int(hashlib.sha256(str(clave).encode()).hexdigest(), 16)
    return opciones[n % len(opciones)]


def _lista_enlaces(items):
    return "<ul>" + "".join(f'<li><a href="{esc(i["url"])}">{esc(i["name"])}</a></li>' for i in items) + "</ul>"


def descripcion_html(*, pid, nombre, marca, categoria, sabor, presentacion, variantes, mas_marca,
                     alternativas, url_marca, url_categoria):
    """Descripción completa en HTML. Las listas de enlaces son dicts {name,url}."""
    grupo = grupo_de(categoria)
    marca_txt = marca or "su fabricante"
    cat_txt = categoria or "suplementos"
    partes = []
    intro = _elegir(INTRO[grupo], pid).format(nombre=esc(nombre), marca=esc(marca_txt), categoria=esc(cat_txt.lower()))
    partes.append(f"<h2>{esc(nombre)}</h2><p>{intro} Aquí puedes consultar el precio vigente, las presentaciones y los sabores disponibles antes de hacer tu pedido.</p>")

    datos = datos_presentacion(nombre, presentacion)
    filas = []
    if marca:
        filas.append(("Marca", f'<a href="{esc(url_marca)}">{esc(marca)}</a>' if url_marca else esc(marca)))
    if categoria:
        filas.append(("Categoría", f'<a href="{esc(url_categoria)}">{esc(categoria)}</a>' if url_categoria else esc(categoria)))
    if presentacion and str(presentacion).strip():
        filas.append(("Presentación", esc(str(presentacion).strip())))
    elif datos.get("contenido"):
        filas.append(("Contenido", esc(datos["contenido"])))
    if datos.get("porciones"):
        filas.append(("Porciones", esc(datos["porciones"]) + " (según el nombre de la presentación)"))
    if datos.get("unidades"):
        filas.append(("Unidades", esc(datos["unidades"])))
    if sabor and slug(sabor) != slug(nombre):
        filas.append(("Sabor", esc(sabor)))
    if filas:
        partes.append("<h3>Datos de esta presentación</h3><ul>" + "".join(f"<li><strong>{k}:</strong> {v}</li>" for k, v in filas) + "</ul>")

    partes.append("<h3>Qué revisar antes de comprar</h3><ul>" + "".join(f"<li>{esc(x)}</li>" for x in REVISAR[grupo]) + "</ul>")

    otros = [v for v in variantes if str(v.get("id")) != str(pid)]
    if otros:
        partes.append("<h3>Otros sabores de esta presentación</h3>" + _lista_enlaces(otros[:8]))
    if mas_marca:
        cola = f' <a href="{esc(url_marca)}">Ver todos los productos {esc(marca)}</a>.' if url_marca else ""
        partes.append(f"<h3>Más productos {esc(marca)}</h3>" + _lista_enlaces(mas_marca[:4]) + (f"<p>{cola.strip()}</p>" if cola else ""))
    if alternativas:
        cola = f'<p><a href="{esc(url_categoria)}">Ver toda la categoría {esc(categoria)}</a>.</p>' if url_categoria else ""
        partes.append(f"<h3>Otras opciones en {esc(cat_txt)}</h3>" + _lista_enlaces(alternativas[:4]) + cola)

    partes.append("<h3>Compra en Medellín y envíos a Colombia</h3><p>" + esc(_elegir(CIERRE, f"{pid}-cierre")) + "</p>")
    if grupo not in ("accesorio", "snack"):
        partes.append(f'<p class="seo-leyenda"><small>{esc(LEYENDA_SUPLEMENTO)}</small></p>')
    return f'<div class="seo-auto" data-contenido="{CONTENIDO_VERSION}">' + "".join(partes) + "</div>"


def titulo_seo(nombre, marca, sabor=""):
    """Título de hasta ~65 caracteres con la marca cuando no está en el nombre."""
    base = nombre.strip()
    if marca and slug(marca) not in slug(base):
        con_marca = f"{base} {marca.strip()}"
        if len(con_marca) + 8 <= 65:
            base = con_marca
    titulo = f"{base} | SUPGO"
    if len(titulo) > 70:
        titulo = base[:62].rstrip(" -|·") + " | SUPGO"
    return titulo


def meta_descripcion(nombre, marca, sabor="", presentacion=""):
    etiqueta = nombre if not marca or slug(marca) in slug(nombre) else f"{nombre} de {marca}"
    extra = f" sabor {sabor}" if sabor and slug(sabor) not in slug(nombre) else ""
    for meta in (
        f"Compra {etiqueta}{extra} en SUPGO Medellín. Consulta precio, presentaciones y disponibilidad. Envíos a Bogotá, Cali y toda Colombia.",
        f"Compra {etiqueta}{extra} en SUPGO Medellín. Precio actualizado y envíos a toda Colombia.",
        f"Compra {etiqueta} en SUPGO. Envíos a toda Colombia.",
    ):
        if len(meta) <= 160:
            return meta
    return ("Compra " + etiqueta)[:120].rstrip() + " en SUPGO. Envíos a Colombia."


def contiene_prohibidas(texto_html, permitidos=()):
    """Devuelve las palabras prohibidas presentes en el texto propio (sin enlaces ni nombres)."""
    sin_enlaces = re.sub(r"(?is)<a\b[^>]*>.*?</a>", " ", texto_html)
    texto = plain(sin_enlaces).lower()
    for p in permitidos:
        if p:
            texto = texto.replace(str(p).lower(), " ")
    return sorted({w for w in PALABRAS_PROHIBIDAS if w in texto})


def seleccionar(candidatos, clave, n):
    """Selección estable pero distinta por ficha, para repartir enlaces en todo el catálogo."""
    return sorted(candidatos, key=lambda c: hashlib.sha256(f"{clave}-{c['id']}".encode()).hexdigest())[:n]

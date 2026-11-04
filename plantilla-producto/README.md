# Plantilla original de producto, conectada a Supabase

La plantilla HTML original con campos está en `plantilla.base.html`.
`plantilla.html` es una vista visual renderizada con datos reales del producto 117,
con estilos e imágenes incluidos para abrirla sin servidor; no ejecuta compras
ni consultas. El servidor sigue entregando la versión funcional y dinámica. El generador
`scripts/generar_paginas_seo.py::build` la lee y sustituye sus 40 marcadores
`@@SUPGO_N@@` por los valores calculados y escapados del producto.
Se conservó exactamente el HTML resultante, sin rediseño. `plantilla.py` prepara los datos del catálogo y `servidor.py` entrega
el HTML completo desde el servidor. No genera ni sobrescribe fichas en disco.

Desde la raíz:

```sh
python plantilla-producto/servidor.py --port 8004
```

Ruta: `/plantilla-producto/?id=901126` (ISO 100 Birthday cake Pebbles).
También acepta `?slug=creatina-iron-nutrition-500-g-100-serv`.

Conserva galería, zoom, sabores, cantidad, carrito, favoritos, medios de pago,
descripción, reseñas y relacionados del generador original. Las relaciones se
preparan con las mismas reglas del generador; caché de catálogo de 60 segundos.
Las canónicas y enlaces de variantes conservan sus destinos actuales. La ruta
experimental lleva noindex. No sustituye las páginas públicas de producción.
No enviar compras reales durante las pruebas.

El servidor usa únicamente consultas públicas de lectura de Supabase. La prueba
requiere Python 3.12. El sitio necesita un alojamiento que ejecute Python; una
vista previa estática o GitHub Pages no ejecutan este servidor.

## Vistas de prueba para GitHub Pages

`index.html` y `producto-117.html`, `producto-102.html`, `producto-901126.html`
son vistas generadas desde Supabase. Abrir `/plantilla-producto/?id=117`,
`?id=102` o `?id=901126`. Se regeneran ejecutando:

```sh
python plantilla-producto/generar_pruebas.py
```

Estas vistas son estáticas: no consultan Supabase en cada visita. La ruta
`/producto/?slug=...` agregada a main por otra implementación sí consulta desde
el navegador; se conserva intacta.

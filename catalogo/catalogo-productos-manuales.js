/* Productos agregados manualmente al Catálogo Lift.
   Se cargan después de los catálogos base para evitar editar archivos generados. */
(function () {
  const producto = {
    id: "muscletech-creatine-creapure-120-caps",
    name: "Creatina Creapure",
    presentation: "120 cápsulas",
    brand: "MuscleTech",
    category: "Creatina",
    price: 130000,
    image: ""
  };

  const listas = [
    window.PRODUCTS,
    window.products,
    window.catalogProducts,
    window.CATALOG_PRODUCTS
  ];

  const lista = listas.find(Array.isArray);
  if (!lista) return;

  const existe = lista.some((p) =>
    String(p.id || "") === producto.id ||
    (String(p.name || p.nombre || "").toLowerCase().includes("creatina creapure") &&
     String(p.brand || p.marca || "").toLowerCase().includes("muscletech"))
  );

  if (!existe) lista.push(producto);
})();
